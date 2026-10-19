import { useState } from 'react';
import { usePlayback } from '../money/shared';
import { Building, Person, Prediction, StaticTable, number, percent } from './shared';
import { readingIds, readingCategories, readingDossier, readingFrames, assessReading, classifyReadingPrediction, type ReadingId, type ReadingCategory, type ReadingStructure } from '../../simulations/investing/reading-investments.mjs';
import './investing.css';
import './reading-investments.css';

const won = (value: number) => `${number(value)}원`;
const categoryLabel = (id: ReadingCategory) => readingCategories.find(row => row.id === id)!.label;

function InvestmentStructure({ structure }: { structure: ReadingStructure }) {
  return <figure className={`reading-structure reading-${structure.kind}`} data-testid="reading-structure" data-kind={structure.kind} aria-label={`${structure.kind === 'stock' ? '회사 지분 직접 보유' : structure.kind === 'bond' ? '채권자의 지급 청구와 날짜별 약속' : 'ETF 지분과 안쪽 자산의 포함 관계'} 그림`}>
    {structure.kind === 'stock' && <div className="reading-ownership">
      <Person observer><strong>{structure.investor}</strong><span>관찰자 {number(structure.heldShares)}주</span></Person>
      <div className="reading-relation"><b>지분 {percent(structure.ownership)}</b><i aria-hidden="true" /><small>관계 표시 · 매매 경로 아님</small></div>
      <Building><strong>{structure.company}</strong><span>발행 {number(structure.totalShares)}주 전체</span><div className="reading-share-grid" aria-label={`전체 ${number(structure.totalShares)}주 중 관찰자 ${number(structure.heldShares)}주`}>{structure.cells.map(cell => <i key={cell.index} className={cell.held ? 'held' : ''} aria-hidden="true" />)}</div><small>진한 테두리 1칸 = 관찰자 {structure.cellShares}주</small></Building>
    </div>}
    {structure.kind === 'bond' && <>
      <div className="reading-bond-parties"><Person observer><strong>{structure.investor}</strong></Person><div className="reading-relation"><b>원리금을 청구</b><i aria-hidden="true" /><small>회사 소유 지분과 다름</small></div><Building><strong>{structure.company}</strong></Building></div>
      <div className="reading-contract"><strong>지급 약속의 시간표 · 아직 받은 현금 아님</strong><ol className="reading-promise-line">{structure.schedule.map(payment => <li key={payment.date}><time>{payment.date}</time><div className="reading-coupon"><i aria-hidden="true" /><span>이자 {won(payment.coupon)}</span></div>{payment.principal > 0 && <div className="reading-principal"><i aria-hidden="true" /><span>원금 {won(payment.principal)}</span></div>}<b>약속 합계 {won(payment.total)}</b></li>)}</ol></div>
    </>}
    {structure.kind === 'etf' && <div className="reading-fund-route">
      <Person observer><strong>{structure.investor}</strong><span>관찰자 {number(structure.heldUnits)}좌</span></Person>
      <div className="reading-relation"><b>펀드의 {percent(structure.fundFraction)}</b><i aria-hidden="true" /><small>기업에는 간접 노출</small></div>
      <div className="reading-fund-boundary"><strong>{structure.fund}</strong><span>전체 {number(structure.issuedUnits)}좌 · 안에 담긴 주식</span><div className="reading-holdings-bar" role="img" aria-label={structure.holdings.map(row => `${row.asset} ${percent(row.weight)}`).join(', ')}>{structure.holdings.map(row => <i key={row.code} className={`asset-${row.code}`} style={{ width: `${row.weight * 100}%` }}><b>{row.code}</b></i>)}</div><div className="reading-holdings-labels">{structure.holdings.map(row => <div key={row.code}><b>{row.code} · {row.asset} {percent(row.weight)}</b><span>내 NAV 기준 간접 노출 {won(row.exposure)}</span></div>)}</div><small>보유 목록 기준일 {structure.holdingsAsOf}</small></div>
    </div>}
    <figcaption>{structure.caption}</figcaption>
  </figure>;
}

export function ReadingCategories() {
  return <div className="reading-category-key" aria-label="자료 성격의 네 가지 구분">{readingCategories.map(row => <div key={row.id} className={`reading-category-${row.id}`}><strong>{row.label}</strong><p>{row.description}</p></div>)}</div>;
}

export function ReadingInvestmentsLab() {
  const [id, setId] = useState<ReadingId>('stock');
  const [prediction, setPrediction] = useState('');
  const [answers, setAnswers] = useState<Record<string, ReadingCategory>>({});
  const [sourceAnswer, setSourceAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const result = readingFrames(id), dossier = result.dossier;
  const play = usePlayback(result.frames.length - 1);
  const frame = result.frames[play.step];
  const assessment = assessReading(id, answers, sourceAnswer);
  const predictionCorrect = classifyReadingPrediction(id, prediction);
  const clear = () => { setPrediction(''); setAnswers({}); setSourceAnswer(''); setChecked(false); play.rewind(); };
  const selectDossier = (next: ReadingId) => { setId(next); clear(); };
  const classify = (claimId: string, value: string) => {
    setAnswers(previous => { const next = { ...previous }; if (value) next[claimId] = value as ReadingCategory; else delete next[claimId]; return next; });
    setChecked(false);
  };
  return <section className="invest-lab reading-lab" aria-label="가상 투자 설명 읽기 실험">
    <h3>설명서 세 개를 같은 질문으로 읽어 봅니다</h3>
    <p className="invest-note">모두 직접 만든 가상 자료입니다. 실제 상품의 설명서를 복제하지 않았습니다. 재생은 읽는 순서의 강조만 바꾸며 거래·현금 지급·미래 가격을 실행하지 않습니다.</p>
    <label className="invest-control"><span>가상 투자 설명서 선택</span><select aria-label="가상 투자 설명서 선택" value={id} onChange={event => selectDossier(event.target.value as ReadingId)}>{readingIds.map(value => <option key={value} value={value}>{readingDossier(value).name}</option>)}</select></label>
    <div className="reading-dossier" data-testid="reading-dossier" data-dossier={id}>
      <small>자체 가상 설명서 · 관찰 기준 {dossier.asOf} · 원화({dossier.currency})</small>
      <h4>{dossier.name}</h4><p>{dossier.introduction}</p><p className="reading-headline">{dossier.headline}</p>
    </div>
    <Prediction question={dossier.predictionQuestion} value={prediction} onChange={setPrediction} options={[["guaranteed", "확정된 지급·수익이다"], ["not-guaranteed", "이 자료만으로 실제 지급·수익을 확정할 수 없다"]]} />
    {play.controls}<button onClick={() => { setId('stock'); clear(); }}>조건까지 초기화</button>
    <nav className="reading-step-links" aria-label="읽는 단계 바로 보기">{result.frames.map(row => <button key={row.index} aria-pressed={play.step === row.index} onClick={() => play.seek(row.index)}>{row.index + 1}. {row.label}</button>)}</nav>
    <h4 className="invest-stage" data-testid="reading-stage" aria-live="polite">{frame.label}</h4>
    <p className="invest-result" role="status">{play.step === result.frames.length - 1 && predictionCorrect !== null ? `${predictionCorrect ? '예측과 같습니다.' : '예측과 다릅니다.'} ` : ''}{frame.message}</p>
    <div className="reading-focus-region" data-active={frame.focus === 'structure'}><InvestmentStructure structure={frame.structure} /></div>
    <div className="reading-basis reading-focus-region" data-active={frame.focus === 'basis'} aria-label="가격·수익의 기간과 계산 기준"><h4>숫자 옆의 기준을 함께 읽습니다</h4><p>기간: {dossier.period} · 통화: 원화({dossier.currency})</p><dl>{dossier.metricRows.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl><p>{dossier.sections.find(row => row.id === 'cost')!.text}</p><p>{dossier.sections.find(row => row.id === 'liquidity')!.text}</p></div>
    <StaticTable title="투자 설명의 전체 관찰 단계"><table><thead><tr><th>확인 질문</th><th>읽는 방법</th></tr></thead><tbody>{result.frames.map(row => <tr key={row.index}><th>{row.label}</th><td>{row.message}</td></tr>)}</tbody></table></StaticTable>
    <details className="reading-dossier-details"><summary>가상 설명서 전체 · 권리부터 누락 정보까지</summary><dl>{dossier.sections.map(row => <div key={row.id}><dt>{row.label}</dt><dd>{row.text}</dd></div>)}</dl></details>
    <fieldset className="reading-classify reading-focus-region" data-active={frame.focus === 'claims'}><legend>네 문장의 성격을 골라 보세요</legend><p>‘관측·기록’은 자료에 기록돼 있다는 뜻입니다. 채권의 미래 지급 약속이 적혀 있어도 지급 완료를 관측한 것은 아닙니다.</p>{[2, 0, 3, 1].map(index => {
      const statement = dossier.claims[index], feedback = assessment.feedback.find(row => row.id === statement.id)!;
      return <div className="reading-claim" key={statement.id} data-claim={statement.id}><label><span>{index + 1}. {statement.text}</span><select aria-label={`${index + 1}번 문장 분류`} value={answers[statement.id] ?? ''} onChange={event => classify(statement.id, event.target.value)}><option value="">분류 선택</option>{readingCategories.map(category => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>{checked && <div className={`reading-feedback reading-category-${statement.category}`} data-testid="reading-feedback"><strong>{feedback.correct === null ? '아직 선택하지 않았습니다' : feedback.correct ? '분류 일치' : '분류 다시 확인'} · {categoryLabel(statement.category)}</strong><p>{feedback.reason}</p><p>반례·한계: {feedback.counterexample}</p></div>}</div>;
    })}</fieldset>
    <fieldset className="reading-source reading-focus-region" data-active={frame.focus === 'source'}><legend>질문에 맞는 첫 자료를 고릅니다</legend><label><span>{dossier.sourceQuestion}</span><select aria-label="추가 확인 자료 선택" value={sourceAnswer} onChange={event => { setSourceAnswer(event.target.value); setChecked(false); }}><option value="">확인 자료 선택</option>{dossier.sources.map(row => <option key={row.id} value={row.id}>{row.label}</option>)}</select></label><p>‘먼저 읽을 자료’의 답입니다. 한 자료만 읽으면 모든 판단이 끝난다는 뜻은 아닙니다.</p></fieldset>
    <button onClick={() => setChecked(true)}>분류·자료 선택 해설 보기</button>
    {checked && <div className="reading-source-feedback" data-testid="reading-source-feedback" role="status"><h4>{assessment.source.correct === null ? '자료를 아직 선택하지 않았습니다' : assessment.source.correct ? '질문에 맞는 첫 자료입니다' : '질문과 자료의 역할을 다시 맞춰 보세요'}</h4><p>{assessment.source.reason}</p><p>남는 한계: {assessment.source.limitation}</p><p>{assessment.counterexample}</p><p>이 해설은 자료 읽기 연습입니다. 상품 추천·적합성 점수·개인 비중을 판정하지 않습니다.</p></div>}
    <StaticTable title="모든 문장의 분류·이유·반례"><table><thead><tr><th>문장</th><th>분류</th><th>이유</th><th>반례·한계</th></tr></thead><tbody>{dossier.claims.map(row => <tr key={row.id}><td>{row.text}</td><th>{categoryLabel(row.category)}</th><td>{row.reason}</td><td>{row.counterexample}</td></tr>)}</tbody></table></StaticTable>
    <StaticTable title="확인 자료 세 가지의 역할과 한계"><table><thead><tr><th>확인 자료</th><th>이 질문의 첫 자료인가?</th><th>이유</th><th>남는 한계</th></tr></thead><tbody>{dossier.sources.map(row => <tr key={row.id}><th>{row.label}</th><td>{row.best ? '예' : '다른 질문에 유용'}</td><td>{row.reason}</td><td>{row.limitation}</td></tr>)}</tbody></table></StaticTable>
    <p className="invest-note">기본 계산·도형·분류·해설은 같은 가상 모델을 읽습니다. 실제 공시나 실시간 호가를 불러오지 않으며 개인 계좌·소득·자산을 입력하지 않습니다. 버튼과 전체 표로 재생 없이도 같은 내용을 확인할 수 있습니다.</p>
  </section>;
}
