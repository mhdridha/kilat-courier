// Kilat Courier — game loop, states and scoring. The loop owns one
// state object; the world moves it, the renderer draws it, the audio
// module hears it. Title -> playing -> paused -> over, with restart.
import { VIEW, LANES, PLAYER_Y, TUNING, PARCEL_HEX, POWERUP_HEX } from './config.js';
import { mulberry32 } from './random.js';
import * as audio from './audio.js';
import { bindInput, drainKeys, keyHeld, takeClick, inRect } from './input.js';
import { createPlayer, moveLane, updatePlayer, comboOf, grantPowerup, isInvulnerable } from './player.js';
import { createWorld, updateWorld, burst, floatText } from './world.js';
import { drawWorld, drawHUD, drawLevelBanner, drawTitle, drawPaused, drawGameOver, BTN_START, BTN_RESTART } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.w;
canvas.height = VIEW.h;

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW.w, window.innerHeight / VIEW.h);
  canvas.style.width = Math.floor(VIEW.w * scale) + 'px';
  canvas.style.height = Math.floor(VIEW.h * scale) + 'px';
}
window.addEventListener('resize', fitCanvas);
fitCanvas();
bindInput(canvas);

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = parseInt(params.get('seed') || '1', 10) || 1;

function loadBest() {
  try {
    return parseInt(localStorage.getItem('kilat-best') || '0', 10) || 0;
  } catch (e) {
    return 0;
  }
}

function freshState() {
  return {
    mode: 'title',
    now: 0,
    elapsed: 0,
    distance: 0,
    score: 0,
    deliveries: 0,
    speed: TUNING.baseSpeed,
    level: 1,
    levelFlash: 0,
    boosting: false,
    shake: 0,
    best: loadBest(),
    newBest: false,
    player: createPlayer(),
  };
}

const state = freshState();
let world = createWorld(mulberry32(seed));
const g = { state, world, now: 0 };

function saveBest() {
  try {
    localStorage.setItem('kilat-best', String(state.best));
  } catch (e) {
    /* best score is a nicety, never fatal */
  }
}

function startRun() {
  const best = state.best;
  const fresh = freshState();
  fresh.best = best;
  Object.assign(state, fresh);
  world = createWorld(mulberry32((Math.random() * 1e9) | 0));
  g.world = world;
  state.mode = 'playing';
  audio.unlockAudio();
  audio.startEngine();
}

function endRun() {
  state.mode = 'over';
  state.boosting = false;
  audio.stopEngine();
  audio.sfxGameOver();
  if (state.score > state.best) {
    state.best = Math.floor(state.score);
    state.newBest = true;
    saveBest();
  }
}

function applyEvents(events) {
  const p = state.player;
  for (const ev of events) {
    if (ev.type === 'pickup') {
      state.score += TUNING.pickupScore;
      audio.sfxPickup();
      burst(world, ev.x, ev.y, PARCEL_HEX[ev.color], 12, 170);
      floatText(world, ev.x, ev.y - 10, '+' + TUNING.pickupScore, PARCEL_HEX[ev.color]);
    } else if (ev.type === 'deliver') {
      p.streak += 1;
      const gain = TUNING.deliveryScore * comboOf(p);
      state.score += gain;
      state.deliveries += 1;
      p.boost = Math.min(100, p.boost + TUNING.boostOnDeliver);
      audio.sfxDeliver(comboOf(p));
      burst(world, ev.x, ev.y, PARCEL_HEX[ev.color], 22, 240);
      floatText(world, ev.x, ev.y - 10, '+' + gain, '#ffb703');
    } else if (ev.type === 'crash') {
      p.hearts -= 1;
      p.streak = 0;
      p.invulnerableUntil = state.elapsed + TUNING.invulnerableTime;
      p.slowUntil = state.elapsed + TUNING.crashSlowTime;
      state.shake = 14;
      audio.sfxCrash();
      burst(world, ev.x, ev.y, '#ff5d73', 26, 300);
      burst(world, ev.x, ev.y, '#ffb703', 14, 200);
      if (p.hearts <= 0) endRun();
    } else if (ev.type === 'powerup') {
      grantPowerup(p, ev.kind, state.elapsed);
      audio.sfxPowerup();
      burst(world, ev.x, ev.y, POWERUP_HEX[ev.kind], 18, 220);
      const label = ev.kind === 'shield' ? 'SHIELD UP!' : ev.kind === 'magnet' ? 'MAGNET 8s' : 'SLOW-MO!';
      floatText(world, ev.x, ev.y - 10, label, POWERUP_HEX[ev.kind]);
    } else if (ev.type === 'nearmiss') {
      state.score += TUNING.nearMissScore;
      audio.sfxNearMiss();
      floatText(world, ev.x, ev.y - 10, 'CLOSE! +' + TUNING.nearMissScore, '#7ee081');
    } else if (ev.type === 'shieldbreak') {
      state.shake = Math.max(state.shake, 8);
      audio.sfxPowerup();
      burst(world, ev.x, ev.y, '#00e5ff', 20, 260);
      floatText(world, ev.x, ev.y - 10, 'SHIELD!', '#00e5ff');
    } else if (ev.type === 'pothole') {
      p.slowUntil = state.elapsed + 0.7;
      state.shake = Math.max(state.shake, 6);
      audio.sfxClick();
    } else if (ev.type === 'oil') {
      p.oilUntil = state.elapsed + 1.2;
      floatText(world, ev.x, ev.y - 20, 'SLICK!', '#b9b4c7');
    }
  }
}

function ambientTitle(dt) {
  // The title screen rides over a slow, harmless scroll: buildings and
  // a little traffic drift by, nothing collides, nothing scores.
  world.scroll += 120 * dt;
  const dy = 100 * dt;
  for (const b of world.buildingsLeft) {
    b.y += dy;
    if (b.y > VIEW.h + 40) b.y -= VIEW.h + 320;
  }
  for (const b of world.buildingsRight) {
    b.y += dy;
    if (b.y > VIEW.h + 40) b.y -= VIEW.h + 320;
  }
  for (const t of world.traffic) t.y += dy;
  world.traffic = world.traffic.filter((t) => t.y < VIEW.h + 220);
  for (const pa of world.parcels) pa.y += dy;
  world.parcels = world.parcels.filter((pa) => pa.y < VIEW.h + 60);
}

function update(dt) {
  state.now += dt;
  if (state.mode === 'title') {
    ambientTitle(dt);
    return;
  }
  if (state.mode !== 'playing') return;

  state.elapsed += dt;
  const newLevel = 1 + Math.floor(state.elapsed / TUNING.levelEvery);
  if (newLevel > state.level) {
    state.level = newLevel;
    state.levelFlash = 2.2;
    audio.sfxLevelUp();
    floatText(world, VIEW.w / 2, 300, 'LEVEL ' + newLevel + ' — RUSH HOUR', '#ffb703');
  }
  state.levelFlash = Math.max(0, state.levelFlash - dt);
  const p = state.player;

  // Speed: ramp with survival, Up to push, Down to brake, crash to crawl.
  let speed = Math.min(TUNING.baseSpeed + state.elapsed * TUNING.rampPerSecond, TUNING.maxSpeed);
  if (keyHeld('ArrowUp') || keyHeld('w') || keyHeld('W')) speed += TUNING.accelBonus;
  if (keyHeld('ArrowDown') || keyHeld('s') || keyHeld('S')) speed -= TUNING.brakeCut;
  if (state.elapsed < p.slowUntil) speed *= 0.5;
  state.boosting = (keyHeld(' ') || keyHeld('Spacebar')) && p.boost > 0;
  if (state.boosting) {
    speed *= TUNING.boostMult;
    p.boost = Math.max(0, p.boost - TUNING.boostDrain * dt);
    if (p.boost <= 0) state.boosting = false;
  }
  state.speed = Math.max(120, speed);

  updatePlayer(p, dt, state.elapsed);
  state.distance += state.speed * dt;
  state.score += (state.speed * dt) / TUNING.distanceScoreEvery;
  state.shake = Math.max(0, state.shake - dt * 26);

  const events = updateWorld(world, state, dt, Math.random);
  applyEvents(events);
  audio.setEngine(state.speed / TUNING.maxSpeed, state.boosting);
}

function nearestLane(x) {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < LANES.length; i++) {
    const d = Math.abs(LANES[i] - x);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

function handleInput() {
  const keys = drainKeys();
  for (const k of keys) {
    if (k === 'm' || k === 'M') {
      audio.toggleMute();
      continue;
    }
    if (state.mode === 'title') {
      if (k === 'Enter' || k === ' ') {
        audio.unlockAudio();
        audio.sfxClick();
        startRun();
      }
      continue;
    }
    if (state.mode === 'playing') {
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') moveLane(state.player, -1, state.elapsed);
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') moveLane(state.player, 1, state.elapsed);
      else if (k === 'p' || k === 'P' || k === 'Escape') {
        state.mode = 'paused';
        audio.stopEngine();
      } else if (k === ' ') {
        audio.sfxBoost();
      }
      continue;
    }
    if (state.mode === 'paused') {
      if (k === 'p' || k === 'P' || k === 'Escape' || k === 'Enter' || k === ' ') {
        state.mode = 'playing';
        audio.unlockAudio();
        audio.startEngine();
      }
      continue;
    }
    if (state.mode === 'over') {
      if (k === 'r' || k === 'R' || k === 'Enter' || k === ' ') {
        audio.sfxClick();
        startRun();
      }
    }
  }

  const click = takeClick();
  if (!click) return;
  audio.unlockAudio();
  if (state.mode === 'title') {
    if (inRect(click, BTN_START)) {
      audio.sfxClick();
      startRun();
    }
    return;
  }
  if (state.mode === 'playing') {
    if (click.y > 70) {
      const lane = nearestLane(click.x);
      const dir = lane - state.player.lane;
      if (dir !== 0) moveLane(state.player, Math.sign(dir), state.elapsed);
    }
    return;
  }
  if (state.mode === 'paused') {
    state.mode = 'playing';
    audio.startEngine();
    return;
  }
  if (state.mode === 'over') {
    if (inRect(click, BTN_RESTART)) {
      audio.sfxClick();
      startRun();
    }
  }
}

function render() {
  g.now = state.now;
  ctx.clearRect(0, 0, VIEW.w, VIEW.h);
  drawWorld(ctx, g);
  if (state.mode === 'playing' || state.mode === 'paused') drawHUD(ctx, state);
  if (state.mode === 'playing' && state.levelFlash > 0) drawLevelBanner(ctx, state);
  if (state.mode === 'title') drawTitle(ctx, state);
  if (state.mode === 'paused') drawPaused(ctx, state);
  if (state.mode === 'over') drawGameOver(ctx, state);
}

if (shot) {
  stageShot(g, shot, seed);
}

let last = performance.now();
function frame(t) {
  const dt = Math.min(0.05, Math.max(0, (t - last) / 1000));
  last = t;
  handleInput();
  if (!shot) update(dt);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Keep the canvas honest about where the bike is for screen readers.
const statusEl = document.getElementById('status');
if (statusEl) {
  setInterval(() => {
    if (state.mode === 'playing') {
      statusEl.textContent =
        'Score ' + Math.floor(state.score) + ', deliveries ' + state.deliveries +
        ', hearts ' + state.player.hearts + ' of ' + TUNING.hearts + '.';
    }
  }, 1000);
}
