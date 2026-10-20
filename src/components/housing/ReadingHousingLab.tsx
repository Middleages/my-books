import {useState} from 'react';
import {readHousingPack,type HousingPackKind} from '../../simulations/housing/reading.mjs';
import {Lab,StaticTable,Prediction,amount,usePlayback} from './shared';
export function ReadingHousingLab(){
 const [kind,setKind]=useState<HousingPackKind>('rent'),[revealed,setRevealed]=useState(false),p=usePlayback(2,1),r=readHousingPack(kind,revealed);
 const change=(k:HousingPackKind)=>{setKind(k);setRevealed(false);p.seek(k==='rent'?1:2)};
 return <Lab id="reading-housing" title="문서의 한 줄을 돈·사람·날짜에 연결합니다" note="A/B/C는 자체 작성한 가상 발췌입니다. 실제 서류·개인정보·등기 원본이 아니며 서명·기관 로고도 없습니다. 문서에 적혔다는 사실과 진위·유효성·지급·승인을 구분합니다.">
  <label>가상 자료 묶음<select value={kind} onChange={e=>change(e.target.value as HousingPackKind)}><option value="rent">A · 월세 조건표</option><option value="jeonse">B · 전세와 대출 메모</option><option value="buy">C · 매매 지급 계획</option></select></label>
  <div className="housing-document-lines" aria-label="가상 문서의 읽을 줄">{r.lines.map(([k,v],i)=><button key={k} className={i===p.step?'active':''} onClick={()=>p.seek(i)}><b>{i+1}. {k}</b><span>{v}</span></button>)}</div>
  <button aria-pressed={revealed} onClick={()=>{p.seek(p.step);setRevealed(v=>!v)}}>{revealed?'추가 가상 문서 접기':'추가 가상 문서1개 펼치기'}</button>{revealed&&<p className="housing-extra-evidence">{r.reveal}</p>}
  {p.controls}
  <figure className="housing-reading-scene" data-pack={kind} data-evidence-step={p.step} data-pack-revealed={revealed} data-pack-complete={r.complete}>
   <p className="housing-stage" role="status"><b>선택한 문서 줄: {r.lines[p.step][0]}</b><br/>‘{r.lines[p.step][1]}’라고 적혀 있습니다.</p>
   <div className="housing-evidence-connector"><i aria-hidden="true"/><b>아래 관계를 뒷받침하는 문구</b><span>이 선은 송금이나 권리 취득 경로가 아닙니다.</span></div>
   {kind==='rent'&&<div className="housing-reading-rent"><section className={p.step===0?'focus':''}><h4>보증금 {amount(r.deposit!)}</h4><div className="housing-document-obligation"><b>임대인</b><span>반환 약정의 대상<br/>실제 입금과 별개</span><b>임차인</b></div></section><section className={p.step>0?'focus':''}><h4>알려진 매월 소계 {amount(r.knownMonthlySubtotal!)}</h4><div className="housing-reading-subtotal"><span style={{flex:r.rent}}>월세70</span><span style={{flex:r.management}}>관리15</span></div><p>단위:만원.70+15의 구성만 나타냅니다.</p><div className="housing-unknown-cost">? 별도 사용료·기타 비용은 미확인<br/>‘0원’인 가격 조각이 아닙니다.</div><p>{revealed?'추가 문구: 관리비는 공용 청소·경비 항목. 그래도 모든 비용은 알 수 없습니다.':'관리비15만원에 무엇이 포함됐는지 적혀 있지 않습니다.'}</p></section></div>}
   {kind==='jeonse'&&<div className="housing-reading-jeonse"><section className={p.step===0?'focus':''}><h4>계약의 보증금 {amount(r.deposit!)}</h4><div className="housing-document-obligation"><b>임대인</b><span>보증금 반환 의무<br/>대출채무와 별개</span><b>임차인</b></div></section><section className={p.step>0?'focus':''}><h4>대출 메모 {amount(r.plannedLoan!)} · 예정</h4><div className="housing-document-obligation"><b>차입자</b><span>은행 대출채무<br/>실행 사실은 미확인</span><b>은행</b></div><div className={`housing-guarantee-scope ${revealed?'stated':'unknown'}`} data-guarantee-purpose={r.guaranteePurpose}><b>보증 안내의 대상: {revealed?'은행 대출채무라는 추가 문구':'?'}</b><p>{revealed?'대상이 확인된 문구이지 발급·적격·지급 확인이 아닙니다. 반환보증이라고 바꾸지 않습니다.':'이름만으로 임차보증금 반환을 보장한다고 연결하지 않습니다.'}</p></div></section><p>가상 등기 발췌가 있다는 사실도 법적 순위·안전을 판정하지 않습니다.</p></div>}
   {kind==='buy'&&<div className="housing-reading-buy"><h4>같은 가격 {amount(r.price!)}의 세 부분</h4><div className="housing-document-price">{r.parts!.map((n,i)=><section key={i} className={(p.step===0&&i===0)||(p.step===1&&i>0)?'focus':''}><b>{['계약금','중도금','60일 잔금'][i]}</b><span>{amount(n)}</span><i style={{height:`${n/140e6*80}px`}}/></section>)}</div><div className={`housing-document-loan ${p.step===2?'focus':''}`} data-loan-date={r.loanDateStatement}><b>예정 대출 {amount(r.plannedLoan!)} · 실제 입금 미확인</b><div className={revealed?'stated':'unknown'}>{revealed?'문서상 예정일:60일 잔금 지급 전':'? 잔금과 비교할 실행 날짜 미기재'}</div></div><div className="housing-unknown-cost">? 각 날짜 사용 가능 현금 · ? 별도 비용<br/>실제 부족액을0으로 계산하지 않습니다.</div><p>05와 가격이 같아도 시작현금1억5,000만원 가정을 이 자료에 몰래 넣지 않습니다.</p></div>}
   <figcaption>실선 테두리는 문서의 명시 문구, 점선·물음표는 미확인, ‘가정’ 표시는 계산에 따로 넣은 전제입니다. 현재 장면은 문구의 지지를 보여 줄 뿐 실제 자금 이동·법적 효력을 애니메이션으로 만들지 않습니다. 선택은 읽을 줄만 바꾸며 새 계약·지급을 실행하지 않습니다.</figcaption>
  </figure>
  <div className="housing-unresolved"><h4>아직 확인할 것 · 해결됐다고 지우지 않습니다</h4><ul>{r.unknown.map(t=><li key={t}>{t}</li>)}</ul><p>서류 수나 초록 체크 개수로 안전 점수·계약 추천을 만들지 않습니다.</p></div>
  <button onClick={()=>change('rent')}>조건까지 초기화</button>
  <Prediction question="추가 문서에서 대출 예정일 하나를 확인하면 모든 지급 준비가 끝났다고 할까요?" answer={false} reason="실제 입금·각 날짜의 사용 가능 현금·별도 비용·다른 계약 조건은 여전히 따로 확인해야 합니다. 하나의 문구가 모든 빈칸을 채우지는 않습니다."/>
  <StaticTable title="가상 문구와 알 수 없는 사실" headers={['자료','문서에 적힌 것','그 사실만으로 모르는 것']} rows={r.lines.map(([k,v])=>[k,v,r.unknown.join(' · ')])}/>
 </Lab>;
}
