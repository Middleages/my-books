export const signalCases=[
{id:'turn',label:'고개를 돌린 장면',observation:'음식을 향하던 고개가 옆으로 돌아갔습니다.',unknown:'포만감·피곤함·불편함 중 원인은 확인되지 않았습니다.'},
{id:'reach',label:'손을 뻗은 장면',observation:'식사 중 그릇 쪽으로 손을 뻗었습니다.',unknown:'관심의 대상과 원하는 양은 확인되지 않았습니다.'},
{id:'missing',label:'관찰이 빠진 장면',observation:'그때의 소리와 움직임을 기록하지 않았습니다.',unknown:'신호가 없었다는 뜻이 아닙니다.'}];
export const responses=[{id:'pause',label:'잠시 멈추고 살피기',text:'더 넣으려는 동작을 멈추고 현재 모습을 살핍니다.'},{id:'context',label:'주변 맥락 살피기',text:'자세·주변 자극·불편해 보이는 모습을 따로 살핍니다.'}];
export function responsiveFrame(id='turn',response='pause',step=0){const c=signalCases.find(x=>x.id===id)||signalCases[0],r=responses.find(x=>x.id===response)||responses[0],n=Number.isInteger(step)?Math.max(0,Math.min(2,step)):0;return {case:{...c},response:{...r},step:n,stages:[{label:'아이에게서 본 사실',text:c.observation},{label:'보호자가 선택한 반응',text:r.text},{label:'다음에 확인할 사실',text:'다음 신호는 아직 관찰하지 않았습니다. 반응 선택만으로 섭취 결과가 생기지 않습니다.'}].map((s,i)=>({...s,revealed:i<=n})),cause:null,intake:null,score:null};}
export const toolScenes=[{id:'hand',label:'손으로 탐색',tool:'손',help:'보호자가 곁에서 관찰',paths:['그릇에 남음','손에 묻음','입으로 향함'],confirmed:null},{id:'spoon',label:'숟가락에 도움',tool:'숟가락',help:'보호자가 도구를 함께 지지',paths:['그릇에 남음','도구에 남음','흘림','입으로 향함'],confirmed:null},{id:'cup',label:'컵을 함께 잡기',tool:'컵',help:'보호자가 컵을 함께 지지',paths:['컵에 남음','흘림','입으로 향함'],confirmed:null}];
export function toolFrame(id='spoon'){const s=toolScenes.find(x=>x.id===id)||toolScenes[1];return {...s,paths:[...s.paths],intake:null,ability:null,safetyClearance:false,legend:'선은 가능한 이동 갈래입니다. 선의 굵기·개수는 양이나 성공률이 아닙니다.'};}
