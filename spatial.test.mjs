import assert from 'node:assert/strict';import{trace}from'./dist/physics.mjs';
let traceSpatial;try{({traceSpatial}=await import('./dist/spatial.mjs'))}catch{}
assert.equal(typeof traceSpatial,'function','3D null-ray solver missing');
for(const a of [.2,1,2])for(const v of [0,.5,2,4]){const r=traceSpatial([0,0,0],[Math.sin(a),0,Math.cos(a)],v);const ref=trace(a,v);if(r.escaped&&ref.escaped){const angle=Math.atan2(r.direction[0],r.direction[2]);assert.ok(Math.abs(angle-ref.angle)<.0001);assert.ok(Math.abs(r.logFrequency-ref.logFrequency)<.001);}assert.ok(r.positions.every(Number.isFinite));}
const r=traceSpatial([-.6,.2,-2],[0,0,1],0);for(let i=0;i<r.positions.length;i+=3){assert.ok(Math.abs(r.positions[i]+.6)<1e-6);assert.ok(Math.abs(r.positions[i+1]-.2)<1e-6);}
const a=traceSpatial([-.6,.2,-2],[0,0,1],.5),b=traceSpatial([-.6,.2,-2],[0,0,1],.5,.012,2048);assert.ok(Math.abs(a.direction[0]-b.direction[0])<.0002);assert.ok(a.energyError<.0002);
console.log('PASS: full 3D rays agree with meridional solver, flat straight paths, off-center convergence and energy');
