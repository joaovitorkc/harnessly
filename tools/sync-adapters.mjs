import path from "node:path";
import {
  compareStrings,
  parseFrontmatter,
  pathExists,
  readText,
  relativePath,
  rootDir,
  walk,
  writeStable,
} from "./lib.mjs";

const checkOnly = process.argv.includes("--check");
const expected = new Map();

const skillRoot = path.join(rootDir, ".agents/skills");
const skillFiles = await walk(skillRoot);

for (const sourcePath of skillFiles) {
  const relative = path.relative(skillRoot, sourcePath);
  const targetPath = path.join(rootDir, ".claude/skills", relative);
  expected.set(targetPath, await readText(sourcePath));
}

const canonicalAgentPath = path.join(rootDir, "agents/prompt-reviewer.md");
const canonicalAgent = parseFrontmatter(
  await readText(canonicalAgentPath),
  "agents/prompt-reviewer.md",
);
const description = canonicalAgent.data.description;
const generatedNotice =
  "<!-- Generated from agents/prompt-reviewer.md; do not edit directly. -->\n\n";

expected.set(
  path.join(rootDir, ".claude/agents/prompt-reviewer.md"),
  `---
name: prompt-reviewer
description: ${description}
tools: Read, Grep, Glob
model: inherit
permissionMode: plan
---

${generatedNotice}${canonicalAgent.body}`,
);

expected.set(
  path.join(rootDir, ".github/agents/prompt-reviewer.md"),
  `---
name: prompt-reviewer
description: ${description}
tools:
  - read
  - search
---

${generatedNotice}${canonicalAgent.body}`,
);

const mismatches = [];
let writes = 0;

for (const [targetPath, content] of [...expected.entries()].sort(([a], [b]) =>
  compareStrings(a, b),
)) {
  if (checkOnly) {
    if (!(await pathExists(targetPath))) {
      mismatches.push(`${relativePath(targetPath)} is missing`);
      continue;
    }
    const current = await readText(targetPath);
    const normalized = content.endsWith("\n") ? content : `${content}\n`;
    if (current !== normalized) {
      mismatches.push(`${relativePath(targetPath)} differs from its canonical source`);
    }
  } else if (await writeStable(targetPath, content)) {
    writes += 1;
    console.log(`updated ${relativePath(targetPath)}`);
  }
}

for (const generatedRoot of [
  path.join(rootDir, ".claude/skills"),
  path.join(rootDir, ".claude/agents"),
  path.join(rootDir, ".github/agents"),
]) {
  if (!(await pathExists(generatedRoot))) continue;
  for (const filePath of await walk(generatedRoot)) {
    if (!expected.has(filePath)) {
      mismatches.push(`${relativePath(filePath)} is an orphan generated adapter`);
    }
  }
}

if (mismatches.length > 0) {
  console.error("Generated adapter check failed:");
  for (const mismatch of mismatches) console.error(`- ${mismatch}`);
  process.exit(1);
}

if (checkOnly) {
  console.log(`Generated adapter check passed: ${expected.size} file(s).`);
} else {
  console.log(`Adapter sync complete: ${writes} changed, ${expected.size} total.`);
}
