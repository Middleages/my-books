export const roles=[{id:'nutrition',label:'영양 공급',note:'필요한 영양을 공급하는 역할입니다. 이 장의 관찰만으로 영양 충족을 판정하지 않습니다.'},{id:'skill',label:'기술 연습',note:'손·입·도구를 사용하는 경험과 실제 섭취를 따로 기록합니다.'},{id:'relationship',label:'신호와 관계',note:'보호자가 아이의 신호를 살피고 반응하는 과정입니다. 거부의 원인을 한 가지로 단정하지 않습니다.'},{id:'safety',label:'안전 조건',note:'자세·음식의 준비·보호자 관찰은 양과 별개의 조건입니다. 많이 먹었다고 안전을 증명하지 않습니다.'}];
export const meals=[
 {id:'known',label:'행선지가 구분된 합성 기록',offered:40,remaining:12,intake:18,spilled:6,discarded:4,unknown:0,note:'양이 모두 알려져 있다고 가정한 계산 예시입니다. 28g이 접시에서 사라졌지만 섭취로 가정한 양은18g입니다.'},
 {id:'unknown',label:'섭취 여부를 모르는 합성 기록',offered:40,remaining:12,intake:null,spilled:6,discarded:4,unknown:18,note:'남은18g의 행선지를 모릅니다. 그 양을 자동으로 먹은 양에 넣지 않습니다.'},
 {id:'empty',label:'양을 기록하지 않은 장면',offered:null,remaining:null,intake:null,spilled:null,discarded:null,unknown:null,note:'기록이 없다는 사실은 제시량이나 섭취량이0g이라는 뜻이 아닙니다.'}
];
export function mealFrame(id){const f=meals.find(x=>x.id===id);if(!f)throw new RangeError('synthetic record required');const destinations=[['remaining','접시에 남음'],['intake','섭취로 확인한 양'],['spilled','흘림'],['discarded','버림'],['unknown','행선지 미확인']].map(([key,label])=>({key,label,amount:f[key]}));return {...f,destinations,disappeared:f.offered===null?null:f.offered-f.remaining};}
export const experiences=[{id:'offered',label:'음식 제시',x:40,text:'접시에 놓았다는 사실입니다. 입에 넣거나 삼켰다는 뜻은 아닙니다.'},{id:'explored',label:'손으로 탐색',x:115,text:'손으로 만지는 장면입니다. 기술 경험은 남지만 섭취량은 알 수 없습니다.'},{id:'mouth',label:'입에 넣음 관찰',x:195,text:'입에 넣었다는 관찰과 삼켰다는 확인을 구별합니다. 입에서 나온 양이나 흘림은 별도입니다.'}];
export const readinessCases=[
 {id:'posture',label:'자세 기록만 있는 사례',known:'지지받아 앉아 머리를 유지하는 모습을 기록했습니다.',unknown:'음식을 입에 넣은 뒤의 반응과 삼킴은 이 기록에서 모릅니다.',question:'어떤 준비 신호를 함께 확인하고 언제 시작할지 진료 담당자에게 물어봅니다.',kind:'partial'},
 {id:'observed',label:'여러 장면을 기록한 사례',known:'앉은 자세, 머리 조절, 입을 여는 반응에 관한 메모가 있습니다.',unknown:'이 메모만으로 삼킴의 안전이나 개인의 시작 시점을 판단할 수 없습니다.',question:'모르는 관찰과 개별 건강 상황을 함께 상의합니다. 기록 개수로 준비 완료를 판정하지 않습니다.',kind:'partial'},
 {id:'preterm',label:'조산 또는 진료 상황이 있는 사례',known:'조산이나 별도 의학적 고려가 있는 가상 상황입니다.',unknown:'생활 월령만으로 개인의 식사 준비와 필요한 도움을 알 수 없습니다.',question:'담당 의료진과 개인의 시작 시기·자세·먹는 방법을 상의합니다. 교정연령을 자동 시작일 계산기로 쓰지 않습니다.',kind:'clinical'}
];
export function readinessFrame(id){const f=readinessCases.find(x=>x.id===id);if(!f)throw new RangeError('synthetic case required');return {...f,sourceAge:'약 6개월 무렵',decision:'시작 가능 여부 판정 없음',source:{country:'미국',organization:'CDC',updated:'2026-04-14',checked:'2026-10-20'}};}
