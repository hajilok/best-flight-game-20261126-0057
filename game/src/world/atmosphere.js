// Volumetric GLSL sky & 2-layer FBM cloud dome, PMREM metallic reflections, high cloud wisps, and monsoon rain.
import * as THREE from '../../vendor/three.module.min.js';
import { TIME_OF_DAY_PRESETS } from '../config.js';

export function createSkyEnvironmentMap(renderer, preset) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, preset.zenithHex); g.addColorStop(0.46, preset.horizonHex); g.addColorStop(0.52, preset.glowHex);
  g.addColorStop(0.62, preset.waterShallowHex); g.addColorStop(1, preset.waterDeepHex);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 128);
  const sx = ((Math.atan2(preset.sunDir[0], -preset.sunDir[2]) / (Math.PI * 2)) + 1.5) % 1;
  const sy = Math.max(0.06, 0.5 - preset.sunDir[1] * 0.45);
  const sg = ctx.createRadialGradient(sx * 256, sy * 128, 2, sx * 256, sy * 128, 34);
  sg.addColorStop(0, '#fff'); sg.addColorStop(0.35, preset.glowHex); sg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sg; ctx.fillRect(0, 0, 256, 128);
  const eq = new THREE.CanvasTexture(c); eq.mapping = THREE.EquirectangularReflectionMapping; eq.colorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.PMREMGenerator(renderer); const rt = pm.fromEquirectangular(eq); eq.dispose(); pm.dispose();
  return rt;
}

export function createAtmosphericSky(preset = TIME_OF_DAY_PRESETS.goldenHour) {
  const uniforms = {
    uTime: { value: 0 }, uSunDir: { value: new THREE.Vector3(...preset.sunDir).normalize() },
    uZenithColor: { value: new THREE.Color(preset.zenithHex) }, uHorizonColor: { value: new THREE.Color(preset.horizonHex) },
    uGlowColor: { value: new THREE.Color(preset.glowHex) }, uCloudLight: { value: new THREE.Color(preset.cloudLightHex) },
    uCloudShadow: { value: new THREE.Color(preset.cloudShadowHex) }, uCloudCoverage: { value: preset.cloudCoverage ?? 0.48 },
    uStormFactor: { value: preset.rainIntensity ?? 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'uniform float uTime,uCloudCoverage,uStormFactor;uniform vec3 uSunDir,uZenithColor,uHorizonColor,uGlowColor,uCloudLight,uCloudShadow;varying vec3 vD;float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h21(i),h21(i+vec2(1.0,0.0)),f.x),mix(h21(i+vec2(0.0,1.0)),h21(i+vec2(1.0,1.0)),f.x),f.y);}float fbm(vec2 p){float v=0.0,a=0.52;mat2 m=mat2(0.8,0.6,-0.6,0.8);for(int i=0;i<5;i++){v+=a*vn(p);p=m*p*2.07;a*=0.48;}return v;}void main(){vec3 d=normalize(vD),s=normalize(uSunDir),sky=mix(uHorizonColor,uZenithColor,pow(clamp(d.y,0.0,1.0),0.52));float sd=max(dot(d,s),0.0),sv=1.0-uStormFactor*0.52;sky+=uGlowColor*((pow(sd,9.0)*0.46+pow(sd,120.0)*0.85+smoothstep(0.9982,0.9994,sd)*1.65)*sv+exp(-abs(d.y)*9.0)*0.24);if(d.y>0.015){float hf=smoothstep(0.015,0.16,d.y);vec2 uL=(d.xz/(d.y+0.14))*0.62+vec2(uTime*0.004,-uTime*0.002);float cL=fbm(uL),th=1.0-uCloudCoverage,dn=smoothstep(th-0.12,th+0.24,cL)*hf,lit=clamp(0.32+(cL-fbm(uL+s.xz*0.16))*2.8+pow(sd,4.0)*0.55,0.0,1.0);vec3 cC=mix(uCloudShadow,uCloudLight,lit)+uGlowColor*pow(sd,6.0)*(0.35+uStormFactor*0.35)*(1.0-dn*0.45);float ci=smoothstep(0.56,0.84,fbm(((d.xz/(d.y+0.22))*1.45+vec2(-uTime*0.002,uTime*0.003))*vec2(1.7,0.65)))*hf*0.35;sky=mix(mix(sky,mix(uCloudLight,uGlowColor,0.35),ci),cC,dn*(0.86+uStormFactor*0.12));}gl_FragColor=vec4(sky,1.0);}',
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(15000, 32, 20), mat); mesh.name = 'AtmosphericSkyDome';
  return { mesh, uniforms };
}

export function createVolumetricCloudLayer(preset = TIME_OF_DAY_PRESETS.goldenHour) {
  const group = new THREE.Group(); group.name = 'VolumetricCloudWisps';
  const mat = new THREE.SpriteMaterial({ map: createCloudSpriteTexture(), color: preset.glowHex, transparent: true, opacity: 0.34, depthWrite: false });
  for (const [x, y, z, w, h] of [[-1480, 680, -1120, 740, 180], [220, 720, -1820, 820, 200], [1680, 700, -1480, 780, 190], [-1020, 740, 940, 720, 170], [520, 780, -2780, 880, 220], [-2150, 690, -1480, 780, 195], [1840, 710, 1160, 760, 185], [-1620, 660, 620, 700, 175]]) {
    const sp = new THREE.Sprite(mat); sp.position.set(x, y, z); sp.scale.set(w, h, 1); group.add(sp);
  }
  return { group, material: mat };
}

export function createMonsoonRainField() {
  const n = 1100, pos = new Float32Array(n * 6);
  for (let i = 0; i < n; i++) {
    const x = (rainHash(i * 1.73 + 3.1) - 0.5) * 62, y = (rainHash(4.91 + i * 2.37) - 0.5) * 38, z = (rainHash(i * 3.71 + 9.2) - 0.5) * 62;
    pos[i * 6] = x; pos[i * 6 + 1] = y; pos[i * 6 + 2] = z;
    pos[i * 6 + 3] = x - 2.2; pos[i * 6 + 4] = y - 9.2; pos[i * 6 + 5] = z + 1.6;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xddf2ff, transparent: true, opacity: 0.72 }));
  lines.visible = false; lines.frustumCulled = false;
  return lines;
}

export function applyAtmospherePreset(env, presetKey) {
  const p = TIME_OF_DAY_PRESETS[presetKey] ?? TIME_OF_DAY_PRESETS.goldenHour;
  const sd = new THREE.Vector3(...p.sunDir).normalize();
  env.sunLight.color.setHex(p.sunColor); env.sunLight.intensity = p.sunIntensity; env.sunDir.copy(sd);
  env.hemiLight.color.setHex(p.hemiSky); env.hemiLight.groundColor.setHex(p.hemiGround); env.hemiLight.intensity = p.hemiIntensity;
  env.scene.fog.color.set(p.fogHex); env.scene.fog.density = p.fogDensity;
  if (env.envMapCache && !env.envMapCache[presetKey]) env.envMapCache[presetKey] = createSkyEnvironmentMap(env.renderer, p);
  if (env.envMapCache?.[presetKey]) env.scene.environment = env.envMapCache[presetKey].texture;
  const su = env.sky.uniforms;
  su.uSunDir.value.copy(sd); su.uZenithColor.value.set(p.zenithHex); su.uHorizonColor.value.set(p.horizonHex);
  su.uGlowColor.value.set(p.glowHex); su.uCloudLight.value.set(p.cloudLightHex); su.uCloudShadow.value.set(p.cloudShadowHex);
  su.uCloudCoverage.value = p.cloudCoverage ?? 0.48; su.uStormFactor.value = p.rainIntensity ?? 0;
  const ou = env.ocean.uniforms;
  ou.uSunDir.value.copy(sd); ou.uSunColor.value.setHex(p.sunColor); ou.uDeepColor.value.set(p.waterDeepHex);
  ou.uShallowColor.value.set(p.waterShallowHex); ou.uHorizonColor.value.set(p.horizonHex); ou.uFogColor.value.set(p.fogHex); ou.uFogDensity.value = p.fogDensity;
  env.clouds.material.color.set(p.glowHex); env.clouds.material.opacity = (p.rainIntensity ?? 0) > 0.1 ? 0.28 : 0.34;
  env.rainLines.visible = (p.rainIntensity ?? 0) > 0.1;
}

function createCloudSpriteTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 96; const ctx = c.getContext('2d');
  for (const [x, y, r, a] of [[128, 46, 52, 0.85], [76, 52, 42, 0.72], [180, 52, 44, 0.72], [44, 58, 30, 0.5], [212, 58, 30, 0.5]]) {
    const g = ctx.createRadialGradient(x, y - r * 0.2, r * 0.1, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.55, `rgba(242,246,252,${a * 0.45})`); g.addColorStop(1, 'rgba(220,232,245,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 96);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const rainHash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
