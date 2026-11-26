// Procedural volcanic archipelago terrain,3-tier conifers, ocean shader, sky dome, clouds, and monsoon rain.
import * as THREE from '../../vendor/three.module.min.js';
import { TIME_OF_DAY_PRESETS, WORLD_CONFIG } from '../config.js';
/** Deterministic elevation function. */
export function sampleArchipelagoHeight(x, z) {
 let h=-34;
 h += gauss(x, z,20,10,680,390) * 68;
 h += gauss(x, z,-240,-320,290,220) * 95 + gauss(x, z,360,290,270,210) * 82;
 const dxC=x - 680; const dzC=z + 1980;
 const rCaldera=Math.hypot(dxC, dzC);
 const rimProfile=Math.exp(-(((rCaldera - 980) / 390) ** 2));
 const canyonCut=Math.exp(-(((Math.atan2(dzC, dxC) - 1.78) / 0.28) ** 2));
 const crags=ridgedNoise(x * 0.0014 + 3.1, z * 0.0014 - 1.7);
 h += rimProfile * (1 - canyonCut * 0.94) * (310 + crags * 260);
 h += gauss(x, z,-120,-1120,360,310) * (250 + crags * 125);
 h += gauss(x, z,960,-1040,370,330) * (285 + crags * 140);
 h += gauss(x, z,1960,-280,560,490) * (290 + crags * 175) + gauss(x, z,2240,360,380,340) * (210 + crags * 95);
 h += gauss(x, z,-1680,-560,580,520) * (280 + crags * 165) + gauss(x, z,-1260,420,240,220) * 86;
 h += gauss(x, z,2280,1520,320,280) * 190 + gauss(x, z,-960,1540,420,350) * 165;
 if (h > -18) h += fbm(x * 0.0034, z * 0.0034,4) * 32 + ridgedNoise(x * 0.0048, z * 0.0048) * 18;
 h -= smoothstep(560,220, rCaldera) * 48 + gauss(x, z,440,-1040,245,420) * 110;
 const carrierClear=gauss(x, z,1460,1120,420,320);
 h=h * (1 - carrierClear) - 28 * carrierClear;
 const rwyBlend=1 - smoothstep(0,145, Math.hypot(Math.max(0, Math.abs(x) - 465), Math.max(0, Math.abs(z) - 82)));
 if (rwyBlend > 0) h=h * (1 - rwyBlend) + 22 * rwyBlend;
 const opBlend=1 - smoothstep(42,115, Math.hypot(x + 1520, z + 520));
 if (opBlend > 0) h=h * (1 - opBlend) + 185 * opBlend;
 const lhBlend=1 - smoothstep(30,88, Math.hypot(x + 1260, z - 420));
 if (lhBlend > 0) h=h * (1 - lhBlend) + 44 * lhBlend;
 return h;
}
/** Build the sculpted volcanic. */
export function createTerrainMesh() {
 const geom=new THREE.PlaneGeometry(WORLD_CONFIG.terrainSpanM, WORLD_CONFIG.terrainSpanM, WORLD_CONFIG.terrainSegments, WORLD_CONFIG.terrainSegments);
 geom.rotateX(-Math.PI / 2);
 const pos=geom.attributes.position;
 for (let i=0; i < pos.count; i++) pos.setY(i, sampleArchipelagoHeight(pos.getX(i), pos.getZ(i)));
 geom.computeVertexNormals();
 const normals=geom.attributes.normal;
 const colors=new Float32Array(pos.count * 3);
 const col=new THREE.Color();
 for (let i=0; i < pos.count; i++) {
  const x=pos.getX(i); const y=pos.getY(i); const z=pos.getZ(i);
  const slope=1 - normals.getY(i);
  const strata=Math.sin(y * 0.14 + fbm(x * 0.005, z * 0.005,2) * 3.5) * 0.045;
  const nTint=fbm(x * 0.009, z * 0.009,2) * 0.055;
  if (y < -4) col.setRGB(0.08,0.31,0.38);
  else if (y < 6.5) { const t=smoothstep(-4,6.5, y); col.setRGB(0.60 * t + 0.14 * (1 - t),0.56 * t + 0.36 * (1 - t),0.44 * t + 0.36 * (1 - t)); }
  else if (slope > 0.32) { const r=0.28 + smoothstep(60,380, y) * 0.14 + strata + nTint; col.setRGB(r * 1.08, r * 0.98, r * 0.93); }
  else if (y > 248) { const s=smoothstep(248,330, y); col.setRGB(0.38 + s * 0.55,0.41 + s * 0.53,0.45 + s * 0.51); }
  else if (y > 135) { const t=smoothstep(135,248, y); col.setRGB(0.20 + t * 0.18 + nTint,0.39 - t * 0.02 + nTint,0.22 + t * 0.15); }
  else { const t=smoothstep(6.5,135, y); col.setRGB(0.26 - t * 0.07 + nTint,0.51 - t * 0.11 + nTint,0.24 - t * 0.03); }
  colors[i * 3] = Math.max(0, Math.min(1, col.r));
  colors[i * 3 + 1] = Math.max(0, Math.min(1, col.g));
  colors[i * 3 + 2] = Math.max(0, Math.min(1, col.b));
 }
 geom.setAttribute('color', new THREE.BufferAttribute(colors,3));
 const terrain=new THREE.Mesh(geom, stdMat({ vertexColors: true, map: createTerrainDetailTexture(), roughness: 0.88, metalness: 0.04 }));
 terrain.receiveShadow=true;
 const group=new THREE.Group();
 group.name='ArchipelagoTerrain';
 group.add(terrain, buildInstancedPineForests());
 return group;
}
/** Create animated Fresnel + sun-glitter. */
export function createOceanWaterMesh(preset=TIME_OF_DAY_PRESETS.goldenHour) {
 const uniforms={
  uTime: { value: 0 },
  uSunDir: { value: new THREE.Vector3(...preset.sunDir).normalize() },
  uSunColor: { value: new THREE.Color(preset.sunColor) },
  uDeepColor: { value: new THREE.Color(preset.waterDeepHex) },
  uShallowColor: { value: new THREE.Color(preset.waterShallowHex) },
  uHorizonColor: { value: new THREE.Color(preset.horizonHex) },
  uFogColor: { value: new THREE.Color(preset.fogHex) },
  uFogDensity: { value: preset.fogDensity },
 };
 const mat=new THREE.ShaderMaterial({
  uniforms,
  vertexShader: `varying vec3 vWorldPos; void main() { vec4 wp=modelMatrix * vec4(position,1.0); vWorldPos=wp.xyz; gl_Position=projectionMatrix * viewMatrix * wp; }`,
  fragmentShader: `
  uniform float uTime, uFogDensity;
  uniform vec3 uSunDir, uSunColor, uDeepColor, uShallowColor, uHorizonColor, uFogColor;
  varying vec3 vWorldPos;
  float wave(vec2 p, float t) { return sin(p.x*0.045+t*1.2)*0.5 + cos(p.y*0.052-t*1.05)*0.35 + sin((p.x+p.y)*0.095+t*1.8)*0.15; }
  void main() {
  vec2 p=vWorldPos.xz;
  float h0=wave(p, uTime);
  vec3 N=normalize(vec3((h0 - wave(p + vec2(1.6,0.0), uTime))*0.16,1.0, (h0 - wave(p + vec2(0.0,1.6), uTime))*0.16));
  vec3 V=normalize(cameraPosition - vWorldPos);
  float fresnel=pow(1.0 - max(dot(N, V),0.0),3.2);
  float shoal=clamp(smoothstep(980.0,420.0, length(p - vec2(20.0,10.0))) + smoothstep(640.0,260.0, length(p - vec2(680.0,-1980.0))),0.0,1.0);
  vec3 base=mix(uDeepColor, uShallowColor, shoal*0.72 + clamp(h0*0.12 + 0.12,0.0,0.28));
  vec3 H=normalize(uSunDir + V);
  float spec=pow(max(dot(N, H),0.0),110.0)*1.45 + pow(max(dot(N, H),0.0),22.0)*0.22;
  vec3 col=mix(base, uHorizonColor*0.95, clamp(fresnel*0.78,0.0,0.82)) + uSunColor*spec;
  float fog=1.0 - exp(-pow(length(cameraPosition - vWorldPos)*uFogDensity,2.0));
  gl_FragColor=vec4(mix(col, uFogColor, clamp(fog,0.0,1.0)),1.0);
  }
  `,
 });
 const geom=new THREE.PlaneGeometry(WORLD_CONFIG.oceanSpanM, WORLD_CONFIG.oceanSpanM,1,1);
 geom.rotateX(-Math.PI / 2);
 const mesh=new THREE.Mesh(geom, mat);
 mesh.position.y=WORLD_CONFIG.seaLevelY;
 mesh.name='ArchipelagoOcean';
 return { mesh, uniforms };
}
/** Create a seamless Rayleigh/Mie. */
export function createAtmosphericSky(preset=TIME_OF_DAY_PRESETS.goldenHour) {
 const uniforms={
  uSunDir: { value: new THREE.Vector3(...preset.sunDir).normalize() },
  uZenithColor: { value: new THREE.Color(preset.zenithHex) },
  uHorizonColor: { value: new THREE.Color(preset.horizonHex) },
  uGlowColor: { value: new THREE.Color(preset.glowHex) },
  uStormFactor: { value: preset.rainIntensity ?? 0 },
 };
 const mat=new THREE.ShaderMaterial({
  uniforms, side: THREE.BackSide, depthWrite: false,
  vertexShader: `varying vec3 vDir; void main() { vDir=normalize(position); gl_Position=projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
  uniform vec3 uSunDir, uZenithColor, uHorizonColor, uGlowColor;
  uniform float uStormFactor;
  varying vec3 vDir;
  void main() {
  vec3 d=normalize(vDir);
  vec3 sky=mix(uHorizonColor, uZenithColor, pow(clamp(d.y,0.0,1.0),0.55));
  float sd=max(dot(d, normalize(uSunDir)),0.0);
  float sunMask=1.0 - uStormFactor * 0.82;
  float glow=(pow(sd,10.0)*0.42 + pow(sd,160.0)*0.92 + smoothstep(0.9985,0.9994, sd)*1.35) * sunMask + exp(-abs(d.y)*8.5)*0.24;
  float cloudBand=uStormFactor * smoothstep(0.02,0.55, d.y) * (sin(d.x*18.0 + d.z*12.0)*0.05 + 0.06);
  gl_FragColor=vec4(sky + uGlowColor * glow - vec3(cloudBand),1.0);
  }
  `,
 });
 const mesh=new THREE.Mesh(sphG(15000,32,20), mat);
 mesh.name='AtmosphericSkyDome';
 return { mesh, uniforms };
}
/** Create layered sunlit cumulus cloud. */
export function createCloudDeck(preset=TIME_OF_DAY_PRESETS.goldenHour) {
 const group=new THREE.Group();
 group.name='CumulusCloudDeck';
 const mat=stdMat({ color: preset.cloudColor, emissive: preset.cloudEmissive, emissiveIntensity: 0.45, roughness: 0.92, transparent: true, opacity: 0.92 });
 const anchors=[
  [-1100,420,-820,1.3], [120,480,-1550,1.6], [1350,440,-1250,1.5], [2050,490,-180,1.4],
  [1150,390,450,1.2], [-850,510,680,1.4], [-2100,460,-1450,1.7], [450,560,-2750,1.8],
  [2250,520,1180,1.5], [-1780,430,1150,1.3], [-320,440,1450,1.2], [1520,580,-2450,1.6],
  [-550,380,-2100,1.3], [760,430,1380,1.25], [-1950,510,220,1.45], [2580,470,-1100,1.65],
 ];
 const inst=new THREE.InstancedMesh(sphG(1,10,8), mat, anchors.length * 7);
 const dummy=new THREE.Object3D();
 let idx=0;
 for (let c=0; c < anchors.length; c++) {
  const [cx, cy, cz, sc] = anchors[c];
  for (let p=0; p < 7; p++) {
  const ang=(p / 7) * Math.PI * 2 + c * 0.7;
  const rad=p < 2 ? p * 26 * sc : (54 + (p % 3) * 28) * sc;
  dummy.position.set(cx + Math.cos(ang) * rad, cy + (p === 0 ? 22 : p === 1 ? 14 : -4 + (p % 3) * 9) * sc, cz + Math.sin(ang) * rad);
  dummy.scale.set((54 + (p % 3) * 22) * sc, (30 + (p === 0 ? 20 : (p % 2) * 10)) * sc, (52 + ((p + 1) % 3) * 20) * sc);
  dummy.rotation.set(0, ang,0);
  dummy.updateMatrix();
  inst.setMatrixAt(idx++, dummy.matrix);
  }
 }
 inst.instanceMatrix.needsUpdate=true;
 group.add(inst);
 const rainCount=420;
 const rPos=new Float32Array(rainCount * 6);
 for (let i=0; i < rainCount; i++) {
  const rx=(hash2(i * 1.7,3.1) - 0.5) * 95;
  const ry=(hash2(4.9, i * 2.3) - 0.5) * 55;
  const rz=(hash2(i * 3.7,9.2) - 0.5) * 95;
  rPos[i * 6] = rx; rPos[i * 6 + 1] = ry; rPos[i * 6 + 2] = rz;
  rPos[i * 6 + 3] = rx - 1.4; rPos[i * 6 + 4] = ry - 6.8; rPos[i * 6 + 5] = rz + 1.1;
 }
 const rGeom=new THREE.BufferGeometry();
 rGeom.setAttribute('position', new THREE.BufferAttribute(rPos,3));
 const rainLines=new THREE.LineSegments(rGeom, new THREE.LineBasicMaterial({ color: 0xbfe2f5, transparent: true, opacity: 0.42 }));
 rainLines.visible=false;
 rainLines.frustumCulled=false;
 return { group, material: mat, rainLines };
}
/** Update sky dome, ocean shader, fog,. */
export function applyTimeOfDayPreset(env, presetKey) {
 const p=TIME_OF_DAY_PRESETS[presetKey] ?? TIME_OF_DAY_PRESETS.goldenHour;
 const sunDir=new THREE.Vector3(...p.sunDir).normalize();
 env.sunLight.color.setHex(p.sunColor); env.sunLight.intensity=p.sunIntensity; env.sunDir.copy(sunDir);
 env.hemiLight.color.setHex(p.hemiSky); env.hemiLight.groundColor.setHex(p.hemiGround); env.hemiLight.intensity=p.hemiIntensity;
 env.scene.fog.color.set(p.fogHex); env.scene.fog.density=p.fogDensity;
 env.sky.uniforms.uSunDir.value.copy(sunDir);
 env.sky.uniforms.uZenithColor.value.set(p.zenithHex);
 env.sky.uniforms.uHorizonColor.value.set(p.horizonHex);
 env.sky.uniforms.uGlowColor.value.set(p.glowHex);
 env.sky.uniforms.uStormFactor.value=p.rainIntensity ?? 0;
 env.ocean.uniforms.uSunDir.value.copy(sunDir);
 env.ocean.uniforms.uSunColor.value.setHex(p.sunColor);
 env.ocean.uniforms.uDeepColor.value.set(p.waterDeepHex);
 env.ocean.uniforms.uShallowColor.value.set(p.waterShallowHex);
 env.ocean.uniforms.uHorizonColor.value.set(p.horizonHex);
 env.ocean.uniforms.uFogColor.value.set(p.fogHex);
 env.ocean.uniforms.uFogDensity.value=p.fogDensity;
 env.clouds.material.color.setHex(p.cloudColor);
 env.clouds.material.emissive.setHex(p.cloudEmissive);
 env.clouds.rainLines.visible=(p.rainIntensity ?? 0) > 0.1;
}
function buildInstancedPineForests() {
 const spots=[];
 for (let i=0; i < 1400 && spots.length < 560; i++) {
  const x=(hash2(i * 1.37,17.4) - 0.5) * 4400;
  const z=(hash2(29.1, i * 2.13) - 0.5) * 4400;
  if ((Math.abs(x) < 515 && Math.abs(z) < 120) || Math.hypot(x + 1520, z + 520) < 95 || Math.hypot(x + 1260, z - 420) < 75) continue;
  const y=sampleArchipelagoHeight(x, z);
  if (y < 14 || y > 178) continue;
  if (Math.hypot((sampleArchipelagoHeight(x + 12, z) - y) / 12, (sampleArchipelagoHeight(x, z + 12) - y) / 12) > 0.52) continue;
  spots.push([x, y, z,0.8 + hash2(i * 3.1, i * 0.7) * 1.1]);
 }
 const treeGroup=new THREE.Group();
 const trunkMat=stdMat({ color: 0x5c4230, roughness: 0.95 });
 const boughMat=stdMat({ color: 0xffffff, roughness: 0.84, emissive: 0x162b1c, emissiveIntensity: 0.35 });
 const trunks=new THREE.InstancedMesh(cylG(0.9,1.35,6.5,5), trunkMat, spots.length);
 const tiers=[
  new THREE.InstancedMesh(new THREE.ConeGeometry(6.4,11,7), boughMat, spots.length),
  new THREE.InstancedMesh(new THREE.ConeGeometry(5.0,10,7), boughMat, spots.length),
  new THREE.InstancedMesh(new THREE.ConeGeometry(3.4,9,7), boughMat, spots.length),
 ];
 const tierY=[8.2,13.8,18.8];
 const dummy=new THREE.Object3D();
 const tint=new THREE.Color();
 for (let i=0; i < spots.length; i++) {
  const [x, y, z, sc] = spots[i];
  const hScale=sc * (0.92 + (i % 5) * 0.06);
  const yaw=(i * 1.7) % (Math.PI * 2);
  dummy.position.set(x, y + 2.2 * hScale, z);
  dummy.scale.set(sc, hScale, sc);
  dummy.rotation.set(0, yaw,0);
  dummy.updateMatrix();
  trunks.setMatrixAt(i, dummy.matrix);
  for (let t=0; t < 3; t++) {
  dummy.position.set(x, y + tierY[t] * hScale, z);
  dummy.scale.set(sc, hScale, sc);
  dummy.rotation.set(0, yaw + t * 0.55,0);
  dummy.updateMatrix();
  tiers[t].setMatrixAt(i, dummy.matrix);
  tint.setHSL(0.35 + (i % 7) * 0.008,0.38,0.25 + t * 0.055 + (i % 4) * 0.02);
  tiers[t].setColorAt(i, tint);
  }
 }
 trunks.instanceMatrix.needsUpdate=true;
 treeGroup.add(trunks);
 for (const tier of tiers) {
  tier.castShadow=tier.receiveShadow=true;
  tier.instanceMatrix.needsUpdate=true;
  if (tier.instanceColor) tier.instanceColor.needsUpdate=true;
  treeGroup.add(tier);
 }
 return treeGroup;
}
function createTerrainDetailTexture() {
 const c=document.createElement('canvas');
 c.width=c.height=256;
 const ctx=c.getContext('2d');
 ctx.fillStyle='#e5e8e2'; ctx.fillRect(0,0,256,256);
 for (let y=0; y < 256; y += 2) {
  for (let x=0; x < 256; x += 2) {
  const n=valueNoise(x * 0.11, y * 0.11) * 0.55 + valueNoise(x * 0.29 + 9, y * 0.29 - 4) * 0.30 + Math.sin((y + x * 0.35) * 0.18) * 0.15;
  const s=Math.round(206 + (n - 0.5) * 62);
  ctx.fillStyle=`rgb(${s},${s + 2},${s - 2})`;
  ctx.fillRect(x, y,2,2);
  }
 }
 const tex=new THREE.CanvasTexture(c);
 tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
 tex.repeat.set(64,64);
 tex.colorSpace=THREE.SRGBColorSpace;
 return tex;
}
const smoothstep=(e0, e1, x) => { const t=Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const hash2=(ix, iz) => { const s=Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453123; return s - Math.floor(s); };
const gauss=(x, z, cx, cz, rx, rz) => Math.exp(-(((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2));
function valueNoise(x, z) {
 const ix=Math.floor(x); const iz=Math.floor(z);
 const fx=x - ix; const fz=z - iz;
 const ux=fx * fx * (3 - 2 * fx); const uz=fz * fz * (3 - 2 * fz);
 const a=hash2(ix, iz); const b=hash2(ix + 1, iz); const c=hash2(ix, iz + 1); const d=hash2(ix + 1, iz + 1);
 return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}
function fbm(x, z, octaves=4) {
 let sum=0; let amp=0.5; let freq=1;
 for (let i=0; i < octaves; i++) { sum += amp * (valueNoise(x * freq, z * freq) * 2 - 1); freq *= 2.04; amp *= 0.5; }
 return sum;
}
function ridgedNoise(x, z) {
 let sum=0; let amp=0.55; let freq=1;
 for (let i=0; i < 3; i++) { const n=1 - Math.abs(valueNoise(x * freq, z * freq) * 2 - 1); sum += amp * n * n; freq *= 2.15; amp *= 0.48; }
 return sum;
}
const stdMat=(o) => new THREE.MeshStandardMaterial(o);
const basMat=(o) => new THREE.MeshBasicMaterial(o);
const boxG=(...a) => new THREE.BoxGeometry(...a);
const cylG=(...a) => new THREE.CylinderGeometry(...a);
const sphG=(...a) => new THREE.SphereGeometry(...a);
