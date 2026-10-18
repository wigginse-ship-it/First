'use strict';
// World 5 art, enemies, boss, passages, rules and ending: TIR-NA NOG'TH, the city in the sky
//   moon      - The Stair of Moonlight: a stair of light climbs out of a sea of cloud to the full moon; its landing is
//               paved with slabs of moonstone, and the mist towers of the ghost city stand on cloud ahead (rule 'w5dawn':
//               the dawn is coming up behind you, and wherever it touches the city is not there)
//   moon2     - The Streets of Tir-na Nog'th: the ghostly double of Amber's streets, its housetops dissolving into mist.
//               The city only exists where moonlight falls (rule 'w5cloud': cloud shadows drift over the street and the
//               paving under them is not there), and a Sphinx waits at the end of the street with a riddle
//   moonBoss  - The Moon Throne: an open hall at the top of the city, an empty throne of mist against the moon, a ghost of
//               the Pattern inlaid in the floor. The Phantom of Benedict guards it (rule 'w5throne': the night ends as the fight does)
// Enemies: Lantern Courtier, Weeping Watcher, Colorless Reflection, Moonmoth, Hound of the Wild Hunt, Knave of Moons,
// the Sphinx. Boss: the Phantom of Benedict (the one-armed master, the Silver Arm, the Phantom unbound).
// Passages: 'w5moonpath' (a stair of light unrolls up to the moon) and 'w5mist' (the picture flakes away like silver leaf).
// Everything lives inside this closure so nothing collides with the other files; the late parts are handed to data_w5.js.
(() => {
  const T = FLOOR_TOP;
  const DET = () => !FLASH && !TINT; // fine shading is skipped in a hit flash or a flat afterimage tint
  const add = (fn) => { if (!DET()) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
  const addB = (fn) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); }; // light, at build time
  const poly = (pts) => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); };
  const fillPoly = (pts, col, ow) => { poly(pts); ctx.fillStyle = C(col); ctx.fill(); if (ow) outline(ow); };
  const glowAt = (x, y, r, rgb, a) => add(() => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.45, `rgba(${rgb},${a * .4})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); });
  const glowM = (x, y, r, rgb, a) => { if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.45, `rgba(${rgb},${a * .4})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); }; // no flash test
  const hsh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }; // stable randomness
  const sm = (k) => k * k * (3 - 2 * k);
  const cl01 = (k) => clamp(k, 0, 1);
  // a tapered, curved spike (horn, claw, quill, blade, finger): two-toned, a lit edge
  function taper(x0, y0, cx, cy, x1, y1, w0, w1, n = 7) {
    const L = [], R = [], M = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, iu = 1 - u, x = iu * iu * x0 + 2 * iu * u * cx + u * u * x1, y = iu * iu * y0 + 2 * iu * u * cy + u * u * y1;
      const dx = 2 * iu * (cx - x0) + 2 * u * (x1 - cx), dy = 2 * iu * (cy - y0) + 2 * u * (y1 - cy), d = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * u) / 2;
      L.push(x - dy / d * w, y + dx / d * w); R.push(x + dy / d * w, y - dx / d * w); M.push(x, y);
    }
    return { L, R, M };
  }
  const trace = (A, B) => { ctx.beginPath(); ctx.moveTo(A[0], A[1]); for (let i = 2; i < A.length; i += 2) ctx.lineTo(A[i], A[i + 1]); for (let i = B.length - 2; i >= 0; i -= 2) ctx.lineTo(B[i], B[i + 1]); ctx.closePath(); };
  function horn(x0, y0, cx, cy, x1, y1, w0, w1, col, ow = 1.1, dark) {
    const s = taper(x0, y0, cx, cy, x1, y1, w0, w1);
    trace(s.L, s.R); ctx.fillStyle = C(col); ctx.fill();
    if (DET()) {
      const k = (s.L.length >> 2) & ~1, nx = s.L[k] - s.M[k], ny = s.L[k + 1] - s.M[k + 1], darkL = nx * -.6 + ny * .8 > 0;
      trace(darkL ? s.L : s.R, s.M); ctx.fillStyle = dark || shade(col, -.38); ctx.fill();
      const lit = darkL ? s.R : s.L; ctx.strokeStyle = shade(col, .45); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(lit[0], lit[1]); for (let i = 2; i < lit.length - 2; i += 2) ctx.lineTo(lit[i], lit[i + 1]); ctx.stroke();
    }
    if (ow) { trace(s.L, s.R); outline(ow); }
    return s;
  }
  // cel shading for a path: a flat base, a hard shadow plane down-left, a lit rim up-right, texture inside, an inked outline
  const BIGR = () => ctx.rect(-900, -900, 1800, 1800);
  function cel(path, col, o = {}) {
    const d = o.d ?? 3, r = o.r ?? 1.1, w = o.w ?? 1.6;
    path(0, 0); ctx.fillStyle = C(col); ctx.fill();
    if (DET()) {
      ctx.save(); path(0, 0); ctx.clip();
      if (o.under) o.under();
      if (d) { ctx.fillStyle = o.dark || shade(col, -.34); ctx.beginPath(); BIGR(); path(.8 * d, -.6 * d, true); ctx.fill('evenodd'); }
      if (r) { ctx.fillStyle = o.lite || shade(col, .3); ctx.beginPath(); BIGR(); path(-.8 * r, .6 * r, true); ctx.fill('evenodd'); }
      if (o.tex) o.tex();
      ctx.restore();
    }
    if (w) { path(0, 0); outline(w); }
  }
  const PB = (pts) => (ox, oy, cont) => { if (!cont) ctx.beginPath(); const n = pts.length / 2;
    for (let i = 0; i <= n; i++) { const a = i % n, b = (i + 1) % n, mx = (pts[a * 2] + pts[b * 2]) / 2 + ox, my = (pts[a * 2 + 1] + pts[b * 2 + 1]) / 2 + oy;
      if (i === 0) ctx.moveTo(mx, my); else ctx.quadraticCurveTo(pts[a * 2] + ox, pts[a * 2 + 1] + oy, mx, my); }
    ctx.closePath(); };
  const PP = (pts) => (ox, oy, cont) => { if (!cont) ctx.beginPath(); ctx.moveTo(pts[0] + ox, pts[1] + oy); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i] + ox, pts[i + 1] + oy); ctx.closePath(); };
  const PE = (x, y, rx, ry, rot = 0) => (ox, oy, cont) => { if (!cont) ctx.beginPath(); ctx.moveTo(x + ox + Math.cos(rot) * rx, y + oy + Math.sin(rot) * rx); ctx.ellipse(x + ox, y + oy, Math.max(.1, rx), Math.max(.1, ry), rot, 0, TAU); };
  const stripPath = (s) => (ox, oy, cont) => { if (!cont) ctx.beginPath(); ctx.moveTo(s.L[0] + ox, s.L[1] + oy); for (let i = 2; i < s.L.length; i += 2) ctx.lineTo(s.L[i] + ox, s.L[i + 1] + oy); for (let i = s.R.length - 2; i >= 0; i -= 2) ctx.lineTo(s.R[i] + ox, s.R[i + 1] + oy); ctx.closePath(); };
  // a line of silver leaf: a dark bed, the leaf, a bright burnish along its top (the gilding of a panel painting, in silver)
  function leafLine(fn, w = 1.2, a = 1) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.globalAlpha = a * .6; ctx.strokeStyle = C('#2A3044'); ctx.lineWidth = w + 1.2; ctx.beginPath(); fn(); ctx.stroke();
    ctx.globalAlpha = a; ctx.strokeStyle = C('#B9C3D4'); ctx.lineWidth = w; ctx.beginPath(); fn(); ctx.stroke();
    if (DET()) { ctx.strokeStyle = 'rgba(250,252,255,.8)'; ctx.lineWidth = Math.max(.4, w * .35); ctx.translate(-.25, -.35); ctx.beginPath(); fn(); ctx.stroke(); }
    ctx.restore();
  }
  // the palette: moonlit silver-blue over ink-black, gilded with silver leaf
  const INK = '#070912', NIGHT = '#0E1530', DEEP = '#1B2A52', STEEL = '#5A6E96', SILV = '#B8C6DC', LEAF = '#D6DEEA', MOONW = '#EEF2F9';
  const MOONRGB = '222,232,250', COLD = '170,195,240', PALE = '205,218,245';
  const W5 = window.W5 = window.W5 || {}; // shared with data_w5.js

  // ======================================================================================================
  // THE MOON, its silver-leaf aureole, and the clouds that cross it (painted once, hung in the live sky)
  // ======================================================================================================
  let moonC = null, haloC = null, moonR = 0, cloudCs = [], stairC = null;
  function buildMoon(R, seed) {
    retire(moonC); retire(haloC); moonR = R;
    const S = Math.ceil(R * 2 + 8), old = ctx, rnd = mulberry(seed);
    const [c, g] = makeLayer(S, S); ctx = g; ctx.translate(S / 2, S / 2);
    const dg = ctx.createRadialGradient(-R * .25, -R * .3, R * .1, 0, 0, R); dg.addColorStop(0, '#FBFCFE'); dg.addColorStop(.62, '#E4EAF4'); dg.addColorStop(1, '#B4C0D6');
    ctx.fillStyle = dg; circle(0, 0, R); ctx.fill();
    ctx.save(); circle(0, 0, R); ctx.clip();
    for (const [x, y, r] of [[-.32, -.16, .34], [.14, -.36, .22], [.32, .06, .25], [-.08, .3, .2], [-.44, .24, .14], [.04, .02, .12], [.5, -.3, .1]]) // the seas, dabbed in
      for (let i = 0; i < 8; i++) dab((x + (rnd() - .5) * r * .9) * R, (y + (rnd() - .5) * r * .8) * R, r * R * (.4 + rnd() * .4), i % 2 ? '#A6B2C8' : '#B8C2D6', .5);
    for (let i = 0; i < 22; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R * .86, r = R * (.018 + rnd() * .045), x = Math.cos(a) * d, y = Math.sin(a) * d; // craters
      ctx.strokeStyle = 'rgba(112,128,158,.42)'; ctx.lineWidth = Math.max(.5, r * .35); circle(x, y, r); ctx.stroke(); ctx.fillStyle = 'rgba(252,253,255,.5)'; circle(x + r * .3, y - r * .3, r * .45); ctx.fill(); }
    for (let i = 0; i < 30; i++) { const y = (rnd() - .5) * R * 1.9, x = (rnd() - .5) * R * 1.4, L = R * (.3 + rnd() * .6); // the white laid on in long strokes
      ctx.strokeStyle = `rgba(255,255,255,${.06 + rnd() * .12})`; ctx.lineWidth = R * (.02 + rnd() * .04); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - L / 2, y); ctx.quadraticCurveTo(x, y - R * .05, x + L / 2, y + R * .02); ctx.stroke(); }
    const sg = ctx.createRadialGradient(R * .35, -R * .35, R * .4, 0, 0, R * 1.05); sg.addColorStop(0, 'rgba(60,70,110,0)'); sg.addColorStop(1, 'rgba(60,70,110,.34)'); ctx.fillStyle = sg; ctx.fillRect(-R, -R, 2 * R, 2 * R);
    ctx.restore();
    ctx.strokeStyle = 'rgba(40,50,80,.55)'; ctx.lineWidth = 1; circle(0, 0, R - .5); ctx.stroke();
    ctx = old; paintLayer(c, { ink: '#1A2234', line: .3, lw: .7, brush: .5, hatch: 0, seed: seed % 13 }); moonC = c;
    // the aureole, tooled into silver leaf the way a painter gilds a saint's halo, and the cold glow round it
    const H = Math.ceil(R * 5), [hc, hg] = makeLayer(H, H); ctx = hg; ctx.translate(H / 2, H / 2);
    addB(() => { softDab(0, 0, R * 2.5, '100,130,210', .2); softDab(0, 0, R * 1.65, '185,200,240', .26); softDab(0, 0, R * 1.2, '235,240,252', .24); });
    ctx.strokeStyle = 'rgba(214,222,236,.34)'; ctx.lineWidth = R * .028; circle(0, 0, R * 1.22); ctx.stroke(); ctx.lineWidth = R * .01; circle(0, 0, R * 1.31); ctx.stroke();
    ctx.fillStyle = 'rgba(240,244,252,.42)'; for (let i = 0; i < 80; i++) { const a = i / 80 * TAU; circle(Math.cos(a) * R * 1.265, Math.sin(a) * R * 1.265, R * .01 + .35); ctx.fill(); } // punched dots
    ctx.strokeStyle = 'rgba(214,222,236,.13)'; ctx.lineWidth = .8; ctx.beginPath(); for (let i = 0; i < 56; i++) { const a = i / 56 * TAU, r0 = R * 1.35, r1 = R * (1.48 + (i % 2) * .22); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); } ctx.stroke(); // incised rays
    ctx = old; haloC = hc;
  }
  // a cloud bank of the night sky: lobes of blue-black with their tops lit silver by the moon
  function buildCloud(seed, W, H) {
    const [c, g] = makeLayer(W, H), old = ctx, rnd = mulberry(seed); ctx = g;
    const n = 9 + Math.floor(rnd() * 5), lobes = [];
    for (let i = 0; i < n; i++) { const k = i / (n - 1), x = 16 + k * (W - 32) + (rnd() - .5) * 10, r = (8 + rnd() * 12) * (1 - Math.abs(k - .5) * .9) + 4; lobes.push([x, H * .62 - r * .45 + (rnd() - .5) * 4, r]); }
    for (const [x, y, r] of lobes) { ctx.fillStyle = '#1C2648'; ell(x, y + 3, r * 1.15, r * .7); ctx.fill(); }
    for (const [x, y, r] of lobes) { ctx.fillStyle = '#2A3864'; ell(x, y, r, r * .62); ctx.fill(); }
    ctx.fillStyle = '#1E2850'; ctx.fillRect(10, H * .62, W - 20, 4);
    for (const [x, y, r] of lobes) { ctx.strokeStyle = 'rgba(205,218,245,.75)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.ellipse(x, y, r, r * .62, 0, Math.PI * 1.08, Math.PI * 1.85); ctx.stroke();
      ctx.strokeStyle = 'rgba(160,180,225,.35)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(x, y + 1, r * .9, r * .5, 0, Math.PI * 1.15, Math.PI * 1.75); ctx.stroke(); }
    ctx = old; paintLayer(c, { ink: '#0A0E1E', line: .35, lw: .7, brush: .7, hatch: 0, seed: seed % 9 }); return c;
  }
  function buildClouds(seed) { for (const c of cloudCs) retire(c); cloudCs = [0, 1, 2, 3].map(i => buildCloud(seed * 7 + i * 31, 150 + i * 30, 46)); }
  // the live sky: the moon where it hangs, and clouds drifting slowly across it (nothing twinkles, nothing flickers)
  function skyMoon(th, camX) {
    if (!moonC) return null;
    const x = VW * th.sun[0] - camX * .02, y = Y_OFF + VIEW_H * th.sun[1], H = moonR * 5, S = moonR * 2 + 8;
    ctx.drawImage(haloC, x - H / 2, y - H / 2, H, H); ctx.drawImage(moonC, x - S / 2, y - S / 2, S, S);
    return [x, y];
  }
  function skyClouds(camX, t, y0, y1, a = .9, sp = 1) {
    const W = VW + 420;
    cloudCs.forEach((c, i) => { const w = 150 + i * 30, x = ((i * 271 + 60 - t * (1.6 + i * .5) * sp - camX * (.03 + i * .01)) % W + W) % W - 220, y = y0 + ((i * 47) % Math.max(1, y1 - y0));
      ctx.globalAlpha = a; ctx.drawImage(c, x, y, w, 46); ctx.globalAlpha = 1; });
  }
  // THE STAIR OF MOONLIGHT: the treads of light that climb out of the cloud to the moon (as in the books: it exists only
  // while the moon is up). Laid in once, then hung beside the moon in the live sky
  // it comes down out of the moon's lower limb and lands behind the balustrade, where the landing is
  let stairO = [0, 0];
  function buildStair(R, th) {
    retire(stairC); const mx = VW * th.sun[0], my = Y_OFF + VIEW_H * th.sun[1], ox = mx - 400, oy = my - 10, W = 420, H = Math.max(60, T + 24 - oy), [c, g] = makeLayer(W, H), old = ctx; ctx = g;
    stairO = [ox - mx, oy - my];
    const P0 = [mx - 330 - ox, T + 14 - oy], P1 = [mx - 150 - ox, T - 34 - oy], P2 = [mx - R * .3 - ox, my + R * .72 - oy]; // from the landing up to the moon
    const at = (u) => { const iu = 1 - u; return [iu * iu * P0[0] + 2 * iu * u * P1[0] + u * u * P2[0], iu * iu * P0[1] + 2 * iu * u * P1[1] + u * u * P2[1]]; };
    addB(() => { ctx.lineCap = 'round'; for (const [w, a] of [[30, .05], [14, .08], [5, .14]]) { ctx.strokeStyle = `rgba(200,215,250,${a})`; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(...P0); ctx.quadraticCurveTo(...P1, ...P2); ctx.stroke(); } });
    for (let i = 0; i < 42; i++) { const u = i / 42, [x, y] = at(u), w = lerp(54, 8, Math.pow(u, .6)), h = lerp(5, 1.2, u), rise = lerp(7, 1.6, u);
      ctx.fillStyle = `rgba(150,170,220,${.3 * (1 - u * .4)})`; ctx.fillRect(x - w / 2, y, w, rise); // the riser, in shadow
      ctx.fillStyle = `rgba(232,240,255,${.75 - u * .3})`; ctx.fillRect(x - w / 2, y - h * .3, w, h * .55); // the tread, lit
      ctx.fillStyle = `rgba(255,255,255,${.65 - u * .3})`; ctx.fillRect(x - w / 2, y - h * .3, w, Math.max(.4, h * .16)); }
    ctx = old; stairC = c;
  }
  // stars painted into the far layer: fixed, so they never twinkle; a few larger ones pressed in silver leaf with four points
  function starField(rnd, n, y1, big = 6) {
    for (let i = 0; i < n; i++) { const x = rnd() * AW_W, y = rnd() * y1, r = .3 + rnd() * rnd() * 1.1; ctx.fillStyle = `rgba(230,236,252,${.35 + rnd() * .55})`; circle(x, y, r); ctx.fill(); }
    for (let i = 0; i < big; i++) { const x = rnd() * AW_W, y = 10 + rnd() * y1 * .8, s = 2.4 + rnd() * 2.2;
      awWrap(x, s * 2, (x) => { ctx.fillStyle = 'rgba(236,242,255,.85)'; poly([x, y - s * 2, x + s * .3, y - s * .3, x + s * 2, y, x + s * .3, y + s * .3, x, y + s * 2, x - s * .3, y + s * .3, x - s * 2, y, x - s * .3, y - s * .3]); ctx.fill(); }); }
    addB(() => { for (let i = 0; i < 26; i++) { const x = rnd() * AW_W, y = 20 + rnd() * y1 * .7; awWrap(x, 70, (x) => awSoft(x + i * 8, y + i * 2, 60 + rnd() * 50, 14, '120,140,210', .05)); } }); // a faint river of stars
  }
  // the sea of cloud far below the city, in long bands, the tops lit silver
  function cloudSea(rnd, y0, n, gap, cols, lits) {
    const streak = (x, y, L, h, col, a) => { ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - L, y); ctx.quadraticCurveTo(x - L * .25, y - h * 1.7, x + L, y - h * .25); ctx.quadraticCurveTo(x - L * .1, y + h * .9, x - L, y); ctx.fill(); ctx.globalAlpha = 1; };
    for (let b = 0; b < n; b++) {
      const yb = y0 + b * gap, wv = awWave(51 + b * 7, [[2, 4], [5, 2], [9, 1]]);
      ctx.fillStyle = cols[b]; ctx.fillRect(0, yb + 2, AW_W, gap + 6);
      for (let x = 0; x < AW_W; x += 13) { const y = yb + wv(x) + (rnd() - .5) * 2, L = 20 + rnd() * 40, h = 2 + rnd() * 3.4;
        awWrap(x, L, (x) => { streak(x + 2, y + h, L, h, shade(cols[b], -.3), .7); streak(x, y, L, h, cols[b], .95); streak(x + L * .1, y - h * .6, L * .6, h * .4, lits[b], .55); }); }
    }
  }
  // a mist tower: a ghostly double of one of Amber's towers, standing on cloud; its top dissolves into the night
  function mistTower(x, base, h, w, rnd, P, o = {}) {
    const top = base - h, roofH = w * (o.dome ? .9 : 2.2 + rnd());
    const g = ctx.createLinearGradient(x - w, 0, x + w, 0); g.addColorStop(0, P.dark); g.addColorStop(.55, P.base); g.addColorStop(.85, P.lit); g.addColorStop(1, P.base);
    ctx.fillStyle = g; ctx.globalAlpha = P.a ?? 1; ctx.fillRect(x - w / 2, top, w, h);
    if (o.dome) { ctx.beginPath(); ctx.moveTo(x - w * .55, top + 1); ctx.quadraticCurveTo(x - w * .55, top - roofH, x, top - roofH * 1.1); ctx.quadraticCurveTo(x + w * .55, top - roofH, x + w * .55, top + 1); ctx.fill(); }
    else { poly([x - w * .62, top + 1, x, top - roofH, x + w * .62, top + 1]); ctx.fill(); }
    ctx.globalAlpha = 1;
    if (P.win) for (let i = 0; i < 2 + h / 28; i++) { const y = top + 6 + rnd() * (h - 12); if (rnd() < .35) continue; ctx.fillStyle = P.win; ctx.globalAlpha = .55 + rnd() * .4; ctx.beginPath(); const wx = x + (rnd() - .5) * w * .5; ctx.moveTo(wx - .9, y + 3); ctx.lineTo(wx - .9, y); ctx.quadraticCurveTo(wx, y - 2, wx + .9, y); ctx.lineTo(wx + .9, y + 3); ctx.fill(); ctx.globalAlpha = 1; }
    if (P.rim) { ctx.strokeStyle = P.rim; ctx.lineWidth = .7; ctx.globalAlpha = .7; ctx.beginPath(); ctx.moveTo(x + w / 2 - .4, base); ctx.lineTo(x + w / 2 - .4, top); ctx.lineTo(x + .6, top - roofH + 1); ctx.stroke(); ctx.globalAlpha = 1; }
    if (o.flag) { ctx.strokeStyle = P.base; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(x, top - roofH); ctx.lineTo(x, top - roofH - 7); ctx.stroke(); ctx.fillStyle = P.lit; poly([x, top - roofH - 7, x + 6, top - roofH - 5, x, top - roofH - 3]); ctx.fill(); }
    addB(() => softDab(x, top - roofH * .3, w * 1.6, '170,190,235', .12)); // mist gathering at its crown
  }
  // a floating island of cloud the ghost towers stand on
  function cloudIsle(x, y, w, rnd, col, lit) {
    for (let i = 0; i < 7; i++) { const k = i / 6 - .5, r = w * (.28 + rnd() * .12) * (1 - Math.abs(k) * .8); ctx.fillStyle = col; ell(x + k * w * 1.4, y + rnd() * 3, r * 1.4, r * .55); ctx.fill(); }
    ctx.strokeStyle = lit; ctx.lineWidth = .8; ctx.beginPath(); ctx.ellipse(x, y - 1, w * .8, w * .14, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
  }
  // a network of seams over the paving: rows of slabs, each joint at a slant; returns the slabs (as world 4 lays its glass)
  function crackNet(rnd, y0, rows, o) {
    const plates = []; let y = y0;
    const rowLines = [[]]; for (let x = -20; x <= AW_W + 20; x += 14) rowLines[0].push([x, y0 + (rnd() - .5) * 1.2]);
    for (const h of rows) { const ln = [], ny = y + h; for (let x = -20; x <= AW_W + 20; x += 14 + h * .4) ln.push([x, ny + (rnd() - .5) * h * (o.jag ?? .25)]); rowLines.push(ln); y = ny; }
    const yAt = (ln, x) => { for (let i = 1; i < ln.length; i++) if (ln[i][0] >= x) { const a = ln[i - 1], b = ln[i]; return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0])); } return ln[ln.length - 1][1]; };
    y = y0;
    rows.forEach((h, ri) => {
      const top = rowLines[ri], bot = rowLines[ri + 1], row = awRow(rnd, h * o.min, h * o.max), leans = row.map(() => (rnd() - .5) * h * (o.lean ?? .9));
      row.forEach(([x0, w], j) => {
        const lL = leans[(j + row.length - 1) % row.length], lR = leans[j];
        for (const ox of x0 + w > AW_W ? [0, -AW_W] : [0]) {
          const xa = x0 + ox, xb = x0 + w + ox, pts = [];
          for (let x = xa; x < xb; x += 7) pts.push(x, yAt(top, x)); pts.push(xb, yAt(top, xb), xb + lR, yAt(bot, xb + lR));
          for (let x = xb + lR - 7; x > xa + lL; x -= 7) pts.push(x, yAt(bot, x)); pts.push(xa + lL, yAt(bot, xa + lL));
          plates.push({ pts, x: xa, w, y, h, row: ri, k: rnd(), k2: rnd() });
        }
      });
      y += h;
    });
    return plates;
  }
  // a seam of silver breathing very slowly in the floor (shared by the three locales)
  function liveSeams(seams, camX, t, rgb, a0, a1) {
    const x0 = ((camX % AW_W) + AW_W) % AW_W; ctx.lineWidth = 1.2;
    for (const s of seams) for (const tile of [0, AW_W]) {
      const sx = s.pts[0][0] + tile - x0; if (sx > VW + 4 || s.pts[s.pts.length - 1][0] + tile - x0 < -4) continue;
      ctx.strokeStyle = `rgba(${rgb},${a0 + a1 * Math.sin(t * .5 + s.ph)})`; ctx.beginPath(); s.pts.forEach((p, i) => i ? ctx.lineTo(p[0] + tile - x0, p[1]) : ctx.moveTo(p[0] + tile - x0, p[1])); ctx.stroke();
    }
  }
  // motes of moonlight rising slowly off the stone (fixed in the world, so nothing swims)
  function liveMotes(camX, t, step, y0, y1, rgb, sp = .12) {
    for (let x = ((-camX) % step + step) % step - step; x < VW + step; x += step) {
      const w = Math.floor((x + camX) / step + .5), life = (t * sp + hsh(w)) % 1, px = x + hsh(w + 1) * step + Math.sin(t * .3 + w) * 5, py = lerp(y1, y0, life) - hsh(w + 2) * 20;
      ctx.fillStyle = `rgba(${rgb},${Math.sin(life * Math.PI) * .55})`; circle(px, py, .9 + hsh(w + 3) * .8); ctx.fill();
    }
  }

  // ======================================================================================================
  // THE STAIR OF MOONLIGHT
  // ======================================================================================================
  let stairSeams = [], streetSeams = [], throneSeams = [];
  function moonFar(rnd, th, f) {
    AW_SUN = 1;
    buildMoon(62, 7); buildClouds(31); buildStair(62, th);
    starField(rnd, 260, 170, 7);
    // the real Amber far below, on Kolvir: a dark peak through the cloud, a few warm lights (the only warm thing in this world)
    for (const x0 of [380, 1040]) awWrap(x0, 90, (x) => {
      ctx.fillStyle = '#121A36'; poly([x - 90, 214, x - 40, 186, x - 14, 170, x + 6, 164, x + 30, 178, x + 70, 194, x + 96, 214]); ctx.fill();
      ctx.fillStyle = '#26345E'; poly([x + 6, 164, x + 30, 178, x + 70, 194, x + 96, 214, x + 20, 214]); ctx.fill();
      for (const [dx, dy] of [[-4, 168], [2, 172], [-10, 176], [8, 178], [14, 184], [-2, 180]]) { ctx.fillStyle = 'rgba(255,214,150,.75)'; ctx.fillRect(x + dx, dy, 1, 1.2); }
    });
    cloudSea(rnd, 186, 5, 11, ['#1A2448', '#202C54', '#26345E', '#2C3C68', '#334672'], ['#6A7EAE', '#7C90C0', '#90A4D0', '#A6B8DE', '#BCCAE8']);
    hazeBand(f, th.haze, 150, T, .3);
    // the city ahead, high on its cloud: ghostly doubles of Amber's towers in the mist
    const FP = { base: 'rgba(120,140,195,.5)', lit: 'rgba(205,218,245,.6)', dark: 'rgba(60,76,130,.5)', win: 'rgba(235,242,255,.8)', rim: 'rgba(225,235,255,.7)', a: .8 };
    for (let i = 0; i < 5; i++) awWR(i * 256 + rnd() * 80, 90, rnd, (x, r) => {
      const y = 132 + r() * 26; cloudIsle(x, y + 4, 40 + r() * 20, r, 'rgba(70,86,140,.6)', 'rgba(210,222,250,.6)');
      const n = 2 + Math.floor(r() * 3); for (let k = 0; k < n; k++) mistTower(x + (k - (n - 1) / 2) * 13 + (r() - .5) * 4, y + 2, 20 + r() * 40 * (k === 1 ? 1.5 : 1), 6 + r() * 4, r, FP, { dome: r() < .3, flag: r() < .4 });
    });
    hazeBand(f, th.haze, 196, T, .25);
  }
  // a flight of the moon-stair passing in the distance: treads of light with nothing under them
  function flight(x, y, n, s, dir, a = 1) {
    for (let i = 0; i < n; i++) { const sx = x + i * s * 1.5 * dir, sy = y - i * s;
      ctx.fillStyle = `rgba(120,140,200,${.28 * a})`; ctx.fillRect(sx, sy, s * 1.6, s);
      ctx.fillStyle = `rgba(226,236,255,${.75 * a})`; ctx.fillRect(sx, sy, s * 1.6, Math.max(.8, s * .22)); }
    addB(() => { ctx.strokeStyle = `rgba(190,205,250,${.12 * a})`; ctx.lineWidth = s * 2.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + s * .8, y); ctx.lineTo(x + (n - 1) * s * 1.5 * dir + s * .8, y - (n - 1) * s); ctx.stroke(); });
  }
  // a pillar of mist: a slender column, fluted, with a capital pressed in silver leaf; its shaft thins away at the base
  function mistPillar(x, base, h, w, rnd, dir = AW_SUN) {
    const top = base - h, g = ctx.createLinearGradient(x - w, 0, x + w, 0);
    g.addColorStop(dir > 0 ? 0 : 1, 'rgba(40,52,96,.85)'); g.addColorStop(.5, 'rgba(96,114,170,.8)'); g.addColorStop(dir > 0 ? 1 : 0, 'rgba(190,206,240,.85)');
    ctx.fillStyle = g; ctx.fillRect(x - w / 2, top + 10, w, h - 10);
    ctx.strokeStyle = 'rgba(20,28,56,.35)'; ctx.lineWidth = .7; ctx.beginPath(); for (let k = -1; k <= 1; k++) { ctx.moveTo(x + k * w * .25, top + 12); ctx.lineTo(x + k * w * .25, base); } ctx.stroke();
    const cg = ctx.createLinearGradient(0, top, 0, top + 12); cg.addColorStop(0, '#E8EEF8'); cg.addColorStop(.5, '#A8B4C8'); cg.addColorStop(1, '#6A7690');
    ctx.fillStyle = cg; poly([x - w * .9, top, x + w * .9, top, x + w * .6, top + 6, x + w * .7, top + 10, x - w * .7, top + 10, x - w * .6, top + 6]); ctx.fill(); // the capital, silver leaf
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(x - w * .9, top, w * 1.8, .7);
    ctx.fillStyle = 'rgba(40,48,80,.6)'; for (let k = -2; k <= 2; k++) { circle(x + k * w * .3, top + 3.2, .55); ctx.fill(); } // tooled dots
    ctx.save(); ctx.globalCompositeOperation = 'destination-out'; const fg = ctx.createLinearGradient(0, base - h * .25, 0, base); fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(1, 'rgba(0,0,0,.85)'); ctx.fillStyle = fg; ctx.fillRect(x - w, base - h * .25, w * 2, h * .25 + 2); ctx.restore(); // it stands on nothing
  }
  // a lamp of the ghost city: a slender iron post, a lantern with a cold white flame
  function coldLamp(x, base, h, rnd) {
    ctx.fillStyle = '#141A30'; ctx.fillRect(x - 1, base - h, 2, h); ctx.fillStyle = '#5A6890'; ctx.fillRect(x + .2, base - h, .6, h);
    ctx.fillStyle = '#141A30'; poly([x - 4, base - h, x + 4, base - h, x + 2.6, base - h - 8, x - 2.6, base - h - 8]); ctx.fill(); poly([x - 3.6, base - h - 8, x + 3.6, base - h - 8, x, base - h - 12]); ctx.fill();
    awGlow('rgba(220,232,255,.95)', 8, () => { ctx.fillStyle = '#EEF4FF'; ell(x, base - h - 4, 1.5, 2.6); ctx.fill(); });
    addB(() => softDab(x, base - h - 4, 16, '200,215,250', .3));
  }
  function moonMid(rnd) {
    AW_SUN = 1;
    for (let i = 0; i < 24; i++) { const x = rnd() * AW_W, y = 212 + rnd() * 22, r = 30 + rnd() * 40; awWrap(x, r, (x) => awSoft(x, y, r, r * .28, '90,110,175', .32)); } // cloud rising behind the landing
    // flights of the moon-stair crossing the sky: some climbing, some falling away into nothing
    for (let i = 0; i < 5; i++) awWR(70 + i * 250 + rnd() * 80, 120, rnd, (x, r) => flight(x, T - 18 - r() * 40, 6 + Math.floor(r() * 7), 4 + r() * 2.5, r() < .5 ? 1 : -1, .8 + r() * .2));
    for (let i = 0; i < 5; i++) awWR(150 + i * 256 + rnd() * 70, 20, rnd, (x, r) => mistPillar(x, T + 4, 110 + r() * 60, 11 + r() * 5, r));
    for (let i = 0; i < 6; i++) awWR(rnd() * AW_W, 10, rnd, (x, r) => coldLamp(x, T + 2, 44 + r() * 14, r));
    // banners of mist hung between the pillars
    for (let i = 0; i < 4; i++) awWR(40 + i * 320 + rnd() * 60, 60, rnd, (x, r) => { const y = T - 120 - r() * 30;
      ctx.strokeStyle = 'rgba(200,214,245,.35)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(x - 50, y); ctx.quadraticCurveTo(x, y + 14, x + 50, y); ctx.stroke();
      for (let k = 0; k < 5; k++) { const bx = x - 40 + k * 20, L = 26 + r() * 30, by = y + Math.sin((k + .5) / 5 * Math.PI) * 12; ctx.fillStyle = 'rgba(170,186,230,.22)'; poly([bx - 5, by, bx + 5, by, bx + 4, by + L, bx, by + L - 5, bx - 4, by + L]); ctx.fill(); } });
  }
  function moonFloor(rnd, th) {
    stairSeams = [];
    { const g = ctx.createLinearGradient(0, T - 3, 0, VH); g.addColorStop(0, '#5A6C9E'); g.addColorStop(.25, '#34446E'); g.addColorStop(1, '#141C38'); ctx.fillStyle = g; ctx.fillRect(0, T - 3, AW_W, VH - T + 3); }
    // the landing: great slabs of moonstone, pale where the moon catches them; here and there one is so thin the sky shows through
    const plates = crackNet(rnd, T + 4, [10, 13, 16, 20, 24, 28], { min: 2.2, max: 4.4, jag: .12, lean: .5 });
    for (const p of plates) {
      const l = p.row / 5, thin = p.k < .06 && p.row > 0 && p.row < 5;
      if (thin) { poly(p.pts); const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h); g.addColorStop(0, 'rgba(10,16,40,.85)'); g.addColorStop(1, 'rgba(40,56,110,.75)'); ctx.fillStyle = g; ctx.fill();
        ctx.save(); poly(p.pts); ctx.clip(); for (let i = 0; i < 7; i++) { ctx.fillStyle = 'rgba(240,244,255,.75)'; circle(p.x + rnd() * p.w, p.y + rnd() * p.h, .5); ctx.fill(); } ctx.restore(); continue; }
      poly(p.pts); const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h); g.addColorStop(0, awMix('#C4D0E8', '#4A5A8A', l)); g.addColorStop(1, awMix('#8494BC', '#2A3860', l)); ctx.fillStyle = g; ctx.fill();
      ctx.save(); poly(p.pts); ctx.clip();
      for (let i = 0; i < 3; i++) dab(p.x + rnd() * p.w, p.y + rnd() * p.h, p.h * (.3 + rnd() * .4), rnd() < .5 ? '#EEF2FA' : '#40507E', .14);
      if (p.k2 < .35) { ctx.strokeStyle = 'rgba(240,246,255,.22)'; ctx.lineWidth = .6; const cx = p.x + p.w * (.3 + p.k * .4), cy = p.y + p.h * .5; for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.ellipse(cx, cy, k * p.h * .7, k * p.h * .2, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); } } // the sheen of the stone
      ctx.restore();
    }
    for (const p of plates) { // the joints: silver leaf laid into every seam, burnished on its upper lip
      ctx.strokeStyle = 'rgba(20,26,52,.7)'; ctx.lineWidth = 1.4 + p.row * .1; poly(p.pts); ctx.stroke();
      ctx.strokeStyle = 'rgba(200,212,232,.75)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(p.pts[0], p.pts[1] + .8); ctx.lineTo(p.x + p.w - 1, p.pts[1] + .8); ctx.stroke();
      if (p.k2 > .7 && p.x >= 0 && p.x < AW_W - 120) { const pts = [[p.x + 2, p.pts[1] + .8], [p.x + p.w * .5, p.pts[1] + .8], [p.x + p.w - 2, p.pts[1] + .8]]; stairSeams.push({ pts, ph: rnd() * TAU }); }
    }
    // a stair-rod of silver leaf runs along the landing every few yards, with a tooled rosette where it meets the next
    for (let i = 0; i < 6; i++) { const x = 100 + i * 213 + rnd() * 30, y = T + 52 + rnd() * 10;
      ctx.save(); ctx.translate(x, y); ctx.scale(1, .32); leafLine(() => { ctx.arc(0, 0, 11, 0, TAU); ctx.moveTo(15, 0); ctx.arc(0, 0, 15, 0, TAU); }, 1); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; ctx.fillStyle = 'rgba(232,238,250,.85)'; circle(Math.cos(a) * 7, Math.sin(a) * 7, 1.2); ctx.fill(); } ctx.restore(); }
    // the back of the landing: a balustrade of light, glass posts capped in silver
    const by = T + 3; ctx.fillStyle = 'rgba(30,40,80,.8)'; ctx.fillRect(0, by - 2, AW_W, 4);
    for (let x = 4; x < AW_W; x += 9) { const g = ctx.createLinearGradient(x - 2, 0, x + 2, 0); g.addColorStop(0, 'rgba(90,110,170,.6)'); g.addColorStop(.6, 'rgba(225,235,255,.7)'); g.addColorStop(1, 'rgba(150,170,220,.6)'); ctx.fillStyle = g; ctx.fillRect(x - 1.3, by - 15, 2.6, 13); ctx.fillStyle = '#C8D2E2'; ctx.fillRect(x - 2, by - 16, 4, 1.6); }
    ctx.fillStyle = '#B8C4D8'; ctx.fillRect(0, by - 18, AW_W, 2.4); ctx.fillStyle = '#F4F8FF'; ctx.fillRect(0, by - 18, AW_W, .8);
    // the near edge: the landing simply stops, and under it is the night and the cloud far below
    const ey = 349, g = ctx.createLinearGradient(0, ey, 0, VH); g.addColorStop(0, '#0A1028'); g.addColorStop(1, '#26365E'); ctx.fillStyle = g; ctx.fillRect(0, ey, AW_W, VH - ey);
    ctx.fillStyle = '#9AAAC8'; ctx.fillRect(0, ey - 2, AW_W, 2); ctx.fillStyle = '#EEF2FA'; ctx.fillRect(0, ey - 2, AW_W, .6);
    for (let x = 3; x < AW_W; x += 13) { const d = 2 + Math.abs(Math.sin(x * .7)) * 5; ctx.fillStyle = 'rgba(180,196,230,.45)'; poly([x - 2, ey, x + 2, ey, x, ey + d]); ctx.fill(); } // light dripping off the edge
    const sh = ctx.createLinearGradient(0, VH - 40, 0, VH - 11); sh.addColorStop(0, 'rgba(6,8,20,0)'); sh.addColorStop(1, 'rgba(6,8,20,.4)'); ctx.fillStyle = sh; ctx.fillRect(0, VH - 40, AW_W, 29);
  }
  THEMES.moon = {
    name: 'the stair of moonlight', sky: ['#04060E', '#0C1430', '#1E2C5A', '#4A5C8E'], sun: [0.74, 0.16, MOONRGB], haze: '110,130,190',
    floorA: '#5A6C9E', floorB: '#141C38', path: '#C8D2E2', skyKind: 'none',
    grade: { desat: .12, top: 'rgba(40,60,150,.5)', bot: 'rgba(150,170,220,.32)', vig: 'rgba(2,4,14,.66)' },
    liveSky(camX, t) {
      skyMoon(THEMES.moon, camX);
      skyClouds(camX, t, Y_OFF + 10, Y_OFF + 70, .85);
    },
    liveFloor(camX, t) {
      if (stairC) { // the stair comes down out of the moon to the landing: light laid over the far cloud, stopping at the balustrade
        const th = THEMES.moon, mx = VW * th.sun[0] - camX * .02, my = Y_OFF + VIEW_H * th.sun[1];
        ctx.save(); ctx.beginPath(); ctx.rect(0, Y_OFF, VW, T - 18 - Y_OFF); ctx.clip(); ctx.globalAlpha = .9; ctx.drawImage(stairC, mx + stairO[0], my + stairO[1], stairC.width / K, stairC.height / K); ctx.restore();
      }
      liveSeams(stairSeams, camX, t, '235,242,255', .12, .1); liveMotes(camX, t, 110, T - 30, T + 90, PALE);
    },
  };
  AW_FAR.moon = moonFar; AW_MID.moon = moonMid; AW_FLOOR.moon = moonFloor;

  // ======================================================================================================
  // THE STREETS OF TIR-NA NOG'TH: the ghost of Amber's streets, its housetops going to mist
  // ======================================================================================================
  // a keep of the ghost palace in the far skyline: a cluster of towers round a great hall, all in mist
  function ghostKeep(x, base, s, rnd, P) {
    ctx.fillStyle = P.dark; ctx.globalAlpha = P.a; ctx.fillRect(x - 40 * s, base - 46 * s, 80 * s, 46 * s); poly([x - 44 * s, base - 46 * s, x, base - 70 * s, x + 44 * s, base - 46 * s]); ctx.fill(); ctx.globalAlpha = 1;
    for (const [dx, h, w, dome] of [[-46, 90, 12, 0], [-24, 120, 14, 1], [0, 150, 16, 0], [24, 112, 13, 0], [46, 84, 11, 1]]) mistTower(x + dx * s, base, h * s, w * s, rnd, P, { dome, flag: !dome });
  }
  function streetsFar(rnd, th, f) {
    AW_SUN = -1;
    buildMoon(80, 19); buildClouds(57);
    starField(rnd, 160, 150, 4);
    cloudSea(rnd, 206, 3, 10, ['#1A2448', '#202C54', '#26345E'], ['#6A7EAE', '#8094C4', '#98AAD4']);
    // the skyline, three ranks deep: the far ones barely there, the near ones standing dark against the moon with silver rims
    const R1 = { base: 'rgba(110,130,190,.32)', lit: 'rgba(200,214,245,.4)', dark: 'rgba(70,86,140,.32)', win: null, rim: null, a: .7 };
    for (let i = 0; i < 26; i++) awWR(rnd() * AW_W, 20, rnd, (x, r) => mistTower(x, 206, 40 + r() * 70, 6 + r() * 6, r, R1, { dome: r() < .3 }));
    awWR(300, 70, rnd, (x, r) => ghostKeep(x, 208, .9, r, Object.assign({}, R1, { dark: 'rgba(80,96,150,.4)' })));
    hazeBand(f, th.haze, 150, T, .3);
    const R2 = { base: 'rgba(56,72,126,.72)', lit: 'rgba(170,188,232,.7)', dark: 'rgba(30,40,80,.75)', win: 'rgba(225,235,255,.85)', rim: 'rgba(220,230,255,.75)', a: .9 };
    for (let i = 0; i < 14; i++) awWR(i * 91 + rnd() * 50, 20, rnd, (x, r) => mistTower(x, 220, 50 + r() * 80, 8 + r() * 7, r, R2, { dome: r() < .25, flag: r() < .4 }));
    awWR(900, 70, rnd, (x, r) => ghostKeep(x, 222, 1.05, r, R2));
    // walls between the towers: a rampart walk with merlons
    for (let i = 0; i < 6; i++) awWR(rnd() * AW_W, 70, rnd, (x, r) => { const y = 222 - 18 - r() * 10, w = 60 + r() * 60; ctx.fillStyle = 'rgba(36,48,92,.8)'; ctx.fillRect(x - w / 2, y, w, 222 - y); for (let k = -w / 2; k < w / 2; k += 6) ctx.fillRect(x + k, y - 4, 3.4, 4); ctx.fillStyle = 'rgba(200,214,245,.45)'; ctx.fillRect(x - w / 2, y, w, .7); });
    hazeBand(f, th.haze, 196, T, .35);
  }
  // a house of the ghost city: dressed stone, a steep slate roof with a ridge of silver, lancet windows lit from inside
  function ghostHouse(x, w, h, rnd, kind) {
    const base = T + 4, top = base - h, dir = AW_SUN;
    const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(dir > 0 ? 0 : 1, '#18223F'); g.addColorStop(.5, '#26345C'); g.addColorStop(dir > 0 ? 1 : 0, '#3E5080'); ctx.fillStyle = g; ctx.fillRect(x, top, w, h);
    ctx.strokeStyle = 'rgba(8,12,28,.5)'; ctx.lineWidth = .6; ctx.beginPath(); for (let y = top + 9; y < base; y += 9) { ctx.moveTo(x, y); ctx.lineTo(x + w, y); for (let bx = x + ((y / 9) % 2) * 9; bx < x + w; bx += 18) { ctx.moveTo(bx, y); ctx.lineTo(bx, y + 9); } } ctx.stroke(); // stone courses
    ctx.fillStyle = dir > 0 ? 'rgba(200,214,245,.35)' : 'rgba(200,214,245,.35)'; ctx.fillRect(dir > 0 ? x + w - 1.2 : x, top, 1.2, h); // the moonlit edge
    // the roof
    const rh = w * (kind === 'tower' ? 1.5 : .62);
    if (kind === 'step') { // a stepped gable
      ctx.fillStyle = '#121A33'; const n = 4; for (let i = 0; i < n; i++) { const sw = w * (1 - i / n), sx = x + (w - sw) / 2; ctx.fillRect(sx, top - (i + 1) * rh / n, sw, rh / n + .5); }
      ctx.fillStyle = 'rgba(205,218,245,.55)'; for (let i = 0; i < n; i++) { const sw = w * (1 - i / n), sx = x + (w - sw) / 2; ctx.fillRect(sx, top - (i + 1) * rh / n, sw, .7); }
    } else {
      ctx.fillStyle = '#121A33'; poly([x - 3, top + 1, x + w / 2, top - rh, x + w + 3, top + 1]); ctx.fill();
      ctx.strokeStyle = 'rgba(20,28,56,.8)'; ctx.lineWidth = .6; ctx.beginPath(); for (let k = 1; k < 6; k++) { const y = top + 1 - rh * k / 6, hw = (w / 2 + 3) * (1 - k / 6); ctx.moveTo(x + w / 2 - hw, y); ctx.lineTo(x + w / 2 + hw, y); } ctx.stroke(); // slates
      ctx.strokeStyle = '#C8D2E4'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + w / 2, top - rh); ctx.lineTo(dir > 0 ? x + w + 3 : x - 3, top + 1); ctx.stroke(); // the ridge, silver
      ctx.fillStyle = '#C8D2E4'; circle(x + w / 2, top - rh - 1.5, 1.6); ctx.fill(); // a finial
    }
    // windows: rows of lancets; some lit with the cold light, some dark
    const floors = Math.max(2, Math.floor((h - 26) / 26)), cols = Math.max(2, Math.floor(w / 22));
    for (let fl = 0; fl < floors; fl++) for (let c = 0; c < cols; c++) {
      const wx = x + (c + .5) * w / cols, wy = top + 12 + fl * 26, lit = rnd() < .55;
      const lancet = () => { ctx.beginPath(); ctx.moveTo(wx - 3, wy + 12); ctx.lineTo(wx - 3, wy + 3); ctx.quadraticCurveTo(wx - 3, wy - 2, wx, wy - 4); ctx.quadraticCurveTo(wx + 3, wy - 2, wx + 3, wy + 3); ctx.lineTo(wx + 3, wy + 12); ctx.closePath(); };
      ctx.fillStyle = '#0A0F22'; lancet(); ctx.fill();
      if (lit) awGlow('rgba(210,225,255,.9)', 5, () => { ctx.fillStyle = 'rgba(220,232,255,.85)'; ctx.save(); ctx.translate(wx, wy + 4); ctx.scale(.75, .8); ctx.translate(-wx, -wy - 4); lancet(); ctx.fill(); ctx.restore(); });
      ctx.strokeStyle = '#8A98B8'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(wx, wy - 3); ctx.lineTo(wx, wy + 12); ctx.moveTo(wx - 3, wy + 5); ctx.lineTo(wx + 3, wy + 5); ctx.stroke(); // the tracery
      ctx.strokeStyle = '#4E5E88'; ctx.lineWidth = .7; lancet(); ctx.stroke();
    }
    // the door at street level: an arch with a lamp beside it
    const dx = x + w * (.3 + rnd() * .4); ctx.fillStyle = '#070B1A'; ctx.beginPath(); ctx.moveTo(dx - 6, base); ctx.lineTo(dx - 6, base - 14); ctx.quadraticCurveTo(dx - 6, base - 22, dx, base - 24); ctx.quadraticCurveTo(dx + 6, base - 22, dx + 6, base - 14); ctx.lineTo(dx + 6, base); ctx.fill();
    ctx.strokeStyle = '#7A88AA'; ctx.lineWidth = .8; ctx.stroke();
    if (rnd() < .5) { const bx = x + w * (rnd() < .5 ? .2 : .8), by = top + 20; ctx.fillStyle = '#10162C'; ctx.fillRect(bx - 10, by + 14, 20, 2); for (let k = -9; k <= 9; k += 3) ctx.fillRect(bx + k, by + 8, .9, 6); ctx.fillRect(bx - 10, by + 7, 20, 1.2); } // a balcony
    // the top of the house is not quite there: it thins into the night
    ctx.save(); ctx.globalCompositeOperation = 'destination-out'; const fg = ctx.createLinearGradient(0, top - rh - 2, 0, top + h * .6); fg.addColorStop(0, 'rgba(0,0,0,.96)'); fg.addColorStop(.45, 'rgba(0,0,0,.6)'); fg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = fg; ctx.fillRect(x - 6, top - rh - 6, w + 12, h * .6 + rh + 8); ctx.restore();
    addB(() => { for (let i = 0; i < 4; i++) softDab(x + rnd() * w, top - rh * .4 + rnd() * 20, 20 + rnd() * 16, '160,180,230', .1); }); // and mist where it ends
  }
  // a banner of the ghost court hung from a bracket: pale silk with the unicorn of Amber in silver leaf
  function unicornBanner(x, y, L, rnd) {
    ctx.fillStyle = '#10162C'; ctx.fillRect(x - 1, y - 2, 14, 2); ctx.fillRect(x, y - 2, 1.4, 6);
    const cloth = [x + 1, y]; for (let i = 0; i <= 5; i++) { const k = i / 5; cloth.push(x + 13 + Math.sin(k * 4 + rnd()) * 1.4, y + k * L); } cloth.push(x + 7, y + L + 5, x + 1, y + L);
    poly(cloth); const g = ctx.createLinearGradient(x, 0, x + 13, 0); g.addColorStop(0, 'rgba(120,138,190,.75)'); g.addColorStop(1, 'rgba(206,218,245,.75)'); ctx.fillStyle = g; ctx.fill();
    const cx = x + 7, cy = y + L * .4; ctx.strokeStyle = '#E8EEF8'; ctx.lineWidth = .8; ctx.beginPath(); // the unicorn's head, rearing
    ctx.moveTo(cx - 3, cy + 5); ctx.quadraticCurveTo(cx - 3.4, cy, cx - 1, cy - 2.4); ctx.lineTo(cx + 2.6, cy - 1.4); ctx.lineTo(cx + 1, cy + .6); ctx.quadraticCurveTo(cx + .4, cy + 3, cx + 1.6, cy + 5); ctx.moveTo(cx - 1, cy - 2.4); ctx.lineTo(cx + 1.4, cy - 7); ctx.stroke();
  }
  function streetsMid(rnd) {
    AW_SUN = -1;
    // the houses stand shoulder to shoulder along the back of the street, with narrow wynds between them
    let x = 0; const kinds = ['gable', 'gable', 'step', 'tower', 'gable'];
    while (x < AW_W - 40) { const w = 50 + rnd() * 56, h = 56 + rnd() * 56, k = kinds[Math.floor(rnd() * kinds.length)]; awWR(x, w + 10, rnd, (xx, r) => ghostHouse(xx, k === 'tower' ? w * .6 : w, k === 'tower' ? h + 34 : h, r, k)); x += w + 14 + rnd() * 40; }
    for (let i = 0; i < 6; i++) awWR(rnd() * AW_W, 20, rnd, (x, r) => unicornBanner(x, T - 70 - r() * 30, 30 + r() * 16, r));
    for (let i = 0; i < 7; i++) awWR(rnd() * AW_W, 10, rnd, (x, r) => coldLamp(x, T + 6, 50 + r() * 10, r));
  }
  function streetsFloor(rnd, th) {
    streetSeams = [];
    { const g = ctx.createLinearGradient(0, T - 3, 0, VH); g.addColorStop(0, '#4E5E8E'); g.addColorStop(.3, '#2E3C66'); g.addColorStop(1, '#121A34'); ctx.fillStyle = g; ctx.fillRect(0, T - 3, AW_W, VH - T + 3); }
    // the setts: small blocks of moonstone, worn into rounded tops, pale where the moon finds them
    const plates = crackNet(rnd, T + 10, [7, 8, 9, 10, 11, 12, 13, 15, 17], { min: 1.5, max: 2.6, jag: .2, lean: .6 });
    for (const p of plates) { const l = p.row / 8;
      poly(p.pts); const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h); g.addColorStop(0, awMix(p.k < .5 ? '#A8B6D6' : '#90A0C6', '#3A4878', l)); g.addColorStop(1, awMix('#5E6E9C', '#1E2A50', l)); ctx.fillStyle = g; ctx.fill();
      ctx.save(); poly(p.pts); ctx.clip(); dab(p.x + p.w * .55, p.y + p.h * .3, p.h * .45, '#E8EEF8', .16); ctx.restore(); }
    for (const p of plates) { ctx.strokeStyle = 'rgba(10,14,32,.75)'; ctx.lineWidth = 1 + p.row * .08; poly(p.pts); ctx.stroke(); }
    // the gutters: channels of silver leaf running the length of the street
    for (const gy of [T + 30, T + 92]) { const wv = awWave(gy, [[3, 1.2], [7, .6]]), gl = () => { ctx.moveTo(0, gy + wv(0)); for (let x = 6; x <= AW_W; x += 6) ctx.lineTo(x, gy + wv(x)); };
      ctx.strokeStyle = 'rgba(8,12,30,.55)'; ctx.lineWidth = 4; ctx.beginPath(); gl(); ctx.stroke(); leafLine(gl, .9, .5);
      const pts = []; for (let x = 0; x <= AW_W; x += 20) pts.push([x, gy + wv(x) - .3]); for (let i = 0; i + 6 < pts.length; i += 9) streetSeams.push({ pts: pts.slice(i, i + 6), ph: i * .7 }); }
    // puddles holding the moon
    for (let i = 0; i < 7; i++) { const x = 60 + i * 180 + rnd() * 60, y = T + 40 + rnd() * 50, w = 18 + rnd() * 26;
      ctx.fillStyle = 'rgba(14,20,44,.75)'; ell(x, y, w, w * .22); ctx.fill();
      ctx.save(); ell(x, y, w, w * .22); ctx.clip(); ctx.fillStyle = 'rgba(200,214,245,.35)'; ell(x + w * .2, y - w * .05, w * .5, w * .1); ctx.fill(); ctx.fillStyle = 'rgba(240,244,252,.7)'; ell(x - w * .3, y, w * .12, w * .06); ctx.fill(); ctx.restore();
      ctx.strokeStyle = 'rgba(200,214,240,.4)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.ellipse(x, y, w, w * .22, 0, Math.PI * .05, Math.PI * .95); ctx.stroke(); }
    // the steps up to the doors along the back of the street, and the kerb at the front
    const by = T + 4; ctx.fillStyle = '#1A2446'; ctx.fillRect(0, by - 4, AW_W, 6); ctx.fillStyle = '#8A98BC'; ctx.fillRect(0, by - 4, AW_W, 1); ctx.fillStyle = '#2A3660'; ctx.fillRect(0, by + 2, AW_W, 3); ctx.fillStyle = '#6E7EA6'; ctx.fillRect(0, by + 2, AW_W, .7);
    const ey = 350; ctx.fillStyle = '#0A1024'; ctx.fillRect(0, ey, AW_W, VH - ey); ctx.fillStyle = '#7A8AB2'; ctx.fillRect(0, ey - 1, AW_W, 2); for (let x = 0; x < AW_W; x += 22) { ctx.fillStyle = 'rgba(10,14,32,.8)'; ctx.fillRect(x, ey - 1, 1, 6); }
    const sh = ctx.createLinearGradient(0, VH - 44, 0, VH - 10); sh.addColorStop(0, 'rgba(6,8,20,0)'); sh.addColorStop(1, 'rgba(6,8,20,.42)'); ctx.fillStyle = sh; ctx.fillRect(0, VH - 44, AW_W, 34);
  }
  THEMES.moon2 = {
    name: 'the streets of tir-na nog\'th', sky: ['#03050C', '#0A1228', '#1A2650', '#3A4C7E'], sun: [0.3, 0.26, MOONRGB], haze: '100,120,180',
    floorA: '#4E5E8E', floorB: '#121A34', path: '#C8D2E2', skyKind: 'none',
    grade: { desat: .1, top: 'rgba(40,56,150,.52)', bot: 'rgba(140,160,215,.3)', vig: 'rgba(2,4,12,.7)' },
    liveSky(camX, t) { skyMoon(THEMES.moon2, camX); skyClouds(camX, t, Y_OFF + 4, Y_OFF + 60, .9, .8); },
    liveFloor(camX, t) { liveSeams(streetSeams, camX, t, '235,242,255', .14, .1); liveMotes(camX, t, 130, T - 20, T + 100, PALE, .1); },
  };
  AW_FAR.moon2 = streetsFar; AW_MID.moon2 = streetsMid; AW_FLOOR.moon2 = streetsFloor;

  // ======================================================================================================
  // THE MOON THRONE: an open hall at the crown of the city; an empty throne of mist sits against the full moon
  // ======================================================================================================
  const THRONE_X = 483; // where the throne stands in the middle layer, so it is centred on the locked arena
  function throneFar(rnd, th, f) {
    AW_SUN = 1;
    buildMoon(88, 23); buildClouds(71);
    starField(rnd, 220, 160, 8);
    cloudSea(rnd, 200, 4, 10, ['#161E40', '#1C264C', '#222E58', '#283664'], ['#5E72A4', '#7084B8', '#8698C8', '#9CAED6']);
    // far colonnades curving away to either side, all mist
    for (const side of [-1, 1]) for (let i = 0; i < 9; i++) { const x = THRONE_X + side * (300 + i * 34), y = 196 - i * 2, h = 60 - i * 4; awWrap(x, 10, (x) => { ctx.fillStyle = `rgba(110,130,190,${.5 - i * .04})`; ctx.fillRect(x - 3, y - h, 6, h); ctx.fillStyle = `rgba(210,222,250,${.5 - i * .04})`; ctx.fillRect(x - 4, y - h - 3, 8, 3); }); }
    hazeBand(f, th.haze, 170, T, .3);
  }
  function throneMid(rnd) {
    AW_SUN = 1;
    const X = THRONE_X;
    // the great columns of the hall, the arch they carry framing the moon
    const col = (x, w) => { const g = ctx.createLinearGradient(x - w, 0, x + w, 0); g.addColorStop(0, 'rgba(26,34,66,.95)'); g.addColorStop(.55, 'rgba(70,86,140,.92)'); g.addColorStop(1, 'rgba(170,186,230,.9)'); ctx.fillStyle = g; ctx.fillRect(x - w / 2, 0, w, T + 6);
      ctx.strokeStyle = 'rgba(10,14,34,.4)'; ctx.lineWidth = .8; ctx.beginPath(); for (let k = -2; k <= 2; k++) { ctx.moveTo(x + k * w * .18, 0); ctx.lineTo(x + k * w * .18, T + 6); } ctx.stroke();
      const bg = ctx.createLinearGradient(0, T - 16, 0, T + 6); bg.addColorStop(0, '#C8D2E6'); bg.addColorStop(1, '#5A6890'); ctx.fillStyle = bg; ctx.fillRect(x - w * .7, T - 12, w * 1.4, 16); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(x - w * .7, T - 12, w * 1.4, .7); }; // the plinth, silver leaf
    for (const dx of [-430, -250, 250, 430]) awWrap(X + dx, 30, (x) => col(x, Math.abs(dx) > 300 ? 22 : 30));
    for (const s of [-1, 1]) awWrap(X + s * 250, 60, (x) => { // the springing of the arch
      ctx.strokeStyle = 'rgba(30,40,76,.95)'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(x, 40); ctx.quadraticCurveTo(x - s * 40, 4, x - s * 130, -10); ctx.stroke();
      leafLine(() => { ctx.moveTo(x - s * 8, 34); ctx.quadraticCurveTo(x - s * 46, 2, x - s * 130, -12); }, 1.6, .9); });
    // the dais and the throne of mist upon it
    for (let i = 0; i < 4; i++) { const w = 150 - i * 26, y = T + 6 - i * 6; ctx.fillStyle = i % 2 ? '#26345E' : '#2E3E6C'; ctx.fillRect(X - w / 2, y - 6, w, 6); ctx.fillStyle = '#B8C4DA'; ctx.fillRect(X - w / 2, y - 6, w, .9); }
    const ty = T - 18;
    ctx.save(); ctx.globalAlpha = .82;
    const tg = ctx.createLinearGradient(X - 30, 0, X + 30, 0); tg.addColorStop(0, '#3A4C82'); tg.addColorStop(.6, '#8A9ED0'); tg.addColorStop(1, '#D2DCF2'); ctx.fillStyle = tg;
    ctx.beginPath(); ctx.moveTo(X - 26, ty); ctx.lineTo(X - 26, ty - 70); ctx.quadraticCurveTo(X - 26, ty - 104, X, ty - 118); ctx.quadraticCurveTo(X + 26, ty - 104, X + 26, ty - 70); ctx.lineTo(X + 26, ty); ctx.closePath(); ctx.fill(); // the high back, a pointed arch
    ctx.fillStyle = '#1E2A52'; ctx.fillRect(X - 34, ty - 30, 68, 8); ctx.fillRect(X - 34, ty - 22, 8, 22); ctx.fillRect(X + 26, ty - 22, 8, 22); // the arms and the seat
    ctx.restore();
    leafLine(() => { ctx.moveTo(X - 26, ty - 70); ctx.quadraticCurveTo(X - 26, ty - 104, X, ty - 118); ctx.quadraticCurveTo(X + 26, ty - 104, X + 26, ty - 70); }, 1.4);
    ctx.strokeStyle = '#E8EEF8'; ctx.lineWidth = 1; ctx.beginPath(); // the unicorn of Amber, rearing, on the back of the throne
    const ux = X, uy = ty - 66; ctx.moveTo(ux - 8, uy + 22); ctx.quadraticCurveTo(ux - 10, uy + 6, ux - 3, uy - 2); ctx.lineTo(ux + 6, uy + 1); ctx.lineTo(ux + 3, uy + 5); ctx.quadraticCurveTo(ux + 1, uy + 12, ux + 5, uy + 22);
    ctx.moveTo(ux - 3, uy - 2); ctx.lineTo(ux + 4, uy - 16); ctx.moveTo(ux - 6, uy + 12); ctx.lineTo(ux - 14, uy + 6); ctx.moveTo(ux - 4, uy + 16); ctx.lineTo(ux - 12, uy + 14); ctx.stroke();
    addB(() => { softDab(X, ty - 60, 70, '170,190,240', .18); for (let i = 0; i < 6; i++) softDab(X + (rnd() - .5) * 60, ty - rnd() * 90, 16 + rnd() * 14, '210,222,250', .12); }); // mist pouring off it
    // banners of mist down the columns
    for (const dx of [-250, 250]) awWrap(X + dx, 20, (x) => { for (let k = 0; k < 2; k++) unicornBanner(x - 14 + k * 16, 70 + k * 10, 70 + k * 8, rnd); });
    for (let i = 0; i < 4; i++) awWR(rnd() * AW_W, 10, rnd, (x, r) => { if (Math.abs(x - X) < 200) return; coldLamp(x, T + 6, 56, r); });
  }
  // THE PATTERN, as the ghost city remembers it: a labyrinth of curves laid into the floor in silver leaf
  function ghostPattern(cx, cy, R, rnd) {
    const ry = .2, seams = [];
    for (let i = 0; i < 7; i++) {
      const r = R * (1 - i * .12), gap = i * 1.9 + .6, gw = .32;
      const arc = () => { ctx.ellipse(cx, cy, r, r * ry, 0, gap + gw, gap + TAU - gw); };
      leafLine(() => arc(), 1.1, .7 - i * .05);
      const pts = []; for (let a = gap + gw; a < gap + TAU - gw; a += .25) pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * ry]);
      for (let k = 0; k + 5 < pts.length; k += 7) seams.push({ pts: pts.slice(k, k + 5), ph: i + k * .2 });
      if (i < 6) { const r2 = R * (1 - (i + 1) * .12); leafLine(() => { for (const a of [gap + gw, gap - gw]) { ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r * ry); ctx.quadraticCurveTo(cx + Math.cos(gap) * (r + r2) * .5, cy + Math.sin(gap) * (r + r2) * .5 * ry, cx + Math.cos(a) * r2, cy + Math.sin(a) * r2 * ry); } }, .9, .55); } // the turns where the path doubles back
    }
    awGlow('rgba(225,235,255,.9)', 8, () => { ctx.fillStyle = 'rgba(235,242,255,.85)'; ell(cx, cy, 6, 1.6); ctx.fill(); }); // its heart
    return seams;
  }
  function throneFloor(rnd, th) {
    { const g = ctx.createLinearGradient(0, T - 3, 0, VH); g.addColorStop(0, '#6A7CAE'); g.addColorStop(.2, '#3A4A7A'); g.addColorStop(1, '#10183A'); ctx.fillStyle = g; ctx.fillRect(0, T - 3, AW_W, VH - T + 3); }
    // polished moon-marble in great squares, veined, holding a sheen
    const plates = crackNet(rnd, T + 4, [12, 16, 21, 27, 34], { min: 2.6, max: 3.6, jag: .05, lean: 1.4 });
    for (const p of plates) { const l = p.row / 4;
      poly(p.pts); const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h); g.addColorStop(0, awMix(p.k < .5 ? '#B4C2E0' : '#9AAAD0', '#40507E', l)); g.addColorStop(1, awMix('#7686B2', '#1E2A52', l)); ctx.fillStyle = g; ctx.fill();
      ctx.save(); poly(p.pts); ctx.clip(); ctx.strokeStyle = 'rgba(240,244,255,.18)'; ctx.lineWidth = .6; let vx = p.x + rnd() * p.w, vy = p.y; ctx.beginPath(); ctx.moveTo(vx, vy); for (let s = 0; s < 5; s++) { vx += (rnd() - .4) * p.w * .3; vy += p.h * .22; ctx.lineTo(vx, vy); } ctx.stroke(); ctx.restore(); }
    for (const p of plates) { ctx.strokeStyle = 'rgba(12,16,38,.7)'; ctx.lineWidth = 1.2 + p.row * .12; poly(p.pts); ctx.stroke(); ctx.strokeStyle = 'rgba(225,232,248,.45)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(p.pts[0], p.pts[1] + 1); ctx.lineTo(p.x + p.w - 1, p.pts[1] + 1); ctx.stroke(); }
    throneSeams = ghostPattern(690, T + 58, 250, rnd);
    // the back edge of the hall: a low step of silver leaf; the near edge opens on the night
    const by = T + 3; ctx.fillStyle = '#1A2446'; ctx.fillRect(0, by - 3, AW_W, 5); leafLine(() => { ctx.moveTo(0, by - 3); ctx.lineTo(AW_W, by - 3); }, 1.2);
    const ey = 350, g = ctx.createLinearGradient(0, ey, 0, VH); g.addColorStop(0, '#0A1028'); g.addColorStop(1, '#26365E'); ctx.fillStyle = g; ctx.fillRect(0, ey, AW_W, VH - ey);
    leafLine(() => { ctx.moveTo(0, ey - 1); ctx.lineTo(AW_W, ey - 1); }, 1.4);
    const sh = ctx.createLinearGradient(0, VH - 44, 0, VH - 10); sh.addColorStop(0, 'rgba(6,8,20,0)'); sh.addColorStop(1, 'rgba(6,8,20,.42)'); ctx.fillStyle = sh; ctx.fillRect(0, VH - 44, AW_W, 34);
  }
  W5.dawnK = 0; // 0 deep night .. 1 the dawn breaking (the boss room's rule sets it as the fight goes on)
  THEMES.moonBoss = {
    name: 'the moon throne', sky: ['#02040A', '#081024', '#16224A', '#34467A'], sun: [0.5, 0.36, MOONRGB], haze: '100,120,180',
    floorA: '#6A7CAE', floorB: '#10183A', path: '#C8D2E2', skyKind: 'none',
    grade: { desat: .1, top: 'rgba(40,56,150,.5)', bot: 'rgba(150,170,225,.32)', vig: 'rgba(2,4,12,.7)' },
    liveSky(camX, t) {
      const th = THEMES.moonBoss, d = W5.dawnK || 0;
      if (d > 0) { // the east (left) blushing, then the whole sky paling as the dawn comes
        const g = ctx.createLinearGradient(0, 0, VW, 0); g.addColorStop(0, `rgba(240,170,150,${.5 * d})`); g.addColorStop(.45, `rgba(200,170,190,${.25 * d})`); g.addColorStop(1, 'rgba(150,160,210,0)'); ctx.fillStyle = g; ctx.fillRect(0, Y_OFF, VW, T - Y_OFF);
        const h = ctx.createLinearGradient(0, T - 90, 0, T); h.addColorStop(0, 'rgba(255,200,170,0)'); h.addColorStop(1, `rgba(255,214,180,${.45 * d})`); ctx.fillStyle = h; ctx.fillRect(0, T - 90, VW, 90);
      }
      ctx.save(); ctx.translate(0, d * 46); ctx.globalAlpha = 1 - d * .4; skyMoon(th, camX); ctx.restore(); // the moon going down
      skyClouds(camX, t, Y_OFF + 6, Y_OFF + 70, .85, .7);
    },
    liveFloor(camX, t) {
      liveSeams(throneSeams, camX, t, '235,242,255', .14, .12);
      const mx = VW * THEMES.moonBoss.sun[0] - camX * .02, g = ctx.createLinearGradient(0, T, 0, VH); g.addColorStop(0, 'rgba(220,230,255,.16)'); g.addColorStop(1, 'rgba(220,230,255,0)'); // the moon's reflection in the polished floor
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(mx - 30, T); ctx.lineTo(mx + 30, T); ctx.lineTo(mx + 70, VH); ctx.lineTo(mx - 70, VH); ctx.fill();
      liveMotes(camX, t, 90, T - 40, T + 100, PALE, .1);
    },
  };
  AW_FAR.moonBoss = throneFar; AW_MID.moonBoss = throneMid; AW_FLOOR.moonBoss = throneFloor;

  // the breakable pods of this world: a cluster of selenite, moonstone grown in blades, glowing from within
  const podDraw = drawPod;
  drawPod = function (p, t) {
    if (p.theme !== 'moon') { podDraw(p, t); return; }
    ctx.save(); ctx.translate(p.x, p.y); shadow(0, 0, 15);
    for (const [x, h, w, a] of [[-7, 24, 5, -.25], [6, 20, 4.4, .3], [0, 32, 6, 0], [-12, 14, 3.6, -.5], [11, 13, 3.4, .55]]) {
      ctx.save(); ctx.rotate(a); fillPoly([x - w, 0, x - w * .8, -h * .8, x, -h, x + w * .8, -h * .8, x + w, 0], '#B8C6E2', 1.3);
      if (DET()) { ctx.fillStyle = 'rgba(245,248,255,.75)'; poly([x, -h, x + w * .8, -h * .8, x + w, 0, x + w * .25, 0]); ctx.fill(); ctx.strokeStyle = 'rgba(120,140,190,.5)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(x - w * .4, -2); ctx.lineTo(x - w * .2, -h * .7); ctx.stroke(); }
      ctx.restore();
    }
    fillPoly([-15, 0, -12, -5, 12, -5, 15, 0], '#2E3A64', 1.2);
    glowAt(0, -14, 18, PALE, .3);
    ctx.restore();
  };

})();
