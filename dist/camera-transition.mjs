import{rotate,unrotate,clamp}from'./navigation.mjs?v=8j';
export const VIEW_TRANSITION_SECONDS=1.2;
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),unit=v=>{const l=Math.hypot(...v);return v.map(x=>x/l)};
// Unit quaternions keep roll changes smooth without a collapsing camera basis.
function quaternion({right:r,up:u,forward:f}){
 const m=[r,u,f],trace=r[0]+u[1]+f[2];let q;
 if(trace>0){const s=2*Math.sqrt(1+trace);q=[(u[2]-f[1])/s,(f[0]-r[2])/s,(r[1]-u[0])/s,s/4];}
 else{const i=r[0]>u[1]&&r[0]>f[2]?0:u[1]>f[2]?1:2,j=(i+1)%3,k=(i+2)%3,s=2*Math.sqrt(1+m[i][i]-m[j][j]-m[k][k]);q=[0,0,0,0];q[i]=s/4;q[j]=(m[j][i]+m[i][j])/s;q[k]=(m[k][i]+m[i][k])/s;q[3]=(m[j][k]-m[k][j])/s;}
 return unit(q);
}
function basis([x,y,z,w]){return{right:[1-2*(y*y+z*z),2*(x*y+w*z),2*(x*z-w*y)],up:[2*(x*y-w*z),1-2*(x*x+z*z),2*(y*z+w*x)],forward:[2*(x*z+w*y),2*(y*z-w*x),1-2*(x*x+y*y)]};}
function worldCamera(n,c){return Object.fromEntries(['eye','right','up','forward'].map(k=>[k,rotate(c[k],n.yaw,n.pitch)]));}
export function aimBridge(n,c){const f=unit(c.forward);n.lookYaw=Math.atan2(f[0],f[2]);n.lookPitch=Math.asin(clamp(f[1],-1,1));}
export function createViewTransition(n,c,fov){const from=worldCamera(n,c);return{from,q:quaternion(from),fov,elapsed:0};}
export function sampleViewTransition(t,n,target,fov,seconds){
 const p=clamp(seconds/VIEW_TRANSITION_SECONDS,0,1),a=p*p*p*(p*(p*6-15)+10),to=worldCamera(n,target),q=quaternion(to),sign=dot(t.q,q)<0?-1:1,b=basis(unit(t.q.map((x,i)=>x*(1-a)+q[i]*sign*a))),eye=t.from.eye.map((x,i)=>x+(to.eye[i]-x)*a),local=v=>unrotate(v,n.yaw,n.pitch);
 return{camera:{eye:local(eye),right:local(b.right),up:local(b.up),forward:local(b.forward)},fov:t.fov+(fov-t.fov)*a,done:p===1,progress:p};
}
