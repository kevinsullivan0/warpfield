import assert from 'node:assert/strict';
const {sourceState,exteriorBodyHit,sphereSegment,sourceLogFrequency}=await import('./dist/solar-optics.mjs');
const axis=[0,1,0],sun={center:[0,0,10],velocity:[0,0,0],omega:0,radius:1};
const hit=exteriorBodyHit([0,0,0],[0,0,1],0,100,[sun],axis);assert.equal(hit.body,0);assert.ok(Math.abs(hit.time-9)<1e-10);assert.ok(Math.abs(hit.point[2]-9)<1e-10);
assert.equal(exteriorBodyHit([2,0,0],[0,0,1],0,100,[sun],axis).body,-1);
const orbit={...sun,omega:.01,velocity:[.1,0,0]},s=sourceState(orbit,3,axis);assert.ok(Math.abs(s.center[0]+10*Math.sin(.03))<1e-12);assert.ok(Math.abs(s.center[2]-10*Math.cos(.03))<1e-12);
const moving=exteriorBodyHit([0,0,0],[-.1/Math.sqrt(1.01),0,1/Math.sqrt(1.01)],2,100,[orbit],axis),past=sourceState(orbit,2+moving.time,axis);assert.equal(moving.body,0);assert.ok(Math.abs(Math.hypot(...moving.point.map((x,i)=>x-past.center[i]))-1)<1e-9,'exact circular emission event');
assert.equal(exteriorBodyHit([0,0,0],[0,0,1],0,100,[{...sun,center:[0,0,20]},sun],axis).body,1);
assert.ok(Math.abs(sphereSegment([-2,0,0],[4,0,0],1)-.25)<1e-12,'swept segment cannot skip tiny body');
assert.ok(Math.abs(sourceLogFrequency([0,0,1],Math.log(2),[0,0,0])+Math.log(2))<1e-12);assert.equal(sourceLogFrequency([0,0,1],0,[0,0,2]),-80);
const b=.3,K=2*(1+b);assert.ok(Math.abs(sourceLogFrequency([0,0,1],Math.log(2),[0,0,b])-(.5*Math.log(1-b*b)-Math.log(K)))<1e-12);
console.log('PASS: retarded static/circular sources, nearest opaque planet, swept sphere and timelike source-frame frequency');
const {solarFrame,solarSnapshot,SOLAR_SECONDS_PER_UNIT}=await import('./dist/solar-system.mjs');
const {traceSceneRay}=await import('./dist/scene-ray.mjs');
const current=solarSnapshot(1234),frame=solarFrame([.3,.2,149.5],.7,-.2,1234),earlier=solarSnapshot(1200);for(let i=0;i<9;i++){const s=sourceState(frame.bodies[i],34,frame.axis);const {rotate}=await import('./dist/navigation.mjs');const world=rotate(s.center,.7,-.2).map((x,j)=>x+[.3,.2,149.5][j]);assert.ok(Math.hypot(...world.map((x,j)=>x-earlier[i].position[j]))<1e-9);}
const earth=solarSnapshot()[3].position,earthFrame=solarFrame([earth[0],earth[1],earth[2]+8]);for(const v of[0,.5,2]){const q=traceSceneRay([0,0,-18],[0,0,1],v,{frame:earthFrame,hull:false,complete:true});assert.equal(q.face,103);assert.ok(q.t>9);assert.ok(Number.isFinite(q.logFrequency));}
const invalid=traceSceneRay([0,0,0],[0,0,1],50,{frame:solarFrame(),hull:false,complete:true});assert.equal(invalid.face,100);assert.equal(invalid.logFrequency,-80,'nearest non-timelike material is censored, never transparent');
console.log('PASS: rotated source epochs, complete curved finite-source rays, and opaque censorship of invalid material');
const {canonicalRay}=await import('./canonical-reference.mjs');const{profile}=await import('./dist/spatial.mjs');
for(const v of[.25,.5,.9]){
 const source={center:[0,0,0],velocity:[0,0,0],omega:0,radius:.3},frame={axis,bodies:[source]},origin=[0,0,-1.8],direction=[0,0,1],cpu=traceSceneRay(origin,direction,v,{frame,hull:false});
 const oracle=canonicalRay(origin,direction,v,{maxStep:.0002,surface:(o,d,a,b)=>{const f=u=>{const t=a+(b-a)*u,p=o.map((x,i)=>x+d[i]*u-(i===2?v*t:0));return p.reduce((s,x)=>s+x*x,0)-source.radius**2;};if(f(0)*f(1)>0)return{face:-1};let lo=0,hi=1;for(let j=0;j<40;j++){const mid=(lo+hi)/2;if(f(mid)>0)lo=mid;else hi=mid;}const t=(lo+hi)/2,point=o.map((x,i)=>x+d[i]*t);return{face:100,t,w:[0,0,-v*profile(Math.hypot(...point)).f]};}});
 assert.equal(cpu.face,100);assert.equal(oracle.face,100);assert.ok(Math.hypot(...cpu.p.map((x,i)=>x-oracle.p[i]))<1e-5);assert.ok(Math.abs(cpu.t-oracle.t)<1e-5);assert.ok(Math.abs(cpu.logFrequency-oracle.logFrequency)<1e-5);
}
console.log('PASS: curved finite-source emission events agree with independent canonical-momentum integration and bracketed surface roots');
const neptune=solarSnapshot()[8],distantFrame=solarFrame([0,0,129.6],0,0,0,[neptune.position[0],.02,neptune.position[2]-129.63]);assert.ok(Math.hypot(...distantFrame.bodies[8].cameraCenter.map((x,i)=>x-[0,-.02,.03][i]))<1e-8,'small camera-relative coordinates retain planetary precision far from the bubble');
