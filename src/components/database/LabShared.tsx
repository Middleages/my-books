import type { ReactNode } from "react";
import { useFoundationPlayback } from "../network/FoundationPlayback";
import "./database.css";

export { useFoundationPlayback as useDbPlayback };
export type DbFrameText = { title: string; detail: string };
export function DbPlayback({ player, count, reset }: {
  player: ReturnType<typeof useFoundationPlayback>; count: number; reset: () => void;
}) {
  return <div className="db-playback" role="group" aria-label="실험 단계 조작">
    <button type="button" onClick={() => player.setPlaying(!player.playing)} disabled={!player.playing && player.index === count - 1}>{player.playing ? "정지" : "재생"}</button>
    <button type="button" onClick={() => player.go(-1)} disabled={player.index === 0}>이전</button>
    <button type="button" onClick={() => player.go(1)} disabled={player.index === count - 1}>다음 단계</button>
    <button type="button" onClick={player.reset}>다시 보기</button>
    <button type="button" onClick={reset}>전체 초기화</button>
    <span className="db-step-count">{player.index + 1} / {count}단계</span>
  </div>;
}
export function DbCurrent({ frame }: { frame: DbFrameText }) {
  return <div className="db-current" role="status" aria-live="polite" aria-atomic="true"><strong>{frame.title}</strong><p>{frame.detail}</p></div>;
}
export function DbSteps({ frames }: { frames: DbFrameText[] }) {
  return <details className="db-static"><summary>모든 단계 · 움직임 없이 읽기</summary><ol>{frames.map((frame, i) => <li key={i}><strong>{frame.title}</strong><p>{frame.detail}</p></li>)}</ol></details>;
}
export function DbPrediction({ value, setValue, children }: { value: string; setValue: (s: string) => void; children: ReactNode }) {
  return <label className="db-prediction">먼저 예상해 보세요<select aria-label="먼저 예상해 보세요" value={value} onChange={e => setValue(e.target.value)}><option value="">예측 선택</option>{children}</select></label>;
}
export function DbSource({ children }: { children: ReactNode }) {
  return <section className="sources"><h2>근거와 모델의 경계</h2><p>PostgreSQL 18 공식 문서 확인일: 2026-10-20. 브라우저 그림은 결정적 교육 모델이며 실제 DB 실행 결과가 아닙니다.</p>{children}</section>;
}
export function DbGlossary({ rows }: { rows: [string, string][] }) {
  return <dl className="db-glossary">{rows.map(([term, meaning]) => <div key={term}><dt>{term}</dt><dd>{meaning}</dd></div>)}</dl>;
}
