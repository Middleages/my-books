import type { ReactNode } from 'react';
export const number = (value: number) => value.toLocaleString('ko-KR', { maximumFractionDigits: 4 });
export const amount = (value: number) => `${number(value)}단위`;
export const percent = (value: number | null) => value === null ? '정의 불가' : `${number(value * 100)}%`;
export function Range({ label, value, max, min = 0, step = 1, unit, onChange }: { label: string; value: number; max: number; min?: number; step?: number; unit: string; onChange: (value: number) => void }) {
  return <label className="invest-control"><span>{label} <strong>{number(value)}{unit}</strong></span><input type="range" min={min} max={max} step={step} value={value} aria-valuetext={`${number(value)}${unit}`} onChange={event => onChange(Number(event.target.value))} /></label>;
}
export function Prediction({ question, value, onChange, options }: { question: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return <label className="invest-predict">먼저 예측 · {question}<select value={value} onChange={event => onChange(event.target.value)}><option value="">예측 선택</option>{options.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>;
}
export function StaticTable({ title, children }: { title: string; children: ReactNode }) {
  return <details><summary>정적 대안 · {title}</summary><div className="invest-table" tabIndex={0} role="region" aria-label={title}>{children}</div></details>;
}
export function Building({ children }: { children: ReactNode }) {
  return <div className="invest-company"><svg viewBox="0 0 80 48" aria-hidden="true"><path d="M6 45V15L25 5V18L44 8V22H73V45Z" fill="currentColor"/><path d="M17 28h8m9 0h8m9 0h8M17 37h8m9 0h8m9 0h8" stroke="white" strokeWidth="4"/></svg>{children}</div>;
}
export function Person({ children, observer = false }: { children: ReactNode; observer?: boolean }) {
  return <div className={`invest-person ${observer ? 'invest-observer' : ''}`}><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="12" r="9" fill="currentColor"/><path d="M8 45V34a16 16 0 0 1 32 0v11Z" fill="currentColor"/></svg>{children}</div>;
}
export function FlowArrow({ label, kind = 'cash', reverse = false, active = false }: { label: string; kind?: 'cash' | 'shares'; reverse?: boolean; active?: boolean }) {
  return <div className={`invest-route ${kind} ${reverse ? 'reverse' : ''} ${active ? 'active' : ''}`}><span>{label}</span><div className="invest-arrow" aria-hidden="true"><i /></div></div>;
}
