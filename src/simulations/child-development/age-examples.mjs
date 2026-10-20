// Selective educational paraphrases, not a checklist or screening instrument.
export const ageDomains=[{id:'all',title:'모든 발췌'},{id:'social',title:'관계'},{id:'language',title:'소통'},{id:'cognitive',title:'탐색'},{id:'movement',title:'움직임'}];
export const ageSources=[2,4,6,9,12].map(age=>({age,url:`https://www.cdc.gov/act-early/milestones/${age===12?'1-year':age+'-months'}.html`,checked:'2026-10-20'}));
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
 {id:'12-wave',age:12,domain:'language',text:'작별할 때 손을 흔드는 예가 실려 있습니다.'}
];
export function ageExampleFrame(age,domain='all'){const source=ageSources.find(s=>s.age===age);if(!source||!ageDomains.some(d=>d.id===domain))throw new RangeError('Use an exact source age and domain');return{source,domain,examples:ageExamples.filter(e=>e.age===age&&(domain==='all'||e.domain===domain)),position:(age-2)/10,interpolated:false};}
