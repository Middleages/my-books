import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import diagnostics from '../scripts/kubernetes-browser-qa.cjs';
const { classifyDiagnostic, attachDiagnostics } = diagnostics;
const base='https://middleages.github.io/my-books/';
const observed={kind:'console',label:'1440',source:'https://middleages.github.io/favicon.ico',page:`${base}#/kubernetes`,line:0,column:0,message:'Failed to load resource: the server responded with a status of 404 ()'};

test('Kubernetes separately retains only the strict-probe observed host-root favicon404',()=>{
 assert.deepEqual(classifyDiagnostic(observed,base),{...observed,classification:'host-default-favicon-404'});
 assert.equal(observed.classification,undefined,'Classification must not modify the observed evidence');
});
test('Kubernetes diagnostics keep app assets, unknown URLs/statuses, other origins and arbitrary errors fatal',()=>{
 for(const entry of [
  {...observed,source:base+'assets/missing.js'}, {...observed,source:base+'assets/missing.css'},
  {...observed,source:base+'favicon.ico'}, {...observed,source:'https://example.com/favicon.ico'},
  {...observed,source:''}, {...observed,source:undefined}, {...observed,source:observed.source+'?unexpected=1'},
  {...observed,message:'Failed to load resource: the server responded with a status of 500 ()'},
  {...observed,message:'Application failed while loading favicon configuration'},
  {...observed,kind:'pageerror'}, {...observed,kind:'requestfailed'}, {...observed,kind:'http',status:404},
 ])assert.equal(classifyDiagnostic(entry,base).classification,'application',JSON.stringify(entry));
 assert.equal(classifyDiagnostic(observed,'https://example.com/my-books/').classification,'application');
 assert.equal(classifyDiagnostic(observed,'http://127.0.0.1:3000/my-books/').classification,'application');
});
test('Kubernetes records console source/page and all runtime/resource failures without discarding evidence',()=>{
 const page=new EventEmitter();page.url=()=>observed.page;
 const report={errors:[],diagnostics:[],nonApplicationDiagnostics:[]};
 attachDiagnostics(page,'1440',report,base);
 const consoleMessage=(source,message,type='error')=>({type:()=>type,text:()=>message,location:()=>({url:source,lineNumber:0,columnNumber:0})});
 page.emit('console',consoleMessage(observed.source,observed.message));
 page.emit('console',consoleMessage(base+'assets/missing.js',observed.message));
 page.emit('console',consoleMessage('', 'Application error'));
 page.emit('console',consoleMessage('', 'Ordinary log','log'));
 page.emit('pageerror',new Error('Runtime failure'));
 page.emit('requestfailed',{url:()=>base+'assets/failed.css',resourceType:()=> 'stylesheet',failure:()=>({errorText:'net::ERR_FAILED'})});
 page.emit('response',{url:()=>base+'assets/missing.js',status:()=>404,request:()=>({resourceType:()=> 'script'})});
 assert.equal(report.diagnostics.length,6);
 assert.equal(report.nonApplicationDiagnostics.length,1);
 assert.equal(report.errors.length,5);
 assert.equal(report.nonApplicationDiagnostics[0].source,observed.source);
 assert(report.diagnostics.every(e=>e.page===observed.page));
 assert.deepEqual(report.errors.map(e=>e.kind),['console','console','pageerror','requestfailed','http']);
 assert.equal(report.errors.at(-1).status,404);
});
test('Kubernetes keeps the fatal zero-error assertion and instruments normal, reduced-motion and reading contexts',()=>{
 const source=readFileSync(new URL('../scripts/kubernetes-browser-qa.cjs',import.meta.url),'utf8');
 assert.match(source,/check\('console-errors',null,async\(\)=>assert\.deepEqual\(results\.errors,\[\]\)\)/);
 for(const text of ["attachDiagnostics(page,String(width))","attachDiagnostics(page,'reduced-motion')","attachDiagnostics(rp,'reading-history')"])assert(source.includes(text));
});
