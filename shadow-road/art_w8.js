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
  // (the street's far edge is read live as FLOOR_TOP: the glide view moves it, core.js)
  const DET = () => !FLASH && !TINT && !LITE;
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
    { const g = ctx.createLinearGradient(0, 152, 0, FLOOR_TOP); g.addColorStop(0, '#CDD0C4'); g.addColorStop(.5, '#DAD8CC'); g.addColorStop(1, '#E4E0D4'); ctx.fillStyle = g; ctx.fillRect(0, 150, AW_W, FLOOR_TOP - 150); }
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
    hazeBand(f, th.haze, 200, FLOOR_TOP, .2);
  }
  function fieldsMid(rnd) {
    AW_SUN = -1; W8.smoke = [];
    // the brow of the hill the hunters come down: a bank of snow, the inn and its neighbours, the tall trees full of crows
    { ctx.fillStyle = '#E8E4D8'; ctx.beginPath(); ctx.moveTo(0, FLOOR_TOP); const hw = awWave(3, [[2, 3], [5, 1.5]]); for (let x = 0; x <= AW_W; x += 12) ctx.lineTo(x, FLOOR_TOP - 10 + hw(x)); ctx.lineTo(AW_W, FLOOR_TOP); ctx.fill(); }
    for (let i = 0; i < 40; i++) { const x = rnd() * AW_W, y = FLOOR_TOP - 6 - rnd() * 6; dab(x, y, 3 + rnd() * 5, rnd() < .5 ? 'rgba(164,178,182,.45)' : 'rgba(255,253,246,.6)', 1); }
    for (let i = 0; i < 3; i++) awWR(100 + i * 420 + rnd() * 80, 60, rnd, (x, r) => { // houses on the brow
      const n = 1 + Math.floor(r() * 2); for (let k = 0; k < n; k++) cottage(x + k * 50, FLOOR_TOP - 6, 34 + r() * 12, 20 + r() * 8, r, { timber: r() < .4 });
    });
    awWR(620, 60, rnd, (x, r) => { // the inn: its sign hanging by one hinge, a fire of straw burning in the yard
      cottage(x, FLOOR_TOP - 6, 56, 28, r, { wall: '#9E8468', timber: true });
      ctx.strokeStyle = '#2A1E16'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + 30, FLOOR_TOP - 28); ctx.lineTo(x + 46, FLOOR_TOP - 28); ctx.stroke();
      ctx.save(); ctx.translate(x + 44, FLOOR_TOP - 28); ctx.rotate(.5); ctx.fillStyle = '#C2B49A'; ctx.fillRect(-1, 0, 10, 12); ctx.fillStyle = '#5A3A26'; ctx.fillRect(1, 2, 6, 7); ctx.fillStyle = '#E8DCC0'; ctx.fillRect(3, 3.5, 2, 3); ctx.restore();
      W8.fires = W8.fires || []; W8.fires.push([x - 44, FLOOR_TOP - 8]);
      ctx.fillStyle = '#3A2A1E'; ell(x - 44, FLOOR_TOP - 7, 9, 2.4); ctx.fill(); ctx.fillStyle = '#C86A2A'; ell(x - 44, FLOOR_TOP - 9, 4, 3); ctx.fill(); ctx.fillStyle = '#F0B050'; ell(x - 44, FLOOR_TOP - 10, 2, 2); ctx.fill();
      for (const [dx, f2] of [[-58, 1], [-30, -1]]) { ctx.save(); ctx.translate(x + dx, FLOOR_TOP - 6); ctx.scale(f2 * .9, .9); ctx.fillStyle = '#2A1E16'; poly([-2, -12, 2, -12, 3, -5, 1, 0, -1, 0, -3, -5]); ctx.fill(); circle(0, -14, 2); ctx.fill(); ctx.fillStyle = '#8A2A22'; ctx.fillRect(-2, -10, 4, 3); ctx.restore(); } // the women at the fire
    });
    awWR(300, 60, rnd, (x, r) => { // the hunters coming home with their hounds, heads down, one with a fox on his spear
      for (let k = 0; k < 3; k++) { const hx = x + k * 18; ctx.save(); ctx.translate(hx, FLOOR_TOP - 5); ctx.fillStyle = '#1E1812';
        poly([-3, -14, 3, -14, 4, -6, 2, 0, -2, 0, -4, -6]); ctx.fill(); circle(1, -16.5, 2.2); ctx.fill(); ctx.strokeStyle = '#1E1812'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(-5, 0); ctx.moveTo(3, -6); ctx.lineTo(5, 0); ctx.stroke();
        ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(-6, -24); ctx.lineTo(6, -4); ctx.stroke(); if (k === 1) { ctx.fillStyle = '#A0582A'; ell(-5, -22, 3, 1.4, .9); ctx.fill(); } ctx.restore(); }
      for (let k = 0; k < 5; k++) { const dx = x - 20 + k * 13 + r() * 4; ctx.fillStyle = '#2A2018'; ell(dx, FLOOR_TOP - 8, 4, 1.8); ctx.fill(); ctx.fillRect(dx - 3.4, FLOOR_TOP - 8, .8, 4); ctx.fillRect(dx + 2.4, FLOOR_TOP - 8, .8, 4); ell(dx + 4, FLOOR_TOP - 10, 1.6, 1.2); ctx.fill(); }
    });
    for (let i = 0; i < 7; i++) awWR(rnd() * AW_W, 70, rnd, (x, r) => bareTree(x, FLOOR_TOP - 6 - r() * 4, 110 + r() * 80, r, { crows: 3 + Math.floor(r() * 5) }));
    awWR(1010, 40, rnd, (x, r) => gibbetWheel(x, FLOOR_TOP - 8, 1, r));
    hazeBand(ctx, '214,220,208', FLOOR_TOP - 30, FLOOR_TOP, .14);
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
    { const g = ctx.createLinearGradient(0, FLOOR_TOP - 4, 0, VH); g.addColorStop(0, '#E4E0D2'); g.addColorStop(.4, '#D8D6CA'); g.addColorStop(1, '#B6BCB6'); ctx.fillStyle = g; ctx.fillRect(0, FLOOR_TOP - 4, AW_W, VH - FLOOR_TOP + 4); }
    for (let i = 0; i < 420; i++) { const x = rnd() * AW_W, y = FLOOR_TOP + rnd() * (VH - FLOOR_TOP); dab(x, y, 2 + rnd() * 5, rnd() < .45 ? 'rgba(150,166,172,.18)' : 'rgba(255,253,246,.25)', 1); }
    // the road: two ruts of brown slush, straw trodden into them, running the length of the field
    for (const ry of [FLOOR_TOP + 44, FLOOR_TOP + 58, FLOOR_TOP + 82, FLOOR_TOP + 96]) { const wv = awWave(ry, [[1, 1.5], [3, .8]]); ctx.strokeStyle = 'rgba(110,92,70,.42)'; ctx.lineWidth = 3.4; ctx.beginPath(); for (let x = -10; x <= AW_W + 10; x += 20) { const y = ry + Math.sin(x * .013 + ry) * 3 + wv(x); x < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); ctx.strokeStyle = 'rgba(70,56,42,.3)'; ctx.lineWidth = 1; ctx.stroke(); }
    for (let i = 0; i < 160; i++) { const x = rnd() * AW_W, y = FLOOR_TOP + 40 + rnd() * 66; ctx.strokeStyle = rnd() < .5 ? 'rgba(196,164,96,.75)' : 'rgba(150,120,70,.6)'; ctx.lineWidth = .7; ctx.beginPath(); const a = rnd() * 3; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 4, y + Math.sin(a) * 1.4); ctx.stroke(); } // straw
    for (let i = 0; i < 40; i++) { const x = rnd() * AW_W, y = FLOOR_TOP + 30 + rnd() * 80; for (let k = 0; k < 5; k++) { ctx.fillStyle = 'rgba(120,136,146,.35)'; ell(x + k * 7, y + (k % 2) * 3, 1.6, .9); ctx.fill(); } } // footprints going off
    for (let i = 0; i < 90; i++) { const x = rnd() * AW_W, y = FLOOR_TOP + rnd() * (VH - FLOOR_TOP); ctx.strokeStyle = 'rgba(70,60,40,.7)'; ctx.lineWidth = .6; ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(x + k * 1.4, y); ctx.lineTo(x + k * 1.4 + (rnd() - .5) * 3, y - 3 - rnd() * 4); } ctx.stroke(); } // dead grass through the snow
    // the far edge: a low wattle fence and a ditch, snow drifted against it
    ctx.fillStyle = 'rgba(160,172,176,.55)'; ctx.fillRect(0, FLOOR_TOP - 3, AW_W, 5);
    for (let x = 3; x < AW_W; x += 22) { ctx.fillStyle = '#3A2C20'; ctx.fillRect(x, FLOOR_TOP - 16, 2.2, 15); ctx.fillStyle = PAL.snow; ctx.fillRect(x - .4, FLOOR_TOP - 17, 3, 1.6); }
    ctx.strokeStyle = '#4A3826'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, FLOOR_TOP - 11); ctx.lineTo(AW_W, FLOOR_TOP - 11); ctx.moveTo(0, FLOOR_TOP - 6); ctx.lineTo(AW_W, FLOOR_TOP - 6); ctx.stroke();
    ctx.fillStyle = 'rgba(236,232,220,.9)'; for (let x = 0; x < AW_W; x += 11) ell(x + 5, FLOOR_TOP - 1, 8, 2.4); ctx.fill();
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
    hazeBand(f, th.haze, 205, FLOOR_TOP, .25);
  }
  function edgeMid(rnd) {
    AW_SUN = -1;
    // the wheat, standing, over the brow of the field; the pear tree, the reapers under it, stooks, a mill, a church in elms
    for (let i = 0; i < 4; i++) awWR(150 + i * 320 + rnd() * 60, 40, rnd, (x, r) => { for (let k = 0; k < 4; k++) inkDab(x - 20 + k * 12 + r() * 4, FLOOR_TOP - 50 - r() * 10, 9 + r() * 5, r() < .5 ? '#4E5A2A' : '#5E6A32'); // elms round the church
      cottage(x, FLOOR_TOP - 20, 30, 16, r, { wall: '#C4B49A', roof: '#7A4A30', chimney: false }); const tx = x + 14; ctx.fillStyle = '#B4A48A'; ctx.fillRect(tx, FLOOR_TOP - 64, 9, 44); ctx.fillStyle = '#86765E'; ctx.fillRect(tx, FLOOR_TOP - 64, 3, 44); ctx.fillStyle = '#6A4A34'; poly([tx - 1, FLOOR_TOP - 64, tx + 4.5, FLOOR_TOP - 80, tx + 10, FLOOR_TOP - 64]); ctx.fill(); });
    awWR(820, 70, rnd, (x, r) => postMill(x, FLOOR_TOP - 34, 1.1, r, .35));
    for (let x = 0; x < AW_W; x += 38) wheatStand(x + rnd() * 20, FLOOR_TOP - 2, 46, 34 + rnd() * 14, rnd, Math.max(0, Math.sin(x / AW_W * TAU * 2) - .3) * 1.4);
    awWR(420, 60, rnd, (x, r) => { pearTree(x, FLOOR_TOP - 4, 120, r); reaper(x - 18, FLOOR_TOP - 4, 1, r, 'sleep'); reaper(x + 14, FLOOR_TOP - 4, 1, r, 'eat'); reaper(x + 34, FLOOR_TOP - 2, .9, r, 'eat'); });
    for (let i = 0; i < 10; i++) awWR(rnd() * AW_W, 12, rnd, (x, r) => stook(x, FLOOR_TOP - 2 - r() * 4, 1.2 + r() * .4, r));
    awWR(1140, 40, rnd, (x, r) => gibbetWheelHarvest(x, FLOOR_TOP - 6, r));
    hazeBand(ctx, '226,212,170', FLOOR_TOP - 40, FLOOR_TOP, .12);
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
    { const g = ctx.createLinearGradient(0, FLOOR_TOP - 4, 0, VH); g.addColorStop(0, '#C8A458'); g.addColorStop(.45, '#B8924A'); g.addColorStop(1, '#8A6A34'); ctx.fillStyle = g; ctx.fillRect(0, FLOOR_TOP - 4, AW_W, VH - FLOOR_TOP + 4); }
    for (let row = 0, y = FLOOR_TOP + 4; y < VH; row++, y += 7 + row * 1.2) { ctx.strokeStyle = `rgba(110,76,26,${.3 + row * .03})`; ctx.lineWidth = .6 + row * .08; ctx.beginPath(); for (let x = 0; x < AW_W; x += 3 + row * .3) { const h = 2 + row * .5 + hsh(x + row * 13) * 2; ctx.moveTo(x, y); ctx.lineTo(x + .6, y - h); } ctx.stroke();
      ctx.strokeStyle = `rgba(246,220,150,${.35})`; ctx.lineWidth = .5; ctx.beginPath(); for (let x = 1.5; x < AW_W; x += 5 + row * .5) { ctx.moveTo(x, y); ctx.lineTo(x + .5, y - 2 - row * .4); } ctx.stroke(); }
    for (let i = 0; i < 240; i++) dab(rnd() * AW_W, FLOOR_TOP + rnd() * (VH - FLOOR_TOP), 2 + rnd() * 5, rnd() < .5 ? 'rgba(236,206,130,.22)' : 'rgba(96,66,26,.2)', 1);
    { const wv = awWave(77, [[1, 6], [3, 3]]); const g = ctx.createLinearGradient(0, FLOOR_TOP + 40, 0, FLOOR_TOP + 80); g.addColorStop(0, 'rgba(206,182,130,0)'); g.addColorStop(.3, 'rgba(206,182,130,.8)'); g.addColorStop(.7, 'rgba(186,160,110,.8)'); g.addColorStop(1, 'rgba(186,160,110,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, FLOOR_TOP + 40 + wv(0)); for (let x = 0; x <= AW_W; x += 10) ctx.lineTo(x, FLOOR_TOP + 40 + wv(x)); for (let x = AW_W; x >= 0; x -= 10) ctx.lineTo(x, FLOOR_TOP + 80 + wv(x)); ctx.fill(); } // the dust road
    for (let i = 0; i < 26; i++) { const x = rnd() * AW_W, y = FLOOR_TOP + 10 + rnd() * 90; ctx.save(); ctx.translate(x, y); ctx.rotate((rnd() - .5) * .6); ctx.fillStyle = '#C89A3A'; ell(0, 0, 9, 2.4); ctx.fill(); ctx.fillStyle = '#E2B85A'; ell(-2, -.8, 6, 1.2); ctx.fill(); ctx.fillStyle = '#7A5418'; ctx.fillRect(-1, -2.4, 2, 4.8); ctx.restore(); } // sheaves
    for (let i = 0; i < 14; i++) { const x = rnd() * AW_W, y = FLOOR_TOP + 14 + rnd() * 90, r = 6 + rnd() * 12; for (let k = 0; k < 7; k++) dab(x + (rnd() - .5) * r * 2, y + (rnd() - .5) * r * .5, 2 + rnd() * r * .4, rnd() < .5 ? 'rgba(40,32,28,.55)' : 'rgba(70,60,52,.4)', 1); } // the blight
    for (let i = 0; i < 5; i++) { const x = rnd() * AW_W, y = FLOOR_TOP + 20 + rnd() * 80; ctx.strokeStyle = '#4A3A26'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 20, y - 3); ctx.stroke(); ctx.strokeStyle = '#8A9094'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x + 20, y - 3); ctx.quadraticCurveTo(x + 27, y - 6, x + 30, y - 1); ctx.stroke(); } // scythes left lying
    // the far edge: the uncut wheat begins, a wall of it
    for (let x = 0; x < AW_W; x += 3) { const h = 10 + hsh(x) * 6; ctx.strokeStyle = hsh(x + 1) < .5 ? '#D0A040' : '#A87A2A'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, FLOOR_TOP + 2); ctx.lineTo(x + (hsh(x + 2) - .5) * 3, FLOOR_TOP - h); ctx.stroke(); }
    const sh = ctx.createLinearGradient(0, VH - 34, 0, VH - 6); sh.addColorStop(0, 'rgba(60,40,20,0)'); sh.addColorStop(1, 'rgba(60,40,20,.3)'); ctx.fillStyle = sh; ctx.fillRect(0, VH - 34, AW_W, 28);
  }
  THEMES.lorraine2 = {
    name: 'the edge of the circle', sky: ['#7A8288', '#A6A898', '#CEC6A0', '#E2D6A8'], sun: [0.22, -0.5, '255,236,190'], haze: '222,212,176',
    floorA: '#C8A458', floorB: '#8A6A34', path: '#C8B488', skyKind: 'none',
    grade: { desat: .08, top: 'rgba(110,110,130,.3)', bot: 'rgba(240,200,120,.34)', vig: 'rgba(40,30,20,.55)' },
    liveSky(camX, t) { for (let i = 0; i < 5; i++) { const life = ((t * .012 + hsh(i + 9)) % 1), x = lerp(-60, VW + 60, life), y = Y_OFF + 24 + hsh(i + 4) * 70; W8.art.crowFly(x, y, .6 + hsh(i) * .4, t * 1.4 + i, .8); } },
    liveFloor(camX, t) { // chaff and thistledown drifting over the field in the heat
      for (let i = 0; i < 40; i++) { const r = hsh(i * 1.7), life = ((t * (.04 + r * .05)) + hsh(i)) % 1, wx = hsh(i + 3) * 1280, x = ((wx - camX * (.5 + r * .5) + life * 260) % 1280 + 1280) % 1280 - 320, y = FLOOR_TOP - 60 + hsh(i + 5) * 150 + Math.sin(t + i) * 10;
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
    { ctx.beginPath(); ctx.moveTo(0, FLOOR_TOP); for (let x = 0; x <= AW_W; x += 8) ctx.lineTo(x, 132 + rim(x)); ctx.lineTo(AW_W, FLOOR_TOP); const g = ctx.createLinearGradient(0, 100, 0, FLOOR_TOP); g.addColorStop(0, GR(.22)); g.addColorStop(1, GR(.5)); ctx.fillStyle = g; ctx.fill(); }
    for (let i = 0; i < 70; i++) { const x = rnd() * AW_W, y = 140 + rim(x) + rnd() * 30; ctx.strokeStyle = 'rgba(20,16,12,.3)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 2, y - 6 - rnd() * 6); ctx.stroke(); } // dead stumps along it
    { ctx.strokeStyle = 'rgba(16,12,10,.6)'; ctx.lineWidth = 1.1; ctx.beginPath(); for (let x = 0; x <= AW_W; x += 8) { const y = 132 + rim(x); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
    hazeBand(f, '180,174,160', 120, 190, .4);
    for (let i = 0; i < 7; i++) awWR(i * 182 + rnd() * 60, 50, rnd, (x, r) => boschForm(x, 176 + r() * 16, .6 + r() * .5, i % 4, r));
    hazeBand(f, '180,174,160', 170, FLOOR_TOP, .35);
  }
  function heartMid(rnd) {
    AW_SUN = 1;
    { ctx.fillStyle = GR(.46); ctx.beginPath(); ctx.moveTo(0, FLOOR_TOP); const hw = awWave(9, [[2, 4], [7, 2]]); for (let x = 0; x <= AW_W; x += 10) ctx.lineTo(x, FLOOR_TOP - 18 + hw(x)); ctx.lineTo(AW_W, FLOOR_TOP); ctx.fill(); }
    for (let i = 0; i < 12; i++) awWR(rnd() * AW_W, 30, rnd, (x, r) => deadTree(x, FLOOR_TOP - 14, 60 + r() * 60, r));
    for (let i = 0; i < 9; i++) awWR(40 + i * 142 + rnd() * 30, 30, rnd, (x, r) => ringStone(x, FLOOR_TOP - 4 - r() * 4, 16 + r() * 10, 50 + r() * 36, r, r() < .2));
    for (let i = 0; i < 4; i++) awWR(100 + i * 320 + rnd() * 50, 40, rnd, (x, r) => goatBanner(x, FLOOR_TOP - 6, 64 + r() * 20, r));
    hazeBand(ctx, '200,194,180', FLOOR_TOP - 40, FLOOR_TOP, .14);
  }
  function heartFloor(rnd, th) {
    // ash and cracked clay, grey on grey, the underdrawing's lines still in it; a ring is cut into the ground round the hole
    { const g = ctx.createLinearGradient(0, FLOOR_TOP - 4, 0, VH); g.addColorStop(0, GR(.66)); g.addColorStop(.5, GR(.56)); g.addColorStop(1, GR(.36)); ctx.fillStyle = g; ctx.fillRect(0, FLOOR_TOP - 4, AW_W, VH - FLOOR_TOP + 4); }
    for (let i = 0; i < 320; i++) dab(rnd() * AW_W, FLOOR_TOP + rnd() * (VH - FLOOR_TOP), 2 + rnd() * 6, rnd() < .5 ? GR(.8, .2) : GR(.2, .18), 1);
    ctx.strokeStyle = 'rgba(20,16,12,.32)'; ctx.lineWidth = .6; ctx.beginPath();
    for (let i = 0; i < 70; i++) { let x = rnd() * AW_W, y = FLOOR_TOP + 6 + rnd() * (VH - FLOOR_TOP - 10); ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { x += 6 + rnd() * 12; y += (rnd() - .5) * 6; ctx.lineTo(x, y); } } ctx.stroke(); // the cracks of the clay
    ctx.strokeStyle = 'rgba(24,20,16,.12)'; ctx.lineWidth = .5; ctx.beginPath(); for (let i = 0; i < 400; i++) { const x = rnd() * AW_W, y = FLOOR_TOP + rnd() * (VH - FLOOR_TOP); ctx.moveTo(x, y); ctx.lineTo(x + 3, y - 3); } ctx.stroke(); // hatching
    for (let i = 0; i < 30; i++) { const x = rnd() * AW_W, y = FLOOR_TOP + 10 + rnd() * 90; ctx.fillStyle = GR(.2, .5); ell(x, y, 2 + rnd() * 3, 1); ctx.fill(); ctx.fillStyle = GR(.85, .5); ell(x - .6, y - .5, 1.4, .5); ctx.fill(); } // stones
    for (let i = 0; i < 8; i++) { const x = rnd() * AW_W, y = FLOOR_TOP + 20 + rnd() * 80; ctx.strokeStyle = GR(.9, .7); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 7, y - 1); ctx.moveTo(x + 2, y + 1.6); ctx.lineTo(x + 6, y - 2); ctx.stroke(); } // bones
    const sh = ctx.createLinearGradient(0, VH - 34, 0, VH - 6); sh.addColorStop(0, 'rgba(20,16,12,0)'); sh.addColorStop(1, 'rgba(20,16,12,.35)'); ctx.fillStyle = sh; ctx.fillRect(0, VH - 34, AW_W, 28);
  }
  // the hole the things came through: a pit in the ground at the back of the arena, fused rock round its lip
  W8.pitX = () => (typeof stage !== 'undefined' && stage ? stage.len - VW / 2 : 0);
  function drawPit(camX, t, open = 1) {
    const x = W8.pitX() - camX + 60, y = FLOOR_TOP + 16;
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
    liveSky(camX, t) { for (let i = 0; i < 26; i++) { const life = ((t * .03 + hsh(i)) % 1), x = ((hsh(i + 2) * 1280 - camX * .3 + Math.sin(t * .4 + i) * 20) % 1280 + 1280) % 1280 - 300, y = lerp(Y_OFF, FLOOR_TOP, life); if (x < 0 || x > VW) continue; ctx.fillStyle = `rgba(60,56,50,${.5 * Math.sin(life * Math.PI)})`; ctx.save(); ctx.translate(x, y); ctx.rotate(t + i); ctx.fillRect(-1.6, -.5, 3.2, 1); ctx.restore(); } }, // ash coming down
    liveFloor(camX, t) { if (stage && stage.bossRoom) { ctx.save(); ctx.globalCompositeOperation = 'source-over'; drawPit(camX, t, W8.pitOpen ?? 1); ctx.restore(); } },
  };
  AW_FAR.lorraineBoss = heartFar; AW_MID.lorraineBoss = heartMid; AW_FLOOR.lorraineBoss = heartFloor;
  Object.assign(W8.art, { GR, sketch, hatchRect, boschForm, ringStone, goatBanner, drawPit });

  // ======================================================================================================
  // THE PEOPLE OF LORRAINE: Bruegel's figures (squat, round-headed, wrapped in wool), running from the Circle (the things
  // the Circle makes of them are in the next part)
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

  Object.assign(W8.art, { limb3, knee, shoe, fist, peasantHead });

  // ======================================================================================================
  // BOSCH'S CREATURES, come out of the Circle: a crow in a funnel hat, an egg on legs
  // ======================================================================================================
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
    if (e.bare) { ctx.fillStyle = C('#F2EAD8'); ell(16, -12, 2.2, 1.6); ctx.fill(); outline(.6); if (DET()) { ctx.fillStyle = '#5A7A9A'; circle(16.8, -12, 1); ctx.fill(); ctx.fillStyle = '#0A0806'; circle(16.9, -12, .5); ctx.fill(); } } // a man's eye, under the iron
    else bead(16, -12, 1.1);
    if (W8.armor.armed(e)) { ctx.save(); ctx.translate(14, -10); W8.armor.crowMask(); ctx.restore(); }
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
    const egg = PB([0, -24, 11, -20, 15, -4, 12, 12, 0, 17, -12, 12, -15, -4, -11, -20]), hatched = e.bare;
    const RIM = [-16, -4, -11, -8, -7, -3, -3, -9, 1, -4, 5, -9, 9, -4, 13, -8, 17, -3];
    if (hatched) { ctx.fillStyle = C('#2A2018'); ell(0, -5, 13, 3.4); ctx.fill(); // what came out of it: a plucked thing with the old man's face, and no use for its wings
      if (!roll) { const fl = Math.sin(t * (ph ? 16 : 7)) * .5;
        for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 7, -15); ctx.rotate(s * (.6 + fl)); cel(PB([0, 0, s * 4, -3, s * 7, 1, s * 3, 3]), '#E0A08A', { d: .6, r: .3, w: 1 }); ctx.restore(); }
        cel(PE(1, -12, 8, 8.6), '#E8AC94', { d: 1.6, r: .7, w: 1.3, dark: '#B47A66', lite: '#FFD8C4', tex: () => { ctx.fillStyle = 'rgba(160,80,60,.4)'; for (let i = 0; i < 12; i++) { circle(-5 + hsh(i + 51) * 12, -18 + hsh(i + 53) * 12, .5); ctx.fill(); } } });
        strip(2, -18, 4, -24, 3 + fl, -28, 4.6, 3.6, '#E8AC94', { d: .6, r: .3, w: 1.1 });
        cel(PE(4 + fl, -32, 5, 4.4), '#D8A88A', { d: .9, r: .4, w: 1.1 }); fillPoly([8 + fl, -32, 11.4 + fl, -30.6, 8 + fl, -29.6], '#E8B040', .8);
        if (DET()) { bead(6 + fl, -33.4, .7); bead(3.4 + fl, -33.6, .6); ctx.fillStyle = C('#E8E2D6'); for (let i = 0; i < 3; i++) { circle(1.6 + i * 1.6 + fl, -36 - i * .3, .9); ctx.fill(); } } }
      ctx.save(); ctx.beginPath(); ctx.moveTo(-30, 30); ctx.lineTo(-30, RIM[1]); for (let i = 0; i < RIM.length; i += 2) ctx.lineTo(RIM[i], RIM[i + 1]); ctx.lineTo(30, RIM[RIM.length - 1]); ctx.lineTo(30, 30); ctx.closePath(); ctx.clip(); }
    cel(egg, '#ECE4D2', { d: 3, r: 1.2, w: 1.6, dark: '#B4A890', lite: '#FFFDF6', tex: () => {
      for (let i = 0; i < 8; i++) { ctx.fillStyle = 'rgba(160,140,110,.35)'; circle(-8 + hsh(i) * 16, -16 + hsh(i + 2) * 28, .6 + hsh(i + 5)); ctx.fill(); } // speckles
      if (crack) { ctx.strokeStyle = 'rgba(40,30,20,.85)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-6, 4); ctx.lineTo(-2, -2); ctx.lineTo(4, 6); ctx.lineTo(12, 2); ctx.stroke(); }
    } });
    if (hatched) { ctx.restore(); ctx.strokeStyle = C(OUT); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(RIM[0], RIM[1]); for (let i = 2; i < RIM.length; i += 2) ctx.lineTo(RIM[i], RIM[i + 1]); ctx.stroke(); }
    // the broken top, and the face looking out of the hole
    else if (!W8.armor.armed(e)) { ctx.fillStyle = C('#2A2018'); ell(2, -19, 8, 3.4); ctx.fill(); }
    if (W8.armor.armed(e)) { ctx.save(); ctx.translate(1, -20.5); W8.armor.eggLid(); ctx.restore(); ctx.save(); ctx.translate(0, -3); W8.armor.eggHoop(); ctx.restore(); }
    else if (hatched) {}
    else if (!roll) { cel(PE(3, -21, 5, 4.4), '#D8A88A', { d: .9, r: .4, w: 1.1 }); if (DET()) { bead(5, -22.4, .7); bead(2.4, -22.6, .6); ctx.strokeStyle = C('#5A2A1E'); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(2.6, -19.4); ctx.lineTo(5.6, -19.6); ctx.stroke(); ctx.fillStyle = C('#E8E2D6'); for (let i = 0; i < 3; i++) { circle(.6 + i * 1.6, -25 - i * .3, .9); ctx.fill(); } } } // wisps of white hair
    if (!hatched && !W8.armor.armed(e)) { ctx.strokeStyle = C(OUT); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-6, -18); for (let i = 0; i <= 6; i++) ctx.lineTo(-6 + i * 2.4, -20 + (i % 2 ? -2.6 : 0)); ctx.stroke(); } // the jagged rim of the shell
    ctx.restore();
    leg(true);
    ctx.restore();
  };

  // ======================================================================================================
  // THE HORRORS OF THE CIRCLE, out of the right wing of Bosch's Garden and his Temptation of St Anthony. Only two of
  // them were ever people, and the Circle has not left them much of it:
  //   THE HOLLOWED      a villager the Circle has had: the body is a split, hollow tree, faces in the bark, roots for feet
  //   THE PROCESSION    a penitents' procession grown together under one shroud: many legs, three hooded heads, scourges
  // and the rest never were:
  //   KNIFE-EARS        two great ears pierced by an arrow, a butcher's blade between them, scuttling on insect legs
  //   THE CRAWLING MOUTH a mouth as big as a calf on ten long fingers; it spits its own teeth
  //   THE HURDY-GURDY   an instrument the size of a cart on ox legs; its drone is a wall; its case turns blows
  //   THE PLOUGH        (the Edge's last fight) an ox with a man's weeping face, a plough grown out of its back, the yoke
  //                     and its chain still on it
  // ======================================================================================================

  const bark = '#5E5248', barkDk = '#2E2620', barkLt = '#9A8C7A', flesh = '#D8B49A', fleshDk = '#9A6A5A', fleshLt = '#F2D8C4', gum = '#8A3A3A';
  // a face pressed out of bark or flesh: two holes, a howling mouth (the souls in Bosch's trees)
  function howl(x, y, s, col, open = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = C(shade(col, .2)); ctx.beginPath(); ctx.ellipse(0, 0, 4.6, 6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = C('#140C08'); ctx.beginPath(); ctx.ellipse(-1.8, -1.6, 1, 1.4, -.2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(1.8, -1.6, 1, 1.4, .2, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 2.6, 1.4, 1.2 + open * 1.4, 0, 0, TAU); ctx.fill();
    if (DET()) { ctx.strokeStyle = 'rgba(20,12,8,.45)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.ellipse(0, 0, 4.6, 6, 0, 0, TAU); ctx.stroke(); }
    ctx.restore();
  }
  // a twig-fingered branch: tapered, crooked, with three claws at the end
  function branch(x0, y0, x1, y1, w0, col) {
    const mx = (x0 + x1) / 2 + (y1 - y0) * .15, my = (y0 + y1) / 2 - (x1 - x0) * .15;
    horn(x0, y0, mx, my, x1, y1, w0, 1.4, col, 1.1, barkDk);
    const a = Math.atan2(y1 - y0, x1 - x0);
    for (const d of [-.6, 0, .6]) horn(x1, y1, x1 + Math.cos(a + d) * 4, y1 + Math.sin(a + d) * 4, x1 + Math.cos(a + d * 1.4) * 8, y1 + Math.sin(a + d * 1.4) * 8 + 1, 1.4, .2, col, .8, barkDk);
  }
  // ---------------- THE HOLLOWED ----------------
  CREATURES.w8hollow = function (e, a) {
    a = a || {}; const t = a.t || 0, st = e.state, ph = a.walk || 0, wind = a.wind || 0, k = e.w8k || 0;
    const wF = st === 'wind' && e.plan === 'w8flail', fl = st === 'w8act' && e.w8a === 'flail', wG = st === 'wind' && e.plan === 'w8grab', gr = st === 'w8act' && e.w8a === 'grab';
    const creak = Math.sin(t * 2 + (e.walk || 0)) * .03, lean = wF ? -.18 * wind : fl ? lerp(-.18, .3, sm(k * 1.8)) : gr ? .32 : wG ? .2 * wind : .1 + creak;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // roots for feet: it drags itself; in the grab they shoot out along the ground at you
    const sw = Math.sin(ph * .7) * 5, reach = gr ? 60 * Math.sin(Math.min(1, k * 1.4) * Math.PI) : wG ? -6 * wind : 0;
    for (const [dx, len, ph2] of [[-8, 16, 0], [-2, 22, 1.4], [5, 18, 2.6], [10, 14, 4]]) { const x1 = dx + len * (dx > 0 ? 1 : -.6) + (dx > 0 ? reach : 0) + Math.sin(ph + ph2) * 2 * (ph ? 1 : 0);
      horn(dx * .5, -8, (dx + x1) / 2, -1, x1, 0, 5, .8, barkDk, 1, '#1A140E'); }
    ctx.save(); ctx.translate(0, -8); ctx.rotate(lean); ctx.translate(0, 8);
    // the trunk: split open, hollow; inside, in the dark, someone is still looking out
    const trunk = PB([-10, -8, -12, -30, -10, -50, -4, -62, 6, -63, 12, -50, 13, -28, 10, -8]);
    cel(trunk, bark, { d: 3.4, r: 1.2, w: 1.7, dark: barkDk, lite: barkLt, tex: () => {
      ctx.strokeStyle = 'rgba(20,14,10,.55)'; ctx.lineWidth = .8; ctx.beginPath(); for (let i = 0; i < 7; i++) { const x = -9 + i * 3.2; ctx.moveTo(x, -8); ctx.bezierCurveTo(x + 2, -24, x - 2, -40, x + 1, -60); } ctx.stroke(); // the grain of the bark
      howl(-5, -22, .8, bark, 1); howl(7, -40, .6, bark, .6); // faces grown into the bark
    } });
    ctx.fillStyle = C('#0C0806'); ctx.beginPath(); ctx.moveTo(-1, -54); ctx.bezierCurveTo(6, -46, 6, -30, 2, -18); ctx.bezierCurveTo(-3, -28, -4, -44, -1, -54); ctx.fill(); // the hollow
    if (e.bare) { // the plate came off and the trunk split wider: the one it took is still in there, and wants out
      ctx.fillStyle = C('#0C0806'); ctx.beginPath(); ctx.moveTo(-2, -58); ctx.bezierCurveTo(9, -48, 9, -26, 3, -14); ctx.bezierCurveTo(-6, -26, -7, -46, -2, -58); ctx.fill(); outline(1);
      cel(PE(1.6, -40, 3.4, 4.4), '#CFC2AE', { d: 1, r: .5, w: 1, dark: '#8A7E6C' });
      if (DET()) { ctx.fillStyle = '#140C08'; circle(.6, -41, .7); ctx.fill(); circle(3, -41, .7); ctx.fill(); ell(1.8, -37.6, .9, 1.3 + Math.abs(Math.sin(t * 3)) * .6); ctx.fill(); }
      const rch = Math.sin(t * 2.2 + (e.slot || 0)) * 2; strip(2, -32, 6, -30, 10 + rch, -26, 2.6, 2, '#C8BAA4', { d: .8, r: .4, w: 1 });
      for (const d of [-.5, 0, .5]) horn(10 + rch, -26, 11.6 + rch, -26 + d * 2, 13 + rch, -25 + d * 3, 1.2, .3, '#C8BAA4', .7); } // (its fingers, through the split)
    else if (DET()) { ctx.fillStyle = 'rgba(232,222,200,.9)'; circle(1.4, -38, .9); ctx.fill(); circle(3.6, -37.6, .8); ctx.fill(); }
    if (W8.armor.armed(e)) { ctx.save(); ctx.translate(1, -33); ctx.rotate(-.04); W8.armor.breastplate(); ctx.restore(); } // an elite wears what it took off a man-at-arms
    // the head: a broken-off stump with a villager's face half grown over, its mouth stretched in a knot-hole
    const hx = 3, hy = -68;
    cel(PB([hx - 7, hy + 6, hx - 8, hy - 3, hx - 3, hy - 9, hx + 5, hy - 8, hx + 8, hy - 1, hx + 6, hy + 7]), '#7A6C5E', { d: 1.4, r: .8, w: 1.4, dark: barkDk });
    howl(hx + 2, hy, 1.1, '#8A7A68', wF || fl ? 1.4 : .9);
    if (W8.armor.armed(e)) { ctx.save(); ctx.translate(hx, hy - 6); ctx.rotate(-.12); W8.armor.kettleHat(); ctx.restore(); }
    else for (const [x1, y1] of e.bare ? [[hx - 10, hy - 20], [hx - 3, hy - 24], [hx + 3, hy - 22], [hx + 10, hy - 17]] : [[hx - 6, hy - 14], [hx + 1, hy - 16], [hx + 7, hy - 12]]) horn(hx - 1, hy - 7, (hx + x1) / 2, y1 + 2, x1, y1, 2, .3, barkDk, .9); // splinters for hair (grown to thorns, the helm knocked off)
    // the arms: two branches; the near one is a club of knotted wood
    branch(-6, -50, -18 + Math.sin(t) * 1.5, -34, 4, bark);
    let ang = .9 + Math.sin(t * 1.2) * .06; if (wF) ang = lerp(.9, -2.4, sm(wind)); if (fl) ang = lerp(-2.4, .8, sm(k * 1.7)); if (gr || wG) ang = .1;
    const sx = 8, sy = -50, L = 34, ex = sx + Math.cos(ang) * L, ey = sy + Math.sin(ang) * L;
    branch(sx, sy, ex, ey, 6.4, '#6A5C4E');
    cel(PE(sx + Math.cos(ang) * L * .7, sy + Math.sin(ang) * L * .7, 5, 4, ang), '#5A4C40', { d: 1, r: .5, w: 1.1 }); // a burl
    if (DET() && fl && k > .25 && k < .6) add(() => { ctx.strokeStyle = 'rgba(232,222,200,.18)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(sx, sy, L, ang - 1, ang); ctx.stroke(); });
    ctx.restore(); ctx.restore();
  };
  // ---------------- THE PROCESSION ----------------
  CREATURES.w8flag = function (e, a) {
    a = a || {}; const t = a.t || 0, st = e.state, ph = a.walk || 0, wind = a.wind || 0, k = e.w8k || 0;
    const wL = st === 'wind' && e.plan === 'w8lash', la = st === 'w8act' && e.w8a === 'lash', wF = st === 'wind' && e.plan === 'w8frenzy', fr = st === 'w8act' && e.w8a === 'frenzy';
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // eight bare legs under the hem, none of them in step with any other
    for (let i = 0; i < 8; i++) { const x = -26 + i * 7.4, s = Math.sin(ph * 1.1 + i * 2.3) * (ph ? 4 : 1.2), near = i % 2;
      limb3(x, -22, x + s * .4 + 1, -11, x + s, -1, 3.2, 2.6, 2.2, near ? '#C8A88A' : '#9A7A64'); cel(PE(x + s + 1.2, -1, 2.6, 1.1), near ? '#8A6A50' : '#6A4E3A', { d: .4, r: .3, w: .9 }); }
    // the shroud, one long dirty sheet over all of them, lumped where shoulders press up under it
    const bob = (i) => Math.sin(t * 2.4 + i * 1.7) * 1.4;
    const sh = PB([-32, -20, -30, -38 + bob(0), -18, -46 + bob(1), -6, -42 + bob(2), 6, -48 + bob(3), 18, -44 + bob(4), 30, -40, 32, -20, 0, -17]);
    cel(sh, '#D8D0BC', { d: 3, r: 1, w: 1.6, dark: '#8E8676', lite: '#F4EEDE', tex: () => {
      ctx.strokeStyle = 'rgba(60,50,40,.35)'; ctx.lineWidth = .8; ctx.beginPath(); for (let i = 0; i < 9; i++) { const x = -28 + i * 7; ctx.moveTo(x, -40); ctx.quadraticCurveTo(x + 2, -30, x - 1, -20); } ctx.stroke();
      ctx.fillStyle = 'rgba(120,40,30,.4)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(-20 + i * 10, -30 + (i % 2) * 6, 2.4, 3.6, .3, 0, TAU); ctx.fill(); } // where the blood came through
      ctx.fillStyle = C('#3A3028'); for (const x of [-22, 4]) { ctx.beginPath(); ctx.ellipse(x, -34, 1.4, 2.6, 0, 0, TAU); ctx.fill(); } // holes torn for arms
    } });
    ctx.fillStyle = 'rgba(200,190,170,.85)'; ctx.beginPath(); ctx.moveTo(-32, -21); for (let x = -32; x <= 32; x += 4) ctx.lineTo(x, -18 + (x % 8 ? 2 : -1)); ctx.lineTo(32, -21); ctx.closePath(); ctx.fill(); // the ragged hem
    if (e.bare) { // the chain held the sheet shut: it has torn open, and under it they are one body, backs and ribs and another face
      const rip = PB([-14, -40, -4, -44 + bob(2), 8, -42, 14, -30, 6, -22, -8, -22, -16, -30]);
      cel(rip, '#B8706A', { d: 2.4, r: .8, w: 1.4, dark: '#6A2A2A', lite: '#E8A89A', tex: () => {
        ctx.strokeStyle = 'rgba(80,20,20,.55)'; ctx.lineWidth = .8; ctx.beginPath(); for (let i = 0; i < 4; i++) { ctx.moveTo(-12 + i * 6, -38); ctx.quadraticCurveTo(-10 + i * 6, -30, -12 + i * 6, -23); } ctx.stroke(); // the backs, grown together
        ctx.fillStyle = 'rgba(240,210,190,.7)'; for (let i = 0; i < 5; i++) { ell(-2 + i * .4, -39 + i * 3.6, 1.4, .9); ctx.fill(); } } }); // a spine
      howl(7, -31, .75, '#C88A80', 1 + Math.abs(Math.sin(t * 3)) * .6);
      ctx.strokeStyle = C('#D8D0BC'); ctx.lineWidth = 1.2; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a2 = i / 6 * TAU, x = Math.cos(a2) * 15, y = -32 + Math.sin(a2) * 10; ctx.moveTo(x, y); ctx.lineTo(x * 1.15, y + Math.sin(a2) * 2); } ctx.stroke(); } // the torn edges
    if (W8.armor.armed(e)) W8.armor.chainLinks(-31, -36, 0, -18, 31, -34, 13);
    // three hooded heads on long necks, pushing up out of the front of the sheet, one turned the wrong way round
    const heads = [[14, -62, 0], [24, -54, 1], [4, -70, 2]];
    for (const [hx, hy, i] of heads) { const sway = Math.sin(t * 1.6 + i * 2) * 2 + (wL || wF ? wind * 3 : 0);
      ctx.strokeStyle = C(OUT); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(hx - 6, -44); ctx.quadraticCurveTo(hx - 4 + sway, (hy - 44) / 2 - 22, hx + sway, hy + 6); ctx.stroke(); ctx.strokeStyle = C('#D0C8B4'); ctx.lineWidth = 4; ctx.stroke();
      cel(PB([hx - 5 + sway, hy + 6, hx - 5 + sway, hy - 4, hx + sway, hy - 13, hx + 5 + sway, hy - 4, hx + 5 + sway, hy + 6]), i === 2 ? '#6A6256' : '#E2DAC6', { d: 1.2, r: .6, w: 1.3, dark: '#9A9280' });
      if (W8.armor.armed(e)) { ctx.save(); ctx.translate(hx + sway, hy - 6); W8.armor.potHelm(.95); ctx.restore(); }
      if (DET()) { ctx.fillStyle = C('#120C08'); if (i !== 2) { ctx.beginPath(); ctx.ellipse(hx + 1.6 + sway, hy - 1, .9, 1.4, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(hx + 3.8 + sway, hy - 1, .8, 1.3, 0, 0, TAU); ctx.fill(); } else { ctx.strokeStyle = 'rgba(20,12,8,.6)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(hx - 3 + sway, hy - 3); ctx.lineTo(hx + 3 + sway, hy + 3); ctx.stroke(); } } }
    // the scourges: arms come out of the holes in the sheet; each has a scourge
    const arms = [[-22, -34, 0], [4, -34, 1], [20, -36, 2], [-10, -40, 3]];
    for (const [ax, ay, i] of arms) {
      let ang = -1.8 + Math.sin(t * 3 + i) * .4, cord = 12;
      if (wL) ang = lerp(-1.8, -2.7, wind); if (la) { const u = (k * 3 + i * .25) % 1; ang = lerp(-2.6, .4, sm(u * 1.7)); cord = 14 + Math.sin(u * Math.PI) * 22; }
      if (wF) ang = -1.8 + wind * 4 + i; if (fr) { ang = k * TAU * 3 + i * 1.6; cord = 28; }
      const hx = ax + Math.cos(ang) * 12, hy = ay + Math.sin(ang) * 12;
      limb3(ax, ay, (ax + hx) / 2, (ay + hy) / 2 + 1, hx, hy, 2.8, 2.4, 2, '#C8A088');
      for (let c = 0; c < 3; c++) { const ca = ang + (c - 1) * .18 + (la || fr ? 0 : .9), ex = hx + Math.cos(ca) * cord, ey = hy + Math.sin(ca) * cord + (la || fr ? 0 : 5);
        ctx.strokeStyle = C('#3A2A1A'); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo((hx + ex) / 2, (hy + ey) / 2 + 2, ex, ey); ctx.stroke(); ctx.fillStyle = C('#2A1A10'); circle(ex, ey, 1); ctx.fill(); } }
    if (DET() && (la || fr)) add(() => { ctx.strokeStyle = 'rgba(255,230,210,.16)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, -36, 34, -.9, .4); ctx.stroke(); });
    ctx.restore();
  };
  // ---------------- KNIFE-EARS ----------------
  CREATURES.w8halberd = function (e, a) {
    a = a || {}; const t = a.t || 0, st = e.state, ph = a.walk || 0, wind = a.wind || 0, k = e.w8k || 0;
    const wT = st === 'wind' && e.plan === 'w8thrust', th = st === 'w8act' && e.w8a === 'thrust', wH = st === 'wind' && e.plan === 'w8hook', hk = st === 'w8act' && e.w8a === 'hook';
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // six legs like a beetle's, black and jointed, scuttling
    const lift = ph ? 1 : .2;
    for (let i = 0; i < 6; i++) { const x = -14 + (i % 3) * 13, s = Math.sin(ph * 1.6 + i * 2.1) * 4 * lift, far = i < 3;
      ctx.strokeStyle = C(OUT); ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(x, -20); ctx.lineTo(x - 6 + s, -12); ctx.lineTo(x - 3 + s * 1.4, 0); ctx.stroke(); ctx.strokeStyle = C(far ? '#1E1814' : '#3A302A'); ctx.lineWidth = 2; ctx.stroke(); }
    // the blade: a butcher's knife driven between the ears, its edge down; it is what the thing has for a mouth
    let push = 0; if (wT) push = -10 * wind; if (th) push = k < .3 ? lerp(-10, 34, sm(k / .3)) : lerp(34, 0, sm((k - .3) / .7));
    let tilt = 0; if (wH) tilt = -.2 * wind; if (hk) tilt = k < .4 ? -.2 : lerp(-.2, .15, (k - .4) / .6);
    ctx.save(); ctx.translate(push * .4, 0); ctx.rotate(tilt);
    ctx.save(); ctx.translate(10 + push * .6, -38);
    cel(PP([-6, -3, 40, -4, 52, 2, 40, 5, -6, 4]), '#B4B8BC', { d: 1.2, r: .8, w: 1.4, lite: '#F2F4F6', dark: '#6A6E72', tex: () => { ctx.fillStyle = 'rgba(120,30,20,.55)'; ctx.fillRect(20, 1, 18, 3); } });
    cel(PP([-16, -2.6, -6, -3, -6, 4, -16, 3.4]), '#3A2A1C', { d: .5, r: .3, w: 1.1 }); // the handle, out of the back
    ctx.restore();
    // the two ears: pale, veined, enormous, standing up either side of the blade; an arrow through both
    const flap = hk ? Math.sin(Math.min(1, k * 2) * Math.PI) * .35 : wH ? wind * .3 : Math.sin(t * 1.5) * .04;
    for (const side of [-1, 1]) { ctx.save(); ctx.translate(2 + side * 6, -30); ctx.rotate(side * (.18 + flap));
      const ear = PB([0, 0, -10 * side, -8, -14 * side, -26, -8 * side, -42, 2 * side, -44, 8 * side, -32, 6 * side, -14]);
      cel(ear, side < 0 ? '#C89A86' : flesh, { d: 3, r: 1.2, w: 1.6, dark: fleshDk, lite: fleshLt, tex: () => {
        ctx.fillStyle = 'rgba(140,60,60,.45)'; ctx.beginPath(); ctx.moveTo(-4 * side, -10); ctx.bezierCurveTo(-9 * side, -20, -7 * side, -34, -1 * side, -38); ctx.bezierCurveTo(-4 * side, -30, -5 * side, -18, -1 * side, -10); ctx.fill(); // the inner whorl
        ctx.strokeStyle = e.bare ? 'rgba(190,40,50,.7)' : 'rgba(150,40,50,.5)'; ctx.lineWidth = e.bare ? .75 : .5; ctx.beginPath(); for (let i = 0; i < 4; i++) { ctx.moveTo(-2 * side, -4 - i * 8); ctx.quadraticCurveTo(-8 * side, -8 - i * 8, -11 * side, -14 - i * 7); } ctx.stroke(); // veins (swollen and red, once the iron is off them)
      } });
      if (W8.armor.armed(e)) { ctx.save(); ctx.translate(-5 * side, -32); W8.armor.earPlate(side); ctx.restore(); }
      ctx.restore(); }
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-22, -54); ctx.lineTo(26, -50); ctx.stroke(); ctx.strokeStyle = C('#6A4A2A'); ctx.lineWidth = 1.4; ctx.stroke(); // the arrow through them
    W8.kit.fillPoly([26, -53, 32, -50, 26, -47], '#8A8E92', 1); W8.kit.fillPoly([-22, -54, -28, -58, -26, -52], '#E8DCC4', .8); W8.kit.fillPoly([-22, -54, -28, -50, -26, -55], '#C8BCA4', .8);
    // where they join: a lump of flesh with a single small eye in it, watching you
    cel(PE(2, -24, 12, 8), fleshDk, { d: 1.6, r: .8, w: 1.4, lite: flesh });
    if (e.bare) for (const [ex, ey, er] of [[8, -25, 1], [2, -28, .7], [-4, -24, .6], [3, -21, .55], [10, -21, .5]]) { ctx.fillStyle = C('#F2EAD8'); ctx.beginPath(); ctx.ellipse(ex, ey, 2.6 * er, 1.8 * er, 0, 0, TAU); ctx.fill(); outline(.6); if (DET()) { ctx.fillStyle = '#1A120C'; circle(ex + .9 * er + Math.sin(t * 2 + ex) * .4 * er, ey, 1.1 * er); ctx.fill(); } } // the visor off, its other eyes open
    else if (DET()) { ctx.fillStyle = C('#F2EAD8'); ctx.beginPath(); ctx.ellipse(8, -25, 2.6, 1.8, 0, 0, TAU); ctx.fill(); ctx.fillStyle = C('#1A120C'); circle(9, -25, 1.1); ctx.fill(); }
    if (W8.armor.armed(e)) { ctx.save(); ctx.translate(3, -25); W8.armor.eyeVisor(); ctx.restore(); }
    if (DET() && th && k < .35) add(() => { ctx.fillStyle = 'rgba(240,244,246,.3)'; ctx.fillRect(-30, -40, 60, 3); });
    ctx.restore(); ctx.restore();
  };
  // ---------------- THE CRAWLING MOUTH ----------------
  CREATURES.w8xbow = function (e, a) {
    a = a || {}; const t = a.t || 0, st = e.state, ph = a.walk || 0, wind = a.wind || 0, k = e.w8k || 0;
    const aim = st === 'wind' && e.plan === 'w8bolt', spit = st === 'w8act' && e.w8a === 'bolt', chew = st === 'w8act' && e.w8a === 'crank';
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const body = -30 + Math.sin(t * 2) * .8, open = aim ? .3 + wind * .7 : spit ? 1 - sm(k) * .6 : chew ? .25 + .25 * Math.sin(t * 18) : .12 + .06 * Math.sin(t * 2.6);
    // ten fingers for legs, long and knuckled, nails cracked; they pick their way over the ground
    // (each finger: up from the lip to a high knuckle, a second knuckle, and down to the nail on the ground, like a spider's leg)
    const finger = (bx, side, i, near) => { const s = Math.sin(ph * 1.5 + i * 1.9) * (ph ? 5 : .6), fx = bx + side * (18 + i * 9) + s, kx = bx + side * (8 + i * 5), ky = body - 16 - (i % 2) * 5, jx = (kx + fx) / 2 + side * 3, jy = body - 6;
      const col = near ? '#E2BEA4' : '#A88472'; strip(bx, body, (bx + kx) / 2, ky - 2, kx, ky, 3.6, 3, col, { d: 1, r: .5, w: 1.2 }); strip(kx, ky, (kx + jx) / 2 + side * 2, ky, jx, jy, 3, 2.6, col, { d: 1, r: .5, w: 1.2 }); strip(jx, jy, (jx + fx) / 2, jy + 2, fx, -1, 2.6, 2, col, { d: 1, r: .5, w: 1.1 });
      if (DET()) { ctx.strokeStyle = 'rgba(90,50,40,.6)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(kx - 1.4, ky + 1); ctx.lineTo(kx + 1.4, ky + 1); ctx.moveTo(jx - 1.2, jy); ctx.lineTo(jx + 1.2, jy); ctx.stroke(); } // the knuckle creases
      cel(PE(fx + side * .8, -1.4, 2, 1.3), '#F2E6D2', { d: .3, r: .2, w: .8 }); };
    for (let i = 0; i < 4; i++) { finger(-10 + i * 2, -1, i, false); finger(16 - i * 2, 1, i, false); }
    // the lips: swollen, wet, the colour of a bruise at their edges; inside, the teeth and a tongue
    ctx.save(); ctx.translate(4, body);
    const ow = 22, oh = 4 + open * 12;
    cel(PB([-ow, 0, -ow * .6, -oh - 6, 0, -oh - 8, ow * .6, -oh - 6, ow + 4, 0, ow * .6, oh + 6, 0, oh + 8, -ow * .6, oh + 6]), '#C86A6A', { d: 2.4, r: 1, w: 1.6, dark: '#7A2A30', lite: '#F2A8A0' });
    ctx.fillStyle = C('#2A0806'); ctx.beginPath(); ctx.ellipse(1, 0, ow * .78, oh, 0, 0, TAU); ctx.fill();
    if (oh > 5) { ctx.fillStyle = C('#B84A50'); ctx.beginPath(); ctx.ellipse(2, oh * .45, ow * .5, oh * .4, 0, 0, TAU); ctx.fill(); }
    const teeth = chew ? 8 + Math.floor(k * 6) : spit && k < .3 ? 11 : 14; // it spits one of its own; then it grows them back
    for (let i = 0; i < 14; i++) { if (i >= teeth && i % 2) continue; const u = (i % 7) / 6, x = lerp(-ow * .7, ow * .74, u), top = i < 7, y = top ? -oh + .6 : oh - .6;
      ctx.fillStyle = C(i % 3 ? '#F0E6D0' : '#D8C8A0'); ctx.beginPath(); ctx.moveTo(x - 1.8, y); ctx.lineTo(x + 1.8, y); ctx.lineTo(x + .6, y + (top ? 3 : -3)); ctx.lineTo(x - .6, y + (top ? 3 : -3)); ctx.closePath(); ctx.fill(); if (DET()) { ctx.strokeStyle = 'rgba(60,30,20,.6)'; ctx.lineWidth = .4; ctx.stroke(); } }
    if (DET()) { ctx.strokeStyle = 'rgba(255,230,220,.6)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-ow * .6, -oh - 5); ctx.quadraticCurveTo(0, -oh - 8, ow * .5, -oh - 5); ctx.stroke(); } // the shine on the upper lip
    if (e.bare) { // the bridle off: a second row of teeth behind the first, and the tongue let out at last
      for (let i = 0; i < 6; i++) { const x = lerp(-ow * .45, ow * .5, i / 5), y = -oh * .45; ctx.fillStyle = C('#E2D4B4'); ctx.beginPath(); ctx.moveTo(x - 1.4, y - 1); ctx.lineTo(x + 1.4, y - 1); ctx.lineTo(x, y + 2.4); ctx.closePath(); ctx.fill(); }
      const lw = Math.sin(t * 4 + (e.slot || 0)) * 2.4;
      cel(PB([-7, oh * .2, 7, oh * .1, 12, oh + 5 + lw * .4, 12, oh + 15 + lw, 6, oh + 19 + lw, 1, oh + 13 + lw, -3, oh + 5]), '#C84A58', { d: 1.6, r: .7, w: 1.3, dark: '#7A2030', lite: '#F08A90', tex: () => { ctx.strokeStyle = 'rgba(90,20,30,.6)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(2, oh * .3); ctx.quadraticCurveTo(8, oh + 6, 7, oh + 15 + lw); ctx.stroke(); } }); }
    if (W8.armor.armed(e)) { W8.armor.bridleBand(ow, oh); ctx.save(); ctx.translate(ow + 7, 1); W8.armor.padlock(); ctx.restore(); }
    ctx.restore();
    finger(-6, -1, 1.5, true); finger(14, 1, 2.5, true);
    if (aim && DET()) { ctx.fillStyle = 'rgba(200,190,170,.7)'; for (let i = 0; i < 3; i++) { circle(28 + i * 3, body + Math.sin(t * 9 + i) * 2, .9); ctx.fill(); } } // spittle
    ctx.restore();
  };
  // ---------------- THE HURDY-GURDY ----------------
  // its case: blows from in front ring off the wood (as the Bellman's bronze did: the 'w8crack' counter splits it)
  function gurdy(x, y, s, crack, drone, t, crank, open) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const jit = drone ? Math.sin(t * 70) * drone * .7 : 0; ctx.translate(jit, 0);
    const body = PB([-26, 0, -30, -16, -24, -32, -6, -38, 14, -36, 28, -26, 30, -10, 22, 0]);
    cel(body, '#7A4A26', { d: 3.4, r: 1.4, w: 1.8, dark: '#3A2010', lite: '#C8884A', tex: () => {
      ctx.strokeStyle = 'rgba(30,14,6,.5)'; ctx.lineWidth = .7; ctx.beginPath(); for (let i = 0; i < 7; i++) { ctx.moveTo(-28, -4 - i * 5); ctx.quadraticCurveTo(0, -2 - i * 5.6, 28, -6 - i * 4); } ctx.stroke(); // the staves
      ctx.fillStyle = '#1A0C06'; for (const [rx, ry] of [[-14, -18], [10, -20]]) { ctx.beginPath(); ctx.ellipse(rx, ry, 4, 2.4, .2, 0, TAU); ctx.fill(); } // its sound-holes, shaped like screaming mouths
      if (crack) { ctx.strokeStyle = 'rgba(10,4,2,.9)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(-6, -36); ctx.lineTo(-2, -24); ctx.lineTo(-8, -12); ctx.lineTo(-4, -2); if (crack > 1) { ctx.moveTo(18, -30); ctx.lineTo(14, -18); ctx.lineTo(22, -8); } ctx.stroke(); }
    } });
    if (open) { // its front stove in: the wheel inside, and the small grey thing that turns it, looking out at you
      const hole = PB([-16, -8, -19, -20, -12, -30, 2, -31, 13, -26, 15, -12, 8, -4, -6, -3]);
      hole(0, 0); ctx.fillStyle = C('#140A04'); ctx.fill();
      ctx.save(); hole(0, 0); ctx.clip();
      ctx.save(); ctx.translate(-4, -17); ctx.rotate(crank); ctx.strokeStyle = C('#8A6A44'); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); for (let i = 0; i < 6; i++) { ctx.moveTo(0, 0); ctx.lineTo(Math.cos(i / 6 * TAU) * 10, Math.sin(i / 6 * TAU) * 10); } ctx.stroke(); ctx.restore(); // the wheel
      cel(PE(7, -15, 4.4, 5.6), '#8E887E', { d: 1, r: .5, w: 1, dark: '#4A443C' }); cel(PE(7.6, -23, 3.6, 3.4), '#A8A094', { d: .8, r: .4, w: 1 }); // the grey thing
      if (DET()) { ctx.fillStyle = '#F2E8D0'; circle(9, -23.4, .8); ctx.fill(); circle(6.4, -23.6, .7); ctx.fill(); ctx.fillStyle = '#140804'; circle(9.2, -23.4, .35); ctx.fill(); circle(6.6, -23.6, .35); ctx.fill(); }
      strip(5, -16, 0, -18, -4 + Math.cos(crank) * 6, -17 + Math.sin(crank) * 6, 1.8, 1.4, '#8E887E', { d: .5, r: .3, w: .8 });
      ctx.restore();
      ctx.strokeStyle = C('#C8884A'); ctx.lineWidth = 1.2; ctx.beginPath(); for (let i = 0; i < 9; i++) { const a2 = i / 9 * TAU, x = -2 + Math.cos(a2) * 16, y = -17 + Math.sin(a2) * 13; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a2) * 3, y + Math.sin(a2) * 2.6); } ctx.stroke(); // splinters round the hole
      hole(0, 0); outline(1.2);
    }
    // the keybox along its top, the keys like teeth; something small and grey turns the wheel from inside
    cel(PP([-18, -36, 22, -34, 22, -44, -18, -46]), '#5A3418', { d: 1, r: .6, w: 1.3 });
    for (let i = 0; i < 9; i++) { const x = -15 + i * 4.2, down = drone && (Math.floor(t * 12) + i) % 3 === 0; ctx.fillStyle = C(i % 2 ? '#E8DCC0' : '#C8B898'); ctx.fillRect(x, -44 + (down ? 2 : 0), 2.6, 5); }
    goldLine(() => { ctx.moveTo(-18, -36.5); ctx.lineTo(22, -34.5); }, 1);
    // the crank handle at its tail, turning
    ctx.save(); ctx.translate(-30, -18); ctx.rotate(crank); ctx.strokeStyle = C(OUT); ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, 0); ctx.lineTo(-10, -7); ctx.stroke(); ctx.strokeStyle = C('#8A8E92'); ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    // its scroll-head, carved as a face with its tongue out (the luthier's joke, gone wrong)
    cel(PB([24, -30, 34, -38, 42, -34, 40, -24, 30, -20]), '#6A3E20', { d: 1, r: .6, w: 1.4, lite: '#B07A44' });
    if (DET()) { ctx.fillStyle = C('#140804'); circle(36, -33, 1.2); ctx.fill(); ctx.fillStyle = C(gum); ctx.beginPath(); ctx.ellipse(40, -25, 2.6, 1.4, .4, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  CREATURES.w8bell = function (e, a) {
    a = a || {}; const t = a.t || 0, st = e.state, ph = a.walk || 0, wind = a.wind || 0, k = e.w8k || 0;
    const wT = st === 'wind' && e.plan === 'w8toll', to = st === 'w8act' && e.w8a === 'toll', wD = st === 'wind' && e.plan === 'w8bdrop', dr = st === 'w8act' && e.w8a === 'bdrop', sw = st === 'strike' || (st === 'wind' && e.plan === 'swing');
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const squat = wD ? wind * 6 : dr && k < .5 ? 6 * (1 - k * 2) : 0, by = -26 + squat + Math.abs(Math.sin(ph * .6)) * 1.4;
    // four ox legs under it, hooves split, hair on the shanks
    const leg = (x, i, near) => { const s = Math.sin(ph * .6 + i * 1.6) * 5, f = [x + s, 0], kk = knee(x, by + 2, f[0], f[1] - 1, 16, i % 2 ? 1 : -1); limb3(x, by + 2, kk[0], kk[1], f[0], f[1] - 4, 7, 4.6, 3.6, near ? '#6A5444' : '#4A3A30'); W8.kit.fillPoly([f[0] - 3, 0, f[0] + 3, 0, f[0] + 2.4, -4, f[0] - 2.4, -4], '#1A140E', 1); };
    leg(-16, 0, false); leg(14, 1, false);
    const crank = t * (to || wT ? 9 : 2.4);
    gurdy(0, by, 1, e.w8crack || 0, to ? 1 - k : 0, t, crank, e.bare);
    if (W8.armor.armed(e)) { ctx.save(); ctx.translate(0, by); for (const [x, h] of [[-15, 32], [3, 38], [19, 32]]) { ctx.save(); ctx.translate(x, -19); W8.armor.hoop(h); ctx.restore(); }
      ctx.save(); ctx.translate(27, -12); W8.armor.padlock(); ctx.restore();
      ctx.save(); ctx.translate(38, -22); ctx.rotate(Math.sin(t * 3 + (to ? t * 9 : 0)) * .3); ctx.translate(0, 9); W8.armor.handBell(); ctx.restore(); ctx.restore(); } // bound in iron, and a cracked bell hung on it
    leg(-10, 2, true); leg(20, 3, true);
    if (to && DET()) for (let i = 0; i < 3; i++) { const r = 18 + ((k * 3 + i / 3) % 1) * 34; ctx.strokeStyle = `rgba(255,220,170,${.5 * (1 - (k * 3 + i / 3) % 1)})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(30, by - 20, r, -.6, .6); ctx.stroke(); }
    // a man's arm grows out of its side, holding the bow it plays itself with (swung as a club)
    let ang = .8 + Math.sin(t * 1.3) * .05; if (wT) ang = lerp(.8, -1.6, wind); if (to) ang = -1.6 + Math.sin(t * 20) * .3; if (sw) ang = st === 'strike' ? .5 : lerp(.8, -1.8, wind); if (wD || dr) ang = -1.2;
    const sx = 16, sy = by - 22, hx = sx + Math.cos(ang) * 12, hy = sy + Math.sin(ang) * 12;
    limb3(sx, sy, (sx + hx) / 2 + 2, (sy + hy) / 2 + 2, hx, hy, 4.6, 4, 3.4, '#C8A088');
    const ex = hx + Math.cos(ang - .3) * 30, ey = hy + Math.sin(ang - .3) * 30; ctx.strokeStyle = C(OUT); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(ex, ey); ctx.stroke(); ctx.strokeStyle = C('#4A3018'); ctx.lineWidth = 2.2; ctx.stroke();
    ctx.strokeStyle = C('#E8E0C8'); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(hx + 2, hy + 2); ctx.lineTo(ex + 1, ey + 2); ctx.stroke();
    W8.art.fist(hx, hy, '#C8A088', 1.1);
    ctx.restore();
  };
  // ---------------- THE PLOUGH ----------------
  CREATURES.w8hangman = function (e, a) {
    a = a || {}; const t = a.t || 0, st = e.state, ph = a.walk || 0, wind = a.wind || 0, k = e.w8k || 0;
    const wN = st === 'wind' && e.plan === 'w8noose', no = st === 'w8act' && e.w8a === 'noose', wA = st === 'wind' && e.plan === 'w8axe', ax = st === 'w8act' && e.w8a === 'axe', wS = st === 'wind' && e.plan === 'w8sweep', swp = st === 'w8act' && e.w8a === 'sweep', wG = st === 'wind' && e.plan === 'w8gallows';
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.scale(1.12, 1.12);
    const rear = wA ? sm(wind) * .22 : ax ? (k < .4 ? .22 * (1 - sm(k / .4)) : 0) : 0;
    ctx.translate(-26, 0); ctx.rotate(-rear); ctx.translate(26, 0);
    const legs = (near) => { for (const [x, i] of near ? [[-22, 0], [22, 1]] : [[-16, 2], [28, 3]]) { const s = Math.sin(ph * .8 + i * 1.7) * 6, f = [x + s, 0], kk = knee(x, -32, f[0], f[1] - 1, 19, x > 0 ? 1 : -1);
      limb3(x, -32, kk[0], kk[1], f[0], f[1] - 4, 8, 5, 3.8, near ? '#5A3E2A' : '#3E2A1C'); W8.kit.fillPoly([f[0] - 3.4, 0, f[0] + 3.4, 0, f[0] + 2.6, -5, f[0] - 2.6, -5], '#140E0A', 1); } };
    legs(false);
    // the ox: a great brown barrel of a body, ribs showing, galls where the harness rubbed
    cel(PB([-34, -54, -6, -62, 24, -60, 38, -50, 36, -32, 14, -26, -18, -26, -36, -34]), '#6A4A30', { d: 3.6, r: 1.4, w: 1.8, dark: '#3A2618', lite: '#A07A54', tex: () => {
      ctx.strokeStyle = 'rgba(30,18,10,.5)'; ctx.lineWidth = .9; ctx.beginPath(); for (let i = 0; i < 6; i++) { const x = -12 + i * 6; ctx.moveTo(x, -56); ctx.quadraticCurveTo(x + 3, -44, x, -32); } ctx.stroke();
      ctx.fillStyle = 'rgba(140,40,30,.55)'; for (const [x, y] of [[20, -56], [-20, -52], [6, -36]]) { ctx.beginPath(); ctx.ellipse(x, y, 4, 2.4, .3, 0, TAU); ctx.fill(); }
    } });
    // the plough, grown up out of its back where the hide has closed round the wood: the beam, the stilts, the share
    let pa = -.5 + Math.sin(t * .8) * .03; if (wA) pa = lerp(-.5, -1.5, sm(wind)); if (ax) pa = k < .45 ? lerp(-1.5, .7, sm(k / .45)) : .7; if (wS) pa = lerp(-.5, -1.2, wind); if (swp) pa = -.5 + Math.sin(k * Math.PI) * .5; if (wG) pa = .3;
    ctx.save(); ctx.translate(-14, -60); ctx.rotate(pa);
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(56, -4); ctx.stroke(); ctx.strokeStyle = C('#7A5A34'); ctx.lineWidth = 5; ctx.stroke();
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-10, -22); ctx.moveTo(14, -1); ctx.lineTo(0, -24); ctx.stroke(); ctx.strokeStyle = C('#8A6A44'); ctx.lineWidth = 2.4; ctx.stroke(); // the stilts, like arms raised
    cel(PP([50, -6, 66, -2, 74, 10, 58, 8]), '#8E9296', { d: 1, r: .7, w: 1.4, lite: '#E2E6E8', dark: '#4E5256', tex: () => { ctx.fillStyle = 'rgba(120,40,20,.5)'; ctx.fillRect(58, 2, 12, 4); } }); // the share, rusted red
    ctx.restore();
    // the hide grows up round the root of the beam
    cel(PB([-22, -60, -16, -70, -6, -66, -8, -58]), '#6A4A30', { d: 1, r: .5, w: 1.2 });
    // the yoke on its neck, the chain hanging off it (thrown out at you in the noose)
    cel(PP([26, -66, 34, -70, 50, -60, 46, -56]), '#5A3A1E', { d: .8, r: .5, w: 1.3 });
    if (!no) { ctx.strokeStyle = C('#5A5650'); ctx.lineWidth = 1.6; ctx.setLineDash([2.4, 1.6]); ctx.beginPath(); ctx.moveTo(44, -58); ctx.quadraticCurveTo(46 + (wN ? Math.cos(t * 12) * 12 : 0), -38 + (wN ? Math.sin(t * 12) * 6 : 0), 40, -28); ctx.stroke(); ctx.setLineDash([]); }
    // the head: an ox's skull and horns, and on the front of it a man's face, weeping, as if he were looking out of it
    ctx.save(); ctx.translate(46, -58); ctx.rotate(wA || ax ? .3 : wS || swp ? -.2 : .1);
    cel(PB([-4, -6, 10, -10, 20, -2, 18, 10, 6, 12, -4, 6]), '#5A3E28', { d: 1.6, r: .8, w: 1.5, lite: '#8A6A48' });
    horn(2, -8, -4, -20, -14, -22, 4, .6, '#D8CCB0', 1.1); horn(10, -9, 18, -20, 26, -18, 4, .6, '#E8DCC4', 1.1);
    cel(PE(12, 2, 7, 8), '#D4AC8E', { d: 1.2, r: .6, w: 1.2, dark: '#9A7058', lite: '#F2D2BC' }); // the face
    if (DET()) { ctx.fillStyle = C('#1A100A'); ctx.beginPath(); ctx.ellipse(10, 0, 1, 1.4, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(15, 0, 1, 1.4, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(200,220,240,.8)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(10, 1.6); ctx.lineTo(9.6, 5); ctx.moveTo(15, 1.6); ctx.lineTo(15.4, 5.4); ctx.stroke(); // tears
      ctx.fillStyle = C('#3A1210'); ctx.beginPath(); ctx.ellipse(12.6, 6.4, 2 + (wN || wA ? 1.4 : 0), 1 + (wN || wA ? 1.4 : 0), 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(80,50,30,.6)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(8, -3); ctx.lineTo(11, -3.6); ctx.moveTo(14, -3.6); ctx.lineTo(17, -3); ctx.stroke(); }
    ctx.restore();
    legs(true);
    if (DET() && (ax && k < .5 || swp)) add(() => { ctx.strokeStyle = 'rgba(240,230,220,.14)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(-14, -60, 66, pa - .8, pa); ctx.stroke(); });
    ctx.restore();
  };
  Object.assign(W8.art, { gurdy, howl });
  // ======================================================================================================
  // THE ARMOUR OF THE CIRCLE'S ELITE: what they have taken off the dead of Lorraine's wars (rusted plate, pot-helms, a
  // scold's bridle, iron hoops) and worn without understanding it. Each piece is painted about its own middle, so the
  // creature can wear it in its own layers and armor_c.js can throw it off when the guard breaks; what was under it is
  // drawn by the creature when e.bare is set
  // ======================================================================================================
  const armed = (e) => !!(e && e.elite && e.guard > 0 && !e.bare);
  const IRON = '#6E665C', IRONL = '#B4AA98', IROND = '#2E2822', RUST = '#9A4E2A';
  const rivet = (x, y, r = .9) => { ctx.fillStyle = C('#C8BCA8'); circle(x, y, r); ctx.fill(); if (DET()) { ctx.fillStyle = 'rgba(30,20,14,.6)'; circle(x + r * .3, y + r * .3, r * .5); ctx.fill(); } };
  const rustTex = (seed, w, h) => () => {
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? 'rgba(154,78,42,.55)' : 'rgba(110,50,24,.45)'; ell((hsh(seed + i) - .5) * w, (hsh(seed + i + 7) - .5) * h, 1.4 + hsh(seed + i * 3) * 2.4, 1 + hsh(seed + i) * 1.4); ctx.fill(); }
    ctx.strokeStyle = 'rgba(120,56,26,.5)'; ctx.lineWidth = .8; for (let i = 0; i < 3; i++) { const x = (hsh(seed + i * 5) - .5) * w; ctx.beginPath(); ctx.moveTo(x, -h * .2); ctx.lineTo(x + .6, h * .45); ctx.stroke(); } }; // where it has run
  // a kettle-hat (chapel de fer): a dome and a broad brim, dented, rust coming through
  function kettleHat(s = 1) {
    ctx.save(); ctx.scale(s, s);
    cel(PB([-12, 3, -7, -1, -6, -8, 0, -11, 6, -8, 7, -1, 12, 3, 0, 5.4]), IRON, { d: 1.8, r: 1, w: 1.4, dark: IROND, lite: IRONL, tex: rustTex(5, 18, 10) });
    if (DET()) { ctx.strokeStyle = 'rgba(30,24,20,.6)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(-6.6, -.6); ctx.quadraticCurveTo(0, 1.4, 6.6, -.6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -10.6); ctx.lineTo(0, -1); ctx.stroke(); }
    ctx.restore();
  }
  // a breastplate off a dead man-at-arms, the double cross of Lorraine still in red on it, and the strap that holds it on
  function breastplate() {
    cel(PB([-10, -13, -3, -15, 3, -15, 10, -13, 11, 0, 8, 12, 0, 14, -8, 12, -11, 0]), IRON, { d: 2.6, r: 1.2, w: 1.5, dark: IROND, lite: IRONL, tex: () => {
      rustTex(9, 18, 22)();
      ctx.strokeStyle = 'rgba(232,226,210,.5)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-1, -13); ctx.lineTo(-.4, 12); ctx.stroke(); // the ridge
      ctx.fillStyle = 'rgba(166,42,38,.85)'; ctx.fillRect(-.9, -10, 2.4, 16); ctx.fillRect(-4.4, -7, 9.4, 2); ctx.fillRect(-5.6, -2.6, 11.8, 2); } }); // the cross of Lorraine
    for (const [x, y] of [[-8, -11], [8, -11], [-8, 9], [7, 9]]) rivet(x, y);
    ctx.fillStyle = C('#4A3222'); ctx.fillRect(-11, -1, 3, 4); ctx.fillRect(8, -1, 3, 4);
  }
  // a little pot-helm, for each of the Procession's heads
  function potHelm(s = 1) {
    ctx.save(); ctx.scale(s, s);
    cel(PB([-6.6, 3, -6.6, -4, -3, -8, 3, -8, 6.6, -4, 6.6, 3]), IRON, { d: 1.2, r: .7, w: 1.2, dark: IROND, lite: IRONL, tex: rustTex(13, 10, 8) });
    ctx.fillStyle = C(IROND); ctx.fillRect(-7, 1.6, 14, 2.2); rivet(-4, 2.6, .6); rivet(4, 2.6, .6);
    ctx.restore();
  }
  // a length of rusted chain (the Procession is bound together with it)
  function chainLinks(x0, y0, cx, cy, x1, y1, n = 9) {
    for (let i = 0; i < n; i++) { const u = (i + .5) / n, iu = 1 - u, x = iu * iu * x0 + 2 * iu * u * cx + u * u * x1, y = iu * iu * y0 + 2 * iu * u * cy + u * u * y1;
      const dx = 2 * iu * (cx - x0) + 2 * u * (x1 - cx), dy = 2 * iu * (cy - y0) + 2 * u * (y1 - cy), a = Math.atan2(dy, dx) + (i % 2 ? Math.PI / 2 * .0 : 0);
      ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.lineWidth = i % 2 ? 1.4 : 2.2; ctx.strokeStyle = C(OUT); ctx.beginPath(); ctx.ellipse(0, 0, 3.4, i % 2 ? .9 : 1.9, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = C(i % 2 ? IRON : '#8A5A3A'); ctx.lineWidth = i % 2 ? .8 : 1.1; ctx.stroke(); ctx.restore(); }
  }
  function chainPiece() { chainLinks(-14, -2, 0, 4, 14, -2, 7); }
  // Knife-Ears: an iron shell riveted over each ear, and a visor over its eye
  function earPlate(side) { // (about its middle: in the ear's own frame it sits at (-5 * side, -32))
    ctx.save(); ctx.scale(side, 1);
    cel(PB([4, 12, -6, 9, -9, -2, -4, -12, 4, -13, 8, -4]), IRON, { d: 2, r: 1, w: 1.4, dark: IROND, lite: IRONL, tex: () => { rustTex(17, 12, 22)(); ctx.strokeStyle = 'rgba(30,24,20,.55)'; ctx.lineWidth = .7; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-8, -6 + i * 6); ctx.quadraticCurveTo(-2, -8 + i * 6, 6, -6 + i * 6); ctx.stroke(); } } });
    for (const [x, y] of [[-4, -9], [2, -11], [-6, 6], [3, 9]]) rivet(x, y, .8);
    ctx.restore();
  }
  function eyeVisor() {
    cel(PB([-11, 5, -12, -3, -6, -8, 6, -8, 13, -3, 12, 5, 0, 8]), IRON, { d: 1.6, r: .8, w: 1.4, dark: IROND, lite: IRONL, tex: rustTex(23, 20, 10) });
    ctx.fillStyle = C('#0E0806'); ctx.fillRect(2, -2.2, 10, 1.8); // the slit
    if (DET()) { ctx.fillStyle = 'rgba(255,90,60,.9)'; circle(8, -1.3, .8); ctx.fill(); }
    for (const x of [-8, -3, 8]) rivet(x, 4, .7);
  }
  // the Crawling Mouth's scold's bridle: an iron band round its lips, a strap over, a padlock
  function bridleBand(ow, oh) {
    ctx.lineCap = 'round';
    const band = (w, c) => { ctx.strokeStyle = C(c); ctx.lineWidth = w; ctx.beginPath(); ctx.ellipse(2, 0, ow + 3, oh + 7.4, 0, 0, TAU); ctx.stroke(); };
    band(4.4, OUT); band(2.6, IRON); if (DET()) { ctx.strokeStyle = 'rgba(154,78,42,.7)'; ctx.lineWidth = 1; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.ellipse(2, 0, ow + 3, oh + 7.4, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
    for (const x of [-10, 13]) { const yy = (oh + 7.4) * Math.sqrt(Math.max(0, 1 - ((x - 2) / (ow + 3)) ** 2)); ctx.strokeStyle = C(OUT); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, -yy); ctx.lineTo(x, yy); ctx.stroke(); ctx.strokeStyle = C(IRON); ctx.lineWidth = 2.4; ctx.stroke(); rivet(x, -yy, .9); rivet(x, yy, .9); }
  }
  function padlock() {
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(0, -3, 2.6, Math.PI, 0); ctx.stroke(); ctx.strokeStyle = C(IRONL); ctx.lineWidth = 1.2; ctx.stroke();
    cel(PB([-4, -3, 4, -3, 4.4, 4, 0, 5, -4.4, 4]), '#7A5A34', { d: 1, r: .5, w: 1.1, dark: '#3A2410', lite: '#C8A060' });
    ctx.fillStyle = C('#140C08'); ctx.fillRect(-.5, 0, 1, 2.4);
  }
  function bridlePiece(side) { ctx.save(); ctx.scale(side, 1); ctx.lineCap = 'round'; ctx.strokeStyle = C(OUT); ctx.lineWidth = 4.4; ctx.beginPath(); ctx.ellipse(10, 0, 12, 10, 0, Math.PI * .5, Math.PI * 1.5); ctx.stroke(); ctx.strokeStyle = C(IRON); ctx.lineWidth = 2.6; ctx.stroke(); rivet(-2, 0, .9); ctx.restore(); }
  // the Hurdy-Gurdy's iron: hoops round its case, a hasp and padlock, and a cracked hand-bell hung off its scroll
  function hoop(h = 36) { ctx.lineCap = 'round'; const p = () => { ctx.beginPath(); ctx.moveTo(-1.4, -h / 2); ctx.quadraticCurveTo(2.4, 0, -1.4, h / 2); };
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 5; p(); ctx.stroke(); ctx.strokeStyle = C(IRON); ctx.lineWidth = 3.2; p(); ctx.stroke(); if (DET()) { ctx.strokeStyle = 'rgba(154,78,42,.8)'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 4]); p(); ctx.stroke(); ctx.setLineDash([]); }
    for (const y of [-h / 2 + 4, 0, h / 2 - 4]) rivet(.4, y, 1); }
  function handBell() {
    cel(PB([-5, 4, -4.4, -2, -2, -6, 2, -6, 4.4, -2, 5, 4]), '#8A6A3A', { d: 1.2, r: .6, w: 1.2, dark: '#4A3218', lite: '#D8B070', tex: () => { ctx.fillStyle = 'rgba(70,120,90,.5)'; ell(-2, 0, 2, 3); ctx.fill(); } });
    ctx.fillStyle = C('#3A2410'); circle(0, 5.2, 1.4); ctx.fill(); ctx.strokeStyle = C(OUT); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(0, -9); ctx.stroke();
  }
  // the Walking Egg's lid: the top of its shell put back over the hole and held down by an iron hoop
  function eggLid() {
    cel(PB([-10, 2, -9, -4, -4, -8, 3, -8.4, 9, -5, 11, 1, 6, 3, 2, .4, -2, 3.6, -6, .6]), '#ECE4D2', { d: 2, r: 1, w: 1.4, dark: '#B4A890', lite: '#FFFDF6', tex: () => { for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(160,140,110,.35)'; circle(-6 + hsh(i + 31) * 12, -6 + hsh(i + 33) * 6, .7); ctx.fill(); } } });
    if (DET()) { ctx.strokeStyle = 'rgba(40,30,20,.7)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(-8, 1); ctx.lineTo(-4, -2); ctx.lineTo(-1, 1); ctx.stroke(); }
  }
  function eggHoop() { ctx.lineCap = 'round';
    const p = () => { ctx.beginPath(); ctx.moveTo(-15, 0); ctx.quadraticCurveTo(0, 5, 15, 0); };
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 5; p(); ctx.stroke(); ctx.strokeStyle = C(IRON); ctx.lineWidth = 3.2; p(); ctx.stroke();
    for (const x of [-9, 0, 9]) rivet(x, x ? 2 : 2.5, .9); }
  function eggStrap() { ctx.lineCap = 'round'; const p = () => { ctx.beginPath(); ctx.moveTo(-1, -12); ctx.quadraticCurveTo(2, 0, -1, 12); };
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 4.4; p(); ctx.stroke(); ctx.strokeStyle = C(IRON); ctx.lineWidth = 2.6; p(); ctx.stroke(); rivet(.4, -10, .8); }
  // the crow's iron mask: a beaked visor of the kind the plague-doctors will wear, riveted over its head
  function crowMask() {
    cel(PB([-7, 6, -8, -3, -3, -7, 4, -6, 9, -3, 20, 1, 9, 4, 4, 7]), IRON, { d: 1.4, r: .8, w: 1.3, dark: IROND, lite: IRONL, tex: rustTex(41, 22, 10) });
    ctx.fillStyle = C('#0E0806'); circle(2, -1.6, 1.8); ctx.fill(); if (DET()) { ctx.fillStyle = 'rgba(255,190,90,.9)'; circle(2.4, -1.8, .7); ctx.fill(); }
    rivet(-4, 3, .7); rivet(7, 2, .7);
  }
  W8.armor = { armed, kettleHat, breastplate, potHelm, chainLinks, chainPiece, earPlate, eyeVisor, bridleBand, padlock, bridlePiece, hoop, handBell, eggLid, eggHoop, eggStrap, crowMask, rivet };

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
  // hair laid in strokes: n short strokes scattered over a box, all leaning one way, laid as one path
  function furStrokes(x0, y0, x1, y1, n, dx, dy, col, w, seed = 0) { ctx.beginPath(); for (let i = 0; i < n; i++) { const x = lerp(x0, x1, hsh(seed + i * 1.37)), y = lerp(y0, y1, hsh(seed + i * 2.71 + 9)), k = .6 + hsh(seed + i * .53) * .7; ctx.moveTo(x, y); ctx.quadraticCurveTo(x + dx * k * .6 + dy * .15, y + dy * k * .5, x + dx * k, y + dy * k); } ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); }
  // a ridged horn: the ridges ring it from root to tip, closer as it narrows; the root dark, the tip worn pale
  function ridgedHorn(x0, y0, cx, cy, x1, y1, w0, w1, ow, dark) {
    const s = horn(x0, y0, cx, cy, x1, y1, w0, w1, GL.horn, ow, dark);
    if (!DET()) return s;
    const R = taper(x0, y0, cx, cy, x1, y1, w0, w1, 16), n = R.M.length / 2;
    ctx.save(); trace(s.L, s.R); ctx.clip();
    trace(R.L.slice((n - 6) * 2), R.R.slice((n - 6) * 2)); ctx.fillStyle = 'rgba(190,176,150,.32)'; ctx.fill();
    trace(R.L.slice(0, 6), R.R.slice(0, 6)); ctx.fillStyle = 'rgba(8,6,4,.35)'; ctx.fill();
    ctx.lineCap = 'round';
    ctx.beginPath(); for (let i = 1; i < n - 1; i++) { const a = R.L.slice(i * 2, i * 2 + 2), b = R.R.slice(i * 2, i * 2 + 2), m = R.M.slice(i * 2, i * 2 + 2); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(m[0] + (m[0] - (R.M[i * 2 - 2])) * .6, m[1] + (m[1] - R.M[i * 2 - 1]) * .6, b[0], b[1]); } ctx.strokeStyle = 'rgba(6,4,2,.75)'; ctx.lineWidth = .7; ctx.stroke();
    ctx.translate(-.5, -.6); ctx.beginPath(); for (let i = 1; i < n - 2; i++) { const a = R.L.slice(i * 2, i * 2 + 2), b = R.R.slice(i * 2, i * 2 + 2), m = R.M.slice(i * 2, i * 2 + 2); ctx.moveTo(lerp(a[0], b[0], .35), lerp(a[1], b[1], .35)); ctx.quadraticCurveTo(m[0] + (m[0] - (R.M[i * 2 - 2])) * .6, m[1] + (m[1] - R.M[i * 2 - 1]) * .6, b[0], b[1]); } ctx.strokeStyle = 'rgba(176,164,146,.5)'; ctx.lineWidth = .45; ctx.stroke();
    ctx.restore();
    return s;
  }
  // the goat's head: long face, a beard, slot eyes, and the horns that sweep back (they grow in his later shapes)
  function goatHead(x, y, s, o = {}) {
    const hs = o.horns || 1, rage = o.rage || 0, open = o.open || 0, t = o.t || 0, det = DET();
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(o.tilt || 0);
    if (GC) goatHorns(hs, false); // (corrupted: the horns he grows)
    ridgedHorn(-2, -8, -14 * hs, -18 * hs, -22 * hs, -6 * hs, 6, .8, 1.3, '#141210'); // the far horn
    // the ears, flat out to the side, and one flicks now and then
    { const fl = Math.max(0, Math.sin(t * 9) * (Math.sin(t * .7) > .85 ? 1 : 0)) * .25; ctx.save(); ctx.translate(-5, -4); ctx.rotate(-fl); ctx.translate(5, 4);
      cel(PB([-4, -6, -14, -4, -18, -1, -10, 0]), '#3E342C', { d: .8, r: .4, w: 1.1, tex: () => { ctx.fillStyle = 'rgba(120,70,56,.6)'; ell(-11, -2.8, 4.6, 1.1, -.12); ctx.fill(); furStrokes(-16, -4, -6, 0, 6, -2.6, .8, 'rgba(110,94,76,.6)', .45, 3); } }); ctx.restore(); }
    // the long face, the muzzle
    cel(PB([-8, -10, 2, -13, 10, -8, 16, 4, 15, 9, 9, 12, 2, 8, -6, 4, -9, -2]), GL.hair, { d: 2, r: 1, w: 1.5, lite: GL.hairLt,
      under: () => { const g = ctx.createLinearGradient(-8, -10, 16, 10); g.addColorStop(0, 'rgba(10,8,6,.45)'); g.addColorStop(.6, 'rgba(70,58,46,0)'); g.addColorStop(1, 'rgba(120,104,86,.35)'); ctx.fillStyle = g; ctx.fillRect(-10, -14, 28, 28); },
      tex: () => {
        // the coat: dark and light hair laid down the face toward the muzzle
        furStrokes(-7, -11, 8, 6, 22, 2.6, 3.6, 'rgba(8,6,4,.55)', .6, 1);
        furStrokes(-5, -11, 10, 4, 16, 2.4, 3.2, 'rgba(140,120,96,.5)', .45, 7);
        const g = ctx.createLinearGradient(4, -9, 14, 6); g.addColorStop(0, 'rgba(200,190,170,.12)'); g.addColorStop(1, 'rgba(210,198,176,.5)'); ctx.fillStyle = g; poly([4, -9, 12, -4, 15, 4, 8, 0]); ctx.fill(); // the pale blaze down the nose
        ctx.fillStyle = 'rgba(150,134,116,.4)'; ell(13, 6.4, 3.4, 2.6, .4); ctx.fill(); // the muzzle
        ctx.fillStyle = 'rgba(8,6,4,.85)'; ell(14.4, 4.2, 1.2, .55, .7); ctx.fill(); // the nostril
        ctx.fillStyle = 'rgba(6,4,2,.45)'; ell(4, -5, 4.4, 3, -.1); ctx.fill(); // the socket
        ctx.strokeStyle = 'rgba(160,140,116,.6)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(.4, -8.4); ctx.quadraticCurveTo(4.4, -9.8, 8, -7.6); ctx.stroke(); // the brow
        ctx.strokeStyle = 'rgba(6,4,2,.6)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(8, 9.6); ctx.quadraticCurveTo(12, 9.4, 15, 8); ctx.stroke(); // the line of the mouth
      } });
    if (open > 0) { ctx.fillStyle = C('#2A0806'); poly([9, 9, 16, 7 + open * 2, 12, 12 + open * 5, 6, 12]); ctx.fill(); if (DET()) { ctx.fillStyle = 'rgba(120,30,24,.8)'; ell(11, 11 + open * 2, 2.4, 1 + open, .3); ctx.fill(); ctx.fillStyle = 'rgba(232,226,210,.9)'; ctx.fillRect(11, 8, 1, 2); ctx.fillRect(13, 8, 1, 2); ctx.fillRect(9.6, 11.6, 1, 1.4); } }
    // the beard, long and forked, stirring
    { const bw = Math.sin(t * 1.6) * 1.2;
      cel(PB([2, 8, 9, 11, 8 + bw * .4, 20, 5 + bw, 30, 3 + bw * .6, 22, 0 + bw, 26, -1, 14]), '#1A1612', { d: 1, r: .6, w: 1.2, lite: '#4A3E34', tex: () => {
        ctx.beginPath(); for (let i = 0; i < 7; i++) { const x = 1 + i * 1.2; ctx.moveTo(x, 10); ctx.quadraticCurveTo(x + .6, 18, x - 1 + bw * (.5 + i * .08), 22 + (i % 3) * 3); } ctx.strokeStyle = 'rgba(96,82,66,.6)'; ctx.lineWidth = .5; ctx.stroke();
        ctx.beginPath(); for (let i = 0; i < 4; i++) { const x = 1.6 + i * 1.8; ctx.moveTo(x, 11); ctx.quadraticCurveTo(x + .4, 16, x + bw * .5, 19 + i); } ctx.strokeStyle = 'rgba(150,136,116,.45)'; ctx.lineWidth = .4; ctx.stroke(); } });
      if (det) { ctx.fillStyle = '#1A1612'; ctx.beginPath(); ctx.moveTo(4 + bw * .9, 28); ctx.quadraticCurveTo(5.6 + bw * 1.3, 30.5, 4.8 + bw * 1.7, 32.4); ctx.quadraticCurveTo(4.6 + bw * 1.1, 30, 3.4 + bw * .9, 29); ctx.closePath(); ctx.fill(); } }
    // the eye: a gold iris with a black bar of a pupil; he blinks, seldom
    if (DET() || FLASH) { const bl = (t % 5.3) < .12;
      if (bl && !FLASH) { ctx.strokeStyle = '#0E0A06'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(1.4, -4.8); ctx.quadraticCurveTo(4, -3.8, 6.8, -5); ctx.stroke(); }
      else { ctx.fillStyle = C(GL.eye); ell(4, -5, 2.8, 2); ctx.fill();
        if (DET()) { const g = ctx.createRadialGradient(4, -5, .2, 4, -5, 2.8); g.addColorStop(0, '#FFF0A0'); g.addColorStop(.5, 'rgba(232,192,64,0)'); g.addColorStop(1, 'rgba(120,70,10,.8)'); ctx.fillStyle = g; ell(4, -5, 2.8, 2); ctx.fill(); }
        ctx.fillStyle = C('#0E0A06'); ctx.fillRect(2.4, -5.5, 3.2, 1);
        if (DET()) { ctx.fillStyle = 'rgba(255,255,240,.9)'; circle(5.2, -6, .45); ctx.fill(); ctx.strokeStyle = 'rgba(10,6,2,.9)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.ellipse(4, -5, 2.8, 2, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); } } }
    if (rage > 0 && DET()) glowM(4, -5, 6, '255,200,90', .35 * rage);
    ridgedHorn(0, -10, -6 * hs, -30 * hs, -20 * hs, -36 * hs, 7, .9, 1.4, '#141210'); // the near horn, ridged
    if (GC) goatHorns(hs, true);
    if (o.charge > 0) { gather(-20 * hs, -36 * hs, o.charge, o.t || 0, 4); gather(-22 * hs, -6 * hs, o.charge * .8, (o.t || 0) + .37, 3.4); } // (without his crozier the bleat gathers in his horns)
    ctx.restore();
  }
  // the crozier: an iron staff with a crook bent round into a ring, the ring the Circle
  // the bleat gathering at a point (the crozier's ring, or the tips of his horns): grey motes of the Circle spiral in,
  // a pale light grows in it and threads crackle off it
  function gather(rx, ry, charge, t, core) {
      for (let i = 0; i < 12; i++) { const q = (t * (1.1 + charge * 1.6) + i / 12) % 1, r = 9 + (1 - q) * (22 + 14 * charge), a = i * 2.4 + q * 4.2;
        ctx.fillStyle = `rgba(${i % 3 ? '214,206,190' : '236,214,150'},${(.25 + .6 * q) * charge})`; circle(rx + Math.cos(a) * r, ry + Math.sin(a) * r, .8 + q * 1.4); ctx.fill(); }
      const g = ctx.createRadialGradient(rx, ry, 0, rx, ry, core); g.addColorStop(0, `rgba(250,240,214,${.95 * charge})`); g.addColorStop(.55 * charge + .2, `rgba(214,200,170,${.7 * charge})`); g.addColorStop(1, 'rgba(12,10,8,0)'); ctx.fillStyle = g; circle(rx, ry, core); ctx.fill();
      if (charge > .35) { ctx.strokeStyle = `rgba(240,228,200,${.8 * charge})`; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = Math.floor(t * 18 + i * 7) * 1.7 + i * 2.1, L2 = 9 + 8 * charge; ctx.moveTo(rx + Math.cos(a) * 8, ry + Math.sin(a) * 8); ctx.lineTo(rx + Math.cos(a + .3) * (8 + L2 * .5), ry + Math.sin(a + .3) * (8 + L2 * .5)); ctx.lineTo(rx + Math.cos(a - .1) * (8 + L2), ry + Math.sin(a - .1) * (8 + L2)); } ctx.stroke(); }
      glowM(rx, ry, 10 + 6 * charge, '240,226,190', .3 * charge);
  }
  function crozier(x0, y0, ang, L, glow, charge = 0, t = 0) {
    const x1 = x0 + Math.cos(ang) * L, y1 = y0 + Math.sin(ang) * L, ca = Math.cos(ang), sa = Math.sin(ang), xb = x0 - ca * 12, yb = y0 - sa * 12, det = DET();
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 4.4; ctx.beginPath(); ctx.moveTo(xb, yb); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = C(GL.iron); ctx.lineWidth = 2.6; ctx.stroke();
    if (det) { // the iron rounded: a dark underside, a lit top, and a twisted band wound up it
      ctx.strokeStyle = 'rgba(8,8,8,.6)'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(xb + sa * .8, yb - ca * .8); ctx.lineTo(x1 + sa * .8, y1 - ca * .8); ctx.stroke();
      ctx.beginPath(); for (let d = 4; d < L + 8; d += 5) { const px = xb + ca * d, py = yb + sa * d; ctx.moveTo(px - sa * 1.3 - ca * 1.2, py + ca * 1.3 - sa * 1.2); ctx.lineTo(px + sa * 1.3 + ca * 1.2, py - ca * 1.3 + sa * 1.2); } ctx.strokeStyle = 'rgba(14,12,10,.55)'; ctx.lineWidth = .6; ctx.stroke(); }
    ctx.strokeStyle = C(GL.ironLt); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(xb - sa * .5, yb + ca * .5); ctx.lineTo(x1 - sa * .5, y1 + ca * .5); ctx.stroke();
    // the ferrule at its foot, a blunt spike
    ctx.fillStyle = C(GL.iron); poly([xb - sa * 2.2, yb + ca * 2.2, xb + sa * 2.2, yb - ca * 2.2, xb - ca * 5, yb - sa * 5]); ctx.fill(); outline(1);
    const rx = x1 + ca * 9, ry = y1 + sa * 9;
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 5; circle(rx, ry, 9); ctx.stroke(); ctx.strokeStyle = C(GL.iron); ctx.lineWidth = 3; ctx.stroke();
    if (det) { ctx.strokeStyle = C(GL.ironLt); ctx.lineWidth = .8; ctx.beginPath(); ctx.arc(rx, ry, 9, -2.4, -.6); ctx.stroke();
      ctx.strokeStyle = 'rgba(8,8,8,.7)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.arc(rx, ry, 9.4, .4, 2.4); ctx.stroke();
      ctx.beginPath(); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; ctx.moveTo(rx + Math.cos(a) * 7.8, ry + Math.sin(a) * 7.8); ctx.lineTo(rx + Math.cos(a + .12) * 10.2, ry + Math.sin(a + .12) * 10.2); } ctx.strokeStyle = 'rgba(16,14,12,.65)'; ctx.lineWidth = .5; ctx.stroke(); }
    ctx.fillStyle = C('#0C0A08'); circle(rx, ry, 7); ctx.fill(); // the ring is a hole: you see nothing through it
    if (det) { ctx.strokeStyle = 'rgba(120,112,100,.22)'; ctx.lineWidth = .8; ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = t * (.8 + i * .3) + i * 2.1; ctx.moveTo(rx + Math.cos(a) * (2 + i * 1.6), ry + Math.sin(a) * (2 + i * 1.6)); ctx.arc(rx, ry, 2 + i * 1.6, a, a + 2.2); } ctx.stroke(); } // (only the Circle turning in it, grey on black)
    if (GC) goatCircle(rx, ry, t); // (corrupted: the ring grown into the Circle)
    // the knop where the crook meets the staff: an iron boss with a band of gold
    cel(PE(x1, y1, 3.4, 3.4), GL.iron, { d: .9, r: .6, w: 1.1, lite: GL.ironLt, tex: () => { ctx.strokeStyle = '#C9982E'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(x1 - sa * 3.4, y1 + ca * 3.4); ctx.lineTo(x1 + sa * 3.4, y1 - ca * 3.4); ctx.stroke(); } });
    if (glow > 0) glowM(rx, ry, 18, '210,200,180', .25 * glow);
    if (charge > 0) gather(rx, ry, charge, t, 7); // the bleat gathering in the crook
    return [rx, ry];
  }
  // his cope: a great semicircle of vermilion silk, its orphrey bands of gold worked with black goats; in his third
  // shape its hem burns away into grey
  function cope(sw, burn, wide) {
    const hem = -4, P = PB([-10, -70, 10, -70, 18 + wide, -50, 24 + wide + sw, -18, 26 + wide + sw, hem, 0, hem + 3, -26 - wide + sw, hem, -24 - wide + sw, -18, -18 - wide, -50]);
    cel(P, GL.cope, { d: 4, r: 1.4, w: 1.8, dark: GL.copeDk, lite: GL.copeLt,
      under: () => { const g = ctx.createLinearGradient(0, -70, 0, hem); g.addColorStop(0, 'rgba(255,150,100,.22)'); g.addColorStop(.5, 'rgba(194,58,30,0)'); g.addColorStop(1, 'rgba(50,4,0,.4)'); ctx.fillStyle = g; ctx.fillRect(-40, -72, 80, 72); },
      tex: () => {
      // the damask of the silk: a lattice of pomegranates, woven a shade darker
      ctx.beginPath(); for (let r = 0; r < 9; r++) for (let c = -5; c <= 5; c++) { const x = c * 6 + (r % 2) * 3 + sw * r / 9, y = -66 + r * 7.2; ctx.moveTo(x, y - 2); ctx.lineTo(x + 1.6, y); ctx.lineTo(x, y + 2); ctx.lineTo(x - 1.6, y); ctx.closePath(); } ctx.fillStyle = 'rgba(90,12,4,.22)'; ctx.fill();
      ctx.strokeStyle = 'rgba(60,10,4,.45)'; ctx.lineWidth = .9; ctx.beginPath(); for (let i = -3; i <= 3; i++) { ctx.moveTo(i * 2.4, -66); ctx.quadraticCurveTo(i * 5 + sw * .5, -36, i * 8 + sw, hem); } ctx.stroke(); // the folds
      ctx.strokeStyle = 'rgba(255,150,110,.32)'; ctx.lineWidth = .8; ctx.beginPath(); for (let i = -3; i <= 2; i++) { ctx.moveTo(i * 2.4 + 1.2, -64); ctx.quadraticCurveTo(i * 5 + 2.6 + sw * .5, -36, i * 8 + 4 + sw, hem); } ctx.stroke(); // (the light on each fold's ridge)
      goldLine(() => { ctx.moveTo(-3, -68); ctx.quadraticCurveTo(-6, -36, -10 + sw, hem); ctx.moveTo(5, -68); ctx.quadraticCurveTo(8, -36, 12 + sw, hem); }, 2.2); // the orphreys
      // on them, the black goats in roundels of gold
      { const R = []; for (let i = 0; i < 4; i++) { const u = (i + .5) / 4; R.push(lerp(-4, -9 + sw, u), lerp(-62, hem + 6, u), lerp(4, 11 + sw, u), lerp(-62, hem + 6, u)); }
        ctx.beginPath(); for (let i = 0; i < R.length; i += 2) { ctx.moveTo(R[i] + 2.4, R[i + 1]); ctx.arc(R[i], R[i + 1], 2.4, 0, TAU); } ctx.fillStyle = C('#C9982E'); ctx.fill();
        ctx.beginPath(); for (let i = 0; i < R.length; i += 2) { ctx.moveTo(R[i] + 1.6, R[i + 1]); ctx.arc(R[i], R[i + 1], 1.6, 0, TAU); } ctx.fillStyle = C('#1C1612'); ctx.fill();
        if (DET()) { ctx.beginPath(); for (let i = 0; i < R.length; i += 2) { const x = R[i], y = R[i + 1]; ctx.moveTo(x - .5, y - .2); ctx.quadraticCurveTo(x - 1.4, y - 1.6, x - .2, y - 1.4); ctx.moveTo(x + .5, y - .2); ctx.quadraticCurveTo(x + 1.4, y - 1.6, x + .2, y - 1.4); } ctx.strokeStyle = '#E8C060'; ctx.lineWidth = .4; ctx.stroke(); } }
      goldLine(() => { ctx.moveTo(-26 - wide + sw, hem - 1); ctx.quadraticCurveTo(0, hem + 3, 26 + wide + sw, hem - 1); }, 1.6); // the hem's border
      if (burn > 0) { ctx.fillStyle = GC ? `rgba(14,8,8,${Math.min(1, burn + .15)})` : `rgba(150,144,134,${burn})`; ctx.beginPath(); ctx.moveTo(-30, hem + 4); for (let x = -30; x <= 30; x += 3) ctx.lineTo(x + sw, hem - 4 - burn * (10 + hsh(x) * 18)); ctx.lineTo(30, hem + 4); ctx.fill();
        if (DET()) { // the burning edge: a thread of ember along it, and ash on the grey
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,110,40,.55)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = -30; x <= 30; x += 3) { const y = hem - 4 - burn * (10 + hsh(x) * 18); if (x === -30) ctx.moveTo(x + sw, y); else ctx.lineTo(x + sw, y); } ctx.stroke(); ctx.restore();
          ctx.strokeStyle = 'rgba(30,22,16,.6)'; ctx.lineWidth = .6; ctx.beginPath(); for (let x = -30; x <= 30; x += 3) { const y = hem - 4 - burn * (10 + hsh(x) * 18); if (x === -30) ctx.moveTo(x + sw, y - .8); else ctx.lineTo(x + sw, y - .8); } ctx.stroke();
          ctx.beginPath(); for (let i = 0; i < 14; i++) { const x = -26 + hsh(i + 40) * 52 + sw, y = hem - hsh(i + 60) * burn * 12; ctx.rect(x, y, .8, .8); } ctx.fillStyle = 'rgba(60,54,48,.6)'; ctx.fill(); } }
    } });
    // the fringe of gold on the hem, swinging
    if (DET() && !burn) { ctx.beginPath(); for (let x = -24 - wide; x <= 24 + wide; x += 2.4) { const y = hem - 1 + 4 * (1 - (x / (26 + wide)) ** 2) * .75; ctx.moveTo(x + sw, y); ctx.lineTo(x + sw * 1.15 + Math.sin(x * .5) * .3, y + 2.2); } ctx.strokeStyle = '#C9982E'; ctx.lineWidth = .7; ctx.stroke(); }
  }
  // a goat's leg: a shaggy thigh, the backward knee, a long shank, a cloven hoof
  function goatLeg(hx, hy, fx, fy, col, near) {
    const kk = knee(hx, hy, fx, fy, 16, -1);
    limb3(hx, hy, kk[0], kk[1], fx, fy - 3, 8, 4.6, 3.4, col, { tex: () => { ctx.strokeStyle = 'rgba(100,84,66,.6)'; ctx.lineWidth = .6; ctx.beginPath(); for (let i = 0; i < 8; i++) { ctx.moveTo(hx - 4 + i, hy + i * 2); ctx.lineTo(hx - 6 + i, hy + i * 2 + 4); } ctx.stroke(); } });
    if (DET()) { // shag at the thigh's edge and a feather of hair over the hoof
      const ux = kk[0] - hx, uy = kk[1] - hy, d = Math.hypot(ux, uy) || 1;
      ctx.beginPath(); for (let i = 0; i < 4; i++) { const q = .25 + i * .2, px = hx + ux * q, py = hy + uy * q, L = 2.4 + hsh(i + hx) * 2; ctx.moveTo(px - 2, py); ctx.quadraticCurveTo(px + 1, py + L * .4, px + .6 + ux / d * L, py + uy / d * L); } ctx.strokeStyle = 'rgba(12,10,8,.5)'; ctx.lineWidth = .6; ctx.stroke();
      ctx.beginPath(); for (let i = 0; i < 5; i++) { const px = fx - 2.6 + i * 1.4; ctx.moveTo(px, fy - 7); ctx.quadraticCurveTo(px - .3, fy - 4.6, px - .8 + i * .2, fy - 3.4); } ctx.strokeStyle = col; ctx.lineWidth = 1.1; ctx.stroke(); }
    cel(PP([fx - 3, fy, fx - 2, fy - 4, fx + 4, fy - 4, fx + 5, fy, fx + 1, fy - 1.4]), GL.hoof, { d: .6, r: .5, w: 1.1, lite: '#4A443E', tex: () => { ctx.strokeStyle = 'rgba(130,120,108,.6)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(fx - 1.6, fy - 3.4); ctx.lineTo(fx + 3.6, fy - 3.4); ctx.stroke(); } });
    if (DET()) { ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(fx + 1.4, fy - 3.8); ctx.lineTo(fx + 1, fy); ctx.stroke(); } // the cleft
  }
  // the knuckles of his hand round the staff; in his later shapes, black, with nails like a goat's horn
  function claws(x, y, a, form) { if (!DET()) return; const ca = Math.cos(a + 1.57), sa = Math.sin(a + 1.57);
    ctx.beginPath(); for (let i = -1; i <= 1; i++) { const px = x + Math.cos(a) * i * 1.3 + ca * 1.6, py = y + Math.sin(a) * i * 1.3 + sa * 1.6; ctx.moveTo(px, py); ctx.lineTo(px + ca * (form >= 3 ? 1.8 : .4), py + sa * (form >= 3 ? 1.8 : .4)); }
    ctx.strokeStyle = form >= 3 ? '#8A8070' : 'rgba(40,30,24,.7)'; ctx.lineWidth = form >= 3 ? .8 : .5; ctx.stroke(); }
  // ---- CORRUPTED (New Game+: window.CURSE_ART, corruption.js; set while he is drawn so). He came in by your curse, and
  // with it in him he grows into it: more horns with each shape (a small pair, then a longer, then a pair curling forward
  // and a crown of them), black and split with red; the cope burns black from the hem up, embers in its char; his eyes go
  // red; the ring of his crozier widens into the Black Circle itself, a hole with the red turning in it, thorned in his
  // later shapes. His weak point is the black stone in his morse, the clasp at his breast: shut, a stone with an ember in
  // it; open, it is an eye, a goat's, blazing; struck, it burns gold.
  const GL_C = { cope: '#2A0C0A', copeDk: '#0C0404', copeLt: '#6A2A1E', robe: '#0E0C0C', hair: '#16100E', hairLt: '#3A2C26', horn: '#120E0E', hornLt: '#5A3A36', eye: '#FF3A2A', skin: '#3A302C', iron: '#1C1A1A', ironLt: '#5A5250' };
  let GC = null;
  function goatCursed(e, a, L) {
    const form = e.w8form || 1, k = Math.min(1, .3 + .18 * form + .3 * L.d) * (.3 + .7 * L.g), keep = Object.assign({}, GL);
    for (const f in GL_C) GL[f] = CURSE_ART.mix(GL[f], GL_C[f], f === 'cope' || f === 'copeDk' || f === 'copeLt' ? k : Math.min(1, k * 1.2));
    GC = { L, form, k, m: CURSE_ART.morph(e, form), look: CURSE_ART.toward(e), t: L.T, burn: Math.min(1, .25 + .2 * form + .2 * L.d) };
    try { CREATURES.w8goat(e, a); } finally { Object.assign(GL, keep); GC = null; }
  }
  // the horns that grow on him with each shape, behind and before the old ones (in the head's own space)
  function goatHorns(hs, front) {
    const n = Math.min(4, GC.form + (GC.L.bt >= 4 ? 1 : 0)), m = GC.m;
    const H = [[-4, -11, -12, -26, -4, -34, 4.6], [-6, -9, -22, -24, -32, -20, 5.2], [2, -11, 10, -24, 18, -22, 4.4], [-2, -12, -2, -30, 6, -40, 4]];
    for (let i = 0; i < n; i++) { if ((i === 2) !== front) continue; const q = H[i], g = (i === n - 1 ? m : 1) * hs;
      ridgedHorn(q[0], q[1], q[0] + (q[2] - q[0]) * g, q[1] + (q[3] - q[1]) * g, q[0] + (q[4] - q[0]) * g, q[1] + (q[5] - q[1]) * g, q[6], .6, 1.2, '#060404');
      if (DET()) { ctx.strokeStyle = 'rgba(230,40,40,.7)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(q[0] + (q[2] - q[0]) * g * .4, q[1] + (q[3] - q[1]) * g * .4); ctx.lineTo(q[0] + (q[4] - q[0]) * g * .8, q[1] + (q[5] - q[1]) * g * .8); ctx.stroke(); } }
  }
  // the crozier's ring grown into the Circle: a black hole rimmed with the Circle's red, the red turning in it
  function goatCircle(rx, ry, t) {
    const R = 9 + 2.2 * GC.form + 2 * GC.L.d, m = GC.m;
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 7; circle(rx, ry, R); ctx.stroke(); ctx.strokeStyle = C('#0A0606'); ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = C(CURSE_ART.VOID); circle(rx, ry, R - 2); ctx.fill();
    if (DET()) { ctx.strokeStyle = `rgba(220,40,44,${.7 + .2 * Math.sin(t * 3)})`; ctx.lineWidth = 1.2; circle(rx, ry, R + 2.6); ctx.stroke();
      ctx.strokeStyle = 'rgba(200,30,36,.5)'; ctx.lineWidth = .9; ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = -t * (1 + i * .4) + i * 2.1, r = R * (.25 + i * .22); ctx.moveTo(rx + Math.cos(a) * r, ry + Math.sin(a) * r); ctx.arc(rx, ry, r, a, a + 3.6); } ctx.stroke();
      if (GC.form >= 3) { ctx.fillStyle = '#0A0606'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + .2, l = (4 + 3 * (i % 2)) * m; ctx.moveTo(rx + Math.cos(a - .12) * R, ry + Math.sin(a - .12) * R); ctx.lineTo(rx + Math.cos(a) * (R + 2 + l), ry + Math.sin(a) * (R + 2 + l)); ctx.lineTo(rx + Math.cos(a + .12) * R, ry + Math.sin(a + .12) * R); } ctx.fill(); } }
  }
  // the black stone of his morse, his weak point: an eye (a goat's, its pupil a bar) when it lies open
  function goatMorse(t) {
    const L = GC.L, op = Math.max(L.open, L.burn * .5, L.wind * .15);
    ctx.fillStyle = C('#060404'); ell(1, -62, 4.2, 3.2); ctx.fill();
    if (op > .03) { const w = 5.6 + 1.6 * op, h = 4.2 * op;
      ctx.beginPath(); ctx.moveTo(1 - w, -62); ctx.quadraticCurveTo(1, -62 - h * 1.5, 1 + w, -62); ctx.quadraticCurveTo(1, -62 + h * 1.3, 1 - w, -62); ctx.closePath(); ctx.fillStyle = C(L.burn > 0 ? '#FFE08A' : '#E83A20'); ctx.fill();
      if (!FLASH && !TINT) { ctx.save(); ctx.clip(); const g = ctx.createRadialGradient(1, -62, 0, 1, -62, w); g.addColorStop(0, L.burn > 0 ? '#FFFFFF' : '#FFD080'); g.addColorStop(1, 'rgba(160,20,10,.6)'); ctx.fillStyle = g; ctx.fillRect(1 - w, -66, w * 2, 8); ctx.fillStyle = '#080404'; ctx.fillRect(1 - w * .55 + GC.look * .6, -62.5, w * 1.1, 1.1); ctx.restore(); }
      ctx.strokeStyle = C('#080404'); ctx.lineWidth = .9; ctx.stroke(); }
    else if (DET()) { ctx.fillStyle = `rgba(230,40,30,${.55 + .3 * Math.sin(t * 3)})`; ell(1, -62, 1.4, .7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; circle(-.2, -63, .5); ctx.fill(); }
    CURSE_ART.core(1, -62, 9, L, { reach: 1.2, coreR: .5 });
  }
  // the whole figure. o: { form, walk, t, lean, crook (angle), farUp (0..1), head tilt, open, kneel (0..1), book (0..1) }
  function goatLord(o) {
    const t = o.t || 0, form = o.form || 1, sw = Math.sin(o.walk || 0) * 6, kneel = o.kneel || 0, burn = Math.max(form >= 3 ? .8 : 0, GC ? GC.burn : 0), hs = form >= 3 ? 1.35 : 1;
    // crouch (0..1): the haunches dropped, gathered for a spring or taking a landing; tuck (0..1): the hooves drawn up in a leap
    const crouch = o.crouch || 0, tuck = o.tuck || 0;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const hip = [0, -40 + kneel * 18 + crouch * 12], lean = o.lean || 0;
    goatLeg(-3, hip[1], kneel ? -16 : lerp(-sw - 4 - crouch * 7, -15, tuck), -tuck * 12, '#2E2620', false);
    // the far arm: a hand open in a sign, or on the book
    const sh = [lean * 50 - 6, hip[1] - 32];
    { const up = o.farUp || 0, hx = sh[0] - 8 + up * 30, hy = sh[1] + 22 - up * 40; limb3(sh[0], sh[1], lerp(sh[0] - 8, sh[0] + 6, up), lerp(sh[1] + 12, sh[1] - 10, up), hx, hy, 6, 5, 4, GL.copeDk);
      cel(PB([hx - 3, hy + 2, hx - 2, hy - 4, hx + 2, hy - 6, hx + 5, hy - 2, hx + 3, hy + 3]), form >= 3 ? '#1C1816' : GL.skin, { d: .8, r: .4, w: 1.1 });
      if (up > .4 && (o.sign ?? 1) > 0 && DET()) { ctx.strokeStyle = `rgba(20,16,12,${up})`; ctx.lineWidth = 1.4; circle(hx + 1, hy - 1, 2.6); ctx.stroke(); } } // the ring drawn on his palm
    ctx.save(); ctx.translate(0, hip[1]); ctx.rotate(lean); ctx.translate(0, -hip[1]);
    ctx.translate(0, kneel * 18 + crouch * 12);
    cel(PB([-12, -66, 12, -66, 14, -40, 10, -20, -10, -20, -14, -40]), GL.robe, { d: 2, r: .8, w: 1.4, lite: '#3E3836', tex: () => { ctx.beginPath(); for (let i = -2; i <= 2; i++) { ctx.moveTo(i * 3, -60); ctx.quadraticCurveTo(i * 4.4, -40, i * 4 + sw * .3, -20); } ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = .8; ctx.stroke(); ctx.translate(1, 0); ctx.strokeStyle = 'rgba(110,100,94,.35)'; ctx.lineWidth = .5; ctx.stroke(); } });
    cope(sw * .4 - kneel * 2, burn, form >= 3 ? 6 : 0);
    // the morse: a gold clasp holding the cope at his breast, set with a black stone
    cel(PE(1, -62, 5, 4), '#C9982E', { d: 1, r: .6, w: 1.2, lite: '#FFE8A0', tex: () => { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; ctx.moveTo(1 + Math.cos(a) * 3.4, -62 + Math.sin(a) * 2.6); ctx.arc(1 + Math.cos(a) * 3.4, -62 + Math.sin(a) * 2.6, .45, 0, TAU); } ctx.fillStyle = 'rgba(110,70,10,.7)'; ctx.fill(); } }); ctx.fillStyle = C('#140E0A'); circle(1, -62, 2.2); ctx.fill();
    if (DET()) { ctx.fillStyle = 'rgba(200,190,210,.7)'; circle(.3, -62.8, .6); ctx.fill(); if (form >= 3) glowM(1, -62, 5, '255,140,60', .25 + .1 * Math.sin(t * 5)); }
    if (GC) goatMorse(t); // (corrupted: his weak point, the stone of the morse)
    goatHead(4, -76, 1, { horns: hs, rage: form >= 3 ? 1 : 0, open: o.open || 0, tilt: o.tilt || 0, charge: o.book ? o.charge || 0 : 0, t: o.t });
    ctx.restore();
    if (!kneel) goatLeg(3, hip[1], lerp(sw + 5 + crouch * 7, 10, tuck), -tuck * 22, '#3E342C', true);
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
      W8.crookAt = crozier(hx, hy, ca, o.crookL || 62, o.crookGlow || 0, o.charge || 0, o.t || 0);
      fist(hx, hy, form >= 3 ? '#1C1816' : GL.skin, 1.3); claws(hx, hy, ca, form); }
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
    if (W('w8bleat') || A('bleat')) { o.tilt = -.5; o.open = 1; o.farUp = .6; o.sign = 0; o.crook = -2.1; o.charge = W('w8bleat') ? sm(wind) : Math.max(0, e.w8bleatK || 0); } // (the crozier raised, the bleat gathering in its crook)
    if (A('crank')) { o.crook = -1.0; o.farUp = .5 + Math.sin(t * 8) * .4; o.lean = .1; o.sign = 0; }
    if (A('lever') || W('w8bales') || W('w8mill')) { o.farUp = .9; o.sign = 0; o.crook = -1.9; }
    if (W('w8gore')) { o.lean = .35 * wind; o.tilt = .6 * wind; }
    if (A('gore')) { o.lean = .45; o.tilt = .7; o.walk = e.walk || 0; }
    if (W('w8hands') || A('hands')) { o.crook = lerp(-1.3, 1.45, W('w8hands') ? sm(wind) : 1); o.lean = .2; o.crookGlow = 1; }
    if (W('w8close') || A('close')) { o.farUp = 1; o.sign = 1; o.crook = -2.4; o.tilt = -.3; o.open = .5; }
    if (form === 4) { o.kneel = 1; o.book = 1; o.crook = 0; if (A('curse') || W('w8curse')) { o.open = .6 + Math.sin(t * 14) * .3; o.tilt = -.15; } if (A('spent')) { o.book = .3; o.tilt = .5; o.lean = .2; } if (W('w8word') || A('word')) { o.farUp = 1; o.sign = 0; } }
    // stalking round you between blows: head low, the crozier held out before him
    if (st === 'idle' && e.w8stalk) { o.lean = .1; o.tilt = .22; o.crook = -1.0; }
    // the ram: pawing the ground, then horns down at a run; at the end he skids, and shakes his head
    if (W('w8ram')) { o.lean = .3 * wind; o.tilt = .65 * wind; o.crouch = .35 * wind; o.crook = lerp(-1.3, -2.5, sm(wind)); o.walk = Math.sin(t * 11) * .9; }
    if (A('ram')) { const ph = e.w8rph;
      if (!ph) { o.lean = .5; o.tilt = .8; o.crook = -2.6; o.crouch = .2; o.walk = e.walk || 0; }
      else if (ph === 'skid') { o.lean = -.12; o.tilt = -.15; o.crouch = .6; o.crook = .9; o.walk = .6; }
      else { o.tilt = .3 + Math.sin(t * 15) * .25; o.lean = .08; o.crouch = .25; o.crook = -1.0; } }
    // a leap (in every shape): gathered on his haunches, then up with the hooves drawn under him, then down hard on
    // the crozier's foot. A hop back is the same, smaller
    if (e.w8lp) { const lk = cl01(e.w8lk || 0), hop = e.w8hop;
      o.kneel = 0;
      if (e.w8lp === 'crouch') { o.crouch = sm(lk) * (hop ? .6 : 1); o.lean = .22 * lk; o.tilt = .35 * lk; o.crook = lerp(-1.3, -2.4, sm(lk)); o.farUp = .3 * lk; o.sign = 0; }
      else if (e.w8lp === 'air') { o.tuck = Math.min(1, lk * 5) * (1 - sm((lk - .72) / .28)) * (hop ? .6 : 1); o.lean = lerp(.25, -.12, lk); o.tilt = lerp(.1, -.3, sm(lk * 1.4)) + sm((lk - .6) / .4) * .45; o.crook = lerp(-2.5, -.8, sm(lk)); o.farUp = .8; o.sign = 0; }
      else { const u = sm(lk); o.crouch = (1 - u) * (hop ? .5 : 1); o.lean = .18 * (1 - u); o.tilt = .3 * (1 - u); o.crook = lerp(1.25, -1.3, u); o.farUp = .4 * (1 - u); o.sign = 0; } }
    if (form === 4 && e.w8m === 'kneel') { o.kneel = 1; o.tilt = .2 * (1 - cl01((e.w8t || 0) / .55)); }
    return o;
  }
  CREATURES.w8goat = function (e, a) {
    a = a || {};
    { const CL = !GC && window.CURSE_ART && CURSE_ART.look(e); if (CL) return goatCursed(e, a, CL); } // (corrupted: see goatCursed)
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
  // ---------------- the warhorses of Lorraine, painted from life ----------------
  // Built the way the Unicorn of Amber is (unicorn.js): a long head with a dished face on an arched neck, a deep chest,
  // legs of bone and joint (elbow, knee, fetlock and pastern before; stifle, hock, fetlock behind) ending in hooves, mane
  // and tail of hair in locks, modelled with soft shadow and light, inked with a fine pen. A destrier, not a mare: a
  // bridle of red leather studded with gold, a breast strap hung with bells, a war saddle, and over the back a housing
  // of Lorraine's arms (or, a bend gules, three alerions argent) with a dagged hem. Coats: a dappled grey (Corwin's),
  // a bay with black points (Ganelon's). The legs walk and gallop on a believable cycle: each foot planted and swept back
  // under the horse, then folded and carried forward; the body rocks and the head nods with the stride. Still parts are
  // painted once onto little canvases and kept. Same calling as before: horse(part, o), part 'back' (far legs, tail,
  // body, neck and head) or 'front' (near legs, housing, saddle, the rider's near leg, the reins); o: { t, walk (the
  // stride's phase, radians), gallop (0..1), coat ('grey' | 'bay'), rider, legCol, bootCol }. W8.horseLift(o) is how far
  // the saddle has moved with the stride, for the rider sitting in it.
  {
    const TAU2 = Math.PI * 2, hs = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
    const smh = (k) => k * k * (3 - 2 * k), clh = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
    const bez = (p0, p1, p2, p3, k) => { const q = 1 - k; return q * q * q * p0 + 3 * q * q * k * p1 + 3 * q * k * k * p2 + k * k * k * p3; };
    const rgbOf = (hex) => { const n = parseInt(hex.slice(1), 16); return `${n >> 16},${(n >> 8) & 255},${n & 255}`; };
    const COATS = {
      grey: { LIT: '#FBFAF6', COAT: '#E4E0DA', MID: '#C4BEB4', SHD: '#8E887E', DEEP: '#5E5850', FAR: '#A6A096', HAIR: '#EEECE8', HAIR2: '#D2CEC6', HAIRS: 'rgba(110,104,96,.8)', HOOF: '#5A524C', HOOFD: '#2A2624', MUZ: '90,80,84', EYE: '#17121A', dapple: 1 },
      bay: { LIT: '#E8AE76', COAT: '#B46E38', MID: '#8E4E24', SHD: '#5E2E14', DEEP: '#3A1A0A', FAR: '#6E3C1E', HAIR: '#2A201C', HAIR2: '#40342E', HAIRS: 'rgba(0,0,0,.6)', HOOF: '#3A3230', HOOFD: '#1A1614', MUZ: '40,26,22', EYE: '#0E0806', points: '#201814' },
    };
    const RGB = {}; for (const k in COATS) { const c = COATS[k]; RGB[k] = { SHD: rgbOf(c.SHD), DEEP: rgbOf(c.DEEP), LIT: rgbOf(c.LIT) }; }
    const SCL = 1.12, INKH = 'rgba(40,26,20,';
    // ---- path helpers (as unicorn.js) ----
    function through(pts, move) { const n = pts.length; if (move) ctx.moveTo(pts[0][0], pts[0][1]); else ctx.lineTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < n - 1; i++) { const a = pts[i], b = pts[i + 1]; ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); } ctx.lineTo(pts[n - 1][0], pts[n - 1][1]); }
    function sides(nodes) { const L = [], R = [], n = nodes.length;
      for (let i = 0; i < n; i++) { const a = nodes[Math.max(0, i - 1)], b = nodes[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, w = nodes[i][2] / 2;
        L.push([nodes[i][0] - dy / d * w, nodes[i][1] + dx / d * w]); R.push([nodes[i][0] + dy / d * w, nodes[i][1] - dx / d * w]); } return { L, R }; }
    function band(nodes) { const { L, R } = sides(nodes); ctx.beginPath(); through(L, true); through(R.slice().reverse(), false); ctx.closePath(); return { L, R }; }
    const clipDo = (path, fn) => { ctx.save(); path(); ctx.clip(); fn(); ctx.restore(); };
    function soft(x, y, r, rgb, a) { if (a <= 0) return; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.6, `rgba(${rgb},${a * .45})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
    function scumble(x0, y0, x1, y1, n, r0, r1, col, a, seed) { for (let i = 0; i < n; i++) { const u = hs(seed + i * 1.37), v = hs(seed + i * 2.71 + 9); dab(x0 + (x1 - x0) * u, y0 + (y1 - y0) * v, r0 + (r1 - r0) * hs(seed + i * .53), col, a); } }
    function pen(a, w, fn) { ctx.strokeStyle = INKH + a + ')'; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); fn(); ctx.stroke(); }
    function lock(nodes, col, shadeCol, lit) { const { L, R } = band(nodes); const n = nodes.length; ctx.fillStyle = C(col); ctx.fill(); if (!DETAIL_OK()) return;
      const at = (P, f, from = 0, to = n) => nodes.slice(from, to).map(([x, y], i) => [x + (P[i + from][0] - x) * f, y + (P[i + from][1] - y) * f]);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = shadeCol; ctx.globalAlpha = .55; ctx.lineWidth = .7; ctx.beginPath(); through(at(L, .8, 0, n - 1), true); ctx.stroke(); ctx.globalAlpha = 1;
      if (lit) { ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = .45; ctx.beginPath(); through(at(R, .45, 0, n - 2), true); ctx.stroke(); } }
    function flow(x0, y0, dx0, dy0, len, w0, wave, ph, N = 9, curl = 0) { const out = []; let x = x0, y = y0, a = Math.atan2(dy0, dx0);
      for (let i = 0; i <= N; i++) { const k = i / N; out.push([x, y, Math.max(.35, w0 * (1 - k * .92) * Math.min(1, .5 + k * 4))]); a += (Math.sin(ph + k * 4.2) * wave + curl * k) / N; x += Math.cos(a) * len / N; y += Math.sin(a) * len / N; } return out; }
    const SPR = new Map();
    function spr(key, x0, y0, w, h, fn) { // painted once at the page's resolution, kept
      if (!DETAIL_OK()) { fn(); return; }
      const M = ctx.getTransform(), sc = Math.max(.5, Math.ceil(Math.hypot(M.a, M.b) * 4) / 4), id = key + '@' + sc;
      let c = SPR.get(id);
      if (!c) { if (SPR.size > 60) { for (const v of SPR.values()) retire(v); SPR.clear(); }
        const [cc, g] = texCanvas(Math.ceil(w * sc) + 2, Math.ceil(h * sc) + 2), old = ctx; g.setTransform(sc, 0, 0, sc, -x0 * sc + 1, -y0 * sc + 1); ctx = g; try { fn(); } finally { ctx = old; } c = cc; SPR.set(id, c); }
      ctx.drawImage(c, x0 - 1 / sc, y0 - 1 / sc, c.width / sc, c.height / sc);
    }

    // ---- standing: the horse at rest, as the Unicorn idles (unicorn.js motion): it breathes, its ears flick, and at
    // random moments of its own it tosses its head, shakes its head and mane, swishes its tail, rests a hind leg, or
    // paws the ground with a foreleg. o.seed gives each horse its own clock and its own tempo; o.idleT (seconds since it
    // stopped) keeps it still for its first second or so
    function idleMotion(o) {
      const sd = o.seed || 0, t = (o.t || 0) + sd * 17.3, sp = 1 + (hs(sd * 3.1 + 1) - .5) * .3, T = t * sp;
      const ef = (p, n, d) => { const c = Math.floor(T / p), s = hs(c * 7.7 + n + sd * 31.7) * (p - d - .2), u = (T - c * p) - s; return u > 0 && u < d ? u / d : -1; }; // a brief event once in each period, at a random moment of it: its progress, or -1
      const bump = (u) => u < 0 ? 0 : Math.sin(u * Math.PI), held = (u) => u < 0 ? 0 : smh(clh(Math.sin(u * Math.PI) * 2.2));
      const wake = o.idleT === undefined ? 1 : smh(clh((o.idleT - 1.1) / .6));
      const tossU = ef(8.6, 3, 1.4), shakeU = ef(13.1, 11, 1.3), pawU = ef(11.3, 5, 2.6), swU = ef(6.1, 6, 1.2), restU = ef(17.7, 9, 6.5);
      const shk = bump(shakeU) * wake;
      return { wake, breathe: Math.sin(t * 1.25 + sd), toss: bump(tossU) * wake, shake: shk, shakeW: shk ? Math.sin((shakeU) * 26) : 0,
        paw: held(pawU) * wake, pawPh: pawU < 0 ? 0 : pawU * 2.6 * 1.55, swish: bump(swU) * wake, rest: held(restU) * wake,
        earN: bump(ef(3.3, 1, .45)) * wake, earF: bump(ef(4.1, 2, .5)) * wake, t };
    }
    // ---- the stride ----
    function gait(o) {
      const gal = clh(o.gallop || 0), p = (((o.walk || 0) / TAU2) % 1 + 1) % 1, id = clh(o.idle || 0), go = 1 - id;
      const A = (7 + 9 * gal) * go, lift = (5 + 10 * gal) * go, D = .62 - .26 * gal;
      const off = { hn: 0, fn: .25 + .27 * gal, hf: .5 - .38 * gal, ff: .75 - .33 * gal }; // walk: a four-beat; gallop: the hinds close together, then the fores
      const m = id > 0 ? idleMotion(o) : null;
      let bob = (gal * 2.4 * Math.sin(TAU2 * (p + .1)) + (1 - gal) * .7 * Math.sin(TAU2 * 2 * p)) * go;
      let pitch = gal * .05 * Math.sin(TAU2 * (p - .15)) * go + (o.rear || 0) * -.4;
      let nod = (gal * .1 * Math.sin(TAU2 * (p + .35)) + (1 - gal) * .045 * Math.sin(TAU2 * 2 * p + 1)) * go + Math.sin((o.t || 0) * .7) * .02, head = 0;
      if (m) { // at rest: the head nods slowly, comes up and back in a toss, shakes; the body breathes; a rested hind leg drops the croup a little
        nod += id * (Math.sin(m.t * .55) * .03 - m.toss * .2 + m.shakeW * m.shake * .07 + m.paw * .05);
        head = id * (-m.toss * .16 + m.shakeW * m.shake * .16 + m.paw * .08 * Math.sin(m.pawPh * TAU2));
        pitch += id * (m.rest * .012 - m.paw * .008); bob += id * (m.breathe * .25 + m.rest * .5); }
      return { gal, p, A, lift, D, off, bob, pitch, nod, head, id, m };
    }
    W8.horseLift = (o) => { const g = gait(o); return (g.bob + Math.sin(g.pitch) * 2) * SCL; };
    W8.horseGait = gait; W8.horseIdle = idleMotion;
    const bodyAt = (g, x, y) => { const c = Math.cos(g.pitch), s = Math.sin(g.pitch), yy = y + 50; return [x * c - yy * s, x * s + yy * c - 50 + g.bob]; };
    const bodyFrame = (g) => { ctx.translate(0, g.bob); ctx.translate(0, -50); ctx.rotate(g.pitch); ctx.translate(0, 50); };
    function ik(R, T, L1, L2, sgn) { const dx = T[0] - R[0], dy = T[1] - R[1], d = clh(Math.hypot(dx, dy), Math.abs(L1 - L2) + .5, L1 + L2 - .05), a = Math.atan2(dy, dx), b = Math.acos(clh((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)) * sgn;
      const J = [R[0] + Math.cos(a - b) * L1, R[1] + Math.sin(a - b) * L1], e = Math.atan2(T[1] - J[1], T[0] - J[0]); return [J, [J[0] + Math.cos(e) * L2, J[1] + Math.sin(e) * L2]]; }
    function legGeo(g, fore, x, off, near) {
      const q = ((g.p + off) % 1 + 1) % 1; let fx, fy, flex, drag = 0;
      if (q < g.D) { const u = q / g.D; fx = g.A * (1 - 2 * u); fy = 0; flex = 0; }
      else { const u = (q - g.D) / (1 - g.D); fx = -g.A + 2 * g.A * smh(u); fy = -g.lift * Math.sin(Math.PI * u) * (fore ? 1 : .8); flex = Math.sin(Math.PI * u) * (g.A > .5 ? 1 : g.A * 2); }
      if (near && g.m) { const m = g.m;
        if (fore && m.paw > 0) { // pawing: the foreleg comes up and reaches forward, strikes down, and scrapes back along the ground
          const ph = m.pawPh % 1, a = m.paw * g.id; let px, py, pf;
          if (ph < .45) { const u = ph / .45; px = -3 + 11 * smh(u); py = -(4 + 6 * Math.sin(Math.PI * u)); pf = .85; }
          else { const u = (ph - .45) / .55, dn = smh(clh(u * 3.2)); px = 8 - 11 * smh(u); py = -4 * (1 - dn); pf = .85 * (1 - dn); drag = dn * (1 - u * .5); }
          fx += (px - fx) * a; fy += (py - fy) * a; flex += (pf - flex) * a; drag *= a; }
        if (!fore && m.rest > 0) { const a = m.rest * g.id; fx += 2.4 * a; fy -= 1.6 * a; flex += .55 * a; } } // a hind leg rested: the hoof tipped on its toe, the fetlock let go
      const root = fore ? bodyAt(g, x - 1, -40) : bodyAt(g, x + 5, -38), C0 = [x + (fore ? 1 : -1.4) + fx, -3.4 + fy];
      const pa = .58 - flex * (fore ? 2.3 : 1.1), v = [Math.sin(pa) * 4.4, Math.cos(pa) * 4.4], F = [C0[0] - v[0], C0[1] - v[1]];
      const [J, F2] = ik(root, F, fore ? 19 : 20.5, fore ? 14.6 : 15.8, fore ? 1 : -1);
      const C1 = [F2[0] + v[0], F2[1] + v[1]];
      const along = (A, B, d) => { const L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1; return [A[0] + (B[0] - A[0]) / L * d, A[1] + (B[1] - A[1]) / L * d]; };
      const top = fore ? bodyAt(g, x - 2.5, -46) : bodyAt(g, x + 3, -44), top2 = fore ? root : bodyAt(g, x + 1, -38);
      const nodes = fore
        ? [[top[0], top[1], 10.5], [top2[0], top2[1], 8.4], [(root[0] + J[0]) / 2 + .3, (root[1] + J[1]) / 2, 6.2], [...along(J, root, 2.4), 5.1], [J[0], J[1], 5.4], [...along(J, F2, 2.6), 4.3], [...along(F2, J, 3.6), 3.7], [F2[0], F2[1], 4.9], [(F2[0] + C1[0]) / 2, (F2[1] + C1[1]) / 2, 3.5], [C1[0], C1[1], 3.9]]
        : [[top[0], top[1], 14], [top2[0], top2[1], 11], [(root[0] + J[0]) / 2, (root[1] + J[1]) / 2, 7.2], [...along(J, root, 2), 6], [J[0], J[1], 5.8], [...along(J, F2, 4), 4], [(J[0] + F2[0]) / 2, (J[1] + F2[1]) / 2, 3.8], [F2[0], F2[1], 4.9], [(F2[0] + C1[0]) / 2, (F2[1] + C1[1]) / 2, 3.5], [C1[0], C1[1], 3.9]];
      return { nodes, joint: J, fet: F2, foot: [C1[0], C1[1], pa], flex, drag };
    }
    function hoof(px, py, pa, col, dark) {
      ctx.save(); ctx.translate(px, py); ctx.rotate(-(pa - .62) * .8);
      ctx.beginPath(); ctx.moveTo(-2.3, -.6); ctx.lineTo(1.7, -.9); ctx.quadraticCurveTo(2.9, .4, 3.8, 1.8); ctx.lineTo(-2.6, 1.9); ctx.quadraticCurveTo(-3, .5, -2.3, -.6); ctx.closePath();
      if (DETAIL_OK()) { const gr = ctx.createLinearGradient(0, -1, 0, 2); gr.addColorStop(0, col); gr.addColorStop(1, dark); ctx.fillStyle = gr; } else ctx.fillStyle = C(col); ctx.fill(); outline(.5);
      if (DETAIL_OK()) { ctx.strokeStyle = 'rgba(255,240,220,.35)'; ctx.lineWidth = .45; ctx.beginPath(); ctx.moveTo(1.9, -.4); ctx.lineTo(3, 1.3); ctx.stroke(); }
      ctx.restore();
    }
    function leg(G, K, far, hind) {
      const shape = () => band(G.nodes), base = far ? K.FAR : K.COAT, R = RGB[K.key];
      shape(); ctx.fillStyle = C(base); ctx.fill(); outline(.55);
      if (DETAIL_OK()) clipDo(shape, () => {
        const { L, R: Rt } = sides(G.nodes);
        if (K.points) { const jy = G.joint[1], lg = ctx.createLinearGradient(0, jy - (hind ? 4 : 7), 0, jy + 4); lg.addColorStop(0, 'rgba(32,24,20,0)'); lg.addColorStop(1, K.points); ctx.fillStyle = lg; ctx.fillRect(-80, jy - 8, 160, 60); }
        ctx.filter = 'blur(0.8px)'; ctx.strokeStyle = far ? 'rgba(0,0,0,.25)' : `rgba(${R.SHD},.7)`; ctx.lineWidth = 2.4; ctx.beginPath(); through(L, true); ctx.stroke();
        if (!far) { ctx.strokeStyle = K.points ? 'rgba(255,220,180,.45)' : 'rgba(255,253,246,.85)'; ctx.lineWidth = 1.3; ctx.beginPath(); through(Rt.slice(2), true); ctx.stroke(); } ctx.filter = 'none';
        const top = G.nodes[0], tg = ctx.createLinearGradient(0, top[1], 0, top[1] + 12); tg.addColorStop(0, `rgba(${R.DEEP},${far ? .55 : .5})`); tg.addColorStop(1, `rgba(${R.DEEP},0)`); ctx.fillStyle = tg; ctx.fillRect(top[0] - 14, top[1] - 4, 28, 16);
        soft(G.joint[0] + (hind ? 2.4 : -1), G.joint[1], 2.8, R.DEEP, .2);
        if (!far) scumble(top[0] - 6, top[1], top[0] + 6, G.joint[1], 8, .8, 1.6, K.LIT, .22, top[0] * 3.1);
      });
      if (DETAIL_OK() && !far) { const n = G.nodes; pen(.3, .5, () => { const k = hind ? 5 : 4; ctx.moveTo(n[k][0], n[k][1] - 1); ctx.lineTo(n[k + 2][0] - .6, n[k + 2][1]); }); // the tendon down the back of the cannon
        const f = n[7]; ctx.fillStyle = C(K.HAIR); ctx.beginPath(); ctx.moveTo(f[0] - 2.4, f[1] - 1.5); ctx.quadraticCurveTo(f[0] - 3.8, f[1] + 2.5, f[0] - 2.8, f[1] + 4.4); ctx.quadraticCurveTo(f[0] - 1.4, f[1] + 2.6, f[0] + .6, f[1] + 1); ctx.closePath(); ctx.fill(); } // the fetlock's feather
      const [hx, hy, ha] = G.foot; hoof(hx, hy, ha, far ? K.HOOFD : K.HOOF, K.HOOFD);
    }
    // ---- the body ----
    function bodyPath() {
      ctx.beginPath(); ctx.moveTo(14, -66.5);
      ctx.bezierCurveTo(6, -64.4, -4, -61.6, -12, -62.4); ctx.bezierCurveTo(-19, -63.4, -24, -66.6, -30, -65.6); ctx.bezierCurveTo(-36, -64.4, -40.6, -60, -41.4, -53.6);
      ctx.bezierCurveTo(-42, -47.6, -39.8, -42, -36.2, -37.4); ctx.bezierCurveTo(-34.6, -35, -33, -32.4, -31.8, -29); ctx.lineTo(-24, -31);
      ctx.bezierCurveTo(-20.6, -34, -17.6, -38.4, -15.6, -41.6); ctx.bezierCurveTo(-11, -41.2, -4, -36.6, 4, -35.6); ctx.bezierCurveTo(10, -34.8, 15, -36.4, 17.2, -38.6);
      ctx.bezierCurveTo(19.4, -37, 22.4, -35.4, 25.4, -35); ctx.lineTo(27.6, -35.4); ctx.bezierCurveTo(30, -38.4, 33.6, -42.4, 34.8, -47.4); ctx.bezierCurveTo(36, -51.6, 35.2, -55.4, 32, -58.4);
      ctx.bezierCurveTo(26, -62.4, 20, -66.6, 14, -66.5); ctx.closePath();
    }
    function body(K) {
      const R = RGB[K.key];
      bodyPath(); if (DETAIL_OK()) { const g = ctx.createLinearGradient(0, -68, 0, -34); g.addColorStop(0, K.LIT); g.addColorStop(.45, K.COAT); g.addColorStop(1, K.MID); ctx.fillStyle = g; } else ctx.fillStyle = C(K.COAT); ctx.fill(); outline(.9);
      if (!DETAIL_OK()) return;
      clipDo(bodyPath, () => {
        soft(2, -30, 24, R.SHD, .75); soft(-14, -36, 12, R.SHD, .6); soft(16, -40, 10, R.DEEP, .4); soft(-38, -38, 11, R.SHD, .55); soft(30, -38, 9, R.SHD, .5); soft(-8, -46, 10, R.SHD, .22);
        soft(-26, -60, 13, R.LIT, .9); soft(4, -62, 12, R.LIT, .7); soft(24, -55, 9, R.LIT, .6);
        if (K.dapple) for (let i = 0; i < 34; i++) { const x = -38 + hs(i * 3.1) * 70, y = -62 + hs(i * 5.7) * 22, r = 1.6 + hs(i * 1.3) * 1.6; soft(x, y, r * 1.5, R.SHD, .16); soft(x, y, r, R.LIT, .55); } // dapples on the grey
        ctx.lineCap = 'round'; ctx.filter = 'blur(1.2px)'; ctx.strokeStyle = `rgba(${R.SHD},.5)`; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.moveTo(12, -63); ctx.quadraticCurveTo(18, -52, 27, -45); ctx.stroke(); ctx.beginPath(); ctx.moveTo(13, -48); ctx.quadraticCurveTo(14, -42, 17.5, -38.5); ctx.stroke();
        ctx.strokeStyle = `rgba(${R.SHD},.3)`; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-30, -52); ctx.quadraticCurveTo(-29, -44, -25, -37); ctx.stroke();
        ctx.strokeStyle = `rgba(${R.LIT},.9)`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(24, -58); ctx.quadraticCurveTo(30, -53, 31.6, -47); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-34, -60); ctx.quadraticCurveTo(-30, -63.4, -22, -64); ctx.stroke();
        ctx.filter = 'none'; scumble(-40, -66, 34, -36, 34, 1.4, 3, K.LIT, .08, 11); scumble(-40, -48, 34, -34, 20, 1.4, 2.8, K.MID, .1, 37);
      });
      pen(.35, .5, () => { ctx.moveTo(-15.6, -41.4); ctx.quadraticCurveTo(-13, -40.4, -10, -40.8); }); pen(.3, .45, () => { ctx.moveTo(17.2, -38.6); ctx.quadraticCurveTo(15.6, -41, 14.4, -43); });
    }
    // ---- the neck and head: a heavier crest than the unicorn's, a destrier's ----
    const POLL = [47.4, -91.6], HEAD_A = .99, HSC = 1.12;
    const crestAt = (k) => { const P = [[46.6, -93.6], [30, -90], [16, -74], [11, -66]]; return [bez(P[0][0], P[1][0], P[2][0], P[3][0], k), bez(P[0][1], P[1][1], P[2][1], P[3][1], k)]; };
    function neckPath() { ctx.beginPath(); ctx.moveTo(4, -63); ctx.lineTo(11, -66); ctx.bezierCurveTo(16, -74, 30, -90, 46.6, -93.6); ctx.lineTo(49.6, -89); ctx.lineTo(46, -83);
      ctx.bezierCurveTo(44.4, -72, 40, -61, 35.6, -50); ctx.bezierCurveTo(34, -47, 32, -46, 28, -47); ctx.lineTo(18, -54); ctx.closePath(); }
    function neck(K) { const R = RGB[K.key];
      neckPath(); if (DETAIL_OK()) { const g = ctx.createLinearGradient(20, -90, 42, -60); g.addColorStop(0, K.LIT); g.addColorStop(.55, K.COAT); g.addColorStop(1, K.MID); ctx.fillStyle = g; } else ctx.fillStyle = C(K.COAT); ctx.fill(); outline(.8);
      if (!DETAIL_OK()) return;
      clipDo(neckPath, () => { soft(44, -68, 10, R.SHD, .6); soft(44, -84, 6, R.SHD, .5); soft(35, -52, 9, R.SHD, .5); soft(30, -82, 10, R.LIT, .8); soft(20, -70, 9, R.LIT, .6);
        if (K.dapple) for (let i = 0; i < 10; i++) { const x = 18 + hs(i * 4.1) * 20, y = -84 + hs(i * 2.3) * 26; soft(x, y, 2.4, R.LIT, .45); }
        ctx.filter = 'blur(1px)'; ctx.strokeStyle = `rgba(${R.SHD},.5)`; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(42.4, -82); ctx.quadraticCurveTo(39.6, -68, 33.4, -55); ctx.stroke();
        ctx.strokeStyle = `rgba(${R.LIT},.8)`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(37, -82); ctx.quadraticCurveTo(33, -68, 27, -58); ctx.stroke(); ctx.filter = 'none'; scumble(14, -96, 42, -50, 18, 1.1, 2.2, K.LIT, .2, 71); });
    }
    function headPath() { ctx.beginPath(); ctx.moveTo(-1.6, -2.4); ctx.quadraticCurveTo(2, -5, 6, -5.2); ctx.bezierCurveTo(10, -5.4, 13.6, -4.6, 17.4, -4.3); ctx.bezierCurveTo(21, -4.1, 24.4, -4, 26.4, -3.2);
      ctx.bezierCurveTo(28.6, -2.3, 29.2, .2, 28.6, 1.8); ctx.quadraticCurveTo(28.2, 3, 27, 3.3); ctx.lineTo(25.6, 3.5); ctx.quadraticCurveTo(26.6, 4.5, 25.6, 5.4); ctx.quadraticCurveTo(24.2, 6, 23, 5.4);
      ctx.bezierCurveTo(19.6, 4.8, 16.4, 5.2, 13.2, 6.2); ctx.bezierCurveTo(9.4, 7.8, 6.8, 9.8, 3.6, 9.6); ctx.bezierCurveTo(.6, 9.4, -1.6, 6.8, -2.2, 3.6); ctx.quadraticCurveTo(-2.6, .4, -1.6, -2.4); ctx.closePath(); }
    function ear(x, y, a, len, col) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(-2, 0); ctx.bezierCurveTo(-2.8, -len * .45, -1.2, -len * .85, .3, -len); ctx.bezierCurveTo(1.6, -len * .7, 2.6, -len * .4, 2, 0); ctx.closePath(); ctx.fillStyle = C(col); ctx.fill(); outline(.5); ctx.restore(); }
    function headPaint(K) { const R = RGB[K.key];
      headPath(); if (DETAIL_OK()) { const g = ctx.createLinearGradient(0, -5, 0, 9); g.addColorStop(0, K.LIT); g.addColorStop(.5, K.COAT); g.addColorStop(1, K.MID); ctx.fillStyle = g; } else ctx.fillStyle = C(K.COAT); ctx.fill(); outline(.7);
      if (!DETAIL_OK()) return;
      clipDo(headPath, () => { soft(4, 4.6, 6.4, R.SHD, .5); soft(2, 9.4, 6, R.DEEP, .35); soft(15, 5, 6, R.SHD, .35); soft(12, -3, 6, R.LIT, .9); soft(22, -2.6, 5, R.LIT, .7);
        const mg = ctx.createRadialGradient(26, 1.6, 0, 26, 1.6, 6.4); mg.addColorStop(0, `rgba(${K.MUZ},.85)`); mg.addColorStop(1, `rgba(${K.MUZ},0)`); ctx.fillStyle = mg; ctx.fillRect(18, -6, 12, 14);
        if (K.points) { ctx.fillStyle = 'rgba(250,246,240,.9)'; ctx.beginPath(); ctx.moveTo(6, -5.4); ctx.quadraticCurveTo(9, -3.6, 8, -5.6); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.ellipse(8.2, -4.8, 1.6, 1, -.2, 0, Math.PI * 2); ctx.fill(); } // a star on the bay's brow
        ctx.filter = 'blur(0.6px)'; ctx.strokeStyle = `rgba(${R.SHD},.75)`; ctx.lineWidth = 1.3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-1, 2); ctx.bezierCurveTo(2.4, .6, 8, 1.6, 9.8, 5.8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(8.6, -.6); ctx.quadraticCurveTo(12, .4, 15.4, 2.8); ctx.stroke(); ctx.strokeStyle = `rgba(${R.LIT},.95)`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(9, -4); ctx.bezierCurveTo(14, -3.4, 20, -3, 25.6, -2.4); ctx.stroke(); ctx.filter = 'none';
        soft(8.8, -1.9, 3.8, R.SHD, .6); scumble(0, -5, 26, 8, 10, .8, 1.6, K.LIT, .22, 5); });
      pen(.45, .45, () => { ctx.moveTo(6, -4.7); ctx.quadraticCurveTo(8.6, -5.6, 11.4, -4.4); });
      ctx.fillStyle = 'rgba(30,20,20,.85)'; ctx.beginPath(); ctx.moveTo(24.8, -1.6); ctx.quadraticCurveTo(27, -1.8, 26.8, .4); ctx.quadraticCurveTo(26.2, 1.4, 25, .9); ctx.quadraticCurveTo(26, .2, 24.8, -1.6); ctx.closePath(); ctx.fill();
      pen(.55, .5, () => { ctx.moveTo(27, 3.4); ctx.quadraticCurveTo(25.4, 3.8, 23.6, 3.4); }); pen(.3, .4, () => { ctx.moveTo(23.2, 5.4); ctx.quadraticCurveTo(24.4, 4.7, 25.6, 4.5); });
      // the eye, large and dark, set high
      ctx.save(); ctx.translate(8.8, -1.9); ctx.rotate(-.35); ell(0, 0, 2, 1.35); ctx.fillStyle = K.EYE; ctx.fill(); ctx.fillStyle = 'rgba(110,70,40,.9)'; ell(.5, .45, 1.1, .7); ctx.fill(); ctx.fillStyle = K.EYE; ell(-.1, -.15, .95, .7); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ell(-.7, -.5, .45, .34); ctx.fill();
      pen(.9, .6, () => { ctx.moveTo(-2.2, .1); ctx.quadraticCurveTo(-.3, -1.9, 2.1, -.2); }); ctx.restore();
    }
    function bridle() { // red leather and gold studs: the headstall behind the ear, the brow band, the noseband, the cheek piece to the bit
      const strap = (pts, w) => { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = FLASH ? '#FFFFFF' : '#1E120C'; ctx.lineWidth = w + .9; ctx.beginPath(); through(pts, true); ctx.stroke(); ctx.strokeStyle = C('#9A2A1C'); ctx.lineWidth = w; ctx.stroke(); };
      strap([[1, -4.8], [1.6, 2], [3, 8.4]], 1.3); strap([[3.2, -5.2], [5.4, -4.2], [6.6, -2.8]], 1.1); strap([[19, -4.6], [19.4, .6], [19.6, 6]], 1.3); strap([[3, 6], [12, 4], [22.6, 3.6]], 1.1);
      for (const [x, y] of [[1.4, -2], [2.2, 4], [19.2, -2], [19.4, 2.6], [8, 4.8], [14, 4.1]]) { ctx.fillStyle = C('#E8C060'); ell(x, y, .65, .65); ctx.fill(); }
      ctx.fillStyle = C('#C8CCD0'); ell(23.4, 3.8, 1.3, 1.3); ctx.fill(); outline(.4); // the bit's ring
    }
    function mane(K, t, gal, ph = t * (1.9 + gal * 5)) { // the mane on the near side of the neck, lifting as he gallops (ph: its ripple's phase)
      ctx.beginPath(); { const top = [], bot = []; for (let i = 0; i <= 14; i++) { const k = i / 14, [cx, cy] = crestAt(k), wv = Math.sin(k * 23 + t * 1.6) * .6 + 2 + Math.sin(k * Math.PI) * 1.2; top.push([cx - wv * .75, cy - wv * .65]); bot.push([cx + 1.6, cy + 2.2]); } through(top, true); through(bot.reverse(), false); ctx.closePath(); }
      ctx.fillStyle = C(K.HAIR2); ctx.fill();
      for (let i = 0; i < 15; i++) { const k = .01 + i * .068, [cx, cy] = crestAt(k), len = 8 + Math.sin(k * Math.PI) * 11 + hs(i * 5.1) * 3, a = 1.95 - k * .5 - gal * .9 + (hs(i * 2.3) - .5) * .3;
        lock(flow(cx + .4, cy + .4, Math.cos(a), Math.sin(a), len, 3.8, 1.1 + gal * .6, ph - i * .8 + hs(i * 9) * 2, 7, .3 + hs(i) * .6 - gal * .5), i % 3 === 2 ? K.HAIR2 : K.HAIR, K.HAIRS, i % 2 === 0); }
    }
    function tail(K, t, gal, swish = 0, ph = t * (2.4 + gal * 6)) { const sw = Math.sin(t * 1.6) * (1 - gal) + gal * 6 + Math.sin(t * 9) * gal * 1.5 + swish * Math.sin(t * 7.5) * 3.2; // (swish: a flick of the tail now and then at rest)
      const X = [-45, -50.5 + sw * .8, -46 - gal * 10 + sw * 2.4, -50 - gal * 16 + sw * 3.4], Y = [-55, -44, -26 - gal * 10, -6 - gal * 22];
      const mid = (k) => { const q = 1 - k; return [q * q * q * X[0] + 3 * q * q * k * X[1] + 3 * q * k * k * X[2] + k * k * k * X[3], q * q * q * Y[0] + 3 * q * q * k * Y[1] + 3 * q * k * k * Y[2] + k * k * k * Y[3]]; };
      const spread = (k) => 1.2 + Math.sin(Math.PI * k ** .8) * 4.4 * (1 - k * .2), tph = ph;
      const line = (o, w0, len, ph) => { const pts = []; for (let i = 0; i <= 10; i++) { const k = i / 10 * len, [x, y] = mid(k), wv = Math.sin(ph + k * 6.5 - tph) * k * (1.2 + Math.abs(o) * .3); pts.push([x + o * spread(k) + wv, y + Math.abs(o) * k * 1.6, Math.max(.25, w0 * (1 - (i / 10) ** 1.6 * .92))]); } return pts; };
      ctx.beginPath(); through(line(-1.05, 0, 1, 0).map(p => [p[0] - .8, p[1]]), true); through(line(1.05, 0, .96, 1.4).map(p => [p[0] + .8, p[1]]).reverse(), false); ctx.closePath(); ctx.fillStyle = C(K.HAIR2); ctx.fill();
      for (let i = 0; i < 11; i++) { const o = ((i * 5) % 11 - 5) / 5, len = .7 + hs(i * 3.3) * .3; lock(line(o, 2.6, len, o * 1.4 + hs(i) * 1.5), i % 2 ? K.HAIR : K.HAIR2, K.HAIRS, i % 3 === 0); }
      ctx.fillStyle = C(K.COAT); band([[-35, -63.4, 6], [-40.5, -62, 5.6], [-43.6, -58.6, 5], [-45, -54.4, 4.2]]); ctx.fill();
    }
    // ---- the housing, the saddle, the breast strap and crupper ----
    function housingPath() { ctx.beginPath(); ctx.moveTo(14, -67.6); ctx.bezierCurveTo(4, -64.6, -6, -62, -14, -63.4); ctx.bezierCurveTo(-22, -65, -28, -67.4, -36, -65);
      ctx.lineTo(-38.6, -58); for (let i = 0; i <= 12; i++) { const x = -38 + i * 52 / 12, y = -44 + Math.sin(i / 12 * Math.PI) * 4.6; ctx.quadraticCurveTo(x + 2.2, y + 3.6, x + 4.3, y); } ctx.lineTo(18, -48); ctx.closePath(); }
    function housing() {
      housingPath(); ctx.fillStyle = C(PAL.or); ctx.fill(); outline(.9);
      if (DETAIL_OK()) clipDo(housingPath, () => {
        ctx.save(); ctx.translate(-10, -54); ctx.rotate(.42); ctx.fillStyle = PAL.gules; ctx.fillRect(-60, -5.5, 120, 11); ctx.fillStyle = PAL.argent;
        for (const k of [-24, 0, 24]) { ctx.save(); ctx.translate(k, 0); ctx.rotate(-.42); ctx.beginPath(); ctx.moveTo(-4, -2); ctx.lineTo(0, 1); ctx.lineTo(4, -2); ctx.lineTo(1.2, 1.4); ctx.lineTo(0, 4.4); ctx.lineTo(-1.2, 1.4); ctx.closePath(); ctx.fill(); ctx.restore(); } ctx.restore(); // the alerions
        soft(-12, -40, 26, '90,50,10', .45); soft(-30, -48, 12, '90,50,10', .35); soft(-6, -64, 16, '255,240,190', .55); // the cloth's modelling: shadow below, light along the back
        ctx.strokeStyle = 'rgba(110,70,16,.45)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round'; for (const x of [-30, -18, -4, 8]) { ctx.beginPath(); ctx.moveTo(x, -60); ctx.quadraticCurveTo(x - 1.6, -52, x + .6, -45); ctx.stroke(); } // folds
        ctx.strokeStyle = 'rgba(255,236,170,.6)'; ctx.lineWidth = .7; for (const x of [-28, -16, -2, 10]) { ctx.beginPath(); ctx.moveTo(x, -60); ctx.quadraticCurveTo(x - 1.2, -52, x + .9, -46); ctx.stroke(); }
      });
      ctx.strokeStyle = C('#E8C060'); ctx.lineWidth = .9; ctx.beginPath(); for (let i = 0; i <= 12; i++) { const x = -38 + i * 52 / 12, y = -44 + Math.sin(i / 12 * Math.PI) * 4.6 - 1.4; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); // the gold border along the hem
    }
    function saddle(noIron) {
      const seat = () => { ctx.beginPath(); ctx.moveTo(-15, -64); ctx.quadraticCurveTo(-15.6, -72, -12, -73); ctx.quadraticCurveTo(-11, -67, -4, -66.4); ctx.quadraticCurveTo(3, -66.4, 6, -68.6); ctx.quadraticCurveTo(8.4, -74, 10.6, -72.6); ctx.quadraticCurveTo(10.4, -66, 8, -62.6); ctx.quadraticCurveTo(-4, -61, -15, -64); ctx.closePath(); };
      seat(); if (DETAIL_OK()) { const g = ctx.createLinearGradient(0, -74, 0, -61); g.addColorStop(0, '#8A5A34'); g.addColorStop(1, '#3E2414'); ctx.fillStyle = g; } else ctx.fillStyle = C('#6A4428'); ctx.fill(); outline(.8);
      ctx.strokeStyle = C('#E8C060'); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(-13.6, -71); ctx.quadraticCurveTo(-12.4, -66.4, -4, -65.6); ctx.quadraticCurveTo(3, -65.6, 7, -70.4); ctx.stroke();
      if (noIron) return; ctx.strokeStyle = C('#3A2414'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-2, -62); ctx.lineTo(-1, -40); ctx.stroke(); ctx.strokeStyle = C('#C8CCD0'); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(-1, -40); ctx.lineTo(1.2, -38.6); ctx.lineTo(-2.8, -38.6); ctx.closePath(); ctx.stroke(); // the stirrup leather and iron
    }
    function straps(t, gal) { // the breast strap with its bells, the crupper to the dock
      const s = (pts, w, col) => { ctx.strokeStyle = FLASH ? '#FFFFFF' : '#1E120C'; ctx.lineWidth = w + .9; ctx.lineCap = 'round'; ctx.beginPath(); through(pts, true); ctx.stroke(); ctx.strokeStyle = C(col); ctx.lineWidth = w; ctx.stroke(); };
      s([[10, -63], [24, -56], [32, -52], [34.4, -48]], 1.8, '#9A2A1C'); s([[-14, -64], [-28, -64.6], [-38, -62], [-42, -57]], 1.5, '#9A2A1C');
      for (const [x, y] of [[18, -59.6], [25, -55.4], [31, -52.4]]) { const sw = Math.sin(t * 12 + x) * gal * 1.2; ctx.strokeStyle = C('#1E120C'); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sw, y + 2.4); ctx.stroke(); ctx.fillStyle = C('#E8C060'); ell(x + sw, y + 3.4, 1.2, 1.2); ctx.fill(); outline(.4); } // the bells
    }
    let BIT = null;
    function horse(part, o) {
      const K0 = COATS[o.coat] || COATS.grey, K = Object.assign({ key: COATS[o.coat] ? o.coat : 'grey' }, K0), g = gait(o), t = o.t || 0;
      ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.scale(SCL, SCL);
      const m = g.m, id = g.id, wph = (o.walk || 0) * .4; // (m: the idle motions, when he stands; id: how far he has come to rest)
      if (part === 'back') {
        leg(legGeo(g, true, 16, g.off.ff), K, true, false); leg(legGeo(g, false, -21, g.off.hf), K, true, true);
        ctx.save(); bodyFrame(g);
        tail(K, t, g.gal, m ? m.swish * id : 0, t * 2.4 + wph * 1.5);
        spr('hbody-' + K.key, -46, -70, 86, 42, () => body(K));
        ctx.save(); ctx.translate(22, -56); ctx.rotate(g.nod); ctx.translate(-22, 56);
        spr('hneck-' + K.key, 2, -101, 50, 58, () => neck(K));
        mane(K, t, g.gal + (m ? id * (m.shake * .7 + m.toss * .3) : 0), t * 1.9 + wph + (m ? m.shakeW * m.shake * 1.6 : 0));
        ctx.save(); ctx.translate(POLL[0], POLL[1]); ctx.rotate(g.nod * .6 - g.gal * .05 + g.head); ctx.scale(HSC, HSC);
        ear(-1.8, -1.6, -.3 - g.gal * .5 - (m ? id * (m.earF * .9 + m.toss * .3) : 0), 7, K.FAR);
        ctx.rotate(HEAD_A); spr('hhead-' + K.key, -4, -8, 36, 20, () => headPaint(K)); bridle();
        { const M = ctx.getTransform(); BIT = { m: M, x: 23.4, y: 3.8 }; }
        ctx.rotate(-HEAD_A); ear(.9, -2.6, -.1 - g.gal * .6 - (m ? id * (m.earN * .9 + m.toss * .3) : 0), 7.6, K.COAT);
        ctx.rotate(HEAD_A); for (let i = 0; i < 4; i++) lock(flow(.4 + i * 1.3, -4.4 + i * .1, 1, .5 + i * .12, 6 + i * 1.4, 2.8, .9 + (m ? m.shake * id * 1.4 : 0), t * 2.2 + i + (m ? m.shakeW * m.shake * 2 : 0), 6, .9), i % 2 ? K.HAIR : K.HAIR2, K.HAIRS, true);
        ctx.restore(); ctx.restore(); ctx.restore();
      } else {
        leg(legGeo(g, false, -26, g.off.hn, true), K, false, true); const NF = legGeo(g, true, 22, g.off.fn, true); leg(NF, K, false, false);
        if (NF.drag > .02 && DETAIL_OK()) for (let i = 0; i < 5; i++) { // a little dust kicked up by the scraping hoof
          const age = ((m.t * 1.9 + i / 5) % 1 + 1) % 1, hx = NF.foot[0] - 2 - age * (6 + hs(i * 3.7) * 6), hy = -.6 - age * (3 + hs(i * 5.1) * 4);
          soft(hx, hy, 1.6 + age * 3.4, '178,160,128', NF.drag * (1 - age) * .5); }
        ctx.save(); bodyFrame(g);
        spr('hhousing', -42, -70, 64, 30, () => housing());
        straps(t, g.gal); saddle(o.tack === 'rider');
        if (o.rider !== false) { limb3(-3, -66, 7, -53, 2.6, -41, 6.4, 5.4, 4.2, o.legCol || '#2A2422'); cel(PB([-.6, -43.4, 8.4, -42.4, 10, -38.8, -.8, -38.2]), o.bootCol || '#3A2618', { d: .6, r: .4, w: 1.1 }); }
        ctx.restore();
        if (BIT && o.rider !== false) { // the reins, from the bit to the rider's hand over the pommel
          const inv = ctx.getTransform().inverse(), p = inv.multiply(BIT.m).transformPoint(new DOMPoint(BIT.x, BIT.y)), h = bodyAt(g, 12, -77);
          ctx.strokeStyle = FLASH ? '#FFFFFF' : '#1E120C'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo((p.x + h[0]) / 2, Math.max(p.y, h[1]) + 6, h[0], h[1]); ctx.stroke(); ctx.strokeStyle = C('#9A2A1C'); ctx.lineWidth = .9; ctx.stroke(); }
      }
      ctx.restore();
    }
    W8.horse = horse; W8.horseCoats = COATS;
    // where the bit was drawn by the last horse('back'), in the present frame; and the saddle's seat for a rider in o's frame
    W8.horseBit = () => { if (!BIT) return null; const p = ctx.getTransform().inverse().multiply(BIT.m).transformPoint(new DOMPoint(BIT.x, BIT.y)); return [p.x, p.y]; };
    W8.horseSeat = (o, x = -3, y = -66) => { const g = gait(o), p = bodyAt(g, x, y); return [p[0] * SCL, p[1] * SCL, g]; };
  }

  // ======================================================================================================
  // ATTACKS: plans for the Circle's people and creatures, the Plough and the Goat-Lord, their tells and the hazards they
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

  // ---------------- THE HOLLOWED: THE BRANCH, its club of an arm brought down in front of it ----------------
  TELL8.w8flail = (e, t, k) => { lane(e.x, e.x + e.facing * 74, e.y, 16, k); };
  PLAN_FX.w8flail = (e) => { sfx('swing');
    act(e, 'flail', (h, dt, e) => { const k = h.el / .55; e.w8k = k;
      if (!h.hit && k > .35 && k < .62) { const f = fwdOf(e); if (f > 4 && f < 74 && Math.abs(P.y - e.y) < 18 && P.z < 40) { h.hit = 1; hitP(edmg(e), e.x, false, { kind: 'melee', e }); } }
      if (k > .5 && !h.thud) { h.thud = 1; dust(e.x + e.facing * 56, e.y, 5); sfx('slam', .4); }
      if (k >= 1) { recover(e, .8); return true; } return false; }); };
  // ---------------- THE HOLLOWED: THE ROOTS, shot out along the ground at you: the grey cold goes into whoever they hold ----------------
  TELL8.w8grab = (e, t, k) => { lane(e.x, e.x + e.facing * 90, e.y, 14, k); };
  PLAN_FX.w8grab = (e) => { sfx('growl');
    act(e, 'grab', (h, dt, e) => { const k = h.el / .5; e.w8k = k; if (k < .8) e.x += e.facing * 170 * dt;
      if (!h.hit && Math.abs(P.x - e.x) < e.hw + 16 && fwdOf(e) > -6 && Math.abs(P.y - e.y) < 15 && P.z < 30) { h.hit = 1; if (hitP(Math.round(edmg(e) * .8), e.x, false, { kind: 'melee', e })) chill(1.6, 'THE CIRCLE\'S COLD'); }
      if (k >= 1) { recover(e, 1); return true; } return false; }); };

  // ---------------- KNIFE-EARS: THE BLADE, driven straight down its lane at you ----------------
  TELL8.w8thrust = (e, t, k) => { lane(e.x + e.facing * 10, e.x + e.facing * 132, e.y, 12, k); };
  PLAN_FX.w8thrust = (e) => { sfx('whoosh');
    act(e, 'thrust', (h, dt, e) => { const k = h.el / .5; e.w8k = k; if (k < .35) e.x += e.facing * 60 * dt;
      if (!h.hit && k > .14 && k < .45) { const f = fwdOf(e); if (f > 0 && f < 132 && Math.abs(P.y - e.y) < 13 && P.z < 40) { h.hit = 1; hitP(Math.round(edmg(e) * 1.1), e.x, true, { kind: 'melee', e }); } }
      if (k >= 1) { recover(e, .7); return true; } return false; }); };
  // ---------------- KNIFE-EARS: THE LISTENING, the ears clap shut and draw you in off your feet ----------------
  TELL8.w8hook = (e, t, k) => { lane(e.x + e.facing * 20, e.x + e.facing * 110, e.y, 15, k); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(e.x + e.facing * 104, e.y - 4, 6, -1, 2); ctx.stroke(); };
  PLAN_FX.w8hook = (e) => { sfx('swing');
    act(e, 'hook', (h, dt, e) => { const k = h.el / .75; e.w8k = k;
      if (!h.hit && k > .22 && k < .42) { const f = fwdOf(e); if (f > 18 && f < 110 && Math.abs(P.y - e.y) < 15 && P.z < 30) { h.hit = 1; if (hitP(Math.round(edmg(e) * .8), e.x, true, { kind: 'melee', e })) { h.haul = 1; floatText(P.x, P.y, 80, 'DRAWN IN', '#E8C8A0', 14); } } }
      if (h.haul && k < .8 && P.state !== 'dead') { P.x += (e.x + e.facing * 34 - P.x) * Math.min(1, dt * 9); P.y += (e.y - P.y) * Math.min(1, dt * 6); }
      if (k >= 1) { recover(e, .8); return true; } return false; }); };

  // ---------------- THE CRAWLING MOUTH: THE TOOTH, spat down a line; the aim locks a moment before it spits ----------------
  AIM8.w8bolt = (e, k) => { const T0 = targets(e, () => ({ y: P.y })); if (k < .6) T0.y = P.y; };
  TELL8.w8bolt = (e, t, k) => { const T0 = e.w8T; if (!T0 || T0.plan !== e.plan) return; const y = clamp(T0.y, e.y - 40, e.y + 40), x0 = e.x + e.facing * 20, x1 = e.facing > 0 ? camX + VW : camX;
    ctx.strokeStyle = k < .6 ? `rgba(255,140,110,${.35 + .3 * k})` : `rgba(255,70,50,${.7 + .3 * Math.sin(t * 30)})`; ctx.lineWidth = k < .6 ? 1 : 2; ctx.setLineDash(k < .6 ? [4, 4] : []); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.setLineDash([]); };
  PLAN_FX.w8bolt = (e) => {
    const T0 = e.w8T && e.w8T.plan === 'w8bolt' ? e.w8T : { y: P.y }, y = clamp(T0.y, e.y - 40, e.y + 40); e.w8T = null;
    sfx('shoot'); sfx('whoosh', .5);
    projs.push({ owner: 'e', x: e.x + e.facing * 24, y, z: 40, vx: e.facing * 540, dmg: Math.round(edmg(e) * 1.05), life: 2.5, col: '#5A3A22', w8bolt: 1 });
    e.w8span = 1;
    act(e, 'bolt', (h, dt, e) => { e.w8k = h.el / .3; if (h.el > .3) { act(e, 'crank', (h2, dt2, e2) => { e2.w8k = h2.el / 1.1; if (h2.el >= 1.1) { e2.w8span = 0; recover(e2, .5); return true; } return false; }); } return false; }); };

  // ---------------- THE PROCESSION: THE LASH, all its scourges at once, three times, each a little further ----------------
  TELL8.w8lash = (e, t, k) => { lane(e.x, e.x + e.facing * 88, e.y, 16, k * .7); };
  PLAN_FX.w8lash = (e) => {
    act(e, 'lash', (h, dt, e) => { const k = h.el / 1.0; e.w8k = k; e.x += e.facing * 30 * dt;
      for (let i = 0; i < 3; i++) { const at = .2 + i * .3; if (k > at && !h['l' + i]) { h['l' + i] = 1; sfx('swing'); const f = fwdOf(e); if (f > 0 && f < 88 && Math.abs(P.y - e.y) < 17 && P.z < 45) hitP(Math.round(edmg(e) * .7), e.x, i === 2, { kind: 'melee', e }); } }
      if (k >= 1) { recover(e, .9); return true; } return false; }); };
  // ---------------- THE PROCESSION: THE FRENZY, every scourge whirled round as it comes at you ----------------
  TELL8.w8frenzy = (e, t, k) => { ring(e.x, e.y, 76, k); };
  PLAN_FX.w8frenzy = (e) => { sfx('whoosh');
    act(e, 'frenzy', (h, dt, e) => { const k = h.el / 1.4; e.w8k = k; e.x += Math.sign(P.x - e.x) * 55 * dt; e.y += Math.sign(P.y - e.y) * 25 * dt;
      h.tick = (h.tick || 0) - dt; if (h.tick <= 0) { h.tick = .35; sfx('swing', .6); if (inEll(P.x, P.y, e.x, e.y, 76) && P.z < 40) hitP(Math.round(edmg(e) * .55), e.x, false, { kind: 'melee', e }); }
      if (k >= 1) { recover(e, 1.1); return true; } return false; },
      { draw(h, t) { const e = h.e; ctx.save(); ctx.strokeStyle = 'rgba(120,40,30,.35)'; ctx.lineWidth = 2; ell(e.x, e.y, 76, 76 / 2.2); ctx.stroke(); ctx.restore(); } }); };

  // ---------------- THE HURDY-GURDY: THE DRONE, its wheel cranked hard: the note goes out of it
  // in front of him, and it hits like a wall (and leaves you half deaf, heavy on your feet) ----------------
  const cone = (e, L) => (x, y) => { const f = (x - e.x) * e.facing; return f > 0 && f < L && Math.abs(y - e.y) < 14 + f * .26; };
  TELL8.w8toll = (e, t, k) => { const L = 176; ctx.fillStyle = tellCol(k); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(e.x, e.y - 14); ctx.lineTo(e.x + e.facing * L, e.y - 14 - L * .26); ctx.lineTo(e.x + e.facing * L, e.y + 14 + L * .26); ctx.lineTo(e.x, e.y + 14); ctx.closePath(); ctx.fill(); ctx.stroke(); };
  PLAN_FX.w8toll = (e) => {
    act(e, 'toll', (h, dt, e) => { const k = h.el / .8; e.w8k = k;
      if (k > .25 && !h.rang) { h.rang = 1; tn(196, 1.4, 'sine', .14); tn(392, 1, 'sine', .06); tn(466, .8, 'triangle', .03); shakeMag = Math.max(shakeMag, 6);
        if (cone(e, 176)(P.x, P.y) && P.z < 50) { if (hitP(edmg(e), e.x, true, { kind: 'melee', e })) chill(1.6, 'DEAFENED'); }
        fx.push({ kind: 'ring', x: e.x + e.facing * 30, y: e.y, z: 40, t: .5, max: .5, r: 120, col: '#E8D098' }); }
      if (k >= 1) { recover(e, 1.1); return true; } return false; }); };
  // ---------------- THE HURDY-GURDY: THE FALL, it jumps and comes down on its belly where you stood ----------------
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

  // ---------------- THE PLOUGH: THE YOKE-CHAIN, swung and thrown down its lane: if it takes you, it hauls you in under the share ----------------
  TELL8.w8noose = (e, t, k) => { lane(e.x + e.facing * 16, e.x + e.facing * 270, e.y, 13, k); };
  PLAN_FX.w8noose = (e) => { sfx('whoosh');
    act(e, 'noose', (h, dt, e) => { const k = h.el; const reach = k < .35 ? 270 * sm(k / .35) : 270 * (1 - sm((k - .35) / .4)); h.reach = reach;
      if (!h.caught && k < .4) { const f = fwdOf(e); if (f > 0 && f < reach && Math.abs(P.y - e.y) < 13 && P.z < 45 && P.state !== 'dodge' && !(P.inv > 0)) { h.caught = 1; floatText(P.x, P.y, 86, 'CHAINED TO THE YOKE', '#E8C8A0', 15); sfx('hurt'); } }
      if (h.caught && alive()) { P.state = 'hurt'; P.t = .3; P.knocked = false; P.vx = 0; P.x += (e.x + e.facing * 44 - P.x) * Math.min(1, dt * 8); P.y += (e.y - P.y) * Math.min(1, dt * 6); h.rx = P.x; }
      if (k >= .78) { if (h.caught) { e.plan = 'w8axe'; e.w8hauled = 1; wind(e, .5); } else recover(e, .8); return true; } return false; },
      { up(h, t) { const e = h.e, x = h.caught ? (h.rx ?? P.x) : e.x + e.facing * (h.reach || 0); onMain(() => { const x0 = e.x + e.facing * 50, y0 = e.y - 64; ctx.setLineDash([3, 2]); ctx.strokeStyle = 'rgba(30,26,22,.95)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x) / 2, e.y - 34, x, e.y - 30); ctx.stroke(); ctx.strokeStyle = 'rgba(140,136,128,.95)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#5A5650'; ctx.beginPath(); ctx.moveTo(x - 4, e.y - 34); ctx.lineTo(x + 5, e.y - 30); ctx.lineTo(x - 4, e.y - 26); ctx.closePath(); ctx.fill(); }); }, uy: e.y + 1 }); };
  // ---------------- THE PLOUGH: THE SHARE, the plough on its back reared up and brought down; it bites into the ground and
  // sticks there a moment: hit him then ----------------
  TELL8.w8axe = (e, t, k) => { lane(e.x + e.facing * 6, e.x + e.facing * 110, e.y, 22, k); };
  PLAN_FX.w8axe = (e) => { sfx('whoosh'); e.w8hauled = 0;
    act(e, 'axe', (h, dt, e) => { const k = h.el / .6; e.w8k = k;
      if (!h.hit && k > .28 && k < .46) { const f = fwdOf(e); if (f > 0 && f < 112 && Math.abs(P.y - e.y) < 22 && P.z < 50) { h.hit = 1; hitP(Math.round(edmg(e) * 1.6), e.x, true, { kind: 'melee', e }); } }
      if (k > .4 && !h.bite) { h.bite = 1; shakeMag = 9; sfx('slam'); dust(e.x + e.facing * 80, e.y, 10); }
      if (k >= 1) { floatText(e.x, e.y, e.hh + 30, 'THE SHARE STICKS IN THE GROUND', '#E8D8B0', 12); recover(e, 1.5); return true; } return false; }); };
  // ---------------- THE PLOUGH: THE FURROW, thrown up out of the ground under you, full of ploughshares ----------------
  AIM8.w8gallows = (e, k) => { const T0 = targets(e, () => ({ x: xClamp(P.x), y: yClamp(P.y) })); if (k < .55) { T0.x = xClamp(P.x); T0.y = yClamp(P.y); } };
  TELL8.w8gallows = (e, t, k) => { const T0 = e.w8T; if (!T0 || T0.plan !== e.plan) return; ring(T0.x, T0.y, 36, k); };
  PLAN_FX.w8gallows = (e) => { const T0 = e.w8T && e.w8T.plan === 'w8gallows' ? e.w8T : { x: xClamp(P.x), y: yClamp(P.y) }; e.w8T = null;
    hazards.push({ kind: 'w8gallows', x: T0.x, y: T0.y, el: 0, at: .55, t: 3.2, max: 3.2, dmg: Math.round(edmg(e) * 1.2), f: e.facing }); sfx('crunch'); recover(e, .9); };
  reg('w8gallows', {
    update(h, dt) { h.el += dt; if (h.el >= h.at && !h.up) { h.up = 1; sfx('crunch'); shakeMag = Math.max(shakeMag, 7); dust(h.x, h.y, 12); if (inEll(P.x, P.y, h.x, h.y, 36) && P.z < 30) { if (hitP(h.dmg, h.x, true)) P.vz = 300; } } },
    draw(h, t) { if (h.el < h.at) ring(h.x, h.y, 36, h.el / h.at); },
    ups(h, list, t) { if (!h.up) return; list.push([h.y, () => { const u = sm((h.el - h.at) / .2) * (1 - sm((h.el - h.max + .5) / .5)); ctx.save(); ctx.translate(h.x, h.y); ctx.scale(h.f, u);
      W8.kit.cel(W8.kit.PB([-30, 0, -20, -14, -6, -20, 8, -18, 24, -10, 30, 0]), '#5A4634', { d: 2, r: .8, w: 1.4, lite: '#8A7254' }); // the furrow thrown up
      for (const [x, h2, a2] of [[-12, 40, -.3], [2, 52, .05], [16, 36, .35]]) { ctx.save(); ctx.translate(x, -8); ctx.rotate(a2); W8.kit.cel(W8.kit.PP([-5, 0, 5, 0, 2, -h2, -1, -h2 - 6, -4, -h2]), '#8E9296', { d: .8, r: .6, w: 1.2, lite: '#E2E6E8', dark: '#4E5256' }); ctx.restore(); } // ploughshares up out of it like teeth
      ctx.restore(); }]); },
    box(h, box) { box(h.x, h.y, 0, 50, 100); },
  });
  // ---------------- THE PLOUGH: THE TURN, the share dragged flat all the way round it (jump it) ----------------
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
  // ---------------- the Hurdy-Gurdy's case turns blows from the front ----------------
  const heavyM = (m) => m && (m.trump || m.power === 2 || m.launch || m.smash || m.shock || (m.key && m.key.includes('H')) || m.key === 'X');
  const msg = (e, s, col = '#E8D8B0') => { if (!(e.w8msg > performance.now())) { e.w8msg = performance.now() + 700; floatText(e.x, e.y, e.hh + 16, s, col, 12); } };
  const _strike = strike;
  strike = function (e, base, dir, m, echo) {
    m = m || {};
    if (e.type === 'w8bell' && !e.dead && (e.w8crack || 0) < 2 && !m.trump && !m.el && Math.sign(P.x - e.x) === e.facing && e.state !== 'down') {
      if (heavyM(m)) { e.w8crack = (e.w8crack || 0) + 1; sfx('hit-metal'); tn(220 + e.w8crack * 40, .9, 'sine', .1); burst(e.x, e.y, 40, MAT_COL.bronze, 10, 'rock', dir); msg(e, e.w8crack >= 2 ? 'THE CASE SPLITS OPEN' : 'SPLIT', '#F2D890'); }
      else { base *= .3; m = Object.assign({}, m, { kb: (m.kb || 0) * .2, launch: 0, noStun: 1 }); tn(147 + Math.random() * 20, .5, 'sawtooth', .04); msg(e, 'THE CASE TAKES IT'); }
    }
    if (W8.strikeGate && W8.strikeGate(e, m) === false) return;
    return _strike(e, base, dir, m, echo);
  };

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
      for (const f of m.fires) { f.lit = Math.max(0, f.lit - dt * (m.allLit ? .5 : 1)); f.flash = Math.max(0, f.flash - dt); if (f.lit > 0) m.E = Math.max(m.E, f.x + 46); }
      if (P && (P.state === 'atk' || P.state === 'air') && P.move) for (const f of m.fires) { if (f.lit > 1 || W8.inGrey(f.x, f.y)) continue; const fw = (f.x - P.x) * P.facing; if (fw > -10 && fw < (P.move.x1 || 50) + 20 && Math.abs(f.y - P.y) < 26) { f.lit = 13; f.flash = .3; sfx('hit-metal', .4); tn(520, .3, 'triangle', .05); burst(f.x, f.y, 52, ['#FFD27A', '#FF8A3A', '#FFF0C0'], 16, 'spark', 0, true); floatText(f.x, f.y, 90, 'THE FIRE HOLDS IT BACK', '#FFD890', 12); } }
      // all the fires burning at once: his blows burn too (W8.allLit, hurtEnemy below); lit together they are fed (topped up) and burn down at half the speed
      { const all = m.fires.length >= 3 && m.fires.every(f => f.lit > 0); if (all && !m.allLit && P) { for (const f of m.fires) f.lit = Math.max(f.lit, 22); floatText(P.x, P.y, 116, 'ALL THE FIRES BURN · YOUR BLOWS BURN WITH THEM', '#FFC870', 14); sfx('charge', 2); tn(392, .5, 'triangle', .05); tn(587, .6, 'triangle', .04, 0, .08); for (const f of m.fires) burst(f.x, f.y, 60, ['#FFD27A', '#FF8A3A'], 10, 'spark', 0, true); } m.allLit = all; }
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
  W8.strikeGate = (e, m) => { if (mech && mech.kind === 'w8edge' && !mech.allLit && !e.boss && W8.inGrey(e.x, e.y) && !m.trump) { m.w8grey = 1; } return true; }; // (all three fires alight: the grey shields no one)
  // a blow the grey turns aside: its damage number carries a small grey shield beside it (draw.js draws n.icon)
  { const _h = hurtEnemy; hurtEnemy = function (e, dmg, dir, m, crit) { if (!(m && m.w8grey)) return _h(e, dmg, dir, m, crit);
      dmg = Math.max(1, Math.round(dmg * .34)); const n0 = nums.length, r = _h(e, dmg, dir, m, crit);
      for (let i = n0; i < nums.length; i++) if (/^\d+!?$/.test(String(nums[i].txt))) nums[i].icon = 'shield';
      return r; }; }
  // the three watchfires all alight: +35% to every blow he lands, and an ember round him while it lasts
  W8.allLit = () => !!(mech && mech.kind === 'w8edge' && mech.allLit);
  { const _h = hurtEnemy; hurtEnemy = function (e, dmg, dir, m, crit) { if (W8.allLit() && m && !e.dead) dmg = Math.max(1, Math.round(dmg * 1.35)); return _h(e, dmg, dir, m, crit); }; }
  { const _u = updatePlayer; updatePlayer = function (dt) { _u(dt); if (P && W8.allLit() && Math.random() < dt * 14 && parts.length < 400) parts.push({ x: P.x + rand(-16, 16), y: P.y, z: P.z + rand(10, 80), vx: rand(-8, 8), vy: 0, vz: rand(30, 60), life: .6, max: .6, col: pick(['#FFD27A', '#FF8A3A', '#FFF0C0']), size: rand(1.2, 2), shape: 'star', rot: 0, vr: 3 }); }; }
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
  { const other = () => Object.keys(EDEF).filter(k => { const w = STAGES.findIndex(st => (st.waves || []).some(wv => wv.some(tp => tp.replace(/[*!]/g, '') === k))); return w !== 7 && !k.startsWith("w8") && !EDEF[k].noRandom; });
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
  Object.assign(BOSS_WIND, { w8crook: 1.0, w8bind: 1.2, w8butt: 1.0, w8bleat: .85, w8gore: 1.15, w8hands: 1.15, w8bind2: 1.4, w8close: 1.6, w8ram: 1.0 });
  const KINDS = new Set(['w8bindring', 'w8bleatring', 'w8hands', 'w8walls', 'w8bale', 'w8mill', 'w8scroll', 'w8word', 'w8lanes', 'w8mark', 'w8stamp']);
  const arenaL = () => (lockX ?? camX), arenaR = () => (lockX ?? camX) + VW;
  const ENG = W8.eng = { arm: 0, rise: 0, x: 0, y: 0 };
  const LANES = () => [0, 1, 2, 3].map(i => FLOOR_TOP + 16 + i * (FLOOR_BOT - FLOOR_TOP - 24) / 3); // (28 apart on the usual street, spread over a deeper one)
  const LK = () => (FLOOR_BOT - FLOOR_TOP - 24) / 84; // (and each lane as much wider: 1 on the usual street)
  const CURSE = ['BY THE BLOOD OF MY EYES', 'LET AMBER KNOW NO PEACE', 'LET THE DARK COME IN', 'A ROAD FOR EVERY HORROR', 'AND LET IT TAKE ROOT', 'I SAID IT · I MEANT IT'];

  // ---------------- the changes ----------------
  function startMorph(e, f) {
    e.w8from = formOf(e); e.w8form = f; e.phase = Math.min(3, f); e.state = 'w8morph'; e.w8mt = 0; e.w8mmax = f === 2 ? 2.6 : f === 3 ? 3 : 3.2; e.plan = null; e.w8T = null;
    e.rotA = 0; e.spin = 0; e.air = false; e.vz = 0; e.vx = 0; e.walk = 0; e.enraged = false; e.rageT = 0; e.rageQ = false; e.w8onEngine = 0; e.w8lift = 0; e.flash = 0;
    e.w8fl = null; e.w8lp = null; e.w8rph = null; e.w8stalk = 0; e.z = 0; e.w8mv = 2;
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
      // in the air, in a leap, a blow lands but does not stop him
      if (e.z > 6 && (e.w8fl || (e.state === 'w8act' && OWN.has(e.w8a)))) m = Object.assign({}, m, { noStun: 1 });
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
    e.w8stalk = 0; e.w8mv = (e.w8mv || 0) - dt;
    // in a leap or a hop he flies on his own line: none of the world's falling and sliding
    if (e.state === 'w8act' && OWN.has(e.w8a)) { ownTick(e, dt); return; }
    if (e.state === 'idle' && inView(e) && startMove(e)) return;
    const was = e.state, x0 = e.x, y0 = e.y, w0 = e.walk;
    _upd(e, dt);
    // between blows, instead of walking to the length of his attack and standing there, he stalks round you
    if (was === 'idle' && e.state === 'idle' && inView(e) && e.plan !== 'roar' && P.state !== 'dead') { e.x = x0; e.y = y0; e.walk = w0; steer(e, dt); }
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
  // its warning shows the whole reach of the sound: the ground darkens out to where the ring will die, and rings of
  // dust run outward along it, faster as the bleat comes
  // the warning itself is on his crozier (the bleat gathers in its crook: a6_boss.js); the floor only shows, faintly, how far it will reach
  // the breath drawn in: faint grey rings of the Circle drawing in to him from as far as the bleat will reach (no marks
  // on the floor), and in its last moments he flashes white, so the blast never comes out of nowhere
  function bleatTell(x, y, k, t, e) {
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const q = ((k * 2.2 + i / 3) % 1), R = 250 * (1 - q) + 16, a = Math.sin(q * Math.PI) * (.22 + .3 * k);
      ctx.strokeStyle = `rgba(210,204,190,${a})`; ctx.lineWidth = 1.2 + 2 * k; ell(x, y, R, R / 2.2); ctx.stroke(); }
    ctx.restore();
    if (e && k > .72) e.flash = Math.floor(t * 16) % 2 ? .05 : 0;
  }
  TELL_FX.w8bleat = (e, t, k) => { bleatTell(e.x, e.y, k, t); };
  // the same warning when he bleats without a wind-up of his own (at the engine, and when spent): he throws his head back first
  function bleatWarn(e, after) { e.w8a = 'bleat'; e.state = 'w8act'; hazards.push({ kind: 'w8bleattell', e, x: e.x, y: e.y, t: 1.3, max: 1.3, after }); sfx('charge', .6); tn(70, 1.2, 'sawtooth', .04, 140); } // (a longer breath, with a rising groan under it)
  W8.bleatWarn = bleatWarn; // (for tests: make him bleat)
  reg('w8bleattell', { update(h, dt) { h.x = h.e.x; h.y = h.e.y; h.e.w8bleatK = 1 - h.t / h.max; if (h.t <= dt + .001 && !h.done) { h.done = 1; h.e.w8bleatK = 0; if (!h.e.dead) { PLAN_FX.w8bleat(h.e); if (h.after) h.after(h.e); } } },
    draw(h, t) { bleatTell(h.x, h.y, 1 - h.t / h.max, t, h.e); } });
  PLAN_FX.w8bleat = (e) => { sfx('roar'); tn(180, .6, 'sawtooth', .06, 120);
    hazards.push({ kind: 'w8bleatring', x: e.x, y: e.y, r: 10, t: 1, max: 1, dmg: Math.round(edmg(e) * .9) }); act(e, 'bleat', (h, dt, e) => { e.w8k = h.el; if (h.el > .6) { recover(e, .9); return true; } return false; }); };
  // the ring: a heavy blow, but never more than a third of his health, so it cannot kill from full
  reg('w8bleatring', {
    update(h, dt) { h.r += 300 * dt; if (!h.hit) { const d = Math.hypot(P.x - h.x, (P.y - h.y) * 2.2); if (Math.abs(d - h.r) < 14 && P.z < 12) { h.hit = 1; hitP(Math.max(h.dmg, Math.round(maxHp() * .55)), h.x, true); } } if (h.r > 260) h.t = -1; },
    draw(h, t) { ctx.save(); ctx.strokeStyle = 'rgba(30,24,20,.7)'; ctx.lineWidth = 4; ell(h.x, h.y, h.r, h.r / 2.2); ctx.stroke(); ctx.strokeStyle = 'rgba(232,220,196,.6)'; ctx.lineWidth = 1.4; ell(h.x, h.y, h.r - 3, (h.r - 3) / 2.2); ctx.stroke(); ctx.restore(); },
  });

  // ================= HOW HE GOES ABOUT THE FIELD (every shape) =================
  // he is a goat, and he does not stand and wait for you. Between blows he stalks round you at the length of his next
  // one. He crosses the field in a bound and comes down beside you, or over you, with a stamp that runs out along the
  // ground (the spot he will land on is marked from the moment he gathers himself, the reach of the stamp with it: jump
  // the ring). Crowded, he hops back out of your reach to cast, and against the edge of the field he bounds over you to
  // the open side. From across the field he paws the ground and rams straight through where you stand and out past you.
  // After each bound or ram he is a moment finding his feet: that is your opening. (Up on his engine he bounds onto it
  // and off it; on his knees with his book he gets up between readings and bounds to another place to read from.)
  const OWN = new Set(['leap', 'hop']);
  const CAST = new Set(['w8bind', 'w8bind2', 'w8hands', 'w8close']);
  const inX = (x) => clamp(x, arenaL() + 50, arenaR() - 50), inY = (y) => clamp(y, FLOOR_TOP + 14, FLOOR_BOT - 6);
  const inView = (e) => e.x >= camX + 26 + e.hw && e.x <= camX + VW - 26 - e.hw;
  const STAMP_R = 120;
  // a leap, kept in e.w8fl: he gathers himself (cr s), flies (fl s) in an arc H high, and comes down
  function leapStart(e, x1, y1, o = {}) {
    const L = e.w8fl = Object.assign({ x0: e.x, y0: e.y, z0: e.z || 0, x1, y1, z1: 0, H: 130, cr: .5, fl: .7, el: 0, wave: 1 }, o);
    e.w8hop = !!o.hop; e.w8lp = 'crouch'; e.w8lk = 0;
    if (!o.face) e.facing = Math.sign(x1 - e.x) || e.facing;
    if (o.mark !== false && o.mark !== 0) hazards.push({ kind: 'w8mark', e, L, x: x1, y: y1, t: L.cr + L.fl, max: L.cr + L.fl, r: L.wave ? 40 : 28, R: L.wave ? STAMP_R : 0 });
    sfx('growl'); return L;
  }
  // one frame of it: 'crouch', 'air', 'land' (the frame he comes down), or 'none'
  function leapStep(e, dt) {
    const L = e.w8fl; if (!L) return 'none'; L.el += dt;
    if (L.face) e.facing = Math.sign(P.x - e.x) || e.facing;
    if (L.el < L.cr) { const k = sm(L.el / L.cr); e.w8lp = 'crouch'; e.w8lk = L.el / L.cr; e.sqx = 1 + .08 * k; e.sqy = 1 - .1 * k; if (Math.random() < .3) dust(e.x + rand(-12, 12), e.y, 1); return 'crouch'; }
    const u = (L.el - L.cr) / L.fl;
    if (u < 1) { if (!L.up) { L.up = 1; sfx('whoosh'); for (let i = 0; i < 7; i++) dust(e.x + rand(-16, 16), e.y, 1); e.sqx = .86; e.sqy = 1.16; }
      e.w8lp = 'air'; e.w8lk = u; e.x = lerp(L.x0, L.x1, u); e.y = lerp(L.y0, L.y1, u); e.z = lerp(L.z0, L.z1, u) + Math.sin(u * Math.PI) * L.H; return 'air'; }
    e.x = L.x1; e.y = L.y1; e.z = L.z1; e.w8fl = null; e.w8lp = null; e.w8hop = false;
    e.sqx = L.wave ? 1.3 : 1.15; e.sqy = L.wave ? .7 : .85; sfx('slam', L.wave ? 1 : .4); shakeMag = Math.max(shakeMag, L.wave ? 7 : 2.5);
    for (let i = 0; i < (L.wave ? 14 : 5); i++) dust(e.x + rand(-24, 24), e.y + rand(-4, 4), 1);
    if (L.wave) stamp(e, L.x1, L.y1);
    return 'land';
  }
  // where he will come down: the hoof-ring, and (dashed) how far the stamp will run out
  reg('w8mark', {
    update(h, dt) { if (h.e.w8fl !== h.L) h.t = -1; },
    draw(h, t) { const k = 1 - h.t / h.max; ring(h.x, h.y, h.r, k);
      if (h.R) { ctx.save(); ctx.setLineDash([4, 5]); ctx.strokeStyle = `rgba(232,220,196,${.2 + .4 * k})`; ctx.lineWidth = 1.2; ell(h.x, h.y, h.R, h.R / 2.2); ctx.stroke(); ctx.restore(); }
      ctx.fillStyle = `rgba(30,22,18,${.3 + .4 * k})`; for (const s of [-1, 1]) { ell(h.x + s * 4, h.y, 2.6, 1.6); ctx.fill(); } },
  });
  // the stamp: a ring of dust and cracked ground running out from where he lands (moderate: jump it, or be out of it)
  function stamp(e, x, y) { hazards.push({ kind: 'w8stamp', x, y, r: 24, R: STAMP_R, el: 0, t: 1, max: 1, dmg: Math.min(Math.round(edmg(e) * .6), Math.round(maxHp() * .2)) });
    fx.push({ kind: 'ring', x, y, z: 2, t: .3, max: .3, r: 50, col: '#E8DCC4', flat: 1 }); ash(x, y, 4, 8); }
  reg('w8stamp', {
    update(h, dt) { h.el += dt; const u = cl01(h.el / .4); h.r = lerp(24, h.R, u);
      if (!h.hit && alive()) { const d = Math.hypot(P.x - h.x, (P.y - h.y) * 2.2);
        if ((h.el < .06 && d < 40 && P.z < 30) || (u < 1 && Math.abs(d - h.r) < 16 && P.z < 12)) { h.hit = 1; hitP(h.dmg, h.x, true); } }
      if (h.el > .75) h.t = -1; },
    draw(h, t) { const a = 1 - cl01((h.el - .3) / .45); ctx.save();
      ctx.strokeStyle = `rgba(58,46,34,${.75 * a})`; ctx.lineWidth = 5; ell(h.x, h.y, h.r, h.r / 2.2); ctx.stroke();
      ctx.strokeStyle = `rgba(226,214,190,${.6 * a})`; ctx.lineWidth = 1.4; ell(h.x, h.y, h.r - 3, (h.r - 3) / 2.2); ctx.stroke();
      ctx.strokeStyle = `rgba(24,18,14,${.6 * a})`; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 8; i++) { const an = i / 8 * TAU + .3, r0 = 14, r1 = Math.min(h.r, 46) * (.7 + hsh(i) * .4); ctx.moveTo(h.x + Math.cos(an) * r0, h.y + Math.sin(an) * r0 / 2.2); ctx.lineTo(h.x + Math.cos(an + .15) * r1, h.y + Math.sin(an + .15) * r1 / 2.2); } ctx.stroke();
      ctx.restore(); },
  });
  // in his first and third shapes a leap is an attack of his own: the leap, then a moment finding his feet
  function bound(e, x1, y1, o = {}) {
    x1 = inX(x1); y1 = inY(y1); const rec = o.rec ?? (formOf(e) === 3 ? .7 : .9);
    let L, landAt = -1;
    act(e, o.hop ? 'hop' : 'leap', (h, dt, e) => {
      if (landAt < 0) { if (leapStep(e, dt) !== 'land') return false; landAt = h.el; }
      e.w8lp = 'land'; e.w8lk = (h.el - landAt) / rec; e.w8hop = !!o.hop; if (o.hop) e.facing = Math.sign(P.x - e.x) || e.facing;
      if (h.el - landAt >= rec) { e.w8lp = null; e.w8hop = false; e.state = 'idle'; e.cd = o.cd ?? Math.max(.25, Math.min(e.cd, .4)); return true; }
      return false; });
    L = leapStart(e, x1, y1, o); return L;
  }
  // a leap's frame, outside the world's physics (its timers still run)
  function ownTick(e, dt) {
    decay(e, dt);
    e.cd -= dt * [1, 1.35, 1.7][e.phase - 1]; e.closeCd = Math.max(0, (e.closeCd || 0) - dt); e.rageT = Math.max(0, (e.rageT || 0) - dt); e.enraged = e.rageT > 0;
    if (!e.w8fl && e.w8lp !== 'land') e.z = Math.max(0, e.z - dt * 300);
  }
  // what he does next, when he is free to choose: true if he has set off on something
  function startMove(e) {
    if (e.w8mv > 0 || P.state === 'dead' || e.rageQ || e.plan === 'roar' || stillT > 0) return false;
    if (!e.plan) e.plan = pick(e.def.p1);
    const f = formOf(e), dx = P.x - e.x, adx = Math.abs(dx), ady = Math.abs(P.y - e.y), sk = f === 3 ? .8 : 1;
    const mv = (a, b) => { e.w8mv = rand(a, b) * sk; return true; };
    const want = Math.max(150, e.def.reach * .75 + e.hw * .5), back = Math.sign(e.x - P.x) || 1;
    const crowded = adx < e.hw + 60 && ady < 40;
    if (crowded) {
      if (e.cd <= 0 && (e.closeCd || 0) <= 0) return false;
      if (!CAST.has(e.plan) && Math.random() < .25) { e.w8mv = .9; return false; }
      // he backs off to keep his distance: a hop back, or, with the edge of the field at his back, a bound over you
      const tx = P.x + back * want;
      if (tx > arenaL() + 50 && tx < arenaR() - 50) { bound(e, tx, e.y + rand(-18, 18), { hop: 1, face: 1, H: 46, cr: .22, fl: .45, wave: 0, mark: 0, rec: .25, cd: 0 }); return mv(1.6, 2.4); }
      bound(e, P.x - back * want, P.y + rand(-12, 12), { H: 128, cr: .55, fl: .75 }); return mv(2.4, 3.4);
    }
    const r = Math.random();
    if (adx > 300 || r < .3) { // a bound: across the field to you, landing beside you or, now and then, over you
      const over = Math.random() < .4, sd = back * (over ? -1 : 1); let tx = P.x + sd * 115;
      if (tx < arenaL() + 50 || tx > arenaR() - 50) tx = P.x - sd * 115;
      bound(e, tx, P.y + rand(-14, 14), { H: adx > 260 ? 128 : 110, cr: f === 3 ? .45 : .55, fl: adx > 260 ? .8 : .65 }); return mv(2.4, 3.4);
    }
    if (adx > 150 && adx < 420 && ady < 60 && r < .62) { e.plan = 'w8ram'; e.w8T = null; e.facing = Math.sign(dx) || e.facing; wind(e, 1); return mv(3, 4); }
    e.w8mv = rand(.5, 1.1); return false;
  }
  // between blows: he lines up his next at its length (going round you to the open side if the edge of the field is at
  // his back), and while it is not yet ready he stalks round you there, sidelong, never standing still
  function steer(e, dt) {
    const dx = P.x - e.x, dy = P.y - e.y, want = e.def.reach * .75 + e.hw * .5, lo = camX + 26 + e.hw, hi = camX + VW - 26 - e.hw;
    let side = e.w8sideP === e.plan && e.w8side ? e.w8side : (Math.sign(e.x - P.x) || 1);
    if (P.x + side * want < lo || P.x + side * want > hi) side = -side;
    e.w8side = side; e.w8sideP = e.plan;
    const tx = clamp(P.x + side * want, lo, hi), crossing = Math.sign(e.x - P.x) !== side && Math.abs(dx) < 60;
    e.w8orb = (e.w8orb || 0) + dt * 1.4;
    if (e.cd > 0) { e.w8stalk = 1; approach(e, tx + Math.cos(e.w8orb) * 24 * side, inY(P.y + Math.sin(e.w8orb) * 42 + (crossing ? 50 : 0)), dt, 1.25); e.facing = Math.sign(P.x - e.x) || e.facing; return; }
    if (Math.abs(e.x - tx) < 12 && Math.abs(dy) < 8) { e.facing = Math.sign(dx) || e.facing; wind(e, e.def.wind); return; }
    approach(e, tx, inY(P.y + (crossing ? 50 : 0)), dt, 1.4); e.facing = Math.sign(P.x - e.x) || e.facing;
  }
  // THE RAM: he paws the ground with his head down (the lane he will take shows, out past you), then runs straight
  // through where you stand and on beyond; he skids, and stands a moment shaking his horns (hit him then)
  W8.AIM8.w8ram = (e, k) => { const T0 = (e.w8T && e.w8T.plan === 'w8ram') ? e.w8T : (e.w8T = { plan: 'w8ram', x1: e.x, dir: e.facing });
    if (k < .55) { e.y += clamp(P.y - e.y, -1, 1); const d = Math.sign(P.x - e.x) || T0.dir; T0.dir = d; T0.x1 = clamp(P.x + d * 150, arenaL() + 40, arenaR() - 40); }
    if (Math.random() < .25) dust(e.x - T0.dir * 14, e.y, 1); };
  TELL_FX.w8ram = (e, t, k) => { const T0 = e.w8T; if (!T0 || T0.plan !== 'w8ram') return; lane(e.x, T0.x1, e.y, 20, k); label((e.x + T0.x1) / 2, e.y - 26, 'THE RAM', .5 + .5 * k); };
  PLAN_FX.w8ram = (e) => { const T0 = e.w8T && e.w8T.plan === 'w8ram' ? e.w8T : { x1: e.x + e.facing * 300 }; e.w8T = null;
    const x1 = T0.x1, dir = Math.sign(x1 - e.x) || e.facing, sp = formOf(e) === 3 ? 560 : 500; let ph = 0, t0 = 0; sfx('roar'); e.w8rph = null;
    act(e, 'ram', (h, dt, e) => { e.facing = dir;
      if (!ph) { e.walk += dt * 18; e.x += dir * sp * dt; if (Math.random() < .8) dust(e.x - dir * 18, e.y, 1);
        if (!h.hit && Math.abs(P.x - e.x) < e.hw + 16 && Math.abs(P.y - e.y) < 22 && P.z < 30) { h.hit = 1; hitP(Math.min(Math.round(edmg(e) * 1.05), Math.round(maxHp() * .25)), e.x, true, { kind: 'melee', e }); }
        if ((x1 - e.x) * dir <= 0 || e.x < arenaL() + 30 || e.x > arenaR() - 30 || h.el > 2) { e.x = clamp(e.x, arenaL() + 30, arenaR() - 30); ph = 1; t0 = h.el; sfx('slam', .5); shakeMag = Math.max(shakeMag, 3); } return false; }
      if (ph === 1) { const u = (h.el - t0) / .35; e.w8rph = 'skid'; e.x = clamp(e.x + dir * sp * .4 * (1 - u) * dt, arenaL() + 30, arenaR() - 30); if (Math.random() < .9) dust(e.x + dir * 12, e.y, 1); if (u >= 1) { ph = 2; t0 = h.el; } return false; }
      e.w8rph = 'reel'; if (h.el - t0 > .85) { e.w8rph = null; recover(e, .2); return true; } return false; },
      { draw(h, t) { if (!ph) lane(h.e.x, x1, h.e.y, 20, .6); } }); };

  // ================= SECOND SHAPE: THE TITHE OF LORRAINE =================
  // up on his engine he throws what the Circle took (burning hay, millstones); after three throws he must come down
  // and wind it, and then he is in reach
  function titheStep(e, dt) {
    decay(e, dt); e.state = 'w8act'; e.w8a = e.w8m === 'crank' ? 'crank' : 'tithe';
    ENG.x = arenaL() + VW * .72; ENG.y = FLOOR_TOP + 14; ENG.rise = Math.min(1, ENG.rise + dt);
    e.w8t = (e.w8t || 0) + dt;
    if (e.w8m === 'toEngine') { const tx = ENG.x, ty = ENG.y + 2; e.facing = Math.sign(P.x - e.x) || e.facing;
      // from the windlass (or anywhere on the field) he goes up onto his engine in one bound
      if (Math.abs(e.x - tx) > 30 || Math.abs(e.y - ty) > 12) { e.w8m = 'leapUp'; e.w8onEngine = 0; e.w8lift = 0; leapStart(e, tx, ty, { z1: 36, H: 70, cr: .4, fl: .6, wave: 0, mark: 0 }); return; }
      if (Math.abs(e.x - tx) > 6 || Math.abs(e.y - ty) > 4) { e.x += Math.sign(tx - e.x) * Math.min(Math.abs(tx - e.x), 140 * dt); e.y += Math.sign(ty - e.y) * Math.min(Math.abs(ty - e.y), 60 * dt); e.walk += dt * 9; return; }
      e.w8lift = Math.min(36, (e.w8lift || 0) + dt * 120); if (e.w8lift >= 36) { e.w8onEngine = 1; e.w8m = 'volley'; e.w8t = 0; e.w8vol = 0; } return; }
    if (e.w8m === 'leapUp') { if (leapStep(e, dt) === 'land') { e.z = 0; e.w8lift = 36; e.w8onEngine = 1; e.w8m = 'volley'; e.w8t = 0; e.w8vol = 0; sfx('crunch'); } return; }
    if (e.w8m === 'volley') { e.facing = Math.sign(P.x - e.x) || e.facing; e.w8lift = 36; e.w8onEngine = 1; e.z = 0;
      // he paces the platform between throws, from one end of it to the other
      e.w8pace = (e.w8pace || 0) + dt * 1.6; const px = ENG.x + Math.sin(e.w8pace) * 20; e.walk += Math.abs(px - e.x) * .35; e.x = px; e.y = ENG.y + 2;
      ENG.arm = Math.max(0, ENG.arm - dt * .9);
      if (e.w8t > (e.w8vol ? 2.2 : 1) && !hazards.some(h => h.kind === 'w8lanes' || (h.kind === 'w8bale' && !h.landed) || h.kind === 'w8mill')) { e.w8t = 0;
        if (e.w8vol >= (e.w8cyc >= 3 ? 3 : 2)) { e.w8m = 'down'; return; }
        e.w8vol++; (e.w8vol % 2 ? throwBales : throwMills)(e); }
      return; }
    // his throws spent, he leaps down off the engine at you (where he will land is marked, and the stamp's reach), finds
    // his feet (hit him), and hops across to the windlass to wind it
    if (e.w8m === 'down') { const sd = Math.sign(ENG.x - P.x) || 1; let tx = P.x + sd * 100; if (tx < arenaL() + 50 || tx > arenaR() - 50) tx = P.x - sd * 100;
      e.z = e.w8lift || 36; e.w8lift = 0; leapStart(e, inX(tx), inY(P.y), { H: 80, cr: .55, fl: .7 }); e.w8m = 'leapDown'; return; }
    if (e.w8m === 'leapDown') { const r = leapStep(e, dt); e.w8onEngine = r === 'crouch' ? 1 : 0; if (r === 'land') { e.w8m = 'landed'; e.w8t = 0; e.w8lp = 'land'; } return; }
    if (e.w8m === 'landed') { e.w8lp = 'land'; e.w8lk = e.w8t / .9; e.facing = Math.sign(P.x - e.x) || e.facing;
      if (e.w8t > .9) { e.w8lp = null; e.w8m = 'toWindlass'; leapStart(e, ENG.x - 40, ENG.y + 6, { H: 44, cr: .25, fl: .5, wave: 0, mark: 0 }); } return; }
    if (e.w8m === 'toWindlass') { if (leapStep(e, dt) === 'land') { e.w8m = 'crank'; e.w8t = 0; e.w8onEngine = 0; floatText(e.x, e.y, e.hh + 40, 'HE WINDS THE ENGINE · NOW', '#FFE0A0', 15); sfx('crunch'); } return; }
    if (e.w8m === 'crank') { e.facing = 1; e.w8onEngine = 0; ENG.arm = 0; ENG.wind = (ENG.wind || 0) + dt; if (Math.random() < dt * 4) sfx('hit-metal', .2);
      if (Math.abs(P.x - e.x) < e.hw + 30 && Math.abs(P.y - e.y) < 30 && (e.closeCd || 0) <= 0) { e.closeCd = 3; e.w8m = 'bleatC'; e.w8t = 0; bleatWarn(e, (e) => { e.state = 'w8act'; e.w8a = 'crank'; }); }
      e.closeCd = Math.max(0, (e.closeCd || 0) - dt);
      if (e.w8t > 6) { e.w8m = 'toEngine'; e.w8t = 0; } return; }
    if (e.w8m === 'bleatC') { if (e.w8t > 1.7) { e.w8m = 'crank'; e.w8t = 1.2; } }
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
    draw(h, t) { const k = cl01(h.el / h.wait); for (const y of h.ys) { lane(arenaL(), h.from + 20, y, 18 * LK(), k); label(arenaL() + 70, y + 3, '◀ MILLSTONE', .7 * k); } },
  });
  reg('w8mill', {
    update(h, dt) { h.x += h.vx * dt; h.rot += h.vx * dt / 22; if (Math.random() < .6) dust(h.x + 16, h.y, 1); shakeMag = Math.max(shakeMag, 1.5);
      if (!h.hit && Math.abs(P.x - h.x) < 22 && Math.abs(P.y - h.y) < 18 * LK() && P.z < 46) { h.hit = 1; hitP(h.dmg, h.x + 20, true); }
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
      else if (e.w8t > 1 && !busy) { e.w8begun = 0; e.w8t = 0; if (Math.abs(P.x - e.x) < 130 && Math.abs(P.y - e.y) < 50) { shiftSpot(e); e.w8then = 'word'; } else e.w8m = 'word'; } return; }
    if (e.w8m === 'word') { e.w8a = 'word';
      if (!e.w8begun) { e.w8begun = 1; e.w8t = 0; words(e); }
      else if (e.w8t > .6 && !busy) { e.w8m = 'spent'; e.w8begun = 0; e.w8t = 0; floatText(e.x, e.y, e.hh + 50, 'HE IS SPENT · NOW', '#FFE0A0', 15); } return; }
    if (e.w8m === 'spent') { e.w8a = 'spent';
      if (Math.abs(P.x - e.x) < e.hw + 40 && Math.abs(P.y - e.y) < 30 && e.w8t > 1.6 && !(e.w8bl > 0)) { e.w8bl = 1; bleatWarn(e, (e) => { e.state = 'w8act'; e.w8a = 'spent'; }); }
      if (e.w8t > 3.4 && !hazards.some(h => h.kind === 'w8bleattell' && h.e === e)) { e.w8bl = 0; shiftSpot(e); } }
    // he gets up off his knees and bounds to another place to read from, and kneels again
    if (e.w8m === 'shift') { e.w8a = 'shift'; if (leapStep(e, dt) === 'land') { e.w8m = 'kneel'; e.w8t = 0; } return; }
    if (e.w8m === 'kneel') { e.w8a = 'kneel'; if (e.w8t > .55) { e.w8m = e.w8then || 'curse'; e.w8then = null; e.w8t = 0; } return; }
  }
  function shiftSpot(e) {
    const xs = [.2, .5, .8].map(u => arenaL() + VW * u).filter(x => Math.abs(x - e.x) > 90);
    const x = xs.reduce((b, x) => Math.abs(x - P.x) > Math.abs(b - P.x) ? x : b, xs[0]);
    e.w8m = 'shift'; e.w8t = 0; leapStart(e, x, rand(FLOOR_TOP + 24, FLOOR_TOP + 56), { H: 120, cr: .6, fl: .75 });
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
      for (const s of h.rolls) { s.x += s.dir * 380 * dt; const x0 = s.x - (s.dir > 0 ? 230 : 0), x1 = s.x + (s.dir > 0 ? 0 : 230); if (!s.hit && P.x > x0 && P.x < x1 && Math.abs(P.y - s.y) < 13 * LK() && P.z < 70) { s.hit = 1; hitP(h.dmg, s.x, true); } }
      if (h.plan.every(p => p.go) && h.rolls.every(s => (s.dir > 0 ? s.x - 230 > arenaR() + 20 : s.x + 230 < arenaL() - 20))) h.t = -1; },
    draw(h, t) { for (const p of h.plan) if (!p.go && h.el > p.at - .2) { const k = cl01((h.el - p.at) / 1.5); for (const i of p.lanes) { lane(arenaL(), arenaR(), h.ls[i], 13 * LK(), k); label(p.dir > 0 ? arenaL() + 80 : arenaR() - 80, h.ls[i] + 3, p.dir > 0 ? '▶' : '◀', .9 * k); } } },
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
    w8hollow: ['w8rise'], w8halberd: ['w8march'], w8xbow: ['w8march'], w8flag: ['w8march'], w8bell: ['w8march'], w8crow: ['w8swoop'], w8egg: ['w8rollin'], w8hangman: ['w8furrow'],
  });
  const edgeIn = (e, n, dur) => { n.x1 = entranceSpot(e); n.dir = P.x > n.x1 ? 1 : -1; n.x0 = n.dir > 0 ? camX - 40 : camX + VW + 40; if (Math.abs(n.x1 - n.x0) < 120) n.x1 = n.x0 + n.dir * 160; e.x = n.x0; e.facing = n.dir; n.y = yC(e.y); };
  if (typeof ENTER_FX !== 'undefined') Object.assign(ENTER_FX, {
    // a hollow: a grey hand comes up out of the snow (or the ash), and the rest of it after, as if out of water
    w8rise: { max: 1.5, start(e, n) { if (!n.keep) e.x = entranceSpot(e); sfx('crunch'); },
      update(e, n, dt) { if (Math.random() < .4) dust(e.x + rand(-10, 10), e.y, 1); if (n.t > .3 && !n.s) { n.s = 1; sfx('growl'); } return n.t >= n.max; },
      draw(e, n, t, inner) { const k = sm((n.t - .15) / 1.2); ctx.save(); ctx.fillStyle = 'rgba(40,36,32,.45)'; ell(e.x, e.y, 18, 5); ctx.fill(); ctx.beginPath(); ctx.rect(e.x - 80, e.y - 200, 160, 201); ctx.clip(); ctx.translate(0, (1 - k) * e.hh * 1.05); inner(); ctx.restore(); } },
    // they come in from the edge of the field to a slow drum (Knife-Ears, the Mouth, the Procession, the Hurdy-Gurdy)
    w8march: { max: 1.6, keepFace: 1, start(e, n) { edgeIn(e, n); let k = 0; const drum = () => { if (k++ < 4 && sfxOn && actx) { tn(90, .12, 'sine', .12, 60); setTimeout(drum, 300); } }; drum(); },
      update(e, n, dt) { const k = cl01(n.t / n.max); e.x = lerp(n.x0, n.x1, k); e.walk += dt * 9; return n.t >= n.max; },
      draw(e, n, t, inner) { inner(); } },
    // (unused now: something let down out of the sky on a rope)
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
    // the plough comes in from the edge of the field at a lumbering run, cutting a furrow behind it
    w8furrow: { max: 2, keepFace: 1, start(e, n) { edgeIn(e, n); sfx('roar'); banner('The Plough of the Circle', 'IT STILL PLOUGHS THE FIELD IT WAS YOKED TO', 2.2); },
      update(e, n, dt) { const k = cl01(n.t / 1.7); e.x = lerp(n.x0, n.x1, sm(k)); e.walk += dt * 6; if (Math.random() < .8) dust(e.x - n.dir * 30, e.y, 2); if (k >= 1 && !n.l) { n.l = 1; shakeMag = 9; sfx('slam'); } return n.t >= n.max; },
      draw(e, n, t, inner) { ctx.strokeStyle = 'rgba(60,44,30,.6)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(n.x0, e.y + 2); ctx.lineTo(e.x - n.dir * 30, e.y + 2); ctx.stroke(); inner(); } },
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
      if (cd === 'w8ash') { W8.akit.ash(e.x, e.y, 20, 18); sfx('crunch', .4); } if (cd === 'w8crack') { sfx('break'); } if (cd === 'w8bellfall') { tn(110, 2, 'sawtooth', .07, 70); tn(165, 1.4, 'sawtooth', .04, 100); } }
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
    } else if (d === 'w8bellfall') { // the hurdy-gurdy: its legs go from under it, it comes down on its side and its strings let go one by one
      const u = sm(k / .8); ctx.save(); ctx.translate(e.x, e.y - 4 - 22 * (1 - u)); ctx.scale(e.facing, 1); ctx.rotate(u * .5); W8.art.gurdy(0, 0, 1, 2, k < .9 ? (1 - k) * .6 : 0, t, 1.2); ctx.restore();
      ctx.strokeStyle = C('#4A3A30'); ctx.lineWidth = 3; ctx.beginPath(); for (const x of [-14, -6, 10, 18]) { ctx.moveTo(e.x + x, e.y - 1); ctx.lineTo(e.x + x + 8 * u, e.y - 6 + 4 * u); } ctx.stroke();
      if (k < .8) for (let i = 0; i < 4; i++) { const sx = e.x - 10 + i * 7; ctx.strokeStyle = `rgba(232,224,200,${.8 - k})`; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(sx, e.y - 30); ctx.quadraticCurveTo(sx + 10 * u, e.y - 40 - 20 * u, sx + 20 * u, e.y - 20); ctx.stroke(); }
    } else if (d === 'w8fall') { // the Goat-Lord: he goes forward onto his face, and goes to grey ash from the horns down; the horn is left
      const u = sm(k / .7); ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.facing * (e.size || 1), e.size || 1);
      if (u < 1) { ctx.globalAlpha *= 1 - sm((k - .5) / .5); ctx.rotate(u * .25); W8.goatLord({ form: 4, kneel: 1, book: 0, tilt: .4 + u * .6, lean: .3 + u * .4, t, crook: 1.4 }); }
      ctx.restore();
      ctx.fillStyle = C('#6E685E'); ell(e.x, e.y + 2, 30 * u, 6 * u); ctx.fill();
      if (k > .65) W8.hornDraw(e.x + e.facing * 20, e.y - 4, .9, t, cl01((k - .65) / .2));
    }
    ctx.restore();
  };
  // the Mouth's spit: one of its own teeth, turning over as it comes, a thread of spittle after it
  const _dp = drawProj;
  drawProj = function (p, t) { if (!p.w8bolt) return _dp(p, t); const d = Math.sign(p.vx) || 1; shadow(p.x, p.y, 4); ctx.save(); ctx.translate(p.x, p.y - p.z); ctx.rotate(t * 14 * d);
    W8.kit.cel(W8.kit.PB([-4, -5, 4, -5, 5, 0, 3, 6, 0, 3, -3, 6, -5, 0]), '#F0E6D0', { d: 1, r: .5, w: 1.2, lite: '#FFFFFF', dark: '#B8A888' }); ctx.restore();
    if (DET()) { ctx.strokeStyle = 'rgba(220,210,190,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x - d * 30, p.y - p.z + 2); ctx.quadraticCurveTo(p.x - d * 16, p.y - p.z + 5, p.x - d * 6, p.y - p.z); ctx.stroke(); } };
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
      W8.rider({ look: W8.riderLook('knight', { arms: 'lorraine', plume: [PAL.gules, PAL.or] }), t, walk: t * 6, gallop: 0, seed: .7, coat: 'grey' });
      ctx.restore();
      // snow, falling
      for (let i = 0; i < 40; i++) { const life = (t * .08 + hsh(i)) % 1; ctx.fillStyle = 'rgba(255,255,252,.85)'; circle((hsh(i + 1) * w + Math.sin(t + i) * w * .02 + w) % w, life * h, Math.max(.5, w * .006) * (.6 + hsh(i + 2))); ctx.fill(); }
      // the margin: a border of gold leaf with Lorraine's arms at the foot
      ctx.strokeStyle = '#C9982E'; ctx.lineWidth = Math.max(1, w * .02); ctx.strokeRect(w * .02, h * .015, w * .96, h * .97);
      lorraineArms(w / 2, h * .92, w * .14, h * .1, { ow: Math.max(.6, w * .006) });
    } finally { ctx.restore(); ctx = old; }
  };

  // ======================================================================================================
  // THE RIDERS OF LORRAINE: the men on the warhorses, drawn as the prince is drawn (drawHumanoid with his costume
  // machinery, art_corwin.js and art_gear.js): mail and plate in plain steel gilt with Lorraine's or, a surcoat of the
  // arms, a helm, a riding cloak over the horse's croup. They sit the saddle: the near thigh along the barrel, the knee
  // bent, the foot in the stirrup (drawHumanoid's pose.ride draws it); the reins run from the bit to a hand; the knights
  // carry lances with pennons. Ganelon rides at their head bareheaded in a mail coif under a lord's gold circlet, red
  // beard going grey, in his own arms (azure, a chevron or).
  //   W8.rider(o): drawn at the frame's origin, feet at 0, facing +x. o: { look (W8.riderLook(...)), t, walk, gallop,
  //   idle (0..1 how far the horse has come to rest), idleT (seconds since), seed (each horse its own clock), coat,
  //   charge (the lance couched) }.
  //   W8.riderLook(kind, over): 'ganelon' | 'knight' (over: { arms: 'lorraine' | 'counter', helm: 'bascinet' | 'kettle',
  //   ... }) ; W8.ghostLook(look): the same, the grey-blue of the Circle's mist (the riders of Lorraine's dead)
  // ======================================================================================================
  {
    const TAU3 = Math.PI * 2, clr = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), DETR = () => !FLASH && !TINT && !LITE;
    const hx2 = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const mixH = (a, b, k) => { const A = hx2(a), B = hx2(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
    const STEEL = '#A6AAB2', MAILC = '#7E828A';

    // ---- the surcoat over a mail shirt, worn as a costume part (CORWIN.parts.mail) so it is drawn in the figure's own order ----
    // the arms: L.sc_field, L.sc_charge, L.sc_kind ('bend' with three alerions argent | 'chevron'); the skirt falls over the thigh
    const RINGS = new Map(), RPX = 6; // a tile of mail rings (two staggered rows) painted once per colour, laid on as a pattern
    const mailRings = (x0, y0, x1, y1, col) => { if (!DETR() || (typeof PAINT_Q !== 'undefined' && PAINT_Q <= 0)) return;
      let pat = RINGS.get(col);
      if (!pat) { if (RINGS.size > 24) RINGS.clear(); const c = document.createElement('canvas'); c.width = Math.round(2.8 * RPX); c.height = Math.round(2.5 * RPX); const g = c.getContext('2d');
        g.scale(RPX, RPX); g.strokeStyle = col; g.lineWidth = .32; g.beginPath(); for (const [x, y] of [[.7, .6], [2.1, .6], [0, 1.85], [1.4, 1.85], [2.8, 1.85]]) { g.moveTo(x + .5, y); g.arc(x, y, .5, 0, Math.PI); } g.stroke();
        pat = ctx.createPattern(c, 'repeat'); pat.setTransform(new DOMMatrix().scale(1 / RPX)); RINGS.set(col, pat); }
      ctx.fillStyle = pat; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); };
    function charge(L, x0, y0, w, h, skirt) { // the arms laid over a panel of the surcoat (its field already painted), in its own frame
      if (L.sc_kind === 'chevron') {
        const cx = x0 + w * .5, top = y0 + h * (skirt ? -.2 : .28), bw = w * .2;
        ctx.beginPath(); ctx.moveTo(x0 - 2, top + h * .62); ctx.lineTo(cx, top); ctx.lineTo(x0 + w + 2, top + h * .62); ctx.lineTo(x0 + w + 2, top + h * .62 + bw * 1.5); ctx.lineTo(cx, top + bw * 1.5); ctx.lineTo(x0 - 2, top + h * .62 + bw * 1.5); ctx.closePath();
        ctx.fillStyle = C(L.sc_charge); ctx.fill();
        if (DETR() && !skirt) { ctx.fillStyle = C(PAL.argent); for (const [u, v] of [[.2, .16], [.8, .16], [.5, .86]]) { const sx = x0 + w * u, sy = y0 + h * v; ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? .5 : 1.25; ctx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); } } // three mullets argent
        return;
      }
      ctx.save(); ctx.translate(x0 + w * .5, y0 + h * .5); ctx.rotate(skirt ? .5 : .95); const bw = Math.min(w, h) * .36;
      ctx.fillStyle = C(L.sc_charge); ctx.fillRect(-h * 1.2, -bw / 2, h * 2.4, bw);
      if (DETR() && !skirt) { ctx.fillStyle = C(PAL.argent); for (const k of [-h * .34, 0, h * .34]) { ctx.save(); ctx.translate(k, 0); ctx.rotate(-.95); ctx.beginPath(); ctx.moveTo(-1.5, -.8); ctx.lineTo(0, .3); ctx.lineTo(1.5, -.8); ctx.lineTo(.45, .5); ctx.lineTo(0, 1.6); ctx.lineTo(-.45, .5); ctx.closePath(); ctx.fill(); ctx.restore(); } } // the alerions
      ctx.restore();
    }
    const lorraineMail = {
      torso(L, g) {
        const K = CORWIN.kit, { HIP, SHO, Y } = g, ty = SHO - 2; K.setTW(Y); const TW = K.TW;
        // the mail shirt: seen at the shoulders and the arm-holes
        K.torsoPath(ty, HIP); ctx.fillStyle = C(L.m_mail); ctx.fill();
        ctx.save(); K.torsoPath(ty, HIP); ctx.clip(); mailRings(-12, ty - 2, 12, ty + 7, shade(L.m_mail, .35));
        // the surcoat: sleeveless, from the collarbone down, cut deep at the arm-hole
        const sc = () => { ctx.beginPath(); ctx.moveTo(-9.6 * TW, ty + 3.4); ctx.quadraticCurveTo(-3, ty + 2, 1, ty + 4.2); ctx.quadraticCurveTo(5, ty + 2, 9.8 * TW, ty + 3.2); ctx.lineTo(9.8 * TW, HIP + 3); ctx.lineTo(-9.8 * TW, HIP + 3); ctx.closePath(); };
        sc(); ctx.fillStyle = C(L.sc_field); ctx.fill();
        ctx.save(); sc(); ctx.clip(); charge(L, -7 * TW, ty + 3, 14 * TW, HIP - ty - 2, false);
        if (DETR()) { const sg = ctx.createLinearGradient(-9 * TW, 0, 9 * TW, 0); sg.addColorStop(0, 'rgba(30,14,10,.42)'); sg.addColorStop(.45, 'rgba(30,14,10,.08)'); sg.addColorStop(.8, 'rgba(255,244,214,.14)'); sg.addColorStop(1, 'rgba(30,14,10,.2)'); ctx.fillStyle = sg; ctx.fillRect(-12, ty, 24, HIP - ty + 4); // the cloth turning from the light
          ctx.strokeStyle = 'rgba(40,20,10,.32)'; ctx.lineWidth = .55; ctx.lineCap = 'round'; ctx.beginPath(); for (const x of [-3.4, 1, 4.4]) { ctx.moveTo(x * TW, ty + 8); ctx.quadraticCurveTo((x - .8) * TW, (ty + HIP) / 2 + 3, (x + .4) * TW, HIP + 2); } ctx.stroke(); } // folds drawn in to the belt
        ctx.restore();
        ctx.beginPath(); ctx.moveTo(-9.6 * TW, ty + 3.4); ctx.quadraticCurveTo(-3, ty + 2, 1, ty + 4.2); ctx.quadraticCurveTo(5, ty + 2, 9.8 * TW, ty + 3.2); ctx.strokeStyle = C(L.sc_trim || PAL.or); ctx.lineWidth = .8; ctx.stroke(); // the gilt edge at the neck
        ctx.restore();
        K.torsoPath(ty, HIP); outline(1.05);
        // the skirt, split for the saddle: one panel falls forward over the thigh, the other back over the cantle
        const wy = HIP - 7.6, sway = Math.sin((g.t || 0) * 2.3 + (L.seed || 0)) * .4;
        const front = () => { ctx.beginPath(); ctx.moveTo(-1.5, wy); ctx.lineTo(6.2 * TW + .4, wy); ctx.quadraticCurveTo(9, HIP - 3, 11.4 + sway, HIP + .6); ctx.lineTo(9.8 + sway, HIP + 3.4); ctx.quadraticCurveTo(5, HIP + 5.6, .8, HIP + 6.2); ctx.closePath(); };
        const back = () => { ctx.beginPath(); ctx.moveTo(-6.4 * TW - .4, wy); ctx.lineTo(.5, wy); ctx.lineTo(-1.5, HIP + 7.4); ctx.quadraticCurveTo(-7, HIP + 9.2, -12.6 - sway, HIP + 8); ctx.quadraticCurveTo(-11, HIP + 2, -6.4 * TW - .4, wy); ctx.closePath(); };
        for (const [p, x0, w] of [[back, -13, 13], [front, -1, 17]]) {
          p(); ctx.fillStyle = C(p === back ? shade(L.sc_field, -.22) : L.sc_field); ctx.fill();
          ctx.save(); p(); ctx.clip(); charge(L, x0, wy, w, HIP + 10 - wy, true);
          if (DETR()) { ctx.strokeStyle = 'rgba(40,20,10,.38)'; ctx.lineWidth = .6; ctx.beginPath(); for (const k of [.3, .6, .85]) { ctx.moveTo(x0 + w * k, wy + 2); ctx.quadraticCurveTo(x0 + w * k + 1.5, HIP + 2, x0 + w * k + (p === front ? 2.6 : -1.4), HIP + 8.6); } ctx.stroke();
            const sh = ctx.createLinearGradient(0, wy, 0, HIP + 10); sh.addColorStop(0, 'rgba(30,14,10,.3)'); sh.addColorStop(.5, 'rgba(30,14,10,0)'); sh.addColorStop(1, 'rgba(30,14,10,.22)'); ctx.fillStyle = sh; ctx.fillRect(x0 - 2, wy, w + 6, HIP + 12 - wy); }
          ctx.restore(); p(); outline(.9);
          if (L.sc_trim) { ctx.save(); p(); ctx.clip(); ctx.strokeStyle = C(L.sc_trim); ctx.lineWidth = 1.1; p(); ctx.stroke(); ctx.restore(); } // a gilt border
        }
      },
      neck(L, g) { // a mail collar standing round the throat (the helm's aventail or the coif lies over it)
        const { NECK } = g; ctx.beginPath(); ctx.moveTo(-4, NECK - 1); ctx.lineTo(3.2, NECK - 1); ctx.lineTo(4.4, NECK + 3.4); ctx.lineTo(-5, NECK + 3.4); ctx.closePath();
        ctx.fillStyle = C(L.m_mail); ctx.fill(); ctx.save(); ctx.clip(); mailRings(-6, NECK - 2, 6, NECK + 4, shade(L.m_mail, .4)); ctx.restore(); outline(.7);
      },
    };
    CORWIN.parts.mail.lorraineMail = lorraineMail;

    // ---- the looks ----
    const BASE = { mail: 'lorraineMail', pants: 'moonLegs', gauntlets: 'moonArms', waist: 'swordbelt', gauntPlate: 1,
      m_mail: MAILC, p_a: MAILC, p_b: STEEL, p_boot: '#949AA2', p_c: '#B6BAC2', p_d: PAL.or,
      g_sleeve: MAILC, g_a: STEEL, g_c: PAL.or, g_pau: '#B0B4BC', glove: '#9AA0A8', steel: STEEL, pauldron: STEEL,
      leather: '#5A3420', brass: PAL.or, scab: '#4A2C1A', legs: MAILC, boots: '#949AA2', cuff: '#6A4A30', body: '#3A2E26', shirt: '#E6DECE', sleeve: MAILC, trim: PAL.or };
    W8.riderLook = (kind, over = {}) => {
      const L = Object.assign({}, typeof HERO !== 'undefined' ? HERO : { corwin: 1 }, BASE);
      if (kind === 'ganelon') Object.assign(L, { skin: '#D09A74', hair: '#8A4426', hairLt: '#B8704A', hairDk: '#3E1A0C', eye: '#4A6A3A', beard: '#94462A', beardGrey: '#C4B4A2',
        sc_field: '#24365E', sc_charge: PAL.or, sc_kind: 'chevron', sc_trim: PAL.or, helm: 'coif', circlet: PAL.or, cloakCol: '#7A1E18', cloakLine: PAL.or, cloakLong: 1, lance: 0, hand: 'reins', ganelon: 1 });
      else { const counter = over.arms === 'counter';
        Object.assign(L, { skin: '#D8A882', hair: '#4A3424', eye: '#4A5A6A', sc_field: counter ? PAL.gules : PAL.or, sc_charge: counter ? PAL.or : PAL.gules, sc_kind: 'bend', sc_trim: counter ? PAL.or : null,
          helm: counter ? 'kettle' : 'bascinet', cloakCol: counter ? '#C08A2E' : '#8A221E', cloakLine: counter ? PAL.gules : PAL.or, lance: 1, pennon: counter ? [PAL.gules, PAL.or] : [PAL.or, PAL.gules], hand: 'lance' }); }
      return Object.assign(L, over);
    };
    W8.headGear = headGear; // (the head drawn over a figure at HEAD_MASK: Ganelon's coif, circlet and beard on foot, forgehall.js)
    let DEAD = null; W8.deadLook = () => DEAD || (DEAD = W8.ghostLook(W8.riderLook('knight', { arms: 'lorraine' }))); // a knight who fell at the Circle
    W8.ghostLook = (L, to = '#7A8AA6', k = .72) => { const G = Object.assign({}, L); for (const key in G) { const v = G[key]; if (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)) G[key] = mixH(v, to, k); else if (Array.isArray(v)) G[key] = v.map(c => typeof c === 'string' && c[0] === '#' ? mixH(c, to, k) : c); } return G; };

    // ---- the head: helm, coif, beard, over the prince's own face (drawn at the head's frame drawHumanoid left in HEAD_MASK) ----
    function aventail(L, hy, open) { // mail falling from the helm (or the coif's hood) round the face to the shoulders
      const p = () => { ctx.beginPath(); ctx.moveTo(-11.8, hy - 3); ctx.lineTo(open ? 1.6 : -1, hy - 1.5); ctx.quadraticCurveTo(3.4, hy + 4, 4.6, hy + 8.2); ctx.quadraticCurveTo(7.4, hy + 10, 10, hy + 9.8);
        ctx.quadraticCurveTo(10.2, hy + 13, 8.8, hy + 15); ctx.quadraticCurveTo(10.6, hy + 18, 11.4, hy + 20.6); ctx.quadraticCurveTo(0, hy + 23.4, -12.8, hy + 21); ctx.quadraticCurveTo(-11.2, hy + 16, -11.6, hy + 9); ctx.quadraticCurveTo(-12.4, hy + 3, -11.8, hy - 3); ctx.closePath(); };
      p(); const g = DETR() ? ctx.createLinearGradient(-12, 0, 10, 0) : null; if (g) { g.addColorStop(0, C(shade(L.m_mail, -.3))); g.addColorStop(.6, C(L.m_mail)); g.addColorStop(1, C(shade(L.m_mail, .15))); }
      ctx.fillStyle = g || C(L.m_mail); ctx.fill(); ctx.save(); p(); ctx.clip(); mailRings(-15, hy - 4, 12, hy + 24, shade(L.m_mail, .42)); ctx.restore(); p(); outline(1);
    }
    function headGear(L, hy, t) {
      const st = L.steel || STEEL, metalG = (x0, y0, x1, y1) => { if (!DETR()) return C(st); const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, C(shade(st, .55))); g.addColorStop(.3, C(st)); g.addColorStop(.62, C(shade(st, -.45))); g.addColorStop(1, C(shade(st, -.15))); return g; };
      if (L.helm === 'coif') { // Ganelon: a mail coif, a lord's gold circlet over it, and his beard
        aventail(L, hy, true);
        const hood = () => { ctx.beginPath(); ctx.moveTo(10.8, hy - 4.2); ctx.quadraticCurveTo(12.4, hy - 15.6, 1.4, hy - 18.2); ctx.quadraticCurveTo(-11.6, hy - 18, -13, hy - 5); ctx.lineTo(-11.8, hy - 2.6); ctx.lineTo(1.6, hy - 1.5); ctx.quadraticCurveTo(3.4, hy - 4.8, 10.8, hy - 4.2); ctx.closePath(); };
        hood(); ctx.fillStyle = C(L.m_mail); ctx.fill(); ctx.save(); hood(); ctx.clip(); mailRings(-13, hy - 16, 11, hy, shade(L.m_mail, .42)); if (DETR()) { ctx.fillStyle = 'rgba(255,255,255,.16)'; ell(3, hy - 11, 6, 2.6, -.2); ctx.fill(); } ctx.restore(); hood(); outline(1);
        ctx.strokeStyle = C(shade(L.circlet, -.45)); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-12.6, hy - 8.4); ctx.quadraticCurveTo(0, hy - 10.6, 11.2, hy - 7.4); ctx.stroke(); // the circlet
        ctx.strokeStyle = C(L.circlet); ctx.lineWidth = 1.7; ctx.stroke();
        if (DETR()) { ctx.strokeStyle = 'rgba(255,248,220,.75)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(-6, hy - 9.8); ctx.quadraticCurveTo(1, hy - 10.6, 8.6, hy - 8.4); ctx.stroke(); }
        for (const [x, c] of [[4.4, '#B82A2A'], [-2.4, '#2A5AA0'], [-8.4, '#B82A2A']]) { ctx.fillStyle = C(c); ell(x, hy - 9.4 + Math.abs(x) * .03, .9, .9); ctx.fill(); }
        // the beard: full and square, red going grey, over the jaw and the chin; a heavy moustache; grey in the brows
        const bd = () => { ctx.beginPath(); ctx.moveTo(1.4, hy - .4); ctx.quadraticCurveTo(1.6, hy + 7, 3.6, hy + 11); ctx.quadraticCurveTo(5.4, hy + 17.4, 10.6, hy + 18.6); ctx.lineTo(11.4, hy + 16.4); ctx.quadraticCurveTo(12.8, hy + 12, 10.8, hy + 8.4);
          ctx.lineTo(9.7, hy + 7.2); ctx.lineTo(10.2, hy + 6.2); ctx.lineTo(10.9, hy + 5.4); ctx.quadraticCurveTo(10.2, hy + 3.9, 8.6, hy + 4.1); ctx.quadraticCurveTo(7, hy + 4.6, 6.6, hy + 6.4); ctx.quadraticCurveTo(5.4, hy + 4.4, 4.4, hy + 1.6); ctx.closePath(); };
        bd(); const bg = DETR() ? ctx.createLinearGradient(0, hy, 0, hy + 15) : null; if (bg) { bg.addColorStop(0, C(L.beard)); bg.addColorStop(.7, C(mixH(L.beard, L.beardGrey, .45))); bg.addColorStop(1, C(L.beardGrey)); }
        ctx.fillStyle = bg || C(L.beard); ctx.fill();
        if (DETR()) { ctx.save(); bd(); ctx.clip(); ctx.lineCap = 'round'; ctx.lineWidth = .45;
          for (let i = 0; i < 11; i++) { const x = 2.4 + i * .85, y = hy + 3 + (i % 3); ctx.strokeStyle = i % 3 === 1 ? 'rgba(236,226,212,.7)' : 'rgba(50,18,8,.5)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + .8, y + 6, x + 1.6 + i * .2, y + 11 + (i % 2) * 2); ctx.stroke(); }
          ctx.restore(); }
        bd(); outline(.8);
        ctx.fillStyle = C(mixH(L.beard, L.beardGrey, .5)); ctx.beginPath(); ctx.moveTo(3.4, hy - 3.8); ctx.lineTo(6.4, hy - 4.6); ctx.lineTo(8.8, hy - 3.4); ctx.lineTo(8.2, hy - 2.6); ctx.lineTo(5.8, hy - 3.2); ctx.closePath(); ctx.fill(); // brows, grizzled
        if (DETR()) { ctx.strokeStyle = C(shade(L.skin, -.42)); ctx.lineWidth = .4; ctx.beginPath(); ctx.moveTo(3.4, hy + .4); ctx.lineTo(2.4, hy + 1.2); ctx.moveTo(3.6, hy + 1.4); ctx.lineTo(2.8, hy + 2.4); ctx.moveTo(4.4, hy - 2); ctx.quadraticCurveTo(6, hy - 1.6, 7.6, hy - 2.2); ctx.stroke(); } // the lines of a man past fifty at the eye
        return;
      }
      aventail(L, hy, true);
      if (L.helm === 'kettle') { // a kettle hat: a round crown with a ridge, a broad brim tipped down, over the coif and aventail
        const crown = () => { ctx.beginPath(); ctx.moveTo(11.4, hy - 4.6); ctx.quadraticCurveTo(12, hy - 17.4, 0, hy - 18.6); ctx.quadraticCurveTo(-12.4, hy - 17.6, -12.8, hy - 4.8); ctx.closePath(); };
        crown(); ctx.fillStyle = metalG(8, hy - 18, -8, hy - 4); ctx.fill(); crown(); outline(1);
        ctx.strokeStyle = C(shade(st, -.35)); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(0, hy - 18.4); ctx.quadraticCurveTo(-1, hy - 11, -.6, hy - 5); ctx.stroke(); // the ridge
        const brim = () => { ctx.beginPath(); ctx.moveTo(-17, hy - 2.6); ctx.quadraticCurveTo(0, hy - 7.6, 16.6, hy - 3.4); ctx.quadraticCurveTo(17.6, hy - 2.2, 16.4, hy - 1.6); ctx.quadraticCurveTo(0, hy - 5.4, -16.8, hy - .8); ctx.closePath(); };
        brim(); ctx.fillStyle = metalG(0, hy - 7, 0, hy - 1); ctx.fill(); brim(); outline(.9);
        ctx.strokeStyle = C(L.brass || PAL.or); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(-12.6, hy - 5.6); ctx.quadraticCurveTo(0, hy - 8.6, 11.6, hy - 5.8); ctx.stroke(); // a gilt band round the crown
        if (DETR()) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ell(5, hy - 13.6, 3.6, 1.3, -.5); ctx.fill(); }
        return; }
      // a bascinet, low on the brow, laced to the aventail
      const skull = () => { ctx.beginPath(); ctx.moveTo(11.2, hy - 2.2); ctx.quadraticCurveTo(12, hy - 12.6, 3, hy - 16.8); ctx.quadraticCurveTo(-3, hy - 19.4, -6.6, hy - 19.8); ctx.quadraticCurveTo(-13, hy - 12.8, -12.6, hy - 2.6);
        ctx.lineTo(-12, hy + .4); ctx.lineTo(-.6, hy - .2); ctx.quadraticCurveTo(1.6, hy - 3, 4, hy - 2.8); ctx.quadraticCurveTo(7.8, hy - 2.8, 11.2, hy - 2.2); ctx.closePath(); };
      skull(); ctx.fillStyle = metalG(8, hy - 16, -8, hy); ctx.fill();
      if (DETR()) { ctx.save(); skull(); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.75)'; ell(4.6, hy - 12, 3.6, 1.4, -.6); ctx.fill(); ctx.fillStyle = 'rgba(20,18,26,.3)'; ctx.fillRect(-13, hy - 3, 26, 5); ctx.restore(); }
      skull(); outline(1.05);
      ctx.strokeStyle = C(shade(st, -.4)); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(-12, hy - .9); ctx.lineTo(-1, hy - 1.4); ctx.stroke(); // the vervelles' line, where the aventail is laced on
      if (DETR()) for (let x = -11; x < -1; x += 2.2) { ctx.fillStyle = C(L.brass || PAL.or); ell(x, hy - 1.2, .45, .45); ctx.fill(); }
      ctx.strokeStyle = C(L.brass || PAL.or); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(10.6, hy - 3.4); ctx.quadraticCurveTo(7, hy - 4, 3.6, hy - 3.6); ctx.stroke(); // a gilt brow-band
      if (L.plume) { ctx.save(); ctx.translate(-6.6, hy - 19.4); const w = Math.sin(t * 2.2 + (L.seed || 0)) * .12; for (let i = 0; i < 3; i++) { ctx.rotate(-.25 + w); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-5 - i, -4 - i, -11 - i * 2, 1 + i * 2); ctx.quadraticCurveTo(-5, -1, 0, 1); ctx.closePath(); ctx.fillStyle = C(i % 2 ? L.plume[1] : L.plume[0]); ctx.fill(); outline(.6); } ctx.restore(); }
    }

    // ---- the riding cloak over the croup, the reins, the stirrup iron, the lance and its pennon ----
    function cloak(L, P, t, gal, id, seed) { // P: points in the frame we draw in (shoulder, nape, waist, and on the horse: croup, rump, flank)
      const wv = (k, a) => Math.sin(t * (2.2 + gal * 7) + k * 2.1 + seed) * a, A = .5 + gal * 2.2, lift = gal * 9, back = gal * 8, long = L.cloakLong ? .8 : .5;
      const hem = [[P.croup[0] - 4 - back, P.croup[1] + 13 * long - lift + wv(0, A)], [P.rump[0] - 2 - back * 1.3, P.rump[1] + 15 * long - lift * 1.3 + wv(1, A * 1.4)], [P.flank[0] - 2 - back * .5, P.flank[1] + 14 * long - lift * .6 + wv(2, A)], [P.waist[0] - 4, P.waist[1] + 12 * long + wv(3, A * .6)]];
      const path = () => { ctx.beginPath(); ctx.moveTo(P.nape[0], P.nape[1]); ctx.quadraticCurveTo(P.shBack[0] - 5, P.shBack[1] + 4, P.croup[0] + 6, P.croup[1] - 2);
        ctx.quadraticCurveTo(P.rump[0] + 2 - back * .4, P.rump[1] - 4 - lift * .6, P.rump[0] - 4 - back, P.rump[1] + 2 - lift + wv(4, A));
        ctx.lineTo(hem[1][0], hem[1][1]); ctx.quadraticCurveTo((hem[1][0] + hem[2][0]) / 2, Math.max(hem[1][1], hem[2][1]) + 3, hem[2][0], hem[2][1]); ctx.quadraticCurveTo((hem[2][0] + hem[3][0]) / 2, hem[3][1] + 2, hem[3][0], hem[3][1]);
        ctx.lineTo(P.waist[0], P.waist[1]); ctx.quadraticCurveTo(P.shBack[0] + 3, P.shBack[1] + 8, P.shoulder[0], P.shoulder[1]); ctx.closePath(); };
      path(); let g = null; if (DETR()) { g = ctx.createLinearGradient(P.shoulder[0], P.shoulder[1], hem[1][0], hem[1][1]); g.addColorStop(0, C(shade(L.cloakCol, .12))); g.addColorStop(.55, C(L.cloakCol)); g.addColorStop(1, C(shade(L.cloakCol, -.38))); }
      ctx.fillStyle = g || C(L.cloakCol); ctx.fill();
      ctx.save(); path(); outline(1); // (no clip: the lining and the folds are drawn inside its edge)
      ctx.strokeStyle = C(L.cloakLine); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(hem[1][0], hem[1][1] - .9); ctx.quadraticCurveTo((hem[1][0] + hem[2][0]) / 2, Math.max(hem[1][1], hem[2][1]) + 2.1, hem[2][0], hem[2][1] - .9); ctx.quadraticCurveTo((hem[2][0] + hem[3][0]) / 2, hem[3][1] + 1.1, hem[3][0] + .6, hem[3][1] - .9); ctx.stroke(); // the lining turned at the hem
      if (DETR()) { ctx.lineCap = 'round'; for (let i = 0; i < 4; i++) { const u = (i + .6) / 4.4, x0 = lerp(P.nape[0], P.shoulder[0], .5) - i * 3, y0 = P.nape[1] + 4 + i, hx = lerp(hem[3][0], hem[1][0], u), hy = lerp(hem[3][1], hem[1][1], u) - 1;
        ctx.strokeStyle = 'rgba(14,6,6,.42)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + hx) / 2 - 3 + wv(i + 5, A * .5), (y0 + hy) / 2, hx, hy); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,236,206,.18)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(x0 + 1.2, y0); ctx.quadraticCurveTo((x0 + hx) / 2 - 1.6 + wv(i + 5, A * .5), (y0 + hy) / 2, hx + 1.4, hy - 1); ctx.stroke(); } }
      ctx.restore();
    }
    function reins(bit, hand, sag, far) { ctx.lineCap = 'round'; const mx = (bit[0] + hand[0]) / 2, my = Math.max(bit[1], hand[1]) + sag;
      for (const [w, c] of [[far ? 1.5 : 1.8, FLASH ? '#FFFFFF' : '#1E120C'], [far ? .7 : 1, C(far ? '#6A1A12' : '#9A2A1C')]]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(bit[0], bit[1]); ctx.quadraticCurveTo(mx, my, hand[0], hand[1]); ctx.stroke(); } }
    function iron(p, a) { ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(a); ctx.strokeStyle = FLASH ? '#FFFFFF' : '#1E1612'; ctx.lineWidth = 1.7; ctx.beginPath(); ctx.moveTo(-3.6, 1.2); ctx.lineTo(-2.2, -4.2); ctx.lineTo(2.2, -4.2); ctx.lineTo(3.6, 1.2); ctx.closePath(); ctx.stroke();
      ctx.strokeStyle = C('#B4B8BE'); ctx.lineWidth = .9; ctx.stroke(); ctx.fillStyle = C('#8A8E94'); ctx.fillRect(-3.8, .6, 7.6, 1.4); ctx.restore(); }
    function lance(L, H, tilt, t, gal, seed) { // an ash lance held upright in the near hand, a pennon of the colours at its head
      const dx = Math.sin(tilt), dy = -Math.cos(tilt), B = [H[0] - dx * 26, H[1] - dy * 26], T = [H[0] + dx * 104, H[1] + dy * 104];
      ctx.lineCap = 'round'; ctx.strokeStyle = FLASH ? '#FFFFFF' : '#1E140C'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(B[0], B[1]); ctx.lineTo(T[0], T[1]); ctx.stroke();
      ctx.strokeStyle = C('#9A7448'); ctx.lineWidth = 1.5; ctx.stroke(); if (DETR()) { ctx.strokeStyle = 'rgba(255,236,196,.55)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(B[0] + .4, B[1]); ctx.lineTo(T[0] + .4, T[1]); ctx.stroke(); }
      ctx.save(); ctx.translate(T[0], T[1]); ctx.rotate(tilt); ctx.beginPath(); ctx.moveTo(0, -9); ctx.quadraticCurveTo(2.2, -3, 1.2, 0); ctx.lineTo(-1.2, 0); ctx.quadraticCurveTo(-2.2, -3, 0, -9); ctx.closePath(); ctx.fillStyle = C('#C4C8CE'); ctx.fill(); outline(.7); ctx.restore(); // the steel head
      // the pennon: streaming back at the gallop, hanging and lifting in the breeze at rest; swallow-tailed
      const n = 7, len = 30, root = [T[0] - dx * 2, T[1] - dy * 2], top = [], bot = [];
      for (let i = 0; i <= n; i++) { const k = i / n, a = lerp(1.62 + .25 * Math.sin(t * .9 + seed), Math.PI - .06, gal) + Math.sin(t * (2.6 + gal * 8) - k * 4.4 + seed) * (.1 + gal * .12) * k;
        const ux = Math.cos(a), uy = Math.sin(a), wd = 7.5 * (1 - k * .5), fl = Math.sin(t * (3.2 + gal * 9) - k * 6 + seed * 2) * k * (1 + gal * 1.6);
        const px = root[0] + ux * len * k + uy * fl, py = root[1] + uy * len * k - ux * fl; top.push([px, py]); bot.push([px + uy * wd, py - ux * wd]); }
      const [c1, c2] = L.pennon || [PAL.or, PAL.gules], tip = top[n], tb = bot[n], ta = Math.atan2(tip[1] - top[n - 1][1], tip[0] - top[n - 1][0]);
      const shape = () => { ctx.beginPath(); ctx.moveTo(root[0], root[1]); for (const p of top) ctx.lineTo(p[0], p[1]); ctx.lineTo((tip[0] + tb[0]) / 2 - Math.cos(ta) * 5, (tip[1] + tb[1]) / 2 - Math.sin(ta) * 5); for (let i = n; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]); ctx.closePath(); }; // the swallow's tail
      shape(); ctx.fillStyle = C(c1); ctx.fill(); outline(.8);
      ctx.strokeStyle = C(c2); ctx.lineWidth = 2.4; ctx.beginPath(); for (let i = 0; i < n; i++) { const p = top[i], q = bot[i], x = lerp(p[0], q[0], .5), y = lerp(p[1], q[1], .5); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); // a stripe of the other colour down its length
    }
    function fist(L, H, a) { ctx.save(); ctx.translate(H[0], H[1]); ctx.rotate(a); rrect(-2.4, -2.1, 4.8, 4.2, 1.4); ctx.fillStyle = C(L.glove || STEEL); ctx.fill(); outline(.8); if (DETR()) { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(-1.6, -1.5); ctx.lineTo(1.4, -1.6); ctx.stroke(); } ctx.restore(); }

    // ---- the whole rider ----
    const LS = 1.3, AS = 1.3;
    W8.rider = function (o) {
      const L = o.look, t = o.t || 0, seed = o.seed || 0, id = clr(o.idle || 0);
      const ho = { t, walk: o.walk || 0, gallop: o.gallop || 0, idle: id, idleT: o.idleT, seed, coat: o.coat || 'bay', rider: false, tack: 'rider' };
      const [sx, sy, g] = W8.horseSeat(ho, -4, -66.4), m = g.m, gal = g.gal * (1 - id);
      W8.horse('back', ho); const bit = W8.horseBit(); W8.horse('front', ho);
      // how he sits: forward over the gallop, upright at rest, his weight going with the horse's; he gives a little to its toss and its pawing
      const tossK = m ? m.toss * id : 0, pawK = m ? m.paw * id : 0;
      const lean = .16 * gal + .03 * (1 - gal) + (m ? id * (-tossK * .05 + Math.sin(m.t * .8 + seed) * .012 + pawK * .03 * Math.sin(m.pawPh * TAU3 + 1)) : 0);
      const ch = o.charge && L.lance; // charging: the lance couched under the arm, level, the point forward
      const pose = { walk: 0, Y: .16, weapon: 'fists', noCloak: 1, lean: lean + (ch ? .08 : 0),
        arm: ch ? 1.3 : L.hand === 'lance' ? .82 : .98 - tossK * .14, elbow: ch ? 1.25 : L.hand === 'lance' ? 1.62 : 1.12 + tossK * .3, backArm: .92 - (L.hand === 'lance' ? tossK * .14 : 0), backElbow: 1.0 + (L.hand === 'lance' ? tossK * .3 : 0) };
      // the frames: R the rider's (feet at 0) in ours; U his upper body (drawHumanoid's upper(): the bend at the waist)
      const R = new DOMMatrix().translate(sx, sy).rotate(g.pitch * 57.3).translate(1.4, 34.4 + (m ? id * m.breathe * .15 : 0));
      const HIP = -30 * LS, SHO = HIP - 22, NECK = SHO - 2.6, LEAN = lean * (.25 + .75 * Math.sqrt(1 - pose.Y * pose.Y)), HX = clr(-LEAN * 6, -5, 5) * Math.sqrt(1 - pose.Y * pose.Y);
      const U = R.translate(HX, HIP).rotate(LEAN * 57.3).translate(0, -HIP), at = (M, x, y) => { const p = M.transformPoint(new DOMPoint(x, y)); return [p.x, p.y]; };
      const CSY = Math.sqrt(1 - pose.Y * pose.Y), PX = (fx, lz) => fx * CSY - lz * pose.Y;
      const handAt = (sxx, syy, arm, elbow) => { const eb = -elbow; return at(U.translate(sxx, syy).rotate(arm * 57.3), 10 * AS + Math.cos(eb) * 9 * AS, Math.sin(eb) * 9 * AS); };
      const nearHand = handAt(PX(1, 9.4), SHO + 2, pose.arm, pose.elbow), farHand = handAt(PX(-3, -9.4), SHO + 1.5, pose.backArm, pose.backElbow);
      // the cloak over the croup, behind him
      if (L.cloakCol) { const hp = (x, y) => { const p = W8.horseSeat(ho, x, y); return [p[0], p[1]]; };
        cloak(L, { nape: at(U, -1, NECK - 1), shoulder: at(U, 3, SHO + 2), shBack: at(U, -6, SHO + 3), waist: at(R, -7, HIP + 4), croup: hp(-17, -68), rump: hp(-29, -67), flank: hp(-19, -60) }, t, gal, id, seed); }
      // the reins: the far one to the far hand (behind him), the near one to whichever hand holds them
      const rh = L.hand === 'lance' ? farHand : nearHand;
      if (bit) { reins(bit, [rh[0] + 1, rh[1] + .6], 3 + 4 * id - tossK * 3, true); if (L.hand !== 'lance') reins(bit, [nearHand[0] + .6, nearHand[1] + .4], 2.5 + 4 * id - tossK * 3, false); }
      // the stirrup leather down the flap, behind his leg
      const top = W8.horseSeat(ho, -2, -63); let RIDE = null;
      pose.ride = (look, hip, hx, ls) => { // his near leg, seated (in drawHumanoid's legs frame): the thigh down the barrel, the knee bent, the foot home in the stirrup, heel down
        const bob = gal * Math.sin(g.p * TAU3 * 2) * .6, kneeA = .8 + bob * .1, shinA = -.06 - gal * .1;
        const H = [2 + hx, hip], Kn = [H[0] + Math.cos(kneeA) * 10.6, H[1] + Math.sin(kneeA) * 10.6], A = [Kn[0] - Math.sin(shinA) * 12.4, Kn[1] + Math.cos(shinA) * 12.4];
        const rot = -.12 + gal * .1, F = [A[0] + .6, A[1] + 7.4], lw = 1 / ls;
        CORWIN.seat(look, H[0] - 4, H[0], hip, lw, 0);
        CORWIN.leg(look, H[0], H[1], Kn[0], Kn[1], A[0], A[1], F[0], F[1], rot, lw, false, lw);
        const M = ctx.getTransform(), b = M.transformPoint(new DOMPoint(F[0] + 2.4, F[1] - .2)), b2 = M.transformPoint(new DOMPoint(F[0] + 7, F[1] - .2 + Math.tan(rot) * 4.6));
        RIDE = { abs: b, ang: Math.atan2(b2.y - b.y, b2.x - b.x) };
      };
      // the stirrup leather goes down under his leg: drawn now, to where the foot will be
      { const MR = R.scale(LS, LS), kneeA = .8, shinA = -.06 - gal * .1, Hh = [2 + HX / LS, -30], Kn = [Hh[0] + Math.cos(kneeA) * 10.6, Hh[1] + Math.sin(kneeA) * 10.6], A = [Kn[0] - Math.sin(shinA) * 12.4, Kn[1] + Math.cos(shinA) * 12.4], f = at(MR, A[0] + 3, A[1] + 7.4);
        ctx.lineCap = 'butt'; ctx.strokeStyle = FLASH ? '#FFFFFF' : '#1E120C'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(f[0], f[1] - 3); ctx.stroke(); ctx.strokeStyle = C('#5A3A22'); ctx.lineWidth = 1.2; ctx.stroke(); }
      // the man
      const base = ctx.getTransform(), hm = HEAD_MASK;
      ctx.save(); ctx.setTransform(base.multiply(R)); L.seed = seed; drawHumanoid(L, pose); ctx.restore();
      const head = HEAD_MASK; HEAD_MASK = hm;
      if (head && head !== hm) { ctx.save(); ctx.setTransform(head.m); headGear(L, head.hy, t); ctx.restore(); }
      if (RIDE) { const p = base.inverse().transformPoint(RIDE.abs); iron([p.x, p.y], RIDE.ang); }
      if (L.lance) { const tilt = ch ? 1.5 - g.pitch : .1 + gal * .32 + (m ? id * Math.sin(m.t * .7 + seed * 2) * .015 : 0); lance(L, nearHand, tilt, t, gal, seed); fist(L, nearHand, tilt - Math.PI / 2); }
    };
  }
})();
