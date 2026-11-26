// Built 3D KW-4 Kestrel STOL utility jet with articulated control surfaces, additive feathered plumes, and wispy tire smoke.
import * as THREE from '../../vendor/three.module.min.js';
/** Build the sculpted twin-tail KW-4. */
export function buildKestrelAircraft(scene) {
 const root=new THREE.Group();
 root.name='KW4KestrelAircraft';
 const exterior=new THREE.Group();
 exterior.name='KestrelExterior';
 root.add(exterior);
 const hullMat=stdMat({ map: createAirframePanelTexture(), roughness: 0.36, metalness: 0.28 });
 const slateMat=stdMat({ color: 0x26394b, roughness: 0.42, metalness: 0.38 });
 const orangeMat=stdMat({ color: 0xec5a28, roughness: 0.35, metalness: 0.18 });
 const chromeMat=stdMat({ color: 0xb7c6d4, roughness: 0.22, metalness: 0.85 });
 const darkMat=stdMat({ color: 0x1d252e, roughness: 0.55, metalness: 0.65 });
 const canopyMat=new THREE.MeshPhysicalMaterial({
  color: 0x4ca8c8, emissive: 0x0e2a38, emissiveIntensity: 0.35, roughness: 0.08, metalness: 0.15, transparent: true, opacity: 0.52,
 });
 const body=addMesh(exterior, cylG(0.95,1.15,7.6,14), hullMat, [0,0,0.3], [Math.PI / 2,0,0], true);
 body.scale.set(1.06,0.88,1);
 const nose=addMesh(exterior, new THREE.ConeGeometry(0.96,3.4,14), slateMat, [0,-0.04,-5.2], [-Math.PI / 2,0,0], true);
 nose.scale.set(1.04,1,0.86);
 const pitot=addMesh(exterior, cylG(0.03,0.06,1.2,6), chromeMat, [0,-0.05,-7.25], [Math.PI / 2,0,0]);
 addMesh(exterior, boxG(0.95,0.68,4.4), hullMat, [0,0.72,1.85], null, true);
 const airbrakePivot=new THREE.Group();
 airbrakePivot.position.set(0,1.06,1.05);
 addMesh(airbrakePivot, boxG(0.76,0.08,1.45), orangeMat, [0,0.04,0.72]);
 exterior.add(airbrakePivot);
 const canopy=new THREE.Group();
 canopy.position.set(0,0.72,-1.9);
 addMesh(canopy, boxG(1.18,0.52,2.75), darkMat, [0,-0.08,0.1]);
 addMesh(canopy, boxG(0.92,0.34,0.18), basMat({ color: 0x56f7b0 }), [0,0.28,-0.96], [-0.35,0,0]);
 addMesh(canopy, new THREE.PlaneGeometry(0.46,0.32), basMat({ color: 0x62ffbe, transparent: true, opacity: 0.48, side: THREE.DoubleSide }), [0,0.56,-0.82], [-0.3,0,0]);
 addMesh(canopy, sphG(0.28,10,8), stdMat({ color: 0xf0f4f8, roughness: 0.25 }), [0,0.42,0.12]);
 addMesh(canopy, sphG(0.24,8,6), stdMat({ color: 0xf5a623, roughness: 0.12, metalness: 0.9 }), [0,0.41,-0.02]);
 const bubble=addMesh(canopy, sphG(0.84,14,10,0, Math.PI * 2,0, Math.PI * 0.55), canopyMat, [0,0.1,0.1]);
 bubble.scale.set(0.84,0.88,2.05);
 addMesh(canopy, new THREE.TorusGeometry(0.71,0.045,6,14, Math.PI), darkMat, [0,0.14,-0.35]);
 exterior.add(canopy);
 const leftFlameGroup=new THREE.Group();
 const rightFlameGroup=new THREE.Group();
 const plumeTex=createExhaustPlumeTexture();
 const flameOuterMat=basMat({
  map: plumeTex, color: 0xffa640, transparent: true, opacity: 0.78, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
 });
 const flameCoreMat=basMat({
  map: plumeTex, color: 0xbaf6ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
 });
 for (const side of [-1,1]) {
  addMesh(exterior, cylG(0.46,0.52,5.1,12), slateMat, [side * 0.88,-0.08,1.75], [Math.PI / 2,0,0], true);
  addMesh(exterior, new THREE.TorusGeometry(0.44,0.06,8,14), chromeMat, [side * 0.88,-0.08,-0.82]);
  addMesh(exterior, cylG(0.42,0.34,0.85,12), darkMat, [side * 0.88,-0.08,4.45], [Math.PI / 2,0,0]);
  addMesh(exterior, new THREE.RingGeometry(0.08,0.31,12), basMat({ color: 0xffb648, side: THREE.DoubleSide }), [side * 0.88,-0.08,4.86]);
  const fg=side < 0 ? leftFlameGroup : rightFlameGroup;
  fg.position.set(side * 0.88,-0.08,4.9);
  for (const ang of [0, Math.PI / 2]) {
  addMesh(fg, new THREE.PlaneGeometry(0.82,2.75), flameOuterMat, [0,0,1.38], [Math.PI / 2, ang,0]);
  addMesh(fg, new THREE.PlaneGeometry(0.42,1.55), flameCoreMat, [0,0,0.78], [Math.PI / 2, ang,0]);
  }
  exterior.add(fg);
 }
 const leftFlapPivot=new THREE.Group();
 const rightFlapPivot=new THREE.Group();
 const leftAileronPivot=new THREE.Group();
 const rightAileronPivot=new THREE.Group();
 const wingStrobes=[];
 for (const side of [-1,1]) {
  const sh=new THREE.Shape();
  sh.moveTo(0,-1.7); sh.lineTo(side * 5.65,0.25); sh.lineTo(side * 5.65,1.35); sh.lineTo(0,1.65); sh.closePath();
  const wGeom=new THREE.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
  wGeom.rotateX(Math.PI / 2);
  const wing=addMesh(exterior, wGeom, hullMat, [side * 0.95,0.08,0.15], null, true);
  wing.receiveShadow=true;
  addMesh(exterior, boxG(0.14,1.15,1.25), orangeMat, [side * 6.62,0.45,0.95], [0,0, -side * 0.24], true);
  addMesh(exterior, new THREE.CapsuleGeometry(0.24,2.1,6,10), orangeMat, [side * 3.1,-0.34,0.25], [Math.PI / 2,0,0], true);
  addMesh(exterior, sphG(0.14,8,6), basMat({ color: side < 0 ? 0xff3b3b : 0x3bff7a }), [side * 6.72,0.1,0.48]);
  wingStrobes.push(addMesh(exterior, sphG(0.16,8,6), basMat({ color: 0xffffff }), [side * 6.76,0.98,1.35]));
  const fp=side < 0 ? leftFlapPivot : rightFlapPivot;
  fp.position.set(side * 2.55,-0.02,1.65);
  addMesh(fp, boxG(2.1,0.11,0.62), slateMat, [0,0,0.26]);
  exterior.add(fp);
  const ap=side < 0 ? leftAileronPivot : rightAileronPivot;
  ap.position.set(side * 4.95,-0.02,1.48);
  addMesh(ap, boxG(2.2,0.1,0.54), orangeMat, [0,0,0.22]);
  exterior.add(ap);
 }
 const leftRudderPivot=new THREE.Group();
 const rightRudderPivot=new THREE.Group();
 const elevatorPivot=new THREE.Group();
 const finShape=new THREE.Shape();
 finShape.moveTo(-1.1,0); finShape.lineTo(0.85,0); finShape.lineTo(1.2,2.25); finShape.lineTo(0.2,2.25); finShape.closePath();
 const finGeom=new THREE.ExtrudeGeometry(finShape, { depth: 0.12, bevelEnabled: false });
 finGeom.rotateY(Math.PI / 2);
 for (const side of [-1,1]) {
  const finHolder=new THREE.Group();
  finHolder.position.set(side * 1.15,0.45,3.45);
  finHolder.rotation.z=-side * 0.28;
  addMesh(finHolder, finGeom, hullMat, null, null, true);
  addMesh(finHolder, boxG(0.16,0.48,1.02), orangeMat, [0.06,2.02,-0.7]);
  const rp=side < 0 ? leftRudderPivot : rightRudderPivot;
  rp.position.set(0.06,1.05,0.82);
  addMesh(rp, boxG(0.11,1.85,0.45), slateMat, [0,0,0.2]);
  finHolder.add(rp);
  exterior.add(finHolder);
 }
 elevatorPivot.position.set(0,0.08,4.15);
 for (const side of [-1,1]) {
  addMesh(elevatorPivot, boxG(2.5,0.12,1.05), slateMat, [side * 2.1,0,0.15], [0, side * 0.22,0], true);
 }
 exterior.add(elevatorPivot);
 const gearGroup=new THREE.Group();
 const tireMat=stdMat({ color: 0x161a1f, roughness: 0.92 });
 for (const [gx, gz, sc] of [[0,-3.55,0.82], [-1.65,0.65,1], [1.65,0.65,1]]) {
  addMesh(gearGroup, cylG(0.07,0.06,1.65,8), chromeMat, [gx,-1.12, gz]);
  addMesh(gearGroup, cylG(0.42 * sc,0.42 * sc,0.26,12), tireMat, [gx,-1.92, gz], [0,0, Math.PI / 2]);
 }
 addMesh(gearGroup, sphG(0.18,8,6), basMat({ color: 0xfff3c4 }), [0,-1.25,-3.72]);
 exterior.add(gearGroup);
 const cockpitExteriorStub=new THREE.Group();
 cockpitExteriorStub.visible=false;
 cockpitExteriorStub.add(nose.clone(), pitot.clone());
 root.add(cockpitExteriorStub);
 scene.add(root);
 const segs=36;
 const contrails=[-1,1].map(() => {
  const geom=new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segs * 6),3));
  const idx=[];
  for (let i=0; i < segs - 1; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  geom.setIndex(idx);
  const mat=basMat({ color: 0xf4faff, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false });
  const mesh=new THREE.Mesh(geom, mat);
  mesh.frustumCulled=false;
  scene.add(mesh);
  return { mesh, geom, mat, history: [] };
 });
 const smokeParticles=[];
 const smokeTex=createSoftSmokeTexture();
 const debrisGroup=new THREE.Group();
 scene.add(debrisGroup);
 return {
  root, exterior, cockpitExteriorStub,
  surfaces: { leftFlapPivot, rightFlapPivot, leftAileronPivot, rightAileronPivot, leftRudderPivot, rightRudderPivot, elevatorPivot, airbrakePivot, gearGroup },
  flames: { leftFlameGroup, rightFlameGroup, flameOuterMat, flameCoreMat },
  wingStrobes, contrails, smokeParticles, smokeTex, debrisGroup, debrisPieces: [],
  resetEffects() {
  for (const ct of contrails) { ct.history.length=0; ct.mesh.visible=false; }
  for (const sp of smokeParticles) scene.remove(sp.mesh);
  smokeParticles.length=0;
  debrisGroup.clear();
  this.debrisPieces.length=0;
  exterior.visible=true;
  },
 };
}
/** Update 3D aircraft transform, moving. */
export function updateAircraftPoseAndSurfaces(aircraft, flightState, elapsedSec, isCockpitView) {
 aircraft.root.position.copy(flightState.position);
 aircraft.root.quaternion.copy(flightState.quaternion);
 aircraft.exterior.visible=!isCockpitView && !flightState.crashed;
 aircraft.cockpitExteriorStub.visible=isCockpitView && !flightState.crashed;
 const s=aircraft.surfaces;
 const flapRad=(flightState.flapAngleDeg * Math.PI) / 180;
 s.leftFlapPivot.rotation.x=s.rightFlapPivot.rotation.x=-flapRad;
 s.leftAileronPivot.rotation.x=-flightState.controlSurfaces.aileron * 0.42;
 s.rightAileronPivot.rotation.x=flightState.controlSurfaces.aileron * 0.42;
 s.elevatorPivot.rotation.x=flightState.controlSurfaces.elevator * 0.36;
 s.leftRudderPivot.rotation.y=s.rightRudderPivot.rotation.y=flightState.controlSurfaces.rudder * 0.44;
 s.airbrakePivot.visible=flightState.airbrake > 0.08;
 s.airbrakePivot.rotation.x=flightState.airbrake * 0.65;
 s.gearGroup.visible=flightState.gearDeploy > 0.04;
 s.gearGroup.scale.set(1, Math.max(0.05, flightState.gearDeploy),1);
 s.gearGroup.position.y=(1 - flightState.gearDeploy) * 1.1;
 const strobeOn=Math.sin(elapsedSec * 9.5) > 0.72;
 for (const bulb of aircraft.wingStrobes) bulb.visible=strobeOn;
 const thr=flightState.fuelKg > 0 ? flightState.throttle : 0;
 const len=thr > 0.15 ? (0.35 + thr * 0.72 + (flightState.afterburner ? 0.48 : 0)) * (0.93 + Math.sin(elapsedSec * 48) * 0.07) : 0.01;
 const rad=flightState.afterburner ? 1.15 : 0.85;
 for (const fg of [aircraft.flames.leftFlameGroup, aircraft.flames.rightFlameGroup]) {
  fg.visible=thr > 0.14 && !flightState.crashed;
  fg.scale.set(rad, rad, len);
 }
 aircraft.flames.flameOuterMat.color.setHex(flightState.afterburner ? 0xff9d38 : 0x56c8ff);
 aircraft.flames.flameOuterMat.opacity=flightState.afterburner ? 0.84 : 0.56;
}
/** Update world-space wingtip contrail. */
export function updateAfterburnerAndVortices(aircraft, flightState, scene, dt, forceContrails=false) {
 const showTrail=!flightState.crashed && !flightState.onGround && (forceContrails || flightState.vortexIntensity > 0.14 || flightState.afterburner);
 const segs=36;
 for (let i=0; i < 2; i++) {
  const side=i === 0 ? -1 : 1;
  const ct=aircraft.contrails[i];
  if (showTrail) {
  _tipWorld.set(side * 6.72,0.88,1.35).applyQuaternion(flightState.quaternion).add(flightState.position);
  _sideOffset.set(side * 0.1,0,0).applyQuaternion(flightState.quaternion);
  ct.history.unshift({ p1: _tipWorld.clone().add(_sideOffset), p2: _tipWorld.clone().sub(_sideOffset) });
  if (ct.history.length > segs) ct.history.pop();
  } else if (ct.history.length > 0) ct.history.pop();
  if (ct.history.length < 2) { ct.mesh.visible=false; continue; }
  ct.mesh.visible=true;
  ct.mat.opacity=Math.min(0.32,0.14 + flightState.vortexIntensity * 0.18 + (forceContrails ? 0.1 : 0));
  const arr=ct.geom.attributes.position.array;
  for (let k=0; k < segs; k++) {
  const sample=ct.history[Math.min(k, ct.history.length - 1)];
  arr[k * 6] = sample.p1.x; arr[k * 6 + 1] = sample.p1.y; arr[k * 6 + 2] = sample.p1.z;
  arr[k * 6 + 3] = sample.p2.x; arr[k * 6 + 4] = sample.p2.y; arr[k * 6 + 5] = sample.p2.z;
  }
  ct.geom.attributes.position.needsUpdate=true;
 }
 if (flightState.touchdownSmokeTimer > 0 && !flightState.crashed) {
  const prevTick=Math.floor(flightState.touchdownSmokeTimer * 12);
  flightState.touchdownSmokeTimer=Math.max(0, flightState.touchdownSmokeTimer - dt);
  if (Math.floor(flightState.touchdownSmokeTimer * 12) !== prevTick) {
  for (const side of [-1.65,1.65]) {
  const wPos=new THREE.Vector3(side,-1.95,0.7).applyQuaternion(flightState.quaternion).add(flightState.position);
  spawnSmokePuff(aircraft, scene, wPos,0xf2f7fc,2.2,1.6,0.6);
  }
  }
 } else if (flightState.hull < 58 && !flightState.crashed && Math.random() < dt * 14) {
  const tPos=new THREE.Vector3(0,-0.1,5.1).applyQuaternion(flightState.quaternion).add(flightState.position);
  spawnSmokePuff(aircraft, scene, tPos,0x3b424d,3.2,2.4,1.4);
 }
 for (let i=aircraft.smokeParticles.length - 1; i >= 0; i--) {
  const p=aircraft.smokeParticles[i];
  p.age += dt;
  if (p.age >= p.life) { scene.remove(p.mesh); aircraft.smokeParticles.splice(i,1); continue; }
  p.mesh.position.addScaledVector(p.vel, dt);
  const f=p.age / p.life;
  const sc=p.startScale * (1 + f * 2.1);
  p.mesh.scale.set(sc * 1.25, sc * 0.85,1);
  p.mesh.material.opacity=(1 - f) * p.baseOpacity;
 }
 for (const piece of aircraft.debrisPieces) {
  piece.vel.y -= 9.81 * dt;
  piece.mesh.position.addScaledVector(piece.vel, dt);
  if (piece.mesh.position.y < piece.floorY) {
  piece.mesh.position.y=piece.floorY;
  piece.vel.y *= -0.25; piece.vel.x *= 0.65; piece.vel.z *= 0.65;
  }
  piece.mesh.rotation.x += piece.spin.x * dt;
  piece.mesh.rotation.y += piece.spin.y * dt;
  piece.mesh.rotation.z += piece.spin.z * dt;
 }
}
/** Emit a soft radial-alpha sprite wisp. */
export function spawnSmokePuff(aircraft, scene, pos, colorHex, startScale, lifeSec, velY=1.6) {
 if (aircraft.smokeParticles.length > 60) return;
 const isFire=colorHex === 0xff6e24;
 const baseOpacity=isFire ? 0.82 : 0.42;
 const mat=new THREE.SpriteMaterial({
  map: aircraft.smokeTex, color: colorHex, transparent: true, opacity: baseOpacity,
  depthWrite: false, blending: isFire ? THREE.AdditiveBlending : THREE.NormalBlending,
 });
 const sprite=new THREE.Sprite(mat);
 sprite.position.copy(pos);
 sprite.scale.set(startScale * 1.2, startScale * 0.85,1);
 scene.add(sprite);
 aircraft.smokeParticles.push({
  mesh: sprite, baseOpacity, age: 0, life: lifeSec, startScale,
  vel: new THREE.Vector3((Math.random() - 0.5) * 1.8, velY + Math.random() * 0.8, (Math.random() - 0.5) * 1.8),
 });
}
/** Spawn readable crash impact fragments. */
export function spawnCrashDebris(aircraft, flightState, scene, floorY) {
 const colors=[0xe7edf0,0x26394b,0xec5a28,0x1e242c];
 for (let i=0; i < 14; i++) {
  const mesh=addMesh(
  aircraft.debrisGroup,
  boxG(0.8 + (i % 3) * 0.9,0.25 + (i % 2) * 0.35,1.2 + (i % 4) * 0.6),
  stdMat({ color: colors[i % 4], roughness: 0.6 }),
  [flightState.position.x, flightState.position.y, flightState.position.z],
  );
  const ang=(i / 14) * Math.PI * 2;
  aircraft.debrisPieces.push({
  mesh, floorY: Math.max(0.5, floorY + 0.5),
  vel: new THREE.Vector3(flightState.velocity.x * 0.3 + Math.cos(ang) * (8 + (i % 4) * 4),6 + (i % 5) * 3.5, flightState.velocity.z * 0.3 + Math.sin(ang) * (8 + (i % 4) * 4)),
  spin: new THREE.Vector3(2.2 + i * 0.3,1.8,-2.5),
  });
 }
 for (let i=0; i < 14; i++) {
  const off=new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 4, (Math.random() - 0.5) * 8);
  spawnSmokePuff(aircraft, scene, flightState.position.clone().add(off), i < 7 ? 0xff6e24 : 0x2a2d33,4.5,4.2,4.8);
 }
}
const _tipWorld=new THREE.Vector3();
const _sideOffset=new THREE.Vector3();
function addMesh(parent, geom, mat, pos, rot, cast=false) {
 const m=new THREE.Mesh(geom, mat);
 if (pos) m.position.set(pos[0], pos[1], pos[2]);
 if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
 if (cast) m.castShadow=true;
 parent.add(m);
 return m;
}
function createAirframePanelTexture() {
 const c=document.createElement('canvas');
 c.width=c.height=512;
 const ctx=c.getContext('2d');
 ctx.fillStyle='#e7edf0'; ctx.fillRect(0,0,512,512);
 ctx.fillStyle='#263a4d'; ctx.fillRect(0,320,512,192);
 ctx.fillStyle='#e8582a'; ctx.fillRect(0,286,512,34);
 ctx.fillStyle='#f5b342'; ctx.fillRect(0,276,512,10);
 ctx.strokeStyle='rgba(28,42,56,0.28)'; ctx.lineWidth=2;
 for (let p=0; p <= 512; p += 64) {
  ctx.beginPath(); ctx.moveTo(p,0); ctx.lineTo(p,512); ctx.moveTo(0, p); ctx.lineTo(512, p); ctx.stroke();
 }
 ctx.fillStyle='rgba(42,62,79,0.2)'; ctx.fillRect(96,128,48,32); ctx.fillRect(288,128,48,32);
 ctx.fillStyle='#1d2d3c'; ctx.font='bold 38px monospace'; ctx.fillText('KW-04',180,232);
 const tex=new THREE.CanvasTexture(c);
 tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=4;
 return tex;
}
function createExhaustPlumeTexture() {
 const c=document.createElement('canvas');
 c.width=128; c.height=256;
 const ctx=c.getContext('2d');
 const g=ctx.createRadialGradient(64,34,4,64,108,120);
 g.addColorStop(0, 'rgba(255,255,255,1)');
 g.addColorStop(0.28, 'rgba(255,235,190,0.85)');
 g.addColorStop(0.65, 'rgba(255,165,68,0.28)');
 g.addColorStop(1, 'rgba(255,120,30,0)');
 ctx.fillStyle=g;
 ctx.fillRect(0,0,128,256);
 const tex=new THREE.CanvasTexture(c);
 tex.colorSpace=THREE.SRGBColorSpace;
 return tex;
}
function createSoftSmokeTexture() {
 const c=document.createElement('canvas');
 c.width=c.height=128;
 const ctx=c.getContext('2d');
 const g=ctx.createRadialGradient(64,64,6,64,64,60);
 g.addColorStop(0, 'rgba(255,255,255,0.95)');
 g.addColorStop(0.45, 'rgba(235,244,250,0.52)');
 g.addColorStop(1, 'rgba(220,234,245,0)');
 ctx.fillStyle=g;
 ctx.fillRect(0,0,128,128);
 const tex=new THREE.CanvasTexture(c);
 tex.colorSpace=THREE.SRGBColorSpace;
 return tex;
}
const stdMat=(o) => new THREE.MeshStandardMaterial(o);
const basMat=(o) => new THREE.MeshBasicMaterial(o);
const boxG=(...a) => new THREE.BoxGeometry(...a);
const cylG=(...a) => new THREE.CylinderGeometry(...a);
const sphG=(...a) => new THREE.SphereGeometry(...a);
