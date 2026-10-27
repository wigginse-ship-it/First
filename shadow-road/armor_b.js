'use strict';
// Breakable armor, part B: the Courts of Chaos (art_w4.js), Tir-na Nog'th (art_w5.js) and the Dreaming Shadow (art_w6.js).
// Each ARMOR entry paints what an elite wears over its body while its guard holds, the pieces that fly off when the guard
// breaks, and what the break does. What was underneath (e.bare) is painted by the creature's own drawing in its art file.
// Where the armor has to follow a moving part (a head, a wing, a hat), the creature's drawing leaves that part's transform
// in e.armA (only for an armored elite), and the armor here paints in it.
(() => {
  const DET = () => !FLASH && !TINT;
  const add = (fn) => { if (!DET()) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
  const poly = (pts) => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); };
  const fillPoly = (pts, col, ow) => { poly(pts); ctx.fillStyle = C(col); ctx.fill(); if (ow) outline(ow); };
  const glowAt = (x, y, r, rgb, a) => add(() => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.45, `rgba(${rgb},${a * .4})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); });
  const hsh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const sm = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
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
  const BIGR = () => ctx.rect(-900, -900, 1800, 1800);
  function cel(path, col, o = {}) {
    const d = o.d ?? 3, r = o.r ?? 1.1, w = o.w ?? 1.6;
    path(0, 0); ctx.fillStyle = C(col); ctx.fill();
    if (DET()) {
      ctx.save(); path(0, 0); ctx.clip();
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

  // ---------- shared pieces of armor-making ----------
  const nCracks = (e) => Math.max(0, (e.guardMax || 0) - (e.guard || 0)); // one more crack for every pip the guard has lost
  // fine cracks across a piece (clipped to its path): white hairlines with a dark bed, n of them, always in the same places
  function crackIn(path, n, seed, cx, cy, rx, ry, col = 'rgba(255,248,236,.95)', bed = 'rgba(20,10,20,.7)') {
    if (!n || !DET()) return;
    ctx.save(); path(0, 0); ctx.clip(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < n * 2; i++) {
      const pts = []; let x = cx + (hsh(seed + i * 1.7) - .5) * rx * 1.6, y = cy + (hsh(seed + i * 3.1 + 1) - .5) * ry * 1.6; pts.push(x, y);
      for (let k = 0; k < 3; k++) { x += (hsh(seed + i * 7 + k) - .5) * rx * .8; y += (hsh(seed + i * 5 + k + 2) - .5) * ry * .8; pts.push(x, y); }
      for (const [c, w] of [[bed, 1.4], [col, .6]]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let j = 2; j < pts.length; j += 2) ctx.lineTo(pts[j], pts[j + 1]); ctx.stroke(); }
    }
    ctx.restore();
  }
  // a band of shifting colour sliding across a piece of chaos-glass: it never holds one hue
  function chaosSheen(path, t, seed, x0, y0, x1, y1, a = .26) {
    if (!DET()) return;
    ctx.save(); path(0, 0); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
    const h = 250 + Math.sin(t * .7 + seed * 1.3) * 70, k = (Math.sin(t * .8 + seed) + 1) / 2, cx = lerp(x0, x1, k), w = (x1 - x0) * .35;
    const g = ctx.createLinearGradient(cx - w, y0, cx + w, y1); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, `hsla(${h},80%,62%,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x0 - 4, y0 - 4, x1 - x0 + 8, y1 - y0 + 8);
    ctx.restore();
  }
  // paint in a transform the creature's drawing left behind for this part (nothing if it left none this frame)
  const at = (e, k, fn) => { const m = e.armA && e.armA[k]; if (!m) return; ctx.save(); ctx.setTransform(m); try { fn(); } finally { ctx.restore(); } };
  // a modest change of pace once the armor is off (the def is shared, so this one foe gets its own copy)
  const quicken = (e, k) => { const d = e.def; e.def = Object.create(d, { spd: { value: d.spd * k, enumerable: true, writable: true } }); };
  // a piece's drawing, moved so that the point (cx, cy) of the body is its middle
  const piece = (cx, cy, fn) => () => { ctx.translate(-cx, -cy); fn(); };

  // the frame of a humanoid's upper body (drawHumanoid, art.js), and with head set, of its head: hy is the head's middle
  // there, SHO the shoulders, HIP the belt. Kept in step with drawHumanoid for the enemy looks (no turn, no long legs).
  function humanFrame(e, a, head) {
    let pose = (a && a.pose) || {}; if (e.w4pose) pose = Object.assign({}, pose, e.w4pose);
    if (e.def.w4scale) ctx.scale(e.def.w4scale, e.def.w4scale);
    const walk = pose.walk || 0, sw = Math.sin(walk);
    if (pose.oy) ctx.translate(0, pose.oy);
    if (pose.rot) { ctx.translate(0, -34); ctx.rotate(pose.rot); ctx.translate(0, 34); }
    if (pose.down) { ctx.translate(-6, -4); ctx.rotate(-1.5); }
    const gait = walk && !pose.legs && !pose.kick && pose.kickK === undefined && !pose.down && !pose.crouch;
    const bob = gait ? (pose.run ? (1 - Math.abs(sw)) * 3 : Math.abs(sw) * 1.6) : 0, br = pose.breath ? (pose.breath + 1) * .45 : 0;
    const cr = (pose.crouchK ?? (pose.crouch ? 8 : (pose.sink || 0))) + bob + br, HIP = -30 + cr, SHO = -49 + cr, NECK = -53 + cr;
    const LEAN = (pose.lean || 0) + (gait ? Math.sin(walk * 2) * .025 : 0), HX = clamp(-LEAN * 6, -5, 5) + (pose.shift || 0);
    ctx.translate(HX, HIP); ctx.rotate(LEAN); ctx.translate(0, -HIP);
    if (head) { ctx.translate(1, NECK); ctx.rotate(-LEAN * .3); ctx.scale(.9, .9); ctx.translate(-1, -NECK); }
    return { HIP, SHO, NECK, hy: -61 + cr, cr, pose };
  }
  window.armorHumanFrame = humanFrame; // (the Courts' knights and adepts paint their bare heads in it: art_w4.js)
  const humanAt = (e, a, head, fn) => { const v = e.w4vis ?? 1; if (v <= .02) return; ctx.save(); if (v < 1) ctx.globalAlpha *= v; try { fn(humanFrame(e, a, head)); } finally { ctx.restore(); } };

  // ======================================================================================================
  // THE COURTS OF CHAOS: plate of black chaos-glass that will not hold one colour, gilt, with fire in its seams
  // ======================================================================================================
  const GLASS = '#231A2E', GLASSD = '#0A0610', GLASSL = '#6A5684', GILT = '#C9A040', EMB = '255,138,60';
  const glassCel = (path, o = {}) => cel(path, o.col || GLASS, { d: o.d ?? 2.4, r: o.r ?? 1, w: o.w ?? 1.4, dark: GLASSD, lite: o.lite || GLASSL, tex: o.tex });
  const emberSeam = (pts, a = .9) => { if (!DET()) return; add(() => { ctx.lineCap = 'round'; for (const [w, al] of [[2.4, .25 * a], [.8, a]]) { ctx.strokeStyle = `rgba(255,${al > .5 ? 170 : 120},70,${al})`; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.stroke(); } }); };

  // ---- KNIGHT OF THE COURTS: a horned great helm and a spiked pauldron of chaos-glass, tassets over the thighs.
  // Broken, it shows what wore the knight's face: his own shape, horned, the fire of the Courts in its cracks (art_w4.js)
  const KH = -61; // the helm's pieces are drawn for a knight standing at rest
  const kHelm = (hy) => PP([-7.5, hy + 8, -9.2, hy - 1.5, -6.4, hy - 9.6, .6, hy - 13.4, 7.6, hy - 11.4, 11.4, hy - 5, 12.2, hy + 1.5, 10.6, hy + 8, 4.6, hy + 10.4, -1.6, hy + 10]);
  function knightHelm(hy, t, n, hot) {
    horn(-3, hy - 10, -10, hy - 20, -19, hy - 19, 3.4, .5, '#A8862E', 1); // the far horn
    const p = kHelm(hy);
    glassCel(p, { tex: () => {
      ctx.fillStyle = 'rgba(150,120,190,.35)'; poly([-6.4, hy - 9.6, .6, hy - 13.4, 7.6, hy - 11.4, 2, hy - 6]); ctx.fill(); // the lit facet of the crown
      ctx.strokeStyle = 'rgba(10,6,16,.7)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(2, hy - 6); ctx.lineTo(.6, hy - 13.4); ctx.moveTo(2, hy - 6); ctx.lineTo(11.4, hy - 5); ctx.moveTo(2, hy - 6); ctx.lineTo(-7.5, hy + 4); ctx.stroke(); // its facet edges
    } });
    chaosSheen(p, t, 1, -9, hy - 14, 12, hy + 10);
    crackIn(p, n, 11, 2, hy - 2, 9, 10);
    ctx.fillStyle = C('#05030A'); poly([3.6, hy - 2.2, 12.2, hy - 2.6, 12.2, hy - .2, 3.8, hy + .2]); ctx.fill(); // the eye-slit
    if (DET()) { emberSeam([5, hy - 1.1, 11.6, hy - 1.4], hot ? 1 : .8); glowAt(9, hy - 1.2, 8, EMB, hot ? .6 : .3); }
    ctx.strokeStyle = C(GILT); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-7.5, hy + 7.4); ctx.lineTo(-1.6, hy + 9.4); ctx.lineTo(4.6, hy + 9.8); ctx.lineTo(10.4, hy + 7.4); ctx.moveTo(.6, hy - 13); ctx.lineTo(2, hy - 6); ctx.stroke(); // the gilt edge and crest-line
    horn(-1, hy - 11, -6, hy - 23, -15, hy - 24, 3.8, .5, GILT, 1.1); // the near horn, swept back
  }
  function knightPauldron(SHO, t, n) {
    const p = PP([-6, SHO + 4, -5, SHO - 4, 1, SHO - 6.5, 8.5, SHO - 3.5, 10, SHO + 3, 6, SHO + 6.5, -1, SHO + 7]);
    for (const [x, h] of [[-2.5, 9], [2.5, 11], [7, 7]]) horn(x - 1.8, SHO - 4, x - 1, SHO - 4 - h * .6, x - 3, SHO - 4 - h, 3.2, .4, '#3A2C48', .9, GLASSD); // its spines
    glassCel(p, { tex: () => { ctx.fillStyle = 'rgba(150,120,190,.35)'; poly([-5, SHO - 4, 1, SHO - 6.5, 8.5, SHO - 3.5, 2, SHO]); ctx.fill(); } });
    chaosSheen(p, t, 2, -6, SHO - 7, 10, SHO + 7);
    crackIn(p, n, 23, 2, SHO, 7, 5);
    ctx.strokeStyle = C(GILT); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(-6, SHO + 4); ctx.lineTo(-1, SHO + 7); ctx.lineTo(6, SHO + 6.5); ctx.lineTo(10, SHO + 3); ctx.stroke();
    emberSeam([1, SHO - 6, 2, SHO, -1, SHO + 6.4], .8);
  }
  function knightTasset(HIP, t, n, x0) {
    const p = PP([x0 - 1, HIP - 1, x0 + 9, HIP - 1, x0 + 8.4, HIP + 9, x0 + 4, HIP + 11, x0, HIP + 9.4]);
    glassCel(p, { d: 1.6, r: .8, w: 1.2 });
    chaosSheen(p, t, 3 + x0, x0 - 1, HIP - 1, x0 + 9, HIP + 11, .3);
    crackIn(p, n, 31 + x0, x0 + 4, HIP + 5, 4, 5);
    ctx.strokeStyle = C(GILT); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(x0, HIP + 9.4); ctx.lineTo(x0 + 4, HIP + 11); ctx.lineTo(x0 + 8.4, HIP + 9); ctx.stroke();
  }
  ARMOR.chknight = {
    draw(e, a) {
      const t = a.t || 0, n = nCracks(e), hot = e.state === 'wind' || e.state === 'strike';
      humanAt(e, a, false, (F) => { knightTasset(F.HIP, t, n, -9); knightTasset(F.HIP, t, n, 0); });
      humanAt(e, a, true, (F) => knightHelm(F.hy, t, n, hot));
      humanAt(e, a, false, (F) => { if (!a.pose || !a.pose.down) { ctx.translate(1, F.SHO); ctx.scale(.82, .82); ctx.translate(0, -F.SHO); knightPauldron(F.SHO - 1, t, n); } });
    },
    pieces: [
      { x: 2, y: -64, fn: piece(2, KH - 2, () => knightHelm(KH, 0, 2, 0)) },
      { x: 5, y: -48, fn: piece(2, -48, () => knightPauldron(-48, 0, 1)) },
      { x: -4, y: -26, fn: piece(-5, -25, () => knightTasset(-30, 0, 1, -9)) },
      { x: 4, y: -26, fn: piece(4, -25, () => knightTasset(-30, 0, 1, 0)) },
    ],
    cols: ['#231A2E', '#6A5684', '#C9A040', '#FF9A50', '#E8D0F8'],
    onBreak(e) { quicken(e, 1.15); }, // its true shape is the quicker
  };

  // ---- LOGRUS ADEPT: a mask of black glass in the hood, three shards of chaos-glass circling it. Broken, the hood is
  // empty: in it, where a face should be, the knot of the Logrus turns (art_w4.js)
  function adeptMask(hy, t, n) {
    const p = PB([1.6, hy - 7, 7.4, hy - 8, 10.6, hy - 3, 10.4, hy + 4, 7, hy + 9, 2.6, hy + 6.6, 1.2, hy]);
    cel(p, '#14101C', { d: 1.6, r: 1, w: 1.2, dark: '#050308', lite: '#4A3A60', tex: () => {
      ctx.strokeStyle = 'rgba(240,196,90,.9)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(6, hy - 7); for (let i = 0; i <= 8; i++) ctx.lineTo(6 + Math.sin(i * 1.3 + t * 2) * 1.6, hy - 7 + i * 1.8); ctx.stroke(); // the Logrus, a line that will not lie still
      ctx.fillStyle = 'rgba(220,200,255,.35)'; ell(4, hy - 4, 1.6, 3, -.3); ctx.fill(); } });
    chaosSheen(p, t, 5, 1, hy - 8, 11, hy + 9, .3);
    crackIn(p, n, 41, 6, hy, 4, 7);
    ctx.fillStyle = C('#F0D070'); ell(8.2, hy - 1.4, 1.3, .7); ctx.fill(); glowAt(8.2, hy - 1.4, 5, '240,208,112', .5); // an eye-hole, lit from inside
  }
  function shard(r, n, seed, t) {
    const p = PP([0, -r * 1.3, r * .55, -r * .2, r * .2, r * 1.1, -r * .5, r * .3]);
    glassCel(p, { d: 1, r: .6, w: 1 }); chaosSheen(p, t, seed, -r, -r * 1.3, r, r * 1.1, .5); crackIn(p, n, 50 + seed, 0, 0, r * .5, r);
  }
  ARMOR.chadept = {
    draw(e, a) {
      const t = a.t || 0, n = nCracks(e);
      const orbit = (front) => humanAt(e, a, false, (F) => { for (let i = 0; i < 3; i++) { const an = t * 1.4 + i * TAU / 3, s = Math.sin(an); if ((s > 0) !== front) continue;
        ctx.save(); ctx.translate(-1 + Math.cos(an) * 17, F.SHO - 2 + s * 5 + Math.sin(t * 2 + i) * 2); ctx.rotate(an * .5 + i); ctx.scale(.8 + s * .2, .8 + s * .2); if (!front) ctx.globalAlpha *= .75; shard(4.6, n, i, t); ctx.restore(); } });
      orbit(false);
      humanAt(e, a, true, (F) => adeptMask(F.hy, t, n));
      orbit(true);
    },
    pieces: [
      { x: 6, y: -62, fn: piece(6, KH, () => adeptMask(KH, 0, 2)) },
      { x: -14, y: -50, fn: () => shard(4.6, 2, 0, 0) },
      { x: 12, y: -46, fn: () => shard(4.6, 2, 1, 1) },
      { x: 0, y: -40, fn: () => shard(4.6, 2, 2, 2) },
    ],
    cols: ['#14101C', '#4A3A60', '#F0C45A', '#9A6AD0', '#E8D0F8'],
    onBreak(e) { quicken(e, 1.1); },
  };

  // ---- HOUND OF CHAOS: barding of black glass along its back, and a chamfron over the skull it wears. Broken, the skull
  // goes with it: there was never a head under the bone, only the fire of the Abyss in the shape of one (art_w4.js)
  function houndBarding(by, t, n) {
    for (const [x, h] of [[-12, 7], [-6, 9], [0, 10], [6, 8]]) horn(x - 2, by - 8, x - 3, by - 8 - h * .6, x - 6, by - 8 - h, 3.6, .4, '#2E2240', .9, GLASSD); // the spines
    const p = PB([-17, by - 3, -14, by - 8.5, -4, by - 10.5, 8, by - 12.5, 14, by - 8, 9, by - 4, -2, by - 3.5, -12, by - 1]);
    glassCel(p, { tex: () => { ctx.strokeStyle = 'rgba(201,160,64,.9)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-15, by - 2.2); ctx.quadraticCurveTo(-2, by - 4.4, 10, by - 4.8); ctx.stroke(); } });
    chaosSheen(p, t, 7, -17, by - 13, 14, by - 1);
    crackIn(p, n, 61, -2, by - 7, 12, 4);
    emberSeam([-10, by - 8, -6, by - 5, -1, by - 8, 4, by - 6], .8);
  }
  function houndChamfron(t, n) {
    const p = PP([-4.6, -5.6, 2, -9, 9.6, -7.4, 15.6, -3.2, 12, -1.6, 5, -2.6, -2, -1]);
    glassCel(p, { d: 1.4, r: .8, w: 1.2 });
    chaosSheen(p, t, 8, -5, -9, 16, -1);
    crackIn(p, n, 71, 6, -5, 6, 3);
    ctx.fillStyle = C(GILT); for (const x of [0, 5, 10]) { circle(x, -5.4 + x * .1, .8); ctx.fill(); }
    horn(3, -8, 6, -14, 12, -16, 2.6, .4, GILT, .9); // a gilt spike on the brow
  }
  function boneSkull() { // the skull the hound wears, as it flies off (as art_w4.js paints it)
    cel(PB([-5, -5, 2, -8, 10, -6, 16, -2, 15, 1, 6, 1.5, -3, 2]), '#D8CCB0', { d: 2, r: .9, w: 1.4, dark: '#8A7C62', lite: '#FFF6E0' });
    ctx.fillStyle = C('#140A10'); ell(4.4, -3.4, 2.6, 2, -.2); ctx.fill();
    horn(0, -6, -4, -12, -12, -15, 3.8, .4, '#E0D4B8', 1.1);
  }
  ARMOR.chhound = {
    draw(e, a) { const t = a.t || 0, n = nCracks(e);
      at(e, 'body', () => houndBarding(e.armA.by, t, n));
      at(e, 'head', () => houndChamfron(t, n)); },
    pieces: [
      { x: -2, y: -28, fn: piece(-2, -29, () => houndBarding(-21, 0, 1)) },
      { x: 22, y: -30, fn: piece(5, -5, () => houndChamfron(0, 1)) },
      { x: 24, y: -28, fn: piece(5, -4, boneSkull) },
    ],
    cols: ['#231A2E', '#D8CCB0', '#FF8A3C', '#6A5684'],
    onBreak(e) { quicken(e, 1.08); },
  };

  // ---- WATCHER OF THE ABYSS: shutters of black glass closing over its eye, an iron ring riveted round it. Broken, the
  // husk splits, and all round the rim of it other eyes open (art_w4.js)
  const EY = -18, ER = 11;
  function eyeShutter(top, t, n) {
    const s = top ? -1 : 1, p = top ? PB([-ER - 2, EY - 1.4, -ER + 1, EY - ER, 1, EY - ER - 3.6, ER - 1, EY - ER, ER + 3, EY - 1.8, 1, EY - 3.4])
      : PB([-ER - 1, EY + 2.6, 1, EY + 3.8, ER + 2.5, EY + 2.2, ER - 2, EY + ER - 1, 1, EY + ER + 2.4, -ER + 2, EY + ER - 1]);
    glassCel(p, { d: 2, r: 1, w: 1.3 });
    chaosSheen(p, t, top ? 9 : 10, -ER - 2, EY - ER - 4, ER + 3, EY + ER + 3);
    crackIn(p, n, top ? 81 : 91, 1, EY + s * 7, 9, 3);
    ctx.strokeStyle = C(GILT); ctx.lineWidth = 1; ctx.beginPath(); if (top) { ctx.moveTo(-ER - 2, EY - 1.4); ctx.quadraticCurveTo(1, EY - 4.6, ER + 3, EY - 1.8); } else { ctx.moveTo(-ER - 1, EY + 2.6); ctx.quadraticCurveTo(1, EY + 5, ER + 2.5, EY + 2.2); } ctx.stroke();
  }
  function eyeRing(n) {
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 4.4; ell(1, EY, ER + 2.4, ER * .86 + 2.4); ctx.stroke();
    ctx.strokeStyle = C('#3A2C48'); ctx.lineWidth = 2.6; ell(1, EY, ER + 2.4, ER * .86 + 2.4); ctx.stroke();
    ctx.fillStyle = C(GILT); for (let i = 0; i < 8; i++) { const an = i / 8 * TAU + .2; circle(1 + Math.cos(an) * (ER + 2.4), EY + Math.sin(an) * (ER * .86 + 2.4), .9); ctx.fill(); }
    if (n && DET()) { ctx.strokeStyle = 'rgba(255,190,120,.9)'; ctx.lineWidth = .7; for (let i = 0; i < n; i++) { const an = hsh(i + 3) * TAU; ctx.beginPath(); ctx.moveTo(1 + Math.cos(an) * (ER + 1), EY + Math.sin(an) * (ER * .86 + 1)); ctx.lineTo(1 + Math.cos(an + .08) * (ER + 4), EY + Math.sin(an + .08) * (ER * .86 + 4)); ctx.stroke(); } }
  }
  ARMOR.cheye = {
    draw(e, a) { const t = a.t || 0, n = nCracks(e), w = a.wind || 0;
      at(e, 'root', () => { ctx.save(); ctx.translate(0, -w * 2.4); eyeShutter(true, t, n); ctx.restore(); ctx.save(); ctx.translate(0, w * 2.4); eyeShutter(false, t, n); ctx.restore(); eyeRing(n); }); },
    pieces: [
      { x: 1, y: -27, fn: piece(1, -27, () => eyeShutter(true, 0, 1)) },
      { x: 1, y: -10, fn: piece(1, -10, () => eyeShutter(false, 0, 1)) },
      { x: -9, y: -18, fn: () => { ctx.strokeStyle = C(OUT); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 13, 1.8, 4.2); ctx.stroke(); ctx.strokeStyle = C('#3A2C48'); ctx.lineWidth = 2.4; ctx.stroke(); } },
    ],
    cols: ['#231A2E', '#6A1E34', '#F0C45A', '#FFB060'],
  };

  // ---- ECLIPSE MOTH: edges of black glass along its forewings and a horned helm. Broken, the eclipse is over: the black
  // suns on its wings take fire (art_w4.js)
  function mothEdge(t, n) { // in a forewing's own frame
    const p = PP([2, 0, -1, -11, -7, -23, -17, -31, -12, -24, -5, -14, 0, -6]);
    glassCel(p, { d: 1, r: .6, w: 1.1 });
    chaosSheen(p, t, 12, -17, -31, 2, 0, .5);
    for (const [x, y] of [[-3, -10], [-8, -20], [-14, -27]]) horn(x, y, x - 3, y - 2, x - 6, y - 1, 2.4, .3, '#3A2C48', .8, GLASSD);
    crackIn(p, n, 101, -7, -15, 6, 12);
  }
  function mothHelm(cy, t, n) {
    const p = PB([4.4, cy - 4.6, 8, cy - 7, 12, cy - 4.4, 12, cy - 1.4, 8.6, cy - 2.4, 5, cy - .8]);
    glassCel(p, { d: 1, r: .6, w: 1.1 }); chaosSheen(p, t, 13, 4, cy - 7, 12, cy, .45); crackIn(p, n, 111, 8, cy - 3, 3, 2);
    horn(7, cy - 6, 6, cy - 11, 3, cy - 13, 2, .3, GILT, .8);
  }
  ARMOR.chmoth = {
    draw(e, a) { const t = a.t || 0, n = nCracks(e);
      at(e, 'wingF', () => mothEdge(t, n)); at(e, 'wingN', () => mothEdge(t, n)); at(e, 'body', () => mothHelm(e.armA.cy, t, n)); },
    pieces: [
      { x: -8, y: -36, fn: piece(-7, -15, () => mothEdge(0, 1)) },
      { x: -4, y: -34, fn: piece(-7, -15, () => mothEdge(0, 1)) },
      { x: 11, y: -24, fn: piece(8, -20, () => mothHelm(-16, 0, 1)) },
    ],
    cols: ['#231A2E', '#E8B848', '#55304E', '#FFE6A0'],
    onBreak(e) { quicken(e, 1.1); },
  };

  // ---- ABYSS BRUTE: a yoke of fused road-glass across its shoulders, spined, and a cage of black iron over its face.
  // Broken, the obsidian plates of its hide go with it, and the magma under them shows (art_w4.js)
  function bruteYoke(SH, t, n) {
    for (const [x, h, l] of [[-14, 14, -.5], [-4, 18, -.3], [7, 13, -.1]]) horn(x - 3, SH - 8, x - 2 + l * 6, SH - 8 - h * .6, x - 6 + l * 10, SH - 8 - h, 5, .5, '#2E2240', 1.1, GLASSD);
    const p = PP([-24, SH + 6, -21, SH - 7, -11, SH - 14, 3, SH - 15, 15, SH - 10, 22, SH - 2, 19, SH + 6, 9, SH + 2, -2, SH + 4, -13, SH + 10]);
    glassCel(p, { d: 3.4, r: 1.4, w: 1.9, tex: () => {
      ctx.fillStyle = 'rgba(150,120,190,.3)'; poly([-21, SH - 7, -11, SH - 14, 3, SH - 15, -4, SH - 6]); ctx.fill(); poly([3, SH - 15, 15, SH - 10, 6, SH - 4]); ctx.fill();
      ctx.strokeStyle = 'rgba(8,4,12,.7)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-4, SH - 6); ctx.lineTo(-13, SH + 10); ctx.moveTo(-4, SH - 6); ctx.lineTo(9, SH + 2); ctx.moveTo(-4, SH - 6); ctx.lineTo(3, SH - 15); ctx.moveTo(6, SH - 4); ctx.lineTo(22, SH - 2); ctx.stroke(); } });
    chaosSheen(p, t, 14, -24, SH - 15, 22, SH + 10);
    crackIn(p, n, 121, -1, SH - 3, 18, 9);
    emberSeam([-20, SH + 2, -12, SH - 2, -4, SH - 6, 6, SH - 4, 16, SH - 1], .9);
    ctx.strokeStyle = C(GILT); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-24, SH + 6); ctx.lineTo(-13, SH + 10); ctx.lineTo(-2, SH + 4); ctx.lineTo(9, SH + 2); ctx.lineTo(19, SH + 6); ctx.stroke();
  }
  function bruteCage(t, n, hot) { // in the head's own frame
    const p = PB([-6.4, -7, 2, -10, 9.6, -7, 12.4, -.6, 9, 5.4, 1, 6.6, -6, 3.6]);
    ctx.save(); p(0, 0); ctx.clip(); ctx.strokeStyle = C(OUT); ctx.lineWidth = 2.6; ctx.beginPath(); for (const x of [1, 4.4, 7.8]) { ctx.moveTo(x, -10); ctx.lineTo(x + 1, 7); } ctx.moveTo(-6, -2.6); ctx.lineTo(13, -1.6); ctx.stroke();
    ctx.strokeStyle = C('#4A4054'); ctx.lineWidth = 1.3; ctx.stroke(); ctx.restore();
    ctx.strokeStyle = C('#3A3044'); ctx.lineWidth = 2.4; p(0, 0); ctx.stroke(); p(0, 0); outline(1);
    ctx.fillStyle = C(GILT); for (const [x, y] of [[-5, -5], [2, -9], [9.4, -6], [11.6, 0], [1, 6]]) { circle(x, y, .9); ctx.fill(); }
    if (n && DET()) { ctx.strokeStyle = 'rgba(255,200,140,.9)'; ctx.lineWidth = .6; for (let i = 0; i < n; i++) { const x = -4 + hsh(i + 9) * 14; ctx.beginPath(); ctx.moveTo(x, -9); ctx.lineTo(x + 1.5, -5); ctx.stroke(); } }
    if (hot) glowAt(5.6, -3.2, 8, EMB, .5);
  }
  ARMOR.chbrute = {
    draw(e, a) { const t = a.t || 0, n = nCracks(e);
      at(e, 'root', () => bruteYoke(e.armA.SH, t, n));
      at(e, 'head', () => bruteCage(t, n, (a.wind || 0) > .3)); },
    pieces: [
      { x: -2, y: -58, fn: piece(-1, -58, () => bruteYoke(-54, 0, 1)) },
      { x: 17, y: -52, fn: piece(3, -2, () => bruteCage(0, 1, 0)) },
      { x: -10, y: -64, fn: () => horn(0, 6, 1, -3, -2, -10, 5, .5, '#2E2240', 1.1, GLASSD) },
    ],
    cols: ['#231A2E', '#6A5684', '#FF8A3C', '#FFD27A', '#3A2C3E'],
    onBreak(e) { quicken(e, 1.2); }, // lighter for the weight of glass gone
  };

  // ======================================================================================================
  // TIR-NA NOG'TH: moon-glass and silver leaf, cold and ghostly; under it, what the city's ghosts really are
  // ======================================================================================================
  const SILV = '#B9C3D4', SILVD = '#5A6888', SILVL = '#F2F6FC', PALE = '205,218,245';
  const leaf = (fn, w = 1.6) => { ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = C(OUT); ctx.lineWidth = w + 1.6; ctx.beginPath(); fn(); ctx.stroke(); ctx.strokeStyle = C(SILV); ctx.lineWidth = w; ctx.beginPath(); fn(); ctx.stroke(); if (DET()) { ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = w * .35; ctx.translate(-.3, -.4); ctx.beginPath(); fn(); ctx.stroke(); } ctx.restore(); };
  function moonGlass(path, x0, y0, x1, y1, a = .26) { // a pane of moon-glass: barely there, a cold sheen sliding down it
    path(0, 0); ctx.fillStyle = FLASH ? '#fff' : TINT || `rgba(200,218,250,${a})`; ctx.fill();
    if (DET()) { ctx.save(); path(0, 0); ctx.clip(); const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.42, 'rgba(240,246,255,.55)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(.7, 'rgba(230,240,255,.25)'); g.addColorStop(.76, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(Math.min(x0, x1) - 2, Math.min(y0, y1) - 2, Math.abs(x1 - x0) + 4, Math.abs(y1 - y0) + 4); ctx.restore(); }
  }

  // ---- LANTERN COURTIER: a cage of black iron hoops and moon-glass panes round its robe, a globe of glass round its
  // lantern. Broken, there is nothing under the robe's waist: it was a ghost all along, its lantern's flame let loose
  function courtierCage(t, n) {
    const panes = PP([-8.5, -46, 8.5, -46, 16, -4, -16, -4]);
    moonGlass(panes, -16, -46, 14, -4, .22);
    crackIn(panes, n, 201, 0, -24, 14, 18, 'rgba(255,255,255,.95)', 'rgba(40,50,90,.5)');
    ctx.save(); ctx.lineCap = 'round';
    for (const x of [-1, 1]) { ctx.strokeStyle = C(OUT); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(x * 8.5, -46); ctx.lineTo(x * 16, -4); ctx.stroke(); ctx.strokeStyle = C('#3A4466'); ctx.lineWidth = 1.2; ctx.stroke(); } // the ribs
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -46); ctx.lineTo(0, -4); ctx.stroke(); ctx.strokeStyle = C('#3A4466'); ctx.lineWidth = .9; ctx.stroke();
    ctx.restore();
    for (const [y, w] of [[-44, 9], [-30, 11.8], [-17, 14.2], [-5, 16.2]]) leaf(() => ctx.ellipse(0, y, w, 1.8, 0, 0, Math.PI), 1.3); // the hoops, silvered
    if (DET()) glowAt(0, -46, 6, PALE, .3);
  }
  function courtierGlobe(t, n) { // in the lantern's own frame
    const p = PE(0, 10, 11.5, 12.5);
    moonGlass(p, -11, -2, 11, 22, .2); p(0, 0); outline(1.1);
    crackIn(p, n, 211, 0, 10, 9, 10, 'rgba(255,255,255,.95)', 'rgba(40,50,90,.4)');
    leaf(() => ctx.ellipse(0, -1.6, 6, 1.8, 0, 0, TAU), 1.4); leaf(() => { ctx.moveTo(0, -3.6); ctx.lineTo(0, -7); }, 1.2);
    ctx.fillStyle = C(SILVL); circle(0, -7.6, 1.4); ctx.fill(); outline(.8);
  }
  ARMOR.w5courtier = {
    draw(e, a) { const t = a.t || 0, n = nCracks(e); at(e, 'root', () => courtierCage(t, n)); at(e, 'lantern', () => courtierGlobe(t, n)); },
    pieces: [
      { x: 0, y: -18, fn: () => leaf(() => ctx.ellipse(0, 0, 14.2, 1.8, 0, 0, Math.PI), 1.3) },
      { x: -6, y: -30, fn: () => { moonGlass(PP([-5, -9, 4, -8, 6, 7, -6, 9]), -6, -9, 6, 9, .35); PP([-5, -9, 4, -8, 6, 7, -6, 9])(0, 0); outline(.8); } },
      { x: 6, y: -14, fn: () => { moonGlass(PP([-4, -7, 5, -6, 3, 8, -5, 6]), -5, -7, 5, 8, .35); PP([-4, -7, 5, -6, 3, 8, -5, 6])(0, 0); outline(.8); } },
      { x: 6, y: -60, fn: piece(0, 10, () => courtierGlobe(0, 2)) },
    ],
    cols: ['#C8D4EC', '#EEF2FA', '#3A4466', '#B9C3D4'],
    onBreak(e) { quicken(e, 1.12); }, // nothing left to carry
  };

  // ---- COLORLESS REFLECTION: it still stands in its mirror, an oval of glass in a frame of silver leaf. Broken, it is out of
  // the glass: no longer grey, but the prince's shape cut out of the night sky, with stars in it (art_w5.js)
  const MIR = (ox, oy, c) => { if (!c) ctx.beginPath(); ctx.ellipse(1 + ox, -39 + oy, 21, 41, 0, 0, TAU); };
  function mirrorFrame(t, n, a0 = 0, a1 = TAU) {
    leaf(() => ctx.ellipse(1, -39, 21, 41, 0, a0, a1), 2.8);
    if (DET()) { ctx.save(); ctx.strokeStyle = 'rgba(40,46,70,.6)'; ctx.lineWidth = .7; ctx.setLineDash([1.5, 2]); ctx.beginPath(); ctx.ellipse(1, -39, 23, 43, 0, a0, a1); ctx.stroke(); ctx.restore(); }
  }
  function mirrorCrest() { // the crest of the frame: a crescent between two leaves of silver
    horn(1, -80, -4, -84, -9, -82, 3, .4, SILV, .9, SILVD); horn(1, -80, 6, -84, 11, -82, 3, .4, SILV, .9, SILVD);
    ctx.fillStyle = C(SILVL); ctx.beginPath(); ctx.arc(1, -84, 3.4, -1.1, 2); ctx.arc(1.8, -84.4, 2.4, 2, -1.1, true); ctx.fill(); outline(.8);
  }
  ARMOR.w5reflect = {
    draw(e, a) { const t = a.t || 0, n = nCracks(e);
      at(e, 'root', () => { moonGlass(MIR, -20, -80, 22, 2, .14); crackIn(MIR, n + (n ? 1 : 0), 221, 1, -39, 16, 30, 'rgba(255,255,255,.95)', 'rgba(40,46,70,.45)'); mirrorFrame(t, n); mirrorCrest();
        leaf(() => { ctx.moveTo(-14, 3); ctx.lineTo(16, 3); }, 2.2); }); }, // its foot
    pieces: [
      { x: -18, y: -50, fn: piece(-20, -50, () => mirrorFrame(0, 0, 2.4, 3.9)) },
      { x: 20, y: -30, fn: piece(22, -30, () => mirrorFrame(0, 0, -.3, .9)) },
      { x: 2, y: -82, fn: piece(1, -82, mirrorCrest) },
      { x: -4, y: -40, fn: () => { moonGlass(PP([-6, -10, 5, -7, 3, 9, -7, 5]), -7, -10, 5, 9, .4); PP([-6, -10, 5, -7, 3, 9, -7, 5])(0, 0); outline(.7); } },
      { x: 8, y: -20, fn: () => { moonGlass(PP([-4, -8, 6, -4, 1, 8]), -4, -8, 6, 8, .4); PP([-4, -8, 6, -4, 1, 8])(0, 0); outline(.7); } },
    ],
    cols: ['#EEF2FA', '#B9C3D4', '#FFFFFF', '#8A9AC8'],
  };

  // ---- KNAVE OF MOONS: a knave dressed up as a king, under glass: a silver frame and pane over the card and a crown
  // floating over it. Broken, the card is not the Knave any more: it has turned up the Fool (art_w5.js)
  const CW5 = 13, CH5 = 21;
  function knaveCase(t, n) {
    const p = (ox, oy, c) => { if (!c) ctx.beginPath(); rrect(-CW5 + ox, -CH5 + oy, CW5 * 2, CH5 * 2, 3); };
    moonGlass(p, -CW5, -CH5, CW5, CH5, .16); crackIn(p, n, 231, 0, 0, 10, 16, 'rgba(255,255,255,.95)', 'rgba(40,46,70,.45)');
    leaf(() => rrect(-CW5 - 1.2, -CH5 - 1.2, CW5 * 2 + 2.4, CH5 * 2 + 2.4, 3.6), 1.8);
    ctx.fillStyle = C(SILVL); for (const [x, y] of [[-CW5, -CH5], [CW5, -CH5], [-CW5, CH5], [CW5, CH5]]) { circle(x, y, 1.6); ctx.fill(); outline(.7); }
  }
  function knaveCrown(t) {
    const y = -CH5 - 7 + Math.sin(t * 1.6) * 1.2;
    fillPoly([-7, y + 3, -7.6, y - 4, -3.6, y - 1, 0, y - 6, 3.6, y - 1, 7.6, y - 4, 7, y + 3], SILV, 1.1);
    if (DET()) { ctx.fillStyle = 'rgba(255,255,255,.7)'; poly([-6, y + 2, -6.4, y - 2, -3.6, y, 0, y - 4, 0, y + 2]); ctx.fill(); ctx.fillStyle = '#5A6EB0'; circle(0, y + .6, 1.2); ctx.fill(); }
    glowAt(0, y - 1, 8, PALE, .35);
  }
  ARMOR.w5knave = {
    draw(e, a) { const t = a.t || 0, n = nCracks(e); at(e, 'card', () => { knaveCase(t, n); knaveCrown(t); }); },
    pieces: [
      { x: 0, y: -64, fn: piece(0, -CH5 - 7, () => knaveCrown(0)) },
      { x: -10, y: -40, fn: () => leaf(() => { ctx.moveTo(4, -21); ctx.lineTo(-4, -21); ctx.lineTo(-4, 21); }, 1.8) },
      { x: 10, y: -32, fn: () => leaf(() => { ctx.moveTo(-4, -21); ctx.lineTo(4, -21); ctx.lineTo(4, 21); ctx.lineTo(-2, 21); }, 1.8) },
    ],
    cols: ['#EEF2FA', '#B9C3D4', '#F2EEE4', '#2E3A78'],
  };

  // ---- WEEPING WATCHER: a veil of marble over its hood, a mantle of stone over its shoulders, a plinth under it. Broken,
  // the shell of stone falls away from what it held: a living mourner, robed in night-blue, silver-haired (art_w5.js)
  const STN = '#C4CAD8', STND = '#6E7896', STNL = '#F2F5FA';
  function statueVeil(n) {
    const p = PB([-12, -50, -12, -64, -6, -74, 3, -77, 11, -73, 15, -64, 14, -52, 8, -48, 0, -47, -8, -47]);
    ctx.save(); ctx.globalAlpha *= .92;
    cel(p, STN, { d: 2.6, r: 1.2, w: 1.6, dark: STND, lite: STNL, tex: () => {
      ctx.strokeStyle = 'rgba(80,90,120,.5)'; ctx.lineWidth = .9; ctx.beginPath(); for (let i = 0; i < 5; i++) { const x = -8 + i * 5; ctx.moveTo(x * .4 + 2, -74); ctx.quadraticCurveTo(x * .9 + 2, -60, x * 1.1 + 2, -48); } ctx.stroke(); // its folds
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = .6; ctx.beginPath(); for (let i = 0; i < 4; i++) { const x = -6 + i * 5; ctx.moveTo(x * .4 + 3, -73); ctx.quadraticCurveTo(x * .9 + 3.4, -60, x * 1.1 + 3.4, -49); } ctx.stroke();
      ctx.fillStyle = 'rgba(80,90,120,.3)'; ell(7, -63, 4, 5); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.3)'; ell(8, -65, 2, 3); ctx.fill(); // the face under the veil, only just showing
    } });
    ctx.restore();
    crackIn(p, n, 241, 2, -62, 10, 12, 'rgba(225,235,255,.95)', 'rgba(50,58,90,.6)');
  }
  function statuePlinth(n) {
    const p = PP([-21, -7, 21, -7, 22, -3, 20, 4, -20, 4, -22, -3]);
    cel(p, '#AEB6C8', { d: 2, r: 1, w: 1.6, dark: STND, lite: STNL, tex: () => { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-21, -7, 42, 1.6); ctx.strokeStyle = 'rgba(70,80,110,.6)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(-21, -3); ctx.lineTo(21, -3); ctx.stroke(); } });
    crackIn(p, n, 251, 0, -1, 18, 4, 'rgba(225,235,255,.9)', 'rgba(50,58,90,.6)');
  }
  ARMOR.w5statue = {
    draw(e, a) { const n = nCracks(e); at(e, 'base', () => statuePlinth(n)); at(e, 'root', () => statueVeil(n)); },
    pieces: [
      { x: 2, y: -62, fn: piece(2, -62, () => statueVeil(1)) },
      { x: -10, y: -2, fn: () => { cel(PP([-10, -5, 10, -5, 9, 4, -11, 4]), '#AEB6C8', { d: 2, r: 1, w: 1.4, dark: STND, lite: STNL }); } },
      { x: 11, y: -2, fn: () => { cel(PP([-9, -5, 11, -5, 10, 4, -10, 4]), '#AEB6C8', { d: 2, r: 1, w: 1.4, dark: STND, lite: STNL }); } },
      { x: -6, y: -40, fn: () => { cel(PB([-7, -6, 6, -7, 8, 5, -6, 6]), STN, { d: 2, r: 1, w: 1.3, dark: STND, lite: STNL }); } },
      { x: 8, y: -24, fn: () => { cel(PB([-5, -6, 6, -5, 5, 6, -6, 4]), STN, { d: 2, r: 1, w: 1.3, dark: STND, lite: STNL }); } },
    ],
    cols: ['#C4CAD8', '#F2F5FA', '#6E7896', '#EEF2FA'],
  };

  // ---- HOUND OF THE WILD HUNT: a caparison of night-blue worked with silver moons, a silver chamfron. Broken, it is shown
  // for a hound of the dead: thin as mist over a skeleton of moonlight (art_w5.js)
  function houndCaparison(by, n) {
    const p = PB([-19, by - 5, -7, by - 10, 8, by - 13, 17, by - 7, 15, by + 4, 6, by + 6, -6, by + 4, -17, by + 4]);
    cel(p, '#1E2858', { d: 2, r: 1, w: 1.4, dark: '#0C1230', lite: '#4A5A94', tex: () => {
      ctx.fillStyle = 'rgba(214,222,236,.9)'; for (const [x, y] of [[-9, by - 2], [0, by - 4], [9, by - 4]]) { ctx.beginPath(); ctx.arc(x, y, 2.2, -1.2, 1.9); ctx.arc(x + .9, y - .3, 1.6, 1.9, -1.2, true); ctx.fill(); } } });
    leaf(() => { ctx.moveTo(-17, by + 4); ctx.quadraticCurveTo(-6, by + 6, 6, by + 6); ctx.quadraticCurveTo(12, by + 5, 15, by + 4); }, 1.2);
    if (DET()) { ctx.strokeStyle = 'rgba(214,222,236,.8)'; ctx.lineWidth = .7; ctx.beginPath(); for (let x = -16; x < 15; x += 3) { const y = by + 4.6 + Math.sin(x * .3) * .6; ctx.moveTo(x, y); ctx.lineTo(x - .4, y + 2.4); } ctx.stroke(); } // the fringe
    crackIn(p, n, 261, 0, by - 3, 14, 5, 'rgba(225,235,255,.9)', 'rgba(10,14,40,.6)');
  }
  function houndChamfronS(n) {
    const p = PP([-3, -6.4, 4, -7.8, 12, -5.4, 15.4, -2.2, 10, -2.6, 2, -3.6]);
    cel(p, SILV, { d: 1.2, r: .7, w: 1.1, dark: SILVD, lite: SILVL });
    horn(2, -7, 6, -12, 11, -15, 2.4, .3, SILVL, .9, SILVD); // a horn of silver on its brow
    crackIn(p, n, 271, 6, -5, 6, 2, 'rgba(255,255,255,.95)', 'rgba(40,46,70,.6)');
  }
  ARMOR.w5hound = {
    draw(e, a) { const n = nCracks(e); at(e, 'body', () => houndCaparison(e.armA.by, n)); at(e, 'head', () => houndChamfronS(n)); },
    pieces: [
      { x: 0, y: -24, fn: piece(-1, -26, () => houndCaparison(-22, 1)) },
      { x: 26, y: -32, fn: piece(6, -6, () => houndChamfronS(1)) },
    ],
    cols: ['#1E2858', '#B9C3D4', '#EEF2FA', '#C8D4EC'],
    onBreak(e) { quicken(e, 1.08); },
  };

  // ---- MOONMOTH: panes of leaded moon-glass set in its forewings, a crescent diadem. Broken, the crescents on its wings
  // fill to full moons and its tails stream out long (art_w5.js)
  const FW = PB([2, 0, 0, -10, -6, -22, -14, -28, -24, -26, -22, -16, -10, -5]);
  function mothPanes(n) {
    moonGlass(FW, -24, -28, 2, 0, .3);
    ctx.save(); FW(0, 0); ctx.clip(); ctx.lineCap = 'round';
    const lead = () => { ctx.beginPath(); for (let i = 0; i < 4; i++) { ctx.moveTo(1, -2); ctx.lineTo(-24 * (.4 + i * .2), -27 * (.95 - i * .16)); } for (const r of [9, 17, 25]) { ctx.moveTo(-r * .2, -r * .9); ctx.quadraticCurveTo(-r * .7, -r * .5, -r * .9, -r * .1); } };
    ctx.strokeStyle = C('#3A4058'); ctx.lineWidth = 1.5; lead(); ctx.stroke(); ctx.strokeStyle = C(SILV); ctx.lineWidth = .6; lead(); ctx.stroke(); ctx.restore();
    crackIn(FW, n, 281, -11, -14, 8, 10, 'rgba(255,255,255,.95)', 'rgba(40,46,70,.5)');
  }
  function mothDiadem(cy) { ctx.fillStyle = C(SILVL); ctx.beginPath(); ctx.arc(6.4, cy - 6, 2.4, -.6, Math.PI + .6, true); ctx.arc(6.4, cy - 7, 2.2, Math.PI + .5, -.5); ctx.fill(); outline(.7); glowAt(6.4, cy - 7, 5, PALE, .4); }
  ARMOR.w5moth = {
    draw(e, a) { const n = nCracks(e); at(e, 'wingF', () => mothPanes(n)); at(e, 'wingN', () => mothPanes(n)); at(e, 'body', () => mothDiadem(e.armA.cy)); },
    pieces: [
      { x: -12, y: -40, fn: piece(-11, -14, () => mothPanes(1)) },
      { x: -8, y: -36, fn: piece(-11, -14, () => mothPanes(1)) },
    ],
    cols: ['#EEF6F2', '#B8D4CC', '#B9C3D4', '#FFFFFF'],
    onBreak(e) { quicken(e, 1.1); },
  };

  // ======================================================================================================
  // THE DREAMING SHADOW: armor as the dream-painters would paint it: stone, porcelain, glass bowls, gilt frames and gold
  // cases; and under it, the dream's logic carried one step further
  // ======================================================================================================
  const STO = '#A29C90', STOD = '#5E5A54', STOL = '#E0DACC';
  const lichen = (pts) => { if (!DET()) return; for (let i = 0; i < pts.length; i += 2) { ctx.fillStyle = i % 4 ? 'rgba(170,180,90,.6)' : 'rgba(210,200,120,.55)'; ell(pts[i], pts[i + 1], 1.4, .9, i); ctx.fill(); } };
  const GLAZE = '#F6F2EA', DELFT = '#3A5AA8', GLD = '#D8A848', GLDD = '#8A6424', GLDL = '#FFE6A0';

  // ---- GENTLEMAN OF GOLCONDA: turned to stone, as in the dream-painter's pictures: a bowler of grey stone, and a stone
  // mantle on his shoulders. Broken, his hat is a white dove, and his coat hangs open on a birdcage (art_w6.js)
  const BOWL = (ox, oy, c) => { if (!c) ctx.beginPath(); ctx.moveTo(-6.4 + ox, 1.2 + oy); ctx.bezierCurveTo(-6.8 + ox, -8 + oy, 6.8 + ox, -8 + oy, 6.4 + ox, 1.2 + oy); ctx.closePath(); };
  function stoneHat(n) {
    cel(BOWL, STO, { d: 1.8, r: .9, w: 1.2, dark: STOD, lite: STOL });
    ctx.fillStyle = C('#8A847A'); ell(0, 1.4, 9.8, 2.2); ctx.fill(); outline(1.1);
    lichen([-3, -3, 2, -4.6, 4, -1, -6, 1.4, 7, 1.6]);
    crackIn(BOWL, n, 301, 0, -3, 5, 3, 'rgba(255,250,240,.9)', 'rgba(50,46,40,.7)');
  }
  function stoneMantle(sy, n) {
    const p = PB([-9.4, sy + 7, -10, sy, -6, sy - 2.6, 6, sy - 2.6, 10, sy + 1, 9.6, sy + 7, 4, sy + 9, -4, sy + 9]);
    cel(p, STO, { d: 2, r: 1, w: 1.3, dark: STOD, lite: STOL, tex: () => { ctx.strokeStyle = 'rgba(60,56,50,.5)'; ctx.lineWidth = .7; ctx.beginPath(); for (const x of [-5, 0, 5]) { ctx.moveTo(x, sy - 2); ctx.quadraticCurveTo(x + 1, sy + 4, x, sy + 9); } ctx.stroke(); } });
    lichen([-6, sy + 3, 5, sy + 5]);
    crackIn(p, n, 311, 0, sy + 3, 8, 5, 'rgba(255,250,240,.9)', 'rgba(50,46,40,.7)');
  }
  ARMOR.w6bowler = {
    draw(e, a) { const n = nCracks(e); at(e, 'body', () => { if (e.armA.sy != null) stoneMantle(e.armA.sy, n); }); at(e, 'hat', () => stoneHat(n)); },
    pieces: [
      { x: 1, y: -66, fn: piece(0, -2, () => stoneHat(1)) },
      { x: -4, y: -52, fn: () => cel(PB([-6, 4, -7, -3, 0, -5, 5, -1, 3, 5]), STO, { d: 1.6, r: .8, w: 1.2, dark: STOD, lite: STOL }) },
      { x: 6, y: -50, fn: () => cel(PB([-5, 4, -4, -4, 4, -4, 6, 2, 1, 5]), STO, { d: 1.6, r: .8, w: 1.2, dark: STOD, lite: STOL }) },
    ],
    cols: ['#A29C90', '#E0DACC', '#5E5A54', '#AAB45A'],
  };

  // ---- MANNEQUIN OF THE MUSES: a cuirass of glazed porcelain painted in blue, and a porcelain mask on its egg of a head,
  // a classical face painted on it. Broken, the dummy is hollow: in its chest a piazza at evening, a train going by (art_w6.js)
  function chinaCuirass(ty, n, t) {
    const p = PB([-7.6, ty - 1, -9.8, ty - 11, -10.6, ty - 20, -6.8, ty - 26.4, 6.8, ty - 26.4, 10.6, ty - 20, 9.8, ty - 11, 7.6, ty - 1]);
    cel(p, GLAZE, { d: 2.2, r: 1.1, w: 1.4, dark: '#C8C4D4', lite: '#FFFFFF', tex: () => {
      ctx.strokeStyle = DELFT; ctx.lineWidth = .8; ctx.beginPath(); // a painted vine, as on a Delft tile
      ctx.moveTo(-6, ty - 4); ctx.bezierCurveTo(-8, ty - 12, 2, ty - 10, 0, ty - 17); ctx.bezierCurveTo(-2, ty - 22, 5, ty - 24, 6, ty - 20); ctx.stroke();
      ctx.fillStyle = DELFT; for (const [x, y] of [[-6, ty - 9], [1, ty - 13], [3, ty - 21], [5, ty - 7]]) { ell(x, y, 1.6, .9, .6); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ell(-4, ty - 19, 1.6, 4.4, .3); ctx.fill(); } }); // the glaze's shine
    ctx.strokeStyle = C(GLD); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-6.8, ty - 25.6); ctx.lineTo(6.8, ty - 25.6); ctx.moveTo(-7.4, ty - 1.6); ctx.quadraticCurveTo(0, ty + .6, 7.4, ty - 1.6); ctx.stroke();
    crackIn(p, n, 321, 0, ty - 13, 8, 11, 'rgba(60,60,80,.9)', 'rgba(255,255,255,.6)');
  }
  function chinaMask(n) { // on the egg, in the head's own frame
    const p = PE(4.6, -8.4, 3.8, 6.2, .12);
    cel(p, GLAZE, { d: 1, r: .5, w: 1, dark: '#C8C4D4', lite: '#FFFFFF', tex: () => {
      ctx.strokeStyle = DELFT; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(3.6, -11.6); ctx.quadraticCurveTo(5.4, -12.6, 7.2, -11.4); ctx.stroke(); // a painted brow
      ctx.fillStyle = DELFT; ell(5.8, -10.2, 1, .5); ctx.fill(); // its eye, painted shut
      ctx.strokeStyle = 'rgba(80,90,140,.6)'; ctx.beginPath(); ctx.moveTo(7.6, -10); ctx.lineTo(8.2, -7); ctx.lineTo(7.2, -6.6); ctx.stroke(); // the nose
      ctx.fillStyle = '#C04A50'; ell(6.4, -4.6, 1.2, .5); ctx.fill(); } }); // the lips
    ctx.strokeStyle = C(GLD); ctx.lineWidth = .7; p(0, 0); ctx.stroke();
    crackIn(p, n, 331, 5, -8, 3, 5, 'rgba(60,60,80,.9)', 'rgba(255,255,255,.6)');
  }
  ARMOR.w6mannequin = {
    draw(e, a) { const n = nCracks(e), t = a.t || 0; at(e, 'torso', () => { if (e.armA.ty != null) chinaCuirass(e.armA.ty, n, t); }); at(e, 'head', () => chinaMask(n)); },
    pieces: [
      { x: -3, y: -45, fn: () => cel(PB([-5, -7, 3, -8, 5, 0, 2, 8, -5, 6]), GLAZE, { d: 1.6, r: .8, w: 1.2, dark: '#C8C4D4', tex: () => { ctx.strokeStyle = DELFT; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-3, 4); ctx.quadraticCurveTo(0, -2, 2, -5); ctx.stroke(); } }) },
      { x: 4, y: -38, fn: () => cel(PB([-4, -6, 5, -5, 4, 7, -5, 5]), GLAZE, { d: 1.6, r: .8, w: 1.2, dark: '#C8C4D4', tex: () => { ctx.fillStyle = DELFT; ell(0, 0, 1.6, .9, .6); ctx.fill(); } }) },
      { x: 5, y: -69, fn: piece(4.6, -8.4, () => chinaMask(1)) },
    ],
    cols: ['#F6F2EA', '#3A5AA8', '#D8A848', '#C8C4D4'],
    onBreak(e) { quicken(e, 1.1); },
  };

  // ---- COLLECTIVE INVENTION: a fishbowl over its head, full of sea, so it can breathe. Broken, the water is gone: it
  // gasps fast and dry, its gills flaring, its scales flaking off (art_w6.js)
  const BOWLG = PE(3, -25, 12.5, 12);
  function fishbowl(t, n) {
    ctx.save(); BOWLG(0, 0); ctx.clip();
    const wl = -30 + Math.sin(t * 2.2) * 1.2; ctx.fillStyle = FLASH ? '#fff' : TINT || 'rgba(110,180,220,.32)'; ctx.beginPath(); ctx.moveTo(-12, wl); for (let x = -12; x <= 18; x += 3) ctx.lineTo(x, wl + Math.sin(x * .5 + t * 3) * .8); ctx.lineTo(18, -10); ctx.lineTo(-12, -10); ctx.fill(); // the water in it
    if (DET()) { ctx.strokeStyle = 'rgba(230,250,255,.8)'; ctx.lineWidth = .7; for (let i = 0; i < 3; i++) { const k = (t * .7 + i / 3) % 1; circle(8 + i * 2 - k * 2, -15 - k * 13, .7 + k * .6); ctx.stroke(); } }
    ctx.restore();
    moonGlass(BOWLG, -10, -37, 15, -13, .12);
    crackIn(BOWLG, n, 341, 3, -25, 9, 9, 'rgba(255,255,255,.95)', 'rgba(30,60,80,.4)');
    ctx.strokeStyle = C('rgba(220,240,255,.9)'); ctx.lineWidth = 1; BOWLG(0, 0); ctx.stroke(); BOWLG(0, 0); outline(.9);
    ctx.fillStyle = C(GLD); ell(3, -13.4, 9, 2.4); ctx.fill(); outline(1); if (DET()) { ctx.fillStyle = GLDL; ctx.fillRect(-3, -14.6, 8, .8); } // its brass collar
  }
  ARMOR.w6fish = {
    draw(e, a) { const n = nCracks(e); at(e, 'body', () => fishbowl(a.t || 0, n)); },
    pieces: [
      { x: -4, y: -64, fn: () => { const p = PP([-6, -5, 5, -7, 4, 5, -5, 3]); moonGlass(p, -6, -7, 5, 5, .35); p(0, 0); outline(.8); } },
      { x: 8, y: -58, fn: () => { const p = PP([-4, -6, 6, -3, 2, 6]); moonGlass(p, -4, -6, 6, 6, .35); p(0, 0); outline(.8); } },
      { x: 2, y: -50, fn: () => { const p = PP([-5, -3, 6, -5, 3, 4, -4, 5]); moonGlass(p, -5, -5, 6, 5, .35); p(0, 0); outline(.8); } },
      { x: 3, y: -44, fn: () => { ctx.fillStyle = C(GLD); ell(0, 0, 9, 2.4); ctx.fill(); outline(1); } },
    ],
    cols: ['#BEE6F4', '#6EB4DC', '#FFFFFF', '#D8A848'],
    onBreak(e) { quicken(e, 1.12); }, // frantic
  };

  // ---- SOFT CLOCK: still hard, in a gold hunter case, its lid shut but for a little window on the hands. Broken, nothing
  // holds it: it runs right down into a puddle of gold (art_w6.js)
  function hunterLid(n) {
    const p = (ox, oy, c) => { if (!c) ctx.beginPath(); ctx.ellipse(ox, -17 + oy, 13.8, 12.6, 0, 0, TAU); ctx.moveTo(5 + ox, -17 + oy); ctx.arc(ox, -17 + oy, 5, 0, TAU, true); };
    p(0, 0); ctx.fillStyle = C(GLD); ctx.fill('evenodd');
    if (DET()) { ctx.save(); p(0, 0); ctx.clip('evenodd');
      const g = ctx.createRadialGradient(-4, -22, 1, 0, -17, 15); g.addColorStop(0, GLDL); g.addColorStop(.6, GLD); g.addColorStop(1, GLDD); ctx.fillStyle = g; ctx.fillRect(-15, -31, 30, 28);
      ctx.strokeStyle = 'rgba(120,80,30,.6)'; ctx.lineWidth = .5; for (let i = 0; i < 24; i++) { const an = i / 24 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(an) * 6, -17 + Math.sin(an) * 6); ctx.lineTo(Math.cos(an) * 11, -17 + Math.sin(an) * 10.2); ctx.stroke(); } // engraved rays
      ctx.strokeStyle = 'rgba(255,240,200,.8)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.ellipse(0, -17, 12, 10.8, 0, 3.6, 4.6); ctx.stroke();
      ctx.restore(); }
    p(0, 0); outline(1.3);
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, -17, 13.8, 12.6, 0, 0, TAU); crackIn((ox, oy, c) => { if (!c) ctx.beginPath(); ctx.ellipse(ox, -17 + oy, 13.8, 12.6, 0, 0, TAU); }, n, 351, 0, -17, 10, 9, 'rgba(255,250,230,.95)', 'rgba(90,60,20,.7)'); ctx.restore();
    fillPoly([-14.4, -19, -16.4, -20, -16.4, -14, -14.4, -15], GLDD, .8); // the hinge
  }
  ARMOR.w6clock = {
    draw(e, a) { const n = nCracks(e); at(e, 'face', () => hunterLid(n)); },
    pieces: [
      { x: -6, y: -18, fn: () => { ctx.fillStyle = C(GLD); ctx.beginPath(); ctx.arc(0, 0, 12, Math.PI * .5, Math.PI * 1.5); ctx.arc(0, 0, 5, Math.PI * 1.5, Math.PI * .5, true); ctx.closePath(); ctx.fill(); outline(1.1); } },
      { x: 6, y: -18, fn: () => { ctx.fillStyle = C(GLD); ctx.beginPath(); ctx.arc(0, 0, 12, -Math.PI * .5, Math.PI * .5); ctx.arc(0, 0, 5, Math.PI * .5, -Math.PI * .5, true); ctx.closePath(); ctx.fill(); outline(1.1); } },
    ],
    cols: ['#D8A848', '#FFE6A0', '#8A6424', '#F6EEDA'],
  };

  // ---- LOBSTER TELEPHONE: brass gongs on the phone, and brass straps holding the lobster down on its cradle. Broken, the
  // receiver is off the hook: the lobster gets up over the phone, bigger, claws up, trailing its cord (art_w6.js)
  function gong(x, y, n) {
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x, y + 7); ctx.stroke();
    const p = (ox, oy, c) => { if (!c) ctx.beginPath(); ctx.moveTo(x - 5.4 + ox, y + 3 + oy); ctx.bezierCurveTo(x - 5.6 + ox, y - 5 + oy, x + 5.6 + ox, y - 5 + oy, x + 5.4 + ox, y + 3 + oy); ctx.closePath(); };
    cel(p, GLD, { d: 1.4, r: .7, w: 1.1, dark: GLDD, lite: GLDL });
    crackIn(p, n, 361 + x, x, y, 4, 3, 'rgba(255,250,230,.95)', 'rgba(90,60,20,.7)');
    ctx.fillStyle = C(GLDD); circle(x, y - 3.4, 1); ctx.fill(); outline(.6);
  }
  function lobsterStraps(n) {
    for (const x of [-3, 5]) { rrect(x - 1.6, -6.8, 3.2, 12.6, 1); ctx.fillStyle = C(GLD); ctx.fill(); outline(.9); if (DET()) { ctx.fillStyle = GLDL; ctx.fillRect(x - .9, -6, 1, 11); } ctx.fillStyle = C(GLDD); circle(x, -5, .7); ctx.fill(); circle(x, 4, .7); ctx.fill(); }
    if (n && DET()) { ctx.strokeStyle = 'rgba(255,250,230,.95)'; ctx.lineWidth = .6; for (let i = 0; i < n; i++) { const x = i % 2 ? 5 : -3, y = -4 + hsh(i + 1) * 8; ctx.beginPath(); ctx.moveTo(x - 1.6, y); ctx.lineTo(x + 1.6, y + 1); ctx.stroke(); } }
  }
  ARMOR.w6lobster = {
    draw(e, a) { const n = nCracks(e); at(e, 'root', () => { gong(-15, -24, n); gong(15, -24, n); }); at(e, 'lob', () => lobsterStraps(n)); },
    pieces: [
      { x: -15, y: -22, fn: piece(-15, -24, () => gong(-15, -24, 1)) },
      { x: 15, y: -22, fn: piece(15, -24, () => gong(15, -24, 1)) },
      { x: 1, y: -28, fn: piece(1, 0, () => lobsterStraps(1)) },
    ],
    cols: ['#D8A848', '#FFE6A0', '#C8402E', '#1E1E26'],
    onBreak(e) { quicken(e, 1.08); },
  };

  // ---- BIRD OF DAYLIGHT: hung in a gilt frame, as a picture. Broken out of it, the day inside it turns to night (art_w6.js)
  const FR = [-27, -26, 51, 42];
  function giltSide(x0, y0, x1, y1) {
    ctx.save(); ctx.lineCap = 'square';
    for (const [c, w] of [[OUT, 5.6], [GLDD, 4], [GLD, 2.6]]) { ctx.strokeStyle = C(c); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
    if (DET()) { ctx.strokeStyle = GLDL; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(x0, y0 - .8); ctx.lineTo(x1, y1 - .8); ctx.stroke(); }
    ctx.restore();
  }
  function giltFrame(n) {
    const [x, y, w, h] = FR;
    giltSide(x, y, x + w, y); giltSide(x + w, y, x + w, y + h); giltSide(x + w, y + h, x, y + h); giltSide(x, y + h, x, y);
    for (const [cx, cy] of [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]) { ctx.fillStyle = C(GLD); circle(cx, cy, 3.2); ctx.fill(); outline(.9); ctx.fillStyle = C(GLDD); circle(cx, cy, 1.2); ctx.fill(); } // its rosettes
    if (n && DET()) { ctx.strokeStyle = 'rgba(40,24,8,.9)'; ctx.lineWidth = .9; for (let i = 0; i < n; i++) { const u = hsh(i + 4), side = i % 4, px = side === 0 ? x + u * w : side === 1 ? x + w : side === 2 ? x + u * w : x, py = side === 0 ? y : side === 1 ? y + u * h : side === 2 ? y + h : y + u * h; ctx.beginPath(); ctx.moveTo(px - 1.6, py - 1.6); ctx.lineTo(px + 1.6, py + 1.6); ctx.stroke(); } }
  }
  ARMOR.w6skybird = {
    draw(e, a) { const n = nCracks(e); at(e, 'root', () => giltFrame(n)); },
    pieces: [
      { x: 0, y: -46, fn: () => giltSide(-25, 0, 25, 0) }, { x: 0, y: -2, fn: () => giltSide(-25, 0, 25, 0) },
      { x: -34, y: -24, fn: () => giltSide(0, -20, 0, 20) }, { x: 32, y: -24, fn: () => giltSide(0, -20, 0, 20) },
    ],
    cols: ['#D8A848', '#FFE6A0', '#5E9AD8', '#FFFFFF'],
  };

  // ---- STILT ELEPHANT: bands of gold that stiffen its knees, and a gilt headdress. Broken, its legs go soft as the clocks:
  // it sags lower on knees that bend and wobble, and can be reached the better for it (art_w6.js)
  function goldBand(x, y, ang, n, seed) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    rrect(-3.4, -2.2, 6.8, 4.4, 1.4); ctx.fillStyle = C(GLD); ctx.fill(); outline(1);
    if (DET()) { ctx.fillStyle = GLDL; ctx.fillRect(-2.6, -1.6, 5.2, .9); ctx.fillStyle = '#C8203A'; circle(0, .4, .9); ctx.fill(); }
    if (n && DET() && hsh(seed) < n / 4) { ctx.strokeStyle = 'rgba(40,24,8,.9)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-1, -2.2); ctx.lineTo(.6, 2.2); ctx.stroke(); }
    ctx.restore();
  }
  function headdress(n) {
    const p = PB([20, -14, 26, -19, 33, -15, 34, -8, 29, -6, 23, -8]);
    cel(p, GLD, { d: 1.6, r: .8, w: 1.2, dark: GLDD, lite: GLDL, tex: () => { ctx.strokeStyle = 'rgba(120,80,30,.7)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(22, -9); ctx.quadraticCurveTo(28, -18, 33, -10); ctx.stroke(); } });
    ctx.fillStyle = C('#C8203A'); circle(28, -12, 1.8); ctx.fill(); outline(.8); if (DET()) { ctx.fillStyle = '#FFC0C8'; circle(27.4, -12.6, .6); ctx.fill(); }
    for (let i = 0; i < 3; i++) { ctx.strokeStyle = C(GLD); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(23 + i * 4, -7); ctx.lineTo(22.6 + i * 4, -2); ctx.stroke(); ctx.fillStyle = C('#C8203A'); circle(22.6 + i * 4, -1.6, .9); ctx.fill(); } // its tassels
    horn(26, -19, 24, -25, 19, -28, 2.8, .4, '#E8705A', .8, '#A8302A'); // a plume
    crackIn(p, n, 371, 27, -13, 6, 5, 'rgba(255,250,230,.95)', 'rgba(90,60,20,.7)');
  }
  ARMOR.w6elephant = {
    draw(e, a) { const n = nCracks(e);
      at(e, 'root', () => { (e.armA.knees || []).forEach((k, i) => { goldBand(k[0], k[1], Math.atan2(k[1] - k[3], k[0] - k[2]) + Math.PI / 2, n, i); goldBand(lerp(k[0], k[4], .55), lerp(k[1], k[5], .55), Math.atan2(k[5] - k[1], k[4] - k[0]) + Math.PI / 2, n, i + 7); }); });
      at(e, 'body', () => headdress(n)); },
    pieces: [
      { x: 28, y: -124, fn: piece(28, -13, () => headdress(1)) },
      { x: -14, y: -60, fn: () => goldBand(0, 0, 0, 0, 0) }, { x: 12, y: -58, fn: () => goldBand(0, 0, .3, 0, 0) },
      { x: -10, y: -30, fn: () => goldBand(0, 0, -.2, 0, 0) }, { x: 16, y: -32, fn: () => goldBand(0, 0, .1, 0, 0) },
    ],
    cols: ['#D8A848', '#FFE6A0', '#C8203A', '#8A7A80'],
    onBreak(e) { e.hh = Math.round(e.hh * .78); }, // it sags lower, into reach
  };
})();
