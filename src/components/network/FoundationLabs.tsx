import { useState } from "react";
import {
  portResult,
  dnsResult,
  transportSteps,
  transferEstimate,
} from "../../simulations/network/foundations.mjs";
function Prediction({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="lab-predict">
      먼저 예측해 보세요
      <select
        aria-label="연결 결과 예측"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">결과 선택</option>
        <option value="yes">연결된다</option>
        <option value="no">연결되지 않는다</option>
      </select>
    </label>
  );
}
export function PortLab() {
  const [observer, setObserver] = useState("remote");
  const [bind, setBind] = useState("loopback");
  const [listening, setListening] = useState(true);
  const [policy, setPolicy] = useState("allow");
  const [port, setPort] = useState("8000");
  const [prediction, setPrediction] = useState("");
  const [ran, setRan] = useState(false);
  const reset = () => {
    setRan(false);
    setPrediction("");
  };
  const result = portResult({ observer, bind, listening, policy, port });
  return (
    <section className="route-lab" aria-label="포트 실험">
      <h2>실험 · 내 VM에서는 되는데?</h2>
      <p>
        서버는 192.0.2.10입니다. 관측 위치와 리스너를 바꾸고 연결 결과를
        예측하세요.
      </p>
      <div className="route-controls">
        <label>
          관측 위치
          <select
            aria-label="관측 위치"
            value={observer}
            onChange={(e) => {
              setObserver(e.target.value);
              reset();
            }}
          >
            <option value="remote">다른 PC → 서버 IP</option>
            <option value="local">서버 자신 → 127.0.0.1</option>
          </select>
        </label>
        <label>
          앱 bind 주소
          <select
            aria-label="앱 bind 주소"
            value={bind}
            onChange={(e) => {
              setBind(e.target.value);
              reset();
            }}
          >
            <option value="loopback">127.0.0.1 · 자기 자신</option>
            <option value="all">0.0.0.0 · 모든 IPv4 인터페이스</option>
          </select>
        </label>
        <label>
          서버 TCP 8000 리스너
          <select
            aria-label="리스너 상태"
            value={String(listening)}
            onChange={(e) => {
              setListening(e.target.value === "true");
              reset();
            }}
          >
            <option value="true">실행 중</option>
            <option value="false">중지</option>
          </select>
        </label>
        <label>
          원격 요청 방화벽
          <select
            aria-label="방화벽 정책"
            value={policy}
            onChange={(e) => {
              setPolicy(e.target.value);
              reset();
            }}
          >
            <option value="allow">허용</option>
            <option value="drop">조용히 버림 · DROP</option>
          </select>
        </label>
        <label>
          요청 포트
          <select
            aria-label="요청 포트"
            value={port}
            onChange={(e) => {
              setPort(e.target.value);
              reset();
            }}
          >
            <option>8000</option>
            <option>8001</option>
          </select>
        </label>
      </div>
      <Prediction
        value={prediction}
        onChange={(v) => {
          setPrediction(v);
          setRan(false);
        }}
      />
      <div className="lab-actions">
        <button
          className="primary"
          disabled={!prediction}
          onClick={() => setRan(true)}
        >
          연결 확인
        </button>
        <button className="secondary" onClick={reset}>
          다시 예측
        </button>
      </div>
      <div className="route-evidence" aria-live="polite">
        {ran ? (
          <>
            <p>
              {(prediction === "yes") === result.ok
                ? "예측과 일치합니다."
                : "예측과 달랐습니다. 조건을 다시 살펴보세요."}
            </p>
            <h3>{result.title}</h3>
            <p>
              목적지: {result.target}:{port} / TCP
            </p>
            <p>{result.detail}</p>
          </>
        ) : (
          <p>조건을 선택하고 예측한 뒤 확인하세요.</p>
        )}
      </div>
      <p className="model-note">
        교육용 시뮬레이션 · IPv4/TCP, 정상 왕복 경로, 단일 VM을 가정합니다.
        방화벽 선택은 원격 요청만 다룹니다. 실제 장비 조회, Docker, IPv6, 복수
        방화벽은 포함하지 않습니다.
      </p>
    </section>
  );
}
export function DnsLab() {
  const [cache, setCache] = useState(true);
  const [age, setAge] = useState(0);
  const [record, setRecord] = useState("exists");
  const [app, setApp] = useState(true);
  const [prediction, setPrediction] = useState("");
  const [ran, setRan] = useState(false);
  const reset = () => {
    setRan(false);
    setPrediction("");
  };
  const r = dnsResult({ cache, age, record, app });
  return (
    <section className="route-lab" aria-label="DNS 실험">
      <h2>실험 · IP를 바꿨는데 왜 예전 서버로 갈까?</h2>
      <p>
        app.example.test의 A 레코드를 192.0.2.10에서 192.0.2.20으로 바꿨습니다.
        캐시에는 변경 전에 받은 TTL 60초의 응답이 있습니다.
      </p>
      <div className="route-controls">
        <label>
          리졸버 캐시
          <select
            aria-label="리졸버 캐시"
            value={String(cache)}
            onChange={(e) => {
              setCache(e.target.value === "true");
              reset();
            }}
          >
            <option value="true">이전 주소 있음</option>
            <option value="false">비어 있음</option>
          </select>
        </label>
        <label>
          캐시 저장 후 경과
          <select
            aria-label="캐시 경과 시간"
            value={age}
            onChange={(e) => {
              setAge(Number(e.target.value));
              reset();
            }}
          >
            <option value={0}>0초</option>
            <option value={30}>30초</option>
            <option value={60}>60초 · 만료</option>
          </select>
        </label>
        <label>
          권한 서버의 현재 상태
          <select
            aria-label="권한 서버 상태"
            value={record}
            onChange={(e) => {
              setRecord(e.target.value);
              reset();
            }}
          >
            <option value="exists">새 주소 .20</option>
            <option value="missing">이름 삭제 · NXDOMAIN</option>
          </select>
        </label>
        <label>
          선택된 주소의 앱
          <select
            aria-label="DNS 실험 앱 상태"
            value={String(app)}
            onChange={(e) => {
              setApp(e.target.value === "true");
              reset();
            }}
          >
            <option value="true">TCP 8000 실행</option>
            <option value="false">TCP 8000 중지</option>
          </select>
        </label>
      </div>
      <label className="lab-predict">
        이번 조회가 얻을 주소는?
        <select
          aria-label="조회 주소 예측"
          value={prediction}
          onChange={(e) => {
            setPrediction(e.target.value);
            setRan(false);
          }}
        >
          <option value="">주소 선택</option>
          <option value="192.0.2.10">이전 주소 .10</option>
          <option value="192.0.2.20">새 주소 .20</option>
          <option value="none">주소 없음</option>
        </select>
      </label>
      <div className="lab-actions">
        <button
          className="primary"
          disabled={!prediction}
          onClick={() => setRan(true)}
        >
          조회 후 연결
        </button>
        <button className="secondary" onClick={reset}>
          다시 예측
        </button>
      </div>
      <div className="route-evidence" aria-live="polite">
        {ran ? (
          <>
            <p>
              {prediction === (r.address ?? "none")
                ? "예측과 일치합니다."
                : "예측과 달랐습니다."}
            </p>
            <h3>1. 이름 조회 · {r.source}</h3>
            <p>
              {r.address ?? "주소 없음"}{" "}
              {r.address && `· 응답 TTL ${r.remaining}초`}
            </p>
            <p>{r.detail}</p>
            <h3>2. 앱 연결 · {r.address ? r.connection : "진행하지 않음"}</h3>
            <p>{r.address ? `${r.address}:8000 / TCP` : r.connection}</p>
          </>
        ) : (
          <p>주소를 예측한 뒤 조회와 연결을 분리해서 관찰하세요.</p>
        )}
      </div>
      <p className="model-note">
        교육용 시뮬레이션 · 단일 A 레코드·단일 리졸버의 캐시만 다룹니다. 경과
        시간은 자동으로 흐르지 않습니다. 실제 계층별 캐시·음성 캐시·serve-stale
        정책·IPv6 주소 선택은 생략했습니다.
      </p>
    </section>
  );
}
export function TransportLab() {
  const [loss, setLoss] = useState(true);
  const [step, setStep] = useState(0);
  const [prediction, setPrediction] = useState("");
  const steps = transportSteps(loss);
  const s = steps[step - 1];
  return (
    <section className="route-lab" aria-label="TCP 실험">
      <h2>실험 · 뒤쪽 데이터가 먼저 도착하면?</h2>
      <p>
        이미 연결된 TCP에서 A·B·C 각 100바이트를 보냅니다. C까지 도착한 순간
        앱에 전달할 수 있는 양을 예측하세요.
      </p>
      <div className="route-controls">
        <label>
          전송 조건
          <select
            aria-label="전송 조건"
            value={String(loss)}
            onChange={(e) => {
              setLoss(e.target.value === "true");
              setStep(0);
              setPrediction("");
            }}
          >
            <option value="true">가운데 B를 한 번 잃음</option>
            <option value="false">손실 없음</option>
          </select>
        </label>
        <label>
          앱에 전달 가능한 양
          <select
            aria-label="전달량 예측"
            value={prediction}
            disabled={step > 0}
            onChange={(e) => setPrediction(e.target.value)}
          >
            <option value="">예측 선택</option>
            <option value="100">100바이트</option>
            <option value="200">200바이트</option>
            <option value="300">300바이트</option>
          </select>
        </label>
      </div>
      <div className="lab-actions">
        <button
          className="primary"
          disabled={!prediction || step === steps.length}
          onClick={() => setStep(step + 1)}
        >
          한 단계 진행
        </button>
        <button
          className="secondary"
          onClick={() => {
            setStep(0);
            setPrediction("");
          }}
        >
          처음부터
        </button>
        <span>
          {step} / {steps.length}단계
        </span>
      </div>
      <div className="route-evidence" aria-live="polite">
        {s ? (
          <>
            <h3>{s.title}</h3>
            <div className="byte-strip" aria-label="데이터 구간 상태">
              {["A", "B", "C"].map((label, i) => {
                const end = (i + 1) * 100;
                const status =
                  end <= s.delivered
                    ? "전달 완료"
                    : i === 1 && loss && step >= 2
                      ? "빈 구간"
                      : i === 2 && s.buffered
                        ? "수신 · 대기"
                        : "아직 도착 전";
                return (
                  <div key={label} data-state={status}>
                    <strong>
                      {label} · {i * 100 + 1}~{end}
                    </strong>
                    <span>{status}</span>
                  </div>
                );
              })}
            </div>
            <dl className="packet-fields">
              <div>
                <dt>수신 측의 다음 기대 번호 · ACK</dt>
                <dd>{s.ack}</dd>
              </div>
              <div>
                <dt>앱에 순서대로 전달 / 뒤에서 대기</dt>
                <dd>
                  {s.delivered} / {s.buffered}바이트
                </dd>
              </div>
            </dl>
            <p>{s.detail}</p>
            {step >= 3 && (
              <p>
                {Number(prediction) === (loss ? 100 : 300)
                  ? "예측과 일치합니다."
                  : "예측과 달랐습니다."}{" "}
                C 도착 시점의 전달량은 {loss ? 100 : 300}바이트입니다.
              </p>
            )}
          </>
        ) : (
          <p>
            먼저 예측하세요. 실제 TCP 순서 번호를 단순화해 첫 데이터 바이트를
            1로 두었습니다.
          </p>
        )}
      </div>
      <p className="model-note">
        교육용 시뮬레이션 · 수신 측 상태를 보여 줍니다. B 손실 단계에서는 새
        ACK를 보냈다는 뜻이 아닙니다. 재전송 시간은 계산하지 않으며, 이 작은
        사례는 빠른 재전송에 필요한 중복 ACK 수를 만들지 않습니다. SACK·혼잡
        제어·앱 읽기 주기는 생략했습니다.
      </p>
    </section>
  );
}
export function PerformanceLab() {
  const [mb, setMb] = useState(1);
  const [mbps, setMbps] = useState(10);
  const [rtt, setRtt] = useState(100);
  const r = transferEstimate(mb, mbps, rtt);
  return (
    <section className="route-lab" aria-label="전송 시간 계산">
      <h2>작은 계산 · 넓은 도로와 가까운 목적지</h2>
      <p>
        대역폭만 10배 높여 보세요. 데이터 전송 시간과 왕복 대기 중 어느 쪽이
        바뀌나요?
      </p>
      <div className="route-controls">
        <label>
          응답 크기
          <select
            aria-label="응답 크기"
            value={mb}
            onChange={(e) => setMb(Number(e.target.value))}
          >
            <option value={0.01}>10 KB</option>
            <option value={1}>1 MB</option>
            <option value={100}>100 MB</option>
          </select>
        </label>
        <label>
          병목 대역폭
          <select
            aria-label="병목 대역폭"
            value={mbps}
            onChange={(e) => setMbps(Number(e.target.value))}
          >
            <option value={10}>10 Mbps</option>
            <option value={100}>100 Mbps</option>
          </select>
        </label>
        <label>
          왕복 지연 RTT
          <select
            aria-label="왕복 지연"
            value={rtt}
            onChange={(e) => setRtt(Number(e.target.value))}
          >
            <option value={10}>10 ms</option>
            <option value={100}>100 ms</option>
            <option value={300}>300 ms</option>
          </select>
        </label>
      </div>
      <div className="route-evidence" aria-live="polite">
        <p>
          데이터를 밀어 넣는 시간 <b>{r.serialization.toFixed(3)}초</b> + 한
          번의 왕복 <b>{r.roundTrip.toFixed(3)}초</b>
        </p>
        <h3>이상적 응답 완료 시간 ≈ {r.total.toFixed(3)}초</h3>
      </div>
      <p className="model-note">
        이미 연결된 경로에서 작은 요청 후 응답을 받는 단순 모델: 크기(MB) × 8 ÷
        대역폭(Mbps) + RTT(초). 1 MB = 1,000,000바이트. DNS·연결 설정·TLS·서버
        처리·혼잡·손실·헤더를 제외하므로 실제 다운로드 시간 예측기는 아닙니다.
      </p>
    </section>
  );
}
