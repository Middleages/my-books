import test from 'node:test';import assert from 'node:assert/strict';
import {logFrame,metricFrame} from '../src/simulations/observability/records.mjs';
test('logs distinguish delayed arrival, duplicate event, request and severity',()=>{
 assert.equal(logFrame(3,'duplicate').visible.length,4);assert.equal(logFrame(3,'duplicate').uniqueEvents,3);assert.equal(logFrame(3,'duplicate').requestIds.length,2);
 assert.deepEqual(logFrame(2,'late').visible.map(e=>e.eventId),['e1','e3']);assert.equal(logFrame(3,'late').visible.length,3);
 assert.equal(logFrame(3,'normal','error').visible.length,1);assert.equal(logFrame(0).visible.length,0);
});
test('allowlist prevents forbidden fields reaching records; repeat is deterministic',()=>{const f=logFrame(3,'unsafe');assert.deepEqual(f.removedFields,['authorization','freeText']);for(const record of f.safeRecords){assert.equal('authorization' in record,false);assert.equal('freeText' in record,false);}assert.deepEqual(f,logFrame(3,'unsafe'));});
test('counter reset and unknown scrape differ from observed zero',()=>{assert.equal(metricFrame(3,'reset').intervals[1].rate,.1);assert.deepEqual(metricFrame(3,'reset').resetMarkers,[20]);assert.equal(metricFrame(3,'gap').samples[2].counter,null);assert.equal(metricFrame(3,'gap').samples[2].gauge,null);assert.equal(metricFrame(3,'gap').intervals[1].rate,null);assert.equal(metricFrame(3,'zero').intervals[1].rate,0);});
test('distribution retains tails, cumulative buckets and zero denominators',()=>{const f=metricFrame(3,'tail');assert.equal(f.count,12);assert.equal(f.sum,3000);assert.equal(f.mean,250);assert.equal(f.p95,1000);assert.deepEqual(f.bucketCounts.map(b=>b.count),[10,10,12]);assert.equal(metricFrame(3,'zero').mean,null);assert.equal(metricFrame(0).p95,null);assert.deepEqual(metricFrame(99),metricFrame(3));assert.deepEqual(metricFrame(-1),metricFrame(0));});
test('time frames retain a prefix of the fixed duration fixture',()=>{const final=metricFrame(3,'tail');for(let s=0;s<4;s++){const f=metricFrame(s,'tail');assert.deepEqual(f.durations,final.durations.slice(0,f.count));}});
