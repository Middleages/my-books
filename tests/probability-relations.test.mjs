import test from 'node:test';
import assert from 'node:assert/strict';
import { associationModel, seasonalRecords, countWeightedMean } from '../src/simulations/probability/association.mjs';
import { binaryJoint, linearCorrelation, nonlinearExample, dependenceModel } from '../src/simulations/probability/dependence.mjs';
const close=(actual,expected,tolerance=1e-10)=>assert(Math.abs(actual-expected)<=tolerance,`${actual} != ${expected}`);

test('observational counts stay fixed while standardized comparison reverses the aggregate direction',()=>{
 const original=JSON.stringify(seasonalRecords), base=associationModel();
 assert.deepEqual(base.groups.map(g=>g.observed),[{count:100,sum:10000,mean:100},{count:100,sum:15000,mean:150}]);
 assert.deepEqual(base.groups.map(g=>g.standardized),[130,120]); assert.equal(base.observedDifference,-50);assert.equal(base.standardizedDifference,10);assert.deepEqual(base.total,{count:200,sum:25000,mean:125});
 for(const lowWeight of[0,.25,.5,.75,1]){const m=associationModel({lowWeight});assert.deepEqual(m.cells,base.cells);assert.equal(m.causalEstimate,null);assert.equal(m.standardizedDifference,10);assert.equal(m.standardizedWeights.low+m.standardizedWeights.high,1);assert.equal(m.frames.length,4);assert(m.candidatePaths.every(p=>['candidate','unidentified'].includes(p.status)));for(const g of m.groups){close(g.standardized,g.contributions.low+g.contributions.high);close(g.standardizedFraction,g.standardized/200);assert.equal(g.observedWeights.low+g.observedWeights.high,1);}}
 assert.equal(JSON.stringify(seasonalRecords),original);assert.deepEqual(associationModel(),base);
});
test('empty count denominator is unknown, and invalid weights/counts are rejected',()=>{
 assert.deepEqual(countWeightedMean([]),{count:0,sum:0,mean:null});assert.equal(countWeightedMean([{count:0,mean:100}]).mean,null);assert.equal(countWeightedMean([{count:1,mean:0}]).mean,0);
 for(const lowWeight of[-1,1.01,NaN,Infinity])assert.throws(()=>associationModel({lowWeight}));
 for(const rows of[[{count:-1,mean:1}],[{count:.5,mean:1}],[{count:1,mean:Infinity}],null])assert.throws(()=>countWeightedMean(rows));
});
test('all small integer joint distributions preserve cell sum, marginals and exact independence',()=>{
 for(let aCount=0;aCount<=10;aCount++)for(let bCount=0;bCount<=10;bCount++)for(let bothCount=Math.max(0,aCount+bCount-10);bothCount<=Math.min(aCount,bCount);bothCount++){
  const j=binaryJoint({total:10,aCount,bCount,bothCount});assert.equal(j.cells.reduce((s,c)=>s+c.count,0),10);assert(j.cells.every(c=>c.count>=0));assert.equal(j.tokens.length,10);assert.equal(j.tokens.filter(t=>t.aLoss).length,aCount);assert.equal(j.tokens.filter(t=>t.bLoss).length,bCount);assert.equal(j.tokens.filter(t=>t.aLoss&&t.bLoss).length,bothCount);close(j.cells.reduce((s,c)=>s+c.probability,0),1);assert.equal(j.independent,bothCount*10===aCount*bCount);assert.equal(j.correlation===null,aCount===0||aCount===10||bCount===0||bCount===10);
 }
 const j=binaryJoint();assert.equal(j.correlation,0);assert.equal(j.independent,true);assert.deepEqual(j.cells.map(c=>c.count),[4,16,16,64]);
 for(const input of[{bothCount:-1},{bothCount:21},{bothCount:.5},{total:0},{total:10001},{aCount:101},{aCount:80,bCount:80,bothCount:59}])assert.throws(()=>binaryJoint(input));
});
test('nine authored relationship and allocation combinations match independent Fraction arithmetic',()=>{
 const variances={0:2400,4:3200,20:6400};
 for(const bothCount of[0,4,20])for(const weightA of[0,.5,1]){const m=dependenceModel({bothCount,weightA});assert.equal(m.initial,1000);assert.equal(m.allocation.a+m.allocation.b,1000);close(m.expectedLoss,40);close(m.variance,weightA===.5?variances[bothCount]:6400);close(m.exceedsProbability,weightA===.5?bothCount/100:.2);assert.equal(m.distribution.reduce((s,r)=>s+r.count,0),100);assert.equal(m.joint.tokens.filter(t=>t.aLoss).length,20);assert.equal(m.joint.tokens.filter(t=>t.bLoss).length,20);for(const o of m.outcomes){close(o.loss,o.lossA+o.lossB);close(o.loss+o.ending,1000);close(o.fraction,o.loss/200);assert.equal(o.exceeds,o.loss>150);assert.equal(o.possible,o.count>0);}close(m.distribution.reduce((s,r)=>s+r.probability*r.loss,0),m.expectedLoss);assert.equal(m.frames.length,4);}
 assert.equal(dependenceModel({bothCount:0}).distribution.find(r=>r.loss===200).possible,false);assert.equal(dependenceModel({bothCount:0}).distribution.find(r=>r.loss===100).count,40);
 for(const input of[{bothCount:5},{weightA:.25},{weightA:NaN}])assert.throws(()=>dependenceModel(input));
});
test('zero linear correlation does not remove the nonlinear conditional relationship',()=>{
 for(const a of[-20,0,20]){const m=nonlinearExample(a);assert.equal(m.stats.correlation,0);assert.equal(m.independent,false);assert.equal(m.rows.filter(r=>r.selected).length,1);assert.equal(m.selected.a,a);assert.equal(m.conditionalB,1);assert.equal(m.marginalB,a===0?1/3:2/3);m.rows.forEach(r=>{close(r.x,(r.a+25)/50);close(r.y,(25-r.b)/50);});}
 assert.equal(linearCorrelation([1,1,1],[1,2,3]).correlation,null);assert.equal(linearCorrelation([1,2,3],[2,4,6]).correlation,1);assert.equal(linearCorrelation([1,2,3],[6,4,2]).correlation,-1);
 close(linearCorrelation([-1e100,0,1e100],[-1e100,0,1e100]).correlation,1);
 for(const input of[[],[[1],[1,2]],[[NaN],[1]],[[Infinity],[1]]])assert.throws(()=>linearCorrelation(...input));assert.throws(()=>nonlinearExample(10));
});
test('D adds exactly eight stable probability routes and no later registration',async()=>{
 const {readFileSync}=await import('node:fs');const c=readFileSync(new URL('../src/catalog.ts',import.meta.url),'utf8'),ids=[...c.matchAll(/id: "([^"]+)", bookId: "probability", readId: "([^"]+)"/g)];const expected=['averages-and-distributions','losses-and-liquidity','frequency-and-probability','conditional-evidence','samples-and-variation','intervals-and-prediction','association-and-causes','dependence-and-diversification'];assert.deepEqual(ids.map(m=>m[1]),expected);assert.deepEqual(ids.map(m=>m[2]),expected.map(id=>'probability/'+id));const intro=readFileSync(new URL('../src/content/probability/Intro.mdx',import.meta.url),'utf8');assert(intro.includes('01–08'));expected.forEach(id=>assert(intro.includes('#/probability/'+id)));assert.match(c,/id: "probability", categoryId: "money", volume: 8/);
});
