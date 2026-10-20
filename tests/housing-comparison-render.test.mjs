import test from 'node:test';import assert from 'node:assert/strict';
import {createServer} from 'vite';import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {housingComparison} from '../src/simulations/housing/comparison.mjs';
test('housing E SSR: first ledgers read model values and all four diagrams retain labelled relationships',async()=>{
 const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,watch:null},appType:'custom',logLevel:'error'});
 try{
  const {HousingComparisonLab}=await server.ssrLoadModule('/src/components/housing/ComparisonLab.tsx');const html=renderToStaticMarkup(createElement(HousingComparisonLab));
  const r=housingComparison();for(const p of Object.values(r.paths))assert(html.includes(`data-comparison-cash="${p.frames[0].cash}"`));
  assert.equal((html.match(/data-comparison-kind=/g)||[]).length,3);assert.equal((html.match(/class="housing-fill/g)||[]).length,12);assert(html.includes('입금 전 보증금청구'));assert(html.includes('남은 원금 빚'));
  const market=await server.ssrLoadModule('/src/components/housing/MarketLabs.tsx');for(const name of ['PlaceLab','MarketMixLab','HousingSupplyLab']){const output=renderToStaticMarkup(createElement(market[name]));assert(output.includes('<figcaption>'));assert(output.includes('정적 표'));assert(!output.includes('NaN'));assert(!/<p\b[^>]*>\s*<p\b/.test(output))}
 }finally{await server.close()}
});
test('housing E MDX renders complete lessons without raw punctuation emphasis or unreleased links',async()=>{
 const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true,watch:null},appType:'custom',logLevel:'error'});
 try{for(const file of ['RentOrBuy','PlaceAndMarket']){const {default:Content}=await server.ssrLoadModule(`/src/content/housing/${file}.mdx`);const html=renderToStaticMarkup(createElement(Content));assert(!html.includes('**'));assert(!/<del[ >]/.test(html));assert(!/<p\b[^>]*>\s*<p\b/.test(html));assert(!html.includes('#/housing/moving-and-shocks'));assert(html.includes('2026-10-20'));assert(html.includes('스스로 확인하기'));}}finally{await server.close()}
});
