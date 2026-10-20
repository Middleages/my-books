import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/catalog.ts', import.meta.url), 'utf8');
const catalog = ts.createSourceFile('catalog.ts', source, ts.ScriptTarget.Latest, true);
const declaration = catalog.statements.filter(ts.isVariableStatement)
  .flatMap(statement => [...statement.declarationList.declarations])
  .find(statement => statement.name.getText(catalog) === 'books');
assert(declaration && ts.isArrayLiteralExpression(declaration.initializer));
const books = declaration.initializer.elements.map(element => {
  assert(ts.isObjectLiteralExpression(element));
  return Object.fromEntries(element.properties.filter(ts.isPropertyAssignment).map(property => {
    const value = property.initializer;
    return [property.name.getText(catalog), ts.isStringLiteral(value) ? value.text : ts.isNumericLiteral(value) ? Number(value.text) : undefined];
  }));
});

test('every public book declares a unique positive volume inside its category', () => {
  assert(books.length > 0);
  const keys = new Set();
  for (const book of books) {
    assert(Number.isInteger(book.volume) && book.volume > 0, `${book.id} must declare a positive integer volume`);
    const key = `${book.categoryId}/${book.volume}`;
    assert(!keys.has(key), `Duplicate category volume: ${key}`);
    keys.add(key);
  }
  const type = catalog.statements.find(statement => ts.isTypeAliasDeclaration(statement) && statement.name.text === 'Book');
  const volume = type.type.members.find(member => member.name?.getText(catalog) === 'volume');
  assert(volume && !volume.questionToken && volume.type.kind === ts.SyntaxKind.NumberKeyword, 'Book.volume must be required, not inferred or optional');
});

test('agreed learning volumes survive catalog order and future book additions', () => {
  const expected = {
    computer: ['technology', 1], network: ['technology', 2], kubernetes: ['technology', 3], database: ['technology', 4],
    money: ['money', 1], economics: ['money', 2], investing: ['money', 3], insurance: ['money', 4], tax: ['money', 5],
  };
  for (const book of books) {
    if (expected[book.id]) assert.deepEqual([book.categoryId, book.volume], expected[book.id], book.id);
  }
  // The source order deliberately differs from learning order. Labels must read
  // explicit metadata rather than rank in either the source or filtered list.
  assert.deepEqual(books.filter(book => ['money', 'economics', 'investing', 'insurance'].includes(book.id)).map(book => book.volume), [4, 3, 2, 1]);
});

test('home and overview share the metadata label, not cover text or positional numbering', () => {
  const home = readFileSync(new URL('../src/components/Library.tsx', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
  assert.match(home, /className="home-book-volume">\{bookVolumeLabel\(book\)\}/);
  assert.match(app, /className="book-volume">\{bookVolumeLabel\(book\)\}/);
  assert.match(home, /권차는 분야별 권장 학습 순서예요/);
  assert.match(home, /\.sort\(\(a, b\) => Number\(b.active\) - Number\(a.active\)\)/, 'Keep reading-first and stable catalog order');
});
