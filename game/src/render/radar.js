// Shared heading-up archipelago tactical radar renderer used by both the 3D cockpit MFD and Chase HUD.
import { AIRFIELD_RUNWAYS } from '../world/airfields.js';
import { sampleArchipelagoHeight } from '../world/terrain.js';
export function createArchipelagoRadarMap(size = 200) {
const canvas=document.createElement('canvas');
canvas.width=size;
canvas.height=size;
const ctx=canvas.getContext('2d');
ctx.fillStyle='#041217';
ctx.fillRect(0,0,size,size);
const worldSpan=5400;
for(let py=0;py<size;py+=3){
for(let px=0;px<size;px+=3){
const wx=((px/size)-0.5)*worldSpan;
const wz=((py/size)-0.5)*worldSpan;
const h=sampleArchipelagoHeight(wx,wz);
if(h>200)ctx.fillStyle='rgba(104, 228, 184, 0.36)';
else if(h>55)ctx.fillStyle='rgba(48, 158, 128, 0.30)';
else if(h>1)ctx.fillStyle='rgba(26, 102, 92, 0.25)';
else continue;
ctx.fillRect(px,py,3,3);
}
}
return canvas;
}
export function drawTacticalRadarScope(ctx, radarMap, cx, cy, r, rangeM, flightState, missionRuntime, activeWaypoint, elapsedSec) {
ctx.save();
ctx.beginPath();
ctx.arc(cx,cy,r,0,Math.PI*2);
ctx.clip();
ctx.fillStyle='rgba(5, 17, 25, 0.90)';
ctx.fillRect(cx-r,cy-r,r*2,r*2);
const scale=r/rangeM;
const hdgRad=(flightState.telemetry.headingDeg*Math.PI)/180;
ctx.save();
ctx.translate(cx,cy);
ctx.rotate(-hdgRad);
const mapScale=(5400*scale)/radarMap.width;
ctx.drawImage(
radarMap,
(-flightState.position.x*scale)-(radarMap.width*mapScale)*0.5,
(-flightState.position.z*scale)-(radarMap.height*mapScale)*0.5,
radarMap.width*mapScale,
radarMap.height*mapScale,
);
for(const rwy of AIRFIELD_RUNWAYS){
const rx=(rwy.centerX-flightState.position.x)*scale;
const rz=(rwy.centerZ-flightState.position.z)*scale;
ctx.fillStyle=rwy.hasArrestor?'#7be3ff':'#ffffff';
ctx.fillRect(rx-(rwy.lengthM*scale)*0.5,rz-2.2,Math.max(9,rwy.lengthM*scale),4.4);
}
for(let i=0;i<missionRuntime.gates.length;i++){
const g=missionRuntime.gates[i];
if(g.cleared)continue;
const gx=(g.x-flightState.position.x)*scale;
const gz=(g.z-flightState.position.z)*scale;
const cur=i===missionRuntime.gateIndex;
ctx.strokeStyle=cur?'#ffd24c':'#45d9e8';
ctx.lineWidth=cur?2.4:1.3;
ctx.beginPath();
ctx.arc(gx,gz,cur?6:3.5,0,Math.PI*2);
ctx.stroke();
}
for(const d of missionRuntime.drops){
if(d.delivered)continue;
ctx.fillStyle='#ff7b29';
ctx.beginPath();
ctx.arc((d.x-flightState.position.x)*scale,(d.z-flightState.position.z)*scale,5,0,Math.PI*2);
ctx.fill();
}
if(activeWaypoint){
ctx.strokeStyle='rgba(255, 206, 76, 0.72)';
ctx.lineWidth=1.6;
ctx.setLineDash([4,4]);
ctx.beginPath();
ctx.moveTo(0,0);
ctx.lineTo((activeWaypoint.x-flightState.position.x)*scale,(activeWaypoint.z-flightState.position.z)*scale);
ctx.stroke();
ctx.setLineDash([]);
}
ctx.restore();
ctx.strokeStyle='rgba(86, 247, 176, 0.24)';
ctx.lineWidth=1;
ctx.beginPath();
ctx.arc(cx,cy,r*0.5,0,Math.PI*2);
ctx.stroke();
const sweep=(elapsedSec*2.1)%(Math.PI*2);
ctx.strokeStyle='rgba(86, 247, 176, 0.62)';
ctx.lineWidth=1.8;
ctx.beginPath();
ctx.moveTo(cx,cy);
ctx.lineTo(cx+Math.cos(sweep)*r,cy+Math.sin(sweep)*r);
ctx.stroke();
ctx.fillStyle='#56f7b0';
ctx.beginPath();
ctx.moveTo(cx,cy-7.5);
ctx.lineTo(cx+5.5,cy+5.5);
ctx.lineTo(cx-5.5,cy+5.5);
ctx.closePath();
ctx.fill();
ctx.restore();
ctx.strokeStyle='rgba(86, 247, 176, 0.72)';
ctx.lineWidth=2;
ctx.beginPath();
ctx.arc(cx,cy,r,0,Math.PI*2);
ctx.stroke();
}
