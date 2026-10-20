import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyReadingStatement, projectReading, readingBoundaryCases, readingClassifications, readingDefaults, readingDocuments, readingStatements } from '../src/simulations/insurance/reading.mjs';
const close = (a, b) => assert(Math.abs(a - b) <= 20 * Number.EPSILON * Math.max(1, Math.abs(b)), `${a} != ${b}`);
function checkModel(result) {
  assert.equal(result.contracts.length, 3);
  assert.equal(result.scenario.actualPayable, null);
  assert.equal(result.scenario.received, null);
  assert.equal(result.scenario.combinedIndemnity, null);
  for (const contract of result.contracts) {
    assert.equal(contract.actualPayable, null);
    assert.equal(contract.received, null);
    assert.deepEqual(contract.links.map(link => link.kind), ['documented', 'assumption', 'unresolved']);
    assert(contract.questions.length > 0);
    if (contract.structure === 'fixed') assert.deepEqual(contract.segments, []);
    else {
      close(contract.segments.reduce((sum, segment) => sum + segment.amount, 0), result.params.loss);
      close(contract.segments.reduce((sum, segment) => sum + segment.fraction, 0), result.params.loss === 0 ? 0 : 1);
      let left = 0;
      for (const segment of contract.segments) {
        assert(segment.amount >= 0);
        close(segment.leftFraction, result.params.loss === 0 ? 0 : left / result.params.loss);
        close(segment.fraction, result.params.loss === 0 ? 0 : segment.amount / result.params.loss);
        assert(segment.fraction >= 0 && segment.fraction <= 1);
        left += segment.amount;
      }
      if (contract.status === 'conditional') assert.equal(contract.segments.find(segment => segment.id === 'conditional').amount, contract.conditionalAmount);
      if (contract.status === 'unresolved') {
        assert.equal(contract.conditionalAmount, null);
        assert.equal(contract.segments.length, 1);
        assert.equal(contract.segments[0].id, 'unknown');
      }
    }
  }
  const { min, max, eventFraction } = result.timeline;
  if (result.params.eventDay === null) assert.equal(eventFraction, null);
  else close(eventFraction, (result.params.eventDay - min) / (max - min));
  for (const window of result.timeline.windows) {
    close(window.leftFraction, (window.start - min) / (max - min));
    close(window.fraction, (window.end - window.start) / (max - min));
    if (window.unknownAfter) {
      close(window.unknownAfter.leftFraction, (window.end - min) / (max - min));
      close(window.unknownAfter.fraction, (max - window.end) / (max - min));
    }
  }
  assert.equal(result.frames.length, 5);
  for (const frame of result.frames.slice(0, -1)) assert.equal(frame.verdict, null);
  assert.equal(result.frames.at(-1).verdict, result.verdict);
}

test('reading default three fictional promises are conditional and never actual approval or receipt', () => {
  const result = projectReading();
  assert.deepEqual(result.params, readingDefaults);
  assert.deepEqual(result.contracts.map(contract => contract.conditionalAmount), [2000000, 1000000, 1000000]);
  assert.deepEqual(result.contracts.map(contract => contract.status), ['conditional', 'conditional', 'conditional']);
  assert.equal(result.predictionAnswer, 'unresolved');
  assert.match(result.verdict, /실제 지급대상액과 입금액은 세 계약 모두 미정/);
  checkModel(result);
});

test('three documents retain distinct exact clauses, dates, insurance roles, costs and refund point', () => {
  assert.deepEqual(readingDocuments.map(document => document.id), ['a', 'b', 'c']);
  assert.deepEqual(readingDocuments.map(document => [document.start, document.end]), [[30, 365], [90, 365], [0, 180]]);
  for (const document of readingDocuments) assert(document.clauses.some(clause => /계약자·피보험자·보험수익자/.test(clause.text)));
  const c = readingDocuments[2];
  assert.equal(c.premium, 60000); assert.equal(c.refund, 20000); assert.equal(c.refundDay, 90);
  assert.match(c.clauses.find(clause => clause.id === 'C3').text, /다른 시점의 환급금은 생략한 표/);
  assert.match(c.clauses.find(clause => clause.id === 'C4').text, /다음 보험료 확인/);
});

for (const statement of readingStatements) test(`reading classification ${statement.id}: ${statement.classification}`, () => {
  const correct = classifyReadingStatement(statement.id, statement.classification);
  assert.equal(correct.correct, true);
  assert.equal(correct.classificationLabel, readingClassifications[statement.classification]);
  assert.equal(correct.choice, statement.classification);
  assert(correct.evidence.length >= 1);
  for (const item of correct.evidence) assert.equal(item.text, readingDocuments.find(document => document.id === item.documentId).clauses.find(clause => clause.id === item.clauseId).text);
  for (const choice of Object.keys(readingClassifications).filter(choice => choice !== statement.classification)) {
    const wrong = classifyReadingStatement(statement.id, choice);
    assert.equal(wrong.correct, false);
    assert.match(wrong.feedback, /분류가 다릅니다/);
    assert.equal(wrong.why, correct.why);
    assert.deepEqual(wrong.evidence, correct.evidence);
  }
  const unanswered = classifyReadingStatement(statement.id);
  assert.equal(unanswered.correct, null);
  assert.equal(unanswered.choice, '');
});

test('classification choices never rewrite rules, contract evidence, geometry or actual outcomes', () => {
  const selections = Object.fromEntries(readingStatements.map(statement => [statement.id, 'documented']));
  const result = projectReading({ selections });
  assert.deepEqual(result.contracts, projectReading().contracts);
  assert.deepEqual(result.timeline, projectReading().timeline);
  assert.deepEqual(result.documents, readingDocuments);
  assert(result.assessments.some(assessment => assessment.correct === false));
  assert(result.assessments.some(assessment => assessment.correct === true));
  checkModel(result);
});

test('only the intended evidence category is revealed at each phase; no automatic grade becomes payout', () => {
  const result = projectReading();
  assert.deepEqual(result.frames.map(frame => frame.phase), ['read', 'documented', 'assumptions', 'questions', 'interpret']);
  const revealAt = { documented: 1, assumption: 2, unresolved: 3 };
  for (const frame of result.frames) for (const assessment of frame.assessments) assert.equal(assessment.revealed, frame.index >= revealAt[assessment.classification]);
  assert(result.frames[0].assessments.every(assessment => !assessment.revealed));
  assert(result.frames.at(-1).assessments.every(assessment => assessment.revealed));
});

for (const [eventDay, amounts] of [[-1, [0, 0, 0]], [0, [0, 0, 1000000]], [29, [0, 0, 1000000]], [30, [2000000, 0, 1000000]], [89, [2000000, 0, 1000000]], [90, [2000000, 1000000, 1000000]], [179, [2000000, 1000000, 1000000]], [180, [2000000, 1000000, null]], [364, [2000000, 1000000, null]], [365, [0, 0, null]]]) test(`reading exact event-day boundary ${eventDay} keeps known versus renewal-unknown distinct`, () => {
  const result = projectReading({ eventDay });
  assert.deepEqual(result.contracts.map(contract => contract.conditionalAmount), amounts);
  checkModel(result);
});

test('event date changes only the conditional application, not the documented promise or fixed loss scale', () => {
  const before = projectReading({ eventDay: 29 });
  const after = projectReading({ eventDay: 30 });
  assert.deepEqual(before.documents, after.documents);
  assert.equal(before.scenario.loss, after.scenario.loss);
  assert.equal(before.contracts[0].segments.find(segment => segment.id === 'outside').fraction, 1);
  close(after.contracts[0].segments.find(segment => segment.id === 'conditional').fraction, 2 / 3);
  assert.equal(after.contracts[0].actualPayable, null);
});

for (const patch of [{ eventDay: null }, { coveredEvent: null }, { eventDay: null, coveredEvent: false }, { eventDay: 29, coveredEvent: null }]) test(`reading unknown ${JSON.stringify(patch)} is not silently a denial or an invented date`, () => {
  const result = projectReading(patch);
  for (const contract of result.contracts) {
    assert.equal(contract.status, 'unresolved');
    assert.equal(contract.conditionalAmount, null);
    assert.equal(contract.actualPayable, null);
  }
  if (patch.eventDay === null) assert.equal(result.timeline.eventFraction, null);
  checkModel(result);
});

test('false covered-event assumption removes color but never declares an actual denial', () => {
  const result = projectReading({ coveredEvent: false });
  assert.deepEqual(result.contracts.map(contract => contract.conditionalAmount), [0, 0, 0]);
  assert(result.contracts.every(contract => contract.status === 'assumed-outside'));
  assert(result.contracts.every(contract => /실제 사건 조사나 지급 거절 결과가 아닙니다/.test(contract.detail)));
  checkModel(result);
});

test('unknown renewal conditions remain unresolved even beside an assumed non-covered event', () => {
  for (const eventDay of [180, 365, 100000]) {
    const result = projectReading({ eventDay, coveredEvent: false });
    assert.equal(result.contracts[2].dateState, 'renewal-unknown');
    assert.equal(result.contracts[2].conditionalAmount, null);
    checkModel(result);
  }
});

for (const loss of [0, 0.01, 1 / 3, 499999, 500000, 500001, 1000000, 1000001, 2000000, 2500000, 3000000, 1e12]) test(`reading loss ${loss} conserves a separate A/C partition and does not scale fixed B`, () => {
  const result = projectReading({ loss });
  assert.equal(result.contracts[0].conditionalAmount, Math.min(Math.max(0, loss - 500000), 2000000));
  assert.equal(result.contracts[1].conditionalAmount, 1000000);
  assert.equal(result.contracts[2].conditionalAmount, Math.min(Math.max(0, loss - 1000000), 1000000));
  checkModel(result);
});

test('zero-loss unknown state remains unknown with zero proportional area and separate fixed promise', () => {
  const result = projectReading({ loss: 0, coveredEvent: null });
  for (const contract of result.contracts) assert.equal(contract.conditionalAmount, null);
  checkModel(result);
});

test('timeline supports extreme finite event dates without hiding or clamping the marker', () => {
  for (const eventDay of [-100000, 100000]) {
    const result = projectReading({ eventDay });
    assert.equal(result.timeline.eventFraction, eventDay < 0 ? 0 : 1);
    checkModel(result);
  }
});

test('all static date alternatives come from the same model', () => {
  const rows = readingBoundaryCases();
  assert.deepEqual(rows.map(row => row.params.eventDay), [-1, 0, 29, 30, 89, 90, 179, 180, 364, 365]);
  for (const row of rows) assert.deepEqual(row, projectReading({ eventDay: row.params.eventDay }));
});

test('malformed dates, assumptions, amounts, selections and IDs are rejected rather than coerced', () => {
  for (const value of [null, [], '90', 90]) assert.throws(() => projectReading(value), TypeError);
  for (const value of [NaN, Infinity, -Infinity, undefined, '90', .5, 100001, -100001]) assert.throws(() => projectReading({ eventDay: value }), RangeError);
  for (const value of [NaN, Infinity, -1, undefined, '3000000', 1e12 + 1]) assert.throws(() => projectReading({ loss: value }), RangeError);
  for (const value of [1, 0, 'true', undefined]) assert.throws(() => projectReading({ coveredEvent: value }), TypeError);
  for (const value of [null, [], 'yes', 9]) assert.throws(() => projectReading({ selections: value }), TypeError);
  assert.throws(() => projectReading({ selections: { missing: 'documented' } }), RangeError);
  for (const value of [null, undefined, true, 1, 'approved']) {
    if (value !== undefined) assert.throws(() => classifyReadingStatement('a-rule', value), TypeError);
    assert.throws(() => projectReading({ selections: { 'a-rule': value } }), TypeError);
  }
  assert.throws(() => classifyReadingStatement('unknown', 'documented'), RangeError);
});

test('repeat/reset and unrelated choice changes preserve fresh independent frame evidence and inputs', () => {
  const options = Object.freeze({ eventDay: 179, loss: 2500000, coveredEvent: true, selections: Object.freeze({ 'a-rule': 'documented', 'b-arrival': 'assumption' }) });
  const a = projectReading(options), b = projectReading(options);
  assert.deepEqual(a, b);
  assert.deepEqual(projectReading(), projectReading(readingDefaults));
  a.frames[0].assessments[0].evidence[0].text = 'mutated';
  assert.notEqual(a.frames[1].assessments[0].evidence[0].text, 'mutated');
  assert.notEqual(projectReading(options).frames[0].assessments[0].evidence[0].text, 'mutated');
  a.contracts[0].segments[0].amount = 7;
  assert.notEqual(projectReading(options).contracts[0].segments[0].amount, 7);
  assert.equal(options.selections['a-rule'], 'documented');
  assert.equal(readingDefaults.eventDay, 90);
});
