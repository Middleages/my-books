import test from 'node:test';
import assert from 'node:assert/strict';
import { contractCases, contractFrames, allocateRecovery, recoveryFrames } from '../src/simulations/housing/contracts.mjs';

test('evidence visibility is not legal eligibility or a safety score', () => {
  for (const id of Object.keys(contractCases)) {
    const frames = contractFrames(id);
    assert.equal(frames[0].addressMatch, null);
    assert.equal(frames[0].authorityShown, null);
    assert.equal(frames[1].newEntry, null);
    assert(frames.every(f=>f.legalDecision===null));
    assert.deepEqual(frames[3].events.map(e=>e.day),[0,0,30,31]);
    assert(frames[3].events.every(e=>e.visible));
    assert.equal(frames[3].addressMatch,id!=='address');
    assert.equal(frames[3].authorityShown,id!=='authority');
    assert.equal(frames[3].newEntry,id==='changed');
    assert.deepEqual(frames,contractFrames(id));
  }
  assert.throws(()=>contractFrames('safe'));
});
test('externally supplied priority allocation conserves money and caps recovery', () => {
  assert.deepEqual(allocateRecovery(),{proceeds:160e6,prior:50e6,claim:140e6,first:50e6,tenant:110e6,unused:0,unrecovered:30e6});
  for(const proceeds of [0,1,50e6,160e6,300e6]) for(const prior of [0,1,50e6,400e6]) for(const claim of [0,1,140e6]) {
    const a=allocateRecovery({proceeds,prior,claim});
    assert.equal(a.first+a.tenant+a.unused,proceeds);
    assert.equal(a.tenant+a.unrecovered,claim);
    assert(a.tenant>=0&&a.tenant<=claim&&a.first<=prior&&a.unused>=0);
  }
});
test('guarantee status and cash arrival are separate; no duplicate recovery or erased debt', () => {
  for(const guarantee of ['none','unknown','assumed']) for(const arrivalDay of [60,120]) {
    const frames=recoveryFrames({guarantee,arrivalDay});
    for(const f of frames) {
      assert.equal(f.totalCash+f.remainingClaim,f.claim);
      assert.equal(f.institutionClaim,f.guaranteeCash);
      assert.equal(f.debt,20e6);
      assert.equal(f.landlordCash,f.day>=10?110e6:0);
      assert.equal(f.guaranteeCash,guarantee==='assumed'&&f.day>=arrivalDay?30e6:0);
    }
    assert.equal(frames[2].guaranteeCash,0);
    assert.deepEqual(frames,recoveryFrames({guarantee,arrivalDay}));
  }
  const fullyRecovered = recoveryFrames({proceeds:300e6,guarantee:'assumed'});
  assert.equal(fullyRecovered.at(-1).guaranteeCash,0);
  assert(fullyRecovered.every(f=>f.guaranteeStatus.startsWith('추가 보증 지급액 없음')));
});
test('unrecovered is not automatically permanent loss and invalid inputs fail', () => {
  assert.equal(recoveryFrames().at(-1).remainingClaim,30e6);
  for(const bad of [-1,NaN,Infinity,1e11]) for(const key of ['proceeds','prior','claim','debt']) assert.throws(()=>recoveryFrames({[key]:bad}));
  assert.throws(()=>recoveryFrames({guarantee:'approved'}));
  assert.throws(()=>recoveryFrames({arrivalDay:61}));
});

test('every recovery stage preserves principal across boundary allocations and guarantee states', () => {
  let scenarios=0;
  for(const proceeds of [0,1,50e6,160e6,1e10]) for(const prior of [0,1,50e6,1e10]) for(const claim of [0,1,140e6,1e10])
  for(const guarantee of ['none','unknown','assumed']) for(const arrivalDay of [60,120]) {
    const fs=recoveryFrames({proceeds,prior,claim,guarantee,arrivalDay}); scenarios++;
    for(let i=0;i<fs.length;i++) {
      const f=fs[i];
      assert.equal(f.first+f.tenant+f.unused,proceeds);
      assert.equal(f.totalCash+f.remainingClaim,claim);
      assert.equal(f.landlordCash+f.institutionClaim+f.remainingClaim,claim);
      assert.equal(f.institutionClaim,f.guaranteeCash);
      assert(f.totalCash>=0&&f.totalCash<=claim&&f.remainingClaim>=0);
      assert.equal(f.debt,20e6);
      if(guarantee!=='assumed') {assert.equal(f.guaranteeCash,0);assert.equal(f.institutionClaim,0);}
      if(f.day<10) assert.equal(f.landlordCash,0);
      if(f.day<arrivalDay) assert.equal(f.guaranteeCash,0);
      if(i) {assert(f.totalCash>=fs[i-1].totalCash);assert(f.remainingClaim<=fs[i-1].remainingClaim);}
    }
    assert.deepEqual(fs,recoveryFrames({proceeds,prior,claim,guarantee,arrivalDay}));
  }
  assert.equal(scenarios,480);
});
