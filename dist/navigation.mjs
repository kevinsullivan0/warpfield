export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function rotate(d,yaw,pitch){const c=Math.cos(pitch),s=Math.sin(pitch),x=d[0],y=c*d[1]+s*d[2],z=-s*d[1]+c*d[2];return[Math.cos(yaw)*x+Math.sin(yaw)*z,y,-Math.sin(yaw)*x+Math.cos(yaw)*z];}
export function unrotate(d,yaw,pitch){const x=Math.cos(yaw)*d[0]-Math.sin(yaw)*d[2],z=Math.sin(yaw)*d[0]+Math.cos(yaw)*d[2];return[x,Math.cos(pitch)*d[1]-Math.sin(pitch)*z,Math.sin(pitch)*d[1]+Math.cos(pitch)*z];}
const norm=v=>{const m=Math.hypot(...v)||1;return v.map(x=>x/m)},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function createNavigation(){return{yaw:0,pitch:0,lookYaw:0,lookPitch:0,externalLookYaw:0,externalLookPitch:0,orbitYaw:.12,orbitPitch:.06,distance:6,fov:60,position:[0,0,0],trail:[[0,0]],trailTime:0,simTime:0,distanceFlown:0,focus:'ship',focusPoint:[0,0,0],panOffset:[0,0,0],autoFrame:false,minDistance:1.6,maxDistance:80};}
export function centerView(n,external){if(external){n.externalLookYaw=n.externalLookPitch=0;}else n.lookYaw=n.lookPitch=0;}
export function resetHeading(n){n.yaw=n.pitch=0;}
export const simulationStep=(seconds,scene)=>seconds*(scene==='solar'?299792.458/1000000:1);
export function releaseCamera(n){if(n.focus==='ship')n.focusPoint=[...n.position];n.focus='fixed';}
export function followShip(n){n.focus='ship';n.panOffset=[0,0,0];n.minDistance=1.6;n.maxDistance=80;n.distance=clamp(n.distance,1.6,80);}
export function lookDelta(n,dx,dy,external,orbit=false){if(external&&orbit){n.orbitYaw-=dx;n.orbitPitch=clamp(n.orbitPitch-dy,-1.4,1.4);}else{const yaw=external?'externalLookYaw':'lookYaw',pitch=external?'externalLookPitch':'lookPitch';n[yaw]+=dx;n[pitch]=clamp(n[pitch]-dy,-Math.PI/2,Math.PI/2);}}
export function updateNavigation(n,keys,dt,external,speed){
 const has=(...names)=>names.some(k=>keys.has(k)),sign=(positive,negative)=>Number(has(...positive))-Number(has(...negative));
 const turn=.65*dt,look=1.1*dt;n.yaw+=sign(['d','arrowright'],['a','arrowleft'])*turn;n.pitch=clamp(n.pitch+sign(['w','arrowup'],['s','arrowdown'])*turn,-1.5,1.5);
 const dx=sign(['l'],['j'])*look,dy= -sign(['i'],['k'])*look;lookDelta(n,dx,dy,external,external&&keys.has('shift'));
 if(external){if(has('[',']'))n.autoFrame=false;n.distance=clamp(n.distance*Math.exp(sign([']'],['['])*dt),n.minDistance,n.maxDistance);}n.fov=clamp(n.fov+sign(['.'],[','])*dt*30,25,110);
 const d=rotate([0,0,1],n.yaw,n.pitch);for(let i=0;i<3;i++)n.position[i]+=d[i]*speed*dt;n.distanceFlown+=Math.abs(speed)*dt;
 n.trailTime+=dt;if(n.trailTime>.25){n.trailTime=0;n.trail.push([n.position[0],n.position[2]]);if(n.trail.length>128)n.trail.shift();}
}
export function bridgeCamera(n){return{eye:[0,0,0],right:rotate([1,0,0],n.lookYaw,n.lookPitch),up:rotate([0,1,0],n.lookYaw,n.lookPitch),forward:rotate([0,0,1],n.lookYaw,n.lookPitch)};}
export function externalCamera(n){
 const focus=(n.focus==='ship'?n.position:n.focusPoint).map((x,i)=>x+(n.panOffset?.[i]??0)),offset=[Math.sin(n.orbitYaw)*Math.cos(n.orbitPitch)*n.distance,Math.sin(n.orbitPitch)*n.distance,-Math.cos(n.orbitYaw)*Math.cos(n.orbitPitch)*n.distance],eyeWorld=focus.map((x,i)=>x+offset[i]),base=norm(offset.map(x=>-x)),right=norm(cross([0,1,0],base)),up=cross(base,right),pan=rotate([0,0,1],n.externalLookYaw,n.externalLookPitch),rpan=rotate([1,0,0],n.externalLookYaw,n.externalLookPitch),upan=rotate([0,1,0],n.externalLookYaw,n.externalLookPitch),basis=p=>[0,1,2].map(i=>right[i]*p[0]+up[i]*p[1]+base[i]*p[2]);
 return{eye:unrotate(eyeWorld.map((x,i)=>x-n.position[i]),n.yaw,n.pitch),forward:unrotate(basis(pan),n.yaw,n.pitch),right:unrotate(basis(rpan),n.yaw,n.pitch),up:unrotate(basis(upan),n.yaw,n.pitch)};
}
export function viewDirection(n,external){const d=external?externalCamera(n).forward:bridgeCamera(n).forward;return rotate(d,n.yaw,n.pitch);}
export function heading(d){return(Math.atan2(d[0],d[2])*180/Math.PI+360)%360;}

// Aim only the viewing direction; the current ship pose and observer stay fixed.
export function lookAtPoint(n,external,point){
 const camera=external?externalCamera({...n,externalLookYaw:0,externalLookPitch:0}):{eye:[0,0,0],right:[1,0,0],up:[0,1,0],forward:[0,0,1]},delta=unrotate(point.map((x,i)=>x-n.position[i]),n.yaw,n.pitch).map((x,i)=>x-camera.eye[i]),length=Math.hypot(...delta);if(length<1e-12)return;
 const dot=a=>a.reduce((sum,x,i)=>sum+x*delta[i],0),yaw=Math.atan2(dot(camera.right),dot(camera.forward)),pitch=clamp(Math.asin(clamp(dot(camera.up)/length,-1,1)),-1.5,1.5);
 if(external){n.externalLookYaw=yaw;n.externalLookPitch=pitch;}else{n.lookYaw=yaw;n.lookPitch=pitch;}
}

export function panCamera(n,dx,dy){const c=externalCamera(n),right=rotate(c.right,n.yaw,n.pitch),up=rotate(c.up,n.yaw,n.pitch);n.panOffset=(n.panOffset??[0,0,0]).map((x,i)=>x-dx*right[i]+dy*up[i]);n.autoFrame=false;}
export function frameBubble(n,speed){followShip(n);n.panOffset=[0,0,0];n.autoFrame=true;const direction=viewDirection(n,false);n.orbitYaw=Math.atan2(-direction[0],direction[2]);n.orbitPitch=-Math.asin(clamp(direction[1],-1,1));n.externalLookYaw=n.externalLookPitch=0;n.distance=6*(1+Math.max(0,speed));n.maxDistance=Math.max(80,n.distance*4);n.fov=80;}
export function updateFraming(n,speed,dt){if(!n.autoFrame||n.focus!=='ship')return;const target=6*(1+Math.max(0,speed));n.maxDistance=Math.max(80,target*4);n.distance+=(target-n.distance)*(1-Math.exp(-6*dt));}

export function speedIncrement(speed,scene,fast=false){if(fast)return 5;if(scene==='solar'&&speed<.1)return speed<.001?.00001:speed<.01?.0001:.001;return speed>=4?1:.1;}
