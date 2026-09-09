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
  const routingDocument = path.resolve(registryDirectory, registry.routingDoc);
  await assertSafePath(registryDirectory, routingDocument);
  assert(await pathExists(routingDocument), "registry routing document is missing");
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
    for (const field of ["entrypoint", "harness"]) {
      const referencedPath = path.resolve(resolved, project[field]);
      assert(
        await pathExists(referencedPath),
        `${project.id}: ${field} is missing`,
      );
      const resolvedReference = await realpath(referencedPath);
      const referencedRelative = path.relative(resolved, resolvedReference);
      assert(
        referencedRelative !== ".." &&
          !referencedRelative.startsWith(`..${path.sep}`),
        `${project.id}: ${field} escapes the project root`,
      );
    }
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

function hasExpectedProvenance(content, relativePath) {
  const fileName = path.basename(relativePath);
  const owner =
    fileName === "DESIGN.md"
      ? ["document-system-design", "0.1.0"]
      : fileName === "HARNESS.md"
        ? ["build-local-harness", "0.1.0"]
        : ["setup-workspace", "1.0.0-beta.1"];
  const marker = relativePath.endsWith(".yaml")
    ? `# harnessly:owned workflow=${owner[0]} version=${owner[1]}`
    : `<!-- harnessly:owned workflow=${owner[0]} version=${owner[1]} -->`;
  return fileName === "SKILL.md"
    ? content.includes(marker)
    : content.startsWith(marker);
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
      hasExpectedProvenance(sourceContent, relative),
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
        hasExpectedProvenance(currentContent, relative),
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
await writeStable(
  path.join(embeddedWorkspace, "AGENTS.md"),
  "# Embedded project instructions\n",
  temporaryRoot,
);
await writeStable(
  path.join(embeddedWorkspace, "HARNESS.md"),
  "# Embedded project harness\n",
  temporaryRoot,
);
const embeddedEntrypointDigest = sha256(
  await readText(path.join(embeddedWorkspace, "AGENTS.md")),
);
const embeddedHarnessDigest = sha256(
  await readText(path.join(embeddedWorkspace, "HARNESS.md")),
);
const embeddedTarget = path.join(embeddedWorkspace, "orchestrator");
await assertConverges(advancedSource, embeddedTarget, {
  WORKSPACE_NAME: "Embedded Fixture",
  TOPOLOGY: "EMBEDDED",
  TOPOLOGY_DESCRIPTION:
    "The control plane is inside the product repository and points to its parent.",
  PROJECT_REGISTRY:
    "  - id: host-project\n    name: Host Project\n    role: Synthetic embedded application\n    path: ..\n    gitRoot: true\n    signals: [host, application]\n    exclusions: [external]\n    entrypoint: AGENTS.md\n    harness: HARNESS.md\n    sensor: node --test",
  PROJECT_SUMMARY: "- Host project: `..`",
  DECISIONS_AND_UNKNOWNS: "- Physical migration is excluded.",
  PROJECT_SENSORS: "- Host project: run its documented sensor.",
  ROUTING_PROJECTS:
    "## Host Project (`host-project`)\n\n- Role: synthetic embedded application\n- Signals: `host`, `application`\n- Exclusions: `external`\n- Entrypoint: `../AGENTS.md`\n- Harness: `../HARNESS.md`\n- Sensor hint: `node --test`",
  ROUTING_TESTS:
    `## Host application request\n\n- Request: \`change the host application\`\n- Matched signals: \`host\`, \`application\`\n- Exclusions considered: \`external\`\n- Selected project: \`host-project\`\n- Entrypoint SHA-256: \`${embeddedEntrypointDigest}\`\n- Harness SHA-256: \`${embeddedHarnessDigest}\`\n- Result: \`PASS\``,
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
assert(
  (await readText(path.join(embeddedTarget, "docs/routing/observed-tests.md")))
    .includes("Exclusions considered: `external`"),
  "Embedded routing evidence must record exclusions",
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
  await writeStable(
    path.join(projectRoot, "AGENTS.md"),
    `# ${projectId} project instructions\n`,
    temporaryRoot,
  );
  await writeStable(
    path.join(projectRoot, "HARNESS.md"),
    `# ${projectId} project harness\n`,
    temporaryRoot,
  );
}
const webEntrypointDigest = sha256(
  await readText(path.join(parentWorkspace, "repos/web/AGENTS.md")),
);
const webHarnessDigest = sha256(
  await readText(path.join(parentWorkspace, "repos/web/HARNESS.md")),
);
const apiEntrypointDigest = sha256(
  await readText(path.join(parentWorkspace, "repos/api/AGENTS.md")),
);
const apiHarnessDigest = sha256(
  await readText(path.join(parentWorkspace, "repos/api/HARNESS.md")),
);
const parentTarget = path.join(parentWorkspace, "orchestrator");
await assertConverges(advancedSource, parentTarget, {
  WORKSPACE_NAME: "Parent Hub Fixture",
  TOPOLOGY: "PARENT_HUB",
  TOPOLOGY_DESCRIPTION:
    "The control plane references selected sibling repositories.",
  PROJECT_REGISTRY:
    "  - id: web\n    name: Web\n    role: Synthetic browser application\n    path: ../repos/web\n    gitRoot: true\n    signals: [web, frontend]\n    exclusions: [api]\n    entrypoint: AGENTS.md\n    harness: HARNESS.md\n    sensor: pnpm verify\n  - id: api\n    name: API\n    role: Synthetic HTTP service\n    path: ../repos/api\n    gitRoot: true\n    signals: [api, backend]\n    exclusions: [frontend]\n    entrypoint: AGENTS.md\n    harness: HARNESS.md\n    sensor: pnpm verify",
  PROJECT_SUMMARY: "- Web: `../repos/web`\n- API: `../repos/api`",
  DECISIONS_AND_UNKNOWNS: "- Repositories remain independent.",
  PROJECT_SENSORS: "- Web: project sensor\n- API: project sensor",
  ROUTING_PROJECTS:
    "## Web (`web`)\n\n- Role: synthetic browser application\n- Signals: `web`, `frontend`\n- Exclusions: `api`\n- Entrypoint: `../../repos/web/AGENTS.md`\n- Harness: `../../repos/web/HARNESS.md`\n- Sensor hint: `pnpm verify`\n\n## API (`api`)\n\n- Role: synthetic HTTP service\n- Signals: `api`, `backend`\n- Exclusions: `frontend`\n- Entrypoint: `../../repos/api/AGENTS.md`\n- Harness: `../../repos/api/HARNESS.md`\n- Sensor hint: `pnpm verify`",
  ROUTING_TESTS:
    `## Frontend request\n\n- Request: \`fix the frontend page\`\n- Matched signals: \`web\`, \`frontend\`\n- Exclusions considered: \`api\`\n- Selected project: \`web\`\n- Entrypoint SHA-256: \`${webEntrypointDigest}\`\n- Harness SHA-256: \`${webHarnessDigest}\`\n- Result: \`PASS\`\n\n## API request\n\n- Request: \`change the API endpoint\`\n- Matched signals: \`api\`, \`backend\`\n- Exclusions considered: \`frontend\`\n- Selected project: \`api\`\n- Entrypoint SHA-256: \`${apiEntrypointDigest}\`\n- Harness SHA-256: \`${apiHarnessDigest}\`\n- Result: \`PASS\`\n\n## Ambiguous request\n\n- Request: \`change authentication\`\n- Question: \`Is this for web or API?\`\n- Loaded projects: none\n- Result: \`BLOCKED\``,
});

const parentRegistry = await readYaml(path.join(parentTarget, "projects.yaml"));
await validateRegistryObject(parentRegistry, parentTarget);
assert(
  parentRegistry.projects.map((project) => project.path).join(",") ===
    "../repos/web,../repos/api",
  "Parent registry must contain only selected sibling paths",
);
assert(
  parentRegistry.projects.every(
    (project) =>
      project.signals.length > 0 &&
      project.entrypoint === "AGENTS.md" &&
      project.harness === "HARNESS.md",
  ),
  "Parent registry must contain usable routing metadata",
);
const routingMap = await readText(
  path.join(parentTarget, "docs/routing/projects.md"),
);
assert(
  routingMap.includes("## Web (`web`)") &&
    routingMap.includes("## API (`api`)"),
  "Advanced routing map must include every registered project",
);
const routingTests = await readText(
  path.join(parentTarget, "docs/routing/observed-tests.md"),
);
assert(
  routingTests.includes("Selected project: `web`") &&
    routingTests.includes("Selected project: `api`") &&
    routingTests.includes(`Entrypoint SHA-256: \`${webEntrypointDigest}\``) &&
    routingTests.includes(`Harness SHA-256: \`${webHarnessDigest}\``) &&
    routingTests.includes(`Entrypoint SHA-256: \`${apiEntrypointDigest}\``) &&
    routingTests.includes(`Harness SHA-256: \`${apiHarnessDigest}\``) &&
    routingTests.includes("Exclusions considered: `api`") &&
    routingTests.includes("Exclusions considered: `frontend`") &&
    routingTests.includes("Loaded projects: none") &&
    routingTests.includes("Result: `BLOCKED`"),
  "Advanced routing tests must cover every project and one ambiguity",
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
          {
            ...parentRegistry.projects[0],
            id: "missing",
            name: "Missing",
            path: "../repos/missing",
          },
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
const escapedReferenceTarget = path.join(outsideRoot, "outside.md");
await writeStable(
  escapedReferenceTarget,
  "synthetic path outside the registered project",
  temporaryRoot,
);
for (const [field, fileName] of [
  ["entrypoint", "escaped-entrypoint.md"],
  ["harness", "escaped-harness.md"],
]) {
  await symlink(
    escapedReferenceTarget,
    path.join(parentWorkspace, "repos", "web", fileName),
  );
  await expectFailure(
    () =>
      validateRegistryObject(
        {
          ...parentRegistry,
          projects: [
            {
              ...parentRegistry.projects[0],
              [field]: fileName,
            },
            parentRegistry.projects[1],
          ],
        },
        parentTarget,
      ),
    `symlink ${field} escape`,
  );
}
const escapedLink = path.join(parentWorkspace, "repos", "escaped");
await symlink(outsideRoot, escapedLink, "dir");
await expectFailure(
  () =>
    validateRegistryObject(
      {
        ...parentRegistry,
        projects: [
          {
            ...parentRegistry.projects[0],
            id: "escaped",
            name: "Escaped",
            path: "../repos/escaped",
          },
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
