export const destinations=[{name:'Amber Relay',position:[0,0,120],color:[1,.58,.16]},{name:'Cobalt Halo',position:[65,18,320],color:[.15,.72,1]},{name:'Violet Gate',position:[-130,-35,620],color:[.75,.3,1]},{name:'Outer Beacon',position:[420,180,2400],color:[1,.73,.3]},{name:'Deep Array',position:[-1800,-500,9000],color:[.25,.8,1]},{name:'Far Reach',position:[4000,1400,24000],color:[.85,.4,1]}];
export const probesWGSL=`
${probeFunctions('wgsl')}
fn unrotateWorld(d:vec3f)->vec3f{let c=cos(p.a.z);let s=sin(p.a.z);let x=c*d.x-s*d.z;let z=s*d.x+c*d.z;return vec3f(x,cos(p.a.w)*d.y-sin(p.a.w)*z,sin(p.a.w)*d.y+cos(p.a.w)*z);}
fn emitting(center:vec3f,t:f32)->bool{if(p.c.y<.5||p.b.z<.00001){return true;}let c=unrotateWorld(center-p.world.xyz);let rho=dot(c.xy,c.xy);return rho>=106.09||c.z+p.b.z*t>=sqrt(max(0.,106.09-rho));}
fn probes(origin:vec3f,d:vec3f,maxT:f32,startTime:f32,minTime:f32)->vec4f{var color=vec3f(0.);var hit=0.;if(p.world.w<.5||p.world.w>1.5){return vec4f(0.);}for(var i=0;i<6;i++){let center=probeCenter(i);let oc=origin-center;let b=dot(oc,d);let perpendicular=oc-d*b;let disc=4.84-dot(perpendicular,perpendicular);if(disc<0.){continue;}for(var root=0;root<2;root++){let t=-b+select(-1.,1.,root==1)*sqrt(disc);if(t<=0.||t>=maxT||startTime+t<minTime||!emitting(center,startTime+t)){continue;}let n=normalize(origin+d*t-center);let stripe=pow(max(0.,1.-abs(n.y)*9.),2.);color+=probeColor(i)*(.13+.3*max(0.,dot(n,normalize(vec3f(.6,.7,-.5))))+stripe);hit=1.;}}return vec4f(color,hit);}
`;
export const probesGLSL=`
${probeFunctions('glsl')}
vec3 unrotateWorld(vec3 d){float c=cos(shipRotation.x),s=sin(shipRotation.x),x=c*d.x-s*d.z,z=s*d.x+c*d.z;return vec3(x,cos(shipRotation.y)*d.y-sin(shipRotation.y)*z,sin(shipRotation.y)*d.y+cos(shipRotation.y)*z);}
bool emitting(vec3 center,float t){if(warp<.5||velocity<.00001)return true;vec3 c=unrotateWorld(center-world.xyz);float rho=dot(c.xy,c.xy);return rho>=106.09||c.z+velocity*t>=sqrt(max(0.,106.09-rho));}
vec4 probes(vec3 origin,vec3 d,float maxT,float startTime,float minTime){vec3 color=vec3(0.);float hit=0.;if(world.w<.5||world.w>1.5)return vec4(0.);for(int i=0;i<6;i++){vec3 center=probeCenter(i),oc=origin-center;float b=dot(oc,d);vec3 perpendicular=oc-d*b;float disc=4.84-dot(perpendicular,perpendicular);if(disc<0.)continue;for(int root=0;root<2;root++){float t=-b+(root==0?-1.:1.)*sqrt(disc);if(t<=0.||t>=maxT||startTime+t<minTime||!emitting(center,startTime+t))continue;vec3 n=normalize(origin+d*t-center);float stripe=pow(max(0.,1.-abs(n.y)*9.),2.);color+=probeColor(i)*(.13+.3*max(0.,dot(n,normalize(vec3(.6,.7,-.5))))+stripe);hit=1.;}}return vec4(color,hit);}
`;
// Ideal transparent light shells radiate only before first encounter.
// Their material after switch-off is not part of this scene model.
export function emissionAllowed(centerLocal,v,pastTime){if(v===0)return true;const rho2=centerLocal[0]**2+centerLocal[1]**2;return rho2>=10.3**2||centerLocal[2]+v*pastTime>=Math.sqrt(10.3**2-rho2);}
export function shellEmissionTimes(origin,direction,centerLocal,v,startTime=0){const m=Math.hypot(...direction),n=direction.map(x=>x/m),oc=origin.map((x,i)=>x-centerLocal[i]),b=oc.reduce((s,x,i)=>s+x*n[i],0),perp=oc.map((x,i)=>x-n[i]*b),disc=2.2**2-perp.reduce((s,x)=>s+x*x,0);if(disc<0)return[];return [-b-Math.sqrt(disc),-b+Math.sqrt(disc)].filter(t=>t>0&&emissionAllowed(centerLocal,v,startTime+t));}

import{solarBodies,solarSnapshot,SOLAR_KM_PER_R,AU_KM}from'./solar-system.mjs?v=8j';
export{solarBodies,SOLAR_KM_PER_R,AU_KM};
export const getDestinations=(mode,time=0)=>mode==='solar'?solarSnapshot(time):destinations;
export function formatDistance(r,mode='survey'){return mode==='solar'?(r>1?(r*SOLAR_KM_PER_R/AU_KM).toFixed(3)+' AU':(r*SOLAR_KM_PER_R).toFixed(0)+' km'):r.toFixed(0)+' R';}
function vector(a,language){return(language==='wgsl'?'vec3f':'vec3')+'('+a.map(x=>Number(x).toFixed(9)).join(',')+')';}
function probeFunctions(language){const wg=language==='wgsl';return ['Center','Color'].map((part)=>{const field=part==='Center'?'position':'color';return(wg?'fn probe'+part+'(i:i32)->vec3f{':'vec3 probe'+part+'(int i){')+destinations.slice(0,-1).map((b,i)=>'if(i=='+i+')'+(wg?'{':'')+'return '+vector(b[field],language)+';'+(wg?'}':'')).join('')+'return '+vector(destinations.at(-1)[field],language)+';}';}).join('\n');}
