export const varietySource={source:'CDC 보완식 안내 · WHO 영유아 먹이기',version:'CDC 2026-04-14 · WHO 2026-08-04',checkedAt:'2026-10-20',scope:'식품 다양성의 일반 원칙, 개인 식단이나 영양 평가 아님'};
export const foodGroups=[{id:'grain',label:'곡류'},{id:'vegetable',label:'채소'},{id:'fruit',label:'과일'},{id:'protein',label:'고기·콩류 등'},{id:'dairy',label:'유제품'}];
export const weekRecords=[
 {day:1,entries:[{food:'쌀',group:'grain',confirmed:true},{food:'당근',group:'vegetable',confirmed:null}]},
 {day:2,entries:[{food:'두부',group:'protein',confirmed:true},{food:'사과',group:'fruit',confirmed:null}]},
 {day:3,entries:[{food:'귀리',group:'grain',confirmed:true},{food:'당근',group:'vegetable',confirmed:true}]},
 {day:4,entries:null},
 {day:5,entries:[{food:'고기',group:'protein',confirmed:null},{food:'무가당 요거트',group:'dairy',confirmed:true}]},
 {day:6,entries:[{food:'사과',group:'fruit',confirmed:true},{food:'쌀',group:'grain',confirmed:true}]},
 {day:7,entries:[{food:'두부',group:'protein',confirmed:true},{food:'당근',group:'vegetable',confirmed:null}]}
];
export function varietyFrame(mode='offered',highlight='all'){const basis=mode==='confirmed'?'confirmed':'offered',selected=foodGroups.some(g=>g.id===highlight)?highlight:'all';return {basis,highlight:selected,groups:foodGroups.map(g=>({...g})),days:weekRecords.map(d=>({day:d.day,missing:d.entries===null,cells:foodGroups.map(g=>{const entries=(d.entries??[]).filter(e=>e.group===g.id);const confirmed=entries.some(e=>e.confirmed===true);return {group:g.id,foods:entries.map(e=>e.food),state:entries.length?basis==='offered'?'offered':confirmed?'confirmed':'unknown':'unrecorded',highlighted:selected==='all'||selected===g.id};})})),nutrientAdequacy:null,deficiency:null,source:{...varietySource}};}
export const allergyCases=[
 {id:'mixed',label:'혼합 재료의 합성 기록',ingredients:['쌀','달걀'],unknownIngredient:true,eaten:'먹은 사실을 확인한 가상 장면',time:'합성 기록 10:00',observation:'보호자가 피부 변화를 메모한 가상 장면. 원인은 미확정입니다.',question:'전체 재료와 관찰 내용을 함께 전달합니다. 시간 순서만으로 원인 재료를 고르지 않습니다.'},
 {id:'uncertain',label:'시각과 섭취가 미확인인 기록',ingredients:['두부'],unknownIngredient:false,eaten:null,time:null,observation:'관찰 내용을 기록하지 않은 가상 장면. 증상이 없었다는 뜻은 아닙니다.',question:'무엇을 먹었는지와 언제인지 모른다는 사실을 그대로 전달합니다.'},
 {id:'history',label:'이전 반응으로 상담이 필요한 기록',ingredients:[],unknownIngredient:true,eaten:null,time:null,observation:'과거 음식 뒤 반응이 있었다는 가상 메모만 있습니다. 원인과 진단은 이 모델에서 확인되지 않습니다.',question:'담당 의료진과 다음 식품 경험의 계획을 상의합니다. 집에서 다시 먹여 원인을 확인하지 않습니다.'}
];
export const recordStages=[{id:'ingredients',label:'재료 정보'},{id:'exposure',label:'섭취 사실·시각'},{id:'observation',label:'관찰 내용'},{id:'question',label:'전달할 질문'}];
export function allergyFrame(id='mixed',step=0){const c=allergyCases.find(c=>c.id===id)||allergyCases[0];const stage=Number.isInteger(step)?Math.max(0,Math.min(3,step)):0;return {case:{...c,ingredients:[...c.ingredients]},step:stage,stages:recordStages.map((s,i)=>({...s,revealed:i<=stage})),diagnosis:null,culprit:null,rechallengePlan:null,emergencyDelay:false};}
