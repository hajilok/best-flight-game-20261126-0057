// High-contrast collimated aviation HUD: combiner-framed cockpit optics, ILS cues, tapes, compass, and mini-radar.
import * as THREE from '../../vendor/three.module.min.js';
import { CAMERA_MODES, FLIGHT_LIMITS, UNIT_CONVERSIONS } from '../config.js';
import { formatWaypointDistance } from '../world/missions.js';
import { createArchipelagoRadarMap, drawTacticalRadarScope } from './radar.js';

export function createHudRenderer(hudCanvas) {
  const ctx = hudCanvas.getContext('2d'), radarMap = createArchipelagoRadarMap(180);
  return {
    ctx, radarMap,
    resize(w, h, dpr) { hudCanvas.width = Math.round(w * dpr); hudCanvas.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); },
    render(w, h, fs, rt, wp, cam, camMode, ctrl, sec) {
      ctx.clearRect(0, 0, w, h);
      drawCollimatedFlightHud(ctx, w, h, fs, wp, cam, camMode);
      drawAirspeedAndAltitudeTapes(ctx, w, h, fs, camMode);
      drawHeadingCompassAndRadar(ctx, w, h, radarMap, fs, rt, wp, camMode, sec);
      drawStatusAndMissionBar(ctx, w, h, fs, rt, wp, camMode, ctrl, sec);
    },
  };
}

export function drawCollimatedFlightHud(ctx, w, h, fs, wp, cam, camMode) {
  if (camMode === CAMERA_MODES.TOUCHDOWN) return;
  const t = fs.telemetry, isC = camMode === CAMERA_MODES.COCKPIT, cx = w * 0.5, cy = isC ? h * 0.365 : h * 0.475;
  const col = t.stallWarning || t.pullUpWarning ? '#ff6464' : '#58f7b2', ppd = h * (isC ? 0.0076 : 0.0112);
  const clipW = isC ? 114 : 175, clipH = isC ? 62 : 112;

  ctx.save(); ctx.beginPath(); ctx.rect(cx - clipW, cy - clipH, clipW * 2, clipH * 2); ctx.clip();
  ctx.translate(cx, cy); ctx.rotate((-t.rollDeg * Math.PI) / 180);
  const pOff = t.pitchDeg * ppd, hh = isC ? 78 : 124;
  ctx.strokeStyle = col; ctx.shadowColor = 'rgba(4,14,20,0.88)'; ctx.shadowBlur = 4; ctx.lineWidth = isC ? 1.8 : 2.1;
  ctx.beginPath(); ctx.moveTo(-hh, pOff); ctx.lineTo(-22, pOff); ctx.moveTo(22, pOff); ctx.lineTo(hh, pOff); ctx.stroke();

  for (let d = -30; d <= 30; d += 5) {
    if (d === 0) continue;
    const py = pOff - d * ppd, maj = d % 10 === 0, half = maj ? (isC ? 34 : 50) : 22;
    ctx.strokeStyle = col; ctx.lineWidth = maj ? 1.7 : 1.2; ctx.setLineDash(d < 0 ? [5, 4] : []);
    ctx.beginPath(); ctx.moveTo(-half, py); ctx.lineTo(-14, py); ctx.moveTo(14, py); ctx.lineTo(half, py); ctx.stroke();
    if (maj) {
      ctx.setLineDash([]); const tk = d > 0 ? 5 : -5; ctx.strokeStyle = col;
      ctx.beginPath(); ctx.moveTo(-half, py); ctx.lineTo(-half, py + tk); ctx.moveTo(half, py); ctx.lineTo(half, py + tk); ctx.stroke();
      drawHudText(ctx, `${Math.abs(d)}`, half + 12, py + 4, col, 'center', 'bold 10px monospace');
    }
  }
  ctx.setLineDash([]); ctx.restore();

  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - 15, cy); ctx.lineTo(cx - 5, cy); ctx.lineTo(cx, cy + 5); ctx.lineTo(cx + 5, cy); ctx.lineTo(cx + 15, cy); ctx.stroke();
  const fpmY = cy + Math.max(-40, Math.min(40, t.aoaDeg * ppd * 0.75));
  ctx.beginPath(); ctx.arc(cx, fpmY, 7, 0, Math.PI * 2); ctx.moveTo(cx - 15, fpmY); ctx.lineTo(cx - 7, fpmY); ctx.moveTo(cx + 7, fpmY); ctx.lineTo(cx + 15, fpmY); ctx.moveTo(cx, fpmY - 7); ctx.lineTo(cx, fpmY - 13); ctx.stroke();

  if (isC) {
    drawHudText(ctx, `${Math.round(t.airspeedKnots)}`, cx - 94, cy + 4, col, 'center', 'bold 16px monospace');
    drawHudText(ctx, 'KT', cx - 94, cy - 12, '#8ef7cb', 'center', 'bold 9.5px monospace');
    drawHudText(ctx, `${Math.round(t.altitudeFeet)}`, cx + 92, cy + 4, col, 'center', 'bold 16px monospace');
    drawHudText(ctx, 'FT', cx + 92, cy - 12, '#8ef7cb', 'center', 'bold 9.5px monospace');
    drawHudText(ctx, `THR ${t.throttlePercent}%`, cx - 84, cy + 48, '#8ef7cb', 'center', 'bold 10px monospace');
    drawHudText(ctx, `G ${t.gLoad.toFixed(1)}`, cx + 88, cy + 48, '#8ef7cb', 'center', 'bold 10px monospace');
  } else if (fs.gearDown && !fs.onGround) {
    ctx.strokeStyle = 'rgba(123,227,255,0.75)'; ctx.lineWidth = 1.4;
    for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.arc(cx + k * 24, cy + 126, k === 0 ? 3.5 : 2, 0, Math.PI * 2); ctx.stroke(); }
    const loc = Math.max(-48, Math.min(48, -fs.position.z * 0.55));
    ctx.fillStyle = '#7be3ff'; ctx.beginPath(); ctx.moveTo(cx + loc, cy + 119); ctx.lineTo(cx + loc + 5, cy + 126); ctx.lineTo(cx + loc, cy + 133); ctx.lineTo(cx + loc - 5, cy + 126); ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  if (wp) {
    _proj.set(wp.x, wp.y, wp.z); const dist = _proj.distanceTo(fs.position); _proj.project(cam);
    if (_proj.z < 1) {
      const sx = Math.max(84, Math.min(w - 84, (_proj.x * 0.5 + 0.5) * w)), sy = Math.max(82, Math.min(h - 96, (-_proj.y * 0.5 + 0.5) * h));
      const wc = wp.kind === 'drop' ? '#ff9438' : '#ffd24c';
      ctx.save(); ctx.strokeStyle = wc; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(sx, sy - 10); ctx.lineTo(sx + 10, sy); ctx.lineTo(sx, sy + 10); ctx.lineTo(sx - 10, sy); ctx.closePath(); ctx.stroke();
      const ly = isC ? Math.max(cy - 48, sy - 46) : Math.max(90, sy + (wp.kind === 'gate' ? -72 : -22));
      drawHudText(ctx, `${wp.shortLabel} · ${formatWaypointDistance(dist)}`, sx, ly, wc, 'center', isC ? 'bold 11px monospace' : 'bold 12.5px monospace');
      ctx.restore();
    }
  }
}

export function drawAirspeedAndAltitudeTapes(ctx, w, h, fs, camMode) {
  if (camMode !== CAMERA_MODES.CHASE) return;
  const t = fs.telemetry, col = '#58f7b2', cy = h * 0.475, th = 204, lx = w * 0.2, rx = w * 0.8;
  drawVerticalTape(ctx, lx, cy, th, t.airspeedKnots, 10, 20, 2.15, true, FLIGHT_LIMITS.cleanStallKnots);
  drawReadoutBox(ctx, lx - 84, cy - 23, 82, 46, 'IAS KT', `${Math.round(t.airspeedKnots)}`, t.stallWarning ? '#ff5656' : col, t.stallWarning ? '#ff7070' : '#fff');
  drawHudText(ctx, fs.afterburner ? `THR ${t.throttlePercent}% A/B` : `THR ${t.throttlePercent}%`, lx - 36, cy + th * 0.5 + 20, fs.afterburner ? '#ffae3d' : col, 'center', 'bold 13px monospace');

  drawVerticalTape(ctx, rx, cy, th, t.altitudeFeet, 100, 200, 0.23, false, -1);
  drawReadoutBox(ctx, rx + 2, cy - 23, 90, 46, 'ALT FT', `${Math.round(t.altitudeFeet)}`, t.pullUpWarning ? '#ff5656' : col, '#fff');
  drawHudText(ctx, `VSI ${t.verticalSpeedFpm >= 0 ? '+' : ''}${Math.round(t.verticalSpeedFpm)} FPM`, rx + 44, cy + th * 0.5 + 20, Math.abs(t.verticalSpeedFpm) > 520 ? '#f5b342' : '#9dd5e6', 'center', 'bold 12px monospace');
  drawHudText(ctx, `AGL ${Math.round(t.aglFeet)} FT`, rx + 44, cy + th * 0.5 + 37, t.aglFeet < 160 && !fs.onGround ? '#f5b342' : col, 'center', 'bold 12px monospace');
}

export function drawHeadingCompassAndRadar(ctx, w, h, radarMap, fs, rt, wp, camMode, sec) {
  const t = fs.telemetry, cx = w * 0.5, topY = 48, tw = 336, col = '#58f7b2', cards = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };
  ctx.save(); ctx.fillStyle = 'rgba(7,18,28,0.52)'; ctx.fillRect(cx - tw * 0.5, topY - 24, tw, 34);
  ctx.strokeStyle = 'rgba(88,247,178,0.58)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx - tw * 0.5, topY + 10); ctx.lineTo(cx + tw * 0.5, topY + 10); ctx.stroke();
  ctx.beginPath(); ctx.rect(cx - tw * 0.5, topY - 26, tw, 42); ctx.clip();
  for (let d = -55; d <= 55; d += 5) {
    const raw = Math.round((t.headingDeg + d) / 5) * 5, x = cx + (raw - t.headingDeg) * 3.4, n = ((raw % 360) + 360) % 360, maj = n % 10 === 0;
    ctx.strokeStyle = col; ctx.lineWidth = maj ? 1.8 : 1.1; ctx.beginPath(); ctx.moveTo(x, topY + 10); ctx.lineTo(x, topY + (maj ? -1 : 4)); ctx.stroke();
    if (maj) drawHudText(ctx, cards[n] ?? String(n).padStart(3, '0'), x, topY - 6, cards[n] ? '#ffd24c' : col, 'center', 'bold 12px monospace');
  }
  if (wp) {
    let rel = (((Math.atan2(wp.x - fs.position.x, -(wp.z - fs.position.z)) * UNIT_CONVERSIONS.RAD_TO_DEG) % 360) + 360) % 360 - t.headingDeg;
    if (rel > 180) rel -= 360; if (rel < -180) rel += 360;
    const bx = Math.max(cx - tw * 0.48, Math.min(cx + tw * 0.48, cx + rel * 3.4));
    ctx.fillStyle = '#ffd24c'; ctx.beginPath(); ctx.moveTo(bx, topY + 10); ctx.lineTo(bx - 6, topY + 18); ctx.lineTo(bx + 6, topY + 18); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(7,18,28,0.88)'; ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.fillRect(cx - 46, 6, 92, 26); ctx.strokeRect(cx - 46, 6, 92, 26);
  drawHudText(ctx, `HDG ${String(Math.round(t.headingDeg)).padStart(3, '0')}°`, cx, 24, '#fff', 'center', 'bold 15px monospace');

  if (camMode !== CAMERA_MODES.CHASE) return;
  const r = 72, rx = w - r - 20, ry = h - r - 20;
  drawTacticalRadarScope(ctx, radarMap, rx, ry, r, 2150, fs, rt, wp, sec);
  drawHudText(ctx, 'RADAR · 2 NM', rx, ry - r - 8, '#a6dceb', 'center', 'bold 11px monospace');
}

export function drawStatusAndMissionBar(ctx, w, h, fs, rt, wp, camMode, ctrl, sec) {
  const t = fs.telemetry;
  panel(ctx, 16, 14, 366, 72, 8, 'rgba(8,19,29,0.72)', 'rgba(88,247,178,0.46)', 1.4);
  const mm = String(Math.floor(rt.elapsedSec / 60)).padStart(2, '0'), ss = String(Math.floor(rt.elapsedSec % 60)).padStart(2, '0');
  ctx.textAlign = 'left'; ctx.fillStyle = '#58f7b2'; ctx.font = 'bold 12px monospace';
  ctx.fillText(`${rt.spec.code} · ${rt.spec.title.toUpperCase()}`, 28, 34);
  ctx.fillStyle = '#ffd24c'; ctx.fillText(wp ? wp.label : 'SORTIE COMPLETE · SAFE ROLLOUT', 28, 54);
  ctx.fillStyle = '#c4dce8'; ctx.font = 'bold 11px monospace';
  ctx.fillText(`TIME ${mm}:${ss}  ·  SCORE ${rt.score.toLocaleString()}  ·  WIND ${Math.round(t.windSpeedKnots)} KT`, 28, 73);

  if (camMode !== CAMERA_MODES.TOUCHDOWN) {
    panel(ctx, w - 212, 14, 196, 48, 8, 'rgba(8,19,29,0.68)', 'rgba(123,227,255,0.36)', 1.3);
    ctx.fillStyle = '#7be3ff'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'right';
    ctx.fillText(camMode === CAMERA_MODES.COCKPIT ? 'COCKPIT VIEW [C]' : 'CHASE VIEW [C]', w - 26, 33);
    ctx.fillStyle = '#a3c0d0'; ctx.font = 'bold 11px monospace';
    ctx.fillText(ctrl.flightAssist ? 'ASSIST ON [T] · PAUSE [P]' : 'MANUAL [T] · PAUSE [P]', w - 26, 51);
  }

  if (camMode === CAMERA_MODES.CHASE) {
    const px = 16, py = h - 94;
    panel(ctx, px, py, 390, 78, 8, 'rgba(8,19,29,0.74)', 'rgba(88,247,178,0.42)', 1.4);
    for (const [gx, lbl, pct, warn] of [[px + 14, 'FUEL', t.fuelPercent, 22], [px + 148, 'HULL', fs.hull, 38]]) {
      ctx.fillStyle = '#c0d9e6'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'left'; ctx.fillText(`${lbl} ${Math.round(pct)}%`, gx, py + 21);
      ctx.fillStyle = '#142736'; ctx.fillRect(gx, py + 26, 118, 9);
      ctx.fillStyle = pct < warn ? '#ff5656' : pct < warn + 18 ? '#f5b342' : '#58f7b2';
      ctx.fillRect(gx, py + 26, Math.max(2, (Math.max(0, Math.min(100, pct)) / 100) * 118), 9);
    }
    ctx.fillStyle = '#e0f1fa'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'left';
    ctx.fillText(`G ${t.gLoad.toFixed(1)}`, px + 282, py + 21); ctx.fillText(`AOA ${t.aoaDeg.toFixed(1)}°`, px + 282, py + 36);
    [[fs.gearDown ? 'GEAR DOWN' : 'GEAR UP', fs.gearDown, '#58f7b2'], [`FLAPS ${Math.round(fs.flapAngleDeg)}°`, fs.flapAngleDeg > 2, '#7be3ff'],
      [fs.airbrake > 0.2 ? 'AIRBRAKE' : 'CLEAN', fs.airbrake > 0.2, '#f5b342'], [fs.afterburner ? 'AFTERBURNER' : 'MIL POWER', fs.afterburner, '#ff9c38']].forEach(([lbl, on, col], i) => {
      const bx = px + 14 + i * 92;
      panel(ctx, bx, py + 46, 86, 22, 4, on ? 'rgba(88,247,178,0.16)' : 'rgba(20,36,48,0.68)', on ? col : 'rgba(130,166,184,0.28)', 1.2);
      ctx.fillStyle = on ? col : '#8eaac0'; ctx.font = 'bold 10.5px monospace'; ctx.textAlign = 'center'; ctx.fillText(lbl, bx + 43, py + 61);
    });
  }

  let alert = null; const blink = Math.sin(sec * 9) > -0.2;
  if (t.stallWarning && blink) alert = ['STALL WARNING — LOWER NOSE & ADD THROTTLE', '#ff5a5a', 'rgba(42,10,14,0.92)'];
  else if (t.pullUpWarning && blink) alert = ['PULL UP — TERRAIN CLEARANCE LOW', '#ff5a5a', 'rgba(42,10,14,0.92)'];
  else if (t.overspeedWarning && blink) alert = ['OVERSPEED FLUTTER — REDUCE THROTTLE OR AIRBRAKE [B]', '#ff8c38', 'rgba(40,18,8,0.9)'];
  else if (t.gearWarning) alert = ['LOW APPROACH — PRESS [G] TO DEPLOY LANDING GEAR', '#f5b342', 'rgba(34,24,8,0.9)'];
  else if (t.lowFuelWarning && fs.fuelKg > 0) alert = [`CAUTION: LOW FUEL ${t.fuelPercent}% · HULL ${Math.round(fs.hull)}% — CONSERVE THROTTLE`, '#ffbf3b', 'rgba(36,22,6,0.92)'];
  else if (fs.fuelKg <= 0.1) alert = ['FUEL EXHAUSTED — GLIDE AT 110 KT TO RUNWAY 09', '#ff6b57', 'rgba(42,12,14,0.92)'];
  else if (rt.bannerTimer > 0 && rt.bannerText) alert = [rt.bannerText, '#58f7b2', 'rgba(8,30,26,0.88)'];
  if (alert) {
    const [msg, col, bg] = alert; ctx.font = 'bold 15px monospace'; const bw = ctx.measureText(msg).width + 42;
    panel(ctx, w * 0.5 - bw * 0.5, 76, bw, 36, 7, bg, col, 2.2);
    ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.fillText(msg, w * 0.5, 99);
  }
}

function drawHudPanel(ctx, x, y, width, height, radius, fillStyle, strokeStyle, lineWidth) {
  ctx.fillStyle = fillStyle; ctx.strokeStyle = strokeStyle; ctx.lineWidth = lineWidth;
  ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); ctx.fill(); ctx.stroke();
}

function drawVerticalTape(ctx, x, cy, th, val, step, majStep, sc, isL, warn) {
  ctx.save(); const rw = isL ? 64 : 72;
  ctx.fillStyle = 'rgba(7,17,26,0.38)'; ctx.fillRect(isL ? x - rw : x, cy - th * 0.5, rw, th);
  ctx.strokeStyle = 'rgba(88,247,178,0.68)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, cy - th * 0.5); ctx.lineTo(x, cy + th * 0.5); ctx.stroke();
  ctx.beginPath(); ctx.rect(isL ? x - rw - 2 : x - 2, cy - th * 0.5, rw + 4, th); ctx.clip();
  const base = Math.floor(val / step) * step;
  for (let v = base - step * 6; v <= base + step * 6; v += step) {
    if (v < 0) continue; const y = cy - (v - val) * sc, maj = v % majStep === 0;
    ctx.strokeStyle = warn > 0 && v <= warn ? '#ff5c5c' : '#58f7b2'; ctx.lineWidth = maj ? 1.8 : 1.2;
    ctx.beginPath(); ctx.moveTo(x + (isL ? -(maj ? 12 : 7) : 0), y); ctx.lineTo(x + (isL ? 0 : (maj ? 12 : 7)), y); ctx.stroke();
    if (maj) drawHudText(ctx, `${v}`, x + (isL ? -16 : 16), y + 4, '#58f7b2', isL ? 'right' : 'left', 'bold 12px monospace');
  }
  ctx.restore();
}

function drawReadoutBox(ctx, x, y, w, h, lbl, val, brd, vc) {
  ctx.fillStyle = 'rgba(7,18,28,0.88)'; ctx.strokeStyle = brd; ctx.lineWidth = 2; ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
  drawHudText(ctx, lbl, x + w * 0.5, y + 14, '#8cd6e8', 'center', 'bold 10px monospace');
  drawHudText(ctx, val, x + w * 0.5, y + h - 8, vc, 'center', 'bold 20px monospace');
}

function drawHudText(ctx, text, x, y, fill, align = 'center', font = 'bold 14px monospace') {
  ctx.font = font; ctx.textAlign = align; ctx.lineWidth = 3.2; ctx.strokeStyle = 'rgba(5,13,20,0.86)';
  ctx.strokeText(text, x, y); ctx.fillStyle = fill; ctx.fillText(text, x, y);
}

const _proj = new THREE.Vector3(), panel = drawHudPanel;
