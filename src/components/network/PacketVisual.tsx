import { useState } from "react";
import { packetFrames } from "../../simulations/network/foundation-visual.mjs";
import { Playback, useFoundationPlayback } from "./FoundationPlayback";
import "./foundation-visuals.css";

function ContentTiles({
  states,
  photo,
}: {
  states: boolean[];
  photo: boolean;
}) {
  return (
    <div
      className={`fv-tiles ${photo ? "fv-photo" : ""}`}
      aria-label={photo ? "설명용 사진의 세 부분" : "메시지의 세 부분"}
    >
      {["안녕", "오늘", "만나"].map((x, i) => (
        <span key={x} data-present={states[i]}>
          {states[i] ? (photo ? ["산", "해", "들"][i] : x) : "빈칸"}
        </span>
      ))}
    </div>
  );
}
export default function PacketVisual() {
  const [photo, setPhoto] = useState(true);
  const [loss, setLoss] = useState(true);
  const [prediction, setPrediction] = useState("");
  const frames = packetFrames(loss);
  const player = useFoundationPlayback(frames.length);
  const f = frames[player.index];
  const change = () => {
    player.reset();
    setPrediction("");
  };
  return (
    <section className="fv-lab" aria-label="메시지와 패킷 시각 실험">
      <p className="fv-eyebrow">01 · 하나의 내용, 여러 패킷</p>
      <h2>사진이 도착하는 세 가지 층</h2>
      <p>
        앱의 내용 → 전송 바이트 → IP 패킷을 구분한 뒤, 받는 쪽에서 거꾸로 읽어
        보세요.
      </p>
      <div className="fv-controls">
        <label>
          앱의 내용
          <select
            aria-label="앱의 내용"
            value={String(photo)}
            onChange={(e) => {
              setPhoto(e.target.value === "true");
              change();
            }}
          >
            <option value="true">사진 한 장 · 모형</option>
            <option value="false">메시지 한 개 · 모형</option>
          </select>
        </label>
        <label>
          전송 조건
          <select
            aria-label="패킷 전송 조건"
            value={String(loss)}
            onChange={(e) => {
              setLoss(e.target.value === "true");
              change();
            }}
          >
            <option value="true">B 손실 후 TCP 재전송</option>
            <option value="false">손실 없이 A → B → C</option>
          </select>
        </label>
      </div>
      <div className="fv-layer-pair">
        <div className="fv-panel">
          <h3>보내는 앱 · 의미 있는 내용</h3>
          <ContentTiles states={[true, true, true]} photo={photo} />
          <p>① {photo ? "사진" : "메시지"} → 가상 인코딩 300바이트</p>
        </div>
        <div className={`fv-panel ${f.complete ? "fv-current" : ""}`}>
          <h3>받는 앱 · {f.complete ? "해석 완료" : "전체 내용 대기"}</h3>
          <ContentTiles
            states={f.complete ? [true, true, true] : [false, false, false]}
            photo={photo}
          />
          <p>
            {f.complete
              ? "길이 규칙으로 300바이트 해석"
              : "앱에는 전체 내용이 아직 완성되지 않음"}
          </p>
        </div>
      </div>
      <div className="fv-layer-pair">
        <div className="fv-panel">
          <h3>② 전송 데이터 · TCP 바이트 흐름</h3>
          <div className="fv-byte-row">
            {["A", "B", "C"].map((x, i) => (
              <div key={x}>
                <b>{x}</b>
                <span>
                  {i * 100 + 1}~{(i + 1) * 100}
                </span>
              </div>
            ))}
          </div>
          <p>
            실제 사진 압축 블록이 아닙니다. 바이트 구간과 그림 부분을 대응시킨
            개념도입니다.
          </p>
        </div>
        <div className="fv-panel">
          <h3>수신 TCP · 순서 복구</h3>
          <div className="fv-byte-row">
            {f.received.map((v, i) => (
              <div key={i} data-present={v}>
                <b>{["A", "B", "C"][i]}</b>
                <span>
                  {v
                    ? f.delivered >= (i + 1) * 100
                      ? "앱에 제공"
                      : "버퍼 대기"
                    : "아직 없음"}
                </span>
              </div>
            ))}
          </div>
          <p>
            연속 제공 {f.delivered} / 뒤에서 대기 {f.buffered}바이트 · 다음 기대
            번호 {f.ack}
          </p>
        </div>
      </div>
      <div className="fv-packets">
        <h3>③ IP 패킷 · 전달 정보로 감싸기</h3>
        <div className="fv-packet-row">
          {["A", "B", "C"].map((x, i) => (
            <div
              className={`fv-envelope ${f.chunk === x ? "fv-current" : ""}`}
              key={x}
            >
              <b>IP 헤더 · 출발지 / 목적지</b>
              <span>TCP 헤더 · 바이트 위치 {i * 100 + 1}</span>
              <strong>데이터 {x} · 100바이트</strong>
            </div>
          ))}
        </div>
        <div className={`fv-wire ${f.moving && f.chunk ? "fv-active" : ""}`}>
          <span>송신 TCP/IP</span>
          <div className="fv-wire-track">
            {f.chunk && (
              <b
                key={`${player.index}-${player.playing}`}
                className={`fv-traveler ${player.playing && f.moving ? "fv-moving" : ""}`}
              >
                {f.chunk} {f.moving ? "→" : "× 손실"}
              </b>
            )}
          </div>
          <span>수신 TCP/IP</span>
        </div>
      </div>
      <Playback
        player={player}
        count={frames.length}
        reset={() => {
          setPhoto(true);
          setLoss(true);
          change();
        }}
      />
      <div className="fv-explanation" aria-live="polite">
        <h3>
          {player.index + 1}. {f.title}
        </h3>
        <p>{f.detail}</p>
      </div>
      <label className="fv-prediction">
        B가 없고 C가 도착했을 때 앱에 연속 제공할 수 있는 양은?
        <select
          aria-label="패킷 전달량 예측"
          value={prediction}
          onChange={(e) => setPrediction(e.target.value)}
        >
          <option value="">선택 없이도 관찰 가능</option>
          <option value="100">100바이트</option>
          <option value="300">300바이트</option>
        </select>
      </label>
      {prediction && (
        <p>
          {prediction === "100"
            ? "✓ 맞습니다."
            : "다시 수신 TCP의 빈칸을 보세요."}{" "}
          B가 비어 있다면 C는 대기합니다. 손실 없는 설정에서는 C 도착 시
          300바이트입니다.
        </p>
      )}
      <details>
        <summary>모든 단계 · 움직임 없이 읽기</summary>
        <ol>
          {frames.map((s, i) => (
            <li key={i}>
              <b>{s.title}</b>
              <p>{s.detail}</p>
              <p>
                연속 제공 {s.delivered} / 대기 {s.buffered}바이트
              </p>
            </li>
          ))}
        </ol>
      </details>
      <p className="fv-note">
        가정: 이미 연결된 TCP/IPv4, 가상 데이터 300바이트, TCP 구간 하나를 IP
        패킷 하나로 전달, 시작 바이트 1. 앱은 데이터 길이를 사전에 압니다. B
        손실 시 타임아웃 후 한 번 재전송하여 성공합니다. TCP 세그먼트 경계는 앱
        메시지 경계가 아닙니다. IP 단편화·단편 재조립, 실제 인코딩·TLS·ACK
        이동·혼잡 제어·복구 실패는 생략합니다. 사진 완성은 앱 해석이며 IP가
        보장하는 기능이 아닙니다.
      </p>
    </section>
  );
}
