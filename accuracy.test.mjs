import assert from'node:assert/strict';import{traceOptical}from'./dist/spatial.mjs';import{canonicalRay}from'./canonical-reference.mjs';
const angle=(a,b)=>Math.atan2(Math.hypot(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]),a.reduce((s,x,i)=>s+x*b[i],0));
let maxAngle=0,maxLog=0,cases=0;
for(const v of[.5,1,2,5,10,50,100]){
 const transverse=traceOptical([0,0,0],[1,0,0],v);assert.ok(transverse.escaped);assert.ok(angle(transverse.direction,[1,0,0])<1e-9);assert.ok(Math.abs(transverse.logFrequency)<1e-9,'Clark Eq21: transverse no shift');
 const axial=traceOptical([0,0,0],[0,0,1],v);assert.ok(Math.abs(Math.exp(axial.logFrequency)/(1+v)-1)<2e-6,'Clark Eq26: head-on ratio1+v');
 for(const deg of[1,5,15,30,60,90,120,150,165]){const d=[Math.sin(deg*Math.PI/180),0,Math.cos(deg*Math.PI/180)],a=traceOptical([0,0,0],d,v),b=canonicalRay([0,0,0],d,v);assert.ok(a.escaped&&b.escaped,`escape ${v}/${deg}`);maxAngle=Math.max(maxAngle,angle(a.direction,b.direction));maxLog=Math.max(maxLog,Math.abs(a.logFrequency-b.logFrequency));cases++;if(deg<90)assert.ok(Math.atan2(a.direction[0],a.direction[2])>=deg*Math.PI/180-1e-8,'forward source angles cluster as Clark Fig1');}
}
for(const v of[.5,2,50])for(const deg of[-20,-5,0,5,20]){const origin=[.6,.25,-6],d=[Math.sin(deg*Math.PI/180),0,Math.cos(deg*Math.PI/180)],a=traceOptical(origin,d,v),b=canonicalRay(origin,d,v);assert.equal(a.escaped,b.escaped);if(a.escaped){maxAngle=Math.max(maxAngle,angle(a.direction,b.direction));maxLog=Math.max(maxLog,Math.abs(a.logFrequency-b.logFrequency));cases++;}}
const broadWall=traceOptical([0,0,0],[0,0,1],50,{sigma:1,maxSteps:20000});assert.ok(broadWall.escaped);assert.ok(Math.abs(Math.exp(broadWall.logFrequency)/51-1)<2e-6,'broad wall needs an asymptotic exterior cutoff');
assert.ok(maxAngle<2e-5);assert.ok(maxLog<2e-5);
console.log(JSON.stringify({check:'Published axial/transverse limits; independently formulated canonical oracle; speeds through100c',cases,maxAngleRad:maxAngle,maxLogFrequencyError:maxLog}));
