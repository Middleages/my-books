export function fitFrame(condition='busy'){
 if(!['busy','quiet','space'].includes(condition))throw new RangeError('Unknown environment');
 return {condition,fact:'새 놀이방 입구에서 아이가 보호자 옆에 서 있어요',sound:condition==='quiet'?'소리를 줄인 조건':'여러 소리가 함께 나는 조건',approach:condition==='space'?'낯선 사람이 거리를 두고 기다림':'낯선 사람이 가까이 다가오는 조건',unknown:'다음 반응·기질 유형: 이 장면으로 판정하지 않음',soundLines:condition==='quiet'?1:3,near:condition!=='space'};
}
export function reunionFrame(step=0){
 if(!Number.isInteger(step)||step<0||step>2)throw new RangeError('Unknown care stage');
 return {step,label:['함께 예고','돌봄 인계','다시 만남'][step],carer:step===1?'익숙한 돌봄자':'보호자',parentPresent:step!==1,information:['누가 돌볼지와 다시 만날 일과를 설명하는 장면','돌봄자가 인계를 받아 곁에서 돌보는 장면','보호자가 돌아와 아이의 반응을 살피는 장면'][step],unknown:'울음의 길이·적응 완료일·애착 상태: 미확인'};
}
