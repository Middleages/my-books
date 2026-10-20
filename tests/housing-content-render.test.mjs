import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { compile } from '@mdx-js/mdx';
import remarkGfm from 'remark-gfm';

test('housing MDX compiles Korean punctuation-adjacent emphasis without raw markers', async () => {
  const dir=new URL('../src/content/housing/',import.meta.url);
  for(const name of (await readdir(dir)).filter(n=>n.endsWith('.mdx'))) {
    const source=await readFile(new URL(name,dir),'utf8');
    const output=String(await compile(source,{remarkPlugins:[remarkGfm]}));
    assert(!output.includes('**'),`${name}: raw emphasis remained in compiled output`);
  }
});
