'use strict';
// ======================================================================================================
// THE REFORGED PEARL'S CHORD: Attack + Heavy together, a move of its own for each of the eight kinds
// ------------------------------------------------------------------------------------------------------
// While the Pearl was evolving, Attack + Heavy threw it; by the time it is reforged his hands know that chord. Once it is
// a weapon, the chord no longer throws anything (pearl_ng.js), so it is given back to him here as a move of light, one for
// each kind, made of what that kind already does. Every one of them draws a little of the curse out of whatever it
// catches (corruption.js, CURSE.ease), and a reforged Pearl's kills ease it too, at half what a purified weapon's do.
//   GLAIVE        TIDE OF SELVES     a wall of sea-ghost cuts rolls down the street, through everyone in its lane
//   SWORD-STAFF   DOWNBEAT           three beats of light ring out round him, one after another, wider each time
//   FLAIL         SPRING TIDE        every foe near is lifted up and held in the light, then brought crashing down
//   CHAKRAM       FULL MOON          a great moon of nacre flung down the street and back, through all it passes
//   SPEAR+SHIELD  PEARL BASTION      a dome of nacre closes over him: it throws them off, and nothing gets in
//   WARSHIELD     AEGIS COMET        the shield flung as a comet that ricochets from foe to foe, five times
//   TRIDENT       RISING SPRINGS     springs of light burst up under the four foes nearest him
//   LANCE         THE LONG LIGHT     a spear of light thrust the length of the street, through all in his lane
// The move borrows the pose of the kind's own big move (PX_POSE). Console: PEARLLH.
// ======================================================================================================
(() => {
  const PM = window.PEARLM, PN = window.PEARLNG; if (!PM || !PN || typeof WEAPONS === 'undefined') { console.error('pearl_lh.js: pearl_moves.js missing'); return; }
  const ID = 'pearlw', TAU2 = Math.PI * 2;
  const W = () => WEAPONS[ID], SPEC = () => (W() && W().pearl) || null;
  const mine = () => !!(P && P.w === ID && W() && W().pm && SPEC());
  const pal = () => (SPEC() ? SPEC().pal : PN.PAL.pearl);
  const sm = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const ng = () => !!(window.CURSE && CURSE.state && CURSE.state());
  const live = () => enemies.filter(e => !e.dead && e.state !== 'enter');

  const PX = {
    glaive:      { name: 'Tide of Selves', desc: 'Attack + Heavy: a wall of sea-ghost cuts rolls down the street, through everyone in your lane.', fire: .45, dmg: 16 },
    swordstaff:  { name: 'Downbeat', desc: 'Attack + Heavy: three beats of light ring out round you, one after another, wider each time.', fire: .35, dmg: 10 },
    flail:       { name: 'Spring Tide', desc: 'Attack + Heavy: every foe near you is lifted up and held in the light, then brought crashing down.', fire: .45, dmg: 12 },
    chakram:     { name: 'Full Moon', desc: 'Attack + Heavy: a great moon of nacre flung down the street and back, through everything it passes.', fire: .4, dmg: 12 },
    shieldspear: { name: 'Pearl Bastion', desc: 'Attack + Heavy: a dome of nacre closes over you. It throws them off, and for a moment nothing gets in.', fire: .3, dmg: 14 },
    warshield:   { name: 'Aegis Comet', desc: 'Attack + Heavy: the shield flung as a comet that ricochets from foe to foe, five times.', fire: .42, dmg: 15 },
    trident:     { name: 'Rising Springs', desc: 'Attack + Heavy: springs of light burst up under the four foes nearest you.', fire: .4, dmg: 16 },
    lance:       { name: 'The Long Light', desc: 'Attack + Heavy: a spear of light thrust the length of the street, through everyone in your lane.', fire: .4, dmg: 20 },
  };
  const PX_POSE = { glaive: 'DX', swordstaff: 'HC', flail: 'DX', chakram: 'HC', shieldspear: 'X', warshield: 'DX', trident: 'HC', lance: 'HC' };
  const CD = 2.2; // between chords
  const EASE = { per: .3, cap: 1.8 }; // what each foe it catches draws out, and the most one chord can
  const KILL = { boss: 1.5, cursed: .5, elite: .4, reg: .175 }; // half of a purified weapon's (cursedw.js)

  // ---------------- the move, put on the kind's tree ----------------
  function pxMove(type) {
    const d = PX[type]; if (!d) return null;
    return { key: 'PX', pm: type, px: 1, name: d.name, desc: d.desc, seq: ['A', '+H'], dur: .62, h: [.3, .5], x0: 0, x1: 70, dmg: Math.round(d.dmg * .8), kb: 160, launch: 120, power: 2, pe: .5, depth: 28 };
  }
  function addPX(built, spec) {
    if (!built || !built.tree || !spec || !PX[spec.type]) return built;
    built.tree.PX = pxMove(spec.type);
    const pk = 'pm:' + spec.type + ':', from = MOVE_POSE[pk + PX_POSE[spec.type]] || MOVE_POSE[pk + 'HC'] || MOVE_POSE[pk + 'H'];
    if (from) MOVE_POSE[pk + 'PX'] = from;
    for (const k in built.tree) { const m = built.tree[k]; if (m && m.poseFrom && !MOVE_POSE[pk + k] && MOVE_POSE[pk + m.poseFrom]) MOVE_POSE[pk + k] = MOVE_POSE[pk + m.poseFrom]; } // (a move that borrows another's pose: pearl_moves.js poseFrom)
    return built;
  }
  { const _b = PM.build; PM.build = function (spec) { return addPX(_b(spec), spec); }; }
  { const _r = PM.rows; PM.rows = function (Wp) { const r = _r(Wp), spec = Wp && (Wp.pearl || SPEC()); if (spec && PX[spec.type]) r.push(['a move of light; it eases the curse', 'Attack + Heavy together', PX[spec.type].name]); return r; }; }
  const patch = () => { const w = W(); if (w && w.pearl && w.tree && !w.tree.PX) addPX({ tree: w.tree }, w.pearl); };
  try { patch(); } catch (e) {}

  // ---------------- the chord: both pressed together (or the second within a breath of the first) ----------------
  const C = { lastL: -9, lastH: -9, cd: 0 };
  const BUSY = ['hurt', 'down', 'dead'];
  window.__pearlChord = (now) => {
    try { patch(); } catch (e) {}
    if (pressed.light) C.lastL = now; if (pressed.heavy) C.lastH = now;
    if (!mine() || !W().tree.PX || BUSY.includes(P.state) || now < C.cd) return;
    const same = pressed.light && pressed.heavy, lateH = !same && pressed.heavy && input.light && now - C.lastL < .16, lateL = !same && pressed.light && input.heavy && now - C.lastH < .16;
    if (!(same || lateH || lateL)) return;
    pressed.light = pressed.heavy = false; P.holdUsed = true; C.cd = now + CD;
    begin(W().tree.PX);
  };

  // ---------------- what it does ----------------
  const L = { fx: [], cast: null };
  function hit(e, d, dir, o) { if (!e || e.dead) return false; const hp0 = e.hp, s = SPEC(); strike(e, Math.max(1, d * (typeof wMult === 'function' ? wMult(ID) : 1)), dir || (Math.sign(e.x - P.x) || P.facing), Object.assign({ dmg: d, kb: 140, power: 1, pm: s ? s.type : null, key: 'PXfx', px: 1, el: 1 }, o || {})); return e.hp < hp0 || e.dead; }
  function cast(type) {
    const f = P.facing, d = PX[type].dmg, x = P.x, y = P.y;
    L.cast = { id: P.moveId, n: 0, eased: 0 };
    sfx('learned', .6); shakeMag = Math.max(shakeMag, 6); flashT = Math.max(flashT, .05);
    if (type === 'glaive') L.fx.push({ k: 'wall', x: x + f * 30, y, f, vx: f * 520, life: 1.1, d, hit: new Set() });
    else if (type === 'swordstaff') for (let i = 0; i < 3; i++) L.fx.push({ k: 'beat', x, y, at: i * .28, R: [110, 160, 215][i], life: .55 + i * .28, d: d * (i === 2 ? 1.5 : 1), hit: new Set() });
    else if (type === 'flail') { const tg = live().filter(e => Math.hypot(e.x - x, (e.y - y) * 2) < 240).slice(0, 8); for (const e of tg) { hit(e, d * .5, 0, { kb: 0, launch: 520 }); e.pxHold = 1; } L.fx.push({ k: 'tide', x, y, es: tg, life: 1.2, d, done: false }); }
    else if (type === 'chakram') L.fx.push({ k: 'moon', x0: x, x: x + f * 20, y, z: 40, f, out: 360, life: 1.3, d, hitOut: new Set(), hitBack: new Set() });
    else if (type === 'shieldspear') { L.fx.push({ k: 'dome', x, y, R: 130, life: 1.1, d, hit: new Set() }); P.inv = Math.max(P.inv, .9); }
    else if (type === 'warshield') { const first = live().filter(e => (e.x - x) * f > -20 && Math.abs(e.x - x) < 340).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
      L.fx.push({ k: 'comet', x: x + f * 24, y, z: 44, tg: first || null, hops: 0, max: 5, d, gone: new Set(), life: 3, tx: x + f * 300, ty: y }); }
    else if (type === 'trident') { const tg = live().sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x)).slice(0, 4); if (!tg.length) L.fx.push({ k: 'spring', e: null, x: x + f * 90, y, at: .2, life: 1, d, done: false });
      tg.forEach((e, i) => L.fx.push({ k: 'spring', e, x: e.x, y: e.y, at: .2 + i * .1, life: 1 + i * .1, d, done: false })); }
    else if (type === 'lance') L.fx.push({ k: 'beam', x0: x + f * 30, y, f, len: 640, life: .7, d, done: false });
    for (const q of L.fx) if (q.t === undefined) q.t = 0;
  }
  { const _me = moveExtras; moveExtras = function (m, k, dt, air) {
    const r = _me(m, k, dt, air);
    if (m && m.px && m.key === 'PX' && mine() && k >= (PX[m.pm] ? PX[m.pm].fire : .4) && P._pxFired !== P.moveId) { P._pxFired = P.moveId; try { cast(m.pm); } catch (err) { console.error(err); } }
    return r; }; }
  function step(dt) {
    for (const f of L.fx) { f.t += dt; const a = f.t - (f.at || 0);
      switch (f.k) {
        case 'wall': f.x += f.vx * dt; for (const e of live()) if (!f.hit.has(e) && Math.abs(e.x - f.x) < 26 + e.hw && Math.abs(e.y - f.y) < 30 && e.z < 90) { f.hit.add(e); hit(e, f.d, f.f, { kb: 240, launch: 160, power: 2 }); } break;
        case 'beat': if (a > 0) { const r = f.R * sm(a / .3); for (const e of live()) if (!f.hit.has(e) && Math.hypot(e.x - f.x, (e.y - f.y) * 2.2) < r + e.hw && e.z < 60) { f.hit.add(e); hit(e, f.d, 0, { kb: 220 }); } } if (a > 0 && !f.snd) { f.snd = 1; sfx('slam', .4); } break;
        case 'tide': for (const e of f.es) if (!e.dead && e.pxHold) { e.vz = Math.max(e.vz || 0, 40); if (e.z < 70) e.vz = 160; }
          if (!f.done && f.t > .75) { f.done = true; shakeMag = Math.max(shakeMag, 10); sfx('slam'); for (const e of f.es) { e.pxHold = 0; if (!e.dead) { e.vz = -900; hit(e, f.d * 1.4, 0, { kb: 60, power: 2, smash: 1 }); } } } break;
        case 'moon': { const half = f.life / 2, u = f.t < half ? sm(f.t / half) : 1 - sm((f.t - half) / half), back = f.t >= half; f.x = f.x0 + f.f * f.out * u; f.y = P.y + (f.y - P.y) * .9;
          const set = back ? f.hitBack : f.hitOut; for (const e of live()) if (!set.has(e) && Math.abs(e.x - f.x) < 30 + e.hw && Math.abs(e.y - f.y) < 30 && e.z < 90) { set.add(e); hit(e, f.d, f.f * (back ? -1 : 1), { kb: 160 }); } break; }
        case 'dome': { const r = f.R * sm(f.t / .18); for (const e of live()) { const dd = Math.hypot(e.x - f.x, (e.y - f.y) * 2); if (dd < r + e.hw) { if (!f.hit.has(e)) { f.hit.add(e); hit(e, f.d, Math.sign(e.x - f.x) || 1, { kb: 420, launch: 200, power: 2 }); } else if (!e.boss) e.x += (Math.sign(e.x - f.x) || 1) * 160 * dt; } } break; }
        case 'comet': { if (f.done) break; let tg = f.tg && !f.tg.dead ? f.tg : null; const gx = tg ? tg.x : f.tx, gy = tg ? tg.y : f.ty, dx = gx - f.x, dy = gy - f.y, dd = Math.hypot(dx, dy) || 1, sp = 760 * dt;
          if (dd <= sp + 6) { f.x = gx; f.y = gy; if (tg) { f.gone.add(tg); hit(tg, f.d, Math.sign(dx) || P.facing, { kb: 200, launch: 160, power: 2 }); sfx('hit-metal', .5); f.hops++;
              const nx = f.hops < f.max ? live().filter(e => !f.gone.has(e) && Math.hypot(e.x - f.x, e.y - f.y) < 360).sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y))[0] : null;
              if (nx) f.tg = nx; else { f.tg = null; f.done = true; f.life = Math.min(f.life, f.t + .3); } } else { f.done = true; f.life = Math.min(f.life, f.t + .3); } }
          else { f.x += dx / dd * sp; f.y += dy / dd * sp; } break; }
        case 'spring': if (a < 0 && f.e && !f.e.dead) { f.x = f.e.x; f.y = f.e.y; } else if (a >= 0 && !f.done) { f.done = true; sfx('slam', .5); shakeMag = Math.max(shakeMag, 5);
            for (const e of live()) if (Math.abs(e.x - f.x) < 34 + e.hw && Math.abs(e.y - f.y) < 26) hit(e, f.d, 0, { kb: 40, launch: 520, power: 2 }); } break;
        case 'beam': if (!f.done && f.t > .06) { f.done = true; const xb = f.x0 + f.f * f.len; for (const e of live()) if ((e.x - f.x0) * f.f > -e.hw && (xb - e.x) * f.f > -e.hw && Math.abs(e.y - f.y) < 26 && e.z < 80) hit(e, f.d, f.f, { kb: 260, power: 2 }); } break;
      }
    }
    L.fx = L.fx.filter(f => f.t < f.life);
  }
  { const _up = updatePlayer; updatePlayer = function (dt) { _up(dt); if (L.fx.length) { try { step(dt); } catch (err) { console.error(err); } } }; }

  // ---------------- the light it draws out: each foe a chord catches, and a reforged Pearl's kills ----------------
  { const _st = strike; strike = function (e, base, dir, m, echo) {
    const hp0 = e ? e.hp : 0; const r = _st(e, base, dir, m, echo);
    if (m && m.px && e && (e.hp < hp0 || e.dead) && ng() && L.cast && L.cast.id === P.moveId) { const c = L.cast; if (!(c.hitSet || (c.hitSet = new Set())).has(e)) { c.hitSet.add(e); c.n++;
      const k = Math.min(EASE.per, EASE.cap - c.eased); if (k > 0) { c.eased += CURSE.ease(k, 'the Pearl\'s light') || 0; if (c.n === 1 || c.n % 3 === 0) floatText(e.x, e.y, (e.hh || 60) + 26, 'THE LIGHT DRAWS IT OUT', '#E8FFF8', 11); } } }
    return r; }; }
  { const _ke = killEnemy; killEnemy = function (e, dir, m) {
    const was = e.dead, r = _ke(e, dir, m);
    if (!was && e.dead && m && m.pm && !m.trump && P && P.w === ID && ng()) { const k = e.boss ? KILL.boss : e.cursed ? KILL.cursed : (e.elite || e.champ) ? KILL.elite : KILL.reg; CURSE.ease(k, 'a reforged Pearl\'s kill'); }
    return r; }; }

  // ---------------- drawn ----------------
  function draw(t) {
    const g = ctx, p = pal(), rgb = p.glow || '200,245,235';
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const f of L.fx) { const a = f.t - (f.at || 0), out = Math.min(1, (f.life - f.t) * 4);
      if (f.k === 'wall') { for (let i = 0; i < 4; i++) { const x = f.x - f.f * i * 18, al = out * (1 - i * .2); g.strokeStyle = `rgba(${rgb},${.75 * al})`; g.lineWidth = 6 - i; g.beginPath(); g.ellipse(x, f.y - 40, 14, 46, 0, f.f > 0 ? -1.3 : PI2a(), f.f > 0 ? 1.3 : PI2b()); g.stroke();
          g.strokeStyle = `rgba(255,255,255,${.85 * al})`; g.lineWidth = 1.6; g.stroke(); } }
      else if (f.k === 'beat' && a > 0) { const r = f.R * sm(a / .3), al = out * (1 - sm(a / (f.life - (f.at || 0)))); g.strokeStyle = `rgba(${rgb},${.85 * al})`; g.lineWidth = 3 + 6 * al; g.beginPath(); g.ellipse(f.x, f.y, r, r * .34, 0, 0, TAU2); g.stroke(); g.strokeStyle = `rgba(255,255,255,${al})`; g.lineWidth = 1.2; g.stroke(); }
      else if (f.k === 'tide') { for (const e of f.es) if (!e.dead) { const yy = e.y - e.z - (e.hh || 50) * .5, rr = (e.hw || 16) + 18; const q = g.createRadialGradient(e.x, yy, 2, e.x, yy, rr * 1.6); q.addColorStop(0, `rgba(255,255,250,${.35 * out})`); q.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = q; g.beginPath(); g.arc(e.x, yy, rr * 1.6, 0, TAU2); g.fill();
          g.strokeStyle = `rgba(${rgb},${.6 * out})`; g.lineWidth = 1.5; g.beginPath(); g.moveTo(e.x, e.y); g.lineTo(e.x, yy); g.stroke(); } }
      else if (f.k === 'moon') { const R = 22, yy = f.y - f.z, q = g.createRadialGradient(f.x - 5, yy - 6, 2, f.x, yy, R * 1.8); q.addColorStop(0, `rgba(255,255,255,${.95 * out})`); q.addColorStop(.45, `rgba(${rgb},${.7 * out})`); q.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = q; g.beginPath(); g.arc(f.x, yy, R * 1.8, 0, TAU2); g.fill();
        g.strokeStyle = `rgba(255,255,255,${.8 * out})`; g.lineWidth = 2; g.beginPath(); g.arc(f.x, yy, R, t * 9, t * 9 + 4.6); g.stroke(); }
      else if (f.k === 'dome') { const r = f.R * sm(f.t / .18), al = out; g.strokeStyle = `rgba(${rgb},${.8 * al})`; g.lineWidth = 3; g.beginPath(); g.ellipse(f.x, f.y - 6, r, r * .85, 0, Math.PI, TAU2); g.stroke(); g.beginPath(); g.ellipse(f.x, f.y, r, r * .3, 0, 0, TAU2); g.stroke();
        g.fillStyle = `rgba(${rgb},${.12 * al})`; g.beginPath(); g.ellipse(f.x, f.y - 6, r, r * .85, 0, Math.PI, TAU2); g.fill(); g.strokeStyle = `rgba(255,255,255,${.5 * al})`; g.lineWidth = 1; for (let i = 1; i < 5; i++) { g.beginPath(); g.ellipse(f.x, f.y - 6, r * i / 5, r * .85, 0, Math.PI, TAU2); g.stroke(); } }
      else if (f.k === 'comet') { const yy = f.y - f.z; g.strokeStyle = `rgba(${rgb},${.6 * out})`; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(f.x, yy); g.lineTo(f.x - (f.tg ? Math.sign(f.tg.x - f.x) : P.facing) * 40, yy + 4); g.stroke();
        const q = g.createRadialGradient(f.x, yy, 1, f.x, yy, 26); q.addColorStop(0, `rgba(255,255,255,${out})`); q.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = q; g.beginPath(); g.arc(f.x, yy, 26, 0, TAU2); g.fill(); }
      else if (f.k === 'spring') { if (a < 0) { g.strokeStyle = `rgba(${rgb},.8)`; g.lineWidth = 2; g.beginPath(); g.ellipse(f.x, f.y, 26, 9, 0, 0, TAU2); g.stroke(); }
        else { const h = 200 * sm(a / .1), w = 22 * (1 - .5 * sm(a / f.life)), lg = g.createLinearGradient(f.x - w, 0, f.x + w, 0); lg.addColorStop(0, `rgba(${rgb},0)`); lg.addColorStop(.5, `rgba(255,255,250,${.9 * out})`); lg.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = lg; g.fillRect(f.x - w, f.y - h, w * 2, h);
          for (let i = 0; i < 6; i++) { const yy = f.y - ((a * 260 + i * 34) % h); g.fillStyle = `rgba(255,255,255,${.7 * out})`; g.fillRect(f.x + Math.sin(i * 2.3 + a * 9) * w * .6, yy, 2, 4); } } }
      else if (f.k === 'beam') { const xb = f.x0 + f.f * f.len * sm(f.t / .08), al = out, lg = g.createLinearGradient(0, f.y - 52, 0, f.y - 28); lg.addColorStop(0, `rgba(${rgb},0)`); lg.addColorStop(.5, `rgba(255,255,250,${.95 * al})`); lg.addColorStop(1, `rgba(${rgb},0)`);
        g.fillStyle = lg; g.fillRect(Math.min(f.x0, xb), f.y - 52, Math.abs(xb - f.x0), 24); g.strokeStyle = `rgba(255,255,255,${al})`; g.lineWidth = 1.5; g.beginPath(); g.moveTo(f.x0, f.y - 40); g.lineTo(xb, f.y - 40); g.stroke(); }
    }
    g.restore();
  }
  const PI2a = () => Math.PI - 1.3, PI2b = () => Math.PI + 1.3;
  { const _uf = updatePlayer; updatePlayer = function (dt) { _uf(dt); if (L.fx.length && !fx.some(f => f.kind === 'pxF')) fx.push({ kind: 'pxF', x: 0, y: 0, z: 0, t: 1e9, max: 1e9 }); }; }
  { const _df = drawFx; drawFx = function (f) { if (f.kind === 'pxF') { if (!L.fx.length) { f.t = 0; return; } try { draw(performance.now() / 1000); } catch (e) { console.error(e); } return; } return _df(f); }; }
  { const _ps = typeof play === 'function' ? play : null; if (_ps) play = function (i, z) { L.fx = []; L.cast = null; return _ps(i, z); }; }

  window.PEARLLH = { PX, PX_POSE, live: () => L, cast: (type) => cast(type || (SPEC() && SPEC().type)), chord: () => window.__pearlChord(PN.CUR.clock) };
})();
