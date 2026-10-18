'use strict';
// ---------- run state ----------
const SPX = 112, SPY = 72, RUN = 240, JUMP = 360;
// lighter weapons let you move faster; the hammer and great sword keep the base pace
const W_SPEED = { fists: 1.3, staff: 1.18, hammer: 1, sword: 1 };
let mode = 'title';
let stage = null, stageIdx = 0, P = null;
let enemies = [], projs = [], parts = [], fx = [], nums = [], loot = [], props = [], ghosts = [], echoes = [], spawnQ = [];
let camX = 0, lockX = null, waveIdx = 0, waveActive = false, bossSpawned = false, boss = null;
let hitstop = 0, shakeMag = 0, shakeDir = 0, zoom = 0, slowmo = 0, clearT = 0, flashT = 0, hurtFlash = 0;
let runShards = 0, runSigils = 0, comboN = 0, comboT = 0, trumpCharge = 0, mirrorT = 0, stillT = 0, stag = null;
let brandT = 0, brandEl = 'fire', brandN = 0;

function newPlayer() {
  return { x: 80, y: 300, z: 0, vx: 0, vz: 0, facing: 1, state: 'idle', t: 0, hp: maxHp(), inv: 0, walk: 0,
    w: save.owned[save.weapon] ? save.weapon : 'fists', move: null, hits: null, seq: '', q: null, ct: 0, clvl: 0,
    airUsed: false, jvx: 0, jvy: 0, dvx: 0, dvy: 0, knocked: false, ghostT: 0, shocked: false };
}

// ---------- combos ----------
const unlocked = (m) => m && (!m.lvl || save.wl[P.w] >= m.lvl);
function nextMove(key) {
  const w = WEAPONS[P.w], tree = w.tree;
  const chained = P.seq ? tree[P.seq + key] : null;
  if (unlocked(chained)) return chained;
  if (key === 'H' && (w.charge || unlocked(tree.HC))) return 'charge';
  return unlocked(tree[key]) ? tree[key] : null;
}
function begin(m) {
  if (m === 'charge') { P.state = 'charge'; P.ct = 0; P.clvl = 0; P.seq = 'H'; return; }
  if (!m) { P.state = 'idle'; return; }
  P.state = m.dive || (P.z > 0 && !m.hop) ? 'air' : 'atk'; P.move = m; P.t = 0; P.q = null; P.hits = new Map(); P.seq = m.key || 'H'; P.shocked = false; P.waved = false;
  if (Math.abs(input.mx) > 0.3 && !m.dive) P.facing = Math.sign(input.mx);
  P.vx = (m.lunge || 0) * P.facing;
  if (m.hop) P.vz = m.hop;
  if (m.dive) { P.vz = Math.min(P.vz, -120); P.jvx = P.facing * 240; }
  else if (P.state === 'air') { P.vz = Math.max(P.vz, 110); P.jvx *= .3; P.airN = (P.airN || 0) + 1; }
  if (m.launcher) { P.holdUsed = true; P.chaseQ = false; }
  if (stageIdx >= 2 && (m.power === 2 || m.smash)) for (const e of enemies) { // third-world enemies see a big swing coming and hop clear of it
    if (e.dead || e.boss || e.air || !['idle', 'recover'].includes(e.state)) continue;
    const dx = (e.x - P.x) * P.facing;
    if (dx > -10 && dx < (m.x1 || 60) + 50 && Math.abs(e.y - P.y) < 30 && Math.random() < .28) { e.state = 'evade'; e.t = .38; e.vx = Math.sign(e.x - P.x || 1) * 330; e.sqx = .8; e.sqy = 1.15; dust(e.x, e.y, 4); }
  }
  sfx(m.power === 2 || m.rot ? 'whoosh' : 'swing');
}

// ---------- player ----------
function updatePlayer(dt) {
  const w = WEAPONS[P.w];
  P.inv = Math.max(0, P.inv - dt); P.chaseT = Math.max(0, (P.chaseT || 0) - dt);
  const wasAir = P.z > 0 || P.vz > 0;
  if (wasAir) {
    P.vz -= GRAV * dt * (P.state === 'air' && P.move && P.move.dive ? 1.8 : 1);
    P.z += P.vz * dt;
    if (P.z <= 0) { P.z = 0; P.vz = 0; onLand(); }
  }
  const mx = input.mx, my = input.my, sp = W_SPEED[P.w] || 1;
  switch (P.state) {
    case 'idle': case 'walk': case 'run': {
      if (pressed.swap) swapWeapon();
      if (pressed.trump) playTrump();
      const running = input.run && Math.abs(mx) > 0.3;
      if (pressed.jump) { if (P.chaseT > 0) { chaseJump(); break; } P.vz = JUMP; P.state = 'jump'; P.jvx = running ? Math.sign(mx) * RUN * sp * 1.05 : mx * SPX * sp; P.jvy = my * SPY * sp; P.airN = 0; sfx('jump'); dust(P.x, P.y, 5); break; }
      if (pressed.dodge) { startDodge(); break; }
      if (input.light && P.holdL >= .2 && !P.holdUsed) { begin(w.tree.X); break; } // hold Attack: launcher
      if (pressed.light) { const walking = Math.abs(mx) > .5 || Math.abs(my) > .5; begin(running ? w.tree.D : walking && unlocked(w.tree.M) ? w.tree.M : nextMove('L')); break; }
      if (pressed.heavy) { begin(running ? (unlocked(w.tree.DH) ? w.tree.DH : w.tree.D) : nextMove('H')); break; }
      P.seq = '';
      if (running) {
        P.state = 'run'; P.facing = Math.sign(mx); P.x += P.facing * RUN * sp * dt; P.y += my * SPY * sp * .6 * dt; P.walk += dt * 13 * sp; // long, loping strides: fewer steps for the same ground
        P.ghostT -= dt; if (P.ghostT <= 0) { P.ghostT = .05; addGhost(); }
        if (Math.random() < dt * 14) dust(P.x - P.facing * 8, P.y, 1);
      } else {
        const moving = mx !== 0 || my !== 0;
        P.x += mx * SPX * sp * dt; P.y += my * SPY * sp * dt;
        if (Math.abs(mx) > 0.1) P.facing = Math.sign(mx);
        P.state = moving ? 'walk' : 'idle'; P.walk = moving ? P.walk + dt * 11 : 0;
      }
      break;
    }
    case 'jump':
      P.x += P.jvx * dt; P.y += P.jvy * dt;
      if (airSpecial()) break;
      if (pressed.heavy && unlocked(w.tree.AH)) { P.jvy = 0; begin(w.tree.AH); }
      else if ((pressed.light || pressed.heavy) && airNext()) { P.jvy = 0; begin(airNext()); }
      break;
    case 'air': { // air combo: up to three hits, then a spike back to the ground
      const m = P.move, k = P.t / m.dur;
      P.x += P.jvx * dt; P.t += dt;
      if (m.dive || (k >= m.h[0] && k <= m.h[1])) doHits();
      if (m.hover) P.vz = Math.max(P.vz, -15); // the helicopter spin holds you up
      if (!m.hover && airSpecial()) break;
      if (k > .3) { if (pressed.light) P.q = 'L'; if (pressed.heavy) P.q = 'H'; }
      if (!m.dive && P.t >= m.dur) {
        if (P.q === 'H' && unlocked(w.tree.AH)) begin(w.tree.AH);
        else if (P.q && airNext()) begin(airNext());
        else P.state = 'jump';
      }
      break;
    }
    case 'atk': runMove(dt); break;
    case 'charge': {
      P.ct += dt;
      const maxL = save.wl.sword >= 2 ? 3 : 2; // Shadow Cleave is the sword's first upgrade
      const lvl = !w.charge ? (P.ct >= .45 ? 1 : 0) : P.ct >= 1.5 && maxL === 3 ? 3 : P.ct >= .95 ? 2 : P.ct >= .45 ? 1 : 0;
      if (lvl > P.clvl) { P.clvl = lvl; sfx('charge', lvl); burst(P.x - P.facing * 6, P.y, 56, lvl === 3 ? '#C8607A' : '#D8AA55', 8 + lvl * 4, 'spark'); zoom = Math.max(zoom, .02); }
      if (Math.abs(mx) > 0.3) P.facing = Math.sign(mx);
      if (pressed.dodge) { startDodge(); break; }
      if (!input.heavy) {
        if (w.charge) { const m = Object.assign({ key: 'H' }, WEAPONS.sword.charged[P.clvl]); begin(m); }
        else begin(P.ct >= .45 ? w.tree.HC : w.tree.H); // a quick tap is the normal Heavy, a held one the charged special
        P.seq = 'H';
      }
      break;
    }
    case 'dodge':
      P.t -= dt; P.x += P.dvx * dt; P.y += P.dvy * dt;
      if (pressed.light) P.dq = 'L'; if (pressed.heavy) P.dq = unlocked(w.tree.RH) ? 'H' : 'L'; // attack out of a roll
      if (P.dq && P.t < .2) { const k = P.dq; P.dq = false; P.inv = Math.max(P.inv, .15); begin(k === 'H' ? w.tree.RH : w.tree.R); break; }
      P.ghostT -= dt;
      if (P.ghostT <= 0) { // the forward lunge drags a dark trail of afterimages; the backstep leaves a couple of pale ones
        if (P.dk === 'fwd') { P.ghostT = .022; addGhost(true); if (Math.random() < .6) fx.push({ kind: 'speed', x: P.x, y: P.y, z: rand(10, 50), dir: P.facing, t: .22, max: .22 }); }
        else if (P.dk === 'back') { P.ghostT = .07; addGhost(); }
        else P.ghostT = 1;
      }
      if (P.t <= 0) {
        P.state = 'idle';
        if (P.dk === 'side') { for (let i = 0; i < 12; i++) parts.push({ x: P.x + rand(-10, 10), y: P.y + rand(-4, 4), z: rand(4, 50), vx: rand(-60, 60), vy: 0, vz: rand(10, 60), life: .45, max: .45, col: pick(['rgba(42,24,64,.8)', 'rgba(90,60,140,.7)']), size: rand(4, 7), shape: 'puff', rot: 0, vr: 0 }); fx.push({ kind: 'ring', x: P.x, y: P.y, z: 2, t: .25, max: .25, r: 26, col: '#8A6ACF', flat: 1 }); }
        if (P.dk === 'back') dust(P.x, P.y, 5);
      }
      break;
    case 'hurt':
      P.t -= dt; P.x += P.vx * dt; P.vx *= Math.pow(.01, dt);
      if (P.t <= 0 && P.z <= 0) P.state = 'idle';
      break;
    case 'down':
      P.t -= dt; P.x += P.vx * dt; P.vx *= Math.pow(.001, dt);
      if (P.t <= 0) { P.state = 'idle'; P.inv = Math.max(P.inv, .7); }
      break;
    case 'dead':
      P.t -= dt; P.x += P.vx * dt; P.vx *= Math.pow(.01, dt);
      if (P.t <= 0 && mode === 'play') gameOver();
      break;
  }
  if (P.carry > 0) { // momentum from landing a hit: you surge after whatever you just knocked away
    if (P.state === 'atk' || P.state === 'air') P.x += P.facing * P.carry * dt; else P.carry = 0;
    P.carry *= Math.pow(.02, dt);
  }
  P.y = clamp(P.y, FLOOR_TOP + 6, FLOOR_BOT);
  P.x = clamp(P.x, camX + 14, lockX !== null ? lockX + VW - 14 : stage.len - 14);
}
function onLand() {
  dust(P.x, P.y, 6);
  P.airN = 0; P.j2 = false;
  if (P.state === 'jump') { P.state = 'idle'; }
  else if (P.state === 'air' || (P.state === 'atk' && P.move && (P.move.shock || P.move.bounce) && P.move.hop)) {
    const m = P.move;
    if (m.shock && !P.shocked) shockwave(P.x + P.facing * 20, P.y, m.shock, m);
    if (P.state === 'air') { P.state = 'idle'; P.airUsed = false; P.t = 0; }
    else P.t = Math.max(P.t, m.dur * m.h[1]);
  }
  else if (P.state === 'hurt' && P.knocked) { P.state = 'down'; P.t = .6; shakeMag = Math.max(shakeMag, 3); }
}
function runMove(dt) {
  const m = P.move; P.t += dt; const k = P.t / m.dur;
  P.x += P.vx * dt; P.vx *= Math.pow(m.lunge > 300 ? .05 : .004, dt);
  if (m.lunge > 250 || m.rot) { P.ghostT -= dt; if (P.ghostT <= 0) { P.ghostT = .035; addGhost(); } }
  const airborne = P.z > 0;
  if ((k >= m.h[0] && k <= m.h[1]) || (airborne && k >= m.h[0] && (m.bounce || m.shock))) doHits();
  if (m.shock && !m.hop && !P.shocked && k >= m.h[0]) shockwave(P.x + P.facing * (m.x1 * .7), P.y, m.shock, m);
  if (m.wave && !P.waved && k >= m.h[0]) {
    P.waved = true;
    const quake = m.waveKind === 'quake'; // the hammer's crack runs along the ground; the sword's wave is a crescent of light
    projs.push({ owner: 'p', x: P.x + P.facing * 40, y: P.y, z: 0, vx: P.facing * (quake ? 300 : 340), dmg: Math.round((m.wave === 1 ? 40 : m.wave) * wMult(P.w)), life: quake ? .9 : 1, hit: new Set(), wave: 1, quake });
  }
  if (k > .3) { if (pressed.light) P.q = 'L'; if (pressed.heavy) P.q = 'H'; }
  if (pressed.dodge && k > .4) { startDodge(); return; }
  if (m.launcher && pressed.jump) P.chaseQ = true; // a jump pressed during the launcher is remembered
  if (m.launcher && P.chaseQ && k > .35) { P.chaseQ = false; chaseJump(); return; } // leap after the enemy you just launched
  if (m.key === 'L' && input.light && P.holdL >= .18 && !P.holdUsed) { begin(WEAPONS[P.w].tree.X); return; } // held: the jab turns into the launcher
  if (P.t >= m.dur && !(m.hop && airborne)) {
    if (input.light && P.holdL >= .2 && !P.holdUsed && m.key && m.key[0] === 'L') { begin(WEAPONS[P.w].tree.X); return; }
    const nm = P.q ? nextMove(P.q) : null;
    if (nm) begin(nm); else { P.state = 'idle'; }
  }
}
function airSpecial() { // the staff's air tricks: a second vault, or a hovering spin when Attack is held
  const tree = WEAPONS[P.w].tree;
  if (pressed.jump && !P.j2 && unlocked(tree.J2)) { P.j2 = true; P.vz = 0; begin(tree.J2); return true; }
  if (input.light && P.holdL >= .25 && !P.holdUsed && unlocked(tree.AX)) { P.holdUsed = true; begin(tree.AX); return true; }
  return false;
}
function airNext() { return WEAPONS[P.w].tree['A'.repeat((P.airN || 0) + 1)] || null; }
function chaseJump() { // leap up after a launched enemy
  P.state = 'jump'; P.vz = 540; P.jvx = clamp(((P.chaseX || P.x) - P.x) / .55, -280, 280); P.jvy = 0; P.airN = 0; P.chaseT = 0;
  sfx('jump'); dust(P.x, P.y, 8); addGhost();
}
function startDodge() {
  let dx = input.mx, dy = input.my;
  if (!dx && !dy) dx = P.facing;
  const d = Math.hypot(dx, dy) || 1;
  P.state = 'dodge'; P.t = .34; P.dq = false; P.dvx = dx / d * 300; P.dvy = dy / d * 150; P.inv = Math.max(P.inv, .36); P.seq = '';
  // the dash depends on its direction: a low lunge forward, a hopping backstep that keeps you facing the enemy,
  // or a quick sidestep up or down the street
  P.dk = Math.abs(dy) > Math.abs(dx) * 1.2 ? 'side' : Math.sign(dx) === P.facing ? 'fwd' : 'back';
  if (P.dk === 'back' && P.z <= 0) P.vz = 230;
  // each dash has its own look: the forward lunge tears ahead trailing shadow, the backstep kicks off in a spray of dust,
  // and the sidestep is a step through Shadow: he leaves a dark double behind and vanishes for an instant
  const sm = (n, x, y) => { for (let i = 0; i < n; i++) parts.push({ x: x + rand(-10, 10), y: y + rand(-4, 4), z: rand(4, 50), vx: rand(-50, 50), vy: 0, vz: rand(10, 60), life: .5, max: .5, col: pick(['rgba(42,24,64,.8)', 'rgba(90,60,140,.7)', 'rgba(20,12,30,.85)']), size: rand(4, 8), shape: 'puff', rot: 0, vr: 0 }); };
  if (P.dk === 'fwd') { dust(P.x - P.facing * 6, P.y, 6); fx.push({ kind: 'speed', x: P.x, y: P.y, z: 30, dir: P.facing, t: .3, max: .3 }); }
  else if (P.dk === 'back') { for (let i = 0; i < 8; i++) parts.push({ x: P.x + P.facing * rand(0, 14), y: P.y + rand(-3, 3), z: 1, vx: P.facing * rand(60, 180), vy: rand(-10, 10), vz: rand(30, 110), life: .45, max: .45, col: 'rgba(230,215,190,.75)', size: rand(3, 6), shape: 'puff', rot: 0, vr: 0 }); }
  else { ghosts.push({ x: P.x, y: P.y, z: P.z, facing: P.facing, pose: playerPose(), a: .9, dark: 1 }); sm(14, P.x, P.y); }
  sfx('whoosh');
}
function swapWeapon() {
  const owned = WEAPON_ORDER.filter(id => save.owned[id]);
  if (owned.length < 2) { floatText(P.x, P.y, 80, 'BEAT GLOWING ENEMIES FOR WEAPONS', '#FFFFFF', 12); return; }
  P.w = owned[(owned.indexOf(P.w) + 1) % owned.length]; save.weapon = P.w; P.seq = '';
  refreshHud(true); floatText(P.x, P.y, 80, WEAPONS[P.w].name.toUpperCase(), '#D8AA55', 14);
  burst(P.x, P.y, 40, '#D8AA55', 10, 'spark');
}
function addGhost(dark) { if (ghosts.length < 18) ghosts.push({ x: P.x, y: P.y, z: P.z, facing: P.facing, pose: playerPose(), a: dark ? .55 : .4, dark }); }

// ---------- hitting things ----------
function zOverlap(az, ah, bz, bh) { return az < bz + bh && bz < az + ah; }
function inReach(m, tx, ty, tz, hw, hh) {
  if (Math.abs(ty - P.y) > (m.depth || 18) + hw * .3) return false;
  if (!zOverlap(P.z - 6, 70, tz, hh)) return false;
  if (m.around) return Math.abs(tx - P.x) <= m.x1 + hw;
  const dx = (tx - P.x) * P.facing;
  return dx >= m.x0 - hw && dx <= m.x1 + hw;
}
function doHits() {
  const m = P.move, now = P.t;
  for (const e of enemies) {
    if (e.dead || (e.state === 'down' && !e.boss && !m.bounce && !m.shock)) continue; // a staggered boss can be hit by anything
    const last = P.hits.get(e);
    if (last !== undefined && !(m.multi && now - last >= m.multi)) continue;
    // long-bodied enemies (the wyrm) can be hit anywhere along the body trailing behind the head
    const tail = e.def.tail ? e.def.tail * (e.size || 1) : 0, bx = tail ? clamp(P.x, Math.min(e.x, e.x - e.facing * tail), Math.max(e.x, e.x - e.facing * tail)) : e.x;
    const down = e.def.reachDown || 0; // a hit box stretched toward the floor, so a high flyer can be hit from the ground
    if (!inReach(m, bx, e.y, e.z - down, e.hw, e.hh + down)) continue;
    P.hits.set(e, now);
    if (m.launcher) { P.chaseT = .9; P.chaseX = e.x; }
    const dir = m.around ? (Math.sign(e.x - P.x) || P.facing) : P.facing;
    strike(e, m.dmg * wMult(P.w), dir, m);
  }
  for (const p of props) {
    if (p.broken || P.hits.has(p)) continue;
    if (!inReach(m, p.x, p.y, 0, 16, 70)) continue;
    P.hits.set(p, now); hitProp(p, m);
  }
}
// critical hits: a small base chance, much better from behind or against helpless enemies
function critChance(e) {
  let c = .06 + .015 * (save.wl[P.w] - 1);
  if ((P.x - e.x) * e.facing < 0) c += .25;                 // struck from behind
  if (e.state === 'down' || e.frozen > 0) c += .3;           // staggered, knocked down or frozen
  else if (e.air) c += .12;                                  // juggled in the air
  return Math.min(.75, c);
}
function strike(e, base, dir, m, echo) {
  let raw = base * rand(.9, 1.1) * (stillT > 0 ? 2 : 1);
  if (P.z > 15 && e.air) raw *= 1.25; // aerial bonus
  const crit = !m.trump && (m.crit || Math.random() < critChance(e));
  let dmg = Math.round(raw * (crit ? 1.8 : P.w === 'fists' ? 1 : .78)); // weapon hits are a little weaker (fists keep full damage); crits keep their full punch
  // what counts as a heavy blow: it breaks blocks and guards
  const heavy = m.trump || m.power === 2 || m.launch || m.smash || m.shock || (m.key && m.key.includes('H')) || m.key === 'X';
  if (!e.boss && !m.trump && !m.el && !heavy && e.state === 'block' && Math.sign(P.x - e.x) === e.facing) { // a raised guard turns a light hit aside
    e.t = Math.max(e.t, .25); floatText(e.x, e.y, e.z + e.hh + 10, 'BLOCKED', '#C8CCD8', 13); sfx('hit-metal', .3);
    burst(e.x - dir * e.hw * .6, e.y, e.z + e.hh * .6, ['#FFFFFF', '#C8CCD8'], 6, 'spark', -dir); P.vx = -dir * 140; hitstop = Math.max(hitstop, .05); return;
  }
  if (!e.boss && stageIdx >= 2 && !heavy && !m.trump && !m.el && ['idle', 'recover'].includes(e.state) && (e.def.draw === 'human' || e.def.draw === 'knight') && Math.sign(P.x - e.x) === e.facing && Math.random() < .25) {
    e.state = 'block'; e.t = .55; e.plan = null; floatText(e.x, e.y, e.z + e.hh + 10, 'BLOCKED', '#C8CCD8', 13); sfx('hit-metal', .3); // third-world fighters raise a guard
    burst(e.x - dir * e.hw * .6, e.y, e.z + e.hh * .6, ['#FFFFFF', '#C8CCD8'], 6, 'spark', -dir); P.vx = -dir * 140; hitstop = Math.max(hitstop, .05); return;
  }
  let broke = false;
  if (e.elite && e.guard > 0 && !m.el) {
    if (heavy) { e.guard -= m.power === 2 || m.trump ? 2 : 1; if (e.guard <= 0) { e.guard = 0; broke = true; } else { floatText(e.x, e.y, e.z + e.hh + 26, 'GUARD ' + '◆'.repeat(e.guard), '#EED48A', 11); sfx('hit-metal', .6); } }
    else { dmg = Math.max(1, Math.round(dmg * .25)); m = Object.assign({}, m, { kb: (m.kb || 0) * .15, launch: 0, noStun: 1 }); sfx('hit-metal', .2); } // light hits glance off the guard
  }
  hurtEnemy(e, dmg, dir, m, crit);
  if (broke && !e.dead) { // the guard shatters and leaves it reeling
    e.state = 'down'; e.t = 1.3; e.vx = dir * 60; e.plan = null; hitstop = Math.max(hitstop, .14); shakeMag = Math.max(shakeMag, 7); sfx('break');
    floatText(e.x, e.y, e.z + e.hh + 26, 'GUARD BREAK!', '#FFD27A', 18); burst(e.x, e.y, e.z + e.hh * .6, ['#EED48A', '#FFFFFF', '#D8AA55'], 24, 'crystal', dir, true);
  }
  if (m === P.move && dir === P.facing && !m.around && !(m.lunge >= 300)) P.carry = Math.max(P.carry || 0, Math.min(Math.abs(e.vx) * (e.air ? 1.4 : .8), 340));
  if (brandT > 0 && !m.trump && !m.el && !e.dead) applyElement(e, base, dir);
  if (mirrorT > 0 && !echo) echoes.push({ e, dmg: base * .6, dir, m, t: .14 });
}
const MAT_COL = { goo: ['#D88AAE', '#F0C8D8', '#FFF4E8'], fur: ['#B86A3E', '#E8C08A', '#FFF4E8'], spark: ['#F0D890', '#E0A0C0', '#FFF8E8'], rock: ['#9A8E80', '#7EA460', '#E8D08A'], metal: ['#F0D890', '#FFF8E8', '#9FD8E8'], crystal: ['#9FD8E0', '#D8A0C8', '#FFFFFF'], flesh: ['#8E2A40', '#C8607A', '#F0D8C8'] };
const MAT_SFX = { goo: 'hit-goo', fur: 'hit-flesh', spark: 'hit-crystal', rock: 'hit-flesh', metal: 'hit-metal', crystal: 'hit-crystal', flesh: 'hit-flesh' };
function hurtEnemy(e, dmg, dir, m, crit) {
  const pw = m.power || 0;
  e.hp -= dmg; e.flash = .09; e.sqx = 1 + .18 + .1 * pw; e.sqy = 1 - .16 - .06 * pw;
  hitstop = Math.max(hitstop, [.045, .075, .12][pw]); e.jit = hitstop + .04;
  shakeMag = Math.max(shakeMag, [2, 4, 7.5][pw]); shakeDir = dir;
  if (pw === 2) zoom = Math.max(zoom, .045);
  const hx = e.x - dir * e.hw * .4, hz = e.z + e.hh * .55;
  burst(hx, e.y, hz, MAT_COL[e.def.mat], 7 + pw * 6, e.def.mat, dir);
  fx.push({ kind: 'slash', x: hx, y: e.y, z: hz, ang: rand(-.6, .6) + (m.launch ? -1.2 : 0), t: .16, max: .16, size: 18 + pw * 10, col: pw === 2 ? '#D8AA55' : '#FFFFFF' });
  fx.push({ kind: 'ring', x: hx, y: e.y, z: hz, t: .2, max: .2, r: 10 + pw * 8, col: '#FFFFFF' });
  if (crit) {
    floatText(e.x, e.y, e.z + e.hh + 14, dmg + '!', '#FFB35A', 22 + pw * 4); floatText(e.x, e.y, e.z + e.hh + 50, 'CRITICAL', '#FFE2A0', 11);
    fx.push({ kind: 'crit', x: hx, y: e.y, z: hz, t: .3, max: .3, r: 34 + pw * 10 });
    hitstop = Math.max(hitstop, .14); flashT = Math.max(flashT, .04); zoom = Math.max(zoom, .04); shakeMag = Math.max(shakeMag, 7); sfx('crit');
  } else floatText(e.x, e.y, e.z + e.hh + 10, String(dmg), pw === 2 ? '#D8AA55' : '#FFFFFF', 14 + pw * 4);
  sfx(MAT_SFX[e.def.mat], pw * .5);
  comboN++; comboT = 1.8; refreshCombo(true);
  if (save.trump && mirrorT <= 0 && stillT <= 0) trumpCharge = Math.min(TRUMP_CHARGE, trumpCharge + dmg);
  if (e.hp <= 0) { killEnemy(e, dir, m); return; }
  e.cd = Math.max(e.cd, .4);
  if (m.noStun) { e.vx = dir * 25; e.flinch = .08; return; } // an armored elite doesn't even stagger
  if (e.boss && !e.enraged) { e.rageBuild = (e.rageBuild || 0) + dmg; if (e.rageBuild > e.maxHp * .14) { e.rageBuild = 0; e.rageQ = true; } } // punish it hard and it flies into a rage
  if (e.boss && (e.state === 'down' || e.stagger)) return; // a staggered boss stays down while you punish it
  if (e.poiseMax && !e.air) {
    e.poise -= 1 + pw;
    if (e.poise > 0) { e.vx = dir * (m.kb || 0) * .12; e.flinch = .12; return; }
    e.poise = e.poiseMax;
    if (e.boss) { // poise broken: the boss collapses and is open for a few seconds
      const st = Math.max(.8, 1.5 - .2 * e.staggers); // each stagger is shorter, and the next one takes more to cause
      e.staggers++; e.poiseMax = e.def.poise * 1.6 + 5 * e.staggers; e.poise = e.poiseMax;
      e.state = 'down'; e.t = st; e.plan = null; e.rolls = 0; e.around = false;
      if (e.def.move === 'fly') { e.air = true; e.vz = 0; e.stagger = st; }
      floatText(e.x, e.y, e.z + e.hh + 24, 'STAGGERED', '#EED48A', 18); sfx('crunch'); shakeMag = 10; zoom = .05;
      return;
    }
  }
  if (stillT > 0) return; // frozen enemies just take the damage
  e.state = 'hurt'; e.t = .26 + .12 * pw; e.plan = null;
  e.vx = dir * (m.kb || 0) * (e.boss ? .35 : e.def.weight);
  e.wallOK = m.wall || (m.kb || 0) >= 260;
  if (m.bounce) e.bounce = true;
  if (m.launch || e.air) {
    e.jug = (e.jug || 0) + 1;
    if (m.spike && e.air) { e.vz = -480; e.bounce = true; e.spin = dir * 8; }
    else if (e.jug <= 12) {
      const up = (m.launch || 140) * (e.boss ? .35 : e.def.weight);
      e.vz = P.z > 15 && !m.launch ? 150 * (e.boss ? .35 : e.def.weight) : Math.max(e.vz, up); e.air = true; // air hits hold them level with you e.spin = dir * (5 + pw * 4) * (e.boss ? .2 : 1);
    } else { e.vz = Math.min(e.vz, -100); }
  }
}
// each weapon finishes enemies its own way: the sword cuts them in two, the staff caves them in, the hammer flattens them
const DEATH_BY = { sword: 'slice', staff: 'crumple', hammer: 'splat' };
function killEnemy(e, dir, m) {
  e.dead = true; e.state = 'dying'; e.dir = dir; e.deadAt = performance.now() / 1000;
  e.death = m.trump ? 'pop' : P.w === 'hammer' ? (m.smash ? 'splat' : 'pop') : DEATH_BY[P.w] || 'pop'; // the hammer only splats on a downward smash
  hitstop = Math.max(hitstop, .13); zoom = Math.max(zoom, .05); flashT = .06;
  const cols = MAT_COL[e.def.mat], cy = e.z + e.hh * .5;
  if (e.death === 'pop') {
    e.t = 1.2; e.air = true;
    e.vx = dir * Math.max(260, (m.kb || 0) * 1.2) * (e.boss ? .3 : 1); e.vz = Math.max(e.vz, e.boss ? 200 : 300); e.spin = dir * 12 * (e.boss ? .15 : 1);
  } else {
    e.air = false; e.spin = 0; e.rotA = 0; e.vz = 0; e.dmax = e.t = e.death === 'splat' ? 2.4 : 2;
    e.vx = dir * (e.death === 'crumple' ? 170 : e.death === 'slice' ? 40 : 0) * (e.boss ? .3 : 1);
    dropLoot(e);
    if (e.death === 'slice') {
      e.cut = rand(-.45, .45);
      for (let i = -6; i <= 6; i++) burst(e.x + Math.cos(e.cut) * i * e.hw * .25, e.y, cy + Math.sin(-e.cut) * i * e.hw * .25, cols, 2, e.def.mat, dir);
      fx.push({ kind: 'slash', x: e.x, y: e.y, z: cy, ang: -e.cut, t: .3, max: .3, size: 46 + e.hw, col: '#FFFFFF' });
      sfx('slice');
    } else if (e.death === 'crumple') {
      e.dents = [0, 1, 2].map(() => ({ x: rand(-.6, .6), y: rand(.25, .85), r: rand(3, 6) }));
      burst(e.x, e.y, cy, cols, 14, e.def.mat === 'flesh' ? 'rock' : e.def.mat, dir);
      sfx('crunch'); shakeMag = Math.max(shakeMag, 5);
    } else {
      e.z = 0; e.splat = [...Array(11)].map((_, i) => ({ a: i / 11 * TAU + rand(-.2, .2), l: rand(.8, 1.6), w: rand(3, 6) }));
      for (let i = 0; i < 26; i++) parts.push({ x: e.x, y: e.y + rand(-6, 6), z: 2, vx: Math.cos(i / 26 * TAU) * rand(120, 260), vy: Math.sin(i / 26 * TAU) * rand(20, 60), vz: rand(60, 200), life: rand(1.5, 3), max: 3, col: pick(cols), size: rand(3, 6), shape: e.def.mat === 'metal' ? 'bolt' : e.def.mat === 'crystal' ? 'shard' : 'blob', rot: 0, vr: rand(-10, 10) });
      fx.push({ kind: 'ring', x: e.x, y: e.y, z: 2, t: .45, max: .45, r: 60 + e.hw * 1.5, col: cols[0], flat: 1 });
      sfx('slam'); sfx('hit-goo'); shakeMag = Math.max(shakeMag, 9);
    }
  }
  const last = !enemies.some(o => !o.dead) && !spawnQ.length;
  if (last || e.boss) slowmo = e.boss ? 1.4 : .45;
  if (e.boss) { shakeMag = 10; clearT = 3.2; sfx('slam'); }
}
function popEnemy(e) { // the body hits the ground in a burst of debris and drops its loot
  burst(e.x, e.y, e.hh * .4, MAT_COL[e.def.mat], 26, e.def.mat, 0, true);
  fx.push({ kind: 'ring', x: e.x, y: e.y, z: 6, t: .35, max: .35, r: 40 + e.hw, col: MAT_COL[e.def.mat][0], flat: 1 });
  sfx('break');
  dropLoot(e);
}
function dropLoot(e) {
  const [a, b] = e.def.shards || [30, 40];
  // richer pickings deeper in: each world drops more, and an armored elite drops a lot more
  const n = Math.round(rand(a, b) * (1 + .3 * save.cycle) * [1, 1.5, 2.1][Math.min(stageIdx, 2)] * (e.elite ? 2 : 1)), pieces = Math.min(n, 8);
  for (let i = 0; i < pieces; i++) loot.push(makeLoot('shard', e.x, e.y, Math.ceil(n / pieces)));
  if (e.boss) for (let i = 0; i < 3 + Math.min(stageIdx, 2); i++) loot.push(makeLoot('sigil', e.x, e.y, 1));
  else if (Math.random() < (e.def.sigil || 0) * [1, 1.4, 1.8][Math.min(stageIdx, 2)] + (e.elite ? .65 : 0) + .04 * Math.min(stageIdx, 2)) loot.push(makeLoot('sigil', e.x, e.y, 1)); // elites usually carry a sigil, the ink for Trump cards
  if (Math.random() < (e.boss ? 1 : .12)) loot.push(makeLoot('heal', e.x, e.y, e.boss ? 50 : 25));
  if (e.dropWeapon && !save.owned[e.dropWeapon]) loot.push(makeLoot('weapon', e.x, e.y, 0, e.dropWeapon));
}
function makeLoot(kind, x, y, val, weapon) {
  return { kind, val, weapon, x: x + rand(-14, 14), y: clamp(y + rand(-10, 10), FLOOR_TOP + 8, FLOOR_BOT), z: 14, vz: rand(160, 260), vx: rand(-60, 60), t: 0 };
}
function shockwave(x, y, r, m) {
  P.shocked = true; sfx('slam'); shakeMag = Math.max(shakeMag, 8); zoom = Math.max(zoom, .04);
  fx.push({ kind: 'ring', x, y, z: 2, t: .4, max: .4, r: r * 1.3, col: '#FFFFFF', flat: 1 });
  burst(x, y, 4, ['#FFFFFF', '#EED48A', '#E9D8B0'], 20, 'rock', 0, true);
  for (const e of enemies) {
    if (e.dead || P.hits.get(e) === -1) continue;
    if (Math.hypot(e.x - x, (e.y - y) * 2) < r + e.hw && e.z < 40) {
      P.hits.set(e, -1);
      strike(e, m.dmg * .6 * wMult(P.w), Math.sign(e.x - x) || P.facing, Object.assign({}, m, { launch: Math.max(m.launch || 0, 260), kb: 120, power: 1 }));
    }
  }
}
function hitProp(p, m) {
  p.hp -= (m.power || 0) >= 1 ? 2 : 1; p.flash = .1;
  hitstop = Math.max(hitstop, .05); shakeMag = Math.max(shakeMag, 3);
  burst(p.x, p.y, 40, ['#E6FBFF', '#8FB8FF', '#EED48A'], 10, 'crystal', P.facing);
  sfx('hit-crystal');
  if (p.hp > 0) return;
  p.broken = true; sfx('break'); zoom = Math.max(zoom, .04);
  burst(p.x, p.y, 40, ['#E6FBFF', '#8FB8FF', '#EED48A', '#D08AB0'], 30, 'crystal', 0, true);
  for (let i = 0; i < 4; i++) loot.push(makeLoot('shard', p.x, p.y, 2));
  if (Math.random() < .5) loot.push(makeLoot('heal', p.x, p.y, 20));
}
function playerDamage(dmg, fromX, big) {
  if (P.inv > 0 || P.state === 'dead' || P.state === 'dodge') return;
  P.hp -= dmg; P.inv = .8; shakeMag = Math.max(shakeMag, big ? 7 : 4); hitstop = .07; hurtFlash = .25;
  floatText(P.x, P.y, 70, '-' + dmg, '#D0566A', 16); sfx('hurt');
  burst(P.x, P.y, 34, ['#D0566A', '#FFFFFF'], 10, 'spark');
  const dir = Math.sign(P.x - fromX) || -P.facing;
  P.vx = dir * (big ? 240 : 130); P.facing = -dir; P.seq = '';
  comboN = 0; refreshCombo();
  if (P.hp <= 0) { P.hp = 0; P.state = 'dead'; P.vz = 220; P.t = 1.6; slowmo = .8; return; }
  P.state = 'hurt'; P.knocked = big; P.t = big ? .45 : .3; if (big) P.vz = 220;
}

// ---------- trump cards ----------
function playTrump() {
  if (!save.trump || trumpCharge < TRUMP_CHARGE) return;
  trumpCharge = 0; flashT = .2; sfx('trump'); zoom = .06;
  const card = TRUMPS[save.trump];
  banner(card.name, 'TRUMP PLAYED', 1.4);
  if (save.trump === 'stag') stag = { x: camX - 60, y: P.y, hit: new Set(), t: 0 };
  else if (save.trump === 'mirror') mirrorT = 10;
  else if (save.trump === 'brand') { brandEl = ['fire', 'frost', 'storm'][brandN++ % 3]; brandT = 15; banner(ELEMENTS[brandEl].name, 'YOUR WEAPON IS BRANDED FOR 15 SECONDS', 1.6); burst(P.x, P.y, 50, [ELEMENTS[brandEl].col, '#FFFFFF'], 30, 'spark', 0, true); }
  else if (save.trump === 'stillness') stillT = 5;
  else if (save.trump === 'phoenix') {
    P.hp = Math.min(maxHp(), P.hp + maxHp() * .5);
    burst(P.x, P.y, 30, ['#EED48A', '#D8834A', '#D04A62', '#FFFFFF'], 50, 'spark', 0, true);
    fx.push({ kind: 'ring', x: P.x, y: P.y, z: 20, t: .5, max: .5, r: 150, col: '#D8834A', flat: 1 });
    for (const e of enemies) if (!e.dead && Math.hypot(e.x - P.x, (e.y - P.y) * 2) < 150) strike(e, 30, Math.sign(e.x - P.x) || 1, { dmg: 30, kb: 420, launch: 300, power: 2, trump: 1 }, true);
  }
  refreshHud();
}
function updateTrumps(dt) {
  mirrorT = Math.max(0, mirrorT - dt); stillT = Math.max(0, stillT - dt); brandT = Math.max(0, brandT - dt);
  if (brandT > 0 && Math.random() < .7) { // the branded weapon sheds its element
    const el = ELEMENTS[brandEl];
    parts.push({ x: P.x + P.facing * rand(10, 40), y: P.y, z: rand(30, 60), vx: rand(-20, 20), vy: 0, vz: brandEl === 'frost' ? -10 : rand(40, 90), life: .5, max: .5, col: pick([el.col, '#FFFFFF']), size: rand(2, 3.5), shape: 'star', rot: 0, vr: 5 });
  }
  for (const ec of echoes) { ec.t -= dt; if (ec.t <= 0 && !ec.e.dead) strike(ec.e, ec.dmg, ec.dir, ec.m, true); }
  echoes = echoes.filter(ec => ec.t > 0);
  if (stag) {
    stag.t += dt; stag.x += 620 * dt;
    if (Math.random() < .8) burst(stag.x - 20, stag.y, rand(10, 50), ['#BFF5FF', '#FFFFFF', '#EED48A'], 2, 'spark');
    for (const e of enemies) if (!e.dead && !stag.hit.has(e) && Math.abs(e.x - stag.x) < 34 && Math.abs(e.y - stag.y) < 60) { stag.hit.add(e); strike(e, 45, 1, { dmg: 45, kb: 380, launch: 460, power: 2, trump: 1 }, true); }
    if (stag.x > camX + VW + 80) stag = null;
  }
}

// ---------- elemental brand ----------
function applyElement(e, base, dir) {
  const el = ELEMENTS[brandEl], cy = e.z + e.hh * .5;
  if (brandEl === 'fire') { e.burn = 3.2; e.burnBase = Math.max(3, base * .18); }
  else if (brandEl === 'frost') {
    e.chill = 3; e.frost = (e.frost || 0) + 1;
    if (e.frost >= 4) { e.frost = 0; e.frozen = 1.8; e.state = e.state === 'dying' ? e.state : 'hurt'; e.t = 1.8; burst(e.x, e.y, cy, ['#9FE0FF', '#FFFFFF', '#6EA8D8'], 16, 'crystal', 0, true); floatText(e.x, e.y, e.z + e.hh + 18, 'FROZEN', el.col, 15); sfx('hit-crystal'); }
  } else {
    const near = enemies.filter(o => o !== e && !o.dead && Math.hypot(o.x - e.x, o.y - e.y) < 140).sort((p, q) => Math.abs(p.x - e.x) - Math.abs(q.x - e.x)).slice(0, 2);
    for (const o of near) {
      fx.push({ kind: 'bolt', x: e.x, y: e.y, z: cy, x2: o.x, y2: o.y, z2: o.z + o.hh * .5, t: .2, max: .2, col: el.col, seed: Math.random() * 99 });
      strike(o, base * .5, Math.sign(o.x - e.x) || dir, { dmg: base * .5, kb: 60, power: 0, el: 1 });
    }
    sfx('shoot');
  }
  burst(e.x, e.y, cy, [el.col, '#FFFFFF'], 6, 'spark', dir);
}
function updateElements(e, dt) { // burning, chill and freeze on one enemy; returns true while frozen solid
  if (e.burn > 0 && !e.dead) {
    e.burn -= dt; e.burnTick = (e.burnTick || 0) - dt;
    if (Math.random() < .6) parts.push({ x: e.x + rand(-e.hw, e.hw) * .6, y: e.y, z: e.z + rand(0, e.hh), vx: rand(-10, 10), vy: 0, vz: rand(80, 140), life: .5, max: .5, col: pick(['#FF8A4A', '#FFD27A', '#E85A3A']), size: rand(2.5, 4), shape: 'puff', rot: 0, vr: 0 });
    if (e.burnTick <= 0) {
      e.burnTick = .5; const d = Math.round(e.burnBase); e.hp -= d;
      floatText(e.x, e.y, e.z + e.hh + 6, String(d), '#FF8A4A', 11);
      if (e.hp <= 0) killEnemy(e, 1, { trump: 1 });
    }
  }
  if (e.chill > 0) e.chill -= dt;
  if (e.frozen > 0 && !e.dead) { e.frozen -= dt; return true; }
  return false;
}
