import type { ReactNode } from "react";
import { useId, useState } from "react";
import "./tax.css";
export const fmt = (n: number) =>
  n.toLocaleString("ko-KR", { maximumFractionDigits: 4 });
export function Range({
  label,
  value,
  min = 0,
  max = 600,
  step = 10,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="tax-range">
      <span>
        {label} <strong>{fmt(value)}</strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={`${fmt(value)} 가상 단위`}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
export function StaticTable({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <details className="tax-static">
      <summary>{title} · 정적 표</summary>
      <div className="tax-scroll" role="region" tabIndex={0} aria-label={title}>
        <table>
          <caption>
            {title} · 금액은 가상 단위, 현재 조건의 전체 결과입니다.
          </caption>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) =>
                  j === 0 ? (
                    <th key={j} scope="row">
                      {cell}
                    </th>
                  ) : (
                    <td key={j}>
                      {typeof cell === "number" ? fmt(cell) : cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
export function Bar({
  label,
  value,
  max,
  color = "teal",
  signed = false,
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
  signed?: boolean;
}) {
  return (
    <div className="tax-bar">
      <span>{label}</span>
      <div
        className="tax-track"
        role="img"
        aria-label={`${label} ${fmt(value)} 가상 단위. 눈금 0에서 ${fmt(max)}`}
      >
        <i
          className={`tax-fill ${color}`}
          data-value={value}
          data-max={max}
          style={{ width: `${(Math.abs(value) / max) * 100}%` }}
        />
      </div>
      <strong>
        {signed && value > 0 ? "+" : ""}
        {fmt(value)}
      </strong>
    </div>
  );
}
export function Prediction({
  question,
  answer,
  reason,
}: {
  question: string;
  answer: boolean;
  reason: string;
}) {
  const id = useId();
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  return (
    <fieldset className="tax-prediction">
      <legend>먼저 예측 · {question}</legend>
      {[
        ["yes", "그렇다"],
        ["no", "아니다"],
      ].map(([key, label]) => (
        <label key={key}>
          <input
            type="radio"
            name={id}
            value={key}
            checked={value === key}
            onChange={() => {
              setValue(key);
              setShow(false);
            }}
          />
          {label}
        </label>
      ))}
      <button disabled={!value} onClick={() => setShow(true)}>
        이유 확인
      </button>
      {show && (
        <p role="status">
          {(value === "yes") === answer
            ? "예측과 같습니다."
            : "다시 비교해 보세요."}{" "}
          {reason}
        </p>
      )}
    </fieldset>
  );
}
export function Lab({
  id,
  title,
  children,
  note = "모든 금액·세율·날짜는 가상입니다. 한국의 실제 납부세액·신고기한을 판정하지 않습니다.",
}: {
  id: string;
  title: string;
  children: ReactNode;
  note?: string;
}) {
  return (
    <section className="tax-lab" data-tax-lab={id} aria-label={title}>
      <h3>{title}</h3>
      <p className="tax-model-note">{note}</p>
      {children}
    </section>
  );
}
export function Stage({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="tax-stage" role="status">
      <strong>{label}</strong>
      <p>{detail}</p>
    </div>
  );
}
