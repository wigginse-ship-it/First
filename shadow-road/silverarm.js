'use strict';
// ======================================================================================================
// THE SILVER ARM. Beat the Phantom of Benedict and the arm he leaves on the floor of the Moon Throne is yours
// (save.silverArm, set when he falls: benedict.js). Fight bare-handed and it is on him: his weapon arm is silver to the
// shoulder, plated and gilded at the joints like the Phantom's, and it does what the Phantom's Hand did. It flies off
// on a chain of moonlight and comes back; it grows to the size of a cart; it bursts up out of the street under them;
// it grabs and throws; it snaps; and held back it plays rock, paper, scissors with whoever is in front of it.
// Without the arm, or with any other weapon, the fists are exactly as they were.
//   L LL LLL LLLL   Silver Jab · Moon Cross · Chain Hook · Hundred Hands (a storm of phantom fists, then one huge one)
//   H HH HHH        Rocket Fist (fired down the street and back) · Get Over Here (it grabs the first one and hauls
//                   them in; a boss hauls you in instead) · Titan's Grip (the hand swells huge, crushes, and throws)
//   LH LLH HL X     Up From Below (the hand bursts out of the floor under them) · Meteor Flail (swung round on its
//                   chain) · Moonfall (a leap and a fist the size of a door) · Silver Lift (scooped up into the air)
//   A AA AAA JH DA  air jabs on the chain · Meteor Fist (spike) · Moon Hook (it hooks the nearest foe and reels you in)
//                   · Comet (the arm out ahead of a flying leap)
//   D R RH          Rocket Ride (it fires and drags you along behind it) · Silver Crescent (out of a dodge: a palm and a
//                   crescent of moonlight down the street) · The Snap (a ring of force)
//   HC              Rock, Paper, Scissors: hold Heavy; the hand cycles ROCK, PAPER, SCISSORS; let go on the one you want
//   AH              The Hand of the Moon: in the air, Heavy twice (or hold it): you drop, and a hand out of the sky with you
// Test: in the console, silverArm() puts it on (fists, the arm owned); silverArm(false) takes it off.
// ======================================================================================================
(() => {
  if (typeof WEAPONS === 'undefined' || !WEAPONS.fists || !window.W5 || !W5.kit) return;
  const K = W5.kit, BN = K.BN;
  const SA = window.SA = { objs: [], wrist: null, Mw: null };
  SA.on = () => !!(typeof save !== 'undefined' && save && save.silverArm && P && P.w === 'fists');
  window.silverArm = (on = true) => { save.silverArm = !!on; if (on) { save.owned.fists = true; if (P) { P.w = 'fists'; save.weapon = 'fists'; P.seq = ''; } } if (typeof persist === 'function') persist(); if (typeof refreshHud === 'function' && P) refreshHud(true); return on ? 'the silver arm is yours: fight bare-handed' : 'the arm is put away'; };
  const f = () => P.facing;
  const ST = () => (typeof stage !== 'undefined' ? stage : null);
  const hitE = (e, dmg, dir, m, extra) => { if (!e || e.dead) return; strike(e, dmg * wMult('fists'), dir, Object.assign({}, m, extra || {})); };
  const foes = () => enemies.filter(e => !e.dead && e.state !== 'enter' && e.state !== 'w5morph' && e.state !== 'w5riddle');
  const nearestAhead = (range, depth = 40) => foes().filter(e => (e.x - P.x) * f() > -10 && (e.x - P.x) * f() < range && Math.abs(e.y - P.y) < depth).sort((a, b) => Math.abs(a.x - P.x) - Math.abs(b.x - P.x))[0];
  const silverBurst = (x, y, z, n = 12) => burst(x, y, z, ['#EEF2FA', '#C8D4EC', '#8A9AC8'], n, 'spark', 0, true);

  // ---------------- the moveset ----------------
  const P_ = Math.PI;
  const ARM = {
    L:    { name: 'Silver Jab', dur: .2, h: [.3, .6], x0: 0, x1: 54, dmg: 9, kb: 70, arc: [.9, -.15], lunge: 70 },
    LL:   { name: 'Moon Cross', dur: .22, h: [.3, .6], x0: 0, x1: 58, dmg: 10, kb: 80, arc: [.9, -.15], lunge: 70 },
    LLL:  { name: 'Chain Hook', dur: .34, h: [.3, .66], x0: 0, x1: 104, depth: 26, dmg: 15, kb: 260, arc: [.3, .3], lunge: 60, power: 1 },
    LLLL: { name: 'Hundred Hands', dur: .95, h: [.08, .8], x0: 0, x1: 92, depth: 32, dmg: 3, kb: 40, multi: .055, lunge: 50, power: 1, hundred: 1,
            fin: { at: .82, dmg: 26, kb: 520, launch: 120, power: 2, wall: 1, x1: 96, multi: 0 } },
    H:    { name: 'Rocket Fist', dur: .48, h: [.2, .3], x0: 0, x1: 40, dmg: 22, kb: 260, power: 2, rocket: 1, wall: 1 },
    HH:   { name: 'Get Over Here', dur: .55, h: [.2, .3], x0: 0, x1: 36, dmg: 14, kb: 60, power: 1, rocket: 1, grab: 1 },
    HHH:  { name: "Titan's Grip", dur: .95, h: [.18, .22], x0: 0, x1: 30, dmg: 34, kb: 0, power: 2, titan: 1 },
    LH:   { name: 'Up From Below', dur: .55, h: [.3, .34], x0: 0, x1: 24, dmg: 20, kb: 40, launch: 560, power: 2, below: 1 },
    LLH:  { name: 'Meteor Flail', dur: .8, h: [.1, .86], x0: 0, x1: 100, depth: 36, dmg: 7, kb: 200, around: 1, multi: .11, spin: 2, power: 1, flail: 1 },
    HL:   { name: 'Moonfall', dur: .6, h: [.55, .8], x0: 0, x1: 60, depth: 30, dmg: 28, kb: 140, arc: [-2.6, 1.4], hop: 300, lunge: 110, bounce: 1, shock: 120, power: 2 },
    X:    { name: 'Silver Lift', dur: .5, h: [.36, .58], prep: 1, x0: 0, x1: 60, dmg: 15, kb: 30, launch: 650, arc: [1.6, -1.8], launcher: 1, power: 1 },
    A:    { dur: .28, h: [.2, .6], x0: 0, x1: 56, dmg: 10, kb: 70, arc: [.9, -.2] },
    AA:   { dur: .3, h: [.2, .6], x0: 0, x1: 60, dmg: 11, kb: 80, arc: [.5, .2] },
    AAA:  { name: 'Meteor Fist', dur: .42, h: [.2, .65], x0: 0, x1: 70, depth: 26, dmg: 17, kb: 140, arc: [-2.4, 1.4], spike: 1, power: 2 },
    JH:   { name: 'Moon Hook', dur: .55, h: [.36, .66], x0: 0, x1: 50, dmg: 18, kb: 320, power: 2, wall: 1, hook: 1 },
    DA:   { name: 'Comet', dur: .5, h: [.22, .64], x0: 0, x1: 86, depth: 24, dmg: 20, kb: 420, arc: [.1, .1], fly: 1, power: 2, wall: 1 },
    D:    { name: 'Rocket Ride', dur: .66, h: [.1, .82], x0: 0, x1: 54, depth: 26, dmg: 7, kb: 260, multi: .09, lunge: 640, power: 1, wall: 1, ride: 1 },
    R:    { name: 'Silver Crescent', dur: .42, h: [.28, .62], x0: 0, x1: 50, dmg: 17, kb: 300, lunge: 330, power: 1, crescent: 1 },
    RH:   { name: 'The Snap', dur: .5, h: [.3, .4], x0: 0, x1: 70, dmg: 18, kb: 300, around: 1, power: 2, snap: 1 },
    HC:   { name: 'Rock, Paper, Scissors', dur: .7, h: [.42, .6], x0: 0, x1: 120, depth: 34, dmg: 30, kb: 300, power: 2, janken: 1 },
    AH:   { name: 'The Hand of the Moon', dur: .55, h: [.15, .97], x0: 0, x1: 70, dmg: 30, kb: 160, arc: [-2, 1.5], dive: 1, shock: 150, bounce: 1, power: 2, smash: 1, sky: 1 },
  };
  for (const k in ARM) { ARM[k].key = k; ARM[k].arm = 1; }
  const JANKEN = { // what Rock, Paper, Scissors turns into when you let go
    rock:     { name: 'Rock!', dmg: 42, kb: 200, launch: 300, x1: 90, depth: 40, shock: 140, bounce: 1, h: [.42, .6] },
    paper:    { name: 'Paper!', dmg: 24, kb: 720, x1: 150, depth: 44, wall: 1, multi: 0, h: [.38, .62] },
    scissors: { name: 'Scissors!', dmg: 16, kb: 160, x1: 130, depth: 30, multi: .14, crit: 1, h: [.36, .7] },
  };
  const JK = ['rock', 'paper', 'scissors'], jkOf = (ct) => JK[Math.max(0, Math.floor((ct - .45) / .42)) % 3];
  const base = WEAPONS.fists.tree, baseName = WEAPONS.fists.name, baseDesc = WEAPONS.fists.desc;
  Object.defineProperty(WEAPONS.fists, 'tree', { get() { return SA.on() ? ARM : base; }, configurable: true });
  Object.defineProperty(WEAPONS.fists, 'name', { get() { return SA.on() ? 'The Silver Arm' : baseName; }, configurable: true });
  Object.defineProperty(WEAPONS.fists, 'desc', { get() { return SA.on() ? 'Benedict\'s arm, out of Tir-na Nog\'th. It flies, it grows, it grabs.' : baseDesc; }, configurable: true });
  SA.tree = ARM;

  // ---------------- the mechanics ----------------
  { const _mpk = movePoseKey; movePoseKey = function (m) { return m && m.arm ? 'arm:' + m.key : _mpk(m); }; }
  const _me = moveExtras;
  moveExtras = function (m, k, dt, air) { if (_me(m, k, dt, air)) return true; return m.arm ? armExtras(m, k, dt, air) : false; };
  function armExtras(m, k, dt, air) {
    const once = (key, at, fn) => { if (k >= at && P.armDone !== P.moveId + key) { P.armDone = P.moveId + key; fn(); } };
    if (m.janken && !m.jk) { const s = jkOf(P.ct || 0); P.move = Object.assign({}, m, JANKEN[s], { jk: s }); floatText(P.x, P.y, 96, JANKEN[s].name.toUpperCase(), '#EEF2FA', 18); sfx('learned'); return false; }
    if (m.jk) { once('j', m.h[0], () => { sfx('slam'); shakeMag = Math.max(shakeMag, 9); zoom = Math.max(zoom, .05);
      if (m.jk === 'rock') { silverBurst(P.x + f() * 60, P.y, 6, 24); fx.push({ kind: 'ring', x: P.x + f() * 60, y: P.y, z: 2, t: .45, max: .45, r: 150, col: '#EEF2FA', flat: 1 }); }
      if (m.jk === 'paper') SA.objs.push({ kind: 'gust', x: P.x + f() * 40, y: P.y, dir: f(), t: 0, max: .45 });
      if (m.jk === 'scissors') SA.objs.push({ kind: 'snip', x: P.x + f() * 70, y: P.y, dir: f(), t: 0, max: .3 }); }); }
    if (m.rocket) once('r', m.h[0], () => { SA.objs.push({ kind: 'rocket', x: P.x + f() * 24, y: P.y, z: P.z + 44, dir: f(), d: 0, out: m.grab ? 300 : 340, back: false, hit: new Set(), m, grab: m.grab, born: P.moveId }); sfx('whoosh'); sfx('shoot'); });
    if (m.titan) once('t', m.h[0], () => { const e = nearestAhead(110 + (P.z > 0 ? 0 : 0), 34); sfx('charge', 2);
      SA.objs.push({ kind: 'titan', e: e || null, t: 0, dir: f(), m, done: {} }); if (!e) floatText(P.x, P.y, 90, 'NOTHING TO GRAB', '#C8D4EC', 11); });
    if (m.below) once('b', m.h[0], () => { const e = nearestAhead(200, 44), x = e ? e.x : P.x + f() * 120, y = e ? e.y : P.y; SA.objs.push({ kind: 'burst', x: clamp(x, leftWall() + 10, rightWall() - 10), y, t: 0, max: .7, m, hit: new Set(), dir: f() }); sfx('slam'); shakeMag = Math.max(shakeMag, 5); dust(P.x + f() * 20, P.y, 6); });
    if (m.hundred && k < m.h[1]) { SA.ghostT = (SA.ghostT || 0) - dt; if (SA.ghostT <= 0) { SA.ghostT = .03; SA.objs.push({ kind: 'ghost', x: P.x + f() * rand(26, 86), y: P.y + rand(-14, 14), z: P.z + rand(26, 72), dir: f(), t: 0, max: .16, s: rand(.17, .25), a: rand(-.25, .25) }); if (Math.random() < .4) sfx('swing', .3); } }
    if (m.snap) once('s', m.h[0], () => { sfx('crit'); sfx('slam'); flashT = Math.max(flashT, .05); fx.push({ kind: 'ring', x: P.x, y: P.y, z: 2, t: .4, max: .4, r: 120, col: '#EEF2FA', flat: 1 }); shockwave(P.x, P.y, 100, m); });
    if (m.crescent) once('c', m.h[0], () => { SA.objs.push({ kind: 'crescent', x: P.x + f() * 30, y: P.y, dir: f(), t: 0, max: .8, hit: new Set(), m }); sfx('whoosh'); });
    if (m.hook) { once('h0', 0, () => { const e = foes().filter(o => Math.abs(o.x - P.x) < 280 && Math.abs(o.y - P.y) < 60).sort((a, b) => Math.abs(a.x - P.x) - Math.abs(b.x - P.x))[0]; P.hookE = e || null; if (e) { P.facing = Math.sign(e.x - P.x) || P.facing; sfx('whoosh'); } });
      const e = P.hookE; if (e && !e.dead && k < m.h[0]) { const tx = e.x - P.facing * (e.hw + 26); P.jvx = (tx - P.x) / Math.max(.05, (m.h[0] - k) * m.dur); P.y += (e.y - P.y) * Math.min(1, dt * 12); P.vz = Math.max(P.vz, 40); } else if (k >= m.h[0]) P.jvx *= .9; }
    if (m.ride && k < m.h[1] && Math.random() < dt * 30) parts.push({ x: P.x - f() * 10, y: P.y + rand(-3, 3), z: 2, vx: -f() * rand(60, 160), vy: 0, vz: rand(30, 90), life: .4, max: .4, col: pick(['#FFFFFF', '#DDE6FF', '#C8D4EC']), size: rand(1.5, 3), shape: 'star', rot: 0, vr: 4 }); // silver sparks off the street
    if (m.sky) once('k', 0, () => { SA.objs.push({ kind: 'sky', x: P.x + f() * 40, y: P.y, t: 0, landed: false, dir: f() }); sfx('charge', 3); });
    return false;
  }
  // the world things the arm leaves flying about: stepped every frame the prince is
  const _up = updatePlayer;
  updatePlayer = function (dt) {
    if (P.state === 'air' && P.move && P.move.arm) armExtras(P.move, P.t / P.move.dur, dt, true); // (game.js steps air moves without moveExtras)
    _up(dt);
    if (SA.stage !== ST()) { SA.stage = ST(); SA.objs = []; }
    if (P.shocked && P.move && P.move.sky) for (const o of SA.objs) if (o.kind === 'sky' && !o.landed) { o.landed = true; o.t = 0; o.x = P.x + P.facing * 40; o.y = P.y; silverBurst(o.x, o.y, 4, 30); shakeMag = Math.max(shakeMag, 12); }
    for (const o of SA.objs) step(o, dt);
    SA.objs = SA.objs.filter(o => !o.gone);
    SA.fistOut = SA.objs.some(o => o.kind === 'rocket');
  };
  function step(o, dt) {
    o.t += dt;
    if (o.kind === 'rocket') {
      const sp = o.back ? 1150 : 980;
      if (!o.back) { o.x += o.dir * sp * dt; o.d += sp * dt; o.z += ((P.z + 44) - o.z) * Math.min(1, dt * 6);
        if (o.d >= o.out || o.x < leftWall() - 10 || o.x > rightWall() + 10) { o.back = true; if (o.x < leftWall() || o.x > rightWall()) { sfx('hit-metal', .5); silverBurst(o.x, o.y, o.z, 8); } } }
      else { const wx = P.x + P.facing * 20, wz = P.z + 44, dx = wx - o.x, dz = wz - o.z, d = Math.hypot(dx, dz, (P.y - o.y)); const v = Math.min(d, sp * dt);
        o.x += dx / (d || 1) * v; o.z += dz / (d || 1) * v; o.y += (P.y - o.y) * Math.min(1, dt * 10);
        if (o.held && !o.held.dead) { const e = o.held; e.x = o.x + o.dir * (e.hw * .6); e.y += (P.y - e.y) * Math.min(1, dt * 10); e.state = 'hurt'; e.t = Math.max(e.t, .45); e.vx = 0; e.air = false; e.z = 0; }
        if (d < 18) { o.gone = true; sfx('hit-metal', .3);
          if (o.held && !o.held.dead) { const e = o.held; e.x = P.x + P.facing * (e.hw + 22); hitE(e, o.m.dmg, P.facing, o.m, { kb: 40, power: 2 }); if (!e.dead) { e.state = 'hurt'; e.t = .9; } floatText(e.x, e.y, e.hh + 20, 'GET OVER HERE', '#EEF2FA', 13); } } }
      if (o.zip) { const e = o.zip; if (e.dead) o.zip = null; else { const tx = e.x - o.dir * (e.hw + 26); P.x += (tx - P.x) * Math.min(1, dt * 14); P.y += (e.y - P.y) * Math.min(1, dt * 10); P.inv = Math.max(P.inv, .12); if (Math.abs(P.x - tx) < 8) { hitE(e, o.m.dmg * 1.2, o.dir, o.m, { kb: 120 }); o.zip = null; o.back = true; o.x = P.x + o.dir * 20; } } }
      if (!o.back || !o.grab) for (const e of foes()) { if (o.hit.has(e) || Math.abs(e.x - o.x) > e.hw + 16 || Math.abs(e.y - o.y) > 20 + e.hw * .3 || !zOverlap(o.z - 14, 28, e.z - (e.def.reachDown || 0), e.hh + (e.def.reachDown || 0))) continue;
        o.hit.add(e);
        if (o.grab && !o.back) { // the hand closes on the first one it reaches
          if (e.boss) { o.zip = e; floatText(P.x, P.y, 90, 'HOOKED', '#EEF2FA', 13); } else { o.held = e; hitE(e, 4, o.dir, o.m, { kb: 0, noStun: 1 }); } o.back = true; sfx('hit-metal'); break; }
        hitE(e, o.m.dmg, o.dir, o.m); silverBurst(o.x, o.y, o.z, 10); }
      if (Math.random() < dt * 40) parts.push({ x: o.x - o.dir * 8, y: o.y, z: o.z, vx: -o.dir * 60, vy: 0, vz: rand(-10, 20), life: .3, max: .3, col: pick(['#FFFFFF', '#DDE6FF']), size: rand(1.4, 2.4), shape: 'star', rot: 0, vr: 3 });
      if (o.t > 2) o.gone = true;
    } else if (o.kind === 'titan') { // the hand closes on them, crushes three times, and throws them down the street
      const e = o.e, m = o.m;
      if (!e || e.dead) { if (o.t > .4) o.gone = true; return; }
      if (!e.boss && !o.done.th) { e.x += (P.x + o.dir * (e.hw + 30) - e.x) * Math.min(1, dt * 14); e.y += (P.y - e.y) * Math.min(1, dt * 10); e.z = 26 * Math.min(1, o.t * 5); e.vz = 0; e.state = 'hurt'; e.t = .4; e.air = false; e.vx = 0; }
      for (const [i, at] of [[0, .12], [1, .28], [2, .44]]) if (o.t >= at && !o.done[i]) { o.done[i] = 1; hitE(e, m.dmg * .22, o.dir, m, { kb: 0, launch: 0, noStun: e.boss ? 0 : 1, power: 1 }); sfx('crunch'); shakeMag = Math.max(shakeMag, 4); silverBurst(e.x, e.y, e.z + e.hh * .5, 6); }
      if (o.t >= .6 && !o.done.th) { o.done.th = 1; sfx('whoosh'); shakeMag = Math.max(shakeMag, 9); zoom = Math.max(zoom, .05);
        if (e.boss) hitE(e, m.dmg, o.dir, m, { kb: 300, power: 2 });
        else { hitE(e, m.dmg * .6, o.dir, m, { kb: 760, launch: 260, power: 2, wall: 1 }); if (!e.dead) { e.vx = o.dir * 760 * (e.def.weight || 1); e.vz = Math.max(e.vz, 240); e.air = true; e.wallOK = true; SA.objs.push({ kind: 'thrown', e, t: 0, hit: new Set([e]), m, dir: o.dir }); floatText(e.x, e.y, e.hh + 24, 'THROWN', '#EEF2FA', 14); } } }
      if (o.t > .9) o.gone = true;
    } else if (o.kind === 'thrown') { // a body thrown by the hand bowls over whoever it hits
      const e = o.e; if (!e || o.t > 1.2 || (!e.air && o.t > .2)) { o.gone = true; return; }
      for (const q of foes()) { if (o.hit.has(q) || Math.abs(q.x - e.x) > q.hw + e.hw || Math.abs(q.y - e.y) > 26) continue; o.hit.add(q); hitE(q, 22, o.dir, o.m, { kb: 420, launch: 320, power: 2, wall: 1 }); sfx('crunch'); silverBurst(q.x, q.y, q.hh * .5, 10); }
    } else if (o.kind === 'burst') { // up out of the floor under them
      if (o.t > .1 && !o.struck) { o.struck = true; sfx('slam'); sfx('crunch'); shakeMag = Math.max(shakeMag, 8); dust(o.x, o.y, 14); silverBurst(o.x, o.y, 10, 18);
        for (const e of foes()) if (Math.hypot(e.x - o.x, (e.y - o.y) * 2) < 46 + e.hw && e.z < 60) hitE(e, o.m.dmg, o.dir, o.m); }
      if (o.t > o.max) o.gone = true;
    } else if (o.kind === 'crescent') { // a crescent of moonlight sliding down the street
      o.x += o.dir * 560 * dt;
      for (const e of foes()) { if (o.hit.has(e) || Math.abs(e.x - o.x) > e.hw + 18 || Math.abs(e.y - o.y) > 26 || e.z > 70) continue; o.hit.add(e); hitE(e, 18, o.dir, o.m, { kb: 300, power: 1 }); }
      if (o.t > o.max || o.x < leftWall() - 30 || o.x > rightWall() + 30) o.gone = true;
    } else if (o.kind === 'sky') { if (!o.landed) { o.x = P.x + P.facing * 40; o.y = P.y; if (o.t > 2) o.gone = true; } else if (o.t > .55) o.gone = true; }
    else if (o.t > o.max) o.gone = true;
  }

  // ---------------- the look ----------------
  // his weapon arm, silver from the shoulder, plated and jointed like the Phantom's, gilt at the elbow and shoulder
  const _look = heroLook; heroLook = function () { const L = _look(); if (SA.on()) { L.armSilver = 1; L.glove = '#C8D0DE'; L.gauntPlate = 1; } return L; };
  function plate(x0, y0, x1, y1, w0, w1, far) {
    const st = K.taper(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2, x1, y1, w0, w1, 4), col = far ? shade(BN.silver, -.22) : BN.silver;
    K.cel(K.stripPath(st), col, { d: 1.4, r: .7, w: 1.1, dark: BN.silverDk, lite: BN.silverLt, tex: () => {
      ctx.strokeStyle = 'rgba(60,70,100,.55)'; ctx.lineWidth = .5; ctx.beginPath(); for (let i = 1; i < 4; i++) { const q = i / 4, n = st.L.length; ctx.moveTo(st.L[0] + (st.L[n - 2] - st.L[0]) * q, st.L[1] + (st.L[n - 1] - st.L[1]) * q); ctx.lineTo(st.R[0] + (st.R[n - 2] - st.R[0]) * q, st.R[1] + (st.R[n - 1] - st.R[1]) * q); } ctx.stroke(); } });
  }
  const _arm = CORWIN.arm;
  CORWIN.arm = function (L, ax, ay, bx, by, cx, cy, far) {
    if (!L.armSilver || ax !== 0 || ay !== 0) return _arm.apply(this, arguments); // (the weapon arm is the one drawn from its own shoulder)
    plate(ax, ay, bx, by, 8.2, 6.2, far); plate(bx, by, cx, cy, 6.4, 4.8, far);
    ctx.fillStyle = C(BN.gilt); circle(bx, by, 2.5); ctx.fill(); outline(.8); if (K.DET()) { ctx.fillStyle = '#FFFFFF'; circle(bx - .5, by - .7, .7); ctx.fill(); }
    ctx.fillStyle = C(BN.gilt); circle(ax, ay, 3); ctx.fill(); outline(.9);
    K.glowAt((bx + cx) / 2, (by + cy) / 2, 14, '225,235,255', .22);
  };
  // the hand: flung out on its chain, grown huge, or shaped (drawn in the weapon's place)
  function chainTo(x0, x1, links = true) {
    if (x1 - x0 < 2) return;
    K.add(() => { ctx.strokeStyle = 'rgba(210,225,255,.55)'; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, 0); ctx.stroke(); });
    ctx.strokeStyle = C(BN.silverDk); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, 0); ctx.stroke();
    if (links) for (let x = x0 + 3; x < x1 - 2; x += 4.2) { ctx.fillStyle = C(BN.silver); ell(x, 0, 1.9, 1.2); ctx.fill(); ctx.strokeStyle = C(BN.silverDk); ctx.lineWidth = .4; ctx.stroke(); }
  }
  const _dw = drawWeapon;
  drawWeapon = function (kind, pose) {
    if ((kind && kind !== 'fists') || !pose || !pose.armOn) return _dw(kind, pose);
    const chain = pose.armChain || 0, big = pose.armBig || 1, shape = pose.armShape, t = performance.now() / 1000;
    if (pose.live) { // where the wrist is in the street, for the chain out to a flying fist
      const M = ctx.getTransform(), p = M.transformPoint({ x: 14 + chain, y: 0 }); if (typeof heroG !== 'undefined' && ctx === heroG) { p.x += HB.x; p.y += HB.y; }
      if (SA.Mw) { const w = SA.Mw.inverse().transformPoint(p); SA.wrist = { x: w.x, y: w.y }; } }
    chainTo(13, 13 + chain);
    if (pose.armGone) { ctx.fillStyle = C(BN.gilt); rrect(10, -3.4, 3.4, 6.8, 1.2); ctx.fill(); outline(.7); return; } // the cuff, the hand away on its chain
    ctx.save(); ctx.translate(chain, 0);
    if (big > 1.2 || shape) { ctx.save(); ctx.translate(12, 0); W5.ben.rig(shape || 'rock', { s: .19 * big, rot: pose.armRot || 0, t }); ctx.restore(); K.glowAt(12 + 10 * big, 0, 10 + 8 * big, '225,235,255', .3); }
    else { _dw(kind, pose); K.glowAt(17, 0, 9, '225,235,255', .28); }
    ctx.restore();
  };
  const _pp = playerPose;
  playerPose = function () {
    const pose = _pp(); if (!SA.on()) return pose;
    pose.armOn = 1; if (SA.fistOut) { pose.armGone = 1; pose.arm = 0; pose.elbow = 0; pose.ext = .6; }
    if (P.state === 'charge') { const s = jkOf(P.ct || 0), q = Math.min(1, (P.ct || 0) / .45); pose.armShape = P.ct >= .45 ? s : 'rock'; pose.armBig = 1 + 1.4 * q + .1 * Math.sin(performance.now() / 70) * q; pose.arm = -1.6; pose.elbow = 1.2; pose.glow = 'rgba(225,235,255,.6)';
      if (P.ct >= .45 && SA.jkShown !== s) { SA.jkShown = s; floatText(P.x, P.y, 92, s.toUpperCase() + '…', '#EEF2FA', 14); sfx('hit-metal', .3); } }
    else SA.jkShown = null;
    return pose;
  };
  { const _ml = mechList; mechList = function (list, t) { _ml(list, t); SA.Mw = ctx.getTransform(); for (const o of SA.objs) drawObj(o, list, t); }; }
  { const _mb = mechBoxes; mechBoxes = function (box) { _mb(box); for (const o of SA.objs) { const q = o.e || o; if (Number.isFinite(q.x) && Number.isFinite(q.y)) box(q.x, q.y, q.z || 0, 90, 150); } if (SA.on()) box(P.x, P.y, P.z, 170, 170); }; }
  function drawObj(o, list, t) {
    if (o.kind === 'rocket') list.push([o.y + .2, () => { // the fist in flight, and the chain back to his wrist
      const w = SA.wrist; if (w) K.leafLine(() => { ctx.moveTo(w.x, w.y); ctx.lineTo(o.x - o.dir * 6, o.y - o.z); }, 1.3, .9);
      if (w) onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(210,225,255,.45)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.lineTo(o.x, o.y - o.z); ctx.stroke(); ctx.restore(); });
      ctx.save(); ctx.translate(o.x - o.dir * 8, o.y - o.z); ctx.scale(o.dir, 1); W5.ben.rig(o.held || o.zip ? 'rock' : o.grab && !o.back ? 'claw' : 'rock', { s: .46, t }); ctx.restore(); K.glowAt(o.x, o.y - o.z, 22, '230,238,255', .5); }]);
    else if (o.kind === 'titan' && o.e && !o.e.dead && !o.done.th && !o.e.boss) list.push([o.e.y + .3, () => { ctx.save(); ctx.translate(o.e.x - o.dir * (o.e.hw + 8), o.e.y - o.e.z - o.e.hh * .45); ctx.scale(o.dir, 1); W5.ben.rig(o.t < .1 ? 'claw' : 'rock', { s: .5, t, a: .92 }); ctx.restore(); }]); // the huge hand closed round them
    else if (o.kind === 'burst') list.push([o.y, () => { const k = Math.min(1, o.t / .12), d = o.t > .45 ? (o.t - .45) / .25 : 0; ctx.save(); ctx.beginPath(); ctx.rect(o.x - 80, o.y - 200, 160, 202); ctx.clip(); ctx.translate(o.x, o.y + (1 - k) * 60 + d * 70); ctx.scale(o.dir, 1); W5.ben.rig(o.t < .18 ? 'paper' : 'rock', { s: .5, rot: -Math.PI / 2, t, stump: 1 }); ctx.restore(); K.glowAt(o.x, o.y - 30, 50, '230,238,255', .4 * (1 - d)); }]);
    else if (o.kind === 'ghost') list.push([o.y, () => { ctx.save(); ctx.globalAlpha *= .85 * Math.min(1, (1 - o.t / o.max) * 2); ctx.translate(o.x, o.y - o.z); ctx.scale(o.dir, 1); ctx.rotate(o.a); W5.ben.rig('rock', { s: o.s * 1.3, t }); ctx.restore(); K.glowAt(o.x, o.y - o.z, 16, '225,235,255', .35); }]);
    else if (o.kind === 'crescent') list.push([o.y, () => onMain(() => { const a = 1 - o.t / o.max; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(o.x, o.y - 30); ctx.scale(o.dir, 1);
      for (let i = 0; i < 3; i++) { ctx.strokeStyle = `rgba(${i ? '200,215,255' : '255,255,255'},${a * (.9 - i * .25)})`; ctx.lineWidth = 5 - i * 1.4; ctx.beginPath(); ctx.ellipse(-i * 10, 0, 14, 34, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke(); } ctx.restore(); })]);
    else if (o.kind === 'gust') list.push([o.y, () => onMain(() => { const a = 1 - o.t / o.max; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(225,235,255,${a * .8})`; ctx.lineWidth = 2; for (let i = 0; i < 7; i++) { const y = o.y - 10 - i * 9, x = o.x + o.dir * o.t * 500; ctx.beginPath(); ctx.moveTo(x - o.dir * 60, y); ctx.lineTo(x + o.dir * (20 + i % 2 * 20), y); ctx.stroke(); } ctx.restore(); })]);
    else if (o.kind === 'snip') list.push([o.y, () => onMain(() => { const a = 1 - o.t / o.max; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(245,248,255,${a})`; ctx.lineWidth = 4; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(o.x - o.dir * 60, o.y - 40 + s * 30); ctx.lineTo(o.x + o.dir * 60, o.y - 40 - s * 30); ctx.stroke(); } ctx.restore(); })]);
    else if (o.kind === 'sky') list.push([o.y + .1, () => { const z = o.landed ? 0 : Math.max(0, P.z + 60), q = o.landed ? Math.max(0, 1 - o.t / .55) : 1; ctx.save(); ctx.globalAlpha *= o.landed ? q : Math.min(1, o.t * 4); ctx.translate(o.x, o.y - z - 96 - (o.landed ? 0 : 30)); ctx.scale(o.dir, 1); W5.ben.rig('paper', { s: .9, rot: Math.PI / 2, t, stump: 1 }); ctx.restore(); }]);
  }

  // ---------------- the poses ----------------
  const span = (k, a, b) => clamp((k - a) / (b - a), 0, 1), sst = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const out = (m, k) => k < m.h[0] ? 0 : k < m.h[1] ? Math.min(1, (k - m.h[0]) / ((m.h[1] - m.h[0]) * .4)) : Math.max(0, 1 - (k - m.h[1]) / (1 - m.h[1]) * 1.3);
  Object.assign(MOVE_POSE, {
    'arm:L'(pose, m, k) { pose.armChain = 22 * out(m, k); },
    'arm:LL'(pose, m, k) { pose.armChain = 10 * out(m, k); },
    'arm:A'(pose, m, k) { pose.armChain = 22 * out(m, k); },
    'arm:AA'(pose, m, k) { pose.arm = lerp(1, -.1, out(m, k)); pose.elbow = lerp(1.8, .1, out(m, k)); pose.armChain = 26 * out(m, k); },
    'arm:LLL'(pose, m, k) { const e = out(m, k); pose.armChain = 64 * e; pose.armBig = 1 + .5 * e; pose.armShape = 'rock'; },
    'arm:LLLL'(pose, m, k) { const fin = k >= .78; pose.trail = 0; pose.streak = null; delete pose.sweep;
      if (!fin) { const j = Math.sin(k * 70); pose.arm = -.1 + .15 * j; pose.elbow = .2 + .5 * Math.max(0, -j); pose.ext = .4 + .5 * Math.max(0, j); pose.backArm = 1.2; pose.backElbow = 2; pose.lean = .25; pose.legs = { f: 12, b: -12, fk: 6, bk: 4 }; pose.sink = 5; pose.armChain = 8 * Math.max(0, j); }
      else { const q = sst(span(k, .78, .86)); pose.arm = -.05; pose.elbow = 0; pose.ext = q; pose.armBig = 1 + 2.4 * q * (1 - span(k, .94, 1)); pose.armShape = 'rock'; pose.lean = .4; pose.legs = { f: 16, b: -15, fk: 8, bk: 1, bh: .7 }; pose.sink = 7; pose.yaw = .4; } },
    'arm:H'(pose, m, k) { const q = k < m.h[0] ? ease(k / m.h[0]) : 1; pose.arm = lerp(1.1, -.04, q); pose.elbow = lerp(1.6, 0, q); pose.ext = .5 * q; pose.backArm = lerp(1.2, 2.2, q); pose.lean = .25 * q; pose.legs = { f: 13, b: -13, fk: 5, bk: 2, bh: .5 * q }; pose.sink = 4; pose.trail = 0; pose.streak = null; pose.armShape = k < m.h[0] ? 'rock' : undefined; pose.armBig = k < m.h[0] ? 1.4 : 1; },
    'arm:HH'(pose, m, k) { MOVE_POSE['arm:H'](pose, m, k); if (k < m.h[0]) pose.armShape = 'claw'; },
    'arm:HHH'(pose, m, k) { const g = ease(span(k, 0, .18)), r = span(k, .62, .72); pose.arm = lerp(1, -.2, g) + 1.6 * sst(r) * (k < .8 ? 1 : 1 - span(k, .8, 1)); pose.elbow = .2; pose.ext = .5 * g; pose.armBig = 1 + 2.6 * g * (1 - .5 * span(k, .85, 1)); pose.armShape = k < .18 ? 'claw' : 'rock'; pose.lean = lerp(.1, -.2, g) + .4 * r; pose.legs = { f: 13, b: -12, fk: 6, bk: 4 }; pose.sink = 6; pose.trail = 0; pose.streak = null; delete pose.sweep; pose.yaw = .3 * r; },
    'arm:LH'(pose, m, k) { const g = ease(span(k, 0, m.h[0])); pose.arm = lerp(.4, 1.45, g); pose.elbow = lerp(1.6, 0, g); pose.ext = .4 * g; pose.crouch = 1; pose.lean = .5 * g; pose.armShape = 'rock'; pose.armBig = 1.3; pose.trail = 0; pose.streak = null; delete pose.sweep; pose.armChain = 10 * g; },
    'arm:LLH'(pose, m, k) { pose.arm = -.05; pose.elbow = 0; pose.ext = .3; pose.armChain = 64 * sst(span(k, 0, .15)) * (1 - span(k, .88, 1)); pose.armBig = 1.6; pose.armShape = 'rock'; pose.backArm = 2.6; pose.lean = -.2; pose.trail = 0; pose.flat = k > .12 && k < .86 ? { r: 110, k: .96, rev: false, col: 'rgba(225,235,255,.95)', w: 5 } : null; },
    'arm:HL'(pose, m, k) { const g = sst(span(k, .1, .5)); pose.armBig = 1 + 2 * g; pose.armShape = 'rock'; },
    'arm:X'(pose, m, k) { const g = sst(span(k, .1, m.h[0])); pose.armBig = 1 + 1.6 * g * (1 - span(k, .8, 1)); pose.armShape = 'paper'; pose.armRot = -.6 * g; },
    'arm:AAA'(pose, m, k) { pose.armBig = 1 + 1.2 * out(m, k); pose.armShape = 'rock'; pose.armChain = 20 * out(m, k); },
    'arm:JH'(pose, m, k) { const g = k < m.h[0] ? 1 : out(m, k); pose.arm = -.1; pose.elbow = 0; pose.ext = .6; pose.armChain = P.hookE && k < m.h[0] ? Math.min(90, Math.abs(P.hookE.x - P.x) - 20) * (1 - span(k, .2, m.h[0])) : 0; pose.armShape = k < m.h[0] ? 'claw' : 'rock'; pose.armBig = 1.3 + .6 * g; pose.lean = .35; pose.legs = { f: 10, b: -16, fk: 10, bk: 4 }; pose.flow = 14; pose.trail = 0; pose.streak = null; },
    'arm:DA'(pose, m, k) { const e = out(m, k); pose.arm = -.1 - (pose.rot || 0) * .5; pose.elbow = 0; pose.ext = .8; pose.armChain = 30 * e; pose.armBig = 1.2 + .9 * e; pose.armShape = 'rock'; pose.rot = .36; pose.lean = .25; pose.legs = { f: 4, b: -19, fk: 12, bk: -2 }; pose.flow = 16; pose.trail = 0; pose.streak = null; },
    'arm:D'(pose, m, k) { const e = sst(span(k, 0, .12)) * (1 - span(k, .84, 1)); pose.arm = -.08 - .35 * e; pose.elbow = 0; pose.ext = .9; pose.armChain = 46 * e; pose.armBig = 1 + .9 * e; pose.armShape = 'rock'; pose.lean = .55 * e; pose.rot = .25 * e; pose.legs = { f: lerp(8, -2, e), b: lerp(-8, -22, e), fk: 3, bk: 2 }; pose.flow = 20; pose.backArm = 2.7; pose.trail = 0; pose.streak = null; delete pose.sweep; },
    'arm:R'(pose, m, k) { pose.armShape = k > m.h[0] - .05 && k < m.h[1] + .1 ? 'paper' : undefined; pose.armBig = pose.armShape ? 1.6 : 1; },
    'arm:RH'(pose, m, k) { const g = sst(span(k, 0, .25)); pose.arm = lerp(1.1, -1.2, g); pose.elbow = lerp(1.6, 1.5, g); pose.armShape = 'snap'; pose.armBig = 1 + 1.2 * g; pose.armRot = -1.2; pose.lean = -.1; pose.trail = 0; pose.streak = null; pose.flat = null; },
    'arm:HC'(pose, m, k) { const s = m.jk || 'rock', g = sst(span(k, 0, m.h[0])), r = 1 - span(k, .8, 1); pose.armShape = s; pose.armBig = (2.2 + .8 * g) * (.4 + .6 * r) + .0; pose.trail = 0; pose.streak = null; delete pose.sweep; pose.flat = null;
      if (s === 'rock') { pose.arm = lerp(-2.4, 1.3, g); pose.elbow = .2; pose.lean = lerp(-.2, .6, g); pose.sink = 8 * g; pose.legs = { f: 13, b: -12, fk: 9, bk: 3 }; }
      else if (s === 'paper') { pose.arm = -.05; pose.elbow = lerp(1.4, 0, g); pose.ext = g; pose.lean = .45 * g; pose.legs = { f: 15, b: -15, fk: 7, bk: 1, bh: .7 }; pose.sink = 6; pose.armRot = -1.4; }
      else { pose.arm = lerp(-1.2, .6, g) + Math.sin(k * 40) * .2 * g; pose.elbow = .3; pose.lean = .3 * g; pose.armRot = -.2; pose.legs = { f: 12, b: -12, fk: 6, bk: 3 }; pose.sink = 4; } },
    'arm:AH'(pose, m, k) { pose.arm = 1.5; pose.elbow = .2; pose.armShape = 'paper'; pose.armBig = 1.6; pose.armRot = 1.4; },
  });
})();
