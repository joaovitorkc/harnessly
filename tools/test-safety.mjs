import { mkdir, rm, symlink } from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import {
  assert,
  assertPublishableProvenance,
  assertSafePath,
  isAllowedWritePattern,
  readText,
  readYaml,
  resetDirectory,
  rootDir,
  validateReleaseName,
  validateSourceRevision,
  writeStable,
} from "./lib.mjs";

const ajv = new Ajv2020({ allErrors: true, strict: false });
const compile = async (name) =>
  ajv.compile(
    JSON.parse(await readText(path.join(rootDir, `contracts/v1/${name}`))),
  );

const validatePrompt = await compile("prompt.schema.json");
const validateProfile = await compile("profile.schema.json");
const validateScenario = await compile("scenario.schema.json");
const validateResult = await compile("result.schema.json");
const validateProjects = await compile("projects.schema.json");
const validateRelease = await compile("release.schema.json");
const validateEval = await compile("eval.schema.json");

function expectInvalid(validator, value, label) {
  assert(!validator(value), `${label}: unsafe value passed schema`);
}

function expectThrow(operation, label) {
  try {
    operation();
  } catch {
    return;
  }
  throw new Error(`${label}: expected rejection`);
}

async function expectReject(operation, label) {
  try {
    await operation();
  } catch {
    return;
  }
  throw new Error(`${label}: expected rejection`);
}

const prompt = await readYaml(
  path.join(rootDir, "prompts/setup-workspace/manifest.yaml"),
);

const escapedEffect = structuredClone(prompt);
escapedEffect.effects[0].paths = ["../../outside"];
expectInvalid(validatePrompt, escapedEffect, "effect path traversal");

const gitObjectEffect = structuredClone(prompt);
gitObjectEffect.effects[0].paths = [".git/config"];
expectInvalid(validatePrompt, gitObjectEffect, "effect into Git internals");

const mutatingAssess = structuredClone(prompt);
mutatingAssess.capabilities.assess.push("fs.write-declared");
expectInvalid(validatePrompt, mutatingAssess, "mutating ASSESS capability");

const executeWithoutCommand = structuredClone(prompt);
executeWithoutCommand.effects[0] = {
  operation: "execute",
  paths: [],
  ownership: "none",
  authorization: "MODE_APPLY",
};
expectInvalid(validatePrompt, executeWithoutCommand, "execute without command ID");

const ungatedInstall = structuredClone(prompt);
ungatedInstall.effects[0] = {
  operation: "install",
  paths: ["package.json"],
  ownership: "structural-merge",
  authorization: "MODE_APPLY",
};
expectInvalid(validatePrompt, ungatedInstall, "ungated dependency install");

const unguardedPatch = structuredClone(prompt);
unguardedPatch.effects[0] = {
  operation: "modify",
  paths: ["src/server.ts"],
  ownership: "source-patch",
  authorization: "MODE_APPLY",
};
expectInvalid(validatePrompt, unguardedPatch, "unguarded source patch");

const contradictoryGate = structuredClone(prompt);
contradictoryGate.effects[0].gateWhen = ["A condition requires another gate."];
contradictoryGate.effects[0].authorization = "HUMAN_GATE";
expectInvalid(validatePrompt, contradictoryGate, "contradictory conditional gate");

const standardProfile = await readYaml(
  path.join(rootDir, "profiles/standard.yaml"),
);
const escapedStandard = {
  ...standardProfile,
  topologies: ["PARENT_HUB"],
  controlPlane: "orchestrator",
};
expectInvalid(validateProfile, escapedStandard, "invalid Standard topology");

const scenario = await readYaml(
  path.join(rootDir, "tests/scenarios/setup-workspace.yaml"),
);
const assessWithWrites = structuredClone(scenario);
assessWithWrites.cases[0].allowedWrites = ["docs/**"];
expectInvalid(validateScenario, assessWithWrites, "ASSESS write allowance");

const result = await readYaml(
  path.join(rootDir, "contracts/v1/examples/result.yaml"),
);
const falseApplied = {
  ...result,
  mode: "ASSESS",
  applicability: "N/A",
  status: "APPLIED",
  changes: [
    {
      path: "docs/report.md",
      action: "created",
      reason: "unsafe state combination",
    },
  ],
  checks: [
    {
      name: "failing check",
      state: "FAIL",
      evidence: "synthetic failure",
    },
  ],
};
expectInvalid(validateResult, falseApplied, "false-green result");
expectInvalid(
  validateResult,
  { ...result, applicability: "N/A" },
  "N/A result with planned writes",
);
expectInvalid(
  validateResult,
  { ...result, status: "PARTIAL" },
  "ASSESS result reported as PARTIAL",
);

const emptyApplied = {
  ...result,
  mode: "APPLY",
  applicability: "APPLICABLE",
  status: "APPLIED",
  evidence: [],
  changes: [],
  gates: {},
  checks: [],
};
expectInvalid(validateResult, emptyApplied, "empty APPLIED result");

const deniedGateApplied = {
  ...emptyApplied,
  evidence: [
    { claim: "Synthetic evidence", source: "fixture", confidence: "high" },
  ],
  changes: [
    { path: "docs/report.md", action: "created", reason: "synthetic change" },
  ],
  gates: {
    "dependency-change": {
      risk: "R3",
      state: "denied",
      action: "Install a dependency",
      target: "package.json",
      preconditions: ["Exact version selected"],
      impact: "Changes dependency graph",
      rollback: "Restore manifest and lockfile",
      verification: "Run locked restore and project sensor",
    },
  },
  checks: [{ name: "synthetic", state: "PASS", evidence: "synthetic pass" }],
};
expectInvalid(validateResult, deniedGateApplied, "APPLIED with denied gate");

const approvedR4 = {
  ...result,
  gates: {
    "production-mutation": {
      ...deniedGateApplied.gates["dependency-change"],
      risk: "R4",
      state: "approved",
      authorizationEvidence: "Synthetic approval",
    },
  },
};
expectInvalid(validateResult, approvedR4, "workflow-approved R4 gate");

const embeddedRegistry = {
  schemaVersion: "harnessly.dev/projects/v1",
  workspace: "fixture",
  topology: "EMBEDDED",
  authorizedRoot: "..",
  projects: [{ id: "escape", path: "../other", gitRoot: true }],
};
expectInvalid(validateProjects, embeddedRegistry, "escaped embedded project");

const parentRegistry = {
  ...embeddedRegistry,
  topology: "PARENT_HUB",
  projects: [{ id: "escape", path: "../../outside", gitRoot: true }],
};
expectInvalid(validateProjects, parentRegistry, "parent project traversal");
expectInvalid(
  validateProjects,
  {
    ...parentRegistry,
    projects: [{ id: "git-internals", path: "../.git", gitRoot: true }],
  },
  "project path into Git internals",
);

const unpublishedRelease = {
  schemaVersion: "harnessly.dev/release/v1",
  release: "0.1.0-beta.1",
  contract: "v1",
  sourceRevision: "WORKTREE",
  publishable: true,
  files: [{ path: "README.md", sha256: "0".repeat(64), bytes: 1 }],
};
expectInvalid(validateRelease, unpublishedRelease, "publishable worktree release");
expectInvalid(
  validateRelease,
  { ...unpublishedRelease, publishable: false, files: [] },
  "empty release manifest",
);

const emptyEval = await readYaml(
  path.join(rootDir, "tests/evals/cursor-setup-standard.yaml"),
);
emptyEval.invariants = [];
expectInvalid(validateEval, emptyEval, "empty evaluation evidence");
const applyEvalWithoutSecondRun = {
  ...emptyEval,
  workflowDigest: "0".repeat(64),
  fixtureDigest: "1".repeat(64),
  host: "Synthetic host",
  model: "Synthetic model",
  status: "observed-pass",
  observedAt: "2026-09-08T12:00:00Z",
  applicability: "APPLICABLE",
  permissions: {
    filesystem: "DECLARED_WRITES",
    network: "DENIED",
    commands: "RESTRICTED_VERIFY",
  },
  beforeTreeDigest: "2".repeat(64),
  afterTreeDigest: "3".repeat(64),
  secondRunTreeDigest: "NOT_RUN",
  changedPaths: ["AGENTS.md"],
  diffEvidence: "Synthetic diff",
  invariants: [{ name: "Synthetic", state: "PASS", evidence: "Observed" }],
};
expectInvalid(
  validateEval,
  applyEvalWithoutSecondRun,
  "APPLY eval without second-run digest",
);

for (const invalidName of ["../victim", "../../../victim", "v0.1.0", "1.0.0/next"]) {
  expectThrow(() => validateReleaseName(invalidName), `release ${invalidName}`);
}
assert(validateReleaseName("0.1.0-beta.1") === "0.1.0-beta.1", "valid release rejected");
const revision = "0123456789abcdef0123456789abcdef01234567";
assert(validateSourceRevision(revision.toUpperCase()) === revision, "revision normalization failed");
for (const [label, provenance] of [
  ["revision mismatch", { headRevision: "f".repeat(40), porcelainStatus: "" }],
  ["dirty checkout", { headRevision: revision, porcelainStatus: " M README.md" }],
]) {
  expectThrow(
    () =>
      assertPublishableProvenance({
        sourceRevision: revision,
        sourcePaths: ["README.md"],
        trackedPaths: ["README.md"],
        ...provenance,
      }),
    label,
  );
}
expectThrow(
  () =>
    assertPublishableProvenance({
      sourceRevision: revision,
      headRevision: revision,
      porcelainStatus: "",
      sourcePaths: ["README.md", "UNTRACKED.md"],
      trackedPaths: ["README.md"],
    }),
  "untracked release source",
);
assert(
  assertPublishableProvenance({
    sourceRevision: revision,
    headRevision: revision,
    porcelainStatus: "",
    sourcePaths: ["README.md"],
    trackedPaths: ["README.md"],
  }),
  "clean matching revision rejected",
);
assert(
  !isAllowedWritePattern(".github/**", [".github/agents/**"]),
  "broad scenario glob escaped a narrower manifest glob",
);
assert(
  !isAllowedWritePattern("secrets/private.txt", ["**/scripts/verify-*"]),
  "literal secret path matched unrelated declared effects",
);
assert(
  isAllowedWritePattern("apps/api/package.json", ["**/package.json"]),
  "literal path did not match a containing manifest glob",
);

const safetyRoot = path.join(rootDir, ".tmp/safety-tests");
const outsideRoot = path.join(rootDir, ".tmp/safety-outside");
await resetDirectory(safetyRoot);
await resetDirectory(outsideRoot);
await mkdir(path.join(outsideRoot, "target"), { recursive: true });
await symlink(
  path.join(outsideRoot, "target"),
  path.join(safetyRoot, "escaped"),
  "dir",
);
await expectReject(
  () =>
    writeStable(
      path.join(safetyRoot, "escaped", "file.txt"),
      "must not be written",
      safetyRoot,
    ),
  "symlink write escape",
);
await expectReject(
  () => assertSafePath(safetyRoot, path.join(safetyRoot, "escaped", "file.txt")),
  "symlink path containment",
);

await assertSafePath(rootDir, safetyRoot);
await assertSafePath(rootDir, outsideRoot);
await rm(safetyRoot, { recursive: true, force: true });
await rm(outsideRoot, { recursive: true, force: true });

console.log("Safety tests passed: schemas, path containment, and release names.");
