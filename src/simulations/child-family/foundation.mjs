/** Independent educational role map, not a family assessment or an actual assignment. */
const cases={single:{label:'보호자 한 명과 지원 연결',daily:'보호자 A',prepare:'보호자 A',support:'도움을 상의할 성인 B'},shared:{label:'함께 돌보는 두 성인',daily:'성인 A',prepare:'성인 B',support:'도움을 상의할 성인 C'},apart:{label:'따로 살며 협력하는 성인들',daily:'성인 A',prepare:'성인 B',support:'도움을 상의할 성인 C'}};
export function networkFrame(id='single') {
 if(!Object.hasOwn(cases,id))throw new RangeError('Unknown scenario');const c=cases[id];
 const roles=[{role:'곁에서 돌보기',owner:c.daily},{role:'준비·연락',owner:c.prepare}];
 const groups=[...new Set(roles.map(r=>r.owner))].map(owner=>({owner,roles:roles.filter(r=>r.owner===owner).map(r=>r.role)}));
 return {id,label:c.label,groups,support:c.support,unknown:'지원 가능 여부·실제 인계 권한: 미확인',roles:roles.map(r=>({...r})),limit:'가족 형태의 우열·아이의 발달 결과를 판정하지 않습니다.'};
}
export function workFrame(planner='A',executor='B',accepted=false){
 if(!['A','B'].includes(planner)||!['A','B'].includes(executor)||typeof accepted!=='boolean')throw new RangeError('Unknown assignment');
 return {planner,executor,accepted,task:'가상 외출의 여벌 옷 준비',steps:[{id:'notice',label:'알아차림',detail:'필요한 준비가 있음을 알아차림',owner:planner,status:'제안'},{id:'prepare',label:'준비',detail:'무엇을 챙길지 살펴 준비함',owner:planner,status:'제안'},{id:'execute',label:'실행',detail:'가방에 넣는 일을 제안받음',owner:executor,status:accepted?'수락':'제안'},{id:'finish',label:'마무리',detail:'사용 뒤 정리와 다음 준비를 확인함',owner:null,status:'미정'}],handover:accepted?'예제 안에서 실행 인수를 수락함':'실행 담당 제안만 있음 · 수락 미확인',unknown:'마무리 담당·실제 부담과 공정성: 미확인'};
}
