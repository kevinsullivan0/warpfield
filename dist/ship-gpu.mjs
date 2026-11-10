import{HULL_NODE_VECTORS as NN,HULL_FACE_VECTORS as NF}from'./ship.mjs?v=8j';
export const hullWGSL=(binding=1)=>`
struct HullData{nodes:array<vec4f,${NN}>,faces:array<vec4f,${NF}>};@group(0) @binding(${binding}) var<uniform> hull:HullData;
struct HullHit{fraction:f32,face:i32};
fn hullBox(o:vec3f,inv:vec3f,lo:vec3f,hi:vec3f,best:f32)->bool{let a=(lo-vec3f(.00001)-o)*inv;let b=(hi+vec3f(.00001)-o)*inv;let near=min(a,b);let far=max(a,b);return max(0.,max(near.x,max(near.y,near.z)))<=min(best,min(far.x,min(far.y,far.z)));}
fn hullTriangle(o:vec3f,d:vec3f,i:i32)->f32{let a=hull.faces[i*4].xyz;let e1=hull.faces[i*4+1].xyz-a;let e2=hull.faces[i*4+2].xyz-a;let p=cross(d,e2);let det=dot(e1,p);if(abs(det)<1e-12){return 2.;}let s=o-a;let u=dot(s,p)/det;if(u< -1e-5||u>1.00001){return 2.;}let q=cross(s,e1);let v=dot(d,q)/det;if(v< -1e-5||u+v>1.00001){return 2.;}let t=dot(e2,q)/det;return select(2.,clamp(t,0.,1.),t>= -1e-4&&t<=1.0001);}
// Preorder BVH escape links avoid mutable shader-local stacks on older drivers.
fn hullSegment(o:vec3f,d:vec3f)->HullHit{var result=HullHit(1.000001,-1);let inv=select(vec3f(-1.),vec3f(1.),d>=vec3f(0.))/max(abs(d),vec3f(1e-20));var node=0;for(var count=0;count<${NN/3};count++){if(node>=${NN/3}){break;}let lo=hull.nodes[node*3];let hi=hull.nodes[node*3+1];let escape=i32(hull.nodes[node*3+2].x);if(!hullBox(o,inv,lo.xyz,hi.xyz,min(1.,result.fraction))){node=escape;continue;}if(lo.w<0.){let first=i32(-lo.w)-1;for(var j=0;j<4;j++){if(j>=i32(hi.w)){break;}let i=first+j;let t=hullTriangle(o,d,i);if(t<result.fraction){result=HullHit(t,i);}}node=escape;}else{node+=1;}}return result;}
fn hullNormal(i:i32)->vec3f{return cross(hull.faces[i*4+1].xyz-hull.faces[i*4].xyz,hull.faces[i*4+2].xyz-hull.faces[i*4].xyz);}
fn hullRadiance(i:i32)->vec3f{let material=hull.faces[i*4+3];return material.xyz*(.6+material.w*2.);}
`;
export const hullGLSL=()=>`
layout(std140)uniform HullData{vec4 hullNodes[${NN}];vec4 hullFaces[${NF}];};
struct HullHit{float fraction;int face;};
bool hullBox(vec3 o,vec3 inv,vec3 lo,vec3 hi,float best){vec3 a=(lo-vec3(.00001)-o)*inv,b=(hi+vec3(.00001)-o)*inv,n=min(a,b),f=max(a,b);return max(0.,max(n.x,max(n.y,n.z)))<=min(best,min(f.x,min(f.y,f.z)));}
float hullTriangle(vec3 o,vec3 d,int i){vec3 a=hullFaces[i*4].xyz,e1=hullFaces[i*4+1].xyz-a,e2=hullFaces[i*4+2].xyz-a,p=cross(d,e2);float det=dot(e1,p);if(abs(det)<1e-12)return 2.;vec3 s=o-a;float u=dot(s,p)/det;if(u< -1e-5||u>1.00001)return 2.;vec3 q=cross(s,e1);float v=dot(d,q)/det;if(v< -1e-5||u+v>1.00001)return 2.;float t=dot(e2,q)/det;return t>= -1e-4&&t<=1.0001?clamp(t,0.,1.):2.;}
HullHit hullSegment(vec3 o,vec3 d){HullHit result=HullHit(1.000001,-1);vec3 inv=mix(vec3(-1.),vec3(1.),greaterThanEqual(d,vec3(0.)))/max(abs(d),vec3(1e-20));int node=0;for(int count=0;count<${NN/3};count++){if(node>=${NN/3})break;vec4 lo=hullNodes[node*3],hi=hullNodes[node*3+1];int escape=int(hullNodes[node*3+2].x);if(!hullBox(o,inv,lo.xyz,hi.xyz,min(1.,result.fraction))){node=escape;continue;}if(lo.w<0.){int first=int(-lo.w)-1;for(int j=0;j<4;j++){if(j>=int(hi.w))break;int i=first+j;float t=hullTriangle(o,d,i);if(t<result.fraction)result=HullHit(t,i);}node=escape;}else node+=1;}return result;}
vec3 hullNormal(int i){return cross(hullFaces[i*4+1].xyz-hullFaces[i*4].xyz,hullFaces[i*4+2].xyz-hullFaces[i*4].xyz);}
vec3 hullRadiance(int i){vec4 m=hullFaces[i*4+3];return m.xyz*(.6+m.w*2.);}
`;
