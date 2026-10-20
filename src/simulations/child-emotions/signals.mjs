const hypotheses=['피곤한 듯해요','속상한 듯해요','아직 모르겠어요'];
export function signalFrame(hypothesis=0,extra=false){
 if(!Number.isInteger(hypothesis)||hypothesis<0||hypothesis>2||typeof extra!=='boolean')throw new RangeError('Invalid synthetic observation');
 return {hypothesis,extra,interpretation:hypotheses[hypothesis],facts:['놀이 중 손을 멈추고 물건을 내려놓았어요',...(extra?['다른 놀이를 가리켰어요']:[])],unknown:'마음의 원인: 미확인',age:'가상 30개월 장면'};
}
export function languageFrame(ready=false){
 if(typeof ready!=='boolean')throw new RangeError('Invalid synthetic participation');
 return {ready,zone:ready?'now':'later',observation:ready?'함께 짧은 대화를 주고받는 장면':'지금 대화에 참여하기 어려운 장면',safety:'안전 확인과 곁의 돌봄은 계속',conversation:'잠정적인 감정 말과 아이의 표현 듣기',unknown:'진정까지 걸리는 시간·대화 결과: 미확인'};
}
