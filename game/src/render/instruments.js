// Flown-grade cockpit instrument painters: 4 analog steam gauges, backlit warning annunciators, and tactical glass MFDs.
import * as THREE from '../../vendor/three.module.min.js';
import { drawTacticalRadarScope } from './radar.js';
export function createBrushedMetalTexture() {
const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
ctx.fillStyle='#252f3a';ctx.fillRect(0,0,256,256);
for(let y=0;y<256;y++){const d=Math.round(((Math.sin(y*12.7)*43758.5)%1)*5);ctx.fillStyle=`rgb(${36 + d},${45 + d},${56 + d})`;ctx.fillRect(0,y,256,1);}
ctx.strokeStyle='rgba(130,160,188,0.14)';ctx.strokeRect(4,4,248,248);
for(const [rx,ry]of [[14,14],[242,14],[14,242],[242,242]]){
ctx.fillStyle='#536578';ctx.beginPath();ctx.arc(rx,ry,4,0,Math.PI*2);ctx.fill();
seg(ctx,rx-3,ry,rx+3,ry,'#141b22',1.2);
}
const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t;
}
export function drawAnnunciatorStrip(strip, flightState, elapsedSec) {
const {ctx,canvas,tex}=strip;const w=canvas.width;const h=canvas.height;const t=flightState.telemetry;
ctx.fillStyle='#0f161e';ctx.fillRect(0,0,w,h);
const lamps=[
['SYS OK',!t.stallWarning&&flightState.hull>45,'#4ef5a8','#0d2e22'],
['NAV LOCK',true,'#64e3ff','#0c2938'],
['GEAR DN',flightState.gearDown,'#4ef5a8','#0d2e22'],
['FLAPS',flightState.flapAngleDeg>2,'#64e3ff','#0c2938'],
['MIL PWR',flightState.throttle>0.7&&!flightState.afterburner,'#4ef5a8','#0d2e22'],
['A/B ON',flightState.afterburner,'#ff9c33','#382008'],
['MASTER',(t.stallWarning||t.pullUpWarning||t.lowFuelWarning||flightState.hull<45)&&Math.sin(elapsedSec*10)>0,'#ff4d4d','#3a0d10'],
];
const pad=6;const bw=(w-pad*(lamps.length+1))/lamps.length;
for(let i=0;i<lamps.length;i++){
const [lbl,on,col,bg]=lamps[i];const x=pad+i*(bw+pad);
ctx.fillStyle=on?bg:'#15202a';ctx.fillRect(x,6,bw,h-12);
ctx.strokeStyle=on?col:'#2a3b4a';ctx.lineWidth=on?2.4:1.2;ctx.strokeRect(x,6,bw,h-12);
txt(ctx,lbl,x+bw*0.5,h*0.5+1,on?col:'#4a6073',14);
}
tex.needsUpdate=true;
}
export function drawAnalogInstrumentCluster(panel, flightState) {
const {ctx,canvas,tex}=panel;const w=canvas.width;const h=canvas.height;const t=flightState.telemetry;
ctx.fillStyle='#171f28';ctx.fillRect(0,0,w,h);
ctx.fillStyle='#25313e';ctx.fillRect(w*0.5-78,5,156,19);
ctx.strokeStyle='#53677a';ctx.lineWidth=1.2;ctx.strokeRect(w*0.5-78,5,156,19);
txt(ctx,'KW-04 KESTREL · STBY',w*0.5,15,'#d4e6f2',11);
drawAirspeedDial(ctx,114,108,73,t.airspeedKnots);
drawAttitudeGyroDial(ctx,306,108,73,t.pitchDeg,t.rollDeg);
drawAltimeterDial(ctx,114,272,73,t.altitudeFeet);
drawVerticalSpeedDial(ctx,306,272,73,t.verticalSpeedFpm,t.gLoad);
tex.needsUpdate=true;
}
export function drawEngineSystemsMfd(mfd, flightState) {
const {ctx,canvas,tex}=mfd;const w=canvas.width;const h=canvas.height;const t=flightState.telemetry;
ctx.fillStyle='#07131c';ctx.fillRect(0,0,w,h);
ctx.strokeStyle='rgba(86,247,176,0.35)';ctx.lineWidth=1.5;ctx.strokeRect(6,6,w-12,h-12);
txt(ctx,'ENG / AIRFRAME · MFD-1',16,20,'#56f7b0',13,'left');
txt(ctx,`EGT ${Math.round(480 + flightState.throttle * 340)}°C`,222,20,'#89b7c9',11,'left');
for(const [cx,lbl]of [[66,'ENG 1'],[150,'ENG 2']]){
ctx.strokeStyle='#183140';ctx.lineWidth=8;ctx.beginPath();ctx.arc(cx,84,31,Math.PI*0.78,Math.PI*2.22);ctx.stroke();
ctx.strokeStyle=flightState.afterburner?'#ff9d2e':'#56f7b0';
ctx.beginPath();ctx.arc(cx,84,31,Math.PI*0.78,Math.PI*(0.78+Math.min(1,flightState.throttle/1.15)*1.44));ctx.stroke();
txt(ctx,`${t.throttlePercent}`,cx,84,'#edf8ff',16);txt(ctx,lbl,cx,102,'#7ea8ba',10);
}
const sx=250;const sy=114;const hc=flightState.hull<40?'#ff5454':flightState.hull<75?'#f5b342':'#56f7b0';
ctx.strokeStyle=hc;ctx.fillStyle=flightState.hull<75?'rgba(245,179,66,0.16)':'rgba(86,247,176,0.14)';ctx.lineWidth=2;
ctx.beginPath();
[[0,-46],[10,-16],[46,12],[46,24],[12,16],[16,44],[-16,44],[-12,16],[-46,24],[-46,12],[-10,-16]].forEach(([dx,dy],i)=>i?ctx.lineTo(sx+dx,sy+dy):ctx.moveTo(sx+dx,sy+dy));
ctx.closePath();ctx.fill();ctx.stroke();txt(ctx,`HULL ${Math.round(flightState.hull)}%`,sx,sy+60,hc,13);
txt(ctx,`FUEL ${t.fuelPercent}% (${Math.round(flightState.fuelKg)} KG)`,20,148,'#9ac6d8',11,'left');
ctx.fillStyle='#112533';ctx.fillRect(20,158,168,16);
ctx.fillStyle=t.fuelPercent<22?'#ff5454':t.fuelPercent<40?'#f5b342':'#56f7b0';
ctx.fillRect(20,158,Math.max(3,(t.fuelPercent/100)*168),16);
ctx.fillStyle='#ff5454';ctx.fillRect(57,156,2,20);
[[flightState.gearDown?'GEAR LOCK':'GEAR UP',flightState.gearDown,'#56f7b0'],
[`FLAPS ${Math.round(flightState.flapAngleDeg)}°`,flightState.flapAngleDeg>2,'#64e3ff'],
[flightState.airbrake>0.2?'SPD BRK':'CLEAN',flightState.airbrake>0.2,'#f5b342'],
[flightState.afterburner?'A/B ENG':'MIL PWR',flightState.afterburner,'#ff9c33']].forEach(([lbl,on,col],i)=>{
const px=16+(i%2)*146;const py=204+Math.floor(i/2)*32;
ctx.fillStyle=on?'rgba(86,247,176,0.18)':'#0f1f2b';ctx.fillRect(px,py,138,25);
ctx.strokeStyle=on?col:'#274254';ctx.lineWidth=1.6;ctx.strokeRect(px,py,138,25);
txt(ctx,lbl,px+69,py+13,on?col:'#7999ab',12);
});
drawGlassSheen(ctx,w,h);tex.needsUpdate=true;
}
export function drawHsiNavRadarMfd(mfd, terrainMap, flightState, missionRuntime, activeWaypoint, elapsedSec) {
const {ctx,canvas,tex}=mfd;const w=canvas.width;const h=canvas.height;const cx=w*0.5;const cy=h*0.54;
ctx.fillStyle='#051219';ctx.fillRect(0,0,w,h);
ctx.strokeStyle='rgba(86,247,176,0.35)';ctx.lineWidth=1.5;ctx.strokeRect(6,6,w-12,h-12);
txt(ctx,'HSI / NAV RADAR · 2.5 NM',16,20,'#56f7b0',13,'left');
txt(ctx,`HDG ${String(Math.round(flightState.telemetry.headingDeg)).padStart(3, '0')}°`,w-16,20,'#ffd24c',13,'right');
drawTacticalRadarScope(ctx,terrainMap,cx,cy,88,2350,flightState,missionRuntime,activeWaypoint,elapsedSec);
ctx.save();ctx.translate(cx,cy);ctx.rotate((-flightState.telemetry.headingDeg*Math.PI)/180);
const cards={0:'N',90:'E',180:'S',270:'W'};
for(let d=0;d<360;d+=15){
const a=(d*Math.PI)/180-Math.PI/2;const maj=d%30===0;
seg(ctx,Math.cos(a)*90,Math.sin(a)*90,Math.cos(a)*(maj?98:94),Math.sin(a)*(maj?98:94),cards[d]?'#ffd24c':'#56f7b0',maj?2:1);
if(cards[d])txt(ctx,cards[d],Math.cos(a)*107,Math.sin(a)*107,'#ffd24c',11);
}
ctx.restore();drawGlassSheen(ctx,w,h);tex.needsUpdate=true;
}
function drawInstrumentLabel(ctx, text, x, y, color, fontSize, align = 'center') {
ctx.fillStyle=color;ctx.font=`bold ${fontSize}px monospace`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(text,x,y);
}
function drawGaugeStroke(ctx, x1, y1, x2, y2, color, lineWidth = 1.5) {
ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
}
function drawGaugeFrame(ctx, cx, cy, r) {
const rim=ctx.createLinearGradient(cx-r,cy-r,cx+r,cy+r);
rim.addColorStop(0,'#6a7c8f');rim.addColorStop(0.5,'#25303b');rim.addColorStop(1,'#10161d');
ctx.fillStyle=rim;ctx.beginPath();ctx.arc(cx,cy,r+5,0,Math.PI*2);ctx.fill();
ctx.fillStyle='#090f15';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
}
function drawGlassGlare(ctx, cx, cy, r) {
const g=ctx.createLinearGradient(cx-r*0.8,cy-r*0.8,cx+r*0.5,cy+r*0.5);
g.addColorStop(0,'rgba(220,242,255,0.18)');g.addColorStop(0.42,'rgba(220,242,255,0.03)');g.addColorStop(1,'rgba(0,0,0,0)');
ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r-1,0,Math.PI*2);ctx.fill();
}
function drawNeedle(ctx, cx, cy, a, len, tail, w, col = '#f4f8fb') {
ctx.save();ctx.translate(cx,cy);ctx.rotate(a);
ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(-tail,-w*0.55);ctx.lineTo(len,0);ctx.lineTo(-tail,w*0.55);ctx.closePath();ctx.fill();
ctx.fillStyle='#475666';ctx.beginPath();ctx.arc(0,0,6.2,0,Math.PI*2);ctx.fill();ctx.restore();
}
function drawAirspeedDial(ctx, cx, cy, r, kts) {
drawGaugeFrame(ctx,cx,cy,r);
const toA=(k)=>((Math.max(0,Math.min(320,k))/320)*Math.PI*1.72)-Math.PI*1.36;
for(const [a,b,col]of [[20,64,'#e84848'],[64,240,'#3fd68a'],[240,295,'#f2b138'],[295,320,'#ff4545']]){ctx.strokeStyle=col;ctx.lineWidth=6;ctx.beginPath();ctx.arc(cx,cy,r-8,toA(a),toA(b));ctx.stroke();}
for(let k=40;k<=320;k+=20){
const a=toA(k);const maj=k%40===0;
seg(ctx,cx+Math.cos(a)*(r-(maj?18:13)),cy+Math.sin(a)*(r-(maj?18:13)),cx+Math.cos(a)*(r-4),cy+Math.sin(a)*(r-4),'#e2eef5',maj?2:1.1);
if(maj)txt(ctx,`${k}`,cx+Math.cos(a)*(r-29),cy+Math.sin(a)*(r-29),'#dcebf5',11);
}
txt(ctx,'AIRSPEED',cx,cy-18,'#8db4c9',10);txt(ctx,`${Math.round(kts)} KT`,cx,cy+28,'#56f7b0',14);
drawNeedle(ctx,cx,cy,toA(kts),r-14,16,4.5);drawGlassGlare(ctx,cx,cy,r);
}
function drawAttitudeGyroDial(ctx, cx, cy, r, pitch, roll) {
drawGaugeFrame(ctx,cx,cy,r);
ctx.save();ctx.beginPath();ctx.arc(cx,cy,r-3,0,Math.PI*2);ctx.clip();ctx.translate(cx,cy);ctx.rotate((-roll*Math.PI)/180);
const sh=pitch*2.2;
const sky=ctx.createLinearGradient(0,-r,0,sh);sky.addColorStop(0,'#0e4c8c');sky.addColorStop(1,'#3ca0da');
ctx.fillStyle=sky;ctx.fillRect(-r-20,-r*2+sh,r*2+40,r*2);
const gnd=ctx.createLinearGradient(0,sh,0,r+sh);gnd.addColorStop(0,'#965629');gnd.addColorStop(1,'#4a2610');
ctx.fillStyle=gnd;ctx.fillRect(-r-20,sh,r*2+40,r*2);
seg(ctx,-r,sh,r,sh,'#fff',2.2);
for(const d of [-20,-10,10,20])seg(ctx,-22,sh-d*2.2,22,sh-d*2.2,'#fff',1.5);
ctx.restore();
ctx.strokeStyle='#ffae2b';ctx.lineWidth=3.5;
ctx.beginPath();ctx.moveTo(cx-28,cy);ctx.lineTo(cx-9,cy);ctx.lineTo(cx,cy+7);ctx.lineTo(cx+9,cy);ctx.lineTo(cx+28,cy);ctx.stroke();
ctx.fillStyle='#ffae2b';ctx.beginPath();ctx.moveTo(cx,cy-r+14);ctx.lineTo(cx-5,cy-r+5);ctx.lineTo(cx+5,cy-r+5);ctx.closePath();ctx.fill();
drawGlassGlare(ctx,cx,cy,r);
}
function drawAltimeterDial(ctx, cx, cy, r, alt) {
drawGaugeFrame(ctx,cx,cy,r);
for(let i=0;i<50;i++){
const a=(i/50)*Math.PI*2-Math.PI/2;const maj=i%5===0;
seg(ctx,cx+Math.cos(a)*(r-(maj?16:10)),cy+Math.sin(a)*(r-(maj?16:10)),cx+Math.cos(a)*(r-4),cy+Math.sin(a)*(r-4),'#e2eef5',maj?2.1:1);
if(maj)txt(ctx,`${i / 5}`,cx+Math.cos(a)*(r-27),cy+Math.sin(a)*(r-27),'#e5f1f8',13);
}
ctx.fillStyle='#18242e';ctx.fillRect(cx+16,cy-8,36,16);ctx.strokeStyle='#536c7e';ctx.lineWidth=1;ctx.strokeRect(cx+16,cy-8,36,16);
txt(ctx,'29.92',cx+34,cy+1,'#cfe2ee',9.5);txt(ctx,'ALT FT',cx,cy-22,'#8db4c9',10);txt(ctx,`${Math.round(alt)}`,cx,cy+28,'#56f7b0',13);
drawNeedle(ctx,cx,cy,((alt%10000)/10000)*Math.PI*2-Math.PI/2,r-30,10,7,'#cfdce6');
drawNeedle(ctx,cx,cy,((alt%1000)/1000)*Math.PI*2-Math.PI/2,r-12,16,4,'#fff');
drawGlassGlare(ctx,cx,cy,r);
}
function drawVerticalSpeedDial(ctx, cx, cy, r, vsi, gLoad) {
drawGaugeFrame(ctx,cx,cy,r);
for(let v=-20;v<=20;v+=5){
const a=Math.PI+(v/20)*Math.PI*0.82;const maj=v%10===0;
seg(ctx,cx+Math.cos(a)*(r-(maj?17:11)),cy+Math.sin(a)*(r-(maj?17:11)),cx+Math.cos(a)*(r-4),cy+Math.sin(a)*(r-4),Math.abs(v)>=15?'#f5b342':'#e2eef5',maj?2.1:1.1);
if(maj)txt(ctx,`${Math.abs(v / 10)}`,cx+Math.cos(a)*(r-28),cy+Math.sin(a)*(r-28),'#dcebf5',11);
}
txt(ctx,'VSI x1000',cx+8,cy-20,'#8db4c9',10);txt(ctx,`${gLoad.toFixed(1)}G`,cx+10,cy+22,'#56f7b0',12);
drawNeedle(ctx,cx,cy,Math.PI+(Math.max(-2000,Math.min(2000,vsi))/2000)*Math.PI*0.82,r-14,14,4.2,'#ffce52');
drawGlassGlare(ctx,cx,cy,r);
}
function drawGlassSheen(ctx, w, h) {
const g=ctx.createLinearGradient(0,0,w*0.7,h*0.7);
g.addColorStop(0,'rgba(200,238,255,0.08)');g.addColorStop(0.35,'rgba(200,238,255,0)');
ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
}
const txt=drawInstrumentLabel,seg=drawGaugeStroke;
