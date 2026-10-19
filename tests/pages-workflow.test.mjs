import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isBuiltin } from 'node:module';

const workflow = readFileSync(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
const suites = ['insurance', 'investing'];
const mainOnly = "github.ref == 'refs/heads/main' && github.event_name != 'pull_request'";

// Inspect the workflow's small, explicit block layout without adding a YAML
// dependency. These are contract checks, not a general-purpose YAML parser.
function mapping(source, indent) {
  const matches = [...source.matchAll(new RegExp(`^ {${indent}}([\\w-]+):(?: (.*))?$`, 'gm'))];
  const entries = matches.map((match, index) => [match[1], {
    value: match[2] ?? '',
    body: source.slice(match.index + match[0].length + 1, matches[index + 1]?.index ?? source.length).trimEnd(),
  }]);
  assert.equal(new Set(entries.map(([key]) => key)).size, entries.length, 'Duplicate mapping keys are unsafe');
  return Object.fromEntries(entries);
}
const top = mapping(workflow, 0);
const jobs = mapping(top.jobs.body, 2);
const fields = id => mapping(jobs[id].body, 4);
function steps(id) {
  const source = fields(id).steps.body;
  const chunks = source.split(/^      - /m).slice(1);
  return chunks.map(chunk => mapping(`        ${chunk.trimEnd()}`, 8));
}
const action = (step, uses) => step.uses?.value === uses;
const config = step => mapping(step.with?.body ?? '', 10);
const values = object => Object.fromEntries(Object.entries(object).map(([key, field]) => [key, field.value]));
const run = step => step.run?.value === '|' ? step.run.body.split('\n').map(line => line.trim()).join('\n') : step.run?.value;

test('Pages workflow retains triggers, read-only default permissions and ref cancellation', () => {
  assert.deepEqual(Object.keys(top), ['name', 'on', 'permissions', 'concurrency', 'jobs']);
  assert.equal(top.on.body, '  push:\n    branches: [main]\n  pull_request:\n  workflow_dispatch:');
  assert.equal(top.permissions.body, '  contents: read');
  assert.equal(top.concurrency.body, '  group: pages-${{ github.ref }}\n  cancel-in-progress: true');
  assert.deepEqual(Object.keys(jobs), ['build', 'verify-production', 'deploy', 'verify-published']);
  assert.doesNotMatch(workflow, /\bcontinue-on-error\s*:|\bservices\s*:|\bsecrets\s*:/);
  assert.equal([...workflow.matchAll(/^\s*permissions:/gm)].length, 2, 'Only default and deploy permissions are permitted');
});

test('build tests once and uploads the sole Pages artifact without a separate browser build', () => {
  const job = fields('build');
  assert.deepEqual(Object.keys(job), ['runs-on', 'steps']);
  assert.equal(job['runs-on'].value, 'ubuntu-latest');
  const build = steps('build');
  assert.equal(build.length, 6);
  assert.deepEqual(build.map(step => Object.keys(step)), [
    ['uses'], ['uses', 'with'], ['run'], ['run'], ['run'], ['uses', 'with'],
  ], 'Build steps must preserve default checkout, shell failure handling and unconditional execution');
  assert(action(build[0], 'actions/checkout@v4'));
  assert(action(build[1], 'actions/setup-node@v4'));
  assert.deepEqual(values(config(build[1])), { 'node-version': '22', cache: 'npm' });
  assert.deepEqual(build.slice(2, 5).map(run), ['npm ci', 'npm test', 'npm run build']);
  assert(action(build[5], 'actions/upload-pages-artifact@v3'));
  assert.deepEqual(values(config(build[5])), { path: 'dist' });
  for (const step of build) assert(!step.if && !step.env, 'Build/test/upload cannot be conditionally skipped or overridden');
  assert.equal([...workflow.matchAll(/actions\/upload-pages-artifact@/g)].length, 1);
  assert.equal([...workflow.matchAll(/run: npm run build/g)].length, 1);
});

test('both isolated browser matrices run all fixed suites and propagate failures', () => {
  for (const id of ['verify-production', 'verify-published']) {
    const job = fields(id);
    assert.deepEqual(Object.keys(job), id === 'verify-production'
      ? ['name', 'needs', 'runs-on', 'strategy', 'steps']
      : ['name', 'if', 'needs', 'runs-on', 'strategy', 'steps']);
    assert.equal(job['runs-on'].value, 'ubuntu-latest');
    assert.equal(job.strategy.body, '      fail-fast: false\n      matrix:\n        suite: [insurance, investing]',
      'Both suites must run independently without fail-fast cancellation, exclusions or dynamic matrix input');
    assert.equal(job.needs.value, id === 'verify-production' ? 'build' : 'deploy');
    assert.equal(job.if?.value, id === 'verify-production' ? undefined : mainOnly);
    const browserSteps = steps(id);
    assert.equal(browserSteps.length, 7);
    assert.deepEqual(browserSteps.map(step => Object.keys(step)), [
      ['uses'], ['uses', 'with'], ['uses', 'with'], ['name', 'run'],
      ['name', 'run'], ['name', 'env', 'run'], ['name', 'if', 'uses', 'with'],
    ], 'Only the evidence upload may change step execution conditions');
    assert(action(browserSteps[0], 'actions/checkout@v4'));
    assert(!browserSteps[0].with, 'Source checkout must use the same triggering revision as the build');
    assert(action(browserSteps[1], 'actions/setup-node@v4'));
    assert.deepEqual(values(config(browserSteps[1])), { 'node-version': '22' });
    for (const step of browserSteps.slice(0, -1)) assert(!step.if, 'No browser setup or check may be skipped independently');
  }
});

test('production and live browser jobs consume the same run artifact without rebuilding', () => {
  for (const [id, directory] of [['verify-production', 'production-artifact'], ['verify-published', 'published-artifact']]) {
    const browserSteps = steps(id);
    assert(action(browserSteps[2], 'actions/download-artifact@v4'));
    assert.deepEqual(values(config(browserSteps[2])), {
      name: 'github-pages', path: '${{ runner.temp }}/' + directory,
    }, 'Do not select another run, repository or differently named artifact');
    assert.equal(run(browserSteps[3]), `mkdir -p dist && tar -xf "$RUNNER_TEMP/${directory}/artifact.tar" -C dist`);
    assert.equal(run(browserSteps[4]), [
      'npm install --prefix "$RUNNER_TEMP/investing-qa" --no-save --ignore-scripts playwright@1.56.1',
      'sudo apt-get update -qq',
      'sudo apt-get install -y fonts-noto-cjk',
    ].join('\n'));
    assert.equal(run(browserSteps[5]), 'node scripts/${{ matrix.suite }}-browser-qa.cjs');
    assert.deepEqual(values(mapping(browserSteps[5].env.body, 10)), {
      NODE_PATH: '${{ runner.temp }}/investing-qa/node_modules',
      CHROME_PATH: '/usr/bin/google-chrome',
      ...(id === 'verify-published' ? { LIVE_URL: 'https://middleages.github.io/my-books/' } : {}),
    });
    assert(!browserSteps.slice(0, 5).some(step => step.env), 'Setup cannot inject an alternate browser mode');
  }
});

test('all original browser evidence names survive failures without masking a check result', () => {
  const artifactNames = [];
  for (const [id, suffix] of [['verify-production', 'local'], ['verify-published', 'published']]) {
    const evidence = steps(id)[6];
    assert(action(evidence, 'actions/upload-artifact@v4'));
    assert.equal(evidence.if.value, 'always()');
    assert.deepEqual(Object.keys(evidence), ['name', 'if', 'uses', 'with']);
    const withValues = values(config(evidence));
    assert.deepEqual(withValues, {
      name: '${{ matrix.suite }}-browser-' + suffix,
      path: 'artifacts/${{ matrix.suite }}-browser/',
      'if-no-files-found': 'warn',
    });
    for (const suite of suites) artifactNames.push(withValues.name.replace('${{ matrix.suite }}', suite));
  }
  assert.deepEqual(artifactNames, ['insurance-browser-local', 'investing-browser-local', 'insurance-browser-published', 'investing-browser-published']);
  assert.equal([...workflow.matchAll(/always\(\)/g)].length, 2, 'Only evidence uploads may bypass success()');
});

test('deployment requires the full production matrix and preserves its existing narrow access', () => {
  const deploy = fields('deploy');
  assert.deepEqual(Object.keys(deploy), ['if', 'needs', 'runs-on', 'permissions', 'environment', 'steps']);
  assert.equal(deploy.if.value, mainOnly);
  assert.equal(deploy.needs.value, '[build, verify-production]', 'A failed or skipped production suite must block deployment');
  assert.equal(deploy['runs-on'].value, 'ubuntu-latest');
  assert.deepEqual(values(mapping(deploy.permissions.body, 6)), { pages: 'write', 'id-token': 'write' });
  assert.deepEqual(values(mapping(deploy.environment.body, 6)), {
    name: 'github-pages', url: '${{ steps.deployment.outputs.page_url }}',
  });
  assert.equal(steps('deploy').length, 1);
  assert.deepEqual(values(steps('deploy')[0]), { name: 'Deploy', id: 'deployment', uses: 'actions/deploy-pages@v4' });
});

test('browser scripts and model imports need only builtins plus isolated Playwright', () => {
  const visited = new Set();
  function inspect(file) {
    if (visited.has(file.href)) return;
    visited.add(file.href);
    const source = readFileSync(file, 'utf8');
    const calls = [...source.matchAll(/(?:\brequire|\bimport)\s*\(\s*(['"])([^'"]+)\1\s*\)/g)];
    const statements = [...source.matchAll(/^\s*(?:import|export)\s+(?:[^;\n]*?\s+from\s+)?(['"])([^'"]+)\1/gm)];
    for (const [, , specifier] of [...calls, ...statements]) {
      if (specifier.startsWith('.')) inspect(new URL(specifier, file));
      else assert(isBuiltin(specifier) || specifier === 'playwright', `${file.pathname} now requires ${specifier}; revisit the isolated CI setup`);
    }
  }
  for (const suite of suites) inspect(new URL(`../scripts/${suite}-browser-qa.cjs`, import.meta.url));
  assert(visited.size > suites.length, 'The script dependency check must include imported local models');
});
