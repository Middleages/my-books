import { useState } from "react";
import { serviceResult } from "../../simulations/network/cluster.mjs";
export function ServiceLab() {
  const initial = {
    selector: "api",
    targetPort: 8000,
    replaced: false,
    ready: true,
  };
  const [s, set] = useState(initial),
    [prediction, predict] = useState(""),
    [shown, show] = useState(false);
  const change = (patch: Partial<typeof initial>) => {
    set({ ...s, ...patch });
    predict("");
    show(false);
  };
  const r = serviceResult(s);
  const names: Record<string, string> = {
    connected: "앱까지 연결",
    "no-endpoint": "전달할 준비된 대상 없음",
    "wrong-port": "대상은 있지만 포트 불일치",
  };
  return (
    <section
      className="route-lab operations-lab"
      aria-label="Service 연결 실험"
    >
      <h2>짧은 실험 · 이름은 그대로, 뒤쪽만 바꾸기</h2>
      <p>
        같은 namespace에서 api:80으로 새 연결을 보냅니다. Pod 라벨은 app=api, 앱
        listen은 0.0.0.0:8000입니다.
      </p>
      <div className="route-controls">
        <label>
          Service selector
          <select
            aria-label="Service selector"
            value={s.selector}
            onChange={(e) => change({ selector: e.target.value })}
          >
            <option value="api">app=api</option>
            <option value="other">app=other</option>
          </select>
        </label>
        <label>
          Service targetPort
          <select
            aria-label="Service targetPort"
            value={s.targetPort}
            onChange={(e) => change({ targetPort: Number(e.target.value) })}
          >
            <option value="8000">8000</option>
            <option value="9000">9000</option>
          </select>
        </label>
      </div>
      <label className="check-control">
        <input
          type="checkbox"
          checked={s.replaced}
          onChange={(e) => change({ replaced: e.target.checked })}
        />
        Pod 교체 후 상태 보기
      </label>
      <label className="check-control">
        <input
          type="checkbox"
          checked={s.ready}
          onChange={(e) => change({ ready: e.target.checked })}
        />
        Pod Ready
      </label>
      <p>
        현재 Pod IP: <strong>{r.ip}</strong> · Service 접점:{" "}
        <strong>api:80</strong>
      </p>
      <label>
        연결 결과 예측
        <select
          aria-label="연결 결과 예측"
          value={prediction}
          onChange={(e) => {
            predict(e.target.value);
            show(false);
          }}
        >
          <option value="">결과를 먼저 예측하세요</option>
          {Object.entries(names).map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <div className="lab-actions">
        <button
          className="primary"
          disabled={!prediction}
          onClick={() => show(true)}
        >
          결과 확인
        </button>
        <button
          className="secondary"
          onClick={() => {
            set(initial);
            predict("");
            show(false);
          }}
        >
          처음부터
        </button>
      </div>
      {shown && (
        <div className="route-evidence" aria-live="polite">
          <p className="prediction-result">
            {prediction === r.code
              ? "예측과 일치합니다."
              : "예측과 달랐습니다. 대상 목록과 포트를 나누어 보세요."}
          </p>
          <h3>{names[r.code]}</h3>
          <p>
            준비된 전달 대상:{" "}
            {r.endpoints.length
              ? r.endpoints.map((ip) => `${ip}:${s.targetPort}`).join(", ")
              : "없음"}
          </p>
          <p>{r.explanation}</p>
          <p>
            <strong>다음 확인:</strong> {r.next}
          </p>
        </div>
      )}
      <p>
        교육용 시뮬레이션 · 단일 Pod·selector 기반 ClusterIP Service입니다.
        DNS·클러스터 경로·정책은 정상이며, EndpointSlice 반영 후의 새 연결만
        다룹니다. 실제 스케줄링·데이터 경로·전환 지연은 재현하지 않습니다.
      </p>
    </section>
  );
}
