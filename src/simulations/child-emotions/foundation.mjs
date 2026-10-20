/** Synthetic observation frames, not a child-response or clinical model. */
const emotions = ['화가 난 듯해요', '실망한 듯해요', '아직 모르겠어요'];
const actions = [
  { id: 'throw', label: '블록을 다른 사람 쪽으로 던지려 함', boundary: '다치게 하는 행동은 막고, 던질 물건을 치웁니다.', safePath: false },
  { id: 'put', label: '블록을 바닥에 내려놓음', boundary: '안전한 행동의 대안을 곁에서 안내합니다.', safePath: true },
];
export function boundaryFrame(emotion = 0, action = 'throw') {
  if (!Number.isInteger(emotion) || !emotions[emotion]) throw new RangeError('Unknown interpretation');
  const observed = actions.find(x => x.id === action);
  if (!observed) throw new RangeError('Unknown action');
  return { emotion, interpretation: emotions[emotion], observed: observed.label, action, safePath: observed.safePath, boundary: observed.boundary, age: '가상 30개월 장면', unknown: '아이 마음의 정확한 이유는 아직 모릅니다.', fact: '블록이 무너진 뒤 아이가 큰 소리를 냈습니다.' };
}
const frames = [
  { signal: '아기가 고개를 돌리고 울었습니다.', attention: '관찰', response: '먼저 안전과 몸의 불편함, 주변 환경을 살핍니다.', connection: 'notice', next: '울음만으로 배고픔·피곤함·통증을 구분할 수 없습니다.' },
  { signal: '같은 합성 장면을 계속 보고 있습니다.', attention: '환경과 필요', response: '소리를 줄이고, 가까이에서 차분하게 반응할 준비를 합니다.', connection: 'prepare', next: '환경 조정은 원인 확진이나 진정의 보장이 아닙니다.' },
  { signal: '이 예제에는 이후 울음의 변화가 기록되지 않았습니다.', attention: '반응과 재관찰', response: '아이의 신호에 맞추어 반응하고 다음 관찰을 이어갑니다.', connection: 'respond', next: '결과는 미확인입니다. 필요한 도움을 미루지 않습니다.' },
];
export function careFrame(step = 0) {
  if (!Number.isInteger(step) || step < 0 || step >= frames.length) throw new RangeError('Unknown step');
  return { ...frames[step], step, age: '가상 5개월 장면', outcome: '진정 여부: 미확인', steps: frames.length };
}
export function moveStep(step, delta) {
  careFrame(step);
  if (![1,-1].includes(delta)) throw new RangeError('Use a single step');
  return Math.max(0, Math.min(frames.length - 1, step + delta));
}
