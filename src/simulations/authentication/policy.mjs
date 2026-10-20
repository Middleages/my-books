const phase=n=>Math.max(0,Math.min(3,Math.trunc(Number(n)||0)));
export const ssoCases=Object.freeze({idp:{label:'IdP만 로그인 · B는 처음',idp:true,a:false,b:false},logoutA:{label:'A 로컬 로그아웃 · B는 유지',idp:true,a:true,b:true},expired:{label:'IdP 만료 · B 세션 없음',idp:false,a:true,b:false},existingB:{label:'IdP 만료 · 기존 B 세션 유효',idp:false,a:false,b:true}});
export function ssoFrame(step=0,scenario='idp'){
 const s=phase(step),c=ssoCases[scenario]??ssoCases.idp,needsTransaction=!c.b,needsPrompt=needsTransaction&&!c.idp;
 return{step:s,scenario,label:c.label,idpSession:c.idp||(s>=3&&needsPrompt),appASession:scenario==='logoutA'&&s>=1?false:c.a,appBSession:c.b||s>=3,transactionStarted:s>=1&&needsTransaction,prompted:s>=2?needsPrompt:null,validated:s>=3&&needsTransaction,reusedB:s>=1&&c.b,syntheticReauthentication:s>=3&&needsPrompt,stage:s===0?'기존 세션':s===1?'B 방문':s===2?'필요한 IdP 확인':'B 자체 세션 결정'};
}
export const policyMatrix=Object.freeze({viewer:Object.freeze(['read']),editor:Object.freeze(['read','update']),admin:Object.freeze(['read','update','delete'])});
const decide=(role,action,owner,tenant)=>{const actions=Object.hasOwn(policyMatrix,role)?policyMatrix[role]:[];const roleAllows=actions.includes(action),tenantAllows=tenant==='same',objectAllows=action==='read'||role==='admin'||(action==='update'&&owner==='garam');return{roleAllows,tenantAllows,objectAllows,allow:roleAllows&&tenantAllows&&objectAllows};};
export function authorizationFrame(step=0,{role='editor',action='update',owner='nuri',tenant='same',stale=false}={}){
 const s=phase(step),currentRole=stale?'viewer':role,claimRole=stale?'editor':role,current=decide(currentRole,action,owner,tenant),claim=decide(claimRole,action,owner,tenant);
 return{step:s,currentRole,claimRole,action,owner,tenant,policyVersion:stale?2:1,claimVersion:1,checks:{role:s>=1?current.roleAllows:null,tenant:s>=2?current.tenantAllows:null,object:s>=2?current.objectAllows:null},decision:s>=3?(current.allow?'allow':'deny'):'pending',staleOnlyDecision:s>=3?(claim.allow?'allow':'deny'):'pending'};
}
