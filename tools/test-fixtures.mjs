import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import {
  assert,
  digestTree,
  readText,
  readYaml,
  rootDir,
  sortedUnique,
  walk,
} from "./lib.mjs";

const catalogPath = path.join(rootDir, "tests/fixtures/catalog.yaml");
const schemaPath = path.join(rootDir, "contracts/v1/fixture.schema.json");
const catalog = await readYaml(catalogPath);
const schema = JSON.parse(await readText(schemaPath));
const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

assert(
  validate(catalog),
  (validate.errors ?? [])
    .map((entry) => `${entry.instancePath || "/"} ${entry.message}`)
    .join("; "),
);

function slash(relative) {
  return relative.split(path.sep).join("/");
}

async function detectFixture(directory) {
  const files = await walk(directory);
  const relativeFiles = files.map((filePath) =>
    slash(path.relative(directory, filePath)),
  );
  const manifests = [];
  const ecosystems = new Set();
  const packageManagers = new Set();
  let ownedServerSignal = false;
  let hasHttpTestSurface = false;

  for (let index = 0; index < files.length; index += 1) {
    const filePath = files[index];
    const relative = relativeFiles[index];
    const base = path.basename(filePath);

    if (base === "UNTRUSTED-INSTRUCTIONS.txt") continue;

    if (base === "package.json") {
      manifests.push(relative);
      ecosystems.add("javascript-typescript");
      JSON.parse(await readText(filePath));
    } else if (base === "pyproject.toml") {
      manifests.push(relative);
      ecosystems.add("python");
    } else if (base === "go.mod") {
      manifests.push(relative);
      ecosystems.add("go");
      packageManagers.add("go-modules");
    } else if (base === "Cargo.toml") {
      manifests.push(relative);
      ecosystems.add("rust");
      packageManagers.add("cargo");
    } else if (base === "pom.xml") {
      manifests.push(relative);
      ecosystems.add("java");
      packageManagers.add("maven");
    } else if (/\.csproj$/i.test(base)) {
      manifests.push(relative);
      ecosystems.add("dotnet");
      packageManagers.add("nuget");
    } else if (base === "index.html") {
      manifests.push(relative);
      ecosystems.add("static-web");
    }

    if (base === "pnpm-lock.yaml") packageManagers.add("pnpm");
    if (base === "package-lock.json") packageManagers.add("npm");
    if (base === "yarn.lock") packageManagers.add("yarn");
    if (base === "bun.lock" || base === "bun.lockb") packageManagers.add("bun");
    if (base === "uv.lock") packageManagers.add("uv");
    if (base === "poetry.lock") packageManagers.add("poetry");
    if (/^requirements(?:\..+)?\.txt$/.test(base)) packageManagers.add("pip");

    if (
      /(?:^|\/)(?:tests?|__tests__)\//.test(relative) ||
      /(?:^test_|[._](?:test|spec)\.)/.test(base)
    ) {
      hasHttpTestSurface = true;
    }

    if (/\.(?:js|jsx|ts|tsx|mjs|cjs|py|go|cs|java|kt)$/i.test(base)) {
      const content = await readText(filePath);
      if (
        (/\bexpress\s*\(/.test(content) &&
          /\.(?:get|post|put|patch|delete|use)\s*\(/.test(content)) ||
        /\bFastAPI\s*\(/.test(content) ||
        /\bFlask\s*\(/.test(content) ||
        /\bnet\/http\b/.test(content) ||
        /\bWebApplication\.CreateBuilder\b/.test(content) ||
        /@(?:RestController|Controller)\b/.test(content)
      ) {
        ownedServerSignal = true;
      }
    }
  }

  let rateLimit = "N/A";
  if (ownedServerSignal) {
    rateLimit = hasHttpTestSurface ? "APPLICABLE" : "BLOCKED";
  }

  return {
    ecosystems: sortedUnique(ecosystems),
    packageManagers: sortedUnique(packageManagers),
    manifests: sortedUnique(manifests),
    rateLimit,
  };
}

for (const fixture of catalog.fixtures) {
  const fixtureRoot = path.join(rootDir, fixture.root);
  const before = await digestTree(fixtureRoot);
  const detected = await detectFixture(fixtureRoot);
  const after = await digestTree(fixtureRoot);

  assert(before === after, `${fixture.id}: assessment changed fixture bytes`);
  assert(
    JSON.stringify(detected) ===
      JSON.stringify({
        ecosystems: sortedUnique(fixture.expected.ecosystems),
        packageManagers: sortedUnique(fixture.expected.packageManagers),
        manifests: sortedUnique(fixture.expected.manifests),
        rateLimit: fixture.expected.rateLimit,
      }),
    `${fixture.id}: expected ${JSON.stringify(fixture.expected)}, detected ${JSON.stringify(detected)}`,
  );

  const canaryPath = path.join(fixtureRoot, "UNTRUSTED-INSTRUCTIONS.txt");
  const canary = await readText(canaryPath);
  const canaryValue = canary.match(/SYNTHETIC_UNTRUSTED_CANARY=([^\n]+)/)?.[1];
  assert(canaryValue, `${fixture.id}: missing synthetic canary`);
  assert(
    !JSON.stringify(detected).includes(canaryValue),
    `${fixture.id}: untrusted canary leaked into inventory`,
  );
}

console.log(`Fixture tests passed: ${catalog.fixtures.length} project shapes.`);
