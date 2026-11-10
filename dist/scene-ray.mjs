import{traceShipRay,advanceShipRay,intersectHull,hullFaces,HULL_RADIUS,hullFrequency}from'./ship.mjs?v=8j';
import{profile,exteriorEntry}from'./spatial.mjs?v=8j';
import{sourceState,sourceLogFrequency,sphereSegment,exteriorBodyHit}from'./solar-optics.mjs?v=8j';
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),sub=(a,b)=>a.map((x,i)=>x-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],clamp=x=>Math.max(0,Math.min(1,x));
export function solarSurfaceEvent(q,v,frame,body){const source=sourceState(frame.bodies[body],q.t,frame.axis),w=source.velocity.map((x,i)=>x-(i===2?v*profile(Math.hypot(...q.p)).f:0));return{...q,face:100+body,logFrequency:sourceLogFrequency(q.n,q.l,w),escaped:false};}
export function solarExteriorEvent(q,v,frame,maxTime=1e9,layout=false){
 const origin=q.p.map((x,i)=>x-(i===2?v*q.t:0)),hit=exteriorBodyHit(origin,q.n,q.t,maxTime,frame.bodies,frame.axis,layout);if(hit.body<0)return null;
 const time=q.t+hit.time,point=hit.point.map((x,i)=>x+(i===2?v*time:0)),source=sourceState(frame.bodies[hit.body],layout?0:time,frame.axis);
 return{p:point,n:q.n,l:q.l,t:time,face:100+hit.body,logFrequency:layout?0:sourceLogFrequency(q.n,q.l,source.velocity),escaped:false};
}
export function solarStepCandidate(q,next,v,frame){let best={body:-1,fraction:Infinity};for(let i=0;i<frame.bodies.length;i++){const a=sourceState(frame.bodies[i],q.t,frame.axis),b=sourceState(frame.bodies[i],next.t,frame.axis),p=q.p.map((x,j)=>x-a.center[j]-(j===2?v*q.t:0)),end=next.p.map((x,j)=>x-b.center[j]-(j===2?v*next.t:0)),fraction=sphereSegment(p,sub(end,p),frame.bodies[i].radius);if(fraction<best.fraction)best={body:i,fraction};}return best;}
export function traceSceneRay(origin,direction,v,{frame=null,hull=true,layout=false,complete=false,stepScale=1,maxSteps=4096}={}){
 if(!frame&&hull)return traceShipRay(origin,direction,v,{stepScale,maxSteps});
 const m=Math.hypot(...direction),n=direction.map(x=>x/m),K=1+v*(1-profile(Math.hypot(...origin)).f)*n[2];let q={p:[...origin],n,l:0,t:0};
 if(v<.00001){let event=frame?solarExteriorEvent(q,0,frame,1e9,layout):null;if(hull){const reach=Math.max(400,Math.hypot(...origin)*2+2),hit=intersectHull(origin,n.map(x=>x*reach));if(hit.face>=0&&(!event||reach*hit.t<event.t))event={...q,p:origin.map((x,i)=>x+n[i]*reach*hit.t),t:reach*hit.t,face:hit.face,logFrequency:0,escaped:false};}return event??{...q,face:-1,logFrequency:0,escaped:true};}
 const entry=exteriorEntry(origin,n,v);if(Math.hypot(...origin)>=3.2&&frame){const hit=solarExteriorEvent(q,v,frame,entry>=0?entry:1e9);if(hit)return hit;}
 if(entry<0)return{...q,face:-1,logFrequency:0,escaped:true};if(entry>0){q.t=entry+1e-4/(1+v);q.p=q.p.map((x,i)=>x+(n[i]+(i===2?v:0))*q.t);}const end=q.t+48;
 for(let i=0;i<maxSteps&&q.t<end&&q.l<=14;i++){
  const r=Math.hypot(...q.p),f=profile(r),curvature=Math.max(.000001,Math.abs(v*f.df)*(2+Math.abs(v*(1-f.f))));let h=Math.min(.024,.035/(1+Math.abs(v*(1-f.f))+Math.abs(v*f.df)),end-q.t);
  if(hull&&K>0&&r<HULL_RADIUS+.07)h=Math.min(h,Math.sqrt(.000016/curvature));
  if(frame)for(const body of frame.bodies){const c=sourceState(body,q.t,frame.axis).center,d=q.p.map((x,j)=>x-c[j]-(j===2?v*q.t:0));if(Math.hypot(...d)<body.radius+.07)h=Math.min(h,Math.sqrt(Math.max(1e-10,body.radius*.0002)/curvature));}
  h*=stepScale;let next=advanceShipRay(q,h,v),hit=hull&&K>0&&Math.min(r,Math.hypot(...next.p))<HULL_RADIUS+.04?intersectHull(q.p,sub(next.p,q.p)):{face:-1,t:Infinity},planet=frame?solarStepCandidate(q,next,v,frame):{body:-1,fraction:Infinity};
  if(planet.body>=0&&planet.fraction<hit.t){let fraction=planet.fraction;for(let j=0;j<4;j++){const e=advanceShipRay(q,h*fraction,v),s=sourceState(frame.bodies[planet.body],e.t,frame.axis),d=e.p.map((x,k)=>x-s.center[k]-(k===2?v*e.t:0)),w=e.n.map((x,k)=>x+s.velocity[k]-(k===2?v*profile(Math.hypot(...e.p)).f:0)),den=2*h*dot(d,w);if(Math.abs(den)>1e-20)fraction=clamp(fraction-(dot(d,d)-frame.bodies[planet.body].radius**2)/den);}return solarSurfaceEvent(advanceShipRay(q,h*fraction,v),v,frame,planet.body);}
  if(hit.face>=0){const face=hullFaces[hit.face],normal=cross(sub(face.b,face.a),sub(face.c,face.a));let fraction=hit.t;for(let j=0;j<3;j++){const e=advanceShipRay(q,h*fraction,v),der=e.n.map((x,k)=>x+(k===2?v*(1-profile(Math.hypot(...e.p)).f):0)),den=h*dot(normal,der);if(Math.abs(den)>1e-14)fraction=clamp(fraction-dot(normal,sub(e.p,face.a))/den);}next=advanceShipRay(q,h*fraction,v);return{...next,face:hit.face,logFrequency:Math.log(hullFrequency(v,next.p,K)),escaped:false};}
  q=next;if(Math.hypot(...q.p)>=3.2){const event=complete&&frame?solarExteriorEvent(q,v,frame):null;return event??{...q,face:-1,logFrequency:-q.l,escaped:true};}
 }
 return{...q,t:-1,face:-1,logFrequency:-q.l,escaped:false};
}
