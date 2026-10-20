const integer=(n,k,min,max)=>{if(!Number.isInteger(n)||n<min||n>max)throw new RangeError(k)};
export const placeDefaults={days:20,requireAccess:false,requireSpace:false,moveBy:30};
export function placeComparison(input={}) {
  const p={...placeDefaults,...input};integer(p.days,'days',0,31);integer(p.moveBy,'moveBy',0,60);
  if(typeof p.requireAccess!=='boolean'||typeof p.requireSpace!=='boolean')throw new RangeError('requirements');
  const places=[{id:'A',rent:700000,roundTrip:40,access:true,space:false,available:30},{id:'B',rent:500000,roundTrip:100,access:null,space:true,available:60}].map(a=>{
    const reasons=[];if(p.requireAccess&&a.access!==true)reasons.push(a.access===null?'접근조건 미확인':'접근조건 불충족');
    if(p.requireSpace&&!a.space)reasons.push('필요 공간 없음');if(a.available>p.moveBy)reasons.push('필요 날짜 뒤 입주 가능 가정');
    return {...a,monthlyMinutes:a.roundTrip*p.days,monthlyHours:a.roundTrip*p.days/60,reasons,eligible:reasons.length===0};
  });
  return {...p,places,rentSaving:places[0].rent-places[1].rent,extraHours:places[1].monthlyHours-places[0].monthlyHours,candidateCount:places.filter(a=>a.eligible).length};
}
// This is our two-type fixed-weight price-ratio illustration, NOT the REB official index formula.
export function marketMix(input={}) {
  const p={mix:false,priceRise:false,lowCount:null,highCount:null,...input};
  if(typeof p.mix!=='boolean'||typeof p.priceRise!=='boolean')throw new RangeError('scenario');
  const lowCount=p.lowCount??(p.mix?1:2),highCount=p.highCount??(p.mix?2:1);
  integer(lowCount,'lowCount',0,10);integer(highCount,'highCount',0,10);
  const lowBase=200e6,highBase=400e6,rate=p.priceRise?1.1:1,lowPrice=lowBase*rate,highPrice=highBase*rate;
  const count=lowCount+highCount,mean=count?(lowCount*lowPrice+highCount*highPrice)/count:null;
  return {...p,lowCount,highCount,lowPrice,highPrice,count,mean,baselineMean:(2*lowBase+highBase)/3,fixedComparison:100*(lowPrice/lowBase+highPrice/highBase)/2,trades:[...Array(lowCount).fill('low'),...Array(highCount).fill('high')]};
}
// One fictional 100-home cohort, mutually exclusive stages; durations are not Korean statistics.
export function supplyFrames(input={}) {
  const p={homes:100,startMonth:2,finishMonth:8,...input};integer(p.homes,'homes',0,1000);integer(p.startMonth,'startMonth',0,12);integer(p.finishMonth,'finishMonth',p.startMonth,24);
  return Array.from({length:p.finishMonth+1},(_,month)=>{
    const stage=month<p.startMonth?'permission':month<p.finishMonth?'construction':'completion';
    return {...p,month,stage,permission:stage==='permission'?p.homes:0,construction:stage==='construction'?p.homes:0,completion:stage==='completion'?p.homes:0};
  });
}
