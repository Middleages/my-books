import { useState } from 'react';
import { usePlayback } from '../money/shared';
import { allocationDefaults, allocationFrames, classifyAllocationPrediction, type AllocationFrame, type AllocationInput, type AllocationKey, type AllocationResult } from '../../simulations/investing/allocation-rebalancing.mjs';
import { amount, number, percent, Prediction, Range, StaticTable } from './shared';
import './investing.css';
import './allocation-rebalancing.css';

const names: Record<AllocationKey, string> = { stock: '주식', bond: '채권', cash: '매매 현금' };
const signedPercent = (value: number) => `${value > 0 ? '+' : ''}${percent(value)}`;
const frameAmount = (frame: AllocationFrame, key: AllocationKey) => key === 'cash' ? frame.cash : key === 'stock' ? frame.stockValue : frame.bondValue;

function Legend() {
  return <div className="allocation-legend"><span className="allocation-stock">주식 · 청록 단색</span><span className="allocation-bond">채권 · 황토 사선</span><span className="allocation-cash">매매 현금 · 남색 점무늬</span></div>;
}

function AllocationBars({ result, frames, current, showTarget = false }: { result: AllocationResult; frames: AllocationFrame[]; current?: number; showTarget?: boolean }) {
  return <figure className="allocation-bars" aria-label="같은 금액 눈금으로 본 자산 구성 변화">
    <Legend />
    {frames.map(frame => <div key={frame.key} className="allocation-bar-row" data-allocation-frame={frame.key} aria-current={current === frame.index ? 'step' : undefined}>
      <div className="allocation-row-heading"><b>{frame.label}</b><strong>합계 {amount(frame.total)}</strong></div>
      <div className="allocation-track" role="img" aria-label={`${frame.label}: 주식 ${amount(frame.stockValue)}, 채권 ${amount(frame.bondValue)}, 현금 ${amount(frame.cash)}. 전체 ${amount(frame.total)}. 눈금 0부터 ${amount(result.moneyScale)}.`}>
        {frame.segments.map(part => <i key={part.key} data-allocation-segment={part.key} className={`allocation-${part.key}`} style={{ width: `${part.fraction * 100}%` }} />)}
        {showTarget && frame.key !== 'initial' && <span className="allocation-target-marker" style={{ left: `${result.targetMarkerFraction * 100}%` }} aria-hidden="true" />}
      </div>
      <div className="allocation-part-labels">{frame.segments.map(part => <span key={part.key}>{part.label} {amount(part.value)}</span>)}<span>주식 비중 {percent(frame.stockWeight)}</span></div>
    </div>)}
    <div className="allocation-axis" aria-label="금액 눈금">{result.axis.map(tick => <span key={tick.value} style={{ left: `${tick.fraction * 100}%` }}>{amount(tick.value)}</span>)}</div>
    <figcaption>가로 길이는 같은 시점의 평가액과 현금(가상 단위)입니다. 이 조건의 모든 막대는 0–{amount(result.moneyScale)}로 같은 눈금을 씁니다. {showTarget ? `검은 점선은 T1 전체 금액에서 목표 주식 금액 ${amount(result.targetStock)}의 경계입니다. ` : ''}조건을 바꾸면 눈금도 다시 정합니다. 길이가 0인 자산도 아래 숫자로 표시합니다.</figcaption>
  </figure>;
}

export function AllocationDriftPrimer() {
  const result = allocationFrames();
  return <section className="invest-lab allocation-primer" data-static-scene="true" aria-label="수량이 그대로여도 비중이 달라지는 그림">
    <h3>주식 수는 그대로인데, 주식 쪽 띠가 길어집니다</h3>
    <AllocationBars result={result} frames={[result.initial, result.drift]} />
    <div className="allocation-holdings"><div><b>가상 주식 {number(result.initial.stockUnits)}주 그대로</b><span>1주 가격 {amount(result.initial.stockPrice)} → {amount(result.drift.stockPrice)}</span><strong>평가액 {amount(result.initial.stockValue)} → {amount(result.drift.stockValue)}</strong></div><div><b>가상 채권 {number(result.initial.bondUnits)}개 그대로</b><span>1개 가격 {amount(result.initial.bondPrice)} → {amount(result.drift.bondPrice)}</span><strong>평가액 {amount(result.initial.bondValue)} → {amount(result.drift.bondValue)}</strong></div></div>
    <p>새로 산 주식이 없어도 주식 비중은 {percent(result.initial.stockWeight)} → <strong>{percent(result.drift.stockWeight)}</strong>입니다. 비중의 분모도 최초 {amount(result.initial.total)}에서 현재 {amount(result.drift.total)}로 바뀝니다.</p>
    <p className="invest-note">가상 관찰 기간 T0→T1의 가격 변화만 적용했습니다. 배당·이자 지급·입출금은 0입니다. 채권의 가격 변화 0%는 이 사례의 조건이며 모든 채권 가격이 고정된다는 뜻은 아닙니다.</p>
  </section>;
}

function MoneyPath({ result, frame }: { result: AllocationResult; frame: AllocationFrame }) {
  const seller = result.seller ?? 'stock';
  const buyer = result.buyer ?? 'bond';
  return <figure className="allocation-transfer" aria-label="매도 대금이 현금을 거쳐 매수로 이동하는 경로">
    <div className="allocation-path">
      <div className={`allocation-pocket allocation-${seller}`}><span>{names[seller]} 보유 평가액</span><strong>{amount(frameAmount(frame, seller))}</strong><small>매도 쪽</small></div>
      <div className="allocation-arrow" data-active={frame.movement?.to === 'cash'}><span>매도 {amount(result.tradeAmount)}</span><i aria-hidden="true" /></div>
      <div className="allocation-pocket allocation-wallet"><span>중간 현금</span><strong data-testid="allocation-cash">{amount(frame.cash)}</strong><small>총액 안에 포함</small></div>
      <div className="allocation-arrow" data-active={frame.movement?.from === 'cash'}><span>매수 {amount(result.tradeAmount)}</span><i aria-hidden="true" /></div>
      <div className={`allocation-pocket allocation-${buyer}`}><span>{names[buyer]} 보유 평가액</span><strong>{amount(frameAmount(frame, buyer))}</strong><small>매수 쪽</small></div>
    </div>
    <figcaption>{result.tradeAmount === 0 ? '이 조건에서 실행한 대금 이동은 없습니다. 화살표는 가능한 거래 경로만 나타냅니다.' : '강조한 화살표는 현재 단계의 대금 이동입니다. 중간 현금을 평가액 밖의 보너스로 더하지 않습니다.'} 재생은 설명을 위한 순서이며 실제 체결·결제 시간을 재현하지 않습니다.</figcaption>
  </figure>;
}

export function AllocationRebalancingLab() {
  const [input, setInput] = useState<AllocationInput>({ ...allocationDefaults });
  const [prediction, setPrediction] = useState('');
  const result = allocationFrames(input);
  const play = usePlayback(result.frames.length - 1);
  const frame = result.frames[play.step];
  const update = (values: Partial<AllocationInput>) => { setInput(previous => ({ ...previous, ...values })); setPrediction(''); play.rewind(); };
  const reset = () => { setInput({ ...allocationDefaults }); setPrediction(''); play.rewind(); };
  const correct = classifyAllocationPrediction(result.predictionOutcome, prediction);
  return <section className="invest-lab allocation-rebalancing-lab" aria-label="자산배분과 재조정 실험">
    <h3>가격 변화 → 비중 이동 → 매도 → 매수</h3>
    <p>같은 출발 금액 {amount(input.initialAmount)}와 같은 T0→T1 가격 변화를 씁니다. T1에서 그대로 보유한 상태와 원래 비중으로 재조정한 상태를 비교합니다. 재조정 중 가격은 고정하고, 비용·세금·외부 입출금은 0으로 둡니다.</p>
    <Prediction question="매매 전, 주식 비중은 출발 때보다 어떻게 될까요?" value={prediction} onChange={setPrediction} options={[["up", "높아진다"], ["same", "같다"], ["down", "낮아진다"], ["undefined", "총액이 0이라 비교할 비중을 정의할 수 없다"]]} />
    {play.controls}
    <button onClick={() => play.seek(result.frames.length - 1)}>재조정 결과 보기</button>
    <button onClick={reset}>조건까지 초기화</button>
    <h4 className="invest-stage" data-testid="allocation-stage" aria-live="polite">{frame.label}</h4>
    <p className="invest-result" role="status">{play.step > 0 && correct !== null ? `${correct ? '예측과 같습니다.' : '예측과 다릅니다.'} ` : ''}{frame.message}</p>
    <div className="allocation-now" aria-label="현재 단계의 합계와 비중"><span>현재 합계 <strong data-testid="allocation-total">{amount(frame.total)}</strong></span><span>주식 비중 <strong data-testid="allocation-stock-weight">{percent(frame.stockWeight)}</strong></span><span>외부 입출금 <strong>{amount(frame.externalFlow)}</strong></span></div>
    <MoneyPath result={result} frame={frame} />
    <AllocationBars result={result} frames={result.frames} current={play.step} showTarget />
    <div className="allocation-step-buttons" aria-label="정지한 단계 바로 보기">{result.frames.map(row => <button key={row.key} aria-pressed={play.step === row.index} onClick={() => play.seek(row.index)}>{row.label}</button>)}</div>
    <div className="allocation-target"><h4>같은 T1 총액에서 목표 금액을 찾습니다</h4><p>주식 목표: {amount(result.drift.total)} × {percent(input.stockWeight)} = <strong>{amount(result.targetStock)}</strong><br />채권 목표: {amount(result.drift.total)} × {percent(result.targetBondWeight)} = <strong>{amount(result.targetBond)}</strong></p><p data-testid="allocation-trade">{result.tradeLabel}</p><p data-testid="allocation-outcome">{result.targetReached === null ? '총액 0: 목표 비중 도달 여부도 정의하지 않습니다.' : result.targetReached ? '같은 T1에서 목표 비중과 총액을 확인했습니다. 이후 수익의 우열은 계산하지 않았습니다.' : result.status === 'blocked-zero-price' ? '목표 비중에 도달하지 못했습니다. 가격 0인 자산에 양의 평가액을 만들어 넣을 수 없습니다.' : '매매 뒤 목표 금액과 실제 평가액의 차이가 남았습니다. 비중 복귀가 확인되지 않았습니다.'}</p></div>
    <h4>조건 하나를 바꾸고, 방향부터 예측해 보세요</h4>
    <div className="invest-controls"><Range label="출발·목표 주식 비중" value={input.stockWeight * 100} max={100} step={1} unit="%" onChange={value => update({ stockWeight: value / 100 })} /><Range label="주식 가격 변화" value={input.stockReturn * 100} min={-100} max={100} step={5} unit="%" onChange={value => update({ stockReturn: value / 100 })} /><Range label="채권 가격 변화" value={input.bondReturn * 100} min={-100} max={100} step={5} unit="%" onChange={value => update({ bondReturn: value / 100 })} /><Range label="출발 평가액" value={input.initialAmount} max={2000} step={100} unit="단위" onChange={value => update({ initialAmount: value })} /></div>
    <p className="invest-note">주식 목표를 고르면 채권 목표는 나머지 {percent(result.targetBondWeight)}입니다. 출발 비중과 목표를 함께 바꾸어 항상 ‘원래 비중으로 돌아가기’를 비교합니다. 60/40을 포함한 어떤 비중도 개인에게 추천하는 답이 아닙니다.</p>
    <div className="invest-options"><button onClick={() => update({ stockReturn: 0.2, bondReturn: 0.2 })}>같은 비율로 상승</button><button onClick={() => update({ stockReturn: -0.2, bondReturn: 0 })}>주식만 하락</button><button onClick={() => update({ stockReturn: -0.4, bondReturn: -0.1 })}>둘 다 손실</button><button onClick={() => update({ stockReturn: -1, bondReturn: 0 })}>주식 가치 0</button><button onClick={() => update({ initialAmount: 0 })}>전체 자산 0</button></div>
    <p>선택한 관찰 기간의 가격 변화는 주식 {signedPercent(input.stockReturn)}·채권 {signedPercent(input.bondReturn)}입니다. 전체 평가손익은 {amount(result.profit)}, 수익률은 {percent(result.totalReturn)}입니다. 이 손익은 T0→T1 가격 변화에서 생겼고, 그 뒤 매도·매수가 같은 손익을 한 번 더 만들지는 않습니다.</p>
    <StaticTable title="가격 변화와 재조정의 전체 장부"><table><thead><tr><th>단계</th><th>시점</th><th>주식 평가액(단위)</th><th>채권 평가액(단위)</th><th>현금(단위)</th><th>합계(단위)</th><th>주식 비중</th><th>누적 매도대금(단위)</th><th>누적 매수대금(단위)</th><th>외부 흐름(단위)</th></tr></thead><tbody>{result.frames.map(row => <tr key={row.key}><th>{row.label}</th><td>{row.time}</td><td>{number(row.stockValue)}</td><td>{number(row.bondValue)}</td><td>{number(row.cash)}</td><td>{number(row.total)}</td><td>{percent(row.stockWeight)}</td><td>{number(row.sold)}</td><td>{number(row.bought)}</td><td>{number(row.externalFlow)}</td></tr>)}</tbody></table></StaticTable>
    <StaticTable title="같은 가격과 수량으로 평가액 확인"><table><thead><tr><th>단계</th><th>주식 수(주)</th><th>주가(단위/주)</th><th>채권 수(가상 개)</th><th>채권 가격(단위/가상 개)</th><th>T1 목표 주식 금액(단위)</th><th>T1 목표 채권 금액(단위)</th></tr></thead><tbody>{result.frames.map(row => <tr key={row.key}><th>{row.label}</th><td>{number(row.stockUnits)}</td><td>{number(row.stockPrice)}</td><td>{number(row.bondUnits)}</td><td>{number(row.bondPrice)}</td><td>{number(row.targetStock)}</td><td>{number(row.targetBond)}</td></tr>)}</tbody></table></StaticTable>
    <p className="invest-note">모형의 출발 금액은 0 또는 0.01–1,000,000,000단위입니다. 화면에서는 0–2,000단위를 고릅니다. 분수 주·분수 채권 수량 매매와 즉시 현금 사용을 허용한 교육용 모형입니다. 실제 최소 거래 단위·체결 가능 가격·결제 제한을 재현하지 않습니다. 반올림은 화면에만 적용합니다. 모든 단계는 재생 없이 버튼과 표로 확인할 수 있습니다.</p>
  </section>;
}
