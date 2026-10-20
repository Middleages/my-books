export const preparationSource={source:'CDC When, What, and How to Introduce Solid Foods',version:'2026-04-14',country:'미국',checkedAt:'2026-10-20',targetPopulation:'영유아 보호자 일반 안내',limitations:'그림의 치수·질감 표시는 측정값이나 개별 제공 안전 판정이 아님'};
export const preparationScenes=[
{id:'raw',shapeKind:'disc',label:'단단한 당근의 통 단면',texture:'단단함을 나타내는 빗금',shape:'하나의 둥근 단면',hard:true,pieces:[{x:90,y:70,r:45}],meaning:'둥근 모양과 단단함을 따로 살펴봅니다. 실제 아이에게 제공하라는 예시가 아닙니다.'},
{id:'cut',shapeKind:'pieces',label:'모양만 잘게 바꾼 단면',texture:'단단함을 나타내는 빗금',shape:'떨어진 여러 조각',hard:true,pieces:[{x:57,y:42,r:22},{x:116,y:42,r:22},{x:57,y:98,r:22},{x:116,y:98,r:22}],meaning:'조각을 나누어도 단단함이 저절로 사라지지는 않습니다. 작으면 무조건 안전하다는 판정은 하지 않습니다.'},
{id:'mashed',shapeKind:'mash',label:'익혀 으깬 질감의 설명',texture:'으깨진 질감을 나타내는 굽은 윤곽',shape:'원래 단면 경계가 흐려진 덩어리',hard:false,pieces:[{x:55,y:80,r:24},{x:87,y:66,r:29},{x:116,y:83,r:23}],meaning:'CDC는 단단한 채소·과일을 쉽게 으깨거나 갈 수 있도록 익히는 준비를 설명합니다. 이 그림만으로 개인에게 맞는 제공 형태를 확정하지 않습니다.'}
];
export function preparationFrame(id){const s=preparationScenes.find(x=>x.id===id)||preparationScenes[0];return {...s,pieces:s.pieces.map(p=>({...p})),safe:null,source:{...preparationSource}};}
export const safetySource={source:'CDC Choking Hazards',version:'2026-03-11',country:'미국',checkedAt:'2026-10-20',targetPopulation:'영유아 식사 예방 안내',limitations:'위험 점수·응급 분류·처치 시뮬레이터 아님'};
export const safetyScenes=[
{id:'seated',label:'앉은 자세와 지켜보는 보호자',seated:true,moving:false,watched:true,meaning:'앉은 자세와 관찰 사실을 함께 표시했습니다. 음식의 준비와 아이의 개별 상황까지 확인됐다는 뜻은 아닙니다.'},
{id:'moving',label:'이동 중인 장면',seated:false,moving:true,watched:true,meaning:'보호자가 보고 있어도 이동 중 식사를 적절하게 만들지는 않습니다. CDC는 누워 있거나 기어 다니거나 걸으면서 먹지 않도록 안내합니다.'},
{id:'unknown',label:'관찰 여부를 모르는 장면',seated:true,moving:false,watched:null,meaning:'앉은 모습은 있지만 보호자가 계속 지켜봤는지는 기록에 없습니다. 모름을 관찰 완료로 채우지 않습니다.'}
];
export function safetyFrame(id){const s=safetyScenes.find(x=>x.id===id)||safetyScenes[0];return {...s,foodPreparation:null,safe:null,source:{...safetySource}};}
