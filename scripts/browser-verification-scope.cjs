/* Select complete existing browser suites, never individual assertions.
 * Run after npm ci. A manual workflow run always requests the full regression.
 * Unknown paths/history/catalog syntax conservatively select every available suite.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');

const suiteOrder = ['insurance', 'investing', 'tax', 'book-volumes', 'database', 'kubernetes', 'housing', 'accounting', 'child-development'];
const bookNames = ['computer', 'network', 'money', 'economics', 'investing', 'insurance', 'tax', 'database', 'kubernetes', 'housing', 'accounting', 'child-development'];
const sharedPresentation = new Set(['src/components/BookCover.tsx', 'src/components/Library.tsx', 'src/components/library.css']);
const sharedControls = new Set(['src/components/money/shared.tsx', 'src/content/money/shared.tsx']);
const printer = ts.createPrinter({ removeComments: true });

function availableSuites(root) {
  const found = fs.readdirSync(path.join(root, 'scripts'))
    .filter(file => file.endsWith('-browser-qa.cjs')).map(file => file.slice(0, -'-browser-qa.cjs'.length));
  assert(found.includes('book-volumes'), 'The mandatory shared book-volumes smoke verifier is missing');
  assert(found.every(suite => suiteOrder.includes(suite)), 'Register new browser suites before allowing change-aware selection');
  return suiteOrder.filter(suite => found.includes(suite));
}

// Parse, do not execute, the catalog. Records retain their order inside each book.
// Shared declarations/helpers remain a separate exact structural fingerprint.
function partitionCatalog(source) {
  assert.equal(typeof source, 'string', 'Catalog source is unavailable');
  const file = ts.createSourceFile('catalog.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  assert.equal(file.parseDiagnostics.length, 0, 'Catalog parse failed');
  const perBook = {}, shared = [], arrays = new Set();
  const print = node => printer.printNode(ts.EmitHint.Unspecified, node, file);
  const add = (book, text) => {
    assert(bookNames.includes(book), `Unregistered catalog book: ${book}`);
    (perBook[book] ??= []).push(text);
  };
  for (const statement of file.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      const match = statement.moduleSpecifier.text.match(/^\.\/content\/([^/]+)\/[^/]+$/);
      if (match) { add(match[1], print(statement)); continue; }
    }
    if (ts.isVariableStatement(statement) && statement.declarationList.declarations.length === 1) {
      const declaration = statement.declarationList.declarations[0];
      const name = declaration.name.getText(file);
      if (['chapters', 'books'].includes(name)) {
        assert(!arrays.has(name), 'Duplicate catalog array');
        arrays.add(name);
        assert(declaration.initializer && ts.isArrayLiteralExpression(declaration.initializer), 'Catalog array shape changed');
        for (const element of declaration.initializer.elements) {
          assert(ts.isObjectLiteralExpression(element), 'Catalog record must remain an object literal');
          assert(element.properties.every(ts.isPropertyAssignment), 'Dynamic catalog properties require full regression');
          const key = name === 'chapters' ? 'bookId' : 'id';
          const ids = element.properties.filter(property => property.name.getText(file) === key);
          assert.equal(ids.length, 1, `Catalog ${key} must be unique`);
          assert(ts.isStringLiteral(ids[0].initializer), `Catalog ${key} must be a string literal`);
          add(ids[0].initializer.text, `${name}:${print(element)}`);
        }
        const empty = ts.factory.updateVariableDeclaration(declaration, declaration.name, declaration.exclamationToken, declaration.type, ts.factory.createArrayLiteralExpression());
        const list = ts.factory.updateVariableDeclarationList(statement.declarationList, [empty]);
        shared.push(print(ts.factory.updateVariableStatement(statement, statement.modifiers, list)));
        continue;
      }
    }
    shared.push(print(statement));
  }
  assert.deepEqual([...arrays].sort(), ['books', 'chapters'], 'Both catalog arrays are required');
  return { perBook, shared };
}

function classify({ files, available, fullReason, catalogBefore, catalogAfter }) {
  assert(Array.isArray(available) && available.length && available.includes('book-volumes'));
  assert.equal(new Set(available).size, available.length);
  assert(available.every(suite => suiteOrder.includes(suite)));
  assert(Array.isArray(files) && files.every(file => typeof file === 'string' && file.length > 0));
  const selected = new Set(['book-volumes']), reasons = [], broad = [];
  const addBook = (book, reason) => {
    if (available.includes(book)) { selected.add(book); reasons.push(reason); }
    else broad.push(`${reason}; no dedicated available verifier for ${book}`);
  };
  if (fullReason) broad.push(fullReason);
  for (const file of [...new Set(files)].sort()) {
    if (file === 'src/catalog.ts') {
      try {
        const before = partitionCatalog(catalogBefore), after = partitionCatalog(catalogAfter);
        if (JSON.stringify(before.shared) !== JSON.stringify(after.shared)) broad.push('Catalog shared types, categories or helpers changed');
        for (const book of new Set([...Object.keys(before.perBook), ...Object.keys(after.perBook)])) {
          if (JSON.stringify(before.perBook[book]) !== JSON.stringify(after.perBook[book])) addBook(book, `Catalog records/imports changed for ${book}`);
        }
        reasons.push('Catalog order and shared presentation are covered by book-volumes');
      } catch (error) { broad.push(`Catalog cannot be safely partitioned: ${error.message}`); }
      continue;
    }
    if (sharedPresentation.has(file)) { reasons.push(`Shared home/cover presentation: ${file}`); continue; }
    if (sharedControls.has(file)) { broad.push(`Cross-book shared control: ${file}`); continue; }
    const bookPath = file.match(/^src\/(?:content|components|simulations)\/([^/]+)\//);
    if (bookPath && bookNames.includes(bookPath[1])) { addBook(bookPath[1], `Book-local source: ${file}`); continue; }
    if (file === 'src/kubernetesAppendices.ts') { addBook('kubernetes', `Kubernetes appendix registry: ${file}`); continue; }
    const specific = file.match(/^(?:scripts\/([a-z-]+)-browser-qa\.cjs|tests\/(insurance|investing|tax|database|kubernetes|housing|accounting|child-development|book-volumes)(?:-[a-z0-9-]+)?\.test\.mjs)$/);
    if (specific?.[1]) assert(available.includes(specific[1]), `Changed browser verifier is missing or unregistered: ${file}`);
    if (specific && available.includes(specific[1] || specific[2])) {
      selected.add(specific[1] || specific[2]); reasons.push(`Book-specific verifier/test: ${file}`); continue;
    }
    if (/^(?:docs\/.*\.md|README\.md|AGENTS\.md)$/.test(file)) { reasons.push(`Documentation only: ${file}`); continue; }
    broad.push(`Shared infrastructure or unknown path: ${file}`);
  }
  if (broad.length) available.forEach(suite => selected.add(suite));
  const suites = available.filter(suite => selected.has(suite));
  assert(suites.length > 0, 'Browser selection must never be empty');
  return {
    version: 1, mode: broad.length ? 'full' : 'affected', matrix: { suite: suites },
    selected: suites, omitted: available.filter(suite => !selected.has(suite)), available,
    reasons: [...new Set([...broad, ...reasons, 'Always verify shared home/catalog/volume invariants and exact served build assets'])],
    changedFiles: [...new Set(files)].sort(),
    scopeNotice: broad.length
      ? 'All available browser suites selected. This is the broad browser regression.'
      : 'Only selected suites are scheduled. Omitted suites are intentionally untested in this run, not passed.',
  };
}

function selectFromGit(root, eventName, event) {
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  const head = git('rev-parse', 'HEAD').trim(), available = availableSuites(root);
  let base = null, files = [], fullReason, catalogBefore, catalogAfter;
  if (eventName === 'workflow_dispatch') fullReason = 'Manual workflow_dispatch requests the complete final-book regression';
  else {
    base = eventName === 'pull_request' ? event?.pull_request?.base?.sha : eventName === 'push' ? event?.before : null;
    try {
      assert(/^[a-f0-9]{40}$/.test(base || '') && !/^0+$/.test(base), 'Missing or invalid comparison revision');
      assert.equal(git('rev-parse', '--verify', `${base}^{commit}`).trim(), base, 'Comparison commit is unavailable');
      // --no-renames includes both old and new paths, including book-to-book moves.
      files = git('diff', '--name-only', '--no-renames', '-z', base, head, '--').split('\0').filter(Boolean);
      if (files.includes('src/catalog.ts')) {
        catalogBefore = git('show', `${base}:src/catalog.ts`);
        catalogAfter = git('show', `${head}:src/catalog.ts`);
      }
    } catch (error) { fullReason = `Diff history unavailable; fail safe to full regression: ${error.message}`; }
  }
  const selection = classify({ files, available, fullReason, catalogBefore, catalogAfter });
  return { ...selection, event: eventName, baseSha: base, sourceSha: head, sourceTree: git('rev-parse', 'HEAD^{tree}').trim(), workflowSha: process.env.GITHUB_SHA || null };
}

if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  const event = process.env.GITHUB_EVENT_PATH ? JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')) : {};
  const selection = selectFromGit(root, process.env.GITHUB_EVENT_NAME, event);
  if (process.env.GITHUB_SHA) assert.equal(selection.sourceSha, process.env.GITHUB_SHA, 'Classifier checkout differs from workflow revision');
  const out = path.join(root, 'artifacts/browser-scope');
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'selection.json'), JSON.stringify(selection, null, 2) + '\n');
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `matrix=${JSON.stringify(selection.matrix)}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, [
    '## Browser verification scope', `Mode: ${selection.mode}`,
    `Selected: ${selection.selected.join(', ')}`, `Intentionally omitted: ${selection.omitted.join(', ') || 'none'}`,
    selection.scopeNotice, '', ...selection.reasons.map(reason => `- ${reason}`), '',
    `Source: ${selection.sourceSha}`, `Comparison: ${selection.baseSha || 'not applicable'}`, '',
  ].join('\n'));
  console.log(JSON.stringify(selection, null, 2));
}

module.exports = { availableSuites, partitionCatalog, classify, selectFromGit };
