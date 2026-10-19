import { useState } from 'react';
import { usePlayback } from '../money/shared';
import { diversificationDefaults, diversificationFrames, classifyDiversificationPrediction, type DiversificationBar, type DiversificationKey, type DiversificationResult } from '../../simulations/investing/diversification.mjs';
import { amount, number, percent, Prediction, Range, StaticTable } from './shared';
import './investing.css';
import './diversification.css';

const signedPercent = (value: number) => `${value > 0 ? '+' : ''}${percent(value)}`;
const points = (value: number) => `${number(value * 100)}%p`;
const names: Record<DiversificationKey, string> = { a: 'A', b: 'B', portfolio: '묶음' };

function ReturnBar({ bar }: { bar: DiversificationBar }) {
  return <div className={`diversification-return-row diversification-${bar.key}`}>
    <b>{names[bar.key]}</b>
    <div className="diversification-return-track" role="img" aria-label={`${names[bar.key]} 수익률 ${signedPercent(bar.value)}. 0을 기준으로 왼쪽은 손실, 오른쪽은 이익.`}>
      <i data-diversification-bar={bar.key} style={{ left: `${bar.startFraction * 100}%`, width: `${bar.widthFraction * 100}%` }} />
      <span className="diversification-marker" style={{ left: `${bar.endFraction * 100}%` }} />
    </div>
    <strong>{signedPercent(bar.value)}</strong>
  </div>;
}

function ScenarioChart({ result, current, select }: { result: DiversificationResult; current: number | null; select: (index: number) => void }) {
  return <figure className="diversification-chart" aria-label="네 가상 시나리오의 A와 B, 묶음 수익률 비교">
    <div className="diversification-legend"><span className="diversification-a">청록 원 · A</span><span className="diversification-b">황토 사각형 · B</span><span className="diversification-portfolio">남색 마름모 · 묶음</span></div>
    <div className="diversification-scenarios">{result.scenarios.map(row => <div className="diversification-scenario" data-scenario={row.index} key={row.index} aria-current={current === row.index ? 'step' : undefined}>
      <button onClick={() => select(row.index + 1)} aria-label={`${row.label} 보기`}>{row.label}</button>
      <span className="diversification-direction">{row.sameDirection ? '같은 방향으로 움직임' : '반대 방향으로 움직임'}</span>
      <div className="diversification-return-axis" aria-label={`수익률 눈금: ${percent(result.axis.minimum)}부터 ${signedPercent(result.axis.maximum)}`}>{result.axis.ticks.map(tick => <span key={tick.value} style={{ left: `${tick.fraction * 100}%` }}>{signedPercent(tick.value)}</span>)}</div>
      {row.bars.map(bar => <ReturnBar key={bar.key} bar={bar} />)}
    </div>)}</div>
    <figcaption>가로축은 각 1년의 수익률(%)입니다. 네 칸 모두 −20%부터 +20%까지 같은 눈금입니다. 선의 길이는 0에서의 거리, 끝의 모양은 보유 대상을 나타냅니다. 0%는 길이가 없는 마름모로 표시합니다. 시나리오 번호는 시간 순서가 아닙니다.</figcaption>
  </figure>;
}

export function DiversificationLab() {
  const [weightA, setWeightA] = useState(diversificationDefaults.weightA);
  const [commonShock, setCommonShock] = useState(diversificationDefaults.commonShock);
  const [prediction, setPrediction] = useState('');
  const result = diversificationFrames({ weightA, commonShock });
  const play = usePlayback(result.frames.length - 1);
  const frame = result.frames[play.step];
  const changeWeight = (value: number) => { setWeightA(value); setPrediction(''); play.rewind(); };
  const changeShock = (value: boolean) => { setCommonShock(value); setPrediction(''); play.rewind(); };
  const reset = () => { setWeightA(diversificationDefaults.weightA); setCommonShock(diversificationDefaults.commonShock); setPrediction(''); play.rewind(); };
  const correct = classifyDiversificationPrediction(result.predictionOutcome, prediction);
  return <section className="invest-lab diversification-lab" aria-label="분산과 공통 충격 실험">
    <h3>같은 1,000을 나누고, 움직임을 겹쳐 봅니다</h3>
    <p>각 시나리오는 최초 {amount(result.input.initialAmount)}를 1년 동안 보유한 별개의 가상 결과입니다. A와 B에 나눌 최초 금액만 바꿉니다. 외부 입출금·세금·비용·기간 중 재조정은 없습니다.</p>
    <figure className="diversification-allocation" aria-label="같은 최초 금액을 A와 B에 나누는 비중">
      <div className="diversification-allocation-labels">{result.allocation.map(part => <span key={part.key} className={`diversification-${part.key}`}><b>{part.label} {percent(part.weight)}</b> · {amount(part.amount)}</span>)}</div>
      <div className="diversification-allocation-strip" role="img" aria-label={`최초 금액 구성: A ${percent(weightA)}, B ${percent(result.weightB)}`}>{result.allocation.map(part => <i key={part.key} className={`diversification-${part.key}`} data-allocation={part.key} style={{ width: `${part.weight * 100}%` }} />)}</div>
      <figcaption>전체 띠가 최초 금액 100%입니다. A는 청록 단색, B는 황토 사선으로 구분합니다. 0%인 부분은 길이가 0입니다.</figcaption>
    </figure>
    <Range label="A에 나누는 최초 금액 비중" value={weightA * 100} max={100} step={1} unit="%" onChange={value => changeWeight(value / 100)} />
    <div className="invest-options"><button aria-pressed={weightA === 1} onClick={() => changeWeight(1)}>A 100%</button><button aria-pressed={weightA === 0.5} onClick={() => changeWeight(0.5)}>반반 보유</button><button aria-pressed={weightA === 0} onClick={() => changeWeight(0)}>B 100%</button></div>
    <label className="diversification-shock"><input type="checkbox" checked={commonShock} onChange={event => changeShock(event.target.checked)} /><span>공통 충격 · B도 A와 똑같이 움직임</span></label>
    <p className="invest-note">{commonShock ? '공통 충격 켜짐: B의 네 결과를 A와 똑같이 바꿉니다. 이름은 둘이어도 이 모형의 위험 노출은 같습니다.' : '기본 조건: A는 +20, +20, −20, −20%, B는 +20, −20, +20, −20%입니다. 둘이 반대로 움직이는 칸이 있습니다.'} 각 시나리오의 비교 비중은 25%로 같습니다. 이 25%는 실제 발생 확률이 아닙니다.</p>
    <Prediction question="선택한 묶음의 네 결과 흩어짐은?" value={prediction} onChange={setPrediction} options={[["less", "A만 보유할 때보다 작다"], ["same", "A만 보유할 때와 같다"]]} />
    {play.controls}
    <button onClick={() => play.seek(result.frames.length - 1)}>전체 결과 보기</button>
    <button onClick={reset}>조건까지 초기화</button>
    <h4 className="invest-stage" data-testid="diversification-stage" aria-live="polite">{frame.label}</h4>
    <p className="invest-result" role="status">{frame.isSummary && correct !== null ? `${correct ? '예측과 같습니다.' : '예측과 다릅니다.'} ` : ''}{frame.message}</p>
    <figure className="diversification-money" aria-label="선택한 시나리오의 두 평가액과 합계">
      <h4>{frame.scenarioIndex === null ? '매번 다시 쓰는 출발 금액' : `시나리오 ${frame.scenarioIndex + 1}의 기말 평가액`}</h4>
      <div className="diversification-money-parts"><span className="diversification-a">A <b>{amount(frame.endingA)}</b></span><span aria-hidden="true">＋</span><span className="diversification-b">B <b>{amount(frame.endingB)}</b></span><span aria-hidden="true">＝</span><strong>{amount(frame.endingTotal)}</strong></div>
      <div className="diversification-money-track" role="img" aria-label={`0부터 ${number(result.moneyScale)}단위까지의 눈금. A ${amount(frame.endingA)}와 B ${amount(frame.endingB)}의 합 ${amount(frame.endingTotal)}`}>{frame.amountSegments.map(part => <i key={part.key} className={`diversification-${part.key}`} data-amount-segment={part.key} style={{ width: `${part.fraction * 100}%` }} />)}</div>
      <div className="diversification-money-axis"><span>0단위</span><span>{amount(result.moneyScale)}</span></div>
      <figcaption>{frame.scenarioIndex === null ? '시나리오끼리 금액을 더하지 않습니다. 네 번 모두 이 출발 금액에서 비교합니다.' : `최초 ${amount(result.input.initialAmount)} 대비 수익률은 ${percent(frame.portfolioReturn)}입니다. 기말 평가액은 아직 매도해 받은 현금이 아닙니다.`} 모든 단계의 금액 막대는 같은 눈금입니다.</figcaption>
    </figure>
    <ScenarioChart result={result} current={frame.scenarioIndex} select={play.seek} />
    <div className="diversification-statistics" aria-label="네 가상 결과의 평균과 기술적 흩어짐">
      <h4>평균은 같아도 가운데 모이는 정도는 다릅니다</h4>
      <p>네 사례 평균: <strong data-testid="diversification-mean">{percent(result.statistics.portfolio.mean)}</strong> · 묶음의 흩어짐: <strong data-testid="diversification-spread">{points(result.statistics.portfolio.spread)}</strong></p>
      <div className="diversification-spread-bars">{result.spreadBars.map(bar => <div key={bar.key} className={`diversification-spread-row diversification-${bar.key}`}><b>{names[bar.key]}</b><div className="diversification-spread-track" role="img" aria-label={`${names[bar.key]} 흩어짐 ${points(bar.value)}. 눈금 0부터 20%p.`}><i data-spread-bar={bar.key} style={{ width: `${bar.fraction * 100}%` }} /></div><strong>{points(bar.value)}</strong></div>)}</div>
      <p className="invest-scale">흩어짐 막대 눈금: 0–20%p. 같은 네 사례 전체를 요약한 모집단 표준편차입니다. 각 결과에서 평균을 빼고 제곱한 뒤, 각각 25%씩 곱해 더하고 제곱근을 취합니다. 표본 추정에 쓰는 3으로 나누지 않습니다.</p>
      <p>이 네 사례에서 묶음의 최저 결과는 {signedPercent(result.statistics.portfolio.minimum)}입니다. 흩어짐이 작아져도 이 손실은 남습니다. 실제로 가능한 최악의 결과가 −20%라는 뜻도 아닙니다.</p>
    </div>
    <p className="invest-note">재생은 네 결과를 하나씩 살펴보는 관찰 순서입니다. 4년 수익률을 누적하거나 시장의 변화를 예측하지 않습니다. 아래 표와 시나리오 버튼으로 움직임 없이도 모든 결과를 확인할 수 있습니다.</p>
    <StaticTable title="네 시나리오의 가중 합계"><table><thead><tr><th>같은 1년의 대안</th><th>A 수익률</th><th>B 수익률</th><th>A 기여(%p)</th><th>B 기여(%p)</th><th>묶음 수익률</th><th>기말 평가액(단위)</th><th>사례 비교 비중</th></tr></thead><tbody>{result.scenarios.map(row => <tr key={row.index}><th>{row.label}</th><td>{percent(row.aReturn)}</td><td>{percent(row.bReturn)}</td><td>{number(row.contributionA * 100)}</td><td>{number(row.contributionB * 100)}</td><td>{percent(row.portfolioReturn)}</td><td>{number(row.endingTotal)}</td><td>{percent(row.comparisonWeight)}</td></tr>)}</tbody></table></StaticTable>
    <StaticTable title="평균과 흩어짐의 전체 비교"><table><thead><tr><th>보유 대상</th><th>사례 평균 수익률</th><th>흩어짐(%p)</th><th>최저 사례 수익률</th><th>최고 사례 수익률</th></tr></thead><tbody>{result.spreadBars.map(bar => <tr key={bar.key}><th>{names[bar.key]}</th><td>{percent(result.statistics[bar.key].mean)}</td><td>{number(bar.value * 100)}</td><td>{percent(result.statistics[bar.key].minimum)}</td><td>{percent(result.statistics[bar.key].maximum)}</td></tr>)}</tbody></table></StaticTable>
  </section>;
}
