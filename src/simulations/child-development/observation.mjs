// Entirely synthetic scenes. No age expectations, test items or scoring.
export const observationCases = [
 {id:'reached',title:'손을 뻗은 장면',state:'관찰함',opportunity:true,known:true,help:'보호자는 옆에 있었고 손이나 물체를 움직이지 않았음',context:'깨어 있는 놀이 장면, 물체가 보이는 곳에 있음',behavior:'아이의 손이 물체 쪽으로 이동해 닿음',toyX:160,handX:150,adult:false},
 {id:'not-seen',title:'이번에는 보지 못한 장면',state:'관찰하지 못함',opportunity:true,known:true,help:'보호자는 옆에서 지켜봄',context:'물체를 제시했으나 이 장면에서는 다른 쪽을 바라봄',behavior:'기록된 장면에서는 물체 쪽으로 손을 뻗는 행동을 보지 못함',toyX:160,handX:75,adult:false},
 {id:'no-chance',title:'기회가 없었던 장면',state:'기회 없음',opportunity:false,known:true,help:'보호자가 물체를 상자 안에 두어 꺼내지 않음',context:'물체는 닫힌 상자 안에 있음',behavior:'이 상황에서는 물체를 향해 손을 뻗는 행동을 관찰할 기회가 없었음',toyX:190,handX:75,adult:false},
 {id:'unknown',title:'정보가 빠진 장면',state:'모름',opportunity:null,known:false,help:'보호자의 도움이 있었는지 기록이 없음',context:'장면을 본 사람의 상세 기록이 없음',behavior:'손과 물체의 관계를 확인할 수 없음',toyX:null,handX:null,adult:false},
 {id:'assisted',title:'도움을 함께 적는 장면',state:'관찰함',opportunity:true,known:true,help:'보호자가 물체를 아이의 손에 놓음',context:'보호자와 함께 물체를 만지는 놀이 장면',behavior:'손에 놓인 물체를 잡고 있음',toyX:80,handX:75,adult:true},
];
export function recordFrame(id='no-chance',step=0){const c=observationCases.find(x=>x.id===id);if(!c||!Number.isInteger(step)||step<0||step>3)throw new RangeError('Record scenario');const parts=[c.context,c.opportunity===null?'기회가 있었는지 모름':c.opportunity?'관찰할 기회가 있었음':'관찰할 기회가 없었음',c.behavior,c.help];return {...c,step,parts,visible:parts.slice(0,step+1),record:`상황: ${c.context}. 관찰: ${c.behavior}. 도움: ${c.help}. 상태: ${c.state}.`};}
export const actions=[{id:'reach',title:'손을 뻗는 장면'},{id:'grasp',title:'잡고 있는 장면'},{id:'release',title:'놓는 장면'},{id:'turn',title:'방향을 바꾸는 장면'}];
export function movementFrame(action='reach',placement='near',step=0){if(!actions.some(x=>x.id===action)||!['near','far'].includes(placement)||![0,1].includes(step))throw new RangeError('Movement scenario');let handX=70,toyX=placement==='near'?140:220,bodyAngle=0,grip=false,resting=false;let note='물체와 손의 처음 위치를 봅니다.';
 if(action==='reach'){handX=step?130:70;note=step?(placement==='near'?'손이 가까운 물체에 닿는 장면입니다.':'손은 같은 위치까지 움직였지만 물체는 더 멀리 있습니다. 이 장면에서 닿지 않았다는 사실만 기록합니다.'):'같은 손의 시작 위치와 다른 물체 위치를 비교합니다.';}
 if(action==='grasp'){toyX=70;grip=step===1;note=step?'손과 물체가 같은 위치에서 함께 있는 모습을 봅니다. 앞서 누가 놓아 주었는지는 이 장면만으로 모릅니다.':'물체가 손 가까이에 있습니다. 손이 가까운 것과 잡고 있는 것은 다릅니다.';}
 if(action==='release'){toyX=step?125:70;grip=step===0;resting=step===1;note=step?'손과 물체가 떨어져 물체가 놓였습니다. 내려놓은 이유나 의도까지 단정하지 않습니다.':'손과 물체가 함께 있는 시작 장면입니다.';}
 if(action==='turn'){bodyAngle=step?35:0;note=step?'몸의 방향이 달라졌습니다. 방향 변화와 손으로 잡기는 서로 다른 관찰입니다.':'몸의 방향과 물체의 위치를 따로 봅니다.';}
 return {action,placement,step,handX,toyX,bodyAngle,grip,resting,note,placementRelevant:['reach','turn'].includes(action)};
}
