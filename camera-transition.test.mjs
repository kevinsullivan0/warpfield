import assert from 'node:assert/strict';
import{createNavigation,bridgeCamera,externalCamera,frameBubble,rotate,viewDirection}from'./dist/navigation.mjs';
const mod=await import('./dist/camera-transition.mjs').catch(()=>({}));
assert.equal(typeof mod.createViewTransition,'function','smooth view transition is missing');
const{createViewTransition,sampleViewTransition,aimBridge}=mod;
const error=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
const n=createNavigation();n.yaw=.9;n.pitch=.4;n.lookYaw=1.2;n.lookPitch=-.6;const initial=structuredClone(n),inside=bridgeCamera(n),direction=viewDirection(n,false),startFov=n.fov;frameBubble(n,50);const outside=externalCamera(n),t=createViewTransition(n,inside,startFov);
let prev=0;
for(let i=0;i<=60;i++){const p=sampleViewTransition(t,n,outside,80,i/60*1.2);const d=Math.hypot(...p.camera.eye);assert.ok(d>=prev-1e-9&&d<=306+1e-9);prev=d;assert.ok(error(rotate(p.camera.forward,n.yaw,n.pitch),direction)<1e-12,'bearing must remain constant throughout the glide');const c=p.camera;for(const v of [c.forward,c.right,c.up])assert.ok(Math.abs(Math.hypot(...v)-1)<1e-12);assert.ok(Math.abs(c.right.reduce((s,x,j)=>s+x*c.up[j],0))<1e-12);if(i===0){assert.ok(error(c.eye,inside.eye)<1e-12);assert.equal(p.fov,startFov);}if(i===60){assert.ok(error(c.eye,outside.eye)<1e-12);assert.equal(p.done,true);assert.equal(p.fov,80);}}
// Reverse from a rendered intermediate pose, with a moving ship and a new orientation.
const mid=sampleViewTransition(t,n,outside,80,.43);aimBridge(n,mid.camera);const back=createViewTransition(n,mid.camera,mid.fov),b0=sampleViewTransition(back,n,bridgeCamera(n),60,0);assert.ok(error(b0.camera.eye,mid.camera.eye)<1e-12);assert.ok(error(b0.camera.forward,mid.camera.forward)<1e-12);
n.position=[1e5,30,400];const end=sampleViewTransition(back,n,bridgeCamera(n),60,1.2);assert.ok(error(end.camera.eye,[0,0,0])<1e-12);assert.ok(error(rotate(end.camera.forward,n.yaw,n.pitch),direction)<1e-12);assert.equal(n.yaw,initial.yaw);assert.equal(n.pitch,initial.pitch);
// Returning from an independently orbited observer retains its current direction.
n.orbitYaw=2.3;n.orbitPitch=-.8;n.externalLookYaw=.5;const orbit=externalCamera(n),orbitDirection=rotate(orbit.forward,n.yaw,n.pitch);aimBridge(n,orbit);assert.ok(error(viewDirection(n,false),orbitDirection)<1e-12);
console.log('PASS: eased endpoints, preserved bearing, orthonormal frames, reversal, moving ship and orbited return');

for(const pose of [[3.1,1.4,2.5,1.3],[-2.8,-1.4,-3,-1.5],[0,0,0,Math.PI/2]]){
 const n=createNavigation();[n.yaw,n.pitch,n.lookYaw,n.lookPitch]=pose;const source=bridgeCamera(n),dir=viewDirection(n,false);frameBubble(n,0);const target=externalCamera(n),t=createViewTransition(n,source,60);
 for(let i=0;i<=20;i++){const {camera:c}=sampleViewTransition(t,n,target,80,i*.06);assert.ok(error(rotate(c.forward,n.yaw,n.pitch),dir)<1e-12);assert.ok([...c.eye,...c.forward,...c.right,...c.up].every(Number.isFinite));}
}
console.log('PASS: wrapped headings, large roll differences and pole-facing transitions');
