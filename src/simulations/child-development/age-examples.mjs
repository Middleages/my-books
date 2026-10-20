// Selective educational paraphrases, not a checklist or screening instrument.
export const ageDomains=[{id:'all',title:'모든 발췌'},{id:'social',title:'관계'},{id:'language',title:'소통'},{id:'cognitive',title:'탐색'},{id:'movement',title:'움직임'}];
export const ageGroups={first:[2,4,6,9,12],second:[12,15,18,24],third:[24,30,36]};
export const allAgeSources=[2,4,6,9,12,15,18,24,30,36].map(age=>({age,url:`https://www.cdc.gov/act-early/milestones/${({12:'1-year',24:'2-years',36:'3-years'})[age]||age+'-months'}.html`,checked:'2026-10-20'}));
export const ageSources=allAgeSources.filter(s=>ageGroups.first.includes(s.age));
export function sourcesForGroup(group){if(!ageGroups[group])throw new RangeError('Unknown source group');return allAgeSources.filter(s=>ageGroups[group].includes(s.age));}
export const ageExamples=[
 {id:'2-sound',age:2,domain:'language',text:'우는 소리 이외의 소리를 내는 예가 실려 있습니다.'},
 {id:'2-face',age:2,domain:'social',text:'보호자의 얼굴을 바라보는 예가 실려 있습니다.'},
 {id:'4-hand',age:4,domain:'cognitive',text:'자기 손에 관심을 두고 바라보는 예가 실려 있습니다.'},
 {id:'4-mouth',age:4,domain:'movement',text:'손을 입 쪽으로 가져가는 예가 실려 있습니다.'},
 {id:'6-turn',age:6,domain:'language',text:'보호자와 번갈아 소리를 내는 예가 실려 있습니다.'},
 {id:'6-reach',age:6,domain:'cognitive',text:'원하는 장난감을 잡으려고 손을 뻗는 예가 실려 있습니다.'},
 {id:'9-hidden',age:9,domain:'cognitive',text:'떨어져 시야에서 사라진 물체를 찾아보는 예가 실려 있습니다.'},
 {id:'9-transfer',age:9,domain:'movement',text:'물체를 한 손에서 다른 손으로 옮기는 예가 실려 있습니다.'},
 {id:'12-container',age:12,domain:'cognitive',text:'물체를 용기 안에 넣는 예가 실려 있습니다.'},
 {id:'12-wave',age:12,domain:'language',text:'작별할 때 손을 흔드는 예가 실려 있습니다.'},
 {id:'15-show',age:15,domain:'social',text:'좋아하는 물건을 보호자에게 보여 주는 예가 실려 있습니다.'},
 {id:'15-use',age:15,domain:'cognitive',text:'전화기·컵·책 같은 물건을 용도에 맞게 사용하려는 예가 실려 있습니다.'},
 {id:'18-share',age:18,domain:'social',text:'흥미로운 것을 보호자에게 보여 주려고 가리키는 예가 실려 있습니다.'},
 {id:'18-car',age:18,domain:'cognitive',text:'장난감 차를 미는 것처럼 간단한 방식으로 장난감을 사용하는 예가 실려 있습니다.'},
 {id:'24-hands',age:24,domain:'cognitive',text:'한 손으로 용기를 잡고 다른 손으로 뚜껑을 여는 것처럼 두 손의 역할이 연결되는 예가 실려 있습니다.'},
 {id:'24-book',age:24,domain:'language',text:'책 속의 대상을 물었을 때 해당 그림을 가리키는 예가 실려 있습니다.'},
 {id:'30-pretend',age:30,domain:'cognitive',text:'블록을 음식처럼 인형에게 주는 등 물건에 다른 뜻을 부여하는 놀이 예가 실려 있습니다.'},
 {id:'30-near',age:30,domain:'social',text:'다른 아이 옆에서 놀고 때로 함께 노는 예가 실려 있습니다.'},
 {id:'36-join',age:36,domain:'social',text:'다른 아이를 알아보고 놀이에 참여하는 예가 실려 있습니다.'},
 {id:'36-question',age:36,domain:'language',text:'누구·무엇·어디·왜에 관한 질문을 하는 예가 실려 있습니다.'}
];
export function ageExampleFrame(age,domain='all'){const source=allAgeSources.find(s=>s.age===age);if(!source||!ageDomains.some(d=>d.id===domain))throw new RangeError('Use an exact source age and domain');return{source,domain,examples:ageExamples.filter(e=>e.age===age&&(domain==='all'||e.domain===domain)),position:(age-2)/10,interpolated:false};}

export function sourcePosition(age,group){const sources=sourcesForGroup(group);if(!sources.some(s=>s.age===age))throw new RangeError('Age outside group');return (age-sources[0].age)/(sources.at(-1).age-sources[0].age);}
