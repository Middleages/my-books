// Synthetic teaching observations, not milestones, norms or a screening tool.
export const domains = ['몸·손', '소통', '관계', '놀이·탐색'];
export const states = ['관찰함', '관찰하지 못함', '기회 없음', '모름'];
export const observations = [
  ['물체를 향해 손을 뻗음', '몸짓으로 관심을 표현함', '보호자 반응을 바라봄', '물체를 여러 방향으로 살펴봄'],
  ['물체를 다른 손으로 옮김', '이번 장면에서 몸짓을 보지 못함', '함께 바라볼 기회를 만들지 못함', '기록자가 장면을 보지 못함'],
  ['이번 장면에서 손 움직임을 보지 못함', '몸짓으로 관심을 표현함', '보호자에게 물체를 보여 줌', '물체를 다시 살펴봄'],
];
export function observationFrame(index = 0) {
  if (!Number.isInteger(index) || index < 0 || index > 2) throw new RangeError('Observation index');
  const codes = index === 1 ? [0, 1, 2, 3] : index === 2 ? [1, 0, 0, 0] : [0, 0, 0, 0];
  return domains.map((domain, i) => ({ domain, state: states[codes[i]], code: codes[i], note: observations[index][i] }));
}
const day = 86400000;
function dateValue(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError('ISO date required');
  const n = Date.parse(value + 'T00:00:00Z');
  if (!Number.isFinite(n) || new Date(n).toISOString().slice(0, 10) !== value) throw new RangeError('Invalid date');
  return n;
}
export function ageFrame(gestationWeeks = 32, elapsedWeeks = 16) {
  if (!Number.isInteger(gestationWeeks) || gestationWeeks < 28 || gestationWeeks > 36 || !Number.isInteger(elapsedWeeks) || elapsedWeeks < 0 || elapsedWeeks > 24) throw new RangeError('Synthetic range');
  const earlyDays = (40 - gestationWeeks) * 7, elapsedDays = elapsedWeeks * 7;
  const birth = dateValue('2024-01-31'), due = birth + earlyDays * day, now = birth + elapsedDays * day;
  return { gestationWeeks, elapsedWeeks, earlyDays, elapsedDays, correctedDays: elapsedDays - earlyDays, birth: '2024-01-31', due: new Date(due).toISOString().slice(0, 10), now: new Date(now).toISOString().slice(0, 10) };
}
export function calendarDays(start, end) { return (dateValue(end) - dateValue(start)) / day; }
export const evidenceAges = [2, 4, 6, 9, 12, 15, 18, 24, 30, 36];
export function ageNeighbors(months) {
  if (!Number.isInteger(months) || months < 0 || months > 36) throw new RangeError('Age navigation range');
  return { months, exact: evidenceAges.includes(months), before: evidenceAges.filter(n => n <= months).at(-1) ?? null, after: evidenceAges.find(n => n >= months) ?? null };
}
