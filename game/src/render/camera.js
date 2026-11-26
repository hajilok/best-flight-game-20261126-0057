// Non-fighting flight camera rig: spring-damped chase camera, 3D cockpit eye rig, and runway flare camera.
import * as THREE from '../../vendor/three.module.min.js';
import { CAMERA_MODES } from '../config.js';
/** Create the camera controller tracking Chase, Cockpit, and Touchdown views smoothly. */
export function createFlightCameraRig(camera) {
 return {
  camera,
  mode: CAMERA_MODES.CHASE,
  smoothPos: new THREE.Vector3(),
  smoothLook: new THREE.Vector3(),
  smoothUp: new THREE.Vector3(0, 1, 0),
  initialized: false,
  reset() { this.initialized = false; },
 };
}
/** Update spring-damped Chase Camera that follows velocity direction without fighting turns or clipping terrain. */
export function updateChaseCamera(rig, flightState, sampleTerrainHeight, dt, snap = false) {
 _fwd.copy(LOCAL_FORWARD).applyQuaternion(flightState.quaternion);
 _up.copy(LOCAL_UP).applyQuaternion(flightState.quaternion);
 if (flightState.velocity.lengthSq() > 40) {
  _velDir.copy(flightState.velocity).normalize();
  _fwd.lerp(_velDir, 0.35).normalize();
 }
 const backDist = flightState.afterburner ? 19.6 : 18.4;
 _desiredPos
  .copy(flightState.position)
  .addScaledVector(_fwd, -backDist)
  .addScaledVector(WORLD_UP, 3.1)
  .addScaledVector(_up, 1.7);
 const groundAtCam = Math.max(0, sampleTerrainHeight(_desiredPos.x, _desiredPos.z));
 if (_desiredPos.y < groundAtCam + 3.8) _desiredPos.y = groundAtCam + 3.8;
 _lookTarget.copy(flightState.position).addScaledVector(_fwd, 28).addScaledVector(WORLD_UP, 1.8);
 _blendedUp.copy(WORLD_UP).lerp(_up, 0.22).normalize();
 if (!rig.initialized || snap) {
  rig.smoothPos.copy(_desiredPos);
  rig.smoothLook.copy(_lookTarget);
  rig.smoothUp.copy(_blendedUp);
  rig.initialized = true;
 } else {
  rig.smoothPos.lerp(_desiredPos, 1 - Math.exp(-dt * 9.5));
  rig.smoothLook.lerp(_lookTarget, 1 - Math.exp(-dt * 14.0));
  rig.smoothUp.lerp(_blendedUp, 1 - Math.exp(-dt * 7.0)).normalize();
 }
 const shake = flightState.telemetry.stallWarning ? 0.14 : flightState.touchdownSmokeTimer > 0.6 ? 0.08 : 0;
 rig.camera.position.copy(rig.smoothPos);
 if (shake > 0) {
  rig.camera.position.x += Math.sin(flightState.buffetTime * 3.1) * shake;
  rig.camera.position.y += Math.cos(flightState.buffetTime * 2.7) * shake;
 }
 rig.camera.up.copy(rig.smoothUp);
 rig.camera.lookAt(rig.smoothLook);
 const targetFov = 58 + Math.min(11, Math.max(0, (flightState.telemetry.airspeedKnots - 100) * 0.055)) + (flightState.afterburner ? 3.5 : 0);
 rig.camera.fov += (targetFov - rig.camera.fov) * (snap ? 1 : Math.min(1, dt * 6));
 rig.camera.updateProjectionMatrix();
}
/** Mount camera inside the 3D cockpit at pilot eye level with subtle G-load head inertia. */
export function updateCockpitCamera(rig, flightState, dt, snap = false) {
 const gDrop = Math.max(-0.04, Math.min(0.04, (flightState.telemetry.gLoad - 1) * 0.01));
 const localEye = new THREE.Vector3(0, 1.07 - gDrop, -1.66).applyQuaternion(flightState.quaternion).add(flightState.position);
 rig.camera.position.copy(localEye);
 _fwd.copy(LOCAL_FORWARD).applyQuaternion(flightState.quaternion);
 _up.copy(LOCAL_UP).applyQuaternion(flightState.quaternion);
 _lookTarget.copy(localEye).addScaledVector(_fwd, 60).addScaledVector(_up, -9.2);
 _lookMat.lookAt(localEye, _lookTarget, _up);
 _targetQuat.setFromRotationMatrix(_lookMat);
 if (!rig.initialized || snap) { rig.camera.quaternion.copy(_targetQuat); rig.initialized = true; }
 else rig.camera.quaternion.slerp(_targetQuat, Math.min(1, dt * 24));
 rig.camera.fov += (68 - rig.camera.fov) * (snap ? 1 : Math.min(1, dt * 8));
 rig.camera.updateProjectionMatrix();
}
/** Position low-angle runway flare & touchdown camera framing the entire rolling jet cleanly left of debrief. */
export function updateTouchdownCamera(rig, flightState, dt, snap = false) {
 _fwd.copy(LOCAL_FORWARD).applyQuaternion(flightState.quaternion);
 _right.copy(LOCAL_RIGHT).applyQuaternion(flightState.quaternion);
 _desiredPos
  .copy(flightState.position)
  .addScaledVector(_fwd, -21.5)
  .addScaledVector(_right, -14.5)
  .addScaledVector(WORLD_UP, 4.4);
 _desiredPos.y = Math.max(_desiredPos.y, 25.4);
 _lookTarget.copy(flightState.position).addScaledVector(_fwd, 13.5).addScaledVector(_right, 15.8).addScaledVector(WORLD_UP, 0.2);
 if (!rig.initialized || snap) { rig.smoothPos.copy(_desiredPos); rig.smoothLook.copy(_lookTarget); rig.initialized = true; }
 else {
  rig.smoothPos.lerp(_desiredPos, Math.min(1, dt * 6));
  rig.smoothLook.lerp(_lookTarget, Math.min(1, dt * 8));
 }
 rig.camera.position.copy(rig.smoothPos);
 rig.camera.up.copy(WORLD_UP);
 rig.camera.lookAt(rig.smoothLook);
 rig.camera.fov = 54;
 rig.camera.updateProjectionMatrix();
}
const LOCAL_FORWARD = new THREE.Vector3(0, 0, -1);
const LOCAL_UP = new THREE.Vector3(0, 1, 0);
const LOCAL_RIGHT = new THREE.Vector3(1, 0, 0);
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const _fwd = new THREE.Vector3();
const _up = new THREE.Vector3();
const _right = new THREE.Vector3();
const _velDir = new THREE.Vector3();
const _desiredPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _blendedUp = new THREE.Vector3();
const _lookMat = new THREE.Matrix4();
const _targetQuat = new THREE.Quaternion();
