'use strict';
// ---------- breakable armor for the first worlds' foes (see ARMOR in world.js) ----------
// Each elite of these kinds wears something over its body that its guard is made of: a candy shell, bark plates, a
// stone idol-mask, a riveted cowl, a tricorn and cuirass, a porcelain mask. It cracks as the guard's pips go, and when the
// guard breaks it flies apart and shows what was underneath: a molten core, a demon's face, a briar curse, a feral imp.
// The bare forms are drawn here too, over the creature (ARMOR[type].bare) or inside its body before the front arm
// (ARMOR[type].mid / bareMid, called through ARMOR_MID from drawHumanoid and drawAutomaton).
(function () {
  const DET = () => !FLASH && !TINT;
  const BIG = () => ctx.rect(-600, -600, 1200, 1200);
  // P(...) builds a reusable path: M x y | L x y | Q cx cy x y | C c1x c1y c2x c2y x y | Z | E cx cy rx ry rot
  function P(...c) {
    return (ox, oy) => {
      let i = 0;
      while (i < c.length) {
        const k = c[i++];
        if (k === 'M') { ctx.moveTo(c[i] + ox, c[i + 1] + oy); i += 2; }
        else if (k === 'L') { ctx.lineTo(c[i] + ox, c[i + 1] + oy); i += 2; }
        else if (k === 'Q') { ctx.quadraticCurveTo(c[i] + ox, c[i + 1] + oy, c[i + 2] + ox, c[i + 3] + oy); i += 4; }
        else if (k === 'C') { ctx.bezierCurveTo(c[i] + ox, c[i + 1] + oy, c[i + 2] + ox, c[i + 3] + oy, c[i + 4] + ox, c[i + 5] + oy); i += 6; }
        else if (k === 'Z') ctx.closePath();
        else if (k === 'E') { const rx = Math.max(.1, c[i + 2]), ry = Math.max(.1, c[i + 3]), r = c[i + 4]; ctx.moveTo(c[i] + ox + Math.cos(r) * rx, c[i + 1] + oy + Math.sin(r) * rx); ctx.ellipse(c[i] + ox, c[i + 1] + oy, rx, ry, r, 0, TAU); i += 5; }
      }
    };
  }
  function poly(pts) {
    return (ox, oy) => { ctx.moveTo(pts[0] + ox, pts[1] + oy); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i] + ox, pts[i + 1] + oy); ctx.closePath(); };
  }
  // cel shading as the beasts are painted: a flat base, a hard shadow plane lower-left, a lit rim upper-right, texture, ink
  function cel(p, col, o = {}) {
    const d = o.d === undefined ? 2.4 : o.d, r = o.r === undefined ? 1 : o.r, w = o.w === undefined ? 1.4 : o.w;
    ctx.beginPath(); p(0, 0); ctx.fillStyle = C(col); ctx.fill();
    if (DET()) {
      ctx.save(); ctx.beginPath(); p(0, 0); ctx.clip();
      if (o.under) o.under();
      if (d) { ctx.fillStyle = o.dark || shade(col, -.3); ctx.beginPath(); BIG(); p(d, -d * .8); ctx.fill('evenodd'); }
      if (o.deep) { ctx.fillStyle = o.deepCol || shade(col, -.5); ctx.beginPath(); BIG(); p(o.deep, -o.deep * .8); ctx.fill('evenodd'); }
      if (r) { ctx.fillStyle = o.lite || shade(col, .32); ctx.beginPath(); BIG(); p(-r, r * .8); ctx.fill('evenodd'); }
      if (o.tex) o.tex();
      if (o.k) cracks(o.k, o.seed || 1, o.box || [-30, -80, 60, 80]);
      ctx.restore();
    }
    if (w) { ctx.beginPath(); p(0, 0); outline(w); }
  }
  // a seeded hash in 0..1
  const H = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  // cracks spreading over a piece as its guard wears (drawn inside the piece's clip): dark splits with a lit lip
  function cracks(k, seed, box) {
    const n = Math.round(k * 4 + .2); if (n <= 0) return;
    const [bx, by, bw, bh] = box;
    for (let i = 0; i < n; i++) {
      let x = bx + bw * (.2 + .6 * H(seed + i * 3.1)), y = by + bh * (.2 + .6 * H(seed + i * 7.7));
      const pts = [x, y], ang = H(seed + i) * TAU;
      for (let j = 0; j < 4; j++) { const a2 = ang + (H(seed + i + j * 1.3) - .5) * 1.6 + (j % 2 ? .5 : -.5); x += Math.cos(a2) * (3 + 3 * H(seed + j + i)); y += Math.sin(a2) * (3 + 3 * H(seed + j * 2 + i)); pts.push(x, y); }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(255,250,235,.55)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(pts[0] + .6, pts[1] + .5); for (let q = 2; q < pts.length; q += 2) ctx.lineTo(pts[q] + .6, pts[q + 1] + .5); ctx.stroke();
      ctx.strokeStyle = 'rgba(30,16,24,.85)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let q = 2; q < pts.length; q += 2) ctx.lineTo(pts[q], pts[q + 1]); ctx.stroke();
    }
  }
  function rivet(x, y, col, r = .9) {
    ctx.fillStyle = C(shade(col, -.5)); circle(x, y, r); ctx.fill();
    if (DET()) { ctx.fillStyle = shade(col, .6); circle(x + r * .3, y - r * .3, r * .45); ctx.fill(); }
  }
  function glow(x, y, r, rgb, al) {
    if (!DET() || al <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${al})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; circle(x, y, r); ctx.fill(); ctx.restore();
  }
  function strokes(list, col, w) {
    ctx.strokeStyle = C(col); ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath();
    for (let i = 0; i < list.length; i += 4) { ctx.moveTo(list[i], list[i + 1]); ctx.lineTo(list[i + 2], list[i + 3]); }
    ctx.stroke();
  }
  // a curved thorn from a base point: ang is the way it points, L its length, wd its width at the base
  function thorn(x, y, ang, L, wd, col, hook = .35) {
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx, tx = x + dx * L + nx * L * hook * .5, ty = y + dy * L + ny * L * hook * .5;
    cel(P('M', x - nx * wd, y - ny * wd, 'Q', x + dx * L * .55 - nx * wd * .3, y + dy * L * .55 - ny * wd * .3, tx, ty, 'Q', x + dx * L * .5 + nx * wd * .8, y + dy * L * .5 + ny * wd * .8, x + nx * wd, y + ny * wd, 'Z'), col, { d: wd * .5, r: .6, w: 1 });
  }
  // a faceted crystal shard (as the prism creatures grow them)
  const ICE = { lt: '#E4FCFF', mid: '#8ADBEA', dk: '#4F6FBE', deep: '#33317A' };
  const ROSE = { lt: '#FFE2F6', mid: '#E29AE0', dk: '#8A4FB4', deep: '#4E2A7A' };
  function shard(x, y, len, ang, w, pal = ICE, ow = 1.1) {
    const dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx, tx = x + dx * len, ty = y + dy * len;
    const s1x = x + dx * len * .62 + px * w * .5, s1y = y + dy * len * .62 + py * w * .5, s2x = x + dx * len * .55 - px * w * .45, s2y = y + dy * len * .55 - py * w * .45;
    const b1x = x + px * w * .42, b1y = y + py * w * .42, b2x = x - px * w * .42, b2y = y - py * w * .42, rx = x + dx * len * .5, ry = y + dy * len * .5;
    const lit = (px * .6 - py * .8) > 0;
    const fp = (pts, col) => { ctx.beginPath(); poly(pts)(0, 0); ctx.fillStyle = C(col); ctx.fill(); };
    fp([b1x, b1y, s1x, s1y, tx, ty, rx, ry, x, y], lit ? pal.lt : pal.dk);
    fp([b2x, b2y, s2x, s2y, tx, ty, rx, ry, x, y], lit ? pal.dk : pal.mid);
    if (DET()) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(tx, ty); ctx.stroke(); }
    ctx.beginPath(); poly([b1x, b1y, s1x, s1y, tx, ty, s2x, s2y, b2x, b2y])(0, 0); outline(ow);
  }
  const wear = (e) => e && e.guardMax ? clamp(1 - e.guard / e.guardMax, 0, 1) : 0;
  // a piece that flies off: drawn about its own middle (x, y is where it sat on the body)
  const bit = (x, y, f) => ({ x, y, fn: () => { ctx.translate(-x, -y); f(); } });
  // the bare form fights harder: a little faster on its feet and quicker to strike (its own copy of its numbers)
  function enrage(e, spdK, cdK, more) {
    if (e.boss) return;
    const d = e.def; e.def = Object.assign({}, d, { spd: d.spd * spdK, cd: [d.cd[0] * cdK, d.cd[1] * cdK] }, more || {});
  }
  // the frame of a standing humanoid (drawHumanoid, art.js) for the pieces that fly off it
  const HUM = { HIP: -30, SHO: -49, NECK: -53, hy: -61, cr: 0, LEAN: 0, head: () => { ctx.translate(1, -53); ctx.scale(.9, .9); ctx.translate(-1, 53); } };
  const AUT = { HIP: -30, SHO: -49, hy: -61, cr: 0, LEAN: 0, head: () => {} };

  // wrap a creature's drawing so the armor can sit inside the body (mid) and the bare form can show over it
  function wrap(name) {
    const orig = CREATURES[name]; if (!orig || orig.armorA) return;
    const f = function (e, a) {
      const A = e && ARMOR[e.type];
      if (!A || !A.mineA) return orig.call(this, e, a);
      const on = e.elite && e.guard > 0 && !e.bare, bare = !!e.bare, aa = a || {};
      const keep = ARMOR_MID;
      ARMOR_MID = on && A.mid ? (k) => A.mid(e, aa, k) : bare && A.bareMid ? (k) => A.bareMid(e, aa, k) : null;
      try { orig.call(this, e, a); } finally { ARMOR_MID = keep; }
      if (bare && A.bare) A.bare(e, aa);
    };
    f.armorA = 1; CREATURES[name] = f;
  }
  const reg = (type, o) => { o.mineA = 1; if (!o.draw) o.draw = () => {}; ARMOR[type] = o; };

  // ======================= JELLYBLOOM: a hard shell of candied sugar =======================
  // The jelly has rolled in boiled sugar and set hard: an amber dome with the bloom poking out of its crown. Cracked
  // off, the goo underneath is raw and furious: the bloom gapes wide, caramel still dripping off it, and it hops faster.
  const slimeDims = (e, a) => { const t = a.t || 0, sq = (e && e.sq) || 1, wind = a.wind || 0, wob = Math.sin(t * 6) * .035;
    return { w: 15.5 / Math.sqrt(sq) * (1 + wob + wind * .08), h: 25 * sq * (1 - wob - wind * .12), lean: (a.atk ? 3 : 0) - wind * 2 }; };
  const candyPath = (w, h, lean) => P('M', -w - 3.2, -h * .3, 'C', -w - 2.4, -h * .7, -w * .7 + lean * .5, -h * 1.08, -w * .05 + lean, -h * 1.1,
    'C', w * .6 + lean, -h * 1.08, w + 2.6 + lean * .5, -h * .72, w + 3.6, -h * .3,
    'Q', w * .9, -h * .2, w * .7, -h * .28, 'Q', w * .55, -h * .08, w * .4, -h * .26, 'Q', w * .1, -h * .3, -w * .1, -h * .34,
    'Q', -w * .3, -h * .14, -w * .48, -h * .32, 'Q', -w * .8, -h * .36, -w - 3.2, -h * .3, 'Z');
  function candy(w, h, lean, k, alpha = 1) {
    const p = candyPath(w, h, lean);
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.beginPath(); p(0, 0); ctx.fillStyle = C('rgba(232,150,52,.42)'); ctx.fill();
    if (DET()) {
      ctx.save(); ctx.beginPath(); p(0, 0); ctx.clip();
      ctx.fillStyle = 'rgba(150,62,20,.38)'; ctx.beginPath(); BIG(); p(3.4, -2.6); ctx.fill('evenodd');
      ctx.fillStyle = 'rgba(255,214,140,.55)'; ctx.beginPath(); BIG(); p(-1.4, 1.2); ctx.fill('evenodd');
      ctx.fillStyle = 'rgba(255,255,250,.85)'; ctx.beginPath(); ctx.moveTo(w * .05 + lean, -h * 1.02); ctx.quadraticCurveTo(w * .7 + lean, -h * .98, w * .9, -h * .58); ctx.quadraticCurveTo(w * .55 + lean, -h * .86, w * .05 + lean, -h * 1.02); ctx.fill(); // hard gloss
      ctx.fillStyle = 'rgba(255,250,235,.9)'; for (let i = 0; i < 9; i++) { const u = H(i + 3), v = H(i * 2 + 1); circle(-w + u * w * 2, -h * (.45 + v * .55), .55 + (i % 3) * .2); ctx.fill(); } // sugar grains
      ctx.strokeStyle = 'rgba(120,50,16,.45)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(-w * .7, -h * .42); ctx.quadraticCurveTo(-w * .5, -h * .8, -w * .1, -h * .98); ctx.stroke(); // a pour line in the sugar
      cracks(k, 5, [-w, -h * 1.05, w * 2, h * .7]);
      ctx.restore();
    }
    ctx.beginPath(); p(0, 0); outline(1.5);
    ctx.restore();
  }
  reg('slime', {
    draw(e, a) { const { w, h, lean } = slimeDims(e, a); candy(w, h, lean, wear(e)); },
    pieces: [
      bit(-9, -17, () => { ctx.save(); ctx.beginPath(); ctx.rect(-40, -60, 33, 60); ctx.clip(); candy(15.5, 25, 0, 0); ctx.restore(); }),
      bit(10, -17, () => { ctx.save(); ctx.beginPath(); ctx.rect(5, -60, 40, 60); ctx.clip(); candy(15.5, 25, 0, 0); ctx.restore(); }),
      bit(-1, -24, () => { ctx.save(); ctx.beginPath(); ctx.rect(-7, -60, 12, 60); ctx.clip(); candy(15.5, 25, 0, 0); ctx.restore(); }),
    ],
    cols: ['#E8963A', '#FFD68C', '#FFFFFF', '#B8541C'],
    onBreak(e) { enrage(e, 1.15, .8); },
    bare(e, a) { // caramel left running down the raw goo
      const { w, h, lean } = slimeDims(e, a), t = a.t || 0;
      ctx.fillStyle = C('#D8862E');
      for (const [u, L] of [[-.75, 7], [-.3, 4], [.55, 6], [.85, 3]]) { const x = u * w + lean * .5, y = -h * (.85 - Math.abs(u) * .45), l = L + Math.sin(t * 2 + u * 5) * 1.2;
        ctx.beginPath(); ctx.moveTo(x - 1.6, y); ctx.quadraticCurveTo(x - 1.4, y + l, x, y + l + 1.4); ctx.quadraticCurveTo(x + 1.4, y + l, x + 1.6, y); ctx.closePath(); ctx.fill(); outline(.8); }
      if (DET()) { ctx.fillStyle = 'rgba(255,230,170,.8)'; for (const u of [-.75, .55]) { circle(u * w + lean * .5 + .5, -h * (.85 - Math.abs(u) * .45) + 2, .6); ctx.fill(); } }
      glow(-w * .1 + lean, -h, 10, '255,120,140', .3 + (a.wind || 0) * .3);
    },
  });

  // ======================= THORNBOAR: plates of bark =======================
  // Slabs of thick old bark grown over its back and a bark mask on its brow, bristling with thorns. Torn away, the hide
  // underneath is raw and the thorns of its mane come up long and red: it charges sooner and harder.
  const boarFrame = (a) => { const wind = a.wind || 0, lunge = wind ? -4 * wind : a.atk ? 6 : 0;
    ctx.translate(lunge, 0); if (wind) { ctx.translate(-14, 0); ctx.rotate(-.05 * wind); ctx.translate(14, 0); } };
  const boarHead = (a) => { const wind = a.wind || 0, ph = a.walk || 0, hr = .2 * wind + (a.atk ? .18 : 0) + Math.sin(ph * 2) * .03;
    ctx.translate(13, -22); ctx.rotate(hr); ctx.translate(-13, 22); };
  const BARK = '#6E5640', BARK2 = '#5A4634';
  const barkTex = (x0, y0, x1, y1) => () => { // the grain of the bark: long furrows and pale lichen
    ctx.strokeStyle = 'rgba(40,26,18,.6)'; ctx.lineWidth = .9; ctx.beginPath();
    for (let i = 0; i < 6; i++) { const x = x0 + (x1 - x0) * (i + .5) / 6; ctx.moveTo(x - 1, y0); ctx.quadraticCurveTo(x + 1.5, (y0 + y1) / 2, x - .5, y1); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(170,190,130,.55)'; for (let i = 0; i < 3; i++) { ell(x0 + (x1 - x0) * H(i + x0), y0 + (y1 - y0) * H(i * 3 + y0), 1.6, 1, .3); ctx.fill(); }
  };
  const boarSlabs = [
    { p: poly([-23, -17, -25, -24, -20, -30, -11, -32, -7, -27, -8, -19, -14, -16]), c: BARK2, b: [-25, -32, 18, 16] },
    { p: poly([-11, -31, -4, -35.5, 4, -38.5, 10, -37, 11, -29, 7, -21, -6, -20, -8, -27]), c: BARK, b: [-11, -38, 22, 18] },
    { p: poly([8, -36.5, 15, -36, 20.5, -31, 22, -24, 18, -18, 9, -20, 11, -29]), c: shade(BARK, .08), b: [8, -36, 14, 18] },
  ];
  function boarBack(k) {
    boarSlabs.forEach((s, i) => cel(s.p, s.c, { d: 2.6, r: 1, w: 1.6, lite: '#9A8268', tex: barkTex(s.b[0], s.b[1], s.b[0] + s.b[2], s.b[1] + s.b[3]), k, seed: i * 9 + 2, box: s.b }));
    [[-17, -30, -2.1, 8], [-6, -34, -1.85, 10], [4, -38, -1.6, 9], [14, -35.5, -1.2, 7]].forEach(([x, y, an, L]) => thorn(x, y, an, L, 2.2, '#4E6A34', .4));
  }
  function boarMask(k) {
    const m = poly([10, -30.5, 14.5, -34.5, 21.5, -33, 27.5, -28.5, 29.5, -25.5, 25, -26.4, 19, -27.2, 15, -25, 11, -24]);
    cel(m, BARK, { d: 1.8, r: .8, w: 1.4, lite: '#9A8268', tex: barkTex(11, -34, 29, -24), k, seed: 13, box: [11, -35, 18, 11] });
    thorn(15, -33.6, -1.9, 7, 1.8, '#4E6A34', -.5); thorn(20, -32.6, -1.3, 6, 1.6, '#5E7A3E', -.4);
  }
  reg('boar', {
    draw(e, a) { const k = wear(e); ctx.save(); boarFrame(a); boarBack(k); boarHead(a); boarMask(k); ctx.restore(); },
    pieces: [bit(-15, -24, () => cel(boarSlabs[0].p, boarSlabs[0].c, { w: 1.6 })), bit(0, -29, () => cel(boarSlabs[1].p, boarSlabs[1].c, { w: 1.6 })),
      bit(15, -28, () => cel(boarSlabs[2].p, boarSlabs[2].c, { w: 1.6 })), bit(20, -29, () => boarMask(0))],
    cols: ['#6E5640', '#9A8268', '#4E6A34', '#2E2018'],
    onBreak(e) { enrage(e, 1.2, .8); },
    bare(e, a) { // the raw hide: long red thorns standing up along the spine, and its eye burning
      ctx.save(); boarFrame(a);
      const wind = a.wind || 0, t = a.t || 0;
      [[-15, -28, -2.2, 9], [-8, -31.5, -1.95, 12], [0, -34.5, -1.75, 13], [7, -35.5, -1.5, 11], [13, -33, -1.25, 8]].forEach(([x, y, an, L], i) => thorn(x, y, an + Math.sin(t * 3 + i) * .04, L * (1 + wind * .15), 2.3, i % 2 ? '#A8303A' : '#C8404A', .45));
      if (DET()) { ctx.strokeStyle = 'rgba(200,60,60,.6)'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(-14, -24); ctx.lineTo(-8, -22); ctx.moveTo(-2, -27); ctx.lineTo(4, -25); ctx.moveTo(8, -29); ctx.lineTo(12, -26); ctx.stroke(); } // weals where the bark tore off
      boarHead(a); glow(22.4, -24.6, 7, '255,70,40', .5 + wind * .3);
      if (DET()) for (let i = 0; i < 2; i++) { const q = (t * 1.6 + i * .5) % 1; ctx.fillStyle = `rgba(240,236,228,${.5 * (1 - q)})`; circle(35 + q * 5, -16 + q * 3, 1 + q * 2.4); ctx.fill(); } // snorting steam
      ctx.restore();
    },
  });

  // ======================= CLOUD RAM: brass barding =======================
  // A skyport mount's barding: a brass chanfron down its face and a riveted saddle-plate over the wool. Shed, the wool
  // underneath has gathered a thunderhead: dark and crackling with lightning, and it charges faster.
  function ramSaddle(k) {
    const s = P('M', -15, -30, 'Q', -3, -40, 11, -33, 'L', 12, -28, 'Q', -2, -33, -14, -25, 'Z');
    cel(P('M', -16, -29, 'Q', -3, -39, 12, -32, 'L', 13, -22, 'Q', 0, -26, -15, -19, 'Z'), '#8A2E3A', { d: 2, r: .8, w: 1.3, tex: () => { ctx.strokeStyle = '#E8C060'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-15, -20.5); ctx.quadraticCurveTo(0, -27.6, 12.6, -23.5); ctx.stroke(); } }); // the cloth
    cel(s, '#C8964C', { d: 2.4, r: 1, w: 1.5, lite: '#F4D890', k, seed: 21, box: [-15, -40, 27, 14], tex: () => { ctx.fillStyle = 'rgba(255,250,220,.6)'; ell(2, -35.6, 5, 1, -.1); ctx.fill(); } });
    for (const [x, y] of [[-11, -29], [-5, -33], [2, -35], [8, -33.6]]) rivet(x, y, '#C8964C', .8);
  }
  function ramChanfron(k) {
    const c = poly([16, -31.5, 21, -32.5, 26, -28, 32.5, -20.5, 33, -17.5, 30, -18.5, 25, -22, 21, -27, 16.5, -28]);
    cel(c, '#C8964C', { d: 1.6, r: .8, w: 1.3, lite: '#F4D890', k, seed: 31, box: [16, -33, 17, 16] });
    rivet(19, -30, '#C8964C', .7); rivet(28, -22, '#C8964C', .7);
    thorn(19.5, -31.8, -1.7, 5, 1.6, '#E8C060', .2); // a brass spike between the horns
  }
  reg('cloudram', {
    draw(e, a) { const k = wear(e); ctx.save(); boarFrame(Object.assign({}, a, {})); ramSaddle(k);
      const wind = a.wind || 0, ph = a.walk || 0, hr = .3 * wind + (a.atk ? .18 : 0) + Math.sin(ph * 2) * .03;
      ctx.translate(13, -22); ctx.rotate(hr); ctx.translate(-13, 22); ramChanfron(k); ctx.restore(); },
    pieces: [bit(-2, -31, () => ramSaddle(0)), bit(24, -25, () => ramChanfron(0))],
    cols: ['#C8964C', '#F4D890', '#8A2E3A', '#FFFFFF'],
    onBreak(e) { enrage(e, 1.2, .8); },
    bare(e, a) { // a thunderhead in the wool
      ctx.save(); boarFrame(a);
      const t = a.t || 0, wind = a.wind || 0;
      for (const [x, y, r] of [[-12, -31, 6], [-2, -34.5, 6.5], [8, -32, 5.5], [-18, -25, 4.5]]) { ctx.fillStyle = C('#6E6680'); circle(x, y, r); ctx.fill(); }
      if (DET()) { ctx.fillStyle = '#8E86A2'; for (const [x, y, r] of [[-11, -33, 3.6], [-1, -36.5, 4], [9, -34, 3.2]]) { circle(x, y, r); ctx.fill(); } }
      ctx.beginPath(); for (const [x, y, r] of [[-12, -31, 6], [-2, -34.5, 6.5], [8, -32, 5.5], [-18, -25, 4.5]]) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI, true); } outline(1.2);
      const fl = Math.floor(t * 9) % 3;
      if (DET()) {
        ctx.strokeStyle = 'rgba(200,240,255,.95)'; ctx.lineWidth = 1.1; ctx.lineJoin = 'miter'; ctx.beginPath();
        const bolts = [[-14, -28, -16, -22, -13, -20, -15, -14], [-1, -31, 1, -25, -2, -22, 0, -17], [9, -29, 7, -24, 10, -21, 8, -16]];
        const b = bolts[fl]; ctx.moveTo(b[0], b[1]); for (let i = 2; i < b.length; i += 2) ctx.lineTo(b[i], b[i + 1]); ctx.stroke();
        glow(b[0], b[1] + 6, 10, '170,220,255', .4 + wind * .3);
      }
      ctx.restore();
    },
  });

  // ======================= MOSSLING GOLEM: a shell of old masonry and an idol's mask =======================
  // Dressed stones from some fallen shrine, carried on its back and bound there with roots, and a carved idol's face over
  // its own. Broken off, the rock splits along every crack: it was molten inside all along, and it hurries now.
  const golemFrame = (a) => { const ph = a.walk || 0, wind = a.wind || 0, atk = !!a.atk;
    ctx.translate(atk ? 3 : -wind * 3, Math.abs(Math.sin(ph)) * 1.2 - wind * 2 + (atk ? 2 : 0)); };
  const STONE = '#A89C84';
  const golemBlocks = [
    { p: poly([-24.5, -43, -26.5, -53, -22, -61, -14, -61.5, -12.5, -49, -17, -42]), b: [-26, -62, 14, 20] },
    { p: poly([-19, -62.5, -12, -69, -1, -70, 1.5, -61, -11.5, -59.5]), b: [-19, -70, 20, 10] },
    { p: poly([-24, -41, -16, -40, -13, -31, -19.5, -28]), b: [-24, -41, 11, 13] },
  ];
  function golemShell(k) {
    golemBlocks.forEach((g, i) => cel(g.p, i === 1 ? shade(STONE, .06) : STONE, { d: 3, r: 1.2, w: 1.8, lite: '#DCD2BC', k, seed: 40 + i * 7, box: g.b,
      tex: () => { ctx.fillStyle = 'rgba(90,120,60,.5)'; ell(g.b[0] + g.b[2] * .3, g.b[1] + 2, 4, 1.6, .2); ctx.fill(); } }));
    ctx.strokeStyle = C('#5A4A3A'); ctx.lineWidth = 1.1; ctx.beginPath(); // a carved spiral rune on the big block
    for (let i = 0; i <= 18; i++) { const th = i * .55, r = .4 + i * .22, x = -19 + Math.cos(th) * r, y = -52 + Math.sin(th) * r; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.stroke();
    ctx.lineCap = 'round'; // roots binding the stones on
    for (const [pts, w] of [[[-26, -46, -20, -52, -13, -60, -4, -66], 2.6], [[-25, -36, -18, -38, -12, -45], 2.2]]) {
      ctx.strokeStyle = C(OUT); ctx.lineWidth = w + 1.8; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); ctx.bezierCurveTo(pts[2], pts[3], pts[4], pts[5], pts[6] || pts[4], pts[7] || pts[5]); ctx.stroke();
      ctx.strokeStyle = C('#6A5236'); ctx.lineWidth = w; ctx.stroke();
    }
  }
  function golemMask(k, hb) {
    const m = poly([16, -71.5 + hb, 25.5, -70 + hb, 31.5, -62.5 + hb, 31, -55 + hb, 27.5, -50.5 + hb, 19, -50 + hb, 15.5, -57 + hb, 17.5, -64 + hb]);
    cel(m, '#C2B49A', { d: 2, r: 1, w: 1.6, lite: '#F0E6D0', k, seed: 51, box: [16, -71 + hb, 15, 20], tex: () => {
      ctx.strokeStyle = 'rgba(90,70,50,.7)'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(19, -66.5 + hb); ctx.lineTo(29.5, -66 + hb); ctx.moveTo(23, -70 + hb); ctx.lineTo(23.5, -66.5 + hb); ctx.stroke(); } });
    ctx.fillStyle = C(OUT); ctx.beginPath(); ctx.moveTo(20, -62.6 + hb); ctx.lineTo(28.5, -63.4 + hb); ctx.lineTo(27.6, -59.4 + hb); ctx.lineTo(21, -59.6 + hb); ctx.closePath(); ctx.fill(); // the eye-slot
    ctx.fillStyle = C('#FFD27A'); ctx.fillRect(22, -61.8 + hb, 5, 1.4);
    ctx.fillStyle = C(OUT); ctx.beginPath(); ctx.moveTo(20.5, -55 + hb); ctx.quadraticCurveTo(24.5, -57 + hb, 28.5, -54.5 + hb); ctx.lineTo(28, -53.4 + hb); ctx.quadraticCurveTo(24.5, -55.4 + hb, 21, -53.8 + hb); ctx.closePath(); ctx.fill(); // a carved scowl
  }
  reg('golem', {
    draw(e, a) { const k = wear(e); ctx.save(); golemFrame(a); golemShell(k); golemMask(k, (a.wind || 0) * 1.5); ctx.restore(); },
    pieces: [bit(-19, -52, () => cel(golemBlocks[0].p, STONE, { w: 1.8 })), bit(-9, -65, () => cel(golemBlocks[1].p, STONE, { w: 1.8 })),
      bit(-18, -35, () => cel(golemBlocks[2].p, STONE, { w: 1.8 })), bit(24, -61, () => golemMask(0, 0))],
    cols: ['#A89C84', '#DCD2BC', '#6A5236', '#FFB050'],
    onBreak(e) { enrage(e, 1.15, .85); },
    bare(e, a) { // embers rising off the molten rock
      if (!DET()) return; const t = a.t || 0;
      ctx.save(); golemFrame(a); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) { const q = (t * .7 + i / 5) % 1; ctx.fillStyle = `rgba(255,${150 + i * 15},70,${.8 * (1 - q)})`; circle(-14 + i * 6 + Math.sin(q * 6 + i) * 3, -60 - q * 26, 1.1 - q * .5); ctx.fill(); }
      ctx.restore();
    },
  });

  // ======================= PRISM CONSTRUCT: an unopened geode =======================
  // Its crystal is wrapped in a geode's dull rind; break the rind and the crystal inside blazes, and grows.
  const RIND = '#8C7E72';
  const rindLump = (cx, cy, rx, ry, n, seed) => (ox, oy) => {
    for (let i = 0; i <= n; i++) { const th = i / n * TAU, j = 1 + (H(i + seed) - .5) * .25, x = cx + ox + Math.cos(th) * rx * j, y = cy + oy + Math.sin(th) * ry * j; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.closePath(); };
  const rindTex = (cx, cy, rx, ry) => () => { ctx.fillStyle = 'rgba(60,50,46,.5)'; for (let i = 0; i < 9; i++) { circle(cx + (H(i + cx) - .5) * rx * 1.6, cy + (H(i * 3 + cy) - .5) * ry * 1.6, .6 + H(i) * .9); ctx.fill(); } };
  const cgParts = [[-12, -66, 13, 10, 11, 3], [-22, -53, 6, 6, 8, 9], [17, -72, 6, 4.5, 8, 5], [3, -60, 7, 5, 8, 7]];
  function cgRind(k, hb, only) {
    cgParts.forEach(([cx, cy, rx, ry, n, sd], i) => { if (only !== undefined && only !== i) return; const y = i === 2 ? cy + hb : cy;
      cel(rindLump(cx, y, rx, ry, n, sd), RIND, { d: 2.6, r: 1, w: 1.6, lite: '#B8AC9C', tex: rindTex(cx, y, rx, ry), k, seed: 60 + i, box: [cx - rx, y - ry, rx * 2, ry * 2] });
      if (DET() && k > .3) glow(cx, y, rx, '160,236,255', k * .35); }); // light leaking from inside as it cracks
  }
  reg('cgolem', {
    draw(e, a) { ctx.save(); golemFrame(a); cgRind(wear(e), (a.wind || 0) * 1.5); ctx.restore(); },
    pieces: cgParts.map((p, i) => bit(p[0], p[1], () => cgRind(0, 0, i))),
    cols: ['#8C7E72', '#B8AC9C', '#9FE0F0', '#D4A0EC'],
    onBreak(e) { enrage(e, 1.15, .85); },
    bare(e, a) { // the opened geode: the crystal grown out wild and blazing
      const t = a.t || 0, wind = a.wind || 0;
      ctx.save(); golemFrame(a);
      glow(-10, -60, 26, '160,236,255', .3 + .1 * Math.sin(t * 4) + wind * .2);
      shard(-20, -58, 12, -2.6, 4, ROSE); shard(-15, -64, 17, -2.05, 5, ICE); shard(-6, -67, 13, -1.5, 4, ROSE); shard(-24, -48, 9, -2.9, 3.4, ICE);
      ctx.restore();
    },
  });

  // ======================= COG SPIDER: a riveted dome and a horned helm =======================
  // An iron bell-dome bolted over its boiler and a horned helm over its lenses. Ripped off, the boiler's lid goes too:
  // its gears whirl in the open, throwing sparks, and it scuttles faster.
  const spiderFrame = (a) => { const w = a.wind || 0, bodyY = -19 + w * 3 + (a.atk ? -2 : 0), rear = a.atk ? .12 : -.22 * w;
    ctx.translate(a.atk ? 5 : -w * 2, 0); ctx.translate(2, bodyY); ctx.rotate(rear); ctx.translate(-2, -bodyY); return bodyY; };
  const IRON = '#5E6474';
  function spiderDome(k, by) {
    const ax = -9, ay = by - 1;
    const d = P('M', ax - 15, ay + 2.4, 'C', ax - 15, ay - 12, ax - 6, ay - 15.5, ax + 1, ay - 15, 'C', ax + 9, ay - 14.5, ax + 14.5, ay - 8, ax + 14.6, ay + .4, 'Q', ax, ay - 2.6, ax - 15, ay + 2.4, 'Z');
    cel(d, IRON, { d: 3, r: 1.2, w: 1.6, lite: '#A8B0C0', k, seed: 71, box: [ax - 14, ay - 15, 28, 14], tex: () => {
      ctx.strokeStyle = 'rgba(30,30,40,.6)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(ax - 5, ay - 14); ctx.quadraticCurveTo(ax - 8, ay - 6, ax - 7, ay); ctx.moveTo(ax + 5, ay - 14); ctx.quadraticCurveTo(ax + 7, ay - 6, ax + 6, ay - 1); ctx.stroke(); } });
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(ax - 15, ay + 2.4); ctx.quadraticCurveTo(ax, ay - 2.6, ax + 14.6, ay + .4); ctx.stroke();
    ctx.strokeStyle = C('#C99B55'); ctx.lineWidth = 1.8; ctx.stroke(); // the brass rim
    for (const u of [-11, -4, 3, 10]) rivet(ax + u, ay + .6 - (1 - Math.pow(u / 14, 2)) * 2.2, '#C99B55', .7);
    thorn(ax, ay - 14.6, -1.75, 6, 2, '#7A8292', .1); // the spike on its crown
  }
  function spiderHelm(k, by) {
    const hx = 7, hy = by;
    const m = poly([hx - 7.5, hy - 5.5, hx + 1, hy - 11.6, hx + 9, hy - 8, hx + 12.5, hy - 3.6, hx + 6, hy - 4.6, hx + 2, hy - 3, hx - 5, hy - 1.4]);
    cel(m, IRON, { d: 1.6, r: .8, w: 1.4, lite: '#A8B0C0', k, seed: 77, box: [hx - 7, hy - 11, 19, 9] });
    thorn(hx - 1, hy - 10, -2.4, 7, 1.6, '#C99B55', -.6); thorn(hx + 3, hy - 10.4, -1.9, 6, 1.4, '#C99B55', -.5);
    rivet(hx - 3, hy - 5, IRON, .7);
  }
  function gearAt(x, y, r, n, rot, col) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) { const a0 = rot + i / (n * 2) * TAU, a1 = rot + (i + 1) / (n * 2) * TAU, rr = i % 2 ? r * .76 : r;
      if (i === 0) ctx.moveTo(x + Math.cos(a0) * rr, y + Math.sin(a0) * rr); else ctx.lineTo(x + Math.cos(a0) * rr, y + Math.sin(a0) * rr); ctx.lineTo(x + Math.cos(a1) * rr, y + Math.sin(a1) * rr); }
    ctx.closePath(); ctx.fillStyle = C(col); ctx.fill(); outline(.9);
    ctx.fillStyle = C(shade(col, -.5)); circle(x, y, r * .3); ctx.fill();
  }
  function sparks(x, y, t, n, rgb) {
    if (!DET()) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) { const q = (t * 2.2 + i / n) % 1, an = -Math.PI / 2 + (H(i * 5 + Math.floor(t * 2.2 + i / n)) - .5) * 2.4, r = 3 + q * 12;
      ctx.strokeStyle = `rgba(${rgb},${1 - q})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + Math.cos(an) * r, y + Math.sin(an) * r + q * q * 8); ctx.lineTo(x + Math.cos(an) * (r + 2.4), y + Math.sin(an) * (r + 2.4) + q * q * 8); ctx.stroke(); }
    ctx.restore();
  }
  reg('spider', {
    draw(e, a) { const k = wear(e); ctx.save(); const by = spiderFrame(a); spiderDome(k, by); spiderHelm(k, by); ctx.restore(); },
    pieces: [bit(-9, -28, () => spiderDome(0, -19)), bit(9, -25, () => spiderHelm(0, -19))],
    cols: ['#5E6474', '#A8B0C0', '#C99B55', '#FFFFFF'],
    onBreak(e) { enrage(e, 1.2, .8); },
    bare(e, a) { // the boiler torn open: its gears whirl in the open
      const t = a.t || 0, w = a.wind || 0; ctx.save(); const by = spiderFrame(a), ax = -9, ay = by - 1;
      const hole = poly([ax - 9, ay - 6, ax - 6, ay - 10.5, ax - 2, ay - 9, ax + 1, ay - 11.5, ax + 5, ay - 9.6, ax + 8.6, ay - 6, ax + 4, ay - 4.6, ax - 3, ay - 3.4]);
      ctx.beginPath(); hole(0, 0); ctx.fillStyle = C('#1E1418'); ctx.fill();
      ctx.save(); ctx.beginPath(); hole(0, 0); ctx.clip();
      gearAt(ax - 4, ay - 5, 4.4, 8, t * 5, '#D8AA55'); gearAt(ax + 3, ay - 7.5, 3.4, 7, -t * 6.5, '#9AA2B4'); gearAt(ax + 7, ay - 3.5, 2.6, 6, t * 8, '#C99B55');
      ctx.restore();
      ctx.beginPath(); hole(0, 0); outline(1.3);
      glow(ax, ay - 7, 9, '255,180,90', .35 + w * .3);
      sparks(ax, ay - 9, t, 4, '255,220,140');
      ctx.restore();
    },
  });

  // ======================= KETTLE TANK: a turret cowl and a ram =======================
  // A domed turret-cowl of riveted plate over the boiler and a spiked ram over the treads. Without them the boiler runs
  // hot and open: red patches glowing through the brass, steam shrieking from the seams, and it fires sooner.
  const tankFrame = (a) => { const w = a.wind || 0, t = a.t || 0; ctx.translate(w > .6 ? Math.sin(t * 90) * .6 * w : 0, a.atk ? -1 : 0); };
  const PLATE = '#6A7282';
  function tankCowl(k) {
    const c = poly([-27.5, -37, -27, -47, -21, -54, -10, -57.5, 2, -57, 9.5, -52, 10.5, -44, 6, -41, -27.5, -36]);
    cel(c, PLATE, { d: 3.4, r: 1.3, w: 2, lite: '#B4BCCA', k, seed: 81, box: [-27, -57, 37, 20], tex: () => {
      ctx.strokeStyle = 'rgba(30,30,40,.55)'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(-26, -45); ctx.quadraticCurveTo(-8, -49, 9.6, -46); ctx.moveTo(-12, -57); ctx.lineTo(-14, -38); ctx.stroke();
      ctx.fillStyle = 'rgba(255,250,235,.4)'; ell(2, -54, 5, 1.2, .3); ctx.fill(); } });
    ctx.fillStyle = C('#140E10'); ctx.fillRect(-1, -50.4, 9.5, 2); // the vision slit
    if (DET()) { ctx.fillStyle = 'rgba(255,170,80,.9)'; ctx.fillRect(4, -50, 3.6, 1.2); }
    for (const [x, y] of [[-24, -40], [-18, -39.4], [-10, -39], [-2, -39.6], [5, -41.6], [-24, -48], [-16, -53], [-4, -55.4], [6, -52]]) rivet(x, y, PLATE, .8);
  }
  function tankRam(k) {
    const r = poly([25, -21, 33, -17, 37, -9, 33.5, -1, 27, -2, 28.5, -12]);
    cel(r, PLATE, { d: 2, r: 1, w: 1.6, lite: '#B4BCCA', k, seed: 89, box: [25, -21, 12, 20] });
    thorn(34.5, -15, -.2, 6, 1.8, '#9AA2B4', 0); thorn(36, -7, .05, 6, 1.8, '#9AA2B4', 0);
    rivet(29.5, -15, PLATE, .8); rivet(30, -6, PLATE, .8);
  }
  reg('tank', {
    draw(e, a) { const k = wear(e); ctx.save(); tankFrame(a); tankCowl(k); tankRam(k); ctx.restore(); },
    pieces: [bit(-10, -47, () => tankCowl(0)), bit(31, -11, () => tankRam(0))],
    cols: ['#6A7282', '#B4BCCA', '#3A3236', '#FFB04A'],
    onBreak(e) { enrage(e, 1, .78); },
    bare(e, a) { // the boiler running hot
      const t = a.t || 0, w = a.wind || 0; ctx.save(); tankFrame(a);
      if (DET()) { ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const [x, y, r] of [[-18, -40, 7], [-6, -30, 5], [-21, -24, 4.5]]) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(255,90,40,${.55 + .15 * Math.sin(t * 6 + x)})`); g.addColorStop(1, 'rgba(255,60,20,0)'); ctx.fillStyle = g; circle(x, y, r); ctx.fill(); }
        ctx.restore();
        for (const [x, y, dir] of [[-26, -33, -1], [-14, -48, -.2]]) for (let i = 0; i < 3; i++) { const q = (t * 2.4 + i / 3) % 1; ctx.fillStyle = `rgba(245,240,235,${.65 * (1 - q)})`; circle(x + dir * q * 14, y - q * 10 - (dir > -.5 ? q * 6 : 0), 1.2 + q * 3.4); ctx.fill(); } }
      ctx.strokeStyle = C('#E83A2A'); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(-9.4, -40.4); ctx.lineTo(-9.4 + Math.cos(.5 + Math.sin(t * 30) * .1) * 2.8, -40.4 + Math.sin(.5) * 2.8); ctx.stroke(); // the gauge pinned in the red
      glow(-9.4, -40.4, 6, '255,60,40', .4 + w * .3);
      ctx.restore();
    },
  });

  // ======================= BRASS AUTOMATON: a great helm and a heraldic breastplate =======================
  // A bucket great-helm with a red crest and an enamelled breastplate over its furnace. With them gone its faceplate goes
  // too: under it is bare clockwork and one great red lens, and its furnace shows through the chest.
  function knightHelm(k, hy, crest) {
    if (crest) { cel(P('M', -6, hy - 11.6, 'C', -10, hy - 22, 2, hy - 23, 8, hy - 17, 'Q', 2, hy - 18, -2, hy - 11.6, 'Z'), '#B8303A', { d: 1.6, r: .8, w: 1.2, lite: '#E86A60',
      tex: () => { strokes([-4, hy - 13, -4, hy - 20, -1, hy - 13, 0, hy - 21, 2, hy - 14, 3.6, hy - 19.6], 'rgba(90,10,20,.5)', .7); } }); }
    const h = poly([-9.4, hy + 7.6, -9.8, hy - 6, -7.6, hy - 11.6, 1, hy - 13, 9.6, hy - 11.4, 12, hy - 5, 12.4, hy + 7.4, 1, hy + 8.4]);
    cel(h, '#B8BEC8', { d: 2.6, r: 1.1, w: 1.6, lite: '#F0F4F8', k, seed: 91, box: [-9, hy - 13, 21, 21], tex: () => {
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(9, hy - 10, 1.4, 14); } });
    ctx.fillStyle = C('#140E10'); ctx.fillRect(1, hy - 4, 11.4, 2.2); ctx.fillRect(6.6, hy - 4, 2, 9); // the cross of the visor
    if (DET()) { ctx.fillStyle = 'rgba(159,240,232,.9)'; ctx.fillRect(2.6, hy - 3.4, 8, 1); }
    ctx.fillStyle = C('#C99B55'); ctx.fillRect(-9.6, hy - 7.6, 21.8, 1.8); // a brass band
    for (const x of [-7, -2, 3]) rivet(x, hy + 3, '#B8BEC8', .7);
  }
  function knightPlate(k, SHO, HIP) {
    const p = P('M', -10.6, SHO + 1, 'Q', 0, SHO - 3, 11.6, SHO + .6, 'L', 11.8, SHO + 12, 'Q', 9.6, HIP - 6, 1, HIP - 5, 'Q', -8, HIP - 6, -10.4, SHO + 12, 'Z');
    cel(p, '#3E8A84', { d: 3, r: 1.1, w: 1.6, lite: '#8ADAD0', k, seed: 97, box: [-10, SHO - 2, 22, 22], tex: () => {
      ctx.strokeStyle = '#E8C060'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-10, SHO + 1.6); ctx.quadraticCurveTo(0, SHO - 2.2, 11.4, SHO + 1.2); ctx.stroke(); } });
    gearAt(1, SHO + 9, 4.4, 8, .2, '#D8AA55'); // the cog of its house
  }
  reg('knight', {
    mid(e, a, f) { const k = wear(e); knightPlate(k, f.SHO, f.HIP); ctx.save(); f.head(); knightHelm(k, f.hy, true); ctx.restore(); },
    pieces: [bit(1, -60, () => knightHelm(0, -61, true)), bit(0, -38, () => knightPlate(0, -49, -30))],
    cols: ['#B8BEC8', '#3E8A84', '#B8303A', '#E8C060'],
    onBreak(e) { enrage(e, 1.15, .8); },
    bareMid(e, a, f) { // the faceplate torn away: clockwork, and one red lens
      const hy = f.hy, t = a.t || 0; ctx.save(); f.head();
      const hole = poly([.6, hy - 8.6, 6, hy - 9.4, 10.6, hy - 7, 11.4, hy - 1, 10, hy + 5.6, 4, hy + 6.4, 1.8, hy + 1]);
      ctx.beginPath(); hole(0, 0); ctx.fillStyle = C('#1A1214'); ctx.fill();
      ctx.save(); ctx.beginPath(); hole(0, 0); ctx.clip(); gearAt(3.6, hy + 3, 3.4, 7, t * 3, '#D8AA55'); gearAt(9, hy + 4, 2.4, 6, -t * 4, '#9AA2B4'); ctx.restore();
      ctx.beginPath(); hole(0, 0); outline(1.2);
      ctx.fillStyle = C('#3A3440'); circle(7, hy - 3.6, 3.4); ctx.fill(); outline(1);
      ctx.fillStyle = C('#FF4A3A'); circle(7.3, hy - 3.6, 2.2); ctx.fill();
      if (DET()) { ctx.fillStyle = '#FFE0C0'; circle(8, hy - 4.3, .7); ctx.fill(); }
      glow(7, hy - 3.6, 9, '255,70,50', .55);
      ctx.restore();
      sparks(4, f.SHO - 2, t, 3, '255,200,120');
    },
  });

  // ======================= MOSS SENTINEL: a hollow-log helm and a cage of roots =======================
  // Grown over: a hollow stump for a helm, a bark shield-plate over its chest, roots woven round it. Torn free, its
  // chest-hatch has burst into flower round a glowing seed, and its visor burns red.
  function sentHelm(k, hy) {
    const h = poly([-9.6, hy + 6, -10.6, hy - 9, -6, hy - 13.6, 3, hy - 14.4, 10.6, hy - 12, 12.6, hy - 4, 12, hy + 6.4, 2, hy + 7.4]);
    cel(h, '#6E5A42', { d: 2.6, r: 1, w: 1.6, lite: '#A08868', tex: barkTex(-9, hy - 14, 12, hy + 7), k, seed: 101, box: [-9, hy - 14, 21, 21] });
    cel(P('E', 1, hy - 13.4, 9.6, 2.6, 0), '#C8A878', { d: 1, r: .6, w: 1.2, tex: () => { ctx.strokeStyle = 'rgba(110,80,50,.7)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.ellipse(1, hy - 13.4, 6, 1.5, 0, 0, TAU); ctx.ellipse(1, hy - 13.4, 3, .8, 0, 0, TAU); ctx.stroke(); } }); // the cut rings of the stump
    ctx.fillStyle = C('#1A1214'); ctx.fillRect(1.4, hy - 4.6, 10.6, 2.4); // the eye-gap
    if (DET()) { ctx.fillStyle = 'rgba(255,210,122,.9)'; ctx.fillRect(3, hy - 4, 7.6, 1.2); }
    cel(P('M', -6, hy - 15, 'Q', -6.4, hy - 19, -3, hy - 19.6, 'Q', 0, hy - 19, -.6, hy - 15, 'Z'), '#C84A3A', { d: .8, r: .5, w: 1, tex: () => { ctx.fillStyle = '#FFF0D8'; circle(-4.4, hy - 18, .7); ctx.fill(); circle(-2, hy - 17.4, .5); ctx.fill(); } }); // a toadstool
    ctx.fillStyle = C('#4E7A3E'); ell(6, hy - 14.6, 4, 1.4); ctx.fill(); outline(.8);
  }
  function sentChest(k, SHO, HIP) {
    const p = P('M', -10.4, SHO + .6, 'Q', 0, SHO - 3.4, 11.4, SHO + .6, 'L', 11, SHO + 13, 'Q', 6, HIP - 5, 0, HIP - 4, 'Q', -6, HIP - 5, -10, SHO + 13, 'Z');
    cel(p, '#7A6248', { d: 3, r: 1, w: 1.6, lite: '#A88E6C', tex: barkTex(-10, SHO - 2, 11, HIP - 4), k, seed: 107, box: [-10, SHO - 2, 21, 20] });
    ctx.lineCap = 'round';
    for (const [x0, y0, x1, y1] of [[-11, SHO + 4, 12, SHO + 13], [-11, SHO + 14, 11, SHO + 3]]) {
      ctx.strokeStyle = C(OUT); ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 3, x1, y1); ctx.stroke();
      ctx.strokeStyle = C('#5E4A30'); ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.fillStyle = C('#6E9A4E'); ell(-6, SHO + 2, 3, 1.4, -.3); ctx.fill(); outline(.8); ell(8, HIP - 6, 2.6, 1.2, .3); ctx.fill(); outline(.8);
  }
  reg('sentinel', {
    mid(e, a, f) { const k = wear(e); sentChest(k, f.SHO, f.HIP); ctx.save(); f.head(); sentHelm(k, f.hy); ctx.restore(); },
    pieces: [bit(1, -61, () => sentHelm(0, -61)), bit(0, -40, () => sentChest(0, -49, -30))],
    cols: ['#6E5A42', '#A08868', '#4E7A3E', '#C84A3A'],
    onBreak(e) { enrage(e, 1.15, .8); },
    bareMid(e, a, f) { // a flower burst from the chest round a glowing seed; the visor turned red
      const t = a.t || 0, cx = -2.6, cy = f.SHO + 10.5, op = 1 + Math.sin(t * 2) * .06;
      glow(cx, cy, 14, '255,190,90', .4);
      for (let i = 0; i < 6; i++) { const an = i / 6 * TAU + .3; ctx.save(); ctx.translate(cx, cy); ctx.rotate(an); ctx.scale(op, op);
        cel(P('M', 0, -1.6, 'Q', 5, -4, 8.6, 0, 'Q', 5, 4, 0, 1.6, 'Z'), i % 2 ? '#E8A0B0' : '#F2C0C8', { d: 1, r: .6, w: 1 }); ctx.restore(); }
      ctx.fillStyle = C('#FFD27A'); circle(cx, cy, 2.8); ctx.fill(); outline(1);
      if (DET()) { ctx.fillStyle = '#FFFFFF'; circle(cx + .8, cy - .8, .9); ctx.fill(); }
      ctx.save(); f.head(); ctx.fillStyle = C('#FF5A3A'); ctx.fillRect(2, f.hy - 3.6, 8.4, 1.5); glow(7, f.hy - 3, 9, '255,80,50', .6); ctx.restore();
    },
  });

  // ======================= the humans: hats, masks and plate, and what was under them =======================
  // all drawn inside drawHumanoid's body frame (f: HIP, SHO, hy and head(), which turns and shrinks the head as it does)
  const studs = (pts, col) => { for (let i = 0; i < pts.length; i += 2) rivet(pts[i], pts[i + 1], col, .75); };
  function torsoPlate(SHO, HIP, col, lite, k, seed, tex) { // a cuirass or jerkin over the chest, in the body's own shape
    const p = P('M', -10.2, SHO + .4, 'Q', 0, SHO - 3.4, 11, SHO + .2, 'Q', 12, SHO + 9, 8.4, HIP - 3, 'Q', 0, HIP - 1, -8, HIP - 3, 'Q', -11.4, SHO + 9, -10.2, SHO + .4, 'Z');
    cel(p, col, { d: 3, r: 1.1, w: 1.5, lite, k, seed, box: [-10, SHO - 2, 21, 19], tex });
    return p;
  }
  // ---- BRIAR BANDIT: an iron kettle-hat and a studded jerkin; under them the briar has him
  function banditHat(k, hy) {
    cel(P('E', 0, hy - 10, 13, 3, -.06), '#6E7078', { d: 1.4, r: .7, w: 1.4, lite: '#B8BCC4', k, seed: 111, box: [-13, hy - 13, 26, 6] });
    cel(P('M', -8, hy - 10.6, 'Q', -8, hy - 20, 0, hy - 20.6, 'Q', 8, hy - 20, 8.6, hy - 10.6, 'Z'), '#7E8088', { d: 2.2, r: 1, w: 1.5, lite: '#C8CCD4', k, seed: 113, box: [-8, hy - 21, 17, 10],
      tex: () => { ctx.fillStyle = 'rgba(140,70,40,.45)'; ell(-4, hy - 13, 3, 1.4); ctx.fill(); ell(4, hy - 16, 2, 1); ctx.fill(); } }); // rust
    ctx.strokeStyle = C(shade('#6E7078', -.4)); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(-7.6, hy - 12.4); ctx.quadraticCurveTo(0, hy - 14, 8.2, hy - 12.4); ctx.stroke();
    ctx.fillStyle = C('#3A3C44'); ctx.beginPath(); ctx.moveTo(-5, hy - 18); ctx.lineTo(-1, hy - 17.6); ctx.lineTo(-2.4, hy - 15); ctx.closePath(); ctx.fill(); // a dent
  }
  function banditJerkin(k, f) {
    torsoPlate(f.SHO, f.HIP, '#7A5A3A', '#B08A60', k, 117, () => { ctx.strokeStyle = 'rgba(40,24,14,.6)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(1, f.SHO - 2); ctx.lineTo(1.4, f.HIP - 2); ctx.stroke(); });
    studs([-6, f.SHO + 4, -2, f.SHO + 3, 4, f.SHO + 3, 8, f.SHO + 5, -6, f.SHO + 10, 6, f.SHO + 10, -5, f.HIP - 6, 5, f.HIP - 6], '#C8B080');
  }
  function briars(f, t, sc = 1) { // thorny briars sprung out of his back and over his shoulders, round his head
    ctx.lineCap = 'round';
    const vines = [[-8, f.HIP + 2, -15, f.SHO + 4, -12, f.SHO - 10, -5, f.hy - 12], [-6, f.SHO + 6, -14, f.SHO - 2, -4, f.SHO - 8, 6, f.SHO - 4], [-9, f.SHO + 14, -18, f.SHO + 10, -20, f.SHO - 4, -15, f.hy - 4]];
    vines.forEach((v, i) => { const sw = Math.sin(t * 2 + i) * 1.2;
      ctx.strokeStyle = C(OUT); ctx.lineWidth = 3.6 * sc; ctx.beginPath(); ctx.moveTo(v[0], v[1]); ctx.bezierCurveTo(v[2] + sw, v[3], v[4] + sw, v[5], v[6] + sw, v[7]); ctx.stroke();
      ctx.strokeStyle = C(i === 1 ? '#5E8A3A' : '#4A7030'); ctx.lineWidth = 2 * sc; ctx.stroke();
      for (let q = 1; q <= 3; q++) { const u = q / 4, x = (1 - u) ** 3 * v[0] + 3 * (1 - u) ** 2 * u * (v[2] + sw) + 3 * (1 - u) * u * u * (v[4] + sw) + u ** 3 * (v[6] + sw), y = (1 - u) ** 3 * v[1] + 3 * (1 - u) ** 2 * u * v[3] + 3 * (1 - u) * u * u * v[5] + u ** 3 * v[7];
        thorn(x, y, -1.2 - q * .9 + i, 3.4, 1.1, '#C8C070', .2); }
      ctx.fillStyle = C('#E07A9A'); circle(v[6] + sw, v[7], 1.5); ctx.fill(); outline(.7); });
  }
  reg('bandit', {
    mid(e, a, f) { const k = wear(e); banditJerkin(k, f); ctx.save(); f.head(); banditHat(k, f.hy); ctx.restore(); },
    pieces: [bit(0, -77, () => { HUM.head(); banditHat(0, -61); }), bit(0, -40, () => banditJerkin(0, HUM))],
    cols: ['#7E8088', '#7A5A3A', '#C8B080', '#FFFFFF'],
    onBreak(e) { enrage(e, 1.15, .8); },
    bareMid(e, a, f) { const t = a.t || 0; briars(f, t);
      ctx.save(); f.head(); glow(6.7, f.hy - .6, 7, '150,255,110', .7); ctx.fillStyle = C('#C8FF8A'); ctx.fillRect(4.8, f.hy - 1.4, 3, 1.6); ctx.restore(); },
  });
  // ---- THORN ARCHER: a carved stag-mask and a mantle of leaves; under the mask a fey thing with antlers
  function stagMask(k, hy) {
    const m = poly([1, hy - 8, 6, hy - 9.4, 10.6, hy - 6, 11.6, hy + 1, 10.4, hy + 6.6, 7, hy + 8.4, 3, hy + 6, 1.4, hy]);
    cel(m, '#D8C8A0', { d: 1.8, r: .9, w: 1.4, lite: '#FFF6DA', k, seed: 121, box: [1, hy - 9, 11, 17], tex: () => {
      ctx.strokeStyle = 'rgba(110,80,50,.55)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(8, hy + 1); ctx.lineTo(11, hy + 1.6); ctx.moveTo(2, hy - 6); ctx.quadraticCurveTo(5, hy - 3, 4, hy + 3); ctx.stroke(); } });
    ctx.fillStyle = C('#1A1214'); ctx.beginPath(); ctx.moveTo(4.6, hy - 2.4); ctx.lineTo(9, hy - 2.6); ctx.lineTo(8, hy - .2); ctx.lineTo(5, hy - .4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C('#B83A3A'); ctx.fillRect(3, hy + 3, 7, 1.1); // a painted stripe
    for (const [x, d] of [[2.4, -1], [6, 1]]) { ctx.lineCap = 'round'; ctx.strokeStyle = C(OUT); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, hy - 8); ctx.quadraticCurveTo(x + d * 2, hy - 13, x + d * 1 - 2, hy - 15); ctx.stroke(); ctx.strokeStyle = C('#C8B488'); ctx.lineWidth = 1.6; ctx.stroke(); } // antler stubs
  }
  function leafMantle(k, f) {
    const S = f.SHO;
    for (let row = 0; row < 2; row++) for (let i = 0; i < 5; i++) { const x = -10 + i * 5 + row * 2.4, y = S - 2 + row * 4.6;
      cel(P('M', x - 3, y, 'Q', x, y - 1.4, x + 3, y, 'Q', x + 1.6, y + 5, x, y + 6.4, 'Q', -1.6 + x, y + 5, x - 3, y, 'Z'), (i + row) % 2 ? '#5E7A3E' : '#7A9A48', { d: 1.2, r: .6, w: 1, k, seed: 130 + i, box: [x - 3, y, 6, 6],
        tex: () => { ctx.strokeStyle = 'rgba(40,60,20,.6)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 5.6); ctx.stroke(); } }); }
  }
  function antlers(hy, t) {
    const g = .6 + .2 * Math.sin(t * 3);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const tines = [[-2, hy - 9, -6, hy - 18, -12, hy - 24], [-5, hy - 16, -1, hy - 22], [-8, hy - 20, -11, hy - 27], [1, hy - 10, 3, hy - 19, 0, hy - 26], [2.4, hy - 17, 7, hy - 22]];
    for (const [w, col] of [[3.6, OUT], [2, '#E8DCC0']]) { ctx.strokeStyle = C(col); ctx.lineWidth = w; ctx.beginPath(); for (const v of tines) { ctx.moveTo(v[0], v[1]); for (let i = 2; i < v.length; i += 2) ctx.lineTo(v[i], v[i + 1]); } ctx.stroke(); }
    if (DET()) for (const [x, y] of [[-12, hy - 24], [-11, hy - 27], [0, hy - 26], [7, hy - 22], [-1, hy - 22]]) glow(x, y, 4, '170,255,170', g * .6);
  }
  reg('archer', {
    mid(e, a, f) { const k = wear(e); leafMantle(k, f); ctx.save(); f.head(); stagMask(k, f.hy); ctx.restore(); },
    pieces: [bit(6, -61, () => { HUM.head(); stagMask(0, -61); }), bit(0, -48, () => leafMantle(0, HUM))],
    cols: ['#D8C8A0', '#7A9A48', '#5E7A3E', '#FFF6DA'],
    onBreak(e) { enrage(e, 1.15, .8); },
    bareMid(e, a, f) { const t = a.t || 0; ctx.save(); f.head(); antlers(f.hy, t);
      glow(6.7, f.hy - .6, 7, '170,255,190', .7); ctx.fillStyle = C('#E0FFE8'); ctx.fillRect(4.8, f.hy - 1.4, 3, 1.6); ctx.restore(); },
  });
  // ---- SKY CORSAIR: a tricorn and a steel cuirass; under them a red bandana and an eyepatch, and he comes on harder
  function tricorn(k, hy) {
    cel(P('M', -11, hy - 8, 'Q', -7, hy - 17, 0, hy - 16.6, 'Q', 8, hy - 17, 12.6, hy - 7.6, 'Q', 6, hy - 11.4, 1, hy - 10.4, 'Q', -5, hy - 11.6, -11, hy - 8, 'Z'), '#2A2230', { d: 2, r: 1, w: 1.5, lite: '#5A4A60', k, seed: 141, box: [-11, hy - 17, 23, 9],
      tex: () => { ctx.strokeStyle = '#D8AA55'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-10.4, hy - 8.4); ctx.quadraticCurveTo(-5, hy - 11.6, 1, hy - 10.8); ctx.quadraticCurveTo(6, hy - 11.8, 12, hy - 8); ctx.stroke(); } });
    cel(P('M', -9, hy - 12, 'Q', -16, hy - 18, -20, hy - 12, 'Q', -15, hy - 15, -9, hy - 10.6, 'Z'), '#E8E0D0', { d: 1, r: .5, w: 1 }); // a plume
    ctx.fillStyle = C('#D8AA55'); circle(1.6, hy - 13.6, 1.4); ctx.fill(); outline(.7);
  }
  function cuirass(k, f) {
    torsoPlate(f.SHO, f.HIP, '#A8B0BC', '#E8EEF4', k, 147, () => { ctx.strokeStyle = 'rgba(60,60,80,.5)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(4, f.SHO - 2); ctx.quadraticCurveTo(6, f.SHO + 8, 4, f.HIP - 2); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.55)'; ell(8, f.SHO + 4, 1.4, 4); ctx.fill(); });
    studs([-8, f.SHO + 2, 9, f.SHO + 2, -6, f.HIP - 5, 7, f.HIP - 5], '#D8AA55');
  }
  reg('corsair', {
    mid(e, a, f) { const k = wear(e); cuirass(k, f); ctx.save(); f.head(); tricorn(k, f.hy); ctx.restore(); },
    pieces: [bit(0, -74, () => { HUM.head(); tricorn(0, -61); }), bit(0, -40, () => cuirass(0, HUM))],
    cols: ['#A8B0BC', '#2A2230', '#D8AA55', '#FFFFFF'],
    onBreak(e) { enrage(e, 1.15, .8, { plans: ['charge', 'swing', 'charge'] }); },
    bareMid(e, a, f) { const t = a.t || 0; ctx.save(); f.head(); const hy = f.hy;
      const tails = Math.sin(t * 4) * 1.4;
      cel(P('M', -7.6, hy - 3, 'Q', -8, hy - 11.4, 0, hy - 11.6, 'Q', 8, hy - 11.4, 9.4, hy - 5, 'Q', 2, hy - 7, -7.6, hy - 3, 'Z'), '#C83A3A', { d: 1.6, r: .8, w: 1.3, tex: () => { ctx.fillStyle = '#F0E0C8'; for (const [x, y] of [[-3, hy - 8], [2, hy - 9.6], [5, hy - 7]]) { circle(x, y, .7); ctx.fill(); } } });
      cel(P('M', -7, hy - 5, 'Q', -12, hy - 4 + tails, -15, hy + 1 + tails, 'L', -13, hy + 1.4 + tails, 'Q', -10, hy - 2, -6.4, hy - 3, 'Z'), '#A82E30', { d: 1, r: .5, w: 1 }); // the knot's tails
      ctx.fillStyle = C('#1A1214'); ell(6.4, hy - .6, 2.4, 2, 0); ctx.fill(); ctx.strokeStyle = C('#1A1214'); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(4.4, hy - 1.6); ctx.lineTo(-2, hy - 5); ctx.stroke(); // the eyepatch
      ctx.restore(); },
  });
  // ---- AETHER GUNNER: a brass diving-helm and a bandolier; under them goggles up, and the aether in his eyes
  function gunHelm(k, hy) {
    const h = P('M', -8.6, hy + 7.6, 'Q', -11, hy - 4, -4, hy - 11.6, 'Q', 4, hy - 14, 10, hy - 7, 'Q', 13, hy, 11, hy + 7.6, 'Z');
    cel(h, '#C8964C', { d: 2.6, r: 1.1, w: 1.6, lite: '#F4D890', k, seed: 151, box: [-9, hy - 13, 21, 20], tex: () => { ctx.fillStyle = 'rgba(255,250,220,.6)'; ell(5, hy - 9, 3.4, 1.2, .4); ctx.fill(); } });
    ctx.fillStyle = C('#8A6232'); circle(6.6, hy - 1, 4.6); ctx.fill(); outline(1.2);
    const g = ctx.createRadialGradient(7.4, hy - 2, .4, 6.6, hy - 1, 3.4); g.addColorStop(0, C('#E8FCFF')); g.addColorStop(1, C('#4E8AA8'));
    ctx.fillStyle = g; circle(6.6, hy - 1, 3.3); ctx.fill(); outline(.8);
    for (let i = 0; i < 6; i++) rivet(6.6 + Math.cos(i / 6 * TAU) * 4.6, hy - 1 + Math.sin(i / 6 * TAU) * 4.6, '#8A6232', .5);
    ctx.fillStyle = C('#8A6232'); ctx.fillRect(-9, hy + 5, 20.4, 2.6); outline(1);
  }
  function bandolier(k, f) {
    torsoPlate(f.SHO, f.HIP, '#5A6A7A', '#9AAABA', k, 157);
    ctx.lineCap = 'butt'; ctx.strokeStyle = C(OUT); ctx.lineWidth = 4.6; ctx.beginPath(); ctx.moveTo(-9, f.SHO + 1); ctx.lineTo(8, f.HIP - 3); ctx.stroke();
    ctx.strokeStyle = C('#6E4A2A'); ctx.lineWidth = 3; ctx.stroke();
    for (let i = 0; i < 5; i++) { const u = (i + .5) / 5, x = -9 + 17 * u, y = f.SHO + 1 + (f.HIP - 4 - f.SHO) * u; ctx.fillStyle = C('#9FE8F0'); rrect(x - .9, y - 2, 1.8, 3.2, .6); ctx.fill(); outline(.6); }
  }
  reg('gunner', {
    mid(e, a, f) { const k = wear(e); bandolier(k, f); ctx.save(); f.head(); gunHelm(k, f.hy); ctx.restore(); },
    pieces: [bit(1, -61, () => { HUM.head(); gunHelm(0, -61); }), bit(0, -40, () => bandolier(0, HUM))],
    cols: ['#C8964C', '#5A6A7A', '#9FE8F0', '#FFFFFF'],
    onBreak(e) { enrage(e, 1.1, .78); },
    bareMid(e, a, f) { const t = a.t || 0; ctx.save(); f.head(); const hy = f.hy;
      for (const x of [-1.4, 4.6]) { ctx.fillStyle = C('#8A6232'); circle(x, hy - 9.6, 2.6); ctx.fill(); outline(1); ctx.fillStyle = C('#9FD8E8'); circle(x, hy - 9.6, 1.6); ctx.fill(); } // goggles pushed up
      ctx.strokeStyle = C('#3A2A20'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-6, hy - 8); ctx.lineTo(-4, hy - 9.4); ctx.stroke();
      glow(6.7, f.hy - .6, 8, '120,230,255', .8); ctx.fillStyle = C('#E0FCFF'); ctx.fillRect(4.6, hy - 1.4, 3, 1.6);
      ctx.restore(); sparks(-8, f.SHO + 4, t, 4, '140,220,255'); },
  });
  // ---- PRISM CULTIST: a porcelain mask and a tall mitre; under the mask, the demon it was worshipping
  function cultMask(k, hy) {
    const m = poly([2.4, hy - 9, 8, hy - 9.6, 11.6, hy - 5, 11.8, hy + 2, 10, hy + 8, 5.4, hy + 9, 2.6, hy + 5, 1.6, hy - 2]);
    cel(m, '#F2ECF0', { d: 1.8, r: .8, w: 1.4, lite: '#FFFFFF', dark: '#C8B8D0', k, seed: 161, box: [2, hy - 10, 10, 19] });
    ctx.fillStyle = C('#1A1214'); ell(7.4, hy - 1.6, 2.2, 1.1, -.1); ctx.fill();
    ctx.fillStyle = C('#C878A8'); ctx.beginPath(); ctx.moveTo(7.4, hy - 7.6); ctx.lineTo(9, hy - 4.6); ctx.lineTo(7.4, hy - 3.6); ctx.lineTo(5.8, hy - 4.6); ctx.closePath(); ctx.fill(); // the painted prism on its brow
    ctx.strokeStyle = C('#C878A8'); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(7.4, hy - .4); ctx.lineTo(7, hy + 4); ctx.stroke(); // a painted tear
    ctx.strokeStyle = C('#8A6A90'); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(5, hy + 5.6); ctx.lineTo(10, hy + 5.4); ctx.stroke();
  }
  function mitre(k, hy) {
    cel(P('M', -8, hy - 10, 'L', -5, hy - 24, 'Q', 0, hy - 28, 3, hy - 25, 'L', 7, hy - 10.4, 'Q', 0, hy - 12.4, -8, hy - 10, 'Z'), '#4A2A5A', { d: 2, r: 1, w: 1.4, lite: '#7A5A8A', k, seed: 167, box: [-8, hy - 27, 15, 17],
      tex: () => { ctx.strokeStyle = '#C878A8'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-1, hy - 26); ctx.lineTo(-1.4, hy - 11.4); ctx.moveTo(-7, hy - 12.6); ctx.quadraticCurveTo(0, hy - 14.4, 6.4, hy - 12.8); ctx.stroke(); } });
    shard(-1, hy - 24, 5, -1.57, 3, ROSE, .9);
  }
  reg('cultist', {
    mid(e, a, f) { const k = wear(e); ctx.save(); f.head(); mitre(k, f.hy); cultMask(k, f.hy); ctx.restore(); },
    pieces: [bit(7, -61, () => { HUM.head(); cultMask(0, -61); }), bit(0, -78, () => { HUM.head(); mitre(0, -61); })],
    cols: ['#F2ECF0', '#4A2A5A', '#C878A8', '#FFFFFF'],
    onBreak(e) { enrage(e, 1.15, .8); },
    bareMid(e, a, f) { const t = a.t || 0, hy = f.hy; ctx.save(); f.head();
      thorn(-4, hy - 10, -2.3, 9, 2.2, '#2A1A2E', -.7); thorn(2, hy - 11, -1.4, 8, 2, '#3A2440', -.6); // horns through the hood
      cel(P('M', 2.4, hy - 6, 'Q', 9, hy - 9, 11, hy - 3, 'Q', 11.4, hy + 4, 9.6, hy + 8.4, 'Q', 5, hy + 9, 2.6, hy + 5, 'Z'), '#5A2A4A', { d: 1.6, r: .7, w: 1.3, lite: '#8A4A70' }); // the demon's face
      if (DET()) { ctx.strokeStyle = `rgba(255,110,200,${.7 + .3 * Math.sin(t * 5)})`; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(3, hy - 4); ctx.lineTo(5, hy - 1); ctx.lineTo(4, hy + 3); ctx.moveTo(10, hy - 4); ctx.lineTo(9, hy); ctx.stroke(); }
      for (const [x, y, r] of [[5.6, hy - 1, 1], [8.8, hy - 1.4, 1.1], [7.4, hy - 4.8, .8]]) { ctx.fillStyle = C('#FFE0F4'); ell(x, y, r * 1.3, r * .7); ctx.fill(); glow(x, y, 4, '255,90,200', .6); }
      ctx.fillStyle = C('#1A0A14'); ctx.beginPath(); ctx.moveTo(4, hy + 4); ctx.quadraticCurveTo(7.6, hy + 7, 10.6, hy + 3.4); ctx.quadraticCurveTo(7.6, hy + 5, 4, hy + 4); ctx.fill();
      ctx.fillStyle = C('#F4E6D8'); for (const x of [5.4, 7.4, 9.2]) { ctx.beginPath(); ctx.moveTo(x, hy + 4.2); ctx.lineTo(x + .5, hy + 5.8); ctx.lineTo(x + 1, hy + 4.2); ctx.fill(); }
      ctx.restore(); },
  });
  // ---- RIFT WITCH: a broad witch's hat and a collar of warding mirrors; without them the rift opens a third eye in her
  function witchHat(k, hy) {
    cel(P('E', 0, hy - 10.4, 14, 3, -.08), '#1E2650', { d: 1.4, r: .7, w: 1.4, lite: '#4A5890', k, seed: 171, box: [-14, hy - 13, 28, 6] });
    cel(P('M', -7, hy - 11, 'Q', -4, hy - 20, -2, hy - 24, 'Q', -6, hy - 30, -13, hy - 31, 'Q', -3, hy - 34, 2, hy - 25, 'Q', 6, hy - 17, 7.6, hy - 11.4, 'Z'), '#283460', { d: 2.2, r: 1, w: 1.5, lite: '#5A68A0', k, seed: 173, box: [-8, hy - 32, 16, 21] });
    ctx.fillStyle = C('#8CC8D0'); ctx.fillRect(-6.6, hy - 14.4, 14, 2.2); outline(.8);
    shard(1, hy - 13.4, 3.4, -1.57, 2.4, ICE, .8);
  }
  function wardMirrors(k, f, t) {
    for (let i = 0; i < 5; i++) { const an = -Math.PI * .95 + i * .5, x = Math.cos(an) * 11, y = f.SHO - 1 + Math.sin(an) * 4 + Math.sin(t * 2 + i) * .6;
      shard(x, y + 2, 7, an * .25 - 1.57, 3.2, i % 2 ? ICE : { lt: '#F0F4FF', mid: '#B8C4E8', dk: '#5A6898', deep: '#2E3460' }, 1); }
    if (k > 0) cracks(k * .6, 177, [-11, f.SHO - 8, 22, 8]);
  }
  reg('witch', {
    mid(e, a, f) { const k = wear(e); wardMirrors(k, f, a.t || 0); ctx.save(); f.head(); witchHat(k, f.hy); ctx.restore(); },
    pieces: [bit(0, -80, () => { HUM.head(); witchHat(0, -61); }), bit(-6, -52, () => wardMirrors(0, HUM, 0))],
    cols: ['#283460', '#8CC8D0', '#E4FCFF', '#B8C4E8'],
    onBreak(e) { enrage(e, 1.1, .8); },
    bareMid(e, a, f) { const t = a.t || 0, hy = f.hy; ctx.save(); f.head();
      if (DET()) { ctx.lineCap = 'round'; for (let i = 0; i < 5; i++) { const x0 = -6 + i * 2.6, sw = Math.sin(t * 3 + i) * 2; ctx.strokeStyle = `rgba(159,232,240,${.75 - i * .08})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x0, hy - 10); ctx.quadraticCurveTo(x0 - 3 + sw, hy - 17, x0 - 5 + sw * 1.5, hy - 23 - i % 2 * 3); ctx.stroke(); } } // her hair lifted on the rift's wind
      ctx.fillStyle = C('#1A1220'); ell(6.6, hy - 5.6, 1.9, 1.2); ctx.fill(); ctx.fillStyle = C('#9FE8F0'); ell(6.8, hy - 5.6, 1.2, .8); ctx.fill(); glow(6.8, hy - 5.6, 6, '159,232,240', .8); // the third eye
      ctx.restore();
      if (DET()) for (let i = 0; i < 3; i++) { const an = t * 2 + i * TAU / 3; ctx.fillStyle = 'rgba(200,250,255,.9)'; circle(Math.cos(an) * 14, f.SHO - 4 + Math.sin(an) * 4, 1.1); ctx.fill(); glow(Math.cos(an) * 14, f.SHO - 4 + Math.sin(an) * 4, 4, '159,232,240', .5); } },
  });

  // ======================= PRISM IMP: an iron muzzle and a collar on a chain =======================
  // A leashed imp: its jaw caged and a spiked collar with a broken chain. Snapped off, it is feral: its horns flare up
  // tall and burning, and it springs at you sooner.
  const impFrame = (e, a) => { const t = a.t || 0, wd = a.wind || 0, atk = !!a.atk, sq = (e && e.sq) || 1;
    ctx.scale(1 + (1 - sq) * .45, sq);
    const crouch = wd * 4 - (atk ? 1.5 : 0), lean = atk ? 5 : -wd * 2.5, br = Math.sin(t * 5) * .5, sx = 5 + lean, sy = -22.5 + crouch * 1.2 + br;
    return { sx, sy, hdx: sx + 4.5 + (atk ? 1.5 : 0), hdy: sy - 4.5, rot: atk ? .15 : -wd * .1 }; };
  function impMuzzle(k) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const cage = () => { ctx.beginPath(); ctx.moveTo(1, -2.6); ctx.lineTo(10.6, -1.6); ctx.lineTo(10.4, 3.4); ctx.lineTo(1, 4); ctx.moveTo(4, -2.4); ctx.lineTo(4, 4); ctx.moveTo(7.4, -2); ctx.lineTo(7.4, 3.8); ctx.moveTo(1, .8); ctx.lineTo(10.6, .9); ctx.moveTo(1, -2.6); ctx.lineTo(-4.4, -3); };
    cage(); ctx.strokeStyle = C(OUT); ctx.lineWidth = 2.6; ctx.stroke(); cage(); ctx.strokeStyle = C(k > .5 ? '#7A5A50' : '#6E7282'); ctx.lineWidth = 1.3; ctx.stroke();
    rivet(10.5, .9, '#6E7282', .8);
  }
  function impCollar(k, sx, sy) {
    cel(P('E', sx - .6, sy + .4, 3, 4.8, -.3), '#5E6474', { d: 1.4, r: .7, w: 1.3, lite: '#A8B0C0', k, seed: 181, box: [sx - 4, sy - 5, 7, 10] });
    thorn(sx - 3, sy - 3, -2.6, 3.6, 1.1, '#A8B0C0', 0); thorn(sx - 3.4, sy + 1.6, -3.1, 3.6, 1.1, '#A8B0C0', 0);
    ctx.strokeStyle = C('#4A4E5A'); ctx.lineWidth = 1.4; ctx.setLineDash([1.8, 1.2]); ctx.beginPath(); ctx.moveTo(sx - 3, sy + 3); ctx.quadraticCurveTo(sx - 8, sy + 8, sx - 12, sy + 6); ctx.stroke(); ctx.setLineDash([]);
    shard(sx + .4, sy + 4, 3.2, 1.57, 2.6, ROSE, .8); // the crystal lock
  }
  reg('imp', {
    draw(e, a) { const k = wear(e); ctx.save(); const F = impFrame(e, a); impCollar(k, F.sx, F.sy); ctx.translate(F.hdx, F.hdy); ctx.rotate(F.rot); impMuzzle(k); ctx.restore(); },
    pieces: [bit(14, -27, () => { ctx.translate(14, -27); impMuzzle(0); }), bit(5, -22, () => impCollar(0, 5, -22.5))],
    cols: ['#6E7282', '#A8B0C0', '#E29AE0', '#FFFFFF'],
    onBreak(e) { enrage(e, 1.15, .78); },
    bare(e, a) { const t = a.t || 0, wd = a.wind || 0; ctx.save(); const F = impFrame(e, a); ctx.translate(F.hdx, F.hdy); ctx.rotate(F.rot);
      glow(-2, -12, 12, '255,120,220', .35 + wd * .3 + .1 * Math.sin(t * 6));
      shard(-1.6, -5.4, 15, -2.3, 4.6, ROSE); shard(1.6, -5.6, 11, -1.95, 3.6, ROSE);
      ctx.restore(); },
  });

  // ======================= SHARD CRAB: a borrowed conch =======================
  // Like a hermit it has taken a great pearl conch for a shell. Knocked out of it, its own shards blaze, and its crusher
  // claw (art_prism.js) swells.
  const crabFrame = (a) => { const ph = (a.walk || 0) * 1.3, wd = a.wind || 0; ctx.translate(a.atk ? 3 : -wd * 2, Math.abs(Math.sin(ph)) * -1); };
  function conch(k) {
    const c = P('M', -24, -14, 'C', -30, -22, -26, -38, -12, -42, 'C', 2, -46, 16, -38, 14, -26, 'C', 13, -19, 6, -15, -2, -15, 'Z');
    cel(c, '#EADCCC', { d: 3.4, r: 1.3, w: 1.8, lite: '#FFFFFF', dark: '#C0A8B8', deep: 1.4, deepCol: '#9A7E98', k, seed: 191, box: [-26, -44, 40, 28],
      tex: () => { ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(200,120,150,.7)'; ctx.lineWidth = 2.4; ctx.beginPath(); // the spiral bands
        for (let i = 0; i <= 40; i++) { const th = i * .32, r = 1.5 + i * .55, x = -6 + Math.cos(th) * r, y = -29 + Math.sin(th) * r * .82; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = .8; ctx.stroke();
        if (DET()) { const g = ctx.createLinearGradient(-20, -40, 10, -18); g.addColorStop(0, 'rgba(160,220,255,.25)'); g.addColorStop(.5, 'rgba(255,200,240,.25)'); g.addColorStop(1, 'rgba(200,255,220,.2)'); ctx.fillStyle = g; ctx.fillRect(-30, -50, 50, 40); } } }); // nacre sheen
    for (const [x, y, an] of [[-20, -34, -2.4], [-10, -41.5, -1.8], [2, -41, -1.2], [11, -33, -.7]]) thorn(x, y, an, 5, 1.8, '#E8C8D0', .3);
  }
  reg('shardling', {
    draw(e, a) { ctx.save(); crabFrame(a); conch(wear(e)); ctx.restore(); },
    pieces: [bit(-6, -28, () => conch(0))],
    cols: ['#EADCCC', '#E8A8C0', '#FFFFFF', '#9FD8E0'],
    onBreak(e) { enrage(e, 1.15, .8); },
    bare(e, a) { const t = a.t || 0, wd = a.wind || 0; ctx.save(); crabFrame(a);
      glow(-2, -26, 22, '255,110,180', .3 + .12 * Math.sin(t * 5) + wd * .25);
      glow(-4, -34, 10, '255,220,250', .3);
      ctx.restore(); },
  });

  // ======================= the fliers (elites only when a wave forces them) =======================
  // ---- POLLEN PIXIE: an acorn cap and a walnut-shell bodice; without them its pollen-fire burns wild
  const wispFrame = (a) => { const t = a.t || 0, wind = a.wind || 0; ctx.translate(0, -12 + Math.sin(t * 3.2) * 1.2); ctx.rotate(a.atk ? .25 : -wind * .2); };
  function acorn(k) {
    cel(P('M', -5.4, -3.4, 'Q', -5, -8.6, .4, -8.8, 'Q', 6, -8.4, 6.2, -3, 'Q', 0, -4.6, -5.4, -3.4, 'Z'), '#8A5A32', { d: 1.4, r: .7, w: 1.2, lite: '#C08A58', k, seed: 201, box: [-5, -9, 11, 6],
      tex: () => { ctx.strokeStyle = 'rgba(50,28,14,.6)'; ctx.lineWidth = .5; ctx.beginPath(); for (let i = -4; i <= 5; i += 1.6) { ctx.moveTo(i, -8.4); ctx.lineTo(i + 1.4, -3.8); ctx.moveTo(i + 1.4, -8.4); ctx.lineTo(i, -3.8); } ctx.stroke(); } });
    limb([.4, -8.6, 1.6, -10.6], '#5A3A20', 1.2);
  }
  function walnut(k) {
    cel(P('M', -5.6, -6.6, 'C', -1, -10.4, 5, -9, 5.6, -4, 'C', 6, .6, 2.6, 4, -1.4, 3.6, 'C', -5.6, 3, -7, -2, -5.6, -6.6, 'Z'), '#A87A4A', { d: 1.6, r: .7, w: 1.3, lite: '#D8B080', k, seed: 205, box: [-6, -9, 12, 12],
      tex: () => { ctx.strokeStyle = 'rgba(70,40,20,.6)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(0, -8.6); ctx.quadraticCurveTo(1.6, -2, -.6, 3.4); ctx.moveTo(-4, -5); ctx.quadraticCurveTo(-2, -3, -4, 0); ctx.moveTo(3.6, -5); ctx.quadraticCurveTo(2, -2.6, 4, 0); ctx.stroke(); } });
  }
  reg('wisp', {
    draw(e, a) { const k = wear(e); ctx.save(); wispFrame(a); walnut(k); ctx.translate(1.5, -11); ctx.scale(1.3, 1.3); acorn(k); ctx.restore(); },
    pieces: [bit(1.5, -30, () => { ctx.translate(1.5, -23); ctx.scale(1.3, 1.3); acorn(0); }), bit(0, -14, () => { ctx.translate(0, -12); walnut(0); })],
    cols: ['#8A5A32', '#D8B080', '#FFE07A', '#FFFFFF'],
    onBreak(e) { enrage(e, 1.1, .8); },
    bare(e, a) { const t = a.t || 0, wind = a.wind || 0; ctx.save(); wispFrame(a);
      glow(1.5, -16, 16, '255,180,90', .4 + wind * .3 + .1 * Math.sin(t * 7));
      if (DET()) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { const q = (t * 1.3 + i / 6) % 1; ctx.fillStyle = `rgba(255,${200 - i * 12},110,${.9 * (1 - q)})`; circle(Math.sin(i * 2.1 + q * 4) * 4, -18 - q * 14, 1.3 * (1 - q) + .3); ctx.fill(); } ctx.restore(); } // pollen-fire streaming off its crown
      ctx.restore(); },
  });
  // ---- SKY / LANTERN / SHARD DRONES
  const droneFrame = (a) => { const t = a.t || 0, w = a.wind || 0; ctx.translate(a.atk ? -2 : 0, -12 + Math.sin(t * 3.1) * 1.2); ctx.rotate(w ? -.24 * w : a.atk ? .14 : Math.sin(t * 2) * .07); };
  function droneCowl(k, col, lite) {
    const c = P('M', -17, 1, 'C', -17, -9, -8, -14, 1, -14, 'C', 9, -14, 16, -9.6, 17, -4.6, 'L', 11.6, -5.6, 'Q', 8, -7.6, 4.4, -5, 'L', 4.6, -.4, 'Q', -6, -2.6, -17, 1, 'Z');
    cel(c, col, { d: 2.6, r: 1.1, w: 1.6, lite, k, seed: 211, box: [-17, -14, 34, 14], tex: () => { ctx.strokeStyle = 'rgba(30,30,40,.5)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-9, -11); ctx.quadraticCurveTo(-12, -5, -10, -1); ctx.stroke(); } });
    for (const [x, y] of [[-13, -2], [-10, -8.6], [-3, -12], [5, -11.6], [11, -9]]) rivet(x, y, col, .75);
  }
  reg('drone', {
    draw(e, a) { ctx.save(); droneFrame(a); droneCowl(wear(e), '#6A7282', '#B4BCCA'); ctx.restore(); },
    pieces: [bit(0, -19, () => { ctx.translate(0, -12); droneCowl(0, '#6A7282', '#B4BCCA'); })],
    cols: ['#6A7282', '#B4BCCA', '#5EEAD8', '#FFFFFF'],
    onBreak(e) { enrage(e, 1.15, .8); },
    bare(e, a) { const t = a.t || 0; ctx.save(); droneFrame(a); // dented, sparking, its lens burning red
      ctx.strokeStyle = C('rgba(40,30,40,.7)'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(-5, -5); ctx.lineTo(-7, -2); ctx.moveTo(2, -9); ctx.lineTo(4, -6); ctx.stroke();
      glow(10, -.5, 10, '255,70,70', .55 + .15 * Math.sin(t * 9)); sparks(-6, -6, t, 3, '255,220,150'); ctx.restore(); },
  });
  function lanternCage(k, a) {
    const t = a.t || 0; ctx.save(); ctx.translate(-1, 8); ctx.rotate(Math.sin(t * 2.3) * .18);
    ctx.lineCap = 'round'; const bars = () => { ctx.beginPath(); for (const x of [-6, -2, 2, 6]) { ctx.moveTo(x * .8, 8); ctx.quadraticCurveTo(x * 1.2, 14.5, x * .9, 22); } ctx.moveTo(-6.6, 15); ctx.lineTo(6.6, 15); };
    bars(); ctx.strokeStyle = C(OUT); ctx.lineWidth = 2.6; ctx.stroke(); bars(); ctx.strokeStyle = C(k > .5 ? '#6A4A3A' : '#4A4038'); ctx.lineWidth = 1.2; ctx.stroke();
    cel(P('M', -6, 8.6, 'Q', 0, 2.6, 6, 8.6, 'Z'), '#4A4038', { d: 1, r: .6, w: 1.1 });
    thorn(0, 4.6, -1.57, 3.6, 1.2, '#4A4038', 0);
    ctx.restore();
  }
  function lanternCap(k) {
    cel(P('M', -9, -8.4, 'Q', -1, -15.6, 9, -8.6, 'Q', 0, -10.4, -9, -8.4, 'Z'), '#4A4038', { d: 1.4, r: .7, w: 1.3, lite: '#8A7A68', k, seed: 221, box: [-9, -15, 18, 7] });
    for (const x of [-5, 0, 5]) thorn(x, -10.6 - (x ? 0 : 1.4), -1.57, 5, 1.4, '#3A3028', 0);
  }
  reg('lantern', {
    draw(e, a) { const k = wear(e); ctx.save(); droneFrame(a); lanternCage(k, a); lanternCap(k); ctx.restore(); },
    pieces: [bit(-1, 11, () => { ctx.translate(0, -12); lanternCage(0, {}); }), bit(0, -23, () => { ctx.translate(0, -12); lanternCap(0); })],
    cols: ['#4A4038', '#8A7A68', '#FFB04A', '#FFE6A0'],
    onBreak(e) { enrage(e, 1.1, .78); },
    bare(e, a) { const t = a.t || 0; ctx.save(); droneFrame(a); // its fire out of the lantern and licking up the hull
      ctx.save(); ctx.translate(-1, 8); ctx.rotate(Math.sin(t * 2.3) * .18);
      glow(0, 14, 20, '255,150,60', .55);
      for (const [x, sc, col] of [[0, 1, '#FF7A2A'], [0, .62, '#FFD86A'], [0, .3, '#FFFFF0']]) { const h = (13 + Math.sin(t * 13) * 2) * sc, sw = Math.sin(t * 9) * 1.6 * sc, by = 17;
        ctx.beginPath(); ctx.moveTo(x, by + 3 * sc); ctx.bezierCurveTo(x - 6 * sc, by + 2 * sc, x - 5 * sc, by - h * .5, x + sw, by - h); ctx.bezierCurveTo(x + 2 * sc + sw * .5, by - h * .55, x + 6 * sc, by - h * .2, x + 4.6 * sc, by + 1 * sc); ctx.quadraticCurveTo(x + 3 * sc, by + 3 * sc, x, by + 3 * sc); ctx.closePath();
        ctx.fillStyle = C(col); ctx.fill(); if (sc === 1) outline(1.1); } // the flame burst out of its broken cage
      ctx.restore(); ctx.restore(); },
  });
  function sdroneCase(k) {
    const pl = [poly([-16, 0, -10, -11.6, -3, -12.6, -4.6, 9.6, -8, 10]), poly([4, -13, 16, -4, 15.6, -1.4, 6, -5])];
    pl.forEach((p, i) => cel(p, '#3E3654', { d: 2, r: .9, w: 1.5, lite: '#6E6488', k, seed: 231 + i, box: i ? [4, -13, 12, 12] : [-16, -12, 13, 22] }));
    for (const [x, y] of [[-12, -1], [-7, -9], [-6, 5], [9, -8], [13, -3.6]]) rivet(x, y, '#8C82A8', .8);
  }
  reg('sdrone', {
    draw(e, a) { ctx.save(); droneFrame(a); sdroneCase(wear(e)); ctx.restore(); },
    pieces: [bit(-8, -12, () => { ctx.translate(0, -12); sdroneCase(0); })],
    cols: ['#3E3654', '#6E6488', '#F07AE8', '#E4FCFF'],
    onBreak(e) { enrage(e, 1.1, .8); },
    bare(e, a) { const t = a.t || 0; ctx.save(); droneFrame(a); glow(1, -2, 18, '240,122,232', .35 + .1 * Math.sin(t * 5));
      shard(-6, -9, 8, -2.2, 3, ROSE); shard(2, -11, 9, -1.6, 3, ICE); shard(-12, -4, 6, -2.7, 2.6, ICE); ctx.restore(); },
  });
  // ---- AURORA JELLY: a nautilus helm; out of it the jelly flares
  const jellyDims = (a) => { const t = a.t || 0, wd = a.wind || 0, atk = !!a.atk, pulse = Math.sin(t * 3.2);
    return { bw: 16.5 * (1 - pulse * .05 - wd * .1 + (atk ? .1 : 0)), bh: 15 * (1 + pulse * .07 + wd * .08 - (atk ? .08 : 0)), cy: -15 + pulse * .6 }; };
  function nautilus(k, bw, bh, cy) {
    const c = P('M', -bw - 1.4, cy - bh * .4, 'C', -bw - 1, cy - bh * 1.1, bw * .4, cy - bh * 1.35, bw + 1.6, cy - bh * .5, 'Q', bw * .3, cy - bh * .72, -bw - 1.4, cy - bh * .4, 'Z');
    cel(c, '#F0E2D0', { d: 2.4, r: 1, w: 1.5, lite: '#FFFFFF', dark: '#C8A890', k, seed: 241, box: [-bw, cy - bh * 1.3, bw * 2, bh], tex: () => {
      ctx.strokeStyle = 'rgba(170,90,60,.75)'; ctx.lineWidth = 1.4; ctx.beginPath(); for (let i = 0; i < 5; i++) { const x = -bw * .7 + i * bw * .38; ctx.moveTo(x, cy - bh * .5); ctx.quadraticCurveTo(x + 2, cy - bh * .9, x + 5, cy - bh * 1.1); } ctx.stroke(); } }); // tiger stripes
  }
  reg('jelly', {
    draw(e, a) { const { bw, bh, cy } = jellyDims(a); nautilus(wear(e), bw, bh, cy); },
    pieces: [bit(0, -28, () => nautilus(0, 16.5, 15, -15))],
    cols: ['#F0E2D0', '#C8A890', '#9FE8F0', '#FFFFFF'],
    onBreak(e) { enrage(e, 1.1, .8); },
    bare(e, a) { const t = a.t || 0, { bw, bh, cy } = jellyDims(a); glow(1, cy - bh * .4, 30, '255,140,230', .25 + .1 * Math.sin(t * 4));
      if (DET()) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { const an = t * 1.5 + i * TAU / 5; ctx.fillStyle = 'rgba(255,200,250,.8)'; circle(Math.cos(an) * (bw + 5), cy - bh * .4 + Math.sin(an) * 5, 1); ctx.fill(); } ctx.restore(); } },
  });
  // ---- SKY RAY: a brass chanfron and a saddle; slipped free, it flies wild with its spots alight
  const rayFrame = (a) => { const t = a.t || 0, wd = a.wind || 0; ctx.translate(-wd * 3, -13 + Math.sin(t * 2.5 + 1)); ctx.rotate(a.atk ? .3 : -wd * .28 + Math.sin(t * 2.5) * .04); };
  function rayBarding(k) {
    cel(poly([11, -5.6, 18, -6.6, 23.6, -7.6, 24.8, -4, 21, -2.6, 16, -2.8, 12, -3]), '#C8964C', { d: 1.2, r: .7, w: 1.3, lite: '#F4D890', k, seed: 251, box: [11, -8, 14, 6] });
    ctx.fillStyle = C('#1A1214'); ctx.fillRect(14, -4.4, 3, 1.4);
    cel(P('M', -8, -4, 'Q', -2, -10, 6, -6.6, 'L', 6, -4.6, 'Q', -1, -6, -8, -2.6, 'Z'), '#8A2E3A', { d: 1, r: .6, w: 1.2 });
    cel(P('M', -5, -6, 'Q', -2, -11, 3, -8.6, 'L', 3, -6.4, 'Q', -1, -7.6, -5, -4.6, 'Z'), '#C8964C', { d: 1, r: .6, w: 1.2, lite: '#F4D890', k, seed: 253, box: [-5, -11, 8, 6] });
  }
  reg('skyray', {
    draw(e, a) { ctx.save(); rayFrame(a); rayBarding(wear(e)); ctx.restore(); },
    pieces: [bit(6, -18, () => { ctx.translate(0, -13); rayBarding(0); })],
    cols: ['#C8964C', '#F4D890', '#8A2E3A', '#FFFFFF'],
    onBreak(e) { enrage(e, 1.15, .8); },
    bare(e, a) { const t = a.t || 0; ctx.save(); rayFrame(a);
      for (const [x, y] of [[-1, -3.8], [-6, -2.6], [2, 6], [-4, 9], [4, -9]]) glow(x, y, 4, '170,210,255', .5 + .3 * Math.sin(t * 4 + x));
      ctx.strokeStyle = C('#7A5424'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(4.6, 9.2); ctx.quadraticCurveTo(0, 13 + Math.sin(t * 6) * 2, -6, 12 + Math.sin(t * 6 + 1) * 3); ctx.stroke(); // the snapped tether
      ctx.restore(); },
  });

  // ======================= the shared wrap: every creature here draws through it =======================
  ['slime', 'boar', 'golem', 'spider', 'tank', 'knight', 'human', 'imp', 'crab', 'wisp', 'drone', 'jelly', 'skyray'].forEach(wrap);
})();
