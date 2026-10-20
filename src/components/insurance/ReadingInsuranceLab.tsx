import { useState } from 'react';
import { usePlayback } from '../money/shared';
import { classifyReadingStatement, projectReading, readingBoundaryCases, readingClassifications, readingDefaults, readingDocuments, type ReadingChoice, type ReadingContract, type ReadingFrame, type ReadingOptions, type ReadingResult } from '../../simulations/insurance/reading.mjs';
import { InsurancePrediction, InsuranceTable, won } from './shared';
import './insurance.css';
import './reading-insurance.css';

const amountText = (value: number | null) => value === null ? '미정' : won(value);
const choiceOptions = Object.entries(readingClassifications) as [Exclude<ReadingChoice, ''>, string][];

export function ReadingInsuranceDocuments() {
  return <div className="reading-documents" aria-label="직접 작성한 세 가상 계약 발췌">
    {readingDocuments.map(document => <article key={document.id} className="reading-document" data-reading-document={document.id}>
      <header><span className="reading-paper-icon" aria-hidden="true">{document.id.toUpperCase()}</span><h3>{document.name}</h3></header>
      <p className="reading-document-stamp">교육용 자체 문서 · 실제 판매 상품 아님</p>
      <dl>{document.clauses.map(clause => <div key={clause.id} data-reading-clause={clause.id}><dt>{clause.id}</dt><dd>{clause.text}</dd></div>)}</dl>
    </article>)}
    <p className="insurance-note">모든 날짜는 각 계약의 0일을 맞춘 가상 경과일입니다. 같은 인물·같은 손실을 비교하지만 세 계약을 함께 가입했다고 계산하지 않습니다. ‘사건 X’라는 이름만으로 세 계약의 세부 정의가 같다는 뜻도 아닙니다.</p>
  </div>;
}

function ReadingTimeline({ result }: { result: ReadingResult }) {
  const t = result.timeline;
  return <figure className="reading-timeline" aria-label="같은 사건일과 세 문서의 날짜 경계">
    <h4>같은 ◆ 사건일, 서로 다른 날짜 경계</h4>
    {t.windows.map(window => <div className="reading-time-row" key={window.id}>
      <strong>{window.id.toUpperCase()} <small>{window.start}일 이상 · {window.end}일 미만</small></strong>
      <div className="reading-time-track" data-reading-time-track={window.id}>
        <i className="reading-time-known" data-reading-window={window.id} data-fraction={window.fraction} data-left-fraction={window.leftFraction} style={{ left: `${window.leftFraction * 100}%`, width: `${window.fraction * 100}%` }} />
        {window.unknownAfter && <i className="reading-time-unknown" data-reading-renewal-unknown data-fraction={window.unknownAfter.fraction} style={{ left: `${window.unknownAfter.leftFraction * 100}%`, width: `${window.unknownAfter.fraction * 100}%` }}><span>?</span></i>}
        {t.eventFraction !== null && <i className="reading-event-marker" data-reading-event-marker={window.id} data-day={t.eventDay} data-fraction={t.eventFraction} style={{ left: `${t.eventFraction * 100}%` }}>◆</i>}
      </div>
      <span className="reading-time-explanation">{window.id === 'c' ? '180일 뒤는 갱신 조건 ?' : '기재된 구간의 끝 날짜는 제외'}</span>
    </div>)}
    <div className="insurance-axis"><span>{t.min}일</span><span>{t.max}일 · 세 행 같은 눈금</span></div>
    <figcaption>막대 길이 = 문서에 적힌 경과일 구간. ◆ 사건일은 {t.eventDay === null ? '미확인이라 위치를 만들지 않습니다' : `${t.eventDay}일입니다`}. C의 빈 점선 구간은 갱신 뒤 조건이 없다는 표시이지, 보장 지속 또는 종료를 뜻하지 않습니다.</figcaption>
  </figure>;
}

function ContractBranch({ contract, loss }: { contract: ReadingContract; loss: number }) {
  return <article className={`reading-branch reading-branch-${contract.id}`} data-reading-contract={contract.id} data-reading-status={contract.status}>
    <header className="reading-map-source"><span className="reading-paper-icon" aria-hidden="true">{contract.id.toUpperCase()}</span><strong>{contract.name}</strong></header>
    {contract.links.filter(link => link.kind === 'documented').map(link => <div className="reading-relation documented" key={link.id} data-reading-link={link.kind} data-reading-link-contract={contract.id}><span>{link.label}</span><i aria-hidden="true" /></div>)}
    {contract.links.filter(link => link.kind === 'assumption').map(link => <div className="reading-relation assumption" key={link.id} data-reading-link={link.kind} data-reading-link-contract={contract.id}><span>{link.label}</span><i aria-hidden="true" /></div>)}
    <div className="reading-conditional-area">
      <span className="reading-output-label">{contract.structure === 'fixed' ? '손실 띠 밖의 별도 약속' : `같은 손실 ${won(loss)} 위의 단독 계산`}</span>
      {contract.structure === 'fixed' ? <div className="reading-fixed-promise" data-reading-fixed={contract.id} data-value={contract.conditionalAmount ?? 'unresolved'} data-state={contract.status}><span className="reading-fixed-symbol" aria-hidden="true">◇</span><strong>{amountText(contract.conditionalAmount)}</strong><span>조건부 정액 계산</span></div> : <>
        <div className="reading-loss-track" data-reading-loss-track={contract.id} data-loss={loss} role="img" aria-label={`${contract.name}: ${contract.segments.map(segment => segment.id === 'unknown' ? `미확인 영역의 기준 손실 ${won(segment.amount)}, 지급액 미정` : `${segment.label} ${amountText(segment.amount)}`).join(', ')}. 실제 지급대상액은 미정.`}>
          {contract.segments.map(segment => <i key={segment.id} className={`reading-segment-${segment.id}`} data-reading-segment={segment.id} data-value={segment.amount} data-fraction={segment.fraction} data-left-fraction={segment.leftFraction} style={{ left: `${segment.leftFraction * 100}%`, width: `${segment.fraction * 100}%`, borderWidth: segment.fraction === 0 ? 0 : undefined }} />)}
          {contract.conditionalAmount === null && <span className="reading-track-question" aria-hidden="true">?</span>}
          {loss === 0 && <span className="reading-track-empty">손실 0 · 길이 없음</span>}
        </div>
        <div className="insurance-axis"><span>0원</span><span>{won(loss)}</span></div>
        <ul className="reading-segment-key">{contract.segments.map(segment => <li key={segment.id}><i className={`reading-segment-${segment.id}`} aria-hidden="true" /><span>{segment.label} <b>{segment.id === 'unknown' ? '금액 미정' : won(segment.amount)}</b></span></li>)}</ul>
      </>}
      <p className="reading-conditional-number">조건부 계산 <strong data-reading-conditional={contract.id} data-value={contract.conditionalAmount ?? 'unresolved'}>{amountText(contract.conditionalAmount)}</strong></p>
      <p className="insurance-note">{contract.detail}</p>
    </div>
    <div className="reading-open-boundary" data-reading-unknown={contract.id} data-reading-link="unresolved" data-reading-link-contract={contract.id} data-state="unknown"><span className="reading-open-symbol" aria-hidden="true">?</span><div><strong>면책·제한·실제 지급은 열린 질문</strong><span>실제 지급대상액 <b>미정</b> · 입금액 <b>미정</b></span></div></div>
    <ul className="reading-questions">{contract.questions.map(question => <li key={question}>{question}</li>)}</ul>
  </article>;
}

export function ReadingMap({ result }: { result: ReadingResult }) {
  return <figure className="reading-map" data-reading-map aria-label="문서의 약속, 계산 가정, 미확인 조건과 같은 손실의 관계">
    <div className="reading-scene-source"><span aria-hidden="true">◆</span><div><strong>한 가상 사건 · 손실 {won(result.scenario.loss)}</strong><p>사건일 {result.params.eventDay === null ? '미확인' : `${result.params.eventDay}일`} · 각 문서를 단독으로 적용한 비교</p></div></div>
    <div className="reading-map-key"><span className="documented">실선: 문서의 약속</span><span className="assumption">점선: 계산 가정</span><span className="unresolved">빈 경계 ?: 미확인</span></div>
    <div className="reading-branches">{result.contracts.map(contract => <ContractBranch key={contract.id} contract={contract} loss={result.scenario.loss} />)}</div>
    <figcaption>A와 C의 막대 전체는 각각 같은 손실입니다. 초록 채움은 추가 가정 아래의 보전 계산, 빗금은 공제, 회색 점은 건별 한도 밖입니다. 날짜·사건 가정을 바꾸면 색칠만 바뀝니다. 빈 경계의 물음표는 그대로 남습니다. B의 마름모는 금액에 비례한 도형이 아니며 A·C의 손실 조각으로 쌓지 않습니다. A와 C를 합친 동시 지급액도 계산하지 않습니다.</figcaption>
  </figure>;
}

function ClassificationExercise({ frame, selections, onChange }: { frame: ReadingFrame; selections: Record<string, ReadingChoice>; onChange: (id: string, value: ReadingChoice) => void }) {
  return <div className="reading-classification"><h4>문장마다 무엇을 알고 있는지 분류하세요</h4><p>‘확인된 약속’을 고르더라도 실제 지급이 확인됐다는 뜻은 아닙니다. 선택 뒤 아래 단계 버튼으로 근거를 펼칠 수 있습니다.</p>
    {frame.assessments.map(assessment => <article key={assessment.id} className="reading-statement" data-reading-statement={assessment.id} data-revealed={assessment.revealed} data-classification={assessment.revealed ? assessment.classification : 'hidden'}>
      <label><span><b>{assessment.number}.</b> {assessment.text}</span><select aria-label={`문장 ${assessment.number} 분류`} value={selections[assessment.id] ?? ''} onChange={event => onChange(assessment.id, event.target.value as ReadingChoice)}><option value="">분류 선택</option>{choiceOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      {assessment.revealed ? <div className={`reading-evidence ${assessment.classification}`} data-reading-evidence={assessment.id}><strong>{assessment.classificationLabel}</strong><p>{assessment.feedback} {assessment.why}</p><ul>{assessment.evidence.map(item => <li key={item.clauseId}><b>{item.clauseId}</b> {item.text}</li>)}</ul></div> : <p className="reading-evidence-hidden">근거 공개 전 · 선택을 남긴 뒤 다음 단계에서 확인하세요.</p>}
    </article>)}
  </div>;
}

export function ReadingInsuranceOverview() {
  const result = projectReading();
  return <div className="reading-overview"><h3>같은 손실을 세 가지 약속으로 읽으면</h3><ReadingMap result={result} /><p className="insurance-note">아래 문서와 실험에서 각 선의 근거를 확인합니다. 색칠된 금액이 보여도 미확인 면책·제한이 남으므로 실제 지급과 입금은 아직 알 수 없습니다.</p></div>;
}

export function ReadingInsuranceLab() {
  const [params, setParams] = useState<ReadingOptions>({ ...readingDefaults, selections: {} });
  const [prediction, setPrediction] = useState('');
  const result = projectReading(params), play = usePlayback(result.frames.length - 1), frame = result.frames[play.step], final = frame.phase === 'interpret';
  const change = (patch: ReadingOptions) => { setParams(p => ({ ...p, ...patch })); setPrediction(''); play.rewind(); };
  const classify = (id: string, choice: ReadingChoice) => { classifyReadingStatement(id, choice); setParams(p => ({ ...p, selections: { ...p.selections, [id]: choice } })); play.seek(play.step); };
  const reset = () => { setParams({ ...readingDefaults, selections: {} }); setPrediction(''); play.rewind(); };
  return <section className="insurance-lab reading-lab" data-insurance-lab="reading-insurance" aria-label="가상 보험 설명서 분류와 조건 비교 실험">
    <h3>약속을 읽고, 가정을 바꾸고, 빈칸을 남기기</h3><p>손실은 {won(result.params.loss)}으로 고정합니다. 개인정보·건강정보·실제 보험 계약을 입력하지 않습니다. 날짜와 사건 해당 가정만 바꾸어 같은 손실 위의 색칠을 비교하세요.</p>
    <div className="insurance-controls"><label className="insurance-control"><span>가상 사건일<strong>{result.params.eventDay === null ? '미확인' : `${result.params.eventDay}일`}</strong></span><input type="range" aria-label="가상 사건일" min={-1} max={365} step={1} disabled={result.params.eventDay === null} value={result.params.eventDay ?? 90} aria-valuetext={result.params.eventDay === null ? '미확인 · 경계 버튼으로 날짜를 먼저 선택하세요' : `${result.params.eventDay}일`} onChange={event => change({ eventDay: Number(event.target.value) })} />{result.params.eventDay === null && <small>미확인 값에 위치를 만들지 않습니다. 아래 날짜 버튼을 누르면 새 날짜 가정을 선택합니다.</small>}</label><label className="insurance-control">보장 사건이라는 가정<select value={result.params.coveredEvent === null ? 'unknown' : result.params.coveredEvent ? 'yes' : 'no'} onChange={event => change({ coveredEvent: event.target.value === 'unknown' ? null : event.target.value === 'yes' })}><option value="yes">각 계약의 정의에 해당한다고 가정</option><option value="no">각 계약의 정의에 해당하지 않는다고 가정</option><option value="unknown">해당 여부를 아직 모름</option></select></label></div>
    <fieldset className="reading-boundary-buttons"><legend>경계 앞뒤를 바로 비교</legend>{[29, 30, 89, 90, 179, 180, 364, 365].map(day => <button key={day} aria-pressed={result.params.eventDay === day} onClick={() => change({ eventDay: day })}>{day}일</button>)}<button aria-pressed={result.params.eventDay === null} onClick={() => change({ eventDay: null })}>사건일 미확인</button></fieldset>
    <p className="insurance-note">현재 사건일: <strong data-reading-event-day>{result.params.eventDay === null ? '미확인 · 표식 없음' : `${result.params.eventDay}일`}</strong>. 미확인 상태에서는 아래 경계 날짜를 먼저 선택한 뒤 슬라이더로 조정합니다.</p>
    <InsurancePrediction question="색칠된 계산액이 보이면 무엇까지 확정할 수 있을까요?" value={prediction} onChange={setPrediction} options={[["guaranteed", "세 계약의 실제 지급액과 입금이 확정된다"], ["additive", "세 계산액을 그대로 합쳐 받을 수 있다"], ["unresolved", "조건부 계산일 뿐, 실제 지급·입금은 아직 미정이다"]]} />
    {play.controls}<div><button onClick={() => play.seek(result.frames.length - 1)}>전체 근거와 결과 보기</button><button onClick={reset}>조건까지 초기화</button></div>
    <ol className="reading-process" aria-label="문서 읽기 관찰 단계">{result.frames.map(item => <li key={item.phase}><button aria-current={frame.phase === item.phase ? 'step' : undefined} onClick={() => play.seek(item.index)}>{item.label}</button></li>)}</ol>
    <div className="insurance-stage" data-insurance-stage={frame.phase} aria-live="polite"><strong>{frame.label}</strong><p>{frame.detail}</p></div>
    <ReadingTimeline result={result} /><ReadingMap result={result} />
    <details className="reading-assumptions"><summary>이 계산이 따로 놓은 가정과 계산하지 않는 것</summary><ul>{result.scenario.assumptions.map(assumption => <li key={assumption}>{assumption}</li>)}</ul></details>
    <ClassificationExercise frame={frame} selections={result.params.selections} onChange={classify} />
    <p className="insurance-result warning" role="status">{final ? `${prediction ? prediction === result.predictionAnswer ? '예측과 같습니다. ' : '예측과 다릅니다. ' : '예측과 비교하려면 위에서 선택해 보세요. '}${frame.verdict}` : '문장 분류를 선택하고 근거를 차례로 공개해 보세요. 분류는 계약의 점수나 순위가 아닙니다.'}</p>
    <InsuranceTable title="현재 조건의 세 계약과 단독 계산"><table><caption>금액 단위: 만원. 미정은 0원이 아닙니다. A와 C의 단독 계산을 더한 지급합계는 만들지 않습니다.</caption><thead><tr><th>문서</th><th>사건일</th><th>조건 상태</th><th>조건부 계산</th><th>실제 지급대상액</th><th>입금액</th></tr></thead><tbody>{result.contracts.map(contract => <tr key={contract.id} data-static-reading-contract={contract.id}><th>{contract.name}</th><td>{result.params.eventDay === null ? '미확인' : `${result.params.eventDay}일`}</td><td>{contract.statusLabel}</td><td>{amountText(contract.conditionalAmount)}</td><td>미정</td><td>미정</td></tr>)}</tbody></table></InsuranceTable>
    <InsuranceTable title="모든 문장의 분류와 근거"><table><caption>단계 진행 없이도 확인할 수 있는 전체 답과 이유입니다.</caption><thead><tr><th>번호</th><th>문장</th><th>분류</th><th>근거 조항</th><th>이유</th></tr></thead><tbody>{result.assessments.map(assessment => <tr key={assessment.id} data-static-reading-statement={assessment.id}><th>{assessment.number}</th><td>{assessment.text}</td><td>{assessment.classificationLabel}</td><td>{assessment.clauseIds.join(' · ')}</td><td>{assessment.why}</td></tr>)}</tbody></table></InsuranceTable>
    <InsuranceTable title="같은 손실의 날짜 경계 전체 비교"><table><caption>각 계약의 정의에 해당한다고 가정한 단독 계산입니다. 실제 지급대상·입금은 모든 행에서 미정입니다.</caption><thead><tr><th>사건일</th><th>A 조건부 보전</th><th>B 별도 정액</th><th>C 조건부 보전</th><th>실제 지급·입금</th></tr></thead><tbody>{readingBoundaryCases().map(row => <tr key={row.params.eventDay} data-static-reading-boundary={row.params.eventDay}><th>{row.params.eventDay}일</th>{row.contracts.map(contract => <td key={contract.id}>{amountText(contract.conditionalAmount)}</td>)}<td>미정</td></tr>)}</tbody></table></InsuranceTable>
    <InsuranceTable title="모든 관찰 단계의 의미"><table><caption>설명을 위한 읽기 순서이며 실제 보험 심사의 처리 순서가 아닙니다.</caption><thead><tr><th>단계</th><th>무엇을 살피나</th></tr></thead><tbody>{result.frames.map(item => <tr key={item.phase} data-static-reading-frame={item.phase}><th>{item.label}</th><td>{item.detail}</td></tr>)}</tbody></table></InsuranceTable>
    <p className="insurance-note">재생은 근거 공개 단계만 바꿉니다. 움직임 줄이기에서도 위치 이동 효과 없이 같은 그림·직접 단계·전체 표를 읽습니다. 조건 변경은 재생을 멈추고 첫 단계로 돌아갑니다. ‘조건까지 초기화’는 날짜·가정·분류·예측을 모두 처음으로 되돌립니다.</p>
  </section>;
}
