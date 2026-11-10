import{flybyGuidance,flybySpeedLimit}from'./flyby.mjs?v=8j';
import{getDestinations}from'./world.mjs?v=8j';
import{rotate,simulationStep}from'./navigation.mjs?v=8j';
export function createSurvey(mode='survey'){return{mode,index:mode==='solar'?3:0,visited:new Set(),assist:false,enabled:true,lastVisit:null,cruise:0,arrived:false,assistTarget:-1,assistMode:'approach',flyby:null,lastFlyby:null};}
export function nextDestination(s){s.index=(s.index+1)%getDestinations(s.mode).length;s.arrived=false;}
// Every assist exit hands over the effective speed, never the former cruise limit.
export function setCourseAssist(s,enabled,currentSpeed){s.assist=enabled;s.flyby=null;s.cruise=Math.max(0,currentSpeed);if(enabled){s.arrived=false;s.assistTarget=s.index;}return s.cruise;}
export function updateSurvey(s,n,targetSpeed,dt,manual,travelSeconds=dt){
 let released=false;if(manual&&s.assist){setCourseAssist(s,false,s.cruise);released=true;}
 const destinations=getDestinations(s.mode,n.simTime);let destination=destinations[s.index],delta=destination.position.map((x,i)=>x-n.position[i]),distance=Math.hypot(...delta);
 let stop=s.mode==='solar'?Math.max((destination.radius??0)*8,.02):10;
 const visit=s.mode==='solar'?stop*1.1:12;
 if(dt>0&&!(s.assist&&s.mode==='solar'&&s.assistMode==='flyby')&&distance<visit&&!s.visited.has(s.index)){
  s.visited.add(s.index);s.lastVisit=destination.name;
  if(s.mode!=='solar'&&s.visited.size<destinations.length){while(s.visited.has(s.index))nextDestination(s);destination=destinations[s.index];delta=destination.position.map((x,i)=>x-n.position[i]);distance=Math.hypot(...delta);stop=10;}
  else if(s.mode!=='solar'&&s.assist){s.assist=false;released=true;}
 }
 if(s.assist){
  if(s.assistTarget!==s.index){s.arrived=false;s.assistTarget=s.index;s.flyby=null;}
  if(dt===0&&travelSeconds===0){s.cruise=Math.min(s.cruise,targetSpeed);return{distance,destination,cruise:s.cruise,released:false,arrived:s.arrived};}
  if(s.mode==='solar'&&s.assistMode==='flyby'){
   const guide=flybyGuidance(s,n,destinations);
   if(guide.completed){s.visited.add(s.index);setCourseAssist(s,false,s.cruise);return{distance,destination,cruise:s.cruise,released:true,completed:true,phase:'complete',arrived:false};}
   const aim=guide.aim.map((x,i)=>x-n.position[i]),yaw=Math.atan2(aim[0],aim[2]),pitch=Math.atan2(aim[1],Math.hypot(aim[0],aim[2])),difference=Math.atan2(Math.sin(yaw-n.yaw),Math.cos(yaw-n.yaw)),turn=.9*dt*guide.steering;
   n.yaw+=Math.sign(difference)*Math.min(Math.abs(difference),turn);n.pitch+=Math.sign(pitch-n.pitch)*Math.min(Math.abs(pitch-n.pitch),turn);
   const forward=rotate([0,0,1],n.yaw,n.pitch),alignment=forward.reduce((sum,x,i)=>sum+x*aim[i],0)/Math.max(Math.hypot(...aim),1e-12),turnGain=Math.max(0,Math.min(1,(alignment-.05)/.9))**2,desired=Math.min(targetSpeed,guide.limit)*turnGain,change=Math.max(.2,Math.min(6,targetSpeed*.75))*dt;
   s.cruise=Math.min(targetSpeed,s.cruise+Math.max(-change,Math.min(change,desired-s.cruise)));s.cruise=flybySpeedLimit(n.position,forward,s.cruise,travelSeconds,destinations);
   return{distance,destination,cruise:s.cruise,released:false,arrived:false,alignment,...guide};
  }
  if(s.mode==='solar'&&distance<=stop*1.1)s.arrived=true;
  if(distance>stop*1.3)s.arrived=false;
  if(!s.arrived&&distance>1e-10){const yaw=Math.atan2(delta[0],delta[2]),pitch=Math.atan2(delta[1],Math.hypot(delta[0],delta[2])),difference=Math.atan2(Math.sin(yaw-n.yaw),Math.cos(yaw-n.yaw)),turn=.9*dt;n.yaw+=Math.sign(difference)*Math.min(Math.abs(difference),turn);n.pitch+=Math.sign(pitch-n.pitch)*Math.min(Math.abs(pitch-n.pitch),turn);}
  const forward=rotate([0,0,1],n.yaw,n.pitch),alignment=forward.reduce((sum,x,i)=>sum+x*delta[i],0)/Math.max(distance,1e-12),turnGain=Math.max(0,Math.min(1,(alignment-.05)/.9))**2;
  const desired=s.arrived?0:Math.min(targetSpeed,Math.max(0,(distance-stop)*(s.mode==='solar'?1:.55)),targetSpeed*turnGain),acceleration=Math.max(.2,Math.min(6,targetSpeed*.75)),change=acceleration*dt;
  s.cruise=Math.min(targetSpeed,s.cruise+Math.max(-change,Math.min(change,desired-s.cruise)));
  // Bound travel by the remaining standoff even on a long frame.
  if(travelSeconds>0)s.cruise=Math.min(s.cruise,Math.max(0,distance-stop)/simulationStep(travelSeconds,s.mode));
  if(s.arrived)s.cruise=0;
  return{distance,destination,cruise:s.cruise,released:false,alignment,arrived:s.arrived};
 }
 return{distance,destination,cruise:released?s.cruise:targetSpeed,released,arrived:false};
}
