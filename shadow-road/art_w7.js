'use strict';
// World 7 of eight (data_w7.js, stage index 6): REBMA, THE CITY BENEATH THE SEA. Its art, foes, boss, passages, rules and
// music; its relic and its ending are in w7_late.js. Painted like the things the deep keeps of the old world: illuminated
// sea-charts, Byzantine mosaic dimmed by fathoms of water, stained glass with the sea behind it, pearl and verdigris.
//   rebma      - Faiella-bionin, the Stair into the Sea: the great stair going down off the cliffs of Kolvir under the
//                waves, its torches burning green-gold in the water; overhead the underside of the sea, and far below the
//                pearl towers of Rebma (rule 'w7surge': the swell overhead draws the water back down the stair, then the
//                ninth wave drives it up again; stand in the lee of a newel-post or be carried)
//   rebma2     - The Streets of Rebma: Amber turned about in nacre and green bronze; the surface overhead is a mirror
//                that hangs the city upside down above itself; a campanile with the Drowned Bell (rule 'w7toll': the bell
//                tolls and the stroke goes through the street like a hammer; be off the ground when it lands, or in a
//                column of bubbles from the vents, which lift whatever stands in them)
//   rebmaBoss  - The Pattern of Rebma: a hall under the palace, the reversed Pattern laid in lapis and gold in its floor,
//                an apse of dim gold mosaic and a rose window with the sea behind it (rule 'w7glass': the King in the Glass)
// Foes: Drowned of the Fleet, Torchbearer of Faiella, Halberdier of Moire, Siren of the Stair, Hippocamp Rider, Bronze
// Triton, Knight in the Glass Bell; the Sea-Bishop keeps the well. Boss: the King in the Glass, Oberon's reflection
// (the King upon the Pattern; the Maelstrom; Through the Glass, he and his reflection).
// Passages: 'w7gate' (through the Gate of Rebma, a veil of rising bubbles) and 'w7well' (down the Well of the Pattern).
// Everything lives in this closure; the late parts are handed to data_w7.js.
(() => {
  const T = FLOOR_TOP;
  const DET = () => !FLASH && !TINT;
  const add = (fn) => { if (!DET()) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
  const poly = (pts) => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); };
  const fillPoly = (pts, col, ow) => { poly(pts); ctx.fillStyle = C(col); ctx.fill(); if (ow) outline(ow); };
  const glowM = (x, y, r, rgb, a) => { if (a <= 0 || r <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.5, `rgba(${rgb},${a * .35})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); };
  const hsh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const sm = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const cl01 = (k) => clamp(k, 0, 1);
  const lineP = (pts) => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); };
  // a tapering stroke along a quadratic curve, as two edges and its spine
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
  // a limb, a tail, a strand of hair: a tapered, inked stroke, its shadow side darker and a lit line along the other
  function limb(x0, y0, cx, cy, x1, y1, w0, w1, col, ow = 1.1, dark) {
    const s = taper(x0, y0, cx, cy, x1, y1, w0, w1);
    trace(s.L, s.R); ctx.fillStyle = C(col); ctx.fill();
    if (DET()) {
      trace(s.R, s.M); ctx.fillStyle = dark || shade(col, -.36); ctx.fill();
      ctx.strokeStyle = shade(col, .42); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(s.L[0], s.L[1]); for (let i = 2; i < s.L.length - 2; i += 2) ctx.lineTo(s.L[i], s.L[i + 1]); ctx.stroke();
    }
    if (ow) { trace(s.L, s.R); outline(ow); }
    return s;
  }
  const BIGR = () => ctx.rect(-260, -260, 520, 520);
  // a painted shape: its color, a shadow side pushed down and away from the light, a lit edge, a texture, an ink line
  function cel(path, col, o = {}) {
    const d = o.d ?? 3, r = o.r ?? 1.1, w = o.w ?? 1.5;
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
    ctx.beginPath(); // (leave no path behind: a later stroke must not pick it up)
  }
  const PB = (pts) => (ox, oy, cont) => { if (!cont) ctx.beginPath(); const n = pts.length / 2;
    for (let i = 0; i <= n; i++) { const a = i % n, b = (i + 1) % n, mx = (pts[a * 2] + pts[b * 2]) / 2 + ox, my = (pts[a * 2 + 1] + pts[b * 2 + 1]) / 2 + oy;
      if (i === 0) ctx.moveTo(mx, my); else ctx.quadraticCurveTo(pts[a * 2] + ox, pts[a * 2 + 1] + oy, mx, my); }
    ctx.closePath(); };
  const PP = (pts) => (ox, oy, cont) => { if (!cont) ctx.beginPath(); ctx.moveTo(pts[0] + ox, pts[1] + oy); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i] + ox, pts[i + 1] + oy); ctx.closePath(); };
  const PE = (x, y, rx, ry, rot = 0) => (ox, oy, cont) => { if (!cont) ctx.beginPath(); ctx.moveTo(x + ox + Math.cos(rot) * rx, y + oy + Math.sin(rot) * rx); ctx.ellipse(x + ox, y + oy, Math.max(.1, rx), Math.max(.1, ry), rot, 0, TAU); };
  // a two-joint limb as two tapered inked strokes: from (x0, y0), the upper part at angle a1 for l1, the lower at a2 for l2
  function seg2(x0, y0, a1, l1, a2, l2, w1, w2, col, o = {}) {
    const kx = x0 + Math.cos(a1) * l1, ky = y0 + Math.sin(a1) * l1, ex = kx + Math.cos(a2) * l2, ey = ky + Math.sin(a2) * l2;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const stroke = (pts, w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.stroke(); };
    const ink = FLASH ? '#fff' : (o.ink || INK);
    stroke([x0, y0, kx, ky], w1 + 2.2, ink); stroke([kx, ky, ex, ey], w2 + 2.2, ink);
    stroke([x0, y0, kx, ky], w1, C(col)); stroke([kx, ky, ex, ey], w2, C(o.col2 || col));
    if (DET()) { const lit = o.lit || shade(col, .32), n1 = a1 - Math.PI / 2, n2 = a2 - Math.PI / 2, d1 = w1 * .28, d2 = w2 * .28;
      ctx.globalAlpha = .8; stroke([x0 + Math.cos(n1) * d1, y0 + Math.sin(n1) * d1, kx + Math.cos(n1) * d1, ky + Math.sin(n1) * d1], Math.max(.6, w1 * .26), lit);
      stroke([kx + Math.cos(n2) * d2, ky + Math.sin(n2) * d2, ex + Math.cos(n2) * d2, ey + Math.sin(n2) * d2], Math.max(.6, w2 * .26), o.lit2 || lit); ctx.globalAlpha = 1; }
    return { kx, ky, ex, ey };
  }
  function gait(ph, side, stride = .42, lift = .75, moving = 1) { // a walking leg's two angles at a phase of the stride
    const p = ph + side * Math.PI, th = Math.PI / 2 + Math.sin(p) * stride * moving, kn = (.06 + Math.max(0, Math.sin(p + 1.3)) * lift) * moving + .04;
    return [th, th + kn];
  }
  const breath = (e, t, rate = 2) => Math.sin(t * rate + (e.slot || 0) * .3);
  const actK = (e, name) => e.state === 'w7act' && e.w7a === name ? (e.w7k ?? 0) : -1; // how far through one of its actions it is (or -1)
  const windK = (e, a, plan) => e.state === 'wind' && e.plan === plan ? (a.wind || 0) : 0;
  // underwater, under the sea's own light: the palettes of the deep (no colour here is used by any other world)
  const PAL = {
    sea0: '#06161E', sea1: '#0C2E3C', sea2: '#1A5560', sea3: '#3E8A86', surf: '#B8E0D2', // the water, deep to shallow
    lapis: '#1E3A78', lapisL: '#4A6AB8', lapisD: '#0E1C40', // the Pattern's blue
    verd: '#3E8A72', verdL: '#8CCAAE', verdD: '#1C4438', // verdigris, green bronze
    bronze: '#9A7040', bronzeL: '#E0B070', bronzeD: '#4A3018',
    nacre: '#E6DCD4', nacreL: '#FFF8F2', nacreD: '#9A90A8', nacreP: '#D8C8E8', nacreG: '#C8E4DC', // mother of pearl, its fire
    gold: '#C89A3A', goldL: '#F2D68A', goldD: '#6A4A18', // gold leaf, dimmed by the deep
    marble: '#C8CCC0', marbleL: '#EEF0E6', marbleD: '#6E7A78',
    flame: '#9AF0B0', flameL: '#E8FFD8', flameD: '#2E8A5A', // the torches of Faiella-bionin burn green under the water
    coral: '#C86A5A', coralL: '#F2A890', coralD: '#6A2A2A',
    skinD: '#7AA89A', skin: '#A8D0C2', skinL: '#D8F0E6', // the drowned
    rebm: '#7EC8B0', rebmL: '#C8F0E0', rebmD: '#2E6A5A', // Rebman flesh: green-pale, as Llewella's
    hair: '#2E7A62', hairL: '#7ED0A8', // and their sea-green hair
    ink: '#0E1A1E',
  };
  const RGB = { surf: '200,236,224', flame: '170,255,190', pearl: '236,232,246', lapis: '110,150,230', gold: '255,214,140', deep: '8,30,40' };
  const W7 = { PAL, RGB }; // state shared between the parts of this file, w7_late.js and tests
  window.W7 = W7;

  // ======================================================================================================
  // SHARED PIECES OF THE DEEP
  // ======================================================================================================
  // straight rays of gold leaf fanning down from the surface, as light from heaven is drawn in an illumination
  function goldRays(cx, y0, y1, n, spread, a, rnd) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) { const u = (i + .5) / n - .5, x1 = cx + u * spread * 2 + (rnd() - .5) * 20, w = .6 + rnd() * 1.1, al = a * (.5 + rnd() * .5);
      const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, `rgba(${RGB.gold},${al})`); g.addColorStop(.7, `rgba(${RGB.gold},${al * .35})`); g.addColorStop(1, `rgba(${RGB.gold},0)`);
      ctx.strokeStyle = g; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(cx + u * 30, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
    ctx.restore();
  }
  // a mass of drowned cliff: facets lit from above by the water's light, dark in their clefts
  function cliff(x, w, top, base, rnd, col, lit) {
    const pts = [x - w * .5, base], n = 14;
    for (let i = 0; i <= n; i++) { const u = i / n, px = x - w * .5 + u * w + (rnd() - .5) * 10, py = top + Math.pow(Math.abs(u - .45) * 2, 1.4) * (base - top) * .85 + (i % 2 ? -1 : 1) * rnd() * 14; pts.push(px, Math.min(base, py)); } // crags
    pts.push(x + w * .5, base); poly(pts); ctx.fillStyle = col; ctx.fill();
    ctx.save(); poly(pts); ctx.clip();
    const g = ctx.createLinearGradient(0, top, 0, base); g.addColorStop(0, 'rgba(120,200,190,.25)'); g.addColorStop(.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(2,14,22,.45)'); ctx.fillStyle = g; ctx.fillRect(x - w, top - 20, w * 2, base - top + 20);
    for (let i = 0; i < 34; i++) { const px = x - w * .5 + rnd() * w, py = top + rnd() * (base - top), fw = 6 + rnd() * 22; // facets: a lit ledge over a shadowed face
      ctx.fillStyle = lit; ctx.globalAlpha = .16 + rnd() * .2; poly([px - fw, py, px - fw * .3, py - fw * .35, px + fw * .6, py - fw * .15, px + fw, py]); ctx.fill();
      ctx.fillStyle = '#04121A'; ctx.globalAlpha = .22 + rnd() * .2; poly([px - fw, py, px + fw, py, px + fw * .7, py + fw * 1.1, px - fw * .8, py + fw * .8]); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.restore();
    lineP(pts.slice(2, pts.length - 2)); ctx.strokeStyle = lit; ctx.globalAlpha = .5; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1; // light along the crests
  }
  // a colossus standing in the deep, as the sea-charts draw the great statues at the mouths of harbours: a crowned
  // figure in a long robe, one hand on a sword, the other holding up a lamp; the sea has had it a long time
  function colossus(x, base, h, rnd) {
    const s = h / 140, X = (v) => x + v * s, Y = (v) => base - v * s;
    ctx.fillStyle = '#2E6A6E'; poly([X(-26), Y(0), X(-30), Y(8), X(30), Y(8), X(26), Y(0)]); ctx.fill(); // the plinth's top, in the haze
    const robe = [X(-18), Y(0), X(-21), Y(40), X(-15), Y(86), X(-12), Y(104), X(12), Y(104), X(16), Y(86), X(20), Y(40), X(18), Y(0)];
    poly(robe); const g = ctx.createLinearGradient(X(-20), 0, X(20), 0); g.addColorStop(0, '#2A5E64'); g.addColorStop(.35, '#6EA8A4'); g.addColorStop(1, '#1E4A52'); ctx.fillStyle = g; ctx.fill();
    ctx.save(); poly(robe); ctx.clip(); ctx.strokeStyle = 'rgba(8,30,36,.55)'; ctx.lineWidth = 1.2 * s; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(X(-12 + i * 5), Y(96)); ctx.quadraticCurveTo(X(-14 + i * 5.6), Y(50), X(-16 + i * 6.4), Y(0)); ctx.stroke(); } ctx.restore(); // the folds
    ctx.fillStyle = '#5E9A96'; circle(X(0), Y(112), 8 * s); ctx.fill(); ctx.fillStyle = '#244E54'; circle(X(2.4), Y(111), 6 * s); ctx.fill(); // the head, its face worn away
    ctx.fillStyle = '#8A8A5A'; poly([X(-8), Y(118), X(-7), Y(126), X(-3.5), Y(121), X(0), Y(128), X(3.5), Y(121), X(7), Y(126), X(8), Y(118)]); ctx.fill(); // the crown, its gold gone green
    ctx.strokeStyle = '#4E8A88'; ctx.lineWidth = 5 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(X(14), Y(96)); ctx.quadraticCurveTo(X(26), Y(110), X(24), Y(132)); ctx.stroke(); // the arm raised
    ctx.fillStyle = '#5E9A96'; poly([X(18), Y(134), X(30), Y(134), X(27), Y(140), X(21), Y(140)]); ctx.fill(); glowM(X(24), Y(140), 16 * s, RGB.flame, .5); ctx.fillStyle = '#D8FFE6'; circle(X(24), Y(140), 1.8 * s); ctx.fill(); // its lamp, still lit
    ctx.strokeStyle = '#2E6268'; ctx.lineWidth = 2.4 * s; ctx.beginPath(); ctx.moveTo(X(-14), Y(92)); ctx.lineTo(X(-20), Y(40)); ctx.stroke(); ctx.lineWidth = 1.6 * s; ctx.beginPath(); ctx.moveTo(X(-24), Y(44)); ctx.lineTo(X(-16), Y(42)); ctx.stroke(); // the sword
    for (let i = 0; i < 10; i++) dab(X(-18 + rnd() * 36), Y(rnd() * 100), 2 + rnd() * 3 * s, 'rgba(120,60,70,.35)', .6); // the sea's growth on it
  }
  // a tower of Rebma, far below: pale nacre, slender, a bulbed cap, a lit window or two (the city is Amber's reflection)
  function pearlTower(x, base, h, w, rnd, a = 1) {
    ctx.save(); ctx.globalAlpha *= a;
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, '#9AB8C0'); g.addColorStop(.4, '#E6EEEA'); g.addColorStop(1, '#5A7A88');
    ctx.fillStyle = g; ctx.fillRect(x - w / 2, base - h, w, h);
    ctx.beginPath(); ctx.moveTo(x - w * .7, base - h); ctx.quadraticCurveTo(x - w * .9, base - h - w * 1.1, x, base - h - w * 2.2); ctx.quadraticCurveTo(x + w * .9, base - h - w * 1.1, x + w * .7, base - h); ctx.closePath(); ctx.fill(); // its bulbed cap
    ctx.fillStyle = 'rgba(255,240,200,.9)'; for (let i = 0; i < 3; i++) if (rnd() < .6) ctx.fillRect(x - .8, base - h + 4 + i * h * .28, 1.6, 2.4);
    ctx.strokeStyle = 'rgba(200,170,90,.8)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(x, base - h - w * 2.2); ctx.lineTo(x, base - h - w * 2.2 - 6); ctx.stroke();
    ctx.restore();
  }
  // a sea-fan on a rock: a lace of fine branches, the way the bestiaries draw the trees of the sea
  function seaFan(x, base, h, rnd, col = '#A84A5A', lit = '#F0A0A0') {
    ctx.lineCap = 'round';
    const branch = (x0, y0, a, len, w, d) => { const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len;
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2 + (rnd() - .5) * len * .3, (y0 + y1) / 2, x1, y1); ctx.stroke();
      if (d < 4) { branch(x1, y1, a - .35 - rnd() * .3, len * .72, w * .7, d + 1); branch(x1, y1, a + .35 + rnd() * .3, len * .72, w * .7, d + 1); }
      else if (rnd() < .6) { ctx.fillStyle = lit; circle(x1, y1, .9); ctx.fill(); } };
    branch(x, base, -Math.PI / 2 + (rnd() - .5) * .3, h * .3, 2.4, 0);
  }
  // a torch of Faiella-bionin: a bronze cresset on a fluted post; its flame (drawn live) burns green-gold under the water
  function cresset(x, base, h, s = 1) {
    const top = base - h;
    ctx.fillStyle = '#5E6E66'; ctx.fillRect(x - 3 * s, top, 6 * s, h); ctx.fillStyle = '#A8B8AE'; ctx.fillRect(x - 3 * s, top, 2 * s, h); // the post, its lit flute
    ctx.fillStyle = '#2E3E3A'; for (let i = 1; i < 3; i++) ctx.fillRect(x - .4 * s + (i - 1.5) * 2.4 * s, top, .8 * s, h);
    ctx.fillStyle = PAL.bronzeD; poly([x - 9 * s, top - 2 * s, x + 9 * s, top - 2 * s, x + 6 * s, top + 4 * s, x - 6 * s, top + 4 * s]); ctx.fill(); // the bowl
    ctx.fillStyle = PAL.verd; poly([x - 9 * s, top - 2 * s, x + 9 * s, top - 2 * s, x + 7.5 * s, top + 1 * s, x - 7.5 * s, top + 1 * s]); ctx.fill();
    ctx.fillStyle = PAL.verdL; ctx.fillRect(x - 9 * s, top - 2.6 * s, 18 * s, 1.2 * s);
    ctx.fillStyle = '#7A8A84'; ctx.fillRect(x - 5 * s, base - 4 * s, 10 * s, 4 * s); // its foot
  }
  // the flame of an underwater torch: it does not flicker up as fire does in air but streams and coils, and lets go bubbles
  function waterFlame(x, y, s, t, lean = 0, a = 1) {
    ctx.save(); ctx.globalAlpha *= a;
    for (let k = 0; k < 3; k++) { const h = (16 - k * 4) * s, w = (5 - k * 1.2) * s, wob = Math.sin(t * 5 + k + x) * 1.6 * s, tip = lean * 9 * s + wob;
      ctx.fillStyle = [PAL.flameD, PAL.flame, PAL.flameL][k];
      ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x - w * 1.1 + tip * .3, y - h * .5, x + tip, y - h); ctx.quadraticCurveTo(x + w * 1.1 + tip * .4, y - h * .45, x + w, y); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    glowM(x + lean * 4, y - 6 * s, 22 * s, RGB.flame, .28 * a);
  }

  // ======================================================================================================
  // FAIELLA-BIONIN, THE STAIR INTO THE SEA
  // ======================================================================================================
  function stairFar(rnd, th, f) {
    AW_SUN = 1;
    // the deep, far down: a dim plain of sand, and on it the pearl towers of Rebma, very small, lit
    const hz = T - 34;
    { const g = ctx.createLinearGradient(0, hz - 10, 0, T); g.addColorStop(0, 'rgba(20,70,80,0)'); g.addColorStop(.5, 'rgba(24,78,86,.85)'); g.addColorStop(1, '#14404C'); ctx.fillStyle = g; ctx.fillRect(0, hz - 10, AW_W, T - hz + 10); }
    for (let i = 0; i < 3; i++) awWR(220 + i * 430 + rnd() * 80, 120, rnd, (x, r) => { for (let k = 0; k < 9; k++) { const dx = (k - 4) * (8 + r() * 4), h = 18 + r() * 34 - Math.abs(k - 4) * 3; pearlTower(x + dx, hz + 8, h, 3 + r() * 2, r, .55); }
      glowM(x, hz - 6, 60, RGB.pearl, .12); });
    // the drowned cliffs of Kolvir, and the stair coming down their face in long zigzag flights, torch by torch
    awWR(640 + rnd() * 80, 60, rnd, (x, r) => colossus(x, hz + 8, 128, r));
    hazeBand(f, th.haze, 60, T, .25);
    for (let i = 0; i < 4; i++) awWR(i * 330 + rnd() * 60, 200, rnd, (x, r) => {
      cliff(x + (i % 2 ? 160 : 0), 240 + r() * 120, 80 + r() * 50, T, r, '#0E3440', '#5EA8A0');
      const fl = 3 + Math.floor(r() * 2); let sx = x - 70, sy = 110 + r() * 20;
      for (let k = 0; k < fl; k++) { const ex = sx + (k % 2 ? -1 : 1) * (60 + r() * 30), ey = sy + 22 + r() * 8;
        ctx.strokeStyle = 'rgba(190,220,210,.55)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke(); // the flight
        ctx.strokeStyle = 'rgba(10,30,36,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx, sy + 1.6); ctx.lineTo(ex, ey + 1.6); ctx.stroke();
        for (let q = 0; q <= 3; q++) { const px = lerp(sx, ex, q / 3), py = lerp(sy, ey, q / 3); ctx.fillStyle = '#C8FFD8'; ctx.fillRect(px - .6, py - 3, 1.2, 1.8); glowM(px, py - 2, 5, RGB.flame, .35); } // its torches
        sx = ex; sy = ey; }
    });
    hazeBand(f, th.haze, 120, T, .35);
    // and the rays of the light from above, as the illuminators drew them
    for (let i = 0; i < 4; i++) awWR(150 + i * 320 + rnd() * 60, 200, rnd, (x, r) => goldRays(x, 0, T - 20, 7, 110, .2, r));
  }
  function stairMid(rnd) {
    AW_SUN = 1;
    // beyond the balustrade the next flights go on down into the blue, with torches along them
    for (let i = 0; i < 3; i++) awWR(i * 430 + 200 + rnd() * 60, 220, rnd, (x, r) => {
      const y0 = T - 60, steps = 9;
      for (let k = 0; k < steps; k++) { const sx = x - 120 + k * 22, sy = y0 + k * 6; ctx.fillStyle = k % 2 ? '#3E7478' : '#4A8284'; ctx.fillRect(sx, sy, 24, 6); ctx.fillStyle = 'rgba(200,240,230,.35)'; ctx.fillRect(sx, sy, 24, 1); }
      ctx.fillStyle = 'rgba(14,44,52,.55)'; ctx.fillRect(x - 120, y0 + steps * 6, 200, 14);
      for (let k = 0; k < 3; k++) cresset(x - 110 + k * 70, y0 + k * 21 - 2, 20, .55);
    });
    // the balustrade along the back of the landing: a heavy rail on fat balusters, a newel-post every so far
    const rail = T - 28; W7.newels = [];
    ctx.fillStyle = '#6E7E7A'; ctx.fillRect(0, rail, AW_W, 6); ctx.fillStyle = '#C8D8D0'; ctx.fillRect(0, rail, AW_W, 2); ctx.fillStyle = '#3E4E4C'; ctx.fillRect(0, rail + 6, AW_W, 1.6);
    for (let x = 6; x < AW_W; x += 13) { // the balusters, each a swelled vase, lit from above
      const b = (y) => 2.2 + Math.sin(((y - rail - 8) / 20) * Math.PI) * 2.6;
      ctx.fillStyle = '#5E6E6A'; ctx.beginPath(); ctx.moveTo(x - 2, rail + 7); for (let y = rail + 7; y <= T - 2; y += 2) ctx.lineTo(x - b(y), y); for (let y = T - 2; y >= rail + 7; y -= 2) ctx.lineTo(x + b(y), y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(220,240,232,.6)'; ctx.fillRect(x - 1.6, rail + 9, 1.2, 14);
      ctx.fillStyle = 'rgba(8,24,28,.45)'; ctx.fillRect(x + 1.4, rail + 10, 1, 12);
    }
    ctx.fillStyle = '#6E7E78'; ctx.fillRect(0, T - 3, AW_W, 4);
    for (let i = 0; i < 6; i++) { const x = 40 + i * 213 + Math.floor(rnd() * 20); W7.newels.push(x);
      awWrap(x, 30, (x) => { // a newel-post: a squared pier with a cornice, a carved shell on its face, the torch on top
        ctx.fillStyle = '#7A8A84'; ctx.fillRect(x - 10, rail - 18, 20, T - rail + 18); ctx.fillStyle = '#C8D6CE'; ctx.fillRect(x - 10, rail - 18, 6, T - rail + 18);
        ctx.fillStyle = '#E6EEE8'; ctx.fillRect(x - 13, rail - 22, 26, 4); ctx.fillStyle = '#4E5E5A'; ctx.fillRect(x - 13, rail - 18, 26, 1.5);
        ctx.fillStyle = '#B8C8C0'; ctx.beginPath(); ctx.arc(x, rail - 2, 6, Math.PI, 0); ctx.fill(); ctx.strokeStyle = '#5E6E6A'; ctx.lineWidth = .6; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x, rail - 1); ctx.lineTo(x + k * 2.6, rail - 7); ctx.stroke(); } // a scallop
        cresset(x, rail - 22, 14, .9);
        for (let k = 0; k < 4; k++) dab(x - 8 + rnd() * 16, T - rnd() * 8, 2 + rnd() * 2, 'rgba(60,110,90,.6)', .7); // weed at its foot
      }); }
    // statues between: a crowned queen of the sea holding up a shell for a lamp
    for (let i = 0; i < 3; i++) awWR(146 + i * 426 + rnd() * 30, 30, rnd, (x, r) => {
      ctx.fillStyle = '#6E7E78'; ctx.fillRect(x - 9, rail - 6, 18, 8);
      const fig = [x - 6, rail - 6, x - 7, rail - 30, x - 4, rail - 44, x - 1, rail - 48, x + 2, rail - 48, x + 5, rail - 43, x + 7, rail - 30, x + 6, rail - 6]; poly(fig); ctx.fillStyle = '#A8B8B0'; ctx.fill();
      ctx.save(); poly(fig); ctx.clip(); ctx.fillStyle = '#E2ECE6'; ctx.fillRect(x - 8, rail - 50, 5, 46); ctx.strokeStyle = 'rgba(50,70,70,.5)'; ctx.lineWidth = .5; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - 3 + k * 2, rail - 38); ctx.quadraticCurveTo(x - 4 + k * 2.4, rail - 22, x - 3 + k * 2, rail - 6); ctx.stroke(); } ctx.restore();
      ctx.fillStyle = '#D6E2DA'; circle(x, rail - 52, 3.4); ctx.fill(); ctx.fillStyle = PAL.gold; poly([x - 3.4, rail - 55, x - 2.4, rail - 59, x - .8, rail - 56, x, rail - 60, x + .8, rail - 56, x + 2.4, rail - 59, x + 3.4, rail - 55]); ctx.fill(); // her crown, its gilding left
      ctx.strokeStyle = '#B8C8C0'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 4, rail - 44); ctx.quadraticCurveTo(x + 10, rail - 52, x + 9, rail - 60); ctx.stroke();
      ctx.fillStyle = PAL.nacre; ctx.beginPath(); ctx.arc(x + 9, rail - 62, 4, Math.PI * .9, Math.PI * 2.1); ctx.fill(); glowM(x + 9, rail - 64, 14, RGB.pearl, .3); // the shell-lamp
    });
  }
  // the landing: great slabs of sea-worn marble; the stair drops a step every so far (risers across the floor, so it
  // goes down as you go on); a mosaic runner down its middle; sand drifted against the risers; shells; a drowned helm
  function stairFloor(rnd, th) {
    { const g = ctx.createLinearGradient(0, T - 2, 0, VH); g.addColorStop(0, '#3E6462'); g.addColorStop(.35, '#557A72'); g.addColorStop(.8, '#2E4A4A'); g.addColorStop(1, '#14262A'); ctx.fillStyle = g; ctx.fillRect(0, T - 2, AW_W, VH - T + 2); }
    // the slabs: joints across and along, each slab its own tone, veined
    let y = T + 2; const rows = [10, 13, 16, 20, 25, 30];
    for (const h of rows) {
      for (const [x0, w] of awRow(rnd, h * 3, h * 6)) for (const ox of x0 + w > AW_W ? [0, -AW_W] : [0]) { const x = x0 + ox;
        ctx.fillStyle = rnd() < .5 ? `rgba(220,240,232,${.05 + rnd() * .1})` : `rgba(10,40,44,${.06 + rnd() * .12})`; ctx.fillRect(x + .6, y + .6, w - 1.2, h - 1.2);
        if (rnd() < .5) { ctx.strokeStyle = 'rgba(30,60,64,.35)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(x + rnd() * w, y + 1); ctx.quadraticCurveTo(x + rnd() * w, y + h * .5, x + rnd() * w, y + h - 1); ctx.stroke(); } // a vein
        ctx.fillStyle = 'rgba(10,30,34,.5)'; ctx.fillRect(x, y, .9, h); ctx.fillStyle = 'rgba(220,240,232,.25)'; ctx.fillRect(x + .9, y, .6, h); }
      ctx.fillStyle = 'rgba(10,30,34,.45)'; ctx.fillRect(0, y, AW_W, .9); ctx.fillStyle = 'rgba(220,240,232,.22)'; ctx.fillRect(0, y + .9, AW_W, .6);
      y += h;
    }
    // the runner: a band of mosaic down the stair, verdigris and dimmed gold in a running wave (the Vitruvian scroll)
    const ry0 = T + 46, ry1 = T + 66;
    ctx.fillStyle = '#1E4A48'; ctx.fillRect(0, ry0, AW_W, ry1 - ry0); ctx.fillStyle = PAL.goldD; ctx.fillRect(0, ry0, AW_W, 1.6); ctx.fillRect(0, ry1 - 1.6, AW_W, 1.6);
    for (let x = 0; x < AW_W; x += 20) { ctx.strokeStyle = PAL.gold; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, ry1 - 4); ctx.quadraticCurveTo(x + 6, ry0 + 2, x + 12, ry0 + 9); ctx.arc(x + 9, ry0 + 9, 3, 0, Math.PI * 1.5, true); ctx.stroke(); }
    for (let i = 0; i < 260; i++) { const x = rnd() * AW_W, yy = ry0 + 2 + rnd() * (ry1 - ry0 - 4); ctx.fillStyle = rnd() < .5 ? 'rgba(140,210,180,.35)' : 'rgba(10,30,30,.35)'; ctx.fillRect(x, yy, 1.6, 1.6); } // the tesserae, each its own
    // sand drifted soft against the foot of the balustrade, and in the joints
    for (let i = 0; i < 40; i++) { const x = rnd() * AW_W, yy = T + 2 + rnd() * 10; awWrap(x, 30, (x) => softDab(x, yy, 10 + rnd() * 18, '200,190,150', .14)); }
    // the front edge of the landing: here the next flight drops away toward us, step under step into the blue
    const ey = VH - 18; ctx.fillStyle = '#E2EEE8'; ctx.fillRect(0, ey, AW_W, 1.6); ctx.fillStyle = '#3E5E5C'; ctx.fillRect(0, ey + 1.6, AW_W, 5);
    ctx.fillStyle = '#6E8E88'; ctx.fillRect(0, ey + 6.6, AW_W, 4); ctx.fillStyle = '#C8DCD4'; ctx.fillRect(0, ey + 6.6, AW_W, 1); ctx.fillStyle = '#24403E'; ctx.fillRect(0, ey + 10.6, AW_W, VH - ey - 10.6);
    // what the sea leaves: shells, a sea-star, a drowned helm with weed in its eye-slits, a scatter of pearls
    for (let i = 0; i < 9; i++) awWR(rnd() * AW_W, 20, rnd, (x, r) => { const yy = T + 8 + r() * (VH - T - 20), k = i % 4;
      if (k === 0) { ctx.fillStyle = '#E8D8C8'; ctx.beginPath(); ctx.arc(x, yy, 4, Math.PI, 0); ctx.fill(); ctx.strokeStyle = '#9A8070'; ctx.lineWidth = .5; for (let q = -2; q <= 2; q++) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + q * 1.6, yy - 3.6); ctx.stroke(); } }
      else if (k === 1) { ctx.fillStyle = '#C86A4A'; poly([x, yy - 5, x + 1.4, yy - 1.4, x + 5, yy - 1, x + 2, yy + 1.4, x + 3, yy + 5, x, yy + 2.6, x - 3, yy + 5, x - 2, yy + 1.4, x - 5, yy - 1, x - 1.4, yy - 1.4]); ctx.fill(); }
      else if (k === 2) { ctx.fillStyle = '#4A5A58'; ctx.beginPath(); ctx.ellipse(x, yy - 4, 8, 6, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(x - 8, yy - 4, 16, 4); ctx.fillStyle = '#9AAAA4'; ctx.fillRect(x - 7, yy - 8, 3, 2); ctx.fillStyle = '#0A1416'; ctx.fillRect(x - 4, yy - 3.4, 8, 1.4); ctx.strokeStyle = '#3E8A5A'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 2, yy - 3); ctx.quadraticCurveTo(x + 6, yy - 12, x + 3, yy - 18); ctx.stroke(); }
      else for (let q = 0; q < 4; q++) { ctx.fillStyle = '#F2EEF6'; circle(x + q * 3 - 4, yy + (q % 2) * 2, 1.2); ctx.fill(); } });
    const sh = ctx.createLinearGradient(0, VH - 40, 0, VH); sh.addColorStop(0, 'rgba(4,16,20,0)'); sh.addColorStop(1, 'rgba(4,16,20,.5)'); ctx.fillStyle = sh; ctx.fillRect(0, VH - 40, AW_W, 40);
  }
  // the underside of the sea, overhead: the swell's troughs and crests as bright wavering seams, moving
  function surfaceBand(camX, t, a = 1, y0 = Y_OFF) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 4; k++) { const y = y0 + 3 + k * 5, amp = 2 + k, sp = .4 + k * .15;
      ctx.strokeStyle = `rgba(${RGB.surf},${(.4 - k * .08) * a})`; ctx.lineWidth = 1.6 - k * .25; ctx.beginPath();
      for (let x = -10; x <= VW + 10; x += 12) { const wx = x + camX * .05; ctx.lineTo(x, y + Math.sin(wx * .03 + t * sp + k) * amp + Math.sin(wx * .071 - t * sp * 1.3) * amp * .5); } ctx.stroke(); }
    const sx = VW * .5 - camX * .02, g = ctx.createRadialGradient(sx, y0, 4, sx, y0, 150); g.addColorStop(0, `rgba(230,250,240,${.4 * a})`); g.addColorStop(1, 'rgba(230,250,240,0)'); ctx.fillStyle = g; ctx.fillRect(sx - 150, y0 - 10, 300, 160); // Snell's window: the sky, squeezed into a circle overhead
    ctx.restore();
  }
  // marine snow: the slow fall of motes through the water, everywhere in Rebma
  function snow(camX, t, n = 26, rgb = '220,240,236', a = .5) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) { const d = .2 + hsh(i) * .6, W = VW + 40, x = (((hsh(i + 7) * 1500 - camX * d + Math.sin(t * .3 + i) * 10) % W) + W) % W - 20, y = Y_OFF + ((hsh(i + 3) * 300 + t * (4 + d * 8)) % (VH - Y_OFF));
      ctx.fillStyle = `rgba(${rgb},${a * (.4 + .6 * hsh(i + 11))})`; ctx.fillRect(x, y, 1 + d, 1 + d); }
    ctx.restore();
  }
  W7.surge = 0; // the ninth wave: -1 the undertow drawing down the stair, +1 the surge driving up it (the 'w7surge' rule)
  THEMES.rebma = {
    name: 'faiella-bionin', sky: ['#5EA89C', '#164E5E', '#0A2E40', '#061E2C'], sun: [0.5, -0.32, '210,246,232'], haze: '70,150,150',
    floorA: '#7A9E96', floorB: '#2A4446', path: '#C89A3A', skyKind: 'none',
    grade: { desat: .1, top: 'rgba(90,200,190,.2)', bot: 'rgba(8,30,60,.5)', vig: 'rgba(2,12,20,.72)' },
    liveSky(camX, t) { surfaceBand(camX, t); },
    liveFloor(camX, t) {
      // the torches on the newel-posts, streaming with the water (they lean down the stair in the undertow, up it in the surge)
      if (W7.newels) { const mx = camX * .45, lean = W7.surge * 1.4 + Math.sin(t * .7) * .12;
        for (const nx of W7.newels) { const x0 = (((nx - mx) % AW_W) + AW_W) % AW_W; for (const ox of [0, -AW_W]) { const x = x0 + ox; if (x < -30 || x > VW + 30) continue; waterFlame(x, T - 28 - 37, .9, t, lean, 1); } } }
      // the light off the swell overhead, netting the stair
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 1;
      for (let i = 0; i < 9; i++) { const y = T + 10 + i * 12, a = .06 + .04 * Math.sin(t * 1.3 + i); ctx.strokeStyle = `rgba(${RGB.surf},${a})`; ctx.beginPath();
        for (let x = -20; x <= VW + 20; x += 18) { const wx = x + camX; ctx.lineTo(x, y + Math.sin(wx * .045 + t * 1.1 + i * 1.7) * 4 + Math.sin(wx * .02 - t * .8) * 3); } ctx.stroke(); }
      ctx.restore();
      snow(camX, t);
    },
  };
  AW_FAR.rebma = stairFar; AW_MID.rebma = stairMid; AW_FLOOR.rebma = stairFloor;

  // ======================================================================================================
  // THE STREETS OF REBMA: Amber turned about, in nacre and green bronze, under a sea that mirrors it
  // ======================================================================================================
  // a house of Rebma: tall and narrow, a stepped gable, its windows stained glass lit from within (jewel colours on
  // the dark water), a little gold mosaic in its tympanum
  const GLASS = ['#3A6AD8', '#C8343A', '#E8B030', '#2E9A6A', '#8A4AC8'];
  function rebHouse(x, base, w, h, rnd, tone) {
    const top = base - h;
    ctx.fillStyle = tone; ctx.fillRect(x, top, w, h);
    const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, 'rgba(255,250,245,.18)'); g.addColorStop(.6, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(4,16,24,.35)'); ctx.fillStyle = g; ctx.fillRect(x, top, w, h);
    const st = 3, sw = w / (st * 2 + 1); ctx.fillStyle = tone; for (let i = 0; i < st; i++) ctx.fillRect(x + sw * (i + .5), top - (i + 1) * 7, w - sw * (i * 2 + 1), 7.2); // the stepped gable
    ctx.fillStyle = 'rgba(255,248,236,.5)'; for (let i = 0; i < st; i++) ctx.fillRect(x + sw * (i + .5), top - (i + 1) * 7, w - sw * (i * 2 + 1), 1);
    const rows = Math.max(1, Math.floor((h - 24) / 30));
    for (let r2 = 0; r2 < rows; r2++) for (let c = 0; c < 2; c++) { const wx = x + w * (.2 + c * .38), wy = top + 10 + r2 * 30, ww = w * .22, wh = 18;
      ctx.fillStyle = '#0A1622'; ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + ww * .5); ctx.quadraticCurveTo(wx, wy - ww * .3, wx + ww / 2, wy - ww * .5); ctx.quadraticCurveTo(wx + ww, wy - ww * .3, wx + ww, wy + ww * .5); ctx.lineTo(wx + ww, wy + wh); ctx.closePath(); ctx.fill();
      if (rnd() < .65) { ctx.save(); ctx.clip(); for (let q = 0; q < 6; q++) { ctx.fillStyle = GLASS[Math.floor(rnd() * GLASS.length)]; ctx.globalAlpha = .45 + rnd() * .25; ctx.fillRect(wx + (q % 2) * ww / 2, wy - ww * .5 + Math.floor(q / 2) * (wh + ww * .5) / 3, ww / 2, (wh + ww * .5) / 3); }
        ctx.globalAlpha = 1; ctx.strokeStyle = '#0A1014'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy - ww * .5); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh * .4); ctx.lineTo(wx + ww, wy + wh * .4); ctx.stroke(); ctx.restore();
        glowM(wx + ww / 2, wy + wh * .4, 16, '255,220,170', .16); } }
    ctx.fillStyle = '#0A1218'; ctx.fillRect(x + w * .38, base - 22, w * .24, 22); ctx.beginPath(); ctx.arc(x + w * .5, base - 22, w * .12, Math.PI, 0); ctx.fill(); // the door
    ctx.fillStyle = PAL.gold; ctx.globalAlpha = .7; for (let i = 0; i < 8; i++) ctx.fillRect(x + w * .36 + (i % 4) * w * .07, base - 30 - Math.floor(i / 4) * 3, w * .05, 2); ctx.globalAlpha = 1; // a strip of gold mosaic over it
  }
  // a dome of Rebma: green bronze over a drum of pearl, a gilt finial
  function rebDome(x, base, r, rnd) {
    ctx.fillStyle = '#C8D2D0'; ctx.fillRect(x - r, base - r * .7, r * 2, r * .7); ctx.fillStyle = 'rgba(8,20,28,.35)'; for (let i = 0; i < 5; i++) ctx.fillRect(x - r + (i + .3) * r * .4, base - r * .55, r * .14, r * .4);
    ctx.beginPath(); ctx.moveTo(x - r * 1.05, base - r * .7); ctx.quadraticCurveTo(x - r * 1.1, base - r * 1.9, x, base - r * 2.05); ctx.quadraticCurveTo(x + r * 1.1, base - r * 1.9, x + r * 1.05, base - r * .7); ctx.closePath();
    const g = ctx.createLinearGradient(x - r, 0, x + r, 0); g.addColorStop(0, '#8ACCB0'); g.addColorStop(.45, '#3E8A72'); g.addColorStop(1, '#16382E'); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(200,240,220,.35)'; ctx.lineWidth = .7; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * r * .4, base - r * .7); ctx.quadraticCurveTo(x + i * r * .3, base - r * 1.6, x, base - r * 2.05); ctx.stroke(); }
    ctx.fillStyle = PAL.goldL; ctx.fillRect(x - .8, base - r * 2.05 - 8, 1.6, 8); circle(x, base - r * 2.05 - 9, 1.8); ctx.fill();
  }
  // the palace of Moire, far up the street: Amber's palace turned about, its towers of glass and nacre in tiers
  function moirePalace(x, base, rnd) {
    for (let i = -3; i <= 3; i++) { const h = 70 + (3 - Math.abs(i)) * 26 + rnd() * 10, w = 16 - Math.abs(i) * 1.5, tx = x + i * 26; pearlTower(tx, base, h, w * .4, rnd, .9);
      const g = ctx.createLinearGradient(tx - w / 2, 0, tx + w / 2, 0); g.addColorStop(0, '#A8C4C8'); g.addColorStop(.4, '#F2F4EE'); g.addColorStop(1, '#5E7E8A'); ctx.fillStyle = g; ctx.fillRect(tx - w / 2, base - h * .7, w, h * .7);
      ctx.fillStyle = 'rgba(255,230,180,.85)'; for (let k = 0; k < 4; k++) ctx.fillRect(tx - 1, base - h * .7 + 8 + k * 14, 2, 4); }
    rebDome(x, base - 60, 22, rnd);
  }
  // the city hanging upside down in the mirror of the surface: the same towers, pale and rippled, roots up
  function mirrorCity(rnd) {
    const y0 = Y_OFF + 2;
    ctx.save(); ctx.globalAlpha = .32;
    for (let i = 0; i < 26; i++) { const x = rnd() * AW_W, h = 16 + rnd() * 46, w = 6 + rnd() * 12;
      awWrap(x, 30, (x) => { const g = ctx.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, '#E8F2EE'); g.addColorStop(1, 'rgba(200,230,226,0)'); ctx.fillStyle = g; ctx.fillRect(x - w / 2, y0, w, h);
        ctx.beginPath(); ctx.moveTo(x - w * .7, y0 + h); ctx.quadraticCurveTo(x, y0 + h + w * 1.6, x + w * .7, y0 + h); ctx.fill(); }); }
    ctx.restore();
  }
  function cityFar(rnd, th, f) {
    AW_SUN = 1;
    mirrorCity(rnd);
    // the far city: towers and domes going up the slope to the palace, all pearl and green bronze, hazed in blue
    const hz = T - 20;
    for (let i = 0; i < 2; i++) awWR(320 + i * 640 + rnd() * 60, 110, rnd, (x, r) => moirePalace(x, hz - 6, r));
    for (let i = 0; i < 16; i++) awWR(rnd() * AW_W, 30, rnd, (x, r) => { if (r() < .5) pearlTower(x, hz, 40 + r() * 50, 4 + r() * 3, r, .9); else rebDome(x, hz, 9 + r() * 7, r); });
    hazeBand(f, th.haze, 110, hz, .45);
    for (let i = 0; i < 12; i++) awWR(i * 107 + rnd() * 30, 50, rnd, (x, r) => rebHouse(x, T - 6, 34 + r() * 16, 50 + r() * 40, r, ['#5E7A86', '#6E8A92', '#56727E'][i % 3]));
    hazeBand(f, th.haze, 150, T - 6, .3);
    for (let i = 0; i < 3; i++) awWR(200 + i * 420 + rnd() * 60, 200, rnd, (x, r) => goldRays(x, Y_OFF, T - 30, 6, 90, .14, r));
  }
  function cityMid(rnd) {
    AW_SUN = 1;
    // the near houses lining the street, close together, their stained glass lit
    for (let x = 0; x < AW_W;) { const w = 54 + rnd() * 26, h = 92 + rnd() * 50, tone = ['#8EA4A6', '#7E989C', '#9AACA8', '#729096'][Math.floor(rnd() * 4)];
      const x0 = x; awWrap(x0, w + 10, (xx) => rebHouse(xx, T - 2, w, h, mulberry(Math.floor(x0 * 7)), tone)); x += w + 2 + rnd() * 6; }
    { const g = ctx.createLinearGradient(0, T - 150, 0, T); g.addColorStop(0, 'rgba(10,40,60,.35)'); g.addColorStop(1, 'rgba(10,40,60,.05)'); ctx.fillStyle = g; ctx.fillRect(0, T - 160, AW_W, 160); }
    // arcade piers in front of them, every so often, carrying lamps of pearl on chains
    W7.lamps = [];
    for (let i = 0; i < 7; i++) { const x = 60 + i * 183 + rnd() * 30; W7.lamps.push(x);
      awWrap(x, 30, (x) => { ctx.fillStyle = '#3E5E58'; ctx.fillRect(x - 5, T - 120, 10, 118); ctx.fillStyle = '#8ACCB0'; ctx.fillRect(x - 5, T - 120, 3, 118); ctx.fillStyle = PAL.gold; ctx.fillRect(x - 7, T - 124, 14, 4); ctx.fillRect(x - 7, T - 6, 14, 4);
        ctx.strokeStyle = '#2A3A36'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(x + 5, T - 112); ctx.quadraticCurveTo(x + 18, T - 108, x + 22, T - 96); ctx.stroke(); }); }
    // a hanging banner of sea-silk, with Rebma's arms: the unicorn, facing the wrong way
    for (let i = 0; i < 4; i++) awWR(150 + i * 320 + rnd() * 40, 20, rnd, (x, r) => { const y = T - 118, h = 50;
      ctx.fillStyle = '#1E4A6A'; poly([x - 9, y, x + 9, y, x + 9, y + h, x, y + h - 7, x - 9, y + h]); ctx.fill(); ctx.fillStyle = PAL.gold; ctx.fillRect(x - 10, y - 2, 20, 2.4);
      ctx.strokeStyle = PAL.goldL; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 4, y + 30); ctx.lineTo(x + 2, y + 18); ctx.lineTo(x - 3, y + 14); ctx.lineTo(x - 5, y + 20); ctx.moveTo(x - 3, y + 14); ctx.lineTo(x - 7, y + 8); ctx.stroke(); }); // (a few gold strokes: the reversed unicorn)
  }
  // the street: Cosmati pavement, roundels of red porphyry and green serpentine in bands of white marble and gold
  // tesserae, interlaced in a running guilloche; worn, and dusted with sand
  function cityFloor(rnd, th) {
    { const g = ctx.createLinearGradient(0, T - 2, 0, VH); g.addColorStop(0, '#5A6E70'); g.addColorStop(.5, '#6A7C78'); g.addColorStop(1, '#2E3E40'); ctx.fillStyle = g; ctx.fillRect(0, T - 2, AW_W, VH - T + 2); }
    // the grid of plain slabs either side
    for (let y = T + 4, h = 9; y < VH; y += h, h += 3) { ctx.fillStyle = 'rgba(10,24,28,.4)'; ctx.fillRect(0, y, AW_W, .8); for (const [x0, w] of awRow(rnd, h * 2.5, h * 5)) { ctx.fillStyle = 'rgba(10,24,28,.35)'; ctx.fillRect(x0, y, .8, h); if (rnd() < .4) { ctx.fillStyle = `rgba(230,240,236,${.05 + rnd() * .08})`; ctx.fillRect(x0 + 1, y + 1, w - 2, h - 2); } } }
    // the guilloche: a band of roundels down the middle of the street, linked by loops of white marble
    const cy = T + 58, R = 17, step = 40;
    for (let x = 0; x < AW_W; x += step) {
      const big = (x / step) % 2 === 0, r = big ? R : R * .62, col = big ? ((x / step) % 4 === 0 ? '#8A2A2E' : '#2E5A3E') : '#C8A050';
      ctx.save(); ctx.translate(x + step / 2, cy); ctx.scale(1, .42);
      ctx.fillStyle = '#E6E2D6'; circle(0, 0, r + 4); ctx.fill(); ctx.fillStyle = col; circle(0, 0, r); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r * .7, Math.PI * 1.1, Math.PI * 1.7); ctx.stroke();
      if (big) for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; ctx.fillStyle = k % 2 ? '#E8C870' : '#F2EEE6'; poly([0, 0, Math.cos(a) * r * .9, Math.sin(a) * r * .9, Math.cos(a + TAU / 16) * r * .9, Math.sin(a + TAU / 16) * r * .9]); ctx.globalAlpha = .35; ctx.fill(); ctx.globalAlpha = 1; } // a star of inlay in it
      ctx.restore();
    }
    ctx.strokeStyle = '#E6E2D6'; ctx.lineWidth = 3; for (const s of [-1, 1]) { ctx.beginPath(); for (let x = 0; x <= AW_W; x += 4) { const u = (x % (step * 2)) / (step * 2) * TAU; ctx.lineTo(x, cy + s * Math.cos(u) * R * .52); } ctx.stroke(); }
    ctx.fillStyle = '#E6E2D6'; ctx.fillRect(0, cy - R * .52 - 6, AW_W, 2); ctx.fillRect(0, cy + R * .52 + 4, AW_W, 2);
    for (let i = 0; i < 500; i++) { const x = rnd() * AW_W, y = cy - 14 + rnd() * 28; ctx.fillStyle = rnd() < .5 ? 'rgba(255,255,255,.12)' : 'rgba(0,10,10,.14)'; ctx.fillRect(x, y, 1.4, 1.4); } // tesserae
    for (let i = 0; i < 30; i++) { const x = rnd() * AW_W, y = T + 4 + rnd() * (VH - T - 8); awWrap(x, 30, (x) => softDab(x, y, 8 + rnd() * 16, '200,196,170', .12)); } // drifted sand
    // the gutter at the street's edge, near us, with the sea running in it
    const ey = VH - 16; ctx.fillStyle = '#1E2C30'; ctx.fillRect(0, ey, AW_W, VH - ey); ctx.fillStyle = '#D8DED6'; ctx.fillRect(0, ey - 2, AW_W, 2.4);
  }
  // the Drowned Bell's campanile, drawn live so that the bell can swing when it tolls (one in view wherever you are)
  W7.bellSwing = 0; W7.bellRing = 0;
  function campanile(x, base, s, t) {
    const h = 150 * s, w = 26 * s, top = base - h;
    ctx.fillStyle = '#7E9690'; ctx.fillRect(x - w / 2, top, w, h); ctx.fillStyle = '#C0D0C8'; ctx.fillRect(x - w / 2, top, w * .3, h); ctx.fillStyle = 'rgba(6,20,24,.4)'; ctx.fillRect(x + w * .25, top, w * .25, h);
    for (let i = 1; i < 5; i++) { ctx.fillStyle = '#5E7670'; ctx.fillRect(x - w / 2 - 1, top + i * h / 5, w + 2, 2 * s); }
    const by = top + 6 * s, bh = 30 * s; ctx.fillStyle = '#06141A'; ctx.fillRect(x - w * .34, by, w * .68, bh); ctx.beginPath(); ctx.arc(x, by, w * .34, Math.PI, 0); ctx.fill(); // the belfry's opening
    ctx.fillStyle = '#3E8A72'; poly([x - w * .62, top, x, top - 34 * s, x + w * .62, top]); ctx.fill(); ctx.fillStyle = '#8ACCB0'; poly([x - w * .62, top, x, top - 34 * s, x - w * .1, top]); ctx.fill(); // its spire
    ctx.save(); ctx.translate(x, by + 2 * s); ctx.rotate(W7.bellSwing * .55); // the Drowned Bell, swinging
    ctx.fillStyle = '#5A7A58'; ctx.beginPath(); ctx.moveTo(-3 * s, 0); ctx.quadraticCurveTo(-6 * s, 4 * s, -6.5 * s, 14 * s); ctx.lineTo(-9 * s, 19 * s); ctx.lineTo(9 * s, 19 * s); ctx.lineTo(6.5 * s, 14 * s); ctx.quadraticCurveTo(6 * s, 4 * s, 3 * s, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#B8D8A8'; ctx.fillRect(-5 * s, 3 * s, 2 * s, 13 * s); ctx.fillStyle = '#2A3A2A'; circle(0, 20 * s, 2 * s); ctx.fill();
    ctx.restore();
    if (W7.bellRing > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { const q = (1 - W7.bellRing) + k * .2; if (q > 1) continue; ctx.strokeStyle = `rgba(220,255,230,${.5 * (1 - q)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, by + 14 * s, 20 * s + q * 140, 10 * s + q * 70, 0, 0, TAU); ctx.stroke(); } ctx.restore(); }
  }
  THEMES.rebma2 = {
    name: 'the streets of rebma', sky: ['#4A9898', '#144660', '#0C3048', '#081E30'], sun: [0.55, -0.3, '220,246,236'], haze: '70,120,150',
    floorA: '#6A7C78', floorB: '#2E3E40', path: '#C89A3A', skyKind: 'none',
    grade: { desat: .08, top: 'rgba(90,180,210,.2)', bot: 'rgba(14,26,70,.5)', vig: 'rgba(2,10,22,.72)' },
    liveSky(camX, t) {
      surfaceBand(camX, t, .8);
      const sp = .08, W = 900, x0 = ((300 - camX * sp) % W + W) % W - 150; // the campanile, far up the street (always one in view)
      for (const x of [x0, x0 + W]) if (x > -80 && x < VW + 80) campanile(x, T - 24, .9, t);
    },
    liveFloor(camX, t) {
      if (W7.lamps) { const mx = camX * .45; for (const lx of W7.lamps) { const x0 = (((lx - mx) % AW_W) + AW_W) % AW_W; for (const ox of [0, -AW_W]) { const x = x0 + ox + 22; if (x < -30 || x > VW + 30) continue; // the pearl lamps on their chains, swaying
        const sw = Math.sin(t * .9 + lx) * 2, y = T - 92; ctx.strokeStyle = '#2A3A36'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x + sw, y + 4); ctx.stroke();
        ctx.fillStyle = '#F2EEF6'; circle(x + sw, y + 8, 3.6); ctx.fill(); ctx.fillStyle = PAL.gold; ctx.fillRect(x + sw - 2.6, y + 3, 5.2, 1.6); glowM(x + sw, y + 8, 20, RGB.pearl, .32); } } }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 1;
      for (let i = 0; i < 7; i++) { const y = T + 12 + i * 15; ctx.strokeStyle = `rgba(${RGB.surf},${.05 + .03 * Math.sin(t * 1.2 + i)})`; ctx.beginPath(); for (let x = -20; x <= VW + 20; x += 18) { const wx = x + camX; ctx.lineTo(x, y + Math.sin(wx * .04 + t + i * 1.9) * 4); } ctx.stroke(); }
      ctx.restore();
      snow(camX, t, 22);
    },
  };
  AW_FAR.rebma2 = cityFar; AW_MID.rebma2 = cityMid; AW_FLOOR.rebma2 = cityFloor;

  // ======================================================================================================
  // THE PATTERN OF REBMA: a hall under Moire's palace. The reversed Pattern in the floor (drawn live, so it can turn
  // and come apart), an apse of dim gold mosaic with the unicorn of Amber facing the wrong way, a rose window with the
  // sea behind it, columns of green bronze, the reflected throne
  // ======================================================================================================
  const hallC = () => { const L = ZONES[6] ? ZONES[6].zones[2].len : 1000; return { far: (L - VW) * .15 + VW / 2, mid: (L - VW) * .45 + VW / 2 }; };
  // a field of mosaic: tesserae in rows, each its own tone of the ground colour, with gold ones set among them
  function tesserae(x0, y0, w, h, base, gold, rnd, sz = 2.2) {
    for (let y = y0; y < y0 + h; y += sz) for (let x = x0 + (Math.floor(y / sz) % 2) * sz * .5; x < x0 + w; x += sz) {
      const k = rnd(); ctx.fillStyle = k < gold ? (rnd() < .5 ? PAL.gold : PAL.goldL) : shade(base, (rnd() - .5) * .3); ctx.fillRect(x, y, sz - .45, sz - .45); }
  }
  // the unicorn of Amber in mosaic, rampant, facing left (in Rebma all is turned about); white on gold
  function mosaicUnicorn(x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(-s, s);
    const body = [-14, 10, -18, -2, -12, -12, 4, -14, 12, -22, 16, -34, 20, -40, 26, -38, 24, -30, 18, -18, 16, -6, 10, 4, 14, 22, 8, 24, 4, 8, -6, 10, -10, 26, -16, 26];
    poly(body); ctx.fillStyle = '#EEF0EA'; ctx.fill(); ctx.strokeStyle = '#3A2A18'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.strokeStyle = PAL.goldL; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(24, -39); ctx.lineTo(36, -56); ctx.stroke(); // the horn
    ctx.strokeStyle = '#EEF0EA'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-6, -12); ctx.lineTo(-2, -26); ctx.lineTo(4, -30); ctx.moveTo(-10, -10); ctx.lineTo(-12, -24); ctx.lineTo(-6, -30); ctx.stroke(); // forelegs raised
    ctx.strokeStyle = '#EEF0EA'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-16, 4); ctx.quadraticCurveTo(-30, 0, -26, -14); ctx.stroke(); // the tail
    ctx.fillStyle = '#3A2A18'; circle(22, -34, 1); ctx.fill();
    ctx.restore();
  }
  function hallFar(rnd, th, f) {
    AW_SUN = 1;
    const C0 = hallC().far, wallTop = 0;
    // the back wall, dark, set with dim mosaic
    { const g = ctx.createLinearGradient(0, 0, 0, T); g.addColorStop(0, '#060E1A'); g.addColorStop(.6, '#0E2232'); g.addColorStop(1, '#14303C'); ctx.fillStyle = g; ctx.fillRect(0, wallTop, AW_W, T); }
    for (let i = 0; i < 1400; i++) { ctx.fillStyle = rnd() < .08 ? 'rgba(200,160,80,.35)' : `rgba(${rnd() < .5 ? '40,90,110' : '10,30,40'},.35)`; ctx.fillRect(rnd() * AW_W, rnd() * T, 1.8, 1.8); }
    // the apse: a great niche whose half-dome is gold mosaic, dimmed by the deep; the reversed unicorn over mosaic waves
    awWrap(C0, 200, (x) => {
      const r = 150, base = T - 10, top = base - 180;
      ctx.save(); ctx.beginPath(); ctx.moveTo(x - r, base); ctx.lineTo(x - r, top + r * .55); ctx.ellipse(x, top + r * .55, r, r * .55 + 10, 0, Math.PI, 0); ctx.lineTo(x + r, base); ctx.closePath(); ctx.clip();
      const g = ctx.createRadialGradient(x, top + 60, 10, x, top + 80, r * 1.2); g.addColorStop(0, '#8A6A2A'); g.addColorStop(.6, '#4A3A1A'); g.addColorStop(1, '#1A1608'); ctx.fillStyle = g; ctx.fillRect(x - r, top - 20, r * 2, base - top + 20);
      const r2 = mulberry(19); tesserae(x - r, top - 10, r * 2, base - top + 10, '#5A4420', .2, r2, 2.6);
      ctx.globalAlpha = .9; for (let row = 0; row < 4; row++) for (let k = -6; k <= 6; k++) { const wx = x + k * 26 + (row % 2) * 13, wy = base - 16 - row * 12; ctx.strokeStyle = row % 2 ? '#3A7A8A' : '#5AAAB4'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(wx, wy, 11, Math.PI, 0); ctx.stroke(); } ctx.globalAlpha = 1; // mosaic waves
      mosaicUnicorn(x, base - 78, 1.7);
      const sh = ctx.createLinearGradient(0, top, 0, base); sh.addColorStop(0, 'rgba(4,10,16,.55)'); sh.addColorStop(.5, 'rgba(4,10,16,.1)'); sh.addColorStop(1, 'rgba(4,10,16,.35)'); ctx.fillStyle = sh; ctx.fillRect(x - r, top - 20, r * 2, base - top + 20);
      ctx.restore();
      ctx.strokeStyle = PAL.goldD; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(x, top + r * .55, r + 3, r * .55 + 13, 0, Math.PI, 0); ctx.stroke(); ctx.strokeStyle = PAL.gold; ctx.lineWidth = 1.4; ctx.stroke(); // its rim
      // the rose window over it, the sea behind its glass
      const ry = top - 6, rr = 34; ctx.fillStyle = '#04080E'; circle(x, ry, rr + 4); ctx.fill();
      for (let k = 0; k < 12; k++) { const a0 = k / 12 * TAU, a1 = (k + 1) / 12 * TAU; ctx.fillStyle = GLASS[k % GLASS.length]; ctx.globalAlpha = .85; ctx.beginPath(); ctx.moveTo(x, ry); ctx.arc(x, ry, rr, a0 + .04, a1 - .04); ctx.closePath(); ctx.fill(); }
      ctx.globalAlpha = 1; ctx.fillStyle = '#C8D8F0'; circle(x, ry, 8); ctx.fill(); ctx.strokeStyle = '#04080E'; ctx.lineWidth = 2; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 8, ry + Math.sin(a) * 8); ctx.lineTo(x + Math.cos(a) * rr, ry + Math.sin(a) * rr); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(x, ry, rr * .62, 0, TAU); ctx.stroke(); glowM(x, ry, 70, '120,170,230', .22);
    });
    // the side walls: blind arcades with gold in their spandrels
    for (let i = 0; i < 10; i++) { const x = i * 128 + 64; if (Math.abs(((x - C0 + 640) % 1280 + 1280) % 1280 - 640) < 190) continue;
      awWrap(x, 60, (x) => { ctx.fillStyle = '#0A1A24'; ctx.beginPath(); ctx.moveTo(x - 34, T - 10); ctx.lineTo(x - 34, T - 110); ctx.arc(x, T - 110, 34, Math.PI, 0); ctx.lineTo(x + 34, T - 10); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = PAL.goldD; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = 'rgba(200,160,80,.25)'; ctx.fillRect(x - 3, T - 168, 6, 20); }); }
    hazeBand(f, th.haze, 40, T, .25);
  }
  function hallMid(rnd) {
    AW_SUN = 1;
    const C0 = hallC().mid;
    // columns of green bronze, gilded at the capital and the base, in pairs either side
    const column = (x, s = 1) => { const top = T - 200 * s, w = 16 * s;
      const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, '#8ACCB0'); g.addColorStop(.35, '#3E8A72'); g.addColorStop(1, '#0E2A22'); ctx.fillStyle = g; ctx.fillRect(x - w / 2, top, w, T - top);
      ctx.strokeStyle = 'rgba(4,20,16,.5)'; ctx.lineWidth = .8; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * w * .18, top + 10); ctx.lineTo(x + k * w * .18, T - 12); ctx.stroke(); }
      ctx.fillStyle = PAL.gold; poly([x - w * .9, top, x + w * .9, top, x + w * .55, top + 12 * s, x - w * .55, top + 12 * s]); ctx.fill(); ctx.fillStyle = PAL.goldL; ctx.fillRect(x - w * .9, top - 2, w * 1.8, 2.4);
      ctx.fillStyle = PAL.goldD; ctx.fillRect(x - w * .75, T - 12, w * 1.5, 10); ctx.fillStyle = PAL.gold; ctx.fillRect(x - w * .75, T - 12, w * 1.5, 2); };
    awWrap(C0, 400, (cx) => { for (const dx of [-300, -230, 230, 300]) column(cx + dx, dx * dx > 70000 ? 1.05 : .95); });
    // the reflected throne at the back, on its steps: glass and nacre, empty, the wrong way round
    awWrap(C0, 120, (cx) => {
      for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? '#24485A' : '#2E5868'; ctx.fillRect(cx - 80 + k * 10, T - 8 - k * 7, 160 - k * 20, 8); ctx.fillStyle = 'rgba(200,240,240,.4)'; ctx.fillRect(cx - 80 + k * 10, T - 8 - k * 7, 160 - k * 20, 1); }
      const ty = T - 36; ctx.fillStyle = 'rgba(160,220,214,.55)'; poly([cx - 22, ty, cx - 26, ty - 70, cx - 14, ty - 92, cx, ty - 100, cx + 14, ty - 92, cx + 26, ty - 70, cx + 22, ty]); ctx.fill();
      ctx.strokeStyle = 'rgba(230,255,250,.7)'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = 'rgba(230,250,248,.35)'; poly([cx - 18, ty, cx - 20, ty - 60, cx - 8, ty - 80, cx - 6, ty]); ctx.fill();
      ctx.fillStyle = 'rgba(120,180,190,.6)'; ctx.fillRect(cx - 24, ty - 22, 48, 6); glowM(cx, ty - 50, 60, '170,230,230', .14);
    });
    // hanging lamps of pearl on long chains between the columns
    for (const dx of [-265, -150, 150, 265]) awWrap(C0 + dx, 20, (x) => { ctx.strokeStyle = 'rgba(160,140,90,.6)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, T - 150); ctx.stroke(); ctx.fillStyle = PAL.gold; ctx.fillRect(x - 6, T - 150, 12, 3); ctx.fillStyle = '#F2EEF8'; circle(x, T - 142, 5); ctx.fill(); glowM(x, T - 142, 30, RGB.pearl, .35); });
  }
  function hallFloor(rnd, th) {
    { const g = ctx.createLinearGradient(0, T - 2, 0, VH); g.addColorStop(0, '#16283A'); g.addColorStop(.4, '#1E3448'); g.addColorStop(1, '#0A1420'); ctx.fillStyle = g; ctx.fillRect(0, T - 2, AW_W, VH - T + 2); }
    for (let i = 0; i < 900; i++) { const x = rnd() * AW_W, y = T + rnd() * (VH - T); ctx.fillStyle = rnd() < .5 ? 'rgba(80,120,170,.08)' : 'rgba(0,0,0,.12)'; ctx.fillRect(x, y, 2, 1.4); } // polished slate, a little lapis in it
    for (const [y0, h] of [[T + 1, 6], [VH - 18, 6]]) { ctx.fillStyle = PAL.goldD; ctx.fillRect(0, y0, AW_W, h); for (let x = 0; x < AW_W; x += 8) { ctx.fillStyle = (x / 8) % 2 ? PAL.gold : '#2A4A6A'; ctx.fillRect(x + 1, y0 + 1, 6, h - 2); } } // borders of mosaic
    const sh = ctx.createLinearGradient(0, VH - 30, 0, VH); sh.addColorStop(0, 'rgba(2,6,12,0)'); sh.addColorStop(1, 'rgba(2,6,12,.5)'); ctx.fillStyle = sh; ctx.fillRect(0, VH - 30, AW_W, 30);
  }
  // ---------------- the Pattern itself, painted once into its own canvas (unsquashed: the floor's perspective, its
  // turning in the Maelstrom and its coming apart are all done as it is drawn) ----------------
  const PAT_R = 300;
  W7.patPts = null;
  function patternPoints() { // a single line laid as the old labyrinths in the cathedral floors are: in from the rim, then back
    // and forth across seven rings in each quarter, turning on itself in tight hairpins (the Veils), and at last to the centre.
    // Rebma's is turned the other way about: it winds widdershins
    if (W7.patPts) return W7.patPts;
    const pts = [], N = 7, r0 = PAT_R * .2, r1 = PAT_R * .96, rr = (i) => lerp(r0, r1, i / (N - 1)), DIR = -1;
    const P_ = (r, a) => { const w = 1 + .025 * Math.sin(a * 9); pts.push(Math.cos(DIR * a) * r * w, Math.sin(DIR * a) * r * w); };
    const arc = (r, a0, a1) => { const n = Math.max(4, Math.ceil(Math.abs(a1 - a0) * r / 6)); for (let k = 0; k <= n; k++) P_(r, lerp(a0, a1, k / n)); };
    const hair = (rA, rB, a, side) => { const rm = (rA + rB) / 2, hw = Math.abs(rB - rA) / 2; for (let k = 1; k < 8; k++) { const q = k / 8 * Math.PI, rq = rm - Math.cos(q) * hw * Math.sign(rB - rA); P_(rq, a + side * Math.sin(q) * hw / rm); } }; // a hairpin turn
    const Q = Math.PI / 2, gap = .36;
    P_(PAT_R * 1.05, 0); // the way in, from the rim
    let ring = N - 1;
    for (let q = 0; q < 4; q++) {
      const a0 = q * Q + gap, a1 = (q + 1) * Q - gap, outward = q % 2 === 1; let at = a0;
      const order = outward ? [...Array(N).keys()] : [...Array(N).keys()].reverse();
      order.forEach((ri, j) => { const to = at === a0 ? a1 : a0; arc(rr(ri), at, to); if (j < N - 1) hair(rr(ri), rr(order[j + 1]), to, to === a1 ? 1 : -1); at = to; });
      if (q < 3) { const last = order[N - 1]; arc(rr(last), at, at + gap * 2); }
      ring = order[N - 1];
    }
    arc(rr(0), 4 * Q - gap, 4 * Q + .4); for (let k = 0; k <= 6; k++) P_(rr(0) * (1 - k / 6), 4 * Q + .4 + k * .3); // and in, to the centre
    return (W7.patPts = pts);
  }
  W7.patC = null; W7.patK = 0;
  function patternCanvas() {
    if (W7.patC && W7.patK === K) return W7.patC;
    retire(W7.patC); const S = Math.min(K, 2), D = PAT_R * 2 + 20, [c, g] = texCanvas(Math.ceil(D * S), Math.ceil(D * S)); g.scale(S, S); g.translate(D / 2, D / 2);
    const pts = patternPoints(), path = () => { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); };
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.strokeStyle = 'rgba(10,20,50,.9)'; g.lineWidth = 12; path(); g.stroke(); // the channel it is laid in
    g.strokeStyle = '#1E3A78'; g.lineWidth = 8; path(); g.stroke();
    g.strokeStyle = '#5A84D8'; g.lineWidth = 4; path(); g.stroke();
    g.strokeStyle = '#C8DCFF'; g.lineWidth = 1.4; path(); g.stroke();
    g.strokeStyle = PAL.gold; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, PAT_R + 4, 0, TAU); g.stroke(); g.strokeStyle = PAL.goldD; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, PAT_R + 8, 0, TAU); g.stroke();
    W7.patC = c; W7.patK = K; c.S = S; c.D = D; return c;
  }
  // the Pattern on the floor at (cx, cy): rot its turn, a its strength; lit: 0..1 how brightly its lines burn
  W7.PAT_SQ = .17;
  function drawPattern(cx, cy, rot, a, lit, t) {
    const c = patternCanvas();
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, W7.PAT_SQ); ctx.rotate(rot); ctx.globalAlpha = a; ctx.drawImage(c, -c.D / 2, -c.D / 2, c.D, c.D); ctx.restore();
    if (lit > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(cx, cy); ctx.scale(1, W7.PAT_SQ); ctx.rotate(rot); ctx.globalAlpha = lit * (.35 + .15 * Math.sin(t * 2)); ctx.drawImage(c, -c.D / 2, -c.D / 2, c.D, c.D); ctx.restore(); }
  }
  W7.drawPattern = drawPattern; W7.PAT_R = PAT_R;
  THEMES.rebmaBoss = {
    name: 'the pattern of rebma', sky: ['#04080E', '#08141E', '#0E2230', '#14303C'], sun: [0.5, -0.4, '160,200,240'], haze: '40,70,100',
    floorA: '#1E3448', floorB: '#0A1420', path: '#5A84D8', skyKind: 'none',
    grade: { desat: .06, top: 'rgba(80,140,230,.28)', bot: 'rgba(10,20,60,.5)', vig: 'rgba(0,4,12,.75)' },
    liveSky(camX, t) {},
    liveFloor(camX, t) { snow(camX, t, 18, '200,220,255', .4); },
  };
  AW_FAR.rebmaBoss = hallFar; AW_MID.rebmaBoss = hallMid; AW_FLOOR.rebmaBoss = hallFloor;

  // ======================================================================================================
  // THE TRUMP OF REBMA: the picture on the card (branch.js frames it): the underside of the sea with its light, the
  // stair Faiella-bionin going down through the blue with its green torches, the towers of Rebma at its foot and the
  // same towers hanging upside down in the mirror of the surface, gold rays let down through the water
  // ======================================================================================================
  W7.cardDraw = (g, w, h, t) => {
    const old = ctx; ctx = g;
    try {
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
      const S = Math.min(w / 62, h / 100); ctx.scale(w / 62, h / 100); // drawn in 62 x 100
      const bg = ctx.createLinearGradient(0, 0, 0, 100); bg.addColorStop(0, '#A8DCCC'); bg.addColorStop(.18, '#2E7C80'); bg.addColorStop(.6, '#0E3A50'); bg.addColorStop(1, '#061A26'); ctx.fillStyle = bg; ctx.fillRect(0, 0, 62, 100);
      // the city upside down in the mirror of the surface
      ctx.globalAlpha = .35; for (let i = 0; i < 7; i++) { const x = 8 + i * 8, hh = 6 + hsh(i) * 10; ctx.fillStyle = '#E6F2EE'; ctx.fillRect(x - 1.4, 6, 2.8, hh); ctx.beginPath(); ctx.moveTo(x - 2, 6 + hh); ctx.quadraticCurveTo(x, 10 + hh, x + 2, 6 + hh); ctx.fill(); } ctx.globalAlpha = 1;
      // the surface, rippling
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { ctx.strokeStyle = `rgba(230,255,248,${.55 - k * .14})`; ctx.lineWidth = .7; ctx.beginPath(); for (let x = 0; x <= 62; x += 3) ctx.lineTo(x, 3 + k * 2.4 + Math.sin(x * .3 + t * 1.4 + k) * .8); ctx.stroke(); }
      for (let i = 0; i < 7; i++) { const x1 = 6 + i * 9 + Math.sin(t * .5 + i) * 2; const gr = ctx.createLinearGradient(0, 4, 0, 80); gr.addColorStop(0, 'rgba(255,214,140,.5)'); gr.addColorStop(1, 'rgba(255,214,140,0)'); ctx.strokeStyle = gr; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(31, 2); ctx.lineTo(x1, 80); ctx.stroke(); } ctx.restore();
      // the stair going down in flights, its torches burning green
      const fl = [[8, 30, 40, 44], [40, 44, 14, 60], [14, 60, 46, 76]];
      for (const [x0, y0, x1, y1] of fl) { ctx.strokeStyle = '#C8DCD4'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.strokeStyle = '#2E4E52'; ctx.lineWidth = .8; for (let q = 0; q < 8; q++) { const x = lerp(x0, x1, q / 8), y = lerp(y0, y1, q / 8); ctx.beginPath(); ctx.moveTo(x - 1.6, y + 1.2); ctx.lineTo(x + 1.6, y + 1.2); ctx.stroke(); }
        for (let q = 0; q <= 2; q++) { const x = lerp(x0, x1, q / 2), y = lerp(y0, y1, q / 2) - 3; ctx.fillStyle = '#5E6E66'; ctx.fillRect(x - .4, y, .8, 3); const f = 1 + Math.sin(t * 6 + q + x) * .3; ctx.fillStyle = '#9AF0B0'; ctx.beginPath(); ctx.ellipse(x, y - 1.2 * f, .9, 1.6 * f, 0, 0, TAU); ctx.fill(); glowM(x, y - 1, 4, '170,255,190', .4); } }
      // Rebma at the foot of the stair
      for (let i = 0; i < 9; i++) { const x = 10 + i * 5.4, hh = 8 + (4 - Math.abs(i - 4)) * 3.4 + hsh(i + 3) * 3; const gt = ctx.createLinearGradient(x - 1.6, 0, x + 1.6, 0); gt.addColorStop(0, '#9AB8C0'); gt.addColorStop(.5, '#F2F4EE'); gt.addColorStop(1, '#5A7A88'); ctx.fillStyle = gt; ctx.fillRect(x - 1.6, 96 - hh, 3.2, hh); ctx.beginPath(); ctx.moveTo(x - 2.2, 96 - hh); ctx.quadraticCurveTo(x, 92 - hh - 2, x + 2.2, 96 - hh); ctx.fill(); ctx.fillStyle = '#FFE6A8'; ctx.fillRect(x - .4, 98 - hh + 3, .8, 1); }
      glowM(31, 92, 22, '236,232,246', .25);
      // a few bubbles going up
      for (let i = 0; i < 6; i++) { const q = (t * .3 + hsh(i)) % 1; ctx.strokeStyle = `rgba(230,250,248,${.7 * (1 - q)})`; ctx.lineWidth = .4; ctx.beginPath(); ctx.arc(10 + hsh(i + 2) * 42 + Math.sin(t * 2 + i), 92 - q * 80, .6 + hsh(i + 4) * .8, 0, TAU); ctx.stroke(); }
      ctx.restore();
    } finally { ctx = old; }
  };

  // ======================================================================================================
  // THE FOLK OF REBMA AND ITS STAIR: drawn as the figures in a sea-chart's margin are, outlined in ink and laid in with
  // colour; under the water their hair and their loose cloth float up and drift, which nothing on land does
  // ======================================================================================================
  // a strand that floats: from (x, y) up and about, swaying with the water; len, width at root
  function drift(x, y, len, w, col, t, ph = 0, lean = 0) {
    const sw = Math.sin(t * 1.6 + ph) * len * .25, sw2 = Math.sin(t * 1.1 + ph * 1.7) * len * .3;
    ctx.strokeStyle = C(col); ctx.lineCap = 'round'; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + sw + lean * len * .4, y - len * .5, x + sw2 + lean * len, y - len); ctx.stroke();
  }
  // barnacles: a little cluster of white cones on whatever the sea has had long enough
  function barnacles(x, y, n, s = 1, seed = 1) {
    for (let i = 0; i < n; i++) { const bx = x + (hsh(seed + i) - .5) * 8 * s, by = y + (hsh(seed + i + 9) - .5) * 5 * s, r = (1.3 + hsh(seed + i * 3) * 1.1) * s;
      ctx.fillStyle = C('#E2E2D2'); ctx.beginPath(); ctx.moveTo(bx - r, by + r * .4); ctx.lineTo(bx - r * .4, by - r); ctx.lineTo(bx + r * .4, by - r); ctx.lineTo(bx + r, by + r * .4); ctx.closePath(); ctx.fill();
      if (DET()) { ctx.fillStyle = '#4A5A54'; ctx.fillRect(bx - r * .3, by - r, r * .6, r * .5); } }
  }
  // a hand: a small inked mitt, fingers together
  function mitt(x, y, col, r = 2.6, a = 0) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = C(col); ell(0, 0, r * 1.15, r); ctx.fill(); outline(.9); ctx.restore(); }
  const foot = (x, y, col, s = 1) => { ctx.fillStyle = C(col); ctx.beginPath(); ctx.moveTo(x - 2.4 * s, y + .4); ctx.quadraticCurveTo(x - 2.2 * s, y - 3 * s, x + 1.2 * s, y - 2.6 * s); ctx.quadraticCurveTo(x + 5.4 * s, y - 1.4 * s, x + 5.4 * s, y + .4); ctx.closePath(); ctx.fill(); outline(1); };
  // a face in three-quarter view, at (x, y): the drowned and the Rebmans share the drawing, their colouring differs
  function face(x, y, o) {
    const s = o.s || 1, sk = o.skin;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    cel(PB([-5.5, -6, 1, -8.4, 6.2, -5, 7.4, .5, 6.6, 4.6, 3, 7.2, -2.4, 6.6, -5.8, 2.4]), sk, { d: 2, r: 1, w: 1.2, dark: shade(sk, -.3), lite: shade(sk, .25) });
    if (DET()) {
      ctx.fillStyle = shade(sk, -.38); ctx.beginPath(); ctx.moveTo(6.8, -1.6); ctx.lineTo(8.6, 2); ctx.lineTo(6.4, 2.6); ctx.closePath(); ctx.fill(); // the nose
      if (o.dead) { ctx.fillStyle = '#E8F2EE'; ell(3.4, -1.4, 1.5, 1); ctx.fill(); ctx.fillStyle = 'rgba(20,40,40,.6)'; ctx.fillRect(2.2, -2.6, 2.6, .6); } // eyes gone white
      else { ctx.fillStyle = '#F2F4EE'; ell(3.6, -1.4, 1.5, 1); ctx.fill(); ctx.fillStyle = o.eye || '#1A3A34'; circle(4.1, -1.3, .75); ctx.fill(); ctx.fillStyle = C(shade(sk, -.45)); ctx.fillRect(2, -3.2, 3.8, .8); }
      ctx.strokeStyle = shade(sk, -.5); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(4, 4.2); ctx.quadraticCurveTo(5.4, o.mouth ? 5.6 : 4.4, 6.4, 4.2); ctx.stroke();
      if (o.mouth) { ctx.fillStyle = '#0E1A1A'; ell(5.2, 4.8, 1.2, o.mouth * 1.6); ctx.fill(); }
      if (o.gill) { ctx.strokeStyle = shade(sk, -.35); ctx.lineWidth = .6; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-2 + i * 1.3, 4); ctx.lineTo(-1 + i * 1.3, 6.6); ctx.stroke(); } } // the gill-slits of Rebma
    }
    ctx.restore();
  }

  // ---------------- DROWNED OF THE FLEET: a sailor of Amber's fleet, long under the water: barnacled, weed-hung, his
  // eyes gone white, his hair floating up off his head; a boathook in his hands ----------------
  CREATURES.w7drowned = function (e, a) {
    a = a || {}; const t = a.t || 0, ph = a.walk || 0, moving = ph ? 1 : 0, hurt = a.hurt;
    const wH = windK(e, a, 'w7hook'), wC = windK(e, a, 'w7clutch'), kH = actK(e, 'hook'), kC = actK(e, 'clutch'), br = breath(e, t, 1.4);
    const thrust = kH >= 0 ? (kH < .22 ? sm(kH / .22) : kH < .45 ? 1 : 1 - sm((kH - .45) / .4)) : 0, lunge = kC >= 0 ? (kC < .3 ? sm(kC / .3) : 1 - sm((kC - .5) / .5) * (kC > .5 ? 1 : 0)) : 0;
    const lean = -wH * .2 + thrust * .25 + wC * .3 + lunge * .45 + (hurt ? -.3 : 0) + moving * .06 + Math.sin(t * .9 + (e.slot || 0)) * .03;
    const crouch = wC * 6 - lunge * 2, hipY = -30 + crouch + (moving ? -Math.abs(Math.sin(ph)) * 1.2 : br * .4);
    ctx.save(); ctx.translate(0, hipY); ctx.rotate(lean * .5); ctx.translate(0, -hipY);
    // the back arm and the back of the boathook
    const sy = hipY - 21 + br * .5, hookA = -.35 - wH * .5 + thrust * .35 - lunge * .2, hx = 6 + thrust * 18 - wH * 8, hy = sy + 12 - thrust * 2;
    seg2(-3, sy + 2, Math.PI / 2 + .5 - thrust * .9 - wH * .2 - lunge * 1.2, 11, Math.PI / 2 - .3 - thrust * .9 - lunge * 1.4, 10, 4.4, 3.8, '#6E7E70', { lit: '#A8B8A4' });
    // the legs: bare, grey-green, the trousers rotted to the knee; a slow wading walk
    for (const side of [1, 0]) { let [th, sh] = gait(ph, side, .36, .6, moving);
      if (!moving) { th = Math.PI / 2 + (side ? -.16 : .14) + (wC + lunge) * (side ? .5 : -.4); sh = th + .12 + crouch * .03; }
      const L = seg2(side ? 2 : -2, hipY, th, 14, sh, 14, 6, 4.4, side ? '#3A4A44' : '#2E3C38', { col2: side ? PAL.skin : PAL.skinD, lit: '#7A8A80' });
      foot(L.ex - 1, L.ey + 1.2, side ? PAL.skin : PAL.skinD, 1); if (side) barnacles(L.kx + 2, L.ky + 5, 3, .8, 7); }
    // the body: a linen shirt gone green, a wine-red tabard of Amber's fleet, faded, torn at the hem (which floats up)
    const hem = Math.sin(t * 1.3 + (e.slot || 0)) * 2.2;
    cel(PB([-7, sy, 7, sy, 9, sy + 10, 8, hipY + 1, -8, hipY + 1, -9, sy + 10]), '#7E8E7A', { d: 2.6, dark: '#4E5E50', lite: '#B8C8AE' });
    cel(PP([-6, sy + 1, 6, sy + 1, 7.5, hipY + 6 + hem * .3, 5, hipY + 3 + hem, 3, hipY + 8 + hem * .6, 0, hipY + 4 + hem, -2.5, hipY + 9, -5, hipY + 4 + hem * .8, -7.5, hipY + 7]), '#7A2A34', { d: 2.8, dark: '#4A161E', lite: '#A84A50', tex: () => {
      ctx.strokeStyle = 'rgba(240,226,200,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-1, sy + 8); ctx.lineTo(1, sy + 5); ctx.lineTo(2.4, sy + 7); ctx.moveTo(1, sy + 5); ctx.lineTo(0, sy + 12); ctx.stroke(); // the unicorn of Amber, picked out in thread, half gone
      ctx.fillStyle = 'rgba(70,110,80,.45)'; ell(-3, hipY - 2, 4, 2); ctx.fill(); } }); // a stain of weed
    ctx.fillStyle = C('#3A2A1E'); ctx.beginPath(); ctx.rect(-7, hipY - 4, 14, 2.6); ctx.fill(); outline(.8); // the belt
    barnacles(-5, sy + 2, 4, 1, 3);
    drift(-6, hipY - 2, 12, 1.4, '#3E7A4E', t, e.slot || 0, -.3); drift(4, hipY, 9, 1.1, '#5A9A5E', t, (e.slot || 0) + 2, .2); // weed hanging off him, floating
    // the head: hair floating up off it in strands, the eyes white
    const hdy = sy - 7 + (hurt ? 1 : 0), hxh = 1 + lunge * 3;
    for (let i = 0; i < 6; i++) drift(-4 + i * 1.8 + hxh, hdy - 6, 9 + hsh(i + 3) * 6, 2, i % 2 ? '#2A322C' : '#3E463E', t, i * 1.3 + (e.slot || 0), -.25);
    face(hxh, hdy, { skin: PAL.skin, dead: 1, mouth: (wC || lunge) ? .6 + lunge * .6 : hurt ? .5 : .15 });
    // the front arm, the boathook: a long ash pole, an iron hook and spike at its end
    const fa = Math.PI / 2 - .2 - thrust * 1.2 + wH * .5 - lunge * 1.3, fl = seg2(4, sy + 2, fa, 11, fa - .5 - thrust * .2 + wH * .2, 10, 4.6, 4, '#7E8E7A', { col2: PAL.skin, lit: '#C8D8C0' });
    if (kC < 0 && wC < .3) { ctx.save(); ctx.translate(fl.ex, fl.ey); ctx.rotate(hookA - Math.PI * .1 + thrust * .25);
      ctx.fillStyle = C('#5A4430'); ctx.beginPath(); ctx.rect(-26, -1.3, 70, 2.6); ctx.fill(); outline(.8);
      if (DET()) { ctx.fillStyle = 'rgba(220,200,160,.5)'; ctx.fillRect(-26, -1.3, 70, .8); }
      ctx.strokeStyle = C('#3A4040'); ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(42, 0); ctx.lineTo(52, 0); ctx.moveTo(44, 0); ctx.quadraticCurveTo(46, -7, 41, -8); ctx.stroke(); // spike and hook
      if (DET()) { ctx.strokeStyle = '#A8B0A8'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(44, -.6); ctx.lineTo(51, -.6); ctx.stroke(); }
      ctx.restore(); }
    mitt(fl.ex, fl.ey, PAL.skin, 2.6);
    if (lunge > .2 || wC > .5) mitt(fl.ex - 6, fl.ey + 2, PAL.skinD, 2.4); // both hands out to grab
    ctx.restore();
  };

  // ---------------- TORCHBEARER OF FAIELLA: one of the keepers of the stair's torches, a tall Rebman in a long robe of
  // lapis bordered with gold, his sea-green hair floating, a torch-staff whose flame burns green in the water ----------------
  CREATURES.w7lamp = function (e, a) {
    a = a || {}; const t = a.t || 0, ph = a.walk || 0, moving = ph ? 1 : 0, hurt = a.hurt;
    const wF = windK(e, a, 'w7flare'), wS = windK(e, a, 'w7sweep'), kF = actK(e, 'flare'), kS = actK(e, 'sweep'), br = breath(e, t, 1.2), out = e.w7out ? 1 : 0;
    const fling = kF >= 0 ? (kF < .25 ? sm(kF / .25) : 1 - sm((kF - .25) / .75)) : 0, sweep = kS >= 0 ? sm(kS / .6) : 0;
    const lean = -wF * .15 + fling * .2 - wS * .1 + (hurt ? -.28 : 0) + moving * .05;
    const hipY = -34 + br * .4 + (moving ? -Math.abs(Math.sin(ph)) * 1 : 0);
    ctx.save(); ctx.translate(0, hipY); ctx.rotate(lean * .5); ctx.translate(0, -hipY);
    // the staff, behind him (held in the near hand): its angle carries every attack
    const sy = hipY - 24, stA = kS >= 0 ? lerp(-1.9, .6, sweep) : wS > 0 ? lerp(-1.6, -2.4, wS) : lerp(-1.65, -2.2, wF) + fling * 1.4, hx = 7 + fling * 6, hy = sy + 10;
    const L = 74, tx = hx + Math.cos(stA) * L * .72, ty = hy + Math.sin(stA) * L * .72, bx = hx - Math.cos(stA) * L * .28, by = hy - Math.sin(stA) * L * .28;
    ctx.strokeStyle = C(INK); ctx.lineWidth = 4.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.strokeStyle = C('#4A3A28'); ctx.lineWidth = 2.4; ctx.stroke(); if (DET()) { ctx.strokeStyle = '#A88A5A'; ctx.lineWidth = .7; ctx.stroke(); }
    ctx.save(); ctx.translate(tx, ty); ctx.rotate(stA + Math.PI / 2); // the cresset at its head
    ctx.fillStyle = C(PAL.bronze); poly([-6, -2, 6, -2, 4, 5, -4, 5]); ctx.fill(); outline(1); ctx.fillStyle = C(PAL.verd); ctx.beginPath(); ctx.rect(-6, -3, 12, 2); ctx.fill(); outline(.7);
    ctx.restore();
    if (!out) { const fx2 = tx + Math.cos(stA) * 4, fy2 = ty + Math.sin(stA) * 4; if (DET()) { ctx.save(); const lean2 = clamp(-Math.cos(stA) * .6, -1, 1) + Math.sin(t * 3) * .1; waterFlame(fx2, fy2, .8 + wF * .35 + fling * .2, t, lean2, 1); ctx.restore(); } else { ctx.fillStyle = C(PAL.flame); circle(fx2, fy2 - 5, 4); ctx.fill(); } }
    // the robe: long, lapis, its gold border floating at the hem; slit for walking
    const hem = Math.sin(t * 1.2 + (e.slot || 0)) * 2.4, sp = moving ? Math.sin(ph) * 3 : 0;
    for (const side of [0, 1]) { const fx = side ? 4 + sp : -3 - sp; foot(fx, 0, '#2A2420', 1); }
    cel(PB([-7, sy + 1, 7, sy + 1, 9, hipY - 2, 11 + hem * .4, -6 + hem, 9 + sp, 1, 0, -1, -9 - sp, 1, -11 + hem * .3, -5 - hem * .4, -9, hipY - 2]), PAL.lapis, { d: 3, dark: PAL.lapisD, lite: PAL.lapisL, tex: () => {
      ctx.strokeStyle = PAL.gold; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-11 + hem * .3, -5 - hem * .4); ctx.quadraticCurveTo(0, -1, 11 + hem * .4, -6 + hem); ctx.stroke(); // the gold border
      ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(1, sy + 3); ctx.lineTo(1.5, -2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,240,200,.65)'; for (let i = 0; i < 5; i++) circle(1.2, sy + 8 + i * 6, .8), ctx.fill(); // pearls down the front
      ctx.strokeStyle = 'rgba(10,16,40,.5)'; ctx.lineWidth = .8; for (const x of [-5, 5]) { ctx.beginPath(); ctx.moveTo(x, sy + 10); ctx.quadraticCurveTo(x * 1.2, hipY + 10, x * 1.5, -4); ctx.stroke(); } } });
    // a short cape of sea-silk on the shoulders, lifting in the water
    cel(PB([-8, sy - 1, 8, sy - 1, 10, sy + 9 + hem * .3, 0, sy + 12, -11, sy + 10 - hem * .4]), '#2E8A7A', { d: 2, dark: '#185448', lite: '#7ED0BE' });
    // the head: green-pale, the gill-slits of Rebma, the hair floating up in long locks
    const hdy = sy - 7;
    for (let i = 0; i < 7; i++) drift(-5 + i * 1.6, hdy - 5, 11 + hsh(i + 1) * 8, 2.1, i % 2 ? PAL.hair : PAL.hairL, t, i * 1.1 + (e.slot || 0), -.4);
    face(1, hdy, { skin: PAL.rebm, gill: 1, eye: '#E8C848', mouth: wF > .5 ? .5 : 0 });
    // the near arm on the staff
    const ax = hx - 7, ay = hy + 17;
    seg2(4, sy + 3, Math.atan2(hy - sy - 3, hx - 4) + .8, 7, Math.atan2(hy - sy - 3, hx - 4) - .3, 6, 4, 3.4, '#2E8A7A', { col2: PAL.rebm });
    mitt(hx, hy, PAL.rebm, 2.6);
    ctx.restore();
  };

  // ---------------- HALBERDIER OF MOIRE: a soldier of the Queen's guard in a coat of overlapping nacre scales, a helm
  // with a crest like a fin of green bronze, a scallop-shell shield; a glaive with a long curved blade ----------------
  CREATURES.w7guard = function (e, a) {
    a = a || {}; const t = a.t || 0, ph = a.walk || 0, moving = ph ? 1 : 0, hurt = a.hurt, blk = e.state === 'block';
    const wG = windK(e, a, 'w7glaive'), wR = windK(e, a, 'w7reap'), kG = actK(e, 'glaive'), kR = actK(e, 'reap'), br = breath(e, t, 1.8);
    const thrust = kG >= 0 ? (kG < .2 ? sm(kG / .2) : kG < .5 ? 1 : 1 - sm((kG - .5) / .5)) : 0;
    const reapA = kR >= 0 ? (kR < .45 ? lerp(-2.4, .9, sm(kR / .45)) : lerp(.9, -1.2, sm((kR - .55) / .45))) : null;
    const lean = -wG * .18 + thrust * .3 - wR * .15 + (reapA !== null ? .15 : 0) + (hurt ? -.3 : 0) + moving * .06;
    const hipY = -30 + (moving ? -Math.abs(Math.sin(ph)) * 1.4 : br * .5) + (wG + wR) * 2;
    ctx.save(); ctx.translate(0, hipY); ctx.rotate(lean * .45); ctx.translate(0, -hipY);
    const sy = hipY - 22;
    // the glaive (behind, in the far hand for a thrust; swung by both): pole of dark wood, blade of green bronze
    let gA = -1.1 - wG * .3 + thrust * 1.1, gx = 4 - wG * 6 + thrust * 14, gy = sy + 12;
    if (reapA !== null) { gA = reapA; gx = 6; gy = sy + 8; } else if (wR > 0) { gA = lerp(-1.1, -2.4, wR); gx = -2; gy = sy + 6; }
    if (blk) { gA = -1.5; gx = -4; }
    ctx.save(); ctx.translate(gx, gy); ctx.rotate(gA);
    ctx.fillStyle = C('#3A2A1E'); ctx.beginPath(); ctx.rect(-26, -1.4, 76, 2.8); ctx.fill(); outline(.8);
    cel(PB([48, -1.5, 54, -8, 64, -10, 74, -6, 76, -1, 66, -3.4, 56, 2.4, 50, 2.4]), PAL.verd, { d: 1.6, r: 1, w: 1.1, dark: PAL.verdD, lite: PAL.verdL, tex: () => { ctx.strokeStyle = 'rgba(240,255,250,.7)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(54, -7); ctx.quadraticCurveTo(66, -9.4, 75, -2.6); ctx.stroke(); } });
    ctx.fillStyle = C(PAL.gold); ctx.beginPath(); ctx.rect(46, -2.6, 4, 5.2); ctx.fill(); outline(.7);
    ctx.restore();
    // legs in greaves of green bronze
    for (const side of [1, 0]) { let [th, sh] = gait(ph, side, .42, .7, moving); if (!moving) { th = Math.PI / 2 + (side ? -.2 : .18) + thrust * (side ? .35 : -.25); sh = th + .1; }
      const L = seg2(side ? 2.4 : -2.4, hipY, th, 14, sh, 14, 6, 5, side ? '#B8B0B8' : '#9A92A0', { col2: side ? PAL.verd : PAL.verdD, lit: PAL.verdL });
      foot(L.ex - 1, L.ey + 1.2, '#2E3A36', 1.05); }
    // the coat of nacre scales, row on row, each catching the light with a little fire
    cel(PB([-8, sy - 1, 8, sy - 1, 10, sy + 12, 9, hipY + 6, 0, hipY + 9, -9, hipY + 6, -10, sy + 12]), PAL.nacre, { d: 2.8, dark: PAL.nacreD, lite: PAL.nacreL, tex: () => {
      for (let r = 0; r < 7; r++) for (let c = -3; c <= 3; c++) { const x = c * 3.2 + (r % 2) * 1.6, y = sy + 2 + r * 4.2; ctx.strokeStyle = 'rgba(110,100,130,.55)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.arc(x, y, 2, .1, Math.PI - .1); ctx.stroke(); if ((r + c) % 3 === 0) { ctx.fillStyle = (r + c) % 2 ? 'rgba(200,240,230,.5)' : 'rgba(230,200,240,.5)'; ctx.fillRect(x - 1, y + .6, 2, 1); } }
      ctx.fillStyle = PAL.gold; ctx.fillRect(-9, hipY - 3, 18, 2.4); } });
    // the shield: a great scallop shell, ribbed, rimmed in gold, on the far arm (raised to block)
    const shY = blk ? sy + 2 : sy + 10, shX = blk ? 11 : 6;
    ctx.save(); ctx.translate(shX, shY); ctx.rotate(blk ? -.1 : .15);
    ctx.beginPath(); ctx.moveTo(0, 12); for (let i = 0; i <= 8; i++) { const a2 = Math.PI * (1.05 + i / 8 * .9), r2 = 11 + (i % 2) * 1.2; ctx.lineTo(Math.cos(a2) * r2 * .62, 2 + Math.sin(a2) * r2); } ctx.closePath();
    ctx.fillStyle = C('#E8D4C4'); ctx.fill(); outline(1.1);
    if (DET()) { ctx.strokeStyle = 'rgba(150,100,90,.65)'; ctx.lineWidth = .8; for (let i = 0; i <= 6; i++) { const a2 = Math.PI * (1.12 + i / 6 * .76); ctx.beginPath(); ctx.moveTo(0, 11); ctx.lineTo(Math.cos(a2) * 6.4, 2 + Math.sin(a2) * 10); ctx.stroke(); } ctx.fillStyle = 'rgba(255,250,240,.6)'; ell(-2, -3, 2, 3); ctx.fill(); }
    ctx.restore();
    // the head: the finned helm of green bronze over a Rebman face
    const hy = sy - 7;
    face(1, hy, { skin: PAL.rebm, gill: 1, eye: '#2A2A1A', mouth: hurt ? .4 : 0 });
    cel(PB([-6, hy - 1, -6, hy - 6, -2, hy - 9.4, 4, hy - 9, 7.6, hy - 5, 7.6, hy - 2.4, 3, hy - 3.2, -2, hy - 1]), PAL.verd, { d: 1.8, dark: PAL.verdD, lite: PAL.verdL, w: 1.1 });
    const fin = Math.sin(t * 2 + (e.slot || 0)) * 1.2;
    cel(PB([-7, hy - 6, -8 + fin, hy - 15, -2 + fin, hy - 19, 4 + fin, hy - 15, 3, hy - 8.6]), PAL.gold, { d: 1.2, r: .8, w: 1, dark: PAL.goldD, lite: PAL.goldL, tex: () => { ctx.strokeStyle = 'rgba(80,50,20,.6)'; ctx.lineWidth = .6; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-1 + i * 1.4, hy - 8.6); ctx.lineTo(-5 + i * 2.4 + fin, hy - 16 + Math.abs(i - 1.5)); ctx.stroke(); } } });
    for (let i = 0; i < 3; i++) drift(-6 + i, hy - 2, 7 + i * 2, 1.8, PAL.hair, t, i + (e.slot || 0), -.6); // hair from under the helm
    // the near arm
    const na = reapA !== null ? reapA + .6 : Math.PI / 2 - .5 - thrust * .7 + wG * .4;
    seg2(5, sy + 2, na, 10, na - .4, 9, 4.6, 4, PAL.nacre, { col2: PAL.rebm, lit: PAL.nacreL });
    ctx.restore();
  };

  // ---------------- KNIGHT IN THE GLASS BELL: as in the old romances, where Alexander went down into the sea in a vessel
  // of glass to see its wonders: a knight inside a great bell of glass banded with bronze, its chain going up out of
  // sight to a ship that is not there any more. He walks it along on his own iron-shod feet ----------------
  CREATURES.w7bellk = function (e, a) {
    a = a || {}; const t = a.t || 0, ph = a.walk || 0, moving = ph ? 1 : 0, hurt = a.hurt, bare = e.w7bare;
    const kS = actK(e, 'bellslam'), kR = actK(e, 'bellroll'), wS = windK(e, a, 'w7bellslam'), wR = windK(e, a, 'w7bellroll'), crack = e.w7crack || 0;
    const roll = kR >= 0 && kR < .92 ? (e.w7rollA || 0) : 0, tip = kR >= 0 ? (kR < .1 ? sm(kR / .1) : kR > .9 ? 1 - sm((kR - .9) / .1) : 1) : wR * .25;
    const bob = moving ? Math.abs(Math.sin(ph)) * 1.4 : Math.sin(t * 1.4) * .6;
    // the knight's legs under the rim (or the whole knight, when the bell is gone)
    const legs = () => { for (const side of [1, 0]) { let [th, sh] = gait(ph, side, .36, .55, moving); if (!moving) { th = Math.PI / 2 + (side ? -.14 : .14) + wS * (side ? .3 : -.3); sh = th + .1; }
      const L = seg2(side ? 3.4 : -3.4, -22, th, 11, sh, 11, 6.2, 5.4, side ? '#6A7276' : '#525A5E', { lit: '#C8D0D4' }); foot(L.ex - 1, L.ey + 1.3, '#2A2E30', 1.2); } };
    const knight = (y0) => { // the knight himself, as seen through the glass: a kettle-helm, a surcoat of Rebma's blue, a sword
      cel(PB([-8, y0 - 18, 8, y0 - 18, 9, y0 - 2, -9, y0 - 2]), '#2E4A7A', { d: 2.4, dark: '#16264A', lite: '#5A7AB8', w: 1.2, tex: () => { ctx.fillStyle = PAL.gold; ctx.fillRect(-1, y0 - 18, 2, 16); } });
      cel(PB([-6, y0 - 19, -7, y0 - 27, -2, y0 - 31, 5, y0 - 30, 7, y0 - 25, 6, y0 - 19]), '#8A9298', { d: 1.8, dark: '#4A5258', lite: '#E0E6EA', w: 1.2 });
      ctx.fillStyle = C('#0E1214'); ctx.fillRect(1, y0 - 26, 5.4, 1.6); if (DET()) { ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-4, y0 - 30, 4, 1); }
      ctx.fillStyle = C('#8A9298'); ell(0, y0 - 31, 9, 2); ctx.fill(); outline(.8); // the hat-brim of the kettle-helm
      const sa = -.9 + wS * -.5 + (kS >= 0 ? 1.2 : 0); ctx.save(); ctx.translate(6, y0 - 10); ctx.rotate(sa); ctx.fillStyle = C('#C8D0D8'); ctx.beginPath(); ctx.rect(0, -1, 22, 2); ctx.fill(); outline(.7); ctx.fillStyle = C(PAL.gold); ctx.fillRect(-1, -3, 2, 6); ctx.restore(); };
    if (bare) { // the bell broken away: only the knight, small, in the water, sword out
      ctx.save(); ctx.translate(0, -bob); legs(); knight(-20); ctx.restore();
      if (DET()) for (let i = 0; i < 3; i++) { const q = (t * .8 + i / 3) % 1; ctx.strokeStyle = `rgba(220,245,240,${.7 * (1 - q)})`; ctx.lineWidth = .7; circle(4 + Math.sin(q * 9 + i) * 2, -52 - q * 30, 1 + q * 1.5); ctx.stroke(); }
      return;
    }
    const rise = kS >= 0 ? 0 : wS * 4;
    ctx.save(); ctx.translate(0, -bob - rise);
    if (roll || tip) { ctx.translate(0, -28); ctx.rotate(tip * -Math.PI / 2 * .98 + roll); ctx.translate(0, 28); }
    if (!tip) legs();
    // the chain going up from the ring on its crown, slack, swaying (only while it stands)
    if (!tip && DET()) { ctx.strokeStyle = 'rgba(40,50,50,.8)'; ctx.lineWidth = 1.2; ctx.setLineDash([2.4, 1.6]); ctx.beginPath(); ctx.moveTo(0, -78); ctx.quadraticCurveTo(Math.sin(t * .8) * 10, -120, Math.sin(t * .5) * 6, -170); ctx.stroke(); ctx.setLineDash([]); }
    // the bell of glass: thick, green at its edges, the knight inside seen through it
    const bell = PB([-22, -20, -24, -26, -20, -56, -12, -70, 0, -74, 12, -70, 20, -56, 24, -26, 22, -20]);
    if (DET()) { ctx.save(); bell(0, 0); ctx.clip(); ctx.fillStyle = 'rgba(30,90,90,.35)'; ctx.fillRect(-30, -80, 60, 64); knight(-22); ctx.restore(); }
    bell(0, 0); ctx.fillStyle = FLASH ? '#fff' : TINT || 'rgba(170,230,220,.28)'; ctx.fill();
    if (DET()) { ctx.save(); bell(0, 0); ctx.clip();
      const g = ctx.createLinearGradient(-24, 0, 24, 0); g.addColorStop(0, 'rgba(120,200,190,.55)'); g.addColorStop(.18, 'rgba(255,255,255,.0)'); g.addColorStop(.8, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(40,110,110,.6)'); ctx.fillStyle = g; ctx.fillRect(-26, -76, 52, 58);
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, -60); ctx.quadraticCurveTo(-19, -44, -18, -26); ctx.stroke(); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-9, -66); ctx.quadraticCurveTo(-4, -70, 2, -70); ctx.stroke(); // the glints on the glass
      if (crack > 0) { ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = .9; for (let i = 0; i < crack * 4; i++) { const cx = (hsh(i + 1) - .5) * 30, cy = -30 - hsh(i + 5) * 40; ctx.beginPath(); ctx.moveTo(cx, cy); for (let k = 0; k < 4; k++) ctx.lineTo(cx + (hsh(i * 7 + k) - .5) * 16, cy + (hsh(i * 3 + k) - .5) * 14); ctx.stroke(); } }
      ctx.restore(); }
    bell(0, 0); outline(1.4);
    // its bronze bands and the ring at its crown
    for (const [y, w] of [[-22, 23], [-46, 21.5], [-64, 15]]) { ctx.fillStyle = C(PAL.bronze); rrect(-w, y - 1.8, w * 2, 3.6, 1.6); ctx.fill(); outline(.9); if (DET()) { ctx.fillStyle = PAL.verdL; ctx.globalAlpha = .6; ctx.fillRect(-w + 2, y - 1.6, w * .6, 1); ctx.globalAlpha = 1; } }
    ctx.strokeStyle = C(PAL.bronzeD); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, -77, 3.6, 0, TAU); ctx.stroke();
    if (DET()) for (let i = 0; i < 3; i++) { const q = (t * .6 + i / 3 + (e.slot || 0) * .1) % 1; ctx.strokeStyle = `rgba(220,245,240,${.6 * (1 - q)})`; ctx.lineWidth = .7; circle(Math.sin(q * 9 + i) * 3, -80 - q * 26, 1 + q * 1.4); ctx.stroke(); } // air escaping from the bell's crown
    ctx.restore();
  };

  // ======================================================================================================
  // THE CREATURES OF THE SEA-CHARTS: as the cartographers of the old world filled their empty water
  // ======================================================================================================
  // a fish-tail of the sea-charts' kind (sirens, the triton): a tapering body of scales from (x0, y0) by way of (cx, cy)
  // to (x1, y1), and a forked fin at its end
  function seaTail(x0, y0, cx, cy, x1, y1, w0, col, lite, dark, t, finA = 0) {
    const s = limb(x0, y0, cx, cy, x1, y1, w0, w0 * .22, col, 1.2, dark);
    if (DET()) { ctx.save(); trace(s.L, s.R); ctx.clip(); ctx.strokeStyle = 'rgba(20,40,40,.45)'; ctx.lineWidth = .6;
      for (let i = 1; i < s.M.length / 2 - 1; i++) { const x = s.M[i * 2], y = s.M[i * 2 + 1], w = (w0 + (w0 * .22 - w0) * i / (s.M.length / 2 - 1)) * .45;
        for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.arc(x + k * w * .6, y + k * w * .3, w * .4, .2, Math.PI - .2); ctx.stroke(); } }
      ctx.restore(); }
    const n = s.M.length, ex = s.M[n - 2], ey = s.M[n - 1], dx = ex - s.M[n - 4], dy = ey - s.M[n - 3], a = Math.atan2(dy, dx) + finA;
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(a);
    cel(PB([0, 0, 6, -7, 13, -11, 9, -2, 14, 4, 13, 9, 6, 6]), lite, { d: 1.4, r: .8, w: 1, dark: col, lite: shade(lite, .3), tex: () => { ctx.strokeStyle = 'rgba(30,60,60,.45)'; ctx.lineWidth = .5; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(1, 0); ctx.lineTo(12, -10 + i * 4.6); ctx.stroke(); } } });
    ctx.restore();
    return s;
  }

  // ---------------- SIREN OF THE STAIR: a woman to the waist and a fish below, with a comb and a glass, as the
  // bestiaries paint her; she sings, and what hears her goes to her ----------------
  CREATURES.w7siren = function (e, a) {
    a = a || {}; const t = a.t || 0, hurt = a.hurt, wS = windK(e, a, 'w7song'), wB = windK(e, a, 'w7bubble'), kS = actK(e, 'song'), kB = actK(e, 'bubble'), sing = kS >= 0 ? 1 : wS, blow = kB >= 0 ? 1 - kB : wB;
    const sw = Math.sin(t * 2.2 + (e.slot || 0)), lean = (hurt ? -.35 : 0) + sing * -.12 + blow * .1;
    ctx.save(); ctx.scale(1.3, 1.3); ctx.rotate(lean * .4);
    // her tail, curling under her, its fin flicking
    seaTail(-1, -16, -12 + sw * 3, 2, 4 + sw * 6, 6, 13, '#2E7A72', '#6ED0B8', '#164A44', t, sw * .4);
    // her hair: long, sea-green, floating up and out behind her in the water
    for (let i = 0; i < 9; i++) drift(-3 + i * .8, -36, 16 + hsh(i) * 10, 2.4, i % 3 ? PAL.hair : PAL.hairL, t, i * .9 + (e.slot || 0), -.9);
    // the body: pale, pearl at her throat, a girdle of gold where the scales begin
    cel(PB([-6, -34, 5, -34, 7, -26, 6, -16, -1, -13, -7, -16, -7, -26]), '#B8DCD0', { d: 2.2, dark: '#8AB0A8', lite: '#F8FFFC', w: 1.2, tex: () => { ctx.fillStyle = 'rgba(255,250,245,.9)'; for (let i = 0; i < 5; i++) { circle(-3 + i * 1.6, -31 + Math.abs(i - 2) * .6, .9); ctx.fill(); } } });
    ctx.fillStyle = C(PAL.gold); ctx.beginPath(); ctx.rect(-7, -17.5, 14, 2.4); ctx.fill(); outline(.7);
    // the head, tipped back when she sings; her mouth open on the note
    ctx.save(); ctx.translate(1, -40); ctx.rotate(-sing * .3 + blow * .1);
    face(0, 0, { s: .9, skin: '#B8DCD0', eye: '#1A4A6A', mouth: sing ? .8 : blow ? .3 : 0 });
    if (DET()) { ctx.fillStyle = 'rgba(220,120,130,.5)'; ell(3.6, 2.4, 1.6, 1); ctx.fill(); }
    if (blow > .1 && DET()) { ctx.fillStyle = 'rgba(255,220,220,.35)'; circle(5, 2.6, 2.4 * blow); ctx.fill(); } // cheeks full of air
    ctx.restore();
    // her arms: the glass held up in one hand, the comb in the other
    const ga = -1.9 - sing * .3 + Math.sin(t * 1.4) * .08;
    seg2(4, -32, ga + .6, 7, ga, 7, 3, 2.6, '#B8DCD0', { lit: '#E8FFF8' });
    const gx = 4 + Math.cos(ga + .6) * 7 + Math.cos(ga) * 7, gy = -32 + Math.sin(ga + .6) * 7 + Math.sin(ga) * 7;
    ctx.fillStyle = C(PAL.gold); ctx.fillRect(gx - .7, gy - 5, 1.4, 5); ctx.fillStyle = C('#C8E8F0'); ell(gx, gy - 6.6, 2.4, 3); ctx.fill(); outline(1); if (DET()) { ctx.fillStyle = 'rgba(255,255,255,.8)'; ell(gx - .7, gy - 7.6, .7, 1.1); ctx.fill(); } // the glass
    seg2(-5, -32, Math.PI / 2 + .4 + blow * -.8, 7, Math.PI / 2 - .4 - blow * 1.4, 6, 3, 2.6, '#C8E0D8');
    ctx.restore();
  };

  // ---------------- HIPPOCAMP RIDER: a horse of the sea, its fore-hooves webbed into fins, its hind half a long tail
  // that coils behind it; on its back a lancer of Rebma with a pennon ----------------
  CREATURES.w7hippo = function (e, a) {
    a = a || {}; const t = a.t || 0, hurt = a.hurt, wG = windK(e, a, 'w7gallop'), wL = windK(e, a, 'w7lance'), kG = actK(e, 'gallop'), kL = actK(e, 'lance');
    const run = kG >= 0 ? 1 : 0, dive = kL >= 0 ? sm(Math.min(1, kL * 2)) : 0, rear = wG * .5 + wL * .35, sw = Math.sin(t * (run ? 9 : 3.2) + (e.slot || 0));
    ctx.save(); ctx.rotate(-rear * .5 + dive * .55 + (hurt ? -.3 : 0) + (run ? .12 : 0));
    // the tail behind, in coils, its fan-fin at the end
    seaTail(-8, -18, -30, -16 + sw * 8, -40 + sw * 4, -34 - sw * 6, 13, '#4A7AA8', '#9ACCE8', '#24406A', t, sw * .5);
    // the fore-legs, paddling, their hooves webbed
    for (const side of [1, 0]) { const pa = Math.PI / 2 + Math.sin(t * (run ? 14 : 5) + side * Math.PI) * (run ? .9 : .5) - .3 - rear * 1.1, L = seg2(10 + side * 3, -18, pa, 9, pa - .8, 8, 4.4, 3.4, side ? '#5A8AB8' : '#3E6A98', { lit: '#B8DCF0' });
      ctx.save(); ctx.translate(L.ex, L.ey); ctx.rotate(pa - .8); ctx.fillStyle = C('#9ACCE8'); poly([0, -3, 6, -1, 7, 2, 0, 3]); ctx.fill(); outline(.8); ctx.restore(); }
    // the body and the arched neck, the mane a crest of fins
    cel(PB([-12, -24, 0, -30, 12, -28, 18, -22, 16, -14, 4, -11, -10, -13]), '#5A8AB8', { d: 2.6, dark: '#2E5482', lite: '#A8D4F0', w: 1.3, tex: () => { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = .7; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(-6 + i * 4, -18, 2, .2, Math.PI - .2); ctx.stroke(); } } });
    cel(PB([12, -28, 16, -38, 22, -46, 28, -44, 26, -36, 20, -26]), '#5A8AB8', { d: 2, dark: '#2E5482', lite: '#A8D4F0', w: 1.2 });
    for (let i = 0; i < 5; i++) { const mx = 13 + i * 2.6, my = -32 - i * 3.2; ctx.fillStyle = C('#E8C870'); poly([mx, my, mx - 5 + sw, my - 4 - i * .4, mx - 1, my - 1]); ctx.fill(); } // the mane: gold fins
    // the head: a horse's, long, the nostrils flared, an eye of jet
    ctx.save(); ctx.translate(26, -45); ctx.rotate(.55 + dive * .3 - rear * .3);
    cel(PB([-4, -4, 4, -5, 13, -2, 15, 2, 12, 5, 2, 4, -4, 3]), '#6A9AC8', { d: 1.6, dark: '#2E5482', lite: '#C8E4F8', w: 1.2 });
    if (DET()) { ctx.fillStyle = '#0A1420'; circle(2, -1.6, 1.2); ctx.fill(); ctx.fillStyle = '#FFFFFF'; circle(2.4, -2, .4); ctx.fill(); ctx.fillStyle = '#2E5482'; circle(13.4, 2, .9); ctx.fill(); }
    ctx.fillStyle = C('#9ACCE8'); poly([-3, -4, -1, -10, 2, -5]); ctx.fill(); outline(.7); // an ear like a fin
    ctx.restore();
    // the rider: a small Rebman lancer in nacre mail, leaning into the charge
    const rl = run ? .35 : 0, ry = -30;
    ctx.save(); ctx.translate(-1, ry); ctx.rotate(rl - rear * .2);
    cel(PB([-5, 0, 5, 0, 6, -10, 3, -16, -3, -16, -6, -10]), PAL.nacre, { d: 2, dark: PAL.nacreD, lite: PAL.nacreL, w: 1.1 });
    face(1, -20, { s: .72, skin: PAL.rebm, gill: 1 });
    cel(PB([-4, -21, -4, -25, 0, -27.6, 5, -26, 5, -22]), PAL.verd, { d: 1.2, w: 1, dark: PAL.verdD, lite: PAL.verdL });
    for (let i = 0; i < 3; i++) drift(-4 + i, -22, 7, 1.6, PAL.hair, t, i + 3, -.8);
    // the lance, couched, its pennon streaming back in the water
    const la = kL >= 0 ? .7 : -.05 - wL * 1.4 + (run ? .1 : 0);
    ctx.save(); ctx.translate(3, -8); ctx.rotate(la);
    ctx.fillStyle = C('#5A4430'); ctx.beginPath(); ctx.rect(-14, -1.1, 58, 2.2); ctx.fill(); outline(.7); ctx.fillStyle = C('#D8E0E4'); poly([44, -2, 54, 0, 44, 2]); ctx.fill(); outline(.7);
    ctx.fillStyle = C('#C8343A'); poly([30, -1, 22 - sw * 2, -7, 18, -4 + sw, 12, -6, 16, 0]); ctx.fill(); outline(.7);
    ctx.restore(); ctx.restore();
    ctx.restore();
  };

  // ---------------- BRONZE TRITON: a fountain's triton come down off its basin, green with the sea, on a coil of its
  // own two tails; it blows the conch, and the sound in the water is a blow ----------------
  CREATURES.w7triton = function (e, a) {
    a = a || {}; const t = a.t || 0, ph = a.walk || 0, moving = ph ? 1 : 0, hurt = a.hurt;
    const wC = windK(e, a, 'w7conch'), wT = windK(e, a, 'w7trident'), kC = actK(e, 'conch'), kT = actK(e, 'trident'), blow = kC >= 0 ? 1 - sm((kC - .7) / .3) : wC;
    const thrust = kT >= 0 ? (kT < .2 ? sm(kT / .2) : kT < .55 ? 1 : 1 - sm((kT - .55) / .45)) : 0, sw = Math.sin(ph * .8 + t * .9);
    const lean = -wC * .2 + blow * .1 - wT * .2 + thrust * .3 + (hurt ? -.25 : 0);
    const BZ = '#4E8A72', BZL = '#9AD0B4', BZD = '#1E4438', BR = '#B88A48';
    // the coils of its two tails, on which it moves like a serpent
    seaTail(-4, -20, -24 - sw * 4, -2, -6 + sw * 8, -4, 15, BZ, BZL, BZD, t, -.6);
    seaTail(4, -20, 24 + sw * 4, -4, 10 - sw * 6, -12, 13, '#447E68', BZL, BZD, t, .4);
    ctx.save(); ctx.translate(0, -24); ctx.rotate(lean * .45); ctx.scale(1.22, 1.22); ctx.translate(0, 22);
    // the torso: a strong man's, cast in bronze, the patina green where the water has had it, the bronze bright where it is worn
    cel(PB([-11, -60, 11, -60, 13, -46, 10, -30, 0, -22, -10, -30, -13, -46]), BZ, { d: 3.2, dark: BZD, lite: BZL, w: 1.5, tex: () => {
      ctx.strokeStyle = 'rgba(16,40,32,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -58); ctx.lineTo(0, -34); ctx.moveTo(-8, -46); ctx.quadraticCurveTo(-3, -42, 0, -46); ctx.quadraticCurveTo(3, -42, 8, -46); ctx.stroke();
      for (const [x, y] of [[-5, -54], [6, -52], [2, -38]]) { ctx.fillStyle = BR; ctx.globalAlpha = .55; ell(x, y, 2.4, 1.4); ctx.fill(); ctx.globalAlpha = 1; }
      ctx.fillStyle = 'rgba(200,240,220,.5)'; ctx.fillRect(-12, -40, 24, 1.2); } }); // where scales begin
    // the head: curled hair and beard cast in bronze, the eyes blank, the cheeks blown out round the conch
    const hy = -66 - blow * 1;
    cel(PB([-7, hy - 6, 0, hy - 10, 7, hy - 6, 8, hy + 2, 4, hy + 7, -4, hy + 7, -8, hy + 1]), BZ, { d: 2, dark: BZD, lite: BZL, w: 1.3, tex: () => {
      ctx.fillStyle = BZD; for (let i = 0; i < 7; i++) { circle(-6 + i * 2, hy - 7 + Math.abs(i - 3) * .6, 1.6); ctx.fill(); } // the curls
      ctx.fillStyle = BZD; for (let i = 0; i < 6; i++) { circle(-3 + i * 1.8, hy + 5 + Math.abs(i - 2.5) * -.6 + 1, 1.7); ctx.fill(); } // the curled beard
      ctx.fillStyle = BZL; ctx.fillRect(-5, hy - 4, 1.2, 6); ctx.fillStyle = BR; ctx.globalAlpha = .6; ell(-2, hy - 3, 2, 1.2); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = BZL; ell(4, hy - 1, 1.4, .9); ctx.fill(); // a blank eye
      if (blow > .2) { ctx.fillStyle = 'rgba(200,240,220,.45)'; circle(5, hy + 3, 2.6 * blow); ctx.fill(); } } });
    // the conch: a great whelk, spiralled, its lip pink; at its lips when it blows
    const cA = blow > .05 ? -.25 : .9, cx = blow > .05 ? 9 : 10, cy = blow > .05 ? hy + 3 : -40;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(cA);
    cel(PB([0, -3, 8, -5, 18, -3, 22, 0, 18, 4, 8, 5, 0, 3]), '#E8D2BE', { d: 1.6, dark: '#A88A70', lite: '#FFF4EA', w: 1.1, tex: () => { ctx.strokeStyle = 'rgba(120,80,60,.6)'; ctx.lineWidth = .7; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(4 + i * 4, -4); ctx.lineTo(6 + i * 4, 4); ctx.stroke(); } } });
    ctx.fillStyle = C('#E89A9A'); ell(21, 0, 2, 4); ctx.fill(); outline(.7);
    ctx.restore();
    seg2(8, -56, blow > .05 ? -.2 : Math.PI / 2 - .2, 10, blow > .05 ? -1.3 : .9, 9, 5.4, 4.6, BZ, { lit: BZL });
    // the trident, in the far hand: three barbed tines of bronze
    const tA = -.1 - wT * .2 + thrust * .1, tx = -2 - wT * 10 + thrust * 18;
    ctx.save(); ctx.translate(tx, -44); ctx.rotate(tA);
    ctx.fillStyle = C(BR); ctx.beginPath(); ctx.rect(-20, -1.4, 64, 2.8); ctx.fill(); outline(.8);
    ctx.strokeStyle = C(BR); ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(44, -7); ctx.lineTo(44, 7); for (const y of [-7, 0, 7]) { ctx.moveTo(44, y); ctx.lineTo(56, y); } ctx.stroke();
    ctx.strokeStyle = C(INK); ctx.lineWidth = .7; ctx.stroke(); if (DET()) { ctx.strokeStyle = '#F2D08A'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(44, -1); ctx.lineTo(55, -1); ctx.stroke(); }
    ctx.restore();
    seg2(-8, -56, Math.PI / 2 + .6 - thrust * 1.2, 10, Math.PI / 2 - .3 - thrust * 1.1, 9, 5.4, 4.6, '#447E68', { lit: BZL });
    ctx.restore();
  };

  // ---------------- THE SEA-BISHOP: the bestiaries say one was taken in the nets off the coast of the north, and that
  // it would eat nothing, and showed the king's bishops by signs that it wished to go back to the sea, and they let it.
  // This is one that did not get back. Its head grows up into a mitre; its cope is scales; its crozier is coral ----------------
  CREATURES.w7bishop = function (e, a) {
    a = a || {}; const t = a.t || 0, ph = a.walk || 0, moving = ph ? 1 : 0, hurt = a.hurt;
    const wC = windK(e, a, 'w7crozier'), wB = windK(e, a, 'w7bless'), wP = windK(e, a, 'w7plunge'), kC = actK(e, 'crozier'), kB = actK(e, 'bless'), kP = actK(e, 'plunge'), br = breath(e, t, 1.1);
    const swing = kC >= 0 ? sm(Math.min(1, kC / .55)) : 0, bless = kB >= 0 ? 1 : wB, dive = kP >= 0 && e.z > 20 ? 1 : 0;
    const lean = -wC * .2 + swing * .3 - wB * .1 + (hurt ? -.25 : 0) + moving * .05 + dive * 1.3;
    const hipY = -32 + br * .5 + (moving ? -Math.abs(Math.sin(ph)) * 1.2 : 0);
    ctx.save(); ctx.translate(0, hipY); ctx.rotate(lean * .4); ctx.translate(0, -hipY);
    // the crozier behind: a staff of red coral, its crook a spiralled shell
    const cA = kC >= 0 ? lerp(-2.6, .8, swing) : wC > 0 ? lerp(-1.75, -2.6, wC) : -1.75, cx = -6 + swing * 10, cy = hipY - 10;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(cA);
    ctx.strokeStyle = C(INK); ctx.lineWidth = 4.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-28, 0); ctx.lineTo(54, 0); ctx.stroke(); ctx.strokeStyle = C(PAL.coral); ctx.lineWidth = 2.8; ctx.stroke();
    if (DET()) { ctx.strokeStyle = PAL.coralL; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-26, -.7); ctx.lineTo(52, -.7); ctx.stroke(); for (let i = 0; i < 6; i++) { ctx.fillStyle = PAL.coralD; circle(-18 + i * 12, .8, .9); ctx.fill(); } }
    ctx.strokeStyle = C(INK); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(54, 0); ctx.quadraticCurveTo(66, -2, 64, -12); ctx.arc(58, -12, 6, 0, Math.PI * 1.6, true); ctx.stroke();
    ctx.strokeStyle = C('#E8D4C0'); ctx.lineWidth = 3.2; ctx.stroke();
    ctx.restore();
    // feet: webbed, clawed, under the hem
    for (const side of [0, 1]) { const fx = side ? 6 + (moving ? Math.sin(ph) * 4 : 0) : -6 - (moving ? Math.sin(ph) * 4 : 0); ctx.fillStyle = C('#6A8A70'); poly([fx - 4, 0, fx - 2, -4, fx + 4, -4, fx + 8, 0, fx + 5, -1.4, fx + 3, 0]); ctx.fill(); outline(.9); }
    // the cope: a great cloak of overlapping scales, green-gold, bordered with embroidery; its hem lifts in the water
    const hem = Math.sin(t * 1.1 + (e.slot || 0)) * 3;
    cel(PB([-10, hipY - 26, 10, hipY - 26, 15, hipY - 6, 18 + hem * .5, -8 + hem, 12, 0, 0, -2, -12, 0, -18 - hem * .3, -8 - hem * .6, -15, hipY - 6]), '#6A8A4A', { d: 3.4, dark: '#34502A', lite: '#B8D08A', w: 1.5, tex: () => {
      for (let r = 0; r < 9; r++) for (let c = -5; c <= 5; c++) { const x = c * 3.6 + (r % 2) * 1.8, y = hipY - 22 + r * 4.6; ctx.strokeStyle = 'rgba(30,50,20,.5)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.arc(x, y, 2.3, .15, Math.PI - .15); ctx.stroke(); if ((r * 3 + c) % 5 === 0) { ctx.fillStyle = 'rgba(255,230,140,.45)'; ctx.fillRect(x - 1, y + .5, 2, 1); } }
      ctx.strokeStyle = PAL.gold; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-18 - hem * .3, -8 - hem * .6); ctx.quadraticCurveTo(0, -1, 18 + hem * .5, -8 + hem); ctx.stroke(); // the orphrey along its hem
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-1, hipY - 26); ctx.lineTo(0, -3); ctx.stroke(); ctx.strokeStyle = '#8A2A2E'; ctx.lineWidth = 1; ctx.stroke(); // and down its front
      ctx.fillStyle = PAL.goldL; ctx.beginPath(); ctx.arc(0, hipY - 20, 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#2A4A8A'; circle(0, hipY - 20, 2); ctx.fill(); } }); // the morse
    // the head: the face of a fish that has learned to be grave; the head goes up into a mitre of bone
    const hy = hipY - 34, mo = bless ? .2 : kC >= 0 ? .7 : hurt ? .6 : .25;
    ctx.save(); ctx.translate(2, hy);
    cel(PB([-6, -12, -9, -24, -6, -36, 0, -42, 6, -36, 9, -24, 8, -12]), '#E6DCC8', { d: 2.4, dark: '#A89880', lite: '#FFF8E8', w: 1.3, tex: () => { // the mitre, its lappets, its gold bands
      ctx.fillStyle = PAL.gold; ctx.fillRect(-8, -16, 17, 2.6); ctx.fillRect(-.9, -40, 1.8, 26); ctx.fillStyle = '#8A2A2E'; ctx.fillRect(-.5, -30, 1, 12); ctx.fillStyle = '#2A4A8A'; circle(0, -15, 1.3); ctx.fill(); } });
    cel(PB([-8, -12, 0, -15, 9, -12, 11, -4, 9, 3, 2, 6, -6, 4, -9, -3]), '#8AA894', { d: 2, dark: '#4A6A58', lite: '#C8E0CE', w: 1.3, tex: () => {
      ctx.strokeStyle = 'rgba(30,60,50,.45)'; ctx.lineWidth = .5; for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.arc(-6 + (i % 4) * 4, -9 + Math.floor(i / 4) * 4, 1.6, .2, Math.PI - .2); ctx.stroke(); } } }); // scaled face
    ctx.fillStyle = C('#F2EED2'); circle(5, -6, 2.8); ctx.fill(); outline(.9); if (DET()) { ctx.fillStyle = '#0A0E10'; circle(5.8, -5.8, 1.3); ctx.fill(); ctx.fillStyle = '#FFFFFF'; circle(6.3, -6.4, .4); ctx.fill(); } // its round eye that never shuts
    ctx.fillStyle = C('#2A1A1E'); ell(8, 1, 3.4, 1 + mo * 2.4); ctx.fill(); outline(.8); // the wide lipless mouth
    ctx.fillStyle = C('#8AA894'); poly([-8, -2, -14, -6, -13, 2, -8, 3]); ctx.fill(); outline(.8); // a fin where an ear should be
    ctx.restore();
    // the blessing hand: two fingers raised (webbed), and the other on the crozier
    const ba = bless ? -1.6 : Math.PI / 2 - .3 + swing * -.6;
    const bl = seg2(7, hipY - 22, ba + .4, 10, ba - (bless ? .1 : .5), 9, 5, 4.2, '#6A8A4A', { col2: '#8AA894', lit: '#B8D08A' });
    ctx.fillStyle = C('#8AA894'); ell(bl.ex, bl.ey, 3, 3.6); ctx.fill(); outline(.9);
    if (bless && DET()) { ctx.fillStyle = '#8AA894'; ctx.fillRect(bl.ex - 1.6, bl.ey - 8, 1.4, 6); ctx.fillRect(bl.ex + .4, bl.ey - 8, 1.4, 6); glowM(bl.ex, bl.ey - 6, 16, RGB.gold, .3 * (kB >= 0 ? 1 : wB)); }
    ctx.restore();
  };

  // ======================================================================================================
  // THE SWIMMERS: what goes through the water over the stair and the streets, not along their floors
  // ======================================================================================================
  // ---------------- SEA-KNIGHT OF MOIRE: a knight of the Queen's guard in full plate, swimming as a man in armour swims
  // in Rebma: the legs kicking together like a frog's, the shield sculling, the cloak and the plume of his great helm
  // streaming up off him in the water; a long spear couched for the joust ----------------
  CREATURES.w7knight = function (e, a) {
    a = a || {}; const t = a.t || 0, hurt = a.hurt, wJ = windK(e, a, 'w7joust'), wH = windK(e, a, 'w7hurl'), kJ = actK(e, 'joust'), kH = actK(e, 'hurl');
    const dash = kJ >= 0 && kJ > .15 && kJ < .8 ? 1 : 0, noSpear = e.w7noSpear > 0, ph = t * 3 + (e.slot || 0), kick = dash ? 0 : Math.sin(ph), push = Math.max(0, Math.sin(ph + .6));
    const STEEL = '#8E98A2', STEELL = '#E0E6EA', STEELD = '#3E464E';
    ctx.save(); ctx.translate(0, -24 - push * 3); ctx.rotate((dash ? 1.25 : .42 + Math.sin(ph) * .06 + wJ * .2) + (hurt ? -.35 : 0)); ctx.translate(0, 24);
    // the cloak, lapis, streaming up and back off his shoulders
    const cw = Math.sin(t * 1.4 + (e.slot || 0)) * 4;
    cel(PB([-6, -42, 4, -42, 2, -56 - cw, -10, -70 + cw, -22, -66, -16, -50]), '#1E3A78', { d: 2, r: 1, w: 1.2, dark: '#0E1C40', lite: '#4A6AB8' });
    // the legs, in plate, kicking together (the frog-kick of a man swimming in armour)
    for (const side of [0, 1]) { const u = dash ? 0 : (kick + 1) / 2, th = Math.PI / 2 + .55 - u * 1.15 + (side ? .1 : -.06), kn = dash ? .02 : .15 + u * 1.5; // both together, drawn up and driven back
      const L = seg2(side ? 2.5 : -2.5, -18, th, 11, th + kn, 11, 5.6, 4.8, side ? STEEL : '#6E7882', { lit: STEELL });
      ctx.fillStyle = C(STEELD); ell(L.ex, L.ey + 1, 3.6, 1.8, th + kn - Math.PI / 2); ctx.fill(); outline(.8); }
    // the shield on the far arm, sculling: a kite of lapis with the reversed unicorn in white
    ctx.save(); ctx.translate(-9, -32); ctx.rotate(-.3 + Math.sin(ph + 1.5) * (dash ? .05 : .45) + wJ * .2); ctx.scale(1.15, 1.15);
    cel(PB([-7, -9, 7, -9, 6, 4, 0, 14, -6, 4]), '#1E3A78', { d: 1.8, r: 1, dark: '#0E1C40', lite: '#4A6AB8', w: 1.2, tex: () => {
      ctx.strokeStyle = '#EEF0EA'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(3, 5); ctx.lineTo(1, -1); ctx.lineTo(-3, -3); ctx.lineTo(-5, -7); ctx.moveTo(-3, -3); ctx.lineTo(-2, 4); ctx.stroke();
      ctx.strokeStyle = PAL.gold; ctx.lineWidth = 1.2; PB([-7, -9, 7, -9, 6, 4, 0, 14, -6, 4])(0, 0); ctx.stroke(); } });
    ctx.restore();
    // the body: a breastplate, a surcoat of Rebma's blue whose skirts float up round his hips
    cel(PB([-8, -45, 8, -45, 9, -32, 8, -20, -8, -20, -9, -32]), STEEL, { d: 2.6, dark: STEELD, lite: STEELL, w: 1.3, tex: () => { ctx.strokeStyle = 'rgba(30,36,44,.6)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(0, -44); ctx.lineTo(0, -22); ctx.stroke(); } });
    const sk = Math.sin(t * 1.8 + (e.slot || 0)) * 2;
    cel(PP([-7, -34, 7, -34, 10, -18 - sk, 4, -22, 0, -15 + sk, -4, -22, -10, -18 + sk]), '#2E4A8A', { d: 1.6, w: 1.1, dark: '#16264A', lite: '#5A7AB8', tex: () => { ctx.fillStyle = PAL.gold; ctx.fillRect(-7, -27, 14, 2); } });
    // the great helm: flat-topped, the eye-slit and breaths, a gold crest-band; the plume streaming up out of it
    for (let i = 0; i < 4; i++) drift(-2 + i * 1.2, -60, 11 + i * 3, 2.4, i % 2 ? '#E8DCC8' : '#C8343A', t * 1.2, i * .7 + (e.slot || 0), -.8);
    cel(PP([-6, -46, -6, -58, 7, -59, 7.5, -46]), STEEL, { d: 1.8, dark: STEELD, lite: STEELL, w: 1.3, tex: () => { ctx.fillStyle = '#0A0E12'; ctx.fillRect(1, -54.4, 6.5, 1.5); for (let i = 0; i < 3; i++) ctx.fillRect(4 + i * 1.4, -50, .7, 2.4); ctx.fillStyle = PAL.gold; ctx.fillRect(-6, -59, 13, 1.6); } });
    // the spear, couched in the near hand (or gone, thrown)
    if (!noSpear) { const la = kH >= 0 ? lerp(-1.1, .5, sm(kH / .4)) : wH > 0 ? lerp(0, -1.1, wH) : (dash ? -1.2 : -.1) + wJ * .1;
      ctx.save(); ctx.translate(7, -34); ctx.rotate(la); ctx.beginPath(); ctx.rect(-18, -1.1, 66, 2.2); ctx.fillStyle = C('#5A4430'); ctx.fill(); outline(.7);
      ctx.fillStyle = C('#D8E0E4'); poly([48, -2.6, 60, 0, 48, 2.6]); ctx.fill(); outline(.8); ctx.fillStyle = C('#C8343A'); poly([30, -1, 20 - Math.sin(t * 5) * 2, -7, 16, -1]); ctx.fill(); outline(.6); ctx.restore(); }
    seg2(6, -42, Math.PI / 2 - .3 - wJ * .4 + (dash ? -1.2 : 0), 8, .1 - wJ * .2 + (dash ? -1.2 : 0), 7, 4.4, 3.8, STEEL, { lit: STEELL });
    ctx.restore();
  };

  // ---------------- THE ZIPHIUS: the beast of the northern sea-charts, an owl's face on a sea-beast, that comes down on
  // its prey from above as an owl does; fins like wings, a hooked beak, eyes like two lamps ----------------
  CREATURES.w7ziphius = function (e, a) {
    a = a || {}; const t = a.t || 0, hurt = a.hurt, wS = windK(e, a, 'w7swoop'), wN = windK(e, a, 'w7snatch'), kS = actK(e, 'swoop'), kN = actK(e, 'snatch');
    const dive = kS >= 0 && kS < .5 ? 1 : 0, fast = kN >= 0 ? 1 : 0, beat = Math.sin(t * (dive || fast ? 14 : 4) + (e.slot || 0)), spread = dive ? -.6 : wS * .5 + wN * .4;
    ctx.save(); ctx.rotate(dive ? .9 : fast ? .25 : (hurt ? -.4 : 0) + Math.sin(t * 1.3) * .05);
    const finW = (side) => { ctx.save(); ctx.translate(-2, -18); ctx.scale(1, side); ctx.rotate(-.5 - beat * .45 - spread);
      cel(PB([0, 0, -6, -10, -18, -22, -30, -26, -26, -16, -22, -8, -12, -2]), side > 0 ? '#3A4A6A' : '#2A3654', { d: 2, r: 1, w: 1.2, dark: '#1A2238', lite: '#7A8AB0', tex: () => { ctx.strokeStyle = 'rgba(200,210,240,.45)'; ctx.lineWidth = .6; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-2, -1); ctx.lineTo(-28 + i * 3, -24 + i * 3.4); ctx.stroke(); } } });
      ctx.restore(); };
    finW(-1);
    // the tail and its fluke
    seaTail(-8, -16, -22, -12 + beat * 3, -34, -20 - beat * 4, 12, '#34426A', '#8A9AC8', '#18203A', t, beat * .4);
    // the body: dark slate, a pale belly, scaled
    cel(PB([-14, -18, -6, -28, 8, -30, 18, -24, 18, -12, 6, -6, -10, -9]), '#3A4868', { d: 2.6, dark: '#1A2238', lite: '#7A8AB8', w: 1.4, tex: () => {
      ctx.fillStyle = 'rgba(220,214,190,.55)'; ell(4, -10, 12, 4); ctx.fill();
      ctx.strokeStyle = 'rgba(10,14,30,.45)'; ctx.lineWidth = .6; for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.arc(-8 + (i % 5) * 5, -24 + Math.floor(i / 5) * 5, 2, .2, Math.PI - .2); ctx.stroke(); } } });
    // the owl's face: a pale disc, two great lamp-eyes, the hooked beak, the tufts of fin like an owl's ears
    ctx.save(); ctx.translate(18, -22);
    cel(PE(0, 0, 9, 10), '#D8D0B8', { d: 1.6, r: 1, w: 1.2, dark: '#8A8270', lite: '#F8F2E0' });
    for (const s of [-1, 1]) { ctx.fillStyle = C('#3A4868'); poly([s * 3, -8, s * 8, -15, s * 7, -7]); ctx.fill(); outline(.8); }
    for (const ex of [-3.4, 3.4]) { ctx.fillStyle = C('#E8A030'); circle(ex, -2, 3.2); ctx.fill(); outline(.8); if (DET()) { ctx.fillStyle = '#0A0806'; circle(ex + .4, -2, 1.6 + (dive ? .8 : 0)); ctx.fill(); ctx.fillStyle = '#FFFFFF'; circle(ex - .4, -3, .5); ctx.fill(); } }
    ctx.fillStyle = C('#4A3A20'); poly([-1.6, 1, 1.6, 1, 1.4, 4, 0, 7, -.8, 4]); ctx.fill(); outline(.7);
    if (fast && DET()) { ctx.fillStyle = '#0A0806'; ell(0, 5, 2, 1.2); ctx.fill(); }
    ctx.restore();
    finW(1);
    ctx.restore();
  };

  // ---------------- NIXIE OF THE STAIR: the sea's putti, as the old painters put them round the sea-gods: fat drowned
  // children with ringlets of weed, borne up on webbed wings like a bat's, that beat as fast as a moth's; they go in
  // shoals, and they bite ----------------
  CREATURES.w7nixie = function (e, a) {
    a = a || {}; const t = a.t || 0, hurt = a.hurt, wN = windK(e, a, 'w7nip'), kN = actK(e, 'nip'), kR = actK(e, 'ring'), dart = kN > .25 ? 1 : 0, fast = dart || kR >= 0;
    const beat = Math.sin(t * (fast ? 30 : 17) + (e.slot || 0) * 2), kick = Math.sin(t * 6 + (e.slot || 0));
    const SK = '#B8D4C8', SKD = '#7AA096', SKL = '#E8F6EE';
    ctx.save(); ctx.scale(1.5, 1.5); ctx.rotate((dart ? .8 : kR >= 0 ? .35 : 0) - wN * .35 + (hurt ? -.5 : 0) + Math.sin(t * 2.4 + (e.slot || 0)) * .08);
    const wing = (side) => { ctx.save(); ctx.translate(-2, -17); ctx.scale(1, side); ctx.rotate(-1.1 - beat * .55 * side - (dart ? .6 : 0));
      cel(PB([0, 0, 2, -8, -2, -16, -8, -12, -11, -14, -13, -6, -9, -2]), side > 0 ? '#9AC8D8' : '#78A8BC', { d: 1, r: .6, w: 1, dark: '#4A7A8E', lite: '#D8F0F8', tex: () => { ctx.strokeStyle = 'rgba(40,70,90,.7)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-2, -16); ctx.moveTo(0, 0); ctx.lineTo(-11, -14); ctx.moveTo(0, 0); ctx.lineTo(-13, -6); ctx.stroke(); } });
      ctx.restore(); };
    wing(-1);
    // fat little legs, kicking
    for (const side of [0, 1]) { const th = Math.PI / 2 + (side ? .3 : -.2) + (side ? kick : -kick) * .35 - (dart ? .9 : 0); seg2(side ? 2 : -1.5, -9, th, 4.6, th + .5, 4, 3.6, 3, side ? SK : SKD, { lit: SKL }); }
    // the round body
    cel(PE(0, -13, 5.6, 6.2), SK, { d: 1.6, r: 1, w: 1.1, dark: SKD, lite: SKL, tex: () => { ctx.fillStyle = 'rgba(230,140,150,.3)'; ell(1, -11, 2.4, 1.6); ctx.fill(); } });
    // the head: big, round, ringlets of green weed, lantern-pale eyes, the needle-teeth when it means to bite
    cel(PE(1.5, -22, 5.4, 5), SK, { d: 1.4, r: .8, w: 1.1, dark: SKD, lite: SKL });
    for (let i = 0; i < 7; i++) { const a2 = Math.PI * (.95 + i * .16); ctx.fillStyle = C(i % 2 ? '#2E6A5A' : '#4E8A6A'); circle(1.5 + Math.cos(a2) * 5.2, -22 + Math.sin(a2) * 4.8, 1.9); ctx.fill(); outline(.6); }
    if (DET()) { ctx.fillStyle = '#0A1A1A'; ell(4, -22.4, 1.4, 1.7); ctx.fill(); ell(.6, -22.4, 1.1, 1.5); ctx.fill(); ctx.fillStyle = '#DFFFEA'; circle(4.2, -22.8, .6); ctx.fill(); circle(.8, -22.8, .5); ctx.fill();
      if (wN > .3 || dart) { ctx.fillStyle = '#0A1A1A'; ell(4.6, -19.4, 1.5, 1.1); ctx.fill(); ctx.fillStyle = '#F2F8F0'; ctx.fillRect(3.4, -20.2, .6, .8); ctx.fillRect(4.9, -20.2, .6, .8); } }
    seg2(3.4, -15, .4 - wN * 1.1 + dart * -.7, 3.6, -.1 - dart * .6, 3, 2.4, 2, SK, { lit: SKL });
    wing(1);
    ctx.restore();
  };

  // ======================================================================================================
  // THE KING IN THE GLASS: Rebma's reflection of Oberon. With Oberon gone out of Amber it has no one left to follow, and
  // it has made itself a king. Made of sea-glass and the sea: a crowned torso in a Byzantine loros of gold and pearl over
  // robes of green glass, a beard of foam, a crown with pendilia of pearls, and the Pearl of Judgement set in its brow;
  // below the waist it is a column of turning water. Its pose comes from the 'w7glass' rule: e.w7pose = { k: kind, u },
  // e.w7sub how far it is sunk into the floor (0..1), e.w7mirror for its reflection (it holds the trident left-handed)
  // ======================================================================================================
  const KG = { glass: '#5AA894', glassL: '#BEEAD8', glassD: '#1E5448', robe: '#2E6E64', robeL: '#7CC4AE', robeD: '#123A34', foam: '#EEF6F2', skin: '#A8D4C4', skinD: '#5E9484', skinL: '#E2F6EE' };
  function kingTrident(len, glow) { // along +x from the hand
    ctx.fillStyle = C(PAL.gold); ctx.beginPath(); ctx.rect(-18, -1.8, len + 18, 3.6); ctx.fill(); outline(1);
    if (DET()) { ctx.fillStyle = PAL.goldL; ctx.fillRect(-18, -1.8, len + 18, 1); }
    ctx.fillStyle = C(PAL.gold); rrect(len - 4, -9, 6, 18, 2); ctx.fill(); outline(1);
    for (const y of [-8, 0, 8]) { ctx.fillStyle = C(PAL.gold); poly([len, y - 2, len + (y ? 18 : 24), y - .6, len + (y ? 22 : 30), y, len + (y ? 18 : 24), y + .6, len, y + 2]); ctx.fill(); outline(.9);
      ctx.fillStyle = C(PAL.goldD); poly([len + (y ? 14 : 20), y + (y < 0 ? -1 : 1), len + (y ? 10 : 15), y + (y < 0 ? -4 : 4), len + (y ? 12 : 17), y]); ctx.fill(); } // barbs
    if (glow > 0) glowM(len + 18, 0, 30, RGB.surf, .4 * glow);
  }
  CREATURES.w7king = function (e, a) {
    a = a || {}; const t = a.t || 0, hurt = a.hurt, P0 = e.w7pose || { k: 'idle', u: 0 }, pk = P0.k, u = P0.u || 0, sub = e.w7sub || 0, mir = e.w7mirror ? 1 : 0;
    const zz = e.z || 0, br = Math.sin(t * 1.3), sway = Math.sin(t * .8) * .04;
    // how deep it is sunk: everything below the waterline is cut away and the swirl closes over it
    ctx.save();
    if (sub > 0) { ctx.beginPath(); ctx.rect(-200, -400, 400, 400 - lerp(0, 120, sub) + zz); ctx.clip(); ctx.translate(0, sub * 70); }
    // the column of turning water it stands on, down to the floor
    if (zz > -1) { const top = -18, bot = zz + 4;
      for (let k = 0; k < 3; k++) { ctx.fillStyle = FLASH ? '#fff' : TINT || ['rgba(40,120,110,.55)', 'rgba(120,200,190,.4)', 'rgba(220,250,240,.35)'][k];
        ctx.beginPath(); ctx.moveTo(-16 + k * 4, top); for (let y = top; y <= bot; y += 6) { const q = (y - top) / (bot - top); ctx.lineTo(-16 + k * 4 - q * 14 + Math.sin(y * .2 + t * 6 + k) * 3, y); }
        for (let y = bot; y >= top; y -= 6) { const q = (y - top) / (bot - top); ctx.lineTo(16 - k * 4 + q * 14 + Math.sin(y * .2 - t * 6 + k) * 3, y); } ctx.closePath(); ctx.fill(); }
      if (DET()) { ctx.strokeStyle = 'rgba(240,255,250,.7)'; ctx.lineWidth = 1.1; for (let i = 0; i < 5; i++) { const q = ((t * .9 + i / 5) % 1), y = lerp(top, bot, q), w = 14 + q * 12; ctx.beginPath(); ctx.ellipse(0, y, w, 3, 0, Math.PI * .1, Math.PI * .9); ctx.stroke(); } } }
    ctx.rotate(sway + (hurt ? -.08 : 0)); if (mir) ctx.scale(-1, 1);
    // pose: where the arms go
    let rA = Math.PI / 2 + .5, lA = Math.PI / 2 - .6, rL = .5, tridA = -1.35, lean = 0, puff = 0, mouth = .1;
    if (pk === 'raise') { rA = lerp(rA, -1.6, sm(u * 1.4)); rL = -.2; tridA = lerp(-1.35, -1.75, u); lean = -.08 * u; mouth = .3; }
    else if (pk === 'thrust') { rA = -.3; rL = .1; tridA = -.15; lean = .12; mouth = .6; }
    else if (pk === 'inhale') { rA = Math.PI / 2 + .9; lA = Math.PI / 2 + .9; lean = -.12 * u; puff = u; mouth = 0; }
    else if (pk === 'exhale') { lA = -.4; rA = Math.PI / 2 + .3; lean = .1; mouth = 1; }
    else if (pk === 'point') { lA = lerp(lA, -2.4, sm(u)); mouth = .4; }
    else if (pk === 'sweep') { rA = lerp(-2.6, 1.2, u); tridA = lerp(-2.8, 1.4, u); lean = .1; mouth = .5; }
    else if (pk === 'throw') { rA = lerp(-2.2, .2, u); rL = .2; mouth = .7; }
    else if (pk === 'cast') { lA = -1.2 + Math.sin(t * 6) * .1; rA = -1.2 - Math.sin(t * 6) * .1; mouth = .5; }
    ctx.rotate(lean);
    const SY = -78 + br * .8; // the shoulders
    // the chlamys: the emperors' cloak of lapis, pinned at the shoulder, its gold tablion, its hem drifting in the water
    const ch = Math.sin(t * 1.1) * 4;
    cel(PB([-24, SY - 2, 20, SY - 4, 28, SY + 30, 30 + ch, -8, 10, -2 + ch * .5, -14, -6, -32 - ch * .6, -10, -30, SY + 30]), '#1E3A78', { d: 3.6, dark: '#0E1C40', lite: '#4A6AB8', w: 1.5, tex: () => {
      ctx.fillStyle = PAL.gold; ctx.fillRect(-27, SY + 34, 14, 16); ctx.fillStyle = '#C8343A'; ctx.fillRect(-24, SY + 37, 8, 10); // the tablion
      ctx.strokeStyle = PAL.gold; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-32 - ch * .6, -10); ctx.quadraticCurveTo(-10, -2, 30 + ch, -8); ctx.stroke();
      ctx.fillStyle = '#F2EEF6'; for (let i = 0; i < 12; i++) { circle(-30 + i * 5.2 + ch * (i / 12), -8 + Math.sin(i) * 1.4, .9); ctx.fill(); } } });
    // the far arm (left)
    const la = seg2(-12, SY + 4, lA, 18, lA - .5, 16, 9, 7.5, KG.robe, { col2: KG.skin, lit: KG.robeL, lit2: KG.skinL });
    ctx.fillStyle = C(KG.skin); ell(la.ex, la.ey, 4.6, 4); ctx.fill(); outline(1);
    // the robe of green glass below the loros, its skirts going into the water
    cel(PB([-25, SY + 1, 25, SY + 1, 23, SY + 22, 15, SY + 46, 22, -26, 14, -12, 0, -16, -14, -12, -22, -26, -16, SY + 46, -24, SY + 22]), KG.glass, { d: 3.4, dark: KG.glassD, lite: KG.glassL, w: 1.6, tex: () => {
      ctx.strokeStyle = 'rgba(230,255,248,.35)'; ctx.lineWidth = 1.2; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 7, SY + 20); ctx.quadraticCurveTo(i * 9, -40, i * 8 + Math.sin(t + i) * 2, -14); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(-20, SY + 6, 4, 50); } });
    // the loros: the great jewelled band of the emperors, gold set with pearls and red and blue stones, crossing the breast
    cel(PP([-21, SY + 3, -10, SY + 3, 14, SY + 38, 10, SY + 50, -2, SY + 50, -6, SY + 40]), PAL.gold, { d: 1.8, r: 1, dark: PAL.goldD, lite: PAL.goldL, w: 1.2, tex: () => {
      for (let i = 0; i < 9; i++) { const q = i / 8, x = lerp(-15, 8, q), y = lerp(SY + 6, SY + 44, q); ctx.fillStyle = i % 3 === 0 ? '#C8343A' : i % 3 === 1 ? '#2A4AB8' : '#F2EEF6'; circle(x, y, i % 3 === 2 ? 1.4 : 1.8); ctx.fill(); } } });
    cel(PB([-20, SY - 2, -8, SY - 6, 8, SY - 6, 20, SY - 2, 16, SY + 6, -16, SY + 6]), PAL.gold, { d: 1.4, dark: PAL.goldD, lite: PAL.goldL, w: 1.1, tex: () => { for (let i = 0; i < 7; i++) { ctx.fillStyle = '#F2EEF6'; circle(-14 + i * 4.6, SY + 1, 1.2); ctx.fill(); } } }); // the collar
    // the head: Oberon's, stern, long-nosed; the beard a fall of foam that drifts in the water
    const hx = 3, hy = SY - 14;
    for (let i = 0; i < 9; i++) { const bx = hx - 6 + i * 1.8, sw = Math.sin(t * 1.4 + i) * 3; ctx.strokeStyle = C(i % 2 ? KG.foam : '#C8E0DA'); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx, hy + 6); ctx.quadraticCurveTo(bx + sw, hy + 16, bx + sw * 1.6 - 2, hy + 26 + (i % 3) * 3); ctx.stroke(); }
    ctx.save(); ctx.translate(hx, hy); ctx.scale(1.55, 1.55);
    cel(PB([-6, -7, 1, -9, 6.8, -6, 8, 0, 7, 4, 3, 7, -3, 6.6, -6.4, 2]), KG.skin, { d: 2, r: 1, w: 1, dark: KG.skinD, lite: KG.skinL });
    if (DET()) { ctx.fillStyle = KG.skinD; poly([7, -2, 9.4, 2.4, 6.8, 3]); ctx.fill();
      ctx.fillStyle = '#F2FFF8'; ell(3.8, -1.6, 1.7, 1); ctx.fill(); ctx.fillStyle = e.w7eye || '#2A8AAA'; circle(4.4, -1.5, .8); ctx.fill();
      ctx.fillStyle = '#E8F4F0'; ctx.fillRect(1.6, -3.8, 5, 1.2); // the brow, white
      if (puff > .1) { ctx.fillStyle = 'rgba(200,240,230,.6)'; circle(4.6, 2.8, 2.4 * puff); ctx.fill(); }
      ctx.fillStyle = '#0A1A18'; ell(5.2, 4.6, 1.6, .3 + mouth * 1.4); ctx.fill(); }
    ctx.restore();
    // the crown: a closed dome of gold (the old emperors' kamelaukion), a cross of pearls on it, pendilia of pearls by the
    // cheeks, and the Pearl of Judgement in its brow, black, with the reversed Pattern turning in it
    const cy = hy - 12;
    cel(PB([-11, cy + 2, -12, cy - 8, -6, cy - 16, 3, cy - 18, 11, cy - 14, 13, cy - 6, 12, cy + 2]), PAL.gold, { d: 2, dark: PAL.goldD, lite: PAL.goldL, w: 1.3, tex: () => {
      ctx.fillStyle = PAL.goldD; ctx.fillRect(-12, cy - 2, 25, 3); for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#C8343A' : '#2E8A6A'; ctx.fillRect(-10 + i * 4, cy - 1.6, 2.4, 2.2); }
      ctx.fillStyle = '#F2EEF6'; for (let i = 0; i < 5; i++) { circle(-4 + i * 3.4, cy - 10 + Math.abs(i - 2) * 1.2, 1); ctx.fill(); } } });
    ctx.fillStyle = C(PAL.goldL); ctx.fillRect(2, cy - 26, 1.8, 9); ctx.fillRect(-.8, cy - 23, 7.4, 1.8); // the cross on top
    for (const px of [-10, 12]) for (let i = 0; i < 4; i++) { ctx.fillStyle = C('#F2EEF6'); circle(px + Math.sin(t * 1.6 + i) * .6, cy + 4 + i * 3.4, 1.4); ctx.fill(); if (!DET()) continue; ctx.strokeStyle = 'rgba(40,40,60,.5)'; ctx.lineWidth = .4; ctx.stroke(); }
    if (!e.w7nopearl) { ctx.fillStyle = C('#14121E'); circle(5, cy - 6, 3.6); ctx.fill(); outline(.9);
      if (DET()) { ctx.save(); ctx.beginPath(); ctx.arc(5, cy - 6, 3.2, 0, TAU); ctx.clip(); ctx.strokeStyle = '#5A84D8'; ctx.lineWidth = .5; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(5, cy - 6, .8 + i * .9, t * (i % 2 ? 2 : -2), t * (i % 2 ? 2 : -2) + 4.4); ctx.stroke(); } ctx.restore(); ctx.fillStyle = 'rgba(255,255,255,.8)'; circle(3.8, cy - 7.4, .7); ctx.fill(); } 
      const fl = e.w7flare || 0; if (fl > .02 && DET()) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const pul = .6 + .4 * Math.sin(t * 22); // the Pearl flares as he gathers himself: sharp short rays, not a halo
        ctx.strokeStyle = `rgba(150,190,255,${.9 * fl * pul})`; ctx.lineWidth = 1.2; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * 2, r0 = 4.4, r1 = 5 + fl * (i % 2 ? 6 : 10); ctx.beginPath(); ctx.moveTo(5 + Math.cos(a) * r0, cy - 6 + Math.sin(a) * r0); ctx.lineTo(5 + Math.cos(a) * r1, cy - 6 + Math.sin(a) * r1); ctx.stroke(); }
        ctx.fillStyle = `rgba(200,220,255,${.8 * fl})`; circle(5, cy - 6, 2.2 + fl); ctx.fill(); ctx.restore(); } }
    // the near arm and the trident
    const ra = seg2(14, SY + 4, rA, 18, rA - rL, 16, 9, 7.5, KG.robe, { col2: KG.skin, lit: KG.robeL, lit2: KG.skinL });
    if (!e.w7noTrident) { ctx.save(); ctx.translate(ra.ex, ra.ey); ctx.rotate(tridA); kingTrident(70, pk === 'raise' ? u : pk === 'thrust' ? 1 : 0); ctx.restore(); }
    ctx.fillStyle = C(KG.skin); ell(ra.ex, ra.ey, 4.6, 4); ctx.fill(); outline(1);
    ctx.restore();
  };
  W7.kingTrident = kingTrident; W7.KG = KG;

  // the attacks, rules and passages plug into world.js and zones.js, which load after this file: data_w7.js calls this once they exist
  const late = () => {
  // ======================================================================================================
  // ATTACKS: each with a wind-up you can read and an opening after it
  // ======================================================================================================
  const HZ = {}; W7.HZ = HZ;
  const reg = (kind, o) => { HZ[kind] = o; HAZARD_FX[kind] = { update: o.update || (() => {}), draw: o.draw || (() => {}) }; };
  const inEll = (x, y, cx, cy, r) => Math.hypot(x - cx, (y - cy) * 2.2) < r;
  const yClamp = (y) => clamp(y, FLOOR_TOP + 10, FLOOR_BOT - 2);
  const xClamp = (x) => clamp(x, leftWall() + 24, rightWall() - 24);
  const hitP = (dmg, fromX, big) => { if (P.state !== 'dead') playerDamage(dmg, fromX, big); };
  const tookHit = () => P.state === 'hurt' && P.inv > .7; // (playerDamage just landed)
  const fwdHit = (e, reach, dy = 18, z = 44) => { const fwd = (P.x - e.x) * e.facing; return fwd > -12 && fwd < reach + e.hw && Math.abs(P.y - e.y) < dy && P.z < z; };
  const tellCol = (k, a = 1) => `rgba(232,84,72,${(.14 + .3 * k) * a})`, tellLine = (k) => `rgba(255,150,120,${.5 + .4 * k})`;
  const bubbles = (x, y, z, n = 6, sp = 30) => { for (let i = 0; i < n; i++) W7.bub.push({ x: x + rand(-6, 6), y: y + rand(-3, 3), z: z + rand(0, 10), vx: rand(-sp, sp), vz: rand(30, 70), r: rand(1, 2.6), t: 0, max: rand(.9, 1.8) }); };
  W7.bub = []; W7.bubbles = bubbles;
  W7.U = { hitP, fwdHit, inEll, yClamp, xClamp, tellCol, tellLine, reg };
  // an attack that takes time: the enemy is held in the 'w7act' state while a controller hazard drives it each frame
  function act(e, name, dur, step, o = {}) {
    e.state = 'w7act'; e.w7a = name; e.w7k = 0; e.struck = false; e.walk = 0; e.vz = 0;
    const h = Object.assign({ kind: 'w7ctl', e, name, el: 0, dur, step, t: 99, max: 99, y: e.y }, o); hazards.push(h); return h;
  }
  function endAct(h) { const e = h.e; h.t = -1; e.w7k = null; if (e.w7a === h.name) e.w7a = null; }
  reg('w7ctl', {
    update(h, dt) { const e = h.e; if (h.done) { h.t = -1; return; }
      if (e.dead || e.state !== 'w7act' || e.w7a !== h.name) { endAct(h); h.done = 1; if (h.abort) h.abort(h, e); return; }
      h.el += dt; e.w7k = Math.min(1, h.el / h.dur); e.vz = 0;
      if (h.step(h, dt, e, e.w7k) || h.el >= h.dur) { endAct(h); h.done = 1; if (h.fin) h.fin(h, e); if (e.state === 'w7act') recover(e, h.rec ?? .7); } },
    draw(h, t) { if (h.draw) h.draw(h, t); },
    ups(h, list, t) { if (h.up) list.push([h.uy ?? h.e.y, () => h.up(h, t)]); },
  });
  W7.act = act;

  // ---------------- tells for ordinary foes' wind-ups: a mark on the floor for as long as the wind-up lasts ----------------
  const TELLS = {}; W7.TELLS = TELLS;
  const _wind = wind;
  wind = function (e, t) { _wind(e, t); if (!e.boss && TELLS[e.plan] && e.state === 'wind') { const T = TELLS[e.plan].fix ? TELLS[e.plan].fix(e) : {}; hazards.push({ kind: 'w7tell', e, plan: e.plan, T, t: e.t + .05, max: e.t + .05 }); e.w7T = T; } };
  reg('w7tell', {
    update(h) { if (h.e.dead || h.e.state !== 'wind' || h.e.plan !== h.plan) h.t = -1; },
    draw(h, t) { const k = 1 - Math.max(0, h.t) / h.max; ctx.save(); TELLS[h.plan].draw(h.e, h.T, k, t); ctx.restore(); },
  });
  const laneTell = (len, half = 7, off = 0) => ({ draw(e, T, k) { const x0 = e.facing > 0 ? e.x + off : e.x - off - len - e.hw; ctx.fillStyle = tellCol(k, .8); rrect(x0, e.y - half, len + e.hw, half * 2, half); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1; ctx.setLineDash([3, 3]); rrect(x0, e.y - half, len + e.hw, half * 2, half); ctx.stroke(); ctx.setLineDash([]); } });
  const spotTell = (r) => ({ fix: () => ({ x: xClamp(P.x), y: yClamp(P.y) }), draw(e, T, k) { ctx.fillStyle = tellCol(k); ell(T.x, T.y, r * (.4 + .6 * k), r / 2.2 * (.4 + .6 * k)); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 2; ell(T.x, T.y, r, r / 2.2); ctx.stroke(); } });

  // ---------------- DROWNED OF THE FLEET ----------------
  // THE BOATHOOK: driven out, and if it takes you, you are hauled in on it
  PLAN_FX.w7hook = (e) => { sfx('swing');
    act(e, 'hook', .8, (h, dt, e, k) => {
      if (k < .2) e.x += e.facing * 60 * dt;
      if (k >= .18 && !h.hit) { h.hit = 1; if (fwdHit(e, 74, 16)) { hitP(edmg(e), e.x, false); if (tookHit()) { h.hooked = 1; floatText(P.x, P.y, 80, 'HOOKED', '#C8E8DC', 13); } } }
      if (h.hooked && k > .3 && k < .65 && P.state === 'hurt') { const tx = e.x + e.facing * (e.hw + 22); P.vx = 0; P.x += (tx - P.x) * Math.min(1, dt * 7); }
      return false; }, { rec: .75 });
  };
  TELLS.w7hook = laneTell(78, 7);
  // THE CLUTCH: it lunges with both hands, and what it catches it drags down
  PLAN_FX.w7clutch = (e) => { sfx('growl');
    act(e, 'clutch', .9, (h, dt, e, k) => {
      if (k < .3) e.x += e.facing * 170 * dt;
      if (k > .1 && k < .35 && !h.hit && fwdHit(e, 30, 16)) { h.hit = 1; hitP(Math.round(edmg(e) * .7), e.x, false); if (tookHit()) { h.held = 1; P.t = .75; P.vx = 0; floatText(P.x, P.y, 80, 'DRAGGED UNDER', '#C8E8DC', 13); } }
      if (h.held && P.state === 'hurt') { P.vx = 0; P.x += ((e.x + e.facing * (e.hw + 8)) - P.x) * Math.min(1, dt * 10); if (Math.random() < .3) bubbles(P.x, P.y, 50, 1); }
      if (h.held && k > .88 && !h.tick) { h.tick = 1; P.inv = 0; hitP(Math.round(edmg(e) * .45), e.x, true); }
      return false; }, { rec: .95 });
  };
  TELLS.w7clutch = { draw(e, T, k) { const x = e.x + e.facing * 52; ctx.fillStyle = tellCol(k); ell(x, e.y, 34, 12); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.6; ell(x, e.y, 34, 12); ctx.stroke(); } };

  // ---------------- TORCHBEARER OF FAIELLA ----------------
  // GREEN FIRE: a ball of the torch's flame, flung; it goes slowly in the water, and drifts toward you, and can be put out
  PLAN_FX.w7flare = (e) => { sfx('shoot');
    hazards.push({ kind: 'w7fire', x: e.x + e.facing * 30, y: e.y, z: 64, vx: e.facing * 135, dmg: edmg(e), t: 3.4, max: 3.4, el: 0 });
    e.w7out = 1; setTimeout(() => { e.w7out = 0; }, 700);
    act(e, 'flare', .45, () => false, { rec: 1.0 });
  };
  TELLS.w7flare = { draw(e, T, k) { const x0 = e.x + e.facing * 30; ctx.strokeStyle = `rgba(150,255,190,${.25 + .4 * k})`; ctx.lineWidth = 1.2; ctx.setLineDash([2, 5]); ctx.beginPath(); ctx.moveTo(x0, e.y); ctx.lineTo(x0 + e.facing * 260, e.y); ctx.stroke(); ctx.setLineDash([]); } };
  reg('w7fire', {
    update(h, dt) { h.el += dt; h.x += h.vx * dt * (W7.slowAt ? W7.slowAt(h.x, h.y) : 1); h.y += clamp(P.y - h.y, -24 * dt, 24 * dt); h.z += (36 - h.z) * Math.min(1, dt * .8);
      if (Math.random() < dt * 20) parts.push({ x: h.x + rand(-4, 4), y: h.y, z: h.z + rand(-3, 3), vx: -h.vx * .1, vy: 0, vz: rand(20, 60), life: .5, max: .5, col: pick(['#9AF0B0', '#E8FFD8', '#2E8A5A']), size: rand(1.6, 3.2), shape: 'puff' });
      const m = P.move; if (m && P.state === 'atk' && P.t / m.dur >= m.h[0] && P.t / m.dur <= m.h[1] && Math.abs(P.y - h.y) < 22 && (h.x - P.x) * P.facing > -10 && (h.x - P.x) * P.facing < m.x1 + 16) { h.t = -1; bubbles(h.x, h.y, h.z, 10); floatText(h.x, h.y, h.z + 20, 'PUT OUT', '#C8F0E0', 11); sfx('hit-goo', .5); return; } // struck, it goes out in a burst of bubbles
      if (Math.abs(P.x - h.x) < 14 && Math.abs(P.y - h.y) < 13 && P.z < h.z + 12 && P.z + 60 > h.z - 6 && P.state !== 'dead' && P.state !== 'dodge' && P.inv <= 0) { hitP(h.dmg, h.x - h.vx, false); h.t = -1; burst(h.x, h.y, h.z, ['#9AF0B0', '#E8FFD8'], 10, 'spark'); }
      if (h.t <= 0 || h.x < camX - 40 || h.x > camX + VW + 40) { h.t = -1; bubbles(h.x, h.y, h.z, 5); } },
    draw(h) { ctx.fillStyle = 'rgba(20,60,40,.25)'; ell(h.x, h.y, 9, 3); ctx.fill(); },
    ups(h, list, t) { list.push([h.y + .3, () => onMain(() => { const y = h.y - h.z; glowM(h.x, y, 24, RGB.flame, .55); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { ctx.fillStyle = ['rgba(46,138,90,.8)', 'rgba(154,240,176,.85)', 'rgba(232,255,216,.95)'][k]; const r = 7 - k * 2 + Math.sin(t * 20 + k) * .8; ctx.beginPath(); ctx.ellipse(h.x - Math.sign(h.vx) * k, y, r * 1.3, r, 0, 0, TAU); ctx.fill(); } ctx.restore(); })]); },
    box(h, box) { box(h.x, h.y, h.z, 30, 30); },
  });
  // THE SWEEP: the torch swung low; it leaves the water burning where it went
  PLAN_FX.w7sweep = (e) => { sfx('whoosh');
    act(e, 'sweep', .65, (h, dt, e, k) => {
      if (k >= .35 && !h.hit) { h.hit = 1; if (fwdHit(e, 82, 22)) hitP(edmg(e), e.x, true); hazards.push({ kind: 'w7embers', x: e.x + e.facing * 54, y: e.y, r: 46, t: 2, max: 2, tick: 0, dmg: Math.max(2, Math.round(edmg(e) * .3)) }); }
      return false; }, { rec: .8 });
  };
  TELLS.w7sweep = { draw(e, T, k) { const x = e.x + e.facing * 50; ctx.fillStyle = tellCol(k, .8); ctx.beginPath(); ctx.ellipse(x, e.y, 50, 20, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.4; ctx.stroke(); } };
  reg('w7embers', {
    update(h, dt) { h.tick -= dt; if (h.t > .2 && h.tick <= 0 && inEll(P.x, P.y, h.x, h.y, h.r) && P.z < 10) { h.tick = .5; hitP(h.dmg, h.x, false); } },
    draw(h, t) { const a = Math.min(1, h.t / .5); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 9; i++) { const x = h.x + (hsh(i) - .5) * h.r * 1.6, y = h.y + (hsh(i + 4) - .5) * h.r * .6, f = 3 + Math.sin(t * 9 + i) * 1.5; ctx.fillStyle = `rgba(154,240,176,${.5 * a})`; ctx.beginPath(); ctx.ellipse(x, y - f, 2.4, f, 0, 0, TAU); ctx.fill(); } ctx.fillStyle = `rgba(80,200,140,${.18 * a})`; ell(h.x, h.y, h.r, h.r / 2.2); ctx.fill(); ctx.restore(); },
  });

  // ---------------- HALBERDIER OF MOIRE ----------------
  PLAN_FX.w7glaive = (e) => { sfx('swing');
    act(e, 'glaive', .62, (h, dt, e, k) => { if (k < .2) e.x += e.facing * 120 * dt; if (k >= .15 && !h.hit) { h.hit = 1; if (fwdHit(e, 102, 14)) hitP(edmg(e), e.x, false); } return false; }, { rec: .75 });
  };
  TELLS.w7glaive = laneTell(104, 6, 6);
  // THE REAPING: the long blade swept out across the lane, and back again
  PLAN_FX.w7reap = (e) => { sfx('whoosh');
    act(e, 'reap', .95, (h, dt, e, k) => {
      if (k >= .25 && !h.h1) { h.h1 = 1; if (fwdHit(e, 80, 26)) hitP(edmg(e), e.x, true); }
      if (k >= .7 && !h.h2) { h.h2 = 1; sfx('whoosh'); if (fwdHit(e, 80, 26)) { P.inv = Math.min(P.inv, 0); hitP(Math.round(edmg(e) * .7), e.x, false); } }
      return false; }, { rec: .9 });
  };
  TELLS.w7reap = { draw(e, T, k) { ctx.fillStyle = tellCol(k, .7); ctx.beginPath(); ctx.ellipse(e.x + e.facing * 30, e.y, 84, 26, 0, e.facing > 0 ? -Math.PI / 2 : Math.PI / 2, e.facing > 0 ? Math.PI / 2 : Math.PI * 1.5); ctx.closePath(); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.4; ctx.stroke(); } };

  // ---------------- SIREN OF THE STAIR ----------------
  // THE SONG: the notes come down the lane, and whoever is in it is drawn to her; when you get there, the tail
  PLAN_FX.w7song = (e) => {
    if (sfxOn && actx) [880, 988, 1175, 988, 880, 784].forEach((f, i) => tone(f, .28, 'sine', .035, 0, i * .26));
    act(e, 'song', 2.0, (h, dt, e, k) => {
      const inBand = Math.abs(P.y - e.y) < 26 && (P.x - e.x) * e.facing > -10 && (P.x - e.x) * e.facing < 300;
      if (k < .92 && inBand && !['dodge', 'dead'].includes(P.state)) { if (!h.charm) { h.charm = 1; floatText(P.x, P.y, 90, 'CHARMED', '#F2D0E8', 13); } P.x -= Math.sign(P.x - e.x) * 95 * dt; h.pulled = 1; }
      if (!h.lash && Math.abs(P.x - e.x) < e.hw + 26 && Math.abs(P.y - e.y) < 20 && P.z < 60) { h.lash = 1; sfx('slam', .5); hitP(edmg(e), e.x, true); }
      return false; }, { rec: 1.0,
      draw(h, t) { const e = h.e; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,220,240,.18)'; ctx.lineWidth = 1; for (let i = -2; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(e.x, e.y + i * 6); ctx.lineTo(e.x + e.facing * 300, e.y + i * 6); ctx.stroke(); } ctx.restore(); },
      up(h, t) { onMain(() => { const e = h.e; ctx.save(); for (let i = 0; i < 7; i++) { const q = (t * .7 + i / 7) % 1, x = e.x + e.facing * (16 + q * 280), y = e.y - e.z * (1 - q) - 30 * (1 - q) + Math.sin(q * 12 + i) * 4 - 8, a = Math.sin(q * Math.PI);
        ctx.fillStyle = `rgba(255,236,246,${.85 * a})`; ctx.fillRect(x - 2.4, y - 2, 4.8, 4); ctx.fillStyle = `rgba(120,40,70,${.8 * a})`; ctx.fillRect(x + 1.6, y - 9, .9, 8); } ctx.restore(); }); } }); // square notes, as the neumes are written
  };
  TELLS.w7song = laneTell(300, 24);
  // THE BUBBLE: a great bubble blown at you; it holds whatever it catches up in the water, then bursts. Strike it first
  PLAN_FX.w7bubble = (e) => { sfx('hit-goo', .6);
    hazards.push({ kind: 'w7bub', x: e.x + e.facing * 22, y: e.y, z: e.z, r: 16, el: 0, t: 5, max: 5, dmg: Math.round(edmg(e) * .65) });
    act(e, 'bubble', .4, () => false, { rec: 1.2 });
  };
  reg('w7bub', {
    update(h, dt) { h.el += dt;
      if (h.held) { h.held -= dt; P.state = 'hurt'; P.t = Math.max(P.t, .1); P.vx = 0; P.vz = 0; P.x += (h.x - P.x) * Math.min(1, dt * 8); P.y += (h.y - P.y) * Math.min(1, dt * 8); P.z += (54 - P.z) * Math.min(1, dt * 4); h.z = P.z + 22;
        if (h.held <= 0 || P.state === 'dead') { h.t = -1; P.inv = 0; hitP(h.dmg, h.x, true); bubbles(h.x, h.y, h.z, 18, 80); sfx('hit-goo'); } return; }
      h.x += clamp(P.x - h.x, -55 * dt, 55 * dt); h.y += clamp(P.y - h.y, -26 * dt, 26 * dt); h.z += (30 - h.z) * Math.min(1, dt * 1.2);
      const m = P.move; if (m && (P.state === 'atk' || P.state === 'air') && P.t / m.dur >= m.h[0] && P.t / m.dur <= m.h[1] && Math.abs(P.y - h.y) < 22 && (h.x - P.x) * P.facing > -14 && (h.x - P.x) * P.facing < m.x1 + 22) { h.t = -1; bubbles(h.x, h.y, h.z, 14, 70); sfx('hit-goo', .5); return; }
      if (Math.abs(P.x - h.x) < 18 && Math.abs(P.y - h.y) < 14 && P.z < h.z + 26 && P.state !== 'dodge' && P.state !== 'dead' && P.inv <= 0) { h.held = 1.0; h.t = 9; floatText(P.x, P.y, 90, 'BUBBLED', '#DCF4FF', 14); }
      if (h.t <= 0) { h.t = -1; bubbles(h.x, h.y, h.z, 10, 60); } },
    draw(h) { ctx.fillStyle = 'rgba(20,50,60,.2)'; ell(h.x, h.y, 14, 4); ctx.fill(); },
    ups(h, list, t) { list.push([h.y + .4, () => onMain(() => { const r = (h.held ? 30 : h.r) * (1 + Math.sin(t * 7) * .04), y = h.y - h.z - (h.held ? 26 : 0); ctx.save();
      ctx.fillStyle = 'rgba(200,240,255,.14)'; circle(h.x, y, r); ctx.fill(); ctx.strokeStyle = 'rgba(230,250,255,.85)'; ctx.lineWidth = 1.4; circle(h.x, y, r); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,200,240,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(h.x, y, r - 2.4, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.85)'; ell(h.x - r * .4, y - r * .45, r * .16, r * .1, -.6); ctx.fill(); ctx.restore(); })]); },
    box(h, box) { box(h.x, h.y, h.z, 50, 80); },
  });

  // ---------------- HIPPOCAMP RIDER ----------------
  // THE GALLOP: down your lane at full tilt, round at the far side, and back down the lane you are in then
  PLAN_FX.w7gallop = (e) => { sfx('whoosh');
    const y1 = e.w7T ? e.w7T.y : yClamp(P.y);
    act(e, 'gallop', 2.4, (h, dt, e, k) => {
      if (h.turn > 0) { h.turn -= dt; e.z += (40 - e.z) * Math.min(1, dt * 5); if (h.turn <= 0) { e.facing = -e.facing; h.lane = yClamp(P.y); h.hitp = 0; h.pass = 2; } return false; }
      if (!h.pass) { h.pass = 1; h.lane = y1; }
      e.y += (h.lane - e.y) * Math.min(1, dt * 6); e.x += e.facing * 380 * dt; e.z += (14 - e.z) * Math.min(1, dt * 6);
      if (Math.random() < .5) bubbles(e.x - e.facing * 30, e.y, e.z + 10, 1, 10);
      if (!h.hitp && Math.abs(P.x - e.x) < 28 && Math.abs(P.y - e.y) < 15 && P.z < 50) { h.hitp = 1; hitP(edmg(e), e.x, true); }
      const out = e.facing > 0 ? e.x > rightWall() - 20 : e.x < leftWall() + 20;
      if (out) { e.x = clamp(e.x, leftWall() + 20, rightWall() - 20); if (h.pass === 1) { h.turn = .6; } else return true; }
      return false; }, { rec: .9,
      draw(h) { if (!(h.turn > 0)) return; const k = 1 - h.turn / .6, y = yClamp(P.y); ctx.fillStyle = tellCol(k, .7); ctx.fillRect(leftWall(), y - 13, rightWall() - leftWall(), 26); ctx.strokeStyle = tellLine(k); ctx.setLineDash([4, 4]); ctx.strokeRect(leftWall(), y - 13, rightWall() - leftWall(), 26); ctx.setLineDash([]); } });
  };
  TELLS.w7gallop = { fix: () => ({ y: yClamp(P.y) }), draw(e, T, k) { const x0 = e.facing > 0 ? e.x : leftWall(), x1 = e.facing > 0 ? rightWall() : e.x; ctx.fillStyle = tellCol(k, .7); ctx.fillRect(x0, T.y - 13, x1 - x0, 26); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.strokeRect(x0, T.y - 13, x1 - x0, 26); ctx.setLineDash([]); } };
  // THE LANCE: up, over, and down lance-first on where you stood
  PLAN_FX.w7lance = (e) => { const T = e.w7T || { x: xClamp(P.x), y: yClamp(P.y) }; sfx('whoosh');
    const x0 = e.x, y0 = e.y, z0 = e.z;
    act(e, 'lance', 1.1, (h, dt, e, k) => {
      if (k < .4) { const u = sm(k / .4); e.x = lerp(x0, T.x - e.facing * 20, u); e.y = lerp(y0, T.y, u); e.z = lerp(z0, 120, u); }
      else if (k < .62) { const u = sm((k - .4) / .22); e.x = lerp(T.x - e.facing * 20, T.x, u); e.z = lerp(120, 8, u); }
      else if (!h.land) { h.land = 1; sfx('slam'); shakeMag = Math.max(shakeMag, 6); bubbles(e.x, e.y, 4, 14, 80); fx.push({ kind: 'ring', x: e.x, y: e.y, z: 2, t: .35, max: .35, r: 50, col: '#C8F0E8', flat: 1 }); if (inEll(P.x, P.y, e.x, e.y, 40) && P.z < 30) hitP(Math.round(edmg(e) * 1.1), e.x, true); }
      return false; }, { rec: 1.0 });
  };
  TELLS.w7lance = spotTell(40);

  // ---------------- BRONZE TRITON ----------------
  // THE CONCH: a blast of sound down the lane; under the water a sound is a blow, and it throws you back. You cannot jump
  // it: get out of its cone, or roll through it
  const coneHit = (e, x, y, R) => { const f = (x - e.x) * e.facing; if (f < 0 || f > R) return false; return Math.abs(y - e.y) < 12 + f * .14; };
  PLAN_FX.w7conch = (e) => {
    if (sfxOn && actx) { tone(98, .9, 'sawtooth', .07, 40); tone(147, .9, 'square', .04, 30); }
    act(e, 'conch', 1.0, (h, dt, e, k) => {
      if (k >= .1 && !h.hit) { h.hit = 1; shakeMag = Math.max(shakeMag, 6); if (coneHit(e, P.x, P.y, 230) && P.z < 120) { hitP(Math.round(edmg(e) * .55), e.x, true); if (tookHit()) { P.vx = e.facing * 480; P.vz = 160; } }
        for (const o of enemies) if (o !== e && !o.dead && !o.boss && coneHit(e, o.x, o.y, 230)) { o.x += e.facing * 30; } }
      return false; }, { rec: 1.0,
      draw(h, t) { const e = h.e, k = h.el / h.dur; if (k < .08) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const q = ((k - .08) * 2.2 + i * .22) % 1, f = q * 230, w = 12 + f * .14; ctx.strokeStyle = `rgba(220,255,240,${.55 * (1 - q)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(e.x + e.facing * f, e.y, 6, w, 0, 0, TAU); ctx.stroke(); } ctx.restore(); } });
  };
  TELLS.w7conch = { draw(e, T, k) { const f = e.facing; ctx.fillStyle = tellCol(k, .7); poly([e.x, e.y - 12, e.x + f * 230, e.y - 44, e.x + f * 230, e.y + 44, e.x, e.y + 12]); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.2; ctx.stroke(); } };
  // THE TRIDENT: three prongs, three lanes; between the prongs there is room for a man
  const PRONG = [-22, 0, 22];
  PLAN_FX.w7trident = (e) => { sfx('swing');
    act(e, 'trident', .7, (h, dt, e, k) => { if (k < .2) e.x += e.facing * 90 * dt;
      if (k >= .2 && !h.hit) { h.hit = 1; const f = (P.x - e.x) * e.facing; if (f > -8 && f < 92 + e.hw && P.z < 44 && PRONG.some(o => Math.abs(P.y - (e.y + o)) < 8)) hitP(edmg(e), e.x, false); }
      return false; }, { rec: .85 });
  };
  TELLS.w7trident = { draw(e, T, k) { for (const o of PRONG) { const x0 = e.facing > 0 ? e.x : e.x - 92 - e.hw, y = yClamp(e.y + o); ctx.fillStyle = tellCol(k, .9); rrect(x0, y - 6, 92 + e.hw, 12, 6); ctx.fill(); } } };

  // ---------------- KNIGHT IN THE GLASS BELL ----------------
  // THE BELL COMES DOWN: it rises (the water bears it up), drifts over you, and drops; the floor rings
  PLAN_FX.w7bellslam = (e) => { const T = e.w7T || { x: xClamp(P.x), y: yClamp(P.y) }; sfx('whoosh');
    const x0 = e.x, y0 = e.y;
    act(e, 'bellslam', 1.25, (h, dt, e, k) => {
      if (k < .48) { const u = sm(k / .48); e.x = lerp(x0, T.x, u); e.y = lerp(y0, T.y, u); e.z = Math.sin(u * Math.PI * .5) * 90; }
      else if (k < .6) e.z = 90 * (1 - sm((k - .48) / .12));
      else if (!h.land) { h.land = 1; e.z = 0; sfx('slam'); sfx('hit-crystal', .6); shakeMag = Math.max(shakeMag, 9); bubbles(e.x, e.y, 6, 16, 90); fx.push({ kind: 'ring', x: e.x, y: e.y, z: 2, t: .4, max: .4, r: 60, col: '#C8F0E8', flat: 1 });
        if (inEll(P.x, P.y, e.x, e.y, 46) && P.z < 26) hitP(Math.round(edmg(e) * 1.15), e.x, true);
        hazards.push({ kind: 'ring', x: e.x, y: e.y, r: 14, delay: 0, speed: 200, dmg: Math.round(edmg(e) * .55), t: 1.6, max: 1.6 }); }
      return false; }, { rec: 1.1, abort: (h, e) => { e.z = 0; } });
  };
  TELLS.w7bellslam = spotTell(46);
  // THE ROLL: it tips over onto its side and rolls down the lane like a barrel
  PLAN_FX.w7bellroll = (e) => { sfx('hit-crystal', .5);
    act(e, 'bellroll', 1.6, (h, dt, e, k) => {
      if (k > .1 && k < .9) { e.x += e.facing * 300 * dt; e.w7rollA = (e.w7rollA || 0) + e.facing * dt * 300 / 26; if (Math.random() < .4) dust(e.x, e.y, 1);
        if (!h.hitp && Math.abs(P.x - e.x) < 30 && Math.abs(P.y - e.y) < 16 && P.z < 40) { h.hitp = 1; hitP(Math.round(edmg(e) * 1.1), e.x, true); }
        if (e.x < leftWall() + 20 || e.x > rightWall() - 20) { e.x = clamp(e.x, leftWall() + 20, rightWall() - 20); h.el = Math.max(h.el, h.dur * .9); sfx('hit-crystal'); shakeMag = Math.max(shakeMag, 5); } }
      return false; }, { rec: 1.0, fin: (h, e) => { e.w7rollA = 0; }, abort: (h, e) => { e.w7rollA = 0; } });
  };
  TELLS.w7bellroll = { draw(e, T, k) { const x0 = e.facing > 0 ? e.x : leftWall(), x1 = e.facing > 0 ? rightWall() : e.x; ctx.fillStyle = tellCol(k, .7); ctx.fillRect(x0, e.y - 14, x1 - x0, 28); } };
  // out of its bell: a little knight with a sword
  PLAN_FX.w7stab = (e) => { sfx('swing'); act(e, 'stab', .45, (h, dt, e, k) => { if (k < .25) e.x += e.facing * 140 * dt; if (k >= .2 && !h.hit) { h.hit = 1; if (fwdHit(e, 52, 16)) hitP(edmg(e), e.x, false); } return false; }, { rec: .6 }); };
  TELLS.w7stab = laneTell(54, 6);

  // ---------------- THE SEA-BISHOP ----------------
  // THE CROZIER: swung all the way round him at the height of a man's shins: jump it
  PLAN_FX.w7crozier = (e) => { sfx('whoosh');
    act(e, 'crozier', .85, (h, dt, e, k) => { if (k > .28 && k < .58 && !h.hit && Math.hypot(P.x - e.x, (P.y - e.y) * 2.4) < 118 && P.z < 24) { h.hit = 1; hitP(edmg(e), e.x, true); } return false; }, { rec: .9 });
  };
  TELLS.w7crozier = { draw(e, T, k) { ctx.fillStyle = tellCol(k, .5); ell(e.x, e.y, 118, 118 / 2.4); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 2; ell(e.x, e.y, 118, 118 / 2.4); ctx.stroke(); } };
  // THE BLESSING: two fingers raised, and a cross of light laid on the floor: along his row, and down the file where you
  // stand. Be off both when it falls
  PLAN_FX.w7bless = (e) => { sfx('charge', 2);
    const px = xClamp(P.x), py = e.y;
    act(e, 'bless', 1.6, (h, dt, e, k) => {
      if (k >= .58 && !h.hit) { h.hit = 1; sfx('hit-crystal'); flashT = Math.max(flashT, .06); if ((Math.abs(P.y - py) < 15 || Math.abs(P.x - px) < 18) && P.z < 70) hitP(Math.round(edmg(e) * 1.05), e.x, true); }
      return false; }, { rec: .9,
      draw(h, t) { const k = h.el / h.dur, on = k >= .58 && k < .75, a = on ? 1 - (k - .58) / .17 : Math.min(1, k / .58); ctx.save();
        if (on) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,230,160,${.7 * a})`; } else ctx.fillStyle = tellCol(a, .9);
        ctx.fillRect(leftWall(), py - 14, rightWall() - leftWall(), 28); ctx.fillRect(px - 17, FLOOR_TOP, 34, FLOOR_BOT - FLOOR_TOP + 6);
        if (!on) { ctx.strokeStyle = tellLine(a); ctx.setLineDash([4, 4]); ctx.strokeRect(leftWall(), py - 14, rightWall() - leftWall(), 28); ctx.strokeRect(px - 17, FLOOR_TOP, 34, FLOOR_BOT - FLOOR_TOP + 6); ctx.setLineDash([]); }
        ctx.restore(); } });
  };
  // THE PLUNGE: up into the water like a stone let go of, over you, and down mitre-first
  PLAN_FX.w7plunge = (e) => { sfx('whoosh');
    const x0 = e.x, y0 = e.y;
    act(e, 'plunge', 1.7, (h, dt, e, k) => {
      if (k < .55) { const u = sm(Math.min(1, k / .4)); e.z = u * 150; h.tx = (h.tx ?? x0) + clamp(xClamp(P.x) - (h.tx ?? x0), -150 * dt, 150 * dt); h.ty = (h.ty ?? y0) + clamp(yClamp(P.y) - (h.ty ?? y0), -60 * dt, 60 * dt); e.x += (h.tx - e.x) * Math.min(1, dt * 3); e.y += (h.ty - e.y) * Math.min(1, dt * 3); }
      else if (k < .68) { e.z = 150 * (1 - sm((k - .55) / .13)); }
      else if (!h.land) { h.land = 1; e.z = 0; sfx('slam'); shakeMag = Math.max(shakeMag, 10); bubbles(e.x, e.y, 4, 20, 100); fx.push({ kind: 'ring', x: e.x, y: e.y, z: 2, t: .45, max: .45, r: 70, col: '#F2E6C8', flat: 1 });
        if (inEll(P.x, P.y, e.x, e.y, 50) && P.z < 30) hitP(Math.round(edmg(e) * 1.2), e.x, true); hazards.push({ kind: 'ring', x: e.x, y: e.y, r: 14, delay: .1, speed: 230, dmg: Math.round(edmg(e) * .6), t: 1.8, max: 1.8 }); }
      return false; }, { rec: 1.2, abort: (h, e) => { e.z = 0; },
      draw(h) { const k = h.el / h.dur; if (k < .15 || h.land) return; const q = cl01((k - .15) / .53), e = h.e; ctx.fillStyle = tellCol(q); ell(e.x, e.y, 50, 22); ctx.fill(); ctx.strokeStyle = tellLine(q); ctx.lineWidth = 2; ell(e.x, e.y, 50, 22); ctx.stroke(); } });
  };

  // ---------------- SEA-KNIGHT OF MOIRE ----------------
  // THE JOUST: the spear couched, he comes straight through where you stand and on past; get off his line, or over it
  const lineTell = (w) => ({ fix: (e) => { const dx = P.x - e.x, dy = P.y - e.y, L = Math.hypot(dx, dy * 2) || 1; return { x2: xClamp(P.x + dx / L * 150), y2: yClamp(P.y + dy / L * 40) }; },
    draw(e, T, k) { ctx.strokeStyle = tellCol(k, 1.6); ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(T.x2, T.y2); ctx.stroke(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]); } });
  PLAN_FX.w7joust = (e) => { const T = e.w7T || TELLS.w7joust.fix(e); sfx('whoosh');
    const x0 = e.x, y0 = e.y, z0 = e.z;
    act(e, 'joust', .95, (h, dt, e, k) => {
      if (k < .15) { e.x -= e.facing * 40 * dt; return false; }
      const u = cl01((k - .15) / .6); e.facing = Math.sign(T.x2 - x0) || e.facing; e.x = lerp(x0, T.x2, u); e.y = lerp(y0, T.y2, u); e.z = lerp(z0, 20, Math.min(1, u * 3));
      if (Math.random() < .5) W7.bubbles(e.x - e.facing * 20, e.y, e.z + 20, 1, 10);
      if (!h.hit && Math.abs(P.x - e.x) < 24 && Math.abs(P.y - e.y) < 14 && P.z < 56) { h.hit = 1; hitP(edmg(e), e.x, true); }
      return false; }, { rec: .9 });
  };
  TELLS.w7joust = lineTell(24);
  // THE CAST SPEAR: thrown high, it comes down point first on where you stood (and he draws another)
  PLAN_FX.w7hurl = (e) => { const T = e.w7T || { x: xClamp(P.x), y: yClamp(P.y) }; sfx('swing');
    act(e, 'hurl', .55, (h, dt, e, k) => { if (k >= .35 && !h.thrown) { h.thrown = 1; e.w7noSpear = 1.6; hazards.push({ kind: 'w7spear', x0: e.x + e.facing * 10, y0: e.y, z0: e.z + 30, x: T.x, y: T.y, el: 0, t: 2, max: 2, dmg: edmg(e) }); } return false; }, { rec: 1.0 });
  };
  TELLS.w7hurl = spotTell(30);
  reg('w7spear', {
    update(h, dt) { h.el += dt; if (h.el >= .9 && !h.down) { h.down = 1; sfx('hit-metal', .6); dust(h.x, h.y, 6); W7.bubbles(h.x, h.y, 4, 8, 50); if (inEll(P.x, P.y, h.x, h.y, 30) && P.z < 30) hitP(h.dmg, h.x, false); } if (h.el > 1.7) h.t = -1; },
    draw(h) { if (h.down) return; const k = cl01(h.el / .9); ctx.fillStyle = tellCol(k); ell(h.x, h.y, 30, 13); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.6; ell(h.x, h.y, 30, 13); ctx.stroke(); },
    ups(h, list) { list.push([h.y + .2, () => { const at = (u) => [lerp(h.x0, h.x, u), lerp(h.y0, h.y, u) - lerp(h.z0, 0, u) - Math.sin(u * Math.PI) * 120], u = cl01(h.el / .9), p1 = at(Math.min(.95, u)), p2 = at(Math.min(1, u + .05));
      const a = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]), [x, y] = h.down ? [h.x, h.y - 16] : at(u);
      ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.beginPath(); ctx.rect(-26, -1.1, 46, 2.2); ctx.fillStyle = C('#5A4430'); ctx.fill(); outline(.7); ctx.fillStyle = C('#D8E0E4'); poly([20, -2.6, 30, 0, 20, 2.6]); ctx.fill(); outline(.8); ctx.restore(); }]); },
    box(h, box) { box(h.x, h.y, 0, 80, 200); },
  });

  // ---------------- THE ZIPHIUS ----------------
  // THE STOOP: it folds its fins and comes down out of the water above, beak first, on the spot it marked
  PLAN_FX.w7swoop = (e) => { const T = e.w7T || { x: xClamp(P.x), y: yClamp(P.y) }; sfx('whoosh');
    const x0 = e.x, y0 = e.y, z0 = e.z;
    act(e, 'swoop', 1.2, (h, dt, e, k) => {
      if (k < .45) { const u = sm(k / .45); e.x = lerp(x0, T.x, u); e.y = lerp(y0, T.y, u); e.z = lerp(z0, 6, u * u); }
      else if (!h.land) { h.land = 1; sfx('slam', .6); shakeMag = Math.max(shakeMag, 5); W7.bubbles(e.x, e.y, 6, 12, 80); fx.push({ kind: 'ring', x: e.x, y: e.y, z: 2, t: .3, max: .3, r: 44, col: '#C8D8F0', flat: 1 }); if (inEll(P.x, P.y, e.x, e.y, 38) && P.z < 30) hitP(edmg(e), e.x, true); }
      else e.z = lerp(6, e.def.hover, sm((k - .55) / .45));
      return false; }, { rec: 1.0 });
  };
  TELLS.w7swoop = spotTell(38);
  // THE SNATCH: low down your lane; what it takes it carries up into the water, and lets fall
  PLAN_FX.w7snatch = (e) => { const ly = e.w7T ? e.w7T.y : yClamp(P.y); sfx('whoosh');
    act(e, 'snatch', 1.8, (h, dt, e, k) => {
      if (h.held) { h.held -= dt; P.state = 'hurt'; P.t = Math.max(P.t, .15); P.vx = 0; P.vz = 0; P.x = e.x + e.facing * 6; P.y = e.y; e.z += (110 - e.z) * Math.min(1, dt * 3); P.z = Math.max(0, e.z - 34); e.x += e.facing * 60 * dt;
        if (h.held <= 0) { h.done2 = 1; P.vz = -40; floatText(P.x, P.y, 90, 'LET FALL', '#C8D8F0', 13); return true; } return false; }
      if (h.done2) return true;
      e.y += (ly - e.y) * Math.min(1, dt * 6); e.z += (16 - e.z) * Math.min(1, dt * 6); if (k > .12) e.x += e.facing * 330 * dt;
      if (!h.hit && k > .12 && Math.abs(P.x - e.x) < 24 && Math.abs(P.y - e.y) < 13 && P.z < 44 && P.state !== 'dodge' && P.inv <= 0) { h.hit = 1; hitP(Math.round(edmg(e) * .8), e.x, false); if (tookHit()) { h.held = .8; floatText(P.x, P.y, 90, 'SEIZED', '#C8D8F0', 13); } }
      if (e.x < leftWall() + 16 || e.x > rightWall() - 16) { e.x = clamp(e.x, leftWall() + 16, rightWall() - 16); if (!h.held) return true; }
      return false; }, { rec: 1.0 });
  };
  TELLS.w7snatch = { fix: () => ({ y: yClamp(P.y) }), draw(e, T, k) { const x0 = e.facing > 0 ? e.x : leftWall(), x1 = e.facing > 0 ? rightWall() : e.x; ctx.fillStyle = tellCol(k, .7); ctx.fillRect(x0, T.y - 12, x1 - x0, 24); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.strokeRect(x0, T.y - 12, x1 - x0, 24); ctx.setLineDash([]); } };

  // ---------------- NIXIE OF THE STAIR ----------------
  // THE NIP: a dart in and a bite, quick as a fish, back out to the shoal
  PLAN_FX.w7nip = (e) => { const T = e.w7T || { x: xClamp(P.x), y: yClamp(P.y) }, tx = T.x, ty = T.y, x0 = e.x, y0 = e.y;
    act(e, 'nip', .6, (h, dt, e, k) => {
      if (k < .25) return false; const u = sm(cl01((k - .25) / .35)); e.x = lerp(x0, tx, u); e.y = lerp(y0, ty, u); e.z += (14 - e.z) * Math.min(1, dt * 8);
      if (!h.hit && Math.abs(P.x - e.x) < 16 && Math.abs(P.y - e.y) < 12 && P.z < 40) { h.hit = 1; sfx('hit-flesh', .4); hitP(edmg(e), e.x, false); }
      return false; }, { rec: .7 });
  };
  TELLS.w7nip = { fix: () => ({ x: xClamp(P.x), y: yClamp(P.y) }), draw(e, T, k) { ctx.strokeStyle = tellLine(k); ctx.lineWidth = 2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(T.x, T.y); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = tellCol(k); ell(T.x, T.y, 18, 8); ctx.fill(); } };
  // THE RING: it marks a ring round you and swims it, fast; the safe places are the middle and outside
  PLAN_FX.w7ring = (e) => { const cx = xClamp(P.x), cy = yClamp(P.y), a0 = Math.atan2((e.y - cy) * 2.4, e.x - cx);
    act(e, 'ring', 1.6, (h, dt, e, k) => {
      if (k < .3) return false; const a = a0 + (k - .3) / .7 * TAU * 1.5; e.x = cx + Math.cos(a) * 64; e.y = cy + Math.sin(a) * 64 / 2.4; e.z += (14 - e.z) * Math.min(1, dt * 8); e.facing = -Math.sin(a) > 0 ? 1 : -1;
      if (!h.hit && Math.abs(P.x - e.x) < 15 && Math.abs(P.y - e.y) < 11 && P.z < 40) { h.hit = 1; hitP(edmg(e), e.x, false); }
      return false; }, { rec: .8,
      draw(h) { const k = Math.min(1, h.el / (h.dur * .3)); ctx.strokeStyle = tellCol(k, 2); ctx.lineWidth = 14; ell(cx, cy, 64, 64 / 2.4); ctx.stroke(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]); ell(cx, cy, 64, 64 / 2.4); ctx.stroke(); ctx.setLineDash([]); } });
  };

  // ======================================================================================================
  // THE RULES OF THE PLACES
  // ======================================================================================================
  const busy = () => waveActive || enemies.some(e => !e.dead);
  const loose = (e) => ['hurt', 'down'].includes(e.state) || e.air || e.z > 6;

  // ---------------- FAIELLA-BIONIN: THE NINTH WAVE ----------------
  // Every so often a great swell passes over the stair. First the sea draws back down it (the undertow: the torches lean
  // down the stair, the silt streams after it), and then the ninth wave comes and drives everything up it. On the ground
  // you can lean into it; in the air, or knocked down, you go where it takes you; and whatever it takes into the steps is
  // dashed on them. The great mooring-stones set in the landing break it: in their lee the water is still.
  const STONES = [520, 860, 1220, 1560, 1900, 2200];
  W7.leeOf = (x, y) => { const m = mech; if (!m || m.kind !== 'w7surge' || !m.stones) return null; for (const s of m.stones) if (x < s.x - 6 && x > s.x - 78 && Math.abs(y - s.y) < 24) return s; return null; };
  MECH_FX.w7surge = {
    start(m) { m.phase = 'calm'; m.t = 6; m.stones = STONES.map((x, i) => ({ x, y: FLOOR_TOP + 30 + ((i * 37) % 60) })); m.k = 0; },
    update(m, dt) {
      if (stillT > 0) return;
      m.t -= dt;
      if (m.phase === 'calm') { if (!busy()) m.t = Math.max(m.t, 3); if (m.t <= 0) { m.phase = 'draw'; m.t = 1.7; floatText(P.x, P.y, 110, 'THE SEA DRAWS BACK...', '#C8F0E4', 15); if (sfxOn && actx) { tone(110, 1.6, 'sine', .08, -40); noise(1.6, .05, 400); } } }
      else if (m.phase === 'draw') { if (m.t <= 0) { m.phase = 'surge'; m.t = 2.3; floatText(P.x, P.y, 120, 'THE NINTH WAVE!', '#FFFFFF', 18); shakeMag = Math.max(shakeMag, 8); sfx('whoosh'); sfx('slam', .6); if (sfxOn && actx) noise(2, .09, 900); } }
      else if (m.t <= 0) { m.phase = 'calm'; m.t = rand(8, 10); }
      const tgt = m.phase === 'draw' ? -.55 : m.phase === 'surge' ? 1 : 0; m.k += (tgt - m.k) * Math.min(1, dt * 3); W7.surge = m.k;
      const k = m.k; if (Math.abs(k) < .05) return;
      const dir = k > 0 ? -1 : 1, f = Math.abs(k); // the undertow runs down the stair (to the right), the surge up it (to the left)
      if (!['dodge', 'dead'].includes(P.state) && !W7.leeOf(P.x, P.y)) P.x += dir * f * ((P.z > 4 || P.state === 'hurt' || P.state === 'down') ? 300 : k > 0 ? 150 : 70) * dt;
      for (const e of enemies) { if (e.dead || e.boss || e.state === 'enter' || W7.leeOf(e.x, e.y)) continue;
        const lo = loose(e); e.x += dir * f * (lo ? 330 : 110) * dt;
        const atWall = dir < 0 ? e.x < leftWall() + 10 : e.x > rightWall() - 10;
        if (atWall) { e.x = clamp(e.x, leftWall() + 10, rightWall() - 10); if (lo && f > .6 && !(e.w7dashT > 0)) { e.w7dashT = 1.2; const d = Math.round(10 + e.maxHp * .14); floatText(e.x, e.y, e.hh + 26, 'DASHED ON THE STEPS', '#E8F8F0', 13); strike(e, d, -dir, { dmg: d, kb: 200, launch: 260, power: 2, trump: 1 }); } } }
      for (const h of hazards) if (h.kind === 'w7fire') h.x += dir * f * 120 * dt;
      if (Math.random() < dt * 60 * f) parts.push({ x: camX + rand(0, VW), y: rand(FLOOR_TOP, FLOOR_BOT), z: rand(2, 90), vx: dir * rand(200, 420), vy: 0, vz: rand(-10, 10), life: .5, max: .5, col: pick(['rgba(220,240,230,.6)', 'rgba(200,190,150,.5)', 'rgba(255,255,255,.5)']), size: rand(1.4, 3), shape: 'streak', rot: 0, vr: 0 });
      for (const e of enemies) if (e.w7dashT > 0) e.w7dashT -= dt;
    },
    boxes(m, box) { for (const s of m.stones) if (Math.abs(s.x - camX - VW / 2) < VW) box(s.x, s.y, 0, 40, 60); },
    list(m, list, t) {
      for (const s of m.stones) { if (s.x < camX - 60 || s.x > camX + VW + 60) continue;
        list.push([s.y, () => drawStone(s, t, m)]);
        if (Math.abs(m.k) > .2) list.push([s.y - 1, () => onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(200,255,240,${.12 * Math.abs(m.k)})`; ctx.beginPath(); ctx.ellipse(s.x - 42, s.y, 38, 16, 0, 0, TAU); ctx.fill(); ctx.restore(); })]); }
      if (W7.bub.length) list.push([FLOOR_BOT + 10, () => onMain(drawBubbles)]);
    },
  };
  // a mooring-stone of the stair: a squat carved bollard, green with weed, a bronze ring and a length of chain on it
  function drawStone(s, t, m) {
    const sp = propSprite('w7stone', 70, 80, 35, 70, (th, sd) => {
      cel(PB([-15, 0, -17, -22, -12, -34, 0, -38, 12, -34, 17, -22, 15, 0]), '#7A8A84', { d: 3, dark: '#3E4E4A', lite: '#C8D6CE', w: 1.4, tex: () => {
        ctx.strokeStyle = 'rgba(30,50,46,.5)'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(-14, -24); ctx.quadraticCurveTo(0, -20, 14, -24); ctx.stroke();
        for (let i = 0; i < 14; i++) { ctx.fillStyle = i % 2 ? 'rgba(60,120,80,.55)' : 'rgba(120,60,70,.4)'; ell(-12 + hsh(i) * 24, -2 - hsh(i + 5) * 18, 2 + hsh(i + 2) * 2, 1.5); ctx.fill(); } } });
      ctx.strokeStyle = PAL.bronze; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, -18, 6, 0, TAU); ctx.stroke(); ctx.strokeStyle = PAL.verdL; ctx.lineWidth = .8; ctx.beginPath(); ctx.arc(0, -18, 6, Math.PI, Math.PI * 1.6); ctx.stroke();
      ctx.strokeStyle = '#3A4A48'; ctx.lineWidth = 2; ctx.setLineDash([3, 2]); ctx.beginPath(); ctx.moveTo(4, -13); ctx.quadraticCurveTo(14, -2, 26, -1); ctx.stroke(); ctx.setLineDash([]);
    }, { foot: 12, seed: 71, haze: .08 });
    propDraw(sp, s.x, s.y, { sh: 22 });
  }
  function drawBubbles() { ctx.save(); for (const b of W7.bub) { const a = 1 - b.t / b.max, y = b.y - b.z; ctx.strokeStyle = `rgba(230,250,248,${.75 * a})`; ctx.lineWidth = .8; circle(b.x, y, b.r); ctx.stroke(); ctx.fillStyle = `rgba(255,255,255,${.6 * a})`; circle(b.x - b.r * .35, y - b.r * .35, b.r * .3); ctx.fill(); } ctx.restore(); }
  W7.drawBubbles = drawBubbles;

  // ---------------- THE STREETS OF REBMA: THE DROWNED BELL, AND THE VENTS ----------------
  // The bell in the campanile tolls while there is fighting in the street; under the water the stroke goes through the
  // paving like a hammer, and whatever is standing on it is struck. Be off the ground when it lands (the water bears a
  // jump up a long way), or in one of the columns of bubbles that the vents in the street breathe: they lift whatever is
  // in them and hold it up, helpless, and a foe held up there is yours.
  const VENTS = [420, 700, 980, 1260, 1520];
  W7.inVent = (x, y) => { const m = mech; if (!m || m.kind !== 'w7toll' || !m.vents) return null; for (const v of m.vents) if (v.on > .3 && Math.abs(x - v.x) < 30 && Math.abs(y - v.y) < 15) return v; return null; };
  MECH_FX.w7toll = {
    start(m) { m.vents = VENTS.map((x, i) => ({ x, y: FLOOR_TOP + 26 + ((i * 43) % 64), on: 0, t: i * 1.3, period: 5.6 })); m.bellT = 8; m.warned = 0; W7.bellSwing = 0; W7.bellRing = 0; m.bish = null; m.bishDone = false; },
    update(m, dt) {
      if (stillT > 0) return;
      for (const v of m.vents) { v.t += dt; const ph = v.t % v.period, act = ph < 3.6; v.on += ((act ? 1 : 0) - v.on) * Math.min(1, dt * 4);
        if (v.on > .3 && Math.random() < dt * 40 * v.on) W7.bub.push({ x: v.x + rand(-22, 22), y: v.y + rand(-6, 6), z: rand(0, 20), vx: rand(-8, 8), vz: rand(70, 130), r: rand(1.2, 3.4), t: 0, max: rand(1, 2.2) }); }
      if (P.state !== 'dead' && W7.inVent(P.x, P.y)) { if (P.z < 66) P.vz = Math.max(P.vz, 150); else P.vz = Math.max(P.vz, 20); if (P.state === 'idle' || P.state === 'walk' || P.state === 'run') P.state = P.z > 2 ? 'jump' : P.state; P.jvx = P.jvx || 0; P.jvy = P.jvy || 0; }
      for (const e of enemies) if (!e.dead && !e.boss && e.type !== 'w7bishop' && e.def.move !== 'fly' && !['enter', 'w7act', 'dying'].includes(e.state) && W7.inVent(e.x, e.y)) { if (e.z < 56) { e.air = true; e.state = 'hurt'; e.t = .4; e.vz = Math.max(e.vz, 170); e.plan = null; if (!(e.w7ventMsg > 0)) { e.w7ventMsg = 2; floatText(e.x, e.y, e.hh + 20, 'BORNE UP', '#DCF4FF', 12); } } }
      for (const e of enemies) if (e.w7ventMsg > 0) e.w7ventMsg -= dt;
      // the bell
      if (busy()) m.bellT -= dt; else m.bellT = Math.max(m.bellT, 4);
      const warn = m.bellT < 1.8; W7.bellSwing = warn ? Math.sin((1.8 - m.bellT) * 7) * cl01((1.8 - m.bellT) / 1.2) : W7.bellSwing * Math.pow(.2, dt);
      W7.bellRing = Math.max(0, W7.bellRing - dt * .8); m.warnK = warn ? 1 - m.bellT / 1.8 : 0;
      if (warn && !m.warned) { m.warned = 1; floatText(P.x, P.y, 110, 'THE BELL IS SWINGING', '#E8F8C8', 15); if (sfxOn && actx) { tone(523, .4, 'sine', .05, 0, 0); tone(523, .4, 'sine', .05, 0, .9); } }
      if (m.bellT <= 0) { m.bellT = rand(9, 11); m.warned = 0; toll(m); }
      bishopUpdate(m, dt);
    },
    boxes(m, box) {},
    list(m, list, t) {
      list.push([FLOOR_TOP - 1, () => onMain(() => drawVents(m, t))]);
      if (W7.bub.length) list.push([FLOOR_BOT + 10, () => onMain(drawBubbles)]);
    },
  };
  function toll(m) {
    W7.bellRing = 1; shakeMag = Math.max(shakeMag, 12); flashT = Math.max(flashT, .08); zoom = Math.max(zoom, .03);
    if (sfxOn && actx) { tone(130, 2.4, 'sine', .14, -6); tone(196, 2, 'triangle', .07, -4); tone(392, 1.2, 'sine', .04, -8); }
    fx.push({ kind: 'ring', x: P.x, y: P.y, z: 2, t: .5, max: .5, r: 260, col: '#E8FFE8', flat: 1 });
    if (P.state !== 'dead' && P.z < 14 && !W7.inVent(P.x, P.y)) { playerDamage(Math.round(maxHp() * .24), P.x + P.facing, true); floatText(P.x, P.y, 90, 'THE BELL TOLLS', '#E8FFE8', 15); }
    for (const e of enemies) if (!e.dead && !e.boss && e.state !== 'enter' && e.z < 14 && !W7.inVent(e.x, e.y)) { const d = Math.round(8 + e.maxHp * (e.type === 'w7bishop' ? .05 : .12)); strike(e, d, Math.sign(e.x - P.x) || 1, { dmg: d, kb: 60, launch: 200, power: 1, trump: 1 }); }
  }
  function drawVents(m, t) {
    for (const v of m.vents) { if (v.x < camX - 60 || v.x > camX + VW + 60) continue;
      ctx.fillStyle = '#1A2426'; ell(v.x, v.y, 30, 10); ctx.fill(); ctx.strokeStyle = PAL.bronze; ctx.lineWidth = 2; ell(v.x, v.y, 30, 10); ctx.stroke(); ctx.strokeStyle = PAL.verdL; ctx.lineWidth = .6; ctx.beginPath(); ctx.ellipse(v.x, v.y, 30, 10, 0, Math.PI, Math.PI * 1.7); ctx.stroke();
      ctx.strokeStyle = '#0A1012'; ctx.lineWidth = 1.6; ctx.beginPath(); for (let i = -2; i <= 2; i++) { ctx.moveTo(v.x + i * 9, v.y - 7); ctx.lineTo(v.x + i * 9, v.y + 7); } ctx.stroke();
      if (v.on > .05) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(0, v.y - 120, 0, v.y); g.addColorStop(0, 'rgba(200,240,240,0)'); g.addColorStop(1, `rgba(200,240,240,${.22 * v.on})`); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(v.x - 26, v.y); ctx.lineTo(v.x - 32, v.y - 120); ctx.lineTo(v.x + 32, v.y - 120); ctx.lineTo(v.x + 26, v.y); ctx.closePath(); ctx.fill(); ctx.restore(); }
    }
    if (m.warnK > 0) { // the warning: the paving shivers with rings before the stroke
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const q = (t * 1.6 + i / 3) % 1; ctx.strokeStyle = `rgba(232,255,220,${.35 * m.warnK * (1 - q)})`; ctx.lineWidth = 2; ell(P.x, P.y, 30 + q * 220, (30 + q * 220) / 2.6); ctx.stroke(); } ctx.restore(); }
  }
  // the Sea-Bishop keeps the well that goes down to the Pattern; when the street is clear, he comes up out of it
  function bishopUpdate(m, dt) {
    if (stage.secret || m.bishDone) return;
    if (!m.bish) {
      if (!stage.waves.length || waveIdx < stage.waves.length || waveActive || zoneTrans) return;
      waveActive = true; lockX = clamp(camX, 0, Math.max(0, stage.len - VW)); $('#go').hidden = true;
      const e = spawnEnemy('w7bishop', 1); if (e.elite) { e.elite = false; e.guard = e.guardMax = 0; e.hp = e.maxHp = Math.round(e.maxHp / 1.5); }
      e.x = lockX + VW * .72; e.y = (FLOOR_TOP + FLOOR_BOT) / 2; e.facing = -1; if (typeof setEntrance === 'function') setEntrance(e, 'w7rise'); e.facing = -1;
      m.bish = { e, called: 0 };
      banner('The Sea-Bishop', 'HE KEEPS THE WELL OF THE PATTERN · NONE GOES DOWN TO IT BUT THE KING', 2.8);
      return;
    }
    const B = m.bish, e = B.e;
    if (!enemies.includes(e) || e.dead) { m.bishDone = true; m.bish = null; banner('The Well of the Pattern', 'THE WAY DOWN IS OPEN', 2.2); return; }
  }

  // ======================================================================================================
  // THE KING IN THE GLASS
  //   the King upon the Pattern   he walks the Pattern backward along the back of the hall; the trident's tines are
  //                               driven down whole lanes of the floor, he draws the sea in and breathes it out in a
  //                               ring, he lets fall the anchors of drowned ships on you, and close to him he sweeps
  //   the Maelstrom               he goes down into the Pattern and the hall becomes a whirlpool round it: the water
  //                               carries you round and in, wreckage goes round with it, spouts burst up under you, his
  //                               trident flies the round of the whirl, and the eye drains everything toward its teeth.
  //                               He can only be struck when he surfaces in the eye
  //   Through the Glass           the floor becomes a mirror and there are two of him: the King and his reflection. Only
  //                               one wears the Pearl of Judgement in his crown: strike that one. Strike the other and
  //                               it shatters, and the glass flies. They change places through the water. Both lay the
  //                               tines down, the mirror overhead cracks and drops its shards, the Pattern's line comes
  //                               up off the floor and sweeps round, and at the last the sea sends a breaker through
  // ======================================================================================================
  const KB = () => (typeof boss !== 'undefined' && boss && boss.def === BOSSES.w7king ? boss : null);
  let G = W7.G = { mode: 'none' };
  const arena = () => { const L = lockX !== null ? lockX : stage.len - VW; return { L: L + 14, R: L + VW - 14, cx: L + VW / 2, cy: (FLOOR_TOP + FLOOR_BOT) / 2 + 4 }; };
  const SLOTS = () => [FLOOR_TOP + 20, FLOOR_TOP + 47, FLOOR_TOP + 74, FLOOR_TOP + 101];
  const slotOf = (y) => { const S = SLOTS(); let b = 0; for (let i = 1; i < S.length; i++) if (Math.abs(y - S[i]) < Math.abs(y - S[b])) b = i; return b; };
  function initKing(e) {
    const A = arena(); e.w7init = 1; e.x = A.cx; e.y = FLOOR_TOP + 24; e.z = 30; e.facing = -1; e.state = 'w7act'; e.w7a = 'king'; e.plan = null; e.w7pose = { k: 'idle', u: 0 };
    G = W7.G = { mode: 'p1', t: 0, atkT: 2.2, cur: null, seq: 0, gx: e.x, gy: e.y, moveT: 2, sweepCd: 3, patRot: G.patRot || 0, patLit: .5, patA: 1, spin: 0, vuln: true, wreck: [], flip: 0, refl: null, swapT: 8, eye: 0 };
    banner(e.def.name, "OBERON'S REFLECTION · HE IS WALKING THE PATTERN BACKWARD", 2.6);
  }
  const fin = (e) => e.phase === 1 ? .665 : e.phase === 2 ? .335 : 0;
  W7.kingVuln = (e) => G.vuln && !G.trans;
  // ---------------- his attacks: each a little object that runs for a while and draws its own tells ----------------
  // a ring he is about to send out, shown before it goes: the floor round him shivers with its path, dashed rings running
  // out ahead of it, the water drawing in to the centre, and the middle filling as the moment comes; then the ring itself
  reg('w7ringwarn', {
    update(h, dt) { h.el += dt; if (Math.random() < dt * 30) bubbles(h.x + rand(-60, 60), h.y + rand(-14, 14), 4, 1, 10);
      if (!h.s) { h.s = 1; if (sfxOn && actx) { tone(220, h.dur, 'sine', .05, 160); } }
      if (h.el >= h.dur) { h.t = -1; hazards.push({ kind: 'ring', x: h.x, y: h.y, r: 20, delay: 0, speed: h.speed, dmg: h.dmg, t: 9, max: 9 }); sfx('slam', .6); shakeMag = Math.max(shakeMag, 6); } },
    draw(h, t) { const k = cl01(h.el / h.dur); ctx.save();
      for (let i = 0; i < 3; i++) { const q = ((h.el * 1.2 + i / 3) % 1), r = 20 + q * 300; ctx.strokeStyle = `rgba(255,150,120,${(.25 + .4 * k) * (1 - q)})`; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ell(h.x, h.y, r, r / 2.2); ctx.stroke(); }
      ctx.setLineDash([]); ctx.fillStyle = tellCol(k); ell(h.x, h.y, 20 + 30 * k, (20 + 30 * k) / 2.2); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 2.4; ell(h.x, h.y, 52, 52 / 2.2); ctx.stroke(); ctx.restore(); },
  });
  const warnRing = (x, y, dur, speed, dmg) => hazards.push({ kind: 'w7ringwarn', x, y, el: 0, dur, speed, dmg, t: 99, max: 99 });
  const flare = (e, v) => { e.w7flare = Math.max(e.w7flare || 0, v); };
  const KA = {};
  KA.tines = (e, both) => { // lanes of the floor lit, then the tines driven down them as spears of water, wall to wall
    const S = SLOTS(), ps = slotOf(P.y);
    let lanes;
    if (both) { const free = [0, 1, 2, 3].filter(i => i !== ps); const skip = pick(free); lanes = [0, 1, 2, 3].filter(i => i !== skip).map(i => S[i]); }
    else { const other = pick([0, 1, 2, 3].filter(i => Math.abs(i - ps) >= 2)); lanes = [S[ps], S[other]]; }
    return { k: 'raise', dur: 1.75, fire: 1.1, lanes, hit: false,
      step(o, dt, T) { e.w7pose = T < o.fire ? { k: 'raise', u: T / o.fire } : { k: 'thrust', u: 1 }; if (T < o.fire) flare(e, T / o.fire); if (!o.s) { o.s = 1; if (sfxOn && actx) tone(392, o.fire, 'triangle', .03, 200); }
        if (T >= o.fire && !o.fired) { o.fired = 1; sfx('shoot'); sfx('whoosh'); shakeMag = Math.max(shakeMag, 7); }
        if (o.fired && !o.hit) { const A = arena(), q = (T - o.fire) / .35; if (q <= 1) { const reachL = e.x - (e.x - A.L) * q, reachR = e.x + (A.R - e.x) * q;
          if (P.x > reachL - 10 && P.x < reachR + 10 && o.lanes.some(y => Math.abs(P.y - y) < 13) && P.z < 46) { o.hit = true; hitP(edmg(e), e.x, true); } } } },
      draw(o, T) { const A = arena(); for (const y of o.lanes) { if (T < o.fire) { const k = T / o.fire; ctx.fillStyle = tellCol(k, .8); ctx.fillRect(A.L, y - 13, A.R - A.L, 26); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1; ctx.setLineDash([5, 4]); ctx.strokeRect(A.L, y - 13, A.R - A.L, 26); ctx.setLineDash([]); }
        else { const q = cl01((T - o.fire) / .35), a = 1 - cl01((T - o.fire - .35) / .3), xl = e.x - (e.x - A.L) * q, xr = e.x + (A.R - e.x) * q; ctx.save(); ctx.globalCompositeOperation = 'lighter';
          const g = ctx.createLinearGradient(0, y - 10, 0, y + 10); g.addColorStop(0, 'rgba(200,250,240,0)'); g.addColorStop(.5, `rgba(235,255,250,${.85 * a})`); g.addColorStop(1, 'rgba(200,250,240,0)'); ctx.fillStyle = g; ctx.fillRect(xl, y - 10, xr - xl, 20);
          for (const x of [xl, xr]) { ctx.fillStyle = `rgba(255,255,255,${a})`; ell(x, y, 10, 6); ctx.fill(); } ctx.restore(); } } },
      up(o, T) { if (T < o.fire || T > o.fire + .6) return; const A = arena(), q = cl01((T - o.fire) / .35); for (const y of o.lanes) for (const s of [-1, 1]) { const x = e.x + s * (s < 0 ? e.x - A.L : A.R - e.x) * q; ctx.save(); ctx.translate(x, y - 22); ctx.scale(s, 1); W7.kingTrident(0, 0); ctx.restore(); } } };
  };
  KA.undertow = (e) => ({ dur: 2.7, step(o, dt, T) {
      if (T < 1.55) { e.w7pose = { k: 'inhale', u: T / 1.55 }; if (!['dodge', 'dead'].includes(P.state)) { const dx = e.x - P.x, dy = e.y - P.y; P.x += Math.sign(dx) * Math.min(Math.abs(dx), 76 * dt); P.y += Math.sign(dy) * Math.min(Math.abs(dy), 30 * dt); } flare(e, T / 1.55); if (!o.s) { o.s = 1; if (sfxOn && actx) noise(1.5, .07, 300); for (let i = 0; i < (e.phase >= 2 ? 2 : 1); i++) warnRing(e.x, e.y, 1.55 + i * .4, 250, Math.round(edmg(e) * .8)); } }
      else { e.w7pose = { k: 'exhale', u: 1 }; if (!o.blown) { o.blown = 1; sfx('whoosh'); sfx('slam', .7); shakeMag = Math.max(shakeMag, 9);
        if (Math.hypot(P.x - e.x, (P.y - e.y) * 2.2) < 74 && P.z < 60) { hitP(edmg(e), e.x, true); if (tookHit()) P.vx = Math.sign(P.x - e.x || 1) * 420; }
        bubbles(e.x, e.y, 60, 30, 160); } } },
    draw(o, T) { if (T >= 1.55) return; const k = T / 1.55; ctx.fillStyle = tellCol(k, .5); ell(e.x, e.y, 74, 74 / 2.2); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 2; ell(e.x, e.y, 74, 74 / 2.2); ctx.stroke();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + T, q = 1 - ((T * 1.4 + hsh(i)) % 1), r = 60 + q * 260; ctx.strokeStyle = `rgba(210,250,240,${.35 * (1 - q) + .1})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r * .35); ctx.lineTo(e.x + Math.cos(a) * (r - 24), e.y + Math.sin(a) * (r - 24) * .35); ctx.stroke(); } ctx.restore(); } });
  KA.anchors = (e) => { const n = e.hp < e.maxHp * .8 ? 4 : 3; return { dur: 2.2, step(o, dt, T) { e.w7pose = { k: 'point', u: Math.min(1, T * 2) }; flare(e, 1 - T / 2.2);
      for (let i = 0; i < n; i++) if (T >= i * .35 && !(o['a' + i])) { o['a' + i] = 1; if (sfxOn && actx) { tone(140, .25, 'square', .03, -40); tone(110, .3, 'square', .03, -30, .12); } const A = arena(); hazards.push({ kind: 'w7anchor', x: clamp(P.x + (i ? rand(-90, 90) : 0), A.L + 20, A.R - 20), y: clamp(P.y + (i ? rand(-34, 34) : 0), FLOOR_TOP + 10, FLOOR_BOT - 4), el: 0, t: 3, max: 3, dmg: Math.round(edmg(e) * .9), rot: rand(-.4, .4) }); } } }; };
  KA.sweep = (e) => ({ dur: 1.5, step(o, dt, T) { e.w7pose = T < 1 ? { k: 'raise', u: T * .6 } : { k: 'sweep', u: cl01((T - 1) / .3) }; if (T < 1) flare(e, T); if (!o.s0) { o.s0 = 1; if (sfxOn && actx) tone(330, .9, 'sawtooth', .03, 200); }
      if (T >= 1.05 && T < 1.3 && !o.hit && Math.hypot(P.x - e.x, (P.y - e.y) * 2.4) < 124 && P.z < 30) { o.hit = 1; hitP(Math.round(edmg(e) * 1.1), e.x, true); } if (T >= 1.05 && !o.s) { o.s = 1; sfx('whoosh'); } },
    draw(o, T) { if (T > 1.3) return; const k = Math.min(1, T / 1); ctx.fillStyle = tellCol(k, .55); ell(e.x, e.y, 124, 124 / 2.4); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 2; ell(e.x, e.y, 124, 124 / 2.4); ctx.stroke();
      if (k < 1) { const r = 124 * (1.7 - .7 * k); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.4; ctx.setLineDash([6, 5]); ell(e.x, e.y, r, r / 2.4); ctx.stroke(); ctx.setLineDash([]); } } });
  reg('w7anchor', { // a drowned ship's anchor, let fall: it sinks slowly (the water bears it), its shadow marks where
    update(h, dt) { h.el += dt; if (h.el >= 1.25 && !h.down) { h.down = 1; sfx('slam'); shakeMag = Math.max(shakeMag, 6); bubbles(h.x, h.y, 4, 10, 70); dust(h.x, h.y, 8); if (inEll(P.x, P.y, h.x, h.y, 34) && P.z < 30) hitP(h.dmg, h.x, true); } if (h.el > 2.6) h.t = -1; },
    draw(h) { if (h.down) return; const k = cl01(h.el / 1.25); ctx.fillStyle = tellCol(k); ell(h.x, h.y, 34 * (.4 + .6 * k), 15 * (.4 + .6 * k)); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.8; ell(h.x, h.y, 34, 15); ctx.stroke(); },
    ups(h, list, t) { list.push([h.y + .2, () => { const z = h.down ? 0 : 300 * Math.pow(1 - cl01(h.el / 1.25), 1.5), a = h.el > 2.2 ? 1 - (h.el - 2.2) / .4 : 1; ctx.save(); ctx.globalAlpha = a; ctx.translate(h.x, h.y - z); ctx.rotate(h.down ? h.rot : Math.sin(h.el * 3) * .15); anchorArt(); ctx.restore(); }]); },
    box(h, box) { box(h.x, h.y, 0, 50, 320); },
  });
  function anchorArt() {
    ctx.strokeStyle = C(INK); ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -46); ctx.lineTo(0, -6); ctx.moveTo(-18, -16); ctx.quadraticCurveTo(-16, 0, 0, -2); ctx.quadraticCurveTo(16, 0, 18, -16); ctx.moveTo(-10, -38); ctx.lineTo(10, -38); ctx.stroke();
    ctx.strokeStyle = C('#4A5452'); ctx.lineWidth = 3.6; ctx.stroke(); if (DET()) { ctx.strokeStyle = '#9AA8A4'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-1, -44); ctx.lineTo(-1, -8); ctx.stroke(); }
    ctx.fillStyle = C('#4A5452'); for (const s of [-1, 1]) { poly([s * 18, -16, s * 23, -22, s * 14, -19]); ctx.fill(); }
    ctx.strokeStyle = C('#3A4442'); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, -50, 4.4, 0, TAU); ctx.stroke();
    if (DET()) { ctx.strokeStyle = 'rgba(60,40,30,.6)'; ctx.lineWidth = 2; ctx.setLineDash([3, 2]); ctx.beginPath(); ctx.moveTo(0, -54); ctx.lineTo(4, -120); ctx.stroke(); ctx.setLineDash([]); for (let i = 0; i < 5; i++) { ctx.fillStyle = 'rgba(120,60,70,.6)'; ell(-6 + hsh(i) * 12, -10 - hsh(i + 2) * 30, 2, 1.4); ctx.fill(); } }
  }
  // ---------------- the Maelstrom ----------------
  KA.spout = (e) => ({ dur: 2.6, step(o, dt, T) { e.w7pose = { k: 'cast', u: 1 }; flare(e, 1);
      for (let i = 0; i < 3; i++) if (T >= i * .55 && !o['s' + i]) { o['s' + i] = 1; hazards.push({ kind: 'w7spout', x: xClamp(P.x), y: yClamp(P.y), el: 0, t: 2, max: 2, dmg: Math.round(edmg(e) * .9) }); } } });
  reg('w7spout', {
    update(h, dt) { h.el += dt; if (!h.s) { h.s = 1; if (sfxOn && actx) tone(70, .9, 'sine', .07, 50); } if (!h.up && Math.random() < dt * 30) bubbles(h.x + rand(-26, 26), h.y + rand(-8, 8), 2, 1, 5); if (h.el >= .95 && !h.up) { h.up = 1; sfx('whoosh'); bubbles(h.x, h.y, 10, 20, 50); } if (h.up && !h.hit && h.el < 1.4 && inEll(P.x, P.y, h.x, h.y, 34) && P.z < 220) { h.hit = 1; hitP(h.dmg, h.x, true); if (tookHit()) P.vz = 300; } if (h.el > 1.6) h.t = -1; },
    draw(h, t) { const k = cl01(h.el / .95); if (!h.up) { ctx.fillStyle = tellCol(k); ell(h.x, h.y, 34, 15); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 2; ell(h.x, h.y, 34 * (1.3 - .3 * k), 15 * (1.3 - .3 * k)); ctx.stroke(); } },
    ups(h, list, t) { if (!h.up) return; list.push([h.y + .3, () => onMain(() => { const a = 1 - cl01((h.el - 1.3) / .3), H = 240 * sm((h.el - .95) / .15); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { const w = 26 - k * 7; const g = ctx.createLinearGradient(0, h.y - H, 0, h.y); g.addColorStop(0, 'rgba(220,255,250,0)'); g.addColorStop(.3, `rgba(200,250,240,${.35 * a})`); g.addColorStop(1, `rgba(240,255,252,${.7 * a})`); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(h.x - w, h.y); ctx.quadraticCurveTo(h.x - w * .6 + Math.sin(t * 20 + k) * 4, h.y - H * .5, h.x - w * .3, h.y - H); ctx.lineTo(h.x + w * .3, h.y - H); ctx.quadraticCurveTo(h.x + w * .6 - Math.sin(t * 18 + k) * 4, h.y - H * .5, h.x + w, h.y); ctx.closePath(); ctx.fill(); } ctx.restore(); })]); },
    box(h, box) { box(h.x, h.y, 0, 50, 260); },
  });
  const orbitPt = (a, rr = 1) => { const A = arena(), rx = (A.R - A.L) * .42 * rr, ry = 42 * rr; return [A.cx + Math.cos(a) * rx, A.cy + Math.sin(a) * ry]; };
  KA.whirl = (e) => ({ dur: 4.2, step(o, dt, T) {
      if (T < .9) { e.w7pose = { k: 'raise', u: T / .9 }; G.sub = .45; flare(e, T / .9); if (!o.s) { o.s = 1; if (sfxOn && actx) tone(260, .8, 'triangle', .04, 300); } return; }
      if (!o.thrown) { o.thrown = 1; o.a = Math.atan2((P.y - arena().cy) / 42, (P.x - arena().cx) / ((arena().R - arena().L) * .42)) - 1.2; o.out = 0; sfx('whoosh'); e.w7noTrident = 1; }
      e.w7pose = { k: 'cast', u: 1 }; G.sub = .3;
      const q = T - .9; o.out = Math.min(1, q * 3); if (q < 2.6) o.a += dt * 2.5; const back = q > 2.6 ? cl01((q - 2.6) / .5) : 0;
      let [x, y] = orbitPt(o.a, o.out); const A = arena(); x = lerp(x, A.cx, back); y = lerp(y, A.cy, back); o.x = x; o.y = y;
      if (!o.hit && Math.abs(P.x - x) < 24 && Math.abs(P.y - y) < 12 && P.z < 42) { o.hit = 1; hitP(edmg(e), x, true); }
      if (back >= 1) e.w7noTrident = 0; },
    end() { e.w7noTrident = 0; },
    draw(o, T) { if (T < .9) { const k = T / .9, A = arena(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ell(A.cx, A.cy, (A.R - A.L) * .42, 42); ctx.stroke(); ctx.setLineDash([]); } },
    up(o, T) { if (!o.thrown || o.x == null) return; ctx.save(); ctx.translate(o.x, o.y - 26); ctx.rotate(T * 14); W7.kingTrident(10, .5); ctx.restore(); } });
  KA.drain = (e) => ({ dur: 3.4, step(o, dt, T) { e.w7pose = { k: 'cast', u: 1 }; if (T < 1) { flare(e, T); if (Math.random() < dt * 40) { const a = rand(0, TAU), A = arena(); bubbles(A.cx + Math.cos(a) * 140, A.cy + Math.sin(a) * 40, 4, 1, 0); } } if (!o.s) { o.s = 1; if (sfxOn && actx) noise(1, .06, 200); } G.eye = T < 1 ? T : T > 3.1 ? (3.4 - T) / .3 : 1;
      if (T >= 1 && T < 3.1) { const A = arena(); if (!['dodge', 'dead'].includes(P.state)) { const dx = A.cx - P.x, dy = A.cy - P.y; P.x += Math.sign(dx) * Math.min(Math.abs(dx), 95 * dt); P.y += Math.sign(dy) * Math.min(Math.abs(dy), 40 * dt); }
        o.tick = (o.tick || 0) - dt; if (o.tick <= 0 && inEll(P.x, P.y, A.cx, A.cy, 66) && P.z < 40) { o.tick = .45; hitP(Math.round(edmg(e) * .5), A.cx, false); } } },
    draw(o, T) { const A = arena(), k = Math.min(1, T); ctx.fillStyle = tellCol(k, .7); ell(A.cx, A.cy, 66, 30); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 2; ell(A.cx, A.cy, 66, 30); ctx.stroke(); } });
  // ---------------- Through the Glass ----------------
  KA.shards = (e) => ({ dur: 2.4, step(o, dt, T) { e.w7pose = { k: 'point', u: 1 }; flare(e, 1 - T / 2.4);
      if (!o.line) { const a = rand(0, Math.PI); o.line = [...Array(6)].map((_, i) => ({ x: xClamp(P.x + Math.cos(a) * (i - 2.5) * 52), y: yClamp(P.y + Math.sin(a) * (i - 2.5) * 16) })); sfx('hit-crystal'); }
      for (let i = 0; i < 6; i++) if (T >= i * .16 && !o['f' + i]) { o['f' + i] = 1; hazards.push({ kind: 'w7shard', x: o.line[i].x, y: o.line[i].y, el: 0, t: 2, max: 2, dmg: Math.round(edmg(e) * .8), rot: rand(-.5, .5) }); } } });
  reg('w7shard', {
    update(h, dt) { h.el += dt; if (h.el >= 1.05 && !h.down) { h.down = 1; sfx('hit-crystal'); burst(h.x, h.y, 6, ['#E8F8FF', '#BEEAD8', '#FFFFFF'], 10, 'crystal', 0); if (inEll(P.x, P.y, h.x, h.y, 26) && P.z < 30) hitP(h.dmg, h.x, false); } if (h.el > 1.5) h.t = -1; },
    draw(h) { if (h.down) return; const k = cl01(h.el / 1.05); ctx.fillStyle = tellCol(k); ell(h.x, h.y, 26, 11); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.6; ell(h.x, h.y, 26, 11); ctx.stroke(); },
    ups(h, list) { if (h.down) return; list.push([h.y + .2, () => onMain(() => { const z = 320 * Math.pow(1 - cl01(h.el / 1.05), 1.3); ctx.save(); ctx.translate(h.x, h.y - z); ctx.rotate(h.rot); ctx.fillStyle = 'rgba(220,250,255,.75)'; poly([-5, -26, 6, -18, 3, 4, -3, 0]); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); })]); },
    box(h, box) { box(h.x, h.y, 0, 40, 340); },
  });
  KA.unwind = (e) => { const two = e.hp < e.maxHp * .2, dir = Math.random() < .5 ? -1 : 1, a0 = rand(0, TAU); return { dur: 3.8, step(o, dt, T) { e.w7pose = { k: 'cast', u: 1 }; if (T < .95) flare(e, T / .95); if (!o.s) { o.s = 1; if (sfxOn && actx) tone(180, .95, 'sawtooth', .03, 120); }
      if (T < .95) return; const A = arena(), a = a0 + dir * (T - .95) / 2.6 * TAU, pa = Math.atan2((P.y - A.cy) * 3.2, P.x - A.cx), d = Math.hypot(P.x - A.cx, (P.y - A.cy) * 3.2); o.a = a;
      if (T < 3.55 && !o.hit && d > 24 && d < 310 && P.z < 20) for (const arm of two ? [a, a + Math.PI] : [a]) { const diff = Math.abs(((pa - arm) % TAU + TAU * 1.5) % TAU - Math.PI); if (diff < .16) { o.hit = 1; hitP(Math.round(edmg(e) * .9), A.cx, true); break; } } },
    draw(o, T) { const A = arena(); const arms = (a, al, col) => { for (const arm of two ? [a, a + Math.PI] : [a]) { ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(A.cx + Math.cos(arm) * 24, A.cy + Math.sin(arm) * 24 / 3.2); ctx.lineTo(A.cx + Math.cos(arm) * 310, A.cy + Math.sin(arm) * 310 / 3.2); ctx.globalAlpha = al; ctx.stroke(); ctx.globalAlpha = 1; } };
      if (T < .95) { const k = T / .95; arms(a0, 1, tellLine(k)); for (let i = 1; i < 4; i++) arms(a0 + dir * i * .12, .3 * k, tellLine(k)); return; }
      if (T > 3.55) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; arms(o.a, 1, 'rgba(160,190,255,.9)'); for (let i = 1; i < 6; i++) arms(o.a - dir * i * .05, .25, 'rgba(120,150,255,.6)'); ctx.restore(); } }; };
  KA.breaker = (e) => { const from = Math.random() < .5 ? -1 : 1; return { dur: 2.6, step(o, dt, T) { e.w7pose = { k: 'raise', u: Math.min(1, T) }; if (T < 1.2) flare(e, T / 1.2); if (!o.s) { o.s = 1; if (sfxOn && actx) noise(1.2, .06, 300); }
      const A = arena(); if (T < 1.2) { o.x = from < 0 ? A.L : A.R; return; } if (!o.go) { o.go = 1; sfx('whoosh'); if (sfxOn && actx) noise(1.2, .1, 600); }
      o.x = (from < 0 ? A.L : A.R) - from * (T - 1.2) * 560;
      if (!o.hit && Math.abs(P.x - o.x) < 22 && P.state !== 'dodge' && P.state !== 'dead' && P.inv <= 0) { o.hit = 1; hitP(edmg(e), o.x + from * 30, true); if (tookHit()) P.vx = -from * 380; } },
    draw(o, T) { const A = arena(); if (T < 1.2) { const k = T / 1.2, x = from < 0 ? A.L : A.R - 40; ctx.fillStyle = tellCol(k); ctx.fillRect(x, FLOOR_TOP, 40, FLOOR_BOT - FLOOR_TOP + 6);
      ctx.strokeStyle = tellLine(k); ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { const q = (T * 1.5 + i / 4) % 1, xx = (from < 0 ? A.L : A.R) - from * q * (A.R - A.L) * k; ctx.globalAlpha = (1 - q) * .7; ctx.beginPath(); ctx.moveTo(xx + from * 6, FLOOR_TOP + 4); ctx.lineTo(xx - from * 6, (FLOOR_TOP + FLOOR_BOT) / 2); ctx.lineTo(xx + from * 6, FLOOR_BOT); ctx.stroke(); } ctx.globalAlpha = 1; } },
    up(o, T) { if (o.x == null) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const x = o.x; if (T < 1.2) ctx.globalAlpha = cl01(T / 1.2); ctx.translate(x, FLOOR_BOT); ctx.scale(1, T < 1.2 ? .25 + .75 * sm(T / 1.2) : 1); ctx.translate(-x, -FLOOR_BOT); for (let k = 0; k < 4; k++) { const g = ctx.createLinearGradient(x - 30 * from, 0, x + 30 * from, 0); g.addColorStop(0, 'rgba(200,250,240,0)'); g.addColorStop(1, `rgba(235,255,250,${.5 - k * .1})`); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 30 * from, FLOOR_BOT + 6); ctx.lineTo(x - 30 * from, FLOOR_TOP - 150 + k * 20); ctx.quadraticCurveTo(x + 10 * from, FLOOR_TOP - 170 + Math.sin(T * 10 + k) * 8, x + 12 * from, FLOOR_TOP - 120); ctx.lineTo(x + 4 * from, FLOOR_BOT + 6); ctx.closePath(); ctx.fill(); } ctx.restore(); } }; };
  // ---------------- running the fight ----------------
  function startAtk(e, name, ...a) { G.cur = Object.assign({ name, T: 0 }, KA[name](e, ...a)); }
  function toPhase(e, n) {
    phaseDrop(e); e.phase = n; e.dmg = Math.round(e.baseDmg * [1, 1.12, 1.26][n - 1]);
    if (G.cur && G.cur.end) G.cur.end(); G.cur = null; hazards = hazards.filter(h => !['w7anchor', 'w7spout', 'w7shard', 'ring'].includes(h.kind));
    G.trans = 1; G.t = 0; G.mode = n === 2 ? 'p2in' : 'p3in'; if (n === 3) G.wreck = []; shakeMag = 14; flashT = .2; sfx('roar'); zoom = .06;
    if (n === 2) banner('The Maelstrom', 'HE HAS GONE DOWN INTO THE PATTERN · STRIKE HIM WHEN HE SURFACES', 2.8);
    else banner('Through the Glass', 'THERE ARE TWO OF HIM · STRIKE THE ONE THAT WEARS THE PEARL', 3);
  }
  W7.refl = () => G.refl;
  W7.forceAtk = (name, ...a) => { const e = KB(); if (e) { G.atkT = 99; startAtk(e, name, ...a); } }; // (tests)
  W7.toPhase = (n) => { const e = KB(); if (e) { e.hp = Math.floor(e.maxHp * (n === 2 ? .6 : .3)); toPhase(e, n); } };
  MECH_FX.w7glass = {
    start(m) { G = W7.G = { mode: 'none', patRot: 0, patLit: .5, patA: 1, flip: 0 }; m.clk = 0; W7.flip = 0; },
    update(m, dt) {
      m.clk += dt; const e = KB(); const A = arena();
      if (!e) { G.patRot -= dt * .05; return; } // (before the fight he walks it backward: the Pattern turns the wrong way under him)
      if (!e.w7init) initKing(e);
      if (e.dead) { G.vuln = false; if (G.cur && G.cur.end) G.cur.end(); G.cur = null; G.spin *= Math.pow(.2, dt); G.patRot += G.spin * dt; return; }
      if (stillT > 0) return;
      G.t += dt; const ph = e.phase; e.w7flare = Math.max(0, (e.w7flare || 0) - dt * 2.5);
      e.facing = Math.sign(P.x - e.x) || e.facing;
      G.sweepCd -= dt;
      // the current attack
      if (G.cur) { const c = G.cur; c.T += dt; c.step(c, dt, c.T); if (c.T >= c.dur) { if (c.end) c.end(); G.cur = null; G.atkT = (ph === 1 ? 1.35 : ph === 2 ? 1.2 : 1.1) * (e.hp < e.maxHp * .5 ? .85 : 1); e.w7pose = { k: 'idle', u: 0 }; if (G.mode === 'p2') { G.surf = 2.6; G.sub = .12; } } }
      if (G.mode === 'p1') {
        G.vuln = true; G.sub = 0;
        G.moveT -= dt; if (G.moveT <= 0) { G.moveT = 2.6; G.gx = clamp(A.cx + rand(-150, 150), A.L + 110, A.R - 110); G.gy = FLOOR_TOP + rand(16, 40); }
        e.x += (G.gx - e.x) * Math.min(1, dt * 1.4); e.y += (G.gy - e.y) * Math.min(1, dt * 1.4); e.z += (30 + Math.sin(G.t * 1.4) * 4 - e.z) * Math.min(1, dt * 3);
        G.patRot -= dt * .12; G.patLit = .5;
        if (!G.cur) { G.atkT -= dt;
          if (G.sweepCd <= 0 && Math.hypot(P.x - e.x, (P.y - e.y) * 2.4) < 110) { G.sweepCd = 5; startAtk(e, 'sweep'); }
          else if (G.atkT <= 0) { const S = ['tines', 'undertow', 'anchors', 'tines', 'anchors', 'undertow']; startAtk(e, S[G.seq++ % S.length]); } }
        if (e.hp <= e.maxHp * .665) toPhase(e, 2);
      } else if (G.mode === 'p2in') {
        G.vuln = false; e.w7pose = { k: 'cast', u: 1 }; const k = cl01(G.t / 2.2);
        e.x += (A.cx - e.x) * Math.min(1, dt * 3); e.y += (A.cy - e.y) * Math.min(1, dt * 3); G.sub = sm(k); G.spin = lerp(0, 1.1, k);
        if (G.t >= 2.2) { G.mode = 'p2'; G.trans = 0; G.t = 0; G.surf = 0; G.atkT = 1; G.wreck = [0, 1].map(i => ({ a: i * Math.PI, kind: i, cd: 0 })); }
      } else if (G.mode === 'p2') {
        e.x += (A.cx - e.x) * Math.min(1, dt * 3); e.y += (A.cy - e.y) * Math.min(1, dt * 3); e.z += (6 - e.z) * Math.min(1, dt * 3);
        if (e.hp < e.maxHp * .5 && G.wreck.length < 3) G.wreck.push({ a: G.wreck[0].a + Math.PI * .66, kind: 2, cd: 0 });
        // the whirl: round and in
        if (!['dodge', 'dead'].includes(P.state)) { const dx = P.x - A.cx, dy = (P.y - A.cy) * 3.2, d = Math.hypot(dx, dy) || 1; if (d > 40) { P.x += (-dy / d * 70 - dx / d * 24) * dt; P.y += (dx / d * 70 - dy / d * 24) / 3.2 * dt; } }
        for (const w of G.wreck) { w.a += dt * .85; w.cd -= dt; const [x, y] = orbitPt(w.a); w.x = x; w.y = y; if (w.cd <= 0 && Math.abs(P.x - x) < 26 && Math.abs(P.y - y) < 12 && P.z < 38) { w.cd = 1; hitP(Math.round(edmg(e) * .8), x, true); } }
        if (G.surf > 0) { G.surf -= dt; G.vuln = true; G.sub += (.12 - G.sub) * Math.min(1, dt * 4); if (G.surf < 1 && !G.surfW) { G.surfW = 1; warnRing(A.cx, A.cy, 1, 240, Math.round(edmg(e) * .7)); } if (G.surf < 1) { e.w7pose = { k: 'inhale', u: 1 - G.surf }; flare(e, 1 - G.surf); } if (G.surf <= 0) { G.sub = .2; G.surfW = 0; } }
        else { G.vuln = false; if (!G.cur) G.sub += (1 - G.sub) * Math.min(1, dt * 3); }
        if (!G.cur && !(G.surf > 0)) { G.atkT -= dt; if (G.atkT <= 0) { const S = ['spout', 'whirl', 'drain']; startAtk(e, S[G.seq++ % S.length]); } }
        if (G.cur && G.cur.name !== 'whirl') G.sub += (1 - G.sub) * Math.min(1, dt * 3);
        G.spin = 1.1; G.patLit = .7;
        if (e.hp <= e.maxHp * .335) { G.wreck = []; toPhase(e, 3); }
      } else if (G.mode === 'p3in') {
        G.vuln = false; const k = cl01(G.t / 2.6); G.spin = lerp(1.1, -.2, k); G.sub = 1 - sm(cl01((G.t - 1.2) / 1.2)); W7.turnK = G.t < 1.6 ? G.t / 1.6 : 0; G.flip = sm(cl01((G.t - .8) / 1)); W7.flip = G.flip;
        if (G.t >= 2.6) { G.mode = 'p3'; G.trans = 0; G.t = 0; W7.turnK = 0; G.atkT = .8; G.refl = { x: 2 * A.cx - e.x, y: e.y, z: 30, broken: 0, flash: 0 }; G.swapT = 8; G.gx = A.cx - 120; G.gy = FLOOR_TOP + 30; }
      } else if (G.mode === 'p3') {
        G.vuln = true; G.sub = 0; G.patLit = .35; G.spin = -.2;
        G.moveT -= dt; if (G.moveT <= 0) { G.moveT = 2.4; G.gx = A.cx + (e.x < A.cx ? -1 : 1) * rand(60, 200); G.gy = FLOOR_TOP + rand(16, 44); }
        G.gx = clamp(G.gx, A.L + 80, A.R - 80);
        e.x += (G.gx - e.x) * Math.min(1, dt * 1.6); e.y += (G.gy - e.y) * Math.min(1, dt * 1.6); e.z += (30 + Math.sin(G.t * 1.4) * 4 - e.z) * Math.min(1, dt * 3);
        const R = G.refl; R.x = 2 * A.cx - e.x; R.y = e.y; R.z = e.z; R.flash = Math.max(0, R.flash - dt);
        if (R.broken > 0) { R.broken -= dt; if (R.broken <= 0) floatText(R.x, R.y, 140, 'THE REFLECTION RE-FORMS', '#DCEEFF', 12); }
        G.swapT -= dt; if (G.swapT <= 1 && !G.swapping) { G.swapping = 1; floatText(A.cx, FLOOR_TOP + 20, 130, 'THEY GO INTO THE WATER', '#DCEEFF', 13); }
        if (G.swapT <= 0) { G.swapT = rand(7, 9); G.swapping = 0; if (Math.random() < .55) { const ox = e.x; e.x = R.x; G.gx = 2 * A.cx - G.gx; R.x = ox; } bubbles(e.x, e.y, 60, 20, 90); bubbles(R.x, R.y, 60, 20, 90); sfx('hit-goo'); }
        if (!G.cur) { G.atkT -= dt;
          if (G.sweepCd <= 0 && Math.hypot(P.x - e.x, (P.y - e.y) * 2.4) < 110) { G.sweepCd = 5; startAtk(e, 'sweep'); }
          else if (G.atkT <= 0) { const late2 = e.hp < e.maxHp * .15, S = late2 ? ['tines', 'breaker', 'shards', 'unwind', 'breaker'] : ['tines', 'shards', 'unwind']; const nm = S[G.seq++ % S.length]; if (nm === 'tines') startAtk(e, 'tines', true); else startAtk(e, nm); } }
      }
      G.patRot += (G.spin || 0) * dt;
      e.w7sub = G.sub || 0;
      if (G.cur && G.cur.name === 'tines' && e.phase === 3) { /* both lay the tines: the reflection mirrors the King's pose */ }
    },
    boxes(m, box) { const e = KB(); if (!e) { const A = arena(); box(A.cx, FLOOR_TOP + 24, 30, 120, 200); } if (G.refl) box(G.refl.x, G.refl.y, G.refl.z, 140, 200); for (const w of G.wreck || []) box(w.x, w.y, 0, 60, 80); if (G.cur) box(P.x, P.y, 0, VW, 260); },
    list(m, list, t) {
      const e = KB();
      if (!e && stage.bossRoom) { // before he turns to fight: he is walking the Pattern backward, slowly, round its rim
        const A = arena(), a = -t * .25, x = A.cx + Math.cos(a) * 120, y = A.cy - 20 + Math.sin(a) * 12, fake = { x, y, z: 30, facing: Math.sign(-Math.sin(a)) || 1, w7pose: { k: 'idle', u: 0 }, slot: 0 };
        list.push([y, () => { shadow(x, y, 40); ctx.save(); ctx.translate(x, y - 30); ctx.scale(fake.facing * 1.15, 1.15); CREATURES.w7king(fake, { t }); ctx.restore(); }]);
      }
      if (G.cur && G.cur.up) list.push([P.y + .5, () => onMain(() => G.cur && G.cur.up(G.cur, G.cur.T))]);
      for (const w of G.wreck || []) if (w.x != null) list.push([w.y, () => drawWreck(w, t)]);
      if (e && !e.dead && G.refl && !(G.refl.broken > 0)) { const R = G.refl; list.push([R.y, () => { shadow(R.x, R.y, 40); const s = e.size || 1.15; ctx.save(); ctx.translate(R.x, R.y - R.z); ctx.scale(-e.facing * s, s); const fl = FLASH; FLASH = R.flash > 0; e.w7nopearl = 1; const pp = e.w7pose; try { CREATURES.w7king(Object.assign({}, e, { w7nopearl: 1, w7eye: '#C8D8F0' }), { t }); } finally { e.w7nopearl = 0; FLASH = fl; } ctx.restore(); }]); }
      if (W7.bub.length) list.push([FLOOR_BOT + 10, () => onMain(drawBubbles)]);
      if (G.flip > 0) reflections(list, t);
    },
  };
  // wreckage of the drowned fleets, going round in the whirl: a broken prow with its figurehead, a ship's bell, a chest
  function drawWreck(w, t) {
    const sp = propSprite('w7wreck' + w.kind, 90, 70, 45, 56, () => {
      if (w.kind === 0) { cel(PB([-34, -4, -10, 0, 24, -6, 34, -26, 22, -18, -6, -16, -30, -14]), '#5A4430', { d: 3, dark: '#2E2018', lite: '#9A7A54', w: 1.4, tex: () => { ctx.strokeStyle = 'rgba(20,10,6,.6)'; ctx.lineWidth = .8; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-30, -12 + i * 3); ctx.lineTo(26, -14 + i * 2); ctx.stroke(); } } });
        cel(PB([26, -24, 34, -36, 40, -40, 38, -30, 32, -22]), '#C8B89A', { d: 1.4, w: 1.1 }); ctx.fillStyle = '#3E7A4E'; for (let i = 0; i < 6; i++) { ctx.fillRect(-28 + i * 9, -3, 2, 7); } }
      else if (w.kind === 1) { cel(PB([-14, 0, -12, -10, -10, -24, 0, -30, 10, -24, 12, -10, 14, 0]), '#5A7A58', { d: 2.4, dark: '#2E4A30', lite: '#A8D0A0', w: 1.4 }); ctx.fillStyle = '#2A3A2A'; circle(0, 2, 3); ctx.fill(); }
      else { cel(PP([-20, 0, -20, -20, 20, -20, 20, 0]), '#6A4A2A', { d: 2.4, w: 1.4 }); cel(PB([-21, -20, -16, -30, 16, -30, 21, -20]), '#7A5A34', { d: 1.6, w: 1.3 }); ctx.fillStyle = PAL.gold; ctx.fillRect(-21, -12, 42, 3); ctx.fillRect(-2, -16, 4, 6); ctx.fillStyle = '#F2EEF6'; for (let i = 0; i < 5; i++) { circle(-12 + i * 6, -31, 2); ctx.fill(); } }
    }, { foot: 10, seed: 81 + w.kind, haze: .06 });
    const bob = Math.sin(t * 2 + w.kind) * 3;
    shadow(w.x, w.y, 30);
    ctx.save(); ctx.translate(w.x, w.y - 8 + bob); ctx.rotate(Math.sin(t + w.kind) * .12); ctx.drawImage(sp.c, -sp.ox, -sp.oy, sp.w, sp.h); ctx.restore();
  }
  // in the glass floor: everyone reflected, upside down under their own feet
  function reflections(list, t) {
    const a = .22 * G.flip;
    list.push([FLOOR_TOP - .5, () => onMain(() => { ctx.save(); ctx.beginPath(); ctx.rect(camX - 20, FLOOR_TOP, VW + 40, VH - FLOOR_TOP); ctx.clip();
      const pr = (x, y, fn) => { ctx.save(); ctx.translate(0, y * 2); ctx.scale(1, -1); fn(); ctx.restore(); };
      pr(P.x, P.y, () => drawPlayerAt(P.x, P.y, -P.z, P.facing, playerPose(), a));
      const e = KB(); if (e && !e.dead) { const s = e.size || 1.15; pr(e.x, e.y, () => { ctx.globalAlpha = a; ctx.translate(e.x, e.y + e.z); ctx.scale(e.facing * s, s); CREATURES.w7king(e, { t }); }); }
      ctx.restore(); })]);
  }
  W7.hitRefl = (dir) => { const R = G.refl; if (!R || R.broken > 0) return false; R.broken = 2.2; R.flash = .1; sfx('break'); burst(R.x, R.y, 70, ['#E8F8FF', '#BEEAD8', '#FFFFFF'], 30, 'crystal', dir, true);
    const e = KB(); if (e && !e.dead) warnRing(R.x, R.y, .85, 230, Math.round(edmg(e) * .65)); return true; };
  W7.reflAt = (x, y, reach) => { const R = G.refl; return R && !(R.broken > 0) && G.mode === 'p3' && Math.abs(R.y - y) < 34 && Math.abs(R.x - x) < reach; };

  // ======================================================================================================
  // PASSAGES
  // ======================================================================================================
  // THROUGH THE GATE OF REBMA (the stair -> the streets): the gate breathes out a veil of silver bubbles, up from the
  // paving, thick as a curtain; he walks into it, and when it thins the city is round him
  TRANS_FX.w7gate = (T, p, c, inP, t) => {
    const Y0 = Y_OFF, H = VH - Y0;
    ctx.fillStyle = `rgba(150,210,200,${.55 * sm(c)})`; ctx.fillRect(0, Y0, VW, H);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const n = Math.floor(260 * c);
    for (let i = 0; i < n; i++) { const x = hsh(i) * VW, sp = 120 + hsh(i + 3) * 260, y = VH + 20 - ((t * sp + hsh(i + 7) * 900) % (H + 60)), r = 1.5 + hsh(i + 11) * 6;
      ctx.strokeStyle = `rgba(235,255,250,${.75})`; ctx.lineWidth = .9; ctx.beginPath(); ctx.arc(x + Math.sin(t * 3 + i) * 3, y, r, 0, TAU); ctx.stroke(); }
    ctx.restore();
    const g = ctx.createLinearGradient(0, Y0, 0, VH); g.addColorStop(0, `rgba(230,255,250,${.5 * c})`); g.addColorStop(1, `rgba(40,110,110,${.3 * c})`); ctx.fillStyle = g; ctx.fillRect(0, Y0, VW, H);
  };
  // DOWN THE WELL OF THE PATTERN (the streets -> the hall): he steps off the rim and sinks; the shaft's lamps go up past
  // him in rings; then the blue of the Pattern comes up from below and opens round him
  TRANS_FX.w7well = (T, p, c, inP, t) => {
    const Y0 = Y_OFF, H = VH - Y0, cx = VW / 2, cy = Y0 + H * .55, k = sm(c);
    const R = lerp(VW * .9, 30, k);
    ctx.save(); ctx.beginPath(); ctx.rect(0, Y0, VW, H); ctx.ellipse(cx, cy, R, R * .55, 0, 0, TAU, true); ctx.fillStyle = inP ? '#04121A' : '#060C1C'; ctx.fill('evenodd'); ctx.restore();
    if (k > .3) { ctx.fillStyle = `rgba(4,14,24,${(k - .3) / .7})`; ctx.beginPath(); ctx.ellipse(cx, cy, R, R * .55, 0, 0, TAU); ctx.fill(); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) { const q = ((t * (inP ? -.7 : .7) + i / 6) % 1 + 1) % 1, rr = 30 + q * VW * .7, a = k * (1 - q) * .6;
      ctx.strokeStyle = inP ? `rgba(160,255,200,${a})` : `rgba(110,150,255,${a})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy, rr, rr * .4, 0, 0, TAU); ctx.stroke();
      for (let j = 0; j < 8; j++) { const aa = j / 8 * TAU + i; ctx.fillStyle = `rgba(255,240,200,${a})`; circle(cx + Math.cos(aa) * rr, cy + Math.sin(aa) * rr * .4, 2); ctx.fill(); } }
    ctx.restore();
  };
  }; // end of late()

  // ======================================================================================================
  // THE LATE HOOKS: entrances, deaths, the sea's own rules on everything, the landmarks, the music; wrapped round
  // functions from files that load after data_w7.js. data_w7.js runs this at DOMContentLoaded
  // ======================================================================================================
  const dom = () => {
  const W7TH = { rebma: 1, rebma2: 1, rebmaBoss: 1 };
  const inW7 = () => typeof stage !== 'undefined' && stage && W7TH[stage.theme];
  W7.inW7 = inW7;
  const yC = (y) => clamp(y, FLOOR_TOP + 10, FLOOR_BOT - 2);
  const HZ = W7.HZ || {}, bubbles = W7.bubbles;
  const KING = () => (typeof boss !== 'undefined' && boss && boss.def === BOSSES.w7king ? boss : null);

  // ---------------- how each of them comes on ----------------
  if (typeof ENTRY !== 'undefined') Object.assign(ENTRY, { w7knight: ['w7swimin'], w7ziphius: ['w7plummet'], w7nixie: ['w7shoal'], w7drowned: ['w7rise'], w7lamp: ['w7glide'], w7guard: ['w7glide'], w7siren: ['w7swimin'], w7hippo: ['w7swimin'], w7triton: ['w7sink'], w7bellk: ['w7sink'], w7bishop: ['w7rise'] });
  if (typeof ENTER_FX !== 'undefined') Object.assign(ENTER_FX, {
    // the drowned (and the Sea-Bishop) come up out of the sand of the stair, shedding it, in a burst of bubbles
    w7rise: { max: 1.5, start(e, n) { if (e.type !== 'w7bishop') e.x = entranceSpot(e); n.y = yC(e.y); e.y = n.y; sfx('hit-goo', .5); },
      update(e, n, dt) { if (Math.random() < .5) bubbles(e.x + rand(-10, 10), e.y, 4, 1, 20); if (n.t > .2 && !n.s) { n.s = 1; dust(e.x, e.y, 10); } return n.t >= n.max; },
      draw(e, n, t, inner) { const k = sm(n.t / 1.3); ctx.fillStyle = `rgba(30,40,40,${.5 * (1 - k)})`; ell(e.x, e.y, 26, 8); ctx.fill(); ctx.save(); ctx.beginPath(); ctx.rect(e.x - 120, e.y - 300, 240, 301); ctx.clip(); ctx.translate(0, (1 - k) * e.hh); inner(); ctx.restore(); } },
    // the folk of Rebma walk up out of the blue: dim and small at first, as things are in deep water
    w7glide: { max: 1.6, keepFace: 1, start(e, n) { n.x1 = entranceSpot(e); n.dir = Math.sign(P.x - n.x1) || 1; n.x0 = n.x1 - n.dir * 60; n.y1 = yC(e.y); e.x = n.x0; e.y = FLOOR_TOP + 6; e.facing = n.dir; },
      update(e, n, dt) { const k = cl01(n.t / n.max); e.x = lerp(n.x0, n.x1, k); e.y = lerp(FLOOR_TOP + 6, n.y1, sm(k)); e.walk += dt * 8; return n.t >= n.max; },
      draw(e, n, t, inner) { const k = sm(n.t / n.max), s = lerp(.7, 1, k); ctx.save(); ctx.globalAlpha = k; ctx.translate(e.x, e.y); ctx.scale(s, s); ctx.translate(-e.x, -e.y); inner(); ctx.restore(); } },
    // the swimmers come down in a long curve out of the water overhead
    // the ziphius comes down from high in the water in a long spiral, as an owl drops to a branch
    w7plummet: { max: 1.6, keepFace: 1, start(e, n) { n.x1 = entranceSpot(e); n.y1 = yC(e.y); e.y = n.y1; n.z0 = 280; e.z = n.z0; e.facing = Math.sign(P.x - n.x1) || 1; sfx('whoosh', .5); },
      update(e, n, dt) { const k = sm(n.t / n.max); e.x = n.x1 + Math.cos(n.t * 5) * 40 * (1 - k); e.z = lerp(n.z0, e.def.hover, k); return n.t >= n.max; },
      draw(e, n, t, inner) { inner(); } },
    // the nixies come out of a burst of bubbles, small at first
    w7shoal: { max: 1.1, start(e, n) { e.x = entranceSpot(e); bubbles(e.x, e.y, e.def.hover, 14, 60); },
      update(e, n, dt) { if (Math.random() < .4) bubbles(e.x, e.y, e.z + 10, 1, 20); return n.t >= n.max; },
      draw(e, n, t, inner) { const k = sm(n.t / n.max); ctx.save(); ctx.translate(e.x, e.y - e.z); ctx.scale(k, k); ctx.translate(-e.x, -(e.y - e.z)); inner(); ctx.restore(); } },
    w7swimin: { max: 1.5, keepFace: 1, start(e, n) { n.x1 = entranceSpot(e); n.dir = Math.sign(P.x - n.x1) || 1; n.x0 = n.x1 - n.dir * 200; n.z0 = 220; n.y1 = yC(e.y); e.facing = n.dir; e.x = n.x0; e.z = n.z0; },
      update(e, n, dt) { const k = sm(n.t / n.max); e.x = lerp(n.x0, n.x1, k); e.z = lerp(n.z0, e.def.hover, k); e.y = n.y1; if (Math.random() < .4) bubbles(e.x, e.y, e.z, 1, 10); return n.t >= n.max; },
      draw(e, n, t, inner) { inner(); } },
    // the heavy ones are let down from above: the bell on its chain, the bronze triton turning slowly as it sinks
    w7sink: { max: 2, start(e, n) { e.x = entranceSpot(e); n.z0 = 260; e.z = n.z0; sfx('whoosh', .4); },
      update(e, n, dt) { const k = cl01(n.t / 1.8); e.z = n.z0 * (1 - sm(k)); if (k >= 1 && !n.l) { n.l = 1; e.z = 0; sfx('slam', .6); dust(e.x, e.y, 10); bubbles(e.x, e.y, 2, 12, 60); shakeMag = Math.max(shakeMag, 4); } return n.t >= n.max; },
      draw(e, n, t, inner) { ctx.fillStyle = 'rgba(10,30,40,.35)'; ell(e.x, e.y, e.hw * (1 - e.z / 400), 6); ctx.fill(); inner(); } },
  });

  // ---------------- the sea's own rules on everything in Rebma: the water bears you up; bubbles go up out of everything ----------------
  { const _ub = updateBossRoom; updateBossRoom = function (dt) { _ub(dt);
    if (!inW7()) { if (W7.bub.length) W7.bub.length = 0; return; }
    roomGrav = .7; // (the water bears a jump up a long way, and lets you down slowly)
    for (const b of W7.bub) { b.t += dt; b.z += b.vz * dt; b.x += b.vx * dt + Math.sin(b.t * 6 + b.r * 9) * .3; b.vx *= Math.pow(.3, dt); }
    W7.bub = W7.bub.filter(b => b.t < b.max); if (W7.bub.length > 260) W7.bub.splice(0, W7.bub.length - 260);
    if (P && P.state !== 'dead') { W7.breathT = (W7.breathT || 0) - dt; if (W7.breathT <= 0) { W7.breathT = rand(1.8, 3); bubbles(P.x + P.facing * 4, P.y, P.z + 58, 3, 6); }
      if (P.state === 'dodge' && Math.random() < .5) bubbles(P.x, P.y, P.z + rand(10, 50), 1, 30); } }; }
  { const _b = burst; burst = function (x, y, z, cols, n, mat, dir, big) { // what the sea's creatures are made of breaks in its own way, and lets go bubbles
    if (typeof mat === 'string' && mat.startsWith('w7')) mat = { w7brine: 'goo', w7glass: 'crystal', w7bronze: 'metal', w7nacre: 'crystal' }[mat] || 'goo';
    _b(x, y, z, cols, n, mat, dir, big); if (inW7() && n > 4) bubbles(x, y, z, Math.min(6, n >> 2), 50); }; }

  // ---------------- cover: none here; the pods are drowned reliquaries, little gilt caskets grown over with coral ----------------
  { const _pod = drawPod;
    drawPod = function (p, t) {
      if (p.theme !== 'rebma') return _pod(p, t);
      const sp = propSprite('pod-rebma', 56, 56, 28, 48, (th, s) => {
        for (let i = 0; i < 5; i++) { ctx.strokeStyle = PAL.coral; ctx.lineWidth = 2.2 - i * .3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-14 + i * 7, 0); ctx.quadraticCurveTo(-18 + i * 8, -10, -20 + i * 9, -16 - (i % 2) * 4); ctx.stroke(); }
        ctx.fillStyle = PAL.goldD; ctx.fillRect(-13, -26, 26, 20); ctx.fillStyle = PAL.gold; ctx.fillRect(-13, -26, 26, 3); ctx.fillRect(-13, -9, 26, 3);
        ctx.fillStyle = '#2A4A8A'; ctx.fillRect(-9, -21, 18, 10); for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#C8343A' : '#F2EEF6'; circle(-6 + i * 4, -16, 1.3); ctx.fill(); }
        ctx.fillStyle = PAL.gold; ctx.beginPath(); ctx.moveTo(-14, -26); ctx.quadraticCurveTo(0, -38, 14, -26); ctx.closePath(); ctx.fill(); ctx.fillStyle = PAL.goldL; ctx.fillRect(-1, -36, 2, 6);
        ctx.fillStyle = 'rgba(60,120,80,.6)'; for (let i = 0; i < 6; i++) ell(-12 + hsh(i) * 24, -6 - hsh(i + 3) * 18, 2, 1.4), ctx.fill();
      }, { foot: 8, seed: 63, haze: .06, line: .7 });
      propDraw(sp, p.x, p.y, { sh: 18, flash: FLASH });
    }; }

  // ---------------- what each of them does every frame ----------------
  const SWIM = { w7knight: [60, 30, 1.1], w7ziphius: [80, 20, .8], w7nixie: [90, 50, 2.6] }; // how far and how fast each weaves as it swims
  const _upd = updateEnemy;
  updateEnemy = function (e, dt) {
    const decay = () => { e.flash = Math.max(0, e.flash - dt); e.jit = Math.max(0, e.jit - dt); e.flinch = Math.max(0, (e.flinch || 0) - dt); e.sqx += (1 - e.sqx) * Math.min(1, dt * 8); e.sqy += (1 - e.sqy) * Math.min(1, dt * 8); };
    if (e.def === BOSSES.w7king) { if (e.dead) return _upd(e, dt); decay(); e.state = 'w7act'; e.w7a = 'king'; e.vx = 0; e.vz = 0; e.air = false; e.plan = null; e.rageT = 0; e.enraged = false; return; } // (the 'w7glass' rule moves him)
    if (e.dead) return _upd(e, dt);
    if (e.type === 'w7bellk' && e.w7bare && e.state === 'idle' && e.plan !== 'w7stab') e.plan = 'w7stab';
    if (SWIM[e.type] && !['enter', 'w7act', 'dying', 'hurt', 'down'].includes(e.state)) { // they swim: they circle and weave rather than walk
      const r = _upd(e, dt), ph = performance.now() / 1000 * SWIM[e.type][2] + (e.slot || 0);
      if (e.state === 'idle' || e.state === 'recover') { e.x += Math.cos(ph) * SWIM[e.type][0] * dt; e.y = clamp(e.y + Math.sin(ph * 1.3) * SWIM[e.type][1] * dt, FLOOR_TOP + 8, FLOOR_BOT); }
      if (e.type === 'w7nixie') { const mates = enemies.filter(o => o !== e && !o.dead && o.type === 'w7nixie' && Math.abs(o.x - e.x) < 260); if (mates.length) { const mx = mates.reduce((a, o) => a + o.x, 0) / mates.length, my = mates.reduce((a, o) => a + o.y, 0) / mates.length; if (Math.abs(mx - e.x) > 40) e.x += Math.sign(mx - e.x) * 30 * dt; if (Math.abs(my - e.y) > 16) e.y += Math.sign(my - e.y) * 14 * dt; } }
      if (e.w7noSpear > 0) e.w7noSpear -= dt;
      if (Math.random() < dt * .6) bubbles(e.x, e.y, e.z + e.hh * .6, 1, 8);
      return r; }
    if (e.w7noSpear > 0) e.w7noSpear -= dt;
    if (e.type === 'w7drowned' && Math.random() < dt * .4) bubbles(e.x + e.facing * 3, e.y, e.hh - 4, 2, 6);
    return _upd(e, dt);
  };
  // blows: the King is under the water or behind his reflection; the glass bell turns light blows; the halberdier blocks
  const heavyHit = (m) => m.trump || m.power === 2 || m.launch || m.smash || m.shock || (m.key && m.key.includes('H')) || m.key === 'X';
  const _strike = strike;
  strike = function (e, base, dir, m, echo) {
    if (e.def === BOSSES.w7king) {
      if (e.dead) return;
      if (!W7.kingVuln(e)) { if (!(e.w7msg > performance.now())) { e.w7msg = performance.now() + 800; floatText(e.x, e.y - e.z + 30, 90, W7.G.mode === 'p2' ? 'HE IS UNDER THE WATER' : 'NOT NOW', '#DCF4F0', 12); }
        sfx('hit-goo', .3); bubbles(P.x + P.facing * 30, P.y, P.z + 40, 4, 30); return; }
      const fl = e.phase === 1 ? .665 : e.phase === 2 ? .335 : 0, buf = fl ? 1e7 : 0; // (no single blow carries him through a shape: each must be lived through)
      e.hp += buf; let r; try { r = _strike(e, base, dir, m, echo); } finally { e.hp -= buf; }
      if (!e.dead && fl && e.hp < e.maxHp * fl) e.hp = Math.floor(e.maxHp * fl);
      return r;
    }
    if (e.type === 'w7bellk' && !e.dead && e.state !== 'enter') {
      if (!e.w7bare) {
        if (heavyHit(m)) { e.w7crack = (e.w7crack || 0) + (m.power === 2 || m.trump ? 2 : 1); sfx('hit-crystal', 1); if (e.w7crack >= 3) { e.w7bare = 1; e.plan = null; sfx('break'); burst(e.x, e.y, 40, ['#E8F8FF', '#BEEAD8', '#FFFFFF'], 30, 'crystal', dir, true); bubbles(e.x, e.y, 40, 24, 120); floatText(e.x, e.y, e.hh + 24, 'THE BELL SHATTERS', '#E8F8FF', 15); e.hh = 46; e.hw = 14; } else floatText(e.x, e.y, e.hh + 20, 'CRACKED', '#E8F8FF', 12); }
        else { base *= .3; if (!(e.w7msg > performance.now())) { e.w7msg = performance.now() + 900; floatText(e.x, e.y, e.hh + 16, 'IT GLANCES OFF THE GLASS', '#DCEEFF', 11); } }
      } else base *= 1.3;
    }
    if (e.type === 'w7guard' && !e.dead && !heavyHit(m) && !m.el && ['idle', 'recover'].includes(e.state) && Math.sign(P.x - e.x) === e.facing && Math.random() < .3) {
      e.state = 'block'; e.t = .5; e.plan = null; floatIcon(e.x, e.y, e.z + e.hh + 10, 'shield', 15); sfx('hit-metal', .3); P.vx = -dir * 140; hitstop = Math.max(hitstop, .05); return; }
    return _strike(e, base, dir, m, echo);
  };
  // your blows on the King's reflection
  { const _dh = doHits; doHits = function () { _dh();
    const m = P.move; if (!m || !W7.reflAt) return; const R = W7.refl && W7.refl(); if (!R || P.w7reflHit === P.moveId) return;
    if (W7.reflAt(P.x, P.y, 400) && inReach(m, R.x, R.y, R.z, 30, 130)) { P.w7reflHit = P.moveId; W7.hitRefl(P.facing); } }; }
  // deaths, each in its own way: the drowned go up; the siren goes to foam; the bronze topples; the glass breaks
  const CUSTOM_DEATH = { w7drowned: 'w7float', w7bishop: 'w7float', w7lamp: 'w7douse', w7siren: 'w7foam', w7hippo: 'w7flee', w7bellk: 'w7flood', w7triton: 'w7topple', w7knight: 'w7drift', w7ziphius: 'w7drift', w7nixie: 'w7drift' };
  const _kill = killEnemy;
  killEnemy = function (e, dir, m) {
    _kill(e, dir, m);
    if (e.def === BOSSES.w7king) { W7.kingDown(e); return; }
    const cd = CUSTOM_DEATH[e.type];
    // (the drowned rise at 50 px/s and the hippocamp swims at its own pace, until they are off the screen)
    if (cd) { const wasPop = e.death === 'pop'; e.death = cd; e.air = false; e.spin = 0; e.rotA = 0; e.vx = cd === 'w7flee' ? dir * 40 : 0; e.vz = 0; e.t = e.dmax = cd === 'w7float' ? (e.y + e.hh * 1.6 + 80) / 50 : cd === 'w7flee' ? (VW + 260) / 144 : cd === 'w7drift' ? (e.y + e.hh + 300) / 60 : 1.8; if (wasPop) dropLoot(e); bubbles(e.x, e.y, e.hh * .6, 14, 70); }
  };
  W7.kingDown = (e) => { // the King breaks like glass, and the Pearl of Judgement falls out of his crown onto the Pattern
    e.death = 'w7glassend'; e.air = false; e.spin = 0; e.vx = 0; e.vz = 0; e.t = e.dmax = 3; e.w7nopearl = 1;
    W7.pearl = { x: e.x, y: e.y, z: e.z + 120, vz: 0, t: 0 }; if (W7.G) { W7.G.refl = null; W7.G.wreck = []; }
    save.w7relic = true; (save.endings = save.endings || {}); if (typeof persist === 'function') persist();
    shakeMag = 16; flashT = .3; sfx('break'); sfx('hit-crystal'); bubbles(e.x, e.y, 80, 60, 200);
    setTimeout(() => { if (mode === 'play') banner('The Pearl of Judgement', "THE SEA'S REFLECTION OF THE JEWEL · IT IS YOURS", 2.8); }, 900);
  };
  const _dd = drawDeath;
  drawDeath = function (e, t) {
    const d = e.death; if (!d || !/^w7/.test(d)) return _dd(e, t);
    const el = e.corpse ? (e.dmax || 1) : e.dmax - e.t, k = cl01(el / (e.dmax || 1)), a = { walk: 0, t: e.deadAt || t, wind: 0, hurt: true };
    const draw = (fn) => { ctx.save(); ctx.globalAlpha *= e.fade !== undefined ? e.fade : 1; try { fn(); } finally { ctx.restore(); } };
    if (d === 'w7float') draw(() => { if (k >= .999) return; ctx.translate(e.x, e.y - e.z - el * 50); ctx.rotate(-Math.min(1, el / 1.8) * 1.2 * e.facing); ctx.scale(e.facing, 1); CREATURES[e.def.draw](e, a); });
    else if (d === 'w7douse') draw(() => { e.w7out = 1; ctx.translate(e.x, e.y); ctx.scale(e.facing, 1); ctx.rotate(-sm(Math.min(1, k * 1.6)) * 1.4); ctx.globalAlpha *= 1 - sm((k - .6) / .4) * .4; CREATURES.w7lamp(e, a); });
    else if (d === 'w7foam') draw(() => { if (k < .5) { ctx.translate(e.x, e.y - e.z); ctx.scale(e.facing, 1); ctx.globalAlpha *= 1 - k * 2; CREATURES.w7siren(e, a); }
      if (k < .999) onMain(() => { for (let i = 0; i < 24; i++) { const q = cl01(k * 1.4 - hsh(i) * .4), x = e.x + (hsh(i + 2) - .5) * 30, y = e.y - e.z - 20 - q * 70 + (hsh(i + 5) - .5) * 20; ctx.strokeStyle = `rgba(240,250,250,${.8 * Math.sin(q * Math.PI)})`; ctx.lineWidth = .8; circle(x, y, 1 + hsh(i + 7) * 3); ctx.stroke(); } }); });
    else if (d === 'w7drift') draw(() => { if (k >= .999) return; ctx.translate(e.x - e.facing * el * 30, e.y - e.z - el * 60); ctx.rotate(Math.min(1, el / 1.2) * Math.PI * .85 * e.facing); ctx.scale(e.facing, 1); CREATURES[e.def.draw](e, a); }); // (belly up, it goes up through the water at a steady pace until it is gone)
    else if (d === 'w7flee') draw(() => { if (k >= .999) return; ctx.translate(e.x + e.facing * -el * 144, e.y - e.z - el * 67); ctx.scale(-e.facing, 1); CREATURES.w7hippo(e, a); });
    else if (d === 'w7flood') draw(() => { e.w7bare = 1; ctx.translate(e.x, e.y); ctx.scale(e.facing, 1); ctx.rotate(-sm(Math.min(1, k * 2)) * 1.4); CREATURES.w7bellk(e, a); });
    else if (d === 'w7topple') draw(() => { ctx.translate(e.x, e.y); ctx.scale(e.facing, 1); ctx.rotate(-Math.pow(sm(Math.min(1, k * 1.4)), 2) * 1.5); CREATURES.w7triton(e, a); });
    else if (d === 'w7glassend') draw(() => { // the King breaks: the glass of him flies apart and the water of him goes out into the water
      if (k < .35) { ctx.translate(e.x, e.y - e.z); ctx.scale(e.facing * (e.size || 1.15), e.size || 1.15); FLASH = Math.floor(t * 20) % 2 === 0; CREATURES.w7king(e, a); FLASH = false; }
      if (k < .999) onMain(() => { ctx.save(); for (let i = 0; i < 40; i++) { const q = cl01((k - .3) * 1.6 + hsh(i) * .2); if (q <= 0) continue; const ang = hsh(i + 1) * TAU, r = q * (80 + hsh(i + 2) * 140), x = e.x + Math.cos(ang) * r, y = e.y - e.z - 80 + Math.sin(ang) * r * .7 + q * q * 60;
        ctx.fillStyle = `rgba(200,240,230,${.85 * (1 - q)})`; ctx.save(); ctx.translate(x, y); ctx.rotate(q * 8 + i); poly([-4, -6, 5, -2, 2, 6]); ctx.fill(); ctx.restore(); } ctx.restore(); }); });
  };

  // ---------------- this world's upright effects, drawn in depth with the figures ----------------
  const _mb = mechBoxes; mechBoxes = function (box) { _mb(box); for (const h of hazards) if (HZ[h.kind] && HZ[h.kind].box) HZ[h.kind].box(h, box); if (W7.pearl && inW7()) box(W7.pearl.x, W7.pearl.y, 0, 40, 160); };
  const _ml = mechList; mechList = function (list, t) { _ml(list, t); for (const h of hazards) if (HZ[h.kind] && HZ[h.kind].ups && h.t > -.4) HZ[h.kind].ups(h, list, t);
    if (W7.pearl && stage && stage.theme === 'rebmaBoss') { const pr = W7.pearl; list.push([pr.y + .2, () => onMain(() => W7.drawPearl(pr.x, pr.y - pr.z, 1, t, true))]); } };
  // the Pearl of Judgement, falling out of the King's crown and lying on the Pattern, the Pattern turning in it
  W7.drawPearl = (x, y, s, t, glow) => {
    if (glow) glowM(x, y - 4 * s, 26 * s, '120,160,255', .35);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const g = ctx.createRadialGradient(-2, -9, 1, 0, -6, 7); g.addColorStop(0, '#5A5A7A'); g.addColorStop(.5, '#1E1C2E'); g.addColorStop(1, '#08070E'); ctx.fillStyle = g; circle(0, -6, 6); ctx.fill(); ctx.strokeStyle = '#0A0A12'; ctx.lineWidth = 1; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.arc(0, -6, 5.4, 0, TAU); ctx.clip(); ctx.strokeStyle = 'rgba(110,150,240,.9)'; ctx.lineWidth = .7; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, -6, 1 + i * 1.4, t * (i % 2 ? 1.5 : -1.5), t * (i % 2 ? 1.5 : -1.5) + 4.6); ctx.stroke(); } ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ell(-2, -9, 1.6, 1); ctx.fill();
    ctx.restore();
  };
  { const _ul = updateLoot; updateLoot = function (dt) { _ul(dt); const pr = W7.pearl; if (pr && inW7()) { pr.t += dt; if (pr.z > 0) { pr.vz -= 300 * dt; pr.z = Math.max(0, pr.z + pr.vz * dt); } } else if (pr && !inW7()) W7.pearl = null; }; }
  { const _ez = enterZone; enterZone = function (z, Zs) { W7.pearl = null; W7.flip = 0; W7.turnK = 0; return _ez(z, Zs); }; }

  // ---------------- the hall: the Pattern in its floor, turning; the whirl; the glass ----------------
  { const _br = drawBossRoom; drawBossRoom = function (t) { _br(t);
    if (!stage || stage.theme !== 'rebmaBoss') return;
    const L = lockX !== null ? lockX : stage.len - VW, cx = L + VW / 2 - camX, cy = (FLOOR_TOP + FLOOR_BOT) / 2 + 4, G = W7.G || {};
    if (W7.flip > 0) { // the floor turned to glass: the hall stands upside down in it
      ctx.save(); ctx.beginPath(); ctx.rect(0, FLOOR_TOP, VW, VH - FLOOR_TOP); ctx.clip(); ctx.globalAlpha = .55 * W7.flip;
      ctx.translate(0, FLOOR_TOP * 2); ctx.scale(1, -1);
      for (const [img, sp] of [[bgFar, .15], [bgMid, .45]]) { if (!img) continue; const fx = -(((camX * sp) % 1280) + 1280) % 1280; ctx.drawImage(img, fx, 0, 1280, FLOOR_TOP); ctx.drawImage(img, fx + 1280, 0, 1280, FLOOR_TOP); }
      ctx.restore();
      const g = ctx.createLinearGradient(0, FLOOR_TOP, 0, VH); g.addColorStop(0, `rgba(220,240,255,${.25 * W7.flip})`); g.addColorStop(1, `rgba(120,160,220,${.1 * W7.flip})`); ctx.fillStyle = g; ctx.fillRect(0, FLOOR_TOP, VW, VH - FLOOR_TOP);
    }
    W7.drawPattern(cx, cy, G.patRot || 0, (G.patA ?? 1) * (1 - .5 * (W7.flip || 0)), G.patLit ?? .5, t);
    if (G.cur && G.cur.draw) { ctx.save(); ctx.translate(-camX, 0); try { G.cur.draw(G.cur, G.cur.T); } finally { ctx.restore(); } } // (his attack's own marks on the floor: the lanes, the rings, the arms of the Pattern)
    if (G.mode === 'p2' || G.mode === 'p2in') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; // the whirl: streaks of foam going round
      for (let i = 0; i < 26; i++) { const r = 40 + hsh(i) * 280, a = -(G.patRot * (1 + 60 / r)) + hsh(i + 3) * TAU; ctx.strokeStyle = `rgba(210,250,240,${.12 + .1 * hsh(i + 5)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, r, r / 3.2, 0, a, a + .5); ctx.stroke(); } ctx.restore();
      if (G.eye > 0) { ctx.save(); ctx.translate(cx, cy); ctx.scale(1, .45); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + t * 3; ctx.fillStyle = `rgba(240,250,250,${.8 * G.eye})`; poly([Math.cos(a) * 66, Math.sin(a) * 66, Math.cos(a + .1) * 40, Math.sin(a + .1) * 40, Math.cos(a + .2) * 66, Math.sin(a + .2) * 66]); ctx.fill(); } ctx.restore(); } }
  }; }
  // the hall turning over, as he goes through the glass: the view folds to a line and opens again
  { const _zv = zoneViewTurn; zoneViewTurn = function () { _zv(); const k = W7.turnK || 0; if (!(k > 0) || !stage || stage.theme !== 'rebmaBoss') return; const s = Math.max(.04, Math.abs(Math.cos(k * Math.PI))); ctx.translate(0, Y_OFF + VIEW_H / 2); ctx.scale(1, s); ctx.translate(0, -(Y_OFF + VIEW_H / 2)); }; }

  // ---------------- the landmarks at the end of each area ----------------
  if (typeof THRESH !== 'undefined') {
    // the stair -> the streets: the Gate of Rebma at the stair's foot: two columns of nacre, a lintel of gold with the
    // reversed unicorn on it, doors of green bronze that swing open, slowly, in the water
    THRESH.w7gate = {
      edge: (y) => y < 170 ? -330 + (y - 84) * .4 : lerp(-296, -170, thCl((y - 170) / 70)), feather: 130,
      hazeB: [-260, 70, 240, VH], haze(r) { for (let i = 0; i < 10; i++) softDab(-60 + r() * 200, 140 + r() * 100, 30 + r() * 40, i % 2 ? '200,240,230' : '140,200,200', .2); },
      backB: [-110, FLOOR_TOP - 170, 150, FLOOR_TOP + 14], back(r) {
        const T = FLOOR_TOP, top = T - 150;
        for (const x of [-70, 90]) { const g = ctx.createLinearGradient(x - 12, 0, x + 12, 0); g.addColorStop(0, '#9AB8C0'); g.addColorStop(.35, '#F2F4EE'); g.addColorStop(1, '#6A8A94'); ctx.fillStyle = g; ctx.fillRect(x - 12, top + 14, 24, T - top - 10);
          for (let i = 0; i < 9; i++) { ctx.fillStyle = i % 2 ? 'rgba(220,200,240,.35)' : 'rgba(200,240,230,.35)'; ctx.fillRect(x - 12, top + 20 + i * 15, 24, 2); }
          ctx.fillStyle = PAL.gold; ctx.fillRect(x - 15, top + 8, 30, 8); ctx.fillRect(x - 15, T - 6, 30, 8); }
        ctx.fillStyle = PAL.goldD; ctx.fillRect(-90, top - 6, 200, 16); ctx.fillStyle = PAL.gold; ctx.fillRect(-90, top - 6, 200, 4); ctx.fillStyle = PAL.goldL; ctx.fillRect(-90, top - 6, 200, 1.2);
        ctx.fillStyle = '#1E3A5A'; ctx.beginPath(); ctx.moveTo(-58, top + 14); ctx.lineTo(-58, T); ctx.lineTo(78, T); ctx.lineTo(78, top + 14); ctx.quadraticCurveTo(10, top - 20, -58, top + 14); ctx.fill(); // the dark beyond the doors
        mosaicUnicorn(10, top - 2, .55);
      },
      live(x, k, t) { const T = FLOOR_TOP, top = T - 150, o = thSm(k * 1.2);
        for (const s of [0, 1]) { const w = 68 * (1 - o * .82), x0 = s ? x + 78 - w : x - 58; ctx.fillStyle = s ? '#2E6A5A' : '#3E7A6A'; ctx.fillRect(x0, top + 16, w, T - top - 16);
          ctx.strokeStyle = PAL.verdL; ctx.lineWidth = 1; ctx.strokeRect(x0 + 4, top + 22, w - 8, (T - top - 28) / 2 - 4); ctx.strokeRect(x0 + 4, top + 22 + (T - top - 28) / 2, w - 8, (T - top - 28) / 2 - 4);
          ctx.fillStyle = PAL.gold; circle(s ? x0 + 6 : x0 + w - 6, (top + T) / 2, 2.4); ctx.fill(); }
        if (o > .1) { glowM(x + 10, T - 60, 90, '200,255,240', .2 * o); for (let i = 0; i < 6; i++) { const q = (t * .5 + i / 6) % 1; ctx.strokeStyle = `rgba(230,255,250,${.6 * o * (1 - q)})`; ctx.lineWidth = .8; circle(x - 40 + hsh(i) * 100, T - q * 140, 1.5 + hsh(i + 2) * 2); ctx.stroke(); } }
      },
    };
    // the streets -> the hall: the Well of the Pattern: a round shaft in the paving, rimmed in gold mosaic, a stair
    // going round and down inside it, and the blue of the Pattern far below
    THRESH.w7well = {
      edge: (y) => y < 170 ? -340 + (y - 84) * .4 : lerp(-306, -190, thCl((y - 170) / 70)), feather: 140,
      hazeB: [-260, 70, 260, VH], haze(r) { for (let i = 0; i < 12; i++) softDab(-40 + r() * 220, 140 + r() * 100, 30 + r() * 40, i % 2 ? '120,150,230' : '80,120,200', .2); },
      backB: [-120, FLOOR_TOP - 40, 160, FLOOR_TOP + 80], back(r) {
        const cx = 20, cy = FLOOR_TOP + 40;
        ctx.fillStyle = PAL.goldD; ell(cx, cy, 70, 26); ctx.fill(); for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; ctx.fillStyle = i % 2 ? PAL.gold : '#2A4A8A'; ctx.fillRect(cx + Math.cos(a) * 64 - 2, cy + Math.sin(a) * 23 - 1.5, 4, 3); }
        ctx.fillStyle = '#04080E'; ell(cx, cy + 2, 56, 19); ctx.fill();
        for (let i = 0; i < 8; i++) { const a = Math.PI * (.15 + i * .1); ctx.fillStyle = '#3E5A6A'; ctx.fillRect(cx + Math.cos(a) * 46 - 6, cy + Math.sin(a) * 14 + i * 1.5, 12, 3); } // the stair going round inside
      },
      live(x, k, t) { const cx = x + 20, cy = FLOOR_TOP + 42, o = .4 + .6 * thSm(k * 1.2); ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, 55, 18, 0, 0, TAU); ctx.clip(); W7.drawPattern(cx, cy + 6, -t * .2, .8, o, t); ctx.restore(); glowM(cx, cy, 70, '110,150,255', .25 * o); },
    };
  }

  // ---------------- music: pavanes and plainchant, played on a sea-organ ----------------
  if (typeof TRACKS !== 'undefined') {
    Object.assign(TRACKS, {
      // Faiella-bionin: a slow descent in D dorian, bells far below, a long echo
      rebma: { bpm: 76, style: 'calm', duty: .5, vib: 14, echo: .4, echoSteps: 4, arp: '0--.2--.4--.2--.', arpDuty: .125, av: .045,
        chords: ['Dm', 'C', 'Dm', 'Am', 'F', 'C', 'G', 'Am'],
        lead: ['A5 - - - G5 - F5 - E5 - - - D5 - - -', 'E5 - - - - - G5 - C5 - - - - - - -', 'F5 - - - E5 - D5 - A4 - - - D5 - F5 -', 'E5 - - - - - - - C5 - - - A4 - - -',
               'C5 - - - D5 - F5 - A5 - - - G5 - F5 -', 'E5 - - - - - D5 - C5 - - - G4 - - -', 'B4 - - - D5 - G5 - B5 - - - A5 - G5 -', 'A5 - - - - - - - - - - - . . . .'] },
      // the Streets: a processional pavane in G mixolydian, the harmony full of open fifths
      rebma2: { bpm: 92, style: 'hymn', duty: .25, vib: 10, echo: .3, echoSteps: 3, form: ['A', 'B'], parts: {
        A: { chords: ['G5', 'F', 'G5', 'Dm', 'C', 'F', 'G5', 'G5'], lead: ['D5 - - - G5 - - - A5 - B5 - C6 - B5 -', 'A5 - - - - - G5 - F5 - - - E5 - D5 -', 'G5 - - - B5 - D6 - C6 - B5 - A5 - G5 -', 'F5 - - - - - - - A5 - - - - - - -',
                 'G5 - E5 - C5 - E5 - G5 - - - A5 - G5 -', 'F5 - - - A5 - C6 - - - A5 - F5 - - -', 'G5 - - - F5 - D5 - B4 - - - D5 - - -', 'G4 - - - - - - - . . . . . . . .'] },
        B: { chords: ['C', 'G5', 'F', 'G5', 'Am', 'F', 'D5', 'G5'], lead: ['E5 - - - G5 - C6 - - - B5 - A5 - G5 -', 'D5 - - - - - G5 - - - - - B5 - - -', 'C6 - - - A5 - F5 - A5 - C6 - F6 - - -', 'D6 - - - - - B5 - - - - - G5 - - -',
                 'A5 - - - C6 - E6 - - - D6 - C6 - B5 -', 'A5 - - - - - F5 - C5 - - - F5 - - -', 'D5 - - - F#5 - A5 - D6 - - - C6 - A5 -', 'G5 - - - - - - - - - - - . . . .'] } } },
      // the Hall of the Pattern, before he turns: plainchant over a drone
      rebmaBoss: { bpm: 60, style: 'ambient', duty: .5, vib: 6, echo: .5, echoSteps: 4, chords: ['D5', 'D5', 'C', 'D5', 'D5', 'Bb', 'C', 'D5'],
        lead: ['D5 - - - - - - - F5 - - - E5 - - -', 'D5 - - - - - - - - - - - . . . .', 'E5 - - - G5 - - - F5 - - - E5 - - -', 'D5 - - - - - - - - - - - . . . .',
               'A5 - - - - - - - G5 - - - F5 - - -', 'G5 - - - - - F5 - D5 - - - - - - -', 'E5 - - - - - - - C5 - - - E5 - - -', 'D5 - - - - - - - - - - - . . . .'] },
      // the King in the Glass: a grand march in D minor; then the whirl (the same theme, racing round); then the theme
      // turned upside down, every interval inverted, as a reflection would sing it
      boss_w7king: { duty: .25, vib: 12, echo: .15, form: ['A', 'A', 'B', 'B', 'C', 'C'], parts: {
        A: { bpm: 104, style: 'grand', chords: ['Dm', 'Bb', 'Gm', 'A'], lead: ['D5 - - - A5 - - - F5 - E5 - D5 - - -', 'F5 - - - Bb5 - - - D6 - C6 - Bb5 - - -', 'G5 - - - D5 - - - G5 - A5 - Bb5 - - -', 'A5 - - - - - - - C#5 - - - E5 - - -'] },
        B: { bpm: 156, style: 'battle', chords: ['Dm', 'Bb', 'Gm', 'A'], arp: '0123012301230123', lead: ['D5 A5 F5 A5 D6 A5 F5 A5 E5 A5 C#6 A5 D6 - - -', 'F5 Bb5 D6 Bb5 F6 D6 Bb5 F5 D6 C6 Bb5 A5 G5 - - -', 'G5 D6 Bb5 G5 D5 G5 Bb5 D6 C6 Bb5 A5 G5 A5 - - -', 'A5 E6 C#6 A5 E5 A5 C#6 E6 A5 - - - - - - -'] },
        C: { bpm: 132, style: 'drive', chords: ['Dm', 'G', 'C', 'A'], lead: ['D6 - - - G5 - - - B5 - C6 - D6 - - -', 'B5 - - - F#5 - - - D5 - E5 - F#5 - - -', 'A5 - - - E6 - - - A5 - G5 - F5 - - -', 'E5 - - - - - - - G#5 - - - A5 - - -'] } } },
      // the ending: the tide going out, in D major at last
      w7tide: { bpm: 66, style: 'calm', duty: .5, vib: 12, echo: .45, echoSteps: 4, once: true, chords: ['D', 'A/C#', 'Bm', 'G', 'D', 'G', 'A', 'D'],
        lead: ['F#5 - - - A5 - - - D6 - - - C#6 - - -', 'E5 - - - - - - - A5 - - - - - - -', 'D5 - - - F#5 - - - B5 - - - A5 - - -', 'G5 - - - - - - - B4 - - - D5 - - -',
               'A5 - - - F#5 - - - D5 - - - F#5 - A5 -', 'B5 - - - - - G5 - - - - - D5 - - -', 'E5 - - - - - A5 - - - - - C#6 - - -', 'D6 - - - - - - - - - - - . . . .'] },
    });
  }
  W7.ready = true;
  };
  window.w7Late = late;
  window.w7Dom = dom;
})();
