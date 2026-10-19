// Fictional adult people and contracts. A relationship map, not eligibility or legal advice.
export const contractDefaults = Object.freeze({ preset: 'separate', addRider: false, restrictRider: false, employed: true });
export const contractPresets = Object.freeze([
  { id: 'separate', label: '세 사람이 역할을 나눔' },
  { id: 'same', label: '한 사람이 세 역할' },
  { id: 'employer', label: '회사가 계약한 가상 단체보험' },
]);
const roles = [
  { id: 'contractor', label: '계약자', detail: '계약을 맺고 보험료를 낼 의무', symbol: '▣' },
  { id: 'insured', label: '피보험자', detail: '이 인보험에서 사고 판단의 대상', symbol: '◎' },
  { id: 'beneficiary', label: '보험수익자', detail: '약정 조건에 따라 보험금을 받을 권리', symbol: '◇' },
];
export function projectContractMap(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Contract options must be an object.');
  const params = { ...contractDefaults, ...options };
  if (!contractPresets.some(preset => preset.id === params.preset)) throw new RangeError('Unknown fictional preset.');
  for (const key of ['addRider', 'restrictRider', 'employed']) if (typeof params[key] !== 'boolean') throw new TypeError(`${key} must be boolean.`);
  const names = params.preset === 'same' ? ['가상 지우', '가상 지우', '가상 지우'] : params.preset === 'employer' ? ['가상 나무회사', '가상 지우', '가상 지우'] : ['가상 민서', '가상 지우', '가상 하람'];
  const people = [];
  roles.forEach((role, index) => {
    let person = people.find(item => item.name === names[index]);
    if (!person) { person = { id: `person-${people.length + 1}`, name: names[index], kind: params.preset === 'employer' && index === 0 ? 'company' : 'adult', roles: [] }; people.push(person); }
    person.roles.push({ ...role });
  });
  const owner = role => people.find(person => person.roles.some(item => item.id === role));
  const groupConnection = params.preset !== 'employer' || params.employed;
  const edges = [
    { id: 'premium', from: owner('contractor').id, to: 'insurer', personId: owner('contractor').id, direction: 'to-insurer', label: '보험료 납입', detail: '계약자의 납입 의무', kind: 'money', connected: true },
    { id: 'insured', from: owner('insured').id, to: 'insurer', personId: owner('insured').id, direction: 'to-insurer', label: '사고 판단 대상', detail: groupConnection ? '돈 이동이 아닌 보장 관계' : '퇴직 뒤 자격·보장 지속 미확인', kind: 'reference', connected: groupConnection },
    { id: 'payout', from: 'insurer', to: owner('beneficiary').id, personId: owner('beneficiary').id, direction: 'from-insurer', label: '조건 충족 시 보험금', detail: groupConnection ? '실제 입금이 아닌 지급 약속' : '계속 지급된다고 가정하지 않음', kind: 'money', connected: groupConnection },
  ];
  const events = [
    { id: 'A', label: '일상 중 사건 A', included: true, region: 'base', reason: '가상 기본계약에 포함' },
    { id: 'B', label: '활동 중 사건 B', included: !params.restrictRider, region: params.restrictRider ? 'outside' : 'base', reason: params.restrictRider ? '제한 특약으로 범위 밖' : '가상 기본계약에 포함' },
    { id: 'C', label: '추가 사건 C', included: params.addRider, region: params.addRider ? 'rider' : 'outside', reason: params.addRider ? '추가 특약으로 범위 안' : '추가 특약을 붙이지 않음' },
    { id: 'D', label: '제외 사건 D', included: false, region: 'outside', reason: '이 가상 계약의 제외 사건' },
  ];
  const sources = [
    { id: 'public', label: '공적 제도에서', example: '국민건강보험', connection: '법률상 자격·급여 확인', status: '확인할 곳', detail: '직장가입자도 국민건강보험의 가입 구분입니다.' },
    { id: 'work', label: '직장에서', example: '고용주의 민간 단체보험', connection: params.employed ? '회사 자료·단체 약관 확인' : '자격 상실·계속 여부 확인', status: params.employed ? '확인할 곳' : '지속 미확인', detail: '국민건강보험 직장가입자와 별개의 민간 계약입니다.' },
    { id: 'personal', label: '개인 계약에서', example: '개인이 맺은 민간보험', connection: '본인 증권·약관 확인', status: '확인할 곳', detail: '다른 출처와 함께 존재할 수 있습니다.' },
  ];
  const frames = [
    ['roles', '역할을 먼저 구분', '같은 사람의 역할은 한 경계 안에 모입니다. 역할 수와 사람 수는 다릅니다.', null],
    ['premium', '보험료가 향하는 곳', '납입 화살표는 계약자에서 보험자로 향합니다. 보험료를 낸 사람이 반드시 보험수익자인 것은 아닙니다.', 'premium'],
    ['covered-event', '누구에게 생긴 사건인가', '점선은 돈이 아니라 사고 판단의 대상 관계입니다. 지급 여부에는 사건과 계약 조건을 더 확인해야 합니다.', 'insured'],
    ['payout', '조건부 지급이 향하는 곳', groupConnection ? '지급 화살표는 보험자에서 지정된 보험수익자로 향합니다. 조건 충족을 전제로 한 약속이며 입금 사실은 아닙니다.' : '이 가상 단체보험은 퇴직 뒤 보장 지속을 확인하지 못했습니다. 끊긴 선을 확정된 지급 약속으로 읽지 않습니다.', 'payout'],
  ].map(([phase, label, detail, focus], index) => ({ index, phase, label, detail, people, edges: edges.map(edge => ({ ...edge, active: edge.id === focus })), events, sources, groupConnection }));
  return { params, people, edges, events, sources, frames, samePayerAndBeneficiary: owner('contractor').id === owner('beneficiary').id, includedCount: events.filter(event => event.included).length, verdict: owner('contractor').id === owner('beneficiary').id ? '이 사례에서는 계약자와 보험수익자가 같습니다. 같은 사람에게 두 역할이 붙은 결과입니다.' : '이 사례에서는 계약자와 보험수익자가 다릅니다. 납입 화살표의 출발점과 지급 화살표의 도착점을 비교하세요.' };
}
