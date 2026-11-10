import assert from 'node:assert/strict';
let traceOptical;try{({traceOptical}=await import('./dist/spatial.mjs'))}catch{}
assert.equal(typeof traceOptical,'function','external optical tracer missing');
for(const v of[0,.5,2,10,50]){
 const forward=traceOptical([0,0,0],[0,0,1],v);assert.ok(forward.escaped);assert.ok(Math.abs(Math.exp(forward.logFrequency)/(1+v)-1)<.0001,`axial frequency at ${v}c`);assert.ok(forward.energyError<.0002);
}
for(const [origin,direction,v]of[[[0,0,-6],[.12,0,1],.5],[[.7,.3,-6],[0,0,1],2],[[.4,.2,-10],[.4,.1,.91],50],[[2,.5,-8],[-.15,0,1],10]]){
 const a=traceOptical(origin,direction,v),b=traceOptical(origin,direction,v,{spatialStep:.0175,maxStep:.012,maxSteps:4096});assert.ok(a.escaped&&b.escaped);const dot=a.direction.reduce((s,x,i)=>s+x*b.direction[i],0);assert.ok(Math.acos(Math.min(1,dot))<.0002,'outside convergence');assert.ok(a.energyError<.0005,'outside conserved energy');assert.ok(Math.abs(a.logFrequency-b.logFrequency)<.002,'frequency convergence');
}
const miss=traceOptical([0,0,6],[0,0,-1],2);assert.equal(miss.crossed,false,'front observer cannot trace back through a superluminal bubble behind it');assert.deepEqual(miss.direction,[0,0,-1]);
const flat=traceOptical([1,.2,-6],[.1,0,1],0);assert.ok(flat.escaped&&Math.abs(flat.logFrequency)<1e-9);
console.log('PASS: external rays, analytic 50c axial limit, energy, step convergence and causal miss');
const {exteriorEntry:farEntry}=await import('./dist/spatial.mjs');assert.ok(Math.abs(farEntry([0,0,-1e9],[0,0,1],50)-(1e9-3.2)/51)<1e-6,'distant axial entry must not lose the bubble radius to discriminant cancellation');
