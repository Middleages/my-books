import test from 'node:test';import assert from 'node:assert/strict';
import {createServer} from 'vite';import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';
// Trusted local MDX compilation checks markup only; this is not a browser/pixel/DB test.
test('E MDX renders technical abbreviations before Korean particles without literal Markdown markers',async()=>{
 const server=await createServer({server:{middlewareMode:true,watch:null},appType:'custom',logLevel:'error',optimizeDeps:{noDiscovery:true,include:[]}});
 try{for(const[file,terms]of [['DurabilityAndWal',['WAL(Write-Ahead Log)']],['BackupAndRestore',['RPO(Recovery Point Objective)','RTO(Recovery Time Objective)']]]){
  const{default:Content}=await server.ssrLoadModule(`/src/content/database/${file}.mdx`),html=renderToStaticMarkup(createElement(Content));
  assert(!html.includes('**'),file);assert(!html.includes('`'),file);assert(!/<del[ >]/.test(html),file);assert(!/<p\b[^>]*>\s*<p\b/.test(html),file);
  for(const term of terms)assert(html.includes(`<strong>${term}</strong>`),term);
  assert(html.includes('learning-goals'));assert(html.includes('근거와 모델의 경계'));assert(html.includes(file==='DurabilityAndWal'?'<summary>COMMIT 성공 직후 저장된 data page가 옛 버전이면 내구성이 깨진 건가요?</summary>':'<summary>10:00에 완성된 dump라면 반드시10:00의 데이터인가요?</summary>'));
 }}finally{await server.close();}
});
