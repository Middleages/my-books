import { useState } from 'react';
import { usePlayback } from '../money/shared';
import { ordersDefaults, ordersFrames, type Ask } from '../../simulations/investing/orders.mjs';
import { amount, number, Prediction, Range, StaticTable } from './shared';
import './investing.css';

const books: Record<string, { label: string; asks: readonly Ask[] }> = {
  standard: { label: '기본 · 100단위 10주 / 101단위 10주', asks: ordersDefaults.asks },
  thin: { label: '얕은 잔량 · 100단위 2주 / 101단위 3주', asks: [{ id: 'A', price: 100, quantity: 2, arrival: 1 }, { id: 'B', price: 101, quantity: 3, arrival: 2 }] },
  queue: { label: '같은 가격 · 먼저 6주 / 나중 4주', asks: [{ id: '나중', price: 100, quantity: 4, arrival: 2 }, { id: '먼저', price: 100, quantity: 6, arrival: 1 }, { id: '다음 가격', price: 101, quantity: 10, arrival: 3 }] },
  empty: { label: '매도 호가 없음', asks: [] },
};
const statusLabels = { observing: '관찰 중', 'no-order': '수량 0', filled: '전량 체결', partial: '부분 체결', unfilled: '전량 미체결' };
const priceLabel = (price: number | null) => price === null ? '없음' : amount(price);

export function OrdersLab() {
  const [mode, setMode] = useState<'market' | 'limit'>('market');
  const [quantity, setQuantity] = useState(15);
  const [budget, setBudget] = useState(2000);
  const [limitPrice, setLimitPrice] = useState(100);
  const [book, setBook] = useState('standard');
  const [prediction, setPrediction] = useState('');
  const result = ordersFrames({ mode, quantity, budget, limitPrice, asks: books[book].asks });
  const play = usePlayback(result.frames.length - 1);
  const frame = result.frames[Math.min(play.step, result.frames.length - 1)];
  const reset = () => { play.rewind(); setPrediction(''); };
  return <section className="invest-lab" aria-label="호가 잔량과 주문 체결 실험">
    <h3>주문 {number(quantity)}주, 어디까지 살 수 있을까?</h3>
    <p>매도 잔량을 싼 가격부터 소비하면 매수 수량이 늘어납니다. 각 막대의 빗금은 이번 주문이 이미 산 수량입니다. 먼저 전량 체결될지 예측하고 한 단계씩 진행하세요.</p>
    <div className="invest-options"><button aria-pressed={mode === 'market'} onClick={() => { setMode('market'); reset(); }}>시장가 매수</button><button aria-pressed={mode === 'limit'} onClick={() => { setMode('limit'); reset(); }}>지정가 매수</button></div>
    <label className="invest-control">매도 호가 시나리오<select value={book} onChange={event => { setBook(event.target.value); reset(); }}>{Object.entries(books).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select></label>
    <div className="invest-controls">
      <Range label="매수 주문 수량" value={quantity} max={25} unit="주" onChange={value => { setQuantity(value); reset(); }} />
      <Range label="사용 가능한 예산" value={budget} max={3000} step={100} unit="단위" onChange={value => { setBudget(value); reset(); }} />
    </div>
    {mode === 'limit' && <Range label="매수 지정가 · 한 주당 상한" value={limitPrice} min={99} max={102} unit="단위" onChange={value => { setLimitPrice(value); reset(); }} />}
    <Prediction question="이 조건에서 주문 전량을 살 수 있을까요?" value={prediction} onChange={setPrediction} options={[["filled", "전량 체결"], ["partial", "일부만 체결"], ["unfilled", "전혀 체결되지 않음"], ["no-order", "수량이 0이라 변화 없음"]]} />
    {play.controls}<button onClick={() => { setMode('market'); setQuantity(15); setBudget(2000); setLimitPrice(100); setBook('standard'); reset(); }}>조건까지 초기화</button>
    <h4 className="invest-stage" aria-live="polite">{frame.phase === 'initial' ? '주문 직전 · 매도 잔량 관찰' : frame.phase === 'fill' ? `${frame.currentFill?.askId} 호가와 체결` : `이번 주문 결과 · ${statusLabels[frame.status]}`}</h4>
    <figure>
      <div className="invest-comparison">
        <div className="invest-wallet" style={{ borderColor: '#336d9c' }}>
          <h4>매도 주문장 · 위에서 아래로</h4>
          <p className="invest-scale">각 막대 같은 눈금: 0–{number(frame.bookScale)}주. 가격은 아래로 갈수록 높아집니다.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem 1rem', fontSize: '.85rem', lineHeight: 1.7 }}><span><i aria-hidden="true" style={{ display: 'inline-block', width: 14, height: 14, background: '#336d9c', marginRight: 5 }} />파랑 실선 · 남은 주식</span><span><i aria-hidden="true" style={{ display: 'inline-block', width: 14, height: 14, background: 'repeating-linear-gradient(135deg,#e7bd78 0,#e7bd78 5px,#855315 5px,#855315 7px)', marginRight: 5 }} />빗금 · 이 주문이 산 주식</span></div>
          {frame.asks.length === 0 && <p className="invest-offstage">매도 호가 0개 · 체결 상대가 없습니다.</p>}
          {frame.asks.map(ask => <div key={ask.id} style={{ margin: '1rem 0', padding: '.55rem', border: frame.currentFill?.askId === ask.id ? '3px solid #855315' : '1px solid #afc2cc', borderRadius: 6, background: ask.withinLimit ? 'white' : '#edf0f2' }}>
            <strong>{amount(ask.price)} · {ask.id}</strong>
            <div className="invest-scale">도착 {number(ask.arrival)}번 · 처음 {number(ask.initialQuantity)}주{!ask.withinLimit ? ' · 지정가 초과 ⛔' : ''}</div>
            <div className="invest-stack" aria-hidden="true">
              <i style={{ width: `${ask.remainingFraction * 100}%`, background: '#336d9c' }} />
              <i style={{ width: `${ask.filledFraction * 100}%`, background: 'repeating-linear-gradient(135deg,#e7bd78 0,#e7bd78 5px,#855315 5px,#855315 7px)', borderLeft: ask.filledQuantity ? '2px solid #855315' : undefined }} />
            </div>
            <div className="invest-scale">남음 {number(ask.remainingQuantity)}주 / 소비 {number(ask.filledQuantity)}주</div>
          </div>)}
        </div>
        <div className="invest-wallet">
          <h4>매수 주문 · {number(quantity)}주 중</h4>
          <div className="invest-stack" aria-hidden="true"><i style={{ width: `${frame.orderFilledFraction * 100}%`, background: '#407863' }} /><i style={{ width: `${frame.orderUnfilledFraction * 100}%`, background: 'white', border: frame.remainingQuantity > 0 ? '2px dashed #6d8798' : undefined }} /></div>
          <p>초록 채움: 체결 {number(frame.filledQuantity)}주<br />점선 빈칸: 미체결 {number(frame.remainingQuantity)}주</p>
          <div className="invest-share-grid" aria-hidden="true" style={{ gridTemplateColumns: 'repeat(5,minmax(0,1fr))' }}>{Array.from({ length: quantity }, (_, index) => <i key={index} style={{ height: 15, background: index < frame.filledQuantity ? '#407863' : 'white', border: index < frame.filledQuantity ? '2px solid #244e3e' : '1px dashed #6d8798' }} />)}</div>
          <p className="invest-scale">사각형 한 개 = 주문 1주. 체결분만 채웁니다.</p>
          <p>체결대금 합계 <strong>{amount(frame.notional)}</strong><br />평균 체결가 <strong>{frame.averagePrice === null ? '정의 불가 · 체결 0주' : `${amount(frame.averagePrice)} / 주`}</strong></p>
          <p className="invest-note">주문 전 마지막 체결가 {priceLabel(frame.initialLastTradedPrice)}<br />이번 주문 마지막 체결가 {priceLabel(frame.lastFillPrice)}<br />평균·마지막 가격·주문 한도는 서로 다른 값입니다.</p>
        </div>
      </div>
      <div className="invest-wallet" style={{ marginTop: '1rem' }}>
        <h4>체결분을 반영한 모형 현금 장부 · 전체 {amount(frame.cashTotal)}</h4>
        <div className="invest-stack" aria-hidden="true"><i style={{ width: `${frame.buyerCashFraction * 100}%`, background: '#407863' }} /><i className="invest-cash" style={{ width: `${frame.sellerCashFraction * 100}%` }} /></div>
        <p>초록 · 구매자 잔액 {amount(frame.buyerCash)} + 황토 · 판매자 수령액 {amount(frame.sellerCash)} = 출발 예산 {amount(budget)}</p>
        <p className="invest-scale">체결로 구매자 주식 {number(frame.buyerShares)}주 + 판매자 남은 주식 {number(frame.sellerShares)}주 = 처음 주식 {number(frame.shareTotal)}주. 마지막 확인 단계는 같은 거래를 다시 더하지 않습니다.</p>
      </div>
      <figcaption>거래비용·세금 0, 정수 주식, 추가·취소 주문 없음. 매도 주문은 가격 우선, 같은 가격이면 도착 순서라는 모형 규칙입니다. 현금과 주식은 체결마다 즉시 반영하므로 실제 결제 일정을 나타내지 않습니다.</figcaption>
    </figure>
    <p className="invest-result" role="status">{frame.phase === 'complete' && prediction ? `${prediction === frame.status ? '예측과 같습니다.' : '예측과 다릅니다.'} ` : ''}{frame.message}</p>
    <p className="invest-note">미체결 잔량의 이후 대기·취소는 재현하지 않습니다. 예산 부족 시 가능한 정수 수량만 체결하는 것도 이 실험의 가정입니다. 실제 증권사의 주문 접수·증거금·거부 규칙과 같다는 뜻은 아닙니다.</p>
    <StaticTable title="체결 순서와 보존 장부"><table><thead><tr><th>단계</th><th>이번 체결</th><th>누적 수량(주)</th><th>미체결(주)</th><th>누적 대금(단위)</th><th>평균(단위/주)</th><th>구매자/판매자 현금(단위)</th><th>주식 합(주)</th></tr></thead><tbody>{result.frames.map((row, index) => <tr key={index}><th>{index} · {row.phase === 'initial' ? '주문 전' : row.phase === 'fill' ? '체결' : '결과 확인'}</th><td>{row.currentFill ? `${row.currentFill.askId}: ${number(row.currentFill.price)} × ${number(row.currentFill.quantity)}` : '추가 체결 없음'}</td><td>{number(row.filledQuantity)}</td><td>{number(row.remainingQuantity)}</td><td>{number(row.notional)}</td><td>{row.averagePrice === null ? '정의 불가' : number(row.averagePrice)}</td><td>{number(row.buyerCash)} / {number(row.sellerCash)}</td><td>{number(row.shareTotal)}</td></tr>)}</tbody></table></StaticTable>
  </section>;
}
