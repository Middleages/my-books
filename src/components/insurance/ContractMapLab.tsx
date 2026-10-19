import { useState } from 'react';
import { usePlayback } from '../money/shared';
import { contractDefaults, contractPresets, projectContractMap, type ContractParams, type ContractFrame, type ContractEvent } from '../../simulations/insurance/contracts.mjs';
import { InsurancePrediction, InsuranceTable } from './shared';
import './insurance.css';
import './contract-map.css';

function PersonIcon({ company = false }: { company?: boolean }) {
  return <svg className="contract-person-icon" viewBox="0 0 48 48" aria-hidden="true">{company ? <><path d="M9 44V8h30v36Z" fill="#f6ebd5" stroke="currentColor" strokeWidth="2"/><path d="M16 16h5m7 0h5M16 24h5m7 0h5M21 44V34h7v10" stroke="currentColor" strokeWidth="3"/></> : <><circle cx="24" cy="13" r="8" fill="#f5e8ce" stroke="currentColor" strokeWidth="2"/><path d="M9 43v-7c0-18 30-18 30 0v7Z" fill="#e2eeea" stroke="currentColor" strokeWidth="2"/></>}</svg>;
}
function RoleNetwork({ frame }: { frame: ContractFrame }) {
  return <figure className="contract-role-figure" aria-label="사람별 역할과 보험자 사이의 방향이 있는 관계도">
    <div className="contract-role-network" data-contract-network data-person-count={frame.people.length}>
      {frame.people.map((person, index) => <div className="contract-person" data-contract-person={person.id} data-role-count={person.roles.length} key={person.id} style={{ gridRow: index + 1 }}><PersonIcon company={person.kind === 'company'} /><strong>{person.name}</strong><div className="contract-roles">{person.roles.map(role => <div className={`contract-role ${role.id}`} data-contract-role={role.id} key={role.id}><span aria-hidden="true">{role.symbol}</span> {role.label}</div>)}</div></div>)}
      {frame.people.map((person, index) => <div className="contract-person-edges" key={person.id} style={{ gridRow: index + 1 }}>{frame.edges.filter(edge => edge.personId === person.id).map(edge => <div data-contract-edge={edge.id} data-from={edge.from} data-to={edge.to} data-connected={edge.connected} data-active={edge.active} className={`contract-edge ${edge.direction} ${edge.kind} ${edge.active ? 'active' : ''} ${edge.connected ? '' : 'unconfirmed'}`} key={edge.id}><span>{edge.label}</span><i aria-hidden="true"/><small>{!edge.connected ? '지속 미확인' : edge.kind === 'reference' ? '관계' : edge.id === 'payout' ? '지급 약속' : '납입 의무'}</small></div>)}</div>)}
      <div className="contract-insurer" data-contract-insurer style={{ gridRow: `1 / span ${frame.people.length}` }}><svg viewBox="0 0 64 70" aria-hidden="true"><path d="M32 3 58 13v25Q55 56 32 67 9 56 6 38V13Z" fill="#dbeae6" stroke="currentColor" strokeWidth="3"/><path d="m19 34 9 10 18-23" fill="none" stroke="currentColor" strokeWidth="4"/></svg><strong>보험자</strong><span>가상 보험회사</span><small>계약 인수<br/>조건부 지급 책임</small></div>
    </div>
    <figcaption>한 경계 = 한 사람 또는 회사. ▣ 계약자, ◎ 피보험자, ◇ 보험수익자입니다. 실선 화살표는 돈의 방향, 점선은 사고 판단 관계입니다. 굵은 선은 관찰 중인 연결이며 실제 송금 효과가 아닙니다.</figcaption>
  </figure>;
}
function EventToken({ event }: { event: ContractEvent }) {
  return <div className={`contract-event ${event.included ? 'included' : 'outside'}`} data-contract-event={event.id} data-included={event.included} data-region={event.region}><span aria-hidden="true">{event.id}</span><strong>{event.label}</strong><small>{event.reason}</small></div>;
}
function CoverageMap({ frame, params }: { frame: ContractFrame; params: ContractParams }) {
  return <figure className="contract-coverage" aria-label="특약을 붙이면 사건이 이동하는 보장 범위 지도">
    <div className="contract-coverage-grid"><div className="contract-agreement-boundary" data-contract-agreement><strong>선 안: 선택한 가상 계약의 사건 범위</strong><div className="contract-base-boundary" data-contract-boundary="base"><h4>기본계약</h4>{frame.events.filter(event => event.region === 'base').map(event => <EventToken key={event.id} event={event}/>)}</div><div className={`contract-rider-boundary ${params.addRider ? 'attached' : ''}`} data-contract-boundary="rider" data-attached={params.addRider}><h4>{params.addRider ? '+ 추가 특약 연결' : '추가 특약 없음'}</h4>{frame.events.filter(event => event.region === 'rider').map(event => <EventToken key={event.id} event={event}/>)}{!params.addRider && <p>사건 C는 바깥에 있습니다.</p>}</div></div><div className="contract-outside-boundary" data-contract-boundary="outside"><h4>선 밖: 이번 계약에 미포함</h4>{frame.events.filter(event => event.region === 'outside').map(event => <EventToken key={event.id} event={event}/>)}</div></div>
    <figcaption>동그라미 하나 = 가상 사건 하나입니다. 면적은 금액·발생 확률과 무관합니다. 추가 특약은 C를 안으로, 제한 특약은 B를 밖으로 옮깁니다. 실제 약관에는 보장 추가·제한·변경·서비스 등 여러 기능의 특약이 있으며, 포함만으로 지급액까지 확정되지는 않습니다.</figcaption>
  </figure>;
}
function SourceMap({ frame }: { frame: ContractFrame }) {
  return <figure className="contract-source-figure" aria-label="동시에 연결될 수 있는 세 보장 확인 출처"><h4>보장을 찾아볼 세 곳 · 함께 확인할 수 있습니다</h4><div className="contract-source-map">{frame.sources.map(source => <div className={`contract-source ${source.id}`} data-contract-source={source.id} key={source.id}><strong>{source.label}</strong><span>{source.example}</span><i className={source.status === '지속 미확인' ? 'uncertain' : ''} aria-hidden="true"/><small>{source.connection}</small></div>)}</div><div className="contract-source-person"><PersonIcon/><strong>같은 가상 지우의 보장 점검</strong></div><figcaption>세 곳은 배타적인 법적 분류가 아니라 확인 경로입니다. 선은 보장이 이미 확인되었다는 뜻이 아닙니다. 국민건강보험의 직장가입과 회사의 민간 단체보험을 별도로 확인하고, 직장을 떠난 뒤에는 자격·종료·계속 조건을 다시 확인합니다.</figcaption></figure>;
}
export function ContractMapLab() {
  const [params, setParams] = useState<ContractParams>({ ...contractDefaults });
  const [prediction, setPrediction] = useState('');
  const result = projectContractMap(params);
  const play = usePlayback(result.frames.length - 1);
  const frame = result.frames[play.step];
  const change = (patch: Partial<ContractParams>) => { setParams(previous => ({ ...previous, ...patch })); setPrediction(''); play.rewind(); };
  const reset = () => { setParams({ ...contractDefaults }); setPrediction(''); play.rewind(); };
  const final = play.step === result.frames.length - 1;
  return <section className="insurance-lab contract-map-lab" data-insurance-lab="contract-map" aria-label="보험 계약의 역할과 보장 경계 실험">
    <h3>세 역할이 세 사람을 뜻할까요?</h3><p>인보험의 역할을 단순화한 가상 지도입니다. 모든 이름은 미리 정한 성인 또는 회사 이름입니다. 위에서 아래로 돈이 흐르는 그림이 아니라, 화살표의 방향을 읽는 관계도입니다.</p>
    <RoleNetwork frame={frame}/>
    <label className="insurance-control"><span>가상 역할 배치</span><select value={params.preset} onChange={event => change({preset:event.target.value as ContractParams['preset']})}>{contractPresets.map(preset => <option key={preset.id} value={preset.id}>{preset.label}</option>)}</select></label>
    <InsurancePrediction question="이 사례에서 보험료를 내는 계약자와 보험수익자는 같은가요?" value={prediction} onChange={setPrediction} options={[["same","같은 사람이다"],["different","서로 다르다"]]}/>
    {play.controls}<div><button onClick={() => play.seek(result.frames.length - 1)}>지급 방향 보기</button><button onClick={reset}>조건까지 초기화</button></div>
    <div className="insurance-stage" data-insurance-stage={frame.phase} aria-live="polite"><strong>{frame.label}</strong><p>{frame.detail}</p></div>
    <p className="insurance-result" role="status">{final && prediction ? prediction === (result.samePayerAndBeneficiary ? 'same' : 'different') ? '예측과 같습니다. ' : '예측과 다릅니다. ' : ''}{final ? result.verdict : '보험료 화살표의 출발점과 보험금 화살표의 도착점을 찾아보세요. 예측을 고른 뒤 지급 방향을 확인합니다.'}</p>
    <h3>특약으로 포함 경계를 바꾸기</h3><p>각각 독립된 두 가상 특약입니다. 실제 상품에 이 조합이 존재한다는 뜻은 아닙니다.</p>
    <div className="contract-toggles"><label><input type="checkbox" checked={params.addRider} onChange={event => change({addRider:event.target.checked})}/>추가 특약 · 사건 C 포함</label><label><input type="checkbox" checked={params.restrictRider} onChange={event => change({restrictRider:event.target.checked})}/>제한 특약 · 사건 B 제외</label></div>
    <CoverageMap frame={frame} params={params}/>
    <label className="contract-employment"><input type="checkbox" checked={params.employed} onChange={event => change({employed:event.target.checked})}/>가상 지우가 현재 직장에 재직 중</label>
    {!params.employed && <p className="insurance-employment-warning insurance-note">퇴직 뒤 단체보험의 지속 여부는 미확인입니다. 개인 계약이나 공적 제도의 자격도 각각 확인해야 하며, 여기서는 자동 유지·자동 소멸을 판정하지 않습니다.</p>}
    <SourceMap frame={frame}/>
    <InsuranceTable title="역할 관찰의 모든 단계"><table><caption>지도와 같은 모델입니다. 단계는 설명 순서이며 계약 체결이나 청구의 실제 처리 시간표가 아닙니다.</caption><thead><tr><th>단계</th><th>관찰할 연결</th><th>해석</th></tr></thead><tbody>{result.frames.map(item => <tr key={item.phase} data-static-contract={item.phase}><th>{item.label}</th><td>{item.edges.filter(edge=>edge.active).map(edge=>edge.label).join(' / ') || '사람과 역할 전체'}</td><td>{item.detail}</td></tr>)}</tbody></table></InsuranceTable>
    <InsuranceTable title="사람·역할·방향과 보장 출처"><table><caption>선의 양 끝과 역할. 같은 이름이면 같은 사람의 여러 역할입니다.</caption><thead><tr><th>사람·회사</th><th>역할</th><th>의미</th></tr></thead><tbody>{frame.people.flatMap(person=>person.roles.map(role=><tr key={role.id}><th>{person.name}</th><td>{role.label}</td><td>{role.detail}</td></tr>))}<tr><th>가상 보험회사</th><td>보험자</td><td>계약을 인수하고 조건에 따라 지급할 책임</td></tr></tbody></table><table><caption>화살표의 출발과 도착 · 조건부 약속이며 실제 입금 아님</caption><thead><tr><th>출발</th><th>연결</th><th>도착</th><th>해석</th></tr></thead><tbody>{frame.edges.map(edge=><tr key={edge.id}><th>{edge.from==='insurer'?'가상 보험회사':frame.people.find(person=>person.id===edge.from)?.name}</th><td>{edge.label}</td><td>{edge.to==='insurer'?'가상 보험회사':frame.people.find(person=>person.id===edge.to)?.name}</td><td>{edge.detail}</td></tr>)}</tbody></table><table><caption>현재 사건의 포함 여부와 근거</caption><thead><tr><th>사건</th><th>경계</th><th>이유</th></tr></thead><tbody>{frame.events.map(event=><tr key={event.id}><th>{event.label}</th><td>{event.included?'안':'밖'}</td><td>{event.reason}</td></tr>)}</tbody></table><table><caption>동시에 확인할 수 있는 출처. 지급액 합산표가 아닙니다.</caption><thead><tr><th>확인 경로</th><th>대상</th><th>구별할 점</th><th>현재 표시</th></tr></thead><tbody>{frame.sources.map(source=><tr key={source.id}><th>{source.label}</th><td>{source.example}</td><td>{source.detail}</td><td>{source.connection}</td></tr>)}</tbody></table></InsuranceTable>
    <p className="insurance-note">재산·책임보험 등은 피보험자와 권리의 구조가 다를 수 있습니다. 이 지도는 동의 요건·법적 권리 변경·개별 계약의 유효성·보험료 금액을 판단하지 않습니다. 정지·처음부터는 연결의 관찰만 바꾸며 계약이나 지급을 실행하지 않습니다.</p>
  </section>;
}
