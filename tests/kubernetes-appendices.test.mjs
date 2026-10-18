import test from 'node:test';
import assert from 'node:assert/strict';
import { recoveryFrames, dependencyMap } from '../src/simulations/kubernetes/appendices.mjs';
test('datastore and token alone recover API records, never PV or external DB data', () => {
  const end = recoveryFrames('complete').at(-1);
  assert.equal(end.api, 'restored');
  assert.equal(end.pv, 'restored');
  assert.equal(end.externalDb, 'separate');
  assert.equal(recoveryFrames('no-pv').at(-1).api, 'restored');
  assert.equal(recoveryFrames('no-pv').at(-1).pv, 'missing');
});
test('missing original token blocks datastore restore and never reports app recovery', () => {
  const end = recoveryFrames('no-token').at(-1);
  assert.equal(end.api, 'blocked');
  assert.equal(end.app, 'unverified');
});
test('restored data is distinct from observed application health', () => {
  const frames = recoveryFrames('complete');
  assert.equal(frames[0].api, 'unverified');
  assert.equal(frames[2].app, 'unverified');
  assert.equal(frames.at(-1).app, 'check-required');
});
test('restarting a scenario cannot keep an earlier restore result', () => {
  const frames = recoveryFrames('complete');
  frames.at(-1).api = 'tampered';
  assert.equal(recoveryFrames('complete').at(-1).api, 'restored');
});
test('registry CA does not install trust in the browser or application', () => {
  const nodes = dependencyMap();
  assert.deepEqual(nodes.find(x => x.id === 'registry').requires, ['dns', 'time', 'registry-ca']);
  assert.deepEqual(nodes.find(x => x.id === 'browser').requires, ['dns', 'time', 'browser-ca']);
  assert.deepEqual(nodes.find(x => x.id === 'database').requires, ['dns', 'time', 'app-ca']);
});
