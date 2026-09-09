function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  }
  return value;
}

function sameValue(left, right) {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

export function assertSetupResultSemantics(result, composedStages) {
  if (
    result.workflow !== "setup-workspace" ||
    result.details?.setupDepth !== "COMPLETE"
  ) {
    return true;
  }

  const stageNames = Object.keys(result.details.stages ?? {});
  invariant(
    JSON.stringify(stageNames) === JSON.stringify(composedStages),
    "complete setup stage order differs from composition",
  );

  const referencedGates = new Set();
  for (const [stageName, stage] of Object.entries(result.details.stages)) {
    for (const [gateId, gate] of Object.entries(stage.gates)) {
      referencedGates.add(gateId);
      invariant(
        Object.hasOwn(result.gates, gateId),
        `${stageName} references missing gate ${gateId}`,
      );
      invariant(
        sameValue(result.gates[gateId], gate),
        `${stageName} gate ${gateId} differs from the global record`,
      );
    }
  }
  for (const gateId of Object.keys(result.gates)) {
    invariant(
      referencedGates.has(gateId),
      `global gate ${gateId} is absent from every stage`,
    );
  }

  if (result.mode !== "APPLY") return true;

  const states = ["PASS", "FAIL", "NOT_RUN", "BLOCKED", "N/A", "STALE"];
  const actualCounts = Object.fromEntries(states.map((state) => [state, 0]));
  for (const criterion of result.details.readiness.mandatoryCriteria) {
    actualCounts[criterion.state] += 1;
  }
  invariant(
    sameValue(actualCounts, result.details.readiness.counts),
    "readiness counts differ from mandatory criteria",
  );

  const grade =
    actualCounts.FAIL > 0
      ? "NOT_READY"
      : actualCounts.NOT_RUN + actualCounts.BLOCKED + actualCounts.STALE > 0
        ? "CONDITIONALLY_READY"
        : "READY";
  invariant(
    result.details.readiness.grade === grade,
    "readiness grade differs from mandatory criteria",
  );

  if (result.status === "APPLIED") {
    for (const [stageName, stage] of Object.entries(result.details.stages)) {
      invariant(
        ["APPLIED", "NO_CHANGE", "N/A"].includes(stage.state),
        `APPLIED result contains incomplete stage ${stageName}`,
      );
      invariant(
        stage.checks.every((check) => ["PASS", "N/A"].includes(check.state)),
        `APPLIED result contains a non-passing check in ${stageName}`,
      );
      invariant(
        Object.values(stage.gates).every((gate) =>
          ["approved", "not-needed"].includes(gate.state),
        ),
        `APPLIED result contains an unresolved gate in ${stageName}`,
      );
    }
    invariant(grade === "READY", "APPLIED setup is not READY");
  }

  return true;
}
