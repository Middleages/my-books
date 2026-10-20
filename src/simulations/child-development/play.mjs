export const playCases = [
 {id:'drop',title:'놓인 물체의 위치',parts:['손 가까이에 공이 있습니다.','공이 바닥으로 이동한 장면입니다.','보호자가 공을 다시 건넵니다. 다음 아이 반응은 기록되지 않았습니다.']},
 {id:'container',title:'그릇 안과 밖',parts:['큰 블록이 그릇 밖에 있습니다.','블록이 그릇 안으로 옮겨진 장면입니다.','그릇과 블록을 함께 봅니다. 다음 아이 반응은 기록되지 않았습니다.']},
 {id:'hide',title:'가려져도 남아 있는 물체',parts:['공이 가림판 옆에 보입니다.','가림판 뒤에 공이 놓였습니다. 화면에서 안 보인다고 없어진 것은 아닙니다.','가림판을 옮기자 같은 공이 보입니다. 아이가 찾았다고 판정하지 않습니다.']}
];
export function playFrame(id,step=0){const c=playCases.find(c=>c.id===id);if(!c||!Number.isInteger(step)||step<0||step>2)throw new RangeError('Unknown play frame');return{...c,step,note:c.parts[step],toyX:id==='container'&&step>0?205:90,toyY:id==='drop'&&step===1?160:95,covered:id==='hide'&&step===1,container:id==='container',nextKnown:false};}
