import {everydayScenes,sceneDomains,sceneSources} from './age-scenes.mjs';
// Selective educational paraphrases, not a checklist or screening instrument.
export const ageDomains=sceneDomains.map(d=>({...d}));
export const ageGroups={first:[2,4,6,9,12],second:[12,15,18,24],third:[24,30,36]};
export const allAgeSources=sceneSources;
export const ageSources=allAgeSources.filter(s=>ageGroups.first.includes(s.age));
export function sourcesForGroup(group){if(!ageGroups[group])throw new RangeError('Unknown source group');return allAgeSources.filter(s=>ageGroups[group].includes(s.age));}
export const ageExamples=everydayScenes.map(e=>({...e,domain:e.tag,text:e.scene}));
export function ageExampleFrame(age,domain='all'){const source=allAgeSources.find(s=>s.age===age);if(!source||!ageDomains.some(d=>d.id===domain))throw new RangeError('Use an exact source age and domain');return{source,domain,examples:ageExamples.filter(e=>e.age===age&&(domain==='all'||e.domain===domain)),position:(age-2)/10,interpolated:false};}

export function sourcePosition(age,group){const sources=sourcesForGroup(group);if(!sources.some(s=>s.age===age))throw new RangeError('Age outside group');return (age-sources[0].age)/(sources.at(-1).age-sources[0].age);}
