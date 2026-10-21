/** Original educational scenarios: connections are responsibilities, not affection or time ratios. */
export const siblingSource = Object.freeze({ id:'F3', publisher:'AAP HealthyChildren', title:'Preparing Your Older Child for a New Baby: How to Help Siblings Adjust', url:'https://www.healthychildren.org/English/ages-stages/prenatal/Pages/Preparing-Your-Family-for-a-New-Baby.aspx', checkedAt:'2026-10-21', updatedAt:'2026-02-10', country:'미국', targetAge:'1–2세 및 2–4세 중 2–3세만 사용', reviewedScope:'생활 변화 설명과 기존 아이를 위한 관심·시간', limitations:'임상 예측·질투 해소·적응 기간·영아 돌봄 방법 제외. 독립 전문가 감수 미실행.', chapterIds:['before-new-sibling','living-with-sibling'] });
export const siblingAges = ['1–2세', '2–3세'];
const limit = '합성 장면입니다. 선은 성인의 역할 연결이며 사랑의 양·시간 비율·아이의 반응을 뜻하지 않습니다. 실제 개인정보를 입력하거나 저장하지 않습니다.';
function ageValue(age) { return siblingAges.includes(age) ? age : siblingAges[0]; }
function node(id,label,x,y,kind,detail) { return {id,label,x,y,kind,detail}; }
function edge(from,to,label,status='정해 둔 역할') { return {from,to,label,status}; }
function scene(id,title,baby,mode) {
 const second = mode === 'shared';
 const nodes = [node('a','성인 A',25,19,'adult','곁에서 돌보는 성인'),node('older','기존 아이',25,78,'child','자기 놀이 자리')];
 if (baby) nodes.push(node('baby','새 아기',75,78,'baby','성인이 돌보는 자리'));
 else nodes.push(node('future','새 아기 자리 · 준비 전',75,78,'future','도착 뒤를 위해 준비할 자리이며 아직 아기가 있는 장면은 아닙니다.'));
 if (second) nodes.push(node('b','성인 B',75,19,'adult','참여를 수락한 지원 성인'));
 const edges = baby ? [edge('a','baby','아기 돌봄'),edge(second?'b':'a','older',second?'아이와 개별 시간':'아이의 필요도 확인',mode==='pending'?'지원 확인 전':'정해 둔 역할')] : [edge('a','older','함께 읽기')];
 return {id,title,nodes,edges,space: baby ? (second?'서로 다른 자리에서 성인이 각 아이와 연결됩니다.':'같은 생활 공간의 두 필요가 성인 A에게 모입니다.'):'익숙한 놀이 자리와 성인 A의 연결입니다.',time: baby ? (second?'아기 돌봄 중에도 성인 B와 기존 아이의 시간을 따로 마련한 예입니다.':'아기 돌봄과 기존 아이의 시간을 어떻게 이어 갈지 성인이 조정해야 합니다.'):'함께 읽는 익숙한 시간을 기억해 둡니다.'};
}
export function beforeSiblingFrame(age='1–2세',option='pending') {
 age=ageValue(age); option=option==='shared'?'shared':'pending';
 return {scenarioId:'before-new-sibling',ageBand:age,sourceIds:['F3'],step:option==='shared'?1:0,selectedOption:option,
 observedFacts:['새 아기가 오면 성인이 맡을 돌봄이 늘어나는 합성 계획입니다.','기존 아이의 놀이 자리와 함께하는 시간도 계획에 남깁니다.'],hypotheses:['아이가 어떤 반응을 보일지는 이 계획만으로 알 수 없습니다.'],unknowns:option==='shared'?['지원이 바뀌는 날의 대안은 별도로 확인합니다.']:['지원 성인의 참여 가능 여부와 인수 수락을 확인하지 않았습니다.'],
 explanation:age==='1–2세'?'짧은 말과 아기 그림책으로 새 식구를 소개합니다. 설명을 알아들었다고 가정하지 않습니다.':'아기가 울거나 성인의 시간이 필요할 수 있음을 짧게 설명합니다. 곧 함께 놀 수 있다고 약속하지 않습니다.',
 adultPreparation:option==='shared'?'지원 성인이 기존 아이와 함께할 역할을 수락한 장면입니다. 가족 호칭이나 동거 여부가 아니라 실제 수락을 표시합니다.':'아이에게 설명하는 일과 성인끼리 돌봄을 준비하는 일은 다릅니다. 아이의 이해로 지원의 빈칸을 메우지 않습니다.',
 scenes:[scene('before','도착 전 · 익숙한 연결',false,'pending'),scene('after','도착 뒤 · 준비할 연결',true,option)],limit};
}
export function livingSiblingFrame(age='1–2세',option='together') {
 age=ageValue(age); option=option==='shared'?'shared':'together';
 return {scenarioId:'living-with-sibling',ageBand:age,sourceIds:['F3'],step:option==='shared'?1:0,selectedOption:option,
 observedFacts:['새 아기에게 성인의 돌봄이 필요한 순간입니다.','기존 아이도 성인과 함께하고 싶다는 필요가 있는 합성 장면입니다.'],hypotheses:['말이나 행동 하나로 질투·문제 행동의 원인을 단정하지 않습니다.'],unknowns:['각 아이의 실제 반응·몸 상태·지원 가능 여부는 이 그림에 없습니다.'],
 explanation:age==='1–2세'?'말로 설명하는 것만으로 충분하다고 보지 않고, 성인이 기존 아이와 함께하는 연결도 남깁니다.':'기존 아이와 읽거나 노는 시간을 따로 생각하되, 반응이 바로 달라질 것이라고 약속하지 않습니다.',
 needs:[{id:'older',label:'기존 아이',need:'함께하고 싶은 필요',owner:option==='shared'?'성인 B':'성인 A',action:option==='shared'?'개별 시간에 함께 읽기':'필요를 알아차리고 함께할 기회를 조정하기'},{id:'baby',label:'새 아기',need:'성인의 직접 돌봄',owner:'성인 A',action:'아기의 돌봄을 성인이 맡기'}],
 adultPreparation:option==='shared'?'수락한 지원 성인과 역할을 나눈 예입니다. 큰아이는 돌봄 담당자가 되지 않습니다.':'지원 성인이 없는 장면입니다. 두 필요가 한 성인에게 모인다는 사실을 보이며, 동시에 모든 일을 해결했다고 표시하지 않습니다.',
 scenes:[scene('living','두 아이 · 성인의 책임',true,option)],limit};
}
