import { useState } from 'react';
import { usePlayback } from '../money/shared';
import { costsFxDefaults, costsFxPresets, costsFxScenario, fxReturnPrimer, classifyCostsFxPrediction, type CostsFxInput } from '../../simulations/investing/costs-fx.mjs';
import { number, percent, Prediction, Range, StaticTable } from './shared';
import './investing.css';
import './costs-fx.css';

const krw = (value: number) => `${number(value)}원`;
const usd = (value: number) => `${number(value)} USD`;

export function FxReturnPrimer() {
  const result = fxReturnPrimer();
  return <figure className="cfx-primer" data-testid="fx-return-primer" aria-label="외화 가격과 환율의 곱을 면적으로 보는 그림">
    <h3>원화 금액은 두 변의 곱입니다</h3>
    <p>외화 금액이 가로, 1달러의 원화 값이 세로입니다. 면적은 원화 평가액입니다. 오른쪽 아래 작은 모서리까지 합쳐야 합니다.</p>
    <div className="cfx-area-layout">
      <div className="cfx-area-panel">
        <p className="cfx-axis">가로 · {usd(result.budgetUsd)} → {usd(result.grossSaleUsd)}</p>
        <div className="cfx-area" role="img" aria-label={result.pieces.map(piece => `${piece.label} ${krw(piece.amountKrw)}`).join(', ')}>{result.pieces.map((piece, index) => <div key={piece.id} className={`cfx-piece cfx-piece-${piece.id}`} style={{ left: `${piece.x * 100}%`, top: `${piece.y * 100}%`, width: `${piece.width * 100}%`, height: `${piece.height * 100}%` }}><span>{index + 1}</span></div>)}</div>
        <p className="cfx-axis">세로 · {number(result.input.buyFx)} → {number(result.input.sellFx)}원/USD</p>
      </div>
      <ol className="cfx-area-key">{result.pieces.map(piece => <li key={piece.id} className={`cfx-key-${piece.id}`}><span>{piece.label}</span><strong>{krw(piece.amountKrw)}</strong></li>)}</ol>
    </div>
    <p className="cfx-equation">{number(result.assetMultiplier)}배 × {number(result.fxMultiplier)}배 = <strong>{number(result.combinedMultiplier)}배</strong><br />{krw(result.input.budgetKrw)} → <strong>{krw(result.finalKrw)}</strong> · 비용 전 원화 수익률 <strong>{percent(result.noFeeReturn)}</strong></p>
    <figcaption>번호와 무늬가 각 부분을 연결합니다. {percent(result.assetReturn)} + {percent(result.fxReturn)} = {percent(result.additiveReturn)}만 더하면, 늘어난 달러에도 환율 변화가 적용되어 생기는 처음 원금 대비 {percent(result.interactionReturn)}의 추가분(수익률 기여 {number(result.interactionReturn * 100)}%p)을 놓칩니다. 원화는 별도의 새 자산이 아니라 같은 자산을 원화 단위로 평가한 값입니다. 자체 가상 사례이며 면적 그림은 이 양의 변화 기본 사례만 설명합니다.</figcaption>
  </figure>;
}

export function CostsFxLab() {
  const [input, setInput] = useState<CostsFxInput>({ ...costsFxDefaults });
  const [prediction, setPrediction] = useState('');
  const result = costsFxScenario(input);
  const play = usePlayback(result.frames.length - 1);
  const frame = result.frames[play.step];
  const change = (patch: Partial<CostsFxInput>) => { setInput(value => ({ ...value, ...patch })); setPrediction(''); play.rewind(); };
  const preset = (value: Readonly<CostsFxInput>) => { setInput({ ...value }); setPrediction(''); play.rewind(); };
  const correct = classifyCostsFxPrediction(result.predictionOutcome, prediction);
  return <section className="invest-lab cfx-lab" data-testid="costs-fx-lab" aria-label="비용과 환율 현금 흐름 실험">
    <h3>같은 총예산으로 시작해, 실제 남는 현금까지 따라갑니다</h3>
    <p>한 번 매수하고 한 번 매도하는 가상 한 구간입니다. 매수수수료는 매수대금 기준, 매도수수료는 매도대금 기준입니다. 분수 수량을 허용하고 환전 비용·세금·배당·새 입금은 생략합니다. 기간을 1년으로 정하지 않았으므로 연 수익률이 아닙니다.</p>
    <figure aria-label="원화에서 외화 자산으로 갔다가 원화 현금으로 돌아오는 순서">
      <ol className="cfx-route">{result.frames.map(row => <li key={row.index} aria-current={row.index === frame.index ? 'step' : undefined} data-cfx-step={row.index}><b>{row.index + 1}. {row.label}</b><span>{row.index === 0 || row.index === result.frames.length - 1 ? krw(row.cashKrw) : row.assetUsd > 0 || row.index === 2 || row.index === 3 ? `${usd(row.assetUsd)} · 자산` : `${usd(row.cashUsd)} · 현금`}</span></li>)}</ol>
      <figcaption>화살표는 이 실험의 처리 순서입니다. 환전과 매매가 현실에서도 즉시 결제되거나 이 순서로 자동 실행된다는 뜻은 아닙니다. 선택된 단계는 진한 테두리로 표시합니다.</figcaption>
    </figure>
    <div className="invest-controls">
      <Range label="수수료 포함 총예산" value={input.budgetKrw} max={240000} step={12000} unit="원" onChange={value => change({ budgetKrw: value })} />
      <Range label="구간 말 외화 가격" value={input.sellPriceUsd} max={200} step={5} unit="USD / 자산 1단위" onChange={value => change({ sellPriceUsd: value })} />
      <Range label="매도 후 환율" value={input.sellFx} min={600} max={1800} step={10} unit="원/USD" onChange={value => change({ sellFx: value })} />
      <Range label="매수대금 기준 수수료율" value={input.buyFeeRate * 100} max={10} step={0.5} unit="%" onChange={value => change({ buyFeeRate: value / 100 })} />
      <Range label="매도대금 기준 수수료율" value={input.sellFeeRate * 100} max={10} step={0.5} unit="%" onChange={value => change({ sellFeeRate: value / 100 })} />
    </div>
    <p className="invest-scale">매수 가격 {usd(input.buyPriceUsd)} / 자산 1단위 · 매수 전 환율 {number(input.buyFx)}원/USD · 실험의 환전 비용 {krw(result.fxFeesKrw)}</p>
    <div>{costsFxPresets.map(row => <button key={row.id} data-cfx-preset={row.id} onClick={() => preset(row.input)}>{row.label}</button>)}</div>
    <p className="invest-note">예시 버튼은 비교 조건 전체를 해당 사례로 바꿉니다. ‘서로 상쇄’는 가격 상승 배율과 환율 변화 배율을 서로 역수로 맞춘 비용 없는 사례입니다.</p>
    <Prediction question="모든 거래 후 총예산 대비 원화 수익률은?" value={prediction} onChange={setPrediction} options={[["up", "양수"], ["same", "0%"], ["down", "음수"], ["undefined", "정의 불가"]]} />
    {play.controls}
    <button onClick={() => play.seek(result.frames.length - 1)}>환전 후 결과 바로 보기</button><button onClick={() => preset(costsFxDefaults)}>조건까지 초기화</button>
    <h4 className="invest-stage" aria-live="polite">{frame.label}</h4>
    <figure className="cfx-current" aria-label="선택한 단계에서 실제 가진 현금과 자산">
      <div className="cfx-holdings">
        <div className="cfx-krw-wallet"><span>원화 현금</span><strong>{krw(frame.cashKrw)}</strong></div>
        <div className="cfx-usd-wallet"><span>달러 현금</span><strong>{usd(frame.cashUsd)}</strong></div>
        <div className="cfx-asset-wallet"><span>보유 자산 · {number(frame.units)}단위</span><strong>{usd(frame.assetUsd)}</strong><small>평가액이며 현금과 다름</small></div>
      </div>
      <div className="cfx-current-total"><b>같은 단계의 원화 환산 합계 {krw(frame.totalKrw)}</b><div className="cfx-value-track" role="img" aria-label={`원화 현금과 달러 현금, 자산의 환산 합계 ${krw(frame.totalKrw)}`}><i className="cfx-cash-krw" style={{ width: `${frame.cashKrwFraction * 100}%` }} /><i className="cfx-cash-usd" style={{ width: `${frame.cashUsdKrwFraction * 100}%` }} /><i className="cfx-asset-value" style={{ width: `${frame.assetKrwFraction * 100}%` }} /></div></div>
      <div className="cfx-legend"><span className="cfx-cash-krw">원화 현금 · 단색</span><span className="cfx-cash-usd">달러 현금 · 사선</span><span className="cfx-asset-value">자산 평가액 · 세로 줄무늬</span></div>
      <figcaption>같은 눈금 0–{krw(result.krwScale)}. 달러 금액은 이 단계의 환율 {number(frame.fx)}원/USD로 환산합니다. 숫자 범위를 바꾸면 눈금도 함께 바뀝니다. 보유 자산을 팔면 자산은 사라지고 현금으로 바뀌므로 둘을 동시에 더하지 않습니다.</figcaption>
    </figure>
    <p className="invest-result" data-testid="costs-fx-result" role="status">{play.step === result.frames.length - 1 && correct !== null ? `${correct ? '예측과 같습니다.' : '예측과 다릅니다.'} ` : ''}{frame.message}</p>
    <StaticTable title="환전·매수·매도 전체 현금 장부"><table><thead><tr><th>단계</th><th>원화 현금(원)</th><th>달러 현금(USD)</th><th>자산 평가액(USD)</th><th>보유 수량</th><th>환율(원/USD)</th><th>매수수수료 누계(USD)</th><th>매도수수료 누계(USD)</th><th>환산 합계(원)</th></tr></thead><tbody>{result.frames.map(row => <tr key={row.index}><th>{row.label}</th><td>{number(row.cashKrw)}</td><td>{number(row.cashUsd)}</td><td>{number(row.assetUsd)}</td><td>{number(row.units)}</td><td>{number(row.fx)}</td><td>{number(row.paidBuyFeeUsd)}</td><td>{number(row.paidSellFeeUsd)}</td><td>{number(row.totalKrw)}</td></tr>)}</tbody></table></StaticTable>
    <h4>수수료는 이미 가진 예산과 대금에서 나갑니다</h4>
    <figure aria-label="같은 달러 눈금으로 비교하는 매수와 매도의 수수료 분기">
      {result.splits.map(row => <div className="cfx-split-row" key={row.id}><b>{row.label} · {usd(row.totalUsd)}</b><div className="cfx-split-track" role="img" aria-label={`${row.keptLabel} ${usd(row.keptUsd)}, 수수료 ${usd(row.feeUsd)}`}><i className={row.id === 'buy' ? 'cfx-asset-value' : 'cfx-cash-usd'} style={{ width: `${row.keptFraction * 100}%` }} /><i className="cfx-fee" style={{ width: `${row.feeFraction * 100}%` }} /></div><div className="cfx-split-labels"><span>{row.keptLabel}: {usd(row.keptUsd)}</span><strong className="cfx-fee-text" data-testid={`costs-fx-${row.id}-fee`}>↘ 수수료: {usd(row.feeUsd)}</strong></div></div>)}
      <figcaption>두 띠는 동일하게 0–{usd(result.usdScale)} 눈금입니다. 붉은 사선은 외부로 지불한 수수료입니다. 회색 빈 공간은 눈금의 나머지이며 현금이 아닙니다. 수수료가 0이면 붉은 조각 길이도 0입니다.</figcaption>
    </figure>
    <p className="cfx-equation">매수: {usd(result.budgetUsd)} ÷ (1 + {number(input.buyFeeRate)}) = {usd(result.purchaseUsd)}<br />매도: {usd(result.grossSaleUsd)} − {usd(result.sellFeeUsd)} = {usd(result.netSaleUsd)}</p>
    <h4>같은 예산의 마지막 원화 현금을 비교합니다</h4>
    <figure aria-label="출발 예산과 수수료 조건별 최종 원화 현금 비교">{result.comparison.map(row => <div className="cfx-compare-row" data-cfx-comparison={row.id} key={row.id}><div><span>{row.label}</span><strong>{krw(row.value)}</strong></div><div className="cfx-comparison-track" role="img" aria-label={`${row.label} ${krw(row.value)}`}><i style={{ width: `${row.fraction * 100}%` }} /></div></div>)}<figcaption>모두 같은 예산·가격·환율·한 번의 매수와 매도입니다. 전체 눈금은 위 원화 합계와 같은 0–{krw(result.krwScale)}입니다. ‘매수수수료만’도 매도는 하되 매도수수료율만 0으로 둔 비교입니다.</figcaption></figure>
    <div className="cfx-final"><span>현재 조건의 최종 원화 <strong data-testid="costs-fx-final-krw">{krw(result.finalKrw)}</strong></span><span>총예산 대비 수익률 <strong data-testid="costs-fx-return">{percent(result.netReturn)}</strong></span></div>
    <p className="invest-note">전체 결과는 재생을 기다리지 않아도 위 비교에서 읽을 수 있습니다. 매매수수료 없는 비교보다 최종 금액이 {krw(result.costEffectKrw)} 적습니다. 이 차이는 직접 지불한 수수료를 각 지급 시점 환율로 환산한 합 {krw(result.paidTradeFeesKrw)}와 다를 수 있습니다. 매수수수료 때문에 처음 산 수량부터 달라지기 때문입니다. 이것을 추가 청구된 수수료라고 부르지 않습니다.</p>
    <p className="invest-note">운용비용을 따로 계산하는 실험이 아닙니다. 입력 가격이 이미 비용을 반영한 NAV·가격이라면 같은 운용비용을 다시 빼지 않습니다. 환전 비용 0은 교육 가정이며 실제 서비스의 무료 환전을 뜻하지 않습니다. 환헤지·호가 차이·최소 수수료·정수 수량·체결 및 결제 지연도 재현하지 않습니다. 계산 모델은 예산 0 또는 0.01원 이상만 지원하며 더 작은 양수는 오류로 거부합니다.</p>
  </section>;
}
