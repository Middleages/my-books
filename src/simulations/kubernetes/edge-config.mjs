// Deterministic observation steps, not real Kubernetes timing or a TLS implementation.
export function ingressFrames({mode='direct',host='study.example.test',path='/',outerValid=true,innerValid=true,controller=true,ready=true}={}) {
 const hostProxy=mode==='host-http'||mode==='host-tls';
 const innerTls=mode==='host-tls';
 const conflict=mode==='conflict';
 const route=host==='study.example.test'&&(path==='/'||path==='/health'||path.startsWith('/health/'));
 const hops=[
  {name:'브라우저',address:'사용자 기기',protocol:'HTTPS',stage:0},
  {name:hostProxy?'호스트 NGINX':'외부 진입 · ServiceLB',address:'192.0.2.10:443',protocol:'HTTPS',stage:1},
  {name:'Ingress controller · Traefik',address:hostProxy?`192.0.2.10:${innerTls?30443:30080}`: '10.42.0.10:8443',protocol:hostProxy&&!innerTls?'HTTP':'HTTPS',stage:hostProxy?2:1},
  {name:'Service · 논리적 대상 선택',address:'study-web.books-lab:80',protocol:'HTTP',stage:4},
  {name:'Pod · study-web',address:'10.42.0.21:8080',protocol:'HTTP',stage:5},
 ];
 const stop=conflict?0:!controller&&!hostProxy?1:!outerValid?1:!controller?2:innerTls&&!innerValid?2:!route?3:!ready?4:6;
 const outcome=conflict?'port-conflict':!controller&&!hostProxy?'no-controller':!outerValid?'outer-tls':!controller?'no-controller':innerTls&&!innerValid?'inner-tls':!route?'no-route':!ready?'no-endpoint':'success';
 const blockedHop=outcome==='outer-tls'?(hostProxy?1:2):outcome==='no-endpoint'?3:2;
 const failures={
  'port-conflict':'같은 노드 80/443 사용 계획이 겹칩니다. 요청 실험을 시작하지 않습니다. 기존 NGINX를 유지하고 진입 포트를 분리하세요.',
  'no-controller':'규칙 객체만으로 요청을 처리하지 못합니다. controller와 그 진입 Service의 실행·대상을 확인하세요.',
  'outer-tls':'브라우저가 외부 인증서를 검증하지 못했습니다. 앱 HTTP 요청 전 실패이며 HTTP 상태 코드가 아닙니다.',
  'inner-tls':'외부 TLS는 성공했지만 NGINX가 controller 인증서를 검증하지 못했습니다. NGINX의 CA·검증 이름·SNI를 확인하세요.',
  'no-route':'인증서 검증 뒤 HTTP host/path 규칙이 맞지 않습니다. controller의 라우팅 규칙과 전달된 Host를 확인하세요.',
  'no-endpoint':'규칙은 맞지만 Service에 ready 대상이 없습니다. EndpointSlice와 Pod 준비 상태를 확인하세요.',
  success:'요청이 앱에 도달했습니다. 응답은 역방향으로 돌아갑니다. 내부 마지막 구간은 HTTP이며 외부 TLS가 이 구간을 암호화하지 않습니다.',
 };
 const titles=['연결 전에 진입 구성을 확인','브라우저의 TLS 검증','controller까지의 연결','HTTP host/path 규칙 선택','Service의 ready 대상 선택','앱 포트에 요청 도착','응답과 구간별 결과'];
 const details=[
  hostProxy?'NGINX가 외부 443을 유지합니다. controller는 별도 NodePort로 노출하고 기본 ServiceLB의 80/443 점유를 피하도록 구성한 조건입니다.':'기존 80/443 리스너가 없는 실습 노드에서 ServiceLB가 Traefik의 외부 진입을 제공합니다.',
  `브라우저의 검증 상대는 ${hostProxy?'호스트 NGINX':'Ingress controller'}입니다. 이름·체인·유효기간·브라우저 신뢰 조건을 검사합니다.`,
  hostProxy?(innerTls?'NGINX가 새 HTTPS 연결을 만들고 controller 인증서를 독립적으로 검증합니다.':'NGINX가 별도 NodePort로 HTTP를 전달합니다. 이 구간에는 TLS가 없습니다.'):'ServiceLB는 TLS를 종료하지 않습니다. controller가 복호화하고 HTTP 규칙을 읽습니다.',
  `Host ${host}, path ${path}. 규칙은 study.example.test의 / Exact와 /health Prefix입니다. 경로를 지우거나 다시 쓰지 않습니다.`,
  'study-web Service port 80 → ready Pod targetPort 8080. Service는 별도 프록시 프로세스가 아닌 논리적 선택 경계입니다.',
  `Pod가 HTTP ${path} 요청을 받습니다. 이 모델은 앱 응답 가능 조건을 가정합니다.`,
  failures[outcome],
 ];
 return titles.map((title,i)=>{
  const failed=i>=stop&&outcome!=='success';
  const outerAttempt=i>=1&&stop>=1&&!conflict&&!(stop===1&&outcome==='no-controller');
  const innerAttempt=innerTls&&i>=2&&stop>=2&&controller;
  return {
   title:failed?'멈춘 구간 · '+({ 'port-conflict':'포트 계획 충돌','no-controller':'controller 없음','outer-tls':'외부 TLS','inner-tls':'내부 TLS','no-route':'분기 규칙','no-endpoint':'준비 대상'}[outcome]):title,
   detail:failed?failures[outcome]:details[i],outcome:i>=stop?outcome:'pending',
   mode,host,path,route,service:{name:'study-web',port:80,targetPort:8080,ready:ready?1:0},
   outer:{terminator:hostProxy?'호스트 NGINX':'Ingress controller',status:outerAttempt?(outerValid?'passed':'failed'):'pending'},
   inner:{terminator:innerTls?'Ingress controller':'TLS 없음',status:innerTls?(innerAttempt?(innerValid?'passed':'failed'):'pending'):'none'},
   hops:hops.map((h,n)=>({...h,status:conflict?'pending':failed&&n===blockedHop?'blocked':h.stage>stop?'pending':h.stage<=i?'done':'pending'})),
  };
 });
}

export function configurationFrames({delivery='volume',reload=true,kind='ConfigMap'}={}) {
 const old=kind==='Secret'?'demo-only-v1':'안녕하세요 v1';
 const next=kind==='Secret'?'demo-only-v2':'안녕하세요 v2';
 const projected=delivery==='volume';
 const reread=projected&&reload;
 const delivered=[old,old,projected?next:old,projected?next:old,next];
 const app=[old,old,old,reread?next:old,next];
 const titles=['처음 실행 · v1을 읽음','API 객체만 v2로 변경','전달 경계 관찰','앱의 재읽기 시도','Pod 교체 · 같은 이미지로 새 실행'];
 return titles.map((title,i)=>({
  title,kind,delivery,image:'study-web · v1',source:i===0?old:next,delivered:delivered[i],app:app[i],pod:i===4?'pod-new':'pod-old',process:i===4?'process-new':'process-old',
  detail:[
   `${kind}의 ${old}을 받아 시작했습니다. 이미지 코드와 실행 중인 프로세스의 값은 다른 대상입니다.`,
   `${kind}는 ${next}로 바뀌었지만 기존 프로세스가 읽은 값과 전달된 값은 아직 ${old}입니다.`,
   projected?`전파 지연 뒤 일반 볼륨 파일이 ${next}로 갱신됐습니다. 앱 메모리는 아직 ${old}입니다.`:delivery==='env'?`실행 중 환경변수는 ${old}에 머뭅니다. API 값을 바꿔도 자동 수정되지 않습니다.`:`subPath로 연결한 기존 파일은 ${old}에 머뭅니다. 일반 볼륨의 자동 갱신과 다릅니다.`,
   reread?`파일을 다시 여는 기능을 가진 앱이 ${next}를 읽었습니다. Pod나 프로세스는 교체하지 않았습니다.`:!reload?`이 앱은 시작할 때만 읽으므로 재읽기 요청을 처리하지 않습니다. 사용값은 ${old}입니다.`:`다시 읽어도 현재 ${delivery==='env'?'환경변수':'subPath 파일'}는 ${old}입니다.`,
   `갱신 전파가 완료된 뒤 Pod를 명시적으로 교체했습니다. 새 프로세스는 ${next}를 읽습니다. 이미지 v1은 그대로입니다. 단순 앱 함수 재호출이나 같은 파일 재읽기와 다릅니다.`,
  ][i],
 }));
}
export const secretEncoding=Object.freeze({plain:'demo-only',encoded:'ZGVtby1vbmx5',encrypted:false});
