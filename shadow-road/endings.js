'use strict';
// ---------- the end of each world: a short painted vignette after its boss falls ----------
// Worlds 1-5 each close on a few seconds of their own before the rewards and the forge: the boss room settles (Act I,
// the live scene with this file's touches laid into it), then a second panel shows the road going on (Act II, painted
// from the next stretch of that world's own backgrounds). A line of narration comes up in the banner. Tap, click,
// Enter, Space or any game button skips it; on a new cycle of the road it runs faster and can be skipped at once.
// The last world, Tir-na Nog'th, keeps its own, longer ending (art_w5.js), which wraps stageClear outside this one and is left untouched.
// Everything here hooks in by wrapping: stageClear, drawScene, drawBossRoom, mechBoxes and mechList.
(() => {
  const cl01 = (k) => clamp(k, 0, 1), sm = (k) => { k = cl01(k); return k * k * (3 - 2 * k); };
  const hsh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }; // stable randomness
  const glowR = (x, y, r, rgb, a) => { if (a <= 0 || r <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.45, `rgba(${rgb},${a * .4})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); };
  const view = () => ctx.fillRect(0, Y_OFF, VW, VIEW_H);
  let END = null;

  // ---------------- two painted backgrounds at once: the boss room's (the game's own) and the next panel's ----------------
  const getSet = () => ({ far: bgFar, mid: bgMid, floor: awFloorC, fkey: awFloorKey, key: bgKey, seams: awSeams, sun: AW_SUN });
  const putSet = (s) => { bgFar = s.far; bgMid = s.mid; awFloorC = s.floor; awFloorKey = s.fkey; bgKey = s.key; awSeams = s.seams; AW_SUN = s.sun; };
  function buildAlt(theme, seed) { // paint another locale's layers without giving up the ones on screen
    const A = getSet(); let B = null;
    try { bgFar = bgMid = awFloorC = null; bgKey = ''; buildBackground(theme, seed); B = getSet(); B.K = K; B.theme = theme; B.seed = seed; }
    finally { putSet(A); }
    return B;
  }
  function dropAlt(B) { if (B) { retire(B.far); retire(B.mid); retire(B.floor); } }
  function withSet(B, fn) { const A = getSet(); putSet(B); try { fn(); } finally { putSet(A); } }
  function freshAlt(E) { if (E.B && E.B.K !== K) { const { theme, seed } = E.B; dropAlt(E.B); E.B = buildAlt(theme, seed); if (E.W.tintB) E.W.tintB(E.B); } return E.B; } // the window was resized
  function tintCanvas(c, col) { if (!c) return; const g = c.getContext('2d'); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); g.restore(); }

  // drawWorld, with its layers under our control: each can slide, sink or fade on its own, and the sky can be repainted
  function paintWorld(themeId, o, t) {
    const th = THEMES[themeId], camX = o.cam, wrap = (x) => -(((x % 1280) + 1280) % 1280);
    if (o.skyFill) o.skyFill(th);
    else {
      const g = ctx.createLinearGradient(0, Y_OFF, 0, FLOOR_TOP); g.addColorStop(0, th.sky[0]); g.addColorStop(.45, th.sky[1]); g.addColorStop(.82, th.sky[2]); g.addColorStop(1, th.sky[3]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, VW, FLOOR_TOP);
      const sx = VW * th.sun[0] - camX * .02, sy = Y_OFF + VIEW_H * th.sun[1];
      const sg = ctx.createRadialGradient(sx, sy, 4, sx, sy, 160); sg.addColorStop(0, `rgba(${th.sun[2]},.95)`); sg.addColorStop(.15, `rgba(${th.sun[2]},.5)`); sg.addColorStop(1, `rgba(${th.sun[2]},0)`);
      ctx.fillStyle = sg; ctx.fillRect(sx - 160, sy - 160, 320, 320);
    }
    skyWash(camX);
    if (o.sky) o.sky(camX, t);
    else if (th.liveSky) th.liveSky(camX, t);
    else for (let i = 0; i < 5; i++) { const cx = ((i * 300 - camX * .06 - t * 4) % 1500 + 1500) % 1500 - 200, cy = Y_OFF + 20 + (i * 41) % 70; softDab(cx, cy, 60, th.haze, .45); softDab(cx + 50, cy - 10, 48, '255,236,220', .4); softDab(cx + 100, cy + 4, 44, th.haze, .35); }
    for (const [img, x, dy, a] of [[bgFar, o.farX ?? camX * .15, o.farDY || 0, o.farA ?? 1], [bgMid, o.midX ?? camX * .45, o.midDY || 0, o.midA ?? 1]]) {
      if (!img || a <= 0) continue; const fx = wrap(x);
      ctx.save(); ctx.globalAlpha = a; ctx.drawImage(img, fx, dy, 1280, FLOOR_TOP); ctx.drawImage(img, fx + 1280, dy, 1280, FLOOR_TOP); ctx.restore();
    }
    if (o.afterMid) o.afterMid();
    if (!o.noWash) { const sx = VW * th.sun[0] - camX * .02, sy = Y_OFF + VIEW_H * th.sun[1];
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const wash = ctx.createRadialGradient(sx, sy, 10, sx, sy, VW * .7); wash.addColorStop(0, `rgba(${th.sun[2]},.22)`); wash.addColorStop(1, `rgba(${th.sun[2]},0)`); ctx.fillStyle = wash; ctx.fillRect(0, Y_OFF, VW, FLOOR_TOP - Y_OFF); ctx.restore(); }
    drawFloor(themeId, th, o.floorCam ?? camX, t);
  }
  function cycleTint() { // as drawScene does it: a new cycle of the road is painted under night
    if (!(save.cycle > 0)) return; const k = Math.min(1, .75 + .12 * save.cycle);
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(78,84,150,${.55 * k})`; view();
    ctx.globalCompositeOperation = 'screen'; const mg = ctx.createRadialGradient(VW * .78, Y_OFF + 30, 4, VW * .78, Y_OFF + 30, VW * .6);
    mg.addColorStop(0, `rgba(170,190,255,${.22 * k})`); mg.addColorStop(1, 'rgba(170,190,255,0)'); ctx.fillStyle = mg; view(); ctx.restore();
  }

  // ---------------- the prince ----------------
  // his cloak only moves while the game is live; the vignettes are not, so it is let move while he is drawn
  function withLive(fn) { const m = mode; mode = 'play'; try { fn(); } finally { mode = m; } }
  function poseAs(state, walk) { const s = P.state, w = P.walk; P.state = state; if (walk !== undefined) P.walk = walk; try { return playerPose(); } finally { P.state = s; P.walk = w; } }
  // drawn in the ink layer like every figure in the game (contour, rim light, hatching); s scales him about his feet
  function inkHero(x, y, s, facing, pose, alpha, live) {
    if (alpha <= 0) return;
    inkBegin([[x - 160 * s, y - 175 * s, x + 160 * s, y + 14 * s]]);
    try {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.translate(-x, -y);
      ctx.save(); ctx.globalAlpha = alpha; shadow(x, y, 13); ctx.restore();
      pose.live = live ? 1 : 0;
      if (live) withLive(() => drawPlayerAt(x, y, 0, facing, pose, alpha)); else drawPlayerAt(x, y, 0, facing, pose, alpha);
      hatchActor(x, y, 13, 50);
      ctx.restore();
    } finally { inkEnd(); }
  }
  // the same in Act I, inside the boss room's own ink pass
  function heroItem(E) {
    const W = E.W, a = E.heroA ?? 1; if (a <= 0) return;
    let pose;
    if (E.frozenPose) pose = E.frozenPose; // (during the dissolve the next panel's prince is the live one)
    else { pose = blendPose(Object.assign(playerPose(), { live: 1 })); if (W.pose) W.pose(E, pose); }
    ctx.save(); ctx.globalAlpha = a; shadow(P.x, P.y, 13); ctx.restore();
    if (E.frozenPose) { pose.live = 0; drawPlayerAt(P.x, P.y, 0, E.frozenF, pose, a); }
    else withLive(() => drawPlayerAt(P.x, P.y, 0, P.facing, pose, a));
    hatchActor(P.x, P.y, 13, 50);
  }
  function walkTo(E, dt, x, spd) { // walk him across the boss room
    const d = x - P.x; if (Math.abs(d) < 1.5) { P.state = 'idle'; P.walk = 0; return true; }
    P.facing = Math.sign(d); P.state = 'walk'; const st = Math.min(Math.abs(d), spd * dt); P.x += P.facing * st; P.walk += st / 10.2; return false;
  }

  // ---------------- small painted things ----------------
  const PETAL = ['#F6C8D6', '#FFF2EC', '#F2A8BE', '#FBE0E6'];
  function petal(x, y, r, rot, col) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = C(col); ell(0, 0, r, r * .55); ctx.fill(); ctx.strokeStyle = 'rgba(120,60,80,.45)'; ctx.lineWidth = .4; ctx.stroke(); ctx.restore(); }
  function flower(f, g) { // a meadow flower coming up out of the grove floor: the stem grows, then the head opens
    if (g <= 0) return; const sg = cl01(g / .5), og = sm((g - .4) / .6), h = f.h * sg, x = f.x, y = f.y, sw = Math.sin(f.ph) * 1.2 * sg;
    ctx.lineCap = 'round'; ctx.strokeStyle = C('#3E6A34'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - sw, y - h * .5, x + sw, y - h); ctx.stroke();
    if (sg > .5) { ctx.fillStyle = C('#5E8A44'); ell(x + 2.6, y - h * .35, 2.6 * sg, 1.1 * sg, -.5); ctx.fill(); outline(.5); }
    if (og <= 0) return; const r = f.r * og, cx = x + sw, cy = y - h;
    ctx.fillStyle = C(f.col); ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = f.ph + i / 5 * TAU; ctx.moveTo(cx, cy); ctx.ellipse(cx + Math.cos(a) * r * .62, cy + Math.sin(a) * r * .45, r * .55, r * .36, a, 0, TAU); } ctx.fill(); outline(.6);
    ctx.fillStyle = C('#F2C850'); circle(cx, cy, Math.max(.5, r * .3)); ctx.fill(); outline(.4);
  }
  function mask(x, y, s, rot, k) { // one of the faces the Ty'iga wore: glazed porcelain, eyes empty, a seam of gold where it was mended
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.fillStyle = C('#E6DCCB'); ctx.beginPath(); ctx.moveTo(0, -9); ctx.quadraticCurveTo(7.5, -8.6, 7, -1); ctx.quadraticCurveTo(6.4, 7, 0, 9.6); ctx.quadraticCurveTo(-6.4, 7, -7, -1); ctx.quadraticCurveTo(-7.5, -8.6, 0, -9); ctx.closePath(); ctx.fill(); outline(1.1);
    ctx.fillStyle = C('rgba(120,110,150,.35)'); ell(-3, 3, 2.4, 1.8); ctx.fill(); ell(3.4, 3, 2.4, 1.8); ctx.fill();
    ctx.fillStyle = C('#140A1C'); for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 1.2, -2.6); ctx.quadraticCurveTo(sx * 3.4, -4.4, sx * 5.2, -2.2); ctx.quadraticCurveTo(sx * 3.4, -1, sx * 1.2, -2.6); ctx.fill(); }
    ctx.strokeStyle = C('#140A1C'); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(-2.2, 5); ctx.quadraticCurveTo(0, 5.6 - 1.6 * k, 2.2, 5); ctx.stroke(); // the mouth: open while it still speaks, then shut
    ctx.strokeStyle = C('#B88A30'); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(1, -9); ctx.lineTo(-.4, -5); ctx.lineTo(1.6, -1.6); ctx.stroke();
    ctx.restore();
  }
  const BRASS = { base: '#B88A48', lit: '#F0D090', dark: '#4E3420', edge: '#FFE8B0', hub: '#3E5A5A', hubLit: '#9FD0C0' };
  function skipHint(T) {
    if (T < 1) return; ctx.save(); ctx.globalAlpha = cl01(T - 1) * .8;
    ctx.fillStyle = 'rgba(232,222,200,.75)'; ctx.font = '700 7px Cinzel, Georgia, serif'; ctx.textAlign = 'right'; ctx.fillText(KBD ? 'ENTER TO SKIP' : 'TAP TO SKIP', VW - 14, VH - 10); ctx.restore();
  }
  // the second panel comes in over the first in round brush-dabs of paint, as world 5's dawn does
  function cellsClip(k, dir) {
    const cs = 24; ctx.beginPath();
    for (let gx = 0; gx < VW + cs; gx += cs) for (let gy = Y_OFF; gy < VH + cs; gy += cs) {
      const id = gx * 7 + gy * 13, xn = dir > 0 ? gx / VW : 1 - gx / VW, th = xn * .7 + hsh(id) * .3, r = cs * .9 * cl01((k * 1.5 - th) / .35);
      if (r > .5) { ctx.moveTo(gx + r, gy); ctx.arc(gx, gy, r, 0, TAU); }
    }
    ctx.clip();
  }
  // where a point on a fallen boss's own drawing lies in the world (drawDeath's 'lie': knocked flat where it landed)
  function corpsePt(e, lx, ly, inner = 1) {
    const sd = Math.sign(((e.dir || 1) * e.facing) || 1);
    const m = new DOMMatrix().translate(e.x, e.y - (e.z || 0)).scale(e.facing, 1).scale(e.size || 1, e.size || 1).rotate(-1.4 * sd * 180 / Math.PI).translate(e.hh * .45 * sd, -e.hw * .2).scale(inner, inner);
    return m.transformPoint(new DOMPoint(lx, ly));
  }

  // ======================================================================================================
  // WORLD 1, BLOOMWILD VALE: the flood goes down, the grove on Old Mossback's shell comes into flower and drops its
  // petals, and he walks on up the road out of the Vale, with the Skyport's airships hanging in the evening sky ahead
  // ======================================================================================================
  const AIRSHIP = { fin: '#5A4E70', rig: '#3A3048', envTop: '#B89AB0', env: '#7E6A90', envBot: '#4A3E5E', envLit: '#F4C8A8', seam: 'rgba(40,30,60,.45)', hull: '#4A3A40', trim: '#C9A060', win: '#FFE2B0', glow: '#FFC98A', prop: '#D8C8D8' };
  const W1 = {
    theme2: 'bloom', seed: 211, d0: 3.1, d1: 4.1, dir: 1, bannerAt: 3.6, dur: 9, music: 'bloom',
    title: 'The Waters Went Down', sub: 'THE OLD GROVE FLOWERED AGAIN, AND THE ROAD WENT ON UP OUT OF THE VALE',
    setup(E) {
      const b = E.boss; E.water = stage.bossRoom ? 1 : 0; E.petals = []; E.flowers = [];
      for (let i = 0; i < 52; i++) { const x = camX + 8 + hsh(i * 3 + 1) * (VW - 16), y = FLOOR_TOP + 8 + hsh(i * 3 + 2) * (FLOOR_BOT - FLOOR_TOP - 10);
        E.flowers.push({ x, y, h: 6 + hsh(i + 9) * 9, r: 2.6 + hsh(i + 17) * 2.4, col: ['#F4B8CC', '#FFF4E4', '#F6D870', '#C8A8F0', '#F29AB4'][i % 5], ph: hsh(i + 23) * TAU, at: .7 + (b ? Math.abs(x - b.x) / VW * 1.5 : hsh(i) * 1.2) + hsh(i + 31) * .35 }); }
      E.canopy = b && b.def.draw === 'mossback' ? [[-32, -130, 12], [-18, -146, 15], [0, -152, 15], [16, -142, 13], [-4, -134, 14], [-24, -154, 11], [10, -158, 11], [24, -132, 9]].map(([x, y, r]) => { const p = corpsePt(b, x, y, 1.3); return [p.x, p.y, r * 1.3 * (b.size || 1)]; }) : null;
    },
    under(E, T, t) { // the flood drains off the grove floor, the water line sinking away toward us
      if (!E.water) return; const k = sm(T / 2.6); if (k >= 1) return; const lvl = 22 * (1 - k), y0 = FLOOR_TOP + 4 + (VH - FLOOR_TOP - 4) * k;
      ctx.save(); const g = ctx.createLinearGradient(0, y0, 0, VH); g.addColorStop(0, `rgba(90,140,130,${.12 + lvl * .006})`); g.addColorStop(1, `rgba(40,80,80,${.25 + lvl * .01})`);
      ctx.fillStyle = g; ctx.fillRect(0, y0, VW, VH - y0);
      ctx.strokeStyle = `rgba(210,240,230,${.25 * (1 - k)})`; ctx.lineWidth = 1;
      for (let i = 0; i < 12; i++) { const y = y0 + 8 + i * 10; if (y > VH) break; const x = ((i * 137 + t * 14) % (VW + 80)) - 40; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40 + lvl, y); ctx.stroke(); }
      ctx.strokeStyle = `rgba(230,250,240,${.45 * (1 - k)})`; ctx.lineWidth = 1.2; ctx.beginPath(); for (let x = 0; x <= VW; x += 12) ctx.lineTo(x, y0 + Math.sin(x * .05 + t * 2) * 1.2); ctx.stroke(); // the water's edge
      ctx.restore();
    },
    items(E, list, T, t) {
      const b = E.boss;
      if (b && b.def.draw === 'mossback') list.push([b.y + .01, () => { // the living grove painted in over the dead one
        const k = sm((T - .7) / 1.5); if (k <= 0) return; const ph = b.phase, en = b.enraged; b.phase = 1; b.enraged = false; b.fade = k;
        try { drawDeath(b, t); } finally { b.phase = ph; b.enraged = en; } }]);
      for (const f of E.flowers) list.push([f.y, () => flower(f, (T - f.at) / .9)]);
    },
    boxes(E, box) { if (E.boss) box(E.boss.x, E.boss.y, 0, 260, 280); },
    update(E, T, dt) {
      if (E.canopy && T > 1.1 && T < 4) { let n = dt * 34; while (n > 0) { if (Math.random() < n) { const c = E.canopy[Math.floor(Math.random() * E.canopy.length)]; E.petals.push({ x: c[0] + rand(-c[2], c[2]), y: c[1] + rand(-c[2] * .6, c[2] * .6), land: E.boss.y + rand(-24, 34), vx: rand(-6, 16), vy: rand(10, 24), r: rand(1.4, 2.4), rot: rand(0, TAU), vr: rand(-3, 3), ph: rand(0, TAU), col: pick(PETAL), life: rand(3, 5) }); } n -= 1; } }
      for (const p of E.petals) { p.life -= dt; p.ph += dt * 2.4; p.x += (p.vx + Math.sin(p.ph) * 14) * dt; p.y += p.vy * dt; p.rot += p.vr * dt; if (p.y > p.land) { if (p.wind) p.life = 0; else { p.y = p.land; p.vx = p.vy = p.vr = 0; p.ph -= dt * 2.4; p.x -= Math.sin(p.ph) * 14 * dt; } } }
      E.petals = E.petals.filter(p => p.life > 0);
      if (T > 1.2 && !E.chimed) { E.chimed = 1; sfx('learned'); }
    },
    over(E, T) { // spring light comes back into the grove, and the tree lets its petals go
      const k = sm((T - .4) / 2);
      ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = `rgba(190,230,120,${.32 * k})`; view();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) { const x = VW * (.2 + i * .22), w = 26 + i * 6, a = .055 * k * (1 - i * .15); const g = ctx.createLinearGradient(0, Y_OFF, 0, FLOOR_BOT); g.addColorStop(0, `rgba(255,236,190,${a})`); g.addColorStop(1, 'rgba(255,236,190,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, Y_OFF); ctx.lineTo(x + w, Y_OFF); ctx.lineTo(x + w + 60, FLOOR_BOT); ctx.lineTo(x + 30, FLOOR_BOT); ctx.fill(); } // shafts of sun through the canopy
      ctx.restore();
      ctx.save(); ctx.translate(-camX, 0); for (const p of E.petals) if (!p.wind) { ctx.globalAlpha = cl01(p.life); petal(p.x, p.y, p.r, p.rot, p.col); } ctx.restore();
    },
    act2(E, T, dt, t) { // the road out of the Vale
      const u = T - this.d0, cam = 380 + 16 * u, B = freshAlt(E);
      P.state = 'walk'; P.facing = 1; P.walk += dt * 48 / 10.2;
      const hx = cam + VW * .14 + 48 * u, hy = FLOOR_TOP + 64;
      withSet(B, () => paintWorld('bloom', { cam, sky: (cx, tt) => {
        const th = THEMES.bloom; for (let i = 0; i < 5; i++) { const x = ((i * 300 - cx * .06 - tt * 4) % 1500 + 1500) % 1500 - 200, y = Y_OFF + 20 + (i * 41) % 70; softDab(x, y, 60, th.haze, .45); softDab(x + 50, y - 10, 48, '255,236,220', .4); softDab(x + 100, y + 4, 44, th.haze, .35); }
        const sun = AW_SUN; AW_SUN = -1; // the Skyport's ships, far off up the road, catching the low sun
        ctx.save(); ctx.globalAlpha = .82 * sm(u / 1.5);
        awAirship(VW * .66 + u * 2.4, Y_OFF + 38, .36, -1, AIRSHIP); awAirship(VW * .86 + u * 1.2, Y_OFF + 58, .22, -1, AIRSHIP); awAirship(VW * .5 - u * 1.6, Y_OFF + 22, .16, 1, AIRSHIP);
        ctx.restore(); AW_SUN = sun;
      } }, t));
      ctx.save(); ctx.translate(-cam, 0); inkHero(hx, hy, 1, 1, poseAs('walk'), 1, true); ctx.restore();
      // petals still riding the wind up the road with him
      if (u > 0 && Math.random() < dt * 14) E.petals.push({ x: camX + rand(-40, VW * .6), y: rand(Y_OFF + 20, FLOOR_TOP), vx: rand(30, 60), vy: rand(6, 16), r: rand(1.4, 2.3), rot: rand(0, TAU), vr: rand(-3, 3), ph: rand(0, TAU), col: pick(PETAL), life: rand(3, 5), land: VH + 10, wind: 1 });
      ctx.save(); ctx.translate(-camX, 0); for (const p of E.petals) if (p.wind) { ctx.globalAlpha = cl01(p.life); petal(p.x, p.y, p.r, p.rot, p.col); } ctx.restore();
      gradeFrame('bloom'); cycleTint();
    },
  };

  // ======================================================================================================
  // WORLD 2, THE CLOCKWORK SKYPORT: the furnaces gutter out, the Brass Colossus slumps as its gears run down, and the
  // airship slips her moorings; he rides her deck into the sunset, a prism horizon glittering ahead
  // ======================================================================================================
  const SPIRES = []; { let x = 0, i = 0; while (x < 1.02) { const tall = hsh(i + 9) > .7; SPIRES.push([x, 2 + hsh(i + 3) * 4 + (tall ? 2 : 0), 3 + hsh(i + 5) * 8 + (tall ? 8 + hsh(i + 7) * 8 : 0)]); x += .012 + hsh(i + 11) * .03; i++; } } // the prism horizon
  const W2 = {
    theme2: 'sky', seed: 223, d0: 3.1, d1: 4.1, dir: 1, bannerAt: 3.7, dur: 9, music: 'sky',
    title: 'The Fires Went Out', sub: 'AND THE SHIP SLIPPED HER MOORINGS AND SAILED ON INTO THE SUNSET',
    setup(E) { E.embers = []; E.dist = 0; E.snap = [0, 0]; },
    update(E, T, dt) {
      const live = 1 - sm(T / 2.4);
      if (Math.random() < dt * 40 * live) E.embers.push({ x: rand(0, VW), y: rand(FLOOR_TOP - 20, VH), vy: rand(-40, -18), vx: rand(-6, 6), life: rand(.8, 1.8), max: 1.8 });
      for (const p of E.embers) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; } E.embers = E.embers.filter(p => p.life > 0);
    },
    gearRot(T) { const tau = .9; return 7 * tau * (1 - Math.exp(-T / tau)) + Math.sin(T * 9) * .05 * Math.exp(-T * 1.5); },
    items(E, list, T) {
      const b = E.boss; if (!b) return;
      list.push([b.y + .02, () => { // the gears in its chest, still turning as it falls, running down to a stop
        const a = this.gearRot(T), x = b.x + (b.facing || 1) * 4, y = b.y - 26, sun = AW_SUN; AW_SUN = 1;
        awGear(x, y, 13, 12, a, BRASS); awGear(x - (b.facing || 1) * 19, y - 7, 8, 8, -a * 13 / 8 + .2, BRASS);
        AW_SUN = sun;
        onMain(() => { glowR(x, y, 26, '255,170,90', .5 * (1 - sm(T / 2))); }); // the furnace in its heart going cold
      }]);
    },
    boxes(E, box) { if (E.boss) box(E.boss.x, E.boss.y, 0, 60, 70); },
    over(E, T) {
      const k = sm(T / 2.4), fl = (1 - k) * (.65 + .35 * Math.sin(T * 23) * Math.sin(T * 7.3)), b = E.boss;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const fg = ctx.createRadialGradient(VW * .2, FLOOR_TOP - 40, 10, VW * .2, FLOOR_TOP - 40, 260); fg.addColorStop(0, `rgba(255,150,70,${.3 * fl})`); fg.addColorStop(1, 'rgba(255,120,60,0)'); ctx.fillStyle = fg; view();
      for (const p of E.embers) { ctx.fillStyle = `rgba(255,${170 + 60 * (p.life / p.max) | 0},90,${Math.min(1, p.life) * .8})`; circle(p.x, p.y, 1.1); ctx.fill(); }
      ctx.restore();
      for (const f of [265, 905]) for (const w of [0, 1280, -1280]) { // each furnace mouth dies down to a red glow, then to nothing
        const x = f + w - ((camX * .45) % 1280), y = FLOOR_TOP - 34; if (x < -80 || x > VW + 80) continue;
        const g = ctx.createRadialGradient(x, y, 4, x, y, 62); g.addColorStop(0, `rgba(26,12,12,${.9 * k})`); g.addColorStop(.6, `rgba(30,14,16,${.7 * k})`); g.addColorStop(1, 'rgba(30,14,16,0)'); ctx.fillStyle = g; ctx.fillRect(x - 62, y - 62, 124, 124);
        glowR(x, FLOOR_TOP - 10, 30, '255,90,40', .35 * fl * k + .1 * (1 - sm((T - 2) / 1.2))); }
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(70,78,120,${.5 * k})`; view(); ctx.restore(); // the foundry going dark and cold
      if (b) { ctx.save(); ctx.translate(-camX, 0); for (let i = 0; i < 5; i++) { const life = (T * .45 + i / 5) % 1, a = Math.sin(life * Math.PI) * .32 * (1 - sm(T / 3)); softDab(b.x + (i - 2) * 22 + life * 10, b.y - 30 - life * 60, 10 + life * 16, '236,232,240', a); } ctx.restore(); } // the last of its steam
    },
    act2(E, T, dt, t) { // on the deck as she casts off
      const u = T - this.d0, B = freshAlt(E), r = sm((u - .9) / 2.4), s = sm(u / 3.2);
      E.dist += dt * 180 * r; const d = E.dist, drop = 150 * r * r;
      for (const [i, at] of [[0, .55], [1, .85]]) if (u > at && !E.snap[i]) { E.snap[i] = u; sfx('slice'); }
      if (u > 1 && !E.away) { E.away = 1; sfx('whoosh'); }
      P.state = 'idle'; P.facing = 1;
      const lurch = (E.snap[0] ? Math.sin((u - E.snap[0]) * 14) * 2.2 * Math.exp(-(u - E.snap[0]) * 3) : 0) + (E.snap[1] ? Math.sin((u - E.snap[1]) * 12) * 1.6 * Math.exp(-(u - E.snap[1]) * 3) : 0);
      ctx.save(); ctx.translate(0, lurch);
      const sunX = VW * .86, sunY = FLOOR_TOP - 96 + 18 * s, H = FLOOR_TOP - 64;
      withSet(B, () => paintWorld('sky', { cam: 300, floorCam: 300, farX: 45 + d * .3, midX: 135 + d, farDY: drop * .4, midDY: drop, farA: 1 - .9 * r, midA: 1 - r, noWash: true,
        skyFill: (th) => { const g = ctx.createLinearGradient(0, Y_OFF, 0, FLOOR_TOP); const S = ['#2A2450', '#6E3E70', '#E07258', '#FFB878'];
          [0, .45, .82, 1].forEach((p, i) => g.addColorStop(p, awMix(th.sky[i], S[i], s))); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, FLOOR_TOP); },
        sky: () => {
          glowR(sunX, sunY, 210, '255,160,100', .5 * s + .2); ctx.fillStyle = awMix('#FFF0D0', '#FFC890', s); circle(sunX, sunY, 19); ctx.fill(); // the sun going down ahead of her
          for (let i = 0; i < 7; i++) { const x = ((i * 170 - d * .35 - t * 3) % 1190 + 1190) % 1190 - 150, y = Y_OFF + 26 + (i * 37) % 80; awSoft(x, y, 70, 9, i % 2 ? '255,190,160' : '250,150,140', .45); } // long bars of cloud lit from below
          // the prism horizon: far crystal spires along the edge of the world, catching the last light
          ctx.save(); ctx.globalAlpha = .4 + .6 * r;
          ctx.fillStyle = '#4A2E5E'; ctx.beginPath(); ctx.moveTo(0, H + 5);
          for (const [x, w, h] of SPIRES) { ctx.lineTo(x * VW - w, H); ctx.lineTo(x * VW - w * .2, H - h); ctx.lineTo(x * VW + w * .3, H - h * .92); ctx.lineTo(x * VW + w, H); }
          ctx.lineTo(VW, H + 5); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(255,180,200,.5)'; for (const [x, w, h] of SPIRES) { ctx.beginPath(); ctx.moveTo(x * VW + w * .3, H - h * .92); ctx.lineTo(x * VW + w, H); ctx.lineTo(x * VW, H); ctx.closePath(); ctx.fill(); } // their lit faces, toward the sun
          ctx.globalCompositeOperation = 'lighter';
          const hz = ctx.createLinearGradient(0, H - 22, 0, H + 6); hz.addColorStop(0, 'rgba(255,160,130,0)'); hz.addColorStop(1, 'rgba(255,160,130,.3)'); ctx.fillStyle = hz; ctx.fillRect(0, H - 22, VW, 28); // haze, setting them far off
          SPIRES.forEach(([x, w, h], i) => { if (h < 9) return; const gx = x * VW - w * .2, gy = H - h, a = (.3 + .3 * Math.sin(t * 1.1 + i * 2.3)) * r, hue = [190, 280, 320, 170][i % 4];
            ctx.fillStyle = `hsla(${hue},80%,82%,${a})`; ctx.beginPath(); ctx.moveTo(gx, gy - 4); ctx.lineTo(gx + .7, gy); ctx.lineTo(gx, gy + 4); ctx.lineTo(gx - .7, gy); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(gx - 4, gy); ctx.lineTo(gx, gy - .7); ctx.lineTo(gx + 4, gy); ctx.lineTo(gx, gy + .7); ctx.closePath(); ctx.fill(); }); // glints on the tallest
          ctx.restore();
        },
        afterMid: () => { // the mooring mast on the quay, sinking away behind her
          const mx = 34 - d * 1.0, my = drop; if (mx < -40) return; ctx.save(); ctx.translate(mx, my);
          ctx.fillStyle = C('#3E3440'); ctx.fillRect(-4, Y_OFF - 20, 8, FLOOR_TOP - Y_OFF + 30); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.strokeRect(-4, Y_OFF - 20, 8, FLOOR_TOP - Y_OFF + 30);
          ctx.fillStyle = C('#B88A48'); for (const y of [Y_OFF + 36, Y_OFF + 66]) { ctx.fillRect(-6, y - 2, 12, 4); ctx.strokeRect(-6, y - 2, 12, 4); }
          ctx.restore(); },
      }, t));
      // the mooring lines: taut, then parting one after the other with a crack, the deck ends whipping back over the rail
      const mx = 34 - d, my = drop;
      ctx.lineCap = 'round';
      for (const [i, ax, myy] of [[0, 92, Y_OFF + 36], [1, 168, Y_OFF + 66]]) {
        const ay = FLOOR_TOP - 44, sn = E.snap[i], rope = (pts) => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); ctx.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]); ctx.strokeStyle = OUT; ctx.lineWidth = 3.2; ctx.stroke(); ctx.strokeStyle = C('#9A7A50'); ctx.lineWidth = 1.8; ctx.stroke(); };
        if (!sn) { const tx = mx + 4, ty = myy + my; rope([ax, ay, (ax + tx) / 2, (ay + ty) / 2 + 10, tx, ty]); }
        else { const w = u - sn, sw = Math.sin(w * 9) * 14 * Math.exp(-w * 2.2); rope([ax, ay, ax - 10 + sw, ay + 14, ax - 4 + sw * .6, ay + 30]); // the end left on deck, dangling over the side
          const tx = mx + 4, ty = myy + my; rope([tx, ty, tx + 8, ty + 24, tx + 2, ty + 48]); } // and the other hanging from the mast
      }
      const pose = poseAs('idle'); pose.yaw = .18; pose.look = 1; pose.flow = 2 + 6 * r; // the wind of her going streams his cloak out behind him
      ctx.save(); ctx.translate(-300, 0); inkHero(300 + VW * .55, FLOOR_TOP + 58, 1, 1, pose, 1, true); ctx.restore();
      ctx.restore();
      gradeFrame('sky');
      ctx.save(); ctx.globalCompositeOperation = 'soft-light'; const sg = ctx.createLinearGradient(0, Y_OFF, 0, VH); sg.addColorStop(0, `rgba(160,80,140,${.4 * s})`); sg.addColorStop(1, `rgba(255,150,80,${.45 * s})`); ctx.fillStyle = sg; view(); ctx.restore();
      cycleTint();
    },
  };

  // ======================================================================================================
  // WORLD 3, THE PRISM RIM: the Kaleidoscope Wyrm breaks into a rain of crystal, the turning sky stops and goes to night,
  // and a black road comes out of the dark and runs away into it, toward the Courts of Chaos
  // ======================================================================================================
  const STARS = []; for (let i = 0; i < 80; i++) STARS.push([hsh(i * 2 + 1), hsh(i * 2 + 2), .35 + hsh(i + 101) * .6, .5 + hsh(i + 201) * .8]);
  function stars(a, y1) { if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const [x, y, b, r] of STARS) { const yy = Y_OFF + 4 + y * (y1 - Y_OFF - 8); ctx.fillStyle = `rgba(230,236,255,${b * a})`; circle(x * VW, yy, r); ctx.fill(); } ctx.restore(); }
  const SHARD = ['#BFF5FF', '#F0A0E0', '#B8A0FF', '#7FF5F0', '#FFE6FA', '#9FD8FF'];
  const W3 = {
    theme2: 'prism', seed: 233, d0: 3.2, d1: 4.2, dir: -1, bannerAt: 3.8, dur: 9, music: 'prism', still: 1.1,
    title: 'The Colors Fell Still', sub: 'AND NIGHT CAME, AND A BLACK ROAD RAN ON INTO THE DARK',
    tintB(B) { tintCanvas(B.far, 'rgba(8,8,30,.62)'); tintCanvas(B.mid, 'rgba(6,5,22,.6)'); tintCanvas(B.floor, 'rgba(6,5,20,.5)'); },
    setup(E) { E.flash = 0; },
    update(E, T, dt) {
      const b = E.boss;
      if (T > .3 && !E.broke) { E.broke = 1; E.flash = .5; sfx('hit-crystal'); sfx('break'); shakeMag = 0;
        if (b) { corpses = corpses.filter(c => c !== b); enemies = enemies.filter(c => c !== b);
          for (let i = 0; i < 150; i++) { const h = Math.random(), x = b.x + rand(-90, 70) * (b.size || 1), z = 10 + h * 220; // the wyrm, all at once, a burst of glass
            parts.push({ x, y: b.y + rand(-14, 14), z, vx: rand(-120, 120), vy: rand(-20, 20), vz: rand(-20, 180), life: rand(2.5, 4.5), max: 4.5, col: pick(SHARD), size: rand(2.5, 6), shape: 'shard', rot: rand(0, TAU), vr: rand(-10, 10), rest: false }); } } }
      if (T > .5 && T < 2.6 && parts.length < 600) { let n = dt * 70 * (1 - sm((T - 1.8) / .8)); while (n > 0) { if (Math.random() < n) parts.push({ x: camX + rand(0, VW), y: rand(FLOOR_TOP + 6, FLOOR_BOT), z: rand(200, 290), vx: rand(-10, 10), vy: 0, vz: rand(-90, -30), life: rand(2.6, 4), max: 4, col: pick(SHARD), size: rand(1.6, 3.6), shape: 'shard', rot: rand(0, TAU), vr: rand(-6, 6), rest: false }); n -= 1; } } // and the sky rains crystal
      E.flash = Math.max(0, E.flash - dt);
    },
    over(E, T) { // the kaleidoscope stops turning and the night comes down over it
      const k = sm((T - .9) / 2);
      ctx.save(); ctx.globalCompositeOperation = 'multiply';
      const g = ctx.createLinearGradient(0, Y_OFF, 0, VH); g.addColorStop(0, `rgba(24,26,70,${.8 * k})`); g.addColorStop(.55, `rgba(40,40,90,${.6 * k})`); g.addColorStop(1, `rgba(60,60,110,${.4 * k})`); ctx.fillStyle = g; view(); ctx.restore();
      stars(k * .9, Y_OFF + 80);
      if (E.flash > 0) { ctx.fillStyle = `rgba(240,225,255,${E.flash * 1.2})`; view(); }
    },
    road(E, t, rk) { // the Black Road: glass-black, faintly edged, out of the near dark and away up into the far
      const P0 = [VW * .02, VH + 10], P1 = [VW * .55, FLOOR_TOP + 40], P2 = [VW * .9, FLOOR_TOP - 72];
      const at = (s) => { const i = 1 - s; return [i * i * P0[0] + 2 * i * s * P1[0] + s * s * P2[0], i * i * P0[1] + 2 * i * s * P1[1] + s * s * P2[1]]; };
      E.at = at; if (rk <= 0) return;
      const L = [], R = [], n = 40;
      for (let i = 0; i <= n; i++) { const s = i / n * rk, [x, y] = at(s), [x2, y2] = at(Math.min(1, s + .01)), a = Math.atan2(y2 - y, x2 - x), w = lerp(210, 3, Math.pow(s, .8)) * .5;
        L.push([x + Math.sin(a) * w * .6, y - Math.cos(a) * w * .5]); R.push([x - Math.sin(a) * w * .6, y + Math.cos(a) * w * .5]); } // across it, foreshortened as it lies on the ground
      ctx.save(); ctx.beginPath(); L.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); for (let i = R.length - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]); ctx.closePath();
      const g = ctx.createLinearGradient(0, VH, 0, P2[1]); g.addColorStop(0, '#120C1C'); g.addColorStop(1, '#030206'); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.strokeStyle = 'rgba(150,130,220,.4)'; ctx.lineWidth = .9; for (const E2 of [L, R]) { ctx.beginPath(); E2.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(120,100,180,.16)'; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i <= n; i++) { const [x, y] = at(i / n * rk); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); // its glassy sheen
      ctx.restore();
      // where it goes: under a black sun, the spires of the Courts, no more than a darker dark
      const ek = sm((rk - .7) / .3); if (ek <= 0) return; const [ex, ey] = [P2[0] + 6, P2[1] - 18];
      ctx.save(); ctx.globalAlpha = ek;
      glowR(ex, ey, 34, '170,90,170', .35); ctx.fillStyle = '#010003'; circle(ex, ey, 9); ctx.fill(); ctx.strokeStyle = 'rgba(230,180,240,.7)'; ctx.lineWidth = .8; circle(ex, ey, 9.6); ctx.stroke();
      ctx.fillStyle = '#05030A'; ctx.beginPath(); ctx.moveTo(ex - 30, ey + 22); for (const [dx, h] of [[-26, 6], [-20, 14], [-14, 8], [-8, 20], [-2, 10], [4, 24], [10, 9], [16, 16], [22, 7], [28, 11]]) { ctx.lineTo(dx - 2, ey + 22 - h * .4); ctx.lineTo(dx, ey + 22 - h); ctx.lineTo(dx + 2, ey + 22 - h * .4); } ctx.lineTo(ex + 32, ey + 22); ctx.closePath(); ctx.fill();
      ctx.restore();
    },
    act2(E, T, dt, t) {
      const u = T - this.d0, B = freshAlt(E), cam = 500;
      withSet(B, () => paintWorld('prism', { cam, noWash: true,
        skyFill: () => { const g = ctx.createLinearGradient(0, Y_OFF, 0, FLOOR_TOP); g.addColorStop(0, '#020208'); g.addColorStop(.5, '#0A0A20'); g.addColorStop(1, '#1A1636'); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, FLOOR_TOP); },
        sky: () => stars(1, FLOOR_TOP - 20) }, t));
      const rk = sm((u - .2) / 1.8); this.road(E, t, rk);
      // he walks out onto it and away, smaller and smaller, until the dark has him
      const s = lerp(.13, .74, sm((u - .9) / 5)), [x, y] = E.at(s), sc = lerp(1.05, .36, cl01((s - .13) / .6)), fade = 1 - sm((s - .58) / .14);
      P.state = 'walk'; P.facing = 1; P.walk += dt * 5.2 * (u > .9 ? 1 : 0);
      if (rk > .1) inkHero(x, y, sc, 1, poseAs(u > .9 ? 'walk' : 'idle'), fade * sm((u - .2) / .5), true);
      gradeFrame('prism');
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; const vg = ctx.createRadialGradient(VW * .6, Y_OFF + VIEW_H * .5, VIEW_H * .3, VW * .6, Y_OFF + VIEW_H * .5, VW * .7); vg.addColorStop(0, 'rgba(255,255,255,0)'); vg.addColorStop(1, 'rgba(20,16,40,.7)'); ctx.fillStyle = vg; view(); ctx.restore();
      cycleTint();
    },
  };

  // ======================================================================================================
  // WORLD 4, THE COURTS OF CHAOS: the faces the Ty'iga wore fall silent, the Abyss goes still, and he draws a Trump: the
  // long-shadowed square of a stranger's dream. It comes alive in his hand, and he steps through it, into the Dreaming Shadow
  // (the card shows whichever world comes next: theme2)
  // ======================================================================================================
  const W4 = {
    theme2: 'dream', seed: 241, d0: 7, d1: 7, noCells: 1, bannerAt: 6.1, dur: 10, music: 'chaos', still: 1.2,
    title: 'A Thousand Faces, Silent', sub: 'HE DREW A CARD FROM THE DECK, AND ON IT AN AFTERNOON THAT NO ONE HAD EVER PAINTED', label: 'THE DREAMING SHADOW',
    setup(E) {
      const b = E.boss; E.masks = []; E.halo0 = b ? (b.w4halo ?? 1) : 1;
      if (b) for (let i = 0; i < 7; i++) E.masks.push({ x: b.x + (i - 3) * 20 * (b.size || 1) + rand(-5, 5), y: b.y + rand(-22, 16), z0: 70 + hsh(i + 3) * 60, at: .2 + i * .17 + hsh(i) * .08, rot: rand(-.5, .5), lr: rand(-1.2, 1.2), s: rand(.9, 1.25) });
      const side = P.x - camX < VW * .55 ? 1 : -1; // he draws the card on the side with room for it
      E.cardX = clamp(P.x - camX + side * 96, VW * .3, VW * .8); E.cardY = Y_OFF + VIEW_H * .44; E.x0 = P.x; E.side = side;
    },
    update(E, T, dt) {
      const b = E.boss; if (b && b.def.draw === 'tyiga') b.w4halo = E.halo0 * (1 - sm(T / 1.5));
      if (T > 1.7 && T < 4.6) { P.facing = E.side; P.state = 'idle'; }
      if (T > 2.4 && !E.drew) { E.drew = 1; sfx('trump'); }
      if (T > 4.6) { const tx = E.cardX + camX - E.side * 4; if (!E.inCard) walkTo(E, dt, tx, 70); }
      E.heroA = 1 - sm((T - 5.2) / .5); if (E.heroA <= 0 && !E.inCard) { E.inCard = 1; sfx('whoosh'); }
      if (T > 5.8 && !E.moon) { E.moon = 1; if (TRACKS[this.theme2]) playMusic(this.theme2); }
    },
    pose(E, pose) { // the card held up before him, at arm's length
      const T = E.t, q = sm((T - 2.1) / .45) * (1 - sm((T - 3.6) / .5));
      if (q > 0) { pose.backArm = lerp(pose.backArm ?? 1.5, -.12, q); pose.backElbow = lerp(pose.backElbow ?? .3, .55, q); pose.openHand = 0; }
    },
    items(E, list, T) {
      for (const m of E.masks) list.push([m.y, () => { // each one drops from the dark and lies where it falls, quiet
        const w = T - m.at; if (w < 0) { onMain(() => glowR(m.x, m.y - m.z0, 14, '170,110,210', .4 * cl01(T / .2))); mask(m.x, m.y - m.z0, m.s, m.rot + Math.sin(T * 3 + m.lr) * .2, 1); return; }
        const z = Math.max(0, m.z0 - .5 * 900 * w * w), land = z <= 0, rot = land ? m.rot * .3 + m.lr : m.rot + m.lr * w * 2;
        if (land && !m.hit) { m.hit = 1; dust(m.x, m.y, 4); }
        shadow(m.x, m.y, 7 * m.s); mask(m.x, m.y - z - (land ? 3 : 0), m.s, rot, land ? 0 : 1);
      }]);
    },
    boxes(E, box) { for (const m of E.masks) box(m.x, m.y, 0, 20, m.z0 + 20); },
    hand() { const f = P.facing; return [P.x - camX + f * 19.5, P.y - 70]; }, // (held up between finger and thumb, at eye height)
    card(E, T, t) { // the Trump: the moon over its ghost city, in a frame of silver leaf, alive under his eyes
      const B = freshAlt(E), held = sm((T - 2.3) / .3), fly = sm((T - 3.3) / 1.1), zoom = sm((T - 5.8) / 1.2);
      if (held <= 0) return;
      const [hx, hy] = this.hand(), hc = lerp(19, 150, fly), cx0 = lerp(hx, E.cardX, fly), cy0 = lerp(hy, E.cardY, fly);
      const S1 = [VW * .68, Y_OFF + VIEW_H / 2], VC = [VW / 2, Y_OFF + VIEW_H / 2]; // the picture is centred on the moon; the card opens out to fill the view
      const cx = lerp(cx0, VC[0], zoom), cy = lerp(cy0, VC[1], zoom), px = lerp(cx0, S1[0], zoom), py = lerp(cy0, S1[1], zoom), w = lerp(hc * .62, VW + 4, zoom), h = lerp(hc, VIEW_H + 4, zoom), sc = lerp(hc / VIEW_H, 1, zoom);
      const alive = sm((T - 3.6) / 1.2); // first only paint on a card, then the picture breathes and moves
      ctx.save(); ctx.globalAlpha = held;
      if (zoom < 1) glowR(cx, cy, h * .9, '220,230,255', (.18 + .3 * sm((T - 4.6) / 1)) * (1 - zoom));
      ctx.save(); rrect(cx - w / 2, cy - h / 2, w, h, 4 * (1 - zoom)); ctx.clip();
      ctx.translate(px, py); ctx.scale(sc, sc); ctx.translate(-S1[0], -S1[1]);
      const camM = 280 + (T - 3) * 6 * alive, tm = 1000 + (T - 3) * alive;
      withSet(B, () => paintWorld(this.theme2, { cam: camM }, tm));
      if (E.inCard || T > 5.2) { const k = sm((T - 5.2) / .6), mt = Math.max(0, T - 5.6); // and he is in it, walking on toward the city
        ctx.save(); ctx.translate(-camM, 0); inkHero(camM + VW * .4 + mt * 34, FLOOR_TOP + 62, 1, 1, poseAs('walk', 5 + mt * 3.4), k, E.inCard); ctx.restore(); }
      gradeFrame(this.theme2);
      if (alive < 1) { ctx.fillStyle = `rgba(200,210,235,${.5 * (1 - alive)})`; view(); } // still only a painting, misted with silver
      ctx.restore();
      if (zoom < 1) { // the frame, which opens out past the edges as he goes through
        const b = Math.max(2, w * .06); ctx.save(); ctx.globalAlpha = held * (1 - zoom * .6);
        ctx.beginPath(); ctx.rect(cx - w / 2 - b, cy - h / 2 - b, w + b * 2, h + b * 2); ctx.rect(cx - w / 2, cy - h / 2, w, h);
        const fg = ctx.createLinearGradient(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2); fg.addColorStop(0, '#F4F7FC'); fg.addColorStop(.5, '#8E9AB4'); fg.addColorStop(1, '#DCE4F0'); ctx.fillStyle = fg; ctx.fill('evenodd');
        ctx.strokeStyle = OUT; ctx.lineWidth = 1.1; ctx.strokeRect(cx - w / 2 - b, cy - h / 2 - b, w + b * 2, h + b * 2); ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
        if (hc > 60) { ctx.fillStyle = 'rgba(40,48,80,.55)'; for (let i = 0; i < 22; i++) { const q = i / 21; circle(cx - w / 2 - b / 2 + q * (w + b), cy - h / 2 - b / 2, .8); ctx.fill(); circle(cx - w / 2 - b / 2 + q * (w + b), cy + h / 2 + b / 2, .8); ctx.fill(); }
          for (const [px, py] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) silverRose(cx + px * (w / 2 + b / 2), cy + py * (h / 2 + b / 2), b * .3, false);
          ctx.globalAlpha *= cl01((hc - 60) / 40) * (1 - zoom); ctx.fillStyle = 'rgba(8,12,30,.85)'; rrect(cx - w * .4, cy + h / 2 - 20, w * .8, 14, 3); ctx.fill(); ctx.fillStyle = '#E8EEF8'; ctx.font = '700 7px Cinzel, Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText(this.label, cx, cy + h / 2 - 10.5); }
        ctx.restore();
      }
      ctx.restore();
    },
    over(E, T, t) { // the Abyss lies down; then the card
      const k = sm(T / 2.2);
      ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = `rgba(80,100,170,${.4 * k})`; view(); ctx.restore();
      this.card(E, T, t);
    },
    act2(E, T, dt, t) { this.card(E, T, t); cycleTint(); },
  };
  // ======================================================================================================
  // THE DREAMING SHADOW: the Sleeper wakes, and what it dreamed goes out, colour first and then line, until there is
  // only the bare ground of the panel and the prince standing on it; then a new picture is painted in round him, stroke
  // by stroke: night, the full moon, and a stair of moonlight going up to a city in the sky. He walks on toward it
  // ======================================================================================================
  const PAPER = '#EFE6D2';
  const W6E = {
    theme2: 'moon', seed: 251, d0: 4.4, d1: 5.8, dir: 1, bannerAt: 5, dur: 11, music: 'moon', still: 1.4,
    title: 'And the Dreamer Woke', sub: 'AND ALL IT HAD DREAMED WENT OUT, BUT THE MOON, AND A CITY THAT IS ONLY THERE BY ITS LIGHT',
    setup(E) { E.hx = P.x - camX; },
    update(E, T, dt) { if (T > .3 && !E.chime) { E.chime = 1; sfx('learned'); } if (T > 1.3 && !E.chime2) { E.chime2 = 1; sfx('trump'); } },
    over(E, T, t) { // the dream unpaints itself from the edges in, the colour draining first; he is left on bare paper
      const k = sm((T - 1) / 2.6), dr = sm((T - .6) / 1.6);
      if (dr > 0) { ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgba(128,128,128,${.85 * dr})`; view(); ctx.restore(); }
      if (k > 0) { const cx = P.x - camX, cy = P.y - 40, R = lerp(VW * 1.2, 70, k);
        ctx.save(); const g = ctx.createRadialGradient(cx, cy, R * .55, cx, cy, R); g.addColorStop(0, 'rgba(239,230,210,0)'); g.addColorStop(1, PAPER); ctx.fillStyle = g; view();
        ctx.beginPath(); ctx.rect(0, Y_OFF, VW, VIEW_H); ctx.arc(cx, cy, R, 0, TAU, true); ctx.fillStyle = PAPER; ctx.fill('evenodd');
        ctx.strokeStyle = `rgba(80,70,60,${.35 * (1 - k * .5)})`; ctx.lineWidth = .8; // what is left of the dream: the pencil lines under the paint
        for (let i = 0; i < 26; i++) { const x = hsh(i) * VW, y = Y_OFF + hsh(i + 5) * VIEW_H, d = Math.hypot(x - cx, y - cy); if (d < R * .7) continue; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 20 + hsh(i + 9) * 40, y + (hsh(i + 11) - .5) * 20); ctx.stroke(); }
        ctx.restore();
        ctx.save(); ctx.translate(-camX, 0); inkHero(P.x, P.y, 1, P.facing, poseAs('idle'), 1, true); ctx.restore(); }
    },
    act2(E, T, dt, t) { // the next panel, painted in over the bare ground: the stair of moonlight, and he walks toward it
      const u = T - this.d0, B = freshAlt(E), cam = 300 + 14 * u;
      ctx.fillStyle = PAPER; view();
      withSet(B, () => paintWorld('moon', { cam }, t));
      P.state = 'walk'; P.facing = 1; P.walk += dt * 40 / 10.2;
      ctx.save(); ctx.translate(-cam, 0); inkHero(cam + E.hx + 40 * u, P.y, 1, 1, poseAs('walk'), 1, true); ctx.restore();
      gradeFrame('moon'); cycleTint();
    },
  };
  const WORLDS = { bloom: W1, sky: W2, prism: W3, chaos: W4, dream: W6E };

  // ---------------- running it ----------------
  function render(t) {
    const E = END, W = E.W, now = performance.now(), rdt = Math.min(.05, (now - E.last) / 1000); E.last = now; E.real += rdt;
    const dt = HOLD.at !== null && E.t >= HOLD.at ? 0 : rdt * E.rate; E.t += dt; const T = E.t; // (a test can hold the clock still)
    if (T >= W.bannerAt && !E.bannered) { E.bannered = 1; banner(W.title, W.sub, (W.dur - W.bannerAt - .9) / E.rate); }
    if (W.update) W.update(E, T, dt);
    const showA1 = T < W.d1, showA2 = T >= W.d0 && W.act2;
    if (showA1) {
      updateFx(dt);
      if (T >= W.d0 && !W.noCells && !E.frozenPose) { E.frozenPose = blendPose(Object.assign(playerPose(), { live: 0 })); E.frozenF = P.facing; } // (its prince stops being the live one)
      const tS = W.still ? E.t0 + W.still * (1 - Math.exp(-T / W.still)) : t; // stilling, the whole room slows to a stop
      const pf = paperFrame; paperFrame = () => {}; E.inA1 = true;
      try { E.orig(tS); } finally { paperFrame = pf; E.inA1 = false; }
      if (W.over) W.over(E, T, t);
    }
    if (showA2) {
      const k = W.noCells ? 1 : cl01((T - W.d0) / (W.d1 - W.d0));
      ctx.save(); if (showA1 && k < 1) cellsClip(k, W.dir || 1);
      try { W.act2(E, T, dt, t); } finally { ctx.restore(); }
    }
    if (E.bannered) { const bk = sm((T - W.bannerAt) / .8) * (1 - sm((T - (W.dur - 1.4)) / .7)); // a soft shadow behind the narration, so it reads on any sky
      if (bk > 0) { ctx.save(); ctx.translate(VW / 2, Y_OFF + VIEW_H * .335); ctx.scale(1, .2); const g = ctx.createRadialGradient(0, 0, 10, 0, 0, VW * .52); g.addColorStop(0, `rgba(14,8,18,${.5 * bk})`); g.addColorStop(.6, `rgba(14,8,18,${.32 * bk})`); g.addColorStop(1, 'rgba(14,8,18,0)'); ctx.fillStyle = g; ctx.fillRect(-VW, -VW * .6, VW * 2, VW * 1.2); ctx.restore(); } }
    const fo = sm((T - (W.dur - .8)) / .8); if (fo > 0) { ctx.fillStyle = `rgba(8,6,12,${fo})`; view(); }
    skipHint(E.real);
    paperFrame();
    if (T >= W.dur) finish();
  }
  function start(sc) {
    const W = WORLDS[baseStage.theme]; if (!W) return sc();
    const E = END = { W, t: 0, real: 0, last: performance.now(), sc, orig: E_ORIG, t0: performance.now() / 1000, boss: boss && boss.dead ? boss : null, rate: save.cycle > 0 ? 1.6 : 1, heroA: 1 };
    try { E.B = buildAlt(W.theme2, W.seed + stageIdx); if (W.tintB) W.tintB(E.B); W.setup(E); }
    catch (err) { console.error(err); dropAlt(E.B); END = null; return sc(); }
    mode = 'ending'; clearInput();
    hitstop = 0; slowmo = 0; shakeMag = 0; zoom = 0; flashT = 0; hurtFlash = 0; mirrorT = 0; stillT = 0;
    P.inv = 0; P.z = 0; P.vz = 0; P.state = 'idle'; P.move = null;
    if (E.boss) P.facing = Math.sign(E.boss.x - P.x) || P.facing;
    app.classList.add('sr-end', 'nocontrols'); app.classList.remove('playing');
    if (W.music && TRACKS[W.music]) playMusic(W.music);
  }
  function cleanup() {
    const E = END; if (!E) return; END = null;
    dropAlt(E.B); app.classList.remove('sr-end');
    $('#banner').classList.remove('on'); bannerT = 0;
    if (P && P.state !== 'dead') { P.state = 'idle'; P.walk = 0; }
    return E;
  }
  function finish() { const E = cleanup(); if (!E) return; app.classList.remove('nocontrols'); E.sc(); }
  let swallowT = 0;
  function skip() { if (!END || END.real < (END.rate > 1 ? .2 : .9)) return false; swallowT = performance.now() + 450; finish(); return true; }

  // ---------------- hooks ----------------
  let E_ORIG = null; const HOLD = { at: null };
  const _sc = stageClear;
  stageClear = function () { // (world 5 wraps this from outside and takes its own ending first)
    if (!END && typeof baseStage !== 'undefined' && baseStage && WORLDS[baseStage.theme] && stageIdx < STAGES.length - 1) { start(_sc); return; }
    return _sc();
  };
  const _ds = drawScene; E_ORIG = _ds;
  drawScene = function (t) {
    if (END && mode !== 'ending') { const m = mode, E = cleanup(); if (m === 'forge' && E) E.sc(); } // something else took over (a menu, or a test): wrap up quietly
    if (END) { render(t); return; }
    return _ds(t);
  };
  const _br = drawBossRoom; drawBossRoom = function (t) { _br(t); if (END && END.inA1 && END.W.under) END.W.under(END, END.t, t); };
  const _mb = mechBoxes; mechBoxes = function (box) { _mb(box); if (END && END.inA1 && END.W.boxes) END.W.boxes(END, box); };
  const _ml = mechList;
  mechList = function (list, t) {
    _ml(list, t);
    if (!END || !END.inA1) return;
    const E = END; // the prince is drawn by this file while it runs, so it can pose him, walk him, and let him go
    for (let i = list.length - 1; i >= 0; i--) if (list[i][0] === P.y + .1 || list[i][0] === P.y + .15) list.splice(i, 1);
    list.push([P.y + .1, () => heroItem(E)]);
    if (E.W.items) E.W.items(E, list, E.t, t);
  };
  window.addEventListener('keydown', (e) => {
    if (!END) { if (performance.now() < swallowT && (e.repeat || e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space')) { e.stopImmediatePropagation(); e.preventDefault(); } return; }
    if (['Enter', 'NumpadEnter', 'Space', 'Escape', 'KeyJ', 'KeyK', 'KeyL', 'KeyI', 'KeyU', 'KeyO'].includes(e.code) && !e.repeat) skip();
    e.stopImmediatePropagation(); e.preventDefault(); // nothing else hears keys while it plays
  }, true);
  window.addEventListener('pointerdown', (e) => { if (END) { skip(); e.preventDefault(); } }, true);
  { const st = document.createElement('style'); // while it plays the HUD steps aside, all but the banner
    st.textContent = '#app.sr-end #hud > :not(#banner){visibility:hidden!important}#app.sr-end #banner{transition:opacity .9s}#app.sr-end #banner .s{max-width:84%;margin:6px auto 0;line-height:1.7}';
    document.head.appendChild(st); }
  window.ENDINGS = { get active() { return !!END; }, t: () => END && END.t, real: () => END && END.real, skip: () => skip(), world: () => END && baseStage.theme, hold: (T) => { HOLD.at = T ?? null; } };
})();
