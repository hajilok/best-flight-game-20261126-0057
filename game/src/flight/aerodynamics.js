// Energy-based quaternion aerodynamics, thrust/fuel burn, induced drag, stall buffet, and telemetry.
import * as THREE from '../../vendor/three.module.min.js';
import { AIRCRAFT_SPECS, FLIGHT_LIMITS, UNIT_CONVERSIONS, WORLD_CONFIG } from '../config.js';

export function createFlightState(spawn) {
  const quat = new THREE.Quaternion()
    .multiply(new THREE.Quaternion().setFromAxisAngle(WORLD_UP, -(spawn.headingDeg ?? 90) * UNIT_CONVERSIONS.DEG_TO_RAD))
    .multiply(new THREE.Quaternion().setFromAxisAngle(LOCAL_RIGHT, (spawn.pitchDeg ?? 0) * UNIT_CONVERSIONS.DEG_TO_RAD))
    .multiply(new THREE.Quaternion().setFromAxisAngle(LOCAL_BACK, -(spawn.rollDeg ?? 0) * UNIT_CONVERSIONS.DEG_TO_RAD))
    .normalize();
  const speedMps = (spawn.airspeedKnots ?? 0) * UNIT_CONVERSIONS.KNOTS_TO_MPS;
  const throttle = spawn.throttle ?? 0.65;
  const flapsIndex = spawn.flapsIndex ?? 0;
  return {
    position: new THREE.Vector3(spawn.x, spawn.y, spawn.z),
    velocity: LOCAL_FORWARD.clone().applyQuaternion(quat).multiplyScalar(speedMps),
    quaternion: quat, angularVel: new THREE.Vector3(),
    throttle, afterburner: throttle > 1.01, flapsIndex, flapAngleDeg: AIRCRAFT_SPECS.flapSteps[flapsIndex],
    gearDown: spawn.gearDown ?? false, gearDeploy: spawn.gearDown ? 1 : 0, airbrake: 0, wheelBrake: 0,
    fuelKg: AIRCRAFT_SPECS.maxFuelKg * (spawn.fuelFraction ?? 0.85),
    fuelLeakKgPerSec: spawn.fuelLeakKgPerSec ?? 0, enginePowerScale: spawn.enginePowerScale ?? 1.0,
    hull: spawn.hull ?? 100, onGround: spawn.onGround ?? false, activeSurface: null,
    crashed: false, crashReport: null, landed: false, landingReport: null,
    controlSurfaces: { aileron: 0, elevator: 0, rudder: 0 },
    telemetry: {
      airspeedKnots: spawn.airspeedKnots ?? 0, groundSpeedKnots: spawn.airspeedKnots ?? 0,
      altitudeFeet: spawn.y * UNIT_CONVERSIONS.METERS_TO_FEET, aglFeet: 0, verticalSpeedFpm: 0,
      headingDeg: spawn.headingDeg ?? 90, pitchDeg: spawn.pitchDeg ?? 0, rollDeg: spawn.rollDeg ?? 0,
      aoaDeg: 0, gLoad: 1.0, stallWarning: false, overspeedWarning: false, lowFuelWarning: false,
      pullUpWarning: false, gearWarning: false, fuelPercent: Math.round((spawn.fuelFraction ?? 0.85) * 100),
      throttlePercent: Math.round(throttle * 100), windSpeedKnots: 0, windDirDeg: 0,
    },
    vortexIntensity: 0, buffetTime: 0, touchdownSmokeTimer: 0,
  };
}

export function updateFuelAndEngine(state, dt) {
  const thr = clampVal(state.throttle, 0, 1.15);
  state.afterburner = thr > 1.01 && state.fuelKg > 0 && state.enginePowerScale > 0.2;
  const burn = state.fuelKg > 0
    ? AIRCRAFT_SPECS.baseFuelBurnKgPerSec * (0.14 + thr * thr * 0.92) * (state.afterburner ? AIRCRAFT_SPECS.afterburnerBurnMultiplier : 1) + state.fuelLeakKgPerSec
    : 0;
  state.fuelKg = Math.max(0, state.fuelKg - burn * dt);
  if (state.fuelKg <= 0.01) state.afterburner = false;
  const power = state.fuelKg > 0 ? state.enginePowerScale * (state.hull < 40 ? 0.68 + (state.hull / 40) * 0.32 : 1) : 0;
  if (power <= 0) return 0;
  if (thr <= 1) return AIRCRAFT_SPECS.maxDryThrustN * thr * power;
  return (AIRCRAFT_SPECS.maxDryThrustN + (AIRCRAFT_SPECS.afterburnerThrustN - AIRCRAFT_SPECS.maxDryThrustN) * ((thr - 1) / 0.15)) * power;
}

export function computeAerodynamicForces(state, windWorld, thrustN) {
  _invQuat.copy(state.quaternion).invert();
  _airVel.copy(state.velocity).sub(windWorld);
  const airspeed = _airVel.length();
  _localVel.copy(_airVel).applyQuaternion(_invQuat);
  const aoaRad = Math.atan2(-_localVel.y, Math.max(6, Math.abs(-_localVel.z)));
  const density = 1.225 * Math.exp(-Math.max(0, state.position.y) / 9800);
  const qDyn = 0.5 * density * airspeed * airspeed;
  const flapFrac = state.flapAngleDeg / 30;
  const critAoa = (16.5 + flapFrac * 3.5) * UNIT_CONVERSIONS.DEG_TO_RAD;
  let cl = 0.21 + flapFrac * 0.44 + 4.75 * aoaRad;
  let stalled = false;
  if (Math.abs(aoaRad) > critAoa) {
    stalled = true;
    cl = (Math.sign(cl) || 1) * Math.max(0.28, Math.abs(cl) * Math.exp(-(Math.abs(aoaRad) - critAoa) * 4.2));
  }
  cl = clampVal(cl, -1.25, 1.85 + flapFrac * 0.45);
  const cdInduced = (cl * cl) / (Math.PI * AIRCRAFT_SPECS.aspectRatio * AIRCRAFT_SPECS.oswaldEfficiency);
  const cd0 = 0.021 + flapFrac * 0.048 + state.gearDeploy * 0.032 + state.airbrake * 0.095 + (stalled ? 0.14 : 0) + (100 - state.hull) * 0.00035;
  const liftN = qDyn * AIRCRAFT_SPECS.wingAreaM2 * cl;
  const dragN = qDyn * AIRCRAFT_SPECS.wingAreaM2 * (cd0 + cdInduced);
  const sideN = -_localVel.x * density * AIRCRAFT_SPECS.wingAreaM2 * (2.6 + airspeed * 0.085);
  _forceLocal.set(sideN, liftN, -thrustN);
  _forceWorld.copy(_forceLocal).applyQuaternion(state.quaternion);
  if (airspeed > 0.5) _forceWorld.addScaledVector(_airVel, -dragN / airspeed);
  _forceWorld.y -= AIRCRAFT_SPECS.massKg * WORLD_CONFIG.gravityMps2;
  return { forceWorld: _forceWorld, airspeed, aoaRad, stalled, gLoad: clampVal(liftN / (AIRCRAFT_SPECS.massKg * WORLD_CONFIG.gravityMps2), -2.5, 9.5) };
}

export function evaluateStallAndOverspeed(state, aero, terrainHeightM, dt) {
  const ias = aero.airspeed * UNIT_CONVERSIONS.MPS_TO_KNOTS;
  const stallKts = (FLIGHT_LIMITS.cleanStallKnots - (state.flapAngleDeg / 30) * FLIGHT_LIMITS.flapsStallReductionKnots) * Math.sqrt(Math.max(1, aero.gLoad));
  const overspeed = ias > FLIGHT_LIMITS.overspeedKnots;
  if (overspeed && !state.crashed) state.hull = Math.max(0, state.hull - ((ias - FLIGHT_LIMITS.overspeedKnots) / 45) * 5.2 * dt);
  if (aero.gLoad > FLIGHT_LIMITS.maxSafeG && !state.crashed) state.hull = Math.max(0, state.hull - (aero.gLoad - FLIGHT_LIMITS.maxSafeG) * 4 * dt);
  const floorM = Math.max(0, terrainHeightM);
  const aglFt = Math.max(0, state.position.y - floorM) * UNIT_CONVERSIONS.METERS_TO_FEET;
  const vsFpm = state.velocity.y * UNIT_CONVERSIONS.MPS_TO_FPM;
  const t = state.telemetry;
  t.stallWarning = !state.onGround && (aero.stalled || (ias < stallKts && state.position.y > floorM + 8));
  t.overspeedWarning = overspeed;
  t.lowFuelWarning = state.fuelKg / AIRCRAFT_SPECS.maxFuelKg < 0.22;
  t.pullUpWarning = !state.onGround && aglFt < 260 && vsFpm < -520 && !state.gearDown;
  t.gearWarning = !state.onGround && aglFt < 220 && ias < 118 && !state.gearDown;
  const targetVortex = !state.onGround && ias > 110 ? clampVal((aero.gLoad - 1.65) * 0.42, 0, 1) : 0;
  state.vortexIntensity += (targetVortex - state.vortexIntensity) * Math.min(1, dt * 6);
}

export function extractFlightTelemetry(state, terrainHeightM, windWorld) {
  _fwd.copy(LOCAL_FORWARD).applyQuaternion(state.quaternion);
  _right.copy(LOCAL_RIGHT).applyQuaternion(state.quaternion);
  _up.copy(LOCAL_UP).applyQuaternion(state.quaternion);
  _airVel.copy(state.velocity).sub(windWorld);
  const t = state.telemetry;
  t.airspeedKnots = _airVel.length() * UNIT_CONVERSIONS.MPS_TO_KNOTS;
  t.groundSpeedKnots = Math.hypot(state.velocity.x, state.velocity.z) * UNIT_CONVERSIONS.MPS_TO_KNOTS;
  t.altitudeFeet = Math.max(0, state.position.y * UNIT_CONVERSIONS.METERS_TO_FEET);
  t.aglFeet = Math.max(0, (state.position.y - Math.max(0, terrainHeightM)) * UNIT_CONVERSIONS.METERS_TO_FEET);
  t.verticalSpeedFpm = state.velocity.y * UNIT_CONVERSIONS.MPS_TO_FPM;
  t.headingDeg = ((Math.atan2(_fwd.x, -_fwd.z) * UNIT_CONVERSIONS.RAD_TO_DEG) % 360 + 360) % 360;
  t.pitchDeg = Math.asin(clampVal(_fwd.y, -1, 1)) * UNIT_CONVERSIONS.RAD_TO_DEG;
  t.rollDeg = Math.atan2(-_right.y, _up.y) * UNIT_CONVERSIONS.RAD_TO_DEG;
  t.fuelPercent = Math.round((state.fuelKg / AIRCRAFT_SPECS.maxFuelKg) * 100);
  t.throttlePercent = Math.round(state.throttle * 100);
  t.windSpeedKnots = Math.hypot(windWorld.x, windWorld.z) * UNIT_CONVERSIONS.MPS_TO_KNOTS;
  t.windDirDeg = ((Math.atan2(-windWorld.x, windWorld.z) * UNIT_CONVERSIONS.RAD_TO_DEG) % 360 + 360) % 360;
}

export function stepFlightDynamics(state, controls, windWorld, terrainHeightM, dt, turbulence = 0) {
  if (state.crashed) return;
  state.flapAngleDeg += (AIRCRAFT_SPECS.flapSteps[state.flapsIndex] - state.flapAngleDeg) * Math.min(1, dt * 4.5);
  state.gearDeploy += ((state.gearDown ? 1 : 0) - state.gearDeploy) * Math.min(1, dt * 2.6);
  state.throttle = clampVal(state.throttle + controls.throttleDelta * dt, 0, 1.15);
  state.airbrake += ((controls.airbrake ? 1 : 0) - state.airbrake) * Math.min(1, dt * 7.5);
  state.wheelBrake = controls.wheelBrake ? 1 : 0;
  const thrustN = updateFuelAndEngine(state, dt);
  const aero = computeAerodynamicForces(state, windWorld, thrustN);
  const spdKts = aero.airspeed * UNIT_CONVERSIONS.MPS_TO_KNOTS;
  const auth = state.onGround ? clampVal(spdKts / 62, 0.12, 1) : clampVal(0.45 + (spdKts / 95) * 0.55, 0.35, 1) * clampVal(1.18 - Math.max(0, spdKts - 160) / 360, 0.62, 1.05);
  _right.copy(LOCAL_RIGHT).applyQuaternion(state.quaternion);
  const yawRate = (-controls.yaw * 0.85 + (state.onGround ? 0 : _right.y * 0.36)) * (state.onGround ? 1 : auth);
  let assistRoll = 0, assistPitch = 0;
  if (controls.flightAssist && !state.onGround) {
    _fwd.copy(LOCAL_FORWARD).applyQuaternion(state.quaternion);
    _up.copy(LOCAL_UP).applyQuaternion(state.quaternion);
    const r = Math.atan2(-_right.y, _up.y);
    const p = Math.asin(clampVal(_fwd.y, -1, 1));
    if (Math.abs(controls.roll) < 0.05 && Math.abs(r) < 0.72) assistRoll = r * 0.85;
    if (Math.abs(controls.pitch) < 0.05 && Math.abs(p) < 0.38) assistPitch = -p * 0.45;
  }
  state.buffetTime += dt * 13.5;
  let stallPitch = 0, buffetRoll = 0;
  if (!state.onGround && (aero.stalled || spdKts < FLIGHT_LIMITS.cleanStallKnots - (state.flapAngleDeg / 30) * 16)) {
    stallPitch = -0.58; buffetRoll = Math.sin(state.buffetTime * 1.9) * 0.35;
  }
  if (!state.onGround && turbulence > 0) {
    buffetRoll += Math.sin(state.buffetTime * 0.73 + state.position.x * 0.01) * turbulence * 0.22;
    stallPitch += Math.cos(state.buffetTime * 0.59 + state.position.z * 0.01) * turbulence * 0.12;
  }
  const dmgBias = state.hull < 55 ? ((55 - state.hull) / 55) * 0.14 : 0;
  const blend = Math.min(1, dt * 7.8);
  state.angularVel.x += (controls.pitch * 1.32 * auth + assistPitch + stallPitch - state.angularVel.x) * blend;
  state.angularVel.y += (yawRate - state.angularVel.y) * blend;
  state.angularVel.z += (-controls.roll * 2.15 * auth + assistRoll + buffetRoll + dmgBias - state.angularVel.z) * blend;
  _deltaQuat.identity()
    .multiply(_axisQuat.setFromAxisAngle(LOCAL_UP, state.angularVel.y * dt))
    .multiply(_axisQuat.setFromAxisAngle(LOCAL_RIGHT, state.angularVel.x * dt))
    .multiply(_axisQuat.setFromAxisAngle(LOCAL_BACK, state.angularVel.z * dt));
  state.quaternion.multiply(_deltaQuat).normalize();
  state.velocity.addScaledVector(aero.forceWorld, dt / AIRCRAFT_SPECS.massKg);
  state.position.addScaledVector(state.velocity, dt);
  const cBlend = Math.min(1, dt * 12);
  state.controlSurfaces.aileron += (controls.roll - state.controlSurfaces.aileron) * cBlend;
  state.controlSurfaces.elevator += (controls.pitch - state.controlSurfaces.elevator) * cBlend;
  state.controlSurfaces.rudder += (controls.yaw - state.controlSurfaces.rudder) * cBlend;
  state.telemetry.aoaDeg = aero.aoaRad * UNIT_CONVERSIONS.RAD_TO_DEG;
  state.telemetry.gLoad = state.onGround ? Math.max(1.0, aero.gLoad) : aero.gLoad;
  evaluateStallAndOverspeed(state, aero, terrainHeightM, dt);
  extractFlightTelemetry(state, terrainHeightM, windWorld);
}

const WORLD_UP = new THREE.Vector3(0, 1, 0), LOCAL_FORWARD = new THREE.Vector3(0, 0, -1), LOCAL_RIGHT = new THREE.Vector3(1, 0, 0), LOCAL_UP = new THREE.Vector3(0, 1, 0), LOCAL_BACK = new THREE.Vector3(0, 0, 1);
const _fwd = new THREE.Vector3(), _right = new THREE.Vector3(), _up = new THREE.Vector3(), _airVel = new THREE.Vector3(), _localVel = new THREE.Vector3(), _forceWorld = new THREE.Vector3(), _forceLocal = new THREE.Vector3();
const _invQuat = new THREE.Quaternion(), _deltaQuat = new THREE.Quaternion(), _axisQuat = new THREE.Quaternion();
const clampVal = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
