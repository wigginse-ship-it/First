'use strict';
// World 8 art, enemies, boss, rules, passages and music: LORRAINE and the BLACK CIRCLE
// (after The Guns of Avalon: a shadow-kingdom where a ring of dead land, the Black Circle, grows outward every season,
// and things come out of it. Corwin fought there once beside Ganelon; he has always known what fed it: the curse he
// laid on Amber, blind, in Eric's dungeon. It took root here first.)
// Painted after Bruegel (the Hunters in the Snow, the Harvesters, the Triumph of Death), Bosch (his hybrids, and the
// grisaille of the Garden's closed wings) and the Limbourgs' Tres Riches Heures:
//   lorraine     - The Winter Fields: Hunters-in-the-Snow country, a frozen valley, skaters on the ponds, a village
//                  under snow; on the horizon a black ring. The villages are emptying toward you (rule 'w8flight':
//                  villagers flee across the field; the Circle's things go after them; the dead get up again, grey)
//   lorraine2    - The Edge of the Circle: a harvest left standing in the field, gone to blight; a windmill, a church,
//                  a gallows-wheel. The Circle's edge breathes across the field (rule 'w8edge': what it covers turns to
//                  grisaille, the grey underpainting; it drinks Corwin and shields its own; iron watchfires hold it back)
//   lorraineBoss - The Heart of the Circle: everything grisaille, a ring of fused stones round the hole the things came
//                  through. The Goat-Lord of the Circle: four shapes (rule 'w8heart')
// Everything is inside one closure; data_w8.js calls W8.late() (attacks and rules), w8_late.js calls W8.dom() (hooks).
(() => {
  const T = FLOOR_TOP;
  const DET = () => !FLASH && !TINT;
  const tn = (...a) => { if (typeof sfxOn !== 'undefined' && sfxOn && typeof actx !== 'undefined' && actx) tone(...a); }; // a note, when there is sound
  const add = (fn) => { if (!DET()) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
  const poly = (pts) => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); };
  const fillPoly = (pts, col, ow) => { poly(pts); ctx.fillStyle = C(col); ctx.fill(); if (ow) outline(ow); };
  const glowM = (x, y, r, rgb, a) => { if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.5, `rgba(${rgb},${a * .35})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); };
  const hsh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const sm = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const cl01 = (k) => clamp(k, 0, 1);
  const seg = (u, a, b) => cl01((u - a) / (b - a));
  // a tapered, curved spike (horn, claw, beak, blade, finger): two-toned, a lit edge
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
      trace(s.L, s.M); ctx.fillStyle = dark || shade(col, -.38); ctx.fill();
      ctx.strokeStyle = shade(col, .42); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(s.R[0], s.R[1]); for (let i = 2; i < s.R.length - 2; i += 2) ctx.lineTo(s.R[i], s.R[i + 1]); ctx.stroke();
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
      if (d) { ctx.fillStyle = o.dark || shade(col, -.34); ctx.beginPath(); BIGR(); path(.8 * d, -.6 * d, true); ctx.fill('evenodd'); }
      if (r) { ctx.fillStyle = o.lite || shade(col, .3); ctx.beginPath(); BIGR(); path(-.8 * r, .6 * r, true); ctx.fill('evenodd'); }
      if (o.tex) o.tex();
      ctx.restore();
    }
    if (w) { path(0, 0); outline(w); }
  }
  // paths: PB a smooth closed blob through the midpoints of its points, PP a straight polygon, PE an ellipse
  const PB = (pts) => (ox, oy, cont) => { if (!cont) ctx.beginPath(); const n = pts.length / 2;
    for (let i = 0; i <= n; i++) { const a = i % n, b = (i + 1) % n, mx = (pts[a * 2] + pts[b * 2]) / 2 + ox, my = (pts[a * 2 + 1] + pts[b * 2 + 1]) / 2 + oy;
      if (i === 0) ctx.moveTo(mx, my); else ctx.quadraticCurveTo(pts[a * 2] + ox, pts[a * 2 + 1] + oy, mx, my); }
    ctx.closePath(); };
  const PP = (pts) => (ox, oy, cont) => { if (!cont) ctx.beginPath(); ctx.moveTo(pts[0] + ox, pts[1] + oy); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i] + ox, pts[i + 1] + oy); ctx.closePath(); };
  const PE = (x, y, rx, ry, rot = 0) => (ox, oy, cont) => { if (!cont) ctx.beginPath(); ctx.moveTo(x + ox + Math.cos(rot) * rx, y + oy + Math.sin(rot) * rx); ctx.ellipse(x + ox, y + oy, Math.max(.1, rx), Math.max(.1, ry), rot, 0, TAU); };
  // a limb as a tapered strip between two joints, with its own cel shading
  function strip(x0, y0, cx, cy, x1, y1, w0, w1, col, o) { const s = taper(x0, y0, cx, cy, x1, y1, w0, w1, 6); cel((ox, oy, cont) => { if (!cont) ctx.beginPath(); ctx.moveTo(s.L[0] + ox, s.L[1] + oy); for (let i = 2; i < s.L.length; i += 2) ctx.lineTo(s.L[i] + ox, s.L[i + 1] + oy); for (let i = s.R.length - 2; i >= 0; i -= 2) ctx.lineTo(s.R[i] + ox, s.R[i + 1] + oy); ctx.closePath(); }, col, Object.assign({ d: 1.4, r: .6, w: 1.3 }, o || {})); return s; }
  // gold leaf laid in a line: a dark bed, the leaf, a burnish along its top (the gilding of a Book of Hours)
  function goldLine(fn, w = 1.2, a = 1) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.globalAlpha = a * .6; ctx.strokeStyle = C('#3A2410'); ctx.lineWidth = w + 1.1; ctx.beginPath(); fn(); ctx.stroke();
    ctx.globalAlpha = a; ctx.strokeStyle = C('#C9982E'); ctx.lineWidth = w; ctx.beginPath(); fn(); ctx.stroke();
    if (DET()) { ctx.strokeStyle = 'rgba(255,236,170,.8)'; ctx.lineWidth = Math.max(.35, w * .3); ctx.translate(-.2, -.3); ctx.beginPath(); fn(); ctx.stroke(); }
    ctx.restore();
  }
  // an eye that is only a bead of ink with one fleck of white (Bruegel's peasants, Bosch's creatures)
  const bead = (x, y, r = 1.1) => { ctx.fillStyle = C('#140C08'); circle(x, y, r); ctx.fill(); if (DET()) { ctx.fillStyle = 'rgba(255,250,236,.85)'; circle(x + r * .35, y - r * .35, r * .32); ctx.fill(); } };
  // the palette: Bruegel's winter (warm snow, umber-black figures, a cold green sky), the harvest's ochres, Lorraine's
  // own colours (or, a bend gules, three alerions argent), and the grey-umber grisaille of the Circle
  const PAL = { snow: '#ECE8DC', snowSh: '#A8B2B4', snowDk: '#7C888C', ink: '#1C1612', umber: '#3A2C22', sky: '#93A79C', skyLo: '#C4CBBC', ice: '#7FA29C',
    brick: '#8E4E36', roof: '#6E4A34', thatch: '#9C7E4C', wheat: '#D6A848', wheatDk: '#A87A28', stub: '#C8A464', leaf: '#5A6A34',
    or: '#D6A43A', gules: '#A62A26', argent: '#EEE8DA', azure: '#3A5A86', sable: '#1E1A18', verm: '#C23A1E',
    gr0: '#26221E', gr1: '#4A443C', gr2: '#6E675C', gr3: '#958D80', gr4: '#BDB5A6', gr5: '#E0D9CA' };
  const W8 = window.W8 = window.W8 || {};
  W8.kit = { DET, add, poly, fillPoly, glowM, hsh, sm, cl01, seg, taper, trace, horn, cel, PB, PP, PE, strip, goldLine, bead, PAL };
  // Lorraine's arms on a shield: or, a bend gules charged with three alerions argent (little eagles without beak or feet)
  function lorraineArms(x, y, w, h, o = {}) {
    const sh = () => { ctx.beginPath(); ctx.moveTo(x - w / 2, y - h / 2); ctx.lineTo(x + w / 2, y - h / 2); ctx.lineTo(x + w / 2, y + h * .1); ctx.quadraticCurveTo(x + w / 2, y + h * .42, x, y + h / 2); ctx.quadraticCurveTo(x - w / 2, y + h * .42, x - w / 2, y + h * .1); ctx.closePath(); };
    sh(); ctx.fillStyle = C(o.field || PAL.or); ctx.fill();
    ctx.save(); sh(); ctx.clip();
    ctx.translate(x, y); ctx.rotate(.72); ctx.fillStyle = C(o.bend || PAL.gules); ctx.fillRect(-w, -w * .17, w * 2, w * .34);
    if (DET() && w > 6) { ctx.fillStyle = C(PAL.argent); for (const k of [-.42, 0, .42]) { const ax = k * w, s = w * .08; ctx.beginPath(); ctx.moveTo(ax - s * 1.4, -s * .6); ctx.lineTo(ax, s * .3); ctx.lineTo(ax + s * 1.4, -s * .6); ctx.lineTo(ax + s * .4, s * .4); ctx.lineTo(ax, s * 1.4); ctx.lineTo(ax - s * .4, s * .4); ctx.closePath(); ctx.fill(); } }
    ctx.restore();
    if (DET() && w > 8) { const g = ctx.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2); g.addColorStop(0, 'rgba(255,250,230,.3)'); g.addColorStop(.5, 'rgba(255,250,230,0)'); g.addColorStop(1, 'rgba(30,10,0,.25)'); sh(); ctx.fillStyle = g; ctx.fill(); }
    if (o.ow !== 0) { sh(); outline(o.ow || 1); }
  }
  W8.arms = lorraineArms;

  // ======================================================================================================
  // THE WINTER FIELDS: Bruegel's Hunters in the Snow country. A cold green sky, impossible crags, a frozen valley with
  // skaters on the ponds, a village half buried; bare trees full of crows; and on the horizon, a black ring
  // ======================================================================================================
  // a bare winter tree: a tall dark trunk, the limbs fanning up and out, a mesh of twigs, snow lodged in the forks
  function bareTree(x, base, h, rnd, o = {}) {
    const col = o.col || '#2A221C', lit = o.lit || 'rgba(240,238,228,.6)', lean = (rnd() - .5) * .12, w = Math.max(1.2, h * .035);
    const lines = [];
    const branch = (x0, y0, a, L, wd, d) => {
      const x1 = x0 + Math.sin(a) * L, y1 = y0 - Math.cos(a) * L, cx = x0 + Math.sin(a + (rnd() - .5) * .5) * L * .5, cy = y0 - Math.cos(a) * L * .55;
      lines.push([x0, y0, cx, cy, x1, y1, wd]);
      if (d <= 0 || L < 4) return;
      const n = d > 2 ? 2 + Math.floor(rnd() * 2) : 2;
      for (let i = 0; i < n; i++) branch(x1, y1, a + (i / (n - 1 || 1) - .5) * (0.9 + rnd() * .5) + (rnd() - .5) * .3, L * (.62 + rnd() * .16), wd * .62, d - 1);
    };
    branch(x, base, lean, h * .42, w, 5);
    ctx.lineCap = 'round'; ctx.strokeStyle = col;
    for (const [x0, y0, cx, cy, x1, y1, wd] of lines) { ctx.lineWidth = Math.max(.35, wd); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke(); }
    if (o.snow !== false) { ctx.strokeStyle = lit; for (const [x0, y0, cx, cy, x1, y1, wd] of lines) if (wd > .9 && rnd() < .35) { ctx.lineWidth = Math.max(.35, wd * .3); ctx.beginPath(); ctx.moveTo(x0 - wd * .2, y0 - wd * .4); ctx.quadraticCurveTo(cx - wd * .2, cy - wd * .4, lerp(cx, x1, .5), lerp(cy, y1, .5) - wd * .4); ctx.stroke(); } }
    if (o.crows) for (let i = 0; i < o.crows; i++) { const L = lines[Math.floor(rnd() * lines.length)]; if (L[6] < .5 || L[6] > 2.4) continue; crowSil(L[4], L[5] - 1, .7 + rnd() * .4, rnd() < .5 ? 1 : -1); }
  }
  // a crow, perched: a black blot with a wedge of beak and a tail
  function crowSil(x, y, s, f) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * f, s); ctx.fillStyle = '#16120E';
    ctx.beginPath(); ctx.ellipse(0, -3, 2.4, 3.2, .3, 0, TAU); ctx.fill(); circle(1.2, -6.4, 1.6); ctx.fill();
    poly([2.4, -6.8, 4.6, -6.2, 2.6, -5.6]); ctx.fill(); poly([-1.6, -1.6, -4.4, 1.4, -2.2, 1.6]); ctx.fill();
    ctx.restore();
  }
  // a crow in flight, wings at a beat k (0..1)
  function crowFly(x, y, s, k, a = 1) {
    const up = Math.sin(k * TAU); ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a; ctx.fillStyle = '#18140F';
    ctx.beginPath(); ctx.moveTo(-6, -up * 3); ctx.quadraticCurveTo(-3, -1 - up, 0, 0); ctx.quadraticCurveTo(3, -1 - up, 6, -up * 3); ctx.quadraticCurveTo(3, .6, 0, 1.2); ctx.quadraticCurveTo(-3, .6, -6, -up * 3); ctx.fill();
    ctx.restore();
  }
  // a house of the valley: whitewashed stone or timber and brick, a steep roof heavy with snow, a chimney, dark windows
  function cottage(x, base, w, h, rnd, o = {}) {
    const wall = o.wall || pick2(rnd, ['#B8A88E', '#A6907A', '#8E5E44', '#C2B49A']), rh = h * (.8 + rnd() * .3), dir = rnd() < .5 ? 1 : -1;
    ctx.fillStyle = wall; ctx.fillRect(x - w / 2, base - h, w, h);
    ctx.fillStyle = shade(wall, -.35); ctx.fillRect(dir > 0 ? x - w / 2 : x + w * .15, base - h, w * .35, h); // the side in shade
    if (o.timber) { ctx.strokeStyle = '#3A2A1E'; ctx.lineWidth = .8; ctx.beginPath(); for (let k = 1; k < 4; k++) { const xx = x - w / 2 + w * k / 4; ctx.moveTo(xx, base - h); ctx.lineTo(xx, base); } ctx.moveTo(x - w / 2, base - h * .5); ctx.lineTo(x + w / 2, base - h * .5); ctx.stroke(); }
    for (let i = 0; i < 2 + Math.floor(rnd() * 3); i++) { ctx.fillStyle = rnd() < .2 ? '#E8B060' : '#1E1812'; ctx.fillRect(x - w / 2 + 3 + rnd() * (w - 8), base - h * (.3 + rnd() * .5), 2.4, 3); }
    if (rnd() < .6) { ctx.fillStyle = '#2A1E16'; ctx.fillRect(x - 2 + (rnd() - .5) * w * .4, base - h * .45, 4, h * .45); }
    const rx0 = x - w / 2 - 3, rx1 = x + w / 2 + 3, ry = base - h, top = ry - rh;
    ctx.fillStyle = o.roof || PAL.roof; poly([rx0, ry, x + (rnd() - .5) * 4, top, rx1, ry]); ctx.fill();
    ctx.fillStyle = PAL.snow; poly([rx0 - 1, ry + .5, x + (rnd() - .5) * 2, top - 1.2, rx1 + 1, ry + .5, rx1 - 4, ry - 1.2, x, top + 3, rx0 + 4, ry - 1.4]); ctx.fill(); // the snow on it
    ctx.fillStyle = 'rgba(150,166,176,.7)'; poly(dir > 0 ? [rx0 - 1, ry + .5, x, top - 1, x - 1, top + 6, rx0 + 3, ry - 1] : [rx1 + 1, ry + .5, x, top - 1, x + 1, top + 6, rx1 - 3, ry - 1]); ctx.fill();
    for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(236,232,220,.9)'; const ix = rx0 + 2 + rnd() * (rx1 - rx0 - 4); poly([ix - 1, ry + .5, ix + 1, ry + .5, ix, ry + 2 + rnd() * 4]); ctx.fill(); } // icicles
    if (o.chimney !== false) { const cx = x + (rnd() - .5) * w * .5, cy = lerp(ry, top, .55); ctx.fillStyle = '#5A3E2E'; ctx.fillRect(cx - 2, cy - 7, 4, 9); ctx.fillStyle = PAL.snow; ctx.fillRect(cx - 2.6, cy - 8.4, 5.2, 1.8); if (W8.smoke) W8.smoke.push([cx, cy - 9]); }
    ctx.fillStyle = PAL.snow; ell(x, base, w * .62, 2.6); ctx.fill(); // drifted against it
  }
  const pick2 = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];
  // a church: a long nave, a tall steeple
  function church(x, base, s, rnd) {
    cottage(x - 10 * s, base, 34 * s, 14 * s, rnd, { wall: '#C4B8A0', chimney: false });
    const tw = 10 * s, th = 30 * s; ctx.fillStyle = '#B4A68C'; ctx.fillRect(x + 8 * s, base - th, tw, th); ctx.fillStyle = '#7E705C'; ctx.fillRect(x + 8 * s, base - th, tw * .35, th);
    ctx.fillStyle = '#1E1812'; ctx.fillRect(x + 11 * s, base - th + 5 * s, 3 * s, 4 * s);
    ctx.fillStyle = '#3E3A40'; poly([x + 7 * s, base - th, x + 13 * s, base - th - 22 * s, x + 19 * s, base - th]); ctx.fill();
    ctx.fillStyle = PAL.snow; poly([x + 7 * s, base - th + .4, x + 13 * s, base - th - 22 * s, x + 11.5 * s, base - th - 10 * s, x + 9 * s, base - th - 1 * s]); ctx.fill();
    ctx.strokeStyle = '#1E1812'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(x + 13 * s, base - th - 22 * s); ctx.lineTo(x + 13 * s, base - th - 27 * s); ctx.moveTo(x + 11.4 * s, base - th - 25 * s); ctx.lineTo(x + 14.6 * s, base - th - 25 * s); ctx.stroke();
  }
  // a skater: a tiny dark figure leaning into the glide (they are everywhere on Bruegel's ice)
  function skater(x, y, s, rnd) {
    const lean = (rnd() - .5) * .6, f = rnd() < .5 ? 1 : -1; ctx.save(); ctx.translate(x, y); ctx.scale(s * f, s); ctx.rotate(lean);
    ctx.fillStyle = rnd() < .3 ? '#7A2A22' : '#1E1812'; poly([-1.4, -4, 1.4, -4, 1.8, -8, 0, -9, -1.8, -8]); ctx.fill(); circle(0, -10, 1.2); ctx.fill();
    ctx.strokeStyle = '#1E1812'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(-.6, -4); ctx.lineTo(-2, 0); ctx.moveTo(.6, -4); ctx.lineTo(2.4, -.6); ctx.moveTo(-1.6, -7); ctx.lineTo(-3.6, -5.4); ctx.moveTo(1.6, -7); ctx.lineTo(3.2, -8.6); ctx.stroke();
    ctx.restore(); ctx.fillStyle = 'rgba(30,24,18,.25)'; ell(x, y + .4, 2.4 * s, .5 * s); ctx.fill();
  }
  // Bruegel's crags: steep, fantastical towers of rock with snow on every ledge, blue-green in the cold air
  function crags(rnd, y0, n, x0, x1, cols, hMin = 26, hMax = 70) {
    for (let i = 0; i < n; i++) awWR(x0 + (x1 - x0) * (i + rnd() * .6) / n, 90, rnd, (x, r) => {
      const h = hMin + r() * (hMax - hMin), w = h * (.5 + r() * .3), pts = [x - w * 1.3, y0];
      const peaks = 2 + Math.floor(r() * 2), tops = [];
      for (let k = 0; k <= peaks; k++) { const u = k / peaks, px = x - w + u * w * 2 + (r() - .5) * w * .3, py = y0 - h * (k === 1 ? 1 : .45 + r() * .4);
        pts.push(px - w * .12, py + h * .12, px - w * .04, py, px + w * .05, py + h * .06); tops.push([px, py]); if (k < peaks) pts.push(x - w + (u + .5 / peaks) * w * 2, y0 - h * (.18 + r() * .22)); }
      pts.push(x + w * 1.3, y0);
      ctx.fillStyle = cols[0]; poly(pts); ctx.fill();
      ctx.save(); poly(pts); ctx.clip();
      for (const [px, py] of tops) { ctx.fillStyle = cols[1]; poly([px, py, px + w * .5, y0, px + w * .9, y0]); ctx.fill(); } // the faces turned away from the light
      for (let k = 0; k < 16 + h * .3; k++) { const sx = x - w + r() * w * 2, sy = y0 - r() * h; ctx.fillStyle = r() < .6 ? cols[2] : 'rgba(170,190,186,.8)'; poly([sx - 2 - r() * 4, sy + 1, sx + 2 + r() * 5, sy, sx + 1, sy + 1.5 + r() * 2.2]); ctx.fill(); } // snow lying on the ledges
      for (const [px, py] of tops) { ctx.fillStyle = cols[2]; poly([px - w * .16, py + h * .14, px - w * .04, py, px + w * .07, py + h * .08, px + w * .02, py + h * .16, px - w * .06, py + h * .11]); ctx.fill(); }
      ctx.strokeStyle = 'rgba(30,44,46,.35)'; ctx.lineWidth = .5; ctx.beginPath(); for (let k = 0; k < 8; k++) { const sx = x - w + r() * w * 2; ctx.moveTo(sx, y0 - r() * h * .9); ctx.lineTo(sx + (r() - .5) * 3, y0); } ctx.stroke(); // its fissures
      ctx.restore();
    });
  }
  // the Black Circle as it is seen from far off: a band of dead land on the plain, and over it a dome of dim air, its rim inked
  function circleFar(x, y, w, a = 1) {
    ctx.save(); ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(0, y - 46, 0, y + 4); g.addColorStop(0, 'rgba(40,36,34,0)'); g.addColorStop(.6, 'rgba(40,36,34,.55)'); g.addColorStop(1, 'rgba(26,22,20,.8)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w, y + 3); ctx.quadraticCurveTo(x - w * .7, y - 40, x, y - 48); ctx.quadraticCurveTo(x + w * .7, y - 40, x + w, y + 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#211C1A'; ctx.beginPath(); ctx.ellipse(x, y + 1, w, 4.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(120,112,100,.6)'; ctx.beginPath(); ctx.ellipse(x, y + .4, w * .86, 2.6, 0, 0, TAU); ctx.fill(); // the grey inside the ring
    ctx.strokeStyle = 'rgba(10,8,8,.7)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(x - w, y + 2); ctx.quadraticCurveTo(x - w * .7, y - 40, x, y - 48); ctx.quadraticCurveTo(x + w * .7, y - 40, x + w, y + 2); ctx.stroke();
    for (let i = 0; i < 9; i++) { const k = (i + .5) / 9 - .5; ctx.fillStyle = '#16120F'; ctx.fillRect(x + k * w * 1.7, y - 3 - Math.abs(Math.sin(i * 7.1)) * 4, .9, 3 + Math.abs(Math.sin(i * 3.3)) * 4); } // dead trees on the rim
    ctx.restore();
  }
  function fieldsFar(rnd, th, f) {
    AW_SUN = -1; W8.smoke = null;
    // the crags on the horizon, two ranges deep; then the whole valley seen from the hilltop: snowfields, a frozen river,
    // ponds with skaters, hamlets and their churches, and lines of black hedgerow trees
    crags(rnd, 150, 5, 0, AW_W, ['#8EA29C', '#6E8480', '#E2E4DA'], 18, 46);
    hazeBand(f, th.haze, 112, 152, .3);
    crags(rnd, 160, 4, 120, AW_W + 120, ['#748882', '#566A66', '#DCDED2'], 30, 74);
    hazeBand(f, th.haze, 140, 166, .3);
    { const g = ctx.createLinearGradient(0, 152, 0, T); g.addColorStop(0, '#CDD0C4'); g.addColorStop(.5, '#DAD8CC'); g.addColorStop(1, '#E4E0D4'); ctx.fillStyle = g; ctx.fillRect(0, 150, AW_W, T - 150); }
    for (let i = 0; i < 40; i++) { const x = rnd() * AW_W, y = 156 + rnd() * 80; awWrap(x, 40, (x) => awSoft(x, y, 30 + rnd() * 30, 4, rnd() < .5 ? '150,166,166' : '246,244,236', .3)); } // the fields modelled in long strokes
    { const rv = awWave(5, [[1, 14], [2, 6], [5, 3]]); ctx.strokeStyle = PAL.ice; ctx.lineWidth = 4; ctx.beginPath(); for (let x = 0; x <= AW_W; x += 8) { const y = 186 + rv(x); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.strokeStyle = 'rgba(214,232,226,.7)'; ctx.lineWidth = 1.2; ctx.stroke(); } // the river, frozen
    for (let i = 0; i < 6; i++) awWR(rnd() * AW_W, 90, rnd, (x, r) => { // the frozen ponds, green as bottle glass, with the skaters on them
      const y = 168 + r() * 60, d = (y - 160) / 80, w = 16 + d * 46 + r() * 20; ctx.fillStyle = PAL.ice; ell(x, y, w, 2 + d * 5); ctx.fill();
      ctx.fillStyle = 'rgba(206,226,218,.65)'; ell(x - w * .2, y - .8 - d, w * .55, .6 + d * 1.2); ctx.fill();
      ctx.strokeStyle = 'rgba(40,64,62,.4)'; ctx.lineWidth = .4; ctx.beginPath(); for (let k = 0; k < 3; k++) { const sx = x - w * .8 + r() * w * 1.6; ctx.moveTo(sx, y - .5); ctx.quadraticCurveTo(sx + 4, y + 1, sx + 10 * d + 3, y - .2); } ctx.stroke();
      for (let k = 0; k < 3 + Math.floor(r() * 6); k++) skater(x + (r() - .5) * w * 1.5, y + (r() - .5) * (2 + d * 4), .3 + d * .45, r);
    });
    for (let i = 0; i < 6; i++) awWR(i * 213 + rnd() * 80, 60, rnd, (x, r) => { // hamlets at every depth of the valley
      const y = 166 + r() * 56, s = .3 + (y - 160) / 80 * .5;
      for (let k = 0; k < 2 + Math.floor(r() * 3); k++) cottage(x + (k - 1.5) * 30 * s + r() * 6, y + r() * 3, (18 + r() * 8) * s, (10 + r() * 5) * s, r, {});
      if (r() < .45) church(x + 40 * s, y + 2, s * .9, r);
    });
    for (let i = 0; i < 9; i++) awWR(rnd() * AW_W, 60, rnd, (x, r) => { const y = 162 + r() * 70, s = .25 + (y - 160) / 80 * .5; for (let k = 0; k < 6; k++) bareTree(x + k * 9 * s, y, 26 * s + r() * 10 * s, r, { snow: false, col: 'rgba(42,34,28,.85)' }); }); // hedgerows
    for (let i = 0; i < 14; i++) awWR(rnd() * AW_W, 120, rnd, (x, r) => { const y = 160 + r() * 74, d = (y - 158) / 80, L = 40 + r() * 120; ctx.strokeStyle = `rgba(60,52,42,${.35 + d * .3})`; ctx.lineWidth = .5 + d; ctx.setLineDash([1 + d * 2, 1.4 + d]); ctx.beginPath(); ctx.moveTo(x - L, y); ctx.quadraticCurveTo(x, y + (r() - .5) * 8 * d, x + L, y + (r() - .5) * 6); ctx.stroke(); ctx.setLineDash([]); }); // fields walled by hedges and fences
    // the Black Circle on the horizon, low and wide, under the far crags
    awWrap(860, 160, (x) => circleFar(x, 156, 130, .95));
    hazeBand(f, th.haze, 200, T, .2);
  }
  function fieldsMid(rnd) {
    AW_SUN = -1; W8.smoke = [];
    // the brow of the hill the hunters come down: a bank of snow, the inn and its neighbours, the tall trees full of crows
    { ctx.fillStyle = '#E8E4D8'; ctx.beginPath(); ctx.moveTo(0, T); const hw = awWave(3, [[2, 3], [5, 1.5]]); for (let x = 0; x <= AW_W; x += 12) ctx.lineTo(x, T - 10 + hw(x)); ctx.lineTo(AW_W, T); ctx.fill(); }
    for (let i = 0; i < 40; i++) { const x = rnd() * AW_W, y = T - 6 - rnd() * 6; dab(x, y, 3 + rnd() * 5, rnd() < .5 ? 'rgba(164,178,182,.45)' : 'rgba(255,253,246,.6)', 1); }
    for (let i = 0; i < 3; i++) awWR(100 + i * 420 + rnd() * 80, 60, rnd, (x, r) => { // houses on the brow
      const n = 1 + Math.floor(r() * 2); for (let k = 0; k < n; k++) cottage(x + k * 50, T - 6, 34 + r() * 12, 20 + r() * 8, r, { timber: r() < .4 });
    });
    awWR(620, 60, rnd, (x, r) => { // the inn: its sign hanging by one hinge, a fire of straw burning in the yard
      cottage(x, T - 6, 56, 28, r, { wall: '#9E8468', timber: true });
      ctx.strokeStyle = '#2A1E16'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + 30, T - 28); ctx.lineTo(x + 46, T - 28); ctx.stroke();
      ctx.save(); ctx.translate(x + 44, T - 28); ctx.rotate(.5); ctx.fillStyle = '#C2B49A'; ctx.fillRect(-1, 0, 10, 12); ctx.fillStyle = '#5A3A26'; ctx.fillRect(1, 2, 6, 7); ctx.fillStyle = '#E8DCC0'; ctx.fillRect(3, 3.5, 2, 3); ctx.restore();
      W8.fires = W8.fires || []; W8.fires.push([x - 44, T - 8]);
      ctx.fillStyle = '#3A2A1E'; ell(x - 44, T - 7, 9, 2.4); ctx.fill(); ctx.fillStyle = '#C86A2A'; ell(x - 44, T - 9, 4, 3); ctx.fill(); ctx.fillStyle = '#F0B050'; ell(x - 44, T - 10, 2, 2); ctx.fill();
      for (const [dx, f2] of [[-58, 1], [-30, -1]]) { ctx.save(); ctx.translate(x + dx, T - 6); ctx.scale(f2 * .9, .9); ctx.fillStyle = '#2A1E16'; poly([-2, -12, 2, -12, 3, -5, 1, 0, -1, 0, -3, -5]); ctx.fill(); circle(0, -14, 2); ctx.fill(); ctx.fillStyle = '#8A2A22'; ctx.fillRect(-2, -10, 4, 3); ctx.restore(); } // the women at the fire
    });
    awWR(300, 60, rnd, (x, r) => { // the hunters coming home with their hounds, heads down, one with a fox on his spear
      for (let k = 0; k < 3; k++) { const hx = x + k * 18; ctx.save(); ctx.translate(hx, T - 5); ctx.fillStyle = '#1E1812';
        poly([-3, -14, 3, -14, 4, -6, 2, 0, -2, 0, -4, -6]); ctx.fill(); circle(1, -16.5, 2.2); ctx.fill(); ctx.strokeStyle = '#1E1812'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(-5, 0); ctx.moveTo(3, -6); ctx.lineTo(5, 0); ctx.stroke();
        ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(-6, -24); ctx.lineTo(6, -4); ctx.stroke(); if (k === 1) { ctx.fillStyle = '#A0582A'; ell(-5, -22, 3, 1.4, .9); ctx.fill(); } ctx.restore(); }
      for (let k = 0; k < 5; k++) { const dx = x - 20 + k * 13 + r() * 4; ctx.fillStyle = '#2A2018'; ell(dx, T - 8, 4, 1.8); ctx.fill(); ctx.fillRect(dx - 3.4, T - 8, .8, 4); ctx.fillRect(dx + 2.4, T - 8, .8, 4); ell(dx + 4, T - 10, 1.6, 1.2); ctx.fill(); }
    });
    for (let i = 0; i < 7; i++) awWR(rnd() * AW_W, 70, rnd, (x, r) => bareTree(x, T - 6 - r() * 4, 110 + r() * 80, r, { crows: 3 + Math.floor(r() * 5) }));
    awWR(1010, 40, rnd, (x, r) => gibbetWheel(x, T - 8, 1, r));
    hazeBand(ctx, '214,220,208', T - 30, T, .14);
  }
  // a breaking-wheel raised on a pole, crows on its rim (the Triumph of Death keeps them on every hill)
  function gibbetWheel(x, base, s, rnd) {
    ctx.strokeStyle = '#2A1E16'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x, base - 44 * s); ctx.stroke();
    ctx.strokeStyle = '#3A2A1E'; ctx.lineWidth = 1.6 * s; ctx.beginPath(); ctx.ellipse(x, base - 46 * s, 11 * s, 3.2 * s, 0, 0, TAU); ctx.stroke();
    ctx.lineWidth = .7 * s; ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; ctx.moveTo(x, base - 46 * s); ctx.lineTo(x + Math.cos(a) * 11 * s, base - 46 * s + Math.sin(a) * 3.2 * s); } ctx.stroke();
    for (let k = 0; k < 3; k++) crowSil(x + (k - 1) * 8 * s, base - 48 * s, .8 * s, k % 2 ? 1 : -1);
  }
  let rutC = [];
  function fieldsFloor(rnd, th) {
    // the snow of the field: warm white, blue where it is trodden down and in the ruts of the carts
    { const g = ctx.createLinearGradient(0, T - 4, 0, VH); g.addColorStop(0, '#E4E0D2'); g.addColorStop(.4, '#D8D6CA'); g.addColorStop(1, '#B6BCB6'); ctx.fillStyle = g; ctx.fillRect(0, T - 4, AW_W, VH - T + 4); }
    for (let i = 0; i < 420; i++) { const x = rnd() * AW_W, y = T + rnd() * (VH - T); dab(x, y, 2 + rnd() * 5, rnd() < .45 ? 'rgba(150,166,172,.18)' : 'rgba(255,253,246,.25)', 1); }
    // the road: two ruts of brown slush, straw trodden into them, running the length of the field
    for (const ry of [T + 44, T + 58, T + 82, T + 96]) { const wv = awWave(ry, [[1, 1.5], [3, .8]]); ctx.strokeStyle = 'rgba(110,92,70,.42)'; ctx.lineWidth = 3.4; ctx.beginPath(); for (let x = -10; x <= AW_W + 10; x += 20) { const y = ry + Math.sin(x * .013 + ry) * 3 + wv(x); x < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); ctx.strokeStyle = 'rgba(70,56,42,.3)'; ctx.lineWidth = 1; ctx.stroke(); }
    for (let i = 0; i < 160; i++) { const x = rnd() * AW_W, y = T + 40 + rnd() * 66; ctx.strokeStyle = rnd() < .5 ? 'rgba(196,164,96,.75)' : 'rgba(150,120,70,.6)'; ctx.lineWidth = .7; ctx.beginPath(); const a = rnd() * 3; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 4, y + Math.sin(a) * 1.4); ctx.stroke(); } // straw
    for (let i = 0; i < 40; i++) { const x = rnd() * AW_W, y = T + 30 + rnd() * 80; for (let k = 0; k < 5; k++) { ctx.fillStyle = 'rgba(120,136,146,.35)'; ell(x + k * 7, y + (k % 2) * 3, 1.6, .9); ctx.fill(); } } // footprints going off
    for (let i = 0; i < 90; i++) { const x = rnd() * AW_W, y = T + rnd() * (VH - T); ctx.strokeStyle = 'rgba(70,60,40,.7)'; ctx.lineWidth = .6; ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(x + k * 1.4, y); ctx.lineTo(x + k * 1.4 + (rnd() - .5) * 3, y - 3 - rnd() * 4); } ctx.stroke(); } // dead grass through the snow
    // the far edge: a low wattle fence and a ditch, snow drifted against it
    ctx.fillStyle = 'rgba(160,172,176,.55)'; ctx.fillRect(0, T - 3, AW_W, 5);
    for (let x = 3; x < AW_W; x += 22) { ctx.fillStyle = '#3A2C20'; ctx.fillRect(x, T - 16, 2.2, 15); ctx.fillStyle = PAL.snow; ctx.fillRect(x - .4, T - 17, 3, 1.6); }
    ctx.strokeStyle = '#4A3826'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, T - 11); ctx.lineTo(AW_W, T - 11); ctx.moveTo(0, T - 6); ctx.lineTo(AW_W, T - 6); ctx.stroke();
    ctx.fillStyle = 'rgba(236,232,220,.9)'; for (let x = 0; x < AW_W; x += 11) ell(x + 5, T - 1, 8, 2.4); ctx.fill();
    const sh = ctx.createLinearGradient(0, VH - 34, 0, VH - 6); sh.addColorStop(0, 'rgba(60,70,80,0)'); sh.addColorStop(1, 'rgba(60,70,80,.3)'); ctx.fillStyle = sh; ctx.fillRect(0, VH - 34, AW_W, 28);
  }
  // falling snow, fixed in the world so nothing swims as the view moves; big near flakes drift slower
  function liveSnow(camX, t, n, y0, y1, a0 = .8) {
    for (let i = 0; i < n; i++) { const r = hsh(i * 3.1), sp = 14 + r * 26, life = ((t * sp / (y1 - y0)) + hsh(i)) % 1, wx = hsh(i + 7) * 1280, x = ((wx - camX * (.3 + r * .6)) % 1280 + 1280) % 1280 - 320 + Math.sin(t * .8 + i) * 8 * (1 + r), y = lerp(y0, y1, life);
      if (x < -10 || x > VW + 10) continue; ctx.fillStyle = `rgba(250,250,246,${a0 * (.45 + r * .55) * Math.min(1, life * 6, (1 - life) * 6)})`; circle(x, y, .7 + r * 1.2); ctx.fill(); }
  }
  // smoke off the chimneys and the straw fire, drawn live over the mid layer (it scrolls at .45)
  function liveSmoke(camX, t) {
    const pts = W8.smokeL || []; const ox = -((camX * .45) % 1280);
    for (const [sx, sy] of pts) for (const tile of [0, 1280]) { const x = sx + ox + tile; if (x < -40 || x > VW + 40) continue;
      for (let k = 0; k < 4; k++) { const life = ((t * .12 + k / 4 + hsh(sx)) % 1); softDab(x + life * 18 + Math.sin(t + k) * 2, sy - life * 36, 3 + life * 9, '214,212,204', .28 * (1 - life)); } }
  }
  THEMES.lorraine = {
    name: 'the winter fields', sky: ['#5E7A76', '#86A096', '#B4C0B0', '#D4D6C6'], sun: [0.3, -0.7, '255,250,236'], haze: '206,212,200',
    floorA: '#DEDAD0', floorB: '#B6BCB6', path: '#A08A68', skyKind: 'none',
    grade: { desat: .1, top: 'rgba(80,120,120,.32)', bot: 'rgba(240,226,200,.3)', vig: 'rgba(30,32,30,.5)' },
    liveSky(camX, t) {
      for (let i = 0; i < 7; i++) { const life = ((t * .018 + hsh(i)) % 1), x = lerp(VW + 40, -60, life) + Math.sin(t * .3 + i) * 10, y = Y_OFF + 30 + hsh(i + 3) * 60 + Math.sin(t * .5 + i * 2) * 6; crowFly(x, y, .7 + hsh(i + 5) * .5, t * 1.6 + hsh(i) * 3, .85); }
      liveSmoke(camX, t);
    },
    liveFloor(camX, t) { liveSnow(camX, t, 70, Y_OFF, VH, .75); },
  };
  { const _f = fieldsMid; AW_MID.lorraine = (rnd) => { W8.fires = []; _f(rnd); W8.smokeL = (W8.smoke || []).concat(W8.fires.map(([x, y]) => [x, y - 4])); W8.smoke = null; }; }
  AW_FAR.lorraine = fieldsFar; AW_FLOOR.lorraine = fieldsFloor;
  W8.art = { bareTree, crowSil, crowFly, cottage, church, skater, crags, circleFar, gibbetWheel, liveSnow };

  // ======================================================================================================
  // THE EDGE OF THE CIRCLE: Bruegel's Harvesters, left standing. The wheat was never cut and has gone over, black in
  // places; the reapers lie where they sat down to eat under the pear tree. A post-mill, a church in the elms, a hazy
  // country going down to the sea; and over the right of the sky, close now, the dim wall of the Circle
  // ======================================================================================================
  // a stand of wheat: a mass of stalks leaning together, ears catching the light, blight creeping in at the foot
  function wheatStand(x, base, w, h, rnd, blight = 0) {
    const g = ctx.createLinearGradient(0, base - h, 0, base); g.addColorStop(0, '#E2B856'); g.addColorStop(.5, '#C8962E'); g.addColorStop(1, '#8A6420');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w / 2, base); for (let k = 0; k <= 12; k++) { const u = k / 12; ctx.lineTo(x - w / 2 + u * w, base - h * (.82 + Math.sin(u * 9 + x) * .1 + hsh(x + k) * .12)); } ctx.lineTo(x + w / 2, base); ctx.fill();
    for (let i = 0; i < w * 1.4; i++) { const sx = x - w / 2 + rnd() * w, sy = base - h * (.7 + rnd() * .3); ctx.strokeStyle = rnd() < .5 ? 'rgba(250,224,150,.8)' : 'rgba(150,104,30,.7)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 1 + rnd() * 1.5, sy - 2.5 - rnd() * 2); ctx.stroke(); } // the ears
    ctx.strokeStyle = 'rgba(110,74,20,.45)'; ctx.lineWidth = .5; ctx.beginPath(); for (let i = 0; i < w * .5; i++) { const sx = x - w / 2 + rnd() * w; ctx.moveTo(sx, base); ctx.lineTo(sx + (rnd() - .3) * 4, base - h * (.4 + rnd() * .4)); } ctx.stroke();
    if (blight > 0) { ctx.save(); ctx.globalAlpha = blight; for (let i = 0; i < w * .5; i++) dab(x - w / 2 + rnd() * w, base - rnd() * h * .7, 2 + rnd() * 4, rnd() < .6 ? '#2A2220' : '#4A3E36', .8); ctx.restore(); }
  }
  // a stook: sheaves stood up together to dry
  function stook(x, base, s, rnd) {
    for (let k = -2; k <= 2; k++) { ctx.save(); ctx.translate(x + k * 2.2 * s, base); ctx.rotate(k * .12); ctx.fillStyle = k % 2 ? '#C89838' : '#D8AA48'; poly([-2.4 * s, 0, 2.4 * s, 0, 1.2 * s, -9 * s, 3 * s, -14 * s, -3 * s, -14 * s, -1.2 * s, -9 * s]); ctx.fill(); ctx.fillStyle = '#7A5418'; ctx.fillRect(-1.6 * s, -9.5 * s, 3.2 * s, 1 * s); ctx.restore(); }
    ctx.fillStyle = 'rgba(70,46,14,.4)'; ell(x, base, 8 * s, 1.6 * s); ctx.fill();
  }
  // the pear tree the reapers sit under: a gnarled trunk, a round crown of dark leaf dabs, pears in it
  function pearTree(x, base, h, rnd) {
    ctx.strokeStyle = '#3A2A1C'; ctx.lineCap = 'round'; ctx.lineWidth = h * .06; ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x - 4, base - h * .3, x + 2, base - h * .55); ctx.stroke();
    ctx.lineWidth = h * .03; ctx.beginPath(); ctx.moveTo(x + 1, base - h * .45); ctx.lineTo(x - h * .25, base - h * .7); ctx.moveTo(x + 2, base - h * .5); ctx.lineTo(x + h * .28, base - h * .74); ctx.stroke();
    const cx = x, cy = base - h * .74, R = h * .38;
    for (let i = 0; i < 70; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R, lx = cx + Math.cos(a) * d * 1.2, ly = cy + Math.sin(a) * d * .8; const lit = (lx - cx) * AW_SUN + (cy - ly) > 0; inkDab(lx, ly, 2.4 + rnd() * 3, lit ? (rnd() < .5 ? '#6E7A3A' : '#808A44') : (rnd() < .5 ? '#3E4A22' : '#4A5428')); }
    for (let i = 0; i < 9; i++) { const a = rnd() * TAU, d = rnd() * R * .8; ctx.fillStyle = '#C8B040'; ell(cx + Math.cos(a) * d, cy + Math.sin(a) * d * .7, 1.2, 1.6); ctx.fill(); }
  }
  // a post-mill on its mound: the body turned to the wind on one great post, four sails of lattice and cloth
  function postMill(x, base, s, rnd, rot = .3) {
    ctx.fillStyle = '#8E7A58'; ell(x, base, 26 * s, 6 * s); ctx.fill();
    ctx.strokeStyle = '#3A2A1C'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(x - 9 * s, base); ctx.lineTo(x, base - 14 * s); ctx.lineTo(x + 9 * s, base); ctx.moveTo(x, base); ctx.lineTo(x, base - 18 * s); ctx.stroke();
    ctx.fillStyle = '#7A5A3A'; ctx.fillRect(x - 8 * s, base - 40 * s, 16 * s, 22 * s); ctx.fillStyle = '#5A402A'; ctx.fillRect(x - 8 * s, base - 40 * s, 5 * s, 22 * s);
    ctx.fillStyle = '#5E4430'; poly([x - 9 * s, base - 40 * s, x, base - 47 * s, x + 9 * s, base - 40 * s]); ctx.fill();
    ctx.strokeStyle = '#2A1E14'; ctx.lineWidth = .6 * s; ctx.beginPath(); for (let k = 1; k < 5; k++) { ctx.moveTo(x - 8 * s, base - 40 * s + k * 4.4 * s); ctx.lineTo(x + 8 * s, base - 40 * s + k * 4.4 * s); } ctx.stroke();
    const hx = x + 9 * s, hy = base - 34 * s; for (let k = 0; k < 4; k++) { const a = rot + k * TAU / 4; ctx.save(); ctx.translate(hx, hy); ctx.rotate(a); ctx.strokeStyle = '#2A1E14'; ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -30 * s); ctx.stroke();
      ctx.fillStyle = 'rgba(220,206,176,.85)'; ctx.fillRect(.6 * s, -29 * s, 5 * s, 22 * s); ctx.strokeStyle = 'rgba(60,44,30,.7)'; ctx.lineWidth = .4 * s; ctx.beginPath(); for (let j = 0; j < 5; j++) { ctx.moveTo(.6 * s, -29 * s + j * 5 * s); ctx.lineTo(5.6 * s, -29 * s + j * 5 * s); } ctx.stroke(); ctx.restore(); }
    ctx.fillStyle = '#2A1E14'; circle(hx, hy, 1.6 * s); ctx.fill();
  }
  // a reaper asleep or eating at the foot of the tree: a lump of linen and leather, a jug, a scythe left lying
  function reaper(x, base, s, rnd, pose) {
    ctx.save(); ctx.translate(x, base); ctx.scale(s, s);
    const shirt = rnd() < .5 ? '#E6DCC2' : '#D8C8A2';
    if (pose === 'sleep') { ctx.fillStyle = shirt; ell(0, -3, 9, 3.2, -.1); ctx.fill(); ctx.fillStyle = '#6A4A30'; ell(7, -2, 5, 2.4); ctx.fill(); ctx.fillStyle = '#C8946A'; circle(-9, -5, 2.4); ctx.fill(); ctx.strokeStyle = '#2A1E14'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(-12, 0); ctx.stroke(); }
    else { ctx.fillStyle = shirt; poly([-3, -12, 3, -12, 5, -4, -5, -4]); ctx.fill(); ctx.fillStyle = '#6A4A30'; ell(0, -3, 6, 2.4); ctx.fill(); ctx.fillStyle = '#C8946A'; circle(0, -14.5, 2.4); ctx.fill(); ctx.fillStyle = '#8A6A3A'; ctx.fillRect(3, -9, 3, 3); }
    ctx.strokeStyle = '#4A3A26'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(22, -4); ctx.stroke(); ctx.strokeStyle = '#9AA0A4'; ctx.beginPath(); ctx.moveTo(22, -4); ctx.quadraticCurveTo(28, -6, 30, -2); ctx.stroke();
    ctx.restore();
  }
  // the wall of the Circle, seen from its edge: a dim curtain of grey air rising off the land, its rim inked across the sky
  function circleWall(x, top, base, w, rnd) {
    const g = ctx.createLinearGradient(x - w, 0, x + w * .3, 0); g.addColorStop(0, 'rgba(60,56,52,0)'); g.addColorStop(.5, 'rgba(70,64,58,.45)'); g.addColorStop(1, 'rgba(56,50,46,.7)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w, base); ctx.quadraticCurveTo(x - w * .4, top + 20, x + w * .4, top); ctx.lineTo(x + w * 1.4, top - 10); ctx.lineTo(x + w * 1.4, base); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(20,16,14,.65)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - w, base); ctx.quadraticCurveTo(x - w * .4, top + 20, x + w * .4, top); ctx.lineTo(x + w * 1.4, top - 10); ctx.stroke();
    for (let i = 0; i < 26; i++) { const u = rnd(), px = lerp(x - w, x + w * .4, u), py = lerp(base, top, Math.sqrt(u)); ctx.strokeStyle = 'rgba(30,26,22,.35)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 8 + rnd() * 12, py + 30 + rnd() * 40); ctx.stroke(); } // falling streaks, like rain that does not fall
  }
  function edgeFar(rnd, th, f) {
    AW_SUN = -1;
    // a hazy country going down to the sea: blue hills, a bay with ships at anchor, a town, all in the heat of late summer
    { const hy = awHills(150, [[2, 8], [5, 4]], 11, '#8E9C9C', '#B6BEB4', .5); }
    { ctx.fillStyle = '#A8B4B0'; ctx.fillRect(0, 158, AW_W, 10); ctx.fillStyle = 'rgba(236,236,216,.5)'; ctx.fillRect(0, 158, AW_W, 1.2); } // the sea
    for (let i = 0; i < 6; i++) awWR(rnd() * AW_W, 20, rnd, (x, r) => { const y = 160 + r() * 6; ctx.fillStyle = '#4A3A2C'; poly([x - 5, y, x + 5, y, x + 3, y + 2, x - 3, y + 2]); ctx.fill(); ctx.strokeStyle = '#4A3A2C'; ctx.lineWidth = .4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 7); ctx.stroke(); ctx.fillStyle = '#E8E0C8'; poly([x + .4, y - 7, x + 4, y - 3, x + .4, y - 1.5]); ctx.fill(); });
    awHills(176, [[1, 10], [3, 5], [8, 2]], 13, '#9E9A6E', '#C8C08A', .6);
    awHills(196, [[2, 8], [4, 5]], 17, '#B49A52', '#D8BC6A', .7);
    for (let i = 0; i < 5; i++) awWR(i * 256 + rnd() * 90, 70, rnd, (x, r) => { const y = 178 + r() * 22; for (let k = 0; k < 4; k++) cottage(x + (k - 2) * 12, y, 10, 6, r, { wall: '#C8B898', roof: '#8A4A30', chimney: false }); for (let k = 0; k < 5; k++) inkDab(x - 30 + k * 14 + r() * 4, y - 4 - r() * 4, 4 + r() * 3, '#5A6234'); });
    for (let i = 0; i < 40; i++) { const x = rnd() * AW_W, y = 196 + rnd() * 40; awWrap(x, 30, (x) => awSoft(x, y, 20 + rnd() * 30, 3, rnd() < .5 ? '230,200,120' : '150,120,60', .35)); } // the fields of the far slopes, cut and uncut
    hazeBand(f, th.haze, 140, 200, .35);
    // the Circle, close now: its wall stands over the right of the land
    awWrap(980, 260, (x) => circleWall(x, 70, 210, 210, mulberry(31)));
    hazeBand(f, th.haze, 205, T, .25);
  }
  function edgeMid(rnd) {
    AW_SUN = -1;
    // the wheat, standing, over the brow of the field; the pear tree, the reapers under it, stooks, a mill, a church in elms
    for (let i = 0; i < 4; i++) awWR(150 + i * 320 + rnd() * 60, 40, rnd, (x, r) => { for (let k = 0; k < 4; k++) inkDab(x - 20 + k * 12 + r() * 4, T - 50 - r() * 10, 9 + r() * 5, r() < .5 ? '#4E5A2A' : '#5E6A32'); // elms round the church
      cottage(x, T - 20, 30, 16, r, { wall: '#C4B49A', roof: '#7A4A30', chimney: false }); const tx = x + 14; ctx.fillStyle = '#B4A48A'; ctx.fillRect(tx, T - 64, 9, 44); ctx.fillStyle = '#86765E'; ctx.fillRect(tx, T - 64, 3, 44); ctx.fillStyle = '#6A4A34'; poly([tx - 1, T - 64, tx + 4.5, T - 80, tx + 10, T - 64]); ctx.fill(); });
    awWR(820, 70, rnd, (x, r) => postMill(x, T - 34, 1.1, r, .35));
    for (let x = 0; x < AW_W; x += 38) wheatStand(x + rnd() * 20, T - 2, 46, 34 + rnd() * 14, rnd, Math.max(0, Math.sin(x / AW_W * TAU * 2) - .3) * 1.4);
    awWR(420, 60, rnd, (x, r) => { pearTree(x, T - 4, 120, r); reaper(x - 18, T - 4, 1, r, 'sleep'); reaper(x + 14, T - 4, 1, r, 'eat'); reaper(x + 34, T - 2, .9, r, 'eat'); });
    for (let i = 0; i < 10; i++) awWR(rnd() * AW_W, 12, rnd, (x, r) => stook(x, T - 2 - r() * 4, 1.2 + r() * .4, r));
    awWR(1140, 40, rnd, (x, r) => gibbetWheelHarvest(x, T - 6, r));
    hazeBand(ctx, '226,212,170', T - 40, T, .12);
  }
  // the wheel on its pole again, here over the harvest, with a gallows beside it and a raven on the beam
  function gibbetWheelHarvest(x, base, rnd) {
    W8.art.gibbetWheel(x, base, 1.1, rnd);
    ctx.strokeStyle = '#2A1E14'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x + 24, base); ctx.lineTo(x + 24, base - 46); ctx.lineTo(x + 44, base - 46); ctx.moveTo(x + 24, base - 38); ctx.lineTo(x + 32, base - 46); ctx.stroke();
    ctx.strokeStyle = '#6A5A40'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(x + 40, base - 46); ctx.lineTo(x + 40, base - 34); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x + 40, base - 32, 2, 2.6, 0, 0, TAU); ctx.stroke();
    W8.art.crowSil(x + 36, base - 47, .9, -1);
  }
  function edgeFloor(rnd, th) {
    // the stubble of the one strip that was cut before they stopped: ochre rows, sheaves lying, a dust road, black blight
    { const g = ctx.createLinearGradient(0, T - 4, 0, VH); g.addColorStop(0, '#C8A458'); g.addColorStop(.45, '#B8924A'); g.addColorStop(1, '#8A6A34'); ctx.fillStyle = g; ctx.fillRect(0, T - 4, AW_W, VH - T + 4); }
    for (let row = 0, y = T + 4; y < VH; row++, y += 7 + row * 1.2) { ctx.strokeStyle = `rgba(110,76,26,${.3 + row * .03})`; ctx.lineWidth = .6 + row * .08; ctx.beginPath(); for (let x = 0; x < AW_W; x += 3 + row * .3) { const h = 2 + row * .5 + hsh(x + row * 13) * 2; ctx.moveTo(x, y); ctx.lineTo(x + .6, y - h); } ctx.stroke();
      ctx.strokeStyle = `rgba(246,220,150,${.35})`; ctx.lineWidth = .5; ctx.beginPath(); for (let x = 1.5; x < AW_W; x += 5 + row * .5) { ctx.moveTo(x, y); ctx.lineTo(x + .5, y - 2 - row * .4); } ctx.stroke(); }
    for (let i = 0; i < 240; i++) dab(rnd() * AW_W, T + rnd() * (VH - T), 2 + rnd() * 5, rnd() < .5 ? 'rgba(236,206,130,.22)' : 'rgba(96,66,26,.2)', 1);
    { const wv = awWave(77, [[1, 6], [3, 3]]); const g = ctx.createLinearGradient(0, T + 40, 0, T + 80); g.addColorStop(0, 'rgba(206,182,130,0)'); g.addColorStop(.3, 'rgba(206,182,130,.8)'); g.addColorStop(.7, 'rgba(186,160,110,.8)'); g.addColorStop(1, 'rgba(186,160,110,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, T + 40 + wv(0)); for (let x = 0; x <= AW_W; x += 10) ctx.lineTo(x, T + 40 + wv(x)); for (let x = AW_W; x >= 0; x -= 10) ctx.lineTo(x, T + 80 + wv(x)); ctx.fill(); } // the dust road
    for (let i = 0; i < 26; i++) { const x = rnd() * AW_W, y = T + 10 + rnd() * 90; ctx.save(); ctx.translate(x, y); ctx.rotate((rnd() - .5) * .6); ctx.fillStyle = '#C89A3A'; ell(0, 0, 9, 2.4); ctx.fill(); ctx.fillStyle = '#E2B85A'; ell(-2, -.8, 6, 1.2); ctx.fill(); ctx.fillStyle = '#7A5418'; ctx.fillRect(-1, -2.4, 2, 4.8); ctx.restore(); } // sheaves
    for (let i = 0; i < 14; i++) { const x = rnd() * AW_W, y = T + 14 + rnd() * 90, r = 6 + rnd() * 12; for (let k = 0; k < 7; k++) dab(x + (rnd() - .5) * r * 2, y + (rnd() - .5) * r * .5, 2 + rnd() * r * .4, rnd() < .5 ? 'rgba(40,32,28,.55)' : 'rgba(70,60,52,.4)', 1); } // the blight
    for (let i = 0; i < 5; i++) { const x = rnd() * AW_W, y = T + 20 + rnd() * 80; ctx.strokeStyle = '#4A3A26'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 20, y - 3); ctx.stroke(); ctx.strokeStyle = '#8A9094'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x + 20, y - 3); ctx.quadraticCurveTo(x + 27, y - 6, x + 30, y - 1); ctx.stroke(); } // scythes left lying
    // the far edge: the uncut wheat begins, a wall of it
    for (let x = 0; x < AW_W; x += 3) { const h = 10 + hsh(x) * 6; ctx.strokeStyle = hsh(x + 1) < .5 ? '#D0A040' : '#A87A2A'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, T + 2); ctx.lineTo(x + (hsh(x + 2) - .5) * 3, T - h); ctx.stroke(); }
    const sh = ctx.createLinearGradient(0, VH - 34, 0, VH - 6); sh.addColorStop(0, 'rgba(60,40,20,0)'); sh.addColorStop(1, 'rgba(60,40,20,.3)'); ctx.fillStyle = sh; ctx.fillRect(0, VH - 34, AW_W, 28);
  }
  THEMES.lorraine2 = {
    name: 'the edge of the circle', sky: ['#7A8288', '#A6A898', '#CEC6A0', '#E2D6A8'], sun: [0.22, -0.5, '255,236,190'], haze: '222,212,176',
    floorA: '#C8A458', floorB: '#8A6A34', path: '#C8B488', skyKind: 'none',
    grade: { desat: .08, top: 'rgba(110,110,130,.3)', bot: 'rgba(240,200,120,.34)', vig: 'rgba(40,30,20,.55)' },
    liveSky(camX, t) { for (let i = 0; i < 5; i++) { const life = ((t * .012 + hsh(i + 9)) % 1), x = lerp(-60, VW + 60, life), y = Y_OFF + 24 + hsh(i + 4) * 70; W8.art.crowFly(x, y, .6 + hsh(i) * .4, t * 1.4 + i, .8); } },
    liveFloor(camX, t) { // chaff and thistledown drifting over the field in the heat
      for (let i = 0; i < 40; i++) { const r = hsh(i * 1.7), life = ((t * (.04 + r * .05)) + hsh(i)) % 1, wx = hsh(i + 3) * 1280, x = ((wx - camX * (.5 + r * .5) + life * 260) % 1280 + 1280) % 1280 - 320, y = T - 60 + hsh(i + 5) * 150 + Math.sin(t + i) * 10;
        if (x < -5 || x > VW + 5) continue; ctx.fillStyle = `rgba(255,240,196,${.55 * Math.sin(life * Math.PI)})`; circle(x, y, .7 + r); ctx.fill(); } },
  };
  AW_FAR.lorraine2 = edgeFar; AW_MID.lorraine2 = edgeMid; AW_FLOOR.lorraine2 = edgeFloor;
  Object.assign(W8.art, { wheatStand, stook, pearTree, postMill, reaper, circleWall });

  // ======================================================================================================
  // THE HEART OF THE CIRCLE: inside, the world is a painting nobody finished: grisaille, the grey underpainting, with
  // the underdrawing showing through in loose strokes. The rim of the Circle rises all round like a crater wall; Boschian
  // shapes stand in the grey distance; a ring of fused standing stones; and in the middle, the hole they came through.
  // The only colour left is the Goat-Lord's vermilion
  // ======================================================================================================
  const GR = (k, a = 1) => { const v = Math.round(lerp(38, 226, k)); return a >= 1 ? `rgb(${v},${v - 4},${v - 12})` : `rgba(${v},${v - 4},${v - 12},${a})`; };
  // loose underdrawing: a few quick, overlapping strokes of a hard black chalk
  function sketch(pts, rnd, a = .35, w = .6) {
    ctx.strokeStyle = `rgba(24,20,16,${a})`; ctx.lineWidth = w; ctx.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) { ctx.beginPath(); for (let i = 0; i < pts.length; i += 2) { const x = pts[i] + (rnd() - .5) * 2.4, y = pts[i + 1] + (rnd() - .5) * 2.4; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
  }
  function hatchRect(x, y, w, h, rnd, a = .18, step = 3, ang = .9) {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.strokeStyle = `rgba(24,20,16,${a})`; ctx.lineWidth = .5; ctx.beginPath();
    for (let k = -h; k < w + h; k += step) { ctx.moveTo(x + k, y + h); ctx.lineTo(x + k + h * ang, y); } ctx.stroke(); ctx.restore();
  }
  // a Boschian shape in the grey distance: an ear-tower, a cracked egg-house, a jug on legs, a tree-man
  function boschForm(x, base, s, kind, rnd) {
    ctx.save(); ctx.translate(x, base); ctx.scale(s, s);
    if (kind === 0) { // the tree-man: a broken egg for a body on two hollow tree-trunk legs standing in a pool
      ctx.fillStyle = GR(.42); poly([-14, 0, -10, -40, -6, -40, -8, 0]); ctx.fill(); poly([6, 0, 8, -42, 12, -42, 14, 0]); ctx.fill();
      ctx.fillStyle = GR(.7); ctx.beginPath(); ctx.ellipse(0, -52, 22, 14, -.2, 0, TAU); ctx.fill(); ctx.fillStyle = GR(.22); ctx.beginPath(); ctx.ellipse(-6, -50, 12, 8, -.2, 0, TAU); ctx.fill();
      ctx.fillStyle = GR(.5); poly([-8, -64, 10, -64, 6, -72, -4, -72]); ctx.fill(); ctx.fillStyle = GR(.62); circle(2, -76, 5); ctx.fill();
      ctx.fillStyle = GR(.3, .6); ctx.beginPath(); ctx.ellipse(0, 0, 26, 3, 0, 0, TAU); ctx.fill();
    } else if (kind === 1) { // a pair of ears with a blade between them, as big as a church
      ctx.fillStyle = GR(.6); ctx.beginPath(); ctx.ellipse(-10, -24, 10, 24, -.15, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(10, -24, 10, 24, .15, 0, TAU); ctx.fill();
      ctx.fillStyle = GR(.35); ctx.beginPath(); ctx.ellipse(-10, -24, 5, 16, -.15, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(10, -24, 5, 16, .15, 0, TAU); ctx.fill();
      ctx.fillStyle = GR(.85); poly([-2, -10, 2, -10, 3, -66, 0, -72, -3, -66]); ctx.fill();
    } else if (kind === 2) { // a burnt town: gables and a tower, smoke standing up from it in columns
      for (let k = 0; k < 5; k++) { ctx.fillStyle = GR(.3 + k * .04); const hx = -30 + k * 13; poly([hx - 6, 0, hx - 6, -10 - k % 2 * 4, hx, -18 - k % 2 * 4, hx + 6, -10 - k % 2 * 4, hx + 6, 0]); ctx.fill(); }
      ctx.fillStyle = GR(.26); ctx.fillRect(14, -36, 9, 36);
      for (let k = 0; k < 3; k++) { const sx = -20 + k * 18; for (let j = 0; j < 7; j++) { ctx.fillStyle = GR(.55 + j * .04, .35); circle(sx + Math.sin(j * 1.3 + k) * 4, -20 - j * 9, 5 + j * 1.6); ctx.fill(); } }
    } else { // a great jug on spindly legs, a ladder up its side
      ctx.fillStyle = GR(.56); ctx.beginPath(); ctx.moveTo(-12, -14); ctx.quadraticCurveTo(-20, -40, -6, -54); ctx.lineTo(-4, -64); ctx.lineTo(4, -64); ctx.lineTo(6, -54); ctx.quadraticCurveTo(20, -40, 12, -14); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = GR(.25); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-8, -14); ctx.lineTo(-12, 0); ctx.moveTo(8, -14); ctx.lineTo(12, 0); ctx.moveTo(0, -14); ctx.lineTo(1, 0); ctx.stroke();
      ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(14, -20); ctx.lineTo(20, -50); ctx.moveTo(17, -20); ctx.lineTo(23, -50); for (let j = 0; j < 7; j++) { ctx.moveTo(15 + j * .85, -22 - j * 4); ctx.lineTo(18 + j * .85, -22 - j * 4); } ctx.stroke();
    }
    ctx.restore();
  }
  // a standing stone of the ring, fused and pitted as if it had been in a fire hotter than any forge
  function ringStone(x, base, w, h, rnd, fallen) {
    if (fallen) { ctx.fillStyle = GR(.34); poly([x - w * 1.6, base, x - w * 1.4, base - w * .9, x + w * 1.5, base - w * .8, x + w * 1.6, base]); ctx.fill(); ctx.fillStyle = GR(.56); poly([x - w * 1.4, base - w * .9, x + w * 1.5, base - w * .8, x + w * 1.2, base - w * 1.02, x - w * 1.2, base - w * 1.05]); ctx.fill(); return; }
    const lean = (rnd() - .5) * w * .5, pts = [x - w / 2, base, x - w * .55 + lean * .5, base - h * .6, x - w * .36 + lean, base - h, x + w * .3 + lean, base - h * .96, x + w * .52 + lean * .5, base - h * .5, x + w / 2, base];
    ctx.fillStyle = GR(.38); poly(pts); ctx.fill();
    ctx.save(); poly(pts); ctx.clip();
    ctx.fillStyle = GR(.62); poly([x - w * .1 + lean, base - h, x + w * .3 + lean, base - h * .96, x + w * .52 + lean * .5, base - h * .5, x + w / 2, base, x + w * .1, base]); ctx.fill(); // the face toward the light
    for (let i = 0; i < 14; i++) { ctx.fillStyle = GR(rnd() < .5 ? .18 : .78, .5); circle(x + (rnd() - .5) * w, base - rnd() * h, .8 + rnd() * 1.6); ctx.fill(); } // pitting
    hatchRect(x - w, base - h, w, h, rnd, .22, 2.6);
    ctx.restore();
    sketch(pts, rnd, .4, .7);
  }
  // a pennon of the Goat on its pole: the one colour left here (vermilion, a black goat's head in a roundel)
  function goatBanner(x, base, h, rnd) {
    ctx.strokeStyle = GR(.2); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x, base - h); ctx.stroke();
    const top = base - h + 3, L = 26 + rnd() * 10;
    ctx.fillStyle = PAL.verm; ctx.beginPath(); ctx.moveTo(x, top); ctx.quadraticCurveTo(x + L * .5, top - 2, x + L, top + 4); ctx.lineTo(x + L * .7, top + 7); ctx.lineTo(x + L, top + 11); ctx.quadraticCurveTo(x + L * .5, top + 13, x, top + 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(80,10,4,.5)'; ctx.fillRect(x, top + 9, L * .8, 5);
    ctx.fillStyle = '#1C1612'; circle(x + 9, top + 7, 3.2); ctx.fill(); ctx.strokeStyle = '#1C1612'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(x + 7, top + 4.4); ctx.quadraticCurveTo(x + 4, top + 1, x + 6, top - 1); ctx.moveTo(x + 11, top + 4.4); ctx.quadraticCurveTo(x + 14, top + 1, x + 12, top - 1); ctx.stroke();
  }
  // a dead tree in the grey, its branches twisted into knots
  function deadTree(x, base, h, rnd) { W8.art.bareTree(x, base, h, rnd, { col: GR(.18), snow: false }); }
  function heartFar(rnd, th, f) {
    AW_SUN = 1;
    // the panel's ground: grey wash laid unevenly over a gesso of warm white, the underdrawing hatched into the sky
    for (let i = 0; i < 40; i++) { const x = rnd() * AW_W, y = 30 + rnd() * 160; awWrap(x, 80, (x) => awSoft(x, y, 50 + rnd() * 70, 10 + rnd() * 16, rnd() < .5 ? '120,114,104' : '206,200,186', .22)); }
    ctx.strokeStyle = 'rgba(30,26,20,.08)'; ctx.lineWidth = .5; ctx.beginPath(); for (let i = 0; i < 160; i++) { const x = rnd() * AW_W, y = 30 + rnd() * 140, L = 10 + rnd() * 30; ctx.moveTo(x, y); ctx.lineTo(x + L, y - L * .5); } ctx.stroke();
    // the rim of the Circle, rising all round like the wall of a crater, darker toward its lip
    const rim = awWave(41, [[1, 22], [2, 10], [5, 4], [11, 1.5]]);
    { ctx.beginPath(); ctx.moveTo(0, T); for (let x = 0; x <= AW_W; x += 8) ctx.lineTo(x, 132 + rim(x)); ctx.lineTo(AW_W, T); const g = ctx.createLinearGradient(0, 100, 0, T); g.addColorStop(0, GR(.22)); g.addColorStop(1, GR(.5)); ctx.fillStyle = g; ctx.fill(); }
    for (let i = 0; i < 70; i++) { const x = rnd() * AW_W, y = 140 + rim(x) + rnd() * 30; ctx.strokeStyle = 'rgba(20,16,12,.3)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 2, y - 6 - rnd() * 6); ctx.stroke(); } // dead stumps along it
    { ctx.strokeStyle = 'rgba(16,12,10,.6)'; ctx.lineWidth = 1.1; ctx.beginPath(); for (let x = 0; x <= AW_W; x += 8) { const y = 132 + rim(x); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
    hazeBand(f, '180,174,160', 120, 190, .4);
    for (let i = 0; i < 7; i++) awWR(i * 182 + rnd() * 60, 50, rnd, (x, r) => boschForm(x, 176 + r() * 16, .6 + r() * .5, i % 4, r));
    hazeBand(f, '180,174,160', 170, T, .35);
  }
  function heartMid(rnd) {
    AW_SUN = 1;
    { ctx.fillStyle = GR(.46); ctx.beginPath(); ctx.moveTo(0, T); const hw = awWave(9, [[2, 4], [7, 2]]); for (let x = 0; x <= AW_W; x += 10) ctx.lineTo(x, T - 18 + hw(x)); ctx.lineTo(AW_W, T); ctx.fill(); }
    for (let i = 0; i < 12; i++) awWR(rnd() * AW_W, 30, rnd, (x, r) => deadTree(x, T - 14, 60 + r() * 60, r));
    for (let i = 0; i < 9; i++) awWR(40 + i * 142 + rnd() * 30, 30, rnd, (x, r) => ringStone(x, T - 4 - r() * 4, 16 + r() * 10, 50 + r() * 36, r, r() < .2));
    for (let i = 0; i < 4; i++) awWR(100 + i * 320 + rnd() * 50, 40, rnd, (x, r) => goatBanner(x, T - 6, 64 + r() * 20, r));
    hazeBand(ctx, '200,194,180', T - 40, T, .14);
  }
  function heartFloor(rnd, th) {
    // ash and cracked clay, grey on grey, the underdrawing's lines still in it; a ring is cut into the ground round the hole
    { const g = ctx.createLinearGradient(0, T - 4, 0, VH); g.addColorStop(0, GR(.66)); g.addColorStop(.5, GR(.56)); g.addColorStop(1, GR(.36)); ctx.fillStyle = g; ctx.fillRect(0, T - 4, AW_W, VH - T + 4); }
    for (let i = 0; i < 320; i++) dab(rnd() * AW_W, T + rnd() * (VH - T), 2 + rnd() * 6, rnd() < .5 ? GR(.8, .2) : GR(.2, .18), 1);
    ctx.strokeStyle = 'rgba(20,16,12,.32)'; ctx.lineWidth = .6; ctx.beginPath();
    for (let i = 0; i < 70; i++) { let x = rnd() * AW_W, y = T + 6 + rnd() * (VH - T - 10); ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { x += 6 + rnd() * 12; y += (rnd() - .5) * 6; ctx.lineTo(x, y); } } ctx.stroke(); // the cracks of the clay
    ctx.strokeStyle = 'rgba(24,20,16,.12)'; ctx.lineWidth = .5; ctx.beginPath(); for (let i = 0; i < 400; i++) { const x = rnd() * AW_W, y = T + rnd() * (VH - T); ctx.moveTo(x, y); ctx.lineTo(x + 3, y - 3); } ctx.stroke(); // hatching
    for (let i = 0; i < 30; i++) { const x = rnd() * AW_W, y = T + 10 + rnd() * 90; ctx.fillStyle = GR(.2, .5); ell(x, y, 2 + rnd() * 3, 1); ctx.fill(); ctx.fillStyle = GR(.85, .5); ell(x - .6, y - .5, 1.4, .5); ctx.fill(); } // stones
    for (let i = 0; i < 8; i++) { const x = rnd() * AW_W, y = T + 20 + rnd() * 80; ctx.strokeStyle = GR(.9, .7); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 7, y - 1); ctx.moveTo(x + 2, y + 1.6); ctx.lineTo(x + 6, y - 2); ctx.stroke(); } // bones
    const sh = ctx.createLinearGradient(0, VH - 34, 0, VH - 6); sh.addColorStop(0, 'rgba(20,16,12,0)'); sh.addColorStop(1, 'rgba(20,16,12,.35)'); ctx.fillStyle = sh; ctx.fillRect(0, VH - 34, AW_W, 28);
  }
  // the hole the things came through: a pit in the ground at the back of the arena, fused rock round its lip
  W8.pitX = () => (typeof stage !== 'undefined' && stage ? stage.len - VW / 2 : 0);
  function drawPit(camX, t, open = 1) {
    const x = W8.pitX() - camX + 60, y = T + 16;
    if (x < -120 || x > VW + 120) return;
    ctx.save(); ctx.fillStyle = GR(.2); ctx.beginPath(); ctx.ellipse(x, y, 70 * open + 8, 12 * open + 2, 0, 0, TAU); ctx.fill();
    const g = ctx.createRadialGradient(x, y + 2, 2, x, y, 66 * open); g.addColorStop(0, '#060504'); g.addColorStop(.8, '#16120F'); g.addColorStop(1, 'rgba(30,26,22,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y + 1, 64 * open, 10 * open, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = GR(.7, .7); ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, 70 * open + 6, 12 * open + 1.6, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    for (let i = 0; i < 6; i++) { const life = ((t * .2 + i / 6) % 1); softDab(x + Math.sin(i * 2.1 + t * .3) * 40 * open, y - life * 60, 10 + life * 16, '60,54,48', .25 * (1 - life) * open); } // dim air breathing out of it
    ctx.restore();
  }
  THEMES.lorraineBoss = {
    name: 'the heart of the circle', sky: ['#6E6A62', '#8E897E', '#B2AC9E', '#C8C2B2'], sun: [0.7, -0.8, '240,234,220'], haze: '186,180,166',
    floorA: GR(.66), floorB: GR(.36), path: GR(.6), skyKind: 'none',
    grade: { desat: .4, top: 'rgba(90,86,80,.35)', bot: 'rgba(160,150,130,.3)', vig: 'rgba(16,12,10,.62)' },
    liveSky(camX, t) { for (let i = 0; i < 26; i++) { const life = ((t * .03 + hsh(i)) % 1), x = ((hsh(i + 2) * 1280 - camX * .3 + Math.sin(t * .4 + i) * 20) % 1280 + 1280) % 1280 - 300, y = lerp(Y_OFF, T, life); if (x < 0 || x > VW) continue; ctx.fillStyle = `rgba(60,56,50,${.5 * Math.sin(life * Math.PI)})`; ctx.save(); ctx.translate(x, y); ctx.rotate(t + i); ctx.fillRect(-1.6, -.5, 3.2, 1); ctx.restore(); } }, // ash coming down
    liveFloor(camX, t) { if (stage && stage.bossRoom) { ctx.save(); ctx.globalCompositeOperation = 'source-over'; drawPit(camX, t, W8.pitOpen ?? 1); ctx.restore(); } },
  };
  AW_FAR.lorraineBoss = heartFar; AW_MID.lorraineBoss = heartMid; AW_FLOOR.lorraineBoss = heartFloor;
  Object.assign(W8.art, { GR, sketch, hatchRect, boschForm, ringStone, goatBanner, drawPit });

  // ======================================================================================================
  // THE PEOPLE OF LORRAINE AND THE MEN OF THE CIRCLE: Bruegel's figures (squat, round-headed, wrapped in wool), and the
  // things the Circle makes of them
  // ======================================================================================================
  // a limb from three joints, two tapered strips meeting at the middle one
  function limb3(ax, ay, bx, by, cx, cy, w0, w1, w2, col, o) { w0 *= 1.3; w1 *= 1.3; w2 *= 1.3;
    strip(ax, ay, (ax + bx) / 2, (ay + by) / 2, bx, by, w0, w1, col, o);
    strip(bx, by, (bx + cx) / 2, (by + cy) / 2, cx, cy, w1, w2, col, o);
  }
  // a knee from a hip and a foot, bent to the front by a leg of length L
  function knee(hx, hy, fx, fy, L, dir = 1) { const dx = fx - hx, dy = fy - hy, d = Math.hypot(dx, dy) || 1, h = Math.sqrt(Math.max(0, L * L - d * d / 4)); return [hx + dx / 2 + (-dy / d) * h * -dir, hy + dy / 2 + (dx / d) * h * -dir]; }
  // a clumsy wooden-soled shoe, a lump of leather
  function shoe(x, y, col = '#2A1E16', s = 1) { cel(PB([x - 3 * s, y, x - 2.4 * s, y - 3.6 * s, x + 3 * s, y - 3.4 * s, x + 6 * s, y - .6 * s, x + 4.6 * s, y + .6 * s]), col, { d: .9, r: .4, w: 1.1 }); }
  // a hand: a mitten of a fist, as the painters of peasants made them
  function fist(x, y, col = '#D6A27A', s = 1) { cel(PE(x, y, 2.4 * s, 2.1 * s), col, { d: .7, r: .4, w: 1 }); }
  // a Bruegel face: a round head, a lump of a nose, bead eyes, a slash of mouth, cheeks reddened by the cold
  function peasantHead(x, y, s, o = {}) {
    const skin = o.skin || '#D8A07A';
    cel(PE(x, y, 6 * s, 6.4 * s), skin, { d: 1.2, r: .6, w: 1.3, tex: () => { ctx.fillStyle = 'rgba(200,70,50,.35)'; circle(x + 2.6 * s, y + 1.6 * s, 2 * s); ctx.fill(); } });
    if (o.hood) cel(PB([x - 7 * s, y + 4 * s, x - 7.4 * s, y - 5 * s, x - 2 * s, y - 8.6 * s, x + 4 * s, y - 8 * s, x + 7 * s, y - 4 * s, x + 4.6 * s, y - 2 * s, x - 1 * s, y - 3 * s, x - 3 * s, y + 6 * s]), o.hood, { d: 1.2, r: .5, w: 1.2 });
    if (o.cap) cel(PB([x - 6.6 * s, y - 2 * s, x - 5 * s, y - 7.6 * s, x + 2 * s, y - 8.4 * s, x + 6.8 * s, y - 4.4 * s, x + 6 * s, y - 2.4 * s]), o.cap, { d: 1, r: .5, w: 1.1 });
    if (o.coif) { cel(PB([x - 7 * s, y + 6 * s, x - 7.2 * s, y - 4 * s, x - 2 * s, y - 8 * s, x + 4.4 * s, y - 7.4 * s, x + 6.6 * s, y - 3 * s, x + 4 * s, y - 3.6 * s, x - 2 * s, y - 2 * s, x - 2.4 * s, y + 7 * s]), o.coif, { d: 1, r: .6, w: 1.1 }); }
    if (DET()) {
      bead(x + 2.4 * s, y - .6 * s, .85 * s);
      ctx.fillStyle = C(shade(skin, -.2)); ell(x + 5.4 * s, y + 1 * s, 1.8 * s, 1.5 * s); ctx.fill();
      ctx.strokeStyle = C('#5A2A1E'); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(x + 2.2 * s, y + 3.6 * s); ctx.lineTo(x + 4.4 * s, y + 3.4 * s); ctx.stroke();
    }
  }
  // ---------------- the villagers: they run from the Circle, and you can save them ----------------
  // kinds: 'wife' (a woman with a bundle and a child on her hip), 'old' (an old man on a stick), 'man' (a man with a
  // basket of hens on his back). They are not enemies: the 'w8flight' rule moves and draws them
  const VLOOK = {
    wife: { dress: '#5A6A84', apron: '#E6DCC4', coif: '#EEE6D2', skin: '#DAA27E', shoe: '#3A2A1E' },
    old: { dress: '#7A5A3E', hood: '#4A3A2C', skin: '#C88E6A', shoe: '#2A1E16', hose: '#5A4A3A' },
    man: { dress: '#9A3A2A', cap: '#2E2A26', skin: '#D49A72', shoe: '#2A1E16', hose: '#6A5A3E' },
  };
  function villager(v, t) {
    const L = VLOOK[v.kind], run = v.state === 'run' ? 1 : 0, ph = v.walk || 0, s = v.kind === 'old' ? .92 : 1;
    const hurt = v.hurtT > 0, dead = v.state === 'dead', fear = v.state === 'cower';
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (dead) { ctx.translate(0, -2); ctx.rotate(-1.4); ctx.translate(16, 2); }
    ctx.scale(s, s);
    const sw = Math.sin(ph) * (run ? 1 : .4), bob = run ? Math.abs(Math.cos(ph)) * 2 : 0, lean = run ? .22 : fear ? -.1 : 0;
    ctx.translate(0, -bob);
    const hip = [0, -22], f1 = [sw * 9, 0], f2 = [-sw * 9, 0];
    if (fear) { f1[0] = 4; f2[0] = -4; }
    const legC = L.hose || '#3A3430';
    { const k = knee(hip[0], hip[1], f2[0], f2[1] - (sw < 0 && run ? 3 : 0), 12.5); limb3(hip[0] - 1, hip[1], k[0], k[1], f2[0], f2[1] - 2, 4.6, 3.6, 3, shade(legC, -.25)); shoe(f2[0], f2[1], L.shoe, .9); }
    // the far arm, flung back as they run (the wife's holds the bundle)
    const sh = [3 * Math.cos(lean) + lean * 22, -40];
    if (v.kind === 'wife') { cel(PB([sh[0] - 8, sh[1] + 2, sh[0] - 12, sh[1] - 4, sh[0] - 4, sh[1] - 8, sh[0] + 2, sh[1] - 2]), '#C8B48A', { d: 1, r: .5, w: 1.1 }); }
    else if (v.kind === 'man') { cel(PP([sh[0] - 14, sh[1] - 10, sh[0] - 2, sh[1] - 10, sh[0], sh[1] + 10, sh[0] - 12, sh[1] + 10]), '#8A6A3A', { d: 1.2, r: .5, w: 1.2, tex: () => { ctx.strokeStyle = 'rgba(60,40,20,.7)'; ctx.lineWidth = .6; ctx.beginPath(); for (let k = 0; k < 5; k++) { ctx.moveTo(sh[0] - 14, sh[1] - 8 + k * 4); ctx.lineTo(sh[0], sh[1] - 8 + k * 4); } ctx.stroke(); } });
      for (const [hx, hy, c2] of [[-9, -12, '#E8E0D0'], [-4, -13, '#8A5A2A']]) { cel(PE(sh[0] + hx, sh[1] + hy, 3.4, 2.6), c2, { d: .8, r: .4, w: 1 }); fillPoly([sh[0] + hx + 2, sh[1] + hy - 2, sh[0] + hx + 3.4, sh[1] + hy - 4, sh[0] + hx + 3.6, sh[1] + hy - 1.4], '#B8302A'); } } // the hens, looking out
    else { const ex = sh[0] - 6 - sw * 4, ey = sh[1] + 10; limb3(sh[0], sh[1], ex, ey, ex - 3, ey + 9, 3.6, 3, 2.6, shade(L.dress, -.25)); fist(ex - 3, ey + 9, L.skin, .9); }
    // the body: a long smock or gown, belted, swinging
    ctx.save(); ctx.translate(0, hip[1]); ctx.rotate(lean); ctx.translate(0, -hip[1]);
    const hem = v.kind === 'wife' ? -4 : -14, flare = run ? 3 : 1.5;
    cel(PB([-6, -42, 6, -42, 9, -26, 9 + flare - sw * 2, hem, 0, hem + 1.5, -9 - flare - sw * 2, hem, -8, -26]), L.dress, { d: 2.4, r: .9, w: 1.5, tex: () => {
      ctx.strokeStyle = 'rgba(20,14,10,.35)'; ctx.lineWidth = .7; ctx.beginPath(); for (let k = -1; k <= 1; k++) { ctx.moveTo(k * 3, -36); ctx.quadraticCurveTo(k * 4 - sw, -24, k * 5 - sw * 2, hem + 1); } ctx.stroke();
      if (v.kind === 'wife') { ctx.fillStyle = C(L.apron); poly([-1, -32, 7, -32, 9 - sw, -6, 1 - sw, -5]); ctx.fill(); }
      ctx.fillStyle = 'rgba(40,24,14,.7)'; ctx.fillRect(-8, -28, 17, 2);
    } });
    if (v.kind === 'wife') { cel(PE(7, -36, 4.4, 5.4), '#D8A07A', { d: .9, r: .4, w: 1.1 }); peasantHead(9, -44, .55, { skin: '#E4B08A', cap: '#B83A2A' }); } // the child on her hip
    ctx.restore();
    // the near arm: reaching ahead, waving, or (the old man) on his stick
    { const sx = sh[0] + 2, sy = sh[1] + 1;
      if (v.kind === 'old') { const hx = sx + 9, hy = sy + 8; limb3(sx, sy, sx + 5, sy + 8, hx, hy, 3.6, 3, 2.6, L.dress); ctx.strokeStyle = C('#5A4026'); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(hx + 1, hy - 4); ctx.lineTo(hx + 3 + sw * 3, 0); ctx.stroke(); fist(hx, hy, L.skin, .9); }
      else { const up = fear ? -1 : run ? .4 + sw * .6 : .2, ex = sx + 6, ey = sy + 7 - up * 4, hx = sx + 11 + up * 2, hy = sy + 3 - up * 12; limb3(sx, sy, ex, ey, hx, hy, 3.8, 3.2, 2.8, L.dress); fist(hx, hy, L.skin, .9); } }
    { const k = knee(hip[0], hip[1], f1[0], f1[1] - (sw > 0 && run ? 3 : 0), 12.5); limb3(hip[0] + 1, hip[1], k[0], k[1], f1[0], f1[1] - 2, 4.8, 3.8, 3.2, legC); shoe(f1[0], f1[1], L.shoe, .95); }
    peasantHead(sh[0] + 1 + lean * 6, -49, 1, { skin: L.skin, hood: L.hood, cap: L.cap, coif: L.coif });
    if (DET() && (fear || hurt)) { ctx.strokeStyle = C('#3A1A10'); ctx.lineWidth = .8; ctx.beginPath(); ctx.ellipse(sh[0] + 4 + lean * 6, -45, 1.4, 1.8, 0, 0, TAU); ctx.stroke(); } // a mouth open in a cry
    ctx.restore();
  }
  W8.villager = villager;

  // ---------------- THE HOLLOW: what is left of a villager the Circle has had. Grey all through, as if the painter had
  // stopped at the underpainting; no face, only the burned ring on the brow; a threshing flail it never lets go of ------
  CREATURES.w8hollow = function (e, a) {
    a = a || {}; const t = a.t || 0, st = e.state, ph = a.walk || 0, wind = a.wind || 0;
    const flail = (st === 'wind' && e.plan === 'w8flail'), grab = (st === 'wind' && e.plan === 'w8grab') || (st === 'w8act' && e.w8a === 'grab'), sm2 = st === 'w8act' && e.w8a === 'flail';
    const jerk = Math.sin(t * 9 + (e.walk || 0)) * (ph ? 1.4 : .5) * (hsh(Math.floor(t * 6) + e.x * .01) > .7 ? 1 : 0); // it moves in jerks, like a thing on strings
    const skin = '#A8A094', cloth = '#7A746A', dk = '#3E3A34';
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.translate(jerk * .4, 0);
    const lean = grab ? .3 + (st === 'w8act' ? .2 : wind * .2) : flail ? -.2 * wind : sm2 ? .25 : .12, sw = Math.sin(ph * .8) * 7;
    const hip = [0, -27];
    { const f = [-sw, 0], k = knee(hip[0], hip[1], f[0], -1, 14.6); limb3(-1, hip[1], k[0], k[1], f[0], -2, 5, 3.8, 3, '#5E5850'); cel(PE(f[0] + 1.6, -1.2, 3.6, 1.6), '#2E2A26', { d: .6, r: .3, w: 1 }); } // bare feet, grey
    // the far arm, hanging longer than an arm should
    const sx = lean * 26 - 2, sy = -48;
    if (!(flail || sm2)) { const r = grab ? (st === 'w8act' ? 1 : wind) : 0, ex = sx + 4 + r * 10, ey = sy + 14 - r * 10, hx = sx + 6 + r * 22, hy = sy + 26 - r * 18; limb3(sx, sy, ex, ey, hx, hy, 3.6, 3, 2.4, shade(skin, -.3)); fingers(hx, hy, r * .8 + .3, '#8E867A'); }
    ctx.save(); ctx.translate(0, hip[1]); ctx.rotate(lean); ctx.translate(0, -hip[1]);
    cel(PB([-7, -50, 7, -50, 10, -34, 11 - sw * .2, -18, 3, -15, -6, -19, -11 - sw * .2, -17, -9, -34]), cloth, { d: 2.6, r: .8, w: 1.5, dark: '#4A4640', tex: () => {
      ctx.strokeStyle = 'rgba(20,18,14,.4)'; ctx.lineWidth = .6; ctx.beginPath(); for (let k = 0; k < 9; k++) { const x = -10 + k * 2.6; ctx.moveTo(x, -18 + (k % 2) * 2); ctx.lineTo(x + 1, -22); } ctx.stroke(); // its rags
      ctx.strokeStyle = 'rgba(30,26,20,.25)'; ctx.lineWidth = .5; ctx.beginPath(); for (let k = 0; k < 12; k++) { const y = -48 + k * 2.6; ctx.moveTo(-8, y); ctx.lineTo(8, y - 4); } ctx.stroke(); // underdrawing hatching through the paint
    } });
    // the head: a blank oval sagging forward, two holes, the ring burned on the brow
    const hx = 3, hy = -58;
    cel(PB([hx - 6, hy + 5, hx - 6.6, hy - 4, hx - 1, hy - 8.4, hx + 5.6, hy - 6, hx + 7, hy + 2, hx + 3, hy + 7.6]), skin, { d: 1.4, r: .7, w: 1.4, dark: '#6E685E' });
    if (DET()) { ctx.fillStyle = C('#1A1714'); ell(hx + 3, hy - .4, 1.3, 1.8); ctx.fill(); ell(hx + 6, hy, .9, 1.6); ctx.fill(); ell(hx + 4.6, hy + 4.4, 1.6, .9); ctx.fill();
      ctx.strokeStyle = C('#14110E'); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.ellipse(hx + 1.4, hy - 5, 3.4, 1.2, -.2, 0, TAU); ctx.stroke(); }
    ctx.restore();
    { const f = [sw, 0], k = knee(hip[0], hip[1], f[0], -1, 14.6); limb3(1, hip[1], k[0], k[1], f[0], -2, 5.2, 4, 3.2, '#6E685E'); cel(PE(f[0] + 1.8, -1.2, 3.8, 1.7), '#3A3630', { d: .6, r: .3, w: 1 }); }
    // the near arm and the flail: two staves on a thong of leather, the swingle whirled up and brought down
    { const r = flail ? wind : sm2 ? 1 : 0, k2 = sm2 ? (e.w8k || 0) : 0, nx = sx + 3, ny = sy + 2;
      const ang = sm2 ? lerp(-2.4, .9, sm(k2 * 1.6)) : flail ? lerp(.8, -2.4, wind) : .9 + Math.sin(t * 1.3) * .08, hx2 = nx + Math.cos(ang) * 14, hy2 = ny + Math.sin(ang) * 14;
      limb3(nx, ny, (nx + hx2) / 2 + 2, (ny + hy2) / 2 + 3, hx2, hy2, 3.8, 3.2, 2.6, skin);
      const sa = ang - .2, s1x = hx2 + Math.cos(sa) * 16, s1y = hy2 + Math.sin(sa) * 16;
      ctx.strokeStyle = C(OUT); ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(hx2 - Math.cos(sa) * 4, hy2 - Math.sin(sa) * 4); ctx.lineTo(s1x, s1y); ctx.stroke(); ctx.strokeStyle = C('#7A6A52'); ctx.lineWidth = 1.8; ctx.stroke();
      const swa = sa + (sm2 ? lerp(-1.5, 1.2, sm(k2 * 1.6)) : flail ? -1.4 * wind : 1.4 + Math.sin(t * 2) * .2), s2x = s1x + Math.cos(swa) * 13, s2y = s1y + Math.sin(swa) * 13;
      ctx.strokeStyle = C('#2A2420'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(s1x, s1y); ctx.lineTo(s1x + Math.cos(swa) * 2, s1y + Math.sin(swa) * 2); ctx.stroke();
      ctx.strokeStyle = C(OUT); ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(s1x + Math.cos(swa) * 2, s1y + Math.sin(swa) * 2); ctx.lineTo(s2x, s2y); ctx.stroke(); ctx.strokeStyle = C('#8E7C60'); ctx.lineWidth = 2; ctx.stroke();
      if (sm2 && k2 > .3 && k2 < .7 && DET()) add(() => { ctx.strokeStyle = 'rgba(230,226,214,.35)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(s1x, s1y, 13, swa - 1.2, swa); ctx.stroke(); });
      fingers(hx2, hy2, .1, '#8E867A'); }
    ctx.restore();
  };
  function fingers(x, y, open, col) { ctx.strokeStyle = C(OUT); ctx.lineWidth = 2.6; ctx.beginPath(); for (let k = -1; k <= 1; k++) { const a = k * (.3 + open * .5); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * (4 + open * 2), y + Math.sin(a) * (4 + open * 2) + 1); } ctx.stroke(); ctx.strokeStyle = C(col); ctx.lineWidth = 1.2; ctx.stroke(); }

  // ---------------- THE MEN OF THE CIRCLE: soldiers it has taken, corpse-pale, in the Goat's vermilion and black, their
  // kettle-hats horned like goats. The billman carries a bill (a hooked blade on a long staff); the crossbowman plants a
  // pavise painted with the goat and shoots from behind it ----------------
  function goatHelm(x, y, s, horn2 = true) {
    if (horn2) horn(x - 2 * s, y - 4 * s, x - 9 * s, y - 9 * s, x - 6 * s, y - 15 * s, 3 * s, .6 * s, '#C8B89A', 1); // the far horn
    cel(PB([x - 9 * s, y + 1 * s, x - 8 * s, y - 6 * s, x, y - 9 * s, x + 8 * s, y - 6 * s, x + 9.5 * s, y + 1 * s, x, y + 2.4 * s]), '#6E6A64', { d: 1.4, r: .8, w: 1.3, dark: '#3A3834', lite: '#B4B0A8' });
    cel(PB([x - 12 * s, y + 1.4 * s, x, y - .6 * s, x + 12.6 * s, y + 1.4 * s, x, y + 3.2 * s]), '#5A5650', { d: .8, r: .6, w: 1.2 }); // the brim
    horn(x + 3 * s, y - 5 * s, x + 12 * s, y - 10 * s, x + 9 * s, y - 17 * s, 3.4 * s, .6 * s, '#DCCCAE', 1.1);
  }
  function goatFace(x, y, s, skin = '#B8BCA8') {
    cel(PB([x - 5 * s, y - 4 * s, x + 5 * s, y - 4.6 * s, x + 6.6 * s, y + 2 * s, x + 4 * s, y + 7 * s, x - 2 * s, y + 6 * s, x - 5.4 * s, y + 1 * s]), skin, { d: 1.2, r: .6, w: 1.2, dark: '#7A806E' });
    if (DET()) { ctx.fillStyle = C('#1A1612'); ctx.fillRect(x + 1 * s, y - 1.6 * s, 3.4 * s, 1 * s); ctx.fillStyle = C('#E8D040'); ctx.fillRect(x + 2.2 * s, y - 1.5 * s, 1 * s, .8 * s); } // a goat's slot of a pupil
    fillPoly([x + 1 * s, y + 6 * s, x + 4 * s, y + 6.4 * s, x + 2.2 * s, y + 12 * s], '#3A342C', .9); // the beard
  }
  function surcoat(e, ph, lean, hem) {
    const sw = Math.sin(ph) * 1.5;
    cel(PB([-8, -50, 8, -50, 11, -32, 12 + sw, hem, 0, hem + 1, -12 + sw, hem, -10, -32]), PAL.verm, { d: 2.6, r: .9, w: 1.5, dark: '#6A1A0E', tex: () => {
      ctx.fillStyle = C('#1C1612'); poly([-12, -32, 12, -32, 13, hem, -13, hem]); ctx.globalAlpha = .9; ctx.fill(); ctx.globalAlpha = 1; // the black lower half: the Goat's colours, per fess
      ctx.fillStyle = C('#1C1612'); circle(1, -42, 3.4); ctx.fill(); ctx.strokeStyle = C('#1C1612'); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(-1, -44.6); ctx.quadraticCurveTo(-4, -48, -2, -50); ctx.moveTo(3, -44.6); ctx.quadraticCurveTo(6, -48, 4, -50); ctx.stroke(); // the goat's head on the breast
      ctx.strokeStyle = 'rgba(255,200,180,.25)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(-6, -36); ctx.quadraticCurveTo(-7, -26, -9, hem); ctx.stroke();
    } });
    cel(PP([-9, -33, 9, -33, 9, -30, -9, -30]), '#3A2A1C', { d: .5, r: .3, w: 1 }); // the belt
  }
  CREATURES.w8halberd = function (e, a) {
    a = a || {}; const t = a.t || 0, st = e.state, ph = a.walk || 0, wind = a.wind || 0;
    const thrust = st === 'w8act' && e.w8a === 'thrust', hook = st === 'w8act' && e.w8a === 'hook', wT = st === 'wind' && e.plan === 'w8thrust', wH = st === 'wind' && e.plan === 'w8hook', swing = st === 'strike' || (st === 'wind' && e.plan === 'swing');
    const k = e.w8k || 0, legC = '#2A2622';
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const sw = Math.sin(ph) * 7, lean = thrust ? .2 : wT ? -.12 * wind : hook ? -.1 : 0, hip = [0, -28];
    { const f = [-sw - (thrust ? 8 : 0), 0], kk = knee(hip[0], hip[1], f[0], -1, 15); limb3(-1, hip[1], kk[0], kk[1], f[0], -2, 5, 4, 3.4, shade(legC, -.2)); shoe(f[0], 0, '#1A1612'); }
    // the bill: a long ash staff, a hooked blade with a spike; held two-handed, levelled at you
    let ang = -1.15 + Math.sin(t * 1.2) * .03, reach = 0;
    if (wT) { ang = lerp(-1.15, -.05, sm(wind)); reach = -8 * wind; }
    if (thrust) { ang = -.05; reach = k < .35 ? lerp(-8, 30, sm(k / .35)) : lerp(30, 0, sm((k - .35) / .65)); }
    if (wH) { ang = lerp(-1.15, -.5, wind); reach = 6 * wind; }
    if (hook) { ang = k < .4 ? lerp(-.5, .15, k / .4) : lerp(.15, -.4, (k - .4) / .6); reach = k < .4 ? 24 * sm(k / .4) : lerp(24, -10, sm((k - .4) / .6)); }
    if (swing) { ang = st === 'strike' ? .4 : lerp(-1.15, -2.2, wind); }
    const gx = 6 + reach * .5, gy = -38, ca = Math.cos(ang), sa = Math.sin(ang), back = 26, fwd = 66;
    const shaft = () => { ctx.beginPath(); ctx.moveTo(gx - ca * back, gy - sa * back); ctx.lineTo(gx + ca * fwd, gy + sa * fwd); };
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 3.8; shaft(); ctx.stroke(); ctx.strokeStyle = C('#8A6E48'); ctx.lineWidth = 2; shaft(); ctx.stroke();
    { const bx = gx + ca * fwd, by = gy + sa * fwd; ctx.save(); ctx.translate(bx, by); ctx.rotate(ang);
      cel(PP([-2, -2, 16, -1, 22, 0, 16, 1, -2, 2]), '#A8ACB0', { d: .6, r: .5, w: 1.1, lite: '#E8ECEE' }); // the spike
      cel(PB([-6, 0, -4, 8, 4, 11, 9, 8, 2, 6, -1, 2]), '#9A9EA2', { d: .8, r: .5, w: 1.1, lite: '#E0E4E6' }); // the blade, curved
      horn(2, -1, 4, -7, 9, -9, 2.4, .4, '#9A9EA2', 1); // the hook
      if (DET() && (thrust && k < .4 || hook && k < .45)) add(() => { ctx.fillStyle = 'rgba(240,244,246,.35)'; ctx.fillRect(-40, -2, 40, 4); });
      ctx.restore(); }
    ctx.save(); ctx.translate(0, hip[1]); ctx.rotate(lean); ctx.translate(0, -hip[1]);
    // mail at the arms and skirt, the surcoat over it
    cel(PB([-9, -30, 9, -30, 11, -16, -11, -16]), '#7A7E80', { d: 1, r: .5, w: 1.2, tex: () => { ctx.strokeStyle = 'rgba(30,30,34,.5)'; ctx.lineWidth = .5; ctx.beginPath(); for (let y = -28; y < -16; y += 2) { ctx.moveTo(-10, y); ctx.lineTo(10, y); } ctx.stroke(); } });
    surcoat(e, ph, lean, -18);
    const hx = 2, hy = -58; goatFace(hx + 1, hy, 1); goatHelm(hx, hy - 3, 1);
    ctx.restore();
    { const f = [sw + (thrust ? 6 : 0), 0], kk = knee(hip[0], hip[1], f[0], -1, 15); limb3(1, hip[1], kk[0], kk[1], f[0], -2, 5.2, 4.2, 3.6, legC); shoe(f[0], 0, '#1A1612'); }
    // both arms on the staff
    for (const [d, col] of [[-12, '#6E7276'], [10, '#8A8E92']]) { const hx = gx + ca * d, hy = gy + sa * d, sx = lean * 24 + (d < 0 ? -2 : 4), sy = -49; limb3(sx, sy, (sx + hx) / 2 + 2, (sy + hy) / 2 + 4, hx, hy, 4, 3.4, 3, col); fist(hx, hy, '#A6AA98', .95); }
    ctx.restore();
  };
  // the pavise: a tall shield of planks, rounded at the head, painted vermilion with the goat in a black roundel
  function pavise(x, y, s, hp, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const path = PB([-8, 0, -9, -28, -6, -40, 0, -43, 6, -40, 9, -28, 8, 0]);
    cel(path, PAL.verm, { d: 2, r: .8, w: 1.5, dark: '#6A1A0E', tex: () => {
      ctx.strokeStyle = 'rgba(40,10,4,.5)'; ctx.lineWidth = .7; ctx.beginPath(); for (const x of [-3, 3]) { ctx.moveTo(x, -42); ctx.lineTo(x, 0); } ctx.stroke(); // the planks
      ctx.fillStyle = C('#1C1612'); circle(0, -24, 5.4); ctx.fill(); ctx.fillStyle = C('#E8DCC4'); ell(0, -23, 2.4, 3); ctx.fill(); horn(-1, -27, -4, -30, -3, -33, 1.6, .3, '#E8DCC4', 0); horn(1, -27, 4, -30, 3, -33, 1.6, .3, '#E8DCC4', 0);
      if (hp < 3) { ctx.strokeStyle = 'rgba(20,10,6,.85)'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(-2, -40); ctx.lineTo(1, -30); ctx.lineTo(-3, -18); if (hp < 2) { ctx.moveTo(5, -36); ctx.lineTo(2, -24); ctx.lineTo(6, -10); } ctx.stroke(); }
      for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(255,220,200,.2)'; circle(-5 + hsh(i) * 10, -38 + hsh(i + 3) * 36, .8); ctx.fill(); }
    } });
    ctx.fillStyle = C('#3A3632'); ctx.fillRect(-1, 0, 2, 4); // the spike it is planted on
    ctx.restore();
  }
  CREATURES.w8xbow = function (e, a) {
    a = a || {}; const t = a.t || 0, st = e.state, ph = a.walk || 0, wind = a.wind || 0;
    const aim = st === 'wind' && e.plan === 'w8bolt', shot = st === 'w8act' && e.w8a === 'bolt', crank = (st === 'w8act' && e.w8a === 'crank') || (st === 'recover' && e.w8span);
    const planted = (e.w8pav || 0) > 0 && !ph;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const sw = Math.sin(ph) * 6, hip = [0, -27], kneel = aim || shot ? 1 : 0;
    { const f = kneel ? [-10, 0] : [-sw, 0], kk = knee(hip[0], hip[1], f[0], -1, 15); limb3(-1, hip[1] + kneel * 4, kk[0], kk[1] + kneel * 3, f[0], -2, 5, 4, 3.4, '#1E1A18'); shoe(f[0], 0, '#141210'); }
    ctx.save(); ctx.translate(0, kneel * 5);
    cel(PB([-9, -30, 9, -30, 10, -17, -10, -17]), '#7A7E80', { d: 1, r: .5, w: 1.2 });
    surcoat(e, ph, 0, -19);
    const hx = 3, hy = -58; goatFace(hx + 1, hy, .95); goatHelm(hx, hy - 3, .95);
    // the crossbow: a stock of dark wood, a steel prod, the string spanned (or slack after the shot), a bolt on it
    const ax = 4, ay = aim || shot ? -46 : crank ? -30 : -36, ang = aim || shot ? 0 : crank ? .9 : .5;
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(ang);
    const spanned = !shot && !crank;
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(16, 0); ctx.stroke(); ctx.strokeStyle = C('#5A3E26'); ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(16, -10); ctx.quadraticCurveTo(spanned ? 12 : 18, 0, 16, 10); ctx.stroke(); ctx.strokeStyle = C('#B8BCC0'); ctx.lineWidth = 1.3; ctx.stroke();
    ctx.strokeStyle = C('#E8E0C8'); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(16, -10); ctx.lineTo(spanned ? 4 : 14, 0); ctx.lineTo(16, 10); ctx.stroke();
    if (spanned) { ctx.strokeStyle = C('#3A2A1C'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(4, -.8); ctx.lineTo(20, -.8); ctx.stroke(); fillPoly([20, -2.2, 24, -.8, 20, .6], '#9A9EA2'); }
    ctx.restore();
    fist(ax + 2, ay + 1, '#A6AA98');
    ctx.restore();
    { const f = kneel ? [8, 0] : [sw, 0], kk = knee(hip[0], hip[1] + kneel * 5, f[0], -1 - kneel * 6, 15); limb3(1, hip[1] + kneel * 5, kk[0], kk[1], f[0], -2 - kneel * 6, 5.2, 4.2, 3.6, '#2A2622'); if (!kneel) shoe(f[0], 0, '#141210'); }
    if ((e.w8pav || 0) > 0) pavise(e.w8pavX ?? 18, 0, 1, e.w8pav, t); // planted in front of him (or carried while he walks)
    ctx.restore();
  };

  // ---------------- THE FLAGELLANT: a hooded penitent of the plague years, his back laid open, scourging himself as he
  // walks; turned on you, the scourge is a fast thing ----------------
  CREATURES.w8flag = function (e, a) {
    a = a || {}; const t = a.t || 0, st = e.state, ph = a.walk || 0, wind = a.wind || 0;
    const lash = st === 'w8act' && e.w8a === 'lash', frenzy = st === 'w8act' && e.w8a === 'frenzy', wL = st === 'wind' && e.plan === 'w8lash', wF = st === 'wind' && e.plan === 'w8frenzy';
    const k = e.w8k || 0;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (frenzy) { ctx.scale(Math.cos(k * TAU * 3) >= 0 ? 1 : -1, 1); }
    const sw = Math.sin(ph) * 7, hip = [0, -25], lean = .35 + (wL ? -.2 * wind : 0);
    { const f = [-sw, 0], kk = knee(hip[0], hip[1], f[0], -1, 13.6); limb3(-1, hip[1], kk[0], kk[1], f[0], -2, 4.4, 3.4, 2.8, '#C8A080'); cel(PE(f[0] + 1.4, -1, 3.2, 1.4), '#8A6A50', { d: .5, r: .3, w: 1 }); } // bare legs
    ctx.save(); ctx.translate(0, hip[1]); ctx.rotate(lean); ctx.translate(0, -hip[1]);
    // the robe of undyed wool, cut away at the back; the back itself, striped with welts
    cel(PB([-7, -46, 6, -47, 9, -30, 10, -12, 0, -10, -10, -12, -9, -30]), '#D6CCB4', { d: 2.4, r: .8, w: 1.5, dark: '#9A8E78', tex: () => {
      ctx.fillStyle = C('#C89A80'); poly([-8, -44, -2, -45, -1, -26, -8, -28]); ctx.fill();
      ctx.strokeStyle = 'rgba(150,30,24,.85)'; ctx.lineWidth = .9; ctx.beginPath(); for (let i = 0; i < 6; i++) { const y = -43 + i * 3; ctx.moveTo(-8, y); ctx.lineTo(-2, y + 2.4); } ctx.stroke();
      ctx.strokeStyle = 'rgba(40,30,20,.35)'; ctx.lineWidth = .6; ctx.beginPath(); for (let i = 0; i < 4; i++) { ctx.moveTo(2 + i * 2, -40); ctx.quadraticCurveTo(3 + i * 2, -24, 2 + i * 2.6, -11); } ctx.stroke();
    } });
    cel(PP([-9, -30, 9, -30, 9, -28, -9, -28]), '#5A4A34', { d: .5, r: .3, w: .9 }); // the rope girdle
    // the tall pointed hood with its eyeholes, the long tail of it down his back
    cel(PB([-6, -44, -4, -56, 0, -66, 3, -71, 7, -56, 9, -46, 2, -42]), '#E2DAC6', { d: 1.6, r: .7, w: 1.4, dark: '#A89E88' });
    if (DET()) { ctx.fillStyle = C('#140E0A'); ell(4.8, -53, 1.1, 1.5); ctx.fill(); ell(7.4, -53, .8, 1.4); ctx.fill(); }
    ctx.restore();
    { const f = [sw, 0], kk = knee(hip[0], hip[1], f[0], -1, 13.6); limb3(1, hip[1], kk[0], kk[1], f[0], -2, 4.6, 3.6, 3, '#D8B090'); cel(PE(f[0] + 1.6, -1, 3.4, 1.5), '#9A7A5E', { d: .5, r: .3, w: 1 }); }
    // the scourge: a short handle, five knotted cords (in the act they stream out at you)
    const sx = lean * 22 + 2, sy = -44;
    let ang = -2.2 + Math.sin(t * 4) * .3, cord = 14;
    if (wL) ang = lerp(-2.2, -3.0, wind);
    if (lash) { const n = Math.floor(k * 3), u = (k * 3) % 1; ang = lerp(-2.8, .5, sm(u * 1.8)) + n * .15; cord = 14 + Math.sin(u * Math.PI) * 26; }
    if (wF) ang = -1.6 + wind * 6;
    if (frenzy) { ang = k * TAU * 3; cord = 34; }
    const hx = sx + Math.cos(ang) * 13, hy = sy + Math.sin(ang) * 13;
    limb3(sx, sy, (sx + hx) / 2, (sy + hy) / 2 + 2, hx, hy, 3.4, 3, 2.6, '#D0A888');
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + Math.cos(ang) * 6, hy + Math.sin(ang) * 6); ctx.stroke(); ctx.strokeStyle = C('#5A3A20'); ctx.lineWidth = 1.6; ctx.stroke();
    const ox = hx + Math.cos(ang) * 6, oy = hy + Math.sin(ang) * 6;
    for (let i = 0; i < 5; i++) { const ca = ang + (i - 2) * .14 + Math.sin(t * 7 + i) * .1 + (lash || frenzy ? 0 : .9), ex = ox + Math.cos(ca) * cord, ey = oy + Math.sin(ca) * cord + (lash || frenzy ? 0 : 6);
      ctx.strokeStyle = C('#3A2A1A'); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.quadraticCurveTo((ox + ex) / 2, (oy + ey) / 2 + 3, ex, ey); ctx.stroke();
      ctx.fillStyle = C('#2A1A10'); for (const u of [.5, 1]) { circle(lerp(ox, ex, u), lerp(oy, ey, u) + (u < 1 ? 1.5 : 0), 1.1); ctx.fill(); } }
    if (DET() && (lash && (k * 3) % 1 < .5 || frenzy)) add(() => { ctx.strokeStyle = 'rgba(255,230,210,.22)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(ox, oy, cord * .8, ang - .8, ang); ctx.stroke(); });
    fist(hx, hy, '#D8B090', .9);
    ctx.restore();
  };

  // ---------------- THE HANGMAN OF THE CIRCLE (the edge's last fight): a head taller than a man, hooded in black, a
  // leather apron, a headsman's axe as long as he is, and a coil of rope with its noose already tied ----------------
  CREATURES.w8hangman = function (e, a) {
    a = a || {}; const t = a.t || 0, st = e.state, ph = a.walk || 0, wind = a.wind || 0, k = e.w8k || 0;
    const wN = st === 'wind' && e.plan === 'w8noose', noose = st === 'w8act' && e.w8a === 'noose', wA = st === 'wind' && e.plan === 'w8axe', axe = st === 'w8act' && e.w8a === 'axe', wS = st === 'wind' && e.plan === 'w8sweep', swp = st === 'w8act' && e.w8a === 'sweep', wG = st === 'wind' && e.plan === 'w8gallows';
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.scale(1.18, 1.18);
    const sw = Math.sin(ph) * 7, hip = [0, -30], lean = axe ? lerp(-.15, .35, sm(k * 2)) : wA ? -.18 * wind : swp ? .1 : 0;
    { const f = [-sw - (axe ? 6 : 0), 0], kk = knee(hip[0], hip[1], f[0], -1, 16); limb3(-1, hip[1], kk[0], kk[1], f[0], -2, 6, 4.6, 3.8, '#2A2420'); shoe(f[0], 0, '#141210', 1.1); }
    // the far arm: the coil of rope, or the noose swung round over his head and thrown
    const sx0 = -3, sy0 = -54;
    if (wN || noose) { const r = wN ? wind : 1, ex = sx0 + 2, ey = sy0 - 10 * r, hx = sx0 + 4, hy = sy0 - 20 * r;
      limb3(sx0, sy0, ex, ey, hx, hy, 4.6, 3.8, 3.2, '#C8A080'); fist(hx, hy, '#C8A080');
      if (wN) { const a2 = t * 12, rx = hx + Math.cos(a2) * 12, ry = hy - 6 + Math.sin(a2) * 4; ctx.strokeStyle = C('#8A7A5A'); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(rx, ry); ctx.stroke(); ctx.beginPath(); ctx.ellipse(rx, ry, 4, 3, a2, 0, TAU); ctx.stroke(); }
    } else { limb3(sx0, sy0, sx0 - 2, sy0 + 12, sx0, sy0 + 22, 4.6, 3.8, 3.2, shade('#C8A080', -.2)); for (let i = 0; i < 4; i++) { ctx.strokeStyle = C(i % 2 ? '#8A7A5A' : '#6A5A40'); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(sx0 - 2, sy0 + 26, 6 - i * .5, 8 - i * .4, .2, 0, TAU); ctx.stroke(); } }
    ctx.save(); ctx.translate(0, hip[1]); ctx.rotate(lean); ctx.translate(0, -hip[1]);
    // bare chest and belly, a leather apron down to the knee, the black hood with its slits
    cel(PB([-10, -58, 10, -58, 12, -44, 11, -30, -11, -30, -12, -44]), '#C8A080', { d: 2.6, r: .9, w: 1.5, dark: '#8A6448', tex: () => { ctx.strokeStyle = 'rgba(90,50,30,.4)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(-6, -48); ctx.quadraticCurveTo(0, -44, 6, -48); ctx.moveTo(0, -44); ctx.lineTo(0, -34); ctx.stroke(); } });
    cel(PB([-11, -36, 11, -36, 12, -10, 0, -8, -12, -10]), '#5A3A22', { d: 2, r: .7, w: 1.4, dark: '#3A2414', tex: () => { ctx.strokeStyle = 'rgba(20,10,4,.45)'; ctx.lineWidth = .6; ctx.beginPath(); for (let i = 0; i < 3; i++) { ctx.moveTo(-6 + i * 5, -34); ctx.lineTo(-7 + i * 6, -10); } ctx.stroke(); ctx.fillStyle = 'rgba(120,20,10,.5)'; for (let i = 0; i < 4; i++) { ell(-4 + hsh(i) * 10, -26 + hsh(i + 2) * 14, 1.6, 2.6); ctx.fill(); } } }); // stained
    cel(PB([-8, -58, -9, -68, -4, -76, 3, -77, 8, -70, 8, -60, 4, -56]), '#16120F', { d: 1.4, r: .9, w: 1.4, lite: '#3E3630' });
    if (DET()) { ctx.fillStyle = C('#E8D8B0'); ctx.fillRect(2, -69, 4.2, 1.1); ctx.fillStyle = C('#C83A2A'); ctx.fillRect(3.4, -68.9, 1, .9); }
    ctx.restore();
    { const f = [sw + (axe ? 8 : 0), 0], kk = knee(hip[0], hip[1], f[0], -1, 16); limb3(1, hip[1], kk[0], kk[1], f[0], -2, 6.2, 4.8, 4, '#3A322C'); shoe(f[0], 0, '#141210', 1.1); }
    // the axe: a long haft, a broad crescent of a head
    let ang = -1.3 + Math.sin(t * 1.1) * .04;
    if (wA) ang = lerp(-1.3, -2.9, sm(wind));
    if (axe) ang = k < .5 ? lerp(-2.9, .9, sm(k * 2.2)) : .9;
    if (wS) ang = lerp(-1.3, -3.6, wind);
    if (swp) ang = lerp(-3.6, 2.6, sm(k));
    if (wG) ang = -1.6;
    const sx = lean * 26 + 4, sy = -54, hx = sx + Math.cos(ang) * 14, hy = sy + Math.sin(ang) * 14, L = 54;
    limb3(sx, sy, (sx + hx) / 2 + 2, (sy + hy) / 2 + 3, hx, hy, 5, 4.2, 3.6, '#C8A080');
    const ex = hx + Math.cos(ang) * L, ey = hy + Math.sin(ang) * L;
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(hx - Math.cos(ang) * 6, hy - Math.sin(ang) * 6); ctx.lineTo(ex, ey); ctx.stroke(); ctx.strokeStyle = C('#6A4E30'); ctx.lineWidth = 2.2; ctx.stroke();
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(ang);
    cel(PB([-8, 0, -6, 7, 0, 16, 6, 18, 9, 10, 6, 1]), '#8E9296', { d: 1.2, r: .8, w: 1.3, lite: '#E2E6E8', dark: '#4E5256' });
    if (DET()) { ctx.strokeStyle = 'rgba(250,252,255,.8)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(0, 16); ctx.quadraticCurveTo(7, 17, 9, 10); ctx.stroke(); }
    ctx.restore();
    if (DET() && (axe && k < .5 || swp)) add(() => { ctx.strokeStyle = 'rgba(240,230,220,.14)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(sx, sy, L + 12, ang - (swp ? 1.4 : .9), ang); ctx.stroke(); });
    fist(hx, hy, '#C8A080', 1.1);
    ctx.restore();
  };
  Object.assign(W8.art, { limb3, knee, shoe, fist, peasantHead, goatHelm, goatFace, pavise });

  // ======================================================================================================
  // BOSCH'S CREATURES, come out of the Circle: a man who wears a church bell, a crow in a funnel hat, an egg on legs
  // ======================================================================================================
  // ---------------- THE BELLMAN: a great bronze bell worn as a hauberk, crown to thigh, with a crack in it to see out of;
  // thick legs in striped hose under it, arms out through two holes, and the clapper torn out for a club. Blows from
  // in front ring off the bronze: take him from behind, or break the bell open with heavy blows ----------------
  function bell(x, y, s, crack, ring, t) {
    const path = PB([x - 15 * s, y, x - 14 * s, y - 14 * s, x - 11 * s, y - 32 * s, x - 7 * s, y - 40 * s, x, y - 42 * s, x + 7 * s, y - 40 * s, x + 11 * s, y - 32 * s, x + 14 * s, y - 14 * s, x + 15 * s, y]);
    const jit = ring ? Math.sin(t * 90) * ring * .8 : 0; ctx.save(); ctx.translate(jit, 0);
    cel(path, '#8A6A34', { d: 3.4, r: 1.4, w: 1.7, dark: '#4A3416', lite: '#D8B060', tex: () => {
      const g = ctx.createLinearGradient(x - 15 * s, 0, x + 15 * s, 0); g.addColorStop(0, 'rgba(30,20,8,.4)'); g.addColorStop(.62, 'rgba(255,230,160,.25)'); g.addColorStop(.75, 'rgba(255,250,220,.4)'); g.addColorStop(1, 'rgba(30,20,8,.3)'); ctx.fillStyle = g; ctx.fillRect(x - 16 * s, y - 44 * s, 32 * s, 46 * s); // round bronze
      ctx.fillStyle = 'rgba(60,140,110,.35)'; for (let i = 0; i < 10; i++) { ell(x + (hsh(i) - .5) * 24 * s, y - hsh(i + 4) * 38 * s, 1.6 * s, 2.6 * s); ctx.fill(); } // verdigris
      ctx.strokeStyle = 'rgba(40,26,10,.75)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 14.6 * s, y - 6 * s); ctx.quadraticCurveTo(x, y - 3 * s, x + 14.6 * s, y - 6 * s); ctx.moveTo(x - 12 * s, y - 28 * s); ctx.quadraticCurveTo(x, y - 25 * s, x + 12 * s, y - 28 * s); ctx.stroke(); // its mouldings
      ctx.fillStyle = 'rgba(40,26,10,.6)'; ctx.font = `700 ${4 * s}px Georgia, serif`; ctx.textAlign = 'center'; ctx.fillText('O REX GLORIE', x, y - 16 * s); // the founder's inscription, as on every bell of the age
    } });
    // the crown of the bell: its canons, the loops it once hung by
    for (const dx of [-4, 0, 4]) { ctx.strokeStyle = C(OUT); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + dx * s, y - 43 * s, 2.4 * s, Math.PI, 0); ctx.stroke(); ctx.strokeStyle = C('#B08840'); ctx.lineWidth = 1.4; ctx.stroke(); }
    // the crack he sees out through, and his eye in it
    ctx.fillStyle = C('#140C06'); poly([x + 3 * s, y - 36 * s, x + 7 * s, y - 31 * s, x + 6 * s, y - 27 * s, x + 9 * s, y - 22 * s, x + 7.4 * s, y - 21.6 * s, x + 4 * s, y - 27 * s, x + 5 * s, y - 31 * s]); ctx.fill();
    if (DET()) { ctx.fillStyle = C(crack ? '#FFE0A0' : '#E8C860'); circle(x + 5.6 * s, y - 29.6 * s, .9 * s); ctx.fill(); }
    if (crack > 0) { ctx.strokeStyle = C('#140C06'); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(x - 4 * s, y - 40 * s); ctx.lineTo(x - 1 * s, y - 30 * s); ctx.lineTo(x - 6 * s, y - 20 * s); ctx.lineTo(x - 3 * s, y - 8 * s); if (crack > 1) { ctx.moveTo(x + 10 * s, y - 14 * s); ctx.lineTo(x + 6 * s, y - 8 * s); ctx.lineTo(x + 11 * s, y - 1 * s); } ctx.stroke(); }
    ctx.restore();
  }
  CREATURES.w8bell = function (e, a) {
    a = a || {}; const t = a.t || 0, st = e.state, ph = a.walk || 0, wind = a.wind || 0, k = e.w8k || 0;
    const wT = st === 'wind' && e.plan === 'w8toll', toll = st === 'w8act' && e.w8a === 'toll', wS = st === 'wind' && e.plan === 'w8bdrop', drop = st === 'w8act' && e.w8a === 'bdrop', swing = st === 'strike' || (st === 'wind' && e.plan === 'swing');
    const crack = e.w8crack || 0;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const sw = Math.sin(ph * .7) * 6, squat = wS ? wind * 6 : drop ? (k < .5 ? 6 * (1 - k * 2) : 0) : 0, bob = Math.abs(Math.sin(ph * .7)) * 1.6;
    const legs = (near) => { const f = near ? [sw + 5, 0] : [-sw - 5, 0], hp = [near ? 5 : -5, -24 + squat], kk = knee(hp[0], hp[1], f[0], -1, 14, 1); for (const [col, w0] of [[near ? '#E8DCC0' : '#C8BCA0', 7]]) limb3(hp[0], hp[1], kk[0], kk[1], f[0], -2, w0, 5.6, 4.4, col, { tex: () => { ctx.fillStyle = 'rgba(160,40,30,.7)'; for (let i = -30; i < 0; i += 4) ctx.fillRect(-20, i, 40, 1.8); } }); shoe(f[0], 0, '#2A1E14', 1.3); };
    legs(false);
    // the far arm, out of its hole in the bronze
    const by = -20 + squat - bob;
    { const sx = -9, sy = by - 18, hx = sx - 6, hy = sy + 14; limb3(sx, sy, sx - 5, sy + 7, hx, hy, 5, 4.4, 3.8, '#9A8670'); fist(hx, hy, '#B89A7A', 1.2); }
    legs(true);
    bell(0, by + 4, 1, crack, toll ? (1 - k) : drop && k > .5 ? .7 : 0, t);
    if (toll && DET()) for (let i = 0; i < 3; i++) { const r = 18 + ((k * 3 + i / 3) % 1) * 30; ctx.strokeStyle = `rgba(255,230,170,${.5 * (1 - (k * 3 + i / 3) % 1)})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(14, by - 18, r, -.7, .7); ctx.stroke(); } // the note going out of it
    // the near arm with the clapper: an iron club as long as a leg, its ball scarred bright
    let ang = .7 + Math.sin(t * 1.4) * .05;
    if (wT) ang = lerp(.7, -2.2, sm(wind)); if (toll) ang = k < .25 ? lerp(-2.2, -.4, sm(k * 4)) : -.4;
    if (swing) ang = st === 'strike' ? .5 : lerp(.7, -1.8, wind);
    if (wS) ang = -1.6; if (drop) ang = -1.2;
    const sx = 9, sy = by - 18, hx = sx + Math.cos(ang) * 12, hy = sy + Math.sin(ang) * 12;
    limb3(sx, sy, (sx + hx) / 2 + 2, (sy + hy) / 2 + 2, hx, hy, 5.4, 4.6, 4, '#B09A80');
    { const ex = hx + Math.cos(ang - .2) * 24, ey = hy + Math.sin(ang - .2) * 24; ctx.strokeStyle = C(OUT); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(ex, ey); ctx.stroke(); ctx.strokeStyle = C('#4A4440'); ctx.lineWidth = 3; ctx.stroke(); cel(PE(ex, ey, 5.4, 5), '#5A5450', { d: 1.2, r: .8, w: 1.3, lite: '#C8C0B4' }); }
    fist(hx, hy, '#C8AA88', 1.25);
    ctx.restore();
  };

  // ---------------- THE FUNNEL-HAT CROW: a crow the size of a man, with a man's legs in red hose dangling under it and
  // a funnel worn upside down on its head (the hat of folly, in every one of Bosch's crowds). It comes down at you
  // beak first, and calls its murder to fly at you across the field ----------------
  CREATURES.w8crow = function (e, a) {
    a = a || {}; const t = a.t || 0, st = e.state, wind = a.wind || 0, k = e.w8k || 0;
    const wP = st === 'wind' && e.plan === 'w8peck', peck = st === 'w8act' && e.w8a === 'peck', wM = st === 'wind' && e.plan === 'w8murder', down = (e.grounded || 0) > 0 || st === 'down';
    const beat = peck ? .25 : down ? 0 : t * (wM ? 3.4 : 2.3) + (e.walk || 0) * .1, up = Math.sin(beat * TAU);
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const tilt = peck ? .9 : wP ? -.3 * wind : wM ? -.25 : .05; ctx.translate(0, -18); ctx.rotate(tilt);
    // the far wing
    const wing = (near) => { const s = near ? 1 : .8, col = near ? '#2A2622' : '#1A1714', lift = down ? -.2 : up * (near ? 1 : .9);
      ctx.save(); ctx.translate(near ? 2 : -2, -2); ctx.scale(1, near ? 1 : .85);
      const tip = [-28 * s, -16 * s - lift * 18 * s];
      cel(PB([0, 0, -10 * s, -6 * s - lift * 6, tip[0], tip[1], -24 * s, tip[1] + 6, -18 * s, -2 * s + lift * 2, -6 * s, 5 * s]), col, { d: 1.6, r: .7, w: 1.4, lite: '#5A5650', tex: () => { ctx.strokeStyle = 'rgba(120,116,110,.45)'; ctx.lineWidth = .6; ctx.beginPath(); for (let i = 0; i < 6; i++) { const u = i / 6; ctx.moveTo(lerp(-6, tip[0], u), lerp(2, tip[1] + 4, u)); ctx.lineTo(lerp(-6, tip[0], u) - 3, lerp(2, tip[1] + 4, u) + 7); } ctx.stroke(); } });
      ctx.restore(); };
    wing(false);
    // the man's legs, hanging in red hose, with pointed shoes (they kick feebly as it flies)
    for (const [dx, col, kick] of [[-3, '#7A2A22', Math.sin(t * 5)], [2, '#A2382C', Math.sin(t * 5 + 2)]]) { limb3(dx, 8, dx + 2 + kick, 16, dx - 1 + kick * 2, 24, 3.6, 3, 2.6, col); fillPoly([dx - 2 + kick * 2, 22, dx + 6 + kick * 2, 25, dx + 1 + kick * 2, 26.4, dx - 3 + kick * 2, 25.6], '#1E1A16', 1); }
    // the body: a fat black crow's body, sleek, a blue sheen on the black
    cel(PB([-16, 6, -12, -6, 0, -10, 12, -8, 16, 0, 10, 10, -4, 12]), '#221E1A', { d: 2, r: 1, w: 1.5, lite: '#4A4A58', tex: () => { ctx.strokeStyle = 'rgba(90,100,130,.45)'; ctx.lineWidth = .6; ctx.beginPath(); for (let i = 0; i < 6; i++) { ctx.moveTo(-10 + i * 4, -6); ctx.quadraticCurveTo(-8 + i * 4, 2, -10 + i * 4, 10); } ctx.stroke(); } });
    cel(PB([-14, 4, -26, 0, -28, 8, -18, 10]), '#1A1714', { d: 1, r: .5, w: 1.2 }); // the tail
    // the head, the beak, the funnel
    cel(PE(14, -10, 7, 6.4), '#262220', { d: 1.4, r: .7, w: 1.4, lite: '#4A4A58' });
    const open = wM ? .5 + Math.sin(t * 20) * .3 : peck ? .2 : 0;
    cel(PP([19, -12, 33, -9 - open * 3, 19, -8]), '#3A3430', { d: .6, r: .5, w: 1.2, lite: '#8A8478' });
    cel(PP([19, -8, 31, -7 + open * 4, 19, -6]), '#2E2A26', { d: .6, r: .4, w: 1.1 });
    bead(16, -12, 1.1);
    ctx.save(); ctx.translate(13, -16); ctx.rotate(-.35);
    cel(PP([-8, 0, 8, 0, 2, -14, 1.4, -20, -.6, -20, -1.4, -14]), '#8A8E90', { d: 1.4, r: .8, w: 1.3, lite: '#E0E4E2', tex: () => { ctx.strokeStyle = 'rgba(30,30,34,.5)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(-6, -3); ctx.lineTo(6, -3); ctx.stroke(); } }); // the funnel
    ctx.restore();
    wing(true);
    ctx.restore();
  };

  // ---------------- THE WALKING EGG: an egg the size of a calf, on two long pink human legs; its top broken open and a
  // little old face looking out of it. It skitters, stops, kicks like a mule, and tucks its legs in and rolls ----------------
  CREATURES.w8egg = function (e, a) {
    a = a || {}; const t = a.t || 0, st = e.state, ph = a.walk || 0, wind = a.wind || 0, k = e.w8k || 0;
    const wK = st === 'wind' && e.plan === 'w8kick', kick = st === 'w8act' && e.w8a === 'kick', wR = st === 'wind' && e.plan === 'w8roll', roll = st === 'w8act' && e.w8a === 'roll';
    const crack = e.hp < e.maxHp * .5 ? 1 : 0;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const tuck = roll ? 1 : wR ? wind : 0, legL = 26 * (1 - tuck * .9), bodyY = -legL - 18;
    const sw = Math.sin(ph * 1.6) * 10, hop = ph ? Math.abs(Math.sin(ph * 1.6)) * 3 : 0;
    ctx.translate(0, -hop);
    const leg = (near) => { if (tuck > .95) return; const f = kick && near ? [lerp(6, 34, Math.sin(Math.min(1, k * 1.6) * Math.PI)), -lerp(0, 22, Math.sin(Math.min(1, k * 1.6) * Math.PI))] : wK && near ? [-10 * wind, -4 * wind] : near ? [sw * (1 - tuck), 0] : [-sw * (1 - tuck), 0];
      const hp = [near ? 3 : -3, bodyY + 12], L = legL * .55 + 2, kk = knee(hp[0], hp[1], f[0], f[1] - 1, L, -1); // (the knees bend backward, like a bird's)
      limb3(hp[0], hp[1], kk[0], kk[1], f[0], f[1] - 2, 4.6, 3.2, 2.4, near ? '#E2A890' : '#C88A74');
      fillPoly([f[0] - 2, f[1] - 2, f[0] + 6, f[1] - 1.4, f[0] + 7, f[1] + .4, f[0] - 2.4, f[1] + .4], near ? '#D49880' : '#B47A66', 1); };
    leg(false);
    ctx.save(); ctx.translate(0, bodyY); if (roll) ctx.rotate(t * 14 * e.facing * 0 + k * 26); else ctx.rotate(Math.sin(t * 2.2) * .05 + (wK ? -.2 * wind : 0));
    const egg = PB([0, -24, 11, -20, 15, -4, 12, 12, 0, 17, -12, 12, -15, -4, -11, -20]);
    cel(egg, '#ECE4D2', { d: 3, r: 1.2, w: 1.6, dark: '#B4A890', lite: '#FFFDF6', tex: () => {
      for (let i = 0; i < 8; i++) { ctx.fillStyle = 'rgba(160,140,110,.35)'; circle(-8 + hsh(i) * 16, -16 + hsh(i + 2) * 28, .6 + hsh(i + 5)); ctx.fill(); } // speckles
      if (crack) { ctx.strokeStyle = 'rgba(40,30,20,.85)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-6, 4); ctx.lineTo(-2, -2); ctx.lineTo(4, 6); ctx.lineTo(12, 2); ctx.stroke(); }
    } });
    // the broken top, and the face looking out of the hole
    ctx.fillStyle = C('#2A2018'); ell(2, -19, 8, 3.4); ctx.fill();
    if (!roll) { cel(PE(3, -21, 5, 4.4), '#D8A88A', { d: .9, r: .4, w: 1.1 }); if (DET()) { bead(5, -22.4, .7); bead(2.4, -22.6, .6); ctx.strokeStyle = C('#5A2A1E'); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(2.6, -19.4); ctx.lineTo(5.6, -19.6); ctx.stroke(); ctx.fillStyle = C('#E8E2D6'); for (let i = 0; i < 3; i++) { circle(.6 + i * 1.6, -25 - i * .3, .9); ctx.fill(); } } } // wisps of white hair
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-6, -18); for (let i = 0; i <= 6; i++) ctx.lineTo(-6 + i * 2.4, -20 + (i % 2 ? -2.6 : 0)); ctx.stroke(); // the jagged rim of the shell
    ctx.restore();
    leg(true);
    ctx.restore();
  };
  Object.assign(W8.art, { bell });

  // ======================================================================================================
  // THE GOAT-LORD OF THE CIRCLE: the thing that came in through the hole Corwin's curse made, and has held the Circle
  // since. A goat's head on a man's body, goat's legs under a bishop's cope of vermilion worked with black goats in gold,
  // an iron crozier whose crook is the Circle itself. Four shapes (the 'w8heart' rule keeps his shape in e.w8form):
  //   1 THE GOAT-LORD        on foot, the crozier and the binding ring
  //   2 THE TITHE OF LORRAINE up on his siege engine at the back of the field, throwing what the Circle took; he comes
  //                          down to wind it, and that is when he can be reached
  //   3 THE HORNED GATE      the hole opens under him and the Circle closes on the field from both sides
  //   4 YOUR CURSE           on his knees with a black book, he reads Corwin his own curse, and the words come at him
  // ======================================================================================================
  const GL = { cope: PAL.verm, copeDk: '#6A1A0E', copeLt: '#E8704A', robe: '#1E1A18', hair: '#2A221C', hairLt: '#5A4A3A', horn: '#2A2622', hornLt: '#7A7066', eye: '#E8C040', skin: '#6E6458', hoof: '#16120F', iron: '#3A3836', ironLt: '#8E8A84' };
  // the goat's head: long face, a beard, slot eyes, and the horns that sweep back (they grow in his later shapes)
  function goatHead(x, y, s, o = {}) {
    const hs = o.horns || 1, rage = o.rage || 0, open = o.open || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(o.tilt || 0);
    horn(-2, -8, -14 * hs, -18 * hs, -22 * hs, -6 * hs, 6, .8, GL.horn, 1.3, '#141210'); // the far horn
    // the ears, flat out to the side
    cel(PB([-4, -6, -14, -4, -18, -1, -10, 0]), '#3E342C', { d: .8, r: .4, w: 1.1 });
    // the long face, the muzzle
    cel(PB([-8, -10, 2, -13, 10, -8, 16, 4, 15, 9, 9, 12, 2, 8, -6, 4, -9, -2]), GL.hair, { d: 2, r: 1, w: 1.5, lite: GL.hairLt, tex: () => {
      ctx.strokeStyle = 'rgba(120,100,80,.5)'; ctx.lineWidth = .6; ctx.beginPath(); for (let i = 0; i < 8; i++) { ctx.moveTo(-6 + i * 2.6, -10 + i * .6); ctx.lineTo(-4 + i * 2.8, -3 + i * 1.4); } ctx.stroke();
      ctx.fillStyle = 'rgba(200,190,170,.35)'; poly([4, -9, 12, -4, 15, 4, 8, 0]); ctx.fill(); // the pale blaze down the nose
    } });
    if (open > 0) { ctx.fillStyle = C('#2A0806'); poly([9, 9, 16, 7 + open * 2, 12, 12 + open * 5, 6, 12]); ctx.fill(); if (DET()) { ctx.fillStyle = 'rgba(232,226,210,.9)'; ctx.fillRect(11, 8, 1, 2); ctx.fillRect(13, 8, 1, 2); } }
    // the beard, long and forked
    cel(PB([2, 8, 9, 11, 8, 20, 5, 30, 3, 22, 0, 26, -1, 14]), '#1A1612', { d: 1, r: .6, w: 1.2, lite: '#4A3E34' });
    // the eye: a gold iris with a black bar of a pupil
    if (DET() || FLASH) { ctx.fillStyle = C(GL.eye); ell(4, -5, 2.8, 2); ctx.fill(); ctx.fillStyle = C('#0E0A06'); ctx.fillRect(2.4, -5.5, 3.2, 1); }
    if (rage > 0 && DET()) glowM(4, -5, 6, '255,200,90', .35 * rage);
    horn(0, -10, -6 * hs, -30 * hs, -20 * hs, -36 * hs, 7, .9, GL.horn, 1.4, '#141210'); // the near horn, ridged
    if (DET()) { ctx.strokeStyle = 'rgba(150,140,128,.55)'; ctx.lineWidth = .6; ctx.beginPath(); for (let i = 1; i < 7; i++) { const u = i / 7, px = lerp(0, -20 * hs, u * u) + lerp(0, -6 * hs, u * (1 - u)) * 2, py = lerp(-10, -36 * hs, u) + Math.sin(u * 3) * 4; ctx.moveTo(px - 3, py + 2); ctx.lineTo(px + 3, py - 1); } ctx.stroke(); }
    ctx.restore();
  }
  // the crozier: an iron staff with a crook bent round into a ring, the ring the Circle
  function crozier(x0, y0, ang, L, glow) {
    const x1 = x0 + Math.cos(ang) * L, y1 = y0 + Math.sin(ang) * L;
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 4.4; ctx.beginPath(); ctx.moveTo(x0 - Math.cos(ang) * 12, y0 - Math.sin(ang) * 12); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = C(GL.iron); ctx.lineWidth = 2.6; ctx.stroke(); ctx.strokeStyle = C(GL.ironLt); ctx.lineWidth = .7; ctx.stroke();
    const rx = x1 + Math.cos(ang) * 9, ry = y1 + Math.sin(ang) * 9;
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 5; circle(rx, ry, 9); ctx.stroke(); ctx.strokeStyle = C(GL.iron); ctx.lineWidth = 3; ctx.stroke();
    if (DET()) { ctx.strokeStyle = C(GL.ironLt); ctx.lineWidth = .8; ctx.beginPath(); ctx.arc(rx, ry, 9, -2.4, -.6); ctx.stroke(); }
    ctx.fillStyle = C('#0C0A08'); circle(rx, ry, 7); ctx.fill(); // the ring is a hole: you see nothing through it
    if (glow > 0) glowM(rx, ry, 18, '210,200,180', .25 * glow);
    return [rx, ry];
  }
  // his cope: a great semicircle of vermilion silk, its orphrey bands of gold worked with black goats; in his third
  // shape its hem burns away into grey
  function cope(sw, burn, wide) {
    const hem = -4, P = PB([-10, -70, 10, -70, 18 + wide, -50, 24 + wide + sw, -18, 26 + wide + sw, hem, 0, hem + 3, -26 - wide + sw, hem, -24 - wide + sw, -18, -18 - wide, -50]);
    cel(P, GL.cope, { d: 4, r: 1.4, w: 1.8, dark: GL.copeDk, lite: GL.copeLt, tex: () => {
      ctx.strokeStyle = 'rgba(60,10,4,.45)'; ctx.lineWidth = .9; ctx.beginPath(); for (let i = -3; i <= 3; i++) { ctx.moveTo(i * 2.4, -66); ctx.quadraticCurveTo(i * 5 + sw * .5, -36, i * 8 + sw, hem); } ctx.stroke(); // the folds
      goldLine(() => { ctx.moveTo(-3, -68); ctx.quadraticCurveTo(-6, -36, -10 + sw, hem); ctx.moveTo(5, -68); ctx.quadraticCurveTo(8, -36, 12 + sw, hem); }, 2.2); // the orphreys
      for (let i = 0; i < 4; i++) { const u = (i + .5) / 4, gx = lerp(-4, -9 + sw, u), gy = lerp(-62, hem + 6, u); ctx.fillStyle = C('#1C1612'); circle(gx, gy, 1.6); ctx.fill(); }
      goldLine(() => { ctx.moveTo(-26 - wide + sw, hem - 1); ctx.quadraticCurveTo(0, hem + 3, 26 + wide + sw, hem - 1); }, 1.6); // the hem's border
      if (burn > 0) { ctx.fillStyle = `rgba(150,144,134,${burn})`; ctx.beginPath(); ctx.moveTo(-30, hem + 4); for (let x = -30; x <= 30; x += 3) ctx.lineTo(x + sw, hem - 4 - burn * (10 + hsh(x) * 18)); ctx.lineTo(30, hem + 4); ctx.fill(); }
    } });
  }
  // a goat's leg: a shaggy thigh, the backward knee, a long shank, a cloven hoof
  function goatLeg(hx, hy, fx, fy, col, near) {
    const kk = knee(hx, hy, fx, fy, 16, -1);
    limb3(hx, hy, kk[0], kk[1], fx, fy - 3, 8, 4.6, 3.4, col, { tex: () => { ctx.strokeStyle = 'rgba(100,84,66,.6)'; ctx.lineWidth = .6; ctx.beginPath(); for (let i = 0; i < 8; i++) { ctx.moveTo(hx - 4 + i, hy + i * 2); ctx.lineTo(hx - 6 + i, hy + i * 2 + 4); } ctx.stroke(); } });
    cel(PP([fx - 3, fy, fx - 2, fy - 4, fx + 4, fy - 4, fx + 5, fy, fx + 1, fy - 1.4]), GL.hoof, { d: .6, r: .5, w: 1.1, lite: '#4A443E' });
  }
  // the whole figure. o: { form, walk, t, lean, crook (angle), farUp (0..1), head tilt, open, kneel (0..1), book (0..1) }
  function goatLord(o) {
    const t = o.t || 0, form = o.form || 1, sw = Math.sin(o.walk || 0) * 6, kneel = o.kneel || 0, burn = form >= 3 ? .8 : 0, hs = form >= 3 ? 1.35 : 1;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const hip = [0, -40 + kneel * 18], lean = o.lean || 0;
    goatLeg(-3, hip[1], kneel ? -16 : -sw - 4, 0, '#2E2620', false);
    // the far arm: a hand open in a sign, or on the book
    const sh = [lean * 50 - 6, hip[1] - 32];
    { const up = o.farUp || 0, hx = sh[0] - 8 + up * 30, hy = sh[1] + 22 - up * 40; limb3(sh[0], sh[1], lerp(sh[0] - 8, sh[0] + 6, up), lerp(sh[1] + 12, sh[1] - 10, up), hx, hy, 6, 5, 4, GL.copeDk);
      cel(PB([hx - 3, hy + 2, hx - 2, hy - 4, hx + 2, hy - 6, hx + 5, hy - 2, hx + 3, hy + 3]), form >= 3 ? '#1C1816' : GL.skin, { d: .8, r: .4, w: 1.1 });
      if (up > .4 && (o.sign ?? 1) > 0 && DET()) { ctx.strokeStyle = `rgba(20,16,12,${up})`; ctx.lineWidth = 1.4; circle(hx + 1, hy - 1, 2.6); ctx.stroke(); } } // the ring drawn on his palm
    ctx.save(); ctx.translate(0, hip[1]); ctx.rotate(lean); ctx.translate(0, -hip[1]);
    ctx.translate(0, kneel * 18);
    cel(PB([-12, -66, 12, -66, 14, -40, 10, -20, -10, -20, -14, -40]), GL.robe, { d: 2, r: .8, w: 1.4, lite: '#3E3836' });
    cope(sw * .4 - kneel * 2, burn, form >= 3 ? 6 : 0);
    // the morse: a gold clasp holding the cope at his breast, set with a black stone
    cel(PE(1, -62, 5, 4), '#C9982E', { d: 1, r: .6, w: 1.2, lite: '#FFE8A0' }); ctx.fillStyle = C('#140E0A'); circle(1, -62, 2.2); ctx.fill();
    goatHead(4, -76, 1, { horns: hs, rage: form >= 3 ? 1 : 0, open: o.open || 0, tilt: o.tilt || 0 });
    ctx.restore();
    if (!kneel) goatLeg(3, hip[1], sw + 5, 0, '#3E342C', true);
    // the near arm and the crozier (or, kneeling, the book)
    const nsh = [lean * 50 + 8, hip[1] - 30 + kneel * 18];
    if (o.book) { const bx = nsh[0] + 14, by = nsh[1] + 14; limb3(nsh[0], nsh[1], nsh[0] + 8, nsh[1] + 12, bx, by, 6, 5, 4, GL.cope);
      ctx.save(); ctx.translate(bx + 6, by - 2); ctx.rotate(-.25); const op = o.book;
      cel(PP([-12, 0, 0, 2, 0, -14, -11, -15]), '#E8DEC8', { d: .6, r: .4, w: 1.2 }); cel(PP([0, 2, 12 * op, 0, 11 * op, -15, 0, -14]), '#F2EAD6', { d: .6, r: .4, w: 1.2 });
      if (DET()) { ctx.strokeStyle = 'rgba(20,14,10,.8)'; ctx.lineWidth = .7; ctx.beginPath(); for (let i = 0; i < 5; i++) { ctx.moveTo(-10, -12 + i * 2.4); ctx.lineTo(-2, -11.6 + i * 2.4); if (op > .5) { ctx.moveTo(2, -11.6 + i * 2.4); ctx.lineTo(9, -12 + i * 2.4); } } ctx.stroke(); ctx.fillStyle = C(PAL.verm); ctx.fillRect(-10, -13, 2.4, 3); }
      cel(PP([-13, 1, 13 * op, 1, 13 * op, 3, -13, 3]), '#1C1612', { d: .4, r: .3, w: 1 }); ctx.restore();
      fist(bx, by, form >= 3 ? '#1C1816' : GL.skin, 1.2);
    } else { const ca = o.crook ?? -1.3, hx = nsh[0] + Math.cos(ca + .6) * 16, hy = nsh[1] + Math.sin(ca + .6) * 16;
      limb3(nsh[0], nsh[1], (nsh[0] + hx) / 2 + 3, (nsh[1] + hy) / 2 + 4, hx, hy, 6.4, 5.4, 4.4, GL.cope);
      W8.crookAt = crozier(hx, hy, ca, o.crookL || 62, o.crookGlow || 0);
      fist(hx, hy, form >= 3 ? '#1C1816' : GL.skin, 1.3); }
    ctx.restore();
  }
  // his pose, from what he is doing
  function goatPose(e, a) {
    const st = e.state, p = e.plan, wind = a.wind || 0, k = e.w8k || 0, form = e.w8form || 1, t = a.t || 0;
    const o = { form, walk: a.walk || 0, t, crook: -1.3 + Math.sin(t * .9) * .05, farUp: 0, lean: 0 };
    const W = (name) => st === 'wind' && p === name, A = (name) => st === 'w8act' && e.w8a === name;
    if (W('w8crook')) { o.crook = lerp(-1.3, -2.8, sm(wind)); o.lean = -.12 * wind; }
    if (A('crook')) { o.crook = k < .45 ? lerp(-2.8, .35, sm(k / .45)) : lerp(.35, -.4, sm((k - .45) / .55)); o.lean = .18; o.crookL = 62 + Math.sin(Math.min(1, k / .45) * Math.PI) * 16; }
    if (W('w8bind') || W('w8bind2')) { o.farUp = sm(wind); o.crook = -1.5; o.tilt = -.15 * wind; }
    if (A('bind')) { o.farUp = 1; o.sign = 1; o.crook = -1.5; }
    if (W('w8butt')) { o.lean = .3 * wind; o.tilt = .5 * wind; o.crook = -2.2; }
    if (A('butt')) { o.lean = .42; o.tilt = .6; o.crook = -2.4; o.walk = (e.walk || 0); }
    if (W('w8bleat') || A('bleat')) { o.tilt = -.5; o.open = 1; o.farUp = .6; o.sign = 0; }
    if (A('crank')) { o.crook = -1.0; o.farUp = .5 + Math.sin(t * 8) * .4; o.lean = .1; o.sign = 0; }
    if (A('lever') || W('w8bales') || W('w8mill')) { o.farUp = .9; o.sign = 0; o.crook = -1.9; }
    if (W('w8gore')) { o.lean = .35 * wind; o.tilt = .6 * wind; }
    if (A('gore')) { o.lean = .45; o.tilt = .7; o.walk = e.walk || 0; }
    if (W('w8hands') || A('hands')) { o.crook = lerp(-1.3, 1.45, W('w8hands') ? sm(wind) : 1); o.lean = .2; o.crookGlow = 1; }
    if (W('w8close') || A('close')) { o.farUp = 1; o.sign = 1; o.crook = -2.4; o.tilt = -.3; o.open = .5; }
    if (form === 4) { o.kneel = 1; o.book = 1; o.crook = 0; if (A('curse') || W('w8curse')) { o.open = .6 + Math.sin(t * 14) * .3; o.tilt = -.15; } if (A('spent')) { o.book = .3; o.tilt = .5; o.lean = .2; } if (W('w8word') || A('word')) { o.farUp = 1; o.sign = 0; } }
    return o;
  }
  CREATURES.w8goat = function (e, a) {
    a = a || {};
    if (e.w8form === 2 && e.w8onEngine) { ctx.save(); ctx.translate(0, -(e.w8lift || 0)); goatLord(goatPose(e, a)); ctx.restore(); return; }
    goatLord(goatPose(e, a));
  };
  // the siege engine at the back of the field: a mangonel of black timber, its arm, its sling, its windlass (in his
  // second shape he stands up on its platform, and comes down to wind it)
  function mangonel(x, y, arm, s = 1, t = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const beam = (x0, y0, x1, y1, w, col = '#2E2620') => { ctx.strokeStyle = C(OUT); ctx.lineWidth = w + 2.2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.strokeStyle = C(col); ctx.lineWidth = w; ctx.stroke(); if (DET()) { ctx.strokeStyle = 'rgba(160,140,120,.4)'; ctx.lineWidth = w * .25; ctx.beginPath(); ctx.moveTo(x0 + 1, y0 - w * .3); ctx.lineTo(x1 + 1, y1 - w * .3); ctx.stroke(); } };
    beam(-44, 0, 44, 0, 6); beam(-44, -6, 44, -6, 3, '#3A3028');
    for (const fx of [-30, 30]) { beam(fx, 0, 0, -58, 5); }
    beam(-36, -30, 36, -30, 4); // the platform he stands on
    cel(PP([-30, -34, 30, -34, 30, -30, -30, -30]), '#4A3E34', { d: .6, r: .4, w: 1.2 });
    // the windlass at the foot, a spoked wheel
    ctx.save(); ctx.translate(-36, -12); ctx.rotate(arm * 6); ctx.strokeStyle = C(OUT); ctx.lineWidth = 3; circle(0, 0, 9); ctx.stroke(); ctx.strokeStyle = C('#5A4A3A'); ctx.lineWidth = 1.6; ctx.stroke(); ctx.beginPath(); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; ctx.moveTo(-Math.cos(a) * 12, -Math.sin(a) * 12); ctx.lineTo(Math.cos(a) * 12, Math.sin(a) * 12); } ctx.strokeStyle = C(OUT); ctx.lineWidth = 2.6; ctx.stroke(); ctx.strokeStyle = C('#6A5A48'); ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore();
    // the arm, pivoting at the top of the frame: wound back (arm 0) or thrown (arm 1)
    const pa = lerp(2.5, -.9, arm), px = 0, py = -58, L1 = 70, L2 = 18;
    const ex = px + Math.cos(pa) * L1, ey = py + Math.sin(pa) * L1, cx = px - Math.cos(pa) * L2, cy = py - Math.sin(pa) * L2;
    beam(cx, cy, ex, ey, 5, '#3A2E26');
    cel(PP([cx - 9, cy, cx + 9, cy, cx + 8, cy + 16, cx - 8, cy + 16]), '#4A4038', { d: 1, r: .5, w: 1.3, tex: () => { ctx.strokeStyle = 'rgba(20,16,12,.6)'; ctx.lineWidth = .6; ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(cx - 9, cy + k * 4); ctx.lineTo(cx + 9, cy + k * 4); } ctx.stroke(); } }); // the counterweight box, full of stones
    const sl = arm < .5 ? [ex - 6, ey + 12] : [ex + Math.cos(pa) * 10, ey + Math.sin(pa) * 10 + 4]; ctx.strokeStyle = C('#5A4A30'); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(sl[0], sl[1]); ctx.stroke(); // the sling
    ctx.fillStyle = C('#2A2018'); ell(sl[0], sl[1], 3.6, 2.4); ctx.fill();
    cel(PE(px, py, 3.6, 3.6), '#5A4A3A', { d: .5, r: .3, w: 1.1 });
    // a pennon of the Goat on its top
    beam(0, -58, 0, -86, 1.6); ctx.fillStyle = C(PAL.verm); ctx.beginPath(); ctx.moveTo(1, -86); ctx.quadraticCurveTo(10, -86 + Math.sin(t * 3) * 2, 22, -82); ctx.lineTo(1, -78); ctx.fill();
    ctx.restore();
  }
  // ---------------- a warhorse of Lorraine (the riders of the card and the ending): a white destrier in a caparison of Lorraine's
  // arms, drawn in two halves so a rider sits between them (the card and the ending) ----------------
  // the horse, in its own frame (feet at 0, facing +x); part: 'back' (far legs, body, neck, head) or 'front' (near
  // legs, caparison skirt over the rider's leg, the saddle-bow)
  function horse(part, o) {
    const t = o.t || 0, gal = o.gallop || 0, ph = o.walk || 0, rear = o.rear || 0;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (rear) { ctx.translate(-26, 0); ctx.rotate(-rear * .5); ctx.translate(26, 0); }
    const body = '#ECE6D8', bodyDk = '#ACA494', bodyLt = '#FFFDF6', bob = gal ? Math.abs(Math.sin(ph)) * 3 : Math.abs(Math.sin(ph)) * 1;
    ctx.translate(0, -bob);
    const leg = (hx, off, near, fore) => { const a = ph + off, sw = gal ? Math.sin(a) * 16 : Math.sin(a) * 8, lift = gal ? Math.max(0, Math.cos(a)) * 12 : Math.max(0, Math.cos(a)) * 5;
      const hy = -42, fx = hx + sw, fy = -lift + bob, kk = knee(hx, hy, fx, fy, 23, fore ? -1 : 1);
      limb3(hx, hy, kk[0], kk[1], fx, fy - 4, 6.4, 4, 3.2, near ? body : bodyDk);
      cel(PP([fx - 3, fy, fx - 2.6, fy - 4.6, fx + 3, fy - 4.6, fx + 3.8, fy]), '#3A3430', { d: .5, r: .3, w: 1.1 }); };
    if (part === 'back') {
      leg(26, Math.PI, false, true); leg(-28, 0, false, false);
      // the tail, the barrel, the neck and the head (a steel chanfron on its face), the mane
      cel(PB([-38, -64, -50, -54, -54, -30, -48, -24, -44, -46]), '#DCD4C4', { d: 1, r: .5, w: 1.2, tex: () => { ctx.strokeStyle = 'rgba(150,140,124,.6)'; ctx.lineWidth = .6; ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(-42 - k * 2, -60); ctx.quadraticCurveTo(-50 - k, -44, -48 - k * 2, -26); } ctx.stroke(); } });
      cel(PB([-42, -60, -20, -70, 16, -70, 36, -62, 38, -46, 20, -38, -16, -38, -40, -44]), body, { d: 3, r: 1.2, w: 1.6, dark: bodyDk, lite: bodyLt });
      const nod = Math.sin(ph * 2) * (gal ? .08 : .03) - rear * .2;
      ctx.save(); ctx.translate(30, -62); ctx.rotate(nod);
      cel(PB([-6, 8, -2, -10, 10, -30, 18, -34, 22, -24, 14, -6, 10, 10]), body, { d: 2, r: 1, w: 1.5, dark: bodyDk, lite: bodyLt });
      cel(PB([12, -34, 22, -38, 36, -26, 40, -18, 34, -14, 22, -18]), body, { d: 1.6, r: .8, w: 1.4, dark: bodyDk, lite: bodyLt });
      cel(PP([20, -36, 36, -25, 33, -20, 18, -30]), '#B8BCC0', { d: .7, r: .5, w: 1.1, lite: '#F0F4F6' }); // the chanfron
      fillPoly([12, -36, 13, -44, 17, -36], body, 1); fillPoly([15, -37, 17, -44, 19, -36], bodyDk, 1); bead(21, -29, 1); ctx.fillStyle = C('#2A2420'); circle(37, -17, 1.1); ctx.fill();
      for (let k = 0; k < 7; k++) { const u = k / 7; ctx.strokeStyle = C(k % 2 ? '#D0C8B8' : '#BCB4A4'); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(lerp(-4, 12, u), lerp(-8, -32, u)); ctx.lineTo(lerp(-4, 12, u) - 6 - Math.sin(t * 7 + k) * gal * 2.4, lerp(-8, -32, u) + 4); ctx.stroke(); } // the mane
      ctx.strokeStyle = C('#5A3A20'); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(34, -18); ctx.quadraticCurveTo(10, -14, -24, -6); ctx.stroke(); // the rein, back to the rider's hand
      ctx.restore();
    } else {
      leg(-24, Math.PI * .5, true, false); leg(30, Math.PI * 1.5, true, true);
      // the caparison: Lorraine's arms on the trapper (or, a bend gules, three alerions argent), its hem dagged
      const cp = PB([-46, -64, -14, -74, 22, -74, 42, -64, 42, -36, 24, -30, -8, -32, -30, -30, -46, -36]);
      cel(cp, PAL.or, { d: 3, r: 1.2, w: 1.7, dark: '#8A6418', lite: '#FFE8A0', tex: () => {
        ctx.save(); ctx.translate(-2, -52); ctx.rotate(.42); ctx.fillStyle = C(PAL.gules); ctx.fillRect(-80, -7, 160, 14); ctx.fillStyle = C(PAL.argent); for (const k of [-30, 0, 30]) { poly([k - 4.6, -1.8, k, 1.2, k + 4.6, -1.8, k + 1.4, 1.4, k, 4.6, k - 1.4, 1.4]); ctx.fill(); } ctx.restore();
        ctx.fillStyle = 'rgba(70,40,6,.4)'; ctx.beginPath(); for (let x = -46; x < 42; x += 7) { ctx.moveTo(x, -36); ctx.lineTo(x + 3.5, -30 - (Math.floor(x / 7) % 2) * 2); ctx.lineTo(x + 7, -36); } ctx.fill();
        goldLine(() => { ctx.moveTo(-46, -38); ctx.quadraticCurveTo(-2, -32, 42, -38); }, 1.1);
      } });
      cel(PB([-14, -78, 8, -78, 12, -70, -16, -70]), '#5A3A20', { d: .7, r: .5, w: 1.2 }); // the saddle
      cel(PB([6, -84, 13, -82, 12, -72, 6, -72]), '#6A4428', { d: .5, r: .4, w: 1.1 }); cel(PB([-18, -82, -12, -80, -12, -72, -18, -72]), '#6A4428', { d: .5, r: .4, w: 1.1 }); // its bow and cantle
      if (o.rider !== false) { limb3(-2, -72, 8, -56, 3, -42, 7, 6, 4.6, o.legCol || '#2A2422'); cel(PB([-1, -44, 9, -43, 11, -39, -1, -38]), o.bootCol || '#3A2618', { d: .6, r: .4, w: 1.1 }); ctx.strokeStyle = C('#9A9EA2'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -70); ctx.lineTo(3, -39); ctx.stroke(); }
    }
    ctx.restore();
  }
  Object.assign(W8, { goatLord, goatPose, goatHead, crozier, mangonel, horse, GL });

  // ======================================================================================================
  // ATTACKS: plans for the Circle's people and creatures, the Hangman and the Goat-Lord, their tells and the hazards they
  // leave. They plug into world.js, zones.js and game.js, which load after this file: data_w8.js calls W8.late()
  // ======================================================================================================
  const HZ = W8.HZ = {}; // this world's hazards: { update(h, dt), draw(h, t) on the floor, ups(h, list, t) upright, box(h, box) }
  const TELL8 = W8.TELL8 = {};
  const AIM8 = W8.AIM8 = {}; // targets that follow you for part of a wind-up, then lock (updated every frame, painted by TELL8) // tells for the common foes' wind-ups, painted on the ground under everything (the boss's go through TELL_FX)
  W8.lateParts = [];
  W8.late = () => { for (const f of W8.lateParts) f(); };
  W8.lateParts.push(() => {
  const reg = (kind, o) => { HZ[kind] = o; HAZARD_FX[kind] = { update: o.update || (() => {}), draw: o.draw || (() => {}) }; };
  const inEll = (x, y, cx, cy, r) => Math.hypot(x - cx, (y - cy) * 2.2) < r;
  const yClamp = (y) => clamp(y, FLOOR_TOP + 10, FLOOR_BOT - 2);
  const xClamp = (x) => clamp(x, leftWall() + 24, rightWall() - 24);
  const alive = () => P && P.state !== 'dead';
  const hitP = (dmg, fromX, big, src) => { if (!alive()) return false; const h0 = P.hp; hitPlayer(src || { kind: 'hazard' }, dmg, fromX, big); return P.hp < h0; };
  const fwdOf = (e) => (P.x - e.x) * e.facing;
  const tellCol = (k, a = 1) => `rgba(200,40,30,${(.12 + .3 * k) * a})`, tellLine = (k) => `rgba(255,120,100,${.5 + .4 * k})`;
  const label = (x, y, s, a, col = '240,232,214') => { ctx.fillStyle = `rgba(${col},${a})`; ctx.font = '700 9px Cinzel, Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText(s, x, y); };
  const lane = (x0, x1, y, hw, k) => { ctx.fillStyle = tellCol(k); ctx.fillRect(Math.min(x0, x1), y - hw, Math.abs(x1 - x0), hw * 2); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.2; ctx.strokeRect(Math.min(x0, x1), y - hw, Math.abs(x1 - x0), hw * 2); };
  const ring = (x, y, r, k, fill = true) => { if (fill) { ctx.fillStyle = tellCol(k); ell(x, y, r, r / 2.2); ctx.fill(); } ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.4; ell(x, y, r, r / 2.2); ctx.stroke(); };
  const ash = (x, y, z, n = 10) => { for (let i = 0; i < n; i++) parts.push({ x: x + rand(-10, 10), y: y + rand(-4, 4), z: z + rand(0, 30), vx: rand(-40, 40), vy: rand(-5, 5), vz: rand(10, 60), life: .8, max: .8, col: pick(['rgba(120,114,104,.8)', 'rgba(70,66,60,.8)', 'rgba(190,184,172,.7)']), size: rand(3, 6), shape: 'puff', rot: 0, vr: 0 }); };
  const W = (e, plan) => e.state === 'wind' && e.plan === plan;
  // an attack that takes time: the enemy is held in the 'w8act' state while a controller hazard drives it each frame
  function act(e, name, step, o = {}) {
    e.state = 'w8act'; e.w8a = name; e.struck = false; e.walk = 0; e.w8k = 0; e.vx = 0;
    const h = Object.assign({ kind: 'w8ctl', e, name, el: 0, step, t: 99, max: 99, y: e.y }, o); hazards.push(h); return h;
  }
  function endAct(h) { h.t = -1; h.e.w8k = 1; }
  reg('w8ctl', {
    update(h, dt) { const e = h.e; if (h.done) { h.t = -1; return; } if (e.dead || e.state !== 'w8act' || e.w8a !== h.name) { endAct(h); h.done = 1; return; } h.el += dt; if (h.step(h, dt, e)) { endAct(h); h.done = 1; } },
    draw(h, t) { if (h.draw) h.draw(h, t); },
    ups(h, list, t) { if (h.up) list.push([h.uy ?? h.e.y, () => h.up(h, t)]); },
  });
  function targets(e, make) { // targets fixed when the wind-up starts, kept until the attack is done
    const T0 = e.w8T;
    if (!T0 || T0.plan !== e.plan || (e.state === 'wind' && e.t > T0.lastT + 1e-6)) e.w8T = Object.assign({ plan: e.plan, lastT: e.t }, make(e));
    if (e.state === 'wind') e.w8T.lastT = e.t;
    return e.w8T;
  }
  W8.akit = { alive, reg, act, endAct, targets, hitP, inEll, yClamp, xClamp, tellCol, tellLine, label, lane, ring, ash, fwdOf };
  // the Circle's cold: slowed for a while (a grab, a bell's note, a binding)
  const chill = (s, txt) => { if (!alive()) return; if (!(P.w8slow > 0) && txt) floatText(P.x, P.y, 86, txt, '#C8C2B4', 13); P.w8slow = Math.max(P.w8slow || 0, s); };
  W8.chill = chill;

  // ---------------- HOLLOW: THE FLAIL, brought down in front of it ----------------
  TELL8.w8flail = (e, t, k) => { lane(e.x, e.x + e.facing * 74, e.y, 16, k); };
  PLAN_FX.w8flail = (e) => { sfx('swing');
    act(e, 'flail', (h, dt, e) => { const k = h.el / .55; e.w8k = k;
      if (!h.hit && k > .35 && k < .62) { const f = fwdOf(e); if (f > 4 && f < 74 && Math.abs(P.y - e.y) < 18 && P.z < 40) { h.hit = 1; hitP(edmg(e), e.x, false, { kind: 'melee', e }); } }
      if (k > .5 && !h.thud) { h.thud = 1; dust(e.x + e.facing * 56, e.y, 5); sfx('slam', .4); }
      if (k >= 1) { recover(e, .8); return true; } return false; }); };
  // ---------------- HOLLOW: THE GRAB, a lurch with both arms out: the grey cold goes into whoever it holds ----------------
  TELL8.w8grab = (e, t, k) => { lane(e.x, e.x + e.facing * 90, e.y, 14, k); };
  PLAN_FX.w8grab = (e) => { sfx('growl');
    act(e, 'grab', (h, dt, e) => { const k = h.el / .5; e.w8k = k; if (k < .8) e.x += e.facing * 170 * dt;
      if (!h.hit && Math.abs(P.x - e.x) < e.hw + 16 && fwdOf(e) > -6 && Math.abs(P.y - e.y) < 15 && P.z < 30) { h.hit = 1; if (hitP(Math.round(edmg(e) * .8), e.x, false, { kind: 'melee', e })) chill(1.6, 'THE CIRCLE\'S COLD'); }
      if (k >= 1) { recover(e, 1); return true; } return false; }); };

  // ---------------- BILLMAN: THE THRUST, the bill driven straight down his lane at you ----------------
  TELL8.w8thrust = (e, t, k) => { lane(e.x + e.facing * 10, e.x + e.facing * 132, e.y, 12, k); };
  PLAN_FX.w8thrust = (e) => { sfx('whoosh');
    act(e, 'thrust', (h, dt, e) => { const k = h.el / .5; e.w8k = k; if (k < .35) e.x += e.facing * 60 * dt;
      if (!h.hit && k > .14 && k < .45) { const f = fwdOf(e); if (f > 0 && f < 132 && Math.abs(P.y - e.y) < 13 && P.z < 40) { h.hit = 1; hitP(Math.round(edmg(e) * 1.1), e.x, true, { kind: 'melee', e }); } }
      if (k >= 1) { recover(e, .7); return true; } return false; }); };
  // ---------------- BILLMAN: THE HOOK, reached out and hauled back: it pulls you off your feet to him ----------------
  TELL8.w8hook = (e, t, k) => { lane(e.x + e.facing * 20, e.x + e.facing * 110, e.y, 15, k); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(e.x + e.facing * 104, e.y - 4, 6, -1, 2); ctx.stroke(); };
  PLAN_FX.w8hook = (e) => { sfx('swing');
    act(e, 'hook', (h, dt, e) => { const k = h.el / .75; e.w8k = k;
      if (!h.hit && k > .22 && k < .42) { const f = fwdOf(e); if (f > 18 && f < 110 && Math.abs(P.y - e.y) < 15 && P.z < 30) { h.hit = 1; if (hitP(Math.round(edmg(e) * .8), e.x, true, { kind: 'melee', e })) { h.haul = 1; floatText(P.x, P.y, 80, 'HOOKED', '#E8C8A0', 14); } } }
      if (h.haul && k < .8 && P.state !== 'dead') { P.x += (e.x + e.facing * 34 - P.x) * Math.min(1, dt * 9); P.y += (e.y - P.y) * Math.min(1, dt * 6); }
      if (k >= 1) { recover(e, .8); return true; } return false; }); };

  // ---------------- PAVISE CROSSBOWMAN: THE BOLT, aimed down a line; it locks a moment before he looses ----------------
  AIM8.w8bolt = (e, k) => { const T0 = targets(e, () => ({ y: P.y })); if (k < .6) T0.y = P.y; };
  TELL8.w8bolt = (e, t, k) => { const T0 = e.w8T; if (!T0 || T0.plan !== e.plan) return; const y = clamp(T0.y, e.y - 40, e.y + 40), x0 = e.x + e.facing * 20, x1 = e.facing > 0 ? camX + VW : camX;
    ctx.strokeStyle = k < .6 ? `rgba(255,140,110,${.35 + .3 * k})` : `rgba(255,70,50,${.7 + .3 * Math.sin(t * 30)})`; ctx.lineWidth = k < .6 ? 1 : 2; ctx.setLineDash(k < .6 ? [4, 4] : []); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.setLineDash([]); };
  PLAN_FX.w8bolt = (e) => {
    const T0 = e.w8T && e.w8T.plan === 'w8bolt' ? e.w8T : { y: P.y }, y = clamp(T0.y, e.y - 40, e.y + 40); e.w8T = null;
    sfx('shoot'); sfx('whoosh', .5);
    projs.push({ owner: 'e', x: e.x + e.facing * 24, y, z: 40, vx: e.facing * 540, dmg: Math.round(edmg(e) * 1.05), life: 2.5, col: '#5A3A22', w8bolt: 1 });
    e.w8span = 1;
    act(e, 'bolt', (h, dt, e) => { e.w8k = h.el / .3; if (h.el > .3) { act(e, 'crank', (h2, dt2, e2) => { e2.w8k = h2.el / 1.1; if (h2.el >= 1.1) { e2.w8span = 0; recover(e2, .5); return true; } return false; }); } return false; }); };

  // ---------------- FLAGELLANT: THE LASH, three cuts of the scourge, each a little further ----------------
  TELL8.w8lash = (e, t, k) => { lane(e.x, e.x + e.facing * 88, e.y, 16, k * .7); };
  PLAN_FX.w8lash = (e) => {
    act(e, 'lash', (h, dt, e) => { const k = h.el / 1.0; e.w8k = k; e.x += e.facing * 30 * dt;
      for (let i = 0; i < 3; i++) { const at = .2 + i * .3; if (k > at && !h['l' + i]) { h['l' + i] = 1; sfx('swing'); const f = fwdOf(e); if (f > 0 && f < 88 && Math.abs(P.y - e.y) < 17 && P.z < 45) hitP(Math.round(edmg(e) * .7), e.x, i === 2, { kind: 'melee', e }); } }
      if (k >= 1) { recover(e, .9); return true; } return false; }); };
  // ---------------- FLAGELLANT: THE FRENZY, the scourge whirled round and round as he comes at you ----------------
  TELL8.w8frenzy = (e, t, k) => { ring(e.x, e.y, 76, k); };
  PLAN_FX.w8frenzy = (e) => { sfx('whoosh');
    act(e, 'frenzy', (h, dt, e) => { const k = h.el / 1.4; e.w8k = k; e.x += Math.sign(P.x - e.x) * 55 * dt; e.y += Math.sign(P.y - e.y) * 25 * dt;
      h.tick = (h.tick || 0) - dt; if (h.tick <= 0) { h.tick = .35; sfx('swing', .6); if (inEll(P.x, P.y, e.x, e.y, 76) && P.z < 40) hitP(Math.round(edmg(e) * .55), e.x, false, { kind: 'melee', e }); }
      if (k >= 1) { recover(e, 1.1); return true; } return false; },
      { draw(h, t) { const e = h.e; ctx.save(); ctx.strokeStyle = 'rgba(120,40,30,.35)'; ctx.lineWidth = 2; ell(e.x, e.y, 76, 76 / 2.2); ctx.stroke(); ctx.restore(); } }); };

  // ---------------- BELLMAN: THE TOLL, the clapper brought against his own bronze: the note goes out of the mouth of the bell
  // in front of him, and it hits like a wall (and leaves you half deaf, heavy on your feet) ----------------
  const cone = (e, L) => (x, y) => { const f = (x - e.x) * e.facing; return f > 0 && f < L && Math.abs(y - e.y) < 14 + f * .26; };
  TELL8.w8toll = (e, t, k) => { const L = 176; ctx.fillStyle = tellCol(k); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(e.x, e.y - 14); ctx.lineTo(e.x + e.facing * L, e.y - 14 - L * .26); ctx.lineTo(e.x + e.facing * L, e.y + 14 + L * .26); ctx.lineTo(e.x, e.y + 14); ctx.closePath(); ctx.fill(); ctx.stroke(); };
  PLAN_FX.w8toll = (e) => {
    act(e, 'toll', (h, dt, e) => { const k = h.el / .8; e.w8k = k;
      if (k > .25 && !h.rang) { h.rang = 1; tn(196, 1.4, 'sine', .14); tn(392, 1, 'sine', .06); tn(466, .8, 'triangle', .03); shakeMag = Math.max(shakeMag, 6);
        if (cone(e, 176)(P.x, P.y) && P.z < 50) { if (hitP(edmg(e), e.x, true, { kind: 'melee', e })) chill(1.6, 'DEAFENED'); }
        fx.push({ kind: 'ring', x: e.x + e.facing * 30, y: e.y, z: 40, t: .5, max: .5, r: 120, col: '#E8D098' }); }
      if (k >= 1) { recover(e, 1.1); return true; } return false; }); };
  // ---------------- BELLMAN: THE BELL DROPS, he jumps and comes down bell-first where you stood ----------------
  AIM8.w8bdrop = (e, k) => { targets(e, () => ({ x: xClamp(P.x), y: yClamp(P.y) })); };
  TELL8.w8bdrop = (e, t, k) => { const T0 = e.w8T; if (!T0 || T0.plan !== e.plan) return; ring(T0.x, T0.y, 62, k); };
  PLAN_FX.w8bdrop = (e) => { const T0 = e.w8T && e.w8T.plan === 'w8bdrop' ? e.w8T : { x: xClamp(P.x), y: yClamp(P.y) }; e.w8T = null; sfx('jump');
    const x0 = e.x, y0 = e.y;
    act(e, 'bdrop', (h, dt, e) => { const k = h.el / .75; e.w8k = k; const u = Math.min(1, k); e.x = lerp(x0, T0.x, u); e.y = lerp(y0, T0.y, u); e.z = Math.sin(u * Math.PI) * 90;
      if (u >= 1 && !h.land) { h.land = 1; e.z = 0; shakeMag = 10; sfx('slam'); tn(147, 1.2, 'sine', .12); dust(e.x, e.y, 14); fx.push({ kind: 'ring', x: e.x, y: e.y, z: 2, t: .4, max: .4, r: 80, col: '#E8D098', flat: 1 });
        if (inEll(P.x, P.y, e.x, e.y, 62) && P.z < 20) hitP(Math.round(edmg(e) * 1.25), e.x, true, { kind: 'melee', e }); }
      if (k >= 1.6) { recover(e, 1.2); return true; } return false; },
      { draw(h, t) { if (h.land) return; ring(T0.x, T0.y, 62, 1); } }); };

  // ---------------- FUNNEL-HAT CROW: THE PECK, down beak-first onto the marked spot; it sprawls there afterwards ----------------
  AIM8.w8peck = (e, k) => { const T0 = targets(e, () => ({ x: xClamp(P.x), y: yClamp(P.y) })); if (k < .5) { T0.x = xClamp(P.x); T0.y = yClamp(P.y); } };
  TELL8.w8peck = (e, t, k) => { const T0 = e.w8T; if (!T0 || T0.plan !== e.plan) return; ring(T0.x, T0.y, 30, k); ctx.strokeStyle = tellLine(k * .6); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(T0.x, T0.y); ctx.stroke(); ctx.setLineDash([]); };
  PLAN_FX.w8peck = (e) => { const T0 = e.w8T && e.w8T.plan === 'w8peck' ? e.w8T : { x: xClamp(P.x), y: yClamp(P.y) }; e.w8T = null; sfx('whoosh');
    const x0 = e.x, y0 = e.y, z0 = e.z;
    act(e, 'peck', (h, dt, e) => { const k = h.el / .42; e.w8k = k; const u = sm(Math.min(1, k)); e.x = lerp(x0, T0.x, u); e.y = lerp(y0, T0.y, u); e.z = lerp(z0, 2, u); e.facing = Math.sign(T0.x - x0) || e.facing;
      if (k >= 1 && !h.hit) { h.hit = 1; dust(e.x, e.y, 8); sfx('crunch', .6); if (inEll(P.x, P.y, e.x, e.y, 32) && P.z < 40) hitP(Math.round(edmg(e) * 1.15), e.x, true, { kind: 'melee', e }); }
      if (k >= 1) { e.grounded = 1.3; recover(e, 1.3); return true; } return false; },
      { draw(h, t) { if (!h.hit) ring(T0.x, T0.y, 30, 1, false); } }); };
  // ---------------- FUNNEL-HAT CROW: ITS MURDER, crows called up to fly at you down a lane (two lanes, later on) ----------------
  AIM8.w8murder = (e, k) => { targets(e, () => ({ y: yClamp(P.y), from: P.x < camX + VW / 2 ? 1 : -1 })); };
  TELL8.w8murder = (e, t, k) => { const T0 = e.w8T; if (!T0 || T0.plan !== e.plan) return; for (const y of [T0.y]) { lane(camX, camX + VW, y, 12, k * .8); label(T0.from > 0 ? camX + VW - 50 : camX + 50, y - 16, 'CAW', .8 * k); } };
  PLAN_FX.w8murder = (e) => { const T0 = e.w8T && e.w8T.plan === 'w8murder' ? e.w8T : { y: yClamp(P.y), from: 1 }; e.w8T = null; sfx('growl');
    hazards.push({ kind: 'w8crows', y: T0.y, dir: -T0.from, x: T0.from > 0 ? camX + VW + 30 : camX - 30, n: 3, t: 5, max: 5, el: 0, hit: false, dmg: Math.round(edmg(e) * .7) });
    recover(e, 1); };
  reg('w8crows', {
    update(h, dt) { h.el += dt; h.x += h.dir * 330 * dt;
      for (let i = 0; i < h.n; i++) { const x = h.x - h.dir * i * 34; if (!h.hit && Math.abs(P.x - x) < 14 && Math.abs(P.y - h.y) < 12 && P.z < 50) { h.hit = true; hitP(h.dmg, x - h.dir * 10, false); } }
      if ((h.dir > 0 && h.x - h.n * 34 > camX + VW + 40) || (h.dir < 0 && h.x + h.n * 34 < camX - 40)) h.t = -1; },
    ups(h, list, t) { for (let i = 0; i < h.n; i++) { const x = h.x - h.dir * i * 34, y = h.y; list.push([y, () => { shadow(x, y, 7); ctx.save(); ctx.translate(x, y - 34 - Math.sin(t * 9 + i) * 3); ctx.scale(h.dir, 1); W8.art.crowFly(0, 0, 1.5, t * 3 + i * .3, 1); ctx.fillStyle = C('#1A1612'); ell(3, .5, 4, 2.2); ctx.fill(); ctx.restore(); }]); } },
    box(h, box) { box(h.x - h.dir * 34, h.y, 0, 90, 60); },
  });

  // ---------------- WALKING EGG: THE KICK, one long leg straight out like a mule's ----------------
  TELL8.w8kick = (e, t, k) => { lane(e.x, e.x + e.facing * 64, e.y, 15, k); };
  PLAN_FX.w8kick = (e) => { sfx('swing');
    act(e, 'kick', (h, dt, e) => { const k = h.el / .45; e.w8k = k;
      if (!h.hit && k > .2 && k < .55) { const f = fwdOf(e); if (f > 0 && f < 64 && Math.abs(P.y - e.y) < 16 && P.z < 40) { h.hit = 1; if (hitP(edmg(e), e.x, true, { kind: 'melee', e })) P.vx = e.facing * 360; } }
      if (k >= 1) { recover(e, .6); return true; } return false; }); };
  // ---------------- WALKING EGG: THE ROLL, legs in, and it bowls along its lane and back off the edge of the field ----------------
  TELL8.w8roll = (e, t, k) => { lane(e.x, e.facing > 0 ? camX + VW : camX, e.y, 15, k * .8); };
  PLAN_FX.w8roll = (e) => { sfx('whoosh'); let dir = e.facing, bounced = 0;
    act(e, 'roll', (h, dt, e) => { e.w8k = h.el; e.x += dir * 320 * dt; e.facing = dir; if (Math.random() < .6) dust(e.x, e.y, 1);
      if (!h.hit && Math.abs(P.x - e.x) < e.hw + 10 && Math.abs(P.y - e.y) < 15 && P.z < 26) { h.hit = 1; hitP(edmg(e), e.x, true, { kind: 'melee', e }); }
      if ((e.x < leftWall() + 10 && dir < 0) || (e.x > rightWall() - 10 && dir > 0)) { if (bounced) { recover(e, 1); return true; } bounced = 1; dir = -dir; h.hit = 0; sfx('slam', .5); shakeMag = Math.max(shakeMag, 4); }
      if (h.el > 3) { recover(e, 1); return true; } return false; }); };

  // ---------------- THE HANGMAN: THE NOOSE, swung round his head and thrown down his lane: if it takes you, he hauls you in ----------------
  TELL8.w8noose = (e, t, k) => { lane(e.x + e.facing * 16, e.x + e.facing * 270, e.y, 13, k); };
  PLAN_FX.w8noose = (e) => { sfx('whoosh');
    act(e, 'noose', (h, dt, e) => { const k = h.el; const reach = k < .35 ? 270 * sm(k / .35) : 270 * (1 - sm((k - .35) / .4)); h.reach = reach;
      if (!h.caught && k < .4) { const f = fwdOf(e); if (f > 0 && f < reach && Math.abs(P.y - e.y) < 13 && P.z < 45 && P.state !== 'dodge' && !(P.inv > 0)) { h.caught = 1; floatText(P.x, P.y, 86, 'NOOSED', '#E8C8A0', 16); sfx('hurt'); } }
      if (h.caught && alive()) { P.state = 'hurt'; P.t = .3; P.knocked = false; P.vx = 0; P.x += (e.x + e.facing * 44 - P.x) * Math.min(1, dt * 8); P.y += (e.y - P.y) * Math.min(1, dt * 6); h.rx = P.x; }
      if (k >= .78) { if (h.caught) { e.plan = 'w8axe'; e.w8hauled = 1; wind(e, .5); } else recover(e, .8); return true; } return false; },
      { up(h, t) { const e = h.e, x = h.caught ? (h.rx ?? P.x) : e.x + e.facing * (h.reach || 0); onMain(() => { ctx.strokeStyle = 'rgba(120,100,70,.95)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(e.x + e.facing * 10, e.y - 70); ctx.quadraticCurveTo((e.x + x) / 2, e.y - 40, x, e.y - 30); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x, e.y - 30, 5, 7, 0, 0, TAU); ctx.stroke(); }); }, uy: e.y + 1 }); };
  // ---------------- THE HANGMAN: THE AXE, lifted as high as it will go and brought down; it bites into the ground and
  // sticks there a moment: hit him then ----------------
  TELL8.w8axe = (e, t, k) => { lane(e.x + e.facing * 6, e.x + e.facing * 110, e.y, 22, k); };
  PLAN_FX.w8axe = (e) => { sfx('whoosh'); e.w8hauled = 0;
    act(e, 'axe', (h, dt, e) => { const k = h.el / .6; e.w8k = k;
      if (!h.hit && k > .28 && k < .46) { const f = fwdOf(e); if (f > 0 && f < 112 && Math.abs(P.y - e.y) < 22 && P.z < 50) { h.hit = 1; hitP(Math.round(edmg(e) * 1.6), e.x, true, { kind: 'melee', e }); } }
      if (k > .4 && !h.bite) { h.bite = 1; shakeMag = 9; sfx('slam'); dust(e.x + e.facing * 80, e.y, 10); }
      if (k >= 1) { floatText(e.x, e.y, e.hh + 30, 'THE AXE STICKS', '#E8D8B0', 12); recover(e, 1.5); return true; } return false; }); };
  // ---------------- THE HANGMAN: THE GALLOWS, which come up out of the ground under you ----------------
  AIM8.w8gallows = (e, k) => { const T0 = targets(e, () => ({ x: xClamp(P.x), y: yClamp(P.y) })); if (k < .55) { T0.x = xClamp(P.x); T0.y = yClamp(P.y); } };
  TELL8.w8gallows = (e, t, k) => { const T0 = e.w8T; if (!T0 || T0.plan !== e.plan) return; ring(T0.x, T0.y, 36, k); };
  PLAN_FX.w8gallows = (e) => { const T0 = e.w8T && e.w8T.plan === 'w8gallows' ? e.w8T : { x: xClamp(P.x), y: yClamp(P.y) }; e.w8T = null;
    hazards.push({ kind: 'w8gallows', x: T0.x, y: T0.y, el: 0, at: .55, t: 3.2, max: 3.2, dmg: Math.round(edmg(e) * 1.2), f: e.facing }); sfx('crunch'); recover(e, .9); };
  reg('w8gallows', {
    update(h, dt) { h.el += dt; if (h.el >= h.at && !h.up) { h.up = 1; sfx('crunch'); shakeMag = Math.max(shakeMag, 7); dust(h.x, h.y, 12); if (inEll(P.x, P.y, h.x, h.y, 36) && P.z < 30) { if (hitP(h.dmg, h.x, true)) P.vz = 300; } } },
    draw(h, t) { if (h.el < h.at) ring(h.x, h.y, 36, h.el / h.at); },
    ups(h, list, t) { if (!h.up) return; list.push([h.y, () => { const u = sm((h.el - h.at) / .2) * (1 - sm((h.el - h.max + .5) / .5)); ctx.save(); ctx.translate(h.x, h.y); ctx.scale(h.f, u);
      ctx.strokeStyle = C(OUT); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-6, -84); ctx.lineTo(28, -84); ctx.moveTo(-6, -66); ctx.lineTo(12, -84); ctx.stroke(); ctx.strokeStyle = C('#3A2A1C'); ctx.lineWidth = 3.6; ctx.stroke();
      ctx.strokeStyle = C('#8A7A5A'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(24, -84); ctx.lineTo(24, -64); ctx.stroke(); ctx.beginPath(); ctx.ellipse(24, -60, 3.4, 4.4, 0, 0, TAU); ctx.stroke(); ctx.restore(); }]); },
    box(h, box) { box(h.x, h.y, 0, 50, 100); },
  });
  // ---------------- THE HANGMAN: THE SWEEP, the axe swung flat all the way round him (jump it) ----------------
  TELL8.w8sweep = (e, t, k) => { ring(e.x, e.y, 100, k); };
  PLAN_FX.w8sweep = (e) => { sfx('whoosh');
    act(e, 'sweep', (h, dt, e) => { const k = h.el / .65; e.w8k = k;
      if (!h.hit && k > .3 && k < .62) { if (inEll(P.x, P.y, e.x, e.y, 100) && P.z < 22) { h.hit = 1; hitP(Math.round(edmg(e) * 1.2), e.x, true, { kind: 'melee', e }); } }
      if (k >= 1) { recover(e, 1.1); return true; } return false; }); };
  Object.assign(BOSS_WIND, {}); // (the common foes keep their own wind-ups; the Goat-Lord's are set with his rule)
  });

  // ======================================================================================================
  // THE RULES OF THE PLACES, and the small behaviours every foe of this world shares
  // ======================================================================================================
  W8.lateParts.push(() => {
  const { alive, reg, act, hitP, inEll, yClamp, xClamp, tellCol, tellLine, label, lane, ring, ash, fwdOf } = W8.akit;
  const inLorraine = () => typeof baseStage !== 'undefined' && baseStage && baseStage.theme === 'lorraine';
  // ---------------- every frame, for every foe here: the aim of their wind-ups, the Circle's cold on the prince ----------------
  const _upd = updateEnemy;
  updateEnemy = function (e, dt) {
    if (e.state === 'wind' && W8.AIM8[e.plan] && !e.dead && stillT <= 0) W8.AIM8[e.plan](e, 1 - e.t / e.windMax);
    if (e.state === 'w8hunt') { if (stillT > 0) return; huntStep(e, dt); return; }
    return _upd(e, dt);
  };
  const _up = updatePlayer;
  updatePlayer = function (dt) {
    const x0 = P.x, y0 = P.y; _up(dt);
    if ((P.w8slow || 0) > 0) { P.w8slow -= dt; if (P.state !== 'dodge') { P.x = x0 + (P.x - x0) * .55; P.y = y0 + (P.y - y0) * .55; } }
    if (W8.afterPlayer) W8.afterPlayer(dt, x0, y0);
  };
  // ---------------- the Bellman's bronze and the crossbowman's pavise turn blows from the front ----------------
  const heavyM = (m) => m && (m.trump || m.power === 2 || m.launch || m.smash || m.shock || (m.key && m.key.includes('H')) || m.key === 'X');
  const msg = (e, s, col = '#E8D8B0') => { if (!(e.w8msg > performance.now())) { e.w8msg = performance.now() + 700; floatText(e.x, e.y, e.hh + 16, s, col, 12); } };
  const _strike = strike;
  strike = function (e, base, dir, m, echo) {
    m = m || {};
    if (e.type === 'w8bell' && !e.dead && (e.w8crack || 0) < 2 && !m.trump && !m.el && Math.sign(P.x - e.x) === e.facing && e.state !== 'down') {
      if (heavyM(m)) { e.w8crack = (e.w8crack || 0) + 1; sfx('hit-metal'); tn(220 + e.w8crack * 40, .9, 'sine', .1); burst(e.x, e.y, 40, MAT_COL.bronze, 10, 'metal', dir); msg(e, e.w8crack >= 2 ? 'THE BELL BREAKS OPEN' : 'CRACKED', '#F2D890'); }
      else { base *= .3; m = Object.assign({}, m, { kb: (m.kb || 0) * .2, launch: 0, noStun: 1 }); tn(330 + Math.random() * 40, .5, 'sine', .05); msg(e, 'CLANG'); }
    }
    if (e.type === 'w8xbow' && !e.dead && (e.w8pav || 0) > 0 && !m.trump && Math.sign(P.x - e.x) === e.facing && !e.w8pavCarry) {
      if (heavyM(m)) { e.w8pav = Math.max(0, e.w8pav - 2); base *= .5; } else { e.w8pav--; sfx('hit-flesh', .3); burst(e.x + e.facing * 18, e.y, 30, ['#C23A1E', '#8A5A3A', '#E8DCC4'], 6, 'rock', dir); msg(e, 'PAVISE'); if (e.w8pav > 0) return; }
      if (e.w8pav <= 0) { msg(e, 'PAVISE BROKEN', '#F2C090'); sfx('break'); burst(e.x + e.facing * 18, e.y, 30, ['#C23A1E', '#6A3A22', '#E8DCC4'], 18, 'rock', dir, true); }
      if (!heavyM(m)) return;
    }
    if (W8.strikeGate && W8.strikeGate(e, m) === false) return;
    return _strike(e, base, dir, m, echo);
  };
  // the crossbowman carries his pavise while he walks, and plants it when he stops to shoot
  { const _u2 = updateEnemy; updateEnemy = function (e, dt) { const r = _u2(e, dt);
    if (e.type === 'w8xbow' && !e.dead) { if (e.w8pav === undefined) e.w8pav = 3; const moving = (e.walk || 0) > 0 && e.state === 'idle'; e.w8pavCarry = moving; e.w8pavX = lerp(e.w8pavX ?? 18, moving ? 8 : 18, Math.min(1, dt * 8)); }
    return r; }; }

  // ---------------- tells and upright effects, painted in depth with the figures (secret rooms too) ----------------
  const _mb = mechBoxes; mechBoxes = function (box) { _mb(box); for (const h of hazards) if (HZ8()[h.kind] && HZ8()[h.kind].box) HZ8()[h.kind].box(h, box); if (W8.boxes) W8.boxes(box); };
  const _ml = mechList; mechList = function (list, t) { _ml(list, t);
    for (const h of hazards) if (HZ8()[h.kind] && HZ8()[h.kind].ups && h.t > -.4) HZ8()[h.kind].ups(h, list, t);
    for (const e of enemies) if (!e.boss && e.state === 'wind' && W8.TELL8[e.plan]) list.push([-1e4, () => onMain(() => { ctx.save(); W8.TELL8[e.plan](e, t, 1 - e.t / e.windMax); ctx.restore(); })]);
    if (W8.list) W8.list(list, t); };
  const HZ8 = () => W8.HZ;

  // ======================================================================================================
  // THE WINTER FIELDS ('w8flight'): every fight here, villagers come running out of the Circle's way across the field;
  // the Circle's things go after them. Get between them. One who gets clear leaves you what they can (bread, a coin, a
  // candle for a saint); one who falls gets up again, grey, and comes at you
  // ======================================================================================================
  const KINDS = ['wife', 'man', 'old'];
  const VSPD = { wife: 66, man: 74, old: 48 };
  function newVillager(i) { const kind = KINDS[i % 3]; return { kind, x: (lockX ?? camX) + VW + 30 + i * 6, y: yClamp(rand(FLOOR_TOP + 16, FLOOR_BOT - 8)), hp: 2, state: 'run', walk: rand(0, 6), hurtT: 0, deadT: 0, cower: 0 }; }
  W8.vill = { saved: 0, lost: 0, seen: 0 };
  MECH_FX.w8flight = {
    start(m) { m.vs = []; m.q = []; m.wasActive = false; if (zoneIdx === 0 && !stage.secret) W8.vill = { saved: 0, lost: 0, seen: 0 }; },
    update(m, dt) {
      if (stillT > 0) return;
      if (waveActive && !m.wasActive) { const n = waveIdx === 0 ? 3 : 4; for (let i = 0; i < n; i++) m.q.push({ at: 1.2 + i * 2.6, i: m.vs.length + i }); }
      m.wasActive = waveActive;
      for (const q of m.q) q.at -= dt;
      while (m.q.length && m.q[0].at <= 0) { const q = m.q.shift(); const v = newVillager(q.i); m.vs.push(v); W8.vill.seen++; if (W8.vill.seen === 1) floatText(P.x, P.y, 110, 'THEY ARE RUNNING FROM THE CIRCLE · PROTECT THEM', '#F2E6C8', 13); }
      for (const v of m.vs) {
        v.hurtT = Math.max(0, v.hurtT - dt);
        if (v.state === 'dead') { v.deadT += dt; if (v.deadT > 1.6 && !v.rose) { v.rose = 1; riseHollow(v.x, v.y); } continue; }
        if (v.state === 'saved') continue;
        const hunted = enemies.some(e => e.w8prey === v && !e.dead && (e.state === 'w8hunt' || e.state === 'w8act') && Math.abs(e.x - v.x) < 70);
        if (v.hurtT > 0) { v.state = 'cower'; v.walk = 0; }
        else { v.state = 'run'; v.x -= VSPD[v.kind] * (hunted ? 1.25 : 1) * dt; v.walk += dt * 9; if (Math.random() < dt * 6) dust(v.x + 6, v.y, 1); }
        v.y += (clamp(v.y, FLOOR_TOP + 12, FLOOR_BOT - 4) - v.y) * dt;
        if (v.x < camX - 30) { v.state = 'saved'; W8.vill.saved++; giveGift(v); }
      }
      m.vs = m.vs.filter(v => !(v.state === 'saved') && !(v.state === 'dead' && v.rose && v.deadT > 6));
    },
    boxes(m, box) { for (const v of m.vs) box(v.x, v.y, 0, 50, 80); },
    list(m, list, t) { for (const v of m.vs) list.push([v.y, () => { shadow(v.x, v.y, 10); ctx.save(); ctx.translate(v.x, v.y); ctx.scale(-1, 1); FLASH = v.hurtT > .3; W8.villager(v, t); FLASH = false; ctx.restore();
      if (v.state !== 'dead' && v.hp < 2) onMain(() => { ctx.fillStyle = 'rgba(20,12,10,.6)'; ctx.fillRect(v.x - 10, v.y - 64, 20, 3); ctx.fillStyle = '#E8C060'; ctx.fillRect(v.x - 10, v.y - 64, 10 * v.hp, 3); }); }]); },
  };
  function giveGift(v) {
    const gift = { wife: 'heal', man: 'shard', old: 'sigil' }[v.kind], x = camX + 30, y = v.y;
    banner('SAVED', { wife: 'SHE LEAVES YOU HER BREAD', man: 'HE LEAVES YOU WHAT HE HAD', old: 'HE LIGHTS A CANDLE FOR YOU' }[v.kind], 1.2);
    if (gift === 'heal') { loot.push(makeLoot('heal', x, y, Math.round(maxHp() * .12))); loot.push(makeLoot('heal', x, y, Math.round(maxHp() * .08))); }
    else if (gift === 'shard') for (let i = 0; i < 5; i++) loot.push(makeLoot('shard', x, y, 4 + stageIdx));
    else { loot.push(makeLoot('sigil', x, y, 1)); loot.push(makeLoot('heal', x, y, Math.round(maxHp() * .1))); }
    sfx('pick'); tn(660, .3, 'triangle', .06); tn(880, .4, 'triangle', .05, 0, .12);
  }
  function riseHollow(x, y) {
    if (!stage || stage.bossRoom) return;
    const e = spawnEnemy('w8hollow', 1, false); e.x = clamp(x, camX + 30, camX + VW - 30); e.y = y; e.facing = Math.sign(P.x - e.x) || 1;
    if (typeof setEntrance === 'function' && ENTER_FX.w8rise) { e.state = 'idle'; setEntrance(e, 'w8rise'); e.x = clamp(x, camX + 30, camX + VW - 30); e.y = y; }
    floatText(x, y, 90, 'THE CIRCLE TAKES THEM · THEY GET UP GREY', '#C8C2B4', 12);
    if (!waveActive) { waveActive = true; lockX = clamp(camX, 0, stage.len - VW); }
  }
  // the hunt: a foe of the Circle sees a villager nearer than you and goes after them (hit it and it turns on you)
  const PREY_ACT = { w8hollow: 'flail', w8halberd: 'thrust', w8flag: 'lash', w8egg: 'kick', w8bell: 'toll', w8crow: 'peck' };
  { const _u3 = updateEnemy; updateEnemy = function (e, dt) {
    if (mech && mech.kind === 'w8flight' && !e.dead && !e.boss && e.state === 'idle' && PREY_ACT[e.type] && e.cd <= 0 && !e.w8noPrey) {
      const vs = mech.vs.filter(v => v.state === 'run' || v.state === 'cower'), dP = Math.abs(P.x - e.x) + Math.abs(P.y - e.y);
      const v = vs.filter(v => Math.abs(v.x - e.x) < 260 && Math.abs(v.x - e.x) + Math.abs(v.y - e.y) < dP * .9 && !enemies.some(o => o !== e && o.w8prey === v && !o.dead)).sort((a, b) => Math.abs(a.x - e.x) - Math.abs(b.x - e.x))[0];
      if (v && Math.random() < .5) { e.w8prey = v; e.state = 'w8hunt'; e.t = 0; e.plan = null; return; }
      e.w8noPrey = 1; setTimeout(() => { e.w8noPrey = 0; }, 900);
    }
    return _u3(e, dt); }; }
  function huntStep(e, dt) {
    const v = e.w8prey; e.flash = Math.max(0, e.flash - dt); e.sqx += (1 - e.sqx) * Math.min(1, dt * 12); e.sqy += (1 - e.sqy) * Math.min(1, dt * 12);
    if (!v || v.state === 'dead' || v.state === 'saved' || !mech || mech.kind !== 'w8flight') { e.state = 'idle'; e.w8prey = null; return; }
    e.t += dt; if (e.t > 6) { e.state = 'idle'; e.w8prey = null; e.cd = 1; return; }
    const side = Math.sign(e.x - v.x) || 1, tx = v.x + side * 34, fly = e.def.move === 'fly';
    e.facing = -side;
    if (Math.abs(e.x - tx) > 6 || Math.abs(e.y - v.y) > 6) { e.x += Math.sign(tx - e.x) * Math.min(Math.abs(tx - e.x), e.def.spd * 1.3 * dt); e.y += Math.sign(v.y - e.y) * Math.min(Math.abs(v.y - e.y), e.def.spd * .8 * dt); e.walk += dt * 10; return; }
    // close enough: its usual blow, at the villager
    const name = PREY_ACT[e.type]; e.walk = 0;
    act(e, name, (h, dt2, e2) => { const k = h.el / .6; e2.w8k = k; if (fly) e2.z = lerp(e2.def.hover, 6, Math.sin(Math.min(1, k) * Math.PI));
      if (k > .45 && !h.hitV) { h.hitV = 1; sfx('hit-flesh', .5); if (Math.abs(v.x - e2.x) < 60 && v.state !== 'dead') { v.hp--; v.hurtT = .7; v.x -= 16; floatText(v.x, v.y, 70, v.hp > 0 ? 'HELP US!' : '', '#F2E6C8', 12); burst(v.x, v.y, 30, ['#C8607A', '#E8D8C0'], 8, 'flesh', -1);
        if (v.hp <= 0) { v.state = 'dead'; v.deadT = 0; W8.vill.lost++; sfx('hurt'); } } }
      if (k >= 1) { e2.w8prey = v.hp > 0 ? v : null; e2.state = v.hp > 0 ? 'w8hunt' : 'idle'; e2.cd = 1.2; return true; } return false; });
  }

  // ======================================================================================================
  // THE EDGE OF THE CIRCLE ('w8edge'): the Circle's edge lies across the field ahead. While you fight it breathes in
  // and out: it swells across the ground (WARNING first), holds, and ebbs. What it covers is grisaille, the grey
  // underpainting: it drinks you (down to your last breath, never past it) and stops your healing, and it shields its
  // own (they take a third of every blow). Iron watchfires stand in the field: strike one to light it, and while it
  // burns the edge cannot pass it
  // ======================================================================================================
  const EW = (y) => Math.sin(y * .07) * 10 + Math.sin(y * .19 + 1) * 5; // the edge's ragged line
  W8.edgeAt = (y) => (mech && mech.kind === 'w8edge' ? mech.E + EW(y) : 1e9);
  W8.inGrey = (x, y) => mech && mech.kind === 'w8edge' && x > mech.E + EW(y);
  MECH_FX.w8edge = {
    start(m) { m.E = camX + VW * 1.2; m.phase = 'calm'; m.t = 3; m.fires = []; m.lockAt = null; m.drink = 0; m.shield = 0; },
    update(m, dt) {
      if (stillT > 0) return;
      const L = lockX ?? camX;
      if (waveActive && lockX !== null && m.lockAt !== lockX) { m.lockAt = lockX; m.fires = [.24, .5, .76].map((u, i) => ({ x: lockX + VW * u, y: FLOOR_TOP + 22 + (i % 2) * 50, lit: 0, flash: 0 })); m.phase = 'calm'; m.t = 2.5; m.E = Math.max(m.E, lockX + VW * .92); }
      const restE = L + VW * .92;
      m.t -= dt;
      if (!waveActive) { m.phase = 'calm'; m.E += (Math.max(restE, camX + VW * .95) - m.E) * Math.min(1, dt * .8); m.E = Math.max(m.E, camX + VW * .82); }
      else if (m.phase === 'calm') { m.E += (restE - m.E) * Math.min(1, dt * 1.5); if (m.t <= 0) { m.phase = 'warn'; m.t = 1.3; floatText(P.x, P.y, 110, 'THE CIRCLE SWELLS', '#C8C2B4', 15); sfx('growl'); tn(55, 1.3, 'sawtooth', .06, 45); } }
      else if (m.phase === 'warn') { if (m.t <= 0) { m.phase = 'surge'; m.t = 2; sfx('whoosh'); shakeMag = Math.max(shakeMag, 5); } }
      else if (m.phase === 'surge') { m.E -= 170 * dt; if (m.E < L + VW * .26 || m.t <= 0) { m.phase = 'hold'; m.t = 3.2; } }
      else if (m.phase === 'hold') { if (m.t <= 0) { m.phase = 'ebb'; m.t = 2.2; } }
      else if (m.phase === 'ebb') { m.E += 150 * dt; if (m.E >= restE || m.t <= 0) { m.phase = 'calm'; m.t = rand(3.5, 5); } }
      // the watchfires hold it back
      for (const f of m.fires) { f.lit = Math.max(0, f.lit - dt); f.flash = Math.max(0, f.flash - dt); if (f.lit > 0) m.E = Math.max(m.E, f.x + 46); }
      if (P && (P.state === 'atk' || P.state === 'air') && P.move) for (const f of m.fires) { if (f.lit > 1 || W8.inGrey(f.x, f.y)) continue; const fw = (f.x - P.x) * P.facing; if (fw > -10 && fw < (P.move.x1 || 50) + 20 && Math.abs(f.y - P.y) < 26) { f.lit = 13; f.flash = .3; sfx('hit-metal', .4); tn(520, .3, 'triangle', .05); burst(f.x, f.y, 52, ['#FFD27A', '#FF8A3A', '#FFF0C0'], 16, 'spark', 0, true); floatText(f.x, f.y, 90, 'THE FIRE HOLDS IT BACK', '#FFD890', 12); } }
      // the grey drinks you
      if (P && P.state !== 'dead' && W8.inGrey(P.x, P.y)) { m.drink += dt; if (m.drink > .5) { m.drink = 0; if (P.hp > 1) { P.hp = Math.max(1, P.hp - Math.max(1, Math.round(maxHp() * .012 * (1 + .25 * (save.cycle || 0))))); hurtFlash = Math.max(hurtFlash, .08); if (!(m.msgT > 0)) { m.msgT = 3; floatText(P.x, P.y, 90, 'THE GREY DRINKS YOU', '#C8C2B4', 12); } } } }
      m.msgT = Math.max(0, (m.msgT || 0) - dt);
      for (const e of enemies) if (!e.dead && W8.inGrey(e.x, e.y) && e.hp < e.maxHp && Math.random() < dt * 2) e.hp = Math.min(e.maxHp, e.hp + Math.max(1, Math.round(e.maxHp * .01)));
    },
    boxes(m, box) { for (const f of m.fires) box(f.x, f.y, 0, 40, 110); },
    list(m, list, t) { for (const f of m.fires) list.push([f.y, () => watchfire(f, t, W8.inGrey(f.x, f.y))]); },
  };
  // healing is stopped in the grey, and its own take a third of every blow there
  { const _ld = updateLoot; updateLoot = function (dt) { if (mech && mech.kind === 'w8edge' && P && W8.inGrey(P.x, P.y)) { const hp0 = P.hp; _ld(dt); if (P.hp > hp0) { P.hp = hp0; floatText(P.x, P.y, 80, 'NOTHING HEALS IN THE GREY', '#C8C2B4', 11); } return; } return _ld(dt); }; }
  W8.strikeGate = (e, m) => { if (mech && mech.kind === 'w8edge' && !e.boss && W8.inGrey(e.x, e.y) && !m.trump) { m.w8grey = 1; } return true; };
  { const _h = hurtEnemy; hurtEnemy = function (e, dmg, dir, m, crit) { if (m && m.w8grey) { dmg = Math.max(1, Math.round(dmg * .34)); if (!(e.w8msg > performance.now())) { e.w8msg = performance.now() + 900; floatText(e.x, e.y, e.hh + 26, 'THE GREY SHIELDS IT', '#C8C2B4', 11); } } return _h(e, dmg, dir, m, crit); }; }
  // an iron cresset on a post: cold and black, or burning
  function watchfire(f, t, grey) {
    ctx.save(); ctx.translate(f.x, f.y); ctx.lineCap = 'round';
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 4.4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -54); ctx.stroke(); ctx.strokeStyle = C('#3A2E26'); ctx.lineWidth = 2.6; ctx.stroke();
    for (const s of [-1, 1]) { ctx.strokeStyle = C(OUT); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(s * 10, 0); ctx.stroke(); }
    const bk = PB([-10, -58, 10, -58, 7, -48, -7, -48]); W8.kit.cel(bk, '#2A2420', { d: .8, r: .5, w: 1.3, lite: '#6A6058' });
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 1.6; ctx.beginPath(); for (const x of [-8, -3, 3, 8]) { ctx.moveTo(x, -58); ctx.lineTo(x * .7, -48); } ctx.stroke();
    if (f.lit > 0) { const a = Math.min(1, f.lit / 1.5); onMain(() => { glowM(0, -62, 30, '255,170,80', .25 * a); for (let i = 0; i < 5; i++) { const fl = Math.sin(t * 9 + i * 1.7); ctx.fillStyle = `rgba(${i % 2 ? '255,210,110' : '255,130,50'},${.85 * a})`; ctx.beginPath(); const x = -6 + i * 3; ctx.moveTo(x - 3, -58); ctx.quadraticCurveTo(x - 2 + fl, -66 - i % 3 * 3, x + fl * 2, -74 - (i % 2) * 6); ctx.quadraticCurveTo(x + 2, -64, x + 3, -58); ctx.fill(); }
      if (Math.random() < .3) parts.push({ x: f.x + rand(-5, 5), y: f.y, z: 66, vx: rand(-10, 10), vy: 0, vz: rand(30, 70), life: .8, max: .8, col: pick(['#FFD27A', '#FF8A3A']), size: 1.6, shape: 'star', rot: 0, vr: 3 }); }); }
    else if (!grey) onMain(() => { ctx.fillStyle = `rgba(255,230,180,${.45 + .3 * Math.sin(t * 4)})`; ctx.font = '700 8px Cinzel, Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('STRIKE TO LIGHT', 0, -66); });
    ctx.restore();
  }
  // the grisaille itself: everything past the edge, figures and all, painted down to the grey underpainting
  const _gf = gradeFrame;
  gradeFrame = function (themeId) {
    _gf(themeId);
    if (typeof mech === 'undefined' || !mech || !stage || zoneTrans) return;
    if (mech.kind === 'w8edge') greyPast((y) => mech.E + EW(y) - camX, 1, performance.now() / 1000);
    if (mech.kind === 'w8heart' && W8.walls) W8.walls(performance.now() / 1000);
  };
  function greyPast(xAt, side, t) { // side 1: the grey lies to the right of the line
    const Y0 = Y_OFF, Y1 = VH, path = () => { ctx.beginPath(); ctx.moveTo(xAt(Y0), Y0); for (let y = Y0; y <= Y1; y += 6) ctx.lineTo(xAt(y), y); ctx.lineTo(side > 0 ? VW + 20 : -20, Y1); ctx.lineTo(side > 0 ? VW + 20 : -20, Y0); ctx.closePath(); };
    if (xAt((Y0 + Y1) / 2) > VW + 30) return;
    ctx.save(); path(); ctx.clip();
    ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#808080'; ctx.fillRect(0, Y0, VW, Y1 - Y0);
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(206,198,184,1)'; ctx.fillRect(0, Y0, VW, Y1 - Y0);
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(60,56,50,.12)'; ctx.fillRect(0, Y0, VW, Y1 - Y0);
    ctx.strokeStyle = 'rgba(20,16,12,.12)'; ctx.lineWidth = .6; ctx.beginPath(); for (let i = 0; i < 60; i++) { const x = ((i * 53.7 - camX * .9) % (VW + 60) + VW + 60) % (VW + 60) - 30, y = Y0 + hsh(i) * (Y1 - Y0); ctx.moveTo(x, y); ctx.lineTo(x + 12, y - 12); } ctx.stroke(); // the underdrawing's hatching
    ctx.restore();
    // the edge: a ragged line of ink, thorns of black growing up along it, ash lifting off
    ctx.save(); ctx.strokeStyle = 'rgba(16,12,10,.85)'; ctx.lineWidth = 2.6; ctx.beginPath(); for (let y = Y0; y <= Y1; y += 6) { const x = xAt(y) + Math.sin(y * .9 + t * 2) * 1.2; y === Y0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
    ctx.strokeStyle = 'rgba(16,12,10,.6)'; ctx.lineWidth = 1; ctx.beginPath(); for (let y = FLOOR_TOP - 10; y <= Y1; y += 9) { const x = xAt(y), h = 6 + hsh(y) * 12; ctx.moveTo(x, y); ctx.lineTo(x + (hsh(y + 1) - .3) * 8, y - h); ctx.moveTo(x + 2, y - h * .5); ctx.lineTo(x - 3, y - h * .7); } ctx.stroke();
    for (let i = 0; i < 18; i++) { const life = (t * .25 + hsh(i)) % 1, y = lerp(Y1, Y0 + 20, life), x = xAt(y) + 6 + hsh(i + 3) * 20 + life * 14; ctx.fillStyle = `rgba(90,84,76,${.55 * Math.sin(life * Math.PI)})`; ctx.fillRect(x, y, 2, 1.2); }
    ctx.restore();
  }
  W8.greyPast = greyPast;
  // the strangers who join the first fight of the edge come only from the road actually walked (not the other Trumps' worlds)
  { const other = () => Object.keys(EDEF).filter(k => { const w = STAGES.findIndex(st => (st.waves || []).some(wv => wv.some(tp => tp.replace(/[*!]/g, '') === k))); return (w === 5 || w === 6) && !EDEF[k].noRandom; });
    const _ss = startStage; startStage = function (i) { for (const k of Object.keys(EDEF)) if (EDEF[k].w8hid) { delete EDEF[k].noRandom; delete EDEF[k].w8hid; }
      if (STAGES[i] && STAGES[i].theme === 'lorraine') for (const k of other()) { EDEF[k].noRandom = 1; EDEF[k].w8hid = 1; }
      return _ss(i); }; }
  });

  // ======================================================================================================
  // THE GOAT-LORD'S FIGHT ('w8heart'): his four shapes, each fought in full (no blow carries him past the end of one),
  // the changes between them, his attacks, and his fall
  // ======================================================================================================
  W8.lateParts.push(() => {
  const { alive, reg, act, hitP, inEll, yClamp, xClamp, tellCol, tellLine, label, lane, ring, ash, fwdOf } = W8.akit;
  const B = BOSSES.w8goat, isGoat = (e) => e && e.def === B;
  const ENDS = { 2: .75, 3: .5, 4: .25 };
  const SHAPE = {
    1: { name: 'The Goat-Lord', title: 'HE CAME IN BY YOUR CURSE', size: 1.15, dmg: 1 },
    2: { name: 'The Tithe of Lorraine', title: 'HE CALLS IN WHAT THE CIRCLE TOOK', size: 1.15, dmg: 1.06 },
    3: { name: 'The Horned Gate', title: 'THE HOLE OPENS UNDER HIM', size: 1.3, dmg: 1.14 },
    4: { name: 'Your Curse', title: 'HE READS YOU YOUR OWN WORDS', size: 1.22, dmg: 1.2 },
  };
  const formOf = (e) => (e && e.w8form) || 1;
  Object.defineProperty(B, 'name', { get() { return SHAPE[formOf(typeof boss !== 'undefined' ? boss : null)].name; }, configurable: true });
  Object.defineProperty(B, 'title', { get() { return SHAPE[formOf(typeof boss !== 'undefined' ? boss : null)].title; }, configurable: true });
  Object.assign(BOSS_WIND, { w8crook: 1.0, w8bind: 1.2, w8butt: 1.0, w8bleat: .85, w8gore: 1.15, w8hands: 1.15, w8bind2: 1.4, w8close: 1.6 });
  const KINDS = new Set(['w8bindring', 'w8bleatring', 'w8hands', 'w8walls', 'w8bale', 'w8mill', 'w8scroll', 'w8word', 'w8lanes']);
  const arenaL = () => (lockX ?? camX), arenaR = () => (lockX ?? camX) + VW;
  const ENG = W8.eng = { arm: 0, rise: 0, x: 0, y: 0 };
  const LANES = () => [0, 1, 2, 3].map(i => FLOOR_TOP + 16 + i * 28);
  const CURSE = ['BY THE BLOOD OF MY EYES', 'LET AMBER KNOW NO PEACE', 'LET THE DARK COME IN', 'A ROAD FOR EVERY HORROR', 'AND LET IT TAKE ROOT', 'I SAID IT · I MEANT IT'];

  // ---------------- the changes ----------------
  function startMorph(e, f) {
    e.w8from = formOf(e); e.w8form = f; e.phase = Math.min(3, f); e.state = 'w8morph'; e.w8mt = 0; e.w8mmax = f === 2 ? 2.6 : f === 3 ? 3 : 3.2; e.plan = null; e.w8T = null;
    e.rotA = 0; e.spin = 0; e.air = false; e.vz = 0; e.vx = 0; e.walk = 0; e.enraged = false; e.rageT = 0; e.rageQ = false; e.w8onEngine = 0; e.w8lift = 0; e.flash = 0;
    hazards = hazards.filter(h => !(h.kind === 'w8ctl' && h.e === e) && !KINDS.has(h.kind)); projs = projs.filter(p => p.owner !== 'e');
    e.w8x0 = e.x; e.w8y0 = e.y; e.w8z0 = e.z;
    sfx('roar'); slowmo = Math.max(slowmo, .5); shakeMag = Math.max(shakeMag, 8); ash(e.x, e.y, 30, 24);
    banner(SHAPE[f].name, SHAPE[f].title, 2.6); const bn = document.getElementById('bossname'); if (bn) bn.textContent = SHAPE[f].name;
  }
  function finishMorph(e) {
    const f = e.w8form, S = SHAPE[f];
    e.size = S.size; e.hw = e.def.hw * e.size; e.hh = e.def.hh * e.size; e.dmg = Math.round(e.baseDmg * S.dmg); e.poiseMax = e.def.poise * 1.6; e.poise = e.poiseMax; e.staggers = 0;
    e.state = 'recover'; e.t = .8; e.cd = 1; e.plan = null; e.closeCd = 2.5; e.z = 0;
    phaseDrop(e); flashT = Math.max(flashT, .1); sfx('slam');
    if (f === 2) { e.w8m = 'toEngine'; e.w8vol = 0; e.w8cyc = 0; e.state = 'w8act'; e.w8a = 'tithe'; }
    if (f === 4) { e.w8m = 'curse'; e.state = 'w8act'; e.w8a = 'curse'; e.w8mt2 = 0; e.w8round = 0; }
  }
  function morphStep(e, dt) {
    e.w8mt += dt; const u = e.w8mt / e.w8mmax, f = e.w8form; e.flash = Math.max(0, e.flash - dt); e.sqx += (1 - e.sqx) * Math.min(1, dt * 12); e.sqy += (1 - e.sqy) * Math.min(1, dt * 12);
    e.facing = Math.sign(P.x - e.x) || e.facing;
    if (f === 2) { // the engine pulls itself up out of the ash at the back of the field, and he goes up onto it
      ENG.x = arenaL() + VW * .72; ENG.y = FLOOR_TOP + 14; ENG.rise = sm(u / .6); ENG.arm = 0;
      if (u < .5) { e.x = lerp(e.w8x0, ENG.x, sm(u / .5)); e.y = lerp(e.w8y0, ENG.y + 2, sm(u / .5)); e.walk += dt * 8; }
      else { const k = sm((u - .5) / .4); e.x = ENG.x; e.y = ENG.y + 2; e.w8onEngine = 1; e.w8lift = lerp(0, 36, k) + Math.sin(Math.min(1, k) * Math.PI) * 30; }
      if (u > .1 && !e.w8m1) { e.w8m1 = 1; sfx('crunch'); shakeMag = 8; for (let i = 0; i < 20; i++) dust(ENG.x + rand(-40, 40), ENG.y, 1); }
    } else if (f === 3) { // the engine goes down into the ash; the hole opens wider; his cope burns at the hem; his horns grow
      ENG.rise = Math.max(0, ENG.rise - dt * 1.5); W8.pitOpen = lerp(1, 1.6, sm(u)); e.w8onEngine = 0; e.w8lift = Math.max(0, (e.w8lift || 0) - dt * 80);
      e.x = lerp(e.w8x0, W8.pitX() + 60, sm(u)); e.y = lerp(e.w8y0, FLOOR_TOP + 40, sm(u));
      if (u > .3 && !e.w8m1) { e.w8m1 = 1; sfx('roar'); shakeMag = 12; flashT = .1; }
    } else { // he goes down on his knees with a book in his hands
      e.x = lerp(e.w8x0, arenaL() + VW / 2, sm(u * 1.5)); e.y = lerp(e.w8y0, FLOOR_TOP + 30, sm(u * 1.5)); W8.pitOpen = lerp(1.6, 1.2, sm(u));
      if (u > .4 && !e.w8m1) { e.w8m1 = 1; sfx('slam'); shakeMag = 8; }
      if (u > .7 && !e.w8m2) { e.w8m2 = 1; big('"YOU SAID IT, PRINCE. I ONLY LISTENED."', e.x, e.y, 200, '#E8DCC4', 13); }
    }
    if (u >= 1) { e.w8m1 = e.w8m2 = 0; finishMorph(e); }
  }
  const big = (s, x, y, z, col, size) => floatText(x, y, z, s, col, size);
  W8.morph = (f) => { if (boss && isGoat(boss)) { boss.hp = Math.min(boss.hp, ENDS[f] * boss.maxHp + 1); startMorph(boss, f); } };

  // he can't be hurt while he changes, nor up on his engine; no blow carries him past the end of a shape
  const _hurt = hurtEnemy;
  hurtEnemy = function (e, dmg, dir, m, crit) {
    if (isGoat(e) && !e.dead) {
      const f = formOf(e);
      if (e.state === 'w8morph') return;
      if (f === 2 && e.w8onEngine) { if (!(e.w8msg > performance.now())) { e.w8msg = performance.now() + 900; floatText(e.x, e.y, e.hh + 50, 'OUT OF REACH · WAIT FOR HIM AT THE WINDLASS', '#E8D8B0', 12); } return; }
      if (f === 2) { dmg = Math.round(dmg * (e.w8m === 'crank' || e.w8m === 'bleatC' ? 1.6 : 1)); m = Object.assign({}, m, { noStun: 1 }); }
      if (f === 4) { dmg = Math.round(dmg * (e.w8m === 'spent' ? 1.6 : .5)); m = Object.assign({}, m, { noStun: 1 }); }
      if (f < 4) { const floor = ENDS[f + 1] * e.maxHp - 1; dmg = Math.max(1, Math.min(dmg, Math.ceil(e.hp - floor)));
        const r = _hurt(e, dmg, dir, m, crit); if (!e.dead && e.hp <= floor + 1) startMorph(e, f + 1); return r; }
    }
    return _hurt(e, dmg, dir, m, crit);
  };
  { const _st = strike; strike = function (e, ...a) { if (isGoat(e) && (e.state === 'w8morph' || (formOf(e) === 2 && e.w8onEngine))) { if (formOf(e) === 2) hurtEnemy(e, 0, 0, {}, false); return; } return _st(e, ...a); }; }

  // ---------------- each frame ----------------
  const _upd = updateEnemy;
  updateEnemy = function (e, dt) {
    if (!isGoat(e)) return _upd(e, dt);
    if (!e.w8form) { e.w8form = 1; ENG.rise = 0; W8.pitOpen = 1; }
    if (e.dead) { deathStep(e, dt); return; }
    if (stillT > 0) return _upd(e, dt);
    if (e.state === 'w8morph') { morphStep(e, dt); return; }
    const f = formOf(e), want = e.hp <= ENDS[4] * e.maxHp ? 4 : e.hp <= ENDS[3] * e.maxHp ? 3 : e.hp <= ENDS[2] * e.maxHp ? 2 : 1;
    if (want > f && e.state !== 'enter' && e.state !== 'w8act') { startMorph(e, f + 1); return; }
    if (f === 2) { titheStep(e, dt); return; }
    if (f === 4) { curseStep(e, dt); return; }
    _upd(e, dt);
    if (e.state === 'recover' && e.w8was !== 'recover') e.cd = Math.max(e.cd, f === 3 ? .5 : .7); // after each attack, a breath: your opening
    e.w8was = e.state;
  };
  const decay = (e, dt) => { e.flash = Math.max(0, e.flash - dt); e.jit = Math.max(0, (e.jit || 0) - dt); e.flinch = Math.max(0, (e.flinch || 0) - dt); e.sqx += (1 - e.sqx) * Math.min(1, dt * 12); e.sqy += (1 - e.sqy) * Math.min(1, dt * 12); e.vx = 0; e.air = false; e.vz = 0; };

  // ================= FIRST SHAPE: THE GOAT-LORD =================
  // THE CROOK: the crozier swept low along his lane; it hooks you and hauls you in to him
  TELL_FX.w8crook = (e, t, k) => { lane(e.x + e.facing * 10, e.x + e.facing * 170, e.y, 26, k); label(e.x + e.facing * 120, e.y - 30, 'THE CROOK', .5 + .5 * k); };
  PLAN_FX.w8crook = (e) => { sfx('whoosh');
    act(e, 'crook', (h, dt, e) => { const k = h.el / .75; e.w8k = k;
      if (!h.hit && k > .25 && k < .52) { const f = fwdOf(e); if (f > -10 && f < 170 && Math.abs(P.y - e.y) < 26 && P.z < 45) { h.hit = 1; if (hitP(edmg(e), e.x, true, { kind: 'melee', e })) { h.haul = 1; floatText(P.x, P.y, 90, 'HOOKED', '#E8C8A0', 15); } } }
      if (h.haul && k < .9 && P.state !== 'dead') { P.x += (e.x + e.facing * 64 - P.x) * Math.min(1, dt * 7); P.y += (e.y - P.y) * Math.min(1, dt * 5); }
      if (k >= 1) { recover(e, .7); return true; } return false; }); };
  // THE BINDING: a ring of the Circle drawn round where you stand; it closes, and binds whatever is inside it (step out)
  W8.AIM8.w8bind = (e, k) => { const T0 = (e.w8T && e.w8T.plan === 'w8bind') ? e.w8T : (e.w8T = { plan: 'w8bind', rings: [[P.x, P.y]] }); if (k < .5) T0.rings[0] = [xClamp(P.x), yClamp(P.y)]; };
  W8.AIM8.w8bind2 = (e, k) => { const T0 = (e.w8T && e.w8T.plan === 'w8bind2') ? e.w8T : (e.w8T = { plan: 'w8bind2', rings: [[P.x, P.y], [P.x, P.y]] }); if (k < .45) { const x = xClamp(P.x), y = yClamp(P.y), dir = x < (arenaL() + arenaR()) / 2 ? 1 : -1; T0.rings = [[x, y], [xClamp(x + dir * 120), yClamp(y + (y < 292 ? 30 : -30))]]; } };
  const bindR = (k) => lerp(130, 58, sm(k));
  const drawBind = (x, y, r, k, t) => { ring(x, y, r, k); ctx.save(); ctx.translate(x, y); ctx.scale(1, 1 / 2.2); ctx.fillStyle = `rgba(30,22,18,${.5 + .4 * k})`; ctx.font = '700 9px Georgia, serif'; ctx.textAlign = 'center';
    const n = 14; for (let i = 0; i < n; i++) { const a = i / n * TAU + t * .6; ctx.save(); ctx.rotate(a); ctx.fillText('ᚱᛟᚦᚷᛉᛞᛗᚹᛋᚾᛁᛃᛈᛇ'[i % 14], 0, -r + 4); ctx.restore(); } ctx.restore(); };
  for (const pl of ['w8bind', 'w8bind2']) TELL_FX[pl] = (e, t, k) => { const T0 = e.w8T; if (!T0 || !T0.rings) return; for (const [x, y] of T0.rings) drawBind(x, y, bindR(k * .55), k, t); };
  const doBind = (e) => { const T0 = e.w8T && e.w8T.rings ? e.w8T : { rings: [[P.x, P.y]] }; e.w8T = null; sfx('charge', 2);
    hazards.push({ kind: 'w8bindring', rings: T0.rings, el: 0, at: .4, t: 1, max: 1, dmg: Math.round(edmg(e) * 1.25) }); recover(e, .9); };
  PLAN_FX.w8bind = doBind; PLAN_FX.w8bind2 = doBind;
  reg('w8bindring', {
    update(h, dt) { h.el += dt; if (h.el >= h.at && !h.snap) { h.snap = 1; sfx('slam'); tn(70, .6, 'sawtooth', .07, 40); shakeMag = Math.max(shakeMag, 6);
      for (const [x, y] of h.rings) { fx.push({ kind: 'ring', x, y, z: 2, t: .3, max: .3, r: 60, col: '#2A2420', flat: 1 }); if (inEll(P.x, P.y, x, y, 58) && P.z < 30) { if (hitP(h.dmg, x, true)) { W8.chill(1.4, 'BOUND'); } } } } },
    draw(h, t) { const k = Math.min(1, h.el / h.at); for (const [x, y] of h.rings) { if (!h.snap) drawBind(x, y, lerp(bindR(.55), 58, sm(k)), 1, t); else { ctx.save(); ctx.globalAlpha = Math.max(0, 1 - (h.el - h.at) / .5); ctx.strokeStyle = '#140E0A'; ctx.lineWidth = 4; ell(x, y, 58, 58 / 2.2); ctx.stroke(); ctx.restore(); } } },
  });
  // THE BUTT: he lowers his horns and charges down his lane; if he hits the edge of the field his horns stick in it
  W8.AIM8.w8butt = (e, k) => { const T0 = (e.w8T && e.w8T.plan === 'w8butt') ? e.w8T : (e.w8T = { plan: 'w8butt', y: e.y }); if (k < .5) { e.y += clamp(P.y - e.y, -60 / 60, 60 / 60); } T0.y = e.y; e.facing = Math.sign(P.x - e.x) || e.facing; };
  TELL_FX.w8butt = (e, t, k) => { lane(e.x, e.facing > 0 ? arenaR() : arenaL(), e.y, 22, k); };
  PLAN_FX.w8butt = (e) => charge(e, 430, 1, 'butt');
  W8.AIM8.w8gore = W8.AIM8.w8butt; TELL_FX.w8gore = TELL_FX.w8butt;
  PLAN_FX.w8gore = (e) => charge(e, 500, 2, 'gore');
  function charge(e, sp, passes, name) { e.w8T = null; sfx('roar'); let dir = e.facing, pass = 1, wait = 0;
    act(e, name, (h, dt, e) => { e.w8k = h.el; e.walk += dt * 14;
      if (wait > 0) { wait -= dt; if (wait <= 0) { h.hit = 0; } else { if (wait > .6) e.y += clamp(P.y - e.y, -60 * dt, 60 * dt); return false; } }
      e.x += dir * sp * dt; e.facing = dir; if (Math.random() < .7) dust(e.x - dir * 20, e.y, 1);
      if (!h.hit && Math.abs(P.x - e.x) < e.hw + 14 && Math.abs(P.y - e.y) < 22 && P.z < 30) { h.hit = 1; hitP(Math.round(edmg(e) * 1.3), e.x, true, { kind: 'melee', e }); }
      if ((dir > 0 && e.x > arenaR() - 30) || (dir < 0 && e.x < arenaL() + 30)) { e.x = clamp(e.x, arenaL() + 30, arenaR() - 30); shakeMag = 9; sfx('slam');
        if (pass < passes) { pass++; dir = -dir; wait = .9; h.lane = 1; return false; }
        floatText(e.x, e.y, e.hh + 40, 'HIS HORNS ARE STUCK', '#E8D8B0', 14); e.state = 'down'; e.t = 1.5; e.plan = null; return true; }
      if (h.el > 3.5) { recover(e, .6); return true; } return false; },
      { draw(h, t) { if (wait > 0) lane(h.e.x, dir > 0 ? arenaR() : arenaL(), h.e.y, 22, 1 - wait / .9); } }); }
  // THE BLEAT: crowded, he throws his head back and bleats, and the sound goes out round him along the ground (jump it)
  TELL_FX.w8bleat = (e, t, k) => { ring(e.x, e.y, 130, k * .6, false); };
  PLAN_FX.w8bleat = (e) => { sfx('roar'); tn(180, .6, 'sawtooth', .06, 120);
    hazards.push({ kind: 'w8bleatring', x: e.x, y: e.y, r: 10, t: 1, max: 1, dmg: Math.round(edmg(e) * .9) }); act(e, 'bleat', (h, dt, e) => { e.w8k = h.el; if (h.el > .6) { recover(e, .9); return true; } return false; }); };
  reg('w8bleatring', {
    update(h, dt) { h.r += 300 * dt; if (!h.hit) { const d = Math.hypot(P.x - h.x, (P.y - h.y) * 2.2); if (Math.abs(d - h.r) < 14 && P.z < 12) { h.hit = 1; hitP(h.dmg, h.x, true); } } if (h.r > 260) h.t = -1; },
    draw(h, t) { ctx.save(); ctx.strokeStyle = 'rgba(30,24,20,.7)'; ctx.lineWidth = 4; ell(h.x, h.y, h.r, h.r / 2.2); ctx.stroke(); ctx.strokeStyle = 'rgba(232,220,196,.6)'; ctx.lineWidth = 1.4; ell(h.x, h.y, h.r - 3, (h.r - 3) / 2.2); ctx.stroke(); ctx.restore(); },
  });

  // ================= SECOND SHAPE: THE TITHE OF LORRAINE =================
  // up on his engine he throws what the Circle took (burning hay, millstones); after three throws he must come down
  // and wind it, and then he is in reach
  function titheStep(e, dt) {
    decay(e, dt); e.state = 'w8act'; e.w8a = e.w8m === 'crank' ? 'crank' : 'tithe';
    ENG.x = arenaL() + VW * .72; ENG.y = FLOOR_TOP + 14; ENG.rise = Math.min(1, ENG.rise + dt);
    e.w8t = (e.w8t || 0) + dt;
    if (e.w8m === 'toEngine') { const tx = ENG.x, ty = ENG.y + 2; e.facing = Math.sign(P.x - e.x) || e.facing;
      if (Math.abs(e.x - tx) > 6 || Math.abs(e.y - ty) > 4) { e.x += Math.sign(tx - e.x) * Math.min(Math.abs(tx - e.x), 140 * dt); e.y += Math.sign(ty - e.y) * Math.min(Math.abs(ty - e.y), 60 * dt); e.walk += dt * 9; return; }
      e.w8lift = Math.min(36, (e.w8lift || 0) + dt * 120); if (e.w8lift >= 36) { e.w8onEngine = 1; e.w8m = 'volley'; e.w8t = 0; e.w8vol = 0; } return; }
    if (e.w8m === 'volley') { e.facing = Math.sign(P.x - e.x) || e.facing; e.x = ENG.x; e.y = ENG.y + 2; e.w8lift = 36; e.w8onEngine = 1;
      ENG.arm = Math.max(0, ENG.arm - dt * .9);
      if (e.w8t > (e.w8vol ? 2.2 : 1) && !hazards.some(h => h.kind === 'w8lanes' || (h.kind === 'w8bale' && !h.landed) || h.kind === 'w8mill')) { e.w8t = 0;
        if (e.w8vol >= (e.w8cyc >= 3 ? 3 : 2)) { e.w8m = 'down'; return; }
        e.w8vol++; (e.w8vol % 2 ? throwBales : throwMills)(e); }
      return; }
    if (e.w8m === 'down') { e.w8lift = Math.max(0, e.w8lift - dt * 110); if (e.w8lift < 18) e.w8onEngine = 0; const tx = ENG.x - 40; e.x += Math.sign(tx - e.x) * Math.min(Math.abs(tx - e.x), 120 * dt); e.y = ENG.y + 6;
      if (e.w8lift <= 0 && Math.abs(e.x - tx) < 4) { e.w8m = 'crank'; e.w8t = 0; e.w8onEngine = 0; floatText(e.x, e.y, e.hh + 40, 'HE WINDS THE ENGINE · NOW', '#FFE0A0', 15); sfx('crunch');
      } return; }
    if (e.w8m === 'crank') { e.facing = 1; e.w8onEngine = 0; ENG.arm = 0; ENG.wind = (ENG.wind || 0) + dt; if (Math.random() < dt * 4) sfx('hit-metal', .2);
      if (Math.abs(P.x - e.x) < e.hw + 30 && Math.abs(P.y - e.y) < 30 && (e.closeCd || 0) <= 0) { e.closeCd = 3; e.w8m = 'bleatC'; e.w8t = 0; PLAN_FX.w8bleat(e); e.state = 'w8act'; e.w8a = 'crank'; }
      e.closeCd = Math.max(0, (e.closeCd || 0) - dt);
      if (e.w8t > 6) { e.w8m = 'toEngine'; e.w8t = 0; } return; }
    if (e.w8m === 'bleatC') { if (e.w8t > .9) { e.w8m = 'crank'; e.w8t = 1.2; } }
  }
  // burning bales of hay: one at you, the others round about; each is marked where it will land
  function throwBales(e) {
    const n = 4 + Math.min(2, e.w8cyc || 0), spots = [[xClamp(P.x), yClamp(P.y)]];
    for (let i = 1; i < n; i++) { let x, y, ok = false; for (let j = 0; j < 12 && !ok; j++) { x = rand(arenaL() + 40, arenaR() - 40); y = rand(FLOOR_TOP + 14, FLOOR_BOT - 6); ok = spots.every(([a, b]) => Math.hypot(a - x, (b - y) * 2.2) > 80); } spots.push([x, y]); }
    spots.forEach(([x, y], i) => hazards.push({ kind: 'w8bale', x, y, x0: ENG.x + 30, y0: ENG.y, el: -i * .18, wait: 1.1, fl: .8, t: 6, max: 6, dmg: Math.round(edmg(e) * 1.05) }));
    sfx('charge'); floatText(ENG.x, ENG.y, 140, 'THE TITHE OF HAY', '#F2D890', 12);
  }
  reg('w8bale', {
    update(h, dt) { h.el += dt; const u = (h.el - h.wait) / h.fl;
      if (u >= 0 && !h.thrown) { h.thrown = 1; ENG.arm = 1; sfx('whoosh'); }
      if (u >= 1 && !h.landed) { h.landed = 1; h.burn = 0; sfx('slam', .6); shakeMag = Math.max(shakeMag, 4); burst(h.x, h.y, 4, ['#E8B040', '#FF8A3A', '#4A2A10'], 14, 'rock', 0, true); if (inEll(P.x, P.y, h.x, h.y, 34) && P.z < 30) hitP(h.dmg, h.x, true); }
      if (h.landed) { h.burn += dt; if (!h.hitB && h.burn > .2 && h.burn < 1.8 && inEll(P.x, P.y, h.x, h.y, 22) && P.z < 8) { h.hitB = 1; hitP(Math.round(h.dmg * .4), h.x, false); } if (h.burn > 2) h.t = -1; } },
    draw(h, t) { if (!h.landed) { const k = cl01(h.el / (h.wait + h.fl)); ring(h.x, h.y, 34, k); } else { const a = 1 - cl01((h.burn - 1.5) / .5); ctx.save(); ctx.fillStyle = `rgba(40,24,10,${.5 * a})`; ell(h.x, h.y, 26, 10); ctx.fill(); for (let i = 0; i < 6; i++) { const fl = Math.sin(t * 10 + i * 2); ctx.fillStyle = `rgba(${i % 2 ? '255,200,90' : '240,110,40'},${.8 * a})`; ctx.beginPath(); const x = h.x - 12 + i * 5; ctx.moveTo(x - 3, h.y); ctx.quadraticCurveTo(x + fl, h.y - 10, x + fl * 2, h.y - 16 - (i % 3) * 3); ctx.quadraticCurveTo(x + 2, h.y - 6, x + 3, h.y); ctx.fill(); } ctx.restore(); } },
    ups(h, list, t) { if (h.landed || h.el < h.wait) return; const u = cl01((h.el - h.wait) / h.fl), x = lerp(h.x0, h.x, u), y = lerp(h.y0, h.y, u), z = lerp(110, 8, u) + Math.sin(u * Math.PI) * 120;
      list.push([y, () => { shadow(x, y, 10); ctx.save(); ctx.translate(x, y - z); ctx.rotate(t * 5); W8.kit.cel(W8.kit.PB([-10, -6, 10, -7, 11, 6, -10, 7]), '#C89A3A', { d: 1.4, r: .6, w: 1.3 }); ctx.strokeStyle = C('#6A4A1A'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-4, -7); ctx.lineTo(-4, 7); ctx.moveTo(4, -7); ctx.lineTo(4, 7); ctx.stroke(); ctx.restore();
        onMain(() => { for (let i = 0; i < 4; i++) { ctx.fillStyle = `rgba(255,${140 + i * 25},60,.7)`; circle(x - Math.cos(u) * i * 5, y - z - 6 - i * 3, 3 - i * .5); ctx.fill(); } }); }]); },
    box(h, box) { box((h.x0 + h.x) / 2, h.y, 0, Math.abs(h.x - h.x0) / 2 + 40, 260); },
  });
  // millstones, rolled off the engine down one lane (later, two): change your lane; they are too tall to jump
  function throwMills(e) {
    const ls = LANES(), py = clamp(P.y, ls[0], ls[3]), near = ls.reduce((b, y, i) => Math.abs(y - py) < Math.abs(ls[b] - py) ? i : b, 0), two = (e.w8cyc || 0) >= 1;
    const pickL = [near]; if (two) pickL.push(near >= 2 ? near - 2 : near + 2);
    hazards.push({ kind: 'w8lanes', ys: pickL.map(i => ls[i]), el: 0, wait: 1.25, t: 6, max: 6, dmg: Math.round(edmg(e) * 1.2), from: ENG.x });
    sfx('charge', 2); floatText(ENG.x, ENG.y, 140, 'THE MILLSTONES', '#E8D8B0', 12); e.w8cyc = (e.w8cyc || 0) + 1;
  }
  reg('w8lanes', {
    update(h, dt) { h.el += dt; if (h.el >= h.wait && !h.go) { h.go = 1; ENG.arm = 1; sfx('slam'); h.t = -1; for (const y of h.ys) hazards.push({ kind: 'w8mill', x: h.from, y, vx: -300, rot: 0, t: 6, max: 6, dmg: h.dmg }); } },
    draw(h, t) { const k = cl01(h.el / h.wait); for (const y of h.ys) { lane(arenaL(), h.from + 20, y, 18, k); label(arenaL() + 70, y + 3, '◀ MILLSTONE', .7 * k); } },
  });
  reg('w8mill', {
    update(h, dt) { h.x += h.vx * dt; h.rot += h.vx * dt / 22; if (Math.random() < .6) dust(h.x + 16, h.y, 1); shakeMag = Math.max(shakeMag, 1.5);
      if (!h.hit && Math.abs(P.x - h.x) < 22 && Math.abs(P.y - h.y) < 18 && P.z < 46) { h.hit = 1; hitP(h.dmg, h.x + 20, true); }
      if (h.x < arenaL() - 40) { h.t = -1; burst(arenaL() + 4, h.y, 20, ['#8E887E', '#C8C2B4'], 14, 'rock', 1, true); sfx('crunch'); } },
    ups(h, list, t) { list.push([h.y, () => { shadow(h.x, h.y, 22); ctx.save(); ctx.translate(h.x, h.y - 24); ctx.scale(.42, 1); ctx.rotate(h.rot); W8.kit.cel(W8.kit.PE(0, 0, 24, 24), '#8A8478', { d: 2, r: 1, w: 2.4, lite: '#C8C2B4' }); ctx.fillStyle = C('#2A2420'); circle(0, 0, 5); ctx.fill(); ctx.strokeStyle = C('rgba(30,26,22,.6)'); ctx.lineWidth = 1.4; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ctx.moveTo(Math.cos(a) * 7, Math.sin(a) * 7); ctx.lineTo(Math.cos(a + .3) * 22, Math.sin(a + .3) * 22); } ctx.stroke(); ctx.restore(); }]); },
    box(h, box) { box(h.x, h.y, 0, 40, 60); },
  });

  // ================= THIRD SHAPE: THE HORNED GATE =================
  // THE HANDS: grey hands come up out of the ground one after another along a line that hunts you; each spot shows a
  // moment before it breaks (move across the line, not along it)
  TELL_FX.w8hands = (e, t, k) => { ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(P.x, P.y); ctx.stroke(); ctx.setLineDash([]); };
  PLAN_FX.w8hands = (e) => { sfx('charge', 2); const n = 11;
    hazards.push({ kind: 'w8hands', x: e.x + e.facing * 30, y: e.y, hx: e.x + e.facing * 30, hy: e.y, el: 0, step: .15, spots: [], n, t: 8, max: 8, dmg: Math.round(edmg(e) * 1.05), ang: Math.atan2((P.y - e.y) * 2.2, P.x - e.x) });
    recover(e, 1.4); };
  reg('w8hands', {
    update(h, dt) { h.el += dt;
      while (h.spots.length < h.n && h.el >= h.spots.length * h.step) { const want = Math.atan2((P.y - h.hy) * 2.2, P.x - h.hx); let da = ((want - h.ang + Math.PI * 3) % TAU) - Math.PI; h.ang += clamp(da, -.5, .5);
        h.hx += Math.cos(h.ang) * 32; h.hy = clamp(h.hy + Math.sin(h.ang) * 32 / 2.2, FLOOR_TOP + 10, FLOOR_BOT - 2); h.hx = clamp(h.hx, arenaL() + 10, arenaR() - 10); h.spots.push({ x: h.hx, y: h.hy, at: h.el + .5 }); }
      for (const s of h.spots) if (!s.up && h.el >= s.at) { s.up = 1; s.t = 0; sfx('crunch', .5); ash(s.x, s.y, 2, 4); if (!h.hit && inEll(P.x, P.y, s.x, s.y, 26) && P.z < 30) { h.hit = 1; hitP(h.dmg, s.x, true); } }
      for (const s of h.spots) if (s.up) s.t += dt;
      if (h.spots.length >= h.n && h.spots.every(s => s.up && s.t > 1)) h.t = -1; },
    draw(h, t) { for (const s of h.spots) if (!s.up) ring(s.x, s.y, 26, cl01(1 - (s.at - h.el) / .5)); },
    ups(h, list, t) { for (const s of h.spots) if (s.up && s.t < 1) list.push([s.y, () => { const u = sm(s.t / .15) * (1 - sm((s.t - .7) / .3)); ctx.save(); ctx.translate(s.x, s.y); ctx.scale(1, u);
      for (const [dx, a] of [[-5, -.25], [5, .2]]) { ctx.save(); ctx.translate(dx, 0); ctx.rotate(a); W8.kit.cel(W8.kit.PB([-4, 0, -5, -22, -2, -32, 2, -34, 5, -24, 4, 0]), '#8E887E', { d: 1, r: .5, w: 1.3, lite: '#C8C2B4' });
        ctx.strokeStyle = C(OUT); ctx.lineWidth = 2.4; ctx.beginPath(); for (let f = -2; f <= 2; f++) { ctx.moveTo(f * 1.4, -32); ctx.lineTo(f * 2.6, -40 - Math.abs(f) * -1.5); } ctx.stroke(); ctx.strokeStyle = C('#A8A094'); ctx.lineWidth = 1.1; ctx.stroke(); ctx.restore(); }
      ctx.restore(); }]); },
    box(h, box) { for (const s of h.spots) box(s.x, s.y, 0, 30, 60); },
  });
  // THE CIRCLE CLOSES: the dark comes in from both edges of the field and holds you in a narrow ring of ground for a
  // while (stand in the gap: the dark drinks), then lets go
  TELL_FX.w8close = (e, t, k) => { const c = W8.closeC(e), g = 105; for (const x of [c - g, c + g]) { ctx.strokeStyle = tellLine(k); ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(x, FLOOR_TOP); ctx.lineTo(x, FLOOR_BOT); ctx.stroke(); ctx.setLineDash([]); } ctx.fillStyle = tellCol(k * .7); ctx.fillRect(arenaL(), FLOOR_TOP, c - g - arenaL(), FLOOR_BOT - FLOOR_TOP); ctx.fillRect(c + g, FLOOR_TOP, arenaR() - c - g, FLOOR_BOT - FLOOR_TOP); label(c, FLOOR_TOP + 12, 'STAND IN THE GAP', .8 * k); };
  W8.closeC = (e) => { const T0 = (e.w8T && e.w8T.plan === 'w8close') ? e.w8T : (e.w8T = { plan: 'w8close', c: clamp(P.x, arenaL() + 150, arenaR() - 150) }); return T0.c; };
  PLAN_FX.w8close = (e) => { const c = W8.closeC(e); e.w8T = null; sfx('roar'); tn(48, 2.4, 'sawtooth', .07, 40);
    hazards.push({ kind: 'w8walls', c, g: 105, el: 0, t: 6, max: 6, dmg: Math.round(edmg(e) * .55), tick: 0 }); recover(e, 1.2); };
  const wallsK = (h) => h.el < .8 ? sm(h.el / .8) : h.el < 3.4 ? 1 : 1 - sm((h.el - 3.4) / .9);
  reg('w8walls', {
    update(h, dt) { h.el += dt; const k = wallsK(h), L = lerp(arenaL() - 20, h.c - h.g, k), R = lerp(arenaR() + 20, h.c + h.g, k);
      h.L = L; h.R = R; h.tick -= dt;
      if (alive() && (P.x < L || P.x > R) && h.tick <= 0) { h.tick = .55; hitP(h.dmg, P.x < L ? L - 40 : R + 40, false); if (P.x < L) P.x += 12; else P.x -= 12; }
      if (h.el > 4.3) h.t = -1; },
  });
  W8.walls = (t) => { const h = hazards.find(h => h.kind === 'w8walls'); if (!h || h.L === undefined) return;
    for (const [x, side] of [[h.L - camX, -1], [h.R - camX, 1]]) {
      const xa = (y) => x + Math.sin(y * .08 + t * 3) * 6 + Math.sin(y * .23) * 4; ctx.save();
      ctx.beginPath(); ctx.moveTo(xa(Y_OFF), Y_OFF); for (let y = Y_OFF; y <= VH; y += 6) ctx.lineTo(xa(y), y); ctx.lineTo(side > 0 ? VW + 30 : -30, VH); ctx.lineTo(side > 0 ? VW + 30 : -30, Y_OFF); ctx.closePath();
      ctx.fillStyle = 'rgba(12,9,7,.86)'; ctx.fill();
      ctx.strokeStyle = 'rgba(10,8,6,.9)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let y = FLOOR_TOP - 20; y <= VH; y += 8) { const bx = xa(y), L = 8 + hsh(y + side) * 14; ctx.moveTo(bx, y); ctx.lineTo(bx - side * L, y - L * .6); ctx.moveTo(bx - side * L * .5, y - L * .3); ctx.lineTo(bx - side * L * .4, y - L * .9); } ctx.stroke(); // thorns at its edge
      ctx.restore(); } };

  // ================= FOURTH SHAPE: YOUR CURSE =================
  // on his knees, he reads Corwin his own curse out of a black book; each line unrolls as a scroll of black letters
  // across two of the four lanes of the field (stand in a clear lane); then words drop like stones; then he is spent,
  // and that is when he can be hurt in earnest
  function curseStep(e, dt) {
    decay(e, dt); e.state = 'w8act'; e.facing = Math.sign(P.x - e.x) || e.facing; e.w8t = (e.w8t || 0) + dt;
    const busy = hazards.some(h => h.kind === 'w8scroll' || h.kind === 'w8word');
    if (e.w8m === 'curse') { e.w8a = 'curse';
      if (!e.w8begun) { e.w8begun = 1; e.w8t = 0; const r = e.w8round = (e.w8round || 0) + 1, line = CURSE[(r - 1) % CURSE.length]; scrolls(e, line, r); }
      else if (e.w8t > 1 && !busy) { e.w8m = 'word'; e.w8begun = 0; e.w8t = 0; } return; }
    if (e.w8m === 'word') { e.w8a = 'word';
      if (!e.w8begun) { e.w8begun = 1; e.w8t = 0; words(e); }
      else if (e.w8t > .6 && !busy) { e.w8m = 'spent'; e.w8begun = 0; e.w8t = 0; floatText(e.x, e.y, e.hh + 50, 'HE IS SPENT · NOW', '#FFE0A0', 15); } return; }
    if (e.w8m === 'spent') { e.w8a = 'spent';
      if (Math.abs(P.x - e.x) < e.hw + 40 && Math.abs(P.y - e.y) < 30 && e.w8t > 1.6 && !(e.w8bl > 0)) { e.w8bl = 1; PLAN_FX.w8bleat(e); e.state = 'w8act'; e.w8a = 'spent'; }
      if (e.w8t > 3.4) { e.w8m = 'curse'; e.w8t = 0; e.w8bl = 0; } }
  }
  function scrolls(e, line, r) {
    const ls = LANES(), safe = new Set(), n1 = Math.floor(Math.random() * 4); safe.add(n1); safe.add((n1 + 1 + Math.floor(Math.random() * 3)) % 4);
    const waves = r >= 3 ? 2 : 1, plan = [];
    for (let w = 0; w < waves; w++) { const hit = [0, 1, 2, 3].filter(i => w === 0 ? !safe.has(i) : safe.has(i)); plan.push({ at: w * 4.2, lanes: hit, dir: (r + w) % 2 ? 1 : -1 }); }
    hazards.push({ kind: 'w8scroll', line, plan, el: 0, t: 12, max: 12, ls, dmg: Math.round(edmg(e) * 1.1), rolls: [] });
    floatText(e.x, e.y, e.hh + 70, '"' + line + '"', '#E8DCC4', 14); sfx('growl');
  }
  reg('w8scroll', {
    update(h, dt) { h.el += dt;
      for (const p of h.plan) { if (!p.go && h.el >= p.at + 1.5) { p.go = 1; sfx('whoosh'); for (const i of p.lanes) h.rolls.push({ y: h.ls[i], x: p.dir > 0 ? arenaL() - 240 : arenaR() + 240, dir: p.dir, hit: false }); } }
      for (const s of h.rolls) { s.x += s.dir * 380 * dt; const x0 = s.x - (s.dir > 0 ? 230 : 0), x1 = s.x + (s.dir > 0 ? 0 : 230); if (!s.hit && P.x > x0 && P.x < x1 && Math.abs(P.y - s.y) < 13 && P.z < 70) { s.hit = 1; hitP(h.dmg, s.x, true); } }
      if (h.plan.every(p => p.go) && h.rolls.every(s => (s.dir > 0 ? s.x - 230 > arenaR() + 20 : s.x + 230 < arenaL() - 20))) h.t = -1; },
    draw(h, t) { for (const p of h.plan) if (!p.go && h.el > p.at - .2) { const k = cl01((h.el - p.at) / 1.5); for (const i of p.lanes) { lane(arenaL(), arenaR(), h.ls[i], 13, k); label(p.dir > 0 ? arenaL() + 80 : arenaR() - 80, h.ls[i] + 3, p.dir > 0 ? '▶' : '◀', .9 * k); } } },
    ups(h, list, t) { for (const s of h.rolls) list.push([s.y + .5, () => onMain(() => { const x0 = s.dir > 0 ? s.x - 230 : s.x, w = 230, y = s.y - 34; ctx.save();
      const g = ctx.createLinearGradient(0, y, 0, y + 22); g.addColorStop(0, '#F0E6CC'); g.addColorStop(.5, '#E2D4B0'); g.addColorStop(1, '#BCA884'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, y); for (let x = 0; x <= w; x += 10) ctx.lineTo(x0 + x, y + Math.sin(x * .05 + t * 6) * 2.4); for (let x = w; x >= 0; x -= 10) ctx.lineTo(x0 + x, y + 22 + Math.sin(x * .05 + t * 6) * 2.4); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#3A2A1A'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#1A1210'; ctx.font = '700 13px "UnifrakturMaguntia", Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText(h.line.toLowerCase(), x0 + w / 2, y + 15);
      for (const ex of [x0, x0 + w]) { ctx.fillStyle = '#C8B48A'; ell(ex, y + 11, 4, 13); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = 'rgba(20,12,8,.25)'; ell(x0 + w / 2, s.y, w / 2, 4); ctx.fill(); ctx.restore(); })]); },
    box(h, box) { for (const s of h.rolls) box(s.x - s.dir * 115, s.y, 0, 140, 60); },
  });
  function words(e) { const n = 4 + Math.min(3, e.w8round || 1), spots = [[xClamp(P.x), yClamp(P.y)]];
    for (let i = 1; i < n; i++) { let x, y, ok = false; for (let j = 0; j < 14 && !ok; j++) { x = rand(arenaL() + 40, arenaR() - 40); y = rand(FLOOR_TOP + 14, FLOOR_BOT - 6); ok = spots.every(([a, b]) => Math.hypot(a - x, (b - y) * 2.2) > 76); } spots.push([x, y]); }
    const ws = ['CURSE', 'DARK', 'BLOOD', 'EYES', 'ROAD', 'AMBER', 'ERIC', 'PEACE'];
    spots.forEach(([x, y], i) => hazards.push({ kind: 'w8word', x, y, w: ws[(i + (e.w8round || 0)) % ws.length], el: -i * .22, at: 1, t: 4, max: 4, dmg: Math.round(edmg(e) * .9) }));
    sfx('charge', 2);
  }
  reg('w8word', {
    update(h, dt) { h.el += dt; if (h.el >= h.at && !h.down) { h.down = 1; sfx('slam', .6); shakeMag = Math.max(shakeMag, 4); ash(h.x, h.y, 2, 8); if (inEll(P.x, P.y, h.x, h.y, 30) && P.z < 30) hitP(h.dmg, h.x, true); } if (h.el > h.at + 1) h.t = -1; },
    draw(h, t) { if (h.el > 0 && !h.down) ring(h.x, h.y, 30, cl01(h.el / h.at)); },
    ups(h, list, t) { if (h.el < 0) return; list.push([h.y, () => onMain(() => { const z = h.down ? 0 : (1 - cl01(h.el / h.at)) * 200, a = h.down ? 1 - cl01((h.el - h.at - .5) / .5) : 1; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#16100C'; ctx.font = '700 16px "UnifrakturMaguntia", Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText(h.w.toLowerCase(), h.x, h.y - 6 - z); ctx.restore(); })]); },
  });

  // ---------------- his fall: the horn drops; the colour comes back in from where he fell (the ending, w8_late.js) ----------------
  const _kill = killEnemy;
  killEnemy = function (e, dir, m) { _kill(e, dir, m); if (isGoat(e)) { e.death = 'w8fall'; e.air = false; e.vx = 0; e.vz = 0; e.spin = 0; e.rotA = 0; e.t = e.dmax = 3.4; clearT = Math.max(clearT, 5.2);
    hazards = hazards.filter(h => !KINDS.has(h.kind) && !(h.kind === 'w8ctl' && h.e === e)); projs = projs.filter(p => p.owner !== 'e');
    for (const o of enemies) if (!o.dead && !o.boss) { o.hp = 1; strike(o, 999, Math.sign(o.x - e.x) || 1, { dmg: 999, kb: 300, launch: 200, power: 2, trump: 1 }); } // the Circle's things go with him
    save.w8relic = true; if (typeof persist === 'function') persist(); } };
  function deathStep(e, dt) { // (the drawing does the dying: drawDeath 'w8fall' in w8_late.js)
    e.w8die = (e.w8die || 0) + dt; e.flash = 0; e.z = 0; e.vz = 0; e.vx = 0;
    if (e.w8die > 1.3 && !e.d1) { e.d1 = 1; sfx('crunch'); shakeMag = 10; ash(e.x, e.y, 40, 40); }
    if (e.w8die > 2.4 && !e.d2) { e.d2 = 1; sfx('trump'); flashT = .15; banner('The Horn of Lorraine', 'GANELON\'S WAR-HORN, TAKEN BACK · IT IS YOURS NOW', 3); W8.hornDrop = { x: e.x, y: e.y }; }
    if (e.state === 'dying') { e.t -= dt; if (e.t <= 0) toCorpse(e); }
  }
  W8.isGoat = isGoat; W8.SHAPE = SHAPE;
  MECH_FX.w8heart = {
    start(m) { ENG.rise = 0; ENG.arm = 0; W8.pitOpen = 1; },
    update(m, dt) {},
    boxes(m, box) { if (ENG.rise > 0) box(ENG.x, ENG.y, 0, 90, 130); },
    list(m, list, t) { if (ENG.rise > 0 && boss) list.push([ENG.y - 1, () => { ctx.save(); ctx.translate(ENG.x, ENG.y); ctx.scale(1.25, ENG.rise * 1.25); W8.mangonel(0, 0, ENG.arm, 1, t); ctx.restore(); }]); },
  };
  });

  // ======================================================================================================
  // PASSAGES: 'w8bells' (the Winter Fields -> the Edge: the snow thickens to a white-out, and the flakes turn to chaff
  // and blow away off a field of standing wheat) and 'w8circle' (the Edge -> the Heart: the colour runs out of the
  // picture from its edges in, leaving the grey underpainting, and the underdrawing's lines come up through it)
  // ======================================================================================================
  W8.lateParts.push(() => {
  TRANS_FX.w8bells = (T, p, c, inP, t) => {
    const Y0 = Y_OFF, H = VH - Y0;
    ctx.save();
    ctx.fillStyle = inP ? `rgba(244,242,234,${c * .96})` : `rgba(236,212,150,${c * .9})`; ctx.fillRect(0, Y0, VW, H);
    const n = 160;
    for (let i = 0; i < n; i++) { const r = hsh(i), sp = 60 + r * 140, life = ((t * sp / H) + hsh(i + 1)) % 1, x = (hsh(i + 2) * VW + Math.sin(t * 2 + i) * 30 + t * (inP ? -40 : 90) * (1 + r)) % VW, y = Y0 + life * H;
      const k = inP ? c : 1 - c, gold = !inP || p > .42;
      if (hsh(i + 5) > .35 + k * .65 && i > 20) continue;
      ctx.fillStyle = gold ? `rgba(${200 + r * 50},${150 + r * 60},${60 + r * 40},${.85})` : `rgba(255,255,252,${.9})`;
      if (gold) { ctx.save(); ctx.translate((x + VW) % VW, y); ctx.rotate(t * 3 + i); ctx.fillRect(-3, -.6, 6, 1.2); ctx.restore(); } else { circle((x + VW) % VW, y, 1 + r * 2.4); ctx.fill(); } }
    if (p > .35 && p < .65) { const k = 1 - Math.abs(p - .5) / .15; ctx.fillStyle = `rgba(60,44,20,${k * .5})`; ctx.font = '700 15px Cinzel, Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('a bell is ringing in an empty church', VW / 2, Y0 + H * .45); }
    ctx.restore();
    if (!T.rang && p > .3) { T.rang = 1; if (typeof tone === 'function') { tn(262, 2, 'sine', .1); tn(523, 1.4, 'sine', .04); tn(311, 1.6, 'triangle', .03, 0, .02); } }
  };
  TRANS_FX.w8circle = (T, p, c, inP, t) => {
    const Y0 = Y_OFF, H = VH - Y0;
    ctx.save();
    if (inP) { // the colour drains, from the edges of the picture in
      ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgba(128,128,128,${c})`; ctx.fillRect(0, Y0, VW, H);
      ctx.globalCompositeOperation = 'source-over';
      const g = ctx.createRadialGradient(VW / 2, Y0 + H / 2, H * .2 * (1 - c), VW / 2, Y0 + H / 2, VW * .7); g.addColorStop(0, 'rgba(20,16,12,0)'); g.addColorStop(1, `rgba(20,16,12,${c * .95})`); ctx.fillStyle = g; ctx.fillRect(0, Y0, VW, H);
      ctx.fillStyle = `rgba(150,144,134,${c * c})`; ctx.fillRect(0, Y0, VW, H);
    } else { // the grey panel, and the underdrawing coming up through it before the scene does
      ctx.fillStyle = `rgba(150,144,134,${c})`; ctx.fillRect(0, Y0, VW, H);
      ctx.strokeStyle = `rgba(24,20,16,${.5 * c})`; ctx.lineWidth = .8; ctx.beginPath();
      for (let i = 0; i < 70; i++) { const x = hsh(i) * VW, y = Y0 + hsh(i + 1) * H, L = 20 + hsh(i + 2) * 60, a = hsh(i + 3) * 3; ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a) * L * .5 + 10, y + Math.sin(a) * L * .5, x + Math.cos(a) * L, y + Math.sin(a) * L); }
      ctx.stroke();
    }
    if (p > .3 && p < .7) { const k = 1 - Math.abs(p - .5) / .2; ctx.fillStyle = `rgba(232,226,212,${k})`; ctx.font = '700 15px Cinzel, Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('inside, nobody ever finished the picture', VW / 2, Y0 + H * .45); }
    ctx.restore();
  };
  });

  // ======================================================================================================
  // MUSIC (music.js notation): modal, like the dances in the margins of a Book of Hours
  // ======================================================================================================
  if (typeof TRACKS !== 'undefined') {
    const Wb = (n, steps = 16) => n + ' -'.repeat(steps - 1), Hb = (a, b) => a + ' -'.repeat(7) + ' ' + b + ' -'.repeat(7);
    Object.assign(TRACKS, {
      // the Winter Fields: a slow carol in D dorian over a drone, in 6/8, like a hurdy-gurdy heard across the snow
      lorraine: { bpm: 72, n: 12, style: 'calm', kit: 'soft', duty: .5, vib: 8, echo: .25, echoSteps: 3, arp: '0-----2-----', arpDuty: .5, av: .04, bass: 'R-----R-----', bv: .26, drums: { k: 'x.....x.....', h: '...g.....g..' }, fill: false, form: ['A', 'B', 'A'], parts: {
        A: { chords: ['Dm', 'C', 'Dm', 'Am', 'F', 'C', 'Dm', 'Dm'],
             lead: ['D5 - - E5 - F5 G5 - - F5 - E5', 'E5 - - D5 - C5 D5 - - - - -', 'F5 - - G5 - A5 B5 - - A5 - G5', 'A5 - - - - - E5 - - - - -',
                    'F5 - - E5 - F5 A5 - - G5 - F5', 'E5 - - D5 - C5 E5 - - G5 - -', 'F5 - E5 D5 - C5 A4 - - C5 - E5', 'D5 - - - - - - - - . . .'] },
        B: { chords: ['F', 'C', 'G', 'Dm', 'F', 'G', 'Am', 'Dm'],
             lead: ['A5 - - - G5 F5 C6 - - - A5 -', 'G5 - - E5 - - C5 - - - - -', 'B5 - - A5 - G5 D5 - - G5 - -', 'F5 - - - - - D5 - - A4 - -',
                    'C5 - - F5 - - A5 - - C6 - -', 'B5 - - G5 - - D5 - - B4 - -', 'C5 - - E5 - - A5 - - G5 - E5', 'D5 - - - - - - - - . . .'] } } },
      // the Edge: a harvest saltarello in G mixolydian, quick and stamping, going sour where the Circle is
      lorraine2: { bpm: 152, n: 12, style: 'waltz', duty: .25, vib: 10, echo: .12, arp: '0-2-1-0-2-1-', bass: 'R-----F-----', drums: { k: 'x.....x.....', s: '...x.....x..', h: 'x.xx.xx.xx.x' }, form: ['A', 'A+0', 'B'], parts: {
        A: { chords: ['G', 'F', 'G', 'C', 'G', 'F', 'Am', 'D'],
             lead: ['G5 - A5 B5 - G5 D5 - G5 B5 - A5', 'F5 - G5 A5 - F5 C5 - F5 A5 - G5', 'G5 - A5 B5 - D6 C6 - B5 A5 - G5', 'E5 - - C5 - - E5 - G5 C6 - -',
                    'D6 - C6 B5 - A5 G5 - A5 B5 - G5', 'A5 - G5 F5 - E5 F5 - G5 A5 - F5', 'E5 - D5 C5 - B4 C5 - E5 A5 - -', 'F#5 - - A5 - - D5 - - . . .'] },
        B: { chords: ['Em', 'D', 'C', 'D', 'Em', 'D', 'C', 'G'],
             lead: ['E5 - - G5 - B5 E6 - - D6 - B5', 'D6 - - A5 - F#5 D5 - - F#5 - A5', 'G5 - - E5 - C5 E5 - G5 C6 - -', 'B5 - A5 F#5 - D5 A5 - - - - -',
                    'E5 - - G5 - B5 E6 - D6 B5 - G5', 'F#5 - A5 D6 - - C6 - A5 F#5 - D5', 'E5 - G5 C6 - B5 A5 - G5 E5 - C5', 'G5 - - - - - D5 - - G4 - -'] } } },
      // the Heart, before he comes: bells in the grey, a fifth with nothing in it
      lorraineBoss: { bpm: 56, style: 'ambient', kit: 'soft', duty: .5, lv: .16, vib: 6, echo: .5, echoSteps: 4, chords: ['D5', 'D5', 'Eb5', 'D5'],
        lead: [Wb('A4'), Hb('D5', 'A4'), Hb('Bb4', 'A4'), Wb('D4')] },
      // the Goat-Lord: D phrygian, a black dance; the second part is his engine, grinding; the third his gate; the last a dirge
      boss_w8goat: { duty: .25, vib: 12, echo: .15, kit: 'heavy', form: ['A', 'B', 'A', 'C', 'D'], parts: {
        A: { bpm: 150, style: 'battle', chords: ['Dm', 'Eb', 'Dm', 'C'],
             lead: ['D5 - F5 - A5 - G5 F5 Eb5 - D5 - C5 - D5 -', 'Eb5 - G5 - Bb5 - A5 G5 F5 - Eb5 - D5 - Eb5 -', 'F5 - A5 - D6 - C6 Bb5 A5 - G5 - F5 - A5 -', 'G5 - E5 - C5 - E5 - G5 - - - C6 - - -'] },
        B: { bpm: 150, style: 'industrial', chords: ['Dm', 'Dm', 'Eb', 'Dm'],
             lead: ['D5 . D5 . D5 . F5 . Eb5 - D5 - C5 - D5 -', 'A4 . A4 . C5 . D5 . Eb5 - D5 - C5 - A4 -', 'Bb4 . Bb4 . Eb5 . G5 . F5 - Eb5 - D5 - Eb5 -', 'D5 - - - A4 - - - D4 - - - . . . .'] },
        C: { bpm: 164, style: 'tribal', chords: ['Dm', 'Eb', 'Gm', 'A'],
             lead: ['D6 - - - A5 - - - F5 - D5 - Eb5 - F5 -', 'G5 - - - Eb5 - - - Bb4 - G4 - A4 - Bb4 -', 'D5 - - - G5 - Bb5 - D6 - C6 - Bb5 - A5 -', 'C#6 - - - A5 - - - E5 - - - C#5 - - -'] },
        D: { bpm: 96, n: 12, style: 'grand', chords: ['Dm', 'Gm', 'Eb', 'Dm'], arp: '0-1-2-1-0-1-', bass: 'R-----V-----', drums: { k: 'X.....x.....', s: '......X.....', h: '..x...x...x.' }, fill: false, double: -12,
             lead: ['A5 - - - - - F5 - - D5 - -', 'Bb5 - - - - - G5 - - D5 - -', 'G5 - - - - - Eb5 - - Bb4 - -', 'A4 - - - - - - - - . . .'] } } },
      // the ending: spring comes back into Lorraine; F lydian, a pastoral, played once
      w8spring: { bpm: 84, n: 12, style: 'hymn', duty: .5, vib: 9, echo: .3, echoSteps: 3, once: true, chords: ['F', 'G', 'F', 'C', 'Dm', 'G', 'C', 'F'],
        lead: ['C5 - - F5 - - A5 - - G5 - F5', 'B5 - - - - - G5 - - D5 - -', 'A5 - - C6 - - F5 - - A5 - -', 'G5 - - - - - E5 - - C5 - -',
               'D5 - - F5 - - A5 - - D6 - -', 'B5 - - - - - D6 - - G5 - -', 'C6 - - E6 - - G5 - - C6 - -', 'A5 - - - - - - - - . . .'] },
    });
  }

  // the breakable pods of this world: a reliquary casket on a little bier (snow on it in the fields, ash in the Circle)
  { const _pod = drawPod;
    drawPod = function (p, t) {
      if (!/^lorraine/.test(p.theme)) return _pod(p, t);
      const sp = propSprite('pod-lorraine', 54, 56, 27, 48, (th, s) => {
        ctx.fillStyle = '#3A2A1C'; ctx.fillRect(-14, -6, 3, 6); ctx.fillRect(11, -6, 3, 6); ctx.fillRect(-16, -8, 32, 3); // the bier
        cel(PP([-12, -8, 12, -8, 12, -24, -12, -24]), '#8A5A2E', { d: 1.2, r: .6, w: 1.2, tex: () => { ctx.fillStyle = 'rgba(200,150,60,.8)'; ctx.fillRect(-12, -19, 24, 1.6); ctx.fillRect(-1, -24, 2, 16); } });
        cel(PB([-13, -24, -10, -32, 0, -35, 10, -32, 13, -24]), '#9A6A34', { d: 1, r: .6, w: 1.2 }); // its lid, roofed like a little church
        goldLine(() => { ctx.moveTo(-12, -24); ctx.lineTo(12, -24); ctx.moveTo(0, -35); ctx.lineTo(0, -40); ctx.moveTo(-3, -38); ctx.lineTo(3, -38); }, 1.1);
        ctx.fillStyle = '#C23A1E'; circle(-6, -15, 1.6); ctx.fill(); ctx.fillStyle = '#3A5A86'; circle(6, -15, 1.6); ctx.fill(); // enamels
        ctx.fillStyle = 'rgba(240,238,228,.9)'; ell(0, -33, 9, 2); ctx.fill(); // snow on it
      }, { foot: 8, seed: 71, haze: .05, line: .7 });
      propDraw(sp, p.x, p.y, { sh: 18, flash: FLASH });
    }; }

  // ======================================================================================================
  // THE LATE HOOKS: entrances, landmarks, deaths, the bolts, wrapped round functions from files that load after
  // data_w8.js (entrances.js, thresholds.js, draw.js). w8_late.js runs this once every script has loaded
  // ======================================================================================================
  W8.dom = () => {
  const yC = (y) => clamp(y, FLOOR_TOP + 10, FLOOR_BOT - 2);
  // ---------------- how each of them comes on ----------------
  if (typeof ENTRY !== 'undefined') Object.assign(ENTRY, {
    w8hollow: ['w8rise'], w8halberd: ['w8march'], w8xbow: ['w8march'], w8flag: ['w8march'], w8bell: ['w8belfry'], w8crow: ['w8swoop'], w8egg: ['w8rollin'], w8hangman: ['w8rope'],
  });
  const edgeIn = (e, n, dur) => { n.x1 = entranceSpot(e); n.dir = P.x > n.x1 ? 1 : -1; n.x0 = n.dir > 0 ? camX - 40 : camX + VW + 40; if (Math.abs(n.x1 - n.x0) < 120) n.x1 = n.x0 + n.dir * 160; e.x = n.x0; e.facing = n.dir; n.y = yC(e.y); };
  if (typeof ENTER_FX !== 'undefined') Object.assign(ENTER_FX, {
    // a hollow: a grey hand comes up out of the snow (or the ash), and the rest of it after, as if out of water
    w8rise: { max: 1.5, start(e, n) { if (!n.keep) e.x = entranceSpot(e); sfx('crunch'); },
      update(e, n, dt) { if (Math.random() < .4) dust(e.x + rand(-10, 10), e.y, 1); if (n.t > .3 && !n.s) { n.s = 1; sfx('growl'); } return n.t >= n.max; },
      draw(e, n, t, inner) { const k = sm((n.t - .15) / 1.2); ctx.save(); ctx.fillStyle = 'rgba(40,36,32,.45)'; ell(e.x, e.y, 18, 5); ctx.fill(); ctx.beginPath(); ctx.rect(e.x - 80, e.y - 200, 160, 201); ctx.clip(); ctx.translate(0, (1 - k) * e.hh * 1.05); inner(); ctx.restore(); } },
    // the Circle's soldiers march in from the edge of the field to a drum
    w8march: { max: 1.6, keepFace: 1, start(e, n) { edgeIn(e, n); let k = 0; const drum = () => { if (k++ < 4 && sfxOn && actx) { tn(90, .12, 'sine', .12, 60); setTimeout(drum, 300); } }; drum(); },
      update(e, n, dt) { const k = cl01(n.t / n.max); e.x = lerp(n.x0, n.x1, k); e.walk += dt * 9; return n.t >= n.max; },
      draw(e, n, t, inner) { inner(); } },
    // a bellman is let down out of a belfry that is not there: the bell first, with its legs hanging under it
    w8belfry: { max: 1.4, keepFace: 1, start(e, n) { e.x = entranceSpot(e); n.z0 = e.y - Y_OFF + 40; e.z = n.z0; sfx('whoosh'); },
      update(e, n, dt) { const k = cl01(n.t / .9); e.z = n.z0 * (1 - k * k); if (k >= 1 && !n.l) { n.l = 1; e.z = 0; shakeMag = Math.max(shakeMag, 8); sfx('slam'); tn(147, 1.4, 'sine', .12); tn(294, 1, 'sine', .05); dust(e.x, e.y, 12); } return n.t >= n.max; },
      draw(e, n, t, inner) { if (!n.l) { ctx.strokeStyle = 'rgba(60,44,30,.8)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(e.x, Y_OFF); ctx.lineTo(e.x, e.y - e.z - 60); ctx.stroke(); } inner(); } },
    // a funnel-hat crow comes down out of the sky in a wide spiral, feathers coming off it
    w8swoop: { max: 1.6, start(e, n) { n.x0 = entranceSpot(e); n.z0 = e.y - Y_OFF + 50; e.x = n.x0; e.z = n.z0; sfx('whoosh'); },
      update(e, n, dt) { const k = sm(cl01(n.t / n.max)); e.z = lerp(n.z0, e.def.hover, k); e.x = n.x0 + Math.cos(n.t * 4) * 60 * (1 - k); e.facing = Math.sin(n.t * 4) > 0 ? -1 : 1; if (Math.random() < .2) parts.push({ x: e.x, y: e.y, z: e.z, vx: rand(-30, 30), vy: 0, vz: -20, life: 1.2, max: 1.2, col: '#1E1A16', size: 2.4, shape: 'tuft', rot: rand(0, 6), vr: 3 }); return n.t >= n.max; },
      draw(e, n, t, inner) { inner(); } },
    // a walking egg rolls in, comes to a stop, and stands up on its legs
    w8rollin: { max: 1.5, keepFace: 1, start(e, n) { edgeIn(e, n); sfx('whoosh'); },
      update(e, n, dt) { const k = cl01(n.t / 1); e.x = lerp(n.x0, n.x1, sm(k)); if (Math.random() < .5 && k < 1) dust(e.x, e.y, 1); return n.t >= n.max; },
      draw(e, n, t, inner) { const s = e.state; if (n.t < 1.1) { e.state = 'w8act'; e.w8a = 'roll'; e.w8k = n.t; } try { inner(); } finally { e.state = s; } } },
    // the hangman lets himself down on a rope out of the sky, with the noose over his shoulder
    w8rope: { max: 2, keepFace: 1, start(e, n) { e.x = clamp(P.x + (P.x < camX + VW / 2 ? 220 : -220), camX + 80, camX + VW - 80); n.z0 = e.y - Y_OFF + 100; e.z = n.z0; e.facing = Math.sign(P.x - e.x) || 1; sfx('roar'); banner('The Hangman of the Circle', 'HE KEEPS THE GALLOWS AT THE EDGE', 2.2); },
      update(e, n, dt) { const k = sm(cl01(n.t / 1.6)); e.z = n.z0 * (1 - k); if (k >= 1 && !n.l) { n.l = 1; shakeMag = 9; sfx('slam'); dust(e.x, e.y, 14); } return n.t >= n.max; },
      draw(e, n, t, inner) { ctx.strokeStyle = 'rgba(120,100,70,.9)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(e.x - 4, Y_OFF); ctx.lineTo(e.x - 4, e.y - e.z - 90); ctx.stroke(); inner(); } },
  });
  // ---------------- the end of each area: the way on ----------------
  if (typeof THRESH !== 'undefined') {
    // the Winter Fields -> the Edge: a little chapel at the end of the snow, its bell in a bell-cote over a roofed
    // lych-gate; through the gate, a harvest. Awake: the bell swings and the gate stands open
    const gate = { cx: 10, w: 46, top: 150 };
    const gatePath = (x, inset = 0) => { const { cx, w, top } = gate, hw = w / 2 - inset, B = FLOOR_TOP + 4; ctx.beginPath(); ctx.moveTo(x + cx - hw, B); ctx.lineTo(x + cx - hw, top + 10); ctx.lineTo(x + cx, top - 4 + inset); ctx.lineTo(x + cx + hw, top + 10); ctx.lineTo(x + cx + hw, B); ctx.closePath(); };
    THRESH.w8bells = {
      nextDX: 200,
      mask() { ctx.fillStyle = '#fff'; gatePath(0, -2); ctx.fill(); },
      backB: [-200, 40, 220, FLOOR_TOP + 30], back(r) {
        const T = FLOOR_TOP;
        W8.art.cottage(-110, T, 90, 46, r, { wall: '#B8AC94', roof: '#5A4434', chimney: false }); // the chapel's nave
        ctx.fillStyle = '#C2B49A'; ctx.fillRect(-28, T - 70, 30, 70); ctx.fillStyle = '#8A7C64'; ctx.fillRect(-28, T - 70, 10, 70); // the bell-cote's tower
        ctx.fillStyle = '#1E1812'; ctx.fillRect(-20, T - 64, 14, 16); ctx.fillStyle = '#4A3A2C'; poly([-32, T - 70, -13, T - 96, 6, T - 70]); ctx.fill(); ctx.fillStyle = PAL.snow; poly([-32, T - 69, -13, T - 96, -16, T - 82, -28, T - 70]); ctx.fill();
        // the lych-gate: two posts, a little roof heavy with snow
        ctx.fillStyle = '#3A2A1C'; for (const sx of [-gate.w / 2 - 4, gate.w / 2]) ctx.fillRect(gate.cx + sx, gate.top + 8, 5, T - gate.top - 4);
        ctx.fillStyle = '#4A3424'; poly([gate.cx - 40, gate.top + 12, gate.cx, gate.top - 16, gate.cx + 40, gate.top + 12]); ctx.fill(); ctx.fillStyle = PAL.snow; poly([gate.cx - 42, gate.top + 12, gate.cx, gate.top - 18, gate.cx + 42, gate.top + 12, gate.cx + 36, gate.top + 8, gate.cx, gate.top - 12, gate.cx - 36, gate.top + 8]); ctx.fill();
        ctx.save(); ctx.globalCompositeOperation = 'destination-out'; gatePath(0); ctx.fill(); ctx.restore();
        for (let i = 0; i < 4; i++) W8.art.bareTree(-160 + i * 110 + r() * 30, T, 120 + r() * 40, r, { crows: 2 });
        ctx.fillStyle = PAL.snow; ell(0, T + 2, 160, 6); ctx.fill();
      },
      live(x, k, t) { const sw = Math.sin(t * 3) * .6 * k, bx = x - 13, by = FLOOR_TOP - 62; ctx.save(); ctx.translate(bx, by); ctx.rotate(sw); ctx.fillStyle = '#9A7A3A'; ctx.beginPath(); ctx.moveTo(-5, 10); ctx.quadraticCurveTo(-5, 0, 0, -1); ctx.quadraticCurveTo(5, 0, 5, 10); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#3A2A10'; ctx.lineWidth = .8; ctx.stroke(); ctx.restore();
        if (k > 0 && Math.sin(t * 3) > .98 && !(this.lastT > t - .5)) { this.lastT = t; if (typeof tone === 'function' && sfxOn && actx) tn(392, 1.2, 'sine', .05); } },
    };
    // the Edge -> the Heart: two great stones of the Circle's rim leaning together, a black hedge of thorn going off on
    // either side; between the stones, the grey. Awake: the thorn draws back from the gap
    const gap = { cx: 0, w: 52, top: 120 };
    THRESH.w8circle = {
      nextDX: 240,
      mask() { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(gap.cx - gap.w / 2, FLOOR_TOP + 4); ctx.lineTo(gap.cx - gap.w / 2 + 6, gap.top); ctx.lineTo(gap.cx + gap.w / 2 - 6, gap.top - 4); ctx.lineTo(gap.cx + gap.w / 2, FLOOR_TOP + 4); ctx.closePath(); ctx.fill(); },
      backB: [-320, 40, 320, FLOOR_TOP + 30], back(r) {
        const T = FLOOR_TOP, GR = W8.art.GR;
        ctx.strokeStyle = '#140E0A'; ctx.lineCap = 'round'; for (let i = 0; i < 90; i++) { const sx = (r() < .5 ? -1 : 1) * (40 + r() * 270), sy = T - r() * 60; ctx.lineWidth = .8 + r() * 1.6; ctx.beginPath(); ctx.moveTo(sx, T); ctx.quadraticCurveTo(sx + (r() - .5) * 40, sy + 20, sx + (r() - .5) * 30, sy); ctx.stroke(); } // the thorn hedge
        for (const s of [-1, 1]) { const x0 = gap.cx + s * (gap.w / 2 + 14); ctx.fillStyle = GR(.3); poly([x0 - 16, T + 2, x0 - 18 + s * 6, T - 80, x0 - s * 12, gap.top - 20, x0 + 14, T - 70, x0 + 16, T + 2]); ctx.fill(); ctx.fillStyle = GR(.55); poly([x0 - s * 12, gap.top - 20, x0 + 14 * (s > 0 ? 1 : -1), T - 70, x0 + 16 * (s > 0 ? 1 : -1), T + 2, x0, T + 2]); ctx.fill(); W8.art.sketch([x0 - 16, T + 2, x0 - 18 + s * 6, T - 80, x0 - s * 12, gap.top - 20, x0 + 14, T - 70, x0 + 16, T + 2], r, .5, .8); }
      },
      live(x, k, t) { ctx.save(); ctx.strokeStyle = 'rgba(16,10,8,.95)'; ctx.lineWidth = 1.4; const c = 1 - sm(k); for (let i = 0; i < 9; i++) { const y = FLOOR_TOP - 4 - i * 11; ctx.beginPath(); ctx.moveTo(x - gap.w / 2, y); ctx.quadraticCurveTo(x, y + 6 * Math.sin(t + i), x - gap.w / 2 + gap.w * c, y - 3); ctx.stroke(); } ctx.restore(); },
    };
  }
  // ---------------- deaths ----------------
  const CUSTOM_DEATH = { w8hollow: 'w8ash', w8egg: 'w8crack', w8bell: 'w8bellfall' };
  const _kill = killEnemy;
  killEnemy = function (e, dir, m) {
    _kill(e, dir, m);
    const cd = CUSTOM_DEATH[e.type];
    if (cd && !e.boss) { const wasPop = e.death === 'pop'; e.death = cd; e.air = false; e.spin = 0; e.rotA = 0; e.vx = 0; e.vz = 0; e.z = 0; e.t = e.dmax = 1.6; if (wasPop) dropLoot(e);
      if (cd === 'w8ash') { W8.akit.ash(e.x, e.y, 20, 18); sfx('crunch', .4); } if (cd === 'w8crack') { sfx('break'); } if (cd === 'w8bellfall') { tn(196, 2, 'sine', .12); tn(311, 1.4, 'sine', .05); } }
  };
  const _dd = drawDeath;
  drawDeath = function (e, t) {
    const d = e.death; if (!d || !/^w8/.test(d)) return _dd(e, t);
    const el = e.corpse ? (e.dmax || 1) : e.dmax - e.t, k = cl01(el / (e.dmax || 1)), a = { walk: 0, t: e.deadAt || t, wind: 0, hurt: true };
    ctx.save(); ctx.globalAlpha = e.fade !== undefined ? e.fade : 1;
    if (d === 'w8ash') { // it falls in on itself and is a heap of grey ash, with the flail lying in it
      const u = sm(k / .7); ctx.fillStyle = C('#6E685E'); ell(e.x, e.y, 8 + u * 14, 2 + u * 4); ctx.fill(); outline(1); ctx.fillStyle = C('#A8A094'); ell(e.x - 3, e.y - 1 - u * 2, 4 + u * 8, 1 + u * 3); ctx.fill();
      if (u < 1) { ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.facing * (1 + u * .3), 1 - u); ctx.globalAlpha *= 1 - u * .6; CREATURES.w8hollow(e, a); ctx.restore(); }
      else { ctx.strokeStyle = C('#5A4A36'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(e.x - 10, e.y - 2); ctx.lineTo(e.x + 12, e.y - 4); ctx.stroke(); }
    } else if (d === 'w8crack') { // the shell splits and the two halves fall apart; what was in it runs out gold
      const u = sm(k / .5); ctx.fillStyle = C('#E8B040'); ell(e.x + 4, e.y, 6 + u * 16, 2 + u * 4); ctx.fill(); outline(1);
      for (const s of [-1, 1]) { ctx.save(); ctx.translate(e.x + s * u * 16, e.y + lerp(-44, -12, u)); ctx.rotate(s * u * 1.4); ctx.beginPath(); ctx.rect(s < 0 ? -20 : 0, -30, 20, 52); ctx.clip(); W8.kit.cel(W8.kit.PB([0, -24, 11, -20, 15, -4, 12, 12, 0, 17, -12, 12, -15, -4, -11, -20]), '#ECE4D2', { d: 2, r: 1, w: 1.5 }); ctx.restore(); }
      ctx.strokeStyle = C('#C88A74'); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(e.x - 6, e.y - 2); ctx.lineTo(e.x - 20, e.y - 4); ctx.moveTo(e.x + 8, e.y - 1); ctx.lineTo(e.x + 22, e.y - 2); ctx.stroke();
    } else if (d === 'w8bellfall') { // the bell comes off him and rolls over on its side, and the man in it is not there at all
      const u = sm(k / .8); ctx.save(); ctx.translate(e.x + e.facing * u * 18, e.y - 2); ctx.rotate(e.facing * u * 1.45); W8.art.bell(0, 0, 1, 2, k < .9 ? (1 - k) : 0, t); ctx.restore();
      if (u < .6) { ctx.save(); ctx.translate(e.x, e.y); ctx.globalAlpha *= 1 - u / .6; ctx.fillStyle = C('#E8DCC0'); ctx.fillRect(-6, -22, 4, 22); ctx.fillRect(3, -22, 4, 22); ctx.restore(); }
    } else if (d === 'w8fall') { // the Goat-Lord: he goes forward onto his face, and goes to grey ash from the horns down; the horn is left
      const u = sm(k / .7); ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.facing * (e.size || 1), e.size || 1);
      if (u < 1) { ctx.globalAlpha *= 1 - sm((k - .5) / .5); ctx.rotate(u * .25); W8.goatLord({ form: 4, kneel: 1, book: 0, tilt: .4 + u * .6, lean: .3 + u * .4, t, crook: 1.4 }); }
      ctx.restore();
      ctx.fillStyle = C('#6E685E'); ell(e.x, e.y + 2, 30 * u, 6 * u); ctx.fill();
      if (k > .65) W8.hornDraw(e.x + e.facing * 20, e.y - 4, .9, t, cl01((k - .65) / .2));
    }
    ctx.restore();
  };
  // the crossbow bolt: a quarrel with a square head and leather fletching
  const _dp = drawProj;
  drawProj = function (p, t) { if (!p.w8bolt) return _dp(p, t); const d = Math.sign(p.vx) || 1; shadow(p.x, p.y, 5); ctx.save(); ctx.translate(p.x, p.y - p.z); ctx.scale(d, 1);
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(6, 0); ctx.stroke(); ctx.strokeStyle = C('#6A4A2A'); ctx.lineWidth = 1.2; ctx.stroke();
    W8.kit.fillPoly([6, -2, 11, 0, 6, 2], '#9A9EA2', 1); W8.kit.fillPoly([-14, 0, -9, -3, -8, 0], '#5A3A22', .8); W8.kit.fillPoly([-14, 0, -9, 3, -8, 0], '#4A2A18', .8);
    ctx.restore(); if (DET()) { ctx.strokeStyle = 'rgba(255,240,220,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x - d * 30, p.y - p.z); ctx.lineTo(p.x - d * 12, p.y - p.z); ctx.stroke(); } };
  };

  // ======================================================================================================
  // THE HORN OF LORRAINE (the relic: w8_late.js gives it its power) and the TRUMP OF LORRAINE (the card face)
  // ======================================================================================================
  // the horn: an ox-horn bound in gilt bands, a silver mouthpiece, hung on a baldric of Lorraine's red and gold
  function hornDraw(x, y, s, t, a = 1, rot = -.25) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = C('#8A1E18'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, -3); ctx.quadraticCurveTo(0, 10, 12, -6); ctx.stroke(); ctx.strokeStyle = C('#D6A43A'); ctx.lineWidth = .7; ctx.setLineDash([1.5, 1.5]); ctx.stroke(); ctx.setLineDash([]); // the baldric
    const body = taper(-16, -2, 0, -10, 16, -6, 2.4, 9, 8);
    trace(body.L, body.R); ctx.fillStyle = C('#E8DCC0'); ctx.fill();
    if (DET()) { trace(body.L, body.M); ctx.fillStyle = 'rgba(150,120,80,.45)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,252,240,.8)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(body.R[0], body.R[1]); for (let i = 2; i < body.R.length; i += 2) ctx.lineTo(body.R[i], body.R[i + 1]); ctx.stroke(); }
    trace(body.L, body.R); outline(1.1);
    for (const i of [2, 5, 8]) { const lx = body.L[i * 2 - 2], ly = body.L[i * 2 - 1], rx = body.R[i * 2 - 2], ry = body.R[i * 2 - 1]; goldLine(() => { ctx.moveTo(lx, ly); ctx.lineTo(rx, ry); }, 1.6); } // the gilt bands
    ctx.fillStyle = C('#C8CCD2'); ell(16.5, -6, 1.4, 5.2, .2); ctx.fill(); outline(.8); // the bell of the horn, rimmed
    ctx.fillStyle = C('#B8BCC4'); ctx.fillRect(-19, -3.4, 4, 2.6); // the mouthpiece
    ctx.restore();
  }
  W8.hornDraw = hornDraw;
  // the Trump: a page out of a Book of Hours, a winter month. Under a half-moon of lapis with gold stars, a castle on its
  // hill over a snowy field; a knight rides out under Lorraine's banner; low on the horizon, the black ring. Snow falls
  W8.card = (g, w, h, t) => {
    const old = ctx; ctx = g; ctx.save();
    try {
      const sky = ctx.createLinearGradient(0, 0, 0, h * .62); sky.addColorStop(0, '#2E4A86'); sky.addColorStop(1, '#9EB0C8'); ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      // the tympanum of the calendar page: a lapis half-moon with gold stars and a gilt rim
      ctx.save(); ctx.beginPath(); ctx.ellipse(w / 2, h * .02, w * .46, h * .17, 0, 0, Math.PI); ctx.fillStyle = '#1E3270'; ctx.fill(); ctx.strokeStyle = '#D6A43A'; ctx.lineWidth = Math.max(1, w * .012); ctx.stroke();
      ctx.fillStyle = '#E8C060'; for (let i = 0; i < 18; i++) { const a = Math.PI * (.08 + .84 * hsh(i)), r = (.3 + .6 * hsh(i + 3)); circle(w / 2 + Math.cos(a) * w * .44 * r, h * .02 + Math.sin(a) * h * .16 * r, Math.max(.6, w * .006)); ctx.fill(); }
      ctx.fillStyle = '#F2D890'; ctx.font = `700 ${Math.max(6, w * .05)}px Cinzel, Georgia, serif`; ctx.textAlign = 'center'; ctx.fillText('IANUARIUS', w / 2, h * .1); ctx.restore();
      // the hill and its castle, white and blue in the cold, its roofs blue slate, a pennon of Lorraine
      const hy = h * .5;
      ctx.fillStyle = '#C8D0D4'; ctx.beginPath(); ctx.moveTo(0, hy + h * .06); ctx.quadraticCurveTo(w * .3, hy - h * .12, w * .62, hy - h * .02); ctx.quadraticCurveTo(w * .85, hy + h * .04, w, hy + h * .02); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
      const cx = w * .36, cy = hy - h * .015;
      for (const [dx, tw, th] of [[-.12, .06, .2], [-.04, .1, .15], [.06, .06, .24], [.13, .05, .17]]) { const x = cx + dx * w, wt = tw * w, ht = th * h; ctx.fillStyle = '#EEECE4'; ctx.fillRect(x - wt / 2, cy - ht, wt, ht); ctx.fillStyle = '#B8C0C8'; ctx.fillRect(x - wt / 2, cy - ht, wt * .3, ht);
        ctx.fillStyle = '#3A5A96'; poly([x - wt * .62, cy - ht, x, cy - ht - wt * 1.1, x + wt * .62, cy - ht]); ctx.fill(); ctx.fillStyle = '#1E1812'; ctx.fillRect(x - wt * .12, cy - ht * .7, wt * .24, ht * .12); }
      ctx.strokeStyle = '#1E1812'; ctx.lineWidth = Math.max(.6, w * .006); ctx.beginPath(); ctx.moveTo(cx + .06 * w, cy - .24 * h - .066 * w); ctx.lineTo(cx + .06 * w, cy - .24 * h - .13 * w); ctx.stroke();
      ctx.fillStyle = PAL.or; poly([cx + .06 * w, cy - .24 * h - .13 * w, cx + .14 * w + Math.sin(t * 3) * w * .01, cy - .24 * h - .11 * w, cx + .06 * w, cy - .24 * h - .09 * w]); ctx.fill(); ctx.strokeStyle = PAL.gules; ctx.lineWidth = Math.max(.6, w * .01); ctx.beginPath(); ctx.moveTo(cx + .07 * w, cy - .24 * h - .12 * w); ctx.lineTo(cx + .12 * w, cy - .24 * h - .1 * w); ctx.stroke();
      // the field, the black ring low on the horizon at the right, breathing
      const rk = .5 + .5 * Math.sin(t * 1.3);
      ctx.fillStyle = `rgba(30,24,22,${.75 + rk * .15})`; ctx.beginPath(); ctx.ellipse(w * .8, hy + h * .015, w * .2, h * .02 + rk * h * .004, 0, 0, TAU); ctx.fill();
      const dome = ctx.createLinearGradient(0, hy - h * .12, 0, hy); dome.addColorStop(0, 'rgba(40,34,30,0)'); dome.addColorStop(1, `rgba(40,34,30,${.45 + rk * .2})`); ctx.fillStyle = dome; ctx.beginPath(); ctx.moveTo(w * .6, hy + h * .02); ctx.quadraticCurveTo(w * .8, hy - h * .16, w, hy + h * .02); ctx.fill();
      // a knight rides out down the hill: a white horse in Lorraine's caparison, a lance with the banner
      ctx.save(); ctx.translate(w * .58, h * .8); const s = w / 230; ctx.scale(s, s);
      const bob = Math.sin(t * 6) * 1.2; ctx.translate(0, bob);
      W8.horse('back', { t, walk: t * 6, gallop: 0 });
      const L = heroLook(); ctx.save(); ctx.translate(0, -36); drawHumanoid(L, { arm: .5, Y: .3, weapon: 'rapier' }); ctx.restore();
      W8.horse('front', { t, walk: t * 6, legCol: L.legs || '#2A2422', bootCol: L.boots || '#3A2618' });
      ctx.restore();
      // snow, falling
      for (let i = 0; i < 40; i++) { const life = (t * .08 + hsh(i)) % 1; ctx.fillStyle = 'rgba(255,255,252,.85)'; circle((hsh(i + 1) * w + Math.sin(t + i) * w * .02 + w) % w, life * h, Math.max(.5, w * .006) * (.6 + hsh(i + 2))); ctx.fill(); }
      // the margin: a border of gold leaf with Lorraine's arms at the foot
      ctx.strokeStyle = '#C9982E'; ctx.lineWidth = Math.max(1, w * .02); ctx.strokeRect(w * .02, h * .015, w * .96, h * .97);
      lorraineArms(w / 2, h * .92, w * .14, h * .1, { ow: Math.max(.6, w * .006) });
    } finally { ctx.restore(); ctx = old; }
  };
})();
