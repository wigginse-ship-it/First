'use strict';
// World 4 art, enemies, boss, passages and approach rule: THE COURTS OF CHAOS
//   chaos     - The Black Road: a road of fused black glass running out over the Abyss under an eclipsed sun,
//               crags of obsidian rising out of nothing, fragments of other worlds drifting past overhead
//   chaos2    - The Thelbane Spires: the needle towers of the Chaos lords, floating, hanging, joined by bridges to nowhere;
//               a causeway of bone-white stone inlaid with the gold of the Logrus. Here the Abyss breathes (rule 'w4breath')
//   chaosBoss - The Rim of the Abyss: the last dais at the edge of everything, the Abyss turning overhead like a storm
// Enemies: Knight of the Courts, Logrus Adept, Borel Duke of Chaos (human looks), Hound of Chaos, Watcher of the Abyss,
// Eclipse Moth, Abyss Brute. Boss: the Ty'iga, Shifter of Shapes (wolf, serpent of smoke, winged horror).
// Passages: 'w4logrus' (the Logrus closes in like ink, then the dark burns away) and 'w4trump' (drawn through a Trump card).
// Everything lives inside this closure so nothing collides with the other files.
(() => {
  const T = FLOOR_TOP;
  const DET = () => !FLASH && !TINT; // fine shading is skipped in a hit flash or a flat afterimage tint
  const add = (fn) => { if (!DET()) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
  const addB = (fn) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); }; // light, at build time (no flash test)
  const poly = (pts) => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); };
  const fillPoly = (pts, col, ow) => { poly(pts); ctx.fillStyle = C(col); ctx.fill(); if (ow) outline(ow); };
  const detPoly = (pts, col, a = 1) => { if (!DET()) return; poly(pts); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1; };
  const clipIn = (path, fn) => { if (!DET()) return; ctx.save(); path(); ctx.clip(); fn(); ctx.restore(); };
  const glowAt = (x, y, r, rgb, a) => add(() => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.45, `rgba(${rgb},${a * .4})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); });
  const glowB = (x, y, r, rgb, a) => addB(() => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.45, `rgba(${rgb},${a * .4})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); });
  const hsh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }; // stable randomness
  const sm = (k) => k * k * (3 - 2 * k);
  const cl01 = (k) => clamp(k, 0, 1);
  // a tapered, curved spike (horn, claw, fang, spine, thorn): two-toned, the side away from the light in shadow, a lit edge
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
    if (DET()) { // the half facing down-left in shadow, a lit line along the other edge
      const k = (s.L.length >> 2) & ~1, nx = s.L[k] - s.M[k], ny = s.L[k + 1] - s.M[k + 1], darkL = nx * -.6 + ny * .8 > 0;
      trace(darkL ? s.L : s.R, s.M); ctx.fillStyle = dark || shade(col, -.4); ctx.fill();
      const lit = darkL ? s.R : s.L; ctx.strokeStyle = shade(col, .45); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(lit[0], lit[1]); for (let i = 2; i < lit.length - 2; i += 2) ctx.lineTo(lit[i], lit[i + 1]); ctx.stroke();
    }
    if (ow) { trace(s.L, s.R); outline(ow); }
    return s;
  }
  // a smooth closed blob through points (a body, a cloud, a lobe)
  function blob(pts) {
    const n = pts.length / 2; ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = i % n, b = (i + 1) % n, mx = (pts[a * 2] + pts[b * 2]) / 2, my = (pts[a * 2 + 1] + pts[b * 2 + 1]) / 2;
      if (i === 0) ctx.moveTo(mx, my); else ctx.quadraticCurveTo(pts[a * 2], pts[a * 2 + 1], mx, my);
    }
    ctx.closePath();
  }
  // cel shading for a path: a flat base, a hard shadow plane down-left (the shape minus itself nudged toward the light),
  // a lit rim up-right, optional texture painted inside, and an inked outline
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
  // turn a point list into a path function usable with cel (ox, oy: offset; cont: append to the current path)
  const PB = (pts) => (ox, oy, cont) => { if (!cont) ctx.beginPath(); const n = pts.length / 2;
    for (let i = 0; i <= n; i++) { const a = i % n, b = (i + 1) % n, mx = (pts[a * 2] + pts[b * 2]) / 2 + ox, my = (pts[a * 2 + 1] + pts[b * 2 + 1]) / 2 + oy;
      if (i === 0) ctx.moveTo(mx, my); else ctx.quadraticCurveTo(pts[a * 2] + ox, pts[a * 2 + 1] + oy, mx, my); }
    ctx.closePath(); };
  const PP = (pts) => (ox, oy, cont) => { if (!cont) ctx.beginPath(); ctx.moveTo(pts[0] + ox, pts[1] + oy); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i] + ox, pts[i + 1] + oy); ctx.closePath(); };
  const PE = (x, y, rx, ry, rot = 0) => (ox, oy, cont) => { if (!cont) ctx.beginPath(); ctx.moveTo(x + ox + Math.cos(rot) * rx, y + oy + Math.sin(rot) * rx); ctx.ellipse(x + ox, y + oy, Math.max(.1, rx), Math.max(.1, ry), rot, 0, TAU); };
  // a burning eye: dark socket, a glowing iris with a slit, a glint
  function emberEye(x, y, s, iris, rgb, hot) {
    ctx.fillStyle = C('#0E0610'); ell(x, y, 2.6 * s, 1.5 * s, -.2); ctx.fill();
    ctx.fillStyle = C(iris); ell(x + .3 * s, y, 1.6 * s, .9 * s, -.2); ctx.fill();
    if (DET()) { ctx.fillStyle = '#1A0808'; ell(x + .5 * s, y, .3 * s, .75 * s); ctx.fill(); ctx.fillStyle = '#FFF4D0'; circle(x + 1.1 * s, y - .4 * s, .35 * s); ctx.fill(); glowAt(x, y, 7 * s, rgb, hot ? .7 : .35); }
  }
  // palettes
  const EMBER = '255,138,60', SULF = '240,196,90', BRUISE = '150,90,190';
  const OBS = { base: '#1E1626', lit: '#6A4E80', dark: '#0A060E', sheen: '#9A7AB0', vein: '#FF8A3C' };

  // ======================================================================================================
  // shared sky pieces: the eclipsed sun and the drifting fragments of other worlds (painted once, hung in the live sky)
  // ======================================================================================================
  let eclC = null, eclS = 0, frags = [], roadSeams = [], spireSeams = [], vortC = null, rimSeams = [];
  function buildEclipse(R, seed, cor = '255,214,150') {
    const S = Math.ceil(R * 8), [c, g] = makeLayer(S, S), old = ctx, rnd = mulberry(seed); ctx = g; ctx.translate(S / 2, S / 2);
    addB(() => {
      softDab(0, 0, R * 3.9, '170,60,80', .28); softDab(0, 0, R * 2.4, '255,170,100', .34); softDab(0, 0, R * 1.5, '255,230,190', .42);
      // the corona: streamers curling out of the dark limb, long and short, like petals of fire
      for (let i = 0; i < 52; i++) {
        const a = i / 52 * TAU + (rnd() - .5) * .1, L = R * (1.25 + rnd() * (i % 4 ? .9 : 2.6)), w = R * (.06 + rnd() * .1), bend = (rnd() - .5) * .5;
        const ex = Math.cos(a + bend) * L, ey = Math.sin(a + bend) * L, mx = Math.cos(a + bend * .4) * (R + (L - R) * .5), my = Math.sin(a + bend * .4) * (R + (L - R) * .5);
        const gr = ctx.createRadialGradient(0, 0, R * .9, 0, 0, L); gr.addColorStop(0, `rgba(${cor},.62)`); gr.addColorStop(.5, `rgba(${cor},.2)`); gr.addColorStop(1, `rgba(${cor},0)`);
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(Math.cos(a - w / R) * R, Math.sin(a - w / R) * R);
        ctx.quadraticCurveTo(mx - Math.sin(a) * w, my + Math.cos(a) * w, ex, ey); ctx.quadraticCurveTo(mx + Math.sin(a) * w, my - Math.cos(a) * w, Math.cos(a + w / R) * R, Math.sin(a + w / R) * R); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,220,170,.35)'; ctx.lineWidth = R * .3; circle(0, 0, R * 1.04); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,250,232,.95)'; ctx.lineWidth = R * .07; circle(0, 0, R * 1.01); ctx.stroke(); // the diamond ring of light
      for (let i = 0; i < 5; i++) { const a = rnd() * TAU; softDab(Math.cos(a) * R, Math.sin(a) * R, R * (.12 + rnd() * .14), '255,120,90', .8); } // prominences, red at the limb
    });
    const dg = ctx.createRadialGradient(-R * .2, -R * .2, R * .1, 0, 0, R); dg.addColorStop(0, '#0A0610'); dg.addColorStop(.85, '#120A18'); dg.addColorStop(1, '#2A1426');
    ctx.fillStyle = dg; circle(0, 0, R); ctx.fill();
    ctx.strokeStyle = 'rgba(255,240,210,.5)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.arc(0, 0, R - .4, -1.4, .4); ctx.stroke();
    ctx = old; return [c, S];
  }
  // a fragment of another world adrift in the Abyss: a clod of rock carrying a piece of somewhere else
  function buildFrag(kind, seed, haze) {
    const W = 120, H = 120, [c, g] = makeLayer(W, H), old = ctx, rnd = mulberry(seed); ctx = g; ctx.translate(W / 2, H / 2);
    const rock = (w, d, top) => { // the torn underside: an inverted cone of strata, lit on the right
      const pts = [-w, top]; for (let i = 1; i < 8; i++) { const k = i / 8; pts.push(-w + k * w * 2, top + Math.sin(k * Math.PI) * d * (.7 + rnd() * .5) + (rnd() - .5) * 4); } pts.push(w, top);
      poly(pts); const gr = ctx.createLinearGradient(-w, 0, w, 0); gr.addColorStop(0, '#2A1A2A'); gr.addColorStop(.6, '#4A3040'); gr.addColorStop(1, '#8A5A5A'); ctx.fillStyle = gr; ctx.fill();
      ctx.strokeStyle = 'rgba(20,10,20,.5)'; ctx.lineWidth = .7; for (let s = 1; s < 4; s++) { ctx.beginPath(); ctx.moveTo(-w * (1 - s * .2), top + s * d * .18); ctx.lineTo(w * (1 - s * .2), top + s * d * .2); ctx.stroke(); }
      for (let i = 0; i < 4; i++) { ctx.strokeStyle = '#3A2830'; ctx.lineWidth = .8; const rx = -w * .6 + rnd() * w * 1.2; ctx.beginPath(); ctx.moveTo(rx, top + d * .5); ctx.quadraticCurveTo(rx + 2, top + d * .8, rx - 1, top + d + 4 + rnd() * 6); ctx.stroke(); } // dangling roots
    };
    if (kind === 'meadow') { // a clod of the Bloomwild: turf, a round tree, a few flowers
      rock(34, 30, 4); ctx.fillStyle = '#5E7A4A'; ell(0, 4, 35, 5); ctx.fill(); ctx.fillStyle = '#86A060'; ell(6, 2.5, 26, 2.6); ctx.fill();
      ctx.strokeStyle = '#3A2A26'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, 3); ctx.quadraticCurveTo(-10, -12, -6, -22); ctx.stroke();
      for (let i = 0; i < 16; i++) dab(-6 + (rnd() - .5) * 30, -28 + (rnd() - .5) * 18, 6 + rnd() * 5, ['#3E6A4A', '#5E8A56', '#9AB070'][i % 3], .95);
      for (let i = 0; i < 6; i++) dab(10 + rnd() * 18, 1 - rnd() * 2, 1.2, i % 2 ? '#F2B8C8' : '#FFF2E0', 1);
    } else if (kind === 'tower') { // a piece of the Skyport: a brass tower and a gear
      rock(30, 34, 6); ctx.fillStyle = '#6A5A66'; ell(0, 6, 31, 4); ctx.fill();
      ctx.fillStyle = '#8A6A44'; ctx.fillRect(-7, -34, 14, 40); ctx.fillStyle = '#C8A06A'; ctx.fillRect(3, -34, 4, 40);
      ctx.fillStyle = '#4E7A74'; ctx.beginPath(); ctx.arc(0, -34, 9, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#FFE0A0'; ctx.fillRect(-2, -26, 4, 5); ctx.fillRect(-2, -14, 4, 5);
      ctx.fillStyle = '#A8844A'; for (let k = 0; k < 10; k++) { ctx.save(); ctx.translate(16, -14); ctx.rotate(k / 10 * TAU); ctx.fillRect(7, -2, 4, 4); ctx.restore(); } circle(16, -14, 8); ctx.fill(); ctx.fillStyle = '#4E3A22'; circle(16, -14, 3); ctx.fill();
    } else if (kind === 'prism') { // a shard of the Prism Rim
      rock(28, 28, 4);
      for (const [x, h, w, hue] of [[-10, 30, 7, 190], [2, 44, 9, 290], [13, 24, 6, 330], [-18, 16, 5, 170]]) {
        ctx.fillStyle = `hsl(${hue},40%,46%)`; poly([x - w, 5, x - w, 5 - h * .8, x, 5 - h, x + w, 5 - h * .8, x + w, 5]); ctx.fill();
        ctx.fillStyle = `hsla(${hue},60%,78%,.8)`; poly([x, 5 - h, x + w, 5 - h * .8, x + w, 5, x + w * .3, 5]); ctx.fill();
      }
    } else if (kind === 'house') { // a cottage torn out whole, hanging upside down under its clod
      rock(30, 22, -6); ctx.save(); ctx.scale(1, -1); ctx.translate(0, 8);
      ctx.fillStyle = '#B8A890'; ctx.fillRect(-16, -22, 32, 22); ctx.fillStyle = '#8A7A68'; ctx.fillRect(-16, -22, 8, 22);
      ctx.fillStyle = '#7A3A3A'; poly([-21, -21, 0, -40, 21, -21]); ctx.fill(); ctx.fillStyle = '#A85A4A'; poly([0, -40, 21, -21, 10, -21]); ctx.fill();
      ctx.fillStyle = '#FFD890'; ctx.fillRect(2, -16, 6, 6); ctx.fillStyle = '#4A3428'; ctx.fillRect(-6, -12, 6, 12);
      ctx.restore();
    } else { // a broken flight of stairs going nowhere
      rock(24, 24, 6);
      for (let s = 0; s < 6; s++) { ctx.fillStyle = s % 2 ? '#C8B898' : '#B4A486'; ctx.fillRect(-20 + s * 7, 4 - s * 6, 8, 6 + s * 6); ctx.fillStyle = '#E8DCC0'; ctx.fillRect(-20 + s * 7, 4 - s * 6, 8, 1.2); }
    }
    // aerial perspective: the far air of the Abyss lies over it
    ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = `rgba(${haze},.38)`; ctx.fillRect(-W / 2, -H / 2, W, H); ctx.globalCompositeOperation = 'source-over';
    ctx = old; paintLayer(c, { ink: '#1A0E18', line: .45, lw: .8, brush: .7, hatch: 0, seed: seed % 17 }); return c;
  }
  function buildSky(R, seed, haze, kinds, cor) {
    retire(eclC); for (const f of frags) retire(f.c);
    [eclC, eclS] = buildEclipse(R, seed, cor);
    frags = kinds.map((k, i) => ({ c: buildFrag(k, seed * 7 + i * 13, haze), k: i }));
  }
  // the live sky: the eclipse where the sun is, and the fragments drifting slowly across (each at its own depth)
  function skyEclipse(th, camX) {
    if (!eclC) return;
    const sx = VW * th.sun[0] - camX * .02, sy = Y_OFF + VIEW_H * th.sun[1];
    ctx.drawImage(eclC, sx - eclS / 2, sy - eclS / 2, eclS, eclS);
  }
  function skyFrags(camX, t, y0, y1, sc = 1) {
    const W = VW + 260;
    frags.forEach((f, i) => {
      const s = (.42 + (i * .37) % .4) * sc, x = ((i * 233 + t * (2.2 + i % 3) - camX * (.03 + s * .04)) % W + W) % W - 130, y = y0 + ((i * 53) % Math.max(1, y1 - y0)) + Math.sin(t * .18 + i * 2) * 4;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * .07 + i) * .12); ctx.globalAlpha = .9; ctx.drawImage(f.c, -60 * s, -60 * s, 120 * s, 120 * s); ctx.restore();
    });
  }

  // ======================================================================================================
  // THE BLACK ROAD
  // ======================================================================================================
  // a crag of obsidian rising out of the Abyss: facets, a sheen on the lit face, ember veins in the cracks
  function crag(x, top, w, rnd, P, o = {}) {
    const base = T + 6, n = 5 + Math.floor(rnd() * 3), L = [], R = [];
    for (let i = 0; i <= n; i++) { const k = i / n, wk = w * (.18 + .82 * Math.pow(k, .7)); L.push([x - wk * (.9 + rnd() * .2), lerp(top, base, k)]); R.push([x + wk * (.8 + rnd() * .2), lerp(top + w * .4, base, k)]); }
    const tipX = x + (rnd() - .4) * w * .3, pts = [tipX, top - w * .5]; for (const p of R) pts.push(p[0], p[1]); for (let i = L.length - 1; i >= 0; i--) pts.push(L[i][0], L[i][1]);
    poly(pts); const gr = ctx.createLinearGradient(x - w, 0, x + w, 0); gr.addColorStop(0, P.dark); gr.addColorStop(.55, P.base); gr.addColorStop(1, shade(P.base, .15)); ctx.fillStyle = gr; ctx.fill();
    ctx.save(); poly(pts); ctx.clip();
    // the lit facet: from the tip down the right side, closed by a crease
    const cx = lerp(tipX, x, .5) + w * .1; const face = [tipX, top - w * .5]; for (const p of R) face.push(p[0], p[1]); face.push(x + w * .25, base, cx, top + (base - top) * .4);
    poly(face); ctx.fillStyle = P.lit; ctx.globalAlpha = .55; ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = P.sheen; ctx.globalAlpha = .55; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tipX + 1, top - w * .5 + 3); for (const p of R.slice(0, 3)) ctx.lineTo(p[0] - 1.5, p[1]); ctx.stroke(); ctx.globalAlpha = 1;
    for (let i = 0; i < 6; i++) { const yy = lerp(top, base, .2 + rnd() * .75), xx = x + (rnd() - .5) * w * .9; dab(xx, yy, 2 + rnd() * 4, rnd() < .5 ? P.dark : shade(P.base, .1), .35); } // brushed texture
    if (o.veins !== 0) awGlow(`rgb(${EMBER})`, 6, () => { // ember veins deep in the glass
      ctx.strokeStyle = 'rgba(255,150,70,.85)'; ctx.lineWidth = .9; ctx.beginPath();
      for (let v = 0; v < 2 + Math.floor(rnd() * 2); v++) { let vx = x + (rnd() - .5) * w * .6, vy = lerp(top, base, .25 + rnd() * .3); ctx.moveTo(vx, vy); for (let s = 0; s < 4; s++) { vx += (rnd() - .5) * w * .4; vy += 6 + rnd() * 12; ctx.lineTo(vx, vy); } }
      ctx.stroke();
    });
    ctx.restore();
    poly(pts); ctx.strokeStyle = 'rgba(255,200,150,.25)'; ctx.lineWidth = .6; ctx.stroke();
    return [tipX, top - w * .5];
  }
  // a twisted thorn-tree of the Black Road: black limbs, few sulfur leaves
  function thornTree(x, base, h, rnd) {
    ctx.lineCap = 'round'; ctx.strokeStyle = '#120A10';
    const limb = (x0, y0, a, len, wdt, d) => {
      const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len, mx = (x0 + x1) / 2 + (rnd() - .5) * len * .4, my = (y0 + y1) / 2 + (rnd() - .5) * len * .3;
      ctx.lineWidth = wdt; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, x1, y1); ctx.stroke();
      for (let k = 0; k < 3; k++) { const q = .3 + k * .25, tx = lerp(x0, x1, q), ty = lerp(y0, y1, q), sa = a + (k % 2 ? .9 : -.9); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + Math.cos(sa) * 4, ty + Math.sin(sa) * 4); ctx.stroke(); } // thorns
      if (d > 0) { limb(x1, y1, a - .35 - rnd() * .4, len * .68, wdt * .62, d - 1); limb(x1, y1, a + .3 + rnd() * .4, len * .62, wdt * .58, d - 1); }
      else if (rnd() < .6) { dab(x1, y1, 1.8, '#C8A040', .9); dab(x1 + 1, y1 - 1, .8, '#FFE08A', .9); }
    };
    limb(x, base, -Math.PI / 2 + (rnd() - .5) * .3, h * .42, 4.2, 3);
  }
  // a banner of the Courts on an iron pole: tattered maroon cloth with the gold sign of the Logrus
  function banner4(x, base, h, rnd, col = '#6A1A2A') {
    ctx.fillStyle = '#1A1218'; ctx.fillRect(x - 1.4, base - h, 2.8, h); ctx.fillStyle = '#5A4A58'; ctx.fillRect(x + .4, base - h, .8, h);
    ctx.fillStyle = '#C8A040'; poly([x - 3, base - h, x, base - h - 9, x + 3, base - h]); ctx.fill();
    ctx.fillRect(x - 1, base - h + 3, 18, 1.6);
    const top = base - h + 4, L = 30 + rnd() * 14, w = 15;
    const cloth = [x + 1, top]; for (let i = 0; i <= 6; i++) { const k = i / 6; cloth.push(x + 1 + w + Math.sin(k * 5 + rnd()) * 2, top + k * L); }
    cloth.push(x + 1 + w * .8, top + L + 6, x + 1 + w * .5, top + L - 2, x + 1 + w * .25, top + L + 5, x + 1, top + L);
    poly(cloth); const cg = ctx.createLinearGradient(x, 0, x + w, 0); cg.addColorStop(0, shade(col, -.4)); cg.addColorStop(.6, col); cg.addColorStop(1, shade(col, .25)); ctx.fillStyle = cg; ctx.fill();
    ctx.strokeStyle = '#D8AA50'; ctx.lineWidth = .9; ctx.beginPath(); const cx = x + 1 + w * .5, cy = top + L * .42; // the sigil: a spiral that never closes
    for (let a = 0; a < TAU * 1.6; a += .3) { const r = 1 + a * 1.1; const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r * 1.1; a ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();
    ctx.fillStyle = 'rgba(255,220,160,.25)'; ctx.fillRect(x + 1 + w - 3, top, 2, L);
  }
  function chain(x0, y0, x1, y1, sag, col = '#2A2028', lit = '#7A6A70') {
    const n = Math.max(6, Math.round(Math.hypot(x1 - x0, y1 - y0) / 4));
    for (let i = 0; i < n; i++) { const k = (i + .5) / n, x = lerp(x0, x1, k), y = lerp(y0, y1, k) + Math.sin(k * Math.PI) * sag, a = Math.atan2(y1 - y0 + Math.cos(k * Math.PI) * sag * Math.PI / n * 4, x1 - x0);
      ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.strokeStyle = col; ctx.lineWidth = 1.2; if (i % 2) { ell(0, 0, 2.4, 1.1); ctx.stroke(); ctx.strokeStyle = lit; ctx.lineWidth = .5; ctx.beginPath(); ctx.ellipse(0, 0, 2.4, 1.1, 0, Math.PI, TAU); ctx.stroke(); } else { ctx.beginPath(); ctx.moveTo(-2.2, 0); ctx.lineTo(2.2, 0); ctx.stroke(); } ctx.restore(); }
  }
  // a far needle spire of Thelbane: a thin tower with swellings, a needle point and windows burning sulfur
  function needle(x, base, h, w, P, rnd, o = {}) {
    const pts = [], R = []; const N = 12;
    for (let i = 0; i <= N; i++) { const k = i / N, y = base - k * h, sw = (1 + Math.sin(k * Math.PI * (o.bulbs || 3) + (o.ph || 0)) * .45) * (1 - Math.pow(k, 2.2)) * w * .5 + .4; pts.push(x - sw, y); R.push(x + sw, y); }
    const all = pts.concat([x, base - h - w * 1.5]); for (let i = R.length - 2; i >= 0; i -= 2) all.push(R[i], R[i + 1]);
    poly(all); ctx.fillStyle = P.base; ctx.fill();
    ctx.save(); poly(all); ctx.clip(); ctx.fillStyle = P.lit; ctx.globalAlpha = P.litA ?? .6; ctx.fillRect(x + w * .05, base - h - w * 2, w, h + w * 2); ctx.globalAlpha = 1;
    ctx.strokeStyle = P.band; ctx.lineWidth = .8; for (let k = 1; k < 6; k++) { const y = base - h * k / 6.5; ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x + w, y + 1); ctx.stroke(); }
    ctx.restore();
    if (P.win) for (let i = 0; i < 4 + h / 30; i++) { const y = base - rnd() * h * .85, ww = .9; awGlow(P.win, 4, () => { ctx.fillStyle = P.win; ctx.fillRect(x - ww + (rnd() - .5) * w * .3, y, ww * 2, 2.2); }); }
    if (o.flag) { ctx.strokeStyle = P.base; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(x, base - h - w * 1.5); ctx.lineTo(x, base - h - w * 1.5 - 8); ctx.stroke(); ctx.fillStyle = '#8A2A3A'; poly([x, base - h - w * 1.5 - 8, x + 7, base - h - w * 1.5 - 6, x, base - h - w * 1.5 - 4]); ctx.fill(); }
  }
  // a floating island of rock: an inverted cone with strata, lit on the right
  function isle(x, y, w, d, P, rnd) {
    const pts = [x - w, y]; for (let i = 1; i < 9; i++) { const k = i / 9; pts.push(x - w + k * w * 2, y + Math.pow(Math.sin(k * Math.PI), .8) * d * (.75 + rnd() * .4)); } pts.push(x + w, y);
    poly(pts); const gr = ctx.createLinearGradient(x - w, 0, x + w, 0); gr.addColorStop(0, P.dark); gr.addColorStop(.6, P.base); gr.addColorStop(1, P.lit); ctx.fillStyle = gr; ctx.fill();
    ctx.fillStyle = P.top; ell(x, y, w, Math.max(1.5, w * .1)); ctx.fill();
    if (d > 14) for (let i = 0; i < 3; i++) { const rx = x + (rnd() - .5) * w; dab(rx, y + d * (.5 + rnd() * .5) + 3, 1.5 + rnd() * 2, P.dark, .9); } // crumbs falling away
  }
  function roadFar(rnd, th, f) {
    AW_SUN = 1;
    buildSky(24, 41, '120,50,80', ['meadow', 'tower', 'house', 'prism', 'stairs'], '255,210,150');
    // long bands of storm cloud, maroon and bruise, laid in with tapering brush strokes, their tops lit by the corona
    const streak = (x, y, L, h, col, a) => { ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - L, y); ctx.quadraticCurveTo(x - L * .25, y - h * 1.7, x + L, y - h * .25); ctx.quadraticCurveTo(x - L * .1, y + h * .9, x - L, y); ctx.fill(); ctx.globalAlpha = 1; };
    for (let b = 0; b < 5; b++) {
      const y0 = 140 + b * 13 + rnd() * 5, wv = awWave(77 + b, [[2, 6], [5, 3], [11, 1.2]]), dens = awWave(91 + b * 3, [[3, 1], [7, .6]]);
      const body = ['#4E2242', '#5E2844', '#702E46', '#843848', '#964448'][b], under = shade(body, -.4), lit = ['#C8708A', '#D88070', '#E89060', '#F0A060', '#F6B86C'][b];
      for (let x = 0; x < AW_W; x += 15) { if (dens(x) < -.3) continue; const y = y0 + wv(x) + (rnd() - .5) * 3, L = 24 + rnd() * 46, h = 1.8 + rnd() * 3.2;
        awWrap(x, L, (x) => { streak(x + 2, y + h * .8, L * .95, h, under, .65); streak(x, y, L, h, body, .9); streak(x + L * .12, y - h * .55, L * .62, h * .4, lit, .5); }); }
    }
    // the glow of the depths along the far horizon: whatever burns at the bottom of the Abyss
    { const g = ctx.createLinearGradient(0, 170, 0, T); g.addColorStop(0, 'rgba(255,170,90,0)'); g.addColorStop(.7, 'rgba(255,150,80,.35)'); g.addColorStop(1, 'rgba(255,200,120,.6)'); ctx.fillStyle = g; ctx.fillRect(0, 170, AW_W, T - 170); }
    // Thelbane, far off: needle spires on islands of rock, hazy violet against the glow
    const FP = { base: '#6A4A6E', lit: '#B07A8A', litA: .45, band: 'rgba(40,20,50,.35)', win: '#FFD890', dark: '#3A2848', top: '#7A5A70' };
    for (let i = 0; i < 6; i++) awWR(i * 213 + rnd() * 80, 60, rnd, (x, r) => {
      const y = 184 + r() * 26, w = 24 + r() * 26; isle(x, y, w, 20 + r() * 26, { dark: '#3A2840', base: '#5A3E58', lit: '#A0707A', top: '#7A5A6A' }, r);
      const n = 1 + Math.floor(r() * 3); for (let k = 0; k < n; k++) needle(x + (k - (n - 1) / 2) * w * .6 + (r() - .5) * 6, y + 1, 30 + r() * 50 * (k === 0 ? 1.4 : 1), 3.5 + r() * 3.5, FP, r, { bulbs: 2 + Math.floor(r() * 3), ph: r() * 3, flag: r() < .4 });
    });
    hazeBand(f, th.haze, 140, T, .35);
    // nearer islands and loose rocks hanging in the air
    for (let i = 0; i < 9; i++) awWR(rnd() * AW_W, 30, rnd, (x, r) => isle(x, 120 + r() * 70, 5 + r() * 12, 6 + r() * 12, { dark: '#2A1A2A', base: '#4A2E40', lit: '#B07070', top: '#6A4A58' }, r));
    hazeBand(f, th.haze, 196, T, .3);
  }
  function roadMid(rnd) {
    AW_SUN = 1;
    // mist rising out of the depths behind the road's edge
    for (let i = 0; i < 22; i++) { const x = rnd() * AW_W, y = 214 + rnd() * 20, r = 30 + rnd() * 40; awWrap(x, r, (x) => awSoft(x, y, r, r * .3, '60,24,50', .45)); }
    // crags of obsidian rising out of nothing, the black thorn growing on them, chains slung between them
    const tops = [];
    for (let i = 0; i < 7; i++) { const x = 60 + i * 183 + rnd() * 70, w = 18 + rnd() * 30, top = T - 60 - rnd() * 100; tops.push([x, top + w * .2]); awWR(x, w * 1.4, rnd, (x, r) => { const tip = crag(x, top, w, r, OBS); if (r() < .55) thornTree(x + (r() - .3) * w * .5, top + w * .3, 40 + r() * 30, r); }); }
    for (let i = 0; i < tops.length; i++) { const a = tops[i], b = tops[(i + 1) % tops.length], bx = i === tops.length - 1 ? b[0] + AW_W : b[0]; if (rnd() < .6) for (const ox of [0, -AW_W]) chain(a[0] + ox + 4, a[1] + 14, bx + ox - 4, b[1] + 16, 18 + rnd() * 14); }
    for (let i = 0; i < 4; i++) awWR(130 + i * 320 + rnd() * 60, 26, rnd, (x, r) => banner4(x, T + 4, 84 + r() * 30, r));
    // low shards of glass along the back of the road
    for (let i = 0; i < 16; i++) awWR(rnd() * AW_W, 16, rnd, (x, r) => crag(x, T - 10 - r() * 24, 5 + r() * 8, r, OBS, { veins: r() < .4 ? 1 : 0 }));
  }
  // a network of cracks over a glossy surface: rows of plates, each joint a dark line with a lit lip; returns the plates
  function crackNet(rnd, y0, rows, o) {
    const plates = []; let y = y0;
    const rowLines = [[]]; for (let x = -20; x <= AW_W + 20; x += 14) rowLines[0].push([x, y0 + (rnd() - .5) * 1.2]);
    for (const h of rows) { const ln = [], ny = y + h; for (let x = -20; x <= AW_W + 20; x += 14 + h * .4) ln.push([x, ny + (rnd() - .5) * h * .25]); rowLines.push(ln); y = ny; }
    const yAt = (ln, x) => { for (let i = 1; i < ln.length; i++) if (ln[i][0] >= x) { const a = ln[i - 1], b = ln[i]; return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0])); } return ln[ln.length - 1][1]; };
    y = y0;
    rows.forEach((h, ri) => {
      const top = rowLines[ri], bot = rowLines[ri + 1];
      const row = awRow(rnd, h * o.min, h * o.max), leans = row.map(() => (rnd() - .5) * h * .9); // each joint runs at a slant, shared by the plates either side
      row.forEach(([x0, w], j) => {
        const lL = leans[(j + row.length - 1) % row.length], lR = leans[j];
        for (const ox of x0 + w > AW_W ? [0, -AW_W] : [0]) {
          const xa = x0 + ox, xb = x0 + w + ox, pts = [];
          for (let x = xa; x < xb; x += 7) pts.push(x, yAt(top, x)); pts.push(xb, yAt(top, xb), xb + lR, yAt(bot, xb + lR));
          for (let x = xb + lR - 7; x > xa + lL; x -= 7) pts.push(x, yAt(bot, x)); pts.push(xa + lL, yAt(bot, xa + lL));
          plates.push({ pts, x: xa, w, y, h, row: ri, lean: lR, k: rnd(), k2: rnd() });
        }
      });
      y += h;
    });
    return plates;
  }
  function roadFloor(rnd, th) {
    roadSeams = [];
    // the road is one glossy pour of black glass: it mirrors the warm glow of the horizon at the back, the dark sky at the front
    { const g = ctx.createLinearGradient(0, T - 3, 0, VH); g.addColorStop(0, '#3A1C2A'); g.addColorStop(.1, '#1A0E18'); g.addColorStop(.4, '#0C0810'); g.addColorStop(1, '#030205'); ctx.fillStyle = g; ctx.fillRect(0, T - 3, AW_W, VH - T + 3); }
    addB(() => { // reflections of the crags and their veins, standing in the glass
      for (let i = 0; i < 30; i++) { const x = rnd() * AW_W, w = 3 + rnd() * 16, L = 30 + rnd() * 70, warm = rnd() < .4; awWrap(x, w, (x) => { const g = ctx.createLinearGradient(0, T, 0, T + L); g.addColorStop(0, warm ? 'rgba(255,120,60,.2)' : 'rgba(150,110,200,.13)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - w / 2, T, w, L); }); }
    });
    const plates = crackNet(rnd, T + 1, [8, 10, 12, 15, 18, 22, 26], { min: 2.6, max: 6 });
    for (const p of plates) { // each plate a slightly different pour: a tone, a few brushed dabs, flow marks where it ran
      poly(p.pts); ctx.fillStyle = p.k < .5 ? `rgba(70,40,80,${.08 + p.k2 * .14})` : `rgba(4,2,8,${.15 + p.k2 * .3})`; ctx.fill();
      ctx.save(); poly(p.pts); ctx.clip();
      for (let i = 0; i < 3; i++) dab(p.x + rnd() * p.w, p.y + rnd() * p.h, p.h * (.3 + rnd() * .4), rnd() < .5 ? '#2E1E36' : '#08050C', .35);
      if (p.k2 < .3) { ctx.strokeStyle = 'rgba(160,120,190,.16)'; ctx.lineWidth = .6; const cx = p.x + p.w * (.3 + p.k * .4), cy = p.y + p.h * .6; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.ellipse(cx, cy, k * p.h * .55, k * p.h * .17, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); } }
      ctx.restore();
    }
    for (const p of plates) { // the joints: a dark crack with a thin lit lip on its far side, where the eclipse catches the edge
      ctx.strokeStyle = '#030206'; ctx.lineWidth = 1.3 + p.row * .12; poly(p.pts); ctx.stroke();
      const n = p.pts.length; ctx.strokeStyle = 'rgba(210,170,230,.42)'; ctx.lineWidth = .6; ctx.beginPath(); let started = false;
      for (let i = 0; i < n; i += 2) { const x = p.pts[i], y = p.pts[i + 1] + 1; if (x > p.x + p.w + .5) break; started ? ctx.lineTo(x, y) : ctx.moveTo(x, y); started = true; } ctx.stroke();
      if (p.k2 > .55 && rnd() < .55) { ctx.fillStyle = 'rgba(255,240,255,.55)'; const gx = p.x + p.w * (.2 + rnd() * .6); ctx.fillRect(gx, p.y + 1.2, 3 + rnd() * 6, .7); } // a glint
    }
    for (const p of plates) if (rnd() < .2 && p.x >= 0 && p.x < AW_W) { // some joints glow: the fire under the road shows through
      const pts = []; for (let i = 0; i < p.pts.length; i += 2) { if (p.pts[i] > p.x + p.w + .5) break; pts.push([p.pts[i], p.pts[i + 1]]); }
      const a = Math.floor(rnd() * Math.max(1, pts.length - 3)), seg = pts.slice(a, a + 3 + Math.floor(rnd() * 3)); if (seg.length < 2) continue;
      roadSeams.push({ pts: seg, ph: rnd() * TAU });
      awGlow(`rgb(${EMBER})`, 6, () => { ctx.strokeStyle = 'rgba(255,150,70,.85)'; ctx.lineWidth = 1; ctx.beginPath(); seg.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke(); });
    }
    for (let i = 0; i < 9; i++) { // cracks running across plates, fire inside them
      let cx = rnd() * AW_W, cy = T + 10 + rnd() * 70; const pts = [[cx, cy]]; for (let s = 0; s < 4; s++) { cx += 4 + rnd() * 10; cy += (rnd() - .4) * 8; pts.push([cx, cy]); }
      if (cx < AW_W) roadSeams.push({ pts, ph: rnd() * TAU });
      awGlow('rgb(255,120,50)', 6, () => { ctx.strokeStyle = 'rgba(255,180,100,.85)'; ctx.lineWidth = .8; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); });
    }
    // small gold sigils of the Courts set into the glass down the middle of the road, like milestones
    for (let i = 0; i < 4; i++) { const x = 160 + i * 320 + rnd() * 40, yy = T + 56 + rnd() * 8;
      awGlow('rgba(240,196,90,.6)', 3, () => { ctx.strokeStyle = 'rgba(232,186,90,.6)'; ctx.lineWidth = .9; ctx.beginPath(); for (let a = 0; a < TAU * 1.7; a += .2) { const rr = 1.5 + a * 1.25; const px = x + Math.cos(a) * rr * 1.6, py = yy + Math.sin(a) * rr * .4; a ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();
        ell(x, yy, 13, 3.4); ctx.stroke(); }); }
    // the near edge: the road simply ends, broken, and under it there is nothing but the glow far below
    { const ey = 349, g = ctx.createLinearGradient(0, ey, 0, VH); g.addColorStop(0, '#1A0A10'); g.addColorStop(1, '#5A2018'); ctx.fillStyle = g; ctx.fillRect(0, ey, AW_W, VH - ey);
      ctx.fillStyle = '#08060C'; ctx.beginPath(); ctx.moveTo(0, ey - 2); for (let x = 0; x <= AW_W; x += 6) ctx.lineTo(x, ey + 2 + Math.abs(Math.sin(x * .37) * 3 + Math.sin(x * .11) * 2)); ctx.lineTo(AW_W, ey - 2); ctx.closePath(); ctx.fill();
      for (let x = 3; x < AW_W; x += 11) { const d = 3 + Math.abs(Math.sin(x * .7)) * 6; ctx.fillStyle = '#08060C'; poly([x - 3, ey + 3, x + 3, ey + 3, x, ey + 3 + d]); ctx.fill(); } } // glass dripping off the edge
    // the back verge: black grass with ember-lit tips in clumps, glass shards, iron stakes and the odd skull
    for (let i = 0; i < 40; i++) awWR(rnd() * AW_W, 30, rnd, (x, r) => { const w = 10 + r() * 30, n = Math.round(w * 2.4);
      ctx.lineCap = 'round'; for (const [col, lw] of [['#0A050A', 1.4], ['#1E0E18', 1.1], ['#7A3420', .7]]) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
        for (let k = 0; k < (col[1] === '7' ? n * .12 : n * .5); k++) { const bx = x + (r() - .5) * w, by = T + 2 + r() * 3, l = (5 + r() * 12) * (1 - Math.abs(bx - x) / w), lean = (r() - .4) * l * .5; ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + lean * .2, by - l * .6, bx + lean, by - l); } ctx.stroke(); } });
    for (let i = 0; i < 22; i++) awWR(rnd() * AW_W, 10, rnd, (x, r) => { const hgt = 6 + r() * 16, w = 2 + r() * 4, lean = (r() - .5) * 6; poly([x - w, T + 3, x + lean, T + 3 - hgt, x + w, T + 3]); ctx.fillStyle = '#100A16'; ctx.fill(); poly([x + lean, T + 3 - hgt, x + w, T + 3, x + w * .2, T + 3]); ctx.fillStyle = '#5A4672'; ctx.globalAlpha = .7; ctx.fill(); ctx.globalAlpha = 1; });
    for (let i = 0; i < 5; i++) awWR(rnd() * AW_W, 10, rnd, (x, r) => { const hh = 26 + r() * 10; ctx.fillStyle = '#1A1218'; ctx.fillRect(x - 1.2, T + 2 - hh, 2.4, hh); ctx.fillStyle = '#6A5A68'; ctx.fillRect(x + .2, T + 2 - hh, .6, hh); chain(x, T + 6 - hh, x + 26, T - 4, 6); });
    for (let i = 0; i < 3; i++) awWR(rnd() * AW_W, 8, rnd, (x) => { ctx.fillStyle = '#B8AC94'; ell(x, T + 1, 4, 3.4); ctx.fill(); ctx.fillRect(x - 2.4, T + 2, 4.8, 2.6); ctx.fillStyle = '#1A1014'; circle(x - 1.5, T + .7, 1); ctx.fill(); circle(x + 1.5, T + .7, 1); ctx.fill(); });
    const sh = ctx.createLinearGradient(0, VH - 40, 0, VH - 11); sh.addColorStop(0, 'rgba(6,2,8,0)'); sh.addColorStop(1, 'rgba(6,2,8,.45)'); ctx.fillStyle = sh; ctx.fillRect(0, VH - 40, AW_W, 29);
  }
  // seams of fire breathing slowly in the floor (shared by the three locales)
  function liveSeams(seams, camX, t, rgb, a0, a1) {
    const x0 = ((camX % AW_W) + AW_W) % AW_W; ctx.lineWidth = 1.5;
    for (const s of seams) for (const tile of [0, AW_W]) {
      const sx = s.pts[0][0] + tile - x0; if (sx > VW + 4 || s.pts[s.pts.length - 1][0] + tile - x0 < -4) continue;
      ctx.strokeStyle = `rgba(${rgb},${a0 + a1 * Math.sin(t * .9 + s.ph)})`; ctx.beginPath(); s.pts.forEach((p, i) => i ? ctx.lineTo(p[0] + tile - x0, p[1]) : ctx.moveTo(p[0] + tile - x0, p[1])); ctx.stroke();
    }
  }
  // embers rising slowly from the road (fixed in the world, so nothing swims or flickers)
  function liveEmbers(camX, t, step, y0, y1, rgb) {
    for (let x = ((-camX) % step + step) % step - step; x < VW + step; x += step) {
      const w = Math.floor((x + camX) / step + .5), life = (t * .22 + hsh(w)) % 1, px = x + hsh(w + 1) * step + Math.sin(t * .5 + w) * 6, py = lerp(y1, y0, life) - hsh(w + 2) * 20;
      ctx.fillStyle = `rgba(${rgb},${Math.sin(life * Math.PI) * .7})`; circle(px, py, 1.1 + hsh(w + 3)); ctx.fill();
    }
  }
  THEMES.chaos = {
    name: 'the black road', sky: ['#1C0C26', '#3E1636', '#86304A', '#E0985A'], sun: [0.72, 0.17, '255,200,140'], haze: '150,70,90',
    floorA: '#2A2034', floorB: '#0A070E', path: '#C8642A', skyKind: 'none',
    grade: { desat: .1, top: 'rgba(70,40,140,.45)', bot: 'rgba(210,90,50,.4)', vig: 'rgba(14,4,16,.62)' },
    liveSky(camX, t) { skyEclipse(THEMES.chaos, camX); skyFrags(camX, t, Y_OFF + 14, Y_OFF + 80); },
    liveFloor(camX, t) { liveSeams(roadSeams, camX, t, '255,150,70', .22, .16); liveEmbers(camX, t, 90, T - 30, T + 90, '255,170,90'); },
  };
  AW_FAR.chaos = roadFar; AW_MID.chaos = roadMid; AW_FLOOR.chaos = roadFloor;

  // ======================================================================================================
  // THE THELBANE SPIRES: needle towers of bone-white stone, floating, hanging, joined by bridges to nowhere
  // ======================================================================================================
  const BONE = { base: '#C8B89A', lit: '#FFF0D0', dark: '#6A5A64', band: '#C9A040', win: '#FFD860' };
  // a great Thelbane spire: a shaft swelling into balconied bulbs, gold-banded, a needle at the top; it may float on a root
  // of rock, or hang upside down from an island
  function spire(x, base, h, w, P, rnd, o = {}) {
    ctx.save(); if (o.flip) { ctx.translate(0, 2 * base); ctx.scale(1, -1); }
    const N = 18, L = [], R = [];
    for (let i = 0; i <= N; i++) { const k = i / N, bul = Math.max(0, Math.sin(k * Math.PI * (o.bulbs || 2.5) + (o.ph || 0))) * .55, sw = w * .5 * (1 - Math.pow(k, 2.4)) * (1 + bul) + .6; L.push([x - sw, base - k * h]); R.push([x + sw, base - k * h]); }
    const tip = [x, base - h - w * 2.2], pts = []; for (const p of L) pts.push(p[0], p[1]); pts.push(tip[0], tip[1]); for (let i = R.length - 1; i >= 0; i--) pts.push(R[i][0], R[i][1]);
    poly(pts); const g = ctx.createLinearGradient(x - w * AW_SUN, 0, x + w * AW_SUN, 0); g.addColorStop(0, P.dark); g.addColorStop(.35, P.dark); g.addColorStop(.6, P.base); g.addColorStop(.85, P.lit); g.addColorStop(1, P.base); ctx.fillStyle = g; ctx.fill();
    ctx.save(); poly(pts); ctx.clip();
    for (let i = 1; i < N; i += 2) { const y = L[i][1]; ctx.fillStyle = P.band; ctx.globalAlpha = .7; ctx.fillRect(x - w * 2, y, w * 4, 1.1); ctx.globalAlpha = 1; } // gold bands
    for (let i = 0; i < 10; i++) dab(x + (rnd() - .5) * w, base - rnd() * h, 2 + rnd() * 3, rnd() < .5 ? P.dark : P.lit, .25);
    ctx.restore();
    if (P.win) for (let i = 0; i < 3 + h / 26; i++) { const k = .1 + rnd() * .8, y = base - k * h; awGlow(P.win, 4, () => { ctx.fillStyle = P.win; rrect(x + (rnd() - .3) * w * .5, y, 1.6, 3, .8); ctx.fill(); }); }
    ctx.restore();
  }
  function bridge(x0, y0, x1, y1, sag, col, lit) { // a thin arched bridge, the far end broken off into nothing
    ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) - sag, x1, y1); ctx.stroke();
    ctx.strokeStyle = lit; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(x0, y0 - 1.2); ctx.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) - sag - 1.2, x1, y1 - 1.2); ctx.stroke();
    for (let k = 1; k < 8; k++) { const u = k / 8, x = (1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * (x0 + x1) / 2 + u * u * x1, y = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * (Math.min(y0, y1) - sag) + u * u * y1; ctx.fillStyle = col; ctx.fillRect(x - .5, y, 1, 4); }
  }
  function stairs(x, y, n, s, P, dir = 1) { // a flight of floating steps
    for (let i = 0; i < n; i++) { const sx = x + i * s * 1.3 * dir, sy = y - i * s; ctx.fillStyle = P.dark; ctx.fillRect(sx, sy, s * 1.4, s * 1.1); ctx.fillStyle = P.base; ctx.fillRect(sx, sy, s * 1.4, s * .5); ctx.fillStyle = P.lit; ctx.fillRect(sx, sy, s * 1.4, .8); }
  }
  function spiresFar(rnd, th, f) {
    AW_SUN = -1;
    buildSky(17, 77, '200,150,120', ['tower', 'meadow', 'stairs', 'house', 'prism'], '255,236,190');
    // high veils of sulfur cloud
    for (let i = 0; i < 26; i++) { const x = rnd() * AW_W, y = 110 + rnd() * 60, r = 40 + rnd() * 60; awWrap(x, r, (x) => awSoft(x, y, r, r * .18, i % 2 ? '240,200,140' : '200,140,170', .3)); }
    // the far city: rank on rank of needles in the haze, some floating, some hanging upside down from islands
    const far = { base: '#9A7A98', lit: '#E8C8B8', dark: '#6A5480', band: 'rgba(230,190,110,.6)', win: null };
    for (let i = 0; i < 16; i++) awWR(rnd() * AW_W, 20, rnd, (x, r) => spire(x, 214 - r() * 30, 40 + r() * 70, 4 + r() * 5, far, r, { bulbs: 1.5 + r() * 2, ph: r() * 3 }));
    hazeBand(f, th.haze, 150, T, .35);
    const mid = { base: '#9A7A8E', lit: '#F4D8B8', dark: '#4E3A62', band: 'rgba(220,170,80,.8)', win: '#FFE08A' };
    for (let i = 0; i < 7; i++) awWR(i * 183 + rnd() * 60, 50, rnd, (x, r) => {
      const fl = r() < .35, y = fl ? 92 + r() * 40 : 226;
      if (fl) { isle(x, y, 22 + r() * 14, 14 + r() * 10, { dark: '#5A4660', base: '#8A7088', lit: '#E0C0B0', top: '#B89AA0' }, r); spire(x + (r() - .5) * 10, y + 4, 40 + r() * 40, 7 + r() * 4, mid, r, { flip: 1, bulbs: 2, ph: r() * 3 }); }
      else spire(x, y, 90 + r() * 70, 8 + r() * 6, mid, r, { bulbs: 2 + r() * 2, ph: r() * 3 });
    });
    for (let i = 0; i < 5; i++) { const x = rnd() * AW_W; awWrap(x, 90, (x) => bridge(x, 150 + rnd() * 40, x + 60 + rnd() * 40, 140 + rnd() * 50, 12 + rnd() * 10, '#8A7088', '#F0D8C0')); }
    for (let i = 0; i < 6; i++) awWR(rnd() * AW_W, 30, rnd, (x, r) => stairs(x, 120 + r() * 60, 4 + Math.floor(r() * 4), 2.4, { dark: '#6A5276', base: '#A88A98', lit: '#F4DCC8' }, r() < .5 ? 1 : -1));
    hazeBand(f, th.haze, 190, T, .4);
  }
  function spiresMid(rnd) {
    AW_SUN = -1;
    // the near towers: great bone spires with gold bands and burning windows; between them floating stair-flights and chains
    const near = { base: '#B49C8C', lit: '#FFEACC', dark: '#3E2C48', band: '#C9A040', win: '#FFD860' };
    const xs = []; for (let i = 0; i < 4; i++) xs.push(90 + i * 320 + rnd() * 90);
    for (const x of xs) awWR(x, 60, rnd, (x, r) => {
      spire(x, T + 6, 150 + r() * 50, 22 + r() * 8, near, r, { bulbs: 2.2 + r(), ph: r() * 2 });
      for (let k = 0; k < 2; k++) { const by = T - 50 - k * 50 - r() * 20; ctx.fillStyle = '#5E4A62'; rrect(x - 30, by, 60, 4, 2); ctx.fill(); ctx.fillStyle = '#E8D8BC'; ctx.fillRect(x - 30, by, 60, 1.2); for (let b = -26; b <= 26; b += 6) { ctx.fillStyle = '#B8A48C'; ctx.fillRect(x + b, by - 7, 2, 7); } ctx.fillStyle = '#C9A040'; ctx.fillRect(x - 30, by - 8, 60, 1.4); } // balconies
    });
    for (let i = 0; i < 4; i++) { const a = xs[i], b = i === 3 ? xs[0] + AW_W : xs[i + 1]; for (const ox of [0, -AW_W]) chain(a + 20 + ox, T - 120 - rnd() * 20, b - 20 + ox, T - 110 - rnd() * 20, 26, '#3A2A3A', '#B89A88'); }
    for (let i = 0; i < 5; i++) awWR(rnd() * AW_W, 40, rnd, (x, r) => stairs(x, T - 70 - r() * 70, 4 + Math.floor(r() * 3), 4.2, { dark: '#5E4A62', base: '#C8B49C', lit: '#FFF2D8' }, r() < .5 ? 1 : -1));
    for (let i = 0; i < 4; i++) awWR(rnd() * AW_W, 40, rnd, (x, r) => { const y = T - 140 - r() * 50; isle(x, y, 16 + r() * 10, 12 + r() * 8, { dark: '#3A2A3E', base: '#7A6276', lit: '#E8C8B0', top: '#B8A08C' }, r); });
  }
  function spiresFloor(rnd, th) {
    spireSeams = [];
    { const g = ctx.createLinearGradient(0, T - 3, 0, VH); g.addColorStop(0, '#B8A48C'); g.addColorStop(.3, '#8A7672'); g.addColorStop(1, '#3A2C3A'); ctx.fillStyle = g; ctx.fillRect(0, T - 3, AW_W, VH - T + 3); }
    // the causeway: flagstones of bone-white stone in courses, a few missing so the Abyss shows through
    const plates = crackNet(rnd, T + 4, [9, 11, 13, 16, 19, 23, 27], { min: 2.2, max: 4.6 });
    for (const p of plates) {
      const l = 1 - p.row * .085, hole = p.k < .045 && p.row > 0 && p.row < 6;
      if (hole) { // a missing stone: the Abyss far below, a few stars in it
        poly(p.pts); const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h); g.addColorStop(0, '#05020A'); g.addColorStop(1, '#2A1238'); ctx.fillStyle = g; ctx.fill();
        ctx.save(); poly(p.pts); ctx.clip(); for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(255,230,255,.7)'; circle(p.x + rnd() * p.w, p.y + rnd() * p.h, .5); ctx.fill(); } ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(p.x - 10, p.y, p.w + 20, p.h * .35); ctx.restore();
        continue;
      }
      poly(p.pts); const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h); g.addColorStop(0, awMix('#D8C8AC', '#6A5464', (1 - l) * 1.6)); g.addColorStop(1, awMix('#9A8678', '#3A2838', (1 - l) * 1.6)); ctx.fillStyle = g; ctx.fill();
      ctx.save(); poly(p.pts); ctx.clip(); for (let i = 0; i < 3; i++) dab(p.x + rnd() * p.w, p.y + rnd() * p.h, p.h * (.3 + rnd() * .4), rnd() < .5 ? '#FFF4E0' : '#7A6A72', .1); ctx.restore();
    }
    for (const p of plates) { ctx.strokeStyle = 'rgba(50,30,50,.75)'; ctx.lineWidth = 1 + p.row * .1; poly(p.pts); ctx.stroke(); ctx.strokeStyle = 'rgba(255,250,235,.45)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(p.pts[0], p.pts[1] + 1); ctx.lineTo(p.x + p.w - 1, p.pts[1] + 1); ctx.stroke(); }
    // the Logrus inlaid down the causeway in gold: lines that writhe and branch and never repeat
    for (let i = 0; i < 14; i++) { let x = i * 91 + rnd() * 40, y = T + 26 + rnd() * 60, a = rnd() * TAU; const pts = [[x, y]];
      for (let s = 0; s < 10; s++) { a += (rnd() - .5) * 1.4; x += Math.cos(a) * 9; y = clamp(y + Math.sin(a) * 3, T + 22, T + 90); pts.push([x, y]); }
      if (pts[0][0] < AW_W - 140) spireSeams.push({ pts, ph: rnd() * TAU });
      awGlow('rgba(240,200,90,.8)', 4, () => { ctx.strokeStyle = 'rgba(214,166,60,.85)'; ctx.lineWidth = .9; ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); }); }
    // the balustrade along the back of the causeway: bone balusters under a gold-lit rail
    const by = T + 3; ctx.fillStyle = '#5E4A62'; ctx.fillRect(0, by - 2, AW_W, 5);
    for (let x = 3; x < AW_W; x += 7) { const g = ctx.createLinearGradient(x - 2, 0, x + 2, 0); g.addColorStop(0, '#7A6476'); g.addColorStop(.6, '#E8DCC4'); g.addColorStop(1, '#B8A48C'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 1.6, by - 2); ctx.quadraticCurveTo(x - 3, by - 9, x - 1.2, by - 15); ctx.lineTo(x + 1.2, by - 15); ctx.quadraticCurveTo(x + 3, by - 9, x + 1.6, by - 2); ctx.fill(); }
    for (let x = 0; x <= AW_W; x += 84) awWrap(x, 8, (x) => { ctx.fillStyle = '#C8B49C'; ctx.fillRect(x - 4, by - 22, 8, 22); ctx.fillStyle = '#FFF2D8'; ctx.fillRect(x - 4, by - 22, 2, 22); ctx.fillStyle = '#C9A040'; poly([x - 5, by - 22, x, by - 30, x + 5, by - 22]); ctx.fill(); });
    ctx.fillStyle = '#D8C8AC'; ctx.fillRect(0, by - 18, AW_W, 3); ctx.fillStyle = '#FFF4DC'; ctx.fillRect(0, by - 18, AW_W, .9); ctx.fillStyle = '#C9A040'; ctx.fillRect(0, by - 15.4, AW_W, .8);
    // the near edge of the causeway, carved, over nothing
    const ey = 350; ctx.fillStyle = '#2A1A2A'; ctx.fillRect(0, ey, AW_W, VH - ey); ctx.fillStyle = '#C8B49C'; ctx.fillRect(0, ey - 1, AW_W, 2.4);
    for (let x = 0; x < AW_W; x += 16) { ctx.fillStyle = '#8A7680'; ctx.beginPath(); ctx.arc(x + 8, ey + 1.4, 6, 0, Math.PI); ctx.fill(); }
    const sh = ctx.createLinearGradient(0, VH - 44, 0, VH - 10); sh.addColorStop(0, 'rgba(30,14,30,0)'); sh.addColorStop(1, 'rgba(30,14,30,.4)'); ctx.fillStyle = sh; ctx.fillRect(0, VH - 44, AW_W, 34);
  }
  THEMES.chaos2 = {
    name: 'the thelbane spires', sky: ['#160C2A', '#3E2056', '#9A5A70', '#E8B070'], sun: [0.3, 0.2, '255,220,160'], haze: '220,170,150',
    floorA: '#B8A48C', floorB: '#3A2C3A', path: '#C9A040', skyKind: 'none',
    grade: { desat: .06, top: 'rgba(60,40,150,.5)', bot: 'rgba(190,110,80,.3)', vig: 'rgba(24,8,30,.66)' },
    liveSky(camX, t) { skyEclipse(THEMES.chaos2, camX); skyFrags(camX, t, Y_OFF + 30, Y_OFF + 90, .9); },
    liveFloor(camX, t) { liveSeams(spireSeams, camX, t, '255,210,110', .16, .14); },
  };
  AW_FAR.chaos2 = spiresFar; AW_MID.chaos2 = spiresMid; AW_FLOOR.chaos2 = spiresFloor;

  // ======================================================================================================
  // THE RIM OF THE ABYSS: the last dais at the edge of everything; overhead the Abyss turns like a storm round the black sun
  // ======================================================================================================
  function buildVortex(seed) {
    const S = 760, [c, g] = makeLayer(S, S), old = ctx, rnd = mulberry(seed); ctx = g; ctx.translate(S / 2, S / 2);
    // arms of dark cloud wound into the eye, their leading edges lit by the fire at the bottom of the Abyss
    for (let arm = 0; arm < 5; arm++) for (let i = 0; i < 46; i++) {
      const k = i / 46, a = arm / 5 * TAU + k * 4.2, d = 40 + k * 330, r = 14 + k * 50;
      const x = Math.cos(a) * d, y = Math.sin(a) * d * .62, col = ['#2A1028', '#3A1432', '#4A1A34', '#2E1230', '#3E1838'][(i + arm) % 5];
      ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2); ctx.globalAlpha = .55 + rnd() * .3; ctx.fillStyle = col; ell(0, 0, r, r * .34); ctx.fill();
      ctx.globalAlpha = .45 * (1 - k * .6); ctx.fillStyle = k < .5 ? '#E88A50' : '#B0506A'; ell(-r * .1, -r * .22, r * .8, r * .07); ctx.fill(); ctx.restore();
    }
    ctx.globalAlpha = 1;
    addB(() => { softDab(0, 0, 120, '255,150,90', .35); softDab(0, 0, 60, '255,220,170', .4);
      for (let arm = 0; arm < 5; arm++) { ctx.strokeStyle = 'rgba(255,170,100,.2)'; ctx.lineWidth = 2; ctx.beginPath(); for (let k = 0; k <= 1; k += .02) { const a = arm / 5 * TAU + k * 4.2 + .3, d = 50 + k * 320; ctx.lineTo(Math.cos(a) * d, Math.sin(a) * d * .62); } ctx.stroke(); } });
    ctx = old; paintLayer(c, { ink: '#140810', line: .3, lw: .8, brush: .8, hatch: 0, seed: 5 }); return c;
  }
  function statue(x, base, h, rnd) { // a Lord of Chaos in black stone, hooded and crowned with horns, leaning on a sword
    const w = h * .26, P = { base: '#2E2434', lit: '#9A6A6A', dark: '#120C16' }, dir = AW_SUN;
    const sideG = (x0, x1) => { const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(dir > 0 ? 0 : 1, P.dark); g.addColorStop(.5, P.base); g.addColorStop(dir > 0 ? 1 : 0, P.lit); return g; };
    ctx.fillStyle = sideG(x - w * 1.3, x + w * 1.3); ctx.fillRect(x - w * 1.3, base - h * .1, w * 2.6, h * .1); // the plinth
    ctx.fillStyle = '#C9A040'; ctx.fillRect(x - w * 1.3, base - h * .1, w * 2.6, 1.2);
    const robe = [x - w * 1.1, base - h * .1, x - w * .7, base - h * .62, x - w * .45, base - h * .8, x + w * .45, base - h * .8, x + w * .7, base - h * .62, x + w * 1.1, base - h * .1];
    poly(robe); ctx.fillStyle = sideG(x - w, x + w); ctx.fill();
    ctx.strokeStyle = 'rgba(10,6,12,.6)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = -2; i <= 2; i++) { ctx.moveTo(x + i * w * .2, base - h * .7); ctx.quadraticCurveTo(x + i * w * .3, base - h * .4, x + i * w * .42, base - h * .1); } ctx.stroke(); // folds
    // the hood, a void of a face, the crown of horns
    const hy = base - h * .86; ctx.fillStyle = sideG(x - w * .5, x + w * .5); blob([x - w * .5, hy + w * .3, x - w * .45, hy - w * .4, x, hy - w * .6, x + w * .45, hy - w * .4, x + w * .5, hy + w * .3, x, hy + w * .45]); ctx.fill();
    ctx.fillStyle = '#05030A'; ell(x, hy, w * .24, w * .3); ctx.fill();
    awGlow('rgba(255,190,90,.9)', 6, () => { ctx.fillStyle = '#FFC060'; circle(x - w * .09, hy - w * .04, 1.3); ctx.fill(); circle(x + w * .09, hy - w * .04, 1.3); ctx.fill(); });
    for (let i = -2; i <= 2; i++) { ctx.fillStyle = i % 2 ? '#1A1220' : '#2A1E2C'; const bx = x + i * w * .18; poly([bx - 2.4, hy - w * .5, bx + i * 3, hy - w * .5 - h * (.06 + (2 - Math.abs(i)) * .025), bx + 2.4, hy - w * .5]); ctx.fill(); }
    // the sword held point-down before it, both hands on the pommel
    ctx.fillStyle = '#3A3044'; ctx.fillRect(x - 1.6, base - h * .56, 3.2, h * .46); ctx.fillStyle = '#7A6A8A'; ctx.fillRect(x + (dir > 0 ? .4 : -1.4), base - h * .56, 1, h * .46);
    ctx.fillStyle = '#C9A040'; ctx.fillRect(x - w * .4, base - h * .58, w * .8, 2.4); circle(x, base - h * .62, 2.6); ctx.fill();
    ctx.fillStyle = sideG(x - w * .3, x + w * .3); ell(x, base - h * .65, w * .3, w * .16); ctx.fill();
    for (let i = 0; i < 12; i++) dab(x + (rnd() - .5) * w * 1.6, base - rnd() * h * .8, 2 + rnd() * 3, rnd() < .5 ? P.dark : P.base, .3);
  }
  function rimFar(rnd, th, f) {
    AW_SUN = 1;
    buildSky(30, 13, '120,40,60', ['house', 'meadow', 'tower', 'stairs', 'prism', 'meadow'], '255,200,140');
    retire(vortC); vortC = buildVortex(29);
    // the far rim: cliffs of the Abyss's lip curving away, black against the glow, their edges burning
    for (const [base, amp, col, edge, seed] of [[206, 26, '#2A1220', 'rgba(255,140,80,.55)', 3], [222, 18, '#1A0A16', 'rgba(255,120,70,.45)', 9]]) {
      const wv = awWave(seed, [[3, amp], [7, amp * .5], [17, amp * .25], [31, amp * .1]]);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, T); for (let x = 0; x <= AW_W; x += 4) ctx.lineTo(x, base + wv(x) - Math.abs(Math.sin(x * .09)) * 4); ctx.lineTo(AW_W, T); ctx.fill();
      awGlow('rgba(255,150,80,.8)', 4, () => { ctx.strokeStyle = edge; ctx.lineWidth = 1.2; ctx.beginPath(); for (let x = 0; x <= AW_W; x += 4) ctx.lineTo(x, base + wv(x) - Math.abs(Math.sin(x * .09)) * 4); ctx.stroke(); });
      for (let i = 0; i < 6; i++) awWR(rnd() * AW_W, 20, rnd, (x, r) => { const y = base + wv(x) - 2; ctx.fillStyle = col; poly([x - 3, y + 2, x - 1, y - 18 - r() * 30, x + 1, y - 18 - r() * 30, x + 3, y + 2]); ctx.fill(); }); // broken towers on the rim
    }
    hazeBand(f, th.haze, 200, T, .3);
  }
  function rimMid(rnd) {
    // the two Lords of Chaos who stand at the last edge, one each side of the dais; between them broken pillars and chains
    AW_SUN = 1; awWR(225, 60, rnd, (x, r) => statue(x, T + 4, 168, r));
    AW_SUN = -1; awWR(775, 60, rnd, (x, r) => statue(x, T + 4, 168, r));
    AW_SUN = 1;
    for (const [x, h] of [[90, 90], [360, 60], [640, 40], [1020, 110], [1180, 70]]) awWR(x + rnd() * 30, 20, rnd, (x, r) => { // broken pillars
      const w = 9 + r() * 4, g = ctx.createLinearGradient(x - w, 0, x + w, 0); g.addColorStop(0, '#120C16'); g.addColorStop(.6, '#2E2434'); g.addColorStop(1, '#6A4A56'); ctx.fillStyle = g;
      poly([x - w, T + 4, x - w, T - h, x - w * .3, T - h - 6, x + w * .2, T - h + 2, x + w, T - h - 4, x + w, T + 4]); ctx.fill();
      ctx.strokeStyle = 'rgba(10,6,12,.5)'; ctx.lineWidth = .8; for (let y = T - h + 10; y < T; y += 14) { ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x + w, y + 1); ctx.stroke(); }
    });
    chain(240, T - 120, 760, T - 120, 60, '#1A1018', '#7A5A60');
    for (let i = 0; i < 14; i++) awWR(rnd() * AW_W, 16, rnd, (x, r) => crag(x, T - 6 - r() * 20, 5 + r() * 8, r, OBS, { veins: r() < .5 ? 1 : 0 }));
  }
  function rimFloor(rnd, th) {
    rimSeams = [];
    { const g = ctx.createLinearGradient(0, T - 3, 0, VH); g.addColorStop(0, '#4A2A32'); g.addColorStop(.2, '#2A1A26'); g.addColorStop(1, '#0C080E'); ctx.fillStyle = g; ctx.fillRect(0, T - 3, AW_W, VH - T + 3); }
    const plates = crackNet(rnd, T + 3, [10, 12, 15, 18, 22, 26], { min: 2, max: 4.4 });
    for (const p of plates) { poly(p.pts); ctx.fillStyle = p.k < .5 ? `rgba(120,80,110,${.08 + p.k2 * .1})` : `rgba(0,0,0,${.12 + p.k2 * .25})`; ctx.fill();
      ctx.save(); poly(p.pts); ctx.clip(); for (let i = 0; i < 3; i++) dab(p.x + rnd() * p.w, p.y + rnd() * p.h, p.h * .4, rnd() < .5 ? '#4A3444' : '#08050A', .25); ctx.restore(); }
    for (const p of plates) { ctx.strokeStyle = '#05030A'; ctx.lineWidth = 1.2 + p.row * .12; poly(p.pts); ctx.stroke(); ctx.strokeStyle = 'rgba(230,160,140,.3)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(p.pts[0], p.pts[1] + 1); ctx.lineTo(p.x + p.w - 1, p.pts[1] + 1); ctx.stroke(); }
    // the great sign set into the dais where it waits: rings, and the arms of the Logrus spiraling out of the middle
    const sx = 700, sy = T + 58, R = 200;
    awGlow('rgba(255,170,80,.9)', 6, () => {
      ctx.strokeStyle = 'rgba(230,170,80,.6)'; ctx.lineWidth = 1.6; ell(sx, sy, R, R * .2); ctx.stroke(); ctx.lineWidth = 1; ell(sx, sy, R * .9, R * .18); ctx.stroke(); ell(sx, sy, R * .3, R * .06); ctx.stroke();
      ctx.beginPath(); for (let k = 0; k < 48; k++) { const a = k / 48 * TAU, c = Math.cos(a), s = Math.sin(a); ctx.moveTo(sx + c * R * .9, sy + s * R * .18); ctx.lineTo(sx + c * R, sy + s * R * .2); } ctx.stroke();
    });
    for (let arm = 0; arm < 7; arm++) { const pts = []; for (let k = 0; k <= 1.001; k += .06) { const a = arm / 7 * TAU + k * 2.6 + Math.sin(k * 9 + arm) * .15, d = R * (.3 + k * .6); pts.push([sx + Math.cos(a) * d, sy + Math.sin(a) * d * .2]); }
      rimSeams.push({ pts, ph: arm * .9 }); awGlow('rgba(255,150,70,.9)', 5, () => { ctx.strokeStyle = 'rgba(255,170,90,.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); }); }
    // the broken back edge of the dais, the glow of the Abyss rising behind it
    ctx.fillStyle = '#1A0E16'; ctx.beginPath(); ctx.moveTo(0, T + 4); for (let x = 0; x <= AW_W; x += 5) ctx.lineTo(x, T - 1 - Math.abs(Math.sin(x * .21) * 3 + Math.sin(x * .07) * 3)); ctx.lineTo(AW_W, T + 4); ctx.fill();
    for (let i = 0; i < 18; i++) awWR(rnd() * AW_W, 10, rnd, (x, r) => { const hgt = 5 + r() * 12, w = 2 + r() * 4; poly([x - w, T + 3, x + (r() - .5) * 4, T + 3 - hgt, x + w, T + 3]); ctx.fillStyle = '#120A16'; ctx.fill(); });
    const ey = 350, g = ctx.createLinearGradient(0, ey, 0, VH); g.addColorStop(0, '#1A0A10'); g.addColorStop(1, '#6A2418'); ctx.fillStyle = g; ctx.fillRect(0, ey, AW_W, VH - ey);
    ctx.fillStyle = '#0C080E'; ctx.beginPath(); ctx.moveTo(0, ey - 2); for (let x = 0; x <= AW_W; x += 6) ctx.lineTo(x, ey + 2 + Math.abs(Math.sin(x * .29) * 4)); ctx.lineTo(AW_W, ey - 2); ctx.fill();
    const sh = ctx.createLinearGradient(0, VH - 44, 0, VH - 10); sh.addColorStop(0, 'rgba(6,2,8,0)'); sh.addColorStop(1, 'rgba(6,2,8,.45)'); ctx.fillStyle = sh; ctx.fillRect(0, VH - 44, AW_W, 34);
  }
  THEMES.chaosBoss = {
    name: 'the rim of the abyss', sky: ['#06030A', '#1A0818', '#4A1426', '#A0402E'], sun: [0.5, 0.27, '255,190,120'], haze: '120,40,50',
    floorA: '#2A1A26', floorB: '#0C080E', path: '#FF9A50', skyKind: 'none',
    grade: { desat: .08, top: 'rgba(60,30,130,.5)', bot: 'rgba(220,90,50,.42)', vig: 'rgba(8,2,10,.7)' },
    liveSky(camX, t) {
      const th = THEMES.chaosBoss, sx = VW * th.sun[0] - camX * .02, sy = Y_OFF + VIEW_H * th.sun[1];
      if (vortC) { ctx.save(); ctx.translate(sx, sy); ctx.rotate(t * .025); ctx.scale(1, 1); ctx.globalAlpha = .95; ctx.drawImage(vortC, -380, -380, 760, 760); ctx.restore(); }
      skyEclipse(th, camX);
      const W = VW + 260; // fragments of worlds, falling slowly round into the eye
      frags.forEach((f, i) => { const a = t * .03 + i / frags.length * TAU, d = 150 + (i % 3) * 50 + Math.sin(t * .05 + i) * 20, s = .3 + (i % 3) * .1;
        const x = sx + Math.cos(a) * d * 1.3, y = sy + Math.sin(a) * d * .5; ctx.save(); ctx.translate(x, y); ctx.rotate(a * .5); ctx.globalAlpha = .85; ctx.drawImage(f.c, -60 * s, -60 * s, 120 * s, 120 * s); ctx.restore(); });
    },
    liveFloor(camX, t) { liveSeams(rimSeams, camX, t, '255,170,90', .22, .2); liveEmbers(camX, t, 70, T - 40, T + 100, '255,160,90'); },
  };
  AW_FAR.chaosBoss = rimFar; AW_MID.chaosBoss = rimMid; AW_FLOOR.chaosBoss = rimFloor;

  // ======================================================================================================
  // THE HUMANS OF THE COURTS: their looks for drawHumanoid, and their weapons
  // ======================================================================================================
  Object.assign(HUMANS, {
    // a knight of the Courts: grey-violet skin, maroon surcoat over black steel, a horned gold circlet, eyes like coals
    w4knight: { skin: '#B4A2B2', hair: '#120A10', body: '#5A1828', sleeve: '#481422', trim: '#C9A040', legs: '#1C1218', boots: '#120A10', plate: '#3A3244', plateTrim: '#C9A040', pauldron: '#2E2836', cape: '#2A0A16', crown: '#C9A040', eye: '#FFC850', weapon: 'w4flamberge' },
    // an adept of the Logrus: a deep bruise-violet hood and robe, a black rod crowned with a knot of living chaos
    w4adept: { skin: '#C8B4C2', hood: '#2E1640', body: '#3E1E4E', sleeve: '#341844', trim: '#E0B040', legs: '#1A0E22', boots: '#120A18', coat: '#2E1840', coat2: '#3E2252', eye: '#F0D070', mask: '#1A0E1E', weapon: 'w4rod' },
    // Borel, Duke of Chaos, master of swords: silver plate chased with gold, long white hair, a crimson cloak
    w4borel: { skin: '#D2C2CC', hair: '#E4DCD4', longHair: 1, body: '#6A1A2A', sleeve: '#5A1422', trim: '#E8C060', legs: '#241418', boots: '#1A1014', plate: '#9A8CA4', plateTrim: '#E8C060', pauldron: '#8A7C96', cape: '#5A0E20', crown: '#E8C060', eye: '#FF9A50', weapon: 'w4greatblade' },
  });
  // a wavy blade of black glass, its edge still glowing from the fire it was drawn out of
  function wavyBlade(x0, x1, w0, waves, cols) {
    const top = [], bot = [];
    for (let x = x0; x <= x1; x += 2) { const k = (x - x0) / (x1 - x0), w = w0 * (1 - k * .7) + .5, wv = Math.sin((x - x0) * waves) * 1.1 * (1 - k * .4); top.push(x, -w + wv); bot.push(x, w + wv); }
    const tipX = x1 + w0 * 1.6, path = () => { ctx.beginPath(); ctx.moveTo(top[0], top[1]); for (let i = 2; i < top.length; i += 2) ctx.lineTo(top[i], top[i + 1]); ctx.lineTo(tipX, 0); for (let i = bot.length - 2; i >= 0; i -= 2) ctx.lineTo(bot[i], bot[i + 1]); ctx.closePath(); };
    path(); const g = ctx.createLinearGradient(0, -w0, 0, w0); g.addColorStop(0, C(cols[1])); g.addColorStop(.45, C(cols[0])); g.addColorStop(1, C(shade(cols[0], -.5))); ctx.fillStyle = g; ctx.fill();
    if (DET()) {
      ctx.strokeStyle = cols[2]; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(x0 + 2, 0); for (let x = x0 + 2; x < x1 - 6; x += 2) ctx.lineTo(x, Math.sin((x - x0) * waves) * 1.1 * .7); ctx.stroke(); // the ridge down the middle
      add(() => { ctx.strokeStyle = cols[3]; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bot[0], bot[1] - .3); for (let i = 2; i < bot.length; i += 2) ctx.lineTo(bot[i], bot[i + 1] - .3); ctx.lineTo(tipX, 0); ctx.stroke(); ctx.lineWidth = 3; ctx.globalAlpha = .25; ctx.stroke(); });
    }
    path(); outline(1.25);
  }
  Object.assign(ENEMY_WEAPONS, {
    w4flamberge(pose) {
      awInked('#C9A040', 1.2, () => ctx.arc(4.2, 0, 2.3, 0, TAU)); // pommel
      limb([6.4, 0, 16, 0], '#2A1018', 4);
      if (awPlain()) { ctx.strokeStyle = '#8A2A30'; ctx.lineWidth = .7; ctx.beginPath(); for (let x = 7; x < 15; x += 1.6) { ctx.moveTo(x, -2); ctx.lineTo(x + 1.1, 2); } ctx.stroke(); }
      awHand(pose);
      wavyBlade(21, 64, 3.6, .5, ['#241A2E', '#6A5684', '#9A86B8', 'rgba(255,150,70,.9)']);
      // the guard: two gold horns curling back toward the hand
      horn(19.5, -1, 18, -7, 13, -10, 3, .4, '#C9A040', 1); horn(19.5, 1, 18, 7, 13, 10, 3, .4, '#C9A040', 1);
      rrect(18.4, -3.4, 3.2, 6.8, 1); ctx.fillStyle = C('#B08A34'); ctx.fill(); outline(1);
      awSwingGlow(pose, 16, 56);
    },
    w4greatblade(pose) { // Borel's sword: longer, silver-black, with a ruby set in the guard
      awInked('#E8C060', 1.3, () => ctx.arc(3.6, 0, 2.8, 0, TAU));
      limb([6.4, 0, 18, 0], '#3A1018', 4.4);
      if (awPlain()) { ctx.strokeStyle = '#E8C060'; ctx.lineWidth = .6; ctx.beginPath(); for (let x = 7; x < 17; x += 1.5) { ctx.moveTo(x, -2.2); ctx.lineTo(x + 1, 2.2); } ctx.stroke(); }
      awHand(pose);
      wavyBlade(24, 76, 4.2, .42, ['#3A3448', '#C8C0D8', '#F0ECFA', 'rgba(255,170,90,.85)']);
      horn(22, -1.2, 21, -9, 15, -12, 3.4, .4, '#E8C060', 1); horn(22, 1.2, 21, 9, 15, 12, 3.4, .4, '#E8C060', 1);
      rrect(20.6, -4, 3.6, 8, 1.2); ctx.fillStyle = C('#C8A048'); ctx.fill(); outline(1);
      ctx.fillStyle = C('#C8203A'); circle(22.4, 0, 1.6); ctx.fill(); if (awPlain()) { ctx.fillStyle = '#FFC0C8'; circle(22, -.5, .5); ctx.fill(); }
      awSwingGlow(pose, 18, 66);
    },
    // the adept's rod: black iron, banded in gold, crowned by a knot of chaos that will not hold one shape
    w4rod(pose) {
      limb([-18, 0, 40, 0], '#1E1424', 3.2);
      if (awPlain()) { ctx.strokeStyle = '#4A3A58'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(-16, -1); ctx.lineTo(38, -1); ctx.stroke(); }
      ctx.fillStyle = C('#C9A040'); for (const x of [-19, 12, 33]) { rrect(x, -2.3, 2.2, 4.6, .8); ctx.fill(); outline(.7); }
      // the knot: three crossing loops of dark matter with a sulfur fire at their heart, turning slowly
      const now = performance.now() / 1000, a0 = now * .8, ox = 48;
      awHalo(ox, 0, 18, SULF, .3);
      for (let k = 0; k < 3; k++) {
        const a = a0 + k * TAU / 3; ctx.save(); ctx.translate(ox, 0); ctx.rotate(a); ctx.scale(1, .42);
        ctx.strokeStyle = C(OUT); ctx.lineWidth = 3.2; circle(0, 0, 6.5); ctx.stroke();
        ctx.strokeStyle = C(['#4A2A5E', '#6A3A7A', '#3A1E4A'][k]); ctx.lineWidth = 1.8; circle(0, 0, 6.5); ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = C('#FFE6A0'); circle(ox, 0, 2.2); ctx.fill();
      awAdd(() => { ctx.fillStyle = 'rgba(255,200,110,.6)'; circle(ox, 0, 3.6); ctx.fill(); });
      horn(40, -1.5, 42, -6, 45, -8, 2.2, .3, '#C9A040', .9); horn(40, 1.5, 42, 6, 45, 8, 2.2, .3, '#C9A040', .9); // claws holding it
      awHand(pose);
    },
  });
  // the knights step through Shadow (they fade out and back in), and Borel stands a head taller than his men
  const humanDraw = CREATURES.human;
  CREATURES.human = function (e, a) {
    const v = e.w4vis ?? 1; if (v <= .02) return;
    ctx.save(); if (v < 1) ctx.globalAlpha *= v;
    if (e.def.w4scale) { const s = e.def.w4scale; ctx.scale(s, s); }
    if (e.w4pose && a) a = Object.assign({}, a, { pose: Object.assign({}, a.pose, e.w4pose) });
    humanDraw(e, a); ctx.restore();
  };
  // the breakable pods of this world: geodes of black glass, cracked open on a heart of fire
  const podDraw = drawPod;
  drawPod = function (p, t) {
    if (p.theme !== 'chaos') { podDraw(p, t); return; }
    ctx.save(); ctx.translate(p.x, p.y); shadow(0, 0, 16);
    cel(PP([-14, 0, -15, -14, -8, -27, 3, -31, 12, -22, 15, -9, 12, 0]), '#2A1E36', { d: 3, r: 1.2, w: 2, lite: '#7A5A98' });
    if (DET()) {
      ctx.strokeStyle = 'rgba(255,150,70,.9)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(-6, -26); ctx.lineTo(-2, -17); ctx.lineTo(-7, -9); ctx.lineTo(-3, -2); ctx.moveTo(-2, -17); ctx.lineTo(5, -14); ctx.stroke();
      glowAt(-3, -14, 14 + Math.sin(t * 1.2 + p.x) * 2, EMBER, .4);
      ctx.fillStyle = 'rgba(230,200,255,.5)'; poly([3, -31, 12, -22, 6, -22]); ctx.fill();
    }
    ctx.restore();
  };

  // ======================================================================================================
  // THE BEASTS OF THE ABYSS
  // ======================================================================================================
  // ember cracks running over dark hide, as if the fire inside were showing through
  function cracks(list, a = .85) {
    if (!DET()) return;
    add(() => { ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const [w, al] of [[2.6, .22 * a], [.9, a]]) { ctx.strokeStyle = `rgba(255,${al > .5 ? 170 : 120},70,${al})`; ctx.lineWidth = w; ctx.beginPath(); for (const c of list) { ctx.moveTo(c[0], c[1]); for (let i = 2; i < c.length; i += 2) ctx.lineTo(c[i], c[i + 1]); } ctx.stroke(); } });
  }
  // a lobe of smoke: dark, soft-edged, lit faintly violet on top
  function smokeLobe(x, y, r, col = '#1A1022', a = .9) {
    ctx.globalAlpha = a; ctx.fillStyle = C(col); circle(x, y, r); ctx.fill();
    if (DET()) { ctx.fillStyle = 'rgba(120,90,150,.35)'; ell(x + r * .25, y - r * .35, r * .55, r * .3, -.3); ctx.fill(); }
    ctx.globalAlpha = 1;
  }

  // ---------------- HOUND OF CHAOS: a lean black hound wearing a skull of bone, its mane a banner of smoke ----------------
  CREATURES.w4hound = function (e, a) {
    a = a || {}; const t = a.t || 0, ph = a.walk || 0, wind = a.wind || 0, st = e.state;
    const leap = st === 'pounce', bite = st === 'strike', crouch = st === 'wind' ? wind : 0, moving = ph ? 1 : 0;
    const by = -21 + crouch * 6 + (leap ? -2 : 0) + Math.abs(Math.sin(ph)) * -1.5 * moving, tilt = leap ? -.12 : crouch * .12;
    const hide = '#1E1426', dk = '#0A060E', lit = '#5E4878';
    ctx.save(); ctx.lineJoin = 'round'; ctx.rotate(tilt);
    // the tail: a whip that ends in smoke
    const tw = Math.sin(t * 2.4) * 3;
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 4.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-16, by - 2); ctx.quadraticCurveTo(-28, by - 6 + tw, -34, by - 14 + tw * 1.5); ctx.stroke();
    ctx.strokeStyle = C(hide); ctx.lineWidth = 2.4; ctx.stroke();
    for (let i = 0; i < 3; i++) smokeLobe(-34 - i * 3.5 + Math.sin(t * 1.6 + i) * 1.2, by - 15 - i * 2.4 + tw * 1.5, 3.4 - i * .6, '#241830', .85 - i * .2);
    // legs: hip/shoulder -> knee -> hock/wrist -> paw. far pair darker, behind the body
    const leg = (hx, front, off, far) => {
      const s = Math.sin(ph + off) * moving, lift = Math.max(0, Math.cos(ph + off)) * 3.2 * moving, col = far ? '#120C18' : hide;
      let k, h2, p;
      if (leap) { k = front ? [hx + 6, by + 8] : [hx - 6, by + 8]; h2 = front ? [hx + 13, by + 10] : [hx - 13, by + 8]; p = front ? [hx + 19, by + 8] : [hx - 20, by + 5]; }
      else if (front) { k = [hx + s * 3, by + 11 - crouch * 2]; h2 = [hx + 2 + s * 6, -5 - lift]; p = [hx + 5 + s * 7, -.8 - lift]; }
      else { k = [hx + 4 + s * 4, by + 9]; h2 = [hx - 3 + s * 6, -6 - lift + crouch * 2]; p = [hx - 1 + s * 7, -.8 - lift]; }
      seg(hx, by + 2, k[0], k[1], 7.5, 4.4, col, 1.2); seg(k[0], k[1], h2[0], h2[1], 4, 3, col, .3); seg(h2[0], h2[1], p[0], p[1], 3, 2.6, col, 0);
      ctx.fillStyle = C(far ? '#08050A' : '#140C18'); ell(p[0] + 1.6, p[1] - .2, 3.2, 1.6); ctx.fill(); outline(.9);
      if (!far && DET()) { ctx.fillStyle = '#C8B898'; for (let c = 0; c < 3; c++) { ctx.beginPath(); ctx.moveTo(p[0] + 3 + c * .2, p[1] - 1 + c * .8); ctx.lineTo(p[0] + 5.4, p[1] - .2 + c * .9); ctx.lineTo(p[0] + 3, p[1] + .2 + c * .8); ctx.fill(); } } // bone claws
    };
    leg(-12, false, Math.PI, true); leg(9, true, 0, true);
    // the body: a deep chest, a tucked waist, haunches
    const body = PB([16, by - 2, 12, by + 9, 2, by + 6, -6, by + 3, -15, by + 6, -20, by - 1, -16, by - 7, -6, by - 7, 6, by - 10]);
    cel(body, hide, { d: 3.4, r: 1.4, w: 1.8, dark: dk, lite: lit, tex: () => {
      ctx.strokeStyle = 'rgba(120,96,150,.35)'; ctx.lineWidth = .7; ctx.beginPath(); for (let i = 0; i < 5; i++) { const x = -10 + i * 5; ctx.moveTo(x, by - 4); ctx.quadraticCurveTo(x + 2, by, x + 1, by + 4); } ctx.stroke(); // the ribs, showing
    } });
    cracks([[-14, by - 3, -10, by + 1, -12, by + 4], [2, by - 6, 4, by - 1, 1, by + 3, 3, by + 6], [-4, by - 5, -6, by - 1]], leap || bite ? 1 : .75);
    leg(-12, false, 0, false); leg(9, true, Math.PI, false);
    // the mane: smoke streaming back from the neck
    for (let i = 0; i < 6; i++) { const k = i / 5, sx = 12 - k * 22, sy = by - 9 - Math.sin(k * Math.PI) * 4 + Math.sin(t * 2 + i) * 1.4; smokeLobe(sx - (leap ? 4 : 0), sy - 2, 4.6 - k * 1.6, i % 2 ? '#2A1A36' : '#1E1228', .9 - k * .3); }
    // the neck, and the skull it wears: bone, cracked, with horns swept back
    const hx = 21 + (bite ? 5 : 0) - crouch * 2, hy = by - 9 + crouch * 7 + (bite ? 2 : 0);
    seg(10, by - 4, hx - 3, hy + 1, 10, 7, hide, 1);
    const open = bite ? .55 : leap ? .4 : crouch * .35;
    ctx.save(); ctx.translate(hx, hy);
    horn(-2, -4, -6, -10, -13, -12, 3.4, .4, '#B8A88A', 1); // the far horn
    ctx.save(); ctx.rotate(open); // the lower jaw
    fillPoly([-3, 1, 12, 2, 13, 4, 2, 6, -3, 4], '#A89878', 1.1); ctx.fillStyle = C('#F4ECDA'); for (let x = 2; x <= 11; x += 3) { poly([x, 2, x + 1, -.6, x + 2, 2]); ctx.fill(); }
    ctx.restore();
    if (open > .2) { ctx.fillStyle = C('#3A0A14'); poly([0, 0, 13, 0, 12, 2 + open * 10, 0, 4]); ctx.fill(); glowAt(6, 2, 8, EMBER, .35 * open); }
    const skull = PB([-5, -5, 2, -8, 10, -6, 16, -2, 15, 1, 6, 1.5, -3, 2]);
    cel(skull, '#D8CCB0', { d: 2, r: .9, w: 1.4, dark: '#8A7C62', lite: '#FFF6E0', tex: () => { ctx.strokeStyle = '#6A5C48'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(7, -6.5); ctx.lineTo(9, -3); ctx.lineTo(8, -1); ctx.moveTo(12, -3); ctx.lineTo(14, -.5); ctx.stroke(); } });
    ctx.fillStyle = C('#F4ECDA'); for (let x = 6; x <= 14; x += 2.7) { poly([x, 1, x + .9, 3.6, x + 1.8, 1]); ctx.fill(); }
    ctx.fillStyle = C('#140A10'); ell(4.4, -3.4, 2.6, 2, -.2); ctx.fill(); // the socket
    if (!a.hurt) { ctx.fillStyle = C(wind ? '#FFE48A' : '#FFB050'); ell(4.8, -3.4, 1.3, .9, -.2); ctx.fill(); glowAt(4.8, -3.4, 7, EMBER, wind ? .7 : .4); }
    ctx.fillStyle = C('#140A10'); ell(14.5, -1.5, .9, .6); ctx.fill(); // nostril
    horn(0, -6, -4, -12, -12, -15, 3.8, .4, '#E0D4B8', 1.1); // the near horn
    ctx.restore();
    ctx.restore();
  };

  // ---------------- WATCHER OF THE ABYSS: a great eye in a husk of bone and flesh, trailing feelers ----------------
  CREATURES.w4eye = function (e, a) {
    a = a || {}; const t = a.t || 0, wind = a.wind || 0, hurt = a.hurt;
    const cy = -18, R = 11, bob = Math.sin(t * 1.6 + (e.walk || 0)) * 1.2;
    ctx.save(); ctx.translate(0, bob); ctx.lineCap = 'round';
    // feelers hanging below, swaying slowly
    for (let i = 0; i < 5; i++) {
      const x0 = -7 + i * 3.5, sw = Math.sin(t * 1.3 + i * 1.7) * 3, L = 14 + (i % 2) * 6;
      ctx.strokeStyle = C(OUT); ctx.lineWidth = 3.2 - i % 2; ctx.beginPath(); ctx.moveTo(x0, cy + 8); ctx.quadraticCurveTo(x0 - 3 + sw, cy + 8 + L * .55, x0 - 6 + sw * 1.6, cy + 8 + L); ctx.stroke();
      ctx.strokeStyle = C(i % 2 ? '#5A1E36' : '#7A2A44'); ctx.lineWidth = 1.6 - (i % 2) * .5; ctx.stroke();
      if (DET()) { ctx.fillStyle = '#FFB060'; circle(x0 - 6 + sw * 1.6, cy + 8 + L, .9); ctx.fill(); }
    }
    // the husk: a cup of flesh with ridges of bone raying out of it
    for (let i = 0; i < 7; i++) { const an = Math.PI * (.95 + i / 6 * 1.1) - Math.PI * .02, x0 = Math.cos(an) * R * .9, y0 = cy + Math.sin(an) * R * .9; horn(x0, y0, Math.cos(an) * R * 1.5, cy + Math.sin(an) * R * 1.5 - 2, Math.cos(an) * R * 2, cy + Math.sin(an) * R * 1.9 - 4, 3.6, .4, '#C8B898', 1); }
    cel(PB([-R - 3, cy - 2, -R + 1, cy + 9, 0, cy + 13, R - 1, cy + 9, R + 3, cy - 2, R, cy - R - 2, -R, cy - R - 2]), '#6A1E34', { d: 3, r: 1.2, w: 1.7, dark: '#3A0A1C', lite: '#B04A5E', tex: () => {
      ctx.strokeStyle = 'rgba(40,6,20,.6)'; ctx.lineWidth = .7; ctx.beginPath(); for (let i = 0; i < 4; i++) { ctx.moveTo(-R + i * 5, cy + 4); ctx.quadraticCurveTo(-R + i * 5 + 3, cy + 9, -R + i * 5 + 1, cy + 12); } ctx.stroke(); } });
    // the eye itself, looking toward its prey
    const lid = hurt ? .25 : 1, look = 2.4 + wind * 1.2;
    ctx.save(); ell(1, cy, R, R * .86 * lid); ctx.fillStyle = C('#F0E4D0'); ctx.fill(); ctx.clip();
    if (DET()) { ctx.fillStyle = 'rgba(160,60,70,.4)'; ell(-3, cy + 4, R, R * .6); ctx.fill(); ctx.strokeStyle = 'rgba(170,40,50,.55)'; ctx.lineWidth = .5; ctx.beginPath(); for (let i = 0; i < 5; i++) { const an = i * 1.3; ctx.moveTo(1 + Math.cos(an) * R, cy + Math.sin(an) * R); ctx.lineTo(1 + Math.cos(an) * R * .55, cy + Math.sin(an) * R * .55); } ctx.stroke(); } // veins
    const ix = 1 + look, ir = 6.2 + wind * .8, ig = ctx.createRadialGradient(ix, cy, 1, ix, cy, ir); ig.addColorStop(0, C('#FFF0A0')); ig.addColorStop(.55, C(wind ? '#FFC040' : '#E0A030')); ig.addColorStop(1, C('#8A4A10'));
    ctx.fillStyle = ig; circle(ix, cy, ir); ctx.fill();
    ctx.fillStyle = C('#140808'); ell(ix + .6, cy, 1.3 - wind * .5, 4.6); ctx.fill(); // the slit
    if (DET()) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ell(ix + 2.4, cy - 2.6, 1.4, .9, -.4); ctx.fill(); ctx.fillStyle = 'rgba(40,10,20,.35)'; ell(1, cy - R * .7, R, R * .4); ctx.fill(); } // the lid's shadow
    ctx.restore();
    ell(1, cy, R, R * .86 * lid); outline(1.6);
    // heavy lids of flesh above and below
    cel(PB([-R - 1, cy - 3, -4, cy - R * .95 * lid - 3, 6, cy - R * .95 * lid - 2.5, R + 2, cy - 4, 6, cy - R * .7 * lid, -4, cy - R * .75 * lid]), '#7A2A44', { d: 1.6, r: .8, w: 1.3, lite: '#C0607A' });
    glowAt(ix, cy, 12 + wind * 8, SULF, .2 + wind * .5);
    ctx.restore();
  };

  // ---------------- ECLIPSE MOTH: a great moth whose wings each carry a black sun ----------------
  CREATURES.w4moth = function (e, a) {
    a = a || {}; const t = a.t || 0, wind = a.wind || 0, dash = e.state === 'dash';
    const flap = dash ? -.7 : Math.sin(t * 7 + (e.walk || 0)) * .85, bob = Math.sin(t * 7) * 1.2, cy = -16 + bob;
    ctx.save(); ctx.lineJoin = 'round';
    if (dash) ctx.rotate(.18);
    const wing = (far, hind) => {
      const k = Math.cos(flap * (far ? 1 : 1.05)), sy = (hind ? .72 : 1) * Math.max(.12, Math.abs(k)) * (k < 0 ? -1 : 1);
      ctx.save(); ctx.translate(-2, cy - 2); if (dash) ctx.rotate(-.5); ctx.scale(far ? .82 : 1, sy);
      const L = hind ? 20 : 28, path = hind ? PB([0, 0, -8, -6, -18, -14, -21, -20, -12, -20, -2, -8]) : PB([2, 0, 0, -10, -6, -22, -16, -30, -28, -28, -26, -18, -12, -6]);
      cel(path, far ? '#3A2440' : '#55304E', { d: 2.4, r: 1.2, w: 1.4, dark: '#22142A', lite: '#9A6A80', tex: () => {
        ctx.fillStyle = 'rgba(230,190,120,.5)'; if (!hind) { ell(-17, -25, 9, 4, -.5); ctx.fill(); }
        ctx.strokeStyle = 'rgba(20,10,20,.5)'; ctx.lineWidth = .6; ctx.beginPath(); for (let i = 0; i < 4; i++) { ctx.moveTo(0, -2); ctx.lineTo(-L * (.4 + i * .2), -L * (.9 - i * .2)); } ctx.stroke(); // veins
      } });
      if (!hind) { // the eye-spot: a black sun with its gold ring of corona
        const ex = -15, ey = -18; ctx.fillStyle = C('#E8B848'); circle(ex, ey, 5.2); ctx.fill(); ctx.fillStyle = C('#FFE6A0'); circle(ex, ey, 4.4); ctx.fill(); ctx.fillStyle = C('#0A060C'); circle(ex, ey, 3.6); ctx.fill();
        if (DET()) { ctx.strokeStyle = 'rgba(255,240,200,.9)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.arc(ex, ey, 3.7, -1.6, .2); ctx.stroke(); }
      } else if (DET()) { ctx.fillStyle = '#8A3A48'; circle(-12, -13, 2.6); ctx.fill(); }
      ctx.restore();
    };
    wing(true, true); wing(true, false);
    // the body: a furred thorax, a banded abdomen hanging behind, feathered antennae
    cel(PB([-4, cy - 1, -14, cy + 2, -22, cy + 6, -24, cy + 3, -14, cy - 3, -4, cy - 5]), '#5A1E2E', { d: 1.6, r: .7, w: 1.3, tex: () => { ctx.strokeStyle = '#2A0A14'; ctx.lineWidth = .8; ctx.beginPath(); for (let x = -8; x > -22; x -= 3.4) { ctx.moveTo(x, cy - 4); ctx.lineTo(x - 1, cy + 4); } ctx.stroke(); } });
    cel(PE(1, cy - 2, 7, 5.6), '#C8B8A4', { d: 1.8, r: .8, w: 1.4, dark: '#7A6A5E', tex: () => { for (let i = 0; i < 7; i++) dab(-3 + i * 1.5, cy - 4 + (i % 3) * 2, 1.6, i % 2 ? '#E8DCC8' : '#9A8A7A', .7); } });
    cel(PE(8, cy - 3, 3.6, 3.2), '#B8A894', { d: 1, r: .6, w: 1.2 });
    emberEye(9.6, cy - 3.6, .8, wind ? '#FFE070' : '#F0B040', SULF, wind > .3);
    for (const s of [0, 1]) { ctx.strokeStyle = C(OUT); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(9, cy - 6); ctx.quadraticCurveTo(13 + s * 2, cy - 14, 9 + s * 6, cy - 18 + s); ctx.stroke();
      if (DET()) { ctx.strokeStyle = '#8A7A6A'; ctx.lineWidth = .5; ctx.beginPath(); for (let k = 0; k < 6; k++) { const q = k / 6, px = lerp(9, 9 + s * 6, q) + 2 * q, py = lerp(cy - 6, cy - 18 + s, q); ctx.moveTo(px, py); ctx.lineTo(px + 2, py - 1); } ctx.stroke(); } }
    wing(false, true); wing(false, false);
    ctx.restore();
  };

  // ---------------- ABYSS BRUTE: a hunched demon plated in obsidian, magma in its cracks, horns of bone ----------------
  CREATURES.w4brute = function (e, a) {
    a = a || {}; const t = a.t || 0, ph = a.walk || 0, wind = a.wind || 0, st = e.state, moving = ph ? 1 : 0;
    const swing = st === 'strike', leap = st === 'leap', windSwing = st === 'wind' && e.plan === 'swing', windSlam = st === 'wind' && e.plan === 'slam';
    const breath = Math.sin(t * 2) * .8, sink = (windSlam ? wind * 6 : 0) + (swing ? 3 : 0);
    const hide = '#2A1E2C', plate = '#3A2C3E', lit = '#8A6A90', dk = '#100A12';
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const HIP = -30 + sink, SH = -54 + sink + breath;
    // goat legs: thigh forward, shin back, hoof
    const legP = (hx, off, far) => {
      const s = Math.sin(ph + off) * moving, lift = Math.max(0, Math.cos(ph + off)) * 4 * moving, col = far ? '#160E18' : hide;
      const kx = hx + 7 + s * 5, ky = HIP + 13, hk = hx - 1 + s * 7, hky = -9 - lift, fx = hx + 3 + s * 8, fy = -1 - lift;
      seg(hx, HIP, kx, ky, 14, 9, col, 2); seg(kx, ky, hk, hky, 8.5, 6, col, .6); seg(hk, hky, fx, fy, 5.6, 5, col, 0);
      fillPoly([fx - 4, fy - 2, fx + 3, fy - 2.4, fx + 5.4, fy + 1, fx - 4.4, fy + 1], far ? '#0A060A' : '#1A1214', 1.1);
    };
    legP(-6, Math.PI, true);
    // the far arm, behind the body
    const armFar = windSwing ? -2.4 * wind : swing ? .6 : leap ? -2.9 : 1.35 + Math.sin(ph) * .2 * moving;
    { const sx = -8, sy = SH + 4, ex = sx + Math.cos(armFar) * 16, ey = sy + Math.sin(armFar) * 16, wx = ex + Math.cos(armFar + .25) * 16, wy = ey + Math.sin(armFar + .25) * 16;
      seg(sx, sy, ex, ey, 13, 10, '#1A121C', 2); seg(ex, ey, wx, wy, 10, 9, '#1A121C', 1); cel(PE(wx, wy, 7.5, 7), '#1A121C', { d: 2, r: .8, w: 1.5 }); }
    // the tail
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-14, HIP + 2); ctx.quadraticCurveTo(-30, HIP + 8 + Math.sin(t * 1.5) * 2, -36, -6); ctx.stroke(); ctx.strokeStyle = C(hide); ctx.lineWidth = 3.6; ctx.stroke();
    horn(-36, -6, -40, -4, -44, -8, 5, .4, '#C8B898', 1);
    // the torso: a great hunched wedge, shoulders like a yoke of rock
    const torso = PB([-14, HIP + 4, -20, HIP - 10, -22, SH + 2, -12, SH - 8, 6, SH - 9, 20, SH - 1, 18, SH + 12, 10, HIP - 2, 4, HIP + 5]);
    cel(torso, hide, { d: 4.5, r: 1.6, w: 2.2, dark: dk, lite: '#5E4864', tex: () => {
      // obsidian plates over shoulders and back, each with a lit facet
      for (const [px, py, w, h, r] of [[-8, SH - 2, 12, 8, -.2], [6, SH - 3, 11, 7, .15], [-15, SH + 10, 8, 10, -.4], [12, SH + 9, 7, 8, .3]]) {
        ctx.save(); ctx.translate(px, py); ctx.rotate(r); ctx.fillStyle = plate; poly([-w, h * .2, -w * .6, -h, w * .7, -h * .8, w, h * .3, 0, h]); ctx.fill();
        ctx.fillStyle = lit; ctx.globalAlpha = .55; poly([-w * .6, -h, w * .7, -h * .8, w * .2, -h * .2]); ctx.fill(); ctx.globalAlpha = 1;
        ctx.strokeStyle = dk; ctx.lineWidth = .8; poly([-w, h * .2, -w * .6, -h, w * .7, -h * .8, w, h * .3, 0, h]); ctx.stroke(); ctx.restore();
      }
      ctx.fillStyle = 'rgba(90,60,90,.35)'; ell(4, HIP - 10, 9, 6); ctx.fill(); // the gut, a lighter hide
    } });
    cracks([[-16, HIP - 4, -12, HIP - 12, -14, HIP - 18], [2, HIP - 6, 6, HIP - 12, 4, HIP - 18, 8, SH + 6], [-4, SH + 4, -2, SH + 10]], windSlam || leap ? 1 : .8);
    legP(4, 0, false);
    // the head, low and thrust forward between the shoulders: ram horns of bone, a jaw of tusks, burning eyes
    const hx = 15 + (swing ? 3 : 0), hy = SH + 2 + (windSlam ? wind * 3 : 0);
    ctx.save(); ctx.translate(hx, hy);
    horn(-3, -5, -12, -16, -4, -24, 6, .6, '#A89878', 1.2); // the far horn
    cel(PB([-6, -6, 2, -9, 9, -6, 11, 0, 8, 5, 0, 6, -5, 3]), '#3A2A3A', { d: 2.4, r: 1, w: 1.6, lite: '#7A5A7A' });
    ctx.fillStyle = C('#E8DCC0'); poly([4, 4, 6, -1.5, 7.4, 4]); ctx.fill(); outline(.8); poly([7.6, 4.2, 9.6, .2, 10, 4]); ctx.fill(); outline(.8); // tusks
    emberEye(5.6, -3.2, .9, a.hurt ? '#FFFFFF' : wind ? '#FFF0A0' : '#FFC040', SULF, wind > .3);
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(2, -6.2); ctx.lineTo(9, -4.4); ctx.stroke(); // the brow
    horn(-1, -6, -6, -20, 6, -24, 6.6, .6, '#D8CCB0', 1.3); // the near horn, curling forward
    ctx.restore();
    // the near arm: shoulder, a forearm like a club of rock, a fist that drags on the ground
    const arm = windSwing ? -2.5 * wind - .2 : swing ? .25 : leap ? -2.7 : windSlam ? -1.6 * wind + 1.2 : 1.4 + Math.sin(ph + Math.PI) * .2 * moving;
    { const sx = 12, sy = SH + 3, ex = sx + Math.cos(arm) * 17, ey = sy + Math.sin(arm) * 17, fa = arm + (swing ? -.1 : .3), wx = ex + Math.cos(fa) * 17, wy = ey + Math.sin(fa) * 17;
      seg(sx, sy, ex, ey, 15, 11, hide, 3); seg(ex, ey, wx, wy, 12, 11, plate, 2);
      cracks([[ex + (wx - ex) * .3, ey + (wy - ey) * .3 - 2, ex + (wx - ex) * .6, ey + (wy - ey) * .6 + 1]], swing ? 1 : .7);
      cel(PE(wx + Math.cos(fa) * 3, wy + Math.sin(fa) * 3, 9, 8.4), plate, { d: 2.4, r: 1, w: 1.8, lite: lit, tex: () => { ctx.strokeStyle = dk; ctx.lineWidth = .8; ctx.beginPath(); for (let k = -1; k <= 1; k++) { ctx.moveTo(wx + Math.cos(fa) * 9 + Math.cos(fa + 1.6) * k * 3.4, wy + Math.sin(fa) * 9 + Math.sin(fa + 1.6) * k * 3.4); ctx.lineTo(wx + Math.cos(fa) * 5 + Math.cos(fa + 1.6) * k * 3.4, wy + Math.sin(fa) * 5 + Math.sin(fa + 1.6) * k * 3.4); } ctx.stroke(); } });
      if (swing || leap) glowAt(wx, wy, 16, EMBER, .3);
    }
    ctx.restore();
  };

  // ======================================================================================================
  // THE TY'IGA, SHIFTER OF SHAPES: a demon of the Abyss with no shape of its own. It wears three:
  //   phase 1  a great shadow-wolf, its edges always coming apart into smoke, six burning eyes
  //   phase 2  a serpent of smoke coiling low over the floor, a skull of bone for a head
  //   phase 3  a winged horror, gaunt, its wings full of eyes, its head a crown of horns round a burning mouth
  // Between them it pours itself into a churning ball of smoke and comes out as the next.
  // ======================================================================================================
  const TY = { fur: '#1C1424', furDk: '#08050C', furLit: '#5A4476', smoke: '#1E1428', bone: '#DCD0B4', boneDk: '#8E806A', boneLit: '#FFF6E2', eye: '#FFD860', maw: '#2A060E' };
  // a spiky silhouette of fur through points: every edge gets a pointed tuft swept back along it
  function furPath(pts, amp, seed = 0, every = 1) {
    return (ox, oy, cont) => {
      if (!cont) ctx.beginPath(); const n = pts.length / 2;
      ctx.moveTo(pts[0] + ox, pts[1] + oy);
      for (let i = 1; i <= n; i++) {
        const a = (i - 1) % n, b = i % n, x0 = pts[a * 2] + ox, y0 = pts[a * 2 + 1] + oy, x1 = pts[b * 2] + ox, y1 = pts[b * 2 + 1] + oy, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
        const s = amp * (.55 + hsh(i * 3.1 + seed) * .9) * (i % every === 0 ? 1 : 0);
        if (s < .3) { ctx.lineTo(x1, y1); continue; }
        const nx = dy / L, ny = -dx / L, k = .45 + hsh(i + seed) * .2, bx = x0 + dx * k, by = y0 + dy * k;
        ctx.quadraticCurveTo(x0 + dx * .3 + nx * s * .25, y0 + dy * .3 + ny * s * .25, bx + nx * s - dx / L * s * .5, by + ny * s - dy / L * s * .5); // out to the tuft's point, swept back
        ctx.quadraticCurveTo(bx + dx * .1, by + dy * .1, x1, y1);
      }
      ctx.closePath();
    };
  }
  function eyeRow(list, wind, hurt) { // a row of burning eyes
    for (const [x, y, s] of list) {
      ctx.fillStyle = C('#0A0408'); ell(x, y, 2.6 * s, 1.5 * s, -.25); ctx.fill();
      if (hurt) { ctx.strokeStyle = C('#FFE8A0'); ctx.lineWidth = .8 * s; ctx.beginPath(); ctx.moveTo(x - 2 * s, y); ctx.lineTo(x + 2 * s, y - .4 * s); ctx.stroke(); continue; }
      ctx.fillStyle = C(wind ? '#FFF2B0' : TY.eye); ctx.beginPath(); ctx.moveTo(x - 2.2 * s, y + .5 * s); ctx.quadraticCurveTo(x, y - 1.6 * s, x + 2.3 * s, y - .6 * s); ctx.quadraticCurveTo(x, y + .9 * s, x - 2.2 * s, y + .5 * s); ctx.fill();
      if (DET()) { ctx.fillStyle = '#1A0606'; ell(x + .3 * s, y - .2 * s, .3 * s, .8 * s); ctx.fill(); glowAt(x, y, 6 * s, SULF, wind ? .75 : .4); }
    }
  }
  // a tongue of smoke licking up off its body: a tapering, curling stroke that thins as it rises
  function smokeTongue(x, y, len, w, lean, t, i, col = '#1E1428') {
    const sw = Math.sin(t * 1.3 + i * 2.1) * len * .18, s = taper(x, y, x + lean * .5 + sw, y - len * .55, x + lean + sw * 1.6, y - len, w, .5, 6);
    trace(s.L, s.R); ctx.fillStyle = C(col); ctx.globalAlpha = .9; ctx.fill(); ctx.globalAlpha = 1;
    if (DET()) { ctx.strokeStyle = 'rgba(140,110,180,.45)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(s.R[2], s.R[3]); for (let k = 4; k < s.R.length - 2; k += 2) ctx.lineTo(s.R[k], s.R[k + 1]); ctx.stroke(); }
  }
  function wisps(list, t) { for (let i = 0; i < list.length; i += 4) smokeTongue(list[i], list[i + 1], list[i + 2], list[i + 3], -list[i + 2] * .6, t, i); }
  // ---------------------------------------------------------------- the shadow-wolf
  function tyWolf(e, a, t) {
    const st = e.state, plan = e.plan, wind = a.wind || 0, ph = a.walk || 0, moving = ph ? 1 : 0;
    const act = st === 'w4act' ? e.w4a : null, crouch = (st === 'wind' && plan === 'w4rake') ? wind : act === 'rake' && !e.w4dash ? .7 : 0;
    const howl = (st === 'wind' && plan === 'w4howl') ? wind : act === 'howl' ? 1 : 0, maw = (st === 'wind' && plan === 'w4maw') ? wind : act === 'maw' ? 1 : 0;
    const dash = act === 'rake' && e.w4dash, down = st === 'down';
    const B = -46 + crouch * 10 + (down ? 12 : 0) + Math.sin(t * 1.8) * .8 + Math.abs(Math.sin(ph)) * 2 * moving;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (dash) ctx.scale(1.12, .92);
    // the haunches and back come apart into tongues of smoke
    wisps([-46, B - 2, 22, 6, -36, B - 12, 26, 7, -22, B - 16, 20, 6, -8, B - 20, 16, 5, -54, B + 8, 18, 6], t);
    // the tail: a long plume of fur that frays into smoke
    const tw = Math.sin(t * 1.6) * 4;
    wisps([-74, B - 4 + tw * 1.3, 14, 5, -66, B - 8 + tw, 12, 4], t);
    cel(furPath([-44, B - 6, -58, B - 12 + tw * .6, -72, B - 8 + tw * 1.2, -80, B + 2 + tw * 1.4, -70, B + 4 + tw, -56, B + 4 + tw * .4, -46, B + 6], 5, 3), TY.fur, { d: 3, r: 1.4, w: 1.6, dark: TY.furDk, lite: TY.furLit });
    const leg = (front, off, far) => { // long sinewy legs: the fore straight as columns, the hind bent at the hock; bone claws
      const s = Math.sin(ph + off) * moving, lift = Math.max(0, Math.cos(ph + off)) * 6 * moving, col = far ? '#0E0914' : TY.fur;
      const hx = front ? 18 : -34, hy = B + (front ? 6 : 2);
      let k, w, p;
      if (dash) { k = front ? [hx + 14, hy + 16] : [hx - 12, hy + 18]; w = front ? [hx + 30, hy + 26] : [hx - 28, hy + 30]; p = front ? [hx + 40, hy + 30] : [hx - 40, hy + 34]; }
      else if (front) { k = [hx - 2 + s * 5 + crouch * 4, hy + 20 - crouch * 4]; w = [hx + s * 10 + crouch * 10, -10 - lift]; p = [hx + 5 + s * 11 + crouch * 12, -1.5 - lift]; }
      else { k = [hx + 10 + s * 5, hy + 20 - crouch * 3]; w = [hx - 6 + s * 9, -14 - lift + crouch * 5]; p = [hx - 1 + s * 11, -1.5 - lift]; }
      if (down) { k = [hx + (front ? 10 : -10), hy + 14]; w = [hx + (front ? 24 : -24), -4]; p = [hx + (front ? 32 : -30), -1]; }
      seg(hx, hy, k[0], k[1], front ? 20 : 26, 11, col, 4); seg(k[0], k[1], w[0], w[1], 10, 7, col, 1); seg(w[0], w[1], p[0], p[1], 7.4, 7, col, 0);
      cel(PB([p[0] - 6, p[1] - 2, p[0], p[1] - 5, p[0] + 7, p[1] - 3, p[0] + 9, p[1] + 1.4, p[0] - 6, p[1] + 1.4]), far ? '#08060C' : '#160E1C', { d: 1.4, r: .7, w: 1.2, lite: TY.furLit });
      for (let c = 0; c < 3; c++) horn(p[0] + 6 + c * .4, p[1] - 3 + c * 1.6, p[0] + 10, p[1] - 2 + c * 1.5, p[0] + 12.5 + c * .3, p[1] + 1.3 + c * .2, 2.4, .3, far ? '#9A8C72' : TY.bone, .8);
    };
    leg(false, Math.PI, true); leg(true, 0, true);
    // the body: massive forequarters, a back sloping down to lean haunches; a mass of dark fur, the shape inside glowing through
    const body = furPath([28, B - 26, 40, B - 8, 36, B + 6, 24, B + 16, 10, B + 14, -6, B + 8, -20, B + 10, -36, B + 14, -48, B + 8, -52, B - 4, -44, B - 12, -28, B - 16, -10, B - 22, 6, B - 30, 18, B - 34], 6, 7);
    cel(body, TY.fur, { d: 6, r: 2.2, w: 2.2, dark: TY.furDk, lite: TY.furLit, under: () => {
      const g = ctx.createRadialGradient(10, B - 4, 2, 10, B - 4, 44); g.addColorStop(0, `rgba(${BRUISE},.5)`); g.addColorStop(1, `rgba(${BRUISE},0)`); ctx.fillStyle = g; ctx.fillRect(-50, B - 50, 100, 80);
    }, tex: () => { // fur brushed in long strokes, swept back from the head
      ctx.lineWidth = .9; ctx.strokeStyle = 'rgba(130,104,170,.5)'; ctx.beginPath();
      for (let i = 0; i < 30; i++) { const x = -46 + (i * 37) % 86, y = B - 26 + (i * 13) % 36; ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 4, y + 1, x - 9, y + 4); } ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); for (let i = 0; i < 16; i++) { const x = -44 + (i * 53) % 80, y = B + (i * 7) % 14; ctx.moveTo(x, y); ctx.lineTo(x - 7, y + 5); } ctx.stroke();
    } });
    leg(false, 0, false); leg(true, Math.PI, false);
    // the ruff: a great collar of fur and smoke standing up behind the head
    cel(furPath([16, B - 30, 14, B - 46, 24, B - 54, 36, B - 50, 44, B - 38, 42, B - 22, 30, B - 14, 20, B - 18], 6, 11), '#261C34', { d: 3.4, r: 1.6, w: 1.8, dark: TY.furDk, lite: '#8A6CB4' });
    // the head: a long skull and muzzle held low; it lifts to howl and gapes to devour
    const hr = -howl * .8 + crouch * .3 + maw * .25 + (dash ? .15 : 0) + (down ? .4 : 0), open = Math.max(howl * .7, maw * .95, a.atk ? .5 : 0, dash ? .4 : 0, .06 + Math.sin(t * 1.4) * .03);
    ctx.save(); ctx.translate(40, B - 30); ctx.rotate(hr); ctx.scale(1.15, 1.15);
    // the ears, laid back and ragged
    horn(-2, -12, -6, -24, -14, -32, 9, .6, '#140E1C', 1.3, '#08050C');
    // the lower jaw
    ctx.save(); ctx.translate(0, 5); ctx.rotate(open * .75);
    cel(furPath([-6, -2, 30, 0, 36, 3, 22, 9, -4, 8], 2.4, 5), '#1A1220', { d: 2, r: .8, w: 1.5, lite: TY.furLit });
    ctx.fillStyle = C(TY.bone); for (let x = 8; x <= 32; x += 5) { poly([x, 0, x + 1.4, -5.4 - (x >= 28 ? 2.4 : 0), x + 2.8, 0]); ctx.fill(); outline(.6); }
    ctx.restore();
    if (open > .2) { ctx.fillStyle = C(TY.maw); poly([-2, 4, 34, 2, 30, 6 + open * 26, 0, 12]); ctx.fill(); glowAt(14, 8 + open * 7, 20, EMBER, .3 + open * .45); }
    const skull = furPath([-12, -12, 2, -16, 16, -13, 30, -7, 38, -3, 38, 3, 20, 5, 2, 8, -14, 5], 2.4, 9, 2);
    cel(skull, '#241A32', { d: 3.2, r: 1.4, w: 1.8, dark: TY.furDk, lite: '#8C70B8', tex: () => {
      ctx.strokeStyle = 'rgba(140,120,180,.55)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(8, -13); ctx.quadraticCurveTo(22, -9, 36, -3); ctx.stroke(); // the line of the muzzle
      ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.moveTo(24, 2); ctx.quadraticCurveTo(16, -1, 6, 2); ctx.stroke(); // the lip
    } });
    ctx.fillStyle = C(TY.bone); for (let x = 10; x <= 34; x += 4.6) { poly([x, 3, x + 1.2, 9.4 + (x > 30 ? 3.4 : 0), x + 2.4, 3]); ctx.fill(); outline(.6); } // the upper fangs
    ctx.fillStyle = C('#0A0408'); ell(37.6, -2.6, 1.6, 1.1); ctx.fill(); // the nose
    eyeRow([[17, -8.6, 1.2], [10, -10.6, 1], [3.6, -12, .82]], wind > .4 || howl > .3 || maw > .3, a.hurt);
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(1, -15); ctx.lineTo(21, -11); ctx.stroke(); // the brow, drawn down over the eyes
    horn(4, -14, 2, -26, -6, -34, 9, .6, '#261C34', 1.3, '#0A060E'); // the near ear
    ctx.restore();
    if (dash && DET()) add(() => { ctx.strokeStyle = 'rgba(170,130,220,.4)'; ctx.lineWidth = 2.2; ctx.beginPath(); for (let i = 0; i < 6; i++) { const y = B - 24 + i * 9; ctx.moveTo(-62 - i * 5, y); ctx.lineTo(-108 - i * 9, y + 2); } ctx.stroke(); }); // speed, smeared into shadow
    ctx.restore();
  }
  // ---------------------------------------------------------------- the serpent of smoke
  function tySerpent(e, a, t) {
    const st = e.state, plan = e.plan, wind = a.wind || 0, act = st === 'w4act' ? e.w4a : null;
    const coil = (st === 'wind' && plan === 'w4coil') ? wind : act === 'coil' ? 1 : 0, spit = (st === 'wind' && plan === 'w4venom') ? wind : act === 'venom' ? 1 : 0;
    const howl = (st === 'wind' && plan === 'w4howl') ? wind : act === 'howl' ? 1 : 0, maw = (st === 'wind' && plan === 'w4maw') ? wind : act === 'maw' ? 1 : 0;
    const rear = Math.max(coil * .8, howl, spit * .5, maw * .3), N = 16, X = [], Y = [], R = [];
    for (let i = 0; i <= N; i++) { // the spine: 0 is the neck, the rest trails behind, waving
      const k = i / N, amp = (10 + k * 8) * (1 - coil * .5), r = 15 - k * 10 + Math.sin(i * 1.7) * .6;
      let y = -26 + Math.sin(t * 1.8 - i * .62) * amp * Math.min(1, i / 3) + k * 10;
      y -= rear * 26 * Math.max(0, 1 - i / 5);
      X.push(-4 - i * 8.6 * (1 - coil * .25)); Y.push(y); R.push(r);
    }
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // the tail ends in a long fraying plume of smoke
    wisps([X[N] - 4, Y[N], 16, 5, X[N - 3], Y[N - 3] - 4, 14, 4, X[10], Y[10] - 6, 12, 4, X[6], Y[6] - 8, 12, 4], t);
    for (let i = N; i >= 0; i--) { // the body, tail first: rings of smoke with a bone vertebra along the top, fire between them
      const ia = Math.max(0, i - 1), ib = Math.min(N, i + 1), th = Math.atan2(Y[ia] - Y[ib], X[ia] - X[ib]), r = R[i];
      ctx.save(); ctx.translate(X[i], Y[i]); ctx.rotate(th);
      cel(PB([-r * .9, -r * .2, -r * .5, -r, r * .6, -r * .95, r * 1.05, -r * .1, r * .6, r * .9, -r * .5, r * .85]), i % 2 ? '#22182C' : '#1A1224', { d: r * .22, r: r * .08, w: 1.5, dark: TY.furDk, lite: '#6A5490', tex: () => {
        ctx.fillStyle = `rgba(${BRUISE},.25)`; ell(0, r * .1, r * .55, r * .4); ctx.fill();
        ctx.strokeStyle = 'rgba(150,120,190,.4)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.arc(-r * .2, 0, r * .7, -1.2, .6); ctx.stroke();
      } });
      if (i % 2 === 0 && i < N - 1) horn(-r * .2, -r * .85, -r * .5, -r * 1.3, -r * 1.1, -r * 1.55 - 2, r * .5, .4, TY.bone, 1); // spines of bone
      if (i > 0 && i % 3 === 1) add(() => { ctx.fillStyle = 'rgba(255,140,60,.5)'; ell(r * .9, 0, r * .18, r * .55); ctx.fill(); }); // ember light between rings
      ctx.restore();
    }
    // the head: a serpent's skull of bone, a frill of horns, four eyes, a mouth full of needles
    const open = Math.max(spit * .8, howl * .7, maw * .95, a.atk ? .5 : 0, .08), hy = Y[0] - 4, hr = -rear * .35 + spit * .15;
    ctx.save(); ctx.translate(6, hy); ctx.rotate(hr);
    for (let i = 0; i < 5; i++) horn(-6, -2 + i * 2.2, -14 - i, -10 + i * 4, -24 - i * 2, -16 + i * 7, 4.6, .4, i % 2 ? '#B8A88A' : TY.bone, 1); // the frill
    ctx.save(); ctx.translate(-2, 4); ctx.rotate(open * .7);
    fillPoly([-4, -1, 30, 1, 32, 4, 12, 8, -4, 6], '#A49478', 1.2); ctx.fillStyle = C('#F6EEDA'); for (let x = 4; x <= 28; x += 3.4) { poly([x, 1, x + .9, -3.6, x + 1.8, 1]); ctx.fill(); }
    ctx.restore();
    if (open > .15) { ctx.fillStyle = C(TY.maw); poly([-2, 3, 30, 2, 26, 4 + open * 22, 0, 10]); ctx.fill(); glowAt(12, 6 + open * 6, 16, spit > .2 ? '255,170,70' : EMBER, .35 + open * .45); }
    const skull = PB([-8, -8, 4, -11, 20, -8, 34, -2, 34, 3, 14, 4, -6, 6]);
    cel(skull, TY.bone, { d: 2.6, r: 1, w: 1.7, dark: TY.boneDk, lite: TY.boneLit, tex: () => {
      ctx.strokeStyle = '#7A6C56'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(2, -10); ctx.lineTo(6, -4); ctx.lineTo(4, 2); ctx.moveTo(18, -8); ctx.quadraticCurveTo(24, -4, 32, -1); ctx.stroke();
      ctx.fillStyle = 'rgba(60,40,30,.25)'; ell(16, 2, 14, 2.5); ctx.fill();
    } });
    ctx.fillStyle = C('#F6EEDA'); for (let x = 8; x <= 32; x += 3.6) { poly([x, 3, x + .9, 7.4, x + 1.8, 3]); ctx.fill(); }
    eyeRow([[16, -5, .95], [10, -6.5, .8], [22, -3.6, .7], [5, -7.6, .65]], wind > .4 || rear > .4, a.hurt);
    ctx.restore();
    ctx.restore();
  }
  // ---------------------------------------------------------------- the winged horror
  function tyHorror(e, a, t) {
    const st = e.state, plan = e.plan, wind = a.wind || 0, act = st === 'w4act' ? e.w4a : null;
    const swoop = act === 'swoop' && e.w4dash, swoopWind = (st === 'wind' && plan === 'w4swoop') ? wind : 0;
    const spread = Math.max((st === 'wind' && plan === 'w4shadows') ? wind : act === 'shadows' ? 1 : 0, (st === 'wind' && plan === 'w4howl') ? wind : act === 'howl' ? 1 : 0, swoopWind * .6);
    const maw = (st === 'wind' && plan === 'w4maw') ? wind : act === 'maw' ? 1 : 0, down = st === 'down';
    const flap = down ? .9 : swoop ? 1.25 : Math.sin(t * 2.3) * .45 * (1 - spread * .6) - spread * .5;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.scale(1.4, 1.4);
    if (swoop) { ctx.rotate(.35); }
    const wing = (far) => { // a ragged membrane on four finger-bones, eyes opening along it
      ctx.save(); ctx.translate(far ? -6 : -2, -54); ctx.rotate((far ? -.18 : 0) + flap * (far ? .85 : 1)); if (far) ctx.scale(.82, .86);
      const F = [[-22, -50], [-50, -46], [-66, -24], [-62, 2]], E = [[-8, -2]].concat(F, [[-30, 8]]);
      const mem = []; mem.push(0, 0); for (let i = 0; i < F.length; i++) { mem.push(F[i][0], F[i][1]); if (i < F.length - 1) { const nx = (F[i][0] + F[i + 1][0]) / 2, ny = (F[i][1] + F[i + 1][1]) / 2; mem.push(nx * .78, ny * .78); } } mem.push(-36, 6, -18, 6);
      cel(PP(mem), far ? '#2A1424' : '#3E1A30', { d: 3, r: 1.2, w: 1.5, dark: '#1A0A16', lite: '#8A4A62', tex: () => {
        ctx.strokeStyle = 'rgba(160,80,110,.4)'; ctx.lineWidth = .7; ctx.beginPath(); for (const f of F) { ctx.moveTo(-6, -2); ctx.quadraticCurveTo(f[0] * .5 + 4, f[1] * .5, f[0] * .8, f[1] * .8); } ctx.stroke(); // veins
        ctx.fillStyle = '#0A0408'; for (const [x, y, r] of [[-40, -20, 3], [-52, -6, 2.2], [-28, -36, 2.4]]) { ell(x, y, r * 1.6, r); ctx.fill(); } // tears in the membrane
      } });
      for (const f of F) horn(0, 0, f[0] * .45, f[1] * .5 - 3, f[0], f[1], 3.4, .6, far ? '#9A8A72' : TY.bone, 1); // the finger bones
      horn(0, 0, -4, -8, -2, -14, 3, .3, TY.bone, 1); // the thumb claw
      if (!far) eyeRow([[-30, -22, .9], [-46, -30, .8], [-44, -10, .75], [-22, -10, .7]], wind > .4 || spread > .3, a.hurt);
      ctx.restore();
    };
    wing(true);
    // the long barbed tail and the dangling legs with their hooked talons
    const tw = Math.sin(t * 1.4) * 4;
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-6, -22); ctx.bezierCurveTo(-16, -6, -34, -10 + tw, -48, 2 + tw); ctx.stroke(); ctx.strokeStyle = C('#2A1A2C'); ctx.lineWidth = 3; ctx.stroke();
    horn(-48, 2 + tw, -54, 2 + tw, -58, -4 + tw, 5, .4, TY.bone, 1);
    for (const [hx, off, far] of [[-2, 1, true], [4, 0, false]]) {
      const s = Math.sin(t * 1.8 + off) * 2, col = far ? '#180E1A' : '#2A1A2C', kx = hx + 6 + s, ky = -14, fx = hx + 2 + s * 1.5, fy = swoop ? -6 : 0;
      seg(hx, -24, kx, ky, 8, 5, col, 1); seg(kx, ky, fx, fy, 5, 3.4, col, 0);
      for (let c = 0; c < 3; c++) horn(fx, fy, fx + 3 + c, fy + 2, fx + 2 + c * 2.4, fy + 6 - c * .4, 2.4, .3, far ? '#9A8A72' : TY.bone, .8);
    }
    // the body: gaunt, hunched, its ribs showing through the skin
    const body = PB([-10, -22, -12, -40, -6, -56, 4, -62, 12, -54, 10, -38, 4, -24]);
    cel(body, '#2E1E30', { d: 3.4, r: 1.4, w: 2, dark: '#120A14', lite: '#7A5A80', tex: () => {
      ctx.strokeStyle = TY.boneDk; ctx.lineWidth = 1.1; ctx.beginPath(); for (let i = 0; i < 5; i++) { const y = -50 + i * 5.4; ctx.moveTo(-8, y + 2); ctx.quadraticCurveTo(0, y - 2, 9, y + 1); } ctx.stroke();
      ctx.fillStyle = `rgba(${BRUISE},.3)`; ell(0, -40, 7, 10); ctx.fill();
    } });
    cracks([[-4, -30, -2, -36, -5, -42], [4, -28, 6, -34]], .6);
    // the arms, thin and too long, hanging forward with hooked claws
    for (const [far, off] of [[true, 1.2], [false, 0]]) { const s = Math.sin(t * 1.5 + off) * .15, col = far ? '#180E1A' : '#2E1E30', sx = 8, sy = -52, ex = sx + 10, ey = sy + 14 + s * 10, wx = ex + 6 + spread * 6, wy = ey + 12 - spread * 10;
      seg(sx, sy, ex, ey, 6, 4.4, col, 1); seg(ex, ey, wx, wy, 4.2, 3, col, 0); for (let c = 0; c < 3; c++) horn(wx, wy, wx + 3, wy + 1 + c, wx + 5 + c, wy + 4 + c * 1.6, 2, .3, far ? '#9A8A72' : TY.bone, .8); }
    // the head: a crown of black horns round a mouth split down the middle that burns from inside
    ctx.save(); ctx.translate(8, -64); ctx.rotate(swoop ? .3 : -spread * .25 + maw * .25);
    const open = Math.max(maw, spread * .6, swoopWind * .4, a.atk ? .6 : 0, .12 + Math.sin(t * 1.1) * .05);
    for (let i = 0; i < 7; i++) { const an = -2.8 + i * .52, L = 12 + (i % 2) * 7; horn(Math.cos(an) * 4, Math.sin(an) * 4 - 2, Math.cos(an) * L * .6 - 2, Math.sin(an) * L * .6 - 4, Math.cos(an) * L - 4, Math.sin(an) * L - 6, 4.4, .4, i % 2 ? '#1A1018' : '#2A1E2A', 1.1, '#060306'); }
    cel(PB([-6, -6, 2, -9, 10, -4, 11, 4, 4, 9, -4, 6]), '#3A2838', { d: 2, r: 1, w: 1.6, lite: '#8A6A88' });
    ctx.fillStyle = C(TY.maw); ell(5, 0, 2 + open * 2.4, 6.5 * (.4 + open * .6)); ctx.fill(); outline(1); // the split mouth
    ctx.fillStyle = C(TY.bone); for (let k = -2; k <= 2; k++) { poly([5 - 2 - open * 2.2, k * 2.2, 5 - .5, k * 2.2 + .6, 5 - 2 - open * 2.2, k * 2.2 + 1.2]); ctx.fill(); poly([5 + 2 + open * 2.2, k * 2.2, 5 + .5, k * 2.2 + .6, 5 + 2 + open * 2.2, k * 2.2 + 1.2]); ctx.fill(); }
    glowAt(5, 0, 10 + open * 10, maw > .3 ? '255,120,60' : SULF, .3 + open * .5);
    ctx.restore();
    wing(false);
    ctx.restore();
  }
  // ---------------------------------------------------------------- the change between shapes
  function tyChurn(k, t) { // a ball of churning smoke, eyes opening and closing in it
    const R = 34 * (1 - Math.abs(k - .5) * 1.2);
    for (let i = 0; i < 10; i++) { const an = i / 10 * TAU + t * 1.2 * (i % 2 ? 1 : -1), d = R * .55; smokeLobe(Math.cos(an) * d, -40 + Math.sin(an) * d * .8, R * .55, i % 2 ? '#22182E' : '#160E1E', .9); }
    smokeLobe(0, -40, R * .7, '#1A1024', 1);
    add(() => { const g = ctx.createRadialGradient(0, -40, 2, 0, -40, R * 1.4); g.addColorStop(0, `rgba(${BRUISE},.6)`); g.addColorStop(1, `rgba(${BRUISE},0)`); ctx.fillStyle = g; ctx.fillRect(-R * 1.5, -40 - R * 1.5, R * 3, R * 3); });
    eyeRow([[-8, -46, .9], [10, -38, 1], [2, -52, .7], [-12, -32, .6]], true, false);
  }
  const FORMS = { 1: tyWolf, 2: tySerpent, 3: tyHorror };
  CREATURES.tyiga = function (e, a) {
    a = a || {}; const t = a.t || 0, ph = Math.min(3, Math.max(1, e.phase || 1));
    const sh = e.w4shift || 0; // 1 -> 0 while it changes
    if (sh > 0 && !e.dead) {
      const k = 1 - sh, from = e.w4from || Math.max(1, ph - 1);
      if (k < .5) { const s = 1 - k * 2; ctx.save(); ctx.translate(0, -40); ctx.scale(s, s); ctx.translate(0, 40); FORMS[from](e, a, t); ctx.restore(); }
      else { const s = (k - .5) * 2; ctx.save(); ctx.translate(0, -40); ctx.scale(s, s); ctx.translate(0, 40); FORMS[ph](e, a, t); ctx.restore(); }
      tyChurn(k, t);
      return;
    }
    FORMS[ph](e, a, t);
  };

  // the attacks, rules and passages plug into world.js and zones.js, which load after this file: data_w4.js calls this once they exist
  const late = () => {

  // ======================================================================================================
  // ATTACKS: plans for the Courts' fighters and the Ty'iga, their tells, and the hazards they leave
  // ======================================================================================================
  const HZ = {}; // this world's hazards: { update(h, dt), draw(h, t) on the floor, ups(h, list, t) upright, box(h, box) }
  const reg = (kind, o) => { HZ[kind] = o; HAZARD_FX[kind] = { update: o.update || (() => {}), draw: o.draw || (() => {}) }; };
  const inEll = (x, y, cx, cy, r) => Math.hypot(x - cx, (y - cy) * 2.2) < r;
  const yClamp = (y) => clamp(y, FLOOR_TOP + 10, FLOOR_BOT - 2);
  const xClamp = (x) => clamp(x, leftWall() + 24, rightWall() - 24);
  const hitP = (dmg, fromX, big) => { if (P.state !== 'dead') playerDamage(dmg, fromX, big); };
  // an attack that takes time: the enemy is held in the 'w4act' state while a controller hazard drives it each frame
  function act(e, name, step, o = {}) {
    e.state = 'w4act'; e.w4a = name; e.struck = false; e.walk = 0;
    const h = Object.assign({ kind: 'w4ctl', e, name, el: 0, step, t: 99, max: 99, y: e.y }, o); hazards.push(h); return h;
  }
  function endAct(h) { const e = h.e; h.t = -1; e.w4dash = 0; e.w4pose = null; if (e.w4vis !== undefined && e.w4vis < 1) e.w4vis = 1; }
  reg('w4ctl', {
    update(h, dt) { const e = h.e; if (h.done) { h.t = -1; return; } if (e.dead || e.state !== 'w4act' || e.w4a !== h.name) { endAct(h); h.done = 1; return; } h.el += dt; if (h.step(h, dt, e)) { endAct(h); h.done = 1; } },
    draw(h, t) { if (h.draw) h.draw(h, t); },
    ups(h, list, t) { if (h.up) list.push([h.uy ?? h.e.y, () => h.up(h, t)]); },
  });
  const smokePuff = (x, y, z, n = 14) => { for (let i = 0; i < n; i++) parts.push({ x: x + rand(-10, 10), y: y + rand(-4, 4), z: z + rand(0, 50), vx: rand(-50, 50), vy: rand(-6, 6), vz: rand(10, 70), life: .6, max: .6, col: pick(['rgba(30,18,40,.85)', 'rgba(70,40,90,.7)', 'rgba(20,10,26,.8)']), size: rand(5, 9), shape: 'puff', rot: 0, vr: 0 }); };
  // a lasting tell for the player when a target is fixed
  function targets(e, make) { // targets fixed when the wind-up starts, kept until the attack is done
    const T0 = e.w4T;
    if (!T0 || T0.plan !== e.plan || (e.state === 'wind' && e.t > T0.lastT + 1e-6)) { e.w4T = Object.assign({ plan: e.plan, lastT: e.t }, make(e)); }
    if (e.state === 'wind') e.w4T.lastT = e.t;
    return e.w4T;
  }

  // ---------------- the Knight's step through Shadow: gone in a puff of dark, and at your back an instant later ----------------
  PLAN_FX.w4blink = (e) => {
    sfx('whoosh'); smokePuff(e.x, e.y, 10);
    let tx = P.x - P.facing * 48; if (tx < leftWall() + 20 || tx > rightWall() - 20) tx = P.x + P.facing * 48;
    const h = act(e, 'blink', (h, dt, e) => {
      if (h.el < .24) { e.w4vis = 1 - h.el / .24; return false; }
      if (!h.moved) { h.moved = true; e.x = xClamp(h.tx); e.y = h.ty; e.facing = Math.sign(P.x - e.x) || 1; smokePuff(e.x, e.y, 10); sfx('swing'); }
      e.w4vis = Math.min(1, (h.el - .24) / .2); e.facing = Math.sign(P.x - e.x) || e.facing;
      if (h.el > .5) { e.w4vis = 1; e.state = 'strike'; e.t = .2; e.struck = false; sfx('swing'); return true; }
      return false;
    }, { tx, ty: yClamp(P.y) });
    h.draw = (h, t) => { if (h.moved) return; const k = h.el / .24; ctx.save(); ctx.strokeStyle = `rgba(190,140,255,${.4 + .4 * k})`; ctx.lineWidth = 2; ell(h.tx, h.ty, 16 + 8 * k, 5 + 2.6 * k); ctx.stroke(); ctx.fillStyle = `rgba(40,20,60,${.3 * k})`; ell(h.tx, h.ty, 16 + 8 * k, 5 + 2.6 * k); ctx.fill(); ctx.restore(); };
  };
  // ---------------- Borel's flurry: three cuts, each a step closer ----------------
  PLAN_FX.w4flurry = (e) => {
    act(e, 'flurry', (h, dt, e) => {
      const n = Math.floor(h.el / .3), k = (h.el % .3) / .3;
      if (n >= 3) { recover(e, .8); return true; }
      e.x += e.facing * 110 * dt * (k < .5 ? 1 : 0);
      e.w4pose = k < .35 ? { arm: -2.2 + n * .3, lean: -.2 } : { arm: 1.1, trail: 64, trailFrom: -2.2, trailCol: 'rgba(255,170,90,.9)', lean: .45 };
      if (k >= .35 && h.hitN !== n) { h.hitN = n; sfx('swing'); const fwd = (P.x - e.x) * e.facing; if (fwd > -10 && fwd < e.def.reach + e.hw && Math.abs(P.y - e.y) < 20 && P.z < 40) hitP(Math.round(edmg(e) * .7), e.x, n === 2); }
      return false;
    });
  };
  // ---------------- the Adept's grasp: the Logrus opens under you and something reaches up out of it ----------------
  PLAN_FX.w4grasp = (e) => {
    sfx('charge', 1);
    hazards.push({ kind: 'w4grasp', x: P.x, y: yClamp(P.y), r: 30, t: 1.05, max: 1.05, dmg: edmg(e), up: 0 });
    act(e, 'cast', (h, dt, e) => { e.w4pose = { arm: -2.4, backArm: -2, lean: -.15 }; if (h.el > .5) { recover(e, .9); return true; } return false; });
  };
  reg('w4grasp', {
    update(h, dt) { if (h.t <= 0) { if (!h.fired) { h.fired = true; sfx('crunch'); shakeMag = Math.max(shakeMag, 4); if (inEll(P.x, P.y, h.x, h.y, h.r + 6) && P.z < 30) hitP(h.dmg, h.x, true); } h.up = Math.min(1, -h.t / .12); if (h.t < -.36) h.t = -1; } },
    draw(h, t) { // the sign of the Logrus burning open on the floor
      const k = 1 - Math.max(0, h.t) / h.max, r = h.r * (h.t > 0 ? .5 + .5 * k : 1);
      ctx.save(); ctx.fillStyle = `rgba(20,8,30,${.35 + .3 * k})`; ell(h.x, h.y, r, r * .32); ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(230,170,90,${.35 + .5 * k})`; ctx.lineWidth = 1.4; ctx.beginPath();
      for (let i = 0; i < 5; i++) { const a0 = i / 5 * TAU + t * .6; ctx.moveTo(h.x + Math.cos(a0) * r, h.y + Math.sin(a0) * r * .32); for (let s = 1; s <= 6; s++) { const a = a0 + s * .3, rr = r * (1 - s * .12); ctx.lineTo(h.x + Math.cos(a) * rr, h.y + Math.sin(a) * rr * .32); } }
      ctx.stroke(); ctx.lineWidth = 2; ell(h.x, h.y, r, r * .32); ctx.stroke(); ctx.restore();
    },
    ups(h, list, t) { if (h.up > 0) list.push([h.y + 1, () => { // dark tendrils lashing up out of it
      const u = h.up, f = h.t < -.2 ? 1 - (-h.t - .2) / .16 : 1;
      for (let i = 0; i < 5; i++) { const ox = (i - 2) * 9, L = (36 + (i % 2) * 14) * u * f, sw = Math.sin(i * 2.3) * 8; if (L < 2) continue;
        horn(h.x + ox, h.y + (i % 2) * 3, h.x + ox + sw, h.y - L * .6, h.x + ox + sw * 1.6 - 4, h.y - L, 7, .4, i % 2 ? '#2A1238' : '#3A1A4A', 1.3, '#140820'); }
      glowAt(h.x, h.y - 10, 30, SULF, .3 * f);
    }]); },
    box(h, box) { box(h.x, h.y, 0, 50, 80); },
  });

  // ---------------- the Ty'iga ----------------
  Object.assign(BOSS_WIND, { w4rake: 1.1, w4howl: .95, w4coil: 1.0, w4venom: .85, w4swoop: 1.05, w4shadows: .85, w4maw: 1.1 });
  const LANES = 4, laneH = (FLOOR_BOT - FLOOR_TOP - 8) / LANES, laneY = (i) => FLOOR_TOP + 8 + (i + .5) * laneH, laneOf = (y) => clamp(Math.floor((y - FLOOR_TOP - 8) / laneH), 0, LANES - 1);
  const tellCol = (k, a = 1) => `rgba(230,70,80,${(.14 + .3 * k) * a})`, tellLine = (k) => `rgba(255,130,110,${.5 + .4 * k})`;
  function clawMark(x, y, r, k, n) { // three gouges across an ellipse: where the wolf's claws will land
    ctx.fillStyle = tellCol(k); ell(x, y, r, r * .3); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.6; ell(x, y, r, r * .3); ctx.stroke();
    ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.beginPath(); for (let i = -1; i <= 1; i++) { ctx.moveTo(x - r * .5 + i * 6, y - 5 + i * 2.5); ctx.lineTo(x + r * .5 + i * 6, y + 3 + i * 2.5); } ctx.stroke();
    ctx.fillStyle = `rgba(255,230,210,${.6 + .3 * k})`; ctx.font = '700 9px Cinzel, Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText(String(n), x, y - r * .3 - 3);
  }
  // RAKE (wolf): three marks on the floor, and it blurs from one to the next, raking each
  const rakeT = (e) => targets(e, () => {
    const d = Math.sign(P.x - e.x) || 1, side = P.y > (FLOOR_TOP + FLOOR_BOT) / 2 ? -1 : 1;
    return { pts: [[xClamp(P.x), yClamp(P.y)], [xClamp(P.x - d * 95), yClamp(P.y + side * 44)], [xClamp(P.x + d * 70), yClamp(P.y - side * 10)]] };
  });
  TELL_FX.w4rake = (e, t, k) => { const T = rakeT(e); ctx.save();
    ctx.setLineDash([6, 6]); ctx.strokeStyle = tellLine(k * .6); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(e.x, e.y); for (const p of T.pts) ctx.lineTo(p[0], p[1]); ctx.stroke(); ctx.setLineDash([]);
    T.pts.forEach((p, i) => clawMark(p[0], p[1], 36, cl01(k * 1.4 - i * .2), i + 1)); ctx.restore(); };
  PLAN_FX.w4rake = (e) => {
    const T = rakeT(e), pts = T.pts.slice(); e.w4T = null;
    act(e, 'rake', (h, dt, e) => {
      const i = Math.floor(h.el / .38), k = (h.el % .38) / .38;
      if (i >= 3) { e.w4dash = 0; recover(e, 1.05); return true; } // spent: your opening
      if (h.i !== i) { h.i = i; h.x0 = e.x; h.y0 = e.y; h.hit = false; sfx('whoosh'); }
      const [tx, ty] = pts[i];
      if (k < .42) { const q = sm(k / .42); e.w4dash = 1; e.x = lerp(h.x0, tx, q); e.y = lerp(h.y0, ty, q); e.facing = Math.sign(tx - h.x0) || e.facing; if (Math.random() < .6) dust(e.x - e.facing * 30, e.y, 1); }
      else { e.w4dash = 0; if (!h.hit) { h.hit = true; shakeMag = Math.max(shakeMag, 6); sfx('slam'); burst(tx, ty, 6, ['#2A1A36', '#FF9A50', '#FFFFFF'], 12, 'rock', 0); if (inEll(P.x, P.y, tx, ty, 40) && P.z < 30) hitP(edmg(e), e.x, true); h.marks.push({ x: tx, y: ty, t: 1.2 }); } }
      return false;
    }, { marks: [], i: -1 }).draw = (h) => { for (const m of h.marks) { ctx.save(); ctx.strokeStyle = 'rgba(255,140,70,.6)'; ctx.lineWidth = 2; ctx.beginPath(); for (let j = -1; j <= 1; j++) { ctx.moveTo(m.x - 18 + j * 6, m.y - 4 + j * 2.5); ctx.lineTo(m.x + 18 + j * 6, m.y + 3 + j * 2.5); } ctx.stroke(); ctx.restore(); } };
  };
  // HOWL OF MANY SHAPES: the shapes it has worn run across the arena in lanes. One lane is always clear, or jump them
  const howlT = (e) => targets(e, () => {
    const n = e.phase >= 2 ? 3 : 2, me = laneOf(P.y), all = [0, 1, 2, 3], safe = pick(all.filter(l => l !== me)), lanes = all.filter(l => l !== safe).sort(() => Math.random() - .5).slice(0, n);
    if (!lanes.includes(me)) lanes[0] = me; // the lane you stand in is always one of them
    return { lanes, dir: Math.random() < .5 ? 1 : -1 };
  });
  TELL_FX.w4howl = (e, t, k) => { const T = howlT(e); ctx.save();
    for (const l of T.lanes) { const y = laneY(l); ctx.fillStyle = tellCol(k, .8); ctx.fillRect(camX, y - laneH * .42, VW, laneH * .84);
      ctx.fillStyle = `rgba(255,180,160,${.3 + .5 * k})`; for (let i = 0; i < 9; i++) { const x = (T.dir > 0 ? camX + 20 : camX + VW - 20) + T.dir * i * 70 * Math.min(1, k * 1.6); ell(x, y + (i % 2 ? 4 : -4), 4, 2.2); ctx.fill(); ell(x + T.dir * 6, y + (i % 2 ? 4 : -4) - 3, 1.6, 1.2); ctx.fill(); } } // paw prints running down the lane
    ctx.restore(); };
  PLAN_FX.w4howl = (e) => {
    const T = howlT(e); e.w4T = null; sfx('roar'); shakeMag = 8;
    const shapes = e.phase; hazards.push({ kind: 'w4pack', lanes: T.lanes.map((l, i) => ({ y: laneY(l), x: T.dir > 0 ? camX - 60 - i * 40 : camX + VW + 60 + i * 40, form: 1 + (i % shapes), hit: false })), dir: T.dir, sp: 300 + e.phase * 40, dmg: edmg(e), t: 6, max: 6, y: FLOOR_TOP });
    act(e, 'howl', (h, dt, e) => { if (h.el > .8) { recover(e, .7); return true; } return false; });
  };
  reg('w4pack', {
    update(h, dt) { let gone = true;
      for (const g of h.lanes) { g.x += h.dir * h.sp * dt; if (h.dir > 0 ? g.x < camX + VW + 80 : g.x > camX - 80) gone = false;
        if (!g.hit && Math.abs(P.x - g.x) < 24 && Math.abs(P.y - g.y) < laneH * .55 && P.z < 26) { g.hit = true; hitP(h.dmg, g.x - h.dir * 10, true); }
        if (Math.random() < .5) parts.push({ x: g.x - h.dir * 30, y: g.y + rand(-6, 6), z: rand(4, 30), vx: -h.dir * 40, vy: 0, vz: 20, life: .5, max: .5, col: 'rgba(150,110,220,.5)', size: rand(4, 7), shape: 'puff', rot: 0, vr: 0 }); }
      if (gone) h.t = -1; },
    ups(h, list, t) { for (const g of h.lanes) list.push([g.y, () => onMain(() => { // spectral copies of its old shapes, running
      ctx.save(); ctx.translate(g.x, g.y - (g.form === 3 ? 30 : g.form === 2 ? 12 : 0)); ctx.scale(h.dir * .62, .62); ctx.globalAlpha = .55; ctx.globalCompositeOperation = 'lighter'; TINT = '#7A58C0';
      FORMS[g.form]({ state: 'idle', phase: g.form, walk: 0 }, { walk: t * 14, t }, t); TINT = null; ctx.restore(); })]); },
    box(h, box) { for (const g of h.lanes) box(g.x, g.y, 0, 100, 140); },
  });
  // COIL (serpent): a wall of its smoke rings you round, then closes. Be outside it when it does
  const coilT = (e) => targets(e, () => ({ x: xClamp(P.x), y: yClamp(P.y), r: 70 }));
  TELL_FX.w4coil = (e, t, k) => { const T = coilT(e); ctx.save(); ctx.fillStyle = tellCol(k, .7); ell(T.x, T.y, T.r, T.r * .32); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 2.4; ell(T.x, T.y, T.r, T.r * .32); ctx.stroke();
    ctx.lineWidth = 1.4; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * .5, x = T.x + Math.cos(a) * T.r, y = T.y + Math.sin(a) * T.r * .32; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - Math.cos(a) * 12, y - Math.sin(a) * 4); ctx.stroke(); } ctx.restore(); }; // arrows pointing in: it will close
  PLAN_FX.w4coil = (e) => {
    const T = coilT(e); e.w4T = null; sfx('whoosh');
    hazards.push({ kind: 'w4coil', x: T.x, y: T.y, R: T.r, r: T.r, t: .9, max: .9, dmg: Math.round(edmg(e) * 1.2), hit: false });
    act(e, 'coil', (h, dt, e) => { if (h.el > .7) { recover(e, .9); return true; } return false; });
  };
  reg('w4coil', {
    update(h, dt) {
      const close = cl01((h.max - h.t) / .5), prev = h.r; h.r = h.R * (1 - sm(close)) + 2;
      const d = Math.hypot(P.x - h.x, (P.y - h.y) * 3.1);
      if (!h.hit && d < prev + 4 && d >= h.r - 10 && P.z < 40 && close < 1) { h.hit = true; hitP(h.dmg, h.x, true); }
      if (close >= 1 && !h.done) { h.done = true; shakeMag = Math.max(shakeMag, 6); sfx('slam'); smokePuff(h.x, h.y, 4, 20); }
    },
    ups(h, list, t) { const n = 16; // the smoke wall as tongues round the ellipse, the far half behind you, the near half in front
      for (const front of [0, 1]) list.push([h.y + (front ? h.r * .3 : -h.r * .3), () => { const f = Math.min(1, h.t / .2);
        for (let i = 0; i < n; i++) { const a = i / n * TAU + t * 2; if ((Math.sin(a) > 0) !== !!front) continue; const x = h.x + Math.cos(a) * h.r, y = h.y + Math.sin(a) * h.r * .32;
          smokeTongue(x, y, (24 + (i % 3) * 8) * f, 9, Math.cos(a) * -6, t, i, i % 2 ? '#22162E' : '#160E1E'); }
        if (front) glowAt(h.x, h.y - 10, h.r, BRUISE, .25 * f); }]); },
    box(h, box) { box(h.x, h.y, 0, h.R + 30, 80); },
  });
  // VENOM (serpent): globs of burning venom lobbed where you stand; they leave pools that burn for a while
  const venT = (e) => targets(e, () => { const d = Math.sign(P.x - e.x) || 1; return { pts: [[xClamp(P.x), yClamp(P.y)], [xClamp(P.x + d * 70), yClamp(P.y + 30)], [xClamp(P.x - d * 60), yClamp(P.y - 34)]] }; });
  TELL_FX.w4venom = (e, t, k) => { const T = venT(e); ctx.save(); T.pts.forEach((p, i) => { const q = cl01(k * 1.3 - i * .15); ctx.fillStyle = `rgba(255,150,60,${.12 + .3 * q})`; ell(p[0], p[1], 28, 9); ctx.fill(); ctx.strokeStyle = `rgba(255,190,110,${.4 + .5 * q})`; ctx.lineWidth = 1.6; ell(p[0], p[1], 28 * (.4 + .6 * q), 9 * (.4 + .6 * q)); ctx.stroke(); ell(p[0], p[1], 28, 9); ctx.stroke(); }); ctx.restore(); };
  PLAN_FX.w4venom = (e) => {
    const T = venT(e); e.w4T = null; sfx('shoot');
    T.pts.forEach((p, i) => hazards.push({ kind: 'w4venom', x0: e.x + e.facing * 30, y0: e.y, z0: e.z + 30, x: p[0], y: p[1], fly: .5 + i * .12, fmax: .5 + i * .12, t: 4.2 + i * .12, max: 4.2, dmg: edmg(e), tick: 0 }));
    act(e, 'venom', (h, dt, e) => { if (h.el > .55) { recover(e, .8); return true; } return false; });
  };
  reg('w4venom', {
    update(h, dt) {
      if (h.fly > 0) { h.fly -= dt; if (h.fly <= 0) { sfx('hit-goo'); shakeMag = Math.max(shakeMag, 3); burst(h.x, h.y, 4, ['#FF9A40', '#FFE080', '#5A1A10'], 12, 'goo', 0); if (inEll(P.x, P.y, h.x, h.y, 34) && P.z < 26) hitP(h.dmg, h.x, false); } return; }
      h.tick -= dt; if (h.tick <= 0 && inEll(P.x, P.y, h.x, h.y, 30) && P.z < 4) { h.tick = .6; hitP(Math.round(h.dmg * .35), h.x, false); }
      if (Math.random() < .08) parts.push({ x: h.x + rand(-20, 20), y: h.y + rand(-4, 4), z: 2, vx: 0, vy: 0, vz: rand(30, 60), life: .6, max: .6, col: 'rgba(255,170,80,.8)', size: 1.6, shape: 'star', rot: 0, vr: 3 });
    },
    draw(h, t) { if (h.fly > 0) return; const f = Math.min(1, h.t / .6), sp = Math.min(1, (h.max - h.t) / .15); // a burning pool
      ctx.save(); ctx.fillStyle = `rgba(60,14,10,${.75 * f})`; ell(h.x, h.y, 30 * sp, 9 * sp); ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(h.x, h.y, 2, h.x, h.y, 30); g.addColorStop(0, `rgba(255,190,90,${.55 * f})`); g.addColorStop(1, 'rgba(255,90,40,0)'); ctx.fillStyle = g; ctx.save(); ctx.translate(h.x, h.y); ctx.scale(1, .3); ctx.translate(-h.x, -h.y); ctx.fillRect(h.x - 30, h.y - 30, 60, 60); ctx.restore();
      ctx.strokeStyle = `rgba(255,200,120,${.5 * f})`; ctx.lineWidth = 1; for (let i = 0; i < 3; i++) { const a = t * .7 + i * 2.1; ell(h.x + Math.cos(a) * 12, h.y + Math.sin(a) * 3, 3 + i, 1.2 + i * .3); ctx.stroke(); } ctx.restore(); },
    ups(h, list, t) { if (h.fly > 0) list.push([h.y, () => { const k = 1 - h.fly / h.fmax, x = lerp(h.x0, h.x, k), y = lerp(h.y0, h.y, k), z = lerp(h.z0, 0, k) + Math.sin(k * Math.PI) * 70;
      shadow(x, y, 6); glowAt(x, y - z, 12, '255,160,70', .6); ctx.fillStyle = C('#FF9A40'); circle(x, y - z, 4.4); ctx.fill(); outline(1.2); ctx.fillStyle = '#FFF0B0'; circle(x - 1, y - z - 1.2, 1.5); ctx.fill(); }]); },
    box(h, box) { box(h.x, h.y, 0, 120, 160); },
  });
  // SWOOP (horror): it climbs, then dives across the whole arena along the dark track on the floor, lowest where you stand
  const swoopT = (e) => targets(e, () => { const d = Math.sign(P.x - e.x) || 1, x0 = e.x, x1 = d > 0 ? rightWall() - 30 : leftWall() + 30; return { x0, y0: e.y, x1, px: clamp(P.x, Math.min(x0, x1) + 20, Math.max(x0, x1) - 20), py: yClamp(P.y), d }; });
  const swoopAt = (T, u) => { const uP = clamp((T.px - T.x0) / (T.x1 - T.x0), .1, .9), x = lerp(T.x0, T.x1, u), y = u < uP ? lerp(T.y0, T.py, sm(u / uP)) : T.py, q = (u - uP) / (u < uP ? uP : 1 - uP); return [x, y, 6 + 104 * q * q]; };
  TELL_FX.w4swoop = (e, t, k) => { const T = swoopT(e); ctx.save();
    for (let i = 0; i <= 30; i++) { const u = i / 30, [x, y, z] = swoopAt(T, u), danger = z < 50, w = 14 + (1 - z / 110) * 14; if (u > k * 1.3) break;
      ctx.fillStyle = danger ? tellCol(k) : `rgba(40,20,50,${.18 + .2 * k})`; ell(x, y, w, w * .3); ctx.fill(); }
    ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.6; for (let i = 1; i < 6; i++) { const [x, y] = swoopAt(T, i / 6); ctx.beginPath(); ctx.moveTo(x - T.d * 8, y - 6); ctx.lineTo(x, y); ctx.lineTo(x - T.d * 8, y + 6); ctx.stroke(); }
    ctx.restore(); };
  PLAN_FX.w4swoop = (e) => {
    const T = swoopT(e); e.w4T = null; sfx('whoosh');
    act(e, 'swoop', (h, dt, e) => {
      const u = h.el / .95; if (u >= 1) { e.w4dash = 0; recover(e, 1.15); return true; }
      const [x, y, z] = swoopAt(T, u); e.x = x; e.y = y; e.z = z; e.facing = T.d; e.w4dash = 1;
      if (!h.hit && Math.abs(P.x - x) < e.hw * .8 && Math.abs(P.y - y) < 22 && P.z < z + 40 && z < 60) { h.hit = true; hitP(Math.round(edmg(e) * 1.2), x - T.d * 10, true); }
      if (z < 40 && Math.random() < .8) dust(x, y, 1);
      return false;
    });
  };
  // SHADOWS (horror): the shadows of its wings slide over the floor after you; when they stop, hands of darkness reach up out of them
  const shadT = (e) => targets(e, () => ({ s: [0, 1, 2].map(i => ({ x: e.x + (i - 1) * 40, y: yClamp(e.y + (i - 1) * 30), ox: (i - 1) * 64, oy: (i - 1) * (i === 1 ? 0 : 22) })) }));
  TELL_FX.w4shadows = (e, t, k) => { const T = shadT(e); ctx.save(); for (const s of T.s) wingShadow(s.x, s.y, 30, k, t); ctx.restore(); };
  function wingShadow(x, y, r, k, t, frozen) {
    ctx.fillStyle = `rgba(16,6,22,${.35 + .3 * k})`; ctx.beginPath(); ctx.moveTo(x - r, y);
    for (let i = 0; i <= 8; i++) { const a = Math.PI + i / 8 * Math.PI, rr = r * (i % 2 ? .7 : 1); ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * .34); }
    ctx.quadraticCurveTo(x, y + r * .25, x - r, y); ctx.fill();
    ctx.strokeStyle = frozen ? `rgba(255,120,110,${.6 + .3 * Math.sin(t * 20)})` : tellLine(k * .7); ctx.lineWidth = frozen ? 2.2 : 1.2; ell(x, y, r, r * .32); ctx.stroke();
  }
  PLAN_FX.w4shadows = (e) => {
    const T = shadT(e); e.w4T = null; sfx('charge', 2);
    for (const s of T.s) hazards.push({ kind: 'w4shadow', x: s.x, y: s.y, t: .95, max: .95, dmg: edmg(e), up: 0 });
    act(e, 'shadows', (h, dt, e) => { if (h.el > .9) { recover(e, .9); return true; } return false; });
  };
  reg('w4shadow', {
    update(h, dt) { if (h.t > .5) return; if (h.t <= 0) { if (!h.fired) { h.fired = true; sfx('crunch'); shakeMag = Math.max(shakeMag, 5); if (inEll(P.x, P.y, h.x, h.y, 34) && P.z < 36) hitP(h.dmg, h.x, true); } h.up = Math.min(1, -h.t / .1); if (h.t < -.38) h.t = -1; } },
    draw(h, t) { if (h.t > 0) wingShadow(h.x, h.y, 30, 1, t, h.t < .5); },
    ups(h, list, t) { if (h.up > 0) list.push([h.y + 1, () => { const f = h.t < -.24 ? 1 - (-h.t - .24) / .14 : 1;
      for (let i = 0; i < 4; i++) { const ox = (i - 1.5) * 12, L = (40 + (i % 2) * 12) * h.up * f; if (L < 2) continue; // clawed hands of darkness
        const s = horn(h.x + ox, h.y, h.x + ox * 1.3, h.y - L * .6, h.x + ox * 1.6, h.y - L, 9, 3, '#1E0E26', 1.3, '#0A040E');
        for (let c = -1; c <= 1; c++) horn(h.x + ox * 1.6, h.y - L, h.x + ox * 1.6 + c * 4, h.y - L - 6, h.x + ox * 1.6 + c * 7, h.y - L - 9 + Math.abs(c) * 3, 2.6, .3, '#2A1636', .9); }
      glowAt(h.x, h.y - 16, 30, BRUISE, .35 * f); }]); },
    box(h, box) { box(h.x, h.y, 0, 50, 90); },
  });
  // THE HUNGRY DARK (close burst, every form): a ring of black fangs rises out of the floor round it and snaps shut
  const mawR = (e) => e.hw + 66;
  TELL_FX.w4maw = (e, t, k) => { const R = mawR(e); ctx.save(); ctx.fillStyle = tellCol(k); ell(e.x, e.y, R * (.4 + .6 * k), R * (.4 + .6 * k) / 3.1); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 2; ell(e.x, e.y, R, R / 3.1); ctx.stroke();
    ctx.fillStyle = `rgba(230,220,200,${.4 + .5 * k})`; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, x = e.x + Math.cos(a) * R, y = e.y + Math.sin(a) * R / 3.1, h = 4 + 10 * k; poly([x - 3, y, x, y - h, x + 3, y]); ctx.fill(); } ctx.restore(); };
  PLAN_FX.w4maw = (e) => {
    const R = mawR(e); sfx('slam'); shakeMag = 10;
    if (Math.hypot(P.x - e.x, (P.y - e.y) * 3.1) < R && P.z < 70) hitP(Math.round(edmg(e) * 1.15), e.x, true);
    hazards.push({ kind: 'w4fangs', x: e.x, y: e.y, R, t: .5, max: .5 }); burst(e.x, e.y, 20, ['#1A0E22', '#E8DCC0', '#FF9A50'], 20, 'rock', 0, true);
    act(e, 'maw', (h, dt, e) => { if (h.el > .4) { recover(e, 1.15); return true; } return false; }); // spent for a moment afterward: your opening
  };
  reg('w4fangs', {
    ups(h, list, t) { const n = 18, k = 1 - h.t / h.max, up = k < .3 ? k / .3 : 1 - (k - .3) / .7;
      for (const front of [0, 1]) list.push([h.y + (front ? 8 : -8), () => { for (let i = 0; i < n; i++) { const a = i / n * TAU; if ((Math.sin(a) > 0) !== !!front) continue;
        const r = h.R * (1 - .25 * Math.min(1, k / .3)), x = h.x + Math.cos(a) * r, y = h.y + Math.sin(a) * r / 3.1, L = 30 * up;
        if (L > 1) horn(x - Math.cos(a) * 3, y, x - Math.cos(a) * 8, y - L * .7, x - Math.cos(a) * 16, y - L, 8, .5, '#E4D8BC', 1.1, '#8E806A'); } }]); },
    box(h, box) { box(h.x, h.y, 0, h.R + 20, 70); },
  });

  // ======================================================================================================
  // THE RULES OF THE PLACES
  // ======================================================================================================
  // every area of this world paints its upright attack effects in depth with the figures
  function hzBoxes(box) { for (const h of hazards) if (HZ[h.kind] && HZ[h.kind].box) HZ[h.kind].box(h, box); }
  function hzList(list, t) { for (const h of hazards) if (HZ[h.kind] && HZ[h.kind].ups && h.t > -.4) HZ[h.kind].ups(h, list, t); }
  MECH_FX.w4road = { start() {}, update() {}, boxes(m, box) { hzBoxes(box); }, list(m, list, t) { hzList(list, t); } };

  // ---------------- THE THELBANE SPIRES: the Abyss breathes ----------------
  // Every few seconds the Abyss draws a breath. While it INHALES, the weight goes out of everything: the light enemies are
  // lifted helpless off their feet to be juggled at leisure, and your own jumps go high. Then it EXHALES and everything
  // still in the air is slammed down: enemies take damage from the fall, and if you are up there too you come down like
  // a hammer, with a shockwave that hits everyone around where you land. The heavy ones (brutes, Borel) never leave the ground.
  const ROSTER = ['chknight', 'chadept', 'chhound', 'cheye', 'chmoth', 'chbrute', 'chknight', 'chhound', 'chadept', 'cheye'];
  function chaosRoster() { // a different third wave every time: six drawn from the Courts, one of them armored, and Borel among them
    const pool = ROSTER.slice().sort(() => Math.random() - .5).slice(0, 6), el = pool.findIndex(k => k !== 'cheye' && k !== 'chmoth');
    if (el >= 0) pool[el] += '*';
    pool.splice(2, 0, 'chborel'); return pool;
  }
  const heavy = (e) => e.boss || e.def.move === 'fly' || (e.def.poise || 0) >= 3 || e.dead;
  MECH_FX.w4breath = {
    start(m) {
      if (stage.waves[0]) stage.waves[0] = chaosRoster();
      m.phase = 'calm'; m.t = 4; m.k = 0; m.debris = []; m.pslam = false;
    },
    update(m, dt) {
      for (const e of enemies) if (e.type === 'chborel' && !e.w4intro && !e.dead) { e.w4intro = 1; banner(e.def.name, 'MASTER OF SWORDS', 2.2); }
      if (stillT > 0) return;
      m.t -= dt;
      if (m.t <= 0) {
        if (m.phase === 'calm') { m.phase = 'warn'; m.t = 1.3; floatText(P.x, P.y, 110, 'THE ABYSS INHALES', '#D8B8FF', 16); sfx('charge', 1);
          m.debris = [...Array(26)].map((_, i) => ({ x: camX + rand(10, VW - 10), y: rand(FLOOR_TOP + 6, FLOOR_BOT), z: 0, vz: 0, s: rand(1.6, 4), r: rand(0, 6), kind: i % 3 })); }
        else if (m.phase === 'warn') { m.phase = 'rise'; m.t = 2.6; shakeMag = Math.max(shakeMag, 4);
          for (const e of enemies) if (!heavy(e)) { e.state = 'hurt'; e.t = .5; e.plan = null; e.air = true; e.vz = rand(150, 210); e.vx = rand(-30, 30); e.spin = rand(-1.5, 1.5); e.w4float = 1; e.w4peak = 0; } }
        else if (m.phase === 'rise') { m.phase = 'calm'; m.t = rand(5.5, 7); floatText(P.x, P.y, 110, '...AND EXHALES', '#FFC890', 16); shakeMag = 10; sfx('slam'); flashT = Math.max(flashT, .06);
          for (const e of enemies) if (e.w4float && !e.dead && e.z > 4) { e.vz = -700; e.air = true; }
          if (P.z > 18 && P.state !== 'dead') { P.vz = -760; m.pslam = true; }
          for (const d of m.debris) d.vz = -600; }
      }
      m.k += ((m.phase === 'rise' ? 1 : 0) - m.k) * Math.min(1, dt * 3);
      if (m.phase === 'rise') { // the weight goes out of the world
        if (P.z > 0 || P.vz > 0) P.vz += GRAV * dt * .66;
        for (const e of enemies) if (e.w4float && !e.dead && e.air) { e.vz += GRAV * dt * .9; if (e.z > 120) e.vz = Math.min(e.vz, 0); e.w4peak = Math.max(e.w4peak, e.z); if (e.state === 'hurt') e.t = Math.max(e.t, .2); }
      }
      for (const e of enemies) if (e.w4float && (e.z <= 0 || e.dead) && m.phase !== 'rise') { // the landing
        if (!e.dead && e.w4peak > 12) { const dmg = Math.round(10 + e.w4peak * .14); strike(e, dmg, Math.sign(e.x - P.x) || 1, { dmg, kb: 40, power: 2, trump: 1 }); burst(e.x, e.y, 4, ['#2A1A36', '#D8C8B0'], 10, 'rock', 0); }
        e.w4float = 0;
      }
      if (m.pslam && P.z <= 0) { // the prince comes down like a hammer
        m.pslam = false; shakeMag = 12; sfx('slam'); hitstop = Math.max(hitstop, .08);
        fx.push({ kind: 'ring', x: P.x, y: P.y, z: 2, t: .45, max: .45, r: 120, col: '#E8C8FF', flat: 1 }); burst(P.x, P.y, 4, ['#E8C8FF', '#FFFFFF', '#8A6ACF'], 22, 'rock', 0, true);
        for (const e of enemies) if (!e.dead && !e.boss && Math.hypot(e.x - P.x, (e.y - P.y) * 2) < 100 + e.hw && e.z < 40) strike(e, 16 * wMult(P.w), Math.sign(e.x - P.x) || P.facing, { dmg: 16, kb: 260, launch: 340, power: 2, trump: 1 });
      }
      for (const d of m.debris) { // pebbles and shards of glass lift off the floor, and come down hard
        if (m.phase === 'warn') d.z = Math.abs(Math.sin(m.t * 30 + d.r)) * 2;
        else if (m.phase === 'rise') { d.z += (30 + d.s * 14 - d.z) * dt * .8; d.r += dt * .6; }
        else { d.vz -= GRAV * dt; d.z = Math.max(0, d.z + d.vz * dt); }
      }
      if (m.phase === 'calm' && m.debris.length && m.debris.every(d => d.z <= 0)) m.debris = [];
    },
    boxes(m, box) { hzBoxes(box); if (m.debris.length) box(camX + VW / 2, FLOOR_BOT, 0, VW / 2 + 20, 200); },
    list(m, list, t) {
      hzList(list, t);
      for (const d of m.debris) list.push([d.y, () => { const y = d.y - d.z; shadow(d.x, d.y, d.s * (1 - Math.min(.7, d.z / 120)));
        ctx.save(); ctx.translate(d.x, y); ctx.rotate(d.r);
        if (d.kind === 0) fillPoly([-d.s, d.s * .4, -d.s * .3, -d.s, d.s, -d.s * .2, d.s * .5, d.s * .8], '#1E1428', .8);
        else if (d.kind === 1) fillPoly([-d.s * .5, d.s, 0, -d.s * 1.6, d.s * .5, d.s], '#4A3A62', .8);
        else fillPoly([-d.s, 0, 0, -d.s * .8, d.s, 0, 0, d.s * .8], '#D8CCB4', .8);
        ctx.restore(); }]);
      if (m.k > .02) list.push([FLOOR_TOP - 1, () => onMain(() => { // the inhaled air: a violet haze streaming upward
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = m.k * .5;
        for (let i = 0; i < 7; i++) { const x = camX + ((i * 97 + 30) % VW), y = FLOOR_BOT - ((t * 50 + i * 41) % 150); const g = ctx.createLinearGradient(0, y - 40, 0, y + 40); g.addColorStop(0, 'rgba(170,120,230,0)'); g.addColorStop(.5, 'rgba(170,120,230,.25)'); g.addColorStop(1, 'rgba(170,120,230,0)'); ctx.fillStyle = g; ctx.fillRect(x - 3, y - 40, 6, 80); }
        ctx.restore(); })]);
    },
  };

  // ---------------- THE RIM OF THE ABYSS: the Ty'iga's shapes ----------------
  const FORM_BOX = { 1: [52, 68], 2: [40, 52], 3: [40, 104] };
  MECH_FX.w4rim = {
    start(m) { m.ph = 1; },
    update(m, dt) {
      const e = boss && boss.def === BOSSES.tyiga ? boss : null; if (!e) return;
      if (e.phase !== m.ph) { e.w4from = m.ph; m.ph = e.phase; e.w4shift = 1; smokePuff(e.x, e.y, 30, 30); sfx('roar'); e.w4T = null; }
      if (e.w4shift > 0) e.w4shift = Math.max(0, e.w4shift - dt / 1.3);
      if (!e.dead) { const [w, h] = FORM_BOX[e.phase] || FORM_BOX[1]; e.hw = w * e.size; e.hh = h * e.size; }
      if (stillT > 0) return;
      if (e.state === 'wind' && e.plan === 'w4shadows') { const T = shadT(e); for (const s of T.s) { const tx = xClamp(P.x + s.ox), ty = yClamp(P.y + s.oy), d = Math.hypot(tx - s.x, ty - s.y), sp = 210 * dt; if (d > 1) { s.x += (tx - s.x) / d * Math.min(d, sp); s.y += (ty - s.y) / d * Math.min(d, sp); } } }
      if (!e.dead && Math.random() < dt * 10) parts.push({ x: camX + rand(0, VW), y: rand(FLOOR_TOP, FLOOR_BOT), z: 0, vx: rand(-6, 6), vy: 0, vz: rand(30, 60), life: 2.2, max: 2.2, col: pick(['rgba(255,150,70,.8)', 'rgba(255,200,120,.7)', 'rgba(150,100,200,.6)']), size: rand(1.2, 2.2), shape: 'star', rot: 0, vr: 1, w4: 1 }); // embers rising out of the Abyss
    },
    boxes(m, box) { hzBoxes(box); },
    list(m, list, t) { hzList(list, t); },
  };
  // the arena's weather and its light: the shared code gives an unknown boss a generic sparkle and an unset tint, so this
  // recolors the sparkle as ash and embers, and leaves the canvas holding this boss's own tint color between frames
  let lastTint = 0;
  const tintLoop = () => {
    requestAnimationFrame(tintLoop);
    if (typeof boss === 'undefined' || !boss || boss.def !== BOSSES.tyiga || boss.dead) return;
    const g = cv.getContext('2d'); g.fillStyle = ['rgba(150,60,150,.32)', 'rgba(150,60,150,.32)', 'rgba(110,70,170,.34)', 'rgba(200,70,60,.34)'][boss.phase || 1];
    for (const p of parts) if (!p.w4 && p.shape === 'star' && p.max === 1.6 && (p.col === '#D8A0E8' || p.col === '#9FD8E0' || p.col === '#FFF0C0')) { p.w4 = 1; p.col = pick(['#FF9A50', '#FFD08A', '#8A6AB0']); }
  };
  requestAnimationFrame(tintLoop);

  // ======================================================================================================
  // PASSAGES
  // ======================================================================================================
  // THE LOGRUS (Black Road -> Thelbane): the sign of Chaos reaches in from every edge like spilled ink and closes over
  // everything; then the dark burns away from the middle like paper held to a flame, its edge glowing, onto the spires
  TRANS_FX.w4logrus = (T, p, c, inP, t) => {
    const X1 = VW, Y0 = Y_OFF, Y1 = VH, H = Y1 - Y0, cx = X1 / 2, cy = Y0 + H / 2;
    if (inP) {
      ctx.fillStyle = `rgba(8,4,12,${Math.pow(c, 3)})`; ctx.fillRect(0, Y0, X1, H);
      for (let i = 0; i < 44; i++) { // tendrils of ink from all four edges, curling as they come
        const side = i % 4, u = hash1(i * 3.3), len = (110 + hash1(i + 7) * 260) * c, w = 14 + hash1(i + 2) * 26;
        const [x0, y0, ang] = side === 0 ? [u * X1, Y0 - 4, Math.PI / 2] : side === 1 ? [u * X1, Y1 + 4, -Math.PI / 2] : side === 2 ? [-4, Y0 + u * H, 0] : [X1 + 4, Y0 + u * H, Math.PI];
        const curl = (hash1(i + 11) - .5) * 2.2, mx = x0 + Math.cos(ang + curl * .3) * len * .55, my = y0 + Math.sin(ang + curl * .3) * len * .55, ex = x0 + Math.cos(ang + curl) * len, ey = y0 + Math.sin(ang + curl) * len;
        const s = taper(x0, y0, mx, my, ex, ey, w, .6, 8); trace(s.L, s.R); ctx.fillStyle = '#0A0610'; ctx.fill();
        ctx.strokeStyle = `rgba(150,100,200,${.55 * c})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(s.L[0], s.L[1]); for (let k = 2; k < s.L.length; k += 2) ctx.lineTo(s.L[k], s.L[k + 1]); ctx.stroke();
      }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(230,180,90,${.5 * c})`; ctx.lineWidth = 1.6; ctx.beginPath(); // the gold of the Logrus, burning in the ink
      for (let i = 0; i < 9; i++) { let x = cx + (hash1(i) - .5) * X1 * .9, y = cy + (hash1(i + 4) - .5) * H * .8, a = hash1(i + 9) * TAU; ctx.moveTo(x, y); for (let s = 0; s < 10 * c; s++) { a += Math.sin(i * 3 + s) * .9; x += Math.cos(a) * 14; y += Math.sin(a) * 10; ctx.lineTo(x, y); } }
      ctx.stroke(); ctx.restore();
    } else {
      const q = 1 - c, R = Math.hypot(X1, H) * .62 * ease(q), edge = (a) => R * (1 + .12 * Math.sin(a * 5 + 1) + .07 * Math.sin(a * 11 + 3) + .04 * Math.sin(a * 23));
      const hole = (k) => { ctx.moveTo(cx + edge(0) * k, cy); for (let i = 1; i <= 72; i++) { const a = i / 72 * TAU; ctx.lineTo(cx + Math.cos(a) * edge(a) * k, cy + Math.sin(a) * edge(a) * k * .7); } ctx.closePath(); };
      ctx.beginPath(); ctx.rect(-10, Y0 - 10, X1 + 20, H + 20); hole(1); ctx.fillStyle = '#0A0610'; ctx.fill('evenodd');
      ctx.beginPath(); hole(1); ctx.strokeStyle = 'rgba(60,24,20,.9)'; ctx.lineWidth = 9; ctx.stroke(); // the charred rim
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.beginPath(); hole(1); ctx.strokeStyle = 'rgba(255,140,60,.85)'; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = 'rgba(255,230,160,.9)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
      for (let i = 0; i < 24; i++) { const a = hash1(i) * TAU, d = edge(a) * (1 + hash1(i + 3) * .1); ctx.fillStyle = `rgba(255,${150 + hash1(i + 5) * 80},80,${c})`; circle(cx + Math.cos(a) * d, cy + Math.sin(a) * d * .7 - hash1(i + 8) * 20 * q, 1.4); ctx.fill(); } // sparks lifting off the burning edge
    }
  };
  // THE TRUMP (Thelbane -> the Rim): a Trump card of the place ahead comes up out of the dark and he is drawn into it;
  // the picture on the card becomes the place, and the gilded frame flies out past him
  function trumpPicture(x, y, w, h, t) { // the Rim of the Abyss, as a Trump painter would set it down
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#0A040E'); g.addColorStop(.5, '#4A1428'); g.addColorStop(.75, '#A0402E'); g.addColorStop(.76, '#1A0E16'); g.addColorStop(1, '#0C080E'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    const sx = x + w / 2, sy = y + h * .36;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
    for (let arm = 0; arm < 5; arm++) { ctx.strokeStyle = 'rgba(230,110,80,.35)'; ctx.lineWidth = w * .03; ctx.beginPath(); for (let k = 0; k <= 1; k += .03) { const a = arm / 5 * TAU + k * 4 + t * .2, d = w * (.08 + k * .7); ctx.lineTo(sx + Math.cos(a) * d, sy + Math.sin(a) * d * .6); } ctx.stroke(); }
    softDab(sx, sy, w * .3, '255,190,120', .5); ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#08040A'; circle(sx, sy, w * .09); ctx.fill(); ctx.strokeStyle = '#FFF0D0'; ctx.lineWidth = w * .008; circle(sx, sy, w * .092); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,170,80,.8)'; ctx.lineWidth = w * .006; ell(sx, y + h * .86, w * .38, h * .04); ctx.stroke(); ell(sx, y + h * .86, w * .2, h * .02); ctx.stroke();
    for (const d of [-1, 1]) { ctx.fillStyle = '#1A1220'; const bx = sx + d * w * .36; poly([bx - w * .07, y + h * .78, bx - w * .04, y + h * .5, bx, y + h * .45, bx + w * .04, y + h * .5, bx + w * .07, y + h * .78]); ctx.fill(); } // the two Lords
    ctx.restore();
  }
  function trumpFrame(x, y, w, h, a) {
    const b = w * .07; ctx.save(); ctx.globalAlpha = a;
    ctx.beginPath(); ctx.rect(x - b, y - b, w + b * 2, h + b * 2); ctx.rect(x, y, w, h); const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#F4D88A'); g.addColorStop(.5, '#B8862E'); g.addColorStop(1, '#E8C26A'); ctx.fillStyle = g; ctx.fill('evenodd');
    ctx.strokeStyle = '#3A2410'; ctx.lineWidth = Math.max(1, b * .1); ctx.strokeRect(x - b, y - b, w + b * 2, h + b * 2); ctx.strokeRect(x, y, w, h); ctx.strokeRect(x - b * .5, y - b * .5, w + b, h + b);
    ctx.fillStyle = '#8A1E30'; for (const [cx, cy] of [[x - b * .5, y - b * .5], [x + w + b * .5, y - b * .5], [x - b * .5, y + h + b * .5], [x + w + b * .5, y + h + b * .5]]) { ctx.beginPath(); ctx.moveTo(cx, cy - b * .4); ctx.lineTo(cx + b * .4, cy); ctx.lineTo(cx, cy + b * .4); ctx.lineTo(cx - b * .4, cy); ctx.fill(); }
    ctx.restore();
  }
  TRANS_FX.w4trump = (T, p, c, inP, t) => {
    const X1 = VW, Y0 = Y_OFF, H = VH - Y0, cx = X1 / 2, cy = Y0 + H / 2;
    if (inP) {
      ctx.fillStyle = `rgba(8,4,12,${Math.min(.85, c * 1.4)})`; ctx.fillRect(0, Y0, X1, H); // the world goes dark around the card
      const k = ease(c), h = lerp(70, X1 / .62 * 1.08, Math.pow(k, 2.2)), w = h * .62, rot = (1 - k) * -.25;
      ctx.save(); ctx.translate(cx, cy + (1 - k) * 20); ctx.rotate(rot);
      ctx.fillStyle = 'rgba(255,220,150,.25)'; ctx.fillRect(-w / 2 - w * .12, -h / 2 - w * .12, w * 1.24, h + w * .24); // its glow
      trumpPicture(-w / 2, -h / 2, w, h, t); trumpFrame(-w / 2, -h / 2, w, h, 1);
      ctx.restore();
    } else {
      const k = 1 - c, h = X1 / .62 * 1.08 * (1 + k * 1.2), w = h * .62;
      ctx.save(); ctx.translate(cx, cy); trumpFrame(-w / 2, -h / 2, w, h, c); ctx.restore();
      ctx.fillStyle = `rgba(255,236,190,${c * .25})`; ctx.fillRect(0, Y0, X1, H);
    }
  };
  };
  window.w4Late = late;
})();
