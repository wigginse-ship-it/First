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
    if (airborne && k < .5 && Math.random() < dt * 22) addGhost(false); // pale afterimages trace the flip
    for (const [n, at] of [[1, .2], [2, .36]]) if (k >= at && (P.vaultChip || 0) < n) { P.vaultChip = n; // two quick hits as the staff whirls round through the vault (the big blow still comes at the end)
      for (const e of enemies) if (!e.dead && Math.abs(e.x - P.x) < 62 + e.hw && Math.abs(e.y - P.y) < 30 && Math.abs(e.z - P.z) < 90) { const d = 4 * wMult(P.w); strike(e, d, Math.sign(e.x - P.x) || P.facing, { dmg: d, kb: 30, launch: 0, power: 0, noStun: 1, chip: 1 }); } }
    if (k < .2) P.vaultChip = 0;
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
        const hs = hitstop; strike(e, m.dmg * wMult(P.w) * (P.blinkTwin && i > 0 ? .65 : 1), P.facing, m); P.hits.set(e, P.t); // (the twin ride's second thrust is the lighter one)
        if (P.blinkI > 1) hitstop = Math.max(hs, Math.min(hitstop, .06)); // only the first thrust gets the full crit freeze: the rest keep the ride moving
        fx.push({ kind: 'slash', x: e.x, y: e.y, z: e.z + e.hh * .55, ang: rand(-.3, .3), t: .3, max: .3, size: 34 + e.hw, col: '#C8D0FF' }); sfx('slice');
      }
    }
    if (P.blinkDouble && k >= m.h[0]) { // the third glint: every one he steps to is run through twice, the second thrust a beat after the first
      const off = Math.min(slot * .45, .15 / m.dur), j = Math.floor((k - m.h[0] - off) / slot);
      if (j >= (P.blinkJ || 0) && j < n && j < P.blinkI) {
        P.blinkJ = j + 1; const e = P.blinkList[j];
        if (!e.dead && enemies.includes(e)) {
          const hs = hitstop; strike(e, m.dmg * wMult(P.w) * .65, P.facing, m); P.hits.set(e, P.t);
          hitstop = Math.max(hs, Math.min(hitstop, .06));
          fx.push({ kind: 'slash', x: e.x, y: e.y, z: e.z + e.hh * .6, ang: rand(-.3, .3) + 1.2, t: .26, max: .26, size: 28 + e.hw, col: '#E8D8FF' }); sfx('slice');
        }
      }
    }
  }
  if (m.twinAt && !P.twinDone && k >= m.twinAt) rapierTwin(m);
  return false;
}
// ---------- the rapier's charge (game.js, state 'charge'): two glints down the blade, then the Rose Thrust ----------
function rapierChime(lvl) { // a small clear chime for each glint, a note higher and brighter for the second, and a deeper, darker one for the third
  if (typeof sfxOn === 'undefined' || !sfxOn || !actx) return;
  try { if (lvl >= 3) [523, 784, 1047, 1568].forEach((f, i) => tone(f, .36 - i * .05, i ? 'sine' : 'triangle', .07, 0, i * .06)); else (lvl === 2 ? [1976, 2637, 3322] : [1760, 2349]).forEach((f, i) => tone(f, .24 - i * .04, 'sine', lvl === 2 ? .07 : .055, 0, i * .05)); } catch (err) {}
}
function rapierChargeCue(lvl) {
  rapierChime(lvl);
  const hx = P.x + P.facing * 24, hz = P.z + 56; // about where the guard is, drawn back by his shoulder
  if (lvl === 2) for (let i = 0; i < 4; i++) parts.push({ x: hx + P.facing * rand(0, 8), y: P.y + rand(-2, 2), z: hz + rand(-3, 3), vx: P.facing * rand(30, 110), vy: rand(-8, 8), vz: rand(70, 150), life: rand(.45, .7), max: .7, col: pick(['#C8506A', '#E07890', '#F2A8B8']), size: rand(2, 3), shape: 'tuft', rot: rand(0, TAU), vr: rand(-9, 9) }); // a flick of rose petals off the guard
  if (lvl === 3) for (let i = 0; i < 5; i++) parts.push({ x: hx + rand(-4, 4), y: P.y + rand(-3, 3), z: hz + rand(-4, 4), vx: rand(-20, 20), vy: 0, vz: rand(10, 40), life: .4, max: .4, col: pick(['rgba(42,24,64,.7)', 'rgba(90,60,140,.6)']), size: rand(2.5, 4), shape: 'puff', rot: 0, vr: 0 }); // a breath of Shadow off the guard
}
function rapierRelease(lvl) { // let go: a tap is the Lunge; charged, the charged lunge or Rose Thrust, or once it is learned the Hellride
  const T = WEAPONS.rapier.tree;
  if (lvl < 1) { begin(T.H); return; }
  const on = enemies.filter(e => !e.dead && e.x > camX - e.hw && e.x < camX + VW + e.hw);
  const foe = lvl >= 2 && on.length === 1 ? on[0] : null; // the second glint, and exactly one on screen (a boss counts): the blade strikes them twice
  if (unlocked(T.HC)) { // Hellride: the first glint rides as it always has; the second, against a lone foe, steps out of Shadow beside them twice;
    // the third (held past 1.5 s) runs every one of them through twice
    if (lvl >= 3) { begin(T.HC); P.blinkDouble = true; P.blinkJ = 0; return; }
    begin(foe ? Object.assign({}, T.HC, { dur: .7, h: [.12, .62] }) : T.HC);
    if (foe && P.blinkList && P.blinkList.length === 1 && P.blinkList[0] === foe) { P.blinkList.push(foe); P.blinkTwin = true; }
    return;
  }
  if (lvl === 1) { begin(T.HC1); return; }
  if (foe && Math.abs(foe.x - P.x) < 300) P.facing = Math.sign(foe.x - P.x) || P.facing;
  begin(foe ? Object.assign({}, T.HC2, T.HC2.lone, { lone: null }) : T.HC2);
  P.twinE = foe; P.twinDone = false;
}
function rapierTwin(m) { // out of the lunge he recovers half a step and runs the lone foe through a second time
  P.twinDone = true; const e = P.twinE;
  if (!e || e.dead || !enemies.includes(e)) return;
  const dx = (e.x - P.x) * P.facing;
  if (dx > e.hw + 70) P.x += P.facing * Math.min(50, dx - e.hw - 70); // (a short step after them if the first thrust drove them back)
  P.vx = dx > e.hw + 50 ? P.facing * 160 : 0; // (already close: he stabs from where he stands)
  const d2 = (e.x - P.x) * P.facing;
  if (d2 < -e.hw - 10 || d2 > m.x1 + e.hw + 40 || Math.abs(e.y - P.y) > 44 || !zOverlap(P.z - 6, 90, e.z, e.hh)) return;
  const m2 = Object.assign({}, m, { kb: m.twinKb || m.kb, twinAt: 0, lunge: 0, power: 2, wall: 1 }); // (the first stab only pins them; the second is the heavy one)
  strike(e, m.dmg * (m.twinDmg || .65) * wMult(P.w), P.facing, m2); P.hits.set(e, P.t);
  fx.push({ kind: 'slash', x: e.x - P.facing * e.hw * .3, y: e.y, z: e.z + e.hh * .55, ang: 0, t: .22, max: .22, size: 26 + e.hw * .5, col: '#F2E4EC' }); sfx('slice');
}
function rapierChargePose(pose) { // en garde and drawn back: weight settling on the back leg, the point held level at them
  const q = sstep(Math.min(1, (P.ct || 0) / .4));
  pose.crouch = 0; pose.glow = ''; pose.walk = 0; pose.trail = 0;
  pose.legs = { f: lerp(7, 10, q), b: lerp(-7, -12, q), fk: lerp(9, 6, q), bk: lerp(9, 13, q) }; pose.sink = lerp(2, 5, q); pose.lean = lerp(.04, -.06, q);
  pose.arm = lerp(.08, .3, q) - pose.lean * .9; pose.elbow = lerp(.3, 1.2, q); pose.grip = lerp(.15, .95, q); pose.ext = lerp(-.1, -.3, q); // the sword hand drawn back by the shoulder, the blade kept level
  rapierOffHand(pose, 'guard', 0, q);
  pose.rGlint = { lvl: P.clvl || 0, k: P.clvl ? ((P.ct || 0) - (P.clAt || 0)) / .26 : 9 }; // the glint runs down the blade (art_rapier.js)
}
{ const _pp = playerPose; playerPose = function () { const pose = _pp(); if (P && P.state === 'charge' && P.w === 'rapier' && !pose.down) rapierChargePose(pose); return pose; }; }
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
  'fists:X'(pose, m, k) { // Rising Fist: sink into the knees with the lead fist dropped to the hip, then drive up off the legs, the fist
    // travelling close up the body past the chin, the hips turning through, and he goes up with it, the arm finishing long overhead
    const t = k * m.dur, t0 = m.dur * m.h[0] * .8, t1 = m.dur * m.h[1], air = !!m.rise; // (absolute times: the grounded fallback, rise 0, is shorter)
    pose.trail = 0; pose.streak = null; delete pose.sweep; pose.spin = 0; pose.rot = 0; pose.ext = 0; pose.flow = 0;
    if (t < t0) { const q = ease(t / t0); // the load: knees bent, hips turned away, the lead shoulder dropped and the fist down by the hip
      pose.sink = 12 * q; pose.lean = .36 * q; pose.yaw = -.34 * q; pose.shift = -1.2 * q;
      pose.legs = { f: 10, b: -10, fk: 3 + 9 * q, bk: 3 + 8 * q };
      pose.arm = lerp(1, 1.55, q); pose.elbow = lerp(1.9, 1.45, q); // the upper arm let down beside the ribs, the forearm level in front: the fist down at the hip
      pose.backArm = lerp(1.3, 1.15, q); pose.backElbow = lerp(2, 2.2, q); // the rear fist guarding the chin
    } else if (t < t1 + .03) { const q = sstep((t - t0) / (t1 + .03 - t0)); // the drive: legs straighten, hips turn through, the fist rises in a tight arc up the body
      pose.sink = lerp(12, -3, q); pose.lean = lerp(.36, -.1, q); pose.yaw = lerp(-.34, .3, q); pose.shift = lerp(-1.2, .8, q);
      pose.legs = air ? { f: lerp(10, 7, q), b: lerp(-10, -9, q), fk: lerp(12, 11, q), bk: lerp(11, 0, q), fl: 17 * q } : { f: 10, b: lerp(-10, -8, q), fk: lerp(12, 2, q), bk: lerp(11, 1, q), bh: .7 * q }; // the lead knee driven up, the back leg long beneath him (on the street: up onto the back toes)
      pose.arm = lerp(1.55, -.5, q); pose.elbow = lerp(1.45, 1.2, q); // the elbow stays bent: the fist goes up close to the body, not round it
      pose.backArm = lerp(1.15, 1.5, q); pose.backElbow = lerp(2.2, 2.45, q); // the off hand pulled in to the ribs
      pose.flow = 3 * q;
    } else if (air) { const q = sstep((t - t1 - .03) / .14), d = sstep(span(k, .8, 1)); // the follow-through: carried up behind the fist, the arm reaching long overhead
      pose.sink = -3; pose.lean = lerp(-.1, -.16, q) * (1 - d) + .04 * d; pose.yaw = lerp(.3, .22, q) * (1 - d) + .1 * d; pose.shift = .8 * (1 - d);
      pose.legs = { f: lerp(7, 6, d), b: lerp(-9, -4, d), fk: lerp(11, 10, d), bk: lerp(0, 8, d), fl: lerp(17, 10, d), bl: 7 * d }; // the lead knee high, the other leg long; near the top both fold up toward the jump's
      pose.arm = lerp(-.5, -1.32, q) + .2 * d; pose.elbow = lerp(1.2, .3, q) + .25 * d; pose.ext = .5 * q * (1 - d);
      pose.backArm = 1.5; pose.backElbow = 2.45; pose.flow = 3;
    } else { const q = sstep((t - t1 - .03) / Math.max(.05, m.dur - t1 - .03)); // grounded (it could not leave the street): the fist comes back to the guard
      pose.sink = lerp(-3, 2, q); pose.lean = lerp(-.1, .06, q); pose.yaw = lerp(.3, 0, q); pose.legs = { f: 9, b: -8, fk: lerp(2, 3, q), bk: lerp(1, 3, q), bh: .7 * (1 - q) };
      pose.arm = lerp(-.5, 1, q); pose.elbow = lerp(1.2, 1.9, q); pose.backArm = lerp(1.5, 1.3, q); pose.backElbow = lerp(2.45, 2, q);
    }
  },
  'fists:D'(pose, m, k) { // Running Haymaker: pulled up off the run with the lead fist raised high, cocked above his head, then one short
    // overhand, the fist coming down from that upward angle and on into them, his whole body pitched forward behind it like a dash
    const h0 = m.h[0], h1 = m.h[1], air = P.z > 2;
    pose.trail = 0; pose.streak = null; delete pose.sweep; pose.spin = 0; pose.rot = 0; pose.ext = 0; delete pose.kick; delete pose.kickK;
    if (k < h0) { const q = ease(k / h0); // the wind-up: the weight back on the rear foot, the chest turned away, the fist raised high
      pose.arm = lerp(TAU + 1, 5.15, q); pose.elbow = lerp(1.9, 1.1, q); // lifted up in front from the guard: the upper arm raised almost straight up, the fist cocked just behind his head
      pose.backArm = lerp(1.3, .55, q); pose.backElbow = lerp(2, 1.1, q); // the rear hand pushed out in front, measuring
      pose.lean = lerp(.3, -.08, q); pose.yaw = -.25 * q; pose.sink = 2 + 4 * q; pose.shift = -1.6 * q;
      pose.legs = { f: lerp(9, 13, q), b: lerp(-9, -12, q), fk: lerp(5, 7, q), bk: lerp(4, 7, q) }; pose.flow = 8;
    } else if (k < h1 + .06) { const q = sstep((k - h0) / (h1 + .06 - h0)); // the throw: down from above and forward, the hips and chest turning through
      pose.lean = lerp(-.08, .8, q); pose.yaw = lerp(-.25, .55, q); pose.sink = lerp(6, 9, q); pose.shift = lerp(-1.6, 4, q); // pitched forward, low, the weight thrown over the front foot
      pose.arm = lerp(5.15, TAU + .1, q); pose.elbow = lerp(1.1, .15, q) + .25 * Math.sin(Math.PI * q); // the elbow kept a little bent on the way down, straightening into them
      pose.backArm = lerp(.55, 2.5, q); pose.backElbow = lerp(1.1, .7, q); // the rear arm flung back for balance
      pose.backReach = 0; pose.flow = 14;
      pose.legs = air ? { f: 14, b: -15, fk: 10, bk: 6, fl: 6 * q } : { f: lerp(13, 17, q), b: lerp(-12, -21, q), fk: lerp(8, 12, q), bk: lerp(3, 0, q), bh: .7 * q }; // the front knee driving forward, the back leg long behind
    } else { const q = sstep((k - h1 - .06) / (1 - h1 - .06)), r = sstep(span(k, .8, 1)); // the follow-through, landing on the front foot, then back to the guard
      pose.lean = lerp(.8, .2, r); pose.yaw = lerp(.55, .15, r); pose.sink = 9 * (1 - r) + 2 * r; pose.shift = 4 * (1 - r);
      pose.arm = lerp(TAU + .1, TAU + .35, q) * (1 - r) + (TAU + 1) * r; pose.elbow = lerp(.15, .4, q) * (1 - r) + 1.9 * r; // (TAU + 1 is the guard: the fist settles down into it)
      pose.backArm = lerp(2.5, 1.3, r); pose.backElbow = lerp(.7, 2, r); pose.flow = 10 * (1 - r);
      pose.legs = air ? { f: 14, b: -14, fk: 9, bk: 7 } : { f: lerp(17, 10, r), b: lerp(-21, -10, r), fk: lerp(12, 5, r), bk: lerp(0, 4, r), bh: .7 * (1 - r) };
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
  'hammer:DX'(pose, m, k) { // Leaping Slam: up off the run, the hammer lifted in both hands over the front and back behind his head, then down into the street
    pose.trail = 0; delete pose.sweep; pose.spin = 0; pose.rot = 0;
    const h0 = m.h[0];
    if (k < h0) { const q = sstep(k / h0);
      pose.arm = lerp(1.2, -2.6, q); pose.backArm = pose.arm; pose.backElbow = .15; pose.lean = lerp(.25, -.35, q); pose.sink = 0;
      pose.legs = { f: 8, b: -9, fk: lerp(4, 12, q), bk: lerp(4, 10, q), fl: 8 * q }; pose.flow = 8; // knees drawn up under him at the top
      if (k > h0 * .5) { pose.trail = 64; pose.trailFrom = pose.arm + 1.2; pose.trailCol = tcolOf(m); pose.trailW = 6; }
    } else { const q = ease(span(k, h0, h0 + .1)), r = span(k, .84, 1);
      pose.arm = lerp(-2.6, 1.42, q); pose.backArm = pose.arm - .05; pose.backElbow = .15;
      pose.lean = lerp(-.35, .75, q) * (1 - .7 * r); pose.sink = (P.z > 2 ? 0 : 12 * q) * (1 - .7 * r);
      pose.legs = P.z > 2 ? { f: 10, b: -9, fk: 8, bk: 6 } : { f: 11, b: -11, fk: 12 * (1 - .5 * r), bk: 15 * (1 - .7 * r) }; // landing into a deep crouch behind the blow
      if (k < h0 + .16) { pose.trail = 68; pose.trailFrom = -2.6; pose.trailCol = tcolOf(m); pose.trailW = 10; }
    }
  },
  'hammer:R'(pose, m, k) { // Overhead Drive, the dodge counter's heavy form (the light Lunging Drive keeps draw.js's plain dodge lunge and is left alone):
    // the hammer whipped back behind him, up over his head and down into the same forward drive, held there, then eased out of it
    if (!m.overhead) return;
    const end = .82, a0 = 2.7, fwd = m.arc[0] - .6 * .9; // a0: the forward dodge's flung-back arms; fwd: the drive's forward position (draw.js's thrust at full lean, .6)
    const body = (e, lean) => { // draw.js's dodge lunge, at extension e
      pose.lean = lean; pose.sink = 6 - 2 * e; pose.legs = { f: 12 + 5 * e, b: -14 - 5 * e, fk: 8, bk: 0, bh: .6 * e }; pose.shift = 2.6 * e; pose.yaw = .2 * e; pose.backArm = lerp(1.4, 2.6, e); pose.flow = 14 * e; pose.ext = e;
    };
    pose.elbow = 0; pose.grip = 0; pose.trail = 0;
    if (k < .31) { // back, up and over: one quick wheel, slow behind him and fast over the top
      const q = span(k, 0, .31), w = q < .3 ? .22 * sstep(q / .3) : .22 + .78 * Math.pow((q - .3) / .7, 1.4);
      const a = lerp(a0, TAU + fwd, w); pose.arm = a > Math.PI ? a - TAU : a;
      const up = Math.sin(Math.PI * Math.min(1, w * 1.35)); // most upright with the hammer over his head
      body(.3 * w + .7 * Math.pow(w, 3), lerp(.42, .6, w) - .5 * up); pose.ext = Math.max(0, w * 1.2 - .2); pose.streak = null;
      if (w > .3) { pose.trail = 66; pose.trailFrom = pose.arm - Math.min(2.3, (w - .2) * 4.5); pose.trailCol = tcolOf(m); pose.trailW = 9; }
    } else if (k < end) { // driven in and held there, the whole body stretched out behind the head
      body(1, .6); pose.arm = fwd;
      if (k < .4) { pose.trail = 66; pose.trailFrom = fwd - 2.3 * (1 - span(k, .31, .4)); pose.trailCol = tcolOf(m); pose.trailW = 9; }
      if (k > m.h[1] + .1) pose.streak = null;
    } else { const e = 1 - sstep(span(k, end, 1)); body(e, .3 + .3 * e); pose.arm = m.arc[0] - pose.lean * .9; pose.streak = null; }
  },
  'hammer:D'(pose, m, k) { // Battering Run: off the run the hammer trails behind him at the waist; the hips and chest turn and it is swept round
    // flat in front of him, level, at full stretch, and carried on across his body before he gathers it back
    delete pose.kick; pose.streak = null; pose.trail = 0; pose.spin = 0; pose.crouch = 0; pose.elbow = 0; pose.grip = 0; pose.flat = null;
    const w0 = .08, s1 = .36, s2 = .56; // wound by w0, in front of him at s1, the follow-through spent by s2
    // th: the hammer's way round him, seen from above: 0 straight behind, PI/2 out to our side, PI in front, past PI across to the far side
    const th = k < w0 ? 0 : k < s1 ? Math.PI * Math.pow(span(k, w0, s1), 1.35) : k < s2 ? Math.PI + 1.05 * Math.sin(Math.PI / 2 * span(k, s1, s2)) : Math.PI + 1.05 * (1 - sstep(span(k, .7, 1)));
    // the sweep turns the arm's whole line about the shoulder (swept back it points along arm + PI), so to keep the head a little
    // below his shoulder all the way round, against his forward lean, the arm reads -.5 behind him and .14 in front;
    // past the front the swing's own weight lifts it a little round toward his far shoulder
    const lv = th <= Math.PI ? lerp(-.5, .14, (1 - Math.cos(th)) / 2) : .14 - .5 * (th - Math.PI);
    pose.sweep = -Math.cos(th); pose.ext = .5 + .5 * Math.sin(th / 2);
    if (k < w0) { pose.sweep = 1; pose.arm = lerp(1.9, Math.PI - .5, sstep(k / w0)); } // from the run's trailing carry back to the waist (unswept, the same place as -.5 swept fully back)
    else pose.arm = k > .7 ? lerp(lv, .95, sstep(span(k, .7, 1))) : lv; // and at the end let down in front
    const turn = k < w0 ? sstep(k / w0) : 1, g = sstep(span(k, w0, s2)), r = sstep(span(k, .72, 1)); // wound, swung through, recovered
    pose.yaw = (lerp(-.5, .6, g) * turn) * (1 - r) + .1 * r; // turned away to wind, then the hips and chest open to us as it comes through
    pose.lean = (k < w0 ? lerp(.36, .14, turn) : lerp(.14, .26, Math.sin(Math.PI * g))) * (1 - r) + .1 * r;
    pose.sink = lerp(3, 6, Math.sin(Math.PI * Math.min(1, g * 1.4))) * (1 - r) + 2 * r; pose.shift = lerp(-1.5, 3, g) * (1 - r);
    pose.legs = { f: lerp(12, 15, g) * (1 - r) + 9 * r, b: lerp(-13, -15, g) * (1 - r) - 9 * r, fk: 7 - 3 * r, bk: lerp(5, 2, g) * (1 - r) + 3 * r, bh: .5 * g * (1 - r) };
    pose.backArm = lerp(1.7, 2.6, g); pose.flow = 12 * (1 - r);
    if (k > w0 + .02 && k < s2 + .08) pose.flat = { r: 68, k: clamp(th / Math.PI, 0, 1) * (k > s2 ? 1 - span(k, s2, s2 + .08) : 1), rev: false, col: tcolOf(m), w: 9 };
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
    // a gymnast's twisting flip: up the planted staff, upside down at the top with the legs split wide, and a full twist
    // (and a half, over a foe, so he comes down facing them) wound into the somersault
    const f = sstep(span(k, .08, .44)), tuck = Math.sin(Math.PI * span(k, .06, .48)), split = Math.sin(Math.PI * span(k, .16, .4));
    pose.rot = TAU * f;
    pose.spin = k < .5 ? -(P.vaultFoe ? 3 : 2) * Math.PI * sstep(span(k, .12, .5)) : 0; // (the facing swaps at .5, where the twist comes round)
    pose.legs = { f: lerp(lerp(7, 8, tuck), 16, split), b: lerp(lerp(-8, 0, tuck), -17, split), fk: lerp(lerp(3, 15, tuck), 1, split), bk: lerp(lerp(3, 15, tuck), 1, split) };
    pose.flow = 18;
    if (k < .5) { pose.arm = lerp(1.0, -.4, ease(span(k, .05, .3))); pose.grip = lerp(.45, 0, span(k, .05, .3)); pose.backArm = 2.6; pose.backElbow = .3; pose.lean = .1; }
    else { const q = ease(span(k, .56, .72)), r = span(k, .84, 1);
      pose.arm = lerp(-2.2, .55, q); pose.grip = 0; pose.backArm = lerp(2.6, 1.5, q); pose.lean = lerp(-.2, .5, q) * (1 - .7 * r);
      pose.legs = { f: lerp(8, 12, q), b: lerp(-2, -11, q), fk: lerp(10, 8, q), bk: 2 }; pose.sink = 8 * q * (1 - .6 * r);
      if (k < .8) { pose.trail = 72; pose.trailFrom = -2.2; pose.trailCol = tcolOf(m); pose.trailW = 6; }
      if (k > .8) { const g = ease(span(k, .8, 1)); pose.arm = lerp(.55, .5, g); pose.backArm = lerp(1.5, 1.4, g); pose.backElbow = .35; }
    }
  },
  'staff:LH'(pose, m, k) { // Rising Spiral: the corkscrew now travels, so he leans into it, the knees tucked and the cloak streaming behind
    const up = Math.sin(Math.PI * clamp(k / .85, 0, 1));
    pose.lean = (pose.lean || 0) + .28 * up; pose.flow = 14 * up;
    if (P.z > 2 || k > .1) pose.legs = { f: 9, b: -6, fk: lerp(4, 13, up), bk: lerp(4, 10, up), fl: 9 * up };
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
    rapierOffHand(pose, 'guard', clamp(e, 0, 1)); pose.legs = { f: 3, b: -16, fk: 10, bk: 2 }; pose.sink = 2; pose.flow = 16;
  },
  'rapier:HC'(pose, m, k) { // Hellride: a lunge at every one of them, each from a new side
    const n = (P.blinkList && P.blinkList.length) || 1, slot = (m.h[1] - m.h[0]) / n, ph = k < m.h[0] ? -1 : ((k - m.h[0]) / slot) % 1;
    const e = ph < 0 ? -.4 * ease(k / m.h[0]) : ph < .35 ? ease(ph / .35) : 1 - .7 * ease((ph - .35) / .65), p = Math.max(0, e);
    pose.ext = e; pose.legs = { f: lerp(7, 17, p), b: lerp(-9, -17, p), fk: lerp(3, 10, p), bk: lerp(4, 0, p) }; pose.sink = lerp(3, 7, p); pose.lean = lerp(.05, .45, p);
    pose.arm = .03 - pose.lean * .9; pose.elbow = 0; rapierOffHand(pose, 'guard', p); pose.glow = 'rgba(160,140,255,.5)';
  },
  'rapier:HC2'(pose, m, k) { // the Rose Thrust: a deep lunge; against a lone foe he recovers half way and stabs again
    const h0 = m.h[0], tw = m.twinAt, out = (a) => Math.min(1, (k - h0) / ((m.h[1] - h0) * a));
    let e;
    if (k < h0) e = -.45 * ease(k / h0);
    else if (!tw) e = k < m.h[1] ? out(.35) : 1 - .8 * ease(span(k, m.h[1] + .08, 1));
    else { const a = tw - .07; e = k < m.h[1] ? out(.4) : k < a ? lerp(1, .2, ease(span(k, m.h[1], a))) : k < tw ? lerp(.2, 1, sstep(span(k, a, tw))) : k < tw + .1 ? 1 : 1 - .8 * ease(span(k, tw + .1, 1)); }
    const p = clamp(e, 0, 1);
    pose.ext = e; pose.legs = { f: lerp(7, 19, p), b: lerp(-9, -18, p), fk: lerp(3, 11, p), bk: lerp(4, 0, p) }; pose.sink = lerp(3, 8, p); pose.lean = lerp(.05, .5, p);
    pose.arm = .03 - pose.lean * .9; pose.elbow = 0; rapierOffHand(pose, 'guard', p);
    if (tw && k >= tw - .03 && k <= tw + .12) pose.streak = { len: WEAPONS.rapier.reach + 30, a: .85 * (1 - span(k, tw + .04, tw + .12)), col: 'rgba(242,228,236,.95)' }; // the second stab's own streak
  },
};
function movePoseKey(m) { return P.w === 'sword' && m.lvl === 7 ? 'sword:J7' : P.w + ':' + m.key; }

// ---------- blending the prince's pose from frame to frame ----------
// Only the live, on-screen prince is blended (draw.js). Each joint eases toward where this frame's pose wants it with
// its own time constant: the weapon arm quick, the torso and legs a little slower, the back arm and head slowest, so
// a change of move flows instead of snapping. Spins, flips, hit frames and falls are left exact.
const BLEND_TAU = { legX: .08, armS: .07, arm: .055, elbow: .06, grip: .06, ext: .05, backArm: .11, backElbow: .1, backWrist: .1, backReach: .09, lean: .085, yaw: .1, crouchK: .08, flow: .16, shift: .08, hipLead: .06, leanLead: .07 };
const BLEND_ANG = { arm: 1, backArm: 1, grip: 1 };
const BLEND_DEF = { legX: 1, armS: 1, arm: 1.1, elbow: 0, grip: 0, ext: 0, backArm: 1.25, backElbow: -.25, backWrist: 0, backReach: 0, lean: 0, yaw: 0, flow: 0, shift: 0, hipLead: 0, leanLead: 0 };
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
      for (const j of ['fl', 'bl', 'bh']) { const v = (prev.legs[j] || 0) + ((tl[j] || 0) - (prev.legs[j] || 0)) * a; if (Math.abs(v) > .01) L[j] = v; } // a lifted foot, a raised heel
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

