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

  // ======================================================================================================
  // THE PEOPLE AND BEASTS OF THE GHOST CITY
  // ======================================================================================================
  // a tongue of mist curling up off a hem or a paw: a tapering stroke that thins as it rises (slow, never flickering)
  function mistTongue(x, y, len, w, lean, t, i, col = 'rgba(200,214,245,.55)') {
    const sw = Math.sin(t * .9 + i * 2.1) * len * .16, s = taper(x, y, x + lean * .5 + sw, y + len * .55, x + lean + sw * 1.6, y + len, w, .4, 6);
    trace(s.L, s.R); ctx.fillStyle = TINT || (FLASH ? '#FFFFFF' : col); ctx.fill();
  }
  // a ghost's hand: long, pale, nearly transparent fingers
  function ghostHand(x, y, ang, s, open, col = '#C8D4EA') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
    cel(PE(2, 0, 3.4, 2.6), col, { d: .8, r: .4, w: 1 });
    for (let i = 0; i < 4; i++) { const by = -1.8 + i * 1.2, L = [5, 6, 5.6, 4.4][i], c = open ? .1 : .9; horn(4, by, 4 + L * .6, by + c * 1.4, 4 + L, by + c * 3, 1.4, .5, col, .7); }
    horn(1.6, -2, 3.4, -4.4 + (open ? 0 : 2), 5.4, -4.6 + (open ? 0 : 3), 1.6, .5, col, .7);
    ctx.restore();
  }

  // ---------------- LANTERN COURTIER: a courtier of the moon, robed in indigo, with a lantern hung where its head should be ----------------
  CREATURES.w5courtier = function (e, a) {
    a = a || {}; const t = a.t || 0, wind = a.wind || 0, st = e.state, ph = a.walk || 0;
    const firing = st === 'wind' && e.plan === 'w5moonfire', bowing = (st === 'wind' && e.plan === 'w5censer') || (st === 'w5act' && e.w5a === 'censer');
    const bob = Math.sin(t * 1.3 + (e.walk || 0) * .3) * 1.2 - 3, bow = bowing ? (st === 'w5act' ? .32 : wind * .32) : 0;
    const robe = '#1E2754', robeDk = '#0C1028', robeLt = '#4A5A94', silk = '#C8D2E6';
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.translate(0, bob);
    // the hem never quite reaches the floor: it frays into mist
    for (let i = 0; i < 5; i++) mistTongue(-11 + i * 5.5, -5, 5 + (i % 2) * 2.5, 4.4, -3 - (ph ? 3 : 0), t, i, 'rgba(190,206,240,.35)');
    ctx.save(); ctx.translate(0, -22); ctx.rotate(bow); ctx.translate(0, 22);
    // the far sleeve, hanging in long dags
    const farA = firing ? -.2 : .2;
    cel(PB([-6, -44, -14, -36 + farA * 10, -16, -20, -12, -14, -8, -22, -4, -34]), '#141A3E', { d: 2, r: .6, w: 1.3, dark: robeDk });
    // the robe: a long houppelande, wide at the hem, its front banded with silver leaf and crescents
    const sway = Math.sin(t * 1.1 + ph * .5) * 1.5;
    const body = PB([-7, -47, 7, -47, 10, -32, 14 + sway, -6, 6, -2, -4, -3, -14 + sway, -5, -11, -30]);
    cel(body, robe, { d: 3.2, r: 1.2, w: 1.7, dark: robeDk, lite: robeLt, tex: () => {
      ctx.strokeStyle = 'rgba(8,10,30,.45)'; ctx.lineWidth = .9; ctx.beginPath(); for (let i = 0; i < 4; i++) { const x = -8 + i * 5; ctx.moveTo(x * .5, -42); ctx.quadraticCurveTo(x, -22, x * 1.3 + sway, -4); } ctx.stroke(); // the folds
      ctx.fillStyle = 'rgba(214,222,236,.85)'; ctx.fillRect(1.5, -46, 2.6, 42); // the band down the front
      ctx.fillStyle = robeDk; for (let y = -42; y < -6; y += 7) { ctx.beginPath(); ctx.arc(2.8, y, 1.3, -1.2, 1.9); ctx.arc(3.4, y - .2, .9, 1.9, -1.2, true); ctx.fill(); } // crescents worked into it
      ctx.fillStyle = 'rgba(214,222,236,.7)'; ctx.beginPath(); ctx.moveTo(-14 + sway, -6); for (let x = -14; x <= 14; x += 4) ctx.lineTo(x + sway * (1 - Math.abs(x) / 14 * .2), -5 + (x % 8 ? 1.4 : -.8)); ctx.lineTo(14 + sway, -9); ctx.lineTo(-13 + sway, -9); ctx.closePath(); ctx.fill(); // the hem embroidery
    } });
    // the stiff collar standing up round the neck-iron
    fillPoly([-8, -46, -11, -55, -4, -49, 0, -50, 4, -49, 10, -55, 8, -46], silk, 1.1);
    if (DET()) { ctx.strokeStyle = 'rgba(110,124,160,.6)'; ctx.lineWidth = .5; ctx.beginPath(); for (const x of [-7, -4, 5, 8]) { ctx.moveTo(x, -47); ctx.lineTo(x * 1.25, -53); } ctx.stroke(); }
    // the neck-iron: a crook of black iron rising from the collar; the lantern hangs from its hook and sways a little
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-3, -47); ctx.quadraticCurveTo(-5, -62, -1, -69); ctx.quadraticCurveTo(3, -73, 6, -69); ctx.stroke();
    ctx.strokeStyle = C('#3A4466'); ctx.lineWidth = 1.2; ctx.stroke();
    const held = bowing && st === 'w5act';
    if (!held) { // the lantern on its hook (or, while it bows, taken down into its hand)
      const sw = Math.sin(t * 1.05 + (e.walk || 0) * .25) * .1 + (a.hurt ? .25 : 0) + (bowing ? wind * .6 : 0);
      ctx.save(); ctx.translate(6, -69); ctx.rotate(sw); w5lantern(0, 0, 1, firing ? wind : 0, a.hurt, t); ctx.restore();
    }
    // the near arm: folded into the sleeve, lifted palm-up under the lantern to throw its fire, or holding the lantern's chain
    if (firing) { cel(PB([1, -45, 10, -48, 16, -55, 13, -58, 6, -52, -2, -40]), robe, { d: 1.6, r: .8, w: 1.4, dark: robeDk, lite: robeLt }); ghostHand(14, -57, -1.2, 1.1, true); glowAt(14, -60, 14 + wind * 10, PALE, .3 + wind * .5); }
    else if (held) {
      const sa = e.w5swing ?? -2, hx = 12, hy = -40, L = e.w5chain ?? 22, lx = hx + Math.cos(sa) * L, ly = hy + Math.sin(sa) * L;
      cel(PB([1, -45, 8, -44, 13, -40, 10, -36, 3, -38, -2, -40]), robe, { d: 1.4, r: .7, w: 1.3, dark: robeDk });
      ghostHand(hx, hy, sa, 1, false);
      ctx.strokeStyle = C('#5A6890'); ctx.lineWidth = 1.2; ctx.setLineDash([1.6, 1.2]); ctx.beginPath(); ctx.moveTo(hx + 3, hy); ctx.lineTo(lx, ly); ctx.stroke(); ctx.setLineDash([]); // the chain
      ctx.save(); ctx.translate(lx, ly); ctx.rotate(sa + Math.PI / 2); w5lantern(0, 0, 1.05, 1, false, t); ctx.restore();
      if (DET()) add(() => { ctx.strokeStyle = 'rgba(210,225,255,.35)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(hx, hy, L, sa - .9, sa); ctx.stroke(); }); // its swing, smeared with light
    } else {
      cel(PB([1, -45, 9, -40, 12, -30, 9, -24, 4, -26, 2, -36]), robe, { d: 1.6, r: .8, w: 1.4, dark: robeDk, lite: robeLt });
      fillPoly([9, -26, 13, -24, 12, -14, 9, -18, 7, -12, 5, -22], '#232E60', 1); // the long dag of the sleeve
      ghostHand(9, -27, .3, .9, false);
    }
    ctx.restore(); ctx.restore();
  };
  // its lantern head: a cage of black iron with a pointed cap, panes of pale horn, and a cold white flame inside
  function w5lantern(x, y, s, hot, hurt, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 1; circle(0, 1.6, 1.6); ctx.stroke(); // the ring it hangs by
    const top = 3.6, bot = 17, w = 5.4;
    fillPoly([-w - 1, top + 3, 0, top - 1.6, w + 1, top + 3], '#1A2140', 1.1); // the cap
    poly([-w, top + 3, w, top + 3, w - .8, bot, -w + .8, bot]); ctx.fillStyle = C('#9AAAC8'); ctx.fill(); // the panes
    if (DET()) { const g = ctx.createRadialGradient(0, (top + bot) / 2 + 2, 1, 0, (top + bot) / 2, 8); g.addColorStop(0, `rgba(250,252,255,${.9})`); g.addColorStop(1, 'rgba(150,170,215,.4)'); ctx.fillStyle = g; poly([-w, top + 3, w, top + 3, w - .8, bot, -w + .8, bot]); ctx.fill(); }
    const fl = hurt ? .6 : 1 + hot * .5, fy = (top + bot) / 2 + 2.6; // the flame: a teardrop, leaning a little with the sway
    ctx.fillStyle = C('#E8F0FF'); ctx.beginPath(); ctx.moveTo(0, fy + 3 * fl); ctx.quadraticCurveTo(-2.6 * fl, fy, 0, fy - 5 * fl); ctx.quadraticCurveTo(2.6 * fl, fy, 0, fy + 3 * fl); ctx.fill();
    if (DET()) { ctx.fillStyle = 'rgba(150,180,255,.9)'; ell(0, fy + 1.2, 1.1 * fl, 1.6 * fl); ctx.fill(); }
    ctx.strokeStyle = C('#1A2140'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-w, top + 3); ctx.lineTo(-w + .8, bot); ctx.moveTo(w, top + 3); ctx.lineTo(w - .8, bot); ctx.moveTo(0, top + 3); ctx.lineTo(0, bot); ctx.moveTo(-w, (top + bot) / 2 + 1); ctx.lineTo(w, (top + bot) / 2 + 1); ctx.stroke(); // the cage
    poly([-w, top + 3, w, top + 3, w - .8, bot, -w + .8, bot]); outline(1.2);
    fillPoly([-w + .6, bot, w - .6, bot, 2, bot + 3, -2, bot + 3], '#1A2140', 1); // the foot
    glowAt(0, fy, 14 + hot * 10, PALE, hurt ? .15 : .35 + hot * .45);
    ctx.restore();
  }

  // ---------------- WEEPING WATCHER: a mourning figure of moon-marble, hooded, its hands over its face. It moves only while unseen ----------------
  // pose: 'weep' (its hands over its face), 'reach' (arms out, its face bare) or 'seize' (lunging, fingers hooked)
  CREATURES.w5statue = function (e, a) {
    a = a || {}; const t = a.t || 0, pose = e.w5pose || 'weep', live = !e.w5seen && !e.dead && !a.hurt;
    const stone = '#C4CAD8', stoneDk = '#6E7896', stoneLt = '#F2F5FA', vein = 'rgba(110,120,150,.35)';
    const lean = pose === 'seize' ? .32 : pose === 'reach' ? .12 : 0;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.translate(0, -8); ctx.rotate(lean); ctx.translate(0, 8);
    // folded wings of stone behind the shoulders, the feathers laid like scales
    const wing = (far) => { const c = far ? '#9AA2B8' : stone; cel(PB([-6, -56, -18, -66, -24, -58, -24, -34, -18, -16, -12, -24, -8, -42]), c, { d: 2.4, r: 1, w: 1.5, dark: stoneDk, lite: stoneLt, tex: () => {
      ctx.strokeStyle = vein; ctx.lineWidth = .7; ctx.beginPath(); for (let r = 0; r < 5; r++) for (let i = 0; i < 2; i++) { const x = -20 + i * 6 - r * .6, y = -58 + r * 9; ctx.moveTo(x - 3, y); ctx.quadraticCurveTo(x, y + 3, x + 3, y); } ctx.stroke(); } }); };
    ctx.save(); ctx.translate(-3, 0); wing(true); ctx.restore();
    // the shroud: heavy drapery falling to a pool on the floor
    const body = PB([-10, -58, 8, -58, 14, -40, 18, -10, 20, 0, -20, 0, -18, -12, -15, -40]);
    cel(body, stone, { d: 3.6, r: 1.4, w: 1.9, dark: stoneDk, lite: stoneLt, tex: () => {
      ctx.strokeStyle = 'rgba(70,80,110,.45)'; ctx.lineWidth = 1.1; ctx.beginPath(); for (let i = 0; i < 6; i++) { const x = -14 + i * 5.6; ctx.moveTo(x * .55, -52); ctx.quadraticCurveTo(x * .9, -26, x * 1.12, 0); } ctx.stroke(); // the folds
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = .7; ctx.beginPath(); for (let i = 0; i < 5; i++) { const x = -11 + i * 5.6; ctx.moveTo(x * .55 + 1.2, -50); ctx.quadraticCurveTo(x * .9 + 1.4, -26, x * 1.12 + 1.4, -2); } ctx.stroke();
      ctx.strokeStyle = vein; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(-12, -30); ctx.quadraticCurveTo(-4, -24, -6, -12); ctx.moveTo(6, -44); ctx.quadraticCurveTo(10, -36, 8, -28); ctx.stroke(); // veins in the marble
    } });
    // cracks: when it moves, a cold light shows in them
    const crack = [[-8, -36, -4, -30, -6, -24, -2, -18], [8, -48, 5, -42, 9, -36], [-2, -12, 3, -7, 1, -2]];
    ctx.strokeStyle = C('#4A5470'); ctx.lineWidth = .9; ctx.beginPath(); for (const c of crack) { ctx.moveTo(c[0], c[1]); for (let i = 2; i < c.length; i += 2) ctx.lineTo(c[i], c[i + 1]); } ctx.stroke();
    if (live && DET()) add(() => { ctx.strokeStyle = 'rgba(225,235,255,.85)'; ctx.lineWidth = .8; ctx.beginPath(); for (const c of crack) { ctx.moveTo(c[0], c[1]); for (let i = 2; i < c.length; i += 2) ctx.lineTo(c[i], c[i + 1]); } ctx.stroke(); });
    // the hood and the face under it
    const hx = 2, hy = -64;
    cel(PB([hx - 9, hy + 8, hx - 10, hy - 4, hx - 2, hy - 11, hx + 8, hy - 8, hx + 11, hy + 2, hx + 9, hy + 10]), stone, { d: 2.4, r: 1, w: 1.6, dark: stoneDk, lite: stoneLt });
    ctx.fillStyle = C('#9AA2BA'); ell(hx + 4, hy + 1, 5.4, 6.6); ctx.fill(); // the face, recessed in the hood
    if (pose !== 'weep') { // bare: blank and smooth, two hollows for eyes, a mouth open on nothing
      ctx.fillStyle = C('#20263C'); ell(hx + 3, hy - 1, 1.2, 1.9); ctx.fill(); ell(hx + 7, hy - 1.2, 1.1, 1.8); ctx.fill(); ell(hx + 5.6, hy + 4.4, 1.4, pose === 'seize' ? 2.6 : 1.8); ctx.fill();
      if (live) { glowAt(hx + 3, hy - 1, 5, '220,232,255', .6); glowAt(hx + 7, hy - 1.2, 5, '220,232,255', .6); }
      if (DET()) { ctx.strokeStyle = 'rgba(60,70,100,.5)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(hx + 3, hy + .8); ctx.quadraticCurveTo(hx + 2.4, hy + 4, hx + 3.4, hy + 7); ctx.stroke(); } // a tear-track worn into the stone
    }
    // the arms: over its face, reaching out, or hooked to seize
    const shoulder = [6, -54];
    const arm = (far) => {
      const col = far ? '#A0A8BE' : stone, sx = shoulder[0] - (far ? 5 : 0), sy = shoulder[1] + (far ? 1 : 0);
      let ex, ey, hxx, hyy, ang;
      if (pose === 'weep') { ex = sx + 7; ey = sy + 8; hxx = hx + 4 + (far ? -2 : 1); hyy = hy + 1 + (far ? -1 : 1); ang = -1.9; }
      else if (pose === 'reach') { ex = sx + 9; ey = sy + 3; hxx = sx + 20; hyy = sy + 2 + (far ? -3 : 0); ang = .05; }
      else { ex = sx + 9; ey = sy + 6; hxx = sx + 22; hyy = sy + 10 + (far ? -4 : 0); ang = .45; }
      seg(sx, sy, ex, ey, 6.4, 5, col, 1); seg(ex, ey, hxx, hyy, 5, 4, col, .5);
      ctx.save(); ctx.translate(hxx, hyy); ctx.rotate(ang); // a hand of stone: the palm, and long fingers spread or hooked
      cel(PE(1.5, 0, 3, 2.4), col, { d: .9, r: .4, w: 1 });
      for (let i = 0; i < 4; i++) { const by = -1.6 + i * 1.1, L = [5.4, 6.2, 5.8, 4.6][i], c = pose === 'seize' ? 1.6 : pose === 'weep' ? .3 : .1; horn(3.6, by, 3.6 + L * .6, by + c, 3.6 + L, by + c * 2.6, 1.6, .7, col, .7, stoneDk); }
      ctx.restore();
    };
    arm(true); if (pose === 'weep') { ctx.save(); arm(false); ctx.restore(); } else arm(false);
    ctx.restore();
    ctx.save(); wing(false); ctx.restore(); // its near wing comes round in front of the shoulder (only its edge shows)
    ctx.restore();
  };

  // ---------------- COLORLESS REFLECTION: the prince's own image out of a still pool, every color drained from it ----------------
  // it wears his face and his armor in greys, a crack runs through it like a broken mirror, and its eyes are white
  const greyOf = (hex) => { if (!hex || hex[0] !== '#' || hex.length !== 7) return hex; const n = parseInt(hex.slice(1), 16), l = ((n >> 16) * .3 + ((n >> 8) & 255) * .59 + (n & 255) * .11) / 255; return awMix('#2A3048', '#E8EEF8', clamp(.12 + l * 1.25, 0, 1)); };
  function greyLook() { const L = Object.assign({}, heroLook()); for (const k in L) if (typeof L[k] === 'string') L[k] = greyOf(L[k]); L.eye = '#FFFFFF'; return L; }
  CREATURES.w5reflect = function (e, a) {
    a = a || {}; const t = a.t || 0, st = e.state, wind = a.wind || 0, w = e.w5w || 'rapier';
    const pose = { walk: e.walk || 0, weapon: w, stance: 1, breath: Math.sin(t * 1.7), Y: 0 };
    if (st === 'wind') { pose.arm = -2.1 * (.3 + .7 * wind); pose.lean = -.15 * wind; pose.backArm = -.4; pose.sink = 3 * wind; }
    else if (st === 'strike' || (st === 'w5act' && e.w5a === 'mimic')) { const k = e.w5k ?? 1; pose.arm = lerp(-2.1, 1.0, k); pose.trail = 60; pose.trailFrom = -2.1; pose.trailCol = 'rgba(220,230,255,.9)'; pose.lean = .3; pose.sink = 4; if (e.w5thrust) { pose.arm = .05; pose.ext = 1; pose.trail = 0; pose.lean = .45; } if (e.w5spin) pose.spin = (e.w5spin || 0); }
    else if (a.hurt) { pose.arm = -1; pose.lean = -.35; }
    if (e.state === 'down') pose.down = 1;
    ctx.save();
    drawHumanoid(greyLook(), pose);
    if (DET() && typeof inkG !== 'undefined' && ctx === inkG) { // the silvering: a sheen across it, and the crack where the glass broke
      ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ((fn) => { fn(); ctx.restore(); })(() => { ctx.globalAlpha = .3; const g = ctx.createLinearGradient(-14, -70, 14, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.45, 'rgba(235,242,255,.9)'); g.addColorStop(.6, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(-16, -74, 34, 76); });
      ctx.strokeStyle = 'rgba(40,46,70,.8)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-6, -66); ctx.lineTo(-1, -52); ctx.lineTo(-5, -44); ctx.lineTo(2, -34); ctx.lineTo(-1, -22); ctx.lineTo(4, -10); ctx.stroke();
      ctx.strokeStyle = 'rgba(250,252,255,.8)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(-5.4, -66); ctx.lineTo(-.4, -52); ctx.lineTo(-4.4, -44); ctx.lineTo(2.6, -34); ctx.lineTo(-.4, -22); ctx.lineTo(4.6, -10); ctx.stroke();
    }
    glowAt(7, -61, 6, '240,246,255', .5);
    ctx.restore();
  };

  // ---------------- MOONMOTH: a great luna moth, pale as the moon, with long tails; drawn to the silver of a prince ----------------
  CREATURES.w5moth = function (e, a) {
    a = a || {}; const t = a.t || 0, wind = a.wind || 0, latched = e.state === 'w5act' && e.w5a === 'latch', dash = e.state === 'w5act' && e.w5a === 'dart';
    const rate = latched ? 2.4 : 6, flap = dash ? -.75 : Math.sin(t * rate + (e.walk || 0)) * (latched ? .35 : .85) + (latched ? -.6 : 0), cy = -16 + (latched ? 0 : Math.sin(t * rate) * 1.2);
    const wingC = '#B8D4CC', wingLt = '#EEF6F2', wingDk = '#6A8A88', costa = '#8C7EA8';
    ctx.save(); ctx.lineJoin = 'round'; ctx.scale(1.3, 1.3); if (dash) ctx.rotate(.2);
    const wing = (far, hind) => {
      const k = Math.cos(flap * (far ? 1 : 1.06)), sy = (hind ? .78 : 1) * Math.max(.14, Math.abs(k)) * (k < 0 ? -1 : 1);
      ctx.save(); ctx.translate(-1, cy - 2); ctx.scale(far ? .84 : 1, sy);
      if (hind) { // the hindwing and its long swallowtail, streaming back
        const tw = Math.sin(t * 1.4 + (far ? 1 : 0)) * 3;
        cel(PB([0, 0, -6, -6, -14, -12, -18, -10, -16, -4, -10, 0]), far ? '#8EAAA6' : wingC, { d: 2, r: 1, w: 1.2, dark: wingDk, lite: wingLt });
        horn(-14, -9, -24, -8 + tw * .4, -34, -2 + tw, 3.6, .8, far ? '#8EAAA6' : wingC, 1, wingDk);
        if (!far && DET()) { ctx.fillStyle = 'rgba(140,120,170,.7)'; circle(-11, -7, 1.6); ctx.fill(); }
      } else { // the forewing: broad, its leading edge lavender, a crescent moon worked into it
        cel(PB([2, 0, 0, -10, -6, -22, -14, -28, -24, -26, -22, -16, -10, -5]), far ? '#90ACA8' : wingC, { d: 2.4, r: 1.2, w: 1.3, dark: wingDk, lite: wingLt, tex: () => {
          ctx.strokeStyle = 'rgba(60,80,90,.35)'; ctx.lineWidth = .5; ctx.beginPath(); for (let i = 0; i < 4; i++) { ctx.moveTo(0, -2); ctx.lineTo(-22 * (.4 + i * .2), -26 * (.95 - i * .16)); } ctx.stroke(); // veins
        } });
        ctx.strokeStyle = C(costa); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(1, -2); ctx.quadraticCurveTo(-4, -18, -14, -28); ctx.stroke();
        const ex = -13, ey = -17; ctx.fillStyle = C('#E8EEF8'); circle(ex, ey, 3.4); ctx.fill(); ctx.fillStyle = C(far ? '#7A8A98' : '#5A6A8A'); circle(ex + 1.1, ey - .6, 2.8); ctx.fill(); // the crescent
        if (DET()) { ctx.strokeStyle = 'rgba(140,120,170,.6)'; ctx.lineWidth = .6; circle(ex, ey, 3.8); ctx.stroke(); }
      }
      ctx.restore();
    };
    wing(true, true); wing(true, false);
    // the body: thick white fur, a banded abdomen, feathered antennae
    cel(PB([-3, cy - 1, -12, cy + 1, -18, cy + 5, -19, cy + 2, -12, cy - 3, -3, cy - 4]), '#D8DEE8', { d: 1.4, r: .6, w: 1.2, tex: () => { ctx.strokeStyle = 'rgba(120,130,160,.6)'; ctx.lineWidth = .7; ctx.beginPath(); for (let x = -6; x > -18; x -= 3) { ctx.moveTo(x, cy - 3.4); ctx.lineTo(x - .8, cy + 3); } ctx.stroke(); } });
    cel(PE(1, cy - 2, 5.6, 4.8), '#F2F4F8', { d: 1.4, r: .6, w: 1.3, dark: '#A8B0C4', tex: () => { for (let i = 0; i < 6; i++) dab(-2 + i * 1.3, cy - 4 + (i % 3) * 1.8, 1.3, i % 2 ? '#FFFFFF' : '#C8CEDC', .7); } });
    cel(PE(6.4, cy - 2.6, 2.8, 2.6), '#E4E8F0', { d: .8, r: .5, w: 1.1 });
    ctx.fillStyle = C('#20263A'); circle(7.6, cy - 3, 1.1); ctx.fill(); if (DET()) { ctx.fillStyle = '#FFFFFF'; circle(7.9, cy - 3.4, .35); ctx.fill(); }
    for (const s of [0, 1]) { ctx.strokeStyle = C('#8A8EA8'); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(7, cy - 5); ctx.quadraticCurveTo(10 + s * 2, cy - 12, 7 + s * 5, cy - 15 + s); ctx.stroke();
      if (DET()) { ctx.strokeStyle = 'rgba(200,205,225,.8)'; ctx.lineWidth = .5; ctx.beginPath(); for (let k = 0; k < 6; k++) { const q = k / 6, px = lerp(7, 7 + s * 5, q) + 2 * q, py = lerp(cy - 5, cy - 15 + s, q); ctx.moveTo(px, py); ctx.lineTo(px + 1.8, py - .8); } ctx.stroke(); } }
    wing(false, true); wing(false, false);
    if (wind > 0 || latched) glowAt(-8, cy - 10, 18, PALE, latched ? .35 : wind * .4);
    ctx.restore();
  };

  // ---------------- HOUND OF THE WILD HUNT: a white hound of the otherworld with red ears, mist streaming off its paws ----------------
  CREATURES.w5hound = function (e, a) {
    a = a || {}; const t = a.t || 0, ph = a.walk || 0, wind = a.wind || 0, st = e.state;
    const leap = st === 'pounce' || (st === 'w5act' && e.w5a === 'course'), bite = st === 'strike', crouch = st === 'wind' ? wind : 0, moving = ph || leap ? 1 : 0, gal = leap ? t * 16 : ph;
    const by = -22 + crouch * 6 + Math.abs(Math.sin(gal)) * -1.8 * moving, tilt = leap ? -.06 + Math.sin(gal) * .05 : crouch * .12;
    const coat = '#E6EAF2', dk = '#8A92AC', lt = '#FFFFFF', ear = '#B4303E';
    ctx.save(); ctx.lineJoin = 'round'; ctx.rotate(tilt);
    // the tail: long, feathered, carried low
    const tw = Math.sin(t * 2 + ph) * 2.4;
    cel(PB([-17, by - 3, -26, by + 2 + tw * .4, -34, by + 6 + tw, -36, by + 9 + tw, -30, by + 6 + tw * .5, -22, by + 3, -16, by + 1]), coat, { d: 1.6, r: .6, w: 1.2, dark: dk });
    const leg = (hx, front, off, far) => {
      const s = Math.sin(gal + off) * moving, lift = Math.max(0, Math.cos(gal + off)) * 3.6 * moving, col = far ? '#AEB6CA' : coat;
      let k, h2, p;
      if (leap) { const sp = Math.sin(gal + off); k = front ? [hx + 6 + sp * 4, by + 8] : [hx - 5 + sp * 3, by + 9]; h2 = front ? [hx + 12 + sp * 8, by + 13] : [hx - 12 + sp * 6, by + 12]; p = front ? [hx + 18 + sp * 9, by + 12 + Math.max(0, -sp) * 4] : [hx - 19 + sp * 8, by + 11]; }
      else if (front) { k = [hx + s * 3, by + 11 - crouch * 2]; h2 = [hx + 2 + s * 6, -5 - lift]; p = [hx + 5 + s * 7, -.8 - lift]; }
      else { k = [hx + 4 + s * 4, by + 9]; h2 = [hx - 3 + s * 6, -6 - lift + crouch * 2]; p = [hx - 1 + s * 7, -.8 - lift]; }
      seg(hx, by + 2, k[0], k[1], 9, 5, col, 1.4); seg(k[0], k[1], h2[0], h2[1], 4.4, 3.4, col, .4); seg(h2[0], h2[1], p[0], p[1], 3.4, 2.8, col, 0);
      ctx.fillStyle = C(far ? '#9AA2B8' : '#D0D6E4'); ell(p[0] + 1.4, p[1] - .2, 3, 1.5); ctx.fill(); outline(.8);
      if (!far && moving) mistTongue(p[0] - 2, p[1] - 1, -6, 3, -6, t, hx);
    };
    leg(-12, false, Math.PI, true); leg(9, true, 0, true);
    // a deep chest and a waist drawn in tight, a coat of rough white
    const body = PB([18, by - 4, 14, by + 11, 2, by + 7, -6, by + 4, -16, by + 7, -22, by - 1, -17, by - 9, -6, by - 8, 7, by - 12]);
    cel(body, coat, { d: 3.2, r: 1.2, w: 1.7, dark: dk, lite: lt, tex: () => {
      ctx.strokeStyle = 'rgba(120,130,160,.45)'; ctx.lineWidth = .7; ctx.beginPath(); for (let i = 0; i < 10; i++) { const x = -16 + i * 3.4, y = by - 6 + (i % 3) * 3; ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 1.6, y + 1.4, x - 3.6, y + 2.4); } ctx.stroke(); // the rough coat, brushed back
    } });
    leg(-12, false, 0, false); leg(9, true, Math.PI, false);
    // the collar of silver, a crescent hanging from it
    ctx.strokeStyle = C('#9AA6C2'); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(10, by - 9); ctx.quadraticCurveTo(14, by - 3, 12, by + 3); ctx.stroke();
    // the neck and the long head of a sighthound, carried forward
    const hx = 21 + (bite ? 5 : 0) - crouch * 2 + (leap ? 3 : 0), hy = by - 10 + crouch * 7 + (bite ? 2 : 0);
    seg(10, by - 6, hx - 3, hy + 1, 11, 7, coat, 1.2);
    const open = bite ? .5 : leap ? .3 : crouch * .3;
    ctx.save(); ctx.translate(hx, hy);
    horn(-2, -4, -5, -8, -9, -7, 4.4, 1.4, '#7A1E2A', 1, '#4A0E18'); // the far ear
    ctx.save(); ctx.rotate(open); fillPoly([-2, 1, 11, 1.6, 12, 3.4, 2, 5, -2, 3.4], '#D0D6E4', 1); ctx.restore(); // the lower jaw
    if (open > .2) { ctx.fillStyle = C('#3A1A2A'); poly([0, 0, 12, 0, 11, 2 + open * 8, 0, 3.6]); ctx.fill(); }
    cel(PB([-5, -4, 2, -6.6, 10, -4.6, 15, -1.6, 14, 1, 5, 1.6, -3, 2.4]), coat, { d: 1.8, r: .8, w: 1.4, dark: dk, lite: lt });
    ctx.fillStyle = C('#2A2E40'); ell(14.4, -1, 1, .7); ctx.fill(); // the nose
    if (!a.hurt) { ctx.fillStyle = C('#F4F8FF'); ell(5.6, -3.4, 1.4, .9, -.2); ctx.fill(); glowAt(5.6, -3.4, 6, '230,240,255', wind ? .7 : .4); } // eyes like the moon
    else { ctx.strokeStyle = C('#2A2E40'); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(4, -3.4); ctx.lineTo(7, -3.6); ctx.stroke(); }
    horn(0, -5, -3, -9, -8, -9.4, 5, 1.6, ear, 1.1, '#6A1622'); // the near ear: the red of the otherworld
    ctx.restore();
    ctx.restore();
  };

  // ---------------- KNAVE OF MOONS: a Trump that walked out of the pack: a painted card on legs of ink ----------------
  // it can turn edge-on to you, and then there is nothing there to hit
  CREATURES.w5knave = function (e, a) {
    a = a || {}; const t = a.t || 0, ph = a.walk || 0, st = e.state, wind = a.wind || 0;
    const turn = e.w5turn || 0; // 0 face on .. 1 edge on .. 2 its back
    const cs = Math.cos(turn * Math.PI / 2), back = cs < 0, sx = Math.max(.05, Math.abs(cs));
    const slash = st === 'w5act' && e.w5a === 'slash', deal = st === 'w5act' && e.w5a === 'deal';
    const walk = Math.sin(ph) * (ph ? 1 : 0), cw = 13, ch = 21, cy = -36 + Math.abs(walk) * -1;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // legs of ink, thin as a pen stroke, with pointed shoes
    for (const s of [-1, 1]) { const fx = s * 5 + walk * s * 6, kx = s * 4 + walk * s * 3; ctx.strokeStyle = C(OUT); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(s * 4 * sx, cy + ch - 1); ctx.lineTo(kx, -8); ctx.lineTo(fx, 0); ctx.stroke(); ctx.fillStyle = C(OUT); poly([fx - 1, 0, fx + 4, 0, fx - 1, -2]); ctx.fill(); }
    // the arm behind
    const aA = slash ? (e.w5k ?? 1) * 1.6 - .6 : deal ? -1.2 : (st === 'wind' && e.plan === 'w5flip') ? -1.8 * wind : .9 + Math.sin(t * 1.4) * .1;
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-cw * sx, cy - 4); ctx.lineTo(-cw * sx - 6, cy + 6); ctx.lineTo(-cw * sx - 4, cy + 13); ctx.stroke();
    // the card
    ctx.save(); ctx.translate(0, cy); ctx.scale(sx, 1);
    rrect(-cw, -ch, cw * 2, ch * 2, 3); ctx.fillStyle = C(back ? '#1E2858' : '#F2EEE4'); ctx.fill(); outline(1.6 / Math.max(.4, sx));
    if (DET()) {
      ctx.save(); rrect(-cw, -ch, cw * 2, ch * 2, 3); ctx.clip();
      if (back) { // its back: a diaper of moons and stars in silver on night-blue
        ctx.strokeStyle = 'rgba(200,212,240,.7)'; ctx.lineWidth = .7; rrect(-cw + 2, -ch + 2, cw * 2 - 4, ch * 2 - 4, 2); ctx.stroke();
        ctx.fillStyle = 'rgba(214,222,236,.85)'; for (let y = -ch + 6; y < ch - 3; y += 7) for (let x = -cw + 5 + ((y / 7) & 1) * 3.5; x < cw - 3; x += 7) { ctx.beginPath(); ctx.arc(x, y, 1.6, -1, 2); ctx.arc(x + .8, y - .2, 1.1, 2, -1, true); ctx.fill(); }
      } else { // its face: the knave, half-length, in a tall cap, holding up a crescent moon; a mirrored twin below him
        ctx.strokeStyle = 'rgba(160,140,90,.8)'; ctx.lineWidth = .9; rrect(-cw + 2, -ch + 2, cw * 2 - 4, ch * 2 - 4, 2); ctx.stroke();
        const knave = (flip) => { ctx.save(); if (flip) ctx.scale(-1, -1);
          ctx.fillStyle = '#2E3A78'; poly([-7, 0, -6, -8, -2, -10, 3, -10, 7, -7, 7, 0]); ctx.fill(); // the doublet
          ctx.fillStyle = '#A8343E'; ctx.fillRect(-2, -10, 3, 10); // the red of the old cards, in one stripe
          ctx.fillStyle = '#E8D8C0'; ell(1, -13.5, 3, 3.4); ctx.fill(); ctx.fillStyle = '#2E3A78'; poly([-2.6, -15.6, 1, -21, 4.6, -15.6]); ctx.fill(); ctx.fillStyle = '#D6DEEA'; circle(1, -21, 1); ctx.fill(); // the face and the cap
          ctx.fillStyle = '#20263A'; circle(2.3, -14, .5); ctx.fill(); ctx.strokeStyle = '#7A5A40'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(1.6, -12.3); ctx.lineTo(3, -12.4); ctx.stroke();
          ctx.fillStyle = '#D6DEEA'; ctx.beginPath(); ctx.arc(-6, -11, 3, -1.2, 1.9); ctx.arc(-5.2, -11.3, 2.2, 1.9, -1.2, true); ctx.fill(); // the crescent he holds
          ctx.restore(); };
        knave(false); knave(true);
        ctx.strokeStyle = 'rgba(160,140,90,.6)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(-cw + 3, 0); ctx.lineTo(cw - 3, 0); ctx.stroke();
        ctx.fillStyle = '#2E3A78'; ctx.font = '700 5px Cinzel, Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('J', -cw + 4.6, -ch + 7.4); ctx.save(); ctx.scale(-1, -1); ctx.fillText('J', -cw + 4.6, -ch + 7.4); ctx.restore(); // its indices
        if (!a.hurt) { ctx.fillStyle = (st === 'wind' || slash) ? '#FFFFFF' : '#20263A'; circle(2.3, -14, .6); ctx.fill(); } // the painted eye follows you
      }
      ctx.restore();
      if (sx < .5) add(() => { ctx.fillStyle = `rgba(235,242,255,${.8 * (1 - sx * 2)})`; ctx.fillRect(-cw * .3, -ch, cw * .6, ch * 2); }); // its edge catches the light
    }
    ctx.restore();
    // the near arm, with its paper-knife
    const hx = cw * sx + Math.cos(aA) * 9, hy = cy - 4 + Math.sin(aA) * 9;
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(cw * sx - 1, cy - 4); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(aA - .3); fillPoly([0, -1, 16, 0, 0, 1.2], '#DCE4F2', .9); ctx.fillStyle = C(OUT); ctx.fillRect(-2.4, -1.4, 3, 2.8); ctx.restore();
    if (slash && DET()) add(() => { ctx.strokeStyle = 'rgba(230,238,255,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cw * sx, cy - 4, 22, -1.2, aA); ctx.stroke(); });
    ctx.restore();
  };

  // ---------------- THE SPHINX: a lion of moon-marble with a woman's face and wings of silver leaf. She asks before she eats ----------------
  CREATURES.w5sphinx = function (e, a) {
    a = a || {}; const t = a.t || 0, ph = a.walk || 0, st = e.state, wind = a.wind || 0;
    const couch = st === 'w5riddle' || st === 'enter' || (e.w5calm && st !== 'w5act'), wings = (st === 'wind' && e.plan === 'w5wings') || (st === 'w5act' && e.w5a === 'wings'), casting = (st === 'wind' && e.plan === 'w5glyphs') || (st === 'w5act' && e.w5a === 'glyphs');
    const leap = st === 'pounce', moving = ph ? 1 : 0, breath = Math.sin(t * 1.1) * .8;
    const hide = '#D2D6E2', hideDk = '#7A8298', hideLt = '#F6F8FC', leafC = '#C2CCDC';
    const B = couch ? -16 : -30 - (leap ? 4 : 0) + Math.abs(Math.sin(ph)) * -1.4 * moving;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.scale(1.05, 1.05);
    // the far wing
    const wingA = wings ? .8 + wind * .5 + (st === 'w5act' ? Math.sin(t * 7) * .3 : 0) : couch ? .12 : .25 + breath * .03;
    const wing = (far) => { ctx.save(); ctx.translate(-2 + (far ? -6 : 0), B - 12); ctx.rotate(wingA); ctx.scale(1, wings ? 1.25 : 1);
      for (let i = 0; i < 7; i++) { const L = 34 - Math.abs(i - 2) * 3, a0 = -2.7 + i * .2; horn(0, 0, Math.cos(a0) * L * .5, Math.sin(a0) * L * .5 - 2, Math.cos(a0) * L, Math.sin(a0) * L, 7, 1.2, far ? '#9AA4B8' : leafC, 1, far ? '#5A6480' : '#7A86A0'); }
      cel(PB([0, 0, -10, -8, -22, -10, -28, -4, -16, 2]), far ? '#A8B0C4' : '#DDE4EE', { d: 2, r: 1, w: 1.3, dark: '#7A86A0', lite: '#FFFFFF', tex: () => { ctx.strokeStyle = 'rgba(80,90,120,.4)'; ctx.lineWidth = .6; ctx.beginPath(); for (let i = 0; i < 4; i++) { ctx.moveTo(-6 - i * 5, -7); ctx.quadraticCurveTo(-4 - i * 5, -3, -8 - i * 5, 0); } ctx.stroke(); } }); // the coverts, silver leaf
      ctx.restore(); };
    wing(true);
    // the tail, ending in a tuft
    const tw = Math.sin(t * 1.2) * 4;
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(-26, B + 2); ctx.quadraticCurveTo(-40, B + 6 + tw, -44, B - 8 + tw); ctx.stroke(); ctx.strokeStyle = C(hide); ctx.lineWidth = 2; ctx.stroke();
    cel(PE(-44, B - 10 + tw, 3.4, 4.6, .3), '#5A6688', { d: 1, r: .5, w: 1.1 });
    // legs: folded under when she lies couchant, planted when she stands
    const leg = (hx, front, off, far) => { const col = far ? '#A8AEC0' : hide;
      if (couch) { const px = front ? hx + 16 : hx + 6; seg(hx, B + 4, hx + 5, -4, 11, 8, col, 1); seg(hx + 5, -4, px, -2.4, 7, 6, col, 0); cel(PE(px + 2, -2.6, 4.4, 2.6), col, { d: 1, r: .5, w: 1.1 }); return; }
      const s = Math.sin(ph + off) * moving, lift = Math.max(0, Math.cos(ph + off)) * 4 * moving, k = leap ? [hx + (front ? 10 : -8), B + 16] : [hx + s * 4 + (front ? 0 : 4), B + 16], p = leap ? [hx + (front ? 18 : -16), B + 24] : [hx + s * 7 + (front ? 3 : -1), -1 - lift];
      seg(hx, B + 2, k[0], k[1], front ? 14 : 17, 10, col, 1.6); seg(k[0], k[1], p[0], p[1], 9, 7.6, col, .4); cel(PE(p[0] + 2, p[1] - 1.4, 4.6, 2.6), col, { d: 1, r: .5, w: 1.1 }); };
    leg(-18, false, Math.PI, true); leg(14, true, 0, true);
    // the lion's body
    const body = PB([24, B - 12, 26, B + 4, 16, B + 10, 0, B + 8, -16, B + 10, -28, B + 6, -30, B - 6, -18, B - 12, 2, B - 12]);
    cel(body, hide, { d: 4, r: 1.6, w: 2, dark: hideDk, lite: hideLt, tex: () => {
      ctx.strokeStyle = 'rgba(110,118,150,.4)'; ctx.lineWidth = .8; ctx.beginPath(); for (let i = 0; i < 5; i++) { const x = -20 + i * 6; ctx.moveTo(x, B - 8); ctx.quadraticCurveTo(x + 2, B - 2, x + 1, B + 4); } ctx.stroke(); // the ribs, as a sculptor carves them
    } });
    leg(-18, false, 0, false); leg(14, true, Math.PI, false);
    wing(false);
    // the breast and the head: a woman's face, calm, under a striped headcloth that falls to her shoulders
    const hx = 26, hy = B - 24 + breath * .3 + (casting ? -2 : 0);
    cel(PB([14, B - 10, 22, B - 18, 30, B - 16, 30, B - 2, 22, B + 2]), hide, { d: 2.4, r: 1, w: 1.6, dark: hideDk, lite: hideLt });
    ctx.save(); ctx.translate(hx, hy);
    cel(PB([-9, -6, -6, -12, 2, -13, 8, -9, 9, -2, 8, 6, 4, 14, -4, 14, -10, 6]), '#2A3466', { d: 2.4, r: 1, w: 1.6, dark: '#141A40', lite: '#4A5A94', tex: () => { ctx.fillStyle = 'rgba(214,222,236,.9)'; for (let i = 0; i < 6; i++) { const y = -10 + i * 4; ctx.fillRect(-10, y, 20, 1.4); } } }); // the headcloth, banded in silver
    cel(PB([0, -9, 6, -9, 9, -5, 10, 0, 8, 6, 3, 8, 0, 4]), '#E2E4EC', { d: 1.6, r: .7, w: 1.3, dark: '#9AA0B8', lite: '#FFFFFF' }); // the face
    ctx.fillStyle = C('#1E2440'); if (a.hurt) { ctx.fillRect(4, -3, 3, .7); } else { ell(5.4, -2.6, 1.4, .8); ctx.fill(); glowAt(5.4, -2.6, 5, '230,238,255', wind || casting ? .7 : .35); }
    ctx.strokeStyle = C('#5A607A'); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(3.6, -4.6); ctx.lineTo(7.2, -4.4); ctx.moveTo(8.4, -1); ctx.lineTo(9.6, 1.6); ctx.lineTo(8.4, 2.2); ctx.moveTo(6, 4.4); ctx.quadraticCurveTo(7.4, 4.8, 8.4, 4.2); ctx.stroke(); // brow, nose, a faint smile
    ctx.fillStyle = C('#C8D2E4'); ctx.fillRect(-1, -12, 5, 2.4); // the band across the brow
    if (DET()) { ctx.fillStyle = '#E8EEF8'; ell(1.6, -12, 1.2, 1.6); ctx.fill(); }
    ctx.restore();
    if (casting) { const k = st === 'w5act' ? 1 : wind; ctx.save(); ctx.translate(hx + 4, hy - 22); ctx.globalAlpha = .4 + .5 * k; ctx.strokeStyle = C('#E8EEF8'); ctx.lineWidth = 1.2; circle(0, 0, 6 + k * 3); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-3, 2); ctx.quadraticCurveTo(0, -6, 3, 2); ctx.moveTo(0, -2); ctx.lineTo(0, 5); ctx.stroke(); ctx.restore(); glowAt(hx + 4, hy - 22, 20, PALE, .3 + .4 * k); } // a riddle-glyph kindling over her brow
    ctx.restore();
  };

  // ======================================================================================================
  // THE PHANTOM OF BENEDICT: what Tir-na Nog'th makes of Amber's master of arms. It wears three shapes:
  //   phase 1  Benedict as he is: tall, gaunt, plainly dressed, his right sleeve empty and pinned; he fights left-handed
  //   phase 2  The Silver Arm: an arm of silver, plated and jointed and gilded at the joints, unfolds from the empty sleeve
  //   phase 3  The Phantom unbound: dawn is coming and he is coming apart: his legs go to mist, and behind him a mandorla
  //            of phantom swords stands open like the halo of a saint in a panel painting
  // He faces right, so the near side is his right: the empty sleeve, then the silver arm. The sword is in his far hand.
  // ======================================================================================================
  const BN = { skin: '#B6C2D8', skinDk: '#6E7A98', skinLt: '#E6ECF6', hair: '#2A3048', coat: '#34446E', coatDk: '#161E3C', coatLt: '#6A7EB0', cloak: '#222C52', cloakDk: '#0C1230', cloakLt: '#4E5E92',
    legs: '#262E50', boots: '#1A2038', blade: '#DCE4F2', silver: '#C8D0DE', silverDk: '#6A748E', silverLt: '#FFFFFF', gilt: '#D8D0B0' };
  // his pose for what he is doing: the stance of the feet, how far he sinks and leans, and where his two arms are
  function benPose(e, a, t) {
    const st = e.state, plan = e.plan, w = a.wind || 0, act = st === 'w5act' ? e.w5a : null, k = e.w5k ?? 1, ph = e.phase || 1;
    const p = { sink: 3, lean: .04, ff: 13, fb: -13, fk: 3, bk: 2, swA: .3, swExt: .62, swRot: 0, siA: 1.2, siExt: 0, siOpen: 0, flow: 0, glint: 0, spin: 0 };
    const walk = a.walk || 0; if (walk && st === 'idle') { const s = Math.sin(walk); p.ff = 8 + s * 12; p.fb = -8 - s * 12; p.fk = 2 + Math.max(0, s) * 5; p.bk = 2 + Math.max(0, -s) * 5; p.flow = 3; p.swA = .4; }
    const W = (pl) => st === 'wind' && plan === pl ? w : 0;
    if (W('w5lunge') || act === 'lunge') { const q = act ? 1 : W('w5lunge'); if (act) { p.sink = 11; p.lean = .3; p.ff = 32; p.fb = -28; p.fk = 9; p.bk = 0; p.swA = 0; p.swExt = 1.25; p.flow = 10; p.siA = 1.9; }
      else { p.sink = 3 + 8 * q; p.lean = -.12 * q; p.ff = 16; p.fb = -20; p.fk = 4 + 4 * q; p.swA = -.05; p.swExt = .2 + .2 * (1 - q); p.siA = 2.4; p.glint = q; } }
    if (W('w5feint') || act === 'feint') { const q = act ? 1 : W('w5feint'); p.swA = act ? lerp(-2.2, 1.05, k) : -2.2 * q; p.swExt = .9; p.lean = act ? lerp(-.1, .3, k) : -.1 * q; p.sink = act ? 6 : 3 + 3 * q; p.ff = act ? 22 : 14; p.flow = act ? 8 : 2; }
    if (W('w5guard') || act === 'guard') { const q = act ? 1 : W('w5guard'); p.swA = lerp(.3, -1.15, q); p.swExt = lerp(.62, .55, q); p.swRot = -1.25 * q; p.sink = 4 + 2 * q; p.lean = -.06; p.glint = act ? 1 : q; p.ff = 10; p.fb = -14; }
    if (W('w5grip') || act === 'grip') { const q = act ? 1 : W('w5grip'); p.siA = act ? (e.w5siA ?? 0) : lerp(1.2, -2.5, q); p.siExt = act ? (e.w5reach || 0) : 0; p.siOpen = act ? (e.w5caught ? 0 : 1) : q; p.lean = act ? .18 : -.12 * q; p.sink = 5; p.swA = .7; }
    if (W('w5cross') || act === 'cross') { const q = act ? 1 : W('w5cross'); p.swA = act ? lerp(-2.4, 1.3, cl01(k * 2)) : -2.4 * q; p.siA = act ? lerp(-2.0, 1.1, cl01(k * 2 - .5)) : -2.0 * q; p.swExt = .95; p.lean = act ? .25 : -.15 * q; p.sink = act ? 8 : 3 + 4 * q; p.ff = act ? 20 : 14; p.flow = act ? 8 : 2; }
    if (W('w5steps') || W('w5blades') || act === 'steps' || act === 'blades') { const q = act ? 1 : Math.max(W('w5steps'), W('w5blades')); p.swA = lerp(.3, -2.7, q); p.swRot = -.2 * q; p.siA = lerp(1.2, -2.3, q); p.siOpen = q; p.lean = -.12 * q; p.sink = 2; p.glint = q; }
    if (W('w5wheel') || act === 'wheel') { const q = act ? 1 : W('w5wheel'); p.sink = 6 + 4 * q; p.swA = act ? 0 : lerp(.3, 2.2, q); p.siA = act ? 0 : lerp(1.2, 2.2, q); p.swExt = 1.1; p.siExt = act ? 4 : 0; p.spin = act ? k * TAU * 2 : 0; p.lean = act ? 0 : .2 * q; p.flow = act ? 12 : 0; }
    if (st === 'wind' && plan === 'roar') { p.swA = -.6; p.siA = -.4; p.siOpen = 1; p.lean = -.2 * w; }
    if (st === 'down' || a.hurt && st !== 'hurt') { p.sink = 14; p.lean = .45; p.ff = 16; p.fb = -6; p.fk = 10; p.bk = 12; p.swA = 1.45; p.swExt = .8; p.siA = 1.5; }
    else if (st === 'hurt') { p.lean = -.25; p.swA = -.6; }
    if (ph < 2 && p.siA !== undefined) p.siA = 1.2; // no arm there yet
    return p;
  }
  // the sword: a long straight blade of ghost-steel, a plain cross guard, a wheel pommel. In his far hand
  function benSword(len, glint) {
    fillPoly([-6, -2, -2, -2.4, -2, 2.4, -6, 2], '#3A4466', 1); // the grip
    ctx.fillStyle = C(BN.silver); circle(-7, 0, 2.4); ctx.fill(); outline(1); // the pommel
    rrect(-2, -7, 3, 14, 1.2); ctx.fillStyle = C(BN.silver); ctx.fill(); outline(1); // the guard
    poly([1, -2, len, -1, len + 5, 0, len, 1, 1, 2]); const g = ctx.createLinearGradient(0, -2, 0, 2); g.addColorStop(0, C('#FFFFFF')); g.addColorStop(.5, C(BN.blade)); g.addColorStop(1, C('#8A96B4')); ctx.fillStyle = g; ctx.fill(); outline(1.1);
    if (DET()) { ctx.strokeStyle = 'rgba(110,124,160,.7)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(len * .7, 0); ctx.stroke(); // the fuller
      add(() => { ctx.strokeStyle = 'rgba(220,232,255,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(len + 4, 0); ctx.stroke(); }); // the blade is a little made of moonlight
      if (glint > 0) { const gx = 4 + (len - 4) * ((performance.now() / 900) % 1); glowAt(gx, 0, 6 + glint * 4, '235,242,255', .6 * glint); } }
  }
  // the silver arm: plates of silver over a jointed frame, the joints set in silver-gilt; it can reach out on a chain of moonlight
  function silverArm(sx, sy, A, ext, open, s, t) {
    const L1 = 12 * s, L2 = 11 * s, E = [sx + Math.cos(A) * L1, sy + Math.sin(A) * L1], fa = A - .25 + (ext > 0 ? .25 : 0);
    const seg1 = (x0, y0, x1, y1, w0, w1) => { const st = taper(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2, x1, y1, w0, w1, 4); cel(stripPath(st), BN.silver, { d: 1.6, r: .8, w: 1.3, dark: BN.silverDk, lite: BN.silverLt, tex: () => {
      ctx.strokeStyle = 'rgba(60,70,100,.6)'; ctx.lineWidth = .6; ctx.beginPath(); for (let i = 1; i < 4; i++) { const q = i / 4; ctx.moveTo(st.L[0] + (st.L[st.L.length - 2] - st.L[0]) * q, st.L[1] + (st.L[st.L.length - 1] - st.L[1]) * q); ctx.lineTo(st.R[0] + (st.R[st.R.length - 2] - st.R[0]) * q, st.R[1] + (st.R[st.R.length - 1] - st.R[1]) * q); } ctx.stroke(); // the lames of the plate
    } }); };
    seg1(sx, sy, E[0], E[1], 7.6 * s, 6 * s);
    let H;
    if (ext > 0) { // the forearm travels out along a chain of moonlight, its plates riding on it
      const L = L2 + ext, n = Math.max(3, Math.floor(ext / 14)); H = [E[0] + Math.cos(fa) * L, E[1] + Math.sin(fa) * L];
      add(() => { ctx.strokeStyle = 'rgba(210,225,255,.5)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(...E); ctx.lineTo(...H); ctx.stroke(); });
      ctx.strokeStyle = C(BN.silverDk); ctx.lineWidth = 1.4; ctx.setLineDash([2, 1.5]); ctx.beginPath(); ctx.moveTo(...E); ctx.lineTo(...H); ctx.stroke(); ctx.setLineDash([]);
      for (let i = 1; i < n; i++) { const q = i / n, x = lerp(E[0], H[0], q), y = lerp(E[1], H[1], q); ctx.save(); ctx.translate(x, y); ctx.rotate(fa); rrect(-3 * s, -2.6 * s, 6 * s, 5.2 * s, 1.4); ctx.fillStyle = C(BN.silver); ctx.fill(); outline(1); ctx.restore(); }
    } else { H = [E[0] + Math.cos(fa) * L2, E[1] + Math.sin(fa) * L2]; seg1(E[0], E[1], H[0], H[1], 6 * s, 5 * s); }
    ctx.fillStyle = C(BN.gilt); circle(E[0], E[1], 2.8 * s); ctx.fill(); outline(1); if (DET()) { ctx.fillStyle = '#FFFFFF'; circle(E[0] + .6, E[1] - .8, .8 * s); ctx.fill(); } // the elbow, set in silver-gilt
    ctx.fillStyle = C(BN.gilt); circle(sx, sy, 3.2 * s); ctx.fill(); outline(1);
    // the hand: a palm plate and four long jointed fingers, open to grip or closed on what it caught
    ctx.save(); ctx.translate(H[0], H[1]); ctx.rotate(fa);
    cel(PE(2, 0, 3.6 * s, 3 * s), BN.silver, { d: 1, r: .5, w: 1.1, dark: BN.silverDk });
    for (let i = 0; i < 4; i++) { const by = (-2.2 + i * 1.45) * s, c = open ? .15 : 1.2, L = [5.6, 6.6, 6.2, 5][i] * s; horn(4.6 * s, by, 4.6 * s + L * .55, by + c * 1.4, 4.6 * s + L, by + c * 3.4, 1.8 * s, .9 * s, BN.silver, .8, BN.silverDk); }
    horn(2 * s, -2.6 * s, 4 * s, -5.4 * s + (open ? 0 : 2.6), 6.4 * s, -5.8 * s + (open ? 0 : 3.6), 2 * s, 1 * s, BN.silver, .8, BN.silverDk);
    ctx.restore();
    glowAt(H[0], H[1], 12, '225,235,255', open ? .35 : .2);
    return H;
  }
  // the mandorla: an almond of silver leaf behind him, and the phantom swords standing in it
  function mandorla(cx, cy, k, n, t) {
    if (k <= .02) return;
    ctx.save(); ctx.globalAlpha *= k;
    add(() => { const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 80); g.addColorStop(0, 'rgba(210,225,255,.35)'); g.addColorStop(1, 'rgba(210,225,255,0)'); ctx.fillStyle = g; ctx.fillRect(cx - 80, cy - 80, 160, 160); });
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 1.35); leafLine(() => { ctx.ellipse(0, -6, 42, 52, 0, 0, TAU); }, 1.6, .75); ctx.restore();
    for (let i = 0; i < 11; i++) { if (i >= n) continue; const an = -Math.PI / 2 + (i - 5) * .27 + Math.sin(t * .4 + i) * .02, L = 44 + (i % 2) * 10;
      ctx.save(); ctx.translate(cx + Math.cos(an) * 14, cy + Math.sin(an) * 14); ctx.rotate(an); ctx.globalAlpha *= .7; benSword(L, 0); ctx.restore(); }
    ctx.restore();
  }
  function benedict(e, a, t) {
    const ph = Math.min(3, Math.max(1, e.phase || 1)), p = benPose(e, a, t), dead = e.dead;
    const shiftK = e.w5shift > 0 ? 1 - e.w5shift : 1; // the change as each new shape comes on
    const silverK = ph >= 2 ? (ph === 2 ? sm(shiftK) : 1) : 0, mist = ph >= 3 ? sm(shiftK) : 0, haloK = ph >= 3 ? sm(shiftK) * (e.w5halo ?? 1) : 0;
    const bob = mist * (Math.sin(t * 1.3) * 2 - 6);
    const HIP = -38 + p.sink + bob, SHO = -60 + p.sink + bob, NECK = -64 + p.sink + bob, HY = -72 + p.sink + bob;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (!dead) ctx.globalAlpha *= .94; // a ghost: very nearly there
    if (e.w5vis !== undefined) ctx.globalAlpha *= cl01(e.w5vis); // stepping through the air in his feint
    if (p.spin) { const c = Math.cos(p.spin); ctx.scale(Math.max(.2, Math.abs(c)), 1); if (c < 0) ctx.scale(-1, 1); }
    mandorla(-4, SHO - 10, haloK, e.w5blades ?? 11, t);
    const upper = (fn) => { ctx.save(); ctx.translate(0, HIP); ctx.rotate(p.lean); ctx.translate(0, -HIP); fn(); ctx.restore(); };
    // the cloak, thrown back off the shoulders, its hem going to mist
    upper(() => {
      const fl = p.flow + Math.sin(t * .8) * 2;
      cel(PB([-4, SHO - 2, -12, SHO + 4, -20 - fl, -24 + bob * .5, -24 - fl * 1.4, -6 + bob * .3, -10 - fl * .4, -4 + bob * .3, -2, HIP + 6]), BN.cloak, { d: 3, r: 1.2, w: 1.7, dark: BN.cloakDk, lite: BN.cloakLt, tex: () => {
        ctx.strokeStyle = 'rgba(6,10,30,.5)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 4; i++) { ctx.moveTo(-6 - i * 3, SHO + 4); ctx.quadraticCurveTo(-10 - i * 3 - fl * .5, -30, -12 - i * 3 - fl, -8); } ctx.stroke(); } });
      for (let i = 0; i < 4; i++) mistTongue(-22 - p.flow * 1.2 + i * 4, -6 + bob * .3, 7 + i % 2 * 4, 4, -4, t, i);
    });
    // the far arm and the sword
    const swordArm = () => upper(() => {
      const sx = -2, sy = SHO + 2, A = p.swA, bend = (1 - Math.min(1, p.swExt)) * 1.1, L1 = 12, L2 = 11 * Math.min(1.15, .7 + p.swExt * .4);
      const E = [sx + Math.cos(A + bend) * L1, sy + Math.sin(A + bend) * L1], fa = A - bend * .4, Hh = [E[0] + Math.cos(fa) * L2, E[1] + Math.sin(fa) * L2];
      seg(sx, sy, E[0], E[1], 7.6, 6, shade(BN.coat, -.2), 1); seg(E[0], E[1], Hh[0], Hh[1], 6, 4.8, shade(BN.coat, -.2), .6);
      ctx.save(); ctx.translate(Hh[0], Hh[1]); ctx.rotate(fa + p.swRot); benSword(50, p.glint); ctx.fillStyle = C(BN.skinDk); ell(-3, 0, 3, 3.2); ctx.fill(); outline(1); ctx.restore();
    });
    const guardFront = (e.state === 'w5act' && e.w5a === 'guard') || (e.state === 'wind' && e.plan === 'w5guard');
    if (!guardFront) swordArm();
    // the legs, long, in boots; when he is unbound they end in mist below the knee
    const leg = (hx, fx, kb, near) => {
      const col = near ? BN.legs : shade(BN.legs, -.2), kx = (hx + fx) / 2 + kb * .8 + 2, ky = (HIP + 0) / 2 - kb * .3 + 2;
      seg(hx, HIP, kx, ky, 9.6, 7.2, col, 1);
      if (mist > .5) { for (let i = 0; i < 3; i++) mistTongue(kx - 2 + i * 2.4, ky + 1, 10 + i * 3, 6 - i, (i - 1) * 3, t, i + (near ? 5 : 0)); return; }
      seg(kx, ky, fx, -9, 7.2, 5.4, col, .9); ctx.save(); ctx.translate(fx, 0); ctx.scale(1.15, 1.15); boot(0, near ? BN.boots : shade(BN.boots, -.2)); ctx.restore();
      if (mist > 0) mistTongue(fx, -4, -8, 6 * mist, 0, t, near ? 3 : 4);
    };
    leg(-3, p.fb, p.bk, false); leg(3, p.ff, p.fk, true);
    // the body: a plain doublet of grey-blue, a baldric of silver across it, a belt
    upper(() => {
      const ty = SHO - 2, torso = PB([-11.6, ty + 2, 0, ty - 3, 11.6, ty + 2, 12, ty + 12, 8.6, HIP - 2, 9, HIP + 4, -9, HIP + 4, -8.8, HIP - 2, -12, ty + 12]);
      cel(torso, BN.coat, { d: 3.6, r: 1.4, w: 1.9, dark: BN.coatDk, lite: BN.coatLt, tex: () => {
        ctx.strokeStyle = 'rgba(10,16,40,.45)'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(-6, ty + 9); ctx.quadraticCurveTo(0, ty + 12, 7, ty + 8.6); ctx.moveTo(-4, ty + 14); ctx.quadraticCurveTo(-1, ty + 19, -2, HIP); ctx.stroke(); // the chest, the folds
        ctx.fillStyle = 'rgba(12,18,44,.5)'; ctx.fillRect(-1, ty, 1.6, HIP - ty + 2); // the line of buttons down the front
        ctx.fillStyle = 'rgba(214,222,236,.85)'; for (let y = ty + 4; y < HIP - 2; y += 4.2) { circle(.2, y, .7); ctx.fill(); }
      } });
      ctx.strokeStyle = C(BN.silver); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(9, ty + 2); ctx.lineTo(-7, HIP - 1); ctx.stroke(); // the baldric
      ctx.fillStyle = C('#141A34'); ctx.fillRect(-9, HIP - 2.6, 18, 4); ctx.fillStyle = C(BN.silver); ctx.fillRect(1, HIP - 3, 4, 4.8);
      // the head: long and gaunt, close-cropped hair, a long straight nose, eyes of white light under a heavy brow
      ctx.fillStyle = C(BN.skinDk); ctx.fillRect(-1, NECK - 2, 5, 8);
      const head = PB([-6.4, HY - 6, 0, HY - 10.4, 6.6, HY - 8.4, 9, HY - 3, 11.2, HY + 1.6, 9.4, HY + 3, 9.8, HY + 6, 8, HY + 9.4, 2, HY + 8, -2.6, HY + 4, -7, HY]);
      cel(head, BN.skin, { d: 2.4, r: 1, w: 1.5, dark: BN.skinDk, lite: BN.skinLt, tex: () => {
        ctx.fillStyle = 'rgba(80,90,120,.45)'; poly([2, HY + 1.6, 7, HY + 2.4, 3.4, HY + 4.6]); ctx.fill(); // the hollow of the cheek
        ctx.strokeStyle = 'rgba(70,80,110,.6)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(8.8, HY + 3.4); ctx.quadraticCurveTo(7.6, HY + 4.6, 7.8, HY + 6.4); ctx.stroke(); // the line from nose to mouth
      } });
      ctx.fillStyle = C(BN.hair); ctx.beginPath(); ctx.moveTo(7.6, HY - 7.4); ctx.quadraticCurveTo(4, HY - 11.6, -2, HY - 10.8); ctx.quadraticCurveTo(-7.6, HY - 9, -7.2, HY - 1); ctx.lineTo(-4.6, HY + 1.4); ctx.quadraticCurveTo(-4, HY - 4, -1, HY - 5.6); ctx.quadraticCurveTo(3, HY - 7.4, 7.6, HY - 7.4); ctx.fill(); outline(1); // the cropped hair
      ctx.fillStyle = C(BN.skinDk); ell(-2.6, HY + 1, 1.5, 2.3); ctx.fill(); // the ear
      ctx.fillStyle = C('#141A30'); poly([3.6, HY - 3.2, 9.4, HY - 3.6, 9, HY - 2.2, 4, HY - 1.8]); ctx.fill(); // the brow, drawn down
      if (!a.hurt) { ctx.fillStyle = C('#FFFFFF'); poly([5, HY - 1.4, 8.4, HY - 1.6, 8, HY - .6, 5.4, HY - .6]); ctx.fill(); glowAt(6.8, HY - 1, 7, '230,238,255', .55 + p.glint * .3); }
      else { ctx.strokeStyle = C('#141A30'); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(5, HY - 1); ctx.lineTo(8.4, HY - 1.2); ctx.stroke(); }
      ctx.strokeStyle = C('#3A4466'); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(7.4, HY + 5); ctx.lineTo(9.6, HY + 4.8); ctx.stroke(); // a set mouth
      // the near side: the empty sleeve pinned up, or the silver arm
      const ssx = 4, ssy = SHO + 2;
      if (silverK < .99) { // the empty sleeve, folded and pinned with a brooch of the unicorn
        ctx.save(); ctx.globalAlpha *= 1 - silverK;
        cel(PB([ssx - 4, ssy - 2, ssx + 5, ssy - 1, ssx + 6, ssy + 8, ssx + 2, ssy + 12, ssx - 3, ssy + 9]), BN.coat, { d: 1.6, r: .7, w: 1.4, dark: BN.coatDk, lite: BN.coatLt });
        ctx.fillStyle = C(BN.silver); circle(ssx + 1.4, ssy + 3, 2.2); ctx.fill(); outline(.9); if (DET()) { ctx.fillStyle = '#FFFFFF'; circle(ssx + .8, ssy + 2.4, .6); ctx.fill(); }
        ctx.restore();
      }
      if (silverK > 0) { ctx.save(); ctx.globalAlpha *= silverK; // the silver arm, unfolding from the sleeve as it comes
        const A = lerp(1.9, p.siA, silverK); e.w5hand = silverArm(ssx, ssy, A, p.siExt * silverK, p.siOpen, lerp(.6, 1.12, silverK), t); ctx.restore();
        if (ph === 2 && e.w5shift > 0) glowAt(ssx, ssy + 6, 24, '230,238,255', .6 * (1 - silverK)); }
    });
    if (guardFront) swordArm(); // in his guard the blade stands up before his face
    if (p.spin && DET()) add(() => { ctx.strokeStyle = 'rgba(225,235,255,.45)'; ctx.lineWidth = 5; ell(0, SHO + 8, 58, 14); ctx.stroke(); }); // the silver wheel
    if (p.flow >= 10 && DET()) add(() => { ctx.strokeStyle = 'rgba(210,225,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 5; i++) { const y = SHO + i * 9; ctx.moveTo(-30 - i * 4, y); ctx.lineTo(-80 - i * 8, y + 2); } ctx.stroke(); }); // the speed of the lunge
    ctx.restore();
  }
  CREATURES.w5benedict = function (e, a) {
    a = a || {}; const t = a.t || 0;
    if (e.dead) { // he comes apart into moonlight; the silver arm falls and stays
      const k = cl01((performance.now() / 1000 - (e.deadAt || 0)) / 2.4);
      ctx.save(); ctx.globalAlpha *= 1 - k; ctx.translate(0, k * 6); benedict(e, a, t); ctx.restore();
      if (k > .2 && e.phase >= 2) { ctx.save(); ctx.globalAlpha *= cl01((k - .2) * 3); silverArm(-6, -3, -.08, 0, 1, 1.12, t); ctx.restore(); }
      return;
    }
    benedict(e, a, t);
  };

  // ======================================================================================================
  // ATTACKS: plans for the city's ghosts and beasts, the Sphinx and the Phantom, their tells and the hazards they leave.
  // They plug into world.js and zones.js, which load after this file: data_w5.js calls late() once they exist
  // ======================================================================================================
  const HZ = {}; // this world's hazards: { update(h, dt), draw(h, t) on the floor, ups(h, list, t) upright, box(h, box) }
  const late = () => {
  const reg = (kind, o) => { HZ[kind] = o; HAZARD_FX[kind] = { update: o.update || (() => {}), draw: o.draw || (() => {}) }; };
  const inEll = (x, y, cx, cy, r) => Math.hypot(x - cx, (y - cy) * 2.2) < r;
  const yClamp = (y) => clamp(y, FLOOR_TOP + 10, FLOOR_BOT - 2);
  const xClamp = (x) => clamp(x, leftWall() + 24, rightWall() - 24);
  const hitP = (dmg, fromX, big) => { if (P.state !== 'dead') playerDamage(dmg, fromX, big); };
  const tellCol = (k, a = 1) => `rgba(230,70,90,${(.14 + .3 * k) * a})`, tellLine = (k) => `rgba(255,140,150,${.5 + .4 * k})`;
  const guardCol = (k) => `rgba(120,170,255,${.16 + .3 * k})`, guardLine = (k) => `rgba(190,215,255,${.55 + .4 * k})`;
  const label = (x, y, s, a) => { ctx.fillStyle = `rgba(240,244,255,${a})`; ctx.font = '700 9px Cinzel, Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText(s, x, y); };
  // an attack that takes time: the enemy is held in the 'w5act' state while a controller hazard drives it each frame
  function act(e, name, step, o = {}) {
    e.state = 'w5act'; e.w5a = name; e.struck = false; e.walk = 0; e.w5k = 0;
    const h = Object.assign({ kind: 'w5ctl', e, name, el: 0, step, t: 99, max: 99, y: e.y }, o); hazards.push(h); return h;
  }
  function endAct(h) { const e = h.e; h.t = -1; e.w5k = 1; e.w5guarding = false; e.w5thrust = 0; e.w5spin = 0; if (e.w5vis !== undefined) e.w5vis = 1; if (e.w5caught) e.w5caught = 0; e.w5reach = 0; }
  reg('w5ctl', {
    update(h, dt) { const e = h.e; if (h.done) { h.t = -1; return; } if (e.dead || e.state !== 'w5act' || e.w5a !== h.name) { endAct(h); h.done = 1; return; } h.el += dt; if (h.step(h, dt, e)) { endAct(h); h.done = 1; } },
    draw(h, t) { if (h.draw) h.draw(h, t); },
    ups(h, list, t) { if (h.up) list.push([h.uy ?? h.e.y, () => h.up(h, t)]); },
  });
  function targets(e, make) { // targets fixed when the wind-up starts, kept until the attack is done
    const T0 = e.w5T;
    if (!T0 || T0.plan !== e.plan || (e.state === 'wind' && e.t > T0.lastT + 1e-6)) e.w5T = Object.assign({ plan: e.plan, lastT: e.t }, make(e));
    if (e.state === 'wind') e.w5T.lastT = e.t;
    return e.w5T;
  }
  const mist = (x, y, z, n = 10) => { for (let i = 0; i < n; i++) parts.push({ x: x + rand(-10, 10), y: y + rand(-4, 4), z: z + rand(0, 40), vx: rand(-40, 40), vy: rand(-5, 5), vz: rand(10, 50), life: .7, max: .7, col: pick(['rgba(200,214,245,.7)', 'rgba(150,170,220,.6)', 'rgba(235,242,255,.6)']), size: rand(4, 8), shape: 'puff', rot: 0, vr: 0 }); };
  const silverBurst = (x, y, z, n = 12) => burst(x, y, z, ['#EEF2FA', '#C8D4EC', '#8A9AC8'], n, 'spark', 0, true);

  // ---------------- LANTERN COURTIER: MOONFIRE, a ball of cold fire lobbed out of its lantern onto where you stand ----------------
  PLAN_FX.w5moonfire = (e) => {
    sfx('shoot'); const tx = clamp(P.x, leftWall() + 10, rightWall() - 10), ty = yClamp(P.y);
    hazards.push({ kind: 'w5orb', x0: e.x + e.facing * 8, y0: e.y, z0: e.z + 66, x: tx, y: ty, tx, ty, fl: .95, el: 0, t: 9, max: 9, dmg: edmg(e) });
    recover(e, .8);
  };
  reg('w5orb', {
    update(h, dt) { h.el += dt; const u = h.el / h.fl;
      if (u >= 1 && !h.landed) { h.landed = true; h.pool = 0; sfx('hit-crystal'); silverBurst(h.tx, h.ty, 4, 10); if (inEll(P.x, P.y, h.tx, h.ty, 32) && P.z < 30) { h.hitP = true; hitP(h.dmg, h.tx, false); } }
      if (h.landed) { h.pool += dt; if (!h.hitP && h.pool < 1.4 && inEll(P.x, P.y, h.tx, h.ty, 24) && P.z < 10) { h.hitP = true; hitP(Math.round(h.dmg * .6), h.tx, false); } if (h.pool > 1.6) h.t = -1; } },
    draw(h, t) { const u = Math.min(1, h.el / h.fl);
      ctx.save();
      if (!h.landed) { ctx.strokeStyle = tellLine(u); ctx.lineWidth = 1.6; ell(h.tx, h.ty, 30, 30 / 2.2); ctx.stroke(); ctx.fillStyle = tellCol(u); ell(h.tx, h.ty, 30 * u, 30 * u / 2.2); ctx.fill(); }
      else { const f = 1 - cl01((h.pool - 1.1) / .5); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(h.tx, h.ty, 2, h.tx, h.ty, 26); g.addColorStop(0, `rgba(230,238,255,${.55 * f})`); g.addColorStop(1, 'rgba(150,180,255,0)'); ctx.fillStyle = g; ell(h.tx, h.ty, 26, 12); ctx.fill();
        for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + h.pool * .6, x = h.tx + Math.cos(a) * 12, y = h.ty + Math.sin(a) * 5, hh = (6 + (i % 2) * 4) * f; ctx.fillStyle = `rgba(225,235,255,${.6 * f})`; ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.quadraticCurveTo(x - 1, y - hh * .6, x, y - hh); ctx.quadraticCurveTo(x + 1, y - hh * .6, x + 2, y); ctx.fill(); } } // the cold fire burning on the stone
      ctx.restore(); },
    ups(h, list, t) { if (h.landed) return; const u = Math.min(1, h.el / h.fl), x = lerp(h.x0, h.tx, u), y = lerp(h.y0, h.ty, u), z = lerp(h.z0, 6, u) + Math.sin(u * Math.PI) * 60;
      list.push([y, () => onMain(() => { shadow(x, y, 6); glowM(x, y - z, 16, PALE, .55); ctx.fillStyle = '#F4F8FF'; ctx.beginPath(); ctx.moveTo(x, y - z + 4); ctx.quadraticCurveTo(x - 4, y - z, x, y - z - 6); ctx.quadraticCurveTo(x + 4, y - z, x, y - z + 4); ctx.fill(); })]); },
    box(h, box) { box((h.x0 + h.tx) / 2, h.ty, 0, Math.abs(h.tx - h.x0) / 2 + 40, 140); },
  });
  // ---------------- LANTERN COURTIER: THE CENSER, its lantern-head unhooked and swung out on a long chain ----------------
  PLAN_FX.w5censer = (e) => {
    sfx('whoosh');
    act(e, 'censer', (h, dt, e) => {
      const k = h.el / .6; e.w5k = k; e.w5swing = lerp(-2.4, 1.0, sm(cl01(k))); e.w5chain = 22 + 92 * Math.sin(Math.PI * cl01(k));
      if (!h.hit && k > .45 && k < .75) { const fwd = (P.x - e.x) * e.facing; if (fwd > 10 && fwd < 128 && Math.abs(P.y - e.y) < 20 && P.z < 50) { h.hit = true; hitP(edmg(e), e.x, true); } }
      if (k >= 1) { e.w5chain = 22; recover(e, .9); return true; } return false;
    });
  };
  // ---------------- WEEPING WATCHER: THE SEIZING, a lunge with hooked stone fingers ----------------
  PLAN_FX.w5seize = (e) => {
    sfx('crunch'); e.w5pose = 'seize';
    act(e, 'seize', (h, dt, e) => {
      if (h.el < .2) e.x += e.facing * 360 * dt;
      if (!h.hit && h.el > .1) { const fwd = (P.x - e.x) * e.facing; if (fwd > -8 && fwd < e.def.reach + e.hw + 8 && Math.abs(P.y - e.y) < 20 && P.z < 40) { h.hit = true; hitP(edmg(e), e.x, true); } }
      if (h.el > .4) { recover(e, .8); return true; } return false;
    });
  };
  // ---------------- COLORLESS REFLECTION: MIMICRY, it does to you the last thing you did ----------------
  const DEFAULT_LAST = { name: 'Lunge', x1: 96, around: 0, multi: 0, power: 1, lunge: 200, style: 'thrust', w: 'rapier' };
  PLAN_FX.w5mimic = (e) => {
    const m = W5.last || DEFAULT_LAST, reach = clamp(m.x1 || 60, 42, 116) + e.hw, hits = m.multi ? 3 : 1;
    e.w5w = m.w; e.w5thrust = m.style === 'thrust' ? 1 : 0;
    floatText(e.x, e.y, e.hh + 26, 'YOUR ' + (m.name || 'CUT').toUpperCase(), '#DDE6F4', 12); sfx('swing');
    act(e, 'mimic', (h, dt, e) => {
      const k = h.el / .42; e.w5k = cl01(k * 1.6); if (m.around) e.w5spin = k * TAU;
      if (k < .5) e.x += e.facing * Math.min(260, (m.lunge || 0) * .7) * dt;
      const n = Math.floor(k * hits * 1.25);
      if (k > .3 && h.n !== n && n < hits) { h.n = n; const dx = P.x - e.x, fwd = dx * e.facing;
        if ((m.around ? Math.abs(dx) < reach : fwd > -8 && fwd < reach) && Math.abs(P.y - e.y) < 20 && P.z < 44) { hitP(Math.round(edmg(e) * (m.power === 2 ? 1.25 : 1) * (hits > 1 ? .45 : 1)), e.x, m.power === 2); }
        fx.push({ kind: 'slash', x: e.x + e.facing * reach * .6, y: e.y, z: 36, ang: rand(-.4, .4), t: .2, max: .2, size: 30, col: '#E8EEF8' }); }
      if (k >= 1) { recover(e, .85); return true; } return false;
    });
  };
  // ---------------- MOONMOTH: THE LATCH, it darts at you and clings to your back, drinking your light ----------------
  PLAN_FX.w5latch = (e) => {
    sfx('whoosh'); const tx = P.x, ty = yClamp(P.y);
    act(e, 'dart', (h, dt, e) => {
      const k = h.el / .55; e.w5k = k; const gx = lerp(h.x0, P.x * .5 + tx * .5, sm(cl01(k))), gy = lerp(h.y0, P.y, sm(cl01(k)));
      e.x = gx; e.y = gy; e.z = lerp(h.z0, P.z + 40, sm(cl01(k))); e.facing = Math.sign(P.x - e.x) || e.facing;
      if (Math.abs(P.x - e.x) < 18 && Math.abs(P.y - e.y) < 14 && P.state !== 'dodge' && P.state !== 'dead' && P.inv <= 0) { latchOn(e); return false; }
      if (k >= 1) { recover(e, .9); return true; } return false;
    }, { x0: e.x, y0: e.y, z0: e.z });
  };
  function latchOn(e) {
    sfx('hit-goo'); e.state = 'w5act'; e.w5a = 'latch';
    if (!W5.latchTold) { W5.latchTold = 1; floatText(P.x, P.y, 104, 'A MOTH ON YOUR BACK · DODGE TO SHAKE IT OFF', '#DDE6F4', 12); }
    act(e, 'latch', (h, dt, e) => {
      e.x = P.x - P.facing * 7; e.y = P.y - .4; e.z = P.z + 42; e.facing = P.facing; P.w5slowT = Math.max(P.w5slowT || 0, .12);
      if (P.state === 'dodge' || P.state === 'dead' || h.el > 4.2) { // shaken off (or tired of it)
        e.state = 'hurt'; e.t = .6; e.vx = -P.facing * 220; e.cd = 1.4; sfx('whoosh'); mist(e.x, e.y, e.z, 6); return true; }
      h.tick = (h.tick || 0) + dt;
      if (save.trump && trumpCharge > 0) { trumpCharge = Math.max(0, trumpCharge - 50 * dt); if (h.tick > .8) { h.tick = 0; floatText(P.x, P.y, 90, 'IT DRINKS YOUR CARD', '#C8D4EC', 11); } }
      else if (h.tick > .6) { h.tick = 0; const d = Math.max(1, Math.round(maxHp() * .012)); if (P.hp - d <= 0) hitP(d, e.x, false); else { P.hp -= d; floatText(P.x, P.y, 76, '-' + d, '#C8D4EC', 12); hurtFlash = .1; } }
      return false;
    }).uy = P.y + .3;
  }
  // ---------------- MOONMOTH: MOONDUST, a slow puff of scale-dust that makes the legs heavy ----------------
  PLAN_FX.w5dust = (e) => {
    for (const o of [-14, 14]) projs.push({ owner: 'e', x: e.x + e.facing * 10, y: clamp(e.y + o * .4, FLOOR_TOP + 6, FLOOR_BOT), z: Math.max(20, e.z), vx: e.facing * 120, vy: clamp((P.y - e.y) * .6, -40, 40), vz: -(Math.max(20, e.z) - 24) / 2, dmg: Math.round(edmg(e) * .7), life: 2.6, col: '#DCE8F4', w5dust: 1 });
    sfx('shoot'); recover(e, .8);
  };
  // ---------------- HOUND OF THE WILD HUNT: COURSING, a run round you in a wide half circle, and the bite from the far side ----------------
  PLAN_FX.w5course = (e) => {
    const cx = P.x, cy = yClamp(P.y), dx = e.x - cx, rx = clamp(Math.abs(dx), 70, 150), ry = 34, a0 = dx > 0 ? 0 : Math.PI, dir = cy > (FLOOR_TOP + FLOOR_BOT) / 2 ? -1 : 1;
    const at = (u) => [xClamp(cx + Math.cos(a0 + dir * Math.PI * u) * rx), clamp(cy + Math.sin(a0 + dir * Math.PI * u) * ry, FLOOR_TOP + 8, FLOOR_BOT)];
    sfx('growl'); const end = at(1);
    act(e, 'course', (h, dt, e) => {
      const u = cl01(h.el / .8); e.w5k = u;
      if (u < 1) { const [x, y] = at(sm(u)); e.facing = Math.sign(x - e.x) || e.facing; e.x = x; e.y = y; if (Math.random() < .5) dust(e.x, e.y, 1); return false; }
      const q = cl01((h.el - .8) / .16); e.x = lerp(end[0], cx, q); e.y = lerp(end[1], cy, q); e.facing = Math.sign(cx - end[0]) || e.facing; // then in, from the far side, to where you stood
      if (q >= 1 && !h.bit) { h.bit = true; sfx('swing'); if (inEll(P.x, P.y, cx, cy, 40) && P.z < 30) hitP(edmg(e), end[0], false); }
      if (h.el > 1.1) { recover(e, .9); return true; } return false;
    }).draw = (h, t) => { if (h.bit) return; const u = cl01(h.el / .8); ctx.save(); ctx.setLineDash([3, 5]); ctx.strokeStyle = tellLine(u * .6); ctx.lineWidth = 1.4; ctx.beginPath(); for (let i = 0; i <= 24; i++) { const [x, y] = at(i / 24); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.lineTo(cx, cy); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = tellCol(u); ell(cx, cy, 40, 40 / 2.2); ctx.fill(); ctx.strokeStyle = tellLine(u); ctx.stroke(); ctx.restore(); }; // its course round you, and where it bites: where you stood
  };
  // ---------------- KNAVE OF MOONS: THE FLIP, edge-on (where nothing can touch it) it glides at you, and turns face-on to cut ----------------
  PLAN_FX.w5flip = (e) => {
    const side = Math.sign(e.x - P.x) || 1, tx = xClamp(P.x + side * 46), ty = yClamp(P.y), x0 = e.x, y0 = e.y; sfx('whoosh');
    act(e, 'glide', (h, dt, e) => {
      const u = cl01(h.el / .42); e.w5k = u; e.x = lerp(x0, tx, sm(u)); e.y = lerp(y0, ty, sm(u)); e.facing = Math.sign(P.x - e.x) || e.facing;
      if (u >= 1) { e.w5a = 'slash'; h.name = 'slash'; h.el = 0; sfx('slice');
        h.step = (h, dt, e) => { e.w5k = cl01(h.el / .25); if (!h.hit && h.el > .08) { const fwd = (P.x - e.x) * e.facing; if (fwd > -6 && fwd < 66 && Math.abs(P.y - e.y) < 20 && P.z < 44) { h.hit = true; hitP(edmg(e), e.x, false); } } if (h.el > .3) { recover(e, 1.1); return true; } return false; }; }
      return false;
    }).draw = (h, t) => { if (h.name !== 'glide') return; ctx.save(); ctx.strokeStyle = 'rgba(235,242,255,.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(tx, ty); ctx.stroke(); ctx.fillStyle = tellCol(.7); ell(tx + (P.x > tx ? 30 : -30), ty, 34, 14); ctx.fill(); ctx.restore(); }; // a paper-cut line on the floor, and where it will cut
  };
  // ---------------- KNAVE OF MOONS: THE DEAL, three cards thrown spinning down three lanes ----------------
  PLAN_FX.w5deal = (e) => {
    sfx('swing'); for (const o of [-30, 0, 30]) hazards.push({ kind: 'w5card', x: e.x + e.facing * 12, y: clamp(P.y + o, FLOOR_TOP + 8, FLOOR_BOT - 2), z: 30, vx: e.facing * 230, t: 3, max: 3, dmg: Math.round(edmg(e) * .8), spin: rand(0, 6) });
    act(e, 'deal', (h, dt, e) => { if (h.el > .3) { recover(e, .8); return true; } return false; });
  };
  reg('w5card', {
    update(h, dt) { h.x += h.vx * dt; h.spin += dt * 14; if (!h.hit && Math.abs(P.x - h.x) < 13 && Math.abs(P.y - h.y) < 12 && P.z < 44) { h.hit = true; h.t = -1; hitP(h.dmg, h.x - h.vx, false); } if (h.x < camX - 60 || h.x > camX + VW + 60) h.t = -1; },
    draw(h, t) { shadow(h.x, h.y, 6); },
    ups(h, list, t) { list.push([h.y, () => { ctx.save(); ctx.translate(h.x, h.y - h.z); ctx.rotate(h.spin); ctx.scale(Math.max(.15, Math.abs(Math.cos(h.spin * .5))), 1); rrect(-4, -6, 8, 12, 1.4); ctx.fillStyle = C('#F2EEE4'); ctx.fill(); outline(1.1); ctx.fillStyle = C('#2E3A78'); ctx.fillRect(-2, -3, 4, 6); ctx.restore(); }]); },
    box(h, box) { box(h.x, h.y, h.z, 20, 20); },
  });
  // ---------------- THE SPHINX: her wings beat (a gale and a flight of silver quills), and her riddles burn into the floor ----------------
  PLAN_FX.w5wings = (e) => {
    sfx('roar'); shakeMag = Math.max(shakeMag, 6);
    for (let i = 0; i < 5; i++) projs.push({ owner: 'e', x: e.x + e.facing * 20, y: clamp(e.y + (i - 2) * 16, FLOOR_TOP + 6, FLOOR_BOT), z: 40 + i * 4, vx: e.facing * 250, vy: (i - 2) * 22, dmg: Math.round(edmg(e) * .6), life: 2, col: '#E8EEF8' });
    act(e, 'wings', (h, dt, e) => { const dx = P.x - e.x; if (Math.abs(dx) < 280 && Math.sign(dx) === e.facing && P.state !== 'dodge' && P.state !== 'dead') P.x += e.facing * 190 * dt; // the gale
      if (Math.random() < .6) parts.push({ x: e.x + e.facing * rand(20, 200), y: e.y + rand(-30, 30), z: rand(10, 70), vx: e.facing * 260, vy: 0, vz: 0, life: .4, max: .4, col: 'rgba(225,235,255,.5)', size: 2, shape: 'streak', rot: 0, vr: 0 });
      if (h.el > .8) { recover(e, 1.0); return true; } return false; });
  };
  const GLYPHS = ['?', 'Ⅲ', '☾', 'Ⅰ', 'Ⅳ'];
  PLAN_FX.w5glyphs = (e) => {
    sfx('charge', 2);
    for (const [ox, oy, d] of [[0, 0, 0], [-80, -16, .2], [80, 16, .4], [0, P.y > 290 ? -40 : 40, .6]]) hazards.push({ kind: 'w5glyph', x: xClamp(P.x + ox), y: yClamp(P.y + oy), r: 34, t: 1 + d, max: 1 + d, dmg: edmg(e), g: pick(GLYPHS) });
    act(e, 'glyphs', (h, dt, e) => { if (h.el > .6) { recover(e, 1.0); return true; } return false; });
  };
  reg('w5glyph', {
    update(h, dt) { if (h.t <= 0 && !h.done) { h.done = true; sfx('crunch'); silverBurst(h.x, h.y, 4, 14); shakeMag = Math.max(shakeMag, 4); if (inEll(P.x, P.y, h.x, h.y, h.r + 4) && P.z < 30) hitP(h.dmg, h.x, true); } },
    draw(h, t) { const k = 1 - Math.max(0, h.t) / h.max; if (h.done) { const f = 1 + h.t / .4; if (f <= 0) return; ctx.save(); ctx.globalAlpha = f; ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(230,238,255,.6)'; ell(h.x, h.y, h.r, h.r / 2.2); ctx.fill(); ctx.restore(); return; }
      ctx.save(); ctx.fillStyle = tellCol(k); ell(h.x, h.y, h.r * (.4 + .6 * k), h.r * (.4 + .6 * k) / 2.2); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.6; ell(h.x, h.y, h.r, h.r / 2.2); ctx.stroke();
      ctx.translate(h.x, h.y); ctx.scale(1, .45); ctx.strokeStyle = `rgba(235,242,255,${.4 + .5 * k})`; ctx.lineWidth = 1.2; circle(0, 0, h.r * .7); ctx.stroke(); ctx.fillStyle = `rgba(235,242,255,${.5 + .4 * k})`; ctx.font = '700 22px Cinzel, Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText(h.g, 0, 8); ctx.restore(); },
  });

  // ======================================================================================================
  // THE PHANTOM OF BENEDICT
  // ======================================================================================================
  Object.assign(BOSS_WIND, { w5lunge: 1.0, w5feint: .85, w5guard: .7, w5grip: 1.05, w5cross: 1.0, w5steps: .95, w5blades: 1.0, w5wheel: 1.05 });
  const isBen = (e) => e && e.def === BOSSES.benedict;
  // THE LONG LUNGE: down your lane, from one end of the hall to the other; with the silver arm he comes back down another
  const lungeT = (e) => targets(e, () => ({ y: yClamp(P.y), d: Math.sign(P.x - e.x) || e.facing }));
  function lungeBand(x0, d, y, k) {
    const x1 = d > 0 ? rightWall() : leftWall(); ctx.fillStyle = tellCol(k); ctx.fillRect(Math.min(x0, x1), y - 16, Math.abs(x1 - x0), 32);
    ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x0, y - 16); ctx.lineTo(x1, y - 16); ctx.moveTo(x0, y + 16); ctx.lineTo(x1, y + 16); ctx.stroke();
    ctx.lineWidth = 2; for (let i = 1; i < 7; i++) { const ax = x0 + d * (i * 60 + (performance.now() / 6) % 60); if ((ax - x1) * d > 0) break; ctx.beginPath(); ctx.moveTo(ax, y - 8); ctx.lineTo(ax + d * 10, y); ctx.lineTo(ax, y + 8); ctx.stroke(); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(235,242,255,.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.restore(); // the line of his point
  }
  TELL_FX.w5lunge = (e, t, k) => { const T = lungeT(e); lungeBand(e.x, T.d, T.y, k); };
  PLAN_FX.w5lunge = (e) => {
    const T = lungeT(e); e.w5T = null; sfx('whoosh');
    const run = (h, from, d, y) => { h.x0 = from; h.d = d; h.ly = y; h.x1 = d > 0 ? Math.min(rightWall() - 30, from + 520) : Math.max(leftWall() + 30, from - 520); h.r = 0; h.hit = false; };
    act(e, 'lunge', (h, dt, e) => {
      if (h.wait > 0) { h.wait -= dt; e.facing = h.d; if (h.wait <= 0) { sfx('whoosh'); h.r = 0; } return false; }
      h.r += dt; const u = cl01(h.r / .32), px = e.x; e.x = lerp(h.x0, h.x1, sm(u)); e.y += (h.ly - e.y) * Math.min(1, dt * 14); e.facing = h.d;
      if (!h.hit && Math.abs(P.y - h.ly) < 18 && P.z < 40 && (P.x - Math.min(px, e.x) + e.hw + 30) >= 0 && (Math.max(px, e.x) + e.hw + 30 - P.x) >= 0 && Math.sign(P.x - h.x0) === h.d) { h.hit = true; hitP(Math.round(edmg(e) * 1.1), e.x, true); }
      if (Math.random() < .7) dust(e.x - h.d * 20, e.y, 1);
      if (u >= 1) {
        if (e.phase >= 2 && !h.second) { h.second = true; run(h, e.x, -h.d, yClamp(P.y)); h.wait = .5; return false; } // and back again, down the lane you are in now
        recover(e, 1.05); return true; } // spent at the end of the hall: your opening
      return false;
    }, { wait: 0 });
    const h = hazards[hazards.length - 1]; run(h, e.x, T.d, T.y);
    h.draw = (h, t) => { if (h.wait > 0) { ctx.save(); lungeBand(e.x, h.d, h.ly, 1 - h.wait / .5); ctx.restore(); } };
  };
  // FEINT AND CUT: he shows you the cut in front of him, steps through the air, and the real cut comes from behind you
  TELL_FX.w5feint = (e, t, k) => { const R = 84; ctx.fillStyle = tellCol(k * .7); ctx.beginPath(); ctx.ellipse(e.x, e.y, R, R / 2.2, 0, e.facing > 0 ? -Math.PI / 2 : Math.PI / 2, e.facing > 0 ? Math.PI / 2 : Math.PI * 1.5); ctx.lineTo(e.x, e.y); ctx.fill(); ctx.setLineDash([5, 4]); ctx.strokeStyle = tellLine(k * .6); ctx.lineWidth = 1.4; ctx.stroke(); ctx.setLineDash([]); };
  PLAN_FX.w5feint = (e) => {
    sfx('whoosh'); mist(e.x, e.y, 30, 12); ghosts.push({ x: e.x, y: e.y, z: 0, facing: e.facing, pose: { arm: -2 }, a: .3, dark: false });
    act(e, 'feint', (h, dt, e) => {
      if (h.el < .22) { e.w5vis = 1 - h.el / .22; e.w5k = 0; return false; }
      if (!h.moved) { h.moved = true; let tx = P.x - P.facing * 58; if (tx < leftWall() + 30 || tx > rightWall() - 30) tx = P.x + P.facing * 58; e.x = xClamp(tx); e.y = yClamp(P.y); e.facing = Math.sign(P.x - e.x) || 1; h.mx = e.x; h.my = e.y; h.mf = e.facing; mist(e.x, e.y, 30, 12); sfx('swing'); floatText(P.x, P.y, 100, 'BEHIND YOU', '#E8EEF8', 13); }
      e.w5vis = Math.min(1, (h.el - .22) / .2); e.facing = h.mf;
      const k = cl01((h.el - .6) / .2); e.w5k = k;
      if (h.el > .6 && !h.hit) { h.hit = true; sfx('slice'); const fwd = (P.x - e.x) * e.facing; if (fwd > -10 && fwd < 92 && Math.abs(P.y - e.y) < 24 && P.z < 44) hitP(edmg(e), e.x, true); }
      if (h.el > .85) { recover(e, 1.1); return true; } return false;
    }).draw = (h, t) => { if (!h.moved || h.hit) return; const k = cl01((h.el - .22) / .38), R = 92; ctx.save(); ctx.fillStyle = tellCol(k); ctx.beginPath(); ctx.ellipse(h.mx, h.my, R, R / 2.2, 0, h.mf > 0 ? -Math.PI / 2 : Math.PI / 2, h.mf > 0 ? Math.PI / 2 : Math.PI * 1.5); ctx.lineTo(h.mx, h.my); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); };
  };
  // THE PERFECT GUARD: he stands en garde. Strike his front and he parries and ripostes at once; get behind him and break it
  TELL_FX.w5guard = (e, t, k) => guardSign(e, k);
  function guardSign(e, k) { const R = 46 + e.hw; ctx.fillStyle = guardCol(k); ell(e.x, e.y, R, R / 2.2); ctx.fill(); ctx.strokeStyle = guardLine(k); ctx.lineWidth = 2; ell(e.x, e.y, R, R / 2.2); ctx.stroke();
    ctx.lineWidth = 2.4; ctx.beginPath(); const fx = e.x + e.facing * R * .7; ctx.moveTo(fx - 9, e.y - 6); ctx.lineTo(fx + 9, e.y + 6); ctx.moveTo(fx + 9, e.y - 6); ctx.lineTo(fx - 9, e.y + 6); ctx.stroke(); // crossed blades on his guarded side
    label(e.x - e.facing * R * .6, e.y + 3, 'OPEN', .4 + .4 * k); }
  PLAN_FX.w5guard = (e) => {
    floatText(e.x, e.y, e.hh * e.size + 30, 'EN GARDE', '#C8DAFF', 15); sfx('hit-metal', .4); e.w5guarding = true; e.w5parryT = 0;
    act(e, 'guard', (h, dt, e) => { e.w5guarding = true; e.facing = Math.sign(P.x - e.x) || e.facing; e.w5parryT = Math.max(0, (e.w5parryT || 0) - dt); if (h.el > 2.1) { e.w5guarding = false; recover(e, .5); return true; } return false; })
      .draw = (h, t) => guardSign(h.e, 1);
  };
  // what happens to a blow that lands on his guard (strike() is wrapped in w5Dom)
  W5.guardHit = (e, m) => {
    if (m.trump) return false; // a Trump's power is not a blade
    const front = (P.x - e.x) * e.facing > 0;
    if (front) {
      floatText(e.x, e.y, e.hh * e.size + 18, 'PARRIED', '#C8DAFF', 15); sfx('hit-metal', 1); hitstop = Math.max(hitstop, .08); shakeMag = Math.max(shakeMag, 4);
      burst(e.x + e.facing * 20, e.y, 50, ['#FFFFFF', '#C8DAFF'], 10, 'spark', -e.facing);
      if ((e.w5parryT || 0) <= 0) { e.w5parryT = .45; fx.push({ kind: 'slash', x: e.x + e.facing * 40, y: e.y, z: 40, ang: 0, t: .2, max: .2, size: 50, col: '#E8EEF8' }); const fwd = (P.x - e.x) * e.facing; if (fwd < 110 && Math.abs(P.y - e.y) < 26 && P.z < 50) hitP(Math.round(edmg(e) * .8), e.x, true); } // the riposte
      return true;
    }
    e.w5guarding = false; e.state = 'down'; e.t = 1.5; e.plan = null; floatText(e.x, e.y, e.hh * e.size + 24, 'GUARD BROKEN', '#FFE2A0', 17); sfx('break'); hitstop = Math.max(hitstop, .12); shakeMag = Math.max(shakeMag, 8);
    return 'crit';
  };
  // THE SILVER ARM REACHES: the hand comes out on its chain of moonlight to where you stand; caught, you are drawn in to the blade
  W5.gripT = (e) => e.w5G || { x: P.x, y: yClamp(P.y) };
  TELL_FX.w5grip = (e, t, k) => { const G = W5.gripT(e), lock = k > .7, r = 34; ctx.fillStyle = tellCol(lock ? k : k * .5); ell(G.x, G.y, r, r / 2.2); ctx.fill(); if (!lock) ctx.setLineDash([4, 4]); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 2; ell(G.x, G.y, r, r / 2.2); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = `rgba(255,220,220,${.4 + .4 * k})`; for (let i = 0; i < 4; i++) { ell(G.x + 8 + i * 3, G.y - 6 + i * 3.4, 6, 1.2, .2); ctx.fill(); } ell(G.x - 6, G.y, 7, 4); ctx.fill(); // an open hand on the floor
    if (lock) label(G.x, G.y - r / 2.2 - 4, 'LOCKED', .5 + .4 * k); };
  PLAN_FX.w5grip = (e) => {
    const G = Object.assign({}, W5.gripT(e)); e.w5G = null; sfx('charge', 1);
    const local = () => { const s = e.size, lx = (G.x - e.x) * e.facing / s - 4, ly = (G.y - e.y) / s - (-58 + 5); return [lx, ly]; }; // from his shoulder, in his own space
    act(e, 'grip', (h, dt, e) => {
      const [lx, ly] = local(), d = Math.hypot(lx, ly), A = Math.atan2(ly, lx), full = Math.max(0, d - 23); e.w5siA = A;
      if (h.el < .32) { e.w5reach = full * sm(h.el / .32); return false; }
      if (!h.slam) { h.slam = true; e.w5reach = full; sfx('slam'); shakeMag = Math.max(shakeMag, 5); silverBurst(G.x, G.y, 4, 10);
        if (inEll(P.x, P.y, G.x, G.y, 36) && P.z < 30 && P.state !== 'dodge' && P.inv <= 0) { h.caught = true; e.w5caught = 1; floatText(P.x, P.y, 96, 'CAUGHT', '#E8EEF8', 15); } }
      if (h.caught) { // drawn in on the chain, then the cut
        const u = cl01((h.el - .32) / .38), tx = e.x + e.facing * 44; P.state = 'hurt'; P.t = Math.max(P.t, .2); P.vx = 0; P.x = lerp(G.x, tx, sm(u)); P.y = lerp(G.y, e.y, sm(u)); e.w5reach = full * (1 - sm(u)) + 2;
        if (u >= 1 && !h.cut) { h.cut = true; sfx('slice'); hitP(Math.round(edmg(e) * 1.2), e.x, true); fx.push({ kind: 'slash', x: tx, y: e.y, z: 40, ang: -.4, t: .25, max: .25, size: 56, col: '#E8EEF8' }); }
        if (h.el > .85) { recover(e, .8); return true; } return false;
      }
      e.w5reach = full * (1 - sm(cl01((h.el - .5) / .35))); // it missed: the arm comes home, slowly
      if (h.el > .9) { recover(e, 1.15); return true; } return false; // and he is open while it does
    });
  };
  // CROSSED BLADES: the sword and the silver hand cut an X through where you stand, one stroke after the other
  const crossT = (e) => targets(e, () => ({ x: clamp(P.x, leftWall() + 60, rightWall() - 60), y: yClamp(P.y) }));
  const crossSeg = (T, i) => { const dx = 170, dy = 52, s = i ? -1 : 1; return [T.x - dx, T.y - dy * s, T.x + dx, T.y + dy * s]; };
  const segDist = (px, py, s) => { const [x0, y0, x1, y1] = s, vx = x1 - x0, vy = y1 - y0, u = cl01(((px - x0) * vx + (py - y0) * vy) / (vx * vx + vy * vy)); return Math.hypot(px - (x0 + vx * u), py - (y0 + vy * u)); };
  function crossBand(s, k, n, live) { const [x0, y0, x1, y1] = s, a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0);
    ctx.save(); ctx.translate(x0, y0); ctx.rotate(a); ctx.fillStyle = live ? tellCol(k) : tellCol(k * .5); ctx.fillRect(0, -11, L, 22); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.4; ctx.strokeRect(0, -11, L, 22); ctx.restore(); label(x0 + (x1 - x0) * .1, y0 + (y1 - y0) * .1 - 6, String(n), .5 + .4 * k); }
  TELL_FX.w5cross = (e, t, k) => { const T = crossT(e); crossBand(crossSeg(T, 0), k, 1, true); crossBand(crossSeg(T, 1), k, 2, false); };
  PLAN_FX.w5cross = (e) => {
    const T = crossT(e); e.w5T = null; sfx('whoosh');
    act(e, 'cross', (h, dt, e) => { e.w5k = cl01(h.el / .5);
      for (const [i, at] of [[0, .12], [1, .34]]) if (h.el > at && !h['c' + i]) { h['c' + i] = true; sfx('slice'); shakeMag = Math.max(shakeMag, 5); const s = crossSeg(T, i); h.flash.push({ s, t: .3 });
        if (!h.hit && segDist(P.x, P.y, s) < 15 && P.z < 44) { h.hit = true; hitP(Math.round(edmg(e) * 1.05), e.x, true); } }
      for (const f of h.flash) f.t -= dt;
      if (h.el > .75) { recover(e, 1.0); return true; } return false;
    }, { flash: [] }).draw = (h, t) => { if (!h.c1) crossBand(crossSeg(T, 1), 1, 2, true); for (const f of h.flash) if (f.t > 0) { const [x0, y0, x1, y1] = f.s; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(235,242,255,${f.t * 3})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore(); } };
  };
  // ECHO OF YOUR STEPS: the city remembers where you walked. A ghost blade falls on each footprint, oldest first: don't go back
  W5.trail = [];
  TELL_FX.w5steps = (e, t, k) => { for (let i = 0; i < W5.trail.length; i++) { const p = W5.trail[i]; footprint(p.x, p.y, k * (.4 + .6 * i / W5.trail.length), false); } };
  function footprint(x, y, k, next) { ctx.fillStyle = next ? tellCol(1) : `rgba(225,235,255,${.25 + .45 * k})`; ell(x - 3, y - 2, 4, 1.8, -.2); ctx.fill(); ell(x + 3, y + 2, 4, 1.8, -.2); ctx.fill(); if (next) { ctx.strokeStyle = tellLine(1); ctx.lineWidth = 1.4; ell(x, y, 22, 10); ctx.stroke(); } }
  PLAN_FX.w5steps = (e) => {
    const marks = W5.trail.map((p, i) => ({ x: p.x, y: p.y, at: .55 + i * .13, done: false })); sfx('charge', 2);
    if (!marks.length) marks.push({ x: P.x, y: P.y, at: .6, done: false });
    hazards.push({ kind: 'w5steps', marks, el: 0, t: 9, max: 9, dmg: edmg(e), hit: false });
    act(e, 'steps', (h, dt, e) => { if (h.el > .7) { recover(e, .9); return true; } return false; });
  };
  reg('w5steps', {
    update(h, dt) { h.el += dt; let left = 0;
      for (const m of h.marks) { if (m.done) continue; left++; if (h.el >= m.at) { m.done = true; m.f = .4; sfx('slice'); if (!h.hit && inEll(P.x, P.y, m.x, m.y, 26) && P.z < 36) { h.hit = true; hitP(h.dmg, m.x, true); } } }
      for (const m of h.marks) if (m.f > 0) m.f -= dt;
      if (!left && h.marks.every(m => !(m.f > 0))) h.t = -1; },
    draw(h, t) { const next = h.marks.find(m => !m.done); for (const m of h.marks) if (!m.done) footprint(m.x, m.y, 1, m === next); },
    ups(h, list, t) { for (const m of h.marks) { if (m.done && !(m.f > 0)) continue; const z = m.done ? 0 : Math.max(0, (m.at - h.el) / .3) * 120; if (!m.done && z > 110) continue;
      list.push([m.y, () => onMain(() => { ctx.save(); ctx.globalAlpha = m.done ? m.f / .4 : .8; ctx.translate(m.x, m.y - 4 - z); ctx.rotate(Math.PI / 2); benSword(40, 0); ctx.restore(); })]); } },
    box(h, box) { for (const m of h.marks) box(m.x, m.y, 0, 30, 140); },
  });
  // MOONFALL OF BLADES: the swords of his mandorla fall across the hall in a sweeping wave, one rank after another; one gap runs through them
  PLAN_FX.w5blades = (e) => {
    const n = 9, x0 = leftWall() + 6, x1 = rightWall() - 6, w = (x1 - x0) / n, dir = e.x < (x0 + x1) / 2 ? 1 : -1, cols = [];
    let gy = yClamp(P.y + (P.y > (FLOOR_TOP + FLOOR_BOT) / 2 ? -1 : 1) * rand(46, 70)); for (let i = 0; i < n; i++) { const ci = dir > 0 ? i : n - 1 - i; gy = clamp(gy + rand(-26, 26), FLOOR_TOP + 22, FLOOR_BOT - 14); cols.push({ x: x0 + (ci + .5) * w, w, gy, at: .85 + i * .2, done: false }); }
    hazards.push({ kind: 'w5blades', cols, el: 0, t: 9, max: 9, dmg: edmg(e), hit: false }); e.w5halo = 0; sfx('charge', 2);
    act(e, 'blades', (h, dt, e) => { if (h.el > .9) { recover(e, 1.0); return true; } return false; });
  };
  reg('w5blades', {
    update(h, dt) { h.el += dt; let left = 0;
      for (const c of h.cols) { if (c.done) { c.f -= dt; continue; } left++; if (h.el >= c.at) { c.done = true; c.f = .45; sfx('slice'); shakeMag = Math.max(shakeMag, 3);
        if (!h.hit && Math.abs(P.x - c.x) < c.w / 2 + 4 && Math.abs(P.y - c.gy) > 20 && P.z < 60) { h.hit = true; hitP(h.dmg, c.x, true); } } }
      if (!left && h.cols.every(c => c.f <= 0)) h.t = -1; },
    draw(h, t) { for (const c of h.cols) { if (c.done) continue; const k = cl01(1 - (c.at - h.el) / .9);
      ctx.fillStyle = tellCol(k * .8); ctx.fillRect(c.x - c.w / 2 + 2, FLOOR_TOP + 6, c.w - 4, c.gy - 20 - FLOOR_TOP - 6); ctx.fillRect(c.x - c.w / 2 + 2, c.gy + 20, c.w - 4, FLOOR_BOT + 6 - c.gy - 20);
      ctx.strokeStyle = 'rgba(200,225,255,.7)'; ctx.lineWidth = 1.4; ell(c.x, c.gy, c.w / 2 - 2, 9); ctx.stroke(); } }, // the gap, left clear
    ups(h, list, t) { for (const c of h.cols) { const pre = (c.at - h.el); if (c.done ? c.f <= 0 : pre > .3) continue; const z = c.done ? 0 : pre / .3 * 140, a = c.done ? c.f / .45 : 1;
      for (let j = 0; j < 4; j++) { const y = FLOOR_TOP + 14 + j * 26 + (j > 1 ? 8 : 0); if (Math.abs(y - c.gy) < 20) continue; list.push([y, () => onMain(() => { ctx.save(); ctx.globalAlpha = a * .85; ctx.translate(c.x + (j % 2) * 6 - 3, y - z - 2); ctx.rotate(Math.PI / 2); benSword(38, 0); ctx.restore(); })]); } } },
    box(h, box) { for (const c of h.cols) box(c.x, FLOOR_BOT, 0, c.w, 260); },
  });
  // THE SILVER WHEEL (his close-range answer): blade and silver hand together in a full turn, a wheel of light round him
  const wheelR = (e) => e.hw + 84;
  TELL_FX.w5wheel = (e, t, k) => { const R = wheelR(e); ctx.fillStyle = tellCol(k); ell(e.x, e.y, R * (.4 + .6 * k), R * (.4 + .6 * k) / 2.2); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 2; ell(e.x, e.y, R, R / 2.2); ctx.stroke();
    ctx.lineWidth = 2.2; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + t * 2 * k; ctx.beginPath(); ctx.moveTo(e.x + Math.cos(a) * R * .8, e.y + Math.sin(a) * R * .8 / 2.2); ctx.lineTo(e.x + Math.cos(a + .25) * R, e.y + Math.sin(a + .25) * R / 2.2); ctx.stroke(); } };
  PLAN_FX.w5wheel = (e) => {
    sfx('whoosh'); shakeMag = Math.max(shakeMag, 8);
    act(e, 'wheel', (h, dt, e) => { e.w5k = cl01(h.el / .5);
      if (!h.hit && h.el > .12) { h.hit = true; const R = wheelR(e); if (inEll(P.x, P.y, e.x, e.y, R) && P.z < 50) hitP(Math.round(edmg(e) * 1.1), e.x, true); fx.push({ kind: 'ring', x: e.x, y: e.y, z: 30, t: .4, max: .4, r: R, col: '#E8EEF8' }); silverBurst(e.x, e.y, 40, 20); }
      if (h.el > .5) { recover(e, 1.2); return true; } return false; }); // it leaves him turned and open for a moment
  };

  // ======================================================================================================
  // THE RULES OF THE PLACES
  // ======================================================================================================
  // ---------------- THE STAIR OF MOONLIGHT: the dawn is coming up behind you ----------------
  // Tir-na Nog'th is there only while the moon is up. Behind you the sky is paling, and wherever the dawn has reached
  // the city is simply gone: stand in it and it burns you and drives you on. It creeps in on you even while you fight
  // (though slowly, and never past a third of the way across), and every foe you put down wins a little of the night back.
  // The ghosts of the city burn in it too: knock them back into the light.
  MECH_FX.w5dawn = {
    start(m) { m.x = -260; m.seen = new Set(); m.tick = 0; m.etick = 0; m.told = 0; },
    update(m, dt) {
      if (stillT > 0 || zoneTrans) return;
      if (!m.told && P.x > 140) { m.told = 1; floatText(P.x, P.y, 110, 'THE DAWN IS COMING · KEEP AHEAD OF IT', '#F4D8C8', 14); }
      for (const e of enemies) if (e.dead && !m.seen.has(e)) { m.seen.add(e); m.x -= 46; } // every foe put down wins back a little night
      const lx = lockX !== null ? lockX : camX;
      if (waveActive) m.x = Math.min(m.x + 9 * dt, lx + VW * .34);
      else { m.x = Math.max(m.x, camX - 140); m.x += (P.x - m.x > 420 ? 60 : 26) * dt; }
      m.x = Math.max(m.x, -260);
      m.k = cl01((m.x - camX + 40) / 120);
      if (P.x < m.x - 6 && P.state !== 'dead') { m.tick -= dt; if (m.tick <= 0) { m.tick = .5; hitP(Math.max(4, Math.round(maxHp() * .05)), P.x - 60, false); if (P.state === 'hurt') P.vx = 260; floatText(P.x, P.y, 90, 'THE DAWN BURNS', '#FFD8C0', 13); } }
      m.etick -= dt;
      if (m.etick <= 0) { m.etick = .4; for (const e of enemies) if (!e.dead && !e.boss && e.state !== 'enter' && e.x < m.x) { strike(e, 8, 1, { dmg: 8, kb: 120, power: 0, trump: 1 }); if (!e.w5burnt) { e.w5burnt = 1; floatText(e.x, e.y, e.hh + 24, 'THE DAWN TAKES IT', '#FFD8C0', 11); } } }
    },
    boxes(m, box) {},
    list(m, list, t) {
      const x1 = m.x; if (x1 < camX - 20) return;
      list.push([FLOOR_TOP - 2, () => onMain(() => { // where the dawn has come, the city is not: only the pale sky, and motes of what was there
        ctx.save(); const x0 = camX - 10, edge = 60, top = Y_OFF;
        const g = ctx.createLinearGradient(x1 - edge, 0, x1, 0); g.addColorStop(0, 'rgba(250,214,196,.86)'); g.addColorStop(1, 'rgba(250,214,196,0)');
        const v = ctx.createLinearGradient(0, top, 0, VH); v.addColorStop(0, 'rgba(246,190,176,.9)'); v.addColorStop(.5, 'rgba(252,222,200,.86)'); v.addColorStop(1, 'rgba(255,236,214,.8)');
        if (x1 - edge > x0) { ctx.fillStyle = v; ctx.fillRect(x0, top, x1 - edge - x0, VH - top); }
        ctx.fillStyle = g; ctx.fillRect(Math.max(x0, x1 - edge), top, Math.min(edge, x1 - x0), VH - top);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 28; i++) { const life = (t * .25 + hsh(i)) % 1, px = x1 - hsh(i + 1) * 70, py = VH - life * (VH - top) * (.6 + hsh(i + 2) * .4); ctx.fillStyle = `rgba(255,240,220,${Math.sin(life * Math.PI) * .6})`; circle(px, py, 1 + hsh(i + 3) * 1.4); ctx.fill(); } // the city coming apart at the edge
        ctx.restore();
      })]);
    },
  };

  // ---------------- THE STREETS: the city is only where the moon falls ----------------
  // Clouds drift slowly over the moon, and their shadows drift over the street; under a shadow the paving is not there
  // (you see the night sky through it, and the cloud far below). Stand in one and you sink, and fall through, and the moon
  // catches you somewhere else, hurt. The ghosts of the city float over it; but anything knocked down into it falls.
  // At the end of the street the Sphinx waits with a riddle (see below).
  const cloudsFor = () => { const c = []; for (let i = 0; i < 4; i++) c.push(newCloud(i, true)); return c; };
  function newCloud(i, init) { const dir = i % 2 ? -1 : 1, rx = rand(62, 96);
    return { id: Math.random() * 1e4 | 0, dir, x: init ? 320 + i * 380 + rand(-60, 60) : (dir > 0 ? camX - rx - rand(60, 300) : camX + VW + rx + rand(60, 300)), y: rand(FLOOR_TOP + 28, FLOOR_BOT - 22), rx, ry: rand(18, 26), vx: dir * rand(18, 28) }; }
  const inCore = (c, x, y, s = .74) => Math.hypot((x - c.x) / (c.rx * s), (y - c.y) / (c.ry * s)) < 1;
  const inAnyCore = (x, y, s) => MECH_ONE && MECH_ONE.cl && MECH_ONE.cl.some(c => inCore(c, x, y, s));
  let MECH_ONE = null;
  function safeSpot(x, y) { // the nearest place the moon is shining
    for (let r = 0; r < 300; r += 12) for (const [dx, dy] of [[r, 0], [-r, 0], [0, r * .4], [0, -r * .4], [r, r * .3], [-r, -r * .3]]) { const px = clamp(x + dx, leftWall() + 20, rightWall() - 20), py = clamp(y + dy, FLOOR_TOP + 10, FLOOR_BOT - 2); if (!inAnyCore(px, py, 1.05)) return [px, py]; }
    return [x, y];
  }
  const RIDDLES = [
    ['What walks on four legs in the morning, on two at noon, and on three in the evening?', 'A man', 'The moon', 'A unicorn'],
    ['The more of me there is, the less you see. What am I?', 'Darkness', 'Moonlight', 'A mirror'],
    ['I am drawn, but never pulled. I am cold to the touch. I am a face, and I am a door. What am I?', 'A card', 'A sword', 'A ghost'],
    ['Walk me once and you are made anew. I lie beneath the true city, and the one who stops on me dies. What am I?', 'The Pattern', 'The Black Road', 'The moon-stair'],
    ['I have a mouth but never speak, a bed but never sleep, and I run but never walk. What am I?', 'A river', 'A road', 'A hound'],
    ['What can fill a hall to its rafters and yet take up no room at all?', 'Light', 'Water', 'A crowd'],
  ];
  MECH_FX.w5cloud = {
    start(m) { MECH_ONE = m; m.cl = cloudsFor(); m.warn = 0; m.sph = null; m.sphDone = false; },
    update(m, dt) {
      MECH_ONE = m;
      if (!zoneTrans && stillT <= 0) for (const c of m.cl) { c.x += c.vx * dt * (m.sph && m.sph.phase !== 'fight' ? .3 : 1); if ((c.dir > 0 && c.x > camX + VW + c.rx + 320) || (c.dir < 0 && c.x < camX - c.rx - 320)) Object.assign(c, newCloud(c.dir > 0 ? 0 : 1, false)); }
      m.warn = Math.max(0, m.warn - dt);
      // the prince: in the shadow of a cloud he sinks, and falls through the city
      const inside = !zoneTrans && P.z <= 1 && !['dodge', 'dead'].includes(P.state) && P.inv <= 0 && inAnyCore(P.x, P.y);
      P.w5sink = inside ? (P.w5sink || 0) + dt : Math.max(0, (P.w5sink || 0) - dt * 2);
      if (inside && !m.warn) { m.warn = 3; floatText(P.x, P.y, 100, 'THE STREET IS NOT THERE', '#C8D4EC', 13); }
      if (P.w5sink > .55) { P.w5sink = 0; sfx('whoosh'); mist(P.x, P.y, 10, 14);
        const [sx, sy] = safeSpot(P.x, P.y); P.x = sx; P.y = sy; hitP(Math.max(6, Math.round(maxHp() * .1)), P.x, false); floatText(P.x, P.y, 96, 'FELL THROUGH THE CITY', '#C8D4EC', 13); fx.push({ kind: 'ring', x: P.x, y: P.y, z: 2, t: .5, max: .5, r: 50, col: '#DDE6F4', flat: 1 }); }
      // the fallen: anything knocked down into the shadow goes through
      for (const e of enemies) { if (e.dead || e.boss || e.def.move === 'fly' || e.state === 'enter' || e.state === 'w5riddle') continue;
        const knocked = ['hurt', 'down'].includes(e.state) && e.z < 4;
        e.w5sink = knocked && inAnyCore(e.x, e.y) ? (e.w5sink || 0) + dt : 0;
        if (e.w5sink > .3) { e.w5sink = 0; mist(e.x, e.y, 10, 14); floatText(e.x, e.y, e.hh + 26, 'FELL THROUGH', '#C8D4EC', 13); sfx('whoosh');
          const dmg = e.type === 'w5sphinx' ? Math.round(e.maxHp * .15) : Math.max(30, Math.round(e.maxHp * .6)); strike(e, dmg, Math.sign(e.x - P.x) || 1, { dmg, kb: 0, power: 2, trump: 1 });
          if (!e.dead) { const [sx, sy] = safeSpot(e.x, e.y); e.x = sx; e.y = sy; } } }
      sphinxUpdate(m, dt);
    },
    boxes(m, box) { const S = m.sph; if (S) { box(S.ex - 120, FLOOR_TOP + 50, 0, 70, 80); box(camX + VW / 2, Y_OFF + 60, 0, VW / 2, 60); } },
    list(m, list, t) {
      for (const c of m.cl) { if (c.x + c.rx < camX - 20 || c.x - c.rx > camX + VW + 20) continue;
        list.push([FLOOR_TOP - 1, () => onMain(() => { // the shadow on the street; inside it, the street is gone and there is the night
          ctx.save(); ctx.fillStyle = 'rgba(4,8,24,.4)'; ell(c.x, c.y, c.rx, c.ry); ctx.fill();
          ell(c.x, c.y, c.rx * .74, c.ry * .74); ctx.clip();
          const g = ctx.createLinearGradient(0, c.y - c.ry, 0, c.y + c.ry); g.addColorStop(0, '#02040C'); g.addColorStop(1, '#101A3C'); ctx.fillStyle = g; ctx.fillRect(c.x - c.rx, c.y - c.ry, c.rx * 2, c.ry * 2);
          for (let i = 0; i < 16; i++) { ctx.fillStyle = `rgba(230,238,255,${.4 + hsh(c.id + i) * .5})`; circle(c.x + (hsh(c.id + i * 3) - .5) * c.rx * 1.4, c.y + (hsh(c.id + i * 7) - .5) * c.ry * 1.4, .6 + hsh(i) * .6); ctx.fill(); } // stars, far below the city
          ctx.fillStyle = 'rgba(60,76,130,.5)'; for (let i = 0; i < 4; i++) ell(c.x + (hsh(c.id + i * 11) - .5) * c.rx, c.y + c.ry * .4, c.rx * .3, c.ry * .16); ctx.fill(); // the cloud sea, a long way down
          ctx.restore();
          ctx.save(); ctx.setLineDash([4, 5]); ctx.strokeStyle = 'rgba(205,218,245,.45)'; ctx.lineWidth = 1.2; ell(c.x, c.y, c.rx * .74, c.ry * .74); ctx.stroke(); ctx.restore();
        })]); }
      if ((P.w5sink || 0) > 0) list.push([P.y + .3, () => onMain(() => { const k = P.w5sink / .55; ctx.save(); ctx.fillStyle = `rgba(2,4,14,${.4 + .5 * k})`; ell(P.x, P.y, 16, 5); ctx.fill(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(200,214,245,${.3 * k})`; ell(P.x, P.y - 20 * k, 14, 30 * k); ctx.fill(); ctx.restore(); })]); // he is sinking
      sphinxList(m, list, t);
    },
  };
  // ---------------- THE SPHINX: she bars the end of the street and asks one riddle. Walk onto your answer. ----------------
  // Answered rightly, she gives you a gift and flies; answered wrongly, she will have you instead, and you must fight her.
  function sphinxUpdate(m, dt) {
    if (stage.secret || m.sphDone) return;
    if (!m.sph) {
      if (!stage.waves.length || waveIdx < stage.waves.length || waveActive || zoneTrans) return;
      waveActive = true; lockX = clamp(camX, 0, Math.max(0, stage.len - VW)); $('#go').hidden = true;
      const e = spawnEnemy('w5sphinx', 1); if (e.elite) { e.elite = false; e.guard = e.guardMax = 0; e.hp = e.maxHp = Math.round(e.maxHp / 1.5); } e.x = lockX + VW * .74; e.y = (FLOOR_TOP + FLOOR_BOT) / 2 + 6; e.facing = -1; e.w5calm = 1;
      if (typeof setEntrance === 'function') setEntrance(e, 'w5descend'); e.facing = -1;
      m.sph = { phase: 'arrive', e, t: 0, ex: e.x };
      for (const c of corpses) for (let i = 0; i < 6; i++) parts.push({ x: c.x + rand(-16, 16), y: c.y + rand(-4, 4), z: rand(2, 30), vx: rand(-20, 20), vy: 0, vz: rand(20, 60), life: .9, max: .9, col: 'rgba(210,222,245,.55)', size: rand(5, 10), shape: 'puff' }); // the fallen fade into moon-mist, so nothing lies over her answers
      corpses.length = 0;
      banner('The Sphinx', 'SHE WILL ASK YOU A RIDDLE', 2.6); if (typeof TRACKS !== 'undefined' && TRACKS.w5riddle) playMusic('w5riddle');
      return;
    }
    const S = m.sph, e = S.e; S.t += dt;
    if (!enemies.includes(e) && S.phase !== 'leave') { m.sph = null; if (S.phase === 'fight') m.sphDone = true; return; } // she is gone (a room change, a reset): ask again later
    if (S.phase === 'arrive' && e.state === 'idle') {
      const q = pick(RIDDLES), opts = [q[1], q[2], q[3]].sort(() => Math.random() - .5), ys = [FLOOR_TOP + 24, (FLOOR_TOP + FLOOR_BOT) / 2 + 2, FLOOR_BOT - 12];
      for (const c of corpses) for (let i = 0; i < 6; i++) parts.push({ x: c.x + rand(-16, 16), y: c.y + rand(-4, 4), z: rand(2, 30), vx: rand(-20, 20), vy: 0, vz: rand(20, 60), life: .9, max: .9, col: 'rgba(210,222,245,.55)', size: rand(5, 10), shape: 'puff' });
      corpses.length = 0; // (any that were still falling when she landed)
      S.phase = 'ask'; S.t = 0; S.q = q[0]; S.right = q[1]; S.ex = e.x; e.state = 'w5riddle'; e.facing = -1;
      S.plates = opts.map((a, i) => ({ a, x: e.x - 130 - (i === 1 ? 14 : 0), y: ys[i] }));
      sfx('trump');
    }
    if (S.phase === 'ask') {
      e.state = 'w5riddle'; e.cd = 1; P.x = Math.min(P.x, e.x - 66); // she bars the way
      if (S.t > 1.4 && P.z < 10) for (const p of S.plates) if (Math.abs(P.x - p.x) < 24 && Math.abs(P.y - p.y) < 13) { answer(m, p); break; }
    }
    if (S.phase === 'leave') { e.state = 'w5riddle'; e.z += dt * (60 + S.t * 220); e.x += dt * 40; if (e.z > 320) { e.remove = true; m.sphDone = true; m.sph = null; if (TRACKS.moon2) playMusic('moon2'); } }
    if (S.phase === 'fight' && e.dead) { m.sphDone = true; m.sph = null; if (TRACKS.moon2) playMusic('moon2'); banner('The Sphinx', 'SHE IS ANSWERED, ANOTHER WAY', 2.2); }
  }
  function answer(m, p) {
    const S = m.sph, e = S.e;
    if (p.a === S.right) {
      S.phase = 'leave'; S.t = 0; sfx('weapon'); flashT = .12; p.ok = 1;
      const sh = Math.round(160 * (1 + .5 * save.cycle)); save.shards += sh; runShards += sh; save.sigils += 3; runSigils += 3; P.hp = maxHp(); refreshHud(true);
      banner('Rightly answered', `"${S.right.toUpperCase()}" · SHE STEPS ASIDE · +${sh} SHARDS · +3 SIGILS · HEALED`, 3);
      burst(e.x, e.y, 40, ['#FFFFFF', '#DDE6F4', '#C8D4EC'], 30, 'spark', 0, true);
    } else {
      S.phase = 'fight'; p.bad = 1; e.state = 'wind'; e.plan = 'pounce'; e.t = e.windMax = .7; e.w5calm = 0; sfx('roar'); shakeMag = 10;
      banner('Wrongly answered', 'THE SPHINX WILL HAVE YOU INSTEAD', 2.4);
    }
  }
  function wrapText(s, w) { const out = []; let line = ''; for (const word of s.split(' ')) { const tryL = line ? line + ' ' + word : word; if (ctx.measureText(tryL).width > w && line) { out.push(line); line = word; } else line = tryL; } if (line) out.push(line); return out; }
  function sphinxList(m, list, t) {
    const S = m.sph; if (!S || S.phase !== 'ask') return;
    const a = cl01(S.t / .8);
    for (const p of S.plates) list.push([p.y - 1, () => onMain(() => { // a tablet of moonstone laid in the street, the answer cut into it
      ctx.save(); ctx.globalAlpha = a; ctx.translate(p.x, p.y); ctx.fillStyle = 'rgba(20,28,60,.85)'; ell(0, 0, 30, 9); ctx.fill(); ctx.strokeStyle = 'rgba(214,222,236,.9)'; ctx.lineWidth = 1.4; ell(0, 0, 30, 9); ctx.stroke();
      ctx.fillStyle = '#EEF2FA'; ctx.font = '700 8px Cinzel, Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText(p.a.toUpperCase(), 0, 3);
      ctx.restore(); })]);
    list.push([FLOOR_BOT + 50, () => onMain(() => { // the riddle, as she speaks it
      ctx.save(); ctx.globalAlpha = a; ctx.font = '700 10px Cinzel, Georgia, serif'; const W = Math.min(360, VW - 80), lines = wrapText(S.q, W - 24), H = 34 + lines.length * 13, x = camX + VW / 2 - W / 2, y = Y_OFF + 30;
      ctx.fillStyle = 'rgba(8,12,32,.86)'; rrect(x, y, W, H, 6); ctx.fill(); ctx.strokeStyle = '#C8D2E4'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.strokeStyle = 'rgba(200,210,230,.4)'; ctx.lineWidth = .8; rrect(x + 4, y + 4, W - 8, H - 8, 4); ctx.stroke();
      ctx.fillStyle = '#B8C6DC'; ctx.font = '700 8px Cinzel, Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('THE SPHINX ASKS', x + W / 2, y + 14);
      ctx.fillStyle = '#F4F7FC'; ctx.font = '700 10px Cinzel, Georgia, serif'; lines.forEach((l, i) => ctx.fillText(l, x + W / 2, y + 28 + i * 13));
      ctx.fillStyle = '#B8C6DC'; ctx.font = '700 7px Cinzel, Georgia, serif'; ctx.fillText('WALK ONTO YOUR ANSWER', x + W / 2, y + H - 6);
      ctx.restore(); })]);
  }

  // ---------------- THE MOON THRONE: the night ends as the fight does ----------------
  // As the Phantom changes the moon goes down and the east pales; in his last shape the dawn has reached the edges of
  // the hall, and the floor is not there at either end. The city remembers where you have walked (his Echo of Your Steps).
  MECH_FX.w5throne = {
    start(m) { m.ph = 1; m.rec = 0; W5.trail = []; W5.dawnK = 0; m.edge = 0; m.tick = 0; m.arm = null; },
    update(m, dt) {
      const e = boss && isBen(boss) ? boss : null;
      if (!e) { W5.dawnK = 0; return; }
      if (e.phase !== m.ph && !e.dead) { m.ph = e.phase; e.w5shift = 1; e.w5T = null; mist(e.x, e.y, 30, 24); sfx('trump');
        floatText(e.x, e.y, e.hh * e.size + 40, e.phase === 2 ? 'THE SILVER ARM' : 'THE PHANTOM UNBOUND', '#EEF2FA', 17); }
      if (e.w5shift > 0) e.w5shift = Math.max(0, e.w5shift - dt / 1.4);
      e.w5halo = Math.min(1, (e.w5halo ?? 1) + dt * (e.state === 'w5act' && e.w5a === 'blades' ? 0 : .35));
      if (e.state !== 'w5act' || e.w5a !== 'blades') e.w5blades = Math.round(11 * e.w5halo);
      const target = e.dead ? 1 : [0, 0, .35, .75][e.phase]; W5.dawnK += (target - W5.dawnK) * Math.min(1, dt * .6);
      if (e.state === 'wind' && e.plan === 'w5grip' && 1 - e.t / e.windMax < .7) e.w5G = { x: P.x, y: yClamp(P.y) }; // the hand follows you, then fixes
      if (stillT > 0) return;
      m.rec -= dt; if (m.rec <= 0) { m.rec = .2; W5.trail.push({ x: P.x, y: P.y }); if (W5.trail.length > 15) W5.trail.shift(); } // the city remembers where you walked
      // in his last shape, the dawn has come to both ends of the hall
      m.edge += ((e.phase >= 3 && !e.dead ? 58 : 0) - m.edge) * Math.min(1, dt * 1.2);
      if (m.edge > 8 && P.state !== 'dead') { const L = leftWall() + m.edge, R = rightWall() - m.edge;
        if ((P.x < L || P.x > R) && P.z < 10) { m.tick -= dt; if (m.tick <= 0) { m.tick = .5; hitP(Math.max(4, Math.round(maxHp() * .045)), P.x < L ? P.x - 50 : P.x + 50, false); if (P.state === 'hurt') P.vx = P.x < L ? 260 : -260; floatText(P.x, P.y, 90, 'THE DAWN BURNS', '#FFD8C0', 13); } } }
      if (e.dead && !m.arm) m.arm = { x: e.x - e.facing * 8, y: e.y + 2 }; // the silver arm, left lying where he fell
      for (const p of parts) if (!p.w5 && p.shape === 'star' && p.max === 1.6 && (p.col === '#D8A0E8' || p.col === '#9FD8E0' || p.col === '#FFF0C0')) { p.w5 = 1; p.col = pick(['#EEF2FA', '#C8D4EC', '#9AAAD0']); } // the arena's weather, silver here
    },
    boxes(m, box) { if (m.arm) box(m.arm.x, m.arm.y, 0, 40, 40); },
    list(m, list, t) {
      if (m.edge > 2) list.push([FLOOR_TOP - 2, () => onMain(() => { ctx.save(); for (const s of [-1, 1]) { const x = s < 0 ? leftWall() + m.edge : rightWall() - m.edge, x0 = s < 0 ? camX - 10 : x, w = s < 0 ? x - x0 : camX + VW + 10 - x;
        const g = ctx.createLinearGradient(x, 0, x - s * 30, 0); g.addColorStop(0, 'rgba(252,218,200,0)'); g.addColorStop(1, 'rgba(252,218,200,.85)'); ctx.fillStyle = g; ctx.fillRect(x0, Y_OFF, w, VH - Y_OFF); } ctx.restore(); })]);
      if (m.arm) list.push([m.arm.y, () => { ctx.save(); ctx.translate(m.arm.x, m.arm.y); silverArm(-8, -3, -.05, 0, 1, 1.12, t); ctx.restore(); glowM(m.arm.x, m.arm.y - 4, 26, '235,242,255', .25); }]);
    },
  };

  // ======================================================================================================
  // PASSAGES
  // ======================================================================================================
  // THE MOON-PATH (Stair of Moonlight -> the Streets): the night closes in, a stair of light unrolls from the floor up to the
  // moon, step by step, and he climbs it; at the top the mist parts on the streets of the ghost city
  TRANS_FX.w5moonpath = (T, p, c, inP, t) => {
    const X1 = VW, Y0 = Y_OFF, H = VH - Y0, mx = X1 * .78, my = Y0 + H * .22;
    ctx.fillStyle = `rgba(4,6,16,${Math.min(.92, c * 1.15)})`; ctx.fillRect(0, Y0, X1, H);
    glowM(mx, my, 120, '200,215,250', .35 * c); ctx.fillStyle = `rgba(240,244,252,${c})`; circle(mx, my, 34); ctx.fill();
    ctx.fillStyle = `rgba(190,200,220,${.45 * c})`; for (const [x, y, r] of [[-10, -8, 9], [8, -12, 6], [10, 6, 8], [-6, 12, 5]]) { circle(mx + x, my + y, r); ctx.fill(); }
    const n = 30, shown = inP ? Math.floor(n * Math.min(1, p * 2.4)) : n, P0 = [X1 * .1, VH - 14], P1 = [X1 * .45, VH - 40], P2 = [mx - 20, my + 30];
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < shown; i++) { const u = i / n, iu = 1 - u, x = iu * iu * P0[0] + 2 * iu * u * P1[0] + u * u * P2[0], y = iu * iu * P0[1] + 2 * iu * u * P1[1] + u * u * P2[1], w = lerp(90, 14, u);
      ctx.fillStyle = `rgba(225,235,255,${(.75 - u * .3) * c})`; ctx.fillRect(x - w / 2, y, w, lerp(5, 1.5, u)); ctx.fillStyle = `rgba(150,170,220,${.3 * c})`; ctx.fillRect(x - w / 2, y + lerp(5, 1.5, u), w, lerp(7, 2, u)); }
    ctx.restore();
    if (inP) { const u = Math.min(1, p * 2), iu = 1 - u, x = iu * iu * P0[0] + 2 * iu * u * P1[0] + u * u * P2[0], y = iu * iu * P0[1] + 2 * iu * u * P1[1] + u * u * P2[1]; // he climbs, getting smaller as he goes up
      ctx.save(); ctx.translate(x, y); const s = lerp(1, .3, u); ctx.scale(s, s); TINT = '#D6E0F2'; drawHumanoid(heroLook(), { walk: t * 10 }); TINT = null; ctx.restore(); }
    else for (let i = 0; i < 6; i++) softDab(X1 * (i / 5), Y0 + H * .55 + Math.sin(i) * 20, 110, '200,214,245', .5 * c); // the mist he comes out of
  };
  // SILVER LEAF (the Streets -> the Moon Throne): the picture flakes away like silver leaf lifting off a panel, onto night;
  // then the night flakes away in its turn onto the throne
  TRANS_FX.w5mist = (T, p, c, inP, t) => {
    const X1 = VW, Y0 = Y_OFF, H = VH - Y0, cols = 18, rows = 10, cw = X1 / cols, ch = H / rows;
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      const id = r * cols + q, d = (q / cols) * .6 + hash1(id) * .4, x = q * cw, y = Y0 + r * ch;
      const k = inP ? cl01((p * 2 - d * .8) / .3) : 1 - cl01(((p - .5) * 2 - d * .8) / .3); // how far this square has gone
      if (k <= 0) continue;
      ctx.fillStyle = '#05070F'; ctx.fillRect(x - .5, y - .5, cw + 1, ch + 1); // the night underneath
      if (hash1(id + 5) < .25) { ctx.fillStyle = `rgba(230,238,255,${.6 * k})`; circle(x + hash1(id + 2) * cw, y + hash1(id + 3) * ch, .8); ctx.fill(); }
      const f = inP ? k : 1 - k; // the flake itself, lifting, turning, catching the light
      if (f > 0 && f < 1) { ctx.save(); ctx.translate(x + cw / 2 + hash1(id + 7) * 30 * f, y + ch / 2 - f * 90 - hash1(id + 9) * 40 * f); ctx.rotate((hash1(id + 11) - .5) * 5 * f); ctx.scale(Math.cos(f * 4 + id), 1);
        ctx.globalAlpha = 1 - f; const g = ctx.createLinearGradient(-cw / 2, -ch / 2, cw / 2, ch / 2); g.addColorStop(0, '#F4F7FC'); g.addColorStop(.5, '#A8B4CA'); g.addColorStop(1, '#D6DEEA'); ctx.fillStyle = g; ctx.fillRect(-cw / 2, -ch / 2, cw, ch);
        ctx.strokeStyle = 'rgba(40,50,80,.6)'; ctx.lineWidth = .8; ctx.strokeRect(-cw / 2, -ch / 2, cw, ch); ctx.restore(); }
    }
  };
  }; // end of late()

  // ======================================================================================================
  // THE LATE HOOKS: entrances, landmarks, and the small behaviours of this world's foes, wrapped round functions from
  // files that load after data_w5.js (entrances.js, thresholds.js, ui.js, draw.js). data_w5.js runs this at DOMContentLoaded
  // ======================================================================================================
  const dom = () => {
  const yC = (y) => clamp(y, FLOOR_TOP + 10, FLOOR_BOT - 2);
  // ---------------- how each of them comes on ----------------
  if (typeof ENTRY !== 'undefined') Object.assign(ENTRY, {
    w5courtier: ['w5kindle'], w5statue: ['w5unseen'], w5reflect: ['w5pool'], w5moth: ['w5moonbeam'], w5hound: ['w5hunt'], w5knave: ['w5dealt'], w5sphinx: ['w5descend'],
  });
  if (typeof ENTER_FX !== 'undefined') Object.assign(ENTER_FX, {
    // a lantern courtier: a mote of moonfire kindles in the air, the lantern forms round it, and the robes pour down beneath
    w5kindle: { max: 1.5, start(e, n) { e.x = entranceSpot(e); sfx('charge'); },
      update(e, n, dt) { if (n.t > .5 && !n.s) { n.s = 1; sfx('hit-crystal'); } return n.t >= n.max; },
      draw(e, n, t, inner) { const top = e.y - 74; glowM(e.x + e.facing * 6, top + 14, 18 * Math.min(1, n.t / .3), PALE, .6 * (1 - cl01((n.t - 1.1) / .4)));
        if (n.t < .35) return; const k = cl01((n.t - .35) / .9); ctx.save(); ctx.beginPath(); ctx.rect(e.x - 60, top - 10, 120, 18 + (e.y + 12 - top) * k); ctx.clip(); ctx.globalAlpha = .4 + .6 * k; inner(); ctx.restore(); } },
    // a weeping watcher: it is already there, at your back, where you were not looking
    w5unseen: { max: 1.1, start(e, n) { const x = P.x - P.facing * rand(120, 170); e.x = clamp(x, camX + 50, camX + VW - 50); if (Math.abs(e.x - P.x) < 90) e.x = clamp(P.x + P.facing * -150, camX + 50, camX + VW - 50); e.y = yC(P.y + rand(-20, 20)); e.w5pose = 'reach'; },
      update(e, n, dt) { if (n.t > .2 && !n.s) { n.s = 1; sfx('crunch'); } return n.t >= n.max; },
      draw(e, n, t, inner) { const k = cl01(n.t / .9); ctx.save(); ctx.globalAlpha = k; inner(); ctx.restore(); glowM(e.x, e.y - 40, 40, '220,232,255', .3 * (1 - k)); } },
    // a colorless reflection: a pool of moonlight spreads on the stone and the reflection in it climbs out, the right way up
    w5pool: { max: 1.5, start(e, n) { e.x = entranceSpot(e); sfx('charge'); },
      update(e, n, dt) { if (n.t > .85 && !n.s) { n.s = 1; sfx('hit-crystal'); } return n.t >= n.max; },
      draw(e, n, t, inner) { const p = cl01(n.t / .4), f = 1 - cl01((n.t - 1.2) / .3);
        ctx.save(); ctx.globalAlpha = f; ctx.fillStyle = 'rgba(200,214,245,.6)'; ell(e.x, e.y, 26 * p, 7 * p); ctx.fill(); ctx.strokeStyle = 'rgba(240,244,255,.8)'; ctx.lineWidth = 1; ell(e.x, e.y, 26 * p, 7 * p); ctx.stroke(); ctx.restore();
        if (n.t < .85) { if (n.t < .3) return; ctx.save(); ell(e.x, e.y, 26, 7); ctx.clip(); ctx.translate(e.x, e.y); ctx.scale(1, -.28); ctx.translate(-e.x, -e.y); ctx.globalAlpha = .6; inner(); ctx.restore(); return; } // only the reflection, in the pool
        const k = cl01((n.t - .85) / .6); ctx.save(); ctx.beginPath(); ctx.rect(e.x - 200, e.y - 400, 400, 403); ctx.clip(); ctx.translate(0, (1 - sm(k)) * e.hh * 1.1); inner(); ctx.restore(); } },
    // a moonmoth: it comes spiralling down a shaft of moonlight
    w5moonbeam: { max: 1.6, start(e, n) { n.x0 = entranceSpot(e); n.z0 = e.y - Y_OFF + 40; e.x = n.x0; e.z = n.z0; sfx('whoosh'); },
      update(e, n, dt) { const k = sm(cl01(n.t / n.max)); e.z = lerp(n.z0, e.def.hover, k); e.x = n.x0 + Math.cos(n.t * 5) * 18 * (1 - k); e.facing = Math.sin(n.t * 5) > 0 ? -1 : 1; return n.t >= n.max; },
      draw(e, n, t, inner) { const a = .35 * (1 - cl01((n.t - 1.1) / .5)); ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(0, Y_OFF, 0, e.y); g.addColorStop(0, `rgba(220,232,255,${a})`); g.addColorStop(1, 'rgba(220,232,255,0)'); ctx.fillStyle = g; ctx.fillRect(n.x0 - 22, Y_OFF, 44, e.y - Y_OFF); ctx.restore(); inner(); } },
    // a hound of the wild hunt: it comes down out of the sky at a gallop, as the hunt rides
    w5hunt: { max: 1.2, keepFace: 1, start(e, n) { n.x1 = entranceSpot(e); n.dir = Math.sign(P.x - n.x1) || 1; n.x0 = n.x1 - n.dir * 240; n.z0 = 190; n.y1 = yC(e.y); e.x = n.x0; e.z = n.z0; e.facing = n.dir; sfx('growl'); tone && actx && sfxOn && tone(330, .5, 'triangle', .05, 290); },
      update(e, n, dt) { const k = cl01(n.t / n.max); e.x = lerp(n.x0, n.x1, k); e.z = n.z0 * (1 - k) * (1 - k * .3); e.walk += dt * 14; if (Math.random() < .6) parts.push({ x: e.x - n.dir * 18, y: e.y, z: e.z + 4, vx: -n.dir * 40, vy: 0, vz: 0, life: .6, max: .6, col: 'rgba(220,230,250,.55)', size: rand(4, 7), shape: 'puff', rot: 0, vr: 0 });
        if (k >= 1) { e.z = 0; dust(e.x, e.y, 6); return true; } return false; },
      draw(e, n, t, inner) { inner(); } },
    // a knave of moons: dealt from the sky, it spins down and stands up on the road, then unfolds its legs
    w5dealt: { max: 1.2, start(e, n) { e.x = entranceSpot(e); n.z0 = e.y - Y_OFF + 30; e.z = n.z0; sfx('whoosh'); },
      update(e, n, dt) { const k = cl01(n.t / .8); e.z = n.z0 * (1 - sm(k)); e.w5turn = k < 1 ? (n.t * 7) % 4 : Math.max(0, (e.w5turn || 0) - dt * 4); if (k >= 1 && !n.l) { n.l = 1; sfx('slam'); dust(e.x, e.y, 4); } return n.t >= n.max; },
      draw(e, n, t, inner) { inner(); } },
    // the sphinx: down out of the moon on her wings
    w5descend: { max: 2.2, keepFace: 1, start(e, n) { n.z0 = 300; e.z = n.z0; sfx('roar'); },
      update(e, n, dt) { const k = sm(cl01(n.t / 2)); e.z = n.z0 * (1 - k); if (n.t > 2 && !n.l) { n.l = 1; sfx('slam'); shakeMag = Math.max(shakeMag, 8); dust(e.x, e.y, 14); } return n.t >= n.max; },
      draw(e, n, t, inner) { inner(); } },
  });
  // ---------------- the landmarks at the end of each area ----------------
  if (typeof THRESH !== 'undefined') {
    // the Stair of Moonlight -> the Streets: the foot of a stair of light, climbing up out of sight into the sky
    THRESH.w5moonpath = (x, y, k, t) => {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 22; i++) { const u = i / 22, sx = x - 40 + u * 120, sy = y + 30 - u * (y + 30 - Y_OFF + 20), w = 70 - u * 30;
        ctx.fillStyle = `rgba(225,235,255,${(.25 + .45 * k) * (1 - u * .5)})`; ctx.fillRect(sx - w / 2, sy, w, 4); ctx.fillStyle = `rgba(140,160,215,${.18 + .15 * k})`; ctx.fillRect(sx - w / 2, sy + 4, w, 6); }
      ctx.restore();
      for (const s of [-1, 1]) { ctx.fillStyle = C('#9AAAC8'); ctx.fillRect(x - 40 + s * 38 - 3, y - 14, 6, 44); ctx.beginPath(); ctx.rect(x - 40 + s * 38 - 3, y - 14, 6, 44); outline(1.2); ctx.fillStyle = C('#E8EEF8'); circle(x - 40 + s * 38, y - 17, 4.4); ctx.fill(); outline(1); glowM(x - 40 + s * 38, y - 17, 16, PALE, .2 + .4 * k); } // newel posts, silver-capped
      glowM(x, y - 20, 90, '210,225,255', .15 + .25 * k);
    };
    // the Streets -> the Moon Throne: the doors of the ghost palace, the unicorn on each leaf; they open as the way clears
    THRESH.w5mist = (x, y, k, t) => {
      const w = 46, h = 110, top = y - h + 30, open = sm(k);
      ctx.fillStyle = 'rgba(4,6,16,.92)'; ctx.beginPath(); ctx.moveTo(x - w, y + 30); ctx.lineTo(x - w, top + 30); ctx.quadraticCurveTo(x - w, top - 14, x, top - 22); ctx.quadraticCurveTo(x + w, top - 14, x + w, top + 30); ctx.lineTo(x + w, y + 30); ctx.fill();
      glowM(x, y - 20, 70, '225,235,255', .15 + .45 * open);
      for (const s of [-1, 1]) { const lw = w * (1 - open * .82); ctx.save(); ctx.translate(x + s * w, 0); ctx.scale(s, 1); // each leaf swings back on its hinge
        ctx.fillStyle = C('#2A3866'); ctx.beginPath(); ctx.moveTo(0, y + 30); ctx.lineTo(0, top + 30); ctx.quadraticCurveTo(0, top - 10, lw, top - 18 + (1 - open) * 0); ctx.lineTo(lw, y + 30); ctx.closePath(); ctx.fill(); outline(1.4);
        ctx.strokeStyle = C('#C8D2E4'); ctx.lineWidth = 1; ctx.beginPath(); const ux = lw * .5, uy = y - 30; ctx.moveTo(ux - 6, uy + 18); ctx.quadraticCurveTo(ux - 8, uy + 4, ux - 2, uy - 2); ctx.lineTo(ux + 5, uy); ctx.lineTo(ux + 2, uy + 4); ctx.quadraticCurveTo(ux, uy + 10, ux + 4, uy + 18); ctx.moveTo(ux - 2, uy - 2); ctx.lineTo(ux + 3, uy - 13); ctx.stroke(); ctx.restore(); } // the unicorn
      ctx.strokeStyle = C('#C8D2E4'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - w - 4, y + 30); ctx.lineTo(x - w - 4, top + 30); ctx.quadraticCurveTo(x - w - 4, top - 18, x, top - 27); ctx.quadraticCurveTo(x + w + 4, top - 18, x + w + 4, top + 30); ctx.lineTo(x + w + 4, y + 30); ctx.stroke(); // the arch, silver leaf
      for (let i = 0; i < 4; i++) softDab(x + (i - 1.5) * 30, y + 26, 30, '200,214,245', .2); // mist on the threshold
    };
  }
  // ---------------- what each of them does every frame ----------------
  // the weeping watcher moves only while he is not looking at it; the knave turns edge-on; the reflection carries his weapon;
  // the sphinx keeps perfectly still while she waits for her answer
  const watched = (e) => P && P.state !== 'dead' && mode === 'play' && (e.x - P.x) * P.facing > -4 && e.x > camX - 10 && e.x < camX + VW + 10;
  const FREEZE = ['idle', 'wind', 'recover', 'strike', 'w5act', 'evade', 'block'];
  const _upd = updateEnemy;
  updateEnemy = function (e, dt) {
    if (e.state === 'w5riddle') { e.flash = Math.max(0, e.flash - dt); e.sqx += (1 - e.sqx) * Math.min(1, dt * 12); e.sqy += (1 - e.sqy) * Math.min(1, dt * 12); return; }
    if (e.type === 'w5statue' && !e.dead && e.state !== 'enter') {
      const seen = watched(e) && FREEZE.includes(e.state); e.w5seen = seen;
      if (seen) { e.flash = Math.max(0, e.flash - dt); e.jit = Math.max(0, e.jit - dt); e.sqx += (1 - e.sqx) * Math.min(1, dt * 12); e.sqy += (1 - e.sqy) * Math.min(1, dt * 12); return; } // stone, while you look at it
      e.w5poseT = (e.w5poseT || 0) - dt; if (e.w5poseT <= 0) { e.w5poseT = .3; e.w5pose = e.state === 'w5act' || e.state === 'wind' ? 'seize' : e.state === 'recover' ? 'weep' : 'reach'; }
    }
    if (e.type === 'w5knave' && !e.dead) {
      e.w5edgeT = Math.max(0, (e.w5edgeT || 0) - dt); e.w5edgeCd = Math.max(0, (e.w5edgeCd || 0) - dt);
      const goal = e.state === 'enter' ? (e.w5turn || 0) : e.state === 'wind' && e.plan === 'w5flip' ? 1 - e.t / e.windMax : e.state === 'w5act' && e.w5a === 'glide' ? 1 : e.w5edgeT > 0 ? 1 : 0;
      if (e.state !== 'enter') e.w5turn = (e.w5turn || 0) + (goal - (e.w5turn || 0)) * Math.min(1, dt * (goal > (e.w5turn || 0) ? 9 : 14));
    }
    if (e.type === 'w5reflect' && e.state !== 'w5act') e.w5w = (W5.last && W5.last.w) || (P && P.w) || 'rapier';
    return _upd(e, dt);
  };
  // his last move is remembered (for the reflections); a big swing is seen coming by a knave, which turns edge-on to it
  const _begin = begin;
  begin = function (m) {
    _begin(m);
    if (m && m !== 'charge' && P) {
      W5.last = { name: m.name || ({ L: 'cut', LL: 'cut', A: 'cut', D: 'running strike', R: 'counter' }[m.key] || 'blow'), x1: m.x1, around: m.around, multi: m.multi, power: m.power || 0, lunge: m.lunge || 0, style: m.style, w: P.w };
      for (const e of enemies) if (e.type === 'w5knave' && !e.dead && ['idle', 'recover'].includes(e.state) && !(e.w5edgeCd > 0) && Math.abs(e.y - P.y) < 30 && (e.x - P.x) * P.facing > -10 && (e.x - P.x) * P.facing < (m.x1 || 60) + 60 && Math.random() < .4) { e.w5edgeT = .55; e.w5edgeCd = 2.2; }
    }
  };
  // blows that can't land: on a riddling sphinx, on a knave turned edge-on, and on the Phantom's guard
  const _strike = strike;
  strike = function (e, base, dir, m, echo) {
    if (e.state === 'w5riddle') return;
    if (e.type === 'w5knave' && (e.w5turn || 0) > .72 && !(m && m.trump)) { if (!(e.w5edgeMsg > performance.now())) { e.w5edgeMsg = performance.now() + 600; floatText(e.x, e.y, e.hh + 12, 'EDGE-ON', '#DDE6F4', 12); } return; }
    if (e.def === BOSSES.benedict && e.w5guarding && e.state === 'w5act' && e.w5a === 'guard' && W5.guardHit) { const r = W5.guardHit(e, m || {}); if (r === true) return; if (r === 'crit') m = Object.assign({}, m, { crit: 1 }); }
    return _strike(e, base, dir, m, echo);
  };
  // moondust, and a moth on your back, make your legs heavy
  const _up = updatePlayer;
  updatePlayer = function (dt) { const x0 = P.x, y0 = P.y; _up(dt); if ((P.w5slowT || 0) > 0) { P.w5slowT -= dt; if (P.state !== 'dodge') { P.x = x0 + (P.x - x0) * .6; P.y = y0 + (P.y - y0) * .6; } } };
  { const _hit = playerDamage; playerDamage = function (dmg, fromX, big) { const before = P.hp; _hit(dmg, fromX, big); if (P.hp < before && projs.some(p => p.w5dust && Math.abs(p.x - P.x) < 20)) P.w5slowT = 1.6; }; }
  // this world's upright effects are drawn in depth with the figures, wherever they are (secret rooms too)
  const _mb = mechBoxes; mechBoxes = function (box) { _mb(box); for (const h of hazards) if (HZ[h.kind] && HZ[h.kind].box) HZ[h.kind].box(h, box); };
  const _ml = mechList; mechList = function (list, t) { _ml(list, t); for (const h of hazards) if (HZ[h.kind] && HZ[h.kind].ups && h.t > -.4) HZ[h.kind].ups(h, list, t); };
  // the silver arm, carried down out of the sky: from then on his hands are silver
  const _look = heroLook; heroLook = function () { const L = _look(); if (save.silverArm) { L.glove = '#C8D0DE'; L.gauntPlate = 1; } return L; };
  // the ending: the last world's boss does not go straight to the win screen
  W5.hookEnding();
  };

  // ======================================================================================================
  // THE ENDING: dawn breaks over Tir-na Nog'th. The city dissolves around him, and he goes down the moon-stair with the
  // ghost's silver arm as the stair fades under his feet; then his own Trump, a few lines, the credits, and the road again
  // ======================================================================================================
  let END = null;
  const isLastWorld = () => typeof baseStage !== 'undefined' && baseStage && baseStage.theme === 'moon' && stageIdx === STAGES.length - 1;
  const LINES = ['Dawn came, and Tir-na Nog\'th went out like a lamp, and its stair with it.', 'What the city of the moon shows you may never be,', 'but the silver arm he carried down out of the sky was real,', 'and it did not fade.'];
  const CREDITS = [['SHADOW ROAD', 22], ['five shadows walked', 9], ['', 6], ['BLOOMWILD VALE · THE CLOCKWORK SKYPORT · THE PRISM RIM', 8], ['THE COURTS OF CHAOS · TIR-NA NOG\'TH', 8], ['', 10],
    ['after Roger Zelazny\'s The Chronicles of Amber', 10], ['', 8], ['CORWIN', 11], ['Prince of Amber, Prince of Shadow', 8], ['', 6], ['BENEDICT', 11], ['his phantom, by moonlight', 8], ['', 6], ['THE SPHINX', 11], ['who would still like an answer', 8], ['', 10],
    ['painted in ink and silver leaf', 9], ['', 14], ['Thank you for walking the road.', 12]];
  // the dawn sky over the sea of cloud, with the true Amber far below on Kolvir, catching the first light
  function dawnSky(k, t) {
    const Y0 = Y_OFF, H = VH - Y0, g = ctx.createLinearGradient(0, Y0, 0, VH);
    g.addColorStop(0, awMix('#0A1230', '#5A6AA8', k)); g.addColorStop(.45, awMix('#1E2C5A', '#D8A0A8', k)); g.addColorStop(.7, awMix('#3A4C7E', '#F6C8A8', k)); g.addColorStop(1, awMix('#4A5C8E', '#FFE6C8', k));
    ctx.fillStyle = g; ctx.fillRect(0, Y0, VW, H);
    glowM(VW * .12, Y0 + H * .66, 220, '255,210,170', .55 * k); ctx.fillStyle = `rgba(255,236,200,${k})`; circle(VW * .12, Y0 + H * .66 + (1 - k) * 30, 16); ctx.fill(); // the sun coming up in the east
    ctx.save(); ctx.globalAlpha = 1 - k * .6; ctx.fillStyle = 'rgba(240,244,252,.9)'; circle(VW * .82, Y0 + H * .2 + k * 30, 22); ctx.fill(); ctx.restore(); // the moon going down in the west
    ctx.fillStyle = awMix('#1A2448', '#7A6A86', k); poly([VW * .5 - 120, Y0 + H * .72, VW * .5 - 30, Y0 + H * .58, VW * .5 + 10, Y0 + H * .55, VW * .5 + 60, Y0 + H * .62, VW * .5 + 150, Y0 + H * .72]); ctx.fill(); // Kolvir
    for (const [dx, dy] of [[-6, .57], [4, .565], [14, .58], [-16, .6], [24, .6]]) { ctx.fillStyle = `rgba(255,214,150,${.4 + .5 * k})`; ctx.fillRect(VW * .5 + dx, Y0 + H * dy, 2, 3); } // Amber, the true city
    for (let b = 0; b < 4; b++) { const y = Y0 + H * (.7 + b * .08); ctx.fillStyle = awMix(['#1E2850', '#26325E', '#2E3C6A', '#364676'][b], ['#C890A0', '#E0A8A0', '#F0C0A8', '#F8D4B8'][b], k); ctx.beginPath(); ctx.moveTo(0, VH); for (let x = 0; x <= VW; x += 20) ctx.lineTo(x, y + Math.sin(x * .02 + b * 2 + t * .05) * 5); ctx.lineTo(VW, VH); ctx.fill(); } // the sea of cloud
  }
  // the painted surface: the sky laid on in long strokes, brushwork over the cloud, as on every other panel of the road
  function brushOver() { skyWash(0); ctx.save(); ctx.globalAlpha = .55; ctx.fillStyle = texPat(ctx, 'brush'); ctx.scale(.5, .5); ctx.fillRect(0, Y_OFF * 2, VW * 2, (VH - Y_OFF) * 2); ctx.restore(); }
  // the moon-stair going down through the cloud, fading as the day comes; he walks down it
  function stairDown(fade, walkU, t) {
    const Y0 = Y_OFF, H = VH - Y0, P0 = [VW * .2, Y0 + H * .62], P1 = [VW * .55, Y0 + H * .7], P2 = [VW * 1.05, VH + 20];
    const at = (u) => { const iu = 1 - u; return [iu * iu * P0[0] + 2 * iu * u * P1[0] + u * u * P2[0], iu * iu * P0[1] + 2 * iu * u * P1[1] + u * u * P2[1]]; };
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 34; i++) { const u = i / 34, [x, y] = at(u), w = lerp(40, 110, u), a = (1 - fade) * (.7 - Math.abs(u - walkU) * .25);
      if (a <= 0) continue; ctx.fillStyle = `rgba(230,238,255,${a})`; ctx.fillRect(x - w / 2, y, w, lerp(2, 6, u)); ctx.fillStyle = `rgba(150,170,220,${a * .4})`; ctx.fillRect(x - w / 2, y + lerp(2, 6, u), w, lerp(3, 9, u)); }
    ctx.restore();
    const [x, y] = at(walkU), s = lerp(.7, 1.15, walkU);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    shadow(0, 0, 12); drawHumanoid(heroLook(), { walk: t * 7, weapon: 'fists', arm: 1.2 });
    ctx.translate(-6, -44); ctx.rotate(.9); silverArm(0, 0, 1.4, 0, 0, .8, t); // the silver arm, carried over his shoulder
    ctx.restore();
  }
  // his own Trump: the Prince of Shadow, black and silver, the silver rose, the moon and its stair behind him, in a frame of silver leaf
  function princeTrump(cx, cy, h, a, t) {
    const w = h * .62, x = cx - w / 2, y = cy - h / 2;
    ctx.save(); ctx.globalAlpha = a;
    glowM(cx, cy, h * .8, '220,230,255', .25);
    ctx.save(); rrect(x, y, w, h, 6); ctx.clip();
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#060A1C'); g.addColorStop(.55, '#1E2C5A'); g.addColorStop(.8, '#4A5C8E'); g.addColorStop(1, '#141C38'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    for (let i = 0; i < 30; i++) { ctx.fillStyle = `rgba(235,242,255,${.4 + hsh(i) * .5})`; circle(x + hsh(i + 1) * w, y + hsh(i + 2) * h * .5, .6 + hsh(i + 3) * .7); ctx.fill(); }
    glowM(x + w * .7, y + h * .22, w * .4, '220,232,255', .45); ctx.fillStyle = '#F2F5FB'; circle(x + w * .7, y + h * .22, w * .14); ctx.fill(); ctx.fillStyle = 'rgba(170,182,206,.6)'; circle(x + w * .66, y + h * .2, w * .04); ctx.fill(); circle(x + w * .74, y + h * .25, w * .03); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 16; i++) { const u = i / 16, sx = lerp(x + w * .1, x + w * .64, u), sy = lerp(y + h * .82, y + h * .3, u); ctx.fillStyle = `rgba(225,235,255,${.5 - u * .3})`; ctx.fillRect(sx - 9 + u * 6, sy, 18 - u * 12, 1.6); } ctx.restore(); // the stair to the moon
    ctx.fillStyle = '#10162E'; ctx.fillRect(x, y + h * .84, w, h * .16);
    ctx.save(); ctx.translate(cx - w * .04, y + h * .9); const s = h / 128; ctx.scale(s, s); drawHumanoid(heroLook(), { weapon: 'rapier', arm: .6, Y: .45, breath: Math.sin(t * 1.2) }); ctx.restore();
    ctx.restore();
    // the frame: silver leaf, burnished, with tooled dots and roses at the corners
    const b = w * .06; ctx.beginPath(); ctx.rect(x - b, y - b, w + b * 2, h + b * 2); ctx.rect(x, y, w, h); const fg = ctx.createLinearGradient(x, y, x + w, y + h); fg.addColorStop(0, '#F4F7FC'); fg.addColorStop(.5, '#8E9AB4'); fg.addColorStop(1, '#DCE4F0'); ctx.fillStyle = fg; ctx.fill('evenodd');
    ctx.strokeStyle = '#1A2034'; ctx.lineWidth = 1.2; ctx.strokeRect(x - b, y - b, w + b * 2, h + b * 2); ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = 'rgba(40,48,80,.55)'; for (let i = 0; i < 26; i++) { const u = i / 25; circle(x - b / 2 + u * (w + b), y - b / 2, .8); ctx.fill(); circle(x - b / 2 + u * (w + b), y + h + b / 2, .8); ctx.fill(); }
    for (const [px, py] of [[x - b / 2, y - b / 2], [x + w + b / 2, y - b / 2], [x - b / 2, y + h + b / 2], [x + w + b / 2, y + h + b / 2]]) silverRose(px, py, b * .3, false);
    ctx.fillStyle = 'rgba(8,12,30,.85)'; rrect(x + w * .1, y + h - 22, w * .8, 16, 3); ctx.fill(); ctx.fillStyle = '#E8EEF8'; ctx.font = '700 7px Cinzel, Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('THE PRINCE OF SHADOW', cx, y + h - 11);
    ctx.restore();
  }
  function renderEnding(t) {
    const now = performance.now(), dt = Math.min(.05, (now - END.last) / 1000); END.last = now; END.t += dt; const T = END.t;
    if (T < 3.6) { // the city dissolving round him, from the east (the left) where the sun is coming
      P.state = 'walk'; P.facing = 1; P.walk += dt * 7; P.x = Math.min(P.x + 24 * dt, camX + VW - 90);
      END.orig(t);
      const d = T / 3.6, cs = 24; ctx.save(); ctx.beginPath();
      for (let gx = 0; gx < VW + cs; gx += cs) for (let gy = Y_OFF; gy < VH + cs; gy += cs) { const id = gx * 7 + gy * 13, th = (gx / VW) * .7 + hash1(id) * .3, r = cs * .9 * cl01((d * 1.5 - th) / .35); if (r > .5) { ctx.moveTo(gx + r, gy); ctx.arc(gx, gy, r, 0, TAU); } }
      ctx.clip(); dawnSky(d * .5, t); brushOver(); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 40; i++) { const life = (T * .3 + hsh(i)) % 1; ctx.fillStyle = `rgba(255,240,225,${Math.sin(life * Math.PI) * .6 * d})`; circle(hsh(i + 1) * VW * d * 1.3, VH - life * (VH - Y_OFF), 1.2); ctx.fill(); } ctx.restore(); // what the city was, rising off as motes
      paperFrame(); return;
    }
    const dawn = cl01((T - 3.6) / 6) * .5 + .5;
    dawnSky(dawn, t); brushOver();
    stairDown(cl01((T - 7) / 5), cl01((T - 3.6) / 7) * .78, t);
    if (T > 9) { const a = cl01((T - 9) / 1.2) * (1 - cl01((T - 17.5) / 1)); ctx.fillStyle = `rgba(4,6,16,${.55 * a})`; ctx.fillRect(0, Y_OFF, VW, VH - Y_OFF);
      const h = Math.min(230, (VH - Y_OFF) * .78), cx = VW * .3, cy = Y_OFF + (VH - Y_OFF) / 2 + (1 - cl01((T - 9) / 1.4)) * 40; if (a > 0) princeTrump(cx, cy, h, a, t);
      ctx.textAlign = 'left'; ctx.font = '700 10px Cinzel, Georgia, serif';
      const x0 = cx + h * .31 + 22, tw = VW - x0 - 24; let ly = Y_OFF + (VH - Y_OFF) * .3;
      LINES.forEach((l, i) => { const la = cl01((T - 10.5 - i * 1.4) / 1) * (1 - cl01((T - 17.5) / 1));
        const words = l.split(' '), rows = []; let row = ''; for (const w of words) { const tr = row ? row + ' ' + w : w; if (ctx.measureText(tr).width > tw && row) { rows.push(row); row = w; } else row = tr; } rows.push(row);
        for (const r of rows) { if (la > 0) { ctx.fillStyle = `rgba(240,244,252,${la})`; ctx.fillText(r, x0, ly); } ly += 15; } ly += 6; }); }
    if (T > 18) { const k = T - 18, a = cl01(k / 1.2); ctx.fillStyle = `rgba(4,6,16,${.85 * a})`; ctx.fillRect(0, Y_OFF, VW, VH - Y_OFF);
      let y = VH + 10 - k * 26; ctx.textAlign = 'center';
      for (const [s, sz] of CREDITS) { y += sz + 8; if (!s) continue; const fa = cl01((y - Y_OFF) / 40) * cl01((VH - y) / 40); ctx.fillStyle = `rgba(232,238,250,${fa})`; ctx.font = `700 ${sz}px Cinzel, Georgia, serif`; ctx.fillText(s, VW / 2, y); }
      if (y < Y_OFF - 10) finishEnding(); }
    if (T > 2) { ctx.fillStyle = 'rgba(200,210,230,.55)'; ctx.font = '700 7px Cinzel, Georgia, serif'; ctx.textAlign = 'right'; ctx.fillText(KBD ? 'ENTER TO SKIP' : 'TAP TO SKIP', VW - 14, VH - 10); }
    paperFrame();
  }
  function skipEnding() { if (!END || END.t < 1.5) return; if (END.t < 9) END.t = 9; else if (END.t < 18) END.t = 18; else finishEnding(); }
  function finishEnding() {
    if (!END) return; const sc = END.sc; END = null; W5.ending = false;
    app.classList.remove('nocontrols'); if (stageIdx === STAGES.length - 1) save.stage = Math.max(save.stage, STAGES.length - 1); // the last world always ends the road
    sc();
    if (mode === 'win') { // the win card, rewritten for the true end of the road
      const k = $('#winOv .kicker'), h2 = $('#winOv .h2'); if (k) k.textContent = 'THE NIGHT IS OVER'; if (h2) h2.textContent = 'You came down from the moon';
      $('#winText').textContent = "Tir-na Nog'th faded with the dawn, and every shadow of the road is behind you. You carried the Phantom's silver arm down the stair, and your hand is silver now. Walking the road again starts a harder cycle: enemies hit harder and have more health, but drop more shards. Your weapons, levels and cards come with you.";
      const row = $('#winOv .row'); if (row && !$('#w5TitleBtn')) { const b = document.createElement('button'); b.className = 'cta alt'; b.id = 'w5TitleBtn'; b.type = 'button'; b.textContent = 'Title screen'; b.addEventListener('click', () => { mode = 'title'; refreshTitle(); showOnly('titleOv'); playMusic('title'); }); row.appendChild(b); }
    }
  }
  W5.startEnding = (sc) => {
    END = { t: 0, last: performance.now(), sc, orig: W5.origDraw }; W5.ending = true; mode = 'ending';
    save.silverArm = true; persist(); clearInput();
    $('#hud').hidden = true; $('#bossbar').hidden = true; app.classList.add('nocontrols'); app.classList.remove('playing');
    if (TRACKS.w5dawn) playMusic('w5dawn');
  };
  W5.endT = () => END && END.t;
  W5.skipEnding = skipEnding;
  W5.hookEnding = () => {
    const _sc = stageClear; stageClear = function () { if (isLastWorld() && !END) { W5.startEnding(_sc); return; } return _sc(); };
    const _ds = drawScene; W5.origDraw = _ds; drawScene = function (t) { if (END) { renderEnding(t); return; } return _ds(t); };
    window.addEventListener('keydown', (e) => { if (END && (e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape' || e.code === 'KeyJ')) skipEnding(); }, true);
    window.addEventListener('pointerdown', () => { if (END) skipEnding(); }, true);
  };

  // ======================================================================================================
  // MUSIC (music.js notation: one string per bar; a note starts, '-' holds, '.' rests)
  // ======================================================================================================
  if (typeof TRACKS !== 'undefined') {
    const Wb = (n, steps = 16) => n + ' -'.repeat(steps - 1), Hb = (a, b) => a + ' -'.repeat(7) + ' ' + b + ' -'.repeat(7);
    Object.assign(TRACKS, {
      // the Stair of Moonlight: E dorian in a slow 12/8, like a music box left open in an empty hall
      moon: { bpm: 80, n: 12, style: 'calm', kit: 'soft', duty: .5, vib: 12, echo: .3, echoSteps: 3, arp: '024024024024', arpDuty: .25, av: .045, bass: 'R-----F-----', bv: .22,
        drums: { k: 'x...........', h: '......g.....' }, fill: false, form: ['A', 'B'], parts: {
        A: { chords: ['Em', 'C', 'D', 'Bm', 'Em', 'C', 'Am', 'B'],
             lead: ['B4 - - E5 - - G5 - F#5 E5 - -', 'G5 - - - - - E5 - - C5 - -', 'D5 - - F#5 - - A5 - G5 F#5 - -', 'F#5 - - - - - D5 - - B4 - -',
                    'B4 - - E5 - - G5 - B5 A5 - G5', 'E5 - - - - - C5 - - E5 - -', 'A4 - - C5 - - E5 - D5 C5 - -', 'D#5 - - - - - F#5 - - B4 - -'] },
        B: { chords: ['A', 'Em', 'A', 'B', 'C', 'D', 'Em', 'Em'],
             lead: ['C#5 - - E5 - - A5 - - G#5 - -', 'B4 - - - - - G5 - - E5 - -', 'E5 - - A5 - - C#6 - B5 A5 - -', 'B5 - - - - - F#5 - - D#5 - -',
                    'C5 - - E5 - - G5 - - C6 - -', 'A5 - - F#5 - - D5 - - A4 - -', 'B4 - - E5 - - G5 - F#5 G5 - -', 'E5 - - - - - - - - . . .'] } } },
      // the Streets: B minor, driving, the echo of footsteps in an empty city
      moon2: { bpm: 128, style: 'drive', duty: .25, vib: 10, echo: .15,
        chords: ['Bm', 'G', 'D', 'A', 'Bm', 'G', 'Em', 'F#'],
        lead: ['F#5 - - - B5 - - - A5 - F#5 - E5 - D5 -', 'D5 - - - - - B4 - G4 - B4 - D5 - G5 -', 'F#5 - - - A5 - - - D6 - - - C#6 - A5 -', 'E5 - - - - - C#5 - A4 - - - C#5 - E5 -',
               'F#5 - - - B5 - - - D6 - C#6 - B5 - A5 -', 'G5 - - - - - D5 - B4 - D5 - G5 - B5 -', 'A5 - G5 - F#5 - E5 - G5 - - - B4 - - -', 'A#4 - - - C#5 - - - F#5 - - - E5 - C#5 -'] },
      // the Moon Throne, before he comes: D minor, held breath
      moonBoss: { bpm: 60, style: 'ambient', kit: 'soft', duty: .5, lv: .17, vib: 14, echo: .4, echoSteps: 4,
        chords: ['Dm', 'Bb', 'Gm', 'A'], lead: [Wb('D5'), Hb('F5', 'E5'), Hb('D5', 'Bb4'), Wb('A4')] },
      // the Phantom of Benedict: D harmonic minor, a duel; the second part fences in staccato, the last turns to a grave 3/4
      boss_w5benedict: { duty: .25, vib: 12, echo: .12, form: ['A', 'B', 'A', 'B', 'C', 'C'], parts: {
        A: { bpm: 170, style: 'battle', chords: ['Dm', 'Bb', 'Gm', 'A'],
             lead: ['D5 - F5 - A5 - D6 - C#6 - A5 - F5 - E5 -', 'F5 - - - D5 - Bb4 - D5 - F5 - Bb5 - A5 -', 'G5 - - - Bb5 - G5 - D5 - G4 - Bb4 - D5 -', 'E5 - - - C#5 - A4 - C#5 - E5 - G5 - A5 -'] },
        B: { bpm: 170, style: 'battle', chords: ['Dm', 'C', 'Bb', 'A'], arp: '0.2.1.2.0.2.1.2.',
             lead: ['A5 . A5 . F5 . D5 . A5 - G5 - F5 - E5 -', 'G5 . G5 . E5 . C5 . G5 - F5 - E5 - D5 -', 'F5 . F5 . D5 . Bb4 . F5 - E5 - D5 - C5 -', 'C#5 - - - E5 - - - A5 - - - C#6 - - -'] },
        C: { bpm: 132, n: 12, style: 'grand', chords: ['Dm', 'Gm', 'A', 'Dm'], arp: '0-1-2-1-0-1-', bass: 'R-----V-----', drums: { k: 'X.....x.....', s: '......X.....', h: '..x...x...x.' }, fill: false, double: -12,
             lead: ['D6 - - - - - A5 - - F5 - -', 'Bb5 - - - - - G5 - - D5 - -', 'C#6 - - - - - E5 - - A5 - -', 'D6 - - - - - - - - . . .'] } } },
      // the Sphinx: A phrygian dominant, slow and sly
      w5riddle: { bpm: 92, style: 'creep', duty: .5, vib: 14, echo: .25, chords: ['A', 'Bb', 'A', 'Gm'],
        lead: ['A4 - - - C#5 - - - D5 - - - E5 - - -', 'F5 - - - E5 - D5 - C#5 - - - Bb4 - - -', 'A4 - - - E5 - - - G5 - F5 - E5 - - -', 'D5 - - - Bb4 - - - G4 - - - A4 - - -'] },
      // the ending: D major, a hymn for the dawn, played once
      w5dawn: { bpm: 72, style: 'hymn', duty: .5, vib: 10, echo: .35, echoSteps: 4, once: true, chords: ['D', 'A/C#', 'Bm', 'G', 'D', 'G', 'A', 'D'],
        lead: ['F#5 - - - A5 - - - D6 - - - C#6 - - -', 'E5 - - - - - - - A5 - - - G5 - F#5 -', 'F#5 - - - D5 - - - B4 - - - D5 - - -', 'G5 - - - - - - - B5 - - - A5 - G5 -',
               'F#5 - - - A5 - - - D6 - - - F#6 - - -', 'E6 - - - D6 - - - B5 - - - G5 - - -', 'A5 - - - - - - - C#6 - - - E6 - - -', 'D6 - - - - - - - - - - - . . . .'] },
    });
  }
  window.w5Late = late;
  window.w5Dom = dom;

})();
