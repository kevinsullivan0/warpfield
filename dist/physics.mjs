// Past-directed null rays in ship coordinates, c=R=1.
// ds²=-dt²+(dx+b dt)²+dy²+dz², b=v(1-f).
// State: x,y,direction angle,log |p|. The conserved energy is |p|(1+b cos θ).
export function trace(angle,v,h=.024,steps=1024) {
 let q=[0,0,angle,0];
 const deriv=([x,y,t])=>{
  const r=Math.hypot(x,y), a=Math.tanh(5*(r+1)),c=Math.tanh(5*(r-1));
  const f=(a-c)/(2*Math.tanh(5)),df=5*(c*c-a*a)/(2*Math.tanh(5));
  const gx=r>1e-8?-v*df*x/r:0,gy=r>1e-8?-v*df*y/r:0,nx=Math.cos(t),ny=Math.sin(t);
  return [nx+v*(1-f),ny,-nx*(gy*nx-gx*ny),-nx*(gx*nx+gy*ny)];
 };
 for(let i=0;i<steps&&Math.hypot(q[0],q[1])<2.8;i++) {
  const a=deriv(q),b=deriv(q.map((z,j)=>z+h*a[j]/2)),c=deriv(q.map((z,j)=>z+h*b[j]/2)),d=deriv(q.map((z,j)=>z+h*c[j]));
  q=q.map((z,j)=>z+h*(a[j]+2*b[j]+2*c[j]+d[j])/6);
 }
 const r=Math.hypot(q[0],q[1]),f=(Math.tanh(5*(r+1))-Math.tanh(5*(r-1)))/(2*Math.tanh(5));
 return {angle:q[2],logFrequency:-q[3],escaped:r>=2.8,invariant:Math.exp(q[3])*(1+v*(1-f)*Math.cos(q[2]))};
}
export const rayFragment=`#version 300 es
precision highp float;
uniform float velocity;out vec4 color;
vec4 derivative(vec4 q){
 float r=length(q.xy),a=tanh(5.*(r+1.)),c=tanh(5.*(r-1.));
 float f=(a-c)/(2.*tanh(5.)),df=5.*(c*c-a*a)/(2.*tanh(5.));
 vec2 g=r>1e-8?-velocity*df*q.xy/r:vec2(0.);
 vec2 n=vec2(cos(q.z),sin(q.z));
 return vec4(n.x+velocity*(1.-f),n.y,-n.x*(g.y*n.x-g.x*n.y),-n.x*dot(g,n));
}
void main(){
 float theta=(gl_FragCoord.x-.5)/767.*3.14159265359;
 vec4 q=vec4(0.,0.,theta,0.);float h=.024;
 if(velocity>.0001)for(int i=0;i<1024;i++){
  if(length(q.xy)>2.8)break;
  vec4 a=derivative(q),b=derivative(q+h*a*.5),c=derivative(q+h*b*.5),d=derivative(q+h*c);
  q+=h*(a+2.*b+2.*c+d)/6.;
 }
 float angle=mod(q.z+3.14159265359,6.28318530718)/6.28318530718;
 float packed=floor(angle*65535.+.5);
 #ifdef FLOAT_RAYS
 color=vec4(cos(q.z),sin(q.z),-q.w,velocity<.0001||length(q.xy)>2.8?1.:0.);
#else
 color=vec4(floor(packed/256.)/255.,mod(packed,256.)/255.,clamp((-q.w+8.)/16.,0.,1.),velocity<.0001||length(q.xy)>2.8?1.:0.);
#endif
}`;
