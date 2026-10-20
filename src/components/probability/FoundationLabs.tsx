import { useState } from 'react';
import { distributionModel, descriptiveDefaults, type DescriptiveParams, type DistributionGroup } from '../../simulations/probability/descriptive.mjs';
import { lossModel, lossDefaults, type LossParams, type LossRow } from '../../simulations/probability/losses.mjs';
import { money, number, percent, StaticTable, useObservation } from './shared';
import './probability.css';

export function ProbabilityPrimer() {
  return <figure className="prob-primer" aria-label="요약과 근거와 감당할 조건을 함께 읽기">
    <div><span aria-hidden="true">● ● ●<br/>● ● ● ● ●</span><strong>숫자 뒤의 전체</strong><small>어떤 대상과 분모인가?</small></div>
    <b aria-hidden="true">→</b><div><span aria-hidden="true">┌ ? ┐<br/>└ · ┘</span><strong>아직 모르는 것</strong><small>가정인가, 관측인가?</small></div>
    <b aria-hidden="true">→</b><div><span aria-hidden="true">▰ ▰ │ ▱</span><strong>결정의 경계</strong><small>손실과 기한을 감당할까?</small></div>
    <figcaption>좋아 보이는 숫자에서 곧바로 ‘안전’으로 건너뛰지 않습니다. 그림은 읽는 순서이며 수익을 예측하는 공식이 아닙니다.</figcaption>
  </figure>;
}
function DotDistribution({ group, step }: { group: DistributionGroup; step: number }) {
  return <section className="prob-distribution" data-group={group.id} data-mean={group.summary.mean} data-median={group.summary.median} data-sd={group.summary.sd}>
    <h4>{group.label} <span>10가구 · 합 {money(group.summary.sum)}</span></h4>
    <div className="prob-dot-axis" role="img" aria-label={`${group.label}. 점 하나는 1가구. 평균 ${money(group.summary.mean)}, 중앙값 ${money(group.summary.median)}, 최대 ${money(group.summary.max)}. 공통 금액축 0–120만원.`}>
      <i className="prob-mean-line" data-mean-fraction={group.meanFraction} style={{ left: `${group.meanFraction * 100}%` }} />
      <i className="prob-median-line" data-median-fraction={group.medianFraction} style={{ left: `${group.medianFraction * 100}%` }} />
      {group.points.map(point => <i key={point.id} className="prob-dot" data-value={point.value} data-stack={point.stack} data-fraction={point.x} style={{ left: `${point.x * 100}%`, bottom: `${12 + point.stack * 17}px` }} />)}
    </div>
    <div className="prob-axis"><span>0</span><span>30</span><span>60</span><span>90</span><span>120만원</span></div>
    <p className="prob-markers"><span>━━ 평균 {money(group.summary.mean)}</span><span>┆ 중앙값 {money(group.summary.median)}</span></p>
    {step >= 1 && <div className="prob-ranks" aria-label={`${group.label} 금액순 순위`}>{group.ordered.map(point => <span key={point.id} data-middle={point.middle}><small>{point.rank}번째</small><b>{number(point.value)}</b>{point.middle && <em>가운데</em>}</span>)}</div>}
    {step === 2 && <p className="prob-explanation">{money(group.summary.sum)} ÷ {group.summary.n}가구 = 평균 {money(group.summary.mean)}. 표준편차 {money(group.summary.sd)}, 가운데 절반의 폭(IQR) {money(group.summary.iqr)}.</p>}
  </section>;
}
export function DistributionLab() {
  const [params, setParams] = useState<DescriptiveParams>({ ...descriptiveDefaults }), [prediction, setPrediction] = useState('');
  const model = distributionModel(params), play = useObservation(model.frames.length - 1), frame = model.frames[play.step];
  const change = (values: Partial<DescriptiveParams>) => { setParams(p => ({ ...p, ...values })); setPrediction(''); play.rewind(); };
  const reset = () => { setParams({ ...descriptiveDefaults }); setPrediction(''); play.rewind(); };
  return <section className="prob-lab" data-prob-lab="distributions" aria-label="같은 평균과 다른 분포 실험">
    <p className="prob-eyebrow">자체 가상 관측 · 같은 한 달 · 만원</p><h3>{model.equalMean ? '평균 선은 같은데 점들은 다릅니다' : '큰 값 하나가 평균선을 움직입니다'}</h3>
    <p>모든 점은 같은 금액축에 놓입니다. 위로 쌓인 점을 사람 수로 읽고, 오른쪽 멀리 있는 지출 한 건을 찾아보세요.</p>
    <figure className="prob-figure"><div className="prob-legend"><span>● 한 점 = 한 가구</span><span>실선 = 평균</span><span>점선 = 중앙값</span></div>
      {model.groups.map(group => <DotDistribution key={group.id} group={group} step={play.step} />)}
      <figcaption>가로 위치는 지출액, 쌓인 높이는 같은 금액의 가구 수입니다. 두 집단 모두 0–120만원의 같은 축이며 점을 무작위로 추첨한 결과가 아닙니다.</figcaption>
    </figure>
    <div className="prob-near-controls"><label>꼬리 집단의 큰 지출 한 건<select value={params.tail} onChange={e => change({ tail: Number(e.target.value) })}><option value={110}>110만원 · 기본</option><option value={60}>60만원</option><option value={20}>20만원</option></select></label>
      <label>큰 값이 바뀌면 중앙값도 바뀔까요?<select aria-label="중앙값 변화 예측" value={prediction} onChange={e => setPrediction(e.target.value)}><option value="">먼저 예상하기</option><option value="same">10만원 그대로다</option><option value="change">큰 값만큼 변한다</option></select></label>{play.controls}<button className="prob-reset" onClick={reset}>전체 초기화</button></div>
    <div className="prob-current" aria-live="polite"><strong>{frame.label}</strong><p>{frame.explanation}</p></div>
    <p className="prob-verdict" data-equal-mean={model.equalMean}>{model.verdict}</p>
    {play.step === 2 && prediction && <p className="prob-feedback">{prediction === 'same' ? '예측과 같습니다.' : '가운데 순위를 다시 보세요.'} 큰 값이 20·60·110만원일 때도 5번째와 6번째는 모두 10만원입니다.</p>}
    <details className="prob-static"><summary>구간 폭만 바꾸어 그림 비교하기</summary><label className="prob-select">같은 폭의 지출 구간<select value={params.binWidth} onChange={e => change({ binWidth: Number(e.target.value) })}><option value={10}>10만원</option><option value={20}>20만원</option><option value={40}>40만원</option></select></label>
      <p>구간을 합치면 모양은 달라져도 점·합계·평균·중앙값은 그대로입니다. 막대 길이는 가구 수이며 모든 막대의 최대는 10가구입니다.</p>
      {model.groups.map(group => <section key={group.id} data-histogram={group.id}><h4>{group.label}</h4>{group.bins.map(bin => <div className="prob-bin" key={bin.lower}><span>{bin.lower}–{bin.upper}<small>{bin.last ? '끝값 포함' : '끝값 미포함'}</small></span><div className="prob-count-track"><i style={{ width: `${bin.fraction * 100}%` }} data-count={bin.count} data-fraction={bin.fraction} /></div><b>{bin.count}가구</b></div>)}</section>)}
    </details>
    <StaticTable title="전체 기록과 요약을 정적으로 읽기"><table><caption>가상 10가구의 한 달 지출 · 만원</caption><thead><tr><th>기록</th><th>고른 집단</th><th>꼬리 집단</th></tr></thead><tbody>{model.groups[0].values.map((_, i) => <tr key={i}><th>{i + 1}번 가구</th>{model.groups.map(group => <td key={group.id}>{group.values[i]}</td>)}</tr>)}{(['mean', 'median', 'sd', 'iqr', 'max'] as const).map((key, i) => <tr key={key}><th>{['평균', '중앙값', '표준편차', 'IQR', '최댓값'][i]}</th>{model.groups.map(group => <td key={group.id}>{number(group.summary[key])}</td>)}</tr>)}</tbody></table><ol>{model.frames.map(f => <li key={f.label}><b>{f.label}</b> · {f.explanation}</li>)}</ol></StaticTable>
    <p className="prob-note">전체 10가구의 기술값입니다. 실제 가계나 미래 위험을 추정하지 않습니다. 표준편차는 평균에서 떨어진 정도를 금액 단위로 요약하며 손실 상한이 아닙니다.</p>
  </section>;
}
function OutcomeBar({ row, cashFraction, cash, id }: { row: LossRow | null; cashFraction: number; cash: number; id: string }) {
  return <div className="prob-outcome" data-outcome={id} data-loss={row?.loss ?? 'unknown'} data-funded={row?.funded ?? 0} data-shortage={row?.shortage ?? 'unknown'}>
    <h4>{id} · {row ? `${money(row.loss)} 손실 대안` : '아직 결과 미확정'}</h4>
    <div className="prob-money-track" role="img" aria-label={row ? `${id}. 손실 ${money(row.loss)}, 충당 ${money(row.funded)}, 부족 ${money(row.shortage)}, 납기 현금 ${money(cash)}. 공통 축 0–1700만원.` : `${id}. 아직 손실 미확정, 납기 현금 ${money(cash)}.`}>
      <i className="prob-funded" data-fraction={row?.fundedFraction ?? 0} style={{ width: `${(row?.fundedFraction ?? 0) * 100}%` }} /><i className="prob-shortage" data-fraction={row?.shortageFraction ?? 0} style={{ left: `${(row?.fundedFraction ?? 0) * 100}%`, width: `${(row?.shortageFraction ?? 0) * 100}%` }} /><b className="prob-cash-line" style={{ left: `${cashFraction * 100}%` }} />
    </div><div className="prob-axis"><span>0</span><span>1,700만원</span></div>
    <dl className="prob-numbers"><div><dt>현금 충당</dt><dd>{money(row?.funded ?? 0)}</dd></div><div><dt>미충당</dt><dd>{row ? money(row.shortage) : '미확정'}</dd></div><div><dt>남은 현금</dt><dd>{money(row?.remaining ?? cash)}</dd></div></dl>
  </div>;
}
export function LossLiquidityLab() {
  const [params, setParams] = useState<LossParams>({ ...lossDefaults }), [prediction, setPrediction] = useState('');
  const model = lossModel(params), play = useObservation(model.frames.length - 1), frame = model.frames[play.step];
  const change = (values: Partial<LossParams>) => { setParams(p => ({ ...p, ...values })); setPrediction(''); play.rewind(); };
  const reset = () => { setParams({ ...lossDefaults }); setPrediction(''); play.rewind(); };
  return <section className="prob-lab" data-prob-lab="losses" aria-label="손실의 꼬리와 납기 현금 실험">
    <p className="prob-eyebrow">모형 가정 · 한 가상 기간 · 만원</p><h3>평균이 같아도 경계 밖의 손실은 다릅니다</h3>
    <figure className="prob-figure"><div className="prob-case-grid">{model.cases.map(c => <section key={c.id} data-loss-case={c.id}><h4>{c.label}</h4>{c.rows.map(row => <div className="prob-mass-row" key={row.index}><span>손실 {money(row.loss)}</span><div className="prob-probability-track"><i data-probability={row.probability} style={{ width: `${row.probability * 100}%` }} /></div><b>{percent(row.probability)}</b></div>)}<p className="prob-equal">기대손실 <b>{money(c.expectedLoss)}</b></p></section>)}</div><figcaption>짧은 가로 막대는 확률이며 각 사례에서 합100%입니다. 1% 막대에도 직접 라벨을 붙였습니다. 실제 앞으로 100번의 결과를 배정한 표가 아닙니다.</figcaption></figure>
    <figure className="prob-figure"><ol className="prob-timeline">{model.timeline.map((event, i) => <li key={`${event.day}-${i}`} data-day={event.day}><b>{event.day}일</b><span>{event.label}</span><strong>{event.meaning} {money(event.amount)}</strong></li>)}</ol><figcaption>처음 현금에 30일의 확정 외부 유입100만원만 추가합니다. 같은 날이면 입금 뒤 지출합니다. 이 그림은 지출 전의 날짜 비교이며 손실 후 잔액을 잇는 장부가 아닙니다. 납기 전의 돈만 셉니다.</figcaption></figure>
    <div className="prob-near-controls"><div className="prob-controls"><label>처음 준비한 현금<select value={params.cash} onChange={e => change({ cash: Number(e.target.value) })}>{[0, 200, 300, 1600].map(v => <option key={v} value={v}>{money(v)}</option>)}</select></label><label>지출 납기<select value={params.dueDay} onChange={e => change({ dueDay: Number(e.target.value) })}>{[15, 30, 45].map(v => <option key={v} value={v}>{v}일</option>)}</select></label></div>
      <p className="prob-cash-status" data-cash-at-due={model.cashAtDue}>납기 현금 {money(model.cashAtDue)} · {model.arrived ? '30일의 100만원 포함' : '나중에 올 100만원은 제외'}</p>
      <label>큰 손실 대안에서 B의 부족액은?<select aria-label="B의 큰 손실 부족 예측" value={prediction} onChange={e => setPrediction(e.target.value)}><option value="">먼저 예상하기</option><option value="average">기대손실과 같다</option><option value="boundary">손실에서 납기 현금을 뺀 부족분이다</option></select></label>{play.controls}<button className="prob-reset" onClick={reset}>전체 초기화</button>
    </div>
    <div className="prob-current" aria-live="polite"><strong>{frame.label}</strong><p>{frame.explanation}</p></div>
    <figure className="prob-figure"><div className="prob-legend"><span>초록 = 현금 충당</span><span>사선 = 미충당</span><span>검정 점선 = 납기 현금</span></div>{frame.cases.map(c => <OutcomeBar key={c.id} id={c.id} row={c.row} cash={model.cashAtDue} cashFraction={model.cashFraction} />)}<figcaption>가로 길이는 금액입니다. 위 확률 막대와 다른 단위입니다. A와 B는 0–1,700만원의 같은 축이며 충당액+미충당액=선택한 대안의 손실입니다.</figcaption></figure>
    <p className="prob-verdict">{model.verdict}</p>
    <div className="prob-summary-grid">{model.cases.map(c => <p key={c.id} data-expected-shortage={c.expectedShortage}>{c.id} · 부족 확률 {percent(c.shortageProbability)}<br/>기대부족액 {money(c.expectedShortage)}</p>)}</div>
    {play.step === 3 && prediction && <p className="prob-feedback">{prediction === 'boundary' ? '예측과 같습니다.' : '평균과 한 번의 부족액을 나눠 보세요.'} 현재 B의 큰 손실 부족은 {money(model.cases[1].rows[2].shortage)}입니다. 기대부족액 {money(model.cases[1].expectedShortage)}은 여러 대안을 확률로 가중한 값입니다.</p>}
    <StaticTable title="모든 손실 대안과 충당 내역 읽기"><table><caption>모형의 가능한 대안 · 금액은 만원</caption><thead><tr><th>사례</th><th>손실</th><th>확률</th><th>충당</th><th>미충당</th><th>남음</th></tr></thead><tbody>{model.cases.flatMap(c => c.rows.map(row => <tr key={`${c.id}-${row.index}`}><th>{c.id}</th><td>{number(row.loss)}</td><td>{percent(row.probability)}</td><td>{number(row.funded)}</td><td>{number(row.shortage)}</td><td>{number(row.remaining)}</td></tr>))}</tbody></table><ol>{model.frames.map(f => <li key={f.step}><b>{f.label}</b> · {f.explanation}</li>)}</ol></StaticTable>
    <p className="prob-note">재생은 서로 배타적인 대안을 비교하는 관찰 순서입니다. 실제 여러 기간의 손실을 누적하지 않습니다. 늦은 유입은 과거 부족을 지우지 않습니다. 기대부족액은 이 사례의 현금 경계 함수이며 금융규제의 Expected Shortfall/VaR가 아닙니다.</p>
  </section>;
}
