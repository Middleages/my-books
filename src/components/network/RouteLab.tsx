import { useId, useState } from "react";
import { hosts, traceRoute } from "../../simulations/network/model.mjs";
import { scenarios } from "../../simulations/network/scenarios";

export default function RouteLab({ nat = false }: { nat?: boolean }) {
  const id = useId();
  const [source, setSource] = useState("a");
  const [destination, setDestination] = useState("peer");
  const [scenario, setScenario] = useState(nat ? "nat" : "routed");
  const [index, setIndex] = useState(-1);
  const [prediction, setPrediction] = useState("");
  const result = traceRoute({ source, destination, scenario });
  const step = index < 0 ? null : result.steps[index];
  const peer = source === "a" ? "b" : "a";
  const correct =
    destination === "peer"
      ? "direct"
      : scenario === "bad-gateway"
        ? "blocked"
        : "gateway";
  function change(setter: (value: string) => void, value: string) {
    setter(value);
    setIndex(-1);
    setPrediction("");
  }
  const nodes = [
    { id: "a", name: "PC A", address: hosts.a.ip + "/24" },
    { id: "b", name: "PC B", address: hosts.b.ip + "/24" },
    {
      id: "router",
      name: "라우터",
      address: "LAN 192.168.10.1",
      extra: scenario === "nat" ? "출구 203.0.113.5" : "반대쪽 192.168.20.1",
    },
    {
      id: "server",
      name: "외부 서버",
      address: scenario === "nat" ? "198.51.100.20" : "192.168.20.20/24",
    },
  ];
  return (
    <section className="lab route-lab" aria-labelledby={id}>
      <p className="eyebrow">직접 따라가기 · 교육용 시뮬레이션</p>
      <h2 id={id}>패킷의 다음 목적지는 어디일까?</h2>
      <p>먼저 경로를 예상하고, 한 단계씩 보낸 뒤 응답까지 확인하세요.</p>
      <div className="route-controls">
        <label>
          출발지
          <select
            aria-label="출발지"
            value={source}
            onChange={(e) => change(setSource, e.target.value)}
          >
            <option value="a">PC A</option>
            <option value="b">PC B</option>
          </select>
        </label>
        <label>
          목적지
          <select
            aria-label="목적지"
            value={destination}
            onChange={(e) => change(setDestination, e.target.value)}
          >
            <option value="peer">
              같은 망의 {peer === "a" ? "PC A" : "PC B"}
            </option>
            <option value="server">외부 서버</option>
          </select>
        </label>
        <label>
          경로 사례
          <select
            aria-label="경로 사례"
            value={scenario}
            onChange={(e) => change(setScenario, e.target.value)}
          >
            {scenarios
              .filter((s) => nat || s.id !== "nat")
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
          </select>
        </label>
      </div>
      <p className="model-note">
        {scenarios.find((s) => s.id === scenario)?.description}
      </p>
      <div className="network-map" aria-label="네트워크 지도">
        <div className="lan-boundary">
          <small>같은 LAN · 192.168.10.0/24</small>
          <div className="pc-pair">
            {nodes.slice(0, 2).map((n) => (
              <div
                key={n.id}
                className={`network-node ${step?.node === n.id ? "active" : ""}`}
              >
                <b>{n.name}</b>
                <code>{n.address}</code>
                {step?.node === n.id && <span>● 현재 위치</span>}
              </div>
            ))}
          </div>
          <span className="map-caption">스위치 / AP로 연결</span>
        </div>
        <span className="map-link" aria-hidden="true">
          ↔
        </span>
        {nodes.slice(2).map((n, i) => (
          <div
            className={`network-node ${step?.node === n.id ? "active" : ""}`}
            key={n.id}
          >
            <small>{i === 0 ? "네트워크의 경계" : "다른 네트워크"}</small>
            <b>{n.name}</b>
            <code>{n.address}</code>
            {n.extra && <code>{n.extra}</code>}
            {step?.node === n.id && <span>● 현재 위치</span>}
          </div>
        ))}
      </div>
      <p className="model-note">
        연결 관계: 두 PC ↔ 스위치/AP ↔ 라우터 ↔ 외부 서버. 같은 LAN의 전달에는
        라우터를 거치지 않습니다.
      </p>
      <fieldset className="prediction" disabled={index >= 0}>
        <legend>예측 · 첫 전달은 어떻게 될까요?</legend>
        {[
          ["direct", "같은 망에 직접 전달"],
          ["gateway", "게이트웨이로 전달"],
          ["blocked", "다음 홉을 찾지 못함"],
        ].map(([v, label]) => (
          <label key={v}>
            <input
              type="radio"
              name={id + "predict"}
              value={v}
              checked={prediction === v}
              onChange={() => setPrediction(v)}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <div className="lab-actions">
        <button
          className="primary"
          disabled={!prediction || index === result.steps.length - 1}
          onClick={() => setIndex((i) => i + 1)}
        >
          한 단계 진행
        </button>
        <button
          className="secondary"
          onClick={() => {
            setIndex(-1);
            setPrediction("");
          }}
        >
          처음부터
        </button>
        <span>
          {index < 0
            ? "예측을 선택하면 시작할 수 있어요"
            : `${index + 1} / ${result.steps.length} 단계`}
        </span>
      </div>
      <div className="route-evidence" aria-live="polite" aria-atomic="true">
        {step ? (
          <>
            <p className="prediction-result">
              {prediction === correct
                ? "예측과 일치합니다."
                : "예측과 다른 이유를 확인해 보세요."}
            </p>
            <h3>
              {index + 1}. {step.title}
            </h3>
            <p>{step.detail}</p>
            <dl className="packet-fields">
              <div>
                <dt>출발지 {nat ? "IP : 포트" : "IP"}</dt>
                <dd>
                  {step.packet.src}
                  {nat && ` : ${step.packet.sport}`}
                </dd>
              </div>
              <div>
                <dt>목적지 {nat ? "IP : 포트" : "IP"}</dt>
                <dd>
                  {step.packet.dst}
                  {nat && ` : ${step.packet.dport}`}
                </dd>
              </div>
            </dl>
            {index === result.steps.length - 1 && (
              <strong>
                {result.outcome === "delivered"
                  ? "✓ 왕복 완료"
                  : "! 다음 홉에서 중단"}
              </strong>
            )}
          </>
        ) : (
          <p>
            아직 패킷을 보내지 않았습니다. 지도와 주소를 보고 예측해 보세요.
          </p>
        )}
      </div>
      {nat && (
        <div className="nat-mapping">
          <h3>출구의 변환 기록 · TCP</h3>
          {result.mapping && index >= 2 ? (
            <dl>
              <dt>안쪽 주소 : 포트</dt>
              <dd>
                {result.mapping.internalIp} : {result.mapping.internalPort}
              </dd>
              <dt>바깥쪽 주소 : 포트</dt>
              <dd>
                {result.mapping.externalIp} : {result.mapping.externalPort}
              </dd>
            </dl>
          ) : (
            <p>
              {destination === "peer"
                ? "같은 LAN의 전달에는 NAT 매핑이 필요하지 않습니다."
                : "아직 만들어진 매핑이 없습니다."}
            </p>
          )}
          <p>
            포트는 여기서 왕복 대화를 구분하는 숫자로만 봅니다. 기존 매핑과 맞는
            응답을 돌려주는 사례이며 외부의 임의 신규 연결을 허용한다는 뜻은
            아닙니다.
          </p>
        </div>
      )}
      {index >= 0 && (
        <details>
          <summary>지나온 단계 · 텍스트로 읽기</summary>
          <ol>
            {result.steps.slice(0, index + 1).map((s, i) => (
              <li key={i}>
                <strong>{s.title}</strong>
                <p>{s.detail}</p>
              </li>
            ))}
          </ol>
        </details>
      )}
      <p className="model-note">
        가정: IPv4, 고정된 /24 LAN, 정상 링크와 응답하는 서버. ARP 탐색·중간
        홉·TCP 연결 설정·방화벽·시간·손실은 생략합니다. 외부 주소는 문서용
        예시이며 실제 진단이나 통신을 하지 않습니다.
      </p>
    </section>
  );
}
