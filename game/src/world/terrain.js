// Domain-warped volcanic archipelago terrain, procedural basalt/snow cliff shader, surf-foam ocean, and alpine conifers.
import * as THREE from '../../vendor/three.module.min.js';
import { TIME_OF_DAY_PRESETS, WORLD_CONFIG } from '../config.js';
export function sampleArchipelagoHeight(x, z) {
const wx=x+fbm(x*0.0011+1.4,z*0.0011-2.2,2)*145;
const wz=z+fbm(x*0.0011-3.7,z*0.0011+4.1,2)*145;
const crags=ridgedNoise(wx*0.0019+2.3,wz*0.0019-1.4);
const fine=ridgedNoise(x*0.0048-1.1,z*0.0048+2.9);
let h=-34+gauss(x,z,20,10,680,390)*(66+fine*14)+gauss(wx,wz,-260,-340,290,220)*(76+crags*84)+gauss(wx,wz,390,310,260,210)*(64+crags*72);
const dxC=wx-680;const dzC=wz+1980;
const rim=Math.exp(-(((Math.hypot(dxC,dzC)-980)/380)**2));
const cut=Math.exp(-(((Math.atan2(dzC,dxC)-1.78)/0.27)**2));
h+=rim*(1-cut*0.95)*(225+crags*315+fine*74);
h+=gauss(wx,wz,-170,-1160,440,340)*(165+crags*195+fine*52)+gauss(wx,wz,980,-1060,430,350)*(185+crags*210+fine*52);
h+=gauss(wx,wz,1940,-280,560,480)*(195+crags*245+fine*54)+gauss(wx,wz,2240,360,380,340)*(150+crags*150);
h+=gauss(wx,wz,-1680,-560,560,490)*(190+crags*225+fine*50)+gauss(x,z,-1260,420,230,210)*(76+fine*24);
h+=gauss(wx,wz,2260,1500,320,280)*(130+crags*130)+gauss(wx,wz,-960,1520,390,330)*(115+crags*115);
if(h>-18)h+=fbm(x*0.0038,z*0.0038,4)*32+fine*24;
h-=smoothstep(560,220,Math.hypot(x-680,z+1980))*54;
const bx=Math.abs(x-440),bz=Math.abs(z+1040);
const straitChannel=(1-smoothstep(150,235,bx))*(1-smoothstep(380,620,bz));
if(straitChannel>0)h=h*(1-straitChannel)-24*straitChannel;
const gorgeWall=(1-smoothstep(235,480,bx))*(1-smoothstep(360,640,bz));
if(gorgeWall>0&&h>215)h=h*(1-gorgeWall*0.6)+215*(gorgeWall*0.6);
const cc=gauss(x,z,1460,1120,420,320);h=h*(1-cc)-28*cc;
const rwyB=1-smoothstep(0,138,Math.hypot(Math.max(0,Math.abs(x)-465),Math.max(0,Math.abs(z)-82)));
if(rwyB>0)h=h*(1-rwyB)+22*rwyB;
const hb=1-smoothstep(45,125,Math.hypot(x+210,z-240));if(hb>0)h=h*(1-hb)+4.5*hb;
const op=1-smoothstep(42,115,Math.hypot(x+1520,z+520));if(op>0)h=h*(1-op)+185*op;
const lh=1-smoothstep(30,88,Math.hypot(x+1260,z-420));if(lh>0)h=h*(1-lh)+44*lh;
return h;
}
export function createTerrainMesh() {
const geom=new THREE.PlaneGeometry(WORLD_CONFIG.terrainSpanM,WORLD_CONFIG.terrainSpanM,WORLD_CONFIG.terrainSegments,WORLD_CONFIG.terrainSegments);
geom.rotateX(-Math.PI/2);
const pos=geom.attributes.position;
for(let i=0;i<pos.count;i++)pos.setY(i,sampleArchipelagoHeight(pos.getX(i),pos.getZ(i)));
geom.computeVertexNormals();
const mat=new THREE.MeshStandardMaterial({roughness:0.89,metalness:0.04});
mat.onBeforeCompile=(sh)=>{
sh.vertexShader=sh.vertexShader
.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;')
.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);');
sh.fragmentShader=sh.fragmentShader
.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;float tH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float tN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(tH(i),tH(i+vec2(1.0,0.0)),f.x),mix(tH(i+vec2(0.0,1.0)),tH(i+vec2(1.0,1.0)),f.x),f.y);}')
.replace('#include <color_fragment>','#include <color_fragment>\nfloat h=vWP.y,sl=1.0-clamp(vWN.y,0.0,1.0),nL=tN(vWP.xz*0.011),nM=tN(vWP.xz*0.042+vec2(h*0.025,-h*0.018)),nF=tN(vWP.xz*0.14+vec2(h*0.05,h*0.04))*0.6+tN(vWP.xz*0.34)*0.4,cg=tN(vec2(vWP.x*0.032+vWP.z*0.028+nL*3.0,h*0.038+nM*2.2));vec3 shC=mix(vec3(0.11,0.14,0.16),vec3(0.49,0.44,0.34),smoothstep(0.0,5.5,h)),mdC=mix(vec3(0.15,0.33,0.16),vec3(0.26,0.41,0.19),nL*0.65+nM*0.35),hiC=mix(vec3(0.17,0.27,0.17),vec3(0.30,0.31,0.24),smoothstep(95.0,210.0,h));vec3 land=mix(mix(shC,mdC,smoothstep(3.5,13.0,h)),hiC,smoothstep(78.0,185.0,h));vec3 clC=mix(vec3(0.11,0.13,0.16),vec3(0.29,0.27,0.25),cg*0.65+nF*0.35);vec3 col=mix(land,clC,smoothstep(0.18,0.40,sl+smoothstep(175.0,310.0,h)*0.15));float sL=268.0+sl*265.0-nL*42.0-nM*20.0;col=mix(col,vec3(0.90,0.94,0.98)*(0.9+nF*0.12),smoothstep(sL,sL+56.0,h)*(1.0-smoothstep(0.32,0.52,sl)));diffuseColor.rgb=col*(0.85+nF*0.28);');
};
const terrain=new THREE.Mesh(geom,mat);terrain.receiveShadow=true;
const group=new THREE.Group();group.name='ArchipelagoTerrain';group.add(terrain,buildAlpineConiferForests());
return group;
}
export function createOceanWaterMesh(preset = TIME_OF_DAY_PRESETS.goldenHour) {
const uniforms={
uTime:{value:0},uHeightMap:{value:bakeCoastalHeightTexture(512)},uMapSpan:{value:WORLD_CONFIG.terrainSpanM},
uSunDir:{value:new THREE.Vector3(...preset.sunDir).normalize()},uSunColor:{value:new THREE.Color(preset.sunColor)},
uDeepColor:{value:new THREE.Color(preset.waterDeepHex)},uShallowColor:{value:new THREE.Color(preset.waterShallowHex)},
uHorizonColor:{value:new THREE.Color(preset.horizonHex)},uFogColor:{value:new THREE.Color(preset.fogHex)},uFogDensity:{value:preset.fogDensity},
};
const mat=new THREE.ShaderMaterial({
uniforms,
vertexShader:'varying vec3 vWP;void main(){vec4 w=modelMatrix*vec4(position,1.0);vWP=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
fragmentShader:'uniform float uTime,uFogDensity,uMapSpan;uniform sampler2D uHeightMap;uniform vec3 uSunDir,uSunColor,uDeepColor,uShallowColor,uHorizonColor,uFogColor;varying vec3 vWP;float wS(vec2 p,float t){return sin(p.x*0.055+t*1.4)*0.32+cos(p.y*0.068-t*1.25)*0.26+sin((p.x*0.14-p.y*0.11)+t*2.1)*0.16+cos((p.x*0.31+p.y*0.27)-t*2.9)*0.09+sin((p.x*0.68-p.y*0.54)+t*3.8)*0.05;}void main(){vec2 p=vWP.xz;float h0=wS(p,uTime);vec3 N=normalize(vec3((h0-wS(p+vec2(0.85,0.0),uTime))*0.34,1.0,(h0-wS(p+vec2(0.0,0.85),uTime))*0.34));vec3 V=normalize(cameraPosition-vWP);float fr=pow(1.0-max(dot(N,V),0.0),3.4);vec2 uv=p/uMapSpan+0.5;float gH=(uv.x>0.01&&uv.x<0.99&&uv.y>0.01&&uv.y<0.99)?texture2D(uHeightMap,uv).r*100.0-40.0:-38.0;float dp=max(0.0,-gH);vec3 base=mix(uDeepColor,uShallowColor,smoothstep(26.0,2.5,dp)*0.82);float dWarp=max(0.0,dp+h0*1.45);float surf=smoothstep(5.4,0.35,dWarp)*(0.45+0.55*(sin(dWarp*2.6-uTime*3.1+h0*2.4)*0.5+0.5));float ndh=max(dot(N,normalize(normalize(uSunDir)+V)),0.0);vec3 col=mix(base,uHorizonColor*0.92,clamp(fr*0.72,0.0,0.78))+uSunColor*(pow(ndh,240.0)*2.4+pow(ndh,42.0)*0.28);col=mix(col,vec3(0.92,0.96,0.99),clamp(surf*0.8+smoothstep(0.62,0.86,h0)*0.16,0.0,0.92));gl_FragColor=vec4(mix(col,uFogColor,clamp(1.0-exp(-pow(length(cameraPosition-vWP)*uFogDensity,2.0)),0.0,1.0)),1.0);}',
});
const geom=new THREE.PlaneGeometry(WORLD_CONFIG.oceanSpanM,WORLD_CONFIG.oceanSpanM,1,1);geom.rotateX(-Math.PI/2);
const mesh=new THREE.Mesh(geom,mat);mesh.position.y=WORLD_CONFIG.seaLevelY;mesh.name='ArchipelagoOcean';
return {mesh,uniforms};
}
function bakeCoastalHeightTexture(size) {
const data=new Uint8Array(size*size*4);const span=WORLD_CONFIG.terrainSpanM;
for(let y=0;y<size;y++)for(let x=0;x<size;x++){
const v=Math.max(0,Math.min(255,Math.round(((sampleArchipelagoHeight(((x/(size-1))-0.5)*span,((y/(size-1))-0.5)*span)+40)/100)*255)));
const idx=(y*size+x)*4;data[idx]=data[idx+1]=data[idx+2]=v;data[idx+3]=255;
}
const tex=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);tex.magFilter=tex.minFilter=THREE.LinearFilter;tex.needsUpdate=true;return tex;
}
function buildAlpineConiferForests() {
const spots=[];
for(let i=0;i<4200&&spots.length<1550;i++){
const x=(hash2(i*1.37,17.4)-0.5)*4400;const z=(hash2(29.1,i*2.13)-0.5)*4400;
if((Math.abs(x)<520&&Math.abs(z)<126)||Math.hypot(x+210,z-240)<135||Math.hypot(x+1520,z+520)<105||Math.hypot(x+1260,z-420)<80)continue;
const y=sampleArchipelagoHeight(x,z);
if(y<12||y>168||valueNoise(x*0.0045+2.1,z*0.0045-1.3)<(Math.hypot(x,z)<1200?0.26:0.36))continue;
if(Math.hypot((sampleArchipelagoHeight(x+10,z)-y)/10,(sampleArchipelagoHeight(x,z+10)-y)/10)>0.48)continue;
spots.push([x,y,z,0.55+hash2(i*3.1,i*0.7)*0.78]);
}
const treeGroup=new THREE.Group();
const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.75,1.15,5.5,5),new THREE.MeshStandardMaterial({color:0x453123,roughness:0.95}),spots.length);
const bMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.88});
const tiers=[new THREE.InstancedMesh(new THREE.ConeGeometry(5.6,10,7),bMat,spots.length),new THREE.InstancedMesh(new THREE.ConeGeometry(4.3,9.2,7),bMat,spots.length),new THREE.InstancedMesh(new THREE.ConeGeometry(2.9,8.2,7),bMat,spots.length)];
const ty=[7.2,12.2,16.8];const d=new THREE.Object3D();const c=new THREE.Color();
for(let i=0;i<spots.length;i++){
const [x,y,z,sc]=spots[i];const hs=sc*(0.88+(i%5)*0.07);const yaw=(i*1.7)%(Math.PI*2);
d.position.set(x,y+1.8*hs,z);d.scale.set(sc,hs,sc);d.rotation.set(0,yaw,0);d.updateMatrix();trunks.setMatrixAt(i,d.matrix);
for(let t=0;t<3;t++){d.position.set(x,y+ty[t]*hs,z);d.rotation.set(0,yaw+t*0.6,0);d.updateMatrix();tiers[t].setMatrixAt(i,d.matrix);c.setHSL(0.32+(i%7)*0.011,0.34,0.16+t*0.038+(i%4)*0.016);tiers[t].setColorAt(i,c);}
}
trunks.instanceMatrix.needsUpdate=true;treeGroup.add(trunks);
for(const t of tiers){t.castShadow=t.receiveShadow=true;t.instanceMatrix.needsUpdate=true;if(t.instanceColor)t.instanceColor.needsUpdate=true;treeGroup.add(t);}
return treeGroup;
}
const smoothstep=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const hash2=(x,z)=>{const s=Math.sin(x*127.1+z*311.7)*43758.5453123;return s-Math.floor(s);};
const gauss=(x,z,cx,cz,rx,rz)=>Math.exp(-(((x-cx)/rx)**2+((z-cz)/rz)**2));
function valueNoise(x, z) {
const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,ux=fx*fx*(3-2*fx),uz=fz*fz*(3-2*fz),a=hash2(ix,iz),b=hash2(ix+1,iz),c=hash2(ix,iz+1),d=hash2(ix+1,iz+1);return a+(b-a)*ux+(c-a)*uz+(a-b-c+d)*ux*uz;
}
function fbm(x, z, octaves = 4) {
let s=0,a=0.5,f=1;for(let i=0;i<octaves;i++){s+=a*(valueNoise(x*f,z*f)*2-1);f*=2.04;a*=0.5;}return s;
}
function ridgedNoise(x, z) {
let s=0,a=0.55,f=1;for(let i=0;i<3;i++){const n=1-Math.abs(valueNoise(x*f,z*f)*2-1);s+=a*n*n;f*=2.15;a*=0.48;}return s;
}
