// Kilat Courier — the courier bike: lane, slide, boost meter, hearts,
// carried parcels and the timers that follow a crash. Pure state plus
// small transitions; the world and the renderer read it, never mutate it
// except through these helpers.
import { LANES, PLAYER_Y, TUNING } from './config.js';

export function createPlayer() {
  return {
    lane: 1, // middle lane to start
    x: LANES[1],
    fromX: LANES[1],
    slide: 1, // 0..1 progress of the current lane slide
    lean: 0, // -1..1 visual lean while sliding
    y: PLAYER_Y,
    hearts: TUNING.hearts,
    boost: 100, // meter 0..100
    boosting: false,
    invulnerableUntil: 0,
    slowUntil: 0, // half speed after a crash
    oilUntil: 0, // steering locked briefly after an oil slick
    carried: [], // parcel colours, at most TUNING.maxCarry
    streak: 0, // consecutive deliveries since the last crash
    shield: false, // one free crash, from a shield power-up
    magnetUntil: 0, // parcels are pulled in while now < this
    slowmoUntil: 0, // the world runs slow while now < this
  };
}

export function moveLane(player, dir, now) {
  if (now < player.oilUntil) return false;
  const next = player.lane + dir;
  if (next < 0 || next > 2) return false;
  player.fromX = player.x;
  player.lane = next;
  player.slide = 0;
  return true;
}

export function updatePlayer(player, dt, now) {
  // Slide toward the target lane, easing out.
  if (player.slide < 1) {
    player.slide = Math.min(1, player.slide + dt / TUNING.laneChangeTime);
    const t = 1 - Math.pow(1 - player.slide, 3);
    const target = LANES[player.lane];
    player.x = player.fromX + (target - player.fromX) * t;
    player.lean = Math.sign(target - player.fromX) * (1 - player.slide) * 0.9;
  } else {
    player.lean = 0;
  }
  // Boost meter refills when not boosting.
  if (!player.boosting) {
    player.boost = Math.min(100, player.boost + TUNING.boostRefill * dt);
  }
}

export function comboOf(player) {
  return 1 + Math.min(player.streak, TUNING.comboCap - 1);
}

export function grantPowerup(player, kind, now) {
  if (kind === 'shield') player.shield = true;
  else if (kind === 'magnet') player.magnetUntil = now + TUNING.magnetTime;
  else if (kind === 'slowmo') player.slowmoUntil = now + TUNING.slowmoTime;
}

export function hasMagnet(player, now) {
  return now < player.magnetUntil;
}

export function isSlowmo(player, now) {
  return now < player.slowmoUntil;
}

export function isInvulnerable(player, now) {
  return now < player.invulnerableUntil;
}
