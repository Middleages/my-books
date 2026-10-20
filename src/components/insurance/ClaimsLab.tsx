import { useState } from 'react';
import { usePlayback } from '../money/shared';
import { claimsDefaults, claimsScenarios, projectClaims, type ClaimsFrame, type ClaimsResult, type ClaimsScenarioId } from '../../simulations/insurance/claims.mjs';
import { InsurancePrediction, InsuranceTable, won } from './shared';
import './insurance.css';
import './claims.css';

export function ClaimsCashScene({ result, frame }: { result: ClaimsResult; frame: ClaimsFrame }) {
  return <figure className="claims-cash-scene" aria-label={`${frame.day}일 현금과 지출, 납기 당시 부족 이력`}>
    <h4>{frame.day}일의 세 가지 금액을 분리하기</h4>
    <div className="claims-money-axis" aria-hidden="true"><span>0원</span><span>{won(result.moneyScale / 2)}</span><span>{won(result.moneyScale)}</span></div>
    <div className="claims-money-row"><div><strong>지금 사용 가능한 현금</strong><b data-claims-value="cash" data-value={frame.availableCash}>{won(frame.availableCash)}</b></div><div className="claims-money-track"><i className="cash" data-claims-bar="cash" data-fraction={frame.cashFraction} style={{ width: `${frame.cashFraction * 100}%` }} /></div><small>입금한 돈만 더하고 실제로 충당한 지출만 뺀 잔액입니다.</small></div>
    <div className="claims-money-row"><div><strong>사고 지출 {won(result.assumptions.expense)}</strong><b data-claims-value="unfunded" data-value={frame.unfunded}>미충당 {won(frame.unfunded)}</b></div><div className="claims-money-track" role="img" aria-label={frame.dueSegments.map(segment => `${segment.label} ${won(segment.amount)}`).join(', ')}>{frame.dueSegments.map(segment => <i key={segment.id} className={segment.id} data-claims-bar={segment.id} data-value={segment.amount} data-fraction={segment.fraction} data-start-fraction={segment.startFraction} style={{ left: `${segment.startFraction * 100}%`, width: `${segment.fraction * 100}%` }} />)}</div><div className="claims-money-key"><span className="paid">충당 {won(frame.paidToDate)}</span><span className="unfunded">미충당 {won(frame.unfunded)}</span><span className="not-due">납기 전 {won(frame.notYetDue)}</span></div></div>
    <div className="claims-money-row history"><div><strong>{result.assumptions.dueDay}일 납기 당시 부족 기록</strong><b data-claims-value="history" data-value={frame.shortfallAtDue ?? 'pending'}>{frame.shortfallAtDue === null ? '아직 납기 전' : won(frame.shortfallAtDue)}</b></div><div className="claims-money-track"><i className="historical" data-claims-bar="history" data-fraction={frame.historyFraction} style={{ width: `${frame.historyFraction * 100}%` }} /></div><small>현재의 미충당액과 다른 값입니다. 뒤늦게 지출을 해결해도 당시의 기록은 지워지지 않습니다.</small></div>
    <dl className="claims-accounting"><div><dt>도착한 보험금 합계</dt><dd data-claims-value="received" data-value={frame.receivedToDate}>{won(frame.receivedToDate)}</dd></div><div><dt>충당한 지출 합계</dt><dd data-claims-value="paid" data-value={frame.paidToDate}>{won(frame.paidToDate)}</dd></div></dl>
    <figcaption>세 막대는 모두 0–{won(result.moneyScale)}의 같은 눈금입니다. 초록은 현금, 파랑은 이미 충당한 지출, 빗금은 현재 미충당액, 점선 테두리는 과거의 부족 기록입니다. 미충당액을 대출이나 마이너스 현금으로 바꾸지 않습니다. 납기 후 입금은 이 가상 지출에 곧바로 충당하는 가정이며, 실제 연체료·차입·납기 연장은 계산하지 않습니다.</figcaption>
  </figure>;
}
export function ClaimsProcessScene({ frame, result }: { frame: ClaimsFrame; result: ClaimsResult }) {
  return <figure className="claims-process-scene" aria-label="청구에서 입금까지의 절차와 필요한 경우의 분기">
    <h4>접수와 지급 결정, 현금 도착은 다른 단계</h4>
    <ol className="claims-process">{frame.process.map(stage => <li key={stage.id} className={stage.id} data-claims-process={stage.id} data-status={stage.status}>
      <div className="claims-process-node"><span aria-hidden="true">{stage.symbol}</span><strong>{stage.label}</strong><small>{stage.day === null ? '입금일 없음' : `${stage.day}일`}</small></div>
      <p>{stage.detail}</p>
      {stage.id === 'review' && <div className={`claims-branch ${result.scenario.branch ? 'enabled' : ''}`} data-claims-branch data-enabled={result.scenario.branch}><strong>필요한 경우에만 ↘</strong>{frame.branch.map(item => <span key={item.id} data-claims-branch-stage={item.id} data-status={item.status}>{item.label}{item.enabled ? ` · ${item.day}일` : ' · 이 사례는 생략'}</span>)}<small>확인 후 결정 단계로 ↗</small></div>}
    </li>)}</ol>
    <div className="claims-claim-amounts"><span>청구한 금액 <strong>{won(frame.requestedAmount)}</strong></span><span>현재 결정된 지급대상 <strong data-claims-value="confirmed" data-value={frame.confirmedAmount ?? 'pending'}>{frame.confirmedAmount === null ? '아직 결정 전' : won(frame.confirmedAmount)}</strong></span><span>실제 도착한 금액 <strong>{won(frame.receivedToDate)}</strong></span></div>
    <figcaption>이 그림의 날짜·결과는 미리 정한 교육 사례입니다. 기본 사례의 약관상 지급대상은 {won(result.assumptions.requestedAmount)}으로 가정했지만, 현실에서는 계약과 사건·서류를 확인해야 합니다. 채운 윤곽은 진행한 단계, 점선은 아직 도달하지 않은 단계입니다. 추가서류와 조사는 모든 청구의 필수 단계가 아닙니다.</figcaption>
  </figure>;
}
export function ClaimsTimeline({ result, frame }: { result: ClaimsResult; frame: ClaimsFrame }) {
  const lanes = [['event', '사고'], ['process', '청구·결정'], ['expense', '지출 납기'], ['cash', '보험금 도착']];
  return <figure className="claims-timeline" aria-label="사고·청구·납기·입금을 같은 날짜축에서 비교">
    <h4>지출의 시계는 청구 절차를 기다리지 않습니다</h4>
    <div className="claims-time-lanes">{lanes.map(([id, label]) => <div className="claims-time-row" key={id}><strong>{label}</strong><div className="claims-time-track">{result.events.filter(event => event.lane === id).map(event => <span key={event.id} className={`${event.id} ${event.day <= frame.day ? 'reached' : ''}`} data-claims-event={event.id} data-day={event.day} data-fraction={event.fraction} style={{ left: `${event.fraction * 100}%` }}><i aria-hidden="true" /><b>{event.label}</b><small>{event.day}일</small></span>)}{id === 'cash' && result.scenario.arrivalDay === null && <em>이 사례는 입금 없음</em>}<i className="claims-now" style={{ left: `${frame.timeFraction * 100}%` }} aria-hidden="true" /></div></div>)}</div>
    <div className="claims-time-axis" aria-hidden="true">{result.chart.xTicks.map(tick => <span key={tick.day} style={{ left: `${tick.day / result.observationEnd * 100}%` }}>{tick.day}일</span>)}</div>
    <figcaption>가로축: 사고가 난 0일부터 {result.observationEnd}일까지의 가상 경과일. 검은 세로 표시는 현재 관찰일 {frame.day}일입니다. 모바일에서는 같은 사건들을 날짜순 목록으로 읽습니다. 날짜는 영업일 계산이나 법정 지급기한이 아닙니다.</figcaption>
    <ol className="claims-mobile-events">{result.timelineEvents.map(event => <li key={event.id} className={event.id}><strong>{event.day}일</strong><span>{event.label}</span><small>{event.day <= frame.day ? '도달' : '예정'}</small></li>)}</ol>
  </figure>;
}
function ClaimsPathChart({ result, frame }: { result: ClaimsResult; frame: ClaimsFrame }) {
  return <figure className="claims-chart" aria-label="현금과 미충당 지출의 전체 가상 경로">
    <h4>뒤의 회복이 앞의 부족을 없애지는 않습니다</h4>
    <p className="insurance-note">미리 정해 둔 전체 사례의 경로입니다. 각 날짜는 그날 입금·납기·지출 충당을 모두 처리한 뒤의 값입니다. 납기일 입금은 먼저 들어온 것으로 처리합니다.</p>
    <svg className="claims-chart-svg" viewBox={result.chart.viewBox} role="img" aria-label="가로축 0일부터 20일, 세로축 금액 0부터 300만원. 초록 실선은 사용 가능 현금, 빨강 실선은 현재 미충당액, 보라 점선은 납기 당시 부족 기록">
      {result.chart.yTicks.map(tick => <g key={tick.amount}><line x1="54" x2="562" y1={tick.y} y2={tick.y} className="grid" /><text x="46" y={tick.y + 4} textAnchor="end">{tick.amount / 10000}</text></g>)}
      {result.chart.xTicks.map(tick => <g key={tick.day}><line x1={tick.x} x2={tick.x} y1="30" y2="204" className="grid" /><text x={tick.x} y="225" textAnchor="middle">{tick.day}일</text></g>)}
      <text x="12" y="16">만원</text><line className="due-line" x1={result.chart.dueX} x2={result.chart.dueX} y1="25" y2="204" />
      <path d={result.chart.unfundedPath} data-claims-path="unfunded" className="unfunded" /><path d={result.chart.cashPath} data-claims-path="cash" className="cash" /><path d={result.chart.historyPath} data-claims-path="history" className="history" />
      <line className="cursor" x1={frame.cashPoint.x} x2={frame.cashPoint.x} y1="25" y2="204" /><circle className="cash" cx={frame.cashPoint.x} cy={frame.cashPoint.y} r="5" /><circle className="unfunded" cx={frame.unfundedPoint.x} cy={frame.unfundedPoint.y} r="4" />
    </svg>
    <div className="claims-chart-legend"><span className="cash">사용 가능 현금</span><span className="unfunded">현재 미충당액</span><span className="history">납기 당시 부족 기록</span></div>
    <p className="insurance-note">납기 당시 부족액과 현재 미충당액이 같을 때 두 선은 겹칩니다. 보라 점선을 더 가늘게 그려 아래 빨간 선도 보이게 했습니다. 입금 전후의 막대와 전체 표에서도 각각 확인할 수 있습니다.</p>
    <div className="claims-mobile-checkpoints">{result.checkpoints.filter(row => row.dueToday || row.receipt > 0 || row.day === result.observationEnd).map(row => <div key={row.day}><strong>{row.day}일{row.dueToday ? ' · 납기' : row.receipt > 0 ? ' · 입금' : ' · 관찰 끝'}</strong><span>현금 {won(row.availableCash)}</span><span>미충당 {won(row.unfunded)}</span><span>납기 부족 기록 {row.shortfallAtDue === null ? '납기 전' : won(row.shortfallAtDue)}</span></div>)}</div>
    <figcaption>세로축은 모든 사례에서 0–{won(result.moneyScale)}로 같습니다. 0원 선은 ‘아무 문제가 없었다’가 아니라 해당 잔액이 0이라는 뜻입니다. 도착한 보험금이 바로 지출로 나가면 현금 잔액이 늘지 않아도 입금과 충당은 각각 발생합니다.</figcaption>
  </figure>;
}
export function ClaimsOverview() {
  const result = projectClaims();
  return <div className="claims-overview"><h3>같은 200만원, 서로 다른 날짜</h3><div className="claims-overview-pair">{[result.due, result.frames[10]].map(frame => <section key={frame.day}><strong>{frame.day}일 · {frame.day === result.assumptions.dueDay ? '지출 납기' : '보험금 도착 후'}</strong><div className="claims-overview-track" role="img" aria-label={`지출 ${won(result.assumptions.expense)} 중 충당 ${won(frame.paidToDate)}, 미충당 ${won(frame.unfunded)}`}>{frame.dueSegments.map(segment => <i key={segment.id} className={segment.id} style={{ left: `${segment.startFraction * 100}%`, width: `${segment.fraction * 100}%` }} />)}</div><p>충당 {won(frame.paidToDate)}<br />현재 미충당 {won(frame.unfunded)}</p><p className="claims-history-stamp">5일 부족 기록 {won(frame.shortfallAtDue ?? 0)}</p></section>)}</div><p>막대 전체는 사고 지출 {won(result.assumptions.expense)}입니다. 파랑은 충당한 금액, 빗금은 아직 못 채운 금액입니다. 10일에 나머지를 채워도 5일에 부족했던 사실까지 바뀌지는 않습니다.</p></div>;
}
export function ClaimsLab() {
  const [scenario, setScenario] = useState<ClaimsScenarioId>(claimsDefaults.scenario);
  const [startingCash, setStartingCash] = useState(claimsDefaults.startingCash);
  const [prediction, setPrediction] = useState('');
  const result = projectClaims({ scenario, startingCash });
  const play = usePlayback(result.observationEnd, claimsDefaults.day);
  const frame = result.frames[play.step];
  const change = () => { play.rewind(); setPrediction(''); };
  const reset = () => { setScenario(claimsDefaults.scenario); setStartingCash(claimsDefaults.startingCash); setPrediction(''); play.rewind(); };
  return <section className="insurance-lab claims-lab" data-insurance-lab="claims" data-claims-day={frame.day} data-claims-scenario={scenario} aria-label="보험금 청구와 현금 시차 실험">
    <h3>언제, 얼마가 도착하는지 바꾸어 보기</h3>
    <p>사고 지출 {won(result.assumptions.expense)}, 청구액 {won(result.assumptions.requestedAmount)}, 청구일 {result.assumptions.claimDay}일, 지출 납기 {result.assumptions.dueDay}일은 같습니다. 출발현금과 고정 사례만 바꿉니다. 실제 개인정보나 건강서류를 입력하지 않습니다.</p>
    <div className="insurance-controls"><label className="insurance-control"><span>청구 결과 사례</span><select aria-label="청구 결과 사례" value={scenario} onChange={event => { setScenario(event.target.value as ClaimsScenarioId); change(); }}>{claimsScenarios.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label className="insurance-control"><span>출발현금<strong>{won(startingCash)}</strong></span><input aria-label="출발현금" aria-valuetext={won(startingCash)} type="range" min={0} max={3000000} step={500000} value={startingCash} onChange={event => { setStartingCash(Number(event.target.value)); change(); }} /></label></div>
    <p className="claims-scenario-note">{result.scenario.explanation}</p>
    <InsurancePrediction question="5일 납기에 지출 300만원을 모두 충당할 수 있을까요?" value={prediction} onChange={setPrediction} options={[["shortfall", "납기에 부족하다"], ["enough", "납기에 모두 충당한다"]]} />
    {play.controls}<button onClick={reset}>조건까지 초기화</button>
    <label className="insurance-control"><span>관찰할 날짜<strong>{frame.day}일</strong></span><input aria-label="관찰할 날짜" aria-valuetext={`${frame.day}일`} type="range" min={0} max={result.observationEnd} step={1} value={frame.day} onChange={event => play.seek(Number(event.target.value))} /></label>
    <div className="claims-shortcuts"><button onClick={() => play.seek(result.assumptions.dueDay)}>5일 납기 보기</button><button onClick={() => play.seek(result.scenario.arrivalDay ?? result.scenario.decisionDay)}>{result.scenario.arrivalDay === null ? '거절 결정 보기' : `${result.scenario.arrivalDay}일 입금 보기`}</button><button onClick={() => play.seek(result.observationEnd)}>전체 결과 보기</button></div>
    <div className="insurance-stage" data-insurance-stage={frame.phase} aria-live="polite"><strong>{frame.label}</strong><p>{frame.detail}</p></div>
    <ClaimsTimeline result={result} frame={frame} />
    <ClaimsCashScene result={result} frame={frame} />
    <ClaimsProcessScene result={result} frame={frame} />
    <ClaimsPathChart result={result} frame={frame} />
    <InsuranceTable title="날짜별 현금·미충당·부족 이력"><table><caption>단위: 만원. 모든 값은 그날 입금 → 납기 → 미충당 지출 충당을 마친 뒤입니다. 표는 모든 날짜를 미리 보여 줍니다. 부족 기록은 납기 당시 값이며 현재의 미충당액과 다릅니다.</caption><thead><tr><th>날짜</th><th>그날 입금</th><th>그날 충당</th><th>사용 가능 현금</th><th>현재 미충당</th><th>납기 부족 기록</th></tr></thead><tbody>{result.frames.map(row => <tr key={row.day} data-static-claims={row.day} data-selected={row.day === frame.day}><th>{row.day}일{row.dueToday ? ' · 납기' : ''}</th><td>{won(row.receipt)}</td><td>{won(row.paidToday)}</td><td>{won(row.availableCash)}</td><td>{won(row.unfunded)}</td><td>{row.shortfallAtDue === null ? '납기 전' : won(row.shortfallAtDue)}</td></tr>)}</tbody></table></InsuranceTable>
    <InsuranceTable title="선택한 사례의 청구 절차"><table><caption>절차를 이해하기 위한 고정 날짜이며 실제 처리 기한이 아닙니다. 추가 확인이 필요한 경우만 별도 분기가 있습니다.</caption><thead><tr><th>단계</th><th>가상 날짜</th><th>뜻</th></tr></thead><tbody>{frame.process.map(row => <tr key={row.id}><th>{row.label}</th><td>{row.day === null ? '없음' : `${row.day}일`}</td><td>{row.detail}</td></tr>)}{frame.branch.map(row => <tr key={row.id}><th>{row.label}</th><td>{row.enabled ? `${row.day}일` : '이 사례는 생략'}</td><td>필요한 경우만 거치는 분기</td></tr>)}</tbody></table></InsuranceTable>
    <p className="insurance-note">실제 지급기한·청구권·거절의 적법성은 판정하지 않습니다. 지연이 항상 추가 조사 때문이라는 뜻도 아닙니다. 이자·다른 소득·추가 손실·연체료·자동 대출은 없습니다. 조건 변경·날짜 이동·정지·초기화는 재생을 멈춥니다. 화살표 키와 날짜 버튼으로 즉시 이동할 수 있고, 움직임 줄이기에서는 이동 효과 없이 같은 그림과 표를 읽습니다.</p>
    <p className={`insurance-result ${result.prediction === 'shortfall' ? 'warning' : ''}`} role="status">{prediction ? `${prediction === result.prediction ? '예측과 같습니다.' : '예측과 다릅니다.'} ` : '예측과 결과를 비교해 보세요. '}{result.assumptions.dueDay}일 납기 부족액은 {won(result.due.shortfallAtDue ?? 0)}입니다. 관찰 끝인 {result.observationEnd}일의 미충당 지출은 {won(result.final.unfunded)}, 사용 가능 현금은 {won(result.final.availableCash)}입니다. {result.due.shortfallAtDue ? '나중에 입금되더라도 납기 당시의 부족 기록은 그대로 남습니다.' : '이 가정에서는 납기를 충당했지만, 현실의 입금 시각·지급 여부까지 보장하지는 않습니다.'}</p>
  </section>;
}
