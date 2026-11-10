import assert from 'node:assert/strict';
let nav;try{nav=await import('./dist/navigation.mjs')}catch{}
assert.equal(typeof nav?.createNavigation,'function','navigation model is missing');
const n=nav.createNavigation();
nav.updateNavigation(n,new Set(['l']),1,false,0);
assert.equal(n.yaw,0,'looking must not steer the ship');assert.ok(n.lookYaw>.5);
nav.updateNavigation(n,new Set(['d']),1,false,2);
assert.ok(n.yaw>.5);assert.ok(n.position[0]>0&&n.position[2]>0,'travel follows ship heading');
const look=n.lookYaw,pos=[...n.position];nav.resetHeading(n);assert.equal(n.yaw,0);assert.equal(n.lookYaw,look);assert.deepEqual(n.position,pos);
nav.centerView(n,false);assert.equal(n.lookYaw,0);assert.equal(n.lookPitch,0);
const dir=nav.viewDirection(n,false);assert.ok(Math.abs(dir[2]-1)<1e-9);
nav.updateNavigation(n,new Set(['l','[']),1,true,0);assert.ok(n.externalLookYaw>1);assert.ok(n.distance<6);assert.equal(n.yaw,0);
const cam=nav.externalCamera(n);const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);assert.ok(Math.abs(dot(cam.right,cam.up))<1e-9);assert.ok(Math.abs(dot(cam.forward,cam.forward)-1)<1e-9);
nav.centerView(n,true);assert.equal(n.externalLookYaw,0);assert.equal(n.externalLookPitch,0);
const fov=n.fov;nav.updateNavigation(n,new Set(['.']),1,false,0);assert.ok(n.fov>fov);nav.updateNavigation(n,new Set(['[']),10,true,0);assert.equal(n.distance,1.6);
console.log('PASS: independent look/steering, travel direction, resets, orbit/zoom, orthonormal camera');

const {lookAtPoint,createNavigation,externalCamera,rotate}=await import('./dist/navigation.mjs');
for(const external of[false,true]){const n=createNavigation();n.position=[10,2,-8];n.yaw=.7;n.pitch=.2;n.orbitYaw=.4;n.focus='fixed';n.focusPoint=[4,1,8];const before=structuredClone(n),point=[-30,9,40];lookAtPoint(n,external,point);const c=external?externalCamera(n):{eye:[0,0,0],forward:rotate([0,0,1],n.lookYaw,n.lookPitch)},eye=rotate(c.eye,n.yaw,n.pitch).map((x,i)=>x+n.position[i]),f=rotate(c.forward,n.yaw,n.pitch),d=point.map((x,i)=>x-eye[i]),cos=f.reduce((a,x,i)=>a+x*d[i],0)/Math.hypot(...d);assert.ok(cos>.999999999);assert.deepEqual(n.position,before.position);assert.equal(n.yaw,before.yaw);assert.equal(n.pitch,before.pitch);assert.deepEqual(eye,external?rotate(externalCamera(before).eye,before.yaw,before.pitch).map((x,i)=>x+before.position[i]):before.position);}
console.log('PASS: look-at-target aims either camera without moving ship or outside observer');

const {panCamera,frameBubble,updateFraming}=await import('./dist/navigation.mjs');
{
 const n=createNavigation();n.yaw=.8;n.pitch=.2;const start=[...n.position];frameBubble(n,50);assert.ok(n.distance>=300,'high-speed framing must encompass the enlarged encounter cone');assert.ok(n.maxDistance>=n.distance);const before=externalCamera(n),forward=rotate(before.forward,n.yaw,n.pitch);panCamera(n,.5,.2);const after=externalCamera(n);assert.deepEqual(rotate(after.forward,n.yaw,n.pitch),forward,'screen-plane pan preserves bearing');assert.deepEqual(n.position,start);assert.equal(n.autoFrame,false);assert.notDeepEqual(after.eye,before.eye);frameBubble(n,2);assert.deepEqual(n.panOffset,[0,0,0]);assert.equal(n.autoFrame,true);const old=n.distance;updateFraming(n,50,.1);assert.ok(n.distance>old&&n.distance<306,'speed-aware zoom eases toward its new framing');
}
console.log('PASS: screen-plane pan, speed-aware framing and manual zoom ownership');

const {speedIncrement}=await import('./dist/navigation.mjs');assert.ok(speedIncrement(0,'solar')<.0001);assert.ok(speedIncrement(.001,'solar')<.001);assert.equal(speedIncrement(0,'survey'),.1);assert.equal(speedIncrement(.001,'solar',true),5);console.log('PASS: fine Solar keyboard steps and retained fast travel controls');

// Switching out of a turned/looked-around bridge must preserve its world bearing.
for(const pose of [[.8,.4,1.1,-.6],[-2.4,-.9,-1.7,.8],[3.1,1.4,2.5,1.3]]){
 const n=createNavigation();[n.yaw,n.pitch,n.lookYaw,n.lookPitch]=pose;n.position=[4,-2,9];n.focus='target';n.focusPoint=[30,10,-8];n.panOffset=[2,3,4];n.externalLookYaw=.7;n.externalLookPitch=-.3;
 const before=structuredClone(n),direction=nav.viewDirection(n,false);frameBubble(n,50);const actual=nav.viewDirection(n,true),camera=externalCamera(n),eye=rotate(camera.eye,n.yaw,n.pitch);
 assert.ok(Math.hypot(...actual.map((x,i)=>x-direction[i]))<1e-12,'outside must face the bridge look direction, including ship pitch and local look');
 assert.ok(eye.every((x,i)=>Math.abs(x+direction[i]*n.distance)<1e-10),'observer must sit behind the bridge look direction');
 for(const key of ['position','yaw','pitch','lookYaw','lookPitch','simTime','distanceFlown'])assert.deepEqual(n[key],before[key],'framing must preserve '+key);
 assert.equal(n.focus,'ship');assert.deepEqual(n.panOffset,[0,0,0]);
}
console.log('PASS: external framing inherits the bridge world bearing and preserves flight state');
