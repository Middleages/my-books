/* Production/published child-family verifier. PNG creation is not visual review. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process'),{createHash}=require('node:crypto'),{pathToFileURL}=require('node:url');
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const {classifyDiagnostic}=require('./accounting-browser-diagnostics.cjs');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist'),out=path.join(root,'artifacts/child-family-browser');fs.mkdirSync(out,{recursive:true});
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const report={started:new Date().toISOString(),mode:process.env.LIVE_URL?'published':'production',sourceSha:git('rev-parse','HEAD'),sourceTree:git('rev-parse','HEAD^{tree}'),sourceChanges:git('status','--porcelain'),checks:[],screenshots:[],pageErrors:[],consoleErrors:[],resourceErrors:[],hostDiagnostics:[],visualReview:'PNGs require a separate direct visual review.'};
const catalog=fs.readFileSync(path.join(root,'src/catalog.ts'),'utf8');
const chapters=[...catalog.matchAll(/id:\s*"([^"]+)"\s*,\s*bookId:\s*"child-family"\s*,\s*readId:\s*"([^"]+)"\s*,\s*number:\s*"([^"]+)"[^}]*?heading:\s*"([^"]+)"/g)].map(m=>({id:m[1],readId:m[2],number:m[3],heading:m[4]}));
const model=async name=>import(pathToFileURL(path.join(root,'src/simulations/child-family',name+'.mjs')).href);
const routes=['/child-family',...chapters.map(c=>`/child-family/${c.id}`)];
let browser,server,base;
function checkpoint(){fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...report,passed:report.checks.filter(c=>c.status==='passed').length,failed:report.checks.filter(c=>c.status==='failed').length},null,2));}
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function check(name,fn){try{const details=await fn();report.checks.push({name,status:'passed',details});console.log('PASS',name);}catch(error){report.checks.push({name,status:'failed',error:String(error.stack||error)});console.error('FAIL',name,error.message);if(error.name==='TimeoutError'){report.stoppedAfterTimeout=name;report.unexecutedChecks='Remaining checks were not run; this attempt is incomplete and failed.';throw error;}}finally{checkpoint();}}
async function snap(page,name,locator){await page.evaluate(()=>document.fonts.ready);const file=name+'.png';if(locator)await locator.screenshot({path:path.join(out,file),animations:'disabled'});else await page.screenshot({path:path.join(out,file),fullPage:true,animations:'disabled'});report.screenshots.push(file);checkpoint();}
async function visit(page,route){await page.goto(base+'#'+route,{waitUntil:'networkidle'});if(route==='/')await page.locator('#home-books').waitFor();else await page.getByRole('heading',{level:1,name:chapters.find(c=>route===`/child-family/${c.id}`)?.heading||'함께 키우는 생활',exact:true}).waitFor();}
function observe(page,width){
 page.on('pageerror',error=>report.pageErrors.push({width,page:page.url(),error:String(error),stack:error.stack}));
 const record=(entry,collection)=>{const result=classifyDiagnostic({width,page:page.url(),...entry},base);(result.kind==='application'?collection:report.hostDiagnostics).push(result);};
 page.on('console',message=>{if(message.type()==='error')record({type:'console',message:message.text(),source:message.location().url,line:message.location().lineNumber,column:message.location().columnNumber},report.consoleErrors);});
 page.on('response',response=>{if(response.status()>=400)record({type:'response',url:response.url(),status:response.status()},report.resourceErrors);});
 page.on('requestfailed',request=>record({type:'requestfailed',url:request.url(),error:request.failure()?.errorText},report.resourceErrors));
}
async function audit(page){
 const x=await page.evaluate(()=>{const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';return{width:innerWidth,scroll:document.documentElement.scrollWidth,headings:document.querySelectorAll('main h1').length,nested:document.querySelectorAll('p p').length,inputs:[...document.querySelectorAll('main input,main select')].filter(e=>!e.labels?.length&&!e.getAttribute('aria-label')).map(e=>e.outerHTML),overflow:[...document.querySelectorAll('main *')].filter(e=>visible(e)&&!e.closest('.ac-table')&&e.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(e=>({tag:e.tagName,cls:e.className?.baseVal??e.className,text:e.textContent.slice(0,60)}))};});
 assert(x.scroll<=x.width+1,JSON.stringify(x));assert.deepEqual(x.overflow,[],JSON.stringify(x));assert.equal(x.headings,1);assert.equal(x.nested,0);assert.deepEqual(x.inputs,[]);const labels=await page.locator('.ac-figure svg:visible text').evaluateAll(es=>es.map(e=>({text:e.textContent,renderedFont:parseFloat(getComputedStyle(e).fontSize)*Math.hypot(e.getScreenCTM().a,e.getScreenCTM().b)})));for(const label of labels)assert(label.renderedFont>=13.5,`Unreadably scaled SVG label: ${JSON.stringify(label)}`);return{...x,svgLabels:labels};
}
(async()=>{try{
 const localHTML=fs.readFileSync(path.join(dist,'index.html'),'utf8');const assets=[...localHTML.matchAll(/(?:src|href)="([^"]+\/assets\/[^\"]+)"/g)].map(m=>m[1]);assert(assets.length>=2);
 report.assets=assets.map(url=>{const name=url.split('/assets/')[1],bytes=fs.readFileSync(path.join(dist,'assets',name));return{asset:name,bytes:bytes.length,sha256:hash(bytes)};});
 if(process.env.LIVE_URL){base=process.env.LIVE_URL.endsWith('/')?process.env.LIVE_URL:process.env.LIVE_URL+'/';await check('exact published HTML and full asset bytes match this dist',async()=>{const html=await fetch(base+'?child-developmentqa='+Date.now()).then(r=>{assert(r.ok);return r.text();});const compared=[];for(const url of assets){assert(html.includes(url),`Missing asset ${url}`);const remote=Buffer.from(await fetch(new URL(url,base)).then(r=>{assert(r.ok);return r.arrayBuffer();}));const local=fs.readFileSync(path.join(dist,'assets',url.split('/assets/')[1]));assert.equal(remote.length,local.length);assert.equal(hash(remote),hash(local));compared.push({url,bytes:remote.length,sha256:hash(remote)});}return compared;});if(report.checks.some(c=>c.status==='failed'))throw Error('Published bytes do not match: refusing to test unrelated code');}
 else{server=http.createServer((req,res)=>{let name=decodeURIComponent(req.url.split('?')[0]).replace(/^\/my-books\//,'/');if(name==='/favicon.ico'){res.writeHead(204).end();return;}if(name==='/'||!path.extname(name))name='/index.html';const full=path.resolve(dist,'.'+name);if(!full.startsWith(dist+path.sep)){res.writeHead(403).end();return;}fs.readFile(full,(error,bytes)=>{if(error){res.writeHead(404).end();return;}res.setHeader('Content-Type',name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':'text/html');res.end(bytes);});});await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}/my-books/`;}
 report.base=base;
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});

 for(const width of [1440,850,390,320]) {
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(10000);observe(page,width);
  for(const route of routes)await check(`${width} render ${route}`,async()=>{await visit(page,route);const result=await audit(page);await snap(page,`${width}-${route.replaceAll('/','-')}`);return result;});
  await visit(page,'/child-family/care-network');const lab=page.locator('[data-cf-lab=network]');
  await check(`${width} roles preserved across family scenes and static reset`,async()=>{
   const initial=await lab.innerText();await page.waitForTimeout(500);assert.equal(await lab.innerText(),initial);
   for(const id of ['single','shared','apart']){await lab.getByLabel('합성 장면',{exact:true}).selectOption(id);assert.equal(await lab.locator('.cf-person').count(),id==='single'?1:2);assert.equal(await lab.locator('.cf-role-pills span').count(),2);assert((await lab.locator('.cf-result').innerText()).includes('권한: 미확인'));await snap(page,`${width}-network-${id}`,lab);}
   await lab.locator('summary').click();assert.equal(await lab.locator('details li').count(),3);const reset=lab.getByRole('button',{name:'전체 초기화',exact:true});await reset.focus();assert.notEqual(await reset.evaluate(e=>getComputedStyle(e).outlineStyle),'none');await page.keyboard.press('Enter');assert.equal(await lab.getByLabel('합성 장면',{exact:true}).inputValue(),'single');await audit(page);
  });
  await visit(page,'/child-family/care-work');const work=page.locator('[data-cf-lab=work]');
  await check(`${width} work roles independent acknowledgment invalidation unknown gap and keyboard`,async()=>{
   for(const p of ['A','B'])for(const e of ['A','B']){await work.getByLabel('알아차림·준비 제안',{exact:true}).selectOption(p);await work.getByLabel('실행 담당 제안',{exact:true}).selectOption(e);assert.equal(await work.locator('[data-step=notice] .cf-work-slot').evaluate(x=>getComputedStyle(x).gridColumnStart),p==='A'?'2':'3');assert.equal(await work.locator('[data-step=execute] .cf-work-slot').evaluate(x=>getComputedStyle(x).gridColumnStart),e==='A'?'2':'3');assert((await work.locator('.cf-result').innerText()).includes('공정성: 미확인'));assert.equal(await work.locator('.cf-work-gap').count(),1);}
   const ack=work.getByLabel('가상 장면의 실행 인수 수락',{exact:true});await ack.focus();assert.notEqual(await ack.evaluate(e=>getComputedStyle(e).outlineStyle),'none');await page.keyboard.press('Space');assert(await ack.isChecked());assert.equal(await work.locator('.cf-pending').count(),2);await work.locator('summary').click();assert((await work.locator('details li').nth(2).innerText()).includes('수락'));await work.locator('summary').click();await work.getByLabel('알아차림·준비 제안',{exact:true}).selectOption('A');assert(!(await ack.isChecked()));assert.equal(await work.locator('.cf-pending').count(),3);await ack.check();await snap(page,`${width}-work-accepted`,work);await work.getByLabel('실행 담당 제안',{exact:true}).selectOption('A');assert(!(await ack.isChecked()));assert.equal(await work.locator('.cf-pending').count(),3);await snap(page,`${width}-work-changed`,work);
   await work.locator('summary').click();assert.equal(await work.locator('details li').count(),4);const reset=work.getByRole('button',{name:'전체 초기화',exact:true});await reset.focus();await page.keyboard.press('Enter');assert.equal(await work.getByLabel('알아차림·준비 제안',{exact:true}).inputValue(),'A');assert.equal(await work.getByLabel('실행 담당 제안',{exact:true}).inputValue(),'B');assert(!(await ack.isChecked()));await snap(page,`${width}-work-reset`,work);await audit(page);
  });
  await visit(page,'/child-family/handover');const handover=page.locator('[data-cf-lab=handover]');
  await check(`${width} handover four confirmations content invalidation static and keyboard`,async()=>{
   assert.equal(await handover.locator('[data-done=true]').count(),0);
   const next=handover.getByRole('button',{name:'다음 확인 단계',exact:true});
   for(let step=1;step<=4;step++){await next.focus();assert.notEqual(await next.evaluate(e=>getComputedStyle(e).outlineStyle),'none');await page.keyboard.press('Enter');assert.equal(await handover.locator('[data-done=true]').count(),step);if(step<4)assert((await handover.locator('.cf-result').innerText()).includes('담당 수락 미확인'));}
   assert(await next.isDisabled());await handover.locator('summary').click();assert((await handover.locator('details').innerText()).includes('담당 수락: 확인'));await snap(page,`${width}-handover-accepted`,handover);
   await handover.getByRole('button',{name:'인계 내용 바꾸기',exact:true}).click();assert.equal(await handover.locator('[data-done=true]').count(),0);assert((await handover.locator('details').innerText()).includes('담당 수락: 미확인'));assert((await handover.locator('.cf-envelope').innerText()).includes('그림책을 덮고'));await snap(page,`${width}-handover-changed`,handover);
   await handover.getByRole('button',{name:'전체 초기화',exact:true}).click();assert.equal(await handover.locator('[data-done=true]').count(),0);assert((await handover.locator('.cf-envelope').innerText()).includes('그림책을 가리켰음'));await audit(page);
  });
  await visit(page,'/child-family/before-childcare');const childcare=page.locator('[data-cf-lab=childcare]');
  await check(`${width} childcare two spaces question-specific reply unknowns static and reset`,async()=>{
   const reply=childcare.getByLabel('가상 기관 답변 확인',{exact:true});
   for(const topic of ['visit','contact','routine']){await childcare.getByLabel('준비할 질문',{exact:true}).selectOption(topic);assert(!(await reply.isChecked()));assert.equal(await childcare.locator('[data-replied=false]').count(),1);await reply.focus();assert.notEqual(await reply.evaluate(e=>getComputedStyle(e).outlineStyle),'none');await page.keyboard.press('Space');assert(await reply.isChecked());assert.equal(await childcare.locator('[data-replied=true]').count(),1);assert((await childcare.locator('.cf-result').innerText()).includes('아이의 적응 기간·결과'));await snap(page,`${width}-childcare-${topic}`,childcare);}
   await childcare.locator('summary').click();assert((await childcare.locator('details').innerText()).includes(await childcare.locator('.cf-inbound strong').innerText()));await childcare.getByRole('button',{name:'전체 초기화',exact:true}).click();assert(!(await reply.isChecked()));assert.equal(await childcare.getByLabel('준비할 질문',{exact:true}).inputValue(),'visit');await audit(page);
  });
await visit(page,'/child-family/childcare-adjustment');
const adjustment=page.locator('[data-cf-lab=adjustment]');
await check(`${width} adjustment contexts remain distinct and missing record cannot become success`,async()=>{
 const {adjustmentFrame}=await model('adjustment');
 const parity=async(day,shared)=>{const f=adjustmentFrame(Number(day),shared);assert.deepEqual(await adjustment.locator('.cfc-observation p').allTextContents(),f.slots.map(x=>x.text));await adjustment.locator('details').evaluate(e=>e.open=true);assert.deepEqual(await adjustment.locator('details li').allTextContents(),f.slots.map(x=>`${x.context}: ${x.text}`));assert((await adjustment.locator('details').innerText()).includes(f.question));await adjustment.locator('details').evaluate(e=>e.open=false);};
 const select=adjustment.getByLabel('가상 기록 선택',{exact:true});
 const shared=adjustment.getByLabel('교사 기록 함께 보기',{exact:true});
 for(const day of ['0','1','2']){
  await select.selectOption(day);await shared.uncheck();await parity(day,false);
  assert.equal(await adjustment.locator('[data-context="1"]').getAttribute('data-known'),'false');
  await snap(page,`${width}-adjustment-${day}-gap`,adjustment);
  await shared.focus();assert.notEqual(await shared.evaluate(e=>getComputedStyle(e).outlineStyle),'none');await page.keyboard.press('Space');
  assert.equal(await adjustment.locator('[data-context="1"]').getAttribute('data-known'),day==='1'?'false':'true');
  await parity(day,true);
  assert.equal(await adjustment.locator('.cfc-time-link.cfc-connected').count(),day==='1'?0:2);
  await snap(page,`${width}-adjustment-${day}-shared`,adjustment);
 }
 await adjustment.locator('summary').click();
 assert.equal(await adjustment.locator('details li').count(),3);
 assert((await adjustment.locator('details').innerText()).includes('이후의 적응 경과'));
 await adjustment.getByRole('button',{name:'전체 초기화',exact:true}).focus();await page.keyboard.press('Enter');
 assert.equal(await select.inputValue(),'0');assert(!(await shared.isChecked()));await audit(page);
});
await visit(page,'/child-family/care-agreements');
const agreements=page.locator('[data-cf-lab=agreements]');
await check(`${width} agreement moves preference not safety boundary or unanswered institution rule`,async()=>{
 const {agreementFrame}=await model('agreements');
 const parity=async(option,answer)=>{const f=agreementFrame(option,answer);assert.deepEqual(await agreements.locator('.cfc-choice span').allTextContents(),f.choices.map(x=>x.label));await agreements.locator('details').evaluate(e=>e.open=true);assert.deepEqual(await agreements.locator('details li').allTextContents(),f.choices.map(x=>`${x.owner}: ${x.label}`));assert((await agreements.locator('details').innerText()).includes(f.rule.label));await agreements.locator('details').evaluate(e=>e.open=false);};
 await parity('separate',false);
 const select=agreements.getByLabel('인사 방식 제안',{exact:true});
 const answer=agreements.getByLabel('가상 기관의 장소 답변 보기',{exact:true});
 const boundary=await agreements.locator('.cfc-boundary-label').innerText();
 assert.equal(await agreements.locator('.cfc-choice').count(),2);
 const before=await agreements.locator('.cfc-choice').first().boundingBox();
 await snap(page,`${width}-agreements-separate`,agreements);
 await select.selectOption('shared');await parity('shared',false);assert.equal(await agreements.locator('.cfc-choice').count(),1);
 const after=await agreements.locator('.cfc-choice').first().boundingBox();assert.notDeepEqual(before,after);
 assert.equal(await agreements.locator('.cfc-boundary-label').innerText(),boundary);
 assert.equal(await agreements.locator('.cfc-rule').getAttribute('data-rule-known'),'false');
 await snap(page,`${width}-agreements-shared-question`,agreements);
 await answer.focus();assert.notEqual(await answer.evaluate(e=>getComputedStyle(e).outlineStyle),'none');await page.keyboard.press('Space');
 assert.equal(await agreements.locator('.cfc-rule').getAttribute('data-rule-known'),'true');
 await parity('shared',true);await select.selectOption('separate');await parity('separate',true);assert(await answer.isChecked());
 await agreements.locator('summary').click();
 assert((await agreements.locator('details').innerText()).includes('실제 기관의 규칙'));
 await snap(page,`${width}-agreements-answer-static`,agreements);
 await agreements.getByRole('button',{name:'전체 초기화',exact:true}).focus();await page.keyboard.press('Enter');
 assert.equal(await select.inputValue(),'separate');assert(!(await answer.isChecked()));await audit(page);
});

// Insert within width loop, before reading preservation checks. Uses existing visit/audit/snap/check helpers.
for (const [route, kind] of [['before-new-sibling','before'], ['living-with-sibling','living']]) {
 await visit(page,`/child-family/${route}`);
 const sibling=page.locator(`[data-sibling-lab=${kind}]`);
 await check(`${width} ${route} adult responsibility, age, static, keyboard and reset`,async()=>{
  const models=await model('sibling'),frame=kind==='before'?models.beforeSiblingFrame:models.livingSiblingFrame;
  const initialExplanation=frame('1–2세').explanation;assert((await sibling.locator('[role=status]').innerText()).includes(initialExplanation));
  const initialNeeds=await sibling.locator('.sibling-needs>div>span:first-of-type').allTextContents();
  const initial=await sibling.innerText();
  const initialPaths=await sibling.locator('svg').evaluateAll(es=>es.map(e=>e.innerHTML));
  await page.waitForTimeout(350);assert.equal(await sibling.innerText(),initial);
  await sibling.getByLabel('기존 아이 연령',{exact:true}).selectOption('2–3세');
  assert.deepEqual(await sibling.locator('svg').evaluateAll(es=>es.map(e=>e.innerHTML)),initialPaths);
  const changedExplanation=frame('2–3세').explanation;assert.notEqual(changedExplanation,initialExplanation);assert((await sibling.locator('[role=status]').innerText()).includes(changedExplanation));assert(!(await sibling.locator('[role=status]').innerText()).includes(initialExplanation));
  await snap(page,`${width}-${route}-initial`,sibling);
  const shared=sibling.getByRole('button',{name:kind==='before'?'지원 역할 수락 예':'지원 성인과 나누는 예',exact:true});
  await sibling.getByLabel('기존 아이 연령',{exact:true}).focus();await page.keyboard.press('Tab');await page.keyboard.press('Tab');assert(await shared.evaluate(e=>e===document.activeElement));assert.notEqual(await shared.evaluate(e=>getComputedStyle(e).outlineStyle),'none');
  await page.keyboard.press('Enter');assert.equal(await shared.getAttribute('aria-pressed'),'true');
  assert.notDeepEqual(await sibling.locator('svg').evaluateAll(es=>es.map(e=>e.innerHTML)),initialPaths);
  assert((await sibling.locator('.sibling-connections').last().innerText()).includes('성인 B → 기존 아이'));
  assert((await sibling.locator('.sibling-connections').last().innerText()).includes('성인 A → 새 아기'));
  await sibling.locator('summary').click();
  const alternate=await sibling.locator('details').innerText();
  for(const line of await sibling.locator('.sibling-connections li').allTextContents())assert(alternate.includes(line));
  assert((await sibling.locator('.sibling-facts').innerText()).includes('아직 모르는 것'));
  if(kind==='living'){assert.equal(await sibling.locator('.sibling-needs>div').count(),2);assert.deepEqual(await sibling.locator('.sibling-needs>div>span:first-of-type').allTextContents(),initialNeeds);const f=frame('2–3세','shared');for(const n of f.needs){assert(alternate.includes(`${n.label}: ${n.need} → ${n.owner}: ${n.action}`));}}
  await snap(page,`${width}-${route}-shared-static`,sibling);await audit(page);
  const reset=sibling.getByRole('button',{name:'처음으로',exact:true});await reset.focus();await page.keyboard.press('Enter');
  assert.equal(await sibling.getByLabel('기존 아이 연령',{exact:true}).inputValue(),'1–2세');
  assert.deepEqual(await sibling.locator('svg').evaluateAll(es=>es.map(e=>e.innerHTML)),initialPaths);
  await sibling.locator('summary').click();await snap(page,`${width}-${route}-reset`,sibling);await audit(page);
 });
}

  await visit(page,'/child-family/backup-care');
  const backup=page.locator('[data-cf-lab=backup]');
  await check(`${width} backup scope acknowledgment gaps static keyboard reset`,async()=>{
   const {backupFrame}=await model('backup-rest');
   const absent=backup.getByLabel('부재한 성인',{exact:true}),stage=backup.getByLabel('C의 응답 상태',{exact:true}),range=backup.getByLabel('C에게 요청할 범위',{exact:true});
   const parity=async(a,s,r)=>{const f=backupFrame(a,s,r);assert.deepEqual(await backup.locator('.cf-coverage').allTextContents(),f.cells.map(c=>c.owner?`성인 ${c.owner}`:'? 빈 담당'));assert.equal(await backup.locator('[data-gap=true]').count(),f.gapTimes.length);await backup.locator('details').evaluate(e=>e.open=true);assert.deepEqual(await backup.locator('details li').allTextContents(),f.cells.map(c=>`${c.time}: 기존 성인 ${c.original} → ${c.owner?`성인 ${c.owner}`:'담당 공백'} · ${c.status}`));await backup.locator('details').evaluate(e=>e.open=false);};
   await parity('B','candidate','partial');await snap(page,`${width}-backup-gap`,backup);
   await stage.focus();assert.notEqual(await stage.evaluate(e=>getComputedStyle(e).outlineStyle),'none');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');assert.equal(await stage.inputValue(),'contact');await parity('B','contact','partial');
   await stage.selectOption('accepted');await parity('B','accepted','partial');await snap(page,`${width}-backup-partial`,backup);
   await range.selectOption('full');assert.equal(await stage.inputValue(),'candidate');await parity('B','candidate','full');await stage.selectOption('accepted');await parity('B','accepted','full');assert((await backup.locator('.cf-result').innerText()).includes('실제 인계 완료 아님'));await snap(page,`${width}-backup-covered`,backup);
   await absent.selectOption('A');assert.equal(await stage.inputValue(),'candidate');await parity('A','candidate','full');await range.selectOption('partial');await stage.selectOption('accepted');await parity('A','accepted','partial');await snap(page,`${width}-backup-uncovered-first`,backup);
   const reset=backup.getByRole('button',{name:'전체 초기화',exact:true});await reset.focus();await page.keyboard.press('Enter');await reset.click();assert.equal(await absent.inputValue(),'B');assert.equal(await stage.inputValue(),'candidate');assert.equal(await range.inputValue(),'partial');await parity('B','candidate','partial');await backup.locator('summary').click();await snap(page,`${width}-backup-static-reset`,backup);await audit(page);
  });
  await visit(page,'/child-family/caregiver-rest');
  const rest=page.locator('[data-cf-lab=rest]');
  await check(`${width} rest requires acceptance and handover with exact static parity`,async()=>{
   const {restFrame}=await model('backup-rest'),slot=rest.getByLabel('성인 A의 희망 휴식',{exact:true}),accepted=rest.getByLabel('성인 B가 해당 시간을 수락한 예제',{exact:true}),handover=rest.getByLabel('성인 B의 돌봄 인수를 확인한 예제',{exact:true});
   const parity=async(s,a,h)=>{const f=restFrame(s,a,h);assert.equal(await rest.locator('.cf-rest-board').getAttribute('data-covered'),String(f.covered));assert.deepEqual(await rest.locator('.cf-rest-duty strong').allTextContents(),f.cells.map(c=>c.adult));assert.deepEqual(await rest.locator('.cf-rest-activity').evaluateAll(es=>es.map(e=>{const c=e.cloneNode(true);c.querySelector('small').remove();return c.textContent;})),f.cells.map(c=>c.activity));assert.equal(await rest.locator('.cf-rest-activity[data-rest=true]').count(),f.covered?1:0);await rest.locator('details').evaluate(e=>e.open=true);assert.deepEqual(await rest.locator('details li').allTextContents(),f.cells.map(c=>`${c.time} · 성인 A: ${c.activity} · 돌봄: 성인 ${c.adult} · ${c.status}`));await rest.locator('details').evaluate(e=>e.open=false);};
   assert(await handover.isDisabled());await parity(1,false,false);await snap(page,`${width}-rest-request`,rest);
   await accepted.focus();assert.notEqual(await accepted.evaluate(e=>getComputedStyle(e).outlineStyle),'none');await page.keyboard.press('Space');await parity(1,true,false);await snap(page,`${width}-rest-accepted-not-handed`,rest);
   await handover.focus();await page.keyboard.press('Space');await parity(1,true,true);await snap(page,`${width}-rest-covered`,rest);
   await slot.selectOption('2');assert(!(await accepted.isChecked()));assert(!(await handover.isChecked()));assert(await handover.isDisabled());await parity(2,false,false);await snap(page,`${width}-rest-changed-invalidated`,rest);
   const reset=rest.getByRole('button',{name:'전체 초기화',exact:true});await reset.focus();await page.keyboard.press('Enter');await reset.click();assert.equal(await slot.inputValue(),'1');await parity(1,false,false);await rest.locator('summary').click();await snap(page,`${width}-rest-static-reset`,rest);await audit(page);
  });

  await visit(page,'/child-family/finding-support');
  const support=page.locator('[data-cf-lab=support]');
  await check(`${width} support inquiry never confirms unknown conditions`,async()=>{
   const {supportFrame}=await model('support-review');
   const parity=async(selected)=>{const f=supportFrame(selected);assert.equal(await support.locator('button[aria-pressed=true]').count(),1);assert((await support.locator('button[aria-pressed=true]').innerText()).startsWith(f.conditions.find(c=>c.selected).label));assert.deepEqual(await support.locator('.cf-condition-bridge button span').allTextContents(),f.conditions.map(c=>`? ${c.status}`));assert((await support.locator('.cf-result').innerText()).includes(f.question));assert((await support.locator('.cf-result').innerText()).includes(f.result));await support.locator('details').evaluate(e=>e.open=true);assert.deepEqual(await support.locator('details li').allTextContents(),f.conditions.map(c=>`${c.label}: ${c.note} · ${c.status}`));await support.locator('details').evaluate(e=>e.open=false);};
   await parity('hours');await snap(page,`${width}-support-hours`,support);
   for(const [id,label] of [['cost','비용'],['target','대상']]){const b=support.getByRole('button',{name:new RegExp('^'+label)});await b.focus();assert.notEqual(await b.evaluate(e=>getComputedStyle(e).outlineStyle),'none');await page.keyboard.press('Enter');await parity(id);await snap(page,`${width}-support-${id}`,support);}
   assert.equal(await support.locator('input,textarea,[contenteditable=true]').count(),0);const reset=support.getByRole('button',{name:'전체 초기화',exact:true});await reset.focus();await page.keyboard.press('Enter');await reset.click();await parity('hours');await support.locator('summary').click();await snap(page,`${width}-support-static-reset`,support);await audit(page);
  });
  await visit(page,'/child-family/family-review');
  const review=page.locator('[data-cf-lab=review]');
  await check(`${width} one weekly change preserves fixed before and static model rows`,async()=>{
   const {reviewFrame}=await model('support-review'),choice=review.getByLabel('가상 주간의 한 가지 변경',{exact:true});
   const before=await review.locator('.cf-week').first().innerText();
   const parity=async(change)=>{const f=reviewFrame(change);assert.equal(await review.locator('.cf-week').first().getAttribute('data-change'),'none');assert.equal(await review.locator('.cf-week').first().innerText(),before);assert.equal(await review.locator('.cf-week').last().getAttribute('data-change'),change);assert.deepEqual(await review.locator('.cf-week').last().locator('.cf-week-cell span').allTextContents(),f.rows.flatMap(r=>r.cells.map(c=>c.text)));assert.deepEqual(await review.locator('.cf-week').last().locator('.cf-week-cell').evaluateAll(es=>es.map(e=>e.dataset.state)),f.rows.flatMap(r=>r.cells.map(c=>c.state)));await review.locator('details').evaluate(e=>e.open=true);assert.deepEqual(await review.locator('details li').allTextContents(),f.rows.flatMap(r=>r.cells.map(c=>`${c.day}: ${c.text}`)));assert((await review.locator('details').innerText()).includes(f.question));await review.locator('details').evaluate(e=>e.open=false);};
   await parity('none');await snap(page,`${width}-review-before`,review);
   await choice.focus();assert.notEqual(await choice.evaluate(e=>getComputedStyle(e).outlineStyle),'none');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');assert.equal(await choice.inputValue(),'handover');await parity('handover');await snap(page,`${width}-review-handover`,review);
   await choice.selectOption('rest');await parity('rest');assert.equal(await review.locator('.cf-week').last().locator('[data-state=rest]').count(),1);await snap(page,`${width}-review-rest`,review);
   const reset=review.getByRole('button',{name:'전체 초기화',exact:true});await reset.focus();await page.keyboard.press('Enter');await reset.click();assert.equal(await choice.inputValue(),'none');await parity('none');assert.deepEqual(await review.locator('.cf-week').first().locator('.cf-week-row').allTextContents(),await review.locator('.cf-week').last().locator('.cf-week-row').allTextContents());await review.locator('summary').click();await snap(page,`${width}-review-static-reset`,review);await audit(page);
  });
  await check(`${width} blank form print button, actual print media, and isolated scope`,async()=>{
   const form=page.locator('.cf-blank-review');assert.equal(await form.count(),1);assert.equal(await form.locator('.cf-blank-line').count(),6);assert.equal(await form.locator('input,textarea,[contenteditable=true]').count(),0);
   await page.evaluate(()=>{window.__familyPrintCalls=0;window.print=()=>{window.__familyPrintCalls++;};});const print=form.getByRole('button',{name:'빈 양식 인쇄',exact:true});await print.focus();assert.notEqual(await print.evaluate(e=>getComputedStyle(e).outlineStyle),'none');await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>window.__familyPrintCalls),1);
   const screenViewport=page.viewportSize();await page.setViewportSize({width:794,height:1123});await page.emulateMedia({media:'print'});
   try{assert.equal(await form.evaluate(e=>getComputedStyle(e).visibility),'visible');const descendants=await form.locator('h3,p,.cf-blank-line,.cf-blank-line strong,.cf-blank-line span').evaluateAll(es=>es.map(e=>({tag:e.tagName,text:e.textContent,visibility:getComputedStyle(e).visibility,display:getComputedStyle(e).display,rects:e.getClientRects().length})));assert(descendants.length>=20);for(const e of descendants){assert.equal(e.visibility,'visible',JSON.stringify(e));assert.notEqual(e.display,'none',JSON.stringify(e));assert(e.rects>0,JSON.stringify(e));}assert.equal(await review.evaluate(e=>getComputedStyle(e).visibility),'hidden');assert.equal(await review.evaluate(e=>getComputedStyle(e).display),'none');assert.equal(await review.evaluate(e=>e.getClientRects().length),0);assert.equal(await print.evaluate(e=>getComputedStyle(e).display),'none');await snap(page,`${width}-family-review-print-preview`);await snap(page,`${width}-family-review-print-form`,form);const layout=await page.evaluate(()=>{const f=document.querySelector('.cf-blank-review'),r=f.getBoundingClientRect();return{formHeight:r.height,formTop:r.top,documentHeight:document.documentElement.scrollHeight,nonFormBoxes:[...document.querySelectorAll('#root > :not(.reader),.reader > aside,#main-content > :not(.prose),#main-content > .prose > :not(.cf-blank-review)')].filter(e=>e.getClientRects().length).map(e=>e.className||e.tagName)};});assert.deepEqual(layout.nonFormBoxes,[]);assert(layout.formTop>=0&&layout.formTop<2,JSON.stringify(layout));assert(layout.formHeight<=1032,JSON.stringify(layout));assert(layout.documentHeight<=1124,JSON.stringify(layout));const pdfName=`${width}-family-review-print-a4.pdf`,pdf=await page.pdf({path:path.join(out,pdfName),format:'A4',margin:{top:'12mm',right:'12mm',bottom:'12mm',left:'12mm'},preferCSSPageSize:true,printBackground:true,displayHeaderFooter:false});const pages=[...pdf.toString('latin1').matchAll(/\/Type\s*\/Page\b/g)].length;report.printEvidence??=[];report.printEvidence.push({file:pdfName,pages,layout});checkpoint();assert.equal(pages,1,`Expected one nonblank A4 form page, got ${pages}`);}
   finally{await page.emulateMedia({media:'screen'});await page.setViewportSize(screenViewport);}
   await visit(page,'/child-family/care-network');await page.emulateMedia({media:'print'});
   try{assert.equal(await page.locator('.cf-blank-review').count(),0);assert.equal(await page.locator('main h1').evaluate(e=>getComputedStyle(e).visibility),'visible');assert.equal(await page.locator('[data-cf-lab=network]').evaluate(e=>getComputedStyle(e).visibility),'visible');assert.notEqual(await page.locator('[data-cf-lab=network]').evaluate(e=>getComputedStyle(e).display),'none');assert((await page.locator('[data-cf-lab=network]').boundingBox()).height>0);await snap(page,`${width}-other-chapter-print-scope`);}
   finally{await page.emulateMedia({media:'screen'});}
  });

  await check(`${width} volume six, dynamic implemented chapters, reading preservation`,async()=>{
   await page.evaluate(()=>localStorage.setItem('my-books:read:v1',JSON.stringify(['unknown/keep','child-development/development-map'])));await visit(page,'/');await page.reload();await page.getByRole('button',{name:/^육아·발달/}).click();const card=page.locator('a.home-book[href="#/child-family"]');assert.equal(await card.locator('.home-book-volume').innerText(),'육아·발달 6권');await card.click();assert.equal(await page.locator('.book-volume').innerText(),'육아·발달 6권');assert.equal(chapters.length,12);await visit(page,'/child-family/care-work');await page.getByRole('button',{name:'읽음으로 표시',exact:true}).click();await page.reload();const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('my-books:read:v1')));for(const id of ['unknown/keep','child-development/development-map','child-family/care-work'])assert(saved.includes(id));await page.getByRole('button',{name:'✓ 읽음 · 표시 취소',exact:true}).click();await page.reload();assert(!(await page.evaluate(()=>JSON.parse(localStorage.getItem('my-books:read:v1')))).includes('child-family/care-work'));await audit(page);
   for(const chapter of chapters){await visit(page,`/child-family/${chapter.id}`);await page.getByRole('button',{name:'읽음으로 표시',exact:true}).click();await page.reload();const all=await page.evaluate(()=>JSON.parse(localStorage.getItem('my-books:read:v1')));assert(all.includes(chapter.readId));assert(all.includes('unknown/keep'));assert(all.includes('child-development/development-map'));await page.getByRole('button',{name:'✓ 읽음 · 표시 취소',exact:true}).click();await page.reload();const removed=await page.evaluate(()=>JSON.parse(localStorage.getItem('my-books:read:v1')));assert(!removed.includes(chapter.readId));for(const id of all.filter(id=>id!==chapter.readId))assert(removed.includes(id));await page.getByRole('button',{name:'읽음으로 표시',exact:true}).click();await page.reload();assert((await page.evaluate(()=>JSON.parse(localStorage.getItem('my-books:read:v1')))).includes(chapter.readId));}
  });await context.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'no-preference'}),page=await context.newPage();observe(page,'normal');await check('normal motion same content and no autoplay',async()=>{for(const route of routes){await visit(page,route);const before=await page.locator('main').innerText();await page.waitForTimeout(700);assert.equal(await page.locator('main').innerText(),before);await audit(page);}});await context.close();
 await check('no application or unknown errors',async()=>{assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.consoleErrors,[]);assert.deepEqual(report.resourceErrors,[]);});
 }catch(error){report.fatal=String(error.stack||error);process.exitCode=1;}finally{await browser?.close();if(server)await new Promise(r=>server.close(r));report.finished=new Date().toISOString();report.passed=report.checks.filter(c=>c.status==='passed').length;report.failed=report.checks.filter(c=>c.status==='failed').length;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,failed:report.failed,fatal:report.fatal,screenshots:report.screenshots.length}));if(report.failed||report.fatal)process.exitCode=1;}})();
