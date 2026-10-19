import { useState } from 'react';
import { usePlayback } from '../money/shared';
import { totalReturnFrames, type TotalReturnFrame } from '../../simulations/investing/total-return.mjs';
import { amount, Building, FlowArrow, number, percent, Person, Prediction, Range, StaticTable } from './shared';
import './investing.css';

const phases: Record<TotalReturnFrame['phase'], string> = { initial: '기초 보유', dividend: '현금배당 · 이론 배당락', market: '별도 관찰 시점 가격', reinvest: '배당 현금의 재투자', sale: '매도 또는 계속 보유' };
function Wallet({ frame, scale = 100, title }: { frame: TotalReturnFrame; scale?: number; title: string }) {
  return <div className="invest-wallet"><h4>{title}</h4><div className="invest-stack" aria-hidden="true"><i className="invest-stock" style={{ width: `${frame.stockValue / scale * 100}%` }} /><i className="invest-cash" style={{ width: `${frame.cash / scale * 100}%` }} /></div><div className="invest-legend"><span>주식 평가액 {amount(frame.stockValue)}</span><span className="cash">보유 현금 {amount(frame.cash)}</span></div><strong>같은 경계 안의 합계 {amount(frame.wealth)}</strong><p>{number(frame.shares)}주 × 주당 {amount(frame.price)}</p><div className="invest-scale">공통 눈금: 띠 전체 {amount(scale)}. 빈 부분은 눈금 여백입니다.</div></div>;
}
function ReturnTable({ frames }: { frames: TotalReturnFrame[] }) {
  return <StaticTable title="전체 단계의 주식·현금·손익"><table><thead><tr><th>단계</th><th>주가(단위/주)</th><th>수량(주)</th><th>평가액(단위)</th><th>현금(단위)</th><th>합계(단위)</th><th>누적 배당(단위)</th><th>평가손익(단위)</th><th>실현손익(단위)</th><th>총수익률</th></tr></thead><tbody>{frames.map(row => <tr key={row.phase}><th>{phases[row.phase]}{row.status === 'rejected' ? ' · 실행 불가' : ''}</th><td>{number(row.price)}</td><td>{number(row.shares)}</td><td>{number(row.stockValue)}</td><td>{number(row.cash)}</td><td>{number(row.wealth)}</td><td>{number(row.dividendsReceived)}</td><td>{number(row.unrealizedGain)}</td><td>{number(row.realizedGain)}</td><td>{percent(row.totalReturn)}</td></tr>)}</tbody></table></StaticTable>;
}
export function DividendLab() {
  const [dividend, setDividend] = useState(5), [prediction, setPrediction] = useState('');
  const result = totalReturnFrames({ dividendPerShare: dividend });
  const play = usePlayback(1), frame = result.frames[play.step], before = result.frames[0], after = result.frames[1];
  const reset = () => { play.rewind(); setPrediction(''); };
  return <section className="invest-lab" aria-label="배당 전후 자산 경계 실험">
    <h3>배당은 회사 밖에서 새로 생긴 돈일까?</h3>
    <p>앞 장과 별개의 가상 기업입니다. 전체 {number(frame.totalShares)}주 중 관찰 투자자는 {number(before.shares)}주를 보유합니다. 시장의 다른 변화·비용·세금 없이 현금배당과 이론 배당락만 비교합니다.</p>
    <Range label="주당 현금배당" value={dividend} max={15} unit="단위/주" onChange={value => { setDividend(value); reset(); }} />
    <Prediction question="지급 가능한 배당만으로 관찰 투자자의 평가액+현금은?" value={prediction} onChange={setPrediction} options={[["same", "그대로다"], ["up", "배당만큼 늘어난다"], ["down", "줄어든다"]]} />
    {play.controls}<button onClick={() => { setDividend(5); reset(); }}>조건까지 초기화</button>
    <h4 className="invest-stage" aria-live="polite">{phases[frame.phase]}</h4>
    <figure>
      <div className="invest-company-source"><Building><b>회사 통장</b><strong>{amount(frame.companyCash)}</strong><span>출발 {amount(before.companyCash)}</span><span>전체 주주에게 지급 {amount(frame.totalDividendPaid)}</span></Building></div>
      <div className="invest-dividend-fork">
        <div><div className="invest-receipt">회사 → 관찰 투자자<br /><strong>{amount(frame.dividendsReceived)}</strong></div><Person observer><b>관찰 투자자 · {number(frame.shares)}주</b><span>받은 현금 {amount(frame.cash)}</span></Person></div>
        <div><div className="invest-receipt">회사 → 나머지 모든 주주<br /><strong>{amount(frame.otherShareholdersCash)}</strong></div><Person><b>기타 주주 · 합계 {number(frame.otherShares)}주</b><span>받은 현금 {amount(frame.otherShareholdersCash)}</span></Person></div>
      </div>
      <figcaption>황토색 갈래 = 회사에서 모든 주주에게 나가는 현금. 갈래의 길이는 금액 비율이 아니며 정확한 지급액은 라벨로 표시합니다. 회사·관찰 투자자·기타 주주의 현금 합은 {amount(frame.cashTotal)}입니다.</figcaption>
    </figure>
    <div className="invest-comparison"><Wallet frame={before} title="배당 전 · 관찰 투자자의 경계" /><Wallet frame={after} title="배당 후 · 관찰 투자자의 경계" /></div>
    <p className="invest-result" role="status">{play.step === 1 && prediction ? `${prediction === after.wealthDirection ? '예측과 같습니다.' : '예측과 다릅니다.'} ` : ''}{frame.message} {after.status === 'rejected' ? '11단위 이상을 선택하면 회사의 지급 현금이 부족하므로 전후 장부가 같습니다.' : `선택 조건에서 ${amount(after.stockValue)} + ${amount(after.cash)} = ${amount(after.wealth)}입니다. 현금이 늘어난 만큼 주식 평가액이 줄어듭니다.`}</p>
    <p className="invest-note">전후 비교는 재생 없이도 읽을 수 있습니다. 이론 배당락은 다른 조건이 같다는 교육용 비교이며 실제 거래 가격의 예측이 아닙니다. 실제 배당의 결정·수령 조건·세금은 별도로 확인해야 합니다.</p>
    <StaticTable title="배당 전후 전체 현금 장부"><table><thead><tr><th>단계</th><th>회사 현금(단위)</th><th>관찰 투자자 현금(단위)</th><th>기타 주주 현금(단위)</th><th>현금 합(단위)</th><th>관찰 주식 평가액(단위)</th><th>관찰 평가액+현금(단위)</th></tr></thead><tbody>{result.frames.slice(0, 2).map(row => <tr key={row.phase}><th>{phases[row.phase]}</th><td>{number(row.companyCash)}</td><td>{number(row.cash)}</td><td>{number(row.otherShareholdersCash)}</td><td>{number(row.cashTotal)}</td><td>{number(row.stockValue)}</td><td>{number(row.wealth)}</td></tr>)}</tbody></table></StaticTable>
  </section>;
}
export function TotalReturnLab() {
  const [endPrice, setEndPrice] = useState(110), [reinvest, setReinvest] = useState(false), [sellShares, setSellShares] = useState(0), [prediction, setPrediction] = useState('');
  const result = totalReturnFrames({ endPrice, reinvest, sellShares });
  const play = usePlayback(result.frames.length - 1), frame = result.frames[play.step], before = result.frames[0], after = result.summary;
  const reset = () => { play.rewind(); setPrediction(''); };
  return <section className="invest-lab" aria-label="가격 변화 재투자 매도 총수익 실험">
    <h3>가격 변화 → 재투자 → 매도를 같은 장부로 읽기</h3>
    <p>별도 가상 보유 기간: 기초 주가 {amount(before.price)}, 보유 {number(before.shares)}주, 배당 {amount(result.input.dividendPerShare)}/주. 외부 입출금·비용·세금은 0입니다. 배당 뒤의 시장가격을 따로 정하고, 그 가격에서 재투자와 매도를 관찰합니다.</p>
    <Range label="배당 뒤 별도 관찰 시점의 주가" value={endPrice} max={150} step={5} unit="단위/주" onChange={value => { setEndPrice(value); reset(); }} />
    <div className="invest-controls"><label className="invest-control">배당 현금 처리<select value={reinvest ? 'yes' : 'no'} onChange={event => { setReinvest(event.target.value === 'yes'); reset(); }}><option value="no">현금으로 보유</option><option value="yes">같은 가격에서 모두 재투자</option></select></label><label className="invest-control">이후 매도할 수량<select value={sellShares} onChange={event => { setSellShares(Number(event.target.value)); reset(); }}><option value={0}>0주 · 계속 보유</option><option value={1}>1주 매도</option><option value={2}>2주 매도 시도 · 보유량 확인</option></select></label></div>
    <Prediction question="기초 100단위에 비해 마지막 평가액+현금은?" value={prediction} onChange={setPrediction} options={[["up", "늘어난다"], ["same", "같다"], ["down", "줄어든다"]]} />
    {play.controls}<button onClick={() => { setEndPrice(110); setReinvest(false); setSellShares(0); reset(); }}>조건까지 초기화</button>
    <ol className="invest-timeline" aria-label="관찰 순서">{result.frames.map((row, index) => <li key={row.phase} aria-current={index === play.step ? 'step' : undefined}>{phases[row.phase]}</li>)}</ol>
    <h4 className="invest-stage" aria-live="polite">{phases[frame.phase]}</h4>
    <figure><div className="invest-chart-columns">{result.frames.slice(0, 3).map(row => <div className="invest-chart-column" key={row.phase}><strong>{amount(row.price)}</strong><div className="invest-price-plot"><i style={{ height: `${row.price / 150 * 100}%` }} /></div><span>{phases[row.phase]}</span></div>)}</div><figcaption>주당 가격 비교 · 공통 세로 눈금 0–150단위/주, 밑선 0·가로선 간격 50단위. 처음 두 기둥은 배당만의 비교, 세 번째는 직접 고른 별도 시장가격입니다. 날짜·가격 경로를 예측한 그래프가 아닙니다.</figcaption></figure>
    <div className="invest-comparison"><Wallet frame={before} scale={160} title="기초 · 투자자의 자산 경계" /><Wallet frame={frame} scale={160} title="현재 단계 · 같은 자산 경계" /></div>
    {(frame.phase === 'reinvest' || frame.phase === 'sale') && <figure>
      <div className="invest-trade">
        <Person observer><b>관찰 투자자</b><span>현금 {amount(frame.cash)}</span><strong>{number(frame.shares)}주</strong></Person>
        <div className="invest-routes">
          <FlowArrow label={frame.phase === 'reinvest' ? `재투자 대금 ${amount(frame.reinvestedCash)}` : `매도대금 ${amount(frame.saleProceeds)}`} reverse={frame.phase === 'sale'} active={frame.cashFlows.length > 0} />
          <FlowArrow label={frame.phase === 'reinvest' ? '기존 주식 → 관찰 투자자' : '매도 주식 → 거래 상대'} kind="shares" reverse={frame.phase === 'reinvest'} active={frame.cashFlows.length > 0} />
        </div>
        <Person><b>시장 거래 상대</b><span>회사가 아닌 기존 주주·구매자</span><span>누적 현금 증감 {amount(frame.counterpartyCashChange)}</span></Person>
      </div>
      <figcaption>실선은 현금, 점선은 반대 방향의 기존 주식입니다. 실행된 거래만 경로가 강조됩니다. 재투자는 투자자의 현금을 줄이고, 매도는 현금을 늘립니다. 회사 현금은 이 매매로 바뀌지 않습니다.</figcaption>
    </figure>}
    <div className="invest-sale-path">배당 중 재투자한 현금 {amount(frame.reinvestedCash)} · 받은 매도대금 {amount(frame.saleProceeds)} · 매도분 실현손익 {amount(frame.realizedGain)}</div>
    <p>현재 평가손익 {amount(frame.unrealizedGain)} · 받은 배당 {amount(frame.dividendsReceived)} · 실현손익 {amount(frame.realizedGain)}. 현재 총손익 <strong>{amount(frame.totalGain)}</strong>, 총수익률 <strong>{percent(frame.totalReturn)}</strong>입니다. 주가 변화율 {percent(frame.priceReturn)}와 구분해 읽으세요.</p>
    <p className="invest-result" role="status">{play.step === 4 && prediction ? `${prediction === after.wealthDirection ? '예측과 같습니다.' : '예측과 다릅니다.'} ` : ''}{frame.message}</p>
    <p className="invest-note">재투자는 받은 현금으로 기존 주식을 사는 거래이며 분수 주식을 허용합니다. 가격 0에서는 나눗셈 매수를 실행하지 않습니다. 매도 손익은 평균 취득원가로 계산하며, 매도대금 전체를 수익으로 더하지 않습니다. 이 모형의 같은 가격 매매만으로 합계 자산이 늘어나지는 않습니다.</p>
    <ReturnTable frames={result.frames} />
  </section>;
}
