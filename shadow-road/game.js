'use strict';
// ---------- run state ----------
const SPX = 112, SPY = 72, RUN = 240, JUMP = 360;
let mode = 'title';
let stage = null, stageIdx = 0, P = null;
let enemies = [], projs = [], parts = [], fx = [], nums = [], loot = [], props = [], ghosts = [], echoes = [], spawnQ = [];
let camX = 0, lockX = null, waveIdx = 0, waveActive = false, bossSpawned = false, boss = null;
let hitstop = 0, shakeMag = 0, shakeDir = 0, zoom = 0, slowmo = 0, clearT = 0, flashT = 0, hurtFlash = 0;
let runShards = 0, runSigils = 0, comboN = 0, comboT = 0, trumpCharge = 0, mirrorT = 0, stillT = 0, stag = null;

function newPlayer() {
  return { x: 80, y: 300, z: 0, vx: 0, vz: 0, facing: 1, state: 'idle', t: 0, hp: maxHp(), inv: 0, walk: 0,
    w: save.owned[save.weapon] ? save.weapon : 'fists', move: null, hits: null, seq: '', q: null, ct: 0, clvl: 0,
    airUsed: false, jvx: 0, jvy: 0, dvx: 0, dvy: 0, knocked: false, ghostT: 0, shocked: false };
}

// ---------- combos ----------
const unlocked = (m) => m && (!m.lvl || save.wl[P.w] >= m.lvl);
function nextMove(key) {
  const w = WEAPONS[P.w], tree = w.tree;
  const chained = tree[(P.seq || '') + key];
  if (unlocked(chained)) return chained;
  if (key === 'H' && w.charge) return 'charge';
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
  sfx(m.power === 2 || m.rot ? 'whoosh' : 'swing');
}

// ---------- player ----------
function updatePlayer(dt) {
  const w = WEAPONS[P.w];
  P.inv = Math.max(0, P.inv - dt);
  const wasAir = P.z > 0 || P.vz > 0;
  if (wasAir) {
    P.vz -= GRAV * dt * (P.state === 'air' && P.move && P.move.dive ? 1.8 : 1);
    P.z += P.vz * dt;
    if (P.z <= 0) { P.z = 0; P.vz = 0; onLand(); }
  }
  const mx = input.mx, my = input.my;
  switch (P.state) {
    case 'idle': case 'walk': case 'run': {
      if (pressed.swap) swapWeapon();
      if (pressed.trump) playTrump();
      const running = input.run && Math.abs(mx) > 0.3;
      if (pressed.jump) { P.vz = JUMP; P.state = 'jump'; P.jvx = running ? Math.sign(mx) * RUN * 1.05 : mx * SPX; P.jvy = my * SPY; P.airUsed = false; sfx('jump'); dust(P.x, P.y, 5); break; }
      if (pressed.dodge) { startDodge(); break; }
      if (pressed.light) { begin(running ? w.tree.D : nextMove('L')); break; }
      if (pressed.heavy) { begin(running ? (unlocked(w.tree.DH) ? w.tree.DH : w.tree.D) : nextMove('H')); break; }
      P.seq = '';
      if (running) {
        P.state = 'run'; P.facing = Math.sign(mx); P.x += P.facing * RUN * dt; P.y += my * SPY * .6 * dt; P.walk += dt * 20;
        P.ghostT -= dt; if (P.ghostT <= 0) { P.ghostT = .05; addGhost(); }
        if (Math.random() < dt * 14) dust(P.x - P.facing * 8, P.y, 1);
      } else {
        const moving = mx !== 0 || my !== 0;
        P.x += mx * SPX * dt; P.y += my * SPY * dt;
        if (Math.abs(mx) > 0.1) P.facing = Math.sign(mx);
        P.state = moving ? 'walk' : 'idle'; P.walk = moving ? P.walk + dt * 13 : 0;
      }
      break;
    }
    case 'jump':
      P.x += P.jvx * dt; P.y += P.jvy * dt;
      if ((pressed.light || pressed.heavy) && !P.airUsed) { P.airUsed = true; P.jvy = 0; begin(w.tree.A); }
      break;
    case 'air': {
      const m = P.move, k = P.t / m.dur;
      P.x += P.jvx * dt; P.t += dt;
      if (m.dive || (k >= m.h[0] && k <= m.h[1])) doHits();
      if (!m.dive && P.t >= m.dur) P.state = 'jump'; // falls the rest of the way, no second air attack
      break;
    }
    case 'atk': runMove(dt); break;
    case 'charge': {
      P.ct += dt;
      const maxL = save.wl.sword >= 4 ? 3 : 2;
      const lvl = P.ct >= 1.5 && maxL === 3 ? 3 : P.ct >= .95 ? 2 : P.ct >= .45 ? 1 : 0;
      if (lvl > P.clvl) { P.clvl = lvl; sfx('charge', lvl); burst(P.x - P.facing * 6, P.y, 56, lvl === 3 ? '#FF6FB5' : '#FFC94A', 8 + lvl * 4, 'spark'); zoom = Math.max(zoom, .02); }
      if (Math.abs(mx) > 0.3) P.facing = Math.sign(mx);
      if (pressed.dodge) { startDodge(); break; }
      if (!input.heavy) { const m = Object.assign({ key: 'H' }, WEAPONS.sword.charged[P.clvl]); begin(m); P.seq = 'H'; }
      break;
    }
    case 'dodge':
      P.t -= dt; P.x += P.dvx * dt; P.y += P.dvy * dt;
      P.ghostT -= dt; if (P.ghostT <= 0) { P.ghostT = .04; addGhost(); }
      if (P.t <= 0) P.state = 'idle';
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
  P.y = clamp(P.y, FLOOR_TOP + 6, FLOOR_BOT);
  P.x = clamp(P.x, camX + 14, lockX !== null ? lockX + VW - 14 : stage.len - 14);
}
function onLand() {
  dust(P.x, P.y, 6);
  if (P.state === 'jump') { P.state = 'idle'; P.airUsed = false; }
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
    projs.push({ owner: 'p', x: P.x + P.facing * 40, y: P.y, z: 0, vx: P.facing * 340, dmg: Math.round(40 * wMult('sword')), life: 1, hit: new Set(), wave: 1 });
  }
  if (k > .3) { if (pressed.light) P.q = 'L'; if (pressed.heavy) P.q = 'H'; }
  if (pressed.dodge && k > .4) { startDodge(); return; }
  if (P.t >= m.dur && !(m.hop && airborne)) {
    const nm = P.q ? nextMove(P.q) : null;
    if (nm) begin(nm); else { P.state = 'idle'; }
  }
}
function startDodge() {
  let dx = input.mx, dy = input.my;
  if (!dx && !dy) dx = P.facing;
  const d = Math.hypot(dx, dy) || 1;
  P.state = 'dodge'; P.t = .34; P.dvx = dx / d * 300; P.dvy = dy / d * 150; P.inv = Math.max(P.inv, .36); P.seq = '';
  if (dx) P.facing = Math.sign(dx);
  sfx('whoosh');
}
function swapWeapon() {
  const owned = WEAPON_ORDER.filter(id => save.owned[id]);
  if (owned.length < 2) { floatText(P.x, P.y, 80, 'FIND A WEAPON SHRINE', '#FFFFFF', 12); return; }
  P.w = owned[(owned.indexOf(P.w) + 1) % owned.length]; save.weapon = P.w; P.seq = '';
  refreshHud(true); floatText(P.x, P.y, 80, WEAPONS[P.w].name.toUpperCase(), '#FFC94A', 14);
  burst(P.x, P.y, 40, '#FFC94A', 10, 'spark');
}
function addGhost() { if (ghosts.length < 14) ghosts.push({ x: P.x, y: P.y, z: P.z, facing: P.facing, pose: playerPose(), a: .4 }); }

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
    if (e.dead || (e.state === 'down' && !m.bounce && !m.shock)) continue;
    const last = P.hits.get(e);
    if (last !== undefined && !(m.multi && now - last >= m.multi)) continue;
    if (!inReach(m, e.x, e.y, e.z, e.hw, e.hh)) continue;
    P.hits.set(e, now);
    const dir = m.around ? (Math.sign(e.x - P.x) || P.facing) : P.facing;
    strike(e, m.dmg * wMult(P.w), dir, m);
  }
  for (const p of props) {
    if (p.broken || P.hits.has(p)) continue;
    if (!inReach(m, p.x, p.y, 0, 16, 70)) continue;
    P.hits.set(p, now); hitProp(p, m);
  }
}
function strike(e, base, dir, m, echo) {
  let dmg = Math.round(base * rand(.9, 1.1) * (stillT > 0 ? 2 : 1));
  hurtEnemy(e, dmg, dir, m);
  if (mirrorT > 0 && !echo) echoes.push({ e, dmg: base * .6, dir, m, t: .14 });
}
const MAT_COL = { goo: ['#FF7FC8', '#FFB3E0', '#FFFFFF'], fur: ['#E07A3A', '#FFD27A', '#FFFFFF'], spark: ['#FFE46B', '#FF8FD0', '#FFFFFF'], rock: ['#A89A8A', '#6FCB5A', '#FFE46B'], metal: ['#FFE46B', '#FFFFFF', '#6FD3FF'], crystal: ['#8FE9FF', '#FF8FD0', '#FFFFFF'] };
const MAT_SFX = { goo: 'hit-goo', fur: 'hit-flesh', spark: 'hit-crystal', rock: 'hit-flesh', metal: 'hit-metal', crystal: 'hit-crystal' };
function hurtEnemy(e, dmg, dir, m) {
  const pw = m.power || 0;
  e.hp -= dmg; e.flash = .09; e.sqx = 1 + .18 + .1 * pw; e.sqy = 1 - .16 - .06 * pw;
  hitstop = Math.max(hitstop, [.045, .075, .12][pw]); e.jit = hitstop + .04;
  shakeMag = Math.max(shakeMag, [2, 4, 7.5][pw]); shakeDir = dir;
  if (pw === 2) zoom = Math.max(zoom, .045);
  const hx = e.x - dir * e.hw * .4, hz = e.z + e.hh * .55;
  burst(hx, e.y, hz, MAT_COL[e.def.mat], 7 + pw * 6, e.def.mat, dir);
  fx.push({ kind: 'slash', x: hx, y: e.y, z: hz, ang: rand(-.6, .6) + (m.launch ? -1.2 : 0), t: .16, max: .16, size: 18 + pw * 10, col: pw === 2 ? '#FFC94A' : '#FFFFFF' });
  fx.push({ kind: 'ring', x: hx, y: e.y, z: hz, t: .2, max: .2, r: 10 + pw * 8, col: '#FFFFFF' });
  floatText(e.x, e.y, e.z + e.hh + 10, String(dmg), pw === 2 ? '#FFC94A' : '#FFFFFF', 14 + pw * 4);
  sfx(MAT_SFX[e.def.mat], pw * .5);
  comboN++; comboT = 1.8; refreshCombo(true);
  if (save.trump && mirrorT <= 0 && stillT <= 0) trumpCharge = Math.min(TRUMP_CHARGE, trumpCharge + dmg);
  if (e.hp <= 0) { killEnemy(e, dir, m); return; }
  e.cd = Math.max(e.cd, .4);
  if (e.poiseMax && !e.air) {
    e.poise -= 1 + pw;
    if (e.poise > 0) { e.vx = dir * (m.kb || 0) * .12; e.flinch = .12; return; }
    e.poise = e.poiseMax;
  }
  if (stillT > 0) return; // frozen enemies just take the damage
  e.state = 'hurt'; e.t = .26 + .12 * pw; e.plan = null;
  e.vx = dir * (m.kb || 0) * (e.boss ? .35 : e.def.weight);
  e.wallOK = m.wall || (m.kb || 0) >= 260;
  if (m.bounce) e.bounce = true;
  if (m.launch || e.air) {
    e.jug = (e.jug || 0) + 1;
    if (e.jug <= 8) {
      const up = (m.launch || 140) * (e.boss ? .35 : e.def.weight);
      e.vz = Math.max(e.vz, up); e.air = true; e.spin = dir * (5 + pw * 4) * (e.boss ? .2 : 1);
    } else { e.vz = Math.min(e.vz, -100); }
  }
}
function killEnemy(e, dir, m) {
  e.dead = true; e.state = 'dying'; e.t = 1.2; e.air = true;
  e.vx = dir * Math.max(260, (m.kb || 0) * 1.2) * (e.boss ? .3 : 1); e.vz = Math.max(e.vz, e.boss ? 200 : 300); e.spin = dir * 12 * (e.boss ? .15 : 1);
  hitstop = Math.max(hitstop, .13); zoom = Math.max(zoom, .05); flashT = .06;
  const last = !enemies.some(o => !o.dead) && !spawnQ.length;
  if (last || e.boss) slowmo = e.boss ? 1.4 : .45;
  if (e.boss) { shakeMag = 10; clearT = 3.2; sfx('slam'); }
}
function popEnemy(e) { // the dying body bursts on landing and drops loot
  burst(e.x, e.y, e.hh * .4, MAT_COL[e.def.mat], 26, e.def.mat, 0, true);
  fx.push({ kind: 'ring', x: e.x, y: e.y, z: 6, t: .35, max: .35, r: 40 + e.hw, col: MAT_COL[e.def.mat][0], flat: 1 });
  sfx('break');
  const [a, b] = e.def.shards || [30, 40];
  const n = Math.round(rand(a, b) * (1 + .3 * save.cycle)), pieces = Math.min(n, 8);
  for (let i = 0; i < pieces; i++) loot.push(makeLoot('shard', e.x, e.y, Math.ceil(n / pieces)));
  if (e.boss) for (let i = 0; i < 3; i++) loot.push(makeLoot('sigil', e.x, e.y, 1));
  else if (e.def.sigil && Math.random() < e.def.sigil) loot.push(makeLoot('sigil', e.x, e.y, 1));
  if (Math.random() < (e.boss ? 1 : .12)) loot.push(makeLoot('heal', e.x, e.y, e.boss ? 50 : 25));
  if (e.dropWeapon && !save.owned[e.dropWeapon]) loot.push(makeLoot('weapon', e.x, e.y, 0, e.dropWeapon));
}
function makeLoot(kind, x, y, val, weapon) {
  return { kind, val, weapon, x: x + rand(-14, 14), y: clamp(y + rand(-10, 10), FLOOR_TOP + 8, FLOOR_BOT), z: 14, vz: rand(160, 260), vx: rand(-60, 60), t: 0 };
}
function shockwave(x, y, r, m) {
  P.shocked = true; sfx('slam'); shakeMag = Math.max(shakeMag, 8); zoom = Math.max(zoom, .04);
  fx.push({ kind: 'ring', x, y, z: 2, t: .4, max: .4, r: r * 1.3, col: '#FFFFFF', flat: 1 });
  burst(x, y, 4, ['#FFFFFF', '#FFE46B', '#E9D8B0'], 20, 'rock', 0, true);
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
  burst(p.x, p.y, 40, ['#E6FBFF', '#8FB8FF', '#FFE46B'], 10, 'crystal', P.facing);
  sfx('hit-crystal');
  if (p.hp > 0) return;
  p.broken = true; sfx('break'); zoom = Math.max(zoom, .04);
  burst(p.x, p.y, 40, ['#E6FBFF', '#8FB8FF', '#FFE46B', '#FF8FD0'], 30, 'crystal', 0, true);
  if (p.kind === 'shrine') {
    if (p.weapon && !save.owned[p.weapon]) loot.push(makeLoot('weapon', p.x, p.y, 0, p.weapon));
    else { for (let i = 0; i < 5; i++) loot.push(makeLoot('shard', p.x, p.y, 5)); loot.push(makeLoot('sigil', p.x, p.y, 1)); }
  } else {
    for (let i = 0; i < 4; i++) loot.push(makeLoot('shard', p.x, p.y, 2));
    if (Math.random() < .5) loot.push(makeLoot('heal', p.x, p.y, 20));
  }
}
function playerDamage(dmg, fromX, big) {
  if (P.inv > 0 || P.state === 'dead' || P.state === 'dodge') return;
  P.hp -= dmg; P.inv = .8; shakeMag = Math.max(shakeMag, big ? 7 : 4); hitstop = .07; hurtFlash = .25;
  floatText(P.x, P.y, 70, '-' + dmg, '#FF5A6E', 16); sfx('hurt');
  burst(P.x, P.y, 34, ['#FF5A6E', '#FFFFFF'], 10, 'spark');
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
  else if (save.trump === 'stillness') stillT = 5;
  else if (save.trump === 'phoenix') {
    P.hp = Math.min(maxHp(), P.hp + maxHp() * .5);
    burst(P.x, P.y, 30, ['#FFE46B', '#FF8A3D', '#FF4F7B', '#FFFFFF'], 50, 'spark', 0, true);
    fx.push({ kind: 'ring', x: P.x, y: P.y, z: 20, t: .5, max: .5, r: 150, col: '#FF8A3D', flat: 1 });
    for (const e of enemies) if (!e.dead && Math.hypot(e.x - P.x, (e.y - P.y) * 2) < 150) strike(e, 30, Math.sign(e.x - P.x) || 1, { dmg: 30, kb: 420, launch: 300, power: 2 }, true);
  }
  refreshHud();
}
function updateTrumps(dt) {
  mirrorT = Math.max(0, mirrorT - dt); stillT = Math.max(0, stillT - dt);
  for (const ec of echoes) { ec.t -= dt; if (ec.t <= 0 && !ec.e.dead) strike(ec.e, ec.dmg, ec.dir, ec.m, true); }
  echoes = echoes.filter(ec => ec.t > 0);
  if (stag) {
    stag.t += dt; stag.x += 620 * dt;
    if (Math.random() < .8) burst(stag.x - 20, stag.y, rand(10, 50), ['#BFF5FF', '#FFFFFF', '#FFE46B'], 2, 'spark');
    for (const e of enemies) if (!e.dead && !stag.hit.has(e) && Math.abs(e.x - stag.x) < 34 && Math.abs(e.y - stag.y) < 60) { stag.hit.add(e); strike(e, 45, 1, { dmg: 45, kb: 380, launch: 460, power: 2 }, true); }
    if (stag.x > camX + VW + 80) stag = null;
  }
}
