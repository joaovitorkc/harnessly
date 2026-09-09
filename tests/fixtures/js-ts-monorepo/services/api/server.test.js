import test from "node:test";
import assert from "node:assert/strict";

test("synthetic HTTP test surface exists", () => {
  assert.equal(typeof test, "function");
});
