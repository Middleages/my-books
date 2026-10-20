import type { DiagnosisFrame } from '../../simulations/kubernetes/helm-diagnosis.mjs';
import { ResourceBars } from './ResourceBars';
import { ServiceScene } from './ServiceScene';
import { TlsScene } from './TlsScene';
import './data-resources.css';
export function DiagnosisScene({f}:{f:DiagnosisFrame}){
 const s=f.scene;
 return <div className="k8v-diagnosis" data-scene="diagnosis" data-evidence={s?.kind??'unknown'}>
  <h3>{s?'증거를 원인 경계에 붙여 보기':'아직 원인 경계를 확정하지 않았습니다'}</h3>
  {!s?<div className="k8v-unknown-scene"><span>?</span><p>{f.observed?'이 관측만으로는 필요한 수치·연결 관계가 드러나지 않았습니다. 추천 관측을 선택해 비교하세요.':'증상만 알고 있습니다. 관측을 선택하고 한 단계 진행하면, 그 증거가 뒷받침하는 그림만 나타납니다.'}</p><small>그림이 없거나 점선인 영역은 정상 판정이 아닙니다.</small></div>:
  s.kind==='resource'?<><ResourceBars name="관측: CPU requests 자리" unit="m" r={s.resource}/><p className="k8v-evidence-tag">↑ FailedScheduling: Insufficient cpu · 사선 제안이 검은 수용량 선을 넘습니다. 낮은 초록 실사용량은 예약 자리를 늘리지 않습니다.</p></>:
  s.kind==='service'?<><ServiceScene f={s.service} compact/><p className="k8v-evidence-tag">↑ selector·namespace·ready·targetPort·실제 listen을 같은 경계에서 비교한 증거. 미관측 DB 내부 원인은 확정하지 않습니다.</p></>:
  s.kind==='ingress'?<><TlsScene f={s.ingress}/><div className="k8v-mismatch"><div><small>실제 요청</small><strong>{s.comparison.actual}</strong><span>{s.ingress.path}</span></div><b aria-hidden="true">≠</b><div><small>{s.comparison.label}</small><strong>{s.comparison.expected}</strong><span>{s.comparison.scope}</span></div></div></>:
  s.kind==='image'?<div className="k8v-fault-chain"><div><strong>노드 runtime</strong><span>요청: {s.requested}</span></div><b>→</b><div><strong>registry 조회</strong><span>✕ {s.registry}</span><small>해당 repository/tag 부재 보조 확인</small></div><b>⊣</b><div className="k8v-ghost"><strong>앱 컨테이너</strong><span>아직 시작 못 함</span></div></div>:
  <div className="k8v-fault-chain"><div><strong>필수 설정</strong><span>{s.key}</span><b>∅ 값 누락</b></div><b>→</b><div><strong>이전 프로세스</strong><span>종료 직전 로그 → exit {s.exitCode}</span></div><b>→</b><div><strong>같은 Pod</strong><span>재시작 {s.restarts}회</span><small>반복 상태가 원인 이름은 아님</small></div></div>}
  <p className="k8v-model-note">가상 관측 기록을 펼친 것입니다. 앱·네트워크 전체의 정상 판정이나 실제 명령 실행 결과가 아닙니다.</p>
 </div>;
}
