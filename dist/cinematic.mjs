import{rotate,unrotate,externalCamera,bridgeCamera}from'./navigation.mjs?v=8j';
export const TOUR_DURATION=120;
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)},mix=(a,b,t)=>a+(b-a)*t;
// One Solar world and one transport clock. Camera targets change; the observer never cuts.
export function sampleTour(seconds){
 const t=Math.max(0,Math.min(TOUR_DURATION,Number.isFinite(seconds)?seconds:0));
 const s={world:'solar',layout:false,fade:0,progress:clamp(t/TOUR_DURATION),speed:50,assist:true,target:3,camera:'bridge',orbit:t*.045,fov:65,title:'Take the helm',subtitle:'One continuous Solar flight. The ship follows a safe offset course.'};
 if(t<12){s.speed=mix(.5,3,ease(t/12));s.title='Starlight from the bridge';}
 else if(t<30){s.camera='bubble';s.title='Leave the bridge';s.subtitle='The observer glides around the ship and its bent sky.';s.fov=80;}
 else if(t<48){s.camera='planet';s.focus=3;s.fov=48;s.title='Earth, at true scale';s.subtitle='A continuous observer flight toward Earth. Ship and planet light share one model.';}
 else if(t<68){s.camera='bridge';s.title='Return to the helm';s.subtitle='The camera glides home while the ship continues its flight.';}
 else if(t<92){s.target=5;s.camera='planet';s.focus=5;s.fov=48;s.title='Toward Jupiter';s.subtitle='The observer travels ahead to Jupiter; the ship follows its own course.';}
 else{s.target=5;s.camera='bubble';s.fov=80;s.title=t<110?'Around the warp field':'The helm is yours';s.subtitle=t<110?'Speed-aware framing keeps the distorted sky in view.':'The observer keeps its pose when you take control. Exit whenever you like.';}
 return s;
}
function damp(value,target,velocity,dt,omega=2){if(dt===0)return[value,velocity];const d=value-target,temp=(velocity+omega*d)*dt,e=Math.exp(-omega*dt);return[target+(d+temp)*e,(velocity-omega*temp)*e];}
export function createTourCamera(n,external){const c=external?externalCamera(n):bridgeCamera(n),forward=rotate(c.forward,n.yaw,n.pitch);return{shipPosition:[...n.position],eye:rotate(c.eye,n.yaw,n.pitch).map((x,i)=>x+n.position[i]),velocity:[0,0,0],yaw:Math.atan2(forward[0],forward[2]),pitch:Math.asin(Math.max(-1,Math.min(1,forward[1]))),yawVelocity:0,pitchVelocity:0,fov:n.fov,fovVelocity:0,distance:Math.max(.001,n.distance),external};}
export function updateTourCamera(c,n,s,bodies,dt,speed){
 let focus,targetEye;
 const forward=rotate([0,0,1],n.yaw,n.pitch);
 if(s.camera==='planet'){const body=bodies[s.focus],radius=body.radius*5;focus=body.position;targetEye=focus.map((x,i)=>x+[Math.sin(s.orbit)*radius,radius*.2,-Math.cos(s.orbit)*radius][i]);}
 else if(s.camera==='bubble'){const radius=6*(1+speed),a=-n.yaw+s.orbit;focus=n.position;targetEye=focus.map((x,i)=>x+[Math.sin(a)*radius,radius*.16,-Math.cos(a)*radius][i]);}
 else{focus=n.position.map((x,i)=>x+forward[i]*20);targetEye=n.position;}
 for(let i=0;i<3;i++){
  if(s.camera==='bridge'&&dt>0){const shipVelocity=(n.position[i]-c.shipPosition[i])/dt,[offset,relativeVelocity]=damp(c.eye[i]-c.shipPosition[i],0,c.velocity[i]-shipVelocity,dt);c.eye[i]=n.position[i]+offset;c.velocity[i]=shipVelocity+relativeVelocity;}
  else [c.eye[i],c.velocity[i]]=damp(c.eye[i],targetEye[i],c.velocity[i],dt);
 }c.shipPosition=[...n.position];
 let direction=focus.map((x,i)=>x-c.eye[i]),length=Math.hypot(...direction);if(length<1e-9){direction=forward;length=1;}
 const yaw=Math.atan2(direction[0],direction[2]),targetYaw=c.yaw+Math.atan2(Math.sin(yaw-c.yaw),Math.cos(yaw-c.yaw)),targetPitch=Math.asin(Math.max(-1,Math.min(1,direction[1]/length)));
 [c.yaw,c.yawVelocity]=damp(c.yaw,targetYaw,c.yawVelocity,dt);[c.pitch,c.pitchVelocity]=damp(c.pitch,targetPitch,c.pitchVelocity,dt);[c.fov,c.fovVelocity]=damp(c.fov,s.fov,c.fovVelocity,dt);
 c.distance=Math.max(.001,length);const relative=c.eye.map((x,i)=>x-n.position[i]);c.external=Math.hypot(...relative)>.4;
 const right=[Math.cos(c.yaw),0,-Math.sin(c.yaw)],f=[Math.sin(c.yaw)*Math.cos(c.pitch),Math.sin(c.pitch),Math.cos(c.yaw)*Math.cos(c.pitch)],up=[-Math.sin(c.yaw)*Math.sin(c.pitch),Math.cos(c.pitch),-Math.cos(c.yaw)*Math.sin(c.pitch)],local=v=>unrotate(v,n.yaw,n.pitch);
 return{eye:local(relative),right:local(right),up:local(up),forward:local(f)};
}
export function releaseTourCamera(c,n){const f=[Math.sin(c.yaw)*Math.cos(c.pitch),Math.sin(c.pitch),Math.cos(c.yaw)*Math.cos(c.pitch)],distance=Math.max(.001,c.distance);n.focus='fixed';n.focusPoint=c.eye.map((x,i)=>x+f[i]*distance);n.panOffset=[0,0,0];n.autoFrame=false;n.distance=distance;n.minDistance=.0001;n.maxDistance=Math.max(80,distance*4);n.orbitYaw=Math.atan2(-f[0],f[2]);n.orbitPitch=-c.pitch;n.externalLookYaw=n.externalLookPitch=0;n.fov=c.fov;}
