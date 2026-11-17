// Kilat Courier — every tuning number and colour in one place, so the
// rest of the game reads constants instead of magic numbers.
export const VIEW = { w: 1280, h: 720 };

export const ROAD = { left: 240, right: 1000 };
export const LANES = [367, 633, 900];
export const PLAYER_Y = 590;

export const COLORS = {
  skyTop: '#0a0d24',
  skyBottom: '#2b1a52',
  buildingFar: '#141433',
  buildingNear: '#1c1c38',
  windowLit: '#ffd166',
  windowDim: '#3d3d63',
  neonPink: '#ff5d8f',
  neonCyan: '#00e5ff',
  road: '#23232f',
  roadEdge: '#45455e',
  laneDash: '#e8e4d8',
  sidewalk: '#2f2f45',
  curb: '#55556e',
  bike: '#ffb703',
  bikeDark: '#b97a06',
  parcelAmber: '#ffb703',
  parcelTeal: '#2ec4b6',
  parcelPink: '#ff5d8f',
  heart: '#ff5d73',
  hudBg: 'rgba(8, 10, 28, 0.72)',
  text: '#f4f1e6',
  textDim: '#b9b4c7',
};

export const PARCEL_COLORS = ['amber', 'teal', 'pink'];
export const PARCEL_HEX = { amber: '#ffb703', teal: '#2ec4b6', pink: '#ff5d8f' };

export const TUNING = {
  baseSpeed: 340, // px per second at the start of a run
  maxSpeed: 640, // px per second at full ramp
  rampPerSecond: 7, // speed gained per second survived
  boostMult: 1.55, // speed multiplier while boosting
  boostDrain: 70, // meter per second while boosting
  boostRefill: 18, // meter per second while not boosting
  boostOnDeliver: 35, // meter refunded per delivery
  accelBonus: 70, // extra speed while holding Up
  brakeCut: 150, // speed cut while holding Down
  laneChangeTime: 0.16, // seconds to slide between lanes
  hearts: 3,
  maxCarry: 3,
  invulnerableTime: 1.6, // seconds of blinking after a crash
  crashSlowTime: 1.0, // seconds at half speed after a crash
  spawnTrafficStart: 1.15, // seconds between traffic spawns, start
  spawnTrafficMin: 0.55, // seconds between traffic spawns, floor
  spawnTrafficRamp: 0.006, // spawn interval lost per second survived
  spawnParcelEvery: 2.4, // seconds between parcel spawns
  spawnHouseEvery: 5.5, // seconds between house spawns
  spawnHazardEvery: 7.0, // seconds between pothole/oil spawns
  deliveryScore: 100, // base points per delivery
  pickupScore: 10, // points per parcel grabbed
  distanceScoreEvery: 30, // px travelled per distance point
  comboCap: 5, // highest combo multiplier
};
