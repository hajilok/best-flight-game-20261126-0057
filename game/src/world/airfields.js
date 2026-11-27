// Kestrel Runway 09/27 with live PAPI & glow lights, architectural ATC tower, Harbor Village, Carrier, Bridge, and Outpost.
import * as THREE from '../../vendor/three.module.min.js';
export const AIRFIELD_RUNWAYS = [
{id:'kestrel-09',name:'KESTREL AIRFIELD RWY 09/27',centerX:0,centerZ:0,elevationM:22.0,lengthM:840,widthM:36,yawRad:0,hasArrestor:false,papiOrigin:new THREE.Vector3(-370,22.5,30)},
{id:'carrier-07',name:'OFFSHORE CARRIER BARGE RV-07',centerX:1460,centerZ:1120,elevationM:11.5,lengthM:255,widthM:44,yawRad:0,hasArrestor:true,papiOrigin:new THREE.Vector3(1350,12.2,1144)},
];
export function buildMainIslandAirfield(scene) {
const group=new THREE.Group();group.name='KestrelIslandAirfield';
const rwy=AIRFIELD_RUNWAYS[0];const deckY=rwy.elevationM;const glowTex=createLightHaloTexture();
put(group,box(rwy.lengthM+26,1,rwy.widthM+20),std({color:0x3b403c,roughness:0.96}),[0,deckY-0.55,0],null,false,true);
put(group,pln(rwy.lengthM,rwy.widthM),std({map:createWeatheredRunwayTexture(),roughness:0.84,metalness:0.06}),[0,deckY+0.06,0],[-Math.PI/2,0,0],false,true);
put(group,pln(260,66),std({color:0x323840,roughness:0.88}),[-40,deckY+0.04,-52],[-Math.PI/2,0,0],false,true);
const postMat=std({color:0x262d36,roughness:0.6,metalness:0.55});const postGeom=cyl(0.16,0.24,0.72,6);
const addLight=(x,y,z,col,sc=3.5)=>{
put(group,postGeom,postMat,[x,y-0.34,z]);
return halo(group,glowTex,x,y+0.22,z,col,sc);
};
for(let x=-410;x<=410;x+=48){addLight(x,deckY+0.48,-(rwy.widthM*0.5+2),0xffdf8c,3.2);addLight(x,deckY+0.48,rwy.widthM*0.5+2,0xffdf8c,3.2);}
for(let z=-15;z<=15;z+=6){addLight(-422,deckY+0.48,z,0x4cff9f,3.6);addLight(422,deckY+0.48,z,0xff4c4c,3.6);}
const approachStrobes=[];
for(let i=1;i<=5;i++)approachStrobes.push(addLight(-422-i*26,deckY+0.45-i*0.3,0,0xffffff,5));
for(const cz of [-14,-7,7,14])addLight(-474,deckY+0.3,cz,0xffd27d,3.5);
const papiLights=[];const boxMat=std({color:0x1d232b,roughness:0.6});
for(let i=0;i<4;i++){
put(group,box(2.6,1.4,2.6),boxMat,[-368,deckY+0.7,24+i*5]);
papiLights.push(halo(group,glowTex,-370,deckY+1.4,24+i*5,i<2?0xfff8e6:0xff3b3b,7.2).material);
}
const conc=std({color:0xc9c3b8,roughness:0.86});const dark=std({color:0x2a333e,roughness:0.48,metalness:0.62});
const acc=std({color:0xd95130,roughness:0.5});
const cabGlass=std({color:0x1d3f4f,emissive:0x123242,emissiveIntensity:0.6,roughness:0.14,metalness:0.78,transparent:true,opacity:0.86});
const tower=new THREE.Group();tower.position.set(-148,deckY,-64);
put(tower,box(13,7,13),conc,[0,3.5,0],null,true);
put(tower,cyl(4.5,5.8,28,8),conc,[0,15,0],null,true);
for(let r=0;r<4;r++)put(tower,box(11.6,26,1.2),dark,[0,15,0],[0,(r*Math.PI)/4,0]);
put(tower,cyl(10.8,9.6,1.5,8),dark,[0,29.2,0]);
put(tower,cyl(5.2,5.2,2.2,8),bas({color:0xffd27d}),[0,32.2,0]);
put(tower,cyl(9.6,7.6,6.8,8),cabGlass,[0,33.4,0]);
for(let m=0;m<8;m++){const a=(m/8)*Math.PI*2;put(tower,box(0.65,7.2,0.65),dark,[Math.cos(a)*8.4,33.4,Math.sin(a)*8.4],[0,-a,0.24]);}
put(tower,cyl(11.4,10.2,1.8,8),dark,[0,37.6,0]);put(tower,cyl(10.6,10.6,0.8,8),acc,[0,38.6,0]);
const radarPivot=new THREE.Group();radarPivot.position.y=40.8;
put(radarPivot,box(11,1.3,1.4),conc);put(radarPivot,cyl(0.4,0.6,2.4,6),dark,[0,-1.2,0]);tower.add(radarPivot);
const towerBeacon=halo(tower,glowTex,0,44.2,0,0xff4040,7.5);group.add(tower);
const hangarMat=std({color:0x4d5e6d,roughness:0.54,metalness:0.45});const signTex=createHangarSignTexture();
for(let i=0;i<2;i++){
const h=new THREE.Group();h.position.set(-42+i*74,deckY,-68);
put(h,box(52,15,32),hangarMat,[0,7.5,0],null,true);
put(h,cyl(16,16,52,16,1,false,0,Math.PI),hangarMat,[0,15,0],[0,0,Math.PI/2]);
for(let rx=-22;rx<=22;rx+=11)put(h,new THREE.TorusGeometry(16.2,0.35,6,16,Math.PI),dark,[rx,15,0],[0,Math.PI/2,0]);
put(h,box(36,11.4,1),dark,[0,5.7,15.8]);
put(h,pln(33,9.8),bas({color:0xffcf78}),[0,5.2,16.35]);
put(h,box(10,8.6,0.4),dark,[-12,4.8,16.4]);
put(h,pln(38,3.2),bas({map:signTex}),[0,13.4,16.35]);group.add(h);
put(group,cyl(5.5,5.5,12,14),conc,[114+i*16,deckY+6,-68],null,true);
}
const parked=new THREE.Group();parked.position.set(-18,deckY+1.4,-36);parked.rotation.y=0.45;
put(parked,box(1.4,1.2,7.2),std({color:0xf0b83a,roughness:0.4}),[0,0,0],null,true);
put(parked,box(10.5,0.2,1.6),conc,[0,0.45,-0.4],null,true);
put(parked,box(0.2,2,1.4),acc,[0,0.9,3]);group.add(parked);
const sock=new THREE.Group();sock.position.set(-345,deckY,-34);put(sock,cyl(0.35,0.45,13,6),conc,[0,6.5,0]);
const windsockArm=new THREE.Group();windsockArm.position.y=12.4;
put(windsockArm,new THREE.ConeGeometry(1.6,8.6,8,1,true),std({color:0xff6229,emissive:0x611c06,side:THREE.DoubleSide}),[4.4,0,0],[0,0,-Math.PI/2]);
sock.add(windsockArm);group.add(sock);scene.add(group);
return {group,papiLights,radarPivot,windsockArm,approachStrobes,towerBeacon};
}
export function updatePapiApproachLights(airfield, playerPos, elapsedSec, windWorld) {
const o=AIRFIELD_RUNWAYS[0].papiOrigin;
const glide=(Math.atan2(Math.max(0,playerPos.y-o.y),Math.max(25,o.x-playerPos.x))*180)/Math.PI;
[2.2,2.75,3.35,4.1].forEach((th,i)=>airfield.papiLights[i].color.setHex(glide>=th?0xfff8e6:0xff3b3b));
airfield.radarPivot.rotation.y=elapsedSec*1.4;
airfield.towerBeacon.visible=Math.sin(elapsedSec*4.2)>-0.2;
airfield.windsockArm.rotation.y=-Math.atan2(windWorld.z,windWorld.x)+Math.sin(elapsedSec*4.5)*0.08;
const active=Math.floor(elapsedSec*6)%airfield.approachStrobes.length;
for(let i=0;i<airfield.approachStrobes.length;i++)airfield.approachStrobes[i].material.color.setHex(airfield.approachStrobes.length-1-i===active?0xffffff:0x567c8c);
}
export function buildOffshoreCarrierBarge(scene) {
const rwy=AIRFIELD_RUNWAYS[1];const group=new THREE.Group();group.name='OffshoreCarrierBarge';group.position.set(rwy.centerX,0,rwy.centerZ);
const hull=std({color:0x394554,roughness:0.62,metalness:0.45});
put(group,box(rwy.lengthM,14,rwy.widthM+4),hull,[0,rwy.elevationM-7.1,0],null,true,true);
put(group,pln(rwy.lengthM,rwy.widthM),std({map:createCarrierDeckTexture(),roughness:0.8,metalness:0.16}),[0,rwy.elevationM+0.05,0],[-Math.PI/2,0,0],false,true);
put(group,box(36,18,11),hull,[22,rwy.elevationM+9,-rwy.widthM*0.5-3],null,true);
put(group,box(22,4,11.4),std({color:0x58d4e8,emissive:0x20798c,emissiveIntensity:1}),[22,rwy.elevationM+14,-rwy.widthM*0.5-3]);
const glowTex=createLightHaloTexture();
for(let x=-116;x<=116;x+=29)for(const s of [-1,1])halo(group,glowTex,x,rwy.elevationM+1.4,s*(rwy.widthM*0.5-1),0xffc44d,4.5);
scene.add(group);return group;
}
export function buildSuspensionBridge(scene) {
const group=new THREE.Group();group.name='BasaltStraitBridge';group.position.set(440,0,-1040);
const red=std({color:0xc24330,roughness:0.44,metalness:0.42});const conc=std({color:0x7e858c,roughness:0.88});
const deck=std({color:0x2b333e,roughness:0.82});const cab=std({color:0x3b444e,roughness:0.65,metalness:0.5});
const glowTex=createLightHaloTexture();const span=620;const deckY=82;
put(group,box(span,6.5,22),deck,[0,deckY,0],null,true);
for(const ax of [-300,300])put(group,box(38,108,32),conc,[ax,46,0]);
for(const tx of [-128,128]){
put(group,box(20,32,34),conc,[tx,8,0]);
for(const tz of [-10,10])put(group,box(11,200,9),red,[tx,98,tz],null,true);
for(const cy of [52,114,168,192])put(group,box(9,7,26),red,[tx,cy,0]);
halo(group,glowTex,tx,202,0,0xff4545,9);
}
for(const side of [-10,10]){
const pts=[];
for(let i=0;i<=24;i++){
const x=-span*0.5+(i/24)*span;
const y=Math.abs(x)<=128?102+(x/128)**2*90:192-((Math.abs(x)-128)/182)*104;
pts.push(new THREE.Vector3(x,y,side));
if(i%2===1&&Math.abs(x)<285){const l=Math.max(4,y-deckY);put(group,cyl(0.4,0.4,l,5),cab,[x,deckY+l*0.5,side]);}
}
group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),36,1.5,6,false),red));
}
scene.add(group);return group;
}
export function buildArchipelagoLandmarks(scene, sampleHeight) {
const group=new THREE.Group();group.name='ArchipelagoLandmarks';
const wMat=std({color:0xf0ece4,roughness:0.74});const rMat=std({color:0xc93f32,roughness:0.65});
const roof=std({color:0x9c4632,roughness:0.78});const timb=std({color:0x5c4636,roughness:0.9});
const win=bas({color:0xffdf82});const glowTex=createLightHaloTexture();
for(const [cx,cz,cw,ch,cd,rot]of [[-235,225,16,9,12,0.2],[-202,212,14,8,11,-0.15],[-172,232,18,10,12,0.08],[-248,194,15,9,11,0.4],[-145,216,14,8,10,-0.3],[-218,252,16,8,11,0.12]]){
const h=new THREE.Group();h.position.set(cx,Math.max(3,sampleHeight(cx,cz)),cz);h.rotation.y=rot;
put(h,box(cw,ch,cd),wMat,[0,ch*0.5,0],null,true);
put(h,new THREE.ConeGeometry(Math.max(cw,cd)*0.72,ch*0.65,4),roof,[0,ch*1.3,0],[0,Math.PI/4,0]);
put(h,box(cw*0.65,2.4,cd+0.4),win,[0,ch*0.52,0]);group.add(h);
}
put(group,box(12,2.2,68),timb,[-210,2.5,286]);put(group,box(42,2.2,10),timb,[-195,2.5,315]);
const lh=new THREE.Group();lh.position.set(-1260,sampleHeight(-1260,420),420);
for(let i=0;i<4;i++)put(lh,cyl(4.2-i*0.45,4.65-i*0.45,9,10),i%2===0?wMat:rMat,[0,4.5+i*9,0],null,true);
put(lh,cyl(3.2,3.2,5.5,10),bas({color:0xffe89e}),[0,38.5,0]);group.add(lh);
const turbineRotors=[];
for(const [tx,tz]of [[-1620,-290],[-1740,-410],[-1480,-260]]){
const t=new THREE.Group();t.position.set(tx,sampleHeight(tx,tz),tz);put(t,cyl(1.1,2.3,56,8),wMat,[0,28,0]);
const rot=new THREE.Group();rot.position.set(0,56,2.5);
for(let b=0;b<3;b++){const h=new THREE.Group();h.rotation.z=(b*Math.PI*2)/3;put(h,box(1.8,25,0.6),wMat,[0,12.5,0]);rot.add(h);}
t.add(rot);turbineRotors.push(rot);group.add(t);
}
const out=new THREE.Group();out.position.set(-1520,sampleHeight(-1520,-520),-520);
put(out,box(32,12,20),std({color:0xe66a30,roughness:0.55}),[-28,6,-18],null,true);
put(out,box(20,4.6,20.6),win,[-28,6.6,-18]);
put(out,box(22,10,15),wMat,[28,5,-22],null,true);put(out,box(14,3.8,15.6),win,[28,5.6,-22]);
put(out,cyl(0.6,1.3,52,6),rMat,[-40,26,-8]);
const outpostBeacon=halo(out,glowTex,-40,54,-8,0xff4242,16);
const pl=new THREE.PointLight(0xffb463,2.8,260,1.2);pl.position.set(0,28,0);out.add(pl);
put(out,cyl(30,32,1.6,20),std({color:0x3b444e,roughness:0.85}),[0,0.8,0]);
for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2;halo(out,glowTex,Math.cos(a)*28,3,Math.sin(a)*28,0xffc85c,8.5);}
group.add(out);
const boats=[];
for(const [bx,bz,yaw]of [[-480,-560,0.45],[960,540,-1.1],[430,-690,0.08],[-192,345,1.1]]){
const b=new THREE.Group();b.position.set(bx,1.2,bz);b.rotation.y=yaw;
put(b,box(8,3.5,26),wMat);put(b,box(6,4.5,8),rMat,[0,3.6,-2]);
put(b,new THREE.ConeGeometry(8,42,4),bas({color:0xe6f7ff,transparent:true,opacity:0.42}),[0,-0.8,32],[Math.PI/2,0,0]);
group.add(b);boats.push(b);
}
scene.add(group);
return {
group,
update(t){
for(let i=0;i<turbineRotors.length;i++)turbineRotors[i].rotation.z=t*(1.5+i*0.12);
for(let i=0;i<boats.length;i++)boats[i].position.y=1.1+Math.sin(t*1.8+i)*0.35;
outpostBeacon.visible=Math.sin(t*5.2)>-0.3;
},
};
}
const std=(o)=>new THREE.MeshStandardMaterial(o);const bas=(o)=>new THREE.MeshBasicMaterial(o);
const box=(...a)=>new THREE.BoxGeometry(...a);const cyl=(...a)=>new THREE.CylinderGeometry(...a);const pln=(...a)=>new THREE.PlaneGeometry(...a);
function placeAirfieldMesh(parent, geometry, material, pos, rot, castShadow = false, receiveShadow = false) {
const o=new THREE.Mesh(geometry,material);if(pos)o.position.set(...pos);if(rot)o.rotation.set(...rot);if(castShadow)o.castShadow=true;if(receiveShadow)o.receiveShadow=true;parent.add(o);return o;
}
function attachLightHalo(parent, haloTex, x, y, z, colorHex, scale) {
const s=new THREE.Sprite(new THREE.SpriteMaterial({map:haloTex,color:colorHex,transparent:true,opacity:0.92,blending:THREE.AdditiveBlending,depthWrite:false}));s.position.set(x,y,z);s.scale.set(scale,scale,1);parent.add(s);return s;
}
function createLightHaloTexture() {
const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d');
const g=ctx.createRadialGradient(32,32,2,32,32,30);
g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(0.28,'rgba(255,245,220,0.85)');g.addColorStop(0.65,'rgba(255,220,170,0.22)');g.addColorStop(1,'rgba(255,200,140,0)');
ctx.fillStyle=g;ctx.fillRect(0,0,64,64);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function createHangarSignTexture() {
const c=document.createElement('canvas');c.width=512;c.height=48;const ctx=c.getContext('2d');
ctx.fillStyle='#1b2632';ctx.fillRect(0,0,512,48);ctx.fillStyle='#f2ad3a';ctx.fillRect(0,0,512,5);ctx.fillRect(0,43,512,5);
ctx.fillStyle='#eef5fa';ctx.font='bold 24px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('KESTREL OPS · HANGAR 09',256,25);
const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function createWeatheredRunwayTexture() {
const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');
ctx.fillStyle='#30363f';ctx.fillRect(0,0,1024,256);
for(let i=0;i<1600;i++){const s=42+(i%18);ctx.fillStyle=`rgb(${s},${s + 4},${s + 9})`;ctx.fillRect(Math.abs((Math.sin(i*12.9898)*43758.5453)%1)*1024,Math.abs((Math.sin(i*78.233)*23421.631)%1)*256,3,2);}
ctx.fillStyle='rgba(18,21,26,0.45)';for(let x=64;x<980;x+=72)ctx.fillRect(x,12,2,232);
ctx.fillStyle='rgba(10,12,15,0.46)';ctx.fillRect(148,56,190,144);ctx.fillRect(686,56,190,144);
ctx.fillStyle='rgba(7,9,11,0.55)';for(let i=0;i<8;i++){ctx.fillRect(160+i*22,92,34,8);ctx.fillRect(160+i*22,156,34,8);}
ctx.fillStyle='#e5ebf0';ctx.fillRect(12,14,1000,5);ctx.fillRect(12,237,1000,5);
for(let i=0;i<6;i++){ctx.fillRect(26,34+i*33,52,16);ctx.fillRect(946,34+i*33,52,16);}
for(const [x,y]of [[175,56],[175,178],[781,56],[781,178]])ctx.fillRect(x,y,68,22);
for(let x=154;x<860;x+=58)ctx.fillRect(x,124,34,7);
ctx.fillStyle='#edb43e';ctx.fillRect(360,8,92,4);
ctx.fillStyle='#eef3f7';ctx.font='bold 54px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
for(const [x,rot,lbl]of [[116,Math.PI/2,'09'],[908,-Math.PI/2,'27']]){ctx.save();ctx.translate(x,128);ctx.rotate(rot);ctx.fillText(lbl,0,0);ctx.restore();}
const t=new THREE.CanvasTexture(c);t.anisotropy=8;t.colorSpace=THREE.SRGBColorSpace;return t;
}
function createCarrierDeckTexture() {
const c=document.createElement('canvas');c.width=512;c.height=160;const ctx=c.getContext('2d');
ctx.fillStyle='#2d3540';ctx.fillRect(0,0,512,160);ctx.fillStyle='#f5b83d';ctx.fillRect(8,10,496,5);ctx.fillRect(8,145,496,5);
ctx.fillStyle='#edf3f8';for(let x=60;x<460;x+=38)ctx.fillRect(x,77,22,6);
ctx.fillStyle='#9aa6b5';for(let i=0;i<4;i++)ctx.fillRect(105+i*26,22,3,116);
ctx.save();ctx.fillStyle='#f5b83d';ctx.font='bold 44px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.translate(48,80);ctx.rotate(Math.PI/2);ctx.fillText('07',0,0);ctx.restore();
const t=new THREE.CanvasTexture(c);t.anisotropy=8;t.colorSpace=THREE.SRGBColorSpace;return t;
}
const put=placeAirfieldMesh,halo=attachLightHalo;
