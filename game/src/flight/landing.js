// Runway & carrier touchdown grading, ground-roll physics, and black-box crash diagnostics.
import * as THREE from '../../vendor/three.module.min.js';
import { AIRCRAFT_SPECS, FLIGHT_LIMITS, UNIT_CONVERSIONS, WORLD_CONFIG } from '../config.js';
import { AIRFIELD_RUNWAYS } from '../world/airfields.js';
/** Determine whether the aircraft is horizontally within any runway or. */
export function findActiveLandingSurface(x, z) {
 for (const rwy of AIRFIELD_RUNWAYS) {
  const dx = x - rwy.centerX; const dz = z - rwy.centerZ;
  const c = Math.cos(-rwy.yawRad); const s = Math.sin(-rwy.yawRad);
  const localAlong = dx * c - dz * s;
  const localCross = dx * s + dz * c;
  if (Math.abs(localAlong) <= rwy.lengthM * 0.52 && Math.abs(localCross) <= rwy.widthM * 0.56) {
  return { runway: rwy, localAlong, localCross };
  }
 }
 return null;
}
/** Produce a clear black-box flight-recorder explanation of why a. */
export function diagnoseCrashCause(state, context) {
 const sinkFpm = Math.round(Math.abs(state.velocity.y * UNIT_CONVERSIONS.MPS_TO_FPM));
 const iasKnots = Math.round(state.telemetry.airspeedKnots);
 const bankDeg = Math.round(Math.abs(state.telemetry.rollDeg));
 const map = {
  water: ['WATER IMPACT — ARCHIPELAGO STRAIT', `Ditched into sea at ${iasKnots} KT (${sinkFpm} FPM sink). Maintain minimum 100 FT clearance.`],
  hull: ['AIRFRAME STRUCTURAL FAILURE', `Hull integrity fell to 0% after extreme overspeed (${iasKnots} KT) or excessive G-load stress.`],
  gear_up: ['BELLY IMPACT — LANDING GEAR RETRACTED', `Touched runway at ${iasKnots} KT without lowering gear. Press G before short final.`],
  bank: [`WINGSTRIKE — EXCESSIVE BANK (${bankDeg}°)`, `Touched down banked ${bankDeg}° (limit ${FLIGHT_LIMITS.maxSafeLandingBankDeg}°). Level wings before flare.`],
  hard_sink: [`HARD IMPACT — EXCESS SINK RATE (-${sinkFpm} FPM)`, `Touchdown exceeded gear limit (-${FLIGHT_LIMITS.hardLandingFpm} FPM). Deploy flaps (F) and flare gently.`],
 };
 const [headline, detail] = map[context] ?? (state.telemetry.stallWarning
  ? [`TERRAIN IMPACT — LOW-ALTITUDE STALL (${iasKnots} KT)`, `Wing stalled above ridge at ${iasKnots} KT. Add throttle and lower nose on stall horn.`]
  : [`TERRAIN IMPACT — RIDGE COLLISION (${iasKnots} KT)`, `Struck volcanic terrain at ${iasKnots} KT (-${sinkFpm} FPM). Monitor AGL and canyon clearance.`]);
 return { headline, detail, sinkFpm, iasKnots, bankDeg };
}
/** Evaluate touchdown smoothness, gear lock, bank alignment, and. */
export function evaluateRunwayTouchdown(state, surfaceMatch) {
 const sinkFpm = Math.max(0, -state.velocity.y * UNIT_CONVERSIONS.MPS_TO_FPM);
 const absBank = Math.abs(state.telemetry.rollDeg);
 const iasKnots = state.telemetry.airspeedKnots;
 const fail = (ctx) => {
  state.crashed = true; state.hull = 0; state.crashReport = diagnoseCrashCause(state, ctx);
  return { outcome: 'crash', report: state.crashReport };
 };
 if (!state.gearDown || state.gearDeploy < 0.72) {
  if (iasKnots > 68 || sinkFpm > 220) return fail('gear_up');
  state.hull = Math.max(8, state.hull - 34);
 }
 if (absBank > FLIGHT_LIMITS.maxSafeLandingBankDeg) return fail('bank');
 if (sinkFpm > FLIGHT_LIMITS.hardLandingFpm || state.telemetry.pitchDeg < FLIGHT_LIMITS.maxSafeLandingPitchDownDeg) return fail('hard_sink');
 const offset = Math.abs(surfaceMatch.localCross);
 let grade = 'A+'; let label = 'SMOOTH FLARE · GEAR LOCKED'; let damage = 0;
 if (sinkFpm <= FLIGHT_LIMITS.smoothLandingFpm && offset < 7.5 && absBank < 6) { grade = 'S'; label = 'PRECISION FLARE · CENTERLINE LOCK'; }
 else if (sinkFpm > FLIGHT_LIMITS.firmLandingFpm) { grade = 'C'; label = 'HARD LANDING · GEAR STRESSED'; damage = Math.round(12 + ((sinkFpm - FLIGHT_LIMITS.firmLandingFpm) / 180) * 18); }
 else if (sinkFpm > FLIGHT_LIMITS.smoothLandingFpm) { grade = 'B'; label = 'FIRM TOUCHDOWN · SAFE ROLLOUT'; damage = 4; }
 if (surfaceMatch.runway.hasArrestor) label = `${label} (ARRESTOR WIRE)`;
 state.hull = Math.max(5, state.hull - damage);
 state.touchdownSmokeTimer = 1.4;
 state.velocity.y = sinkFpm > 260 ? Math.min(2.6, (sinkFpm - 220) * 0.008) : 0;
 state.onGround = true;
 state.activeSurface = surfaceMatch.runway;
 state.landingReport = { runwayName: surfaceMatch.runway.name, grade, label, sinkFpm: Math.round(sinkFpm), touchdownKnots: Math.round(iasKnots), centerlineOffsetM: Number(offset.toFixed(1)), damageTaken: damage };
 return { outcome: 'touchdown', report: state.landingReport };
}
/** Step runway/carrier ground roll, nosewheel steering, arrestor wire. */
export function stepGroundRollPhysics(state, controls, surfaceMatch, dt) {
 const rwy = surfaceMatch.runway;
 const deckY = rwy.elevationM + (state.gearDown ? AIRCRAFT_SPECS.gearHeightM : AIRCRAFT_SPECS.bellyHeightM);
 if (state.position.y <= deckY + 0.08) { state.position.y = deckY; if (state.velocity.y < 0) state.velocity.y = 0; }
 _fwd.copy(LOCAL_FORWARD).applyQuaternion(state.quaternion);
 const steerYaw = Math.atan2(_fwd.x, -_fwd.z) + controls.yaw * 0.65 * dt;
 const targetQ = new THREE.Quaternion().setFromAxisAngle(WORLD_UP, -steerYaw)
  .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.max(0, Math.min(0.24, controls.pitch * 0.22))));
 state.quaternion.slerp(targetQ, Math.min(1, dt * 8.5));
 const groundSpeed = Math.hypot(state.velocity.x, state.velocity.z);
 const decel = (state.gearDown ? 2.8 : 11.5) + state.wheelBrake * 15.5 + (rwy.hasArrestor && state.throttle < 0.45 ? 18 : 0);
 const nextSpeed = Math.max(0, groundSpeed - decel * dt);
 _fwd.copy(LOCAL_FORWARD).applyQuaternion(state.quaternion);
 const flat = new THREE.Vector3(_fwd.x, 0, _fwd.z).normalize();
 state.velocity.x = flat.x * nextSpeed;
 state.velocity.z = flat.z * nextSpeed;
 if (nextSpeed * UNIT_CONVERSIONS.MPS_TO_KNOTS > 72 && controls.pitch > 0.16 && state.throttle > 0.45) {
  state.onGround = false;
  state.position.y = deckY + 0.24;
  state.velocity.y = Math.max(state.velocity.y, 6.5);
 }
}
/** Detect runway touchdown, carrier arrestor catch, off-runway terrain. */
export function detectTerrainCollision(state, controls, sampleTerrainHeight, dt) {
 if (state.crashed) return null;
 if (state.hull <= 0.1) { state.crashed = true; state.crashReport = diagnoseCrashCause(state, 'hull'); return { outcome: 'crash', report: state.crashReport }; }
 const match = findActiveLandingSurface(state.position.x, state.position.z);
 const clearance = state.gearDown ? AIRCRAFT_SPECS.gearHeightM : AIRCRAFT_SPECS.bellyHeightM;
 if (match) {
  if (state.position.y <= match.runway.elevationM + clearance + 0.15 && (state.onGround || state.velocity.y <= 0.2)) {
  if (!state.onGround) {
  const res = evaluateRunwayTouchdown(state, match);
  if (res.outcome === 'crash') return res;
  stepGroundRollPhysics(state, controls, match, dt);
  return res;
  }
  stepGroundRollPhysics(state, controls, match, dt);
  return { outcome: 'rolling', surface: match.runway };
  }
  state.onGround = false; state.activeSurface = null;
  return null;
 }
 state.onGround = false; state.activeSurface = null;
 if (state.position.y <= WORLD_CONFIG.seaLevelY + AIRCRAFT_SPECS.bellyHeightM) {
  state.position.y = WORLD_CONFIG.seaLevelY + AIRCRAFT_SPECS.bellyHeightM;
  state.crashed = true; state.hull = 0; state.crashReport = diagnoseCrashCause(state, 'water');
  return { outcome: 'crash', report: state.crashReport };
 }
 const terrainY = sampleTerrainHeight(state.position.x, state.position.z);
 if (state.position.y <= terrainY + AIRCRAFT_SPECS.bellyHeightM) {
  state.position.y = terrainY + AIRCRAFT_SPECS.bellyHeightM;
  state.crashed = true; state.hull = 0; state.crashReport = diagnoseCrashCause(state, 'terrain');
  return { outcome: 'crash', report: state.crashReport };
 }
 return null;
}
const LOCAL_FORWARD = new THREE.Vector3(0, 0, -1);
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const _fwd = new THREE.Vector3();
