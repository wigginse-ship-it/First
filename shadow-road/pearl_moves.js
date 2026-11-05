'use strict';
// ======================================================================================================
// THE PEARL REFORGED: EACH KIND ITS OWN GAME (pearl_weapon.js forges it; pearl_ng.js has the Pearl and its throw)
// ------------------------------------------------------------------------------------------------------
// Each of the eight kinds the Pearl can be reforged into fights in a way nothing else in his hands does: its own
// moves, its own poses, its own trick that runs through the whole moveset. Light + Heavy (the PEARL button) still
// throws the pearl out and back, the signature of every kind (pearl_ng.js). Every blow still carries the Current's
// tricks (pearl_weapon.js, the strike hook: m.pe), and the Currents twist each kind's big trick.
//   GLAIVE        ECHOES      blows leave sea-ghosts of him that copy whatever he does next; Heavy calls them home
//   SWORD-STAFF   THE BEAT    a metronome of the tide: blows on the beat hit harder and build a tempo; drop it
//   FLAIL         MOON TIDES  blows lift foes adrift in the air; Heavy brings every one of them crashing down
//   CHAKRAM       SATELLITES  casts become little moons that orbit him; Heavy looses them, held they align
//   SPEAR+SHIELD  GRIT        held Heavy raises the shell: every blow it catches becomes a layer of a growing pearl
//   WARSHIELD     THE REEF    Heavy plants the shield in the street; bare-handed, he drives foes into it
//   TRIDENT       FLOODGATE   Heavy floods the street; the water slows them and feeds every move; held, it drains
//   LANCE         NECKLACE    every foe pierced is strung on a thread of light; Heavy pulls the clasp tight
// Poses: each move its own keyframes (KF, below), on the shared skeleton, with the forged weapon's own picture.
// Console: PEARLM.forge('chakram') forges one of that kind in hand (dev games, or tests).
// ======================================================================================================
(() => {
  const PW = window.PEARLW, PN = window.PEARLNG;
  if (!PW || !PN || typeof WEAPONS === 'undefined') { console.error('pearl_moves.js: pearl_weapon.js missing'); return; }
  const ID = 'pearlw', TWO = Math.PI * 2, PI = Math.PI;
  const WP = () => WEAPONS[ID];
  const SPEC = () => (WP() && WP().pearl) || null;
  const mine = () => !!(P && P.w === ID && WP() && WP().pm && SPEC());
  const kind = () => (SPEC() ? SPEC().type : null);
  const fc = () => P.facing;
  const sst = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const spn = (k, a, b) => clamp((k - a) / (b - a), 0, 1);
  const wm = () => (typeof wMult === 'function' && save.wl[ID] ? wMult(ID) : 1);
  const clock = () => PN.CUR.clock;
  const foes = () => enemies.filter(e => !e.dead && e.state !== 'enter' && e.state !== 'w5morph' && e.state !== 'w5riddle');
  const pal = () => (SPEC() ? SPEC().pal : PN.PAL.pearl);
  const rgb = () => pal().glow;
  const glow = (x, y, r, a, col) => PN.art.glow(x, y, r, col || rgb(), a);
  const sparkle = (x, y, z, n, cols) => PN.art.sparkle(x, y, z, n, cols || [pal().edge, pal().b[2], pal().metalLt]);
  const cur = () => (SPEC() ? SPEC().cur : null);
  const S0 = () => PN.curStats();
  // a foe struck by one of these moves' own things (a ghost's cut, a moon, a wave): a real blow, carrying the Current
  function hitE(e, base, dir, m, extra) {
    if (!e || e.dead) return false;
    const hp0 = e.hp, mm = Object.assign({ dmg: base, kb: 120, power: 1 }, m || {}, extra || {});
    strike(e, Math.max(1, base * wm() * (e.boss ? (mm.bossK ?? .8) : 1)), dir || fc(), mm);
    return e.hp < hp0 || e.dead;
  }
  function touch(e, x, y, z, r) {
    const down = (e.def && e.def.reachDown) || 0;
    return Math.abs(e.x - x) < e.hw + r && Math.abs(e.y - y) < 12 + r * .5 + e.hw * .3 && zOverlap(z - r, r * 2, e.z - down, e.hh + down);
  }
  function segD(e, x0, y0, x1, y1) { // how far a foe stands from a stretch of street (depth counted double)
    const dx = x1 - x0, dy = (y1 - y0) * 2, L2 = dx * dx + dy * dy, t = L2 ? clamp(((e.x - x0) * dx + (e.y - y0) * 2 * dy) / L2, 0, 1) : 0;
    return Math.hypot(e.x - (x0 + dx * t), (e.y - (y0 + (y1 - y0) * t)) * 2);
  }
  const nearest = (x, y, range, not, pred) => { let best = null, bd = range; for (const e of foes()) { if (e === not || (pred && !pred(e))) continue; const d = Math.hypot(e.x - x, (e.y - y) * 1.6); if (d < bd) { bd = d; best = e; } } return best; };
  const inFront = (range, depth = 40) => nearest(P.x + fc() * range * .5, P.y, range, null, (e) => (e.x - P.x) * fc() > -14 && (e.x - P.x) * fc() < range && Math.abs(e.y - P.y) < depth);
  const note = (txt, col, size = 13, z = 96) => floatText(P.x, P.y, P.z + z, txt, col || '#F2D68A', size);
  const once = (key, k, at, fn) => { const id = P.moveId + ':' + key; if (k >= at && !P._pmOnce?.has(id)) { if (!P._pmOnce || P._pmOnce.size > 60) P._pmOnce = new Set(); P._pmOnce.add(id); fn(); return true; } return false; };
  const bubbles = (x, y, z, n, sp) => { if (window.W7 && W7.bubbles) W7.bubbles(x, y, z, n, sp); };

  // ======================================================================================================
  // POSES FROM KEYFRAMES. Each frame names what changes (the rest carries on from the frame before):
  //   a arm, e elbow, g grip, x ext, l lean, s sink, y yaw, sh shift, ba backArm, be backElbow, sp spin, r rot,
  //   oy drop, fl flow, st stretch, lg [front, back, front knee, back knee], th both hands, gg their gap,
  //   oh open hand, cr crouch, w the thing in his hand ('fists' for none), sw sweep, kk a kick (0..1)
  // o.tr: the trails, [from k, to k]; o.fn(pose, m, k): anything the frames can't say
  // ======================================================================================================
  const FIELD = { a: 'arm', e: 'elbow', g: 'grip', x: 'ext', l: 'lean', s: 'sink', y: 'yaw', sh: 'shift', ba: 'backArm', be: 'backElbow', sp: 'spin', r: 'rot', oy: 'oy', fl: 'flow', st: 'stretch' };
  const BASE = { a: .4, e: .2, g: 0, x: 0, l: .08, s: 2, y: 0, sh: 0, ba: 1.35, be: .3, sp: 0, r: 0, oy: 0, fl: 0, st: 1, lg: [8, -8, 3, 3], th: 0, gg: 12, oh: 0, cr: 0, w: null, sw: null, kk: null };
  function KF(frames, o = {}) {
    const F = []; let c = BASE;
    for (const [k, v] of frames) { c = Object.assign({}, c, v); F.push([k, c]); }
    const at = (k) => { let i = 0; while (i < F.length - 2 && k >= F[i + 1][0]) i++; const [k0, A] = F[i], [k1, B] = F[Math.min(i + 1, F.length - 1)];
      return [A, B, k1 > k0 ? sst((k - k0) / (k1 - k0)) : 1]; };
    const armAt = (k) => { const [A, B, q] = at(k); return lerp(A.a, B.a, q); };
    return (pose, m, k) => {
      const [A, B, q] = at(k), L = (f) => lerp(A[f], B[f], q);
      for (const f in FIELD) pose[FIELD[f]] = L(f);
      pose.legs = { f: lerp(A.lg[0], B.lg[0], q), b: lerp(A.lg[1], B.lg[1], q), fk: lerp(A.lg[2], B.lg[2], q), bk: lerp(A.lg[3], B.lg[3], q) };
      const D = q < .5 ? A : B;
      pose.twoHand = D.th ? 1 : 0; pose.gripGap = D.gg; pose.openHand = D.oh ? 1 : 0; pose.crouch = D.cr ? 1 : 0;
      if (D.w) pose.weapon = D.w;
      if (A.sw !== null && B.sw !== null) pose.sweep = L('sw'); else delete pose.sweep;
      if (A.kk !== null || B.kk !== null) { const kk = lerp(A.kk || 0, B.kk || 0, q); if (kk > .02) { pose.kickK = .5; pose.kickH = [.3, .7]; pose.kickStyle = D.ks || 'lunge'; pose.kickAir = P.z > 2; } }
      pose.trail = 0; pose.streak = null; pose.flat = null; pose.walk = 0;
      if (o.tr) for (const [a, b] of o.tr) if (k >= a && k <= b + .08) { pose.trail = (WP().reach || 60) + 16; pose.trailFrom = armAt(a); pose.trailCol = m.perfect ? 'rgba(255,240,190,.98)' : pal().trail; pose.trailW = o.trW || 6; }
      if (o.fn) o.fn(pose, m, k);
    };
  }
  const POSE = (type, map) => { for (const k in map) MOVE_POSE['pm:' + type + ':' + k] = map[k]; };

  // ======================================================================================================
  // THE STATE OF THE STREET: what each kind has left about (reset with each place)
  // ======================================================================================================
  const S = { stage: null, zone: -1, objs: [], path: [], presses: [], begun: -1, ev: {} };
  // what each kind's trick has done (a count per event, for the tests and the dev panel)
  const ev = (k) => { S.ev[k] = (S.ev[k] || 0) + 1; };
  const TY = {};
  function resetPlace() { S.objs = []; S.path = []; for (const t in TY) if (TY[t].reset) TY[t].reset(); }
  const addObj = (o) => { if (S.objs.length < 60) S.objs.push(o); return o; };

  // ======================================================================================================
  // BUILDING THE TREE: the kind's moves, then the Form, Temper and the hybrid's piece on top
  // ======================================================================================================
  // ======================================================================================================
  // THE FORGED STATS. Every one of the five picks adds three points (a combined trait four) to seven stats, so a
  // focused build peaks in one and a spread one is even; none is simply better. The Form leans to Power, Reach or
  // Guard; a Current to Flow and a little of its own; a Temper to Speed, Impact or Crit (Patient: a wider gleam).
  // ======================================================================================================
  const STATS = ['pow', 'spd', 'rch', 'crit', 'imp', 'grd', 'flow'];
  const STAT_NAME = { pow: 'Power', spd: 'Speed', rch: 'Reach', crit: 'Crit', imp: 'Impact', grd: 'Guard', flow: 'Flow', win: 'Gleam' };
  const TRAIT_STATS = {
    crescent: { pow: 2, crit: 1 }, serrate: { pow: 1, crit: 2 }, moon: { imp: 2, pow: 1 }, tether: { rch: 2, imp: 1 }, coral: { grd: 2, imp: 1 }, scallop: { grd: 2, rch: 1 }, narwhal: { rch: 2, pow: 1 }, tines: { rch: 1, pow: 1, crit: 1 },
    undertow: { flow: 2, imp: 1 }, breaker: { flow: 1, imp: 2 }, shardfall: { flow: 2, crit: 1 }, weeping: { flow: 2, pow: 1 }, static: { flow: 2, spd: 1 }, squall: { flow: 2, pow: 1 }, blacktide: { flow: 2, grd: 1 }, drowning: { flow: 2, grd: 1 },
    quickwater: { spd: 3 }, riptide: { spd: 2, grd: 1 }, deep: { imp: 2, pow: 1 }, anchor: { imp: 2, grd: 1 }, moonstruck: { crit: 2, flow: 1 }, rogue: { crit: 2, spd: 1 }, still: { crit: 1, pow: 1, win: 1 }, slack: { grd: 1, pow: 1, win: 1 },
    thunder: { pow: 2, flow: 1, spd: 1 }, maelstrom: { imp: 2, flow: 2 }, corallance: { rch: 2, pow: 1, flow: 1 }, heldthunder: { crit: 2, pow: 1, win: 1 },
  };
  function statsOf(picks) {
    const p = { pow: 0, spd: 0, rch: 0, crit: 0, imp: 0, grd: 0, flow: 0, win: 0 };
    for (const id of picks || []) { const t = TRAIT_STATS[id]; if (t) for (const s in t) p[s] += t[s]; }
    return { p, pow: 1 + .065 * p.pow, spd: Math.max(.74, 1 - .032 * p.spd), rch: 1 + .04 * p.rch, crit: .022 * p.crit, imp: 1 + .08 * p.imp, grd: Math.max(.55, 1 - .045 * p.grd), flow: .06 * p.flow, win: .06 * p.win };
  }
  const stat = () => (SPEC() && SPEC().stats) || statsOf([]);
  const FORGED_K = 1.45; // the reforged Pearl is the last weapon of the run, and it should feel it: every blow of its moveset (its own things included) lands 45% harder than its numbers
  const pct = (v) => Math.round(v * 100);
  function statLines(st) {
    const out = [];
    if (st.p.pow) out.push(`blows ${pct(st.pow - 1)}% harder`); if (st.p.spd) out.push(`${pct(1 - st.spd)}% quicker`); if (st.p.rch) out.push(`reach +${pct(st.rch - 1)}%`);
    if (st.p.crit) out.push(`crit +${(st.crit * 100).toFixed(1)}%`); if (st.p.imp) out.push(`knockback +${pct(st.imp - 1)}%`); if (st.p.grd) out.push(`damage taken −${pct(1 - st.grd)}%`);
    if (st.p.flow) out.push(`Current procs +${pct(st.flow)}%`); if (st.p.win) out.push(`gleam +${st.win.toFixed(2)}s`);
    return out;
  }
  function statsHtml(spec) {
    const st = spec.stats || statsOf(spec.picks), top = Math.max(6, ...STATS.map(s => st.p[s]));
    const bar = (s) => `<div style="display:flex;align-items:center;gap:6px;font:700 10px Georgia,serif;letter-spacing:.06em"><span style="width:46px;text-align:right;opacity:.85">${STAT_NAME[s].toUpperCase()}</span><span style="flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.14);overflow:hidden"><span style="display:block;height:100%;width:${Math.round(100 * st.p[s] / top)}%;background:linear-gradient(90deg,#9FE2D3,#F2D68A)"></span></span><span style="width:12px;opacity:.8">${st.p[s]}</span></div>`;
    return `<div class="pmStats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(130px,100%),1fr));gap:2px 14px;margin:4px auto 6px;width:100%;max-width:520px;box-sizing:border-box">${STATS.map(bar).join('')}</div><div class="pmStatTx" style="font-size:10.5px;opacity:.75;margin-bottom:6px">${statLines(st).join(' · ') || 'Even all round.'}</div>`;
  }

  const HEAVYK = /H|X/;
  function build(spec) {
    const T = TY[spec.type]; if (!T) return null;
    const st = spec.stats = statsOf(spec.picks), t = T.tree(spec);
    const reachK = clamp((1 + .06 * (spec.len - 1)) * st.rch, .9, 1.45);
    for (const k in t) {
      const m = t[k]; m.key = m.key || k; m.pm = spec.type;
      if (m.x1 && m.x1 > 0) m.x1 = Math.round(m.x1 * reachK);
      if (m.depth) m.depth = Math.round(m.depth + st.p.rch);
      const heavy = HEAVYK.test(k.replace(/^p/, ''));
      m.dur *= st.spd;
      if (st.p.imp >= 5 && !heavy && !m.power) m.power = 1;
      m.pe = Math.min(.95, (m.pe ?? (heavy ? .55 : .3)) + st.flow);
      if (k === 'HC' && st.win) m.desc = (m.desc || '') + ` Gleam +${st.win.toFixed(2)}s.`;
      m.dmg = Math.max(0, Math.round(m.dmg || 0)); m.dur = Math.max(.16, m.dur);
      if (m.fin && m.fin.dmg) m.fin.dmg = Math.round(m.fin.dmg);
    }
    const sig = PN.stats(spec.picks, true);
    t.SIG = { name: sig.name, key: 'SIG', pm: spec.type, seq: ['A', '+H'], dur: .3, h: [.3, .6], x0: 0, x1: 40, dmg: 1, kb: 40, arc: [.3, -.3], pe: 0,
      desc: `The pearl, thrown out and back${sig.charge ? ' (hold both, let go in the gleam)' : ''}.` };
    return { tree: t, reachK, sig, pm: true };
  }
  // the forge card's rows: [what it does, how, its name]
  function rows(W) {
    const spec = W.pearl || SPEC(), T = spec && TY[spec.type]; if (!T) return [];
    return T.rows(W.tree, spec);
  }

  // ======================================================================================================
  // THE HOOKS
  // ======================================================================================================
  { const _mpk = movePoseKey; movePoseKey = function (m) { return m && m.pm && P.w === ID ? 'pm:' + m.pm + ':' + m.key : _mpk(m); }; }
  { const _me = moveExtras; moveExtras = function (m, k, dt, air) { if (_me(m, k, dt, air)) return true; if (!m.pm || !mine()) return false; const T = TY[m.pm]; return T && T.extras ? !!T.extras(m, k, dt, air) : false; }; }
  { const _b = begin; begin = function (m) {
    if (m && typeof m === 'object' && m.pm && mine()) { const T = TY[m.pm]; if (T && T.pick) m = T.pick(m) || m; }
    const r = _b(m);
    // (kept on him, not here: a new place makes a new him, whose move ids start again from one)
    if (mine() && P.move && P.move.pm && (P.state === 'atk' || P.state === 'air') && P._pmBegun !== P.moveId) { P._pmBegun = P.moveId; const T = TY[P.move.pm]; if (T && T.began) T.began(P.move); }
    return r;
  }; }
  // the perfect window: the kind's own (the beat, a caught blow), and Patient's wider gleam on top
  { const _ct = chargeTiming; chargeTiming = function (w) {
    if (w !== WP() || !mine()) return _ct(w);
    const T = TY[kind()]; let r = T && T.timing ? T.timing(w) : null; if (!r) r = _ct(w);
    const win = stat().win; if (win && !r.open && P.clvl && r.since >= 0 && r.since <= PC_WIN + win) r = Object.assign({}, r, { open: true, over: 0, mul: 1 });
    else if (win && r.over > 0) { const over = Math.max(0, r.over - win); r = Object.assign({}, r, { over, mul: 1 - (1 - PC_FLOOR) * Math.min(1, over / PC_FADE) }); }
    return r;
  }; }
  // Guard: the kind's own guard first (the shell, the turtle), then less taken from every blow while it is in hand
  { const _pd = playerDamage; playerDamage = function (dmg, fromX, big) {
    if (mine() && P.inv <= 0 && P.state !== 'dead' && P.state !== 'dodge') { const T = TY[kind()]; if (T && T.guard && T.guard(dmg, fromX, big)) return; dmg = Math.max(1, Math.round(dmg * stat().grd)); }
    return _pd(dmg, fromX, big); }; }
  // Power and Impact on every blow of the moveset (its own things included); the kind hears of each blow that lands
  { const _st = strike; strike = function (e, base, dir, m, echo) {
    const ours = m && m.pm && mine(); let mm = m;
    if (ours) { const st = stat(); base *= st.pow * FORGED_K; if (st.imp !== 1) mm = Object.assign({}, m, { kb: (m.kb || 0) * st.imp, launch: m.launch ? m.launch * (1 + (st.imp - 1) * .5) : m.launch }); }
    const hp0 = e ? e.hp : 0; _st(e, base, dir, mm, echo);
    if (ours && e && (e.hp < hp0 || e.dead)) { const T = TY[m.pm]; if (T && T.onHit) T.onHit(e, m, base, dir); } }; }
  { const _cc = critChance; critChance = function (e) { const c = _cc(e); return mine() ? Math.min(.6, c + stat().crit) : c; }; }
  { const _ml2 = moveListHtml; moveListHtml = function (id) { let h = _ml2(id); if (id === ID && SPEC()) { const st = SPEC().stats || statsOf(SPEC().picks), li = `<li class="got"><b>Forged stats</b><br><em>${STATS.map(s => STAT_NAME[s] + ' ' + st.p[s]).join(' · ')}${st.p.win ? ' · Gleam ' + st.p.win : ''}: ${statLines(st).join(', ') || 'even all round'}.</em></li>`; h = h.replace('<ul class="moves">', '<ul class="moves">' + li); } return h; }; }
  { const _rf = renderForge; renderForge = function (note) { _rf(note); try { if (!SPEC() || !save.owned[ID]) return; for (const c of document.querySelectorAll('#forgeCards .card')) { const nm = c.querySelector('.nm'); if (nm && nm.textContent === WP().name && !c.querySelector('.pmStats')) { const d = document.createElement('div'); d.style.width = '100%'; d.innerHTML = statsHtml(SPEC()); const ul = c.querySelector('ul'); c.insertBefore(d, ul);
      // (every move of the kind is its own from the start: none waits on a level, so the card lists them all as known)
      if (ul && !ul.children.length) ul.innerHTML = rows(WP()).map(([what, how, name]) => `<li class="got"><b>${name}</b><br><em>${how} · ${what}</em></li>`).join(''); } } } catch (e) { console.error(e); } }; }
  { const _ue = updateEnemy; updateEnemy = function (e, dt) { const T = mine() ? TY[kind()] : null; if (!T || !T.enemy) return _ue(e, dt); const x0 = e.x, y0 = e.y; _ue(e, dt); T.enemy(e, dt, x0, y0); }; }
  const _up = updatePlayer;
  updatePlayer = function (dt) {
    const zi = typeof zoneIdx !== 'undefined' ? zoneIdx : 0;
    if (S.stage !== stage || S.zone !== zi) { S.stage = stage; S.zone = zi; resetPlace(); }
    const on = mine(), T = on ? TY[kind()] : null;
    if (on) {
      if (pressed.light || pressed.heavy) S.presses.push(clock()); if (S.presses.length > 6) S.presses.shift();
      if (P.state === 'air' && P.move && P.move.pm && T && T.extras) T.extras(P.move, P.t / P.move.dur, dt, true); // (game.js steps air moves without moveExtras)
    }
    _up(dt);
    if (!mine()) { if (S.objs.length || S.live) { resetPlace(); S.live = false; } return; }
    S.live = true;
    const K = TY[kind()]; if (!K) return;
    S.path.push({ x: P.x, y: P.y, t: clock() }); while (S.path.length > 150 || (S.path.length && clock() - S.path[0].t > 2.4)) S.path.shift();
    if (P.state === 'charge' && K.charge) K.charge(dt);
    if (K.step) K.step(dt);
    for (const o of S.objs) { o.t = (o.t || 0) + dt; try { K.obj && K.obj(o, dt); } catch (err) { o.gone = true; console.error(err); } if (o.max && o.t >= o.max) o.gone = true; }
    S.objs = S.objs.filter(o => !o.gone);
  };
  { const _pp = playerPose; playerPose = function () {
    const pose = _pp(); if (!mine() || pose.hornCine) return pose; // (the horn's call poses him itself: w8_late.js)
    const T = TY[kind()]; if (!T) return pose; pose.weapon = ID; pose.tier = Math.min(7, save.wl[ID] || 1);
    if (P.state === 'charge' && T.chargePose) T.chargePose(pose, P.ct || 0);
    else if (['idle', 'walk', 'run', 'jump'].includes(P.state) && T.carry) T.carry(pose, P.state);
    if (T.posed) T.posed(pose);
    return pose;
  }; }
  { const _ml = mechList; mechList = function (list, t) { _ml(list, t); if (!mine()) return; const T = TY[kind()]; if (T && T.draw) try { T.draw(list, t); } catch (e) { console.error(e); } }; }
  // what must lie over the figures (beads on a foe, a moon passing in front of him): painted after the ink layer is laid
  // down, which covers anything painted under it (drawScene alone passes the time; the endings' scenes do not)
  { const _ie = inkEnd; inkEnd = function (t) { _ie(t); if (t === undefined || !mine()) return; const T = TY[kind()]; if (T && T.over) try { T.over(t); } catch (e) { console.error(e); } }; }
  { const _mb = mechBoxes; mechBoxes = function (box) { _mb(box); if (!mine()) return; for (const o of S.objs) if (Number.isFinite(o.x) && Number.isFinite(o.y)) box(o.x, o.y, o.z || 0, o.bw || 90, o.bh || 150); const T = TY[kind()]; if (T && T.boxes) T.boxes(box); }; }

  // a ghost of him, painted as light (the glaive's echoes and their rush home)
  function ghostAt(x, y, z, facing, pose, a, col) {
    pose.noCloak = 1;
    onMain(() => { ctx.globalCompositeOperation = 'lighter'; TINT = col; try { drawPlayerAt(x, y, z, facing, pose, a); } finally { TINT = null; } });
  }
  // his pose in a move at progress k, as if he were doing it (for the echoes, which copy him)
  function poseOf(m, k) { const pose = { walk: 0, weapon: ID, tier: Math.min(7, save.wl[ID] || 1) }; const pz = P.z; P.z = 0; try { atkPose(pose, WP(), m, k); } finally { P.z = pz; } return pose; }
  const standPose = () => ({ walk: 0, weapon: ID, tier: 3, arm: .9, elbow: .5, grip: -.9, backArm: 1.5, backElbow: .3, legs: { f: -9, b: 11, fk: 2, bk: 2, w: 1.4 }, sink: 1, yaw: .45 });

  // ======================================================================================================
  // 1. THE GLAIVE: ECHOES
  // A finisher, a dodge-cut, a running cut or a held Attack leaves an echo where he stood: a sea-ghost of him that
  // copies every blow he throws, a heartbeat later, from where it stands (it turns to the nearest foe). Three at most;
  // each copies three blows and goes. Heavy with echoes standing calls them home: each rushes back into him through
  // everything between. Held Heavy runs him backwards along the way he came, cutting all of it again.
  // Wilder: an echo whose foe is out of reach steps through the sea to it first; a foe an echo cuts down leaves an echo
  // of its own; Heavy alone vaults him over the foe in front to land behind them; Heavy, Heavy rolls on down the street
  // as a wheel; held Attack with echoes standing swaps him with the farthest of them, cutting the seam between.
  // ======================================================================================================
  {
    const ECHO_K = .42, ECHO_N = 3, ECHO_USES = 3, ECHO_LAG = .32;
    const E = { list: [], pend: [] };
    const tint = () => { const c = pal().accent; return c; };
    function addEcho(x, y, facing) {
      if (E.list.length >= ECHO_N) E.list.shift();
      x = clamp(x, leftWall() + 8, rightWall() - 8);
      E.list.push({ x, y, facing, t: 0, life: 5, q: [], cur: null, ct: 0, hits: new Map(), uses: 0, z: 0, born: 0 }); ev('echo');
      sparkle(x, y, 30, 10); bubbles(x, y, 10, 6, 40); sfx('hit-crystal', .4);
      fx.push({ kind: 'ring', x, y, z: 2, t: .3, max: .3, r: 30, col: pal().edge, flat: 1 });
    }
    function echoHits(o, m, k) {
      if (m.h[0] > 1 || k < m.h[0] || k > m.h[1]) return;
      for (const e of foes()) {
        const last = o.hits.get(e); if (last !== undefined && !(m.multi && o.ct - last >= m.multi)) continue;
        if (Math.abs(e.y - o.y) > (m.depth || 18) + e.hw * .3 + 6 || !zOverlap(o.z - 6, 76, e.z, e.hh)) continue;
        const dx = (e.x - o.x) * o.facing;
        if (m.around ? Math.abs(e.x - o.x) > m.x1 + e.hw : dx < (m.x0 || 0) - e.hw || dx > m.x1 + e.hw) continue;
        o.hits.set(e, o.ct);
        if (hitE(e, m.dmg * ECHO_K, m.around ? Math.sign(e.x - o.x) || o.facing : o.facing, Object.assign({}, m, { pe: m.pe * .5, echoOf: 1 }))) { ev('echoHit'); if (e.dead && E.pend.length < 2) E.pend.push({ x: e.x, y: e.y, f: -o.facing }); }
        fx.push({ kind: 'slash', x: e.x, y: e.y, z: e.z + e.hh * .5, ang: rand(-.6, .6), t: .2, max: .2, size: 26, col: pal().edge });
      }
    }
    TY.glaive = {
      reset() { E.list = []; E.pend = []; },
      peek: () => ({ echoes: E.list.length, copying: E.list.filter(o => o.cur).length, rushing: S.objs.filter(o => o.kind === 'rush').length }),
      tree: (sp) => ({
        L:    { name: 'Wake Cut', dur: .3, h: [.32, .6], x0: 0, x1: 84, dmg: 9, kb: 70, depth: 22, lunge: 60, desc: 'A rising cut.' },
        LL:   { name: 'Backwash', dur: .34, h: [.3, .62], x0: -10, x1: 86, dmg: 10, kb: 90, depth: 24, lunge: 50, desc: 'A turning backhand.' },
        LLL:  { name: 'Tide-Mark', dur: .52, h: [.3, .66], x0: 0, x1: 88, dmg: 14, kb: 220, around: 1, depth: 30, lunge: 40, power: 1, echoAt: .62, desc: 'A full wheel of the blade. Leaves an echo that copies your blows.' },
        H:    { name: 'Moon Vault', dur: .62, h: [3, 3], x0: 0, x1: 0, dmg: 20, kb: 240, power: 2, vault: 1, echoAt: .08, echoDx: 0, echoAs: 'D', desc: 'Plant the blade and vault over the foe in front, cutting it as you pass; land behind them, facing back, in a crescent. Leaves an echo where you took off.' },
        Hr:   { name: 'Call the Echoes', seq: ['H'], dur: .5, h: [3, 3], x0: 0, x1: 0, dmg: 14, kb: 260, power: 2, recall: 1, noEcho: 1, desc: 'With echoes standing: they rush back into you through everything between.' },
        HH:   { name: 'Riptide Wheel', dur: .66, h: [.12, .86], x0: 0, x1: 80, dmg: 6, kb: 150, around: 1, multi: .13, depth: 30, power: 1, lunge: 430, spiralFwd: 1, desc: 'Roll down the street as a wheel of blades, carrying them along.' },
        HC:   { name: 'Ebb Rewind', dur: .5, h: [3, 3], x0: 0, x1: 0, dmg: 28, kb: 280, power: 2, rewind: 1, echoAs: 'HH', desc: 'Hold Heavy, let go in the gleam: run back along the way you came, cutting it all again.' },
        X:    { name: 'Still Pool', dur: .42, h: [3, 3], x0: 0, x1: 0, dmg: 0, kb: 0, echoAt: .5, echoDx: 40, noEcho: 1, desc: 'Hold Attack: set an echo down in front of you.' },
        Xs:   { name: 'Changeling', dur: .4, h: [3, 3], x0: 0, x1: 0, dmg: 12, kb: 200, power: 1, swap: 1, noEcho: 1, desc: 'Hold Attack, echoes standing: trade places with your farthest echo, cutting all between.' },
        A:    { dur: .28, h: [.22, .62], x0: 0, x1: 80, dmg: 9, kb: 70 },
        AA:   { dur: .3, h: [.22, .62], x0: 0, x1: 80, dmg: 10, kb: 80 },
        AAA:  { name: 'Gull Dive', dur: .42, h: [.25, .66], x0: 0, x1: 84, dmg: 14, kb: 140, spike: 1, power: 2, desc: 'Third air cut: spikes them down.' },
        JH:   { name: 'Falling Tide', dur: .55, h: [.15, .97], x0: -20, x1: 60, dmg: 20, kb: 160, dive: 1, shock: 110, bounce: 1, power: 2, desc: 'Plunge blade-first.' },
        D:    { name: 'Wake Rush', dur: .5, h: [.2, .62], x0: 0, x1: 82, dmg: 15, kb: 300, lunge: 430, power: 1, depth: 24, echoAt: 0, echoDx: -10, desc: 'A running cut. Leaves an echo where you set off.' },
        DX:   { name: 'Breaking Wave', dur: .64, h: [.5, .72], x0: 0, x1: 90, dmg: 22, kb: 200, hop: 300, lunge: 220, airCarry: 1, bounce: 1, shock: 90, power: 2, desc: 'A leaping cleave off the run.' },
        R:    { name: 'Slip Tide', dur: .42, h: [.3, .62], x0: -30, x1: 82, dmg: 14, kb: 240, lunge: 250, power: 1, echoAt: 0, echoDx: -30, desc: 'Out of a dodge. Leaves an echo behind you.' },
      }),
      rows: (t) => [['echoes copy your blows; a kill they make leaves another', 'Attack ×3', t.LLL.name], ['vault over them, land behind', 'Heavy', t.H.name], ['echoes rush home', 'Heavy, echoes standing', t.Hr.name],
        ['roll on through them', 'Heavy, Heavy', t.HH.name], ['run back along your path', 'Hold Heavy, let go in the gleam', t.HC.name], ['set an echo down · trade places with one', 'Hold Attack', t.X.name + ' · ' + t.Xs.name],
        ['a plunge', 'Jump, Heavy', t.JH.name], ['leaves an echo', 'Dodge, Attack · Run, Attack', t.R.name + ' · ' + t.D.name]],
      pick(m) { if (m.key === 'H' && E.list.length) return WP().tree.Hr; if (m.key === 'Hr' && !E.list.length) return WP().tree.H; if (m.key === 'X' && E.list.length) return WP().tree.Xs; if (m.key === 'Xs' && !E.list.length) return WP().tree.X; return m; },
      began(m) {
        if (m.rewind) startRewind(m);
        if (m.vault) startVault(m);
        if (m.swap) changeling(m);
        // (called home, the next Heavy is the second of a pair: Heavy, Heavy runs on into the spiral)
        if (m.recall) P.seq = 'H';
        if (m.noEcho || m.key === 'SIG') { if (m.recall) for (const o of E.list) o.recall = 1; return; }
        const em = m.echoAs ? WP().tree[m.echoAs] : m;
        for (const o of E.list) if (o.q.length < 3) o.q.push({ m: em, at: ECHO_LAG + .06 * E.list.indexOf(o) });
      },
      extras(m, k, dt, air) {
        if (m.echoAt !== undefined) once('echo', k, m.echoAt, () => addEcho(P.x + fc() * (m.echoDx || 8), P.y, fc()));
        if (m.recall) once('recall', k, .3, () => recall(m));
        if (m.rewind) stepRewind(m, k, dt);
        if (m.vault) stepVault(m, k);
        return false;
      },
      step(dt) {
        for (const o of E.list) {
          o.t += dt; if (!o.cur) o.life -= dt;
          for (const q of o.q) q.at -= dt;
          if (!o.cur && o.q.length && o.q[0].at <= 0) { const q = o.q.shift(); o.cur = q.m; o.ct = 0; o.hits = new Map(); const e = nearest(o.x, o.y, 280); if (e) { o.facing = Math.sign(e.x - o.x) || o.facing;
            // a hunting echo: the nearest foe out of the blow's reach, it steps through the sea to it first (a streak of light)
            if (Math.abs(e.x - o.x) > (o.cur.x1 || 80) * .8 + e.hw + 10 || Math.abs(e.y - o.y) > 30) { const x0 = o.x, y0 = o.y; o.x = clamp(e.x - o.facing * (e.hw + 34), leftWall() + 8, rightWall() - 8); o.y = e.y;
              addObj({ kind: 'gstreak', x0, y0, x: o.x, y: o.y, max: .24, bw: Math.abs(o.x - x0) + 40 }); sparkle(o.x, o.y, 40, 6); ev('echoBlink'); } } }
          if (o.cur) { const m = o.cur; o.ct += dt; const k = o.ct / m.dur; o.z = m.dive || m.hop || /^A/.test(m.key) || m.key === 'JH' ? Math.sin(PI * Math.min(1, k)) * 40 : 0;
            echoHits(o, m, k);
            if (m.lunge) o.x = clamp(o.x + o.facing * Math.min(m.lunge, 300) * dt * Math.max(0, 1 - k * 2) * .5, leftWall() + 8, rightWall() - 8);
            if (k >= 1) { o.cur = null; o.z = 0; o.uses++; if (o.uses >= ECHO_USES) o.life = Math.min(o.life, .35); } }
          if (Math.random() < dt * 6) bubbles(o.x + rand(-8, 8), o.y, rand(10, 60), 1, 20);
        }
        // the Storm strings the echoes together with lightning: a foe that crosses the line is struck
        if (cur() === 'storm' && E.list.length > 1) { E.zap = (E.zap || 0) - dt; if (E.zap <= 0) { E.zap = .45;
          for (let i = 1; i < E.list.length; i++) { const a = E.list[i - 1], b = E.list[i]; fx.push({ kind: 'bolt', x: a.x, y: a.y, z: 40, x2: b.x, y2: b.y, z2: 40, t: .16, max: .16, col: '#C8D0FF', seed: Math.random() * 99 });
            for (const e of foes()) if (segD(e, a.x, a.y, b.x, b.y) < e.hw + 8 && e.z < 90) hitE(e, 4, Math.sign(e.x - a.x) || 1, { kb: 40, power: 0, el: 1, pm: 'glaive', key: 'ZAP', pe: 0 }); } } }
        E.list = E.list.filter(o => { if (o.life > 0 || o.cur) return true; fade(o); return false; });
        // a foe an echo cuts down leaves an echo of its own where it fell: they breed in a crowd
        for (const c of E.pend.splice(0)) { addEcho(c.x, c.y, c.f); note('ECHO!', pal().edge, 12, 70); ev('chainEcho'); }
      },
      obj(o, dt) { if (o.kind === 'rush') stepRush(o, dt); },
      draw(list, t) {
        for (const o of E.list) {
          const a = Math.min(1, o.t * 4) * (o.life < .5 ? Math.max(0, o.life * 2) : 1) * .6, pose = o.cur ? poseOf(o.cur, Math.min(1, o.ct / o.cur.dur)) : standPose();
          list.push([o.y - .05, () => { onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${rgb()},${(.5 * a).toFixed(2)})`; ctx.lineWidth = 1.6; ell(o.x, o.y, 18 + 3 * Math.sin(t * 4), 5); ctx.stroke(); ctx.restore(); });
            ghostAt(o.x, o.y, o.z, o.facing, pose, a, tint()); }]);
        }
        for (const o of S.objs) if (o.kind === 'gstreak') list.push([Math.max(o.y, o.y0) + .1, () => onMain(() => { const a = Math.max(0, 1 - o.t / o.max); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
          ctx.strokeStyle = `rgba(${rgb()},${(.75 * a).toFixed(2)})`; ctx.lineWidth = 9 * a + 1; ctx.beginPath(); ctx.moveTo(o.x0, o.y0 - 36); ctx.lineTo(o.x, o.y - 36); ctx.stroke(); ctx.strokeStyle = `rgba(255,255,255,${(.8 * a).toFixed(2)})`; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); })]);
        if (P._vt && P.state === 'atk' && P.move && P.move.vault) list.push([P.y - .1, () => onMain(() => { const V = P._vt, u = V.u || 0; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${rgb()},${(.45 * Math.sin(PI * u)).toFixed(2)})`; ctx.lineWidth = 3;
          ctx.beginPath(); for (let i = 0; i <= 16; i++) { const q = i / 16, x = lerp(V.x0, V.x1, q), z = Math.sin(PI * q) * V.h; i ? ctx.lineTo(x, P.y - z - 30) : ctx.moveTo(x, P.y - z - 30); } ctx.stroke(); ctx.restore(); })]);
        for (const o of S.objs) if (o.kind === 'rush') list.push([o.y, () => { const a = Math.max(0, 1 - o.t / o.max); ghostAt(o.x, o.y, 6, o.dir, o.pose, .5 * a + .2, tint());
          onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${rgb()},.7)`; ctx.lineWidth = 6 * a + 1; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(o.x0, o.y0 - 34); ctx.lineTo(o.x, o.y - 34); ctx.stroke(); ctx.restore(); }); }]);
        if (P.state === 'charge' && S.path.length > 2) list.push([FLOOR_TOP, () => onMain(() => { // the way he came, shown while he gathers the rewind
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${rgb()},${(.25 + .3 * Math.min(1, P.ct / .45)).toFixed(2)})`; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -t * 30;
          const pts = rewindPts(); ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); ctx.restore(); })]);
      },
      carry(pose, st) { if (st === 'jump') { pose.arm = .6; pose.elbow = .6; pose.grip = -.7; return; } pose.arm = st === 'run' ? 2.3 : 1.05; pose.elbow = .45; pose.grip = st === 'run' ? .2 : -1.05; pose.backArm = 1.5; },
      chargePose(pose, ct) { const q = Math.min(1, ct / .45); pose.crouch = 0; pose.arm = lerp(1, 2.5, q); pose.elbow = .2; pose.grip = .3; pose.lean = .35 * q; pose.sink = 6 * q; pose.legs = { f: 14, b: -14, fk: 8, bk: 1 }; pose.backArm = -.6; pose.backElbow = 1.2; pose.yaw = -.2; },
    };
    function fade(o) { sparkle(o.x, o.y, 40, 8); bubbles(o.x, o.y, 30, 5, 40);
      if (cur() === 'nacre') for (const e of foes().filter(e => Math.hypot(e.x - o.x, e.y - o.y) < 130).slice(0, 2)) { hitE(e, 5, Math.sign(e.x - o.x) || 1, { kb: 60, power: 0, el: 1, pm: 'glaive', key: 'SHARD', pe: 0 }); sparkle(e.x, e.y, e.hh * .6, 5, ['#FFFFFF', '#F6C2D4']); } }
    function recall(m) {
      if (!E.list.length) return;
      note('HOME!', pal().edge, 14); sfx('whoosh'); sfx('hit-crystal'); ev('recall');
      for (const o of E.list) {
        addObj({ kind: 'rush', x0: o.x, y0: o.y, x: o.x, y: o.y, t: 0, max: .26, hit: new Set(), m, dir: Math.sign(P.x - o.x) || 1, pose: poseOf(WP().tree.D, .45), bw: 200 });
        if (cur() === 'tide' && S0()) PN.addPool(o.x, o.y, m.dmg * wm(), S0());
      }
      E.list = [];
    }
    function stepRush(o, dt) { // an echo rushing home: it strikes all it passes through
      const px = o.x, py = o.y, u = sst(o.t / o.max); o.x = lerp(o.x0, P.x, u); o.y = lerp(o.y0, P.y, u); o.dir = Math.sign(P.x - o.x0) || o.dir;
      for (const e of foes()) { if (o.hit.has(e) || segD(e, px, py, o.x, o.y) > e.hw + 14 || e.z > 80) continue; o.hit.add(e);
        hitE(e, o.m.dmg, o.dir, o.m, { kb: 260, launch: 120, wall: 1 }); fx.push({ kind: 'slash', x: e.x, y: e.y, z: e.z + e.hh * .5, ang: rand(-.3, .3), t: .25, max: .25, size: 40, col: pal().edge });
        if (cur() === 'abyss' && !e.boss) { e.x += (P.x - e.x) * .4; } }
      if (o.t >= o.max) { sparkle(P.x, P.y, 40, 10); fx.push({ kind: 'ring', x: P.x, y: P.y, z: 30, t: .2, max: .2, r: 30, col: pal().edge }); }
    }
    // the rewind: the way he came over the last two seconds, newest first
    function rewindPts() {
      const now = clock(), pts = [{ x: P.x, y: P.y }];
      for (let i = S.path.length - 1; i >= 0; i--) { const p = S.path[i]; if (now - p.t > 2.2) break; const l = pts[pts.length - 1]; if (Math.hypot(p.x - l.x, p.y - l.y) > 6) pts.push({ x: p.x, y: p.y }); }
      let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      if (len < 90) pts.push({ x: clamp(P.x - fc() * 150, leftWall() + 10, rightWall() - 10), y: P.y });
      return pts;
    }
    function startRewind(m) { const pts = rewindPts(); let len = 0; const cum = [0]; for (let i = 1; i < pts.length; i++) { len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); cum.push(len); }
      P._rw = { pts, cum, len, hit: new Set(), hit2: new Set(), f: fc() }; sfx('whoosh'); ev('rewind'); note(m.perfect ? 'EBB!' : 'REWIND', pal().edge, 14); }
    function stepRewind(m, k, dt) {
      const R = P._rw; if (!R) return; P.facing = R.f; P.inv = Math.max(P.inv, .12);
      const u = sst(spn(k, .08, .78)), d = u * R.len; let i = 1; while (i < R.cum.length - 1 && R.cum[i] < d) i++;
      const a = R.pts[i - 1], b = R.pts[i], seg = (R.cum[i] - R.cum[i - 1]) || 1, q = clamp((d - R.cum[i - 1]) / seg, 0, 1), px = P.x, py = P.y;
      P.x = lerp(a.x, b.x, q); P.y = lerp(a.y, b.y, q); P.vx = 0;
      if (k < .82) { if (Math.random() < .5) addGhost(false); for (const e of foes()) { if (R.hit.has(e) || segD(e, px, py, P.x, P.y) > e.hw + 22 || e.z > 90) continue; R.hit.add(e);
        hitE(e, m.dmg, Math.sign(e.x - px) || -R.f, m, { kb: 200, launch: 160 }); fx.push({ kind: 'slash', x: e.x, y: e.y, z: e.z + e.hh * .5, ang: rand(-.5, .5), t: .3, max: .3, size: 46, col: pal().edge });
        if (m.perfect) echoes.push({ e, dmg: m.dmg * .5 * wm(), dir: -R.f, m: Object.assign({}, m, { perfect: 0 }), t: .3 }); } }
    }
    // the Moon Vault: the butt planted, he goes up and over the foe in front (a somersault, the blade out over his head
    // cutting all it passes), and comes down behind them facing back, the blade round in a crescent at his feet
    function startVault(m) {
      const e = inFront(230, 44), f = fc(), x0 = P.x;
      let x1 = e ? e.x + f * (e.hw + 44) : P.x + f * 150 * RK(); x1 = clamp(x1, leftWall() + 16, rightWall() - 16);
      if ((x1 - x0) * f < 60) x1 = x0 + f * 60;
      P._vt = { x0, x1, f, h: 74 + (e ? Math.min(40, e.hh * .4) : 0), hit: new Set(), y: P.y, u: 0 }; P.vx = 0; ev('vault');
      dust(P.x + f * 30, P.y, 6); sfx('whoosh');
    }
    function stepVault(m, k) {
      const V = P._vt; if (!V) return;
      const u = sst(spn(k, .14, .7)); V.u = u; P.vx = 0; P.vz = 0; P.inv = Math.max(P.inv, .1);
      const px = P.x; P.x = lerp(V.x0, V.x1, u); P.z = k < .7 ? Math.sin(PI * u) * V.h : 0; if (k < .72) P.facing = V.f;
      if (k > .14 && k < .72) for (const e of foes()) { if (V.hit.has(e) || segD(e, px, P.y, P.x, P.y) > e.hw + 16 || Math.abs(e.y - P.y) > 30 || e.z > P.z + 60) continue; V.hit.add(e);
        hitE(e, m.dmg * .6, V.f, m, { kb: 40, launch: 300 }); fx.push({ kind: 'slash', x: e.x, y: e.y, z: e.z + e.hh * .7, ang: -1.2 * V.f, t: .25, max: .25, size: 46, col: pal().edge }); }
      // down behind them: turn, and the crescent
      once('vland', k, .72, () => { P.z = 0; P.facing = -V.f; shakeMag = Math.max(shakeMag, 5); dust(P.x, P.y, 10); sfx('slam');
        fx.push({ kind: 'ring', x: P.x, y: P.y, z: 2, t: .3, max: .3, r: 90 * RK(), col: pal().edge, flat: 1 });
        for (const e of foes()) if (Math.hypot(e.x - P.x, (e.y - P.y) * 2) < 92 * RK() + e.hw && e.z < 90) hitE(e, m.dmg, Math.sign(e.x - P.x) || P.facing, m, { kb: 200, launch: 140 });
        if (V.hit.size >= 2) note('OVER THEM ALL', pal().edge, 13); });
      if (k >= .97) P._vt = null;
    }
    // Changeling: he and the farthest echo trade places, a seam of light between them cutting all it crosses
    function changeling(m) {
      let o = null, bd = -1; for (const q of E.list) { const d = Math.hypot(q.x - P.x, q.y - P.y); if (d > bd) { bd = d; o = q; } }
      if (!o) return;
      const x0 = P.x, y0 = P.y; ev('swap'); note('CHANGELING', pal().edge, 14); sfx('whoosh'); sfx('hit-crystal'); P.inv = Math.max(P.inv, .3);
      for (const e of foes()) if (segD(e, x0, y0, o.x, o.y) < e.hw + 18 && e.z < 90) { hitE(e, m.dmg, Math.sign(o.x - x0) || fc(), m, { launch: 160 }); fx.push({ kind: 'slash', x: e.x, y: e.y, z: e.z + e.hh * .5, ang: rand(-.3, .3), t: .25, max: .25, size: 44, col: pal().edge }); }
      addObj({ kind: 'gstreak', x0, y0, x: o.x, y: o.y, max: .3, bw: Math.abs(o.x - x0) + 40 });
      P.x = o.x; P.y = o.y; o.x = x0; o.y = y0; o.life = Math.max(o.life, 2); o.uses = Math.max(0, o.uses - 1);
      const e = nearest(P.x, P.y, 300); if (e) P.facing = Math.sign(e.x - P.x) || P.facing; o.facing = -P.facing;
      sparkle(P.x, P.y, 40, 10); sparkle(x0, y0, 40, 10);
    }
    const T2 = { th: 1, gg: 14 };
    POSE('glaive', {
      L: KF([[0, { ...T2, a: 1.1, e: .3, g: -.1, l: 0, s: 3, lg: [8, -9, 3, 4], ba: 1.4, y: -.1 }], [.3, { a: 1.5, g: .2, l: -.08, s: 5, lg: [6, -11, 5, 6], y: -.25 }], [.6, { a: -1.05, g: -.45, l: .28, s: 5, lg: [15, -12, 8, 1], y: .25, sh: 2 }], [1, { a: -.55, g: -.3, l: .1, s: 3, lg: [10, -10, 4, 3], y: .1, sh: 0 }]], { tr: [[.3, .6]] }),
      LL: KF([[0, { ...T2, a: -.7, g: -.3, l: .1 }], [.25, { a: -1.3, g: -.9, l: -.05, sp: -1.2, lg: [6, -8, 3, 5] }], [.62, { a: .75, g: .3, l: .32, sp: -TWO, s: 6, lg: [13, -12, 8, 2] }], [1, { a: .6, g: .1, l: .15, sp: -TWO, s: 4, lg: [10, -10, 5, 3] }]], { tr: [[.3, .62]] }),
      LLL: KF([[0, { ...T2, a: .5, g: 0, l: .1, s: 3 }], [.28, { a: -.3, g: 0, l: -.1, s: 7, cr: 0, lg: [12, -12, 9, 6], sp: 0 }], [.66, { a: .25, g: .1, l: .2, s: 9, sp: -TWO, lg: [16, -16, 11, 2] }], [1, { a: 1.2, g: -.6, l: .1, s: 6, sp: -TWO, lg: [12, -12, 7, 3] }]], { tr: [[.3, .66]], trW: 7, fn: (pose, m, k) => { if (k > .3 && k < .7) pose.flat = { r: (WP().reach || 60) + 20, k: spn(k, .3, .66), rev: false, col: pal().trail, w: 6 }; } }),
      H: KF([[0, { ...T2, a: .9, g: .6, l: .3, s: 6, lg: [14, -12, 8, 3] }], [.14, { a: 1.5, g: 1.2, l: .5, s: 8, r: 0, lg: [16, -10, 10, 2] }], [.42, { a: -2.2, g: -.8, l: -.1, s: 0, r: -PI, lg: [4, -14, 16, 14] }], [.7, { a: -2.6, g: -1, l: .1, s: 2, r: -TWO, lg: [8, -10, 12, 10] }],
        [.78, { a: .9, g: .4, l: .45, s: 10, r: -TWO, sp: 0, lg: [16, -15, 11, 1] }], [1, { a: .7, g: .2, l: .2, s: 5, r: -TWO, lg: [10, -10, 5, 3] }]], { tr: [[.3, .7], [.72, .9]], trW: 8, fn: (pose, m, k) => { if (k > .72 && k < .92) pose.flat = { r: (WP().reach || 60) + 24, k: spn(k, .72, .9), rev: true, col: pal().trail, w: 7 }; } }),
      Xs: KF([[0, { a: .9, g: -.8, l: .05 }], [.2, { a: 1.6, e: .1, g: -1.4, l: .4, s: 8, lg: [14, -12, 9, 3], ba: -1.2, be: .3, oh: 1 }], [.6, { a: 1.6, g: -1.5, s: 8, st: 1.12, fl: 18 }], [1, { a: 1, g: -1, s: 3, st: 1, fl: 0, ba: 1.4, lg: [9, -9, 3, 3] }]], { fn: (pose, m, k) => { if (k < .5) pose.streak = { len: 60, a: .7, col: pal().trail }; } }),
      Hr: KF([[0, { a: .6, g: -.6, l: 0 }], [.3, { a: -1.5, e: .2, g: -1.3, l: -.2, ba: -.9, be: 1.6, oh: 1, y: .4, lg: [9, -10, 3, 3], s: 2 }], [.7, { a: -1.6, g: -1.5, ba: -1.4, be: .3, y: .5 }], [1, { a: .4, g: -.8, ba: 1.4, be: .3, y: .2 }]]),
      HH: KF([[0, { ...T2, a: .3, g: .2, l: .35, s: 6, cr: 1, lg: [16, -14, 10, 6], st: 1.08, fl: 14 }], [.12, { a: .15, sp: 0 }], [.86, { a: .15, sp: -3 * TWO }], [1, { a: .5, g: -.2, s: 4, cr: 0, l: .1, st: 1, fl: 0, sp: -3 * TWO, lg: [10, -10, 5, 3] }]], { fn: (pose, m, k) => { if (k > .1 && k < .88) pose.flat = { r: (WP().reach || 60) + 18, k: (k * 3.4) % 1, rev: false, col: pal().trail, w: 6 }; } }),
      HC: KF([[0, { a: 2.5, e: .2, g: .3, l: .45, s: 8, lg: [16, -16, 9, 0], ba: -.6, be: 1.2, st: 1.1, fl: 16 }], [.5, { a: 2.7, l: .6, s: 10, r: -.1 }], [.82, { a: 2.2, l: .4 }], [1, { a: 1, g: -.4, l: .1, s: 3, r: 0, st: 1, fl: 0, lg: [9, -9, 3, 3], ba: 1.4, be: .3 }]], { fn: (pose, m, k) => { if (k > .1 && k < .8) { pose.streak = { len: 60, a: .7, col: pal().trail }; } } }),
      X: KF([[0, { a: .9, g: -.8, l: .05 }], [.4, { a: 1.35, e: .1, g: -1.75, l: .25, s: 10, lg: [12, -10, 12, 10], ba: 1.9, y: .3 }], [.8, { a: 1.35, g: -1.75, s: 10 }], [1, { a: 1.1, g: -1.2, s: 3, lg: [9, -9, 3, 3] }]]),
      A: KF([[0, { ...T2, a: -1.1, g: -.5, l: .1, lg: [7, -9, 10, 8] }], [.22, { a: -1.4 }], [.62, { a: 1, g: .3, l: .3 }], [1, { a: .8, g: .1 }]], { tr: [[.22, .62]] }),
      AA: KF([[0, { ...T2, a: 1.1, g: .2, l: .2, lg: [8, -8, 12, 6] }], [.22, { a: 1.3 }], [.62, { a: -1.2, g: -.5, l: -.1 }], [1, { a: -.9 }]], { tr: [[.22, .62]] }),
      AAA: KF([[0, { ...T2, a: -2.4, g: -.8, l: -.2, r: 0, lg: [6, -8, 12, 10] }], [.25, { a: -2.8, r: -.2 }], [.66, { a: 1.6, g: .2, l: .5, r: .45 }], [1, { a: 1.4, r: .3 }]], { tr: [[.25, .66]], trW: 8 }),
      JH: KF([[0, { ...T2, a: -1.8, g: -.6, l: -.1, lg: [6, -8, 12, 10] }], [.15, { a: 1.45, e: .3, g: .25, l: .35, lg: [4, -10, 14, 14] }], [1, { a: 1.5, g: .3, l: .3 }]], { fn: (pose, m, k) => { if (k > .15) pose.streak = { len: 40, a: .5, col: pal().trail }; } }),
      D: KF([[0, { ...T2, a: 1.9, g: .4, l: .45, s: 7, lg: [16, -16, 9, 0], st: 1.1, fl: 16 }], [.2, { a: 2.1 }], [.62, { a: -.5, g: -.3, l: .4, y: .3 }], [1, { a: -.2, g: -.2, l: .15, s: 3, st: 1, fl: 4, lg: [10, -10, 4, 3] }]], { tr: [[.2, .62]] }),
      DX: KF([[0, { ...T2, a: 1.4, g: .2, l: .3, s: 6, lg: [12, -12, 8, 4] }], [.4, { a: -2.6, g: -1, l: -.3, s: 0, r: -.15, lg: [6, -10, 14, 8] }], [.72, { a: 1.3, g: .3, l: .6, r: .3, s: 8, lg: [16, -14, 10, 1] }], [1, { a: 1.1, l: .35, r: 0, s: 6 }]], { tr: [[.5, .72]], trW: 8 }),
      R: KF([[0, { ...T2, a: .3, g: 0, l: .3, s: 7, lg: [14, -14, 9, 2] }], [.3, { a: -.2, sp: -1.4 }], [.62, { a: .2, sp: -TWO, l: .35, y: .2 }], [1, { a: .6, sp: -TWO, l: .1, s: 3, lg: [10, -10, 4, 3] }]], { tr: [[.3, .62]], fn: (pose, m, k) => { if (k > .3 && k < .66) pose.flat = { r: (WP().reach || 60) + 16, k: spn(k, .3, .62), rev: true, col: pal().trail, w: 5 }; } }),
    });
  }

  // a ring on the street (or in the air): the light all these kinds draw with
  const ring = (x, y, z, r, a, w = 2, col) => { ctx.strokeStyle = `rgba(${col || rgb()},${a.toFixed(2)})`; ctx.lineWidth = w; ell(x, y - z, r, r * .32); ctx.stroke(); };
  const RK = () => stat().rch;
  const holdEnds = (m, k, min = .12) => { if (m.hold && k > min && !input.light) P.t = Math.max(P.t, m.dur * .97); };
  // the forged weapon's own picture, drawn loose in the street (planted, rolling, thrown)
  function drawPic(x, y, rot, sc = 1, a = 1, hx = 17) {
    const sp = SPEC(); if (!sp) return; const c = PW.picture(sp);
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.drawImage(c, c.bx - hx, c.by, c.bw, c.bh); ctx.restore();
  }
  const play = (f, d = .14, v = .05, ty = 'triangle') => { try { if (sfxOn && actx) tone(f, d, ty, v); } catch (e) {} };

  // ======================================================================================================
  // 2. THE SWORD-STAFF: THE BEAT
  // The tide keeps time. A ring closes on his feet with every beat; a blow pressed as it closes is ON THE BEAT: harder,
  // a note rings, and the tempo climbs (four notes over his head). The first blow from rest sets the beat. Mashing is
  // off the beat. Heavy at three notes or more drops the beat: the street pulses on the next three. Held Heavy's gleam
  // is the beat itself: let go on one for a Fermata, every foe in sight struck once for each note.
  // Wilder: every blow on the beat flings a note off the blade at another foe (chaining on at 3+ notes); at full tempo
  // the music plays itself, a note at someone every beat (Encore). Heavy flies in on the spinning staff; Heavy, Heavy
  // drills down the street; the held Heavy dashes through them, the Fermata on top when let go on the beat.
  // ======================================================================================================
  {
    const BEAT = .42, WIN = .12, NOTES = [392, 440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5];
    const B = { beat0: -99, tempo: 0, lastOn: -99, lastAct: -99, n: -1, gl: 0 };
    const phase = (t) => (((t - B.beat0) % BEAT) + BEAT) % BEAT;
    const offB = (t) => { const p = phase(t); return Math.min(p, BEAT - p); };
    const active = () => clock() - B.lastAct < 3 || P.state === 'charge';
    TY.swordstaff = {
      reset() { B.tempo = 0; B.lastAct = -99; },
      peek: () => ({ tempo: B.tempo, drops: S.objs.filter(o => o.kind === 'drop').length, toBeat: BEAT - phase(clock()), beat: BEAT }),
      tree: () => ({
        L:    { name: 'Downbeat', dur: .42, h: [.16, .4], x0: 0, x1: 80, dmg: 9, kb: 70, lunge: 50, depth: 22, desc: 'Tap on the beat (the closing ring): harder, tempo +1.' },
        LL:   { name: 'Offbeat', dur: .42, h: [.16, .44], x0: 0, x1: 76, dmg: 9, kb: 90, ends: 1, depth: 24, lunge: 30, desc: 'Both blades, front and back.' },
        LLL:  { name: 'Syncopation', dur: .42, h: [.1, .72], x0: 0, x1: 78, dmg: 6, kb: 60, multi: .2, depth: 24, desc: 'Two quick cuts in one beat.' },
        LLLL: { name: 'Crescendo', dur: .84, h: [.2, .7], x0: 0, x1: 86, dmg: 15, kb: 280, around: 1, depth: 30, power: 2, desc: 'Grows with each note of tempo.' },
        H:    { name: 'The Drop', dur: .74, h: [.22, .9], x0: 0, x1: 76, dmg: 5, kb: 90, around: 1, multi: .12, hop: 330, lunge: 300, airCarry: 1, bounce: 1, shock: 110, power: 2, depth: 26, land: { dmg: 30 }, desc: 'Spin the staff overhead like a rotor, fly down the street and land on them. At 3+ notes the street pulses where you land on the next three beats.' },
        HH:   { name: 'Drumroll', dur: .8, h: [.1, .8], x0: 0, x1: 84, dmg: 3, kb: 70, ends: 1, multi: .07, lunge: 470, depth: 26, power: 1, roll: 1, fin: { at: .82, h: [.82, .96], dmg: 14, kb: 280, launch: 280, power: 2, multi: 0, around: 1, lunge: 0 }, desc: 'Drill down the street, both blades ticking sixteenths; a cymbal at the end throws them all.' },
        HC:   { name: 'Fermata', dur: .55, h: [.16, .62], x0: 0, x1: 98, dmg: 22, kb: 300, ends: 1, lunge: 560, depth: 26, power: 2, desc: 'Hold Heavy, let go: dash through them, both blades out. Let go ON a beat: time holds, every foe in sight struck once per note.' },
        X:    { name: 'Metronome', dur: 1.68, h: [.02, .98], x0: 0, x1: 74, dmg: 7, kb: 100, around: 1, multi: .42, depth: 30, hold: 1, power: 1, desc: 'Hold Attack: the staff ticks all round you, once a beat.' },
        A:    { name: 'Grace Note', dur: .26, h: [.2, .6], x0: 0, x1: 76, dmg: 8, kb: 70 },
        AA:   { name: 'Trill', dur: .34, h: [.1, .8], x0: 0, x1: 74, dmg: 3, kb: 40, multi: .07, desc: 'Second air blow: a flutter of hits.' },
        AAA:  { name: 'Rest', dur: .42, h: [.25, .62], x0: 0, x1: 80, dmg: 14, kb: 140, spike: 1, power: 2, desc: 'Third: spikes them down.' },
        JH:   { name: 'Cymbal Crash', dur: .55, h: [.15, .97], x0: -30, x1: 60, dmg: 20, kb: 160, dive: 1, shock: 100, bounce: 1, power: 2, desc: 'Drop, staff flat: a crash ring.' },
        D:    { name: 'Glissando', dur: .6, h: [.08, .75], x0: 0, x1: 80, dmg: 3, kb: 90, lunge: 400, multi: .06, depth: 24, power: 1, desc: 'A sliding run of rising notes.' },
        DX:   { name: 'Rimshot', dur: .62, h: [.42, .66], x0: 0, x1: 76, dmg: 20, kb: 320, hop: 300, lunge: 260, airCarry: 1, bounce: 1, power: 2, wall: 1, desc: 'Vault on the staff, both feet in.' },
        R:    { name: 'Upbeat', dur: .45, h: [.22, .5], x0: 0, x1: 78, dmg: 12, kb: 40, launch: 540, launcher: 1, power: 1, desc: 'Out of a dodge: flick them up. Jump to follow.' },
      }),
      rows: (t) => [['on the beat: harder, tempo up; each flings a note at another foe', 'Attack, in time with the ring', t.L.name + ' → ' + t.LLLL.name], ['fly in on the rotor; at 3+ notes the street pulses', 'Heavy', t.H.name],
        ['dash through; ON a beat, time holds', 'Hold Heavy', t.HC.name], ['drill down the street', 'Heavy, Heavy', t.HH.name], ['full tempo: the music plays itself', 'four notes', 'Encore'], ['ticks once a beat', 'Hold Attack', t.X.name], ['a sliding run', 'Run, Attack', t.D.name], ['launch', 'Dodge, Attack', t.R.name]],
      began(m) {
        if (m.key === 'SIG') return;
        const now = clock(), pr = S.presses.length ? S.presses[S.presses.length - 1] : now, t = now - pr < .3 ? pr : now;
        let on = false;
        if (m.key !== 'HC') {
          if (now - B.lastAct > BEAT * 2.4) { B.beat0 = t; on = true; } else on = offB(t) <= WIN;
          B.lastAct = now;
          if (on) { B.tempo = Math.min(4, B.tempo + 1); B.lastOn = now; ev('onBeat'); P.move = Object.assign({}, P.move, { dmg: Math.round(P.move.dmg * 1.35), onBeat: 1 }); play(NOTES[B.tempo + 1], .16, .06);
            floatText(P.x, P.y, P.z + 92, '♪'.repeat(B.tempo), '#F2D68A', 13); }
        } else B.lastAct = now;
        if (m.key === 'LLLL') P.move = Object.assign({}, P.move, { dmg: Math.round(P.move.dmg * (1 + .25 * B.tempo)) });
        if (m.key === 'H' && B.tempo >= 3) { P.move = Object.assign({}, P.move, { dropQ: 1 }); note('DROP!', '#F2D68A', 17); B.tempo = 0; play(98, .4, .12, 'sine'); }
        if (m.key === 'HC' && m.perfect) fermata(m);
      },
      extras(m, k) {
        holdEnds(m, k);
        // the Drop comes down where he lands (or, for want of a landing, at the end of the flight)
        if (m.dropQ && (P.shocked || k > .92)) once('drop', 1, 0, () => { const now = clock(); addObj({ kind: 'drop', x: P.x, y: P.y, n: 0, next: B.beat0 + (Math.floor((now - B.beat0) / BEAT) + 1) * BEAT, m, bw: 160, bh: 80 }); ev('drop'); });
        if (m.key === 'H' && k > .2 && k < .9 && Math.random() < .3) bubbles(P.x, P.y, P.z + 70, 1, 60);
        return false;
      },
      onHit(e, m) {
        if (m.key === 'D' || m.roll) play(NOTES[(B.gl++) % 8], .06, .03);
        // a blow on the beat flings a note off the blade at another foe (once a move): at 3+ notes it chains on to more
        if (m.onBeat) { sparkle(e.x, e.y, e.z + e.hh * .6, 4, ['#F2D68A', '#FFFFFF']); if (P._ssNote !== P.moveId && m === P.move) { P._ssNote = P.moveId; noteShot(e.x, e.y, e.z + e.hh * .6, e, Math.max(0, B.tempo - 2)); } }
      },
      timing() {
        if (P.state !== 'charge') return null; const off = offB(clock());
        if (P.ct < .45) return { open: false, over: 0, mul: 1, since: -1, at: 0 };
        return { open: off <= .09, over: 0, mul: 1, since: off, at: Math.round((clock() - B.beat0) / BEAT) };
      },
      step(dt) {
        const now = clock(), n = Math.floor((now - B.beat0) / BEAT);
        if (n !== B.n) { B.n = n; if (active()) { if (B.tempo > 0 || P.state === 'charge') play(NOTES[0] / 2, .06, .025, 'sine'); }
          // ENCORE: at full tempo the music plays itself: every beat a note leaps from the staff at someone in sight
          if (B.tempo >= 4 && clock() - B.lastOn < BEAT * 1.6 && P.state !== 'charge') { const L = foes().filter(e => e.x > camX && e.x < camX + VW && Math.abs(e.x - P.x) < 340); if (L.length) { const e = L[Math.floor(Math.random() * L.length)]; noteShot(P.x, P.y, P.z + 70, null, 0, e); ev('encore'); } } }
        if (B.tempo > 0 && now - B.lastOn > BEAT * 2.5) { B.tempo--; B.lastOn += BEAT; }
      },
      obj(o, dt) { if (o.kind === 'note') return stepNote(o, dt); if (o.kind !== 'drop') return; if (clock() < o.next) return; o.next += BEAT; o.n++;
        shakeMag = Math.max(shakeMag, 6); sfx('slam'); ev('pulse'); play([98, 110, 82][o.n % 3], .3, .1, 'sine'); fx.push({ kind: 'ring', x: o.x, y: o.y, z: 2, t: .35, max: .35, r: 110 * RK(), col: '#F2D68A', flat: 1 });
        for (const e of foes()) if (Math.hypot(e.x - o.x, (e.y - o.y) * 2) < 100 * RK() + e.hw && e.z < 60) hitE(e, 12, Math.sign(e.x - o.x) || 1, o.m, { kb: 150, launch: 220, power: 2 });
        if (o.n >= 3) o.gone = true; },
      draw(list, t) {
        if (!active()) return;
        list.push([P.y + .2, () => onMain(() => { const p = phase(clock()), q = 1 - p / BEAT, z = P.z;
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          ring(P.x, P.y, 0, 18, .55, 2, '242,214,138'); ring(P.x, P.y, 0, 18 + 52 * q, .15 + .5 * (1 - q), 1.6);
          for (let i = 0; i < 4; i++) { const on = i < B.tempo, x = P.x - 15 + i * 10, y = P.y - z - 104 - (on ? 2 * Math.sin(t * 8 + i) : 0);
            ctx.fillStyle = on ? 'rgba(255,230,150,.95)' : 'rgba(255,255,255,.25)'; ell(x, y, 2.6, 2); ctx.fill(); if (on) { ctx.fillRect(x + 2, y - 8, 1, 8); } }
          ctx.restore(); })]);
        for (const o of S.objs) if (o.kind === 'note') list.push([o.y + .3, () => onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(o.x, o.y - o.z, 12, .55, '242,214,138'); ctx.restore();
          ctx.save(); ctx.translate(o.x, o.y - o.z); ctx.rotate(Math.sin(o.t * 14) * .3); ctx.fillStyle = '#FFF2C0'; ell(0, 0, 3.6, 2.8); ctx.fill(); ctx.fillRect(2.6, -11, 1.4, 11); ctx.beginPath(); ctx.moveTo(4, -11); ctx.quadraticCurveTo(9, -8, 7, -3); ctx.lineTo(4, -8); ctx.fill(); ctx.restore(); })]);
      },
      carry(pose, st) { if (st === 'jump') { pose.arm = .3; pose.elbow = .8; pose.grip = -1.4; return; } pose.arm = st === 'run' ? 1.9 : .95; pose.elbow = .6; pose.grip = st === 'run' ? -.2 : -1.25; pose.backArm = 1.45; },
      chargePose(pose, ct) { pose.crouch = 0; pose.arm = -1.35; pose.elbow = 1.1; pose.grip = ct * 16; pose.lean = -.05; pose.sink = 4; pose.legs = { f: 10, b: -10, fk: 5, bk: 4 }; pose.backArm = 1.6; pose.yaw = .3; },
    };
    // a note off the blade: it flies to a foe (not the one just struck) and rings on it; hops chain it on to the next
    function noteShot(x, y, z, not, hops, tgt) {
      const e = tgt || nearest(x, y, 300, not); if (!e) return;
      if (S.objs.filter(o => o.kind === 'note').length >= 8) return;
      addObj({ kind: 'note', x, y, z, tgt: e, hops, hit: new Set(not ? [not] : []), max: 1.4, bw: 30, bh: 30 }); ev('note');
    }
    function stepNote(o, dt) {
      const e = o.tgt; if (!e || e.dead || !enemies.includes(e)) { o.gone = true; return; }
      const tx = e.x, ty = e.y, tz = e.z + e.hh * .6, d = Math.hypot(tx - o.x, ty - o.y, tz - o.z) || 1, v = Math.min(d, 520 * dt);
      o.x += (tx - o.x) / d * v; o.y += (ty - o.y) / d * v; o.z += (tz - o.z) / d * v + Math.sin(o.t * 18) * 1.2;
      if (d < 14) { o.hit.add(e); hitE(e, 6, Math.sign(e.x - P.x) || 1, { pm: 'swordstaff', key: 'NOTE', kb: 50, power: 0, pe: .15 }); play(NOTES[(B.gl++) % 8] * 2, .1, .04); sparkle(o.x, o.y, o.z, 5, ['#F2D68A', '#FFFFFF']);
        if (o.hops > 0) { const n = nearest(o.x, o.y, 260, null, (q) => !o.hit.has(q)); if (n) { o.tgt = n; o.hops--; return; } }
        o.gone = true; }
    }
    function fermata(m) {
      slowmo = Math.max(slowmo, .45); flashT = Math.max(flashT, .06); note('FERMATA', '#F2D68A', 17); ev('fermata'); play(NOTES[7], .5, .07);
      const n = 1 + B.tempo, list = foes().filter(e => e.x > camX - 10 && e.x < camX + VW + 10).slice(0, 7);
      list.forEach((e, j) => { for (let i = 0; i < n; i++) echoes.push({ e, dmg: 8 * wm(), dir: Math.sign(e.x - P.x) || fc(), m: Object.assign({}, m, { perfect: 0, power: 1, kb: 60 }), t: .08 + j * .03 + i * .09 });
        fx.push({ kind: 'slash', x: e.x, y: e.y, z: e.z + e.hh * .5, ang: rand(-1, 1), t: .4, max: .4, size: 44, col: '#FFF2C0' }); });
    }
    const T2 = { th: 1, gg: 16 };
    POSE('swordstaff', {
      L: KF([[0, { ...T2, a: .7, g: -.4, l: .05, lg: [9, -9, 3, 3] }], [.16, { a: .9, g: -.2, l: -.05, y: -.25 }], [.4, { a: .1, g: .25, l: .28, y: .3, lg: [14, -12, 7, 1], s: 4, x: .6 }], [1, { a: .4, g: -.1, l: .1, y: .1, s: 2, x: 0, lg: [10, -9, 4, 3] }]], { tr: [[.16, .4]] }),
      LL: KF([[0, { ...T2, a: .4, g: 0, l: .1 }], [.16, { a: .2, g: -1.4, y: .5, sp: 0 }], [.44, { a: .2, g: -3.3, y: -.4, l: .15, s: 4, lg: [11, -11, 6, 4] }], [1, { a: .5, g: -3.1, y: 0, s: 2 }]], { fn: (pose, m, k) => { if (k > .14 && k < .5) pose.trail = 0; } }),
      LLL: KF([[0, { ...T2, a: .5, g: 0 }], [.1, { a: -.3, g: -.6, l: .2, y: .3 }], [.4, { a: .9, g: .5, l: .25, y: -.3, s: 4 }], [.72, { a: -.4, g: -.5, y: .35 }], [1, { a: .4, g: -.2, y: 0, s: 2 }]], { tr: [[.1, .4], [.4, .72]] }),
      LLLL: KF([[0, { ...T2, a: .3, g: 0, l: .1, s: 4 }], [.2, { a: -1.2, g: -.5, l: -.15, sp: 0, s: 2, lg: [8, -10, 4, 6] }], [.7, { a: .2, g: TWO, l: .3, sp: -TWO, s: 8, lg: [15, -14, 10, 2] }], [1, { a: .5, g: TWO, sp: -TWO, s: 3 }]], { fn: (pose, m, k) => { if (k > .2 && k < .74) pose.flat = { r: (WP().reach || 60) + 24, k: spn(k, .2, .7), rev: false, col: pal().trail, w: 7 }; } }),
      H: KF([[0, { ...T2, a: .5, g: -.3, s: 6, lg: [12, -12, 8, 4] }], [.2, { a: -2.7, e: .2, g: 0, l: -.1, s: 2, lg: [6, -10, 8, 8] }], [.85, { a: -2.7, g: 0, l: .15, lg: [4, -12, 14, 12] }], [.9, { a: 1, g: .2, l: .55, s: 10, lg: [16, -14, 11, 0] }], [1, { a: .9, g: 0, l: .3, s: 6 }]],
        { fn: (pose, m, k) => { if (k > .18 && k < .88) { pose.grip = k * m.dur * 34; pose.flat = { r: (WP().reach || 60) + 10, k: (k * 7) % 1, rev: false, col: pal().trail, w: 5 }; } } }),
      HH: KF([[0, { ...T2, a: .1, g: 0, l: .45, s: 8, lg: [17, -15, 10, 1], st: 1.1, fl: 16, x: .6 }], [.8, { a: .05, l: .5, x: .8 }], [.86, { a: -1.3, g: -.5, l: -.1, s: 4, x: 0, st: 1, fl: 0 }], [1, { a: .5, g: TWO, s: 3, lg: [10, -10, 4, 3] }]],
        { fn: (pose, m, k) => { if (k < .8) { pose.grip = Math.sin(k * 60) * .5; pose.streak = { len: (WP().reach || 60) + 20, a: .6 + .3 * Math.sin(k * 50), col: pal().trail }; } else if (k < .97) pose.flat = { r: (WP().reach || 60) + 24, k: spn(k, .82, .96), rev: false, col: pal().trail, w: 7 }; } }),
      HC: KF([[0, { ...T2, a: .2, g: -.2, l: -.1, s: 6, lg: [10, -14, 6, 4] }], [.16, { a: .05, g: 0, l: .5, x: 1, s: 9, lg: [19, -17, 11, 0], sh: 3, st: 1.14, fl: 20 }], [.62, { x: 1, l: .55 }], [1, { a: .3, l: .15, x: 0, s: 3, sh: 0, st: 1, fl: 0, lg: [10, -10, 4, 3] }]], { fn: (pose, m, k) => { if (k > .14 && k < .66) pose.streak = { len: (WP().reach || 60) + 40, a: .9, col: m.perfect ? 'rgba(255,240,190,.98)' : pal().trail }; } }),
      X: KF([[0, { a: -1.3, e: 1, g: 0, l: -.05, s: 3, lg: [10, -10, 4, 4], ba: 1.6, y: .3 }], [1, { a: -1.3, g: 0 }]], { fn: (pose, m, k) => { pose.grip = k * m.dur * 15; pose.flat = { r: (WP().reach || 60) * .7, k: (k * 8) % 1, rev: false, col: pal().trail, w: 4 }; } }),
      A: KF([[0, { ...T2, a: -.9, g: -.4, lg: [7, -9, 10, 8] }], [.2, { a: -1.1 }], [.6, { a: .7, g: .3, l: .3 }], [1, { a: .5 }]], { tr: [[.2, .6]] }),
      AA: KF([[0, { ...T2, a: .3, g: 0, l: .2, lg: [8, -8, 12, 6] }], [1, { a: .3 }]], { fn: (pose, m, k) => { pose.grip = Math.sin(k * 30) * .9; pose.ext = .5 + .5 * Math.sin(k * 40); } }),
      AAA: KF([[0, { ...T2, a: -2.3, g: -.8, l: -.2, r: 0, lg: [6, -8, 12, 10] }], [.25, { a: -2.6, r: -.2 }], [.62, { a: 1.5, g: .2, l: .5, r: .4 }], [1, { a: 1.3, r: .25 }]], { tr: [[.25, .62]], trW: 8 }),
      JH: KF([[0, { ...T2, a: -1.4, g: -1.5, l: -.1, lg: [6, -8, 12, 10], e: .8 }], [.15, { a: .6, g: -1.55, e: .9, l: .3, lg: [5, -9, 15, 14] }], [1, { a: .7, g: -1.55 }]]),
      D: KF([[0, { ...T2, a: 1.2, g: .3, l: .5, s: 8, lg: [18, -16, 10, 0], st: 1.12, fl: 18, oy: 6 }], [.75, { a: 1, g: .3 }], [1, { a: .5, g: 0, l: .15, s: 3, st: 1, fl: 4, oy: 0, lg: [10, -10, 4, 3] }]], { fn: (pose, m, k) => { pose.grip = .3 + Math.sin(k * 40) * .5; if (k < .78) pose.flat = { r: (WP().reach || 60), k: (k * 6) % 1, rev: false, col: pal().trail, w: 4 }; } }),
      DX: KF([[0, { ...T2, a: 1.4, g: -.2, l: .3, s: 6 }], [.35, { a: 1.6, g: -1.6, l: -.3, r: -.5, lg: [18, 12, 4, 6], s: 0 }], [.66, { a: 1.2, g: -1.4, l: -.6, r: -.9, lg: [24, 20, 0, 2] }], [1, { a: .8, g: -.6, l: .1, r: 0, s: 4, lg: [10, -10, 4, 3] }]]),
      R: KF([[0, { ...T2, a: 1.4, g: .2, l: .35, s: 8, lg: [14, -14, 9, 2] }], [.22, { a: 1.6 }], [.5, { a: -1.6, g: -.6, l: -.2, s: 2, lg: [8, -10, 3, 5], y: .3 }], [1, { a: -1, g: -.4, l: 0 }]], { tr: [[.22, .5]] }),
    });
  }

  // ======================================================================================================
  // 3. THE FLAIL: MOON TIDES
  // Its head is a little moon, and it pulls. Each blow adds to a foe's pull (pips over its head); at three it floats up
  // ADRIFT, helpless, bobbing in the air. Heavy with foes adrift is the Spring Tide: every one of them comes down at once,
  // and each lands like a dropped stone on whoever is under it. Held Heavy turns the sky over: everything near falls UP.
  // Wilder: Heavy with none adrift throws the moon out the chain's whole length and drags the first foe back through the
  // rest; Heavy, Heavy whirls on down the street, lifts them, orbits the adrift round him and slings them out; a foe adrift
  // struck on the run or from the air flies off like a billiard ball, caroming off walls and into the others.
  // ======================================================================================================
  {
    const M = { jh: false };
    const adrift = () => foes().filter(e => e.pmFloat);
    function lift(e, n) {
      if (!e || e.dead || e.boss || n <= 0) return;
      if (e.pmFloat) { e.pmFloat.t = Math.max(e.pmFloat.t, 1.6); return; }
      if ((e.pmCool || 0) > clock()) return;
      e.pmLift = (e.pmLift || 0) + n; e.pmLiftT = clock();
      if (e.pmLift >= 3) float(e, 3.2);
    }
    function float(e, dur, z, crash) {
      if (e.boss || e.dead) return;
      e.pmFloat = { t: dur, z: z || 74 + rand(0, 26), crash: crash || 0 }; e.pmLift = 0; ev('adrift'); e.air = true; e.vz = Math.max(e.vz || 0, 120);
      floatText(e.x, e.y, e.z + e.hh + 20, 'ADRIFT', '#DDE6FF', 11); bubbles(e.x, e.y, 10, 5, 50);
    }
    function crashDown(e, d) { if (!e || e.dead) return; e.pmFloat = null; e.pmCrash = { d }; e.air = true; e.vz = -900; e.state = 'hurt'; e.t = Math.max(e.t, .5); }
    function spring(m) { const L = adrift(); if (!L.length) return 0; note('SPRING TIDE', '#DDE6FF', 15); sfx('whoosh'); for (const e of L) crashDown(e, m.dmg * (.8 + e.z / 160)); return L.length; }
    function landed(e, C) {
      e.pmCrash = null; shakeMag = Math.max(shakeMag, 7); sfx('slam'); dust(e.x, e.y, 10); ev('crash');
      fx.push({ kind: 'ring', x: e.x, y: e.y, z: 2, t: .35, max: .35, r: 70 * RK(), col: '#DDE6FF', flat: 1 });
      const m = { pm: 'flail', key: 'HCRASH', kb: 160, launch: 260, power: 2, pe: .5 };
      hitE(e, C.d, P.facing, m, { kb: 60, launch: 120 });
      for (const o of foes()) if (o !== e && Math.hypot(o.x - e.x, (o.y - e.y) * 2) < 64 * RK() + o.hw && o.z < 50) hitE(o, C.d * .7, Math.sign(o.x - e.x) || 1, m);
      if (cur() === 'tide' && S0()) PN.addPool(e.x, e.y, C.d * wm(), S0());
    }
    TY.flail = {
      reset() { M.jh = false; for (const e of enemies) { e.pmFloat = null; e.pmCrash = null; e.pmLift = 0; e.pmFling = null; } },
      peek: () => ({ adrift: adrift().length, flung: foes().filter(e => e.pmFling).length, crashing: foes().filter(e => e.pmCrash).length, pull: foes().reduce((s, e) => s + (e.pmLift || 0), 0) }),
      tree: () => ({
        L:    { name: 'Waxing', dur: .34, h: [.3, .6], x0: 0, x1: 72, dmg: 10, kb: 20, lunge: 40, depth: 24, lift: 1, tether: 1, desc: 'Each blow pulls (+1). Three pulls: they float ADRIFT.' },
        LL:   { name: 'Waning', dur: .38, h: [.3, .62], x0: 0, x1: 72, dmg: 11, kb: 25, lunge: 40, depth: 24, lift: 1, tether: 1 },
        LLL:  { name: 'Full Moon', dur: .6, h: [.2, .8], x0: 0, x1: 84, dmg: 8, kb: 100, around: 1, multi: .2, depth: 30, power: 1, lift: 2, gather: 1, desc: 'A circle overhead, all round: +2 pull.' },
        H:    { name: 'Wrecking Moon', dur: .62, h: [3, 3], x0: 0, x1: 0, dmg: 16, kb: 60, power: 2, lift: 1, wreck: 1, desc: 'Nobody adrift: the moon flies out the chain\'s full length, takes the first foe it meets and drags it back to you through everyone between.' },
        Hs:   { name: 'Spring Tide', seq: ['H'], dur: .5, h: [3, 3], x0: 0, x1: 0, dmg: 18, kb: 0, power: 2, spring: 1, desc: 'Foes adrift: every one crashes down on whoever is under it.' },
        HH:   { name: 'Hammer Throw', dur: .86, h: [.1, .74], x0: 0, x1: 84, dmg: 6, kb: 120, around: 1, multi: .16, depth: 32, power: 1, lift: 1, lunge: 360, spiralFwd: 1, hurl: 1, desc: 'Whirl on down the street: the adrift near are caught in your orbit, then slung out like stones, bowling over whoever they hit.' },
        HC:   { name: 'Lunar Inversion', dur: .6, h: [.4, .6], x0: 0, x1: 70, dmg: 10, kb: 40, power: 2, invert: 1, desc: 'Hold Heavy, let go in the gleam: everything near falls up, then down hard.' },
        X:    { name: 'Moonrise', dur: .5, h: [.3, .5], x0: 0, x1: 74, dmg: 12, kb: 30, launch: 200, lift: 3, power: 1, desc: 'Hold Attack: set one adrift at once.' },
        A:    { dur: .3, h: [.22, .62], x0: 0, x1: 72, dmg: 9, kb: 70, lift: 1 },
        AA:   { dur: .32, h: [.22, .62], x0: 0, x1: 72, dmg: 10, kb: 80, lift: 1 },
        AAA:  { name: 'Meteor', dur: .42, h: [.25, .62], x0: 0, x1: 78, dmg: 14, kb: 140, spike: 1, power: 2, meteor: 1, desc: 'Third air blow: one adrift is sent crashing.' },
        JH:   { name: 'Moonfall', dur: .55, h: [.15, .97], x0: -24, x1: 60, dmg: 18, kb: 160, dive: 1, shock: 100, bounce: 1, power: 2, desc: 'Drop: everything adrift falls with you.' },
        D:    { name: 'Tidal Bore', dur: .6, h: [.1, .7], x0: 0, x1: 74, dmg: 5, kb: 120, lunge: 380, multi: .12, depth: 24, lift: 1, desc: 'The moon dragged through them on the run.' },
        DX:   { name: 'Eclipse', dur: .66, h: [.5, .72], x0: 0, x1: 80, dmg: 22, kb: 200, hop: 300, lunge: 220, airCarry: 1, bounce: 1, shock: 100, power: 2, eclipse: 1, desc: 'Leaping slam; the adrift near it crash.' },
        R:    { name: 'Ebb Hook', dur: .5, h: [.3, .5], x0: 0, x1: 72, dmg: 12, kb: 90, lift: 2, power: 1, hook: 1, desc: 'Out of a dodge: the chain hooks one adrift and hauls you up to it.' },
      }),
      rows: (t) => [['3 pulls float them adrift', 'Attack ×3', t.LLL.name], ['the adrift crash down', 'Heavy, foes adrift', t.Hs.name], ['grab one far off, drag it back', 'Heavy, none adrift', t.H.name],
        ['sling the adrift like stones', 'Heavy, Heavy', t.HH.name], ['an adrift foe struck flies off, caroming into the rest', 'Run, Attack · Run, Heavy · Jump, Heavy', 'Billiards'], ['everything near falls up', 'Hold Heavy, gleam', t.HC.name], ['adrift at once', 'Hold Attack', t.X.name], ['up to the adrift', 'Dodge, Attack', t.R.name], ['they fall with you', 'Jump, Heavy', t.JH.name]],
      pick(m) { if (m.key === 'H' && adrift().length) return WP().tree.Hs; if (m.key === 'Hs' && !adrift().length) return WP().tree.H; return m; },
      began(m) {
        if (m.spring) { spring(m); P.seq = 'H'; }
        if (m.key === 'JH') M.jh = true;
        if (m.hook) { const e = nearest(P.x, P.y, 300, null, (o) => !!o.pmFloat); P._hook = e ? { e, x0: P.x, z0: P.z } : null; if (e) { P.facing = Math.sign(e.x - P.x) || P.facing; sfx('whoosh'); } }
      },
      extras(m, k, dt, air) {
        // Full Moon: the foes near are drawn in to the circle before it swings, so every one of them is in it
        if (m.gather && (k < m.h[0] || once('gather', k, m.h[0], () => {}))) { const u = k < m.h[0] ? Math.min(1, dt * 22) : 1;
          for (const e of foes()) { if (e.boss || e.pmFloat || e.pmCrash) continue; const dx = e.x - P.x;
            if (Math.abs(dx) > 170 * RK() || Math.abs(e.y - P.y) > 60) continue; const s = Math.sign(dx) || fc(), want = Math.min(Math.abs(dx), e.hw + 36);
            e.x += (P.x + s * want - e.x) * u; e.y += (P.y - e.y) * u * .6; if (Math.sign(e.vx) === s) e.vx = 0; } }
        if (m.wreck) once('wreck', k, .3, () => { addObj({ kind: 'wball', x: P.x + fc() * 26, y: P.y, z: P.z + 40, dir: fc(), d: 0, out: 250 * RK(), back: false, grab: null, hit: new Set(), m, bw: 80, bh: 80 }); sfx('whoosh'); });
        // (he stands braced while the moon is out on the chain: the move waits for it to come home)
        if (m.wreck && k > .3 && S.objs.some(o => o.kind === 'wball')) { P.t = Math.min(P.t, m.dur * .7); P.vx = 0; }
        if (m.hurl) { const L = adrift().filter(e => Math.abs(e.x - P.x) < 240 * RK() && Math.abs(e.y - P.y) < 70);
          if (k < .72) L.forEach((e, i) => { const a = k * TWO * 2.6 + i * TWO / L.length, tx = P.x + Math.cos(a) * 70, ty = P.y + Math.sin(a) * 18; e.x += (tx - e.x) * Math.min(1, dt * 12); e.y += (ty - e.y) * Math.min(1, dt * 12); e.pmFloat.t = Math.max(e.pmFloat.t, .5); });
          else once('hurl', k, .72, () => { if (L.length) { note('SLUNG!', '#DDE6FF', 14); ev('hurl'); sfx('whoosh'); } L.forEach((e) => fling(e, Math.sign(e.x - P.x) || fc(), 0, 600)); }); }
        if (m.invert) once('inv', k, m.h[0], () => invert(m));
        if (m.eclipse && P.shocked) once('ecl', 1, 0, () => { for (const e of adrift()) if (Math.abs(e.x - P.x) < 170 * RK()) crashDown(e, 16); });
        if (m.hook && P._hook) { const H = P._hook, e = H.e;
          if (!e.dead && k < .45) { const u = sst(k / .45); P.x = lerp(H.x0, e.x - P.facing * (e.hw + 22), u); P.z = Math.max(0, lerp(H.z0, e.z - 10, u)); P.vz = 0; P.vx = 0; return false; }
          if (once('hk', k, .45, () => { if (!e.dead) hitE(e, m.dmg, P.facing, m, { kb: 40 }); })) { P._hook = null; toAir(null, 160); return true; } }
        return false;
      },
      // the light pulls hold the foe on the chain (in reach of the next blow), whatever else knocks it about
      onHit(e, m) {
        // BILLIARDS: a heavy blow on a foe adrift sends it flying, a ball off the cue, into whoever is in its way
        if (e.pmFloat && !e.boss && !e.dead && (m.power === 2 || m.key === 'D') && m === P.move && !m.meteor && !m.spring && !m.hurl && !m.invert) { fling(e, Math.sign(e.x - P.x) || fc(), 0, 560); return; }
        if (m.lift) lift(e, m.lift); if (m.tether && !e.boss && !e.dead && !e.pmFloat) e.pmTether = clock() + .7; if (m.meteor && e.pmFloat) crashDown(e, 16); },
      step(dt) { if (M.jh && P.z <= 0 && P.state !== 'air') { M.jh = false; if (adrift().length) spring(WP().tree.Hs); } },
      obj(o, dt) { if (o.kind === 'wball') stepBall(o, dt); },
      enemy(e, dt) {
        if (e.dead) { e.pmFloat = null; e.pmFling = null; return; }
        if (e.pmFling) { stepFling(e, dt); return; }
        if (e.pmLift && clock() - (e.pmLiftT || 0) > 3) e.pmLift = 0;
        // on the chain: never further than the light blow reaches (it is reeled back in, not let fly)
        if (e.pmTether > clock() && !e.boss && !e.pmFloat && !e.pmCrash) { const dx = e.x - P.x, s = Math.sign(dx) || P.facing, lim = Math.max(e.hw + 20, ((WP().tree.L || {}).x1 || 72) - 14);
          if (Math.abs(dx) > lim) { e.x = P.x + s * Math.max(lim, Math.abs(dx) - 400 * dt); if (Math.sign(e.vx) === s) e.vx = 0; } }
        const F = e.pmFloat;
        if (F) { F.t -= dt; e.air = true; e.state = 'hurt'; e.t = Math.max(e.t, .25); e.plan = null;
          const tz = F.z + 6 * Math.sin(clock() * 3 + e.x * .05); e.z += (tz - e.z) * Math.min(1, dt * 5); e.vz = 0; e.vx *= Math.pow(.002, dt);
          if (Math.random() < dt * 3) bubbles(e.x, e.y, e.z, 1, 20);
          if (F.t <= 0) { if (F.crash) crashDown(e, F.crash); else { e.pmFloat = null; e.vz = -60; e.pmCool = clock() + 1.5; } } }
        if (e.pmCrash && e.z <= 1) landed(e, e.pmCrash);
      },
      draw(list, t) {
        for (const o of S.objs) if (o.kind === 'wball') list.push([o.y + .3, () => onMain(() => { const hx = P.x + fc() * 22, hz = P.z + 44; ctx.save(); ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = 'rgba(221,230,255,.7)'; ctx.lineWidth = 2; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(hx, P.y - hz); ctx.quadraticCurveTo((hx + o.x) / 2, (P.y - hz + o.y - o.z) / 2 + 10, o.x, o.y - o.z); ctx.stroke(); ctx.setLineDash([]);
          glow(o.x, o.y - o.z, 26, .6, '221,230,255'); ctx.restore(); PN.art.pearlBody(o.x, o.y - o.z, 8, t, 1, pal()); })]);
        for (const e of foes()) if (e.pmFling) list.push([e.y - .2, () => onMain(() => { const F = e.pmFling; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(221,230,255,.5)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
          for (let i = 0; i < 3; i++) { const y = e.y - e.z - e.hh * (.3 + .2 * i); ctx.beginPath(); ctx.moveTo(e.x - F.dir * (e.hw + 4), y); ctx.lineTo(e.x - F.dir * (e.hw + 30 + 10 * i), y); ctx.stroke(); } ctx.restore(); })]);
        for (const e of foes()) {
          if (e.pmFloat) list.push([e.y - .2, () => onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ring(e.x, e.y, 0, e.hw + 6, .45, 2, '221,230,255');
            const g = ctx.createLinearGradient(0, e.y, 0, e.y - e.z); g.addColorStop(0, 'rgba(221,230,255,.22)'); g.addColorStop(1, 'rgba(221,230,255,0)'); ctx.fillStyle = g; ctx.fillRect(e.x - e.hw * .6, e.y - e.z, e.hw * 1.2, e.z); ctx.restore(); })]);
          else if (e.pmLift > 0) list.push([e.y + .3, () => onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(221,230,255,.9)';
            for (let i = 0; i < e.pmLift; i++) { const x = e.x - 5 + i * 10, y = e.y - e.z - e.hh - 16; ctx.beginPath(); ctx.arc(x, y, 3.4, 0, TWO); ctx.arc(x + 1.6, y - .8, 3, 0, TWO, true); ctx.fill('evenodd'); } ctx.restore(); })]);
        }
      },
      carry(pose, st) { if (st === 'jump') { pose.arm = .4; pose.elbow = .9; pose.grip = -.9; return; } pose.arm = st === 'run' ? 2 : 1.45; pose.elbow = .2; pose.grip = st === 'run' ? .4 : .1; pose.backArm = 1.4; },
      chargePose(pose, ct) { pose.crouch = 0; pose.arm = -1.5; pose.elbow = .3; pose.grip = -ct * 18; pose.lean = -.1; pose.sink = 5; pose.legs = { f: 12, b: -12, fk: 6, bk: 4 }; pose.backArm = 1.2; pose.yaw = .2; pose.glow = perfectGlow() || 'rgba(221,230,255,.6)'; },
    };
    // a foe sent flying: it skims along the street at the height it was, caroms off the walls, bowls over all it meets
    // (one adrift it meets is sent on in turn: three caroms at most), then comes down like a dropped stone
    function fling(e, dir, n, v) {
      if (!e || e.dead || e.boss) return; e.pmFloat = null; e.pmCrash = null; e.pmLift = 0;
      e.pmFling = { dir, v: v || 560, t: 0, n, hit: new Set([e]), z: Math.max(30, Math.min(90, e.z || 40)) }; e.air = true; e.state = 'hurt'; e.t = Math.max(e.t, .6); e.plan = null;
      ev(n ? 'carom' : 'fling'); if (n) floatText(e.x, e.y, e.z + e.hh + 20, 'CAROM ×' + n, '#DDE6FF', 12); sfx('whoosh', .6);
    }
    function stepFling(e, dt) {
      const F = e.pmFling; F.t += dt; e.state = 'hurt'; e.t = Math.max(e.t, .3); e.air = true; e.vx = 0; e.vz = 0; e.plan = null;
      e.x += F.dir * F.v * dt; e.z += (F.z - e.z) * Math.min(1, dt * 8);
      if (e.x < leftWall() + 12 || e.x > rightWall() - 12) { e.x = clamp(e.x, leftWall() + 12, rightWall() - 12); F.dir = -F.dir; F.hit = new Set([e]); shakeMag = Math.max(shakeMag, 5); sfx('slam'); dust(e.x, e.y, 6); ev('carom'); }
      if (Math.random() < dt * 20) bubbles(e.x, e.y, e.z, 1, 30);
      for (const o of foes()) { if (F.hit.has(o) || !touch(o, e.x, e.y, e.z + e.hh * .4, e.hw + 6)) continue; F.hit.add(o);
        const m = { pm: 'flail', key: 'CAROM', kb: 220, launch: 220, power: 1, pe: .3 };
        hitE(o, 10, F.dir, m); hitE(e, 5, F.dir, m, { kb: 0, launch: 0 }); fx.push({ kind: 'ring', x: o.x, y: o.y, z: o.z + o.hh * .5, t: .2, max: .2, r: 26, col: '#DDE6FF' });
        if (o.pmFloat && F.n < 3 && !o.dead) fling(o, F.dir, F.n + 1, F.v * .9); else if (!o.dead) lift(o, 2); }
      if (F.t > .55 || e.dead) { e.pmFling = null; if (!e.dead) crashDown(e, 10); }
    }
    // the Wrecking Moon: out on the chain's whole length; the first foe it meets is taken and dragged home through the rest
    function stepBall(o, dt) {
      if (!o.back) { o.x += o.dir * 780 * dt; o.d += 780 * dt;
        for (const e of foes()) { if (o.hit.has(e) || !touch(e, o.x, o.y, o.z, 14)) continue; o.hit.add(e); hitE(e, o.m.dmg, o.dir, o.m, { kb: 30, launch: 0 }); sparkle(o.x, o.y, o.z, 8); shakeMag = Math.max(shakeMag, 4);
          if (!e.boss && !e.dead) { o.grab = e; note('GOT ONE', '#DDE6FF', 12, 60); ev('wreck'); } o.back = true; break; }
        if (o.d >= o.out || o.x < leftWall() + 4 || o.x > rightWall() - 4) o.back = true; }
      else { const tx = P.x + o.dir * (o.grab ? o.grab.hw + 30 : 20), d = Math.abs(tx - o.x), v = Math.min(d, (o.grab ? 620 : 900) * dt), px = o.x; o.x += Math.sign(tx - o.x) * v; o.y += (P.y - o.y) * Math.min(1, dt * 8); o.z += (P.z + 40 - o.z) * Math.min(1, dt * 8);
        const g = o.grab; if (g && !g.dead) { g.x = o.x; g.y += (o.y - g.y) * Math.min(1, dt * 10); g.state = 'hurt'; g.t = Math.max(g.t, .4); g.vx = 0; g.plan = null;
          for (const e of foes()) { if (e === g || o.hit.has(e) || segD(e, px, o.y, o.x, o.y) > e.hw + g.hw || e.z > 70) continue; o.hit.add(e); hitE(e, 10, -o.dir, o.m, { kb: 200, launch: 240 }); lift(e, 1); fx.push({ kind: 'ring', x: e.x, y: e.y, z: e.z + e.hh * .5, t: .2, max: .2, r: 26, col: '#DDE6FF' }); } }
        if (d < 4) { o.gone = true; if (g && !g.dead) { g.state = 'hurt'; g.t = Math.max(g.t, .5); lift(g, 1); dust(g.x, g.y, 6); } } }
      if (o.t > 1.6) o.gone = true;
    }
    function invert(m) {
      const R = (m.perfect ? 300 : 240) * RK(); note('THE SKY TURNS', '#DDE6FF', 15); ev('invert'); flashT = Math.max(flashT, .05); sfx('charge', 3);
      fx.push({ kind: 'ring', x: P.x, y: P.y, z: 2, t: .5, max: .5, r: R, col: '#DDE6FF', flat: 1 });
      for (const e of foes()) { if (Math.hypot(e.x - P.x, (e.y - P.y) * 2) > R + e.hw) continue;
        if (e.boss) { hitE(e, m.dmg * 2.6, Math.sign(e.x - P.x) || 1, m, { kb: 100 }); continue; }
        hitE(e, m.dmg * (m.perfect ? 1.2 : .6), Math.sign(e.x - P.x) || 1, m, { kb: 0, launch: 0 }); if (!e.dead) float(e, .9, 150, m.dmg * (m.perfect ? 2.6 : 2)); }
    }
    POSE('flail', {
      L: KF([[0, { a: 1.3, e: .2, g: .2, l: .05, ba: 1.2 }], [.3, { a: 2.4, g: .5, l: -.15, y: -.4, lg: [7, -11, 3, 6] }], [.6, { a: -.6, g: -.4, l: .3, y: .35, s: 5, lg: [14, -12, 8, 1] }], [1, { a: .2, g: 0, l: .1, y: 0, s: 2, lg: [10, -9, 4, 3] }]], { tr: [[.3, .6]], trW: 7 }),
      LL: KF([[0, { a: -.4, e: .2, g: -.3, l: .2 }], [.3, { a: -2.2, g: -.6, l: -.1, y: .4, lg: [8, -10, 3, 5] }], [.62, { a: 1.3, g: .4, l: .45, y: -.3, s: 6, lg: [15, -13, 9, 1] }], [1, { a: 1.1, g: .2, l: .15, y: 0, s: 3 }]], { tr: [[.3, .62]], trW: 7 }),
      LLL: KF([[0, { a: -1.4, e: .3, g: 0, l: -.1, s: 3, lg: [10, -10, 4, 4] }], [1, { a: -1.4 }]], { fn: (pose, m, k) => { pose.grip = -k * TWO * 2.2; pose.flat = { r: (WP().reach || 60) + 24, k: (k * 2.2) % 1, rev: false, col: pal().trail, w: 6 }; pose.yaw = .3 * Math.sin(k * 14); } }),
      H: KF([[0, { a: 1.3, g: .2, l: 0, ba: 1.2 }], [.18, { a: -1.8, e: .3, g: -.6, l: -.25, y: .4, s: 2, lg: [7, -11, 3, 6] }], [.3, { a: .05, e: 0, g: 0, x: .4, l: .45, y: -.2, s: 8, lg: [16, -14, 10, 1], ba: -.6, be: 1.2 }], [.7, { a: -.1, l: .3, s: 7, lg: [8, -16, 6, 4] }], [1, { a: .4, e: .3, g: 0, x: 0, l: .1, y: 0, s: 3, ba: 1.4, be: .3, lg: [10, -10, 4, 3] }]], { tr: [[.18, .3]], trW: 9 }),
      Hs: KF([[0, { a: .9, g: 0, l: 0, oh: 0 }], [.3, { a: -1.7, e: .2, g: -.2, l: -.25, ba: -1.3, be: .2, oh: 1, y: .4, s: 1 }], [.55, { a: 1.2, g: .4, l: .35, ba: 1.9, s: 8, lg: [14, -12, 9, 2] }], [1, { a: 1.1, g: .2, l: .15, s: 4 }]]),
      HH: KF([[0, { a: .2, e: 0, g: 0, l: .3, s: 6, lg: [14, -14, 9, 3] }], [.1, { sp: 0, a: .1 }], [.72, { sp: -3 * TWO, a: .05, l: .35 }], [.8, { sp: -3 * TWO - 1, a: .4, x: .5, l: .5, s: 9, lg: [17, -14, 11, 1] }], [1, { sp: -3 * TWO - 1, a: .8, x: 0, l: .1, s: 3, lg: [10, -10, 4, 3] }]], { fn: (pose, m, k) => { if (k > .08 && k < .76) pose.flat = { r: (WP().reach || 60) + 30, k: (k * 3.6) % 1, rev: false, col: pal().trail, w: 9 }; } }),
      HC: KF([[0, { a: -1.5, g: 0, l: -.1, s: 5 }], [.4, { a: -1.6, l: -.3, s: 2, ba: -1.4, oh: 1 }], [.6, { a: 1.4, g: .3, l: .5, s: 10, ba: 2, lg: [16, -14, 11, 1] }], [1, { a: 1.3, l: .3, s: 6 }]], { tr: [[.4, .6]], trW: 9 }),
      X: KF([[0, { a: 1.5, g: .3, l: .3, s: 6, lg: [12, -12, 8, 3] }], [.3, { a: 1.7 }], [.5, { a: -2, g: -.6, l: -.25, s: 0, lg: [8, -10, 2, 4], y: .3 }], [1, { a: -1.5, l: -.1 }]], { tr: [[.3, .5]], trW: 7 }),
      A: KF([[0, { a: -1.2, g: -.4, lg: [7, -9, 10, 8] }], [.22, { a: -1.5 }], [.62, { a: 1, g: .4, l: .3 }], [1, { a: .9 }]], { tr: [[.22, .62]] }),
      AA: KF([[0, { a: 1.1, g: .3, l: .2, lg: [8, -8, 12, 6] }], [.22, { a: 1.3 }], [.62, { a: -1.3, g: -.4, l: -.1 }], [1, { a: -1 }]], { tr: [[.22, .62]] }),
      AAA: KF([[0, { a: -2.4, g: -.6, l: -.2, r: 0, lg: [6, -8, 12, 10] }], [.25, { a: -2.9, r: -.3 }], [.62, { a: 1.6, g: .5, l: .5, r: .5 }], [1, { a: 1.4, r: .3 }]], { tr: [[.25, .62]], trW: 9 }),
      JH: KF([[0, { a: -2, g: -.4, l: -.1, lg: [6, -8, 12, 10], th: 1, gg: 10 }], [.15, { a: 1.55, g: .1, l: .4, lg: [4, -10, 14, 14] }], [1, { a: 1.55 }]]),
      D: KF([[0, { a: 2.3, g: .6, l: .5, s: 8, lg: [17, -16, 10, 0], st: 1.1, fl: 16 }], [.7, { a: 2.1 }], [1, { a: 1.4, g: .2, l: .15, s: 3, st: 1, fl: 4, lg: [10, -10, 4, 3] }]], { fn: (pose, m, k) => { if (k < .72) pose.grip = .6 + Math.sin(k * 30) * .3; } }),
      DX: KF([[0, { a: 1.4, g: .2, l: .3, s: 6, th: 1, gg: 10 }], [.4, { a: -2.7, g: -.8, l: -.35, s: 0, r: -.2, lg: [6, -10, 14, 8] }], [.72, { a: 1.4, g: .5, l: .65, r: .35, s: 9, lg: [16, -14, 11, 1] }], [1, { a: 1.2, l: .35, r: 0, s: 6 }]], { tr: [[.5, .72]], trW: 9 }),
      R: KF([[0, { a: .2, g: 0, l: .3, s: 6, lg: [14, -14, 8, 2] }], [.3, { a: -.2, g: -.3, sp: -1.5 }], [.5, { a: .1, g: 0, sp: -TWO, l: .2 }], [1, { a: 1, sp: -TWO, l: .05, s: 2 }]], { fn: (pose, m, k) => { if (P._hook && k < .45) { pose.arm = -.6; pose.grip = -.4; pose.legs = { f: 6, b: -12, fk: 12, bk: 8 }; pose.spin = 0; } } }),
    });
  }

  // ======================================================================================================
  // 4. THE CHAKRAM: SATELLITES
  // Each cast throws a copy of the ring that, its work done, comes back and joins an orbit round him: up to six little
  // moons, each cutting what it passes. Heavy looses them all, each after a different foe; held Heavy lines them up in
  // front of him and fires the line down the street; a held Attack widens the orbit; out of a dodge they close in a guard.
  // ======================================================================================================
  {
    const C = { moons: [], R: 60, w: 3.4, guard: 0, wide: false, big: 0, cd: new WeakMap(), eclipse: null };
    const MAXM = 6;
    const mpos = (o, i) => { const R = C.R * RK(); return { x: P.x + Math.cos(o.a) * R, y: P.y + Math.sin(o.a) * R * .34, z: P.z + 32 + Math.sin(o.a) * 6 }; };
    function addMoon(from) { if (C.moons.length >= MAXM) { sparkle(from.x, from.y, from.z || 30, 5); return; } const a = C.moons.length ? C.moons[C.moons.length - 1].a - TWO / MAXM : 0; C.moons.push({ a, t: 0, life: 14, mode: 'orbit', x: from.x, y: from.y, z: from.z || 30, k: 0 }); sfx('hit-crystal', .4); ev('moon'); }
    function cast(m, vy, vz) { addObj({ kind: 'cast', x: P.x + fc() * 20, y: P.y, z: P.z + 36, dir: fc(), vy: vy || 0, vz: vz || 0, d: 0, out: 170 * RK(), back: false, hit: new Set(), m, spin: 0, bw: 60, bh: 60 }); sfx('whoosh'); }
    function moonHit(e, x, y, z, big) {
      if ((C.cd.get(e) || 0) > clock() || !touch(e, x, y, z, big ? 14 : 9)) return false;
      C.cd.set(e, clock() + .32); hitE(e, big ? 5.5 : 3.5, Math.sign(e.x - P.x) || 1, { pm: 'chakram', key: 'MOON', kb: 60, power: 0, pe: .12 + stat().flow * .5 }); return true;
    }
    // a moon, or a cast: a little ring of the weapon's blade, glowing
    const disc = (x, y, z, r, a, sp) => { ctx.save(); ctx.translate(x, y - z); ctx.globalCompositeOperation = 'lighter'; glow(0, 0, r * 2.6, .6 * a); ctx.restore();
      ctx.save(); ctx.translate(x, y - z); ctx.scale(1, .55); ctx.rotate(sp || 0); ctx.lineWidth = r * .55; ctx.strokeStyle = pal().blade; ctx.beginPath(); ctx.arc(0, 0, r, 0, TWO); ctx.stroke();
      ctx.lineWidth = 1; ctx.strokeStyle = pal().metal; ctx.stroke(); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(Math.cos(sp || 0) * r, Math.sin(sp || 0) * r, 1.4, 0, TWO); ctx.fill(); ctx.restore(); };
    const behindM = (o) => o.mode === 'orbit' && Math.sin(o.a) < 0 && P.state !== 'charge';
    const moonR = () => (C.big > 0 ? 12 : 9.5);
    TY.chakram = {
      reset() { C.moons = []; C.guard = 0; C.big = 0; C.eclipse = null; },
      peek: () => ({ moons: C.moons.length, orbit: C.moons.filter(o => o.mode === 'orbit').length, flying: C.moons.filter(o => o.mode === 'fly').length, grind: C.moons.filter(o => o.mode === 'grind').length, R: Math.round(C.R), guard: C.guard > 0 }),
      tree: () => ({
        L:    { name: 'Cast', dur: .3, h: [.3, .5], x0: 0, x1: 50, dmg: 9, kb: 70, cast: 1, desc: 'Throws a ring; back, it joins your orbit (6 at most).' },
        LL:   { name: 'Cast', dur: .3, h: [.3, .5], x0: 0, x1: 50, dmg: 9, kb: 70, cast: 2 },
        LLL:  { name: 'Twin Cast', dur: .36, h: [.3, .5], x0: 0, x1: 50, dmg: 9, kb: 80, cast: 3, desc: 'Two at once, fanned.' },
        LLLL: { name: 'Constellation', dur: .55, h: [.2, .8], x0: 0, x1: 70, dmg: 12, kb: 200, around: 1, power: 1, flare: 1, desc: 'Spin: your moons swell and cut harder for a while.' },
        H:    { name: 'Rim Slice', dur: .45, h: [.36, .56], x0: 0, x1: 76, dmg: 20, kb: 240, power: 2, depth: 24, desc: 'No moons out: a heavy slice.' },
        Hl:   { name: 'Loose the Moons', seq: ['H'], dur: .45, h: [3, 3], x0: 0, x1: 0, dmg: 13, kb: 220, power: 2, loose: 1, desc: 'Moons out: each flies at a different foe.' },
        HH:   { name: 'Eclipse', dur: .5, h: [.3, .5], x0: 0, x1: 70, dmg: 14, kb: 160, power: 1, eclipse: 1, desc: 'Your moons grind round the nearest foe, then come home.' },
        HC:   { name: 'Syzygy', dur: .5, h: [3, 3], x0: 0, x1: 0, dmg: 7, kb: 200, power: 2, syzygy: 1, desc: 'Hold Heavy: moons line up. Let go in the gleam: the line fires.' },
        X:    { name: 'Wide Orbit', dur: 2, h: [3, 3], x0: 0, x1: 0, dmg: 0, kb: 0, hold: 1, wide: 1, desc: 'Hold Attack: the orbit swings out wide.' },
        A:    { name: 'Skip Cast', dur: .3, h: [.3, .5], x0: 0, x1: 50, dmg: 9, kb: 70, cast: 4 },
        AA:   { dur: .3, h: [.2, .6], x0: 0, x1: 66, dmg: 9, kb: 80, around: 1 },
        AAA:  { name: 'Moonfall Shower', dur: .42, h: [.25, .62], x0: 0, x1: 70, dmg: 12, kb: 140, spike: 1, power: 2, shower: 1, desc: 'Third air blow: every moon drops on a foe below.' },
        JH:   { name: 'Halo Dive', dur: .55, h: [.15, .97], x0: -20, x1: 50, dmg: 18, kb: 160, dive: 1, shock: 90, bounce: 1, power: 2, halo: 1, desc: 'Dive: landing, the moons burst out in a ring.' },
        D:    { name: 'Comet Train', dur: .6, h: [.15, .62], x0: 0, x1: 66, dmg: 14, kb: 260, lunge: 420, power: 1, train: 1, desc: 'Moons stream behind you, cutting.' },
        DX:   { name: 'Wheel Rush', dur: .6, h: [.15, .85], x0: 0, x1: 60, dmg: 6, kb: 160, lunge: 380, multi: .12, around: 1, power: 1, desc: 'Roll through them like a wheel.' },
        R:    { name: 'Ring Guard', dur: .4, h: [.2, .5], x0: 0, x1: 60, dmg: 10, kb: 200, around: 1, power: 1, guard: 1, desc: 'Out of a dodge: moons close in, shots break on them.' },
      }),
      rows: (t) => [['casts join your orbit', 'Attack ×3', t.L.name + ' · ' + t.LLL.name], ['each at a different foe', 'Heavy, moons out', t.Hl.name], ['grind the nearest', 'Heavy, Heavy', t.HH.name],
        ['line up, fire the line', 'Hold Heavy, gleam', t.HC.name], ['orbit swings wide', 'Hold Attack', t.X.name], ['shots break on them', 'Dodge, Attack', t.R.name], ['moons trail you', 'Run, Attack', t.D.name]],
      pick(m) { const n = C.moons.filter(o => o.mode === 'orbit').length; if (m.key === 'H' && n) return WP().tree.Hl; if (m.key === 'Hl' && !n) return WP().tree.H; return m; },
      began(m) {
        // (loosed, the next Heavy is the second of a pair: Heavy, Heavy sends them grinding)
        if (m.loose) { loose(m); P.seq = 'H'; }
        if (m.flare) { C.big = 3; note('CONSTELLATION', pal().edge, 13); }
        if (m.guard) { C.guard = 1.4; sfx('hit-metal', .4); }
        if (m.eclipse) { const e = nearest(P.x, P.y, 280); if (e && C.moons.length) { C.eclipse = { e, t: 0 }; for (const o of C.moons) o.mode = 'grind'; note('ECLIPSE', pal().edge, 13); ev('eclipse'); } }
        if (m.syzygy) syzygy(m);
        if (m.shower) for (const o of C.moons) { const e = nearest(o.x, o.y, 240, null, (q) => q.z < 60); if (e) { o.mode = 'fall'; o.tgt = e; o.k = 0; o.fx = o.x; o.fy = o.y; o.fz = o.z; } }
      },
      extras(m, k) {
        holdEnds(m, k);
        if (m.cast) once('cast', k, m.h[0], () => { if (m.cast === 3) { cast(m, -60); cast(m, 60); } else if (m.cast === 2) cast(m, -30); else if (m.cast === 4) cast(m, 0, -90); else cast(m); });
        if (m.halo && P.shocked) once('halo', 1, 0, () => { for (const o of C.moons) { o.mode = 'burst'; o.k = 0; } });
        C.wide = !!m.wide; C.train = !!m.train && k < .9;
        return false;
      },
      step(dt) {
        if (!(P.move && (P.state === 'atk' || P.state === 'air') && (P.move.wide || P.move.train))) { C.wide = false; C.train = false; }
        C.guard = Math.max(0, C.guard - dt); C.big = Math.max(0, C.big - dt);
        const tgtR = C.guard > 0 ? 24 : C.wide ? 120 : 60, w = C.guard > 0 ? 7 : C.wide ? 2.2 : 3.4; C.R += (tgtR - C.R) * Math.min(1, dt * 6); C.w = w;
        const charging = P.state === 'charge', E = C.eclipse;
        if (E && (E.e.dead || (E.t += dt) > 1.3)) { C.eclipse = null; for (const o of C.moons) if (o.mode === 'grind') o.mode = 'orbit'; }
        C.moons.forEach((o, i) => {
          o.life -= dt; o.a += dt * C.w; o.t += dt; let tx, ty, tz, q = Math.min(1, dt * 10);
          if (o.mode === 'orbit') { const p = mpos(o); tx = p.x; ty = p.y; tz = p.z;
            if (charging) { tx = P.x + fc() * (44 + i * 26); ty = P.y; tz = P.z + 40; }
            else if (C.train) { tx = P.x - fc() * (26 + i * 22); ty = P.y; tz = P.z + 26 + 4 * Math.sin(o.t * 9 + i); q = Math.min(1, dt * 16); } }
          else if (o.mode === 'grind' && E) { const a = o.a * 2.2 + i; tx = E.e.x + Math.cos(a) * (E.e.hw + 12); ty = E.e.y + Math.sin(a) * 8; tz = E.e.z + E.e.hh * .5 + Math.sin(a) * 10; q = Math.min(1, dt * 14);
            o.gcd = (o.gcd || 0) - dt; if (o.gcd <= 0 && Math.hypot(o.x - tx, o.z - tz) < 30) { o.gcd = .14; hitE(E.e, 2.4, Math.sign(E.e.x - P.x) || 1, { pm: 'chakram', key: 'GRIND', kb: 10, power: 0, pe: .1, noStun: E.e.boss ? 0 : 1 }); } }
          else if (o.mode === 'fly') { const e = o.tgt && !o.tgt.dead ? o.tgt : null; o.k += dt;
            if (e) { tx = e.x; ty = e.y; tz = e.z + e.hh * .5; } else { tx = o.x + Math.cos(o.a0) * 600 * dt * 30; ty = o.y; tz = o.z; }
            const d = Math.hypot(tx - o.x, ty - o.y, tz - o.z) || 1, v = Math.min(d, 640 * dt); o.x += (tx - o.x) / d * v; o.y += (ty - o.y) / d * v; o.z += (tz - o.z) / d * v;
            if (e && touch(e, o.x, o.y, o.z, 12)) { hitE(e, o.m.dmg, Math.sign(e.x - P.x) || 1, o.m, { kb: 220 }); sparkle(o.x, o.y, o.z, 8); ev('looseHit'); o.mode = 'orbit'; o.life = Math.max(2, o.life - 5); }
            else if (o.k > 1.2) { sparkle(o.x, o.y, o.z, 6); o.mode = 'orbit'; o.life = Math.max(2, o.life - 5); }
            return; }
          else if (o.mode === 'fall') { const e = o.tgt; o.k += dt / .3; const u = Math.min(1, o.k);
            if (!e || e.dead) { o.mode = 'orbit'; return; }
            o.x = lerp(o.fx, e.x, u); o.y = lerp(o.fy, e.y, u); o.z = lerp(o.fz + 60, e.z + e.hh * .5, u * u) + (1 - u) * 60;
            if (u >= 1) { hitE(e, 10, Math.sign(e.x - P.x) || 1, { pm: 'chakram', key: 'FALL', kb: 80, launch: 0, power: 1, spike: 1, pe: .3 }); sparkle(o.x, o.y, o.z, 6); o.mode = 'orbit'; } return; }
          else if (o.mode === 'burst') { o.k += dt; const r = 110 * RK() * Math.sin(Math.min(1, o.k / .5) * PI), a = i / Math.max(1, C.moons.length) * TWO; tx = P.x + Math.cos(a) * r; ty = P.y + Math.sin(a) * r * .34; tz = P.z + 20; q = 1;
            if (o.k > .5) o.mode = 'orbit'; }
          if (tx !== undefined) { o.x += (tx - o.x) * q; o.y += (ty - o.y) * q; o.z += (tz - o.z) * q; }
          if (!charging) for (const e of foes()) moonHit(e, o.x, o.y, o.z, C.big > 0 || o.mode === 'burst');
          if (C.guard > 0) for (const p of projs) if (p.owner === 'e' && !p.ground && Math.hypot(p.x - o.x, p.y - o.y) < 16 && Math.abs((p.z || 30) - o.z) < 26) { p.life = 0; sparkle(p.x, p.y, p.z || 30, 6); sfx('hit-crystal', .5); }
        });
        C.moons = C.moons.filter(o => !o.gone && o.life > 0);
      },
      obj(o, dt) { if (o.kind !== 'cast') return; o.spin += dt * 20;
        if (!o.back) { o.x += o.dir * 520 * dt; o.y += o.vy * dt; o.z = Math.max(8, o.z + o.vz * dt); o.d += 520 * dt; if (o.d >= o.out || o.x < leftWall() || o.x > rightWall()) o.back = true; }
        else { const tx = P.x, ty = P.y, tz = P.z + 32, d = Math.hypot(tx - o.x, (ty - o.y), tz - o.z) || 1, v = Math.min(d, 560 * dt); o.x += (tx - o.x) / d * v; o.y += (ty - o.y) / d * v; o.z += (tz - o.z) / d * v; if (d < 20) { o.gone = true; addMoon(o); } }
        if (!o.back) for (const e of foes()) { if (o.hit.has(e) || !touch(e, o.x, o.y, o.z, 12)) continue; o.hit.add(e); hitE(e, o.m.dmg, o.dir, o.m); sparkle(o.x, o.y, o.z, 5); }
        if (o.t > 2.5) o.gone = true; },
      draw(list, t) {
        // the orbit itself, faint, while any moon keeps to it
        if (C.moons.some(o => o.mode === 'orbit') && P.state !== 'charge') list.push([P.y - .45, () => onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ring(P.x, P.y, P.z + 32, C.R * RK(), .22, 1.4); ctx.restore(); })]);
        // (the moons behind him go in with the figures; the rest, and the casts, over them: see over)
        for (const o of C.moons) if (behindM(o)) list.push([o.y - .4, () => onMain(() => disc(o.x, o.y, o.z, moonR(), Math.min(1, o.life), o.a * 3))]);
        if (C.guard > 0) list.push([P.y + .3, () => onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ring(P.x, P.y, P.z + 32, 26, .5 * Math.min(1, C.guard * 2), 2.5); ctx.restore(); })]);
        if (P.state === 'charge' && C.moons.length) list.push([P.y + .35, () => onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${rgb()},${(.2 + .4 * Math.min(1, P.ct / .45)).toFixed(2)})`; ctx.lineWidth = 2; ctx.setLineDash([4, 8]); ctx.beginPath(); ctx.moveTo(P.x, P.y - P.z - 40); ctx.lineTo(P.x + fc() * 380 * RK(), P.y - P.z - 40); ctx.stroke(); ctx.restore(); })]);
      },
      over() { for (const o of C.moons) if (!behindM(o)) disc(o.x, o.y, o.z, moonR(), Math.min(1, o.life), o.a * 3); for (const o of S.objs) if (o.kind === 'cast') disc(o.x, o.y, o.z, 7, 1, o.spin); },
      carry(pose, st) { if (st === 'jump') { pose.arm = .5; pose.elbow = 1; pose.grip = -.9; return; } pose.arm = st === 'run' ? 1.8 : 1.25; pose.elbow = .9; pose.grip = st === 'run' ? .6 : -.5; pose.backArm = 1.45; },
      chargePose(pose, ct) { pose.crouch = 0; pose.arm = -.1; pose.elbow = 0; pose.grip = 0; pose.ext = .6; pose.lean = .1; pose.sink = 5; pose.legs = { f: 14, b: -12, fk: 7, bk: 2 }; pose.backArm = 2.6; pose.backElbow = .3; pose.yaw = -.1; },
    };
    function loose(m) {
      const L = C.moons.filter(o => o.mode === 'orbit'), tg = foes().filter(e => Math.abs(e.x - P.x) < 420).sort((a, b) => Math.abs(a.x - P.x) - Math.abs(b.x - P.x));
      L.forEach((o, i) => { o.mode = 'fly'; o.k = 0; o.m = m; o.tgt = tg.length ? tg[i % tg.length] : null; o.a0 = o.a; });
      note('LOOSE!', pal().edge, 13); sfx('whoosh'); ev('loose');
    }
    function syzygy(m) {
      const n = C.moons.length;
      if (!n) { cast(Object.assign({}, m, { dmg: 26 })); return; }
      // (each moon past the first adds most of a blow: six make four)
      const len = 380 * RK(), d = m.dmg * (1 + .6 * (n - 1)) * (m.perfect ? 1.5 : 1); note(m.perfect ? 'SYZYGY!' : 'SYZYGY', pal().edge, 15); sfx('shoot'); ev('syzygy'); shakeMag = Math.max(shakeMag, 5);
      for (const e of foes()) { const dx = (e.x - P.x) * fc(); if (dx > -10 && dx < len + e.hw && Math.abs(e.y - P.y) < 22 + e.hw * .3 && e.z < 90) hitE(e, d, fc(), m, { kb: 260, wall: 1 }); }
      addObj({ kind: 'beam', x: P.x, y: P.y, z: P.z + 40, dir: fc(), len, max: .3, bw: 420 });
      C.moons.forEach((o, i) => { o.x = P.x + fc() * (len * (i + 1) / (n + 1)); });
    }
    const _draw = TY.chakram.draw; TY.chakram.draw = function (list, t) { _draw(list, t); for (const o of S.objs) if (o.kind === 'beam') list.push([o.y + .3, () => onMain(() => { const a = 1 - o.t / o.max; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${rgb()},${a.toFixed(2)})`; ctx.lineWidth = 10 * a + 2; ctx.beginPath(); ctx.moveTo(o.x, o.y - o.z); ctx.lineTo(o.x + o.dir * o.len, o.y - o.z); ctx.stroke(); ctx.strokeStyle = `rgba(255,255,255,${a.toFixed(2)})`; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); })]); };
    POSE('chakram', {
      L: KF([[0, { a: .9, e: 1.2, g: -.6, l: 0, ba: 1.4, y: -.2 }], [.3, { a: -.1, e: 0, g: .2, x: .9, l: .3, y: .3, lg: [14, -11, 7, 1], s: 4 }], [1, { a: .5, e: .6, x: 0, l: .1, y: 0, s: 2, lg: [10, -9, 4, 3] }]]),
      LL: KF([[0, { a: .3, e: 1.4, g: -1.2, l: .1, y: .3 }], [.3, { a: -.4, e: 0, g: .5, x: .9, l: .25, y: -.3, s: 4 }], [1, { a: .4, e: .6, x: 0, l: .1, y: 0, s: 2 }]]),
      LLL: KF([[0, { a: 1.4, e: 1.6, g: -.8, l: -.1, ba: -.3, be: 1.6, y: -.3 }], [.3, { a: 0, e: 0, g: .2, x: 1, ba: -.2, be: 0, l: .35, s: 5, y: .2, lg: [15, -12, 8, 1] }], [1, { a: .5, e: .6, x: 0, ba: 1.4, be: .3, l: .1, s: 2, y: 0 }]]),
      LLLL: KF([[0, { a: .1, e: 0, g: 0, l: .1, s: 4 }], [.2, { sp: 0 }], [.8, { sp: -TWO * 1.5, a: -.1 }], [1, { sp: -TWO * 1.5, a: .5, s: 2 }]], { fn: (pose, m, k) => { if (k > .2 && k < .82) pose.flat = { r: (WP().reach || 60) + 16, k: (k * 1.6) % 1, rev: false, col: pal().trail, w: 5 }; } }),
      H: KF([[0, { a: .6, e: .3, g: 0 }], [.36, { a: -1.9, e: .5, g: -1, l: -.3, y: -.4, lg: [7, -10, 3, 5] }], [.56, { a: .9, e: 0, g: .4, l: .5, y: .4, s: 8, lg: [16, -14, 10, 0] }], [1, { a: .8, l: .25, s: 4 }]], { tr: [[.36, .56]], trW: 7 }),
      Hl: KF([[0, { a: .9, e: .6, g: -.5 }], [.25, { a: -1.6, e: .2, g: -1.2, ba: -1.6, be: .2, oh: 1, y: .45, l: -.2 }], [.5, { a: .2, e: 0, g: 0, ba: 2.8, x: .6, l: .35, y: -.2, s: 5, lg: [14, -12, 8, 1] }], [1, { a: .6, ba: 1.4, x: 0, l: .1, s: 2 }]]),
      HH: KF([[0, { a: .3, e: .3, g: 0, ba: 1.4 }], [.3, { a: -.9, e: .1, g: -.2, ba: -.8, be: 1.4, oh: 1, y: .5, l: .2, s: 4, lg: [12, -11, 6, 2] }], [1, { a: -.6, ba: -.6, y: .4 }]], { fn: (pose, m, k) => { pose.grip = -k * TWO; } }),
      HC: KF([[0, { a: -.1, e: 0, g: 0, x: .6, l: .1, s: 5, lg: [14, -12, 7, 2], ba: 2.6 }], [.3, { x: 1, l: .4, s: 7, lg: [17, -14, 10, 0] }], [1, { x: .2, l: .15, s: 3, lg: [10, -10, 4, 3] }]], { fn: (pose, m, k) => { if (k < .4) pose.streak = { len: 120, a: .8, col: pal().trail }; } }),
      X: KF([[0, { a: -1.5, e: .4, g: 0, ba: -1.4, be: .4, oh: 1, l: -.1, s: 3, y: .2 }], [1, { a: -1.5 }]], { fn: (pose, m, k) => { pose.grip = k * m.dur * 12; } }),
      A: KF([[0, { a: .8, e: 1.2, g: -.5, lg: [7, -9, 10, 8] }], [.3, { a: .4, e: 0, g: .2, x: .9, l: .3 }], [1, { a: .5, e: .5, x: 0 }]]),
      AA: KF([[0, { a: .1, e: 0, g: 0, lg: [7, -9, 12, 10] }], [.2, { sp: 0 }], [.6, { sp: -TWO }], [1, { sp: -TWO }]], { fn: (pose, m, k) => { if (k > .2 && k < .64) pose.flat = { r: (WP().reach || 60) + 10, k: spn(k, .2, .6), rev: false, col: pal().trail, w: 4 }; } }),
      AAA: KF([[0, { a: -2.4, e: .2, g: -.6, r: 0, lg: [6, -8, 12, 10] }], [.25, { a: -2.8, r: -.2 }], [.62, { a: 1.5, g: .3, l: .5, r: .4 }], [1, { a: 1.3, r: .25 }]], { tr: [[.25, .62]] }),
      JH: KF([[0, { a: -1.8, e: .3, g: -.5, lg: [6, -8, 12, 10] }], [.15, { a: 1.3, e: .2, g: .5, l: .4, lg: [4, -10, 14, 14], ba: -1.6, be: .2, oh: 1 }], [1, { a: 1.3 }]]),
      D: KF([[0, { a: 2.4, e: .2, g: .6, l: .55, s: 8, lg: [17, -16, 10, 0], st: 1.12, fl: 18, ba: -.4 }], [.62, { a: 2.3 }], [1, { a: 1, l: .15, s: 3, st: 1, fl: 4, lg: [10, -10, 4, 3], ba: 1.4 }]]),
      DX: KF([[0, { a: .3, e: .8, g: -.5, l: .3, s: 8, cr: 1, lg: [12, -12, 12, 10] }], [.15, { r: 0 }], [.85, { r: TWO }], [1, { r: TWO, cr: 0, s: 3, lg: [10, -10, 4, 3] }]]),
      R: KF([[0, { a: .2, e: .3, g: 0, l: .3, s: 6, lg: [14, -14, 8, 2], ba: -.6, be: 1.5 }], [.2, { sp: 0 }], [.5, { sp: -TWO, a: .1 }], [1, { sp: -TWO, a: .7, s: 2, ba: 1.4, be: .3 }]], { fn: (pose, m, k) => { if (k > .2 && k < .54) pose.flat = { r: (WP().reach || 60) + 10, k: spn(k, .2, .5), rev: true, col: pal().trail, w: 5 }; } }),
    });
  }

  // ======================================================================================================
  // 5. THE SPEAR AND SHIELD: GRIT
  // Held Heavy raises the shell. Every blow or shot it catches (from in front) is grit, and grit becomes nacre: a layer
  // on a pearl growing in the shell (five at most; a catch just as it rises is a JUST and counts twice). The spear
  // spends the pearl: Heavy-Heavy runs it out as a lance as long as its layers, letting go of the guard bursts it.
  // Wilder: Heavy hurls a javelin of nacre that skewers, pins and flies home (each skewered a layer); letting go of the
  // guard charges shield-first and the pearl bursts where he stops, its shards hopping foe to foe; with the pearl full,
  // whatever the shell catches is spat straight back (Overflow).
  // ======================================================================================================
  {
    const G = { layers: 0, lastCatch: -9, flash: 0 };
    const add = (n) => { const was = G.layers; G.layers = Math.min(5, G.layers + n); if (G.layers > was) G.flash = .4; };
    TY.shieldspear = {
      reset() { G.layers = 0; },
      peek: () => ({ layers: G.layers, guarding: P.state === 'charge' }),
      tree: () => ({
        L:    { name: 'Prick', dur: .24, h: [.3, .6], x0: 0, x1: 86, dmg: 7, kb: 50, lunge: 40, depth: 20, desc: 'Quick spear jabs.' },
        LL:   { name: 'Prick', dur: .26, h: [.3, .6], x0: 0, x1: 88, dmg: 8, kb: 60, lunge: 40, depth: 20 },
        LLL:  { name: 'Oyster Snap', dur: .44, h: [.32, .56], x0: 0, x1: 56, dmg: 14, kb: 120, power: 1, snap: 1, depth: 26, desc: 'The shell snaps shut on them: held fast.' },
        H:    { name: 'Nacre Javelin', dur: .5, h: [3, 3], x0: 0, x1: 0, dmg: 13, kb: 0, power: 2, jav: 1, desc: 'Hurl a spear of nacre down the street: it skewers up to three, pins them where it stops (+1 layer each, two at most), then flies home through everyone between.' },
        HH:   { name: 'Pearl Lance', dur: .55, h: [.3, .62], x0: 0, x1: 90, dmg: 16, kb: 260, lunge: 400, power: 2, lance: 1, depth: 22, desc: 'A lunging thrust; spends every layer, each one longer and harder. The javelin, if out, comes home at once.' },
        HC:   { name: 'Nacre Breaker', dur: .62, h: [.08, .5], x0: 0, x1: 60, dmg: 12, kb: 220, lunge: 440, power: 2, burst: 1, carry: 1, wall: 1, depth: 28, desc: 'Hold Heavy: guard (blows from in front become layers; caught with the pearl full, they are spat back). Let go: charge shield-first, and the pearl bursts where you stop, its shards ricocheting foe to foe. Gleam: just after a catch.' },
        X:    { name: 'Spit Pearl', dur: .4, h: [.3, .5], x0: 0, x1: 70, dmg: 10, kb: 40, launch: 420, spit: 1, power: 1, desc: 'Hold Attack: fire one layer as a shot (none: a flick upward).' },
        A:    { dur: .26, h: [.22, .6], x0: 0, x1: 84, dmg: 8, kb: 60 },
        AA:   { dur: .28, h: [.22, .6], x0: 0, x1: 84, dmg: 8, kb: 60 },
        AAA:  { name: 'Clam Drop', dur: .42, h: [.25, .62], x0: 0, x1: 70, dmg: 14, kb: 140, spike: 1, power: 2, desc: 'Third air blow: shield down on them.' },
        JH:   { name: 'Shell Comet', dur: .55, h: [.15, .97], x0: -24, x1: 50, dmg: 20, kb: 180, dive: 1, shock: 90, bounce: 1, power: 2, ram: 1, desc: 'Fall on the shell: +1 layer if it lands.' },
        D:    { name: 'Shell Surf', dur: .8, h: [.1, .85], x0: 0, x1: 54, dmg: 5, kb: 200, lunge: 460, multi: .12, power: 1, depth: 26, desc: 'Ride the shell down the street.' },
        DX:   { name: 'Breakwater', dur: .62, h: [.12, .72], x0: 0, x1: 54, dmg: 18, kb: 380, lunge: 380, power: 2, carry: 1, wall: 1, depth: 28, desc: 'Shield first: shove them all ahead of you.' },
        R:    { name: 'Hermit Spin', dur: .5, h: [.12, .82], x0: 0, x1: 64, dmg: 5, kb: 160, around: 1, multi: .12, power: 1, desc: 'Out of a dodge: tucked in the shell, spinning.' },
      }),
      rows: (t) => [['guard: blows become layers; full, they are spat back', 'Hold Heavy', 'Clamshell'], ['charge, the pearl bursts, shards ricochet', 'let go of the guard', t.HC.name], ['spend every layer', 'Heavy, Heavy', t.HH.name],
        ['skewer, pin, and home again', 'Heavy', t.H.name], ['one layer as a shot', 'Hold Attack', t.X.name], ['held fast', 'Attack ×3', t.LLL.name], ['ride it', 'Run, Attack', t.D.name]],
      pick(m) { if (m.key === 'H' && P.state === 'charge' && clock() - G.lastCatch < .35) return WP().tree.HC; return m; },
      guard(dmg, fromX) {
        const front = Math.sign(fromX - P.x) === P.facing || Math.abs(fromX - P.x) < 12;
        if (P.state !== 'charge' || !front) return false;
        const just = (P.ct || 0) < .22 + .03 * stat().p.grd, src = typeof HIT_SRC !== 'undefined' ? HIT_SRC : null;
        // OVERFLOW: the pearl already full, what is caught is spat straight back at whoever sent it
        if (G.layers >= 5) { const tg = src && src.e && !src.e.dead ? src.e : inFront(300, 50); addObj({ kind: 'spit', x: P.x + fc() * 30, y: P.y, z: P.z + 42, dir: fc(), d: 0, hit: new Set(), n: 2, tgt: tg, m: Object.assign({}, WP().tree.X, { perfect: 0 }), bw: 40, bh: 40 }); ev('overflow'); note('OVERFLOW', '#FFF2C0', 13, 100); sfx('shoot'); }
        add(just ? 2 : 1); G.lastCatch = clock(); ev(just ? 'just' : 'catch'); P.inv = Math.max(P.inv, .3); hitstop = Math.max(hitstop, just ? .1 : .06); sfx('hit-metal', .6); sfx('hit-crystal');
        floatText(P.x, P.y, P.z + 84, just ? 'JUST!' : 'CAUGHT', just ? '#FFF2C0' : '#F2D68A', just ? 16 : 13); sparkle(P.x + P.facing * 18, P.y, P.z + 40, just ? 14 : 8);
        if (src && src.kind === 'proj' && src.p) src.p.life = 0;
        if (src && src.e && just && !src.e.boss) { src.e.state = 'hurt'; src.e.t = .6; src.e.plan = null; src.e.vx = P.facing * 120; }
        P.x -= P.facing * 6; return true;
      },
      timing() { if (P.state !== 'charge') return null; const since = clock() - G.lastCatch; if (since < .3) return { open: true, over: 0, mul: 1, since: 0, at: G.lastCatch }; return null; },
      began(m) {
        if (m.lance) for (const o of S.objs) if (o.kind === 'jav') { o.ph = 2; o.v = 1500; o.pinned = []; }
        if (m.jav) { addObj({ kind: 'jav', x: P.x + fc() * 24, y: P.y, z: P.z + 44, dir: fc(), d: 0, out: 330 * RK(), ph: 0, v: 980, stuck: [], hit: new Set(), m, pt: 0, bw: 120, bh: 60 }); sfx('shoot'); sfx('whoosh'); ev('javelin'); }
        if (m.lance) { const L = G.layers; G.layers = 0; P.move = Object.assign({}, P.move, { x1: P.move.x1 + Math.round(40 * L * RK()), dmg: P.move.dmg + 8 * L, layersUsed: L }); if (L) { note('PEARL LANCE ×' + L, '#FFF2C0', 13); ev('lance'); } }
        if (m.burst) P._ssL = G.layers;
        if (m.spit && G.layers > 0) { G.layers--; ev('spit'); addObj({ kind: 'spit', x: P.x + fc() * 30, y: P.y, z: P.z + 42, dir: fc(), d: 0, hit: new Set(), n: 2, m, bw: 40, bh: 40 }); sfx('shoot'); }
      },
      extras(m, k) {
        if (m.burst) once('burst', k, .52, () => nacreBurst(m));
        if (m.carry && k < .72) for (const [e] of P.hits) if (e && !e.dead && !e.boss && e.x !== undefined) { e.x = P.x + fc() * (e.hw + 30); e.y += (P.y - e.y) * .3; e.state = 'hurt'; e.t = Math.max(e.t, .3); }
        return false;
      },
      onHit(e, m) {
        // (one layer a ram, however many it lands on)
        if (m.ram && P._pmRamGot !== P.moveId) { P._pmRamGot = P.moveId; add(1); ev('ram'); }
        if (m.snap && !e.boss && !e.dead) { e.state = 'hurt'; e.t = .9; e.plan = null; e.vx = 0; }
      },
      obj(o, dt) { if (o.kind === 'jav') return stepJav(o, dt); if (o.kind === 'shard') return stepShard(o, dt); if (o.kind !== 'spit') return;
        if (o.tgt && !o.tgt.dead) { o.dir = Math.sign(o.tgt.x - o.x) || o.dir; o.y += (o.tgt.y - o.y) * Math.min(1, dt * 6); }
        o.x += o.dir * 560 * dt; o.d += 560 * dt;
        for (const e of foes()) { if (o.hit.has(e) || !touch(e, o.x, o.y, o.z, 8)) continue; o.hit.add(e); hitE(e, 16, o.dir, o.m, { kb: 200, launch: 0 }); sparkle(o.x, o.y, o.z, 6); if (--o.n <= 0) { o.gone = true; break; } }
        if (o.d > 420 * RK()) o.gone = true; },
      step(dt) { G.flash = Math.max(0, G.flash - dt); },
      draw(list, t) {
        list.push([P.y + .25, () => onMain(() => { // the pearl's layers over his head, and the shell's guard while it is up
          const z = P.z; ctx.save();
          for (let i = 0; i < G.layers; i++) { const a = t * 2 + i / 5 * TWO, x = P.x + Math.cos(a) * 12, y = P.y - z - 102 + Math.sin(a) * 3; PN.art.pearlBody(x, y, 2.6 + (G.flash > 0 && i === G.layers - 1 ? 1.5 : 0), t, 1, pal()); }
          if (P.state === 'charge') { ctx.globalCompositeOperation = 'lighter'; const q = Math.min(1, (P.ct || 0) / .2); ctx.strokeStyle = `rgba(${rgb()},${(.35 + .3 * q).toFixed(2)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(P.x + P.facing * 22, P.y - z - 40, 9, 30 * q, 0, 0, TWO); ctx.stroke(); }
          ctx.restore(); })]);
        for (const o of S.objs) {
          if (o.kind === 'spit') list.push([o.y + .3, () => onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(o.x, o.y - o.z, 14, .5); ctx.restore(); PN.art.pearlBody(o.x, o.y - o.z, 4, t, 1, pal()); })]);
          if (o.kind === 'jav') list.push([o.y + .3, () => onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(o.x, o.y - o.z, 22, .45); ctx.globalAlpha = .85;
            const pd = o.ph === 2 ? -o.dir : o.dir; drawPic(o.x - pd * 40, o.y - o.z, pd > 0 ? 0 : PI, 1, .85, 0); ctx.restore();
            if (o.ph === 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ring(o.x, o.y, 0, 20 + 4 * Math.sin(t * 20), .6, 2); ctx.restore(); } })]);
          if (o.kind === 'shard') list.push([o.y + .3, () => onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(o.x, o.y - o.z, 10, .6); ctx.restore(); PN.art.pearlBody(o.x, o.y - o.z, 3, t, 1, pal()); })]);
          if (o.kind === 'burst') list.push([o.y + .3, () => onMain(() => { const k = o.t / o.max; ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 10; i++) { const a = i / 10 * TWO + k, r = o.r * k; glow(o.x + Math.cos(a) * r, o.y + Math.sin(a) * r * .32 - 20, 8, .6 * (1 - k)); } ctx.restore(); })]);
        }
      },
      carry(pose, st) { if (st === 'jump') { pose.arm = .2; pose.elbow = .7; pose.grip = -.4; return; } pose.arm = st === 'run' ? 1.2 : .55; pose.elbow = .9; pose.grip = st === 'run' ? -.2 : -.3; pose.backArm = 1.4; },
      chargePose(pose, ct) { const q = Math.min(1, ct / .12); pose.crouch = 0; pose.arm = lerp(.5, -.25, q); pose.elbow = lerp(.6, 1.5, q); pose.grip = lerp(0, -1.45, q); pose.lean = .1; pose.sink = 6; pose.legs = { f: 12, b: -13, fk: 6, bk: 5 }; pose.backArm = 2.2; pose.yaw = -.25; pose.glow = perfectGlow() || null; },
    };
    // the javelin: out, skewering (they ride the point), pinned where it stops, then home through all between
    function stepJav(o, dt) {
      if (o.ph === 0) { const px = o.x; o.x += o.dir * o.v * dt; o.d += o.v * dt;
        for (const e of foes()) { if (o.hit.has(e) || segD(e, px, o.y, o.x, o.y) > e.hw + 8 || Math.abs(e.z + e.hh * .5 - o.z) > e.hh * .5 + 26) continue; o.hit.add(e);
          hitE(e, o.m.dmg, o.dir, o.m, { kb: 0, launch: 0 }); sparkle(e.x, e.y, e.z + e.hh * .5, 6);
          if (!e.boss && !e.dead && o.stuck.length < 3) { o.stuck.push(e); if (o.stuck.length <= 2) add(1); ev('skewer'); } }
        o.stuck.forEach((e, i) => { if (e.dead) return; e.x = o.x - o.dir * (16 + i * (e.hw + 12)); e.y += (o.y - e.y) * Math.min(1, dt * 10); e.state = 'hurt'; e.t = Math.max(e.t, .5); e.vx = 0; e.plan = null; });
        if (o.d >= o.out || o.x < leftWall() + 6 || o.x > rightWall() - 6) { o.x = clamp(o.x, leftWall() + 6, rightWall() - 6); o.ph = 1; o.pt = 0; shakeMag = Math.max(shakeMag, o.stuck.length ? 7 : 3); sfx('slam'); dust(o.x, o.y, 8);
          if (o.stuck.length) { floatText(o.x, o.y, 110, o.stuck.length > 1 ? 'SKEWERED ×' + o.stuck.length : 'PINNED', '#FFF2C0', 14); for (const e of o.stuck) if (!e.dead) hitE(e, 6, o.dir, o.m, { kb: 0, launch: 0, key: 'PIN' }); }
          o.pinned = o.stuck.slice(); o.stuck = []; } }
      else if (o.ph === 1) { o.pt += dt; for (const e of o.pinned) if (!e.dead) { e.state = 'hurt'; e.t = Math.max(e.t, .7); e.vx = 0; e.plan = null; }
        if (o.pt > .4) { o.ph = 2; o.v = 1100; o.hit = new Set(o.pinned); } }
      else { const tx = P.x + o.dir * 20, ty = P.y, tz = P.z + 44, d = Math.hypot(tx - o.x, (ty - o.y) * 2) || 1, v = Math.min(d, o.v * dt), px = o.x, py = o.y; o.x += (tx - o.x) / d * v; o.y += (ty - o.y) / d * v * 2; o.z += (tz - o.z) * Math.min(1, dt * 10);
        for (const e of foes()) { if (o.hit.has(e) || segD(e, px, py, o.x, o.y) > e.hw + 8 || e.z > 80) continue; o.hit.add(e); hitE(e, 8, -o.dir, o.m, { kb: 160, launch: 120 }); }
        if (d < 14) { o.gone = true; sparkle(P.x + fc() * 20, P.y, P.z + 44, 6); sfx('hit-metal', .4); } }
      if (o.t > 2.6) o.gone = true;
    }
    // the guard let go: where the charge stops, the pearl bursts, and its shards hop on from foe to foe
    function nacreBurst(m) {
      const L = P._ssL || 0; P._ssL = 0; G.layers = Math.max(0, G.layers - L); const cx = P.x + fc() * 26;
      if (L) { const R = (60 + 16 * L) * RK(), d = (8 + 4 * L) * (m.perfect ? 1.2 : 1); note('NACRE BURST', '#FFF2C0', 15); ev('burst'); flashT = Math.max(flashT, .05); sfx('hit-crystal'); sfx('slam');
        fx.push({ kind: 'ring', x: cx, y: P.y, z: 2, t: .4, max: .4, r: R, col: '#FFF2C0', flat: 1 }); addObj({ kind: 'burst', x: cx, y: P.y, r: R, max: .35, bw: R + 20, bh: 80 });
        for (const e of foes()) if (Math.hypot(e.x - cx, (e.y - P.y) * 2) < R + e.hw && e.z < 90) hitE(e, d, Math.sign(e.x - cx) || fc(), m, { kb: 280, launch: 200, perfect: m.perfect }); }
      const n = L + (m.perfect ? 2 : 0); if (!n) return; ev('shrapnel');
      for (let i = 0; i < Math.min(5, n); i++) { const a = (i / Math.max(1, n)) * TWO; addObj({ kind: 'shard', x: cx + Math.cos(a) * 20, y: P.y + Math.sin(a) * 8, z: P.z + 40, tgt: null, hops: 1, hit: new Set(), k: i, wait: .05 * i, max: 2, bw: 30, bh: 30 }); }
    }
    function stepShard(o, dt) {
      if ((o.wait -= dt) > 0) return;
      if (!o.tgt || o.tgt.dead || !enemies.includes(o.tgt)) { o.tgt = nearest(o.x, o.y, 280, null, (e) => !o.hit.has(e)); if (!o.tgt) { o.gone = true; sparkle(o.x, o.y, o.z, 4); return; } }
      const e = o.tgt, tx = e.x, ty = e.y, tz = e.z + e.hh * .55, d = Math.hypot(tx - o.x, ty - o.y, tz - o.z) || 1, v = Math.min(d, 640 * dt);
      o.x += (tx - o.x) / d * v; o.y += (ty - o.y) / d * v; o.z += (tz - o.z) / d * v;
      if (d < 12) { o.hit.add(e); hitE(e, 7, Math.sign(e.x - P.x) || 1, { pm: 'shieldspear', key: 'SHARD', kb: 90, power: 0, pe: .15 }); sparkle(o.x, o.y, o.z, 5, ['#FFFFFF', '#FFF2C0']); sfx('hit-crystal', .3); ev('ricochet');
        o.tgt = null; if (--o.hops < 0) o.gone = true; }
    }
    POSE('shieldspear', {
      L: KF([[0, { a: .3, e: .6, g: -.2, x: 0, l: .05 }], [.3, { a: .1, e: .3, g: 0, x: -.3 }], [.6, { a: 0, e: 0, g: 0, x: 1, l: .3, s: 4, lg: [15, -12, 8, 1], sh: 2 }], [1, { a: .3, e: .5, x: 0, l: .1, s: 2, sh: 0, lg: [10, -9, 4, 3] }]], { fn: (pose, m, k) => { if (k > .3 && k < .66) pose.streak = { len: 50, a: .7, col: pal().trail }; } }),
      LL: KF([[0, { a: .3, e: .5, g: -.1, l: .1 }], [.3, { a: -.2, e: .3, g: .1, x: -.3, y: .2 }], [.6, { a: -.15, e: 0, g: .1, x: 1, l: .32, y: -.1, s: 5, lg: [16, -13, 9, 1] }], [1, { a: .3, e: .5, x: 0, l: .1, s: 2, y: 0 }]], { fn: (pose, m, k) => { if (k > .3 && k < .66) pose.streak = { len: 50, a: .7, col: pal().trail }; } }),
      LLL: KF([[0, { a: .5, e: 1.3, g: -1.3, l: 0 }], [.32, { a: .3, e: 1.6, g: -1.5, l: -.1, y: -.4 }], [.56, { a: -.1, e: .4, g: -1.6, l: .4, y: .3, s: 6, lg: [15, -12, 9, 1] }], [1, { a: .4, e: .8, g: -.6, l: .1, s: 2, y: 0 }]]),
      H: KF([[0, { a: .4, e: .8, g: -.4, l: 0, s: 3 }], [.26, { a: .3, e: 1.2, g: -1.4, l: -.3, y: -.5, s: 4, ba: -1.8, be: .6, oh: 1, lg: [8, -14, 4, 6] }], [.4, { a: .5, e: .9, g: -1.4, l: .5, y: .3, s: 8, ba: .6, be: 0, lg: [17, -15, 10, 0], sh: 3 }], [1, { a: .4, e: .9, g: -.8, l: .15, s: 3, sh: 0, y: 0, ba: 1.4, be: .3, oh: 0, lg: [10, -10, 4, 3] }]]),
      HH: KF([[0, { a: .2, e: .5, g: 0, l: 0, th: 1, gg: 14 }], [.34, { a: .1, e: .3, x: -.5, l: -.2, s: 6, lg: [10, -14, 6, 5] }], [.6, { a: 0, e: 0, x: 1, l: .55, s: 9, lg: [19, -17, 11, 0], sh: 4 }], [1, { a: .3, x: 0, l: .15, s: 3, sh: 0, lg: [10, -10, 4, 3] }]], { fn: (pose, m, k) => { if (k > .34 && k < .7) pose.streak = { len: Math.min(240, (m.x1 || 90) - 30), a: .9, col: m.layersUsed ? 'rgba(255,242,192,.98)' : pal().trail }; } }),
      HC: KF([[0, { a: .2, e: 1.5, g: -1.5, l: .5, s: 7, lg: [17, -16, 10, 0], st: 1.1, fl: 16, y: -.2 }], [.5, { a: .1, l: .6 }], [.58, { a: -.1, e: .3, g: -1.6, l: .45, s: 9, lg: [17, -14, 11, 0], st: 1, fl: 4 }], [1, { a: .4, e: .8, g: -.6, l: .1, s: 3, y: 0, lg: [10, -10, 4, 3] }]]),
      X: KF([[0, { a: .5, e: 1.2, g: -1.4, l: 0 }], [.3, { a: .2, e: 1.5, g: -1.5, l: .2, s: 4 }], [.5, { a: -.6, e: .2, g: -.6, l: .1, s: 2, y: .3 }], [1, { a: -.3, e: .4, g: -.4, y: 0 }]]),
      A: KF([[0, { a: .2, e: .5, g: 0, x: -.3, lg: [7, -9, 10, 8] }], [.22, { x: -.3 }], [.6, { a: .3, e: 0, x: 1, l: .3 }], [1, { a: .4, x: 0 }]]),
      AA: KF([[0, { a: -.2, e: .5, g: 0, x: -.3, lg: [8, -8, 12, 6] }], [.22, { x: -.3 }], [.6, { a: -.3, e: 0, x: 1, l: .2 }], [1, { a: 0, x: 0 }]]),
      AAA: KF([[0, { a: -1.6, e: 1.2, g: -1.5, r: 0, lg: [6, -8, 12, 10] }], [.25, { a: -1.9, r: -.2 }], [.62, { a: 1.1, e: .6, g: -1.6, l: .5, r: .4 }], [1, { a: 1, r: .25 }]]),
      JH: KF([[0, { a: .5, e: 1.3, g: -1.5, lg: [6, -8, 12, 10] }], [.15, { a: 1.3, e: .5, g: -1.7, l: .2, lg: [8, -6, 16, 16], oy: -4 }], [1, { a: 1.3 }]]),
      D: KF([[0, { a: 1.2, e: .6, g: -1.6, l: .2, s: 10, cr: 1, lg: [14, -12, 12, 10], fl: 18, st: 1.05 }], [1, { a: 1.2, s: 10 }]], { fn: (pose, m, k) => { pose.yaw = .4 + .1 * Math.sin(k * 20); } }),
      DX: KF([[0, { a: .2, e: 1.5, g: -1.5, l: .5, s: 7, lg: [17, -16, 10, 0], st: 1.1, fl: 16, y: -.2 }], [.72, { a: .1, l: .6 }], [1, { a: .4, e: .9, g: -.8, l: .15, s: 3, st: 1, fl: 4, lg: [10, -10, 4, 3], y: 0 }]]),
      R: KF([[0, { a: .9, e: 1.6, g: -1.5, l: .4, s: 10, cr: 1, lg: [12, -12, 12, 10] }], [.12, { sp: 0 }], [.82, { sp: -3 * TWO }], [1, { sp: -3 * TWO, cr: 0, s: 3, l: .1, lg: [10, -10, 4, 3] }]]),
    });
  }

  // ======================================================================================================
  // 6. THE WARSHIELD: THE REEF
  // Heavy drives the great scallop into the street, and it stands there: a reef. Shots break on it, and bare-handed he
  // fights round it, every palm and kick driving foes into it (REEF!: they come off it hurt and dazed). Heavy by it rings
  // it like a bell; held Heavy rolls it back to his hand through everyone between; jump off it to come down on them.
  // ======================================================================================================
  {
    const R = { reef: null, wheel: null };
    const away = () => !!(R.reef || R.wheel);
    const nearReef = (d = 90) => R.reef && Math.abs(P.x - R.reef.x) < d && Math.abs(P.y - R.reef.y) < 40;
    function plant(x, y) { x = clamp(x, leftWall() + 20, rightWall() - 20); R.reef = { x, y, t: 0 }; ev('plant'); R.wheel = null; shakeMag = Math.max(shakeMag, 6); sfx('slam'); dust(x, y, 10); note('REEF', '#F2D68A', 13); fx.push({ kind: 'ring', x, y, z: 2, t: .35, max: .35, r: 60, col: pal().edge, flat: 1 }); }
    TY.warshield = {
      reset() { R.reef = null; R.wheel = null; },
      peek: () => ({ reef: !!R.reef, reefX: R.reef ? Math.round(R.reef.x) : null, wheel: !!R.wheel }),
      tree: () => ({
        L:    { name: 'Clap', dur: .4, h: [.32, .58], x0: 0, x1: 66, dmg: 12, kb: 160, lunge: 40, depth: 26, power: 1, desc: 'Shield bashes.' },
        LL:   { name: 'Clap', dur: .42, h: [.32, .58], x0: 0, x1: 66, dmg: 13, kb: 180, lunge: 40, depth: 26, power: 1 },
        LLL:  { name: 'Scallop Gust', dur: .5, h: [.34, .6], x0: 0, x1: 150, dmg: 9, kb: 520, depth: 40, power: 1, wall: 1, desc: 'Fan the shell: a gust throws them back.' },
        H:    { name: 'Reef Drop', dur: .55, h: [.42, .58], x0: 0, x1: 74, dmg: 20, kb: 200, shock: 90, power: 2, depth: 26, plantAt: .5, desc: 'Drive the shield into the street. It stands.' },
        HC:   { name: 'Coral Bastion', dur: .6, h: [.42, .58], x0: 0, x1: 74, dmg: 18, kb: 160, power: 2, plantAt: .5, bastion: 1, desc: 'Hold Heavy, gleam: plant it in rings of coral spikes.' },
        X:    { name: 'Turtle', dur: 2, h: [3, 3], x0: 0, x1: 0, dmg: 0, kb: 0, hold: 1, turtle: 1, desc: 'Hold Attack: crouch behind it; blows from in front stop.' },
        A:    { dur: .3, h: [.22, .6], x0: 0, x1: 64, dmg: 10, kb: 120 },
        AA:   { dur: .32, h: [.22, .6], x0: 0, x1: 64, dmg: 11, kb: 120 },
        AAA:  { name: 'Lid', dur: .42, h: [.25, .62], x0: 0, x1: 70, dmg: 15, kb: 140, spike: 1, power: 2 },
        JH:   { name: 'Gate Fall', dur: .55, h: [.15, .97], x0: -20, x1: 60, dmg: 20, kb: 180, dive: 1, shock: 100, bounce: 1, power: 2, plantLand: 1, desc: 'Fall shield-first; it stands where it lands.' },
        D:    { name: 'Wheel', dur: .4, h: [3, 3], x0: 0, x1: 0, dmg: 15, kb: 260, power: 1, wheel: 1, desc: 'Roll it down the street; it stands where it stops.' },
        DX:   { name: 'Ram', dur: .55, h: [.15, .62], x0: 0, x1: 60, dmg: 18, kb: 380, lunge: 400, power: 2, wall: 1, depth: 28 },
        R:    { name: 'Shell Flip', dur: .48, h: [.25, .62], x0: 0, x1: 68, dmg: 14, kb: 200, hop: 200, lunge: 120, power: 1, around: 1 },
        // with the reef standing: bare hands
        pL:   { name: 'Undertow Palm', seq: ['A'], dur: .26, h: [.3, .6], x0: 0, x1: 46, dmg: 8, kb: 300, lunge: 50, toReef: 1, w: 'fists', desc: 'Reef standing: palms that drive them into it.' },
        pLL:  { name: 'Undertow Palm', seq: ['A', 'A'], dur: .28, h: [.3, .6], x0: 0, x1: 46, dmg: 9, kb: 320, lunge: 50, toReef: 1 },
        pLLL: { name: 'Breaker Kick', seq: ['A', 'A', 'A'], dur: .42, h: [.35, .6], x0: 0, x1: 58, dmg: 13, kb: 520, lunge: 80, power: 1, toReef: 1, desc: 'A kick that sends them flying into the reef.' },
        pH:   { name: 'Ring the Reef', seq: ['H'], dur: .55, h: [3, 3], x0: 0, x1: 0, dmg: 18, kb: 200, power: 2, bell: 1, desc: 'By the reef: strike it, it rings out all round.' },
        pHC:  { name: 'Recall Roll', seq: ['HOLD'], dur: .5, h: [3, 3], x0: 0, x1: 0, dmg: 22, kb: 300, power: 2, recall: 1, desc: 'Hold Heavy: it rolls back to you through all between.' },
        pX:   { name: 'Shove', seq: ['HOLDA'], dur: .45, h: [.35, .55], x0: 0, x1: 50, dmg: 10, kb: 700, toReef: 1, power: 2, desc: 'Both palms: hard into the reef.' },
        pA:   { dur: .28, h: [.2, .6], x0: 0, x1: 50, dmg: 8, kb: 260, toReef: 1 },
        pAA:  { dur: .3, h: [.2, .6], x0: 0, x1: 52, dmg: 9, kb: 280, toReef: 1 },
        pAAA: { dur: .4, h: [.25, .62], x0: 0, x1: 56, dmg: 12, kb: 200, spike: 1, power: 2 },
        pJH:  { name: 'Springboard', seq: ['JUMP', '+H'], dur: .7, h: [.4, .97], x0: -10, x1: 56, dmg: 20, kb: 260, shock: 80, bounce: 1, power: 2, spring: 1, desc: 'Jump by the reef, Heavy: off it, high, and down on them.' },
        pD:   { name: 'Reef Slide', seq: ['RUN', '+A'], dur: .5, h: [.12, .62], x0: 0, x1: 54, dmg: 13, kb: 340, lunge: 440, power: 1, toReef: 1 },
        pR:   { name: 'Reef Spring', seq: ['DODGE', '+A'], dur: .5, h: [.25, .62], x0: 0, x1: 58, dmg: 14, kb: 300, hop: 260, lunge: 360, power: 1, airCarry: 1, wallJump: 1, desc: 'Dodge, Attack by it: kick off it at them.' },
      }),
      rows: (t) => [['plant the shield: a reef', 'Heavy', t.H.name], ['palms drive foes into it', 'Attack, reef standing', t.pL.name + ' → ' + t.pLLL.name], ['it rings out all round', 'Heavy by the reef', t.pH.name],
        ['rolls back through them', 'Hold Heavy, reef standing', t.pHC.name], ['off it, high, and down', 'Jump by it, Heavy', t.pJH.name], ['roll it, it stands', 'Run, Attack', t.D.name], ['plant in coral', 'Hold Heavy, gleam', t.HC.name]],
      pick(m) {
        const k = m.key, tr = WP().tree;
        if (k === 'SIG') return m;
        if (away()) { if (k[0] !== 'p') { const alt = k === 'HC' ? 'pHC' : k === 'DX' ? 'pD' : 'p' + k; return tr[alt] || tr.pL; } return m; }
        if (k[0] === 'p') return tr[k.slice(1)] || tr.L;
        return m;
      },
      began(m) {
        if (m.wheel) { ev('wheel'); R.wheel = addObj({ kind: 'wheel', x: P.x + fc() * 30, y: P.y, dir: fc(), d: 0, out: 280 * RK(), hit: new Set(), m, spin: 0, bw: 80, bh: 90 }); sfx('whoosh'); }
        if (m.recall && R.reef) { ev('recallRoll'); addObj({ kind: 'wheel', x: R.reef.x, y: R.reef.y, back: 1, hit: new Set(), m, spin: 0, dir: Math.sign(P.x - R.reef.x) || 1, bw: 80, bh: 90 }); R.wheel = S.objs[S.objs.length - 1]; R.reef = null; sfx('whoosh'); }
        if (m.bell && R.reef) { if (Math.abs(P.x - R.reef.x) < 170) { P.facing = Math.sign(R.reef.x - P.x) || P.facing; P.vx = (R.reef.x - P.facing * 30 - P.x) * 5; } }
        if (m.spring && nearReef(100)) { P.vz = 520; const e = nearest(P.x, P.y, 300); P.jvx = e ? clamp((e.x - P.x) / .7, -300, 300) : -fc() * 120; if (e) P.facing = Math.sign(e.x - P.x) || P.facing; sfx('jump'); note('SPRING', pal().edge, 12); }
        if (m.wallJump && nearReef(110)) { const e = nearest(P.x, P.y, 320); if (e) P.facing = Math.sign(e.x - P.x) || P.facing; P.vx = P.facing * 420; }
      },
      extras(m, k, dt, air) {
        holdEnds(m, k);
        if (m.plantAt !== undefined) once('plant', k, m.plantAt, () => { plant(P.x + fc() * 56, P.y); if (m.bastion) addObj({ kind: 'coral', x: R.reef.x, y: R.reef.y, waves: m.perfect ? 3 : 2, n: 0, m, bw: 200, bh: 80 }); });
        if (m.plantLand && P.z <= 0) once('pl', 1, 0, () => plant(P.x + fc() * 30, P.y));
        if (m.bell && R.reef) once('bell', k, .4, () => { if (Math.abs(P.x - R.reef.x) > 80) { note('TOO FAR', '#C8D4EC', 11); return; } bell(m); });
        if (m.spring && k > .4 && P.z > 0) P.vz = Math.min(P.vz, -650);
        return false;
      },
      guard(dmg, fromX) { if (P.state === 'atk' && P.move && P.move.turtle && (Math.sign(fromX - P.x) === P.facing || Math.abs(fromX - P.x) < 10)) { sfx('hit-metal', .5); sparkle(P.x + P.facing * 20, P.y, 40, 6); P.inv = Math.max(P.inv, .2); const src = typeof HIT_SRC !== 'undefined' ? HIT_SRC : null; if (src && src.p) src.p.life = 0; floatText(P.x, P.y, 80, 'BLOCKED', '#F2D68A', 11); return true; } return false; },
      // a driven foe is steered at the reef: it keeps its way on it (whatever else knocks it about) until it gets there
      onHit(e, m) { if (m.toReef && R.reef && !e.boss && !e.dead) { const F = R.reef, d = Math.sign(F.x - e.x) || P.facing, v = Math.max(260, m.kb) * (e.def.weight || 1);
        e.vx = d * v; e.wallOK = false; e.pmReefD = d; e.pmReefV = Math.max(220, v * .8); e.pmToReef = clock() + clamp(Math.abs(F.x - e.x) / e.pmReefV + .35, .8, 1.6); } },
      enemy(e, dt) {
        const F = R.reef; if (!F || e.dead || e.boss || !(e.pmToReef > clock()) || (e.pmSplat || 0) > clock()) return;
        const d = e.pmReefD || Math.sign(F.x - e.x) || 1;
        // it reaches the reef: touching it (a generous reach), or knocked on past it, a little off the lane or not
        if ((Math.abs(e.x - F.x) < e.hw + 26 || (e.x - F.x) * d > 0) && Math.abs(e.y - F.y) < 46 && e.z < 90) {
          e.x = F.x - d * (e.hw + 12); e.vx = -d * 120; e.pmSplat = clock() + .5; e.pmToReef = 0;
          hitE(e, 12, -d, { pm: 'warshield', key: 'SPLAT', kb: 120, power: 2, pe: .5 }); if (!e.dead) { e.state = 'hurt'; e.t = .9; e.plan = null; }
          floatText(e.x, e.y, e.z + e.hh + 18, 'REEF!', '#F2D68A', 14); ev('splat'); sfx('hit-metal'); shakeMag = Math.max(shakeMag, 5); sparkle(F.x, F.y, 40, 10); F.ring = .3;
          return;
        }
        // not there yet: still sliding at it, drawn into its lane
        if (Math.sign(e.vx) !== d || Math.abs(e.vx) < e.pmReefV) e.vx = d * e.pmReefV;
        e.y += (F.y - e.y) * Math.min(1, dt * 6);
        if (!e.air) { e.state = 'hurt'; e.t = Math.max(e.t, .12); e.plan = null; }
      },
      step(dt) {
        const F = R.reef; if (!F) return; F.t += dt; F.ring = Math.max(0, (F.ring || 0) - dt);
        if (Math.abs(P.x - F.x) > VW * .9 || F.x < camX - 60 || F.x > camX + VW + 60) { R.reef = null; note('THE SHIELD COMES BACK', '#C8D4EC', 11); return; }
        for (const p of projs) if (p.owner === 'e' && !p.ground && Math.abs(p.x - F.x) < 14 && Math.abs(p.y - F.y) < 30 && (p.z || 30) < 70) { p.life = 0; sparkle(F.x, F.y, 40, 6); sfx('hit-metal', .4); F.ring = .2; }
      },
      obj(o, dt) {
        if (o.kind === 'wheel') { o.spin += dt * 14 * o.dir;
          if (o.back) { const tx = P.x, d = tx - o.x; o.dir = Math.sign(d) || o.dir; o.x += o.dir * Math.min(Math.abs(d), 520 * dt); o.y += (P.y - o.y) * Math.min(1, dt * 8); if (Math.abs(d) < 16) { o.gone = true; R.wheel = null; sfx('hit-metal', .4); } }
          else { o.x += o.dir * 440 * dt; o.d += 440 * dt; if (o.d >= o.out || o.x < leftWall() + 20 || o.x > rightWall() - 20) { o.gone = true; plant(o.x, o.y); } }
          for (const e of foes()) { if (o.hit.has(e) || !touch(e, o.x, o.y, 20, 18)) continue; o.hit.add(e); hitE(e, o.m.dmg, o.dir, o.m, { kb: 300 }); }
          if (o.t > 3) { o.gone = true; R.wheel = null; } }
        if (o.kind === 'coral') { const at = o.n * .25; if (o.t >= at && o.n < o.waves) { o.n++; ev('coral'); const r = (40 + 50 * o.n) * RK(); sfx('hit-crystal'); fx.push({ kind: 'nova', x: o.x, y: o.y, z: 0, t: .4, max: .4, r, col: '#F08A7A', style: 'crystal', seed: Math.random() * 6 });
            for (const e of foes()) { const d = Math.hypot(e.x - o.x, (e.y - o.y) * 2); if (d < r + e.hw && d > r - 60 && e.z < 60) hitE(e, 12, Math.sign(e.x - o.x) || 1, o.m, { kb: 100, launch: 320 }); } }
          if (o.n >= o.waves && o.t > at + .3) o.gone = true; }
      },
      draw(list, t) {
        const F = R.reef;
        if (F) list.push([F.y, () => { const rise = sst(F.t / .15), wob = F.ring > 0 ? Math.sin(t * 60) * .04 : 0;
          onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(F.x, F.y - 40, 34, .25 + .2 * (F.ring > 0 ? 1 : 0)); ring(F.x, F.y, 0, 22, .4); ctx.restore(); });
          drawPic(F.x, F.y + 10 * (1 - rise) + 4, -PI / 2 + wob, 1.05, 1, 6); }]);
        for (const o of S.objs) if (o.kind === 'wheel') list.push([o.y, () => drawPic(o.x, o.y - 26, o.spin, .9, 1, 30)]);
      },
      posed(pose) { if (away() && (P.state !== 'atk' && P.state !== 'air' || (P.move && P.move.key && P.move.key[0] === 'p') || (P.move && P.move.wheel))) { pose.weapon = 'fists'; pose.twoHand = 0; } },
      carry(pose, st) { if (away()) { pose.arm = st === 'jump' ? .9 : 1.1; pose.elbow = 1.4; pose.backArm = 1.2; pose.backElbow = 1.6; pose.openHand = 1; return; }
        if (st === 'jump') { pose.arm = .2; pose.elbow = 1.2; pose.grip = -1.4; return; } pose.arm = st === 'run' ? 1.5 : .6; pose.elbow = 1.3; pose.grip = st === 'run' ? -1.2 : -1.5; pose.backArm = 1.45; },
      chargePose(pose, ct) { if (away()) { pose.crouch = 0; pose.arm = .3; pose.elbow = 1.6; pose.backArm = -.4; pose.backElbow = 1.4; pose.openHand = 1; pose.lean = -.1; pose.sink = 6; pose.legs = { f: 12, b: -12, fk: 7, bk: 4 }; return; }
        const q = Math.min(1, ct / .45); pose.crouch = 0; pose.arm = lerp(.5, -2.3, q); pose.elbow = .3; pose.grip = lerp(-1.4, -.3, q); pose.lean = -.25 * q; pose.sink = 4; pose.legs = { f: 10, b: -12, fk: 4, bk: 6 }; pose.backArm = -1.8; pose.backElbow = .3; pose.twoHand = 1; pose.gripGap = 8; },
    };
    function bell(m) { const F = R.reef, r = 125 * RK(); F.ring = .5; sfx('hit-metal'); play(220, .7, .09, 'sine'); play(331, .6, .05, 'sine'); shakeMag = Math.max(shakeMag, 6); note('DONG', '#F2D68A', 16); ev('bell');
      for (let i = 0; i < 3; i++) fx.push({ kind: 'ring', x: F.x, y: F.y, z: 2 + i * 20, t: .3 + i * .1, max: .3 + i * .1, r: r * (.6 + i * .25), col: '#F2D68A', flat: 1 });
      for (const e of foes()) if (Math.hypot(e.x - F.x, (e.y - F.y) * 2) < r + e.hw && e.z < 90) hitE(e, m.dmg, Math.sign(e.x - F.x) || 1, m, { kb: 260, launch: 220 }); }
    const FI = { w: 'fists' };
    POSE('warshield', {
      L: KF([[0, { a: .5, e: 1.3, g: -1.5, l: 0 }], [.32, { a: .9, e: 1.5, g: -1.5, l: -.15, y: -.5 }], [.58, { a: -.3, e: .4, g: -1.6, l: .4, y: .4, s: 6, lg: [15, -12, 9, 1] }], [1, { a: .5, e: 1.2, g: -1.5, l: .1, s: 2, y: 0 }]]),
      LL: KF([[0, { a: -.2, e: .5, g: -1.6, l: .2 }], [.32, { a: -1, e: .8, g: -1.3, l: -.1, y: .4 }], [.58, { a: .6, e: .3, g: -1.4, l: .35, y: -.3, s: 6 }], [1, { a: .6, e: 1.2, g: -1.5, l: .1, s: 2, y: 0 }]]),
      LLL: KF([[0, { a: .9, e: .4, g: -.3, l: .1 }], [.34, { a: 2.2, e: .2, g: 0, l: -.2, y: -.4, lg: [7, -11, 3, 6] }], [.6, { a: -.6, e: .1, g: -.9, l: .4, y: .5, s: 7, lg: [16, -12, 9, 1] }], [1, { a: -.3, g: -.6, l: .15, y: .1, s: 3 }]], { tr: [[.34, .6]], trW: 10 }),
      H: KF([[0, { a: .5, e: .2, g: -.5, th: 1, gg: 8 }], [.42, { a: -2.4, g: -.5, l: -.3, s: 0, lg: [6, -9, 2, 6] }], [.58, { a: 1.35, g: .2, l: .7, s: 12, lg: [17, -15, 12, 0] }], [1, { a: 1.3, l: .45, s: 9 }]], { tr: [[.42, .58]], trW: 10 }),
      HC: KF([[0, { a: -2.3, e: .3, g: -.3, th: 1, gg: 8, l: -.25 }], [.42, { a: -2.5, l: -.35 }], [.58, { a: 1.35, g: .2, l: .7, s: 12, lg: [17, -15, 12, 0] }], [1, { a: 1.3, l: .45, s: 9 }]], { tr: [[.42, .58]], trW: 10 }),
      X: KF([[0, { a: .2, e: 1.6, g: -1.5, l: .3, s: 12, cr: 1, lg: [12, -12, 14, 12] }], [1, { a: .2 }]]),
      A: KF([[0, { a: -1, e: .3, g: -.8, lg: [7, -9, 10, 8] }], [.22, { a: -1.3 }], [.6, { a: .9, g: -.3, l: .3 }], [1, { a: .8 }]], { tr: [[.22, .6]] }),
      AA: KF([[0, { a: 1, e: .3, g: -.3, l: .2, lg: [8, -8, 12, 6] }], [.22, { a: 1.2 }], [.6, { a: -1.1, g: -.8, l: -.1 }], [1, { a: -.9 }]], { tr: [[.22, .6]] }),
      AAA: KF([[0, { a: -2.4, e: .2, g: -.4, r: 0, lg: [6, -8, 12, 10], th: 1, gg: 8 }], [.25, { a: -2.8, r: -.2 }], [.62, { a: 1.5, g: .2, l: .5, r: .4 }], [1, { a: 1.3, r: .25 }]], { tr: [[.25, .62]], trW: 10 }),
      JH: KF([[0, { a: -1.4, e: .3, g: -1, lg: [6, -8, 12, 10], th: 1, gg: 8 }], [.15, { a: 1.5, e: .2, g: -.2, l: .3, lg: [4, -6, 16, 16] }], [1, { a: 1.5 }]]),
      D: KF([[0, { a: 1.6, e: .2, g: -.3, l: .3, s: 8, lg: [15, -14, 10, 2] }], [.3, { a: .3, g: -.3, l: .45, x: 1, ba: 2.4, y: .2 }], [1, { a: 1.1, e: 1.2, g: 0, l: .1, x: 0, s: 3, ba: 1.4, y: 0, w: 'fists', lg: [10, -10, 4, 3] }]]),
      DX: KF([[0, { a: .3, e: 1.5, g: -1.5, l: .5, s: 7, lg: [17, -16, 10, 0], st: 1.1, fl: 16, y: -.3 }], [.62, { a: .1, l: .6 }], [1, { a: .5, e: 1.2, l: .15, s: 3, st: 1, fl: 4, lg: [10, -10, 4, 3], y: 0 }]]),
      R: KF([[0, { a: .4, e: 1.3, g: -1.4, l: .2, s: 6 }], [.25, { r: 0, a: -.4 }], [.62, { r: -TWO, a: -.2 }], [1, { r: -TWO, a: .5, s: 3 }]]),
      pL: KF([[0, { ...FI, a: 1, e: 1.7, ba: 1.3, be: 1.9, l: .05, oh: 1 }], [.3, { a: 1.1, e: 1.9, y: -.3 }], [.6, { a: -.05, e: 0, l: .3, y: .35, s: 4, lg: [14, -11, 7, 1], sh: 2 }], [1, { a: .9, e: 1.6, l: .1, y: 0, s: 2, sh: 0, lg: [10, -9, 4, 3] }]]),
      pLL: KF([[0, { ...FI, a: 1, e: 1.7, ba: 1.3, be: 1.9, oh: 1 }], [.3, { ba: 1.5, be: 2, y: .2 }], [.6, { ba: -.05, be: 0, y: .6, l: .3, s: 4, lg: [13, -12, 7, 1] }], [1, { ba: 1.3, be: 1.9, y: 0, l: .1, s: 2 }]]),
      pLLL: KF([[0, { ...FI, a: .9, e: 1.7, ba: 1.2, be: 1.9, l: .1, oh: 0, kk: 0 }], [.3, { kk: 1, l: -.2, y: -.3 }], [.6, { kk: 1, l: -.45, y: -.5, ks: 'lunge' }], [1, { kk: 0, l: .1, y: 0 }]], { fn: (pose, m, k) => { if (k > .25 && k < .8) { pose.kickK = clamp((k - .2) * 1.4, 0, 1); pose.kickH = [.35, .7]; pose.kickStyle = 'lunge'; } } }),
      pH: KF([[0, { ...FI, a: .9, e: 1.6, oh: 0, ba: 1.3, be: 1.8 }], [.4, { a: 1.2, e: 1.9, l: -.2, y: -.5, s: 4 }], [.55, { a: -.05, e: 0, l: .45, y: .4, s: 7, lg: [16, -13, 9, 0] }], [1, { a: .9, e: 1.5, l: .1, s: 2, y: 0 }]]),
      pHC: KF([[0, { ...FI, a: -.1, e: 0, oh: 1, x: 1, l: -.15, s: 6, lg: [10, -13, 5, 6], ba: 1.6 }], [.6, { a: -.3, e: .8, x: .3 }], [1, { a: .9, e: 1.4, x: 0, l: .05, s: 2, lg: [9, -9, 3, 3] }]]),
      pX: KF([[0, { ...FI, a: 1, e: 1.8, ba: 1, be: 1.9, oh: 1, l: -.1, s: 5 }], [.35, { a: 1.2, e: 2, ba: 1.2, be: 2.1, l: -.2 }], [.55, { a: 0, e: 0, ba: 0, be: 0, l: .45, s: 7, lg: [16, -13, 9, 0], y: .3 }], [1, { a: .9, e: 1.6, ba: 1.3, be: 1.8, l: .1, s: 2, y: 0 }]]),
      pA: KF([[0, { ...FI, a: .9, e: 1.7, oh: 1, lg: [7, -9, 10, 8] }], [.2, { e: 1.9 }], [.6, { a: .1, e: 0, l: .25 }], [1, { a: .8, e: 1.5 }]]),
      pAA: KF([[0, { ...FI, a: .9, e: 1.7, oh: 1, lg: [8, -8, 12, 6] }], [.6, { ba: 0, be: 0, y: .5 }], [1, { ba: 1.3, be: 1.8, y: 0 }]]),
      pAAA: KF([[0, { ...FI, a: -2.2, e: .4, r: 0, lg: [6, -8, 12, 10] }], [.25, { a: -2.6, r: -.2 }], [.62, { a: 1.2, e: 0, l: .5, r: .4 }], [1, { a: 1, r: .25 }]]),
      pJH: KF([[0, { ...FI, a: -.6, e: 1.4, ba: -.8, be: 1.4, l: -.2, lg: [6, -8, 12, 10] }], [.4, { a: .2, e: 1.6, l: .2, r: .3 }], [1, { a: .6, e: 1.5, l: .3, r: .3 }]], { fn: (pose, m, k) => { if (k > .4) { pose.kickK = .6; pose.kickH = [.3, .7]; pose.kickStyle = 'drop'; pose.kickAir = true; } } }),
      pD: KF([[0, { ...FI, a: 1.1, e: .9, oh: 1, l: .2, s: 6, oy: 12, r: -.5, lg: [26, 18, 0, 12], st: 1.12, fl: 18 }], [.75, { oy: 12 }], [1, { oy: 0, r: 0, lg: [10, -10, 4, 3], st: 1, s: 2, l: .1, fl: 4 }]]),
      pR: KF([[0, { ...FI, a: .9, e: 1.6, l: -.2, lg: [6, -8, 12, 10] }], [.25, { r: 0 }], [.62, { r: .4, l: .2 }], [1, { r: 0, l: .1 }]], { fn: (pose, m, k) => { if (k > .2 && k < .75) { pose.kickK = .6; pose.kickH = [.3, .7]; pose.kickStyle = 'drop'; pose.kickAir = P.z > 2; } } }),
    });
  }

  // ======================================================================================================
  // 7. THE TRIDENT: FLOODGATE
  // Heavy strikes the street and the sea comes up through it: the street floods, a level at a time (three at most).
  // In the water they wade, slow; and every move draws on it: the third thrust raises spouts in three lanes, a held
  // Attack bursts a geyser under one of them, held Heavy drains the whole flood into one whirlpool. It ebbs on its own.
  // ======================================================================================================
  {
    const F = { lvl: 0, v: 0, t: 0 };
    const SLOW = [1, .8, .65, .5], SLOWB = [1, .92, .86, .8];
    const raise = (n = 1) => { F.lvl = Math.min(3, F.lvl + n); F.t = 0; };
    TY.trident = {
      reset() { F.lvl = 0; F.v = 0; F.t = 0; },
      peek: () => ({ flood: F.lvl, whirls: S.objs.filter(o => o.kind === 'whirl').length }),
      tree: () => ({
        L:    { name: 'Tine', dur: .26, h: [.3, .6], x0: 0, x1: 92, dmg: 8, kb: 60, lunge: 40, depth: 22, desc: 'Thrusts.' },
        LL:   { name: 'Tine', dur: .28, h: [.3, .6], x0: 0, x1: 92, dmg: 9, kb: 70, lunge: 40, depth: 22 },
        LLL:  { name: 'Three Spouts', dur: .46, h: [.3, .56], x0: 0, x1: 96, dmg: 10, kb: 100, power: 1, spouts: 1, depth: 24, desc: 'Spouts burst in three lanes ahead (bigger in the flood).' },
        H:    { name: 'Floodgate', dur: .55, h: [.4, .56], x0: -40, x1: 60, dmg: 12, kb: 140, power: 2, around: 1, flood: 1, desc: 'The street floods a level (3 at most); a wave runs both ways.' },
        HH:   { name: 'Undertow', dur: .55, h: [.3, .6], x0: 0, x1: 110, dmg: 12, kb: 0, power: 1, pull: 1, depth: 34, desc: 'Sweep them in toward you; the deeper, the further.' },
        HC:   { name: 'Maelstrom', dur: .55, h: [3, 3], x0: 0, x1: 0, dmg: 12, kb: 0, power: 2, drain: 1, desc: 'Hold Heavy, gleam: the whole flood drains into one whirlpool.' },
        X:    { name: 'Geyser', dur: .45, h: [3, 3], x0: 0, x1: 0, dmg: 12, kb: 0, power: 2, geyser: 1, desc: 'Hold Attack: a geyser under the nearest foe.' },
        A:    { dur: .26, h: [.22, .6], x0: 0, x1: 88, dmg: 8, kb: 60 },
        AA:   { dur: .28, h: [.22, .6], x0: 0, x1: 88, dmg: 9, kb: 60 },
        AAA:  { name: 'Harpoon', dur: .42, h: [.25, .62], x0: 0, x1: 92, dmg: 14, kb: 140, spike: 1, power: 2, desc: 'Third air thrust: pinned down.' },
        JH:   { name: 'Splashdown', dur: .55, h: [.15, .97], x0: -20, x1: 60, dmg: 18, kb: 160, dive: 1, shock: 70, bounce: 1, power: 2, splash: 1, desc: 'Dive: the splash grows with the flood.' },
        D:    { name: 'Wave Rider', dur: .7, h: [.1, .8], x0: 0, x1: 80, dmg: 6, kb: 220, lunge: 420, multi: .12, power: 1, ride: 1, depth: 26, desc: 'Run, Attack: in the flood, surf a wave, carrying them.' },
        DX:   { name: 'Breach', dur: .64, h: [.5, .74], x0: 0, x1: 90, dmg: 22, kb: 200, hop: 340, lunge: 260, airCarry: 1, bounce: 1, shock: 80, power: 2, desc: 'Leap like a dolphin and drive down.' },
        R:    { name: 'Whirl', dur: .5, h: [.15, .8], x0: 0, x1: 80, dmg: 5, kb: 120, around: 1, multi: .12, power: 1, whirl: 1, desc: 'Out of a dodge: spin, leaving an eddy.' },
      }),
      rows: (t) => [['the street floods; they wade', 'Heavy', t.H.name], ['drain it all at once', 'Hold Heavy, gleam', t.HC.name], ['spouts in three lanes', 'Attack ×3', t.LLL.name],
        ['a geyser under one', 'Hold Attack', t.X.name], ['pull them in', 'Heavy, Heavy', t.HH.name], ['surf the flood', 'Run, Attack', t.D.name], ['splash grows with the water', 'Jump, Heavy', t.JH.name]],
      began(m) {
        if (m.flood) { raise(); ev('flood'); note(['', 'THE TIDE RISES', 'DEEPER', 'FLOODED'][F.lvl], '#9FE2D3', 14); sfx('hit-goo'); play(130 + 30 * F.lvl, .4, .07, 'sine');
          for (const d of [1, -1]) addObj({ kind: 'wave', x: P.x + d * 30, y: P.y, dir: d, d: 0, hit: new Set(), m, bw: 60, bh: 60 });
          if (cur() === 'storm') for (const e of foes()) if (!e.air && e.z < 10) { fx.push({ kind: 'bolt', x: P.x, y: P.y, z: 4, x2: e.x, y2: e.y, z2: 6, t: .2, max: .2, col: '#C8D0FF', seed: Math.random() * 99 }); hitE(e, 3 + 2 * F.lvl, Math.sign(e.x - P.x) || 1, m, { kb: 30, power: 0 }); } }
        if (m.drain) { const lv = F.lvl, R = (70 + 45 * lv) * RK() * (m.perfect ? 1.3 : 1) * (cur() === 'abyss' ? 1.4 : 1); F.lvl = 0; F.t = 0; ev(lv ? 'drain' : 'eddy');
          addObj({ kind: 'whirl', x: clamp(P.x + fc() * 90, leftWall() + 20, rightWall() - 20), y: P.y, r: R, lv, m, max: 1.2, tick: 0, bw: R + 40, bh: 120 }); note(lv ? 'MAELSTROM' : 'EDDY', '#9FE2D3', 15); sfx('hit-goo'); }
        if (m.geyser) { const e = inFront(240, 50) || nearest(P.x, P.y, 240); const x = e ? e.x : P.x + fc() * 90, y = e ? e.y : P.y; addObj({ kind: 'geyser', x, y, m, max: .7, done: false, bw: 60, bh: 200 }); }
        if (m.splash) P.move = Object.assign({}, P.move, { shock: (70 + 30 * F.lvl) * RK() });
        if (m.ride) P.move = Object.assign({}, P.move, F.lvl ? { lunge: 560, name: 'Wave Rider' } : { multi: 0, dur: P.move.dur * .75, h: [.15, .6], dmg: P.move.dmg * 2.4 });
        if (m.whirl && S0()) PN.addPool(P.x, P.y, 14 * wm(), S0());
      },
      extras(m, k) {
        if (m.spouts) once('sp', k, m.h[0], () => { for (const dy of [-26, 0, 26]) addObj({ kind: 'spout', x: P.x + fc() * 100 * RK(), y: clamp(P.y + dy, FLOOR_TOP + 6, FLOOR_BOT), m, max: .5, done: false, big: F.lvl, bw: 50, bh: 150 }); });
        if (m.pull) once('pull', k, m.h[0], () => { const r = (150 + 40 * F.lvl) * RK(); for (const e of foes()) { const dx = e.x - P.x; if (e.boss || Math.abs(dx) > r || Math.abs(e.y - P.y) > 50 || (Math.sign(dx) !== fc() && F.lvl < 2)) continue; e.vx = -Math.sign(dx) * (260 + 80 * F.lvl); e.state = 'hurt'; e.t = Math.max(e.t, .4); e.y += (P.y - e.y) * .5; } bubbles(P.x + fc() * 60, P.y, 10, 10, 80); });
        if (m.ride && F.lvl && k < .8) { for (const [e] of P.hits) if (e && !e.dead && !e.boss && e.x !== undefined) { e.x = P.x + fc() * (e.hw + 32); e.state = 'hurt'; e.t = Math.max(e.t, .3); } if (Math.random() < .6) bubbles(P.x - fc() * 10, P.y, 6, 2, 80); }
        return false;
      },
      step(dt) {
        F.v += (F.lvl - F.v) * Math.min(1, dt * 2.5); F.t += dt;
        if (F.lvl > 0 && F.t > (cur() === 'tide' ? 15 : 11)) { F.lvl--; F.t -= 3.5; }
      },
      enemy(e, dt, x0, y0) {
        if (F.lvl <= 0 || e.dead || e.air || e.z > 4 || !['idle', 'walk', 'wind'].includes(e.state)) return;
        const k = (e.boss ? SLOWB : SLOW)[F.lvl]; if (e.x !== x0 || e.y !== y0) ev('wade'); e.x = x0 + (e.x - x0) * k; e.y = y0 + (e.y - y0) * k;
        if (Math.random() < dt * 4 && Math.abs(e.x - x0) > .3) bubbles(e.x, e.y, 2, 1, 30);
      },
      obj(o, dt) {
        if (o.kind === 'wave') { o.x += o.dir * 330 * dt; o.d += 330 * dt;
          for (const e of foes()) { if (o.hit.has(e) || Math.abs(e.x - o.x) > e.hw + 12 || Math.abs(e.y - o.y) > 40 || e.z > 50) continue; o.hit.add(e); hitE(e, o.m.dmg + 3 * F.lvl, o.dir, o.m, { kb: 220, launch: 140 }); }
          if (o.d > (180 + 60 * F.lvl) * RK()) o.gone = true; }
        if (o.kind === 'spout' && !o.done && o.t > .08) { o.done = true; ev('spout'); sfx('hit-goo', .5); bubbles(o.x, o.y, 10, 8, 120);
          for (const e of foes()) if (Math.abs(e.x - o.x) < e.hw + 18 + 4 * o.big && Math.abs(e.y - o.y) < 16 + e.hw * .3 && e.z < 80) hitE(e, o.m.dmg * .9 + 3 * o.big, fc(), o.m, { kb: 60, launch: 300 + 60 * o.big }); }
        if (o.kind === 'geyser' && !o.done && o.t > .16) { o.done = true; ev('geyser'); sfx('hit-goo'); shakeMag = Math.max(shakeMag, 4); bubbles(o.x, o.y, 10, 14, 160);
          for (const e of foes()) if (Math.abs(e.x - o.x) < e.hw + 26 && Math.abs(e.y - o.y) < 24 && e.z < 100) hitE(e, o.m.dmg + 4 * F.lvl, Math.sign(e.x - P.x) || 1, o.m, { kb: 40, launch: 560 + 60 * F.lvl }); }
        if (o.kind === 'whirl') { o.tick -= dt;
          for (const e of foes()) { if (e.boss) continue; const dx = o.x - e.x, dy = o.y - e.y, d = Math.hypot(dx, dy * 2); if (d < o.r + e.hw && d > 6) { e.x += dx / d * 150 * dt; e.y += Math.sign(dy) * Math.min(Math.abs(dy), 50 * dt); } }
          if (o.tick <= 0) { o.tick = .15; for (const e of foes()) if (Math.hypot(e.x - o.x, (e.y - o.y) * 2) < o.r * .8 + e.hw && e.z < 60) hitE(e, 2 + o.lv, Math.sign(e.x - o.x) || 1, o.m, { kb: 10, power: 0, noStun: e.boss ? 0 : 1, pe: .15 }); }
          if (!o.burst && o.t > 1) { o.burst = true; sfx('slam'); shakeMag = Math.max(shakeMag, 7); bubbles(o.x, o.y, 10, 20, 200);
            for (const e of foes()) if (Math.hypot(e.x - o.x, (e.y - o.y) * 2) < o.r * .7 + e.hw && e.z < 90) hitE(e, o.m.dmg + 8 * o.lv, Math.sign(e.x - o.x) || 1, o.m, { kb: 120, launch: 520, perfect: o.m.perfect }); } }
      },
      draw(list, t) {
        if (F.v > .03) list.push([FLOOR_TOP - 1, () => onMain(() => { // the flood over the street, and its rings round every foot in it
          const a = .08 + .06 * F.v, x0 = camX - 20, w = VW + 40; ctx.save(); ctx.globalCompositeOperation = 'lighter';
          ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = `rgba(40,140,150,${(a + .04).toFixed(3)})`; ctx.fillRect(x0, FLOOR_TOP, w, FLOOR_BOT - FLOOR_TOP + 14); ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = `rgba(230,255,250,${(.22 + .12 * F.v).toFixed(2)})`; ctx.lineWidth = 1.6;
          for (let r = 0; r < 4; r++) { const y = FLOOR_TOP + (r + .5) * (FLOOR_BOT - FLOOR_TOP) / 4; ctx.beginPath(); for (let x = 0; x <= w; x += 24) { const yy = y + Math.sin(x * .05 + t * 1.6 + r * 2) * 2.2; x ? ctx.lineTo(x0 + x, yy) : ctx.moveTo(x0, yy); } ctx.stroke(); }
          for (const e of foes()) if (e.z < 6) ring(e.x, e.y, 0, e.hw * .8 + 4 * Math.sin(t * 5 + e.x), .5, 1.4, '230,255,250');
          if (P.z < 6) ring(P.x, P.y, 0, 14 + 3 * Math.sin(t * 5), .5, 1.4, '230,255,250');
          ctx.restore(); })]);
        for (const o of S.objs) {
          if (o.kind === 'wave') list.push([o.y + .2, () => onMain(() => { const h = 30 + 10 * F.lvl; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(${rgb()},.6)`; ctx.beginPath(); ctx.moveTo(o.x - o.dir * 30, o.y); ctx.quadraticCurveTo(o.x, o.y - h * 1.4, o.x + o.dir * 10, o.y); ctx.fill(); ctx.strokeStyle = 'rgba(240,255,252,.95)'; ctx.lineWidth = 2.6; ctx.stroke(); ctx.restore(); })]);
          if (o.kind === 'spout' || o.kind === 'geyser') list.push([o.y + .2, () => onMain(() => { const k = o.t / (o.max || .5), hgt = (o.kind === 'geyser' ? 150 : 80 + 20 * (o.big || 0)) * Math.sin(Math.min(1, k * 1.6) * PI * .5) * (1 - k * .6), wd = o.kind === 'geyser' ? 16 : 10;
            ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(0, o.y, 0, o.y - hgt); g.addColorStop(0, `rgba(${rgb()},.55)`); g.addColorStop(1, 'rgba(240,255,252,.1)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(o.x - wd, o.y); ctx.quadraticCurveTo(o.x - wd * .4, o.y - hgt * .5, o.x, o.y - hgt); ctx.quadraticCurveTo(o.x + wd * .4, o.y - hgt * .5, o.x + wd, o.y); ctx.fill(); ctx.restore(); })]);
          if (o.kind === 'whirl') list.push([o.y - .5, () => onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const rr = o.r * (1 - i * .22) * (o.t > 1 ? Math.max(0, 1 - (o.t - 1) * 5) : 1); ctx.strokeStyle = `rgba(${rgb()},${(.25 + i * .1).toFixed(2)})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(o.x, o.y, rr, rr * .32, 0, t * (4 + i) % TWO, t * (4 + i) % TWO + 4.2); ctx.stroke(); } ctx.restore(); })]);
        }
      },
      carry(pose, st) { if (st === 'jump') { pose.arm = .3; pose.elbow = .9; pose.grip = -1.3; return; } pose.arm = st === 'run' ? 1.6 : 1.2; pose.elbow = .5; pose.grip = st === 'run' ? -.6 : -1.5; pose.backArm = 1.45; },
      chargePose(pose, ct) { pose.crouch = 0; pose.arm = 1.2; pose.elbow = .3; pose.grip = -1.75 + Math.sin(ct * 20) * .08; pose.lean = .2; pose.sink = 7; pose.legs = { f: 12, b: -12, fk: 8, bk: 6 }; pose.backArm = -.8; pose.backElbow = .4; pose.openHand = 1; pose.yaw = .4; },
    };
    const T2 = { th: 1, gg: 15 };
    const thr = (pose, m, k, a, b) => { if (k > a && k < b) pose.streak = { len: 46, a: .7, col: pal().trail }; };
    POSE('trident', {
      L: KF([[0, { ...T2, a: .15, g: 0, x: 0, l: .05 }], [.3, { x: -.5, l: -.05 }], [.6, { x: 1, l: .32, s: 4, lg: [15, -12, 8, 1], sh: 2 }], [1, { x: 0, l: .1, s: 2, sh: 0, lg: [10, -9, 4, 3] }]], { fn: (p, m, k) => thr(p, m, k, .3, .66) }),
      LL: KF([[0, { ...T2, a: -.1, g: 0, x: 0, l: .05 }], [.3, { x: -.5, a: -.2, y: .2 }], [.6, { x: 1, a: -.25, l: .3, s: 4, y: -.1 }], [1, { x: 0, a: 0, l: .1, s: 2, y: 0 }]], { fn: (p, m, k) => thr(p, m, k, .3, .66) }),
      LLL: KF([[0, { ...T2, a: .3, g: 0, l: 0 }], [.3, { a: -.6, g: -.3, x: -.4, l: -.15, s: 2 }], [.56, { a: .55, g: .2, x: 1, l: .55, s: 9, lg: [17, -15, 11, 0], sh: 3 }], [1, { a: .4, x: 0, l: .2, s: 4, sh: 0 }]], { fn: (p, m, k) => thr(p, m, k, .3, .62) }),
      H: KF([[0, { ...T2, a: .9, g: -1.4, l: 0 }], [.4, { a: -.9, g: -1.6, l: -.3, s: 0, y: .4, lg: [7, -9, 3, 6] }], [.56, { a: 1.25, g: -1.75, l: .3, s: 10, y: .4, lg: [14, -12, 12, 4] }], [1, { a: 1.2, g: -1.7, l: .2, s: 7 }]]),
      HH: KF([[0, { ...T2, a: .1, g: 0, l: .2, s: 6, lg: [15, -14, 9, 2] }], [.3, { a: -.2, sw: 1, y: .4 }], [.6, { a: .1, sw: -1, y: -.5, l: .1 }], [1, { a: .2, sw: -1, y: 0, s: 3 }]], { fn: (p, m, k) => { if (k > .3 && k < .64) p.flat = { r: (WP().reach || 60) + 20, k: spn(k, .3, .6), rev: true, col: pal().trail, w: 6 }; } }),
      HC: KF([[0, { ...T2, a: 1.2, g: -1.75, l: .2, s: 7 }], [.3, { a: -.6, g: -.4, l: -.2, s: 2, y: .3 }], [.55, { a: .4, g: .4, x: 1, l: .5, s: 8, lg: [16, -14, 10, 0], y: 0 }], [1, { a: .5, x: 0, l: .2, s: 3 }]], { fn: (p, m, k) => thr(p, m, k, .3, .62) }),
      X: KF([[0, { ...T2, a: .4, g: 0 }], [.25, { a: -1.3, g: -.4, l: -.2, s: 2 }], [.45, { a: .45, g: 0, l: .4, s: 5, lg: [14, -12, 10, 2] }], [1, { a: .4, g: 0, l: .25, s: 3 }]]),
      A: KF([[0, { ...T2, a: .4, g: 0, x: -.4, lg: [7, -9, 10, 8] }], [.22, { x: -.4 }], [.6, { a: .5, x: 1, l: .3 }], [1, { x: 0 }]], { fn: (p, m, k) => thr(p, m, k, .22, .64) }),
      AA: KF([[0, { ...T2, a: -.3, g: 0, x: -.4, lg: [8, -8, 12, 6] }], [.22, { x: -.4 }], [.6, { a: -.2, x: 1, l: .2 }], [1, { x: 0 }]], { fn: (p, m, k) => thr(p, m, k, .22, .64) }),
      AAA: KF([[0, { ...T2, a: -1.3, g: -.3, x: -.3, r: 0, lg: [6, -8, 12, 10] }], [.25, { r: -.2 }], [.62, { a: 1.1, g: .2, x: 1, l: .4, r: .45 }], [1, { a: 1, x: 0, r: .3 }]], { fn: (p, m, k) => thr(p, m, k, .25, .66) }),
      JH: KF([[0, { ...T2, a: -1.6, g: -.4, l: -.1, lg: [6, -8, 12, 10] }], [.15, { a: 1.25, g: .1, x: .3, l: .35, lg: [4, -10, 14, 14] }], [1, { a: 1.25 }]]),
      D: KF([[0, { ...T2, a: .2, g: 0, x: .8, l: .35, s: 10, cr: 1, lg: [14, -12, 12, 10], fl: 18, st: 1.08, oy: -2 }], [1, { a: .2 }]], { fn: (p, m, k) => { p.yaw = .3 + .08 * Math.sin(k * 25); thr(p, m, k, .1, .8); } }),
      DX: KF([[0, { ...T2, a: .3, g: 0, l: .3, s: 6 }], [.4, { a: -.8, x: -.3, l: -.3, s: 0, r: -.3, lg: [6, -12, 14, 6] }], [.74, { a: .9, x: 1, l: .6, r: .5, s: 8, lg: [16, -14, 10, 1] }], [1, { a: .8, x: 0, l: .3, r: 0, s: 5 }]], { fn: (p, m, k) => thr(p, m, k, .5, .78) }),
      R: KF([[0, { ...T2, a: .1, g: 0, l: .3, s: 7, lg: [14, -14, 9, 2] }], [.15, { sp: 0 }], [.8, { sp: -2 * TWO }], [1, { sp: -2 * TWO, a: .4, s: 3, lg: [10, -10, 4, 3] }]], { fn: (p, m, k) => { if (k > .15 && k < .82) p.flat = { r: (WP().reach || 60) + 18, k: (k * 2) % 1, rev: false, col: pal().trail, w: 5 }; } }),
    });
  }

  // ======================================================================================================
  // 8. THE LANCE: THE NECKLACE
  // Every foe the lance pierces is strung on a thread of kelp-gold light, in the order struck (six at most), the thread
  // drawn from one to the next. Heavy pulls the clasp: every bead flies to the middle and they crack together, harder the
  // more there are. Heavy again cracks the thread like a whip. Held Heavy is a joust: a long charge that carries every foe
  // it meets on the point, then strings them all. A held Attack reels the beads in to him.
  // ======================================================================================================
  {
    const N = { beads: [], zap: 0 };
    const live = () => N.beads.filter(b => b.e && !b.e.dead && enemies.includes(b.e));
    function bead(e) { if (!e || e.dead) return; const b = N.beads.find(q => q.e === e); if (b) { b.t = 0; return; } if (N.beads.length >= 6) N.beads.shift(); N.beads.push({ e, t: 0 }); ev('bead'); sparkle(e.x, e.y, e.z + e.hh * .55, 5, ['#F2D68A', '#FFFFFF']); }
    TY.lance = {
      reset() { N.beads = []; },
      peek: () => ({ beads: live().length, pulling: S.objs.filter(o => o.kind === 'pull').length }),
      tree: () => ({
        L:    { name: 'Thread', dur: .28, h: [.32, .6], x0: 0, x1: 96, dmg: 8, kb: 50, lunge: 60, depth: 20, desc: 'Each foe pierced is strung on the thread (6 at most).' },
        LL:   { name: 'Thread', dur: .3, h: [.32, .6], x0: 0, x1: 98, dmg: 9, kb: 60, lunge: 60, depth: 20 },
        LLL:  { name: 'Pierce Through', dur: .48, h: [.34, .6], x0: 0, x1: 132, dmg: 14, kb: 160, lunge: 120, power: 1, depth: 22, desc: 'A long thrust: strings all in line.' },
        H:    { name: 'Couched Thrust', dur: .5, h: [.38, .58], x0: 0, x1: 110, dmg: 20, kb: 260, lunge: 160, power: 2, depth: 22, desc: 'Under two beads: a heavy thrust.' },
        Hc:   { name: 'The Clasp', seq: ['H'], dur: .5, h: [3, 3], x0: 0, x1: 0, dmg: 9, kb: 0, power: 2, clasp: 1, thread: 0, desc: 'Two beads or more: pull the thread tight; they crack together.' },
        HH:   { name: 'Whipcrack', dur: .5, h: [.3, .5], x0: 0, x1: 70, dmg: 11, kb: 120, power: 1, whip: 1, desc: 'Crack the thread: every bead and all it crosses are struck.' },
        HC:   { name: 'Narwhal Joust', dur: .62, h: [3, 3], x0: 0, x1: 0, dmg: 22, kb: 0, power: 2, joust: 1, desc: 'Hold Heavy, gleam: charge, carrying all you meet on the point.' },
        X:    { name: 'Reel', dur: 2, h: [3, 3], x0: 0, x1: 0, dmg: 0, kb: 0, hold: 1, reel: 1, thread: 0, desc: 'Hold Attack: reel the beads in to you.' },
        A:    { dur: .28, h: [.22, .6], x0: 0, x1: 92, dmg: 8, kb: 60 },
        AA:   { dur: .3, h: [.22, .6], x0: 0, x1: 92, dmg: 9, kb: 60 },
        AAA:  { name: 'Plumb Line', dur: .42, h: [.25, .62], x0: 0, x1: 96, dmg: 14, kb: 140, spike: 1, power: 2, desc: 'Third air thrust: straight down.' },
        JH:   { name: 'Falling Star', dur: .55, h: [.15, .97], x0: -10, x1: 70, dmg: 18, kb: 60, dive: 1, shock: 70, bounce: 1, power: 2, pin: 1, desc: 'Dive point-first: whoever it hits is pinned a moment.' },
        D:    { name: 'Joust Run', dur: .6, h: [.12, .66], x0: 0, x1: 96, dmg: 14, kb: 300, lunge: 460, power: 1, carry: 1, depth: 22, desc: 'Run, Attack: the first foe rides the point.' },
        DX:   { name: 'Tilt', dur: .64, h: [.5, .74], x0: 0, x1: 100, dmg: 22, kb: 220, hop: 300, lunge: 260, airCarry: 1, bounce: 1, shock: 80, power: 2 },
        R:    { name: 'Sidewind', dur: .46, h: [.15, .7], x0: 0, x1: 90, dmg: 9, kb: 160, around: 1, power: 1, desc: 'Out of a dodge: a wheel of the lance; strings all round.' },
      }),
      rows: (t) => [['pierced foes are strung', 'Attack', t.L.name], ['they crack together', 'Heavy, 2+ beads', t.Hc.name], ['whip the thread', 'Heavy, Heavy', t.HH.name],
        ['charge, carry, string them', 'Hold Heavy, gleam', t.HC.name], ['reel them in', 'Hold Attack', t.X.name], ['pinned', 'Jump, Heavy', t.JH.name], ['one rides the point', 'Run, Attack', t.D.name]],
      pick(m) { const n = live().length; if (m.key === 'H' && n >= 2) return WP().tree.Hc; if (m.key === 'Hc' && n < 2) return WP().tree.H; return m; },
      began(m) {
        if (m.clasp) clasp(m);
        if (m.whip) whip(m);
        if (m.joust) { ev('joust'); P._joust = { list: [], f: fc(), sp: (m.perfect ? 600 : 470) * RK() }; sfx('whoosh'); note(m.perfect ? 'JOUST!' : 'JOUST', '#F2D68A', 14); }
      },
      extras(m, k, dt) {
        holdEnds(m, k);
        if (m.reel) for (const b of live()) { const e = b.e; if (e.boss) continue; const dx = P.x + fc() * (e.hw + 30) - e.x; if (Math.abs(dx) > 6) { e.x += Math.sign(dx) * Math.min(Math.abs(dx), 180 * dt); e.y += (P.y - e.y) * Math.min(1, dt * 3); e.state = 'hurt'; e.t = Math.max(e.t, .2); } }
        if (m.carry && k < .66) { const e = [...P.hits.keys()].find(q => q && !q.dead && !q.boss && q.hw !== undefined); if (e) { e.x = P.x + fc() * (e.hw + 40); e.state = 'hurt'; e.t = Math.max(e.t, .3); } }
        if (m.joust && P._joust) { const J = P._joust; P.facing = J.f;
          if (k > .08 && k < .72) { P.x = clamp(P.x + J.f * J.sp * dt, leftWall(), rightWall()); P.inv = Math.max(P.inv, .1); if (Math.random() < .5) addGhost(false);
            for (const e of foes()) { if (J.list.includes(e) || (e.x - P.x) * J.f < -10 || (e.x - P.x) * J.f > 60 + e.hw || Math.abs(e.y - P.y) > 22 + e.hw * .3 || e.z > 80) continue;
              if (e.boss) { if (!J.boss) { J.boss = e; hitE(e, m.dmg, J.f, m, { kb: 100 }); } continue; } J.list.push(e); hitE(e, 5, J.f, m, { kb: 0, noStun: 0 }); }
            J.list.forEach((e, i) => { if (e.dead) return; e.x = P.x + J.f * (52 + i * 12); e.y += (P.y - e.y) * .3; e.z = 8 + i * 4; e.state = 'hurt'; e.t = .4; e.vx = 0; }); }
          if (k >= .72) once('jt', k, .72, () => { for (const e of J.list) { if (e.dead) continue; hitE(e, m.dmg, J.f, m, { kb: 420, launch: 200, wall: 1 }); bead(e); } shakeMag = Math.max(shakeMag, 6); P._joust = null; }); }
        return false;
      },
      onHit(e, m) { if (m.thread !== 0) bead(e); if (m.pin && !e.boss && !e.dead) { e.pmPin = clock() + 1.2; floatText(e.x, e.y, e.z + e.hh + 16, 'PINNED', '#F2D68A', 11); } },
      enemy(e, dt, x0, y0) { if (e.pmPin > clock() && !e.dead && !e.air) { e.x = x0; e.y = y0; } },
      step(dt) {
        for (const b of N.beads) b.t += dt;
        N.beads = N.beads.filter(b => b.e && !b.e.dead && enemies.includes(b.e) && b.t < 8);
        if (cur() === 'storm' && N.beads.length > 1) { N.zap -= dt; if (N.zap <= 0) { N.zap = 1.2; const L = live(); for (let i = 1; i < L.length; i++) fx.push({ kind: 'bolt', x: L[i - 1].e.x, y: L[i - 1].e.y, z: L[i - 1].e.z + 30, x2: L[i].e.x, y2: L[i].e.y, z2: L[i].e.z + 30, t: .18, max: .18, col: '#C8D0FF', seed: Math.random() * 99 });
          for (const b of L) hitE(b.e, 3, 1, { pm: 'lance', key: 'ZAP', kb: 20, power: 0, thread: 0, pe: 0, el: 1 }); } }
      },
      obj(o, dt) {
        if (o.kind === 'pull') { const e = o.e; if (!e || e.dead) { o.gone = true; return; } const u = sst(o.t / o.max); e.x = lerp(o.x0, o.cx, u); e.y = lerp(o.y0, o.cy, u); e.z = Math.sin(u * PI) * 30; e.state = 'hurt'; e.t = .4;
          if (o.t >= o.max) { o.gone = true; e.z = 0; hitE(e, o.d, Math.sign(e.x - o.cx) || 1, o.m, { kb: 160, launch: 260 }); if (!e.dead && !e.boss) { e.state = 'hurt'; e.t = .8; } } }
        if (o.kind === 'whip') { const L = o.pts, n = L.length, u = o.t / o.max, seg = Math.min(n - 1, Math.floor(u * (n - 1) + 1e-6));
          for (let i = 0; i <= seg && i < n; i++) { const p = L[i]; if (p.e && !o.hit.has(p.e) && !p.e.dead) { o.hit.add(p.e); hitE(p.e, o.m.dmg, P.facing, o.m, { kb: 140, launch: 120 }); sparkle(p.e.x, p.e.y, p.e.z + 30, 6, ['#F2D68A', '#FFFFFF']); } }
          for (let i = 1; i <= seg; i++) for (const e of foes()) { if (o.hit.has(e) || segD(e, L[i - 1].x, L[i - 1].y, L[i].x, L[i].y) > e.hw + 8 || e.z > 80) continue; o.hit.add(e); hitE(e, o.m.dmg * .8, P.facing, o.m, { kb: 100 }); }
          if (o.t >= o.max) o.gone = true; }
      },
      over(t) {
        const L = live(); if (!L.length && !S.objs.some(o => o.kind === 'whip')) return;
        { ctx.save(); ctx.globalCompositeOperation = 'lighter';
          const pt = (e) => [e.x, e.y - e.z - e.hh * .55];
          if (L.length > 1) { for (const [w, a] of [[7, .3], [2.4, .95]]) { ctx.strokeStyle = `rgba(242,214,138,${a})`; ctx.lineWidth = w; ctx.beginPath(); L.forEach((b, i) => { const [x, y] = pt(b.e), sag = i ? 6 * Math.sin(t * 3 + i) : 0; i ? ctx.quadraticCurveTo((x + pt(L[i - 1].e)[0]) / 2, (y + pt(L[i - 1].e)[1]) / 2 + 10 + sag, x, y) : ctx.moveTo(x, y); }); ctx.stroke(); } }
          for (const b of L) { const [x, y] = pt(b.e); glow(x, y, 16, .75, '242,214,138'); }
          for (const o of S.objs) if (o.kind === 'whip') { const u = o.t / o.max, n = o.pts.length, i = Math.min(n - 1, Math.floor(u * (n - 1))); const p = o.pts[i]; glow(p.x, p.y - 34, 26, .7, '255,242,192'); }
          ctx.restore(); for (const b of L) { const [x, y] = pt(b.e); PN.art.pearlBody(x, y, 5, t, 1, pal()); } }
      },
      carry(pose, st) { if (st === 'jump') { pose.arm = .1; pose.elbow = .9; pose.grip = -.9; return; } pose.arm = st === 'run' ? .5 : .95; pose.elbow = st === 'run' ? 1.4 : .6; pose.grip = st === 'run' ? -1 : -1.3; pose.backArm = 1.45; },
      chargePose(pose, ct) { const q = Math.min(1, ct / .45); pose.crouch = 0; pose.arm = .25; pose.elbow = 1.5; pose.grip = -1.5; pose.ext = -.4 * q; pose.lean = .35 * q; pose.sink = 8 * q; pose.legs = { f: 16, b: -16, fk: 9, bk: 2 }; pose.backArm = 2.4; pose.yaw = -.25; pose.glow = perfectGlow() || null; },
    };
    function clasp(m) {
      const L = live(); if (L.length < 2) return; const n = L.length, boss = L.find(b => b.e.boss), cx = boss ? boss.e.x : L.reduce((s, b) => s + b.e.x, 0) / n, cy = boss ? boss.e.y : L.reduce((s, b) => s + b.e.y, 0) / n, d = m.dmg + 3 * n;
      note('THE CLASP ×' + n, '#F2D68A', 15); ev('clasp'); sfx('whoosh'); fx.push({ kind: 'ring', x: cx, y: cy, z: 30, t: .4, max: .4, r: 50, col: '#F2D68A' });
      for (const b of L) { const e = b.e; if (e.boss) { addObj({ kind: 'pullB', max: .22 }); hitE(e, d * 1.2, Math.sign(e.x - P.x) || 1, m, { kb: 60 }); continue; }
        addObj({ kind: 'pull', e, x0: e.x, y0: e.y, cx: cx + rand(-8, 8), cy, max: .22, d, m, bw: 80, bh: 120 }); }
      if (cur() === 'tide' && S0()) PN.addPool(cx, cy, d * wm(), S0());
      if (cur() === 'abyss') for (const e of foes()) if (!e.boss && !L.some(b => b.e === e) && Math.hypot(e.x - cx, e.y - cy) < 140) { e.x += (cx - e.x) * .5; e.y += (cy - e.y) * .5; }
      N.beads = [];
    }
    function whip(m) { const L = live(); if (!L.length) return; const pts = [{ x: P.x + fc() * 30, y: P.y }].concat(L.map(b => ({ x: b.e.x, y: b.e.y, e: b.e }))); addObj({ kind: 'whip', pts, m, max: .35, hit: new Set(), bw: 400 }); ev('whip'); sfx('swing'); sfx('hit-crystal', .4); }
    const T2 = { th: 1, gg: 13 };
    const thr = (pose, m, k, a, b, len = 60) => { if (k > a && k < b) pose.streak = { len, a: .75, col: pal().trail }; };
    POSE('lance', {
      L: KF([[0, { ...T2, a: .1, g: 0, l: .05 }], [.32, { x: -.5, l: -.05, y: -.1 }], [.6, { x: 1, l: .35, s: 5, lg: [16, -13, 9, 1], sh: 3, y: .1 }], [1, { x: 0, l: .1, s: 2, sh: 0, y: 0, lg: [10, -9, 4, 3] }]], { fn: (p, m, k) => thr(p, m, k, .32, .66) }),
      LL: KF([[0, { ...T2, a: .1, g: 0, l: .05 }], [.32, { a: -.15, x: -.5, y: .2 }], [.6, { a: -.2, x: 1, l: .35, s: 5, lg: [16, -13, 9, 1], y: -.1 }], [1, { a: .1, x: 0, l: .1, s: 2, y: 0 }]], { fn: (p, m, k) => thr(p, m, k, .32, .66) }),
      LLL: KF([[0, { ...T2, a: .1, g: 0, l: 0, s: 3 }], [.34, { x: -.8, l: -.25, s: 6, lg: [10, -16, 6, 6] }], [.6, { x: 1, l: .6, s: 10, lg: [20, -18, 12, 0], sh: 4, st: 1.08 }], [1, { x: 0, l: .2, s: 4, sh: 0, st: 1, lg: [10, -10, 4, 3] }]], { fn: (p, m, k) => thr(p, m, k, .34, .66, 100) }),
      H: KF([[0, { ...T2, a: .15, e: 1.4, g: -1.5, l: .1, s: 4 }], [.38, { x: -.5, l: .2, s: 7, lg: [14, -16, 8, 2] }], [.58, { x: 1, l: .55, s: 9, lg: [19, -17, 11, 0], sh: 4 }], [1, { x: 0, l: .2, s: 4, sh: 0, lg: [10, -10, 4, 3] }]], { fn: (p, m, k) => thr(p, m, k, .38, .64, 80) }),
      Hc: KF([[0, { ...T2, a: .1, g: 0, l: .1 }], [.25, { a: -.5, g: -.4, l: -.35, s: 4, lg: [8, -14, 4, 7], y: -.3, ba: -.4 }], [.5, { a: -.3, g: -.3, l: -.4, s: 6, y: -.4 }], [1, { a: .1, g: 0, l: .05, s: 2, y: 0, lg: [10, -10, 4, 3] }]]),
      HH: KF([[0, { ...T2, a: .2, g: 0, l: .1 }], [.3, { a: -1.6, g: -.6, l: -.2, y: .4 }], [.5, { a: .6, g: .2, l: .4, s: 6, y: -.3, lg: [15, -13, 9, 1] }], [1, { a: .45, g: .1, l: .15, s: 3, y: 0 }]], { tr: [[.3, .5]] }),
      HC: KF([[0, { ...T2, a: .25, e: 1.5, g: -1.5, l: .35, s: 8, lg: [16, -16, 9, 2] }], [.08, { x: 1, l: .55, s: 9, lg: [20, -16, 10, 0], st: 1.12, fl: 18 }], [.72, { x: 1, l: .6 }], [1, { x: 0, l: .15, s: 3, st: 1, fl: 4, lg: [10, -10, 4, 3] }]], { fn: (p, m, k) => thr(p, m, k, .08, .74, 90) }),
      X: KF([[0, { ...T2, a: .3, g: -.2, l: -.3, s: 7, lg: [10, -16, 6, 5], y: -.3 }], [1, { a: .3 }]], { fn: (p, m, k) => { p.lean = -.3 + .05 * Math.sin(k * 30); } }),
      A: KF([[0, { ...T2, a: .4, g: 0, x: -.4, lg: [7, -9, 10, 8] }], [.22, { x: -.4 }], [.6, { a: .5, x: 1, l: .3 }], [1, { x: 0 }]], { fn: (p, m, k) => thr(p, m, k, .22, .64) }),
      AA: KF([[0, { ...T2, a: -.2, g: 0, x: -.4, lg: [8, -8, 12, 6] }], [.22, { x: -.4 }], [.6, { a: -.2, x: 1, l: .2 }], [1, { x: 0 }]], { fn: (p, m, k) => thr(p, m, k, .22, .64) }),
      AAA: KF([[0, { ...T2, a: -.4, g: 0, x: -.3, lg: [6, -8, 12, 10] }], [.25, { a: 1.2, x: -.3, r: .3 }], [.62, { a: 1.5, x: 1, l: .3, r: .45 }], [1, { a: 1.4, x: 0, r: .3 }]], { fn: (p, m, k) => thr(p, m, k, .25, .66) }),
      JH: KF([[0, { ...T2, a: -.6, g: 0, l: -.1, lg: [6, -8, 12, 10] }], [.15, { a: .8, g: 0, x: .4, l: .5, r: .3, lg: [4, -12, 14, 12] }], [1, { a: .8, r: .3 }]], { fn: (p, m, k) => thr(p, m, k, .15, 1) }),
      D: KF([[0, { ...T2, a: .2, e: 1.5, g: -1.5, x: 1, l: .5, s: 8, lg: [18, -16, 10, 0], st: 1.1, fl: 18 }], [.66, { x: 1 }], [1, { x: 0, l: .15, s: 3, st: 1, fl: 4, lg: [10, -10, 4, 3] }]], { fn: (p, m, k) => thr(p, m, k, .1, .68, 80) }),
      DX: KF([[0, { ...T2, a: .2, g: 0, l: .3, s: 6 }], [.4, { a: -.4, x: -.4, l: -.3, s: 0, lg: [6, -12, 14, 6] }], [.74, { a: .45, x: 1, l: .55, s: 8, lg: [16, -14, 10, 1] }], [1, { a: .4, x: 0, l: .25, s: 5 }]], { fn: (p, m, k) => thr(p, m, k, .5, .78) }),
      R: KF([[0, { ...T2, a: .1, g: 0, l: .3, s: 7, lg: [14, -14, 9, 2], th: 0 }], [.15, { sp: 0 }], [.7, { sp: -TWO }], [1, { sp: -TWO, a: .4, s: 3, lg: [10, -10, 4, 3] }]], { fn: (p, m, k) => { if (k > .15 && k < .74) p.flat = { r: (WP().reach || 60) + 24, k: spn(k, .15, .7), rev: false, col: pal().trail, w: 5 }; } }),
    });
  }

  // ======================================================================================================
  // EXPORTS, and the weapon rebuilt now this file is here
  // ======================================================================================================
  function forgeKind(type, n = 0) { for (let s = 1; s < 20000; s++) { const pk = PW.randomPicks(s), d = PW.design(s, pk); if (d.type === type && n-- <= 0) { PW.forgeNow(s, pk); return WEAPONS[ID].name; } } return null; }
  const peek = () => { const T = kind() && TY[kind()]; return Object.assign({ kind: kind(), ev: Object.assign({}, S.ev), objs: S.objs.length }, T && T.peek ? T.peek() : {}); };
  window.PEARLM = { build, rows, TY, S, KF, forge: forgeKind, mine, kinds: () => Object.keys(TY), statsOf, statsHtml, statLines, TRAIT_STATS, peek, clearEv: () => { S.ev = {}; } };
  try { PW.reregister(); } catch (e) { console.error(e); }
})();
