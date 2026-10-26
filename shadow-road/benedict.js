'use strict';
// ======================================================================================================
// THE PHANTOM OF BENEDICT, AFTER HIS FIRST SHAPE. Tir-na Nog'th shows what might be, and it does not stop at a man.
// He fights first as himself (art_w5.js); each time he is beaten down the city makes something else of him:
//   shape 2  THE HOST OF BENEDICT: he drives his sword into the floor and every army he ever led climbs up out of the
//            moonstone to carry it: a scrum of ghost soldiers of every age and shadow bearing his banner on the blade.
//            Pincer ranks of pikes, a storm of arrows on a chequered field, cavalry down the lanes, the banner slammed down.
//   shape 3  THE SWORDSMAN IN THE STARS: the moon goes out and the host goes up into the sky as sparks; they come down
//            as a constellation, a giant drawn in stars and silver leaf, which redraws itself into the signs of the
//            zodiac to fight: the Scorpion's sting, the Archer's arrows, the Hunter's belt thrown like a boomerang.
//   shape 4  THE MOON MANTIS: the stars redraw themselves into a sign no zodiac has, fall to the floor and harden into
//            a chrysalis of silver; at dawn it splits, and what climbs out is the swordsman the night could not stop
//            being: a praying mantis as tall as the throne, its wings glass, its near scythe the silver arm. It cuts
//            moonlight down your lane, leaps on you, opens the eyes on its wings, and reaps the floor at your ankles.
// When the Mantis is beaten it kneels and prays, and flakes away to silver leaf; only its silver scythe is left whole,
// and on the floor of the hall that is the silver arm again, and it is yours.
// (The Silver Hand that once was the last shape is gone, but its rig stays here for the silver arm: W5B.rig.)
// Phases: world.js knows bosses with three; this file keeps his shape in e.bph (1-4) and maps it onto e.phase.
// Everything plugs into the hooks the other files expose: PLAN_FX / TELL_FX / BOSS_WIND (world.js), the controller
// and hazard kit of art_w5.js (W5.akit), its drawing kit (W5.kit), and wrappers round updateEnemy and hurtEnemy.
// ======================================================================================================
(() => {
  if (!window.W5 || !W5.kit || !W5.akit || typeof BOSSES === 'undefined' || !BOSSES.benedict) return;
  const { DET, add, glowAt, glowM, hsh, sm, cl01, taper, trace, horn, cel, PB, PP, PE, stripPath, leafLine, mistTongue, benSword, silverArm, BN } = W5.kit;
  const { act, targets, reg, hitP, tellCol, tellLine, guardCol, guardLine, label, inEll, yClamp, xClamp, mist, silverBurst } = W5.akit;
  const isBen = (e) => e && e.def === BOSSES.benedict;
  const B = BOSSES.benedict;
  const W5B = W5.ben = {}; // (for tests and the silver arm)

  // ---------------- his shapes ----------------
  const ENDS = [1, 1, .7, .5, .27];   // each shape lasts while his health is above ENDS[shape + 1] of the whole
  const SHAPE = {
    1: { name: 'The Phantom of Benedict', title: 'MASTER OF ARMS OF AMBER', hw: 24, hh: 84, size: 1.15, dmg: 1 },
    2: { name: 'The Host of Benedict', title: 'EVERY BATTLE HE EVER WON', hw: 40, hh: 118, size: 1.32, dmg: 1.04 },
    3: { name: 'The Swordsman in the Stars', title: 'THE NIGHT DRAWS HIM', hw: 30, hh: 196, size: 1, dmg: 1.1 },
    4: { name: 'The Moon Mantis', title: 'THE BLADE THAT PRAYS', hw: 44, hh: 150, size: 1.08, dmg: 1.16 },
  };
  const shapeOf = (e) => (e && e.bph) || 1;
  Object.defineProperty(B, 'name', { get() { return SHAPE[shapeOf(typeof boss !== 'undefined' ? boss : null)].name; }, configurable: true });
  Object.defineProperty(B, 'title', { get() { return SHAPE[shapeOf(typeof boss !== 'undefined' ? boss : null)].title; }, configurable: true });
  const MORPH_T = { 2: 3.1, 3: 3.5, 4: 4.3 }; // how long each change takes
  const KINDS = new Set(['w5pikes', 'w5volley', 'w5riders', 'w5web', 'w5sting', 'w5arrows', 'w5belt', 'w5meteor', 'w5crescent', 'w5ring']);
  // tell and act times (seconds of wind-up before world.js's phase speed-up of x.88 / x.76)
  Object.assign(BOSS_WIND, { w5phalanx: 1.25, w5volley: 1.35, w5cavalry: 1.3, w5standard: 1.0, w5shieldwall: 1.0,
    w5web: 1.45, w5zodiac: 1.45, w5meteor: 1.25, w5nova: 1.15, w5scythe: 1.45, w5leap: 1.3, w5wings: 1.6, w5reap: 1.45, w5clasp: 1.2 });

  // ---------------- the changes ----------------
  function startMorph(e, ph) {
    e.mfrom = e.bph || 1; e.bph = ph; e.phase = Math.min(3, ph); e.state = 'w5morph'; e.mt = 0; e.mmax = MORPH_T[ph]; e.plan = null; e.w5T = null;
    e.w5guarding = false; e.w5vis = 1; e.w5reach = 0; e.w5caught = 0; e.rotA = 0; e.spin = 0; e.air = false; e.z = 0; e.vz = 0; e.vx = 0; e.walk = 0; e.enraged = false; e.rageT = 0; e.rageQ = false;
    e.w5sign = null; e.w5signK = 0; e.w5lz = 0; e.w5strike = 0; e.w5draw = 0; e.w5beltOut = 0;
    hazards = hazards.filter(h => !(h.kind === 'w5ctl' && h.e === e) && !KINDS.has(h.kind)); // what he was doing ends with the shape that did it
    projs = projs.filter(p => p.owner !== 'e');
    const a = SHAPE[e.mfrom], b = SHAPE[ph]; e.hw = Math.max(a.hw, b.hw) * e.size; e.hh = Math.max(a.hh, b.hh) * e.size; // (the ink box has room for both shapes)
    sfx('trump'); sfx('charge', 3); mist(e.x, e.y, 30, 24); slowmo = Math.max(slowmo, .5);
    e.x = clamp(e.x, leftWall() + 110, rightWall() - 110);
    W5B.lastMorph = ph;
  }
  function finishMorph(e) {
    const ph = e.bph, S = SHAPE[ph];
    e.size = S.size; e.hw = S.hw * e.size; e.hh = S.hh * e.size;
    e.dmg = Math.round(e.baseDmg * S.dmg); e.poiseMax = e.def.poise * 1.6; e.poise = e.poiseMax; e.staggers = 0;
    e.state = 'recover'; e.t = .9; e.cd = 1.1; e.plan = null; e.closeCd = 2.5;
    phaseDrop(e);
    banner(S.name, S.title, 2.4); const bn = document.getElementById('bossname'); if (bn) bn.textContent = S.name;
    shakeMag = Math.max(shakeMag, 12); flashT = Math.max(flashT, .12); zoom = Math.max(zoom, .05); sfx('roar'); sfx('slam');
    fx.push({ kind: 'ring', x: e.x, y: e.y, z: 2, t: .5, max: .5, r: 170, col: '#EEF2FA', flat: 1 });
    if (P.state !== 'dead' && Math.abs(P.x - e.x) < 150) { P.vx = Math.sign(P.x - e.x || 1) * 320; if (P.state === 'idle' || P.state === 'walk') { P.state = 'hurt'; P.t = .25; P.knocked = false; } } // the change throws you back a step (no harm)
  }
  // morph timeline helpers: u is 0..1 through the change
  const seg01 = (u, a, b) => cl01((u - a) / (b - a));
  function morphStep(e, dt) {
    e.mt += dt; const u = e.mt / e.mmax, ph = e.bph;
    e.flash = Math.max(0, e.flash - dt); e.sqx += (1 - e.sqx) * Math.min(1, dt * 12); e.sqy += (1 - e.sqy) * Math.min(1, dt * 12);
    e.facing = Math.sign(P.x - e.x) || e.facing;
    const once = (k, fn) => { if (u >= k && !e['m' + k]) { e['m' + k] = 1; fn(); } };
    if (ph === 2) {
      once(.05, () => { sfx('slam'); shakeMag = Math.max(shakeMag, 6); silverBurst(e.x + e.facing * 6, e.y, 4, 14); }); // the sword driven into the floor
      once(.3, () => { sfx('growl'); for (let i = 0; i < 18; i++) parts.push({ x: e.x + rand(-60, 60), y: e.y + rand(-14, 14), z: 1, vx: rand(-30, 30), vy: 0, vz: rand(60, 160), life: .9, max: .9, col: pick(['rgba(200,214,245,.7)', 'rgba(235,242,255,.6)']), size: rand(4, 8), shape: 'puff', rot: 0, vr: 0 }); });
      once(.62, () => { sfx('roar'); shakeMag = Math.max(shakeMag, 8); });
    } else if (ph === 3) {
      once(.08, () => { sfx('charge', 2); });
      once(.3, () => { sfx('whoosh'); for (let i = 0; i < 46; i++) parts.push({ x: e.x + rand(-50, 50), y: e.y + rand(-10, 10), z: rand(10, 120), vx: rand(-40, 40), vy: 0, vz: rand(160, 420), life: 1.3, max: 1.3, col: pick(['#FFFFFF', '#EEF2FA', '#C8D4EC']), size: rand(1.5, 3), shape: 'star', rot: 0, vr: 4 }); });
      once(.62, () => { sfx('hit-crystal'); });
    } else if (ph === 4) { // (see drawMorph: the sign redrawn, the fall, the chrysalis, the splitting, the unfolding)
      e.w5sign = 'mantis'; e.w5signK = seg01(u, .02, .2);
      once(.04, () => { sfx('hit-crystal'); big('A SIGN NO ZODIAC HAS', e.x, e.y, 236, '#DDE6FF', 15); });
      once(.34, () => { sfx('slam'); shakeMag = Math.max(shakeMag, 6); silverBurst(e.x, e.y, 4, 18); }); // the stars hit the floor
      once(.46, () => { sfx('charge', 2); });
      once(.58, () => { sfx('crunch', .5); shakeMag = Math.max(shakeMag, 3); });
      once(.66, () => { sfx('crunch'); flashT = Math.max(flashT, .14); shakeMag = Math.max(shakeMag, 10); // the chrysalis splits
        for (let i = 0; i < 30; i++) parts.push({ x: e.x + rand(-30, 30), y: e.y + rand(-8, 8), z: rand(10, 100), vx: rand(-160, 160), vy: 0, vz: rand(100, 280), life: 1.1, max: 1.1, col: pick(['#B6C2D8', '#6E7A98', '#E6ECF6', '#FFFFFF']), size: rand(2, 5), shape: 'shard', rot: rand(0, 6), vr: rand(-8, 8) }); });
      once(.84, () => { sfx('roar'); sfx('whoosh'); shakeMag = Math.max(shakeMag, 8); }); // and it opens its wings
    }
    if (u >= 1) finishMorph(e);
  }
  W5B.morph = (ph) => { if (boss && isBen(boss)) { boss.hp = Math.min(boss.hp, ENDS[ph] * boss.maxHp + 1); startMorph(boss, ph); } };

  // he can't be hurt while he changes, and no blow carries him past the end of a shape: each one is fought in full
  const _hurt = hurtEnemy;
  hurtEnemy = function (e, dmg, dir, m, crit) {
    if (isBen(e) && !e.dead) {
      if (e.state === 'w5morph' || (e.w5lz || 0) > 60) return; // (nor while the Mantis is high in its leap)
      const ph = shapeOf(e); if (ph < 4) { const floor = ENDS[ph + 1] * e.maxHp - 1; dmg = Math.max(1, Math.min(dmg, Math.ceil(e.hp - floor)));
        const r = _hurt(e, dmg, dir, m, crit); if (!e.dead && e.hp <= floor + 1) startMorph(e, ph + 1); return r; } // the blow that ends a shape starts the next
    }
    return _hurt(e, dmg, dir, m, crit);
  };
  const _strike = strike;
  strike = function (e, ...a) { if (isBen(e) && e.state === 'w5morph') return; return _strike(e, ...a); };

  // ---------------- the shape each frame, and his death ----------------
  const _upd = updateEnemy;
  updateEnemy = function (e, dt) {
    if (!isBen(e)) return _upd(e, dt);
    if (!e.bph) { e.bph = 1; e.w5gait = 0; }
    if (e.dead) { deathStep(e, dt); return; }
    if (stillT > 0) return _upd(e, dt);
    if (e.state === 'w5morph') { morphStep(e, dt); return; }
    const ph = e.bph, want = e.hp <= ENDS[4] * e.maxHp ? 4 : e.hp <= ENDS[3] * e.maxHp ? 3 : e.hp <= ENDS[2] * e.maxHp ? 2 : 1;
    if (want > ph && e.state !== 'w5act' && e.state !== 'enter') { startMorph(e, ph + 1); return; }
    if (e.state !== 'w5act') e.w5lz = 0;
    const x0 = e.x;
    _upd(e, dt);
    if (ph >= 2) e.w5gait = (e.w5gait || 0) + Math.abs(e.x - x0) * .09; // feet and fingers step with the ground covered
    if (e.state === 'wind' && WIND_UP[e.plan]) WIND_UP[e.plan](e, 1 - e.t / e.windMax);
    if (e.state === 'recover' && e.w5was !== 'recover' && ph >= 2) e.cd = Math.max(e.cd, [0, 0, 2.1, 2.3, 2.3][ph]); // after each of his big attacks, a breath: your opening
    e.w5was = e.state;
    if (ph === 3 && e.w5signK > 0 && !(e.state === 'w5act' && e.w5a === 'zodiac') && !(e.state === 'wind' && e.plan === 'w5zodiac')) e.w5signK = Math.max(0, e.w5signK - dt * 1.6); // back into the swordsman
  };
  function deathStep(e, dt) {
    if (!e.w5die) { e.w5die = .001; e.state = 'dying'; e.t = 99; e.air = true; e.spin = 0; e.rotA = 0; e.vz = 0; e.z = 0; e.vx = 0; clearT = Math.max(clearT, 5.2); hazards = hazards.filter(h => !KINDS.has(h.kind) && !(h.kind === 'w5ctl' && h.e === e)); projs = projs.filter(p => p.owner !== 'e');
      save.silverArm = true; if (typeof persist === 'function') persist(); } // the arm is his to keep whatever comes after
    e.w5die += dt; e.flash = 0; e.state = 'dying'; e.t = 99; e.z = 0; e.vz = 0; e.vx = 0; e.air = true; e.death = 'pop'; e.rotA = 0; e.spin = 0; // (held upright: the drawing does the dying)
    const u = e.w5die / 3;
    if (u > .25 && !e.d1) { e.d1 = 1; sfx('crunch'); shakeMag = 10; for (let i = 0; i < 24; i++) parts.push({ x: e.x + rand(-50, 50), y: e.y + rand(-8, 8), z: rand(30, 110), vx: rand(-160, 160), vy: 0, vz: rand(60, 260), life: 1.2, max: 1.2, col: pick(['#FFFFFF', '#E6ECF6', '#B6C2D8']), size: rand(2, 4), shape: 'shard', rot: rand(0, 6), vr: rand(-10, 10) }); }
    if (u > .42 && u < .74 && Math.random() < dt * 40) { const ex = lerp(-150, 60, seg01(u, .42, .74)) * (e.size || 1); // the Mantis flaking away to silver leaf, from the tail forward
      parts.push({ x: e.x + e.facing * ex + rand(-6, 6), y: e.y + rand(-6, 6), z: rand(20, 150), vx: rand(-30, 30) - e.facing * 20, vy: 0, vz: rand(30, 110), life: 1.3, max: 1.3, col: pick(['#E6ECF6', '#B9C3D4', '#FFFFFF', '#D8D0B0']), size: rand(2, 4.5), shape: 'shard', rot: rand(0, 6), vr: rand(-6, 6) }); }
    if (u > .5 && !e.d4) { e.d4 = 1; sfx('slice'); } // the silver scythe comes away
    if (u > .72 && !e.d2) { e.d2 = 1; sfx('hit-crystal'); flashT = .15; e.w5armDrop = { x: e.x + e.facing * MDROP * (e.size || 1), y: e.y + 2 }; }
    if (u > .72 && !e.d3 && u > .95) { e.d3 = 1; e.remove = true; banner('The Silver Arm', 'IT IS YOURS NOW · FIGHT BARE-HANDED TO WIELD IT', 3); }
  }

  // ======================================================================================================
  // DRAWING
  // ======================================================================================================
  const prev = CREATURES.w5benedict;
  CREATURES.w5benedict = function (e, a) {
    a = a || {}; const t = a.t || 0;
    if (e.dead && (e.bph || 1) >= 4) { drawMantisDeath(e, a, t); return; }
    if (e.state === 'w5morph') { drawMorph(e, a, t); return; }
    const ph = e.bph || 1;
    if (ph === 1 || e.dead) { prev(e, a); return; }
    if (ph === 2) drawHost(e, a, t, 1);
    else if (ph === 3) drawStars(e, a, t, 1);
    else drawMantis(e, a, t, mantisPose(e, a, t));
  };
  // ---------------- the ghost soldiers: every army he led, out of every age ----------------
  // era: 0 a hoplite (crested Corinthian helm, round shield), 1 a legionary (galea, curved scutum), 2 a Norman (nasal helm,
  // kite shield), 3 a crusader (great helm, heater shield), 4 a landsknecht (morion, pike), 5 a grenadier (mitre cap, musket)
  const GH = { body: '#9AAAD0', bodyDk: '#5A6A98', bodyLt: '#DCE4F6', steel: '#C8D0DE', steelDk: '#6A748E', shield: '#34446E', shieldDk: '#161E3C', shieldLt: '#6A7EB0', crest: '#E8EEF8' };
  function soldier(s, dir, era, t, o = {}) { // feet at 0,0, facing +x when dir > 0; o.step (gait phase), o.raise (spear up 0..1), o.level (pike level 0..1), o.look (head up), o.a (alpha)
    ctx.save(); ctx.scale(s * dir, s); if (o.a !== undefined) ctx.globalAlpha *= o.a;
    const st = o.step || 0, l1 = Math.sin(st) * 4, l2 = -l1, bob = Math.abs(Math.cos(st)) * 1.2, H = -30 + bob;
    // legs: two short strokes in greaves, going to mist at the feet
    for (const [lx, d, far] of [[-2, l2, 1], [2, l1, 0]]) { const col = far ? GH.bodyDk : GH.body; seg(lx, H + 4, lx + d * .6, -12, 5.4, 4.4, col, .8); seg(lx + d * .6, -12, lx + d, -2, 4.4, 3.4, col, .7); }
    mistTongue(0, -1, -6, 12, 0, t, era);
    // the spear or pike behind
    const sa = o.level ? lerp(-1.45, -.12, o.level) : lerp(-1.25, -1.5, o.raise || 0), sl = era === 4 ? 64 : era === 5 ? 34 : 50;
    ctx.save(); ctx.translate(-3, H - 6); ctx.rotate(sa); ctx.strokeStyle = C('#3A4466'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(sl, 0); ctx.stroke();
    if (era === 5) { ctx.fillStyle = C(GH.steelDk); ctx.fillRect(sl - 14, -1.6, 14, 3.2); } // a musket's barrel, a bayonet
    ctx.fillStyle = C(GH.steel); ctx.beginPath(); ctx.moveTo(sl - 2, -2.4); ctx.lineTo(sl + 9, 0); ctx.lineTo(sl - 2, 2.4); ctx.closePath(); ctx.fill(); outline(.7); ctx.restore();
    // the body: a pale shape under a tabard
    cel(PB([-7, H - 18, 0, H - 21, 7, H - 18, 8, H - 6, 6, H + 4, -6, H + 4, -8, H - 6]), GH.body, { d: 2, r: .8, w: 1.2, dark: GH.bodyDk, lite: GH.bodyLt });
    // the head and helm
    const hy = H - 26 - (o.look || 0) * 1.5;
    ctx.save(); ctx.translate(1, hy); ctx.rotate(-(o.look || 0) * .35);
    cel(PE(0, 0, 5.4, 5.8), GH.body, { d: 1.2, r: .5, w: 1, dark: GH.bodyDk, lite: GH.bodyLt });
    const helm = (pts, col = GH.steel) => cel(PB(pts), col, { d: 1.4, r: .6, w: 1.1, dark: GH.steelDk, lite: '#FFFFFF' });
    if (era === 0) { helm([-6, 2, -6, -5, 0, -8, 6, -5, 7, 1, 4, 3, 3, -1, 1, 4, -2, 4]); ctx.fillStyle = C(GH.crest); ctx.beginPath(); ctx.moveTo(-9, -4); ctx.quadraticCurveTo(-2, -16, 8, -7); ctx.quadraticCurveTo(0, -10, -9, -4); ctx.fill(); outline(.8); }
    else if (era === 1) { helm([-6, 1, -5, -5, 1, -7, 6, -4, 6, 0, 3, 1, -2, 4]); ctx.fillStyle = C(GH.crest); ctx.beginPath(); ctx.moveTo(-5, -6); ctx.quadraticCurveTo(0, -14, 6, -6); ctx.lineTo(3, -6); ctx.quadraticCurveTo(0, -10, -2, -6); ctx.closePath(); ctx.fill(); outline(.8); ctx.fillStyle = C(GH.steelDk); ctx.fillRect(4, -1, 2.4, 5); }
    else if (era === 2) { helm([-5, 1, -4, -5, 1, -11, 5, -5, 6, 1]); ctx.fillStyle = C(GH.steelDk); ctx.fillRect(4.4, -1, 1.6, 6); }
    else if (era === 3) { helm([-6, 5, -6, -6, 0, -8, 6, -6, 7, 5]); ctx.fillStyle = C('#141A30'); ctx.fillRect(1, -2, 6, 1.4); if (DET()) { ctx.fillStyle = 'rgba(230,238,255,.9)'; ctx.fillRect(3, -1.8, 2.4, 1); } ctx.strokeStyle = C(GH.steelDk); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(4, 5); ctx.stroke(); }
    else if (era === 4) { helm([-9, -1, -5, -4, -2, -10, 3, -10, 6, -4, 10, -1, 6, -2, -5, -2]); }
    else { helm([-5, 0, -4, -6, -1, -14, 4, -7, 6, 0], GH.shield); ctx.fillStyle = C(GH.steel); ctx.fillRect(-4, -1.2, 9, 1.8); }
    if (era !== 3 && !FLASH) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(3.6, -.6, 1.8, 1); glowAt(4.4, -.2, 4, '230,238,255', .5); } // eyes of moonlight
    ctx.restore();
    // the shield before him
    const sx = 5, sy = H - 8;
    if (era === 0) { cel(PE(sx, sy, 8, 9.5), GH.shield, { d: 2, r: .8, w: 1.2, dark: GH.shieldDk, lite: GH.shieldLt }); if (DET()) { ctx.strokeStyle = C(GH.steel); ctx.lineWidth = 1; ell(sx, sy, 6.4, 7.8); ctx.stroke(); ctx.fillStyle = C(GH.steel); ell(sx, sy, 1.8, 2); ctx.fill(); } }
    else if (era === 1) { cel(PB([sx - 4, sy - 12, sx + 5, sy - 13, sx + 6, sy + 10, sx - 3, sy + 11]), GH.shield, { d: 2, r: .8, w: 1.2, dark: GH.shieldDk, lite: GH.shieldLt }); if (DET()) { ctx.fillStyle = C(GH.steel); ell(sx + 1, sy, 2, 2.2); ctx.fill(); ctx.strokeStyle = 'rgba(214,222,236,.7)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(sx + 1, sy - 11); ctx.lineTo(sx + 1, sy + 10); ctx.stroke(); } }
    else if (era === 2 || era === 3) { const top = era === 2 ? 11 : 9; cel(PP([sx - 5, sy - top, sx + 6, sy - top, sx + 6, sy - 2, sx + .5, sy + (era === 2 ? 14 : 9), sx - 5, sy - 2]), GH.shield, { d: 2, r: .8, w: 1.2, dark: GH.shieldDk, lite: GH.shieldLt });
      if (DET()) { ctx.strokeStyle = C(GH.steel); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(sx + .5, sy - top + 2); ctx.lineTo(sx + .5, sy + 3); ctx.moveTo(sx - 3, sy - 4); ctx.lineTo(sx + 4, sy - 4); ctx.stroke(); } } // a silver cross on it
    else if (era === 4) { cel(PE(sx + 1, sy - 2, 3.4, 3.6), GH.steel, { d: 1, r: .5, w: 1, dark: GH.steelDk }); } // a buckler
    else { ctx.fillStyle = C(GH.crest); ctx.fillRect(sx - 6, sy - 6, 2, 12); ctx.fillRect(sx - 1, sy - 6, 2, 12); } // crossed white belts
    ctx.restore();
  }
  // the banner of the Host: his sword grown into the head of a pole, his cloak hung from it, and his face woven in it
  function standard(x, y, h, t, o = {}) {
    const top = y - h, wv = o.wave ?? 1, tilt = o.tilt || 0;
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.translate(-x, -y);
    ctx.strokeStyle = C('#2A3048'); ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, top); ctx.stroke(); // the pole
    ctx.strokeStyle = C('#8A96B4'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + .8, y - 4); ctx.lineTo(x + .8, top + 2); ctx.stroke();
    ctx.save(); ctx.translate(x, top + 4); ctx.rotate(-Math.PI / 2); benSword(30, o.glint || 0); ctx.restore(); // his sword is the head of it
    const cw = 48, ch = 58, bx = x + 2, by = top + 10;
    ctx.strokeStyle = C('#2A3048'); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x - 4, by); ctx.lineTo(bx + cw + 3, by); ctx.stroke(); // the crossbar
    const W = (u, v) => Math.sin(t * 2.4 - u * 3.2 + v) * 3.5 * u * wv;
    const pts = []; for (let i = 0; i <= 6; i++) { const u = i / 6; pts.push(bx + u * cw, by + W(u, 0)); }
    pts.push(bx + cw + W(1, 1) * .4, by + ch + W(1, 2), bx + cw * .78, by + ch * .78 + W(.78, 2), bx + cw * .55, by + ch + W(.55, 2), bx + cw * .3, by + ch * .86 + W(.3, 2), bx, by + ch);
    cel(PP(pts), BN.coat, { d: 3, r: 1.2, w: 1.6, dark: BN.coatDk, lite: BN.coatLt, tex: () => {
      ctx.strokeStyle = 'rgba(8,12,34,.45)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 1; i < 4; i++) { const u = i / 4; ctx.moveTo(bx + u * cw, by + W(u, 0)); ctx.quadraticCurveTo(bx + u * cw + W(u, 1), by + ch * .5, bx + u * cw + W(u, 2) * .6, by + ch * .8); } ctx.stroke(); } });
    // his face in the weave: the brow, the long nose, and eyes of white light
    const fx = bx + cw * .48, fy = by + ch * .36 + W(.48, 1);
    leafLine(() => { ctx.moveTo(bx + 3, by + 3); ctx.lineTo(bx + cw - 3, by + 3 + W(.9, 0)); }, .9, .8);
    ctx.strokeStyle = C('#B6C2D8'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(fx - 9, fy - 4); ctx.quadraticCurveTo(fx, fy - 7, fx + 9, fy - 4); ctx.moveTo(fx, fy - 5); ctx.lineTo(fx + 1.5, fy + 7); ctx.lineTo(fx - 1.5, fy + 8); ctx.moveTo(fx - 5, fy + 13); ctx.lineTo(fx + 5, fy + 13); ctx.stroke();
    if (!FLASH) { ctx.fillStyle = '#FFFFFF'; ell(fx - 5, fy - 1.5, 2.6, 1.1); ctx.fill(); ell(fx + 5, fy - 1.5, 2.6, 1.1); ctx.fill(); }
    glowAt(fx - 5, fy - 1.5, 9, '230,238,255', .5 + (o.glint || 0) * .4); glowAt(fx + 5, fy - 1.5, 9, '230,238,255', .5 + (o.glint || 0) * .4);
    ctx.restore();
  }
  // the Host itself: soldiers packed shield to shield round the banner, stepping as one
  const HOST = [[-30, -6, 0, .9], [-14, -9, 3, .92], [4, -10, 1, .94], [22, -8, 5, .92], [36, -5, 2, .9], [-24, 2, 4, 1], [-6, 1, 0, 1.02], [12, 3, 3, 1.02], [30, 4, 1, 1]];
  function drawHost(e, a, t, k, o = {}) {
    const st = e.state, plan = e.plan, w = a.wind || 0, actA = st === 'w5act' ? e.w5a : null, step = (e.w5gait || 0);
    const raise = (st === 'wind' && (plan === 'w5standard' || plan === 'w5shieldwall')) ? w : actA === 'standard' ? 1 : 0;
    const look = Math.max(o.look || 0, st === 'wind' && (plan === 'w5volley' || plan === 'w5cavalry') ? w : actA === 'volley' || actA === 'cavalry' ? 1 : 0);
    const level = st === 'wind' && plan === 'w5phalanx' ? w : actA === 'phalanx' ? 1 : 0;
    const hurt = a.hurt ? 1 : 0, kneel = o.rise !== undefined ? 1 - o.rise : 0;
    // the standard rises out of the middle of them (tipped forward and slammed down in the banner attack)
    let tilt = 0;
    if (st === 'wind' && plan === 'w5standard') tilt = -.35 * w; // reared back
    if (actA === 'standard') tilt = lerp(-.35, 1.25, sm(cl01((e.w5k || 0) * 3))); // and brought down
    const pole = o.pole ?? 1;
    if (pole > 0) { ctx.save(); ctx.globalAlpha *= cl01(pole * 1.5); standard(0, -14 + hurt * 3, 22 + 128 * pole, t, { tilt, glint: look, wave: 1 }); ctx.restore(); }
    // the back rank, then the front: each soldier a little out of step with the next
    for (let i = 0; i < HOST.length; i++) { const [x, y, era, s] = HOST[i], rise = o.rise !== undefined ? cl01(o.rise * 1.6 - hsh(i) * .6) : 1; if (rise <= 0) continue;
      ctx.save(); ctx.translate(x + (hurt ? Math.sin(i * 7) * 2 : 0), y + (1 - rise) * 46);
      if (rise < 1) { ctx.beginPath(); ctx.rect(-60, -200, 120, 200 - y - (1 - rise) * 46 + 1); ctx.clip(); } // climbing up out of the floor
      soldier(s, 1, era, t, { step: step + i * 1.7, raise: raise * (i % 2 ? 1 : .6), level: level * (i < 5 ? .5 : 1), look: look * (i % 3 ? 1 : .6) + kneel * 0 });
      ctx.restore(); }
    if (DET()) add(() => { const g = ctx.createRadialGradient(0, -30, 4, 0, -30, 70); g.addColorStop(0, 'rgba(200,214,245,.18)'); g.addColorStop(1, 'rgba(200,214,245,0)'); ctx.fillStyle = g; ctx.fillRect(-70, -100, 140, 100); });
  }
  // ---------------- the Swordsman in the Stars: a giant drawn in stars and silver leaf ----------------
  // Every figure he can take has sixteen stars, so one can be redrawn into another (index 9 is always his heart)
  const FIG = {
    sword: { p: [[4, -198], [0, -180], [-15, -172], [15, -170], [-26, -146], [-20, -120], [32, -150], [46, -132], [116, -176], [0, -148], [-10, -104], [10, -102], [-16, -54], [-26, 0], [20, -52], [32, 0]],
      l: [[0, 1], [1, 2], [1, 3], [2, 4], [4, 5], [3, 6], [6, 7], [7, 8], [2, 9], [3, 9], [9, 10], [9, 11], [10, 11], [10, 12], [12, 13], [11, 14], [14, 15]], big: [0, 2, 3, 8, 13, 15] },
    scorpion: { name: 'THE SCORPION', p: [[104, -36], [80, -30], [108, -66], [82, -62], [60, -46], [38, -44], [16, -46], [-6, -52], [-28, -62], [26, -50], [-46, -84], [-56, -114], [-46, -146], [-20, -166], [10, -168], [32, -148]],
      l: [[0, 1], [1, 4], [2, 3], [3, 4], [4, 5], [5, 9], [9, 6], [6, 7], [7, 8], [8, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15]], big: [0, 2, 12, 15] },
    archer: { name: 'THE ARCHER', p: [[0, -150], [-2, -134], [-14, -128], [12, -126], [-22, -128], [-30, -116], [54, -126], [46, -178], [46, -74], [0, -108], [92, -127], [-4, -70], [26, -40], [30, 0], [-20, -2], [-46, -2]],
      l: [[0, 1], [1, 2], [1, 3], [2, 5], [5, 4], [3, 6], [7, 6], [6, 8], [7, 4], [4, 8], [4, 10], [1, 9], [9, 11], [11, 12], [12, 13], [11, 14], [14, 15]], big: [7, 8, 10, 0] },
    hunter: { name: 'THE HUNTER', p: [[2, -196], [-18, -170], [18, -172], [-34, -196], [-26, -222], [-8, -240], [52, -196], [60, -170], [54, -144], [0, -140], [-12, -112], [0, -110], [12, -108], [-24, -2], [26, 0], [2, -80]],
      l: [[0, 1], [0, 2], [1, 3], [3, 4], [4, 5], [2, 7], [6, 7], [7, 8], [1, 9], [2, 9], [9, 10], [10, 11], [11, 12], [10, 13], [12, 14], [11, 15]], big: [1, 2, 10, 11, 12, 14, 13] },
    // the sign he draws last, which is in no zodiac: the Mantis (it is only ever drawn as he changes into it)
    mantis: { name: 'THE MANTIS', p: [[44, -178], [26, -150], [62, -152], [72, -138], [46, -118], [56, -108], [-6, -96], [-54, -94], [-118, -100], [12, -124], [24, -104], [-34, -114], [42, -2], [-74, -2], [-14, -216], [-124, -130]],
      l: [[0, 1], [1, 9], [9, 6], [9, 3], [3, 5], [9, 2], [2, 4], [6, 7], [7, 8], [6, 15], [15, 8], [6, 10], [10, 12], [6, 11], [11, 13], [0, 14]], big: [0, 3, 8, 12, 13] },
  };
  const SIGNS = ['scorpion', 'archer', 'hunter'];
  function figPoints(e, a, t) { // the swordsman's stars, posed for what he is doing, blended toward the sign he is becoming
    const st = e.state, w = a.wind || 0, plan = e.plan, actA = st === 'w5act' ? e.w5a : null, g = e.w5gait || 0, S = FIG.sword.p;
    const P2 = S.map(([x, y], i) => [x + Math.sin(t * .7 + i * 1.3) * 1.2, y + Math.cos(t * .6 + i * 2.1) * 1.2]);
    const step = Math.sin(g), lift = Math.max(0, Math.cos(g)) * 6, lift2 = Math.max(0, -Math.cos(g)) * 6;
    P2[13][0] += step * 10; P2[13][1] -= lift2; P2[12][0] += step * 5; P2[15][0] -= step * 10; P2[15][1] -= lift; P2[14][0] -= step * 5;
    const up = (st === 'wind' && (plan === 'w5web' || plan === 'w5meteor' || plan === 'w5nova')) ? w : (actA === 'web' || actA === 'meteor' || actA === 'nova') ? 1 : 0;
    if (up) { const q = sm(up); P2[7] = [lerp(P2[7][0], 22, q), lerp(P2[7][1], -214, q)]; P2[6] = [lerp(P2[6][0], 30, q), lerp(P2[6][1], -192, q)]; P2[8] = [lerp(P2[8][0], 20, q), lerp(P2[8][1], -290, q)]; P2[5] = [lerp(P2[5][0], -36, q), lerp(P2[5][1], -206, q)]; P2[4] = [lerp(P2[4][0], -34, q), lerp(P2[4][1], -180, q)]; }
    if (a.hurt) for (const p of P2) { p[0] -= 3; p[1] += 2; }
    let lines = FIG.sword.l, big = FIG.sword.big, from = null;
    const k = sm(cl01(e.w5signK || 0)), F = e.w5sign && FIG[e.w5sign];
    if (F && k > 0) { const strike = e.w5strike || 0; from = lines;
      for (let i = 0; i < 16; i++) { let [x, y] = F.p[i]; x += Math.sin(t * .8 + i) * 1.4; y += Math.cos(t * .7 + i * 1.7) * 1.4;
        if (e.w5sign === 'scorpion' && i >= 13) { x += strike * (i - 12) * 12; y += strike * (i - 12) * 16; } // the tail lashing down
        if (e.w5sign === 'archer' && (i === 4 || i === 5)) x -= (e.w5draw || 0) * 10; // the string drawn back
        if (e.w5sign === 'hunter' && i >= 10 && i <= 12 && e.w5beltOut) { x = F.p[9][0]; y = F.p[9][1]; } // the belt stars are out, flying (drawn where they are by the hazard)
        P2[i] = [lerp(P2[i][0], x, k), lerp(P2[i][1], y, k)]; }
      lines = F.l; big = F.big; }
    return { pts: P2, lines, big, k, from };
  }
  function star4(x, y, r, a = 1) { // a gilded star: a four-pointed burst of silver with a white heart
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y);
    ctx.beginPath(); for (let i = 0; i < 8; i++) { const an = i / 8 * TAU - Math.PI / 2, rr = i % 2 ? r * .34 : r; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.closePath();
    ctx.fillStyle = C('#E6ECF6'); ctx.fill(); outline(.7);
    if (DET()) { ctx.fillStyle = '#FFFFFF'; circle(0, 0, r * .3); ctx.fill(); }
    ctx.restore();
  }
  function drawStars(e, a, t, k, o = {}) {
    const F = figPoints(e, a, t), pts = F.pts, rev = o.reveal ?? 1, n = pts.length;
    if (o.collapse) { const c = sm(o.collapse), h = pts[9]; for (const p of pts) { p[0] = lerp(p[0], h[0], c); p[1] = lerp(p[1], h[1], c); } } // falling into his heart
    const shown = (i) => cl01(rev * (n + 4) - i * 1 - (i === 9 ? -3 : 0)); // stars come in one by one (the heart first)
    // the dark of the sky inside him, and a cold breath of nebula
    onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k * cl01(rev * 1.4);
      for (let i = 0; i < 5; i++) { const p = pts[[9, 1, 10, 12, 14][i]], g = ctx.createRadialGradient(p[0], p[1], 2, p[0], p[1], 46); g.addColorStop(0, 'rgba(120,140,220,.12)'); g.addColorStop(1, 'rgba(120,140,220,0)'); ctx.fillStyle = g; ctx.fillRect(p[0] - 46, p[1] - 46, 92, 92); }
      ctx.restore(); });
    // the lines, in silver leaf: each drawn in once both of its stars are there
    const lineA = (L, a0) => { for (const [i, j] of L) { const s = Math.min(shown(i), shown(j)); if (s <= 0) continue; const [x0, y0] = pts[i], [x1, y1] = pts[j], q = cl01(s * 1.4);
      leafLine(() => { ctx.moveTo(x0, y0); ctx.lineTo(lerp(x0, x1, q), lerp(y0, y1, q)); }, 1.7, a0 * .9); } };
    if (F.from && F.k < 1) lineA(F.from, 1 - F.k);
    lineA(F.lines, F.from ? F.k : 1);
    onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(200,215,255,${.3 * k})`; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath();
      for (const [i, j] of F.lines) { if (Math.min(shown(i), shown(j)) < 1) continue; ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[j][0], pts[j][1]); } ctx.stroke(); ctx.restore(); });
    // the stars
    for (let i = 0; i < n; i++) { const s = shown(i); if (s <= 0) continue; const bigS = F.big.includes(i), r = (i === 9 ? 9 : bigS ? 6.6 : 4.4) * (.6 + .4 * s) * (i === 9 ? 1 + .12 * Math.sin(t * 3) : 1);
      star4(pts[i][0], pts[i][1], r, s);
      glowAt(pts[i][0], pts[i][1], r * 3.4, '230,238,255', (i === 9 ? .75 : .45) * s); }
    onMain(() => { const h = pts[9]; glowM(h[0], h[1], 34, '200,215,255', .35 * k * shown(9)); });
    W5B.heart = { x: e.x + pts[9][0] * e.facing * (e.size || 1), y: e.y, z: -pts[9][1] * (e.size || 1) }; // (for the attacks that come out of his heart)
  }
  // ---------------- the Silver Hand's rig (kept for the silver arm: W5B.rig, silverarm.js) ----------------
  // A rig in the palm's own frame: +x runs from the wrist to the knuckles, the fingers from index (-y) to little finger
  // (+y). Seen from the back. Each finger has three segments; f is how far it is opened (0 a fist's stub, 1 straight).
  const HL = { fl: [46, 52, 48, 38], fy: [-21, -7, 7, 21], kx: 26, wx: -30, th: 34 };
  const SHAPES_H = { // [spread angle, opened] for index, middle, ring, little finger; then the thumb [angle, opened]
    paper: { f: [[-.26, 1], [-.08, 1], [.1, 1], [.3, 1]], th: [-1.15, 1] },
    rock: { f: [[-.05, 0], [0, 0], [.03, 0], [.07, 0]], th: [-.2, .55] },
    scissors: { f: [[-.36, 1], [.06, 1], [.05, 0], [.08, 0]], th: [-.3, .6] },
    snap: { f: [[-.2, .7], [-.05, .25], [.1, .45], [.25, .5]], th: [-.6, .5] },
    flick: { f: [[-.2, .55], [-.02, .15], [.12, .5], [.28, .5]], th: [-.5, .45] },
    claw: { f: [[-.32, .55], [-.1, .5], [.12, .5], [.34, .55]], th: [-1.1, .6] },
  };
  function fingerChain(b, g, L, f) { // the joints of one finger from its knuckle b along angles g, lengths cut down as it closes
    const s = [.46, .31, .23], fs = [lerp(.42, 1, f), f, f], pts = [b]; let p = b;
    for (let i = 0; i < 3; i++) { const l = L * s[i] * fs[i]; if (l < .5) break; p = [p[0] + Math.cos(g[i]) * l, p[1] + Math.sin(g[i]) * l]; pts.push(p); }
    return pts;
  }
  function ik2(b, T, L1, L2, side) { // two segments from b reaching for T, the joint thrown to one side
    const dx = T[0] - b[0], dy = T[1] - b[1], d = Math.min(Math.hypot(dx, dy) || 1e-3, L1 + L2 - .01), A = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)), b0 = Math.atan2(dy, dx);
    const g1 = b0 + side * A, J = [b[0] + Math.cos(g1) * L1, b[1] + Math.sin(g1) * L1]; return [g1, Math.atan2(T[1] - J[1], T[0] - J[0])];
  }
  // (the Hand's own walking pose went with it; the rig below is drawn for the silver arm through W5B.rig)
  function drawHand(e, a, t, H, o = {}) {
    const S = SHAPES_H[H.shape] || SHAPES_H.paper, up = H.up, s = (o.s ?? 1);
    ctx.save(); ctx.scale(s, s); if (o.a !== undefined) ctx.globalAlpha *= o.a;
    // the palm: down over the fingers when it walks, up on its wrist when it shows a shape
    const lift = H.lift || 0, sag = H.sag ? 8 : 0, flat = H.flatOut ? 1 : (H.flat || 0);
    let px = lerp(0, -6, up), py = lerp(-72 - lift + sag + flat * 40, -128, up), rot = lerp(Math.PI / 2 + (H.rock || 0) - flat * .9, -Math.PI / 2 + Math.sin(t * 1.6) * .04, up);
    if (H.fix !== undefined) { rot = H.fix; px = Math.cos(rot) * 32; py = Math.sin(rot) * 32; } // (a hand held at the wrist: the silver arm's wearer)
    const pump = (H.pump || 0) * 16;
    const L = HL.fl;
    // the angles of each finger in the palm's frame
    const fingers = [];
    for (let i = 0; i < 4; i++) {
      const b = [HL.kx, HL.fy[i]];
      // walking: reach for the planted tip (a two-segment reach, the middle joint arched outward)
      const T0 = H.tips[i], tx = T0[0] - px, ty = T0[1] - (py + pump * (1 - up)), c = Math.cos(-rot), sn = Math.sin(-rot), Tp = [tx * c - ty * sn, tx * sn + ty * c];
      const L1 = L[i] * .46, L2 = L[i] * .54, side = i < 2 ? -1 : 1, [w1, w2] = ik2(b, Tp, L1, L2, side);
      const walkG = [w1, w2 - side * .12, w2 + side * .22], [sa, sf] = S.f[i], fG = [sa, sa + (1 - sf) * .2, sa + (1 - sf) * .4];
      const q = sm(H.fq ?? up), f = lerp(1, sf, q);
      fingers.push({ b, g: walkG.map((v, j) => lerp(v, fG[j], q)), f, L: L[i] });
    }
    const thG = lerp(-.9, S.th[0], sm(H.fq ?? up)), thF = lerp(.8, S.th[1], sm(H.fq ?? up));
    ctx.save(); ctx.translate(px, py + pump); ctx.rotate(rot);
    // behind the palm: the fingers (from the far little finger to the index), and the stump of the arm going into mist
    const finger = (fg, far) => { const pts = fingerChain(fg.b, fg.g, fg.L, fg.f), W = [9.6, 8.4, 7.2, 5.6];
      for (let j = 0; j < pts.length - 1; j++) segPlate(pts[j], pts[j + 1], W[j], W[j + 1], far);
      for (let j = 1; j < pts.length - 1; j++) knuckle(pts[j][0], pts[j][1], W[j] * .42);
      const tip = pts[pts.length - 1]; if (fg.f > .35 && pts.length > 3) { const d = fg.g[2]; ctx.save(); ctx.translate(tip[0], tip[1]); ctx.rotate(d); ctx.fillStyle = C(BN.gilt); ell(-1.6, 0, 3, 2.6); ctx.fill(); outline(.8); ctx.restore(); } // a gilt nail
      else if (fg.f <= .35) { ctx.fillStyle = C(BN.silver); circle(tip[0], tip[1], 5); ctx.fill(); outline(1); if (DET()) { ctx.fillStyle = 'rgba(255,255,255,.8)'; circle(tip[0] - 1.4, tip[1] - 1.6, 1.4); ctx.fill(); } } // the bunched knuckle of a fist
      return tip; };
    const tips = [];
    for (const i of [3, 2]) tips[i] = finger(fingers[i], true);
    // the arm it ends in: a gilt cuff, then plates thinning into mist
    if (!H.noStump) { const x0 = HL.wx - 2; for (let i = 0; i < 4; i++) { const x = x0 - 8 - i * 12; ctx.save(); ctx.globalAlpha *= 1 - i * .22; ctx.fillStyle = C(i % 2 ? shade(BN.silver, -.1) : BN.silver); rrect(x - 6, -17 + i * 1.2, 12, 34 - i * 2.4, 3); ctx.fill(); outline(1); ctx.restore(); }
      for (let i = 0; i < 5; i++) mistTongue(x0 - 52, -12 + i * 6, -26 - (i % 2) * 10, 7, (i - 2) * 3, t, i, 'rgba(210,225,255,.5)');
      ctx.fillStyle = C(BN.gilt); rrect(x0 - 4, -24, 7, 48, 3); ctx.fill(); outline(1.1); }
    // the palm plate
    const palm = PB([HL.wx, -21, -6, -26, HL.kx - 2, -30, HL.kx + 4, -12, HL.kx + 4, 12, HL.kx - 2, 30, -6, 27, HL.wx, 21]);
    cel(palm, BN.silver, { d: 3.4, r: 1.4, w: 1.8, dark: BN.silverDk, lite: BN.silverLt, tex: () => {
      ctx.strokeStyle = 'rgba(60,70,100,.55)'; ctx.lineWidth = .8; ctx.beginPath(); for (const x of [-14, 2, 16]) { ctx.moveTo(x, -28); ctx.quadraticCurveTo(x + 3, 0, x, 28); } ctx.stroke(); // the lames
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = .6; ctx.beginPath(); for (const x of [-13, 3, 17]) { ctx.moveTo(x, -26); ctx.quadraticCurveTo(x + 3, 0, x, 26); } ctx.stroke();
      if (H.crack) { ctx.strokeStyle = `rgba(255,255,255,${.9 * H.crack})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-20, -10); ctx.lineTo(-6, -2); ctx.lineTo(4, -14); ctx.lineTo(18, -6); ctx.moveTo(-6, -2); ctx.lineTo(0, 16); ctx.lineTo(12, 22); ctx.stroke(); }
    } });
    // on its back, the ghost of the Pattern, tooled in silver-gilt round a boss with an eye of moonlight in it
    leafLine(() => { for (let r = 4; r < 17; r += 4.2) { ctx.moveTo(-2 + r, 0); ctx.arc(-2, 0, r, 0, TAU * .82); } }, .8, .75);
    ctx.fillStyle = C(BN.gilt); circle(-2, 0, 4.2); ctx.fill(); outline(1); if (!FLASH) { ctx.fillStyle = '#FFFFFF'; ell(-2, 0, 2.6, 1.1); ctx.fill(); }
    glowAt(-2, 0, 14, '230,238,255', .5 + .3 * Math.sin(t * 2.2));
    for (let i = 0; i < 4; i++) knuckle(HL.kx, HL.fy[i], 5.2); // the knuckle bosses
    for (const i of [1, 0]) tips[i] = finger(fingers[i], false);
    // the thumb, out to the side
    { const b = [-8, -27], th = [thG, thG - .25 * thF, thG - .5 * thF], pts = fingerChain(b, th, HL.th * 1.3, thF), W = [11, 9, 7.4, 5.8];
      for (let j = 0; j < pts.length - 1; j++) segPlate(pts[j], pts[j + 1], W[j], W[j + 1], false);
      for (let j = 1; j < pts.length - 1; j++) knuckle(pts[j][0], pts[j][1], W[j] * .42); }
    if (H.snapped && DET()) add(() => { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 7; i++) { const an = i / 7 * TAU; ctx.moveTo(HL.kx + 20 + Math.cos(an) * 6, -18 + Math.sin(an) * 6); ctx.lineTo(HL.kx + 20 + Math.cos(an) * 16, -18 + Math.sin(an) * 16); } ctx.stroke(); });
    const m = ctx.getTransform(); ctx.restore();
    H.tipW = tips.map(p => p && [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f]); // (device space; unused by the rules)
    ctx.restore();
  }
  function segPlate(p0, p1, w0, w1, far) {
    const s = taper(p0[0], p0[1], (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, p1[0], p1[1], w0, w1, 3);
    cel((ox, oy, cont) => { if (!cont) ctx.beginPath(); ctx.moveTo(s.L[0] + ox, s.L[1] + oy); for (let i = 2; i < s.L.length; i += 2) ctx.lineTo(s.L[i] + ox, s.L[i + 1] + oy); for (let i = s.R.length - 2; i >= 0; i -= 2) ctx.lineTo(s.R[i] + ox, s.R[i + 1] + oy); ctx.closePath(); },
      far ? shade(BN.silver, -.2) : BN.silver, { d: 1.2, r: .6, w: 1.1, dark: BN.silverDk, lite: BN.silverLt });
  }
  function knuckle(x, y, r) { ctx.fillStyle = C(BN.gilt); circle(x, y, r); ctx.fill(); outline(.9); if (DET()) { ctx.fillStyle = 'rgba(255,255,255,.85)'; circle(x - r * .3, y - r * .35, r * .3); ctx.fill(); } }

  // ---------------- THE MOON MANTIS: the swordsman the night could not stop being ----------------
  // Side on, facing +x, feet at 0,0. A praying mantis as tall as the throne: chitin of moon-pale lacquer over ink, wings
  // of leaded glass with the dawn coming through them (and the stars he was, set in them as studs), eyes like lamps, and
  // two raptorial forelegs folded in prayer: the far one ink-blue, the near one plated silver and gilt at the joints (the
  // silver arm, which is all that will be left of it). A foreleg is [coxa, femur, tibia] angles, blended between poses.
  const MN = { body: '#8E9DC6', bodyDk: '#38436E', bodyLt: '#DCE4FA', far: '#56648E', farDk: '#242C50', farLt: '#8A98C0', wing: '220,230,252', dawn: '255,206,190', eye: '#E4F4FF' };
  const FORE = { pray: [1.25, -1.0, 2.0], cock: [.95, -2.1, .85], strike: [.42, -.1, .02], raise: [.7, -1.8, .55], low: [1.45, .5, 1.0], reap: [1.0, .02, .3], clasp: [.95, -.7, 2.45], droop: [1.5, .75, 1.95] };
  const MDROP = 30; // about where the near scythe lies when it falls (deathStep lays the silver arm there)
  const lerpA = (A, B, k) => A.map((v, i) => lerp(v, B[i], k));
  const solid = (rgba) => FLASH ? '#FFFFFF' : TINT || rgba; // a see-through fill that still flashes and tints like the rest
  function mantisPose(e, a, t) {
    const st = e.state, w = a.wind || 0, plan = e.plan, actA = st === 'w5act' ? e.w5a : null, k = e.w5k || 0;
    const M = { crouch: 0, lean: 0, head: 0, near: FORE.pray.slice(), far: FORE.pray.slice(), wing: 0, eye: .25, lz: e.w5lz || 0, g: e.w5gait || 0, sway: Math.sin(t * 1.7) * 2.6, unfold: 1, crack: 0, slash: 0, tuck: 0, spin: 0, glare: 0 };
    const W = (p) => st === 'wind' && plan === p ? w : 0; let q;
    if ((q = W('w5scythe'))) { M.near = lerpA(FORE.pray, FORE.cock, sm(cl01(q * 1.6))); M.far = lerpA(FORE.pray, FORE.cock, sm(cl01(q * 1.3))); M.crouch = 10 * q; M.lean = -.14 * q; M.head = -.1 * q; M.eye = q; }
    if (actA === 'scythe') { const s = e.w5strike || 0; M.near = lerpA(FORE.cock, FORE.strike, s); M.far = lerpA(FORE.cock, FORE.strike, s * .85); M.crouch = 10 - 4 * s; M.lean = lerp(-.14, .2, s); M.eye = 1; M.slash = s; }
    if ((q = W('w5leap'))) { M.crouch = 30 * sm(q); M.near = lerpA(FORE.pray, FORE.raise, q * .5); M.far = M.near.slice(); M.lean = .12 * q; M.wing = .2 * q; M.eye = q; }
    if (actA === 'leap') { const air = M.lz > 2; M.eye = 1;
      if (air) { M.tuck = 1; M.crouch = -4; M.near = lerpA(FORE.raise, FORE.strike, sm(cl01((k - .55) / .4))); M.far = M.near.slice(); M.wing = .75 + .25 * Math.sin(t * 46); M.lean = lerp(-.1, .3, k); }
      else { M.crouch = 26; M.near = FORE.low.slice(); M.far = FORE.low.slice(); M.lean = .3; M.wing = .15; } }
    if ((q = W('w5wings'))) { M.wing = sm(cl01(q * 1.4)); M.near = lerpA(FORE.pray, FORE.raise, sm(cl01(q * 2))); M.far = M.near.slice(); M.lean = -.2 * q; M.head = -.15 * q; M.eye = q; }
    if (actA === 'wings') { M.wing = 1 - sm(cl01((k - .6) / .4)); M.near = FORE.raise.slice(); M.far = FORE.raise.slice(); M.lean = -.2; M.eye = 1; M.glare = cl01(1 - k * 1.6); }
    if ((q = W('w5reap'))) { M.crouch = 22 * sm(q); M.near = lerpA(FORE.pray, FORE.low, sm(q)); M.far = lerpA(FORE.pray, FORE.low, sm(q)); M.lean = .25 * q; M.eye = q; }
    if (actA === 'reap') { M.crouch = 24; M.lean = .25; const s = e.w5strike || 0; M.near = lerpA(FORE.low, FORE.reap, s); M.far = lerpA(FORE.low, FORE.reap, s); M.eye = 1; M.spin = e.w5spin || 0; M.slash = s * .8; }
    if ((q = W('w5clasp'))) { M.near = lerpA(FORE.pray, FORE.raise, sm(q)); M.far = lerpA(FORE.pray, FORE.raise, sm(q)); M.wing = .35 * q; M.crouch = 8 * q; M.eye = q; M.lean = -.1 * q; }
    if (actA === 'clasp') { const s = sm(cl01(k * 5)); M.near = lerpA(FORE.raise, FORE.clasp, s); M.far = lerpA(FORE.raise, FORE.clasp, s); M.wing = .35 * (1 - k); M.slash = s * (1 - k); M.eye = 1; M.lean = .15 * s; }
    if (st === 'down') { M.crouch = 28; M.near = FORE.droop.slice(); M.far = FORE.droop.slice(); M.head = .5; M.lean = .3; M.eye = .1; }
    else if (a.hurt) { M.lean = -.22; M.head = -.25; M.near = lerpA(M.near, FORE.raise, .4); }
    return M;
  }
  // one raptorial foreleg from its shoulder S: the coxa, the spined femur, the tibia that folds onto it like a clasp knife
  function foreleg(S, A, near, slash, t) {
    const [cA, fA, tA] = A, L = [26, 48, 44];
    const c1 = [S[0] + Math.cos(cA) * L[0], S[1] + Math.sin(cA) * L[0]], f1 = [c1[0] + Math.cos(fA) * L[1], c1[1] + Math.sin(fA) * L[1]], t1 = [f1[0] + Math.cos(tA) * L[2], f1[1] + Math.sin(tA) * L[2]];
    const col = near ? BN.silver : MN.far, dk = near ? BN.silverDk : MN.farDk, lt = near ? BN.silverLt : MN.farLt;
    const plate = (p0, p1, w0, w1, bx, by, lames) => { const s = taper(p0[0], p0[1], (p0[0] + p1[0]) / 2 + bx, (p0[1] + p1[1]) / 2 + by, p1[0], p1[1], w0, w1, 6);
      cel(stripPath(s), col, { d: 1.8, r: .8, w: 1.3, dark: dk, lite: lt, tex: lames && near ? () => { ctx.strokeStyle = 'rgba(60,70,100,.55)'; ctx.lineWidth = .7; ctx.beginPath(); for (const i of [4, 8]) { ctx.moveTo(s.L[i], s.L[i + 1]); ctx.lineTo(s.R[i], s.R[i + 1]); } ctx.stroke(); } : null });
      return s; };
    const fx = f1[0] - c1[0], fy = f1[1] - c1[1], fl = Math.hypot(fx, fy) || 1, ux = fx / fl, uy = fy / fl, nx = -uy, ny = ux;
    const sg = ((t1[0] - c1[0]) * nx + (t1[1] - c1[1]) * ny) >= 0 ? 1 : -1; // the side the tibia folds onto: the spines are there
    plate(S, c1, 10, 8, 0, 0, true);
    ctx.fillStyle = C(near ? BN.gilt : '#9AA6C8');
    for (let i = 1; i <= 5; i++) { const u = i / 6.2, bx = c1[0] + fx * u, by = c1[1] + fy * u, h = i % 2 ? 7.5 : 4.5, o = 4.2 * sg;
      ctx.beginPath(); ctx.moveTo(bx + nx * o - ux * 2.4, by + ny * o - uy * 2.4); ctx.lineTo(bx + nx * (o + h * sg) + ux * 2.2, by + ny * (o + h * sg) + uy * 2.2); ctx.lineTo(bx + nx * o + ux * 2.4, by + ny * o + uy * 2.4); ctx.closePath(); ctx.fill(); outline(.6); }
    plate(c1, f1, 11.5, 8, -nx * sg * 3.5, -ny * sg * 3.5, true); // the femur, bellied away from its spines
    const ts = plate(f1, t1, 6.6, 2.4, 0, 0, false); // the tibia: a blade
    const tx = t1[0] - f1[0], ty = t1[1] - f1[1], tl = Math.hypot(tx, ty) || 1, hx = -ty / tl, hy = tx / tl, hs = ((c1[0] - f1[0]) * hx + (c1[1] - f1[1]) * hy) >= 1 ? 1 : ((c1[0] - f1[0]) * hx + (c1[1] - f1[1]) * hy) <= -1 ? -1 : sg;
    horn(t1[0] - tx / tl * 3, t1[1] - ty / tl * 3, t1[0] + tx / tl * 5, t1[1] + ty / tl * 5, t1[0] + tx / tl * 3 + hx * hs * 7, t1[1] + ty / tl * 3 + hy * hs * 7, 3.2, .6, col, .8, dk); // the hook
    if (near) { knuckle(c1[0], c1[1], 3.6); knuckle(f1[0], f1[1], 3.2); knuckle(S[0], S[1], 3.8); }
    else { ctx.fillStyle = C(MN.farDk); circle(f1[0], f1[1], 2.6); ctx.fill(); }
    if (near && DET()) add(() => { ctx.strokeStyle = `rgba(240,246,255,${.35 + .55 * (slash || 0)})`; ctx.lineWidth = 1.2; ctx.beginPath(); const E = hs > 0 ? ts.L : ts.R; ctx.moveTo(E[0], E[1]); for (let i = 2; i < E.length; i += 2) ctx.lineTo(E[i], E[i + 1]); ctx.stroke(); }); // the edge
    if (slash > .05 && DET()) add(() => { const a0 = Math.atan2(t1[1] - S[1], t1[0] - S[0]), R = Math.hypot(t1[0] - S[0], t1[1] - S[1]); ctx.strokeStyle = `rgba(235,242,255,${.6 * slash})`; ctx.lineWidth = 7 * slash; ctx.beginPath(); ctx.arc(S[0], S[1], R, a0 - 1.1 * slash, a0); ctx.stroke(); ctx.strokeStyle = `rgba(255,255,255,${.8 * slash})`; ctx.lineWidth = 1.6; ctx.stroke(); }); // the cut, a crescent of light behind the blade
    return t1;
  }
  // a hind wing thrown open in the display: a fan of glass, veined in silver leaf, edged with the dawn, and an eye on it
  function wingFan(B, w, far, t) {
    const R = 132 * Math.sqrt(w), a0 = -Math.PI + .12, a1 = lerp(-Math.PI + .3, -Math.PI / 2 + .3, w), n = 8, rim = [];
    for (let i = 0; i <= n; i++) { const an = lerp(a0, a1, i / n), rr = R * (i % 2 ? .92 : 1) * (1 - .1 * Math.abs(i / n - .55)); rim.push([B[0] + Math.cos(an) * rr, B[1] + Math.sin(an) * rr]); }
    const path = () => { ctx.beginPath(); ctx.moveTo(B[0], B[1]); for (let i = 0; i < rim.length; i++) { const p = rim[i]; if (!i) ctx.lineTo(p[0], p[1]); else { const q = rim[i - 1]; ctx.quadraticCurveTo((p[0] + q[0]) / 2 + (p[0] - B[0]) * .06, (p[1] + q[1]) / 2 + (p[1] - B[1]) * .06, p[0], p[1]); } } ctx.closePath(); };
    ctx.save(); if (far) ctx.globalAlpha *= .75;
    path(); if (FLASH || TINT) ctx.fillStyle = solid(''); else { const g = ctx.createRadialGradient(B[0], B[1], 6, B[0], B[1], R); g.addColorStop(0, far ? 'rgba(30,38,80,.85)' : 'rgba(46,58,112,.8)'); g.addColorStop(.55, `rgba(${MN.wing},${far ? .38 : .5})`); g.addColorStop(.9, `rgba(${MN.dawn},.62)`); g.addColorStop(1, `rgba(${MN.dawn},.82)`); ctx.fillStyle = g; }
    ctx.fill(); outline(1.3);
    if (DET()) leafLine(() => { for (let i = 1; i < rim.length - 1; i++) { ctx.moveTo(B[0], B[1]); ctx.quadraticCurveTo(lerp(B[0], rim[i][0], .5) + 4, lerp(B[1], rim[i][1], .5) - 3, rim[i][0], rim[i][1]); } }, .6, .55);
    // the eye: a gilt ring, an iris of night, and in it a white crescent moon
    const am = lerp(a0, a1, .5), er = 19 * Math.sqrt(w) * (far ? .85 : 1), ex = B[0] + Math.cos(am) * R * .6, ey = B[1] + Math.sin(am) * R * .6;
    ctx.fillStyle = C(BN.gilt); circle(ex, ey, er); ctx.fill(); outline(1.1);
    ctx.fillStyle = C('#141C40'); circle(ex, ey, er * .76); ctx.fill();
    if (!FLASH) { ctx.fillStyle = '#F4F8FF'; ctx.beginPath(); ctx.arc(ex, ey, er * .5, -1.2, 1.9); ctx.arc(ex + er * .18, ey - er * .06, er * .4, 1.7, -1.0, true); ctx.closePath(); ctx.fill(); }
    glowAt(ex, ey, er * 2.4, '235,242,255', .25 + .5 * w);
    ctx.restore();
    return [ex, ey];
  }
  // a chrysalis of silver: what the stars harden into on the floor of the hall, before it splits
  function chrysalis(h, crack, split, t) {
    if (h <= 1) return; const W = h * .34, pulse = 1 + .035 * Math.sin(t * 14) * crack * (1 - split);
    const shape = PB([0, -h, W * .55, -h * .82, W, -h * .48, W * .82, -h * .14, W * .3, 0, -W * .3, 0, -W * .82, -h * .14, -W, -h * .48, -W * .55, -h * .82]);
    for (const s of [-1, 1]) { ctx.save(); ctx.globalAlpha *= 1 - split * .85; ctx.translate(s * split * 26, 0); ctx.rotate(s * split * .7); ctx.scale(pulse, pulse);
      if (split > 0) { ctx.beginPath(); ctx.rect(s > 0 ? 0 : -h, -h * 1.2, h, h * 1.3); ctx.clip(); }
      cel(shape, BN.silver, { d: 3.4, r: 1.4, w: 1.7, dark: BN.silverDk, lite: BN.silverLt, tex: () => {
        ctx.strokeStyle = 'rgba(60,70,100,.5)'; ctx.lineWidth = .9; ctx.beginPath(); for (let i = 1; i < 6; i++) { const y = -h * i / 6.4; ctx.moveTo(-W, y); ctx.quadraticCurveTo(0, y + 7, W, y); } ctx.stroke(); } });
      if (DET()) for (let i = 0; i < 6; i++) { const y = -h * (.18 + i * .13), x = (hsh(i * 3.3) - .5) * W * .9; star4(x, y, 2.6, .9); } // the stars he was, set in the shell
      ctx.restore(); }
    if (crack > 0 && split < 1) add(() => { ctx.strokeStyle = `rgba(255,255,255,${.9 * crack * (1 - split)})`; ctx.lineWidth = 1.6 + 2 * crack; ctx.beginPath(); ctx.moveTo(0, -h * .98); for (let i = 1; i <= 8; i++) ctx.lineTo((i % 2 ? 4 : -4) * crack, -h * (1 - i / 8 * crack)); ctx.stroke(); glowAt(0, -h * .5, h * .6, '235,242,255', .5 * crack); });
  }
  function drawMantis(e, a, t, M, o = {}) {
    const U = M.unfold ?? 1, cr = M.crouch + (1 - U) * 44, lz = M.lz || 0, g = M.g || 0, sw = (M.sway || 0) * U;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (o.a !== undefined) ctx.globalAlpha *= o.a;
    if (M.spin) { const c = Math.cos(M.spin); ctx.scale(Math.max(.25, Math.abs(c)), 1); if (c < 0) ctx.scale(-1, 1); }
    ctx.translate(0, -lz);
    if (o.clipX !== undefined && o.clipX !== null) { ctx.beginPath(); ctx.rect(o.clipX, -400, 600, 420); ctx.clip(); } // (flaking away from the tail forward as it dies)
    const TX = -6 + sw * .4, TY = -72 + cr; // the thorax, where the legs and the neck meet
    const upper = (fn) => { ctx.save(); ctx.translate(TX, TY); ctx.rotate((M.lean || 0) + sw * .006); ctx.translate(-TX, -TY); fn(); ctx.restore(); };
    // the four walking legs: a pair forward, a pair back, each stepping with the ground covered (far side first)
    const leg = (hx, fx, ph, near) => { const pp = g + ph + (near ? Math.PI : 0), s = Math.sin(pp), lift = Math.max(0, Math.cos(pp)) * 8;
      const hip = [hx, TY + 4]; let foot = [fx * lerp(.5, 1, U) + s * 11 + (near ? 6 : -4), -lift];
      if (M.tuck) foot = [hx + (fx - hx) * .4, TY + 44];
      const side = foot[0] > hip[0] ? -1 : 1, [g1, g2] = ik2(hip, foot, 46, 56, side), knee = [hip[0] + Math.cos(g1) * 46, hip[1] + Math.sin(g1) * 46], ft = [knee[0] + Math.cos(g2) * 56, knee[1] + Math.sin(g2) * 56];
      const col = near ? MN.body : MN.far;
      seg(hip[0], hip[1], knee[0], knee[1], 8.4, 5.6, col, 1.2); seg(knee[0], knee[1], ft[0], ft[1], 5.2, 2.6, col, .5);
      ctx.strokeStyle = C(near ? MN.bodyDk : MN.farDk); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(ft[0], ft[1]); ctx.lineTo(ft[0] - side * 9, ft[1] + 1); ctx.stroke(); // the foot
      ctx.fillStyle = C(near ? BN.gilt : MN.farDk); circle(knee[0], knee[1], near ? 3 : 2.4); ctx.fill(); outline(.7); };
    leg(TX + 2, 30, 0, false); leg(TX - 14, -66, Math.PI * .5, false);
    const B = [TX - 4, TY - 12]; let eyes = null;
    if (M.wing > .02) { const e1 = wingFan([B[0] + 12, B[1] - 6], M.wing * .92, true, t); eyes = [e1]; }
    upper(() => foreleg([TX + 17, TY - 44], M.far, false, M.slash, t));
    // the abdomen: long, segmented, the tip lifted
    const br = Math.sin(t * 2.1) * 1.5 * U;
    cel(PB([TX - 2, TY - 10, TX - 40, TY - 22 - br, TX - 92, TY - 20 - br, TX - 128, TY - 14, TX - 150, TY - 26, TX - 142, TY - 2, TX - 100, TY + 14, TX - 50, TY + 17, TX - 12, TY + 11]), MN.body, { d: 3.6, r: 1.3, w: 1.8, dark: MN.bodyDk, lite: MN.bodyLt, tex: () => {
      ctx.strokeStyle = 'rgba(30,38,76,.5)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 1; i < 7; i++) { const x = TX - 14 - i * 18; ctx.moveTo(x + 4, TY - 22); ctx.quadraticCurveTo(x - 3, TY, x + 2, TY + 14); } ctx.stroke();
      if (M.crack) { ctx.strokeStyle = `rgba(255,255,255,${.9 * M.crack})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(TX - 130, TY - 8); ctx.lineTo(TX - 100, TY + 2); ctx.lineTo(TX - 80, TY - 10); ctx.lineTo(TX - 50, TY + 4); ctx.lineTo(TX - 20, TY - 6); ctx.stroke(); } } });
    if (M.wing > .02) eyes = [wingFan(B, M.wing, false, t)].concat(eyes || []);
    // the fore wing: a long leaf of glass laid over the back, lifted with the display
    ctx.save(); ctx.translate(B[0] + 2, B[1] + 2); ctx.rotate(M.wing * 1.15);
    { const fw = PB([0, 2, -40, -9, -102, -10, -150, -2, -112, 7, -44, 9]); fw(0, 0); ctx.fillStyle = solid(`rgba(${MN.wing},.5)`); ctx.fill();
      if (DET()) { ctx.save(); fw(0, 0); ctx.clip(); const gg = ctx.createLinearGradient(0, -10, 0, 10); gg.addColorStop(0, 'rgba(255,255,255,.35)'); gg.addColorStop(1, `rgba(${MN.dawn},.25)`); ctx.fillStyle = gg; ctx.fillRect(-152, -12, 154, 24); ctx.restore();
        leafLine(() => { ctx.moveTo(-4, 1); ctx.quadraticCurveTo(-70, -6, -146, -2); for (const x of [-30, -60, -90, -120]) { ctx.moveTo(x, -4); ctx.lineTo(x - 14, 6); } }, .7, .7);
        for (const [x, y] of [[-34, -2], [-70, 2], [-104, -3], [-128, 1]]) star4(x, y, 2.8, .95); } // the stars he was
      fw(0, 0); outline(1.3); }
    ctx.restore();
    // the neck: the long prothorax, rising
    let H0;
    upper(() => { const N = [TX + 30, TY - 66], s = taper(TX - 6, TY + 4, TX + 12, TY - 30, N[0], N[1], 24, 11, 6); H0 = N;
      cel(stripPath(s), MN.body, { d: 2.6, r: 1.1, w: 1.6, dark: MN.bodyDk, lite: MN.bodyLt, tex: () => {
        ctx.strokeStyle = 'rgba(30,38,76,.45)'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(s.M[2], s.M[3]); for (let i = 4; i < s.M.length; i += 2) ctx.lineTo(s.M[i], s.M[i + 1]); ctx.stroke();
        if (M.crack) { ctx.strokeStyle = `rgba(255,255,255,${.9 * M.crack})`; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(TX, TY - 2); ctx.lineTo(TX + 12, TY - 22); ctx.lineTo(TX + 8, TY - 34); ctx.lineTo(TX + 22, TY - 52); ctx.stroke(); } } });
      ctx.fillStyle = C(BN.gilt); circle(TX - 2, TY - 2, 4); ctx.fill(); outline(.9); }); // a gilt boss where the wings are hinged
    leg(TX + 6, 40, 0, true); leg(TX - 10, -58, Math.PI * .5, true);
    // the head: a triangle on a swivel, eyes like lamps at its corners, each with the dark false pupil that follows you
    upper(() => { ctx.save(); ctx.translate(H0[0] + 6, H0[1] - 8); ctx.rotate(M.head || 0);
      ctx.strokeStyle = C(MN.bodyDk); ctx.lineWidth = 1.2; ctx.beginPath(); for (const [dx, k] of [[-3, 0], [3, 1]]) { ctx.moveTo(dx, -10); ctx.quadraticCurveTo(-16 + dx * 2, -50 - k * 6 + Math.sin(t * 2 + k) * 3, -54 + dx * 3, -58 - k * 12 + Math.sin(t * 1.6 + k) * 5); } ctx.stroke(); // the antennae
      cel(PB([-14, -8, 0, -15, 16, -9, 11, 3, 4, 15, -3, 13, -11, 2]), MN.body, { d: 2, r: 1, w: 1.5, dark: MN.bodyDk, lite: MN.bodyLt });
      ctx.fillStyle = C(MN.bodyDk); ctx.beginPath(); ctx.moveTo(-1, 10); ctx.lineTo(5, 19); ctx.lineTo(6, 10); ctx.closePath(); ctx.fill(); outline(.7); // the mouthparts
      const eg = M.eye ?? 0;
      for (const [x, y, r, fr] of [[-11, -8, 5.4, 1], [12, -7, 6.8, 0]]) { cel(PE(x, y, r, r * 1.12), fr ? '#B8C8E6' : MN.eye, { d: 1.2, r: .6, w: 1.1, dark: '#7A8AB4', lite: '#FFFFFF' });
        if (!FLASH) { ctx.fillStyle = 'rgba(16,20,46,.85)'; ell(x + 1.6, y + .6, r * .3, r * .42); ctx.fill(); } glowAt(x, y, r * 3.2, '220,240,255', .3 + .5 * eg); }
      ctx.restore(); });
    let tip = null;
    if (!o.noNear) upper(() => { tip = foreleg([TX + 21, TY - 40], M.near, true, M.slash, t); });
    ctx.restore();
    if (e && eyes) { const s = e.size || 1; e.w5eyes = eyes.map(([x, y]) => ({ x: e.x + x * e.facing * s, z: (lz - y) * s })); } // (where the eyes on its wings are: the glare comes out of them)
    return { TX, TY, tip };
  }
  // ---------------- the changes, drawn ----------------
  const kneeling = (e) => Object.assign({}, e, { state: 'down', plan: null, phase: 1, w5shift: 0, dead: false, bph: 1 });
  function drawMorph(e, a, t) {
    const u = e.mt / e.mmax, ph = e.bph, calm = { t, hurt: false, wind: 0, walk: 0 };
    if (ph === 2) { // the master drives his sword into the floor and kneels; his armies climb out of the stone round him and lift it
      const fade = 1 - seg01(u, .3, .62);
      if (fade > 0) { ctx.save(); ctx.globalAlpha *= fade; ctx.translate(0, seg01(u, .3, .62) * -10); prev(u < .08 ? e : kneeling(e), a); ctx.restore(); }
      drawHost(e, calm, t, 1, { rise: seg01(u, .22, .78), pole: seg01(u, .1, .66) });
      if (u > .55 && u < .75) glowAt(0, -60, 90, '230,238,255', .5 * Math.sin(seg01(u, .55, .75) * Math.PI));
    } else if (ph === 3) { // the host looks up; the moon goes out; they go up as sparks and come down as stars
      const fade = 1 - seg01(u, .22, .55);
      if (fade > 0) { ctx.save(); ctx.globalAlpha *= fade; ctx.translate(0, -seg01(u, .22, .55) * 30); drawHost(e, { t, wind: 0, hurt: false }, t, 1, { look: 1 }); ctx.restore(); }
      if (u > .45) drawStars(e, calm, t, 1, { reveal: seg01(u, .45, .97) });
    } else { // the stars redraw themselves into the Mantis (morphStep blends the figure), fall into his heart, and the heart
      // falls to the floor; a chrysalis of silver grows there, cracks and splits, and the Mantis climbs out and unfolds
      const shell = sm(seg01(u, .34, .5)), crack = seg01(u, .5, .66), split = seg01(u, .66, .82);
      if (u < .4) { const drop = sm(seg01(u, .27, .35)); ctx.save(); ctx.translate(0, drop * 122); drawStars(e, calm, t, 1 - seg01(u, .33, .4), { collapse: seg01(u, .19, .29) }); ctx.restore(); }
      if (u > .64) { const M = mantisPose(Object.assign({}, e, { state: 'idle', plan: null, w5lz: 0 }), calm, t), U = sm(seg01(u, .64, .88)), flare = Math.sin(Math.PI * seg01(u, .8, 1));
        M.unfold = U; M.wing = flare; M.eye = U; M.near = lerpA(lerpA(FORE.droop, FORE.pray, U), FORE.raise, flare * .8); M.far = M.near.slice(); M.lean = -.18 * flare; M.head = .4 * (1 - U) - .15 * flare;
        ctx.save(); ctx.scale(lerp(.62, 1, U), lerp(.5, 1, U)); drawMantis(e, calm, t, M); ctx.restore(); }
      chrysalis(118 * shell, crack, split, t);
      if (u > .3 && u < .5) glowAt(0, -10 - 50 * shell, 40 + 50 * shell, '235,242,255', .6 * Math.sin(Math.PI * seg01(u, .3, .5)));
      if (u > .64 && u < .84) glowAt(0, -70, 120, '255,236,220', .55 * Math.sin(Math.PI * seg01(u, .64, .84))); // the dawn inside it
    }
  }
  // its death: it rears, then kneels and folds its scythes in prayer; it cracks, and flakes away to silver leaf from the
  // tail forward; the silver scythe comes away whole, falls, and lies on the floor (and there it is the silver arm)
  function drawMantisDeath(e, a, t) {
    const u = (e.w5die || 0) / 3; if (u >= .96) return;
    const M = mantisPose(Object.assign({}, e, { state: 'idle', plan: null, w5lz: 0, dead: false, w5gait: e.w5gait }), { t, wind: 0, hurt: false }, t);
    const rear = Math.sin(Math.PI * seg01(u, 0, .22)), kneel = sm(seg01(u, .18, .42)), dis = seg01(u, .42, .74);
    M.wing = rear; M.near = lerpA(lerpA(FORE.pray, FORE.raise, rear), FORE.pray, kneel); M.far = M.near.slice(); M.lean = -.25 * rear + .22 * kneel; M.head = -.3 * rear + .4 * kneel;
    M.crouch = 30 * kneel; M.crack = seg01(u, .2, .42); M.eye = 1 - seg01(u, .3, .5); M.sway = 0;
    const cut = dis > 0 ? lerp(-170, 120, dis) : null, gone = u > .5;
    let R;
    if (cut === null || cut < 110) { ctx.save(); ctx.translate(Math.sin(t * 40) * 1.6 * M.crack * (1 - dis), 0); R = drawMantis(e, a, t, M, { clipX: cut, noNear: gone }); ctx.restore(); }
    if (gone) { // the silver scythe, falling free and laid down flat
      const f = sm(seg01(u, .5, .68)), fade = 1 - seg01(u, .72, .8); if (fade > 0) { const TX = -6, TY = -72 + 30;
        ctx.save(); ctx.globalAlpha *= fade; ctx.translate(lerp(TX + 21, MDROP - 22, f), lerp(TY - 40, -4, f)); ctx.rotate(lerp(0, -.9, f)); ctx.scale(lerp(1, .55, f), lerp(1, .55, f));
        foreleg([0, 0], lerpA(FORE.pray, [0, -.05, .1], f), true, 0, t); ctx.restore(); glowAt(MDROP, -6, 26, '235,242,255', .4 * f * fade); } }
    if (u > .2 && u < .8) glowAt(0, -70, 90, '235,242,255', .35 * Math.sin(Math.PI * seg01(u, .2, .8)));
  }

  // ======================================================================================================
  // ATTACKS
  // ======================================================================================================
  const ED = (e, k = 1) => Math.round(edmg(e) * k);
  const WIND_UP = {}; // what happens while he winds up (kept out of the tells, so it happens whether or not a frame is drawn)
  const segDist = (px, py, x0, y0, x1, y1) => { const vx = x1 - x0, vy = y1 - y0, u = cl01(((px - x0) * vx + (py - y0) * vy) / (vx * vx + vy * vy || 1)); return Math.hypot(px - (x0 + vx * u), py - (y0 + vy * u)); };
  const FT = () => FLOOR_TOP, FB = () => FLOOR_BOT;
  const LANES = () => [FT() + 18, FT() + 54, FT() + 90];
  const laneOf = (y) => { const L = LANES(); let b = 0; for (let i = 1; i < 3; i++) if (Math.abs(y - L[i]) < Math.abs(y - L[b])) b = i; return b; };
  const big = (s, x, y, z, col = '#EEF2FA', sz = 15) => floatText(x, y, z, s, col, sz);
  // a ring of force rolling out over the floor: jump it, or dodge through it
  reg('w5ring', {
    update(h, dt) { if (h.delay > 0) { h.delay -= dt; return; } h.r += h.speed * dt; if (h.r > h.R) { h.t = -1; return; }
      const d = Math.hypot(P.x - h.x, (P.y - h.y) * 2.2); if (!h.hit && Math.abs(d - h.r) < 14 && P.z < 18) { h.hit = true; hitP(h.dmg, h.x, true); } },
    draw(h, t) { if (h.delay > 0) return; const f = 1 - h.r / h.R; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${h.rgb || '230,238,255'},${.25 + .6 * f})`; ctx.lineWidth = 6; ell(h.x, h.y, h.r, h.r / 2.2); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${.7 * f})`; ctx.lineWidth = 1.6; ell(h.x, h.y, h.r, h.r / 2.2); ctx.stroke(); ctx.restore(); },
  });
  const ring = (x, y, R, dmg, o = {}) => hazards.push(Object.assign({ kind: 'w5ring', x, y, r: o.r0 || 10, R, speed: o.speed || 380, delay: o.delay || 0, dmg, hit: false, t: 9, max: 9 }, o));
  const ringTell = (x, y, R, k, txt) => { ctx.fillStyle = tellCol(k * .6); ell(x, y, R * (.3 + .7 * k), R * (.3 + .7 * k) / 2.2); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 2; ell(x, y, R, R / 2.2); ctx.stroke(); if (txt) label(x, y + R / 2.2 + 11, txt, .5 + .4 * k); };

  // ---------------- THE HOST ----------------
  // PINCER OF PIKES: a rank of pikemen marches in from each wall, stamping in step; each rank leaves one gap, and the
  // two gaps are in different places. Stand in the first gap as it passes, then get to the second (or roll through)
  const pikeT = (e) => targets(e, () => { const lf = Math.abs(P.x - leftWall()) < Math.abs(P.x - rightWall()), gy1 = clamp(P.y + rand(-10, 10), FT() + 22, FB() - 16), far = gy1 > (FT() + FB()) / 2 ? rand(FT() + 20, FT() + 44) : rand(FB() - 40, FB() - 16);
    return { g: lf ? [gy1, far] : [far, gy1] }; }); // the rank that reaches you first opens where you are
  function pikeBand(x, dir, gy, k, live) { const y0 = FT() + 2, y1 = FB() + 6, w = 34, x0 = dir > 0 ? x : x - w;
    ctx.fillStyle = tellCol(live ? k : k * .6); ctx.fillRect(x0, y0, w, gy - 24 - y0); ctx.fillRect(x0, gy + 24, w, y1 - gy - 24);
    ctx.strokeStyle = 'rgba(190,215,255,.9)'; ctx.lineWidth = 2; ell(x0 + w / 2, gy, w / 2 + 6, 20); ctx.stroke(); label(x0 + w / 2, gy + 3, 'GAP', .6 + .3 * k);
    ctx.strokeStyle = tellLine(k); ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { const ax = x0 + w / 2 + dir * (30 + i * 16 + (performance.now() / 12) % 16), ay = (FT() + FB()) / 2; ctx.beginPath(); ctx.moveTo(ax, ay - 8); ctx.lineTo(ax + dir * 8, ay); ctx.lineTo(ax, ay + 8); ctx.stroke(); } }
  WIND_UP.w5phalanx = (e) => { pikeT(e); };
  TELL_FX.w5phalanx = (e, t, k) => { const T = pikeT(e); pikeBand(leftWall() + 4, 1, T.g[0], k, true); pikeBand(rightWall() - 4, -1, T.g[1], k, true); };
  PLAN_FX.w5phalanx = (e) => {
    const T = pikeT(e); e.w5T = null; sfx('roar'); sfx('slam');
    hazards.push({ kind: 'w5pikes', ranks: [{ x: leftWall() - 6, dir: 1, gy: T.g[0], hit: false }, { x: rightWall() + 6, dir: -1, gy: T.g[1], hit: false }], el: 0, t: 12, max: 12, dmg: ED(e, .9) });
    big('THE PHALANX', e.x, e.y, e.hh * e.size + 20);
    act(e, 'phalanx', (h, dt, e) => { if (h.el > 2.1) { recover(e, .7); return true; } return false; });
  };
  reg('w5pikes', {
    update(h, dt) { const pel = h.el; h.el += dt; const step = (x) => x * 190 - Math.sin(x * TAU * 2.4) * 190 / (TAU * 2.4); // a stamping march: stride, halt, stride
      if (Math.floor(pel * 2.4) !== Math.floor(h.el * 2.4)) { sfx('slam', .3); shakeMag = Math.max(shakeMag, 2.5); }
      let live = 0;
      for (const r of h.ranks) { r.x0 = r.x0 ?? r.x; r.x = r.x0 + r.dir * step(h.el); if (r.dir > 0 ? r.x < rightWall() + 60 : r.x > leftWall() - 60) live++;
        const fwd = (P.x - r.x) * r.dir; if (!r.hit && fwd > -14 && fwd < 30 && Math.abs(P.y - r.gy) > 20 && P.z < 46) { r.hit = true; hitP(h.dmg, r.x - r.dir * 30, true); if (P.state === 'hurt') P.vx = r.dir * 320; } }
      if (!live) h.t = -1; },
    draw(h, t) { for (const r of h.ranks) { ctx.fillStyle = 'rgba(230,70,90,.16)'; ctx.fillRect(r.x - 12, FT() + 2, 24, r.gy - 22 - FT()); ctx.fillRect(r.x - 12, r.gy + 22, 24, FB() + 4 - r.gy - 22);
      ctx.strokeStyle = 'rgba(200,225,255,.8)'; ctx.lineWidth = 1.6; ell(r.x, r.gy, 20, 16); ctx.stroke(); } },
    ups(h, list, t) { for (const r of h.ranks) { let i = 0; for (let y = FT() + 10; y <= FB() + 2; y += 13, i++) { if (Math.abs(y - r.gy) < 21) continue; const yy = y, ii = i;
      list.push([yy, () => { ctx.save(); ctx.translate(r.x, yy); soldier(.84, r.dir, (ii + (r.dir > 0 ? 0 : 3)) % 6 === 5 ? 4 : (ii + (r.dir > 0 ? 0 : 3)) % 6, t, { step: h.el * 15 + ii, level: 1 }); ctx.restore(); }]); } } },
    box(h, box) { for (const r of h.ranks) box(r.x, FB() + 4, 0, 60, 200); },
  });
  // ARROW STORM: the archers of all his wars, somewhere out over the clouds. The floor is laid out in a chequer: the first
  // flight falls on the squares marked 1, the second on the others. Be on the right square for each
  const volT = (e) => targets(e, () => { const x0 = leftWall() + 4, x1 = rightWall() - 4, n = 7, cw = (x1 - x0) / n, rows = 2, rh = (FB() + 6 - FT()) / rows;
    const pc = Math.floor((P.x - x0) / cw), pr = P.y > FT() + rh ? 1 : 0; return { x0, cw, n, rows, rh, par: (pc + pr) % 2 }; }); // the first flight falls where you stand
  const cellsOf = (T) => { const out = []; for (let c = 0; c < T.n; c++) for (let r = 0; r < T.rows; r++) out.push({ x: T.x0 + c * T.cw, y: FT() + r * T.rh, w: T.cw, h: T.rh, p: (c + r) % 2 }); return out; };
  const inCell = (C2, x, y) => x >= C2.x && x < C2.x + C2.w && y >= C2.y - 4 && y < C2.y + C2.h + 2;
  function volleyGrid(T, k, first, done) { for (const c of cellsOf(T)) { const one = c.p === T.par; if (done && one) continue; const now = first ? one : !one;
    if (now) { ctx.fillStyle = tellCol(k); ctx.fillRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4); } ctx.strokeStyle = now ? tellLine(k) : 'rgba(190,215,255,.55)'; ctx.lineWidth = now ? 1.6 : 1; if (!now) ctx.setLineDash([5, 4]); ctx.strokeRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4); ctx.setLineDash([]);
    label(c.x + c.w / 2, c.y + c.h / 2 + 3, one ? '1' : '2', now ? .5 + .4 * k : .45); } }
  WIND_UP.w5volley = (e) => { volT(e); };
  TELL_FX.w5volley = (e, t, k) => volleyGrid(volT(e), k, true, false);
  PLAN_FX.w5volley = (e) => {
    const T = volT(e); e.w5T = null; sfx('shoot'); big('LOOSE!', e.x, e.y, e.hh * e.size + 20);
    hazards.push({ kind: 'w5volley', T, cells: cellsOf(T), el: 0, at: [.32, 1.45], hit: [false, false], fired: [false, false], t: 9, max: 9, dmg: ED(e, .75) });
    act(e, 'volley', (h, dt, e) => { if (h.el > 1.7) { recover(e, .8); return true; } return false; });
  };
  reg('w5volley', {
    update(h, dt) { h.el += dt;
      for (let v = 0; v < 2; v++) if (!h.fired[v] && h.el >= h.at[v]) { h.fired[v] = true; sfx('slice'); sfx('hit-crystal', .3); shakeMag = Math.max(shakeMag, 3); const par = v ? 1 - h.T.par : h.T.par;
        for (const c of h.cells) if (c.p === par) { for (let i = 0; i < 3; i++) dust(c.x + rand(8, c.w - 8), c.y + rand(6, c.h - 6), 1); if (!h.hit[v] && inCell(c, P.x, P.y)) { h.hit[v] = true; hitP(h.dmg, P.x + rand(-10, 10), false); } } }
      if (h.el > h.at[1] + 1.2) h.t = -1; },
    draw(h, t) { if (!h.fired[1]) volleyGrid(h.T, cl01(.6 + .4 * Math.sin(h.el * 12)), !h.fired[0], h.fired[0]); },
    ups(h, list, t) { for (let v = 0; v < 2; v++) { const par = v ? 1 - h.T.par : h.T.par, dt0 = h.el - h.at[v]; if (dt0 < -.3 || dt0 > 1.1) continue;
      for (const c of h.cells) { if (c.p !== par) continue; for (let i = 0; i < 4; i++) { const ax = c.x + (i + .5) / 4 * c.w + (hsh(i + c.x) - .5) * 10, ay = c.y + c.h * (.25 + .5 * hsh(i * 3 + c.y)), z = dt0 < 0 ? -dt0 / .3 * 200 : 0, a = dt0 < 0 ? 1 : 1 - cl01((dt0 - .6) / .5);
        list.push([ay, () => { ctx.save(); ctx.globalAlpha *= a; ctx.translate(ax - z * .35, ay - z - 2); ctx.rotate(1.2); ctx.strokeStyle = C('#3A4466'); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(0, 0); ctx.stroke(); ctx.fillStyle = C('#E6ECF6'); ctx.beginPath(); ctx.moveTo(-18, -2.4); ctx.lineTo(-13, 0); ctx.lineTo(-18, 2.4); ctx.closePath(); ctx.fill(); ctx.restore(); }]); } } } },
    box(h, box) { box((leftWall() + rightWall()) / 2, FB() + 4, 0, (rightWall() - leftWall()) / 2 + 20, 260); },
  });
  // THE GHOST CHARGE: riders down two of the three lanes, then back down two others. The lane left empty is yours
  const cavT = (e) => targets(e, () => { const safe1 = Math.floor(rand(0, 3)); let safe2 = Math.floor(rand(0, 3)); if (safe2 === safe1) safe2 = (safe1 + 1 + Math.floor(rand(0, 2))) % 3; const d = e.x < (leftWall() + rightWall()) / 2 ? 1 : -1; return { safe: [safe1, safe2], d }; });
  function laneBand(i, dir, k, live, n) { const y = LANES()[i], x0 = leftWall(), x1 = rightWall(); ctx.fillStyle = live ? tellCol(k) : tellCol(k * .35); ctx.fillRect(x0, y - 17, x1 - x0, 34);
    ctx.strokeStyle = tellLine(live ? k : k * .5); ctx.lineWidth = 1.4; if (!live) ctx.setLineDash([6, 5]); ctx.strokeRect(x0, y - 17, x1 - x0, 34); ctx.setLineDash([]);
    ctx.lineWidth = 2; for (let j = 0; j < 8; j++) { const ax = (dir > 0 ? x0 : x1) + dir * (j * 80 + (performance.now() / (live ? 5 : 9)) % 80); if (ax < x0 || ax > x1) continue; ctx.beginPath(); ctx.moveTo(ax, y - 7); ctx.lineTo(ax + dir * 9, y); ctx.lineTo(ax, y + 7); ctx.stroke(); }
    label(dir > 0 ? x0 + 14 : x1 - 14, y + 3, String(n), .5 + .4 * k); }
  WIND_UP.w5cavalry = (e) => { cavT(e); };
  TELL_FX.w5cavalry = (e, t, k) => { const T = cavT(e); for (let i = 0; i < 3; i++) { if (i !== T.safe[0]) laneBand(i, T.d, k, true, 1); else if (i !== T.safe[1]) laneBand(i, -T.d, k, false, 2); } };
  PLAN_FX.w5cavalry = (e) => {
    const T = cavT(e); e.w5T = null; sfx('growl'); big('CHARGE!', e.x, e.y, e.hh * e.size + 20);
    const riders = []; for (let p = 0; p < 2; p++) for (let i = 0; i < 3; i++) if (i !== T.safe[p]) { const d = p ? -T.d : T.d; riders.push({ lane: i, d, x: d > 0 ? leftWall() - 80 - i * 22 : rightWall() + 80 + i * 22, at: p ? 1.25 : .15, hit: false, pass: p }); }
    hazards.push({ kind: 'w5riders', T, riders, el: 0, t: 9, max: 9, dmg: ED(e, .9), hitP: [false, false] });
    act(e, 'cavalry', (h, dt, e) => { if (h.el > 1.5) { recover(e, .8); return true; } return false; });
  };
  reg('w5riders', {
    update(h, dt) { h.el += dt; let live = 0;
      for (const r of h.riders) { if (h.el < r.at) { live++; continue; } if (!r.went) { r.went = 1; sfx('whoosh'); }
        r.x += r.d * 760 * dt; if (r.d > 0 ? r.x < rightWall() + 120 : r.x > leftWall() - 120) live++;
        if (Math.random() < dt * 30) parts.push({ x: r.x - r.d * 30, y: LANES()[r.lane] + rand(-6, 6), z: rand(2, 30), vx: -r.d * rand(40, 120), vy: 0, vz: rand(10, 40), life: .5, max: .5, col: 'rgba(210,225,255,.55)', size: rand(5, 9), shape: 'puff', rot: 0, vr: 0 });
        if (!h.hitP[r.pass] && Math.abs(P.y - LANES()[r.lane]) < 19 && Math.abs(P.x - r.x) < 36 && P.z < 56) { h.hitP[r.pass] = true; hitP(h.dmg, r.x - r.d * 20, true); if (P.state === 'hurt') P.vx = r.d * 360; } }
      if (!live) h.t = -1; },
    draw(h, t) { const T = h.T; if (h.el < 1.25) for (let i = 0; i < 3; i++) if (i !== T.safe[1]) laneBand(i, -T.d, h.el > .9 ? 1 : .6, h.el > .9, 2); },
    ups(h, list, t) { for (const r of h.riders) { if (h.el < r.at || Math.abs(r.x - (leftWall() + rightWall()) / 2) > 520) continue; const y = LANES()[r.lane]; list.push([y, () => { ctx.save(); ctx.translate(r.x, y); rider(r.d, t * 14 + r.lane, t); ctx.restore(); }]); } },
    box(h, box) { for (const r of h.riders) box(r.x, LANES()[r.lane], 0, 80, 120); },
  });
  // a ghost rider: a horse at full gallop, a knight with his lance couched and a pennant streaming
  function rider(d, g, t) {
    ctx.save(); ctx.scale(d, 1);
    const s = Math.sin(g), c = Math.cos(g), hy = -30 + Math.abs(s) * 3;
    for (let i = 0; i < 5; i++) mistTongue(-30, hy + 2 + i * 3, -16 - i * 4, 8, -10, t, i, 'rgba(210,225,255,.45)'); // its tail and the mist it leaves
    const leg = (x, ph, far) => { const a = Math.sin(g + ph) * .7, k = [x + Math.sin(a) * 12, hy + 14], f = [k[0] + Math.sin(a * 1.6 - .4) * 10, -1 - Math.max(0, Math.cos(g + ph)) * 6]; seg(x, hy + 4, k[0], k[1], 6, 4.4, far ? GH.bodyDk : GH.body, .8); seg(k[0], k[1], f[0], f[1], 4.4, 3.2, far ? GH.bodyDk : GH.body, .7); };
    leg(-16, 2.2, 1); leg(18, .4, 1);
    cel(PB([-30, hy - 4, -12, hy - 10, 14, hy - 10, 30, hy - 6, 30, hy + 6, 12, hy + 10, -18, hy + 10, -30, hy + 4]), GH.body, { d: 3, r: 1.2, w: 1.5, dark: GH.bodyDk, lite: GH.bodyLt });
    cel(PB([22, hy - 6, 36, hy - 24, 44, hy - 28, 52, hy - 22, 48, hy - 18, 40, hy - 16, 32, hy + 2]), GH.body, { d: 2, r: 1, w: 1.4, dark: GH.bodyDk, lite: GH.bodyLt }); // the neck and the long head
    if (!FLASH) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(44, hy - 25, 2.4, 1.2); }
    leg(-14, 3.6, 0); leg(20, 1.8, 0);
    // the rider: low over the neck, the lance couched
    const ry = hy - 12; cel(PB([-8, ry, 6, ry - 2, 10, ry - 18, 2, ry - 22, -6, ry - 16]), GH.shield, { d: 2, r: .8, w: 1.3, dark: GH.shieldDk, lite: GH.shieldLt });
    cel(PE(6, ry - 26, 5, 5.6), GH.steel, { d: 1.2, r: .5, w: 1.1, dark: GH.steelDk, lite: '#FFFFFF' }); ctx.fillStyle = C('#141A30'); ctx.fillRect(7, ry - 27, 5, 1.2);
    ctx.strokeStyle = C('#3A4466'); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-14, ry - 10); ctx.lineTo(70, ry - 16); ctx.stroke();
    ctx.fillStyle = C(GH.steel); ctx.beginPath(); ctx.moveTo(68, ry - 18.4); ctx.lineTo(80, ry - 16.2); ctx.lineTo(68, ry - 13.6); ctx.closePath(); ctx.fill(); outline(.8);
    const pw = Math.sin(t * 20) * 2; ctx.fillStyle = C('#E6ECF6'); ctx.beginPath(); ctx.moveTo(56, ry - 16); ctx.lineTo(40, ry - 22 + pw); ctx.lineTo(46, ry - 16 + pw * .5); ctx.lineTo(40, ry - 12 + pw); ctx.closePath(); ctx.fill(); outline(.7); // the pennant
    ctx.restore();
  }
  // THE BANNER BROUGHT DOWN: the whole standard tipped forward and slammed down the floor in front of him
  const stdBox = (e) => { const d = e.facing, x0 = e.x + d * 18, x1 = e.x + d * 210; return { x0: Math.min(x0, x1), x1: Math.max(x0, x1), y: e.y }; };
  TELL_FX.w5standard = (e, t, k) => { const b = stdBox(e); ctx.fillStyle = tellCol(k); ctx.fillRect(b.x0, b.y - 26, b.x1 - b.x0, 52); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.6; ctx.strokeRect(b.x0, b.y - 26, b.x1 - b.x0, 52); };
  PLAN_FX.w5standard = (e) => {
    const b = stdBox(e); sfx('whoosh');
    act(e, 'standard', (h, dt, e) => { e.w5k = cl01(h.el / .5);
      if (h.el > .2 && !h.hit) { h.hit = true; sfx('slam'); shakeMag = Math.max(shakeMag, 9); dust((b.x0 + b.x1) / 2, b.y, 12); silverBurst(e.x + e.facing * 150, b.y, 6, 16);
        fx.push({ kind: 'ring', x: e.x + e.facing * 150, y: b.y, z: 2, t: .35, max: .35, r: 70, col: '#EEF2FA', flat: 1 });
        if (P.x > b.x0 && P.x < b.x1 && Math.abs(P.y - b.y) < 28 && P.z < 40) hitP(ED(e, 1.05), e.x, true); }
      if (h.el > .55) { recover(e, 1.1); return true; } return false; }); // and it takes a moment to lift it again
  };
  // THE SHIELD WALL (up close): the shields locked all round him slam outward together
  TELL_FX.w5shieldwall = (e, t, k) => ringTell(e.x, e.y, e.hw + 70, k, 'JUMP');
  PLAN_FX.w5shieldwall = (e) => { sfx('slam'); shakeMag = Math.max(shakeMag, 7); ring(e.x, e.y, 210, ED(e, .8), { r0: 20, speed: 360 }); act(e, 'shieldwall', (h, dt, e) => { if (h.el > .35) { recover(e, .9); return true; } return false; }); };

  // ---------------- THE SWORDSMAN IN THE STARS ----------------
  // THE STAR-WEB: stars fall from him onto the floor, and the lines of a constellation are drawn between them; then the
  // lines burn. Stand in one of the spaces between, or be in the air when they light
  const webT = (e) => targets(e, () => { const x0 = leftWall() + 24, x1 = rightWall() - 24, n = 7, pts = [];
    for (let i = 0; i < n; i++) { const top = i % 2 === 0; pts.push([lerp(x0, x1, (i + rand(-.15, .15)) / (n - 1)), top ? FT() + rand(8, 22) : FB() - rand(2, 14)]); }
    pts[0][0] = x0; pts[n - 1][0] = x1; const lines = []; for (let i = 0; i < n - 1; i++) { lines.push([i, i + 1]); if (i < n - 2 && Math.random() < .75) lines.push([i, i + 2]); }
    return { pts, lines }; });
  function webDraw(T, k, burn) { const P0 = T.pts;
    ctx.save(); ctx.lineCap = 'round';
    for (const [i, j] of T.lines) { const [x0, y0] = P0[i], [x1, y1] = P0[j];
      if (burn > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(235,242,255,${.9 * burn})`; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.strokeStyle = `rgba(255,255,255,${burn})`; ctx.lineWidth = 2.5; ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; }
      else { const q = cl01(k * 1.6 - .3); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(lerp(x0, x1, q), lerp(y0, y1, q)); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = tellCol(k); ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(lerp(x0, x1, q), lerp(y0, y1, q)); ctx.stroke(); } }
    for (const [x, y] of P0) { ctx.fillStyle = `rgba(240,244,255,${.5 + .5 * k})`; ctx.beginPath(); for (let i = 0; i < 8; i++) { const an = i / 8 * TAU, r = i % 2 ? 2.4 : 7; ctx.lineTo(x + Math.cos(an) * r, y + Math.sin(an) * r * .6); } ctx.closePath(); ctx.fill(); }
    ctx.restore(); }
  WIND_UP.w5web = (e) => { webT(e); };
  TELL_FX.w5web = (e, t, k) => webDraw(webT(e), k, 0);
  PLAN_FX.w5web = (e) => {
    const T = webT(e); e.w5T = null; sfx('charge', 2);
    hazards.push({ kind: 'w5web', T, el: 0, at: .5, t: 9, max: 9, dmg: ED(e, .85), hit: false });
    act(e, 'web', (h, dt, e) => { if (h.el > 1.1) { recover(e, .8); return true; } return false; });
  };
  reg('w5web', {
    update(h, dt) { h.el += dt; if (h.el >= h.at && !h.lit) { h.lit = 1; sfx('hit-crystal'); sfx('slice'); flashT = Math.max(flashT, .06); shakeMag = Math.max(shakeMag, 4); }
      if (h.lit && h.el < h.at + .45 && !h.hit && P.z < 16) for (const [i, j] of h.T.lines) { const [x0, y0] = h.T.pts[i], [x1, y1] = h.T.pts[j]; if (segDist(P.x, P.y, x0, y0, x1, y1) < 11) { h.hit = true; hitP(h.dmg, P.x, false); break; } }
      if (h.el > h.at + .7) h.t = -1; },
    draw(h, t) { if (h.el < h.at) webDraw(h.T, 1, 0); else webDraw(h.T, 1, 1 - cl01((h.el - h.at) / .7)); },
  });
  // THE SIGNS: he redraws himself, star for star, into a sign of the zodiac, and fights as that
  const signT = (e) => targets(e, () => { e.w5signI = ((e.w5signI ?? -1) + 1) % SIGNS.length; e.w5sign = SIGNS[e.w5signI]; big(FIG[e.w5sign].name, e.x, e.y, 230, '#DDE6FF', 17); sfx('hit-crystal'); return { sign: e.w5sign }; });
  WIND_UP.w5zodiac = (e, k) => { signT(e); e.w5signK = k; };
  TELL_FX.w5zodiac = (e, t, k) => {
    if (e.w5sign === 'scorpion') { ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.6; ctx.setLineDash([4, 4]); ell(P.x, P.y, 34, 15); ctx.stroke(); ctx.setLineDash([]); label(P.x, P.y + 26, 'IT IS AIMING AT YOU', .4 + .4 * k); }
    else if (e.w5sign === 'archer') { const d = Math.sign(P.x - e.x) || 1, x1 = d > 0 ? rightWall() : leftWall(); ctx.fillStyle = tellCol(k * .5); ctx.fillRect(Math.min(e.x, x1), P.y - 13, Math.abs(x1 - e.x), 26); }
    else { for (const off of [-.4, 0, .4]) { const a = Math.atan2((P.y - e.y) * 2.2, P.x - e.x) + off, L = 330; ctx.strokeStyle = tellLine(k * .8); ctx.lineWidth = 1.4; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(a) * L, e.y + Math.sin(a) * L / 2.2); ctx.stroke(); ctx.setLineDash([]); } }
  };
  PLAN_FX.w5zodiac = (e) => {
    const sign = signT(e).sign; e.w5sign = sign; e.w5T = null; e.w5signK = 1;
    if (sign === 'scorpion') { // the sting comes down three times, each time where you were half a second before
      hazards.push({ kind: 'w5sting', e, marks: [.5, 1.05, 1.6].map(at => ({ at, lock: at - .5, x: P.x, y: P.y, done: false })), el: 0, t: 9, max: 9, dmg: ED(e, .8) });
      act(e, 'zodiac', (h, dt, e) => { e.w5signK = 1; const m = hazards.find(o => o.kind === 'w5sting' && o.e === e); e.w5strike = m ? Math.max(0, ...m.marks.map(q => 1 - Math.abs(h.el - q.at) / .18)) : 0; if (h.el > 1.85) { e.w5strike = 0; recover(e, .7); return true; } return false; });
    } else if (sign === 'archer') { // three arrows of light down the floor, each down the lane you are in a moment before
      hazards.push({ kind: 'w5arrows', e, shots: [.55, 1.1, 1.65].map(at => ({ at, lock: at - .45, y: P.y, d: 1, done: false })), el: 0, t: 9, max: 9, dmg: ED(e, .8) });
      act(e, 'zodiac', (h, dt, e) => { e.w5signK = 1; const m = hazards.find(o => o.kind === 'w5arrows' && o.e === e), nx = m && m.shots.find(s => !s.done); e.w5draw = nx ? cl01(1 - (nx.at - h.el) / .5) : 0; if (h.el > 1.95) { e.w5draw = 0; recover(e, .7); return true; } return false; });
    } else { // the three stars of the Hunter's belt thrown out spinning, and back
      const a0 = Math.atan2((P.y - e.y) * 2.2, P.x - e.x), hy = e.y; e.w5beltOut = 1; sfx('whoosh');
      hazards.push({ kind: 'w5belt', e, discs: [-.4, 0, .4].map((off, i) => ({ a: a0 + off, x: e.x, y: hy, hit: false, i })), el: 0, t: 9, max: 9, dmg: ED(e, .75), ox: e.x, oy: hy });
      act(e, 'zodiac', (h, dt, e) => { e.w5signK = 1; if (h.el > 1.75) { e.w5beltOut = 0; recover(e, .6); return true; } return false; });
    }
  };
  reg('w5sting', {
    update(h, dt) { h.el += dt; let left = 0;
      for (const m of h.marks) { if (m.done) continue; left++; if (h.el < m.lock) { m.x = P.x; m.y = yClamp(P.y); } else if (!m.locked) { m.locked = 1; sfx('charge', 1); }
        if (h.el >= m.at) { m.done = true; m.f = .4; sfx('slam'); shakeMag = Math.max(shakeMag, 6); silverBurst(m.x, m.y, 4, 14); fx.push({ kind: 'ring', x: m.x, y: m.y, z: 2, t: .3, max: .3, r: 40, col: '#EEF2FA', flat: 1 });
          if (inEll(P.x, P.y, m.x, m.y, 36) && P.z < 30) hitP(h.dmg, m.x, true); } }
      for (const m of h.marks) if (m.f > 0) m.f -= dt;
      if (!left && h.marks.every(m => !(m.f > 0))) h.t = -1; },
    draw(h, t) { for (const m of h.marks) { if (m.done || h.el < m.lock - .5) continue; const k = cl01(1 - (m.at - h.el) / .5); ctx.fillStyle = tellCol(m.locked ? k : .3); ell(m.x, m.y, 36, 16); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 2; if (!m.locked) ctx.setLineDash([4, 4]); ell(m.x, m.y, 36, 16); ctx.stroke(); ctx.setLineDash([]); } },
    ups(h, list, t) { const e = h.e; for (const m of h.marks) { const q = 1 - (m.at - h.el) / .22; if (m.done || q < 0) continue; // the sting coming down out of the sky in a streak
      list.push([m.y, () => onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const sx = lerp(e.x + e.facing * 30, m.x, sm(q)), sy = lerp(e.y - 170, m.y, sm(q)); const g = ctx.createLinearGradient(e.x, e.y - 170, sx, sy); g.addColorStop(0, 'rgba(220,230,255,0)'); g.addColorStop(1, 'rgba(240,244,255,.9)'); ctx.strokeStyle = g; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(e.x + e.facing * 30, e.y - 170); ctx.quadraticCurveTo(lerp(e.x, m.x, .5), e.y - 230, sx, sy); ctx.stroke(); glowM(sx, sy, 18, '240,244,255', .9); ctx.restore(); })]); } },
  });
  reg('w5arrows', {
    update(h, dt) { h.el += dt; const e = h.e; let left = 0;
      for (const s of h.shots) { if (s.done) continue; left++; if (h.el < s.lock) { s.y = yClamp(P.y); s.d = Math.sign(P.x - e.x) || e.facing; } else if (!s.locked) { s.locked = 1; sfx('charge', 1); }
        if (h.el >= s.at) { s.done = true; s.f = .35; s.x0 = e.x; sfx('shoot'); sfx('whoosh'); if (Math.abs(P.y - s.y) < 13 && (P.x - e.x) * s.d > -20 && P.z < 34) hitP(h.dmg, e.x, true); } }
      for (const s of h.shots) if (s.f > 0) s.f -= dt;
      if (!left && h.shots.every(s => !(s.f > 0))) h.t = -1; },
    draw(h, t) { const e = h.e; for (const s of h.shots) { if (h.el < s.lock - .45) continue; const x1 = s.d > 0 ? rightWall() : leftWall(), x0 = s.done ? s.x0 : e.x;
      if (!s.done) { const k = cl01(1 - (s.at - h.el) / .45); ctx.fillStyle = tellCol(s.locked ? k : .3); ctx.fillRect(Math.min(x0, x1), s.y - 13, Math.abs(x1 - x0), 26); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.4; if (!s.locked) ctx.setLineDash([6, 5]); ctx.strokeRect(Math.min(x0, x1), s.y - 13, Math.abs(x1 - x0), 26); ctx.setLineDash([]); }
      else if (s.f > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(235,242,255,${s.f * 2})`; ctx.fillRect(Math.min(x0, x1), s.y - 4, Math.abs(x1 - x0), 8); ctx.restore(); } } },
  });
  reg('w5belt', {
    update(h, dt) { h.el += dt; const e = h.e, out = .7, hang = .25, R = 340;
      for (const d of h.discs) { const k = h.el < out ? sm(h.el / out) : h.el < out + hang ? 1 : 1 - sm(cl01((h.el - out - hang) / out)), ox = h.el < out + hang ? h.ox : e.x, oy = h.el < out + hang ? h.oy : e.y;
        if (h.el >= out + hang && !d.back) { d.back = 1; d.hit = false; d.bx = d.x; d.by = d.y; }
        if (d.back) { const q = sm(cl01((h.el - out - hang) / out)); d.x = lerp(d.bx, e.x, q); d.y = lerp(d.by, e.y, q); }
        else { d.x = clamp(ox + Math.cos(d.a) * R * k, leftWall() + 8, rightWall() - 8); d.y = clamp(oy + Math.sin(d.a) * R * k / 2.2, FT() + 4, FB()); }
        if (!d.hit && Math.hypot(P.x - d.x, (P.y - d.y) * 1.6) < 20 && P.z < 22) { d.hit = true; hitP(h.dmg, d.x, false); } }
      if (h.el > out * 2 + hang) { h.t = -1; e.w5beltOut = 0; } },
    draw(h, t) { for (const d of h.discs) { ctx.fillStyle = 'rgba(20,24,50,.35)'; ell(d.x, d.y, 14, 5); ctx.fill(); } },
    ups(h, list, t) { for (const d of h.discs) list.push([d.y, () => { ctx.save(); ctx.translate(d.x, d.y - 12); ctx.rotate(t * 18 + d.i); star4(0, 0, 11, 1); ctx.rotate(Math.PI / 4); star4(0, 0, 7, .9); ctx.restore(); glowAt(d.x, d.y - 12, 24, '230,238,255', .7); }]); },
    box(h, box) { for (const d of h.discs) box(d.x, d.y, 0, 30, 40); },
  });
  // STARFALL: stars come down where you are, one after another, each with its mark on the floor first
  PLAN_FX.w5meteor = (e) => {
    sfx('charge', 2); hazards.push({ kind: 'w5meteor', e, ms: [.85, 1.15, 1.45, 1.75, 2.05].map((at, i) => ({ at, show: at - .8, x: P.x, y: P.y, i, done: false, lead: i >= 3 })), el: 0, t: 9, max: 9, dmg: ED(e, .8) });
    act(e, 'meteor', (h, dt, e) => { if (h.el > 1.6) { recover(e, .8); return true; } return false; });
  };
  TELL_FX.w5meteor = (e, t, k) => { ctx.strokeStyle = tellLine(k * .6); ctx.lineWidth = 1.2; ctx.setLineDash([3, 5]); ell(P.x, P.y, 34, 15); ctx.stroke(); ctx.setLineDash([]); };
  reg('w5meteor', {
    update(h, dt) { h.el += dt; let left = 0;
      for (const m of h.ms) { if (m.done) continue; left++; if (h.el < m.show) { m.x = clamp(P.x + (m.lead ? P.vx * .3 + rand(-30, 30) : 0), leftWall() + 20, rightWall() - 20); m.y = yClamp(P.y + (m.lead ? rand(-20, 20) : 0)); }
        if (h.el >= m.at) { m.done = true; m.f = .5; sfx('slam'); sfx('hit-crystal', .5); shakeMag = Math.max(shakeMag, 6); silverBurst(m.x, m.y, 4, 16); fx.push({ kind: 'ring', x: m.x, y: m.y, z: 2, t: .4, max: .4, r: 52, col: '#EEF2FA', flat: 1 });
          if (inEll(P.x, P.y, m.x, m.y, 36) && P.z < 30) hitP(h.dmg, m.x, true); } }
      for (const m of h.ms) if (m.f > 0) m.f -= dt;
      if (!left && h.ms.every(m => !(m.f > 0))) h.t = -1; },
    draw(h, t) { for (const m of h.ms) { if (m.done) { if (m.f > 0) { ctx.save(); ctx.globalAlpha = m.f * 1.6; ctx.fillStyle = 'rgba(20,24,50,.5)'; ell(m.x, m.y, 30, 12); ctx.fill(); ctx.restore(); } continue; } if (h.el < m.show) continue; const k = cl01((h.el - m.show) / (m.at - m.show)); ringTell(m.x, m.y, 36, k); } },
    ups(h, list, t) { for (const m of h.ms) { const q = 1 - (m.at - h.el) / .4; if (m.done || q < 0) continue;
      list.push([m.y, () => onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const sx = m.x - 160 * (1 - q), sy = m.y - 260 * (1 - q); const g = ctx.createLinearGradient(sx - 90, sy - 150, sx, sy); g.addColorStop(0, 'rgba(200,215,255,0)'); g.addColorStop(1, 'rgba(240,244,255,.9)'); ctx.strokeStyle = g; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx - 90, sy - 150); ctx.lineTo(sx, sy); ctx.stroke(); glowM(sx, sy, 22, '240,244,255', 1); ctx.restore(); })]); } },
  });
  // THE NOVA (up close): his heart flares and throws out a ring of light
  TELL_FX.w5nova = (e, t, k) => ringTell(e.x, e.y, e.hw + 80, k, 'JUMP');
  PLAN_FX.w5nova = (e) => { sfx('hit-crystal'); sfx('slam'); flashT = Math.max(flashT, .08); ring(e.x, e.y, 220, ED(e, .8), { r0: 16, speed: 400 }); act(e, 'nova', (h, dt, e) => { if (h.el > .4) { recover(e, .9); return true; } return false; }); };

  // ---------------- THE MOON MANTIS ----------------
  // a crescent of moonlight thrown off a scythe, flying along the floor down one lane: tall ones out of the scythe cut
  // (step out of the lane), low ones skimming the floor out of the leap (jump them)
  reg('w5crescent', {
    update(h, dt) { if (h.delay > 0) { h.delay -= dt; return; } h.x += h.vx * dt; if (h.x < leftWall() - 40 || h.x > rightWall() + 40) { h.t = -1; return; }
      if (Math.random() < dt * 40) parts.push({ x: h.x - Math.sign(h.vx) * 10, y: h.y + rand(-3, 3), z: rand(2, h.hh * .8), vx: -h.vx * .08, vy: 0, vz: rand(10, 40), life: .35, max: .35, col: pick(['#FFFFFF', '#DDE6FF']), size: rand(1.5, 2.5), shape: 'star', rot: 0, vr: 3 });
      if (!h.hit && Math.abs(P.x - h.x) < 22 && Math.abs(P.y - h.y) < 15 && P.z < h.zMax) { h.hit = true; hitP(h.dmg, h.x - h.vx * .05, true); } },
    draw(h, t) { if (h.delay > 0) { const k = 1 - h.delay / (h.d0 || .2); ctx.fillStyle = `rgba(235,242,255,${.3 + .5 * k})`; ell(h.x, h.y, 10 + 10 * k, 4 + 3 * k); ctx.fill(); return; }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const d = Math.sign(h.vx), g = ctx.createLinearGradient(h.x - d * 120, 0, h.x, 0); g.addColorStop(0, 'rgba(220,230,255,0)'); g.addColorStop(1, 'rgba(235,242,255,.45)'); ctx.fillStyle = g; ctx.fillRect(Math.min(h.x, h.x - d * 120), h.y - 3, 120, 6); ctx.restore(); },
    ups(h, list, t) { if (h.delay > 0) return; list.push([h.y, () => onMain(() => { const d = Math.sign(h.vx), H = h.hh, x = h.x, y = h.y; ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(200,215,255,.35)'; ctx.beginPath(); ctx.moveTo(x, y - H - 4); ctx.quadraticCurveTo(x + d * (H * .5 + 6), y - H / 2, x, y + 4); ctx.quadraticCurveTo(x + d * (H * .2), y - H / 2, x, y - H - 4); ctx.fill();
      ctx.fillStyle = 'rgba(250,252,255,.95)'; ctx.beginPath(); ctx.moveTo(x, y - H); ctx.quadraticCurveTo(x + d * H * .45, y - H / 2, x, y); ctx.quadraticCurveTo(x + d * H * .22, y - H / 2, x, y - H); ctx.fill();
      glowM(x + d * 6, y - H / 2, H * .7, '230,238,255', .45); ctx.restore(); })]); },
    box(h, box) { box(h.x, h.y, 0, 40, h.hh + 20); },
  });
  const crescent = (x, y, d, o) => hazards.push(Object.assign({ kind: 'w5crescent', x, y, vx: d * 800, zMax: 30, hh: 58, hit: false, t: 4, max: 4, delay: 0 }, o));
  const laneTell = (x0, d, y, k, txt, live = true) => { const x1 = d > 0 ? rightWall() : leftWall(), hh = 15; ctx.fillStyle = tellCol(live ? k : k * .4); ctx.fillRect(Math.min(x0, x1), y - hh, Math.abs(x1 - x0), hh * 2);
    ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.4; if (!live) ctx.setLineDash([6, 5]); ctx.strokeRect(Math.min(x0, x1), y - hh, Math.abs(x1 - x0), hh * 2); ctx.setLineDash([]);
    ctx.lineWidth = 2; for (let j = 0; j < 6; j++) { const ax = x0 + d * (40 + j * 60 + (performance.now() / 6) % 60); if ((ax - x1) * d > 0) continue; ctx.beginPath(); ctx.moveTo(ax, y - 6); ctx.lineTo(ax + d * 8, y); ctx.lineTo(ax, y + 6); ctx.stroke(); }
    if (txt) label(x0 + d * 90, y + 3, txt, .5 + .4 * k); };
  // THE SCYTHES: it draws both scythes back over its head, and cuts: a crescent of moonlight flies down the lane it stands
  // in. Then it turns on you, finds your lane, and cuts again. Step out of the lane each time (or jump high over it)
  const scyT = (e) => targets(e, () => ({ y: yClamp(P.y), d: Math.sign(P.x - e.x) || e.facing }));
  WIND_UP.w5scythe = (e, k) => { const T = scyT(e); if (k < .5) { T.y = yClamp(P.y); T.d = Math.sign(P.x - e.x) || e.facing; } e.y += (T.y - e.y) * .12; e.facing = T.d; };
  TELL_FX.w5scythe = (e, t, k) => { const T = scyT(e); laneTell(e.x, T.d, T.y, k, k >= .5 ? 'STEP OUT OF THE LANE' : null, k >= .5); };
  PLAN_FX.w5scythe = (e) => {
    const T = scyT(e); e.w5T = null; e.y = T.y; e.facing = T.d; const T2 = { y: yClamp(P.y), d: T.d, lock: false };
    const cut = (y, d) => { sfx('slice'); sfx('whoosh'); shakeMag = Math.max(shakeMag, 5); e.facing = d; e.x = xClamp(e.x + d * 30); crescent(e.x + d * 60, y, d, { dmg: ED(e, .95) }); silverBurst(e.x + d * 70, y, 70, 8); };
    act(e, 'scythe', (h, dt, e) => {
      if (h.el < .14) e.w5strike = sm(h.el / .14); else if (!h.c1) { h.c1 = 1; e.w5strike = 1; cut(T.y, T.d); }
      if (h.c1 && h.el < .55) { e.w5strike = 1 - sm(cl01((h.el - .14) / .3)); T2.y = yClamp(P.y); T2.d = Math.sign(P.x - e.x) || e.facing; e.facing = T2.d; } // it turns on you
      else if (h.el >= .55 && !T2.lock) { T2.lock = true; sfx('charge', 1); }
      if (h.c1 && !h.c2) e.y += (T2.y - e.y) * Math.min(1, dt * 7);
      if (h.el >= .95 && !h.c2) e.w5strike = sm(cl01((h.el - .95) / .15));
      if (h.el >= 1.1 && !h.c2) { h.c2 = 1; e.y = T2.y; cut(T2.y, T2.d); }
      if (h.c2) e.w5strike = 1 - sm(cl01((h.el - 1.15) / .3));
      if (h.el > 1.6) { e.w5strike = 0; recover(e, .8); return true; } return false; },
      { draw: (h) => { if (h.c1 && !h.c2) laneTell(e.x, T2.d, T2.y, T2.lock ? cl01(.5 + (h.el - .55) / .55 * .5) : .35, T2.lock ? 'AGAIN · STEP OUT' : null, T2.lock); } });
  };
  // THE LEAP: it crouches, springs high over the hall, and its shadow hunts you across the floor; the shadow stops, and it
  // comes down there scythes first. Get out from under the shadow; then jump the two low blades of moonlight it throws
  // along the floor from where it lands (or be out of their lane)
  const LEAP = { up: .85, lock: .2, r: 58 };
  WIND_UP.w5leap = (e) => { e.w5G = { x: xClamp(P.x), y: yClamp(P.y) }; };
  TELL_FX.w5leap = (e, t, k) => { const G = e.w5G; if (!G) return; ctx.strokeStyle = tellLine(k * .6); ctx.lineWidth = 1.4; ctx.setLineDash([5, 5]); ell(G.x, G.y, LEAP.r, LEAP.r / 2.2); ctx.stroke(); ctx.setLineDash([]); };
  PLAN_FX.w5leap = (e) => {
    const G = e.w5G || { x: xClamp(P.x), y: yClamp(P.y) }; e.w5G = null; W5B.leapG = G; const ex0 = e.x, ey0 = e.y; sfx('whoosh'); dust(e.x, e.y, 12); shakeMag = Math.max(shakeMag, 4);
    act(e, 'leap', (h, dt, e) => {
      if (h.el < LEAP.lock) { G.x = xClamp(P.x); G.y = yClamp(P.y); e.facing = Math.sign(P.x - e.x) || e.facing; } else if (!h.lock) { h.lock = 1; sfx('charge', 1); }
      const q = cl01(h.el / LEAP.up); e.w5k = q;
      if (!h.land) { e.w5lz = Math.sin(Math.PI * q) * 175; e.x = lerp(ex0, G.x - e.facing * 6, sm(q)); e.y = lerp(ey0, G.y, sm(q)); }
      if (q >= 1 && !h.land) { h.land = 1; e.w5lz = 0; e.x = G.x - e.facing * 6; e.y = G.y; sfx('slam'); sfx('slice'); shakeMag = Math.max(shakeMag, 12); hitstop = Math.max(hitstop, .05); dust(G.x, G.y, 16); silverBurst(G.x, G.y, 6, 18);
        fx.push({ kind: 'ring', x: G.x, y: G.y, z: 2, t: .35, max: .35, r: 80, col: '#EEF2FA', flat: 1 });
        if (inEll(P.x, P.y, G.x, G.y, LEAP.r) && P.z < 40) hitP(ED(e, 1.1), G.x, true);
        for (const d of [-1, 1]) crescent(G.x + d * 26, G.y, d, { vx: d * 400, zMax: 20, hh: 24, delay: .2, d0: .2, dmg: ED(e, .7) }); }
      if (h.land && h.el > LEAP.up + .6) { recover(e, .9); return true; } return false; },
      { draw: (h) => { if (h.land) return; const q = cl01(h.el / LEAP.up), k = h.lock ? cl01(.5 + (h.el - LEAP.lock) / (LEAP.up - LEAP.lock) * .5) : .35;
        ctx.fillStyle = `rgba(8,10,28,${.2 + .35 * q})`; ell(G.x, G.y, LEAP.r * (.4 + .6 * q), LEAP.r * (.4 + .6 * q) / 2.2); ctx.fill(); // its shadow
        ringTell(G.x, G.y, LEAP.r, k, h.lock ? 'GET CLEAR · THEN JUMP' : null);
        if (h.lock) { ctx.strokeStyle = tellLine(k * .6); ctx.lineWidth = 1.2; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(leftWall(), G.y); ctx.lineTo(rightWall(), G.y); ctx.stroke(); ctx.setLineDash([]); } } });
  };
  // THE EYES ON ITS WINGS: it rears and throws its wings open, and on them are two great eyes with a moon in each. They
  // open, and their light falls on the whole floor in front of it. Get in under its wings (close), or round behind it
  const EYE_SAFE = 96;
  const wingT = (e) => targets(e, () => ({ d: Math.sign(P.x - e.x) || e.facing }));
  const wingZone = (e, d) => { const x0 = e.x + d * EYE_SAFE, x1 = d > 0 ? rightWall() + 40 : leftWall() - 40; return { a: Math.min(x0, x1), b: Math.max(x0, x1) }; };
  WIND_UP.w5wings = (e) => { e.facing = wingT(e).d; };
  TELL_FX.w5wings = (e, t, k) => { const d = wingT(e).d, Z = wingZone(e, d), y0 = FT(), y1 = FB() + 6;
    ctx.fillStyle = tellCol(k); ctx.fillRect(Z.a, y0, Z.b - Z.a, y1 - y0); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.6; ctx.strokeRect(Z.a, y0, Z.b - Z.a, y1 - y0);
    const s0 = Math.min(e.x - d * 70, e.x + d * EYE_SAFE), s1 = Math.max(e.x - d * 70, e.x + d * EYE_SAFE); ctx.fillStyle = guardCol(k * .5); ctx.fillRect(s0, y0, s1 - s0, y1 - y0); ctx.strokeStyle = guardLine(k); ctx.setLineDash([5, 4]); ctx.strokeRect(s0, y0, s1 - s0, y1 - y0); ctx.setLineDash([]);
    label((s0 + s1) / 2, y1 - 6, 'UNDER ITS WINGS', .5 + .4 * k); label((Z.a + Z.b) / 2, (y0 + y1) / 2 + 3, 'ITS EYES WILL OPEN', .5 + .4 * k); };
  PLAN_FX.w5wings = (e) => {
    const d = wingT(e).d, Z = wingZone(e, d); e.w5T = null; e.facing = d;
    act(e, 'wings', (h, dt, e) => { e.w5k = cl01(h.el / 1.0);
      if (h.el > .06 && !h.go) { h.go = 1; sfx('hit-crystal'); sfx('crit'); flashT = Math.max(flashT, .1); shakeMag = Math.max(shakeMag, 5); big('THE EYES OPEN', e.x, e.y, 210, '#FFFFFF', 18); }
      if (h.go && h.el < .42 && !h.hit && P.x > Z.a && P.x < Z.b) { h.hit = 1; hitP(ED(e, 1.05), e.x, true); }
      if (h.el > 1.0) { recover(e, .9); return true; } return false; },
      { draw: (h) => { if (!h.go) { TELL_FX.w5wings(e, 0, 1); return; } const f = cl01(1 - (h.el - .06) / .5); if (f <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(240,244,255,${.55 * f})`; ctx.fillRect(Z.a, FT(), Z.b - Z.a, FB() + 6 - FT()); ctx.restore(); },
        up: (h, t) => { const f = h.go ? cl01(1 - (h.el - .06) / .5) : 0; if (f <= 0) return; const eyes = e.w5eyes || [{ x: e.x - d * 40, z: 150 }];
          onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const ex = d > 0 ? Z.a : Z.b, ex1 = d > 0 ? Z.b : Z.a;
            for (const p of eyes) { const g = ctx.createLinearGradient(p.x, e.y - p.z, ex1, FB()); g.addColorStop(0, `rgba(250,252,255,${.7 * f})`); g.addColorStop(1, `rgba(220,230,255,${.12 * f})`); ctx.fillStyle = g;
              ctx.beginPath(); ctx.moveTo(p.x, e.y - p.z - 4); ctx.lineTo(ex1, FT() - 40); ctx.lineTo(ex1, FB() + 6); ctx.lineTo(ex, FB() + 6); ctx.lineTo(ex, FT()); ctx.closePath(); ctx.fill(); glowM(p.x, e.y - p.z, 40, '250,252,255', .9 * f); }
            ctx.restore(); }); }, uy: FB() + 8 });
  };
  // THE HARVEST: it sinks low and reaps the floor round its feet with both scythes, at the height of your ankles: first a
  // wide half-moon in front, then it spins and reaps all round it. Jump each one (or be outside it)
  const REAP = { r1: 230, r2: 172, at1: .12, at2: 1.05 };
  const reapT = (e) => targets(e, () => ({ d: Math.sign(P.x - e.x) || e.facing }));
  const halfTell = (x, y, R, d, k, txt) => { ctx.fillStyle = tellCol(k * .8); ctx.beginPath(); if (d > 0) ctx.ellipse(x, y, R, R / 2.2, 0, -Math.PI / 2, Math.PI / 2); else ctx.ellipse(x, y, R, R / 2.2, 0, Math.PI / 2, Math.PI * 1.5); ctx.closePath(); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 2; ctx.stroke(); if (txt) label(x + d * R * .6, y + 3, txt, .5 + .4 * k); };
  WIND_UP.w5reap = (e) => { e.facing = reapT(e).d; };
  TELL_FX.w5reap = (e, t, k) => { halfTell(e.x, e.y, REAP.r1, reapT(e).d, k, 'LOW · JUMP'); };
  PLAN_FX.w5reap = (e) => {
    const d = reapT(e).d; e.w5T = null; e.facing = d; const x0 = e.x, y0 = e.y;
    act(e, 'reap', (h, dt, e) => {
      if (h.el < REAP.at1) e.w5strike = sm(h.el / REAP.at1); else if (!h.r1) { h.r1 = 1; sfx('slice'); sfx('whoosh'); shakeMag = Math.max(shakeMag, 6); dust(e.x + d * 120, e.y, 10); h.f1 = .3;
        if (inEll(P.x, P.y, x0, y0, REAP.r1) && (P.x - x0) * d > -24 && P.z < 18) hitP(ED(e, .95), x0, true); }
      if (h.r1 && h.el < .6) e.w5strike = 1 - sm(cl01((h.el - REAP.at1) / .3));
      if (h.el >= .7 && h.el < 1.25) { e.w5spin = sm(cl01((h.el - .7) / .5)) * TAU; e.w5strike = 1; } else e.w5spin = 0;
      if (h.el >= REAP.at2 && !h.r2) { h.r2 = 1; sfx('slice'); sfx('whoosh'); shakeMag = Math.max(shakeMag, 7); dust(e.x, e.y, 14); h.f2 = .3;
        if (inEll(P.x, P.y, x0, y0, REAP.r2) && P.z < 18) hitP(ED(e, .9), x0, true); }
      if (h.f1 > 0) h.f1 -= dt; if (h.f2 > 0) h.f2 -= dt;
      if (h.el > 1.6) { e.w5strike = 0; e.w5spin = 0; recover(e, .9); return true; } return false; },
      { draw: (h) => { if (!h.r1) halfTell(x0, y0, REAP.r1, d, 1, 'LOW · JUMP');
          else if (!h.r2) ringTell(x0, y0, REAP.r2, cl01((h.el - REAP.at1) / (REAP.at2 - REAP.at1)), h.el > .45 ? 'AGAIN · JUMP' : null);
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 5;
          if (h.f1 > 0) { ctx.strokeStyle = `rgba(240,244,255,${h.f1 * 3})`; ctx.beginPath(); if (d > 0) ctx.ellipse(x0, y0, REAP.r1 - 6, (REAP.r1 - 6) / 2.2, 0, -Math.PI / 2, Math.PI / 2); else ctx.ellipse(x0, y0, REAP.r1 - 6, (REAP.r1 - 6) / 2.2, 0, Math.PI / 2, Math.PI * 1.5); ctx.stroke(); }
          if (h.f2 > 0) { ctx.strokeStyle = `rgba(240,244,255,${h.f2 * 3})`; ell(x0, y0, REAP.r2 - 6, (REAP.r2 - 6) / 2.2); ctx.stroke(); }
          ctx.restore(); } });
  };
  // THE CLASP (up close): it rears with both scythes raised and snaps them shut round where you stand. Get clear, or roll
  TELL_FX.w5clasp = (e, t, k) => ringTell(e.x, e.y, 104, k, 'GET CLEAR');
  PLAN_FX.w5clasp = (e) => { const x0 = e.x, y0 = e.y; act(e, 'clasp', (h, dt, e) => { e.w5k = cl01(h.el / .55);
      if (h.el > .06 && !h.go) { h.go = 1; sfx('slice'); sfx('hit-metal'); sfx('slam', .5); shakeMag = Math.max(shakeMag, 7); h.f = .25; silverBurst(e.x + e.facing * 60, e.y, 90, 10); if (inEll(P.x, P.y, x0, y0, 104) && P.z < 50) hitP(ED(e, .95), x0, true); }
      if (h.f > 0) h.f -= dt;
      if (h.el > .55) { recover(e, .9); return true; } return false; },
    { draw: (h) => { if (!h.go) ringTell(x0, y0, 104, 1, 'GET CLEAR'); else if (h.f > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(240,244,255,${h.f * 3})`; ctx.lineWidth = 5; ell(x0, y0, 98, 98 / 2.2); ctx.stroke(); ctx.restore(); } } }); };

  // ======================================================================================================
  // THE HALL CHANGES WITH HIM: the armies of his wars stand along the horizon behind the Host; for the Swordsman the
  // moon goes out and the sky is all stars, and the polished floor gives them back; for the Mantis the dawn comes up
  // (art_w5.js's throne rule: W5.dawnK and the burning edges)
  // ======================================================================================================
  const AR = W5B.arena = { army: 0, night: 0 };
  { const _mt = MECH_FX.w5throne.update; MECH_FX.w5throne.update = function (m, dt) { _mt(m, dt);
      const e = boss && isBen(boss) ? boss : null, ph = e ? e.bph || 1 : 0, mo = e && e.state === 'w5morph' ? e.mt / e.mmax : 1;
      const army = e && !e.dead && ph === 2 ? sm(cl01(mo * 1.6)) : e && ph === 3 && e.state === 'w5morph' ? 1 - cl01(mo * 2) : 0;
      const night = e && !e.dead && ph === 3 ? sm(cl01(mo * 2.2)) : e && ph === 4 && e.state === 'w5morph' ? 1 - cl01((mo - .25) * 4) : 0;
      AR.army += (army - AR.army) * Math.min(1, dt * 3); AR.night += (night - AR.night) * Math.min(1, dt * 3); };
    const _ms = MECH_FX.w5throne.start; MECH_FX.w5throne.start = function (m) { _ms(m); AR.army = 0; AR.night = 0; }; }
  const TH = THEMES.moonBoss, _sky = TH.liveSky, _floor = TH.liveFloor;
  TH.liveSky = function (camX, t) {
    _sky.call(this, camX, t);
    const T0 = FLOOR_TOP;
    if (AR.army > .01) { // a forest of pikes and standards along the edge of the clouds: every army he ever led
      ctx.save(); ctx.globalAlpha = AR.army;
      const off = -camX * .08;
      for (let i = 0; i < 120; i++) { const x = ((i * 9.3 + off) % (VW + 40) + VW + 40) % (VW + 40) - 20, h = 34 + hsh(i) * 46, sw = Math.sin(t * 1.1 + i * .7) * 2, base = T0 - 6;
        ctx.strokeStyle = 'rgba(18,24,52,.85)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x + sw, base - h); ctx.stroke();
        ctx.fillStyle = 'rgba(214,222,236,.75)'; ctx.beginPath(); ctx.moveTo(x + sw - 1.6, base - h); ctx.lineTo(x + sw, base - h - 6); ctx.lineTo(x + sw + 1.6, base - h); ctx.closePath(); ctx.fill();
        if (i % 13 === 4) { ctx.fillStyle = 'rgba(30,40,80,.9)'; const bw = 12 + hsh(i + 2) * 8; ctx.beginPath(); ctx.moveTo(x + sw, base - h + 4); ctx.lineTo(x + sw + bw + Math.sin(t * 2 + i) * 2, base - h + 6); ctx.lineTo(x + sw + bw * .8, base - h + 12); ctx.lineTo(x + sw + bw + Math.sin(t * 2 + i + 1) * 2, base - h + 18); ctx.lineTo(x + sw, base - h + 16); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(214,222,236,.6)'; ctx.lineWidth = .8; ctx.stroke(); } }
      const g = ctx.createLinearGradient(0, T0 - 50, 0, T0); g.addColorStop(0, 'rgba(160,180,230,0)'); g.addColorStop(1, 'rgba(160,180,230,.35)'); ctx.fillStyle = g; ctx.fillRect(0, T0 - 50, VW, 50); // the mist they stand in
      ctx.restore();
    }
    if (AR.night > .01) { // the moon goes out, and the whole sky is stars
      const n = AR.night; ctx.save();
      ctx.fillStyle = `rgba(2,3,12,${.72 * n})`; ctx.fillRect(0, Y_OFF, VW, T0 - Y_OFF);
      const mx = VW * TH.sun[0] - camX * .02, my = Y_OFF + VIEW_H * TH.sun[1] + (W5.dawnK || 0) * 46;
      ctx.fillStyle = `rgba(4,6,16,${.95 * n})`; circle(mx, my, 63); ctx.fill(); // eclipsed: a black disc
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(220,230,255,${.55 * n})`; ctx.lineWidth = 2.2; circle(mx, my, 64); ctx.stroke(); // the burning rim of the corona
      for (let i = 0; i < 24; i++) { const a = i / 24 * TAU + t * .02, L = 70 + hsh(i) * 40; ctx.strokeStyle = `rgba(200,215,255,${.12 * n})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(mx + Math.cos(a) * 66, my + Math.sin(a) * 66); ctx.lineTo(mx + Math.cos(a) * L, my + Math.sin(a) * L); ctx.stroke(); }
      for (let i = 0; i < 140; i++) { const x = hsh(i * 3.1) * VW, y = Y_OFF + hsh(i * 7.7) * (T0 - Y_OFF - 6), r = .5 + hsh(i * 1.3) * 1.3, a = (.35 + .5 * hsh(i * 5.5)) * n;
        ctx.fillStyle = `rgba(235,240,255,${a})`; circle(x, y, r); ctx.fill(); if (r > 1.5) { ctx.fillRect(x - r * 2.6, y - .3, r * 5.2, .6); ctx.fillRect(x - .3, y - r * 2.6, .6, r * 5.2); } }
      ctx.restore();
    }
  };
  TH.liveFloor = function (camX, t) {
    _floor.call(this, camX, t);
    if (AR.night > .01) { const n = AR.night; ctx.save(); ctx.fillStyle = `rgba(2,3,14,${.45 * n})`; ctx.globalCompositeOperation = 'source-over'; ctx.fillRect(0, FLOOR_TOP, VW, VH - FLOOR_TOP); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 70; i++) { const x = hsh(i * 2.9 + 1) * VW, y = FLOOR_TOP + 6 + hsh(i * 4.3) * (VH - FLOOR_TOP - 10), a = (.2 + .4 * hsh(i)) * n * (.6 + .4 * Math.sin(t * .5 + i)); ctx.fillStyle = `rgba(220,230,255,${a})`; ell(x, y, 1.6, .7); ctx.fill(); } // the stars, given back by the polished stone
      ctx.restore(); }
    if (AR.army > .01) { ctx.save(); ctx.globalAlpha = AR.army * .5; ctx.strokeStyle = 'rgba(200,214,245,.35)'; ctx.lineWidth = 1; for (let i = 0; i < 9; i++) { const y = FLOOR_TOP + 10 + i * 13; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VW, y); ctx.stroke(); } ctx.restore(); } // the field drawn up in ranks
  };

  // the health bar shows where each of his four shapes ends (index.html marks thirds for the other bosses)
  { const st = document.createElement('style'); st.textContent = '#bossbar.ben4 .bar::before{left:25%}#bossbar.ben4 .bar::after{left:75%}#bossbar.ben4 .bar b{position:absolute;top:0;bottom:0;left:50%;width:2px;background:rgba(21,17,31,.85);z-index:1}#bossbar .bar b{display:none}#bossbar.ben4 .bar b{display:block}'; document.head.appendChild(st);
    const mark = () => { const bb = document.getElementById('bossbar'); if (!bb) return; const on = typeof boss !== 'undefined' && boss && isBen(boss) && !boss.dead; bb.classList.toggle('ben4', !!on); const bar = bb.querySelector('.bar'); if (bar && !bar.querySelector('b')) bar.appendChild(document.createElement('b')); };
    const _ub = updateBossRoom; updateBossRoom = function (dt) { _ub(dt); mark(); }; }

  // ---------------- for tests: jump to a shape, or force an attack ----------------
  // the Hand's rig, at any size, for whoever wears the arm after him (silverarm.js): the wrist at 0,0, the fingers along rot
  W5B.rig = (shape, o = {}) => drawHand(null, {}, o.t || 0, { up: 1, fq: 1, shape, lift: 0, tips: [[44, 0], [16, 0], [-12, 0], [-38, 0]], fix: o.rot || 0, noStump: !o.stump, pump: 0 }, { s: o.s || 1, a: o.a });
  W5B.SHAPE = SHAPE; W5B.ENDS = ENDS; W5B.FIG = FIG;
  W5B.force = (plan) => { if (!boss || !isBen(boss)) return false; const e = boss; hazards = hazards.filter(h => !(h.kind === 'w5ctl' && h.e === e)); e.state = 'idle'; e.plan = plan; e.cd = 0; e.w5T = null; wind(e, .5); return true; };
})();
