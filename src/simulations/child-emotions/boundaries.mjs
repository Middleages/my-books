export function guidanceFrame(option='environment'){
 if(!['environment','words','alternative'].includes(option))throw new RangeError('Unknown guidance');
 return {option,objectPlace:option==='environment'?'shelf':'floor',alternative:option==='alternative',words:option==='words',fact:'아이가 단단한 장난감을 사람 쪽으로 움직이려 해요',boundary:'사람을 다치게 하는 행동은 막기',role:{environment:'물건의 접근 경로를 바꿈',words:'이해 가능한 짧은 안내를 더함',alternative:'다른 안전한 활동의 자리를 마련함'}[option],unknown:'아이의 다음 행동과 마음: 미확인'};
}
const questions=[{id:'space',text:'주변 사람과 위험 물건은 어디에 있나요?',zone:'now'},{id:'care',text:'필요한 돌봄과 보호자 도움은 있나요?',zone:'now'},{id:'talk',text:'나중에 어떤 마음이었는지 함께 들어볼까요?',zone:'later'}];
export function intenseFrame(selected='space'){
 const question=questions.find(q=>q.id===selected);if(!question)throw new RangeError('Unknown question');
 return {question:{...question},questions:questions.map(q=>({...q})),fact:'가상 유아가 바닥에 앉아 큰 소리를 내고 있어요',unknown:'원인·통증 여부·진정 시간: 이 장면만으로 알 수 없음'};
}
