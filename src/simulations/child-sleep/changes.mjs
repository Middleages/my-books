// Synthetic observation windows, not individual sleep or care recommendations.
export const changedDays=[
{id:'ordinary',label:'평소 일정의 합성 날',event:'특별한 일정 메모 없음',eventHour:null,sleep:[[21,24],[25,28]],unknown:[[24,25]],note:'메모가 없다고 변화가 없었다고 확정하지 않습니다.'},
{id:'illness',label:'아픈 모습이 기록된 합성 날',event:'20시: 평소와 다른 불편을 관찰',eventHour:20,sleep:[[22,24],[26,28]],unknown:[[24,26]],note:'건강 우려와 필요한 돌봄을 먼저 살핍니다. 수면 습관 문제로 판정하지 않습니다.'},
{id:'travel',label:'이동 일정의 합성 날',event:'20시: 낯선 숙소에 도착',eventHour:20,sleep:[[22,24],[25,28]],unknown:[[24,25]],note:'이동과 수면 기록이 함께 있어도 원인과 효과를 확정할 수 없습니다.'}
];
export function changedDayFrame(id='illness',showContext=true){const day=changedDays.find(d=>d.id===id)||changedDays[1];return {day:{...day,sleep:day.sleep.map(x=>[...x]),unknown:day.unknown.map(x=>[...x])},showContext,confirmedHours:day.sleep.reduce((n,[a,b])=>n+b-a,0),cause:null,regressionWeek:null,diagnosis:null};}
export const restPlans=[
{id:'single',label:'현재 교대 도움 미확보',people:['돌보는 사람'],slots:[['care','care','care','care','care','care']],note:'이 창에 분리된 휴식 기회가 아직 배치되지 않았습니다. 가족의 실패 점수가 아니라 추가 지원을 논의할 정보입니다.'},
{id:'relay',label:'교대 역할을 나눈 합성 계획',people:['돌보는 사람 A','도움을 맡을 사람 B'],slots:[['care','care','care','rest','rest','rest'],['rest','rest','rest','care','care','care']],note:'담당자가 정해져도 실제 잠들었는지와 휴식의 질은 이 계획만으로 알 수 없습니다.'},
{id:'gap',label:'인수인계가 비어 있는 합성 초안',people:['돌보는 사람 A','도움을 맡을 사람 B'],slots:[['care','care','rest','rest','rest','rest'],['rest','rest','rest','care','care','care']],note:'22–23시에 맡을 사람이 기록되어 있지 않습니다. 이 초안을 실행 권고로 사용하지 말고 담당과 도움 가능 여부를 확인합니다.'}
];
export const slotLabels=['20–21시','21–22시','22–23시','23–24시','다음날 0–1시','다음날 1–2시'];
export function restFrame(id='single'){const plan=restPlans.find(p=>p.id===id)||restPlans[0];const coverage=slotLabels.map((_,i)=>plan.slots.filter(row=>row[i]==='care').length);return {plan:{...plan,people:[...plan.people],slots:plan.slots.map(r=>[...r])},coverage,gaps:coverage.map((n,i)=>n===0?i:-1).filter(i=>i>=0),restHours:plan.slots.map(r=>r.filter(s=>s==='rest').length),longestRestHours:plan.slots.map(r=>{let run=0,max=0;for(const x of r){run=x==='rest'?run+1:0;max=Math.max(max,run);}return max;}),actualSleep:null,childSleep:null,familyScore:null};}
