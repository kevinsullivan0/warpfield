import assert from'node:assert/strict';import{createNavigation,rotate,externalCamera}from'./dist/navigation.mjs';import{markerProjection,unrotate,attitudeTriangles}from'./dist/hud.mjs';import{buildField}from'./dist/scene.mjs';import{solarBodies,getDestinations,SOLAR_KM_PER_R}from'./dist/world.mjs';
for(const yaw of[0,.4,2])for(const pitch of[-.5,0,.8]){const d=[.2,.7,.3],r=unrotate(rotate(d,yaw,pitch),yaw,pitch);assert.ok(Math.hypot(...r.map((x,i)=>x-d[i]))<1e-12);const n=createNavigation();n.orbitYaw=yaw;n.orbitPitch=pitch;const c=externalCamera(n);assert.ok(Math.abs(c.eye.reduce((s,x,i)=>s+x*c.right[i],0))<1e-12);const p=markerProjection([0,0,100],n,false,1280,800);assert.equal(p.x,640);assert.equal(p.y,400);}
assert.ok(markerProjection([1,2,-100],createNavigation(),false,1280,800).edge);assert.notDeepEqual(attitudeTriangles(0,0)[0].points,attitudeTriangles(.5,.3)[0].points);
const field=buildField(50,1);let center=[0,0,0];for(let i=0;i<1728*7;i+=7){assert.ok(Math.abs(Math.hypot(field[i],field[i+1],field[i+2])-1)<1e-6);center=center.map((s,j)=>s+field[i+j]);}assert.ok(Math.hypot(...center)<1e-6,'coordinate shell centered at ship origin');
assert.equal(getDestinations('survey').length,6);assert.equal(solarBodies.length,9);assert.equal(solarBodies[3].radius*SOLAR_KM_PER_R,6378);assert.ok(Math.abs(Math.hypot(...solarBodies[8].position)-4515)<1e-8);assert.ok(getDestinations('survey').at(-1).position[2]>20000);
console.log('PASS: centered shell/camera, 3D attitude, unbent target markers, Solar System common size/distance scale and distant route');

const {courseDirections}=await import('./dist/hud.mjs');
{
 const n=createNavigation();n.lookYaw=1.5;const target=[100,30,100],g=courseDirections(n,target);assert.ok(g.yaw>0&&g.pitch>0);assert.match(g.text,/Right/);assert.match(g.text,/climb/);n.lookYaw=-2;assert.deepEqual(courseDirections(n,target),g,'steering instruction depends on ship, not look direction');
 n.lookYaw=0;const p=markerProjection([-20,0,-100],n,false,1280,720,{left:245,right:860,top:230,bottom:515});assert.ok(p.x>=245&&p.x<=860&&p.y>=230&&p.y<=515);assert.equal(p.behind,true);assert.equal(p.edge,true);
 const centered=markerProjection(n.position,n,false,1280,720);assert.ok(Number.isFinite(centered.x)&&Number.isFinite(centered.y));
}
console.log('PASS: ship-relative steering directions and visible behind-target arrows');
