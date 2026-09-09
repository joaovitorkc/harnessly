import { createHash, randomUUID } from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

export const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export const ignoredDirectoryNames = new Set([
  ".git",
  ".tmp",
  "dist",
  "node_modules",
  "coverage",
]);

export function compareStrings(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function relativePath(filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join("/");
}

export async function readText(filePath) {
  return readFile(filePath, "utf8");
}

export async function readYaml(filePath) {
  return YAML.parse(await readText(filePath));
}

export function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

export async function sha256File(filePath) {
  return sha256(await readFile(filePath));
}

export async function pathExists(filePath) {
  try {
    await lstat(filePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

export async function assertSafePath(boundary, target) {
  const absoluteBoundary = path.resolve(boundary);
  const absoluteTarget = path.resolve(target);
  const relative = path.relative(absoluteBoundary, absoluteTarget);
  if (relative === ".." || relative.startsWith(`..${path.sep}`)) {
    throw new Error(`Path escapes boundary: ${absoluteTarget}`);
  }

  let current = absoluteBoundary;
  const parts = relative === "" ? [] : relative.split(path.sep);
  for (const part of ["", ...parts]) {
    if (part) current = path.join(current, part);
    try {
      const stat = await lstat(current);
      if (stat.isSymbolicLink()) {
        throw new Error(`Symlink component is not allowed: ${current}`);
      }
    } catch (error) {
      if (error?.code === "ENOENT") break;
      throw error;
    }
  }

  const realBoundary = await realpath(absoluteBoundary);
  const nearestExisting = await nearestExistingParent(absoluteTarget);
  const realExisting = await realpath(nearestExisting);
  const realRelative = path.relative(realBoundary, realExisting);
  if (realRelative === ".." || realRelative.startsWith(`..${path.sep}`)) {
    throw new Error(`Resolved path escapes boundary: ${absoluteTarget}`);
  }
}

async function nearestExistingParent(target) {
  let current = target;
  while (!(await pathExists(current))) {
    const parent = path.dirname(current);
    if (parent === current) throw new Error(`No existing parent for ${target}`);
    current = parent;
  }
  return current;
}

export async function walk(directory, options = {}) {
  const {
    includeDirectories = false,
    rejectSymlinks = true,
    ignore = ignoredDirectoryNames,
  } = options;
  const result = [];

  async function visit(current) {
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((a, b) => compareStrings(a.name, b.name));

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      const stat = await lstat(fullPath);
      if (stat.isSymbolicLink()) {
        if (rejectSymlinks) {
          throw new Error(`Symlink is not allowed: ${relativePath(fullPath)}`);
        }
        continue;
      }
      if (ignore.has(entry.name)) continue;
      if (stat.isDirectory()) {
        if (includeDirectories) result.push(fullPath);
        await visit(fullPath);
      } else if (stat.isFile()) {
        result.push(fullPath);
      }
    }
  }

  await visit(directory);
  return result;
}

export async function writeStable(filePath, content, boundary = rootDir) {
  await assertSafePath(boundary, filePath);
  const binary = Buffer.isBuffer(content);
  const normalized = binary
    ? content
    : content.endsWith("\n")
      ? content
      : `${content}\n`;
  if (await pathExists(filePath)) {
    const current = await readFile(filePath);
    if (
      binary
        ? current.equals(normalized)
        : current.toString("utf8") === normalized
    ) {
      return false;
    }
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp-${process.pid}-${randomUUID()}`;
  try {
    await writeFile(
      temporaryPath,
      normalized,
      binary ? { flag: "wx" } : { encoding: "utf8", flag: "wx" },
    );
    await rename(temporaryPath, filePath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
  return true;
}

export async function resetDirectory(directory, boundary = rootDir) {
  await assertSafePath(boundary, directory);
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
}

export function parseFrontmatter(content, fileLabel) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) {
    throw new Error(`Missing YAML frontmatter: ${fileLabel}`);
  }
  const data = YAML.parse(match[1]);
  const body = content.slice(match[0].length);
  return { data, body };
}

export function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateReleaseName(value) {
  assert(
    typeof value === "string" &&
      /^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/.test(
        value,
      ) &&
      !value.includes("/") &&
      !value.includes("\\"),
    `Unsafe release name: ${String(value)}`,
  );
  return value;
}

export function validateSourceRevision(value) {
  assert(
    value === "WORKTREE" || /^[a-f0-9]{40}$/i.test(value),
    "SOURCE_REVISION must be WORKTREE or a full 40-character Git SHA",
  );
  return value === "WORKTREE" ? value : value.toLowerCase();
}

export function assertPublishableProvenance({
  sourceRevision,
  headRevision,
  porcelainStatus,
  sourcePaths,
  trackedPaths,
}) {
  assert(sourceRevision !== "WORKTREE", "WORKTREE builds are not publishable");
  assert(
    sourceRevision === headRevision.toLowerCase(),
    "SOURCE_REVISION does not match Git HEAD",
  );
  assert(
    porcelainStatus.trim() === "",
    "publishable release requires a clean Git checkout",
  );
  const tracked = new Set(trackedPaths);
  for (const sourcePath of sourcePaths) {
    assert(
      tracked.has(sourcePath),
      `release source is not tracked by Git: ${sourcePath}`,
    );
  }
  return true;
}

function expandBraces(pattern) {
  const match = pattern.match(/\{([^{}]+)\}/);
  if (!match) return [pattern];
  return match[1]
    .split(",")
    .flatMap((choice) =>
      expandBraces(
        `${pattern.slice(0, match.index)}${choice}${pattern.slice(
          (match.index ?? 0) + match[0].length,
        )}`,
      ),
    );
}

function segmentMatches(pattern, value) {
  const expression = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, "[^/]");
  return new RegExp(`^${expression}$`).test(value);
}

function globMatchesLiteral(pattern, value) {
  const patternSegments = pattern.split("/");
  const valueSegments = value.split("/");

  function matches(patternIndex, valueIndex) {
    if (patternIndex === patternSegments.length) {
      return valueIndex === valueSegments.length;
    }
    if (patternSegments[patternIndex] === "**") {
      return (
        matches(patternIndex + 1, valueIndex) ||
        (valueIndex < valueSegments.length &&
          matches(patternIndex, valueIndex + 1))
      );
    }
    return (
      valueIndex < valueSegments.length &&
      segmentMatches(patternSegments[patternIndex], valueSegments[valueIndex]) &&
      matches(patternIndex + 1, valueIndex + 1)
    );
  }

  return matches(0, 0);
}

export function isAllowedWritePattern(allowedPattern, declaredPatterns) {
  const normalized = allowedPattern.replaceAll("\\", "/").replace(/^\.\//, "");
  const hasPatternSyntax = /[*?[\]{}]/.test(normalized);
  if (hasPatternSyntax) return declaredPatterns.includes(normalized);
  return declaredPatterns.some((pattern) =>
    expandBraces(pattern).some((expanded) =>
      globMatchesLiteral(expanded, normalized),
    ),
  );
}

export function sortedUnique(values) {
  return [...new Set(values)].sort(compareStrings);
}

export async function digestTree(directory) {
  const hash = createHash("sha256");
  const files = await walk(directory);
  for (const filePath of files) {
    const relative = path.relative(directory, filePath).split(path.sep).join("/");
    const relativeBytes = Buffer.from(relative, "utf8");
    const content = await readFile(filePath);
    const header = Buffer.alloc(12);
    header.writeUInt32BE(relativeBytes.byteLength, 0);
    header.writeBigUInt64BE(BigInt(content.byteLength), 4);
    hash.update(header);
    hash.update(relativeBytes);
    hash.update(content);
  }
  return hash.digest("hex");
}
