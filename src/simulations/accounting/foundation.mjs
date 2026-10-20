import {createJournalEngine} from './journal.mjs';
// Small, deterministic teaching ledger. Not an accounting system or filing engine.
export const accounts = Object.freeze({
  cash: Object.freeze({ label: '현금', kind: 'asset', normal: 'debit' }),
  receivable: Object.freeze({ label: '매출채권', kind: 'asset', normal: 'debit' }),
  equipment: Object.freeze({ label: '설비', kind: 'asset', normal: 'debit' }),
  loan: Object.freeze({ label: '차입금', kind: 'liability', normal: 'credit' }),
  capital: Object.freeze({ label: '납입자본', kind: 'equity', normal: 'credit' }),
});
const finite = value => typeof value === 'number' && Number.isFinite(value);
const engine=createJournalEngine(accounts,{cash:500,loan:200,capital:300});
export const {createLedger,post,snapshot}=engine;
export const boundaryModes = Object.freeze(['contribution','borrowing','collection']);
export const modeLabels = Object.freeze({ contribution:'소유주의 출자', borrowing:'은행에서 차입', collection:'기존 외상대금 회수' });
const counterpart = { contribution:'capital', borrowing:'loan', collection:'receivable' };
export function boundaryFrames({ mode = 'contribution', amount = 50 } = {}) {
  if (!boundaryModes.includes(mode)) throw new RangeError('거래 종류를 확인하세요.');
  if (!finite(amount) || amount < 0 || amount > 100) throw new RangeError('금액은 0–100 가상단위입니다.');
  const opening = mode === 'collection' ? {cash:500-amount,receivable:amount,loan:200,capital:300} : {cash:500,loan:200,capital:300};
  const state = createLedger(opening);
  const event = { id:`boundary-${mode}`, label:modeLabels[mode], rows:[{account:'cash',side:'debit',amount},{account:counterpart[mode],side:'credit',amount}] };
  const after = post(state,event);
  const actor = { contribution:'소유주', borrowing:'은행', collection:'고객' }[mode];
  const relation = { contribution:'납입자본 증가', borrowing:'차입금 증가', collection:'매출채권 감소' }[mode];
  const reason = { contribution:'소유주가 자본을 보탠 사건입니다. 상품을 팔아 번 매출이 아닙니다.', borrowing:'갚아야 할 의무가 같은 금액만큼 늘었습니다. 빌린 돈을 매출로 세지 않습니다.', collection:'이미 있던 받을 권리가 현금으로 바뀌었습니다. 매출을 새로 기록하지 않습니다.' }[mode];
  return [
    { title:'거래 전 · 회사 경계 확인', detail:mode==='collection'?`현금 ${500-amount}와 매출채권 ${amount}를 합쳐 자산 500입니다. 다른 사례와 자산 합계는 같고 구성만 다릅니다.`:'현금 500 = 차입금 200 + 납입자본 300입니다. 소유주의 개인 통장은 회사 경계 밖입니다.', state },
    { title:'뜻 확인 · 아직 장부 변경 없음', detail:`${actor}에게서 ${amount}이 들어올 예정입니다. 통장 금액만 보지 말고 ${relation}인지 먼저 확인합니다. 이 화면은 처리 지연이나 실제 입금을 뜻하지 않습니다.`, state },
    { title:'확정 후 · 양쪽 기록 함께 반영', detail:reason, state:after },
  ].map((f,index)=>({ index,title:f.title,detail:f.detail,...snapshot(f.state),mode,amount,actor,relation,event,committed:index===2,before:snapshot(state),after:snapshot(after),scale:650 }));
}
export function doubleEntryFrames() {
  const events = [
    { id:'T01',label:'추가 출자 50',detail:'현금과 납입자본이 50씩 늘어납니다. 회사가 번 매출은 0입니다.',rows:[{account:'cash',side:'debit',amount:50},{account:'capital',side:'credit',amount:50}] },
    { id:'T02',label:'차입 실행 100',detail:'현금과 차입금이 100씩 늘어납니다. 자산은 커졌지만 자본은 그대로입니다.',rows:[{account:'cash',side:'debit',amount:100},{account:'loan',side:'credit',amount:100}] },
    { id:'T03',label:'설비 현금취득 240',detail:'현금 240이 줄고 설비 240이 생깁니다. 자산의 구성만 바뀌며 자산 합계는 650 그대로입니다.',rows:[{account:'equipment',side:'debit',amount:240},{account:'cash',side:'credit',amount:240}] },
  ];
  let state=createLedger();const initial=snapshot(state);
  const frames=[{index:0,title:'기초 · 아직 거래 없음',detail:'현금 500 = 차입금 200 + 납입자본 300입니다. M1 전체가 아닌 세 거래만 보는 발췌 실습입니다.',...initial,before:initial,event:null,scale:650}];
  for(const event of events){const before=snapshot(state);state=post(state,event);frames.push({index:frames.length,title:`${event.id} · ${event.label}`,detail:event.detail,...snapshot(state),before,event,scale:650});}
  return frames;
}
export function ledgerSegments(frame) {
  return {
    assets:['cash','receivable','equipment'].map(key=>({key,label:accounts[key].label,value:frame.balances[key],fraction:frame.balances[key]/frame.scale})),
    claims:['loan','capital'].map(key=>({key,label:accounts[key].label,value:frame.balances[key],fraction:frame.balances[key]/frame.scale})),
  };
}
