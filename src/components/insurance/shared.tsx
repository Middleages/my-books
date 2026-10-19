import type { ReactNode } from 'react';

export const number = (value: number) => value.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
export const won = (value: number) => `${number(value / 10000)}만원`;
export const percent = (value: number) => `${number(value * 100)}%`;

export function InsuranceRange({ label, value, min = 0, max, step = 1, unit, onChange }: { label: string; value: number; min?: number; max: number; step?: number; unit: string; onChange: (value: number) => void }) {
  return <label className="insurance-control"><span>{label}<strong>{number(value)}{unit}</strong></span><input type="range" value={value} min={min} max={max} step={step} aria-valuetext={`${number(value)}${unit}`} onChange={event => onChange(Number(event.target.value))} /></label>;
}
export function InsurancePrediction({ question, value, onChange, options }: { question: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return <label className="insurance-prediction">먼저 예측 · {question}<select value={value} onChange={event => onChange(event.target.value)}><option value="">예측 선택</option>{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>;
}
export function InsuranceTable({ title, children }: { title: string; children: ReactNode }) {
  return <details className="insurance-static"><summary>정적 대안 · {title}</summary><div className="insurance-table" role="region" aria-label={title} tabIndex={0}>{children}</div></details>;
}
export function InsuranceHouse({ affected = false, small = false }: { affected?: boolean; small?: boolean }) {
  return <svg className={`insurance-house-icon ${small ? 'small' : ''}`} viewBox="0 0 44 44" aria-hidden="true"><path d="M4 20 22 4 40 20M9 18v23h26V18" fill={affected ? '#fff0e8' : '#f3f8f5'} stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/><path d="M18 41V28h8v13" fill="currentColor"/>{affected ? <path d="m27 12-6 11 8-2-7 12" fill="none" stroke="#b74c34" strokeWidth="3"/> : <path d="M15 23h5m5 0h5" stroke="currentColor" strokeWidth="3"/>}</svg>;
}
export function InsuranceArrow({ children, active = true }: { children: ReactNode; active?: boolean }) {
  return <div className={`insurance-flow-arrow ${active ? 'active' : ''}`}><span>{children}</span><i aria-hidden="true" /></div>;
}
