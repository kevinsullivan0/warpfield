import assert from'node:assert/strict';import{emissionAllowed,shellEmissionTimes}from'./dist/world.mjs';
assert.equal(emissionAllowed([0,0,-10],.9,6.6931323),false,'interior source event must be dark');
assert.deepEqual(shellEmissionTimes([0,0,0],[0,0,1],[0,0,6],1).map(x=>+x.toFixed(1)),[8.2],'older far-side emission must survive near-side switch-off');
for(const v of[.5,2,50])for(const x of[0,5,12])for(const z of[-100,-2,10,100])for(const t of[0,1,20])if(emissionAllowed([x,0,z],v,t))assert.ok(Math.hypot(x,z+v*t)>=10.3-1e-8,'all emitting surfaces are outside 8.1 R');
console.log('PASS: pre-encounter emission, both transparent shell roots, exterior-source guarantee');
