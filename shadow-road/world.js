'use strict';
// ---------- particles & effects ----------
function burst(x, y, z, cols, n, mat, dir = 0, big) {
  cols = Array.isArray(cols) ? cols : [cols];
  for (let i = 0; i < n && parts.length < 420; i++) {
    const sp = big ? rand(80, 260) : rand(60, 200), a = rand(0, TAU);
    const shape = mat === 'goo' ? 'blob' : mat === 'metal' ? (i % 3 ? 'streak' : 'bolt') : mat === 'crystal' ? 'shard' : mat === 'rock' ? 'chunk' : mat === 'fur' ? 'tuft' : 'star';
    parts.push({ x, y: y + rand(-4, 4), z, vx: Math.cos(a) * sp * .8 + dir * rand(40, 160), vy: rand(-30, 30), vz: rand(60, big ? 380 : 260),
      life: rand(.4, .8) + (shape !== 'streak' && shape !== 'star' ? rand(1.2, 2.6) : 0), max: 0, col: pick(cols), size: rand(2, big ? 6 : 4.5), shape, rot: rand(0, TAU), vr: rand(-12, 12), rest: false });
    parts[parts.length - 1].max = parts[parts.length - 1].life;
  }
}
function dust(x, y, n) { for (let i = 0; i < n; i++) parts.push({ x: x + rand(-8, 8), y, z: 1, vx: rand(-60, 60), vy: rand(-8, 8), vz: rand(20, 70), life: .45, max: .45, col: 'rgba(255,255,255,.7)', size: rand(3, 6), shape: 'puff', rot: 0, vr: 0 }); }
function floatText(x, y, z, txt, col, size = 14) { nums.push({ x, y, z, txt, col, size, t: .85, max: .85 }); }
function updateFx(dt) {
  for (const p of parts) {
    p.life -= dt;
    if (p.rest) continue;
    p.vz -= GRAV * .9 * dt; p.z += p.vz * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    if (p.z <= 0) {
      p.z = 0;
      if (p.shape === 'puff' || p.shape === 'star' || p.shape === 'streak') { p.life = Math.min(p.life, .1); continue; }
      if (Math.abs(p.vz) > 90) { p.vz *= -.35; p.vx *= .5; } else { p.rest = true; p.vz = 0; if (p.shape === 'blob') { p.size *= 1.6; p.flat = 1; } }
    }
  }
  parts = parts.filter(p => p.life > 0);
  for (const f of fx) f.t -= dt; fx = fx.filter(f => f.t > 0);
  for (const n of nums) { n.t -= dt; n.z += 30 * dt; } nums = nums.filter(n => n.t > 0);
  for (const g of ghosts) g.a -= dt * 1.6; ghosts = ghosts.filter(g => g.a > 0);
}

// ---------- enemies ----------
const scaleStat = (v, k) => v * (1 + k * save.cycle);
function spawnEnemy(type, side, isBoss) {
  const def = isBoss ? BOSSES[type] : EDEF[type];
  const hp = Math.round(scaleStat(def.hp, .5));
  const e = { type, def, boss: !!isBoss, x: side > 0 ? camX + VW + 40 : camX - 40, y: isBoss ? 300 : rand(FLOOR_TOP + 14, FLOOR_BOT - 6),
    z: def.move === 'fly' ? def.hover : 0, vx: 0, vz: 0, facing: -side, hp, maxHp: hp, hw: def.hw, hh: def.hh,
    dmg: Math.round(scaleStat(def.dmg, .3)), cd: rand(.6, 1.4), poiseMax: def.poise || 0, poise: def.poise || 0,
    state: 'idle', t: 0, plan: null, slot: rand(-26, 26), flash: 0, jit: 0, sqx: 1, sqy: 1, sq: 1, rotA: 0, spin: 0, walk: rand(0, 6), hopT: rand(0, .5), air: false, jug: 0, walls: 0 };
  enemies.push(e); return e;
}
function attackers() { let n = 0; for (const e of enemies) if (!e.dead && ['wind', 'strike', 'dash', 'pounce', 'leap'].includes(e.state)) n++; return n; }
function leftWall() { return (lockX !== null ? lockX : camX) + 14; }
function rightWall() { return (lockX !== null ? lockX : camX) + VW - 14; }
function updateEnemy(e, dt) {
  e.flash = Math.max(0, e.flash - dt); e.jit = Math.max(0, e.jit - dt); e.flinch = Math.max(0, (e.flinch || 0) - dt);
  e.sqx += (1 - e.sqx) * Math.min(1, dt * 12); e.sqy += (1 - e.sqy) * Math.min(1, dt * 12);
  if (stillT > 0 && !e.dead) return;
  e.cd -= dt;
  const fly = e.def.move === 'fly';
  const ballistic = e.air || e.state === 'leap' || e.state === 'pounce' || (!fly && (e.z > 0 || e.vz > 0)); // vz > 0 lets a hop leave the ground
  if (ballistic) {
    e.vz -= GRAV * dt; e.z += e.vz * dt; e.x += e.vx * dt; e.rotA += e.spin * dt;
    if (e.wallOK && (e.walls || 0) < 2 && ((e.x < leftWall() && e.vx < -150) || (e.x > rightWall() && e.vx > 150))) {
      e.vx = -e.vx * .55; e.vz = Math.max(e.vz, 200); e.walls++; e.wallOK = e.walls < 2;
      shakeMag = Math.max(shakeMag, 6); hitstop = Math.max(hitstop, .06); sfx('slam');
      burst(e.x, e.y, e.z + 20, ['#FFFFFF', '#EED48A'], 12, 'spark', Math.sign(e.vx));
      fx.push({ kind: 'ring', x: e.x, y: e.y, z: e.z + 20, t: .25, max: .25, r: 30, col: '#FFFFFF' });
    }
    if (e.z <= 0) { e.z = 0; enemyLand(e); }
  } else if (fly && !['down', 'dying'].includes(e.state)) {
    e.z += (e.def.hover + Math.sin(performance.now() / 300 + e.walk) * 6 - e.z) * Math.min(1, dt * 3);
  }
  e.x = clamp(e.x, camX - 60, camX + VW + 60);
  const dxp = P.x - e.x, dyp = P.y - e.y;
  switch (e.state) {
    case 'dying': e.t -= dt; if (e.t <= 0 && !e.popped) { e.popped = true; popEnemy(e); e.remove = true; } return;
    case 'hurt':
      e.t -= dt; if (!e.air) { e.x += e.vx * dt; e.vx *= Math.pow(.02, dt); if (Math.abs(e.vx) > 160 && Math.random() < .5) dust(e.x, e.y, 1); }
      if (e.t <= 0 && !e.air) { e.state = 'idle'; e.jug = 0; }
      return;
    case 'down':
      e.t -= dt; e.x += e.vx * dt; e.vx *= Math.pow(.002, dt);
      if (e.t <= 0) { e.state = 'idle'; e.rotA = 0; e.cd = Math.max(e.cd, .6); e.jug = 0; e.walls = 0; }
      return;
    case 'idle': {
      if (!e.plan) e.plan = pick(e.def.plans);
      const p = e.plan, side = Math.sign(e.x - P.x) || 1;
      e.facing = -side;
      // anyone outside the view walks straight in before doing anything else
      const inL = camX + 26 + e.hw, inR = camX + VW - 26 - e.hw;
      if (e.x < inL || e.x > inR) { approach(e, clamp(e.x, inL + 30, inR - 30), P.y, dt, 1.5); return; }
      const melee = p === 'bite' || p === 'swing' || p === 'pounce';
      const busy = attackers() >= 2 && !e.boss;
      let tx, ready;
      if (p === 'shoot' || p === 'volley') { tx = P.x + side * 150; ready = Math.abs(dyp) < 10; }
      else if (p === 'charge') { tx = P.x + side * 150; ready = Math.abs(dyp) < 10 && Math.abs(e.x - tx) < 50; }
      else if (p === 'slam' || p === 'summon') { tx = P.x + side * 100; ready = true; }
      else { const reach = p === 'pounce' ? 90 : e.def.reach; tx = P.x + side * (reach * .75 + e.hw * .5); ready = Math.abs(e.x - tx) < 10 && Math.abs(dyp) < 8; }
      if (busy && !ready) tx = P.x + side * Math.max(90, Math.abs(tx - P.x)); // wait close by, spread out, never far away
      tx = clamp(tx, inL, inR);
      if (ready && e.cd <= 0 && !busy && P.state !== 'dead') wind(e, p === 'charge' ? e.def.wind + .2 : p === 'slam' ? .5 : p === 'summon' ? .8 : e.def.wind);
      else if (ready && melee) e.walk = 0;
      else approach(e, tx, P.y + (busy ? e.slot : 0), dt, busy ? .85 : 1.2);
      return;
    }
    case 'wind': e.t -= dt; if (e.plan !== 'charge') e.facing = Math.sign(dxp) || e.facing; if (e.t <= 0) execute(e); return;
    case 'strike':
      e.t -= dt;
      if (!e.struck) {
        e.struck = true;
        const fwd = (P.x - e.x) * e.facing, reach = e.def.reach + e.hw;
        if (fwd > -10 && fwd < reach && Math.abs(dyp) < 18 + e.hw * .2 && P.z < 40) playerDamage(e.dmg, e.x, e.hw > 22 || e.boss);
      }
      if (e.t <= 0) recover(e, .5);
      return;
    case 'dash':
      e.t -= dt; e.x += e.facing * (e.boss ? 330 : 300) * dt;
      if (Math.random() < .7) dust(e.x - e.facing * e.hw, e.y, 1);
      if (!e.struck && Math.abs(P.x - e.x) < e.hw + 12 && Math.abs(dyp) < 18 && P.z < 30) { e.struck = true; playerDamage(Math.round(e.dmg * 1.2), e.x, true); }
      if (e.t <= 0 || e.x < leftWall() || e.x > rightWall()) { e.x = clamp(e.x, leftWall(), rightWall()); recover(e, .8); }
      return;
    case 'pounce': case 'leap':
      if (e.state === 'pounce' && !e.struck && Math.abs(P.x - e.x) < e.hw + 12 && Math.abs(dyp) < 16 && zOverlap(P.z, 60, e.z, e.hh)) { e.struck = true; playerDamage(e.dmg, e.x, false); }
      if (e.state === 'leap') e.y += (e.ty - e.y) * Math.min(1, dt * 3);
      return;
    case 'recover': e.t -= dt; if (e.t <= 0) { e.state = 'idle'; e.plan = null; } return;
  }
}
function enemyLand(e) {
  e.sqx = 1.35; e.sqy = .65;
  if (e.state === 'dying') { if (!e.popped) { e.popped = true; popEnemy(e); e.remove = true; } return; }
  if (e.bounce) { e.bounce = false; e.vz = 300 * (e.boss ? .4 : e.def.weight); e.air = true; shakeMag = Math.max(shakeMag, 5); dust(e.x, e.y, 8); sfx('slam'); return; }
  if (e.state === 'leap') { slamLand(e); return; }
  if (e.state === 'pounce') { dust(e.x, e.y, 5); recover(e, .6); return; }
  if (e.air) { e.air = false; e.spin = 0; e.state = 'down'; e.t = .85; e.walls = 0; dust(e.x, e.y, 8); shakeMag = Math.max(shakeMag, 2.5); }
  if (e.def.move === 'hop') { e.sq = .7; }
}
function approach(e, tx, ty, dt, k) {
  const dx = tx - e.x, dy = ty - e.y, sp = e.def.spd * k;
  const moving = Math.abs(dx) > 3 || Math.abs(dy) > 3;
  if (e.def.move === 'hop') { // jellybloom-style hopping
    e.sq += (1 - e.sq) * Math.min(1, dt * 8);
    if (e.z <= 0 && moving) { e.hopT -= dt; if (e.hopT <= 0) { e.vz = 230; e.hopT = rand(.35, .6); e.sq = 1.25; } }
    if (e.z <= 0) return;
  }
  if (Math.abs(dx) > 3) e.x += Math.sign(dx) * Math.min(Math.abs(dx), sp * dt * (e.def.move === 'hop' ? 1.7 : 1));
  if (Math.abs(dy) > 3) e.y += Math.sign(dy) * Math.min(Math.abs(dy), sp * .7 * dt);
  e.walk = moving ? e.walk + dt * 10 : 0;
  for (const o of enemies) {
    if (o === e || o.dead) continue;
    const ox = e.x - o.x, oy = e.y - o.y;
    if (Math.abs(ox) < (e.hw + o.hw) * .8 && Math.abs(oy) < 12) { e.y += (oy >= 0 ? 1 : -1) * 30 * dt; e.x += (ox >= 0 ? 1 : -1) * 16 * dt; }
  }
  e.y = clamp(e.y, FLOOR_TOP + 8, FLOOR_BOT);
}
function wind(e, t) { e.state = 'wind'; e.t = t; e.windMax = t; e.struck = false; e.walk = 0; }
function recover(e, t) { e.state = 'recover'; e.t = t; e.cd = rand(e.def.cd[0], e.def.cd[1]); }
function execute(e) {
  const p = e.plan;
  if (p === 'bite' || p === 'swing') { e.state = 'strike'; e.t = .2; sfx('swing'); e.vx = 0; }
  else if (p === 'pounce') { e.state = 'pounce'; e.vz = 300; e.vx = clamp((P.x - e.x) / .6, -340, 340); e.struck = false; e.sq = 1.3; sfx('jump'); }
  else if (p === 'shoot') { bolt(e, e.y); recover(e, .5); }
  else if (p === 'volley') { [-22, 0, 22].forEach(o => bolt(e, clamp(e.y + o, FLOOR_TOP + 6, FLOOR_BOT))); recover(e, .8); }
  else if (p === 'charge') { e.state = 'dash'; e.t = .8; e.struck = false; sfx('whoosh'); }
  else if (p === 'slam') { e.state = 'leap'; e.vz = 420; e.vx = (P.x - e.x) / .84; e.ty = P.y; }
  else if (p === 'summon') {
    if (enemies.filter(o => !o.dead && !o.boss).length < 3) e.def.summon.forEach((s, i) => spawnEnemy(s, i % 2 ? -1 : 1));
    burst(e.x, e.y, 60, ['#D08AB0', '#EED48A', '#FFFFFF'], 20, 'spark'); recover(e, .6);
  }
}
function slamLand(e) {
  shakeMag = 9; sfx('slam'); e.vx = 0;
  fx.push({ kind: 'ring', x: e.x, y: e.y, z: 2, t: .45, max: .45, r: 110, col: '#FFFFFF', flat: 1 });
  burst(e.x, e.y, 4, ['#FFFFFF', '#E9D8B0'], 18, 'rock', 0, true);
  if (Math.hypot(P.x - e.x, (P.y - e.y) * 2) < 95 && P.z < 16) playerDamage(Math.round(e.dmg * 1.3), e.x, true);
  recover(e, .9);
}
function bolt(e, y) {
  projs.push({ owner: 'e', x: e.x + e.facing * (e.hw + 6), y, z: Math.max(24, e.z + e.hh * .5), vx: e.facing * (e.boss ? 230 : 200), dmg: e.dmg, life: 3.5,
    col: e.def.mat === 'metal' ? '#D04A62' : e.def.mat === 'crystal' || e.def.mat === 'goo' ? '#8FE9FF' : '#EED48A' });
  sfx('shoot');
}

// ---------- loot ----------
function updateLoot(dt) {
  for (const k of loot) {
    k.t += dt;
    if (k.z > 0 || k.vz > 0) { k.vz -= GRAV * dt; k.z = Math.max(0, k.z + k.vz * dt); k.x += k.vx * dt; if (k.z === 0) { k.vz = Math.abs(k.vz) > 120 ? -k.vz * .4 : 0; k.vx *= .5; } }
    const d = Math.hypot(P.x - k.x, (P.y - k.y) * 1.5);
    if (P.state === 'dead' || k.t < .5) continue;
    if (k.kind === 'weapon') { if (d < 30) { k.got = true; gainWeapon(k.weapon); } continue; }
    if (d < 80) { k.x += (P.x - k.x) * Math.min(1, dt * 9); k.y += (P.y - k.y) * Math.min(1, dt * 9); }
    if (d < 14) {
      k.got = true; sfx('pick');
      if (k.kind === 'shard') { save.shards += k.val; runShards += k.val; }
      else if (k.kind === 'sigil') { save.sigils += k.val; runSigils += k.val; floatText(P.x, P.y, 80, '+SIGIL', '#C8607A', 14); }
      else { P.hp = Math.min(maxHp(), P.hp + k.val); floatText(P.x, P.y, 80, '+' + k.val, '#7EC2B0', 15); }
      refreshHud();
    }
  }
  loot = loot.filter(k => !k.got);
}
function gainWeapon(id) {
  save.owned[id] = true; save.weapon = id; P.w = id; P.seq = ''; persist();
  sfx('weapon'); flashT = .15; zoom = .05; slowmo = .4;
  burst(P.x, P.y, 50, ['#EED48A', '#FFFFFF', '#D08AB0'], 30, 'spark', 0, true);
  banner(WEAPONS[id].name + ' found', 'NEW WEAPON · SWAP TO CHANGE · LEVEL IT AT THE FORGE', 2.6);
  refreshHud(true);
}

// ---------- the stage ----------
function startStage(i) {
  stageIdx = i; stage = STAGES[i];
  P = newPlayer();
  enemies = []; projs = []; parts = []; fx = []; nums = []; loot = []; ghosts = []; echoes = []; spawnQ = [];
  props = stage.pods.map(x => ({ kind: 'pod', x, y: FLOOR_TOP + 46 + (x % 3) * 18, hp: 1, theme: stage.theme }));
  camX = 0; lockX = null; waveIdx = 0; waveActive = false; bossSpawned = false; boss = null;
  hitstop = 0; shakeMag = 0; zoom = 0; slowmo = 0; clearT = 0; flashT = 0; hurtFlash = 0;
  runShards = 0; runSigils = 0; comboN = 0; comboT = 0; trumpCharge = 0; mirrorT = 0; stillT = 0; stag = null;
  buildBackground(stage.theme, i * 97 + 13);
  $('#bossbar').hidden = true; $('#go').hidden = true;
  refreshHud(true); refreshCombo();
  banner(stage.name, stage.sub + (save.cycle ? ' · CYCLE ' + (save.cycle + 1) : ''), 2.4);
}
const waveAt = (i) => 520 + i * ((stage.len - 1300) / stage.waves.length);
function updateWorld(dt) {
  if (!waveActive && waveIdx < stage.waves.length && P.x > waveAt(waveIdx)) {
    waveActive = true; lockX = clamp(camX, 0, stage.len - VW); $('#go').hidden = true;
    const wave = stage.waves[waveIdx];
    wave.forEach((t, j) => spawnQ.push({ type: t, side: j % 2 ? -1 : 1, at: j * .8, drop: null }));
    for (const d of stage.drops) if (d.wave === waveIdx && !save.owned[d.weapon]) spawnQ[wave.indexOf(d.type)].drop = d.weapon; // this enemy carries a weapon
  }
  if (!bossSpawned && waveIdx >= stage.waves.length && P.x > stage.len - VW * .75) {
    bossSpawned = true; waveActive = true; lockX = stage.len - VW; $('#go').hidden = true;
    boss = spawnEnemy(stage.boss, 1, true);
    $('#bossname').textContent = boss.def.name; $('#bossbar').hidden = false;
    banner(boss.def.name, 'GUARDIAN OF THIS SHADOW', 2);
  }
  for (const s of spawnQ) s.at -= dt;
  while (spawnQ.length && spawnQ[0].at <= 0) { const s = spawnQ.shift(); const e = spawnEnemy(s.type, s.side); if (s.drop) e.dropWeapon = s.drop; }
  if (waveActive && !bossSpawned && !spawnQ.length && !enemies.some(e => !e.dead)) { waveActive = false; lockX = null; waveIdx++; $('#go').hidden = false; }
  const target = clamp(P.x - VW * .4, 0, stage.len - VW);
  if (lockX !== null) camX += (lockX - camX) * Math.min(1, dt * 5);
  else camX = Math.max(camX, camX + (target - camX) * Math.min(1, dt * 5));
  camX = clamp(camX, 0, Math.max(0, stage.len - VW));

  for (const e of enemies) updateEnemy(e, dt);
  enemies = enemies.filter(e => !e.remove);
  if (stillT <= 0) for (const p of projs) {
    p.x += p.vx * dt; p.life -= dt;
    if (p.owner === 'e') {
      if (Math.abs(p.x - P.x) < 12 && Math.abs(p.y - P.y) < 12 && P.z < 40 && P.state !== 'dead') { playerDamage(p.dmg, p.x - p.vx, false); p.life = 0; }
    } else {
      for (const e of enemies) if (!e.dead && !p.hit.has(e) && Math.abs(p.x - e.x) < 24 && Math.abs(p.y - e.y) < 26) { p.hit.add(e); strike(e, p.dmg, Math.sign(p.vx), { dmg: p.dmg, kb: 300, launch: 300, power: 2 }); }
      if (Math.random() < .9) parts.push({ x: p.x, y: p.y + rand(-10, 10), z: rand(0, 40), vx: 0, vy: 0, vz: 40, life: .4, max: .4, col: '#D08AB0', size: 3, shape: 'star', rot: 0, vr: 4 });
    }
  }
  projs = projs.filter(p => p.life > 0 && p.x > camX - 60 && p.x < camX + VW + 60);
  for (const p of props) p.flash = Math.max(0, (p.flash || 0) - dt);
  props = props.filter(p => !p.broken);
  updateLoot(dt); updateTrumps(dt);
  if (comboT > 0) { comboT -= dt; if (comboT <= 0) endCombo(); }
  if (clearT > 0) { clearT -= dt; if (clearT <= 0) stageClear(); }
}
function endCombo() {
  if (comboN >= 10) { const b = Math.floor(comboN / 5); save.shards += b; runShards += b; floatText(P.x, P.y, 96, `${comboN} HITS · +${b} SHARDS`, '#7EC2B0', 14); }
  comboN = 0; refreshCombo();
}
