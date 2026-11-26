// Flight briefing mission selector, pause menu, graded touchdown debrief, and black-box crash overlays.
import { MISSION_CATALOG } from '../world/missions.js';
/** Create the overlay controller bound to #overlay-root. */
export function createFlightOverlays(rootEl, handlers) {
  return {
  clear() { rootEl.classList.remove('dock-right'); rootEl.innerHTML = ''; },
  showBriefing: (idx) => renderBriefingOverlay(rootEl, idx, handlers),
  showPause: (spec) => renderPauseOverlay(rootEl, spec, handlers),
  showDebrief: (fs, rt) => renderDebriefOverlay(rootEl, fs, rt, handlers),
  showCrash: (fs, rt) => renderCrashReportOverlay(rootEl, fs, rt, handlers),
  };
}
/** Render the translucent pre-flight mission briefing & sortie selector over the live 3D island view. */
export function renderBriefingOverlay(rootEl, selectedIndex, handlers) {
  rootEl.classList.remove('dock-right');
  const cards = MISSION_CATALOG.map((m, i) => missionBtn(m, i, i === selectedIndex, true)).join('');
  rootEl.innerHTML = `<section class="flight-card" aria-label="Mission Briefing"><p class="eyebrow">KESTREL ARCHIPELAGO · KW-4 KESTREL STOL JET</p><h1 class="card-title">CALDERA WIND</h1><p class="card-subtitle">Manage airspeed, induced-drag turn energy, fuel reserves, and crosswind landings across four volcanic sorties.</p><div class="mission-grid">${cards}</div><div class="controls-strip"><span><kbd>W/S</kbd> <kbd>A/D</kbd> Pitch/Roll</span><span><kbd>Q/E</kbd> Rudder</span><span><kbd>Shift/Ctrl</kbd> Throttle/A/B</span><span><kbd>F</kbd> Flaps</span><span><kbd>G</kbd> Gear</span><span><kbd>B</kbd> Brake</span><span><kbd>C</kbd> 3D Cockpit</span><span><kbd>Space</kbd> Drop</span><span><kbd>M</kbd> Mouse</span></div><div class="action-row"><button class="btn-primary" id="btn-launch-sortie">LAUNCH SORTIE [SPACE]</button></div></section>`;
  rootEl.querySelectorAll('.mission-btn').forEach((b) => b.addEventListener('click', () => {
  const idx = Number(b.dataset.mission);
  handlers.onSelectMission(idx);
  renderBriefingOverlay(rootEl, idx, handlers);
  }));
  rootEl.querySelector('#btn-launch-sortie')?.addEventListener('click', () => handlers.onStart());
}
/** Render the pause & quick sortie switcher modal. */
export function renderPauseOverlay(rootEl, missionSpec, handlers) {
  rootEl.classList.remove('dock-right');
  rootEl.innerHTML = `<section class="flight-card compact-debrief" aria-label="Paused"><p class="eyebrow">FLIGHT PAUSED</p><h2 class="card-title">${missionSpec.code}: ${missionSpec.title}</h2><p class="card-subtitle">${missionSpec.description}</p><div class="controls-strip"><span><kbd>C</kbd> 3D Cockpit</span><span><kbd>T</kbd> Flight Assist</span><span><kbd>1-4</kbd> Sortie</span><span><kbd>R</kbd> Restart</span></div><div class="action-row"><button class="btn-secondary" id="btn-briefing">MISSIONS</button><button class="btn-secondary" id="btn-restart">RESTART [R]</button><button class="btn-primary" id="btn-resume">RESUME [P]</button></div></section>`;
  rootEl.querySelector('#btn-resume')?.addEventListener('click', () => handlers.onResume());
  rootEl.querySelector('#btn-restart')?.addEventListener('click', () => handlers.onRestart());
  rootEl.querySelector('#btn-briefing')?.addEventListener('click', () => handlers.onOpenBriefing());
}
/** Render the right-docked Graded Touchdown Debrief & Next Sortie selector over the live runway scene. */
export function renderDebriefOverlay(rootEl, flightState, missionRuntime, handlers) {
  rootEl.classList.add('dock-right');
  const lr = flightState.landingReport ?? { runwayName: 'KESTREL AIRFIELD RWY 09', grade: 'A+', label: 'SMOOTH FLARE · GEAR LOCKED', sinkFpm: 115, touchdownKnots: 84, centerlineOffsetM: 2.1 };
  const nextIdx = (missionRuntime.spec.index + 1) % MISSION_CATALOG.length;
  const btns = MISSION_CATALOG.map((m, i) => missionBtn(m, i, i === nextIdx, false)).join('');
  const metrics = metricBox('FUEL LEFT', `${flightState.telemetry.fuelPercent}%`, flightState.telemetry.fuelPercent < 25 ? 'warn' : 'good')
  + metricBox('AIRFRAME', `${Math.round(flightState.hull)}%`, flightState.hull < 70 ? 'warn' : 'good')
  + metricBox('SORTIE SCORE', missionRuntime.score.toLocaleString(), 'good');
  rootEl.innerHTML = `<section class="flight-card compact-debrief" aria-label="Sortie Debrief"><p class="eyebrow">SORTIE COMPLETE · ${lr.runwayName}</p><h2 class="card-title">${missionRuntime.spec.title.toUpperCase()}</h2><div class="grade-banner"><div><div class="grade-note">${lr.label}</div><div class="grade-sub">TOUCHDOWN -${lr.sinkFpm} FPM · ${lr.touchdownKnots} KT · OFFSET ${lr.centerlineOffsetM} M</div></div><div class="grade-badge">${lr.grade}</div></div><div class="metrics-row">${metrics}</div><div class="mission-grid">${btns}</div><div class="action-row"><button class="btn-secondary" id="btn-refly">REFLY [R]</button><button class="btn-primary" id="btn-next-sortie">NEXT SORTIE</button></div></section>`;
  rootEl.querySelectorAll('.mission-btn').forEach((b) => b.addEventListener('click', () => handlers.onLaunchMission(Number(b.dataset.mission))));
  rootEl.querySelector('#btn-refly')?.addEventListener('click', () => handlers.onRestart());
  rootEl.querySelector('#btn-next-sortie')?.addEventListener('click', () => handlers.onLaunchMission(nextIdx));
}
/** Render the unmistakable Black-Box Flight Recorder crash explanation card with instant retry. */
export function renderCrashReportOverlay(rootEl, flightState, missionRuntime, handlers) {
  rootEl.classList.remove('dock-right');
  const cr = flightState.crashReport ?? { headline: 'TERRAIN IMPACT', detail: 'Aircraft struck archipelago terrain.', sinkFpm: 840, iasKnots: 165, bankDeg: 28 };
  const metrics = metricBox('IMPACT SINK', `-${cr.sinkFpm} FPM`, 'bad') + metricBox('AIRSPEED', `${cr.iasKnots} KT`, 'warn') + metricBox('BANK ANGLE', `${cr.bankDeg}°`, 'warn');
  rootEl.innerHTML = `<section class="flight-card crash-card" aria-label="Crash Diagnostics"><p class="eyebrow danger">BLACK-BOX FLIGHT RECORDER · ${missionRuntime.spec.code}</p><h2 class="card-title">${cr.headline}</h2><div class="crash-reason-box">${cr.detail}</div><div class="metrics-row">${metrics}</div><div class="action-row"><button class="btn-secondary" id="btn-crash-brief">MISSION SELECT</button><button class="btn-primary" id="btn-crash-retry">RETRY SORTIE [R]</button></div></section>`;
  rootEl.querySelector('#btn-crash-retry')?.addEventListener('click', () => handlers.onRestart());
  rootEl.querySelector('#btn-crash-brief')?.addEventListener('click', () => handlers.onOpenBriefing());
}
function metricBox(label, value, cls) {
  return `<div class="metric-box"><div class="metric-label">${label}</div><div class="metric-value ${cls}">${value}</div></div>`;
}
function missionBtn(m, i, active, withDesc) {
  const title = withDesc ? `${m.code}: ${m.title}` : `${i + 1}. ${m.title}`;
  return `<button class="mission-btn ${active ? 'active' : ''}" data-mission="${i}"><div class="mission-name"><span>${title}</span><span class="mission-tag ${m.tagClass}">${m.tag}</span></div>${withDesc ? `<div class="mission-desc">${m.description}</div>` : ''}</button>`;
}
