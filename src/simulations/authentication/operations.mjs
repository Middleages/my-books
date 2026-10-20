import {tokenFrame} from './boundaries.mjs';
import {oidcFrame} from './delegation.mjs';
import {authorizationFrame} from './policy.mjs';
const phase=n=>Math.max(0,Math.min(3,Math.trunc(Number(n)||0)));
export const trustCases=Object.freeze({normal:'양쪽 경로 정상',ca:'브라우저만 CA 신뢰',dns:'BFF에서 DNS 실패',clock:'BFF 시각이 만료 경계 뒤',key:'새 kid · JWKS 갱신 실패',redirect:'등록 redirect 불일치',issuer:'내부 주소를 issuer로 오인'});
export function trustFrame(step=0,scenario='ca'){
 const s=phase(step),id=Object.hasOwn(trustCases,scenario)?scenario:'ca';
 const browser=true,dns=id!=='dns',tls=id!=='ca',reachable=dns&&tls,issuer=id!=='issuer',redirect=id!=='redirect',time=id!=='clock',key=id!=='key';
 const gates=[['browser','브라우저 → IdP DNS·TLS',1,browser],['dns','BFF → IdP DNS',2,dns],['tls','BFF의 TLS 신뢰',2,dns?tls:null],['discovery','BFF → discovery',2,reachable?true:null],['issuer','설정·metadata·주장의 issuer 일치',3,reachable?issuer:null],['key','신뢰한 JWKS의 kid 선택',3,reachable?key:null],['time','BFF 시각과 만료 비교',3,reachable?time:null],['redirect','등록 redirect 일치',1,redirect]].map(([id,label,at,value])=>({id,label,status:s<at||value===null?'unknown':value?'pass':'fail'}));
 return {step:s,scenario:id,gates,issuer:'https://id.example.test',connection:'id 서비스의 내부 접속 위치',browserReachable:s>=1?browser:null,serverReachable:s>=2?reachable:null,discoveryReachable:s>=2?reachable:null,jwksCache:id==='key'?['K-old']:['K-current'],keyId:id==='key'?'K-new':'K-current',jwksRefresh:s>=3&&id==='key'?'failed':'not-needed',now:id==='clock'?605:599,exp:600,clockSkew:0,decision:s<3?'pending':gates.every(g=>g.status==='pass')?'accept':'reject',failed:gates.filter(g=>g.status==='fail').map(g=>g.label),tlsBypass:false};
}
export const diagnosisCases=Object.freeze({loop:'로그인으로 반복 이동',audience:'API 401 · 표본 A',expired:'API 401 · 표본 B',permission:'API 403',jwks:'로그인 완료 실패 · 표본 C',csrf:'callback 거절 · 표본 D'});
export const excludedFields=Object.freeze(['Authorization','Cookie','code','access token','refresh token','ID Token','client secret','password']);
export function authDiagnosisFrame(step=0,scenario='audience'){
 const s=phase(step),id=Object.hasOwn(diagnosisCases,scenario)?scenario:'audience';
 const token=id==='audience'||id==='expired'?tokenFrame(3,id):null;
 const cb=id==='csrf'?oidcFrame(5,'state'):null;
 const policy=id==='permission'?authorizationFrame(3,{role:'viewer',action:'update',owner:'garam',tenant:'same'}):null;
 const trust=id==='jwks'?trustFrame(3,'key'):null;
 const target=id==='csrf'?'callback':id==='loop'?'session':id==='jwks'?'validation':'api';
 const reason=token?.failed.join(' · ')??(cb?'로그인 요청과 state 연결 불일치':policy?'현재 역할에 update 없음':trust?'새 kid의 검증 키 확보 실패':'앱 세션을 다음 요청에서 찾지 못함');
 const denied=token?token.decision==='reject':cb?cb.decision==='reject':policy?policy.decision==='deny':trust?trust.decision==='reject':true;
 const gates=[['start','로그인 시작'],['callback','callback'],['exchange','code 교환'],['validation','로그인 검증'],['session','앱 session'],['api','API 인가']].map(([gate,label])=>({id:gate,label,status:s>=2&&gate===target?(denied?'fail':'pass'):'unknown'}));
 const correlationId='SIM-CORR-'+Object.keys(diagnosisCases).indexOf(id);
 const log=s>=3?{correlationId,stage:target,result:denied?'reject':'pass',reasonCategory:id}:null;
 return{step:s,scenario:id,symptom:diagnosisCases[id],gates,target,reason:s>=2?reason:null,correlationId,log,redactedFields:excludedFields,conclusion:s<2?'요약만으로 실패 원인을 확정할 수 없음':reason,next:id==='loop'?'cookie 전송 범위와 세션 저장소를 각각 확인. IdP 장애라고 단정하지 않음':id==='jwks'?'신뢰한 JWKS 경로·키 회전·cache 갱신 상태 확인. 서명 검사 생략 금지':id==='permission'?'현재 역할·객체·tenant 정책 확인. 재로그인이 권한 부여는 아님':id==='csrf'?'시작한 로그인 거래와 callback의 연결 확인. 검증 끄지 않음':'API의 용도·issuer·audience·시간 판정 구분. 토큰 원문 수집 금지',actionExecuted:false};
}
