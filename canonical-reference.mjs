// Independent test oracle: canonical covariant momenta from the inverse metric,
// error-controlled Dormand–Prince 5(4). No normalized-direction/log-momentum ODE.
// Corresponds to the null geodesic equation in Clark et al. (1999), Eq.5.
const B=[[],[1/5],[3/40,9/40],[44/45,-56/15,32/9],[19372/6561,-25360/2187,64448/6561,-212/729],[9017/3168,-355/33,46732/5247,49/176,-5103/18656],[35/384,0,500/1113,125/192,-2187/6784,11/84]];
const high=[35/384,0,500/1113,125/192,-2187/6784,11/84,0],low=[5179/57600,0,7571/16695,393/640,-92097/339200,187/2100,1/40];
export function canonicalRay(origin,direction,v,{sigma=5,tolerance=2e-11,radius=3.2,surface=null,maxStep=.05}={}){
 const m=Math.hypot(...direction),n=direction.map(x=>x/m),shape=r=>{const a=Math.tanh(sigma*(r+1)),b=Math.tanh(sigma*(r-1)),D=2*Math.tanh(sigma);return[(a-b)/D,sigma*(b*b-a*a)/D];};
 const b0=v*(1-shape(Math.hypot(...origin))[0]),pt=1+b0*n[2];let y=[...origin,...n],time=0,h=.001,steps=0,previousRadius=Math.hypot(...origin),entered=previousRadius<radius;
 function derivative(y){const r=Math.hypot(...y.slice(0,3)),[f,df]=shape(r),b=v*(1-f),p=y.slice(3),E=pt-b*p[2],g=y.slice(0,3).map(x=>r>1e-12?-v*df*x/r:0);return[p[0]/E,p[1]/E,b+p[2]/E,...g.map(x=>-p[2]*x)];}
 for(;steps<100000&&time<100;steps++){
  if(surface&&Math.hypot(...y.slice(0,3))<.7)h=Math.min(h,.0005);
  const k=[];for(let i=0;i<7;i++)k.push(derivative(y.map((x,j)=>x+h*B[i].reduce((sum,b,l)=>sum+b*k[l][j],0))));
  const next=y.map((x,j)=>x+h*high.reduce((s,b,l)=>s+b*k[l][j],0)),other=y.map((x,j)=>x+h*low.reduce((s,b,l)=>s+b*k[l][j],0));let error=0;for(let j=0;j<6;j++)error=Math.max(error,Math.abs(next[j]-other[j])/(tolerance*(1+Math.max(Math.abs(y[j]),Math.abs(next[j])))));
  if(error<=1){if(surface){const hit=surface(y.slice(0,3),next.slice(0,3).map((x,i)=>x-y[i]),time,time+h);if(hit.face>=0){const point=y.slice(0,3).map((x,i)=>x+hit.t*(next[i]-x)),b=v*(1-shape(Math.hypot(...point))[0]);const momentum=y.slice(3).map((x,i)=>x+hit.t*(next[i+3]-x)),E=pt-b*momentum[2],w=hit.w,logFrequency=w?(w.reduce((a,x)=>a+x*x,0)<1?.5*Math.log(1-w.reduce((a,x)=>a+x*x,0))-Math.log(E+momentum.reduce((a,x,i)=>a+x*w[i],0)):-80):.5*Math.log(1-b*b)-Math.log(pt);return{escaped:false,face:hit.face,p:point,t:time+h*hit.t,logFrequency,steps};}}y=next;time+=h;const currentRadius=Math.hypot(...y.slice(0,3));if(currentRadius<radius)entered=true;if(currentRadius>radius&&(entered||currentRadius>previousRadius)){const E=pt-v*(1-shape(Math.hypot(...y.slice(0,3)))[0])*y[5],q=Math.hypot(...y.slice(3));return{escaped:true,direction:y.slice(3).map(x=>x/q),logFrequency:-Math.log(E),steps};}previousRadius=currentRadius;if(Math.hypot(...y.slice(3))>1e12)break;}
  h=Math.min(maxStep,.1/(1+Math.abs(v)),Math.max(1e-9,h*Math.max(.1,Math.min(4,.9*Math.pow(Math.max(error,1e-12),-.2)))));
 }
 return{escaped:false,steps};
}
