// Prescribed source worldtubes. Time is past-directed in R/c, lengths in R.
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],sub=(a,b)=>a.map((x,i)=>x-b[i]);
export function sourceState(body,past,axis=[0,1,0]){
 if(!body.omega)return{center:body.center,velocity:body.velocity};
 const angle=body.omega*past,s=Math.sin(angle),c=Math.cos(angle),oneMinusCos=2*Math.sin(angle/2)**2,turn=cross(axis,body.velocity);
 return{center:body.center.map((x,i)=>x+(turn[i]*oneMinusCos-body.velocity[i]*s)/body.omega),velocity:body.velocity.map((x,i)=>x*c-turn[i]*s)};
}
export function sourceLogFrequency(n,logEnergy,w){const norm=dot(w,w),energy=1+dot(n,w);return norm<1&&energy>0?.5*Math.log(1-norm)-logEnergy-Math.log(energy):-80;}
export function sphereSegment(o,d,r){const a=dot(d,d),b=dot(o,d),perp=o.map((x,i)=>x-d[i]*b/a),disc=r*r-dot(perp,perp);if(a<1e-25||disc<0)return Infinity;const root=Math.sqrt(disc/a),center=-b/a;for(const t of[center-root,center+root])if(t>=0&&t<=1)return t;return Infinity;}
export function exteriorBodyHit(origin,n,startTime,maxTime,bodies,axis=[0,1,0],layout=false){
 let best={body:-1,time:maxTime,point:origin};
 for(let i=0;i<bodies.length;i++){
  const body=bodies[i],at=sourceState(body,layout?0:startTime,axis),velocity=layout?[0,0,0]:at.velocity,rel=sub(origin,at.center),u=n.map((x,j)=>x+velocity[j]),uu=dot(u,u);let t=Math.max(0,-dot(rel,u)/uu);
  // Acceleration bound rejects only rays outside the swept circular-source tube.
  const bound=body.radius+(layout?0:.5*Math.hypot(...body.velocity)*Math.abs(body.omega)*(startTime+t)**2),r=rel.map((x,j)=>x+u[j]*t);if(t>maxTime+bound||dot(r,r)>bound*bound)continue;
  for(let j=0;j<4;j++){const state=sourceState(body,layout?0:startTime+t,axis),d=origin.map((x,k)=>x+n[k]*t-state.center[k]),w=n.map((x,k)=>x+(layout?0:state.velocity[k]));t=Math.max(0,t-dot(d,w)/dot(w,w));}
  let state=sourceState(body,layout?0:startTime+t,axis),delta=origin.map((x,k)=>x+n[k]*t-state.center[k]),w=n.map((x,k)=>x+(layout?0:state.velocity[k])),disc=body.radius**2-dot(delta,delta);if(disc<0)continue;
  t-=Math.sqrt(disc/dot(w,w));if(t<=1e-8)t+=2*Math.sqrt(disc/dot(w,w));
  for(let j=0;j<3;j++){state=sourceState(body,layout?0:startTime+t,axis);delta=origin.map((x,k)=>x+n[k]*t-state.center[k]);w=n.map((x,k)=>x+(layout?0:state.velocity[k]));const den=2*dot(delta,w);if(Math.abs(den)>1e-20)t-=(dot(delta,delta)-body.radius**2)/den;}
  if(t>1e-8&&t<best.time)best={body:i,time:t,point:origin.map((x,j)=>x+n[j]*t)};
 }
 return best;
}
