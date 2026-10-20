import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {classifyDiagnostic}=createRequire(import.meta.url)('../scripts/accounting-browser-diagnostics.cjs');
const base='https://middleages.github.io/my-books/';
const favicon='https://middleages.github.io/favicon.ico';
const message='Failed to load resource: the server responded with a status of 404 ()';
test('accounting diagnostics preserve exact observed host favicon 404 separately',()=>{
 for(const entry of [{type:'console',source:favicon,message},{type:'response',url:favicon,status:404}]){
  const classified=classifyDiagnostic(entry,base);assert.equal(classified.kind,'host-default-favicon-404');
  for(const [key,value] of Object.entries(entry))assert.equal(classified[key],value);
 }
});
test('accounting diagnostics never infer a favicon from text or excuse application failures',()=>{
 for(const entry of [
  {type:'console',source:'',message},
  {type:'console',source:base+'assets/app.js',message},
  {type:'console',source:favicon,message:'Error: favicon failed'},
  {type:'console',source:favicon,message:message.replace('404','500')},
  {type:'response',url:base+'favicon.ico',status:404},
  {type:'response',url:favicon+'?query=1',status:404},
  {type:'response',url:'https://example.com/favicon.ico',status:404},
  {type:'response',url:favicon,status:500},
  {type:'requestfailed',url:favicon,error:'net::ERR_FAILED'},
 ])assert.equal(classifyDiagnostic(entry,base).kind,'application',JSON.stringify(entry));
 assert.equal(classifyDiagnostic({type:'response',url:favicon,status:404},'http://127.0.0.1/my-books/').kind,'application');
});
