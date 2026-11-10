import {profile,traceSpatial} from './spatial.mjs?v=8j';
const subtract=(a,b)=>a.map((x,i)=>x-b[i]);
const normal=(a,b,c)=>{const u=subtract(b,a),v=subtract(c,a),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],m=Math.hypot(...n)||1;return n.map(x=>x/m)};
export function buildShip(){
 const out=[],silver=[.36,.47,.57],dark=[.09,.15,.21],cyan=[.10,.60,.69];
 const tri=(a,b,c,color=silver,glow=0)=>{const n=normal(a,b,c);for(const p of[a,b,c])out.push(...p,...n,...color,glow)};
 const quad=(a,b,c,d,color,glow=0)=>{tri(a,b,c,color,glow);tri(a,c,d,color,glow)};
 // A faceted, solid hull with a wedge nose and a nonzero vertical keel.
 const nose=[0,.015,.66],tail=[0,0,-.48],ring=[[.115,0,-.16],[0,.085,-.16],[-.115,0,-.16],[0,-.075,-.16]];
 for(let i=0;i<4;i++){tri(nose,ring[i],ring[(i+1)%4],i===1?silver:dark);tri(tail,ring[(i+1)%4],ring[i],silver);}
 for(const side of[-1,1]){
  const a=[side*.07,.012,.15],b=[side*.47,-.012,-.34],c=[side*.10,-.02,-.42],d=[side*.07,-.035,.15],e=[side*.47,-.045,-.34],f=[side*.10,-.05,-.42];
  tri(a,b,c,silver);tri(d,f,e,dark);quad(a,d,e,b,dark);quad(b,e,f,c,silver);quad(c,f,d,a,dark);
  // Wing-tip navigation strips have geometry, rather than a screen-space icon.
  quad([side*.40,-.008,-.30],[side*.46,-.01,-.34],[side*.43,-.012,-.36],[side*.38,-.01,-.32],side>0?[.7,.22,.13]:[.12,.7,.5],.7);
  const x=side*.17,r=.052;
  for(let i=0;i<10;i++){const t=i/10*Math.PI*2,u=(i+1)/10*Math.PI*2,a=[x+Math.cos(t)*r,Math.sin(t)*r,-.18],b=[x+Math.cos(u)*r,Math.sin(u)*r,-.18],c=[b[0],b[1],-.47],d=[a[0],a[1],-.47];quad(a,b,c,d,silver);tri([x,0,-.475],d,c,cyan,1.2);}
 }
 const glass=[.08,.35,.48];tri([0,.11,.26],[.063,.07,-.05],[-.063,.07,-.05],glass,.12);tri([0,.11,.26],[-.063,.07,-.05],[0,.13,-.07],glass,.12);tri([0,.11,.26],[0,.13,-.07],[.063,.07,-.05],glass,.12);
 quad([0,.04,-.20],[0,.23,-.36],[0,.20,-.44],[0,.02,-.44],silver);
 return new Float32Array(out);
}
export function buildField(v,mode=1){
 const data=[];if(mode===0)return new Float32Array();
 const line=(a,b,c,alpha=.35)=>data.push(...a,...c,alpha,...b,...c,alpha);
 const color=p=>v<.001?[.55,.65,.69]:p[2]>0?[.95,.36,.17]:[.20,.79,.75];
 // A coordinate shell at R=1, with latitude/meridian lines rather than a displaced spatial grid.
 for(let j=0;j<6;j++)for(let i=0;i<96;i++){const f=t=>{const a=j/6*Math.PI;return [Math.cos(a)*Math.sin(t),Math.sin(a)*Math.sin(t),Math.cos(t)]},a=f(i/96*Math.PI*2),b=f((i+1)/96*Math.PI*2);line(a,b,color(a),.5);}
 for(const z of[-.65,0,.65])for(let i=0;i<96;i++){const r=Math.sqrt(1-z*z),f=t=>[r*Math.cos(t),r*Math.sin(t),z],a=f(i/96*Math.PI*2),b=f((i+1)/96*Math.PI*2);line(a,b,color(a),.4);}
 if(mode===2)for(const y of[-.3,.3])for(let i=0;i<5;i++){
  const ray=traceSpatial([(i-2)*.35,y,-2.3],[0,0,1],v,.024,2048),p=ray.positions;
  for(let k=3;k<p.length;k+=6){const a=[p[k-3],p[k-2],p[k-1]],b=[p[Math.min(k+3,p.length-3)],p[Math.min(k+4,p.length-2)],p[Math.min(k+5,p.length-1)]];line(a,b,[.75,.83,1.],.42);}
 }
 line([0,-.28,-.65],[0,-.28,1.12],[.36,.9,.72],.7);line([0,-.28,1.12],[-.07,-.28,.96],[.36,.9,.72],.7);line([0,-.28,1.12],[.07,-.28,.96],[.36,.9,.72],.7);
 return new Float32Array(data);
}
