import { useState } from "react";
import { usePlayback } from "../money/shared";
import {
  newsCase,
  newsIds,
  categories,
  assessNews,
  type NewsId,
  type Category,
} from "../../simulations/economics/cycles-news.mjs";
import { MarketChart } from "./FoundationLabs";
import { SectorBars } from "./CycleLabs";
import { num } from "./PriceLabs";
import "./cycles-news.css";
export function NewsLab() {
  const [id, I] = useState<NewsId>("demand"),
    [answers, A] = useState<Record<string, Category>>({}),
    [selected, S] = useState<string[]>([]),
    [checked, C] = useState(false);
  const play = usePlayback(3),
    c = newsCase(id),
    r = assessNews(id, answers, selected),
    active = c.claims[play.step];
  const reset = () => {
    A({});
    S([]);
    C(false);
    play.rewind();
  };
  return (
    <section className="eco-lab eco-news-lab" aria-label="가상 뉴스 읽기 실험">
      <h3>자료 → 조건 → 해석 → 조건부 전망</h3>
      <div className="eco-options">
        {newsIds.map((v) => (
          <button
            key={v}
            aria-pressed={id === v}
            onClick={() => {
              I(v);
              reset();
            }}
          >
            {v === "demand"
              ? "① 수요 확대"
              : v === "cost"
                ? "② 비용 충격"
                : "③ 엇갈린 지표"}
          </button>
        ))}
      </div>
      <div className="eco-fictional-paper">
        <small>자체 가상 뉴스 · 실제 기사 아님</small>
        <h4>{c.title}</h4>
        <p>{c.claims[0].text}</p>
      </div>
      {play.controls}
      <button onClick={reset}>사례 응답 초기화</button>
      <p className="eco-stage" aria-live="polite">
        {categories.find((t) => t.id === active.category)?.label} 검토 ·{" "}
        {active.text}
      </p>
      <div className="eco-news-evidence-scene">
        <div
          className={`eco-news-observed ${play.step === 0 ? "eco-news-focus" : ""}`}
        >
          <h4>① 자료의 모양</h4>
          {c.market ? (
            <>
              <MarketChart r={c.market} base={c.base} />
              <p>
                기준 {num(c.base.equilibrium.price)}원·
                {c.base.equilibrium.quantity}개 → 비교{" "}
                {num(c.market.equilibrium.price)}원·
                {c.market.equilibrium.quantity}개. 02장과 같은 가상 빵
                시장입니다.
              </p>
            </>
          ) : (
            c.cycle && <SectorBars r={c.cycle} />
          )}
        </div>
        <div className="eco-news-reasoning">
          <div
            className={`eco-news-gate ${play.step === 1 ? "eco-news-focus" : ""}`}
          >
            <b>② 설명에 필요한 조건</b>
            <p>{c.claims[1].text}</p>
          </div>
          <div className="eco-news-arrow">↓ 조건을 확인하며 연결</div>
          <div
            className={`eco-news-reading ${play.step === 2 ? "eco-news-focus" : ""}`}
          >
            <b>③ 가능한 해석</b>
            <p>{c.claims[2].text}</p>
          </div>
          <div className="eco-news-arrow">
            ↓ 유지될 조건·시차·다른 충격 확인
          </div>
          <div
            className={`eco-news-future ${play.step === 3 ? "eco-news-focus" : ""}`}
          >
            <b>④ 아직 관측되지 않은 미래</b>
            <p>{c.claims[3].text}</p>
          </div>
        </div>
      </div>
      <p>
        관측 영역은 실선, 조건은 이중 경계, 미래는 점선 경계입니다. 화살표는
        검토 순서이며 인과가 증명됐다는 표시가 아닙니다. 재생은 강조만 바꾸고
        관측값을 미래 값으로 바꾸지 않습니다.
      </p>
      <fieldset className="eco-news-classify">
        <legend>문장별 역할을 골라 보세요</legend>
        {[3, 0, 2, 1].map((index) => {
          const claim = c.claims[index],
            feedback = r.feedback.find((f) => f.id === claim.id)!;
          return (
            <div key={claim.id}>
              <label className="eco-predict">
                <span>{claim.text}</span>
                <select
                  aria-label={`${index + 1}번 문장 분류`}
                  value={answers[claim.id] ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) A({ ...answers, [claim.id]: value as Category });
                    else {
                      const next = { ...answers };
                      delete next[claim.id];
                      A(next);
                    }
                    C(false);
                  }}
                >
                  <option value="">분류 선택</option>
                  {categories.map((t) => (
                    <option value={t.id} key={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              {checked && (
                <p className={`eco-news-feedback eco-class-${claim.category}`}>
                  {feedback.correct ? "분류 일치" : "다시 확인"} ·{" "}
                  {categories.find((t) => t.id === claim.category)?.label}:{" "}
                  {feedback.reason}
                </p>
              )}
            </div>
          );
        })}
      </fieldset>
      <fieldset className="eco-news-sources">
        <legend>더 확인할 자료 · 여러 개 선택 가능</legend>
        {c.evidence.map((e) => (
          <button
            aria-pressed={selected.includes(e.id)}
            key={e.id}
            onClick={() => {
              S(
                selected.includes(e.id)
                  ? selected.filter((v) => v !== e.id)
                  : [...selected, e.id],
              );
              C(false);
            }}
          >
            {e.label}
          </button>
        ))}
      </fieldset>
      <button onClick={() => C(true)}>분류·자료 선택 해설 보기</button>
      {checked && (
        <div className="eco-news-result" role="status">
          <b>
            문장 분류 {r.correct} / {r.total}
          </b>
          <p>원인의 확률이나 전망 정확도 점수가 아닙니다.</p>
          {r.evidence.length ? (
            r.evidence.map((e) => (
              <p key={e.id}>
                <strong>
                  {e.label} · {e.role}
                </strong>
                <br />
                {e.reason}
              </p>
            ))
          ) : (
            <p>
              확인 자료도 선택해 보세요. 한 자료를 고르는 것만으로 원인이
              확정되지는 않습니다.
            </p>
          )}
          <p>
            <b>반례·한계</b> · {c.counterexample}
          </p>
        </div>
      )}
      <details>
        <summary>정적 대안 · 모든 문장 분류·이유·확인 자료</summary>
        <div
          className="eco-table"
          tabIndex={0}
          role="region"
          aria-label="뉴스 문장 분류표"
        >
          <table>
            <thead>
              <tr>
                <th>문장</th>
                <th>역할</th>
                <th>이유</th>
              </tr>
            </thead>
            <tbody>
              {c.claims.map((claim) => (
                <tr key={claim.id}>
                  <td>{claim.text}</td>
                  <th>
                    {categories.find((t) => t.id === claim.category)?.label}
                  </th>
                  <td>{claim.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {c.evidence.map((e) => (
          <p key={e.id}>
            <b>
              {e.label} · {e.role}
            </b>
            <br />
            {e.reason}
          </p>
        ))}
        <p>{c.counterexample}</p>
      </details>
      <p>
        보기의 자료는 확인할 방향입니다. 실제 데이터를 내려받거나 원인을 추정한
        결과가 아닙니다. 개인 계좌·투자 종목·실제 기사 본문을 입력하지 않습니다.
      </p>
    </section>
  );
}
