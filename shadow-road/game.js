'use strict';
// ---------- run state ----------
const SPX = 112, SPY = 72, RUN = 240, JUMP = 360;
// lighter weapons let you move faster; the hammer and great sword keep the base pace
const W_SPEED = { fists: 1.3, staff: 1.18, hammer: 1, sword: 1, rapier: 1.24 };
let mode = 'title';
let stage = null, stageIdx = 0, P = null;
let enemies = [], projs = [], parts = [], fx = [], nums = [], loot = [], props = [], ghosts = [], echoes = [], spawnQ = [];
let camX = 0, lockX = null, waveIdx = 0, waveActive = false, bossSpawned = false, boss = null;
let hitstop = 0, shakeMag = 0, shakeDir = 0, zoom = 0, slowmo = 0, clearT = 0, flashT = 0, hurtFlash = 0;
let runShards = 0, runSigils = 0, comboN = 0, comboT = 0, trumpCharge = 0, mirrorT = 0, stillT = 0, stags = [], phoenixT = 0;
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
  if (key === 'H' && (w.charge || w.charge2 || unlocked(tree.HC))) return 'charge';
  return unlocked(tree[key]) ? tree[key] : null;
}
// (out of a hopping backstep a dodge counter is still a ground move, so it plays out in full)
function begin(m) {
  if (m === 'charge') { P.state = 'charge'; P.ct = 0; P.clvl = 0; P.seq = 'H'; return; }
  if (!m) { P.state = 'idle'; return; }
  if (m.rise && P.z > 2) m = Object.assign({}, m, { rise: 0, hop: 0, dur: .5, h: [.36, .58] }); // the rising uppercut only ever leaves from the street: no climbing the sky on it
  P.state = m.dive || (P.z > 0 && !m.hop && P.state !== 'dodge') ? 'air' : 'atk'; P.move = m; P.t = 0; P.moveId = (P.moveId || 0) + 1; P.q = null; P.hits = new Map(); P.seq = m.key || 'H'; P.shocked = false; P.waved = false; P.finDone = false; P.turned = false; P.vaultVx = undefined; P.stormed = false; P.blinkList = null; P.blinkTwin = false; P.blinkDouble = false; P.blinkJ = 0; P.twinE = null; P.twinDone = false;
  if (Math.abs(input.mx) > 0.3 && !m.dive) P.facing = Math.sign(input.mx);
  P.vx = (m.lunge || 0) * P.facing; P.dodgeCarry = 0;
  P.hopQ = 0; if (m.hop) { if (m.prep) P.hopQ = m.hop; else P.vz = m.hop; } // a loaded move leaves the ground only once the knees have bent
  if (m.dive) { P.vz = Math.min(P.vz, -120); P.jvx = P.facing * 240; }
  else if (P.state === 'air') { P.vz = Math.max(P.vz, m.fly ? 70 : 110); P.jvx = m.fly ? P.facing * Math.max(Math.abs(P.jvx), 270) : P.jvx * .3; P.airN = (P.airN || 0) + 1; } // a flying attack keeps all the run's speed
  if (m.blink) { // Hellride: pick out who he will step to, nearest first
    P.blinkList = enemies.filter(e => !e.dead && Math.abs(e.x - P.x) < 320 && e.x > camX + 10 && e.x < camX + VW - 10).sort((a, b) => Math.abs(a.x - P.x) - Math.abs(b.x - P.x)).slice(0, m.blink);
    P.blinkI = 0; P.inv = Math.max(P.inv, m.dur);
  }
  if (m.launcher) { P.holdUsed = true; P.chaseQ = false; }
  if (stageIdx >= 2 && (m.power === 2 || m.smash)) for (const e of enemies) { // third-world enemies see a big swing coming and hop clear of it
    if (e.dead || e.boss || e.air || !['idle', 'recover'].includes(e.state)) continue;
    const dx = (e.x - P.x) * P.facing;
    if (dx > -10 && dx < (m.x1 || 60) + 50 && Math.abs(e.y - P.y) < 30 && Math.random() < .28) { e.state = 'evade'; e.t = .38; e.vx = Math.sign(e.x - P.x || 1) * 330; e.sqx = .8; e.sqy = 1.15; dust(e.x, e.y, 4); }
  }
  sfx(m.power === 2 || m.rot || m.spin ? 'whoosh' : 'swing');
  if (m.lvl) learnedCue(m); // a learned move announces itself: a chime, a gilded flourish, gold along the weapon and round him (moves.js)
}

// ---------- player ----------
function updatePlayer(dt) {
  const w = WEAPONS[P.w];
  P.inv = Math.max(0, P.inv - dt); P.specialT = Math.max(0, (P.specialT || 0) - dt); P.chaseT = Math.max(0, (P.chaseT || 0) - dt);
  const wasAir = P.z > 0 || P.vz > 0;
  if (wasAir) {
    P.vz -= GRAV * dt * (P.state === 'air' && P.move && P.move.dive ? 1.8 : 1) * roomGrav; // the Wyrm's Nest loosens its pull
    P.z += P.vz * dt;
    if (P.z <= 0) { P.z = 0; P.vz = 0; onLand(); }
  }
  const mx = input.mx, my = input.my, sp = (W_SPEED[P.w] || 1) * (P.shrink || 1) * (pw('haste') ? 1.3 : 1) * (1 + gearStat('speed')) * roomSlow; // tiny, he covers ground in proportion to his size: a small man takes small steps (and some armor is light on its feet)
  if (pressed.trump && !['dead', 'down'].includes(P.state)) playTrump(); // the card can be played whatever else he is doing
  switch (P.state) {
    case 'idle': case 'walk': case 'run': {
      if (pressed.swap) swapWeapon();
      if (pressed.shoot) { startShoot(); break; }
      const running = input.run && Math.abs(mx) > 0.3;
      if (pressed.jump) { if (P.chaseT > 0) { chaseJump(); break; } P.vz = JUMP; P.state = 'jump'; P.jvx = running ? Math.sign(mx) * RUN * sp * 1.05 : mx * SPX * sp; P.jvy = my * SPY * sp; P.airN = 0; P.runJump = running; P.jhUsed = false; sfx('jump'); dust(P.x, P.y, 5); break; }
      if (pressed.dodge) { startDodge(); break; }
      if (input.light && P.holdL >= .2 && !P.holdUsed) { begin(w.tree.X); break; } // hold Attack: launcher
      if (pressed.light) { const walking = Math.abs(mx) > .5 || Math.abs(my) > .5; begin(running ? w.tree.D : walking && unlocked(w.tree.M) ? w.tree.M : nextMove('L')); break; }
      if (pressed.heavy) { begin(running ? (unlocked(w.tree.DH) ? w.tree.DH : w.tree.DX || w.tree.D) : nextMove('H')); break; } // every weapon has its own running heavy (DX) until it learns DH
      P.seq = '';
      if (running) {
        P.state = 'run'; P.facing = Math.sign(mx); P.x += P.facing * RUN * sp * dt; P.y += my * SPY * sp * .6 * dt; P.walk += dt * 13 * sp / Math.sqrt(P.shrink || 1); // long, loping strides: fewer steps for the same ground
        P.ghostT -= dt; if (P.ghostT <= 0) { P.ghostT = .05; addGhost(); }
        if (Math.random() < dt * 14) dust(P.x - P.facing * 8, P.y, 1);
      } else {
        const moving = mx !== 0 || my !== 0;
        P.x += mx * SPX * sp * dt; P.y += my * SPY * sp * dt;
        if (Math.abs(mx) > 0.1) P.facing = Math.sign(mx);
        P.state = moving ? 'walk' : 'idle'; P.walk = moving ? P.walk + dt * 11 * Math.sqrt(P.shrink || 1) : 0; // (a little man's steps quicken only a touch: he still crosses the ground slowly)
      }
      break;
    }
    case 'jump':
      P.x += P.jvx * dt; P.y += P.jvy * dt;
      if (airSpecial()) break;
      if (pressed.shoot) { startShoot(); break; }
      if (P.airQ && P.z > 16) { const q = P.airQ; P.airQ = null; P.jvy = 0; if (q === 'H' && !P.jhUsed && w.tree.JH) { P.jhUsed = true; begin(w.tree.JH); } else if (airNext()) begin(airNext()); break; } // an attack pressed during the uppercut or the leap goes off once he is up
      if (pressed.heavy && P.jhUsed && unlocked(w.tree.AH)) { P.jvy = 0; begin(w.tree.AH); } // a second Heavy in the same jump: the learned dive
      else if (pressed.heavy && !P.jhUsed && w.tree.JH) { P.jvy = 0; P.jhUsed = true; begin(w.tree.JH); } // the air heavy, once a jump
      else if (pressed.light && P.runJump && !P.airN && w.tree.DA) { P.jvy = 0; P.runJump = false; begin(w.tree.DA); } // off a run: the flying attack
      else if ((pressed.light || pressed.heavy) && airNext()) { P.jvy = 0; begin(airNext()); }
      break;
    case 'air': { // air combo: up to three hits, then a spike back to the ground
      const m = P.move, k = P.t / m.dur;
      P.x += P.jvx * dt; P.t += dt;
      if (m.dive || (k >= m.h[0] && k <= m.h[1])) doHits();
      if (m.hover) P.vz = Math.max(P.vz, -15); // the helicopter spin holds you up
      if (!m.hover && airSpecial()) break;
      if (airHeavyHold(m)) break;
      if (P.specialT > 0) learnedTrail(dt);
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
      const maxL = save.wl.sword >= 7 ? 4 : save.wl.sword >= 2 ? 3 : 2; // Shadow Cleave is the sword's first upgrade, the Judgement of Amber its last
      // the rapier charges twice: a glint at .4 s, a second at .9 s, and once Hellride is learned a third at 1.5 s (what each releases: rapierRelease, moves.js)
      const lvl = w.charge2 ? (P.ct >= 1.5 && unlocked(w.tree.HC) ? 3 : P.ct >= .9 ? 2 : P.ct >= .4 ? 1 : 0) : !w.charge ? (P.ct >= .45 ? 1 : 0) : P.ct >= 2.05 && maxL === 4 ? 4 : P.ct >= 1.5 && maxL >= 3 ? 3 : P.ct >= .95 ? 2 : P.ct >= .45 ? 1 : 0;
      if (lvl > P.clvl && w.charge2) { P.clvl = lvl; P.clAt = P.ct; rapierChargeCue(lvl); }
      if (lvl > P.clvl) { P.clvl = lvl; sfx('charge', lvl); burst(P.x - P.facing * 6, P.y, 56, lvl === 4 ? ['#FFE9A0', '#FFFFFF'] : lvl === 3 ? '#C8607A' : '#D8AA55', 8 + lvl * 4, 'spark'); zoom = Math.max(zoom, .02 + (lvl === 4 ? .02 : 0)); }
      if (Math.abs(mx) > 0.3) P.facing = Math.sign(mx);
      if (pressed.dodge) { startDodge(); break; }
      if (!input.heavy) {
        if (w.charge) { const m = Object.assign({ key: 'H' }, WEAPONS.sword.charged[P.clvl]); begin(m); }
        else if (w.charge2) rapierRelease(P.clvl);
        else begin(P.ct >= .45 ? w.tree.HC : w.tree.H); // a quick tap is the normal Heavy, a held one the charged special
        P.seq = 'H';
      }
      break;
    }
    case 'shoot': P.x += P.vx * dt; P.vx *= Math.pow(.02, dt); if (P.z > 0) { P.x += (P.jvx || 0) * dt * .5; } updateShoot(dt); break;
    case 'parry': // the guard is up: a blow that lands on it in the first moments is answered (see playerDamage)
      P.t += dt; P.x -= P.facing * 70 * Math.max(0, 1 - P.t * 4) * dt;
      if (P.t >= .4) P.state = 'idle';
      break;
    case 'dodge':
      P.t -= dt; P.x += P.dvx * dt; P.y += P.dvy * dt;
      if (pressed.light) P.dq = 'L'; if (pressed.heavy) P.dq = unlocked(w.tree.RH) ? 'H' : w.tree.R && w.tree.R.heavyAlt ? 'HA' : 'L'; // attack out of a roll (HA: the dodge counter's own heavy form, data.js heavyAlt)
      if (P.dq && P.t < .2) { const k = P.dq, dv = Math.abs(P.dvx); P.dq = false; P.inv = Math.max(P.inv, .15); begin(k === 'H' ? w.tree.RH : k === 'HA' ? Object.assign({}, w.tree.R, w.tree.R.heavyAlt, { heavyAlt: null }) : w.tree.R); if (k === 'L' && P.w === 'rapier' && Math.sign(P.dvx) === P.facing) { P.vx = P.facing * Math.max(Math.abs(P.vx), dv * 1.2); P.dodgeCarry = 1; } break; } // a dodge-attack keeps the dodge's momentum
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
  P.airN = 0; P.j2 = false; P.jhUsed = false; P.runJump = false; P.airQ = null;
  if (P.state === 'jump') { P.state = 'idle'; }
  else if (P.state === 'air' || (P.state === 'atk' && P.move && (P.move.shock || P.move.bounce) && P.move.hop)) {
    const m = P.move;
    if (m.shock && !P.shocked) shockwave(P.x + P.facing * 20, P.y, m.shock, m);
    if (P.state === 'air') { P.state = 'idle'; P.airUsed = false; P.t = 0; }
    else { P.t = Math.max(P.t, m.dur * m.h[1]); if (m.airCarry) P.vx = 0; } // (the slam plants him where the hammer hits)
  }
  else if (P.state === 'hurt' && P.knocked) { P.state = 'down'; P.t = .6; shakeMag = Math.max(shakeMag, 3); }
}
function runMove(dt) {
  let m = P.move; P.t += dt * (pw('haste') ? 1.2 : 1); const k = P.t / m.dur;
  if (P.hopQ && k >= m.h[0] * .8) { P.vz = P.hopQ; P.hopQ = 0; dust(P.x, P.y, 5); }
  const carried = m.airCarry && (P.z > 0 || P.vz > 0); // a leap that keeps the run's speed: only a light drag while he is in the air (stopped dead by the landing: onLand)
  P.x += P.vx * dt; P.vx *= Math.pow(carried ? .4 : P.dodgeCarry && m.key === 'R' ? .3 : m.lunge > 300 ? .05 : .004, dt);
  if (m.slide && P.z <= 2 && Math.abs(P.vx) > 40 && Math.random() < .6) dust(P.x - P.facing * 8, P.y, 1); // the slide kicks up the street
  if (m.lunge > 250 || m.rot || m.spin) { P.ghostT -= dt; if (P.ghostT <= 0) { P.ghostT = .035; addGhost(); } }
  const airborne = P.z > 0;
  if (m.fin && !P.finDone && k >= m.fin.at) { // the move's last beat hits differently: everyone is struck once more, by the finisher
    P.finDone = true; P.hits = new Map(); P.shocked = false; if (m.fin.vz) P.vz = m.fin.vz;
    m = P.move = Object.assign({}, m, m.fin, { fin: null, finBase: m });
  }
  if (moveExtras(m, k, dt, airborne)) return;
  if (((k >= m.h[0] && k <= m.h[1]) || (airborne && k >= m.h[0] && (m.bounce || m.shock))) && !(P.blinkList && P.blinkList.length)) doHits();
  if (m.shock && !m.hop && !P.shocked && k >= m.h[0]) shockwave(P.x + P.facing * (m.x1 * .7), P.y, m.shock, m);
  if (m.wave && !P.waved && k >= m.h[0]) {
    P.waved = true;
    const quake = m.waveKind === 'quake'; // the hammer's crack runs along the ground; the sword's wave is a crescent of light
    for (const d of m.wave2 ? [1, -1] : [1]) projs.push({ owner: 'p', x: P.x + d * P.facing * 40, y: P.y, z: 0, vx: d * P.facing * (quake ? 300 : 340), dmg: Math.round((m.wave === 1 ? 40 : m.wave) * wMult(P.w)), life: quake ? .9 : 1, hit: new Set(), wave: 1, quake }); // wave2: it runs both ways
  }
  if (k > .3) { if (pressed.light) P.q = 'L'; if (pressed.heavy) P.q = 'H'; }
  if (pressed.dodge && k > .4 && !(m.rise && airborne)) { startDodge(); return; } // (no dodging off the top of the rising uppercut)
  if (m.launcher && pressed.jump) P.chaseQ = true; // a jump pressed during the launcher is remembered
  if (m.launcher && !m.rise && P.chaseQ && k > .35) { P.chaseQ = false; chaseJump(); return; } // leap after the enemy you just launched
  if (m.rise && airborne && (P.t >= m.dur || (k > m.h[1] + .06 && (P.q || P.chaseQ)))) { toAir(P.q); return; } // the rising uppercut hands him to the air near the top of the climb, or as soon as an air attack is asked for
  if (m.key === 'L' && input.light && P.holdL >= .18 && !P.holdUsed) { begin(WEAPONS[P.w].tree.X); return; } // held: the jab turns into the launcher
  if (P.t >= m.dur && !(m.hop && airborne)) {
    if (input.light && P.holdL >= .2 && !P.holdUsed && m.key && m.key[0] === 'L') { begin(WEAPONS[P.w].tree.X); return; }
    if (m.upJump && P.q !== 'H' && !airborne) { autoLeap(P.q); return; } // two Heavies: he leaps up after them (a third Heavy throws HHH instead)
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
function toAir(q, vz) { // hand him from a move to an ordinary jump, still going up: air attacks, the air heavy and the landing all as usual
  P.state = 'jump'; if (vz) P.vz = vz; P.jvy = 0; P.airN = 0; P.jhUsed = false; P.runJump = false; P.j2 = false; P.seq = ''; P.chaseQ = false; P.chaseT = 0;
  const foe = P.hits ? [...P.hits.keys()].filter(e => enemies.includes(e) && !e.dead).sort((a, b) => (b.air ? 1 : 0) - (a.air ? 1 : 0))[0] : null; // drift after whoever he just hit, an airborne one first
  P.jvx = foe ? clamp((foe.x + (foe.vx || 0) * .4 - P.facing * (foe.hw + 20) - P.x) / .4, -260, 260) : P.facing * 30; // (aimed at where they will be as he comes level with them)
  P.airQ = q || null; P.q = null;
}
function autoLeap(q) { // Heavy, Heavy: up after them off the palms
  toAir(q, 520); sfx('jump'); dust(P.x, P.y, 8); addGhost();
}
function chaseJump() { // leap up after a launched enemy
  P.state = 'jump'; P.vz = 540; P.jvx = clamp(((P.chaseX || P.x) - P.x) / .55, -280, 280); P.jvy = 0; P.airN = 0; P.chaseT = 0; P.jhUsed = false; P.runJump = false;
  sfx('jump'); dust(P.x, P.y, 8); addGhost();
}
function startParry() {
  P.state = 'parry'; P.t = 0; P.seq = ''; P.vx = 0; sfx('swing', .4);
  fx.push({ kind: 'ring', x: P.x + P.facing * 16, y: P.y, z: 40, t: .22, max: .22, r: 26, col: '#E8ECFF' });
}
// a parried blow: steel rings, time catches, and the prince is already at the attacker with the point
function riposte(fromX) {
  let foe = null, best = 170;
  for (const e of enemies) { if (e.dead) continue; const d = Math.abs(e.x - fromX) + Math.abs(e.y - P.y) * .5; if (d < best && Math.abs(e.x - P.x) < 200) { best = d; foe = e; } }
  sfx('hit-metal', 1); flashT = .1; slowmo = .35; hitstop = Math.max(hitstop, .1); P.inv = .5;
  floatText(P.x, P.y, 84, 'PARRY!', '#E8ECFF', 17);
  burst(P.x + P.facing * 18, P.y, 44, ['#FFFFFF', '#E8ECFF', '#D8AA55'], 16, 'spark', P.facing, true);
  if (!foe) { P.state = 'idle'; return; } // a shot turned aside: nothing close enough to answer
  P.facing = Math.sign(foe.x - P.x) || P.facing;
  if (!foe.boss) { foe.state = 'hurt'; foe.t = .9; foe.plan = null; foe.vx = 0; }
  if (Math.abs(foe.x - P.x) > 46) { addGhost(true); P.x = foe.x - P.facing * 44; addGhost(true); } // he closes the distance in a blink
  P.state = 'idle'; begin(WEAPONS[P.w].tree.RIP); P.inv = .5;
}
function startDodge() {
  let dx = input.mx, dy = input.my;
  if (!dx && !dy) dx = -P.facing; // dodging in place is the backstep: a hop away that keeps him facing the threat
  if (WEAPONS[P.w].parry && P.z <= 0 && Math.abs(dy) <= Math.abs(dx) * 1.2 && Math.sign(dx) !== P.facing) { startParry(); return; } // a fencer parries instead
  const d = Math.hypot(dx, dy) || 1;
  const quick = 1 - gearStat('dodgeFast'); // the wayfarer's set: the same dodge, over sooner
  P.state = 'dodge'; P.dodgeDur = P.t = .34 * quick; P.dq = false; const tiny = Math.sqrt(P.shrink || 1); P.dvx = dx / d * 300 / quick * tiny; P.dvy = dy / d * 150 / quick * tiny; P.inv = Math.max(P.inv, .36 + gearStat('iframes')); P.seq = ''; // (shrunk, his dodge carries him a shorter way)
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
  if (m.ends && dx < 0) return dx >= -m.x1 * .8 - hw; // the staff's other end catches whoever is behind
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
    const dir = m.spiralFwd ? P.facing : m.around || m.ends ? (Math.sign(e.x - P.x) || P.facing) : P.facing; // (the travelling spiral carries everyone it catches along the way it is going)
    if (m.delayed) { // the Shadow Flèche: he is past them before the cut shows; a heartbeat later it lands
      echoes.push({ e, dmg: m.dmg * wMult(P.w), dir, m: Object.assign({}, m, { delayed: 0 }), t: .38 });
      fx.push({ kind: 'slash', x: e.x, y: e.y, z: e.z + e.hh * .5, ang: rand(-.5, .5), t: .45, max: .45, size: 40 + e.hw, col: '#C8D0FF' });
    } else strike(e, m.dmg * wMult(P.w), dir, m);
  }
  for (const p of props) {
    if (p.broken || P.hits.has(p)) continue;
    if (!inReach(m, p.x, p.y, 0, 16, 70)) continue;
    P.hits.set(p, now); hitProp(p, m);
  }
}
// critical hits: a small base chance, much better from behind or against helpless enemies
function critChance(e) {
  let c = .04 + .008 * (save.wl[P.w] - 1) + gearStat('crit');
  if ((P.x - e.x) * e.facing < 0) c += .12;                 // struck from behind
  if (e.state === 'down' || e.frozen > 0) c += .14;          // staggered, knocked down or frozen
  else if (e.air) c += .05;                                  // juggled in the air
  const fast = { rapier: 1.45, fists: 1.3, staff: 1.75, hammer: .85, sword: .85 }[P.w] || 1; // quick weapons find the gaps more often
  return Math.min(.35 * Math.max(1, fast) + gearStat('crit'), c * fast);
}
function strike(e, base, dir, m, echo) {
  let raw = base * rand(.9, 1.1) * (stillT > 0 ? (TL('stillness') >= 3 ? 3 : 2) : 1);
  if (P.z > 15 && e.air) raw *= 1.25; // aerial bonus
  const crit = !m.trump && (m.crit || Math.random() < critChance(e));
  let dmg = Math.round(raw * (crit ? 1.8 : P.w === 'fists' || m.arrow ? 1 : .78)); // weapon hits are a little weaker (fists keep full damage); crits keep their full punch
  // what counts as a heavy blow: it breaks blocks and guards
  const heavy = m.trump || m.power === 2 || m.launch || m.smash || m.shock || (m.key && m.key.includes('H')) || m.key === 'X';
  if (!e.boss && !m.trump && !m.el && !heavy && e.state === 'block' && Math.sign(P.x - e.x) === e.facing) { // a raised guard turns a light hit aside
    e.t = Math.max(e.t, .25); floatIcon(e.x, e.y, e.z + e.hh + 10, 'shield', 15); sfx('hit-metal', .3);
    burst(e.x - dir * e.hw * .6, e.y, e.z + e.hh * .6, ['#FFFFFF', '#C8CCD8'], 6, 'spark', -dir); P.vx = -dir * 140; hitstop = Math.max(hitstop, .05); return;
  }
  if (!e.boss && stageIdx >= 2 && !heavy && !m.trump && !m.el && ['idle', 'recover'].includes(e.state) && (e.def.draw === 'human' || e.def.draw === 'knight') && Math.sign(P.x - e.x) === e.facing && Math.random() < .25) {
    e.state = 'block'; e.t = .55; e.plan = null; floatIcon(e.x, e.y, e.z + e.hh + 10, 'shield', 15); sfx('hit-metal', .3); // third-world fighters raise a guard
    burst(e.x - dir * e.hw * .6, e.y, e.z + e.hh * .6, ['#FFFFFF', '#C8CCD8'], 6, 'spark', -dir); P.vx = -dir * 140; hitstop = Math.max(hitstop, .05); return;
  }
  let broke = false, guardPips;
  if (e.elite && e.guard > 0 && !m.el) {
    if (heavy) { e.guard -= m.power === 2 || m.trump ? 2 : 1; if (e.guard <= 0) { e.guard = 0; broke = true; } else { guardPips = e.guard; sfx('hit-metal', .6); armorChip(e, dir); } } // (a chip of the armor flies off with each pip)
    else { guardPips = e.guard; dmg = Math.max(1, Math.round(dmg * .25)); m = Object.assign({}, m, { kb: (m.kb || 0) * .15, launch: 0, noStun: 1 }); sfx('hit-metal', .2); } // light hits glance off the guard
  }
  if (e.shrink < .8) { dmg = Math.round(dmg * 1.4); // a shrunken foe is easier to hurt
    // and if he is still full size it is punted, flying far across the street; when he is tiny too, it is knocked back as
    // usual and its flight is scaled down with it (updateWorld), so two small fighters trade blows at their own scale
    if (!(P.shrink < .8)) { m = Object.assign({}, m, { kb: (m.kb || 0) * 2.4 + 120, launch: (m.launch || 0) * 1.5 + 140 }); e.punted = true; } }
  if (P.shrink < .8) dmg = Math.max(1, Math.round(dmg * .75)); // and a shrunken prince hits softer
  if (pw('might') && !m.trump) dmg = Math.round(dmg * 1.3);
  if (pw('leech') && !m.trump && !e.boss) P.hp = Math.min(maxHp(), P.hp + 1 + dmg * .03);
  if (!m.trump && P.hp > 0 && gearStat('leech')) { P.leechAcc = (P.leechAcc || 0) + dmg * gearStat('leech'); if (P.leechAcc >= 1) { const h = Math.floor(P.leechAcc); P.leechAcc -= h; P.hp = Math.min(maxHp(), P.hp + h); } } // armor that drinks
  { const n0 = nums.length; hurtEnemy(e, dmg, dir, m, crit); if (guardPips) iconNums(n0, 'guard', guardPips); } // (a guarded blow: the guard's diamonds beside the number)
  if (P.specialHit && (m === P.move || (P.move && m.key === P.move.key))) learnedFirstHit(e, dir);
  if (broke && !e.dead) { // the guard shatters and leaves it reeling
    e.state = 'down'; e.t = 1.3; e.vx = dir * 60; e.plan = null; hitstop = Math.max(hitstop, .14); shakeMag = Math.max(shakeMag, 7); sfx('break');
    floatText(e.x, e.y, e.z + e.hh + 26, 'GUARD BREAK!', '#FFD27A', 18); burst(e.x, e.y, e.z + e.hh * .6, ['#EED48A', '#FFFFFF', '#D8AA55'], ARMOR[e.type] && ARMOR_KIND[ARMOR[e.type].mat] ? 10 : 24, 'crystal', dir, true); // (fewer gold glints when the armor bursts into its own bits)
    armorBreak(e, dir);
  }
  if (m === P.move && dir === P.facing && !m.around && !(m.lunge >= 300)) P.carry = Math.max(P.carry || 0, Math.min(Math.abs(e.vx) * (e.air ? 1.4 : .8), 340));
  if (brandT > 0 && !m.trump && !m.el && !e.dead) { if (TL('brand') >= 3) { const keep = brandEl; for (const el of ['fire', 'frost', 'storm']) { brandEl = el; if (!e.dead) applyElement(e, base, dir); } brandEl = keep; } else applyElement(e, base, dir); }
  if (mirrorT > 0 && !echo) { const ml = TL('mirror'); echoes.push({ e, dmg: base * (ml >= 2 ? .8 : .6), dir, m, t: .14 }); if (ml >= 3) echoes.push({ e, dmg: base * .6, dir, m, t: .26 }); }
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
    floatText(e.x, e.y, e.z + e.hh + 14, dmg + '!', '#FF4A32', 22 + pw * 4); nums[nums.length - 1].crit = 1; // red-orange with a starburst behind it: never mistaken for a heavy blow's gold
    fx.push({ kind: 'crit', x: hx, y: e.y, z: hz, t: .3, max: .3, r: 34 + pw * 10 });
    hitstop = Math.max(hitstop, .14); flashT = Math.max(flashT, .04); zoom = Math.max(zoom, .04); shakeMag = Math.max(shakeMag, 7); sfx('crit');
  } else floatText(e.x, e.y, e.z + e.hh + 10, String(dmg), pw === 2 ? '#D8AA55' : '#FFFFFF', 14 + pw * 4);
  sfx(MAT_SFX[e.def.mat], pw * .5);
  comboN++; comboT = 1.8; refreshCombo(true);
  if (save.trump && mirrorT <= 0 && stillT <= 0) trumpCharge = Math.min(TRUMP_CHARGE, trumpCharge + dmg * (1 + gearStat('trump')));
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
      e.vz = P.z > 15 && !m.launch ? 150 * (e.boss ? .35 : e.def.weight) : Math.max(e.vz, up); e.air = true; e.spin = dir * (5 + pw * 4) * (e.boss ? .2 : 1); // (air hits hold them level with you)
    } else { e.vz = Math.min(e.vz, -100); }
  }
}
// each weapon finishes enemies its own way: the sword cuts them in two, the staff caves them in, the hammer flattens them
// where Grayswandir went through a fallen foe: two or three punctures through the chest, and sometimes (two kills in five)
// one of them a bigger round bite taken out of the side of the body. Each is placed clear of the others, rims and all
function rapierWounds(e) {
  const out = [], n = 2 + (Math.random() < .5 ? 1 : 0), bite = Math.random() < .4 ? Math.floor(Math.random() * n) : -1;
  const px = (w) => w.bite ? clamp(e.hw * .5, 6.5, 14) * w.r : clamp(e.hw * .2, 2.6, 5.5) * w.r; // (its radius on the body, as drawDeath sizes it)
  for (let i = 0; i < n; i++) {
    for (let tries = 0; tries < 30; tries++) {
      const w = i === bite ? { bite: 1, x: (Math.random() < .5 ? -1 : 1) * rand(.82, .98), y: rand(.38, .7), r: rand(.9, 1.1), s: rand(0, TAU) }
        : { x: rand(-.3, .3), y: rand(.36, .74), r: rand(.85, 1.1), s: rand(0, TAU) };
      if (out.every(o => Math.hypot((o.x - w.x) * e.hw, (o.y - w.y) * e.hh) > px(o) + px(w) + 7)) { out.push(w); break; } // (a clear gap between the rough rims)
    }
  }
  return out;
}
const DEATH_BY = { sword: 'slice', staff: 'crumple', hammer: 'splat', rapier: 'pierce' };
function killEnemy(e, dir, m) {
  if (e.elite && e.guard > 0) armorBreak(e, dir); // (its armor comes off it as it falls)
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
    if (e.death === 'pierce') { // run through: they stiffen, points of light open where the blade went in, then they fold and fall, and a silver rose is left on them
      e.dmax = e.t = 1.6; e.vx = 0; e.wounds = rapierWounds(e); // (clean punctures through the chest, and now and then a round bite out of the side; never overlapping)
      for (let i = 0; i < 8; i++) parts.push({ x: e.x + dir * 6, y: e.y + rand(-4, 4), z: e.z + e.hh * .55, vx: dir * rand(40, 140), vy: rand(-10, 10), vz: rand(20, 110), life: rand(.6, 1), max: 1, col: pick(cols), size: rand(1.6, 2.6), shape: 'blob' }); // a few flecks out the far side
      fx.push({ kind: 'slash', x: e.x, y: e.y, z: e.z + e.hh * .55, ang: 0, t: .3, max: .3, size: 30 + e.hw, col: '#E8ECFF' }); sfx('slice');
    }
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
    } else if (e.death === 'splat') {
      e.z = 0; makeCrater(e, dir); // the floor gives under it: a dent with cracks, or a soft dent, a puff of silt or a ripple, by the world
      const kind = MAT_KIND[e.def.mat]; // a hard thing bursts into bits of what it was made of; soft things only go flat
      if (kind) matBurst(e.x, e.y, 6 + e.hh * .1, kind, Math.min(14, CROWD ? 8 : 12 + (e.boss ? 2 : 0)), dir, kind === 'glass' || kind === 'crystal' ? MAT_COL[e.def.mat] : null);
      sfx('slam'); sfx(kind ? MAT_SFX[e.def.mat] || 'hit-metal' : 'hit-goo'); shakeMag = Math.max(shakeMag, 6);
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
  maybeDropPower(e); maybeDropArrow(e); maybeDropGear(e);
  if (e.champ) { loot.push(makeLoot('sigil', e.x, e.y, 1)); loot.push(makeLoot('heal', e.x, e.y, 30)); } // a champion always pays
  const n = Math.round(rand(a, b) * (pw('fortune') ? 2 : 1) * (1 + gearStat('shards')) * (1 + .2 * save.cycle) * [.47, .77, 1.1, 1.45, 1.62, 1.8][Math.min(stageIdx, 5)] * (e.elite ? 2 : 1)), pieces = Math.min(n, 8);
  for (let i = 0; i < pieces; i++) loot.push(makeLoot('shard', e.x, e.y, Math.ceil(n / pieces)));
  if (e.boss) for (let i = 0; i < 3 + Math.min(stageIdx, 2); i++) loot.push(makeLoot('sigil', e.x, e.y, 1));
  else if (Math.random() < (e.def.sigil || 0) * [1, 1.4, 1.8, 2.1, 2.25, 2.4][Math.min(stageIdx, 5)] + (e.elite ? .65 : 0) + .04 * Math.min(stageIdx, 4)) loot.push(makeLoot('sigil', e.x, e.y, 1)); // elites usually carry a sigil, the ink for Trump cards
  if (Math.random() < (e.boss ? 1 : .15)) loot.push(makeLoot('heal', e.x, e.y, e.boss ? 50 : 25));
  if (e.dropWeapon && !save.owned[e.dropWeapon]) loot.push(makeLoot('weapon', e.x, e.y, 0, e.dropWeapon));
}
// a weapon found further down the road comes already worked: level 1 in the first two worlds, 2 in the third, 3 in the last two
const foundLvl = () => [1, 1, 2, 3, 3, 3][clamp(stageIdx, 0, 5)];
function makeLoot(kind, x, y, val, weapon) {
  return { kind, val, weapon, lvl: kind === 'weapon' ? foundLvl() : 0, x: x + rand(-14, 14), y: clamp(y + rand(-10, 10), FLOOR_TOP + 8, FLOOR_BOT), z: 14, vz: rand(160, 260), vx: rand(-60, 60), t: 0 };
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
  if (Math.random() < .6) loot.push(makeLoot('heal', p.x, p.y, 20));
}
function playerDamage(dmg, fromX, big) {
  if (P.inv > 0 || P.state === 'dead' || P.state === 'dodge') return;
  if (P.state === 'parry' && P.t < .28) { riposte(fromX); return; }
  if (tryReflect()) return; // prism scale: the shot goes back the way it came
  const raw = dmg;
  if (pw('ward')) dmg = Math.max(1, Math.round(dmg * .5));
  dmg = armorDamage(dmg); thornsBack(raw); P.hurtT = 0; // armor turns part of every blow aside (gear.js)
  P.hp -= dmg; P.inv = .8; shakeMag = Math.max(shakeMag, big ? 7 : 4); hitstop = .07; hurtFlash = .25;
  floatText(P.x, P.y, 70, '-' + dmg, '#D0566A', 16); sfx('hurt');
  burst(P.x, P.y, 34, ['#D0566A', '#FFFFFF'], 10, 'spark');
  const dir = Math.sign(P.x - fromX) || -P.facing;
  P.vx = dir * (big ? 240 : 130); P.facing = -dir; P.seq = '';
  comboN = 0; refreshCombo();
  if (P.hp <= 0 && deathSave()) { P.state = 'hurt'; P.knocked = big; P.t = .3; return; }
  if (P.hp <= 0) { P.hp = 0; P.state = 'dead'; P.vz = 220; P.t = 1.6; slowmo = .8; return; }
  P.state = 'hurt'; P.knocked = big; P.t = big ? .45 : .3; if (big) P.vz = 220;
}

// ---------- trump cards ----------
function playTrump() {
  if (!save.trump || trumpCharge < TRUMP_CHARGE) return;
  if (trySecret()) return; // played at a Trump gate, the card opens a way instead
  trumpCharge = 0; flashT = .2; sfx('trump'); zoom = .06;
  const card = TRUMPS[save.trump];
  banner(card.name, 'CARD PLAYED', 1.4);
  const lv = TL(save.trump);
  if (save.trump === 'stag') { // a lane each; at III the last one turns round at the far side and runs back
    const lanes = [P.y, clamp(P.y + (P.y > 290 ? -40 : 40), FLOOR_TOP + 8, FLOOR_BOT), clamp(P.y + (P.y > 290 ? 40 : -40), FLOOR_TOP + 8, FLOOR_BOT)];
    for (let i = 0; i < lv; i++) stags.push({ x: camX - 60 - i * 70, y: lanes[i], hit: new Set(), t: 0, back: lv >= 3 && i === 2, dir: 1 });
  }
  else if (save.trump === 'mirror') mirrorT = lv >= 2 ? 14 : 10;
  else if (save.trump === 'brand') { brandEl = ['fire', 'frost', 'storm'][brandN++ % 3]; brandT = lv >= 2 ? 20 : 15; banner(ELEMENTS[brandEl].name, 'YOUR WEAPON IS BRANDED FOR 15 SECONDS', 1.6); burst(P.x, P.y, 50, [ELEMENTS[brandEl].col, '#FFFFFF'], 30, 'spark', 0, true); }
  else if (save.trump === 'stillness') stillT = [5, 7, 9][lv - 1];
  else if (save.trump === 'phoenix') {
    P.hp = Math.min(maxHp(), P.hp + maxHp() * [.5, .7, 1][lv - 1]); if (lv >= 3) phoenixT = 6;
    const R = [150, 200, 240][lv - 1], D = [30, 50, 70][lv - 1];
    burst(P.x, P.y, 30, ['#EED48A', '#D8834A', '#D04A62', '#FFFFFF'], 50, 'spark', 0, true);
    fx.push({ kind: 'ring', x: P.x, y: P.y, z: 20, t: .5, max: .5, r: R, col: '#D8834A', flat: 1 });
    for (const e of enemies) if (!e.dead && Math.hypot(e.x - P.x, (e.y - P.y) * 2) < R) strike(e, D, Math.sign(e.x - P.x) || 1, { dmg: D, kb: 420, launch: 300, power: 2, trump: 1 }, true);
  }
  refreshHud();
}
function updateTrumps(dt) {
  mirrorT = Math.max(0, mirrorT - dt); stillT = Math.max(0, stillT - dt); brandT = Math.max(0, brandT - dt);
  if (phoenixT > 0) { // the phoenix's flame clings to him and scorches whoever comes close
    phoenixT -= dt; P.burnTick = (P.burnTick || 0) - dt;
    if (Math.random() < .8) parts.push({ x: P.x + rand(-14, 14), y: P.y, z: rand(5, 60), vx: rand(-20, 20), vy: 0, vz: rand(50, 110), life: .5, max: .5, col: pick(['#FF9A5A', '#FFD27A', '#D04A62']), size: rand(2, 4), shape: 'star', rot: 0, vr: 5 });
    if (P.burnTick <= 0) { P.burnTick = .5; for (const e of enemies) if (!e.dead && Math.hypot(e.x - P.x, (e.y - P.y) * 2) < 70) strike(e, 8, Math.sign(e.x - P.x) || 1, { dmg: 8, kb: 60, power: 0, trump: 1, noStun: 1 }, true); }
  }
  if (brandT > 0 && Math.random() < .7) { // the branded weapon sheds its element
    const el = ELEMENTS[brandEl];
    parts.push({ x: P.x + P.facing * rand(10, 40), y: P.y, z: rand(30, 60), vx: rand(-20, 20), vy: 0, vz: brandEl === 'frost' ? -10 : rand(40, 90), life: .5, max: .5, col: pick([el.col, '#FFFFFF']), size: rand(2, 3.5), shape: 'star', rot: 0, vr: 5 });
  }
  for (const ec of echoes) { ec.t -= dt; if (ec.t <= 0 && !ec.e.dead) strike(ec.e, ec.dmg, ec.dir, ec.m, true); }
  echoes = echoes.filter(ec => ec.t > 0);
  for (const stag of stags) {
    stag.t += dt; stag.x += 620 * stag.dir * dt;
    if (Math.random() < .8) burst(stag.x - 20 * stag.dir, stag.y, rand(10, 50), ['#BFF5FF', '#FFFFFF', '#EED48A'], 2, 'spark');
    for (const e of enemies) if (!e.dead && !stag.hit.has(e) && Math.abs(e.x - stag.x) < 34 && Math.abs(e.y - stag.y) < 60) { stag.hit.add(e); strike(e, 45, stag.dir, { dmg: 45, kb: 380, launch: 460, power: 2, trump: 1 }, true); }
    if (stag.back && stag.dir > 0 && stag.x > camX + VW - 20) { stag.dir = -1; stag.hit = new Set(); stag.back = false; }
    if (stag.x > camX + VW + 80 || stag.x < camX - 120) stag.gone = true;
  }
  stags = stags.filter(s => !s.gone);
}

// ---------- elemental brand ----------
function applyElement(e, base, dir) {
  const el = ELEMENTS[brandEl], cy = e.z + e.hh * .5;
  if (brandEl === 'fire') { e.burn = 3.2; e.burnBase = Math.max(3, base * (TL('brand') >= 2 ? .25 : .18)); }
  else if (brandEl === 'frost') {
    e.chill = 3; e.frost = (e.frost || 0) + 1;
    if (e.frost >= (TL('brand') >= 2 ? 3 : 4)) { e.frost = 0; e.frozen = 1.8; e.state = e.state === 'dying' ? e.state : 'hurt'; e.t = 1.8; burst(e.x, e.y, cy, ['#9FE0FF', '#FFFFFF', '#6EA8D8'], 16, 'crystal', 0, true); floatText(e.x, e.y, e.z + e.hh + 18, 'FROZEN', el.col, 15); sfx('hit-crystal'); }
  } else {
    const near = enemies.filter(o => o !== e && !o.dead && Math.hypot(o.x - e.x, o.y - e.y) < 140).sort((p, q) => Math.abs(p.x - e.x) - Math.abs(q.x - e.x)).slice(0, TL('brand') >= 2 ? 3 : 2);
    for (const o of near) {
      fx.push({ kind: 'bolt', x: e.x, y: e.y, z: cy, x2: o.x, y2: o.y, z2: o.z + o.hh * .5, t: .2, max: .2, col: el.col, seed: Math.random() * 99 });
      strike(o, base * .5, Math.sign(o.x - e.x) || dir, { dmg: base * .5, kb: 60, power: 0, el: 1 });
    }
    sfx('shoot');
  }
  burst(e.x, e.y, cy, [el.col, '#FFFFFF'], 6, 'spark', dir);
}
function updateElements(e, dt) { // burning, chill and freeze on one enemy; returns true while frozen solid
  if (e.bleed > 0 && !e.dead) updateBleed(e, dt); // (a barbed arrow's wound: arrows.js)
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
