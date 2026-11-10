// Trace a current-pose map while moving; refine into a separate map in bounded tiles.
export class OpticsCache {
 constructor(){this.key='';this.slot=0;this.dimensions=[97,97];this.row=0;this.motionDensity=97;this.tileRows=8;this.lastMotion=0;}
 plan(s){
  if((!s.external&&s.scene!=='solar')||s.warp===false||s.velocity<.00001){this.key='';return{job:null,slot:this.slot,dimensions:this.dimensions};}
  const aspect=s.aspect??s.width/s.height,quality=s.quality??'auto',clock=s.clock??0;
  const odd=x=>Math.max(33,2*Math.round((x-1)/2)+1),dims=n=>[odd(n*Math.min(1,aspect)),odd(n/Math.max(1,aspect))];
  const key=[s.external,s.scene,...(s.scene==='solar'?[...(s.position??[0,0,0]),s.yaw,s.pitch,s.simTime]:[]),...s.camera.eye,...s.camera.forward,...s.camera.right,s.focal,aspect,s.warp?s.velocity:0,quality].join(',');
  let job=null;
  if(key!==this.key){this.key=key;this.slot=0;this.row=0;this.lastMotion=clock;this.dimensions=dims(quality==='high'?161:quality==='low'?65:this.motionDensity);job={kind:'motion',slot:0,dimensions:this.dimensions,row:0,count:this.dimensions[1],clear:true};}
  else if(this.slot===0&&clock-this.lastMotion>=.12){const dimensions=dims(quality==='low'?257:513),count=Math.min(this.tileRows,dimensions[1]-this.row);job={kind:'refine',slot:1,dimensions,row:this.row,count,clear:this.row===0};this.row+=count;if(this.row===dimensions[1]){this.slot=1;this.dimensions=dimensions;}}
  return{job,slot:this.slot,dimensions:this.dimensions};
 }
 observeCost(ms,kind){if(!Number.isFinite(ms))return;if(kind==='motion'){if(ms>12)this.motionDensity=Math.max(49,Math.round(this.motionDensity*.75));else if(ms<6)this.motionDensity=Math.min(129,this.motionDensity+8);}if(kind==='refine'&&ms>12)this.tileRows=Math.max(2,Math.floor(this.tileRows*.75));}
}
// A slow view can be dominated by full-pixel silhouette rays, not map density.
// Hysteresis prevents resolution oscillation during an orbit.
export function adaptivePixelScale(state,current,timing,now){
 const slow=timing.fps<57&&(timing.p95>23||timing.p99>35);state.slow=slow?state.slow+1:0;state.fast=timing.fps>=58.5&&timing.p95<20?state.fast+1:0;
 if((state.slow>=2||slow&&timing.fps<50)&&now-state.lastChange>=2000&&current>.75){state.lastChange=now;state.slow=state.fast=0;return Math.max(.75,Math.round((current-.1)*100)/100);}
 if(state.fast>=10&&now-state.lastChange>=12000&&current<1){state.lastChange=now;state.fast=0;return Math.min(1,Math.round((current+.05)*100)/100);}return current;
}
