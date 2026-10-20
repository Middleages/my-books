const phase=n=>Math.max(0,Math.min(3,Math.trunc(Number(n)||0)));
export const browserCases=Object.freeze({
 same:{label:'같은 origin',page:'https://api.example.test',target:'https://api.example.test/api/items',sameOrigin:true,sameSite:true,credentials:'same-origin',sameSiteCookie:'Lax',secure:true,pathMatch:true,cors:true,preflight:true,needsPreflight:false},
 blocked:{label:'같은 site · CORS 응답 허용 없음',page:'https://app.example.test',target:'https://api.example.test/api/items',sameOrigin:false,sameSite:true,credentials:'include',sameSiteCookie:'Lax',secure:true,pathMatch:true,cors:false,preflight:true,needsPreflight:false},
 allowed:{label:'같은 site · 정확한 CORS 허용',page:'https://app.example.test',target:'https://api.example.test/api/items',sameOrigin:false,sameSite:true,credentials:'include',sameSiteCookie:'Lax',secure:true,pathMatch:true,cors:true,preflight:true,needsPreflight:false},
 omitted:{label:'교차 origin · credentials 기본값',page:'https://app.example.test',target:'https://api.example.test/api/items',sameOrigin:false,sameSite:true,credentials:'same-origin',sameSiteCookie:'Lax',secure:true,pathMatch:true,cors:true,preflight:true,needsPreflight:false},
 cross:{label:'교차 site fetch · SameSite=Lax',page:'https://other.test',target:'https://api.example.test/api/items',sameOrigin:false,sameSite:false,credentials:'include',sameSiteCookie:'Lax',secure:true,pathMatch:true,cors:true,preflight:true,needsPreflight:false},
 http:{label:'HTTP 목적지 · Secure 쿠키',page:'http://api.example.test',target:'http://api.example.test/api/items',sameOrigin:true,sameSite:true,credentials:'same-origin',sameSiteCookie:'Lax',secure:true,pathMatch:true,cors:true,preflight:true,needsPreflight:false},
 path:{label:'목적지 /public · 쿠키 Path=/api',page:'https://api.example.test',target:'https://api.example.test/public',sameOrigin:true,sameSite:true,credentials:'same-origin',sameSiteCookie:'Lax',secure:true,pathMatch:false,cors:true,preflight:true,needsPreflight:false},
 preflight:{label:'JSON POST · preflight 거절',page:'https://app.example.test',target:'https://api.example.test/api/items',sameOrigin:false,sameSite:true,credentials:'include',sameSiteCookie:'Lax',secure:true,pathMatch:true,cors:false,preflight:false,needsPreflight:true}
});
export function browserFrame(step=0,scenario='blocked',httpOnly=true){
 const s=phase(step),c=browserCases[scenario]??browserCases.blocked;
 const transport=c.credentials==='include'||c.sameOrigin;
 const eligible=transport&&c.sameSite&&c.pathMatch&&(!c.secure||c.target.startsWith('https:'));
 const canSend=!c.needsPreflight||c.preflight;
 return {step:s,scenario,c,httpOnly,cookieEligible:eligible,cookieJsReadable:!httpOnly&&c.sameOrigin&&c.pathMatch&&(!c.secure||c.target.startsWith('https:')),requestSent:s>=1?canSend:null,cookieSent:s>=1?canSend&&eligible:null,serverHandled:s>=2?canSend:null,jsReadable:s>=3?canSend&&(c.sameOrigin||c.cors):null};
}
export const tokenCases=Object.freeze({valid:{label:'용도에 맞는 표본'},forged:{label:'변조 · 서명 불일치',signatureValid:false},algorithm:{label:'허용하지 않은 algorithm',allowedAlg:false},issuer:{label:'다른 issuer',issuerMatch:false},audience:{label:'다른 audience',audienceMatch:false},expired:{label:'만료 경계 도달',timeValid:false},idtoken:{label:'ID Token을 API에 제출',purposeMatch:false},malformed:{label:'형식 읽기 실패',parseable:false}});
export function tokenFrame(step=0,scenario='forged'){
 const s=phase(step),c=tokenCases[scenario]??tokenCases.forged;
 const values={parseable:true,allowedAlg:true,signatureValid:true,issuerMatch:true,audienceMatch:true,timeValid:true,purposeMatch:true,...c};
 const gates=[['parseable','구조 읽기',1],['allowedAlg','허용 algorithm',2],['signatureValid','서명 검증',2],['issuerMatch','issuer',2],['audienceMatch','audience',2],['timeValid','시간: now < exp',2],['purposeMatch','API용 access token',2]].map(([key,label,stage])=>({key,label,passed:s<stage||(key!=='parseable'&&!values.parseable)?null:values[key]}));
 const accepted=gates.every(g=>values[g.key]);
 return {step:s,scenario,label:c.label,parseable:values.parseable,gates,decision:s<3?'pending':accepted?'accept':'reject',failed:gates.filter(g=>g.passed===false).map(g=>g.label),claims:{issuer:scenario==='issuer'?'other.example.test':'id.example.test',audience:scenario==='audience'?'other-api':'document-api',purpose:scenario==='idtoken'?'ID Token':'access token',now:scenario==='expired'?600:599,exp:600}};
}
