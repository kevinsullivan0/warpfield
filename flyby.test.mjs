import assert from'node:assert/strict';
import{createSurvey,setCourseAssist,updateSurvey}from'./dist/route.mjs';
import{createNavigation,updateNavigation,simulationStep,rotate}from'./dist/navigation.mjs';
import{getDestinations}from'./dist/world.mjs';
const norm=a=>{const r=Math.hypot(...a);return a.map(x=>x/r)};
function run({index=3,limit=2,speed=0,offset=[0,0,-20],yaw=0,dt=.05,long=false}={}){
 const s=createSurvey('solar'),n=createNavigation(),body=getDestinations('solar')[index];s.index=index;s.assistMode='flyby';n.position=body.position.map((x,i)=>x+offset[i]);n.yaw=yaw;setCourseAssist(s,true,speed);
 const exclusion=4+body.radius,startedOutside=Math.hypot(...offset)>exclusion;let closest=Infinity,finished=false,previousSpeed=speed,previousHeading=null;
 for(let i=0;i<20000;i++){
  const realDt=long&&i%71===0?.8:dt,a=updateSurvey(s,n,limit,Math.min(realDt,.25),false,realDt),b=getDestinations('solar',n.simTime)[index],r=n.position.map((x,j)=>x-b.position[j]);closest=Math.min(closest,Math.hypot(...r));
  if(a.completed){assert.equal(s.assist,false);assert.equal(a.cruise,previousSpeed,'completion preserves actual speed');assert.deepEqual([n.yaw,n.pitch],previousHeading,'completion preserves heading');finished=true;break;}
  updateNavigation(n,new Set(),Math.min(realDt,.25),false,a.cruise*simulationStep(realDt,'solar')/Math.min(realDt,.25));n.simTime+=simulationStep(realDt,'solar');previousSpeed=a.cruise;previousHeading=[n.yaw,n.pitch];
 }
 assert.ok(finished,'flyby must finish and release');if(startedOutside)assert.ok(closest>=exclusion-1e-6,'pass must not enter the requested exclusion sphere: '+closest+' vs '+exclusion);assert.ok(s.lastFlyby?.closest>=exclusion-1e-5||!startedOutside);assert.ok(previousSpeed>0,'release into flight rather than stopping');return{s,n,closest};
}
for(const args of[{},{limit:50,speed:50},{offset:[12,2,-18],yaw:2,limit:10},{index:5,offset:[-8,4,-22],limit:3,long:true},{index:0,offset:[0,0,-30],limit:10},{offset:[0,0,-.05],limit:2}])run(args);
{
 const s=createSurvey('solar'),n=createNavigation();s.assistMode='flyby';n.position=[0,0,129.6];setCourseAssist(s,true,1);updateSurvey(s,n,2,.05,false);const plan=structuredClone(s.flyby);s.cruise=2;assert.equal(updateSurvey(s,n,2,0,false,0).cruise,2);assert.deepEqual(s.flyby,plan,'held snapshot does not progress the planned pass');const a=updateSurvey(s,n,2,.05,true);assert.equal(a.released,true);assert.equal(a.cruise,2);
}
console.log('PASS: safe flybys, recovery, long-frame bounds, paused snapshots and continuous manual handoff');
