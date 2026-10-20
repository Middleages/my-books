import { useEffect, useState, type ReactNode } from 'react';
export const number = (value: number | null) => value === null ? '정의되지 않음' : value.toLocaleString('ko-KR', { maximumFractionDigits: 4 });
export const money = (value: number) => `${number(value)}만원`;
export const percent = (value: number) => `${number(value * 100)}%`;
export function useObservation(last: number) {
  const [step, setStep] = useState(0), [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    if (step >= last) { setPlaying(false); return; }
    const timer = window.setTimeout(() => setStep(n => Math.min(last, n + 1)), 1600);
    return () => window.clearTimeout(timer);
  }, [playing, step, last]);
  const seek = (next: number) => { setPlaying(false); setStep(Math.max(0, Math.min(last, next))); };
  return { step, playing, seek, rewind: () => seek(0), controls: <div className="prob-playback" aria-label="관찰 단계 제어">
    <button onClick={() => seek(step - 1)} disabled={step === 0}>이전 단계</button>
    <button onClick={() => setPlaying(p => !p)} disabled={step === last}>{playing ? '정지' : '재생'}</button>
    <button onClick={() => seek(step + 1)} disabled={step === last}>다음 단계</button>
    <button onClick={() => seek(0)}>다시 보기</button>
    <span className="prob-step">{step + 1} / {last + 1}단계</span>
  </div> };
}
export function StaticTable({ title, children }: { title: string; children: ReactNode }) {
  return <details className="prob-static"><summary>{title}</summary><div className="prob-table" role="region" aria-label={title} tabIndex={0}>{children}</div></details>;
}
