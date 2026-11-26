// Built 3D cockpit interior with brushed metallic housing, sealed tub, physical MFD bezels/knobs, and live glowing displays.
import * as THREE from '../../vendor/three.module.min.js';
import { createArchipelagoRadarMap, drawTacticalRadarScope } from './radar.js';
/** Build the sculpted 3D KW-4 Kestrel. */
export function buildCockpitInterior(aircraftRoot) {
 const group=new THREE.Group();
 group.name='Kestrel3DCockpit';
 group.position.set(0,0.82,-1.92);
 group.visible=false;
 const gunmetalMat=stdMat({ color: 0x2a3544, roughness: 0.44, metalness: 0.56 });
 const dashMat=stdMat({ color: 0x1e2834, roughness: 0.58, metalness: 0.44 });
 const bevelMat=stdMat({ color: 0x45566a, roughness: 0.34, metalness: 0.72 });
 const gripMat=stdMat({ color: 0x141a21, roughness: 0.85, metalness: 0.22 });
 const orangeMat=stdMat({ color: 0xec5a28, roughness: 0.4 });
 const keyLedMat=basMat({ color: 0x46c99b });
 const cabinLight=new THREE.PointLight(0x98d8f0,2.8,3.8,1.4);
 cabinLight.position.set(0,0.16,-0.25);
 group.add(cabinLight);
 part(group, boxG(2.1,0.96,0.2), dashMat, [0,-0.44,-0.84], [-0.1,0,0]);
 part(group, boxG(2.1,0.14,1.8), dashMat, [0,-0.68,-0.1]);
 part(group, boxG(1.78,0.065,0.44), gunmetalMat, [0,0.055,-0.78]);
 part(group, boxG(1.78,0.015,0.025), bevelMat, [0,0.088,-0.57]);
 for (const side of [-1,1]) {
  part(group, boxG(0.32,0.62,1.65), dashMat, [side * 0.82,-0.44,-0.18]);
  part(group, boxG(0.11,0.09,1.68), gunmetalMat, [side * 0.78,-0.06,-0.18]);
  part(group, cylG(0.034,0.044,1.06,8), gunmetalMat, [side * 0.64,0.34,-0.58], [-0.36,0, side * 0.32]);
 }
 part(group, new THREE.TorusGeometry(0.78,0.038,8,24, Math.PI), gunmetalMat, [0,-0.06,-0.38], [-0.18,0,0]);
 part(group, boxG(0.026,0.36,0.032), bevelMat, [-0.25,0.19,-0.74], [-0.32,0,0]);
 part(group, boxG(0.026,0.36,0.032), bevelMat, [0.25,0.19,-0.74], [-0.32,0,0]);
 part(group, boxG(0.52,0.024,0.04), gunmetalMat, [0,0.06,-0.7], [-0.32,0,0]);
 part(group, new THREE.PlaneGeometry(0.48,0.34), basMat({ color: 0x4df5b2, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false }), [0,0.2,-0.74], [-0.32,0,0]);
 function makeMfd(wPx, hPx, wM, hM, x, y, z, rotY) {
  const canvas=document.createElement('canvas');
  canvas.width=wPx; canvas.height=hPx;
  const tex=new THREE.CanvasTexture(canvas);
  tex.colorSpace=THREE.SRGBColorSpace;
  const holder=new THREE.Group();
  holder.position.set(x, y, z);
  holder.rotation.set(-0.14, rotY,0);
  part(holder, boxG(wM + 0.055, hM + 0.055,0.032), gunmetalMat, [0,0,-0.016]);
  part(holder, boxG(wM + 0.024, hM + 0.024,0.024), bevelMat, [0,0,-0.008]);
  part(holder, new THREE.PlaneGeometry(wM, hM), basMat({ map: tex }), [0,0,0.007]);
  for (let k=-2; k <= 2; k++) {
  part(holder, boxG(0.024,0.014,0.014), keyLedMat, [k * (wM * 0.19), -hM * 0.5 - 0.018,0.004]);
  }
  group.add(holder);
  return { canvas, ctx: canvas.getContext('2d'), tex };
 }
 const leftMfd=makeMfd(320,280,0.39,0.33,-0.46,-0.17,-0.63,0.14);
 const centerPfd=makeMfd(384,310,0.46,0.35,0,-0.165,-0.64,0);
 const rightRadar=makeMfd(320,280,0.39,0.33,0.46,-0.17,-0.63,-0.14);
 for (const kx of [-0.62,0.62]) {
  part(group, cylG(0.022,0.024,0.028,12), bevelMat, [kx,0.055,-0.56], [Math.PI / 2,0,0]);
 }
 const lamps={};
 for (const [key, x, colorOn] of [['sys',-0.46,0x56f7b0], ['fuel',-0.34,0xf5b342], ['gear',-0.22,0x56f7b0], ['nav',0.22,0x58e2ff], ['ab',0.34,0xff9a2e], ['warn',0.46,0xff3b3b]]) {
  const mat=basMat({ color: 0x21323d });
  part(group, boxG(0.095,0.028,0.02), gunmetalMat, [x,0.055,-0.57]);
  part(group, boxG(0.082,0.018,0.016), mat, [x,0.055,-0.558]);
  lamps[key] = { mat, colorOn };
 }
 const stickPivot=new THREE.Group();
 stickPivot.position.set(0,-0.6,-0.36);
 part(stickPivot, cylG(0.022,0.028,0.34,8), bevelMat, [0,0.17,0]);
 part(stickPivot, boxG(0.058,0.12,0.068), gripMat, [0,0.35,0.01]);
 part(stickPivot, boxG(0.026,0.026,0.026), orangeMat, [0,0.39,-0.026]);
 group.add(stickPivot);
 const throttlePivot=new THREE.Group();
 throttlePivot.position.set(-0.62,-0.24,-0.38);
 part(throttlePivot, boxG(0.032,0.18,0.032), bevelMat, [0,0.09,0]);
 part(throttlePivot, cylG(0.034,0.034,0.15,8), gripMat, [0.04,0.18,0], [0,0, Math.PI / 2]);
 part(throttlePivot, boxG(0.04,0.016,0.016), orangeMat, [0.08,0.18,-0.026]);
 group.add(throttlePivot);
 aircraftRoot.add(group);
 return { group, leftMfd, centerPfd, rightRadar, lamps, stickPivot, throttlePivot, radarMapCanvas: createArchipelagoRadarMap(200) };
}
/** Update live 3D cockpit stick/throttle. */
export function renderCockpitInstrumentPanels(cockpit, flightState, missionRuntime, activeWaypoint, elapsedSec, visible) {
 cockpit.group.visible=visible && !flightState.crashed;
 if (!cockpit.group.visible) return;
 cockpit.stickPivot.rotation.x=flightState.controlSurfaces.elevator * 0.28;
 cockpit.stickPivot.rotation.z=-flightState.controlSurfaces.aileron * 0.32;
 cockpit.throttlePivot.rotation.x=0.45 - flightState.throttle * 0.85;
 updateCockpitWarningLamps(cockpit, flightState, elapsedSec);
 drawCenterPfd(cockpit.centerPfd, flightState);
 drawLeftEngineMfd(cockpit.leftMfd, flightState);
 drawRightTacticalRadar(cockpit.rightRadar, cockpit.radarMapCanvas, flightState, missionRuntime, activeWaypoint, elapsedSec);
}
/** Light up the 3D glare-shield. */
export function updateCockpitWarningLamps(cockpit, flightState, elapsedSec) {
 const t=flightState.telemetry;
 const blink=Math.sin(elapsedSec * 10) > 0;
 const set=(k, on) => cockpit.lamps[k].mat.color.setHex(on ? cockpit.lamps[k].colorOn : 0x1e2f3b);
 set('sys', !t.stallWarning && flightState.hull > 40);
 set('fuel', t.lowFuelWarning || flightState.throttle > 0.85);
 set('gear', flightState.gearDown);
 set('nav', true);
 set('ab', flightState.afterburner);
 set('warn', (t.stallWarning || t.pullUpWarning || t.overspeedWarning || flightState.hull < 45) && blink);
}
function part(parent, geom, mat, pos, rot) {
 const m=new THREE.Mesh(geom, mat);
 if (pos) m.position.set(pos[0], pos[1], pos[2]);
 if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
 parent.add(m);
 return m;
}
function drawCenterPfd(mfd, flightState) {
 const { ctx, canvas, tex } = mfd;
 const w=canvas.width; const h=canvas.height;
 const t=flightState.telemetry;
 const cx=w * 0.5; const cy=h * 0.48; const r=96;
 ctx.fillStyle='#07131c'; ctx.fillRect(0,0, w, h);
 ctx.save();
 ctx.beginPath(); ctx.arc(cx, cy, r,0, Math.PI * 2); ctx.clip();
 ctx.translate(cx, cy);
 ctx.rotate((-t.rollDeg * Math.PI) / 180);
 const shift=t.pitchDeg * 3.1;
 const sky=ctx.createLinearGradient(0,-140,0, shift);
 sky.addColorStop(0, '#13599c'); sky.addColorStop(1, '#3ca0d8');
 ctx.fillStyle=sky; ctx.fillRect(-160,-220 + shift,320,220);
 const gnd=ctx.createLinearGradient(0, shift,0,220 + shift);
 gnd.addColorStop(0, '#8f5228'); gnd.addColorStop(1, '#4c2812');
 ctx.fillStyle=gnd; ctx.fillRect(-160, shift,320,220);
 ctx.strokeStyle='#fff'; ctx.lineWidth=2.5;
 ctx.beginPath(); ctx.moveTo(-140, shift); ctx.lineTo(140, shift); ctx.stroke();
 ctx.font='bold 12px monospace'; ctx.fillStyle='#edf8ff'; ctx.textAlign='left';
 for (let d=-30; d <= 30; d += 10) {
  if (d === 0) continue;
  const py=shift - d * 3.1;
  ctx.lineWidth=1.6;
  ctx.beginPath(); ctx.moveTo(-36, py); ctx.lineTo(36, py); ctx.stroke();
  ctx.fillText(`${Math.abs(d)}`,40, py + 4);
 }
 ctx.restore();
 ctx.strokeStyle='#4ad7a6'; ctx.lineWidth=2.5;
 ctx.beginPath(); ctx.arc(cx, cy, r,0, Math.PI * 2); ctx.stroke();
 ctx.strokeStyle='#ffbe3d'; ctx.lineWidth=3.5;
 ctx.beginPath(); ctx.moveTo(cx - 34, cy); ctx.lineTo(cx - 10, cy); ctx.lineTo(cx, cy + 9); ctx.lineTo(cx + 10, cy); ctx.lineTo(cx + 34, cy); ctx.stroke();
 ctx.fillStyle='rgba(5,18,28,0.92)'; ctx.strokeStyle='#56f7b0'; ctx.lineWidth=2;
 ctx.fillRect(10, cy - 26,78,52); ctx.strokeRect(10, cy - 26,78,52);
 ctx.fillRect(w - 94, cy - 26,84,52); ctx.strokeRect(w - 94, cy - 26,84,52);
 ctx.fillStyle='#97c7d8'; ctx.font='bold 11px monospace'; ctx.textAlign='center';
 ctx.fillText('IAS KT',49, cy - 9); ctx.fillText('ALT FT', w - 52, cy - 9);
 ctx.fillStyle='#56f7b0'; ctx.font='bold 22px monospace';
 ctx.fillText(`${Math.round(t.airspeedKnots)}`,49, cy + 16);
 ctx.fillText(`${Math.round(t.altitudeFeet)}`, w - 52, cy + 16);
 ctx.fillStyle='#0c2231'; ctx.fillRect(10, h - 42, w - 20,32);
 ctx.strokeStyle='rgba(86,247,176,0.45)'; ctx.strokeRect(10, h - 42, w - 20,32);
 ctx.fillStyle='#edf8ff'; ctx.font='bold 15px monospace';
 ctx.fillText(`HDG ${String(Math.round(t.headingDeg)).padStart(3, '0')}°  ·  VSI ${t.verticalSpeedFpm >= 0 ? '+' : ''}${Math.round(t.verticalSpeedFpm)}  ·  ${t.gLoad.toFixed(1)}G`, cx, h - 21);
 ctx.fillStyle='#56f7b0'; ctx.font='bold 12px monospace'; ctx.textAlign='left';
 ctx.fillText('PFD · PRIMARY FLIGHT DISPLAY',14,20);
 tex.needsUpdate=true;
}
function drawLeftEngineMfd(mfd, flightState) {
 const { ctx, canvas, tex } = mfd;
 const t=flightState.telemetry;
 ctx.fillStyle='#06131b'; ctx.fillRect(0,0, canvas.width, canvas.height);
 ctx.fillStyle='#56f7b0'; ctx.font='bold 12px monospace'; ctx.textAlign='left';
 ctx.fillText('ENG / SYS · KW-04',14,22);
 ctx.strokeStyle='#1b3545'; ctx.lineWidth=12;
 ctx.beginPath(); ctx.arc(88,112,56, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke();
 ctx.strokeStyle=flightState.afterburner ? '#ff9d2e' : '#56f7b0';
 ctx.beginPath(); ctx.arc(88,112,56, Math.PI * 0.75, Math.PI * (0.75 + Math.min(1, flightState.throttle / 1.15) * 1.5)); ctx.stroke();
 ctx.fillStyle='#edf8ff'; ctx.font='bold 24px monospace'; ctx.textAlign='center';
 ctx.fillText(`${t.throttlePercent}%`,88,118);
 ctx.fillStyle=flightState.afterburner ? '#ffae3d' : '#90bdd0'; ctx.font='bold 11px monospace';
 ctx.fillText(flightState.afterburner ? 'AFTERBURNER' : 'N1 THRUST',88,137);
 for (const [bx, label, pct, warn] of [[182, 'FUEL', t.fuelPercent,20], [248, 'HULL', flightState.hull,35]]) {
  ctx.fillStyle='#112533'; ctx.fillRect(bx,52,42,110);
  const fh=Math.max(2, (Math.max(0, Math.min(100, pct)) / 100) * 110);
  ctx.fillStyle=pct < warn ? '#ff5252' : pct < warn + 18 ? '#f5b342' : '#56f7b0';
  ctx.fillRect(bx,162 - fh,42, fh);
  ctx.strokeStyle='#407082'; ctx.lineWidth=1.5; ctx.strokeRect(bx,52,42,110);
  ctx.fillStyle='#edf8ff'; ctx.font='bold 13px monospace'; ctx.fillText(`${Math.round(pct)}%`, bx + 21,180);
  ctx.fillStyle='#8cb7c8'; ctx.font='bold 11px monospace'; ctx.fillText(label, bx + 21,45);
 }
 const pills=[
  [flightState.gearDown ? 'GEAR DOWN' : 'GEAR UP', flightState.gearDown, '#56f7b0'],
  [`FLAPS ${Math.round(flightState.flapAngleDeg)}°`, flightState.flapAngleDeg > 2, '#7be3ff'],
  [flightState.airbrake > 0.2 ? 'BRAKE ON' : 'BRAKE OFF', flightState.airbrake > 0.2, '#f5b342'],
  [t.lowFuelWarning ? 'LOW FUEL' : 'FUEL OK', t.lowFuelWarning, '#ff5656'],
 ];
 for (let i=0; i < pills.length; i++) {
  const [txt, on, col] = pills[i];
  const px=14 + (i % 2) * 148;
  const py=204 + Math.floor(i / 2) * 34;
  ctx.fillStyle=on ? 'rgba(86,247,176,0.2)' : '#0f202c'; ctx.fillRect(px, py,140,26);
  ctx.strokeStyle=on ? col : '#2a4657'; ctx.lineWidth=1.8; ctx.strokeRect(px, py,140,26);
  ctx.fillStyle=on ? col : '#7fa1b3'; ctx.font='bold 12px monospace'; ctx.fillText(txt, px + 70, py + 17);
 }
 tex.needsUpdate=true;
}
function drawRightTacticalRadar(mfd, terrainMap, flightState, missionRuntime, activeWaypoint, elapsedSec) {
 const { ctx, canvas, tex } = mfd;
 ctx.fillStyle='#051219'; ctx.fillRect(0,0, canvas.width, canvas.height);
 ctx.fillStyle='#56f7b0'; ctx.font='bold 12px monospace'; ctx.textAlign='left';
 ctx.fillText('NAV RADAR · 2.5 NM',14,22);
 drawTacticalRadarScope(ctx, terrainMap, canvas.width * 0.5, canvas.height * 0.54,102,2350, flightState, missionRuntime, activeWaypoint, elapsedSec);
 tex.needsUpdate=true;
}
const stdMat=(o) => new THREE.MeshStandardMaterial(o);
const basMat=(o) => new THREE.MeshBasicMaterial(o);
const boxG=(...a) => new THREE.BoxGeometry(...a);
const cylG=(...a) => new THREE.CylinderGeometry(...a);
const sphG=(...a) => new THREE.SphereGeometry(...a);
