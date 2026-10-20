import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import diagnostics from '../scripts/probability-browser-diagnostics.cjs';
const source = readFileSync(new URL('../scripts/probability-browser-qa.cjs', import.meta.url), 'utf8');
test('probability verifier records exact source/assets and full responsive interaction coverage', () => {
  for (const fragment of ['sourceSha', 'sourceTree', 'sourceChanges', 'sha256', '[1440,390,320]', '[768,900]', "reducedMotion:'reduce'", "reducedMotion:'no-preference'", 'assertDistribution', 'assertLoss', 'unknown/keep', 'pageErrors', 'consoleErrors', 'resourceErrors', 'static alternative', 'setting changes cancel playback', 'same dist', 'PNGs require a separate direct visual review']) {
    if (fragment === 'same dist') assert(source.includes('exact published HTML and full asset bytes match this dist'));
    else assert(source.includes(fragment), fragment);
  }
  assert(!source.includes('assertBars('));
});
test('only the exact known published host favicon404 is separated; unknown and app failures remain errors', () => {
  const base = 'https://middleages.github.io/my-books/';
  assert.equal(diagnostics.classifyDiagnostic({ type: 'response', url: 'https://middleages.github.io/favicon.ico', status: 404 }, base).kind, 'host-default-favicon-404');
  for (const entry of [{ type: 'response', url: base + 'favicon.ico', status: 404 }, { type: 'response', url: base + 'assets/a.js', status: 404 }, { type: 'console', message: 'Failed to load resource: the server responded with a status of 404' }, { type: 'response', url: 'https://middleages.github.io/favicon.ico', status: 500 }]) assert.equal(diagnostics.classifyDiagnostic(entry, base).kind, 'application');
});
