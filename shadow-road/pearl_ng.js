'use strict';
// ======================================================================================================
// THE PEARL OF JUDGEMENT IN NEW GAME+ (the relic: save.w7relic, won in Rebma; its first form and its ending: w7_late.js)
// ------------------------------------------------------------------------------------------------------
// In a later cycle (save.cycle >= 1) the Pearl changes how the whole run plays. Two mechanics, each with its own switch
// (PEARL_NG, w7_late.js; the dev panel has a box for each):
//   THE GROWING PEARL (PEARL_NG.grow)  the Pearl starts as a speck at his side and grows a layer from every foe that
//        falls (save.pearlNG.pts; full grown at FULL, about the road's last world). Each world he chooses its shape, in
//        the forge before he walks on or, if he did not, on a card as the world begins:
//          blade   a spinning blade of nacre, close about him, that cuts whatever it touches
//          moon    a big pearl on a wide, slow orbit that strikes hard; Attack + Heavy together flings it ahead
//          mirror  a scallop of nacre held before him: it turns shots back on their throwers and parries a blow
//                  every few seconds
//          tide    a tide-bomb: every few seconds it drops, rolls to the nearest foe and bursts in a wave
//        Damage, size and reach grow with it. It shows on the weapon card (its shape in a ring of gold that fills as it
//        grows) and in the forge (the relic row, where the shape is chosen).
//   CURRENTS, NOT FOOTSTEPS (PEARL_NG.currents)  he does not walk: holding a direction lays a current under him and he
//        glides on it, quick to gather speed and slow to lose it, turning in a curve. Dodge (or a double-tap) throws a
//        strong current that flings him across the street (the dodge's own i-frames and counters are kept): whatever he
//        passes through at speed is struck and thrown, the harder the faster; he comes off the screen's edges and off
//        the big ones like a pinball. An attack at speed carries further and hits harder; a jump keeps the speed.
// The old undertow and splash (PEARL_NG.legacy) are in w7_late.js, switched off.
// Console: pearlNG('grow', false) etc. switches; PEARLNG.grow(n) adds n layers; PEARLNG.form('moon') sets the shape.
// ======================================================================================================
(() => {
  if (!window.W7 || typeof PEARL_NG === 'undefined') { console.error('pearl_ng.js: w7_late.js missing'); return; }
  const SW = PEARL_NG;
  const owned = () => !!(typeof save !== 'undefined' && save && save.w7relic && (save.cycle | 0) >= 1);
  const growOn = () => owned() && SW.grow;
  const curOn = () => owned() && SW.currents;
  const foes = () => enemies.filter(e => !e.dead && e.state !== 'enter' && e.state !== 'w5morph' && e.state !== 'w5riddle');
  const sm = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const bub = (x, y, z, n, sp) => { if (W7.bubbles) W7.bubbles(x, y, z, n, sp); };
  const live = () => typeof mode !== 'undefined' && mode === 'play' && P && stage;

  // ======================================================================================================
  // THE GROWING PEARL: the save, the growth, the shape
  // ======================================================================================================
  const FULL = 170; // layers to full size: every foe one, an armored elite or a champion two, a boss eight (about five worlds' worth)
  const EXPECT = [0, .1, .2, .46, .58, .74, .74, .74]; // how grown it is coming into each world, on an ordinary road (for dev jumps)
  const FORMS = {
    blade:  { name: 'The Nacre Blade', short: 'BLADE', desc: 'Spins close about you and cuts whatever it touches.' },
    moon:   { name: 'The Pearl Moon', short: 'MOON', desc: 'Orbits wide and slow and strikes hard. Attack + Heavy together flings it ahead.' },
    mirror: { name: 'The Mirror of the Sea', short: 'MIRROR', desc: 'Held before you: throws shots back and parries a blow every few seconds.' },
    tide:   { name: 'The Tide-Bomb', short: 'TIDE-BOMB', desc: 'Every few seconds it rolls to the nearest foe and bursts in a wave.' },
  };
  const FORM_ORDER = ['blade', 'moon', 'mirror', 'tide'];
  function PS() { // save.pearlNG: made fresh in each new cycle (and the first time the Pearl wakes)
    let s = save.pearlNG;
    if (!s || typeof s !== 'object' || s.cyc !== (save.cycle | 0)) s = save.pearlNG = { cyc: save.cycle | 0, pts: 0, form: null, formFor: -1 };
    if (!FORMS[s.form]) s.form = null;
    return s;
  }
  const G = () => clamp(PS().pts / FULL, 0, 1);
  const form = () => PS().form || 'blade';
  const layers = () => Math.floor(PS().pts);
  const W = () => (typeof wMult === 'function' && P ? wMult(P.w) : 1); // (it strikes as hard as the weapon in hand is tempered)

  // ---------------- the state of the orb in the street ----------------
  const O = { a: 0, x: 0, y: 0, z: 0, r: 2, on: false, cd: new WeakMap(), moon: null, moonCd: 0, parryCd: 0, flash: 0,
    bomb: { st: 'home', t: 2, x: 0, y: 0, z: 0, vz: 0, tgt: null, re: 1, spin: 0 }, waves: [], stage: null, zone: -1, lastL: -1e9, lastH: -1e9, pop: 0 };
  const CUR = { vx: 0, vy: 0, trail: [], clock: 0, cd: new WeakMap(), wasRun: false, glide: false, lay: 0, layA: 0, bounceT: 0 };
  function resetPlace() {
    O.moon = null; O.waves = []; O.bomb.st = 'home'; O.bomb.t = 1.5; O.bomb.re = 1; O.flash = 0; O.cd = new WeakMap();
    CUR.vx = CUR.vy = 0; CUR.trail = []; CUR.cd = new WeakMap(); CUR.wasRun = false;
    if (P) { O.x = P.x; O.y = P.y; O.z = P.z + 30; }
  }
  const cool = (map, e, t) => { const n = CUR.clock; if ((map.get(e) || -1e9) > n) return false; map.set(e, n + t); return true; };

  // every foe that falls adds a layer
  { const _kill = killEnemy; killEnemy = function (e, dir, m) { const was = e.dead; _kill(e, dir, m);
    if (!was && e.dead && growOn() && live()) { const s = PS(), n0 = Math.floor(s.pts); s.pts = Math.min(FULL * 1.25, s.pts + (e.boss ? 8 : e.elite || e.champ ? 2 : 1));
      O.pop = 1; if (Math.floor(s.pts / 10) > Math.floor(n0 / 10) && s.pts <= FULL) floatText(P.x, P.y, P.z + 92, 'THE PEARL GROWS', '#BFF0E4', 11); } }; }

  // the light, frequent cut (blade, moon's orbit pass): a white number and a flinch, never a critical, no hit freeze
  function nick(e, d, dir, push) {
    if (e.dead || d <= 0) return;
    e.hp -= d; e.flash = .06; floatText(e.x, e.y, e.z + e.hh + 8, String(d), '#FFFFFF', 12);
    if (!e.boss && push && !e.air) e.x += dir * push;
    if (e.hp <= 0) killEnemy(e, dir, { el: 1, kb: 160 });
  }
  const hard = (e, d, dir, m) => { if (!e.dead) strike(e, d, dir, Object.assign({ dmg: d, el: 1, pearl: 1 }, m), true); }; // (the heavy ones: a real blow, and it can crit)
  function touches(e, x, y, z, r) {
    const down = (e.def && e.def.reachDown) || 0;
    return Math.abs(e.x - x) < e.hw + r && Math.abs(e.y - y) < 12 + r * .5 + e.hw * .3 && zOverlap(z - r, r * 2, e.z - down, e.hh + down);
  }
  const nearestFoe = (x, y, range) => { let best = null, bd = range; for (const e of foes()) { const d = Math.hypot(e.x - x, (e.y - y) * 1.6); if (d < bd && e.x > camX - 20 && e.x < camX + VW + 20) { bd = d; best = e; } } return best; };

  // ---------------- each shape, stepped ----------------
  function pearlStep(dt) {
    const g = G(), k = form(), gs = Math.pow(g, .7), t = CUR.clock;
    O.flash = Math.max(0, O.flash - dt); O.pop = Math.max(0, O.pop - dt * 3);
    O.moonCd = Math.max(0, O.moonCd - dt); O.parryCd = Math.max(0, O.parryCd - dt);
    const down = ['down', 'dead'].includes(P.state);
    const bob = Math.sin(t * 2.6) * 2;
    if (k === 'blade') {
      O.a += dt * (6.5 + 2 * g); const R = 24 + 18 * gs; O.r = 2.2 + 4.6 * gs;
      O.x = P.x + Math.cos(O.a) * R; O.y = P.y + Math.sin(O.a) * R * .42; O.z = P.z + 30 + bob * .5;
      if (!down) { const reach = O.r * 2.4, d = Math.max(1, Math.round((3 + 10 * g) * W()));
        for (const e of foes()) if (touches(e, O.x, O.y, O.z, reach) && cool(O.cd, e, .24)) { const dir = Math.sign(e.x - P.x) || P.facing; nick(e, e.boss ? Math.max(1, Math.round(d * .6)) : d, dir, 3);
          sparkle(O.x, O.y, O.z, 4); if (Math.random() < .5) sfx('slice', .2); } }
    } else if (k === 'moon') {
      O.r = 3 + 7 * gs;
      if (!O.moon) { O.a += dt * (2.4 + .5 * g); const R = 48 + 30 * gs, tx = P.x + Math.cos(O.a) * R, ty = P.y + Math.sin(O.a) * R * .4, tz = P.z + 34 + bob;
        const q = Math.min(1, dt * 10); O.x += (tx - O.x) * q; O.y += (ty - O.y) * q; O.z += (tz - O.z) * q;
        if (!down) { const d = Math.max(1, Math.round((8 + 26 * g) * W()));
          for (const e of foes()) if (touches(e, O.x, O.y, O.z, O.r + 4) && cool(O.cd, e, .9)) { const dir = Math.sign(e.x - P.x) || P.facing; hard(e, e.boss ? Math.round(d * .6) : d, dir, { kb: 150 + 140 * g, power: 1 }); sparkle(O.x, O.y, O.z, 8); } } }
      else moonFly(dt, g);
    } else if (k === 'mirror') {
      O.r = 5 + 8 * gs;
      const tx = P.x + P.facing * (21 + 5 * gs), ty = P.y + 1, tz = P.z + 30 + bob * .4, q = Math.min(1, dt * 16);
      O.x += (tx - O.x) * q; O.y += (ty - O.y) * q; O.z += (tz - O.z) * q;
      if (!down) for (const p of projs) { if (p.owner !== 'e' || p.ground || p.orbit) continue;
        if (Math.abs(p.x - O.x) < O.r * .6 + 10 && Math.abs(p.y - O.y) < 20 && Math.abs((p.z || 0) - O.z) < O.r + 22) reflect(p, g); }
    } else if (k === 'tide') {
      O.r = 2.6 + 5.4 * gs; bombStep(dt, g, bob);
    }
    // the waves of the tide-bomb run out and fade
    for (const w of O.waves) w.t += dt;
    O.waves = O.waves.filter(w => w.t < w.max);
  }
  function sparkle(x, y, z, n) { for (let i = 0; i < n && parts.length < 420; i++) { const a = rand(0, TAU), v = rand(40, 140);
    parts.push({ x, y, z, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .3, vz: rand(20, 120), life: .35, max: .35, col: pick(['#FFFFFF', '#D8F4EC', '#F2D68A']), size: rand(1.2, 2.2), shape: 'star', rot: 0, vr: 6 }); } }
  // the moon, flung: out ahead and back, striking everything on the way once
  function flingMoon() {
    if (O.moon || O.moonCd > 0) return false;
    const g = G(); O.moon = { x: O.x, y: P.y, z: P.z + 34, dir: P.facing, d: 0, out: 230 + 150 * g, back: false, hit: new Set(), t: 0 };
    O.moonCd = 2.4 - .8 * g; sfx('whoosh'); sfx('hit-crystal', .3); floatText(P.x, P.y, P.z + 90, 'MOONFLING', '#BFF0E4', 12); return true;
  }
  function moonFly(dt, g) {
    const m = O.moon; m.t += dt;
    if (!m.back) { const v = 600 * dt; m.x += m.dir * v; m.d += v; m.y += (P.y - m.y) * Math.min(1, dt * 3); m.z += ((P.z + 34) - m.z) * Math.min(1, dt * 5);
      if (m.d >= m.out || m.x < leftWall() - 20 || m.x > rightWall() + 20) { m.back = true; m.hit = new Set(); } }
    else { const tx = P.x, ty = P.y, tz = P.z + 34, dx = tx - m.x, dy = ty - m.y, dz = tz - m.z, d = Math.hypot(dx, dy, dz), v = Math.min(d, 760 * dt);
      m.x += dx / (d || 1) * v; m.y += dy / (d || 1) * v; m.z += dz / (d || 1) * v;
      if (d < 16 || m.t > 3) { O.moon = null; O.x = m.x; O.y = m.y; O.z = m.z; O.a = Math.atan2((m.y - P.y) / .4, m.x - P.x); sfx('hit-crystal', .2); return; } }
    O.x = m.x; O.y = m.y; O.z = m.z;
    const d = Math.max(1, Math.round((9 + 26 * g) * W()));
    for (const e of foes()) { if (m.hit.has(e) || !touches(e, m.x, m.y, m.z, O.r + 8)) continue; m.hit.add(e);
      hard(e, e.boss ? Math.round(d * .6) : d, m.back ? -m.dir : m.dir, { kb: 300 + 160 * g, launch: 140, power: 2, wall: 1 }); sparkle(m.x, m.y, m.z, 12); }
    if (Math.random() < dt * 50) parts.push({ x: m.x - m.dir * 6, y: m.y, z: m.z + rand(-3, 3), vx: -m.dir * 40, vy: 0, vz: rand(-10, 20), life: .3, max: .3, col: pick(['#FFFFFF', '#CFEDE3', '#F2D68A']), size: rand(1.4, 2.4), shape: 'star', rot: 0, vr: 3 });
  }
  // the mirror: a shot that reaches it goes back the way it came, harder
  function reflect(p, g) {
    if (p.big && g < .5) return false;
    if (p.big) { p.life = 0; sparkle(p.x, p.y, p.z || 30, 12); sfx('hit-crystal'); O.flash = .3; return true; } // (a great shot is only stopped)
    p.owner = 'p'; p.vx = P.facing * Math.max(280, Math.abs(p.vx || 0) * 1.3); p.vy = 0; p.vz = 0; p.hit = new Set(); p.dmg = Math.round((p.dmg || 10) * (1.5 + 1.5 * g)); p.life = 1.6; p.reflected = true; p.col = '#BFF0E4';
    floatText(O.x, O.y, O.z + 24, 'THROWN BACK', '#BFF0E4', 12); sfx('hit-crystal'); O.flash = .35; sparkle(O.x, O.y, O.z, 10);
    fx.push({ kind: 'ring', x: O.x, y: O.y, z: O.z, t: .25, max: .25, r: 18 + O.r, col: '#BFF0E4' });
    return true;
  }
  // and a blow: once every few seconds it catches it and throws the striker off
  function parry(e, fromX) {
    const g = G(); O.parryCd = 6 - 3 * g; O.flash = .45; P.inv = Math.max(P.inv, .4);
    const dir = Math.sign((e ? e.x : fromX) - P.x) || P.facing; P.facing = dir;
    floatText(P.x, P.y, P.z + 84, 'PARRIED', '#BFF0E4', 15); sfx('hit-metal', .6); sfx('hit-crystal'); hitstop = Math.max(hitstop, .08);
    fx.push({ kind: 'ring', x: P.x + dir * 22, y: P.y, z: P.z + 30, t: .3, max: .3, r: 34, col: '#BFF0E4' }); sparkle(P.x + dir * 22, P.y, P.z + 30, 14);
    if (e && !e.dead) { const d = Math.max(1, Math.round((6 + 16 * g) * W())); hard(e, d, dir, { kb: 280, power: 1 }); if (!e.dead && !e.boss) { e.state = 'hurt'; e.t = Math.max(e.t, .5); e.plan = null; } }
  }
  // the tide-bomb: it waits at his shoulder, drops, rolls to the nearest foe and bursts
  function bombStep(dt, g, bob) {
    const B = O.bomb, home = () => ({ x: P.x - P.facing * 15, y: P.y - 1, z: P.z + 46 + bob });
    B.spin += dt * (B.st === 'roll' ? 14 : 2);
    if (B.st === 'home' || B.st === 're') { const h = home(), q = Math.min(1, dt * 12); B.x += (h.x - B.x) * q; B.y += (h.y - B.y) * q; B.z += (h.z - B.z) * q;
      if (B.st === 're') { B.re = Math.min(1, B.re + dt * 2.4); if (B.re >= 1) { B.st = 'home'; } }
      else { B.t -= dt; if (B.t <= 0 && !['down', 'dead'].includes(P.state)) { const e = nearestFoe(P.x, P.y, 330); if (e) { B.st = 'roll'; B.tgt = e; B.vz = 60; B.life = 0; sfx('hit-goo', .3); } else B.t = .4; } } }
    else if (B.st === 'roll') { B.life += dt;
      const e = B.tgt && !B.tgt.dead ? B.tgt : null; if (e) { B.tx = e.x; B.ty = e.y; }
      const dx = (B.tx ?? B.x) - B.x, dy = (B.ty ?? B.y) - B.y, d = Math.hypot(dx, dy) || 1, v = (250 + 90 * g) * dt;
      B.x += dx / d * Math.min(d, v); B.y += dy / d * Math.min(d, v * .7);
      B.vz -= 900 * dt; B.z = Math.max(O.r, B.z + B.vz * dt); if (B.z <= O.r) { B.vz = 0; if (Math.random() < dt * 30) parts.push({ x: B.x, y: B.y, z: 2, vx: rand(-40, 40), vy: 0, vz: rand(30, 90), life: .35, max: .35, col: pick(['rgba(220,250,245,.9)', 'rgba(160,225,220,.85)']), size: rand(1.5, 2.6), shape: 'puff', rot: 0, vr: 0 }); }
      let hit = d < 6; for (const q of foes()) if (touches(q, B.x, B.y, Math.max(B.z, 8), O.r + 6)) { hit = true; break; }
      if (hit || B.life > 2.2) burstBomb(g); }
    O.x = B.x; O.y = B.y; O.z = B.z;
  }
  function burstBomb(g) {
    const B = O.bomb, r = 48 + 62 * g, d = Math.max(1, Math.round((10 + 30 * g) * W()));
    O.waves.push({ x: B.x, y: B.y, t: 0, max: .9, r, seed: Math.random() * 9 }); if (O.waves.length > 6) O.waves.shift();
    sfx('hit-goo', .8); sfx('slam', .3); shakeMag = Math.max(shakeMag, 4); bub(B.x, B.y, 10, 10, 80);
    for (let i = 0, n = CROWD ? 8 : 16; i < n && parts.length < 420; i++) { const a = rand(0, TAU), sp = rand(40, 140), life = rand(.7, 1.1);
      parts.push({ x: B.x + Math.cos(a) * 6, y: B.y + Math.sin(a) * 2, z: rand(10, 30), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * .3, vz: rand(200, 360), life, max: life, col: pick(['rgba(220,250,245,.9)', 'rgba(160,225,220,.85)', '#FFFFFF']), size: rand(1.6, 2.8), shape: 'puff', rot: 0, vr: 0 }); }
    for (const e of foes()) if (Math.hypot(e.x - B.x, (e.y - B.y) * 2) < r + e.hw && e.z < 80) hard(e, e.boss ? Math.round(d * .6) : d, Math.sign(e.x - B.x) || P.facing, { kb: 240 + 80 * g, launch: 150 + 80 * g, power: 1 });
    B.st = 're'; B.re = 0; B.t = 5 - 2.2 * g; B.tgt = null; B.tx = B.ty = undefined;
  }

  // Attack + Heavy together: the moon flung (the second press within a short beat of the first, either way round)
  function moonInput() {
    const now = CUR.clock;
    if (pressed.light) O.lastL = now; if (pressed.heavy) O.lastH = now;
    if (form() !== 'moon' || ['hurt', 'down', 'dead', 'dodge'].includes(P.state)) return;
    const both = (pressed.light && pressed.heavy) || (pressed.heavy && input.light && now - O.lastL < .16) || (pressed.light && input.heavy && now - O.lastH < .16);
    if (both && flingMoon()) { pressed.light = pressed.heavy = false; P.holdUsed = true; }
  }

  // ======================================================================================================
  // CURRENTS, NOT FOOTSTEPS
  // ======================================================================================================
  // tuning (world units a second; the street's depth is drawn at about .6 of its width, so depth speeds are scaled by YK)
  const T = { cruise: 215, acc: 820, turn: .16, coast: .2, over: .3, overFling: .78, fling: 690, flingDur: .34,
    hitMin: 250, bounce: .78, bounceMin: 90, YK: .62 };
  const LOCO = ['idle', 'walk', 'run'];
  const speedE = () => Math.hypot(CUR.vx, CUR.vy / T.YK); // speed, depth counted as the screen draws it
  const spd = () => (W_SPEED[P.w] || 1) * (P.shrink || 1) * (pw('haste') ? 1.3 : 1) * (1 + gearStat('speed')) * (typeof roomSlow !== 'undefined' ? roomSlow : 1);
  const rightEdge = () => lockX !== null ? lockX + VW - 14 : stage.len - 14;
  function fling(dx, dy) {
    let d = Math.hypot(dx, dy);
    if (d < .2) { const s = speedE(); if (s > 80) { dx = CUR.vx; dy = CUR.vy / T.YK; } else { dx = -P.facing; dy = 0; } d = Math.hypot(dx, dy) || 1; }
    const k = Math.sqrt(P.shrink || 1) * (1 + gearStat('speed') * .5);
    CUR.vx = dx / d * T.fling * k; CUR.vy = dy / d * T.fling * k * T.YK; CUR.flingT = T.flingDur;
    sfx('whoosh'); sfx('hit-goo', .5); bub(P.x, P.y, 8, 8, 60);
    for (let i = 0; i < 10 && parts.length < 420; i++) parts.push({ x: P.x - dx / d * rand(0, 12), y: P.y + rand(-3, 3), z: 2, vx: -dx / d * rand(60, 200) + rand(-30, 30), vy: rand(-12, 12), vz: rand(60, 200), life: .5, max: .5, col: pick(['rgba(220,250,245,.95)', 'rgba(150,215,210,.9)', '#FFFFFF']), size: rand(2, 3.4), shape: 'puff', rot: 0, vr: 0 });
  }
  function bounceFx(x, y, nx) { sfx('hit-goo', .45); shakeMag = Math.max(shakeMag, 3); CUR.bounceT = .2;
    for (let i = 0; i < 8 && parts.length < 420; i++) parts.push({ x, y: y + rand(-4, 4), z: rand(2, 20), vx: nx * rand(40, 160), vy: rand(-20, 20), vz: rand(80, 220), life: .5, max: .5, col: pick(['rgba(220,250,245,.95)', '#FFFFFF', 'rgba(150,215,210,.9)']), size: rand(1.8, 3), shape: 'puff', rot: 0, vr: 0 }); }
  // the glide itself, once the game has had its turn at him (it never walked him: his stick was hidden from it)
  function glide(dt, st0, mx, my, runTap) {
    const st = P.state, s0 = speedE();
    if (st === 'hurt' || st === 'down' || st === 'dead') { CUR.vx = CUR.vy = 0; CUR.glide = false; return; }
    if (st === 'dodge' && st0 !== 'dodge') { fling(mx, my); P.dvx = P.dvy = 0; if (P.dk === 'back') P.vz = Math.min(P.vz, 120); }
    if (st === 'jump' && LOCO.includes(st0)) { P.jvx = CUR.vx; P.jvy = CUR.vy * .7; P.runJump = Math.abs(CUR.vx) > 260; }
    if (st === 'jump' || st === 'air') { CUR.vx = P.jvx || 0; CUR.vy = st === 'jump' ? P.jvy || 0 : 0; CUR.glide = false; return; } // (a jump keeps the speed, and lands with it)
    if (!LOCO.includes(st) && st !== 'dodge') { CUR.vx *= Math.pow(st === 'atk' ? .05 : .01, dt); CUR.vy *= Math.pow(st === 'atk' ? .05 : .01, dt); CUR.glide = false; return; }
    if (runTap && LOCO.includes(st)) fling(mx, my); // a double-tap throws the current as a dodge does (but leaves him open)
    const sp = spd(), inp = Math.hypot(mx, my), dodging = st === 'dodge';
    CUR.flingT = Math.max(0, (CUR.flingT || 0) - dt);
    // lay the current: gather speed along the stick, bleed the part of the speed that goes across it (a curve, not a skid)
    const cr = T.cruise * sp;
    if (inp > .15) { const nx = mx / inp, ny = my / inp, a = T.acc * sp * (dodging ? .35 : 1), top = cr * Math.min(1, inp);
      const vyE = CUR.vy / T.YK; let along = CUR.vx * nx + vyE * ny; const px = CUR.vx - along * nx, py = vyE - along * ny, keep = Math.pow(dodging ? .7 : T.turn, dt);
      if (along < top) along = Math.min(top, along + a * dt * (along < 0 ? 1.6 : 1)); // (up to cruising speed along the stick; a current laid against the way he goes bites harder)
      CUR.vx = along * nx + px * keep; CUR.vy = (along * ny + py * keep) * T.YK;
      CUR.layA = Math.atan2(ny, nx); CUR.lay = Math.min(1, CUR.lay + dt * 5); }
    else { const c = Math.pow(dodging ? .8 : T.coast, dt); CUR.vx *= c; CUR.vy *= c; CUR.lay = Math.max(0, CUR.lay - dt * 3); }
    // over cruising speed (a fling, a bounce) it eases back down, slowly while the fling is still being thrown
    const s = speedE();
    if (s > cr) { const k = (cr + (s - cr) * Math.pow(CUR.flingT > 0 ? T.overFling : T.over, dt)) / s; CUR.vx *= k; CUR.vy *= k; }
    if (speedE() < 4 && inp < .15) { CUR.vx = CUR.vy = 0; }
    P.x += CUR.vx * dt; P.y += CUR.vy * dt;
    // the screen's edges (and a locked fight's walls), the street's near and far sides: off them like a pinball
    // (steered into a wall at cruising speed he only stops against it: it is a thrown body that comes off)
    const L = camX + 14, Rr = rightEdge(), off = (v, push) => Math.abs(v) > T.bounceMin && (!push || Math.abs(v) > cr * 1.15);
    if (P.x < L) { P.x = L; if (CUR.vx < 0 && off(CUR.vx, mx < -.15)) { CUR.vx = -CUR.vx * T.bounce; bounceFx(P.x, P.y, 1); } else CUR.vx = Math.max(0, CUR.vx); }
    if (P.x > Rr) { P.x = Rr; if (CUR.vx > 0 && off(CUR.vx, mx > .15)) { CUR.vx = -CUR.vx * T.bounce; bounceFx(P.x, P.y, -1); } else CUR.vx = Math.min(0, CUR.vx); }
    const y0 = FLOOR_TOP + 6, y1 = FLOOR_BOT;
    if (P.y < y0) { P.y = y0; CUR.vy = CUR.vy < 0 && off(CUR.vy / T.YK, my < -.15) ? -CUR.vy * .6 : Math.max(0, CUR.vy); }
    if (P.y > y1) { P.y = y1; CUR.vy = CUR.vy > 0 && off(CUR.vy / T.YK, my > .15) ? -CUR.vy * .6 : Math.min(0, CUR.vy); }
    // through them at speed: struck and thrown, the harder the faster; the big ones throw him back
    const sE = speedE();
    if (sE > T.hitMin && P.z < 40) for (const e of foes()) {
      if (Math.abs(e.x - P.x) > e.hw + 12 || Math.abs(e.y - P.y) > 16 + e.hw * .3 || e.z > 60) continue;
      const big = e.boss || (e.def.weight || 1) < .7 || (e.def.poise || 0) >= 3;
      if (big) { const nx = P.x - e.x || -Math.sign(CUR.vx) || 1, ny = (P.y - e.y) * 2, nd = Math.hypot(nx, ny) || 1, ux = nx / nd, uy = ny / nd, vyE = CUR.vy / T.YK, dot = CUR.vx * ux + vyE * uy;
        if (dot < 0) { CUR.vx = (CUR.vx - 2 * dot * ux) * T.bounce; CUR.vy = (vyE - 2 * dot * uy) * T.bounce * T.YK; P.x = e.x + ux * (e.hw + 13); bounceFx(P.x, P.y, Math.sign(ux) || 1); } }
      if (!cool(CUR.cd, e, .4)) continue;
      const q = clamp((sE - 200) / 420, .25, 1.4), d = Math.max(1, Math.round((5 + 12 * q) * W() * (e.boss ? .6 : 1))), dir = Math.sign(CUR.vx) || P.facing;
      strike(e, d, dir, { dmg: d, kb: 120 + sE * .55, launch: sE > 480 ? 160 : 0, power: sE > 480 ? 1 : 0, el: 1, current: 1, wall: sE > 480 ? 1 : 0 }, true);
      if (!big) { CUR.vx *= .9; CUR.vy *= .9; }
      bub(e.x, e.y, 20, 4, 60);
    }
    // facing follows the stick (with nothing held, he keeps it: he can drift back with his eyes on them)
    if (LOCO.includes(st)) { if (Math.abs(mx) > .1) P.facing = Math.sign(mx); P.state = sE > 18 || inp > .15 ? 'walk' : 'idle'; P.walk = 0; }
    CUR.glide = LOCO.includes(st) && sE > 18;
    // spray off him at speed
    if (sE > 300 && Math.random() < dt * 40 * Math.min(2, sE / 400) && parts.length < 420) { const a = Math.atan2(CUR.vy, CUR.vx);
      parts.push({ x: P.x - Math.cos(a) * 8 + rand(-4, 4), y: P.y + rand(-2, 2), z: 1, vx: -Math.cos(a) * rand(30, 90) + rand(-40, 40), vy: rand(-10, 10), vz: rand(60, 170), life: .45, max: .45, col: pick(['rgba(230,252,248,.95)', 'rgba(170,230,225,.9)', '#FFFFFF']), size: rand(1.6, 3), shape: 'puff', rot: 0, vr: 0 }); }
    P.y = clamp(P.y, y0, y1); P.x = clamp(P.x, L, Rr);
  }

  // an attack at speed carries further and lands harder
  { const _begin = begin; begin = function (m) {
    if (!curOn() || !m || typeof m !== 'object' || !P) return _begin(m);
    const s = speedE(), b = clamp((s - 140) / 460, 0, 1);
    if (b > 0) m = Object.assign({}, m, { dmg: (m.dmg || 0) * (1 + .5 * b), kb: (m.kb || 0) * (1 + .7 * b), x1: (m.x1 || 0) + 24 * b, curB: b });
    _begin(m);
    if (b > 0 && P.state === 'atk') { P.vx += CUR.vx * .9; CUR.vx *= .35; CUR.vy *= .35; if (b > .4) { fx.push({ kind: 'speed', x: P.x, y: P.y, z: 30, dir: P.facing, t: .25, max: .25 }); bub(P.x, P.y, 10, 4, 50); } }
    else if (b > 0 && P.state === 'air') P.jvx = (P.jvx || 0) * .5 + CUR.vx * .6;
  }; }

  // ======================================================================================================
  // the hooks: his update, the blows on him, the start of each world
  // ======================================================================================================
  const _up = updatePlayer;
  updatePlayer = function (dt) {
    CUR.clock += dt;
    if (O.stage !== stage || O.zone !== (typeof zoneIdx !== 'undefined' ? zoneIdx : 0)) { O.stage = stage; O.zone = typeof zoneIdx !== 'undefined' ? zoneIdx : 0; resetPlace(); }
    const gr = growOn() && live(), cur = curOn() && live();
    if (gr) moonInput();
    const st0 = P.state, mx = input.mx, my = input.my, run = input.run;
    let runTap = false;
    if (cur) {
      const loco = LOCO.includes(st0) && P.z <= 0;
      runTap = loco && run && !CUR.wasRun; CUR.wasRun = run;
      const act = pressed.light || pressed.heavy || pressed.jump || pressed.dodge || pressed.shoot;
      if (loco && !act) { input.mx = 0; input.my = 0; input.run = false; } // (the game's own walk is hidden from it: the current carries him instead)
      else if (loco && pressed.dodge) input.run = false;
    } else { CUR.vx = CUR.vy = 0; CUR.glide = false; CUR.lay = 0; }
    try { _up(dt); } finally { if (cur) { input.mx = mx; input.my = my; input.run = run; } }
    if (cur) glide(dt, st0, mx, my, runTap);
    // the wake behind him
    if (cur && P.z < 6 && speedE() > 40) CUR.trail.push({ x: P.x, y: P.y, t: CUR.clock, s: speedE() });
    while (CUR.trail.length && (CUR.clock - CUR.trail[0].t > .75 || CUR.trail.length > 60)) CUR.trail.shift();
    O.on = gr;
    if (gr) pearlStep(dt);
  };
  // the mirror between him and a blow
  { const _pd = playerDamage; playerDamage = function (dmg, fromX, big) {
    if (growOn() && form() === 'mirror' && P && P.inv <= 0 && P.state !== 'dead' && P.state !== 'dodge' && !(P.state === 'parry' && P.t < .28) && !['down'].includes(P.state)) {
      const src = typeof HIT_SRC !== 'undefined' ? HIT_SRC : null;
      if (src && src.kind === 'proj' && src.p && !src.p.ground && Math.sign(fromX - P.x) === P.facing && reflect(src.p, G())) return;
      if (src && src.kind === 'melee' && O.parryCd <= 0) { parry(src.e, fromX); return; }
    }
    return _pd(dmg, fromX, big);
  }; }
  // his stance on the current: no strides, leaning into the way he is carried
  { const _pp = playerPose; playerPose = function () { const pose = _pp();
    if (curOn() && CUR.glide && LOCO.includes(P.state)) { const s = speedE(), f = CUR.vx * P.facing;
      pose.walk = .55; pose.run = 0; pose.lean = clamp(f / 650, -.3, .5); pose.flow = clamp(f / 45, -10, 14); if (s > 260) pose.crouch = 1; }
    return pose; }; }

  // ======================================================================================================
  // THE CHOICE OF SHAPE: in the forge for the world ahead, or on a card as a world begins if it was not made there
  // ======================================================================================================
  function choose(k, forWorld) { const s = PS(); s.form = k; s.formFor = forWorld; if (P) { O.moon = null; O.bomb.st = 'home'; O.bomb.t = 1.2; O.x = P.x; O.y = P.y; O.z = P.z + 30; } persist(); }
  let pick_ = null;
  function closePicker() { if (pick_) { pick_.el.remove(); pick_ = null; app.classList.remove('nocontrols'); } }
  function openPicker(world) {
    closePicker(); if (!growOn()) return;
    const el = document.createElement('div'); el.id = 'pearlPick';
    el.innerHTML = `<style>
      #pearlPick { position: absolute; inset: 0; z-index: 7; display: flex; align-items: center; justify-content: center; background: radial-gradient(ellipse at 50% 45%, rgba(10,40,48,.78), rgba(4,12,18,.92)); font-family: var(--label, Georgia, serif); color: #EAF6F0; padding: 12px; box-sizing: border-box; }
      #pearlPick .bx { width: min(760px, 100%); max-height: 100%; overflow: auto; text-align: center; }
      #pearlPick .kk { font: 700 11px var(--label, Georgia, serif); letter-spacing: .18em; color: #F2D68A; }
      #pearlPick h2 { margin: 2px 0 2px; font: 700 clamp(16px, 3.4vw, 24px) Cinzel, Georgia, serif; color: #FFFFFF; text-shadow: 0 2px 0 rgba(0,0,0,.5); }
      #pearlPick .sub { font-size: 12px; opacity: .8; margin-bottom: 10px; }
      #pearlPick .row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
      #pearlPick button { all: unset; cursor: pointer; box-sizing: border-box; border-radius: 9px; padding: 6px 6px 8px; border: 1.5px solid rgba(242,214,138,.45); background: linear-gradient(170deg, rgba(40,96,100,.6), rgba(8,28,36,.85)); display: grid; gap: 3px; justify-items: center; transition: transform .08s; }
      #pearlPick button:hover, #pearlPick button:focus-visible, #pearlPick button.sel { border-color: #F2D68A; box-shadow: 0 0 0 2px rgba(242,214,138,.35), 0 0 18px rgba(160,230,215,.35); transform: translateY(-2px); }
      #pearlPick canvas { width: 100%; max-width: 132px; aspect-ratio: 4 / 3; }
      #pearlPick b { font: 700 12px Cinzel, Georgia, serif; color: #F2D68A; letter-spacing: .04em; }
      #pearlPick i { font-style: normal; font-size: 11px; line-height: 1.3; opacity: .9; }
      #pearlPick .n { font-size: 10px; opacity: .55; }
      @media (max-width: 520px) { #pearlPick .row { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    </style><div class="bx"><div class="kk">THE PEARL OF JUDGEMENT · ${layers()} LAYER${layers() === 1 ? '' : 'S'} · ${Math.round(G() * 100)}% GROWN</div>
      <h2>What does the Pearl become in ${STAGES[world] ? STAGES[world].name : 'this world'}?</h2><div class="sub">It keeps this shape for the whole world; you choose again at the next.</div>
      <div class="row">${FORM_ORDER.map((k, i) => `<button type="button" data-k="${k}" class="${k === form() ? 'sel' : ''}"><canvas width="264" height="198"></canvas><b>${FORMS[k].name}</b><i>${FORMS[k].desc}</i><span class="n">${KBD ? i + 1 : ''}</span></button>`).join('')}</div></div>`;
    app.appendChild(el); app.classList.add('nocontrols');
    const prev = mode; mode = 'pearlpick'; pick_ = { el, world, prev, i: Math.max(0, FORM_ORDER.indexOf(form())), t0: performance.now() };
    const cvs = [...el.querySelectorAll('canvas')]; cvs.forEach((c, i) => formCard(c, FORM_ORDER[i], 0));
    let raf = 0; const spin = () => { if (!pick_ || pick_.el !== el) return; const t = (performance.now() - pick_.t0) / 1000; cvs.forEach((c, i) => formCard(c, FORM_ORDER[i], t)); raf = requestAnimationFrame(spin); };
    try { raf = requestAnimationFrame(spin); } catch (e) {}
    el.addEventListener('click', (ev) => { const b = ev.target.closest('button[data-k]'); if (b) take(b.dataset.k); });
    const first = el.querySelector('button.sel') || el.querySelector('button'); if (first) try { first.focus({ preventScroll: true }); } catch (e) {}
  }
  function take(k) {
    if (!pick_) return; const w = pick_.world; closePicker(); choose(k, w);
    if (mode === 'pearlpick') mode = 'play'; clearInput(); for (const q in pressed) pressed[q] = false;
    if (P) { floatText(P.x, P.y, P.z + 96, FORMS[k].name.toUpperCase(), '#F2D68A', 15); sparkle(P.x, P.y, P.z + 40, 18); sfx('learned'); }
  }
  W7.pearlPicker = openPicker; // (tests)
  { const _ok = onKeyMenu; onKeyMenu = (e) => {
    if (mode !== 'pearlpick' || !pick_) return _ok ? _ok(e) : false;
    const n = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3 }[e.code];
    const btns = [...pick_.el.querySelectorAll('button[data-k]')];
    if (n !== undefined) { e.preventDefault(); take(FORM_ORDER[n]); return true; }
    if (/Arrow(Left|Right|Up|Down)|Key[ADWS]/.test(e.code)) { e.preventDefault(); const d = /Left|KeyA|Up|KeyW/.test(e.code) ? -1 : 1; pick_.i = (pick_.i + d + 4) % 4; btns.forEach((b, i) => b.classList.toggle('sel', i === pick_.i)); try { btns[pick_.i].focus({ preventScroll: true }); } catch (_) {} return true; }
    if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space' || e.code === 'KeyJ' || e.code === 'KeyZ') { e.preventDefault(); const f = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.k; take(f || FORM_ORDER[pick_.i]); return true; }
    return true;
  }; }
  // each world as it begins: if the shape was not chosen for it in the forge, the card comes up
  { const _play = play; play = function (i, zone) { closePicker(); const r = _play(i, zone);
    Promise.resolve().then(() => { if (growOn() && mode === 'play' && stageIdx === i && PS().formFor !== i) openPicker(i); }); // (after whatever else starts with the world, the Rim's deck among them)
    return r; }; }

  // ======================================================================================================
  // THE LOOK. Rebma's sea-green, nacre and gold: soft painted shading, an ink line round each piece
  // ======================================================================================================
  // the pearl itself: nacre shading into sea-green, orient bands of rose and gold drifting over it, the edges of its
  // layers (more as it grows) catching the light, a highlight and a glint, the ink line round it
  function pearlBody(x, y, r, t, nl) {
    if (r < .4) return;
    const g = ctx.createRadialGradient(x - r * .38, y - r * .42, r * .05, x + r * .1, y + r * .12, r * 1.05);
    g.addColorStop(0, '#FFFFFF'); g.addColorStop(.22, '#F4FBF7'); g.addColorStop(.55, '#D0EDE3'); g.addColorStop(.82, '#8CC6B9'); g.addColorStop(1, '#4C8A84');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    if (r > 2.4) {
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip(); const a = t * .7;
      ctx.globalAlpha = .34; ctx.fillStyle = '#F6C2D4'; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * r * .3, y + r * .5, r * .95, r * .34, Math.sin(a) * .3, 0, TAU); ctx.fill();
      ctx.globalAlpha = .28; ctx.fillStyle = '#F2D68A'; ctx.beginPath(); ctx.ellipse(x + r * .48, y + Math.sin(a) * r * .22, r * .3, r * .78, -.5, 0, TAU); ctx.fill();
      ctx.globalAlpha = .22; ctx.fillStyle = '#7FD8C8'; ctx.beginPath(); ctx.ellipse(x - r * .55, y + r * .2, r * .3, r * .6, .4, 0, TAU); ctx.fill();
      ctx.globalAlpha = .55; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = Math.max(.3, r * .045);
      for (let i = 1; i <= nl; i++) { const q = 1 - i / (nl + 1.4), o = r * .14 * (1 - q); ctx.beginPath(); ctx.arc(x - o, y - o, r * q, Math.PI * .9 + i * .45, Math.PI * 1.65 + i * .45); ctx.stroke(); }
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.ellipse(x - r * .4, y - r * .45, r * .32, r * .19, -.6, 0, TAU); ctx.fill();
    if (r > 2) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(x + r * .44, y + r * .36, r * .1, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = OUT; ctx.lineWidth = clamp(r * .12, .6, 1.3); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  }
  const nLayers = () => 1 + Math.floor(G() * 5);
  const glow = (x, y, r, rgb, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
  // the nacre blade: three crescent edges of mother-of-pearl, gilt along the cutting side, round a pearl
  function drawBlade(x, y, r, t, spin) {
    const L = r * 2.5;
    for (let i = 0; i < 3; i++) { const a = spin + i * TAU / 3, c = Math.cos, s = Math.sin;
      const p0 = [x + c(a) * r * .6, y + s(a) * r * .6], tip = [x + c(a + 1.05) * L, y + s(a + 1.05) * L], cO = [x + c(a + .45) * L * 1.15, y + s(a + .45) * L * 1.15], cI = [x + c(a + .95) * L * .5, y + s(a + .95) * L * .5], p1 = [x + c(a + .9) * r * .6, y + s(a + .9) * r * .6];
      const lg = ctx.createLinearGradient(p0[0], p0[1], tip[0], tip[1]); lg.addColorStop(0, '#E8F6F0'); lg.addColorStop(.55, '#BFE3D8'); lg.addColorStop(1, '#FFFFFF');
      ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.quadraticCurveTo(cO[0], cO[1], tip[0], tip[1]); ctx.quadraticCurveTo(cI[0], cI[1], p1[0], p1[1]); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#E2BE66'; ctx.lineWidth = Math.max(.5, r * .16); ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.quadraticCurveTo(cO[0], cO[1], tip[0], tip[1]); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,248,220,.9)'; ctx.lineWidth = Math.max(.25, r * .06); ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.quadraticCurveTo(cO[0], cO[1], tip[0], tip[1]); ctx.stroke();
      ctx.strokeStyle = OUT; ctx.lineWidth = clamp(r * .1, .5, 1); ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.quadraticCurveTo(cO[0], cO[1], tip[0], tip[1]); ctx.quadraticCurveTo(cI[0], cI[1], p1[0], p1[1]); ctx.closePath(); ctx.stroke(); }
    pearlBody(x, y, r * .78, t, nLayers());
  }
  // the moon: a great pearl, a sea-green shadow over one side like the moon's, and a ring of gold about it
  function drawMoon(x, y, r, t, front) {
    const ring = (back) => { ctx.save(); ctx.translate(x, y); ctx.rotate(-.32); const a0 = back ? Math.PI : 0, a1 = back ? TAU : Math.PI;
      ctx.strokeStyle = OUT; ctx.lineWidth = Math.max(1, r * .22); ctx.beginPath(); ctx.ellipse(0, 0, r * 1.6, r * .42, 0, a0, a1); ctx.stroke();
      ctx.strokeStyle = '#D6AE58'; ctx.lineWidth = Math.max(.6, r * .13); ctx.beginPath(); ctx.ellipse(0, 0, r * 1.6, r * .42, 0, a0, a1); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,242,190,.85)'; ctx.lineWidth = Math.max(.3, r * .05); ctx.beginPath(); ctx.ellipse(0, -r * .02, r * 1.6, r * .42, 0, a0, a1); ctx.stroke(); ctx.restore(); };
    if (front !== 'front') ring(true);
    if (front !== 'back') {
      pearlBody(x, y, r, t, nLayers());
      if (r > 2.5) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, r * .97, 0, TAU); ctx.clip(); ctx.fillStyle = 'rgba(40,96,104,.32)'; ctx.beginPath(); ctx.arc(x + r * .55, y + r * .2, r * 1.05, 0, TAU); ctx.arc(x + r * 1.2, y + r * .1, r * 1.1, 0, TAU, true); ctx.fill('evenodd'); ctx.restore(); }
      ring(false);
    }
  }
  // the mirror: a scallop of nacre seen a little edge-on, ribbed, rimmed in gold, a pearl at its heart
  function drawMirror(x, y, r, t, facing, flash) {
    ctx.save(); ctx.translate(x, y); ctx.scale(facing * .55, 1);
    const shell = () => { ctx.beginPath(); ctx.moveTo(0, r * 1.05); for (let i = 0; i <= 12; i++) { const a = Math.PI * .62 + i / 12 * Math.PI * 1.76, rr = r * (i % 2 ? .98 : 1.08); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 1.05); } ctx.closePath(); };
    const g = ctx.createLinearGradient(-r, -r, r, r); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.4, '#D8F0E8'); g.addColorStop(.8, '#8FC8BC'); g.addColorStop(1, '#5A9890');
    ctx.fillStyle = g; shell(); ctx.fill();
    ctx.save(); shell(); ctx.clip(); ctx.strokeStyle = 'rgba(70,130,128,.55)'; ctx.lineWidth = Math.max(.4, r * .07);
    for (let i = 0; i < 7; i++) { const a = Math.PI * .75 + i / 6 * Math.PI * 1.5; ctx.beginPath(); ctx.moveTo(0, r * .7); ctx.lineTo(Math.cos(a) * r * 1.1, Math.sin(a) * r * 1.1); ctx.stroke(); }
    ctx.globalAlpha = .45 + .5 * flash; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(-r * .3, -r * .35, r * .22, r * .6, .3, 0, TAU); ctx.fill(); ctx.restore();
    ctx.strokeStyle = '#D6AE58'; ctx.lineWidth = Math.max(.8, r * .16); shell(); ctx.stroke();
    ctx.strokeStyle = OUT; ctx.lineWidth = clamp(r * .08, .5, 1); ctx.save(); ctx.scale(1.08, 1.06); shell(); ctx.restore(); ctx.stroke();
    ctx.restore();
    pearlBody(x, y + r * .55, r * .26, t, 1);
  }
  // the tide-bomb: a pearl in a shell of turning seawater, caged in two hoops of gold
  function drawBomb(x, y, r, t, spin, scale) {
    if (scale <= .02) return; r *= scale; const R = r * 1.5;
    const g = ctx.createRadialGradient(x - R * .3, y - R * .35, R * .1, x, y, R); g.addColorStop(0, 'rgba(230,252,248,.85)'); g.addColorStop(.6, 'rgba(120,200,190,.7)'); g.addColorStop(1, 'rgba(36,104,112,.85)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
    pearlBody(x, y, r * .72, t, nLayers());
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = Math.max(.4, R * .08);
    for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(x, y, R * (.82 - i * .14), spin * (i ? -1 : 1) + i, spin * (i ? -1 : 1) + i + 1.9); ctx.stroke(); } ctx.restore();
    ctx.strokeStyle = '#D6AE58'; ctx.lineWidth = Math.max(.6, R * .1);
    for (let i = 0; i < 2; i++) { const q = Math.abs(Math.cos(spin * .5 + i * Math.PI / 2)); ctx.beginPath(); ctx.ellipse(x, y, Math.max(.3, R * q), R, 0, 0, TAU); ctx.stroke(); }
    ctx.strokeStyle = OUT; ctx.lineWidth = clamp(R * .08, .6, 1.2); ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#E2BE66'; ctx.beginPath(); ctx.arc(x, y - R, Math.max(.6, R * .16), 0, TAU); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = .6; ctx.stroke();
  }
  // the burst: a ring of foam running out over the floor and a crown of seawater thrown up
  function drawWave(w) {
    const u = w.t / w.max, fa = 1 - u, rr = w.r * sm(Math.min(1, u * 2.2)), rise = u < .25 ? Math.sin(u / .25 * Math.PI / 2) : Math.max(0, 1 - Math.pow((u - .25) / .75, 1.5));
    ctx.save();
    ctx.fillStyle = `rgba(40,110,120,${.24 * fa})`; ctx.beginPath(); ctx.ellipse(w.x, w.y, rr, rr / 2.4, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = `rgba(235,255,250,${.9 * fa})`; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.ellipse(w.x, w.y, rr, rr / 2.4, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = `rgba(242,214,138,${.6 * fa})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(w.x, w.y, rr * .82, rr * .82 / 2.4, 0, 0, TAU); ctx.stroke();
    const n = 14, cr = rr * .75;
    for (let i = 0; i < n; i++) { const a = i / n * TAU + w.seed, back = Math.sin(a) < 0, bx = w.x + Math.cos(a) * cr, by = w.y + Math.sin(a) * cr / 2.4, h = (26 + 18 * (((i * 7.3 + w.seed) % 1 + 1) % 1)) * rise, lean = Math.cos(a) * 10 * rise;
      ctx.strokeStyle = back ? `rgba(110,180,185,${.7 * fa + .2})` : `rgba(210,248,240,${.9 * fa + .1})`; ctx.lineWidth = back ? 2.2 : 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + lean * .3, by - h * .6, bx + lean, by - h); ctx.stroke();
      if (h > 4) { ctx.fillStyle = `rgba(255,255,255,${fa})`; ctx.beginPath(); ctx.arc(bx + lean, by - h - 1.5, 1.6, 0, TAU); ctx.fill(); } }
    ctx.restore();
  }
  // the currents on the floor: a dark band of moving water along his wake, foam lines running in it, and the current he
  // is laying just ahead of his feet
  function drawCurrents(t) {
    const tr = CUR.trail, now = CUR.clock;
    if (tr.length > 2) {
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let pass = 0; pass < 4; pass++) {
        for (let i = 1; i < tr.length; i++) { const a = tr[i - 1], b = tr[i], age = (now - b.t) / .75, k = (1 - age) * Math.min(1, b.s / 320); if (k <= .02) continue;
          const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d * .5;
          if (pass === 0) { ctx.strokeStyle = `rgba(28,92,104,${.3 * k})`; ctx.lineWidth = 12 * (.5 + .5 * k); ctx.beginPath(); ctx.moveTo(a.x, a.y + 1); ctx.lineTo(b.x, b.y + 1); ctx.stroke(); continue; }
          const off = (pass - 2) * 4.5 * (.6 + .6 * (1 - k)), wob = Math.sin(b.t * 30 + pass * 2 - t * 6) * 1.4;
          ctx.strokeStyle = pass === 2 ? `rgba(240,255,252,${.75 * k})` : `rgba(170,232,224,${.6 * k})`; ctx.lineWidth = pass === 2 ? 1.6 * k + .4 : 1.1 * k + .3;
          ctx.beginPath(); ctx.moveTo(a.x + nx * (off + wob), a.y + ny * (off + wob) + 1); ctx.lineTo(b.x + nx * (off + wob), b.y + ny * (off + wob) + 1); ctx.stroke(); }
      }
      ctx.restore();
    }
    if (CUR.lay > .05 && P.z < 4) { // the current under his feet, flowing the way the stick holds
      const a = CUR.layA, ca = Math.cos(a), sa = Math.sin(a) * .5, L = 34, al = CUR.lay;
      ctx.save(); ctx.lineCap = 'round';
      ctx.strokeStyle = `rgba(28,92,104,${.22 * al})`; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(P.x - ca * 10, P.y - sa * 10 + 1); ctx.lineTo(P.x + ca * L, P.y + sa * L + 1); ctx.stroke();
      for (let i = 0; i < 4; i++) { const ph = ((t * 2.4 + i / 4) % 1), px = P.x + ca * (-10 + ph * (L + 10)), py = P.y + sa * (-10 + ph * (L + 10)) + 1, side = (i % 2 ? 1 : -1) * 3, ex = -sa * 2 * side, ey = ca * .5 * side;
        ctx.strokeStyle = `rgba(235,255,250,${.75 * al * Math.sin(ph * Math.PI)})`; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(px + ex - ca * 5, py + ey - sa * 5); ctx.lineTo(px + ex + ca * 3, py + ey + sa * 3); ctx.stroke(); }
      ctx.restore();
    }
  }
  // the orb in the street, for whichever shape it has
  function orbItems(list, t) {
    if (!O.on || !P) return;
    const k = form(), r = O.r * (1 + .25 * O.pop), sy = O.y - O.z, spin = t * 15;
    const shadowAt = (x, y, z, rr) => onMain(() => { ctx.fillStyle = `rgba(10,20,30,${clamp(.28 - z / 400, .06, .28)})`; ctx.beginPath(); ctx.ellipse(x, y, rr * 1.2, rr * .4, 0, 0, TAU); ctx.fill(); });
    if (k === 'tide') { const B = O.bomb, sc = B.st === 're' ? sm(B.re) : 1;
      list.push([B.y - .02, () => { shadowAt(B.x, B.y, B.z, r * 1.4 * sc); onMain(() => glow(B.x, B.y - B.z, r * 4 * sc, '150,230,215', .25)); }]);
      list.push([B.y + .05, () => drawBomb(B.x, B.y - B.z, r, t, B.spin, sc)]); }
    else if (k === 'mirror') { const f = O.parryCd <= 0 ? .5 + .5 * Math.sin(t * 5) : 0;
      list.push([O.y - .02, () => { shadowAt(O.x, O.y, O.z, r); onMain(() => glow(O.x, sy, r * 3.2, '170,240,225', .16 + .25 * f + O.flash)); }]);
      list.push([P.y + .3, () => drawMirror(O.x, sy, r, t, P.facing, Math.max(O.flash * 2, f * .4))]); }
    else if (k === 'moon') {
      list.push([O.y - .02, () => { shadowAt(O.x, O.y, O.z, r); onMain(() => glow(O.x, sy, r * 3.5, '190,240,230', .22)); }]);
      list.push([O.y - .01, () => drawMoon(O.x, sy, r, t, 'back')]); list.push([O.y + .02, () => drawMoon(O.x, sy, r, t, 'front')]);
      if (O.moon) list.push([O.y - .03, () => onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const m = O.moon, dir = m.back ? -m.dir : m.dir; const lg = ctx.createLinearGradient(m.x, 0, m.x - dir * 60, 0); lg.addColorStop(0, 'rgba(200,250,240,.5)'); lg.addColorStop(1, 'rgba(200,250,240,0)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.ellipse(m.x - dir * 30, sy, 32, r * .8, 0, 0, TAU); ctx.fill(); ctx.restore(); })]); }
    else { list.push([O.y - .02, () => { shadowAt(O.x, O.y, O.z, r * 1.6); onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(190,245,235,.22)'; ctx.lineWidth = r * 1.6; ctx.beginPath(); ctx.arc(O.x, sy, r * 1.7, spin, spin + 4.2); ctx.stroke(); ctx.restore(); glow(O.x, sy, r * 3.4, '190,245,235', .2); }); }]);
      list.push([O.y + .01, () => drawBlade(O.x, sy, r, t, spin)]); }
    for (const w of O.waves) list.push([w.y + 6, () => onMain(() => drawWave(w))]);
  }
  { const _mb = mechBoxes; mechBoxes = function (box) { _mb(box); if (O.on) { box(O.x, O.y, O.z, 50, 60); if (form() === 'tide') box(O.bomb.x, O.bomb.y, O.bomb.z, 50, 60); } }; }
  { const _ml = mechList; mechList = function (list, t) { _ml(list, t);
    if (curOn() && (CUR.trail.length > 2 || CUR.lay > .05)) list.push([FLOOR_TOP - 4, () => onMain(() => drawCurrents(t))]);
    orbItems(list, t); }; }

  // ---------------- its picture, for the cards and the HUD ----------------
  // (each drawn into its own little canvas with the world painters, ctx swapped for the canvas's own)
  function withCtx(g, fn) { const old = ctx; ctx = g; try { fn(); } finally { ctx = old; } }
  function formIcon(kind, x, y, s, t, gk) { // a shape, centred at x,y, at a size of about 2s
    const r = s * (.45 + .55 * gk);
    if (kind === 'blade') drawBlade(x, y, r * .5, t, t * 3);
    else if (kind === 'moon') { drawMoon(x, y, r * .62, t); }
    else if (kind === 'mirror') { ctx.save(); ctx.translate(x, y); ctx.scale(1.6, 1); ctx.translate(-x, -y); drawMirror(x, y, r * .8, t, 1, .2); ctx.restore(); }
    else if (kind === 'tide') drawBomb(x, y, r * .55, t, t * 2, 1);
    else pearlBody(x, y, r * .5, t, 2);
  }
  function formCard(cv2, kind, t) {
    const g = cv2.getContext('2d'), w = cv2.width, h = cv2.height;
    withCtx(g, () => { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h);
      const bg = g.createRadialGradient(w / 2, h * .45, 4, w / 2, h * .5, w * .62); bg.addColorStop(0, '#2E6E70'); bg.addColorStop(.6, '#123A44'); bg.addColorStop(1, '#06161C'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(150,230,215,.12)'; g.lineWidth = 2; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(w / 2, h * .82, w * (.12 + i * .1), h * (.04 + i * .025), 0, 0, TAU); g.stroke(); } g.restore();
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(w / 2, h * .82, w * .14, h * .04, 0, 0, TAU); g.fill();
      const s = h * .3; g.save(); g.translate(0, Math.sin(t * 2) * h * .015); glow(w / 2, h * .46, s * 2.2, '190,245,235', .25); formIcon(kind, w / 2, h * .46, s, t, Math.max(.75, G())); g.restore();
      g.strokeStyle = 'rgba(242,214,138,.55)'; g.lineWidth = 2; g.strokeRect(5, 5, w - 10, h - 10); });
  }
  // the weapon card's badge: its shape, a ring of gold filling as it grows, and an inner ring of sea-green as its next
  // trick (the fling, the parry, the bomb) gathers
  let hudCv = null, hudN = 0;
  function hudBadge() {
    if (!hudCv) { const card = document.querySelector('.wcard'); if (!card) return; hudCv = document.createElement('canvas'); hudCv.id = 'pearlNgHud'; hudCv.width = 64; hudCv.height = 64;
      hudCv.style.cssText = 'position:absolute;right:-15px;top:-13px;width:28px;height:28px;pointer-events:none;filter:drop-shadow(0 1px 2px rgba(0,0,0,.7))'; card.appendChild(hudCv); }
    const on = growOn(); hudCv.hidden = !on; if (!on) return;
    if ((hudN++ % 4) && hudCv.dataset.k === form()) return; hudCv.dataset.k = form();
    hudCv.title = `The Pearl of Judgement: ${FORMS[form()].name} · ${layers()} layers · ${Math.round(G() * 100)}% grown`;
    const g = hudCv.getContext('2d'), t = performance.now() / 1000, gk = G(), k = form();
    const ready = k === 'moon' ? (O.moon ? 0 : 1 - O.moonCd / (2.4 - .8 * gk)) : k === 'mirror' ? 1 - O.parryCd / (6 - 3 * gk) : k === 'tide' ? (O.bomb.st === 'home' ? 1 - clamp(O.bomb.t / (5 - 2.2 * gk), 0, 1) : 0) : 1;
    withCtx(g, () => { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 64, 64);
      const bg = g.createRadialGradient(32, 28, 2, 32, 32, 28); bg.addColorStop(0, '#2A6A6C'); bg.addColorStop(1, '#071A20'); g.fillStyle = bg; g.beginPath(); g.arc(32, 32, 27, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(20,14,8,.9)'; g.lineWidth = 6; g.beginPath(); g.arc(32, 32, 28, 0, TAU); g.stroke();
      g.strokeStyle = '#F2D68A'; g.lineWidth = 4; g.beginPath(); g.arc(32, 32, 28, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(.02, gk)); g.stroke();
      if (k !== 'blade') { g.strokeStyle = ready >= 1 ? '#BFF0E4' : 'rgba(120,200,190,.7)'; g.lineWidth = 2.2; g.beginPath(); g.arc(32, 32, 22.5, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(ready, 0, 1)); g.stroke(); }
      formIcon(k, 32, 33, 15, t, Math.max(.6, gk)); });
  }
  { const _ht = hudTick; hudTick = function () { _ht(); try { hudBadge(); } catch (e) {} }; }

  // ---------------- the forge: the relic row's words, and the choice of shape for the world ahead ----------------
  W7.ngText = () => {
    const grow = 'THE GROWING PEARL: it starts as a speck at your side and grows a layer from every foe you defeat, to its full size by the road\'s last world. Each world you choose what it becomes: a spinning blade of nacre, a moon that orbits wide and strikes hard (Attack + Heavy together flings it), a mirror that throws shots back and parries a blow every few seconds, or a tide-bomb that rolls at the nearest foe and bursts in a wave.';
    const cur = 'CURRENTS, NOT FOOTSTEPS: you do not walk, you ride the sea. Hold a direction to lay a current and glide on it; Dodge (or a double-tap) flings you across the street through whatever is in the way, off the edges and the big ones like a pinball; an attack at speed carries further and hits harder.';
    const on = [SW.grow ? grow : '', SW.currents ? cur : ''].filter(Boolean).join(' ');
    if (!owned()) return `The sea's reflection of the Jewel of Judgement, out of the King in the Glass. In New Game+ it wakes and changes the whole road. ${on || '(Its New Game+ powers are switched off.)'}`;
    return on ? `The sea's reflection of the Jewel of Judgement. ${on}${SW.grow ? ` It has ${layers()} layer${layers() === 1 ? '' : 's'} (${Math.round(G() * 100)}% grown).` : ''}` : 'The sea\'s reflection of the Jewel of Judgement. (Its New Game+ powers are switched off.)';
  };
  { const _of = openForge; openForge = function (kicker) { _of(kicker); try { forgeRow(); } catch (e) { console.error(e); } }; }
  function forgeRow() {
    const row = document.getElementById('w7relicRow'); if (!row) return;
    let box = document.getElementById('pearlForms');
    withCtx(row.firstChild.getContext('2d'), () => { const g = ctx; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 40, 40); formIcon(growOn() ? form() : 'pearl', 20, 21, 12, 0, growOn() ? Math.max(.5, G()) : 1); });
    if (!growOn()) { if (box) box.remove(); return; }
    row.style.flexWrap = 'wrap';
    if (!box) { box = document.createElement('div'); box.id = 'pearlForms'; box.style.cssText = 'flex:1 1 100%;display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:6px;margin-top:4px'; row.appendChild(box); }
    const wi = roadStage(), chosen = PS().formFor === wi;
    box.innerHTML = `<div style="grid-column:1/-1;font:700 11px var(--label,Georgia,serif);letter-spacing:.12em;color:#BFF0E4">${chosen ? 'THE PEARL\'S SHAPE' : 'CHOOSE THE PEARL\'S SHAPE'} FOR ${(STAGES[wi] ? STAGES[wi].name : 'THE NEXT WORLD').toUpperCase()}</div>` +
      FORM_ORDER.map(k => { const sel = chosen && form() === k; return `<button type="button" data-k="${k}" style="all:unset;cursor:pointer;box-sizing:border-box;display:grid;gap:2px;justify-items:center;text-align:center;padding:5px;border-radius:8px;border:1.5px solid ${sel ? '#F2D68A' : 'rgba(242,214,138,.3)'};background:${sel ? 'rgba(60,120,120,.55)' : 'rgba(8,28,36,.6)'};box-shadow:${sel ? '0 0 12px rgba(160,230,215,.35)' : 'none'}"><canvas width="192" height="120" style="width:100%;max-width:120px;aspect-ratio:8/5"></canvas><b style="font:700 11px Cinzel,Georgia,serif;color:#F2D68A">${FORMS[k].name}${sel ? ' ✓' : ''}</b><span style="font-size:10.5px;line-height:1.3;opacity:.85">${FORMS[k].desc}</span></button>`; }).join('');
    box.querySelectorAll('canvas').forEach((c, i) => formCard(c, FORM_ORDER[i], .4 + i));
    box.querySelectorAll('button[data-k]').forEach(b => b.addEventListener('click', () => { choose(b.dataset.k, roadStage()); sfx('buy'); forgeRow(); }));
  }

  // ---------------- for the dev panel and tests ----------------
  window.PEARLNG = {
    state: () => ({ owned: owned(), grow: growOn(), currents: curOn(), pts: PS().pts, g: G(), form: form(), formFor: PS().formFor, vx: CUR.vx, vy: CUR.vy, speed: speedE(), orb: { x: O.x, y: O.y, z: O.z, r: O.r }, bomb: O.bomb.st, moon: !!O.moon, parryCd: O.parryCd }),
    grow: (n = 10) => { PS().pts = clamp(PS().pts + n, 0, FULL * 1.25); return G(); },
    setPts: (n) => { PS().pts = n; return G(); },
    form: (k) => { if (FORMS[k]) choose(k, typeof stageIdx !== 'undefined' ? stageIdx : 0); return form(); },
    fling: flingMoon, picker: openPicker, take, FULL, T, O, CUR,
    devJump: (i) => { if (!owned()) return; const s = save.pearlNG = { cyc: save.cycle | 0, pts: Math.round(FULL * (EXPECT[i] || 0)), form: (save.pearlNG && save.pearlNG.form) || null, formFor: -1 }; return s; },
  };
})();
