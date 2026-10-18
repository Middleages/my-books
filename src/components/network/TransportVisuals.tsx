import { useState } from "react";
import {
  tcpJourney,
  performanceJourney,
} from "../../simulations/network/connection-visual.mjs";
import { Playback, useFoundationPlayback } from "./FoundationPlayback";
import { Choice, Predict } from "./ConnectionVisuals";
import "./operation-visuals.css";
import "./connection-visuals.css";
export function TcpVisual() {
  const [mode, setMode] = useState("loss"),
    [prediction, predict] = useState("");
  const j = tcpJourney(mode),
    p = useFoundationPlayback(j.frames.length),
    f = j.frames[p.index];
  const change = (value: string) => {
    p.reset();
    predict("");
    setMode(value);
  };
  const reset = () => change("loss");
  const data = f.event === "receive" || f.event === "loss",
    ack = f.event === "ack";
  return (
    <section className="ov-lab pv-lab" aria-label="TCP 순서와 ACK 시각 실험">
      <p className="ov-eyebrow">06 · DATA OUT, ACK BACK</p>
      <h2>도착한 것과 확인한 것을 나누기</h2>
      <p>
        위 선은 데이터가 가는 방향, 아래 선은 ACK가 돌아오는 방향입니다. 세 칸은
        각 100바이트이고 시간·속도·실제 TCP 세그먼트 크기를 나타내지 않습니다.
      </p>
      <Playback player={p} count={j.frames.length} reset={reset} />
      <div className="pv-tcp">
        <div className="pv-endpoint">
          <b>송신 TCP</b>
          <code>192.0.2.11:51000</code>
          <span>실제 확인한 다음 번호 {f.senderAck}</span>
          <div className="pv-bytes">
            {["A", "B", "C"].map((c, i) => (
              <div
                key={c}
                data-state={
                  f.senderAck > (i + 1) * 100 ? "confirmed" : "waiting"
                }
              >
                <b>
                  {c} · {i * 100 + 1}~{(i + 1) * 100}
                </b>
                <span>
                  {f.senderAck > (i + 1) * 100 ? "ACK로 확인" : "확인 대기"}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="pv-channel">
          <div className="pv-lane">
            <b>
              <span className="pv-dir-wide">데이터 →</span>
              <span className="pv-dir-narrow">데이터 ↓</span>
            </b>
            <div className="pv-track">
              {data && (
                <span
                  key={`${p.index}-${p.playing}`}
                  className={`pv-dot ${p.playing ? "pv-move" : ""} ${f.event === "loss" ? "pv-drop" : ""}`}
                >
                  {f.chunk}
                  {f.event === "loss" ? " × 손실" : ""}
                </span>
              )}
            </div>
          </div>
          <div className="pv-lane">
            <b>
              <span className="pv-dir-wide">← ACK</span>
              <span className="pv-dir-narrow">ACK ↑</span>
            </b>
            <div className="pv-track">
              {ack && (
                <span
                  key={`${p.index}-${p.playing}`}
                  className={`pv-dot pv-back ${p.playing ? "pv-move" : ""}`}
                >
                  ACK {f.ack}
                </span>
              )}
            </div>
          </div>
          <small>
            {f.event === "timeout"
              ? "송신자 RTO 만료 · 시간값은 생략"
              : f.event === "loss"
                ? "B는 수신자에 도착하지 않음"
                : data
                  ? "데이터 도착을 관찰"
                  : ack
                    ? "ACK 도착을 관찰"
                    : "이미 연결된 TCP"}
          </small>
        </div>
        <div className="pv-endpoint">
          <b>수신 TCP</b>
          <code>192.0.2.10:8000</code>
          <span>다음 기대 번호 {f.ack}</span>
          <div className="pv-bytes">
            {f.received.map((present, i) => (
              <div
                key={i}
                data-state={
                  present
                    ? f.delivered >= (i + 1) * 100
                      ? "delivered"
                      : "buffered"
                    : "absent"
                }
              >
                <b>
                  {["A", "B", "C"][i]} · {i * 100 + 1}~{(i + 1) * 100}
                </b>
                <span>
                  {present
                    ? f.delivered >= (i + 1) * 100
                      ? "앱에 순서대로 제공"
                      : "도착 · 버퍼 대기"
                    : "빈 구간 · 아직 없음"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="pv-app-bytes">
        <b>
          앱에 연속 제공 {f.delivered}바이트 / 뒤에서 대기 {f.buffered}바이트
        </b>
        <div
          className="pv-byte-meter"
          aria-label={`연속 제공 ${f.delivered}바이트, 대기 ${f.buffered}바이트`}
        >
          {["A", "B", "C"].map((c, i) => (
            <span
              key={c}
              className={f.delivered >= (i + 1) * 100 ? "pv-provided" : ""}
            >
              {f.delivered >= (i + 1) * 100 ? c : "미제공"}
            </span>
          ))}
        </div>
      </div>
      <div className="ov-explanation" aria-live="polite">
        <h3>
          {p.index + 1}. {f.title}
        </h3>
        <p>{f.detail}</p>
        <p>
          수신 다음 번호 {f.ack} · 송신 확인 번호 {f.senderAck}
        </p>
      </div>
      <details>
        <summary>모든 단계 · 움직임 없이 읽기</summary>
        <ol>
          {j.frames.map((f, i) => (
            <li key={i}>
              <b>{f.title}</b>
              <p>{f.detail}</p>
              <p>
                수신 다음 {f.ack}, 송신 확인 {f.senderAck} · 연속 제공{" "}
                {f.delivered} / 버퍼 대기 {f.buffered}바이트
              </p>
            </li>
          ))}
        </ol>
      </details>
      <div className="ov-controls">
        <Choice
          label="전송 조건"
          value={mode}
          options={[
            ["loss", "B를 한 번 잃고 RTO 후 재전송"],
            ["reorder", "C가 먼저, B는 늦게 도착 · 손실 없음"],
            ["ordered", "A → B → C 순서대로 도착"],
          ]}
          change={change}
        />
      </div>
      <Predict
        value={prediction}
        change={predict}
        options={[
          ["100", "100바이트"],
          ["200", "200바이트"],
          ["300", "300바이트"],
        ]}
        final={p.index === j.frames.length - 1}
        outcome={String(j.prediction)}
      />
      <p className="ov-note">
        예측 질문: C가 처음 도착한 순간 앱에 연속 제공할 수 있는 양은? 마지막
        복구 후 총량을 묻는 것이 아닙니다.
      </p>
      <p className="ov-note">
        가정: 이미 연결된 TCP/IPv4·300바이트·시작 데이터 번호 1·구간당
        100바이트·충분한 수신 버퍼. ACK는 지연/손실 없이 돌아오고 각 도착 뒤
        하나씩 보여 줍니다. 수신 측의 ACK 값은 다음 기대 번호이며 ACK가 실제
        도착하기 전 송신자의 확인 번호와 다를 수 있습니다. 실제 delayed
        ACK·SACK·혼잡/흐름 제어·RTO 계산·영구 실패·앱 read 주기·TLS는
        생략합니다. B 손실의 전지적 관찰과 송신자의 손실 판단을 구분하며, 이
        작은 사례는 중복 ACK 3개에 의한 빠른 재전송 사례가 아닙니다. TCP는
        메시지 경계를 보존하지 않습니다.
      </p>
    </section>
  );
}
export function PerformanceVisual() {
  const [s, set] = useState({ mb: 1, mbps: 10, rtt: 100 }),
    [prediction, predict] = useState("");
  const j = performanceJourney(s),
    p = useFoundationPlayback(j.frames.length),
    f = j.frames[p.index];
  const change = (patch: Partial<typeof s>) => {
    p.reset();
    predict("");
    set((x) => ({ ...x, ...patch }));
  };
  const reset = () => {
    p.reset();
    predict("");
    set({ mb: 1, mbps: 10, rtt: 100 });
  };
  return (
    <section className="ov-lab pv-lab" aria-label="대역폭과 RTT 시각 비교">
      <p className="ov-eyebrow">06 · CAPACITY AND DISTANCE</p>
      <h2>폭을 넓혀도 왕복 시간은 남는다</h2>
      <p>
        같은 크기의 응답을 받으며 대역폭만 10배로 비교합니다. 가로 길이는
        시간(초), 채워진 부분은 현재 관찰 시각까지 지난 구간입니다. 두 줄은
        동일한 눈금입니다.
      </p>
      <Playback player={p} count={j.frames.length} reset={reset} />
      <div className="pv-time-axis">
        <span>0초</span>
        <span>전체 눈금 {j.maxTime.toFixed(3)}초</span>
      </div>
      <div className={`pv-timelines ${p.playing ? "pv-playing" : ""}`}>
        {j.lanes.map((l, i) => (
          <div key={l.name} className="pv-timeline">
            <b>
              {l.name} · {l.mbps} Mbps
            </b>
            <div className="pv-time-track">
              {f.lanes[i].segments.map((seg, n) => (
                <div
                  key={n}
                  className={`pv-time-segment pv-${seg.kind}`}
                  style={{ width: `${seg.width}%` }}
                  title={`${seg.name}: ${(seg.end - seg.start).toFixed(4)}초`}
                >
                  <span style={{ width: `${seg.progress * 100}%` }} />
                </div>
              ))}
              <i
                className="pv-time-cursor"
                style={{ left: `${(f.time / j.maxTime) * 100}%` }}
              />
            </div>
            <div className="pv-times">
              <span>왕복 전파 {l.rtt.toFixed(3)}초</span>
              <span>데이터 직렬화 {l.serialization.toFixed(4)}초</span>
              <strong>
                {f.lanes[i].done ? "✓ 완료" : "아직 진행 중"} · 합계{" "}
                {l.total.toFixed(4)}초
              </strong>
            </div>
          </div>
        ))}
      </div>
      <p className="pv-time-legend">
        <span>▰ 파란색 = 요청/반환 전파 · 합쳐 RTT</span>
        <span>▰ 초록색 = 응답 데이터 직렬화</span>
      </p>
      <div className="ov-explanation" aria-live="polite">
        <h3>{f.title}</h3>
        <p>{f.detail}</p>
        <p>
          현재 조건: {s.mb} MB × 8 ÷ {s.mbps} Mbps + {s.rtt} ms ÷ 1000 ={" "}
          {j.current.total.toFixed(4)}초
        </p>
      </div>
      <details>
        <summary>모든 단계 · 움직임 없이 읽기</summary>
        <ol>
          {j.frames.map((f, i) => (
            <li key={i}>
              <b>{f.title}</b>
              {f.lanes.map((l, n) => (
                <p key={n}>
                  {j.lanes[n].mbps} Mbps: {l.done ? "완료" : "진행 중"} ·{" "}
                  {j.lanes[n].total.toFixed(4)}초에 완료
                </p>
              ))}
            </li>
          ))}
        </ol>
      </details>
      <div className="ov-controls">
        <Choice
          label="데이터 크기"
          value={s.mb}
          options={[
            ["0.01", "0.01 MB · 작은 응답"],
            ["1", "1 MB"],
            ["10", "10 MB"],
          ]}
          change={(v) => change({ mb: Number(v) })}
        />
        <Choice
          label="대역폭"
          value={s.mbps}
          options={[
            ["10", "10 Mbps"],
            ["100", "100 Mbps"],
          ]}
          change={(v) => change({ mbps: Number(v) })}
        />
        <Choice
          label="왕복 지연"
          value={s.rtt}
          options={[
            ["10", "10 ms"],
            ["100", "100 ms"],
            ["300", "300 ms"],
          ]}
          change={(v) => change({ rtt: Number(v) })}
        />
      </div>
      <Predict
        value={prediction}
        change={predict}
        final={p.index === j.frames.length - 1}
        outcome="same"
        options={[
          ["same", "대역폭을 늘려도 이 모델의 RTT는 같다"],
          ["tenth", "RTT도 10분의 1이 된다"],
        ]}
      />
      <p className="ov-note">
        이미 연결된 경로의 작은 요청+응답 모델입니다. 요청 직렬화는 무시하고
        RTT를 대칭인 두 전파 구간으로 나눴습니다. 1 MB=1,000,000바이트,
        Mbps=1,000,000비트/초. DNS·연결 설정·TLS·서버 처리·큐잉·손실·TCP
        윈도·헤더는 제외합니다. 실제 RTT에는 큐잉 등이 포함될 수 있으며 대역폭
        변경 시 항상 일정하다는 법칙이 아닙니다. 이 그림은 두 요인을 분리하는
        이상적 계산입니다. 설정을 바꾸면 전체 눈금도 새로 계산하며 같은 화면의
        두 줄은 같은 눈금을 유지합니다. 작은 구간이 짧아도 정확한 시간은 아래
        수치로 읽을 수 있습니다.
      </p>
    </section>
  );
}
