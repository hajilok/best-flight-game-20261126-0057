// Playable sortie practice checkpoints for Final Approach, Basalt Canyon Cockpit, Monsoon Supply Drop, and Touchdown Flare.
import * as THREE from '../../vendor/three.module.min.js';
import { CAMERA_MODES, WORLD_CONFIG } from '../config.js';
import { createFlightState, stepFlightDynamics } from './aerodynamics.js';
import { detectTerrainCollision } from './landing.js';
import { deploySupplyDrop, stepMissionObjectives } from '../world/missions.js';
import { spawnSmokePuff, updateAfterburnerAndVortices } from '../render/aircraft.js';

export function getRequestedCheckpoint() {
  const s = new URLSearchParams(window.location.search).get('shot');
  return s ? s.toLowerCase() : null;
}

export function loadSortieCheckpoint(checkpointName, ctx) {
  const dt = WORLD_CONFIG.fixedStepSec;
  const zero = { pitch: 0, roll: 0, yaw: 0, throttleDelta: 0, airbrake: false, wheelBrake: false, flightAssist: true, mouseYoke: false };

  if (checkpointName === 'cockpit') {
    ctx.loadMission(1, false);
    const fs = createFlightState({ x: 440, y: 134, z: -635, headingDeg: 0, pitchDeg: -1.6, rollDeg: -6.5, airspeedKnots: 208, throttle: 0.94, flapsIndex: 0, gearDown: false, onGround: false, fuelFraction: 0.56, hull: 96 });
    ctx.setFlightState(fs); ctx.setCameraMode(CAMERA_MODES.COCKPIT);
    ctx.missionRuntime.elapsedSec = 42; ctx.missionRuntime.score = 1840;
    for (let i = 0; i < 16; i++) {
      stepFlightDynamics(fs, { ...zero, roll: -0.08, pitch: 0.08 }, ctx.missionRuntime.windWorld, ctx.sampleHeight(fs.position.x, fs.position.z), dt, 0.04);
      stepMissionObjectives(ctx.missionRuntime, fs, ctx.missionProps, ctx.sampleHeight, dt);
    }
    return { overlay: null, forceContrails: false };
  }

  if (checkpointName === 'storm') {
    ctx.loadMission(2, false);
    ctx.missionRuntime.drops[0].delivered = true; ctx.missionRuntime.elapsedSec = 88; ctx.missionRuntime.score = 2650;
    const fs = createFlightState({ x: -1155, y: 274, z: -300, headingDeg: 294, pitchDeg: -3.2, rollDeg: 20, airspeedKnots: 188, throttle: 1.14, flapsIndex: 0, gearDown: false, onGround: false, fuelFraction: 0.21, hull: 74 });
    ctx.setFlightState(fs); ctx.setCameraMode(CAMERA_MODES.CHASE);
    deploySupplyDrop(ctx.missionRuntime, fs, ctx.missionProps, new THREE.Vector3(-1482, 265, -496));
    for (let i = 0; i < 28; i++) {
      stepFlightDynamics(fs, { ...zero, roll: 0.06, pitch: 0.12 }, ctx.missionRuntime.windWorld, ctx.sampleHeight(fs.position.x, fs.position.z), dt, 0.06);
      stepMissionObjectives(ctx.missionRuntime, fs, ctx.missionProps, ctx.sampleHeight, dt);
      updateAfterburnerAndVortices(ctx.aircraft, fs, ctx.scene, dt, true);
    }
    ctx.missionRuntime.bannerTimer = 0;
    return { overlay: null, forceContrails: true };
  }

  if (checkpointName === 'touchdown') {
    ctx.loadMission(0, false);
    for (const g of ctx.missionRuntime.gates) g.cleared = true;
    ctx.missionRuntime.gateIndex = ctx.missionRuntime.gates.length; ctx.missionRuntime.phase = 'return-to-land';
    ctx.missionRuntime.elapsedSec = 118; ctx.missionRuntime.score = 4820;
    const fs = createFlightState({ x: -255, y: 24.48, z: -0.9, headingDeg: 90, pitchDeg: 4.0, rollDeg: 0.3, airspeedKnots: 86, throttle: 0.22, flapsIndex: 2, gearDown: true, onGround: false, fuelFraction: 0.41, hull: 94 });
    fs.velocity.y = -0.58; ctx.setFlightState(fs); ctx.setCameraMode(CAMERA_MODES.TOUCHDOWN);
    for (let i = 0; i < 24; i++) {
      stepFlightDynamics(fs, { ...zero, pitch: 0.12, airbrake: true, wheelBrake: true }, ctx.missionRuntime.windWorld, ctx.sampleHeight(fs.position.x, fs.position.z), dt, 0);
      detectTerrainCollision(fs, { ...zero, airbrake: true, wheelBrake: true }, ctx.sampleHeight, dt);
      stepMissionObjectives(ctx.missionRuntime, fs, ctx.missionProps, ctx.sampleHeight, dt);
      updateAfterburnerAndVortices(ctx.aircraft, fs, ctx.scene, dt, false);
    }
    for (let k = 0; k < 5; k++) {
      for (const side of [-1.65, 1.65]) spawnSmokePuff(ctx.aircraft, ctx.scene, new THREE.Vector3(fs.position.x - 1.4 - k * 2.6, 22.5 + k * 0.16, fs.position.z + side), 0xf2f7fc, 1.8 + k * 0.52, 2.5, 0.35);
    }
    ctx.missionRuntime.phase = 'completed';
    return { overlay: 'debrief', forceContrails: false };
  }

  ctx.loadMission(0, false);
  for (let i = 0; i < 6; i++) ctx.missionRuntime.gates[i].cleared = true;
  ctx.missionRuntime.gateIndex = 6; ctx.missionRuntime.elapsedSec = 94; ctx.missionRuntime.score = 3420;
  const fs = createFlightState({ x: -1038, y: 118, z: 46, headingDeg: 81, pitchDeg: -2.0, rollDeg: 11.5, airspeedKnots: 164, throttle: 0.84, flapsIndex: 1, gearDown: true, onGround: false, fuelFraction: 0.68, hull: 94 });
  ctx.setFlightState(fs); ctx.setCameraMode(CAMERA_MODES.CHASE);
  for (let i = 0; i < 32; i++) {
    stepFlightDynamics(fs, { ...zero, roll: 0.08, pitch: 0.14 }, ctx.missionRuntime.windWorld, ctx.sampleHeight(fs.position.x, fs.position.z), dt, 0);
    stepMissionObjectives(ctx.missionRuntime, fs, ctx.missionProps, ctx.sampleHeight, dt);
    updateAfterburnerAndVortices(ctx.aircraft, fs, ctx.scene, dt, true);
  }
  return { overlay: null, forceContrails: true };
}
