import { execFile as execFileCallback } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import {
  assert,
  assertPublishableProvenance,
  assertSafePath,
  compareStrings,
  digestTree,
  isAllowedWritePattern,
  pathExists,
  readText,
  readYaml,
  resetDirectory,
  rootDir,
  sha256,
  validateReleaseName,
  validateSourceRevision,
  walk,
  writeStable,
} from "./lib.mjs";

const execFile = promisify(execFileCallback);
const checkOnly = process.argv.includes("--check");
const catalog = await readYaml(path.join(rootDir, "catalog.yaml"));
const catalogSchema = JSON.parse(
  await readText(path.join(rootDir, "contracts/v1/catalog.schema.json")),
);
const releaseSchema = JSON.parse(
  await readText(path.join(rootDir, "contracts/v1/release.schema.json")),
);
const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateCatalog = ajv.compile(catalogSchema);
const validateReleaseManifest = ajv.compile(releaseSchema);
assert(
  validateCatalog(catalog),
  `invalid catalog: ${(validateCatalog.errors ?? [])
    .map((entry) => `${entry.instancePath || "/"} ${entry.message}`)
    .join("; ")}`,
);

const releaseName = validateReleaseName(catalog.release);

const sourceRevision = validateSourceRevision(
  process.env.SOURCE_REVISION ?? "WORKTREE",
);

const rootFiles = [
  ".editorconfig",
  ".gitattributes",
  ".gitignore",
  ".node-version",
  "AGENTS.md",
  "CHANGELOG.md",
  "CLAUDE.md",
  "CONTRIBUTING.md",
  "DESIGN.md",
  "HARNESS.md",
  "LICENSE.md",
  "NOTICE.md",
  "OUTPUT-EXCEPTION.md",
  "README.md",
  "README.pt-BR.md",
  "REUSE.toml",
  "SECURITY.md",
  "catalog.yaml",
  "package.json",
  "pnpm-lock.yaml",
  "prompts/AGENTS.md",
  ".github/copilot-instructions.md",
  ".github/agents/prompt-reviewer.md",
  ".claude/agents/prompt-reviewer.md",
];

const sourceDirectories = [
  "LICENSES",
  "assets",
  "contracts",
  "profiles",
  "docs",
  "templates",
  "tests",
  "tools",
  ".agents",
  ".cursor/rules",
  ".github/workflows",
  "agents",
];

async function collectSources() {
  const sourceFiles = [];
  for (const relative of rootFiles) {
    const filePath = path.join(rootDir, relative);
    assert(await pathExists(filePath), `release source missing: ${relative}`);
    sourceFiles.push(filePath);
  }
  for (const relative of sourceDirectories) {
    const directory = path.join(rootDir, relative);
    assert(await pathExists(directory), `release source missing: ${relative}`);
    sourceFiles.push(...(await walk(directory)));
  }
  for (const workflow of catalog.workflows) {
    sourceFiles.push(
      path.join(rootDir, workflow.manifest),
      path.join(rootDir, `prompts/${workflow.slug}/PROMPT.md`),
    );
  }
  const canonicalSkillFiles = await walk(path.join(rootDir, ".agents/skills"));
  for (const sourcePath of canonicalSkillFiles) {
    const relative = path.relative(
      path.join(rootDir, ".agents/skills"),
      sourcePath,
    );
    sourceFiles.push(path.join(rootDir, ".claude/skills", relative));
  }
  return [...new Set(sourceFiles)].sort((left, right) =>
    compareStrings(path.relative(rootDir, left), path.relative(rootDir, right)),
  );
}

async function determinePublishability(sourceFiles) {
  if (sourceRevision === "WORKTREE") {
    return { publishable: false, sourceBytes: null };
  }

  let head;
  let status;
  let trackedOutput;
  try {
    ({ stdout: head } = await execFile("git", ["rev-parse", "HEAD"], {
      cwd: rootDir,
      encoding: "utf8",
    }));
    ({ stdout: status } = await execFile(
      "git",
      ["status", "--porcelain=v1", "--untracked-files=all"],
      { cwd: rootDir, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
    ));
    ({ stdout: trackedOutput } = await execFile("git", ["ls-files", "-z"], {
      cwd: rootDir,
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    }));
  } catch (error) {
    throw new Error(
      `publishable release requires an available Git checkout: ${error.message}`,
    );
  }

  const sourcePaths = sourceFiles.map((filePath) =>
    path.relative(rootDir, filePath).split(path.sep).join("/"),
  );
  const trackedPaths = trackedOutput.split("\0").filter(Boolean);
  assertPublishableProvenance({
    sourceRevision,
    headRevision: head.trim(),
    porcelainStatus: status,
    sourcePaths,
    trackedPaths,
  });

  const selectedPaths = new Set(sourcePaths);
  for (const trackedPath of trackedPaths) {
    if (
      sourceDirectories.some(
        (directory) =>
          trackedPath === directory || trackedPath.startsWith(`${directory}/`),
      )
    ) {
      assert(
        selectedPaths.has(trackedPath),
        `tracked distributable source was omitted: ${trackedPath}`,
      );
    }
  }

  const sourceBytes = new Map();
  for (const [index, sourcePath] of sourcePaths.entries()) {
    let blob;
    try {
      ({ stdout: blob } = await execFile(
        "git",
        ["show", `${sourceRevision}:${sourcePath}`],
        { cwd: rootDir, encoding: "buffer", maxBuffer: 16 * 1024 * 1024 },
      ));
    } catch (error) {
      throw new Error(
        `cannot read release source from Git revision (${sourcePath}): ${error.message}`,
      );
    }
    const worktreeBytes = await readFile(sourceFiles[index]);
    assert(
      worktreeBytes.equals(blob),
      `working-tree bytes differ from Git revision: ${sourcePath}`,
    );
    sourceBytes.set(sourcePath, blob);
  }

  return { publishable: true, sourceBytes };
}

async function copySource(sourcePath, outputRoot, sourceBytes) {
  assert(await pathExists(sourcePath), `release source missing: ${sourcePath}`);
  const relative = path.relative(rootDir, sourcePath);
  const normalizedRelative = relative.split(path.sep).join("/");
  assert(
    relative !== ".." && !relative.startsWith(`..${path.sep}`),
    `release path escapes root: ${relative}`,
  );
  const targetPath = path.join(outputRoot, relative);
  await assertSafePath(outputRoot, targetPath);
  await mkdir(path.dirname(targetPath), { recursive: true });
  const content = sourceBytes?.get(normalizedRelative) ?? (await readFile(sourcePath));
  assert(content, `release source snapshot missing: ${normalizedRelative}`);
  await writeFile(targetPath, content, { flag: "wx" });
}

function tarPathFields(relativePath) {
  assert(
    Buffer.byteLength(relativePath) <= 255,
    `release archive path is too long: ${relativePath}`,
  );
  if (Buffer.byteLength(relativePath) <= 100) {
    return { name: relativePath, prefix: "" };
  }
  const separators = [...relativePath.matchAll(/\//g)]
    .map((match) => match.index)
    .reverse();
  for (const index of separators) {
    const prefix = relativePath.slice(0, index);
    const name = relativePath.slice(index + 1);
    if (Buffer.byteLength(prefix) <= 155 && Buffer.byteLength(name) <= 100) {
      return { name, prefix };
    }
  }
  throw new Error(`release archive path cannot fit ustar fields: ${relativePath}`);
}

function writeTarText(header, offset, length, value) {
  const bytes = Buffer.from(value, "utf8");
  assert(bytes.length <= length, `ustar field overflow: ${value}`);
  bytes.copy(header, offset);
}

function writeTarOctal(header, offset, length, value) {
  const encoded = `${value.toString(8).padStart(length - 1, "0")}\0`;
  assert(encoded.length === length, `ustar numeric field overflow: ${value}`);
  writeTarText(header, offset, length, encoded);
}

async function createTarBuffer(outputRoot, archiveRootName) {
  const chunks = [];
  for (const filePath of await walk(outputRoot)) {
    const bundleRelative = path
      .relative(outputRoot, filePath)
      .split(path.sep)
      .join("/");
    const relative = `${archiveRootName}/${bundleRelative}`;
    const { name, prefix } = tarPathFields(relative);
    const content = await readFile(filePath);
    const header = Buffer.alloc(512);
    writeTarText(header, 0, 100, name);
    writeTarOctal(header, 100, 8, 0o644);
    writeTarOctal(header, 108, 8, 0);
    writeTarOctal(header, 116, 8, 0);
    writeTarOctal(header, 124, 12, content.byteLength);
    writeTarOctal(header, 136, 12, 0);
    header.fill(0x20, 148, 156);
    writeTarText(header, 156, 1, "0");
    writeTarText(header, 257, 6, "ustar\0");
    writeTarText(header, 263, 2, "00");
    writeTarText(header, 265, 32, "harnessly");
    writeTarText(header, 297, 32, "harnessly");
    writeTarText(header, 345, 155, prefix);
    const checksum = header.reduce((total, byte) => total + byte, 0);
    const checksumText = `${checksum.toString(8).padStart(6, "0")}\0 `;
    writeTarText(header, 148, 8, checksumText);
    chunks.push(header, content);
    const padding = (512 - (content.byteLength % 512)) % 512;
    if (padding > 0) chunks.push(Buffer.alloc(padding));
  }
  chunks.push(Buffer.alloc(1024));
  return Buffer.concat(chunks);
}

async function verifyTarBuffer(archive, outputRoot, archiveRootName) {
  const archivedPaths = [];
  let offset = 0;
  let sawTrailer = false;
  while (offset + 512 <= archive.length) {
    const header = archive.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) {
      assert(
        archive.length - offset >= 1024 &&
          archive.subarray(offset).every((byte) => byte === 0),
        "release archive has an invalid trailer",
      );
      sawTrailer = true;
      break;
    }
    const storedChecksum = Number.parseInt(
      header.subarray(148, 156).toString("ascii").replace(/\0.*$/, "").trim(),
      8,
    );
    const checksumHeader = Buffer.from(header);
    checksumHeader.fill(0x20, 148, 156);
    assert(
      checksumHeader.reduce((total, byte) => total + byte, 0) === storedChecksum,
      "release archive header checksum mismatch",
    );
    const readField = (start, length) =>
      header
        .subarray(start, start + length)
        .toString("utf8")
        .replace(/\0.*$/, "");
    const name = readField(0, 100);
    const prefix = readField(345, 155);
    const archiveRelative = prefix ? `${prefix}/${name}` : name;
    assert(
      archiveRelative.startsWith(`${archiveRootName}/`),
      `archive path lacks release root: ${archiveRelative}`,
    );
    const relative = archiveRelative.slice(archiveRootName.length + 1);
    const size = Number.parseInt(readField(124, 12).trim(), 8);
    assert(Number.isSafeInteger(size), `invalid archive size for ${relative}`);
    const contentStart = offset + 512;
    const content = archive.subarray(contentStart, contentStart + size);
    const sourcePath = path.join(outputRoot, relative);
    await assertSafePath(outputRoot, sourcePath);
    assert(await pathExists(sourcePath), `archive contains unknown path ${relative}`);
    assert(
      sha256(content) === sha256(await readFile(sourcePath)),
      `archive content mismatch: ${relative}`,
    );
    archivedPaths.push(relative);
    offset = contentStart + Math.ceil(size / 512) * 512;
  }
  const bundlePaths = (await walk(outputRoot)).map((filePath) =>
    path.relative(outputRoot, filePath).split(path.sep).join("/"),
  );
  assert(sawTrailer, "release archive has no end-of-archive trailer");
  assert(
    new Set(archivedPaths).size === archivedPaths.length,
    "release archive contains duplicate paths",
  );
  assert(
    JSON.stringify(archivedPaths) === JSON.stringify(bundlePaths),
    "release archive path list differs from bundle",
  );
}

async function buildArchive(outputRoot, archivePath, boundary) {
  const archiveRootName = `harnessly-${releaseName}`;
  const archive = await createTarBuffer(outputRoot, archiveRootName);
  await verifyTarBuffer(archive, outputRoot, archiveRootName);
  await writeStable(archivePath, archive, boundary);
  return sha256(archive);
}

async function buildBundle(outputRoot, sourceFiles, publishable, sourceBytes) {
  await resetDirectory(outputRoot);
  for (const sourcePath of sourceFiles) {
    await copySource(sourcePath, outputRoot, sourceBytes);
  }

  await writeFile(
    path.join(outputRoot, "catalog.json"),
    `${JSON.stringify(catalog, null, 2)}\n`,
    { encoding: "utf8", flag: "wx" },
  );

  const payloadFiles = await walk(outputRoot);
  const records = [];
  for (const filePath of payloadFiles) {
    const content = await readFile(filePath);
    records.push({
      path: path.relative(outputRoot, filePath).split(path.sep).join("/"),
      sha256: sha256(content),
      bytes: content.byteLength,
    });
  }
  records.sort((left, right) => compareStrings(left.path, right.path));

  const releaseManifest = {
    schemaVersion: "harnessly.dev/release/v1",
    release: releaseName,
    contract: catalog.contract,
    sourceRevision,
    publishable,
    files: records,
  };
  assert(
    new Set(records.map((record) => record.path)).size === records.length,
    "release manifest contains duplicate paths",
  );
  assert(
    validateReleaseManifest(releaseManifest),
    `invalid release manifest: ${(validateReleaseManifest.errors ?? [])
      .map((entry) => `${entry.instancePath || "/"} ${entry.message}`)
      .join("; ")}`,
  );
  const manifestContent = `${JSON.stringify(releaseManifest, null, 2)}\n`;
  await writeFile(
    path.join(outputRoot, "release-manifest.json"),
    manifestContent,
    { encoding: "utf8", flag: "wx" },
  );

  const checksumRecords = [
    ...records,
    {
      path: "release-manifest.json",
      sha256: sha256(manifestContent),
      bytes: Buffer.byteLength(manifestContent),
    },
  ].sort((left, right) => compareStrings(left.path, right.path));
  const checksumContent = `${checksumRecords
    .map((record) => `${record.sha256}  ${record.path}`)
    .join("\n")}\n`;
  await writeFile(path.join(outputRoot, "SHA256SUMS"), checksumContent, {
    encoding: "utf8",
    flag: "wx",
  });

  await verifyReuseCoverage(outputRoot);
  await verifyBundle(outputRoot, records);
  return { records, digest: await digestTree(outputRoot) };
}

async function verifyReuseCoverage(outputRoot) {
  const reuse = await readText(path.join(outputRoot, "REUSE.toml"));
  const annotations = reuse
    .split("[[annotations]]")
    .slice(1)
    .map((block) => {
      const paths = block.match(/path\s*=\s*\[([\s\S]*?)\]/)?.[1] ?? "";
      return [...paths.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
    });
  for (const filePath of await walk(outputRoot)) {
    const relative = path.relative(outputRoot, filePath).split(path.sep).join("/");
    if (relative.startsWith("LICENSES/")) continue;
    const matches = annotations.filter((patterns) =>
      isAllowedWritePattern(relative, patterns),
    );
    assert(
      matches.length === 1,
      `${relative}: expected exactly one staged REUSE annotation, found ${matches.length}`,
    );
  }
}

async function verifyBundle(outputRoot, expectedRecords) {
  const parsedManifest = JSON.parse(
    await readText(path.join(outputRoot, "release-manifest.json")),
  );
  assert(
    JSON.stringify(parsedManifest.files) === JSON.stringify(expectedRecords),
    "release manifest records differ from generated payload",
  );
  const checksumLines = (
    await readText(path.join(outputRoot, "SHA256SUMS"))
  )
    .trim()
    .split("\n");
  assert(
    checksumLines.length === expectedRecords.length + 1,
    "SHA256SUMS entry count mismatch",
  );
  for (const line of checksumLines) {
    const match = line.match(/^([a-f0-9]{64})  (.+)$/);
    assert(match, `invalid SHA256SUMS line: ${line}`);
    const filePath = path.join(outputRoot, match[2]);
    await assertSafePath(outputRoot, filePath);
    const content = await readFile(filePath);
    assert(sha256(content) === match[1], `${match[2]}: checksum mismatch`);
  }
  const bundledCatalog = await readYaml(path.join(outputRoot, "catalog.yaml"));
  assert(
    bundledCatalog.release === releaseName,
    "release catalog version mismatch",
  );
}

const sourceFiles = await collectSources();
const sourceSnapshot = await determinePublishability(sourceFiles);
const { publishable, sourceBytes } = sourceSnapshot;

if (checkOnly) {
  const checkRoot = path.join(rootDir, ".tmp/release-check");
  await resetDirectory(checkRoot);
  const first = await buildBundle(
    path.join(checkRoot, "first", releaseName),
    sourceFiles,
    publishable,
    sourceBytes,
  );
  const second = await buildBundle(
    path.join(checkRoot, "second", releaseName),
    sourceFiles,
    publishable,
    sourceBytes,
  );
  const firstArchiveDigest = await buildArchive(
    path.join(checkRoot, "first", releaseName),
    path.join(checkRoot, `harnessly-${releaseName}-first.tar`),
    checkRoot,
  );
  const secondArchiveDigest = await buildArchive(
    path.join(checkRoot, "second", releaseName),
    path.join(checkRoot, `harnessly-${releaseName}-second.tar`),
    checkRoot,
  );
  assert(
    first.digest === second.digest,
    "two isolated release builds produced different bytes",
  );
  assert(
    firstArchiveDigest === secondArchiveDigest,
    "two isolated release archives produced different bytes",
  );
  console.log(
    `Release bundle/archive ${releaseName} verified twice: ${first.records.length} files, temporary.`,
  );
  await assertSafePath(rootDir, checkRoot);
  await rm(checkRoot, { recursive: true, force: true });
} else {
  const distRoot = path.join(rootDir, "dist");
  const outputRoot = path.join(distRoot, releaseName);
  const result = await buildBundle(
    outputRoot,
    sourceFiles,
    publishable,
    sourceBytes,
  );
  const archiveName = `harnessly-${releaseName}.tar`;
  const archivePath = path.join(distRoot, archiveName);
  const archiveDigest = await buildArchive(outputRoot, archivePath, distRoot);
  await writeStable(
    path.join(distRoot, `${archiveName}.sha256`),
    `${archiveDigest}  ${archiveName}\n`,
    distRoot,
  );
  console.log(
    `Release bundle ${releaseName} verified: ${result.records.length} files, ${path.relative(rootDir, outputRoot)} and ${path.relative(rootDir, archivePath)} (${sourceRevision}).`,
  );
}
