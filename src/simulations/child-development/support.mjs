export const supportCases=[
{id:'concern',title:'관찰하며 걱정이 생김',record:'언제·어떤 상황에서 무엇을 보았는지와 걱정을 함께 정리합니다.',question:'이 관찰에서 무엇을 더 살펴봐야 하나요?',next:'담당자와 필요한 선별·평가 및 다음 확인 계획을 상의합니다.'},
{id:'screening',title:'선별 결과의 설명이 필요함',record:'받은 결과와 안내를 준비합니다. 점수를 재계산하거나 진단명으로 바꾸지 않습니다.',question:'이 결과가 뜻하는 범위와 다음 확인은 무엇인가요?',next:'결과에 대한 설명과 필요시 추가 평가·연결 안내를 확인합니다.'},
{id:'change',title:'이전에 하던 능력의 변화가 걱정됨',record:'이전에 보았던 행동과 달라진 점을 정리하되, 기록을 채우느라 상담을 미루지 않습니다.',question:'이전과 달라진 점이 걱정됩니다. 어떤 확인이 필요한가요?',next:'다음 정기검진까지 기다리지 말고 진료 담당자에게 우려를 공유합니다.'}
];
export const supportTerms=[{id:'observe',title:'일상 관찰',meaning:'생활 장면과 변화를 살피고 우려를 공유하는 일',not:'이 관찰만으로 진단하지 않습니다.'},{id:'screen',title:'표준 선별',meaning:'정해진 도구와 지침으로 추가 확인 필요성을 살피는 과정',not:'선별 결과는 곧 진단명이 아닙니다.'},{id:'evaluate',title:'전문 평가·진단',meaning:'전문가가 병력·관찰·필요한 평가를 종합하는 과정',not:'이 책의 버튼이나 점수가 대신하지 않습니다.'}];
export function supportFrame(id,step=0){const c=supportCases.find(c=>c.id===id);if(!c||!Number.isInteger(step)||step<0||step>2)throw new RangeError('Unknown support scene');return{...c,step,note:[c.record,c.question,c.next][step],documentX:[50,145,240][step],lineActive:step>0,diagnosis:null};}
