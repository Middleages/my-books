// Synthetic minute intervals only. Window: day 1 noon to day 2 noon.
export const windowStart=720, windowEnd=2160;
export const scenarios=[
 {id:'partial',label:'침대 시간과 부분 관찰',bed:[[1260,1860]],sleep:[[1290,1500],[1560,1830]],awake:[[1260,1290],[1500,1530]]},
 {id:'overlap',label:'겹쳐 적은 같은 수면',bed:[[1260,1860]],sleep:[[1290,1620],[1500,1830]],awake:[]},
 {id:'conflict',label:'서로 상충하는 기록',bed:[[1260,1860]],sleep:[[1290,1740]],awake:[[1680,1800]]},
 {id:'empty',label:'관찰 기록 없음',bed:[[1260,1860]],sleep:[],awake:[]},
];
export function timeLabel(minute){if(!Number.isInteger(minute))throw new TypeError('integer minute required');return `${minute>=1440?'다음날 ':''}${String(Math.floor(minute/60)%24).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;}
export function recordFrame(id){const s=scenarios.find(s=>s.id===id);if(!s)throw new RangeError('unknown synthetic scenario');return intervalFrame(s);}
export function intervalFrame(s){
 const groups=['bed','sleep','awake'];for(const key of groups)for(const pair of s[key])if(pair.length!==2||!pair.every(Number.isInteger)||pair[0]>=pair[1]||pair[0]<windowStart||pair[1]>windowEnd)throw new RangeError('interval outside fixed day');
 const contains=(key,m)=>s[key].some(([a,b])=>m>=a&&m<b);
 const segments=[];let bedMinutes=0,sleepMinutes=0,awakeMinutes=0,unknownMinutes=0,conflictMinutes=0;
 for(let m=windowStart;m<windowEnd;m++){const bed=contains('bed',m),sleep=contains('sleep',m),awake=contains('awake',m);const state=sleep&&awake?'conflict':sleep?'sleep':awake?'awake':'unknown';if(bed)bedMinutes++;if(state==='sleep')sleepMinutes++;if(state==='awake')awakeMinutes++;if(state==='unknown')unknownMinutes++;if(state==='conflict')conflictMinutes++;const last=segments.at(-1);if(last&&last.state===state&&last.bed===bed)last.end=m+1;else segments.push({start:m,end:m+1,state,bed});}
 return {segments,bedMinutes,sleepMinutes,awakeMinutes,unknownMinutes,conflictMinutes,hasSleep:sleepMinutes>0};
}
export const states={sleep:'확인 수면',awake:'확인 각성',unknown:'미확인',conflict:'상충 · 미확정'};
export const spaceParts=[
 {id:'room',label:'같은 방',explanation:'보호자 침대와 영아의 별도 잠자리가 같은 방 경계 안에 있습니다. 방을 함께 쓰는 것과 침대를 함께 쓰는 것은 다릅니다.'},
 {id:'surface',label:'별도 수면 표면',explanation:'영아에게 적합한 단단하고 평평한 별도 수면 표면을 사용합니다. 기울어진 표면이나 보호자의 침대를 같은 것으로 바꾸어 읽지 않습니다.'},
 {id:'position',label:'등을 대고 눕히기',explanation:'영아를 잠자리에 눕힐 때는 등을 대고 바로 눕힙니다. 그림의 얼굴과 몸은 자세를 설명하는 기호이며 실제 제품이나 자세 검사기가 아닙니다.'},
 {id:'clear',label:'비워 둔 표면',explanation:'영아 수면 공간에 베개·느슨한 이불·쿠션·인형 등 부드러운 물체를 두지 않습니다. 잘 맞는 시트와 비워진 표면을 구분합니다.'},
];
