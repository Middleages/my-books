import test from "node:test";import assert from "node:assert/strict";import {progressiveTax,events} from "../src/simulations/tax/taxModel.mjs";
test("가상 누진세 경계와 합계",()=>{for(const [amount,tax] of [[0,0],[100,10],[300,50],[400,80]]){const r=progressiveTax(amount);assert.equal(r.tax,tax);assert.equal(r.parts.reduce((s,p)=>s+p.base,0),amount);assert.equal(r.parts.reduce((s,p)=>s+p.tax,0),tax)}});
test("평균세율 분모 0과 유효성",()=>{assert.equal(progressiveTax(0).averageRate,null);assert.equal(progressiveTax(400).averageRate,.2);for(const n of [-1,Infinity,NaN])assert.throws(()=>progressiveTax(n),RangeError)});
test("사건 ID 유일",()=>assert.equal(new Set(events.map(e=>e.id)).size,events.length));
