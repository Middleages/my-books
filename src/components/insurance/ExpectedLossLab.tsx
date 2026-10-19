import { useState } from 'react';
import { usePlayback } from '../money/shared';
import { expectedLossDefaults, projectExpectedLoss, type ExpectedLossParams, type ExpectedLossScenario, type ExpectedLossFrame } from '../../simulations/insurance/probability.mjs';
import { InsurancePrediction, InsuranceRange, InsuranceTable, won, percent, number } from './shared';
import './insurance.css';
import './expected-loss.css';

const names = { frequent: 'A', severe: 'B' };

function ProbabilityScene({ scenario }: { scenario: ExpectedLossScenario }) {
  return <div className="insurance-probability-case" data-probability-case={scenario.id}>
    <div className="insurance-case-heading"><b>{names[scenario.id]}</b><span>사건 발생 <strong>{percent(scenario.probability)}</strong></span></div>
    <div className="insurance-dot-grid" role="img" aria-label={`${names[scenario.id]}의 발생 확률 ${percent(scenario.probability)}. 점 100개가 확률 100%이며 실제 결과 100회를 뜻하지 않습니다.`}>{scenario.dots.map(dot => <span key={dot.id} data-probability-fill={dot.fraction}><i style={{ width: `${dot.fraction * 100}%` }} /></span>)}</div>
    <p className="insurance-probability-caption">채운 점 · 사건 있음<br/>빈 점 · 사건 없음</p>
    <div className="insurance-expectation"><span>기대손실</span><strong data-expected-loss={scenario.id}>{won(scenario.expectedLoss)}</strong><small>{percent(scenario.probability)} × {won(scenario.loss)}</small></div>
  </div>;
}

function LossBar({ scenario, scale }: { scenario: ExpectedLossScenario; scale: number }) {
  return <div className="insurance-possible-row" data-possible-case={scenario.id}>
    <div className="insurance-bar-heading"><strong>{names[scenario.id]} · 사건이 생기면 {won(scenario.loss)} 손실</strong><span>준비 현금 {won(scenario.cash)}</span></div>
    <div className="insurance-money-track insurance-bar-track" role="img" aria-label={`${names[scenario.id]} 한 번의 손실 ${won(scenario.loss)}, 현금 경계 ${won(scenario.cash)}. 공통 눈금 0부터 ${won(scale)}.`}>
      <i className="loss" data-insurance-bar={`${scenario.id}-possible-loss`} style={{ width: `${scenario.fractions.loss * 100}%`, left: 0 }} />
      <span className="insurance-cash-boundary" data-cash-boundary={scenario.id} style={{ left: `${scenario.fractions.cash * 100}%` }} />
    </div>
    <div className="insurance-axis"><span>0원</span><span>{won(scale)}</span></div>
    {scenario.probability === 0 && <p className="insurance-note">발생 확률 0%: 이 조건에서는 사건이 생기지 않습니다. 막대는 설정한 조건부 손실액입니다.</p>}
  </div>;
}

function Observation({ scenario, scale }: { scenario: ExpectedLossFrame['scenarios'][number]; scale: number }) {
  const observation = scenario.observation;
  return <div className={`insurance-observation ${observation && !observation.possible ? 'impossible' : ''}`} data-observation-case={scenario.id}>
    <h4>{names[scenario.id]} · {observation ? observation.eventOccurred ? '사건 발생 대안' : '사건 없는 대안' : '결과가 정해지기 전'}</h4>
    {observation && !observation.possible ? <p className="insurance-impossible">현재 확률에서 불가능한 대안입니다. 아래는 조건부 계산이며 실제 관측 결과가 아닙니다.</p> : null}
    <div className="insurance-bar-heading"><span>{observation ? '이 대안의 손실' : '실제 손실'}</span><strong data-observed-loss={scenario.id}>{observation ? won(observation.loss) : '아직 미확정'}</strong></div>
    <div className="insurance-money-track insurance-bar-track" role="img" aria-label={observation ? `${names[scenario.id]} 손실 ${won(observation.loss)} 중 현금으로 ${won(observation.cashUsed)}, 부족 ${won(observation.shortfall)}. 눈금 0부터 ${won(scale)}.` : `${names[scenario.id]} 결과 확정 전. 아직 현금을 사용하지 않았습니다.`}>
      <i data-insurance-bar={`${scenario.id}-cash-used`} style={{ left: 0, width: `${(observation?.fractions.cashUsed ?? 0) * 100}%` }} />
      <i className="unfunded" data-insurance-bar={`${scenario.id}-shortfall`} style={{ left: `${(observation?.fractions.cashUsed ?? 0) * 100}%`, width: `${(observation?.fractions.shortfall ?? 0) * 100}%` }} />
    </div>
    <div className="insurance-axis"><span>0원</span><span>{won(scale)}</span></div>
    <dl className="insurance-outcome-list"><div><dt>현금으로 충당</dt><dd data-cash-used={scenario.id}>{won(observation?.cashUsed ?? 0)}</dd></div><div><dt>아직 부족</dt><dd data-shortfall={scenario.id}>{observation ? won(observation.shortfall) : '아직 미확정'}</dd></div><div><dt>남은 현금</dt><dd data-cash-remaining={scenario.id}>{won(observation?.cashRemaining ?? scenario.cash)}</dd></div></dl>
  </div>;
}

export function ExpectedLossLab() {
  const [params, setParams] = useState<ExpectedLossParams>({ ...expectedLossDefaults });
  const [prediction, setPrediction] = useState('');
  const result = projectExpectedLoss(params);
  const play = usePlayback(result.frames.length - 1);
  const frame = result.frames[play.step];
  const change = (values: Partial<ExpectedLossParams>) => { setParams(current => ({ ...current, ...values })); setPrediction(''); play.rewind(); };
  const reset = () => { setParams({ ...expectedLossDefaults }); setPrediction(''); play.rewind(); };
  const showResult = frame.phase === 'present';
  return <section className="insurance-lab expected-loss-lab" data-insurance-lab="expected-loss" aria-label="같은 기대손실과 한 번의 충격 실험">
    <h3>점은 가능성, 긴 막대는 한 번의 충격</h3>
    <p>같은 가상 1년, 사건은 최대 한 번입니다. 두 사례의 기대손실과 실제 가능한 손실을 구분해 보세요.</p>
    <figure aria-label="두 위험의 확률과 기대손실 비교">
      <div className="insurance-probability-comparison">{result.scenarios.map(scenario => <ProbabilityScene key={scenario.id} scenario={scenario} />)}</div>
      <p className="insurance-average-comparison" data-expected-equality={result.expectedLossEqual}>{result.expectedLossEqual ? '같은 기대손실' : '서로 다른 기대손실'} · 평균이 한 번의 손실을 대신하지 않습니다.</p>
      <figcaption>두 그림 모두 점 하나가 확률 1%입니다. 점을 채운 비율이 발생 가능성입니다. 앞으로 100번 중 정확히 그 횟수만 발생한다는 뜻은 아닙니다.</figcaption>
    </figure>
    <figure className="insurance-loss-comparison" aria-label="한 번의 손실과 준비 현금의 공통 눈금 비교">
      <div className="insurance-legend"><span className="loss">붉은 막대 · 한 번의 손실</span><span className="boundary">초록 점선 · 준비 현금 경계</span></div>
      {result.scenarios.map(scenario => <LossBar key={scenario.id} scenario={scenario} scale={result.moneyScale} />)}
      <figcaption>가로 길이는 금액입니다. A와 B는 0–{won(result.moneyScale)}의 같은 눈금입니다. 손실·현금의 최댓값이 바뀌면 두 눈금이 함께 바뀝니다. 점선 오른쪽의 손실은 준비 현금만으로 낼 수 없습니다.</figcaption>
    </figure>
    <InsuranceRange label="준비한 현금" value={params.cash / 10000} max={2500} step={50} unit="만원" onChange={value => change({ cash: value * 10000 })} />
    <details><summary>B의 발생 확률과 손실액도 바꿔 보기</summary><div className="insurance-controls"><InsuranceRange label="B 발생 확률" value={params.severeProbability * 100} max={100} step={1} unit="%" onChange={value => change({ severeProbability: value / 100 })} /><InsuranceRange label="B 사건 발생 시 손실" value={params.severeLoss / 10000} max={2500} step={50} unit="만원" onChange={value => change({ severeLoss: value * 10000 })} /></div><p className="insurance-note">A는 20%·100만원으로 고정합니다. 실제 확률·보험료를 추정하는 입력이 아닙니다.</p></details>
    <InsurancePrediction question="각 사건이 생겼다고 가정하면 어느 쪽 부족액이 더 클까요?" value={prediction} onChange={setPrediction} options={[["frequent", "A의 부족액이 더 크다"], ["severe", "B의 부족액이 더 크다"], ["same", "부족액이 같다"]]} />
    {play.controls}
    <div className="insurance-step-buttons"><button onClick={() => play.seek(1)}>사건 없음 보기</button><button onClick={() => play.seek(2)}>사건 발생 보기</button><button onClick={reset}>조건까지 초기화</button></div>
    <div className="insurance-stage" data-insurance-stage={frame.phase} aria-live="polite"><strong>{frame.label}</strong><p>{frame.phase === 'distribution' ? '초기 상태: 현금은 아직 그대로이고, 실제 손실은 정해지지 않았습니다.' : frame.phase === 'absent' ? '사건이 없는 별개의 대안: 손실이 0원이므로 현금을 사용하지 않습니다.' : '마지막 관찰: 각 사건이 생긴 대안의 손실을 현금과 부족액으로 나눕니다. 앞 단계의 손실을 더하지 않습니다.'}</p></div>
    <figure aria-label="선택한 대안의 손실 충당과 부족액">
      <div className="insurance-legend"><span>초록 · 현금으로 충당</span><span className="unfunded">붉은 사선 · 아직 부족</span></div>
      <div className="insurance-observations">{frame.scenarios.map(scenario => <Observation key={scenario.id} scenario={scenario} scale={result.moneyScale} />)}</div>
      <figcaption>금액 눈금은 위 손실 막대와 같습니다. 현금으로 충당한 돈과 부족액의 합이 이 대안의 손실입니다. 현금은 쓰인 만큼만 줄며 부족액이 자동으로 대출이나 보험금이 되지 않습니다.</figcaption>
    </figure>
    <p className="insurance-result" role="status">{showResult ? `${prediction ? prediction === result.shortfallComparison ? '예측과 같습니다. ' : '예측과 다릅니다. ' : ''}${result.shortfallComparison === 'same' ? '두 대안의 부족액은 같습니다.' : `${names[result.shortfallComparison]}의 부족액이 더 큽니다.`} 기대손실만 보지 말고 사건이 생겼을 때의 손실과 현금을 함께 보세요.` : '두 가능성은 시간 순서가 아닙니다. 결과를 선택해도 발생 확률이나 기대손실을 새로 계산한 관측 자료로 만들지 않습니다.'}</p>
    <p className="insurance-note">재생은 관찰 순서만 바꿉니다. ‘처음부터’는 조건을 유지하고 초기 상태로 돌아갑니다. 정적 표에는 같은 모델의 전체 대안이 있어 자동 재생 없이 비교할 수 있습니다.</p>
    <InsuranceTable title="전체 관찰 단계와 금액"><table><caption>모든 금액은 만원. 단계는 서로 다른 대안이며 합산하지 않습니다.</caption><thead><tr><th>관찰 단계</th><th>사례</th><th>가능한 대안?</th><th>기대손실</th><th>이 대안의 손실</th><th>현금 충당</th><th>부족액</th><th>남은 현금</th></tr></thead><tbody>{result.frames.flatMap(item => item.scenarios.map(scenario => <tr key={`${item.phase}-${scenario.id}`} data-static-probability={`${item.phase}-${scenario.id}`}><th>{item.label}</th><td>{names[scenario.id]}</td><td>{scenario.observation ? scenario.observation.possible ? '가능' : '현재 확률에서 불가능' : '결과 확정 전'}</td><td>{number(scenario.expectedLoss / 10000)}</td><td>{scenario.observation ? number(scenario.observation.loss / 10000) : '미확정'}</td><td>{number((scenario.observation?.cashUsed ?? 0) / 10000)}</td><td>{scenario.observation ? number(scenario.observation.shortfall / 10000) : '미확정'}</td><td>{number((scenario.observation?.cashRemaining ?? scenario.cash) / 10000)}</td></tr>))}</tbody></table></InsuranceTable>
  </section>;
}
