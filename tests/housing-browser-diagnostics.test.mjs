import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import d from '../scripts/housing-browser-qa.cjs';
const base='https://middleages.github.io/my-books/';
const observed={source:'https://middleages.github.io/favicon.ico',message:'Failed to load resource: the server responded with a status of 404 ()',page:`${base}#/housing`};
test('housing separately retains only exact observed host-default favicon404',()=>{
  assert.deepEqual(d.classifyConsoleError(observed,base),{...observed,kind:'host-default-favicon-404'});
  const response={event:'response',source:observed.source,status:404,page:observed.page};
  assert.deepEqual(d.classifyResourceFailure(response,base),{...response,kind:'host-default-favicon-404'});
});
test('housing unknown source, app favicon, other hosts/statuses and text-only matches stay fatal',()=>{
  for(const source of ['',`${base}favicon.ico`,`${base}assets/missing.js`,'https://example.com/favicon.ico'])
    assert.equal(d.classifyConsoleError({...observed,source},base).kind,'application');
  for(const message of ['Failed to load resource: the server responded with a status of 500 ()','Application failed in favicon configuration'])
    assert.equal(d.classifyConsoleError({...observed,message},base).kind,'application');
  assert.equal(d.classifyConsoleError(observed,'http://127.0.0.1:3000/my-books/').kind,'application');
  for(const change of [{source:''},{source:`${base}favicon.ico`},{status:500},{event:'requestfailed'}])
    assert.equal(d.classifyResourceFailure({event:'response',source:observed.source,status:404,...change},base).kind,'application');
});
test('housing records console locations and exact failed resource status without hiding unknown errors',()=>{
  const page=new EventEmitter();page.url=()=>`${base}#/housing`;
  const results={errors:[],consoleDiagnostics:[],resourceDiagnostics:[],nonApplicationDiagnostics:[]};
  d.installPageDiagnostics(page,results,base);
  page.emit('console',{type:()=> 'error',location:()=>({url:'',lineNumber:7,columnNumber:2}),text:()=>observed.message});
  const req={method:()=> 'GET',resourceType:()=> 'image',url:()=>observed.source,failure:()=>({errorText:'net::ERR_FAILED'})};
  page.emit('response',{status:()=>404,url:()=>observed.source,request:()=>req});
  page.emit('requestfailed',req);
  page.emit('pageerror',new Error('MDX crashed'));
  assert.equal(results.consoleDiagnostics[0].source,'');assert.equal(results.consoleDiagnostics[0].lineNumber,7);
  assert.equal(results.resourceDiagnostics[0].status,404);assert.equal(results.resourceDiagnostics[0].source,observed.source);
  assert.equal(results.nonApplicationDiagnostics.length,1);
  assert.equal(results.errors.length,3);assert.equal(results.errors[0].kind,'application');
  assert.equal(results.resourceDiagnostics[1].failure,'net::ERR_FAILED');
});
