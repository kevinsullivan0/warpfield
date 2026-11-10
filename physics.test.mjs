import assert from 'node:assert/strict';
let trace;
try { ({trace}=await import('./dist/physics.mjs')); } catch {}
assert.equal(typeof trace,'function','null-ray solver is not implemented');
for(const a of [0,.3,1,2,Math.PI]) {
 const r=trace(a,0);assert.ok(r.escaped);assert.ok(Math.abs(r.angle-a)<1e-6);assert.ok(Math.abs(r.logFrequency)<1e-6);
}
for(const v of [.5,.9,2,4]) for(const a of [.1,.5,1,1.8,2.6]) {
 const r=trace(a,v,.012,2048), fine=trace(a,v,.006,4096);
 assert.ok(Number.isFinite(r.angle)&&Number.isFinite(r.logFrequency));
 if(r.escaped&&fine.escaped){assert.ok(Math.abs(r.angle-fine.angle)<.015,`convergence ${v},${a}`);assert.ok(Math.abs(r.invariant-1)<.004,`conserved energy ${v},${a}: ${r.invariant}`);}
}
assert.ok(Math.abs(trace(0,2).angle)<1e-5,'forward axial ray stays axial');
assert.equal(trace(Math.PI,2).escaped,false,'rear axial past ray is trapped at superluminal speed');
for(const v of [.25,.5,.9,2,4]) assert.ok(Math.abs(Math.exp(trace(0,v).logFrequency)-(1+v))/(1+v)<.00003,'forward axial frequency');
for(const v of [.25,.5,.9]) assert.ok(Math.abs(Math.exp(trace(Math.PI,v).logFrequency)-(1-v))<.0001,'rear axial frequency');
for(const a of [.3,1,2]) {const plus=trace(a,.5),minus=trace(-a,.5);assert.ok(Math.abs(plus.angle+minus.angle)<1e-6);assert.ok(Math.abs(plus.logFrequency-minus.logFrequency)<1e-6);}
console.log('PASS: flat-space identity, axial rays, finite results, conserved energy and step convergence');
