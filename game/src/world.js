// Kilat Courier — the world: road furniture, traffic, parcels, houses
// and hazards, plus spawning and collisions. The world scrolls toward
// the player; everything moves down at (player speed - own speed).
// updateWorld returns the events the run scored on this frame.
import { VIEW, ROAD, LANES, PLAYER_Y, COLORS, PARCEL_COLORS, PARCEL_HEX, POWERUP_KINDS, TUNING } from './config.js';
import { pick, range, rangeInt } from './random.js';

const CAR_COLORS = ['#e63946', '#4361ee', '#adb5bd', '#2a9d8f', '#f4a261'];
const BUS_COLOR = '#7b2fbe';

export function createWorld(rng) {
  const stars = [];
  for (let i = 0; i < 70; i++) {
    stars.push({ x: rng() * VIEW.w, y: rng() * 300, r: range(rng, 0.6, 1.8), p: rng() * 6.28 });
  }
  const buildingsLeft = [];
  let y = -40;
  while (y < VIEW.h + 200) {
    const h = rangeInt(rng, 90, 210);
    buildingsLeft.push({ x: 0, y, w: rangeInt(rng, 150, 225), h, seed: rng() * 1000, neon: rng() < 0.22 });
    y += h + rangeInt(rng, 8, 26);
  }
  const buildingsRight = [];
  y = -60;
  while (y < VIEW.h + 200) {
    const h = rangeInt(rng, 110, 230);
    buildingsRight.push({ x: 1010, y, w: rangeInt(rng, 200, 270), h, seed: rng() * 1000, neon: rng() < 0.18 });
    y += h + rangeInt(rng, 10, 30);
  }
  return {
    stars,
    buildingsLeft,
    buildingsRight,
    traffic: [],
    parcels: [],
    houses: [],
    hazards: [],
    powerups: [],
    particles: [],
    floats: [],
    spawn: { traffic: 0.8, parcel: 1.2, house: 3.0, hazard: 5.0, powerup: 6.0 },
    laneFreeAt: [0, 0, 0],
    scroll: 0,
  };
}

function addParticles(world, x, y, color, n, speed) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.283;
    const v = range(Math.random, speed * 0.3, speed);
    world.particles.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 40,
      life: range(Math.random, 0.35, 0.8),
      max: 0.8,
      color,
      size: range(Math.random, 2, 5),
    });
  }
}

function addFloat(world, x, y, text, color) {
  world.floats.push({ x, y, text, color, life: 1.1, max: 1.1 });
}

function spawnTraffic(world, state, rng) {
  const lane = rangeInt(rng, 0, 2);
  if (state.elapsed < world.laneFreeAt[lane]) return;
  // Never wall off all three lanes in one band: if the other two lanes
  // already hold a vehicle near the top, skip this spawn.
  const nearTop = world.traffic.filter((t) => t.y < 320);
  const blocked = new Set(nearTop.map((t) => t.lane));
  if (blocked.size === 3) return;
  if (blocked.has(lane)) return;
  const roll = rng();
  const level = state.level || 1;
  let kind = 'car';
  if (level >= 2 && roll < 0.12) kind = 'truck';
  else if (roll < 0.26) kind = 'taxi';
  else if (roll < 0.38) kind = 'bus';
  const w = kind === 'truck' ? 84 : kind === 'bus' ? 74 : 64;
  const h = kind === 'truck' ? 200 : kind === 'bus' ? 176 : 112;
  const color = kind === 'bus' ? BUS_COLOR
    : kind === 'taxi' ? '#ffd60a'
    : kind === 'truck' ? '#5a6b7d'
    : pick(rng, CAR_COLORS);
  world.traffic.push({
    lane,
    x: LANES[lane],
    y: -h - 20,
    w, h,
    kind,
    color,
    speed: kind === 'truck' ? range(rng, 95, 120) : range(rng, 120, 190), // its own forward speed
    wobble: rng() * 6.28,
    counted: false,
  });
  world.laneFreeAt[lane] = state.elapsed + range(rng, 0.9, 1.5);
}

function spawnParcel(world, rng) {
  const lane = rangeInt(rng, 0, 2);
  world.parcels.push({
    lane,
    x: LANES[lane] + range(rng, -30, 30),
    y: -40,
    color: pick(rng, PARCEL_COLORS),
    bob: rng() * 6.28,
  });
}

function spawnHouse(world, rng) {
  world.houses.push({
    x: 1042,
    y: -150,
    w: 226,
    h: rangeInt(rng, 120, 150),
    color: pick(rng, PARCEL_COLORS),
    checked: false,
    seed: rng() * 1000,
  });
}

function spawnHazard(world, rng) {
  const lane = rangeInt(rng, 0, 2);
  world.hazards.push({
    lane,
    x: LANES[lane],
    y: -40,
    kind: rng() < 0.55 ? 'pothole' : 'oil',
    r: 26,
  });
}

function spawnPowerup(world, rng) {
  const lane = rangeInt(rng, 0, 2);
  world.powerups.push({
    kind: pick(rng, POWERUP_KINDS),
    lane,
    x: LANES[lane] + range(rng, -30, 30),
    y: -40,
    w: 44,
    h: 44,
    bob: rng() * 6.28,
  });
}

function overlaps(ax, ay, aw, ah, bx, by, bw, bh, shrink) {
  return (
    Math.abs(ax - bx) < ((aw + bw) / 2) * shrink &&
    Math.abs(ay - by) < ((ah + bh) / 2) * shrink
  );
}

export function updateWorld(world, state, dt, rng) {
  const events = [];
  const p = state.player;
  const speed = state.speed;
  const slowmo = state.elapsed < p.slowmoUntil;
  const ws = slowmo ? speed * TUNING.slowmoFactor : speed; // world speed
  const levelScale = Math.pow(0.94, (state.level || 1) - 1);

  // Spawning.
  world.spawn.traffic -= dt;
  if (world.spawn.traffic <= 0) {
    spawnTraffic(world, state, rng);
    const interval = Math.max(
      TUNING.spawnTrafficMin,
      TUNING.spawnTrafficStart - state.elapsed * TUNING.spawnTrafficRamp,
    );
    world.spawn.traffic = interval * range(rng, 0.8, 1.25) * levelScale;
  }
  world.spawn.parcel -= dt;
  if (world.spawn.parcel <= 0) {
    spawnParcel(world, rng);
    world.spawn.parcel = TUNING.spawnParcelEvery * range(rng, 0.85, 1.2);
  }
  world.spawn.house -= dt;
  if (world.spawn.house <= 0) {
    spawnHouse(world, rng);
    world.spawn.house = TUNING.spawnHouseEvery * range(rng, 0.9, 1.15);
  }
  world.spawn.hazard -= dt;
  if (world.spawn.hazard <= 0) {
    spawnHazard(world, rng);
    world.spawn.hazard = TUNING.spawnHazardEvery * range(rng, 0.9, 1.3);
  }
  world.spawn.powerup -= dt;
  if (world.spawn.powerup <= 0) {
    spawnPowerup(world, rng);
    world.spawn.powerup = TUNING.powerupEvery * range(rng, 0.9, 1.2);
  }

  // Scroll the street furniture.
  world.scroll += speed * dt;
  const scrollSide = speed * dt * 0.85;
  for (const b of world.buildingsLeft) {
    b.y += scrollSide;
    if (b.y > VIEW.h + 40) {
      b.y -= VIEW.h + 320;
      b.h = rangeInt(rng, 90, 210);
      b.w = rangeInt(rng, 150, 225);
      b.seed = rng() * 1000;
      b.neon = rng() < 0.22;
    }
  }
  for (const b of world.buildingsRight) {
    b.y += scrollSide;
    if (b.y > VIEW.h + 40) {
      b.y -= VIEW.h + 320;
      b.h = rangeInt(rng, 110, 230);
      b.w = rangeInt(rng, 200, 270);
      b.seed = rng() * 1000;
      b.neon = rng() < 0.18;
    }
  }

  // Traffic drifts down at (player speed - own speed).
  for (const t of world.traffic) {
    t.y += Math.max(30, ws - t.speed) * dt;
    t.wobble += dt * 2;
    if (t.kind === 'taxi') t.x = LANES[t.lane] + Math.sin(t.wobble) * 22;
  }
  world.traffic = world.traffic.filter((t) => t.y < VIEW.h + 220);

  for (const pa of world.parcels) {
    pa.y += ws * dt;
    pa.bob += dt * 5;
    if (state.elapsed < p.magnetUntil) {
      const dx = p.x - pa.x;
      const dy = p.y - pa.y;
      const d = Math.hypot(dx, dy);
      if (d < TUNING.magnetRadius && d > 1) {
        pa.x += (dx / d) * TUNING.magnetPull * dt;
        pa.y += (dy / d) * TUNING.magnetPull * dt;
      }
    }
  }
  world.parcels = world.parcels.filter((pa) => pa.y < VIEW.h + 60);

  for (const h of world.houses) {
    h.y += ws * dt * 0.98;
  }
  world.houses = world.houses.filter((h) => {
    if (h.y > VIEW.h + 180) return false;
    if (!h.checked && h.y >= PLAYER_Y) {
      h.checked = true;
      const idx = p.carried.indexOf(h.color);
      if (idx >= 0) {
        p.carried.splice(idx, 1);
        events.push({ type: 'deliver', color: h.color, x: h.x + 40, y: PLAYER_Y - 40 });
      }
    }
    return true;
  });

  for (const hz of world.hazards) hz.y += ws * dt;
  world.hazards = world.hazards.filter((hz) => hz.y < VIEW.h + 60);

  // Collisions with the player.
  const now = state.elapsed;
  for (const t of world.traffic) {
    if (overlaps(p.x, p.y, 56, 96, t.x, t.y, t.w, t.h, 0.72)) {
      if (now >= p.invulnerableUntil) {
        if (p.shield) {
          p.shield = false;
          p.invulnerableUntil = now + 1.2;
          events.push({ type: 'shieldbreak', x: p.x, y: p.y - 30 });
        } else {
          events.push({ type: 'crash', x: p.x, y: p.y - 30 });
        }
        t.y = VIEW.h + 999; // the hit vehicle is gone
      }
      continue;
    }
    // A vehicle that just passed close by without a crash is a near-miss.
    if (!t.counted && t.y > PLAYER_Y + 70) {
      t.counted = true;
      if (Math.abs(t.x - p.x) < TUNING.nearMissBand) {
        events.push({ type: 'nearmiss', x: p.x, y: p.y - 60 });
      }
    }
  }
  world.traffic = world.traffic.filter((t) => t.y < VIEW.h + 220);

  for (const pa of world.parcels) {
    if (p.carried.length < TUNING.maxCarry && Math.abs(pa.x - p.x) < 56 && Math.abs(pa.y - p.y) < 56) {
      p.carried.push(pa.color);
      events.push({ type: 'pickup', color: pa.color, x: pa.x, y: pa.y - 20 });
      pa.y = VIEW.h + 999;
    }
  }
  world.parcels = world.parcels.filter((pa) => pa.y < VIEW.h + 60);

  for (const pu of world.powerups) {
    pu.y += ws * dt;
    pu.bob += dt * 5;
    if (Math.abs(pu.x - p.x) < 52 && Math.abs(pu.y - p.y) < 56) {
      events.push({ type: 'powerup', kind: pu.kind, x: pu.x, y: pu.y });
      pu.y = VIEW.h + 999;
    }
  }
  world.powerups = world.powerups.filter((pu) => pu.y < VIEW.h + 80);

  for (const hz of world.hazards) {
    if (Math.abs(hz.x - p.x) < 52 && Math.abs(hz.y - p.y) < 52) {
      events.push({ type: hz.kind, x: hz.x, y: hz.y });
      hz.y = VIEW.h + 999;
    }
  }
  world.hazards = world.hazards.filter((hz) => hz.y < VIEW.h + 60);

  // Particles and floating texts.
  for (const pt of world.particles) {
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vy += 160 * dt;
    pt.life -= dt;
  }
  world.particles = world.particles.filter((pt) => pt.life > 0);
  for (const f of world.floats) {
    f.y -= 42 * dt;
    f.life -= dt;
  }
  world.floats = world.floats.filter((f) => f.life > 0);

  return events;
}

export function burst(world, x, y, color, n, speed) {
  addParticles(world, x, y, color, n, speed);
}

export function floatText(world, x, y, text, color) {
  addFloat(world, x, y, text, color);
}

export { PARCEL_HEX };
