// A finite teaching model: no Helm engine, arbitrary template evaluation or cluster access.
import { resourceFrames } from './storage-resources.mjs';
import { serviceFrames } from './workloads.mjs';
import { ingressFrames } from './edge-config.mjs';
const clone = x => structuredClone(x);
const last = a => a.at(-1);
function choice(value, allowed) { if (!allowed.includes(value)) throw new RangeError('교육 모델 선택 범위 밖'); }
const values = environment => ({ replicas: environment === 'dev' ? 1 : 2, image: 'v1', message: environment === 'dev' ? '개발 안내' : '운영 안내' });
function rendered(v) {
 return `# 설명용 발췌 · 전체 배포 manifest가 아닙니다\n# Deployment study-web\nspec:\n  replicas: ${v.replicas}\n  template:\n    spec:\n      containers:\n        - name: web\n          image: <실제-이미지>:${v.image}\n# ConfigMap study-web-config\ndata:\n  APP_MESSAGE: "${v.message}"\n# Service study-web\nports:\n  - port: 80\n    targetPort: 8080`;
}
export function helmFrames({operation='template',environment='dev',change='config'}={}) {
 choice(operation,['template','install','upgrade','rollback']);choice(environment,['dev','prod']);choice(change,['replicas','config','image']);
 const original=values(environment), updated={...original};
 if(change==='replicas')updated.replicas+=1;
 if(change==='config')updated.message='새 안내';
 if(change==='image')updated.image='v2';
 const existing=operation==='upgrade'||operation==='rollback';
 let live=existing?clone(operation==='rollback'?updated:original):null;
 let deploymentRevision=existing?(operation==='rollback'&&change==='image'?2:1):null;
 let history=existing?[{revision:1,status:operation==='rollback'?'superseded':'deployed',values:clone(original)}]:[];
 if(operation==='rollback')history.push({revision:2,status:'deployed',values:clone(updated)});
 const target=operation==='upgrade'?updated:original;
 const frames=[];
 const command={template:'helm template study ./study-web -n books-lab -f values.yaml',install:'helm install study ./study-web -n books-lab -f values.yaml --wait',upgrade:'helm upgrade study ./study-web -n books-lab -f values.yaml --wait',rollback:'helm rollback study 1 -n books-lab --wait'}[operation];
 const push=(title,detail,phase,yaml='')=>frames.push(clone({title,detail,summary:`목표 ${target.replicas}개 · ${target.image} · ${target.message} / 적용 ${live?`${live.replicas}개 · ${live.image} · ${live.message}`:"없음"} / Helm revision ${history.at(-1)?.revision??"없음"} / Deployment revision ${deploymentRevision??"미관측/없음"}. 이력: ${history.map(h=>`${h.revision} ${h.status}`).join(", ")||"없음"}.`,phase,operation,environment,change,chart:'study-web · chart 0.1.0',target,live,history,deploymentRevision,yaml,command,ready:'미관측',externalState:'DB·PVC 데이터: 이 모델에서 변경·복원하지 않음'}));
 push(operation==='rollback'?'현재 revision 2 · 과거 기록 1을 선택':'차트와 환경 값을 선택',existing?'기존 release study가 있습니다. 아래 실선 상자는 현재 API 객체이며 입력/목표와 구분합니다.':'아직 release나 실행 리소스가 없습니다. chart는 배포 문서의 묶음이며 앱 프로세스가 아닙니다.','input');
 push(operation==='rollback'?'보관된 revision 1의 manifest를 사용':'값을 넣어 YAML을 렌더링',operation==='rollback'?'현재 values 파일을 새로 넣는 작업이 아닙니다. 보관된 과거 릴리스의 명세를 되돌리기 대상으로 삼습니다.':'고정된 세 필드만 치환하는 브라우저 교육 모델입니다. 실제 Go template 실행·서버 검증은 하지 않습니다.','render',rendered(target));
 if(operation==='template'){
  push('출력만 확인 · API 변경 없음','helm template 기본 로컬 렌더는 설치가 아닙니다. YAML을 출력해도 release 이력·Pod·Service가 생기지 않습니다.','local',rendered(target));
  push('렌더 성공과 실행 성공을 구분','권한·API 지원·admission·이미지·자원·준비 상태는 별도 확인 대상입니다.','local',rendered(target));
 } else {
  history.push({revision:history.length+1,status:`pending-${operation}`,values:clone(target)});
  live=clone(target);
  push('API 명세 적용 · 아직 수렴 전','이 장면은 권한·API 적용이 성공한 가상 관측입니다. Helm이 명세를 전달하지만 scheduler나 kubelet을 대신하지 않습니다.','apply',rendered(target));
  deploymentRevision=operation==='install'?1:change==='image'?(operation==='rollback'?3:2):1;
  history.slice(0,-1).forEach(h=>h.status='superseded');
  history.at(-1).status='deployed';
  push('이력과 controller 관측을 따로 읽기',operation==='install'?'처음 생성한 release의 Helm revision은 1, 새 Deployment를 controller가 관측한 revision도 1입니다. 두 번호는 각기 다른 이력입니다.':change==='image'&&existing?'이미지 변경은 Pod template 변경입니다. controller가 이를 관측한 뒤 Deployment revision도 바뀝니다. 이전 template 재사용도 새 이력 번호를 가질 수 있습니다.':'replicas 또는 별도 ConfigMap 변경은 이 차트에서 Pod template을 바꾸지 않습니다. Helm revision이 증가해도 Deployment revision은 그대로일 수 있습니다.','observe',rendered(target));
 }
 return frames;
}
export const observations=[
 {id:'get',label:'get · 전체 상태',command:'kubectl get deployment,replicaset,pods -n books-lab -o wide',where:'관리 터미널 · 현재 context 확인 후',question:'객체가 있고, 노드에 배정됐으며, Ready인가?'},
 {id:'events',label:'describe + events · 실행 전후 사건',command:'kubectl describe pod POD_NAME -n books-lab\nkubectl get events -n books-lab --sort-by=.metadata.creationTimestamp',where:'관리 터미널 · POD_NAME을 실제 이름으로 교체',question:'배정·이미지·마운트·probe 중 어떤 사건이 관측됐나?'},
 {id:'previous',label:'logs --previous · 종료 직전',command:'kubectl logs POD_NAME -c web -n books-lab --previous',where:'관리 터미널 · 이전 컨테이너 로그가 남아 있는 조건',question:'이전 컨테이너는 종료 직전에 무엇을 기록했나?'},
 {id:'logs',label:'logs · 현재 앱',command:'kubectl logs POD_NAME -c web -n books-lab --tail=50',where:'관리 터미널 · 현재 컨테이너의 로그',question:'현재 실행의 업무·초기화·의존성 오류가 있나?'},
 {id:'service',label:'Service + EndpointSlice + Pod 비교',command:'kubectl get service study-web -n books-lab -o yaml\nkubectl get endpointslices -n books-lab -l kubernetes.io/service-name=study-web -o yaml\nkubectl get pods -n books-lab --show-labels\nkubectl describe pod POD_NAME -n books-lab',where:'관리 터미널 · 앱 listen은 앱 로그/설정과 추가 대조',question:'같은 namespace의 selector·ready·targetPort가 앱과 맞나?'},
 {id:'ingress',label:'Ingress · 요청과 규칙 비교',command:'kubectl describe ingress study-web -n books-lab',where:'관리 터미널 + 요청 기기의 실제 URL/Host 관측',question:'controller가 사용하는 규칙의 host/path와 실제 요청이 맞나?'},
 {id:'tls',label:'TLS · 검증 주체와 인증서',command:'openssl s_client -connect study.example.test:443 -servername study.example.test -verify_hostname study.example.test -verify_return_error',where:'실패가 발생한 클라이언트 환경 · 예시 도메인은 가상',question:'어느 TLS 구간에서 어떤 이름·신뢰·유효기간 검사가 실패했나?'},
 {id:'rollout',label:'rollout status · 교체 진행',command:'kubectl rollout status deployment/study-web -n books-lab --timeout=10s',where:'관리 터미널 · 읽기 관찰이며 대기 시간 제한',question:'목표 배포가 수렴했나? 원인은 별도 증거가 필요하다.'},
];
export const diagnosticCases=[
 {id:'pending',label:'사례 A · Pending',best:'events'},
 {id:'image',label:'사례 B · ImagePullBackOff',best:'events'},
 {id:'crash',label:'사례 C · CrashLoopBackOff',best:'previous'},
 {id:'ready',label:'사례 D · ready 대상 없음',best:'service'},
 {id:'selector',label:'사례 E · Service 연결 실패',best:'service'},
 {id:'port',label:'사례 F · 대상은 있는데 연결 실패',best:'service'},
 {id:'ingress',label:'사례 G · 외부 URL만 실패',best:'ingress'},
 {id:'tls',label:'사례 H · 인증서 검증 실패',best:'tls'},
];
function caseData(id){
 const certificateSan='other.example.test', ruleHost='study.example.test';
 const resource=last(resourceFrames());
 const s=last(serviceFrames({selector:id==='selector'?'other':'study-web',ready:id!=='ready',targetPort:id==='port'?9090:8080}));
 const edge=last(ingressFrames({host:id==='ingress'?'other.example.test':'study.example.test',outerValid:id!=='tls'}));
 const cases={
 pending:{zone:0,symptom:'Pod Pending · 노드 미배정. CPU 실제 사용은 낮습니다.',evidence:`FailedScheduling: Insufficient cpu. 기존 requests ${resource.node.cpu.assigned}m + 새 요청 ${resource.cpu.request}m > allocatable ${resource.node.cpu.allocatable}m. 실제 사용 ${resource.node.cpu.used}m. 다른 배치 조건은 정상으로 확인한 사례입니다.`,conclusion:`이 사례는 ${resource.reason}입니다. 실사용량이 아닌 requests의 자리 부족이 증거와 맞습니다.`,next:'용량·requests 근거·다른 배치 제약을 확인한 뒤 변경안을 선택하고 Pod 배정 및 Ready를 재관측합니다. Pending 전체의 공통 원인이라고 일반화하지 않습니다.'},
 image:{zone:1,symptom:'kubectl STATUS: ImagePullBackOff · 앱은 아직 시작하지 못했습니다.',evidence:'노드 배정 완료. pull 이벤트: manifest unknown. 선택한 registry의 해당 repository/tag 조회에서 이미지가 없음을 추가 확인했습니다.',conclusion:'이 사례는 이미지 참조/태그 불일치를 지지합니다. ImagePullBackOff라는 상태 문자열만으로 인증·DNS·CA 오류를 배제할 수는 없습니다.',next:'실제 존재하는 이미지 참조를 확인해 배포 원본을 수정하고 pull 이벤트·컨테이너 시작·Ready를 다시 확인합니다. 가상 v1/v2를 배포 가능한 태그로 사용하지 않습니다.'},
 crash:{zone:1,symptom:'kubectl STATUS: CrashLoopBackOff · 재시작 4회.',evidence:'이전 web 로그: required APP_MESSAGE is missing; exit 1. describe의 lastState도 exitCode=1, OOMKilled 기록 없음. 이 사례의 종료 직전 로그가 남아 있습니다.',conclusion:'이 사례는 필수 설정 누락에 따른 앱 종료를 지지합니다. 반복 재시작 상태가 원인 이름은 아닙니다.',next:'ConfigMap 키·Pod 참조·앱 요구값을 비교합니다. env 변경은 기존 프로세스에 자동 반영되지 않으므로 새 실행 후 로그·재시작 횟수·Ready를 확인합니다.'},
 ready:{zone:2,symptom:'Pod Running이지만 준비된 Service 대상은 없습니다.',evidence:`selector 일치, EndpointSlice 기록 ${s.endpoints.length}개, ready=false · 전달 후보 ${s.eligible.length}개. readiness 실패 이벤트와 현재 앱 로그에 DB timeout. 프로세스 생존 응답은 정상입니다.`,conclusion:s.result.reason+'입니다. 이 사례의 추가 로그는 필수 DB 의존성 문제를 지지하지만 timeout의 네트워크/DB 원인은 아직 미확정입니다.',next:'앱이 실행되는 환경에서 DB DNS·연결·TLS·서버 상태를 구분해 확인합니다. 무조건 liveness에 DB를 넣거나 재시작하지 말고 복구 후 ready 대상과 실제 업무 요청을 재확인합니다.'},
 selector:{zone:3,symptom:'Service 이름은 조회되지만 앱으로 연결되지 않습니다.',evidence:`같은 books-lab: Service selector app=other, Pod label app=study-web. 선택된 EndpointSlice 주소 ${s.endpoints.length}개. Pod 자체는 Ready.`,conclusion:s.result.reason+'입니다. 이 사례는 라벨 선택 경계에서 어긋납니다.',next:'의도한 대상 라벨을 먼저 확인하고 배포 원본의 selector/label을 맞춥니다. EndpointSlice 주소·ready와 Service를 통한 연결을 재확인합니다.'},
 port:{zone:3,symptom:'DNS 정상, ready 대상 존재, Service 연결 실패.',evidence:`ready 대상 ${s.eligible.length}개. targetPort ${s.service.targetPort}, 앱이 실제 listen하는 포트 ${s.pods[0].listenPort}. 같은 호출 환경의 직접 앱 포트 연결은 성공했습니다.`,conclusion:s.result.reason+'입니다. Service 설정이 앱의 listen 포트를 바꾸지는 않습니다.',next:'의도한 targetPort와 앱 포트를 맞춘 뒤 동일한 호출 위치에서 Service 연결을 다시 확인합니다. ready는 모든 포트가 열렸다는 보장이 아닙니다.'},
 ingress:{zone:4,symptom:'클러스터 내부 Service 연결은 되지만 외부 URL이 실패합니다.',evidence:`외부 TLS 성공, controller 도달 확인. 실제 Host other.example.test, 규칙 study.example.test / Exact. 규칙 일치 ${edge.route?'예':'아니요'}.`,conclusion:'이 사례는 HTTP host/path 분기 불일치입니다. 특정 404/502 코드 하나로 이 원인을 확정한 것이 아닙니다.',next:'전달된 Host·path와 controller가 읽는 Ingress class/규칙을 비교하고 URL·규칙 중 의도와 다른 쪽을 수정한 뒤 같은 외부 요청을 재확인합니다.'},
 tls:{zone:4,symptom:'클라이언트 인증서 이름 검증 실패 · HTTP 응답 전 중단.',evidence:`브라우저→controller 구간 실패. 요청 이름 study.example.test, 제시 인증서 SAN ${certificateSan}. 체인·신뢰·기간은 정상으로 별도 확인한 사례. 외부 TLS ${edge.outer.status}.`,conclusion:'이 사례는 외부 TLS 이름 불일치입니다. HTTP 상태 코드가 아니며 backend Pod의 오류 로그가 없어도 이상하지 않습니다.',next:'이름에 맞는 인증서와 SNI·TLS Secret 선택을 확인합니다. 검증을 끄지 말고 같은 클라이언트에서 다시 검증합니다. 호스트 프록시를 쓰면 외부/내부 TLS 검증을 별개로 조사합니다.'},
 };
 const scene=id==='pending'?{kind:'resource',resource:resource.node.cpu}:['ready','selector','port'].includes(id)?{kind:'service',service:s}:['ingress','tls'].includes(id)?{kind:'ingress',ingress:edge,comparison:{actual:edge.host,expected:id==='tls'?certificateSan:ruleHost,label:id==='tls'?'제시 인증서 SAN':'Ingress Host 규칙',scope:id==='tls'?'이름 검증 경계':'/ Exact 또는 /health Prefix'}}:id==='image'?{kind:'image',requested:'repository:missing-tag',registry:'manifest unknown',running:false}:{kind:'crash',key:'APP_MESSAGE',provided:false,exitCode:1,restarts:4};
 return {...cases[id],scene};
}
export function diagnosisFrames({scenario='pending',observation='get'}={}){
 const selected=diagnosticCases.find(c=>c.id===scenario),obs=observations.find(o=>o.id===observation);
 if(!selected||!obs)throw new RangeError('교육 모델 선택 범위 밖');
 const data=caseData(scenario),matched=observation===selected.best;
 const generic={get:data.symptom,rollout:'배포의 완료 여부를 관측했습니다. 이 정보만으로 배정·이미지·설정·연결·TLS 중 원인을 구분하지 못합니다.',logs:'현재 앱 로그만 관측했습니다. 이 사례에서 필요한 종료 직전/실행 전/경로 경계의 증거가 아직 부족합니다.'};
 const evidence=matched?data.evidence:generic[observation]||'이 관측에서는 원인을 좁힐 결정적인 증거를 아직 확보하지 못했습니다. 해당 계층이 정상이라는 뜻도 아닙니다.';
 return ['증상부터 기록','선택한 관측의 증거','증거가 지지하는 범위','다음 조사와 재검증'].map((title,i)=>({
 title,detail:i===0?'상태 문자열은 조사 시작점입니다. 다음 관측을 선택한 뒤 한 단계 진행하세요.':i===1?evidence:matched?(i===2?data.conclusion:data.next):'현재 증거만으로 원인을 확정할 수 없습니다. 다른 관측을 선택하고 비교하세요.',
 symptom:data.symptom,evidence:i>=1?evidence:null,conclusion:i>=2&&matched?data.conclusion:null,next:i>=3?(matched?data.next:`추천 관측: ${observations.find(o=>o.id===selected.best).label}. 증거를 얻은 뒤 같은 증상을 다시 확인하세요.`):null,
 scene:i>=1&&matched?data.scene:null,scenario,observed:i>=1,matched,command:obs.command,where:obs.where,question:obs.question,
 zones:['배포·배정','컨테이너 실행','준비 상태','Service','Ingress·TLS'].map((label,n)=>({label,state:i>=2&&matched&&n===data.zone?'focus':'unknown'})),
 }));
}
