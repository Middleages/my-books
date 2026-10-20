import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import scope from '../scripts/browser-verification-scope.cjs';

const all = ['insurance', 'investing', 'tax', 'book-volumes', 'database', 'kubernetes', 'housing'];
const classify = (files, extra = {}) => scope.classify({ files, available: all, ...extra });
const catalog = readFileSync(new URL('../src/catalog.ts', import.meta.url), 'utf8');
const selected = (...books) => all.filter(suite => ['book-volumes', ...books].includes(suite));

test('book-local source, scenarios, verifier and unit tests select complete affected suites plus mandatory smoke', () => {
  for (const book of ['insurance', 'investing', 'tax', 'database', 'kubernetes', 'housing']) {
    for (const file of [
      `src/content/${book}/NewChapter.mdx`, `src/components/${book}/Lab.tsx`,
      `src/components/${book}/lab.css`, `src/simulations/${book}/model.mjs`,
      `src/simulations/${book}/model.d.mts`, `scripts/${book}-browser-qa.cjs`,
      `tests/${book}-model.test.mjs`, `tests/${book}-browser-qa.test.mjs`,
    ]) {
      const result = classify([file]);
      assert.deepEqual(result.selected, selected(book), file);
      assert.equal(result.mode, 'affected');
      assert.deepEqual(result.omitted, all.filter(suite => !selected(book).includes(suite)));
      assert.match(result.scopeNotice, /not passed/);
    }
  }
  assert.deepEqual(classify(['src/kubernetesAppendices.ts']).selected, selected('kubernetes'));
  assert.deepEqual(classify(['src/content/tax/New.mdx', 'src/content/database/New.mdx']).selected, selected('tax', 'database'));
});

test('shared controls, global styles, build/test infrastructure and unknown paths conservatively select every suite', () => {
  for (const file of [
    'src/components/money/shared.tsx', 'src/content/money/shared.tsx', 'src/style.css', 'src/main.tsx',
    'src/reading.mjs', 'src/Labs.tsx', 'src/models.mjs', 'src/content/new-book/New.mdx',
    'src/components/SharedPlayback.tsx', 'package.json', 'package-lock.json', 'vite.config.ts',
    '.github/workflows/pages.yml', 'scripts/browser-verification-scope.cjs',
    'tests/browser-verification-scope.test.mjs', 'tests/pages-workflow.test.mjs', 'tests/browser-visual.test.mjs',
    'public/asset.svg', '.github/actions/check/action.yml',
  ]) {
    const result = classify([file]);
    assert.deepEqual(result.selected, all, file);
    assert.equal(result.mode, 'full', file);
    assert.deepEqual(result.omitted, []);
  }
});

test('shared presentation and documentation retain real nonempty shared smoke instead of inventing a full pass', () => {
  for (const files of [
    [], ['docs/TAX-TEXTBOOK-PLAN.md', 'README.md'], ['AGENTS.md'],
    ['src/components/Library.tsx'], ['src/components/BookCover.tsx'], ['src/components/library.css'],
  ]) {
    const result = classify(files);
    assert.deepEqual(result.matrix, { suite: ['book-volumes'] });
    assert.equal(result.mode, 'affected');
    assert.equal(result.omitted.length, all.length - 1);
  }
});

test('catalog chapter additions and per-book metadata changes do not force unrelated insurance regression', () => {
  const added = catalog.replace('export const chapters: Chapter[] = [', `export const chapters: Chapter[] = [
  { id: "new-tax", bookId: "tax", readId: "tax/new-tax", number: "03", title: "New", heading: "New?", description: "New", Content: TaxEvents },`);
  assert.deepEqual(classify(['src/catalog.ts'], { catalogBefore: catalog, catalogAfter: added }).selected, selected('tax'));
  // Multiple books can share publication wording. Target the tax record itself,
  // independent of chapter count or where another book appears in the catalog.
  const updated = catalog.replace(/(\{\s*id:\s*"tax",[\s\S]*?\bfuture:\s*")[^"]*(")/, '$1Tax-only metadata fixture$2');
  assert.notEqual(catalog, updated);
  assert.deepEqual(classify(['src/catalog.ts'], { catalogBefore: catalog, catalogAfter: updated }).selected, selected('tax'));
  const imported = `import NewDatabase from "./content/database/New.mdx";\n${catalog}`;
  assert.deepEqual(classify(['src/catalog.ts'], { catalogBefore: catalog, catalogAfter: imported }).selected, selected('database'));
  const swapped = catalog.replace('export const chapterHref = (c: Chapter) => `#/${c.bookId}/${c.id}`;', 'export const chapterHref = (c: Chapter) => `#/${c.id}`;');
  assert.notEqual(catalog, swapped);
  assert.deepEqual(classify(['src/catalog.ts'], { catalogBefore: catalog, catalogAfter: swapped }).selected, all);
  const booksStart = catalog.indexOf('export const books: Book[] = [');
  const rows = catalog.slice(booksStart).split('\n');
  [rows[1], rows[2]] = [rows[2], rows[1]];
  const reordered = catalog.slice(0, booksStart) + rows.join('\n');
  assert.notEqual(catalog, reordered);
  assert.deepEqual(classify(['src/catalog.ts'], { catalogBefore: catalog, catalogAfter: reordered }).selected, ['book-volumes'], 'Book display order is checked by shared smoke, not unrelated model scenarios');
});

test('shared catalog declarations, malformed or dynamic records fail safely to broad regression', () => {
  for (const changed of [
    undefined, catalog + '\n invalid syntax {', catalog.replace('volume: number;', 'volume?: number;'),
    catalog.replace('label: "IT·기술"', 'label: "Technology"'),
    catalog.replace('export const chapters: Chapter[] = [', 'export const chapters: Chapter[] = [ ...externalChapters,'),
    catalog.replace('bookId: "tax"', 'bookId: getBook()'),
    catalog.replace('bookId: "tax"', 'bookId: "unknown-book"'),
  ]) assert.deepEqual(classify(['src/catalog.ts'], { catalogBefore: catalog, catalogAfter: changed }).selected, all);
});

test('classification is deterministic, supports renamed old/new paths and cannot omit the smoke suite', () => {
  const files = ['src/content/tax/New.mdx', 'src/content/insurance/Old.mdx'];
  assert.deepEqual(classify(files), classify([...files].reverse().concat(files)));
  assert.deepEqual(classify(files).selected, selected('tax', 'insurance'));
  assert.throws(() => classify(files, { available: [] }));
  assert.throws(() => classify(files, { available: ['tax'] }));
  assert.throws(() => classify(files, { available: ['book-volumes', 'unknown'] }));
  assert.throws(() => classify(['']));
  assert.throws(() => classify(['scripts/tax-browser-qa.cjs'], { available: ['book-volumes'] }), /missing or unregistered/);
  const current = ['insurance', 'investing', 'tax', 'book-volumes'];
  assert.deepEqual(classify(['src/content/database/New.mdx'], { available: current }).selected, current);
  assert.deepEqual(classify(['src/content/tax/New.mdx'], { available: current }).selected, ['tax', 'book-volumes']);
});

test('manual final-book runs and unavailable history always choose every available suite', () => {
  const root = mkdtempSync(join(tmpdir(), 'browser-scope-'));
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  try {
    mkdirSync(join(root, 'scripts'));
    for (const suite of ['insurance', 'tax', 'book-volumes']) writeFileSync(join(root, `scripts/${suite}-browser-qa.cjs`), '');
    git('init', '-q');
    git('-c', 'user.name=Scope Test', '-c', 'user.email=scope@example.test', 'add', '.');
    git('-c', 'user.name=Scope Test', '-c', 'user.email=scope@example.test', 'commit', '-qm', 'Initial fixture');
    const base = git('rev-parse', 'HEAD');
    mkdirSync(join(root, 'src/content/tax'), { recursive: true });
    writeFileSync(join(root, 'src/content/tax/New.mdx'), 'New');
    git('add', '.');
    git('-c', 'user.name=Scope Test', '-c', 'user.email=scope@example.test', 'commit', '-qm', 'Tax change');
    const head = git('rev-parse', 'HEAD');
    for (const [event, data] of [['push', { before: base }], ['pull_request', { pull_request: { base: { sha: base } } }]]) {
      const result = scope.selectFromGit(root, event, data);
      assert.deepEqual(result.selected, ['tax', 'book-volumes']);
      assert.equal(result.sourceSha, head);
      assert.equal(result.baseSha, base);
      assert.deepEqual(result.changedFiles, ['src/content/tax/New.mdx']);
    }
    for (const [event, data] of [['workflow_dispatch', {}], ['push', { before: '0'.repeat(40) }], ['push', { before: 'a'.repeat(40) }], ['pull_request', {}], [undefined, {}]]) {
      assert.deepEqual(scope.selectFromGit(root, event, data).selected, ['insurance', 'tax', 'book-volumes']);
    }
    mkdirSync(join(root, 'src/content/insurance'), { recursive: true });
    git('mv', 'src/content/tax/New.mdx', 'src/content/insurance/New.mdx');
    git('-c', 'user.name=Scope Test', '-c', 'user.email=scope@example.test', 'commit', '-qm', 'Move between books');
    const moved = scope.selectFromGit(root, 'push', { before: head });
    assert.deepEqual(moved.changedFiles, ['src/content/insurance/New.mdx', 'src/content/tax/New.mdx'], 'Rename must retain both old and new affected book paths');
    assert.deepEqual(moved.selected, ['insurance', 'tax', 'book-volumes']);
    writeFileSync(join(root, 'scripts/unregistered-browser-qa.cjs'), '');
    assert.throws(() => scope.availableSuites(root), /Register new browser suites/);
    rmSync(join(root, 'scripts/unregistered-browser-qa.cjs'));
    rmSync(join(root, 'scripts/book-volumes-browser-qa.cjs'));
    assert.throws(() => scope.availableSuites(root), /mandatory/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
