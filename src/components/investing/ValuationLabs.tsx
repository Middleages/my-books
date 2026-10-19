import { useState } from 'react';
import { usePlayback } from '../money/shared';
import {
  shareValuationDefaults, shareValuationFrames, cashFlowValuationDefaults, cashFlowValuationFrames,
  type ShareValuationSnapshot, type ValuationCashSegment,
} from '../../simulations/investing/valuation.mjs';
import { amount, number, Prediction, Range, StaticTable } from './shared';
import './investing.css';
import './valuation.css';

const nullable = (value: number | null) => value === null ? '정의 불가' : number(value);
function ShareMosaic({ snapshot, label }: { snapshot: ShareValuationSnapshot; label: string }) {
  return <div className="valuation-share-panel">
    <h4>{label}</h4>
    <div className="valuation-mosaic" style={{ gridTemplateColumns: `repeat(${snapshot.gridColumns}, 1fr)`, gridTemplateRows: `repeat(${snapshot.gridRows}, 1fr)` }} role="img" aria-label={`${snapshot.tiles.length}개 칸으로 표시한 전체 ${number(snapshot.shares)}주. 칸마다 ${number(snapshot.sharesPerTile)}주, 전체 시가총액 ${amount(snapshot.marketCap)}.`}>
      {snapshot.tiles.map(tile => <i key={tile.id} data-share-fraction={tile.fraction} />)}
    </div>
    <p className="valuation-mosaic-key">한 칸 = {number(snapshot.sharesPerTile)}주 · 칸 {snapshot.tiles.length}개</p>
    <p className="valuation-equation"><strong>{amount(snapshot.price)}</strong><span>×</span><strong>{number(snapshot.shares)}주</strong><span>=</span><strong>{amount(snapshot.marketCap)}</strong></p>
    <span>주당 가격 × 전체 주식 수 = 시가총액</span>
  </div>;
}

export function ShareValuationLab() {
  const [earnings, setEarnings] = useState(shareValuationDefaults.earnings);
  const [splitFactor, setSplitFactor] = useState(shareValuationDefaults.splitFactor);
  const [prediction, setPrediction] = useState('');
  const result = shareValuationFrames({ earnings, splitFactor });
  const play = usePlayback(result.frames.length - 1), frame = result.frames[play.step];
  const change = (value: number, field: 'earnings' | 'split') => {
    if (field === 'earnings') setEarnings(value); else setSplitFactor(value);
    setPrediction(''); play.rewind();
  };
  const reset = () => { setEarnings(shareValuationDefaults.earnings); setSplitFactor(shareValuationDefaults.splitFactor); setPrediction(''); play.rewind(); };
  return <section className="invest-lab valuation-lab" data-lab="share-valuation" aria-label="주가·시가총액·주당이익 실험">
    <h3>한 주가 작아지면 회사의 전체 몫도 작아질까요?</h3>
    <p>분할 전 가격 {amount(result.before.price)} · {number(result.before.shares)}주의 가상 보통주입니다. 전체 경계는 유지하면서 칸만 더 잘게 나눕니다. 칸은 개별 주식이 아니라 여러 주를 묶은 표시입니다.</p>
    <div className="invest-controls">
      <label className="invest-control"><span>분할 배수 <strong>{splitFactor}배</strong></span><select value={splitFactor} onChange={event => change(Number(event.target.value), 'split')}><option value="1">1배 · 분할 없음</option><option value="2">2배 · 1주를 2주로</option><option value="5">5배 · 1주를 5주로</option></select></label>
      <Range label="당기 이익" value={earnings} min={-20000} max={20000} step={5000} unit="단위" onChange={value => change(value, 'earnings')} />
    </div>
    <div className="invest-options"><button onClick={() => change(10000, 'earnings')}>이익 10,000</button><button onClick={() => change(0, 'earnings')}>이익 0</button><button onClick={() => change(-10000, 'earnings')}>손실 −10,000</button></div>
    <Prediction question="분할만 반영한 시가총액은 분할 전보다?" value={prediction} onChange={setPrediction} options={[["up", "늘어난다"], ["same", "그대로다"], ["down", "줄어든다"]]} />
    {play.controls}
    <button onClick={() => play.seek(result.frames.length - 1)}>분할 후 바로 보기</button><button onClick={reset}>조건까지 초기화</button>
    <h4 className="invest-stage" aria-live="polite">{frame.label}</h4>
    <figure aria-label="분할 전후 같은 전체를 더 많은 주식으로 나눈 비교">
      <div className="valuation-mosaic-comparison">
        <ShareMosaic snapshot={result.before} label="기준 · 분할 전" />
        <div className="valuation-split-link"><strong>주식 수 ×{splitFactor}</strong><span aria-hidden="true">→</span><strong>주당 가격 ÷{splitFactor}</strong></div>
        <ShareMosaic snapshot={frame} label={frame.splitObserved ? '현재 · 분할 후' : '현재 · 아직 분할 전'} />
      </div>
      <figcaption>파란 칸은 같은 종류 주식의 묶음, 바깥 경계는 전체 주식입니다. 분할 후에도 전체 경계와 시가총액은 같습니다. 가격의 다른 시장 변화·수수료·세금·새 발행은 없는 비교이며 실제 분할일의 체결가격을 예측하지 않습니다.</figcaption>
    </figure>
    <div className="valuation-metrics" aria-label="현재 주당이익과 주가수익비율">
      <div><b>당기 이익을 한 주 기준으로</b><p>{amount(frame.earnings)} ÷ {number(frame.shares)}주</p><strong>EPS {nullable(frame.eps)}{frame.eps === null ? '' : '단위/주'}</strong></div>
      <div><b>가격이 주당이익의 몇 배인가</b><p>{amount(frame.price)} ÷ EPS {nullable(frame.eps)}</p><strong>PER {nullable(frame.per)}{frame.per === null ? '' : '배'}</strong></div>
    </div>
    <p className="invest-result" data-testid="valuation-equity-result" role="status">{play.step === result.frames.length - 1 && prediction ? `${prediction === frame.predictionOutcome ? '예측과 같습니다.' : '예측과 다릅니다.'} ` : ''}{frame.message}</p>
    <p className="invest-note">이익은 한 회계연도의 보통주 귀속 이익으로 놓습니다. 실제 EPS에는 기간 중 가중평균 주식 수와 기본·희석 구분 등이 필요합니다. 이 비교는 같은 기간·같은 이익을 분할 기준으로 다시 나누며, 분할한 뒤 이익을 한 번 더 벌었다는 뜻이 아닙니다.</p>
    <StaticTable title="분할 전후 전체 과정과 EPS·PER"><table><thead><tr><th>관찰 단계</th><th>주당 가격(단위/주)</th><th>발행 주식(주)</th><th>시가총액(단위)</th><th>당기 이익(단위)</th><th>EPS(단위/주)</th><th>PER(배)</th></tr></thead><tbody>{result.frames.map(row => <tr key={row.phase} data-phase={row.phase}><th>{row.label}</th><td>{number(row.price)}</td><td>{number(row.shares)}</td><td>{number(row.marketCap)}</td><td>{number(row.earnings)}</td><td>{nullable(row.eps)}</td><td>{nullable(row.per)}</td></tr>)}</tbody></table></StaticTable>
  </section>;
}

function CashBar({ segments, label, pending = false }: { segments: ValuationCashSegment[]; label: string; pending?: boolean }) {
  return <div className={`valuation-cash-bar ${pending ? 'valuation-pending-bar' : ''}`} role="img" aria-label={label}>
    {!pending && segments.map(part => <i key={part.kind} className={`valuation-${part.kind}`} data-value={part.value} style={{ width: `${part.fraction * 100}%` }} />)}
  </div>;
}

export function CashFlowValuationLab() {
  const [conditions, setConditions] = useState({ ...cashFlowValuationDefaults });
  const [prediction, setPrediction] = useState('');
  const result = cashFlowValuationFrames(conditions);
  const play = usePlayback(result.frames.length - 1), frame = result.frames[play.step];
  const change = (field: keyof typeof conditions, value: number) => { setConditions(previous => ({ ...previous, [field]: value })); setPrediction(''); play.rewind(); };
  const reset = () => { setConditions({ ...cashFlowValuationDefaults }); setPrediction(''); play.rewind(); };
  return <section className="invest-lab valuation-lab" data-lab="cashflow-valuation" aria-label="미래 현금의 현재가치 실험">
    <h3>같은 미래 현금도 오늘의 값은 달라집니다</h3>
    <p>앞 실험의 기업과 별개인 가상 주당 현금입니다. 매년 말 {amount(conditions.annualCash)}를 3번, 3년 말 잔존 현금 {amount(conditions.residualCash)}를 한 번 더 받는다고 가정합니다. 4년 이후는 없으며, 오늘 받은 현금도 0입니다.</p>
    <Range label="할인율" value={conditions.ratePercent} max={20} step={1} unit="%/년" onChange={value => change('ratePercent', value)} />
    <div className="invest-controls">
      <Range label="매년 현금" value={conditions.annualCash} max={20} step={5} unit="단위/주" onChange={value => change('annualCash', value)} />
      <Range label="3년 말 잔존 현금" value={conditions.residualCash} max={160} step={20} unit="단위/주" onChange={value => change('residualCash', value)} />
    </div>
    <Prediction question={`할인율 0%의 합계 ${number(result.undiscountedTotal)}와 비교한 현재가치는?`} value={prediction} onChange={setPrediction} options={[["up", "더 크다"], ["same", "같다"], ["down", "더 작다"]]} />
    {play.controls}
    <button onClick={() => play.seek(result.frames.length - 1)}>현재가치 합계 바로 보기</button><button onClick={reset}>조건까지 초기화</button>
    <h4 className="invest-stage" aria-live="polite">{frame.label}</h4>
    <figure aria-label="연도별 미래 현금을 현재로 할인하고 합치는 과정">
      <div className="valuation-flow-key"><span className="valuation-regular-key">단색 · 매년 현금</span><span className="valuation-residual-key">사선 · 3년 말 잔존 현금</span></div>
      <div className="valuation-flow-years">{frame.contributions.map(flow => <div key={flow.year} className={`valuation-flow-year ${flow.observed ? 'valuation-observed' : ''}`}>
        <h4>{flow.label}</h4>
        <p>미래 현금 <strong>{number(flow.futureCash)}</strong>단위/주</p>
        <CashBar segments={flow.futureSegments} label={`${flow.label} 매년 현금 ${number(flow.regularCash)} + 잔존 현금 ${number(flow.residualCash)} = ${number(flow.futureCash)}단위/주`} />
        <p className="valuation-flow-parts">매년 {number(flow.regularCash)} + 잔존 {number(flow.residualCash)}</p>
        <div className="valuation-discount-arrow"><span>÷ (1 + {number(result.rate)})<sup>{flow.year}</sup></span><b aria-hidden="true">↓</b><span>÷ {number(flow.discountDivisor)}</span></div>
        <p>현재가치 <strong>{flow.observed ? number(flow.presentValue) : '아직 미반영'}</strong>{flow.observed ? '단위/주' : ''}</p>
        <CashBar segments={flow.presentSegments} pending={!flow.observed} label={flow.observed ? `현재가치 ${number(flow.presentValue)}단위/주` : `${flow.label} 현금의 현재가치를 아직 합계에 반영하지 않음`} />
        <p className="valuation-flow-parts">{flow.observed ? `현재 기준: 매년 ${number(flow.regularPresent)} + 잔존 ${number(flow.residualPresent)}` : '0단위라는 뜻이 아니라 계산 관찰 전입니다.'}</p>
      </div>)}</div>
      <div className="valuation-flow-years valuation-total-row"><div className="valuation-current-total">
        <b>{frame.isComplete ? '오늘 기준의 조건부 합계' : '오늘 기준의 반영 소계'} · {number(frame.observedPresentValue)}단위/주</b>
        <div className="valuation-cash-bar" role="img" aria-label={`${frame.observedYears}개 연도 현금의 현재가치 합계 ${number(frame.observedPresentValue)}단위/주`}>{frame.totalSegments.map(part => <i key={part.year} className={`valuation-year-${part.year}`} data-year={part.year} style={{ width: `${part.fraction * 100}%` }} />)}</div>
        <p>{frame.totalSegments.map(part => `${part.label} ${number(part.value)}`).join(' + ')}</p>
      </div></div>
      <figcaption>금액 막대의 가로 눈금은 모두 0–{number(frame.scale)}단위/주로 고정합니다. 상단은 해당 연도 미래 금액, 하단은 오늘로 환산한 금액입니다. 합계 띠의 경계는 1·2·3년 말 현금의 기여분입니다. 화살표는 평가 시점의 변환이며 실제 현금 이동이나 수수료 공제가 아닙니다.</figcaption>
    </figure>
    <p className="invest-result" data-testid="valuation-cashflow-result" role="status">{frame.isComplete && prediction ? `${prediction === frame.predictionOutcome ? '예측과 같습니다.' : '예측과 다릅니다.'} ` : ''}{frame.message}</p>
    <p className="invest-note">금액과 할인율은 교육용 가정입니다. 잔존 현금은 입력한 마지막 현금이며 숨겨진 영구성장 계산이 아닙니다. 주당 이익을 그대로 지급 현금으로 바꾸지 않았고, 세금·거래비용·실제 지급 실패는 계산하지 않습니다. 재생 없이 ‘바로 보기’와 아래 표로 모든 결과를 읽을 수 있습니다.</p>
    <StaticTable title="현재 시점으로 옮기는 전체 관찰 과정"><table><thead><tr><th>관찰 단계</th><th>1년 말 기여(단위/주)</th><th>2년 말 기여(단위/주)</th><th>3년 말 기여(단위/주)</th><th>반영 소계(단위/주)</th></tr></thead><tbody>{result.frames.map(row => <tr key={row.phase} data-phase={row.phase}><th>{row.label}</th><td>{row.year1Present === null ? '미반영' : number(row.year1Present)}</td><td>{row.year2Present === null ? '미반영' : number(row.year2Present)}</td><td>{row.year3Present === null ? '미반영' : number(row.year3Present)}</td><td>{number(row.observedPresentValue)}</td></tr>)}</tbody></table></StaticTable>
    <StaticTable title="연도별 전체 현금과 할인 계산"><table><thead><tr><th>지급 시점</th><th>매년 현금(단위/주)</th><th>잔존 현금(단위/주)</th><th>미래 합계(단위/주)</th><th>나누는 배수</th><th>현재가치(단위/주)</th></tr></thead><tbody>{result.flows.map(flow => <tr key={flow.year}><th>{flow.label}</th><td>{number(flow.regularCash)}</td><td>{number(flow.residualCash)}</td><td>{number(flow.futureCash)}</td><td>{number(flow.discountDivisor)}</td><td>{number(flow.presentValue)}</td></tr>)}</tbody><tfoot><tr><th>합계</th><td colSpan={2}>서로 다른 시점의 미래 금액</td><td>{number(result.undiscountedTotal)}</td><td>같은 현재로 환산 →</td><td>{number(result.totalPresentValue)}</td></tr></tfoot></table></StaticTable>
  </section>;
}
