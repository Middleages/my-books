import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// Exercise the real verifier helper without pretending this fake locator is a browser.
// Playwright locators resolve against current DOM state; nth indices are not snapshots.
const script = readFileSync(new URL('../scripts/insurance-browser-qa.cjs', import.meta.url), 'utf8');
const source = script.match(/async function closeTables\(lab\) \{[\s\S]*?\n\}/)?.[0];
assert(source, 'The browser verifier must keep an explicit table-reset helper');
const closeTables = runInNewContext(`(${source})`, { assert });

test('browser scenario table reset keeps stable locator indices as disclosures close', async () => {
  for (const initial of [[true, true], [true, true, true, true], [false, true, false, true], [false, false], []]) {
    const states = [...initial], clicks = [];
    const lab = {
      locator(selector) {
        assert(['.insurance-static > summary', '.insurance-static[open]'].includes(selector));
        const current = () => states.map((open, index) => ({ open, index })).filter(row => !selector.includes('[open]') || row.open);
        return {
          async count() { return current().length; },
          nth(position) {
            return {
              async evaluate(callback) {
                const row = current()[position];
                assert(row, 'A shrinking selector lost its next table');
                return callback({ parentElement: { open: row.open } });
              },
              async click() {
                const row = current()[position];
                assert(row, 'A shrinking selector lost its click target');
                states[row.index] = !states[row.index]; clicks.push(row.index);
              },
            };
          },
        };
      },
    };
    await closeTables(lab);
    assert.deepEqual(states, initial.map(() => false));
    assert.deepEqual(clicks, initial.flatMap((open, index) => open ? [index] : []));
    await closeTables(lab);
    assert.deepEqual(clicks, initial.flatMap((open, index) => open ? [index] : []), 'Resetting twice must not reopen closed tables');
  }
  assert.equal((script.match(/await closeTables\(lab\);/g) || []).length, 2, 'Both new scenario loops must use the stable helper');
  assert(!script.includes("locator('.insurance-static[open] > summary').all()"), 'Do not cache nth locators from a shrinking open-only set');
});
