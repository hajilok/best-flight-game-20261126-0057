// Brushed-metal 3D cockpit interior with slim matte canopy frame, 4 beveled analog gauges, backlit annunciators, and dual MFDs.
import * as THREE from '../../vendor/three.module.min.js';
import { createArchipelagoRadarMap } from './radar.js';
import { createBrushedMetalTexture, drawAnalogInstrumentCluster, drawAnnunciatorStrip, drawEngineSystemsMfd, drawHsiNavRadarMfd } from './instruments.js';

export function buildCockpitInterior(aircraftRoot) {
  const group = new THREE.Group(); group.name = 'Kestrel3DCockpit'; group.position.set(0, 0.82, -1.92); group.visible = false;
  const panelMat = std({ map: createBrushedMetalTexture(), roughness: 0.46, metalness: 0.58, envMapIntensity: 1.15 });
  const coamMat = std({ color: 0x161c23, roughness: 0.9, metalness: 0.12 });
  const bevMat = std({ color: 0x4b5c6e, roughness: 0.34, metalness: 0.76, envMapIntensity: 1.3 });
  const gripMat = std({ color: 0x12171d, roughness: 0.88, metalness: 0.18 });
  const orgMat = std({ color: 0xec5a28, roughness: 0.38 });
  const ledMat = new THREE.MeshBasicMaterial({ color: 0x4df5b0 });

  const light = new THREE.PointLight(0xaadcf2, 2.3, 3.6, 1.4); light.position.set(0, 0.14, -0.2); group.add(light);
  put(group, box(2.2, 0.98, 0.18), panelMat, [0, -0.44, -0.84], [-0.1, 0, 0]);
  put(group, box(2.2, 0.14, 1.85), coamMat, [0, -0.68, -0.1]);
  put(group, box(1.74, 0.052, 0.42), coamMat, [0, 0.072, -0.78]);

  for (const s of [-1, 1]) {
    put(group, box(0.32, 0.62, 1.65), panelMat, [s * 0.88, -0.44, -0.18]);
    put(group, box(0.09, 0.065, 1.68), coamMat, [s * 0.82, -0.04, -0.18]);
    put(group, box(0.028, 1.02, 0.038), coamMat, [s * 0.7, 0.36, -0.57], [-0.34, 0, s * 0.25]);
    for (let k = 0; k < 4; k++) put(group, cyl(0.006, 0.008, 0.03, 6), bevMat, [s * 0.77, -0.002, -0.45 + k * 0.08], [0.25, 0, 0]);
  }
  put(group, new THREE.TorusGeometry(0.84, 0.018, 8, 28, Math.PI), coamMat, [0, -0.03, -0.38], [-0.18, 0, 0]);

  put(group, box(0.014, 0.34, 0.02), bevMat, [-0.26, 0.21, -0.74], [-0.3, 0, 0]);
  put(group, box(0.014, 0.34, 0.02), bevMat, [0.26, 0.21, -0.74], [-0.3, 0, 0]);
  put(group, box(0.54, 0.018, 0.036), coamMat, [0, 0.086, -0.69], [-0.3, 0, 0]);
  put(group, new THREE.PlaneGeometry(0.51, 0.33), new THREE.MeshBasicMaterial({ color: 0x4df5b2, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false }), [0, 0.21, -0.74], [-0.3, 0, 0]);

  const annCanvas = document.createElement('canvas'); annCanvas.width = 640; annCanvas.height = 48;
  const annTex = new THREE.CanvasTexture(annCanvas); annTex.colorSpace = THREE.SRGBColorSpace;
  const annHolder = new THREE.Group(); annHolder.position.set(0, 0.068, -0.556); annHolder.rotation.set(-0.18, 0, 0);
  put(annHolder, box(0.94, 0.068, 0.024), coamMat, [0, 0, -0.012]);
  put(annHolder, new THREE.PlaneGeometry(0.9, 0.056), new THREE.MeshBasicMaterial({ map: annTex }), [0, 0, 0.002]);
  for (const kx of [-0.54, 0.54]) put(annHolder, cyl(0.019, 0.021, 0.024, 12), bevMat, [kx, 0, 0.004], [Math.PI / 2, 0, 0]);
  group.add(annHolder);
  const annunciatorStrip = { canvas: annCanvas, ctx: annCanvas.getContext('2d'), tex: annTex };

  const leftMfd = createCockpitDisplay(group, 320, 280, 0.37, 0.31, -0.455, -0.178, -0.625, 0.16, panelMat, bevMat, ledMat, true);
  const centerAnalog = createCockpitDisplay(group, 420, 360, 0.42, 0.36, 0, -0.178, -0.64, 0, panelMat, bevMat, ledMat, false);
  const rightRadar = createCockpitDisplay(group, 320, 280, 0.37, 0.31, 0.455, -0.178, -0.625, -0.16, panelMat, bevMat, ledMat, true);
  for (const [gx, gy] of [[-0.096, 0.072], [0.096, 0.072], [-0.096, -0.092], [0.096, -0.092]]) {
    put(centerAnalog.holder, new THREE.TorusGeometry(0.077, 0.0058, 8, 28), bevMat, [gx, gy, 0.008]);
  }

  const stickPivot = new THREE.Group(); stickPivot.position.set(0, -0.6, -0.36);
  put(stickPivot, cyl(0.019, 0.025, 0.34, 8), bevMat, [0, 0.17, 0]);
  put(stickPivot, box(0.054, 0.12, 0.066), gripMat, [0, 0.35, 0.01]);
  put(stickPivot, cyl(0.014, 0.014, 0.014, 8), orgMat, [0, 0.415, 0.015]); group.add(stickPivot);

  const throttlePivot = new THREE.Group(); throttlePivot.position.set(-0.72, -0.31, -0.34);
  put(throttlePivot, box(0.028, 0.17, 0.028), bevMat, [0, 0.085, 0]);
  put(throttlePivot, cyl(0.028, 0.028, 0.13, 10), gripMat, [0.036, 0.17, 0], [0, 0, Math.PI / 2]);
  put(throttlePivot, box(0.036, 0.012, 0.012), orgMat, [0.072, 0.17, -0.022]); group.add(throttlePivot);

  aircraftRoot.add(group);
  return { group, leftMfd, centerAnalog, rightRadar, annunciatorStrip, stickPivot, throttlePivot, radarMapCanvas: createArchipelagoRadarMap(200) };
}

export function renderCockpitInstrumentPanels(cockpit, flightState, missionRuntime, activeWaypoint, elapsedSec, visible) {
  cockpit.group.visible = visible && !flightState.crashed;
  if (!cockpit.group.visible) return;
  cockpit.stickPivot.rotation.x = flightState.controlSurfaces.elevator * 0.28;
  cockpit.stickPivot.rotation.z = -flightState.controlSurfaces.aileron * 0.32;
  cockpit.throttlePivot.rotation.x = 0.45 - flightState.throttle * 0.85;
  drawAnnunciatorStrip(cockpit.annunciatorStrip, flightState, elapsedSec);
  drawAnalogInstrumentCluster(cockpit.centerAnalog, flightState);
  drawEngineSystemsMfd(cockpit.leftMfd, flightState);
  drawHsiNavRadarMfd(cockpit.rightRadar, cockpit.radarMapCanvas, flightState, missionRuntime, activeWaypoint, elapsedSec);
}

function mountCockpitPart(parent, geometry, material, pos, rot) {
  const o = new THREE.Mesh(geometry, material);
  if (pos) o.position.set(...pos); if (rot) o.rotation.set(...rot);
  parent.add(o); return o;
}

function createCockpitDisplay(group, wPx, hPx, wM, hM, x, y, z, rotY, panelMat, bevMat, ledMat, osb) {
  const canvas = document.createElement('canvas'); canvas.width = wPx; canvas.height = hPx;
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
  const holder = new THREE.Group(); holder.position.set(x, y, z); holder.rotation.set(-0.14, rotY, 0);
  put(holder, box(wM + 0.048, hM + 0.048, 0.028), panelMat, [0, 0, -0.015]);
  put(holder, box(wM + 0.018, hM + 0.018, 0.02), bevMat, [0, 0, -0.008]);
  put(holder, new THREE.PlaneGeometry(wM, hM), new THREE.MeshBasicMaterial({ map: tex }), [0, 0, 0.005]);
  if (osb) for (let k = -2; k <= 2; k++) put(holder, box(0.02, 0.011, 0.011), ledMat, [k * (wM * 0.19), -hM * 0.5 - 0.016, 0.004]);
  group.add(holder);
  return { holder, canvas, ctx: canvas.getContext('2d'), tex };
}

const std = (o) => new THREE.MeshStandardMaterial(o);
const box = (...a) => new THREE.BoxGeometry(...a), cyl = (...a) => new THREE.CylinderGeometry(...a);
const put = mountCockpitPart;
