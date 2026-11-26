// High-contrast collimated aviation HUD: pitch ladder, ILS approach cues, heading/airspeed/altitude tapes, and mini-radar.
import * as THREE from '../../vendor/three.module.min.js';
import { CAMERA_MODES, FLIGHT_LIMITS, UNIT_CONVERSIONS } from '../config.js';
import { formatWaypointDistance } from '../world/missions.js';
import { createArchipelagoRadarMap, drawTacticalRadarScope } from './radar.js';
/** Create the 2D HUD renderer attached. */
export function createHudRenderer(hudCanvas) {
  const ctx=hudCanvas.getContext('2d');
  const radarMap=createArchipelagoRadarMap(180);
  return {
  ctx, radarMap,
  resize(w, h, dpr) { hudCanvas.width=Math.round(w * dpr); hudCanvas.height=Math.round(h * dpr); ctx.setTransform(dpr,0,0, dpr,0,0); },
  render(w, h, fs, rt, wp, cam, camMode, ctrl, sec) {
  ctx.clearRect(0,0, w, h);
  drawCollimatedFlightHud(ctx, w, h, fs, wp, cam, camMode);
  drawAirspeedAndAltitudeTapes(ctx, w, h, fs, camMode);
  drawHeadingCompassAndRadar(ctx, w, h, radarMap, fs, rt, wp, camMode, sec);
  drawStatusAndMissionBar(ctx, w, h, fs, rt, wp, camMode, ctrl, sec);
  },
  };
}
/** Draw collimated pitch ladder,. */
export function drawCollimatedFlightHud(ctx, w, h, fs, wp, cam, camMode) {
  if (camMode === CAMERA_MODES.TOUCHDOWN) return;
  const t=fs.telemetry;
  const isCockpit=camMode === CAMERA_MODES.COCKPIT;
  const cx=w * 0.5;
  const cy=isCockpit ? h * 0.37 : h * 0.48;
  const col=t.stallWarning || t.pullUpWarning ? '#ff6464' : '#56f7b0';
  const ppd=h * (isCockpit ? 0.0085 : 0.0115);
  ctx.save();
  ctx.beginPath();
  ctx.rect(cx - (isCockpit ? 110 : 175), cy - (isCockpit ? 66 : 115), isCockpit ? 220 : 350, isCockpit ? 132 : 230);
  ctx.clip();
  ctx.translate(cx, cy);
  ctx.rotate((-t.rollDeg * Math.PI) / 180);
  const pOff=t.pitchDeg * ppd;
  ctx.strokeStyle=col; ctx.shadowColor='rgba(4,14,20,.9)'; ctx.shadowBlur=4; ctx.lineWidth=2.1;
  const hh=isCockpit ? 94 : 128;
  ctx.beginPath(); ctx.moveTo(-hh, pOff); ctx.lineTo(-24, pOff); ctx.moveTo(24, pOff); ctx.lineTo(hh, pOff); ctx.stroke();
  for (let d=-30; d <= 30; d += 5) {
  if (d === 0) continue;
  const py=pOff - d * ppd;
  const maj=d % 10 === 0;
  const half=maj ? (isCockpit ? 40 : 52) : 24;
  ctx.strokeStyle=col; ctx.lineWidth=maj ? 1.8 : 1.25; ctx.setLineDash(d < 0 ? [6,5] : []);
  ctx.beginPath(); ctx.moveTo(-half, py); ctx.lineTo(-16, py); ctx.moveTo(16, py); ctx.lineTo(half, py); ctx.stroke();
  if (maj) {
  ctx.setLineDash([]);
  const tk=d > 0 ? 6 : -6;
  ctx.strokeStyle=col; ctx.lineWidth=1.8;
  ctx.beginPath(); ctx.moveTo(-half, py); ctx.lineTo(-half, py + tk); ctx.moveTo(half, py); ctx.lineTo(half, py + tk); ctx.stroke();
  txt(ctx, `${Math.abs(d)}`, half + 14, py + 4, col, 'center', 'bold 10.5px monospace');
  }
  }
  ctx.setLineDash([]); ctx.restore();
  ctx.save(); ctx.strokeStyle=col; ctx.lineWidth=2.1;
  ctx.beginPath(); ctx.moveTo(cx - 16, cy); ctx.lineTo(cx - 6, cy); ctx.lineTo(cx, cy + 5); ctx.lineTo(cx + 6, cy); ctx.lineTo(cx + 16, cy); ctx.stroke();
  const fpmY=cy + Math.max(-44, Math.min(44, t.aoaDeg * ppd * 0.75));
  ctx.beginPath(); ctx.arc(cx, fpmY,7.5,0, Math.PI * 2);
  ctx.moveTo(cx - 16, fpmY); ctx.lineTo(cx - 7.5, fpmY); ctx.moveTo(cx + 7.5, fpmY); ctx.lineTo(cx + 16, fpmY); ctx.moveTo(cx, fpmY - 7.5); ctx.lineTo(cx, fpmY - 14);
  ctx.stroke();
  if (!isCockpit && fs.gearDown && !fs.onGround) {
  ctx.strokeStyle='rgba(123,227,255,.75)'; ctx.lineWidth=1.4;
  for (let k=-2; k <= 2; k++) { ctx.beginPath(); ctx.arc(cx + k * 24, cy + 128, k === 0 ? 3.5 : 2,0, Math.PI * 2); ctx.stroke(); }
  const loc=Math.max(-48, Math.min(48, -fs.position.z * 0.55));
  ctx.fillStyle='#7be3ff';
  ctx.beginPath(); ctx.moveTo(cx + loc, cy + 121); ctx.lineTo(cx + loc + 5, cy + 128); ctx.lineTo(cx + loc, cy + 135); ctx.lineTo(cx + loc - 5, cy + 128); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  if (wp) {
  _proj.set(wp.x, wp.y, wp.z);
  const dist=_proj.distanceTo(fs.position);
  _proj.project(cam);
  if (_proj.z < 1) {
  const sx=Math.max(80, Math.min(w - 80, (_proj.x * 0.5 + 0.5) * w));
  const sy=Math.max(82, Math.min(h - 96, (-_proj.y * 0.5 + 0.5) * h));
  const wc=wp.kind === 'drop' ? '#ff9438' : '#ffd24c';
  ctx.save(); ctx.strokeStyle=wc; ctx.lineWidth=2.2;
  ctx.beginPath(); ctx.moveTo(sx, sy - 10); ctx.lineTo(sx + 10, sy); ctx.lineTo(sx, sy + 10); ctx.lineTo(sx - 10, sy); ctx.closePath(); ctx.stroke();
  txt(ctx, `${wp.shortLabel} · ${formatWaypointDistance(dist)}`, sx, Math.max(92, sy + (wp.kind === 'gate' ? -68 : -20)), wc, 'center', 'bold 12.5px monospace');
  ctx.restore();
  }
  }
}
/** Draw left Airspeed/Throttle tape and. */
export function drawAirspeedAndAltitudeTapes(ctx, w, h, fs, camMode) {
  if (camMode === CAMERA_MODES.TOUCHDOWN) return;
  const t=fs.telemetry;
  const col='#56f7b0';
  if (camMode === CAMERA_MODES.COCKPIT) {
  const cy=h * 0.37; const lx=w * 0.32; const rx=w * 0.68;
  drawReadoutBox(ctx, lx - 44, cy - 22,80,44, 'IAS KT', `${Math.round(t.airspeedKnots)}`, col, '#fff');
  drawReadoutBox(ctx, rx - 36, cy - 22,86,44, 'ALT FT', `${Math.round(t.altitudeFeet)}`, col, '#fff');
  txt(ctx, `THR ${t.throttlePercent}%`, lx - 4, cy + 38, col, 'center', 'bold 11.5px monospace');
  txt(ctx, `AGL ${Math.round(t.aglFeet)} FT`, rx + 7, cy + 38, col, 'center', 'bold 11.5px monospace');
  return;
  }
  const cy=h * 0.48; const th=210; const lx=w * 0.21; const rx=w * 0.79;
  drawVerticalTape(ctx, lx, cy, th, t.airspeedKnots,10,20,2.2, true, FLIGHT_LIMITS.cleanStallKnots);
  drawReadoutBox(ctx, lx - 86, cy - 24,84,48, 'IAS KT', `${Math.round(t.airspeedKnots)}`, t.stallWarning ? '#ff5656' : col, t.stallWarning ? '#ff7070' : '#fff');
  txt(ctx, fs.afterburner ? `THR ${t.throttlePercent}% A/B` : `THR ${t.throttlePercent}%`, lx - 36, cy + th * 0.5 + 20, fs.afterburner ? '#ffae3d' : col, 'center', 'bold 13px monospace');
  drawVerticalTape(ctx, rx, cy, th, t.altitudeFeet,100,200,0.24, false,-1);
  drawReadoutBox(ctx, rx + 2, cy - 24,92,48, 'ALT FT', `${Math.round(t.altitudeFeet)}`, t.pullUpWarning ? '#ff5656' : col, '#fff');
  txt(ctx, `VSI ${t.verticalSpeedFpm >= 0 ? '+' : ''}${Math.round(t.verticalSpeedFpm)} FPM`, rx + 44, cy + th * 0.5 + 20, Math.abs(t.verticalSpeedFpm) > 520 ? '#f5b342' : '#9dd5e6', 'center', 'bold 12px monospace');
  txt(ctx, `AGL ${Math.round(t.aglFeet)} FT`, rx + 44, cy + th * 0.5 + 37, t.aglFeet < 160 && !fs.onGround ? '#f5b342' : col, 'center', 'bold 12px monospace');
}
/** Draw top Heading Compass Tape with. */
export function drawHeadingCompassAndRadar(ctx, w, h, radarMap, fs, rt, wp, camMode, sec) {
  const t=fs.telemetry;
  const cx=w * 0.5; const topY=48; const tw=340; const col='#56f7b0';
  const cards={ 0: 'N',90: 'E',180: 'S',270: 'W' };
  ctx.save();
  ctx.fillStyle='rgba(7,18,28,.62)'; ctx.fillRect(cx - tw * 0.5, topY - 24, tw,34);
  ctx.strokeStyle='rgba(86,247,176,.55)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(cx - tw * 0.5, topY + 10); ctx.lineTo(cx + tw * 0.5, topY + 10); ctx.stroke();
  ctx.beginPath(); ctx.rect(cx - tw * 0.5, topY - 26, tw,42); ctx.clip();
  for (let d=-55; d <= 55; d += 5) {
  const raw=Math.round((t.headingDeg + d) / 5) * 5;
  const x=cx + (raw - t.headingDeg) * 3.4;
  const norm=((raw % 360) + 360) % 360;
  const maj=norm % 10 === 0;
  ctx.strokeStyle=col; ctx.lineWidth=maj ? 1.8 : 1.1;
  ctx.beginPath(); ctx.moveTo(x, topY + 10); ctx.lineTo(x, topY + (maj ? -1 : 4)); ctx.stroke();
  if (maj) txt(ctx, cards[norm] ?? String(norm).padStart(3, '0'), x, topY - 6, cards[norm] ? '#ffd24c' : col, 'center', 'bold 12px monospace');
  }
  if (wp) {
  const wpDeg=(((Math.atan2(wp.x - fs.position.x, -(wp.z - fs.position.z)) * UNIT_CONVERSIONS.RAD_TO_DEG) % 360) + 360) % 360;
  let rel=wpDeg - t.headingDeg;
  if (rel > 180) rel -= 360;
  if (rel < -180) rel += 360;
  const bx=Math.max(cx - tw * 0.48, Math.min(cx + tw * 0.48, cx + rel * 3.4));
  ctx.fillStyle='#ffd24c';
  ctx.beginPath(); ctx.moveTo(bx, topY + 10); ctx.lineTo(bx - 6, topY + 18); ctx.lineTo(bx + 6, topY + 18); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle='rgba(7,18,28,.92)'; ctx.strokeStyle=col; ctx.lineWidth=2;
  ctx.fillRect(cx - 46,6,92,26); ctx.strokeRect(cx - 46,6,92,26);
  txt(ctx, `HDG ${String(Math.round(t.headingDeg)).padStart(3, '0')}°`, cx,24, '#fff', 'center', 'bold 15px monospace');
  if (camMode !== CAMERA_MODES.CHASE) return;
  const r=74; const rx=w - r - 22; const ry=h - r - 22;
  drawTacticalRadarScope(ctx, radarMap, rx, ry, r,2150, fs, rt, wp, sec);
  txt(ctx, 'RADAR · 2 NM', rx, ry - r - 8, '#9dd5e6', 'center', 'bold 11px monospace');
}
/** Draw top-left Sortie Mission Panel,. */
export function drawStatusAndMissionBar(ctx, w, h, fs, rt, wp, camMode, ctrl, sec) {
  const t=fs.telemetry;
  ctx.fillStyle='rgba(8,19,29,.8)'; ctx.strokeStyle='rgba(86,247,176,.48)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.roundRect(16,14,372,74,8); ctx.fill(); ctx.stroke();
  const mm=String(Math.floor(rt.elapsedSec / 60)).padStart(2, '0');
  const ss=String(Math.floor(rt.elapsedSec % 60)).padStart(2, '0');
  ctx.textAlign='left'; ctx.fillStyle='#56f7b0'; ctx.font='bold 12px monospace';
  ctx.fillText(`${rt.spec.code} · ${rt.spec.title.toUpperCase()}`,28,34);
  ctx.fillStyle='#ffd24c'; ctx.fillText(wp ? wp.label : 'SORTIE COMPLETE',28,54);
  ctx.fillStyle='#b7d4e2'; ctx.font='bold 11px monospace';
  ctx.fillText(`TIME ${mm}:${ss}  ·  SCORE ${rt.score.toLocaleString()}  ·  WIND ${Math.round(t.windSpeedKnots)} KT`,28,74);
  if (camMode !== CAMERA_MODES.TOUCHDOWN) {
  ctx.fillStyle='rgba(8,19,29,.74)'; ctx.strokeStyle='rgba(123,227,255,.38)'; ctx.lineWidth=1.3;
  ctx.beginPath(); ctx.roundRect(w - 214,14,198,50,8); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#7be3ff'; ctx.font='bold 12px monospace'; ctx.textAlign='right';
  ctx.fillText(camMode === CAMERA_MODES.COCKPIT ? 'COCKPIT VIEW [C]' : 'CHASE VIEW [C]', w - 28,34);
  ctx.fillStyle='#9bb8c8'; ctx.font='bold 11px monospace';
  ctx.fillText(ctrl.flightAssist ? 'ASSIST ON [T] · PAUSE [P]' : 'MANUAL [T] · PAUSE [P]', w - 28,52);
  }
  if (camMode !== CAMERA_MODES.COCKPIT) {
  const px=16; const py=h - 96;
  ctx.fillStyle='rgba(8,19,29,.82)'; ctx.strokeStyle='rgba(86,247,176,.44)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.roundRect(px, py,390,80,8); ctx.fill(); ctx.stroke();
  for (const [gx, label, pct, warn] of [[px + 14, 'FUEL', t.fuelPercent,22], [px + 148, 'HULL', fs.hull,38]]) {
  ctx.fillStyle='#b4d0de'; ctx.font='bold 11px monospace'; ctx.textAlign='left'; ctx.fillText(`${label} ${Math.round(pct)}%`, gx, py + 22);
  ctx.fillStyle='#142736'; ctx.fillRect(gx, py + 27,118,9);
  ctx.fillStyle=pct < warn ? '#ff5656' : pct < warn + 18 ? '#f5b342' : '#56f7b0';
  ctx.fillRect(gx, py + 27, Math.max(2, (Math.max(0, Math.min(100, pct)) / 100) * 118),9);
  }
  ctx.fillStyle='#d8edf6'; ctx.font='bold 12px monospace'; ctx.textAlign='left';
  ctx.fillText(`G ${t.gLoad.toFixed(1)}`, px + 282, py + 22);
  ctx.fillText(`AOA ${t.aoaDeg.toFixed(1)}°`, px + 282, py + 37);
  const pills=[
  [fs.gearDown ? 'GEAR DOWN' : 'GEAR UP', fs.gearDown, '#56f7b0'],
  [`FLAPS ${Math.round(fs.flapAngleDeg)}°`, fs.flapAngleDeg > 2, '#7be3ff'],
  [fs.airbrake > 0.2 ? 'AIRBRAKE' : 'CLEAN', fs.airbrake > 0.2, '#f5b342'],
  [fs.afterburner ? 'AFTERBURNER' : 'MIL POWER', fs.afterburner, '#ff9c38'],
  ];
  for (let i=0; i < pills.length; i++) {
  const [label, on, col] = pills[i]; const bx=px + 14 + i * 92;
  ctx.fillStyle=on ? 'rgba(86,247,176,.16)' : 'rgba(20,36,48,.72)';
  ctx.strokeStyle=on ? col : 'rgba(130,166,184,.28)'; ctx.lineWidth=1.2;
  ctx.beginPath(); ctx.roundRect(bx, py + 47,86,22,4); ctx.fill(); ctx.stroke();
  ctx.fillStyle=on ? col : '#8ba8b8'; ctx.font='bold 10.5px monospace'; ctx.textAlign='center';
  ctx.fillText(label, bx + 43, py + 62);
  }
  }
  let alert=null;
  const blink=Math.sin(sec * 9) > -0.2;
  if (t.stallWarning && blink) alert=['STALL WARNING — LOWER NOSE & ADD THROTTLE', '#ff5a5a', 'rgba(42,10,14,.92)'];
  else if (t.pullUpWarning && blink) alert=['PULL UP — TERRAIN CLEARANCE LOW', '#ff5a5a', 'rgba(42,10,14,.92)'];
  else if (t.overspeedWarning && blink) alert=['OVERSPEED FLUTTER — REDUCE THROTTLE OR AIRBRAKE [B]', '#ff8c38', 'rgba(40,18,8,.9)'];
  else if (t.gearWarning) alert=['LOW APPROACH — PRESS [G] TO DEPLOY LANDING GEAR', '#f5b342', 'rgba(34,24,8,.9)'];
  else if (t.lowFuelWarning && fs.fuelKg > 0) alert=[`CAUTION: LOW FUEL ${t.fuelPercent}% · HULL ${Math.round(fs.hull)}% — CONSERVE THROTTLE`, '#ffbf3b', 'rgba(36,22,6,.92)'];
  else if (fs.fuelKg <= 0.1) alert=['FUEL EXHAUSTED — GLIDE AT 110 KT TO RUNWAY 09', '#ff6b57', 'rgba(42,12,14,.92)'];
  else if (rt.bannerTimer > 0 && rt.bannerText) alert=[rt.bannerText, '#56f7b0', 'rgba(8,30,26,.88)'];
  if (alert) {
  const [msg, col, bg] = alert;
  ctx.font='bold 15px monospace';
  const bw=ctx.measureText(msg).width + 42;
  ctx.fillStyle=bg; ctx.strokeStyle=col; ctx.lineWidth=2.2;
  ctx.beginPath(); ctx.roundRect(w * 0.5 - bw * 0.5,76, bw,36,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle=col; ctx.textAlign='center'; ctx.fillText(msg, w * 0.5,99);
  }
}
const _proj=new THREE.Vector3();
function drawVerticalTape(ctx, x, cy, th, val, step, majStep, scale, isLeft, warnBelow) {
  ctx.save();
  const rw=isLeft ? 66 : 74;
  ctx.fillStyle='rgba(7,17,26,.48)'; ctx.fillRect(isLeft ? x - rw : x, cy - th * 0.5, rw, th);
  ctx.strokeStyle='rgba(86,247,176,.65)'; ctx.lineWidth=1.6;
  ctx.beginPath(); ctx.moveTo(x, cy - th * 0.5); ctx.lineTo(x, cy + th * 0.5); ctx.stroke();
  ctx.beginPath(); ctx.rect(isLeft ? x - rw - 2 : x - 2, cy - th * 0.5, rw + 4, th); ctx.clip();
  const base=Math.floor(val / step) * step;
  for (let v=base - step * 6; v <= base + step * 6; v += step) {
  if (v < 0) continue;
  const y=cy - (v - val) * scale;
  const maj=v % majStep === 0;
  ctx.strokeStyle=warnBelow > 0 && v <= warnBelow ? '#ff5c5c' : '#56f7b0';
  ctx.lineWidth=maj ? 1.8 : 1.2;
  ctx.beginPath(); ctx.moveTo(x + (isLeft ? -(maj ? 12 : 7) : 0), y); ctx.lineTo(x + (isLeft ? 0 : (maj ? 12 : 7)), y); ctx.stroke();
  if (maj) txt(ctx, `${v}`, x + (isLeft ? -16 : 16), y + 4, '#56f7b0', isLeft ? 'right' : 'left', 'bold 12px monospace');
  }
  ctx.restore();
}
function drawReadoutBox(ctx, x, y, w, h, label, val, borderCol, valCol) {
  ctx.fillStyle='rgba(7,18,28,.94)'; ctx.strokeStyle=borderCol; ctx.lineWidth=2.1;
  ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
  txt(ctx, label, x + w * 0.5, y + 15, '#8cd6e8', 'center', 'bold 10.5px monospace');
  txt(ctx, val, x + w * 0.5, y + h - 9, valCol, 'center', 'bold 20px monospace');
}
function txt(ctx, text, x, y, fill, align='center', font='bold 14px monospace') {
  ctx.font=font; ctx.textAlign=align; ctx.lineWidth=3.2; ctx.strokeStyle='rgba(5,13,20,.85)';
  ctx.strokeText(text, x, y); ctx.fillStyle=fill; ctx.fillText(text, x, y);
}
