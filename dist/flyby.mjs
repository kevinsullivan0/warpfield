import{simulationStep}from'./navigation.mjs?v=8j';
const dot=(a,b)=>a.reduce((sum,x,i)=>sum+x*b[i],0),norm=a=>{const r=Math.hypot(...a)||1;return a.map(x=>x/r)},add=(a,b,k=1)=>a.map((x,i)=>x+k*b[i]);
// Keep the entire body beyond the 3.2R numerical region, plus a 0.8R margin.
export const flybyClearance=body=>4+(body.radius??0);
function segmentDistance(a,b){const d=b.map((x,i)=>x-a[i]),t=Math.max(0,Math.min(1,-dot(a,d)/Math.max(dot(d,d),1e-20)));return Math.hypot(...add(a,d,t));}
export function flybyGuidance(s,n,bodies){
 const body=bodies[s.index],relative=n.position.map((x,i)=>x-body.position[i]),distance=Math.hypot(...relative),safe=flybyClearance(body);
 let p=s.flyby;if(!p||p.index!==s.index)p=s.flyby={index:s.index,phase:'lineup',axis:null,closest:distance,previous:relative,safe,planned:safe*1.4};
 p.closest=Math.min(p.closest,segmentDistance(p.previous,relative));p.previous=relative;
 const hazard=bodies.find(b=>Math.hypot(...n.position.map((x,i)=>x-b.position[i]))<flybyClearance(b)*1.08);
 if(hazard){p.phase='clearance';p.axis=null;let away=n.position.map((x,i)=>x-hazard.position[i]);if(Math.hypot(...away)<1e-12)away=[1,0,0];return{aim:add(n.position,norm(away),safe*2),limit:.15,steering:1,phase:'clearance',safe,planned:p.planned};}
 if(!p.axis){p.axis=norm(relative.map(x=>-x));let side=[-p.axis[2],0,p.axis[0]];if(Math.hypot(...side)<1e-6)side=[1,0,0];p.side=norm(side);p.phase='lineup';p.closest=distance;p.previous=relative;}
 const lead=safe*2,origin=add(body.position,p.side,p.planned),entry=add(origin,p.axis,-lead),exit=add(origin,p.axis,lead),entryRange=Math.hypot(...n.position.map((x,i)=>x-entry[i])),along=dot(n.position.map((x,i)=>x-origin[i]),p.axis);
 if(p.phase==='lineup'&&entryRange<safe*.35)p.phase='pass';
 if(p.phase!=='lineup'&&along>lead*.85){s.lastFlyby={index:s.index,closest:p.closest,safe,planned:p.planned};return{completed:true,phase:'complete',safe,planned:p.planned};}
 const departing=p.phase!=='lineup'&&along>safe*.5;if(departing)p.phase='departing';
 return{aim:p.phase==='lineup'?entry:exit,limit:p.phase==='lineup'?Math.min(Math.max(safe*.65,(distance-safe*4)*.8),entryRange*.8):safe*.65,steering:departing?Math.max(0,Math.min(1,(lead*.85-along)/(lead*.6))):1,phase:p.phase,safe,planned:p.planned};
}
// Limit the actual real-frame segment against every moving source exclusion sphere.
export function flybySpeedLimit(position,direction,speed,seconds,bodies){
 const elapsed=simulationStep(seconds,'solar');if(elapsed<=0)return speed;
 for(const b of bodies){const r=position.map((x,i)=>x-b.position[i]),radius=flybyClearance(b)+Math.hypot(...(b.velocity??[0,0,0]))*elapsed,rr=dot(r,r),along=dot(r,direction);
  if(rr<radius*radius){speed=Math.min(speed,along>0?.15:0);continue;}
  const disc=along*along-(rr-radius*radius);if(disc<0)continue;const entry=-along-Math.sqrt(disc);if(entry>=0)speed=Math.min(speed,entry*.98/elapsed);
 }
 return Math.max(0,speed);
}
