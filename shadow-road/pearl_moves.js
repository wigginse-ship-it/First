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
  const S = { stage: null, zone: -1, objs: [], path: [], presses: [], begun: -1 };
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
    return { p, pow: 1 + .045 * p.pow, spd: Math.max(.78, 1 - .025 * p.spd), rch: 1 + .035 * p.rch, crit: .015 * p.crit, imp: 1 + .07 * p.imp, grd: Math.max(.6, 1 - .035 * p.grd), flow: .05 * p.flow, win: .05 * p.win };
  }
  const stat = () => (SPEC() && SPEC().stats) || statsOf([]);
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
    return `<div class="pmStats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:2px 14px;margin:4px auto 6px;max-width:520px">${STATS.map(bar).join('')}</div><div class="pmStatTx" style="font-size:10.5px;opacity:.75;margin-bottom:6px">${statLines(st).join(' · ') || 'Even all round.'}</div>`;
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
    return T.rows(W.tree, spec).concat([['the pearl, out and back', 'Light + Heavy (PEARL)', W.sig.name]]);
  }

  // ======================================================================================================
  // THE HOOKS
  // ======================================================================================================
  { const _mpk = movePoseKey; movePoseKey = function (m) { return m && m.pm && P.w === ID ? 'pm:' + m.pm + ':' + m.key : _mpk(m); }; }
  { const _me = moveExtras; moveExtras = function (m, k, dt, air) { if (_me(m, k, dt, air)) return true; if (!m.pm || !mine()) return false; const T = TY[m.pm]; return T && T.extras ? !!T.extras(m, k, dt, air) : false; }; }
  { const _b = begin; begin = function (m) {
    if (m && typeof m === 'object' && m.pm && mine()) { const T = TY[m.pm]; if (T && T.pick) m = T.pick(m) || m; }
    const r = _b(m);
    if (mine() && P.move && P.move.pm && (P.state === 'atk' || P.state === 'air') && S.begun !== P.moveId) { S.begun = P.moveId; const T = TY[P.move.pm]; if (T && T.began) T.began(P.move); }
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
    if (ours) { const st = stat(); base *= st.pow; if (st.imp !== 1) mm = Object.assign({}, m, { kb: (m.kb || 0) * st.imp, launch: m.launch ? m.launch * (1 + (st.imp - 1) * .5) : m.launch }); }
    const hp0 = e ? e.hp : 0; _st(e, base, dir, mm, echo);
    if (ours && e && (e.hp < hp0 || e.dead)) { const T = TY[m.pm]; if (T && T.onHit) T.onHit(e, m, base, dir); } }; }
  { const _cc = critChance; critChance = function (e) { const c = _cc(e); return mine() ? Math.min(.6, c + stat().crit) : c; }; }
  { const _ml2 = moveListHtml; moveListHtml = function (id) { let h = _ml2(id); if (id === ID && SPEC()) { const st = SPEC().stats || statsOf(SPEC().picks), li = `<li class="got"><b>Forged stats</b><br><em>${STATS.map(s => STAT_NAME[s] + ' ' + st.p[s]).join(' · ')}${st.p.win ? ' · Gleam ' + st.p.win : ''}: ${statLines(st).join(', ') || 'even all round'}.</em></li>`; h = h.replace('<ul class="moves">', '<ul class="moves">' + li); } return h; }; }
  { const _rf = renderForge; renderForge = function (note) { _rf(note); try { if (!SPEC() || !save.owned[ID]) return; for (const c of document.querySelectorAll('#forgeCards .card')) { const nm = c.querySelector('.nm'); if (nm && nm.textContent === WP().name && !c.querySelector('.pmStats')) { const d = document.createElement('div'); d.innerHTML = statsHtml(SPEC()); const ul = c.querySelector('ul'); c.insertBefore(d, ul); } } } catch (e) { console.error(e); } }; }
  { const _ue = updateEnemy; updateEnemy = function (e, dt) { const T = mine() ? TY[kind()] : null; if (!T || !T.enemy) return _ue(e, dt); const x0 = e.x, y0 = e.y; _ue(e, dt); T.enemy(e, dt, x0, y0); }; }
  const _up = updatePlayer;
  updatePlayer = function (dt) {
    const zi = typeof zoneIdx !== 'undefined' ? zoneIdx : 0;
    if (S.stage !== stage || S.zone !== zi) { S.stage = stage; S.zone = zi; resetPlace(); }
    const on = mine(), T = on ? TY[kind()] : null;
    if (on) {
      if (pressed.light || pressed.heavy) S.presses.push(clock()); if (S.presses.length > 6) S.presses.shift();
      if (P.state === 'air' && P.move && P.move.pm && T.extras) T.extras(P.move, P.t / P.move.dur, dt, true); // (game.js steps air moves without moveExtras)
    }
    _up(dt);
    if (!mine()) { if (S.objs.length || S.live) { resetPlace(); S.live = false; } return; }
    S.live = true;
    S.path.push({ x: P.x, y: P.y, t: clock() }); while (S.path.length > 150 || (S.path.length && clock() - S.path[0].t > 2.4)) S.path.shift();
    if (P.state === 'charge' && T.charge) T.charge(dt);
    if (T.step) T.step(dt);
    for (const o of S.objs) { o.t = (o.t || 0) + dt; try { T.obj && T.obj(o, dt); } catch (err) { o.gone = true; console.error(err); } if (o.max && o.t >= o.max) o.gone = true; }
    S.objs = S.objs.filter(o => !o.gone);
  };
  { const _pp = playerPose; playerPose = function () {
    const pose = _pp(); if (!mine()) return pose;
    const T = TY[kind()]; pose.weapon = ID; pose.tier = Math.min(7, save.wl[ID] || 1);
    if (P.state === 'charge' && T.chargePose) T.chargePose(pose, P.ct || 0);
    else if (['idle', 'walk', 'run', 'jump'].includes(P.state) && T.carry) T.carry(pose, P.state);
    if (T.posed) T.posed(pose);
    return pose;
  }; }
  { const _ml = mechList; mechList = function (list, t) { _ml(list, t); if (!mine()) return; const T = TY[kind()]; if (T && T.draw) try { T.draw(list, t); } catch (e) { console.error(e); } }; }
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
  // ======================================================================================================
  {
    const ECHO_K = .42, ECHO_N = 3, ECHO_USES = 3, ECHO_LAG = .32;
    const E = { list: [] };
    const tint = () => { const c = pal().accent; return c; };
    function addEcho(x, y, facing) {
      if (E.list.length >= ECHO_N) E.list.shift();
      x = clamp(x, leftWall() + 8, rightWall() - 8);
      E.list.push({ x, y, facing, t: 0, life: 5, q: [], cur: null, ct: 0, hits: new Map(), uses: 0, z: 0, born: 0 });
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
        hitE(e, m.dmg * ECHO_K, m.around ? Math.sign(e.x - o.x) || o.facing : o.facing, Object.assign({}, m, { pe: m.pe * .5, echoOf: 1 }));
        fx.push({ kind: 'slash', x: e.x, y: e.y, z: e.z + e.hh * .5, ang: rand(-.6, .6), t: .2, max: .2, size: 26, col: pal().edge });
      }
    }
    TY.glaive = {
      reset() { E.list = []; },
      tree: (sp) => ({
        L:    { name: 'Wake Cut', dur: .3, h: [.32, .6], x0: 0, x1: 84, dmg: 9, kb: 70, depth: 22, lunge: 60, desc: 'A rising cut.' },
        LL:   { name: 'Backwash', dur: .34, h: [.3, .62], x0: -10, x1: 86, dmg: 10, kb: 90, depth: 24, lunge: 50, desc: 'A turning backhand.' },
        LLL:  { name: 'Tide-Mark', dur: .52, h: [.3, .66], x0: 0, x1: 88, dmg: 14, kb: 220, around: 1, depth: 30, lunge: 40, power: 1, echoAt: .62, desc: 'A full wheel of the blade. Leaves an echo that copies your blows.' },
        H:    { name: 'Breaker Cleave', dur: .52, h: [.42, .6], x0: 0, x1: 92, dmg: 24, kb: 260, depth: 26, lunge: 110, power: 2, echoAt: .6, echoDx: 70, desc: 'Overhead. Leaves an echo where it lands.' },
        Hr:   { name: 'Call the Echoes', seq: ['H'], dur: .5, h: [3, 3], x0: 0, x1: 0, dmg: 14, kb: 260, power: 2, recall: 1, noEcho: 1, desc: 'With echoes standing: they rush back into you through everything between.' },
        HH:   { name: 'Undertow Spiral', dur: .62, h: [.14, .86], x0: 0, x1: 80, dmg: 6, kb: 120, around: 1, multi: .13, depth: 30, power: 1, desc: 'Spin low, twice.' },
        HC:   { name: 'Ebb Rewind', dur: .5, h: [3, 3], x0: 0, x1: 0, dmg: 28, kb: 280, power: 2, rewind: 1, echoAs: 'HH', desc: 'Hold Heavy, let go in the gleam: run back along the way you came, cutting it all again.' },
        X:    { name: 'Still Pool', dur: .42, h: [3, 3], x0: 0, x1: 0, dmg: 0, kb: 0, echoAt: .5, echoDx: 40, noEcho: 1, desc: 'Hold Attack: set an echo down in front of you.' },
        A:    { dur: .28, h: [.22, .62], x0: 0, x1: 80, dmg: 9, kb: 70 },
        AA:   { dur: .3, h: [.22, .62], x0: 0, x1: 80, dmg: 10, kb: 80 },
        AAA:  { name: 'Gull Dive', dur: .42, h: [.25, .66], x0: 0, x1: 84, dmg: 14, kb: 140, spike: 1, power: 2, desc: 'Third air cut: spikes them down.' },
        JH:   { name: 'Falling Tide', dur: .55, h: [.15, .97], x0: -20, x1: 60, dmg: 20, kb: 160, dive: 1, shock: 110, bounce: 1, power: 2, desc: 'Plunge blade-first.' },
        D:    { name: 'Wake Rush', dur: .5, h: [.2, .62], x0: 0, x1: 82, dmg: 15, kb: 300, lunge: 430, power: 1, depth: 24, echoAt: 0, echoDx: -10, desc: 'A running cut. Leaves an echo where you set off.' },
        DX:   { name: 'Breaking Wave', dur: .64, h: [.5, .72], x0: 0, x1: 90, dmg: 22, kb: 200, hop: 300, lunge: 220, airCarry: 1, bounce: 1, shock: 90, power: 2, desc: 'A leaping cleave off the run.' },
        R:    { name: 'Slip Tide', dur: .42, h: [.3, .62], x0: -30, x1: 82, dmg: 14, kb: 240, lunge: 250, power: 1, echoAt: 0, echoDx: -30, desc: 'Out of a dodge. Leaves an echo behind you.' },
      }),
      rows: (t) => [['echoes copy your blows', 'Attack ×3', t.LLL.name], ['leaves an echo where it lands', 'Heavy', t.H.name], ['echoes rush home', 'Heavy, echoes standing', t.Hr.name],
        ['run back along your path', 'Hold Heavy, let go in the gleam', t.HC.name], ['set an echo down', 'Hold Attack', t.X.name], ['a plunge', 'Jump, Heavy', t.JH.name], ['leaves an echo', 'Dodge, Attack · Run, Attack', t.R.name + ' · ' + t.D.name]],
      pick(m) { if (m.key === 'H' && E.list.length) return WP().tree.Hr; if (m.key === 'Hr' && !E.list.length) return WP().tree.H; return m; },
      began(m) {
        if (m.rewind) startRewind(m);
        if (m.noEcho || m.key === 'SIG') { if (m.recall) for (const o of E.list) o.recall = 1; return; }
        const em = m.echoAs ? WP().tree[m.echoAs] : m;
        for (const o of E.list) if (o.q.length < 3) o.q.push({ m: em, at: ECHO_LAG + .06 * E.list.indexOf(o) });
      },
      extras(m, k, dt, air) {
        if (m.echoAt !== undefined) once('echo', k, m.echoAt, () => addEcho(P.x + fc() * (m.echoDx || 8), P.y, fc()));
        if (m.recall) once('recall', k, .3, () => recall(m));
        if (m.rewind) stepRewind(m, k, dt);
        return false;
      },
      step(dt) {
        for (const o of E.list) {
          o.t += dt; if (!o.cur) o.life -= dt;
          for (const q of o.q) q.at -= dt;
          if (!o.cur && o.q.length && o.q[0].at <= 0) { const q = o.q.shift(); o.cur = q.m; o.ct = 0; o.hits = new Map(); const e = nearest(o.x, o.y, 220); if (e) o.facing = Math.sign(e.x - o.x) || o.facing; }
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
      },
      obj(o, dt) { if (o.kind === 'rush') stepRush(o, dt); },
      draw(list, t) {
        for (const o of E.list) {
          const a = Math.min(1, o.t * 4) * (o.life < .5 ? Math.max(0, o.life * 2) : 1) * .6, pose = o.cur ? poseOf(o.cur, Math.min(1, o.ct / o.cur.dur)) : standPose();
          list.push([o.y - .05, () => { onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${rgb()},${(.5 * a).toFixed(2)})`; ctx.lineWidth = 1.6; ell(o.x, o.y, 18 + 3 * Math.sin(t * 4), 5); ctx.stroke(); ctx.restore(); });
            ghostAt(o.x, o.y, o.z, o.facing, pose, a, tint()); }]);
        }
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
      note('HOME!', pal().edge, 14); sfx('whoosh'); sfx('hit-crystal');
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
      P._rw = { pts, cum, len, hit: new Set(), hit2: new Set(), f: fc() }; sfx('whoosh'); note(m.perfect ? 'EBB!' : 'REWIND', pal().edge, 14); }
    function stepRewind(m, k, dt) {
      const R = P._rw; if (!R) return; P.facing = R.f; P.inv = Math.max(P.inv, .12);
      const u = sst(spn(k, .08, .78)), d = u * R.len; let i = 1; while (i < R.cum.length - 1 && R.cum[i] < d) i++;
      const a = R.pts[i - 1], b = R.pts[i], seg = (R.cum[i] - R.cum[i - 1]) || 1, q = clamp((d - R.cum[i - 1]) / seg, 0, 1), px = P.x, py = P.y;
      P.x = lerp(a.x, b.x, q); P.y = lerp(a.y, b.y, q); P.vx = 0;
      if (k < .82) { if (Math.random() < .5) addGhost(false); for (const e of foes()) { if (R.hit.has(e) || segD(e, px, py, P.x, P.y) > e.hw + 22 || e.z > 90) continue; R.hit.add(e);
        hitE(e, m.dmg, Math.sign(e.x - px) || -R.f, m, { kb: 200, launch: 160 }); fx.push({ kind: 'slash', x: e.x, y: e.y, z: e.z + e.hh * .5, ang: rand(-.5, .5), t: .3, max: .3, size: 46, col: pal().edge });
        if (m.perfect) echoes.push({ e, dmg: m.dmg * .5 * wm(), dir: -R.f, m: Object.assign({}, m, { perfect: 0 }), t: .3 }); } }
    }
    const T2 = { th: 1, gg: 14 };
    POSE('glaive', {
      L: KF([[0, { ...T2, a: 1.1, e: .3, g: -.1, l: 0, s: 3, lg: [8, -9, 3, 4], ba: 1.4, y: -.1 }], [.3, { a: 1.5, g: .2, l: -.08, s: 5, lg: [6, -11, 5, 6], y: -.25 }], [.6, { a: -1.05, g: -.45, l: .28, s: 5, lg: [15, -12, 8, 1], y: .25, sh: 2 }], [1, { a: -.55, g: -.3, l: .1, s: 3, lg: [10, -10, 4, 3], y: .1, sh: 0 }]], { tr: [[.3, .6]] }),
      LL: KF([[0, { ...T2, a: -.7, g: -.3, l: .1 }], [.25, { a: -1.3, g: -.9, l: -.05, sp: -1.2, lg: [6, -8, 3, 5] }], [.62, { a: .75, g: .3, l: .32, sp: -TWO, s: 6, lg: [13, -12, 8, 2] }], [1, { a: .6, g: .1, l: .15, sp: -TWO, s: 4, lg: [10, -10, 5, 3] }]], { tr: [[.3, .62]] }),
      LLL: KF([[0, { ...T2, a: .5, g: 0, l: .1, s: 3 }], [.28, { a: -.3, g: 0, l: -.1, s: 7, cr: 0, lg: [12, -12, 9, 6], sp: 0 }], [.66, { a: .25, g: .1, l: .2, s: 9, sp: -TWO, lg: [16, -16, 11, 2] }], [1, { a: 1.2, g: -.6, l: .1, s: 6, sp: -TWO, lg: [12, -12, 7, 3] }]], { tr: [[.3, .66]], trW: 7, fn: (pose, m, k) => { if (k > .3 && k < .7) pose.flat = { r: (WP().reach || 60) + 20, k: spn(k, .3, .66), rev: false, col: pal().trail, w: 6 }; } }),
      H: KF([[0, { ...T2, a: .5, l: .05 }], [.36, { a: -2.4, g: -1, l: -.32, s: 1, y: -.35, lg: [6, -9, 2, 5], ba: 1 }], [.6, { a: .85, g: .35, l: .55, s: 9, y: .45, lg: [17, -14, 10, 0], sh: 3 }], [1, { a: .75, g: .2, l: .3, s: 6, y: .2, sh: 1 }]], { tr: [[.4, .6]], trW: 8 }),
      Hr: KF([[0, { a: .6, g: -.6, l: 0 }], [.3, { a: -1.5, e: .2, g: -1.3, l: -.2, ba: -.9, be: 1.6, oh: 1, y: .4, lg: [9, -10, 3, 3], s: 2 }], [.7, { a: -1.6, g: -1.5, ba: -1.4, be: .3, y: .5 }], [1, { a: .4, g: -.8, ba: 1.4, be: .3, y: .2 }]]),
      HH: KF([[0, { ...T2, a: .3, g: .2, l: .2, s: 6, cr: 1, lg: [14, -14, 10, 6] }], [.14, { a: .15, sp: 0 }], [.86, { a: .15, sp: -2 * TWO }], [1, { a: .5, g: -.2, s: 4, cr: 0, sp: -2 * TWO, lg: [10, -10, 5, 3] }]], { fn: (pose, m, k) => { if (k > .12 && k < .88) pose.flat = { r: (WP().reach || 60) + 18, k: (k * 2.4) % 1, rev: false, col: pal().trail, w: 6 }; } }),
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

  // ======================================================================================================
  // EXPORTS, and the weapon rebuilt now this file is here
  // ======================================================================================================
  function forgeKind(type, n = 0) { for (let s = 1; s < 20000; s++) { const pk = PW.randomPicks(s), d = PW.design(s, pk); if (d.type === type && n-- <= 0) { PW.forgeNow(s, pk); return WEAPONS[ID].name; } } return null; }
  window.PEARLM = { build, rows, TY, S, KF, forge: forgeKind, mine, kinds: () => Object.keys(TY), statsOf, statsHtml, statLines, TRAIT_STATS };
  try { PW.reregister(); } catch (e) { console.error(e); }
})();
