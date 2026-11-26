// 4 distinct flight sorties, holographic ring gates, crimson-orange flare beacons, and parachute supply crates.
import * as THREE from '../../vendor/three.module.min.js';
import { AIRFIELD_RUNWAYS } from './airfields.js';
export const MISSION_CATALOG=[
 {
  id: 'caldera-circuit', index: 0, code: 'SORTIE 1', title: 'Caldera Ring Circuit', tag: 'GOLDEN HOUR', tagClass: '',
  timeOfDay: 'goldenHour', windVector: [2.8,0,-2.1], turbulence: 0.12, objectiveType: 'rings-and-land', targetRunwayId: 'kestrel-09', parTimeSec: 155,
  description: 'Depart Kestrel Runway 09, thread 7 sunlit caldera gates over the Suspension Bridge, and flare back onto Runway 09.',
  spawn: { x: -365, y: 24.4, z: 0, headingDeg: 90, pitchDeg: 0, rollDeg: 0, airspeedKnots: 0, throttle: 0.25, flapsIndex: 1, gearDown: true, onGround: true, fuelFraction: 0.84, hull: 100 },
  gates: [
  { x: 640, y: 120, z: -20, radius: 34, label: 'DEPARTURE GATE' },
  { x: 1180, y: 185, z: -540, radius: 34, label: 'EASTERN HEADLAND' },
  { x: 760, y: 150, z: -1040, radius: 34, label: 'BRIDGE APPROACH' },
  { x: 440, y: 125, z: -1460, radius: 34, label: 'BASALT STRAIT' },
  { x: -160, y: 195, z: -1120, radius: 34, label: 'CALDERA RIDGE' },
  { x: -1020, y: 155, z: -220, radius: 34, label: 'DOWNWIND TURN' },
  { x: -720, y: 84, z: 18, radius: 36, label: 'RUNWAY 09 FINAL' },
  ],
  drops: [],
 },
 {
  id: 'canyon-slalom', index: 1, code: 'SORTIE 2', title: 'Basalt Canyon Slalom', tag: 'CROSSWIND 12 KT', tagClass: '',
  timeOfDay: 'alpineMidday', windVector: [4.2,0,4.6], turbulence: 0.35, objectiveType: 'rings-and-land', targetRunwayId: 'kestrel-09', parTimeSec: 125,
  description: 'High-speed gorge navigation through 7 canyon & bridge gates under tight fuel and crosswind turn discipline.',
  spawn: { x: 420, y: 168, z: -420, headingDeg: 358, pitchDeg: -2, rollDeg: 0, airspeedKnots: 188, throttle: 0.82, flapsIndex: 0, gearDown: false, onGround: false, fuelFraction: 0.62, hull: 100 },
  gates: [
  { x: 440, y: 112, z: -1040, radius: 32, label: 'BRIDGE SPAN' },
  { x: 540, y: 108, z: -1580, radius: 32, label: 'GORGE ENTRY' },
  { x: 780, y: 145, z: -2060, radius: 32, label: 'CRATER LAGOON' },
  { x: 1320, y: 245, z: -1760, radius: 34, label: 'VOLCANO SADDLE' },
  { x: 1540, y: 195, z: -860, radius: 34, label: 'EAST CLIFF DIVE' },
  { x: 720, y: 130, z: 320, radius: 34, label: 'SOUTH CHANNEL' },
  { x: -690, y: 82, z: 12, radius: 36, label: 'FINAL APPROACH' },
  ],
  drops: [],
 },
 {
  id: 'monsoon-drop', index: 2, code: 'SORTIE 3', title: 'Monsoon Beacon Drop', tag: 'STORM 18 KT', tagClass: 'storm',
  timeOfDay: 'monsoonStorm', windVector: [-6.8,0,6.4], turbulence: 0.72, objectiveType: 'drops-and-land', targetRunwayId: 'carrier-07', parTimeSec: 170,
  description: 'Drop 3 supply crates (SPACE) onto orange flare beacons in 18 KT monsoon storm turbulence, then land on Carrier Barge RV-07.',
  spawn: { x: -740, y: 230, z: 680, headingDeg: 315, pitchDeg: 0, rollDeg: 0, airspeedKnots: 162, throttle: 0.76, flapsIndex: 0, gearDown: false, onGround: false, fuelFraction: 0.56, hull: 86 },
  gates: [],
  drops: [
  { x: -1260, y: 45, z: 420, radius: 135, label: 'KESTREL LIGHTHOUSE', delivered: false },
  { x: -1520, y: 186, z: -520, radius: 135, label: 'ALPINE RIDGE OUTPOST', delivered: false },
  { x: 1460, y: 12, z: 1120, radius: 145, label: 'CARRIER DECK DROP', delivered: false },
  ],
 },
 {
  id: 'glide-recovery', index: 3, code: 'SORTIE 4', title: 'Caldera Glide Recovery', tag: 'EMERGENCY FUEL', tagClass: 'emergency',
  timeOfDay: 'crimsonSunset', windVector: [-3.5,0,2.2], turbulence: 0.25, objectiveType: 'rings-and-land', targetRunwayId: 'kestrel-09', parTimeSec: 110,
  description: 'Engine degraded with 15% leaking fuel at 2,400 FT over the caldera. Manage best-glide speed and stick Runway 09.',
  spawn: { x: -1780, y: 720, z: -640, headingDeg: 112, pitchDeg: -5, rollDeg: 0, airspeedKnots: 124, throttle: 0.35, flapsIndex: 0, gearDown: false, onGround: false, fuelFraction: 0.15, fuelLeakKgPerSec: 1.9, enginePowerScale: 0.52, hull: 74 },
  gates: [
  { x: -1340, y: 420, z: -320, radius: 44, label: 'HIGH GLIDE GATE' },
  { x: -980, y: 215, z: -110, radius: 42, label: 'VALLEY TURN' },
  { x: -690, y: 84, z: 10, radius: 40, label: 'EMERGENCY FINAL' },
  ],
  drops: [],
 },
];
/** Create fresh mutable runtime state. */
export function createMissionRuntime(missionIndex=0) {
 const spec=MISSION_CATALOG[missionIndex] ?? MISSION_CATALOG[0];
 return {
  spec, elapsedSec: 0, score: 0, gateIndex: 0,
  gates: spec.gates.map((g) => ({ ...g, cleared: false })),
  drops: spec.drops.map((d) => ({ ...d, delivered: false })),
  activeCrates: [], phase: 'active', bannerText: '', bannerTimer: 0,
  windWorld: new THREE.Vector3(...spec.windVector), recentEvent: null,
 };
}
/** Build 3D holographic target ring. */
export function buildMissionProps(scene, runtime) {
 const group=new THREE.Group();
 group.name='MissionObjectives';
 const finGeom=boxG(6.5,11,2.8);
 const gateMeshes=runtime.gates.map((g, idx) => {
  const holder=new THREE.Group();
  holder.position.set(g.x, g.y, g.z);
  const next=idx + 1 < runtime.gates.length ? runtime.gates[idx + 1] : { x: -420, y: 24, z: 0 };
  holder.lookAt(next.x, next.y, next.z);
  const outerMat=stdMat({ color: 0xffb838, emissive: 0xff921c, emissiveIntensity: 1.45, roughness: 0.25, metalness: 0.4 });
  const innerMat=basMat({ color: 0xffe88c, transparent: true, opacity: 0.34, side: THREE.DoubleSide });
  holder.add(new THREE.Mesh(new THREE.TorusGeometry(g.radius,2.2,12,36), outerMat));
  holder.add(new THREE.Mesh(new THREE.TorusGeometry(g.radius - 3.6,0.7,8,32), innerMat));
  for (let k=0; k < 4; k++) {
  const ang=(k * Math.PI) / 2;
  const fin=new THREE.Mesh(finGeom, outerMat);
  fin.position.set(Math.cos(ang) * (g.radius + 4), Math.sin(ang) * (g.radius + 4),0);
  fin.rotation.z=ang + Math.PI / 2;
  holder.add(fin);
  }
  group.add(holder);
  return { holder, outerMat, innerMat };
 });
 const flareTex=createFlareSmokeTexture();
 const dropMeshes=runtime.drops.map((d) => {
  const holder=new THREE.Group();
  holder.position.set(d.x, d.y + 0.6, d.z);
  const circleMat=basMat({ color: 0xff6e1f, transparent: true, opacity: 0.88, side: THREE.DoubleSide });
  const ring=new THREE.Mesh(new THREE.RingGeometry(24,36,28), circleMat);
  ring.rotation.x=-Math.PI / 2;
  holder.add(ring);
  const puffs=Array.from({ length: 10 }, () => {
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({ map: flareTex, color: 0xff7024, transparent: true, opacity: 0.85, depthWrite: false }));
  holder.add(sp);
  return sp;
  });
  const beamMat=basMat({ color: 0xff8c2b, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const beam=new THREE.Mesh(cylG(4,16,230,12,1, true), beamMat);
  beam.position.y=115;
  holder.add(beam);
  group.add(holder);
  return { holder, ring, circleMat, puffs, beam, beamMat };
 });
 const crateGroup=new THREE.Group();
 group.add(crateGroup);
 scene.add(group);
 return { group, gateMeshes, dropMeshes, crateGroup };
}
/** Release a physical parachute supply. */
export function deploySupplyDrop(runtime, flightState, props, customPos=null) {
 if (runtime.spec.objectiveType !== 'drops-and-land' || flightState.onGround || flightState.crashed) return false;
 const crate=new THREE.Group();
 crate.position.copy(customPos ?? flightState.position);
 if (!customPos) crate.position.y -= 3.2;
 crate.add(new THREE.Mesh(boxG(5.2,3.8,5.2), stdMat({ color: 0xffa824, emissive: 0x6e3a04, roughness: 0.45 })));
 const chute=new THREE.Mesh(sphG(10.5,12,7,0, Math.PI * 2,0, Math.PI * 0.56), stdMat({ color: 0xffffff, emissive: 0x6c8ca8, emissiveIntensity: 0.45, side: THREE.DoubleSide }));
 chute.position.y=10.2;
 crate.add(chute);
 const lineMat=new THREE.LineBasicMaterial({ color: 0xdcebf5 });
 const lPts=[];
 for (const [sx, sz] of [[-2,-2], [2,-2], [-2,2], [2,2]]) {
  lPts.push(new THREE.Vector3(sx,1.8, sz), new THREE.Vector3(sx * 3.8,10.2, sz * 3.8));
 }
 crate.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lPts), lineMat));
 props.crateGroup.add(crate);
 runtime.activeCrates.push({ mesh: crate, vel: customPos ? new THREE.Vector3(0,-10,0) : flightState.velocity.clone().multiplyScalar(0.35), settled: false });
 if (customPos) return true;
 let hit=false;
 for (const drop of runtime.drops) {
  if (drop.delivered) continue;
  if (Math.hypot(flightState.position.x - drop.x, flightState.position.z - drop.z) <= drop.radius * 1.45 && flightState.position.y - drop.y < 380) {
  drop.delivered=true; hit=true; runtime.score += 1200;
  runtime.bannerText=`SUPPLY DELIVERED: ${drop.label} (+1,200)`;
  runtime.bannerTimer=3.2; runtime.recentEvent='drop_delivered';
  break;
  }
 }
 if (!hit) { runtime.bannerText='CRATE RELEASED — FLY CLOSER TO ORANGE FLARE BEACON'; runtime.bannerTimer=2.4; runtime.recentEvent='drop_released'; }
 return true;
}
/** Return the active 3D waypoint. */
export function getActiveWaypoint(runtime) {
 if (runtime.phase === 'completed') return null;
 if (runtime.spec.objectiveType === 'rings-and-land' && runtime.gateIndex < runtime.gates.length) {
  const g=runtime.gates[runtime.gateIndex];
  return { x: g.x, y: g.y, z: g.z, label: `GATE ${runtime.gateIndex + 1}/${runtime.gates.length}: ${g.label}`, shortLabel: `GATE ${runtime.gateIndex + 1}/${runtime.gates.length}`, kind: 'gate' };
 }
 if (runtime.spec.objectiveType === 'drops-and-land') {
  const next=runtime.drops.find((d) => !d.delivered);
  if (next) {
  const done=runtime.drops.filter((d) => d.delivered).length;
  return { x: next.x, y: next.y + 42, z: next.z, label: `DROP ${done + 1}/${runtime.drops.length}: ${next.label} (PRESS SPACE)`, shortLabel: `DROP ${done + 1}/${runtime.drops.length}`, kind: 'drop' };
  }
 }
 const rwy=AIRFIELD_RUNWAYS.find((r) => r.id === runtime.spec.targetRunwayId) ?? AIRFIELD_RUNWAYS[0];
 return { x: rwy.centerX - rwy.lengthM * 0.35, y: rwy.elevationM + 8, z: rwy.centerZ, label: `LAND ON ${rwy.name}`, shortLabel: rwy.hasArrestor ? 'CARRIER LANDING' : 'RUNWAY 09 LANDING', kind: 'runway' };
}
/** Step mission timers, ring capture,. */
export function stepMissionObjectives(runtime, flightState, props, sampleHeight, dt) {
 runtime.recentEvent=null;
 if (runtime.phase === 'completed' || runtime.phase === 'crashed') return;
 runtime.elapsedSec += dt;
 if (runtime.bannerTimer > 0) runtime.bannerTimer=Math.max(0, runtime.bannerTimer - dt);
 if (runtime.spec.objectiveType === 'rings-and-land' && runtime.gateIndex < runtime.gates.length) {
  const g=runtime.gates[runtime.gateIndex];
  if (Math.hypot(flightState.position.x - g.x, flightState.position.y - g.y, flightState.position.z - g.z) <= g.radius + 11) {
  g.cleared=true; runtime.gateIndex += 1;
  const bonus=500 + Math.round(flightState.telemetry.airspeedKnots * 2.5);
  runtime.score += bonus; runtime.recentEvent='gate_cleared';
  runtime.bannerText=runtime.gateIndex < runtime.gates.length ? `GATE ${runtime.gateIndex}/${runtime.gates.length} CLEARED · +${bonus}` : 'ALL GATES CLEARED — LINE UP FOR RUNWAY 09 LANDING';
  runtime.bannerTimer=2.8;
  }
 }
 if (runtime.gates.every((g) => g.cleared) && runtime.drops.every((d) => d.delivered)) runtime.phase='return-to-land';
 if (runtime.phase === 'return-to-land' && flightState.onGround && flightState.landingReport && flightState.telemetry.groundSpeedKnots < 34) {
  runtime.phase='completed'; flightState.landed=true;
  const gb=flightState.landingReport.grade === 'S' ? 1200 : flightState.landingReport.grade === 'A+' ? 900 : 500;
  runtime.score += Math.round(flightState.telemetry.fuelPercent * 14) + Math.round(flightState.hull * 12) + gb;
  runtime.recentEvent='mission_complete';
 }
 for (let i=0; i < props.gateMeshes.length; i++) {
  const gm=props.gateMeshes[i];
  if (runtime.gates[i].cleared) { gm.holder.visible=false; continue; }
  gm.holder.visible=true;
  const cur=i === runtime.gateIndex;
  gm.holder.scale.setScalar(cur ? 1 + Math.sin(runtime.elapsedSec * 5.2) * 0.045 : 0.92);
  gm.outerMat.color.setHex(cur ? 0xffbf3b : 0x45d9e8);
  gm.outerMat.emissive.setHex(cur ? 0xff8c1a : 0x168099);
  gm.outerMat.emissiveIntensity=cur ? 1.7 : 0.85;
  gm.innerMat.opacity=cur ? 0.42 : 0.16;
 }
 for (let i=0; i < props.dropMeshes.length; i++) {
  const dm=props.dropMeshes[i];
  const done=runtime.drops[i].delivered;
  dm.circleMat.color.setHex(done ? 0x56f7b0 : 0xff6e1f);
  dm.beam.visible=!done;
  for (let p=0; p < dm.puffs.length; p++) {
  const cyc=(runtime.elapsedSec * 0.5 + p / dm.puffs.length) % 1;
  const puff=dm.puffs[p];
  puff.visible=!done;
  puff.position.set(runtime.windWorld.x * cyc * 6.5 + Math.sin(runtime.elapsedSec * 2 + p) * 4,10 + cyc * 105, runtime.windWorld.z * cyc * 6.5 + Math.cos(runtime.elapsedSec * 2 + p) * 4);
  const sz=16 + cyc * 34;
  puff.scale.set(sz, sz,1);
  puff.material.opacity=(1 - cyc) * 0.82;
  }
 }
 for (const c of runtime.activeCrates) {
  if (c.settled) continue;
  c.vel.x += (runtime.windWorld.x * 0.4 - c.vel.x) * Math.min(1, dt * 1.8);
  c.vel.z += (runtime.windWorld.z * 0.4 - c.vel.z) * Math.min(1, dt * 1.8);
  c.vel.y=-11;
  c.mesh.position.addScaledVector(c.vel, dt);
  const gy=Math.max(0, sampleHeight(c.mesh.position.x, c.mesh.position.z));
  if (c.mesh.position.y <= gy + 1.8) { c.mesh.position.y=gy + 1.8; c.settled=true; }
 }
}
/** Format remaining waypoint distance in. */
export function formatWaypointDistance(meters) {
 return meters >= 1400 ? `${(meters / 1852).toFixed(1)} NM` : `${Math.round(meters)} M`;
}
function createFlareSmokeTexture() {
 const c=document.createElement('canvas');
 c.width=c.height=128;
 const ctx=c.getContext('2d');
 const g=ctx.createRadialGradient(64,64,6,64,64,62);
 g.addColorStop(0, 'rgba(255,215,140,1)');
 g.addColorStop(0.45, 'rgba(255,112,32,0.85)');
 g.addColorStop(1, 'rgba(255,80,16,0)');
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
