'use strict';
// World 5 of six (data_w6.js) art, enemies, boss, passages, rules and ending: THE DREAMING SHADOW
// A shadow that is not his: someone else is asleep and dreaming it. Corwin fell asleep on the Rim of the Abyss, and the
// Sleeper far down beneath the Courts dreamed him in (endings.js tells it, and his waking back on the rim). Everything here is
// painted in the manner of the dream-painters of a later Earth's shadow, as if the Sleeper had once seen their pictures:
//   dream      - The Piazza of Long Shadows: an empty square in an endless late afternoon, arcades with black mouths,
//                red chimneys, a train that never leaves, a sky of men in bowler hats; shadows far too long
//   dream2     - The Shore of Soft Clocks: a golden shore under cliffs, dead olive trees hung with melting watches,
//                elephants on legs like stilts striding the horizon (rule 'w6melt': the hours melt into pools on the
//                sand, gold ones that slow whatever stands in them and red ones that quicken it, and they turn over)
//   dreamBoss  - The Bed of the Sleeper: an endless quilt under a day sky, a dark street at night along its edge, and
//                over it the Sleeper itself, a vast soft head propped up on crutches (rule 'w6sleep': its three dreams)
// Enemies: Gentleman of Golconda, Soft Clock, Stilt Elephant, Mannequin of the Muses, Lobster Telephone, Bird of
// Daylight, Collective Invention. Boss: the Sleeper (Asleep on its crutches, dreaming bedtime; the Dream of the Board; Waking).
// Passages: 'w6easel' (into a painting of the place ahead, on its easel) and 'w6bed' (he lies down, and the eyes close).
// Everything lives inside this closure; the late parts are handed to data_w6.js.
(() => {
  const T = FLOOR_TOP;
  const DET = () => !FLASH && !TINT;
  const add = (fn) => { if (!DET()) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
  const addB = (fn) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
  const poly = (pts) => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); };
  const fillPoly = (pts, col, ow) => { poly(pts); ctx.fillStyle = C(col); ctx.fill(); if (ow) outline(ow); };
  const glowAt = (x, y, r, rgb, a) => add(() => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.45, `rgba(${rgb},${a * .4})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); });
  const glowM = (x, y, r, rgb, a) => { if (a <= 0 || r <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.45, `rgba(${rgb},${a * .4})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); };
  const hsh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const sm = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const cl01 = (k) => clamp(k, 0, 1);
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
  const BIGR = () => ctx.rect(-240, -240, 480, 480); // (big enough for any one part: a smaller rect is much cheaper to fill)
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
  const lineP = (pts) => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); };
  // the palettes of the dream: an afternoon that never ends (ochre, viridian, black shadow), a golden shore, a night under day
  const OCH = '#D89A52', OCHL = '#F6D49A', OCHD = '#8A5230', VIR = '#1F5A55', SHAD = '#1A1210', RED = '#B8402E', CREAM = '#EEDCB8';
  const FLESH = '#E6C49C', FLESHL = '#FBE6C6', FLESHD = '#A87A5A', WOOD = '#8A6440', WOODL = '#D4A66E', WOODD = '#4A3020';
  const GOLD = '255,206,120', NIGHTB = '#141C34';
  const W6 = { }; // state shared between the parts of this file (and with tests)
  window.W6 = W6;

  // ======================================================================================================
  // SHARED PIECES: things the dream keeps putting everywhere
  // ======================================================================================================
  // a gentleman of Golconda, small, as he hangs in the sky: bowler, dark coat, the gap where a face should be
  function golcondaMan(x, y, s, lit = '#8A8EA8', a = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a;
    ctx.fillStyle = '#20222E'; poly([-4.2, -2, -4.6, 14, -2.5, 15, -1.4, 22, .2, 22, .6, 15.5, 1.6, 22, 3.2, 22, 3, 14, 4.4, -2, 2, -4.4, -2, -4.4]); ctx.fill(); // the coat, the legs
    ctx.fillStyle = lit; ctx.globalAlpha *= .55; poly([-4.2, -2, -2, -4.4, -1.2, 10, -4.4, 12]); ctx.fill(); ctx.globalAlpha /= .55; // light on the coat's sunward edge
    ctx.fillStyle = '#E2C6A6'; ell(0, -6.6, 2.5, 2.9); ctx.fill(); // the face
    ctx.fillStyle = '#15161E'; ell(0, -9.2, 3.8, 1.1); ctx.fill(); rrect(-2.4, -12.4, 4.8, 3.4, 1.6); ctx.fill(); // the bowler
    ctx.restore();
  }
  // a crutch of the dream: a forked prop of turned wood, its fork padded with a cushion
  function crutchShape(x0, y0, x1, y1, w = 3, fork = 9) {
    const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a), ny = Math.cos(a), L = Math.hypot(x1 - x0, y1 - y0), mx = x0 + (x1 - x0) * .62, my = y0 + (y1 - y0) * .62;
    ctx.lineCap = 'round';
    ctx.strokeStyle = WOODD; ctx.lineWidth = w + 1.6; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(mx, my); ctx.stroke();
    ctx.strokeStyle = WOOD; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(mx, my); ctx.stroke();
    ctx.strokeStyle = WOODL; ctx.lineWidth = w * .3; ctx.beginPath(); ctx.moveTo(x0 + nx * w * .25, y0 + ny * w * .25); ctx.lineTo(mx + nx * w * .25, my + ny * w * .25); ctx.stroke();
    for (const s of [-1, 1]) { const ex = x1 + nx * s * fork, ey = y1 + ny * s * fork; ctx.strokeStyle = WOODD; ctx.lineWidth = w * .8 + 1.4; ctx.beginPath(); ctx.moveTo(mx, my); ctx.quadraticCurveTo(mx + (x1 - mx) * .5 + nx * s * fork * .3, my + (y1 - my) * .5 + ny * s * fork * .3, ex, ey); ctx.stroke(); ctx.strokeStyle = WOOD; ctx.lineWidth = w * .8; ctx.stroke(); }
    ctx.strokeStyle = WOODD; ctx.lineWidth = w * .9 + 1.4; ctx.beginPath(); ctx.moveTo(x1 + nx * fork * 1.1, y1 + ny * fork * 1.1); ctx.lineTo(x1 - nx * fork * 1.1, y1 - ny * fork * 1.1); ctx.stroke(); // the crosspiece
    ctx.strokeStyle = '#C8B8A0'; ctx.lineWidth = w * 1.5; ctx.stroke(); ctx.strokeStyle = '#F2E6D0'; ctx.lineWidth = w * .5; ctx.stroke(); // its cushion
    ctx.fillStyle = '#3A2A20'; ell(x0, y0, w * .9, w * .4); ctx.fill(); // the rubber foot
    return L;
  }
  // a soft watch, draped over an edge: its face slumps and runs; s scale, droop how far it has run (0..1), lean its tilt
  function softWatch(x, y, s, droop = .6, lean = 0, case_ = '#C8A050', face = '#F4EAD2') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(lean); ctx.scale(s, s);
    const D = 10 + droop * 22, pts = [-14, -2, -12, -9, -4, -12, 6, -11, 13, -6, 14, 1, 11, 4 + D * .4, 7, 4 + D * .8, 3, 5 + D, -1, 4 + D * .9, -5, 4 + D * .55, -11, 3];
    const path = PB(pts);
    path(0, 0); ctx.fillStyle = C(case_); ctx.fill(); outline(1.1); // the case
    const f = []; for (let i = 0; i < pts.length; i += 2) f.push(pts[i] * .82, (pts[i + 1] - 1) * .86); const fp = PB(f);
    fp(0, 0); ctx.fillStyle = C(face); ctx.fill();
    if (DET()) {
      ctx.save(); fp(0, 0); ctx.clip();
      ctx.fillStyle = 'rgba(120,90,60,.22)'; ctx.fillRect(-20, 2, 40, 40); // the run of it falls into shade
      ctx.strokeStyle = 'rgba(40,30,20,.75)'; ctx.lineWidth = .8; ctx.lineCap = 'round';
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r = 8.2, sy = Math.sin(a) > 0 ? 1 + droop * Math.sin(a) * 1.4 : 1; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * .86, -3 + Math.sin(a) * r * .86 * sy); ctx.lineTo(Math.cos(a) * r, -3 + Math.sin(a) * r * sy); ctx.stroke(); } // the hour marks, stretched where it runs
      ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(-4, -6); ctx.moveTo(0, -3); ctx.quadraticCurveTo(2, 2, 1, 6 + droop * 6); ctx.stroke(); // the hands, the long one bent
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,240,200,.7)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(-12, -7); ctx.quadraticCurveTo(-5, -12, 5, -10.6); ctx.stroke(); // the glint on its rim
    }
    ctx.fillStyle = C(case_); circle(0, -13, 2.2); ctx.fill(); outline(.8); // the winder
    ctx.restore();
  }
  // a stilt elephant, far off: a small body high up on legs as thin as a heron's, an obelisk on its back
  function stiltElephant(x, base, h, s, col = '#5A4A4A', lit = '#C89A7A', stride = 0) {
    const by = base - h, bw = 22 * s, bh = 12 * s;
    ctx.lineCap = 'round';
    for (const [lx, ph] of [[-bw * .55, 0], [-bw * .35, 1], [bw * .45, 1], [bw * .65, 0]]) { // the legs: two joints, impossibly long
      const sw = Math.sin(stride + ph * Math.PI) * h * .06, kx = x + lx + sw * .5, ky = by + h * .5, fx = x + lx + sw, fy = base;
      ctx.strokeStyle = col; ctx.lineWidth = 1.1 * s + .3; ctx.beginPath(); ctx.moveTo(x + lx * .7, by + bh * .2); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
      ctx.fillStyle = col; ell(fx, fy, 1.6 * s, .6 * s); ctx.fill(); }
    ctx.fillStyle = col; ell(x, by, bw * .6, bh * .6); ctx.fill(); // the body
    ctx.fillStyle = lit; ctx.globalAlpha = .6; ell(x - bw * .2, by - bh * .2, bw * .4, bh * .32); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = col; ell(x - bw * .62, by - bh * .1, bw * .24, bh * .36); ctx.fill(); // the head
    ctx.strokeStyle = col; ctx.lineWidth = 1.6 * s; ctx.beginPath(); ctx.moveTo(x - bw * .8, by); ctx.quadraticCurveTo(x - bw * .95, by + bh * .9, x - bw * .78, by + bh * 1.4); ctx.stroke(); // the trunk
    ctx.fillStyle = col; ell(x - bw * .5, by - bh * .05, bw * .16, bh * .3); ctx.fill(); // an ear
    ctx.fillStyle = '#8A6A5A'; rrect(x - bw * .3, by - bh * .5, bw * .6, bh * .2, 1); ctx.fill(); // the saddle-cloth
    ctx.fillStyle = col; poly([x - 2.2 * s, by - bh * .5, x - 1.2 * s, by - bh * .5 - 16 * s, x, by - bh * .5 - 19 * s, x + 1.2 * s, by - bh * .5 - 16 * s, x + 2.2 * s, by - bh * .5]); ctx.fill(); // the obelisk
    ctx.fillStyle = lit; ctx.globalAlpha = .7; poly([x - 2.2 * s, by - bh * .5, x - 1.2 * s, by - bh * .5 - 16 * s, x, by - bh * .5 - 19 * s, x - .4 * s, by - bh * .5]); ctx.fill(); ctx.globalAlpha = 1;
  }

  // ======================================================================================================
  // THE PIAZZA OF LONG SHADOWS: an empty square, late in an afternoon that will not end
  // ======================================================================================================
  // an arcade seen along its length: its near end tall, its far end low and further up the ground; round arches with
  // black mouths, a blind upper storey, a cornice, the near end-wall facing us. lit: the arcade's face is toward the sun
  function arcade(xn, xf, base, hn, hf, n, lit, rnd, o = {}) {
    const bf = base - (hn - hf) * .22, top = (u) => lerp(base - hn, bf - hf, u), bot = (u) => lerp(base, bf, u), X = (u) => lerp(xn, xf, Math.pow(u, 1.25));
    const face = lit ? (o.face || '#E8B276') : (o.shade || '#8A5A3E'), dark = SHAD;
    ctx.fillStyle = face; poly([X(0), bot(0), X(0), top(0), X(1), top(1), X(1), bot(1)]); ctx.fill();
    // the stucco: soft patches of a slightly different tone
    ctx.save(); poly([X(0), bot(0), X(0), top(0), X(1), top(1), X(1), bot(1)]); ctx.clip();
    for (let i = 0; i < 26; i++) { const u = rnd(), y = lerp(top(u), bot(u), rnd()); dab(X(u), y, 3 + rnd() * 8, rnd() < .5 ? shade(face, .12) : shade(face, -.1), .35); }
    // the light falls off along the length (the near end brighter)
    const g = ctx.createLinearGradient(xn, 0, xf, 0); g.addColorStop(0, 'rgba(255,230,180,.15)'); g.addColorStop(1, 'rgba(40,20,20,.18)'); ctx.fillStyle = g; ctx.fillRect(Math.min(xn, xf) - 2, base - hn - 4, Math.abs(xf - xn) + 4, hn + 8);
    ctx.restore();
    // the arches, smaller and closer together as they go
    for (let i = 0; i < n; i++) {
      let u0 = (i + .18) / n, u1 = (i + .82) / n; if (X(u1) < X(u0)) [u0, u1] = [u1, u0]; const xa = X(u0), xb = X(u1), ya = bot(u0), yb = bot(u1), hA = (bot(u0) - top(u0)) * .58, hB = (bot(u1) - top(u1)) * .58, w = xb - xa;
      ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xa, ya - hA + w * .5);
      ctx.quadraticCurveTo(xa, ya - hA - w * .2, (xa + xb) / 2, (ya + yb) / 2 - (hA + hB) / 2 - w * .18); ctx.quadraticCurveTo(xb, yb - hB - w * .2, xb, yb - hB + w * .5); ctx.lineTo(xb, yb); ctx.closePath(); ctx.fill();
      if (lit) { ctx.fillStyle = 'rgba(255,220,170,.5)'; ctx.fillRect(xa - .9, ya - hA + w * .5, .9, hA - w * .5); } // the lit jamb
      ctx.fillStyle = 'rgba(90,40,30,.35)'; ctx.fillRect(xa, ya - 2, w, 2); // the floor inside, just catching light
      if (o.win !== false) { const wy = lerp(top(u0), ya - hA, .45), wh = (ya - hA - top(u0)) * .28; if (wh > 1.5) { ctx.fillStyle = 'rgba(30,18,14,.75)'; ctx.fillRect(xa + w * .3, wy, w * .4, wh); } } // the blind windows above
    }
    // the cornice and the base course
    ctx.strokeStyle = lit ? '#FFE2B0' : '#B8805A'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(X(0), top(0) + 1); ctx.lineTo(X(1), top(1) + 1); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,20,14,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(0), top(0) + 3); ctx.lineTo(X(1), top(1) + 2.5); ctx.stroke();
    ctx.strokeStyle = 'rgba(60,30,20,.5)'; ctx.beginPath(); ctx.moveTo(X(0), bot(0) - 1); ctx.lineTo(X(1), bot(1) - 1); ctx.stroke();
    // the near end-wall, square to us, in shadow (or lit), with one tall dark door
    if (o.end) { const ew = o.end, ex = xn - ew * Math.sign(xf - xn); ctx.fillStyle = lit ? (o.shade || '#8A5A3E') : (o.face || '#E8B276'); ctx.fillRect(Math.min(ex, xn), base - hn, ew, hn);
      ctx.fillStyle = dark; const dw = ew * .34; ctx.fillRect((ex + xn) / 2 - dw / 2, base - hn * .5, dw, hn * .5);
      for (let i = 0; i < 10; i++) dab(Math.min(ex, xn) + rnd() * ew, base - rnd() * hn, 3 + rnd() * 5, 'rgba(40,20,14,.2)', 1); }
  }
  function chimney(x, base, h, w, rnd) {
    const pts = [x - w / 2, base, x - w * .38, base - h, x + w * .38, base - h, x + w / 2, base];
    poly(pts); const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, '#E87A52'); g.addColorStop(.45, '#B8402E'); g.addColorStop(1, '#5A2018'); ctx.fillStyle = g; ctx.fill();
    ctx.fillStyle = '#4A1A14'; ctx.fillRect(x - w * .42, base - h, w * .84, 3); ctx.fillRect(x - w * .44, base - h * .82, w * .88, 1.5); // the bands
    ctx.strokeStyle = 'rgba(60,20,14,.3)'; ctx.lineWidth = .5; for (let y = base - h + 6; y < base; y += 3.5) { ctx.beginPath(); ctx.moveTo(x - w * .45, y); ctx.lineTo(x + w * .45, y); ctx.stroke(); } // brick courses
    for (let i = 0; i < 6; i++) softDab(x + 4 + i * 5 + rnd() * 3, base - h - 6 - i * 5, 4 + i * 1.6, '240,230,214', .55 - i * .06); // a little smoke, never moving
  }
  function redTower(x, base, h, w, rnd) { // tiers of colonnades, one on another, a cupola, two pennants
    const tiers = 4; let y = base;
    for (let i = 0; i < tiers; i++) {
      const tw = w * (1 - i * .14), th = h / tiers * (1 - i * .06), yt = y - th;
      const g = ctx.createLinearGradient(x - tw / 2, 0, x + tw / 2, 0); g.addColorStop(0, '#F08A60'); g.addColorStop(.5, '#C04A34'); g.addColorStop(1, '#6A2418'); ctx.fillStyle = g; ctx.fillRect(x - tw / 2, yt, tw, th);
      ctx.fillStyle = 'rgba(30,10,8,.85)'; const n = 5; for (let k = 0; k < n; k++) { const cx = x - tw / 2 + (k + .5) * tw / n, cw = tw / n * .45 * (1 - Math.abs(k - (n - 1) / 2) / n * .6); ctx.fillRect(cx - cw / 2, yt + th * .25, cw, th * .62); } // the colonnade
      ctx.fillStyle = '#F6B08A'; ell(x, yt, tw / 2, 1.6); ctx.fill(); ctx.fillStyle = '#5A1E14'; ctx.fillRect(x - tw / 2, yt + 1, tw, 1.2);
      y = yt;
    }
    ctx.fillStyle = '#C04A34'; ctx.beginPath(); ctx.arc(x, y, w * .26, Math.PI, 0); ctx.fill(); ctx.fillStyle = 'rgba(255,200,160,.5)'; ctx.beginPath(); ctx.arc(x - 1, y, w * .2, Math.PI, Math.PI * 1.5); ctx.fill();
    for (const s of [-1, 1]) { const px = x + s * w * .2; ctx.strokeStyle = '#2A1410'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(px, y - 1); ctx.lineTo(px, y - 14); ctx.stroke(); ctx.fillStyle = s < 0 ? '#2E7A4E' : '#E8DCC0'; poly([px, y - 14, px + 9, y - 12 + Math.sin(px) * 1.4, px, y - 10]); ctx.fill(); }
  }
  function steamTrain(x, y, s) { // a black engine on the horizon, puffing, with its carriages
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = '#1A1412';
    ctx.fillRect(-2, -9, 16, 7); ctx.fillRect(10, -13, 6, 11); ctx.fillRect(1, -14, 3, 6); poly([-4, -2, -2, -6, -2, -2]); ctx.fill(); // the engine, the cab, the stack, the cowcatcher
    for (let i = 0; i < 3; i++) ctx.fillRect(18 + i * 15, -10, 13, 8); // the carriages
    ctx.fillStyle = '#F2D8A0'; for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) ctx.fillRect(20 + i * 15 + k * 4, -8.5, 2, 2); // their windows, catching the sun
    for (let i = 0; i < 4; i++) { ctx.fillStyle = '#1A1412'; circle(2 + i * 4, -1.5, 1.6); ctx.fill(); }
    ctx.restore();
  }
  function marbleStatue(x, base, s, rnd) { // a standing figure in a long drapery, on a tall plinth, lit from the left
    ctx.save(); ctx.translate(x, base); ctx.scale(s, s);
    ctx.fillStyle = '#C8B49A'; ctx.fillRect(-9, -26, 18, 26); ctx.fillStyle = '#F2E6CC'; ctx.fillRect(-9, -26, 6, 26); ctx.fillStyle = '#E8D8B8'; ctx.fillRect(-11, -28, 22, 3); ctx.fillRect(-11, -3, 22, 3); // the plinth
    const fig = [-5, -28, -6, -44, -4, -56, -2, -60, 1, -61, 3, -58, 4, -52, 6, -44, 5, -28]; poly(fig); ctx.fillStyle = '#D6C6A8'; ctx.fill();
    ctx.save(); poly(fig); ctx.clip(); ctx.fillStyle = '#FBF2DC'; ctx.fillRect(-8, -64, 7, 40); ctx.strokeStyle = 'rgba(110,90,70,.5)'; ctx.lineWidth = .6; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-3 + i * 2, -50); ctx.quadraticCurveTo(-4 + i * 2.4, -38, -3 + i * 2, -28); ctx.stroke(); } ctx.restore(); // the drapery's folds
    ctx.fillStyle = '#E8DCC0'; ell(0, -65, 3, 3.6); ctx.fill(); ctx.fillStyle = '#B8A68A'; ell(1.2, -64.5, 1.8, 3.2); ctx.fill(); // the head
    ctx.strokeStyle = '#D6C6A8'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-4, -55); ctx.quadraticCurveTo(-9, -48, -7, -40); ctx.stroke(); // an arm
    ctx.restore();
  }
  function pennant(x, base, h, col, rnd) {
    ctx.strokeStyle = '#2A1A14'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x, base - h); ctx.stroke();
    ctx.fillStyle = col; poly([x, base - h, x + 16, base - h + 3 + rnd() * 2, x + 12, base - h + 5, x + 17, base - h + 8, x, base - h + 9]); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; poly([x, base - h, x + 16, base - h + 3, x, base - h + 3]); ctx.fill();
  }
  function tinyFigure(x, base, s, shadowL) { // a little dark figure in the square, its shadow stretching away
    ctx.fillStyle = 'rgba(20,12,10,.55)'; poly([x - 1.5 * s, base, x + 1.5 * s, base, x + shadowL + 2 * s, base + 3 * s, x + shadowL, base + 3.6 * s]); ctx.fill();
    ctx.fillStyle = '#1E1612'; rrect(x - 1.6 * s, base - 9 * s, 3.2 * s, 9 * s, 1.2 * s); ctx.fill(); circle(x, base - 10.4 * s, 1.5 * s); ctx.fill();
  }
  function piazzaFar(rnd, th, f) {
    AW_SUN = -1;
    // the low far wall that closes off the square at the horizon, and the train running along its top
    const wy = 206;
    for (let i = 0; i < 7; i++) awWR(i * 190 + rnd() * 60, 50, rnd, (x, r) => { const w = 60 + r() * 50; for (let k = 0; k < 3; k++) { const sx = x - 10 + k * 22 + r() * 8, sh = 10 + r() * 22; ctx.fillStyle = '#F4ECE0'; poly([sx, wy, sx + 3, wy - sh, sx + 11, wy]); ctx.fill(); ctx.fillStyle = '#C8C0B8'; poly([sx + 3, wy - sh, sx + 11, wy, sx + 6, wy]); ctx.fill(); } }); // sails, beyond the wall
    ctx.fillStyle = '#7A5848'; ctx.fillRect(0, wy, AW_W, 10); ctx.fillStyle = '#B88466'; ctx.fillRect(0, wy, AW_W, 2.2); ctx.fillStyle = 'rgba(40,20,14,.3)'; ctx.fillRect(0, wy + 7, AW_W, 3);
    W6.trainX = 420 + rnd() * 120; awWrap(W6.trainX, 80, (x) => steamTrain(x, wy, 1.05));
    for (let i = 0; i < 3; i++) awWR(i * 430 + 100 + rnd() * 120, 20, rnd, (x, r) => chimney(x, wy + 2, 70 + r() * 50, 7 + r() * 5, r));
    awWR(900 + rnd() * 80, 30, rnd, (x, r) => redTower(x, wy + 2, 110, 30, r));
    hazeBand(f, th.haze, 150, wy + 8, .32);
    for (let i = 0; i < 4; i++) awWR(i * 320 + rnd() * 140, 120, rnd, (x, r) => arcade(x, x + 90 + r() * 70, T - 6, 46 + r() * 20, 24, 6, r() < .5, r, { face: '#E6B47E', shade: '#9A6A4A', win: false }));
    hazeBand(f, th.haze, 170, T, .4);
  }
  function piazzaMid(rnd) {
    AW_SUN = -1;
    // the great arcades: two running away into the distance, one coming toward us; an end-wall square to the view
    const spots = [[30, 1], [360, 0], [700, 1], [1000, 0]];
    for (const [x0, k] of spots) {
      const x = x0 + rnd() * 60, len = 200 + rnd() * 60, dir = k ? 1 : -1;
      awWR(x, len + 40, rnd, (x, r) => arcade(dir > 0 ? x : x + len, dir > 0 ? x + len : x, T + 2, 132 + r() * 24, 60, 7, dir > 0, r, { end: 26 + r() * 10 }));
    }
    // statues on their plinths, pennants, a little pair of figures with their shadows, far out in the square
    for (let i = 0; i < 3; i++) awWR(250 + i * 420 + rnd() * 60, 20, rnd, (x, r) => marbleStatue(x, T + 1, 1 + r() * .25, r));
    for (let i = 0; i < 6; i++) awWR(rnd() * AW_W, 20, rnd, (x, r) => pennant(x, T + 2, 70 + r() * 40, r() < .5 ? '#2E7A4E' : '#B8402E', r));
    for (let i = 0; i < 4; i++) awWR(rnd() * AW_W, 30, rnd, (x, r) => { tinyFigure(x, T - 1, 1, 34); if (r() < .6) tinyFigure(x + 6, T - 1, .9, 30); });
  }
  // the paving: big ochre slabs in rows that widen toward us, the long shadows of the arcades lying across it, things
  // the dream has left lying along the back (a marble torso, a bunch of bananas, a red glove, a green ball)
  function piazzaFloor(rnd, th) {
    { const g = ctx.createLinearGradient(0, T - 2, 0, VH); g.addColorStop(0, '#F0C080'); g.addColorStop(.25, '#E0A462'); g.addColorStop(.7, '#C07A40'); g.addColorStop(1, '#8A5028'); ctx.fillStyle = g; ctx.fillRect(0, T - 2, AW_W, VH - T + 2); }
    let y = T; const rows = [7, 9, 11, 13, 16, 19, 23, 26];
    for (const h of rows) {
      for (const [x0, w] of awRow(rnd, h * 3.5, h * 7)) for (const ox of x0 + w > AW_W ? [0, -AW_W] : [0]) {
        const x = x0 + ox, k = rnd(); ctx.fillStyle = k < .5 ? `rgba(255,220,160,${.06 + rnd() * .12})` : `rgba(110,60,30,${.06 + rnd() * .12})`; ctx.fillRect(x + .6, y + .6, w - 1.2, h - 1.2);
        for (let i = 0; i < 2; i++) dab(x + rnd() * w, y + rnd() * h, h * (.2 + rnd() * .3), rnd() < .5 ? '#F6CC90' : '#A86A3A', .25);
        ctx.fillStyle = 'rgba(70,36,18,.55)'; ctx.fillRect(x, y, .9, h); ctx.fillStyle = 'rgba(255,230,180,.35)'; ctx.fillRect(x + .9, y, .6, h);
      }
      ctx.fillStyle = 'rgba(70,36,18,.5)'; ctx.fillRect(0, y, AW_W, .9); ctx.fillStyle = 'rgba(255,230,180,.3)'; ctx.fillRect(0, y + .9, AW_W, .6);
      y += h;
    }
    // the long shadows, thrown right and toward us by a sun far down on the left; light comes through the arches in them
    W6.shadowBands = [];
    for (let i = 0; i < 4; i++) {
      const x = 80 + i * 320 + rnd() * 90, w = 90 + rnd() * 80, sl = 210 + rnd() * 60, arches = rnd() < .65;
      W6.shadowBands.push([x, w, sl]);
      for (const ox of [0, -AW_W, AW_W]) {
        const X = x + ox, pts = [X, T, X + w, T, X + w + sl, VH, X + sl, VH];
        ctx.save(); poly(pts); ctx.clip();
        const g = ctx.createLinearGradient(0, T, 0, VH); g.addColorStop(0, 'rgba(30,14,10,.55)'); g.addColorStop(1, 'rgba(30,14,10,.72)'); ctx.fillStyle = g; ctx.fillRect(X - 10, T, w + sl + 20, VH - T);
        if (arches) for (let k = 0; k < 4; k++) { // a lit arch in the shadow: an arch-shaped hole, skewed along with it
          const u = .25 + k * .17, ay = lerp(T, VH, u), ah = (VH - T) * .14, ax = X + sl * u + w * .2, aw = w * .45;
          ctx.fillStyle = 'rgba(240,180,110,.62)'; ctx.beginPath(); ctx.moveTo(ax, ay + ah); ctx.lineTo(ax + sl * .14, ay); ctx.lineTo(ax + sl * .14 + aw * .7, ay - ah * .1); ctx.quadraticCurveTo(ax + aw * 1.05, ay + ah * .35, ax + aw, ay + ah); ctx.closePath(); ctx.fill(); }
        ctx.restore();
      }
    }
    // the back verge: the far edge of the paving, and what lies along it
    ctx.fillStyle = 'rgba(60,30,18,.35)'; ctx.fillRect(0, T - 2, AW_W, 2.4);
    for (let i = 0; i < 5; i++) awWR(rnd() * AW_W, 20, rnd, (x, r) => { const k = i % 4;
      if (k === 0) { ctx.fillStyle = '#E8DCC0'; poly([x - 7, T + 3, x - 8, T - 8, x - 5, T - 14, x + 5, T - 14, x + 8, T - 8, x + 7, T + 3]); ctx.fill(); ctx.fillStyle = '#B8A88E'; poly([x + 1, T - 14, x + 5, T - 14, x + 8, T - 8, x + 7, T + 3, x + 2, T + 3]); ctx.fill(); ctx.fillStyle = '#D6C6A8'; ell(x, T - 16, 3, 2.4); ctx.fill(); } // a marble torso
      else if (k === 1) { for (let b = 0; b < 4; b++) { ctx.strokeStyle = '#E8C040'; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 6 + b * 2, T + 2); ctx.quadraticCurveTo(x - 2 + b * 2, T - 8, x + 6 + b, T - 6 + b); ctx.stroke(); } ctx.strokeStyle = '#6A4A1A'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 6, T + 2); ctx.lineTo(x - 3, T + 1); ctx.stroke(); } // bananas
      else if (k === 2) { ctx.fillStyle = '#C8302A'; for (let f = 0; f < 4; f++) { ctx.save(); ctx.translate(x + f * 2.4 - 3, T - 4); ctx.rotate(-.3 + f * .2); rrect(-1, -7, 2, 7, 1); ctx.fill(); ctx.restore(); } ell(x, T - 1, 5, 3.4); ctx.fill(); ctx.fillStyle = 'rgba(255,170,150,.6)'; ell(x - 1.5, T - 2, 2, 1); ctx.fill(); } // a red glove
      else { ctx.fillStyle = '#3A8A4E'; circle(x, T - 3, 4.4); ctx.fill(); ctx.fillStyle = 'rgba(200,255,200,.5)'; circle(x - 1.4, T - 4.6, 1.4); ctx.fill(); } }); // a green ball
    const sh = ctx.createLinearGradient(0, VH - 36, 0, VH); sh.addColorStop(0, 'rgba(40,16,8,0)'); sh.addColorStop(1, 'rgba(40,16,8,.4)'); ctx.fillStyle = sh; ctx.fillRect(0, VH - 36, AW_W, 36);
  }
  // the sky of Golconda: rank on rank of gentlemen in bowler hats, standing in the air, drifting a little (painted once)
  let golC = null;
  function buildGolconda() {
    retire(golC); const [c, g] = makeLayer(200, 120), old = ctx; ctx = g;
    for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) { const s = .5 + r * .16; golcondaMan(14 + i * 34 + (r % 2) * 17, 12 + r * 27, s, '#9AA0B8', .85 - r * .05); }
    ctx = old; golC = c;
  }
  THEMES.dream = {
    name: 'the piazza of long shadows', sky: ['#0C2A2C', '#1E5C56', '#78A890', '#F4D08A'], sun: [0.1, 0.66, '255,206,130'], haze: '236,196,140',
    floorA: '#E0A462', floorB: '#8A5028', path: '#F0C080', skyKind: 'none',
    grade: { desat: .05, top: 'rgba(30,110,100,.42)', bot: 'rgba(250,150,60,.44)', vig: 'rgba(30,12,8,.6)' },
    liveSky(camX, t) {
      if (!golC) buildGolconda();
      for (let i = 0; i < 7; i++) { // whole companies of them, at different depths, rising and sinking very slowly
        const d = .04 + (i % 3) * .025, s = .7 + (i % 3) * .3, W = VW + 260, x = (((i * 290 - camX * d + t * 1.5) % W) + W) % W - 130, y = Y_OFF + 6 + (i * 37) % 60 + Math.sin(t * .2 + i * 2) * 5;
        ctx.save(); ctx.globalAlpha = .5 + (i % 3) * .14; ctx.drawImage(golC, x - 100 * s, y, 200 * s, 120 * s); ctx.restore();
      }
      // the train's smoke, puffing up into the still air (the train is painted into the far layer)
      if (W6.trainX != null) { const fx = (((W6.trainX - camX * .15) % 1280) + 1280) % 1280; for (const ox of [0, -1280, 1280]) { const x = fx + ox + 3; if (x < -60 || x > VW + 60) continue;
        for (let i = 0; i < 7; i++) { const life = (t * .25 + i / 7) % 1; softDab(x - life * 40, 206 - 16 - life * 46, 4 + life * 12, '250,244,232', .7 * (1 - life)); } } }
    },
    liveFloor(camX, t) { // a heat-shimmer of light along the far edge of the square
      for (let x = ((-camX) % 80 + 80) % 80 - 80; x < VW + 80; x += 80) { const w = Math.floor((x + camX) / 80 + .5), a = .12 + .1 * Math.sin(t * 1.3 + w * 1.7); ctx.fillStyle = `rgba(255,230,170,${a})`; ctx.fillRect(x + hsh(w) * 50, T + 1 + hsh(w + 1) * 4, 18 + hsh(w + 2) * 20, .8); }
    },
  };
  AW_FAR.dream = piazzaFar; AW_MID.dream = piazzaMid; AW_FLOOR.dream = piazzaFloor;

  // ======================================================================================================
  // THE SHORE OF SOFT CLOCKS: a golden shore under cliffs, dead olive trees hung with melting watches
  // ======================================================================================================
  // the cliffs of the cape: worn golden rock in leaning slabs, lit on the left, deep shade in the clefts
  function cape(x0, x1, base, h, rnd) {
    const n = 22, top = []; let wob = 0;
    for (let i = 0; i <= n; i++) { const u = i / n; wob += (rnd() - .5) * .25; wob *= .8; top.push([lerp(x0, x1, u) + (rnd() - .5) * 6, base - h * Math.max(.08, Math.pow(Math.sin(u * Math.PI), .7) * (.75 + rnd() * .25) + wob) - (i % 4 === 1 ? rnd() * 10 : 0)]); }
    const path = () => { ctx.beginPath(); ctx.moveTo(x0, base); top.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.lineTo(x1, base); ctx.closePath(); };
    path(); const g = ctx.createLinearGradient(0, base - h, 0, base); g.addColorStop(0, '#D8A066'); g.addColorStop(1, '#8A5A3A'); ctx.fillStyle = g; ctx.fill();
    ctx.save(); path(); ctx.clip();
    for (let i = 0; i < top.length - 1; i++) { const [xa, ya] = top[i], [xb, yb] = top[i + 1]; // each knuckle of rock: lit where it faces the sun on the left, shade in the clefts
      if (yb > ya) { ctx.fillStyle = '#5A3A2A'; ctx.globalAlpha = .4; poly([xa, ya, xb, yb, xb + 3, base, xa + 6, base]); ctx.fill(); }
      else { ctx.fillStyle = '#FFD89C'; ctx.globalAlpha = .55; poly([xa, ya, xb, yb, xb - 8, yb + (base - yb) * .5, xa - 2, ya + (base - ya) * .4]); ctx.fill(); }
      ctx.globalAlpha = 1; }
    ctx.strokeStyle = 'rgba(90,50,30,.35)'; ctx.lineWidth = .8; for (let k = 1; k < 7; k++) { const y = base - h * k / 7; ctx.beginPath(); ctx.moveTo(x0, y + rnd() * 3); for (let x = x0; x < x1; x += 20) ctx.lineTo(x, y + Math.sin(x * .05 + k) * 2.5); ctx.stroke(); } // the strata
    for (let i = 0; i < 50; i++) dab(lerp(x0, x1, rnd()), base - rnd() * h, 2 + rnd() * 5, rnd() < .5 ? '#FFE0A8' : '#6A4430', .28);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,240,210,.5)'; ctx.fillRect(x0 + 10, base - 1.5, x1 - x0 - 20, 1.2); // surf at its foot
  }
  // a dead olive tree: a twisted grey trunk with one branch held out, a soft watch hanging off it
  function oliveTree(x, base, h, rnd, watch = true) {
    ctx.lineCap = 'round'; const tw = 5 + h * .03;
    ctx.strokeStyle = '#3E3430'; ctx.lineWidth = tw + 2; ctx.beginPath(); ctx.moveTo(x, base); ctx.bezierCurveTo(x - 8, base - h * .3, x + 10, base - h * .55, x + 2, base - h * .8); ctx.stroke();
    ctx.strokeStyle = '#8A7A6E'; ctx.lineWidth = tw; ctx.stroke(); ctx.strokeStyle = '#C8B8A8'; ctx.lineWidth = tw * .3; ctx.beginPath(); ctx.moveTo(x - 1.5, base); ctx.bezierCurveTo(x - 9.5, base - h * .3, x + 8.5, base - h * .55, x + .5, base - h * .8); ctx.stroke();
    const bx = x + 2, by = base - h * .8, ex = bx + h * .45, ey = by - h * .08;
    ctx.strokeStyle = '#3E3430'; ctx.lineWidth = tw * .55 + 2; ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + h * .2, by - h * .15, ex, ey); ctx.stroke(); ctx.strokeStyle = '#8A7A6E'; ctx.lineWidth = tw * .55; ctx.stroke();
    ctx.strokeStyle = '#3E3430'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx - 8, by - 14, bx - 14, by - 18); ctx.moveTo(ex - 6, ey - 1); ctx.lineTo(ex, ey - 8); ctx.stroke(); // twigs
    if (watch) softWatch(ex - 8, ey + 4, h / 110, .8, .15);
  }
  // a slab of stone in the sand (a ledge for the watches to melt over), lit on its top and left face
  function slab(x, base, w, h, d, rnd) {
    ctx.fillStyle = '#7A5A44'; poly([x + w, base, x + w + d, base - d * .4, x + w + d, base - h - d * .4, x + w, base - h]); ctx.fill(); // its shaded end
    ctx.fillStyle = '#D8A26A'; ctx.fillRect(x, base - h, w, h); ctx.fillStyle = '#F4D29C'; poly([x, base - h, x + d, base - h - d * .4, x + w + d, base - h - d * .4, x + w, base - h]); ctx.fill();
    for (let i = 0; i < 8; i++) dab(x + rnd() * w, base - rnd() * h, 2 + rnd() * 3, rnd() < .5 ? '#F6D8A8' : '#9A6A44', .35);
  }
  function shoreFar(rnd, th, f) {
    AW_SUN = -1;
    // a sky so clear it is almost glass, with a few long thin clouds lit gold underneath
    for (let i = 0; i < 6; i++) { const x = rnd() * AW_W, y = 110 + rnd() * 50, L = 80 + rnd() * 120; awWrap(x, L, (x) => { ctx.fillStyle = 'rgba(250,236,210,.55)'; ell(x, y, L, 2.6); ctx.fill(); ctx.fillStyle = 'rgba(255,200,140,.4)'; ell(x + 6, y + 2, L * .8, 1.4); ctx.fill(); }); }
    // the sea: flat and still, deep blue-green, a line of light along it
    const sy = 196; { const g = ctx.createLinearGradient(0, sy, 0, T); g.addColorStop(0, '#3E7A8A'); g.addColorStop(.4, '#2A5A6E'); g.addColorStop(1, '#6A8A84'); ctx.fillStyle = g; ctx.fillRect(0, sy, AW_W, T - sy); }
    ctx.fillStyle = 'rgba(255,240,210,.7)'; ctx.fillRect(0, sy, AW_W, 1.2);
    for (let i = 0; i < 70; i++) { const x = rnd() * AW_W, y = sy + 3 + rnd() * 30; ctx.fillStyle = `rgba(255,236,200,${.2 + rnd() * .35})`; ctx.fillRect(x, y, 4 + rnd() * 10, .7); }
    // the cape: golden cliffs running out into the sea, one great headland and a lower one
    awWR(860 + rnd() * 60, 260, rnd, (x, r) => cape(x - 240, x + 240, sy + 6, 92, r));
    awWR(260 + rnd() * 60, 150, rnd, (x, r) => cape(x - 140, x + 140, sy + 6, 46, r));
    hazeBand(f, th.haze, 120, sy + 8, .3);
    // stilt elephants striding along the shore's far edge, one behind another
    W6.eleFar = [];
    for (let i = 0; i < 3; i++) { const x = 140 + i * 400 + rnd() * 120, s = .9 + rnd() * .5; W6.eleFar.push(x); awWrap(x, 40, (x) => stiltElephant(x, sy + 16, 70 * s, s, '#4A3A40', '#E8B08A', i * 1.3)); }
    // a little boat, far out
    awWR(rnd() * AW_W, 10, rnd, (x) => { ctx.fillStyle = '#3A2A24'; poly([x - 6, sy + 10, x + 6, sy + 10, x + 4, sy + 13, x - 4, sy + 13]); ctx.fill(); ctx.fillStyle = '#F4EAD8'; poly([x, sy + 10, x, sy - 2, x + 5, sy + 9]); ctx.fill(); });
    hazeBand(f, th.haze, 170, T, .45);
  }
  function shoreMid(rnd) {
    AW_SUN = -1;
    // the near beach rising to a low ridge of rock behind the shore
    awHills(T - 14, [[2, 5], [5, 3], [11, 1.4]], 131, '#B8864E', '#F6D29A', .6);
    // dead olive trees with their watches; stone slabs with watches melting over their edges; soft shapes on crutches
    for (let i = 0; i < 4; i++) awWR(70 + i * 320 + rnd() * 80, 90, rnd, (x, r) => oliveTree(x, T + 2, 110 + r() * 40, r));
    for (let i = 0; i < 3; i++) awWR(230 + i * 420 + rnd() * 60, 90, rnd, (x, r) => { slab(x - 50, T + 2, 80, 22 + r() * 10, 12, r); softWatch(x + 30, T - 26, 1.3, 1, -.1); softWatch(x - 10, T - 30, .9, .3, .05, '#A88A5A', '#E8E0C8'); });
    for (let i = 0; i < 2; i++) awWR(520 + i * 640 + rnd() * 60, 60, rnd, (x, r) => { // a soft mass of something, held up off the sand by a crutch
      ctx.fillStyle = '#D8A88A'; ctx.beginPath(); ctx.moveTo(x - 40, T - 34); ctx.bezierCurveTo(x - 20, T - 58, x + 30, T - 50, x + 46, T - 30); ctx.bezierCurveTo(x + 30, T - 20, x + 6, T - 6, x - 6, T - 12); ctx.bezierCurveTo(x - 20, T - 20, x - 30, T - 22, x - 40, T - 34); ctx.fill();
      ctx.fillStyle = '#F6D6B8'; ell(x - 6, T - 44, 22, 6, -.2); ctx.fill(); ctx.fillStyle = 'rgba(120,70,50,.4)'; ell(x + 14, T - 24, 22, 6, -.3); ctx.fill();
      crutchShape(x + 30, T + 2, x + 30, T - 34, 2.6, 8); });
    // a chest of drawers standing on the shore, its drawers half open
    awWR(rnd() * AW_W, 30, rnd, (x, r) => { ctx.fillStyle = '#6A3A24'; ctx.fillRect(x - 16, T - 50, 32, 52); ctx.fillStyle = '#9A5A34'; ctx.fillRect(x - 16, T - 50, 10, 52);
      for (let k = 0; k < 4; k++) { const dy = T - 46 + k * 12, out = [4, 9, 0, 6][k]; ctx.fillStyle = '#B87A4A'; ctx.fillRect(x - 14 + out * .3, dy, 28, 9); ctx.fillStyle = '#2A140C'; ctx.fillRect(x - 14, dy + 9, 28, 1.5); ctx.fillStyle = '#F2C86A'; circle(x + out * .3, dy + 4.5, 1.2); ctx.fill(); } });
  }
  // the sand: pale gold, combed into long ripples, the shadows of things lying long across it, small pebbles and a few ants
  function shoreFloor(rnd, th) {
    { const g = ctx.createLinearGradient(0, T - 2, 0, VH); g.addColorStop(0, '#F2D49A'); g.addColorStop(.3, '#E2B474'); g.addColorStop(.75, '#C88E52'); g.addColorStop(1, '#94603A'); ctx.fillStyle = g; ctx.fillRect(0, T - 2, AW_W, VH - T + 2); }
    for (let i = 0; i < 46; i++) { const y = T + 4 + Math.pow(rnd(), 1.3) * (VH - T - 8), x = rnd() * AW_W, L = 40 + (y - T) * 1.6 + rnd() * 60, a = .18 + rnd() * .2;
      awWrap(x, L, (x) => { ctx.strokeStyle = `rgba(150,96,50,${a})`; ctx.lineWidth = .8 + (y - T) * .01; ctx.beginPath(); ctx.moveTo(x - L, y); ctx.quadraticCurveTo(x, y - 2 - (y - T) * .02, x + L, y + 1); ctx.stroke();
        ctx.strokeStyle = `rgba(255,236,190,${a * 1.4})`; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(x - L * .8, y - 1.2); ctx.quadraticCurveTo(x, y - 3 - (y - T) * .02, x + L * .8, y - .4); ctx.stroke(); }); }
    for (let i = 0; i < 60; i++) dab(rnd() * AW_W, T + 6 + rnd() * (VH - T - 10), 2 + rnd() * 7, rnd() < .5 ? '#F8DCA8' : '#B07A44', .22);
    // long shadows of the trees and slabs behind, thrown toward us and to the right
    for (let i = 0; i < 6; i++) { const x = rnd() * AW_W, w = 22 + rnd() * 50, sl = 160 + rnd() * 80, L = .45 + rnd() * .5;
      for (const ox of [0, -AW_W, AW_W]) { const X = x + ox; ctx.fillStyle = 'rgba(70,36,24,.3)'; poly([X, T + 1, X + w, T + 1, X + w + sl * L, T + (VH - T) * L, X + sl * L, T + (VH - T) * L]); ctx.fill(); } }
    for (let i = 0; i < 26; i++) awWR(rnd() * AW_W, 8, rnd, (x, r) => { const y = T + 6 + r() * 100, s = 1.4 + r() * 3; ctx.fillStyle = '#6A4A3A'; ell(x, y, s, s * .6); ctx.fill(); ctx.fillStyle = '#E8D0B0'; ell(x - s * .3, y - s * .25, s * .45, s * .25); ctx.fill(); }); // pebbles
    for (let i = 0; i < 4; i++) awWR(rnd() * AW_W, 20, rnd, (x, r) => { for (let k = 0; k < 9; k++) { const ax = x + k * 4 + r() * 3, ay = T + 30 + Math.sin(k) * 4; ctx.fillStyle = '#1A100C'; ell(ax, ay, 1.3, .7); ctx.fill(); ell(ax + 1.4, ay - .2, .7, .6); ctx.fill(); } }); // a file of ants
    ctx.fillStyle = 'rgba(80,46,24,.35)'; ctx.fillRect(0, T - 2, AW_W, 2);
    const sh = ctx.createLinearGradient(0, VH - 36, 0, VH); sh.addColorStop(0, 'rgba(60,30,14,0)'); sh.addColorStop(1, 'rgba(60,30,14,.38)'); ctx.fillStyle = sh; ctx.fillRect(0, VH - 36, AW_W, 36);
  }
  THEMES.dream2 = {
    name: 'the shore of soft clocks', sky: ['#2C5A8E', '#6C9EC4', '#D8E2CC', '#F6CE8C'], sun: [0.14, 0.5, '255,226,170'], haze: '232,206,160',
    floorA: '#E2B474', floorB: '#94603A', path: '#F2D49A', skyKind: 'none',
    grade: { desat: .04, top: 'rgba(60,110,190,.38)', bot: 'rgba(250,170,80,.42)', vig: 'rgba(40,20,10,.55)' },
    liveSky(camX, t) { // a gull or two, and the far elephants' slow stride (a shimmer of heat over them)
      for (let i = 0; i < 3; i++) { const W = VW + 200, x = (((i * 260 + t * (6 + i * 2) - camX * .05) % W) + W) % W - 100, y = Y_OFF + 20 + i * 18 + Math.sin(t * .7 + i) * 4, fl = Math.sin(t * 5 + i * 2) * 2.2;
        ctx.strokeStyle = 'rgba(60,50,60,.7)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(x - 5, y - fl); ctx.quadraticCurveTo(x - 2, y - 2, x, y); ctx.quadraticCurveTo(x + 2, y - 2, x + 5, y - fl); ctx.stroke(); }
    },
    liveFloor(camX, t) { // light glancing off the sand in the slow heat
      for (let x = ((-camX) % 64 + 64) % 64 - 64; x < VW + 64; x += 64) { const w = Math.floor((x + camX) / 64 + .5), a = Math.max(0, Math.sin(t * 1.6 + w * 2.3)) * .5; if (a < .05) continue; ctx.fillStyle = `rgba(255,246,220,${a})`; circle(x + hsh(w) * 50, T + 10 + hsh(w + 3) * 100, .9 + a); ctx.fill(); }
    },
  };
  AW_FAR.dream2 = shoreFar; AW_MID.dream2 = shoreMid; AW_FLOOR.dream2 = shoreFloor;

  // ======================================================================================================
  // THE BED OF THE SLEEPER: a quilt as wide as a country under a bright day sky, and along its edge a street at night,
  // its one lamp lit, its houses dark; the day overhead and the night below, both at once
  // ======================================================================================================
  function cumulus(x, y, w, rnd, a = 1) { // a fair-weather cloud: a flat grey-violet underside, piled white lobes, lit on top
    const n = 7 + Math.floor(w / 18);
    ctx.save(); ctx.globalAlpha *= a;
    ctx.fillStyle = '#A8B4CC'; ell(x, y, w * .55, w * .12); ctx.fill();
    for (let i = 0; i < n; i++) { const u = i / (n - 1) - .5, r = w * (.16 + (1 - Math.abs(u) * 1.6) * .12) * (.8 + rnd() * .4); ctx.fillStyle = '#C8D2E4'; circle(x + u * w * .9, y - r * .6, r); ctx.fill(); }
    for (let i = 0; i < n; i++) { const u = i / (n - 1) - .5, r = w * (.13 + (1 - Math.abs(u) * 1.6) * .11) * (.8 + rnd() * .4); ctx.fillStyle = '#F6F8FC'; circle(x + u * w * .85 - 2, y - r * .9, r); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 5; i++) { circle(x + (rnd() - .5) * w * .6, y - w * .22 - rnd() * w * .1, w * .06); ctx.fill(); }
    ctx.restore();
  }
  let cloudCs = [];
  function buildClouds() { for (const c of cloudCs) retire(c); cloudCs = []; const r = mulberry(77);
    for (let i = 0; i < 4; i++) { const [c, g] = makeLayer(220, 130), old = ctx; ctx = g; cumulus(110, 110, 150 + i * 14, r); ctx = old; cloudCs.push(c); } }
  function nightHouse(x, base, w, h, rnd, lit) { // a house of the dark street: a pale front gone blue-black, shutters, one window lit
    ctx.fillStyle = '#121A2C'; ctx.fillRect(x, base - h, w, h); ctx.fillStyle = '#1C2640'; ctx.fillRect(x, base - h, w * .3, h);
    ctx.fillStyle = '#0A0E1A'; poly([x - 3, base - h, x + w / 2, base - h - w * .32, x + w + 3, base - h]); ctx.fill(); // the roof
    const cols = 3, rows = Math.max(1, Math.floor(h / 26));
    for (let r2 = 0; r2 < rows; r2++) for (let c = 0; c < cols; c++) { const wx = x + w * (.18 + c * .3), wy = base - h + 10 + r2 * 24, on = lit && rnd() < .3;
      if (on) awGlow('#FFC870', 8, () => { ctx.fillStyle = '#FFD890'; ctx.fillRect(wx, wy, w * .14, 11); }); else { ctx.fillStyle = '#060810'; ctx.fillRect(wx, wy, w * .14, 11); }
      ctx.fillStyle = '#26324E'; ctx.fillRect(wx - 3, wy, 2.4, 11); ctx.fillRect(wx + w * .14 + .6, wy, 2.4, 11); } // shutters
    ctx.fillStyle = '#05070E'; ctx.fillRect(x + w * .42, base - 18, w * .16, 18); // the door
  }
  function nightTree(x, base, h, rnd) { // a great dark tree: a heavy rounded crown of small leaf-dabs, a little moonless blue on its top
    ctx.strokeStyle = '#05070C'; ctx.lineCap = 'round'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x - 3, base - h * .3, x + 2, base - h * .5); ctx.stroke();
    ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x + 1, base - h * .42); ctx.lineTo(x + h * .16, base - h * .6); ctx.moveTo(x, base - h * .38); ctx.lineTo(x - h * .14, base - h * .55); ctx.stroke();
    const lobes = 4 + Math.floor(rnd() * 3);
    for (let L = 0; L < lobes; L++) { const lx = x + (rnd() - .5) * h * .45, ly = base - h * (.6 + rnd() * .26), lr = h * (.16 + rnd() * .1);
      for (let i = 0; i < 46; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * lr; dab(lx + Math.cos(a) * d, ly + Math.sin(a) * d * .85, 3.4 + rnd() * 4, i % 4 ? '#070A12' : '#0E1424', .95); }
      for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (rnd() - .5) * 1.6, d = lr * (.7 + rnd() * .3); dab(lx + Math.cos(a) * d, ly + Math.sin(a) * d * .85, 1.6 + rnd() * 1.6, '#2A3A66', .55); } }
  }
  function streetLamp(x, base, h) {
    ctx.fillStyle = '#05070C'; ctx.fillRect(x - 1.4, base - h, 2.8, h); ctx.fillRect(x - 4, base - 5, 8, 5);
    ctx.fillRect(x - 6, base - h - 2, 12, 2.4); poly([x - 5, base - h - 2, x + 5, base - h - 2, x + 3, base - h - 12, x - 3, base - h - 12]); ctx.fill();
    awGlow('#FFD27A', 16, () => { ctx.fillStyle = '#FFE6A8'; poly([x - 4, base - h - 3, x + 4, base - h - 3, x + 2.6, base - h - 11, x - 2.6, base - h - 11]); ctx.fill(); });
    addB(() => softDab(x, base - h - 7, 60, '255,200,110', .35));
  }
  function bedFar(rnd, th, f) {
    AW_SUN = 1;
    // fixed clouds, far and small, banked low over the rooftops
    for (let i = 0; i < 10; i++) awWR(i * 128 + rnd() * 60, 70, rnd, (x, r) => cumulus(x, 150 + r() * 26, 60 + r() * 50, r, .9));
    // and below them, the night: a row of far rooftops and treetops, black-blue, a lit window or two
    const g = ctx.createLinearGradient(0, 168, 0, T); g.addColorStop(0, 'rgba(14,20,40,0)'); g.addColorStop(.5, 'rgba(14,20,40,.75)'); g.addColorStop(1, '#0C1222'); ctx.fillStyle = g; ctx.fillRect(0, 168, AW_W, T - 168);
    for (let i = 0; i < 26; i++) awWR(rnd() * AW_W, 30, rnd, (x, r) => { const w = 14 + r() * 20, h = 10 + r() * 22; ctx.fillStyle = '#0A1020'; ctx.fillRect(x, T - 30 - h, w, h + 30); poly([x - 2, T - 30 - h, x + w / 2, T - 38 - h, x + w + 2, T - 30 - h]); ctx.fill(); if (r() < .4) { ctx.fillStyle = '#FFCE7A'; ctx.fillRect(x + w * .4, T - 22 - h, 2.4, 3); } });
    for (let i = 0; i < 14; i++) awWR(rnd() * AW_W, 30, rnd, (x, r) => { for (let k = 0; k < 8; k++) dab(x + (r() - .5) * 30, T - 40 - r() * 26, 7 + r() * 6, '#080C18', .95); });
  }
  function bedMid(rnd) {
    AW_SUN = 1;
    // the dark street along the far edge of the bed: houses, great trees, the one lamp, its light in a pond
    for (let i = 0; i < 5; i++) awWR(i * 256 + rnd() * 40, 70, rnd, (x, r) => nightHouse(x - 30, T - 4, 60 + r() * 20, 70 + r() * 40, r, true));
    for (let i = 0; i < 6; i++) awWR(i * 213 + 120 + rnd() * 50, 60, rnd, (x, r) => nightTree(x, T - 2, 120 + r() * 50, r));
    for (let i = 0; i < 2; i++) awWR(300 + i * 640 + rnd() * 60, 70, rnd, (x) => { streetLamp(x, T - 2, 66);
      ctx.fillStyle = '#0A1224'; ell(x + 10, T - 4, 44, 4); ctx.fill(); addB(() => { ctx.fillStyle = 'rgba(255,200,110,.5)'; ctx.fillRect(x - 1, T - 7, 2.4, 6); ctx.fillStyle = 'rgba(255,200,110,.25)'; ell(x + 1, T - 4, 14, 1.4); ctx.fill(); }); });
    // the headboard of the great bed, rising out of the dark at the far end of the quilt: carved, gilded, endless
    ctx.fillStyle = '#2A1A20'; ctx.fillRect(0, T - 22, AW_W, 20); ctx.fillStyle = '#5A3A30'; ctx.fillRect(0, T - 22, AW_W, 3);
    for (let x = 12; x < AW_W; x += 64) { ctx.fillStyle = '#3A2428'; rrect(x, T - 34, 10, 32, 3); ctx.fill(); ctx.fillStyle = '#C8A060'; circle(x + 5, T - 36, 4); ctx.fill(); ctx.fillStyle = '#FFE6A8'; circle(x + 3.8, T - 37.4, 1.4); ctx.fill(); }
  }
  // the quilt: cream linen, diamond-quilted and stitched, rumpled in long soft folds, blue with the night and warm where
  // the lamplight falls on it; its edge hangs over at the front in a fringe of tassels
  function bedFloor(rnd, th) {
    { const g = ctx.createLinearGradient(0, T - 2, 0, VH); g.addColorStop(0, '#6A7090'); g.addColorStop(.3, '#8E92AE'); g.addColorStop(.8, '#B6B4C8'); g.addColorStop(1, '#7A7896'); ctx.fillStyle = g; ctx.fillRect(0, T - 2, AW_W, VH - T + 2); }
    const fold = awWave(311, [[3, 6], [7, 3], [13, 1.5]]);
    // the quilting: a lattice of stitched diamonds that widen toward us, each one puffed (lit on top, shaded below)
    let y = T + 2; for (let row = 0; row < 9; row++) { const h = 6 + row * 2.6, w = h * 2.6;
      for (let x = (row % 2) * w / 2 - w; x < AW_W + w; x += w) {
        const cy = y + h / 2 + fold(x) * (row / 9) * .5;
        ctx.fillStyle = `rgba(240,236,250,${.12 + hsh(x * .1 + row) * .1})`; ell(x, cy - h * .12, w * .38, h * .3); ctx.fill();
        ctx.fillStyle = 'rgba(40,40,80,.16)'; ell(x, cy + h * .22, w * .4, h * .18); ctx.fill();
        ctx.strokeStyle = 'rgba(60,58,96,.45)'; ctx.lineWidth = .7; ctx.setLineDash([2, 1.6]); poly([x - w / 2, cy, x, cy - h / 2, x + w / 2, cy, x, cy + h / 2]); ctx.stroke(); ctx.setLineDash([]);
      }
      y += h; }
    // long soft folds running across the cover
    for (let i = 0; i < 9; i++) { const yy = T + 10 + i * 12 + rnd() * 6, a = .1 + rnd() * .08; ctx.strokeStyle = `rgba(30,30,70,${a})`; ctx.lineWidth = 3 + i * .5; ctx.beginPath(); for (let x = 0; x <= AW_W; x += 16) ctx.lineTo(x, yy + fold(x + i * 90) * (.6 + i * .1)); ctx.stroke();
      ctx.strokeStyle = `rgba(250,248,255,${a * 1.2})`; ctx.lineWidth = 1.2; ctx.beginPath(); for (let x = 0; x <= AW_W; x += 16) ctx.lineTo(x, yy - 2 - i * .2 + fold(x + i * 90) * (.6 + i * .1)); ctx.stroke(); }
    // pools of warm lamplight under the lamps
    for (let i = 0; i < 2; i++) { const x = 300 + i * 640 + 30; awWrap(x, 160, (x) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, T + 40); ctx.scale(1, .3); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 170); g.addColorStop(0, 'rgba(255,190,110,.32)'); g.addColorStop(1, 'rgba(255,190,110,0)'); ctx.fillStyle = g; ctx.fillRect(-170, -170, 340, 340); ctx.restore(); }); }
    // the front edge where the cover turns down, and its fringe
    const ey = VH - 13; ctx.fillStyle = '#5A5A80'; ctx.fillRect(0, ey, AW_W, VH - ey); ctx.fillStyle = '#C8A060'; ctx.fillRect(0, ey, AW_W, 1.6);
    for (let x = 3; x < AW_W; x += 7) { ctx.strokeStyle = '#B08A50'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, ey + 1); ctx.lineTo(x + .5, ey + 9); ctx.stroke(); ctx.fillStyle = '#E8C070'; circle(x + .5, ey + 9.5, 1.3); ctx.fill(); }
    ctx.fillStyle = 'rgba(14,18,40,.45)'; ctx.fillRect(0, T - 2, AW_W, 3);
  }
  THEMES.dreamBoss = {
    name: 'the bed of the sleeper', sky: ['#2A68B0', '#5E9AD4', '#A6C8E8', '#3A4A6E'], sun: [0.5, 0.18, '255,250,236'], haze: '150,170,210',
    floorA: '#8E92AE', floorB: '#7A7896', path: '#C8A060', skyKind: 'none',
    grade: { desat: .04, top: 'rgba(90,150,230,.3)', bot: 'rgba(40,40,110,.45)', vig: 'rgba(8,10,30,.6)' },
    liveSky(camX, t) { // the day's clouds sailing over the night street
      if (!cloudCs.length) buildClouds();
      for (let i = 0; i < 6; i++) { const c = cloudCs[i % cloudCs.length], s = .7 + (i % 3) * .25, W = VW + 360, x = (((i * 233 + t * (3 + i % 3) - camX * (.03 + (i % 3) * .02)) % W) + W) % W - 180, y = Y_OFF - 20 + (i * 29) % 70;
        ctx.drawImage(c, x - 110 * s, y - 40 * s, 220 * s, 130 * s); }
    },
    liveFloor(camX, t) {},
  };
  AW_FAR.dreamBoss = bedFar; AW_MID.dreamBoss = bedMid; AW_FLOOR.dreamBoss = bedFloor;
  window.W6_ART = { golcondaMan, crutchShape, softWatch, stiltElephant, arcade, oliveTree, slab, cumulus, nightTree, streetLamp, marbleStatue, pennant, chimney };

  // ======================================================================================================
  // THE DREAMER'S PEOPLE: drawn finer than the folk of the other worlds, with joints, cloth that lags behind the body,
  // breath, anticipation before a blow and follow-through after it
  // ======================================================================================================
  // a two-joint limb as two tapered, inked strokes with a lit edge: from (x0, y0), the upper part at angle a1 for l1, the
  // lower at a2 for l2 (0 = +x, PI/2 = straight down); w1, w2 widths. Returns the joint and the end
  function seg2(x0, y0, a1, l1, a2, l2, w1, w2, col, o = {}) {
    const kx = x0 + Math.cos(a1) * l1, ky = y0 + Math.sin(a1) * l1, ex = kx + Math.cos(a2) * l2, ey = ky + Math.sin(a2) * l2;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const stroke = (pts, w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.stroke(); };
    const ink = FLASH ? '#fff' : (o.ink || INK);
    stroke([x0, y0, kx, ky], w1 + 2.2, ink); stroke([kx, ky, ex, ey], w2 + 2.2, ink);
    stroke([x0, y0, kx, ky], w1, C(col)); stroke([kx, ky, ex, ey], w2, C(o.col2 || col));
    if (DET()) { const lit = o.lit || shade(col, .32), n1 = a1 - Math.PI / 2, n2 = a2 - Math.PI / 2, d1 = w1 * .28, d2 = w2 * .28;
      ctx.globalAlpha = .8; stroke([x0 + Math.cos(n1) * d1, y0 + Math.sin(n1) * d1, kx + Math.cos(n1) * d1, ky + Math.sin(n1) * d1], Math.max(.6, w1 * .26), lit);
      stroke([kx + Math.cos(n2) * d2, ky + Math.sin(n2) * d2, ex + Math.cos(n2) * d2, ey + Math.sin(n2) * d2], Math.max(.6, w2 * .26), o.lit2 || lit); ctx.globalAlpha = 1;
      if (o.joint) { ctx.fillStyle = C(o.joint); circle(kx, ky, o.jr || w1 * .62); ctx.fill(); outline(.8); ctx.fillStyle = 'rgba(255,250,235,.7)'; circle(kx - .6, ky - .7, (o.jr || w1 * .62) * .35); ctx.fill(); } }
    return { kx, ky, ex, ey };
  }
  // a walking leg's two angles for a gait phase (side 0 or 1: the two legs half a cycle apart); stride, lift: how big
  function gait(ph, side, stride = .45, lift = .75, moving = 1) {
    const p = ph + side * Math.PI, th = Math.PI / 2 + Math.sin(p) * stride * moving, kn = (.06 + Math.max(0, Math.sin(p + 1.3)) * lift) * moving + .04;
    return [th, th + kn];
  }
  // a little shoe: a rounded wedge at the end of a leg
  function shoe(x, y, col = '#16141C', s = 1) { ctx.fillStyle = C(col); ctx.beginPath(); ctx.moveTo(x - 2.4 * s, y + .4); ctx.quadraticCurveTo(x - 2.4 * s, y - 3 * s, x + 1 * s, y - 2.6 * s); ctx.quadraticCurveTo(x + 5.4 * s, y - 1.6 * s, x + 5.6 * s, y + .4); ctx.closePath(); ctx.fill(); outline(1); if (DET()) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ell(x + 1.6 * s, y - 2 * s, 1.6 * s, .6 * s); ctx.fill(); } }
  // the idle life every one of them has: a slow breath, and a little sway
  const breath = (e, t, rate = 2) => Math.sin(t * rate + (e.slot || 0) * .3);
  const actK = (e, name) => e.state === 'w6act' && e.w6a === name ? (e.w6k ?? 0) : -1; // how far through an action it is (or -1)

  // ---------------- GENTLEMAN OF GOLCONDA: a man in a dark overcoat and bowler hat, a green apple hanging in front of
  // his face, a furled black umbrella. They come down out of the sky like rain ----------------
  function apple(x, y, r, ripe = 0) {
    ctx.fillStyle = C(ripe ? '#C8402A' : '#5EA03A'); ctx.beginPath(); ctx.moveTo(x, y - r * .7); ctx.bezierCurveTo(x + r * 1.3, y - r * 1.4, x + r * 1.4, y + r * .9, x + r * .2, y + r); ctx.bezierCurveTo(x - .2, y + r * 1.15, x - r * .4, y + r * 1.1, x - r * .6, y + r * .9); ctx.bezierCurveTo(x - r * 1.5, y + r * .4, x - r * 1.2, y - r * 1.4, x, y - r * .7); ctx.closePath(); ctx.fill(); outline(1);
    if (DET()) { ctx.fillStyle = 'rgba(30,70,20,.35)'; ell(x + r * .45, y + r * .3, r * .5, r * .55); ctx.fill(); ctx.fillStyle = 'rgba(240,255,200,.75)'; ell(x - r * .45, y - r * .25, r * .28, r * .4, -.4); ctx.fill(); ctx.fillStyle = '#E8E070'; circle(x - r * .55, y - r * .35, r * .1); ctx.fill(); }
    ctx.strokeStyle = C('#4A3018'); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(x, y - r * .7); ctx.quadraticCurveTo(x + .5, y - r * 1.2, x + 1.6, y - r * 1.5); ctx.stroke();
    ctx.fillStyle = C('#3E8A2A'); ctx.beginPath(); ctx.moveTo(x + .6, y - r * 1.15); ctx.quadraticCurveTo(x + r * .9, y - r * 1.8, x + r * 1.5, y - r * 1.3); ctx.quadraticCurveTo(x + r * .8, y - r * .9, x + .6, y - r * 1.15); ctx.fill(); outline(.7);
  }
  // the umbrella, drawn from the hand along +x (rotated by ang). open: 0 furled .. 1 open, a touch over 1 as it pops;
  // it blooms panel by panel, the middle ribs spreading first and the outer ones after, and folds back the same way
  function umbrella(len, open, ang, flut = 0) {
    ctx.save(); ctx.rotate(ang);
    ctx.strokeStyle = C('#5A3A20'); ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(-3.2, 0, 3.2, 0, Math.PI * .9, false); ctx.stroke(); // the crook handle
    ctx.strokeStyle = C('#2A2A30'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len + 3, 0); ctx.stroke(); // the shaft and its spike
    if (open < .04) { // furled: a slim black cone with a tie
      ctx.fillStyle = C('#1A1A22'); poly([4, -2.4, len * .82, -.8, len, 0, len * .82, .8, 4, 2.4]); ctx.fill(); outline(1);
      if (DET()) { ctx.strokeStyle = 'rgba(160,170,200,.45)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(6, -1.6); ctx.lineTo(len * .78, -.6); ctx.stroke(); ctx.fillStyle = '#3A3A48'; ctx.fillRect(len * .35, -2, 2, 4); }
    } else {
      const N = 6, tx = len, Lr = len * .66, over = Math.max(1, open), E = [], Q = [];
      for (let i = 0; i <= N; i++) { const u = i / N * 2 - 1, ok = open >= 1 ? 1 : sm(open * 1.6 - Math.abs(u) * .6); // this rib's own spread
        const ox = tx - Lr * (.5 + .14 * Math.sqrt(1 - u * u)), oy = u * Lr * .98 * over; // where its tip sits when open
        E.push([lerp(tx - Lr * .92, ox, ok), lerp(u * 2.4, oy, ok)]); Q.push([lerp(tx - Lr * .5, tx - Lr * .08, ok), lerp(u * 2, oy * .92, ok)]); }
      for (let j = 0; j < N; j++) { const a = E[j], b = E[j + 1], qa = Q[j], qb = Q[j + 1], mx = (a[0] + b[0]) / 2 + 1.8 + Math.sin(flut + j * 1.7) * 1.1, my = (a[1] + b[1]) / 2;
        ctx.fillStyle = C(j % 2 ? '#20202A' : '#121218'); ctx.beginPath(); ctx.moveTo(tx, 0); ctx.quadraticCurveTo(qa[0], qa[1], a[0], a[1]); ctx.quadraticCurveTo(mx, my, b[0], b[1]); ctx.quadraticCurveTo(qb[0], qb[1], tx, 0); ctx.closePath(); ctx.fill(); outline(.9); }
      if (DET()) { ctx.strokeStyle = 'rgba(150,160,200,.5)'; ctx.lineWidth = .6; for (let i = 1; i < N; i++) { ctx.beginPath(); ctx.moveTo(tx - 1, 0); ctx.quadraticCurveTo(Q[i][0], Q[i][1], E[i][0], E[i][1]); ctx.stroke(); } // the ribs, and the light along the crown
        ctx.strokeStyle = 'rgba(200,210,240,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tx - 2, -1); ctx.quadraticCurveTo(Q[1][0] + 3, Q[1][1] * .8, E[1][0] + 3, E[1][1] * .85); ctx.stroke(); }
      ctx.fillStyle = C('#B8A890'); for (const [x, y] of E) { ctx.fillRect(x - .7, y - .7, 1.4, 1.4); } // the little ferrules at the rib ends
      ctx.strokeStyle = C('#2A2A30'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(tx - 1, 0); ctx.lineTo(len + 3.5, 0); ctx.stroke();
    }
    ctx.restore();
  }
  // a white dove, sitting (about its feet, facing +x): where the bowler's hat was before its stone broke (armor_b.js); now
  // and then it shakes out its wings
  function dove(x, y, s, t, seed, startled) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const fl = startled ? 1 : Math.max(0, Math.sin(t * 1.3 + seed * 2) * 4 - 3), up = fl * (.5 + .5 * Math.sin(t * 30));
    cel(PB([-7, -2, -3, -5.6, 2, -5.4, 5, -3, 4, -.4, -2, 0]), '#F6F4EE', { d: 1, r: .5, w: 1, dark: '#B8BCC8', lite: '#FFFFFF' }); // its body
    fillPoly([-6, -3, -11, -3.6 - up * 2, -10, -1.4], '#E8E8EE', .8); // the tail
    cel(PE(4.6, -6.4, 2.6, 2.4), '#F8F6F0', { d: .6, r: .3, w: .9 }); // the head
    fillPoly([6.8, -6.8, 9, -6.2, 6.8, -5.6], '#E8A060', .6); ctx.fillStyle = C('#1A1418'); circle(5.4, -7, .6); ctx.fill(); // beak, eye
    ctx.save(); ctx.translate(-1, -4.6); ctx.rotate(-up * 1.6 - .1); fillPoly([0, 0, -7, -1.6, -5, 1.8], '#ECECF2', .8); ctx.restore(); // the wing
    ctx.restore();
  }
  function birdcageChest(x, y, w, h, t, e) {
    ctx.save(); ctx.fillStyle = C('#8ABCE8'); rrect(x, y, w, h, 2); ctx.fill();
    if (DET()) { ctx.save(); rrect(x, y, w, h, 2); ctx.clip(); const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#5E9AD8'); g.addColorStop(1, '#D8E8F4'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(255,255,255,.9)'; circle(x + w * .3, y + h * .3, 2); ctx.fill(); circle(x + w * .5, y + h * .26, 2.6); ctx.fill(); ctx.restore(); }
    dove(x + w * .5, y + h - 1.4, .6, t, (e.slot || 0) + 3, false);
    ctx.strokeStyle = C('#C8A048'); ctx.lineWidth = .7; ctx.beginPath(); for (let i = 1; i < 5; i++) { ctx.moveTo(x + w * i / 5, y); ctx.lineTo(x + w * i / 5, y + h); } ctx.moveTo(x, y + h * .5); ctx.lineTo(x + w, y + h * .5); ctx.stroke();
    rrect(x, y, w, h, 2); outline(1.1); ctx.restore();
  }
  CREATURES.w6bowler = function (e, a) {
    a = a || {}; const t = a.t || 0, ph = a.walk || 0, moving = ph ? 1 : 0, st = e.state, wind = a.wind || 0, hurt = a.hurt;
    const br = breath(e, t, 2.1), kB = actK(e, 'brolly'), kA = actK(e, 'apple'), kD = actK(e, 'drop'), open = e.w6open || 0;
    const windB = st === 'wind' && e.plan === 'w6brolly' ? wind : 0, windA = st === 'wind' && e.plan === 'w6apple' ? wind : 0, windD = st === 'wind' && e.plan === 'w6drop' ? wind : 0;
    // the umbrella flight: held up over his head (rising on it, drifting down under it, or coming down out of the sky on it)
    const golc = st === 'enter' && e.ent && e.ent.kind === 'w6golconda' && !e.ent.l, over = kD >= 0 || golc, hang = over ? cl01(open * 1.6) * cl01(e.z / 14) : 0;
    const fall = kD >= .82 ? sm((kD - .82) / .03) : golc && e.ent.t > .9 ? sm(1 - open * 2) : 0; // furled again for the last drop: the arm comes down to plant it like a cane
    if (e.w6tuck) { e.w6tuckAt = t; e.w6tuck = 0; } // landed: a twirl, and tucked under the arm
    const tk = e.w6tuckAt != null && !over && st !== 'wind' && !hurt ? (t - e.w6tuckAt) / 1.3 : 9;
    // the twirl of the wind-up: spun like a cane, the hat doffed with the other hand, then the umbrella swung up overhead
    const twirl = windD > 0 ? sm(windD / .7) : 0, upD = windD > 0 ? sm((windD - .68) / .3) : 0, doff = windD > 0 ? sm((windD - .2) / .3) * (1 - sm((windD - .78) / .2)) : 0;
    // the body's lean: back to load the thrust, forward through it, settling after; a recoil when hit
    const thrust = kB >= 0 ? (kB < .3 ? sm(kB / .3) : 1 - sm((kB - .3) / .7)) : 0, lean = -windB * .18 + thrust * .32 + (hurt ? -.28 : 0) + moving * .05 - upD * .08;
    const bob = moving ? -Math.abs(Math.sin(ph)) * 1.6 : br * .5, hipY = -27 + bob + windB * 2 + upD * 1.5;
    // hanging from the canopy he sways like a pendulum beneath his hand
    const swing = hang * (Math.sin(t * 2.3 + (e.slot || 0)) * .12 + Math.sin(t * 5.1) * .025);
    ctx.save(); ctx.translate(3, -73); ctx.rotate(swing); ctx.translate(-3, 73);
    ctx.save(); ctx.translate(0, hipY); ctx.rotate(lean * .45 + (hurt ? -.18 : 0)); ctx.translate(hurt ? -2 : 0, -hipY);
    const bare = e.bare, AR = e.elite && !bare ? (e.armA = { body: ctx.getTransform() }) : null; // (armor_b.js paints his stone in these)
    // the legs: grey trousers, black shoes; planted wide for the thrust; dangling and kicking idly when he hangs in the air
    const air = kD >= 0 || e.z > 4;
    for (const side of [1, 0]) {
      const dg = Math.sin(t * 3.1 + side * 1.9) * .2 * hang;
      let [th, sh] = air ? [Math.PI / 2 + (side ? .3 : -.12) + dg, Math.PI / 2 + (side ? .7 : .22) + dg * 1.6 - hang * .1] : gait(ph, side, .42, .8, moving);
      if (!moving && !air) { th = Math.PI / 2 + (side ? -.12 : .1) + thrust * (side ? .4 : -.3); sh = th + .05 + thrust * (side ? -.1 : .2); }
      const L = seg2(side ? 1.5 : -1.5, hipY, th, 14, sh, 14, 5.4, 4.6, side ? '#4A4A56' : '#3A3A44', { lit: '#8A8A9A' });
      shoe(L.ex - 1, L.ey + 1.4, '#121218', 1);
    }
    // the coat: dark, long, its hem swinging behind the stride and flaring out on the thrust (follow-through); in the air its tails flutter up
    const flut = hang * Math.sin(t * 13 + (e.slot || 0)) * 2.4, up = hang * (2.5 + Math.sin(t * 9.5) * 1.6);
    const lag = (e.w6hem = lerp(e.w6hem || 0, (moving ? Math.sin(ph - .8) * 3 : 0) - thrust * 5 + (hurt ? 4 : 0) - hang * 3 + flut, .2)), sy = hipY - 26 + br * .6;
    const coat = [-7.5, sy + 1, 7.5, sy + 1, 9.5, sy + 12, 10 + lag * .3, hipY + 8 - up * .4, 12 + lag, hipY + 15 - up, 2, hipY + 16.5 + Math.abs(lag) * .2 - up * .5, -10 + lag * .6, hipY + 15 - up * 1.2, -10.5 + lag * .3, hipY + 6 - up * .4, -9.5, sy + 12];
    cel(PB(coat), '#2A2C38', { d: 3.4, dark: '#16161E', lite: '#5A5E78', tex: () => {
      ctx.strokeStyle = 'rgba(10,10,16,.6)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(1.5, sy + 4); ctx.lineTo(2.5 + lag * .1, hipY + 15 - up * .5); ctx.stroke(); // the front opening
      ctx.fillStyle = 'rgba(150,160,200,.25)'; ctx.fillRect(-9, hipY - 3, 18, 1.4); // a belted line
      for (const y of [sy + 9, sy + 15, sy + 21]) { ctx.fillStyle = '#0E0E14'; circle(3.6, y, .9); ctx.fill(); } } });
    if (AR) AR.sy = sy;
    if (bare) birdcageChest(-5.5, sy + 3, 11, hipY - sy - 6, t, e); // his stone broken, his coat hangs open on a birdcage, as in the Therapeutist
    // the back arm: swinging with the walk, or raised to doff the hat
    const bA1 = lerp(Math.PI / 2 + .25 - thrust * .7 + (moving ? Math.sin(ph) * .4 : 0) + windA * -.5 - hang * .3, -1.45, doff), bA2 = lerp(Math.PI / 2 + .1 - thrust * .4 - hang * .2, -1.6, doff);
    const BA = seg2(-5, sy + 3, bA1, 11, bA2, 10, 4.6, 4, '#24262F', { lit: '#5A5E78' });
    // the collar, the red tie, the head
    ctx.fillStyle = C('#F2EEE6'); poly([-3, sy - 1, 3.4, sy - 1, 1, sy + 4]); ctx.fill(); outline(.7);
    ctx.fillStyle = C('#B02A2A'); poly([.2, sy, 1.6, sy, 1.9, sy + 6, .9, sy + 7.5, -.2, sy + 6]); ctx.fill(); outline(.6);
    const hx = 1 + thrust * 2, hy = sy - 7.5 + br * .4;
    ctx.fillStyle = C('#E2C8AA'); ctx.fillRect(hx - 2, hy + 3, 4.4, 4); // the neck
    cel(PE(hx, hy, 5.6, 6.4), '#E8CEB0', { d: 1.6, r: .6, w: 1.2, dark: '#C4A284' });
    if (DET()) { ctx.fillStyle = '#C8A688'; ell(hx - 3.4, hy + .4, 1.4, 2.2); ctx.fill(); } // an ear
    const hasApple = !(e.w6noApple > 0);
    if (!hasApple && DET()) { ctx.fillStyle = 'rgba(160,120,90,.25)'; ell(hx + 2.5, hy + .5, 2.4, 3); ctx.fill(); ctx.strokeStyle = 'rgba(120,90,70,.4)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(hx + 4.6, hy - 1); ctx.lineTo(hx + 5.4, hy + 1.5); ctx.stroke(); } // and no face at all
    // the bowler: it lags a moment behind the head and pops up off it when he is hit; lifted off and tilted in a doff; it rides up a little in the wind of the fall
    const hatK = (e.w6hat = lerp(e.w6hat || 0, hurt ? 1 : 0, hurt ? .5 : .12)), hatY0 = hy - 5.8 - hatK * 4 - (over ? open * 1.5 + hang * Math.max(0, Math.sin(t * 7)) * .8 : 0);
    const hatX = lerp(hx, BA.ex + 2.5, doff), hatY = lerp(hatY0, BA.ey - 3, doff), hatR = hatK * -.35 + thrust * .08 - doff * .55;
    ctx.save(); ctx.translate(hatX, hatY); ctx.rotate(hatR); if (AR) AR.hat = ctx.getTransform();
    if (bare) { dove(0, 1, 1, t, e.slot || 0, hurt); ctx.restore(); } else {
    cel((ox, oy, c) => { if (!c) ctx.beginPath(); ctx.moveTo(-5.4 + ox, 1 + oy); ctx.bezierCurveTo(-5.6 + ox, -6 + oy, 5.6 + ox, -6 + oy, 5.4 + ox, 1 + oy); ctx.closePath(); }, '#1A1A22', { d: 1.6, r: .8, w: 1.1, lite: '#4A4E66' });
    ctx.fillStyle = C('#121218'); ell(0, 1.2, 8.6, 1.7); ctx.fill(); outline(1);
    if (DET()) { ctx.fillStyle = '#3A2A2A'; ctx.fillRect(-5.3, -.6, 10.6, 1.4); ctx.strokeStyle = 'rgba(180,190,230,.55)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.arc(-1, -1.5, 3.4, -2.6, -1.5); ctx.stroke(); }
    ctx.restore(); }
    if (doff > .3) { ctx.fillStyle = C('#E2C8AA'); circle(BA.ex + 1, BA.ey - 1.4, 2.1); ctx.fill(); outline(.8); } // the fingers on the crown
    // the apple: hanging in the air before his face, bobbing on its own; it draws back and glows before it is thrown
    if (hasApple) { const pull = windA * 4, ax = hx + 6.2 - pull + Math.sin(t * 2.6 + 1) * .6, ay = hy + .6 + Math.sin(t * 2.3) * 1.1 + (hurt ? -2 : 0);
      if (windA > 0) glowAt(ax, ay, 10 + windA * 6, '200,255,140', .35 * windA);
      apple(ax, ay, 4.4 + windA * .6); }
    // the near arm and the umbrella: furled and tapping as he waits, cocked back to load, driven forward like a rapier;
    // twirled like a cane and swung up overhead to fly; after landing, a twirl and tucked smartly under the arm
    const UP = -Math.PI / 2 + .1, idleA = .95 + (moving ? -Math.sin(ph) * .35 : br * .03), idleU = 1.42 + Math.sin(t * 1.4) * .05;
    let armA, elbow, uA;
    if (windB > 0) { armA = lerp(.9, -2.5, sm(windB)); elbow = armA + 1.6 * sm(windB); uA = lerp(1.35, Math.PI + .25, sm(windB)); }
    else if (thrust > 0) { armA = lerp(-.15, -.05, thrust); elbow = -.05; uA = lerp(Math.PI + .25, 0, sm(kB / .25)) * (1 - thrust); }
    else if (over) { const reach = kD >= 0 && kD < .09 ? Math.sin(kD / .09 * Math.PI) * .12 : 0; // a flick up as it snaps open
      armA = lerp(-1.75 - reach, .55, fall); elbow = lerp(-1.6 - reach, .25, fall); uA = lerp(UP + swing * -.6, 1.25, fall); }
    else if (windD > 0) { armA = lerp(lerp(idleA, .45, twirl * (1 - upD)), -1.75, upD); elbow = lerp(lerp(idleA - .5, -.25, twirl * (1 - upD)), -1.6, upD); uA = lerp(idleU + twirl * TAU * 1.5, UP + TAU * 2, upD); }
    else if (tk < 1) { const sp = sm(tk / .38), tu = sm((tk - .36) / .2), back = sm((tk - .82) / .18);
      armA = lerp(lerp(.55, 1.32, tu), idleA, back); elbow = lerp(lerp(.25, .5, tu), idleA - .5, back); uA = lerp(lerp(1.25 + sp * TAU, Math.PI + .2 + TAU, tu), idleU + TAU, back); }
    else { armA = idleA; elbow = armA - .5; uA = idleU; }
    const A = seg2(4.5, sy + 3, armA, 10.5, elbow, 10, 4.8, 4.2, '#2E3040', { lit: '#5A5E78' });
    ctx.fillStyle = C('#E2C8AA'); circle(A.ex, A.ey, 2.2); ctx.fill(); outline(.8); // the gloveless hand
    ctx.save(); ctx.translate(A.ex, A.ey);
    const spinning = (windD > 0 && twirl > .02 && twirl < .98) || (tk < .38 && tk > .02);
    if (spinning && DET()) { ctx.strokeStyle = 'rgba(40,40,60,.28)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(0, 0, 26, uA - 1.1, uA - .1); ctx.stroke(); } // the blur of the twirl
    umbrella(32, over ? open : 0, uA, t * 14);
    if (thrust > .3 && DET()) { ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,240,210,${(thrust - .3) * .8})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(40, 0); ctx.stroke(); } // the streak of the thrust
    ctx.restore();
    ctx.restore();
    ctx.restore();
  };

  // ---------------- MANNEQUIN OF THE MUSES: a tailor's dummy with an egg for a head and an artist's jointed wooden limbs,
  // drafting instruments strapped to its body. It moves like a puppet: a pose held, then a jerk to the next ----------------
  // the inside of a broken mannequin, as the metaphysical painters saw it: a hollow in its chest giving on a piazza at evening,
  // a white arcade throwing long shadows, a green sky, a little train puffing along the horizon
  function chiricoWindow(ty, t) {
    const hole = PB([-5, ty - 4, -6.6, ty - 13, -4.6, ty - 20, 1, ty - 22, 5.6, ty - 19, 6.4, ty - 11, 4.6, ty - 3, 0, ty - 1.6]);
    hole(0, 0); ctx.fillStyle = C('#2A3A2E'); ctx.fill();
    if (DET()) { ctx.save(); hole(0, 0); ctx.clip();
      const g = ctx.createLinearGradient(0, ty - 22, 0, ty - 8); g.addColorStop(0, '#2E5A4A'); g.addColorStop(.7, '#C8C878'); g.addColorStop(1, '#F0D890'); ctx.fillStyle = g; ctx.fillRect(-8, ty - 23, 16, 16);
      ctx.fillStyle = '#B86A3A'; ctx.fillRect(-8, ty - 9, 16, 9); // the piazza, ochre in the last of the sun
      ctx.fillStyle = '#F0E6CC'; ctx.fillRect(-7, ty - 17, 9, 8); ctx.fillStyle = '#1E1A20'; for (let i = 0; i < 3; i++) { const ax = -6 + i * 3; ctx.beginPath(); ctx.moveTo(ax, ty - 9); ctx.lineTo(ax, ty - 13.4); ctx.arc(ax + 1, ty - 13.4, 1, Math.PI, 0); ctx.lineTo(ax + 2, ty - 9); ctx.fill(); } // the arcade
      ctx.fillStyle = 'rgba(30,20,30,.55)'; poly([2, ty - 9, -7, ty - 9, -2, ty - 2, 8, ty - 2]); ctx.fill(); // its long shadow
      const tx = 6 - ((t * 3) % 16); ctx.fillStyle = '#1E1A20'; ctx.fillRect(tx, ty - 11, 4, 1.6); ctx.fillRect(tx + .4, ty - 12.4, 1, 1.4); ctx.fillStyle = 'rgba(255,255,255,.8)'; circle(tx + .8, ty - 14 - Math.sin(t * 3) * .3, 1); ctx.fill(); // the train, and its puff
      ctx.restore(); }
    hole(0, 0); ctx.strokeStyle = C('#FFFFFF'); ctx.lineWidth = 1.6; ctx.stroke(); hole(0, 0); outline(.9); // the broken edge of the linen, and its rim
  }
  CREATURES.w6mannequin = function (e, a) {
    a = a || {}; const t = a.t || 0, phR = a.walk || 0, st = e.state, wind = a.wind || 0, hurt = a.hurt;
    const ph = Math.floor(phR * 2.2) / 2.2 + sm((phR * 2.2) % 1) / 2.2, moving = phR ? 1 : 0; // a stepped walk: it ticks from pose to pose
    const tick = Math.floor(t * 1.3 + (e.slot || 0)), twitch = hsh(tick) < .3 ? (hsh(tick + 7) - .5) * .5 : 0; // and now and then its head snaps round
    const kS = actK(e, 'square'), kC = actK(e, 'compass'), apart = st === 'w6apart';
    const windS = st === 'wind' && e.plan === 'w6square' ? wind : 0, windC = st === 'wind' && e.plan === 'w6compass' ? wind : 0;
    const thr = kS >= 0 ? (kS < .25 ? sm(kS / .25) : 1 - sm((kS - .45) / .55)) : 0;
    const WD = '#C89A64', WDL = '#F2D2A0', BALL = '#B88A58';
    if (apart) { // in pieces on the ground: an egg, a torso, limbs, rocking, trying to find each other
      const k = e.w6apartK || 0, pull = sm((k - .65) / .35);
      for (const [x, y, r, kind] of [[-16, -3, .5, 0], [14, -2, -.4, 1], [-4, -4, .2, 2], [22, -3, 1.2, 3]]) { const X = lerp(x, 0, pull), Y = lerp(y, -30, pull) + Math.sin(t * 9 + x) * .8 * (k > .5 ? 1 : 0);
        ctx.save(); ctx.translate(X, Y); ctx.rotate(r * (1 - pull) + Math.sin(t * 7 + x) * .1 * (k > .5 ? 1 : 0));
        if (kind === 0) cel(PE(0, -6, 6, 7.5), '#F2EAD8', { d: 1.6, w: 1.2 }); else if (kind === 1) cel(PB([-8, 0, -9, -12, 0, -16, 9, -12, 8, 0]), '#E0CDB0', { d: 2, w: 1.2 }); else { seg2(-8, 0, 0, 8, 0, 8, 3, 2.6, WD, { joint: BALL, jr: 2 }); }
        ctx.restore(); }
      return;
    }
    const hipY = -30 + (moving ? -Math.abs(Math.sin(ph * 1)) * 1.2 : 0) + windC * 3, lean = -windS * .22 + thr * .3 + (hurt ? -.3 : 0) - windC * .1;
    ctx.save(); ctx.translate(0, hipY); ctx.rotate(lean * .4 + (kC >= 0 ? Math.sin(kC * TAU) * .05 : 0)); ctx.translate(0, -hipY);
    const bare = e.bare, AR = e.elite && !bare ? (e.armA = { torso: ctx.getTransform() }) : null; // (armor_b.js paints its porcelain in these)
    // the legs: wooden, ball-jointed at hip, knee and ankle
    for (const side of [1, 0]) {
      let [th, sh] = gait(ph, side, .5, .7, moving);
      if (!moving) { th = Math.PI / 2 + (side ? .22 : -.16) + thr * (side ? .3 : -.25) + windC * (side ? .3 : -.3); sh = th + (side ? -.1 : .15); }
      const L = seg2(side ? 2 : -2, hipY, th, 14.5, sh, 14, 3.8, 3.2, side ? WD : shade(WD, -.15), { joint: BALL, jr: 2.3, lit: WDL });
      ctx.fillStyle = C(BALL); circle(L.ex, L.ey - .6, 1.6); ctx.fill(); outline(.7);
      ctx.fillStyle = C(shade(WD, -.1)); poly([L.ex - 2, L.ey - .2, L.ex + 5, L.ey - .6, L.ex + 5.4, L.ey + 1, L.ex - 2, L.ey + 1]); ctx.fill(); outline(.7); // a flat wooden foot
    }
    ctx.fillStyle = C(BALL); circle(0, hipY + 1, 3); ctx.fill(); outline(.8);
    // the torso: a padded dummy of cream linen on a turned wooden neck, seams and a tape measure across it
    const ty = hipY - 2, torso = [-6.5, ty, -8.5, ty - 10, -9.5, ty - 20, -6, ty - 25, 6, ty - 25, 9.5, ty - 20, 8.5, ty - 10, 6.5, ty];
    // the back arm: holds the compass (dividers) in waiting, or swings it round in a full circle
    const comp = kC >= 0 ? kC * TAU * 1.0 : windC * -.8;
    const bA = kC >= 0 ? -.2 + Math.cos(comp) * .2 : Math.PI / 2 + .3 + windC * .6 + (moving ? Math.sin(ph) * .35 : 0);
    const B = seg2(-6, ty - 21, bA, 11, bA + (kC >= 0 ? 0 : .3), 10, 3.2, 2.8, shade(WD, -.15), { joint: BALL, jr: 2, lit: WDL });
    // the compass: two long brass legs, one a point, one a pencil
    ctx.save(); ctx.translate(B.ex, B.ey); ctx.rotate(kC >= 0 ? comp * .0 + bA : bA - .2);
    const spread = kC >= 0 ? .55 : .12 + windC * .4, cl = kC >= 0 ? 46 : 26;
    for (const s of [-1, 1]) { ctx.strokeStyle = C('#4A3A20'); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(s * spread) * cl, Math.sin(s * spread) * cl); ctx.stroke(); ctx.strokeStyle = C(s > 0 ? '#E8C060' : '#C8C8D0'); ctx.lineWidth = 1.4; ctx.stroke(); }
    ctx.fillStyle = C('#E8C060'); circle(0, 0, 2.4); ctx.fill(); outline(.8);
    ctx.restore();
    cel(PB(torso), '#E6D4B6', { d: 2.6, dark: '#B8A284', lite: '#FFF6E2', tex: () => {
      ctx.strokeStyle = 'rgba(120,96,70,.6)'; ctx.lineWidth = .6; ctx.setLineDash([1.4, 1]); ctx.beginPath(); ctx.moveTo(0, ty - 25); ctx.quadraticCurveTo(2, ty - 12, 0, ty); ctx.moveTo(-8.8, ty - 18); ctx.quadraticCurveTo(0, ty - 15, 9, ty - 18); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = '#E8C040'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-9, ty - 8); ctx.lineTo(8, ty - 21); ctx.stroke(); ctx.strokeStyle = '#2A1A10'; ctx.lineWidth = .4; for (let i = 0; i < 9; i++) { const u = i / 9, x = lerp(-9, 8, u), y = lerp(ty - 8, ty - 21, u); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + .6, y + .9); ctx.stroke(); } // a tape measure, worn like a sash
      ctx.fillStyle = 'rgba(30,40,80,.75)'; ctx.font = '700 4px Georgia, serif'; ctx.fillText('7', -3.6, ty - 6); } });
    if (AR) AR.ty = ty;
    if (bare) chiricoWindow(ty, t); // its porcelain broken off, the dummy is hollow: inside, an arcade in the late sun, and a train going by
    // a set-square strapped over the chest like a breastplate
    fillPoly([3, ty - 22, 9, ty - 22, 3, ty - 13], '#7AA8C8', .8); if (DET()) { ctx.fillStyle = 'rgba(230,250,255,.5)'; poly([3.6, ty - 21.4, 7, ty - 21.4, 3.6, ty - 17]); ctx.fill(); }
    // the neck and the egg of a head, a seam drawn round it, the shadow of a face that isn't there
    ctx.fillStyle = C(WD); ctx.fillRect(-1.6, ty - 30, 3.2, 6); ctx.fillStyle = C(BALL); circle(0, ty - 30, 2.2); ctx.fill(); outline(.7);
    const hd = twitch + (windS ? -.15 : 0) + (hurt ? -.4 : 0);
    ctx.save(); ctx.translate(0, ty - 31); ctx.rotate(hd); if (AR) AR.head = ctx.getTransform();
    cel(PE(1, -8, 6.4, 8.6, .12), '#F4ECDC', { d: 2.2, r: .9, w: 1.3, dark: '#C8BCA4', lite: '#FFFFFF', tex: () => {
      ctx.strokeStyle = 'rgba(110,90,70,.55)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.ellipse(1.6, -8, 4.2, 8.4, .12, -1.2, 1.4); ctx.stroke(); // a seam over the crown
      ctx.beginPath(); ctx.moveTo(-3, -9); ctx.quadraticCurveTo(2, -7, 6.8, -9.4); ctx.stroke();
      ctx.fillStyle = 'rgba(40,50,90,.6)'; ctx.font = '700 4.5px Georgia, serif'; ctx.fillText('★', 3, -10); } }); // a star painted where the eye would be
    ctx.restore();
    // the near arm with its T-square: cocked back, driven straight out (a long, flat thrust), drawn back
    const nA = windS > 0 ? lerp(.9, Math.PI + .5, sm(windS)) : thr > 0 ? lerp(Math.PI + .5, -.05, sm(kS / .25)) : .95 + (moving ? -Math.sin(ph) * .4 : 0) + twitch * .4;
    const nB = windS > 0 ? nA + .9 : thr > 0 ? -.02 : nA - .35;
    const N = seg2(6, ty - 21, nA, 11, nB, 10.5, 3.4, 3, WD, { joint: BALL, jr: 2.1, lit: WDL });
    ctx.fillStyle = C(BALL); circle(N.ex, N.ey, 2.2); ctx.fill(); outline(.7);
    ctx.save(); ctx.translate(N.ex, N.ey); ctx.rotate(thr > 0 || windS > 0 ? nB : 1.3);
    const sq = thr > 0 ? 58 + thr * 26 : 40; // the blade of the T-square, which slides out longer on the thrust
    fillPoly([-3, -1.8, sq, -1.6, sq, 1.6, -3, 1.8], '#E8D0A0', 1); fillPoly([-5, -6, -1, -6, -1, 6, -5, 6], '#A87040', 1);
    if (DET()) { ctx.strokeStyle = 'rgba(60,40,20,.7)'; ctx.lineWidth = .5; for (let x = 2; x < sq; x += 3) { ctx.beginPath(); ctx.moveTo(x, -1.6); ctx.lineTo(x, x % 15 < 3 ? .6 : -.4); ctx.stroke(); } } // its inch marks
    if (thr > .4 && DET()) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,240,200,${(thr - .4) * .6})`; ctx.fillRect(sq * .4, -3, sq * .6, 6); }
    ctx.restore();
    ctx.restore();
  };

  // ---------------- COLLECTIVE INVENTION: a fish from the waist up and a woman's legs below, running and kicking; it
  // gasps in the dry air, gills flaring, and leaps to belly-flop on you in a burst of seawater ----------------
  CREATURES.w6fish = function (e, a) {
    a = a || {}; const t = a.t || 0, ph = a.walk || 0, moving = ph ? 1 : 0, st = e.state, wind = a.wind || 0, hurt = a.hurt;
    const kF = actK(e, 'flop'), kK = actK(e, 'kick'), windF = st === 'wind' && e.plan === 'w6flop' ? wind : 0, windK = st === 'wind' && e.plan === 'w6kick' ? wind : 0;
    const bare = e.bare, gasp = .5 + .5 * Math.sin(t * (bare ? 11 : 5) + (e.slot || 0)), air = kF >= 0 && kF < .78; // (its bowl of water broken, armor_b.js: it gasps fast and its scales start to flake)
    const kick = kK >= 0 ? (kK < .25 ? sm(kK / .25) : 1 - sm((kK - .4) / .6)) : 0;
    const crouch = windF * 6 + windK * 2, hipY = -31 + crouch + (moving ? -Math.abs(Math.sin(ph)) * 2 : 0);
    // the body's angle: upright running, laid out flat in the leap, bending back to load the kick
    const bodyA = air ? lerp(0, 1.3, sm(kF / .55)) : (kF >= .78 ? 1.3 * (1 - sm((kF - .78) / .22)) : 0) - windK * .3 + kick * -.5 + (hurt ? -.4 : 0) + windF * .25;
    ctx.save();
    // the legs: pale, long, in a dancer's run; tucked in the leap, one thrown high in the kick
    for (const side of [1, 0]) {
      let [th, sh] = gait(ph, side, .62, .95, moving);
      if (!moving) { th = Math.PI / 2 + (side ? .2 : -.15); sh = th + .1; }
      if (crouch > 0) { th = Math.PI / 2 + (side ? -.5 : -.2) - windF * .4; sh = th + 1.2 * (windF + windK * .4); }
      if (air) { th = Math.PI / 2 + .9 + (side ? .2 : 0); sh = th + 1.4; }
      if (kick > 0 && side) { th = lerp(Math.PI / 2, -.35, kick); sh = th + .1 * (1 - kick); }
      const L = seg2(side ? 2 : -2, hipY, th, 16, sh, 16, 5, 3.8, side ? '#F0D2BC' : '#D8B8A2', { lit: '#FFF2E4' });
      ctx.fillStyle = C('#B02A3A'); ell(L.ex + 1.4, L.ey + .4, 3.2, 1.6, Math.atan2(L.ey - L.ky, L.ex - L.kx) - Math.PI / 2); ctx.fill(); outline(.8); // red slippers
    }
    // the fish: a deep silver-green body with a pale belly, scales, a fin along the back, gills that flare as it gasps
    ctx.translate(0, hipY + 2); ctx.rotate(bodyA); if (e.elite && !bare) e.armA = { body: ctx.getTransform() };
    const body = PB([-7, 2, -9, -10, -6, -24, 0, -33, 6, -34, 10, -26, 10, -12, 8, 2]);
    cel(body, '#5E8C8A', { d: 3, dark: '#2E5458', lite: '#B8E0D8', tex: () => {
      const g = ctx.createLinearGradient(-8, 0, 10, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.55, 'rgba(0,0,0,0)'); g.addColorStop(.75, 'rgba(250,240,220,.75)'); g.addColorStop(1, 'rgba(250,240,220,.9)'); ctx.fillStyle = g; ctx.fillRect(-10, -36, 22, 40); // the pale belly toward us
      ctx.strokeStyle = 'rgba(20,50,50,.45)'; ctx.lineWidth = .55; for (let y = -26; y < 2; y += 3.2) for (let x = -8 + ((y / 3.2) & 1) * 1.8; x < 8; x += 3.6) { ctx.beginPath(); ctx.arc(x, y, 1.8, .2, Math.PI - .2); ctx.stroke(); } // scales
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ell(-2, -20, 1.4, 8, .1); ctx.fill();
      if (bare) { for (let i = 0; i < 7; i++) { const x = -6 + hsh(i + 2) * 12, y = -26 + hsh(i + 5) * 24; ctx.fillStyle = 'rgba(232,140,140,.85)'; ell(x, y, 1.6, 1.2, .3); ctx.fill(); } ctx.fillStyle = 'rgba(200,230,230,.3)'; ctx.fillRect(-10, -36, 22, 40); } } }); // dry: flakes of scale gone, the rest dulled
    // the dorsal fin, rippling
    ctx.fillStyle = C('#3E6A70'); ctx.beginPath(); ctx.moveTo(-8, -8); for (let i = 0; i <= 6; i++) { const u = i / 6; ctx.lineTo(-9 - Math.sin(u * Math.PI) * (6 + Math.sin(t * 9 + u * 6) * 1.2), -8 - u * 18); } ctx.lineTo(-6, -26); ctx.closePath(); ctx.fill(); outline(.9);
    // the gill and the pectoral fin, beating
    ctx.strokeStyle = C('#1E3A40'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(3, -21, 5 + gasp * (bare ? 3 : 1.4), .9, 2.6); ctx.stroke();
    if (DET()) { ctx.fillStyle = `rgba(220,90,90,${.25 + gasp * .35})`; ctx.beginPath(); ctx.arc(3, -21, 4.4 + gasp * 1.2, 1, 2.5); ctx.lineTo(3, -21); ctx.fill(); }
    ctx.save(); ctx.translate(3, -15); ctx.rotate(.6 + Math.sin(t * 12) * .35 + kick * -.6); fillPoly([0, 0, 9, -3, 11, 1, 8, 4], '#7AB0AA', .9); ctx.restore();
    // the head: a big eye that never blinks, a mouth opening and closing
    const mo = (gasp * 2.2 + (windF + windK) * 2.5) * (hurt ? 1.6 : 1);
    ctx.fillStyle = C('#2A1A1A'); ctx.beginPath(); ctx.moveTo(9.5, -29); ctx.lineTo(13 + mo * .3, -28 - mo * .2); ctx.lineTo(13 + mo * .3, -27 + mo * .8); ctx.lineTo(9.5, -26); ctx.closePath(); ctx.fill(); // the mouth
    ctx.fillStyle = C('#F6F0D0'); circle(5, -28, 3.4); ctx.fill(); outline(.9); ctx.fillStyle = C('#1A1410'); circle(5.8 + (hurt ? -.6 : 0), -28, 1.7); ctx.fill(); if (DET()) { ctx.fillStyle = '#FFFFFF'; circle(5.1, -29, .6); ctx.fill(); }
    ctx.restore();
    if (kF >= .78 && kF < 1 && DET()) { const k = (kF - .78) / .22; ctx.strokeStyle = `rgba(200,240,255,${1 - k})`; ctx.lineWidth = 2; ell(0, 0, 14 + k * 30, 4 + k * 8); ctx.stroke(); } // the splash ring
  };

  // ---------------- SOFT CLOCK: a pocket watch half melted, its lower half run into a slug's foot that ripples it along;
  // a gold chain drags behind it and ants walk round its rim. It throws its minute hand, and it winds you back ----------------
  function clockFace(cx, cy, rx, ry, droop, minA, hourA, glow, noMin) {
    const sag = (u) => Math.max(0, Math.sin(u)) * droop; // the lower half runs downward
    const path = (ox, oy, c) => { if (!c) ctx.beginPath(); for (let i = 0; i <= 28; i++) { const u = i / 28 * TAU, x = cx + Math.cos(u) * rx + ox, y = cy + Math.sin(u) * ry * (1 + sag(u) * .5) + sag(u) * 3 + oy; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); };
    cel(path, '#D8A848', { d: 2.4, r: 1, w: 1.4, dark: '#8A6424', lite: '#FFE6A0' }); // the gold case
    const inner = (ox, oy, c) => { if (!c) ctx.beginPath(); for (let i = 0; i <= 28; i++) { const u = i / 28 * TAU, x = cx + Math.cos(u) * rx * .82 + ox, y = cy + Math.sin(u) * ry * .82 * (1 + sag(u) * .55) + sag(u) * 3 + oy; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); };
    inner(0, 0); ctx.fillStyle = C('#F6EEDA'); ctx.fill();
    if (DET()) {
      ctx.save(); inner(0, 0); ctx.clip();
      const g = ctx.createLinearGradient(0, cy - ry, 0, cy + ry * 1.6); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(150,110,60,.35)'); ctx.fillStyle = g; ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 3);
      if (glow) { ctx.fillStyle = `rgba(120,170,255,${glow * .45})`; ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 3); }
      ctx.strokeStyle = '#3A2A1A'; ctx.lineCap = 'round';
      for (let i = 0; i < 12; i++) { const u = i / 12 * TAU, s = 1 + sag(u) * .55, r0 = .64, r1 = .74; ctx.lineWidth = i % 3 ? .6 : 1.1; ctx.beginPath(); ctx.moveTo(cx + Math.cos(u) * rx * r0, cy + Math.sin(u) * ry * r0 * s + sag(u) * 2.4); ctx.lineTo(cx + Math.cos(u) * rx * r1, cy + Math.sin(u) * ry * r1 * s + sag(u) * 2.6); ctx.stroke(); }
      ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(hourA) * rx * .38, cy + Math.sin(hourA) * ry * .38 * (1 + sag(hourA) * .5)); ctx.stroke();
      if (!noMin) { ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, cy); const mx = cx + Math.cos(minA) * rx * .6, my = cy + Math.sin(minA) * ry * .6 * (1 + sag(minA) * .5); ctx.quadraticCurveTo((cx + mx) / 2 + sag(minA) * 2, (cy + my) / 2 + sag(minA) * 2, mx, my); ctx.stroke(); }
      ctx.fillStyle = '#B03A2A'; circle(cx, cy, 1.1); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,240,.8)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.ellipse(cx - rx * .1, cy - ry * .1, rx * .7, ry * .7, 0, -2.6, -1.7); ctx.stroke(); // the glass, catching the light
    }
  }
  CREATURES.w6clock = function (e, a) {
    a = a || {}; const t = a.t || 0, ph = a.walk || 0, st = e.state, wind = a.wind || 0, hurt = a.hurt;
    const windH = st === 'wind' && e.plan === 'w6hands' ? wind : 0, windR = st === 'wind' && e.plan === 'w6rewind' ? wind : 0, kR = actK(e, 'rewind');
    const spin = (e.w6spin = (e.w6spin || 0) + (windH * 14 - windR * 18 - (kR >= 0 ? 20 : 0) + .6) / 60);
    const bare = e.bare, minA = -Math.PI / 2 + spin * 3, hourA = -Math.PI / 2 + spin * .25 + 1.2, droop = 1 + Math.sin(t * 1.6) * .12 + (hurt ? .5 : 0) + (bare ? .75 + Math.sin(t * 1.1) * .15 : 0); // (its hard case broken, armor_b.js: it runs right down)
    const shake = (windH + windR) * Math.sin(t * 60) * .9;
    // the slug foot: a flat run of molten gold and enamel, a ripple travelling back along it as it creeps
    const crawl = ph ? ph * .9 : t * .4, foot = [];
    for (let i = 0; i <= 16; i++) { const u = i / 16, x = lerp(-20, 15, u), bump = Math.max(0, Math.sin(u * 9 - crawl * 2.2)) * 2.4 * (ph ? 1 : .3); foot.push(x, -4.5 - bump - Math.sin(u * Math.PI) * 2.5); }
    for (let i = 16; i >= 0; i--) foot.push(lerp(-21, 16, i / 16), .6);
    cel(PB(foot), '#C89A44', { d: 1.6, r: .8, w: 1.2, dark: '#7A5420', lite: '#FFE29A', tex: () => { ctx.fillStyle = 'rgba(250,240,220,.5)'; for (let i = 0; i < 4; i++) ell(-14 + i * 8 - (crawl * 6) % 8, -3, 3, .8); ctx.fill(); } });
    // the chain trailing behind, link by link
    ctx.save(); ctx.lineWidth = 1; for (let i = 0; i < 9; i++) { const u = i / 8, x = lerp(-8, -30, u), y = lerp(-27, -1, Math.pow(u, .7)) + Math.sin(u * Math.PI) * 4; ctx.strokeStyle = C(i % 2 ? '#E8C060' : '#8A6424'); ell(x, y, 1.8, 1.1, u * 2); ctx.stroke(); } ctx.restore();
    // the face, slumped back on the foot, shuddering while it winds up
    if (bare) { cel(PE(1, -1, 19, 2.6), '#C89A44', { d: 1, r: .5, w: 1.1, dark: '#7A5420', lite: '#FFE29A' }); // a puddle of gold where it runs
      for (let i = 0; i < 3; i++) { const x = -8 + i * 8, k = (t * .5 + i * .37) % 1; ctx.fillStyle = C('#D8A848'); ell(x, -10 + k * 9, 1.2, 1.6 + k); ctx.fill(); outline(.6); } } // drips
    ctx.save(); ctx.translate(shake, bare ? 2 : 0); if (e.elite && !bare) e.armA = { face: ctx.getTransform() };
    clockFace(0, -17, 13, 11.5, droop, minA, hourA, windR + (kR >= 0 ? 1 : 0), e.w6handOut > 0);
    // the winder and its ring
    ctx.strokeStyle = C('#B88A3A'); ctx.lineWidth = 1.6; circle(0, -33, 3); ctx.stroke(); ctx.fillStyle = C('#D8A848'); rrect(-2, -31, 4, 3, 1); ctx.fill(); outline(.7);
    ctx.restore();
    // ants walking round the rim, as ants do on anything soft and golden
    if (DET()) for (let i = 0; i < 3; i++) { const u = t * (.6 + i * .2) + i * 2.1, x = Math.cos(u) * 13.5, y = -17 + Math.sin(u) * 12.5; ctx.fillStyle = '#120A08'; ell(x, y, 1.1, .7, u); ctx.fill(); ell(x + Math.cos(u + 1.6) * 1.5, y + Math.sin(u + 1.6) * 1.5, .7, .6); ctx.fill(); }
    if (windR > 0 || kR >= 0) { const k = kR >= 0 ? 1 : windR; glowAt(0, -17, 22 + k * 10, '140,180,255', .35 * k); }
  };

  // ---------------- LOBSTER TELEPHONE: a black telephone on scuttling legs, a red lobster for its receiver. It snaps with
  // its claws, and when it rings the sound rolls across the floor (and someone, somewhere, answers) ----------------
  CREATURES.w6lobster = function (e, a) {
    a = a || {}; const t = a.t || 0, ph = a.walk || 0, moving = ph ? 1 : 0, st = e.state, wind = a.wind || 0, hurt = a.hurt;
    const kP = actK(e, 'pinch'), kRg = actK(e, 'ring'), windP = st === 'wind' && e.plan === 'w6pinch' ? wind : 0, windRg = st === 'wind' && e.plan === 'w6ring' ? wind : 0;
    const ringing = kRg >= 0 || windRg > .3, jump = ringing ? Math.abs(Math.sin(t * 34)) * 4 : 0;
    const snap = kP >= 0 ? (kP < .2 ? sm(kP / .2) : 1 - sm((kP - .35) / .65)) : 0;
    // the legs: four pairs of jointed red legs under the base, scuttling
    for (let i = 0; i < 3; i++) for (const side of [-1, 1]) { const lx = -9 + i * 9, sw = moving ? Math.sin(ph * 2.4 + i * 1.7 + (side > 0 ? Math.PI : 0)) : Math.sin(t * 3 + i) * .15, out = (i - 1) * .55;
      seg2(lx, -8, -Math.PI / 2 + Math.PI + out + .5 + sw * .35 - (side > 0 ? 0 : .15), 5.5, Math.PI / 2 + out * .6 + sw * .25, 7, 1.7, 1.2, side > 0 ? '#C8402E' : '#8A2A20'); }
    // the curly cord trailing back to nothing
    ctx.strokeStyle = C('#1A1A1E'); ctx.lineWidth = 1.1; ctx.beginPath(); for (let i = 0; i <= 40; i++) { const u = i / 40, x = lerp(-15, -34, u) + Math.cos(u * 40) * 1.6, y = lerp(-10, -2, u) + Math.sin(u * 40) * 1.6 + Math.sin(u * Math.PI) * 3; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    // its brass cage broken (armor_b.js), the receiver is off the hook: the lobster has got up on the phone and stands over
    // it, bigger than it was, claws up, the cord still hanging from its tail
    const bare = e.bare, rise = bare ? 8 + Math.sin(t * 2.2) * 1.2 : 0, bs = bare ? 1.18 : 1;
    if (e.elite && !bare) e.armA = { root: ctx.getTransform() };
    // the base: black bakelite, a glossy dome, the dial
    const base = PB([-17, -6, -15, -18, -9, -23, 9, -23, 15, -18, 17, -6]);
    cel(base, '#1E1E26', { d: 2.4, r: 1.2, dark: '#0A0A0E', lite: '#5A5E78', tex: () => { ctx.fillStyle = 'rgba(200,210,255,.35)'; ell(-6, -20, 6, 1.4, -.1); ctx.fill(); } });
    const dialA = (e.w6dial = (e.w6dial || 0) + (ringing ? .3 : windRg * .1)) ;
    ctx.save(); ctx.translate(9, -13); ctx.scale(.55, 1); ctx.rotate(dialA);
    ctx.fillStyle = C('#F0EAE0'); circle(0, 0, 6); ctx.fill(); outline(1.4);
    if (DET()) { ctx.fillStyle = '#1E1E26'; for (let i = 0; i < 10; i++) { const u = i / 10 * TAU * .8 + .4; circle(Math.cos(u) * 4.2, Math.sin(u) * 4.2, .95); ctx.fill(); } ctx.fillStyle = '#C8402E'; circle(0, 0, 1.4); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = C('#0E0E12'); for (const x of [-9, 9]) { rrect(x - 2.4, -27 + jump * .2, 4.8, 5, 1.4); ctx.fill(); } // the cradle's two prongs
    // the lobster: tail fanned behind, a jointed carapace, eyes on stalks, long feelers, two great claws over the front
    if (bare) { ctx.strokeStyle = C('#1A1A1E'); ctx.lineWidth = 1.1; ctx.beginPath(); for (let i = 0; i <= 24; i++) { const u = i / 24, x = lerp(-9, -26 * bs, u) + Math.cos(u * 30) * 1.4, y = lerp(-25, -27 - rise + 3, u) + Math.sin(u * 30) * 1.4 + Math.sin(u * Math.PI) * 5; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
    ctx.save(); ctx.translate(0, -27 - jump - rise); ctx.rotate((ringing ? Math.sin(t * 34) * .06 : hurt ? -.15 : 0) - (bare ? .12 : 0)); if (bare) ctx.scale(bs, bs); if (e.elite && !bare) e.armA.lob = ctx.getTransform();
    const segs = 5; for (let i = segs - 1; i >= 0; i--) { const x = -6 - i * 3.6, w = 4.6 - i * .45, curl = i * .12 + (hurt ? .1 : 0);
      ctx.save(); ctx.translate(x, Math.sin(curl) * i * 1.4); ctx.rotate(curl); cel(PE(0, 0, 2.6, w), '#C8402E', { d: 1, r: .6, w: 1, dark: '#7A1E16', lite: '#F08A6A' }); ctx.restore(); }
    ctx.save(); ctx.translate(-25, 3); for (let k = -2; k <= 2; k++) { ctx.save(); ctx.rotate(k * .32 + Math.PI); fillPoly([0, 0, 6, -1.8, 7, 0, 6, 1.8], k % 2 ? '#B0382A' : '#D04A36', .7); ctx.restore(); } ctx.restore(); // the tail fan
    cel(PB([-6, -4, 2, -6, 10, -4, 12, 0, 8, 4, -6, 4]), '#D24A34', { d: 1.6, r: .8, w: 1.2, dark: '#8A2A1E', lite: '#FFA080', tex: () => { ctx.strokeStyle = 'rgba(90,20,14,.5)'; ctx.lineWidth = .5; for (const x of [-2, 2, 6]) { ctx.beginPath(); ctx.moveTo(x, -5); ctx.lineTo(x, 4); ctx.stroke(); } ctx.fillStyle = 'rgba(255,220,200,.35)'; for (let i = 0; i < 6; i++) { circle(-4 + i * 2.6, -2 + (i % 2), .5); ctx.fill(); } } });
    for (const s of [0, 1]) { ctx.strokeStyle = C('#8A2A1E'); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(10 + s, -3); ctx.lineTo(12 + s, -7 - s); ctx.stroke(); ctx.fillStyle = C('#1A0A08'); circle(12 + s, -7.4 - s, 1.1); ctx.fill(); } // eyes on stalks
    ctx.strokeStyle = C('#E06A4A'); ctx.lineWidth = .7; for (const s of [0, 1]) { ctx.beginPath(); ctx.moveTo(12, -2); const wv = Math.sin(t * (4 + s) + s * 2) * 4 + (ringing ? Math.sin(t * 40) * 3 : 0); ctx.bezierCurveTo(22, -10 - s * 4 + wv, 30, -2 + wv, 38 - s * 6, -14 - s * 3 + wv * 1.3); ctx.stroke(); } // the feelers
    // the claws: hanging over the front edge of the phone; they rear back to load, and shoot out snapping shut
    for (const side of [0, 1]) {
      const reach = snap * (side ? 18 : 12), back = windP * (side ? -6 : -4), open = windP > 0 ? .6 * windP : snap > 0 ? (kP < .12 ? .5 : 0) : .18 + Math.sin(t * 2.5 + side) * .1;
      const sx = 9 + side * -3, sy = 2 + side * 2, cx = 17 + reach + back, cy = 8 + side * 3 - snap * 6 - (bare ? 8 + side * 4 : 0);
      seg2(sx, sy, Math.atan2(cy - sy, cx - sx) + .4, 6, Math.atan2(cy - sy, cx - sx) - .3, 6, 2.6, 2.4, side ? '#C8402E' : '#A8322A');
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.2 - snap * .3);
      cel(PB([0, -3.4, 8, -4, 13, -1.2, 9, 1, 0, 3.4, -2, 0]), side ? '#D84E38' : '#B83E2E', { d: 1.4, r: .8, w: 1.1, dark: '#7A1E16', lite: '#FF9A7A' }); // the big pincer
      ctx.save(); ctx.translate(2, 2); ctx.rotate(open); fillPoly([0, -.6, 9, .4, 11, 3, 3, 2.4], side ? '#C8402E' : '#A8322A', 1); ctx.restore(); // the moving finger
      ctx.restore();
    }
    ctx.restore();
    if (ringing && DET()) { const k = (t * 5) % 1; ctx.save(); ctx.strokeStyle = `rgba(255,240,200,${.8 * (1 - k)})`; ctx.lineWidth = 1.2; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(0, -30, 16 + k * 10, s > 0 ? -.8 : Math.PI - .6, s > 0 ? .6 : Math.PI + .8); ctx.stroke(); } ctx.restore(); } // the bell, shaking the air
  };

  // ---------------- BIRD OF DAYLIGHT: a dove-shaped hole cut in the picture, with a clear day sky inside it, wherever it
  // flies. It stoops on you, and it drops a small raincloud over your head ----------------
  function birdPath(flap, tuck) { // the dove's outline about its middle, facing +x: flap -1 (down) .. 1 (up); tuck 0..1 folds the wings for a dive
    const w = 1 - tuck * .75, up = flap * 14 * w, tipx = -6 + tuck * -10;
    return (ox, oy, c) => { if (!c) ctx.beginPath(); const P = (x, y) => [x + ox, y + oy];
      ctx.moveTo(...P(16, -2)); ctx.quadraticCurveTo(...P(19, -2), ...P(21, 0)); // the beak
      ctx.quadraticCurveTo(...P(17, 1), ...P(14, 2)); ctx.quadraticCurveTo(...P(8, 7), ...P(-4, 6)); // the throat, the belly
      ctx.lineTo(...P(-14, 9)); ctx.lineTo(...P(-22, 13)); ctx.lineTo(...P(-21, 7)); ctx.lineTo(...P(-24, 5)); ctx.lineTo(...P(-14, 2)); // the tail fan
      ctx.quadraticCurveTo(...P(-6, 1), ...P(-2, -1)); // the back, under the far wing
      ctx.quadraticCurveTo(...P(-6 + tipx * .3, -8 - up * .4), ...P(tipx - 8, -16 - up)); // the wing, out to its tip
      ctx.quadraticCurveTo(...P(-2, -12 - up * .7), ...P(4, -6 - up * .3)); ctx.quadraticCurveTo(...P(4, -6), ...P(8, -4)); // the leading edge, back to the shoulder
      ctx.quadraticCurveTo(...P(10, -7), ...P(13, -6)); ctx.quadraticCurveTo(...P(16, -5), ...P(16, -2)); ctx.closePath(); }; // the head
  }
  CREATURES.w6skybird = function (e, a) {
    a = a || {}; const t = a.t || 0, st = e.state, wind = a.wind || 0, hurt = a.hurt, kS = actK(e, 'stoop');
    const stoop = kS >= 0 ? sm(Math.min(1, kS * 3)) * (1 - sm((kS - .8) / .2)) : 0, windS = st === 'wind' && e.plan === 'w6stoop' ? wind : 0;
    const flap = stoop > .2 ? -.2 : Math.sin(t * (windS > 0 ? 18 : 9) + (e.slot || 0)) * (1 - stoop), tuck = Math.max(stoop, windS * .4);
    ctx.save(); ctx.translate(0, -10); ctx.scale(1.3, 1.3); ctx.rotate(stoop * .5 + (hurt ? -.4 : 0) - windS * .25 + Math.sin(t * 1.1) * .04);
    const path = birdPath(flap, tuck), night = e.bare; // (its frame broken, armor_b.js: the day in it has gone to night, a moon and stars)
    if (e.elite && !night) e.armA = { root: ctx.getTransform() };
    // the sky inside: the day, with its clouds sliding past as it moves (the hole is fixed to the world, not the bird)
    path(0, 0); ctx.fillStyle = C('#5E9AD8'); ctx.fill();
    if (DET()) {
      ctx.save(); path(0, 0); ctx.clip();
      const g = ctx.createLinearGradient(0, -30, 0, 14); g.addColorStop(0, night ? '#0A1030' : '#3C7EC6'); g.addColorStop(1, night ? '#2E3E78' : '#BCD8F0'); ctx.fillStyle = g; ctx.fillRect(-30, -34, 56, 50);
      const off = ((e.x || 0) * .35 * (e.facing || 1) + t * 6) % 40;
      if (night) { for (let i = 0; i < 14; i++) { const x = ((hsh(i) * 56 - off * .5) % 56 + 56) % 56 - 28, y = -24 + hsh(i + 20) * 30, tw = .5 + .5 * Math.sin(t * 3 + i); ctx.fillStyle = `rgba(255,250,230,${.5 + tw * .5})`; circle(x, y, .5 + hsh(i + 9) * .7); ctx.fill(); }
        ctx.fillStyle = '#FFF6D8'; ctx.beginPath(); ctx.arc(2, -4, 4, -1.2, 1.9); ctx.arc(3.4, -4.6, 3.2, 1.9, -1.2, true); ctx.fill(); } else
      for (let i = -2; i < 3; i++) { const cx = -off + i * 40, cy = -4 + (i % 2) * 6; ctx.fillStyle = 'rgba(255,255,255,.95)'; circle(cx, cy, 5); ctx.fill(); circle(cx + 6, cy - 2, 6.5); ctx.fill(); circle(cx + 13, cy, 4.6); ctx.fill(); ctx.fillStyle = 'rgba(170,190,220,.6)'; ell(cx + 6, cy + 3.6, 10, 1.6); ctx.fill(); }
      if (!night) { const sg = ctx.createRadialGradient(10, -14, 0, 10, -14, 22); sg.addColorStop(0, 'rgba(255,250,220,.6)'); sg.addColorStop(1, 'rgba(255,250,220,0)'); ctx.fillStyle = sg; ctx.fillRect(-30, -34, 60, 50); } // the sun is somewhere in there
      if (hurt) { ctx.strokeStyle = '#141018'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(0, -2); ctx.lineTo(-3, 3); ctx.lineTo(4, 7); ctx.stroke(); } // torn
      ctx.restore();
    }
    // its edge: a thin paper edge of the dark world it is cut out of, then the ink
    ctx.strokeStyle = C('#F4EEE0'); ctx.lineWidth = 1.2; path(0, 0); ctx.stroke(); path(0, 0); outline(1.4);
    if (DET()) { ctx.fillStyle = '#0E1424'; circle(14.6, -3.4, 1.1); ctx.fill(); } // the eye: a pinhole of night
    ctx.restore();
    if (windS > 0) glowAt(0, -10, 26, '200,230,255', .35 * windS);
  };

  // ---------------- STILT ELEPHANT: an elephant held impossibly high on legs as thin as a heron's, an obelisk strapped to
  // its back. Its legs are where it can be reached; hurt it enough and they fold under it ----------------
  CREATURES.w6elephant = function (e, a) {
    a = a || {}; const t = a.t || 0, ph = (a.walk || 0) * .55, moving = a.walk ? 1 : 0, st = e.state, wind = a.wind || 0, hurt = a.hurt;
    const fallen = e.w6fallen || 0, kSt = actK(e, 'stomp'), kOb = actK(e, 'obelisk'), windSt = st === 'wind' && e.plan === 'w6stomp' ? wind : 0, windOb = st === 'wind' && e.plan === 'w6obelisk' ? wind : 0;
    const raise = windSt > 0 ? sm(windSt) : kSt >= 0 ? (kSt < .18 ? 1 - sm(kSt / .18) : 0) : 0, slam = kSt >= 0 && kSt >= .18 && kSt < .5 ? 1 - (kSt - .18) / .32 : 0;
    const wob = Math.sin(t * 7) * .6 * (1 - fallen) + (hurt ? Math.sin(t * 40) * 1.5 : 0);
    // its golden bands broken (armor_b.js), its legs go soft as the clocks: it sags lower on knees that bend and wobble
    const bare = e.bare, AR = e.elite && !bare ? (e.armA = { root: ctx.getTransform(), knees: [] }) : null;
    const bodyY = lerp((bare ? -86 : -112) + Math.sin(ph * 2) * 1.5 * moving + raise * -4 + slam * 3, -20, sm(fallen)), lean = raise * -.08 + slam * .1 + (hurt ? -.05 : 0) + fallen * .25;
    const leg = (hx, side, front) => { // one long, thin leg with two knees, from hip to foot
      let a1, a2, len = (-bodyY - 6) / 2 * 1.04;
      if (fallen > 0) { const f = sm(fallen); a1 = lerp(Math.PI / 2, front ? -.4 : Math.PI + .4, f); a2 = lerp(Math.PI / 2, front ? .8 : Math.PI - .8, f); len = lerp(len, 26, f); }
      else { const p = ph + side * Math.PI + (front ? 0 : Math.PI / 2), sw = Math.sin(p) * .14 * moving; a1 = Math.PI / 2 - .05 + sw; a2 = Math.PI / 2 + .07 + sw * .6 + Math.max(0, Math.cos(p)) * .12 * moving;
        if (front && side === 0) { a1 -= raise * 1.25 + slam * .15; a2 += raise * .35 - slam * .1; }
        if (bare) { const b = (.42 + Math.sin(t * 1.7 + hx * .3 + side * 2) * .12) * (front ? 1 : -1); a1 -= b; a2 += b; len /= Math.cos(b); } }
      const L = seg2(hx, bodyY + 10, a1, len, a2, len, 3.2, 2.4, side ? '#7A6A6E' : '#5A4C52', { lit: '#C8B0A8', joint: '#6A5A60', jr: 2.4 });
      if (AR) AR.knees.push([L.kx, L.ky, hx, bodyY + 10, L.ex, L.ey]);
      ctx.fillStyle = C(side ? '#6A5A60' : '#4A3E44'); ell(L.ex, L.ey - .4, 3.2, 1.6); ctx.fill(); outline(.8); // a small round elephant foot
      if (DET()) { ctx.fillStyle = '#E8D8C8'; for (let k = -1; k <= 1; k++) { circle(L.ex + 1 + k * 1.3, L.ey - .2, .5); ctx.fill(); } } // toenails
    };
    leg(-14, 0, false); leg(12, 0, true);
    ctx.save(); ctx.translate(0, bodyY); ctx.rotate(lean); ctx.translate(wob * .3, 0); if (AR) AR.body = ctx.getTransform();
    // the obelisk on its back, on a red saddle-cloth fringed with gold (gone while it is flying at you)
    if (!(e.w6obOut > 0)) { const lift = windOb * -6 + Math.sin(t * 60) * windOb * .8;
      ctx.save(); ctx.translate(0, -15 + lift); ctx.rotate(windOb * -.1);
      cel(PP([-4.4, 0, -3, -38, 0, -44, 3, -38, 4.4, 0]), '#B8A890', { d: 2, r: 1, w: 1.2, dark: '#7A6A58', lite: '#F6EAD0', tex: () => { ctx.strokeStyle = 'rgba(70,50,30,.6)'; ctx.lineWidth = .6; for (let y = -34; y < -4; y += 5) { ctx.beginPath(); ctx.moveTo(-1.6, y); ctx.lineTo(1.4, y); ctx.moveTo(0, y + 1); ctx.lineTo(0, y + 3); ctx.stroke(); } } });
      if (windOb > 0) glowAt(0, -20, 22, GOLD, .35 * windOb);
      ctx.restore(); }
    cel(PB([-16, -14, -8, -18, 8, -18, 16, -14, 18, -6, 12, -2, -12, -2, -18, -6]), '#A8302A', { d: 1.6, r: .8, w: 1.1, dark: '#6A1A16', lite: '#E8705A', tex: () => { ctx.strokeStyle = '#E8C060'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-17, -6); ctx.lineTo(17, -6); ctx.stroke(); } });
    for (let i = 0; i < 9; i++) { ctx.strokeStyle = C('#E8C060'); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(-15 + i * 3.8, -3); ctx.lineTo(-15 + i * 3.8 + Math.sin(t * 3 + i) * .6, 1.5); ctx.stroke(); } // the fringe, swaying
    // the body: grey, heavy, wrinkled
    const body = PB([-26, 2, -27, -8, -18, -16, 0, -18, 18, -15, 26, -6, 25, 6, 14, 12, -14, 12, -24, 8]);
    cel(body, '#8A7A80', { d: 3, dark: '#54474E', lite: '#D0BEB8', tex: () => { ctx.strokeStyle = 'rgba(60,46,50,.5)'; ctx.lineWidth = .6; for (let i = 0; i < 9; i++) { const x = -20 + i * 5; ctx.beginPath(); ctx.moveTo(x, 4); ctx.quadraticCurveTo(x + 1.6, 7, x, 10); ctx.stroke(); } ctx.fillStyle = 'rgba(255,230,210,.25)'; ell(-6, -12, 14, 3); ctx.fill(); } });
    // the head: a domed brow, a great ear that flaps slowly, a tusk, the trunk swinging under it like a pendulum
    const earF = Math.sin(t * 1.8) * .2 + raise * .3 + windOb * .4;
    cel(PB([18, -10, 26, -16, 34, -12, 36, -2, 32, 8, 24, 10, 20, 2]), '#8E7E84', { d: 2.4, dark: '#54474E', lite: '#D6C4BE' });
    ctx.save(); ctx.translate(23, -8); ctx.rotate(earF); cel(PB([0, -6, -12, -8, -16, 2, -10, 12, -2, 10, 2, 2]), '#7E6E74', { d: 2, dark: '#4A3E44', lite: '#C8B0A8', tex: () => { ctx.fillStyle = 'rgba(200,120,120,.3)'; ell(-7, 2, 5, 6); ctx.fill(); } }); ctx.restore();
    ctx.fillStyle = C('#1A1014'); circle(30, -6, 1.3); ctx.fill(); if (DET()) { ctx.strokeStyle = 'rgba(40,30,30,.5)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.arc(30, -6, 2.6, -2.6, -.6); ctx.stroke(); }
    const sw = (e.w6trunk = lerp(e.w6trunk || 0, Math.sin(t * 1.4) * .35 + (moving ? Math.sin(ph * 2) * .25 : 0) - raise * .6 + slam * .8 + (hurt ? .6 : 0), .15));
    const trunk = []; let tx = 33, ty = 2, ta = Math.PI / 2 - .2; for (let i = 0; i < 9; i++) { trunk.push(tx, ty); ta += sw * .14 + (i > 5 ? -.12 : 0); tx += Math.cos(ta) * 4; ty += Math.sin(ta) * 4; }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = FLASH ? '#fff' : INK; ctx.lineWidth = 7.2; lineP(trunk); ctx.stroke(); ctx.strokeStyle = C('#8A7A80'); ctx.lineWidth = 5; ctx.stroke();
    if (DET()) { ctx.strokeStyle = 'rgba(60,46,50,.6)'; ctx.lineWidth = .5; for (let i = 2; i < trunk.length - 2; i += 2) { ctx.beginPath(); ctx.moveTo(trunk[i] - 2, trunk[i + 1]); ctx.lineTo(trunk[i] + 2, trunk[i + 1] + .6); ctx.stroke(); } }
    horn(31, 3, 36, 8, 41, 4, 3, .5, '#F2E8D4', 1); // the tusk
    ctx.restore();
    leg(-10, 1, false); leg(16, 1, true);
  };

  // ---------------- a CRUTCH of the Sleeper: a great forked prop planted in the quilt, holding up part of its face ----------------
  CREATURES.w6crutch = function (e, a) {
    a = a || {}; const t = a.t || 0, top = e.w6top || [0, -120], hpK = e.hp / e.maxHp, sh = (e.flash > 0 ? Math.sin(t * 80) * 1.5 : 0) + Math.sin(t * 1.3 + (e.slot || 0)) * .6;
    const [dx, dy] = top; W6.skipHatch = true;
    ctx.save(); ctx.translate(sh * .3, 0);
    crutchShape(0, 0, dx + sh, dy, 7, 16);
    if (DET()) { // cracks open as it is battered, and splinters stick out
      ctx.strokeStyle = 'rgba(30,16,10,.85)'; ctx.lineWidth = 1; const n = Math.floor((1 - hpK) * 6);
      for (let i = 0; i < n; i++) { const u = .15 + hsh(i + (e.slot || 0)) * .45, x = dx * u, y = dy * u; ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x + 1, y - 5); ctx.lineTo(x - 1, y - 9); ctx.stroke(); ctx.strokeStyle = 'rgba(255,230,190,.8)'; ctx.beginPath(); ctx.moveTo(x + 2, y - 3); ctx.lineTo(x + 6, y - 5); ctx.stroke(); ctx.strokeStyle = 'rgba(30,16,10,.85)'; }
      ctx.fillStyle = 'rgba(40,30,60,.25)'; ell(0, 1, 12, 3); ctx.fill(); // where its foot sinks into the quilt
    }
    ctx.restore();
  };

  // ======================================================================================================
  // THE SLEEPER: a head as big as a house, soft as dough, its lower half sagging like a sack and held up off the quilt
  // on crutches. It is dreaming all of this. Its eyes are shut (one opens in the Dream of the Board; both, wide and
  // spiralling, when it wakes). Drawn about the lowest point of its jowls; o: { eyes 0..1, sag 0..1, mouth 0..1, mood
  // -1 (pained) .. 1 (pleased), look -1..1, snore 0..1, t }
  // ======================================================================================================
  const HS = .74; // (it is drawn at this fraction of its painted size)
  const SLEEP_ANCHORS = [[-86, -26], [86, -26], [-30, 2], [34, 4]].map(([x, y]) => [x * HS, y * HS]); // where the crutches hold it up (local, before its size)
  function sleeperHead(o) {
    const t = o.t || 0, sag = o.sag || 0, eyes = o.eyes || 0, mo = o.mouth || 0, mood = o.mood || 0, look = o.look || 0, br = Math.sin(t * 1.1) * (1 - eyes * .6);
    const S = (x, y) => [x, y + (y > -60 ? (y + 60) * sag * .35 : 0)]; // the sag stretches its lower half downward
    const out = [0, -154 - br * 1.5, 44, -150, 78, -134, 94, -108, 100, -80, 112, -52, 126, -26, 120, -4, 98, 8, 70, 4, 40, 12, 0, 16, -40, 12, -70, 4, -98, 8, -120, -4, -126, -26, -112, -52, -100, -80, -94, -108, -78, -134, -44, -150];
    const pts = []; for (let i = 0; i < out.length; i += 2) { const [x, y] = S(out[i], out[i + 1]); pts.push(x * (1 + br * .006), y); }
    const skin = PB(pts);
    // the skin: pale, soft, lit from the upper left; dabbed, mottled, a flush on the cheeks
    cel(skin, FLESH, { d: 7, r: 3, w: 2.2, dark: '#B88A66', lite: FLESHL, tex: () => {
      const g = ctx.createRadialGradient(-30, -110, 10, 0, -70, 150); g.addColorStop(0, 'rgba(255,248,230,.35)'); g.addColorStop(.6, 'rgba(255,240,220,0)'); g.addColorStop(1, 'rgba(120,70,60,.35)'); ctx.fillStyle = g; ctx.fillRect(-120, -170, 240, 200);
      const sh = ctx.createLinearGradient(0, -60, 0, 20); sh.addColorStop(0, 'rgba(120,70,60,0)'); sh.addColorStop(1, 'rgba(110,60,50,.42)'); ctx.fillStyle = sh; ctx.fillRect(-130, -60, 260, 80); // the weight of its lower half, in shade
      const sd = ctx.createLinearGradient(-130, 0, 130, 0); sd.addColorStop(0, 'rgba(255,244,226,.18)'); sd.addColorStop(.6, 'rgba(0,0,0,0)'); sd.addColorStop(1, 'rgba(110,60,60,.3)'); ctx.fillStyle = sd; ctx.fillRect(-130, -160, 260, 180);
      for (let i = 0; i < 60; i++) dab(-110 + hsh(i) * 220, -150 + hsh(i + 9) * 160, 2 + hsh(i + 3) * 5, hsh(i + 5) < .5 ? 'rgba(255,240,222,.22)' : 'rgba(160,100,80,.14)', 1);
      for (const s of [-1, 1]) { const [cx, cy] = S(s * 62, -50); ctx.fillStyle = `rgba(230,120,110,${.18 + (o.flush || 0) * .3})`; ell(cx, cy, 22, 14); ctx.fill(); }
      // the folds of its sagging: soft creases that deepen as it sags
      ctx.strokeStyle = `rgba(130,80,60,${.35 + sag * .35})`; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(...S(s * 18, -62)); ctx.quadraticCurveTo(...S(s * 40, -46), ...S(s * 44, -24)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(...S(s * 70, -40)); ctx.quadraticCurveTo(...S(s * 84, -24), ...S(s * 70, -8)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(...S(s * 50, -16)); ctx.quadraticCurveTo(...S(s * 30, -4), ...S(s * 10, -2)); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(255,240,224,.5)'; ctx.lineWidth = 1; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(...S(s * 20, -64)); ctx.quadraticCurveTo(...S(s * 42, -48), ...S(s * 46, -26)); ctx.stroke(); }
      for (let i = 0; i < 4; i++) { ctx.strokeStyle = 'rgba(150,100,80,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-40, -132 + i * 4); ctx.quadraticCurveTo(0, -136 + i * 4 - mood * 2, 40, -132 + i * 4); ctx.stroke(); } // the brow's wrinkles
    } });
    // a few long hairs, lifting in a breeze from nowhere
    if (DET()) { ctx.strokeStyle = 'rgba(70,50,40,.55)'; ctx.lineWidth = .8; for (let i = 0; i < 7; i++) { const x = -40 + i * 13, y = -150 + Math.abs(i - 3) * 1.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 6 + Math.sin(t * 1.3 + i) * 4, y - 10, x + 14 + Math.sin(t * 1.1 + i) * 6, y - 8 - i % 3 * 3); ctx.stroke(); } }
    // its ears
    for (const s of [-1, 1]) { const [ex, ey] = S(s * 106, -80); ctx.save(); ctx.translate(ex, ey); ctx.scale(s, 1); cel(PB([0, -14, 10, -16, 14, -2, 10, 14, 2, 16, -2, 0]), '#DDB48C', { d: 2, r: 1, w: 1.6, dark: '#A87A5A' }); if (DET()) { ctx.strokeStyle = 'rgba(120,70,50,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(5, 0, 6, -1.4, 1.4); ctx.stroke(); } ctx.restore(); }
    // its brows, and its eyes
    for (const s of [-1, 1]) {
      const ex = s * 40 + look * 3, ey = -92, open = eyes > 0 ? (s > 0 ? clamp(eyes * 2, 0, 1) : clamp(eyes * 2 - 1, 0, 1)) : 0; // the right eye opens first
      ctx.strokeStyle = C('#6A4430'); ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ex - s * 22, ey - 18 - mood * 2 + (s > 0 ? 0 : 0)); ctx.quadraticCurveTo(ex, ey - 28 - open * 6 + mood * 3, ex + s * 22, ey - 18 + mood * 3); ctx.stroke(); // the brow
      if (DET()) { ctx.fillStyle = 'rgba(150,90,70,.35)'; ell(ex, ey + 8, 20, 7); ctx.fill(); } // the bag beneath
      if (open < .05) { // shut: a heavy, drooping lid, a curve of lashes, the eye moving under it as it dreams
        ctx.fillStyle = C('#D2A47E'); ctx.beginPath(); ctx.moveTo(ex - 25, ey + 1); ctx.bezierCurveTo(ex - 18, ey - 16, ex + 18, ey - 16, ex + 25, ey + 1); ctx.quadraticCurveTo(ex, ey + 9, ex - 25, ey + 1); ctx.fill();
        if (DET()) { const rem = Math.sin(t * 4.3 + s) * 5; ctx.fillStyle = 'rgba(255,236,214,.45)'; ell(ex + rem, ey - 5, 8, 3.4); ctx.fill(); ctx.fillStyle = 'rgba(120,70,50,.3)'; ell(ex, ey + 4, 22, 3); ctx.fill(); } // the dreaming eye, moving under the lid
        ctx.strokeStyle = C('#3A2418'); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(ex - 24, ey + 1); ctx.quadraticCurveTo(ex, ey + 9, ex + 24, ey + 1); ctx.stroke();
        ctx.lineWidth = 1.3; for (let k = 0; k < 8; k++) { const u = (k + .5) / 8, x = ex - 22 + u * 44, y = ey + 1 + Math.sin(u * Math.PI) * 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + (u - .5) * 3, y + 3, x + (u - .5) * 7, y + 5); ctx.stroke(); }
      } else { // open: an almond of white, an iris that spirals, a lid lifting
        const h = 13 * open;
        ctx.save(); ctx.beginPath(); ctx.moveTo(ex - 21, ey); ctx.quadraticCurveTo(ex, ey - h * 1.6, ex + 21, ey); ctx.quadraticCurveTo(ex, ey + h * 1.1, ex - 21, ey); ctx.closePath();
        ctx.fillStyle = C('#F8F2E6'); ctx.fill(); ctx.save(); ctx.clip();
        const ix = ex + look * 7, iy = ey - 1, R = 11;
        ctx.fillStyle = C('#3A5A9A'); circle(ix, iy, R); ctx.fill();
        if (DET()) { ctx.strokeStyle = '#A8C8F0'; ctx.lineWidth = 1.4; ctx.beginPath(); for (let a = 0; a < TAU * 3; a += .2) { const r = a / (TAU * 3) * R; const px = ix + Math.cos(a - t * 3 * s) * r, py = iy + Math.sin(a - t * 3 * s) * r; a ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); } // the spiral of a dream, turning
        ctx.fillStyle = C('#0A0A14'); circle(ix, iy, 3.4 + (1 - open) * 2); ctx.fill(); if (DET()) { ctx.fillStyle = '#FFFFFF'; circle(ix - 3, iy - 4, 2.2); ctx.fill(); }
        ctx.fillStyle = 'rgba(120,80,60,.3)'; ctx.fillRect(ex - 22, ey - 20, 44, 8); ctx.restore();
        ctx.lineWidth = 2; ctx.strokeStyle = C('#3A2418'); ctx.stroke(); ctx.restore();
        ctx.strokeStyle = C('#3A2418'); ctx.lineWidth = 1.3; for (let k = 0; k < 6; k++) { const u = (k + .5) / 6, x = ex - 19 + u * 38, y = ey - Math.sin(u * Math.PI) * h * .8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (u - .5) * 6, y - 4); ctx.stroke(); } // lashes, now upward
      }
    }
    // the nose: soft, drooping, its tip propped on nothing
    const [nx, ny] = S(4, -60);
    if (DET()) { ctx.fillStyle = 'rgba(120,70,50,.28)'; ell(nx + 4, ny + 14, 22, 6); ctx.fill(); } // the shadow it casts on the lip
    ctx.fillStyle = C('#DDB08A'); ctx.beginPath(); ctx.moveTo(-6, -98); ctx.quadraticCurveTo(-12, -72, nx - 17, ny + 4); ctx.quadraticCurveTo(nx, ny + 18, nx + 19, ny + 4); ctx.quadraticCurveTo(15, -74, 8, -98); ctx.fill(); outline(1.2);
    if (DET()) { ctx.fillStyle = 'rgba(120,70,50,.55)'; ell(nx - 7, ny + 5, 4, 2.4); ctx.fill(); ell(nx + 9, ny + 5, 4, 2.4); ctx.fill(); ctx.fillStyle = 'rgba(255,240,220,.6)'; ell(nx - 2, ny - 6, 5, 3); ctx.fill(); ctx.strokeStyle = 'rgba(150,100,70,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(8, -94); ctx.quadraticCurveTo(14, -72, nx + 14, ny); ctx.stroke(); }
    // the mouth: slack in sleep, round in alarm, its lips soft and heavy
    const [mx, my] = S(0, -32), mw = 26 - mo * 6, mh = 3 + mo * 16;
    ctx.fillStyle = C('#5A1E20'); ctx.beginPath(); ctx.moveTo(mx - mw, my); ctx.quadraticCurveTo(mx, my - mh * .6 - mood * 6, mx + mw, my + mood * -2); ctx.quadraticCurveTo(mx, my + mh + 2 - mood * 4, mx - mw, my); ctx.closePath(); ctx.fill();
    if (DET() && mo > .3) { ctx.fillStyle = '#F2EAD8'; ctx.fillRect(mx - mw * .5, my - mh * .45, mw, 3); } // teeth
    ctx.strokeStyle = C('#A85A50'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(mx - mw - 2, my); ctx.quadraticCurveTo(mx, my + mh + 5 - mood * 4, mx + mw + 2, my); ctx.stroke(); // the lower lip
    ctx.strokeStyle = C('#3A1A14'); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(mx - mw, my); ctx.quadraticCurveTo(mx, my - mh * .6 - mood * 6, mx + mw, my); ctx.stroke();
    if (DET() && o.drool) { ctx.fillStyle = 'rgba(220,240,255,.7)'; ell(mx + mw * .7, my + 6 + o.drool * 8, 2, 4 + o.drool * 6); ctx.fill(); }
  }
  // its snoring: big soft Z's drifting up from the corner of its mouth (drawn on the page, not in ink)
  function snoreZs(x, y, t, a, s = 1) {
    if (a <= 0) return;
    ctx.save(); ctx.font = `700 ${Math.round(16 * s)}px Cinzel, Georgia, serif`; ctx.textAlign = 'center';
    for (let i = 0; i < 3; i++) { const life = (t * .35 + i / 3) % 1, px = x + life * 50 * s + Math.sin(t * 2 + i * 2) * 6, py = y - life * 70 * s, sz = .6 + life * .9;
      ctx.save(); ctx.translate(px, py); ctx.scale(sz, sz); ctx.rotate(Math.sin(t + i) * .2); ctx.globalAlpha = a * Math.sin(life * Math.PI);
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(30,30,70,.6)'; ctx.strokeText('Z', 0, 0); ctx.fillStyle = '#F4F0FF'; ctx.fillText('Z', 0, 0); ctx.restore(); }
    ctx.restore();
  }
  CREATURES.w6sleeper = function (e, a) {
    a = a || {}; const t = a.t || 0;
    const S = e.w6S || {}; ctx.scale(HS, HS); if (e.state === 'w6act' && e.flash <= 0) W6.skipHatch = true;
    sleeperHead({ t, sag: S.sag || 0, eyes: S.eyes || 0, mouth: S.mouth || 0, mood: (S.mood || 0) + (a.hurt ? -.6 : 0), look: S.look || 0, flush: S.flush || 0, drool: S.drool || 0 });
  };
  W6.sleeperHead = sleeperHead; W6.HS = HS; W6.snoreZs = snoreZs; W6.ANCH = SLEEP_ANCHORS;

  // the attacks, rules and passages plug into world.js and zones.js, which load after this file: data_w6.js calls this once they exist
  const late = () => {
  // ======================================================================================================
  // ATTACKS: what the dreamer's creatures do, each with a wind-up you can read and an opening after it
  // ======================================================================================================
  const HZ = {}; W6.HZ = HZ;
  const reg = (kind, o) => { HZ[kind] = o; HAZARD_FX[kind] = { update: o.update || (() => {}), draw: o.draw || (() => {}) }; };
  const inEll = (x, y, cx, cy, r) => Math.hypot(x - cx, (y - cy) * 2.2) < r;
  const yClamp = (y) => clamp(y, FLOOR_TOP + 10, FLOOR_BOT - 2);
  const xClamp = (x) => clamp(x, leftWall() + 24, rightWall() - 24);
  const hitP = (dmg, fromX, big) => { if (P.state !== 'dead') playerDamage(dmg, fromX, big); };
  const fwdHit = (e, reach, dy = 20, z = 40) => { const fwd = (P.x - e.x) * e.facing; return fwd > -12 && fwd < reach + e.hw && Math.abs(P.y - e.y) < dy && P.z < z; };
  const tellCol = (k, a = 1) => `rgba(230,70,80,${(.14 + .3 * k) * a})`, tellLine = (k) => `rgba(255,130,110,${.5 + .4 * k})`;
  // an attack that takes time: the enemy is held in the 'w6act' state while a controller hazard drives it each frame
  function act(e, name, dur, step, o = {}) {
    e.state = 'w6act'; e.w6a = name; e.w6k = 0; e.struck = false; e.walk = 0; e.vz = 0;
    const h = Object.assign({ kind: 'w6ctl', e, name, el: 0, dur, step, t: 99, max: 99, y: e.y }, o); hazards.push(h); return h;
  }
  function endAct(h) { const e = h.e; h.t = -1; e.w6k = null; if (e.w6a === h.name) e.w6a = null; }
  reg('w6ctl', {
    update(h, dt) { const e = h.e; if (h.done) { h.t = -1; return; }
      if (e.dead || e.state !== 'w6act' || e.w6a !== h.name) { endAct(h); h.done = 1; if (h.abort) h.abort(h, e); return; }
      h.el += dt; e.w6k = Math.min(1, h.el / h.dur); e.vz = 0;
      if (h.step(h, dt, e, e.w6k) || h.el >= h.dur) { endAct(h); h.done = 1; if (e.state === 'w6act') recover(e, h.rec ?? .7); } },
    draw(h, t) { if (h.draw) h.draw(h, t); },
    ups(h, list, t) { if (h.up) list.push([h.uy ?? h.e.y, () => h.up(h, t)]); },
  });
  W6.act = act;
  const puff = (x, y, z, cols, n = 10, sp = 60) => { for (let i = 0; i < n; i++) parts.push({ x: x + rand(-8, 8), y: y + rand(-3, 3), z: z + rand(0, 10), vx: rand(-sp, sp), vy: rand(-6, 6), vz: rand(10, 80), life: .6, max: .6, col: pick(cols), size: rand(3, 6), shape: 'puff', rot: 0, vr: 0 }); };
  const splash = (x, y, n = 16) => { for (let i = 0; i < n; i++) { const a = rand(0, TAU), v = rand(60, 180); parts.push({ x, y, z: 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .3, vz: rand(80, 220), life: .8, max: .8, col: pick(['#BFE6F2', '#E8F6FA', '#7AB8D0']), size: rand(1.6, 3), shape: 'blob', rot: 0, vr: 0 }); } };

  // ---------------- tells for the wind-ups of ordinary foes (the shared code only shows a boss's): the wind function is
  // wrapped so that a wind-up of one of these plans leaves a mark on the floor while it lasts ----------------
  const TELLS = {};
  const _wind = wind;
  wind = function (e, t) { _wind(e, t); if (!e.boss && TELLS[e.plan] && e.state === 'wind') { const T = TELLS[e.plan].fix ? TELLS[e.plan].fix(e) : {}; hazards.push({ kind: 'w6tell', e, plan: e.plan, T, t: e.t + .05, max: e.t + .05 }); e.w6T = T; } };
  reg('w6tell', {
    update(h) { if (h.e.dead || h.e.state !== 'wind' || h.e.plan !== h.plan) h.t = -1; },
    draw(h, t) { const k = 1 - Math.max(0, h.t) / h.max; ctx.save(); TELLS[h.plan].draw(h.e, h.T, k, t); ctx.restore(); },
  });

  // ---------------- GENTLEMAN OF GOLCONDA ----------------
  // THE UMBRELLA: drawn back like a fencer's foil, then driven straight out, a step in behind it
  PLAN_FX.w6brolly = (e) => { sfx('swing');
    act(e, 'brolly', .55, (h, dt, e, k) => {
      if (k < .25) e.x += e.facing * 150 * dt;
      if (k >= .12 && !h.hit) { h.hit = 1; if (fwdHit(e, 66, 18)) hitP(edmg(e), e.x, false); }
      return false; }, { rec: .7 });
  };
  TELLS.w6brolly = { draw(e, T, k) { const x0 = e.facing > 0 ? e.x : e.x - 70 - e.hw; ctx.fillStyle = tellCol(k, .7); rrect(x0, e.y - 7, 70 + e.hw, 14, 7); ctx.fill(); } };
  // THE APPLE: the apple in front of his face draws back, glowing, and is thrown; for a while there is no face at all
  PLAN_FX.w6apple = (e) => { sfx('shoot');
    projs.push({ owner: 'e', x: e.x + e.facing * 12, y: e.y, z: e.z + 56, vx: e.facing * 215, dmg: edmg(e), life: 3.2, col: '#7EC850', w6apple: 1, spin: 0 });
    e.w6noApple = 3; act(e, 'apple', .3, () => false, { rec: .6 });
  };
  // THE DROP: (his wind-up: the umbrella twirled like a cane, the hat doffed, the umbrella swung up overhead) he snaps it
  // open, the panels blooming out from the middle with a puff of cloud, and the open canopy catches the air and lifts him
  // into the sky, where he hangs swaying under it; a shadow follows you over the floor; then he snaps it shut and plunges
  // onto the mark, as fast as ever, and lands in a splash. The timings of the tell, the lock, the fall and the landing are as they were
  PLAN_FX.w6drop = (e) => { sfx('whoosh');
    act(e, 'drop', 2.2, (h, dt, e, k) => {
      const el = h.el;
      if (el < .2) { e.w6open = el < .16 ? 1.12 * sm(el / .16) : lerp(1.12, 1, (el - .16) / .04); e.z = el < .1 ? 0 : 30 * sm((el - .1) / .1); // the snap open, and the lift as it fills
        if (el > .1 && !h.pop) { h.pop = 1; sfx('hit-goo', .5); puff(e.x + e.facing * 2, e.y, 92, ['#F4F2EC', '#E2EAF4', '#C8D8EC'], 7, 50); } }
      else if (el < .6) { e.w6open = 1; e.z = 30 + 270 * (1 - Math.pow(1 - (el - .2) / .4, 2)); } // borne up, fast and then slowing
      else if (el < 1.8) { e.w6open = 1; e.z = 300 + Math.sin((el - .6) * 5) * 5; } // hanging up there under the canopy, swaying
      else if (el < 2.0) { const u = (el - 1.8) / .2; e.w6open = Math.max(0, 1 - u * 4); e.z = 300 * (1 - sm(u)); // snapped shut, and down he plunges
        if (!h.snap) { h.snap = 1; sfx('pick', .5); } }
      if (el >= .55 && el < 1.55) { e.x = lerp(e.x, xClamp(P.x), Math.min(1, dt * 3)); e.y = lerp(e.y, yClamp(P.y), Math.min(1, dt * 3)); h.mx = e.x; h.my = e.y; }
      if (el >= 2.0) { if (!h.land) { h.land = 1; e.z = 0; e.w6open = 0; e.w6tuck = 1; sfx('slam'); shakeMag = Math.max(shakeMag, 6); dust(e.x, e.y, 14); fx.push({ kind: 'ring', x: e.x, y: e.y, z: 2, t: .4, max: .4, r: 58, col: '#F4EAD8', flat: 1 });
        for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + rand(-.15, .15), v = rand(130, 180); parts.push({ x: e.x + Math.cos(a) * 10, y: e.y + Math.sin(a) * 4.5, z: 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .45, vz: rand(40, 120), life: .38, max: .38, col: pick(['#F4EAD8', '#E8DCC4', '#BFD4EC']), size: rand(2.2, 3.6), shape: 'blob', rot: 0, vr: 0 }); } // a splash of paint out to the edge of the mark
        if (inEll(P.x, P.y, e.x, e.y, 50) && P.z < 26) hitP(Math.round(edmg(e) * 1.2), e.x, true); } }
      return false; }, { rec: 1, abort: (h, e) => { e.z = 0; e.w6open = 0; },
      draw(h, t) { const e = h.e; if (h.el < .55 || h.el >= 2) return; const k = h.el < 1.55 ? .4 : cl01((h.el - 1.55) / .45); // the shadow he will fall on
        ctx.fillStyle = `rgba(20,14,30,${.25 + .35 * k})`; ell(e.x, e.y, 18 + k * 20, 6 + k * 8); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.6; ell(e.x, e.y, 50, 22.7); ctx.stroke(); } });
  };

  // ---------------- MANNEQUIN OF THE MUSES ----------------
  // THE T-SQUARE: a long, flat thrust down the lane, the blade sliding out longer than it looked
  PLAN_FX.w6square = (e) => { sfx('swing');
    act(e, 'square', .7, (h, dt, e, k) => { if (k >= .14 && k < .45 && !h.hit && fwdHit(e, 104, 15)) { h.hit = 1; hitP(edmg(e), e.x, false); } if (k > .12 && k < .2 && !h.s) { h.s = 1; sfx('whoosh'); } return false; }, { rec: .85 });
  };
  TELLS.w6square = { draw(e, T, k) { const x0 = e.facing > 0 ? e.x + 8 : e.x - 112 - e.hw; ctx.fillStyle = tellCol(k, .8); ctx.fillRect(x0, e.y - 5, 104 + e.hw, 10); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.strokeRect(x0, e.y - 5, 104 + e.hw, 10); ctx.setLineDash([]); } };
  // THE COMPASS: it plants a point and swings the other leg round in a full circle along the floor: jump it, or stand clear
  const CR = 74;
  PLAN_FX.w6compass = (e) => { sfx('whoosh');
    act(e, 'compass', 1.0, (h, dt, e, k) => {
      if (k > .1 && k < .9) { const sweep = (k - .1) / .8 * TAU, pa = Math.atan2((P.y - e.y) * 2.6, P.x - e.x), d = Math.hypot(P.x - e.x, (P.y - e.y) * 2.6), diff = Math.abs(((pa - sweep) % TAU + TAU * 1.5) % TAU - Math.PI);
        h.sweep = sweep; if (!h.hit && diff < .35 && d > 14 && d < CR + 8 && P.z < 16) { h.hit = 1; hitP(edmg(e), e.x, true); } }
      return false; }, { rec: .9,
      draw(h, t) { const e = h.e; if (h.sweep == null) return; ctx.save(); ctx.strokeStyle = 'rgba(255,220,150,.75)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(e.x, e.y, CR, CR / 2.6, 0, h.sweep - 1.2, h.sweep); ctx.stroke(); ctx.fillStyle = '#E8C060'; const px = e.x + Math.cos(h.sweep) * CR, py = e.y + Math.sin(h.sweep) * CR / 2.6; circle(px, py, 3); ctx.fill(); ctx.restore(); } });
  };
  TELLS.w6compass = { draw(e, T, k) { ctx.fillStyle = tellCol(k, .5); ell(e.x, e.y, CR, CR / 2.6); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 2; ell(e.x, e.y, CR, CR / 2.6); ctx.stroke(); ctx.fillStyle = 'rgba(255,240,200,.8)'; circle(e.x, e.y, 2); ctx.fill(); } };

  // ---------------- COLLECTIVE INVENTION ----------------
  // THE BELLY-FLOP: it crouches, leaps in a high arc to where you stand, and comes down flat in a burst of seawater
  PLAN_FX.w6flop = (e) => { const T = e.w6T || { x: xClamp(P.x), y: yClamp(P.y) }; sfx('jump');
    const x0 = e.x, y0 = e.y; e.facing = Math.sign(T.x - x0) || e.facing;
    act(e, 'flop', 1.05, (h, dt, e, k) => {
      const u = cl01(k / .78); if (k < .78) { e.x = lerp(x0, T.x, u); e.y = lerp(y0, T.y, u); e.z = Math.sin(u * Math.PI) * 76; }
      else if (!h.land) { h.land = 1; e.z = 0; sfx('hit-goo'); sfx('slam', .5); shakeMag = Math.max(shakeMag, 5); splash(e.x, e.y, 22); fx.push({ kind: 'ring', x: e.x, y: e.y, z: 2, t: .4, max: .4, r: 60, col: '#BFE6F2', flat: 1 });
        if (inEll(P.x, P.y, e.x, e.y, 48) && P.z < 22) hitP(edmg(e), e.x, true); }
      return false; }, { rec: 1.0, abort: (h, e) => { e.z = 0; } });
  };
  TELLS.w6flop = { fix: (e) => ({ x: xClamp(P.x), y: yClamp(P.y) }), draw(e, T, k) { ctx.fillStyle = tellCol(k, .8); ell(T.x, T.y, 46 * (.5 + .5 * k), 46 / 2.2 * (.5 + .5 * k)); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 2; ell(T.x, T.y, 46, 46 / 2.2); ctx.stroke();
    ctx.setLineDash([4, 5]); ctx.strokeStyle = tellLine(k * .6); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.quadraticCurveTo((e.x + T.x) / 2, Math.min(e.y, T.y) - 40, T.x, T.y); ctx.stroke(); ctx.setLineDash([]); } };
  // THE KICK: a high dancer's kick, a skip forward behind it
  PLAN_FX.w6kick = (e) => { sfx('swing');
    act(e, 'kick', .5, (h, dt, e, k) => { if (k < .3) e.x += e.facing * 90 * dt; if (k >= .2 && !h.hit) { h.hit = 1; if (fwdHit(e, 52, 18, 50)) hitP(edmg(e), e.x, false); } return false; }, { rec: .6 });
  };

  // ---------------- SOFT CLOCK ----------------
  // THE MINUTE HAND: it spins its hands faster and faster and throws the long one, which flies out turning and comes back
  PLAN_FX.w6hands = (e) => { sfx('hit-crystal');
    const p = { owner: 'e', x: e.x + e.facing * 10, y: e.y, z: 18, vx: e.facing * 300, dmg: Math.round(edmg(e) * .9), life: 4, col: '#2A1A10', w6hand: 1 };
    projs.push(p); e.w6handOut = 1; hazards.push({ kind: 'w6boomer', p, e, dir: e.facing, t: 4, max: 4 });
    act(e, 'hands', .35, () => false, { rec: 1.1 });
  };
  reg('w6boomer', { update(h, dt) { const p = h.p, e = h.e; p.vx -= h.dir * 420 * dt; if (p.life <= 0 || ((p.x - e.x) * h.dir < 0 && p.vx * h.dir < 0) || e.dead) { p.life = 0; e.w6handOut = 0; h.t = -1; } } });
  // WINDING BACK: its hands turn backward and a pale ghost of you stands where you were a moment ago; when the hands
  // stop, you are back there. Dodge as it strikes and it loses its hold on you
  PLAN_FX.w6rewind = (e) => {
    const T = e.w6T; if (!T || P.state === 'dead') { recover(e, .5); return; }
    act(e, 'rewind', .55, (h, dt, e, k) => false, { rec: 1.2 });
    if (P.state === 'dodge' || Math.abs(P.x - e.x) > 340) { floatText(P.x, P.y, 90, 'SLIPPED THE HOUR', '#A8C8FF', 13); return; }
    puff(P.x, P.y, 20, ['rgba(160,190,255,.7)', 'rgba(240,240,255,.6)'], 12); P.x = T.x; P.y = T.y; P.vx = 0; P.carry = 0;
    puff(P.x, P.y, 20, ['rgba(160,190,255,.7)', 'rgba(240,240,255,.6)'], 12); sfx('charge', 2); flashT = Math.max(flashT, .06); floatText(P.x, P.y, 90, 'WOUND BACK', '#A8C8FF', 14);
  };
  TELLS.w6rewind = { fix: (e) => { const H = W6.hist || [], r = H.length ? H[0] : { x: P.x, y: P.y }; return { x: r.x, y: r.y, pose: playerPose(), f: P.facing }; },
    draw(e, T, k, t) { // a ghost of him, where he will be put back; the hour-marks of a dial round it
      ctx.save(); ctx.strokeStyle = `rgba(150,190,255,${.4 + .4 * k})`; ctx.lineWidth = 1.4; ell(T.x, T.y, 26, 9); ctx.stroke();
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU - k * TAU; ctx.beginPath(); ctx.moveTo(T.x + Math.cos(a) * 22, T.y + Math.sin(a) * 7.6); ctx.lineTo(T.x + Math.cos(a) * 26, T.y + Math.sin(a) * 9); ctx.stroke(); }
      ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(T.x, T.y); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalCompositeOperation = 'lighter'; TINT = '#5A80D8'; try { drawPlayerAt(T.x, T.y, 0, T.f, Object.assign({}, T.pose), .25 + .35 * k); } finally { TINT = null; } ctx.restore(); } };

  // ---------------- LOBSTER TELEPHONE ----------------
  PLAN_FX.w6pinch = (e) => { sfx('swing');
    act(e, 'pinch', .5, (h, dt, e, k) => { if (k < .2) e.x += e.facing * 110 * dt; if (k >= .16 && !h.hit) { h.hit = 1; sfx('crunch'); if (fwdHit(e, 54, 18, 34)) hitP(edmg(e), e.x, false); } return false; }, { rec: .7 });
  };
  // THE RING: it rings, and the ringing rolls out across the floor in rings you must jump; and sometimes somebody answers
  PLAN_FX.w6ring = (e) => {
    for (let i = 0; i < 2; i++) hazards.push({ kind: 'ring', x: e.x, y: e.y, r: 10, delay: .15 + i * .45, speed: 230, dmg: Math.round(edmg(e) * .8), t: 9, max: 9 });
    let n = 0; const ring = () => { if (!e.dead && n++ < 4 && sfxOn && actx) { tone(1320, .09, 'square', .04); tone(1560, .09, 'square', .03, 0, .1); setTimeout(ring, 180); } }; ring();
    floatText(e.x, e.y, 46, 'RING RING', '#FFE6B0', 12);
    act(e, 'ring', 1.1, (h, dt, e, k) => {
      if (k > .9 && !h.call) { h.call = 1; e.w6calls = (e.w6calls || 0);
        if (e.w6calls < 2 && enemies.filter(o => !o.dead).length < 6 && Math.random() < .5) { e.w6calls++; const o = spawnEnemy('w6bowler', Math.random() < .5 ? 1 : -1); floatText(e.x, e.y, 60, 'SOMEONE ANSWERS', '#FFE6B0', 12); if (o) o.cd = 1.2; } }
      return false; }, { rec: .8 });
  };
  TELLS.w6ring = { draw(e, T, k, t) { for (let i = 0; i < 3; i++) { const r = ((t * 60 + i * 20) % 60) * (.5 + k); ctx.strokeStyle = `rgba(255,220,160,${.5 * (1 - r / 90)})`; ctx.lineWidth = 2; ell(e.x, e.y, r, r * .3); ctx.stroke(); } } };

  // ---------------- BIRD OF DAYLIGHT ----------------
  // THE STOOP: it folds its wings and drops along a line through where you stand, then climbs away
  PLAN_FX.w6stoop = (e) => { const T = e.w6T || TELLS.w6stoop.fix(e); sfx('whoosh');
    const x0 = e.x, y0 = e.y, z0 = e.z;
    act(e, 'stoop', .9, (h, dt, e, k) => {
      const u = sm(k); e.x = lerp(x0, T.x2, u); e.y = lerp(y0, T.y2, u); e.z = z0 - (z0 - 8) * Math.sin(u * Math.PI);
      if (!h.hit && Math.abs(P.x - e.x) < 22 && Math.abs(P.y - e.y) < 16 && zOverlap(P.z, 60, e.z - 10, 30)) { h.hit = 1; hitP(edmg(e), e.x, true); }
      if (Math.random() < .5) parts.push({ x: e.x, y: e.y, z: e.z, vx: 0, vy: 0, vz: 10, life: .5, max: .5, col: 'rgba(200,225,255,.6)', size: rand(3, 6), shape: 'puff', rot: 0, vr: 0 });
      return false; }, { rec: .9 });
  };
  TELLS.w6stoop = { fix: (e) => { const dx = P.x - e.x, dy = P.y - e.y, L = Math.hypot(dx, dy) || 1; return { x2: xClamp(P.x + dx / L * 120), y2: yClamp(P.y + dy / L * 30), px: P.x, py: P.y }; },
    draw(e, T, k) { ctx.strokeStyle = tellLine(k); ctx.lineWidth = 12 * (.3 + .7 * k); ctx.globalAlpha = .35; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(T.x2, T.y2); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(T.x2, T.y2); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = tellCol(k); ell(T.px, T.py, 22, 8); ctx.fill(); } };
  // THE SHOWER: a little raincloud is left over your head; it follows you, slowly, and rains on whatever is under it
  PLAN_FX.w6shower = (e) => { sfx('charge');
    hazards.push({ kind: 'w6cloud', x: e.x, y: yClamp(P.y), z: 110, tx: P.x, t: 3.6, max: 3.6, dmg: Math.max(2, Math.round(edmg(e) * .35)), tick: 0, el: 0 });
    act(e, 'shower', .35, () => false, { rec: 1.1 });
  };
  reg('w6cloud', {
    update(h, dt) { h.el += dt; const sp = h.el < .5 ? 400 : 46; h.x += clamp(P.x - h.x, -sp * dt, sp * dt); h.y += clamp(P.y - h.y, -sp * .5 * dt, sp * .5 * dt);
      h.tick -= dt; if (h.el > .8 && h.t > .3 && h.tick <= 0 && inEll(P.x, P.y, h.x, h.y, 34) && P.z < 90) { h.tick = .45; hitP(h.dmg, h.x, false); } },
    draw(h) { const a = Math.min(1, h.t / .4, h.el / .3); ctx.fillStyle = `rgba(30,40,70,${.25 * a})`; ell(h.x, h.y, 30, 9); ctx.fill(); if (h.el > .8 && h.t > .3) { ctx.strokeStyle = `rgba(160,200,240,${.5 * a})`; ctx.lineWidth = 1; ell(h.x, h.y, 34, 11); ctx.stroke(); } },
    ups(h, list, t) { list.push([h.y + .5, () => { const a = Math.min(1, h.t / .4, h.el / .3), y = h.y - h.z;
      if (h.el > .8 && h.t > .3) { ctx.save(); ctx.strokeStyle = `rgba(170,210,250,${.7 * a})`; ctx.lineWidth = 1.2; for (let i = 0; i < 12; i++) { const rx = h.x - 24 + hsh(i) * 48, k = (t * 3 + hsh(i + 4)) % 1, ry = y + 8 + k * (h.z - 8); ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 2, ry + 9); ctx.stroke(); } ctx.restore(); }
      ctx.save(); ctx.globalAlpha = a; for (const [dx, dy, r] of [[-16, 2, 10], [-4, -5, 13], [10, -2, 11], [20, 3, 8], [2, 5, 10]]) { ctx.fillStyle = C('#9AA8C8'); circle(h.x + dx, y + dy, r); ctx.fill(); outline(1); }
      for (const [dx, dy, r] of [[-6, -8, 7], [8, -6, 6]]) { ctx.fillStyle = C('#E4ECF8'); circle(h.x + dx, y + dy, r); ctx.fill(); } ctx.restore(); }]); },
    box(h, box) { box(h.x, h.y, 0, 50, h.z + 30); },
  });

  // ---------------- STILT ELEPHANT ----------------
  // THE STAMP: a foot lifted impossibly high over where you stand, and brought down; the ground rings
  PLAN_FX.w6stomp = (e) => { const T = e.w6T || { x: P.x, y: P.y };
    act(e, 'stomp', 1.0, (h, dt, e, k) => {
      if (k >= .18 && !h.hit) { h.hit = 1; sfx('slam'); shakeMag = Math.max(shakeMag, 9); dust(T.x, T.y, 14); burst(T.x, T.y, 3, ['#C8B8A8', '#8A7A80'], 10, 'rock', 0);
        if (inEll(P.x, P.y, T.x, T.y, 44) && P.z < 20) hitP(Math.round(edmg(e) * 1.1), T.x, true);
        hazards.push({ kind: 'ring', x: T.x, y: T.y, r: 14, delay: 0, speed: 210, dmg: Math.round(edmg(e) * .6), t: 1.4, max: 1.4 }); }
      return false; }, { rec: 1.1 });
  };
  TELLS.w6stomp = { fix: () => ({ x: xClamp(P.x), y: yClamp(P.y) }), draw(e, T, k) { ctx.fillStyle = tellCol(k); ell(T.x, T.y, 44 * (.4 + .6 * k), 20 * (.4 + .6 * k)); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 2; ell(T.x, T.y, 44, 20); ctx.stroke();
    ctx.fillStyle = tellLine(k); for (let i = -1; i <= 1; i++) { circle(T.x + 10 + i * 7, T.y - 4 + Math.abs(i) * 2, 2.6); ctx.fill(); } } };
  // THE OBELISK: the stone on its back is flung up out of sight; its shadow hunts you over the floor, and it comes down point first
  PLAN_FX.w6obelisk = (e) => { sfx('whoosh'); e.w6obOut = 1;
    hazards.push({ kind: 'w6ob', e, x: e.x, y: e.y, el: 0, t: 6, max: 6, dmg: Math.round(edmg(e) * 1.2) });
    act(e, 'obelisk', .6, () => false, { rec: 1.3 });
  };
  reg('w6ob', {
    update(h, dt) { h.el += dt; const e = h.e;
      if (h.el < 1.5) { h.x = lerp(h.x, xClamp(P.x), Math.min(1, dt * (h.el < .5 ? 0 : 2.6))); h.y = lerp(h.y, yClamp(P.y), Math.min(1, dt * (h.el < .5 ? 0 : 2.6))); }
      if (h.el >= 1.95 && !h.down) { h.down = 1; sfx('slam'); shakeMag = Math.max(shakeMag, 10); burst(h.x, h.y, 4, ['#E8DCC0', '#8A7A60'], 18, 'rock', 0, true); if (inEll(P.x, P.y, h.x, h.y, 36) && P.z < 30) hitP(h.dmg, h.x, true); }
      if (h.el > 3.4) { h.t = -1; if (e && !e.dead) { e.w6obOut = 0; } } },
    draw(h) { if (h.el < .5 || h.down) return; const k = cl01((h.el - .5) / 1.45); ctx.fillStyle = tellCol(k); ell(h.x, h.y, 36, 14); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = h.el > 1.5 ? 2.4 : 1.4; ell(h.x, h.y, 36, 14); ctx.stroke(); ctx.fillStyle = `rgba(20,14,20,${.2 + .4 * k})`; ell(h.x, h.y, 8 + 10 * k, 3 + 3 * k); ctx.fill(); },
    ups(h, list) { list.push([h.y, () => { let z;
      if (h.el < .5) { const e = h.e; z = 120 + h.el * 600; ctx.save(); ctx.translate(e ? e.x : h.x, (e ? e.y : h.y) - z); }
      else if (!h.down) { z = h.el < 1.65 ? 420 : 420 * (1 - sm((h.el - 1.65) / .3)); ctx.save(); ctx.translate(h.x, h.y - z); }
      else { const f = cl01((h.el - 2.6) / .8); ctx.save(); ctx.translate(h.x, h.y + 6 + f * 10); ctx.globalAlpha = 1 - f; } // stuck in the ground, then crumbling away
      if (!h.down && h.el >= .5) ctx.rotate(Math.PI);
      cel(PP([-5, 0, -3.6, -44, 0, -50, 3.6, -44, 5, 0]), '#B8A890', { d: 2, r: 1, w: 1.3, dark: '#7A6A58', lite: '#F6EAD0' });
      ctx.restore(); }]); },
    box(h, box) { box(h.x, h.y, 0, 50, 140); },
  });

  // ======================================================================================================
  // THE RULES OF THE PLACES
  // ======================================================================================================
  // (this world's upright attack effects are drawn in depth with the figures everywhere: see the hooks in dom())
  MECH_FX.w6piazza = { start() {}, update() {}, boxes() {}, list() {} };

  // ---------------- THE SHORE OF SOFT CLOCKS: the hours melt ----------------
  // Watches melt off the trees and lie in pools on the sand. A gold pool is a slow hour: whatever stands in it moves at a
  // third of its speed, its blows wind up for ever, and whatever is thrown through it crawls. A red pool is a quick hour:
  // whoever stands in it is hurried. Every so often the hours turn over, gold to red and red to gold (you are warned), and
  // now and then another watch drips down out of the sky to make a new pool. The prince of Amber walks through all of it
  // unchanged: herd them into the gold, and keep them out of the red.
  const POOL_F = W6.POOL_F = { slow: .34, fast: 1.65 };
  const newPool = (x, y, kind) => ({ x, y, rx: rand(46, 58), kind, g: 0, ph: rand(0, 6), dead: 0 });
  W6.poolAt = (x, y) => { if (!mech || mech.kind !== 'w6melt' || !mech.pools) return null; for (const p of mech.pools) if (!p.dead && p.g > .5 && Math.hypot(x - p.x, (y - p.y) * 2.8) < p.rx) return p; return null; };
  MECH_FX.w6melt = {
    start(m) {
      m.pools = []; m.turnT = 9; m.warned = false; m.dripT = 5; m.drops = [];
      for (let i = 0; i < 4; i++) { const p = newPool(400 + i * 300 + rand(-50, 50), FLOOR_TOP + 26 + ((i * 41) % 66), i % 2 ? 'fast' : 'slow'); p.g = 1; m.pools.push(p); }
      hazards.push({ kind: 'w6pools', m, t: 1e9, max: 1e9 });
    },
    update(m, dt) {
      if (stillT > 0) return;
      for (const p of m.pools) { p.g = Math.min(1, p.g + dt * 1.5); if (p.dead) p.dead += dt; }
      m.pools = m.pools.filter(p => p.dead < 1);
      const busy = waveActive || enemies.some(e => !e.dead);
      m.turnT -= dt;
      if (m.turnT < 1.4 && !m.warned) { m.warned = true; floatText(P.x, P.y, 110, 'THE HOURS TURN', '#F6D07A', 16); if (sfxOn && actx) for (let i = 0; i < 4; i++) tone(880, .05, 'square', .04, 0, i * .3); }
      if (m.turnT <= 0) { m.warned = false; m.turnT = rand(8, 10); for (const p of m.pools) p.kind = p.kind === 'slow' ? 'fast' : 'slow'; if (sfxOn && actx) { tone(660, .5, 'sine', .08, 0); tone(990, .7, 'sine', .06, 0, .12); } shakeMag = Math.max(shakeMag, 3); }
      m.dripT -= dt;
      if (m.dripT <= 0 && busy) { m.dripT = rand(6, 8); const x = clamp(P.x + rand(-160, 160), camX + 60, camX + VW - 60), y = clamp(P.y + rand(-40, 40), FLOOR_TOP + 20, FLOOR_BOT - 14); m.drops.push({ x, y, z: 300, vz: 0, kind: Math.random() < .55 ? 'slow' : 'fast', rot: rand(0, 6) }); }
      for (const d of m.drops) { d.vz -= GRAV * .5 * dt; d.z += d.vz * dt; d.rot += dt * 2;
        if (d.z <= 0 && !d.done) { d.done = 1; sfx('hit-goo'); const p = newPool(d.x, d.y, d.kind); m.pools.push(p); const live = m.pools.filter(q => !q.dead); if (live.length > 6) live[0].dead = .01; for (let i = 0; i < 10; i++) parts.push({ x: d.x, y: d.y, z: 2, vx: rand(-80, 80), vy: rand(-10, 10), vz: rand(40, 140), life: .6, max: .6, col: d.kind === 'slow' ? '#F2C860' : '#E0583A', size: rand(2, 3.4), shape: 'blob', rot: 0, vr: 0 }); } }
      m.drops = m.drops.filter(d => !d.done);
      // whatever is thrown through a slow hour crawls
      for (const pr of projs) if (pr.owner === 'e') { const p = W6.poolAt(pr.x, pr.y); if (p && p.kind === 'slow') { pr.x -= pr.vx * dt * .62; pr.life += dt * .62; } }
    },
    boxes(m, box) { for (const d of m.drops) box(d.x, d.y, 0, 40, d.z + 40); for (const e of enemies) if (e.w6pool) box(e.x, e.y, e.z, 30, e.hh + 40); },
    list(m, list, t) {
      for (const d of m.drops) list.push([d.y, () => { shadow(d.x, d.y, 10 * (1 - Math.min(.7, d.z / 300))); W6_ART.softWatch(d.x, d.y - d.z, 1.4, .4 + Math.sin(t * 6) * .2, d.rot * .2, d.kind === 'slow' ? '#D8A848' : '#C84A30'); }]);
      for (const e of enemies) if (e.w6pool && !e.dead) list.push([e.y + .02, () => onMain(() => { // a little dial turning over its head, slow or fast
        const x = e.x, y = e.y - e.z - e.hh - 14, slow = e.w6pool === 'slow', a = t * (slow ? .6 : 9);
        ctx.save(); ctx.globalAlpha = .85; ctx.fillStyle = slow ? 'rgba(255,224,140,.85)' : 'rgba(255,120,90,.85)'; circle(x, y, 6); ctx.fill(); ctx.strokeStyle = '#3A2010'; ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 4.4, y + Math.sin(a) * 4.4); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a / 12) * 3, y + Math.sin(a / 12) * 3); ctx.stroke(); ctx.restore(); })]);
    },
  };
  // the pools themselves, painted flat on the sand: molten gold with its hour-marks, or a red that will not keep still
  reg('w6pools', { draw(h, t) { const m = h.m;
    for (const p of m.pools) { const g = sm(p.g) * (p.dead ? 1 - p.dead : 1), warn = m.turnT < 1.4 ? (Math.sin(t * 18) > 0 ? 1 : 0) : 0, slow = (p.kind === 'slow') !== !!warn, rx = p.rx * g, ry = rx / 2.8;
      if (rx < 2) continue;
      ctx.save(); ctx.translate(p.x, p.y);
      ctx.fillStyle = slow ? 'rgba(120,80,20,.35)' : 'rgba(110,20,10,.35)'; ell(2, 2, rx + 3, ry + 1.5); ctx.fill();
      const gr = ctx.createRadialGradient(-rx * .3, -ry * .3, 2, 0, 0, rx); gr.addColorStop(0, slow ? 'rgba(255,236,160,.92)' : 'rgba(255,170,120,.92)'); gr.addColorStop(.6, slow ? 'rgba(232,176,72,.9)' : 'rgba(214,72,40,.9)'); gr.addColorStop(1, slow ? 'rgba(170,110,40,.85)' : 'rgba(140,30,20,.85)');
      ctx.fillStyle = gr; ctx.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU, w = 1 + Math.sin(a * 3 + p.ph) * .06 + Math.sin(a * 5 + p.ph * 2) * .04; i ? ctx.lineTo(Math.cos(a) * rx * w, Math.sin(a) * ry * w) : ctx.moveTo(Math.cos(a) * rx * w, Math.sin(a) * ry * w); } ctx.closePath(); ctx.fill();
      ctx.strokeStyle = slow ? 'rgba(90,50,10,.7)' : 'rgba(80,10,6,.7)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.strokeStyle = slow ? 'rgba(80,46,10,.65)' : 'rgba(255,230,210,.5)'; ctx.lineWidth = 1; // the hour-marks round it, and a hand going round: slowly in gold, racing in red
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * rx * .72, Math.sin(a) * ry * .72); ctx.lineTo(Math.cos(a) * rx * .86, Math.sin(a) * ry * .86); ctx.stroke(); }
      const ha = t * (slow ? .25 : 7) + p.ph; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ha) * rx * .6, Math.sin(ha) * ry * .6); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = slow ? 'rgba(255,240,190,.35)' : 'rgba(255,190,150,.4)'; ctx.lineWidth = 1; // ripples: lazy in gold, quick in red
      for (let k = 0; k < 2; k++) { const q = ((t * (slow ? .15 : 1.2) + k * .5 + p.ph) % 1); ell(0, 0, rx * q, ry * q); ctx.stroke(); }
      ctx.restore(); }
  } });

  // ======================================================================================================
  // THE SLEEPER: three dreams, and every one of them is bedtime
  //   Asleep          it cannot be hurt (blows sink into it), only its crutches can. It dreams at you, and what it dreams
  //                   is bedtime: pillows thrown down out of the sky, sheep jumping a fence to be counted (and run down
  //                   your lane), a snore that rolls out across the bed, and at last the Sandman, pouring his sand along
  //                   every row but one. Knock all its crutches away and its face comes down onto the quilt: strike it
  //                   there before it props itself up again (new crutches grow, fewer each time)
  //   the Board       the quilt becomes a chessboard. It is the king, moving a square at a time, and it plays pieces against
  //                   you: rooks along your row and file, bishops down your diagonals, a knight's three jumps, and late in
  //                   the game its queen. Stay off the squares it lights
  //   Waking          the dream is closing round you like an iris; outside it you are forgotten. It wakes the way anyone
  //                   wakes: its eyes flicker (two rows at a time), its teeth fall out, it slaps about for the snooze,
  //                   its alarm rings, and at the very last it dreams it is falling and the whole bed jolts (jump!).
  //                   Every blow on it holds the dream open a little longer; let it close and the alarm goes off
  // ======================================================================================================
  const SB = () => (typeof boss !== 'undefined' && boss && boss.def === BOSSES.sleeper ? boss : null);
  let B = W6.B = { mode: 'none' };
  const homeX = () => (lockX !== null ? lockX : stage.len - VW) + VW / 2;
  const BOARD = () => { const L = leftWall(), R = rightWall(), nc = Math.max(6, Math.round((R - L) / 78)), cw = (R - L) / nc, y0 = FLOOR_TOP + 8, rh = (FLOOR_BOT - y0) / 4;
    return { L, R, nc, nr: 4, cw, y0, rh, cx: (c) => L + (c + .5) * cw, cy: (r) => y0 + (r + .5) * rh, col: (x) => clamp(Math.floor((x - L) / cw), 0, nc - 1), row: (y) => clamp(Math.floor((y - y0) / rh), 0, 3) }; };
  W6.BOARD = BOARD;
  const SHZ = ['w6drop', 'w6sheep', 'w6snore', 'w6sand', 'w6piece', 'w6rem', 'w6slap', 'w6jolt', 'w6bell', 'ring'];
  const CRUTCH_FEET = [[-200, 40], [200, 44], [-100, 86], [110, 90]];
  function anchorAt(e, i) { const [ax, ay] = W6.ANCH[i], s = e.size || 1.15, S = e.w6S || {}, hs = W6.HS; return [e.x + ax * s, e.y - e.z + (ay + (ay + 60 * hs) * (S.sag || 0) * .35) * s]; }
  function plantCrutch(e, i, hpK, grow) {
    const [fx, fy] = CRUTCH_FEET[i], c = spawnEnemy('w6crutch', 1, false);
    c.x = clamp(e.x + fx, leftWall() + 20, rightWall() - 20); c.y = FLOOR_TOP + fy; c.z = 0; c.facing = 1; c.w6i = i; c.elite = false; c.guard = c.guardMax = 0;
    c.hp = c.maxHp = Math.round(c.def.hp * (1 + .5 * save.cycle) * worldDiff().hp * hpK); // (never armored: these are props, not fighters)
    if (!grow) { c.ent = null; c.state = 'w6crutch'; } else { c.ent = { kind: 'w6sprout', t: 0, max: 1.1 }; c.state = 'enter'; }
    const [ax, ay] = anchorAt(e, i); c.w6top = [ax - c.x, ay - c.y]; B.crutches.push(c); return c;
  }
  function initSleeper(e) {
    e.w6init = 1; e.x = homeX(); e.y = FLOOR_TOP + 16; e.z = 62; e.facing = 1; e.state = 'w6act'; e.w6a = 'sleep'; e.plan = null;
    e.w6S = { sag: 0, eyes: 0, mouth: .15, mood: 0, look: 0 };
    B = W6.B = { mode: 'asleep', t: 0, dreamT: 3.2, dreamN: 0, crutches: [], broken: 0, regrows: 0, vuln: false, boardK: 0, iris: null, castT: 2, moveT: 1, cast: 0, gx: e.x, gy: e.y, gz: 62, sheep: 0, inhale: 0, rem: 0 };
    for (let i = 0; i < 4; i++) plantCrutch(e, i, 1, false);
    banner(e.def.name, 'IT IS DREAMING ALL OF THIS · KNOCK AWAY ITS CRUTCHES', 2.6);
  }
  const puffAt = (x, y) => { for (let i = 0; i < 8; i++) parts.push({ x: x + rand(-20, 20), y, z: rand(0, 40), vx: rand(-30, 30), vy: 0, vz: rand(20, 60), life: .8, max: .8, col: 'rgba(240,236,250,.7)', size: rand(5, 9), shape: 'puff', rot: 0, vr: 0 }); };
  function toPhase(e, n) {
    phaseDrop(e); e.phase = n; e.dmg = Math.round(e.baseDmg * [1, 1.12, 1.25][n - 1]);
    for (const c of B.crutches) if (!c.dead) { c.dead = true; c.w6counted = 1; c.state = 'dying'; c.death = 'w6snap'; c.t = c.dmax = 1.2; c.vx = 0; c.deadAt = performance.now() / 1000; c.dir = Math.sign(c.x - e.x) || 1; }
    hazards = hazards.filter(h => !SHZ.includes(h.kind)); B.inhale = 0; e.w6S.flush = 0;
    for (const c of corpses) if (c.type === 'w6crutch') { c.remove2 = 1; puffAt(c.x, c.y); } corpses = corpses.filter(c => !c.remove2);
    shakeMag = 14; flashT = .2; sfx('roar'); zoom = .06;
    if (n === 2) { B.mode = 'turn'; B.t = 0; banner('The Dream of the Board', 'IT PLAYS AGAINST YOU · STAY OFF THE SQUARES IT LIGHTS', 2.8); }
    if (n === 3) { B.mode = 'wake'; B.t = 0; banner('It Is Waking', 'THE DREAM IS CLOSING · EVERY BLOW HOLDS IT OPEN', 2.8); }
  }

  // ---------------- the things of bedtime, painted ----------------
  // (each is drawn standing on its own origin, facing right)
  function pillowArt(v = 0) {
    const col = ['#F4EEE2', '#D6E2F4', '#F2D8D4'][v % 3];
    cel(PB([-26, -1, -13, 3, 0, 1, 13, 3, 26, -1, 21, -14, 25, -28, 11, -24, 0, -26, -11, -24, -25, -28, -21, -14]), col, { d: 3, r: 1.6, w: 1.5, tex: () => {
      ctx.strokeStyle = shade(col, -.16); ctx.lineWidth = 1.4; for (let x = -24; x <= 24; x += 6) { ctx.beginPath(); ctx.moveTo(x, -28); ctx.lineTo(x + 2, 4); ctx.stroke(); } // the ticking's stripes
      ctx.fillStyle = 'rgba(120,100,90,.25)'; ell(0, -12, 5, 2.4); ctx.fill(); } }); // the dimple where a head was
  }
  function feathers(x, y, n = 16) { for (let i = 0; i < n; i++) parts.push({ x: x + rand(-14, 14), y: y + rand(-4, 4), z: rand(6, 26), vx: rand(-90, 90), vy: rand(-12, 12), vz: rand(120, 300), life: 1.1, max: 1.1, col: pick(['#FFFFFF', '#F4EEE2', '#E2E6F2']), size: rand(3, 5), shape: 'tuft', rot: rand(0, 3), vr: rand(-8, 8) }); }
  function sheepArt(ph, black) {
    const wool = black ? '#3E3640' : '#F2EEE4', face = black ? '#141016' : '#2E262A';
    ctx.strokeStyle = C(face); ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    for (const [lx, o] of [[-11, 0], [-6, 1], [7, 0], [12, 1]]) { const sw = Math.sin(ph + o * Math.PI) * 4; ctx.beginPath(); ctx.moveTo(lx, -9); ctx.lineTo(lx + sw, 0); ctx.stroke(); }
    cel(PB([-18, -10, -21, -20, -13, -29, 0, -31, 12, -29, 20, -21, 18, -10, 6, -6, -6, -6]), wool, { d: 3, r: 1.5, w: 1.5, dark: black ? '#221C24' : '#C8BCAA', tex: () => {
      ctx.strokeStyle = black ? 'rgba(255,255,255,.14)' : 'rgba(150,128,108,.4)'; ctx.lineWidth = 1; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(-14 + (i % 5) * 7, -24 + Math.floor(i / 5) * 8, 3.2, Math.PI * .9, Math.PI * 2.1); ctx.stroke(); } } }); // its curls
    ctx.save(); ctx.translate(21, -22); ctx.rotate(.3);
    ctx.fillStyle = C(face); ell(-4, -4, 4, 1.8, -.7); ctx.fill(); outline(1);
    cel(PE(1, 1, 6.5, 5), face, { d: 1.4, r: 1, w: 1.3 });
    ctx.fillStyle = C(wool); circle(-3, -4, 3.6); ctx.fill(); outline(1); // a curl on its head
    ctx.strokeStyle = '#F2EEE4'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(3, 0, 1.8, .2, Math.PI - .2); ctx.stroke(); // a sleepy eye
    ctx.restore();
  }
  function fenceArt() {
    for (const x of [-15, -5, 5, 15]) fillPoly([x - 3.5, 0, x - 3.5, -30, x, -35, x + 3.5, -30, x + 3.5, 0], '#F2EEE6', 1.1);
    for (const y of [-9, -22]) { ctx.fillStyle = C('#E2D8C6'); rrect(-21, y - 2.5, 42, 5, 1.5); ctx.fill(); outline(1); }
  }
  function toothArt() {
    cel(PB([-11, -26, 0, -29, 11, -26, 13, -16, 8, -9, 6, 1, 2, -5, -2, -5, -6, 1, -8, -9, -13, -16]), '#F8F4EA', { d: 2.5, r: 1.5, w: 1.5, dark: '#C8C0AC' });
    if (DET()) { ctx.strokeStyle = 'rgba(150,140,120,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-5, -26); ctx.quadraticCurveTo(0, -22, 5, -26); ctx.stroke(); }
  }
  function handArt() { // a vast hand coming down flat, a striped pyjama sleeve behind it
    cel(PP([-30, -8, -18, -20, -58, -110, -88, -92]), '#B8C8E8', { d: 3, r: 1.5, w: 1.6, tex: () => { ctx.strokeStyle = 'rgba(70,90,150,.55)'; ctx.lineWidth = 3; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-90 + i * 12, -120); ctx.lineTo(-30 + i * 12, 0); ctx.stroke(); } } });
    ctx.fillStyle = C('#E8EEF8'); ctx.beginPath(); ctx.moveTo(-34, -4); ctx.lineTo(-20, -24); ctx.lineTo(-14, -20); ctx.lineTo(-27, 0); ctx.closePath(); ctx.fill(); outline(1.2); // the cuff
    cel(PB([-26, -1, -24, -18, -4, -23, 18, -20, 36, -12, 38, -1, 10, 3]), FLESH, { d: 2.6, r: 1.4, w: 1.7, dark: FLESHD, lite: FLESHL });
    ctx.strokeStyle = 'rgba(120,70,50,.55)'; ctx.lineWidth = 1.1; for (const x of [12, 20, 28]) { ctx.beginPath(); ctx.moveTo(x - 4, -17); ctx.lineTo(x + 2, -2); ctx.stroke(); } // fingers
    ctx.fillStyle = C(FLESH); ell(2, -21, 9, 4, -.3); ctx.fill(); outline(1.2); // thumb
  }
  function clockArt(sh) { // a bell alarm clock, jumping about as it rings
    ctx.save(); ctx.rotate(Math.sin(sh * 40) * .12 * (sh > 0 ? 1 : 0));
    ctx.strokeStyle = C('#3A2A1A'); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-9, -6); ctx.lineTo(-13, 0); ctx.moveTo(9, -6); ctx.lineTo(13, 0); ctx.stroke(); // legs
    for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 10, -33); ctx.rotate(s * .5); ctx.beginPath(); ctx.arc(0, 0, 7, Math.PI, 0); ctx.closePath(); ctx.fillStyle = C('#C8A050'); ctx.fill(); outline(1.1); ctx.restore(); } // bells
    ctx.strokeStyle = C('#3A2A1A'); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(Math.sin(sh * 60) * 6, -38); ctx.stroke(); // the hammer
    cel(PE(0, -19, 15, 15), '#B8402E', { d: 2.5, r: 1.2, w: 1.6 });
    ctx.fillStyle = C('#F6EEDC'); circle(0, -19, 11); ctx.fill(); outline(1);
    ctx.strokeStyle = C('#2A1A10'); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, -19); ctx.lineTo(0, -27); ctx.moveTo(0, -19); ctx.lineTo(6, -16); ctx.stroke();
    if (DET()) { ctx.fillStyle = '#2A1A10'; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.fillRect(Math.cos(a) * 9 - .6, -19 + Math.sin(a) * 9 - .6, 1.2, 1.2); } }
    ctx.restore();
  }
  W6.ART2 = { pillowArt, sheepArt, fenceArt, toothArt, handArt, clockArt };

  // ---------------- the dreams of its sleep ----------------
  // PILLOW FIGHT: pillows come down out of the sky onto marks round you, one after another, and burst into feathers
  // (in its Waking the same marks are its teeth, falling out: the dream everyone has)
  function dropRain(e, art, n, dmgK) {
    const spots = [[P.x, P.y]];
    for (let i = 1; i < n; i++) { let x, y, k = 0; do { x = P.x + rand(-170, 170); y = P.y + rand(-46, 46); k++; } while (k < 12 && spots.some(s => Math.hypot(s[0] - x, (s[1] - y) * 2.2) < 60)); spots.push([x, y]); }
    spots.forEach(([x, y], i) => hazards.push({ kind: 'w6drop', art, x: xClamp(x), y: yClamp(y), r: 30, t: 1.1 + i * .17, max: 1.1 + i * .17, dmg: Math.round(edmg(e) * dmgK), s: rand(-.5, .5), v: i % 3 }));
  }
  function dreamPillows(e) {
    dropRain(e, 'pillow', 4 + Math.min(3, B.broken + B.regrows), .75);
    floatText(e.x, e.y - e.z, 150, 'PILLOW FIGHT!', '#F4F0FF', 15); sfx('whoosh'); W6.mouth = 1;
  }
  reg('w6drop', {
    update(h, dt) { if (h.t <= 0 && !h.done) { h.done = 1;
        if (h.art === 'pillow') { sfx('hit-goo', .6); feathers(h.x, h.y, 16); } else { sfx('hit-crystal'); burst(h.x, h.y, 2, ['#F8F4EA', '#C8C0AC'], 6, 'crystal', 0); }
        dust(h.x, h.y, 5); shakeMag = Math.max(shakeMag, 3); if (inEll(P.x, P.y, h.x, h.y, h.r + 6) && P.z < 30) hitP(h.dmg, h.x, true); }
      if (h.t < -.35) h.t = -1; },
    draw(h) { if (h.t <= 0) return; const k = 1 - h.t / h.max; ctx.fillStyle = tellCol(k); ell(h.x, h.y, h.r * k, h.r / 2.2 * k); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.6; ell(h.x, h.y, h.r, h.r / 2.2); ctx.stroke();
      ctx.fillStyle = `rgba(20,16,30,${.15 + .4 * k})`; ell(h.x, h.y, 6 + 14 * k, 2 + 3 * k); ctx.fill(); }, // its shadow, growing as it comes
    ups(h, list) { if (h.t > .55) return; list.push([h.y, () => { const z = Math.max(0, h.t) / .55 * 320, land = h.t < 0 ? cl01(-h.t / .35) : 0;
      ctx.save(); ctx.translate(h.x, h.y - z); ctx.globalAlpha = 1 - land; if (h.t > 0) ctx.rotate(h.s * h.t * 3);
      if (h.art === 'pillow') { ctx.scale(1.25 + land * .4, 1.25 * (1 - land * .5)); pillowArt(h.v); } else { ctx.scale(1.3, 1.3); if (h.t > 0) ctx.rotate(Math.PI); if (h.t > 0) ctx.translate(0, 26); toothArt(); }
      ctx.restore(); }]); },
    box(h, box) { box(h.x, h.y, 0, 44, 340); },
  });
  // COUNTING SHEEP: a stile stands in the middle of your row; sheep trot in from the end, leap it one at a time to be
  // counted (the count runs on all fight long) and trot on down the row. Leave the row, or jump each sheep as it comes; late on there is a black one
  function dreamSheep(e) {
    const Bd = BOARD(), r0 = Bd.row(P.y), rows = [[r0, P.x < (Bd.L + Bd.R) / 2 ? -1 : 1]], esc = B.broken >= 2 || B.regrows > 0;
    if (esc) rows.push([r0 < 2 ? r0 + 2 : r0 - 2, -rows[0][1]]);
    rows.forEach(([r, dir], i) => { const x0 = dir > 0 ? Bd.L - 30 : Bd.R + 30;
      hazards.push({ kind: 'w6sheep', y: Bd.cy(r), rh: Bd.rh, dir, x0, fx: (Bd.L + Bd.R) / 2, n: 3 + Math.min(2, B.broken), gap: .5, wait: 1.35 + i * .6, sp: 290, el: 0, sh: [], black: B.broken >= 1 && i === 0, t: 30, max: 30, dmg: Math.round(edmg(e) * .7) }); });
    floatText(e.x, e.y - e.z, 150, 'COUNTING SHEEP...', '#F4F0FF', 15); sfx('charge', 1); W6.mouth = .6;
  }
  reg('w6sheep', {
    update(h, dt) { h.el += dt; const t0 = h.el - h.wait; if (t0 < 0) return; let alive = 0;
      for (let i = 0; i < h.n; i++) { const st = t0 - i * h.gap; if (st < 0) { alive++; continue; }
        const s = h.sh[i] || (h.sh[i] = { black: h.black && i === h.n - 1 }), x = h.x0 + h.dir * h.sp * st, df = (x - h.fx) * h.dir;
        s.x = x; s.ph = st * 14; s.z = Math.abs(df) < 46 ? Math.cos(df / 46 * Math.PI / 2) * 44 : Math.abs(Math.sin(st * 10)) * 5;
        if (df > -30 && !s.hop) { s.hop = 1; sfx('jump'); }
        if (df > 0 && !s.counted) { s.counted = 1; B.sheep = (B.sheep || 0) + 1; floatText(h.fx, h.y, 76, s.black ? B.sheep + '... BAA?' : String(B.sheep), s.black ? '#C8B8D8' : '#F4F0FF', s.black ? 14 : 17);
          if (sfxOn && actx) { tone(s.black ? 210 : 330, .16, 'triangle', .035); tone(s.black ? 190 : 300, .2, 'triangle', .03, 0, .13); } } // baa
        if (!s.hit && Math.abs(P.x - x) < 20 && Math.abs(P.y - h.y) < h.rh * .6 && P.z < s.z + 22) { s.hit = 1; hitP(Math.round(h.dmg * (s.black ? 1.3 : 1)), x - h.dir * 10, true); }
        if (h.dir > 0 ? x < rightWall() + 60 : x > leftWall() - 60) alive++; }
      if (!alive) h.t = -1; },
    draw(h, t) { const Bd = BOARD(), k = Math.min(1, h.el / h.wait), y = h.y - h.rh * .5;
      ctx.fillStyle = tellCol(h.el < h.wait ? k : 1, h.el < h.wait ? 1 : .45); ctx.fillRect(Bd.L, y, Bd.R - Bd.L, h.rh); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.2; ctx.strokeRect(Bd.L, y, Bd.R - Bd.L, h.rh);
      if (h.el < h.wait) for (let i = 0; i < 6; i++) { const x = h.x0 + h.dir * (70 + i * 70 + (t * 80) % 70); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - h.dir * 5, h.y - 6); ctx.lineTo(x + h.dir * 5, h.y); ctx.lineTo(x - h.dir * 5, h.y + 6); ctx.stroke(); } },
    ups(h, list, t) { const op = Math.min(1, h.el / .4); // the stile, and the flock
      list.push([h.y - 2, () => { ctx.save(); ctx.globalAlpha = op; ctx.translate(h.fx, h.y - 2); ctx.scale(1.4, 1.4); fenceArt(); ctx.restore(); }]);
      for (const s of h.sh) if (s && Math.abs(s.x - h.fx) < 900) list.push([h.y + .2, () => { shadow(s.x, h.y, 14); ctx.save(); ctx.translate(s.x, h.y - s.z); ctx.scale(h.dir * 1.35, 1.35); if (s.z > 8) ctx.rotate(-.25 * Math.sign((s.x - h.fx) * h.dir || -1)); sheepArt(s.ph, s.black); ctx.restore(); }]); },
    box(h, box) { box(camX + VW / 2, h.y, 0, VW / 2 + 40, 110); },
  });
  // THE SNORE: it draws a long breath in (its cheeks fill, its mouth shuts) and lets it out: a ring of snore rolls out across
  // the bed from under it, Z's riding on them. Jump it
  function dreamSnore(e) {
    const n = 1; B.inhale = 1.25; // (one ring of snore: jump it)
    floatText(e.x, e.y - e.z, 150, 'hhhhnnnnk...', '#F4F0FF', 15); sfx('charge', 1);
    for (let i = 0; i < n; i++) hazards.push({ kind: 'w6snore', x: e.x, y: e.y + 6, r: 26, delay: 1.25 + i * .9, speed: 225, dmg: Math.round(edmg(e) * .8), t: 12, max: 12, first: !i });
  }
  reg('w6snore', {
    update(h, dt) { if (h.delay > 0) { h.delay -= dt; return; }
      if (h.first && !h.out) { h.out = 1; sfx('roar'); shakeMag = Math.max(shakeMag, 8); W6.mouth = 1; const e = SB(); if (e) floatText(e.x, e.y - e.z, 170, 'SNNNOOORRK!', '#F4F0FF', 18); }
      h.r += h.speed * dt; const d = Math.hypot(P.x - h.x, (P.y - h.y) * 2.2);
      if (!h.hit && Math.abs(d - h.r) < 14 && P.z < 10) { h.hit = 1; hitP(h.dmg, h.x, true); }
      if (h.r > 560) h.t = -1; },
    draw(h, t) { const ry = .3;
      if (h.delay > 0) { if (!h.first) return; const k = 1 - h.delay / 1.25; ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.6; ctx.setLineDash([6, 5]); ell(h.x, h.y, 40 + k * 30, (40 + k * 30) * ry); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = tellCol(k, .6); ell(h.x, h.y, 40 + k * 30, (40 + k * 30) * ry); ctx.fill(); return; }
      const a = 1 - cl01((h.r - 420) / 140);
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = 'rgba(40,40,90,.55)'; ctx.lineWidth = 8; ell(h.x, h.y, h.r, h.r * ry); ctx.stroke(); ctx.strokeStyle = '#DCE2FF'; ctx.lineWidth = 4.5; ell(h.x, h.y, h.r, h.r * ry); ctx.stroke();
      ctx.font = '700 13px Cinzel, Georgia, serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(30,30,70,.7)'; ctx.fillStyle = '#F4F0FF';
      for (let i = 0; i < 8; i++) { const an = i / 8 * TAU + h.r * .004, x = h.x + Math.cos(an) * h.r, y = h.y + Math.sin(an) * h.r * ry - 6; ctx.strokeText('z', x, y); ctx.fillText('z', x, y); }
      ctx.restore(); },
  });
  // THE SANDMAN: he comes along the bed pouring sleep out of his sack, a falling curtain of golden sand across every row
  // but one (marked); be in that row when the sand goes by, or roll through it
  function dreamSand(e) {
    const Bd = BOARD(), dir = P.x < (Bd.L + Bd.R) / 2 ? -1 : 1, pr = Bd.row(P.y), gap = (pr + 1 + Math.floor(Math.random() * 3)) % 4;
    hazards.push({ kind: 'w6sand', dir, x: dir > 0 ? Bd.L - 10 : Bd.R + 10, gap, wait: 1.7, sp: 190, el: 0, dmg: Math.round(edmg(e) * .9), t: 30, max: 30 });
    floatText(e.x, e.y - e.z, 150, 'HERE COMES THE SANDMAN', '#FFE0A0', 15); sfx('charge', 1); W6.mouth = .5;
  }
  reg('w6sand', {
    update(h, dt) { h.el += dt; if (h.el < h.wait) return; const Bd = BOARD(); if (!h.go) { h.go = 1; sfx('whoosh'); h.x0 = h.x; }
      h.x += h.dir * h.sp * dt;
      if (!h.hit && Math.abs(P.x - h.x) < 15 && Bd.row(P.y) !== h.gap && P.z < 90) { h.hit = 1; hitP(h.dmg, h.x - h.dir * 20, true); floatText(P.x, P.y, 96, 'SO... SLEEPY...', '#FFE0A0', 13); }
      if (h.dir > 0 ? h.x > Bd.R + 30 : h.x < Bd.L - 30) { h.fade = (h.fade || 0) + dt; if (h.fade > .8) h.t = -1; } },
    draw(h, t) { const Bd = BOARD(), k = Math.min(1, h.el / h.wait), fa = 1 - cl01((h.fade || 0) / .8);
      for (let r = 0; r < 4; r++) { const y = Bd.y0 + r * Bd.rh;
        if (r === h.gap) { if (h.go && fa < 1) continue; ctx.strokeStyle = `rgba(210,232,255,${.55 + .35 * Math.sin(t * 6)})`; ctx.lineWidth = 2; ctx.setLineDash([7, 4]); ctx.strokeRect(Bd.L + 3, y + 2.5, Bd.R - Bd.L - 6, Bd.rh - 5); ctx.setLineDash([]); continue; }
        if (!h.go) { ctx.fillStyle = tellCol(k, .8); ctx.fillRect(Bd.L, y + 1, Bd.R - Bd.L, Bd.rh - 2); continue; }
        const xa = clamp(h.dir > 0 ? Bd.L : h.x, Bd.L, Bd.R), xb = clamp(h.dir > 0 ? h.x : Bd.R, Bd.L, Bd.R); // the sand it leaves drifted on the quilt; the rest still marked
        ctx.fillStyle = `rgba(226,190,116,${.4 * fa})`; ctx.fillRect(xa, y + 2, xb - xa, Bd.rh - 4);
        const ya = clamp(h.dir > 0 ? h.x : Bd.L, Bd.L, Bd.R), yb = clamp(h.dir > 0 ? Bd.R : h.x, Bd.L, Bd.R); if (yb > ya) { ctx.fillStyle = tellCol(1, .45); ctx.fillRect(ya, y + 1, yb - ya, Bd.rh - 2); } } },
    ups(h, list, t) { const Bd = BOARD(), x = h.go ? h.x : h.x + h.dir * 14, k = h.go ? 1 - cl01((h.fade || 0) / .5) : cl01((h.el - .5) / (h.wait - .5)) * .35; if (k <= 0) return;
      const back = [0, 1, 2, 3].find(r => r !== h.gap);
      for (let r = 0; r < 4; r++) { if (r === h.gap) continue; const fy = Bd.cy(r) + 4; list.push([fy, () => { // a slanting veil of sand pouring down onto this row
        ctx.save(); ctx.globalAlpha = k; const top = Bd.cy(back) - 150, tx = x - h.dir * 16;
        ctx.beginPath(); ctx.moveTo(tx - 6, top); ctx.lineTo(tx + 6, top); ctx.lineTo(x + 15, fy); ctx.lineTo(x - 15, fy); ctx.closePath();
        const g = ctx.createLinearGradient(0, top, 0, fy); g.addColorStop(0, 'rgba(232,196,120,.15)'); g.addColorStop(.4, 'rgba(232,196,120,.5)'); g.addColorStop(1, 'rgba(214,170,90,.8)'); ctx.fillStyle = g; ctx.fill();
        ctx.fillStyle = '#F6DCA0'; for (let i = 0; i < 18; i++) { const u = (t * 2.2 + hsh(i * 3 + r)) % 1, gx = lerp(tx, x, u) + (hsh(i + r * 11) - .5) * (10 + 22 * u), gy = top + u * (fy - top); ctx.fillRect(gx, gy, 2, 3); }
        ctx.fillStyle = C('#D8B070'); ell(x, fy, 18, 5); ctx.fill(); outline(.9); // the little heap it makes
        if (r === back) { ctx.save(); ctx.translate(tx, top - 22); ctx.rotate(Math.PI - h.dir * .5); // the Sandman's sack, tipped, pouring
          cel(PB([-10, 2, -13, -12, -6, -22, 6, -22, 13, -12, 10, 2]), '#8A6440', { d: 2.5, r: 1.2, w: 1.4 }); ctx.strokeStyle = C('#4A3020'); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-6, -18); ctx.lineTo(6, -18); ctx.stroke(); ctx.fillStyle = C('#E8C478'); ell(0, -22, 6, 2.2); ctx.fill(); ctx.restore(); }
        ctx.restore(); }]); } },
    box(h, box) { box(camX + VW / 2, FLOOR_BOT, 0, VW / 2 + 20, 200); },
  });
  const DREAMS = { pillows: dreamPillows, sheep: dreamSheep, snore: dreamSnore, sand: dreamSand };
  const DREAM_T = { pillows: 3.2, sheep: 4.3, snore: 3.6, sand: 5.2 };

  // ---------------- the pieces of the board ----------------
  // a piece slides (or a knight hops) along a path of squares; whoever stands on the square it is crossing is struck
  const PIECE_DRAW = {
    rook(s) { fillPoly([-11, 0, -9, -8, -7, -8, -7, -30, -10, -30, -10, -40, -6, -40, -6, -36, -2, -36, -2, -40, 2, -40, 2, -36, 6, -36, 6, -40, 10, -40, 10, -30, 7, -30, 7, -8, 9, -8, 11, 0], s, 1.2); },
    bishop(s) { fillPoly([-11, 0, -9, -7, -6, -8, -5, -24, -8, -30, -6, -38, 0, -46, 6, -38, 8, -30, 5, -24, 6, -8, 9, -7, 11, 0], s, 1.2); ctx.strokeStyle = C('#8A6A40'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-2, -40); ctx.lineTo(3, -33); ctx.stroke(); circle(0, -48, 2.2); ctx.fillStyle = C(s); ctx.fill(); outline(.8); },
    knight(s) { fillPoly([-11, 0, -9, -8, -6, -8, -8, -22, -6, -32, 0, -42, 6, -44, 12, -36, 14, -28, 8, -28, 4, -24, 7, -8, 9, -8, 11, 0], s, 1.2); ctx.fillStyle = C('#1A1014'); circle(5, -36, 1.4); ctx.fill(); },
    queen(s) { fillPoly([-12, 0, -9, -8, -6, -8, -6, -26, -11, -38, -5, -32, -3, -42, 0, -34, 3, -42, 5, -32, 11, -38, 6, -26, 6, -8, 9, -8, 12, 0], s, 1.2); ctx.fillStyle = C('#E8C060'); for (const x of [-11, -3, 3, 11]) { circle(x, x === -11 || x === 11 ? -39 : -43, 1.6); ctx.fill(); } },
  };
  function piecePath(type, Bd, c0, r0) {
    const out = [], inB = (c, r) => c >= 0 && r >= 0 && c < Bd.nc && r < Bd.nr;
    if (type === 'row') { const d = c0 < Bd.nc / 2 ? -1 : 1; for (let i = 0; i < Bd.nc; i++) out.push([d > 0 ? i : Bd.nc - 1 - i, r0]); } // it comes in from the far side
    if (type === 'col') for (let r = 0; r < Bd.nr; r++) out.push([c0, r]);
    if (type === 'diag' || type === 'anti') { const dr = type === 'diag' ? 1 : -1; let c = c0, r = r0; while (inB(c - 1, r - dr)) { c--; r -= dr; } while (inB(c, r)) { out.push([c, r]); c++; r += dr; } }
    return out;
  }
  function playPiece(e, kind) {
    const Bd = BOARD(), pc = Bd.col(P.x), pr = Bd.row(P.y), dmg = edmg(e), list = [];
    const hc = Bd.col(e.x), hr = Bd.row(e.y);
    if (kind === 'rook') list.push({ type: 'rook', path: piecePath('row', Bd, pc, pr), sp: 7 }, { type: 'rook', path: piecePath('col', Bd, pc, pr), sp: 5, delay: .35 });
    if (kind === 'bishop') list.push({ type: 'bishop', path: piecePath('diag', Bd, pc, pr), sp: 6 }, { type: 'bishop', path: piecePath('anti', Bd, pc, pr), sp: 6, delay: .3 });
    if (kind === 'queen') for (const k of ['row', 'col', 'diag', 'anti']) { const p = piecePath(k, Bd, hc, hr); list.push({ type: 'queen', path: p, sp: 7, delay: k === 'row' ? 0 : .25 }); }
    if (kind === 'knight') { // three jumps, each a knight's move from the last, the first onto your square
      const path = [[pc, pr]]; const J = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
      for (let i = 0; i < 2; i++) { const [c, r] = path[path.length - 1], ok = J.map(([a, b]) => [c + a, r + b]).filter(([a, b]) => a >= 0 && b >= 0 && a < Bd.nc && b < Bd.nr && !path.some(q => q[0] === a && q[1] === b)); if (!ok.length) break; ok.sort((a, b) => Math.abs(a[0] - pc) - Math.abs(b[0] - pc)); path.push(ok[Math.floor(Math.random() * Math.min(2, ok.length))]); }
      list.push({ type: 'knight', path, sp: 1.8, hop: 1 });
    }
    for (const p of list) if (p.path.length) hazards.push(Object.assign({ kind: 'w6piece', el: 0, wait: 1.15 + (p.delay || 0), t: 12, max: 12, dmg, hits: new Set(), white: Math.random() < .5 }, p));
    const atk = list.some(p => p.path.some(q => q[0] === pc && q[1] === pr)); if (atk) floatText(P.x, P.y, 96, 'CHECK!', '#FFE0B0', 15);
    sfx('charge', 1); W6.mouth = .5;
  }
  reg('w6piece', {
    update(h, dt) { h.el += dt; if (h.el < h.wait) return; const Bd = BOARD(), pos = (h.el - h.wait) * h.sp, i = Math.floor(pos);
      if (!h.go) { h.go = 1; sfx(h.hop ? 'jump' : 'whoosh'); }
      if (i >= h.path.length) { if (!h.endT) h.endT = h.el; if (h.el - h.endT > .35) h.t = -1; return; }
      const [c, r] = h.path[i], frac = pos - i;
      if (h.hop) { if (frac < .2 && !h.hits.has(i)) { h.hits.add(i); sfx('slam'); shakeMag = Math.max(shakeMag, 6); dust(Bd.cx(c), Bd.cy(r), 8); if (Bd.col(P.x) === c && Bd.row(P.y) === r && P.z < 30) hitP(h.dmg, Bd.cx(c), true); } }
      else if (!h.hit && Bd.col(P.x) === c && Bd.row(P.y) === r && P.z < 34) { h.hit = 1; hitP(h.dmg, Bd.cx(c), true); }
    },
    draw(h, t) { const Bd = BOARD(), k = Math.min(1, h.el / h.wait), pos = h.el < h.wait ? -1 : (h.el - h.wait) * h.sp;
      h.path.forEach(([c, r], i) => { if (pos > i + 1.2) return; const a = pos > i ? 1 - (pos - i) / 1.2 : 1, x = Bd.L + c * Bd.cw, y = Bd.y0 + r * Bd.rh;
        ctx.fillStyle = tellCol(k, a); ctx.fillRect(x + 2, y + 1.5, Bd.cw - 4, Bd.rh - 3); ctx.strokeStyle = tellLine(k); ctx.globalAlpha = a; ctx.lineWidth = 1.2; ctx.strokeRect(x + 2, y + 1.5, Bd.cw - 4, Bd.rh - 3); ctx.globalAlpha = 1;
        if (h.hop) { ctx.fillStyle = `rgba(255,230,210,${.6 + .3 * k})`; ctx.font = '700 10px Cinzel, Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText(String(i + 1), x + Bd.cw / 2, y + Bd.rh / 2 + 4); } }); },
    ups(h, list, t) { const Bd = BOARD(); if (h.el < h.wait * .5) return; const pos = h.el < h.wait ? 0 : Math.min(h.path.length - 1, (h.el - h.wait) * h.sp), i = Math.floor(pos), f = pos - i, a = h.path[i], b = h.path[Math.min(h.path.length - 1, i + 1)];
      const x = lerp(Bd.cx(a[0]), Bd.cx(b[0]), h.hop ? sm(f) : f), y = lerp(Bd.cy(a[1]), Bd.cy(b[1]), h.hop ? sm(f) : f), z = h.hop ? Math.sin(f * Math.PI) * 60 : 0;
      const al = h.el < h.wait ? (h.el / h.wait - .5) * 2 : h.endT ? 1 - (h.el - h.endT) / .35 : 1;
      list.push([y, () => { shadow(x, y, 12); ctx.save(); ctx.globalAlpha = Math.max(0, al); ctx.translate(x, y - z); ctx.scale(1.7, 1.7); PIECE_DRAW[h.type](h.white ? '#EEE6D6' : '#2A2228'); if (DET() && h.white) { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-7, -30, 2.4, 22); } ctx.restore(); }]); },
    box(h, box) { box(camX + VW / 2, FLOOR_BOT, 0, VW / 2 + 20, 160); },
  });

  // ---------------- its waking ----------------
  // REM: its eyes dart back and forth under the light, and their glance sweeps two rows at once (late on, the other two after)
  reg('w6rem', {
    update(h, dt) { h.el += dt; const Bd = BOARD();
      if (h.el >= h.wait && !h.fired) { h.fired = 1; sfx('shoot'); shakeMag = Math.max(shakeMag, 6); }
      if (h.fired && h.el < h.wait + .3 && !h.hit && Bd.row(P.y) === h.row && P.z < 60) { h.hit = 1; hitP(h.dmg, P.x - P.facing, true); }
      if (h.el > h.wait + .5) h.t = -1; },
    draw(h, t) { const Bd = BOARD(), y = Bd.y0 + h.row * Bd.rh, k = Math.min(1, h.el / h.wait);
      if (!h.fired) { ctx.fillStyle = tellCol(k, .9); ctx.fillRect(Bd.L, y + 1, Bd.R - Bd.L, Bd.rh - 2); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.4; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -t * 90; ctx.strokeRect(Bd.L + 1, y + 1.5, Bd.R - Bd.L - 2, Bd.rh - 3); ctx.setLineDash([]); ctx.lineDashOffset = 0;
        for (const ex of [Bd.L + 18, Bd.R - 18]) { const cy = y + Bd.rh / 2; ctx.fillStyle = '#F8F2E6'; ell(ex, cy, 10, 5); ctx.fill(); ctx.strokeStyle = '#3A2418'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = '#3A5A9A'; circle(ex + Math.sin(t * 26 + h.row) * 5, cy, 3.4); ctx.fill(); } } // the darting eye at each end
      else { const f = 1 - cl01((h.el - h.wait) / .5); ctx.fillStyle = `rgba(206,196,250,${.75 * f})`; ctx.fillRect(Bd.L, y, Bd.R - Bd.L, Bd.rh);
        ctx.fillStyle = `rgba(255,255,255,${.7 * f})`; for (let i = 0; i < 7; i++) ctx.fillRect(Bd.L + ((i * 97 + (h.el - h.wait) * 1400) % (Bd.R - Bd.L - 40)), y + 4 + (i % 3) * (Bd.rh - 8) / 2, 40, 2); } },
  });
  // THE SNOOZE: a vast hand in a pyjama sleeve comes down flat, three times, wherever you were standing a moment before
  reg('w6slap', {
    update(h, dt) { if (h.delay > 0) { h.delay -= dt; if (h.delay <= 0) { h.x = xClamp(P.x); h.y = yClamp(P.y); const e = SB(); h.f = e ? Math.sign(h.x - e.x) || 1 : 1; } return; } h.el += dt;
      if (h.el >= h.tell && !h.hit) { h.hit = 1; sfx('slam'); shakeMag = Math.max(shakeMag, 8); dust(h.x, h.y, 10); floatText(h.x, h.y, 50, 'SNOOZE', '#FFE0A0', 15); if (inEll(P.x, P.y, h.x, h.y, h.r + 6) && P.z < 50) hitP(h.dmg, h.x, true); }
      if (h.el > h.tell + .7) h.t = -1; },
    draw(h) { if (h.delay > 0 || h.el > h.tell + .05) return; const k = h.el / h.tell; ctx.fillStyle = tellCol(k); ell(h.x, h.y, h.r * k, h.r / 2.2 * k); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.8; ell(h.x, h.y, h.r, h.r / 2.2); ctx.stroke();
      ctx.fillStyle = `rgba(20,16,30,${.15 + .35 * k})`; ell(h.x + 6, h.y, 12 + 24 * k, 3 + 6 * k); ctx.fill(); },
    ups(h, list) { if (h.delay > 0 || h.el < h.tell - .35) return; list.push([h.y, () => { const z = h.el < h.tell ? (h.tell - h.el) / .35 * 230 : h.el < h.tell + .35 ? 0 : (h.el - h.tell - .35) / .35 * 230;
      ctx.save(); ctx.globalAlpha = 1 - cl01((h.el - h.tell - .45) / .25); ctx.translate(h.x, h.y - z); ctx.scale(h.f * 1.15, 1.15); handArt(); ctx.restore(); }]); },
    box(h, box) { box(h.x, h.y, 0, 110, 260); },
  });
  // THE ALARM: a bell clock jumps about in front of it, ringing, and the ringing rolls out in rings to jump
  reg('w6bell', {
    update(h) { const e = SB(); if (e) { h.x = e.x + 40; h.y = e.y + 14; } },
    // just before each ring goes out the clock flashes white and shakes harder (the rings leave at .35, 1.25 and 2.15 s)
    ups(h, list, t) { list.push([h.y, () => { const a = Math.min(1, (h.max - h.t) / .2, Math.max(0, h.t) / .3), el = h.max - h.t;
      let fk = 0; for (const R of [.35, 1.25, 2.15]) if (el > R - .32 && el < R + .04) fk = Math.max(fk, cl01((el - (R - .32)) / .3));
      const flick = fk > 0 ? (Math.sin(t * 60) > -.2 ? 1 : .35) * fk : 0;
      shadow(h.x, h.y, 14); ctx.save(); ctx.globalAlpha = a; ctx.translate(h.x + (fk ? Math.sin(t * 90) * 2.5 * fk : 0), h.y - Math.abs(Math.sin(t * 22)) * (6 + 6 * fk)); ctx.scale(1.7 + .2 * fk, 1.7 + .2 * fk); clockArt(h.t);
      if (flick > 0) { const F = FLASH; FLASH = true; ctx.globalAlpha = a * flick; clockArt(h.t); FLASH = F; // the whole clock goes white
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * flick; ctx.fillStyle = 'rgba(255,250,235,.9)'; circle(0, -19, 15); ctx.fill(); ctx.strokeStyle = 'rgba(255,240,210,.9)'; ctx.lineWidth = 2; circle(0, -19, 19 + 4 * fk); ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; }
      ctx.restore(); }]); },
    box(h, box) { box(h.x, h.y, 0, 40, 80); },
  });
  // THE FALL: it dreams that it is falling, and jerks awake: the whole bed jolts. Be off it (jump) when the count runs out
  reg('w6jolt', {
    update(h, dt) { h.el += dt; const n = 3 - Math.floor(h.el / h.step);
      if (h.el < h.wait && n !== h.n && n >= 1) { h.n = n; floatText(P.x, P.y, 100, n === 1 ? '1 · JUMP!' : String(n), '#FFE0B0', 20); sfx('hit-crystal'); }
      if (h.el >= h.wait && !h.done) { h.done = 1; sfx('slam'); sfx('roar'); shakeMag = 16; flashT = Math.max(flashT, .06); floatText(P.x, P.y, 112, 'JOLT!', '#FFE0B0', 22);
        for (let i = 0; i < 6; i++) dust(rand(leftWall() + 30, rightWall() - 30), rand(FLOOR_TOP + 12, FLOOR_BOT - 6), 6);
        if (P.z < 8) hitP(h.dmg, P.x - P.facing, true); }
      if (h.el > h.wait + .5) h.t = -1; },
    draw(h, t) { if (h.done) return; const Bd = BOARD(), k = Math.min(1, h.el / h.wait), pul = .5 + .5 * Math.sin(t * (8 + k * 14));
      ctx.fillStyle = tellCol(k, .35 + .35 * pul); ctx.fillRect(Bd.L, Bd.y0, Bd.R - Bd.L, Bd.rh * 4); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 2.4; ctx.strokeRect(Bd.L, Bd.y0, Bd.R - Bd.L, Bd.rh * 4);
      ctx.lineWidth = 2; for (let i = 0; i < 9; i++) { const x = Bd.L + (i + .5) * (Bd.R - Bd.L) / 9, y = Bd.y0 + 14 + ((t * 40 + i * 9) % (Bd.rh * 4 - 24)); ctx.beginPath(); ctx.moveTo(x - 5, y - 4); ctx.lineTo(x, y + 2); ctx.lineTo(x + 5, y - 4); ctx.stroke(); } }, // chevrons falling away down the bed
  });
  function wakeAttack(e, kind) {
    const dmg = edmg(e), Bd = BOARD();
    if (kind === 'rem') { const r0 = Bd.row(P.y), late2 = B.cast >= 5;
      for (const r of [r0, (r0 + 2) % 4]) hazards.push({ kind: 'w6rem', row: r, wait: 1.1, el: 0, t: 9, max: 9, dmg: Math.round(dmg * 1.05) });
      if (late2) for (const r of [(r0 + 1) % 4, (r0 + 3) % 4]) hazards.push({ kind: 'w6rem', row: r, wait: 2.05, el: 0, t: 9, max: 9, dmg: Math.round(dmg * 1.05) });
      B.rem = late2 ? 2.4 : 1.4; floatText(e.x, e.y - e.z, 150, 'R · E · M', '#D8D0FF', 15); sfx('charge', 2); W6.mouth = .3; }
    if (kind === 'teeth') { dropRain(e, 'tooth', 6, .8); floatText(e.x, e.y - e.z, 150, 'ITS TEETH ARE FALLING OUT!', '#F4F0FF', 14); W6.mouth = 1; }
    if (kind === 'snooze') { for (let i = 0; i < 3; i++) hazards.push({ kind: 'w6slap', delay: .05 + i * .75, tell: .9, el: 0, r: 38, x: P.x, y: P.y, f: 1, t: 9, max: 9, dmg: Math.round(dmg * .9) }); floatText(e.x, e.y - e.z, 150, 'FIVE MORE MINUTES...', '#F4F0FF', 14); W6.mouth = .6; }
    if (kind === 'alarm') { for (let i = 0; i < 3; i++) hazards.push({ kind: 'ring', x: e.x + 40, y: e.y + 14, r: 20, delay: .35 + i * .9, speed: 250, dmg: Math.round(dmg * .8), t: 9, max: 9 }); hazards.push({ kind: 'w6bell', x: e.x + 40, y: e.y + 14, t: 2.4, max: 2.4 }); shakeMag = 10; W6.mouth = 1; // (its rings come far enough apart to jump each one)
      let n = 0; const bell = () => { if (n++ < 14 && sfxOn && actx) { tone(1800 + (n % 2) * 200, .05, 'square', .05); setTimeout(bell, 60); } }; bell(); floatText(e.x, e.y - e.z, 170, 'BRRRRRING', '#FFE0A0', 18); }
    if (kind === 'jolt') { hazards.push({ kind: 'w6jolt', el: 0, wait: 2.1, step: .7, n: 0, t: 9, max: 9, dmg: Math.round(dmg * .9) }); floatText(e.x, e.y - e.z, 150, 'IT DREAMS IT IS FALLING...', '#F4F0FF', 14); W6.mouth = .8; }
  }
  const WAKE_T = { rem: 2.5, teeth: 2.4, snooze: 3.0, alarm: 3.0, jolt: 2.8 };
  W6.ATK = { dreams: DREAMS, piece: (k) => SB() && playPiece(SB(), k), wake: (k) => SB() && wakeAttack(SB(), k) };
  // ---------------- running it ----------------
  MECH_FX.w6sleep = {
    start(m) { B = W6.B = { mode: 'none' }; m.clk = 0; },
    update(m, dt) {
      m.clk += dt; const e = SB();
      if (!e) return;
      if (!e.w6init) initSleeper(e);
      const S = e.w6S, t = m.clk;
      if (e.dead) { if (!B.dead) { B.dead = 1; B.vuln = false; for (const c of B.crutches) if (!c.dead) { c.dead = true; c.w6counted = 1; c.state = 'dying'; c.death = 'w6snap'; c.t = c.dmax = 1.2; c.vx = 0; c.deadAt = performance.now() / 1000; c.dir = 1; } hazards = hazards.filter(h => !SHZ.includes(h.kind)); }
        B.boardK = Math.max(0, B.boardK - dt); if (B.iris) B.iris.r += dt * 700; S.eyes = 1; S.mouth = 1; return; }
      W6.mouth = Math.max(0, (W6.mouth || 0) - dt * 1.4);
      if (stillT > 0) return;
      B.t += dt;
      const ph = e.phase;
      // its crutches: who is still standing, and where they meet its face
      for (const c of B.crutches) { if (c.dead && !c.w6counted) { c.w6counted = 1; B.broken++; S.sag = Math.min(.9, S.sag + .2); sfx('growl'); shakeMag = Math.max(shakeMag, 7); floatText(e.x, e.y - e.z, 160, 'IT SAGS', '#F4E6C8', 14); B.tilt = (B.tilt || 0) + Math.sign(c.x - e.x) * .05; }
        if (!c.dead) { const [ax, ay] = anchorAt(e, c.w6i); c.w6top = [ax - c.x, ay - c.y]; } }
      B.crutches = B.crutches.filter(c => !c.remove);
      if (ph === 1) {
        if (B.mode === 'asleep') {
          B.vuln = false; B.gz = 62 - S.sag * 14; S.eyes = 0; S.mouth = .12 + Math.max(0, Math.sin(t * 1.3)) * .12 + W6.mouth * .5; S.mood = 0;
          if (B.inhale > 0) { B.inhale -= dt; S.mouth = .02; S.flush = Math.min(1, (S.flush || 0) + dt * 3); S.mood = .3; } else S.flush = Math.max(0, (S.flush || 0) - dt * 2); // (drawing the snore in: cheeks full, mouth shut)
          B.dreamT -= dt;
          if (B.dreamT <= 0) { B.dreamN++; const lv = B.broken + B.regrows, L = lv >= 2 ? ['pillows', 'sheep', 'snore', 'sand'] : lv >= 1 ? ['pillows', 'sheep', 'snore'] : ['pillows', 'sheep'], d = L[(B.dreamN - 1) % L.length];
            B.dreamT = DREAM_T[d] - Math.min(.8, B.broken * .2); DREAMS[d](e); } // (the more it sags, the more of bedtime it dreams)
          if (!B.crutches.some(c => !c.dead)) { B.mode = 'collapse'; B.t = 0; sfx('roar'); }
        } else if (B.mode === 'collapse') {
          B.gz = Math.max(0, 62 * (1 - sm(B.t / .45)));
          if (B.t >= .45) { B.mode = 'down'; B.t = 0; e.sqx = 1.25; e.sqy = .78; shakeMag = 15; sfx('slam'); hitstop = Math.max(hitstop, .08); dust(e.x - 60, e.y + 6, 10); dust(e.x + 60, e.y + 6, 10); fx.push({ kind: 'ring', x: e.x, y: e.y + 10, z: 2, t: .5, max: .5, r: 170, col: '#F4E6C8', flat: 1 });
            floatText(e.x, e.y, 150, 'ITS FACE IS ON THE QUILT · STRIKE!', '#FFE6B0', 15); }
        } else if (B.mode === 'down') {
          B.vuln = true; B.gz = 0; S.mood = -.3; S.flush = 0; S.eyes = 0; S.mouth = .3; S.drool = Math.min(1, B.t / 3);
          if (e.hp <= e.maxHp * .67) toPhase(e, 2);
          else if (B.t > 9) { B.mode = 'rise'; B.t = 0; B.regrows++; S.sag = Math.max(.2, S.sag - .5); S.drool = 0; floatText(e.x, e.y, 150, 'IT PROPS ITSELF UP AGAIN', '#F4E6C8', 14);
            const pick3 = [0, 1, 2, 3].sort(() => Math.random() - .5).slice(0, B.regrows > 1 ? 2 : 3); B.broken = 4 - pick3.length; for (const i of pick3) plantCrutch(e, i, .6, true); }
        } else if (B.mode === 'rise') {
          B.vuln = false; B.gz = 62 * sm(B.t / 1.1) - S.sag * 14;
          if (B.t > 1.1) { B.mode = 'asleep'; B.t = 0; B.dreamT = 2; }
        }
      } else if (ph === 2) {
        const Bd = BOARD();
        if (B.mode === 'turn') { B.vuln = false; B.boardK = Math.min(1, B.t / 1.8); B.gz = 10 + 24 * sm(B.t / 1.8); S.sag = Math.max(.2, S.sag - dt * .4); S.eyes = .5 * sm(B.t / 1.6); S.mouth = .1; S.mood = .3;
          if (B.t > 2) { B.mode = 'board'; B.t = 0; B.kc = Bd.col(e.x); B.kr = 0; B.moveT = 1; B.castT = 1.2; B.cast = 0; } }
        else if (B.mode === 'board') {
          B.vuln = true; B.boardK = 1; S.eyes = .5; S.mood = .4 + Math.sin(t * .7) * .2; S.mouth = .1 + W6.mouth * .5; S.look = clamp((P.x - e.x) / 200, -1, 1);
          B.moveT -= dt; if (B.moveT <= 0) { B.moveT = 1.5 - (e.hp < e.maxHp * .45 ? .3 : 0); // the king steps one square, keeping a little way from you
            const pc = Bd.col(P.x), opts = []; for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) { const c = B.kc + dc, r = B.kr + dr; if ((dc || dr) && c >= 1 && c < Bd.nc - 1 && r >= 0 && r < 2) opts.push([c, r, -Math.abs(Math.abs(c - pc) - 3) + Math.random() * 1.5]); }
            if (opts.length) { opts.sort((a, b) => b[2] - a[2]); [B.kc, B.kr] = opts[0]; sfx('whoosh'); } }
          B.kc = clamp(B.kc ?? 2, 0, Bd.nc - 1); B.gx = Bd.cx(B.kc); B.gy = Bd.cy(B.kr ?? 0); B.gz = 30 + Math.sin(t * 2) * 4;
          B.castT -= dt; if (B.castT <= 0) { const late2 = e.hp < e.maxHp * .45, seq = late2 ? ['rook', 'knight', 'bishop', 'queen'] : ['rook', 'bishop', 'knight']; playPiece(e, seq[B.cast++ % seq.length]); B.castT = late2 ? 2.7 : 3.1; }
          if (e.hp <= e.maxHp * .34) toPhase(e, 3);
        }
      } else {
        if (B.mode === 'wake') { B.vuln = false; B.boardK = Math.max(0, 1 - B.t / 1.4); S.eyes = .5 + .5 * sm(B.t / 1.4); S.mouth = .7; S.mood = -.4; S.flush = 1; B.gz = 30;
          if (!B.iris) B.iris = { r: 380, outT: 0 };
          if (B.t > 1.8) { B.mode = 'waking'; B.t = 0; B.castT = 1.4; B.moveT = 0; } }
        else if (B.mode === 'waking') {
          B.vuln = true; S.eyes = 1; S.mood = -.3 + Math.sin(t * 3) * .2; S.mouth = .25 + W6.mouth * .7; S.look = clamp((P.x - e.x) / 200, -1, 1);
          if (B.rem > 0) { B.rem -= dt; S.look = Math.sin(t * 26); } // its eyes darting
          const I = B.iris; I.r = Math.max(118, I.r - dt * (I.r > 300 ? 22 : 13));
          if (I.r <= 118) { I.minT = (I.minT || 0) + dt; if (I.minT > 1.2) { I.minT = 0; I.r = 340; wakeAttack(e, 'alarm'); floatText(e.x, e.y - e.z, 140, 'IT STIRS', '#FFE6B0', 16); } } else I.minT = 0;
          B.moveT -= dt; if (B.moveT <= 0) { B.moveT = 2.4; const cx = homeX(); B.gx = clamp(cx + rand(-80, 80), leftWall() + 90, rightWall() - 90); B.gy = FLOOR_TOP + rand(16, 46); }
          B.gz = 26 + Math.sin(t * 1.6) * 5;
          B.castT -= dt; if (B.castT <= 0) { B.cast++; const seq = e.hp < e.maxHp * .2 ? ['rem', 'jolt', 'teeth', 'snooze', 'jolt', 'alarm'] : ['rem', 'teeth', 'snooze', 'alarm'], k = seq[B.cast % seq.length]; wakeAttack(e, k); B.castT = WAKE_T[k]; }
        }
      }
      // it drifts to where it means to be
      const k = Math.min(1, dt * (B.mode === 'collapse' ? 30 : 2.2)); e.x += ((B.gx ?? e.x) - e.x) * (ph === 1 ? 0 : k); e.y += ((B.gy ?? e.y) - e.y) * (ph === 1 ? 0 : k); e.z += (B.gz - e.z) * (B.mode === 'collapse' ? 1 : k);
      if (ph === 1) { e.x = homeX() + Math.sin(t * .5) * 4; }
      // outside the waking dream there is nothing: whoever stands out there is forgotten, a little at a time
      if (B.iris && !B.dead && ph === 3) { const I = B.iris, sx = P.x - homeX(), sy = (P.y - P.z - 30) - (FLOOR_TOP + 40);
        if (Math.hypot(sx, sy) > I.r - 6 && P.state !== 'dead') { I.outT += dt; if (I.outT > .6) { I.outT = 0; hitP(Math.max(3, Math.round(edmg(e) * .3)), homeX(), false); floatText(P.x, P.y, 80, 'FORGOTTEN', '#C8D0F0', 13); } } else I.outT = 0; }
    },
    boxes(m, box) { const e = SB(); if (!e) box(stage.len - VW / 2, FLOOR_TOP + 16, 62, 300, 240); },
    list(m, list, t) {
      const e = SB();
      if (!e && stage.bossRoom) { // before it is woken into the fight: it is already there, asleep on its crutches, snoring
        const x = stage.len - VW / 2, y = FLOOR_TOP + 16, z = 62, s = 1.15, fake = { x, y, z, size: s, w6S: { sag: 0 } };
        list.push([y, () => { shadow(x, y, 120); ctx.save(); ctx.translate(x, y - z); ctx.scale(s * W6.HS, s * W6.HS); sleeperHead({ t, mouth: .12 + Math.max(0, Math.sin(t * 1.3)) * .12 }); ctx.restore(); }]);
        for (let i = 0; i < 4; i++) { const [fx, fy] = CRUTCH_FEET[i], cx = x + fx, cy = FLOOR_TOP + fy, [ax, ay] = anchorAt(fake, i);
          list.push([cy, () => { ctx.save(); ctx.translate(cx, cy); CREATURES.w6crutch({ w6top: [ax - cx, ay - cy], hp: 1, maxHp: 1, flash: 0, slot: i }, { t }); W6.skipHatch = false; ctx.restore(); }]); }
        list.push([y + .1, () => onMain(() => snoreZs(x + 30, y - z - 20, t, 1, 1.4))]);
        return;
      }
      if (e && !e.dead && e.phase === 1 && B.mode === 'asleep') list.push([e.y + .1, () => onMain(() => snoreZs(e.x + 34, e.y - e.z - 26, t, 1, 1.4))]);
    },
  };

  // ======================================================================================================
  // PASSAGES
  // ======================================================================================================
  // THE EASEL (the Piazza -> the Shore): the picture on the easel is of the place ahead; he walks up to it and into it, and
  // it opens out round him until it is all there is, its stretcher and the legs of the easel going past him
  let easC = null;
  TRANS_FX.w6easel = (T, p, c, inP, t) => {
    const L = typeof threshX === 'function' ? threshX() : stage.len - 130, E = W6.EASEL, cx = L + E.cx - camX, cy = (E.top + E.bot) / 2;
    const s = inP ? 1 + 9 * Math.pow(c, 2.4) : 10 + 6 * (1 - c), w = E.w * s, h = (E.bot - E.top) * s, X = lerp(cx, VW / 2, inP ? sm(c) : 1), Y = lerp(cy, Y_OFF + VIEW_H / 2, inP ? sm(c) : 1);
    if (inP) { // the next place, in the canvas
      if (!easC || easC.width !== cv.width || easC.height !== cv.height) easC = texCanvas(cv.width, cv.height)[0];
      const g = easC.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, easC.width, easC.height); g.setTransform(K, 0, 0, K, 0, -Y_OFF * K);
      if (window.nextWorldInto && window.nextWorldInto(g, t, { cam: 0 })) { ctx.save(); ctx.beginPath(); ctx.rect(X - w / 2, Y - h / 2, w, h); ctx.clip(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = sm(c * 1.6); ctx.drawImage(easC, 0, 0); ctx.restore(); }
      ctx.fillStyle = `rgba(30,16,10,${.45 * c})`; ctx.beginPath(); ctx.rect(0, Y_OFF, VW, VIEW_H); ctx.rect(X - w / 2, Y - h / 2, w, h); ctx.fill('evenodd'); // the square going dim round it
    }
    // the stretcher's edge and the easel's legs, flying out past him
    const a = inP ? 1 : c; if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#E8DCC0'; ctx.lineWidth = Math.max(2, 3 * s); ctx.strokeRect(X - w / 2, Y - h / 2, w, h);
    ctx.strokeStyle = '#5A3A22'; ctx.lineWidth = Math.max(1.5, 2.2 * s); ctx.strokeRect(X - w / 2 - 3 * s, Y - h / 2 - 3 * s, w + 6 * s, h + 6 * s);
    ctx.strokeStyle = '#7A5230'; ctx.lineWidth = Math.max(3, 5 * s); ctx.beginPath(); ctx.moveTo(X - w * .3, Y + h / 2); ctx.lineTo(X - w * .48, Y + h / 2 + 60 * s); ctx.moveTo(X + w * .3, Y + h / 2); ctx.lineTo(X + w * .48, Y + h / 2 + 60 * s); ctx.moveTo(X - w * .5, Y + h / 2 + 2 * s); ctx.lineTo(X + w * .5, Y + h / 2 + 2 * s); ctx.stroke();
    ctx.restore();
  };
  // TO SLEEP (the Shore -> the Bed): he lies down, and his eyes close: two lids come together over the view, lashes and
  // all; behind them the dark turns slowly; they open again, heavy, onto the bed of the Sleeper
  TRANS_FX.w6bed = (T, p, c, inP, t) => {
    const Y0 = Y_OFF, H = VH - Y0, mid = Y0 + H / 2, k = inP ? sm(c) : sm(c) * (1 - .25 * Math.sin(Math.min(1, (p - .5) * 3) * Math.PI)); // (opening, they droop once more before they lift)
    const open = (1 - k) * H / 2 + 2;
    if (k > .6) { ctx.fillStyle = `rgba(8,6,14,${cl01((k - .6) / .3)})`; ctx.fillRect(0, Y0, VW, H); ctx.save(); ctx.globalCompositeOperation = 'lighter'; // the turning dark behind the lids
      for (let i = 0; i < 3; i++) { ctx.strokeStyle = `rgba(150,140,220,${.18 * cl01((k - .7) / .3)})`; ctx.lineWidth = 6; ctx.beginPath(); for (let a = 0; a < TAU * 2.5; a += .15) { const r = a * 14 + i * 20, px = VW / 2 + Math.cos(a + t * (1 + i * .3)) * r, py = mid + Math.sin(a + t * (1 + i * .3)) * r * .55; a ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); } ctx.restore(); }
    for (const s of [-1, 1]) { // a lid: skin, darker toward its edge, its lashes along the rim
      const edge = mid + s * open, curve = 26 * (1 - k * .8);
      ctx.save(); ctx.beginPath(); if (s < 0) { ctx.moveTo(-10, Y0 - 10); ctx.lineTo(VW + 10, Y0 - 10); ctx.lineTo(VW + 10, edge); ctx.quadraticCurveTo(VW / 2, edge + curve, -10, edge); } else { ctx.moveTo(-10, VH + 10); ctx.lineTo(VW + 10, VH + 10); ctx.lineTo(VW + 10, edge); ctx.quadraticCurveTo(VW / 2, edge - curve, -10, edge); } ctx.closePath();
      const g = ctx.createLinearGradient(0, s < 0 ? Y0 : VH, 0, edge); g.addColorStop(0, '#C89070'); g.addColorStop(.75, '#A86A50'); g.addColorStop(1, '#5A2A24'); ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = '#2A1410'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = '#1A0C0A'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; for (let i = 0; i <= 30; i++) { const u = i / 30, x = u * VW, y = edge + s * curve * 2 * u * (1 - u) * 2 * .5; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + (u - .5) * 8, y + s * 6, x + (u - .5) * 16, y + s * (10 + 4 * Math.sin(u * Math.PI))); ctx.stroke(); } // the lashes
      ctx.restore(); }
    if (!inP) { ctx.fillStyle = `rgba(255,250,240,${.3 * c})`; ctx.fillRect(0, Y0, VW, H); } // waking into it, the light is too bright at first
  };
  }; // end of late()

  // ======================================================================================================
  // THE LATE HOOKS: entrances, cover, landmarks, deaths and the small behaviours of this world's foes, wrapped round
  // functions from files that load after data_w6.js. data_w6.js runs this at DOMContentLoaded
  // ======================================================================================================
  const dom = () => {
  const yC = (y) => clamp(y, FLOOR_TOP + 10, FLOOR_BOT - 2);
  const HZ = W6.HZ || {};
  // ---------------- how each of them comes on ----------------
  if (typeof ENTRY !== 'undefined') Object.assign(ENTRY, {
    w6bowler: ['w6golconda'], w6clock: ['w6drip'], w6elephant: ['w6stride'], w6mannequin: ['w6assemble'], w6lobster: ['w6ringin'], w6skybird: ['w6cutout'], w6fish: ['w6splash'], w6crutch: ['w6sprout'],
  });
  if (typeof ENTER_FX !== 'undefined') {
    Object.assign(ENTER_FX, {
      // a gentleman of Golconda: he comes down out of the sky like rain, standing upright under his open umbrella
      w6golconda: { max: 1.7, start(e, n) { e.x = entranceSpot(e); n.x0 = e.x; n.z0 = e.y - Y_OFF + 60; e.z = n.z0; e.w6open = .1; sfx('whoosh'); },
        update(e, n, dt) { const k = cl01(n.t / 1.5); e.z = n.z0 * (1 - sm(k)); e.x = n.x0 + Math.sin(n.t * 3) * 10 * (1 - k);
          if (n.t < .3) e.w6open = .1 + 1.02 * sm(n.t / .3); else if (k < .9) e.w6open = lerp(e.w6open, 1, Math.min(1, dt * 8)); // popped open as he appears
          else if (e.w6open > 0) { if (!n.c) { n.c = 1; sfx('pick', .4); } e.w6open = Math.max(0, e.w6open - dt * 12); } // snapped shut just above the floor
          if (k >= 1 && !n.l) { n.l = 1; e.w6open = 0; e.w6tuck = 1; dust(e.x, e.y, 4); } return n.t >= n.max; },
        draw(e, n, t, inner) { inner(); } },
      // a soft clock: a drop of molten gold falls, splashes, and the watch heaps itself up out of the splash
      w6drip: { max: 1.4, start(e, n) { e.x = entranceSpot(e); n.z0 = e.y - Y_OFF + 30; sfx('hit-goo'); },
        update(e, n, dt) { if (n.t > .5 && !n.s) { n.s = 1; sfx('hit-goo'); for (let i = 0; i < 8; i++) parts.push({ x: e.x, y: e.y, z: 2, vx: rand(-70, 70), vy: rand(-8, 8), vz: rand(40, 120), life: .5, max: .5, col: '#E8B850', size: 2.4, shape: 'blob', rot: 0, vr: 0 }); } return n.t >= n.max; },
        draw(e, n, t, inner) { if (n.t < .5) { const z = n.z0 * (1 - n.t / .5); ctx.save(); ctx.fillStyle = C('#E8B850'); ell(e.x, e.y - z, 4, 7); ctx.fill(); outline(1); ctx.restore(); return; }
          const k = sm((n.t - .5) / .8); ctx.save(); ctx.translate(e.x, e.y); ctx.scale(1 + .5 * (1 - k) + Math.sin(n.t * 20) * .05 * (1 - k), k * (1 + Math.sin(n.t * 16) * .1 * (1 - k))); ctx.translate(-e.x, -e.y); inner(); ctx.restore(); } },
      // a stilt elephant: it strides in from the horizon, small and hazy at first, growing as it comes
      w6stride: { max: 2.6, keepFace: 1, start(e, n) { n.x1 = entranceSpot(e); n.dir = Math.sign(P.x - n.x1) || 1; n.x0 = n.x1 - n.dir * 140; n.y1 = yC(e.y); e.x = n.x0; e.y = FLOOR_TOP + 4; e.facing = n.dir; sfx('growl'); },
        update(e, n, dt) { const k = cl01(n.t / n.max); e.x = lerp(n.x0, n.x1, k); e.y = lerp(FLOOR_TOP + 4, n.y1, sm(k)); e.walk += dt * 8; e.w6sc = lerp(.3, 1, sm(k)); return n.t >= n.max; },
        draw(e, n, t, inner) { const s = e.w6sc || .3; ctx.save(); ctx.translate(e.x, e.y); ctx.scale(s, s); ctx.translate(-e.x, -e.y); ctx.globalAlpha = .5 + .5 * s; inner(); ctx.restore(); } },
      // a mannequin: its pieces drop out of the air, one by one, and click together
      w6assemble: { max: 1.5, start(e, n) { e.x = entranceSpot(e); sfx('whoosh'); },
        update(e, n, dt) { if (n.t > .55 && !n.s) { n.s = 1; sfx('hit-crystal'); dust(e.x, e.y, 5); } if (n.t > 1.3 && !n.s2) { n.s2 = 1; sfx('hit-metal', .3); } return n.t >= n.max; },
        draw(e, n, t, inner) { const k1 = cl01(n.t / .55); if (n.t >= 1.3) { inner(); return; } const s = e.state; e.state = 'w6apart'; e.w6apartK = .3 + .7 * cl01((n.t - .55) / .75);
          ctx.save(); ctx.translate(0, -(1 - sm(k1)) * 220); try { inner(); } finally { ctx.restore(); e.state = s; } } },
      // a lobster telephone: the floor rings, rings, rings, and it bobs up out of the ringing like a swimmer
      w6ringin: { max: 1.4, start(e, n) { e.x = entranceSpot(e); let k = 0; const ring = () => { if (k++ < 3 && sfxOn && actx) { tone(1320, .08, 'square', .035); setTimeout(ring, 220); } }; ring(); },
        update(e, n, dt) { return n.t >= n.max; },
        draw(e, n, t, inner) { for (let i = 0; i < 3; i++) { const r = ((n.t * 50 + i * 14) % 42); ctx.strokeStyle = `rgba(255,230,180,${.7 * (1 - r / 42) * (1 - cl01((n.t - 1) / .4))})`; ctx.lineWidth = 1.6; ell(e.x, e.y, r * 1.4, r * .45); ctx.stroke(); }
          if (n.t < .6) return; const k = sm((n.t - .6) / .6); ctx.save(); ctx.beginPath(); ctx.rect(e.x - 80, e.y - 200, 160, 202); ctx.clip(); ctx.translate(0, (1 - k) * 40); inner(); ctx.restore(); } },
      // a bird of daylight: a pair of scissors' dotted line traces a dove on the air, and the cut-out flies free
      w6cutout: { max: 1.6, start(e, n) { e.x = entranceSpot(e); n.z0 = e.def.hover + 50; e.z = n.z0; sfx('slice'); },
        update(e, n, dt) { if (n.t > .9) e.z = lerp(n.z0, e.def.hover, sm((n.t - .9) / .7)); return n.t >= n.max; },
        draw(e, n, t, inner) { if (n.t >= .9) { inner(); return; } const k = n.t / .9; ctx.save(); ctx.translate(e.x, e.y - e.z - 10); ctx.scale(1.3 * e.facing, 1.3);
          ctx.setLineDash([3, 2.4]); ctx.lineDashOffset = -t * 30; ctx.strokeStyle = 'rgba(250,246,236,.95)'; ctx.lineWidth = 1.4; birdPath(.4, 0)(0, 0); ctx.stroke(); ctx.setLineDash([]);
          if (k > .55) { ctx.globalAlpha = (k - .55) / .45; birdPath(.4, 0)(0, 0); ctx.fillStyle = '#7EB2E2'; ctx.fill(); } ctx.restore(); } },
      // a collective invention: a pool of seawater opens on the paving and it leaps out of it, legs first
      w6splash: { max: 1.3, keepFace: 1, start(e, n) { n.x0 = entranceSpot(e); n.dir = Math.sign(P.x - n.x0) || 1; e.x = n.x0; e.facing = n.dir; n.y = yC(e.y); e.y = n.y; },
        update(e, n, dt) { if (n.t > .4) { const k = cl01((n.t - .4) / .7); e.x = n.x0 + n.dir * 60 * k; e.z = Math.sin(k * Math.PI) * 50; if (!n.s) { n.s = 1; sfx('hit-goo'); splash(n.x0, n.y, 14); } if (k >= 1 && !n.l) { n.l = 1; e.z = 0; dust(e.x, e.y, 4); } } return n.t >= n.max; },
        draw(e, n, t, inner) { const a = cl01(n.t / .3) * (1 - cl01((n.t - .9) / .4)); ctx.fillStyle = `rgba(60,120,150,${.7 * a})`; ell(n.x0, n.y, 26, 8); ctx.fill(); ctx.strokeStyle = `rgba(220,245,255,${.8 * a})`; ctx.lineWidth = 1.2; ell(n.x0, n.y, 26, 8); ctx.stroke(); if (n.t > .4) inner(); } },
      // a crutch of the Sleeper: it grows up out of the quilt like a stalk, and props up its face
      w6sprout: { max: 1.1, start(e, n) { sfx('growl'); },
        update(e, n, dt) { if (Math.random() < .3) dust(e.x, e.y, 1); return n.t >= n.max; },
        draw(e, n, t, inner) { const k = sm(n.t / n.max); ctx.save(); ctx.translate(e.x, e.y); ctx.scale(1, Math.max(.02, k)); ctx.translate(-e.x, -e.y); inner(); ctx.restore(); } },
    });
    if (ENTER_FX.behind && ENTER_FX.behind.cover) ENTER_FX.behind.cover.push('w6plinth', 'w6olive', 'w6slab');
    Object.assign(ENTRY, { w6mannequin: ['w6assemble', 'behind'], w6fish: ['w6splash', 'behind'] });
  }
  const splash = (x, y, n = 16) => { for (let i = 0; i < n; i++) { const a = rand(0, TAU), v = rand(60, 180); parts.push({ x, y, z: 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .3, vz: rand(80, 220), life: .8, max: .8, col: pick(['#BFE6F2', '#E8F6FA', '#7AB8D0']), size: rand(1.6, 3), shape: 'blob', rot: 0, vr: 0 }); } };

  // ---------------- cover: a statue on its plinth in the piazza; a dead olive with its watch, a slab, on the shore ----------------
  if (typeof coverPaint === 'function') {
    const _cp = coverPaint;
    coverPaint = function (kind, v) {
      const r = mulberry(v * 977 + kind.length * 31 + 7);
      if (kind === 'w6plinth') return propSprite('w6plinth' + v, 80, 150, 40, 140, (th, s) => {
        if (v === 2) { // a mannequin's bust on a column, a drawing-board leaning on it
          ctx.fillStyle = '#C8B49A'; ctx.fillRect(-10, -70, 20, 70); ctx.fillStyle = '#F2E6CC'; ctx.fillRect(s > 0 ? 3 : -10, -70, 7, 70); ctx.fillStyle = '#E8D8B8'; ctx.fillRect(-13, -73, 26, 4);
          ctx.fillStyle = '#E6D4B6'; ctx.beginPath(); ctx.moveTo(-9, -73); ctx.quadraticCurveTo(-12, -96, 0, -100); ctx.quadraticCurveTo(12, -96, 9, -73); ctx.fill(); ctx.fillStyle = '#F4ECDC'; ell(1, -110, 7, 9); ctx.fill(); ctx.strokeStyle = 'rgba(110,90,70,.5)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.ellipse(2, -110, 4, 9, .1, -1.2, 1.4); ctx.stroke();
          ctx.fillStyle = '#7A5A3A'; ctx.save(); ctx.translate(14, 0); ctx.rotate(-.18); ctx.fillRect(-2, -54, 26, 54); ctx.fillStyle = '#F6EEDA'; ctx.fillRect(1, -51, 20, 30); ctx.strokeStyle = 'rgba(40,40,80,.5)'; ctx.beginPath(); ctx.moveTo(4, -40); ctx.lineTo(18, -30); ctx.moveTo(4, -30); ctx.lineTo(18, -44); ctx.stroke(); ctx.restore();
        } else W6_ART.marbleStatue(0, 0, 1.45 + v * .15, r);
        for (let i = 0; i < 6; i++) dab((r() - .5) * 40, -1 - r() * 2, 1.5 + r() * 2, '#8A5A3A', .4);
      }, { foot: 16, seed: 41 + v, haze: .08 });
      if (kind === 'w6olive') return propSprite('w6olive' + v, 150, 170, 60, 160, (th, s) => { W6_ART.oliveTree(0, 0, 120 + v * 10, r); for (let i = 0; i < 6; i++) dab((r() - .5) * 30, -1 - r() * 2, 2 + r() * 2, '#8A6A44', .5); }, { foot: 18, seed: 47 + v, haze: .08 });
      if (kind === 'w6slab') return propSprite('w6slab' + v, 130, 90, 60, 80, (th, s) => { W6_ART.slab(-44, 0, 74, 26 + v * 6, 12, r); W6_ART.softWatch(18, -28 - v * 6, 1.3, 1, -.05); }, { foot: 12, seed: 53 + v, haze: .08 });
      return _cp(kind, v);
    };
  }
  if (typeof drawCover === 'function') { const _dc = drawCover; drawCover = function (c, t) { if (!/^w6/.test(c.kind)) return _dc(c, t); const s = coverPaint(c.kind, Math.floor(c.seed * 3)); if (!s) return; const sh = c.shake > 0 ? Math.sin(t * 60) * 2 * Math.min(1, c.shake * 3) : 0; propDraw(s, c.x + sh * .5, c.y, { sx: c.s, sy: c.s, sh: c.kind === 'w6slab' ? 44 : 30, sk: c.kind === 'w6olive' ? sh * .01 : 0 }); }; }

  // ---------------- the pods of this world: eggs on little bronze stands, as the dreamers paint them ----------------
  { const _pod = drawPod;
    drawPod = function (p, t) {
      if (!/^dream/.test(p.theme)) return _pod(p, t);
      const sp = propSprite('pod-dream', 52, 60, 26, 52, (th, s) => {
        ctx.fillStyle = '#6A4A2A'; poly([-9, 0, 9, 0, 5, -4, -5, -4]); ctx.fill(); ctx.fillStyle = '#B88A4A'; ctx.fillRect(-6, -7, 12, 3); // the stand
        const egg = () => { ctx.beginPath(); ctx.moveTo(0, -42); ctx.bezierCurveTo(13, -42, 15, -16, 12, -10); ctx.bezierCurveTo(9, -5, -9, -5, -12, -10); ctx.bezierCurveTo(-15, -16, -13, -42, 0, -42); ctx.closePath(); };
        egg(); ctx.fillStyle = '#F2E6D2'; ctx.fill(); ctx.save(); egg(); ctx.clip();
        const g = ctx.createLinearGradient(-14 * s, 0, 14 * s, 0); g.addColorStop(0, 'rgba(120,90,70,.45)'); g.addColorStop(.6, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(-16, -44, 32, 40);
        ctx.fillStyle = 'rgba(255,255,255,.7)'; ell(s * 5, -32, 3, 6, -.3 * s); ctx.fill();
        ctx.strokeStyle = 'rgba(70,50,40,.8)'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(-10, -26); ctx.lineTo(-5, -23); ctx.lineTo(-1, -27); ctx.lineTo(4, -22); ctx.lineTo(9, -25); ctx.stroke(); // a crack, and light coming out
        ctx.restore();
      }, { foot: 8, seed: 61, haze: .05, line: .7 });
      propDraw(sp, p.x, p.y, { sh: 16, flash: FLASH });
      onMain(() => glowM(p.x - 1, p.y - 26, 12 + Math.sin(t * 1.4 + p.x) * 2, '255,230,170', .3));
    }; }

  // ---------------- what each of them does every frame ----------------
  const _upd = updateEnemy;
  updateEnemy = function (e, dt) {
    const decay = () => { e.flash = Math.max(0, e.flash - dt); e.jit = Math.max(0, e.jit - dt); e.flinch = Math.max(0, (e.flinch || 0) - dt); e.sqx += (1 - e.sqx) * Math.min(1, dt * 8); e.sqy += (1 - e.sqy) * Math.min(1, dt * 8); };
    if (e.def === BOSSES.sleeper) { if (e.dead) return _upd(e, dt); decay(); e.state = 'w6act'; e.vx = 0; e.vz = 0; e.air = false; e.plan = null; e.rageT = 0; e.enraged = false; return; } // (the 'w6sleep' rule moves it)
    if (e.type === 'w6crutch') { if (e.dead || e.state === 'enter') return _upd(e, dt); decay(); e.state = 'w6crutch'; e.vx = 0; e.z = 0; return; }
    if (e.dead) return _upd(e, dt);
    if (e.type === 'w6mannequin' && e.state === 'w6apart') { decay(); e.t -= dt; e.w6apartK = 1 - e.t / 2.8; if (e.t <= 0) { e.state = 'idle'; e.hp = Math.round(e.maxHp * .35); e.cd = .6; floatText(e.x, e.y, e.hh + 20, 'PUT TOGETHER AGAIN', '#F4E6C8', 12); sfx('hit-metal', .4); } return; }
    if (e.type === 'w6elephant') {
      if (!e.w6toppled && e.hp < e.maxHp * .5 && !['enter', 'dying'].includes(e.state)) { e.w6toppled = 1; e.w6fallT = 3.2; e.plan = null; floatText(e.x, e.y, 150, 'TIMBER!', '#FFE0A0', 18); sfx('crunch'); sfx('slam'); shakeMag = Math.max(shakeMag, 10); dust(e.x - 20, e.y, 10); dust(e.x + 20, e.y, 10); }
      if (e.w6fallT > 0) { decay(); e.w6fallT -= dt; e.state = 'w6fallen'; e.w6fallen = Math.min(1, (e.w6fallen || 0) + dt * 3); e.vx = 0; if (e.w6fallT <= 0) { e.state = 'idle'; e.cd = 1; floatText(e.x, e.y, 60, 'IT GETS BACK UP', '#F4E6C8', 12); } return; }
      e.w6fallen = Math.max(0, (e.w6fallen || 0) - dt * 1.4);
    }
    if (e.w6noApple > 0) e.w6noApple -= dt;
    if (W6.poolAt && !e.boss && e.state !== 'enter') { const p = W6.poolAt(e.x, e.y); e.w6pool = p ? p.kind : null; if (p) { if (Math.random() < dt * (p.kind === 'fast' ? 8 : 2)) parts.push({ x: e.x + rand(-10, 10), y: e.y, z: rand(4, 30), vx: 0, vy: 0, vz: p.kind === 'fast' ? 80 : 14, life: .6, max: .6, col: p.kind === 'fast' ? 'rgba(255,120,80,.7)' : 'rgba(255,220,130,.6)', size: rand(1.4, 2.4), shape: 'star', rot: 0, vr: 2 }); return _upd(e, dt * W6.POOL_F[p.kind]); } }
    return _upd(e, dt);
  };
  // the mannequin comes apart instead of dying (the first time); the dreamer's things die in their own ways
  const CUSTOM_DEATH = { w6clock: 'w6melt', w6skybird: 'w6paper', w6mannequin: 'w6pieces', w6elephant: 'w6topple', w6crutch: 'w6snap' };
  const _kill = killEnemy;
  killEnemy = function (e, dir, m) {
    if (e.type === 'w6mannequin' && !e.w6once && !(m && m.trump) && !e.dead) { e.w6once = 1; e.hp = 1; e.state = 'w6apart'; e.t = 2.8; e.w6apartK = 0; e.plan = null; e.vx = 0; e.air = false; e.z = 0;
      burst(e.x, e.y, 30, MAT_COL.china, 14, 'crystal', dir); sfx('break'); floatText(e.x, e.y, e.hh + 16, 'IN PIECES · FINISH IT', '#F4E6C8', 13); hitstop = Math.max(hitstop, .08); return; }
    _kill(e, dir, m);
    const cd = e.def === BOSSES.sleeper ? 'w6wake' : CUSTOM_DEATH[e.type];
    if (cd) { const wasPop = e.death === 'pop'; e.death = cd; e.air = false; e.spin = 0; e.rotA = 0; e.vx = e.def.move === 'fly' ? dir * 30 : 0; e.t = e.dmax = cd === 'w6wake' ? 3 : 1.5; if (wasPop && !e.boss) dropLoot(e); }
  };
  const _dd = drawDeath;
  drawDeath = function (e, t) {
    const d = e.death; if (!d || !/^w6/.test(d)) return _dd(e, t);
    const el = e.corpse ? (e.dmax || 1) : e.dmax - e.t, k = cl01(el / (e.dmax || 1)), a = { walk: 0, t: e.deadAt || t, wind: 0, hurt: true };
    ctx.save(); ctx.globalAlpha = e.fade !== undefined ? e.fade : 1;
    if (d === 'w6wake') { // the Sleeper wakes: its eyes fly open, and it is gone like a soap bubble, leaving the paint it was made of
      const S = e.w6S || {}; S.eyes = 1; S.mouth = 1 - k * .4; S.mood = .2;
      if (k < .999) { ctx.save(); ctx.translate(e.x, e.y - e.z - k * 40); ctx.scale(e.size * W6.HS * (1 + k * .15), e.size * W6.HS * (1 + k * .15)); ctx.globalAlpha *= 1 - sm((k - .35) / .65); sleeperHead({ t, eyes: 1, mouth: S.mouth, mood: .1, flush: 1 }); ctx.restore();
        onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 40; i++) { const u = hsh(i), life = cl01(k * 1.6 - u * .6), x = e.x + (hsh(i + 3) - .5) * 220 * (1 + life), y = e.y - e.z - 80 - life * 160 + (hsh(i + 7) - .5) * 120;
          ctx.fillStyle = `rgba(${['255,236,200', '200,220,255', '255,200,170'][i % 3]},${.7 * Math.sin(life * Math.PI)})`; ctx.save(); ctx.translate(x, y); ctx.rotate(hsh(i + 9) * 3); ctx.fillRect(-6, -1.4, 12, 2.8); ctx.restore(); } ctx.restore(); }); }
    } else if (d === 'w6melt') { // the clock melts into a puddle of gold, its numbers floating on it
      const pr = Math.min(1, el / 1.2); ctx.fillStyle = C('#D8A848'); ell(e.x, e.y, 10 + pr * 18, 3 + pr * 5); ctx.fill(); outline(1);
      if (DET()) { ctx.fillStyle = 'rgba(255,240,190,.7)'; ell(e.x - 6, e.y - 1, 6 * pr, 1.6 * pr); ctx.fill(); ctx.fillStyle = '#3A2A1A'; ctx.font = '700 5px Georgia, serif'; ctx.fillText('XII', e.x - 4, e.y + 2); }
      if (pr < 1) { ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.facing * (1 + pr * .6), 1 - pr * .92); CREATURES.w6clock(e, a); ctx.restore(); }
    } else if (d === 'w6paper') { // the hole closes up: the bird folds, crumples, and drifts down as a scrap of painted paper
      ctx.save(); ctx.translate(e.x, e.y - e.z); ctx.scale(e.facing * (1 - k * .7), 1 - k * .8); ctx.rotate(k * 2.4); ctx.globalAlpha *= 1 - sm((k - .7) / .3); CREATURES.w6skybird(e, a); ctx.restore();
    } else if (d === 'w6pieces') { const s = e.state; ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.facing, 1); e.state = 'w6apart'; e.w6apartK = 0; try { CREATURES.w6mannequin(e, { t: 0 }); } finally { e.state = s; } ctx.restore();
      if (el < .3) onMain(() => glowM(e.x, e.y - 10, 30, '255,240,210', .5 * (1 - el / .3)));
    } else if (d === 'w6topple') { // its legs fold under it like a heron's, and it settles, heavy, on the floor
      e.w6fallen = Math.min(1, el / .9); ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.facing, 1); ctx.translate(0, Math.sin(Math.min(1, el / .9) * Math.PI) * -6); CREATURES.w6elephant(e, a); ctx.restore();
    } else if (d === 'w6snap') { // the crutch snaps in two and its halves fall flat on the quilt
      const [dx, dy] = e.w6top || [0, -120], f = sm(el / .8), dir = Math.sign(e.dir || 1);
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(dir * f * 1.35 * .5); ctx.save(); ctx.beginPath(); ctx.rect(-200, dy * .45, 400, 300); ctx.clip(); W6_ART.crutchShape(0, 0, dx * (1 - f * .5), dy, 7, 16); ctx.restore(); ctx.restore();
      ctx.save(); ctx.translate(e.x + dx * .45 + dir * f * 40, e.y + dy * .45 * (1 - f)); ctx.rotate(-dir * f * 1.4); ctx.save(); ctx.beginPath(); ctx.rect(-200, -400, 400, 400 + 1); ctx.clip(); W6_ART.crutchShape(-dx * .45, -dy * .45 * 0, dx * .55, dy * .55, 7, 16); ctx.restore(); ctx.restore();
    }
    ctx.restore();
  };
  // the crutches and the sleeping face keep their own smooth paint (the brushwork modelling of a figure would cover the whole arena)
  { const _ha = hatchActor; hatchActor = function (...a) { if (W6.skipHatch) { W6.skipHatch = false; return; } return _ha(...a); }; }
  // blows: sinking into a sleeping head; landing harder on a fallen elephant; the Sleeper's waking held open by every hit
  const _strike = strike;
  strike = function (e, base, dir, m, echo) {
    if (e.def === BOSSES.sleeper) {
      if (e.dead) return;
      const B = W6.B || {};
      if (!B.vuln) { if (!(e.w6softMsg > performance.now())) { e.w6softMsg = performance.now() + 700; floatText(e.x, e.y - e.z + 20, 80, B.mode === 'asleep' || B.mode === 'rise' ? 'SOFT · STRIKE ITS CRUTCHES' : 'SOFT', '#F4E6C8', 12); }
        sfx('hit-goo', .3); e.sqx = 1.08; e.sqy = .94; burst(P.x + dir * 30, P.y, P.z + 40, ['#F4E2C8', '#E8C49C'], 4, 'goo', -dir); return; }
      if (B.mode === 'down') base *= 2.2; // (a face on the quilt is tender)
      const fl = e.phase === 1 ? .665 : e.phase === 2 ? .335 : 0, buf = fl ? 1e7 : 0; // (no single blow carries it through a dream: each must be lived through)
      e.hp += buf; let r; try { r = _strike(e, base, dir, m, echo); } finally { e.hp -= buf; }
      if (!e.dead && fl && e.hp < e.maxHp * fl) e.hp = Math.ceil(e.maxHp * fl);
      if (e.phase === 3 && B.iris) B.iris.r = Math.min(600, B.iris.r + 13);
      return r;
    }
    if (e.w6fallT > 0 && m) base *= 1.4;
    return _strike(e, base, dir, m, echo);
  };
  // apples and clock hands in flight
  const _dp = drawProj;
  drawProj = function (p, t) {
    if (p.w6apple) { shadow(p.x, p.y, 5); ctx.save(); ctx.translate(p.x, p.y - p.z); ctx.rotate(t * 9); apple(0, 0, 4.6); ctx.restore(); return; }
    if (p.w6hand) { shadow(p.x, p.y, 8); ctx.save(); ctx.translate(p.x, p.y - p.z); ctx.rotate(t * 22); ctx.lineCap = 'round';
      ctx.strokeStyle = C(INK); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(14, 0); ctx.stroke(); ctx.strokeStyle = C('#2A1A10'); ctx.lineWidth = 2.4; ctx.stroke();
      ctx.fillStyle = C('#2A1A10'); poly([14, -4, 22, 0, 14, 4]); ctx.fill(); outline(.8); ctx.fillStyle = C('#B03A2A'); circle(0, 0, 2.4); ctx.fill();
      ctx.restore(); onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,230,170,.35)'; ctx.lineWidth = 2; circle(p.x, p.y - p.z, 20); ctx.stroke(); ctx.restore(); }); return; }
    return _dp(p, t);
  };
  // this world's upright effects are drawn in depth with the figures, wherever they are
  const _mb = mechBoxes; mechBoxes = function (box) { _mb(box); for (const h of hazards) if (HZ[h.kind] && HZ[h.kind].box) HZ[h.kind].box(h, box); };
  const _ml = mechList; mechList = function (list, t) { _ml(list, t); for (const h of hazards) if (HZ[h.kind] && HZ[h.kind].ups && h.t > -.4) HZ[h.kind].ups(h, list, t); };
  // where he was a moment ago (for the soft clocks)
  const _up = updatePlayer;
  updatePlayer = function (dt) { _up(dt); const H = W6.hist || (W6.hist = []), now = performance.now() / 1000; if (P && P.state !== 'dead') H.push({ x: P.x, y: P.y, t: now }); while (H.length > 1 && H[1].t <= now - 1.5) H.shift(); if (H.length > 400) H.splice(0, H.length - 400); };
  // the Dream of the Board: the quilt turns into a chessboard, square by square from the middle out
  const _br = drawBossRoom;
  drawBossRoom = function (t) { _br(t);
    const B = W6.B; if (!stage || stage.theme !== 'dreamBoss' || !B || !(B.boardK > 0)) return;
    const Bd = W6.BOARD(), k = B.boardK, mid = (Bd.L + Bd.R) / 2;
    ctx.save(); ctx.translate(-camX, 0);
    for (let c = 0; c < Bd.nc; c++) for (let r = 0; r < Bd.nr; r++) { const x = Bd.L + c * Bd.cw, y = Bd.y0 + r * Bd.rh, d = Math.abs(x + Bd.cw / 2 - mid) / (Bd.R - Bd.L) * 2, q = cl01(k * 1.8 - d * .8); if (q <= 0) continue;
      const dark = (c + r) % 2; ctx.fillStyle = dark ? `rgba(26,18,30,${.62 * q})` : `rgba(246,236,214,${.5 * q})`; ctx.fillRect(x + (1 - q) * Bd.cw * .5, y + (1 - q) * Bd.rh * .5, Bd.cw * q, Bd.rh * q); }
    ctx.globalAlpha = k; ctx.strokeStyle = '#C8A060'; ctx.lineWidth = 2; ctx.strokeRect(Bd.L, Bd.y0, Bd.R - Bd.L, Bd.rh * 4); ctx.globalAlpha = 1;
    ctx.restore(); };
  // Waking: an iris of dark closes on the dream, lashes round its rim, like an eye closing on what it saw
  const _gf = gradeFrame;
  gradeFrame = function (id) { _gf(id);
    const B = W6.B; if (id !== 'dreamBoss' || !B || !B.iris || B.iris.r > 900 || mode === 'ending') return;
    const I = B.iris, cx = (lockX !== null ? lockX : stage.len - VW) + VW / 2 - camX, cy = FLOOR_TOP + 40, R = I.r, t = performance.now() / 1000;
    ctx.save(); ctx.beginPath(); ctx.rect(-10, Y_OFF - 10, VW + 20, VIEW_H + 20); ctx.arc(cx, cy, R, 0, TAU, true); ctx.fillStyle = '#07050C'; ctx.fill('evenodd');
    const g = ctx.createRadialGradient(cx, cy, Math.max(0, R - 40), cx, cy, R); g.addColorStop(0, 'rgba(7,5,12,0)'); g.addColorStop(1, 'rgba(7,5,12,.85)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = I.r < 170 ? `rgba(255,120,100,${.6 + .4 * Math.sin(t * 12)})` : 'rgba(230,220,255,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#1A1020'; ctx.lineWidth = 3; ctx.lineCap = 'round'; for (let i = 0; i < 40; i++) { const a = i / 40 * TAU + Math.sin(t * .5) * .02; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.quadraticCurveTo(cx + Math.cos(a + .05) * (R + 10), cy + Math.sin(a + .05) * (R + 10), cx + Math.cos(a + .1) * (R + 18), cy + Math.sin(a + .1) * (R + 18)); ctx.stroke(); }
    ctx.restore(); };

  // ---------------- the landmarks at the end of each area ----------------
  if (typeof THRESH !== 'undefined') {
    W6.EASEL = { cx: 8, top: FLOOR_TOP - 122, bot: FLOOR_TOP - 40, w: 112 };
    // the Piazza -> the Shore: an easel stands at the end of the square, its canvas a painting of the shore ahead so exact
    // that where the shore itself has begun to show behind it you cannot tell picture from place. Asleep it is only primed
    // and sketched; awake, the paint goes on, stroke by stroke
    THRESH.w6easel = {
      edge: (y) => y < 170 ? -330 + (y - 84) * .4 : lerp(-296, -170, thCl((y - 170) / 70)), feather: 130,
      hazeB: [-260, 70, 240, VH], haze(r) { for (let i = 0; i < 10; i++) softDab(-60 + r() * 200, 150 + r() * 90, 30 + r() * 40, i % 2 ? '255,226,170' : '230,190,140', .2); },
      backB: [-120, FLOOR_TOP - 150, 140, FLOOR_TOP + 16], back(r) {
        const E = W6.EASEL, x0 = E.cx - E.w / 2, x1 = E.cx + E.w / 2, T = FLOOR_TOP;
        ctx.lineCap = 'round'; ctx.strokeStyle = '#4A2E1A'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(E.cx, E.top - 16); ctx.lineTo(E.cx + 30, T + 8); ctx.stroke(); // the back leg
        ctx.strokeStyle = '#2A1A10'; ctx.lineWidth = 2; ctx.strokeRect(x0 - 2, E.top - 2, E.w + 4, E.bot - E.top + 4); // the stretcher's edge
        ctx.fillStyle = 'rgba(30,16,8,.35)'; ctx.fillRect(x1 + 2, E.top + 2, 4, E.bot - E.top); // its thickness, in shade
        for (const [ax, bx] of [[x0 + 18, x0 - 6], [x1 - 18, x1 + 6]]) { ctx.strokeStyle = '#3A2414'; ctx.lineWidth = 6.4; ctx.beginPath(); ctx.moveTo(ax, E.top - 22); ctx.lineTo(bx, T + 12); ctx.stroke(); ctx.strokeStyle = '#A8784A'; ctx.lineWidth = 4.4; ctx.stroke(); ctx.strokeStyle = '#E8B47A'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ax - 1.4, E.top - 22); ctx.lineTo(bx - 1.4, T + 12); ctx.stroke(); } // the front legs
        ctx.fillStyle = '#6A4428'; ctx.fillRect(x0 - 10, E.bot, E.w + 20, 6); ctx.fillStyle = '#D8A46A'; ctx.fillRect(x0 - 10, E.bot, E.w + 20, 1.6); // the ledge it stands on
        ctx.fillStyle = '#6A4428'; ctx.fillRect(E.cx - 8, E.top - 10, 16, 8); // the clamp at the top
        ctx.fillStyle = '#8A5A34'; ell(x1 + 30, T + 12, 18, 5); ctx.fill(); for (const [px, c] of [[x1 + 22, '#C8402E'], [x1 + 30, '#2E7A4E'], [x1 + 38, '#F2C860'], [x1 + 30, '#3A6AC8']]) { ctx.fillStyle = c; circle(px, T + 10 + (c === '#3A6AC8' ? 3 : 0), 2.4); ctx.fill(); } // the palette on the ground
      },
      live(x, k, t) { const E = W6.EASEL, o = thSm(k * 1.15), x0 = x + E.cx - E.w / 2;
        for (let i = 0; i < 14; i++) { if (thHash(i) < o) continue; const y = E.top + (i + .5) * (E.bot - E.top) / 14; ctx.fillStyle = i % 3 ? '#F2EAD8' : '#ECE2CC'; ctx.fillRect(x0, y - (E.bot - E.top) / 28 - 1, E.w, (E.bot - E.top) / 14 + 2); } // the priming, painted over stroke by stroke
        if (o < .9) { ctx.strokeStyle = `rgba(60,46,36,${.55 * (1 - o)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0 + 8, E.bot - 30); ctx.quadraticCurveTo(x0 + 40, E.bot - 52, x0 + 70, E.bot - 36); ctx.lineTo(x0 + E.w - 6, E.bot - 40); ctx.moveTo(x0 + 30, E.bot - 26); ctx.lineTo(x0 + 34, E.bot - 70); ctx.lineTo(x0 + 44, E.bot - 66); ctx.stroke(); } // the charcoal sketch under it
        if (o > .2) glowAt(x + E.cx, (E.top + E.bot) / 2, 90, '255,230,170', .16 * o + .05 * Math.sin(t * 2) * o);
        ctx.strokeStyle = '#2A1A10'; ctx.lineWidth = 2; ctx.strokeRect(x0 - 1, E.top - 1, E.w + 2, E.bot - E.top + 2);
      },
    };
    // the Shore -> the Bed: a great curtained bed stands at the end of the shore, its covers turned down. Asleep its
    // curtains are drawn; awake, they part, and soft Z's rise from the pillow: lie down, and sleep
    W6.BED = { x0: -70, x1: 130, top: FLOOR_TOP - 124, mat: FLOOR_TOP - 30 };
    THRESH.w6bed = {
      edge: (y) => y < 170 ? -340 + (y - 84) * .4 : lerp(-306, -190, thCl((y - 170) / 70)), feather: 140,
      hazeB: [-260, 70, 260, VH], haze(r) { for (let i = 0; i < 12; i++) softDab(-40 + r() * 220, 140 + r() * 100, 30 + r() * 40, i % 2 ? '200,210,240' : '150,160,210', .2); },
      backB: [-120, FLOOR_TOP - 150, 180, FLOOR_TOP + 24], back(r) {
        const D = W6.BED, T = FLOOR_TOP;
        const post = (x, h) => { ctx.fillStyle = '#3A2018'; ctx.fillRect(x - 3.5, T + 4 - h, 7, h); ctx.fillStyle = '#7A4A30'; ctx.fillRect(x - 3.5, T + 4 - h, 2.4, h); ctx.fillStyle = '#C8A060'; circle(x, T + 1 - h, 5); ctx.fill(); ctx.fillStyle = '#FFE6A8'; circle(x - 1.5, T - h, 1.6); ctx.fill(); };
        post(D.x0 + 6, 128); post(D.x1 - 6, 124); // the posts at its head
        ctx.fillStyle = '#4A2A1E'; ctx.beginPath(); ctx.moveTo(D.x0 + 6, D.mat); ctx.lineTo(D.x0 + 6, D.mat - 44); ctx.quadraticCurveTo((D.x0 + D.x1) / 2, D.mat - 76, D.x1 - 6, D.mat - 44); ctx.lineTo(D.x1 - 6, D.mat); ctx.fill(); // the headboard
        ctx.strokeStyle = '#C8A060'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(D.x0 + 14, D.mat - 40); ctx.quadraticCurveTo((D.x0 + D.x1) / 2, D.mat - 68, D.x1 - 14, D.mat - 40); ctx.stroke();
        ctx.fillStyle = '#E8E4F0'; ctx.fillRect(D.x0, D.mat - 2, D.x1 - D.x0, 22); ctx.fillStyle = '#B8B4CC'; ctx.fillRect(D.x0, D.mat + 14, D.x1 - D.x0, 6); // the mattress
        for (const px of [D.x0 + 34, D.x1 - 46]) { ctx.fillStyle = '#F8F6FC'; ell(px, D.mat - 6, 24, 10); ctx.fill(); ctx.fillStyle = 'rgba(150,150,190,.4)'; ell(px + 4, D.mat - 2, 20, 5); ctx.fill(); } // pillows
        ctx.fillStyle = '#C8C4DA'; poly([D.x0 + 60, D.mat + 2, D.x1, D.mat + 2, D.x1 + 8, T + 26, D.x0 + 40, T + 26]); ctx.fill(); ctx.fillStyle = '#F2F0F8'; poly([D.x0 + 60, D.mat + 2, D.x0 + 96, D.mat - 4, D.x0 + 80, D.mat + 10]); ctx.fill(); // the quilt, turned down
        ctx.strokeStyle = 'rgba(80,80,130,.4)'; ctx.lineWidth = .8; ctx.setLineDash([2, 2]); for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(D.x0 + 60 + i * 30, D.mat + 4); ctx.lineTo(D.x0 + 44 + i * 36, T + 24); ctx.stroke(); } ctx.setLineDash([]);
        post(D.x0 - 4, 136); post(D.x1 + 12, 132); // the posts at its foot
        ctx.fillStyle = '#3A2018'; ctx.fillRect(D.x0 - 8, D.top - 20, D.x1 - D.x0 + 24, 8); ctx.fillStyle = '#C8A060'; ctx.fillRect(D.x0 - 8, D.top - 20, D.x1 - D.x0 + 24, 2); // the tester rail
      },
      live(x, k, t) { const D = W6.BED, o = thSm(k * 1.2), T = FLOOR_TOP;
        for (const s of [0, 1]) { const cxp = s ? x + D.x1 + 12 : x + D.x0 - 4, w = lerp((D.x1 - D.x0) / 2 + 10, 14, o); // the curtains of red velvet, drawn, then tied back
          ctx.save(); ctx.translate(cxp, D.top - 12); ctx.scale(s ? -1 : 1, 1); const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#5A1418'); g.addColorStop(.5, '#A8303A'); g.addColorStop(1, '#6A1A20'); ctx.fillStyle = g;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.quadraticCurveTo(w * .7 + Math.sin(t) * 2, (T - D.top) * .5, w * (o > .5 ? .3 : 1), T + 14 - D.top); ctx.lineTo(0, T + 14 - D.top); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(30,6,8,.55)'; ctx.lineWidth = 1; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(w * i / 4, 0); ctx.quadraticCurveTo(w * i / 4 * .8, (T - D.top) * .5, w * i / 4 * (o > .5 ? .4 : 1), T + 14 - D.top); ctx.stroke(); }
          if (o > .5) { ctx.fillStyle = '#E8C060'; ctx.fillRect(0, (T - D.top) * .55, w * .5, 3); }
          ctx.restore(); }
        if (o > .1) { glowAt(x + (D.x0 + D.x1) / 2, D.mat - 10, 90, '220,220,255', .18 * o); ctx.save(); ctx.globalAlpha = o; snoreZs(x + D.x0 + 40, D.mat - 20, t, 1, .9); ctx.restore(); }
      },
    };
  }

  // ---------------- music: the dream, in a music box and a slow waltz ----------------
  if (typeof TRACKS !== 'undefined') {
    const Wb = (n, steps = 16) => n + ' -'.repeat(steps - 1);
    Object.assign(TRACKS, {
      // the Piazza: a music-box waltz in D, its harmony slipping into augmented chords that never quite resolve
      dream: { bpm: 104, n: 12, style: 'waltz', kit: 'soft', duty: .125, vib: 10, echo: .3, echoSteps: 3, arp: '..0.2.4.2.0.', arpDuty: .125, av: .05, form: ['A', 'B', 'A'], parts: {
        A: { chords: ['D', 'Daug', 'G', 'Gm', 'D', 'Bbaug', 'Em', 'A7'],
             lead: ['F#5 - - A5 - - D6 - - C#6 - -', 'A#5 - - - - - F#5 - - D5 - -', 'B5 - - G5 - - D5 - - G5 - -', 'A#5 - - - - - G5 - - D5 - -',
                    'A5 - - F#5 - - D5 - - F#5 - -', 'F#5 - - D5 - - A#4 - - D5 - -', 'G5 - - E5 - - B4 - - E5 - -', 'C#5 - - - - - E5 - - A5 - -'] },
        B: { chords: ['Bm', 'Gaug', 'G', 'Ebaug', 'Em', 'Caug', 'A', 'A7'],
             lead: ['D6 - - C#6 - - B5 - - F#5 - -', 'D#6 - - - - - B5 - - G5 - -', 'D6 - - B5 - - G5 - - D5 - -', 'G5 - - - - - B5 - - D#6 - -',
                    'E6 - - D6 - - B5 - - G5 - -', 'E5 - - G#5 - - C6 - - E6 - -', 'C#6 - - - - - A5 - - E5 - -', 'G5 - - - - - . . . . . .'] } } },
      // the Shore: slow and golden, the hours running down
      dream2: { bpm: 70, style: 'calm', duty: .5, vib: 14, echo: .35, echoSteps: 4, chords: ['Fmaj7', 'Em7', 'Dm7', 'Caug', 'Bbmaj7', 'Am7', 'Gm7', 'C7'],
        lead: ['A5 - - - G5 - - - F5 - - - E5 - - -', 'G5 - - - - - - - B4 - - - D5 - - -', 'F5 - - - E5 - - - D5 - - - C5 - - -', 'E5 - - - - - G#5 - - - - - E5 - - -',
               'D5 - - - F5 - - - A5 - - - D6 - - -', 'C6 - - - - - - - A5 - - - E5 - - -', 'F5 - - - G5 - - - A5 - - - Bb5 - - -', 'G5 - - - - - - - - - - - . . . .'] },
      // the Bed, before it is woken: a lullaby, very slow
      dreamBoss: { bpm: 58, n: 12, style: 'waltz', kit: 'soft', duty: .5, lv: .16, vib: 12, echo: .45, echoSteps: 3, chords: ['C', 'Am', 'F', 'G', 'C', 'Em', 'F', 'G'],
        lead: ['E5 - - G5 - - - - - E5 - -', 'C5 - - - - - E5 - - A4 - -', 'A4 - - C5 - - F5 - - - - -', 'D5 - - - - - G4 - - B4 - -', 'E5 - - G5 - - C6 - - - - -', 'B5 - - G5 - - E5 - - - - -', 'A5 - - F5 - - C5 - - A4 - -', 'B4 - - - - - - - - . . .'] },
      // the Sleeper: the lullaby gone wrong; then a march of chessmen; then the alarm, at a run
      boss_w6sleeper: { duty: .25, vib: 12, echo: .15, form: ['A', 'A', 'B', 'B', 'C', 'C'], parts: {
        A: { bpm: 96, n: 12, style: 'waltz', chords: ['Cm', 'Abaug', 'Fm', 'G7'], lead: ['Eb5 - - G5 - - C6 - - B5 - -', 'C6 - - - - - G#5 - - E5 - -', 'F5 - - Ab5 - - C6 - - Ab5 - -', 'B5 - - - - - D5 - - G5 - -'] },
        B: { bpm: 140, style: 'march', chords: ['Cm', 'G', 'Ab', 'G'], lead: ['C5 . C5 . G5 . G5 . Ab5 - G5 - F5 - Eb5 -', 'D5 . D5 . B4 . G4 . B4 - D5 - F5 - G5 -', 'Ab5 . Ab5 . F5 . C5 . Eb5 - F5 - G5 - Ab5 -', 'G5 - - - B5 - - - D6 - - - B5 - - -'] },
        C: { bpm: 172, style: 'battle', chords: ['Cm', 'Ab', 'Bb', 'G'], arp: '0123012301230123', lead: ['C6 - G5 - Eb5 - C5 - G5 - C6 - Eb6 - D6 -', 'C6 - Ab5 - Eb5 - C5 - Ab5 - C6 - Eb6 - C6 -', 'D6 - Bb5 - F5 - D5 - F5 - Bb5 - D6 - F6 -', 'D6 - - - B5 - - - G5 - - - B5 - D6 -'] } } },
    });
  }
  W6.ready = true;
  };
  window.w6Late = late;
  window.w6Dom = dom;
})();
