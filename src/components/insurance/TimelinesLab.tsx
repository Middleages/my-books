import { useState } from 'react';
import { usePlayback } from '../money/shared';
import { projectTimelines, timelinesDefaults, type TimelinesOptions, type TimelinesResult, type TimelineContract, type TimelineFrame } from '../../simulations/insurance/timelines.mjs';
import { InsurancePrediction, InsuranceRange, InsuranceTable, won } from './shared';
import './insurance.css';
import './timelines.css';

function Guides({ result, frame }: { result: TimelinesResult; frame: TimelineFrame }) {
  return <>
    {result.axis.ticks.map(tick => <i key={tick.year} className="timelines-guide" style={{ left: `${tick.position * 100}%` }} aria-hidden="true" />)}
    {result.boundaries.map(boundary => <i key={boundary.id} className={`timelines-boundary ${boundary.id}`} style={{ left: `${boundary.position * 100}%` }} aria-hidden="true" />)}
    <i className="timelines-cursor" data-timelines-marker data-year={frame.year} data-position={frame.position} style={{ left: `${frame.position * 100}%` }} aria-hidden="true" />
  </>;
}

function YearAxis({ result }: { result: TimelinesResult }) {
  return <div className="timelines-year-axis" aria-label="공통 경과년 눈금: 0, 2, 4, 6, 8, 10, 12년">{result.axis.ticks.map(tick => <span key={tick.year} data-edge={tick.year === result.axis.start ? 'start' : tick.year === result.axis.end ? 'end' : undefined} style={{ left: `${tick.position * 100}%` }}>{tick.year}</span>)}</div>;
}

function ContractDiagram({ result, frame, contract }: { result: TimelinesResult; frame: TimelineFrame; contract: TimelineContract }) {
  const current = frame[contract.id];
  return <section className={`timelines-contract ${contract.id}`} data-timelines-contract={contract.id} aria-label={contract.label}>
    <h4>{contract.label}</h4>
    <div className="timelines-lane-label"><strong>① 보험료를 내는 순간</strong><span>막대 높이: 0–{won(result.axis.premiumMax)}</span></div>
    <div className="timelines-plot payments" data-timelines-track="payment" data-contract={contract.id} role="img" aria-label={`${contract.label}, ${contract.payments.map(p => `${p.year}년 시작에 ${won(p.amount)}`).join(', ')}. 모든 막대 높이의 기준은 24만원.`}>
      <Guides result={result} frame={frame} />
      {contract.payments.map(item => <i key={item.year} className="timelines-premium" data-timelines-payment={contract.id} data-year={item.year} data-amount={item.amount} data-position={item.position} data-height-fraction={item.heightFraction} data-paid={item.year <= frame.year} style={{ left: `${item.position * 100}%`, height: `${item.heightFraction * 100}%` }}><b aria-hidden="true" /></i>)}
    </div>
    <YearAxis result={result} />
    <p className="timelines-lane-note">{contract.id === 'fixed' ? '0·1·2·3·4년에 각 10만원. 마지막 납입은 4년, 납입기간 종료는 5년입니다.' : `0년부터 매년 시작에 납입합니다. ${contract.coverage.end}년부터는 이 시나리오의 보험료가 없습니다.`}</p>
    <div className="timelines-lane-label"><strong>② 새 사건의 보장기간</strong><span>가로 길이: 경과 시간</span></div>
    <div className="timelines-plot coverage" data-timelines-track="coverage" data-contract={contract.id} role="img" aria-label={`${contract.label}: 0년 포함, ${contract.coverage.end}년 미만까지 보장기간. 사건의 지급조건은 별도.`}>
      <i className="timelines-covered" data-timelines-coverage={contract.id} data-start={contract.coverage.start} data-end={contract.coverage.end} data-fraction={contract.coverage.fraction} style={{ left: `${contract.coverage.position * 100}%`, width: `${contract.coverage.fraction * 100}%` }}><b className="start" aria-hidden="true"/><b className="end" aria-hidden="true"/></i>
      <Guides result={result} frame={frame} />
    </div>
    <YearAxis result={result} />
    <p className="timelines-lane-note">● 0년은 포함 · ○ {contract.coverage.end}년은 제외. {current.covered ? `관찰 중인 ${frame.year}년은 기간 안입니다.` : `관찰 중인 ${frame.year}년은 기간 밖입니다.`}</p>
    {contract.id === 'renewing' && <>
      <div className="timelines-lane-label"><strong>③ 갱신의 경계</strong><span>◇ 2년마다 · 매년 납입과 다름</span></div>
      <div className="timelines-plot renewal" data-timelines-track="renewal" role="img" aria-label={`갱신 경계 2, 4, 6, 8년. ${result.params.stopRenewalYear === null ? '네 번 모두 갱신하는 가정.' : `${result.params.stopRenewalYear}년부터 갱신하지 않는 가정.`}`}>
        {result.periods.map(period => <i key={period.index} className="timelines-renewal-period" data-timelines-period={period.index} data-active={period.active} data-position={period.position} data-fraction={period.fraction} style={{ left: `${period.position * 100}%`, width: `${period.fraction * 100}%` }} />)}
        <Guides result={result} frame={frame} />
        {result.renewals.map(renewal => <b key={renewal.year} className="timelines-renewal-mark" data-timelines-renewal={renewal.year} data-state={renewal.state} data-position={renewal.position} style={{ left: `${renewal.position * 100}%` }} aria-hidden="true">{renewal.state === 'stopped' ? '×' : '◇'}</b>)}
      </div>
      <YearAxis result={result} />
      <p className="timelines-lane-note">{result.params.stopRenewalYear === null ? '◇ 네 경계 모두 갱신한다고 가정합니다. 10년은 다음 갱신이 아니라 계약 종료입니다.' : `× ${result.params.stopRenewalYear}년 갱신을 하지 않습니다. 뒤의 점선 구간은 이어지지 않은 계획이며 보장으로 세지 않습니다.`}</p>
    </>}
  </section>;
}

export function TimelinesOverview() {
  const result = projectTimelines();
  return <div className="timelines-overview">
    <h3>납입 막대가 멈춘 뒤에도 보장 띠는 이어집니다</h3>
    <p className="insurance-note">아래는 가상 계약 A의 시간표입니다. 붉은 관찰선은 5년 시점에 있습니다. 납입 막대의 끝과 보장 띠의 끝이 같은 자리에 있나요?</p>
    <ContractDiagram result={result} frame={result.frames[5]} contract={result.contracts[0]} />
    <p className="insurance-note">0–12년의 같은 눈금입니다. 5년에는 납입이 없지만 10년 직전까지는 보장기간입니다. 보장기간 안이라는 사실만으로 모든 사건의 보험금 지급이 확정되지는 않습니다.</p>
  </div>;
}

export function TimelinesLab() {
  const [params, setParams] = useState<TimelinesOptions>({ ...timelinesDefaults });
  const [prediction, setPrediction] = useState('');
  const result = projectTimelines(params);
  const play = usePlayback(result.frames.length - 1);
  const frame = result.frames[play.step];
  const change = (patch: TimelinesOptions) => { setParams(previous => ({ ...previous, ...patch })); setPrediction(''); play.rewind(); };
  const reset = () => { setParams({ ...timelinesDefaults }); setPrediction(''); play.rewind(); };
  return <section className="insurance-lab timelines-lab" data-insurance-lab="timelines" aria-label="보험료 납입과 보장, 갱신 시간표 실험">
    <h3>한 관찰선을 옮겨 세 시간을 비교하기</h3>
    <p>막대는 매년 시작의 보험료, 긴 띠는 새 사건의 보장기간, ◇는 갱신 경계입니다. 두 계약 모두 가상이며 보장 내용이 같다는 뜻이 아닙니다. 보험료의 높이와 누적 합으로 좋은 상품을 고르는 실험이 아닙니다.</p>
    <div className="insurance-controls">
      <InsuranceRange label="관찰 시점" min={0} max={12} value={frame.year} unit="년" onChange={year => play.seek(year)} />
      <label className="insurance-control">B의 갱신 계획<select data-timelines-stop value={result.params.stopRenewalYear ?? 'continue'} onChange={event => change({ stopRenewalYear: event.target.value === 'continue' ? null : Number(event.target.value) })}><option value="continue">8년 갱신까지 유지 · 10년 종료</option>{[2, 4, 6, 8].map(year => <option key={year} value={year}>{year}년부터 갱신하지 않음</option>)}</select></label>
    </div>
    <InsurancePrediction question="A의 5년 납입기간이 끝나면 보장도 끝날까요?" value={prediction} onChange={setPrediction} options={[["coverage-continues", "납입은 끝나도 보장기간은 이어진다"], ["coverage-ends", "납입과 보장이 함께 끝난다"]]} />
    {play.controls}
    <div className="timelines-jumps" aria-label="정확한 연도 경계로 이동">{result.frames.map(item => <button key={item.year} onClick={() => play.seek(item.year)} aria-label={item.label} aria-current={frame.year === item.year ? 'step' : undefined} aria-pressed={frame.year === item.year}>{item.year}년</button>)}</div>
    <button onClick={reset}>조건까지 초기화</button>
    <div className="insurance-stage" data-insurance-stage={frame.phase} aria-live="polite"><strong>{frame.label}</strong><p>{frame.detail}</p></div>
    <div className="timelines-key">
      <span><i className="premium" aria-hidden="true"/>막대 높이 = 그때 낸 보험료</span>
      <span><i className="coverage" aria-hidden="true"/>띠 길이 = 보장기간</span>
      <span><i className="cursor" aria-hidden="true"/>붉은선 = 관찰 시점 {frame.year}년</span>
      <span><i className="boundary" aria-hidden="true"/>점선 5년 = A 납입기간 종료</span>
    </div>
    <figure className="timelines-comparison">
      {result.contracts.map(contract => <ContractDiagram key={contract.id} result={result} frame={frame} contract={contract} />)}
      <figcaption>모든 가로축은 경과 0–12년, 보험료 막대의 높이는 0–24만원으로 고정합니다. 막대 밑 작은 네모가 정확한 납입 순간이며, 막대 폭은 보기 위한 폭이지 납입기간이 아닙니다. 관찰선 이후의 옅은 막대는 선택한 계획의 예정 납입입니다. 재생하지 않아도 전체 시간표를 읽을 수 있습니다.</figcaption>
    </figure>
    <div className="timelines-current">{result.contracts.map(contract => {
      const current = frame[contract.id];
      return <section key={contract.id} data-timelines-current={contract.id} data-premium={current.premium} data-cumulative={current.cumulativePremium} data-covered={current.covered}>
        <h4>{contract.id === 'fixed' ? 'A' : 'B'} · {frame.year}년 시점</h4>
        <dl><div><dt>이 시점에 낸 보험료</dt><dd>{won(current.premium)}</dd></div><div><dt>이 시점까지 누적 납입</dt><dd>{won(current.cumulativePremium)}</dd></div><div><dt>납입 상태</dt><dd>{current.paymentStatus}</dd></div><div><dt>새 사건의 보장기간</dt><dd>{current.covered ? '✓ 기간 안' : '× 기간 밖'}</dd></div></dl>
      </section>;
    })}</div>
    <p className="timelines-renewal-status" data-timelines-renewal-status={frame.renewal.state}>B의 현재 갱신 상태: <strong>{frame.renewal.label}</strong></p>
    <p className="insurance-result" role="status">{frame.year >= result.comparison.year ? `${prediction ? prediction === result.comparison.answer ? '예측과 같습니다. ' : '예측과 다릅니다. ' : ''}A는 5년 시점부터 보험료를 더 내지 않지만 10년 미만까지 보장기간입니다. ${frame.year >= 10 ? '지금 관찰 중인 시점은 10년 이후이므로 두 계약 모두 새 사건의 보장기간 밖입니다.' : 'B의 갱신 중단 여부는 A의 시간표를 바꾸지 않습니다.'}` : '먼저 예측하고 5년 시점 버튼을 눌러 보세요. 같은 붉은선이 납입 행과 보장 행에서 무엇을 가리키는지 비교합니다.'}</p>
    <InsuranceTable title="0–12년 전체 납입·보장 시간표"><table><caption>모든 행은 해당 연도 시작의 예정 납입 직후입니다. 0년은 첫 납입을 포함합니다. ‘기간 안’은 실제 지급 승인이 아니라 날짜 조건만의 관찰입니다.</caption><thead><tr><th>시점</th><th>A 그때 납입</th><th>A 누적</th><th>A 보장기간</th><th>B 그때 납입</th><th>B 누적</th><th>B 보장기간</th><th>B 갱신</th></tr></thead><tbody>{result.frames.map(item => <tr key={item.year} data-static-timelines={item.year}><th>{item.year}년</th><td>{won(item.fixed.premium)}</td><td>{won(item.fixed.cumulativePremium)}</td><td>{item.fixed.covered ? '기간 안' : '기간 밖'}</td><td>{won(item.renewing.premium)}</td><td>{won(item.renewing.cumulativePremium)}</td><td>{item.renewing.covered ? '기간 안' : '기간 밖'}</td><td>{item.renewal.label}</td></tr>)}</tbody></table></InsuranceTable>
    <InsuranceTable title="B의 가상 갱신 보험료 원표"><table><caption>직접 정한 가상 표입니다. 물가·연령·건강·손해율의 추정식도, 실제 인상률 예측도 아닙니다.</caption><thead><tr><th>경과 구간</th><th>매년 납입액</th><th>예정 납입 시점</th><th>선택한 계획</th></tr></thead><tbody>{result.periods.map(period => <tr key={period.index} data-timelines-rate-row={period.index}><th>{period.start}년 이상 · {period.end}년 미만</th><td>{won(period.annualPremium)} / 년</td><td>{period.start}·{period.end - 1}년 시작</td><td>{period.active ? '유지' : '갱신하지 않아 미적용'}</td></tr>)}</tbody></table></InsuranceTable>
    <p className="insurance-note">관찰은 정수 연도만 지원합니다. 보험료 미납·납입 유예·부활·해지·환급·할인·세금·실제 나이별 요율은 계산하지 않습니다. 갱신 중단은 선택한 2년 구간의 끝에서 다음 계약을 잇지 않는 가정이며, 보험료를 하루 늦게 내면 즉시 보장이 끝난다는 뜻이 아닙니다. 버튼과 방향키로 시점을 바꿀 수 있고, 움직임 줄이기에서는 이동 효과 없이 같은 단계와 정적 표를 읽습니다.</p>
  </section>;
}
