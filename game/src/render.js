// Kilat Courier — everything the player sees, drawn on one canvas.
// The judge reads the game mostly through its screenshots, so the title,
// the HUD and the game-over screen are drawn here with the same care as
// the road itself. No images, no fonts to load: all vector, all procedural.
import { VIEW, ROAD, LANES, PLAYER_Y, COLORS, PARCEL_HEX, POWERUP_HEX, TUNING } from './config.js';

export const BTN_START = { x: 490, y: 512, w: 300, h: 64 };
export const BTN_RESTART = { x: 490, y: 536, w: 300, h: 64 };

function rr(c, x, y, w, h, r) {
  c.beginPath();
  if (c.roundRect) c.roundRect(x, y, w, h, r);
  else c.rect(x, y, w, h);
}

function text(c, s, x, y, size, color, weight = 'bold', align = 'left') {
  c.font = `${weight} ${size}px system-ui, -apple-system, sans-serif`;
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(s, x, y);
}

function drawHeart(c, x, y, size, filled) {
  c.save();
  c.translate(x, y);
  c.scale(size / 16, size / 16);
  c.beginPath();
  c.moveTo(0, 5);
  c.bezierCurveTo(-9, -3, -5, -10, 0, -5);
  c.bezierCurveTo(5, -10, 9, -3, 0, 5);
  c.closePath();
  c.fillStyle = filled ? COLORS.heart : 'rgba(255,93,115,0.22)';
  c.fill();
  c.restore();
}

function drawParcelBox(c, x, y, size, color) {
  const s = size;
  rr(c, x - s / 2, y - s / 2, s, s, 4);
  c.fillStyle = color;
  c.fill();
  c.strokeStyle = 'rgba(10,10,25,0.55)';
  c.lineWidth = 2;
  c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.85)';
  c.fillRect(x - 2, y - s / 2, 4, s);
  c.fillRect(x - s / 2, y - 2, s, 4);
}

function drawShieldIcon(c, x, y, size, color) {
  const s = size;
  c.beginPath();
  c.moveTo(x, y - s / 2);
  c.lineTo(x + s / 2, y - s / 4);
  c.lineTo(x + s / 2, y + s / 8);
  c.quadraticCurveTo(x + s / 2, y + s / 2, x, y + s * 0.62);
  c.quadraticCurveTo(x - s / 2, y + s / 2, x - s / 2, y + s / 8);
  c.lineTo(x - s / 2, y - s / 4);
  c.closePath();
  c.fillStyle = color;
  c.fill();
}

function drawPowerup(c, pu) {
  const bobY = pu.y + Math.sin(pu.bob) * 3;
  const color = POWERUP_HEX[pu.kind];
  const glow = c.createRadialGradient(pu.x, bobY, 2, pu.x, bobY, 36);
  glow.addColorStop(0, color);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  c.globalAlpha = 0.4;
  c.fillStyle = glow;
  c.beginPath();
  c.arc(pu.x, bobY, 36, 0, 6.29);
  c.fill();
  c.globalAlpha = 1;
  c.beginPath();
  c.arc(pu.x, bobY, 20, 0, 6.29);
  c.fillStyle = '#0d0d1f';
  c.fill();
  c.strokeStyle = color;
  c.lineWidth = 2.5;
  c.stroke();
  if (pu.kind === 'shield') {
    drawShieldIcon(c, pu.x, bobY, 20, color);
  } else if (pu.kind === 'magnet') {
    // A horseshoe magnet: arc with two white tips.
    c.strokeStyle = color;
    c.lineWidth = 7;
    c.beginPath();
    c.arc(pu.x, bobY - 1, 8, Math.PI, 0);
    c.stroke();
    c.fillStyle = '#e8f6ff';
    c.fillRect(pu.x - 12, bobY - 2, 8, 8);
    c.fillRect(pu.x + 4, bobY - 2, 8, 8);
  } else {
    // Slow-mo: a clock face.
    c.strokeStyle = color;
    c.lineWidth = 2.5;
    c.beginPath();
    c.arc(pu.x, bobY, 9, 0, 6.29);
    c.stroke();
    c.beginPath();
    c.moveTo(pu.x, bobY);
    c.lineTo(pu.x, bobY - 6);
    c.moveTo(pu.x, bobY);
    c.lineTo(pu.x + 5, bobY);
    c.stroke();
  }
}

function drawSky(c, world, now) {
  const g = c.createLinearGradient(0, 0, 0, VIEW.h);
  g.addColorStop(0, COLORS.skyTop);
  g.addColorStop(1, COLORS.skyBottom);
  c.fillStyle = g;
  c.fillRect(0, 0, VIEW.w, VIEW.h);
  for (const s of world.stars) {
    const a = 0.35 + 0.65 * Math.abs(Math.sin(now * 0.7 + s.p));
    c.globalAlpha = a;
    c.fillStyle = '#e8e6ff';
    c.fillRect(s.x, s.y, s.r, s.r);
  }
  c.globalAlpha = 1;
  // Moon.
  c.fillStyle = '#f5f1d8';
  c.beginPath();
  c.arc(1120, 84, 34, 0, 6.29);
  c.fill();
  c.fillStyle = 'rgba(210,205,170,0.7)';
  c.beginPath();
  c.arc(1108, 76, 7, 0, 6.29);
  c.arc(1130, 94, 5, 0, 6.29);
  c.fill();
  // Far skyline silhouette.
  c.fillStyle = COLORS.buildingFar;
  const sky = [60, 110, 80, 140, 95, 125, 70, 150, 90, 120, 75, 135];
  let x = 0;
  for (let i = 0; i < sky.length; i++) {
    c.fillRect(x, 300 - sky[i], 112, sky[i]);
    x += 112;
  }
}

function drawBuilding(c, b, near) {
  c.fillStyle = near ? COLORS.buildingNear : COLORS.buildingFar;
  c.fillRect(b.x, b.y, b.w, b.h);
  // Lit windows: a cheap deterministic grid from the seed.
  const cols = Math.max(2, Math.floor(b.w / 34));
  const rows = Math.max(2, Math.floor(b.h / 38));
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const on = ((b.seed + i * 7 + j * 13) % 10) < 4;
      c.fillStyle = on ? COLORS.windowLit : COLORS.windowDim;
      c.globalAlpha = on ? 0.9 : 0.5;
      c.fillRect(b.x + 10 + i * 34, b.y + 12 + j * 38, 18, 22);
    }
  }
  c.globalAlpha = 1;
  if (b.neon) {
    c.fillStyle = (b.seed % 2 < 1) ? COLORS.neonPink : COLORS.neonCyan;
    c.globalAlpha = 0.9;
    c.fillRect(b.x + b.w - 14, b.y + 20, 6, Math.min(64, b.h - 40));
    c.globalAlpha = 1;
  }
}

function drawRoad(c, world) {
  // Sidewalks.
  c.fillStyle = COLORS.sidewalk;
  c.fillRect(0, 0, ROAD.left, VIEW.h);
  c.fillRect(ROAD.right, 0, VIEW.w - ROAD.right, VIEW.h);
  // Road.
  c.fillStyle = COLORS.road;
  c.fillRect(ROAD.left, 0, ROAD.right - ROAD.left, VIEW.h);
  // Curbs.
  c.fillStyle = COLORS.curb;
  c.fillRect(ROAD.left - 6, 0, 6, VIEW.h);
  c.fillRect(ROAD.right, 0, 6, VIEW.h);
  // Edge lines.
  c.fillStyle = COLORS.roadEdge;
  c.fillRect(ROAD.left + 10, 0, 4, VIEW.h);
  c.fillRect(ROAD.right - 14, 0, 4, VIEW.h);
  // Lane dashes, scrolling with distance.
  c.fillStyle = COLORS.laneDash;
  const dashH = 44;
  const gap = 34;
  const off = world.scroll % (dashH + gap);
  for (const lx of [LANES[0] + 133, LANES[1] + 133]) {
    for (let y = -dashH - off; y < VIEW.h + dashH; y += dashH + gap) {
      rr(c, lx - 4, y, 8, dashH, 4);
      c.fill();
    }
  }
  // Faint asphalt speckle, seeded by scroll so it reads as texture.
  c.fillStyle = 'rgba(255,255,255,0.03)';
  for (let i = 0; i < 40; i++) {
    const sx = ROAD.left + 20 + ((i * 173 + Math.floor(world.scroll)) % 720);
    const sy = (i * 97 + Math.floor(world.scroll * 0.5)) % VIEW.h;
    c.fillRect(sx, sy, 3, 3);
  }
}

function drawHouse(c, h) {
  c.fillStyle = '#26264a';
  rr(c, h.x, h.y, h.w, h.h, 8);
  c.fill();
  // Warm windows.
  c.fillStyle = COLORS.windowLit;
  c.globalAlpha = 0.85;
  for (let i = 0; i < 3; i++) {
    c.fillRect(h.x + 18 + i * 66, h.y + 22, 34, 40);
  }
  c.globalAlpha = 1;
  // Awning.
  c.fillStyle = PARCEL_HEX[h.color];
  rr(c, h.x + 8, h.y + h.h - 34, h.w - 16, 18, 6);
  c.fill();
  // Big coloured door sign: the colour this house takes.
  c.beginPath();
  c.arc(h.x + h.w / 2, h.y + h.h - 52, 26, 0, 6.29);
  c.fillStyle = PARCEL_HEX[h.color];
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.9)';
  c.lineWidth = 3;
  c.stroke();
  drawParcelBox(c, h.x + h.w / 2, h.y + h.h - 52, 22, 'rgba(255,255,255,0.92)');
  if (h.checked) {
    c.globalAlpha = 0.25;
    c.fillStyle = '#000';
    rr(c, h.x, h.y, h.w, h.h, 8);
    c.fill();
    c.globalAlpha = 1;
  }
}

function drawHazard(c, hz) {
  if (hz.kind === 'pothole') {
    c.fillStyle = '#0e0e18';
    c.beginPath();
    c.ellipse(hz.x, hz.y, hz.r, hz.r * 0.55, 0, 0, 6.29);
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.12)';
    c.lineWidth = 2;
    c.stroke();
  } else {
    const g = c.createRadialGradient(hz.x, hz.y, 4, hz.x, hz.y, hz.r);
    g.addColorStop(0, 'rgba(150,90,255,0.55)');
    g.addColorStop(0.6, 'rgba(40,30,80,0.5)');
    g.addColorStop(1, 'rgba(40,30,80,0)');
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(hz.x, hz.y, hz.r, hz.r * 0.55, 0, 0, 6.29);
    c.fill();
  }
}

function drawTraffic(c, t) {
  c.save();
  c.translate(t.x, t.y);
  c.fillStyle = 'rgba(0,0,0,0.35)';
  rr(c, -t.w / 2 + 3, -t.h / 2 + 6, t.w, t.h, 10);
  c.fill();
  rr(c, -t.w / 2, -t.h / 2, t.w, t.h, 10);
  c.fillStyle = t.color;
  c.fill();
  // Roof + windows.
  rr(c, -t.w / 2 + 7, -t.h / 2 + 16, t.w - 14, t.h - 40, 7);
  c.fillStyle = '#bcd6e8';
  c.fill();
  c.fillStyle = 'rgba(20,24,48,0.85)';
  c.fillRect(-t.w / 2 + 11, -t.h / 2 + 22, t.w - 22, 16);
  if (t.kind === 'bus') {
    c.fillRect(-t.w / 2 + 11, -t.h / 2 + 52, t.w - 22, 14);
    c.fillRect(-t.w / 2 + 11, -t.h / 2 + 78, t.w - 22, 14);
  } else if (t.kind === 'truck') {
    // Cargo box on top, cab at the bottom.
    c.fillStyle = '#8d99ae';
    rr(c, -t.w / 2 + 6, -t.h / 2 + 8, t.w - 12, t.h - 74, 6);
    c.fill();
    c.fillStyle = 'rgba(20,24,48,0.85)';
    c.fillRect(-t.w / 2 + 11, t.h / 2 - 52, t.w - 22, 16);
  } else {
    c.fillRect(-t.w / 2 + 11, t.h / 2 - 38, t.w - 22, 14);
  }
  if (t.kind === 'taxi') {
    // Checker strip on the roof.
    for (let i = 0; i < 6; i++) {
      c.fillStyle = i % 2 ? '#0c0c14' : '#f8f9fa';
      c.fillRect(-t.w / 2 + 10 + i * 8, -t.h / 2 + 8, 8, 8);
    }
  }
  // Taillights face the player (down).
  c.fillStyle = '#ff2e4d';
  c.fillRect(-t.w / 2 + 6, t.h / 2 - 6, 12, 5);
  c.fillRect(t.w / 2 - 18, t.h / 2 - 6, 12, 5);
  c.restore();
}

function drawPlayer(c, p, state, now) {
  if (now < p.invulnerableUntil && Math.floor(now * 12) % 2 === 0) return; // blink
  c.save();
  c.translate(p.x, p.y);
  c.rotate(p.lean * 0.14);
  // Headlight cone.
  const cone = c.createLinearGradient(0, -50, 0, -230);
  cone.addColorStop(0, 'rgba(255,240,180,0.20)');
  cone.addColorStop(1, 'rgba(255,240,180,0)');
  c.fillStyle = cone;
  c.beginPath();
  c.moveTo(-16, -46);
  c.lineTo(16, -46);
  c.lineTo(74, -230);
  c.lineTo(-74, -230);
  c.closePath();
  c.fill();
  // Shadow.
  c.fillStyle = 'rgba(0,0,0,0.4)';
  rr(c, -26, -46, 52, 100, 14);
  c.fill();
  // Wheels.
  c.fillStyle = '#0c0c14';
  rr(c, -26, -48, 10, 26, 4);
  c.fill();
  rr(c, 16, -48, 10, 26, 4);
  c.fill();
  rr(c, -26, 30, 10, 26, 4);
  c.fill();
  rr(c, 16, 30, 10, 26, 4);
  c.fill();
  // Body.
  const body = c.createLinearGradient(-22, 0, 22, 0);
  body.addColorStop(0, COLORS.bikeDark);
  body.addColorStop(0.5, COLORS.bike);
  body.addColorStop(1, COLORS.bikeDark);
  rr(c, -21, -50, 42, 100, 16);
  c.fillStyle = body;
  c.fill();
  // Windshield + rider.
  c.fillStyle = '#9fd8ef';
  rr(c, -13, -46, 26, 20, 8);
  c.fill();
  c.fillStyle = '#20263e';
  c.beginPath();
  c.arc(0, -8, 15, 0, 6.29);
  c.fill();
  c.fillStyle = '#e8f6ff';
  c.beginPath();
  c.arc(0, -12, 11, Math.PI, 0);
  c.fill();
  // Tail light.
  c.fillStyle = '#ff2e4d';
  rr(c, -10, 44, 20, 6, 3);
  c.fill();
  // Boost flames.
  if (state.boosting) {
    c.fillStyle = '#ff9f1c';
    const f = 14 + Math.sin(now * 40) * 6;
    c.beginPath();
    c.moveTo(-12, 52);
    c.lineTo(0, 52 + f + 14);
    c.lineTo(12, 52);
    c.closePath();
    c.fill();
  }
  c.restore();
}

function drawParticles(c, world) {
  for (const pt of world.particles) {
    c.globalAlpha = Math.max(0, pt.life / pt.max);
    c.fillStyle = pt.color;
    c.beginPath();
    c.arc(pt.x, pt.y, pt.size, 0, 6.29);
    c.fill();
  }
  c.globalAlpha = 1;
  for (const f of world.floats) {
    c.globalAlpha = Math.max(0, f.life / f.max);
    text(c, f.text, f.x, f.y, 24, f.color, 'bold', 'center');
  }
  c.globalAlpha = 1;
}

export function drawWorld(c, g) {
  const { state, world, now } = g;
  c.save();
  if (state.shake > 0.5) {
    c.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  }
  drawSky(c, world, now);
  for (const b of world.buildingsRight) drawBuilding(c, b, false);
  drawRoad(c, world);
  for (const b of world.buildingsLeft) drawBuilding(c, b, true);
  for (const h of world.houses) drawHouse(c, h);
  for (const hz of world.hazards) drawHazard(c, hz);
  for (const pa of world.parcels) {
    const bobY = pa.y + Math.sin(pa.bob) * 3;
    const glow = c.createRadialGradient(pa.x, bobY, 2, pa.x, bobY, 34);
    glow.addColorStop(0, PARCEL_HEX[pa.color]);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    c.globalAlpha = 0.35;
    c.fillStyle = glow;
    c.beginPath();
    c.arc(pa.x, bobY, 34, 0, 6.29);
    c.fill();
    c.globalAlpha = 1;
    drawParcelBox(c, pa.x, bobY, 34, PARCEL_HEX[pa.color]);
  }
  for (const pu of world.powerups) drawPowerup(c, pu);
  for (const t of world.traffic) drawTraffic(c, t);
  if (state.mode !== 'over') drawPlayer(c, state.player, state, now); // the bike is gone after the crash
  drawParticles(c, world);
  c.restore();
}

function drawBoostBar(c, x, y, w, boost) {
  rr(c, x, y, w, 12, 6);
  c.fillStyle = 'rgba(255,255,255,0.18)';
  c.fill();
  if (boost > 0.5) {
    const g = c.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, '#2ec4b6');
    g.addColorStop(1, '#ffb703');
    rr(c, x, y, (w * boost) / 100, 12, 6);
    c.fillStyle = g;
    c.fill();
  }
}

export function drawHUD(c, state) {
  // Top bar.
  rr(c, 0, 0, VIEW.w, 62, 0);
  c.fillStyle = COLORS.hudBg;
  c.fill();
  text(c, 'SCORE', 24, 24, 13, COLORS.textDim, 'bold');
  text(c, String(state.score).padStart(6, '0'), 24, 52, 28, COLORS.text);
  text(c, 'PKG', 250, 24, 13, COLORS.textDim, 'bold');
  text(c, String(state.deliveries), 250, 52, 28, COLORS.text);
  // Carried parcels as dots.
  for (let i = 0; i < TUNING.maxCarry; i++) {
    const col = state.player.carried[i];
    c.beginPath();
    c.arc(330 + i * 26, 42, 9, 0, 6.29);
    c.fillStyle = col ? PARCEL_HEX[col] : 'rgba(255,255,255,0.15)';
    c.fill();
    if (!col) {
      c.strokeStyle = 'rgba(255,255,255,0.35)';
      c.lineWidth = 1.5;
      c.stroke();
    }
  }
  // Combo.
  if (state.player.streak >= 1) {
    text(c, 'COMBO ×' + (1 + Math.min(state.player.streak, TUNING.comboCap - 1)), 470, 48, 26, COLORS.bike, 'bold');
  }
  // Level.
  text(c, 'LV ' + state.level, 640, 48, 26, COLORS.text, 'bold');
  // Active power-ups: shield icon, magnet and slow-mo timers.
  let chipX = 720;
  if (state.player.shield) {
    drawShieldIcon(c, chipX + 10, 42, 20, COLORS.powerupShield);
    chipX += 34;
  }
  if (state.elapsed < state.player.magnetUntil) {
    text(c, 'MAGNET ' + Math.ceil(state.player.magnetUntil - state.elapsed) + 's', chipX, 48, 18, COLORS.powerupMagnet, 'bold');
    chipX += 130;
  }
  if (state.elapsed < state.player.slowmoUntil) {
    text(c, 'SLOW-MO ' + Math.ceil(state.player.slowmoUntil - state.elapsed) + 's', chipX, 48, 18, COLORS.powerupSlowmo, 'bold');
  }
  // Hearts.
  for (let i = 0; i < TUNING.hearts; i++) {
    drawHeart(c, 1010 + i * 34, 34, 26, i < state.player.hearts);
  }
  // Speed.
  const kmh = Math.round((state.speed * 0.36) / 4 + 40);
  text(c, kmh + ' km/h', 1180, 48, 24, COLORS.text, 'bold', 'right');
  text(c, 'SPEED', 1180, 22, 12, COLORS.textDim, 'bold', 'right');
  // Boost bar, bottom left.
  text(c, 'BOOST  [SPACE]', 24, VIEW.h - 34, 13, COLORS.textDim, 'bold');
  drawBoostBar(c, 24, VIEW.h - 26, 200, state.player.boost);
  text(c, '← → lanes · ↑ faster · ↓ brake · P pause · M mute', VIEW.w - 24, VIEW.h - 34, 13, COLORS.textDim, 'normal', 'right');
}

export function drawLevelBanner(c, state) {
  const a = Math.min(1, state.levelFlash);
  c.globalAlpha = a;
  text(c, 'LEVEL ' + state.level, VIEW.w / 2, 300, 64, COLORS.bike, 'bold', 'center');
  text(c, 'RUSH HOUR — denser traffic, taxis and trucks join in', VIEW.w / 2, 340, 20, COLORS.text, 'bold', 'center');
  c.globalAlpha = 1;
}

function dim(c) {
  c.fillStyle = 'rgba(6, 8, 22, 0.66)';
  c.fillRect(0, 0, VIEW.w, VIEW.h);
}

function keyChip(c, label, x, y) {
  const w = 12 + label.length * 11;
  rr(c, x, y - 22, w, 30, 7);
  c.fillStyle = 'rgba(255,255,255,0.12)';
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.35)';
  c.lineWidth = 1.5;
  c.stroke();
  text(c, label, x + w / 2, y, 16, COLORS.text, 'bold', 'center');
}

export function drawTitle(c, state) {
  dim(c);
  const pulse = 1 + Math.sin(state.now * 3) * 0.03;
  c.save();
  c.translate(VIEW.w / 2, 190);
  c.scale(pulse, pulse);
  const g = c.createLinearGradient(-260, 0, 260, 0);
  g.addColorStop(0, COLORS.bike);
  g.addColorStop(1, COLORS.neonPink);
  c.font = 'bold 88px system-ui, -apple-system, sans-serif';
  c.fillStyle = g;
  c.textAlign = 'center';
  c.fillText('KILAT COURIER', 0, 0);
  c.restore();
  text(c, 'A midnight parcel run through the city that never sleeps.', VIEW.w / 2, 240, 22, COLORS.text, 'normal', 'center');
  text(c, 'Grab parcels. Dodge the traffic. Drop each parcel at the house with the matching colour.', VIEW.w / 2, 272, 18, COLORS.textDim, 'normal', 'center');
  text(c, 'Power-ups help: shield saves one crash · magnet pulls parcels · slow-mo buys time.', VIEW.w / 2, 300, 17, COLORS.textDim, 'normal', 'center');
  // Controls.
  const cy = 350;
  keyChip(c, '← →', VIEW.w / 2 - 260, cy);
  text(c, 'switch lane', VIEW.w / 2 - 200, cy, 17, COLORS.text);
  keyChip(c, '↑ ↓', VIEW.w / 2 - 60, cy);
  text(c, 'faster / brake', VIEW.w / 2, cy, 17, COLORS.text);
  keyChip(c, 'SPACE', VIEW.w / 2 + 140, cy);
  text(c, 'boost', VIEW.w / 2 + 215, cy, 17, COLORS.text);
  text(c, 'P pause · M mute · R restart · or click a lane to ride there', VIEW.w / 2, cy + 44, 15, COLORS.textDim, 'normal', 'center');
  if (state.best > 0) {
    text(c, 'BEST  ' + String(state.best).padStart(6, '0'), VIEW.w / 2, 440, 20, COLORS.bike, 'bold', 'center');
  }
  // Start button.
  const b = BTN_START;
  const glow = 0.5 + Math.sin(state.now * 3) * 0.2;
  c.save();
  c.globalAlpha = glow;
  rr(c, b.x - 6, b.y - 6, b.w + 12, b.h + 12, 14);
  c.fillStyle = COLORS.neonPink;
  c.fill();
  c.restore();
  rr(c, b.x, b.y, b.w, b.h, 10);
  c.fillStyle = '#1a1033';
  c.fill();
  text(c, '▶  START RUN', b.x + b.w / 2, b.y + 42, 26, COLORS.text, 'bold', 'center');
  text(c, 'or press Enter', VIEW.w / 2, b.y + 92, 15, COLORS.textDim, 'normal', 'center');
}

export function drawPaused(c, state) {
  dim(c);
  text(c, 'PAUSED', VIEW.w / 2, 340, 64, COLORS.text, 'bold', 'center');
  text(c, 'Press P or click anywhere to ride on', VIEW.w / 2, 390, 20, COLORS.textDim, 'normal', 'center');
}

export function drawGameOver(c, state) {
  dim(c);
  text(c, 'RUN OVER', VIEW.w / 2, 200, 72, COLORS.neonPink, 'bold', 'center');
  const cx = VIEW.w / 2;
  text(c, 'SCORE', cx - 220, 290, 16, COLORS.textDim, 'bold');
  text(c, String(state.score).padStart(6, '0'), cx - 220, 330, 40, COLORS.text, 'bold');
  text(c, 'DELIVERIES', cx - 20, 290, 16, COLORS.textDim, 'bold');
  text(c, String(state.deliveries), cx - 20, 330, 40, COLORS.text, 'bold');
  text(c, 'DISTANCE', cx + 140, 290, 16, COLORS.textDim, 'bold');
  text(c, (state.distance / 1000).toFixed(1) + ' km', cx + 140, 330, 40, COLORS.text, 'bold');
  text(c, 'Reached LEVEL ' + state.level, cx, 360, 18, COLORS.textDim, 'bold', 'center');
  if (state.newBest) {
    text(c, '★ NEW BEST! ★', cx, 392, 28, COLORS.bike, 'bold', 'center');
  } else if (state.best > 0) {
    text(c, 'BEST  ' + String(state.best).padStart(6, '0'), cx, 392, 20, COLORS.textDim, 'bold', 'center');
  }
  const b = BTN_RESTART;
  rr(c, b.x, b.y, b.w, b.h, 10);
  c.fillStyle = '#1a1033';
  c.fill();
  c.strokeStyle = COLORS.bike;
  c.lineWidth = 2;
  c.stroke();
  text(c, '↻  RIDE AGAIN', b.x + b.w / 2, b.y + 42, 26, COLORS.text, 'bold', 'center');
  text(c, 'or press R', VIEW.w / 2, b.y + 92, 15, COLORS.textDim, 'normal', 'center');
}
