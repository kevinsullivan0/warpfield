// Ship coordinates, longitudinal +z, Eulerian local camera directions, R=c=1.
export function profile(r,sigma=5){const a=Math.tanh(sigma*(r+1)),b=Math.tanh(sigma*(r-1)),den=2*Math.tanh(sigma);return {f:(a-b)/den,df:sigma*(b*b-a*a)/den};}
export function exteriorEntry(origin,n,v,radius=3.2){
 if(Math.hypot(...origin)<radius)return 0;
 const u=[n[0],n[1],n[2]+v],a=u.reduce((s,x)=>s+x*x,0);if(a<1e-14)return -1;
 const center=-origin.reduce((s,x,i)=>s+x*u[i],0)/a,perp=origin.map((x,i)=>x+u[i]*center),disc=radius*radius-perp.reduce((s,x)=>s+x*x,0);
 if(disc<=0)return -1;const t=center-Math.sqrt(disc/a);return t<0?-1:t;
}
export function traceOptical(origin,direction,v,{maxStep=.024,spatialStep=.035,maxSteps=2048,maxTime=48,sigma=5,escapeRadius=Math.max(3.2,1+11/sigma),maxLogMomentum=Infinity,record=false}={}){
 const shape=r=>profile(r,sigma);
 const magnitude=Math.hypot(...direction),n=direction.map(x=>x/magnitude),entry=exteriorEntry(origin,n,v,escapeRadius);
 if(v===0||entry<0)return {direction:n,exit:[...origin],elapsed:0,logFrequency:0,escaped:true,crossed:false,energyError:0,positions:new Float32Array([...origin,...origin.map((x,i)=>x+n[i]*6)])};
 let elapsed=0,q=[...origin,...n,0];const initial=1+v*(1-shape(Math.hypot(...origin)).f)*n[2],points=record?[...origin]:[];
 if(entry>0){elapsed=entry+1e-4/(1+Math.abs(v));for(let j=0;j<3;j++)q[j]+=(n[j]+(j===2?v:0))*elapsed;if(record)points.push(q[0],q[1],q[2]);}
 const deriv=q=>{const r=Math.hypot(q[0],q[1],q[2]),{f,df}=shape(r),g=q.slice(0,3).map(x=>r>1e-9?-v*df*x/r:0),dot=q[3]*g[0]+q[4]*g[1]+q[5]*g[2];return [q[3],q[4],q[5]+v*(1-f),-q[5]*(g[0]-q[3]*dot),-q[5]*(g[1]-q[4]*dot),-q[5]*(g[2]-q[5]*dot),-q[5]*dot];};
 const endTime=elapsed+maxTime;let escaped=false,censored=false,steps=0;
 for(;steps<maxSteps&&elapsed<endTime;steps++){
  const p=shape(Math.hypot(q[0],q[1],q[2]));const h=Math.min(maxStep,spatialStep/(1+Math.abs(v*(1-p.f))+Math.abs(v*p.df)),endTime-elapsed);
  const a=deriv(q),b=deriv(q.map((x,j)=>x+h*a[j]/2)),c=deriv(q.map((x,j)=>x+h*b[j]/2)),d=deriv(q.map((x,j)=>x+h*c[j]));q=q.map((x,j)=>x+h*(a[j]+2*b[j]+2*c[j]+d[j])/6);elapsed+=h;
  const norm=Math.hypot(q[3],q[4],q[5]);for(let j=3;j<6;j++)q[j]/=norm;if(record)points.push(q[0],q[1],q[2]);
  if(q[6]>maxLogMomentum){censored=true;break;}
  if(Math.hypot(q[0],q[1],q[2])>=escapeRadius){escaped=true;break;}
 }
 const energy=Math.exp(q[6])*(1+v*(1-shape(Math.hypot(q[0],q[1],q[2])).f)*q[5]);
 return {direction:q.slice(3,6),exit:q.slice(0,3),elapsed,logFrequency:-q[6],escaped,censored,crossed:true,steps,energyError:Math.abs(energy-initial)/Math.max(1,Math.abs(initial)),positions:new Float32Array(points)};
}
export function traceSpatial(origin,direction,v,h=.024,steps=2048){return traceOptical(origin,direction,v,{maxStep:h,spatialStep:h/.024*.035,maxSteps:steps,record:true});}
