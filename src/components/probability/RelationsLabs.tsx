import { useMemo, useState } from 'react';
import { associationDefaults, associationModel } from '../../simulations/probability/association.mjs';
import { dependenceDefaults, dependenceModel, nonlinearExample, type DependenceParams } from '../../simulations/probability/dependence.mjs';
import { number, percent, useObservation, StaticTable } from './shared';
import './probability.css';

const salesAxis = <div className="prob-axis"><span>0</span><span>100</span><span>200단위</span></div>;
function SalesBar({ value, fraction, kind }: { value: number; fraction: number; kind: string }) {
  return <><div className="prob-sales-track"><i data-sales-kind={kind} data-sales-value={value} data-sales-fraction={fraction} style={{ width: `${fraction * 100}%` }} /></div>{salesAxis}</>;
}
export function AssociationLab() {
  const [params, setParams] = useState({ ...associationDefaults }), [prediction, setPrediction] = useState('');
  const model = useMemo(() => associationModel(params), [params]), play = useObservation(3), frame = model.frames[play.step];
  const reset = () => { setParams({ ...associationDefaults }); setPrediction(''); play.rewind(); };
  return <section className="prob-lab prob-association" data-prob-lab="association" aria-label="계절 구성과 매출 비교 실험">
    <p className="prob-eyebrow">자체 가상 관측 요약 · 200건의 매장·일 · 실제 캠페인 효과 아님</p>
    <h3>전체 평균을 바꾸는 계절 구성</h3>
    <figure className="prob-figure prob-assoc-overview">
      <h4>원래 관측 · 두 집단은 각각 100건</h4>
      <p>가로 매출 막대는 같은 0–200단위 축입니다. 아래 구성 띠는 100건을 나눈 비율이며 매출액이 아닙니다.</p>
      {model.groups.map(g => <section key={g.group} data-assoc-group={g.group}>
        <h5>{g.label} · 평균 <strong>{number(g.observed.mean)}단위</strong></h5>
        <SalesBar value={g.observed.mean} fraction={g.observedFraction} kind={`observed-${g.group}`} />
        <div className="prob-season-strip" aria-label={`${g.label}의 관측 구성`}>
          <span className="low" data-season-weight={g.observedWeights.low} style={{ width: `${g.observedWeights.low * 100}%` }}>○</span>
          <span className="high" data-season-weight={g.observedWeights.high} style={{ width: `${g.observedWeights.high * 100}%` }}>■</span>
        </div>
        <p>○ 비수기 {number(g.observedWeights.low * g.observed.count)}건 · ■ 성수기 {number(g.observedWeights.high * g.observed.count)}건</p>
      </section>)}
      <figcaption>한 건은 한 매장의 하루입니다. 200건이 서로 독립인 무작위 실험이나 연속된 200일이라는 가정은 없습니다.</figcaption>
    </figure>
    <div className="prob-near-controls">
      <label>전체 평균이 낮으면 캠페인 효과도 음수일까요?
        <select aria-label="평균과 인과효과 예측" value={prediction} onChange={e => setPrediction(e.target.value)}>
          <option value="">먼저 예상하기</option><option value="negative">효과도 음수</option><option value="unknown">조건부터 확인</option>
        </select>
      </label>
      {play.controls}<button className="prob-reset" onClick={reset}>전체 초기화</button>
    </div>
    <div className="prob-current" data-association-stage={play.step} aria-live="polite"><strong>{frame.label}</strong><p>{frame.explanation}</p></div>
    {frame.strata && <figure className="prob-figure prob-assoc-strata">
      <h4>같은 계절의 두 평균</h4>
      {(['low', 'high'] as const).map(season => <section key={season}>
        <h5>{season === 'low' ? '○ 비수기' : '■ 성수기'}</h5>
        {model.cells.filter(c => c.season === season).map(c => <div key={c.group} data-season-cell={`${c.season}-${c.group}`}>
          <p>{c.group === 'used' ? '사용' : '미사용'} · {c.count}건 · 평균 {c.mean}단위</p>
          <SalesBar value={c.mean} fraction={c.meanFraction} kind={`${season}-${c.group}`} />
        </div>)}
      </section>)}
      <figcaption>두 계절 안에서는 사용 쪽이 각각 10단위 높습니다. 그렇다고 캠페인 때문에 10만큼 높아졌다고 판정할 수는 없습니다.</figcaption>
    </figure>}
    {frame.standardized && <figure className="prob-figure prob-assoc-standardized">
      <h4>별도 비교 · 두 집단에 같은 계절 비중</h4>
      <div className="prob-near-controls">
        <label>비교용 비수기 비중
          <select aria-label="비교용 비수기 비중" value={params.lowWeight} onChange={e => { setParams({ lowWeight: Number(e.target.value) }); setPrediction(''); play.seek(2); }}>
            {[0, .25, .5, .75, 1].map(w => <option key={w} value={w}>{percent(w)}</option>)}
          </select>
        </label>
        <p>두 집단 모두 ○ {percent(model.standardizedWeights.low)} · ■ {percent(model.standardizedWeights.high)}. 변경하면 비교 단계에서 멈춥니다.</p>
      </div>
      {model.groups.map(g => <section key={g.group} data-standardized-group={g.group}>
        <h5>{g.label} · 재가중 평균 <strong data-standardized-mean={g.standardized}>{number(g.standardized)}단위</strong></h5>
        <SalesBar value={g.standardized} fraction={g.standardizedFraction} kind={`standardized-${g.group}`} />
        <p>○ 기여 {number(g.contributions.low)} + ■ 기여 {number(g.contributions.high)} = {number(g.standardized)}<br/>원래 관측 평균은 여전히 {number(g.observed.mean)}입니다.</p>
      </section>)}
      <figcaption>새 기록을 만들거나 기존 기록의 계절을 바꾸지 않았습니다. 공통 가중치로 요약한 기술 비교이며 원래 표의 200건은 그대로입니다.</figcaption>
    </figure>}
    {frame.causes && <figure className="prob-figure prob-assoc-causes">
      <h4>공통 조건이라는 후보 설명</h4>
      <div className="prob-cause-top">계절</div>
      <svg className="prob-cause-branches" viewBox="0 0 100 45" preserveAspectRatio="none" aria-hidden="true"><path d="M50 0 V12 M50 12 L25 40 M50 12 L75 40" /><path d="M21 33 L25 40 L31 37 M69 37 L75 40 L79 33" /></svg>
      <div className="prob-cause-children"><div><p>{model.candidatePaths[0].label}</p><strong>캠페인 선택</strong></div><div><p>{model.candidatePaths[1].label}</p><strong>매출</strong></div></div>
      <p className="prob-unidentified-link">캠페인 선택 <span aria-hidden="true">? ⇢</span> 매출<br/>{model.candidatePaths[2].label}</p>
      <figcaption>점선·물음표는 후보와 미확인을 뜻합니다. 매장·가격·선택 이유 등 다른 설명도 남아 있습니다. {model.causalReason}.</figcaption>
    </figure>}
    {frame.causes && <p className="prob-verdict" data-causal-estimate="unavailable">{model.verdict}</p>}
    {frame.causes && prediction && <p className="prob-feedback">{prediction === 'unknown' ? '예측과 같습니다.' : '전체 평균의 방향과 계절 안의 방향이 다른 이유부터 보세요.'} 같은 구성으로 맞춘 비교도 무작위 배정의 증거는 아닙니다.</p>}
    <StaticTable title="원래 네 칸과 가중 비교·모든 단계 읽기">
      <table><caption>원래 관측 요약 · 한 건 = 매장·일 · 매출은 가상 단위</caption><thead><tr><th>계절</th><th>사용</th><th>건수</th><th>평균</th><th>합계</th></tr></thead><tbody>{model.cells.map(c => <tr key={`${c.season}-${c.group}`}><th>{c.season === 'low' ? '비수기' : '성수기'}</th><td>{c.group === 'used' ? '사용' : '미사용'}</td><td>{c.count}</td><td>{c.mean}</td><td>{number(c.sum)}</td></tr>)}</tbody></table>
      <table><caption>관측 평균과 별도 재가중 비교 · 인과효과 아님</caption><thead><tr><th>집단</th><th>원래 평균</th><th>공통 비중 평균</th></tr></thead><tbody>{model.groups.map(g => <tr key={g.group}><th>{g.label}</th><td>{number(g.observed.mean)}</td><td>{number(g.standardized)}</td></tr>)}</tbody></table>
      <p>비수기 {percent(model.standardizedWeights.low)}, 성수기 {percent(model.standardizedWeights.high)}. 인과효과: 판정 불가.</p>
      <ol>{model.frames.map(f => <li key={f.label}><strong>{f.label}</strong> · {f.explanation}</li>)}</ol>
    </StaticTable>
  </section>;
}

export function DependenceLab() {
  const [params, setParams] = useState<DependenceParams>({ ...dependenceDefaults }), [prediction, setPrediction] = useState(''), [selectedA, setSelectedA] = useState(0);
  const model = useMemo(() => dependenceModel(params), [params]), nonlinear = useMemo(() => nonlinearExample(selectedA), [selectedA]), play = useObservation(3), frame = model.frames[play.step];
  const reset = () => { setParams({ ...dependenceDefaults }); setPrediction(''); setSelectedA(0); play.rewind(); };
  return <section className="prob-lab prob-dependence" data-prob-lab="dependence" aria-label="개별 위험과 공동 손실 실험">
    <p className="prob-eyebrow">한 기간의 가상 확률모형 · 실제 시장 확률이나 관측 100회 아님</p><h3>각각 20%는 그대로, ‘둘 다’만 바꾸기</h3>
    <figure className="prob-figure prob-marginals"><h4>고정한 개별 분포</h4><p>각 대상은 20% 확률로 −20%, 나머지에는 0%입니다. 가로 띠는 사건 확률 0–100%입니다.</p>
      {(['A', 'B'] as const).map(name => <div key={name}><strong>{name === 'A' ? '● A' : '■ B'} 손실 확률 20%</strong><div className="prob-probability-track"><i style={{ width: `${(name === 'A' ? model.joint.pA : model.joint.pB) * 100}%` }} /></div></div>)}
      <figcaption>처음 1,000단위에서 출발하는 같은 기간입니다. 두 사건이 함께 일어나는 정도는 이 주변 확률만으로 정해지지 않습니다.</figcaption>
    </figure>
    <div className="prob-near-controls"><label>둘 다 손실 날 확률 가정<select aria-label="둘 다 손실 날 확률 가정" value={params.bothCount} onChange={e => { setParams(p => ({ ...p, bothCount: Number(e.target.value) })); setPrediction(''); play.seek(1); }}><option value="0">0% · 함께는 없음</option><option value="4">4% · 독립</option><option value="20">20% · 항상 동행</option></select></label><p>{model.relation}. 변경하면 짝짓기 단계에서 멈춥니다.</p>
      <label>평균이 같으면 큰 손실 확률도 같을까요?<select aria-label="기대손실과 공동 손실 예측" value={prediction} onChange={e => setPrediction(e.target.value)}><option value="">먼저 예상하기</option><option value="same">같다</option><option value="different">다를 수 있다</option></select></label>
      {play.controls}<button className="prob-reset" onClick={reset}>전체 초기화</button>
    </div>
    <div className="prob-current" data-dependence-stage={play.step} aria-live="polite"><strong>{frame.label}</strong><p>{frame.explanation}</p></div>
    {frame.joint && <figure className="prob-figure prob-joint-pairing"><h4>1칸 = 가정한 확률 1%</h4><p>A는 원, B는 사각형입니다. ●·■는 손실, ○·□는 손실 없음입니다. 한 칸의 두 기호가 함께 겪는 결과입니다.</p>
      <div className="prob-joint-grid">{model.joint.tokens.map(t => <span key={t.index} data-probability-cell={t.index} data-joint-state={t.state} aria-label={`${t.index + 1}번 확률 칸: A ${t.aLoss ? '손실' : '손실 없음'}, B ${t.bLoss ? '손실' : '손실 없음'}`}><b>{t.aLoss ? '●' : '○'}</b><b>{t.bLoss ? '■' : '□'}</b></span>)}</div>
      <table className="prob-joint-table"><caption>확률 100칸의 결합표 · 실제 사건 건수가 아님</caption><thead><tr><th>확률 칸</th><th>B 손실</th><th>B 없음</th><th>합</th></tr></thead><tbody>
        <tr><th>A 손실</th><td data-joint-count="both">{model.joint.cells[0].count}</td><td data-joint-count="a-only">{model.joint.cells[1].count}</td><td>{model.joint.aCount}</td></tr>
        <tr><th>A 없음</th><td data-joint-count="b-only">{model.joint.cells[2].count}</td><td data-joint-count="neither">{model.joint.cells[3].count}</td><td>{model.joint.total - model.joint.aCount}</td></tr>
        <tr><th>합</th><td>{model.joint.bCount}</td><td>{model.joint.total - model.joint.bCount}</td><td>{model.joint.total}</td></tr>
      </tbody></table>
      <figcaption>각각 손실의 합은 20칸입니다. ‘둘 다’는 {model.joint.bothCount}칸입니다. 0칸은 이 모형이 확률0으로 정한 결과이지, 현실에서 관측하지 못했다는 말이 아닙니다.</figcaption>
    </figure>}
    {frame.loss && <figure className="prob-figure prob-joint-losses"><h4>보유 금액을 적용한 네 결과</h4>
      <div className="prob-near-controls"><label>A 최초 보유 비중<select aria-label="A 최초 보유 비중" value={params.weightA} onChange={e => { setParams(p => ({ ...p, weightA: Number(e.target.value) })); setPrediction(''); play.seek(2); }}>{[0, .5, 1].map(w => <option key={w} value={w}>{percent(w)}</option>)}</select></label><p>A {number(model.allocation.a)} + B {number(model.allocation.b)} = 1,000단위. 변경하면 손실 계산 단계에서 멈춥니다.</p></div>
      <p>가로 길이는 손실액, 공통 0–200단위입니다. 확률과 금액은 다른 눈금입니다.</p>
      {model.outcomes.map(o => <div className="prob-joint-loss-row" key={o.id} data-loss-state={o.id}><strong>{o.label} · 확률 {percent(o.probability)}</strong><div className="prob-joint-amount-track"><i data-loss-fraction={o.fraction} style={{ width: `${o.fraction * 100}%` }} /><b style={{ left: `${model.thresholdFraction * 100}%` }} /></div><p>A 손실 {number(o.lossA)} + B 손실 {number(o.lossB)} = {number(o.loss)}단위<br/>기말 평가액 {number(o.ending)}단위{o.possible ? '' : ' · 이 모형의 확률0 결과'}</p></div>)}
      <div className="prob-axis"><span>0</span><span>100</span><span>200단위</span></div>
      <figcaption>점선은 손실 150단위 비교선입니다. 평가 손실이 곧 납부해야 할 현금 청구라는 뜻은 아닙니다. 외부 입출금·비용·세금·차입·재조정을 생략했습니다.</figcaption>
    </figure>}
    {frame.compare && <figure className="prob-figure prob-joint-distribution"><h4>같은 손실액끼리 확률 더하기</h4><p>가로 = 손실 단위, 세로 = 그 손실의 확률 0–100%. 점선은 150단위 비교선입니다.</p><span className="prob-mass-top">100%</span>
      <div className="prob-joint-mass">{model.distribution.map(r => <i key={r.loss} data-loss-mass={r.loss} data-mass-probability={r.probability} style={{ left: `${r.fraction * 100}%`, height: `${r.probability * 100}%` }} />)}<b className="prob-loss-threshold" style={{ left: `${model.thresholdFraction * 100}%` }} /></div>
      <div className="prob-axis"><span>0</span><span>100</span><span>200단위</span></div>
      <p>막대 바닥 = 확률 0%. {model.distribution.map(r => `${r.loss}단위: ${percent(r.probability)}`).join(' · ')}</p>
      <dl className="prob-numbers"><div><dt>기대손실</dt><dd data-expected-joint-loss={model.expectedLoss}>{number(model.expectedLoss)}단위</dd></div><div><dt>손실이 150을 넘을 확률</dt><dd data-exceeds-probability={model.exceedsProbability}>{percent(model.exceedsProbability)}</dd></div></dl>
      <figcaption>비교선 초과는 지출 실패나 법적 파산이 아닙니다. q와 손실 분포 모두 가정이며 실제 시장의 추정값이 아닙니다.</figcaption>
    </figure>}
    {frame.compare && <p className="prob-verdict">{model.verdict}</p>}
    {frame.compare && prediction && <p className="prob-feedback">{prediction === 'different' ? '예측과 같습니다.' : '반반 보유에서 q0%와20%를 비교해 보세요.'} 이름을 나눈 것과 함께 손실 나지 않는 조건은 다릅니다.</p>}
    <StaticTable title="확률·보유 금액·모든 결과와 단계 읽기">
      <p className="prob-table-hint">아래 긴 표는 좌우로 이동해 기말 금액까지 읽습니다. 표 영역에 포커스를 두면 방향키로도 이동할 수 있습니다.</p><table className="prob-joint-static-table"><caption>한 기간의 가정 · 확률과 금액의 단위를 구별</caption><thead><tr><th>결과</th><th>확률</th><th>A 손실</th><th>B 손실</th><th>합 손실</th><th>기말</th></tr></thead><tbody>{model.outcomes.map(o => <tr key={o.id}><th>{o.label}</th><td>{percent(o.probability)}</td><td>{number(o.lossA)}</td><td>{number(o.lossB)}</td><td>{number(o.loss)}</td><td>{number(o.ending)}</td></tr>)}</tbody></table>
      <table><caption>묶음 손실의 확률분포</caption><thead><tr><th>손실</th><th>확률</th></tr></thead><tbody>{model.distribution.map(r => <tr key={r.loss}><th>{r.loss}</th><td>{percent(r.probability)}</td></tr>)}</tbody></table>
      <ol>{model.frames.map(f => <li key={f.label}><strong>{f.label}</strong> · {f.explanation}</li>)}</ol>
    </StaticTable>
    <figure className="prob-figure prob-nonlinear-example"><h4>다른 반례 · 상관0이어도 의존할 수 있습니다</h4><p>별도의 세 결과를 각각 1/3로 가정합니다. 가로 A, 세로 B의 수익률입니다. 두 축 범위는 −25%에서25%이며 점 하나는 한 결과, 시간 순서가 아닙니다.</p>
      <div className="prob-near-controls"><label>A 결과 하나로 조건 짓기<select aria-label="비선형 반례의 A 결과" value={selectedA} onChange={e => setSelectedA(Number(e.target.value))}>{[-20, 0, 20].map(a => <option key={a} value={a}>{a}%</option>)}</select></label></div>
      <p className="prob-nonlinear-y">세로 B: 위 +25% · 가운데0 · 아래 −25%</p>
      <div className="prob-nonlinear-plot"><i className="zero-x" /><i className="zero-y" />{nonlinear.rows.map(r => <span key={r.index} className={r.selected ? 'selected' : ''} data-nonlinear-index={r.index} data-x={r.x} data-y={r.y} style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%` }} aria-label={`A ${r.a}%, B ${r.b}%, 확률 1/3${r.selected ? ', 선택됨' : ''}`}>●<small>({r.a}, {r.b})</small></span>)}</div>
      <div className="prob-axis"><span>A −25%</span><span>0</span><span>+25%</span></div>
      <p>선형상관 = <strong data-nonlinear-correlation={nonlinear.stats.correlation}>{number(nonlinear.stats.correlation)}</strong><br/>A가 {selectedA}%인 조건에서는 B가 {nonlinear.selected.b}%일 확률 <strong data-nonlinear-conditional={nonlinear.conditionalB}>{percent(nonlinear.conditionalB)}</strong>.<br/>조건 없이 B가 {nonlinear.selected.b}%일 확률은 {percent(nonlinear.marginalB)}입니다.</p>
      <table><caption>세 개의 원래 결과 · 선택해도 원래 분포는 그대로</caption><thead><tr><th>A</th><th>B</th><th>확률</th></tr></thead><tbody>{nonlinear.rows.map(r => <tr key={r.index}><th>{r.a}%{r.selected ? ' 선택' : ''}</th><td>{r.b}%</td><td>1/3</td></tr>)}</tbody></table>
      <figcaption>A를 알면 B가 정해지므로 독립이 아닙니다. 상관은 선형 동행의 요약이며 모든 의존의 척도가 아닙니다. 한쪽이 상수이면 상관 자체가 정의되지 않습니다.</figcaption>
    </figure>
  </section>;
}
