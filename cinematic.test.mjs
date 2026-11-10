import assert from'node:assert/strict';
import{sampleTour,TOUR_DURATION,createTourCamera,updateTourCamera,releaseTourCamera}from'./dist/cinematic.mjs';
import{createNavigation,externalCamera,rotate}from'./dist/navigation.mjs';import{getDestinations}from'./dist/world.mjs';
for(let t=0;t<TOUR_DURATION;t+=.05){const s=sampleTour(t);assert.equal(s.world,'solar');assert.equal(s.fade,0,'the tour must not hide scene cuts');assert.equal(s.layout,false);assert.ok(s.speed>=0&&s.speed<=50);}
const n=createNavigation();n.position=[0,0,129.6];const c=createTourCamera(n,false),before=[...c.eye];updateTourCamera(c,n,sampleTour(70),getDestinations('solar'),0,2);assert.deepEqual(c.eye,before,'held tour cannot move the camera');let previous=[...c.eye];
for(let t=0;t<TOUR_DURATION;t+=.05){updateTourCamera(c,n,sampleTour(t),getDestinations('solar'),.05,2);assert.ok([...c.eye,c.yaw,c.pitch,c.fov].every(Number.isFinite));assert.ok(Math.hypot(...c.eye.map((x,i)=>x-previous[i]))<80,'observer advances continuously instead of teleporting');previous=[...c.eye];}
const eye=[...c.eye],f=[Math.sin(c.yaw)*Math.cos(c.pitch),Math.sin(c.pitch),Math.cos(c.yaw)*Math.cos(c.pitch)];releaseTourCamera(c,n);const out=externalCamera(n),worldEye=rotate(out.eye,n.yaw,n.pitch).map((x,i)=>x+n.position[i]),forward=rotate(out.forward,n.yaw,n.pitch);assert.ok(Math.hypot(...worldEye.map((x,i)=>x-eye[i]))<1e-8);assert.ok(Math.hypot(...forward.map((x,i)=>x-f[i]))<1e-8,'manual takeover keeps the received viewing direction');
console.log('PASS: uninterrupted Solar showcase, held-time camera, continuous observer motion and exact camera handoff');
{
 const n=createNavigation(),c=createTourCamera(n,false),s=sampleTour(5);for(let i=0;i<400;i++){n.position[2]+=.03;updateTourCamera(c,n,s,getDestinations('solar'),.05,2);}assert.ok(Math.hypot(...c.eye.map((x,i)=>x-n.position[i]))<.001,'a moving bridge target must not leave a permanent trailing observer');assert.equal(c.external,false);
}
