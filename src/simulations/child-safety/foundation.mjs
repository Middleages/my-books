/** Educational relations in a synthetic room, never a household risk assessment. */
export function layerFrame(position='floor') {
 if(!['floor','storage'].includes(position)) throw new RangeError('Unknown position');
 return {position, object: '작은 물건', directPath:position==='floor', location:position==='floor'?'바닥의 물건':'별도 보관 공간의 물건', path:position==='floor'?'그림에 직접 접근선이 있습니다.':'그림에서 바닥의 직접 접근선을 제외했습니다.', unknown:'실제 접근 가능성·보관장치 적합성: 미확인', remaining:'성인의 관찰과 다른 위험 점검은 계속 필요합니다.'};
}
export function movementFrame(movement='floor', furniture='near') {
 if(!['floor','climb'].includes(movement)||!['near','away'].includes(furniture)) throw new RangeError('Unknown condition');
 const connected=movement==='climb'&&furniture==='near';
 return {movement,furniture,connected, movementLabel:movement==='floor'?'바닥 이동을 관찰한 장면':'가구를 오르는 움직임을 관찰한 장면', furnitureLabel:furniture==='near'?'가구가 창가와 연결된 배치':'가구를 창가에서 옮긴 배치', path:connected?'이 가정에서는 바닥 → 가구 → 창가 경로를 함께 살핍니다.':'이 선택에서는 해당 연결을 표시하지 않습니다. 실제 접근 불가를 뜻하지 않습니다.', unknown:'다른 접근 경로·실제 아이의 다음 움직임: 미확인'};
}
