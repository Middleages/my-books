import { recoveryCoverage,airgapTrustPaths } from '../../simulations/kubernetes/visual-explanations.mjs';
import type { RecoveryFrame,RecoveryScenario } from '../../simulations/kubernetes/appendices.mjs';
import './visual-explanations.css';
const state:Record<string,string>={unverified:'미확인',restored:'별도 복원한 조건',blocked:'token 없어 중단',missing:'사본 없음 · 누락','check-required':'실제 확인 필요',separate:'별도 백업·복원 책임'};
export function RecoveryScene({f,scenario}:{f:RecoveryFrame;scenario:RecoveryScenario}){
 return <figure className="k8v-recovery" data-scene="recovery"><figcaption>보관한 재료 → 포함하는 복원 대상 → 실제 확인은 별도</figcaption>
  {recoveryCoverage(scenario,f).map(r=><div className={`k8v-coverage-row ${r.available===false?'k8v-coverage-missing':''}`} data-coverage={r.id} key={r.id}>
   <div className={`k8v-backup-copy ${r.available===false?'k8v-ghost':''}`}><strong>{r.available===false?'∅':r.available===null?'?':'▤'} {r.material}</strong><small>{r.available===false?'필요 재료 누락':r.available===null?'별도 보관 책임':'보관 재료 있음'}</small><div>{r.contents.map(c=><span key={c}>{c}</span>)}</div></div>
   <b className="k8v-coverage-arrow" aria-hidden="true">{r.available===false?'×':r.available===null?'?':'→'}</b>
   <div className="k8v-restored" data-recovery-state={r.state}><strong>{r.target}</strong><b>{state[r.state]}</b><small>{r.excluded}</small></div>
  </div>)}
  <div className="k8v-restore-check"><strong>⇢ 아직 넘지 않은 확인 경계</strong><span>마운트 · 권한 · 파일 내용/해시 · 실제 앱 응답 · 외부 DB 정합성</span><b>앱: {state[f.app]} · 사본 존재 ≠ 복구 성공</b></div>
 </figure>;
}
export function AirgapTrustScene(){
 return <figure className="k8v-airgap" data-scene="airgap"><figcaption><strong>폐쇄망: 반입 대상과 네 가지 호출 주체를 분리</strong></figcaption>
  <div className="k8v-imports"><strong>반입 경계 · 서로 대체하지 않는 세 재료</strong><div><span>▤ 바이너리/스크립트<br/>↓ VM 설치</span><span>▣ 시스템·앱 이미지<br/>↓ 각 실행 노드 또는 registry</span><span>▤ chart + values<br/>↓ YAML 명세 → API</span></div><small>YAML을 렌더링해도 이미지 파일이 따라오지 않습니다. OS·아키텍처·버전·체크섬은 별도 확인.</small></div>
  {airgapTrustPaths().map(p=><div className="k8v-trust-row" key={p.id} data-trust={p.id}>
   <div className="k8v-trust-caller"><strong>{p.caller}</strong><div className="k8v-trust-store"><small>이 호출 주체의 신뢰 경계</small><b>{p.trust}</b>{p.checks.map(c=><span key={c}>{c}</span>)}</div></div>
   <div className="k8v-trust-link"><span>{p.purpose}</span><b aria-hidden="true">→</b></div>
   <div className="k8v-trust-target"><strong>{p.target}</strong><span>{p.after}</span></div>
  </div>)}
  <p className="k8v-model-note">화살표는 각 주체가 만드는 별도 연결입니다. 행끼리 연결된 HTTP 처리 사슬이 아닙니다. 한 trust store에 CA를 넣어도 다른 세 곳에 복사되지 않으며, 실제 사내 인증서나 토큰을 입력하지 않습니다.</p>
 </figure>;
}
export function DeploymentLocations(){return <figure className="k8v-deploy-locations" data-scene="first-deployment"><figcaption>실행 위치 지도 · 같은 명령을 아무 PC에서나 실행하지 않기</figcaption><div className="k8v-location-grid"><div><strong>① 빌드 PC</strong><span>소스 → 이미지 v1/v2</span><span>manifest · chart 준비</span><b>↓ 이미지 반입/registry</b></div><div><strong>② 새 일회용 Linux VM</strong><span>설치 → context·namespace 확인</span><span>API → Deployment → Pod</span><span>Service 80 → Pod 8080</span><b>⇡ 관리 요청 / ⇣ 앱의 외부 진입</b></div><div><strong>③ 호출 PC</strong><span>같은 외부 URL 확인</span><span>v1 → v2 → 명시적 rollback 후 재확인</span><b>HTTP 성공과 버전·설정 내용을 함께 확인</b></div></div><p>박스는 실행 위치, 화살표는 전달/확인 관계입니다. 이 지도는 명령을 실행하지 않으며 k3s 설치·배포·복원 성공을 인증하지 않습니다.</p></figure>;}
