// Kestrel Island Runway 09/27 with live PAPI approach lights, Carrier Barge, Suspension Bridge, and landmarks.
import * as THREE from '../../vendor/three.module.min.js';
export const AIRFIELD_RUNWAYS=[
 { id: 'kestrel-09', name: 'KESTREL AIRFIELD RWY 09/27', centerX: 0, centerZ: 0, elevationM: 22.0, lengthM: 840, widthM: 36, yawRad: 0, hasArrestor: false, papiOrigin: new THREE.Vector3(-370,22.5,30) },
 { id: 'carrier-07', name: 'OFFSHORE CARRIER BARGE RV-07', centerX: 1460, centerZ: 1120, elevationM: 11.5, lengthM: 255, widthM: 44, yawRad: 0, hasArrestor: true, papiOrigin: new THREE.Vector3(1350,12.2,1144) },
];
/** Build Kestrel Island Airfield: Runway. */
export function buildMainIslandAirfield(scene) {
 const group=new THREE.Group();
 group.name='KestrelIslandAirfield';
 const rwy=AIRFIELD_RUNWAYS[0];
 const deckY=rwy.elevationM;
 put(group, boxG(rwy.lengthM + 26,1, rwy.widthM + 18), stdMat({ color: 0x3b4240, roughness: 0.96 }), [0, deckY - 0.55,0], null, false, true);
 put(group, new THREE.PlaneGeometry(rwy.lengthM, rwy.widthM), stdMat({ map: createRunwayCanvasTexture(), roughness: 0.85, metalness: 0.08 }), [0, deckY + 0.06,0], [-Math.PI / 2,0,0], false, true);
 put(group, new THREE.PlaneGeometry(235,58), stdMat({ color: 0x333942, roughness: 0.9 }), [-40, deckY + 0.04,-48], [-Math.PI / 2,0,0], false, true);
 const edgeGeom=sphG(1.05,8,6);
 const warmMat=basMat({ color: 0xffe49c });
 const greenMat=basMat({ color: 0x4cff9f });
 const redMat=basMat({ color: 0xff4c4c });
 for (let x=-410; x <= 410; x += 50) {
  put(group, edgeGeom, warmMat, [x, deckY + 0.9, -(rwy.widthM * 0.5 + 2.2)]);
  put(group, edgeGeom, warmMat, [x, deckY + 0.9, rwy.widthM * 0.5 + 2.2]);
 }
 for (let z=-15; z <= 15; z += 6) {
  put(group, edgeGeom, greenMat, [-422, deckY + 0.9, z]);
  put(group, edgeGeom, redMat, [422, deckY + 0.9, z]);
 }
 const approachStrobes=[];
 for (let i=1; i <= 5; i++) {
  approachStrobes.push(put(group, sphG(1.8,8,6), basMat({ color: 0xffffff }), [-422 - i * 26, deckY + 0.6 - i * 0.35,0]));
 }
 for (const cz of [-14,-7,7,14]) put(group, sphG(1.3,8,6), warmMat, [-474, deckY + 0.4, cz]);
 const papiLights=[];
 const boxMat=stdMat({ color: 0x20262d, roughness: 0.7 });
 for (let i=0; i < 4; i++) {
  put(group, boxG(3.0,1.8,3.0), boxMat, [-368, deckY + 0.9,25 + i * 5.2]);
  const lampMat=basMat({ color: i < 2 ? 0xffffff : 0xff3b3b });
  put(group, sphG(2.1,10,8), lampMat, [-370, deckY + 1.5,25 + i * 5.2]);
  papiLights.push(lampMat);
 }
 const concreteMat=stdMat({ color: 0xe6e2d8, roughness: 0.8 });
 const accentMat=stdMat({ color: 0xe05534, roughness: 0.55 });
 const glassMat=stdMat({ color: 0x62e2ff, emissive: 0x268ea8, emissiveIntensity: 1.25, roughness: 0.15, metalness: 0.5 });
 const tower=new THREE.Group();
 tower.position.set(-145, deckY,-62);
 put(tower, cylG(4.8,6.4,29,8), concreteMat, [0,14.5,0], null, true);
 put(tower, cylG(9.6,7.2,7.2,8), glassMat, [0,32,0]);
 put(tower, cylG(10.8,10.0,2.2,8), accentMat, [0,36.6,0]);
 const radarPivot=new THREE.Group();
 radarPivot.position.y=39.4;
 put(radarPivot, boxG(10.5,1.5,1.6), concreteMat);
 tower.add(radarPivot);
 const towerBeacon=put(tower, sphG(1.7,8,8), basMat({ color: 0xff4545 }), [0,42.6,0]);
 group.add(tower);
 const hangarMat=stdMat({ color: 0x6b7f8f, roughness: 0.58, metalness: 0.35 });
 const stripeMat=stdMat({ color: 0xf0ab38, roughness: 0.5 });
 const warmBayMat=basMat({ color: 0xffcf7a });
 for (let i=0; i < 2; i++) {
  const h=new THREE.Group();
  h.position.set(-45 + i * 70, deckY,-64);
  put(h, boxG(48,15,32), hangarMat, [0,7.5,0], null, true);
  put(h, cylG(16,16,48,12,1, false,0, Math.PI), hangarMat, [0,15,0], [0,0, Math.PI / 2]);
  put(h, new THREE.PlaneGeometry(34,11), warmBayMat, [0,5.5,16.2]);
  put(h, boxG(48.4,1.6,32.4), stripeMat, [0,13.2,0]);
  group.add(h);
  put(group, cylG(5.5,5.5,12,14), concreteMat, [108 + i * 16, deckY + 6,-64], null, true);
 }
 const sockPivot=new THREE.Group();
 sockPivot.position.set(-345, deckY,-34);
 put(sockPivot, cylG(0.35,0.45,13,6), concreteMat, [0,6.5,0]);
 const windsockArm=new THREE.Group();
 windsockArm.position.y=12.4;
 put(windsockArm, new THREE.ConeGeometry(1.6,8.6,8,1, true), stdMat({ color: 0xff6229, emissive: 0x611c06, side: THREE.DoubleSide }), [4.4,0,0], [0,0, -Math.PI / 2]);
 sockPivot.add(windsockArm);
 group.add(sockPivot);
 scene.add(group);
 return { group, papiLights, radarPivot, windsockArm, approachStrobes, towerBeacon };
}
/** Update live 4-light PAPI glide-slope. */
export function updatePapiApproachLights(airfield, playerPos, elapsedSec, windWorld) {
 const origin=AIRFIELD_RUNWAYS[0].papiOrigin;
 const glideDeg=(Math.atan2(Math.max(0, playerPos.y - origin.y), Math.max(25, origin.x - playerPos.x)) * 180) / Math.PI;
 const thresholds=[2.2,2.75,3.35,4.1];
 for (let i=0; i < 4; i++) airfield.papiLights[i].color.setHex(glideDeg >= thresholds[i] ? 0xfff8e6 : 0xff3b3b);
 airfield.radarPivot.rotation.y=elapsedSec * 1.4;
 airfield.towerBeacon.visible=Math.sin(elapsedSec * 4.2) > -0.2;
 airfield.windsockArm.rotation.y=-Math.atan2(windWorld.z, windWorld.x) + Math.sin(elapsedSec * 4.5) * 0.08;
 const activeStrobe=Math.floor(elapsedSec * 6) % airfield.approachStrobes.length;
 for (let i=0; i < airfield.approachStrobes.length; i++) {
  const idx=airfield.approachStrobes.length - 1 - i;
  airfield.approachStrobes[i].material.color.setHex(idx === activeStrobe ? 0xffffff : 0x567c8c);
 }
}
/** Build the offshore recovery Carrier. */
export function buildOffshoreCarrierBarge(scene) {
 const rwy=AIRFIELD_RUNWAYS[1];
 const group=new THREE.Group();
 group.name='OffshoreCarrierBarge';
 group.position.set(rwy.centerX,0, rwy.centerZ);
 const hullMat=stdMat({ color: 0x394554, roughness: 0.72, metalness: 0.38 });
 put(group, boxG(rwy.lengthM,14, rwy.widthM + 4), hullMat, [0, rwy.elevationM - 7.1,0], null, true, true);
 put(group, new THREE.PlaneGeometry(rwy.lengthM, rwy.widthM), stdMat({ map: createCarrierDeckTexture(), roughness: 0.82, metalness: 0.14 }), [0, rwy.elevationM + 0.05,0], [-Math.PI / 2,0,0], false, true);
 put(group, boxG(36,18,11), hullMat, [22, rwy.elevationM + 9, -rwy.widthM * 0.5 - 3], null, true);
 put(group, boxG(22,4,11.4), stdMat({ color: 0x58d4e8, emissive: 0x20798c, emissiveIntensity: 0.9 }), [22, rwy.elevationM + 14, -rwy.widthM * 0.5 - 3]);
 const bMat=basMat({ color: 0xffc44d });
 const bGeom=sphG(1.1,8,6);
 for (let x=-116; x <= 116; x += 29) {
  put(group, bGeom, bMat, [x, rwy.elevationM + 1.1, -(rwy.widthM * 0.5 - 1)]);
  put(group, bGeom, bMat, [x, rwy.elevationM + 1.1, rwy.widthM * 0.5 - 1]);
 }
 scene.add(group);
 return group;
}
/** Build the iconic crimson twin-tower. */
export function buildSuspensionBridge(scene) {
 const group=new THREE.Group();
 group.name='BasaltStraitBridge';
 group.position.set(440,0,-1040);
 const steelRed=stdMat({ color: 0xc24634, roughness: 0.52, metalness: 0.35 });
 const concreteMat=stdMat({ color: 0x8d9398, roughness: 0.9 });
 const deckMat=stdMat({ color: 0x2f3742, roughness: 0.85 });
 const cableMat=stdMat({ color: 0x3b444e, roughness: 0.7 });
 const beaconMat=basMat({ color: 0xff4545 });
 const span=620;
 const deckY=82;
 put(group, boxG(span,6.5,22), deckMat, [0, deckY,0], null, true);
 for (const ax of [-300,300]) put(group, boxG(34,96,30), concreteMat, [ax,48,0]);
 for (const tx of [-128,128]) {
  put(group, boxG(18,22,32), concreteMat, [tx,6,0]);
  for (const tz of [-10,10]) put(group, boxG(11,198,9), steelRed, [tx,98, tz], null, true);
  for (const cy of [62,128,182]) put(group, boxG(9,7,26), steelRed, [tx, cy,0]);
  put(group, sphG(2.8,8,8), beaconMat, [tx,200,0]);
 }
 for (const side of [-10,10]) {
  const pts=[];
  for (let i=0; i <= 24; i++) {
  const x=-span * 0.5 + (i / 24) * span;
  const y=Math.abs(x) <= 128 ? 102 + (x / 128) ** 2 * 90 : 192 - ((Math.abs(x) - 128) / 182) * 104;
  pts.push(new THREE.Vector3(x, y, side));
  if (i % 2 === 1 && Math.abs(x) < 285) {
  const len=Math.max(4, y - deckY);
  put(group, cylG(0.38,0.38, len,5), cableMat, [x, deckY + len * 0.5, side]);
  }
  }
  group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),36,1.45,6, false), steelRed));
 }
 scene.add(group);
 return group;
}
/** Build coastal Lighthouse, spinning. */
export function buildArchipelagoLandmarks(scene, sampleHeight) {
 const group=new THREE.Group();
 group.name='ArchipelagoLandmarks';
 const whiteMat=stdMat({ color: 0xf0eee9, roughness: 0.78 });
 const redMat=stdMat({ color: 0xc93f32, roughness: 0.72 });
 const warmWindowMat=basMat({ color: 0xffe08a });
 const lh=new THREE.Group();
 lh.position.set(-1260, sampleHeight(-1260,420),420);
 for (let i=0; i < 4; i++) put(lh, cylG(4.2 - i * 0.45,4.65 - i * 0.45,9,10), i % 2 === 0 ? whiteMat : redMat, [0,4.5 + i * 9,0], null, true);
 put(lh, cylG(3.2,3.2,5.5,10), basMat({ color: 0xffe89e }), [0,38.5,0]);
 group.add(lh);
 const turbineRotors=[];
 for (const [tx, tz] of [[-1620,-290], [-1740,-410], [-1480,-260]]) {
  const turb=new THREE.Group();
  turb.position.set(tx, sampleHeight(tx, tz), tz);
  put(turb, cylG(1.1,2.3,56,8), whiteMat, [0,28,0]);
  const rotor=new THREE.Group();
  rotor.position.set(0,56,2.5);
  for (let b=0; b < 3; b++) {
  const holder=new THREE.Group();
  holder.rotation.z=(b * Math.PI * 2) / 3;
  put(holder, boxG(1.8,25,0.6), whiteMat, [0,12.5,0]);
  rotor.add(holder);
  }
  turb.add(rotor);
  turbineRotors.push(rotor);
  group.add(turb);
 }
 const outpost=new THREE.Group();
 outpost.position.set(-1520, sampleHeight(-1520,-520),-520);
 put(outpost, boxG(30,11,18), stdMat({ color: 0xe36c34, roughness: 0.6 }), [-28,5.5,-18], null, true);
 put(outpost, boxG(18,4.2,18.6), warmWindowMat, [-28,6.2,-18]);
 put(outpost, boxG(20,9,14), whiteMat, [26,4.5,-22], null, true);
 put(outpost, boxG(12,3.5,14.6), warmWindowMat, [26,5.2,-22]);
 put(outpost, cylG(0.6,1.3,46,6), redMat, [-38,23,-8]);
 const outpostBeacon=put(outpost, sphG(2.6,8,8), basMat({ color: 0xff4242 }), [-38,47,-8]);
 put(outpost, cylG(28,30,1.4,20), stdMat({ color: 0x3b444e, roughness: 0.85 }), [0,0.7,0]);
 for (let i=0; i < 8; i++) {
  const a=(i / 8) * Math.PI * 2;
  put(outpost, sphG(1.2,6,6), warmWindowMat, [Math.cos(a) * 26,2.0, Math.sin(a) * 26]);
 }
 group.add(outpost);
 const boats=[];
 for (const [bx, bz, yaw] of [[-480,-560,0.45], [960,540,-1.1], [430,-690,0.08]]) {
  const boat=new THREE.Group();
  boat.position.set(bx,1.2, bz);
  boat.rotation.y=yaw;
  put(boat, boxG(8,3.5,26), whiteMat);
  put(boat, boxG(6,4.5,8), redMat, [0,3.6,-2]);
  put(boat, new THREE.ConeGeometry(8,42,4), basMat({ color: 0xe6f7ff, transparent: true, opacity: 0.45 }), [0,-0.8,32], [Math.PI / 2,0,0]);
  group.add(boat);
  boats.push(boat);
 }
 scene.add(group);
 return {
  group,
  update(t) {
  for (let i=0; i < turbineRotors.length; i++) turbineRotors[i].rotation.z=t * (1.5 + i * 0.12);
  for (let i=0; i < boats.length; i++) boats[i].position.y=1.1 + Math.sin(t * 1.8 + i) * 0.35;
  outpostBeacon.visible=Math.sin(t * 5.2) > -0.3;
  },
 };
}
function put(parent, geom, mat, pos, rot, cast=false, recv=false) {
 const m=new THREE.Mesh(geom, mat);
 if (pos) m.position.set(pos[0], pos[1], pos[2]);
 if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
 if (cast) m.castShadow=true;
 if (recv) m.receiveShadow=true;
 parent.add(m);
 return m;
}
function createRunwayCanvasTexture() {
 const c=document.createElement('canvas');
 c.width=1024; c.height=256;
 const ctx=c.getContext('2d');
 ctx.fillStyle='#262b33'; ctx.fillRect(0,0,1024,256);
 ctx.fillStyle='rgba(10,12,16,0.48)';
 ctx.fillRect(145,58,175,140); ctx.fillRect(704,58,175,140);
 ctx.fillStyle='rgba(6,8,10,0.55)';
 for (let i=0; i < 6; i++) { ctx.fillRect(160 + i * 24,96,38,9); ctx.fillRect(160 + i * 24,150,38,9); }
 ctx.fillStyle='#e7edf2';
 ctx.fillRect(12,14,1000,6); ctx.fillRect(12,236,1000,6);
 for (let i=0; i < 6; i++) { ctx.fillRect(26,34 + i * 33,54,18); ctx.fillRect(944,34 + i * 33,54,18); }
 ctx.fillRect(175,54,72,26); ctx.fillRect(175,176,72,26);
 ctx.fillRect(777,54,72,26); ctx.fillRect(777,176,72,26);
 for (let x=152; x < 860; x += 58) ctx.fillRect(x,124,34,8);
 ctx.fillStyle='#f2f6fa'; ctx.font='bold 56px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
 for (const [x, rot, label] of [[116, Math.PI / 2, '09'], [908, -Math.PI / 2, '27']]) {
  ctx.save(); ctx.translate(x,128); ctx.rotate(rot); ctx.fillText(label,0,0); ctx.restore();
 }
 const tex=new THREE.CanvasTexture(c);
 tex.anisotropy=8; tex.colorSpace=THREE.SRGBColorSpace;
 return tex;
}
function createCarrierDeckTexture() {
 const c=document.createElement('canvas');
 c.width=512; c.height=160;
 const ctx=c.getContext('2d');
 ctx.fillStyle='#2d3540'; ctx.fillRect(0,0,512,160);
 ctx.fillStyle='#f5b83d'; ctx.fillRect(8,10,496,5); ctx.fillRect(8,145,496,5);
 ctx.fillStyle='#edf3f8';
 for (let x=60; x < 460; x += 38) ctx.fillRect(x,77,22,6);
 ctx.fillStyle='#9aa6b5';
 for (let i=0; i < 4; i++) ctx.fillRect(105 + i * 26,22,3,116);
 ctx.save(); ctx.fillStyle='#f5b83d'; ctx.font='bold 44px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
 ctx.translate(48,80); ctx.rotate(Math.PI / 2); ctx.fillText('07',0,0); ctx.restore();
 const tex=new THREE.CanvasTexture(c);
 tex.anisotropy=8; tex.colorSpace=THREE.SRGBColorSpace;
 return tex;
}
const stdMat=(o) => new THREE.MeshStandardMaterial(o);
const basMat=(o) => new THREE.MeshBasicMaterial(o);
const boxG=(...a) => new THREE.BoxGeometry(...a);
const cylG=(...a) => new THREE.CylinderGeometry(...a);
const sphG=(...a) => new THREE.SphereGeometry(...a);
