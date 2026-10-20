'use strict';
// ---------- the moveset's special mechanics and hand-built poses ----------
// game.js calls moveExtras() every frame of a move, learnedCue() when a learned move starts; draw.js asks MOVE_POSE
// for a move's own pose after the generic one is built, and blends the prince's final pose from frame to frame.
const sstep = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const span = (k, a, b) => clamp((k - a) / (b - a), 0, 1);

// ---------- mechanics ----------
function airHeavyHold(m) { // hold Heavy through the air heavy and it turns into the weapon's learned dive
  const tree = WEAPONS[P.w].tree;
  if (m.key === 'JH' && input.heavy && (P.holdH || 0) >= .2 && unlocked(tree.AH) && P.z > 8) { begin(tree.AH); return true; }
  return false;
}
function moveExtras(m, k, dt, airborne) {
  if (airHeavyHold(m)) return true;
  if (P.specialT > 0) learnedTrail(dt);
  if (m.slamDrop && airborne && k >= m.slamDrop) P.vz = Math.min(P.vz, -430); // the hammer pulls him down out of the flip
  if (m.drag && k < m.drag && P.z < 3 && Math.random() < dt * 45) { // the head scraping the street throws sparks
    const sx = P.x + rand(-62, 62);
    parts.push({ x: sx, y: P.y + rand(-4, 4), z: 2, vx: rand(-120, 120), vy: 0, vz: rand(60, 200), life: .35, max: .35, col: pick(['#FFD27A', '#FF9A5A', '#FFF4D8']), size: rand(1.5, 2.6), shape: 'star', rot: 0, vr: 6 });
    if (Math.random() < .3) dust(sx, P.y, 1);
  }
  if (m.slide && k < .62 && Math.random() < dt * 30) dust(P.x - P.facing * 6, P.y, 1);
  if (m.turnAt) { // the vault: carried clean over whoever is ahead, and turned to face them as he comes down
    if (P.vaultVx === undefined) {
      const foe = enemies.filter(e => !e.dead && (e.x - P.x) * P.facing > -4 && (e.x - P.x) * P.facing < 180 && Math.abs(e.y - P.y) < 40).sort((a, b) => Math.abs(a.x - P.x) - Math.abs(b.x - P.x))[0];
      P.vaultFoe = foe || null; const travel = foe ? Math.abs(foe.x - P.x) + foe.hw + 30 : 90;
      P.vaultVx = P.facing * travel / (2 * (m.hop || 300) / GRAV);
    }
    if (airborne) P.vx = P.vaultVx; else if (P.turned) P.vx *= Math.pow(.001, dt);
    if (!P.turned && k >= m.turnAt) { P.turned = true; if (P.vaultFoe) P.facing = -P.facing; } // nobody to vault over: he just lands facing on
  }
  if (m.tornado && !P.stormed && k >= m.h[0] + .1) { // the staff tears a whirlwind loose
    P.stormed = true; sfx('whoosh');
    projs.push({ owner: 'p', tornado: 1, x: P.x + P.facing * 50, y: P.y, z: 0, vx: P.facing * 150, life: 2.4, max: 2.4, dmg: Math.round(m.tornado * wMult(P.w)), hitT: new Map(), hit: new Set(), seed: Math.random() * 9 });
  }
  if (m.blink && P.blinkList && P.blinkList.length) { // Hellride: step out of Shadow beside each of them in turn
    const n = P.blinkList.length, slot = (m.h[1] - m.h[0]) / n, i = Math.floor((k - m.h[0]) / slot);
    if (k >= m.h[0] && i >= P.blinkI && i < n) {
      P.blinkI = i + 1; const e = P.blinkList[i];
      if (!e.dead) {
        addGhost(true);
        for (let j = 0; j < 8; j++) parts.push({ x: P.x + rand(-8, 8), y: P.y + rand(-3, 3), z: rand(6, 50), vx: rand(-40, 40), vy: 0, vz: rand(10, 50), life: .4, max: .4, col: pick(['rgba(42,24,64,.8)', 'rgba(90,60,140,.7)']), size: rand(4, 7), shape: 'puff', rot: 0, vr: 0 });
        const side = i % 2 ? 1 : -1;
        P.x = e.x + side * (e.hw + 26); P.y = e.y; P.facing = -side; P.vx = 0;
        addGhost(true);
        const hs = hitstop; strike(e, m.dmg * wMult(P.w), P.facing, m); P.hits.set(e, P.t);
        if (P.blinkI > 1) hitstop = Math.max(hs, Math.min(hitstop, .06)); // only the first thrust gets the full crit freeze: the rest keep the ride moving
        fx.push({ kind: 'slash', x: e.x, y: e.y, z: e.z + e.hh * .55, ang: rand(-.3, .3), t: .3, max: .3, size: 34 + e.hw, col: '#C8D0FF' }); sfx('slice');
      }
    }
  }
  return false;
}
function tornadoTick(p, dt) { // the staff's whirlwind: drags whoever it touches into itself and beats at them, then throws them all
  p.vx *= Math.pow(.6, dt);
  const now = p.max - p.life, end = p.life <= dt;
  const hs = hitstop, sh = shakeMag; // its many small blows don't freeze the game the way a hand-struck blow does
  for (const e of enemies) {
    if (e.dead || Math.abs(e.x - p.x) > 46 + e.hw * .5 || Math.abs(e.y - p.y) > 30) continue;
    if (!e.boss) { e.x += (p.x - e.x) * Math.min(1, dt * 5); e.y += (p.y - e.y) * Math.min(1, dt * 3); }
    const last = p.hitT.get(e);
    if (end) { strike(e, p.dmg * 1.6, Math.sign(e.x - P.x) || 1, { key: 'HC', dmg: p.dmg, kb: 260, launch: 520, power: 2 }); continue; }
    if (last === undefined || now - last >= .2) { p.hitT.set(e, now); strike(e, p.dmg, Math.sign(p.vx) || 1, { key: 'HC', dmg: p.dmg, kb: 0, launch: 160, power: 1 }); }
  }
  if (!end) { hitstop = Math.max(hs, Math.min(hitstop, .015)); shakeMag = Math.max(sh, Math.min(shakeMag, 2)); }
  if (Math.random() < dt * 30) parts.push({ x: p.x + rand(-20, 20), y: p.y + rand(-4, 4), z: rand(0, 20), vx: rand(-90, 90), vy: 0, vz: rand(120, 260), life: .5, max: .5, col: pick(['#B8A47E', '#8A7458', 'rgba(200,240,230,.8)']), size: rand(2, 3.5), shape: 'tuft', rot: rand(0, 6), vr: 9 });
  if (end) { fx.push({ kind: 'ring', x: p.x, y: p.y, z: 2, t: .4, max: .4, r: 70, col: '#BFF5E8', flat: 1 }); sfx('whoosh'); }
}
function drawTornado(p, t) {
  const a = Math.min(1, p.life * 2, (p.max - p.life) * 4), x = p.x, y = p.y;
  onPage(() => {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 2, x, y, 50); g.addColorStop(0, `rgba(126,194,176,${.35 * a})`); g.addColorStop(1, 'rgba(126,194,176,0)');
    ctx.fillStyle = g; ell(x, y, 50, 14); ctx.fill();
    ctx.lineCap = 'round';
    for (let i = 0; i < 14; i++) { // bands of wind wound round a funnel that widens as it climbs
      const h = i / 13, r = 10 + h * 34, yy = y - h * 104, ph = t * 11 + i * .9 + p.seed, w = Math.sin(ph);
      ctx.strokeStyle = i % 3 ? `rgba(200,240,230,${(.25 + .3 * h) * a})` : `rgba(255,255,255,${.45 * a})`; ctx.lineWidth = 1.2 + 2.2 * (1 - h);
      ctx.beginPath(); ctx.ellipse(x + w * 4 * h, yy, r, r * .26, 0, ph % TAU, ph % TAU + 3.6); ctx.stroke();
    }
    ctx.restore();
  });
}

// ---------- the learned-move cue ----------
// short and gilded: a bright chime, a little flourish of gold scrollwork, a gold rim round the prince, gold afterimages
// tracing the swing, and a beat of hitstop on the first blow it lands
function learnedCue(m) {
  P.specialT = P.specialMax = .5; P.specialHit = true; P.goldT = 0;
  sfx('learned');
  fx.push({ kind: 'gild', x: P.x + P.facing * 6, y: P.y, z: P.z + 60, t: .5, max: .5, dir: P.facing });
}
function learnedTrail(dt) {
  P.goldT = (P.goldT || 0) - dt;
  if (P.goldT <= 0 && P.specialT > .1 && ghosts.length < 18) { P.goldT = .04; ghosts.push({ x: P.x, y: P.y, z: P.z, facing: P.facing, pose: playerPose(), a: .5 * P.specialT / (P.specialMax || .5), gold: 1 }); }
}
function learnedFirstHit(e, dir) {
  P.specialHit = false; hitstop = Math.max(hitstop, .11);
  const hz = e.z + e.hh * .55;
  burst(e.x, e.y, hz, ['#FFE9A0', '#EED48A', '#FFFFFF'], 12, 'spark', dir, true);
  fx.push({ kind: 'ring', x: e.x, y: e.y, z: hz, t: .26, max: .26, r: 34, col: '#FFE9A0' });
}
function drawLearnedRim(pose) { // a gold rim of light just outside his silhouette; drawn under the ink layer so only the rim shows
  const a = clamp(P.specialT / (P.specialMax || .5), 0, 1); if (a <= 0) return;
  onMain(() => {
    ctx.globalCompositeOperation = 'lighter';
    const cy = P.y - P.z - 34, g = ctx.createRadialGradient(P.x, cy, 4, P.x, cy, 62);
    g.addColorStop(0, `rgba(255,214,120,${.22 * a})`); g.addColorStop(1, 'rgba(255,214,120,0)'); ctx.fillStyle = g; ell(P.x, cy, 62, 56); ctx.fill();
    TINT = '#F2C866';
    for (const [dx, dy] of [[2.6, 0], [-2.6, 0], [0, 2.6], [0, -2.6]]) drawPlayerAt(P.x + dx, P.y + dy, P.z, P.facing, Object.assign({}, pose, { noSim: 1 }), .5 * a);
    TINT = null;
  });
}
function drawGild(f) { // a gilded flourish: two scrolls curling out from a lozenge, opening and fading
  const k = f.t / f.max, o = 1 - k, s = .7 + o * .5;
  ctx.translate(f.x, f.y - f.z); ctx.scale(s, s); ctx.globalAlpha = Math.min(1, k * 2.2);
  ctx.lineCap = 'round'; ctx.strokeStyle = C('#FFE2A0'); ctx.lineWidth = 2;
  for (const d of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(d * 5, 0); ctx.bezierCurveTo(d * 14, -9, d * 24, -2, d * 20, 4); ctx.bezierCurveTo(d * 17, 8, d * 12, 4, d * 15, 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(d * 5, 1); ctx.quadraticCurveTo(d * 16, 9, d * 28, 3); ctx.stroke();
  }
  ctx.fillStyle = C('#FFF4D0'); ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(4, 0); ctx.lineTo(0, 6); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill();
  ctx.rotate(o * 2); ctx.fillStyle = C('#FFFFFF'); for (let i = 0; i < 4; i++) { ctx.rotate(TAU / 4); ctx.fillRect(9 + o * 14, -.8, 3, 1.6); }
}

// ---------- poses ----------
const ARM_REACH = 19;
function groundGrip(pose, len, sinkY = 0) { // keep a dragged weapon's far end on the street, not through it
  const a = pose.arm, s = Math.sin(a), lim = clamp((30 + sinkY) / len, .2, .95);
  if (s > lim) { const d = Math.cos(a) >= 0 ? Math.asin(lim) : Math.PI - Math.asin(lim); pose.grip = d - a; }
}
function goldify(pose) { // during a learned move the swing's trail turns to gold and burns a little wider
  if (pose.trail && pose.trailFrom !== undefined) { const d = (pose.arm ?? 1.1) - pose.trailFrom; if (Math.abs(d) > 2.3) pose.trailFrom = pose.arm - Math.sign(d) * 2.3; } // a trail shows the last of the swing, not a whole circle
  if (!(P.specialT > 0)) return;
  const col = 'rgba(255,214,120,.98)';
  if (pose.trail) { pose.trailCol = col; pose.trailW = (pose.trailW || 6) + 2.5; }
  if (pose.flat) pose.flat = Object.assign({}, pose.flat, { col, w: pose.flat.w + 2.5 });
  if (pose.streak) pose.streak = Object.assign({}, pose.streak, { col });
  if (!pose.glow) pose.glow = `rgba(255,214,120,${(.6 * P.specialT / (P.specialMax || .5)).toFixed(2)})`;
}
const tcolOf = (m) => brandT > 0 ? `rgba(${ELEMENTS[brandEl].rgb},.95)` : m.power === 2 ? 'rgba(216,170,85,.95)' : TRAIL[P.w];
const ring = (pose, m, r, w) => { pose.flat = { r, k: .96, rev: false, col: tcolOf(m), w }; };
const MOVE_POSE = {
  // ---- fists ----
  'fists:H'(pose, m, k) { // Rising Dragon: coil low and turned away, then drive straight up, corkscrewing toward us, the lead fist leading
    const h0 = m.h[0], h1 = m.h[1];
    pose.spin = 0; pose.yaw = 0; pose.trail = 0;
    if (k < h0) { const q = ease(k / h0);
      pose.sink = 10 * q; pose.legs = { f: 9, b: -10, fk: 4 + 7 * q, bk: 3 + 8 * q }; pose.lean = .38 * q; pose.yaw = -.4 * q;
      pose.arm = lerp(1, 1.3, q); pose.elbow = lerp(1.9, .9, q); pose.backArm = lerp(1.3, .9, q); pose.backElbow = 2.3;
    } else if (k < h1 + .12) { const q = ease(span(k, h0, h0 + (h1 - h0) * .6));
      pose.spin = lerp(-.4, .75, q); pose.yaw = 0;
      pose.sink = lerp(10, -3, q); pose.legs = { f: lerp(9, 9, q), b: lerp(-10, -2, q), fk: lerp(11, 17, q), bk: lerp(11, 1, q) }; // the lead knee driven up, the back leg long beneath him
      pose.lean = lerp(.38, -.14, q); pose.arm = lerp(1.3, -1.42, q); pose.elbow = lerp(.9, .04, q); pose.ext = .9 * q;
      pose.backArm = lerp(.9, 1.55, q); pose.backElbow = 2.45; // the off hand tucked tight to the ribs
      pose.trail = 30; pose.trailFrom = .4; pose.trailCol = 'rgba(255,240,200,.95)'; pose.trailW = 6; pose.flow = 10;
    } else { const q = ease(span(k, h1 + .12, 1));
      pose.spin = lerp(.75, 0, q); pose.sink = lerp(-3, 2, q); pose.legs = { f: lerp(9, 7, q), b: lerp(-2, -7, q), fk: lerp(17, 4, q), bk: lerp(1, 3, q) };
      pose.lean = lerp(-.14, .06, q); pose.arm = lerp(-1.25, 1, q); pose.elbow = lerp(.06, 1.9, q); pose.backArm = lerp(1.55, 1.3, q); pose.backElbow = lerp(2.45, 2, q);
    }
  },
  'fists:X'(pose, m, k) { // Rising Fist: a boxer's lead uppercut, dipped to the lead side and driven up through the legs and hips
    const h0 = m.h[0], h1 = m.h[1];
    pose.trail = 0; pose.backArm = 1.25; pose.backElbow = 2.1; // the rear hand stays up by the chin
    if (k < h0) { const q = ease(k / h0);
      pose.sink = 11 * q; pose.lean = .42 * q; pose.yaw = -.3 * q; pose.legs = { f: 10, b: -9, fk: 3 + 9 * q, bk: 3 + 6 * q };
      pose.arm = lerp(1, 1.4, q); pose.elbow = lerp(1.9, 1.3, q);
    } else if (k < h1 + .1) { const q = ease(span(k, h0, h0 + (h1 - h0) * .5));
      pose.sink = lerp(11, -2, q); pose.legs = { f: lerp(10, 7, q), b: lerp(-9, -8, q), fk: lerp(12, 1, q), bk: lerp(9, 1, q) };
      pose.lean = lerp(.42, -.06, q); pose.yaw = lerp(-.3, .2, q);
      pose.arm = lerp(1.4, -.42, q); pose.elbow = lerp(1.3, .5, q); // upper arm driven forward and up, the forearm rising past the chin: the L of an uppercut
      if (q > .4) pose.streak = null;
    } else { const q = ease(span(k, h1 + .1, 1));
      pose.sink = lerp(-2, 2, q); pose.legs = { f: 8, b: -8, fk: lerp(1, 3, q), bk: lerp(1, 3, q) }; pose.lean = lerp(-.16, .06, q); pose.yaw = lerp(.2, 0, q);
      pose.arm = lerp(-.6, 1, q); pose.elbow = lerp(.55, 1.9, q);
    }
  },
  'fists:DA'(pose, m, k) { // Superman Punch: laid out in the air, the rear hand thrown long, the lead hand pulled back to the hip
    const h0 = m.h[0], h1 = m.h[1], e = k < h0 ? 0 : k < h1 ? Math.min(1, (k - h0) / ((h1 - h0) * .4)) : Math.max(0, 1 - (k - h1) / (1 - h1) * 1.2), l = k < h0 ? ease(k / h0) : 1;
    pose.trail = 0; pose.ext = 0; pose.streak = null;
    pose.rot = .38 * l * (.6 + .4 * e); pose.lean = .2 + .1 * e; pose.yaw = .4 * e;
    pose.backArm = lerp(1.3, -.12 - pose.lean - pose.rot * .5, e); pose.backElbow = lerp(2, .05, e); pose.backReach = .45 * e;
    pose.arm = lerp(1, 2.2, e); pose.elbow = lerp(1.9, 1.1, e);
    pose.legs = { f: lerp(7, 5, l), b: lerp(-7, -19, l), fk: lerp(4, 14, l), bk: lerp(3, -3, l) }; pose.sink = 2; pose.flow = 16;
  },
  // ---- hammer ----
  'hammer:H'(pose, m, k) { // Pivot Crusher: through his back, and the head comes round flat at chest height
    delete pose.sweep; pose.trail = 0;
    const s = sstep(span(k, .08, .6));
    pose.spin = -TAU * s - (k > .6 ? .35 * Math.sin(Math.PI * span(k, .6, 1)) : 0); // carried a little past, then unwinding
    pose.arm = k < .12 ? lerp(1.95, 2.4, ease(k / .12)) : lerp(2.4, .3, sstep(span(k, .12, .45))); pose.grip = lerp(.28, 0, span(k, 0, .3));
    pose.backArm = lerp(.9, 2.8, span(k, .1, .45)); pose.backElbow = .3;
    const hit = span(k, .4, .62), out = k > .62 ? 1 - span(k, .7, 1) : hit;
    pose.lean = lerp(-.12, .38, out); pose.sink = 4 + 5 * out; pose.legs = { f: 9 + 4 * out, b: -10 - 3 * out, fk: 5 + 4 * out, bk: 5 }; pose.flow = 8;
    if (k > .36 && k < .7) pose.flat = { r: 70, k: span(k, .36, .62), rev: false, col: tcolOf(m), w: 8 };
  },
  'hammer:HH'(pose, m, k) { // Rising Ruin: dragged low through the street, then up under them, the chest opening to us as he rises
    pose.yaw = lerp(-.3, .5, sstep(span(k, .2, .6))) * (k > .8 ? 1 - span(k, .8, 1) : 1);
    if (k < m.h[0]) pose.arm = lerp(.3, 2.4, ease(k / m.h[0]));
    groundGrip(pose, 70, pose.sink || 0);
    if (k > m.h[1]) { const q = ease(span(k, m.h[1], 1)); pose.arm = lerp(-2.5, -2.1, q); }
  },
  'hammer:HHH'(pose, m, k) { // Maelstrom Slam: two turns at arm's length, leaning back against the pull, then up and down into the street
    delete pose.sweep; pose.trail = 0; pose.flat = null;
    const sp = sstep(span(k, .06, .58));
    pose.spin = -2 * TAU * sp;
    if (k < .58) {
      pose.arm = lerp(1.95, .35, ease(span(k, 0, .12))); pose.grip = 0; pose.backArm = 2.9; pose.backElbow = .2; pose.lean = -.22 * ease(span(k, 0, .15)); pose.sink = 6;
      pose.legs = { f: 9 + 2 * Math.sin(k * 40), b: -9 + 2 * Math.sin(k * 40), fk: 6, bk: 6 }; pose.flow = 12;
      if (k > .1) ring(pose, m, 72, 8);
    } else if (k < .68) { const q = ease(span(k, .58, .68));
      pose.arm = lerp(.35, -2.75, q); pose.backArm = lerp(2.9, -2.6, q); pose.backElbow = .3; pose.lean = lerp(-.22, -.45, q); pose.sink = lerp(6, 1, q);
      pose.legs = { f: 7, b: -9, fk: 2, bk: 3 };
    } else { const q = ease(span(k, .68, .74)), r = span(k, .82, 1);
      pose.arm = lerp(-2.75, 1.45, q); pose.backArm = lerp(-2.6, 1.3, q); pose.backElbow = .2;
      pose.lean = lerp(-.45, .8, q) * (1 - .7 * r); pose.sink = lerp(1, 11, q) * (1 - .6 * r);
      pose.legs = { f: lerp(7, 13, q), b: lerp(-9, -12, q), fk: lerp(2, 9, q), bk: 1 + 3 * r };
      if (k < .8) { pose.trail = 66; pose.trailFrom = -2.75; pose.trailCol = tcolOf(m); pose.trailW = 9; }
    }
  },
  'hammer:JH'(pose, m, k) { // Somersault Smash: up and over, the hammer held high so the flip carries it round, then down into the street
    const f = sstep(span(k, .06, .6));
    pose.rot = TAU * f; pose.trail = 0;
    const tuck = Math.sin(Math.PI * span(k, .04, .62));
    pose.legs = { f: lerp(6, 9, tuck), b: lerp(-6, -1, tuck), fk: lerp(4, 15, tuck), bk: lerp(4, 15, tuck) }; pose.crouch = 0;
    if (k < .44) { pose.arm = lerp(.4, -2.55, ease(span(k, 0, .2))); pose.backArm = lerp(1.3, -2.4, ease(span(k, 0, .2))); pose.backElbow = .3; pose.lean = -.1 * tuck; pose.trail = 0; }
    else { const q = ease(span(k, .44, .6)); pose.arm = lerp(-2.55, 1.45, q); pose.backArm = lerp(-2.4, 1.2, q); pose.backElbow = .2; pose.lean = lerp(-.1, .6, q);
      if (k < .7) { pose.trail = 66; pose.trailFrom = -2.55; pose.trailCol = tcolOf(m); pose.trailW = 9; } }
    if (k > .62) { const l = ease(span(k, .62, .8)), r = span(k, .85, 1); pose.legs = { f: lerp(9, 13, l), b: lerp(-1, -12, l), fk: lerp(15, 9, l), bk: lerp(15, 1, l) + 3 * r }; pose.sink = 10 * l * (1 - .6 * r); pose.lean = .7 * (1 - .7 * r); }
    pose.flow = 10;
  },
  'hammer:DA'(pose, m, k) { // Flying Wheel: one turn in the air, the hammer held out flat
    delete pose.sweep; pose.trail = 0;
    pose.spin = -TAU * sstep(span(k, .05, .8)); pose.arm = lerp(1.9, .32, ease(span(k, 0, .18))); pose.grip = 0;
    pose.backArm = 2.8; pose.backElbow = .3; pose.lean = .08; pose.legs = { f: 11, b: -11, fk: 9, bk: 5 }; pose.flow = 12;
    pose.flat = k > .15 && k < .85 ? { r: 72, k: .96, rev: false, col: tcolOf(m), w: 8 } : null;
  },
  'hammer:RH'(pose, m, k) { // Tempest Uplift: a low corkscrew, the head dragged round on the street, then whipped up and over
    delete pose.sweep; pose.trail = 0; pose.flat = null;
    if (k < .6) { const q = span(k, .04, .6);
      pose.spin = -2 * TAU * (q * q * (2.2 - 1.2 * q)); // accelerating into it
      pose.arm = lerp(1.3, 1.0, ease(span(k, 0, .1))); groundGrip(pose, 70, 10);
      pose.sink = 10; pose.lean = .32; pose.legs = { f: 11 + 2 * Math.sin(k * 50), b: -12 + 2 * Math.sin(k * 50 + 1), fk: 9, bk: 8 }; pose.backArm = 3.0; pose.backElbow = .3; pose.flow = 14;
      if (k > .1) ring(pose, m, 64, 6);
    } else { const q = ease(span(k, .6, .74)), r = span(k, .8, 1);
      pose.spin = -2 * TAU;
      pose.arm = lerp(2.35, -2.6, q); pose.grip = lerp(-.4, 0, q);
      pose.lean = lerp(.32, -.45, q) * (1 - .6 * r); pose.sink = lerp(10, -3, q) + 4 * r; pose.yaw = .5 * q * (1 - r);
      pose.legs = { f: lerp(11, 7, q), b: lerp(-12, -5, q), fk: lerp(9, 10, q), bk: lerp(8, 2, q) };
      pose.backArm = lerp(3, -2.3, q); pose.backElbow = .3;
      if (k < .82) { pose.trail = 66; pose.trailFrom = 2.35; pose.trailCol = tcolOf(m); pose.trailW = 9; }
      if (k > .78) { const d = ease(r); pose.arm = lerp(-2.6, -1.9, d); }
    }
  },
  'hammer:LLLL'(pose, m, k) { // Worldbreaker: a great wheel back over the shoulder, both hands, and down onto one knee
    pose.trail = 0;
    if (k < .56) { const q = sstep(span(k, 0, .56));
      pose.arm = lerp(1.2, -2.9 + TAU, q) % TAU; if (pose.arm > Math.PI) pose.arm -= TAU; // round the back: down, behind, up
      pose.backArm = pose.arm; pose.backElbow = .15; pose.lean = lerp(.1, -.42, q); pose.sink = lerp(4, 1, q) + 4 * Math.sin(Math.PI * q);
      pose.legs = { f: 7, b: -10, fk: 3, bk: 4 }; pose.flow = 6;
      if (k > .2) { pose.trail = 66; pose.trailFrom = pose.arm - 1.6; pose.trailCol = tcolOf(m); pose.trailW = 7; }
    } else { const q = ease(span(k, .56, .62)), r = span(k, .82, 1);
      pose.arm = lerp(-2.9, 1.42, q); pose.backArm = pose.arm - .05; pose.backElbow = .15;
      pose.lean = lerp(-.42, .85, q) * (1 - .7 * r); pose.sink = lerp(1, 15, q) * (1 - .7 * r);
      pose.legs = { f: lerp(7, 11, q), b: lerp(-10, -11, q), fk: lerp(3, 13, q) * (1 - .5 * r), bk: lerp(4, 17, q) * (1 - .7 * r) }; // down on the back knee
      if (k < .74) { pose.trail = 68; pose.trailFrom = -2.9; pose.trailCol = tcolOf(m); pose.trailW = 10; }
    }
  },
  // ---- bowstaff ----
  'staff:D'(pose, m, k) { // Sliding Pole: down into a slide off the sprint, the staff low and level, then flicked up under them
    pose.streak = null; pose.trail = 0;
    const d = ease(span(k, 0, .12)), u = ease(span(k, .62, .76)), r = span(k, .8, 1);
    pose.sink = 14 * d * (1 - u) + (3 + 4 * (1 - r)) * u * (1 - r);
    pose.lean = lerp(.3, -.28, d) * (1 - u) + .12 * u * (1 - r);
    pose.legs = { f: lerp(9, 20, d) * (1 - u) + 9 * u, b: lerp(-9, -3, d) * (1 - u) - 8 * u, fk: lerp(4, 0, d) * (1 - u) + 4 * u, bk: lerp(4, 17, d) * (1 - u) + 4 * u };
    pose.arm = lerp(.38 + .28, -1.25, u); pose.grip = lerp(-.3, -.1, u); pose.ext = .6 * (1 - u); pose.elbow = 0;
    pose.backArm = lerp(.6, -.9, u); pose.backElbow = .4; pose.backReach = .25; pose.openHand = 0; pose.flow = 14 * (1 - u) + 6;
    if (k > .6 && k < .82) { pose.trail = 70; pose.trailFrom = .66; pose.trailCol = tcolOf(m); pose.trailW = 6; }
    if (k > .8) { const g = ease(span(k, .8, 1)); pose.arm = lerp(-1.25, .5, g); pose.grip = lerp(-.1, -.02, g); pose.backArm = lerp(-.9, 1.4, g); pose.backElbow = lerp(.4, .35, g); }
  },
  'staff:M'(pose, m, k) { // Lunging Thrust: two hands on the staff, the rear one driving it through like a cue
    const h0 = m.h[0], h1 = m.h[1], e = k < h0 ? -.4 * ease(k / h0) : k < h1 ? lerp(-.4, 1, ease(span(k, h0, h0 + (h1 - h0) * .45))) : 1 - .8 * ease(span(k, h1, 1));
    const p = Math.max(0, e);
    pose.legs = { f: lerp(6, 17, p), b: lerp(-10, -17, p), fk: lerp(3, 11, p), bk: lerp(8, 0, p) }; pose.sink = lerp(4, 8, p); pose.lean = lerp(-.12, .48, p) + (e < 0 ? .1 * e : 0);
    pose.arm = .06 - pose.lean * .9; pose.ext = e; pose.elbow = 0; pose.grip = 0;
    pose.backArm = pose.arm + .25 - .2 * p; pose.backElbow = lerp(1.2, .15, p); pose.backReach = .35 * p; pose.openHand = 0; pose.yaw = .2 * p;
  },
  'staff:DH'(pose, m, k) { // Vaulting Dragon: plant the staff, swing up on it and drive both feet in
    delete pose.kick;
    const kv = Math.min(1, k + .09); // the feet are already driving out as the blow lands
    pose.kickK = kv; pose.kickH = m.h; pose.kickStyle = 'drop';
    const out = kickOut(kv, m.h[0], m.h[1]);
    pose.rot = -1.35 * out; pose.lean = lerp(.4, 0, out); pose.yaw = lerp(0, -.6, out);
    const plant = 1 - ease(span(k, .18, .36));
    pose.arm = lerp(.85, 2.5, 1 - plant); pose.grip = lerp(.55, .2, 1 - plant); pose.backArm = lerp(.9, 2.3, 1 - plant); pose.backElbow = .3; pose.trail = 0;
    pose.flow = 14;
  },
  'staff:RH'(pose, m, k) { // Vaulting Reversal: planted, over in a front flip, turned in the air, and a cut down across their back
    pose.trail = 0;
    const f = sstep(span(k, .08, .44)), tuck = Math.sin(Math.PI * span(k, .06, .48));
    pose.rot = TAU * f;
    pose.spin = k < .5 && P.vaultFoe ? -Math.PI * sstep(span(k, .36, .5)) : 0; // the turn, so the facing swaps at .5 without a jump
    pose.legs = { f: lerp(7, 8, tuck), b: lerp(-8, 0, tuck), fk: lerp(3, 15, tuck), bk: lerp(3, 15, tuck) };
    if (k < .5) { pose.arm = lerp(1.0, -.4, ease(span(k, .05, .3))); pose.grip = lerp(.45, 0, span(k, .05, .3)); pose.backArm = 2.6; pose.backElbow = .3; pose.lean = .1; }
    else { const q = ease(span(k, .56, .72)), r = span(k, .84, 1);
      pose.arm = lerp(-2.2, .55, q); pose.grip = 0; pose.backArm = lerp(2.6, 1.5, q); pose.lean = lerp(-.2, .5, q) * (1 - .7 * r);
      pose.legs = { f: lerp(8, 12, q), b: lerp(-2, -11, q), fk: lerp(10, 8, q), bk: 2 }; pose.sink = 8 * q * (1 - .6 * r);
      if (k < .8) { pose.trail = 72; pose.trailFrom = -2.2; pose.trailCol = tcolOf(m); pose.trailW = 6; }
      if (k > .8) { const g = ease(span(k, .8, 1)); pose.arm = lerp(.55, .5, g); pose.backArm = lerp(1.5, 1.4, g); pose.backElbow = .35; }
    }
  },
  'staff:JH'(pose, m, k) { // Halo Sweep: one turn in the air, the staff level at the waist
    delete pose.sweep; pose.trail = 0;
    pose.arm = lerp(.5, .45, k); pose.grip = -.1; pose.backArm = 1.2; pose.backElbow = 1.2; pose.lean = .05;
    pose.legs = { f: 10, b: -9, fk: 10, bk: 6 }; pose.flow = 10;
    pose.flat = k > .14 && k < .82 ? { r: 66, k: .96, rev: false, col: tcolOf(m), w: 5 } : null;
  },
  'staff:DA'(pose, m, k) { // Flying Lance: laid out behind the staff like a thrown spear
    const h0 = m.h[0], e = k < h0 ? -.3 * ease(k / h0) : k < m.h[1] ? Math.min(1, (k - h0) / ((m.h[1] - h0) * .4)) : 1 - span(k, m.h[1], 1) * .7;
    pose.rot = .3 * (k < h0 ? ease(k / h0) : 1); pose.lean = .25; pose.ext = e; pose.arm = .22 - pose.rot - .1; pose.elbow = 0; pose.grip = 0;
    pose.backArm = pose.arm + .2; pose.backElbow = .2; pose.backReach = .3 * Math.max(0, e); pose.openHand = 0;
    pose.legs = { f: 2, b: -15, fk: 9, bk: 3 }; pose.sink = 2; pose.flow = 16;
  },
  'staff:HC'(pose, m, k) { // Eye of the Storm: the staff spun overhead until it tears the wind loose
    const q = ease(span(k, 0, .2)) * (1 - ease(span(k, .85, 1)));
    pose.arm = lerp(.5, -.25, q); pose.elbow = 0; pose.ext = .4 * q; pose.backArm = lerp(1.4, 3.3, q); pose.backElbow = .3; pose.lean = -.1 * q;
    pose.legs = { f: 10, b: -10, fk: 6, bk: 6 }; pose.sink = 5; pose.flow = 10 + 6 * Math.sin(k * 30); pose.trail = 0;
  },
  // ---- great sword ----
  'sword:L'(pose, m, k, kk) { // Rising Cut: low behind, the hips turn the chest toward us as the blade comes up through them
    pose.yaw = k < m.h[0] ? -.3 * ease(k / m.h[0]) : lerp(-.3, .4, kk) * (k > m.h[1] ? 1 - span(k, m.h[1] + .1, 1) : 1);
    if (k < m.h[0]) { pose.sink = 2 + 4 * ease(k / m.h[0]); pose.lean = .25 * ease(k / m.h[0]); } else pose.lean = lerp(.25, -.08, kk);
    pose.backArm = lerp(1.4, 2.6, kk);
    groundGrip(pose, 96, pose.sink || 0); // the point skims the street, it doesn't go through it
  },
  'sword:LL'(pose, m, k, kk) { pose.yaw = k < m.h[0] ? .35 : lerp(.35, -.3, kk); },
  'sword:JH'(pose, m, k) { // Wheel of Steel: a front flip with the blade held straight out, so the flip itself is the cut
    const R = (x) => TAU * sstep(span(x, .08, .7)), rr = R(k);
    pose.rot = rr; pose.arm = -.2; pose.elbow = 0; pose.grip = 0;
    const tuck = Math.sin(Math.PI * span(k, .05, .74));
    pose.legs = { f: lerp(7, 8, tuck), b: lerp(-7, -2, tuck), fk: lerp(3, 14, tuck), bk: lerp(3, 12, tuck) }; pose.backArm = 2.3; pose.backElbow = .3; pose.lean = 0;
    const d = rr - R(k - .12);
    pose.trail = d > .15 ? WEAPONS.sword.reach + 18 : 0; pose.trailFrom = pose.arm - Math.min(2.8, d); pose.trailCol = tcolOf(m); pose.trailW = 9;
  },
  'sword:DA'(pose, m, k, kk) { pose.legs = { f: 12, b: -14, fk: 5, bk: 8 }; pose.sink = 2; pose.lean = .28; pose.yaw = k < m.h[0] ? -.3 : lerp(-.3, .4, kk); pose.backArm = 2.8; pose.flow = 12; },
  'sword:J7'(pose, m, k) { // Judgement of Amber: a turn on the heel, a leap, reared right back, and the whole street split
    pose.trail = 0;
    if (k < .4) { pose.arm = 2.4; pose.grip = 0; pose.backArm = 1.6; pose.lean = .15; pose.legs = { f: 9, b: -9, fk: 6, bk: 6 }; pose.sink = 5; }
    else if (k < .56) { const q = ease(span(k, .4, .56)); pose.arm = lerp(2.4, -3, q) ; pose.backArm = lerp(1.6, -2.7, q); pose.lean = lerp(.15, -.5, q); pose.legs = { f: 8, b: -5, fk: 12, bk: 8 }; }
    else { const q = ease(span(k, .56, .66)), r = span(k, .82, 1);
      pose.arm = lerp(-3, 1.5, q); pose.backArm = lerp(-2.7, 1.4, q); pose.lean = lerp(-.5, .8, q) * (1 - .7 * r); pose.sink = 11 * q * (1 - .6 * r);
      pose.legs = { f: lerp(8, 14, q), b: lerp(-5, -13, q), fk: lerp(12, 10, q), bk: 1 };
      if (k < .76) { pose.trail = 96; pose.trailFrom = -3; pose.trailCol = 'rgba(255,214,120,.98)'; pose.trailW = 12; }
    }
  },
  // ---- rapier ----
  'rapier:JH'(pose, m, k) { pose.legs = { f: 8, b: -6, fk: 13, bk: 3 }; pose.backArm = 3.5; pose.backElbow = -.8; pose.flow = 10; },
  'rapier:DA'(pose, m, k) {
    const h0 = m.h[0], e = k < h0 ? -.3 * ease(k / h0) : k < m.h[1] ? Math.min(1, (k - h0) / ((m.h[1] - h0) * .35)) : 1 - span(k, m.h[1], 1) * .7;
    pose.rot = .28 * (k < h0 ? ease(k / h0) : 1); pose.lean = .3; pose.ext = e; pose.arm = .18 - pose.rot; pose.elbow = 0; pose.grip = 0;
    pose.backArm = 3.6; pose.backElbow = -.88; pose.legs = { f: 3, b: -16, fk: 10, bk: 2 }; pose.sink = 2; pose.flow = 16;
  },
  'rapier:HC'(pose, m, k) { // Hellride: a lunge at every one of them, each from a new side
    const n = (P.blinkList && P.blinkList.length) || 1, slot = (m.h[1] - m.h[0]) / n, ph = k < m.h[0] ? -1 : ((k - m.h[0]) / slot) % 1;
    const e = ph < 0 ? -.4 * ease(k / m.h[0]) : ph < .35 ? ease(ph / .35) : 1 - .7 * ease((ph - .35) / .65), p = Math.max(0, e);
    pose.ext = e; pose.legs = { f: lerp(7, 17, p), b: lerp(-9, -17, p), fk: lerp(3, 10, p), bk: lerp(4, 0, p) }; pose.sink = lerp(3, 7, p); pose.lean = lerp(.05, .45, p);
    pose.arm = .03 - pose.lean * .9; pose.elbow = 0; pose.backArm = 3.6; pose.backElbow = -.88; pose.glow = 'rgba(160,140,255,.5)';
  },
};
function movePoseKey(m) { return P.w === 'sword' && m.lvl === 7 ? 'sword:J7' : P.w + ':' + m.key; }

// ---------- blending the prince's pose from frame to frame ----------
// Only the live, on-screen prince is blended (draw.js). Each joint eases toward where this frame's pose wants it with
// its own time constant: the weapon arm quick, the torso and legs a little slower, the back arm and head slowest, so
// a change of move flows instead of snapping. Spins, flips, hit frames and falls are left exact.
const BLEND_TAU = { legX: .08, armS: .07, arm: .055, elbow: .06, grip: .06, ext: .05, backArm: .11, backElbow: .1, backReach: .09, lean: .085, yaw: .1, crouchK: .08, flow: .16 };
const BLEND_ANG = { arm: 1, backArm: 1, grip: 1 };
const BLEND_DEF = { legX: 1, armS: 1, arm: 1.1, elbow: 0, grip: 0, ext: 0, backArm: 1.25, backElbow: -.25, backReach: 0, lean: 0, yaw: 0, flow: 0 };
const BL = { prev: null, at: 0, off: false };
const CHAIN = { on: true, lead: .04 }; // seconds the body leads the weapon arm by (draw.js)
function blendPose(pose) {
  const now = BL.clock ? BL.clock() : performance.now(), dt = Math.min(.1, (now - BL.at) / 1000); BL.at = now;
  pose.crouchK = pose.crouch ? 8 : (pose.sink || 0);
  const prev = BL.prev;
  const hard = BL.off || ['down', 'dead'].includes(P.state) || pose.down || dt <= 0;
  const m = P.move, live = (P.state === 'atk' || P.state === 'air') && m, k = live ? P.t / m.dur : 0;
  const active = live && k >= m.h[0] - .02 && k <= m.h[1] + .04; // the strike itself stays exactly on its arc
  const twirl = live && (m.twirl || m.flurry || m.weave);
  if (prev && !hard) {
    for (const f in BLEND_TAU) {
      if (prev[f] === undefined) continue;
      if (active && (f === 'arm' || f === 'elbow' || f === 'grip' || f === 'ext')) continue;
      if (twirl && (f === 'grip' || f === 'ext' || f === 'arm')) continue;
      const tgt = pose[f] ?? BLEND_DEF[f]; let d = tgt - prev[f];
      if (BLEND_ANG[f]) d = Math.atan2(Math.sin(d), Math.cos(d));
      const tau = f === 'arm' && live ? .045 : BLEND_TAU[f];
      if (Math.abs(d) > 1e-4) pose[f] = prev[f] + d * (1 - Math.exp(-dt / tau));
    }
    // the legs: blended when both frames plant them; leaving a planted stance for the plain stance eases out of it too
    const st = pose.stance && !pose.walk ? { f: 7, b: -7, fk: 9, bk: 9 } : null, tl = pose.legs || (pose.kickK === undefined && !pose.walk && !pose.run ? st : null);
    if (prev.legs && tl && pose.kickK === undefined) {
      const a = 1 - Math.exp(-dt / .075), L = {};
      for (const j of ['f', 'b', 'fk', 'bk']) L[j] = prev.legs[j] + (tl[j] - prev.legs[j]) * a;
      L.w = (prev.legs.w || 1) + ((tl.w || 1) - (prev.legs.w || 1)) * a; // how wide the feet are set
      if (pose.legs || Math.abs(L.f - tl.f) + Math.abs(L.b - tl.b) + Math.abs(L.fk - tl.fk) > .6) pose.legs = L;
    }
  }
  const keep = {}; for (const f in BLEND_TAU) keep[f] = pose[f] ?? BLEND_DEF[f];
  keep.legs = pose.legs ? Object.assign({}, pose.legs) : (pose.stance && !pose.walk ? { f: 7, b: -7, fk: 9, bk: 9 } : null);
  if (!keep.legs && pose.walk && !pose.run && pose.stance && !pose.crouch) { const w = Math.sin(pose.walk) * 11.5; keep.legs = { f: -w, b: w, fk: 1.5, bk: 1.5, w: 1 }; } // mid-stride, so stopping eases the feet into his stance
  BL.prev = keep;
  return pose;
}

// ---------- the forge's armor card: the Rose Mail on its own, from the front ----------
// the prince's costume on a stand: the quilted black doublet, white sleeves and jabot, steel pauldrons and vambraces,
// belts and gold-edged tabs, the cloak hanging behind; then a leather baldric at 2, a steel breastplate at 3, bright
// silver at 4 and violet-runed shadow-steel with a gilt edge at 5. The silver rose pins the cloak at the throat.
function drawArmorSuit(lv) {
  const L = heroLook(), gold = '#D8AA55', det = !FLASH && !TINT;
  const poly = (pts, col, w = 1.4) => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); ctx.fillStyle = typeof col === 'string' ? C(col) : col; ctx.fill(); outline(w); };
  const vg = (x0, x1, col) => { const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, C(shade(col, -.35))); g.addColorStop(.6, C(col)); g.addColorStop(1, C(shade(col, .3))); return g; };
  const steel = (y0, y1, col) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, C(shade(col, .5))); g.addColorStop(.45, C(col)); g.addColorStop(1, C(shade(col, -.3))); return g; };
  // the stand: a post and a foot
  ctx.fillStyle = C('#3A2A20'); ctx.fillRect(-1.6, 6, 3.2, 22); outline(1);
  poly([-11, 30, 11, 30, 7, 26, -7, 26], '#4A3428', 1.2);
  // the cloak behind, its hem torn into brushstrokes
  ctx.beginPath(); ctx.moveTo(-15, -22); ctx.lineTo(15, -22); ctx.lineTo(20, 18);
  for (let i = 0; i <= 10; i++) { const x = 20 - i * 4, y = 18 + (i % 2 ? 2 : 6) + Math.sin(i * 2.3) * 1.5; ctx.lineTo(x, y); }
  ctx.closePath(); ctx.fillStyle = C(L.cloak); ctx.fill(); outline(1.2);
  if (det) { ctx.lineCap = 'round'; for (const [c, xs] of [[L.cloakSlate, [-16, -9, 11, 17]], [L.cloakGrey, [-13, 14]]]) { ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.beginPath(); for (const x of xs) { ctx.moveTo(x * .8, -14); ctx.lineTo(x * 1.05, 24); } ctx.stroke(); } }
  // gold-edged tabs over the hips
  for (const x of [-10, -5, 0, 5]) { poly([x, 2, x + 5, 2, x + 5.6, 12, x - .6, 12], shade(L.body, .1), 1); ctx.strokeStyle = C(L.trim); ctx.lineWidth = .8; ctx.strokeRect(x + .6, 2.8, 3.8, 8.4); }
  // the doublet: a broad V of shoulders down to the waist, quilted in a diamond lattice
  poly([-15, -22, 15, -22, 12, -10, 9, 3, -9, 3, -12, -10], vg(-15, 15, L.body), 1.6);
  if (det) { ctx.save(); ctx.beginPath(); ctx.moveTo(-15, -22); ctx.lineTo(15, -22); ctx.lineTo(12, -10); ctx.lineTo(9, 3); ctx.lineTo(-9, 3); ctx.lineTo(-12, -10); ctx.closePath(); ctx.clip();
    ctx.strokeStyle = L.lattice; ctx.lineWidth = .5; ctx.beginPath(); for (let k = -30; k <= 30; k += 5) { ctx.moveTo(k - 8, -22); ctx.lineTo(k + 8, 4); ctx.moveTo(k + 8, -22); ctx.lineTo(k - 8, 4); } ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = C(L.button); for (let k = 0; k < 5; k++) { circle(0, -11 + k * 3, .8); ctx.fill(); }
  if (lv === 2) { ctx.strokeStyle = C(L.strap || '#4A3022'); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-12, -19); ctx.lineTo(9, 1); ctx.stroke(); }
  if (lv >= 3) { // the breastplate, lit from the upper right
    const pc = L.plate;
    const g = ctx.createLinearGradient(-11, -20, 11, 0); g.addColorStop(0, C(shade(pc, -.25))); g.addColorStop(.55, C(pc)); g.addColorStop(.72, C(shade(pc, .45))); g.addColorStop(1, C(pc));
    ctx.beginPath(); ctx.moveTo(-11, -15); ctx.quadraticCurveTo(0, -19, 11, -15); ctx.lineTo(9, -4); ctx.quadraticCurveTo(0, 2, -9, -4); ctx.closePath(); ctx.fillStyle = g; ctx.fill(); outline(1.4);
    if (lv >= 4) { ctx.strokeStyle = C(lv >= 5 ? gold : '#E4E8F0'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-9, -5); ctx.quadraticCurveTo(0, 1, 9, -5); ctx.moveTo(0, -17); ctx.lineTo(0, -1); ctx.stroke(); }
    if (lv >= 5) { ctx.save(); if (!FLASH) { ctx.shadowColor = '#B89CFF'; ctx.shadowBlur = 6; } ctx.strokeStyle = C('#B89CFF'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-5, -13); ctx.lineTo(-3, -9); ctx.lineTo(-5, -5); ctx.moveTo(5, -13); ctx.lineTo(3, -9); ctx.lineTo(5, -5); ctx.stroke(); ctx.restore(); }
  }
  // the belts: one at the waist with a brass buckle, the sword belt slung lower across it
  ctx.lineCap = 'butt'; for (const [y0, y1, w, c] of [[0, 0, 3.4, L.leather], [4, 1, 2.4, shade(L.leather, -.12)]]) { ctx.beginPath(); ctx.moveTo(-10, y0); ctx.lineTo(10, y1); ctx.strokeStyle = FLASH ? '#FFFFFF' : OUT; ctx.lineWidth = w + 1.6; ctx.stroke(); ctx.strokeStyle = C(c); ctx.lineWidth = w; ctx.stroke(); }
  ctx.fillStyle = C(L.brass); ctx.fillRect(-1.8, -1.9, 3.6, 3.8); ctx.fillStyle = C(shade(L.leather, -.4)); ctx.fillRect(-.9, -1, 1.8, 2);
  // the cloak over the shoulders, the high white collar and the jabot
  ctx.beginPath(); ctx.moveTo(-17, -17); ctx.quadraticCurveTo(-12, -27, -4, -27); ctx.lineTo(-3, -21); ctx.lineTo(-9, -19); ctx.closePath(); ctx.moveTo(17, -17); ctx.quadraticCurveTo(12, -27, 4, -27); ctx.lineTo(3, -21); ctx.lineTo(9, -19); ctx.closePath(); ctx.fillStyle = C(L.cloak); ctx.fill(); outline(1.1);
  poly([-5, -22, -4.4, -30, -1, -27, 1, -27, 4.4, -30, 5, -22, 0, -20], shade(L.shirt, -.1), 1.1);
  for (let k = 3; k >= 0; k--) { const y = -22 + k * 2.4, w = 3 + k * .7; poly([-w * .5, y, -w, y + 3.4, -w * .3, y + 4.4, w * .3, y + 4.4, w, y + 3.4, w * .5, y], k % 2 ? shade(L.shirt, -.06) : L.shirt, .7); }
  // shoulders: steel pauldrons; sleeves of white shirt hanging empty, steel vambraces over them
  for (const d of [-1, 1]) {
    ctx.save(); ctx.scale(d, 1);
    ctx.beginPath(); ctx.moveTo(19, -16); ctx.quadraticCurveTo(22, -4, 20, 6); ctx.lineTo(15, 6); ctx.quadraticCurveTo(16, -4, 13, -13); ctx.closePath(); ctx.fillStyle = C(L.shirt); ctx.fill(); outline(1.3);
    ctx.beginPath(); ctx.moveTo(14.6, -3); ctx.lineTo(20.6, -3.6); ctx.lineTo(20.4, 5.6); ctx.lineTo(15, 5.6); ctx.closePath(); ctx.fillStyle = steel(-3, 6, L.steel); ctx.fill(); outline(1);
    ctx.fillStyle = C(L.leather); ctx.fillRect(14.8, -.4, 5.8, 1.4); ctx.fillRect(14.9, 3, 5.6, 1.3);
    for (const [cy, rx, ry] of [[-13.4, 6.2, 3.4], [-15.6, 6.8, 3.4]]) { ctx.beginPath(); ctx.ellipse(16, cy, rx, ry, .25, 0, Math.PI); ctx.closePath(); ctx.fillStyle = steel(cy - 1, cy + ry, L.pauldron); ctx.fill(); outline(1); }
    ctx.beginPath(); ctx.ellipse(15.4, -18, 7.4, 5.6, .25, Math.PI, TAU); ctx.ellipse(15.4, -18, 7.4, 1.8, .25, 0, Math.PI); ctx.fillStyle = steel(-24, -16, L.pauldron); ctx.fill(); outline(1.2);
    if (lv >= 4) { ctx.strokeStyle = C(lv >= 5 ? gold : '#E4E8F0'); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.ellipse(15.4, -18, 6.2, 4.4, .25, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
    ctx.fillStyle = C(L.glove); rrect(15, 5, 5.4, 6, 2); ctx.fill(); outline(1);
    ctx.restore();
  }
  CORWIN.roseClasp(0, -24, 2.6, L.steel); // the silver rose at the throat
  if (lv >= 5 && !FLASH) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, -8, 4, 0, -8, 34); g.addColorStop(0, 'rgba(184,156,255,.22)'); g.addColorStop(1, 'rgba(184,156,255,0)'); ctx.fillStyle = g; ctx.fillRect(-34, -42, 68, 68); ctx.restore(); }
}
