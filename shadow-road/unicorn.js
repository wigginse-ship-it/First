'use strict';
// ---------- the Unicorn of Amber, as she really is ----------
// secrets.js still paints her its own way (drawUnicorn, left exactly as it was). When she first comes into view she is
// that old drawing, untouched, for a few seconds; then it dissolves into this one: a white mare painted from life, with
// a long head and a dished face, an arched neck, a deep chest, clean jointed legs, a mane and tail of pearly hair and a
// spiralled horn. Each visit to her grove she is seen the old way first.
(() => {
  if (typeof drawUnicorn !== 'function') return;
  const OLD = drawUnicorn;
  const HOLD = 3, FADE = 2; // seconds in view as she was, then seconds of the dissolve
  const S = 1.02; // her scale beside the old drawing (a horse stands about as tall at the withers as a man's shoulder)
  const hsh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const sm = (k) => k * k * (3 - 2 * k);
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const bez = (p0, p1, p2, p3, k) => { const q = 1 - k; return q * q * q * p0 + 3 * q * q * k * p1 + 3 * q * k * k * p2 + k * k * k * p3; };

  // her palette: a pearly white coat shaded in cool lavender, warm where the light falls
  const LIT = '#FFFEFA', COAT = '#F6F4F7', MID = '#DCD7E6', SHD = '#ABA4C6', DEEP = '#726E98', FAR = '#B4AECB';
  const HAIR = '#F6F4FC', HAIRS = '#C4BEDC', HOOF = '#E4D6AE', HOOFD = '#9C8A62', SKIN = '#B9A8B8', EYE = '#17121F', INKL = 'rgba(52,40,72,';

  // ---- path helpers ----
  function through(pts, move) { // a smooth line through a list of points (cornering softly at each)
    const n = pts.length; if (move) ctx.moveTo(pts[0][0], pts[0][1]); else ctx.lineTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n - 1; i++) { const a = pts[i], b = pts[i + 1]; ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    ctx.lineTo(pts[n - 1][0], pts[n - 1][1]);
  }
  function sides(nodes) { // a limb or a lock: nodes [x, y, width] along its middle, out to its two edges
    const L = [], R = [], n = nodes.length;
    for (let i = 0; i < n; i++) {
      const a = nodes[Math.max(0, i - 1)], b = nodes[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, w = nodes[i][2] / 2;
      L.push([nodes[i][0] - dy / d * w, nodes[i][1] + dx / d * w]); R.push([nodes[i][0] + dy / d * w, nodes[i][1] - dx / d * w]);
    }
    return { L, R };
  }
  function strip(nodes) { const { L, R } = sides(nodes); ctx.beginPath(); through(L, true); through(R.slice().reverse(), false); ctx.closePath(); return { L, R }; }
  const clipDo = (path, fn) => { ctx.save(); path(); ctx.clip(); fn(); ctx.restore(); };
  function soft(x, y, r, rgb, a) { if (a <= 0) return; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.6, `rgba(${rgb},${a * .45})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
  function brush(x0, y0, x1, y1, n, r0, r1, col, a, seed) { // a scumble of small dabs over an area, for the grain of the brush
    for (let i = 0; i < n; i++) { const u = hsh(seed + i * 1.37), v = hsh(seed + i * 2.71 + 9); dab(x0 + (x1 - x0) * u, y0 + (y1 - y0) * v, r0 + (r1 - r0) * hsh(seed + i * .53), col, a); }
  }
  function pen(a, w, fn) { ctx.strokeStyle = INKL + a + ')'; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); fn(); ctx.stroke(); }
  let TIP = null;
  const rgbOf = (hex) => { const n = parseInt(hex.slice(1), 16); return `${n >> 16},${(n >> 8) & 255},${n & 255}`; };
  const SHDr = rgbOf(SHD), DEEPr = rgbOf(DEEP), LITr = rgbOf(LIT), MIDr = rgbOf(MID);

  // ---- her legs: bone and joint, a hoof at the foot ----
  // fore: elbow, forearm, knee, cannon, fetlock, pastern; hind: gaskin, hock, cannon, fetlock, pastern. lift: 0..1 the
  // foreleg raised and folded at the knee (pawing); far: the far side's pair, set back in shadow
  function foreNodes(x, lift, scrape) {
    const ex = x - 1, ey = -40; // the elbow
    const fa = -.04 - lift * .55, kx = ex + Math.sin(-fa) * 19, ky = ey + Math.cos(fa) * 19; // the forearm swings forward from the elbow
    const ca = fa + lift * 1.75 + scrape * lift * .3, cxv = kx - Math.sin(ca) * 13.5, cyv = ky + Math.cos(ca) * 13.5; // the cannon folds back at the knee
    const pa = ca + .62 - lift * .5, px = cxv + Math.sin(pa) * 4.2, py = cyv + Math.cos(pa) * 4.2; // the pastern slopes forward
    return { nodes: [[ex - 1.5, ey - 6, 10.5], [ex + .2, ey, 8.4], [(ex + kx) / 2 + .3, (ey + ky) / 2, 6.2], [kx, ky - 2.4, 5.1], [kx + .1, ky, 5.4], [kx + .1 - Math.sin(ca) * 2.6, ky + Math.cos(ca) * 2.6, 4.3],
      [cxv + Math.sin(ca) * 3.6, cyv - Math.cos(ca) * 3.6, 3.7], [cxv, cyv, 4.9], [(cxv + px) / 2, (cyv + py) / 2, 3.5], [px, py, 3.9]], foot: [px, py, pa] };
  }
  function hindNodes(x) {
    const sx = x + 5, sy = -38; // the stifle region, under the thigh
    return { nodes: [[sx - 2, sy - 6, 14], [sx - 4, sy, 11], [x - 2.5, -29, 7.2], [x - 5, -22.5, 6], [x - 5.4, -19.5, 5.8], [x - 4.4, -15.5, 4], [x - 4.1, -9.5, 3.8], [x - 4, -5.6, 4.9], [x - 2.6, -3, 3.5], [x - 1.4, -1.6, 3.9]],
      hock: [x - 6.9, -21], foot: [x - 1.4, -1.6, .62] };
  }
  function hoof(px, py, pa, col, dark) { // a hoof below the coronet, its front wall sloping with the pastern
    ctx.save(); ctx.translate(px, py); ctx.rotate(-(pa - .62) * .8);
    ctx.beginPath(); ctx.moveTo(-2.2, -.6); ctx.lineTo(1.6, -.9); ctx.quadraticCurveTo(2.7, .4, 3.6, 1.7); ctx.lineTo(-2.5, 1.8); ctx.quadraticCurveTo(-2.9, .5, -2.2, -.6); ctx.closePath();
    const g = ctx.createLinearGradient(0, -1, 0, 2); g.addColorStop(0, C(col)); g.addColorStop(1, C(dark)); ctx.fillStyle = g; ctx.fill();
    if (DETAIL_OK()) { pen(.5, .45, () => { ctx.moveTo(-2.3, -.5); ctx.lineTo(1.7, -.8); }); ctx.strokeStyle = 'rgba(255,250,235,.7)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(1.9, -.4); ctx.lineTo(3, 1.3); ctx.stroke(); }
    ctx.restore();
  }
  function leg(g, base, far, hind) { // paint one leg from its nodes: a cool shadow down the back, light down the front, joints marked
    const shape = () => strip(g.nodes);
    shape(); ctx.fillStyle = C(base); ctx.fill();
    if (DETAIL_OK()) clipDo(shape, () => {
      const { L, R } = sides(g.nodes); // L: the back of the leg (she faces +x)
      ctx.lineJoin = 'round';
      ctx.filter = 'blur(0.8px)'; ctx.strokeStyle = far ? 'rgba(96,90,130,.5)' : `rgba(${SHDr},.7)`; ctx.lineWidth = 2.4; ctx.beginPath(); through(L, true); ctx.stroke();
      if (!far) { ctx.strokeStyle = 'rgba(255,253,246,.9)'; ctx.lineWidth = 1.4; ctx.beginPath(); through(R.slice(2), true); ctx.stroke(); } ctx.filter = 'none';
      const top = g.nodes[0], tg = ctx.createLinearGradient(0, top[1], 0, top[1] + 12); tg.addColorStop(0, `rgba(${far ? '110,104,140' : SHDr},${far ? .5 : .55})`); tg.addColorStop(1, `rgba(${SHDr},0)`); ctx.fillStyle = tg; ctx.fillRect(top[0] - 12, top[1] - 4, 24, 16); // under the body
      for (let i = 0; i < g.nodes.length; i++) { const n = g.nodes[i]; if (n[2] > 4.6 && n[2] < 6) soft(n[0] - n[2] * .2, n[1], 2.8, far ? '90,84,120' : DEEPr, .14); } // the knobs of the joints
      if (g.hock) soft(g.hock[0] + 2.4, g.hock[1] + .6, 2.6, far ? '90,84,120' : DEEPr, .22);
      brush(top[0] - 6, top[1], top[0] + 6, -4, 10, .8, 1.6, far ? '#ADA7C4' : '#E4E0EC', .3, top[0] * 3.1);
    });
    if (DETAIL_OK() && !far) { // the knee or hock, the tendon down the back of the cannon, a fetlock's tuft of feather
      const n = g.nodes; pen(.28, .5, () => { const k = hind ? 5 : 4; ctx.moveTo(n[k][0] - n[k][2] * .1, n[k][1] - 1); ctx.lineTo(n[k + 1][0] - .4, n[k + 1][1]); });
      const f = n[hind ? 7 : 7]; ctx.fillStyle = C(HAIR); ctx.beginPath(); ctx.moveTo(f[0] - 2.4, f[1] - 1.5); ctx.quadraticCurveTo(f[0] - 3.6, f[1] + 2.5, f[0] - 2.6, f[1] + 4.4); ctx.quadraticCurveTo(f[0] - 1.4, f[1] + 2.6, f[0] + .6, f[1] + 1); ctx.closePath(); ctx.fill();
      pen(.22, .35, () => { ctx.moveTo(f[0] - 2.3, f[1]); ctx.quadraticCurveTo(f[0] - 2.9, f[1] + 2.4, f[0] - 2.5, f[1] + 3.8); });
    }
    const [hx, hy, ha] = g.foot; hoof(hx, hy, ha, far ? '#BFB28E' : HOOF, far ? '#7A6A4A' : HOOFD);
    if (!far && DETAIL_OK()) { ctx.fillStyle = C(HAIR); ctx.globalAlpha = .9; ell(hx - .2, hy - .2, 2.6, 1.2, 0); ctx.fill(); ctx.globalAlpha = 1; } // a fringe of feather over the coronet
  }

  // ---- her body: the deep chest, the back, the round of the quarters ----
  function bodyPath(br) {
    ctx.beginPath(); ctx.moveTo(14, -66.5);
    ctx.bezierCurveTo(6, -64.4, -4, -61.6, -12, -62.4); // the back, dipping a little behind the withers
    ctx.bezierCurveTo(-19, -63.4, -24, -66.6, -30, -65.6); // the loins rising to the croup
    ctx.bezierCurveTo(-36, -64.4, -40.6, -60, -41.4, -53.6); // the round of the quarters, down to the point of the buttock
    ctx.bezierCurveTo(-42, -47.6, -39.8, -42, -36.2, -37.4); // the back of the thigh
    ctx.bezierCurveTo(-34.6, -35, -33, -32.4, -31.8, -29); // into the gaskin
    ctx.lineTo(-24, -31);
    ctx.bezierCurveTo(-20.6, -34, -17.6, -38.4, -15.6, -41.6); // the stifle
    ctx.bezierCurveTo(-11, -41.6 + br * .4, -4, -37.6 + br, 4, -36.6 + br); // the belly, rising and falling as she breathes
    ctx.bezierCurveTo(10, -35.8 + br, 15, -36.4, 17.2, -38.6); // the girth, to the elbow
    ctx.bezierCurveTo(19.4, -37, 22.4, -35.4, 25.4, -35); ctx.lineTo(27.6, -35.4);
    ctx.bezierCurveTo(30, -38.4, 33.4, -42.4, 34.6, -47.4); // the chest
    ctx.bezierCurveTo(35.8, -51.6, 35, -55.4, 32, -58.4); // the point of the shoulder
    ctx.bezierCurveTo(26, -62.4, 20, -66.6, 14, -66.5); ctx.closePath();
  }
  function body(br) {
    bodyPath(br); const g = ctx.createLinearGradient(0, -68, 0, -34); g.addColorStop(0, C(LIT)); g.addColorStop(.45, C(COAT)); g.addColorStop(1, C(MID)); ctx.fillStyle = g; ctx.fill();
    if (!DETAIL_OK()) return;
    clipDo(() => bodyPath(br), () => {
      // the modelling: shadow under the barrel and behind the shoulder, in the flank's hollow and down the back of the thigh
      soft(2, -30 + br, 24, SHDr, .75); soft(-14, -36, 12, SHDr, .6); soft(16, -40, 10, DEEPr, .4); soft(-38, -38, 11, SHDr, .55); soft(30, -38, 9, SHDr, .5); soft(-4, -36, 14, DEEPr, .25);
      soft(-8, -46, 10, SHDr, .22); // the ribs rounding away
      // the light along the back, on the round of the quarters and the shoulder
      soft(-26, -60, 13, LITr, .9); soft(4, -62, 12, LITr, .7); soft(24, -55, 9, LITr, .6);
      // muscle, lightly: the shoulder blade's slope, the line of the triceps to the elbow, the hip and the seam of the hamstring
      ctx.lineCap = 'round'; ctx.filter = 'blur(1.2px)';
      ctx.strokeStyle = `rgba(${SHDr},.5)`; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(12, -63); ctx.quadraticCurveTo(18, -52, 27, -45); ctx.stroke(); // the back edge of the shoulder
      ctx.beginPath(); ctx.moveTo(13, -48); ctx.quadraticCurveTo(14, -42, 17.5, -38.5); ctx.stroke(); // the triceps into the elbow
      ctx.strokeStyle = `rgba(${SHDr},.3)`; ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.moveTo(-30, -52); ctx.quadraticCurveTo(-29, -44, -25, -37); ctx.stroke(); // the seam down the quarters
      ctx.strokeStyle = 'rgba(255,253,246,.9)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(24, -58); ctx.quadraticCurveTo(30, -53, 31.6, -47); ctx.stroke(); // light on the point of the shoulder
      ctx.beginPath(); ctx.moveTo(-34, -60); ctx.quadraticCurveTo(-30, -63.4, -22, -64); ctx.stroke(); // and on the croup
      ctx.filter = 'none';
      brush(-40, -66, 34, -36, 40, 1.4, 3, '#FFFFFF', .07, 11); brush(-40, -48, 34, -34, 22, 1.4, 2.8, '#C9C3DA', .08, 37); // the grain of the brush
    });
    pen(.32, .5, () => { ctx.moveTo(-15.6, -41.4); ctx.quadraticCurveTo(-13, -40.4, -10, -40.8); }); // the fold of the stifle
    pen(.26, .45, () => { ctx.moveTo(17.2, -38.6); ctx.quadraticCurveTo(15.6, -41, 14.4, -43); }); // the elbow
  }

  // ---- her neck and head: the crest arched, the head carried on it like a swan's, the face long and finely dished ----
  const POLL = [47.4, -91.6], HEAD_A = .99; // the poll, and the head's slope from it down to the muzzle
  function crestAt(k) { // along the top of the neck from the poll (0) to the withers (1)
    const P = [[46.6, -93.6], [31, -88.6], [18, -73], [13, -66]]; return [bez(P[0][0], P[1][0], P[2][0], P[3][0], k), bez(P[0][1], P[1][1], P[2][1], P[3][1], k)];
  }
  function neckPath() {
    ctx.beginPath(); ctx.moveTo(6, -64); ctx.lineTo(13, -66);
    ctx.bezierCurveTo(18, -73, 31, -88.6, 46.6, -93.6); // the crest
    ctx.lineTo(49.6, -89); ctx.lineTo(46, -83);
    ctx.bezierCurveTo(44.4, -73, 40, -62, 35.2, -51); // the throat and the jugular groove, down to the chest
    ctx.bezierCurveTo(34, -48, 32, -47, 28, -48); ctx.lineTo(18, -54); ctx.closePath();
  }
  function neck() {
    neckPath(); const g = ctx.createLinearGradient(20, -90, 42, -60); g.addColorStop(0, C(LIT)); g.addColorStop(.55, C(COAT)); g.addColorStop(1, C(MID)); ctx.fillStyle = g; ctx.fill();
    if (!DETAIL_OK()) return;
    clipDo(neckPath, () => {
      soft(44, -68, 10, SHDr, .6); soft(44, -84, 6, SHDr, .5); soft(35, -52, 9, SHDr, .5); // under the jaw, down the throat
      soft(30, -82, 10, LITr, .9); soft(20, -70, 9, LITr, .7);
      ctx.filter = 'blur(1px)'; ctx.strokeStyle = `rgba(${SHDr},.5)`; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(42.4, -82); ctx.quadraticCurveTo(39.6, -68, 33.4, -55); ctx.stroke(); // the jugular groove
      ctx.strokeStyle = 'rgba(255,253,246,.8)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(37, -82); ctx.quadraticCurveTo(33, -68, 27, -58); ctx.stroke(); ctx.filter = 'none'; // the neck's muscle catching the light
      brush(14, -96, 42, -50, 22, 1.1, 2.2, '#FFFFFF', .25, 71);
    });
  }
  function headPath(open) { // in the head's own frame: the poll at 0,0, the muzzle out along +x, the jaw on +y
    ctx.beginPath(); ctx.moveTo(-1.6, -2.4);
    ctx.quadraticCurveTo(2, -5, 6, -5.2); // the forehead, broad between the eyes
    ctx.bezierCurveTo(10, -5.4, 13.6, -4.4, 17.4, -4.1); // the face, finely dished below the eyes
    ctx.bezierCurveTo(21, -3.9, 24.4, -3.8, 26.2, -3.1); // the bridge of the nose
    ctx.bezierCurveTo(28.2, -2.3, 28.8, .2, 28.2, 1.8); // the soft round of the muzzle
    ctx.quadraticCurveTo(27.8, 3, 26.6, 3.2 + open * .6); // the upper lip
    ctx.lineTo(25.2, 3.4 + open);
    ctx.quadraticCurveTo(26.2, 4.4 + open, 25.2, 5.3 + open); // the lower lip
    ctx.quadraticCurveTo(23.8, 5.9 + open * .5, 22.6, 5.3); // the chin
    ctx.bezierCurveTo(19.4, 4.6, 16.4, 4.8, 13.2, 5.8); // the jaw, slender toward the mouth
    ctx.bezierCurveTo(9.4, 7.2, 6.8, 9.4, 3.6, 9.2); // the round of the cheek
    ctx.bezierCurveTo(.6, 9, -1.6, 6.6, -2.2, 3.6); // the back of the jaw, up into the throat
    ctx.quadraticCurveTo(-2.6, .4, -1.6, -2.4); ctx.closePath();
  }
  function ear(x, y, a, len, col, inner) { // a long ear, cupped forward
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    const p = () => { ctx.beginPath(); ctx.moveTo(-2, 0); ctx.bezierCurveTo(-2.8, -len * .45, -1.2, -len * .85, .3, -len); ctx.bezierCurveTo(1.6, -len * .7, 2.6, -len * .4, 2, 0); ctx.closePath(); };
    p(); ctx.fillStyle = C(col); ctx.fill();
    if (inner && DETAIL_OK()) { ctx.fillStyle = C('#BCB2C8'); ctx.beginPath(); ctx.moveTo(-.2, -1); ctx.bezierCurveTo(-.9, -len * .45, .1, -len * .78, .5, -len * .85); ctx.bezierCurveTo(1.4, -len * .6, 1.6, -len * .3, 1.2, -1); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(-1.6, -1); ctx.bezierCurveTo(-2.2, -len * .45, -1, -len * .8, .2, -len * .95); ctx.stroke(); }
    ctx.restore();
  }
  function horn(bx, by, ang, len, t) { // a long spiralled horn of pearl, rising from her brow
    ctx.save(); ctx.translate(bx, by); ctx.rotate(ang); // the horn runs out along +x
    const w0 = 3.4, p = () => { ctx.beginPath(); ctx.moveTo(0, -w0 / 2); ctx.quadraticCurveTo(len * .55, -w0 * .3, len, 0); ctx.quadraticCurveTo(len * .55, w0 * .3, 0, w0 / 2); ctx.closePath(); };
    p(); const g = ctx.createLinearGradient(0, -w0 / 2, 0, w0 / 2); g.addColorStop(0, C('#FFFBEF')); g.addColorStop(.5, C('#EDE2C8')); g.addColorStop(1, C('#B7A47E')); ctx.fillStyle = g; ctx.fill();
    if (DETAIL_OK()) clipDo(p, () => {
      for (let i = 0; i < 9; i++) { // the twist: a groove winding round it, and the light on each turn
        const x0 = 1.2 + i * len / 9.4, w = w0 * (1 - x0 / len * .85);
        ctx.strokeStyle = 'rgba(120,98,66,.65)'; ctx.lineWidth = .55; ctx.beginPath(); ctx.moveTo(x0, -w / 2 - .3); ctx.quadraticCurveTo(x0 + 1.6, 0, x0 + 2.6, w / 2 + .3); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,250,.8)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(x0 + .7, -w / 2 - .2); ctx.quadraticCurveTo(x0 + 1.6, -w / 4, x0 + 2, 0); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'soft-light'; // a play of colour running up it
      const hg = ctx.createLinearGradient(0, 0, len, 0); for (let i = 0; i <= 4; i++) hg.addColorStop(i / 4, `hsla(${(t * 40 + i * 70) % 360},90%,70%,.7)`); ctx.fillStyle = hg; ctx.fillRect(0, -w0, len, w0 * 2);
    });
    const M = ctx.getTransform(); TIP = [M.a * len + M.e, M.b * len + M.f];
    ctx.restore();
  }
  function lock(nodes, col, shadeCol, lit) { // a lock of hair: a tapered ribbon, a strand or two drawn down it
    const { L, R } = strip(nodes); const n = nodes.length;
    ctx.fillStyle = C(col); ctx.fill();
    if (!DETAIL_OK()) return;
    const at = (P, f, from = 0, to = n) => nodes.slice(from, to).map(([x, y], i) => [x + (P[i + from][0] - x) * f, y + (P[i + from][1] - y) * f]);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = shadeCol; ctx.globalAlpha = .55; ctx.lineWidth = .7; ctx.beginPath(); through(at(L, .8, 0, n - 1), true); ctx.stroke(); ctx.globalAlpha = 1; // the shadowed side of the lock
    if (n > 8) { ctx.strokeStyle = 'rgba(150,140,190,.32)'; ctx.lineWidth = .3; ctx.beginPath(); through(at(L, .3, 2, n - 2), true); ctx.stroke(); } // a strand down the longer ones
    if (lit) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = .5; ctx.beginPath(); through(at(R, .45, 0, n - 2), true); ctx.stroke(); }
  }
  function flow(x0, y0, dx0, dy0, len, w0, wave, ph, N = 9, curl = 0) { // the middle line of a lock falling from a root, rippling
    const out = []; let x = x0, y = y0, a = Math.atan2(dy0, dx0);
    for (let i = 0; i <= N; i++) {
      const k = i / N; out.push([x, y, Math.max(.35, w0 * (1 - k * .92) * Math.min(1, .5 + k * 4))]);
      a += (Math.sin(ph + k * 4.2) * wave + curl * k) / N; x += Math.cos(a) * len / N; y += Math.sin(a) * len / N;
    }
    return out;
  }

  // ---- painted once, kept: the parts of her that hold still are painted onto little canvases at the page's resolution ----
  const SPR = new Map();
  function spr(key, x0, y0, w, h, fn) {
    if (!DETAIL_OK()) { fn(1); return; }
    const M = ctx.getTransform(), sc = Math.max(.5, Math.ceil(Math.hypot(M.a, M.b) * 4) / 4), id = key + '@' + sc;
    let c = SPR.get(id);
    if (!c) {
      if (SPR.size > 40) { for (const v of SPR.values()) retire(v); SPR.clear(); }
      const [cc, g] = texCanvas(Math.ceil(w * sc) + 2, Math.ceil(h * sc) + 2), old = ctx;
      g.setTransform(sc, 0, 0, sc, -x0 * sc + 1, -y0 * sc + 1); ctx = g; try { fn(sc); } finally { ctx = old; }
      c = cc; SPR.set(id, c);
    }
    ctx.drawImage(c, x0 - 1 / sc, y0 - 1 / sc, c.width / sc, c.height / sc);
  }

  // ---- the whole of her ----
  // the moment of her idling: breathing, a slow nod, now and then a toss of the head, a flick of an ear, a blink,
  // a swish of the tail, and once in a while she paws the ground
  function motion(t) {
    const ef = (p, n, d) => { const c = Math.floor(t / p), s = hsh(c * 7.7 + n) * (p - d - .2), u = (t - c * p) - s; return u > 0 && u < d ? Math.sin(u / d * Math.PI) : 0; }; // a brief event once in each period, at a random moment of it
    const toss = ef(9.4, 3, 1.3), paw = ef(12.6, 5, 2.2);
    return {
      breathe: Math.sin(t * 1.3), nod: Math.sin(t * .7) * .035 - toss * .16, head: Math.sin(t * .7 + .9) * .05 - toss * .12,
      earN: ef(3.1, 1, .45) * .6, earF: ef(4.3, 2, .5) * .7, blink: ef(4.7, 4, .18), paw: sm(cl(paw * 1.6)), scrape: Math.sin(t * 7), toss,
      tail: Math.sin(t * 1.6) + ef(6.8, 6, 1.1) * 1.8 * Math.sin(t * 6), mane: t,
    };
  }
  function tail(sw, t) { // the dock arched from the croup, then a long fall of hair, full in the middle, rippling and swaying
    const X = [-45, -50.5 + sw * .8, -46 + sw * 2.4, -50 + sw * 4.4], Y = [-55, -44, -26, -5];
    const mid = (k) => { const q = 1 - k; return [q * q * q * X[0] + 3 * q * q * k * X[1] + 3 * q * k * k * X[2] + k * k * k * X[3], q * q * q * Y[0] + 3 * q * q * k * Y[1] + 3 * q * k * k * Y[2] + k * k * k * Y[3]]; };
    const spread = (k) => 1.2 + Math.sin(Math.PI * k ** .8) * 4.8 * (1 - k * .2); // the half-width of the fall of hair down its length
    const line = (o, w0, len, ph) => { const pts = []; for (let i = 0; i <= 10; i++) { const k = i / 10 * len, [x, y] = mid(k), wv = Math.sin(ph + k * 6.5 - t * 2.4) * k * (1.2 + Math.abs(o) * .3);
      pts.push([x + o * spread(k) + wv, y + Math.abs(o) * k * 1.6, Math.max(.25, w0 * (1 - (i / 10) ** 1.6 * .92))]); } return pts; };
    ctx.beginPath(); through(line(-1.05, 0, 1, 0).map(p => [p[0] - .8, p[1]]), true); through(line(1.05, 0, .96, 1.4).map(p => [p[0] + .8, p[1]]).reverse(), false); ctx.closePath();
    ctx.fillStyle = C('#BDB6D6'); ctx.fill(); // the body of the tail, shadowed within
    for (let i = 0; i < 13; i++) { const o = ((i * 5) % 13 - 6) / 6, len = .7 + hsh(i * 3.3) * .3;
      lock(line(o, 2.8, len, o * 1.4 + hsh(i) * 1.5), i % 3 === 0 ? HAIR : i % 3 === 1 ? '#EAE6F6' : '#D9D3EA', 'rgba(140,130,186,.8)', i % 2 === 0); }
    ctx.fillStyle = C(COAT); strip([[-35, -63.4, 6], [-40.5, -62, 5.6], [-43.6, -58.6, 5], [-45, -54.4, 4.2]]); ctx.fill(); // the dock, under its hair
    lock([[-36, -64.4, 3.6], [-41, -63, 4.2], [-44.4, -59.6, 4.2], [-46.2, -55, 3.8], [-47.4 + sw * .2, -50, 3]], HAIR, 'rgba(140,130,186,.8)', true);
  }
  function mane(t) { // the long mane, falling on the near side of the neck from the crest, drifting
    // a ruff of it showing over the crest from the far side
    ctx.beginPath(); { const top = [], bot = []; for (let i = 0; i <= 14; i++) { const k = i / 14, [cx, cy] = crestAt(k), wv = Math.sin(k * 23 + t * 1.6) * .7 + 2.2 + Math.sin(k * Math.PI) * 1.4; top.push([cx - wv * .75, cy - wv * .65]); bot.push([cx + 1.6, cy + 2.2]); } through(top, true); through(bot.reverse(), false); ctx.closePath(); }
    ctx.fillStyle = C('#DAD4EA'); ctx.fill();
    // the mass of the near side, then its locks over it
    const roots = [], tips = [];
    for (let i = 0; i <= 12; i++) { const k = i / 12, [cx, cy] = crestAt(k), len = 9 + Math.sin(k * Math.PI) * 15 + k * 3, a = 1.95 - k * .5 + Math.sin(t * 1.3 - k * 4) * .07;
      roots.push([cx + .4, cy + .6]); tips.push([cx + Math.cos(a) * len + Math.sin(t * 1.9 - i) * .8, cy + Math.sin(a) * len]); }
    ctx.beginPath(); through(roots, true); through(tips.slice().reverse(), false); ctx.closePath();
    const mg = ctx.createLinearGradient(30, -96, 18, -60); mg.addColorStop(0, C('#E4E0F0')); mg.addColorStop(1, C('#C8C1DE')); ctx.fillStyle = mg; ctx.fill();
    for (let i = 0; i < 17; i++) {
      const k = .01 + i * .06, [cx, cy] = crestAt(k), len = 10 + Math.sin(k * Math.PI) * 16 + k * 3 + hsh(i * 5.1) * 4, a = 1.95 - k * .5 + (hsh(i * 2.3) - .5) * .3;
      const pts = flow(cx + .4, cy + .4, Math.cos(a), Math.sin(a), len, 4.2, 1.25, t * 1.9 - i * .8 + hsh(i * 9) * 2, i % 3 ? 7 : 9, .3 + hsh(i) * .8);
      lock(pts, i % 3 === 2 ? '#E6E2F2' : HAIR, 'rgba(140,130,186,.85)', i % 2 === 0);
    }
    if (DETAIL_OK()) { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; for (let i = 0; i < 3; i++) { const [cx, cy] = crestAt(.2 + i * .3); soft(cx - 3 + Math.sin(t * .5 + i) * 2, cy + 9, 10, i === 1 ? '150,220,255' : i ? '255,170,230' : '190,160,255', .6); } ctx.restore(); } // a rainbow sheen in the hair
  }
  const HS = 1.1; // her head, a touch larger than the neck it was drawn for: a horse's head is long
  function head(m, t) { // in the poll's frame, already turned by the head's slope
    spr('head', -4, -8, 36, 20, () => {
      headPath(0); { const g = ctx.createLinearGradient(0, -5, 0, 9); g.addColorStop(0, C(LIT)); g.addColorStop(.5, C(COAT)); g.addColorStop(1, C(MID)); ctx.fillStyle = g; ctx.fill(); }
      if (!DETAIL_OK()) return;
      clipDo(() => headPath(0), () => {
        soft(4, 4.6, 6.4, SHDr, .5); soft(2, 9.4, 6, DEEPr, .35); soft(15, 5, 6, SHDr, .35); // the cheek, rounded; under the jaw
        soft(12, -3, 6, LITr, 1); soft(22, -2.6, 5, LITr, .8); // light down the face
        const mg = ctx.createRadialGradient(26, 1.6, 0, 26, 1.6, 6.4); mg.addColorStop(0, 'rgba(170,140,166,.8)'); mg.addColorStop(1, 'rgba(170,140,166,0)'); ctx.fillStyle = mg; ctx.fillRect(18, -6, 12, 14); // the soft grey-pink of the muzzle
        ctx.filter = 'blur(0.6px)'; ctx.strokeStyle = `rgba(${SHDr},.75)`; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-1, 2); ctx.bezierCurveTo(2.4, .6, 8, 1.6, 9.8, 5.8); ctx.stroke(); // the great round of the jaw
        ctx.beginPath(); ctx.moveTo(8.6, -.6); ctx.quadraticCurveTo(12, .4, 15.4, 2.8); ctx.stroke(); // the facial crest below the eye
        ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(9, -4); ctx.bezierCurveTo(14, -3.2, 20, -2.8, 25.6, -2.2); ctx.stroke(); ctx.filter = 'none';
        soft(8.8, -1.9, 3.8, SHDr, .6); // the hollow the eye sits in
        brush(0, -5, 26, 8, 12, .8, 1.6, '#FFFFFF', .25, 5);
      });
      pen(.4, .45, () => { ctx.moveTo(6, -4.7); ctx.quadraticCurveTo(8.6, -5.6, 11.4, -4.4); }); // the brow
      ctx.fillStyle = C('#5A4A66'); ctx.beginPath(); ctx.moveTo(24.6, -1.6); ctx.quadraticCurveTo(26.8, -1.8, 26.6, .4); ctx.quadraticCurveTo(26, 1.4, 24.8, .9); ctx.quadraticCurveTo(25.8, .2, 24.6, -1.6); ctx.closePath(); ctx.fill(); // the nostril
      pen(.5, .45, () => { ctx.moveTo(24.4, -1.8); ctx.quadraticCurveTo(23.4, -.4, 24.4, 1); }); pen(.6, .5, () => { ctx.moveTo(26.6, 3.3); ctx.quadraticCurveTo(25, 3.7, 23.4, 3.3); }); pen(.3, .4, () => { ctx.moveTo(23, 5.3); ctx.quadraticCurveTo(24.2, 4.6, 25.4, 4.4); }); // the mouth, the chin
    });
    // the eye: large, dark and liquid, set high on the side of the head, lashes long
    const ex = 8.8, ey = -1.9;
    if (m.blink > .5) { ctx.fillStyle = C('#D6D0E2'); ell(ex, ey, 2.1, 1.5, -.35); ctx.fill(); pen(.8, .7, () => { ctx.moveTo(ex - 2, ey + .5); ctx.quadraticCurveTo(ex, ey + 1.3, ex + 2, ey + .3); }); }
    else {
      ctx.save(); ctx.translate(ex, ey); ctx.rotate(-.35);
      ell(0, 0, 2, 1.35); ctx.fillStyle = C(EYE); ctx.fill();
      if (DETAIL_OK()) { ctx.fillStyle = 'rgba(96,74,128,.9)'; ell(.5, .45, 1.1, .7); ctx.fill(); ctx.fillStyle = EYE; ell(-.1, -.15, .95, .7); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ell(-.7, -.5, .48, .36); ctx.fill(); ctx.fillStyle = 'rgba(200,230,255,.8)'; ell(.9, .5, .24, .17); ctx.fill(); }
      pen(.9, .6, () => { ctx.moveTo(-2.2, .1); ctx.quadraticCurveTo(-.3, -1.9, 2.1, -.2); }); // the upper lid
      if (DETAIL_OK()) pen(.65, .32, () => { for (let i = 0; i < 4; i++) { const u = -1.3 + i * .9; ctx.moveTo(u, -1.2 + Math.abs(u) * .3); ctx.lineTo(u - .5, -2.1 + Math.abs(u) * .25); } }); // lashes
      ctx.restore();
    }
  }
  function drawNew(x, y, t, o = {}) {
    const m = motion(t), base = ctx.getTransform(); TIP = null;
    ctx.save(); ctx.translate(x, y); ctx.scale(-S, S);
    if (o.shadow !== false) shadowOf(1);
    spr('far', -34, -50, 60, 52, () => { leg(foreNodes(16, 0, 0), FAR, true, false); leg(hindNodes(-21), FAR, true, true); }); // the far legs, in the shade of her body
    tail(m.tail, t);
    ctx.save(); ctx.translate(0, -66); ctx.scale(1 + m.breathe * .004, 1 + m.breathe * .01); ctx.translate(0, 66); // she breathes
    spr('body', -46, -70, 86, 42, () => body(0));
    ctx.restore();
    if (DETAIL_OK()) clipDo(() => bodyPath(0), () => { // a pearly play of colour over the coat, slowly drifting
      ctx.globalCompositeOperation = 'soft-light';
      for (let i = 0; i < 3; i++) { const h = (t * 14 + i * 120) % 360, px = -26 + i * 24 + Math.sin(t * .4 + i) * 6, py = -54 + Math.cos(t * .3 + i * 2) * 5, gg = ctx.createRadialGradient(px, py, 0, px, py, 18); gg.addColorStop(0, `hsla(${h},90%,72%,.5)`); gg.addColorStop(1, `hsla(${h},90%,72%,0)`); ctx.fillStyle = gg; ctx.fillRect(px - 18, py - 18, 36, 36); }
    });
    spr('hind', -40, -52, 26, 55, () => leg(hindNodes(-26), COAT, false, true));
    if (m.paw > .001) leg(foreNodes(22, m.paw, m.scrape), COAT, false, false); // the foreleg paws the ground now and then
    else spr('fore', 8, -52, 26, 55, () => leg(foreNodes(22, 0, 0), COAT, false, false));
    // the neck and head, nodding together from the withers
    ctx.save(); ctx.translate(24, -56); ctx.rotate(m.nod); ctx.translate(-24, 56);
    spr('neck', 4, -101, 46, 56, () => neck());
    mane(t);
    ctx.save(); ctx.translate(POLL[0], POLL[1]); ctx.rotate(m.head); ctx.scale(HS, HS);
    ear(-1.8, -1.6, -.3 - m.earF * .9, 7, FAR, false); // the far ear
    ctx.rotate(HEAD_A); head(m, t); ctx.rotate(-HEAD_A);
    const hb = (() => { const c = Math.cos(HEAD_A), s = Math.sin(HEAD_A), hx = 6.4, hy = -5; return [hx * c - hy * s, hx * s + hy * c]; })();
    horn(hb[0], hb[1], -1.22, 23, t);
    ear(.9, -2.6, -.1 - m.earN * .9, 7.6, COAT, true);
    ctx.rotate(HEAD_A); // the forelock, falling forward over her brow either side of the horn
    for (let i = 0; i < 4; i++) lock(flow(.4 + i * 1.3, -4.4 + i * .1, 1, .5 + i * .12, 7 + i * 1.6, 3, .9, t * 2.2 + i, 6, .9), i % 2 ? HAIR : '#E6E2F2', 'rgba(140,130,186,.85)', true);
    ctx.restore();
    ctx.restore();
    ctx.restore();
    if (TIP) { const p = base.inverse().transformPoint(new DOMPoint(TIP[0], TIP[1])); m.tip = [p.x, p.y]; }
    return m;
  }
  function shadowOf(a) { // her shadow on the grass: soft, long, the four hooves set down in it
    const f = () => { ctx.save(); ctx.globalAlpha *= a; ctx.scale(1, .26); const r = 54, g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, 'rgba(30,20,52,.42)'); g.addColorStop(.6, 'rgba(30,20,52,.24)'); g.addColorStop(1, 'rgba(30,20,52,0)'); ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2); ctx.restore();
      ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgba(30,20,52,.3)'; for (const hx of [-26, -21, 16, 22]) { ell(hx - 1, .4, 4.4, 1.3); ctx.fill(); } ctx.restore(); };
    if (inkG && (ctx === inkG || ctx === heroG)) onMain(f); else f();
  }

  // ---- the dissolve: the old drawing gives way to the new ----
  let seen = { key: null, age: -1, last: 0 };
  const bufs = [null, null, null];
  function buf(i, w, h) { let b = bufs[i]; if (!b || b[0].width < w || b[0].height < h) { if (b) retire(b[0]); b = bufs[i] = texCanvas(Math.max(w, b ? b[0].width : 0), Math.max(h, b ? b[0].height : 0)); } return b; }
  function blend(x, y, t, k) { // both drawings painted apart at the page's own resolution, then mixed by k and laid down as one figure
    const m = ctx.getTransform(), cv0 = ctx.canvas, xs = [], ys = [];
    for (const [px, py] of [[x - 100, y - 140], [x + 100, y - 140], [x - 100, y + 14], [x + 100, y + 14]]) { xs.push(m.a * px + m.c * py + m.e); ys.push(m.b * px + m.d * py + m.f); }
    const bx = Math.max(0, Math.floor(Math.min(...xs))), by = Math.max(0, Math.floor(Math.min(...ys))), w = Math.min(cv0.width, Math.ceil(Math.max(...xs))) - bx, h = Math.min(cv0.height, Math.ceil(Math.max(...ys))) - by;
    if (w < 1 || h < 1) return null;
    const old = ctx, sh = shadow, paint = (i, fn) => { const [c, g] = buf(i, w, h); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, w, h); g.setTransform(m.a, m.b, m.c, m.d, m.e - bx, m.f - by);
      ctx = g; try { fn(); } finally { ctx = old; } return c; };
    // the shadows go down on the page under the figures, each at its share
    const shOld = () => { ctx.save(); ctx.globalAlpha = 1 - k; ctx.fillStyle = 'rgba(40,20,60,.3)'; ell(x, y, 40, 40 * .28); ctx.fill(); ctx.restore(); };
    if (inkG && ctx === inkG) onMain(shOld); else shOld();
    ctx.save(); ctx.translate(x, y); ctx.scale(-S, S); shadowOf(k); ctx.restore();
    shadow = () => {}; // (the old drawing's own shadow is laid down above, faded)
    let a, b; try { a = paint(0, () => OLD(x, y, t)); } finally { shadow = sh; }
    let mo; b = paint(1, () => { mo = drawNew(x, y, t, { shadow: false }); });
    const [mc, mg] = buf(2, w, h); mg.setTransform(1, 0, 0, 1, 0, 0); mg.globalAlpha = 1; mg.globalCompositeOperation = 'copy'; mg.clearRect(0, 0, w, h);
    mg.globalCompositeOperation = 'source-over'; mg.globalAlpha = 1 - k; mg.drawImage(a, 0, 0, w, h, 0, 0, w, h);
    mg.globalCompositeOperation = 'lighter'; mg.globalAlpha = k; mg.drawImage(b, 0, 0, w, h, 0, 0, w, h); mg.globalCompositeOperation = 'source-over'; mg.globalAlpha = 1;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(mc, 0, 0, w, h, bx, by, w, h); ctx.restore();
    return mo;
  }
  function glow(t, k, m) { // a little light about the point of her horn, on the page
    if (!m || !m.tip) return; const [px, py] = m.tip;
    const f = () => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k; soft(px, py, 9 + Math.sin(t * 2.3) * 1.5, '230,236,255', .3); soft(px, py, 3, '255,255,255', .45); ctx.restore(); };
    if (inkG && ctx === inkG) onMain(f); else f();
  }
  drawUnicorn = function (x, y, t) {
    const key = (typeof stage !== 'undefined' && stage && (stage.room || stage)) || null;
    if (seen.key !== key) seen = { key, age: -1, last: t };
    const dt = cl(t - seen.last, 0, .1); seen.last = t;
    const inView = typeof camX === 'undefined' || (x + 60 > camX && x - 60 < camX + VW);
    if (seen.age < 0) { if (inView) seen.age = 0; }
    else if (inView && (typeof mode === 'undefined' || mode === 'play')) seen.age += dt; // (the clock only runs while she is on screen and the game is running)
    const k = seen.age < HOLD ? 0 : sm(cl((seen.age - HOLD) / FADE));
    if (k <= 0) return OLD(x, y, t); // exactly the old drawing
    if (k >= 1) { glow(t, 1, drawNew(x, y, t)); return; }
    glow(t, k, blend(x, y, t, k));
  };
  window.UNICORN = { drawNew, OLD, motion, HOLD, FADE, get age() { return seen.age; }, set age(v) { seen.age = v; } }; // (for testing)
})();
