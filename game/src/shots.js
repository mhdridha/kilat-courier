// Kilat Courier — staged states for screenshots (?shot=start|play|end).
// A shot freezes the game in one deterministic frame, so the three
// screenshots show the title, a mid-run moment and the game-over screen
// exactly as a player sees them, with no interaction needed.
import { LANES } from './config.js';
import { mulberry32 } from './random.js';

function car(lane, y, color, kind = 'car') {
  return {
    lane,
    x: LANES[lane],
    y,
    w: kind === 'bus' ? 74 : 64,
    h: kind === 'bus' ? 176 : 112,
    kind,
    color,
    speed: 150,
    wobble: 0,
  };
}

export function stageShot(g, which, seed) {
  const { state, world } = g;
  const rng = mulberry32(seed * 7919 + 13);
  void rng;
  world.traffic = [];
  world.parcels = [];
  world.houses = [];
  world.hazards = [];
  world.particles = [];
  world.floats = [];
  state.now = 1.2;

  if (which === 'start') {
    state.mode = 'title';
    state.best = 1250;
    state.player.y = 665; // park the bike below the START button
    world.traffic = [car(0, 90, '#e63946'), car(2, 330, '#4361ee'), car(1, -80, '#2a9d8f')];
    world.parcels = [{ lane: 1, x: LANES[1], y: 300, color: 'amber', bob: 0.5 }];
    return;
  }

  if (which === 'play') {
    state.mode = 'playing';
    state.elapsed = 42;
    state.distance = 16800;
    state.score = 1280;
    state.deliveries = 6;
    state.best = 2430;
    state.speed = 520;
    state.boosting = true;
    const p = state.player;
    p.streak = 2;
    p.carried = ['amber', 'teal'];
    p.hearts = 3;
    p.boost = 62;
    p.lane = 1;
    p.x = LANES[1];
    p.fromX = LANES[1];
    p.slide = 1;
    p.lean = -0.4;
    world.traffic = [
      car(0, 120, '#e63946'),
      car(2, 60, '#f4a261', 'bus'),
      car(1, -140, '#4361ee'),
      car(0, -300, '#2a9d8f'),
      car(2, -260, '#adb5bd'),
    ];
    world.parcels = [
      { lane: 2, x: LANES[2] + 12, y: 430, color: 'teal', bob: 1.1 },
      { lane: 0, x: LANES[0] - 8, y: 250, color: 'pink', bob: 2.4 },
    ];
    world.houses = [{ x: 1042, y: 280, w: 226, h: 140, color: 'teal', checked: false, seed: 5 }];
    world.hazards = [{ lane: 1, x: LANES[1], y: 500, kind: 'pothole', r: 26 }];
    world.particles = [
      { x: 600, y: 640, vx: -30, vy: 90, life: 0.6, max: 0.8, color: '#ff9f1c', size: 4 },
      { x: 640, y: 650, vx: 20, vy: 110, life: 0.5, max: 0.8, color: '#ffb703', size: 3 },
      { x: 620, y: 630, vx: 0, vy: 70, life: 0.7, max: 0.8, color: '#ff5d8f', size: 3 },
    ];
    world.floats = [{ x: 900, y: 240, text: '+200', color: '#ffb703', life: 0.9, max: 1.1 }];
    return;
  }

  // 'end' (and anything else): the game-over screen.
  state.mode = 'over';
  state.score = 2430;
  state.deliveries = 11;
  state.distance = 3800;
  state.best = 2430;
  state.newBest = true;
  state.player.hearts = 0;
  world.traffic = [car(0, 200, '#e63946'), car(2, 420, '#4361ee')];
}
