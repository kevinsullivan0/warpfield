import assert from'node:assert/strict';
import{createNavigation,externalCamera,updateNavigation,rotate,centerView,releaseCamera,followShip,simulationStep}from'./dist/navigation.mjs';
let n=createNavigation(),a=externalCamera(n);n.yaw=1;n.pitch=.3;let b=externalCamera(n),worldForward=rotate(b.forward,n.yaw,n.pitch);assert.ok(Math.hypot(...a.forward.map((x,i)=>x-worldForward[i]))<1e-10,'steering must not rotate outside camera');
n=createNavigation();a=externalCamera(n);updateNavigation(n,new Set(['l']),.1,true,0);b=externalCamera(n);assert.deepEqual(a.eye,b.eye,'looking does not move observer');assert.notDeepEqual(a.forward,b.forward);const before=[n.orbitYaw,n.orbitPitch];centerView(n,true);assert.deepEqual([n.orbitYaw,n.orbitPitch],before,'center look preserves observer position');
releaseCamera(n);a=externalCamera(n);n.position=[0,0,20];b=externalCamera(n);assert.ok(Math.hypot(...a.eye.map((x,i)=>x-(b.eye[i]+n.position[i])))<1e-10,'released camera remains in world position');followShip(n);assert.equal(n.focus,'ship');
assert.ok(Math.abs(simulationStep(1,'solar')-299792.458/1000000)<1e-12,'one physical second of Solar transport');assert.equal(simulationStep(1,'survey'),1);
console.log('PASS: independent outside observer, shared look controls, stable centering/release and physical Solar clock');
