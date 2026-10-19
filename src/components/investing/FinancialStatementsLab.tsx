import { useState } from 'react';
import { usePlayback } from '../money/shared';
import { financialStatementsDefaults, financialStatementsFrames, type FinancialStatementsFrame, type StatementSegment } from '../../simulations/investing/financial-statements.mjs';
import { amount, Building, number, Prediction, Range, StaticTable } from './shared';
import './investing.css';

const styles = {
  cash: { background: '#c78b34' },
  receivable: { background: 'repeating-linear-gradient(135deg,#d9e9f4 0,#d9e9f4 7px,#336d9c 7px,#336d9c 10px)' },
  liability: { background: 'repeating-linear-gradient(90deg,#8b6689 0,#8b6689 10px,#eaddea 10px,#eaddea 12px)' },
  equity: { background: '#407863' },
};
function StatementBar({ segments, label }: { segments: StatementSegment[]; label: string }) {
  return <div>
    <div className={`invest-stack invest-statement-${segments[0].kind === 'cash' ? 'assets' : 'funding'}`} role="img" aria-label={label}>
      {segments.map(part => <i key={part.kind} data-account={part.kind} style={{ ...styles[part.kind], width: `${part.fraction * 100}%` }} />)}
    </div>
    <div className="invest-legend">{segments.map(part => <b key={part.kind}>{part.label} {amount(part.value)}</b>)}</div>
  </div>;
}
function BalanceSheet({ frame }: { frame: FinancialStatementsFrame }) {
  return <figure aria-label="현재 단계 자산과 부채·자본의 균형">
    <h4>이 순간의 재무상태표 · {frame.label}</h4>
    <div className="invest-wallet">
      <b>자산 · 무엇을 보유하는가?</b>
      <StatementBar segments={frame.assetSegments} label={`현금 ${frame.cash} + 매출채권 ${frame.receivables} = 자산 ${frame.assets}단위`} />
      <p style={{ textAlign: 'center', fontWeight: 700 }}>자산 {amount(frame.assets)} = 부채 {amount(frame.liabilities)} + 자본 {amount(frame.equity)}</p>
      <b>부채 + 자본 · 누구의 청구권인가?</b>
      <StatementBar segments={frame.fundingSegments} label={`부채 ${frame.liabilities} + 자본 ${frame.equity} = ${frame.assets}단위`} />
      <div className="invest-scale">위·아래 띠와 모든 단계의 같은 눈금: 0–{number(frame.balanceScale)}단위. 빈 배경은 남은 눈금이며 자산이 아닙니다.</div>
    </div>
    <figcaption>황토 단색 = 현금, 파랑 사선 = 받을 돈인 매출채권, 보라 세로선 = 부채, 초록 단색 = 자본. 두 띠의 채워진 길이는 매 단계 같습니다. 자본은 별도의 현금 통장이 아닙니다.</figcaption>
  </figure>;
}

export function FinancialStatementsLab() {
  const [creditSales, setCreditSales] = useState(financialStatementsDefaults.creditSales);
  const [prediction, setPrediction] = useState('');
  const result = financialStatementsFrames({ creditSales });
  const play = usePlayback(result.frames.length - 1);
  const frame = result.frames[play.step], split = frame.saleSplit;
  const changeCredit = (value: number) => { setCreditSales(value); setPrediction(''); play.rewind(); };
  return <section className="invest-lab" aria-label="기업의 이익과 현금 실험">
    <h3>같은 매출 120, 받는 시점만 바꾸면?</h3>
    <p>가상 서비스 기업의 당기 초 현금은 100, 부채는 40, 자본은 60단위입니다. 당기 서비스 매출 120과 현금으로 지불할 비용 80은 고정합니다. 외상액만 바꿉니다.</p>
    <Range label="매출 120단위 중 외상액" value={creditSales} max={120} step={10} unit="단위" onChange={changeCredit} />
    <div className="invest-options"><button aria-pressed={creditSales === 0} onClick={() => changeCredit(0)}>전액 현금 · 외상 0</button><button aria-pressed={creditSales === 120} onClick={() => changeCredit(120)}>전액 외상 · 외상 120</button></div>
    <Prediction question="당기 말 현금은 기초 100보다?" value={prediction} onChange={setPrediction} options={[["up", "늘어난다"], ["same", "그대로다"], ["down", "줄어든다"]]} />
    {play.controls}
    <button onClick={() => play.seek(3)}>당기 말 바로 보기</button>
    <button onClick={() => changeCredit(financialStatementsDefaults.creditSales)}>조건까지 초기화</button>
    <h4 className="invest-stage" aria-live="polite">{frame.label}</h4>
    <ol className="invest-timeline">{result.frames.map(row => <li key={row.phase} aria-current={row.phase === frame.phase ? 'step' : undefined}>{row.label}</li>)}</ol>
    <figure aria-label="서비스 매출이 현금과 매출채권으로 갈라지는 경로">
      <div className="invest-company-source"><Building><b>{split.recognized ? '당기에 제공한 서비스' : '앞으로 제공할 서비스'}</b><strong>{split.recognized ? `당기 매출 ${amount(split.total)}` : '아직 매출 인식 전'}</strong><span>{split.recognized ? '아래는 서비스 완료 때의 대금 분기' : `아래는 ${amount(split.total)}의 예정 결제 조건`}</span></Building></div>
      <div className="invest-dividend-fork">
        <div className="invest-wallet" style={{ borderColor: '#a46c25' }}>
          <b>↓ 즉시 수령 경로</b>
          <p>서비스 완료 때 현금 <strong>{amount(split.cash)}</strong></p>
          <div className="invest-stack" aria-hidden="true"><i style={{ ...styles.cash, width: `${split.cashFraction * 100}%` }} /></div>
          <span className="invest-scale">같은 눈금 0–120 · {split.recognized ? '당기에 실제 수령' : '아직 입금 전'}</span>
        </div>
        <div className="invest-wallet" style={{ border: '2px dashed #336d9c' }}>
          <b>↓ 받을 권리 경로</b>
          <p>서비스 완료 때 매출채권 <strong>{amount(split.credit)}</strong></p>
          <div className="invest-stack" aria-hidden="true"><i style={{ ...styles.receivable, width: `${split.creditFraction * 100}%` }} /></div>
          <span className="invest-scale">같은 눈금 0–120 · {split.collected ? '다음 기간에 회수 완료' : split.recognized ? '당기에는 아직 현금 아님' : '아직 채권 발생 전'}</span>
        </div>
      </div>
      <div className="invest-sale-path"><b>{split.collected ? '회수 실행' : '다음 기간의 회수 경로'}</b><p>매출채권 {amount(split.credit)} → 현금 {amount(split.credit)}. 새 매출은 0입니다. {split.collected ? `현재 남은 매출채권 ${amount(frame.receivables)}.` : '아직 회수하지 않았습니다.'}</p></div>
      <figcaption>서비스 대금의 두 갈래를 보여 줍니다. 현금과 매출채권은 서로 다른 자산입니다. 아래 재무상태표는 이 대금 분기에 기초 잔액·비용·회수까지 반영한 현재 장부입니다.</figcaption>
    </figure>
    <BalanceSheet frame={frame} />
    <div className="invest-comparison">
      <div className="invest-wallet"><h4>{frame.period}의 손익 · 기간 누계</h4><p>매출 {amount(frame.periodRevenue)} − 비용 {amount(frame.periodExpenses)}</p><strong>이익 {amount(frame.periodProfit)}</strong><p className="invest-note">{frame.phase === 'collection' ? '새 서비스를 제공하지 않았습니다. 당기 말 확정 이익 40은 이전 기간의 기록으로 남습니다.' : '비용까지 반영한 당기 말 이익은 외상액과 관계없이 40입니다. 서비스 완료 단계는 아직 비용 반영 전입니다.'}</p></div>
      <div className="invest-wallet"><h4>{frame.period}의 현금 · 기간 누계</h4><p>기초 현금 {amount(frame.periodOpeningCash)} + 영업 현금흐름 {amount(frame.periodOperatingCashFlow)}</p><strong>현재 현금 {amount(frame.cash)}</strong><p className="invest-note">영업 현금흐름 = 기간 이익 {number(frame.periodProfit)} − 매출채권 증감 {number(frame.periodReceivablesChange)} = {amount(frame.periodOperatingCashFlow)}. 이 단순 사례에서만 조정 항목이 매출채권 하나입니다.</p></div>
    </div>
    <p className="invest-result" role="status">{play.step >= 3 && prediction ? `${prediction === result.closing.closingCashDirection ? '예측과 같습니다.' : '예측과 다릅니다.'} 당기 말 현금은 ${amount(result.closing.cash)}입니다. ` : ''}{frame.message}</p>
    <p className="invest-note">당기 말 기록은 다음 기간 회수로 고쳐 쓰지 않습니다. 단계는 학습용 관찰 순서입니다. 모든 계약의 수익 인식 시점을 재현하지 않으며, 새 차입·투자·배당·세금·이자·감가상각·회수 실패는 생략합니다. 재생하지 않아도 단계 버튼과 전체 장부로 같은 내용을 볼 수 있습니다.</p>
    <StaticTable title="기초부터 다음 기간 회수까지 전체 장부"><table><thead><tr><th>단계</th><th>기간</th><th>현금(단위)</th><th>매출채권(단위)</th><th>자산(단위)</th><th>부채(단위)</th><th>자본(단위)</th><th>기간 매출(단위)</th><th>기간 비용(단위)</th><th>기간 이익(단위)</th><th>기간 영업 현금흐름(단위)</th></tr></thead><tbody>{result.frames.map(row => <tr key={row.phase} data-phase={row.phase}><th>{row.label}</th><td>{row.period}</td><td>{number(row.cash)}</td><td>{number(row.receivables)}</td><td>{number(row.assets)}</td><td>{number(row.liabilities)}</td><td>{number(row.equity)}</td><td>{number(row.periodRevenue)}</td><td>{number(row.periodExpenses)}</td><td>{number(row.periodProfit)}</td><td>{number(row.periodOperatingCashFlow)}</td></tr>)}</tbody></table></StaticTable>
  </section>;
}
