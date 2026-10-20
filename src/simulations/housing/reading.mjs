const packs={
 rent:{title:'A · 월세 조건표',lines:[['보증금','2,000만원'],['월세','매월70만원'],['관리비 표시','매월15만원 · 포함 항목 미기재']],unknown:['전기·가스 등 별도 사용료','다른 비용·지급일·반환 조건'],reveal:'추가 가상 문서: 관리비15만원은 공용 청소·경비 항목이라고 적혀 있습니다.',deposit:20e6,rent:700000,management:150000},
 jeonse:{title:'B · 전세와 대출 메모',lines:[['전세보증금','1억4,000만원'],['대출 메모','2,000만원 예정 · 실행 확인 없음'],['자료 제목','가상 등기 발췌·보증 안내 · 대상 채무 미기재']],unknown:['실제 대출 실행·보증 발급 여부','반환보증 가입·적격·지급 여부','원본 자료·권리 변동·법적 순위'],reveal:'추가 가상 안내: 여기서 설명하는 보증의 대상은 은행 대출채무입니다.',deposit:140e6,plannedLoan:20e6},
 buy:{title:'C · 매매 지급 계획',lines:[['가격·계약금','2억원 중 계약금2,000만원'],['중도금·잔금','중도금4,000만원·60일 잔금1억4,000만원'],['대출 예정','8,000만원 · 실행일 미기재']],unknown:['각 지급일의 실제 사용 가능 현금','취득·중개·등기 등 별도 비용','실제 실행·지급·권리 이전 완료'],reveal:'추가 가상 일정 문서: 대출8,000만원의 실행 예정일이60일 잔금 지급 전으로 확인됐다고 적혀 있습니다.',price:200e6,parts:[20e6,40e6,140e6],plannedLoan:80e6}
};
// Written facts are never authentication, actual payments, eligibility, or legal priority.
export function readHousingPack(kind='rent',revealed=false){
 if(!Object.hasOwn(packs,kind)||typeof revealed!=='boolean')throw new RangeError('pack/revealed');
 const p=packs[kind];return {...p,kind,revealed,lines:p.lines.map(x=>[...x]),unknown:[...p.unknown,...(!revealed?[kind==='rent'?'관리비 포함 항목':kind==='jeonse'?'보증이 대상으로 삼는 채무':'예정 대출의 실행 날짜']:[])],knownMonthlySubtotal:kind==='rent'?p.rent+p.management:null,actualCash:null,actualLoan:null,eligibility:null,legalPriority:null,complete:false,guaranteePurpose:kind==='jeonse'&&revealed?'bank-loan':'unknown',loanDateStatement:kind==='buy'&&revealed?'before-day60-payment':'unknown',parts:p.parts?[...p.parts]:undefined};
}
