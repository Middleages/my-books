import { useState } from 'react';
import { usePlayback } from '../money/shared';
import { bondDefaults, bondFrames, classifyBondPrediction, type BondSegment, type BondScenario, type BondResult } from '../../simulations/investing/bonds.mjs';
import { amount, number, percent, Prediction, Range, StaticTable } from './shared';
import './investing.css';
import './bonds.css';

function BondBar({ segments, label }: { segments: BondSegment[]; label: string }) {
  return <div className="bond-bar" role="img" aria-label={label}>
    {segments.map(part => <i key={part.kind} data-bond-part={part.kind} className={`bond-${part.kind}`} style={{ width: `${part.fraction * 100}%` }} />)}
  </div>;
}

function BondLegend() {
  return <div className="bond-legend"><span className="coupon">황토 단색 · 쿠폰 이자</span><span className="principal">파랑 사선 · 원금</span></div>;
}

function YieldChart({ result }: { result: BondResult }) {
  return <figure className="bond-chart" aria-label="같은 지급 약속의 요구수익률과 현재 가격 관계">
    <h4>같은 약속, 다른 오늘 가격</h4>
    <p className="invest-scale">세로: 오늘 가격(단위) · 가로: 연 요구수익률(%)</p>
    <div className="bond-chart-plot">
    <svg viewBox={`0 0 ${result.chart.viewWidth} ${result.chart.viewHeight}`} role="img" aria-label={`요구수익률 0부터 20%까지의 가격 곡선. 현재 ${percent(result.input.requiredYield)}, 가격 ${amount(result.price)}. 검은 사각형은 5% 기준입니다.`}>
      {result.priceTicks.map(tick => <line key={tick.value} x1={result.chart.left} x2={318} y1={tick.y} y2={tick.y} stroke="#ced9df" />)}
      <line x1={52} x2={52} y1={22} y2={188} stroke="#657c89" />
      <line x1={52} x2={318} y1={188} y2={188} stroke="#657c89" />
      {result.sensitivityTicks.map(tick => <line key={tick.requiredYield} x1={tick.x} x2={tick.x} y1={188} y2={194} stroke="#657c89" />)}
      <polyline points={result.curve} fill="none" stroke="#286b7a" strokeWidth={3} />
      <rect x={result.sensitivity[5].x - 5} y={result.sensitivity[5].y - 5} width={10} height={10} fill="#263746" />
      <circle cx={result.selectedPoint.x} cy={result.selectedPoint.y} r={7} fill="#fff" stroke="#a04e1e" strokeWidth={3} />
    </svg>
    {result.priceTicks.map(tick => <span className="bond-y-label" key={tick.value} style={{ top: `${tick.yFraction * 100}%` }}>{number(tick.value)}</span>)}
    {result.sensitivityTicks.map(tick => <span className="bond-x-label" key={tick.requiredYield} style={{ left: `${tick.xFraction * 100}%` }}>{number(tick.requiredYield * 100)}</span>)}
    </div>
    <figcaption>실선은 동일한 쿠폰·원금을 할인한 계산입니다. 검은 사각형은 5%·{amount(result.baselinePrice)}, 테두리 원은 현재 조건입니다. 금액 눈금은 조건을 바꿔도 같습니다. 실제 시세·미래 금리 전망이 아닙니다.</figcaption>
  </figure>;
}

export function BondsLab() {
  const [requiredYield, setRequiredYield] = useState(bondDefaults.requiredYield);
  const [prediction, setPrediction] = useState('');
  const result = bondFrames({ requiredYield });
  const play = usePlayback(result.pricingFrames.length - 1);
  const frame = result.pricingFrames[play.step];
  const changeYield = (value: number) => { setRequiredYield(value); setPrediction(''); play.rewind(); };
  const correct = classifyBondPrediction(result.priceDirection, prediction);
  return <section className="invest-lab bond-lab" aria-label="채권 가격과 요구수익률 실험">
    <h3>먼저 시간표를 읽고, 오늘 가치로 옮깁니다</h3>
    <p>액면 {amount(result.input.face)}, 연 쿠폰 {amount(result.input.annualCoupon)}, 만기 {result.input.years}년입니다. 매년 말 한 번 지급하며, 아래 시간표의 약속은 고정입니다. 미래 막대와 현재가치 막대는 같은 눈금입니다.</p>
    <BondLegend />
    <figure aria-label="매년 쿠폰과 만기 원금의 지급 시점 및 현재가치">
      <div className="bond-timeline">
        <div className="bond-origin"><b>오늘 · 평가 시점</b><span>미래 지급액을 오늘의 금액으로 환산 ↓</span></div>
        {result.schedule.map(row => <div className="bond-time-row" key={row.year} data-year={row.year} aria-current={frame.year === row.year ? 'step' : undefined}>
          <div className="bond-date"><b>{row.label}</b><span>{row.year === result.input.years ? '만기 원금도 지급' : '원금 지급 전'}</span></div>
          <div className="bond-pair">
            <div><b>그때의 약속 {amount(row.promisedCash)}</b><BondBar segments={row.promisedSegments} label={`쿠폰 ${amount(row.promisedCoupon)}, 원금 ${amount(row.promisedPrincipal)}`} /><span>쿠폰 {number(row.promisedCoupon)} + 원금 {number(row.promisedPrincipal)}</span></div>
            <div><b>오늘 가치 {amount(row.presentValue)}</b><BondBar segments={row.presentSegments} label={`현재가치: 쿠폰 ${amount(row.presentCoupon)}, 원금 ${amount(row.presentPrincipal)}`} /><span>지급액 ÷ (1 + {percent(requiredYield)})<sup>{row.year}</sup></span></div>
          </div>
        </div>)}
      </div>
      <figcaption>각 막대는 0–{number(result.paymentScale)}단위입니다. 작은 황토 부분이 쿠폰, 긴 파랑 사선이 만기 원금입니다. 빈 배경은 남은 눈금이며 손실액을 뜻하지 않습니다. 요구수익률을 바꿔도 그때의 약속은 그대로, 오늘 가치만 달라집니다.</figcaption>
    </figure>
    <Range label="요구수익률" value={requiredYield * 100} max={20} step={0.5} unit="% / 년" onChange={value => changeYield(value / 100)} />
    <div className="invest-options">{[0, 0.05, 0.1].map(value => <button key={value} aria-pressed={requiredYield === value} onClick={() => changeYield(value)}>요구수익률 {number(value * 100)}%</button>)}</div>
    <Prediction question="선택한 수익률의 가격은 5% 때보다?" value={prediction} onChange={setPrediction} options={[["up", "높다"], ["same", "같다"], ["down", "낮다"]]} />
    {play.controls}
    <button onClick={() => play.seek(result.pricingFrames.length - 1)}>가격 합계 바로 보기</button>
    <button onClick={() => changeYield(bondDefaults.requiredYield)}>조건까지 초기화</button>
    <h4 className="invest-stage" data-testid="bonds-price-stage" aria-live="polite">{frame.label}</h4>
    <div className="bond-price-total"><span>현재 단계까지 더한 오늘 가치</span><strong data-testid="bonds-price">{amount(frame.accumulatedPV)}</strong><span>전체 약속을 더한 가격: {amount(result.price)}</span></div>
    <p className="invest-result" role="status">{play.step === result.pricingFrames.length - 1 && correct !== null ? `${correct ? '예측과 같습니다.' : '예측과 다릅니다.'} ` : ''}{frame.message}</p>
    <YieldChart result={result} />
    <p className="invest-note">재생은 오늘의 계산을 항목별로 살펴보는 순서이며 시간이 실제로 흐르거나 돈이 입금되는 과정이 아닙니다. 모든 지급에 같은 연 수익률을 쓰고 지급은 정상이라고 가정합니다. 실제 거래가격을 보장하지 않습니다. 경과이자·중도상환(콜)·세금·거래비용은 생략합니다.</p>
    <StaticTable title="오늘 가치 합산의 전체 단계"><table><thead><tr><th>관찰 단계</th><th>반영 연도</th><th>추가 현재가치(단위)</th><th>누적 현재가치(단위)</th></tr></thead><tbody>{result.pricingFrames.map(row => <tr key={row.year}><th>{row.label}</th><td>{row.year}</td><td>{number(row.presentValue)}</td><td>{number(row.accumulatedPV)}</td></tr>)}</tbody></table></StaticTable>
    <StaticTable title="지급 시점별 약속과 현재가치"><table><thead><tr><th>시점</th><th>쿠폰 약속(단위)</th><th>원금 약속(단위)</th><th>쿠폰 현재가치(단위)</th><th>원금 현재가치(단위)</th><th>현재가치 합(단위)</th></tr></thead><tbody>{result.schedule.map(row => <tr key={row.year}><th>{row.label}</th><td>{number(row.promisedCoupon)}</td><td>{number(row.promisedPrincipal)}</td><td>{number(row.presentCoupon)}</td><td>{number(row.presentPrincipal)}</td><td>{number(row.presentValue)}</td></tr>)}</tbody></table></StaticTable>
  </section>;
}

export function BondPaymentsLab() {
  const [scenario, setScenario] = useState<BondScenario>('normal');
  const [prediction, setPrediction] = useState('');
  const result = bondFrames({ scenario });
  const play = usePlayback(result.frames.length - 1);
  const frame = result.frames[play.step];
  const changeScenario = (value: BondScenario) => { setScenario(value); setPrediction(''); play.rewind(); };
  const correct = classifyBondPrediction(result.summary.predictionOutcome, prediction);
  return <section className="invest-lab bond-lab" aria-label="채권 약속과 실제 지급 실험">
    <h3>약속은 그대로인데, 들어온 돈이 다르면?</h3>
    <p>앞 실험과 분리한 지급 경로입니다. 오늘 {amount(result.price)}에 샀다고 고정하고 만기까지 보유합니다. 받은 쿠폰은 이자 없이 현금으로 둡니다. 위의 수익률 조작은 이 매수가격을 바꾸지 않습니다.</p>
    <label className="invest-control"><span>지급 시나리오</span><select value={scenario} onChange={event => changeScenario(event.target.value as BondScenario)}><option value="normal">모든 쿠폰·원금 정상 지급</option><option value="failure">2년 말부터 쿠폰 중단 · 만기 원금 40% 회수</option></select></label>
    <div className="invest-options"><button aria-pressed={scenario === 'normal'} onClick={() => changeScenario('normal')}>정상 지급</button><button aria-pressed={scenario === 'failure'} onClick={() => changeScenario('failure')}>지급 실패 · 40% 회수</button></div>
    <p className="invest-note">실패는 임의로 만든 경로입니다. 첫해 쿠폰 50단위만 받고, 둘째 해부터 쿠폰은 받지 못하며, 만기에는 액면의 40%인 400단위만 회수합니다. 이때 미지급분의 추가 회수는 없다고 놓습니다. 실패 확률·회수 가능성을 추정한 값이 아닙니다.</p>
    <Prediction question="만기까지 실제 받은 현금은 매수가격 1,000보다?" value={prediction} onChange={setPrediction} options={[["up", "많다"], ["same", "같다"], ["down", "적다"]]} />
    {play.controls}
    <button onClick={() => play.seek(result.frames.length - 1)}>만기 바로 보기</button>
    <button onClick={() => changeScenario('normal')}>조건까지 초기화</button>
    <h4 className="invest-stage" data-testid="bonds-stage" aria-live="polite">{frame.label}</h4>
    <BondLegend />
    <figure aria-label="약속과 실제 수령의 같은 눈금 누계 비교">
      <div className="bond-cumulative">
        <div><b>현재 단계까지 약속한 현금</b><strong>{amount(frame.promisedCash)}</strong><BondBar segments={frame.promisedSegments} label={`현재 단계까지 약속한 현금 ${amount(frame.promisedCash)}`} /></div>
        <div><b>현재 단계까지 실제 받은 현금</b><strong data-testid="bonds-cash">{amount(frame.actualCash)}</strong><BondBar segments={frame.actualSegments} label={`현재 단계까지 실제 받은 쿠폰 ${amount(frame.cumulativeActualCoupon)}, 원금 ${amount(frame.cumulativeActualPrincipal)}`} /></div>
      </div>
      <figcaption>두 누적 막대 모두 0–{number(result.cashScale)}단위입니다. 빈 길이를 비교하면 지급 부족 {amount(frame.missingCash)}가 드러납니다. 미래 약속은 누계에 넣지 않습니다.</figcaption>
      <ol className="bond-payment-path">{result.frames.map(row => <li key={row.year} aria-current={row.year === frame.year ? 'step' : undefined}><button onClick={() => play.seek(row.year)} aria-label={`${row.label} 보기`}>{row.year === 0 ? '오늘' : `${row.year}년 말`}</button><span>{row.year === 0 ? `매수 지출 ${amount(row.purchaseOutflow)}` : `이때 수령 ${amount(row.payment)}`}</span></li>)}</ol>
    </figure>
    <div className="bond-return"><b>{frame.isMatured ? `${result.input.years}년 전체 보유기간 수익률` : '보유 중 · 아직 최종 수익률 없음'}</b><strong data-testid="bonds-return">{frame.isMatured ? percent(frame.holdingPeriodReturn) : '만기 정산 전'}</strong><p>{frame.isMatured ? `실제 수령 ${number(frame.actualCash)} − 매수 지출 ${number(result.price)} = 손익 ${amount(frame.netCashFlow)}. 이 손익을 매수가격으로 나눕니다.` : `지금까지 받은 현금은 ${amount(frame.actualCash)}입니다. 남은 채권의 시장가격을 계산하지 않아 이 현금만으로 중간 총수익률을 구하지 않습니다.`}</p></div>
    <p className="invest-result" role="status">{frame.isMatured && correct !== null ? `${correct ? '예측과 같습니다.' : '예측과 다릅니다.'} ` : ''}{frame.message}</p>
    <p className="invest-note">3년 전체의 단순 보유기간 수익률이며 연 수익률이 아닙니다. 정상 지급 때 15%, 위 실패 경로에서는 −55%입니다. 매수 때의 요구수익률 5%를 실제 1년 수익률로 보장하지 않습니다. 중도 매도·쿠폰 재투자·물가·비용·세금·추가 회수 절차는 계산하지 않습니다.</p>
    <StaticTable title="지급 시점별 약속과 실제 현금 장부"><table><thead><tr><th>단계</th><th>약속 쿠폰(단위)</th><th>약속 원금(단위)</th><th>실제 쿠폰(단위)</th><th>실제 원금(단위)</th><th>약속 누계(단위)</th><th>실제 현금 누계(단위)</th><th>순현금흐름(단위)</th><th>최종 보유기간 수익률</th></tr></thead><tbody>{result.frames.map(row => <tr key={row.year}><th>{row.label}</th><td>{number(row.promisedCoupon)}</td><td>{number(row.promisedPrincipal)}</td><td>{number(row.actualCoupon)}</td><td>{number(row.actualPrincipal)}</td><td>{number(row.promisedCash)}</td><td>{number(row.actualCash)}</td><td>{number(row.netCashFlow)}</td><td>{row.isMatured ? percent(row.holdingPeriodReturn) : '미정산'}</td></tr>)}</tbody></table></StaticTable>
  </section>;
}
