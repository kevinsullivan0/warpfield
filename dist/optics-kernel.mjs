// Shared geodesic step; optional opaque comoving hull events are external-only.
import{solarWGSL,solarGLSL}from'./solar-gpu.mjs?v=8j';
import{hullWGSL,hullGLSL}from'./ship-gpu.mjs?v=8j';import{HULL_RADIUS}from'./ship.mjs?v=8j';
const radius=HULL_RADIUS.toFixed(9);
function wgsl(ship=false,binding=1,solarBinding=2){return`
${ship?hullWGSL(binding):''}
struct Ray{p:vec3f,t:f32,n:vec3f,l:f32,face:i32};
fn shape(r:f32)->vec2f{if(r>=3.2){return vec2f(0.);}let a=tanh(5.*(r+1.));let b=tanh(5.*(r-1.));return vec2f((a-b)/(2.*tanh(5.)),5.*(b*b-a*a)/(2.*tanh(5.)));}
fn derivative(q:Ray,v:f32)->Ray{let r=length(q.p);let f=shape(r);var g=vec3f(0.);if(r>1e-9){g=-v*f.y*q.p/r;}let dotng=dot(q.n,g);return Ray(q.n+vec3f(0.,0.,v*(1.-f.x)),0.,-q.n.z*(g-q.n*dotng),-q.n.z*dotng,-1);}
fn add(q:Ray,k:Ray,h:f32)->Ray{return Ray(q.p+h*k.p,q.t,q.n+h*k.n,q.l+h*k.l,-1);}
fn advanceRay(q:Ray,h:f32,v:f32)->Ray{let a=derivative(q,v);let b=derivative(add(q,a,h*.5),v);let c=derivative(add(q,b,h*.5),v);let d=derivative(add(q,c,h),v);return Ray(q.p+h*(a.p+2.*b.p+2.*c.p+d.p)/6.,q.t+h,normalize(q.n+h*(a.n+2.*b.n+2.*c.n+d.n)/6.),q.l+h*(a.l+2.*b.l+2.*c.l+d.l)/6.,-1);}
${ship?solarWGSL(solarBinding):''}
fn traceRay(origin:vec3f,direction:vec3f,v:f32)->Ray{let n=normalize(direction);var q=Ray(origin,0.,n,0.,-1);
 if(v<.00001){${ship?'var body=solarExterior(q,0.,1e9,!opticalMode());if(isExternal()){let reach=max(400.,length(origin)*2.+2.);let hit=hullSegment(origin,n*reach);if(hit.face>=0&&(body.face<0||reach*hit.fraction<body.t)){q.p+=n*reach*hit.fraction;q.t=reach*hit.fraction;q.face=hit.face;return q;}}return body;':''}return q;}
 ${ship?'let K=1.+v*(1.-shape(length(origin)).x)*n.z;':''}
 if(length(origin)>=3.2){let u=n+vec3f(0.,0.,v);let a=dot(u,u);let center= -dot(origin,u)/max(a,1e-12);let perpendicular=origin+u*center;let disc=10.24-dot(perpendicular,perpendicular);if(a<1e-12||disc<=0.){${ship?'return solarExterior(q,v,1e9,false);':'return q;'}}let entry=center-sqrt(disc/a);${ship?'let foreground=solarExterior(q,v,select(entry,1e9,entry<0.),false);if(foreground.face>=0){return foreground;}':''}if(entry<0.){return q;}q.t=entry+1e-4/(1.+abs(v));q.p=perpendicular-u*sqrt(disc/a)+u*(1e-4/(1.+abs(v)));}
 let endTime=q.t+48.;var escaped=false;for(var i=0;i<${ship?4096:2048};i++){if(q.t>=endTime||q.l>14.){break;}let r=length(q.p);let f=shape(r);var h=min(.024,min(.035/(1.+abs(v*(1.-f.x))+abs(v*f.y)),endTime-q.t));${ship?`if(isExternal()&&K>0.&&r<${radius}+.07){h=min(h,sqrt(.000016/max(.000001,abs(v*f.y)*(2.+abs(v*(1.-f.x))))));}`:''}${ship?'h=solarStepLimit(q,h,v);':''}var next=advanceRay(q,h,v);${ship?'let planet=solarStep(q,next,v);var opaque=HullHit(2.,-1);':''}
 ${ship?`if(isExternal()&&K>0.&&min(r,length(next.p))<${radius}+.04){opaque=hullSegment(q.p,next.p-q.p);if(planet.face>=0&&planet.fraction<opaque.fraction){return refineSolar(q,h,v,planet);}let hit=opaque;if(hit.face>=0){let normal=hullNormal(hit.face);var fraction=hit.fraction;for(var j=0;j<3;j++){let e=advanceRay(q,h*fraction,v);let den=h*dot(normal,derivative(e,v).p);if(abs(den)>1e-14){fraction=clamp(fraction-dot(normal,e.p-hull.faces[hit.face*4].xyz)/den,0.,1.);}}next=advanceRay(q,h*fraction,v);let shift=v*(1.-shape(length(next.p)).x);next.l=log(K)-.5*log(max(1e-20,1.-shift*shift));next.face=hit.face;return next;}}`:''}
 ${ship?'if(planet.face>=0){return refineSolar(q,h,v,planet);}':''}q=next;if(length(q.p)>=3.2){escaped=true;break;}}
 if(!escaped||q.l>14.){q.t=-1.;}else{${ship?'return solarExterior(q,v,1e9,false);':''}}return q;}
struct TraceOut{@location(0) direction:vec4f,@location(1) origin:vec4f};
`}
function glsl(ship=false){return`
${ship?hullGLSL():''}
struct Ray{vec3 p;float t;vec3 n;float l;int face;};
vec2 shape(float r){if(r>=3.2)return vec2(0.);float a=tanh(5.*(r+1.)),b=tanh(5.*(r-1.));return vec2((a-b)/(2.*tanh(5.)),5.*(b*b-a*a)/(2.*tanh(5.)));}
Ray derivative(Ray q,float v){float r=length(q.p);vec2 f=shape(r);vec3 g=r>1e-9?-v*f.y*q.p/r:vec3(0.);float d=dot(q.n,g);return Ray(q.n+vec3(0.,0.,v*(1.-f.x)),0.,-q.n.z*(g-q.n*d),-q.n.z*d,-1);}
Ray add(Ray q,Ray k,float h){return Ray(q.p+h*k.p,q.t,q.n+h*k.n,q.l+h*k.l,-1);}
Ray advanceRay(Ray q,float h,float v){Ray a=derivative(q,v),b=derivative(add(q,a,h*.5),v),c=derivative(add(q,b,h*.5),v),d=derivative(add(q,c,h),v);return Ray(q.p+h*(a.p+2.*b.p+2.*c.p+d.p)/6.,q.t+h,normalize(q.n+h*(a.n+2.*b.n+2.*c.n+d.n)/6.),q.l+h*(a.l+2.*b.l+2.*c.l+d.l)/6.,-1);}
${ship?solarGLSL():''}
Ray traceRay(vec3 origin,vec3 direction,float v){vec3 n=normalize(direction);Ray q=Ray(origin,0.,n,0.,-1);if(v<.00001){${ship?'Ray body=solarExterior(q,0.,1e9,!opticalMode());if(isExternal()){float reach=max(400.,length(origin)*2.+2.);HullHit hit=hullSegment(origin,n*reach);if(hit.face>=0&&(body.face<0||reach*hit.fraction<body.t)){q.p+=n*reach*hit.fraction;q.t=reach*hit.fraction;q.face=hit.face;return q;}}return body;':''}return q;}
 ${ship?'float K=1.+v*(1.-shape(length(origin)).x)*n.z;':''}
 if(length(origin)>=3.2){vec3 u=n+vec3(0.,0.,v);float a=dot(u,u),center=-dot(origin,u)/max(a,1e-12);vec3 perpendicular=origin+u*center;float disc=10.24-dot(perpendicular,perpendicular);if(a<1e-12||disc<=0.)${ship?'return solarExterior(q,v,1e9,false);':'return q;'}float entry=center-sqrt(disc/a);${ship?'Ray foreground=solarExterior(q,v,entry<0.?1e9:entry,false);if(foreground.face>=0)return foreground;':''}if(entry<0.)return q;q.t=entry+1e-4/(1.+abs(v));q.p=perpendicular-u*sqrt(disc/a)+u*(1e-4/(1.+abs(v)));}float endTime=q.t+48.;bool escaped=false;
 for(int i=0;i<${ship?4096:2048};i++){if(q.t>=endTime||q.l>14.)break;float r=length(q.p);vec2 f=shape(r);float h=min(.024,min(.035/(1.+abs(v*(1.-f.x))+abs(v*f.y)),endTime-q.t));${ship?`if(isExternal()&&K>0.&&r<${radius}+.07)h=min(h,sqrt(.000016/max(.000001,abs(v*f.y)*(2.+abs(v*(1.-f.x))))));`:''}${ship?'h=solarStepLimit(q,h,v);':''}Ray next=advanceRay(q,h,v);${ship?'HullHit planet=solarStep(q,next,v),opaque=HullHit(2.,-1);':''}
 ${ship?`if(isExternal()&&K>0.&&min(r,length(next.p))<${radius}+.04){opaque=hullSegment(q.p,next.p-q.p);if(planet.face>=0&&planet.fraction<opaque.fraction)return refineSolar(q,h,v,planet);HullHit hit=opaque;if(hit.face>=0){vec3 normal=hullNormal(hit.face);float fraction=hit.fraction;for(int j=0;j<3;j++){Ray e=advanceRay(q,h*fraction,v);float den=h*dot(normal,derivative(e,v).p);if(abs(den)>1e-14)fraction=clamp(fraction-dot(normal,e.p-hullFaces[hit.face*4].xyz)/den,0.,1.);}next=advanceRay(q,h*fraction,v);float shift=v*(1.-shape(length(next.p)).x);next.l=log(K)-.5*log(max(1e-20,1.-shift*shift));next.face=hit.face;return next;}}`:''}
 ${ship?'if(planet.face>=0){return refineSolar(q,h,v,planet);}':''}q=next;if(length(q.p)>=3.2){escaped=true;break;}}if(!escaped||q.l>14.)q.t=-1.;else{${ship?'return solarExterior(q,v,1e9,false);':''}}return q;}
`}
export const kernelWGSL=wgsl(),kernelGLSL=glsl();export const sceneKernelWGSL=(binding,solarBinding=2)=>wgsl(true,binding,solarBinding),sceneKernelGLSL=()=>glsl(true);
export const bridgeWGSL=kernelWGSL+`struct Speed{value:vec4f};@group(0) @binding(0) var<uniform> speed:Speed;@fragment fn fs(@builtin(position) pos:vec4f)->TraceOut{let angle=(pos.x-.5)/1535.*3.14159265359;let q=traceRay(vec3f(0.),vec3f(sin(angle),0.,cos(angle)),speed.value.x);var o:TraceOut;o.direction=vec4f(q.n.z,q.n.x,-q.l,select(0.,1.,q.t>=0.));o.origin=vec4f(q.p.z,q.p.x,max(q.t,0.),0.);return o;}`;
export const bridgeGLSL=`#version 300 es\nprecision highp float;uniform float velocity;layout(location=0)out vec4 directionOut;layout(location=1)out vec4 originOut;${kernelGLSL}\nvoid main(){float angle=(gl_FragCoord.x-.5)/1535.*3.14159265359;Ray q=traceRay(vec3(0.),vec3(sin(angle),0.,cos(angle)),velocity);directionOut=vec4(q.n.z,q.n.x,-q.l,q.t>=0.?1.:0.);originOut=vec4(q.p.z,q.p.x,max(q.t,0.),0.);}`;
