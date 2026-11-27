// Station-lofted KW-4 Kestrel jet with airfoil wings, clear lit canopy, GLSL Mach-diamond plumes, and effects.
import * as THREE from '../../vendor/three.module.min.js';

export function buildKestrelAircraft(scene) {
  const root = new THREE.Group(); root.name = 'KW4KestrelAircraft';
  const exterior = new THREE.Group(); exterior.name = 'KestrelExterior'; root.add(exterior);
  const { albedo, bump } = createAirframeLiveryTextures();
  const hullMat = std({ map: albedo, bumpMap: bump, bumpScale: 0.03, roughness: 0.28, metalness: 0.38, envMapIntensity: 1.35 });
  const wingMat = std({ color: 0xe6edf2, bumpMap: bump, bumpScale: 0.02, roughness: 0.3, metalness: 0.36, envMapIntensity: 1.3 });
  const titMat = std({ color: 0x324252, roughness: 0.34, metalness: 0.66, envMapIntensity: 1.4 });
  const orgMat = std({ color: 0xeb5624, roughness: 0.32, metalness: 0.2, envMapIntensity: 1.1 });
  const chrMat = std({ color: 0xc2d0de, roughness: 0.18, metalness: 0.88, envMapIntensity: 1.55 });
  const nozMat = std({ color: 0x202730, roughness: 0.38, metalness: 0.82, envMapIntensity: 1.25 });
  const canMat = new THREE.MeshPhysicalMaterial({ color: 0x5ab8d8, emissive: 0x0a2030, emissiveIntensity: 0.18, roughness: 0.06, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.44, envMapIntensity: 1.8 });

  const fus = put(exterior, buildLoftedFuselageGeometry(), hullMat, [0, 0, 0], null, true); fus.receiveShadow = true;
  const pitot = put(exterior, cyl(0.024, 0.055, 1.3, 8), chrMat, [0, -0.04, -7.25], [Math.PI / 2, 0, 0]);
  const airbrakePivot = new THREE.Group(); airbrakePivot.position.set(0, 0.92, 0.95);
  put(airbrakePivot, box(0.76, 0.08, 1.45), orgMat, [0, 0.04, 0.72]); exterior.add(airbrakePivot);

  const canopy = new THREE.Group(); canopy.position.set(0, 0.56, -2.05);
  put(canopy, box(0.84, 0.22, 2.3), nozMat, [0, -0.02, 0.15]);
  put(canopy, box(0.72, 0.24, 0.12), bas({ color: 0x4ef5b0 }), [0, 0.22, -0.84], [-0.28, 0, 0]);
  put(canopy, box(0.64, 0.05, 0.06), bas({ color: 0xffb83d }), [0, 0.36, -0.8], [-0.24, 0, 0]);
  put(canopy, new THREE.PlaneGeometry(0.4, 0.28), bas({ color: 0x62ffbe, transparent: true, opacity: 0.5, side: THREE.DoubleSide }), [0, 0.48, -0.68], [-0.28, 0, 0]);
  put(canopy, box(0.42, 0.46, 0.18), nozMat, [0, 0.28, 0.44]);
  put(canopy, sph(0.23, 12, 10), std({ color: 0xf0f5fa, roughness: 0.22 }), [0, 0.38, 0.14]);
  put(canopy, sph(0.19, 10, 8), std({ color: 0xf5ab26, roughness: 0.1, metalness: 0.92, envMapIntensity: 1.7 }), [0, 0.37, 0.01]);
  const bubble = put(canopy, sph(0.78, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.56), canMat, [0, 0.06, 0.12]);
  bubble.scale.set(0.76, 0.86, 2.25);
  put(canopy, new THREE.TorusGeometry(0.58, 0.03, 8, 18, Math.PI), titMat, [0, 0.14, -0.26]); exterior.add(canopy);

  const leftFlameGroup = new THREE.Group(), rightFlameGroup = new THREE.Group();
  const plumeUniforms = { uTime: { value: 0 }, uAfterburner: { value: 0 }, uThrottle: { value: 0.7 } };
  const plumeMat = createMachDiamondPlumeMaterial(plumeUniforms), coreGlowMat = bas({ color: 0xff8c2b, side: THREE.DoubleSide });
  for (const s of [-1, 1]) {
    const nac = put(exterior, cyl(0.4, 0.46, 4.35, 16), titMat, [s * 0.72, -0.02, 2.02], [Math.PI / 2, 0, 0], true);
    nac.scale.set(1.04, 1, 0.92);
    put(exterior, new THREE.TorusGeometry(0.39, 0.045, 8, 16), chrMat, [s * 0.72, -0.02, -0.18]);
    put(exterior, cyl(0.39, 0.31, 0.72, 14), nozMat, [s * 0.72, -0.02, 4.34], [Math.PI / 2, 0, 0]);
    for (let p = 0; p < 12; p++) {
      const a = (p / 12) * Math.PI * 2;
      put(exterior, box(0.095, 0.032, 0.52), nozMat, [s * 0.72 + Math.cos(a) * 0.32, -0.02 + Math.sin(a) * 0.32, 4.56], [0, 0, a + Math.PI / 2]);
    }
    put(exterior, new THREE.CircleGeometry(0.27, 14), bas({ color: 0x0b0f14, side: THREE.DoubleSide }), [s * 0.72, -0.02, 4.58]);
    put(exterior, new THREE.RingGeometry(0.08, 0.21, 14), coreGlowMat, [s * 0.72, -0.02, 4.62]);
    const fg = s < 0 ? leftFlameGroup : rightFlameGroup; fg.position.set(s * 0.72, -0.02, 4.64);
    const cg = new THREE.ConeGeometry(0.34, 3.4, 16, 1, true); cg.rotateX(Math.PI / 2); cg.translate(0, 0, 1.7);
    put(fg, cg, plumeMat); exterior.add(fg);
  }

  const leftFlapPivot = new THREE.Group(), rightFlapPivot = new THREE.Group(), leftAileronPivot = new THREE.Group(), rightAileronPivot = new THREE.Group();
  const wingStrobes = [];
  for (const s of [-1, 1]) {
    const sh = new THREE.Shape(); sh.moveTo(0, -1.95); sh.lineTo(s * 5.75, 0.22); sh.lineTo(s * 5.75, 1.2); sh.lineTo(0, 1.62); sh.closePath();
    const wg = new THREE.ExtrudeGeometry(sh, { depth: 0.16, bevelEnabled: true, bevelSize: 0.045, bevelThickness: 0.045, bevelSegments: 3 }); wg.rotateX(Math.PI / 2);
    put(exterior, wg, wingMat, [s * 0.9, 0.02, 0.15], null, true).receiveShadow = true;
    put(exterior, box(5.1, 0.04, 0.26), orgMat, [s * 3.7, 0.08, 0.92], [0, -s * 0.18, 0]);
    put(exterior, box(4.4, 0.035, 0.34), titMat, [s * 3.3, 0.075, 0.45], [0, -s * 0.28, 0]);
    const ws = new THREE.Shape(); ws.moveTo(0, 0); ws.lineTo(1.12, 0); ws.lineTo(1.38, 1.14); ws.lineTo(0.68, 1.14); ws.closePath();
    const wlg = new THREE.ExtrudeGeometry(ws, { depth: 0.075, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2 });
    wlg.translate(0, 0, -0.037); wlg.rotateY(-Math.PI / 2);
    put(exterior, wlg, orgMat, [s * 6.62, 0.02, 0.36], [0, 0, -s * 0.24], true);
    put(exterior, box(0.11, 0.32, 1.18), titMat, [s * 3.05, -0.18, 0.28]);
    put(exterior, new THREE.CapsuleGeometry(0.21, 1.95, 6, 12), orgMat, [s * 3.05, -0.44, 0.25], [Math.PI / 2, 0, 0], true);
    put(exterior, sph(0.12, 8, 6), bas({ color: s < 0 ? 0xff3b3b : 0x3bff7a }), [s * 6.72, 0.08, 0.44]);
    wingStrobes.push(put(exterior, sph(0.14, 8, 6), bas({ color: 0xffffff }), [s * 6.82, 1.1, 1.38]));
    const fp = s < 0 ? leftFlapPivot : rightFlapPivot; fp.position.set(s * 2.48, -0.02, 1.6);
    put(fp, box(2.05, 0.075, 0.54), titMat, [0, 0, 0.24]); exterior.add(fp);
    const ap = s < 0 ? leftAileronPivot : rightAileronPivot; ap.position.set(s * 4.9, -0.02, 1.36);
    put(ap, box(2.1, 0.07, 0.46), orgMat, [0, 0, 0.19]); exterior.add(ap);
  }

  const leftRudderPivot = new THREE.Group(), rightRudderPivot = new THREE.Group(), elevatorPivot = new THREE.Group();
  const fs = new THREE.Shape(); fs.moveTo(-1.15, 0); fs.lineTo(0.95, 0); fs.lineTo(1.38, 2.2); fs.lineTo(0.42, 2.2); fs.closePath();
  const fgm = new THREE.ExtrudeGeometry(fs, { depth: 0.085, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.018, bevelSegments: 2 });
  fgm.translate(0, 0, -0.042); fgm.rotateY(-Math.PI / 2);
  for (const s of [-1, 1]) {
    const fh = new THREE.Group(); fh.position.set(s * 1.02, 0.34, 3.22); fh.rotation.z = -s * 0.24;
    put(fh, fgm, titMat, null, null, true); put(fh, box(0.13, 0.34, 1.02), orgMat, [0, 2.04, 0.9]);
    put(fh, box(0.125, 0.16, 1.12), wingMat, [0, 1.72, 0.78]);
    const rp = s < 0 ? leftRudderPivot : rightRudderPivot; rp.position.set(0, 1.02, 1.02);
    put(rp, box(0.08, 1.7, 0.42), wingMat, [0, 0, 0.18]); fh.add(rp); exterior.add(fh);
  }
  elevatorPivot.position.set(0, 0.02, 3.92);
  for (const s of [-1, 1]) {
    const ss = new THREE.Shape(); ss.moveTo(0, -0.75); ss.lineTo(s * 2.45, 0.18); ss.lineTo(s * 2.45, 0.7); ss.lineTo(0, 0.8); ss.closePath();
    const sg = new THREE.ExtrudeGeometry(ss, { depth: 0.075, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.018, bevelSegments: 2 }); sg.rotateX(Math.PI / 2);
    put(elevatorPivot, sg, titMat, [s * 0.86, 0, 0], null, true);
  }
  exterior.add(elevatorPivot);

  const gearGroup = new THREE.Group(), tireMat = std({ color: 0x161a1f, roughness: 0.92 });
  for (const [gx, gz, sc] of [[0, -3.55, 0.82], [-1.65, 0.65, 1], [1.65, 0.65, 1]]) {
    put(gearGroup, cyl(0.065, 0.055, 1.65, 8), chrMat, [gx, -1.12, gz]);
    put(gearGroup, cyl(0.42 * sc, 0.42 * sc, 0.25, 14), tireMat, [gx, -1.92, gz], [0, 0, Math.PI / 2]);
    put(gearGroup, cyl(0.2 * sc, 0.2 * sc, 0.27, 10), chrMat, [gx, -1.92, gz], [0, 0, Math.PI / 2]);
  }
  put(gearGroup, sph(0.16, 8, 6), bas({ color: 0xfff5cc }), [0, -1.25, -3.72]);
  put(gearGroup, new THREE.ConeGeometry(2.5, 14, 12, 1, true), bas({ color: 0xfff0b8, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), [0, -1.98, -10.5], [Math.PI / 2 + 0.12, 0, 0]);
  exterior.add(gearGroup);

  const cockpitExteriorStub = new THREE.Group(); cockpitExteriorStub.visible = false;
  put(cockpitExteriorStub, new THREE.ConeGeometry(0.74, 3.1, 16), titMat, [0, -0.06, -5.2], [-Math.PI / 2, 0, 0]).scale.set(1.04, 1, 0.78);
  cockpitExteriorStub.add(pitot.clone()); root.add(cockpitExteriorStub); scene.add(root);

  const segs = 36;
  const contrails = [-1, 1].map(() => {
    const geom = new THREE.BufferGeometry(); geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segs * 6), 3));
    const idx = []; for (let i = 0; i < segs - 1; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    geom.setIndex(idx);
    const mat = bas({ color: 0xf4faff, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false });
    const mesh = new THREE.Mesh(geom, mat); mesh.frustumCulled = false; scene.add(mesh);
    return { mesh, geom, mat, history: [] };
  });
  const smokeParticles = [], smokeTex = createSoftSmokeTexture(), debrisGroup = new THREE.Group(); scene.add(debrisGroup);

  return {
    root, exterior, cockpitExteriorStub, coreGlowMat,
    surfaces: { leftFlapPivot, rightFlapPivot, leftAileronPivot, rightAileronPivot, leftRudderPivot, rightRudderPivot, elevatorPivot, airbrakePivot, gearGroup },
    flames: { leftFlameGroup, rightFlameGroup, plumeUniforms }, wingStrobes, contrails, smokeParticles, smokeTex, debrisGroup, debrisPieces: [],
    resetEffects() {
      for (const ct of contrails) { ct.history.length = 0; ct.mesh.visible = false; }
      for (const sp of smokeParticles) scene.remove(sp.mesh);
      smokeParticles.length = 0; debrisGroup.clear(); this.debrisPieces.length = 0; exterior.visible = true;
    },
  };
}

export function updateAircraftPoseAndSurfaces(aircraft, flightState, elapsedSec, isCockpitView) {
  aircraft.root.position.copy(flightState.position); aircraft.root.quaternion.copy(flightState.quaternion);
  aircraft.exterior.visible = !isCockpitView && !flightState.crashed;
  aircraft.cockpitExteriorStub.visible = isCockpitView && !flightState.crashed;
  const s = aircraft.surfaces;
  s.leftFlapPivot.rotation.x = s.rightFlapPivot.rotation.x = -(flightState.flapAngleDeg * Math.PI) / 180;
  s.leftAileronPivot.rotation.x = -flightState.controlSurfaces.aileron * 0.42;
  s.rightAileronPivot.rotation.x = flightState.controlSurfaces.aileron * 0.42;
  s.elevatorPivot.rotation.x = flightState.controlSurfaces.elevator * 0.36;
  s.leftRudderPivot.rotation.y = s.rightRudderPivot.rotation.y = flightState.controlSurfaces.rudder * 0.44;
  s.airbrakePivot.visible = flightState.airbrake > 0.08;
  s.airbrakePivot.rotation.x = -flightState.airbrake * 0.68;
  s.gearGroup.visible = flightState.gearDeploy > 0.04;
  s.gearGroup.scale.set(1, Math.max(0.05, flightState.gearDeploy), 1);
  s.gearGroup.position.y = (1 - flightState.gearDeploy) * 1.1;
  const strobeOn = Math.sin(elapsedSec * 9.5) > 0.72;
  for (const b of aircraft.wingStrobes) b.visible = strobeOn;

  const thr = flightState.fuelKg > 0 ? flightState.throttle : 0;
  aircraft.coreGlowMat.color.setHex(flightState.afterburner ? 0xffae42 : thr > 0.4 ? 0x52c8ff : 0x3b2c20);
  const u = aircraft.flames.plumeUniforms; u.uTime.value = elapsedSec; u.uThrottle.value = thr; u.uAfterburner.value = flightState.afterburner ? 1 : 0;
  const len = thr > 0.25 ? (0.4 + thr * 0.7 + (flightState.afterburner ? 0.58 : 0)) * (0.94 + Math.sin(elapsedSec * 52) * 0.06) : 0.01;
  const rad = flightState.afterburner ? 1.18 : 0.9;
  for (const fg of [aircraft.flames.leftFlameGroup, aircraft.flames.rightFlameGroup]) { fg.visible = thr > 0.24 && !flightState.crashed; fg.scale.set(rad, rad, len); }
}

export function updateAfterburnerAndVortices(aircraft, flightState, scene, dt, forceContrails = false) {
  const showTrail = !flightState.crashed && !flightState.onGround && (forceContrails || flightState.vortexIntensity > 0.14 || flightState.afterburner);
  const segs = 36;
  for (let i = 0; i < 2; i++) {
    const side = i === 0 ? -1 : 1, ct = aircraft.contrails[i];
    if (showTrail) {
      _tip.set(side * 6.76, 1.02, 1.32).applyQuaternion(flightState.quaternion).add(flightState.position);
      _off.set(side * 0.055, 0, 0).applyQuaternion(flightState.quaternion);
      ct.history.unshift({ p1: _tip.clone().add(_off), p2: _tip.clone().sub(_off) });
      if (ct.history.length > segs) ct.history.pop();
    } else if (ct.history.length > 0) ct.history.pop();
    if (ct.history.length < 2) { ct.mesh.visible = false; continue; }
    ct.mesh.visible = true; ct.mat.opacity = Math.min(0.16, 0.06 + flightState.vortexIntensity * 0.1 + (forceContrails ? 0.05 : 0));
    const arr = ct.geom.attributes.position.array;
    for (let k = 0; k < segs; k++) {
      const s = ct.history[Math.min(k, ct.history.length - 1)];
      arr[k * 6] = s.p1.x; arr[k * 6 + 1] = s.p1.y; arr[k * 6 + 2] = s.p1.z;
      arr[k * 6 + 3] = s.p2.x; arr[k * 6 + 4] = s.p2.y; arr[k * 6 + 5] = s.p2.z;
    }
    ct.geom.attributes.position.needsUpdate = true;
  }
  if (flightState.touchdownSmokeTimer > 0 && !flightState.crashed) {
    const prev = Math.floor(flightState.touchdownSmokeTimer * 12);
    flightState.touchdownSmokeTimer = Math.max(0, flightState.touchdownSmokeTimer - dt);
    if (Math.floor(flightState.touchdownSmokeTimer * 12) !== prev) {
      for (const s of [-1.65, 1.65]) spawnSmokePuff(aircraft, scene, new THREE.Vector3(s, -1.95, 0.7).applyQuaternion(flightState.quaternion).add(flightState.position), 0xf2f7fc, 2.2, 1.6, 0.6);
    }
  } else if (flightState.hull < 58 && !flightState.crashed && Math.random() < dt * 14) {
    spawnSmokePuff(aircraft, scene, new THREE.Vector3(0, -0.1, 5.1).applyQuaternion(flightState.quaternion).add(flightState.position), 0x3b424d, 3.2, 2.4, 1.4);
  }
  for (let i = aircraft.smokeParticles.length - 1; i >= 0; i--) {
    const p = aircraft.smokeParticles[i]; p.age += dt;
    if (p.age >= p.life) { scene.remove(p.mesh); aircraft.smokeParticles.splice(i, 1); continue; }
    p.mesh.position.addScaledVector(p.vel, dt);
    const f = p.age / p.life, sc = p.startScale * (1 + f * 2.1);
    p.mesh.scale.set(sc * 1.25, sc * 0.85, 1); p.mesh.material.opacity = (1 - f) * p.baseOpacity;
  }
  for (const d of aircraft.debrisPieces) {
    d.vel.y -= 9.81 * dt; d.mesh.position.addScaledVector(d.vel, dt);
    if (d.mesh.position.y < d.floorY) { d.mesh.position.y = d.floorY; d.vel.y *= -0.25; d.vel.x *= 0.65; d.vel.z *= 0.65; }
    d.mesh.rotation.x += d.spin.x * dt; d.mesh.rotation.y += d.spin.y * dt; d.mesh.rotation.z += d.spin.z * dt;
  }
}

export function spawnSmokePuff(aircraft, scene, pos, colorHex, startScale, lifeSec, velY = 1.6) {
  if (aircraft.smokeParticles.length > 60) return;
  const isFire = colorHex === 0xff6e24, baseOpacity = isFire ? 0.82 : 0.42;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: aircraft.smokeTex, color: colorHex, transparent: true, opacity: baseOpacity, depthWrite: false, blending: isFire ? THREE.AdditiveBlending : THREE.NormalBlending }));
  sp.position.copy(pos); sp.scale.set(startScale * 1.2, startScale * 0.85, 1); scene.add(sp);
  aircraft.smokeParticles.push({ mesh: sp, baseOpacity, age: 0, life: lifeSec, startScale, vel: new THREE.Vector3((Math.random() - 0.5) * 1.8, velY + Math.random() * 0.8, (Math.random() - 0.5) * 1.8) });
}

export function spawnCrashDebris(aircraft, flightState, scene, floorY) {
  const cols = [0xe7edf0, 0x26394b, 0xec5a28, 0x1e242c];
  for (let i = 0; i < 14; i++) {
    const m = put(aircraft.debrisGroup, box(0.8 + (i % 3) * 0.9, 0.25 + (i % 2) * 0.35, 1.2 + (i % 4) * 0.6), std({ color: cols[i % 4], roughness: 0.6 }), [flightState.position.x, flightState.position.y, flightState.position.z]);
    const a = (i / 14) * Math.PI * 2;
    aircraft.debrisPieces.push({ mesh: m, floorY: Math.max(0.5, floorY + 0.5), vel: new THREE.Vector3(flightState.velocity.x * 0.3 + Math.cos(a) * (8 + (i % 4) * 4), 6 + (i % 5) * 3.5, flightState.velocity.z * 0.3 + Math.sin(a) * (8 + (i % 4) * 4)), spin: new THREE.Vector3(2.2 + i * 0.3, 1.8, -2.5) });
  }
  for (let i = 0; i < 14; i++) spawnSmokePuff(aircraft, scene, flightState.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 4, (Math.random() - 0.5) * 8)), i < 7 ? 0xff6e24 : 0x2a2d33, 4.5, 4.2, 4.8);
}

function attachAirframeMesh(parent, geometry, material, pos, rot, castShadow = false) {
  const o = new THREE.Mesh(geometry, material);
  if (pos) o.position.set(...pos); if (rot) o.rotation.set(...rot); if (castShadow) o.castShadow = true;
  parent.add(o); return o;
}

function buildLoftedFuselageGeometry() {
  const st = [[-6.65, 0.04, -0.02, -0.06, 0], [-5.6, 0.38, 0.24, -0.32, 0.02], [-4.3, 0.72, 0.48, -0.56, 0.06], [-3.1, 0.92, 0.62, -0.72, 0.09], [-1.6, 1.06, 0.7, -0.8, 0.11], [0.1, 1.18, 0.88, -0.82, 0.14], [1.8, 1.24, 0.9, -0.8, 0.12], [3.35, 1.12, 0.74, -0.7, 0.08], [4.25, 0.88, 0.48, -0.48, 0.03], [4.65, 0.4, 0.22, -0.22, 0]];
  const R = 22, pos = [], uvs = [], idx = [];
  for (let s = 0; s < st.length; s++) {
    const [z, rx, ty, by, sp] = st[s], v = s / (st.length - 1);
    for (let r = 0; r <= R; r++) {
      const u = r / R, a = u * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      pos.push(ca * rx * (1 + 0.08 * Math.pow(Math.abs(ca), 3)), sa >= 0 ? sa * ty + Math.pow(sa, 3) * sp : sa * -by, z); uvs.push(u, v);
    }
  }
  const stride = R + 1;
  for (let s = 0; s < st.length - 1; s++) for (let r = 0; r < R; r++) { const a = s * stride + r, b = a + 1, c = (s + 1) * stride + r; idx.push(a, b, c, b, c + 1, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

function createMachDiamondPlumeMaterial(uniforms) {
  return new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'uniform float uTime,uAfterburner,uThrottle;varying vec2 vUv;void main(){float a=1.0-vUv.y;float core=exp(-a*2.1);float dm=pow(max(0.0,sin(a*24.0-uTime*22.0)),4.0)*(1.0-a)*(0.45+uAfterburner*0.95);vec3 col=mix(mix(vec3(0.22,0.74,1.0),vec3(0.86,0.98,1.0),core),mix(vec3(1.0,0.44,0.1),vec3(1.0,0.94,0.72),core+dm*0.65),uAfterburner);float fade=smoothstep(0.0,0.08,a)*smoothstep(1.0,0.14,a);gl_FragColor=vec4(col,clamp((core*0.95+dm*0.75)*fade*(0.42+uThrottle*0.55),0.0,1.0));}',
  });
}

function createAirframeLiveryTextures() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const ctx = c.getContext('2d');
  ctx.fillStyle = '#edf3f7'; ctx.fillRect(0, 0, 256, 512); ctx.fillStyle = '#253749'; ctx.fillRect(256, 0, 256, 512); ctx.fillRect(104, 30, 48, 370);
  ctx.fillStyle = '#e85626'; ctx.fillRect(0, 40, 22, 410); ctx.fillRect(234, 40, 44, 410); ctx.fillRect(490, 40, 22, 410);
  ctx.fillStyle = '#f5b83d'; ctx.fillRect(22, 40, 8, 410); ctx.fillRect(226, 40, 8, 410);
  ctx.fillStyle = '#1b2633'; ctx.fillRect(0, 444, 512, 68);
  const soot = ctx.createLinearGradient(0, 0, 0, 82); soot.addColorStop(0, 'rgba(18,22,28,0.68)'); soot.addColorStop(1, 'rgba(20,24,30,0)');
  ctx.fillStyle = soot; ctx.fillRect(0, 0, 512, 82);
  ctx.strokeStyle = 'rgba(26,38,52,0.26)'; ctx.lineWidth = 1.4;
  for (let p = 0; p <= 512; p += 64) { ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, 512); ctx.moveTo(0, p); ctx.lineTo(512, p); ctx.stroke(); }
  const albedo = new THREE.CanvasTexture(c); albedo.colorSpace = THREE.SRGBColorSpace; albedo.anisotropy = 4;
  const bc = document.createElement('canvas'); bc.width = bc.height = 256; const bx = bc.getContext('2d');
  bx.fillStyle = '#808080'; bx.fillRect(0, 0, 256, 256); bx.strokeStyle = '#383838'; bx.lineWidth = 1.4;
  for (let p = 0; p <= 256; p += 32) { bx.beginPath(); bx.moveTo(p, 0); bx.lineTo(p, 256); bx.moveTo(0, p); bx.lineTo(256, p); bx.stroke(); }
  return { albedo, bump: new THREE.CanvasTexture(bc) };
}

function createSoftSmokeTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
  g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.45, 'rgba(235,244,250,0.52)'); g.addColorStop(1, 'rgba(220,234,245,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const _tip = new THREE.Vector3(), _off = new THREE.Vector3();
const std = (o) => new THREE.MeshStandardMaterial(o), bas = (o) => new THREE.MeshBasicMaterial(o);
const box = (...a) => new THREE.BoxGeometry(...a), cyl = (...a) => new THREE.CylinderGeometry(...a), sph = (...a) => new THREE.SphereGeometry(...a);
const put = attachAirframeMesh;
