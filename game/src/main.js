// Caldera Wind main entry point: bootstraps Three.js WebGL2 world, fixed-step flight loop, HUD, audio, and states.
import * as THREE from '../vendor/three.module.min.js';
import { AIRCRAFT_SPECS, CAMERA_MODES, TIME_OF_DAY_PRESETS, WORLD_CONFIG } from './config.js';
import { createFlightState, stepFlightDynamics } from './flight/aerodynamics.js';
import { createFlightControls } from './flight/controls.js';
import { detectTerrainCollision } from './flight/landing.js';
import { applyTimeOfDayPreset, createAtmosphericSky, createCloudDeck, createOceanWaterMesh, createTerrainMesh, sampleArchipelagoHeight } from './world/terrain.js';
import { buildArchipelagoLandmarks, buildMainIslandAirfield, buildOffshoreCarrierBarge, buildSuspensionBridge, updatePapiApproachLights } from './world/airfields.js';
import { buildMissionProps, createMissionRuntime, deploySupplyDrop, getActiveWaypoint, stepMissionObjectives } from './world/missions.js';
import { buildKestrelAircraft, spawnCrashDebris, updateAfterburnerAndVortices, updateAircraftPoseAndSurfaces } from './render/aircraft.js';
import { buildCockpitInterior, renderCockpitInstrumentPanels } from './render/cockpit.js';
import { createHudRenderer } from './render/hud.js';
import { createFlightCameraRig, updateChaseCamera, updateCockpitCamera, updateTouchdownCamera } from './render/camera.js';
import { createFlightAudioEngine } from './audio/flightAudio.js';
import { createFlightOverlays } from './ui/overlays.js';
import { getRequestedScenario, loadSortieCheckpoint } from './flight/replay.js';
/** Bootstrap the offline 3D flight. */
export function bootstrapFlightGame() {
 const gameCanvas=document.getElementById('game-canvas');
 const hudCanvas=document.getElementById('hud-canvas');
 const overlayRoot=document.getElementById('overlay-root');
 const statusEl=document.getElementById('flight-status');
 const renderer=new THREE.WebGLRenderer({ canvas: gameCanvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.08;
 renderer.shadowMap.enabled=true;
 renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene();
 scene.fog=new THREE.FogExp2(TIME_OF_DAY_PRESETS.goldenHour.fogHex, TIME_OF_DAY_PRESETS.goldenHour.fogDensity);
 const camera=new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight,0.25,22000);
 const cameraRig=createFlightCameraRig(camera);
 const hud=createHudRenderer(hudCanvas);
 const audio=createFlightAudioEngine();
 const hemiLight=new THREE.HemisphereLight(0x9bd0f7,0x526956,1.24);
 const sunLight=new THREE.DirectionalLight(0xffd59e,2.65);
 sunLight.castShadow=true;
 sunLight.shadow.mapSize.set(2048,2048);
 Object.assign(sunLight.shadow.camera, { near: 20, far: 2200, left: -460, right: 460, top: 460, bottom: -460 });
 sunLight.shadow.bias=-0.0005;
 scene.add(hemiLight, sunLight, sunLight.target);
 const sky=createAtmosphericSky();
 const ocean=createOceanWaterMesh();
 const clouds=createCloudDeck();
 scene.add(sky.mesh, ocean.mesh, createTerrainMesh(), clouds.group, clouds.rainLines);
 const airfield=buildMainIslandAirfield(scene);
 buildOffshoreCarrierBarge(scene);
 buildSuspensionBridge(scene);
 const landmarks=buildArchipelagoLandmarks(scene, sampleArchipelagoHeight);
 const env={ scene, sunLight, hemiLight, sunDir: new THREE.Vector3(...TIME_OF_DAY_PRESETS.goldenHour.sunDir).normalize(), sky, ocean, clouds };
 const aircraft=buildKestrelAircraft(scene);
 const cockpit=buildCockpitInterior(aircraft.root);
 let selectedMission=0;
 let missionRuntime=null;
 let missionProps=null;
 let flightState=null;
 let screenState='briefing';
 let elapsedSec=0;
 let accumulator=0;
 let lastTimestamp=0;
 let shotForceContrails=false;
 const announce=(msg) => {
  if (statusEl) statusEl.textContent=msg;
  if (missionRuntime && screenState === 'playing') { missionRuntime.bannerText=msg; missionRuntime.bannerTimer=2.0; }
 };
 function loadMission(index, openBriefing=false) {
  selectedMission=index;
  if (missionProps) { scene.remove(missionProps.group); missionProps=null; }
  aircraft.resetEffects();
  missionRuntime=createMissionRuntime(index);
  missionProps=buildMissionProps(scene, missionRuntime);
  applyTimeOfDayPreset(env, missionRuntime.spec.timeOfDay);
  flightState=createFlightState(missionRuntime.spec.spawn);
  cameraRig.mode=CAMERA_MODES.CHASE;
  cameraRig.reset();
  screenState=openBriefing ? 'briefing' : 'playing';
  if (openBriefing) overlays.showBriefing(selectedMission);
  else overlays.clear();
 }
 const overlays=createFlightOverlays(overlayRoot, {
  onSelectMission: (idx) => { selectedMission=idx; loadMission(idx, true); },
  onStart: () => { audio.unlock(); screenState='playing'; overlays.clear(); announce(`${missionRuntime.spec.code}: ${missionRuntime.spec.title}`); },
  onResume: () => { audio.unlock(); screenState='playing'; overlays.clear(); },
  onRestart: () => { audio.unlock(); loadMission(selectedMission, false); },
  onLaunchMission: (idx) => { audio.unlock(); loadMission(idx, false); },
  onOpenBriefing: () => loadMission(selectedMission, true),
 });
 const controls=createFlightControls(gameCanvas, {
  onCycleFlaps() {
  if (!flightState || screenState !== 'playing') return;
  flightState.flapsIndex=(flightState.flapsIndex + 1) % AIRCRAFT_SPECS.flapSteps.length;
  announce(`FLAPS SET TO ${AIRCRAFT_SPECS.flapSteps[flightState.flapsIndex]}°`);
  },
  onToggleGear() {
  if (!flightState || screenState !== 'playing') return;
  if (flightState.onGround) { announce('GEAR LOCKED WHILE ON RUNWAY'); return; }
  flightState.gearDown=!flightState.gearDown;
  announce(flightState.gearDown ? 'LANDING GEAR DEPLOYING' : 'LANDING GEAR RETRACTING');
  },
  onToggleCamera: () => screenState === 'playing' && handleCameraToggle(cameraRig, announce),
  onPrimaryAction() {
  audio.unlock();
  if (screenState === 'briefing') { screenState='playing'; overlays.clear(); return; }
  if (screenState !== 'playing') return;
  if (missionRuntime.spec.objectiveType === 'drops-and-land') {
  deploySupplyDrop(missionRuntime, flightState, missionProps);
  audio.playEvent(missionRuntime.recentEvent);
  } else {
  flightState.throttle=flightState.throttle < 1.05 ? 1.15 : 0.85;
  announce(flightState.throttle > 1.05 ? 'AFTERBURNER ENGAGED' : 'MILITARY POWER');
  }
  },
  onTogglePause() {
  if (screenState === 'playing') { screenState='paused'; overlays.showPause(missionRuntime.spec); }
  else if (screenState === 'paused') { screenState='playing'; overlays.clear(); }
  },
  onRestart: () => { audio.unlock(); loadMission(selectedMission, false); },
  onSelectMission: (idx) => { audio.unlock(); loadMission(idx, screenState === 'briefing'); },
  onStatusMessage: announce,
 });
 function handleResize() {
  const w=window.innerWidth; const h=window.innerHeight;
  const dpr=Math.min(window.devicePixelRatio || 1,2);
  renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
  camera.aspect=w / h; camera.updateProjectionMatrix();
  hud.resize(w, h, dpr);
 }
 window.addEventListener('resize', handleResize);
 handleResize();
 function renderFrame(dt, snap=false) {
  const isCockpit=cameraRig.mode === CAMERA_MODES.COCKPIT;
  const wp=getActiveWaypoint(missionRuntime);
  sky.mesh.position.copy(camera.position);
  clouds.rainLines.position.copy(camera.position);
  clouds.rainLines.position.y -= (elapsedSec * 28) % 14;
  sunLight.target.position.copy(flightState.position);
  sunLight.position.copy(flightState.position).addScaledVector(env.sunDir,900);
  ocean.uniforms.uTime.value=elapsedSec;
  updatePapiApproachLights(airfield, flightState.position, elapsedSec, missionRuntime.windWorld);
  landmarks.update(elapsedSec);
  updateAircraftPoseAndSurfaces(aircraft, flightState, elapsedSec, isCockpit);
  if (cameraRig.mode === CAMERA_MODES.COCKPIT) updateCockpitCamera(cameraRig, flightState, dt, snap);
  else if (cameraRig.mode === CAMERA_MODES.TOUCHDOWN) updateTouchdownCamera(cameraRig, flightState, dt, snap);
  else updateChaseCamera(cameraRig, flightState, sampleArchipelagoHeight, dt, snap);
  renderCockpitInstrumentPanels(cockpit, flightState, missionRuntime, wp, elapsedSec, isCockpit);
  renderer.render(scene, camera);
  if (screenState !== 'briefing') hud.render(window.innerWidth, window.innerHeight, flightState, missionRuntime, wp, camera, cameraRig.mode, controls.state, elapsedSec);
  else hud.ctx.clearRect(0,0, window.innerWidth, window.innerHeight);
 }
 const requestedShot=getRequestedScenario();
 if (requestedShot) {
  const result=loadSortieCheckpoint(requestedShot, {
  scene, aircraft, sampleHeight: sampleArchipelagoHeight, loadMission,
  get missionRuntime() { return missionRuntime; },
  get missionProps() { return missionProps; },
  setFlightState(fs) { flightState=fs; },
  setCameraMode(mode) { cameraRig.mode=mode; cameraRig.reset(); },
  });
  shotForceContrails=result.forceContrails;
  elapsedSec=14.5;
  screenState=result.overlay === 'debrief' ? 'debrief' : 'playing';
  if (result.overlay === 'debrief') overlays.showDebrief(flightState, missionRuntime);
  else overlays.clear();
  renderFrame(WORLD_CONFIG.fixedStepSec, true);
  window.__CALDERA_SHOT_READY__=true;
  return;
 }
 loadMission(0, true);
 function stepSimulation(dt) {
  if (screenState === 'briefing') {
  elapsedSec += dt;
  const a=elapsedSec * 0.14;
  camera.position.set(flightState.position.x - 140 + Math.cos(a) * 95, flightState.position.y + 42, flightState.position.z + Math.sin(a) * 95);
  camera.lookAt(flightState.position.x + 140, flightState.position.y + 8, flightState.position.z);
  sky.mesh.position.copy(camera.position);
  sunLight.target.position.copy(flightState.position);
  sunLight.position.copy(flightState.position).addScaledVector(env.sunDir, 900);
  ocean.uniforms.uTime.value=elapsedSec;
  updatePapiApproachLights(airfield, flightState.position, elapsedSec, missionRuntime.windWorld);
  landmarks.update(elapsedSec);
  updateAircraftPoseAndSurfaces(aircraft, flightState, elapsedSec, false);
  renderer.render(scene, camera);
  return;
  }
  if (screenState === 'paused') { audio.update(flightState, true, elapsedSec); return; }
  elapsedSec += dt;
  const input=screenState === 'playing' ? controls.sample() : { pitch: 0, roll: 0, yaw: 0, throttleDelta: 0, airbrake: false, wheelBrake: true, flightAssist: true, mouseYoke: false };
  if (!flightState.crashed) {
  const th=sampleArchipelagoHeight(flightState.position.x, flightState.position.z);
  stepFlightDynamics(flightState, input, missionRuntime.windWorld, th, dt, missionRuntime.spec.turbulence);
  const col=detectTerrainCollision(flightState, input, sampleArchipelagoHeight, dt);
  if (col && col.outcome === 'touchdown') {
  audio.playEvent('touchdown');
  announce(`TOUCHDOWN -${col.report.sinkFpm} FPM · GRADE ${col.report.grade} (${col.report.label})`);
  } else if (col && col.outcome === 'crash') {
  screenState='crashed'; missionRuntime.phase='crashed'; cameraRig.mode=CAMERA_MODES.CHASE;
  spawnCrashDebris(aircraft, flightState, scene, Math.max(0, sampleArchipelagoHeight(flightState.position.x, flightState.position.z)));
  audio.playEvent('crash'); overlays.showCrash(flightState, missionRuntime);
  }
  stepMissionObjectives(missionRuntime, flightState, missionProps, sampleArchipelagoHeight, dt);
  if (missionRuntime.recentEvent) audio.playEvent(missionRuntime.recentEvent);
  if (missionRuntime.phase === 'completed' && screenState === 'playing') {
  screenState='debrief'; cameraRig.mode=CAMERA_MODES.TOUCHDOWN; cameraRig.reset();
  overlays.showDebrief(flightState, missionRuntime);
  }
  }
  updateAfterburnerAndVortices(aircraft, flightState, scene, dt, shotForceContrails);
  audio.update(flightState, false, elapsedSec);
  renderFrame(dt, false);
 }
 function loop(ts) {
  requestAnimationFrame(loop);
  if (!lastTimestamp) lastTimestamp=ts;
  accumulator += Math.min(WORLD_CONFIG.maxFrameDeltaSec, (ts - lastTimestamp) / 1000);
  lastTimestamp=ts;
  while (accumulator >= WORLD_CONFIG.fixedStepSec) { stepSimulation(WORLD_CONFIG.fixedStepSec); accumulator -= WORLD_CONFIG.fixedStepSec; }
 }
 requestAnimationFrame(loop);
}
/** Cycle seamlessly between Chase View. */
export function handleCameraToggle(cameraRig, notify) {
 cameraRig.mode=cameraRig.mode === CAMERA_MODES.CHASE ? CAMERA_MODES.COCKPIT : CAMERA_MODES.CHASE;
 cameraRig.reset();
 notify?.(cameraRig.mode === CAMERA_MODES.COCKPIT ? '3D COCKPIT VIEW' : 'EXTERNAL CHASE VIEW');
}
bootstrapFlightGame();
