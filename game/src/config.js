// Aircraft performance limits, world constants, camera modes, and atmospheric weather palettes.
export const UNIT_CONVERSIONS = { METERS_TO_FEET: 3.28084, MPS_TO_KNOTS: 1.943844, KNOTS_TO_MPS: 0.514444, MPS_TO_FPM: 196.8504, RAD_TO_DEG: 180 / Math.PI, DEG_TO_RAD: Math.PI / 180 };
export const AIRCRAFT_SPECS = {
name:'KW-4 Kestrel',callsign:'KESTREL-04',massKg:4600,wingAreaM2:23.5,aspectRatio:7.4,oswaldEfficiency:0.82,
maxDryThrustN:58000,afterburnerThrustN:83000,maxFuelKg:920,baseFuelBurnKgPerSec:1.45,afterburnerBurnMultiplier:3.3,
gearHeightM:2.35,bellyHeightM:1.35,flapSteps:[0,15,30],
};
export const FLIGHT_LIMITS = {
cleanStallKnots:64,flapsStallReductionKnots:16,overspeedKnots:305,maxSafeG:7.4,
smoothLandingFpm:165,firmLandingFpm:340,hardLandingFpm:560,maxSafeLandingBankDeg:18,maxSafeLandingPitchUpDeg:22,maxSafeLandingPitchDownDeg:-8,
};
export const WORLD_CONFIG = { terrainSpanM: 6400, terrainSegments: 256, oceanSpanM: 32000, seaLevelY: 0, gravityMps2: 9.81, fixedStepSec: 1 / 60, maxFrameDeltaSec: 0.05 };
export const CAMERA_MODES = { CHASE: 'chase', COCKPIT: 'cockpit', TOUCHDOWN: 'touchdown' };
export const TIME_OF_DAY_PRESETS = {
goldenHour:{
label:'Golden Hour',sunDir:[0.66,0.28,-0.69],sunColor:0xffd292,sunIntensity:2.85,hemiSky:0x9bd2f8,hemiGround:0x526554,hemiIntensity:1.18,
zenithHex:'#123e78',horizonHex:'#f5b06d',glowHex:'#ffebba',cloudLightHex:'#fff0d4',cloudShadowHex:'#5c6680',
fogHex:'#dca982',fogDensity:0.000145,waterDeepHex:'#073c62',waterShallowHex:'#1ba3a0',cloudCoverage:0.48,rainIntensity:0,
},
alpineMidday:{
label:'Alpine Midday',sunDir:[0.46,0.76,-0.46],sunColor:0xfff8eb,sunIntensity:2.9,hemiSky:0xa2dcff,hemiGround:0x4b6e56,hemiIntensity:1.22,
zenithHex:'#0e58b0',horizonHex:'#b9e3fa',glowHex:'#ffffff',cloudLightHex:'#ffffff',cloudShadowHex:'#6c8aa8',
fogHex:'#acd4ec',fogDensity:0.00008,waterDeepHex:'#084c78',waterShallowHex:'#1ab8b4',cloudCoverage:0.44,rainIntensity:0,
},
monsoonStorm:{
label:'Monsoon Storm',sunDir:[-0.62,0.26,-0.74],sunColor:0xc2dff5,sunIntensity:2.25,hemiSky:0x7798ba,hemiGround:0x2c3f4a,hemiIntensity:1.48,
zenithHex:'#0c182c',horizonHex:'#4f6f8a',glowHex:'#e6c59c',cloudLightHex:'#b8cde0',cloudShadowHex:'#1e2c42',
fogHex:'#3f5a72',fogDensity:0.000215,waterDeepHex:'#092236',waterShallowHex:'#175468',cloudCoverage:0.72,rainIntensity:1.0,
},
crimsonSunset:{
label:'Crimson Sunset',sunDir:[0.74,0.17,0.65],sunColor:0xff935c,sunIntensity:2.65,hemiSky:0x8f84bf,hemiGround:0x453a42,hemiIntensity:1.12,
zenithHex:'#1a2759',horizonHex:'#f08158',glowHex:'#ffd791',cloudLightHex:'#ffcfad',cloudShadowHex:'#4f3a59',
fogHex:'#b87a6a',fogDensity:0.000175,waterDeepHex:'#0e2d4f',waterShallowHex:'#257082',cloudCoverage:0.52,rainIntensity:0,
},
};
