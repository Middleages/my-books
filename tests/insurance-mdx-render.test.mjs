import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

test('insurance MDX renders without raw emphasis, nested paragraphs or unpublished links', async () => {
  const server = await createServer({ server: { middlewareMode: true, watch: null }, appType: 'custom', logLevel: 'error' });
  try {
    const catalog = readFileSync(new URL('../src/catalog.ts', import.meta.url), 'utf8');
    const ids = [...catalog.matchAll(/id: "([^"]+)", bookId: "insurance"/g)].map(row => row[1]);
    const known = new Set(['#/insurance', ...ids.map(id => `#/insurance/${id}`)]);
    for (const file of readdirSync(new URL('../src/content/insurance/', import.meta.url)).filter(file => file.endsWith('.mdx'))) {
      const { default: Content } = await server.ssrLoadModule(`/src/content/insurance/${file}`);
      const html = renderToStaticMarkup(createElement(Content));
      assert(!html.includes('**'), `${file}: raw emphasis reached rendered HTML`);
      assert(!/<del[ >]/.test(html), `${file}: unexpected strikethrough`);
      assert(!/<p\b[^>]*>\s*<p\b/.test(html), `${file}: nested paragraphs`);
      for (const match of html.matchAll(/href="(#\/insurance[^"?]*)"/g)) assert(known.has(match[1]), `${file}: unpublished route ${match[1]}`);
    }
  } finally { await server.close(); }
});
