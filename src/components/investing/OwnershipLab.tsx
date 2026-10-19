import { useState } from 'react';
import { usePlayback } from '../money/shared';
import { ownershipDefaults, ownershipFrames } from '../../simulations/investing/ownership.mjs';
import { amount, Building, FlowArrow, number, percent, Person, Prediction, Range, StaticTable } from './shared';
import './investing.css';

const phases: Record<string, string> = { initial: '거래 전 장부', order: '거래 조건 확인 · 아직 이동 없음', settled: '거래 결과' };
export function OwnershipLab() {
  const [mode, setMode] = useState<'issuance' | 'secondary'>('issuance');
  const [quantity, setQuantity] = useState(50);
  const [prediction, setPrediction] = useState('');
  const result = ownershipFrames({ mode, quantity });
  const play = usePlayback(result.frames.length - 1);
  const frame = result.frames[play.step], before = result.frames[0], after = result.summary;
  const reset = () => { play.rewind(); setPrediction(''); };
  const company = <Building><b>회사 통장</b><strong>{amount(frame.companyCash)}</strong><span>유입 {amount(frame.companyCashChange)}</span></Building>;
  const seller = <Person><b>판매 투자자</b><strong>{number(frame.sellerShares)}주</strong><span>현금 {amount(frame.sellerCash)}</span></Person>;
  return <section className="invest-lab" aria-label="발행과 유통 거래 실험">
    <h3>누구에게 돈이 가고, 주식은 어디서 올까?</h3>
    <p>가상 기업의 기존 주식은 {number(ownershipDefaults.existingShares)}주. 관찰 주주·판매자·구매자는 서로 다른 사람입니다. 금액은 가상 단위, 거래비용은 0입니다.</p>
    <div className="invest-options"><button aria-pressed={mode === 'issuance'} onClick={() => { setMode('issuance'); reset(); }}>신주 발행 · 회사에서 구매</button><button aria-pressed={mode === 'secondary'} onClick={() => { setMode('secondary'); reset(); }}>유통 매매 · 기존 주주에게 구매</button></div>
    <Range label="거래할 수량" value={quantity} max={120} step={10} unit="주" onChange={value => { setQuantity(value); reset(); }} />
    <p className="invest-note">주당 가격 {amount(result.input.price)} · 구매자 출발 현금 {amount(result.input.buyerCash)}. 110주 이상을 골라 자금·보유 한도도 확인해 보세요.</p>
    <Prediction question="이 거래 뒤 회사 현금은?" value={prediction} onChange={setPrediction} options={[["up", "늘어난다"], ["same", "그대로다"]]} />
    {play.controls}<button onClick={() => { setMode('issuance'); setQuantity(50); reset(); }}>조건까지 초기화</button>
    <h4 className="invest-stage" aria-live="polite">{phases[frame.phase]}</h4>
    <figure>
      <div className="invest-trade">
        {mode === 'issuance' ? company : seller}
        <div className="invest-routes">
          <FlowArrow label={`현금 · 구매자 → ${mode === 'issuance' ? '회사' : '판매자'} ${amount(after.cashFlow?.amount ?? 0)}`} reverse active={(frame.cashFlow?.amount ?? 0) > 0} />
          <FlowArrow label={`${mode === 'issuance' ? '신주' : '기존 주식'} · 구매자에게 ${number(after.shareFlow?.amount ?? 0)}주`} kind="shares" active={(frame.shareFlow?.amount ?? 0) > 0} />
        </div>
        <Person><b>구매 투자자</b><strong>{number(frame.buyerShares)}주</strong><span>현금 {amount(frame.buyerCash)}</span></Person>
      </div>
      <div className="invest-offstage">{mode === 'issuance' ? <><b>거래하지 않는 판매 주주</b><span>{number(frame.sellerShares)}주 · 현금 {amount(frame.sellerCash)}</span></> : <><b>거래 밖의 회사 통장</b><span>{amount(frame.companyCash)} · 유입 {amount(frame.companyCashChange)}</span></>}</div>
      <figcaption>황토 실선·원 = 돈, 파랑 점선·사각형 = 주식. 화살표는 거래가 실행될 때의 방향과 수량입니다. 강조는 현재 단계에서 양수가 이동할 때만 나타납니다. 실행 전·0수량·실패한 거래는 이동하지 않습니다.</figcaption>
    </figure>
    <div className="invest-share-key"><span className="observer">관찰 주주 · 진한 테두리</span><span>나머지 기존 주식 · 실선</span><span className="issued">새로 발행한 주식 · 점선</span></div>
    <div className="invest-fraction">
      {[['거래 전', before], ['선택 조건의 거래 후', after]].map(([label, value]) => {
        const row = value as typeof frame;
        return <div key={String(label)}><b>{String(label)} · 관찰 주주 지분</b><div className="invest-ratio"><span><b>{number(row.investorShares)}주</b><small>전체 {number(row.totalShares)}주</small></span><strong>= {percent(row.ownershipRatio)}</strong></div><div className="invest-share-grid" aria-hidden="true">{row.shareTiles.map((tile, index) => <i key={index} className={tile.kind} style={{ width: `${tile.fraction * 100}%` }} />)}</div><div className="invest-scale">같은 크기 한 칸 = {number(row.shareTileUnit)}주. 새 주식은 뒤에 붙습니다.</div><div className="invest-share-strip" aria-hidden="true"><i style={{ width: `${(row.ownershipRatio ?? 0) * 100}%` }} /></div><span className="invest-scale">전체 띠 = 발행 주식 100%, 초록 = 관찰 주주</span><p>회사 현금 자산 {amount(row.companyCash)}</p><div className="invest-cash-meter" aria-hidden="true"><i style={{ width: `${row.companyCash / 20000 * 100}%` }} /></div><div className="invest-scale">두 통장 같은 눈금 · 0–20,000단위</div></div>;
      })}
    </div>
    <p className="invest-note">관찰 주주는 매수·매도하지 않아 {number(frame.investorShares)}주를 유지합니다. 신주 대금은 기업의 현금 자산을 늘립니다. 지분의 분모가 커지는 것만으로 같은 비율의 가치 손실을 확정할 수 없습니다. 이 실험은 기업 가치·다른 자산을 평가하지 않습니다.</p>
    <p className="invest-result" role="status">{play.step === 2 && prediction ? `${prediction === after.companyCashDirection ? '예측과 같습니다.' : '예측과 다릅니다.'} ` : ''}{frame.message}</p>
    <StaticTable title="전체 거래 단계 장부"><table><thead><tr><th>단계</th><th>회사 현금(단위)</th><th>구매자 현금(단위)</th><th>판매자 현금(단위)</th><th>현금 합(단위)</th><th>전체 주식(주)</th><th>구매자/판매자(주)</th><th>관찰 주주 지분</th></tr></thead><tbody>{result.frames.map(row => <tr key={row.phase}><th>{phases[row.phase]}</th><td>{number(row.companyCash)}</td><td>{number(row.buyerCash)}</td><td>{number(row.sellerCash)}</td><td>{number(row.cashTotal)}</td><td>{number(row.totalShares)}</td><td>{number(row.buyerShares)} / {number(row.sellerShares)}</td><td>{percent(row.ownershipRatio)}</td></tr>)}</tbody></table></StaticTable>
  </section>;
}
