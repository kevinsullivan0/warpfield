import assert from'node:assert/strict';import{createNavigation}from'./dist/navigation.mjs';
let api;try{api=await import('./dist/route.mjs')}catch{}
assert.equal(typeof api?.createSurvey,'function','survey model missing');let s=api.createSurvey(),n=createNavigation();s.assist=true;n.yaw=1;let a=api.updateSurvey(s,n,50,.1,false);assert.ok(n.yaw<1);assert.ok(a.cruise<=50);api.updateSurvey(s,n,50,.1,true);assert.equal(s.assist,false);
n.position=[0,0,115];api.updateSurvey(s,n,2,.1,false);assert.equal(s.visited.size,1);assert.equal(s.index,1);const before=s.index;api.nextDestination(s);assert.notEqual(before,s.index);
console.log('PASS: course assist, manual override, survey visit and destination cycling');

assert.equal(typeof api.setCourseAssist,'function','one course-assist transition must preserve actual speed');
{
 const s=api.createSurvey(),n=createNavigation();n.yaw=Math.PI;
 api.setCourseAssist(s,true,2);let a=api.updateSurvey(s,n,50,.1,false);
 assert.ok(a.cruise<2,'decelerate when the target is behind rather than accelerate away');
 const held=a.cruise;assert.equal(api.setCourseAssist(s,false,held),held);assert.equal(s.assist,false);
 api.setCourseAssist(s,true,held);a=api.updateSurvey(s,n,50,.1,true);assert.equal(s.assist,false);assert.equal(a.released,true);assert.equal(a.cruise,held,'steering takeover preserves actual assisted speed');
}
{
 const s=api.createSurvey('solar'),n=createNavigation();n.position=[.2,0,149.6-.2];n.yaw=2;api.setCourseAssist(s,true,0);const old=n.yaw;
 const a=api.updateSurvey(s,n,.1,.1,false);assert.notEqual(n.yaw,old,'assist still steers within one bubble radius');assert.ok(a.cruise>=0&&a.cruise<=.1);
 s.enabled=false;api.updateSurvey(s,n,.1,.1,false);assert.equal(s.assist,true,'hiding guides does not disable flight assist');
}
{
 const s=api.createSurvey('solar'),n=createNavigation();n.position=[0,0,149.6-.3];api.setCourseAssist(s,true,0);
 for(let i=0;i<1000;i++){const a=api.updateSurvey(s,n,50,.02,false);n.position[2]+=a.cruise*.02*.299792458;}
 assert.ok(Math.abs(n.position[2]-149.6)>.049,'approach stops outside the Earth standoff');assert.ok(s.cruise<.0001,'arrival holds instead of repeatedly accelerating');
}
console.log('PASS: speed-preserving takeover, turn throttling, near-planet steering and stable arrival');
{
 const s=api.createSurvey('solar'),n=createNavigation();n.position=[0,0,149.6-.3];api.setCourseAssist(s,true,50);const realSeconds=3,a=api.updateSurvey(s,n,50,.25,false,realSeconds),travel=a.cruise*realSeconds*.299792458;assert.ok(travel<=.3-.051024+1e-10,'a long frame must not cross the planetary standoff');
}
{
 const s=api.createSurvey(),n=createNavigation();api.setCourseAssist(s,true,2);const a=api.updateSurvey(s,n,0,0,false);assert.equal(a.cruise,0,'a zero speed limit must work even with the clock held');
}
{
 const s=api.createSurvey('solar'),n=createNavigation();n.position=[0,0,149.6-.052];api.setCourseAssist(s,true,0);api.updateSurvey(s,n,2,.1,false);assert.equal(s.arrived,true);s.cruise=2;assert.equal(api.updateSurvey(s,n,2,0,false,0).cruise,2,'paused optical snapshots remain selectable at a held Solar standoff');
}
