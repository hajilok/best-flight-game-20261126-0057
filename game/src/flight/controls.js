// Responsive keyboard + optional mouse-yoke flight controls with edge-triggered cockpit switches.
/** Create an input controller binding keyboard, mouse wheel throttle, and optional mouse yoke. */
export function createFlightControls(canvas, callbacks) {
 const keys = new Set();
 const state = { flightAssist: true, mouseYoke: false, pointerDragging: false, mousePitch: 0, mouseRoll: 0, wheelThrottleImpulse: 0 };
 const onKeyDown = (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  const fresh = !keys.has(e.code);
  keys.add(e.code);
  if (!fresh) return;
  if (e.code === 'KeyF') callbacks.onCycleFlaps?.();
  else if (e.code === 'KeyG') callbacks.onToggleGear?.();
  else if (e.code === 'KeyC' || e.code === 'KeyV') callbacks.onToggleCamera?.();
  else if (e.code === 'KeyT') toggleFlightAssist(state, callbacks.onStatusMessage);
  else if (e.code === 'KeyM') {
  state.mouseYoke = !state.mouseYoke; state.mousePitch = state.mouseRoll = 0;
  callbacks.onStatusMessage?.(state.mouseYoke ? 'MOUSE YOKE ENABLED' : 'KEYBOARD CONTROL ACTIVE');
  } else if (e.code === 'Space') callbacks.onPrimaryAction?.();
  else if (e.code === 'KeyP' || e.code === 'Escape') callbacks.onTogglePause?.();
  else if (e.code === 'KeyR') callbacks.onRestart?.();
  else if (e.code === 'Digit1') callbacks.onSelectMission?.(0);
  else if (e.code === 'Digit2') callbacks.onSelectMission?.(1);
  else if (e.code === 'Digit3') callbacks.onSelectMission?.(2);
  else if (e.code === 'Digit4') callbacks.onSelectMission?.(3);
 };
 const onKeyUp = (e) => keys.delete(e.code);
 const onBlur = () => { keys.clear(); state.pointerDragging = false; state.mousePitch = state.mouseRoll = 0; };
 const updateMouse = (cx, cy) => {
  const r = canvas.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return;
  const dz = (v) => (Math.abs(v) < 0.06 ? 0 : Math.sign(v) * ((Math.abs(v) - 0.06) / 0.94));
  state.mouseRoll = clamp(dz(((cx - r.left) / r.width) * 2 - 1) * 1.15, -1, 1);
  state.mousePitch = clamp(dz(((cy - r.top) / r.height) * 2 - 1) * 1.15, -1, 1);
 };
 const onDown = (e) => { if (e.button === 0) { state.pointerDragging = true; updateMouse(e.clientX, e.clientY); } };
 const onMove = (e) => { if (state.mouseYoke || state.pointerDragging) updateMouse(e.clientX, e.clientY); };
 const onUp = () => { state.pointerDragging = false; if (!state.mouseYoke) { state.mousePitch = state.mouseRoll = 0; } };
 const onWheel = (e) => { e.preventDefault(); state.wheelThrottleImpulse += e.deltaY < 0 ? 0.06 : -0.06; };
 window.addEventListener('keydown', onKeyDown, { passive: false });
 window.addEventListener('keyup', onKeyUp);
 window.addEventListener('blur', onBlur);
 canvas.addEventListener('pointerdown', onDown);
 window.addEventListener('pointermove', onMove);
 window.addEventListener('pointerup', onUp);
 canvas.addEventListener('wheel', onWheel, { passive: false });
 return {
  state, keys,
  sample: () => samplePilotInputs(keys, state),
  dispose() {
  window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp);
  window.removeEventListener('blur', onBlur); canvas.removeEventListener('pointerdown', onDown);
  window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp);
  canvas.removeEventListener('wheel', onWheel);
  },
 };
}
/** Toggle aerodynamic stability augmentation assist. */
export function toggleFlightAssist(controlState, notify) {
 controlState.flightAssist = !controlState.flightAssist;
 notify?.(controlState.flightAssist ? 'FLIGHT ASSIST: ON' : 'FLIGHT ASSIST: MANUAL');
}
/** Sample normalized pitch, roll, yaw, throttle delta, and brake inputs for the current frame. */
export function samplePilotInputs(keys, state) {
 let pitch = (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0);
 let roll = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
 const yaw = (keys.has('KeyE') ? 1 : 0) - (keys.has('KeyQ') ? 1 : 0);
 let throttleDelta =
  (keys.has('ShiftLeft') || keys.has('ShiftRight') || keys.has('Equal') || keys.has('KeyX') ? 0.42 : 0) -
  (keys.has('ControlLeft') || keys.has('ControlRight') || keys.has('Minus') || keys.has('KeyZ') ? 0.46 : 0);
 if (Math.abs(state.wheelThrottleImpulse) > 0.0001) { throttleDelta += state.wheelThrottleImpulse * 16; state.wheelThrottleImpulse = 0; }
 if (state.mouseYoke || state.pointerDragging) {
  if (Math.abs(pitch) < 0.01) pitch = state.mousePitch;
  if (Math.abs(roll) < 0.01) roll = state.mouseRoll;
 }
 return applyControlSurfaces({
  pitch: clamp(pitch, -1, 1), roll: clamp(roll, -1, 1), yaw: clamp(yaw, -1, 1), throttleDelta,
  airbrake: keys.has('KeyB'), wheelBrake: keys.has('KeyB') || (keys.has('ControlLeft') && throttleDelta < 0),
  flightAssist: state.flightAssist, mouseYoke: state.mouseYoke,
 });
}
/** Apply smooth expo curve so small corrections near center are silky while full deflections stay snappy. */
export function applyControlSurfaces(raw) {
 const expo = (v) => v * (0.62 + 0.38 * Math.abs(v));
 return { ...raw, pitch: expo(raw.pitch), roll: expo(raw.roll), yaw: expo(raw.yaw) };
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
