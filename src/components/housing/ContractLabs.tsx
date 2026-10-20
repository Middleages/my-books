import { useState } from 'react';
import { contractCases, contractFrames, recoveryFrames, type ContractCase, type GuaranteeScenario } from '../../simulations/housing/contracts.mjs';
import { amount, Lab, Range, StaticTable, Bar, Prediction, usePlayback } from './shared';

export function ContractLab() {
  const [caseId,setCase]=useState<ContractCase>('matched'),p=usePlayback(3);
  const frames=contractFrames(caseId),f=frames[p.step],s=f.scenario;
  const explanations=[
    '계약서에는 약속이 적혀 있습니다. 목적물·당사자·금액·날짜를 읽되 아직 다른 자료와 대조하지 않았습니다.',
    '계약의 주소와 사람을 별도 자료에 연결합니다. 선이 이어져도 표시가 일치하는지, 권한의 근거가 있는지는 서로 다른 질문입니다.',
    '잔금 직전의 가상 자료를 펼칩니다. 계약 전 자료를 한 번 읽었다고 그 뒤 권리 변화가 멈추는 것은 아닙니다.',
    '확정일자, 주택 인도, 전입신고는 다른 사실입니다. 이 예에서는 인도와 전입신고를 30일에 마친 것으로 주지만 실제 권리·순위·회수액은 판정하지 않습니다.',
  ];
  return <Lab id="contract" title="계약의 문장을 근거 자료로 연결하기" note="문서·주소·이름·날짜는 가상입니다. 자료 읽기 순서를 관찰하며 실제 계약의 적격·안전·우선순위를 판정하지 않습니다.">
    <figure className="housing-contract-scene" data-contract-step={p.step} data-case={caseId}>
      <div className="housing-document"><div className="housing-document-corner" aria-hidden="true"/><h4>가상 임대차계약 · 약속</h4><dl><dt>목적물</dt><dd>가상길 10 · 201호</dd><dt>당사자</dt><dd>{s.signer} / 민지</dd><dt>금액</dt><dd>보증금 1억 4,000만원</dd><dt>날짜</dt><dd>0일 계약 · 30일 인도 예정</dd></dl></div>
    <div className="housing-controls"><label>근거 사례<select value={caseId} onChange={e=>{setCase(e.target.value as ContractCase);p.rewind()}}>{Object.entries(contractCases).map(([id,v])=><option key={id} value={id}>{v.label}</option>)}</select></label></div>
    {p.controls}<button onClick={()=>{setCase('matched');p.rewind()}}>조건까지 초기화</button>
      {p.step<=1&&<div className="housing-evidence-branches">
        <div className={`housing-evidence-route ${f.evidenceVisible?'revealed':''}`}><b className="housing-evidence-line" aria-hidden="true">↓</b><strong>주소를 대조</strong><div className="housing-record"><h4>등기·건축물 관련 자료의 표시</h4><p>{f.evidenceVisible?s.address:'자료를 아직 펼치지 않음'}</p><p data-address-match={String(f.addressMatch)}>{f.addressMatch===null?'일치 여부 미확인':f.addressMatch?'제시 자료의 주소 표시 일치':'주소 불일치 · 다른 호수'}</p></div></div>
        <div className={`housing-evidence-route ${f.evidenceVisible?'revealed':''}`}><b className="housing-evidence-line" aria-hidden="true">↓</b><strong>사람·권한을 대조</strong><div className="housing-record housing-authority"><h4>당사자 확인 · 임대 권한 근거</h4><p>{f.evidenceVisible?s.authority:'자료를 아직 펼치지 않음'}</p><p data-authority-shown={String(f.authorityShown)}>{f.authorityShown===null?'권한 자료 미확인':f.authorityShown?'이 가상 사례에 제시된 근거 있음':'추가 확인 필요 · 근거 없음'}</p></div></div>
      </div>}
      {p.step===2&&<div className="housing-record-history"><div><strong>계약 전 자료</strong><p>제시된 가상 권리 기재</p></div><b aria-hidden="true">↓</b><div className={f.rechecked&&f.newEntry?'housing-warning':''}><strong>잔금 전 다시 읽기</strong><p data-new-entry={String(f.newEntry)}>{f.rechecked?s.later:'아직 다시 확인하지 않음'}</p></div></div>}
      <p className="housing-stage">{f.evidenceVisible?s.note:'문서가 있다는 사실과 내용이 검증됐다는 사실을 구별하세요.'}</p>
      {p.step===3&&<div className="housing-event-lanes"><h4>같은 날짜 줄, 다른 사실</h4>{f.events.map((e,i)=><div className={`housing-event ${e.visible?'observed':''}`} key={i}><span>{e.day}일</span><b aria-hidden="true">{e.visible?'●':'○'}</b><span>{e.visible?e.label:'아직 이 단계에서 제시하지 않은 사실'}</span></div>)}</div>}
      <p>인도와 주민등록 요건을 갖춘 경우의 ‘다음 날’이라는 일반 규정을 읽는 예입니다. 확정일자만으로 인도·전입신고를 대체하지 않습니다. 주소·적용 범위·다른 권리·요건 유지와 절차는 별도 확인 대상입니다.</p>
    <div className="housing-stage" role="status"><strong>{p.step}. 근거를 읽는 단계</strong><p>{explanations[p.step]}</p></div>
      <figcaption>접힌 모서리 문서는 계약의 약속, 아래 두 갈래 선은 확인해야 할 근거입니다. 점선은 아직 펼치지 않은 자료, 실선은 공개한 자료입니다. 원의 채움은 예시 사실의 공개일 뿐 보호 점수나 법적 판정이 아닙니다. 모든 단계와 근거는 정적 표에서도 읽을 수 있습니다.</figcaption>
    </figure>
    <Prediction question="확정일자를 먼저 받았으니 입주와 전입신고 사실은 확인하지 않아도 될까요?" answer={false} reason="확정일자와 대항요건은 다른 사실입니다. 우선변제 관계도 다른 권리·유지 요건·절차와 함께 확인해야 하며, 전액 반환 보장이 아닙니다."/>
    <StaticTable title="계약 항목과 제시된 근거" headers={['확인 질문','계약 또는 첫 자료','별도 자료·남은 질문']} rows={[
      ['같은 집인가','가상길 10 · 201호',s.address],['임대할 권한이 있는가',s.signer,s.authority],['그 뒤 달라졌는가','계약 전 자료',s.later],['표시가 맞으면 안전한가','이 사례 자료만 대조','숨은 권리·세금·다른 임차인·반환 여력은 미확인'],
    ]}/>
    <StaticTable title="가상 날짜와 서로 다른 사실" headers={['날짜','제공한 사실','읽을 때 주의할 점']} rows={[
      ['0일','계약 서명·확정일자 부여를 가정','인도·전입신고를 대신하지 않음'],['30일','주택 인도·전입신고 완료를 가정','실제 자료의 적합성과 요건 유지 별도'],['31일','일반 규정의 다음 날을 관찰','실제 순위·회수액 계산 아님'],
    ]}/>
  </Lab>;
}

export function DepositRiskLab() {
  const [proceeds,setProceeds]=useState(16000),[prior,setPrior]=useState(5000),[guarantee,setGuarantee]=useState<GuaranteeScenario>('unknown'),[arrival,setArrival]=useState(60),p=usePlayback(4);
  const frames=recoveryFrames({proceeds:proceeds*10000,prior:prior*10000,guarantee,arrivalDay:arrival}),f=frames[p.step];
  const reset=()=>{setProceeds(16000);setPrior(5000);setGuarantee('unknown');setArrival(60);p.rewind()};
  return <Lab id="deposit-risk" title="회수 재원, 받을 권리, 도착한 돈은 다릅니다" note="순서를 외부에서 정해 준 자체 배분 연습입니다. 한국의 법정 배당 순위·실제 경매가격·보증 가입 및 지급 심사를 계산하지 않습니다. 모든 날짜는 경과일 가정입니다.">
    <figure className="housing-recovery-scene" data-recovery-step={p.step}>
      <h4>1. 가상 재원을 나누기 · 아직 실제 입금과는 별개</h4>
      <div className="housing-waterfall-source"><strong>집 처분 뒤 배분할 가상 재원</strong><Bar label="주어진 재원" value={f.proceeds} max={300e6} color="home"/></div>
      <div className="housing-waterfall-arrow" aria-hidden="true">↓</div>
      <div className="housing-waterfall"><div><span>① 먼저 지급하기로 주어진 청구</span><strong>{amount(f.first)}</strong></div><div><span>② 남은 재원에서 세입자</span><strong data-allocated={f.tenant}>{amount(f.tenant)}</strong></div><div><span>③ 배분 뒤 남는 재원</span><strong>{amount(f.unused)}</strong></div></div>
      <div className="housing-allocation-strip" role="img" aria-label={`0–3억원 공통 눈금. 먼저 ${amount(f.first)}, 세입자 ${amount(f.tenant)}, 남음 ${amount(f.unused)}.`}>{[[f.first,'prior'],[f.tenant,'tenant'],[f.unused,'unused']].map(([v,c])=><i key={c} className={String(c)} style={{width:`${Number(v)/300e6*100}%`}} data-allocation={v}/>)}</div>
      <p>띠의 공통 눈금 0–3억원. 황토 ① · 청록 ② · 회색 ③. 합계는 주어진 재원과 같습니다.</p>
      <Bar label="아직 회수되지 않는 청구" value={f.unrecovered} max={140e6} color="claim"/>
      <p>세입자 청구 1억 4,000만원 중 이 배분에서 미회수 {amount(f.unrecovered)}. 영구 손실 확정액이나 채권 소멸액이라는 뜻은 아닙니다.</p>
    <Range label="배분할 가상 재원" value={proceeds} max={30000} step={1000} onChange={v=>{setProceeds(v);p.rewind()}}/><Range label="먼저 지급할 가상 청구액" value={prior} max={30000} step={1000} onChange={v=>{setPrior(v);p.rewind()}}/>
      <h4>2. 두 보증은 현금 경로가 다릅니다</h4>
      <div className="housing-guarantee-types"><div><strong>전세자금대출 보증</strong><div className="housing-cash-path"><span>보증기관</span><b className="housing-flow-arrow" aria-hidden="true">→</b><span>대출 은행</span></div><p>은행에 대한 대출 보증 관계. 임차인의 보증금 반환과 자동으로 같아지지 않습니다.</p></div><div><strong>보증금 반환보증</strong><div className="housing-cash-path"><span>보증기관</span><b className="housing-flow-arrow" aria-hidden="true">→</b><span>임차인 등 정당한 수령자</span></div><p>상품·권리관계에 따른 반환 보증. 가입·청구·심사·실제 지급은 구별합니다.</p></div></div>
      <div className="housing-recovery-timeline"><h4>3. 민지에게 실제 들어온 돈 · 현재 {f.day}일</h4>    <div className="housing-controls"><label>반환보증 사례<select value={guarantee} onChange={e=>{setGuarantee(e.target.value as GuaranteeScenario);p.rewind()}}><option value="unknown">조건 미확인</option><option value="none">반환보증 없음</option><option value="assumed">적격·부족분 전액 지급을 가정</option></select></label><label>가상 보증금 도착<select value={arrival} onChange={e=>{setArrival(Number(e.target.value));p.rewind()}}><option value={60}>60일</option><option value={120}>120일</option></select></label></div>
    {p.controls}<button onClick={reset}>조건까지 초기화</button>

      <div className="housing-time-stops housing-five-stops">{frames.map(v=><span key={v.day} aria-current={v.step===p.step?'step':undefined}>{v.day}일</span>)}</div>
      <div className="housing-payment-tracks">
        <div><strong>임대인 측 배분 재원</strong><div className={`housing-payment-line ${f.landlordCash?'arrived':''}`}><span>{f.landlordCash?'도착':'아직 지급 전'}</span><b aria-hidden="true">↓</b></div><span>민지 {amount(f.landlordCash)}</span></div>
        <div><strong>가상 반환보증 기관</strong><div className={`housing-payment-line ${f.guaranteeCash?'arrived':''}`}><span>{f.guaranteeStatus}</span><b aria-hidden="true">↓</b></div><span>민지 {amount(f.guaranteeCash)}</span></div>
      </div>
      <Bar label="민지의 실제 회수 현금" value={f.totalCash} max={140e6}/><Bar label="아직 현금화되지 않은 원금" value={f.remainingClaim} max={140e6} color="claim"/>
      <p data-cash-arrived={f.totalCash} data-institution-claim={f.institutionClaim}>가상 지급분에 대응하는 기관 회수권 기록은 {amount(f.institutionClaim)}입니다. 이 모형의 현금 도착 시점 장부일 뿐 실제 채권양도 시점을 재현하지 않습니다. 실제로는 보증서 발급 전 또는 이행 청구 전에 채권양도가 이뤄질 수 있으며, 양도와 현금 입금은 별개입니다. 같은 원금을 중복 회수하지 않습니다.</p>
      <p className="housing-stage">민지의 대출 원금은 {amount(f.debt)} 그대로입니다. 반환금 수령만으로 대출 상환까지 실행한 것은 아닙니다. 실제 상품은 채권양도·질권·상환 정산 등에 따라 지급 경로가 다를 수 있습니다.</p>
      </div><figcaption>배분 띠는 순서를 미리 정한 돈 나누기, 아래 경로는 시간에 따른 실제 도착액입니다. 점선은 미도착, 실선은 도착입니다. 10일 배분 입금·30일 가상 심사 결정·60/120일 가상 지급은 법정 기한이나 기관 처리기간이 아닙니다. 적격 가정은 부족분 전액 보장·별도 공제 없음까지 주어진 교육 조건입니다.</figcaption>
    </figure>
    <div className="housing-stage" role="status"><strong>{f.day}일 · {f.guaranteeStatus}</strong><p>실제 도착 {amount(f.totalCash)} / 남은 청구 {amount(f.remainingClaim)}. {guarantee==='unknown'?'조건을 모르므로 지급액·지급일을 확정하지 않습니다.':guarantee==='assumed'?'가정한 지급일 전에는 심사 결정이 있어도 현금으로 더하지 않습니다.':'보증 경로에서는 돈이 들어오지 않습니다.'}</p></div>
    <Prediction question="반환보증이 있으니 지금 이사 자금도 도착했다고 계산해도 될까요?" answer={false} reason="가입·이행 요건·청구·심사·실제 지급은 서로 다릅니다. 돈이 필요한 날짜에 사용할 수 있는지는 실제 입금과 별도로 확인합니다."/>
    <StaticTable title="회수 단계별 현금과 남은 권리" headers={['경과일','임대인 측 도착','기관 도착','미현금화 원금','지급분 대응 회수권 기록','미상환 대출']} rows={frames.map(v=>[`${v.day}일`,amount(v.landlordCash),amount(v.guaranteeCash),amount(v.remainingClaim),amount(v.institutionClaim),amount(v.debt)])}/>
  </Lab>;
}
