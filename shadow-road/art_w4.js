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
    buildSky(20, 41, '120,50,80', ['meadow', 'tower', 'house', 'prism', 'stairs'], '255,210,150');
    // long bands of storm cloud, maroon and bruise, their tops lit by the corona
    for (let b = 0; b < 6; b++) {
      const y0 = 92 + b * 17 + rnd() * 6, wv = awWave(77 + b, [[2, 7], [5, 3], [11, 1.5]]), dens = awWave(91 + b * 3, [[3, 1], [7, .6]]);
      const body = ['#4A1E3E', '#5A2440', '#6A2A44', '#7A3046', '#8A3A48', '#9A4A48'][b], under = shade(body, -.35), lit = ['#C8708A', '#D88070', '#E89060', '#F0A060', '#F4B068', '#F8C070'][b];
      for (let x = 0; x < AW_W; x += 9) { if (dens(x) < -.25) continue; const y = y0 + wv(x), L = 18 + rnd() * 34, h = 2.2 + rnd() * 3.4;
        awWrap(x, L, (x) => { ctx.fillStyle = under; ctx.globalAlpha = .7; ell(x + 2, y + h * .6, L, h); ctx.fill(); ctx.fillStyle = body; ctx.globalAlpha = .85; ell(x, y, L, h); ctx.fill(); ctx.fillStyle = lit; ctx.globalAlpha = .45; ell(x + L * .15, y - h * .55, L * .7, h * .35); ctx.fill(); ctx.globalAlpha = 1; }); }
    }
    // the glow of the depths along the far horizon: whatever burns at the bottom of the Abyss
    { const g = ctx.createLinearGradient(0, 170, 0, T); g.addColorStop(0, 'rgba(255,170,90,0)'); g.addColorStop(.7, 'rgba(255,150,80,.35)'); g.addColorStop(1, 'rgba(255,200,120,.6)'); ctx.fillStyle = g; ctx.fillRect(0, 170, AW_W, T - 170); }
    // Thelbane, far off: needle spires on islands of rock, hazy violet against the glow
    const FP = { base: '#5A3E66', lit: '#B07A8A', litA: .5, band: 'rgba(40,20,50,.35)', win: '#FFD890', dark: '#3A2848', top: '#7A5A70' };
    for (let i = 0; i < 7; i++) awWR(i * 183 + rnd() * 80, 60, rnd, (x, r) => {
      const y = 176 + r() * 30, w = 24 + r() * 26; isle(x, y, w, 20 + r() * 26, { dark: '#3A2840', base: '#5A3E58', lit: '#A0707A', top: '#7A5A6A' }, r);
      const n = 1 + Math.floor(r() * 3); for (let k = 0; k < n; k++) needle(x + (k - (n - 1) / 2) * w * .6 + (r() - .5) * 6, y + 1, 40 + r() * 70 * (k === 0 ? 1.4 : 1), 5 + r() * 5, FP, r, { bulbs: 2 + Math.floor(r() * 3), ph: r() * 3, flag: r() < .4 });
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
  function roadFloor(rnd, th) {
    roadSeams = [];
    ctx.fillStyle = '#0A070E'; ctx.fillRect(0, T - 3, AW_W, VH - T + 3);
    // the road: plates of fused black glass, wider toward us, their joints glowing where the fire underneath shows through
    let y = T + 1, row = 0;
    for (const h of [8, 10, 12, 15, 18, 22, 26]) {
      for (const [x0, w] of awRow(rnd, h * 3.4, h * 6.4)) awWR(x0, w, rnd, (x, r) => {
        const sk = (r() - .5) * h * .5, pts = [x + 1 + sk, y + .8, x + w - 1 + sk, y + .8 + (r() - .5) * 1.2, x + w - 1 - sk * .3, y + h - .8, x + 1 - sk * .3, y + h - .8];
        const l = 1 - row * .07, g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, `hsl(${280 + r() * 20},22%,${17 * l}%)`); g.addColorStop(1, `hsl(${290 + r() * 15},26%,${6 * l}%)`);
        poly(pts); ctx.fillStyle = g; ctx.fill();
        ctx.save(); poly(pts); ctx.clip();
        ctx.fillStyle = 'rgba(190,140,210,.2)'; poly([x + w * (.2 + r() * .3), y, x + w * (.4 + r() * .3), y, x + w * (.2 + r() * .2), y + h, x + w * .05, y + h]); ctx.fill(); // the corona reflected in the glass
        if (r() < .35) { ctx.strokeStyle = 'rgba(150,110,180,.22)'; ctx.lineWidth = .6; const cx = x + w * r(), cy = y + h * (.3 + r() * .4); for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.ellipse(cx, cy, k * h * .5, k * h * .16, 0, Math.PI * .1, Math.PI * .9); ctx.stroke(); } } // flow marks where the glass ran
        if (r() < .25) dab(x + w * r(), y + h * r(), h * .3, '#05030A', .4);
        ctx.restore();
        ctx.fillStyle = 'rgba(200,160,220,.45)'; ctx.fillRect(x + 2 + sk, y + .8, w - 4, .7); // bevel
        if (r() < .3 && x >= 0 && x < AW_W) { // a glowing joint: the seam under this plate
          const pts2 = [[x + 1 + sk, y + .5], [x + w * .5 + sk * .6, y + .3 + (r() - .5) * 1.5], [x + w - 1 + sk, y + .6]], ph = r() * TAU; roadSeams.push({ pts: pts2, ph });
          awGlow(`rgb(${EMBER})`, 5, () => { ctx.strokeStyle = 'rgba(255,150,70,.8)'; ctx.lineWidth = .9; ctx.beginPath(); pts2.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); });
        }
        if (r() < .08) { // a crack running across the plate, fire inside it
          let cx = x + w * (.2 + r() * .6), cy = y + 1.5; const pts3 = [[cx, cy]]; while (cy < y + h - 2) { cx += (r() - .5) * h * .5; cy += 2 + r() * h * .3; pts3.push([cx, Math.min(cy, y + h - 1)]); }
          if (x >= 0 && x < AW_W) roadSeams.push({ pts: pts3, ph: r() * TAU });
          awGlow('rgb(255,120,50)', 6, () => { ctx.strokeStyle = 'rgba(255,170,90,.85)'; ctx.lineWidth = .8; ctx.beginPath(); pts3.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); });
        }
      });
      y += h; row++;
    }
    // sigils of the Courts inlaid in gold down the middle of the road
    for (let i = 0; i < 4; i++) { const x = 160 + i * 320 + rnd() * 40, yy = T + 52 + rnd() * 10;
      awGlow('rgba(240,196,90,.7)', 4, () => { ctx.strokeStyle = 'rgba(232,186,90,.55)'; ctx.lineWidth = 1; ctx.beginPath(); for (let a = 0; a < TAU * 2; a += .2) { const rr = 2 + a * 2.2; const px = x + Math.cos(a) * rr * 1.6, py = yy + Math.sin(a) * rr * .38; a ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); }); }
    // the near edge: the road simply ends, broken, and under it there is nothing but the glow far below
    { const ey = 349, g = ctx.createLinearGradient(0, ey, 0, VH); g.addColorStop(0, '#1A0A10'); g.addColorStop(1, '#5A2018'); ctx.fillStyle = g; ctx.fillRect(0, ey, AW_W, VH - ey);
      ctx.fillStyle = '#0E0A12'; ctx.beginPath(); ctx.moveTo(0, ey - 2); for (let x = 0; x <= AW_W; x += 6) ctx.lineTo(x, ey + 2 + Math.abs(Math.sin(x * .37) * 3 + Math.sin(x * .11) * 2)); ctx.lineTo(AW_W, ey - 2); ctx.closePath(); ctx.fill();
      for (let x = 3; x < AW_W; x += 11) { const d = 3 + Math.abs(Math.sin(x * .7)) * 6; ctx.fillStyle = '#0E0A12'; poly([x - 3, ey + 3, x + 3, ey + 3, x, ey + 3 + d]); ctx.fill(); } } // glass dripping off the edge
    // the back verge: black grass with ember-lit tips, glass shards, iron stakes and the odd skull
    awBlades(rnd, 1300, T - 6, T + 3, 9, ['#0E080E', '#1A0E16', '#2A1420'], 1.3);
    awBlades(rnd, 260, T - 4, T + 2, 8, ['#8A3A22', '#C8642A'], .8);
    for (let i = 0; i < 26; i++) awWR(rnd() * AW_W, 10, rnd, (x, r) => { const hgt = 6 + r() * 16, w = 2 + r() * 4, lean = (r() - .5) * 6; poly([x - w, T + 2, x + lean, T + 2 - hgt, x + w, T + 2]); ctx.fillStyle = '#120C18'; ctx.fill(); poly([x + lean, T + 2 - hgt, x + w, T + 2, x + w * .2, T + 2]); ctx.fillStyle = '#5A4672'; ctx.globalAlpha = .7; ctx.fill(); ctx.globalAlpha = 1; });
    for (let i = 0; i < 6; i++) awWR(rnd() * AW_W, 10, rnd, (x, r) => { ctx.fillStyle = '#1A1218'; ctx.fillRect(x - 1.2, T - 26 - r() * 8, 2.4, 30); ctx.fillStyle = '#6A5A68'; ctx.fillRect(x + .2, T - 30, .6, 30); });
    for (let i = 0; i < 4; i++) awWR(rnd() * AW_W, 8, rnd, (x) => { ctx.fillStyle = '#C8BCA0'; ell(x, T, 4, 3.4); ctx.fill(); ctx.fillRect(x - 2.4, T + 1, 4.8, 2.6); ctx.fillStyle = '#1A1014'; circle(x - 1.5, T - .3, 1); ctx.fill(); circle(x + 1.5, T - .3, 1); ctx.fill(); });
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
    name: 'the black road', sky: ['#1C0C26', '#3E1636', '#86304A', '#E0985A'], sun: [0.72, 0.24, '255,200,140'], haze: '150,70,90',
    floorA: '#2A2034', floorB: '#0A070E', path: '#C8642A', skyKind: 'none',
    grade: { desat: .1, top: 'rgba(70,40,140,.45)', bot: 'rgba(210,90,50,.4)', vig: 'rgba(14,4,16,.62)' },
    liveSky(camX, t) { skyEclipse(THEMES.chaos, camX); skyFrags(camX, t, Y_OFF + 14, Y_OFF + 80); },
    liveFloor(camX, t) { liveSeams(roadSeams, camX, t, '255,150,70', .22, .16); liveEmbers(camX, t, 90, T - 30, T + 90, '255,170,90'); },
  };
  AW_FAR.chaos = roadFar; AW_MID.chaos = roadMid; AW_FLOOR.chaos = roadFloor;
})();
