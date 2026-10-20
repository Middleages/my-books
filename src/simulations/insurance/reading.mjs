// All contracts, facts, dates and amounts in this chapter are authored fiction.
// conditionalAmount is a what-if calculation, NEVER an adjudicated or received benefit.
const moneyText = value => `${(value / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}만원`;
const kinds = ['documented', 'assumption', 'unresolved'];
export const readingClassifications = Object.freeze({ documented: '문서에 확인된 약속', assumption: '계산을 위한 가정', unresolved: '아직 모르는 조건' });
const specs = [
  { id: 'a', name: '가상 A · 손해 보전', structure: 'indemnity', start: 30, end: 365, deductible: 500000, limit: 2000000, premium: 120000 },
  { id: 'b', name: '가상 B · 사건 정액', structure: 'fixed', start: 90, end: 365, fixedBenefit: 1000000 },
  { id: 'c', name: '가상 C · 갱신·환급 조건', structure: 'indemnity', start: 0, end: 180, deductible: 1000000, limit: 1000000, premium: 60000, refundDay: 90, refund: 20000 },
];
const clauses = {
  a: [
    ['A1', '계약자·피보험자·보험수익자는 모두 가상 인물 다온이며, 보험자는 가상회사 새봄입니다.'],
    ['A2', `사건 X가 ${specs[0].start}일 이상 ${specs[0].end}일 미만에 발생하면, 보상대상 손실에서 ${moneyText(specs[0].deductible)}을 공제한 나머지를 건별 ${moneyText(specs[0].limit)} 한도로 보전합니다.`],
    ['A3', `보험료 ${moneyText(specs[0].premium)}은 0일에 한 번 납입합니다. 납입일과 담보 보장개시일은 다릅니다.`],
    ['A4', '사건 X의 정의·면책사유·연간 총한도·다른 보험과의 조정·청구 절차는 별지에 따릅니다. 이 발췌에는 별지가 없습니다.'],
  ],
  b: [
    ['B1', '계약자·피보험자·보험수익자는 다온, 보험자는 가상회사 새봄입니다.'],
    ['B2', `이 담보가 정의한 사건 X가 ${specs[1].start}일 이상 ${specs[1].end}일 미만에 발생하고 나머지 지급조건도 충족하면, 실제 손실액과 별개로 ${moneyText(specs[1].fixedBenefit)}을 지급합니다.`],
    ['B3', '사건 X의 정의·면책사유·보험료·지급 횟수 제한·청구 서류·지급 시기는 별지에 따릅니다. 이 발췌에는 별지가 없습니다.'],
  ],
  c: [
    ['C1', '계약자·피보험자·보험수익자는 다온, 보험자는 가상회사 새봄입니다.'],
    ['C2', `첫 보험기간은 ${specs[2].start}일 이상 ${specs[2].end}일 미만입니다. 해당 기간의 사건 X로 생긴 보상대상 손실에서 ${moneyText(specs[2].deductible)}을 공제하고 건별 ${moneyText(specs[2].limit)} 한도로 보전합니다.`],
    ['C3', `첫 기간 보험료는 0일에 ${moneyText(specs[2].premium)}을 납입합니다. 이 보험료를 낸 뒤 ${specs[2].refundDay}일에 즉시 해지할 때 해약환급금은 ${moneyText(specs[2].refund)}입니다. 다른 시점의 환급금은 생략한 표를 확인해야 합니다.`],
    ['C4', `${specs[2].end}일은 갱신 경계입니다. 이후 유지에는 갱신 조건과 다음 보험료 확인이 필요합니다. 갱신 조건·사건 정의·면책·중복 조정·청구 절차는 생략한 별지에 있습니다.`],
  ],
};
export const readingDocuments = Object.freeze(specs.map(spec => Object.freeze({
  ...spec, clauses: Object.freeze(clauses[spec.id].map(([id, text]) => Object.freeze({ id, text }))),
})));
const statementSeeds = [
  ['a-rule', 'a', 'A의 공제는 50만원이고 건별 한도는 200만원이라는 약속이 적혀 있다.', 'documented', ['A2'], '문서에 금액과 계산 순서가 있습니다. 이는 조건을 충족하면 적용할 약속이지, 이번 청구의 승인이나 입금 증거가 아닙니다.'],
  ['a-event', 'a', '이번 비교에서는 같은 가상 손실이 A가 정의한 사건 X에 해당한다고 놓는다.', 'assumption', ['A4'], '사건 정의 별지가 없으므로 이번 사건의 해당 여부는 확인되지 않았습니다. 보장 사건 선택은 계산을 관찰하려고 둔 가정입니다.'],
  ['a-exclusion', 'a', '이 사건에 적용될 A의 면책사유가 있는지는 이 발췌만으로 알 수 없다.', 'unresolved', ['A4'], '면책 조항 원문과 사건 사실이 필요합니다. 별지가 없다는 이유로 면책 없음이나 지급 거절을 만들어 내지 않습니다.'],
  ['a-overlap', 'a', 'A와 C에 함께 가입했을 때 두 계산액을 그대로 합쳐 받는지는 아직 모른다.', 'unresolved', ['A4', 'C4'], '같은 손실에 대한 조정 조항이 빠져 있습니다. 두 줄의 단독 가정 계산은 동시 가입의 지급합계가 아닙니다.'],
  ['b-promise', 'b', 'B에는 지급조건 충족 시 손실액과 별개인 100만원의 약속이 적혀 있다.', 'documented', ['B2'], '정액 약속의 기준은 약정 사건과 조건입니다. 손실배분 띠의 세 번째 조각이나 무조건 받는 현금이 아닙니다.'],
  ['b-event', 'b', '이번 비교에서는 그 사건이 B가 별도로 정의한 사건 X에도 해당한다고 놓는다.', 'assumption', ['B3'], 'A와 같은 이름을 쓴다고 정의도 같다고 확인한 것은 아닙니다. 실험의 공통 선택은 각 계약의 정의에 모두 해당한다고 놓는 교육용 가정입니다.'],
  ['b-arrival', 'b', 'B의 돈이 지출 납기 전에 도착하는지는 아직 모른다.', 'unresolved', ['B3'], '청구 서류와 지급 시기가 생략되어 있습니다. 약정액·지급대상 판단·결정·현금 도착은 서로 다른 정보입니다.'],
  ['c-renewal', 'c', 'C의 첫 기간은 180일 직전에 끝나며 180일은 갱신 경계라고 적혀 있다.', 'documented', ['C2', 'C4'], '첫 기간의 끝은 확인됩니다. 그러나 경계 뒤의 유지나 동일한 보험료·보장 조건까지 확인한 것은 아닙니다.'],
  ['c-refund', 'c', 'C에는 첫 기간 보험료 6만원과 90일 즉시 해지 환급금 2만원이 따로 적혀 있다.', 'documented', ['C3'], '낸 돈과 해지 때 돌려받을 약정액은 서로 다른 항목입니다. 이 표 한 점은 다른 해지 시점이나 만기 금액을 설명하지 않습니다.'],
  ['c-paid', 'c', '계산에서는 첫 기간 보험료를 예정대로 내고 사건 전에 해지하지 않았다고 놓는다.', 'assumption', ['C3', 'C4'], '문서의 납입 약속은 실제 납입·유지 기록이 아닙니다. 이 연습은 첫 기간 계약이 유지됐다는 가정을 따로 둡니다.'],
  ['c-next-price', 'c', 'C의 갱신 뒤 보험료가 첫 기간과 같은지는 아직 모른다.', 'unresolved', ['C4'], '다음 보험료 표가 없으므로 같은 금액도 특정 인상률도 넣지 않습니다. 갱신 안내와 적용 조건을 확인해야 합니다.'],
  ['c-other-refund', 'c', 'C를 120일에 해지할 때 받을 환급금은 아직 모른다.', 'unresolved', ['C3'], '90일의 2만원을 직선으로 늘려 120일 값을 만들 수 없습니다. 해당 시점의 환급표와 조건이 필요합니다.'],
];
export const readingStatements = Object.freeze(statementSeeds.map(([id, contractId, text, classification, clauseIds, why], index) => Object.freeze({
  id, number: index + 1, contractId, text, classification,
  clauseIds: Object.freeze(clauseIds), why,
})));
export const readingDefaults = Object.freeze({ eventDay: 90, coveredEvent: true, loss: 3000000, selections: Object.freeze({}) });
const questions = {
  a: ['사건 정의와 면책 조항 중 이번 사실에 적용되는 것은 무엇인가요?', '연간 남은 한도와 다른 실손 계약의 조정식은 무엇인가요?', '청구서류·심사 결과·실제 입금일은 확인됐나요?'],
  b: ['B의 사건 정의가 A와 같나요? 면책·지급 횟수 제한은 무엇인가요?', '보험료와 유지 조건은 무엇이며, 언제 청구하고 언제 돈이 도착하나요?'],
  c: ['180일 뒤 갱신 가능 여부·보장·보험료는 어떤 문서에서 확인하나요?', '사건 정의·면책·다른 실손 계약의 조정식은 무엇인가요?', '90일이 아닌 해지 시점의 환급표와 해지 이후 보장 경계는 무엇인가요?'],
};
function evidence(statement) {
  return statement.clauseIds.map(id => {
    const document = readingDocuments.find(d => d.clauses.some(c => c.id === id));
    const clause = document.clauses.find(c => c.id === id);
    return { documentId: document.id, clauseId: id, text: clause.text };
  });
}
export function classifyReadingStatement(id, choice = '') {
  const statement = readingStatements.find(s => s.id === id);
  if (!statement) throw new RangeError('Unknown reading statement.');
  if (choice !== '' && !kinds.includes(choice)) throw new TypeError('Classification must be documented, assumption, unresolved, or an empty choice.');
  return { ...statement, clauseIds: [...statement.clauseIds], choice, correct: choice === '' ? null : choice === statement.classification,
    classificationLabel: readingClassifications[statement.classification], evidence: evidence(statement),
    feedback: choice === '' ? '아직 선택하지 않았습니다. 근거를 읽고 직접 분류해 보세요.' : choice === statement.classification ? '분류가 같습니다. 이유까지 확인하세요.' : `분류가 다릅니다. 이 문장의 성격은 ‘${readingClassifications[statement.classification]}’입니다.`,
  };
}
function normalize(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Options must be an object.');
  const p = { ...readingDefaults, ...options };
  if (p.eventDay !== null && (!Number.isInteger(p.eventDay) || Math.abs(p.eventDay) > 100000)) throw new RangeError('eventDay must be an integer within ±100000 or null.');
  if (p.coveredEvent !== null && typeof p.coveredEvent !== 'boolean') throw new TypeError('coveredEvent must be boolean or null.');
  if (!Number.isFinite(p.loss) || p.loss < 0 || p.loss > 1e12) throw new RangeError('loss must be finite within 0..1e12 won.');
  if (!p.selections || typeof p.selections !== 'object' || Array.isArray(p.selections)) throw new TypeError('selections must be an object.');
  for (const [id, choice] of Object.entries(p.selections)) {
    if (choice !== '' && !kinds.includes(choice)) throw new TypeError('Each selection must be a classification or an empty choice.');
    classifyReadingStatement(id, choice);
  }
  p.selections = { ...p.selections };
  return p;
}
function evaluateContract(document, params) {
  const { eventDay, coveredEvent, loss } = params;
  const renewalUnresolved = document.id === 'c' && eventDay !== null && eventDay >= document.end;
  const dateState = eventDay === null ? 'unknown' : renewalUnresolved ? 'renewal-unknown' : eventDay >= document.start && eventDay < document.end ? 'inside' : 'outside';
  // Unknown is kept even alongside an assumed non-covered event. No denial is inferred.
  const status = eventDay === null || coveredEvent === null || renewalUnresolved ? 'unresolved' : !coveredEvent ? 'assumed-outside' : dateState === 'outside' ? 'date-outside' : 'conditional';
  const conditionalAmount = status === 'unresolved' ? null : status !== 'conditional' ? 0 : document.structure === 'fixed' ? document.fixedBenefit : Math.min(Math.max(0, loss - document.deductible), document.limit);
  const segmentSeeds = document.structure === 'fixed' ? [] : conditionalAmount === null ? [['unknown', '조건 미확인', loss]] : status !== 'conditional' ? [['outside', '이 날짜·가정에서는 범위 밖', loss]] : [
    ['deductible', '공제', Math.min(loss, document.deductible)],
    ['conditional', '조건부 보전 계산', conditionalAmount],
    ['limit', '건별 한도 밖', Math.max(0, loss - Math.min(loss, document.deductible) - conditionalAmount)],
  ];
  let left = 0;
  const segments = segmentSeeds.map(([id, label, amount]) => {
    const segment = { id, label, amount, leftFraction: loss === 0 ? 0 : left / loss, fraction: loss === 0 ? 0 : amount / loss };
    left += amount;
    return segment;
  });
  const statusLabel = { unresolved: '조건 미확인 · 계산 미정', 'assumed-outside': '비대상 가정 · 색칠 없음', 'date-outside': '문서 날짜 범위 밖 · 색칠 없음', conditional: '추가 조건을 둔 가상 계산' }[status];
  const detail = status === 'unresolved' ? renewalUnresolved ? 'C는 180일부터 갱신 조건이 빠져 있습니다. 첫 기간의 식을 연장하거나 보장 종료로 단정하지 않습니다.' : '사건일 또는 사건 해당 여부가 미확인입니다. 금액을 만들지 않고 빈 경계로 남깁니다.' : status === 'date-outside' ? '기재된 날짜 구간에 들어가지 않아 이 단독 가정 그림에는 보전 부분을 칠하지 않습니다. 실제 거절 결정이 아닙니다.' : status === 'assumed-outside' ? '보장 사건이 아니라는 가정에서만 색칠이 사라집니다. 실제 사건 조사나 지급 거절 결과가 아닙니다.' : '사건 해당·첫 기간 유지·다른 면책 없음·이번 청구의 남은 한도 충분을 추가 가정한 단독 계산입니다. 문서의 빈칸을 사실로 채운 것이 아닙니다.';
  return { id: document.id, name: document.name, structure: document.structure, dateState, status, statusLabel, conditionalAmount, actualPayable: null, received: null, segments, questions: [...questions[document.id]], detail,
    links: [{ id: 'promise', kind: 'documented', label: `${document.structure === 'fixed' ? '정액 약속' : '공제·건별 한도'} · 문서 확인` }, { id: 'event', kind: 'assumption', label: coveredEvent === null ? '사건 해당 여부 ?' : coveredEvent ? '각 계약의 사건에 해당한다고 가정' : '사건에 해당하지 않는다고 가정' }, { id: 'exclusion', kind: 'unresolved', label: '면책·제한·실제 지급 ?' }],
  };
}
export function projectReading(options = {}) {
  const params = normalize(options);
  const contracts = readingDocuments.map(d => evaluateContract(d, params));
  const assessments = readingStatements.map(s => classifyReadingStatement(s.id, params.selections[s.id] ?? ''));
  const min = Math.min(-30, params.eventDay ?? 0), max = Math.max(400, params.eventDay ?? 0), span = max - min;
  const timeline = { min, max, eventDay: params.eventDay, eventFraction: params.eventDay === null ? null : (params.eventDay - min) / span,
    windows: readingDocuments.map(d => ({ id: d.id, start: d.start, end: d.end, leftFraction: (d.start - min) / span, fraction: (d.end - d.start) / span,
      unknownAfter: d.id === 'c' ? { start: d.end, end: max, leftFraction: (d.end - min) / span, fraction: (max - d.end) / span } : null })),
  };
  const verdict = '문서에 적힌 약속은 확인할 수 있지만, 실제 지급대상액과 입금액은 세 계약 모두 미정입니다. 색칠은 추가 가정 아래의 단독 계산이며, 빠진 조항은 확인 질문으로 남깁니다. 계약 점수·순위나 구매 권유가 아닙니다.';
  const phases = [
    ['read', '발췌와 문장 읽기', '세 발췌와 분류 문장을 읽고 직접 선택합니다. 실험의 기본 가정은 이미 그림에 보이지만, 분류 근거는 다음 단계에서 공개합니다.'],
    ['documented', '문서의 약속 연결', '실선은 문서가 직접 정한 관계입니다. 약속이 있다는 사실과 그 약속으로 이번에 돈을 받는다는 사실은 다릅니다.'],
    ['assumptions', '계산 가정 분리', '점선은 문서 밖에서 보탠 가정입니다. 사건일과 사건 해당 선택을 바꾸어 같은 손실 위의 조건부 색칠을 비교하세요.'],
    ['questions', '미확인 경계 남기기', '빈 경계와 물음표는 미확인 조건입니다. 답을 추측하거나 0원 거절로 바꾸지 말고 필요한 원문을 묻습니다.'],
    ['interpret', '함께 해석하기', verdict],
  ];
  const revealAt = { documented: 1, assumption: 2, unresolved: 3 };
  const frames = phases.map(([phase, label, detail], index) => ({ index, phase, label, detail,
    assessments: assessments.map(a => ({ ...a, clauseIds: [...a.clauseIds], evidence: a.evidence.map(e => ({ ...e })), revealed: index >= revealAt[a.classification] })),
    verdict: index === phases.length - 1 ? verdict : null,
  }));
  return { params, documents: readingDocuments, contracts, assessments, timeline, frames, verdict, predictionAnswer: 'unresolved',
    scenario: { loss: params.loss, eventDay: params.eventDay, coveredEvent: params.coveredEvent, actualPayable: null, received: null, combinedIndemnity: null,
      assumptions: ['각 계약의 해당 사건 여부는 선택한 가정대로 둡니다.', '첫 기간 보험료를 예정대로 내고 사건 전에 해지하지 않았다고 가정합니다.', '단독 계산에서 다른 면책이 적용되지 않고 이번 청구의 남은 한도가 충분하다고 가정합니다.', 'A와 C의 동시 가입 조정·갱신 뒤 조건·실제 심사·입금은 계산하지 않습니다.'] },
  };
}
export function readingBoundaryCases() {
  return [-1, 0, 29, 30, 89, 90, 179, 180, 364, 365].map(eventDay => projectReading({ eventDay }));
}
