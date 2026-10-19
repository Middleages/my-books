import { useState } from 'react';
import { usePlayback } from '../money/shared';
import { performanceHistoryFrames, recoveryCompoundingFrames, historyReviewFrames, classifyPerformancePrediction, type PathScenario, type ReviewMode, type PathPlot, type PerformanceHistoryResult } from '../../simulations/investing/performance-history.mjs';
import { amount, number, percent, Prediction, Range, StaticTable } from './shared';
import './investing.css';
import './performance-history.css';

const predictionText = (correct: boolean | null) => correct === null ? '예측과 비교하려면 위에서 답을 골라 보세요. ' : correct ? '예측과 같습니다. ' : '예측과 다릅니다. ';

function PathPanel({ path, overview, result }: { path: PathPlot; overview: PathPlot; result: PerformanceHistoryResult }) {
  return <div className={`ph-path-panel ph-${path.id}`} data-path={path.id}>
    <h4>{path.label} · 현재 {amount(path.current.value)}</h4>
    <div className="ph-path-chart" role="img" aria-label={`${path.label}, T${path.current.index}까지 정점 ${amount(path.current.peak)}, 현재 ${amount(path.current.value)}, 현재 낙폭 ${percent(path.current.drawdown)}`}>
      <div className="ph-plot">
        {result.scale.ticks.map(tick => <div className="ph-gridline" key={tick.value} style={{ top: `${tick.y * 100}%` }}><span>{number(tick.value)}</span></div>)}
        <svg data-path-svg={path.id} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline className="ph-overview-line" points={overview.polyline} />
          <line className="ph-peak-line" x1="0" x2="100" y1={path.peakY * 100} y2={path.peakY * 100} />
          <polyline className="ph-observed-line" points={path.polyline} />
        </svg>
        <i className="ph-gap" data-testid={`performance-gap-${path.id}`} style={{ left: `${path.current.x * 100}%`, top: `${path.peakY * 100}%`, height: `${path.gapHeight * 100}%` }} />
        {path.points.map(point => <i className="ph-point" data-point={point.index} key={point.index} style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }} />)}
        {result.ticks.map(tick => <span className={`ph-time-tick ${tick.x === 0 ? 'first' : tick.x === 1 ? 'last' : ''}`} key={tick.label} style={{ left: `${tick.x * 100}%` }}>{tick.label}</span>)}
      </div>
    </div>
    <div className="ph-path-metrics"><span>그때까지 정점 <b>{amount(path.current.peak)}</b></span><span>현재 낙폭 <b>{percent(path.current.drawdown)}</b></span><span>관찰된 최대낙폭 <b data-testid={`performance-path-${path.id}-drawdown`}>{percent(path.current.maxDrawdown)}</b></span><span>출발 대비 변화율 <b data-testid={`performance-path-${path.id}-return`}>{percent(path.totalReturn)}</b></span></div>
  </div>;
}

export function PerformancePathLab() {
  const [scenario, setScenario] = useState<PathScenario>('paths');
  const [prediction, setPrediction] = useState('');
  const result = performanceHistoryFrames({ scenario });
  const play = usePlayback(result.frames.length - 1);
  const frame = result.frames[play.step];
  const change = (value: PathScenario) => { setScenario(value); setPrediction(''); play.rewind(); };
  const correct = classifyPerformancePrediction(result.predictionOutcome, prediction);
  return <section className="invest-lab ph-lab" data-testid="performance-path-lab" aria-label="과거 성과와 낙폭 실험">
    <h3>같은 100으로 돌아와도 내려온 깊이는 다릅니다</h3>
    <p>두 경로의 기간과 출발 금액을 맞춥니다. T0·T1·T2·T3는 같은 간격의 관찰 시점이며, 구체적인 연·월 수익률은 아닙니다. 외부 입출금·지급 현금·비용·세금은 모두 0입니다.</p>
    <div className="invest-options"><button aria-pressed={scenario === 'paths'} onClick={() => change('paths')}>같은 종점 · 다른 경로</button><button aria-pressed={scenario === 'zero'} onClick={() => change('zero')}>전체 평가액 0</button><button aria-pressed={scenario === 'single'} onClick={() => change('single')}>관찰값 1개</button></div>
    <Prediction question="관찰한 두 경로의 최대낙폭을 비교하면?" value={prediction} onChange={setPrediction} options={[["a-deeper", "A가 더 깊다"], ["same", "같다"], ["undefined", "분모가 없어 정의 불가"]]} />
    {play.controls}
    <button onClick={() => play.seek(result.frames.length - 1)}>전체 비교 바로 보기</button><button onClick={() => change('paths')}>조건까지 초기화</button>
    <h4 className="invest-stage" data-testid="performance-path-stage" aria-live="polite">{frame.label}</h4>
    <figure aria-label="같은 눈금의 두 평가액 경로와 과거 정점까지의 낙폭">
      <div className="ph-path-panels">{frame.paths.map((path, index) => <PathPanel key={path.id} path={path} overview={result.summary.paths[index]} result={result} />)}</div>
      <figcaption>세로축은 평가액(단위), 가로축은 같은 관찰 시점입니다. 두 그림 모두 0–{amount(result.scale.maximum)}의 고정 눈금입니다. 옅은 선은 전체 과거 기록, 짙은 선과 점은 현재까지 관찰한 부분입니다. A는 청록 원, B는 황토 사각형입니다. 가로 점선은 그때까지 정점, 붉은 세로 띠는 그 정점과 현재 금액의 차이입니다. 미래의 더 높은 점을 현재 낙폭의 분모에 넣지 않습니다.</figcaption>
    </figure>
    <p className="invest-result" role="status">{frame.isSummary ? predictionText(correct) : ''}{frame.message}</p>
    <StaticTable title="두 경로의 관찰값·과거 정점·낙폭"><table><thead><tr><th>경로</th><th>시점</th><th>평가액(단위)</th><th>그때까지 정점(단위)</th><th>직전 대비 수익률</th><th>현재 낙폭</th><th>그때까지 최대낙폭</th></tr></thead><tbody>{result.paths.flatMap(path => path.points.map(point => <tr key={`${path.id}-${point.index}`}><th>{path.label}</th><td>{point.label}</td><td>{number(point.value)}</td><td>{number(point.peak)}</td><td>{point.index === 0 ? '앞 구간 없음' : percent(point.periodReturn)}</td><td>{percent(point.drawdown)}</td><td>{percent(point.maxDrawdown)}</td></tr>))}</tbody></table></StaticTable>
    <p className="invest-note">관찰 사이에 더 큰 하락이 있었다면 이 표는 놓칠 수 있습니다. 여기서 구한 최대낙폭은 주어진 관찰 시점에서 계산한 낙폭의 최대값이며 실제 미래 손실 한도가 아닙니다. ‘관찰값 1개’의 0은 아직 하락을 관찰하지 않았다는 뜻입니다. 값이 0이 된 뒤 외부 입금 없이 백분율 변화만으로 양수가 되는 경로는 이 모형에서 지원하지 않습니다.</p>
  </section>;
}

export function RecoveryCompoundingLab() {
  const [lossRate, setLossRate] = useState(.5);
  const [prediction, setPrediction] = useState('');
  const result = recoveryCompoundingFrames({ lossRate });
  const play = usePlayback(result.frames.length - 1);
  const frame = result.frames[play.step];
  const change = (value: number) => { setLossRate(value); setPrediction(''); play.rewind(); };
  const correct = classifyPerformancePrediction(result.predictionOutcome, prediction);
  return <section className="invest-lab ph-lab" data-testid="performance-recovery-lab" aria-label="손실 회복과 누적 수익 실험">
    <h3>같은 50단위라도 나누는 금액이 바뀝니다</h3>
    <p>위쪽에서는 100단위의 손실률만 바꿉니다. 아래쪽 +50%/−50%는 고정된 별도 두 구간 사례입니다. 새 입출금·비용·세금·지급 현금은 없습니다.</p>
    <Range label="손실률" value={lossRate * 100} max={100} step={5} unit="%" onChange={value => change(value / 100)} />
    <Prediction question="원래 100으로 돌아갈 때 필요한 상승률은 손실률의 크기와 비교해?" value={prediction} onChange={setPrediction} options={[["greater", "더 크다"], ["same", "같다 · 손실 0일 때"], ["undefined", "남은 금액 0이라 정의 불가"]]} />
    {play.controls}
    <button onClick={() => play.seek(result.frames.length - 1)}>회복·누적 결과 바로 보기</button><button onClick={() => change(.5)}>조건까지 초기화</button>
    <h4 className="invest-stage" data-testid="performance-recovery-stage" aria-live="polite">{frame.label}</h4>
    <figure className="ph-recovery-figure" aria-label="손실 뒤 남은 금액과 원상복귀에 필요한 부족분">
      <h4>위쪽 사례 · 100단위가 기준선입니다</h4>
      <div className="ph-bar-label"><span>출발</span><strong>{amount(result.initialAmount)}</strong></div><div className="ph-amount-track"><i className="ph-original" style={{ width: '100%' }} /></div>
      <div className="ph-bar-label"><span>손실 뒤 남음 + 원래 금액까지 부족</span><strong>{amount(result.remainingAmount)} + {amount(result.requiredGain)}</strong></div>
      <div className="ph-amount-track ph-recovery-split" role="img" aria-label={`남은 금액 ${amount(result.remainingAmount)}, 부족한 금액 ${amount(result.requiredGain)}`}><i className="ph-remaining" data-testid="performance-remaining-bar" style={{ width: `${result.remainingFraction * 100}%` }} /><i className="ph-missing" data-testid="performance-missing-bar" style={{ width: `${result.requiredFraction * 100}%` }} /></div>
      <div className="ph-bar-label"><span>현재 단계 {frame.recoveryIsAssumed ? '· 필요한 회복을 가정' : ''}</span><strong data-testid="performance-recovery-amount">{amount(frame.recoveryAmount)}</strong></div><div className="ph-amount-track" data-testid="performance-recovery-track"><i className="ph-current" data-testid="performance-recovery-bar" style={{ width: `${frame.recoveryFraction * 100}%` }} /></div>
      <div className="ph-fraction"><span><b>{amount(result.requiredGain)} 부족</b><span>{amount(result.remainingAmount)} 남음</span></span><strong>＝ 필요한 상승률 <span data-testid="performance-recovery-rate">{percent(result.recoveryRate)}</span></strong></div>
      <figcaption>막대의 공통 눈금은 0–100단위입니다. 청록 단색은 남은 금액, 붉은 사선은 원래 100까지 부족한 금액입니다. 부족분은 이미 가진 돈이 아닙니다. 필요 상승률은 부족분을 손실 뒤 남은 금액으로 나눕니다. 가정한 회복은 조건을 설명할 뿐 실제 발생이나 걸리는 시간을 예측하지 않습니다.</figcaption>
    </figure>
    <figure className="ph-compounding-figure" aria-label="별도 고정 사례의 100에서 150을 거쳐 75가 되는 복리 경로">
      <h4>아래쪽 별도 사례 · +50%와 −50%를 순서대로 적용합니다</h4>
      {result.compounding.bars.map(bar => <div className="ph-compound-row" key={bar.index} aria-current={bar.index === frame.compoundIndex ? 'step' : undefined}><div className="ph-bar-label"><span>{bar.label}</span><strong>{amount(bar.value)}</strong></div><div className="ph-amount-track" data-compound-track={bar.index}><i data-compound-bar={bar.index} className="ph-compound" style={{ width: `${bar.fraction * 100}%` }} /></div></div>)}
      <div className="ph-summary-metrics"><span>두 구간 산술평균 <b data-testid="performance-average-return">{percent(result.compounding.arithmeticMean)}</b></span><span>두 구간 누적 수익률 <b data-testid="performance-cumulative-return">{percent(result.compounding.cumulativeReturn)}</b></span></div>
      <figcaption>이 세 막대의 공통 눈금은 0–150단위이며 위쪽과 다릅니다. 두 번째 −50%는 처음 100이 아니라 그때 가진 150에 적용되어 75단위를 잃습니다. 진한 테두리는 관찰 단계이며, 세 금액은 동시에 가진 자산이 아니므로 합산하지 않습니다.</figcaption>
    </figure>
    <p className="invest-result" role="status">{frame.isSummary ? predictionText(correct) : ''}{frame.message}</p>
    <StaticTable title="손실·회복 가정과 별도 복리 사례의 단계"><table><thead><tr><th>단계</th><th>위쪽 평가액(단위)</th><th>회복을 가정했나</th><th>아래쪽 별도 평가액(단위)</th></tr></thead><tbody>{result.frames.map(row => <tr key={row.index}><th>{row.label}</th><td>{number(row.recoveryAmount)}</td><td>{row.recoveryIsAssumed ? '예 · 실제 예측 아님' : '아니요'}</td><td>{number(row.compoundAmount)}</td></tr>)}</tbody></table></StaticTable>
  </section>;
}

export function HistoryReviewLab() {
  const [reviewMode, setReviewMode] = useState<ReviewMode>('held');
  const [prediction, setPrediction] = useState('');
  const result = historyReviewFrames({ reviewMode });
  const play = usePlayback(result.frames.length - 1);
  const frame = result.frames[play.step];
  const change = (value: ReviewMode) => { setReviewMode(value); setPrediction(''); play.rewind(); };
  const correct = classifyPerformancePrediction(result.predictionOutcome, prediction);
  const selected = result.rules.find(rule => rule.id === frame.selectedId);
  return <section className="invest-lab ph-lab" data-testid="performance-review-lab" aria-label="과거 선택과 이후 검토 실험">
    <h3>자료를 본 시점을 선택 기록과 함께 읽습니다</h3>
    <p>규칙 세 개와 두 관찰 창은 미리 정해 둔 가상 사례입니다. 각 창은 같은 비교 출발값 100으로 따로 시작하며, 앞 창의 마지막 돈이 뒤 창으로 이어지는 계좌 경로가 아닙니다.</p>
    <div className="invest-options"><button aria-pressed={reviewMode === 'held'} onClick={() => change('held')}>선택 고정</button><button aria-pressed={reviewMode === 'future-leak'} onClick={() => change('future-leak')}>미래 자료 미리 보기</button><button aria-pressed={reviewMode === 'reselection'} onClick={() => change('reselection')}>이후 보고 재선택</button></div>
    <Prediction question="선택 이후 자료를 그 선택과 독립적으로 검토할 수 있나요?" value={prediction} onChange={setPrediction} options={[["separate", "선택에 쓰지 않은 구간이다"], ["contaminated", "선택에 이미 써서 독립 검토가 아니다"]]} />
    {play.controls}
    <button onClick={() => play.seek(result.frames.length - 1)}>검토 결과 바로 보기</button><button onClick={() => change('held')}>조건까지 초기화</button>
    <h4 className="invest-stage" data-testid="performance-review-stage" aria-live="polite">{frame.label}</h4>
    <figure className="ph-review-figure" aria-label="과거 선택 구간과 이후 검토 구간을 가르는 시간 경계">
      <div className="ph-time-windows"><div className="ph-window-training"><b>과거 선택 구간</b><span>{result.trainingWindow.join(' → ')}</span><small>비교 출발값 100</small></div><div className="ph-selection-gate"><b>{result.selectionTime} 선택 기록</b><span data-testid="performance-review-selected">{selected ? selected.label : '아직 선택 전'}</span></div><div className="ph-window-review"><b>이후 검토 구간</b><span>{result.reviewWindow.join(' → ')}</span><small>별도 비교 출발값 100</small></div></div>
      {frame.futureLeak && frame.reviewVisible ? <p className="ph-contamination">↶ 미래 자료 누출: 이후 결과를 S2의 선택에 미리 사용</p> : frame.reselected && frame.reviewVisible ? <p className="ph-contamination">↶ 사후 재선택: 이후 결과를 보고 원래 A를 B로 변경</p> : <p className="ph-separation">선택 경계: 원래 기록 A는 과거 S0–S2만 사용</p>}
      <div className="ph-rule-comparisons">{result.rules.map(rule => <div className="ph-rule-row" data-rule={rule.id} key={rule.id} aria-current={frame.selectedId === rule.id ? 'true' : undefined}>
        <h4>{rule.label} · {rule.description}</h4>
        <div className="ph-window-bars">{(['training', 'review'] as const).map(window => {
          const visible = window === 'training' ? frame.trainingVisible : frame.reviewVisible;
          return <div className={`ph-window-result ${window}`} data-window={window} key={window}><span>{window === 'training' ? '과거 S0–S2' : '이후 S2–S4'}</span><div className="ph-amount-track" data-review-track={`${rule.id}-${window}`} role="img" aria-label={visible ? `${rule.label} ${window === 'training' ? '과거' : '이후'} 비교 기말값 ${number(rule[window].finalAmount)}` : '이 단계에서는 아직 결과를 열지 않음'}>{visible ? <i data-review-bar={`${rule.id}-${window}`} style={{ width: `${rule[window].endFraction * 100}%` }} /> : <span className="ph-hidden-window">아직 열지 않은 구간</span>}</div><strong>{visible ? `${number(rule[window].finalAmount)} · ${percent(rule[window].totalReturn)}` : '선택에 사용할 자료 범위 확인'}</strong></div>;
        })}</div>
      </div>)}</div>
      <figcaption>막대는 창마다 100에서 출발한 비교 기말값이며, 모두 0–{number(result.scale)}의 같은 눈금입니다. 과거는 청록 단색, 이후는 황토 사선입니다. 열지 않은 칸은 0 수익률이 아니라 아직 관찰하지 않은 자료입니다. C는 매 구간 시작에 X/Y 비중을 50/50으로 되돌립니다. 분수 수량·즉시 재조정·거래비용 0을 가정하므로 처음 반반 매수한 뒤 그대로 두는 경로와 다릅니다.</figcaption>
    </figure>
    <p className="ph-review-status" data-testid="performance-review-status">{result.status}</p>
    <p className="invest-result" role="status">{frame.isSummary ? predictionText(correct) : ''}{frame.message}</p>
    <StaticTable title="고정된 세 규칙의 과거·이후 구간 전체 기록"><table><thead><tr><th>규칙</th><th>창</th><th>비교 출발값</th><th>첫 구간 수익률</th><th>둘째 구간 수익률</th><th>비교 기말값</th><th>창 누적 수익률</th></tr></thead><tbody>{result.rules.flatMap(rule => (['training', 'review'] as const).map(window => <tr key={`${rule.id}-${window}`}><th>{rule.label}</th><td>{window === 'training' ? '과거 S0–S2' : '이후 S2–S4'}</td><td>{number(rule[window].initialAmount)}</td><td>{percent(rule[window].returns[0])}</td><td>{percent(rule[window].returns[1])}</td><td>{number(rule[window].finalAmount)}</td><td>{percent(rule[window].totalReturn)}</td></tr>))}</tbody></table></StaticTable>
    <p className="invest-note">표는 읽기용 전체 정답을 제공합니다. 독자가 표를 열었다고 원래 S2 선택 기록이 바뀌지는 않습니다. 모형의 ‘미래 자료 누출’과 ‘사후 재선택’은 위의 명시적 실패 사례 버튼으로만 바뀝니다. 이 실험은 실제 백테스트 엔진·최적 규칙 탐색·상품 추천·미래 확률 추정이 아닙니다. 모든 숫자는 자체 가상 자료입니다.</p>
  </section>;
}
