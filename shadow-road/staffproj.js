'use strict';
// ======================================================================================================
// THE BOWSTAFF'S THROWN THINGS: the Piercing Gale's drill of wind (Attack while walking) and the Eye of the Storm's
// whirlwind (Heavy held), each in three forms, by the staff in his hand (cursedw.js):
//   plain     the drill: a spiralling cone of wind, fins of air turning round its point, shock rings peeling off it;
//             the whirlwind: a funnel of wound wind full of dust and leaves, a ring of it scouring the street
//   cursed    the drill runs slower and longer, a black spiral edged in crimson: it drags whoever it pierces along with it,
//             and every stride of its path is a rift in the street that snaps shut a moment later, biting again;
//             the whirlwind is a black maelstrom shot through with red lightning that pulls from further, lasts longer,
//             and bursts at the end into a ring of ink shards
//   purified  the drill is a lance of dawn: much faster and wider, a white-gold spear with a halo, and where it ends it
//             breaks into a burst of sunrise that strikes all round; the whirlwind is a column of white fire that seeks
//             the nearest foe, beats faster, and ends in a pillar of sunlight that throws everything in it
// world.js and draw.js hand a drill to drillTick / drawDrill; moves.js's tornadoTick / drawTornado are replaced here.
// ======================================================================================================
(() => {
  const SV = () => { const c = typeof save !== 'undefined' && save && save.cw && save.cw.staff; return P && P.w === 'staff' && c ? (c.pure ? 'pure' : 'cursed') : ''; };
  window.staffVariant = SV;
  const LATE = []; // the rifts, bursts and pillars left behind them, each ticked and drawn here
  const strikeAt = (e, d, dir, o) => { if (e && !e.dead) strike(e, d, dir, Object.assign({ dmg: d, power: 1 }, o)); };
  const near = (x, y, r) => enemies.filter(e => !e.dead && e.state !== 'enter' && Math.hypot(e.x - x, (e.y - y) * 2) < r + e.hw);

  // ---------------- the drill ----------------
  window.drillSpawn = (p) => { const v = SV(); p.v = v;
    if (v === 'cursed') { p.vx *= .86; p.life = p.max = .66; p.dmg = Math.round(p.dmg * 1.3); p.carry = new Map(); p.riftX = p.x; }
    else if (v === 'pure') { p.vx *= 1.45; p.life = p.max = .55; p.dmg = Math.round(p.dmg * 1.6); p.wide = 44; }
    return p; };
  window.drillTick = (p, dt) => {
    const d = Math.sign(p.vx) || 1, reach = p.wide || 26;
    for (const e of enemies) {
      if (e.dead || p.hit.has(e) || Math.abs(p.x - e.x) > 26 + e.hw * .4 || Math.abs(p.y - e.y) > reach) continue;
      p.hit.add(e);
      if (p.v === 'cursed') { strikeAt(e, p.dmg, d, { kb: 60, launch: 0, power: 2 }); if (!e.boss) p.carry.set(e, .3); burst(e.x, e.y, e.hh * .5, ['#140810', '#8A1E34', '#FF4A6A'], 10, 'spark', 0, true); }
      else if (p.v === 'pure') { strikeAt(e, p.dmg, d, { kb: 320, launch: 160, power: 2 }); burst(e.x, e.y, e.hh * .5, ['#FFFFFF', '#FFF0C8', '#FFD27A'], 12, 'spark', 0, true); fx.push({ kind: 'ring', x: e.x, y: e.y, z: 2, t: .35, max: .35, r: 40, col: '#FFE9A8', flat: 1 }); }
      else { strikeAt(e, p.dmg, d, { kb: 280, launch: 140, power: 2 }); burst(e.x, e.y, e.hh * .5, ['#FFFFFF', '#CFE4FF', '#9EC2F0'], 8, 'spark', 0, true); }
    }
    if (p.v === 'cursed') { // what it pierced is dragged along with it; every stride, a rift opens in the street behind it
      for (const [e, t] of p.carry) { if (e.dead || t <= 0) { p.carry.delete(e); continue; } p.carry.set(e, t - dt); e.x += p.vx * dt * .7; e.vx = 0; }
      if (Math.abs(p.x - p.riftX) > 46) { p.riftX = p.x; LATE.push({ k: 'rift', x: p.x - d * 10, y: p.y, t: 0, snap: .36, max: .7, d, dmg: Math.round(p.dmg * .55), done: false }); }
      if (Math.random() < dt * 40) parts.push({ x: p.x - d * rand(0, 26), y: p.y + rand(-3, 3), z: p.z + rand(-10, 10), vx: -p.vx * .08, vy: 0, vz: rand(-30, 10), life: .4, max: .4, col: pick(['rgba(14,6,14,.9)', '#8A1E34', '#FF4A6A']), size: rand(1.6, 2.8), shape: 'puff' }); }
    else if (p.v === 'pure') { if (Math.random() < dt * 60) parts.push({ x: p.x - d * rand(0, 40), y: p.y + rand(-6, 6), z: p.z + rand(-12, 12), vx: -p.vx * .06, vy: 0, vz: rand(10, 50), life: .45, max: .45, col: pick(['#FFFFFF', '#FFF0C8', '#FFD27A']), size: rand(1.2, 2.4), shape: 'spark' });
      if (p.life <= dt || p.x < leftWall() + 10 || p.x > rightWall() - 10) { if (!p.flared) { p.flared = 1; p.life = 0; LATE.push({ k: 'dawn', x: p.x, y: p.y, t: 0, max: .7, dmg: Math.round(p.dmg * 1.2), done: false }); } } }
    else if (Math.random() < dt * 50) parts.push({ x: p.x - d * rand(0, 30), y: p.y + rand(-3, 3), z: p.z + rand(-8, 8), vx: -p.vx * .1, vy: 0, vz: rand(-10, 10), life: .3, max: .3, col: '#EEF4FF', size: rand(1.4, 2.4), shape: 'streak', rot: 0, vr: 0 });
  };
  window.drawDrill = (p, t) => {
    const d = Math.sign(p.vx) || 1, a = Math.min(1, p.life / ((p.max || .5) * .35), (p.max - p.life) * 12), x = p.x, y = p.y - p.z, tt = performance.now() / 1000;
    ctx.save(); ctx.translate(x, y); ctx.scale(d, 1);
    if (p.v === 'pure') { // a lance of dawn: a white-gold spear of light in a halo, rays thrown off its point
      ctx.globalCompositeOperation = 'lighter';
      const hg = ctx.createRadialGradient(10, 0, 2, 0, 0, 70); hg.addColorStop(0, `rgba(255,248,220,${.6 * a})`); hg.addColorStop(1, 'rgba(255,210,120,0)'); ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(-14, 0, 72, 26, 0, 0, TAU); ctx.fill();
      for (let i = 0; i < 7; i++) { const an = (i - 3) * .22 + Math.sin(tt * 20 + i) * .04, L = 26 + (i % 3) * 10; ctx.strokeStyle = `rgba(255,236,170,${(.55 * a).toFixed(3)})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(30 + Math.cos(an) * L, Math.sin(an) * L); ctx.stroke(); }
      const lg = ctx.createLinearGradient(-80, 0, 36, 0); lg.addColorStop(0, 'rgba(255,220,140,0)'); lg.addColorStop(.7, `rgba(255,244,210,${.9 * a})`); lg.addColorStop(1, `rgba(255,255,255,${a})`);
      ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(38, 0); ctx.lineTo(-10, -7); ctx.lineTo(-80, -3); ctx.lineTo(-80, 3); ctx.lineTo(-10, 7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.moveTo(38, 0); ctx.lineTo(4, -3); ctx.lineTo(-40, 0); ctx.lineTo(4, 3); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 3; i++) { const k = (tt * 4 + i / 3) % 1; ctx.strokeStyle = `rgba(255,236,170,${(a * (1 - k) * .8).toFixed(3)})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(16 - k * 80, 0, 3 + k * 5, 8 + k * 16, 0, 0, TAU); ctx.stroke(); }
    } else if (p.v === 'cursed') { // a black spiral edged in crimson, ink spitting off it, red sparks crawling its length
      const r = mulberry(Math.floor(tt * 24) + 7);
      const g = ctx.createRadialGradient(4, 0, 2, -6, 0, 50); g.addColorStop(0, `rgba(60,8,24,${.6 * a})`); g.addColorStop(1, 'rgba(20,4,12,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(-8, 0, 52, 20, 0, 0, TAU); ctx.fill();
      for (let i = 0; i < 5; i++) { const ph = tt * 18 + i * TAU / 5; ctx.beginPath();
        for (let j = 0; j <= 14; j++) { const q = j / 14, X = 24 - q * 76, R = 2 + q * 17, Y = Math.sin(ph + q * 8) * R; j ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
        ctx.strokeStyle = `rgba(16,6,14,${(.95 * a).toFixed(3)})`; ctx.lineWidth = 3.2 - i * .3; ctx.stroke();
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,${50 + i * 12},80,${(.7 * a).toFixed(3)})`; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); }
      ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 2; i++) { let X = 20, Y = 0; ctx.strokeStyle = `rgba(255,90,120,${(.8 * a).toFixed(3)})`; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(X, Y); for (let j = 0; j < 5; j++) { X -= 10 + r() * 6; Y = (r() - .5) * 18; ctx.lineTo(X, Y); } ctx.stroke(); }
    } else { // the plain drill: a spiralling cone of wind, fins of air turning round its point, rings peeling off
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(10, 0, 2, 0, 0, 48); g.addColorStop(0, `rgba(240,246,255,${.55 * a})`); g.addColorStop(1, 'rgba(200,220,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(-6, 0, 50, 19, 0, 0, TAU); ctx.fill();
      for (let i = 0; i < 6; i++) { const ph = tt * 26 + i * Math.PI / 3; ctx.strokeStyle = `rgba(${i % 2 ? '255,255,255' : '180,210,255'},${(.8 * a).toFixed(3)})`; ctx.lineWidth = 1.7 - (i % 3) * .3; ctx.beginPath();
        for (let j = 0; j <= 14; j++) { const q = j / 14, X = 24 - q * 74, R = 2 + q * 16, Y = Math.sin(ph + q * 7) * R; j ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); } ctx.stroke(); }
      for (let i = 0; i < 3; i++) { const an = tt * 14 + i * TAU / 3; ctx.fillStyle = `rgba(230,242,255,${(.7 * a).toFixed(3)})`; ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(12, Math.sin(an) * 9); ctx.lineTo(6, Math.sin(an) * 6 + 1.5); ctx.closePath(); ctx.fill(); }
      ctx.strokeStyle = `rgba(255,255,255,${(.95 * a).toFixed(3)})`; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(28, 0); ctx.lineTo(-30, 0); ctx.stroke();
      for (let i = 0; i < 3; i++) { const k = (tt * 3 + i / 3) % 1; ctx.strokeStyle = `rgba(220,232,255,${(a * (1 - k) * .8).toFixed(3)})`; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.ellipse(12 - k * 64, 0, 3 + k * 4, 6 + k * 15, 0, 0, TAU); ctx.stroke(); }
    }
    ctx.restore();
  };

  // ---------------- the whirlwind (moves.js's own, replaced) ----------------
  window.tornadoSpawn = (p) => { const v = SV(); p.v = v;
    if (v === 'cursed') { p.life = p.max = 2.9; p.pull = 70; p.dmg = Math.round(p.dmg * 1.3); }
    else if (v === 'pure') { p.vx *= 1.3; p.life = p.max = 2.4; p.pull = 58; p.beat = .12; p.dmg = Math.round(p.dmg * 1.5); }
    return p; };
  tornadoTick = function (p, dt) {
    const v = p.v || '', pull = p.pull || 46, beat = p.beat || .2;
    if (v === 'pure') { const tg = enemies.filter(e => !e.dead && !e.boss && e.state !== 'enter').sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0]; // it seeks the nearest
      if (tg) { p.vx += Math.sign(tg.x - p.x) * 240 * dt; p.vx = clamp(p.vx, -220, 220); p.y += (tg.y - p.y) * Math.min(1, dt * 1.5); } else p.vx *= Math.pow(.6, dt); }
    else p.vx *= Math.pow(.6, dt);
    const now = p.max - p.life, end = p.life <= dt, hs = hitstop, sh = shakeMag;
    for (const e of enemies) {
      if (e.dead || Math.abs(e.x - p.x) > pull + e.hw * .5 || Math.abs(e.y - p.y) > 30 + (pull - 46) * .4) continue;
      if (!e.boss) { e.x += (p.x - e.x) * Math.min(1, dt * (v === 'cursed' ? 6.5 : 5)); e.y += (p.y - e.y) * Math.min(1, dt * 3); }
      const last = p.hitT.get(e);
      if (end) { strike(e, p.dmg * (v === 'pure' ? 2 : 1.6), Math.sign(e.x - P.x) || 1, { key: 'HC', dmg: p.dmg, kb: 260, launch: v === 'pure' ? 620 : 520, power: 2, crit: p.perfect }); continue; }
      if (last === undefined || now - last >= beat) { p.hitT.set(e, now); strike(e, p.dmg, Math.sign(p.vx) || 1, { key: 'HC', dmg: p.dmg, kb: 0, launch: 160, power: 1 }); }
    }
    if (!end) { hitstop = Math.max(hs, Math.min(hitstop, .015)); shakeMag = Math.max(sh, Math.min(shakeMag, 2)); }
    const cols = v === 'cursed' ? ['rgba(16,6,14,.9)', '#6A1428', '#FF4A6A'] : v === 'pure' ? ['#FFFFFF', '#FFF0C8', '#FFD27A'] : ['#B8A47E', '#8A7458', 'rgba(200,240,230,.8)', '#6A9A4A'];
    if (Math.random() < dt * 34) parts.push({ x: p.x + rand(-22, 22), y: p.y + rand(-4, 4), z: rand(0, 24), vx: rand(-90, 90), vy: 0, vz: rand(120, 280), life: .55, max: .55, col: pick(cols), size: rand(2, 3.6), shape: v ? 'spark' : 'tuft', rot: rand(0, 6), vr: 9 });
    if (end) { sfx('whoosh');
      if (v === 'cursed') { LATE.push({ k: 'shards', x: p.x, y: p.y, t: 0, max: .6, dmg: Math.round(p.dmg * 1.6), done: false }); }
      else if (v === 'pure') { LATE.push({ k: 'pillar', x: p.x, y: p.y, t: 0, max: .9, dmg: Math.round(p.dmg * 2), done: false }); }
      else fx.push({ kind: 'ring', x: p.x, y: p.y, z: 2, t: .4, max: .4, r: 76, col: '#BFF5E8', flat: 1 }); }
  };
  drawTornado = function (p, t) {
    const a = Math.min(1, p.life * 2, (p.max - p.life) * 4), x = p.x, y = p.y, v = p.v || '', tt = t;
    const C = v === 'cursed' ? { glow: '90,10,30', band: '40,10,24', hi: '255,70,100', core: '255,180,190' } : v === 'pure' ? { glow: '255,226,150', band: '255,236,190', hi: '255,255,255', core: '255,250,230' } : { glow: '126,194,176', band: '200,240,230', hi: '255,255,255', core: '230,255,248' };
    onPage(() => {
      ctx.save();
      ctx.globalCompositeOperation = v === 'cursed' ? 'source-over' : 'lighter';
      const g = ctx.createRadialGradient(x, y, 2, x, y, 58); g.addColorStop(0, `rgba(${C.glow},${(v === 'cursed' ? .55 : .4) * a})`); g.addColorStop(1, `rgba(${C.glow},0)`); ctx.fillStyle = g; ell(x, y, 58, 16); ctx.fill();
      ctx.lineCap = 'round';
      const n = v === 'pure' ? 18 : 16, H = v === 'pure' ? 124 : 110;
      for (let i = 0; i < n; i++) { // bands of wind wound round a funnel that widens as it climbs, the inner ones faster
        const h = i / (n - 1), r = 9 + h * (v === 'cursed' ? 40 : 36), yy = y - h * H, ph = tt * (13 - h * 4) + i * .9 + p.seed, w = Math.sin(tt * 2.2 + h * 3 + p.seed);
        ctx.strokeStyle = i % 3 ? `rgba(${C.band},${(.3 + .35 * h) * a})` : `rgba(${C.hi},${.55 * a})`; ctx.lineWidth = 1.3 + 2.6 * (1 - h);
        ctx.beginPath(); ctx.ellipse(x + w * 6 * h, yy, r, r * .26, 0, ph % TAU, ph % TAU + 3.8); ctx.stroke();
        if (v === 'cursed' && i % 2) { ctx.strokeStyle = `rgba(255,60,90,${.45 * a})`; ctx.lineWidth = .9; ctx.stroke(); } }
      ctx.globalCompositeOperation = 'lighter'; // its core
      const cg = ctx.createLinearGradient(x, y, x, y - H); cg.addColorStop(0, `rgba(${C.core},${.45 * a})`); cg.addColorStop(1, `rgba(${C.core},0)`); ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x - 20, y - H); ctx.lineTo(x + 20, y - H); ctx.lineTo(x + 6, y); ctx.closePath(); ctx.fill();
      if (v === 'cursed' && Math.sin(tt * 23 + p.seed) > .55) { const r = mulberry(Math.floor(tt * 30)); let X = x + (r() - .5) * 20, Y = y - H * .9; ctx.strokeStyle = `rgba(255,90,120,${.9 * a})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(X, Y); for (let j = 0; j < 6; j++) { X += (r() - .5) * 26; Y += H * .14; ctx.lineTo(X, Y); } ctx.stroke(); }
      if (!v) for (let i = 0; i < 7; i++) { const h = ((tt * .6 + i / 7) % 1), an = tt * 9 + i * 1.7, rr = 10 + h * 34; ctx.fillStyle = `rgba(${i % 2 ? '120,160,80' : '190,170,120'},${.75 * a * Math.sin(h * Math.PI)})`; ctx.save(); ctx.translate(x + Math.cos(an) * rr, y - h * H + Math.sin(an) * rr * .26); ctx.rotate(an * 2); ctx.fillRect(-2.4, -1, 4.8, 2); ctx.restore(); } // leaves and grit caught up in it
      if (v === 'pure') for (let i = 0; i < 10; i++) { const h = ((tt * .9 + i / 10) % 1), an = tt * 11 + i * 1.3, rr = 8 + h * 32; ctx.fillStyle = `rgba(255,248,220,${.8 * a * Math.sin(h * Math.PI)})`; circle(x + Math.cos(an) * rr, y - h * H + Math.sin(an) * rr * .26, 1.4); ctx.fill(); }
      ctx.restore();
    });
  };

  // ---------------- what they leave behind ----------------
  { const _uh = updateHazards; updateHazards = function (dt) { _uh(dt);
    for (const L of LATE) { L.t += dt;
      if (L.k === 'rift' && !L.done && L.t >= L.snap) { L.done = true; for (const e of near(L.x, L.y, 26)) strikeAt(e, L.dmg, L.d, { kb: 40, launch: 120, power: 1 }); burst(L.x, L.y, 6, ['#140810', '#FF4A6A'], 6, 'spark', 0, true); sfx('hit-crystal', .3); }
      if (L.k === 'dawn' && !L.done && L.t >= .06) { L.done = true; for (const e of near(L.x, L.y, 96)) strikeAt(e, L.dmg, Math.sign(e.x - L.x) || 1, { kb: 260, launch: 220, power: 2 }); shakeMag = Math.max(shakeMag, 5); sfx('learned', .4); fx.push({ kind: 'ring', x: L.x, y: L.y, z: 2, t: .5, max: .5, r: 90, col: '#FFE9A8', flat: 1 }); burst(L.x, L.y, 30, ['#FFFFFF', '#FFF0C8', '#FFD27A'], 18, 'spark', 0, true); }
      if (L.k === 'shards' && !L.done) { L.done = true; for (const e of near(L.x, L.y, 110)) strikeAt(e, L.dmg, Math.sign(e.x - L.x) || 1, { kb: 300, launch: 180, power: 2 }); shakeMag = Math.max(shakeMag, 7); sfx('growl', .4); for (let i = 0; i < 22; i++) { const an = i / 22 * TAU; parts.push({ x: L.x, y: L.y, z: 30, vx: Math.cos(an) * 320, vy: Math.sin(an) * 60, vz: rand(40, 160), life: .5, max: .5, col: pick(['rgba(14,6,14,.95)', '#8A1E34', '#FF4A6A']), size: rand(2, 3.4), shape: 'spark' }); } }
      if (L.k === 'pillar' && !L.done && L.t >= .12) { L.done = true; for (const e of near(L.x, L.y, 110)) strikeAt(e, L.dmg, Math.sign(e.x - L.x) || 1, { kb: 120, launch: 560, power: 2 }); shakeMag = Math.max(shakeMag, 8); sfx('learned', .5); sfx('slam', .5); fx.push({ kind: 'ring', x: L.x, y: L.y, z: 2, t: .6, max: .6, r: 110, col: '#FFE9A8', flat: 1 }); } }
    for (let i = LATE.length - 1; i >= 0; i--) if (LATE[i].t > LATE[i].max) LATE.splice(i, 1);
  }; }
  { const _ml = mechList; mechList = function (list, t) { _ml(list, t);
    for (const L of LATE) list.push([L.y + (L.k === 'pillar' || L.k === 'dawn' ? .3 : -40), () => onMain(() => { const q = L.t / L.max; ctx.save();
      if (L.k === 'rift') { const open = L.done ? Math.max(0, 1 - (L.t - L.snap) / (L.max - L.snap)) : Math.min(1, L.t / .1), w = L.done ? 1 : .6 + .4 * Math.sin(L.t * 40);
        ctx.strokeStyle = `rgba(16,6,14,${(.9 * open).toFixed(3)})`; ctx.lineWidth = 4 * w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(L.x - 18, L.y + 3); ctx.lineTo(L.x - 4, L.y - 2); ctx.lineTo(L.x + 6, L.y + 2); ctx.lineTo(L.x + 18, L.y - 3); ctx.stroke();
        ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,60,90,${(.85 * open).toFixed(3)})`; ctx.lineWidth = 1.4; ctx.stroke();
        if (L.done && L.t - L.snap < .2) { ctx.strokeStyle = `rgba(255,120,150,${(1 - (L.t - L.snap) / .2).toFixed(3)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(L.x, L.y); ctx.lineTo(L.x + 4, L.y - 34); ctx.stroke(); } }
      else if (L.k === 'dawn' || L.k === 'pillar') { const A = 1 - q, w = (L.k === 'pillar' ? 34 : 22) * (1 - q * .6), lg = ctx.createLinearGradient(L.x - w, 0, L.x + w, 0); ctx.globalCompositeOperation = 'lighter';
        lg.addColorStop(0, 'rgba(255,210,120,0)'); lg.addColorStop(.5, `rgba(255,252,236,${(.9 * A).toFixed(3)})`); lg.addColorStop(1, 'rgba(255,210,120,0)'); ctx.fillStyle = lg; ctx.fillRect(L.x - w, L.y - (L.k === 'pillar' ? 360 : 140), w * 2, L.k === 'pillar' ? 360 : 140);
        const R = 20 + q * (L.k === 'pillar' ? 100 : 70); ctx.strokeStyle = `rgba(255,230,160,${(.8 * A).toFixed(3)})`; ctx.lineWidth = 2.5 * A + .5; ell(L.x, L.y, R, R * .32); ctx.stroke(); }
      else if (L.k === 'shards') { const A = 1 - q, R = 20 + q * 110; ctx.strokeStyle = `rgba(16,6,14,${(.8 * A).toFixed(3)})`; ctx.lineWidth = 5 * A; ell(L.x, L.y, R, R * .32); ctx.stroke(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,60,90,${(.8 * A).toFixed(3)})`; ctx.lineWidth = 1.5; ell(L.x, L.y, R, R * .32); ctx.stroke(); }
      ctx.restore(); })]);
  }; }
})();
