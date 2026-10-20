/** Synthetic prevention scenes: no injury probability, treatment or certification. */
export function fallsFrame(area='change', changed=false) {
 if(!['change','window','door'].includes(area)||typeof changed!=='boolean') throw new RangeError('Unknown prevention scene');
 const scenes={change:{label:'기저귀 교환 공간',before:'높은 교환대와 바닥 사이의 높이 차이를 살핍니다.',after:'바닥의 교환 공간으로 옮겨 높은 교환대의 연결을 제외합니다.',remaining:'바닥의 작은 물건·주변 접근과 성인 관찰은 별도 확인합니다.'},window:{label:'창가와 가구',before:'낮은 가구가 창가로 이어지는 중간 발판이 됩니다.',after:'가구를 창가에서 옮겨 이 발판 연결을 제외합니다.',remaining:'창문 잠금·보호장치와 다른 발판의 실제 조건은 미확인입니다.'},door:{label:'문 주변 놀이 공간',before:'놀이 공간과 문이 움직이는 공간이 겹쳐 있습니다.',after:'놀이 공간을 옮겨 그림의 겹침을 분리합니다.',remaining:'문 양쪽·경첩 틈·다른 사람의 출입은 계속 확인해야 합니다.'}};
 const s=scenes[area];return {scenarioId:`falls-${area}`,ageBand:'0–36개월 보호자',sourceIds:area==='door'?['S4','B1']:['S4'],observedFacts:[changed?s.after:s.before],hypotheses:[],unknowns:[s.remaining,'실제 공간의 안전 여부와 부상 정도는 판단하지 않습니다.'],step:changed?1:0,selectedOption:changed?'changed':'before',area,changed,...s,explanation:changed?s.after:s.before};
}
export const objectKinds=['part','battery','magnet','bag'];
export function objectFrame(kind='battery',location='floor',checked=false){
 if(!objectKinds.includes(kind)||!['floor','storage'].includes(location)||typeof checked!=='boolean')throw new RangeError('Unknown object scene');
 const names={part:'분리된 작은 부품',battery:'단추형 전지',magnet:'분리된 자석',bag:'비닐 포장재'};
 const checks={part:'본체의 파손·남은 부품·제품 대상 연령',battery:'전지함 덮개·고정 상태·새 전지와 폐전지 위치',magnet:'자석 부품의 이탈·제품 손상·보관 위치',bag:'포장을 버리기 전후의 위치·아이의 접근'};
 return {scenarioId:`objects-${kind}`,ageBand:'0–36개월 보호자',sourceIds:kind==='magnet'?['S4','B3']:kind==='battery'?['S4','B2']:['S4'],observedFacts:[location==='floor'?'그림에서 놀이 공간에 놓여 있습니다.':'그림에서 별도 보관 공간으로 옮겼습니다.'],hypotheses:[],unknowns:['실제 제품 적합성·남은 물건·다른 접근 경로는 미확인입니다.'],step:checked?1:0,selectedOption:location,kind,location,checked,name:names[kind],check:checks[kind],directPath:location==='floor',status:checked?'가상 예시에서 확인할 항목을 읽었습니다. 실제 점검 완료가 아닙니다.':'제품과 보관 조건은 아직 확인하지 않았습니다.'};
}
