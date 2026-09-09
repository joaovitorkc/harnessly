import { mkdir, realpath, symlink } from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import {
  assert,
  assertSafePath,
  digestTree,
  pathExists,
  readText,
  readYaml,
  resetDirectory,
  rootDir,
  sha256,
  walk,
  writeStable,
} from "./lib.mjs";

const temporaryRoot = path.join(rootDir, ".tmp/template-tests");
await resetDirectory(temporaryRoot);
const projectsSchema = JSON.parse(
  await readText(path.join(rootDir, "contracts/v1/projects.schema.json")),
);
const validateProjects = new Ajv2020({ allErrors: true, strict: false }).compile(
  projectsSchema,
);

async function validateRegistryObject(registry, registryDirectory) {
  assert(
    validateProjects(registry),
    (validateProjects.errors ?? [])
      .map((entry) => `${entry.instancePath || "/"} ${entry.message}`)
      .join("; "),
  );
  const ids = registry.projects.map((project) => project.id);
  assert(new Set(ids).size === ids.length, "registry project IDs must be unique");
  const projectPaths = registry.projects.map((project) => project.path);
  assert(
    new Set(projectPaths).size === projectPaths.length,
    "registry project paths must be unique",
  );

  const boundary = await realpath(
    path.resolve(registryDirectory, registry.authorizedRoot),
  );
  for (const project of registry.projects) {
    const unresolved = path.resolve(registryDirectory, project.path);
    assert(await pathExists(unresolved), `${project.id}: project path is missing`);
    const resolved = await realpath(unresolved);
    const relative = path.relative(boundary, resolved);
    assert(
      relative !== ".." && !relative.startsWith(`..${path.sep}`),
      `${project.id}: project path escapes authorizedRoot`,
    );
    assert(
      await pathExists(path.join(resolved, ".fixture-git-root")),
      `${project.id}: expected Git-root marker is missing`,
    );
  }
}

async function expectFailure(operation, label) {
  try {
    await operation();
  } catch {
    return;
  }
  throw new Error(`${label}: expected validation failure`);
}

function replaceTokens(content, values, fileLabel) {
  const rendered = content.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, token) => {
    assert(
      Object.hasOwn(values, token),
      `${fileLabel}: missing fixture value for ${token}`,
    );
    return values[token];
  });
  assert(
    !/\{\{[A-Z0-9_]+\}\}/.test(rendered),
    `${fileLabel}: unresolved template token`,
  );
  return rendered;
}

async function assessTemplateTargets(sourceRoot, targetRoot) {
  const assessed = new Map();
  for (const sourcePath of await walk(sourceRoot)) {
    const relative = path.relative(sourceRoot, sourcePath);
    const targetPath = path.join(targetRoot, relative);
    assessed.set(
      relative,
      (await pathExists(targetPath)) ? sha256(await readText(targetPath)) : null,
    );
  }
  return assessed;
}

async function renderTree(sourceRoot, targetRoot, values, assessed) {
  await assertSafePath(temporaryRoot, targetRoot);
  await mkdir(targetRoot, { recursive: true });
  const sourceFiles = await walk(sourceRoot);
  let writes = 0;
  for (const sourcePath of sourceFiles) {
    const relative = path.relative(sourceRoot, sourcePath);
    const sourceContent = await readText(sourcePath);
    assert(
      /^(?:<!--|#) harnessly:owned workflow=setup-workspace version=0\.1\.0/.test(
        sourceContent,
      ),
      `${relative}: missing stable ownership provenance`,
    );
    const targetPath = path.join(targetRoot, relative);
    const currentContent = (await pathExists(targetPath))
      ? await readText(targetPath)
      : null;
    assert(
      assessed.get(relative) ===
        (currentContent === null ? null : sha256(currentContent)),
      `${relative}: target drifted after assessment`,
    );
    if (currentContent !== null) {
      assert(
        /^(?:<!--|#) harnessly:owned workflow=setup-workspace version=0\.1\.0/.test(
          currentContent,
        ),
        `${relative}: unmanaged collision`,
      );
    }
    const content = replaceTokens(
      sourceContent,
      values,
      relative.split(path.sep).join("/"),
    );
    if (await writeStable(targetPath, content, targetRoot)) writes += 1;
  }
  return writes;
}

async function assertConverges(sourceRoot, targetRoot, values) {
  const firstWrites = await renderTree(
    sourceRoot,
    targetRoot,
    values,
    await assessTemplateTargets(sourceRoot, targetRoot),
  );
  assert(firstWrites > 0, `${targetRoot}: first render made no changes`);
  const firstDigest = await digestTree(targetRoot);
  const secondWrites = await renderTree(
    sourceRoot,
    targetRoot,
    values,
    await assessTemplateTargets(sourceRoot, targetRoot),
  );
  const secondDigest = await digestTree(targetRoot);
  assert(secondWrites === 0, `${targetRoot}: second render was not idempotent`);
  assert(firstDigest === secondDigest, `${targetRoot}: tree digest changed`);
}

const standardSource = path.join(rootDir, "templates/standard");
const standardTarget = path.join(temporaryRoot, "standard");
await assertConverges(standardSource, standardTarget, {
  PROJECT_NAME: "Synthetic Workspace",
  PROJECT_SUMMARY: "A deterministic project used to verify Standard templates.",
  REPOSITORY_MAP: "- `apps/web/`: static fixture",
  VERIFY_COMMAND: "node --test",
  SYSTEM_UNITS: "- Web: `apps/web/`",
  BOUNDARIES: "- One repository and one static unit.",
  RUNTIME_FLOW: "Browser loads generated static assets.",
  INTERFACES: "No owned server-side API.",
  DEPLOYMENT: "Static artifact; provider intentionally unspecified.",
  PREREQUISITES: "- Node.js 20",
  LOCAL_START: "Run the existing preview script.",
  GOLDEN_JOURNEYS: "- Load the home page without console errors.",
  MANUAL_GATES: "- Deployment and external services.",
});

for (const required of ["AGENTS.md", "DESIGN.md", "HARNESS.md"]) {
  assert(
    (await walk(standardTarget)).some(
      (filePath) => path.basename(filePath) === required,
    ),
    `Standard template missing ${required}`,
  );
}

const collisionTarget = path.join(temporaryRoot, "unmanaged-collision");
await mkdir(collisionTarget, { recursive: true });
await writeStable(
  path.join(collisionTarget, "AGENTS.md"),
  "# User-owned instructions\n",
  temporaryRoot,
);
const collisionAssessment = await assessTemplateTargets(
  standardSource,
  collisionTarget,
);
await expectFailure(
  () =>
    renderTree(
      standardSource,
      collisionTarget,
      {
        PROJECT_NAME: "Collision",
        PROJECT_SUMMARY: "Unmanaged collision fixture.",
        REPOSITORY_MAP: "- Existing repository",
        VERIFY_COMMAND: "true",
        SYSTEM_UNITS: "- Existing unit",
        BOUNDARIES: "- Existing boundary",
        RUNTIME_FLOW: "Unknown.",
        INTERFACES: "Unknown.",
        DEPLOYMENT: "Unknown.",
        PREREQUISITES: "- None",
        LOCAL_START: "Unknown.",
        GOLDEN_JOURNEYS: "- None",
        MANUAL_GATES: "- None",
      },
      collisionAssessment,
    ),
  "unmanaged owned-file collision",
);

const driftTarget = path.join(temporaryRoot, "drift");
const driftValues = {
  PROJECT_NAME: "Drift",
  PROJECT_SUMMARY: "Assessment drift fixture.",
  REPOSITORY_MAP: "- Existing repository",
  VERIFY_COMMAND: "true",
  SYSTEM_UNITS: "- Existing unit",
  BOUNDARIES: "- Existing boundary",
  RUNTIME_FLOW: "Unknown.",
  INTERFACES: "Unknown.",
  DEPLOYMENT: "Unknown.",
  PREREQUISITES: "- None",
  LOCAL_START: "Unknown.",
  GOLDEN_JOURNEYS: "- None",
  MANUAL_GATES: "- None",
};
await renderTree(
  standardSource,
  driftTarget,
  driftValues,
  await assessTemplateTargets(standardSource, driftTarget),
);
const driftAssessment = await assessTemplateTargets(standardSource, driftTarget);
await writeStable(
  path.join(driftTarget, "AGENTS.md"),
  `${await readText(path.join(driftTarget, "AGENTS.md"))}\nUser drift.\n`,
  temporaryRoot,
);
await expectFailure(
  () => renderTree(standardSource, driftTarget, driftValues, driftAssessment),
  "post-assessment drift",
);

const advancedSource = path.join(rootDir, "templates/advanced/orchestrator");

const embeddedWorkspace = path.join(temporaryRoot, "embedded");
await assertSafePath(temporaryRoot, embeddedWorkspace);
await mkdir(embeddedWorkspace, { recursive: true });
await writeStable(
  path.join(embeddedWorkspace, ".fixture-git-root"),
  "synthetic embedded Git boundary",
  temporaryRoot,
);
const embeddedTarget = path.join(embeddedWorkspace, "orchestrator");
await assertConverges(advancedSource, embeddedTarget, {
  WORKSPACE_NAME: "Embedded Fixture",
  TOPOLOGY: "EMBEDDED",
  TOPOLOGY_DESCRIPTION:
    "The control plane is inside the product repository and points to its parent.",
  PROJECT_REGISTRY:
    "  - id: host-project\n    path: ..\n    gitRoot: true",
  PROJECT_SUMMARY: "- Host project: `..`",
  DECISIONS_AND_UNKNOWNS: "- Physical migration is excluded.",
  PROJECT_SENSORS: "- Host project: run its documented sensor.",
});

const embeddedRegistry = await readYaml(
  path.join(embeddedTarget, "projects.yaml"),
);
await validateRegistryObject(embeddedRegistry, embeddedTarget);
assert(
  embeddedRegistry.projects.length === 1 &&
    embeddedRegistry.projects[0].path === "..",
  "Embedded registry must point to ..",
);

const parentWorkspace = path.join(temporaryRoot, "parent");
for (const projectId of ["web", "api"]) {
  const projectRoot = path.join(parentWorkspace, "repos", projectId);
  await assertSafePath(temporaryRoot, projectRoot);
  await mkdir(projectRoot, { recursive: true });
  await writeStable(
    path.join(projectRoot, ".fixture-git-root"),
    `synthetic ${projectId} Git boundary`,
    temporaryRoot,
  );
}
const parentTarget = path.join(parentWorkspace, "orchestrator");
await assertConverges(advancedSource, parentTarget, {
  WORKSPACE_NAME: "Parent Hub Fixture",
  TOPOLOGY: "PARENT_HUB",
  TOPOLOGY_DESCRIPTION:
    "The control plane references selected sibling repositories.",
  PROJECT_REGISTRY:
    "  - id: web\n    path: ../repos/web\n    gitRoot: true\n  - id: api\n    path: ../repos/api\n    gitRoot: true",
  PROJECT_SUMMARY: "- Web: `../repos/web`\n- API: `../repos/api`",
  DECISIONS_AND_UNKNOWNS: "- Repositories remain independent.",
  PROJECT_SENSORS: "- Web: project sensor\n- API: project sensor",
});

const parentRegistry = await readYaml(path.join(parentTarget, "projects.yaml"));
await validateRegistryObject(parentRegistry, parentTarget);
assert(
  parentRegistry.projects.map((project) => project.path).join(",") ===
    "../repos/web,../repos/api",
  "Parent registry must contain only selected sibling paths",
);

await expectFailure(
  () =>
    validateRegistryObject(
      {
        ...parentRegistry,
        projects: [
          parentRegistry.projects[0],
          { ...parentRegistry.projects[1], id: parentRegistry.projects[0].id },
        ],
      },
      parentTarget,
    ),
  "duplicate registry ID",
);

await expectFailure(
  () =>
    validateRegistryObject(
      {
        ...parentRegistry,
        projects: [
          parentRegistry.projects[0],
          {
            ...parentRegistry.projects[0],
            id: "duplicate-path",
          },
        ],
      },
      parentTarget,
    ),
  "duplicate registry path",
);

await expectFailure(
  () =>
    validateRegistryObject(
      {
        ...parentRegistry,
        projects: [
          { id: "missing", path: "../repos/missing", gitRoot: true },
        ],
      },
      parentTarget,
    ),
  "missing registry root",
);

const outsideRoot = path.join(temporaryRoot, "outside");
await mkdir(outsideRoot, { recursive: true });
await writeStable(
  path.join(outsideRoot, ".fixture-git-root"),
  "synthetic escaped Git boundary",
  temporaryRoot,
);
const escapedLink = path.join(parentWorkspace, "repos", "escaped");
await symlink(outsideRoot, escapedLink, "dir");
await expectFailure(
  () =>
    validateRegistryObject(
      {
        ...parentRegistry,
        projects: [
          { id: "escaped", path: "../repos/escaped", gitRoot: true },
        ],
      },
      parentTarget,
    ),
  "symlink registry escape",
);

for (const target of [embeddedTarget, parentTarget]) {
  const files = await walk(target);
  assert(
    files.every(
      (filePath) =>
        !/\.(?:js|ts|py|go|rs|java|cs)$/i.test(path.extname(filePath)),
    ),
    `${target}: product source was copied into orchestrator`,
  );
}

console.log("Template tests passed: Standard, Advanced embedded, Advanced parent.");
