import { useState } from 'react';
import { frequencyDefaults, frequencyModel, type FrequencyParams } from '../../simulations/probability/frequency.mjs';
import { conditionalDefaults, conditionalModel, signalModes, type ConditionalParams, type NaturalCounts } from '../../simulations/probability/conditional.mjs';
import { teachingSeed } from '../../simulations/probability/seeded.mjs';
import { number, percent, useObservation, StaticTable } from './shared';
import './probability.css';
const probabilityLabel = (value: number | null, possible = true) => value === null ? '정의되지 않음' : !possible ? '0% · 불가능' : value < .000001 ? '0.0001% 미만 · 0 아님' : percent(value);

export function FrequencyLab() {
  const [params, setParams] = useState<FrequencyParams>({ ...frequencyDefaults }), [prediction, setPrediction] = useState('');
  const model = frequencyModel(params), play = useObservation(model.frames.length - 1), frame = model.frames[play.step];
  const change = (next: Partial<FrequencyParams>) => { setParams(p => ({ ...p, ...next })); setPrediction(''); play.rewind(); };
  const reset = () => { setParams({ ...frequencyDefaults }); setPrediction(''); play.rewind(); };
  return <section className="prob-lab prob-frequency" data-prob-lab="frequency" aria-label="이론 확률과 고정 관측 기록 실험">
    <p className="prob-eyebrow">가정한 이론 분포와 고정 수열의 가상 기록 · 실제 결제 자료 아님</p>
    <h3>기대 {number(model.theory.expected)}건은 할당량이 아닙니다</h3>
    <div className="prob-near-controls prob-controls"><label>모형의 전체 건수<select aria-label="모형의 전체 건수" value={params.n} onChange={e => change({ n: Number(e.target.value) })}>{[10, 100, 1000].map(n => <option key={n} value={n}>{number(n)}건</option>)}</select></label><label>모형의 1건당 지연 확률<select aria-label="모형의 1건당 지연 확률" value={params.p} onChange={e => change({ p: Number(e.target.value) })}>{[0, .01, .02, 1].map(p => <option key={p} value={p}>{percent(p)}</option>)}</select></label></div>
    <figure className="prob-figure prob-theory" data-theory-n={params.n} data-theory-p={params.p}>
      <h4>이론 · 전체 {number(params.n)}건의 지연 횟수</h4>
      <p>독립·일정확률 가정. 가로 길이 = 해당 횟수 묶음의 확률. 각 막대는 같은 0–100% 축입니다.</p>
      <div className="prob-probability-axis"><span>0%</span><span>확률</span><span>100%</span></div>
      {model.massGroups.map(group => <div className="prob-frequency-mass" key={group.lower} data-lower={group.lower} data-upper={group.upper}><strong>{group.label}</strong><div className="prob-probability-track"><i data-mass={group.probability} style={{ width: `${group.probability * 100}%` }} /></div><span>{probabilityLabel(group.probability, group.possible)}</span></div>)}
      <dl className="prob-numbers"><div><dt>이론 기대 횟수</dt><dd data-expected={model.theory.expected}>{number(model.theory.expected)}건</dd></div><div><dt>이론 0건 확률</dt><dd data-zero-probability={model.theory.zeroProbability}>{probabilityLabel(model.theory.zeroProbability, model.theory.zeroPossible)}</dd></div></dl>
      <figcaption>‘합계’ 행은 여러 횟수의 확률을 합친 것입니다. 횟수 구간 폭이 다르므로 밀도 히스토그램이 아닙니다. 기대 소수 건수는 평균이며 한 기록의 정수 건수와 다릅니다.</figcaption>
    </figure>
    <div className="prob-near-controls"><label>고정 가상 기록 번호<select aria-label="고정 가상 기록 번호" value={params.sampleIndex} onChange={e => change({ sampleIndex: Number(e.target.value) })}>{[0, 1, 2].map(i => <option value={i} key={i}>{i + 1}번 기록</option>)}</select></label><label>기대 횟수와 관측 횟수는 항상 같을까요?<select aria-label="기대 횟수 예측" value={prediction} onChange={e => setPrediction(e.target.value)}><option value="">먼저 예상하기</option><option value="same">매번 기대 횟수와 같아야 한다</option><option value="different">관측 횟수는 달라질 수 있다</option></select></label>{play.controls}<button className="prob-reset" onClick={reset}>전체 초기화</button></div>
    <figure className="prob-figure prob-records" data-record-index={params.sampleIndex} data-seen={frame.seen} data-events={frame.count}>
      <h4>관측 · {params.sampleIndex + 1}번 가상 기록</h4>
      <p>한 칸은 순서가 붙은 {number(model.groupSize)}건 묶음입니다. ‘지연’ 숫자와 채운 높이는 그 안의 지연 건수입니다. 아직 펼치지 않은 기록은 0건으로 세지 않습니다.</p>
      <div className="prob-record-grid">{frame.groups.map(group => <div className="prob-record-group" key={group.lower} data-record-lower={group.lower} data-record-seen={group.seen} data-record-count={group.count} data-unseen={!group.seen}><small>{group.lower === group.upper ? group.lower : `${group.lower}–${group.upper}`}번</small><div className="prob-record-meter"><i style={{ height: `${group.fraction * 100}%` }} data-fraction={group.fraction} /><strong>{group.seen ? group.count : '—'}</strong></div><span>{group.seen ? `지연 ${group.count}` : '미관측'}</span><small>관찰 {group.seen}/{group.size}건</small></div>)}</div>
      <p className="prob-denominator">현재 지연 {frame.count}건 ÷ 관찰 {number(frame.seen)}건 = <strong data-observed-rate={frame.rate ?? 'undefined'}>{frame.rate === null ? '정의되지 않음' : percent(frame.rate)}</strong></p>
      <figcaption>이 비율은 선택한 고정 기록에서 센 값입니다. 위의 가정 p나 실제 결제의 지연 확률로 바꿔 부르지 않습니다. 높이의 최대는 칸당 {number(model.groupSize)}건이며, 작은 채움도 숫자로 확인합니다.</figcaption>
    </figure>
    <div className="prob-current" aria-live="polite"><strong>{frame.label}</strong><p>{frame.explanation}</p></div>
    {play.step === model.frames.length - 1 && <p className="prob-verdict">{model.verdict}</p>}
    {play.step === model.frames.length - 1 && prediction && <p className="prob-feedback">{prediction === 'different' ? '예측과 같습니다.' : '기대값과 관측값을 다시 나누어 보세요.'} 기대 횟수는 매번 맞춰야 할 할당량이 아닙니다. 어떤 기록은 우연히 기대 횟수와 같을 수도 있습니다.</p>}
    <figure className="prob-figure prob-relative-change"><h4>같은 변화, 같은 분모</h4><div className="prob-summary-grid"><p>{percent(model.comparison.before)} → {percent(model.comparison.after)}<br/>절대 +{number(model.comparison.absoluteChange * 100)}%p</p><p>상대 +{percent(model.comparison.relativeChange)}<br/>원래 확률의 두 배</p></div><p>같은 {number(model.comparison.denominator)}건의 기대 횟수: {model.comparison.expectedBefore} → {model.comparison.expectedAfter}건</p><figcaption>이 작은 비교는 위 선택과 별개인 1%→2%의 고정 예입니다. 실제 횟수를 보장하지 않습니다.</figcaption></figure>
    <StaticTable title="이론의 모든 횟수와 확률 읽기"><table><caption>{number(params.n)}건의 이론 분포 · 독립·일정 p={percent(params.p)}</caption><thead><tr><th>지연 횟수</th><th>이론 확률</th></tr></thead><tbody>{model.theory.rows.map(row => <tr key={row.k}><th>{number(row.k)}건</th><td>{probabilityLabel(row.probability, row.possible)}</td></tr>)}</tbody></table></StaticTable>
    <StaticTable title="선택한 가상 기록 전체와 단계 읽기"><table><caption>{params.sampleIndex + 1}번 기록 · 전체 {number(params.n)}건</caption><thead><tr><th>순서</th><th>지연 여부</th></tr></thead><tbody>{model.records.map(row => <tr key={row.index}><th>{row.index}번</th><td>{row.event ? '지연 1' : '지연 없음 0'}</td></tr>)}</tbody></table><ol>{model.frames.map(f => <li key={f.step}><strong>{f.label}</strong> · {f.explanation}</li>)}</ol></StaticTable>
    <details className="prob-static"><summary>재현 규칙과 숫자 정밀도</summary><p>xoshiro128 star-star 1.1 · 초기 상태 {teachingSeed.map(n => n.toString(16)).join(', ')}. 기록 번호마다 고정 1,000개 블록의 앞 n개를 씁니다. 시간·화면 렌더·재생 횟수에 따라 수열을 새로 만들지 않습니다.</p><p>32비트 출력의 u값을 p와 비교합니다. 이 유한 격자의 임계값 차이는 2의 −32제곱보다 작습니다. 이론 분포의 p와 의사난수 기록의 유한 정밀도를 구분하며, 기록 생성으로 독립성이나 현실 확률을 검증했다고 주장하지 않습니다. 아주 작은 양의 확률은 0% 대신 ‘0.0001% 미만’으로 표시합니다.</p></details>
  </section>;
}

function CountTable({ counts }: { counts: NaturalCounts }) {
  return <table><caption>동일한 가상 청구서 {number(counts.total)}건 · 셀 단위는 건</caption><thead><tr><th>실제 상태</th><th>알림</th><th>알림 없음</th><th>합</th></tr></thead><tbody><tr><th>오류</th><td data-count-cell="tp">{number(counts.tp)}</td><td data-count-cell="fn">{number(counts.fn)}</td><td>{number(counts.errors)}</td></tr><tr><th>정상</th><td data-count-cell="fp">{number(counts.fp)}</td><td data-count-cell="tn">{number(counts.tn)}</td><td>{number(counts.normal)}</td></tr><tr><th>합</th><td>{number(counts.alerted)}</td><td>{number(counts.silent)}</td><td>{number(counts.total)}</td></tr></tbody></table>;
}
export function ConditionalLab() {
  const [params, setParams] = useState<ConditionalParams>({ ...conditionalDefaults }), [prediction, setPrediction] = useState('');
  const model = conditionalModel(params), { counts } = model, play = useObservation(model.frames.length - 1), frame = model.frames[play.step];
  const change = (next: Partial<ConditionalParams>) => { setParams(p => ({ ...p, ...next })); setPrediction(''); play.rewind(); };
  const reset = () => { setParams({ ...conditionalDefaults }); setPrediction(''); play.rewind(); };
  return <section className="prob-lab prob-conditional" data-prob-lab="conditional" aria-label="알림의 조건과 자연빈도 실험">
    <p className="prob-eyebrow">자체 가상 건수 · 각 청구서를 같은 가능성으로 한 건 선택</p><h3>알림의 분모 안으로 다시 모읍니다</h3>
    <div className="prob-near-controls"><div className="prob-controls"><label>전체 중 실제 오류<select aria-label="전체 중 실제 오류" value={params.errors} onChange={e => change({ errors: Number(e.target.value) })}>{[0, 100, 1000, 10000].map(n => <option key={n} value={n}>{number(n)}건 / 10,000건</option>)}</select></label><label>가상 알림 규칙<select aria-label="가상 알림 규칙" value={params.signal} onChange={e => change({ signal: e.target.value as ConditionalParams['signal'] })}>{Object.entries(signalModes).map(([id, mode]) => <option key={id} value={id}>{mode.label}</option>)}</select></label></div><p>가정: 오류일 때 알림 {percent(model.mode.sensitivity)}, 정상일 때 알림 {percent(model.mode.falsePositive)}. 실제 성능 추정값이 아닙니다.</p></div>
    <figure className="prob-figure prob-count-tree" data-count-stage={play.step}>
      <div className="prob-count-root"><strong>전체 {number(counts.total)}건</strong><span>같은 청구서 전체를 나눕니다</span></div>
      {play.step >= 1 && <div className="prob-truth-branches">{[{ id: 'error', label: '실제 오류', total: counts.errors, cells: counts.cells.slice(0, 2) }, { id: 'normal', label: '실제 정상', total: counts.normal, cells: counts.cells.slice(2) }].map(branch => <section className="prob-count-branch" data-truth={branch.id} key={branch.id}><div className="prob-count-parent"><strong>{branch.label} {number(branch.total)}건</strong><small>전체 {number(counts.total)}건 중</small></div>{play.step >= 2 && <div className="prob-count-leaves">{branch.cells.map(cell => <div className="prob-count-leaf" data-cell={cell.id} data-count={cell.count} data-selected={play.step === 3 && frame.selected.includes(cell.id)} data-outside={play.step === 3 && !frame.selected.includes(cell.id)} key={cell.id}><b>{cell.alert === '알림' ? '● 알림' : '○ 알림 없음'}</b><strong>{number(cell.count)}건</strong><small>{branch.label} {number(branch.total)}건 중</small></div>)}</div>}</section>)}</div>}
      <figcaption>연결선은 집합의 분할이며 인과 화살표가 아닙니다. 상자 넓이는 확률을 뜻하지 않습니다. 마지막 단계는 ● 알림 두 칸을 선택하며, ○ 칸의 기록을 삭제하지 않습니다.</figcaption>
    </figure>
    <div className="prob-near-controls prob-conditional-stage-controls"><label>알림 중 오류를 셀 때 분모는?<select aria-label="조건부 분모 예측" value={prediction} onChange={e => setPrediction(e.target.value)}><option value="">먼저 예상하기</option><option value="all">전체 청구서</option><option value="errors">실제 오류만</option><option value="alerts">알림 받은 청구서 전체</option></select></label>{play.controls}<button className="prob-reset" onClick={reset}>전체 초기화</button></div>
    <div className="prob-current" aria-live="polite"><strong>{frame.label}</strong><p>{frame.explanation}</p><p className="prob-denominator" data-selected-denominator={frame.denominator}>이 단계에서 고른 분모: {number(frame.denominator)}건</p></div>
    {play.step === 3 && <figure className="prob-figure prob-alert-selection" data-alerts={counts.alerted}><h4>● 알림 받은 {number(counts.alerted)}건만 선택</h4>{counts.alerted ? <><div className="prob-alert-parts" role="img" aria-label={`알림 ${counts.alerted}건 중 오류 ${counts.tp}건, 정상 ${counts.fp}건. 공통 선택 집단의 비중.`}>{counts.alertedParts.map(part => <i key={part.id} data-part={part.id} data-fraction={part.fraction} style={{ width: `${(part.fraction ?? 0) * 100}%` }} />)}</div><div className="prob-axis"><span>0%</span><span>선택한 알림의 비중</span><span>100%</span></div><ul className="prob-selected-counts">{counts.alertedParts.map(part => <li key={part.id}>{part.id === 'tp' ? '짙은색' : '사선'} · {part.label} {number(part.count)} / {number(counts.alerted)}건 = {probabilityLabel(part.fraction, part.count > 0)}</li>)}</ul></> : <p className="prob-empty-selection">빈 조건 집합 · 알림 0건<br/>0÷0을 0%로 표시하지 않습니다.</p>}<p className="prob-verdict">{model.verdict}</p><figcaption>이 막대에서만 길이는 확률 비중입니다. 분모는 전체 {number(counts.total)}건이나 오류 {number(counts.errors)}건이 아니라 알림 {number(counts.alerted)}건입니다.</figcaption></figure>}
    {play.step === 3 && prediction && <p className="prob-feedback">{prediction === 'alerts' ? '예측과 같습니다.' : '질문이 선택한 집합을 다시 보세요.'} 알림 받은 청구서 전체가 분모입니다. 그 분모가 0이면 비율은 정의되지 않습니다.</p>}
    <div className="prob-summary-grid"><p>오류 중 알림<br/>{number(counts.sensitivity.numerator)} / {number(counts.sensitivity.denominator)}건<br/><strong>{probabilityLabel(counts.sensitivity.value, counts.tp > 0)}</strong></p><p>알림 중 오류<br/>{number(counts.posterior.numerator)} / {number(counts.posterior.denominator)}건<br/><strong>{probabilityLabel(counts.posterior.value, counts.tp > 0)}</strong></p></div>
    <StaticTable title="네 칸 전체와 조건별 분모 읽기"><CountTable counts={counts} /><ol>{model.frames.map(f => <li key={f.step}><strong>{f.label}</strong> · {f.explanation}</li>)}</ol></StaticTable>
    <p className="prob-note">기저율·알림 규칙·건수는 모두 가정입니다. 실제 성능 추정의 불확실성과 같은 알림의 중복 사용을 이 표가 해결하지 않습니다. 개인의 오류·사기·신용 여부를 판단하지 않습니다.</p>
  </section>;
}
