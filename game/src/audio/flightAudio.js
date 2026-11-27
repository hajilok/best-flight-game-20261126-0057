// Procedural Web Audio API soundscape: turbine jet whine, afterburner rumble, wind rush, alerts, and touchdown SFX.
export function createFlightAudioEngine() {
  const nodes = { active: false, ctx: null, masterGain: null, engineOsc: null, engineGain: null, subOsc: null, subGain: null, windGain: null, windFilter: null };
  let lastBeepTime = 0;
  return {
    unlock() { initAudioNodes(nodes); },
    update(flightState, paused, elapsedSec) {
      updateEngineAndWindAudio(nodes, flightState, paused);
      if (!nodes.active || paused || flightState.crashed) return;
      const t = flightState.telemetry;
      if ((t.stallWarning || t.pullUpWarning) && elapsedSec - lastBeepTime > 0.36) {
        lastBeepTime = elapsedSec; playCockpitAlert(nodes.ctx, nodes.masterGain, t.pullUpWarning ? 'pullup' : 'stall');
      }
    },
    playEvent(kind) {
      if (!nodes.active || !nodes.ctx || !nodes.masterGain) return;
      if (kind === 'gate_cleared' || kind === 'drop_delivered' || kind === 'mission_complete') playCockpitAlert(nodes.ctx, nodes.masterGain, kind);
      else if (kind === 'touchdown' || kind === 'crash') playTouchdownOrCrashSfx(nodes.ctx, nodes.masterGain, kind);
    },
  };
}

export function updateEngineAndWindAudio(nodes, flightState, paused) {
  if (!nodes.active || !nodes.ctx) return;
  const now = nodes.ctx.currentTime;
  if (paused || flightState.crashed) {
    nodes.engineGain.gain.setTargetAtTime(0, now, 0.08); nodes.subGain.gain.setTargetAtTime(0, now, 0.08);
    nodes.windGain.gain.setTargetAtTime(0, now, 0.08); return;
  }
  const thr = flightState.fuelKg > 0 ? flightState.throttle : 0;
  const spd = Math.min(1.2, flightState.telemetry.airspeedKnots / 240);
  nodes.engineOsc.frequency.setTargetAtTime(88 + thr * 185, now, 0.06);
  nodes.engineGain.gain.setTargetAtTime(0.04 + thr * 0.14, now, 0.06);
  nodes.subOsc.frequency.setTargetAtTime(46 + thr * 52, now, 0.08);
  nodes.subGain.gain.setTargetAtTime(0.05 + thr * 0.18 + (flightState.afterburner ? 0.14 : 0), now, 0.06);
  nodes.windFilter.frequency.setTargetAtTime(320 + spd * 1250, now, 0.08);
  nodes.windGain.gain.setTargetAtTime(0.015 + spd * spd * 0.18 + (flightState.afterburner ? 0.1 : 0), now, 0.06);
}

export function playCockpitAlert(ctx, masterGain, kind) {
  const now = ctx.currentTime, osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.connect(gain); gain.connect(masterGain);
  if (kind === 'stall') {
    osc.type = 'square'; osc.frequency.setValueAtTime(780, now);
    gain.gain.setValueAtTime(0.16, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.start(now); osc.stop(now + 0.19);
  } else if (kind === 'pullup') {
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(620, now); osc.frequency.linearRampToValueAtTime(980, now + 0.16);
    gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.start(now); osc.stop(now + 0.23);
  } else if (kind === 'mission_complete') {
    osc.type = 'triangle'; osc.frequency.setValueAtTime(523, now); osc.frequency.setValueAtTime(659, now + 0.11); osc.frequency.setValueAtTime(784, now + 0.22);
    gain.gain.setValueAtTime(0.22, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
    osc.start(now); osc.stop(now + 0.54);
  } else {
    osc.type = 'sine'; osc.frequency.setValueAtTime(660, now); osc.frequency.setValueAtTime(990, now + 0.07);
    gain.gain.setValueAtTime(0.18, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    osc.start(now); osc.stop(now + 0.27);
  }
}

export function playTouchdownOrCrashSfx(ctx, masterGain, kind) {
  const now = ctx.currentTime, osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = kind === 'crash' ? 'sawtooth' : 'sine';
  osc.frequency.setValueAtTime(kind === 'crash' ? 140 : 125, now);
  osc.frequency.exponentialRampToValueAtTime(kind === 'crash' ? 28 : 44, now + (kind === 'crash' ? 0.65 : 0.22));
  gain.gain.setValueAtTime(kind === 'crash' ? 0.55 : 0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + (kind === 'crash' ? 0.68 : 0.24));
  osc.connect(gain); gain.connect(masterGain); osc.start(now); osc.stop(now + (kind === 'crash' ? 0.7 : 0.25));
}

function initAudioNodes(n) {
  if (n.active) { if (n.ctx?.state === 'suspended') n.ctx.resume().catch(() => {}); return; }
  const AudioCtx = window.AudioContext || window.webkitAudioContext; if (!AudioCtx) return;
  try {
    const ctx = new AudioCtx(); const master = ctx.createGain(); master.gain.value = 0.24; master.connect(ctx.destination);
    const engOsc = ctx.createOscillator(); engOsc.type = 'sawtooth'; engOsc.frequency.value = 110;
    const engFlt = ctx.createBiquadFilter(); engFlt.type = 'lowpass'; engFlt.frequency.value = 620;
    const engGain = ctx.createGain(); engGain.gain.value = 0;
    engOsc.connect(engFlt); engFlt.connect(engGain); engGain.connect(master); engOsc.start();
    const subOsc = ctx.createOscillator(); subOsc.type = 'triangle'; subOsc.frequency.value = 58;
    const subGain = ctx.createGain(); subGain.gain.value = 0; subOsc.connect(subGain); subGain.connect(master); subOsc.start();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const wFlt = ctx.createBiquadFilter(); wFlt.type = 'bandpass'; wFlt.frequency.value = 500; wFlt.Q.value = 0.85;
    const wGain = ctx.createGain(); wGain.gain.value = 0; src.connect(wFlt); wFlt.connect(wGain); wGain.connect(master); src.start();
    Object.assign(n, { active: true, ctx, masterGain: master, engineOsc: engOsc, engineGain: engGain, subOsc, subGain, windGain: wGain, windFilter: wFlt });
  } catch { n.active = false; }
}
