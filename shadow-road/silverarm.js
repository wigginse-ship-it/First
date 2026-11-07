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
//   D DX R RH       Rocket Ride (it fires and drags you along behind it) · Silver Haymaker (Heavy on the run) · Silver Crescent (out of a dodge: a palm and a
//                   crescent of moonlight down the street) · Thunder Rise (a crouching dash, then a lightning uppercut)
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
    X:    { name: 'Silver Lift', dur: .72, h: [.25, .403], prep: 1, x0: 0, x1: 60, dmg: 15, kb: 30, launch: 650, arc: [1.6, -1.8], launcher: 1, rise: 1, hop: 470, power: 1 }, // he rises with it, like the bare-handed Rising Fist
    A:    { dur: .28, h: [.2, .6], x0: 0, x1: 56, dmg: 10, kb: 70, arc: [.9, -.2] },
    AA:   { dur: .3, h: [.2, .6], x0: 0, x1: 60, dmg: 11, kb: 80, arc: [.5, .2] },
    AAA:  { name: 'Meteor Fist', dur: .42, h: [.2, .65], x0: 0, x1: 70, depth: 26, dmg: 17, kb: 140, arc: [-2.4, 1.4], spike: 1, power: 2 },
    JH:   { name: 'Moon Hook', dur: .55, h: [.36, .66], x0: 0, x1: 50, dmg: 18, kb: 320, power: 2, wall: 1, hook: 1 },
    DA:   { name: 'Comet', dur: .5, h: [.22, .64], x0: 0, x1: 86, depth: 24, dmg: 20, kb: 420, arc: [.1, .1], fly: 1, power: 2, wall: 1 },
    D:    { name: 'Rocket Ride', dur: .66, h: [.1, .82], x0: 0, x1: 54, depth: 26, dmg: 7, kb: 260, multi: .09, lunge: 640, power: 1, wall: 1, ride: 1 },
    DX:   { name: 'Silver Haymaker', dur: .55, h: [.4, .62], prep: 1, x0: 0, x1: 80, depth: 28, dmg: 26, kb: 480, lunge: 380, power: 2, wall: 1 }, // Heavy off the run: the bare-handed haymaker, with a fist the size of a barrel
    R:    { name: 'Silver Crescent', dur: .42, h: [.28, .62], x0: 0, x1: 50, dmg: 17, kb: 300, lunge: 330, power: 1, crescent: 1 },
    RH:   { name: 'Thunder Rise', dur: .6, h: [.36, .52], x0: -6, x1: 64, depth: 28, dmg: 24, kb: 70, launch: 600, lunge: 330, power: 2, electric: 1 }, // out of the dodge: a low crouching dash forward, and up out of it an uppercut that crackles with lightning
    HC:   { name: 'Rock, Paper, Scissors', dur: .7, h: [.42, .6], x0: 0, x1: 120, depth: 34, dmg: 30, kb: 300, power: 2, janken: 1 },
    AH:   { name: 'The Hand of the Moon', dur: .55, h: [.15, .97], x0: 0, x1: 70, dmg: 30, kb: 160, arc: [-2, 1.5], dive: 1, shock: 150, bounce: 1, power: 2, smash: 1, sky: 1 },
  };
  for (const k in ARM) { ARM[k].key = k; ARM[k].arm = 1; }
  const JANKEN = { // what Rock, Paper, Scissors turns into when you let go
    // (the longer it is held, the harder it lands: rock, then paper, then scissors; the first rock it comes back round to
    // is the hardest of all; held on past that, it goes round the ordinary three again)
    rock:     { name: 'Rock!', dmg: 19, kb: 200, launch: 300, x1: 90, depth: 40, shock: 140, bounce: 1, h: [.42, .6] },
    paper:    { name: 'Paper!', dmg: 43, kb: 720, x1: 150, depth: 44, wall: 1, multi: 0, h: [.38, .62] },
    scissors: { name: 'Scissors!', dmg: 30, kb: 160, x1: 210, depth: 40, multi: .14, h: [.36, .7] },
    rock2:    { name: 'Rock!!', dmg: 63, kb: 260, launch: 420, x1: 104, depth: 46, shock: 190, bounce: 1, crit: 1, h: [.42, .6] },
  };
  const JK = ['rock', 'paper', 'scissors'], jkIdx = (ct) => Math.max(0, Math.floor((ct - .45) / .42)), jkOf = (ct) => JK[jkIdx(ct) % 3];
  const jkDef = (ct) => jkIdx(ct) === 3 ? 'rock2' : jkOf(ct); // (the one that is let go)
  const base = WEAPONS.fists.tree, baseName = WEAPONS.fists.name, baseDesc = WEAPONS.fists.desc;
  Object.defineProperty(WEAPONS.fists, 'tree', { get() { return SA.on() ? ARM : base; }, configurable: true });
  Object.defineProperty(WEAPONS.fists, 'name', { get() { return SA.on() ? 'The Silver Arm' : baseName; }, configurable: true });
  Object.defineProperty(WEAPONS.fists, 'desc', { get() { return SA.on() ? 'Benedict\'s arm, out of Tir-na Nog\'th. It flies, it grows, it grabs.' : baseDesc; }, configurable: true });
  SA.tree = ARM;

  // ---------------- the Black Knuckles: when the fists in hand are cursed (cursedw.js), all the arm throws out is theirs ----------------
  // the hand itself drawn through RIG (tinted to blackened iron with a crimson heart), and its light, chain and trails in
  // violet and blood instead of moonlight
  SA.black = () => !!(typeof save !== 'undefined' && save && save.cw && save.cw.fists && !save.cw.fists.pure && SA.on());
  const LT = (rgb) => SA.pure() ? ({ '255,255,255': '255,255,245', '245,248,255': '255,250,230' }[rgb] || '255,236,180') : SA.black() ? ({ '230,238,255': '150,20,45', '225,235,255': '110,20,50', '210,225,255': '120,40,110', '200,215,255': '150,40,110', '255,255,255': '255,120,150', '245,248,255': '255,90,120' }[rgb] || '170,50,120') : rgb;
  let rigC = null, rigG = null, rigD = null, rigDG = null, rigH = null, rigHG = null;
  SA.pure = () => !!(typeof save !== 'undefined' && save && save.cw && save.cw.fists && save.cw.fists.pure && SA.on()); // (the Dawn Knuckles: purified)
  function RIG(shape, o = {}) {
    if (SA.pure() && !FLASH && !TINT) return RIG_PURE(shape, o);
    if (!SA.black() || FLASH || TINT) return W5.ben.rig(shape, o);
    const m = ctx.getTransform(), sc = Math.max(.5, Math.min(4, Math.hypot(m.a, m.b))), s = o.s || 1, R = 150 * s, N = Math.max(8, Math.ceil(2 * R * sc));
    if (!rigC || rigC.width < N) { rigC = document.createElement('canvas'); rigC.width = rigC.height = Math.max(N, 64); rigG = rigC.getContext('2d'); rigD = document.createElement('canvas'); rigD.width = rigD.height = rigC.width; rigDG = rigD.getContext('2d'); rigH = document.createElement('canvas'); rigH.width = rigH.height = rigC.width; rigHG = rigH.getContext('2d'); }
    rigG.setTransform(1, 0, 0, 1, 0, 0); rigG.globalCompositeOperation = 'source-over'; rigG.globalAlpha = 1; rigG.clearRect(0, 0, N + 2, N + 2);
    rigG.setTransform(sc, 0, 0, sc, N / 2, N / 2); const old = ctx; ctx = rigG; try { W5.ben.rig(shape, Object.assign({}, o, { a: undefined })); } finally { ctx = old; }
    // the same hand in the Black Knuckles' own iron: its silver multiplied down to a dark violet-grey, so every plate, joint
    // and highlight of the metal still reads; the jewel in its back turned to a black stone ringed in crimson
    rigDG.setTransform(1, 0, 0, 1, 0, 0); rigDG.globalCompositeOperation = 'source-over'; rigDG.clearRect(0, 0, N + 2, N + 2); rigDG.drawImage(rigC, 0, 0);
    rigDG.globalCompositeOperation = 'multiply'; rigDG.fillStyle = '#6A5A76'; rigDG.fillRect(0, 0, N, N);
    rigDG.globalCompositeOperation = 'multiply'; rigDG.fillStyle = '#B8A8C4'; rigDG.fillRect(0, 0, N, N); // (twice over: the darks go near black, the lights stay a cold gunmetal)
    rigDG.globalCompositeOperation = 'destination-in'; rigDG.drawImage(rigC, 0, 0); rigDG.globalCompositeOperation = 'source-over';
    { const rot = o.rot || 0, jx = N / 2 + Math.cos(rot) * 32 * s * sc, jy = N / 2 + Math.sin(rot) * 32 * s * sc - 1 * s * sc, jr = 7.5 * s * sc, beat = .5 + .5 * Math.sin((o.t || 0) * 3);
      rigDG.fillStyle = '#060208'; rigDG.beginPath(); rigDG.arc(jx, jy, jr, 0, Math.PI * 2); rigDG.fill(); // (the stone)
      rigDG.globalCompositeOperation = 'lighter'; const jg = rigDG.createRadialGradient(jx, jy, jr * .3, jx, jy, jr * 1.8); jg.addColorStop(0, 'rgba(255,40,70,0)'); jg.addColorStop(.55, `rgba(255,40,70,${(.35 + .35 * beat).toFixed(3)})`); jg.addColorStop(1, 'rgba(255,40,70,0)');
      rigDG.fillStyle = jg; rigDG.beginPath(); rigDG.arc(jx, jy, jr * 1.8, 0, Math.PI * 2); rigDG.fill();
      rigDG.strokeStyle = `rgba(255,70,90,${(.55 + .4 * beat).toFixed(3)})`; rigDG.lineWidth = Math.max(1, .9 * s * sc); rigDG.beginPath(); rigDG.arc(jx, jy, jr * .72, (o.t || 0) * 2, (o.t || 0) * 2 + 4); rigDG.stroke();
      rigDG.globalCompositeOperation = 'source-over'; }
    // a soft crimson rim round it, so the dark iron reads against any ground: its silhouette in light, laid a hair out all round
    rigHG.setTransform(1, 0, 0, 1, 0, 0); rigHG.globalCompositeOperation = 'source-over'; rigHG.clearRect(0, 0, N + 2, N + 2); rigHG.drawImage(rigC, 0, 0);
    rigHG.globalCompositeOperation = 'source-in'; rigHG.fillStyle = 'rgb(150,62,96)'; rigHG.fillRect(0, 0, N, N); rigHG.globalCompositeOperation = 'source-over';
    ctx.save(); if (o.a !== undefined) ctx.globalAlpha *= o.a;
    { const ga = ctx.globalAlpha, d = Math.max(1, sc * .9) / Math.max(.5, sc); // (a soft falloff, not a line: rings of its silhouette, each wider and fainter)
      for (const [rr, al, n] of [[1, .1, 8], [2, .075, 10], [3.2, .05, 12], [4.6, .03, 12]]) { ctx.globalAlpha = ga * al;
        for (let i = 0; i < n; i++) { const an = (i + rr * .37) / n * Math.PI * 2; ctx.drawImage(rigH, 0, 0, N, N, -R + Math.cos(an) * d * rr, -R + Math.sin(an) * d * rr, 2 * R, 2 * R); } }
      ctx.globalAlpha = ga; }
    ctx.drawImage(rigD, 0, 0, N, N, -R, -R, 2 * R, 2 * R);
    ctx.drawImage(rigD, 0, 0, N, N, -R, -R, 2 * R, 2 * R); ctx.restore();
  }

  // the Dawn Knuckles (purified): the silver hand left as it is, in white fire, as the purified moves' flourish burns: a soft
  // white-gold halo behind it, a glowing rim of white fire round it, and a sheen over it
  function RIG_PURE(shape, o = {}) {
    const m = ctx.getTransform(), sc = Math.max(.5, Math.min(4, Math.hypot(m.a, m.b))), s = o.s || 1, R = 150 * s, N = Math.max(8, Math.ceil(2 * R * sc)), t = o.t || performance.now() / 1000, beat = .5 + .5 * Math.sin(t * 3);
    if (!rigC || rigC.width < N) { rigC = document.createElement('canvas'); rigC.width = rigC.height = Math.max(N, 64); rigG = rigC.getContext('2d'); rigD = document.createElement('canvas'); rigD.width = rigD.height = rigC.width; rigDG = rigD.getContext('2d'); rigH = document.createElement('canvas'); rigH.width = rigH.height = rigC.width; rigHG = rigH.getContext('2d'); }
    rigG.setTransform(1, 0, 0, 1, 0, 0); rigG.globalCompositeOperation = 'source-over'; rigG.globalAlpha = 1; rigG.clearRect(0, 0, N + 2, N + 2);
    rigG.setTransform(sc, 0, 0, sc, N / 2, N / 2); const old = ctx; ctx = rigG; try { W5.ben.rig(shape, Object.assign({}, o, { a: undefined })); } finally { ctx = old; }
    rigHG.setTransform(1, 0, 0, 1, 0, 0); rigHG.globalCompositeOperation = 'source-over'; rigHG.clearRect(0, 0, N + 2, N + 2); rigHG.drawImage(rigC, 0, 0);
    rigHG.globalCompositeOperation = 'source-in'; rigHG.fillStyle = 'rgb(255,240,200)'; rigHG.fillRect(0, 0, N, N); rigHG.globalCompositeOperation = 'source-over';
    const rot = o.rot || 0, cx = Math.cos(rot) * 32 * s, cy = Math.sin(rot) * 32 * s;
    ctx.save(); if (o.a !== undefined) ctx.globalAlpha *= o.a; const ga = ctx.globalAlpha;
    ctx.globalCompositeOperation = 'lighter'; const hg = ctx.createRadialGradient(cx, cy, 2, cx, cy, 70 * s); hg.addColorStop(0, `rgba(255,246,214,${(.4 + .15 * beat).toFixed(3)})`); hg.addColorStop(1, 'rgba(255,220,140,0)'); ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(cx, cy, 70 * s, 0, Math.PI * 2); ctx.fill(); // (the halo behind it)
    { const d = Math.max(1, sc * .9) / Math.max(.5, sc); for (const [rr, al, n] of [[1.2, .16, 8], [2.6, .1, 10], [4.2, .05, 12]]) { ctx.globalAlpha = ga * al * (.8 + .4 * beat);
        for (let i = 0; i < n; i++) { const an = (i + rr * .37) / n * Math.PI * 2; ctx.drawImage(rigH, 0, 0, N, N, -R + Math.cos(an) * d * rr, -R + Math.sin(an) * d * rr, 2 * R, 2 * R); } } } // (its rim of white fire)
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = ga; ctx.drawImage(rigC, 0, 0, N, N, -R, -R, 2 * R, 2 * R);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = ga * (.12 + .06 * beat); ctx.drawImage(rigH, 0, 0, N, N, -R, -R, 2 * R, 2 * R); // (a sheen of it over the silver)
    ctx.restore();
  }
  // the arm with the Black Knuckles on it hits far harder than the clean silver arm: every blow of its moveset and all it
  // throws out (the rocket fist, the giant hands, the lightning); the cursed weapon's own level multiplier comes on top
  // and the arm with the Dawn Knuckles on it (purified) hits harder again: clean light outweighs the curse
  SA.BLACK_K = 2.1; SA.PURE_K = 2.8;
  { const _st = strike; strike = function (e, base, dir, m, echo) { if (m && m.arm && !m.trump) { if (SA.black()) base *= SA.BLACK_K; else if (SA.pure()) base *= SA.PURE_K; } return _st(e, base, dir, m, echo); }; }
  // the Black Knuckles' rock, paper and scissors, let go: rock cracks the street open in crimson and calls lightning down
  // into the cracks; paper is a black gale full of torn crimson shreds; scissors leave a hanging X of red rents that close
  // with a snap; the great Rock!! sets an eclipse over the street that implodes, then a pillar of crimson lightning
  function jkCurse(m, big) {
    const fx0 = P.x + f() * 60, y = P.y, dir = f(), red = ['#FF3A5A', '#B01030', '#1A0A14', '#FF9AAA'];
    if (m.jk === 'rock') { SA.objs.push({ kind: 'crack', x: fx0, y, t: 0, max: big ? 1.6 : 1.1, n: big ? 9 : 6, R: big ? 130 : 90, seed: Math.random() * 99 });
      for (let i = 0; i < (big ? 6 : 3); i++) fx.push({ kind: 'bolt', x: fx0 + rand(-70, 70), y: y + rand(-10, 10), z: 200 + rand(0, 80), x2: fx0 + rand(-50, 50), y2: y, z2: 2, t: .26, max: .26, col: i % 2 ? '#FF5A7A' : '#B01030', seed: Math.random() * 99 });
      burst(fx0, y, 8, red, big ? 34 : 20, 'spark', 0, true); }
    if (m.jk === 'paper') SA.objs.push({ kind: 'gale', x: P.x + dir * 40, y, dir, t: 0, max: .7, seed: Math.random() * 99 });
    if (m.jk === 'scissors') SA.objs.push({ kind: 'rend', x: P.x + dir * 110, y, dir, t: 0, max: .55, w: 1.6 });
    if (big) { SA.objs.push({ kind: 'eclipse', x: fx0, y, t: 0, max: 1.3 }); flashT = Math.max(flashT, .08); shakeMag = Math.max(shakeMag, 12); sfx('roar', .5); }
  }
  // the charged hand's kills die as its shape says: a rock flattens them as the hammer does, scissors cut them in two as the
  // great sword does (only the charged shapes, and only while the arm is on)
  { const _ke = killEnemy; killEnemy = function (e, dir, m) {
    const jk = SA.on() && m && m.jk && !m.trump && !e.dead ? (m.jk === 'rock' ? 'splat' : m.jk === 'scissors' ? 'slice' : null) : null;
    if (!jk) return _ke(e, dir, m);
    const was = DEATH_BY.fists; DEATH_BY.fists = jk; try { return _ke(e, dir, m); } finally { if (was === undefined) delete DEATH_BY.fists; else DEATH_BY.fists = was; } }; }
  // ---------------- the mechanics ----------------
  { const _mpk = movePoseKey; movePoseKey = function (m) { return m && m.arm ? 'arm:' + m.key : _mpk(m); }; }
  const _me = moveExtras;
  moveExtras = function (m, k, dt, air) { if (_me(m, k, dt, air)) return true; return m.arm ? armExtras(m, k, dt, air) : false; };
  function armExtras(m, k, dt, air) {
    const once = (key, at, fn) => { if (k >= at && P.armDone !== P.moveId + key) { P.armDone = P.moveId + key; fn(); } };
    if (m.janken && !m.jk) { const d = jkDef(P.ct || 0), s = d === 'rock2' ? 'rock' : d; P.move = Object.assign({}, m, JANKEN[d], { jk: s }); floatText(P.x, P.y, 96, JANKEN[d].name.toUpperCase(), d === 'rock2' ? '#FFE08A' : '#EEF2FA', d === 'rock2' ? 22 : 18); sfx('learned'); if (d === 'rock2') { sfx('crit'); shakeMag = Math.max(shakeMag, 6); } return false; }
    if (m.jk) { once('j', m.h[0], () => { sfx('slam'); shakeMag = Math.max(shakeMag, 9); zoom = Math.max(zoom, .05);
      if (m.jk === 'rock') { silverBurst(P.x + f() * 60, P.y, 6, 24); fx.push({ kind: 'ring', x: P.x + f() * 60, y: P.y, z: 2, t: .45, max: .45, r: 150, col: '#EEF2FA', flat: 1 }); }
      if (m.jk === 'paper') SA.objs.push({ kind: 'gust', x: P.x + f() * 40, y: P.y, dir: f(), t: 0, max: .45 });
      if (m.jk === 'scissors') SA.objs.push({ kind: 'snip', x: P.x + f() * 112, y: P.y, dir: f(), t: 0, max: .3 });
      if (SA.black()) jkCurse(m, m.name === 'Rock!!'); }); }
    if (m.rocket) once('r', m.h[0], () => { SA.objs.push({ kind: 'rocket', x: P.x + f() * 24, y: P.y, z: P.z + 44, dir: f(), d: 0, out: m.grab ? 300 : 340, back: false, hit: new Set(), m, grab: m.grab, born: P.moveId }); sfx('whoosh'); sfx('shoot'); });
    if (m.titan) once('t', m.h[0], () => { const e = nearestAhead(110 + (P.z > 0 ? 0 : 0), 34); sfx('charge', 2);
      SA.objs.push({ kind: 'titan', e: e || null, t: 0, dir: f(), m, done: {} }); if (!e) floatText(P.x, P.y, 90, 'NOTHING TO GRAB', '#C8D4EC', 11); });
    if (m.below) once('b', m.h[0], () => { const e = nearestAhead(200, 44), x = e ? e.x : P.x + f() * 120, y = e ? e.y : P.y; SA.objs.push({ kind: 'burst', x: clamp(x, leftWall() + 10, rightWall() - 10), y, t: 0, max: .7, m, hit: new Set(), dir: f() }); sfx('slam'); shakeMag = Math.max(shakeMag, 5); dust(P.x + f() * 20, P.y, 6); });
    if (m.hundred && k < m.h[1]) { SA.ghostT = (SA.ghostT || 0) - dt; if (SA.ghostT <= 0) { SA.ghostT = .03; SA.objs.push({ kind: 'ghost', x: P.x + f() * rand(26, 86), y: P.y + rand(-14, 14), z: P.z + rand(26, 72), dir: f(), t: 0, max: .16, s: rand(.17, .25), a: rand(-.25, .25) }); if (Math.random() < .4) sfx('swing', .3); } }
    if (m.electric) { // the dash low along the street, its afterimage trailing; then the fist comes up out of it in a crack of lightning
      const col = SA.black() ? ['#FF3A5A', '#FF9AAA', '#B01030'] : ['#C8A0FF', '#F2E8FF', '#8A5AFF'];
      if (k < m.h[0]) { P.vx = f() * 330 * (1 - k / m.h[0] * .6); if (Math.random() < dt * 40) dust(P.x - f() * 10, P.y, 1); if (Math.random() < dt * 22 && ghosts.length < 18) ghosts.push({ x: P.x, y: P.y, z: P.z, facing: f(), pose: playerPose(), a: .45, dark: SA.black() ? 1 : 0 }); }
      else if (k < m.h[1]) P.vx = f() * 60;
      once('e', m.h[0], () => { sfx('crit'); sfx('shoot', .7); flashT = Math.max(flashT, .05); shakeMag = Math.max(shakeMag, 7);
        const fx0 = P.x + f() * 34, z0 = P.z + 40;
        for (let i = 0; i < 4; i++) fx.push({ kind: 'bolt', x: fx0 + rand(-14, 14), y: P.y, z: z0 + 120 + rand(0, 60), x2: fx0 + rand(-6, 6), y2: P.y, z2: z0 + rand(-6, 10), t: .22, max: .22, col: col[i % 2], seed: Math.random() * 99 });
        burst(fx0, P.y, z0 + 20, col, 18, 'spark', f(), true); fx.push({ kind: 'ring', x: fx0, y: P.y, z: z0 + 10, t: .2, max: .2, r: 46, col: col[1] }); });
      if (k > m.h[0] && k < m.h[1] + .1 && Math.random() < dt * 30) { const fx0 = P.x + f() * 30; fx.push({ kind: 'bolt', x: fx0 + rand(-20, 20), y: P.y, z: P.z + 50 + rand(0, 50), x2: fx0 + rand(-20, 20), y2: P.y, z2: P.z + 50 + rand(0, 50), t: .1, max: .1, col: col[2], seed: Math.random() * 99 }); } }
    if (m.snap) once('s', m.h[0], () => { sfx('crit'); sfx('slam'); flashT = Math.max(flashT, .05); fx.push({ kind: 'ring', x: P.x, y: P.y, z: 2, t: .4, max: .4, r: 120, col: '#EEF2FA', flat: 1 }); shockwave(P.x, P.y, 100, m); });
    if (m.crescent) once('c', m.h[0], () => { SA.objs.push({ kind: 'crescent', x: P.x + f() * 30, y: P.y, dir: f(), t: 0, max: .8, hit: new Set(), m, black: SA.black(), pure: SA.pure(), seed: Math.random() * 99 }); sfx('whoosh'); if (SA.black()) sfx('growl', .4); if (SA.pure()) { sfx('learned', .45); sfx('hit-crystal', .5); } });
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
    if (SA.pure() && SA.wrist && Math.random() < dt * 7 && parts.length < 400) parts.push({ x: SA.wrist.x + rand(-6, 6), y: P.y + rand(-2, 2), z: Math.max(4, P.y - SA.wrist.y) + rand(-4, 4), vx: rand(-10, 10), vy: 0, vz: rand(30, 70), life: .6, max: .6, col: pick(['#FFFFFF', '#FFF4D0', '#FFE08A']), size: rand(1.2, 2.2), shape: 'ember', rot: 0, vr: 3 }); // (white fire shed off the Dawn Knuckles)
    // what the arm sends out strikes the fallen too (the curse counts it: corruption.js), each body once per thing
    if (window.__corpsesNear && corpses.length) for (const o of SA.objs) { if (o.gone) continue;
      const r = { rocket: (o.z || 0) < 70 ? 18 : 0, ghost: (o.z || 0) < 60 ? 16 : 0, burst: o.struck ? 44 : 0, crescent: 20, crack: o.t > .08 ? (o.R || 90) * .6 : 0, gale: 60, rend: 30, eclipse: o.done ? 110 : 0 }[o.kind];
      if (r) window.__corpsesNear(o, o.x, o.y, r); }
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
    } else if (o.kind === 'crescent' && o.pure) { // Dawnfall: a tall crescent of white fire that widens as it runs, and calls a pillar of sunrise down on each it cuts
      o.x += o.dir * 720 * dt; o.max = 1.05; const gw = 1 + o.t * .9;
      for (const e of foes()) { if (o.hit.has(e) || Math.abs(e.x - o.x) > e.hw + 26 * gw || Math.abs(e.y - o.y) > 30 * gw || e.z > 110) continue; o.hit.add(e); hitE(e, 24, o.dir, o.m, { kb: 340, power: 2 });
        burst(e.x, e.y, e.z + e.hh * .5, ['#FFFFFF', '#FFF0C8', '#FFD27A'], 10, 'spark', 0, true);
        SA.objs.push({ kind: 'dawn', e, x: e.x, y: e.y, t: 0, max: .75, at: .22, m: o.m, dir: o.dir, done: false, seed: Math.random() * 99 }); }
      if (Math.random() < dt * 40) parts.push({ x: o.x - o.dir * rand(0, 40), y: o.y + rand(-6, 6), z: rand(6, 90 * gw), vx: -o.dir * rand(30, 110), vy: 0, vz: rand(40, 120), life: .55, max: .55, col: pick(['#FFFFFF', '#FFF0C8', '#FFD27A', '#FFE9A8']), size: rand(1.6, 3), shape: 'spark', rot: 0, vr: 0 });
      if (o.t > o.max || o.x < leftWall() - 40 || o.x > rightWall() + 40) { if (!o.bloom) { o.bloom = 1; SA.objs.push({ kind: 'dawn', e: null, x: o.x, y: o.y, t: 0, max: .75, at: .05, m: o.m, dir: o.dir, done: false, seed: Math.random() * 99, end: 1 }); } o.gone = true; }
    } else if (o.kind === 'dawn') { // the sunrise answering the Dawnfall's cut: a column of white fire, and a ring of it out along the street
      const e = o.e; if (e && !e.dead) { o.x = e.x; o.y = e.y; }
      if (!o.done && o.t >= o.at) { o.done = true; shakeMag = Math.max(shakeMag, o.end ? 6 : 4); sfx('learned', .4); sfx('slam', .5);
        if (e && !e.dead) hitE(e, 20, o.dir, o.m, { kb: 80, launch: 260, power: 2, crit: 1 });
        for (const q of foes()) if (q !== e && Math.hypot(q.x - o.x, (q.y - o.y) * 2) < 70 + q.hw) hitE(q, 12, Math.sign(q.x - o.x) || o.dir, o.m, { kb: 220, launch: 140, power: 1 });
        burst(o.x, o.y, 20, ['#FFFFFF', '#FFF0C8', '#FFD27A'], 18, 'spark', 0, true); burst(o.x, o.y, 90, ['#FFFFFF', '#FFE9A8'], 10, 'spark', 0, true); }
      if (o.t > o.max) o.gone = true;
    } else if (o.kind === 'crescent') { // a crescent of moonlight sliding down the street
      o.x += o.dir * 560 * dt;
      for (const e of foes()) { if (o.hit.has(e) || Math.abs(e.x - o.x) > e.hw + 18 || Math.abs(e.y - o.y) > 26 || e.z > 70) continue; o.hit.add(e); hitE(e, 18, o.dir, o.m, { kb: 300, power: 1 });
        if (o.black) SA.objs.push({ kind: 'brand', e, x: e.x, y: e.y, t: 0, max: .9, at: .38, m: o.m, dir: o.dir, done: false }); }
      if (o.black && Math.random() < dt * 26) { const z = rand(10, 60); parts.push({ x: o.x - o.dir * rand(0, 30), y: o.y + rand(-4, 4), z, vx: -o.dir * rand(20, 80), vy: 0, vz: rand(20, 70), life: .45, max: .45, col: pick(['#FF3A5A', '#7A1030', '#1A0A14']), size: rand(1.4, 2.6), shape: 'spark', rot: 0, vr: 0 }); }
      if (o.black && Math.random() < dt * 14) fx.push({ kind: 'bolt', x: o.x + rand(-10, 10), y: o.y, z: rand(50, 80), x2: o.x - o.dir * rand(10, 40), y2: o.y, z2: rand(4, 30), t: .1, max: .1, col: '#FF5A7A', seed: Math.random() * 99 });
      if (o.t > o.max || o.x < leftWall() - 30 || o.x > rightWall() + 30) o.gone = true;
    } else if (o.kind === 'eclipse') { if (!o.done && o.t >= o.max * .55) { o.done = true; sfx('shoot'); sfx('slam'); shakeMag = Math.max(shakeMag, 10);
        for (let i = 0; i < 5; i++) fx.push({ kind: 'bolt', x: o.x + rand(-20, 20), y: o.y, z: 320, x2: o.x + rand(-10, 10), y2: o.y, z2: 2, t: .3, max: .3, col: i % 2 ? '#FF4A6A' : '#FFD0D8', seed: Math.random() * 99 });
        for (const e of foes()) if (Math.hypot(e.x - o.x, (e.y - o.y) * 2) < 120 + e.hw) hitE(e, 22, Math.sign(e.x - o.x) || 1, { arm: 1, kb: 180, launch: 380, power: 2 }); }
      if (o.t > o.max) o.gone = true;
    } else if (o.kind === 'brand') { // Rending Talons: the mark the black crescent left, and the crimson lightning that finds it
      const e = o.e; if (e && !e.dead) { o.x = e.x; o.y = e.y; }
      if (!o.done && o.t >= o.at) { o.done = true; const z = e ? e.z + e.hh * .5 : 30;
        fx.push({ kind: 'bolt', x: o.x + rand(-8, 8), y: o.y, z: z + 220, x2: o.x, y2: o.y, z2: z, t: .24, max: .24, col: '#FF4A6A', seed: Math.random() * 99 });
        fx.push({ kind: 'bolt', x: o.x + rand(-30, 30), y: o.y, z: z + 160, x2: o.x, y2: o.y, z2: z, t: .18, max: .18, col: '#B01030', seed: Math.random() * 99 });
        if (e && !e.dead) hitE(e, 14, o.dir, o.m, { kb: 60, launch: 220, power: 2, crit: 1 });
        burst(o.x, o.y, z, ['#FF3A5A', '#1A0A14', '#FF9AAA'], 14, 'spark', 0, true); sfx('shoot', .6); shakeMag = Math.max(shakeMag, 4); }
      if (o.t > o.max) o.gone = true;
    } else if (o.kind === 'sky') { if (!o.landed) { o.x = P.x + P.facing * 40; o.y = P.y; if (o.t > 2) o.gone = true; } else if (o.t > .55) o.gone = true; }
    else if (o.t > o.max) o.gone = true;
  }

  // ---------------- the look ----------------
  // his weapon arm, silver from the shoulder, plated and jointed like the Phantom's, gilt at the elbow and shoulder
  const _look = heroLook; heroLook = function () { const L = _look(); if (SA.on()) { L.armSilver = 1; L.glove = SA.black() ? '#2A2030' : '#C8D0DE'; L.gauntPlate = 1; } return L; };
  // the arm's metal: the Phantom's silver, or with the Black Knuckles on it the knuckles' own blackened violet iron
  const AP = () => SA.black() ? { base: '#3A3046', dark: '#120C16', lite: '#7A6A8A', line: 'rgba(10,4,12,.6)' } : { base: BN.silver, dark: BN.silverDk, lite: BN.silverLt, line: 'rgba(60,70,100,.55)' };
  function plate(x0, y0, x1, y1, w0, w1, far) {
    const A = AP(), st = K.taper(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2, x1, y1, w0, w1, 4), col = far ? shade(A.base, -.22) : A.base;
    K.cel(K.stripPath(st), col, { d: 1.4, r: .7, w: 1.1, dark: A.dark, lite: A.lite, tex: () => {
      ctx.strokeStyle = A.line; ctx.lineWidth = .5; ctx.beginPath(); for (let i = 1; i < 4; i++) { const q = i / 4, n = st.L.length; ctx.moveTo(st.L[0] + (st.L[n - 2] - st.L[0]) * q, st.L[1] + (st.L[n - 1] - st.L[1]) * q); ctx.lineTo(st.R[0] + (st.R[n - 2] - st.R[0]) * q, st.R[1] + (st.R[n - 1] - st.R[1]) * q); } ctx.stroke(); } });
  }
  const _arm = CORWIN.arm;
  CORWIN.arm = function (L, ax, ay, bx, by, cx, cy, far) {
    if (!L.armSilver || ax !== 0 || ay !== 0) return _arm.apply(this, arguments); // (the weapon arm is the one drawn from its own shoulder)
    plate(ax, ay, bx, by, 8.2, 6.2, far); plate(bx, by, cx, cy, 6.4, 4.8, far);
    if (SA.black()) { // cursed: crimson veins down the iron, spurs at the elbow, black stones ringed in red where the gilt was
      const t = performance.now() / 1000, b = .5 + .5 * Math.sin(t * 2.2);
      if (!FLASH && !TINT) K.add(() => { ctx.strokeStyle = `rgba(230,40,70,${(.35 + .3 * b).toFixed(3)})`; ctx.lineWidth = .7; ctx.lineCap = 'round';
        for (const [x0, y0, x1, y1, o] of [[ax, ay, bx, by, 1.4], [bx, by, cx, cy, -1.1]]) { const nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny) || 1; ctx.beginPath(); ctx.moveTo(x0 + nx / nl * o, y0 + ny / nl * o);
          ctx.quadraticCurveTo((x0 + x1) / 2 - nx / nl * o * 1.4, (y0 + y1) / 2 - ny / nl * o * 1.4, x1 + nx / nl * o * .3, y1 + ny / nl * o * .3); ctx.stroke(); } });
      { const dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l; ctx.fillStyle = C('#1A1420');
        for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(bx - uy * k * 2.2, by + ux * k * 2.2); ctx.lineTo(bx - uy * k * 5.6 - ux * 1.2, by + ux * k * 5.6 - uy * 1.2); ctx.lineTo(bx - uy * k * 1.2 - ux * 2.4, by + ux * k * 1.2 - uy * 2.4); ctx.closePath(); ctx.fill(); outline(.5); } }
      for (const [x, y, r] of [[bx, by, 2.5], [ax, ay, 3]]) { ctx.fillStyle = C('#050206'); circle(x, y, r); ctx.fill(); outline(.8); if (!FLASH && !TINT) K.add(() => { ctx.strokeStyle = `rgba(255,60,80,${(.5 + .4 * b).toFixed(3)})`; ctx.lineWidth = .6; ctx.beginPath(); ctx.arc(x, y, r * .62, t * 2, t * 2 + 4); ctx.stroke(); }); }
      K.glowAt((bx + cx) / 2, (by + cy) / 2, 14, '170,20,60', .2 + .1 * b);
    } else if (SA.pure()) { // the Dawn Knuckles' arm: the silver lit from within by white fire, its joints burning white-gold
      const t = performance.now() / 1000, b = .5 + .5 * Math.sin(t * 3);
      for (const [x, y, r] of [[bx, by, 2.5], [ax, ay, 3]]) { ctx.fillStyle = C('#FFF0C0'); circle(x, y, r); ctx.fill(); outline(.8); }
      if (!FLASH && !TINT) K.add(() => { ctx.strokeStyle = `rgba(255,246,214,${(.45 + .3 * b).toFixed(3)})`; ctx.lineWidth = 1.1; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.stroke(); });
      K.glowAt((ax + bx) / 2, (ay + by) / 2, 14, '255,236,180', .28 + .1 * b); K.glowAt((bx + cx) / 2, (by + cy) / 2, 16, '255,236,180', .34 + .12 * b); K.glowAt(bx, by, 9, '255,250,230', .4);
    } else {
    ctx.fillStyle = C(BN.gilt); circle(bx, by, 2.5); ctx.fill(); outline(.8); if (K.DET()) { ctx.fillStyle = '#FFFFFF'; circle(bx - .5, by - .7, .7); ctx.fill(); }
    ctx.fillStyle = C(BN.gilt); circle(ax, ay, 3); ctx.fill(); outline(.9);
    K.glowAt((bx + cx) / 2, (by + cy) / 2, 14, LT('225,235,255'), .22); }
  };
  // the hand: flung out on its chain, grown huge, or shaped (drawn in the weapon's place)
  function chainTo(x0, x1, links = true) {
    if (x1 - x0 < 2) return;
    K.add(() => { ctx.strokeStyle = `rgba(${LT('210,225,255')},.55)`; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, 0); ctx.stroke(); });
    const A = AP(); ctx.strokeStyle = C(A.dark); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, 0); ctx.stroke();
    if (links) for (let x = x0 + 3; x < x1 - 2; x += 4.2) { ctx.fillStyle = C(A.base); ell(x, 0, 1.9, 1.2); ctx.fill(); ctx.strokeStyle = C(A.dark); ctx.lineWidth = .4; ctx.stroke(); }
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
    if (big > 1.2 || shape) { ctx.save(); ctx.translate(12, 0); RIG(shape || 'rock', { s: .19 * big, rot: pose.armRot || 0, t }); ctx.restore(); K.glowAt(12 + 10 * big, 0, 10 + 8 * big, LT('225,235,255'), .3); }
    else { let done = false; if (SA.black() && pose.cwArt && typeof CWART !== 'undefined') { try { done = CWART.draw('fists', pose.cwArt, pose, false); } catch (e) { done = false; } } if (!done) _dw(kind, pose); K.glowAt(17, 0, 9, LT('225,235,255'), .28);
      if (SA.pure()) { const T = typeof t === 'number' ? t : performance.now() / 1000, jx = 15.6, jy = -.4, pu = .5 + .5 * Math.sin(T * 3.2); // (the Dawn Knuckles: a jewel of white fire set in the back of the silver fist, its light turning inside it)
        K.glowAt(jx, jy, 7 + 2 * pu, '255,236,180', .25 + .2 * pu);
        ctx.save(); ctx.fillStyle = '#C9A24A'; ctx.beginPath(); ctx.arc(jx, jy, 2.7, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(40,30,10,.8)'; ctx.lineWidth = .5; ctx.stroke();
        const sx = jx + Math.cos(T * 2.4) * .8, sy = jy + Math.sin(T * 2.4) * .8, g = ctx.createRadialGradient(sx, sy, .1, jx, jy, 2); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.45, `rgb(255,${236 + 14 * pu | 0},${170 + 60 * pu | 0})`); g.addColorStop(1, '#D88A2A');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(jx, jy, 2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = .35; ctx.beginPath(); for (let k = 0; k < 3; k++) { const an = T * .9 + k * Math.PI / 3; ctx.moveTo(jx + Math.cos(an) * 1.9, jy + Math.sin(an) * 1.9); ctx.lineTo(jx - Math.cos(an) * 1.9, jy - Math.sin(an) * 1.9); } ctx.stroke();
        const rq = (T * .7) % 1; ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,236,180,${(.6 * (1 - rq)).toFixed(3)})`; ctx.lineWidth = .6; ctx.beginPath(); ctx.arc(jx, jy, 2.7 + rq * 5, 0, Math.PI * 2); ctx.stroke();
        ctx.restore(); } } // (the Black Knuckles' own fist when it is the plain fist)
    ctx.restore();
  };
  const _pp = playerPose;
  playerPose = function () {
    const pose = _pp(); if (!SA.on()) return pose;
    pose.armOn = 1; if (SA.fistOut) { pose.armGone = 1; pose.arm = 0; pose.elbow = 0; pose.ext = .6; }
    if (P.state === 'charge') { const s = jkOf(P.ct || 0), q = Math.min(1, (P.ct || 0) / .45); pose.armShape = P.ct >= .45 ? s : 'rock'; pose.armBig = 1 + 1.4 * q + .1 * Math.sin(performance.now() / 70) * q; pose.arm = -1.6; pose.elbow = 1.2; pose.glow = perfectGlow() || `rgba(${LT('225,235,255')},.6)`;
      const d = jkDef(P.ct || 0); if (P.ct >= .45 && SA.jkShown !== d) { SA.jkShown = d; floatText(P.x, P.y, 92, d === 'rock2' ? 'ROCK!!…' : s.toUpperCase() + '…', d === 'rock2' ? '#FFE08A' : '#EEF2FA', d === 'rock2' ? 17 : 14); sfx(d === 'rock2' ? 'charge' : 'hit-metal', d === 'rock2' ? 2 : .3); }
      if (d === 'rock2') { pose.armBig += .5; pose.glow = 'rgba(255,224,138,.9)'; }
      { const pc = chargeTiming(WEAPONS.fists); if (pc.open && P.ct >= .45) { const q = 1 - Math.min(1, (pc.since || 0) / .14); pose.armBig += .35 * q; pose.glow = 'rgba(255,250,228,.98)'; // (the perfect window: the hand flares white-gold and swells for the moment it is open)
          if (SA.pcAt !== pc.at) { SA.pcAt = pc.at; sfx('charge', 3); const w = SA.wrist; if (w) fx.push({ kind: 'ring', x: w.x, y: P.y, z: Math.max(0, P.y - w.y), t: .16, max: .16, r: 30, col: '#FFF4D0' }); } } } }
    else SA.jkShown = null;
    return pose;
  };
  { const _ml = mechList; mechList = function (list, t) { _ml(list, t); SA.Mw = ctx.getTransform(); for (const o of SA.objs) drawObj(o, list, t); }; }
  { const _mb = mechBoxes; mechBoxes = function (box) { _mb(box); for (const o of SA.objs) { const q = o.e || o; if (Number.isFinite(q.x) && Number.isFinite(q.y)) box(q.x, q.y, q.z || 0, 90, 150); } if (SA.on()) box(P.x, P.y, P.z, 170, 170); }; }
  function drawObj(o, list, t) {
    if (o.kind === 'rocket') list.push([o.y + .2, () => { // the fist in flight, and the chain back to his wrist
      const w = SA.wrist; if (w) K.leafLine(() => { ctx.moveTo(w.x, w.y); ctx.lineTo(o.x - o.dir * 6, o.y - o.z); }, 1.3, .9);
      if (w) onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${LT('210,225,255')},.45)`; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.lineTo(o.x, o.y - o.z); ctx.stroke(); ctx.restore(); });
      ctx.save(); ctx.translate(o.x - o.dir * 8, o.y - o.z); ctx.scale(o.dir, 1); RIG(o.held || o.zip ? 'rock' : o.grab && !o.back ? 'claw' : 'rock', { s: .46, t }); ctx.restore(); K.glowAt(o.x, o.y - o.z, 22, LT('230,238,255'), .5); }]);
    else if (o.kind === 'titan' && o.e && !o.e.dead && !o.done.th && !o.e.boss) list.push([o.e.y + .3, () => { ctx.save(); ctx.translate(o.e.x - o.dir * (o.e.hw + 8), o.e.y - o.e.z - o.e.hh * .45); ctx.scale(o.dir, 1); RIG(o.t < .1 ? 'claw' : 'rock', { s: .5, t, a: .92 }); ctx.restore(); }]); // the huge hand closed round them
    else if (o.kind === 'burst') list.push([o.y, () => { const k = Math.min(1, o.t / .12), d = o.t > .45 ? (o.t - .45) / .25 : 0; ctx.save(); ctx.beginPath(); ctx.rect(o.x - 80, o.y - 200, 160, 202); ctx.clip(); ctx.translate(o.x, o.y + (1 - k) * 60 + d * 70); ctx.scale(o.dir, 1); RIG(o.t < .18 ? 'paper' : 'rock', { s: .5, rot: -Math.PI / 2, t, stump: 1 }); ctx.restore(); K.glowAt(o.x, o.y - 30, 50, LT('230,238,255'), .4 * (1 - d)); }]);
    else if (o.kind === 'ghost') list.push([o.y, () => { ctx.save(); ctx.globalAlpha *= .85 * Math.min(1, (1 - o.t / o.max) * 2); ctx.translate(o.x, o.y - o.z); ctx.scale(o.dir, 1); ctx.rotate(o.a); RIG('rock', { s: o.s * 1.3, t }); ctx.restore(); K.glowAt(o.x, o.y - o.z, 16, LT('225,235,255'), .35); }]);
    else if (o.kind === 'crescent' && o.black) list.push([o.y, () => onMain(() => { const a = 1 - o.t / o.max, r = mulberry(Math.floor(o.t * 24) + (o.seed | 0)); ctx.save(); ctx.translate(o.x, o.y - 30); ctx.scale(o.dir, 1);
        for (let i = 0; i < 3; i++) { const dy = (i - 1) * 16, x0 = -i * 6; ctx.beginPath(); ctx.moveTo(x0 - 18, dy - 22);
          for (let k = 1; k <= 7; k++) { const q = k / 7, x = x0 - 18 + 30 * Math.sin(q * Math.PI) + (r() - .5) * 6, y = dy - 22 + 44 * q + (r() - .5) * 4; ctx.lineTo(x, y); }
          ctx.strokeStyle = `rgba(20,6,16,${(.85 * a).toFixed(3)})`; ctx.lineWidth = 5 - i; ctx.lineJoin = 'miter'; ctx.stroke();
          ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,50,80,${(.75 * a).toFixed(3)})`; ctx.lineWidth = 1.6; ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; }
        ctx.restore(); })]);
    else if (o.kind === 'crack') list.push([o.y - 30, () => onMain(() => { const a = Math.min(1, o.t / .08) * (1 - Math.max(0, (o.t - o.max * .6) / (o.max * .4))), r = mulberry(o.seed | 0); ctx.save(); ctx.lineCap = 'round';
        for (let i = 0; i < o.n; i++) { const an = r() * Math.PI * 2, L = o.R * (.5 + .5 * r()) * Math.min(1, o.t / .12); let x = o.x, yy = o.y; ctx.beginPath(); ctx.moveTo(x, yy);
          for (let k = 1; k <= 4; k++) { x = o.x + Math.cos(an + (r() - .5) * .5) * L * k / 4; yy = o.y + Math.sin(an + (r() - .5) * .5) * L * k / 4 * .32; ctx.lineTo(x, yy); }
          ctx.strokeStyle = `rgba(10,4,10,${(.85 * a).toFixed(3)})`; ctx.lineWidth = 3.2; ctx.stroke(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,50,80,${((.5 + .4 * Math.sin(o.t * 20 + i)) * a).toFixed(3)})`; ctx.lineWidth = 1.2; ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; }
        ctx.restore(); })]);
    else if (o.kind === 'gale') list.push([o.y, () => onMain(() => { const a = 1 - o.t / o.max, r = mulberry((o.seed | 0) + Math.floor(o.t * 30)); ctx.save(); ctx.translate(o.x, o.y); ctx.scale(o.dir, 1);
        const g = ctx.createLinearGradient(0, 0, 160, 0); g.addColorStop(0, `rgba(20,6,18,${(.55 * a).toFixed(3)})`); g.addColorStop(1, 'rgba(20,6,18,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(70 + o.t * 120, -40, 110, 48, 0, 0, Math.PI * 2); ctx.fill();
        for (let i = 0; i < 14; i++) { const x = r() * 180 + o.t * 260, yy = -10 - r() * 80; ctx.fillStyle = i % 3 ? `rgba(255,50,80,${(.7 * a).toFixed(3)})` : `rgba(12,4,10,${(.8 * a).toFixed(3)})`; ctx.save(); ctx.translate(x, yy); ctx.rotate(r() * 6 + o.t * 12); ctx.fillRect(-4, -1.2, 8 + r() * 6, 2.4); ctx.restore(); }
        ctx.restore(); })]);
    else if (o.kind === 'rend') list.push([o.y, () => onMain(() => { const a = 1 - o.t / o.max, snap = o.t > o.max * .7 ? (o.t - o.max * .7) / (o.max * .3) : 0, w = 1 - snap; ctx.save(); ctx.translate(o.x, o.y - 40); ctx.scale(o.dir * (o.w || 1), 1);
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-34 * w, -34 * s * w); ctx.lineTo(34 * w, 34 * s * w); ctx.strokeStyle = `rgba(14,4,12,${(.9 * a).toFixed(3)})`; ctx.lineWidth = 7 * (1 - snap * .6); ctx.stroke();
          ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,60,90,${(.85 * a).toFixed(3)})`; ctx.lineWidth = 2.2; ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; }
        ctx.restore(); })]);
    else if (o.kind === 'eclipse') list.push([o.y + 1, () => onMain(() => { const k = o.t / o.max, inR = k < .55 ? 80 * (1 - k / .55 * .85) : 12, a = k < .55 ? Math.min(1, k * 6) : Math.max(0, 1 - (k - .55) / .45); ctx.save();
        ctx.fillStyle = `rgba(6,2,8,${(.85 * a).toFixed(3)})`; ctx.beginPath(); ctx.arc(o.x, o.y - 90, inR, 0, Math.PI * 2); ctx.fill(); ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(255,50,80,${(.8 * a).toFixed(3)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(o.x, o.y - 90, inR + 3, 0, Math.PI * 2); ctx.stroke();
        if (k >= .55) { const q = (k - .55) / .45, w = 26 * (1 - q); const lg = ctx.createLinearGradient(o.x - w, 0, o.x + w, 0); lg.addColorStop(0, 'rgba(255,40,70,0)'); lg.addColorStop(.5, `rgba(255,190,200,${(.9 * (1 - q)).toFixed(3)})`); lg.addColorStop(1, 'rgba(255,40,70,0)'); ctx.fillStyle = lg; ctx.fillRect(o.x - w, o.y - 320, w * 2, 320); }
        ctx.restore(); })]);
    else if (o.kind === 'brand') list.push([o.y, () => onMain(() => { if (o.done) return; const k = o.t / o.at, z = o.e ? o.e.z + o.e.hh * .5 : 30; ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(255,50,80,${(.4 + .5 * k).toFixed(3)})`; ctx.lineWidth = 1.4; ctx.beginPath(); for (let i = 0; i < 3; i++) { const yy = o.y - z - 6 + i * 6; ctx.moveTo(o.x - 8, yy - 3); ctx.lineTo(o.x + 8, yy + 3); } ctx.stroke();
        ctx.beginPath(); ctx.ellipse(o.x, o.y, 14 * (1.2 - k * .4), 4.5 * (1.2 - k * .4), 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); })]);
    else if (o.kind === 'crescent' && o.pure) list.push([o.y, () => onMain(() => { const a = Math.min(1, o.t / .05) * (1 - Math.max(0, (o.t - o.max * .7) / (o.max * .3))), gw = 1 + o.t * .9, fl = mulberry(Math.floor(o.t * 30) + (o.seed | 0)); ctx.save(); ctx.translate(o.x, o.y - 40 * gw); ctx.scale(o.dir * gw, gw);
        const hg = ctx.createRadialGradient(0, 0, 4, 0, 0, 70); hg.addColorStop(0, `rgba(255,240,200,${(.35 * a).toFixed(3)})`); hg.addColorStop(1, 'rgba(255,200,120,0)'); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(-10, 0, 70, 60, 0, 0, Math.PI * 2); ctx.fill();
        for (let i = 0; i < 4; i++) { const L = 46 - i * 4, W = 20 - i * 3; ctx.beginPath(); ctx.moveTo(-i * 12, -L);
          for (let k = 1; k <= 10; k++) { const q = k / 10, an = -Math.PI / 2 + q * Math.PI; ctx.lineTo(-i * 12 + Math.cos(an) * W + (i ? (fl() - .5) * 5 : 0), Math.sin(an) * L); }
          ctx.strokeStyle = i ? `rgba(255,${210 + i * 10},${120 + i * 30},${(a * (.75 - i * .15)).toFixed(3)})` : `rgba(255,255,255,${a.toFixed(3)})`; ctx.lineWidth = i ? 6 - i : 7; ctx.lineCap = 'round'; ctx.stroke(); }
        for (let k = 0; k < 9; k++) { const q = fl(), an = -Math.PI / 2 + q * Math.PI, x = Math.cos(an) * 20, y = Math.sin(an) * 46; ctx.fillStyle = `rgba(255,${200 + fl() * 55 | 0},150,${(.7 * a).toFixed(3)})`; ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.quadraticCurveTo(x + 4 + fl() * 8, y - 2, x + 10 + fl() * 14, y + (fl() - .5) * 6); ctx.quadraticCurveTo(x + 4, y + 3, x - 3, y); ctx.fill(); }
        ctx.restore(); })]);
    else if (o.kind === 'dawn') list.push([o.y + .2, () => onMain(() => { const k = o.t / o.max, z = o.e ? o.e.z + o.e.hh * .5 : 30; ctx.save(); ctx.globalCompositeOperation = 'lighter';
        if (!o.done) { const q = o.t / o.at; ctx.strokeStyle = `rgba(255,236,170,${(.5 + .5 * q).toFixed(3)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(o.x, o.y, 34 * (1.4 - q), 11 * (1.4 - q), 0, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = `rgba(255,250,230,${(.3 * q).toFixed(3)})`; ctx.fillRect(o.x - 2, o.y - 300, 4, 300); }
        else { const d = (o.t - o.at) / (o.max - o.at), w = (o.end ? 30 : 22) * (1 - d * .7), A = 1 - d; const lg = ctx.createLinearGradient(o.x - w, 0, o.x + w, 0); lg.addColorStop(0, 'rgba(255,200,110,0)'); lg.addColorStop(.5, `rgba(255,252,236,${(.95 * A).toFixed(3)})`); lg.addColorStop(1, 'rgba(255,200,110,0)'); ctx.fillStyle = lg; ctx.fillRect(o.x - w, o.y - 340, w * 2, 340);
          ctx.strokeStyle = `rgba(255,230,160,${(.8 * A).toFixed(3)})`; ctx.lineWidth = 3 * A + .5; const R = 20 + d * 80; ctx.beginPath(); ctx.ellipse(o.x, o.y, R, R * .32, 0, 0, Math.PI * 2); ctx.stroke();
          const g = ctx.createRadialGradient(o.x, o.y - z, 2, o.x, o.y - z, 46); g.addColorStop(0, `rgba(255,255,255,${(.8 * A).toFixed(3)})`); g.addColorStop(1, 'rgba(255,220,140,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, o.y - z, 46, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore(); })]);
    else if (o.kind === 'crescent') list.push([o.y, () => onMain(() => { const a = 1 - o.t / o.max; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(o.x, o.y - 30); ctx.scale(o.dir, 1);
      for (let i = 0; i < 3; i++) { ctx.strokeStyle = `rgba(${i ? LT('200,215,255') : LT('255,255,255')},${a * (.9 - i * .25)})`; ctx.lineWidth = 5 - i * 1.4; ctx.beginPath(); ctx.ellipse(-i * 10, 0, 14, 34, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke(); } ctx.restore(); })]);
    else if (o.kind === 'gust') list.push([o.y, () => onMain(() => { const a = 1 - o.t / o.max; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${LT('225,235,255')},${a * .8})`; ctx.lineWidth = 2; for (let i = 0; i < 7; i++) { const y = o.y - 10 - i * 9, x = o.x + o.dir * o.t * 500; ctx.beginPath(); ctx.moveTo(x - o.dir * 60, y); ctx.lineTo(x + o.dir * (20 + i % 2 * 20), y); ctx.stroke(); } ctx.restore(); })]);
    else if (o.kind === 'snip') list.push([o.y, () => onMain(() => { const a = 1 - o.t / o.max; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${LT('245,248,255')},${a})`; ctx.lineWidth = 4; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(o.x - o.dir * 100, o.y - 40 + s * 32); ctx.lineTo(o.x + o.dir * 100, o.y - 40 - s * 32); ctx.stroke(); } ctx.restore(); })]);
    else if (o.kind === 'sky') list.push([o.y + .1, () => { const z = o.landed ? 0 : Math.max(0, P.z + 60), q = o.landed ? Math.max(0, 1 - o.t / .55) : 1; ctx.save(); ctx.globalAlpha *= o.landed ? q : Math.min(1, o.t * 4); ctx.translate(o.x, o.y - z - 96 - (o.landed ? 0 : 30)); ctx.scale(o.dir, 1); RIG('paper', { s: .9, rot: Math.PI / 2, t, stump: 1 }); ctx.restore(); }]);
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
    'arm:LLH'(pose, m, k) { pose.arm = -.05; pose.elbow = 0; pose.ext = .3; pose.armChain = 64 * sst(span(k, 0, .15)) * (1 - span(k, .88, 1)); pose.armBig = 1.6; pose.armShape = 'rock'; pose.backArm = 2.6; pose.lean = -.2; pose.trail = 0; pose.flat = k > .12 && k < .86 ? { r: 110, k: .96, rev: false, col: `rgba(${LT('225,235,255')},.95)`, w: 5 } : null; },
    'arm:HL'(pose, m, k) { const g = sst(span(k, .1, .5)); pose.armBig = 1 + 2 * g; pose.armShape = 'rock'; },
    'arm:X'(pose, m, k) { MOVE_POSE['fists:X'](pose, m, k); const g = sst(span(k, .1, m.h[0])); pose.armBig = 1 + 1.6 * g * (1 - span(k, .8, 1)); pose.armShape = 'paper'; pose.armRot = -.6 * g; pose.trail = 0; }, // the Rising Fist's body, the open silver hand scooping up
    'arm:AAA'(pose, m, k) { pose.armBig = 1 + 1.2 * out(m, k); pose.armShape = 'rock'; pose.armChain = 20 * out(m, k); },
    'arm:JH'(pose, m, k) { const g = k < m.h[0] ? 1 : out(m, k); pose.arm = -.1; pose.elbow = 0; pose.ext = .6; pose.armChain = P.hookE && k < m.h[0] ? Math.min(90, Math.abs(P.hookE.x - P.x) - 20) * (1 - span(k, .2, m.h[0])) : 0; pose.armShape = k < m.h[0] ? 'claw' : 'rock'; pose.armBig = 1.3 + .6 * g; pose.lean = .35; pose.legs = { f: 10, b: -16, fk: 10, bk: 4 }; pose.flow = 14; pose.trail = 0; pose.streak = null; },
    'arm:DA'(pose, m, k) { const e = out(m, k); pose.arm = -.1 - (pose.rot || 0) * .5; pose.elbow = 0; pose.ext = .8; pose.armChain = 30 * e; pose.armBig = 1.2 + .9 * e; pose.armShape = 'rock'; pose.rot = .36; pose.lean = .25; pose.legs = { f: 4, b: -19, fk: 12, bk: -2 }; pose.flow = 16; pose.trail = 0; pose.streak = null; },
    'arm:D'(pose, m, k) { const e = sst(span(k, 0, .12)) * (1 - span(k, .84, 1)); pose.arm = -.08 - .35 * e; pose.elbow = 0; pose.ext = .9; pose.armChain = 46 * e; pose.armBig = 1 + .9 * e; pose.armShape = 'rock'; pose.lean = .55 * e; pose.rot = .25 * e; pose.legs = { f: lerp(8, -2, e), b: lerp(-8, -22, e), fk: 3, bk: 2 }; pose.flow = 20; pose.backArm = 2.7; pose.trail = 0; pose.streak = null; delete pose.sweep; },
    'arm:DX'(pose, m, k) { MOVE_POSE['fists:D'](pose, m, k); const g = sst(span(k, .1, m.h[0])) * (1 - span(k, .8, 1)); pose.armBig = 1 + 1.4 * g; pose.armShape = 'rock'; },
    'arm:R'(pose, m, k) { pose.armShape = k > m.h[0] - .05 && k < m.h[1] + .1 ? 'paper' : undefined; pose.armBig = pose.armShape ? 1.6 : 1; },
    'arm:RH'(pose, m, k) { // Thunder Rise: crouched low and leaning in through the dash, the fist cocked down by the knee; then he comes up out of it, the arm swung straight up, and hangs a moment at the top
      const dash = 1 - sst(span(k, .26, m.h[0])), up = sst(span(k, m.h[0] - .06, m.h[0] + .08)), out = span(k, .82, 1);
      pose.sink = 6 * dash; pose.lean = lerp(-.15, .32, dash) * (1 - out); // (a slight crouch, straightening as the fist comes up: no hop)
      pose.arm = lerp(1.7, -1.5, up) * (1 - out) + .2 * out; pose.elbow = lerp(1.7, .15, up); pose.ext = .5 * up; pose.backArm = lerp(2.2, 1.4, up); pose.backElbow = 1.6;
      pose.legs = { f: lerp(9, 15, dash), b: lerp(-10, -14, dash), fk: lerp(2, 8, dash), bk: lerp(4, 5, dash) }; pose.yaw = .25 * up;
      pose.armShape = 'rock'; pose.armBig = 1 + .9 * up * (1 - out); pose.armRot = -1.4 * up; pose.trail = 0; pose.streak = null; pose.flat = null; },
    'arm:HC'(pose, m, k) { const s = m.jk || 'rock', g = sst(span(k, 0, m.h[0])), r = 1 - span(k, .8, 1); pose.armShape = s; pose.armBig = (2.2 + .8 * g) * (.4 + .6 * r) + .0; pose.trail = 0; pose.streak = null; delete pose.sweep; pose.flat = null;
      if (s === 'rock') { pose.arm = lerp(-2.4, 1.3, g); pose.elbow = .2; pose.lean = lerp(-.2, .6, g); pose.sink = 8 * g; pose.legs = { f: 13, b: -12, fk: 9, bk: 3 }; }
      else if (s === 'paper') { pose.arm = -.05; pose.elbow = lerp(1.4, 0, g); pose.ext = g; pose.lean = .45 * g; pose.legs = { f: 15, b: -15, fk: 7, bk: 1, bh: .7 }; pose.sink = 6; pose.armRot = -1.4; }
      else { pose.arm = lerp(-1.2, .6, g) + Math.sin(k * 40) * .2 * g; pose.elbow = .3; pose.lean = .3 * g; pose.armRot = -.2; pose.legs = { f: 12, b: -12, fk: 6, bk: 3 }; pose.sink = 4; } },
    'arm:AH'(pose, m, k) { pose.arm = 1.5; pose.elbow = .2; pose.armShape = 'paper'; pose.armBig = 1.6; pose.armRot = 1.4; },
  });
})();
