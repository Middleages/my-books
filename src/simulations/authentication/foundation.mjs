const phase=n=>Math.max(0,Math.min(3,Math.trunc(Number(n)||0)));
export const subjects=Object.freeze({garam:{id:'sim-garam',name:'가람',role:'editor'},nuri:{id:'sim-nuri',name:'누리',role:'viewer'}});
export function identityFrame(step=0,person='garam',action='update',owner='nuri'){
 const s=phase(step),subject=subjects[person]??null;
 const authenticated=subject!==null,rolePermission=authenticated&&(action==='read'||subject.role==='editor'),objectPermission=authenticated&&(action==='read'||person===owner);
 return {step:s,person,action,owner,subject:s>=1?subject:null,identityStatus:s<1?'pending':authenticated?'authenticated':'anonymous',rolePermission:s>=2?rolePermission:null,objectPermission:s>=2?objectPermission:null,decision:s<3?'pending':authenticated&&rolePermission&&objectPermission?'allow':'deny',reason:s<3?'검사 중':!authenticated?'주체 확인 필요':!rolePermission?'역할에 수정 권한 없음':!objectPermission?'다른 소유자의 문서':'정책 허용'};
}
export function sessionFrame(step=0,options={}){
 const {cookie=true,scope='a',time=0,node='a',shared=false}=options,s=phase(step),cookiePresent=Boolean(cookie),eligible=cookiePresent&&scope==='a',sent=s>=1&&eligible;
 const recordExists=node==='a'||shared,expiresAt=600,valid=time<expiresAt;
 const matchingSession=s>=2&&sent&&recordExists,subject=matchingSession&&valid?'sim-garam':null;
 return {step:s,cookiePresent,scope,time,node,shared,expiresAt,eligible,sent,recordExists,matchingSession,subject:s>=2?subject:null,lookup:s<2?'pending':!sent?'not-sent':!recordExists?'missing':!valid?'expired':'valid',decision:s<3?'pending':subject?'authenticated':'anonymous',label:'SIM-SESSION-A'};
}
