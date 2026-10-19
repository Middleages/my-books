import { useState } from 'react';
import { usePlayback } from '../money/shared';
import { poolingDefaults, projectPooling, type PoolingFrame, type PoolingResult } from '../../simulations/insurance/pooling.mjs';
import { InsuranceArrow, InsuranceHouse, InsurancePrediction, InsuranceRange, InsuranceTable, won, percent, number } from './shared';
import './insurance.css';
import './pooling.css';

export function PoolingOverview() {
  const result = projectPooling();
  return <div className="insurance-overview" aria-label="가상 20가구의 부담금이 공동 재원을 거쳐 피해 가구로 가는 관계도">
    <figure><div className="overview-people"><InsuranceHouse /><InsuranceHouse /><InsuranceHouse /></div><figcaption><strong>{result.params.households}가구가 함께</strong>각 {won(result.params.contribution)}<br/>합계 {won(result.totalContributions)}</figcaption></figure>
    <InsuranceArrow>부담금을 모아</InsuranceArrow>
    <figure><div className="overview-fund"><strong>공동 재원</strong>{won(result.available)}</div><figcaption>부담금에 별도 준비금<br/>{won(result.initialReserve)}을 더합니다</figcaption></figure>
    <InsuranceArrow>손실을 나누어</InsuranceArrow>
    <figure><div className="overview-damage"><InsuranceHouse affected /></div><figcaption><strong>{result.params.affectedCount}가구에 {won(result.totalPaid)}</strong>모형의 지급 후<br/>재원 {won(result.remaining)} 남음</figcaption></figure>
  </div>;
}

function FundTank({ frame, result }: { frame: PoolingFrame; result: PoolingResult }) {
  return <div className="insurance-fund-node">
    <div className="insurance-reserve-source">별도 출발 준비금<br/><strong>{won(result.initialReserve)}</strong><span aria-hidden="true">↓</span></div>
    <div className="insurance-tank-assembly">
      <div className="insurance-tank-axis"><span>{won(result.moneyScale)}</span><span>0원</span></div>
      <div className="insurance-fund-tank" role="img" aria-label={`현재 공동 재원 ${won(frame.remaining)}. 용기 눈금 0부터 ${won(result.moneyScale)}.`}>
        <i data-insurance-tank-fill="remaining" style={{ height: `${frame.fractions.remaining * 100}%` }} />
        <div className="insurance-tank-ticks" aria-hidden="true"><span /><span /><span /></div>
      </div>
    </div>
    <div className="insurance-tank-caption">현재 공동 재원<strong data-pool-remaining>{won(frame.remaining)}</strong></div>
    <p className="insurance-note">용기의 높이가 금액입니다.<br/>지급한 만큼 내려갑니다.</p>
  </div>;
}

function HouseholdScene({ frame, result }: { frame: PoolingFrame; result: PoolingResult }) {
  return <div className="insurance-household-node"><h4>부담금을 내는 {result.params.households}가구</h4><div className="insurance-household-grid">{frame.households.map(house => <div key={house.id} className={`insurance-household ${house.affected ? 'affected' : ''}`} data-household={house.id} data-affected={house.affected} aria-label={`${house.id}번 가구. 낸 부담금 ${won(house.contribution)}. ${house.affected ? `피해 발생, 청구 ${won(house.claim)}` : '현재 단계에 표시된 피해 없음'}.`}><InsuranceHouse affected={house.affected} /><span>{house.id}번</span><small>{house.contribution ? '납부' : '준비'}</small></div>)}</div><p className="insurance-note">집 하나가 한 가구입니다.<br/>번개가 있는 집만 이번 사건의 피해 가구입니다.</p></div>;
}

function ClaimRecipients({ frame, result }: { frame: PoolingFrame; result: PoolingResult }) {
  const affected = frame.households.filter(house => house.affected);
  return <div className="insurance-recipient-node"><h4>피해 가구의 청구</h4><strong className="insurance-claims-total" data-pool-claims>{won(frame.totalClaims)}</strong>
    {affected.length ? <div className="insurance-recipient-list">{affected.map(house => <div key={house.id} className="insurance-recipient" data-recipient={house.id}><div className="insurance-recipient-heading"><InsuranceHouse small affected /><b>{house.id}번</b><span>{won(house.claim)}</span></div><div className="insurance-household-claim-track" role="img" aria-label={`${house.id}번 청구 ${won(house.claim)} 중 지급 ${won(house.paid)}, 아직 미지급 ${won(house.unpaid)}. 이 작은 띠의 전체는 한 가구 손실 ${won(result.params.lossPerHousehold)}입니다.`}><i className="paid" data-household-paid={house.id} style={{ width: `${house.localFractions.paid * 100}%` }} /><i className={frame.phase === 'payments' ? 'unfunded' : 'pending'} data-household-unpaid={house.id} style={{ width: `${house.localFractions.unpaid * 100}%` }} /></div></div>)}</div> : <div className="insurance-no-claims"><InsuranceHouse /><p>아직 청구 전<br/>손실을 드러내는 단계로 진행하세요</p></div>}
    {affected.length > 0 && <p className="insurance-note">작은 띠 하나 = 가구당 손실 {won(result.params.lossPerHousehold)}.<br/>{frame.phase === 'payments' ? `각 가구 ${won(affected[0].paid)} 지급, ${won(affected[0].unpaid)} 미충당.` : '아직 지급 전입니다. 회색은 처리 전 청구입니다.'}</p>}
  </div>;
}

function PoolLedger({ frame, result }: { frame: PoolingFrame; result: PoolingResult }) {
  return <figure className="insurance-pool-ledger" aria-label="돈의 보존과 청구의 지급을 구분하는 두 장부">
    <h4>돈의 위치 · 이동해도 합계는 같습니다</h4>
    <div className="insurance-ledger-labels"><span className="uncollected">아직 모이지 않은 부담금 <b data-pool-uncollected>{won(frame.notYetContributed)}</b></span><span>재원에 남은 돈 <b>{won(frame.remaining)}</b></span><span className="paid">피해 가구에 지급 <b data-pool-paid>{won(frame.totalPaid)}</b></span></div>
    <div className="insurance-money-track insurance-bar-track" role="img" aria-label={`아직 모이지 않은 부담금 ${won(frame.notYetContributed)} + 재원 ${won(frame.remaining)} + 지급한 돈 ${won(frame.totalPaid)} = 출발 자금 ${won(frame.initialCombinedFunds)}.`}>
      <i className="uncollected" data-insurance-bar="pool-uncollected" style={{ left: 0, width: `${frame.fractions.notYetContributed * 100}%` }} />
      <i data-insurance-bar="pool-remaining" style={{ left: `${frame.fractions.notYetContributed * 100}%`, width: `${frame.fractions.remaining * 100}%` }} />
      <i className="paid" data-insurance-bar="pool-paid" style={{ left: `${(frame.fractions.notYetContributed + frame.fractions.remaining) * 100}%`, width: `${frame.fractions.paid * 100}%` }} />
    </div><div className="insurance-axis"><span>0원</span><span>{won(result.moneyScale)}</span></div>
    <p className="insurance-conservation">출발 자금 {won(frame.initialCombinedFunds)} = 별도 준비금 {won(result.initialReserve)} + 전체 부담금 {won(result.totalContributions)}</p>
    <h4>청구의 처리 · 돈과 미지급 요구는 다릅니다</h4>
    <div className="insurance-ledger-labels"><span className="paid">지급 {won(frame.totalPaid)}</span><span className={frame.phase === 'payments' ? 'unfunded' : 'pending'}>{frame.phase === 'payments' ? '미충당' : '지급 전 청구'} <b data-pool-pending>{won(frame.pendingClaims)}</b></span></div>
    <div className="insurance-money-track insurance-bar-track" role="img" aria-label={`청구 ${won(frame.totalClaims)} = 지급 ${won(frame.totalPaid)} + 아직 미지급 ${won(frame.pendingClaims)}. 청구는 돈의 합계에 더하지 않습니다.`}>
      <i className="paid" data-insurance-bar="claims-paid" style={{ left: 0, width: `${frame.fractions.paid * 100}%` }} />
      <i className={frame.phase === 'payments' ? 'unfunded' : 'pending'} data-insurance-bar="claims-pending" style={{ left: `${frame.fractions.paid * 100}%`, width: `${frame.fractions.pendingClaims * 100}%` }} />
    </div><div className="insurance-axis"><span>0원</span><span>{won(result.moneyScale)}</span></div>
    <figcaption>두 띠와 용기는 모두 0–{won(result.moneyScale)}의 같은 금액 눈금입니다. 청구 단계에서는 지급 전 청구와 재원 부족액이 다릅니다. 지급이 끝난 뒤 남은 미지급 청구가 이 모형의 미충당입니다.</figcaption>
  </figure>;
}

export function PoolingLab() {
  const [affectedCount, setAffectedCount] = useState(poolingDefaults.affectedCount);
  const [reserve, setReserve] = useState(poolingDefaults.reserve);
  const [prediction, setPrediction] = useState('');
  const result = projectPooling({ affectedCount, reserve });
  const play = usePlayback(result.frames.length - 1);
  const frame = result.frames[play.step];
  const changeScenario = (count: number) => { setAffectedCount(count); setPrediction(''); play.rewind(); };
  const changeReserve = (value: number) => { setReserve(value); setPrediction(''); play.rewind(); };
  const reset = () => { setAffectedCount(poolingDefaults.affectedCount); setReserve(poolingDefaults.reserve); setPrediction(''); play.rewind(); };
  const final = frame.phase === 'payments';
  const predictionCorrect = prediction === (result.canCoverAllClaims ? 'enough' : 'shortfall');
  return <section className="insurance-lab pooling-lab" data-insurance-lab="pooling" aria-label="공동 재원과 함께 생기는 손실 실험">
    <h3>20가구 → 공동 재원 → 피해 가구</h3>
    <p>각 가구는 {won(result.params.contribution)}을 냅니다. 가구당 손실은 {won(result.params.lossPerHousehold)}로 같습니다. 누가 피해를 보는지는 미리 정한 비교 사례입니다.</p>
    <div className="insurance-scenario-buttons" aria-label="피해 가구 시나리오"><button aria-pressed={affectedCount === 2} onClick={() => changeScenario(2)}>개별 충격 · 2가구</button><button aria-pressed={affectedCount === 8} onClick={() => changeScenario(8)}>공통 충격 · 8가구</button></div>
    <p className="insurance-note">{affectedCount === 2 ? '기본 사례: 1·2번 가구만 피해를 봅니다.' : '공통 충격: 같은 사건으로 1–8번 가구가 함께 피해를 봅니다.'} 이 숫자는 확률이나 예상 피해자 수가 아닙니다.</p>
    <InsuranceRange label="별도 출발 준비금" value={reserve / 10000} max={600} step={50} unit="만원" onChange={value => changeReserve(value * 10000)} />
    <InsurancePrediction question="모은 재원으로 이번 청구를 모두 낼 수 있을까요?" value={prediction} onChange={setPrediction} options={[["enough", "모두 낼 수 있다"], ["shortfall", "부족액이 남는다"]]} />
    {play.controls}<div className="insurance-step-buttons"><button onClick={() => play.seek(result.frames.length - 1)}>지급 결과 보기</button><button onClick={reset}>조건까지 초기화</button></div>
    <div className="insurance-stage" data-insurance-stage={frame.phase} aria-live="polite"><strong>{frame.label}</strong><p>{frame.phase === 'initial' ? '초기 상태: 부담금은 아직 각 가구에 있습니다. 공동 재원에는 별도 준비금만 있습니다.' : frame.phase === 'contributions' ? '모든 가구의 부담금이 공동 재원으로 이동했습니다. 아직 청구나 지급은 없습니다.' : frame.phase === 'claims' ? '손실이 생기고 청구액이 드러났습니다. 청구는 돈을 새로 만들지 않습니다. 아직 지급 전입니다.' : '최종 상태: 가진 재원 안에서만 나누었습니다. 지급한 돈은 공동 재원에서 빠져나갔습니다.'}</p></div>
    <figure className="insurance-pool-scene" aria-label="가구의 부담금이 모이고 피해 가구로 지급되는 흐름">
      <HouseholdScene frame={frame} result={result} />
      <InsuranceArrow active={frame.contributionsCollected > 0}>모인 부담금<br/><b data-pool-contributions>{won(frame.contributionsCollected)}</b></InsuranceArrow>
      <FundTank frame={frame} result={result} />
      <InsuranceArrow active={frame.totalPaid > 0}>지급한 돈<br/><b>{won(frame.totalPaid)}</b></InsuranceArrow>
      <ClaimRecipients frame={frame} result={result} />
      <figcaption>화살표는 돈의 방향이며 길이·이동 속도가 금액이나 실제 지급 시간을 뜻하지 않습니다. 집 수는 가구 수, 용기의 채운 높이는 재원, 피해 가구의 작은 띠는 각 가구 청구액을 나타냅니다.</figcaption>
    </figure>
    <div className="insurance-legend"><span>초록 · 재원</span><span className="paid">황토 · 지급한 돈</span><span className="pending">회색 · 아직 지급 전</span><span className="unfunded">붉은 사선 · 지급 뒤 미충당</span></div>
    <PoolLedger frame={frame} result={result} />
    <p className={`insurance-result ${result.unfunded > 0 && final ? 'warning' : ''}`} role="status">{final ? `${prediction ? predictionCorrect ? '예측과 같습니다. ' : '예측과 다릅니다. ' : ''}청구 ${won(result.totalClaims)} 중 ${won(result.totalPaid)}을 지급하고 재원 ${won(result.remaining)}이 남았습니다. 미충당은 ${won(result.unfunded)}입니다.` : `부담금을 모두 모은 뒤의 재원은 ${won(result.available)}입니다. 현재 지급 전 청구 ${won(frame.pendingClaims)}과 재원 부족 ${won(frame.unfunded)}을 구분하세요.`}</p>
    {final && <p className="insurance-distribution-rule">이 모형의 배분 비율: {percent(result.paymentRatio)}. 청구액에 같은 비율을 곱합니다. 실제 보험회사의 보험금 삭감 규칙이 아닙니다.</p>}
    <p className="insurance-note">추가 차입·출자·투자수익·사업비·실제 약관·재보험·지급 지연은 없습니다. 준비금을 바꾸면 추가로 마련해 둔 출발 돈이 달라질 뿐, 돈이 저절로 생기는 것은 아닙니다. ‘처음부터’는 돈을 중복해서 걷거나 지급하지 않고 같은 조건을 다시 계산합니다.</p>
    <InsuranceTable title="모든 단계의 돈과 청구"><table><caption>금액은 만원. 아직 모이지 않은 부담금 + 남은 재원 + 지급액 = 출발 자금.</caption><thead><tr><th>단계</th><th>아직 모이지 않은 부담금</th><th>모인 부담금</th><th>남은 재원</th><th>드러난 청구</th><th>지급액</th><th>지급 전·미지급 청구</th><th>재원 부족</th><th>출발 자금</th></tr></thead><tbody>{result.frames.map(item => <tr key={item.phase} data-static-pooling={item.phase}><th>{item.label}</th><td>{number(item.notYetContributed / 10000)}</td><td>{number(item.contributionsCollected / 10000)}</td><td>{number(item.remaining / 10000)}</td><td>{number(item.totalClaims / 10000)}</td><td>{number(item.totalPaid / 10000)}</td><td>{number(item.pendingClaims / 10000)}</td><td>{number(item.unfunded / 10000)}</td><td>{number(item.initialCombinedFunds / 10000)}</td></tr>)}</tbody></table></InsuranceTable>
    <InsuranceTable title="최종 가구별 부담과 지급"><table><caption>같은 최종 모델의 20가구. 금액은 만원이며, 미충당은 청구액 − 지급액입니다.</caption><thead><tr><th>가구</th><th>낸 부담금</th><th>사건 피해</th><th>청구액</th><th>받은 돈</th><th>미충당</th></tr></thead><tbody>{result.households.map(house => <tr key={house.id}><th>{house.id}번</th><td>{number(house.contribution / 10000)}</td><td>{house.affected ? '있음' : '없음'}</td><td>{number(house.claim / 10000)}</td><td>{number(house.paid / 10000)}</td><td>{number(house.unpaid / 10000)}</td></tr>)}</tbody></table></InsuranceTable>
  </section>;
}
