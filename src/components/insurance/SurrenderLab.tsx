import { useState } from 'react';
import { usePlayback } from '../money/shared';
import { projectSurrender, surrenderDefaults, type SurrenderFrame, type SurrenderResult } from '../../simulations/insurance/surrender.mjs';
import { InsurancePrediction, InsuranceTable, percent, won } from './shared';
import './insurance.css';
import './surrender.css';

function MoneyComparison({ frame, scale }: { frame: SurrenderFrame; scale: number }) {
  const exitLabel = frame.kind === 'surrender' ? '해약환급금' : '만기보험금';
  return <figure className="surrender-money" aria-label="누적보험료와 돌려받는 돈의 같은 눈금 비교">
    <h4>낸 돈과 돌려받는 돈은 다른 금액</h4>
    <div className="surrender-money-axis" aria-hidden="true"><span>0원</span><span>{won(scale / 2)}</span><span>{won(scale)}</span></div>
    <div className="surrender-money-row"><div className="surrender-money-label"><span>지금까지 낸 보험료</span><strong data-surrender-premium data-value={frame.cumulativePremium}>{won(frame.cumulativePremium)}</strong></div>
      <div className="surrender-money-track" role="img" aria-label={`누적보험료 ${won(frame.cumulativePremium)}, 10만원씩 ${frame.paymentCount}회`}>
        <div className="surrender-paid" data-surrender-bar="premium" data-fraction={frame.paidFraction} style={{ width: `${frame.paidFraction * 100}%` }}>{frame.paymentEvents.filter(event => event.paid).map(event => <i key={event.year} title={`${event.year}년 납입 ${won(event.amount)}`} />)}</div>
      </div><small>칸 하나 = 납입 1회 10만원 · {frame.paymentCount}회</small>
    </div>
    <div className="surrender-money-row"><div className="surrender-money-label"><span>{frame.kind === 'surrender' ? '그날의 해약환급금' : '별도 만기보험금'}</span><strong data-surrender-return data-value={frame.exitValue} data-kind={frame.kind}>{won(frame.exitValue)}</strong></div>
      <div className="surrender-money-track" role="img" aria-label={`${exitLabel} ${won(frame.exitValue)}, 누적보험료와 차액 ${won(frame.difference)}`}>
        <i className={`surrender-return ${frame.kind}`} data-surrender-bar="return" data-fraction={frame.exitFraction} style={{ width: `${frame.exitFraction * 100}%` }} />
        <i className="surrender-difference" data-surrender-bar="difference" data-fraction={frame.differenceFraction} style={{ left: `${frame.exitFraction * 100}%`, width: `${frame.differenceFraction * 100}%` }} />
      </div><small>채운 부분 = 돌려받는 돈 · 점선 부분 = 누적보험료와의 차액</small>
    </div>
    <div className="surrender-money-summary"><span>단순 차액 <strong data-surrender-difference data-value={frame.difference}>{won(frame.difference)}</strong></span><span>낸 보험료 대비 <strong data-surrender-ratio data-value={frame.returnRatio}>{percent(frame.returnRatio)}</strong></span></div>
    <figcaption>두 막대의 눈금은 언제나 0–{won(scale)}입니다. 차액 전체를 위약금이나 회사 이익으로 읽을 수는 없습니다. 지금까지의 보장에 쓰인 비용 등을 이 모형은 따로 계산하지 않습니다. 비율은 수익률이 아닙니다.</figcaption>
  </figure>;
}
function CoverageTimeline({ frame, result }: { frame: SurrenderFrame; result: SurrenderResult }) {
  return <figure className="surrender-coverage" aria-label="해지 시점 전후 새 사건의 보장 비교">
    <h4>돌려받는 돈만 보지 말고, 끝나는 보장도 보기</h4>
    <p className="surrender-boundary-label">{frame.kind === 'surrender' ? `${frame.exitYear}년 해지 경계부터 새 사건의 보장이 끝납니다.` : '10년 만기 경계에서 원래의 보장기간이 끝납니다.'}</p>
    <div className="surrender-timeline-row"><strong>해지하지 않는다면</strong><div className="surrender-time-track"><i className="covered" style={{ width: `${result.scheduledCoverageEnd / result.observationEnd * 100}%` }} /><i className="outside" style={{ left: `${result.scheduledCoverageEnd / result.observationEnd * 100}%`, width: `${(result.observationEnd - result.scheduledCoverageEnd) / result.observationEnd * 100}%` }} /></div></div>
    <div className="surrender-timeline-row"><strong>선택한 사례</strong><div className="surrender-time-track" data-surrender-coverage data-end={frame.coverageEnd} role="img" aria-label={`${frame.coverageEnd}년 전까지 보장 구간, ${frame.exitYear}년 ${frame.kind === 'surrender' ? '해지' : '만기'} 이후 새 사건 보장 없음`}>
      {frame.coverageSegments.map(segment => <i key={segment.id} className={segment.id} data-surrender-coverage-segment={segment.id} data-start={segment.start} data-end={segment.end} data-fraction={segment.fraction} style={{ left: `${segment.startFraction * 100}%`, width: `${segment.fraction * 100}%` }} />)}
      <b className="surrender-cut" style={{ left: `${frame.exitTimeFraction * 100}%` }} aria-hidden="true" />
    </div></div>
    <div className="surrender-timeline-row"><strong>보험료를 낸 시점</strong><div className="surrender-payment-track" role="img" aria-label={frame.paymentEvents.map(event => `${event.year}년 ${event.paid ? '10만원 납입' : '해지 뒤 납입 중단'}`).join(', ')}>
      {frame.paymentEvents.map(event => <i key={event.year} className={event.paid ? 'paid' : 'skipped'} data-surrender-payment={event.year} data-paid={event.paid} style={{ left: `${event.timeFraction * 100}%` }}>{event.paid ? '●' : '×'}</i>)}
    </div></div>
    <div className="surrender-time-axis" aria-hidden="true">{[0, 2, 4, 6, 8, 10, 12].map(year => <span key={year} style={{ left: `${year / result.observationEnd * 100}%` }}>{year}년</span>)}</div>
    <div className="surrender-legend"><span className="covered">보장 구간</span><span className="canceled">해지로 끝난 구간</span><span className="outside">원래 기간 밖</span></div>
    <figcaption>공통 가로축은 경과연도 0–12년입니다. 초록은 새 사건의 날짜가 들어갈 수 있는 구간이며 모든 사고의 지급 승인을 뜻하지 않습니다. 해지 전 사건의 청구 여부는 사건 당시 조건 등으로 따로 확인합니다. ●는 실제 납입, ×는 해지 후 중단된 예정 납입입니다. 0–4년에는 해당 연도 보험료를 먼저 낸 다음 해지하는 가정입니다.</figcaption>
  </figure>;
}
export function SurrenderOverview() {
  const result = projectSurrender({ exitYear: 5 });
  return <div className="surrender-overview"><p><strong>가상 계약 · 5년 시점에 바로 해지한다면</strong></p><MoneyComparison frame={result.frame} scale={result.moneyScale} /><p className="insurance-note">0·1·2·3·4년에 각각 10만원을 내서 총 50만원입니다. 5년의 환급금 20만원은 별도로 주어진 표에서 읽었습니다. 이 금액을 받으면 이 계약의 남은 보장은 이어지지 않습니다.</p></div>;
}
export function SurrenderLab() {
  const result = projectSurrender();
  const play = usePlayback(result.frames.length - 1, surrenderDefaults.exitYear);
  const frame = result.frames[play.step];
  const [prediction, setPrediction] = useState('');
  const selectYear = (year: number) => { play.seek(year); setPrediction(''); };
  const reset = () => { play.seek(surrenderDefaults.exitYear); setPrediction(''); };
  return <section className="insurance-lab surrender-lab" data-insurance-lab="surrender" data-surrender-year={frame.exitYear} data-surrender-kind={frame.kind} aria-label="해지 시점별 환급금과 보장 실험">
    <h3>같은 계약, 다른 해지 날짜</h3>
    <p>재생은 하나의 계약을 여러 번 해지하는 동작이 아닙니다. 각 연도까지 유지했다면 어떻게 달라지는지 독립된 사례를 한 해씩 비교합니다. 10년은 해지가 아닌 별도의 만기 사례입니다.</p>
    <label className="insurance-control surrender-year-control"><span>비교할 종료 시점<strong>{frame.exitYear}년 · {frame.kind === 'surrender' ? '해지' : '만기'}</strong></span><input type="range" min={0} max={10} step={1} value={frame.exitYear} aria-label="비교할 종료 시점" aria-valuetext={`${frame.exitYear}년 ${frame.kind === 'surrender' ? '납입 직후 해지' : '만기'}`} onChange={event => selectYear(Number(event.target.value))} /></label>
    <div className="surrender-shortcuts" aria-label="각 종료 시점 바로 선택">{result.frames.map(item => <button key={item.phase} aria-label={item.label} aria-current={frame.index === item.index ? 'step' : undefined} onClick={() => selectYear(item.exitYear)}>{item.exitYear}년 · {item.kind === 'surrender' ? '해지' : '만기'}</button>)}</div>
    <InsurancePrediction question="돌려받는 돈은 지금까지 낸 보험료와 비교하면 어떨까요?" value={prediction} onChange={setPrediction} options={[["less", "적다"], ["same", "같다"], ["more", "많다"]]} />
    {play.controls}<button onClick={reset}>조건까지 초기화</button>
    <div className="insurance-stage" data-insurance-stage={frame.phase} aria-live="polite"><strong>{frame.label}</strong><p>{frame.detail}</p></div>
    <MoneyComparison frame={frame} scale={result.moneyScale} />
    <p className="insurance-result" role="status">{prediction ? `${prediction === frame.comparison ? '예측과 같습니다.' : '예측과 다릅니다.'} ` : ''}{frame.kind === 'surrender' ? `누적보험료 ${won(frame.cumulativePremium)}와 표의 해약환급금 ${won(frame.exitValue)}는 같지 않습니다. 해지 뒤 새 사건의 보장이 끝납니다. ${frame.remainingScheduledPremium > 0 ? `남아 있던 예정 납입 ${won(frame.remainingScheduledPremium)}도 중단됩니다.` : '납입은 이미 끝나 더 줄어드는 보험료는 없습니다.'}` : '만기보험금 0원은 이 가상 계약의 별도 약속입니다. 9년 해약환급금 28만원이 10년 만기보험금으로 자동 이월되지 않습니다.'}</p>
    <CoverageTimeline frame={frame} result={result} />
    <InsuranceTable title="연도별 금액을 한눈에 비교"><table><caption>매 행은 서로 다른 종료 선택입니다. 단위: 만원. 0–9년은 그날 예정보험료 납입 직후의 값이며, 5년부터는 당일 납입이 없습니다. 표 밖·중간 시점은 알 수 없습니다.</caption><thead><tr><th>경과연도·종류</th><th>그날 납입</th><th>누적보험료</th><th>해약환급금</th><th>만기보험금</th><th>보험료 대비</th></tr></thead><tbody>{result.frames.map(row => <tr key={row.exitYear} data-static-surrender={row.exitYear} data-kind={row.kind} data-selected={row.exitYear === frame.exitYear}><th>{row.exitYear}년 · {row.kind === 'surrender' ? '해지' : '만기'}</th><td>{won(row.timeline[row.exitYear].paidPremium)}</td><td>{won(row.cumulativePremium)}</td><td>{row.surrenderValue === null ? '해당 없음' : won(row.surrenderValue)}</td><td>{row.maturityValue === null ? '해당 없음' : won(row.maturityValue)}</td><td>{percent(row.returnRatio)}</td></tr>)}</tbody></table></InsuranceTable>
    <InsuranceTable title="선택한 사례의 납입·보장 시간표"><table><caption>{frame.label}. 보장 표시는 각 행의 시작 직후에 새로 일어나는 사건을 기준으로 합니다. 지급 승인 여부나 해지 전 사건의 청구권을 판정하는 표가 아닙니다.</caption><thead><tr><th>경과 구간</th><th>그해 납입</th><th>새 사건의 보장 구간</th><th>종료 경계</th></tr></thead><tbody>{frame.timeline.map(row => <tr key={row.year} data-surrender-timeline={row.year} data-covered={row.newEventCovered}><th>{row.year}년 이상 {row.endYear}년 미만</th><td>{won(row.paidPremium)}</td><td>{row.coverageStatus === 'covered' ? '구간 안 · 다른 조건도 확인' : row.coverageStatus === 'canceled' ? '해지 뒤 · 보장 없음' : '원래 기간 밖'}</td><td>{row.exitHere ? `${frame.kind === 'surrender' ? '해지' : '만기'} · ${won(row.cashAtExit)}` : '—'}</td></tr>)}</tbody></table></InsuranceTable>
    <p className="insurance-note">가상 고정 표이며 실제 보험사의 견적이 아닙니다. 0년의 환급금 0원은 실제 청약철회·취소 권리를 계산한 결과가 아닙니다. 이자·물가·사업비·위험보험료·세금·대출공제·지급 시차를 산출하지 않습니다. 화살표 키로 연도를 고르거나 버튼으로 한 단계씩 비교할 수 있습니다. 조건 변경·정지·초기화는 재생을 멈춥니다. 움직임 줄이기에서는 이동 없이 같은 단계와 정적 표를 읽습니다.</p>
  </section>;
}
