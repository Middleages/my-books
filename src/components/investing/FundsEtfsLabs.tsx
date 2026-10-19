import { useState } from 'react';
import { usePlayback } from '../money/shared';
import { fundsDefaults, navDefaults, exposureFrames, navFrames, trackingComparison, classifyFundsPrediction, type AssetSegment, type NavInput } from '../../simulations/investing/funds-etfs.mjs';
import { amount, number, percent, Prediction, Range, StaticTable } from './shared';
import './investing.css';
import './funds-etfs.css';

const nullableAmount = (value: number | null) => value === null ? '정의 불가' : amount(value);
const pp = (value: number) => `${number(value * 100)}%p`;
function AssetBar({ parts, label, className = '' }: { parts: AssetSegment[]; label: string; className?: string }) {
  return <div className={`etf-asset-bar ${className}`} role="img" aria-label={label}>{parts.map(part => <i key={part.asset} data-asset={part.asset} className={`etf-asset-${part.asset}`} style={{ width: `${part.fraction * 100}%` }} />)}</div>;
}
function AssetLegend() {
  return <div className="etf-legend"><span className="etf-key-A">A · 파랑 단색</span><span className="etf-key-B">B · 황토 사선</span><span className="etf-key-C">C · 보라 점무늬</span></div>;
}

export function FundsOverlapLab() {
  const [xWeight, setXWeight] = useState(fundsDefaults.xWeight);
  const [sameHoldings, setSameHoldings] = useState(fundsDefaults.sameHoldings);
  const [prediction, setPrediction] = useState('');
  const result = exposureFrames({ xWeight, sameHoldings });
  const play = usePlayback(result.frames.length - 1);
  const frame = result.frames[play.step];
  const changeWeight = (value: number) => { setXWeight(value); setPrediction(''); play.rewind(); };
  const changeHoldings = (value: boolean) => { setSameHoldings(value); setPrediction(''); play.rewind(); };
  const reset = () => { setXWeight(fundsDefaults.xWeight); setSameHoldings(fundsDefaults.sameHoldings); setPrediction(''); play.rewind(); };
  const correct = classifyFundsPrediction(result.predictionOutcome, prediction);
  return <section className="invest-lab etf-lab" aria-label="ETF 기초자산 중복 실험">
    <h3>상품 두 개를 열어, 같은 자산끼리 합칩니다</h3>
    <p>같은 시점의 전체 투자 평가액을 100%로 놓습니다. 위쪽 띠는 각 펀드 내부 100%, 아래쪽 띠는 내 전체 투자 100%입니다. 띠 길이는 금액 비중이며 주식 수나 손실 확률이 아닙니다.</p>
    <AssetLegend />
    <figure aria-label="투자자의 펀드 지분과 펀드 내부 기초자산의 포함 관계">
      <div className="etf-owner"><b>관찰 투자자</b><span>직접 보유: X {percent(xWeight)} + Y {percent(result.yWeight)}</span><small>아래 화살표는 소유 관계를 펼치는 방향입니다. 돈의 이체가 아닙니다.</small></div>
      <div className="etf-ownership-branch" aria-hidden="true">↓ 펀드 지분을 통해 안쪽 자산에 노출 ↓</div>
      <div className="etf-fund-pair">{result.funds.map(fund => <div className="etf-fund-shell" key={fund.id}>
        <h4>ETF {fund.id} <small>내 투자 중 {percent(fund.weight)}</small></h4>
        <p>이 펀드 안의 자산 비중</p>
        <AssetBar parts={fund.holdings} label={`ETF ${fund.id} 내부: ${fund.holdings.map(part => `${part.asset} ${percent(part.fraction)}`).join(', ')}`} className="etf-inner-bar" />
        <div className="etf-part-labels">{fund.holdings.map(part => <span key={part.asset}>{part.asset} {percent(part.fraction)}</span>)}</div>
      </div>)}</div>
      <figcaption>점선 경계는 서로 다른 펀드, 색과 무늬는 같은 기초자산을 뜻합니다. X의 A와 Y의 A는 동일한 자산입니다. 펀드 지분 보유를 각 회사 주식의 직접 보유와 동일한 법적 권리로 해석하지 않습니다.</figcaption>
    </figure>
    <Range label="ETF X에 둔 비중" value={xWeight * 100} max={100} step={5} unit="%" onChange={value => changeWeight(value / 100)} />
    <p className="invest-scale">ETF Y 비중: {percent(result.yWeight)} · 두 상품 비중 합계 {percent(result.totalWeight)}</p>
    <label className="invest-control"><span>ETF Y의 기초자산</span><select value={sameHoldings ? 'same' : 'original'} onChange={event => changeHoldings(event.target.value === 'same')}><option value="original">기본 · A 40% / C 60%</option><option value="same">X와 동일 · A 60% / B 40%</option></select></label>
    <div className="invest-options"><button onClick={() => changeWeight(0)}>X 0% · Y 100%</button><button onClick={() => changeWeight(0.5)}>두 ETF 반반</button><button onClick={() => changeWeight(1)}>X 100% · Y 0%</button></div>
    <Prediction question="선택한 조합의 A 비중은 50%보다?" value={prediction} onChange={setPrediction} options={[["up", "높다"], ["same", "같다"], ["down", "낮다"]]} />
    {play.controls}
    <button onClick={() => play.seek(result.frames.length - 1)}>실질 노출 바로 보기</button><button onClick={reset}>조건까지 초기화</button>
    <h4 className="invest-stage" aria-live="polite">{frame.label}</h4>
    <figure aria-label="내 전체 투자 100% 중 펀드별 기여와 합쳐진 자산 노출">
      <div className="etf-contributions">{result.funds.map((fund, index) => <div key={fund.id} data-visible={index === 0 ? frame.xVisible : frame.yVisible}>
        <b>{fund.id}를 통해 보유하는 몫</b>
        <AssetBar parts={fund.contributions} label={`${fund.id} 기여: ${fund.contributions.map(part => `${part.asset} ${percent(part.fraction)}`).join(', ')}`} className="etf-contribution-bar" />
        <div className="etf-part-labels">{fund.contributions.map(part => <span key={part.asset}>{part.asset} {percent(part.fraction)}</span>)}</div>
        <small>{(index === 0 ? frame.xVisible : frame.yVisible) ? '이번 단계까지 반영됨' : '아직 합계에 넣기 전 · 미리 읽기'}</small>
      </div>)}</div>
      <div className="etf-combined" data-grouped={frame.grouped}>
        <b>현재까지 펼쳐 본 기초자산 합계</b>
        <AssetBar parts={frame.exposures} label={frame.exposures.map(part => `${part.asset} ${percent(part.fraction)}`).join(', ')} className="etf-total-bar" />
        <div className="etf-part-labels">{frame.exposures.map(part => <strong key={part.asset}>{part.asset} {percent(part.fraction)}</strong>)}</div>
        <p>반영 {percent(frame.accountedWeight)} · 아직 펼치지 않은 몫 {percent(frame.unexaminedWeight)}</p>
      </div>
      <figcaption>아래 모든 띠의 전체 길이는 내 투자 100%입니다. 회색은 해당 띠에 반영하지 않은 몫입니다. 손실이나 현금 자산을 뜻하지 않습니다. 같은 A의 파랑 조각이 최종 합계에서 하나로 이어집니다.</figcaption>
    </figure>
    <p className="invest-result" role="status">{play.step === result.frames.length - 1 && correct !== null ? `${correct ? '예측과 같습니다.' : '예측과 다릅니다.'} ` : ''}{frame.message}</p>
    <p className="invest-note">현재 두 상품을 모두 통해 겹쳐 보유하는 자산: {result.overlapAssets.length ? result.overlapAssets.join(', ') : '없음'}. 한 상품만 보유하면 상품 간 중복은 없지만, 그 상품 안의 집중 위험은 여전히 남습니다. 가상 비중은 추천 비중이 아닙니다. 수익률·비용·재조정·파생상품은 이 구성 실험에서 계산하지 않습니다.</p>
    <StaticTable title="기초자산을 펼치는 전체 단계"><table><thead><tr><th>관찰 단계</th><th>A 비중</th><th>B 비중</th><th>C 비중</th><th>반영 합계</th></tr></thead><tbody>{result.frames.map(row => <tr key={row.index}><th>{row.label}</th>{row.exposures.map(part => <td key={part.asset}>{percent(part.fraction)}</td>)}<td>{percent(row.accountedWeight)}</td></tr>)}</tbody></table></StaticTable>
  </section>;
}

export function FundNavLab() {
  const [input, setInput] = useState<NavInput>({ ...navDefaults });
  const [prediction, setPrediction] = useState('');
  const result = navFrames(input);
  const play = usePlayback(result.frames.length - 1);
  const frame = result.frames[play.step];
  const change = (patch: Partial<NavInput>) => { setInput(value => ({ ...value, ...patch })); setPrediction(''); play.rewind(); };
  const reset = () => { setInput({ ...navDefaults }); setPrediction(''); play.rewind(); };
  const correct = classifyFundsPrediction(result.predictionOutcome, prediction);
  return <section className="invest-lab etf-lab" aria-label="ETF NAV와 시장가격 실험">
    <h3>좌수는 그대로, 한 좌의 가치와 거래가격은 따로 봅니다</h3>
    <p>앞의 두 펀드와는 별개의 가상 ETF입니다. 처음 자산 {amount(input.initialAssets)}, 부채 {amount(input.liabilities)}, 발행 {number(input.issuedUnits)}좌입니다. 이 자산·부채에는 이미 장부에 기록된 운용비용이 반영돼 있습니다. 그 비용을 다시 빼지 않습니다.</p>
    <div className="invest-controls">
      <Range label="기초자산 가치 변화" value={input.underlyingReturn * 100} min={-100} max={100} step={10} unit="%" onChange={value => change({ underlyingReturn: value / 100 })} />
      <Range label="ETF 시장가격" value={input.marketPrice} max={220} step={1} unit="단위 / 좌" onChange={value => change({ marketPrice: value })} />
      <Range label="보유 좌수" value={input.heldUnits} max={input.issuedUnits === 0 ? 0 : 20} unit="좌" onChange={value => change({ heldUnits: value })} />
      <label className="invest-control"><span>발행 상태</span><select value={input.issuedUnits === 0 ? 'zero' : 'issued'} onChange={event => change(event.target.value === 'zero' ? { issuedUnits: 0, heldUnits: 0 } : { issuedUnits: navDefaults.issuedUnits, heldUnits: navDefaults.heldUnits })}><option value="issued">발행 100좌 · 일반 계산</option><option value="zero">발행 0좌 · 나눗셈 경계 확인</option></select></label>
    </div>
    <Prediction question="변화 후 NAV와 비교한 시장가격은?" value={prediction} onChange={setPrediction} options={[["up", "NAV보다 높다 · 양의 괴리"], ["same", "NAV와 같다 · 괴리 0"], ["down", "NAV보다 낮다 · 음의 괴리"], ["undefined", "괴리율을 정의할 수 없다"]]} />
    {play.controls}
    <button onClick={() => play.seek(result.frames.length - 1)}>가격 비교 바로 보기</button><button onClick={reset}>조건까지 초기화</button>
    <h4 className="invest-stage" aria-live="polite">{frame.label}</h4>
    <figure aria-label="펀드 전체 순자산을 발행 좌수로 나누고 보유 좌수에 연결하는 구조">
      <div className="etf-net-assets"><b>펀드 전체 순자산 {amount(frame.netAssets)}</b><span>자산 {number(frame.assets)} − 부채 {number(frame.liabilities)}</span><div className="etf-net-bar" role="img" aria-label={`전체 순자산 ${amount(frame.netAssets)}, 눈금 0부터 ${amount(result.assetScale)}`}><i style={{ width: `${frame.netAssetFraction * 100}%` }} /></div><small>눈금 0–{number(result.assetScale)}단위</small></div>
      <div className="etf-nav-fraction"><span>÷ 발행 {number(frame.issuedUnits)}좌</span><strong>좌당 NAV {nullableAmount(frame.nav)}</strong><small>전체 순자산을 내 보유 좌수로 나누지 않습니다.</small></div>
      <div className="etf-held"><b>내 보유 {number(frame.heldUnits)}좌</b><div className="etf-unit-row" aria-hidden="true">{Array.from({ length: frame.heldUnits }, (_, index) => <i key={index} />)}</div><span>NAV 기준 평가액 {nullableAmount(frame.heldNavValue)}</span><small>사각형 하나 = 내 보유 1좌. 가치가 변해도 이 실험의 좌수는 고정입니다.</small></div>
      <figcaption>기초자산의 가치 변화와 좌수의 변화를 분리합니다. 새 설정·환매, 투자자의 매매·분배금 재투자가 없으므로 발행 좌수와 보유 좌수는 단계 사이에 바뀌지 않습니다. 발행 0좌는 정의 불가를 확인하는 가상 경계이며 실제 ETF의 거래 상태가 아닙니다.</figcaption>
    </figure>
    <figure className="etf-price-comparison" aria-label="같은 시점의 좌당 NAV와 시장가격 비교">
      <h4>둘 다 한 좌의 금액, 서로 다른 질문</h4>
      <div className="etf-price-row"><b>NAV · 안쪽 순자산 기준</b><strong data-testid="etf-nav">{nullableAmount(frame.nav)}</strong><div className="etf-price-bar nav" role="img" aria-label={`좌당 NAV ${nullableAmount(frame.nav)}`}>{frame.navFraction !== null && <i style={{ width: `${frame.navFraction * 100}%` }} />}</div></div>
      <div className="etf-price-row"><b>시장가격 · 거래 상대와 정하는 값</b><strong data-testid="etf-market-price">{frame.marketPrice === null ? '마지막 단계에서 비교' : amount(frame.marketPrice)}</strong><div className="etf-price-bar market" role="img" aria-label={frame.marketPrice === null ? '시장가격 아직 비교 전' : `시장가격 ${amount(frame.marketPrice)}`}>{frame.marketFraction !== null && <i style={{ width: `${frame.marketFraction * 100}%` }} />}</div></div>
      <div className="etf-premium"><b>괴리율</b><strong data-testid="etf-premium">{frame.marketPrice === null ? '비교 전' : percent(frame.premium)}</strong><span>(시장가격 − 좌당 NAV) ÷ 좌당 NAV × 100</span></div>
      <figcaption>두 막대의 동일 눈금은 0–{number(result.priceScale)}단위/좌입니다. NAV는 파랑 단색, 시장가격은 주황 사선입니다. 정의 불가나 비교 전은 막대를 그리지 않습니다. 0단위는 길이 0인 값입니다. NAV 평가액과 시장 평가액을 합산하지 않으며, 둘 다 매도 대금 입금이 아닙니다.</figcaption>
    </figure>
    <p className="invest-result" role="status">{play.step === result.frames.length - 1 && correct !== null ? `${correct ? '예측과 같습니다.' : '예측과 다릅니다.'} ` : ''}{frame.message}</p>
    <p className="invest-note">가치 변화는 한 관찰 구간의 가상 변화이며 연 수익률이 아닙니다. 구간 중 추가 운용비용·세금·거래비용·분배금·환율은 생략합니다. 시장가격은 독립 입력이며 NAV를 따라 움직인다고 강제하지 않습니다. 현실의 종가·NAV·장중 추정 NAV는 산정 시점부터 확인해야 합니다.</p>
    <StaticTable title="순자산·좌수·NAV·시장가격의 전체 단계"><table><thead><tr><th>관찰 단계</th><th>자산(단위)</th><th>부채(단위)</th><th>순자산(단위)</th><th>발행 좌수</th><th>보유 좌수</th><th>NAV(단위/좌)</th><th>시장가격(단위/좌)</th><th>괴리율</th></tr></thead><tbody>{result.frames.map(row => <tr key={row.index}><th>{row.label}</th><td>{number(row.assets)}</td><td>{number(row.liabilities)}</td><td>{number(row.netAssets)}</td><td>{number(row.issuedUnits)}</td><td>{number(row.heldUnits)}</td><td>{row.nav === null ? '정의 불가' : number(row.nav)}</td><td>{row.marketPrice === null ? '비교 전' : number(row.marketPrice)}</td><td>{row.marketPrice === null ? '비교 전' : percent(row.premium)}</td></tr>)}</tbody></table></StaticTable>
  </section>;
}

export function TrackingComparison() {
  const result = trackingComparison();
  return <div className="etf-tracking">
    <figure aria-label="두 가상 경로의 월별 수익률 차이와 그 흩어짐">
      <h3>계속 조금 뒤처지는 경로와 들쭉날쭉한 경로</h3>
      <p>세로: 월 수익률 차이(펀드 − 지수, %p) · 가로: 1–4개월. 파랑 원 ●은 가, 주황 마름모 ◆는 나입니다. 같은 눈금을 사용합니다.</p>
      <div className="etf-tracking-plot">
        <svg viewBox={`0 0 ${result.chart.width} ${result.chart.height}`} role="img" aria-label="가는 네 달 모두 −0.2%p. 나는 −0.6, +0.2, −0.6, +0.2%p로 달라집니다.">
          {result.ticks.map(tick => <line key={tick.value} x1={result.chart.left} x2={result.chart.left + result.chart.plotWidth} y1={tick.y} y2={tick.y} stroke={tick.value === 0 ? '#536b79' : '#d2dde3'} strokeDasharray={tick.value === 0 ? '4 3' : undefined} />)}
          {result.series.map(series => <g key={series.id} data-tracking-series={series.id}><polyline points={series.points.map(point => `${point.x},${point.y}`).join(' ')} fill="none" stroke={series.id === 'steady' ? '#286b92' : '#a55b20'} strokeWidth={2.5} />{series.points.map(point => series.id === 'steady' ? <circle key={point.month} data-month={point.month} cx={point.x} cy={point.y} r={5} fill="#286b92" /> : <rect key={point.month} data-month={point.month} x={point.x - 4.5} y={point.y - 4.5} width={9} height={9} transform={`rotate(45 ${point.x} ${point.y})`} fill="#a55b20" />)}</g>)}
        </svg>
        {result.ticks.map(tick => <span className="etf-y-label" key={tick.value} style={{ top: `${tick.fraction * 100}%` }}>{number(tick.value * 100)}</span>)}
        {result.series[0].points.map(point => <span className="etf-x-label" key={point.month} style={{ left: `${point.x / result.chart.width * 100}%` }}>{point.month}개월</span>)}
      </div>
      <figcaption>가는 평균 차이 주변에서 흔들리지 않고, 나는 평균의 위아래로 움직입니다. 점의 높이는 수익률 차이이며 가격이나 누적 수익률이 아닙니다. 재생 없이 모든 관찰을 동시에 읽을 수 있는 정적 그림입니다.</figcaption>
    </figure>
    <div className="invest-table" role="region" tabIndex={0} aria-label="가상 4개월의 수익률과 차이 표"><table><thead><tr><th>월</th><th>지수 수익률</th><th>가 수익률</th><th>나 수익률</th><th>가 − 지수</th><th>나 − 지수</th></tr></thead><tbody>{result.rows.map(row => <tr key={row.month}><th>{row.month}개월</th><td>{percent(row.benchmarkReturn)}</td><td>{percent(row.steadyReturn)}</td><td>{percent(row.varyingReturn)}</td><td>{pp(row.steadyDifference)}</td><td>{pp(row.varyingDifference)}</td></tr>)}</tbody></table></div>
    <div className="etf-tracking-summary">{result.series.map(series => <div key={series.id} data-tracking-summary={series.id}><h4>{series.symbol} {series.label}</h4><dl><div><dt>월별 차이의 산술평균</dt><dd>{pp(series.meanDifference)}</dd></div><div><dt>월별 차이의 표준편차</dt><dd>{pp(series.trackingError)}</dd></div><div><dt>4개월 누적 펀드 수익률</dt><dd>{percent(series.fundReturn)}</dd></div><div><dt>4개월 누적 지수 수익률</dt><dd>{percent(series.benchmarkReturn)}</dd></div><div><dt>4개월 추적차이</dt><dd>{pp(series.trackingDifference)}</dd></div></dl></div>)}</div>
    <p className="invest-note">총수익률 기준의 자체 가상 네 관찰입니다. 분배가 있다면 같은 재투자 기준으로 반영했다고 놓습니다. 월별 차이의 평균과 4개월 누적 수익률 차이는 다른 계산입니다. 표준편차는 이 네 값을 전체로 놓고 제곱편차 합을 4로 나눈 뒤 제곱근을 구한 기술통계이며, 연율화하지 않았습니다. 실제 공시 추적오차나 미래 추정·품질 순위가 아닙니다.</p>
  </div>;
}
