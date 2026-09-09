import { lstat, realpath } from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { assertSetupResultSemantics } from "./result-semantics.mjs";
import {
  assert,
  digestTree,
  isAllowedWritePattern,
  parseFrontmatter,
  pathExists,
  readText,
  readYaml,
  relativePath,
  rootDir,
  sha256,
  sortedUnique,
  walk,
} from "./lib.mjs";

const errors = [];

async function check(label, operation) {
  try {
    await operation();
  } catch (error) {
    errors.push(`${label}: ${error.message}`);
  }
}

const ajv = new Ajv2020({ allErrors: true, strict: false });
const promptSchema = JSON.parse(
  await readText(path.join(rootDir, "contracts/v1/prompt.schema.json")),
);
const profileSchema = JSON.parse(
  await readText(path.join(rootDir, "contracts/v1/profile.schema.json")),
);
const catalogSchema = JSON.parse(
  await readText(path.join(rootDir, "contracts/v1/catalog.schema.json")),
);
const scenarioSchema = JSON.parse(
  await readText(path.join(rootDir, "contracts/v1/scenario.schema.json")),
);
const evalSchema = JSON.parse(
  await readText(path.join(rootDir, "contracts/v1/eval.schema.json")),
);
const resultSchema = JSON.parse(
  await readText(path.join(rootDir, "contracts/v1/result.schema.json")),
);
const projectsSchema = JSON.parse(
  await readText(path.join(rootDir, "contracts/v1/projects.schema.json")),
);
const validatePrompt = ajv.compile(promptSchema);
const validateProfile = ajv.compile(profileSchema);
const validateCatalog = ajv.compile(catalogSchema);
const validateScenario = ajv.compile(scenarioSchema);
const validateEval = ajv.compile(evalSchema);
const validateResult = ajv.compile(resultSchema);
const validateProjects = ajv.compile(projectsSchema);

function schemaMessage(validator) {
  return (validator.errors ?? [])
    .map((entry) => `${entry.instancePath || "/"} ${entry.message}`)
    .join("; ");
}

const catalogPath = path.join(rootDir, "catalog.yaml");
const catalog = await readYaml(catalogPath);

await check("catalog schema", async () => {
  assert(validateCatalog(catalog), schemaMessage(validateCatalog));
});

await check("result example", async () => {
  const example = await readYaml(
    path.join(rootDir, "contracts/v1/examples/result.yaml"),
  );
  assert(validateResult(example), schemaMessage(validateResult));
  assertSetupResultSemantics(
    example,
    catalog.workflows
      .filter((workflow) => workflow.slug !== "setup-workspace")
      .map((workflow) => workflow.slug),
  );
  const gateIds = Object.keys(example.gates);
  assert(
    new Set(gateIds).size === gateIds.length,
    "result example gate IDs must be unique",
  );
});

const requiredHeadings = [
  "## Run Contract",
  "## Objective",
  "## Applicability",
  "## Inputs",
  "## Safety Invariants",
  "## Discovery",
  "## ASSESS Procedure",
  "## APPLY Procedure",
  "## Human Gates",
  "## Verification",
  "## Result Contract",
  "## Stop Conditions",
];
const structuredPathPattern =
  /(?:^|\/)(?:package(?:-lock)?\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lock|pyproject\.toml|uv\.lock|poetry\.lock|requirements[^/]*\.txt|go\.(?:mod|sum)|Cargo\.(?:toml|lock)|pom\.xml|packages\.lock\.json|Taskfile\.ya?ml|\.gitignore|[^/]+\.(?:json|ya?ml|toml|xml|properties|csproj|sln))$/i;

const catalogIds = [];
const catalogSlugs = [];
const manifests = new Map();
const manifestDigests = new Map();

for (const workflow of catalog.workflows) {
  const label = workflow.slug;
  const manifestPath = path.join(rootDir, workflow.manifest);
  const promptDirectory = path.dirname(manifestPath);
  const promptPath = path.join(promptDirectory, "PROMPT.md");

  await check(`${label} manifest`, async () => {
    assert(await pathExists(manifestPath), `missing ${workflow.manifest}`);
    const manifest = await readYaml(manifestPath);
    assert(validatePrompt(manifest), schemaMessage(validatePrompt));
    assert(manifest.id === workflow.id, "catalog and manifest IDs differ");
    assert(manifest.slug === workflow.slug, "catalog and manifest slugs differ");
    assert(
      manifest.version === workflow.version,
      "catalog and manifest versions differ",
    );
    assert(
      manifest.status === workflow.status,
      "catalog and manifest statuses differ",
    );
    assert(
      manifest.category === workflow.category,
      "catalog and manifest categories differ",
    );
    const riskRank = { R0: 0, R1: 1, R2: 2, R3: 3, R4: 4 };
    assert(
      riskRank[manifest.risk.assess] <= riskRank[manifest.risk.apply] &&
        riskRank[manifest.risk.apply] <= riskRank[manifest.risk.ceiling],
      "risk levels must be monotonic",
    );
    const assessCapabilities = new Set([
      "fs.read",
      "git.read",
      "format.parse",
      "shell.readonly",
    ]);
    assert(
      manifest.capabilities.assess.every((capability) =>
        assessCapabilities.has(capability),
      ),
      "ASSESS declares a mutating or network capability",
    );
    for (const effect of manifest.effects) {
      if (["create", "modify", "install"].includes(effect.operation)) {
        assert(
          manifest.capabilities.apply.includes("fs.write-declared"),
          `${effect.operation} effect requires fs.write-declared`,
        );
      }
      if (effect.operation === "install") {
        assert(
          manifest.capabilities.apply.includes("dependency.modify"),
          "install effect requires dependency.modify",
        );
      }
      if (effect.operation === "execute") {
        assert(
          manifest.capabilities.apply.includes("shell.verify"),
          "execute effect requires shell.verify",
        );
      }
      if (effect.operation === "network-read") {
        assert(
          manifest.capabilities.apply.includes("network.public-read"),
          "network-read effect requires network.public-read",
        );
      }
      if (effect.authorization === "HUMAN_GATE") {
        assert(
          riskRank[manifest.risk.ceiling] >= riskRank.R3,
          "human-gated effect requires risk ceiling R3 or R4",
        );
      }
      if (effect.gateWhen) {
        assert(
          effect.authorization === "MODE_APPLY" &&
            riskRank[manifest.risk.ceiling] >= riskRank.R3,
          "conditional gate requires MODE_APPLY baseline and R3/R4 ceiling",
        );
      }
      if (effect.authorization === "MANUAL_ONLY") {
        assert(
          riskRank[manifest.risk.ceiling] === riskRank.R4,
          "manual-only effect requires risk ceiling R4",
        );
      }
      if (effect.ownership === "structural-merge") {
        assert(
          effect.paths.every((effectPath) =>
            structuredPathPattern.test(
              effectPath.replace(/y\*ml/g, "yaml").replaceAll("*", "x"),
            ),
          ),
          "structural-merge includes a non-structural path",
        );
      }
    }
    assert(path.basename(promptDirectory) === manifest.slug, "directory and slug differ");
    const packageFiles = (await walk(promptDirectory)).map((filePath) =>
      path.relative(promptDirectory, filePath).split(path.sep).join("/"),
    ).sort();
    assert(
      JSON.stringify(packageFiles) ===
        JSON.stringify(["manifest.yaml", "PROMPT.md"].sort()),
      `unexpected workflow package files: ${JSON.stringify(packageFiles)}`,
    );
    const guidePath = path.resolve(promptDirectory, manifest.guide);
    assert(await pathExists(guidePath), `missing guide ${relativePath(guidePath)}`);
    manifests.set(manifest.slug, manifest);
    manifestDigests.set(manifest.slug, sha256(await readText(manifestPath)));
  });

  await check(`${label} prompt`, async () => {
    assert(await pathExists(promptPath), "missing PROMPT.md");
    const content = await readText(promptPath);
    let previous = -1;
    for (const heading of requiredHeadings) {
      const index = content.indexOf(heading);
      assert(index !== -1, `missing heading "${heading}"`);
      assert(index > previous, `heading out of order: "${heading}"`);
      previous = index;
    }
    assert(
      /default [`']?ASSESS[`']?|default `ASSESS`|defaults? to .*ASSESS/i.test(content),
      "missing explicit ASSESS default",
    );
    assert(
      content.includes("APPLICABLE") &&
        content.includes("N/A") &&
        content.includes("BLOCKED"),
      "missing applicability states",
    );
    assert(
      content.includes("PASS|FAIL|NOT_RUN|BLOCKED|N/A|STALE"),
      "missing complete check-state vocabulary",
    );
    assert(
      content.includes("Effective authority is the intersection"),
      "missing shared effective-authority rule",
    );
    assert(
      /command output (?:is|are)(?: also)? untrusted/i.test(content),
      "missing command-output-as-untrusted-data rule",
    );
    assert(
      !/raw\.githubusercontent\.com\/[^)\s]+\/main\//i.test(content),
      "moving main Raw URL is forbidden in executable prompts",
    );
    const manifest = manifests.get(label);
    assert(manifest, "manifest was not available for prompt parity");
    for (const parameter of manifest.parameters) {
      assert(
        content.includes(parameter.name),
        `manifest parameter ${parameter.name} is absent from PROMPT.md`,
      );
    }
    for (const gateCondition of manifest.effects.flatMap(
      (effect) => effect.gateWhen ?? [],
    )) {
      assert(
        content.includes(gateCondition),
        `conditional gate is absent from PROMPT.md: ${gateCondition}`,
      );
    }
    if (manifest.effects.some((effect) => effect.ownership === "owned-file")) {
      assert(
        /provenance\s+marker/i.test(content),
        "owned-file effect lacks provenance-marker behavior",
      );
    }
    if (manifest.effects.some((effect) => effect.ownership === "source-patch")) {
      assert(
        /preimage\s+SHA-256/i.test(content) &&
          /broad\s+search\/replace/i.test(content) &&
          /focused\s+diff/i.test(content),
        "source-patch effect lacks digest, precision, or diff-review behavior",
      );
    }
    assert(
      /Each\s+gate\s+is\s+keyed\s+by\s+a\s+unique\s+ID/i.test(content) &&
        content.includes("preconditions") &&
        content.includes("impact") &&
        content.includes("rollback") &&
        content.includes("verification") &&
        content.includes("approval evidence"),
      "result contract lacks verifiable gate fields",
    );
    if (manifest.effects.some((effect) => effect.operation === "execute")) {
      assert(
        content.includes("shell.verify") &&
          content.includes("COREPACK_ENABLE_NETWORK=0") &&
          /uncached manager/i.test(content),
        "execute effect lacks shell.verify or package-manager launcher containment",
      );
    }
    if (manifest.effects.some((effect) => effect.operation === "network-read")) {
      assert(
        /transmit (?:no|neither)|do not transmit/i.test(content),
        "network-read effect lacks transmission boundary",
      );
    }
  });

  catalogIds.push(workflow.id);
  catalogSlugs.push(workflow.slug);
}

await check("catalog identity", async () => {
  assert(
    sortedUnique(catalogIds).length === catalogIds.length,
    "workflow IDs must be unique",
  );
  assert(
    sortedUnique(catalogSlugs).length === catalogSlugs.length,
    "workflow slugs must be unique",
  );
  const expectedIds = catalog.workflows.map(
    (_, index) => `HLY-${String(index + 1).padStart(3, "0")}`,
  );
  assert(
    JSON.stringify(catalogIds) === JSON.stringify(expectedIds),
    "workflow IDs must be ordered and contiguous",
  );
  const promptRoot = path.join(rootDir, "prompts");
  const promptEntries = await walk(promptRoot, {
    includeDirectories: true,
  });
  const promptDirectories = [];
  for (const entryPath of promptEntries) {
    if (
      path.dirname(entryPath) === promptRoot &&
      (await lstat(entryPath)).isDirectory()
    ) {
      promptDirectories.push(path.basename(entryPath));
    }
  }
  promptDirectories.sort();
  assert(
    JSON.stringify(promptDirectories) ===
      JSON.stringify([...catalogSlugs].sort()),
    `prompt directories differ from catalog: ${JSON.stringify(promptDirectories)}`,
  );
});

await check("workflow dependencies", async () => {
  const known = new Set(catalogSlugs);
  const riskRank = { R0: 0, R1: 1, R2: 2, R3: 3, R4: 4 };
  for (const [slug, manifest] of manifests) {
    for (const dependency of manifest.requires) {
      assert(known.has(dependency), `${slug} requires unknown ${dependency}`);
      assert(dependency !== slug, `${slug} cannot require itself`);
    }
    const completedStages = new Set(manifest.requires);
    if (manifest.composes?.length) {
      const lockedStages = manifest.compositionLock.stages;
      assert(
        JSON.stringify(lockedStages.map((stage) => stage.slug)) ===
          JSON.stringify(manifest.composes),
        `${slug} composition lock order differs from composes`,
      );
      assert(
        manifest.compositionLock.terminal === manifest.composes.at(-1),
        `${slug} composition terminal must be the final stage`,
      );
      if (slug === "setup-workspace") {
        assert(
          manifest.compositionLock.terminal === "verify-repository-readiness",
          "setup-workspace must terminate with readiness verification",
        );
        assert(
          JSON.stringify(resultSchema.$defs.setupStages.required) ===
            JSON.stringify(manifest.composes),
          "setup result stage schema differs from composition order",
        );
      }
      const parentPrompt = await readText(
        path.join(rootDir, `prompts/${slug}/PROMPT.md`),
      );
      for (const gate of manifest.compositionGates ?? []) {
        assert(
          parentPrompt.replace(/\s+/g, " ").includes(gate.description),
          `${slug} prompt omits composition gate ${gate.id}`,
        );
      }
      if (slug === "setup-workspace") {
        assert(
          manifest.compositionGates?.some(
            (gate) => gate.condition === "MULTIPLE_GIT_ROOT_WRITES",
          ),
          "setup-workspace must gate multi-Git-root writes",
        );
      }
      for (const lockedStage of lockedStages) {
        const child = manifests.get(lockedStage.slug);
        assert(
          child.version === lockedStage.version,
          `${slug} locks the wrong ${lockedStage.slug} version`,
        );
        assert(
          manifestDigests.get(lockedStage.slug) ===
            lockedStage.manifestSha256,
          `${slug} composition digest is stale for ${lockedStage.slug}`,
        );
        assert(
          parentPrompt.includes(
            `${lockedStage.slug}@${lockedStage.version} manifest-sha256:${lockedStage.manifestSha256}`,
          ),
          `${slug} prompt omits composition lock for ${lockedStage.slug}`,
        );
      }
    }
    for (const childSlug of manifest.composes ?? []) {
      assert(known.has(childSlug), `${slug} composes unknown ${childSlug}`);
      assert(childSlug !== slug, `${slug} cannot compose itself`);
      const child = manifests.get(childSlug);
      assert(
        !(child.composes?.length),
        `${slug} cannot compose nested composition ${childSlug}`,
      );
      for (const dependency of child.requires) {
        assert(
          completedStages.has(dependency),
          `${slug} composes ${childSlug} before required ${dependency}`,
        );
      }
      for (const capability of child.capabilities.apply) {
        assert(
          manifest.capabilities.apply.includes(capability),
          `${slug} must declare composed capability ${capability}`,
        );
      }
      assert(
        riskRank[manifest.risk.ceiling] >= riskRank[child.risk.ceiling],
        `${slug} risk ceiling is below composed ${childSlug}`,
      );
      completedStages.add(childSlug);
    }
  }

  const visiting = new Set();
  const visited = new Set();
  function visit(slug) {
    if (visited.has(slug)) return;
    assert(!visiting.has(slug), `dependency cycle includes ${slug}`);
    visiting.add(slug);
    for (const dependency of manifests.get(slug)?.requires ?? []) {
      visit(dependency);
    }
    visiting.delete(slug);
    visited.add(slug);
  }
  for (const slug of catalogSlugs) visit(slug);
});

await check("workflow scenarios", async () => {
  const fixtureCatalog = await readYaml(
    path.join(rootDir, "tests/fixtures/catalog.yaml"),
  );
  const fixtureIds = new Set(fixtureCatalog.fixtures.map((fixture) => fixture.id));

  for (const slug of catalogSlugs) {
    const scenarioPath = path.join(rootDir, `tests/scenarios/${slug}.yaml`);
    assert(
      await pathExists(scenarioPath),
      `missing tests/scenarios/${slug}.yaml`,
    );
    const scenario = await readYaml(scenarioPath);
    assert(
      validateScenario(scenario),
      `${slug}: ${schemaMessage(validateScenario)}`,
    );
    assert(scenario.workflow === slug, `${slug}: scenario workflow mismatch`);
    const caseIds = scenario.cases.map((testCase) => testCase.id);
    assert(
      new Set(caseIds).size === caseIds.length,
      `${slug}: scenario case IDs must be unique`,
    );
    const manifest = manifests.get(slug);
    const effectiveManifests = [
      manifest,
      ...(manifest.composes ?? []).map((child) => manifests.get(child)),
    ];
    const declaredPaths = effectiveManifests.flatMap((current) =>
      current.effects.flatMap((effect) => effect.paths),
    );
    for (const testCase of scenario.cases) {
      assert(
        fixtureIds.has(testCase.fixture),
        `${slug}/${testCase.id}: unknown fixture ${testCase.fixture}`,
      );
      if (
        testCase.mode === "ASSESS" ||
        ["N/A", "BLOCKED"].includes(testCase.expectApplicability)
      ) {
        assert(
          testCase.allowedWrites.length === 0,
          `${slug}/${testCase.id}: non-applying cases must allow no writes`,
        );
      }
      for (const allowedPath of testCase.allowedWrites) {
        assert(
          isAllowedWritePattern(allowedPath, declaredPaths),
          `${slug}/${testCase.id}: allowed write ${allowedPath} is outside manifest effects`,
        );
      }
    }
  }
});

await check("agent evaluation records", async () => {
  const fixtureCatalog = await readYaml(
    path.join(rootDir, "tests/fixtures/catalog.yaml"),
  );
  const fixtures = new Map(
    fixtureCatalog.fixtures.map((fixture) => [fixture.id, fixture]),
  );
  const evalDirectory = path.join(rootDir, "tests/evals");
  const evalFiles = (await walk(evalDirectory)).filter((filePath) =>
    filePath.endsWith(".yaml"),
  );
  assert(evalFiles.length > 0, "no agent evaluation records found");
  const evalIds = new Set();

  async function fixtureDigest(fixtureRoot) {
    return digestTree(fixtureRoot);
  }

  for (const filePath of evalFiles) {
    const record = await readYaml(filePath);
    assert(
      validateEval(record),
      `${relativePath(filePath)}: ${schemaMessage(validateEval)}`,
    );
    assert(!evalIds.has(record.id), `${relativePath(filePath)}: duplicate eval ID`);
    evalIds.add(record.id);
    assert(
      manifests.has(record.workflow),
      `${relativePath(filePath)}: unknown workflow`,
    );
    assert(
      fixtures.has(record.fixture),
      `${relativePath(filePath)}: unknown fixture`,
    );
    if (record.status === "not-run") {
      assert(record.workflowDigest === "NOT_RUN", "not-run workflow digest must be NOT_RUN");
      assert(record.fixtureDigest === "NOT_RUN", "not-run fixture digest must be NOT_RUN");
      assert(record.observedAt === null, "not-run observedAt must be null");
      assert(
        record.invariants.every((invariant) => invariant.state === "NOT_RUN"),
        `${relativePath(filePath)}: not-run record contains observed invariant state`,
      );
      continue;
    }

    assert(
      typeof record.observedAt === "string" &&
        !Number.isNaN(Date.parse(record.observedAt)),
      `${relativePath(filePath)}: observedAt must be ISO date-time`,
    );
    const promptContent = await readText(
      path.join(rootDir, `prompts/${record.workflow}/PROMPT.md`),
    );
    const currentWorkflowDigest = sha256(promptContent);
    const currentFixtureDigest = await fixtureDigest(
      path.join(rootDir, fixtures.get(record.fixture).root),
    );
    if (record.status !== "stale") {
      assert(
        record.workflowDigest === currentWorkflowDigest,
        `${relativePath(filePath)}: workflow evidence is stale`,
      );
      assert(
        record.fixtureDigest === currentFixtureDigest,
        `${relativePath(filePath)}: fixture evidence is stale`,
      );
    }
    if (record.status === "observed-pass") {
      assert(
        record.invariants.every((invariant) =>
          ["PASS", "N/A"].includes(invariant.state),
        ),
        `${relativePath(filePath)}: observed-pass contains a non-passing invariant`,
      );
    }
    if (record.status === "observed-fail") {
      assert(
        record.invariants.some((invariant) => invariant.state === "FAIL"),
        `${relativePath(filePath)}: observed-fail has no failed invariant`,
      );
    }
    if (record.status === "partial") {
      assert(
        record.invariants.some(
          (invariant) => !["PASS", "N/A"].includes(invariant.state),
        ),
        `${relativePath(filePath)}: partial record has no incomplete invariant`,
      );
    }
    if (record.mode === "ASSESS" || record.applicability !== "APPLICABLE") {
      assert(
        record.changedPaths.length === 0 &&
          record.beforeTreeDigest === record.afterTreeDigest,
        `${relativePath(filePath)}: read-only/non-applicable eval changed the tree`,
      );
    }
    if (record.mode === "APPLY" && record.applicability === "APPLICABLE") {
      assert(
        /^[a-f0-9]{64}$/.test(record.secondRunTreeDigest),
        `${relativePath(filePath)}: APPLY eval lacks second-run tree digest`,
      );
    }
  }
});

for (const profileName of ["standard", "advanced"]) {
  await check(`${profileName} profile`, async () => {
    const filePath = path.join(rootDir, `profiles/${profileName}.yaml`);
    const profile = await readYaml(filePath);
    assert(validateProfile(profile), schemaMessage(validateProfile));
    const artifactPaths = profile.artifacts.map((artifact) => artifact.path);
    assert(
      new Set(artifactPaths).size === artifactPaths.length,
      `${profileName} profile has duplicate artifact paths`,
    );
    const requiredArtifacts =
      profileName === "standard"
        ? [
            "AGENTS.md",
            "CLAUDE.md",
            "DESIGN.md",
            "HARNESS.md",
            "docs/design/",
            "docs/inventory/",
            "docs/harness/",
            "scripts/verify-*",
            ".github/workflows/verify.yml",
            "docs/decisions/",
            "docs/tasks/",
            "docs/learnings.md",
            ".agents/skills/",
          ]
        : [
            "orchestrator/AGENTS.md",
            "orchestrator/CLAUDE.md",
            "orchestrator/DESIGN.md",
            "orchestrator/HARNESS.md",
            "orchestrator/projects.yaml",
            "orchestrator/docs/routing/",
            "orchestrator/docs/inventory/",
            "orchestrator/docs/harness/",
            "orchestrator/docs/tasks/",
            "orchestrator/docs/decisions/",
            "orchestrator/docs/policies/",
            "orchestrator/.agents/skills/",
          ];
    assert(
      requiredArtifacts.every((artifactPath) =>
        artifactPaths.includes(artifactPath),
      ),
      `${profileName} profile metadata omits shipped setup artifacts`,
    );
  });
}

await check("project registries", async () => {
  const registryFiles = (await walk(path.join(rootDir, "tests/fixtures"))).filter(
    (filePath) => path.basename(filePath) === "projects.yaml",
  );
  assert(registryFiles.length > 0, "no Advanced project registry fixture found");
  for (const filePath of registryFiles) {
    const registry = await readYaml(filePath);
    assert(
      validateProjects(registry),
      `${relativePath(filePath)}: ${schemaMessage(validateProjects)}`,
    );
    const ids = registry.projects.map((project) => project.id);
    assert(
      new Set(ids).size === ids.length,
      `${relativePath(filePath)} has duplicate project IDs`,
    );
    const projectPaths = registry.projects.map((project) => project.path);
    assert(
      new Set(projectPaths).size === projectPaths.length,
      `${relativePath(filePath)} has duplicate project paths`,
    );
    const registryDirectory = path.dirname(filePath);
    const boundary = await realpath(
      path.resolve(registryDirectory, registry.authorizedRoot),
    );
    const routingDocument = path.resolve(
      registryDirectory,
      registry.routingDoc,
    );
    assert(
      await pathExists(routingDocument),
      `${relativePath(filePath)} routing document is missing`,
    );
    for (const project of registry.projects) {
      const unresolved = path.resolve(registryDirectory, project.path);
      assert(
        await pathExists(unresolved),
        `${relativePath(filePath)} project ${project.id} path is missing`,
      );
      const resolved = await realpath(unresolved);
      const relative = path.relative(boundary, resolved);
      assert(
        relative !== ".." && !relative.startsWith(`..${path.sep}`),
        `${relativePath(filePath)} project ${project.id} escapes authorizedRoot`,
      );
      const fixtureMarker = path.join(resolved, ".harnessly-git-root");
      assert(
        (await pathExists(path.join(resolved, ".git"))) ||
          (relativePath(filePath).startsWith("tests/fixtures/") &&
            (await pathExists(fixtureMarker))),
        `${relativePath(filePath)} project ${project.id} has no Git-root marker`,
      );
      for (const field of ["entrypoint", "harness"]) {
        const referencedPath = path.resolve(resolved, project[field]);
        assert(
          await pathExists(referencedPath),
          `${relativePath(filePath)} project ${project.id} ${field} is missing`,
        );
        const resolvedReference = await realpath(referencedPath);
        const referencedRelative = path.relative(resolved, resolvedReference);
        assert(
          referencedRelative !== ".." &&
            !referencedRelative.startsWith(`..${path.sep}`),
          `${relativePath(filePath)} project ${project.id} ${field} escapes its root`,
        );
      }
    }
  }
});

await check("agent skills", async () => {
  const skillRoot = path.join(rootDir, ".agents/skills");
  const files = (await walk(skillRoot)).filter(
    (filePath) => path.basename(filePath) === "SKILL.md",
  );
  assert(files.length > 0, "no canonical skills found");
  for (const filePath of files) {
    const content = await readText(filePath);
    const { data } = parseFrontmatter(content, relativePath(filePath));
    const directoryName = path.basename(path.dirname(filePath));
    assert(data.name === directoryName, `${relativePath(filePath)} name mismatch`);
    assert(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.name),
      `${relativePath(filePath)} has invalid skill name`,
    );
    assert(
      typeof data.description === "string" &&
        data.description.length > 20 &&
        data.description.length <= 1024,
      `${relativePath(filePath)} has invalid description`,
    );
  }
});

await check("Cursor rules", async () => {
  const ruleRoot = path.join(rootDir, ".cursor/rules");
  const files = (await walk(ruleRoot)).filter((filePath) =>
    filePath.endsWith(".mdc"),
  );
  for (const filePath of files) {
    const { data } = parseFrontmatter(
      await readText(filePath),
      relativePath(filePath),
    );
    assert(
      typeof data.description === "string" && data.description.length > 8,
      `${relativePath(filePath)} needs a description`,
    );
    assert(
      typeof data.alwaysApply === "boolean",
      `${relativePath(filePath)} needs boolean alwaysApply`,
    );
  }
});

function githubAnchor(content, anchor) {
  const headings = content
    .split("\n")
    .filter((line) => /^#{1,6}\s+/.test(line))
    .map((line) =>
      line
        .replace(/^#{1,6}\s+/, "")
        .trim()
        .toLowerCase()
        .replace(/[`*_~]/g, "")
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-"),
    );
  return headings.includes(anchor.toLowerCase());
}

await check("local Markdown links", async () => {
  const files = (await walk(rootDir)).filter((filePath) =>
    /\.(?:md|mdc)$/i.test(filePath),
  );
  const linkPattern = /!?\[[^\]]*]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;

  for (const filePath of files) {
    const content = await readText(filePath);
    for (const match of content.matchAll(linkPattern)) {
      let target = match[1].replace(/^<|>$/g, "");
      if (
        target.startsWith("#") ||
        /^(?:https?:|mailto:|data:)/i.test(target) ||
        target.includes("<VERSION_OR_COMMIT>") ||
        target.includes("<VERSAO_OU_COMMIT>")
      ) {
        continue;
      }
      const [targetPathPart, anchor] = target.split("#", 2);
      const decoded = decodeURIComponent(targetPathPart);
      let resolved = path.resolve(path.dirname(filePath), decoded);
      const relative = path.relative(rootDir, resolved);
      assert(
        relative !== ".." && !relative.startsWith(`..${path.sep}`),
        `${relativePath(filePath)} link escapes repository: ${target}`,
      );
      assert(
        await pathExists(resolved),
        `${relativePath(filePath)} has missing link: ${target}`,
      );
      if (anchor) {
        const targetContent = await readText(resolved);
        assert(
          githubAnchor(targetContent, anchor),
          `${relativePath(filePath)} has missing anchor: ${target}`,
        );
      }
    }
  }
});

await check("text hygiene", async () => {
  const suspiciousUnicode = /[\u200B-\u200D\u202A-\u202E\u2066-\u2069\uFEFF]/u;
  const posixHomePrefix = `/${["Users"].join("")}/`;
  const windowsHomePrefix = `C:\\${["Users"].join("")}\\`;
  const textExtensions = new Set([
    ".json",
    ".md",
    ".mdc",
    ".mjs",
    ".toml",
    ".yaml",
    ".yml",
  ]);
  const files = await walk(rootDir);
  for (const filePath of files) {
    if (
      relativePath(filePath).startsWith("LICENSES/") ||
      !textExtensions.has(path.extname(filePath))
    ) {
      continue;
    }
    const content = await readText(filePath);
    assert(content.endsWith("\n"), `${relativePath(filePath)} lacks final newline`);
    assert(
      !/[ \t]+$/m.test(content),
      `${relativePath(filePath)} contains trailing whitespace`,
    );
    assert(
      !suspiciousUnicode.test(content),
      `${relativePath(filePath)} contains bidi or zero-width controls`,
    );
    assert(
      !content.includes(posixHomePrefix) &&
        !content.includes(windowsHomePrefix),
      `${relativePath(filePath)} contains an absolute user path`,
    );
  }
});

await check("licenses", async () => {
  for (const license of ["Apache-2.0.txt", "CC-BY-4.0.txt"]) {
    const filePath = path.join(rootDir, "LICENSES", license);
    assert(await pathExists(filePath), `missing LICENSES/${license}`);
    assert((await readText(filePath)).length > 5000, `${license} looks incomplete`);
  }
  assert(await pathExists(path.join(rootDir, "OUTPUT-EXCEPTION.md")), "missing output exception");
  const reusePath = path.join(rootDir, "REUSE.toml");
  assert(await pathExists(reusePath), "missing REUSE mapping");
  const reuse = await readText(reusePath);
  const annotations = reuse
    .split("[[annotations]]")
    .slice(1)
    .map((block) => {
      const paths = block.match(/path\s*=\s*\[([\s\S]*?)\]/)?.[1] ?? "";
      const license = block.match(/SPDX-License-Identifier\s*=\s*"([^"]+)"/)?.[1];
      return {
        patterns: [...paths.matchAll(/"([^"]+)"/g)].map((match) => match[1]),
        license,
      };
    });
  assert(annotations.length === 2, "REUSE mapping must define two license families");
  for (const filePath of await walk(rootDir)) {
    const relative = relativePath(filePath);
    if (relative.startsWith("LICENSES/")) continue;
    const matches = annotations.filter((annotation) =>
      isAllowedWritePattern(relative, annotation.patterns),
    );
    assert(
      matches.length === 1,
      `${relative}: expected exactly one REUSE annotation, found ${matches.length}`,
    );
    assert(
      ["Apache-2.0", "CC-BY-4.0"].includes(matches[0].license),
      `${relative}: unsupported REUSE license`,
    );
  }
});

await check("workflow action pinning", async () => {
  const workflowRoot = path.join(rootDir, ".github/workflows");
  if (!(await pathExists(workflowRoot))) return;
  const files = await walk(workflowRoot);
  for (const filePath of files) {
    const content = await readText(filePath);
    for (const match of content.matchAll(/uses:\s*([^\s#]+)@([^\s#]+)/g)) {
      assert(
        /^[a-f0-9]{40}$/i.test(match[2]),
        `${relativePath(filePath)} action ${match[1]} is not pinned to a full SHA`,
      );
    }
  }
});

if (errors.length > 0) {
  console.error(`Harnessly validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Harnessly validation passed: ${catalog.workflows.length} workflows, 2 profiles.`,
);
