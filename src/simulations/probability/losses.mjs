export const lossDefaults = Object.freeze({ cash: 200, dueDay: 15 });
export const lossCases = Object.freeze([
  { id: 'A', label: 'A · 작은 손실', outcomes: [{ loss: 0, probability: .8 }, { loss: 100, probability: .2 }] },
  { id: 'B', label: 'B · 드문 큰 손실', outcomes: [{ loss: 0, probability: .97 }, { loss: 200, probability: .02 }, { loss: 1600, probability: .01 }] },
]);
export function evaluateLoss(outcomes, cash) {
  if (!Number.isFinite(cash) || cash < 0 || !outcomes.length || outcomes.some(o => !Number.isFinite(o.loss) || o.loss < 0 || !Number.isFinite(o.probability) || o.probability < 0 || o.probability > 1)) throw new RangeError('Finite nonnegative losses/cash and valid probabilities required');
  if (Math.abs(outcomes.reduce((a, o) => a + o.probability, 0) - 1) > 1e-12) throw new RangeError('Probabilities must sum to one');
  const rows = outcomes.map((o, index) => ({ ...o, index, possible: o.probability > 0, funded: Math.min(o.loss, cash), shortage: Math.max(o.loss - cash, 0), remaining: Math.max(cash - o.loss, 0), lossFraction: o.loss / 1700, fundedFraction: Math.min(o.loss, cash) / 1700, shortageFraction: Math.max(o.loss - cash, 0) / 1700 }));
  return { rows, expectedLoss: rows.reduce((a, o) => a + o.probability * o.loss, 0), expectedShortage: rows.reduce((a, o) => a + o.probability * o.shortage, 0), shortageProbability: rows.reduce((a, o) => a + (o.shortage > 0 ? o.probability : 0), 0) };
}
export function lossModel(input = {}) {
  const params = { ...lossDefaults, ...input };
  if (![0, 200, 300, 1600].includes(params.cash) || ![15, 30, 45].includes(params.dueDay)) throw new RangeError('Use supported cash and date conditions');
  const arrival = { amount: 100, day: 30 }, arrived = arrival.day <= params.dueDay, cashAtDue = params.cash + (arrived ? arrival.amount : 0);
  const cases = lossCases.map(c => ({ ...c, ...evaluateLoss(c.outcomes, cashAtDue) }));
  const frameInfo = [
    ['결과가 정해지기 전', '위쪽은 가능한 결과 전체입니다. 아직 사건이 관측되거나 현금이 지출된 것은 아닙니다.'],
    ['손실 없는 대안', '둘 다 손실 0인 대안을 골랐습니다. 확률이나 기대값이 새 관측값으로 바뀌지 않습니다.'],
    ['작은 손실 대안', 'A는 100만원, B는 200만원 손실인 서로 다른 대안입니다. 충당액과 부족액을 합하면 손실입니다.'],
    ['큰 손실까지 비교', 'B의 1,600만원 손실을 봅니다. A에는 더 큰 손실 결과가 없어 100만원을 그대로 비교합니다. 앞 대안과 합산하지 않습니다.'],
  ];
  const frames = frameInfo.map(([label, explanation], step) => ({ step, label, explanation, cases: cases.map(c => ({ id: c.id, row: step === 0 ? null : c.rows[step === 1 ? 0 : step === 2 ? 1 : c.rows.length - 1] })) }));
  return { caseId: 'loss-and-deadline', dataKind: '모형 가정 · 정확한 계산', params, arrival, arrived, cashAtDue, axisMax: 1700, cashFraction: cashAtDue / 1700, cases, frames, timeline: [{ day: 0, label: '처음 현금', amount: params.cash, meaning: '시작 금액' }, { day: arrival.day, label: '확정 외부 유입', amount: arrival.amount, meaning: '새로 들어올 금액' }, { day: params.dueDay, label: '지출 납기', amount: cashAtDue, meaning: '지출 직전 사용 가능' }].sort((a, b) => a.day - b.day), verdict: `기대손실은 둘 다 20만원. 납기 현금 ${cashAtDue}만원에서 B의 기대부족액은 ${cases[1].expectedShortage}만원입니다.` };
}
