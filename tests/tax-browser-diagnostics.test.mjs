import test from "node:test";
import assert from "node:assert/strict";
import diagnostics from "../scripts/tax-browser-diagnostics.cjs";
const { classifyConsoleError } = diagnostics;
const base = "https://middleages.github.io/my-books/";
const observed = { source: "https://middleages.github.io/favicon.ico", message: "Failed to load resource: the server responded with a status of 404 ()", page: `${base}#/tax` };
test("tax browser diagnostics separately retain only the observed host-default favicon404", () => {
  assert.deepEqual(classifyConsoleError(observed, base), { ...observed, kind: "host-default-favicon-404" });
  assert.deepEqual(observed, { source: "https://middleages.github.io/favicon.ico", message: "Failed to load resource: the server responded with a status of 404 ()", page: `${base}#/tax` });
});
test("tax browser diagnostics keep every app asset, unknown source, other status and favicon-text error fatal", () => {
  for (const entry of [
    { ...observed, source: `${base}assets/missing.js` },
    { ...observed, source: `${base}favicon.ico` },
    { ...observed, source: "https://example.com/favicon.ico" },
    { ...observed, source: "" },
    { ...observed, message: "Failed to load resource: the server responded with a status of 500 ()" },
    { ...observed, message: "Application failed while loading favicon configuration" },
  ]) assert.equal(classifyConsoleError(entry, base).kind, "application");
  assert.equal(classifyConsoleError(observed, "https://example.com/my-books/").kind, "application");
});
