'use strict';
// World 4 art, enemies, boss, passages and approach rule: THE COURTS OF CHAOS
//   chaos     - The Black Road: a road of fused black glass running out over the Abyss under an eclipsed sun,
//               crags of obsidian rising out of nothing, fragments of other worlds drifting past overhead
//   chaos2    - The Thelbane Spires: the needle towers of the Chaos lords, floating, hanging, joined by bridges to nowhere;
//               a causeway of bone-white stone inlaid with the gold of the Logrus. Here the Abyss breathes (rule 'w4breath')
//   chaosBoss - The Rim of the Abyss: the last dais at the edge of everything, the Abyss turning overhead like a storm
// Enemies: Knight of the Courts, Logrus Adept, Borel Duke of Chaos (human looks), Hound of Chaos, Watcher of the Abyss,
// Eclipse Moth, Abyss Brute. Boss: the Ty'iga, Shifter of Shapes (wolf, Drake of the Courts, Mask of a Thousand Faces).
// Passages: 'w4logrus' (the Logrus closes in like ink, then the dark burns away) and 'w4trump' (drawn through a Trump card).
// Everything lives inside this closure so nothing collides with the other files.
(() => {
  const T = FLOOR_TOP;
  const DET = () => !FLASH && !TINT && !LITE; // fine shading is skipped in a hit flash or a flat afterimage tint
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
  const OBS = { base: '#140D1A', lit: '#3E2C52', dark: '#050308', sheen: '#E8D0F8', vein: '#FF8A3C' };

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
  function shard(x, base, top, w, lean, rnd, P, veins) { // one blade of black glass: a dark face, a lit face split down its ridge, a bright edge
    const tx = x + lean, ty = top, rx = x + w * (.25 + rnd() * .2) + lean * .4;
    const L = [x - w, base, tx, ty, rx, base], Rf = [rx, base, tx, ty, x + w * (.9 + rnd() * .2), base];
    poly([x - w, base, tx, ty, x + w * (.9 + rnd() * .2), base]); ctx.fillStyle = P.base; ctx.fill();
    poly(AW_SUN > 0 ? Rf : L); ctx.fillStyle = P.lit; ctx.fill();
    poly(AW_SUN > 0 ? L : Rf); ctx.fillStyle = P.dark; ctx.globalAlpha = .7; ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = P.sheen; ctx.lineWidth = .9; ctx.globalAlpha = .8; ctx.beginPath(); ctx.moveTo(tx, ty + 1); ctx.lineTo(lerp(tx, rx, .55), lerp(ty, base, .55)); ctx.stroke(); ctx.globalAlpha = .35; ctx.beginPath(); ctx.moveTo(tx + .5, ty + 2); ctx.lineTo(lerp(tx, Rf[4], .4), lerp(ty, base, .4)); ctx.stroke(); ctx.globalAlpha = 1;
    if (veins) awGlow(`rgb(${EMBER})`, 5, () => { ctx.strokeStyle = 'rgba(255,150,70,.85)'; ctx.lineWidth = .8; ctx.beginPath(); let vx = lerp(tx, x, .3), vy = lerp(ty, base, .3); ctx.moveTo(vx, vy); for (let s2 = 0; s2 < 4; s2++) { vx += (rnd() - .5) * w * .5; vy += (base - ty) * .14; ctx.lineTo(vx, vy); } ctx.stroke(); });
  }
  // a crag of obsidian rising out of the Abyss: a cluster of glass blades, the tallest in the middle
  function crag(x, top, w, rnd, P, o = {}) {
    const base = T + 6, n = 2 + Math.floor(rnd() * 3), H = base - top;
    const order = [...Array(n)].map((_, i) => i).sort(() => rnd() - .5);
    for (const i of order) { const k = n === 1 ? 0 : i / (n - 1) - .5, hh = H * (1 - Math.abs(k) * (.5 + rnd() * .3)), ww = w * (.45 + rnd() * .3);
      shard(x + k * w * 1.4, base, base - hh, ww, (k * .6 + (rnd() - .5) * .3) * hh * .25, rnd, P, o.veins !== 0 && rnd() < .6); }
    for (let i = 0; i < 5; i++) dab(x + (rnd() - .5) * w * 1.4, base - rnd() * H * .3, 2 + rnd() * 3, P.dark, .4);
    return [x, top];
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
    for (let i = 0; i < 5; i++) { const x = 60 + i * 256 + rnd() * 90, w = 18 + rnd() * 26, top = T - 60 - rnd() * 90; tops.push([x, top + w * .2]); awWR(x, w * 1.4, rnd, (x, r) => { const tip = crag(x, top, w, r, OBS); if (r() < .55) thornTree(x + (r() - .3) * w * .5, top + w * .3, 40 + r() * 30, r); }); }
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
  window.W4_ART = { spire, isle, stairs, chain, banner4, crag, thornTree, shard, OBS }; // (the end of each area paints with these: thresholds.js)

  // ======================================================================================================
  // THE HUMANS OF THE COURTS: their looks for drawHumanoid, and their weapons
  // ======================================================================================================
  Object.assign(HUMANS, {
    // a knight of the Courts: grey-violet skin, maroon surcoat over black steel, a horned gold circlet, eyes like coals
    w4knight: { skin: '#B4A2B2', hair: '#120A10', body: '#5A1828', sleeve: '#481422', trim: '#C9A040', legs: '#1C1218', boots: '#120A10', plate: '#3A3244', plateTrim: '#C9A040', pauldron: '#2E2836', cape: '#2A0A16', mask: '#1A0E16', eye: '#FFC850', weapon: 'w4flamberge' },
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
      wavyBlade(21, 54, 3.4, .55, ['#241A2E', '#6A5684', '#9A86B8', 'rgba(255,150,70,.9)']);
      // the guard: two gold horns curling back toward the hand
      horn(19.5, -1, 18, -7, 13, -10, 3, .4, '#C9A040', 1); horn(19.5, 1, 18, 7, 13, 10, 3, .4, '#C9A040', 1);
      rrect(18.4, -3.4, 3.2, 6.8, 1); ctx.fillStyle = C('#B08A34'); ctx.fill(); outline(1);
      awSwingGlow(pose, 16, 46);
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
    const bareLook = e.bare && BARE_LOOK[e.def.look];
    if (bareLook) { const keep = e.def; e.def = Object.create(keep, { look: { value: bareLook } }); try { humanDraw(e, a); } finally { e.def = keep; } } else humanDraw(e, a);
    ctx.restore();
    if (bareLook && typeof armorHumanFrame === 'function') { ctx.save(); if (v < 1) ctx.globalAlpha *= v; const F = armorHumanFrame(e, a, true); BARE_HEAD[e.def.look](F.hy, a.t || 0, e, a); ctx.restore(); }
  };
  // what was under the armor of the Courts, once its guard is broken (armor_b.js): the knight's own shape, horned, the fire
  // of the Courts showing through cracks in its face; and in the adept's hood no face at all, only the knot of the Logrus
  Object.assign(HUMANS, {
    w4knightBare: Object.assign({}, HUMANS.w4knight, { skin: '#5A2A4A', hair: '#0A0408', mask: null, eye: '#FFE070' }),
    w4adeptBare: Object.assign({}, HUMANS.w4adept, { skin: '#0E0614', eye: '#0E0614' }),
  });
  const BARE_LOOK = { w4knight: 'w4knightBare', w4adept: 'w4adeptBare' };
  const BARE_HEAD = {
    w4knight(hy, t, e, a) {
      horn(-1, hy - 8, -6, hy - 19, -14, hy - 21, 3.6, .5, '#B8A88A', 1); // horns grown out of his brow
      cracks([[2, hy - 8, 4, hy - 5, 3, hy - 2], [7, hy + 2, 5, hy + 5, 6.5, hy + 8], [-3, hy - 4, -1, hy]], .95);
      emberEye(6.4, hy - .8, .8, '#FFE070', SULF, e.state === 'wind');
      for (let i = 0; i < 3; i++) smokeTongue(-4 + i * 4, hy - 9, 7 + i, 3, -5, t, i + 7, '#2A1430'); // he smoulders
      horn(3, hy - 9, 3, hy - 20, -4, hy - 25, 4, .5, '#D8CCB0', 1.1);
    },
    w4adept(hy, t, e, a) {
      ctx.fillStyle = C('#05020A'); ell(6, hy + 1, 4.6, 7.2); ctx.fill(); // the hood's opening: nothing in it
      const a0 = t * 1.6, ox = 6, oy = hy;
      glowAt(ox, oy, 12, SULF, .45);
      for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate(ox, oy); ctx.rotate(a0 + k * TAU / 3); ctx.scale(1, .42);
        ctx.strokeStyle = C(OUT); ctx.lineWidth = 2.2; circle(0, 0, 4); ctx.stroke(); ctx.strokeStyle = C(['#8A5AB0', '#B070C0', '#6A3A8A'][k]); ctx.lineWidth = 1.2; circle(0, 0, 4); ctx.stroke(); ctx.restore(); }
      ctx.fillStyle = C('#FFE6A0'); circle(ox, oy, 1.4); ctx.fill();
    },
  };
  // the breakable pods of this world: geodes of black glass, cracked open on a heart of fire
  const podDraw = drawPod;
  drawPod = function (p, t) {
    if (p.theme !== 'chaos') { podDraw(p, t); return; }
    const sp = propSprite('pod-chaos', 50, 50, 25, 42, (th, s) => { // painted like the road's own glass (paint.js propSprite)
      const pts = [-14, 0, -15, -14, -8, -27, 3, -31, 12, -22, 15, -9, 12, 0];
      poly(pts); ctx.fillStyle = '#2A1E36'; ctx.fill();
      ctx.save(); poly(pts); ctx.clip();
      poly(s > 0 ? [3, -31, 12, -22, 15, -9, 12, 0, 2, 0, 0, -18] : [-14, 0, -15, -14, -8, -27, 3, -31, 0, -18, 2, 0]); ctx.fillStyle = '#5A4278'; ctx.globalAlpha = .8; ctx.fill(); ctx.globalAlpha = 1; // the face toward the light
      for (let i = 0; i < 10; i++) dab(((i * 7.3) % 26) - 13, -3 - (i * 5.9) % 26, 2 + (i % 3), i % 2 ? '#140D1A' : '#7A5A98', .35);
      ctx.restore();
      awGlow(`rgb(${EMBER})`, 5, () => { ctx.strokeStyle = 'rgba(255,150,70,.9)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(-6, -26); ctx.lineTo(-2, -17); ctx.lineTo(-7, -9); ctx.lineTo(-3, -2); ctx.moveTo(-2, -17); ctx.lineTo(5, -14); ctx.stroke(); }); // its heart of fire showing through
      ctx.fillStyle = 'rgba(230,200,255,.5)'; poly([3, -31, 12, -22, 6, -22]); ctx.fill();
    }, { foot: 8, seed: 37, haze: .06, line: .75 });
    propDraw(sp, p.x, p.y, { sh: 20, flash: FLASH });
    if (DET()) onMain(() => glowAt(p.x - 3, p.y - 14, 14 + Math.sin(t * 1.2 + p.x) * 2, EMBER, .4));
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
    const AR = e.elite && !e.bare ? (e.armA = { body: ctx.getTransform(), by }) : null, bare = e.bare; // (armor_b.js paints its barding in these)
    // the tail: a whip that ends in smoke
    const tw = Math.sin(t * 2.4) * 3;
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 4.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-16, by - 2); ctx.quadraticCurveTo(-28, by - 6 + tw, -34, by - 14 + tw * 1.5); ctx.stroke();
    ctx.strokeStyle = C(hide); ctx.lineWidth = 2.4; ctx.stroke();
    smokeTongue(-34, by - 14 + tw * 1.5, 10, 4, -6, t, 2, '#241830');
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
    cracks([[-14, by - 3, -10, by + 1, -12, by + 4], [2, by - 6, 4, by - 1, 1, by + 3, 3, by + 6], [-4, by - 5, -6, by - 1]].concat(bare ? [[-18, by, -15, by - 4, -16, by - 7], [8, by - 9, 10, by - 4, 8, by + 2], [-8, by + 2, -5, by + 5]] : []), leap || bite || bare ? 1 : .75);
    leg(-12, false, 0, false); leg(9, true, Math.PI, false);
    // the mane: smoke streaming back from the neck
    for (let i = 0; i < 6; i++) { const k = i / 5, sx = 12 - k * 22, sy = by - 7 - Math.sin(k * Math.PI) * 3; smokeTongue(sx - (leap ? 4 : 0), sy, 10 - k * 3, 5 - k * 1.5, -9 - (leap ? 6 : 0), t, i, i % 2 ? '#2A1A36' : '#1E1228'); }
    // the neck, and the skull it wears: bone, cracked, with horns swept back
    const hx = 21 + (bite ? 5 : 0) - crouch * 2, hy = by - 9 + crouch * 7 + (bite ? 2 : 0);
    seg(10, by - 4, hx - 3, hy + 1, 10, 7, hide, 1);
    const open = bite ? .55 : leap ? .4 : crouch * .35;
    ctx.save(); ctx.translate(hx, hy); if (AR) AR.head = ctx.getTransform();
    if (bare) { houndFireHead(t, open, wind, a.hurt); ctx.restore(); ctx.restore(); return; }
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

  // the hound's skull knocked away (its guard broken: armor_b.js): there was never a head under the bone, only the fire
  // of the Abyss in the shape of one, a maw of embers and two coals for eyes
  function houndFireHead(t, open, wind, hurt) {
    for (let i = 0; i < 4; i++) smokeTongue(-2 + i * 3, -4 - i * .6, 9 - i, 4, -8, t, i + 3, i % 2 ? '#2A1A36' : '#1E1228');
    const skull = PB([-5, -5, 2, -8.4, 10, -6.4, 16, -2, 14, 1.4, 6, 2, -3, 2.4]);
    cel(skull, '#2A1430', { d: 2, r: 1, w: 1.3, dark: '#12081A', lite: '#7A3A60', tex: () => { const g = ctx.createRadialGradient(6, -1, 0, 6, -1, 10); g.addColorStop(0, 'rgba(255,150,60,.75)'); g.addColorStop(1, 'rgba(255,90,40,0)'); ctx.fillStyle = g; ctx.fillRect(-6, -10, 24, 14); } });
    add(() => { for (let i = 0; i < 5; i++) { const x = -2 + i * 3, fl = 5 + Math.sin(t * 9 + i * 2.1) * 2; ctx.fillStyle = `rgba(255,${150 + i * 15},70,.75)`; ctx.beginPath(); ctx.moveTo(x - 1.8, -5 - i * .3); ctx.quadraticCurveTo(x - 1, -9 - fl, x - 3, -11 - fl); ctx.quadraticCurveTo(x + 1.4, -8 - fl * .6, x + 1.8, -5.6 - i * .3); ctx.fill(); } }); // its crown of fire
    ctx.save(); ctx.rotate(open + .15); ctx.fillStyle = C('#FF8A3C'); poly([0, 1, 13, 2.4, 0, 5]); ctx.fill(); outline(.8); ctx.restore(); // the maw
    glowAt(7, 1.5, 9, EMBER, .5 + open * .5);
    if (!hurt) { emberEye(5.2, -3.4, 1, wind ? '#FFF0A0' : '#FFC040', SULF, true); emberEye(9.4, -3, .7, '#FFC040', SULF, wind > .3); }
  }

  // ---------------- WATCHER OF THE ABYSS: a great eye in a husk of bone and flesh, trailing feelers ----------------
  CREATURES.w4eye = function (e, a) {
    a = a || {}; const t = a.t || 0, wind = a.wind || 0, hurt = a.hurt;
    const cy = -18, R = 11, bob = Math.sin(t * 1.6 + (e.walk || 0)) * 1.2;
    ctx.save(); ctx.translate(0, bob); ctx.lineCap = 'round'; if (e.elite && !e.bare) e.armA = { root: ctx.getTransform() };
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
    if (e.bare) { // its shutters broken (armor_b.js): the husk splits, and all round its rim other eyes open, each on its own time
      for (let i = 0; i < 6; i++) { const an = -2.5 + i * 1.0, ex = 1 + Math.cos(an) * (R + 3.4), ey = cy + Math.sin(an) * (R * .9 + 3), s = .55 + hsh(i) * .3, open = hurt ? .2 : clamp(Math.sin(t * (1.3 + hsh(i + 4)) + i * 2) * 3 + 1.5, .1, 1);
        cel(PE(ex, ey, 4 * s, 3.2 * s), '#7A2A44', { d: .8, r: .4, w: 1 });
        ctx.fillStyle = C('#F0E4D0'); ell(ex, ey, 3 * s, 2.4 * s * open); ctx.fill(); ctx.fillStyle = C(wind ? '#FFC040' : '#E0A030'); circle(ex + look * .4 * s, ey, 1.5 * s * Math.min(1, open * 1.5)); ctx.fill(); ctx.fillStyle = C('#140808'); ell(ex + look * .4 * s, ey, .4 * s, 1.2 * s * open); ctx.fill();
        ell(ex, ey, 3 * s, 2.4 * s * open); outline(.8); }
      cracks([[-R + 1, cy - 8, -R + 4, cy - 4], [R - 3, cy + 6, R, cy + 9], [-3, cy + 9, -1, cy + 12]], 1);
    }
    ctx.restore();
  };

  // ---------------- ECLIPSE MOTH: a great moth whose wings each carry a black sun ----------------
  CREATURES.w4moth = function (e, a) {
    a = a || {}; const t = a.t || 0, wind = a.wind || 0, dash = e.state === 'dash';
    const flap = dash ? -.7 : Math.sin(t * 7 + (e.walk || 0)) * .85, bob = Math.sin(t * 7) * 1.2, cy = -16 + bob;
    ctx.save(); ctx.lineJoin = 'round'; ctx.scale(1.35, 1.35);
    if (dash) ctx.rotate(.18);
    const AR = e.elite && !e.bare ? (e.armA = { body: ctx.getTransform(), cy }) : null; // (armor_b.js paints its armor in these)
    const wing = (far, hind) => {
      const k = Math.cos(flap * (far ? 1 : 1.05)), sy = (hind ? .72 : 1) * Math.max(.12, Math.abs(k)) * (k < 0 ? -1 : 1);
      ctx.save(); ctx.translate(-2, cy - 2); if (dash) ctx.rotate(-.5); ctx.scale(far ? .82 : 1, sy); if (AR && !hind) AR[far ? 'wingF' : 'wingN'] = ctx.getTransform();
      const L = hind ? 20 : 28, path = hind ? PB([0, 0, -8, -6, -18, -14, -21, -20, -12, -20, -2, -8]) : PB([2, 0, 0, -10, -6, -22, -16, -30, -28, -28, -26, -18, -12, -6]);
      cel(path, far ? '#3A2440' : '#55304E', { d: 2.4, r: 1.2, w: 1.4, dark: '#22142A', lite: '#9A6A80', tex: () => {
        ctx.fillStyle = 'rgba(230,190,120,.5)'; if (!hind) { ell(-17, -25, 9, 4, -.5); ctx.fill(); }
        ctx.strokeStyle = 'rgba(20,10,20,.5)'; ctx.lineWidth = .6; ctx.beginPath(); for (let i = 0; i < 4; i++) { ctx.moveTo(0, -2); ctx.lineTo(-L * (.4 + i * .2), -L * (.9 - i * .2)); } ctx.stroke(); // veins
      } });
      if (!hind) { // the eye-spot: a black sun with its gold ring of corona
        const ex = -15, ey = -18;
        if (e.bare) { // the eclipse is over (armor_b.js): the black sun takes fire, flames licking off its rim
          add(() => { for (let i = 0; i < 9; i++) { const an = i / 9 * TAU + t * 1.5, L = 6.6 + Math.sin(t * 8 + i * 2) * 1.6; ctx.fillStyle = 'rgba(255,150,60,.75)'; ctx.beginPath(); ctx.moveTo(ex + Math.cos(an - .3) * 4.6, ey + Math.sin(an - .3) * 4.6); ctx.lineTo(ex + Math.cos(an) * L, ey + Math.sin(an) * L); ctx.lineTo(ex + Math.cos(an + .3) * 4.6, ey + Math.sin(an + .3) * 4.6); ctx.fill(); } });
          ctx.fillStyle = C('#E86A20'); circle(ex, ey, 5.2); ctx.fill(); ctx.fillStyle = C('#FFC850'); circle(ex, ey, 4.2); ctx.fill(); ctx.fillStyle = C('#FFF6D0'); circle(ex - .6, ey - .6, 2.4); ctx.fill(); glowAt(ex, ey, 12, EMBER, .55);
        } else { ctx.fillStyle = C('#E8B848'); circle(ex, ey, 5.2); ctx.fill(); ctx.fillStyle = C('#FFE6A0'); circle(ex, ey, 4.4); ctx.fill(); ctx.fillStyle = C('#0A060C'); circle(ex, ey, 3.6); ctx.fill();
        if (DET()) { ctx.strokeStyle = 'rgba(255,240,200,.9)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.arc(ex, ey, 3.7, -1.6, .2); ctx.stroke(); } }
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
    const HIP = -30 + sink, SH = -54 + sink + breath, bare = e.bare;
    const AR = e.elite && !bare ? (e.armA = { root: ctx.getTransform(), SH }) : null; // (armor_b.js paints its yoke and cage in these)
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
        ctx.save(); ctx.translate(px, py); ctx.rotate(r); ctx.fillStyle = plate; poly([-w, h * .2, -w * .6, -h, w * .7, -h * .8, w, h * .3, 0, h]);
        if (bare) { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w); g.addColorStop(0, '#FFE6A0'); g.addColorStop(.4, '#FF8A3C'); g.addColorStop(1, '#8A2A18'); ctx.fillStyle = g; } // its plates gone with its armor: the magma under them
        ctx.fill();
        if (!bare) { ctx.fillStyle = lit; ctx.globalAlpha = .55; poly([-w * .6, -h, w * .7, -h * .8, w * .2, -h * .2]); ctx.fill(); ctx.globalAlpha = 1; }
        ctx.strokeStyle = dk; ctx.lineWidth = .8; poly([-w, h * .2, -w * .6, -h, w * .7, -h * .8, w, h * .3, 0, h]); ctx.stroke(); ctx.restore();
      }
      ctx.fillStyle = 'rgba(90,60,90,.35)'; ell(4, HIP - 10, 9, 6); ctx.fill(); // the gut, a lighter hide
    } });
    cracks([[-16, HIP - 4, -12, HIP - 12, -14, HIP - 18], [2, HIP - 6, 6, HIP - 12, 4, HIP - 18, 8, SH + 6], [-4, SH + 4, -2, SH + 10]].concat(bare ? [[-19, SH + 4, -15, SH + 10, -18, SH + 16], [12, SH - 2, 15, SH + 4, 13, SH + 9], [-8, HIP - 2, -5, HIP - 8]] : []), windSlam || leap || bare ? 1 : .8);
    if (bare) glowAt(-2, SH + 6, 30, EMBER, .25 + Math.sin(t * 3) * .06);
    legP(4, 0, false);
    // the head, low and thrust forward between the shoulders: ram horns of bone, a jaw of tusks, burning eyes
    const hx = 15 + (swing ? 3 : 0), hy = SH + 2 + (windSlam ? wind * 3 : 0);
    ctx.save(); ctx.translate(hx, hy); if (AR) AR.head = ctx.getTransform();
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
  //   phase 2  the Drake of the Courts: a wyvern crossed with a herald's eagle, wings of membrane and ember-tipped pinions,
  //            a long maned neck, a hooked beak of gilt horn, talons and a long barbed tail
  //   phase 3  a colossal Mask of a Thousand Faces: porcelain mended with gold, an aureole set round with the faces it
  //            has taken, a mantle of darkness, two great hands drifting free; its expression shifts with its mood
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
  // ---------------------------------------------------------------- the Mask of a Thousand Faces
  // a colossal mask of glazed porcelain mended with gold, hung in a mantle of darkness before an aureole of beaten gold
  // set round with the small masks of the faces it has taken. Its expression shifts with its mood; its two great hands
  // drift free of any arm, only smoke where the wrists should be
  const MK = { glaze: '#ECE4D2', glazeDk: '#A69E90', glazeLit: '#FFFCF2', gilt: '#E6C676', giltDk: '#9A7030', gold: '#C8962E', goldLit: '#F6DC92', umber: '#4A2A1C', robe: '#170F1E', robeDk: '#07040A', robeLit: '#4C3862', hole: '#0E0508' };
  // a small mask: kind 1 laughing (gilded), -1 weeping (pale, with tears)
  function miniFace(x, y, r, kind, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const col = kind > 0 ? MK.gilt : MK.glaze;
    cel(PB([-r * .8, -r * .95, 0, -r * 1.12, r * .8, -r * .95, r * .9, r * .2, r * .42, r * 1.05, -r * .42, r * 1.05, -r * .9, r * .2]), col, { d: r * .2, r: r * .08, w: Math.max(.9, r * .1), dark: kind > 0 ? MK.giltDk : MK.glazeDk, lite: MK.glazeLit });
    ctx.fillStyle = C(MK.hole);
    for (const s of [-1, 1]) { ell(s * r * .36, -r * .18, r * .22, r * .1, s * kind * -.4); ctx.fill(); }
    ctx.beginPath(); // the mouth: a crescent bent up in laughter, or down in grief
    if (kind > 0) { ctx.moveTo(-r * .46, r * .34); ctx.quadraticCurveTo(0, r * .98, r * .46, r * .34); ctx.quadraticCurveTo(0, r * .56, -r * .46, r * .34); }
    else { ctx.moveTo(-r * .4, r * .74); ctx.quadraticCurveTo(0, r * .18, r * .4, r * .74); ctx.quadraticCurveTo(0, r * .46, -r * .4, r * .74); }
    ctx.fill();
    if (DET() && r > 5) {
      if (kind < 0) { ctx.strokeStyle = 'rgba(60,70,120,.6)'; ctx.lineWidth = Math.max(.6, r * .07); ctx.beginPath(); for (const s of [-1, 1]) { ctx.moveTo(s * r * .36, -r * .06); ctx.quadraticCurveTo(s * r * .46, r * .3, s * r * .38, r * .62); } ctx.stroke(); }
      else { ctx.fillStyle = 'rgba(200,80,70,.3)'; for (const s of [-1, 1]) { ell(s * r * .5, r * .22, r * .18, r * .12); ctx.fill(); } }
    }
    ctx.restore();
  }
  // one of its hands: the wrist at the origin, the fingers reaching along +x; curl closes them, flip turns the hand over
  function maskHand(x, y, rot, curl, sc, far, flip = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc * flip);
    const col = far ? '#BDB4A4' : MK.glaze, dk = far ? '#7A7266' : MK.glazeDk, lt = far ? '#E2DACA' : MK.glazeLit;
    smokeLobe(-8, 1, 6.5, '#1A1022', .85); smokeLobe(-14, -1, 4.4, '#140C1A', .7); // where an arm should be, only smoke
    horn(5, -7, 10, -14 + curl * 5, 15 + curl * 3, -15 + curl * 9, 5.4, 2.2, col, 1.2, dk); // the thumb
    { const tx = 15 + curl * 3, ty = -15 + curl * 9; horn(tx - 1.4, ty + .4, tx + 1.2, ty - .6, tx + 3.6, ty + .4, 2.2, .3, '#1A1016', .7); }
    cel(PB([-3, -8, 9, -10, 19, -8, 21, 0, 19, 8, 8, 9, -3, 7]), col, { d: 2.2, r: 1, w: 1.6, dark: dk, lite: lt, tex: () => {
      ctx.strokeStyle = 'rgba(110,90,80,.5)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(4, -4); ctx.quadraticCurveTo(10, 0, 16, -3); ctx.moveTo(3, 3); ctx.quadraticCurveTo(10, 4, 17, 2); ctx.stroke(); // the lines of the palm
    } });
    for (let i = 0; i < 4; i++) { // the fingers, long and jointed, with nails of black lacquer
      const by = -6 + i * 4.2, L = [14, 16, 15, 12][i], sp = (i - 1.5) * .1, a1 = sp + curl * .9, a2 = sp + curl * 2.1;
      const mx = 19 + Math.cos(a1) * L * .55, my = by + Math.sin(a1) * L * .55, tx = mx + Math.cos(a2) * L * .5, ty = my + Math.sin(a2) * L * .5;
      horn(19, by, mx, my, tx, ty, 4.4, 2.3, col, 1.1, dk);
      const ca = Math.cos(a2), sa = Math.sin(a2); horn(tx - ca * 1.5, ty - sa * 1.5, tx + ca * 2, ty + sa * 2 + .3, tx + ca * 4.6, ty + sa * 4.6 + .8, 2.3, .3, '#1A1016', .7);
      if (i === 2) { ctx.strokeStyle = C(MK.gold); ctx.lineWidth = 1.6; ctx.beginPath(); const rx = 19 + (mx - 19) * .45, ry = by + (my - by) * .45; ctx.moveTo(rx - sa * 2.2, ry + ca * 2.2); ctx.lineTo(rx + sa * 2.2, ry - ca * 2.2); ctx.stroke(); } // a ring of gold
    }
    ctx.strokeStyle = C(MK.gold); ctx.lineWidth = 1.8; ell(-3, 0, 2.6, 7.4); ctx.stroke(); // the broken wrist, its rim gilded
    ctx.restore();
  }
  // its mood: s smile (-1 grief .. 1 laughter), b brow (-1 wrath .. 1 sorrow), o how far the mouth is open
  function maskMood(e, a, t) {
    const st = e.state, w = a.wind || 0, act = st === 'w4act' ? e.w4a : null, is = (p, n) => (st === 'wind' && e.plan === p) ? w : act === n ? 1 : 0;
    let s = .3 * Math.sin(t * .37), b = .3 * Math.sin(t * .37 + 1.6), o = .06; // at rest it drifts, slowly, between a smile and sorrow
    const mix = (k, S, B, O) => { if (k <= 0) return; s += (S - s) * k; b += (B - b) * k; o += (O - o) * k; };
    mix(is('w4clap', 'clap'), -.4, -1, act === 'clap' ? .55 : .2);
    if (e.w4mood) mix(1, e.w4mood > 0 ? 1 : -1, e.w4mood > 0 ? .35 : 1, e.w4mood > 0 ? .75 : .45);
    mix(is('w4howl', 'howl'), -.2, -.6, 1);
    mix(is('w4maw', 'maw'), .2, -1, 1);
    if (a.hurt) mix(1, -.7, .9, .3);
    const X = e.w4ex || (e.w4ex = { s, b, o }); X.s += (s - X.s) * .2; X.b += (b - X.b) * .2; X.o += (o - X.o) * .2;
    return X;
  }
  function tyMask(e, a, t) {
    const X = maskMood(e, a, t), down = e.state === 'down', live = e.w4hl && !e.dead && !(e.w4shift > 0), fierce = e.state === 'wind' || e.state === 'w4act';
    const bob = Math.sin(t * .9) * 2, cy = -64 + bob + (down ? 16 : 0), cx = 2, sw = Math.sin(t * .7) * 3;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (!live) maskHand(-74, -24 - bob, -2.1, .35, .92, true);
    // the aureole: a disc of beaten gold, tooled with rays and punched dots, the dark of the Abyss inside it
    const hx = cx - 6, hy = cy - 4;
    cel(PE(hx, hy, 46, 46), MK.gold, { d: 4, r: 1.6, w: 2, dark: MK.giltDk, lite: MK.goldLit, tex: () => {
      ctx.strokeStyle = 'rgba(110,70,24,.6)'; ctx.lineWidth = .8; ctx.beginPath(); for (let i = 0; i < 28; i++) { const an = i / 28 * TAU; ctx.moveTo(hx + Math.cos(an) * 37, hy + Math.sin(an) * 37); ctx.lineTo(hx + Math.cos(an) * 44, hy + Math.sin(an) * 44); } ctx.stroke();
      ctx.fillStyle = MK.robeDk; circle(hx, hy, 36); ctx.fill();
      const g = ctx.createRadialGradient(hx + 4, hy + 6, 4, hx, hy, 36); g.addColorStop(0, `rgba(${BRUISE},.55)`); g.addColorStop(1, `rgba(${BRUISE},0)`); ctx.fillStyle = g; ctx.fillRect(hx - 36, hy - 36, 72, 72);
      ctx.strokeStyle = 'rgba(150,110,200,.35)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 3; i++) ctx.arc(hx, hy, 14 + i * 7, i * 2.1 + t * .05, i * 2.1 + t * .05 + 2.2); ctx.stroke(); // the Abyss turning in it, slowly
      ctx.fillStyle = 'rgba(255,238,180,.75)'; for (let i = 0; i < 40; i++) { const an = i / 40 * TAU; circle(hx + Math.cos(an) * 40.5, hy + Math.sin(an) * 40.5, .9); ctx.fill(); }
      ctx.strokeStyle = MK.giltDk; ctx.lineWidth = 1.4; circle(hx, hy, 36); ctx.stroke();
    } });
    // the faces it has taken, set round the rim; when they fall they grow back slowly
    const hk = sm(cl01(e.w4halo ?? 1));
    for (let i = 0; i < 9; i++) { const an = -Math.PI / 2 + (i - 4) * .4, x = hx + Math.cos(an) * 46, y = hy + Math.sin(an) * 46;
      if (hk < .2) { ctx.fillStyle = C(MK.robeDk); ell(x, y, 4, 5, an + Math.PI / 2); ctx.fill(); outline(.9); }
      else miniFace(x, y, 7.6 * hk, i % 2 ? -1 : 1, an + Math.PI / 2); }
    // the mantle of darkness it hangs in, its hem fraying into smoke
    wisps([cx - 34 + sw, -4, 14, 5, cx - 8 + sw, -1, 12, 4, cx + 26 + sw, -2, 13, 5], t);
    const robe = PB([cx - 20, cy + 6, cx - 30, cy + 30, cx - 38 + sw * .4, -18, cx - 34 + sw, -2, cx - 16 + sw, -6, cx + sw, 2, cx + 16 + sw, -5, cx + 30 + sw, 0, cx + 36 + sw * .4, -20, cx + 28, cy + 32, cx + 20, cy + 6]);
    cel(robe, MK.robe, { d: 5, r: 1.6, w: 2, dark: MK.robeDk, lite: MK.robeLit, under: () => {
      const g = ctx.createLinearGradient(0, cy + 30, 0, 0); g.addColorStop(0, 'rgba(255,120,60,0)'); g.addColorStop(1, 'rgba(255,120,60,.22)'); ctx.fillStyle = g; ctx.fillRect(cx - 8 + sw * .5, cy + 30, 16, -cy - 30); // the void inside it, warm at the hem
    }, tex: () => { // folds hanging straight down, swaying with the hem
      ctx.lineWidth = 1.1; for (let i = 0; i < 6; i++) { const x = cx - 22 + i * 9; ctx.strokeStyle = i % 2 ? 'rgba(0,0,0,.5)' : 'rgba(120,96,160,.45)'; ctx.beginPath(); ctx.moveTo(x * .7, cy + 22); ctx.quadraticCurveTo(x, cy + 50, x * 1.12 + sw * .8, -6); ctx.stroke(); }
    } });
    smokeLobe(cx + 1, cy + 34, 11, '#0E0812', 1); // the dark under its chin
    // the mask itself
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.sin(t * .5) * .04 + (down ? .3 : 0) - X.o * .06);
    const fx = 3;
    cel(PB([-20, -34, 0, -40, 18, -36, 27, -16, 26, 6, 20, 24, 8, 36, -6, 36, -18, 24, -26, 4, -26, -18]), MK.glaze, { d: 4.5, r: 1.6, w: 2.3, dark: MK.glazeDk, lite: MK.glazeLit, under: () => {
      const g = ctx.createLinearGradient(-26, 0, 26, 0); g.addColorStop(0, 'rgba(90,100,140,.32)'); g.addColorStop(.6, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(-30, -42, 60, 82);
    }, tex: () => {
      for (const [x, y] of [[-11, 10], [fx + 14, 10]]) { const g = ctx.createRadialGradient(x, y, 0, x, y, 9); g.addColorStop(0, 'rgba(210,100,100,.32)'); g.addColorStop(1, 'rgba(210,100,100,0)'); ctx.fillStyle = g; ctx.fillRect(x - 9, y - 9, 18, 18); } // rouge
      ctx.strokeStyle = 'rgba(120,110,95,.32)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(-22, -20); ctx.lineTo(-14, -16); ctx.lineTo(-16, -8); ctx.moveTo(14, -32); ctx.lineTo(18, -24); ctx.lineTo(24, -22); ctx.moveTo(-8, 30); ctx.lineTo(-2, 26); ctx.lineTo(4, 31); ctx.stroke(); // the glaze crazed with age
    } });
    // seams of gold where it was broken and mended
    ctx.beginPath(); ctx.moveTo(6, -39); ctx.lineTo(2, -30); ctx.lineTo(8, -22); ctx.lineTo(3, -14); ctx.moveTo(-25, 4); ctx.lineTo(-17, 11); ctx.lineTo(-15, 21); ctx.lineTo(-7, 27); ctx.moveTo(27, -9); ctx.lineTo(21, -5); ctx.lineTo(23, 2);
    ctx.strokeStyle = C(MK.giltDk); ctx.lineWidth = 2.4; ctx.stroke(); if (DET()) { ctx.strokeStyle = MK.goldLit; ctx.lineWidth = 1; ctx.stroke(); }
    fillPoly([fx, -30, fx + 3, -26, fx, -22, fx - 3, -26], MK.gold, .8); // a lozenge of gold on the brow
    const eye = (x, y, d, sx) => { // d: which way the outer corner lies; grief lifts the inner corners, wrath drags them down, laughter narrows them to crescents
      const ix = x - d * 7 * sx, ox = x + d * 7.5 * sx, iy = y - X.b * (X.b > 0 ? 3 : 2.5), oy = y + X.b * 1.2, up = y - 5.5 + Math.max(0, -X.b) * 2.2, lo = y + 4 - Math.max(0, X.s) * 4;
      ctx.beginPath(); ctx.moveTo(ix, iy); ctx.quadraticCurveTo(x, up, ox, oy); ctx.quadraticCurveTo(x, lo, ix, iy); ctx.closePath(); ctx.fillStyle = C(MK.hole); ctx.fill(); outline(1.3);
      if (!a.hurt && DET()) { const ey = (up + lo) / 2 + .8, eh = Math.max(.5, Math.min(1.9, (lo - up) * .28)); ctx.fillStyle = fierce ? '#FFF0A8' : TY.eye; ell(x + 1, ey, 2.4 * sx, eh); ctx.fill(); ctx.fillStyle = '#1A0606'; ell(x + 1.5, ey, .5, eh * .8); ctx.fill(); glowAt(x + 1, ey, 9, SULF, fierce ? .6 : .32); }
      ctx.strokeStyle = C(MK.umber); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(ix - d, iy - 5 - Math.max(0, X.b) * 1.5); ctx.quadraticCurveTo(x, up - 4 - Math.max(0, X.b) * 1.5 + Math.max(0, -X.b) * 2.4, ox + d * 1.5, oy - 4.5 + Math.max(0, -X.b) * .5); ctx.stroke(); // the painted brow
    };
    eye(fx - 10, -6, -1, .85); eye(fx + 11, -6, 1, 1);
    ctx.strokeStyle = C(MK.glazeDk); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(fx + 2, -4); ctx.quadraticCurveTo(fx + 6, 6, fx + 3, 11); ctx.lineTo(fx - 1, 12); ctx.stroke(); // the nose
    if (DET()) { ctx.strokeStyle = MK.glazeLit; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(fx + 3.5, -3); ctx.quadraticCurveTo(fx + 7, 5, fx + 4.6, 9.5); ctx.stroke(); }
    if (DET() && X.b > .5 && X.s < -.2) { const k = (X.b - .5) * 2 * Math.min(1, -X.s * 2); ctx.strokeStyle = `rgba(60,30,70,${.6 * k})`; ctx.lineWidth = 1.4; ctx.beginPath(); for (const x of [fx - 10, fx + 11]) { ctx.moveTo(x, -1); ctx.quadraticCurveTo(x - 2, 8, x + 1, 18); } ctx.stroke(); } // tears painted down the cheeks
    if (X.s > .4) { ctx.strokeStyle = C(MK.umber); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(fx - 9, 10); ctx.quadraticCurveTo(fx - 14, 16, fx - 11, 22); ctx.moveTo(fx + 12, 10); ctx.quadraticCurveTo(fx + 17, 16, fx + 14, 22); ctx.stroke(); } // laughter lines
    // the mouth: a hole in the porcelain, bent by its mood
    const mx = fx + 1, my = 21, mw = 9 + Math.max(0, X.s) * 3, cyc = my - X.s * 5, op = 1 + X.o * 12, top = my - 2 - X.o * 3 + X.s * 1.5;
    ctx.beginPath(); ctx.moveTo(mx - mw, cyc); ctx.quadraticCurveTo(mx, top, mx + mw, cyc); ctx.quadraticCurveTo(mx, my + op + X.s * 3, mx - mw, cyc); ctx.closePath(); ctx.fillStyle = C(TY.maw); ctx.fill(); outline(1.4);
    if (X.o > .3) { const mid = (cyc + top) / 2; ctx.fillStyle = C(MK.glazeLit); for (let i = -2; i <= 2; i++) { const x = mx + i * mw * .3, y = lerp(mid, cyc, (Math.abs(i) / 2.8) ** 2) + .4, L = 2 + X.o * 1.6; poly([x - 1.3, y, x, y + L, x + 1.3, y]); ctx.fill(); } glowAt(mx, my + op * .5, 12 + X.o * 8, EMBER, .25 + X.o * .4); }
    if (DET()) { ctx.strokeStyle = 'rgba(150,40,40,.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(mx - mw + 1, cyc - 1); ctx.quadraticCurveTo(mx, top - 2, mx + mw - 1, cyc - 1); ctx.stroke(); } // the painted lip
    ctx.restore();
    if (!live) maskHand(48, -30 - bob, -1.25, .35, 1, false);
    ctx.restore();
  }
  // ---------------------------------------------------------------- the Drake of the Courts
  // a beast out of a bestiary of Chaos, a wyvern crossed with a herald's eagle: wings of black membrane strung on
  // finger-spars, their outer half a fan of great pinions dipped in ember; a long neck maned with burning plumes; a
  // hooked beak of gilt horn with fangs in the jaw beneath; eagle-feathered thighs over scaled shanks and pale talons;
  // a long tail ending in a barb like a heraldic dart
  const DR = { hide: '#24143A', hideDk: '#0C0616', hideLit: '#6A4890', mem: '#2E1236', memDk: '#12060F', memLit: '#7E3C66', pin: '#1A0E28', pinLit: '#5A3A7A', ember: '#FF8A3C', gold: '#D8A040', goldDk: '#8A5A1C', goldLit: '#F8DC90', beak: '#E2BA62', claw: '#E8DCC0' };
  // a tapered strip (neck, tail) as a path usable with cel
  const stripPath = (s) => (ox, oy, cont) => { if (!cont) ctx.beginPath(); ctx.moveTo(s.L[0] + ox, s.L[1] + oy); for (let i = 2; i < s.L.length; i += 2) ctx.lineTo(s.L[i] + ox, s.L[i + 1] + oy); for (let i = s.R.length - 2; i >= 0; i -= 2) ctx.lineTo(s.R[i] + ox, s.R[i + 1] + oy); ctx.closePath(); };
  // one great flight feather, from its quill root at the origin out along +x: a dark vane, a gilt quill down it, its end dipped in ember
  function pinion(x, y, ang, L, w, far, tip = DR.ember) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    cel(PB([0, -w * .3, L * .45, -w, L * .9, -w * .7, L * 1.04, 0, L * .7, w * .55, L * .2, w * .5]), far ? '#120A1C' : DR.pin, { d: w * .3, r: w * .12, w: 1.1, dark: '#07040C', lite: far ? '#3A2650' : DR.pinLit, tex: () => {
      ctx.fillStyle = far ? '#8A3A1C' : tip; ctx.fillRect(L * .74, -w * 1.2, L * .4, w * 2.4); // the ember tip
      ctx.strokeStyle = 'rgba(0,0,0,.42)'; ctx.lineWidth = .6; ctx.beginPath(); for (let i = 1; i < 5; i++) { const u = i / 5 * L; ctx.moveTo(u, 0); ctx.lineTo(u + L * .08, -w * .8); ctx.moveTo(u, 0); ctx.lineTo(u + L * .08, w * .5); } ctx.stroke(); // the barbs of the vane
    } });
    if (L > 22) { ctx.strokeStyle = C(far ? '#6A5A48' : DR.gold); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(L * .5, -w * .15, L * .9, 0); ctx.stroke(); } // the quill, on the great feathers
    ctx.restore();
  }
  // a wing, from the shoulder at the origin, rising up and back. beat (-1 down .. 1 raised) is the stroke, seen side-on;
  // fold (0..1) sweeps it back along the body for a dive
  function drakeWing(far, beat, fold, hot) {
    ctx.save(); ctx.rotate(-fold * .95); ctx.scale(1 - fold * .2, (.3 + .7 * beat) * (1 - fold * .35));
    const E = [-16, -28], W = [-4, -60], F = [[-62, -46], [-72, -14], [-52, 10]]; // elbow, wrist, the tips of the finger-spars
    // the primaries fan out from the wrist, up and back: the feathered half
    for (let i = 6; i >= 0; i--) pinion(W[0] - 1, W[1] + 2 + i * 1.6, -1.85 - i * .19, 50 - Math.abs(i - 2) * 3.4, 6.6, far, hot && !far ? DR.goldLit : DR.ember);
    // the membrane strung between the spars and back to the flank: the wyvern half, its trailing edge scalloped
    const tips = [W, ...F, [-16, 8]], mem = (ox, oy, cont) => { if (!cont) ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(E[0] + ox, E[1] + oy); ctx.lineTo(W[0] + ox, W[1] + oy);
      for (let i = 1; i < tips.length; i++) { const p = tips[i - 1], q = tips[i], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; ctx.quadraticCurveTo(mx + (-18 - mx) * .32 + ox, my + (-24 - my) * .32 + oy, q[0] + ox, q[1] + oy); }
      ctx.closePath(); };
    cel(mem, far ? '#1C0A20' : DR.mem, { d: 3.2, r: 1.3, w: 1.6, dark: DR.memDk, lite: far ? '#4A2440' : DR.memLit, tex: () => {
      ctx.strokeStyle = 'rgba(255,138,60,.32)'; ctx.lineWidth = .8; ctx.beginPath(); // veins of ember running out to the edge
      for (let i = 0; i < 4; i++) { const p = tips[i], q = tips[i + 1], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; ctx.moveTo(W[0] * .6 + E[0] * .4, W[1] * .6 + E[1] * .4); ctx.quadraticCurveTo(mx * .6 - 6, my * .6 - 12, mx + (-18 - mx) * .3, my + (-24 - my) * .3); } ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (const f of F) { ctx.moveTo(W[0] - 2, W[1] + 3); ctx.lineTo(f[0] + 2, f[1] + 2); } ctx.stroke(); // the shadow under each spar
    } });
    // the arm and its finger-spars, with a hooked claw of gold at the wrist
    seg(0, 0, E[0], E[1], 10, 7, far ? '#140A1E' : DR.hide, 1); seg(E[0], E[1], W[0], W[1], 7, 5, far ? '#140A1E' : DR.hide, .5);
    for (const f of F) horn(W[0], W[1], (W[0] + f[0]) / 2 - 3, (W[1] + f[1]) / 2 - 4, f[0], f[1], 3.6, .8, far ? '#1E1228' : '#3A2452', 1, '#120A1A');
    horn(W[0], W[1], W[0] + 3, W[1] - 6, W[0] + 9, W[1] - 7, 3.4, .3, far ? '#8A6A3A' : DR.gold, .9, DR.goldDk);
    // the coverts along the arm, small feathers edged with gold
    if (!far) for (let i = 0; i < 5; i++) { const u = .15 + i * .2, x = lerp(E[0], W[0], u), y = lerp(E[1], W[1], u); pinion(x + 2, y, -2.75 + i * .06, 15, 4.8, false, DR.gold); }
    ctx.restore();
  }
  function tyDrake(e, a, t) {
    const st = e.state, plan = e.plan, wind = a.wind || 0, act = st === 'w4act' ? e.w4a : null, down = st === 'down';
    const W = (p) => (st === 'wind' && plan === p) ? wind : 0, pose = e.w4pose || {};
    const swoop = act === 'swoop' && e.w4dash, swoopW = W('w4swoop'), flameW = W('w4flame'), flaming = act === 'flame', gustW = W('w4gust');
    const howl = Math.max(W('w4howl'), act === 'howl' ? 1 : 0), maw = Math.max(W('w4maw'), act === 'maw' ? 1 : 0);
    const hot = flameW > .3 || flaming || maw > .3 || howl > .3;
    // the wings beat slowly and heavily at rest; it mantles them high to wind up, and the attacks drive the stroke themselves
    let beat = pose.beat ?? (.5 + .45 * Math.sin(t * 1.15));
    beat = lerp(beat, 1, Math.max(flameW, gustW, swoopW * .8, howl * .6, maw * .5));
    if (down) beat = -.5;
    const fold = swoop ? 1 : 0, rear = Math.max(flameW, howl * .8, gustW * .6), lunge = flaming ? 1 : maw;
    const pitch = swoop ? .34 : flaming ? .16 : -.14 * Math.max(flameW, gustW) + (down ? .12 : 0);
    const B = (down ? 16 : 0) + Math.sin(t * 1.15 - .9) * 1.6 * (1 - fold); // the body lifts a little on each downstroke
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.translate(0, B);
    if (pitch) { ctx.translate(0, -44); ctx.rotate(pitch); ctx.translate(0, 44); }
    const SH = [2, -56]; // the shoulder
    ctx.save(); ctx.translate(SH[0] - 9, SH[1] + 1); ctx.rotate(.24); drakeWing(true, beat, fold, hot); ctx.restore();
    // the tail: long, swinging slowly, scaled in bands, a row of spines down it and a barb at the end
    const sw = Math.sin(t * .8) * 5, tl = swoop ? -10 : down ? 14 : 0;
    const tp = taper(-20, -40, -62, -22 + sw + tl, -106, -42 + sw * 1.7 + tl * .6, 15, 2.8, 12);
    for (let i = 2; i < 11; i += 2) { const k = i * 2, x = tp.L[k], y = tp.L[k + 1], s = 1 - i / 13; horn(x, y + 1, x - 3, y - 6 * s, x - 7, y - 8 * s, 4.6 * s + 1, .3, '#1E1230', .9, '#0A0610'); }
    cel(stripPath(tp), DR.hide, { d: 2.6, r: 1, w: 1.7, dark: DR.hideDk, lite: DR.hideLit, tex: () => {
      ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = .8; ctx.beginPath(); for (let k = 2; k < tp.L.length - 2; k += 2) { ctx.moveTo(tp.L[k], tp.L[k + 1]); ctx.quadraticCurveTo(tp.M[k] + 2, tp.M[k + 1], tp.R[k], tp.R[k + 1]); } ctx.stroke(); // the bands of scale
      ctx.strokeStyle = 'rgba(216,160,64,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tp.R[2], tp.R[3] - 1); for (let k = 4; k < tp.R.length - 4; k += 2) ctx.lineTo(tp.R[k], tp.R[k + 1] - 1); ctx.stroke(); // the gilt edge of the belly-scales
    } });
    { const n = tp.M.length, x = tp.M[n - 2], y = tp.M[n - 1], dx = x - tp.M[n - 4], dy = y - tp.M[n - 3], d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, nx = -uy, ny = ux;
      fillPoly([x - ux * 2, y - uy * 2, x + ux * 6 + nx * 7, y + uy * 6 + ny * 7, x + ux * 18, y + uy * 18, x + ux * 6 - nx * 7, y + uy * 6 - ny * 7], DR.gold, 1.2); // the barb, a heraldic dart of gold
      detPoly([x + ux * 6, y + uy * 6, x + ux * 18, y + uy * 18, x + ux * 6 - nx * 7, y + uy * 6 - ny * 7], DR.goldDk, .8); }
    // the legs, eagle-feathered at the thigh, scaled below; they hang at rest and are thrown forward for the strike
    const leg = (far) => {
      const hx = far ? -12 : -3, hy = -34, s = Math.sin(t * 1.0 + (far ? 1.4 : 0)) * 2, strike = swoop || swoopW > .5 ? 1 : 0, col = far ? '#140A1E' : DR.hide;
      let K = [hx + 5 + s, -17], A = [hx + 2 + s * 1.5, -6];
      if (strike) { K = [hx + 14, -24]; A = [hx + 30, -18]; }
      if (down) { K = [hx + 9, -20]; A = [hx + 14, -10]; }
      seg(K[0], K[1], A[0], A[1], 5.6, 4, col, 0); // the scaled shank
      ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = .7; if (DET()) { ctx.beginPath(); for (let i = 1; i < 4; i++) { const x = lerp(K[0], A[0], i / 4), y = lerp(K[1], A[1], i / 4); ctx.moveTo(x - 2.4, y); ctx.lineTo(x + 2.4, y + .6); } ctx.stroke(); }
      const cc = far ? '#9A8C72' : DR.claw; // the talons: three forward, one behind, hooked; they open for the strike
      for (let c = 0; c < 3; c++) { const g = .5 + c * .42 - strike * .75, x1 = A[0] + Math.cos(g) * 6, y1 = A[1] + Math.sin(g) * 6; seg(A[0], A[1], x1, y1, 3.4, 2.6, col, 0); horn(x1, y1, x1 + Math.cos(g) * 3, y1 + Math.sin(g) * 3, x1 + Math.cos(g + 1) * 5, y1 + Math.sin(g + 1) * 5, 2.6, .3, cc, .8); }
      horn(A[0] - 1, A[1], A[0] - 5, A[1] + 1, A[0] - 6, A[1] + 5 - strike * 3, 2.6, .3, cc, .8);
      cel(furPath([hx - 10, hy - 6, hx + 9, hy - 6, K[0] + 6, K[1] - 3, K[0] + 2, K[1] + 3, K[0] - 6, K[1] + 1, hx - 12, hy + 8], 3.2, far ? 7 : 3), far ? '#120A1C' : DR.pin, { d: 2.4, r: 1, w: 1.4, dark: '#06030A', lite: DR.pinLit, tex: () => { // the feathered thigh
        ctx.strokeStyle = 'rgba(216,160,64,.4)'; ctx.lineWidth = .7; ctx.beginPath(); for (let i = 0; i < 3; i++) { const y = hy + 2 + i * 5, x = lerp(hx, K[0], i / 3); ctx.moveTo(x - 6, y); ctx.quadraticCurveTo(x, y + 3, x + 6, y); } ctx.stroke(); } });
    };
    leg(true);
    // the body: a deep keel of a breast, eagle-feathered and diapered with gold like a herald's eagle, the back scaled
    const body = PB([22, -52, 23, -38, 12, -27, -4, -25, -20, -30, -30, -40, -24, -52, -8, -60, 10, -62]);
    cel(body, DR.hide, { d: 4.6, r: 1.8, w: 2.1, dark: DR.hideDk, lite: DR.hideLit, under: () => {
      const g = ctx.createRadialGradient(8, -42, 2, 8, -42, 30); g.addColorStop(0, `rgba(${BRUISE},.45)`); g.addColorStop(1, `rgba(${BRUISE},0)`); ctx.fillStyle = g; ctx.fillRect(-30, -72, 60, 50);
    }, tex: () => {
      for (let r = 0; r < 5; r++) for (let i = 0; i < 3; i++) { const x = 18 - i * 6 - r * 1.6, y = -52 + r * 5.4 + i * 1.4; // the breast-feathers, scalloped rows
        ctx.fillStyle = r % 2 ? '#34204C' : '#2C1A42'; ctx.beginPath(); ctx.arc(x, y, 3.6, 0, Math.PI); ctx.fill(); ctx.strokeStyle = 'rgba(216,160,64,.62)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.arc(x, y, 3.6, .2, Math.PI - .2); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = .8; ctx.beginPath(); for (let i = 0; i < 12; i++) { const x = -24 + (i * 23) % 26, y = -54 + (i * 11) % 20; ctx.moveTo(x - 3, y); ctx.quadraticCurveTo(x, y + 2.6, x + 3, y); } ctx.stroke(); // the scales of the back
    } });
    cracks([[-14, -32, -6, -29, 2, -30], [-22, -38, -18, -34]], .55); // the fire inside, showing through the belly
    leg(false);
    // the neck: long, curved like a swan's, maned with plumes of ember down the back of it
    const H = [44 + lunge * 10 - rear * 6, -90 + lunge * 22 - rear * 8 + Math.sin(t * .7) * 1.4 + (down ? 22 : 0) + (swoop ? 20 : 0)];
    if (swoop) H[0] += 12;
    const nk = taper(14, -52, 40 - rear * 4 + (swoop ? 10 : 0), -60 + lunge * 6, H[0] - 4, H[1] + 5, 19, 9, 10);
    for (let i = 10; i >= 2; i -= 2) { const k = i * 2; pinion(nk.R[k] + 1, nk.R[k + 1], 2.5 + i * .05 + Math.sin(t * .9 + i) * .05, 12 + i * .6, 4.4, false, DR.ember); }
    cel(stripPath(nk), DR.hide, { d: 3, r: 1.3, w: 1.8, dark: DR.hideDk, lite: DR.hideLit, tex: () => {
      ctx.strokeStyle = 'rgba(216,160,64,.55)'; ctx.lineWidth = .9; ctx.beginPath(); for (let k = 4; k < nk.L.length - 2; k += 4) { ctx.moveTo(nk.L[k], nk.L[k + 1]); ctx.lineTo(nk.M[k] * .5 + nk.L[k] * .5, nk.M[k + 1] * .5 + nk.L[k + 1] * .5 - 1); } ctx.stroke(); // the plates of the throat
    } });
    if (hot) glowAt(nk.L[10], nk.L[11], 16, EMBER, .25 + .35 * Math.max(flameW, flaming ? 1 : 0)); // the throat kindling
    // the head: crested, with a hooked beak of gilt horn and fangs in the jaw below
    const hr = .12 + lunge * .45 - rear * .35 - howl * .25 + (down ? .5 : 0) + (swoop ? .3 : 0), open = Math.max(maw * .9, howl * .8, flaming ? .85 : flameW * .3, a.atk ? .5 : 0, swoop ? .35 : 0, .05 + Math.sin(t * .9) * .03);
    ctx.save(); ctx.translate(H[0], H[1]); ctx.rotate(hr);
    for (let i = 0; i < 5; i++) pinion(-4, -3 + i * .8, -2.05 - i * .24 + Math.sin(t * .8 + i) * .03, 15 + (i === 1 ? 6 : i * 1.5), 3.2, false, DR.ember); // the crest, a fan of plumes
    horn(-3, -6, -12, -12, -22, -10, 5, .4, '#1A1024', 1.1, '#08040C'); horn(0, -7, -8, -16, -16, -20, 4.4, .4, DR.gold, 1.1, DR.goldDk); // two horns swept back
    ctx.save(); ctx.translate(2, 3); ctx.rotate(open * .7); // the lower jaw, fanged
    cel(PB([-6, -1, 18, 0, 22, 2, 14, 6, -4, 5]), '#1A0E26', { d: 1.6, r: .7, w: 1.4, lite: DR.hideLit });
    ctx.fillStyle = C(TY.bone); for (let x = 6; x <= 16; x += 3.4) { poly([x, 0, x + 1, -3.4 - (x > 14 ? 1.6 : 0), x + 2, 0]); ctx.fill(); outline(.5); }
    if (open > .4) { ctx.strokeStyle = C(DR.ember); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(2, 1); ctx.quadraticCurveTo(14, -1, 22, 2 + open * 3); ctx.stroke(); fillPoly([22, 2 + open * 3 - 2.6, 27, 3 + open * 3, 22, 2 + open * 3 + 2.6, 23.4, 2 + open * 3], DR.ember, .6); } // the tongue, barbed like a dart
    ctx.restore();
    if (open > .15) { ctx.fillStyle = C(TY.maw); poly([-2, 2, 18, 0, 16, 4 + open * 14, 0, 7]); ctx.fill(); glowAt(8, 4 + open * 5, 14, EMBER, .25 + open * .45); }
    cel(PB([-9, -5, 1, -10, 12, -9, 17, -3, 15, 4, 3, 6, -7, 4]), DR.hide, { d: 2.4, r: 1, w: 1.7, dark: DR.hideDk, lite: DR.hideLit });
    horn(11, -7, 24, -9, 29, 4, 10, .5, DR.beak, 1.3, DR.goldDk); // the beak, hooked
    ctx.fillStyle = C(TY.bone); for (const x of [9, 12.4]) { poly([x, 3, x + 1, 7, x + 2, 3]); ctx.fill(); outline(.5); } // fangs at the root of the beak
    if (DET()) { ctx.strokeStyle = 'rgba(120,70,20,.7)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(12, -6); ctx.quadraticCurveTo(15, -1, 13, 3); ctx.stroke(); } // the cere
    if (a.hurt) { ctx.strokeStyle = C('#FFE8A0'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(2, -3.4); ctx.lineTo(8, -4); ctx.stroke(); }
    else emberEye(5, -3.6, 1.1, hot || wind > .4 ? '#FFF0A8' : TY.eye, SULF, hot);
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-1, -7.6); ctx.quadraticCurveTo(5, -9.4, 10, -6.4); ctx.stroke(); // the brow, drawn down over the eye
    ctx.restore();
    ctx.save(); ctx.translate(SH[0], SH[1]); drakeWing(false, beat, fold, hot); ctx.restore();
    if (swoop) add(() => { ctx.strokeStyle = 'rgba(255,150,80,.35)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 5; i++) { const y = -70 + i * 11; ctx.moveTo(-40 - i * 4, y); ctx.lineTo(-90 - i * 8, y - 6); } ctx.stroke(); }); // the air torn behind it
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
  const FORMS = { 1: tyWolf, 2: tyDrake, 3: tyMask };
  CREATURES.tyiga = function (e, a) { // (w4vis: it can leave sight, as in the Hunting Leap)
    const v = e.w4vis ?? 1; if (v <= .02) return; if (v < 1) { ctx.save(); ctx.globalAlpha *= v; const sv = e.w4vis; e.w4vis = 1; CREATURES.tyiga(e, a); e.w4vis = sv; ctx.restore(); return; }
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
  Object.assign(BOSS_WIND, { w4rake: 1.1, w4howl: .95, w4clap: 1.05, w4faces: 1.0, w4swoop: 1.05, w4flame: 1.0, w4gust: .95, w4maw: 1.1 });
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
      ctx.save(); ctx.translate(g.x, g.y - (g.form === 2 ? 30 : g.form === 3 ? 16 : 0)); ctx.scale(h.dir * .62, .62); ctx.globalAlpha = .55; ctx.globalCompositeOperation = 'lighter'; TINT = '#7A58C0';
      FORMS[g.form]({ state: 'idle', phase: g.form, walk: 0 }, { walk: t * 14, t }, t); TINT = null; ctx.restore(); })]); },
    box(h, box) { for (const g of h.lanes) box(g.x, g.y, 0, 100, 140); },
  });
  // ---------------- the Mask's hands: they drift free of it, and wherever they are the world draws them in depth ----------------
  const pinHand = (h, x, y, z, rot, curl, side) => Object.assign(h, { x, y, z, rot, curl, side, flip: 1, pin: 2 });
  function handGoals(e, t) { // where its hands want to be, in the world, for what it is doing
    const s = e.size, f = e.facing, st = e.state, plan = e.plan, act = st === 'w4act' ? e.w4a : null, bob = Math.sin(t * .9) * 2 * s;
    const home = [{ x: e.x + f * 48 * s, y: e.y + 3, z: e.z + 30 * s + bob, rot: -1.25, curl: .35, side: f }, { x: e.x - f * 74 * s, y: e.y - 3, z: e.z + 24 * s + bob, rot: -2.1, curl: .35, side: f }];
    if (st === 'down') return [{ x: e.x + f * 50 * s, y: e.y + 4, z: 3, rot: .15, curl: .8, side: f }, { x: e.x - f * 46 * s, y: e.y - 4, z: 3, rot: .1, curl: .7, side: -f }];
    if (act === 'clap' && e.w4H) return e.w4H.map(h => Object.assign({}, h)); // held where the clap has them
    if (st === 'wind' && plan === 'w4clap') { const T = clapT(e), w = 1 - e.t / e.windMax;
      return [{ x: T.cx - T.W, y: T.y + 1, z: lerp(30, 6, w), rot: -.15, curl: .12, side: 1 }, { x: T.cx + T.W, y: T.y - 1, z: lerp(30, 6, w), rot: -.15, curl: .12, side: -1 }]; }
    if ((st === 'wind' && plan === 'w4faces') || act === 'faces') { const up = act === 'faces' ? 1.3 : 1; // lifted, palms up, offering the faces to the sky
      return [{ x: e.x + f * 34 * s * up, y: e.y + 3, z: e.z + 96 * s, rot: -1.9 + (up - 1), curl: .15, side: f }, { x: e.x - f * 30 * s * up, y: e.y - 3, z: e.z + 100 * s, rot: -1.3 - (up - 1), curl: .15, side: f }]; }
    if ((st === 'wind' && plan === 'w4howl') || act === 'howl') return [{ x: e.x + f * 74 * s, y: e.y + 3, z: e.z + 64 * s, rot: -.9, curl: .75, side: f }, { x: e.x - f * 70 * s, y: e.y - 3, z: e.z + 70 * s, rot: -2.3, curl: .75, side: f }];
    if ((st === 'wind' && plan === 'w4maw') || act === 'maw') return [{ x: e.x + f * 58 * s, y: e.y + 3, z: 30, rot: 1.2, curl: .55, side: f }, { x: e.x - f * 54 * s, y: e.y - 3, z: 30, rot: 1.9, curl: .55, side: f }];
    return home;
  }
  function handsUpdate(e, dt, t) {
    const G = handGoals(e, t);
    if (!e.w4H) e.w4H = G.map(g => Object.assign({ pin: 0, flip: 1 }, g));
    const k = Math.min(1, dt * (e.state === 'wind' && e.plan === 'w4clap' ? 6 : 4)), kr = Math.min(1, dt * 6);
    e.w4H.forEach((h, i) => { if (h.pin > 0) { h.pin--; return; } const g = G[i];
      h.x += (g.x - h.x) * k; h.y += (g.y - h.y) * k; h.z += (g.z - h.z) * k; h.rot += (g.rot - h.rot) * kr; h.curl += (g.curl - h.curl) * kr; h.side = g.side; h.flip = 1; });
  }
  function handsList(e, list) {
    if (!e.w4hl || !e.w4H) return; const s = e.size;
    e.w4H.forEach((h, i) => list.push([h.y + (i ? -.5 : .5), () => {
      shadow(h.x, h.y, 16 * s * (1 - Math.min(.7, h.z / 160)));
      ctx.save(); ctx.translate(h.x, h.y - h.z); ctx.scale(h.side * s, s); FLASH = e.flash > 0; maskHand(0, 0, h.rot, h.curl, 1, i === 1, h.flip); FLASH = false; ctx.restore();
    }]));
  }
  // THE GATHERING HANDS (mask): its hands fly out to either side of you, low over the floor, and sweep together in a clap.
  // Step out of the band they sweep along, or jump them as they pass
  const clapT = (e) => targets(e, () => { const W = 150; return { cx: clamp(P.x, leftWall() + 10 + W, rightWall() - 10 - W), y: yClamp(P.y), W }; });
  function handprint(x, y, d, k) { // the shape of an open hand laid on the floor, its fingers toward the middle
    ctx.fillStyle = `rgba(120,20,30,${.25 + .35 * k})`; ell(x, y, 11, 5); ctx.fill();
    for (let i = 0; i < 4; i++) { ell(x + d * 15, y - 4.2 + i * 2.8, 6, 1.3, 0); ctx.fill(); }
    ell(x + d * 5, y - 6, 4, 1.3, -d * .5); ctx.fill();
  }
  TELL_FX.w4clap = (e, t, k) => { const T = clapT(e), x0 = T.cx - T.W, x1 = T.cx + T.W, y = T.y, hh = 20; ctx.save();
    ctx.fillStyle = tellCol(k, .85); rrect(x0, y - hh, x1 - x0, hh * 2, hh); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 2; ctx.stroke();
    ctx.lineWidth = 2.2; for (const d of [1, -1]) for (let i = 0; i < 4; i++) { const q = cl01(k * 1.3 - i * .14), x = (d > 0 ? x0 + 46 : x1 - 46) + d * i * 24; // chevrons marching in from both ends
      ctx.strokeStyle = `rgba(255,170,150,${.15 + .7 * q})`; ctx.beginPath(); ctx.moveTo(x - d * 4, y - 9); ctx.lineTo(x + d * 4, y); ctx.lineTo(x - d * 4, y + 9); ctx.stroke(); }
    handprint(x0 + 14, y, 1, k); handprint(x1 - 14, y, -1, k);
    ctx.setLineDash([4, 4]); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(T.cx, y - hh - 4); ctx.lineTo(T.cx, y + hh + 4); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore(); };
  PLAN_FX.w4clap = (e) => {
    const T = clapT(e); e.w4T = null; sfx('whoosh');
    act(e, 'clap', (h, dt, e) => {
      const H = e.w4H, s = e.size, u = cl01(h.el / .3), q = u * u, reach = 36 * s; // the hands gather speed as they come
      const xl = lerp(T.cx - T.W, T.cx - reach + 4, q), xr = lerp(T.cx + T.W, T.cx + reach - 4, q);
      if (!h.clapped) {
        if (H) { pinHand(H[0], xl, T.y + 1, 6, -.15, .12, 1); pinHand(H[1], xr, T.y - 1, 6, -.15, .12, -1); }
        if (!h.hit && P.z < 30 && Math.abs(P.y - T.y) < 22 && ((P.x > xl - 10 && P.x < xl + reach) || (P.x < xr + 10 && P.x > xr - reach))) { h.hit = true; hitP(Math.round(edmg(e) * 1.1), P.x < T.cx ? xl : xr, true); }
        if (Math.random() < .7) { dust(xl, T.y, 1); dust(xr, T.y, 1); }
        if (u >= 1) { h.clapped = true; sfx('slam'); shakeMag = Math.max(shakeMag, 9); hitstop = Math.max(hitstop, .05);
          burst(T.cx, T.y, 14, ['#ECE4D2', '#F6DC92', '#FFFFFF'], 16, 'spark', 0, true); fx.push({ kind: 'ring', x: T.cx, y: T.y, z: 4, t: .4, max: .4, r: 70, col: '#F6DC92', flat: 1 });
          if (!h.hit && inEll(P.x, P.y, T.cx, T.y, 40) && P.z < 40) { h.hit = true; hitP(Math.round(edmg(e) * 1.1), T.cx, true); } }
      } else if (H) { const c = sm(cl01((h.el - .3) / .14)); // and fold together, palm to palm, as if in prayer
        pinHand(H[0], T.cx - reach * (1 - c * .55), T.y + 1, 6 + c * 8, -.15 - c * 1.25, .12, 1); pinHand(H[1], T.cx + reach * (1 - c * .55), T.y - 1, 6 + c * 8, -.15 - c * 1.25, .12, -1); }
      if (h.el > .8) { recover(e, 1.0); return true; } // its hands are far from it now: your opening
      return false;
    });
  };
  // A THOUSAND FACES (mask): the faces round its aureole fall from the sky in a grid of marks about you, laughing and
  // weeping ones checkered. Its own face tells which fall first; the rest fall a moment later. Stand where the first
  // have already broken, on a mark of the other kind until they fall, or step clear of the grid altogether
  const FACE_DX = 80, FACE_DY = 30;
  const facesT = (e) => targets(e, () => {
    const cx = clamp(P.x, leftWall() + 34 + FACE_DX, rightWall() - 34 - FACE_DX), cy = clamp(P.y, FLOOR_TOP + 12 + FACE_DY, FLOOR_BOT - 14 - FACE_DY), m = [];
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) m.push({ x: cx + i * FACE_DX, y: cy + j * FACE_DY, kind: (i + j + 2) % 2 === 0 ? 1 : -1 });
    return { m, first: Math.random() < .5 ? 1 : -1 };
  });
  function faceSigil(x, y, kind, a) { // a face painted flat on the floor: a laughing one in gold, a weeping one in pale blue
    const c = kind > 0 ? `rgba(246,214,130,${a})` : `rgba(180,200,240,${a})`;
    ctx.save(); ctx.translate(x, y); ctx.scale(1, .34); ctx.strokeStyle = c; ctx.lineWidth = 2.2; circle(0, 0, 24); ctx.stroke();
    ctx.lineWidth = 3; ctx.beginPath(); for (const s of [-1, 1]) { ctx.moveTo(s * 13, -8 + kind * 3); ctx.lineTo(s * 5, -8 - kind * 3); }
    if (kind > 0) { ctx.moveTo(-12, 5); ctx.quadraticCurveTo(0, 18, 12, 5); } else { ctx.moveTo(-11, 14); ctx.quadraticCurveTo(0, 2, 11, 14); }
    ctx.stroke(); ctx.restore();
  }
  function faceMark(x, y, kind, k, n, armed) {
    ctx.fillStyle = armed ? tellCol(k) : 'rgba(20,10,28,.32)'; ell(x, y, 30, 10); ctx.fill();
    ctx.strokeStyle = armed ? tellLine(k) : 'rgba(220,200,170,.45)'; ctx.lineWidth = armed ? 2 : 1.2; ell(x, y, 30, 10); ctx.stroke();
    faceSigil(x, y, kind, armed ? .55 + .4 * k : .5);
    if (n) { ctx.fillStyle = armed ? `rgba(255,230,210,${.6 + .3 * k})` : 'rgba(220,200,170,.6)'; ctx.font = '700 9px Cinzel, Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText(String(n), x, y - 13); }
  }
  TELL_FX.w4faces = (e, t, k) => { const T = facesT(e), read = k > .42; ctx.save();
    for (const m of T.m) { const first = m.kind === T.first; faceMark(m.x, m.y, m.kind, read ? cl01((k - .42) / .58) : 0, read ? (first ? 1 : 2) : 0, read && first); }
    ctx.restore(); };
  PLAN_FX.w4faces = (e) => {
    const T = facesT(e); e.w4T = null; sfx('charge', 2); e.w4halo = 0; e.w4mood = T.first;
    for (let i = 0; i < 9; i++) parts.push({ x: e.x + rand(-40, 40) * e.size, y: e.y, z: e.z + rand(40, 120) * e.size, vx: rand(-30, 30), vy: 0, vz: rand(60, 140), life: .7, max: .7, col: pick(['#F6DC92', '#ECE4D2']), size: rand(1.6, 2.6), shape: 'star', rot: 0, vr: 2 }); // the faces tear loose from its aureole
    for (const m of T.m) { const wave = m.kind === T.first ? 0 : 1; hazards.push({ kind: 'w4face', x: m.x, y: m.y, face: m.kind, wave, wait: wave ? .82 : .06, fall: .42, el: 0, t: 9, max: 9, dmg: edmg(e), sp: rand(-1, 1) }); }
    act(e, 'faces', (h, dt, e) => { e.w4mood = h.el < .48 ? T.first : -T.first; if (h.el > 1.4) { recover(e, .9); return true; } return false; }); // and its face turns to the other mood
  };
  reg('w4face', {
    update(h, dt) { h.el += dt; const u = (h.el - h.wait) / h.fall;
      if (u >= 1 && !h.landed) { h.landed = true; h.brk = 0; sfx('crunch'); shakeMag = Math.max(shakeMag, 4); burst(h.x, h.y, 8, h.face > 0 ? ['#E6C676', '#F6DC92', '#FFFFFF'] : ['#ECE4D2', '#A69E90', '#FFFFFF'], 10, 'rock', 0);
        if (inEll(P.x, P.y, h.x, h.y, 32) && P.z < 40) hitP(h.dmg, h.x, true); }
      if (h.landed) { h.brk += dt; if (h.brk > .9) h.t = -1; } },
    draw(h, t) { const u = (h.el - h.wait) / h.fall;
      if (!h.landed) { const armed = h.wave === 0 || h.el > .48; faceMark(h.x, h.y, h.face, armed ? cl01(u + .5) : 0, h.wave + 1, armed);
        if (u > -.6) { ctx.fillStyle = `rgba(20,8,24,${.2 + .4 * cl01(u)})`; const r = 6 + 22 * cl01((u + .6) / 1.6); ell(h.x, h.y, r, r * .32); ctx.fill(); } return; } // its shadow, growing as it falls
      const f = 1 - cl01((h.brk - .5) / .4); ctx.save(); ctx.globalAlpha = f; // the broken halves, left lying on the floor
      for (const s of [-1, 1]) { ctx.save(); ctx.translate(h.x + s * (4 + h.brk * 10), h.y + 1); ctx.scale(1, .42); ctx.rotate(s * .5 + h.sp * .3);
        ctx.beginPath(); ctx.arc(0, 0, 15, s > 0 ? -Math.PI / 2 : Math.PI / 2, s > 0 ? Math.PI / 2 : Math.PI * 1.5); ctx.lineTo(s * 2, 6); ctx.lineTo(-s * 2, 0); ctx.closePath();
        ctx.fillStyle = C(h.face > 0 ? MK.gilt : MK.glaze); ctx.fill(); outline(1.4); ctx.fillStyle = C(MK.hole); ell(s * 6, -4, 3.4, 1.8); ctx.fill(); ctx.restore(); }
      ctx.restore(); },
    ups(h, list, t) { if (h.landed) return; const u = (h.el - h.wait) / h.fall; // the mask overhead: hanging, waiting, then falling face-down onto its mark
      const z = u < 0 ? 250 + Math.sin(t * 1.2 + h.sp * 3) * 4 : 250 * (1 - u * u);
      list.push([h.y, () => miniFace(h.x, h.y - z - 18, 16, h.face, h.sp * .3 + (u > 0 ? u * h.sp * .6 : 0))]); },
    box(h, box) { box(h.x, h.y, 0, 40, 290); },
  });
  // SWOOP (drake): it climbs, then dives, talons first, across the whole arena along the dark track on the floor, lowest where you stand
  const swoopT = (e) => targets(e, () => { const d = Math.sign(P.x - e.x) || 1, x0 = e.x, x1 = d > 0 ? rightWall() - 70 : leftWall() + 70; return { x0, y0: e.y, x1, px: clamp(P.x, Math.min(x0, x1) + 20, Math.max(x0, x1) - 20), py: yClamp(P.y), d }; });
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
  // EMBER BREATH (drake): it marks the lane you stand in and rears, its throat kindling; then it flies the length of the
  // lane breathing fire down onto it, the flames racing ahead of it along the floor. Step out of the lane before it comes
  const flameT = (e) => targets(e, () => { const d = Math.sign(P.x - e.x) || 1, l = laneOf(P.y), x1 = d > 0 ? rightWall() - 16 : leftWall() + 16; return { l, y: laneY(l), d, x0: clamp(e.x + d * 30, leftWall() + 16, rightWall() - 16), x1 }; });
  const FLAME_HW = () => laneH * .62; // how far either side of the lane's middle the fire reaches
  TELL_FX.w4flame = (e, t, k) => { const T = flameT(e), lo = Math.min(T.x0, T.x1), hi = Math.max(T.x0, T.x1), hw = FLAME_HW(); ctx.save();
    ctx.fillStyle = tellCol(k, .9); rrect(lo, T.y - hw, hi - lo, hw * 2, hw * .8); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.6; ctx.stroke();
    ctx.lineWidth = 2; for (let i = 0; i < 12; i++) { const q = cl01(k * 1.5 - i * .07), x = T.x0 + T.d * (24 + i * (hi - lo - 40) / 11); if (q <= 0) break; // chevrons running the way the fire will run
      ctx.strokeStyle = `rgba(255,170,90,${.2 + .7 * q})`; ctx.beginPath(); ctx.moveTo(x - T.d * 4, T.y - 6); ctx.lineTo(x + T.d * 3, T.y); ctx.lineTo(x - T.d * 4, T.y + 6); ctx.stroke(); }
    ctx.restore(); };
  PLAN_FX.w4flame = (e) => {
    const T = flameT(e); e.w4T = null; sfx('charge', 2);
    const cells = [], n = Math.max(2, Math.ceil(Math.abs(T.x1 - T.x0) / 16)); for (let i = 0; i <= n; i++) cells.push({ x: lerp(T.x0, T.x1, i / n), lit: -1 });
    const fire = { kind: 'w4fire', y: T.y, d: T.d, cells, front: T.x0, feeding: 1, el: 0, t: 9, max: 9, dmg: edmg(e), hit: false };
    hazards.push(fire);
    const x0 = e.x, y0 = e.y, z0 = e.z, D = 1.15;
    act(e, 'flame', (h, dt, e) => {
      const u = cl01(h.el / D), k = sm(cl01(h.el / .25)); e.facing = T.d; e.w4pose = { beat: .62 + .1 * Math.sin(h.el * 5) };
      fire.front = lerp(T.x0, T.x1, u); e.x = lerp(x0, fire.front - T.d * 92 * e.size, k); e.y = lerp(y0, T.y, k); e.z = lerp(z0, 70, k);
      if (h.el - (h.sfxT ?? -1) > .3) { h.sfxT = h.el; sfx('whoosh'); }
      if (u >= 1) { fire.feeding = 0; recover(e, 1.1); return true; } // spent, at the far end of the lane: your opening
      return false;
    }, { uy: T.y + 1 }).up = (h, t) => { // the gout of fire pouring from its jaws down onto the floor ahead of it
      const e = h.e, s = e.size, mx = e.x + T.d * 70 * s, my = e.y - e.z - 55 * s, fx = fire.front, fy = T.y, q = cl01(h.el / .12);
      const st = taper(mx, my, lerp(mx, fx, .55) + T.d * 6, lerp(my, fy, .4), lerp(mx, fx, q), lerp(my, fy, q), 5, 22, 9);
      trace(st.L, st.R); ctx.fillStyle = C('#E8602A'); ctx.globalAlpha = .9; ctx.fill(); ctx.globalAlpha = 1; outline(1.2);
      if (DET()) { const s2 = taper(mx, my, lerp(mx, fx, .55) + T.d * 6, lerp(my, fy, .4), lerp(mx, fx, q), lerp(my, fy, q), 2, 10, 9); trace(s2.L, s2.R); ctx.fillStyle = '#FFD27A'; ctx.fill(); }
      glowAt(fx, fy - 8, 40, EMBER, .55); glowAt(mx, my, 18, SULF, .5);
    };
  };
  function flameTongue(x, y, hgt, i, t) { // one tongue of fire standing on the floor: slow to sway, inked, a hot core
    if (hgt < 2) return; const sw = Math.sin(t * 2.2 + i * 1.7) * hgt * .12;
    horn(x - 3, y, x + sw - 2, y - hgt * .5, x + sw * 1.8, y - hgt, 16, .5, '#E8602A', 1, '#A83A1C');
    if (DET()) { const s = taper(x - 1, y, x + sw * .6, y - hgt * .4, x + sw * 1.2, y - hgt * .62, 5, .4, 5); trace(s.L, s.R); ctx.fillStyle = '#FFD27A'; ctx.fill(); }
  }
  reg('w4fire', {
    update(h, dt) { h.el += dt; let alive = h.feeding;
      for (const c of h.cells) { if (c.lit < 0 && (c.x - h.front) * h.d <= 0 && h.feeding) { c.lit = h.el; if (Math.random() < .3) burst(c.x, h.y, 2, ['#FF8A3C', '#FFD27A'], 3, 'spark', h.d); } if (c.lit >= 0 && h.el - c.lit < .9) alive = 1; }
      if (!h.hit && P.z < 30 && Math.abs(P.y - h.y) < FLAME_HW() + 4) for (const c of h.cells) if (c.lit >= 0 && h.el - c.lit < .4 && Math.abs(P.x - c.x) < 14) { h.hit = true; hitP(h.dmg, c.x - h.d * 10, true); break; }
      if (!alive) h.t = -1; },
    draw(h, t) { const hw = FLAME_HW(); ctx.save(); // the scorch it leaves on the floor
      for (const c of h.cells) if (c.lit >= 0) { const a = h.el - c.lit; ctx.fillStyle = `rgba(30,10,8,${.45 * (1 - cl01((a - .6) / .3))})`; ell(c.x, h.y, 12, hw * .7); ctx.fill(); }
      ctx.restore(); },
    ups(h, list, t) { list.push([h.y, () => { for (let i = 0; i < h.cells.length; i++) { const c = h.cells[i]; if (c.lit < 0) continue; const a = h.el - c.lit, k = a < .12 ? a / .12 : 1 - cl01((a - .3) / .5);
      flameTongue(c.x, h.y + (i % 2 ? 3 : -3), (22 + (i % 3) * 7) * k, i, t); } }]); },
    box(h, box) { box((h.cells[0].x + h.cells[h.cells.length - 1].x) / 2, h.y, 0, Math.abs(h.cells[0].x - h.cells[h.cells.length - 1].x) / 2 + 30, 70); },
  });
  // GALE OF PINIONS (drake): it mantles its wings and a line of its great burning quills drops point-down into the floor
  // behind you, one lane left open; then it beats down, twice, and the gale drives you back onto them. Run into the
  // wind to hold your ground, slip back through the open lane, or jump the quills as you are blown over them
  const gustT = (e) => targets(e, () => {
    const d = Math.sign(P.x - e.x) || 1, room = d > 0 ? rightWall() - 30 - P.x : P.x - leftWall() - 30, me = laneOf(P.y);
    return { d, x: P.x + d * clamp(room, 40, 130), gap: pick([0, 1, 2, 3].filter(l => l !== me)) };
  });
  const GUST = 160; // how hard the gale pushes: a walk is not enough to hold against it, a run is
  TELL_FX.w4gust = (e, t, k) => { const T = gustT(e); ctx.save();
    for (let l = 0; l < LANES; l++) { const y = laneY(l); if (l === T.gap) { ctx.strokeStyle = `rgba(230,220,200,${.3 + .4 * k})`; ctx.setLineDash([3, 4]); ctx.lineWidth = 1.4; ell(T.x, y, 14, laneH * .4); ctx.stroke(); ctx.setLineDash([]); continue; }
      ctx.fillStyle = tellCol(k); ell(T.x, y, 13, laneH * .42); ctx.fill(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.6; ctx.stroke();
      ctx.strokeStyle = `rgba(255,190,120,${.3 + .6 * k})`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(T.x, y); ctx.lineTo(T.x, y - 10 - 26 * k); ctx.stroke(); } // where each quill will stand
    const x0 = e.x + T.d * 20, x1 = T.x - T.d * 18; ctx.lineWidth = 2; // the wind's path: long strokes running from it toward the quills
    for (let i = 0; i < 7; i++) { const y = FLOOR_TOP + 14 + i * (FLOOR_BOT - FLOOR_TOP - 24) / 6, q = cl01(k * 1.4 - (i % 3) * .12), xa = lerp(x0, x1, .1 + (i % 2) * .15), xb = lerp(xa, x1, q);
      ctx.strokeStyle = `rgba(230,210,255,${.15 + .4 * q})`; ctx.beginPath(); ctx.moveTo(xa, y); ctx.lineTo(xb, y); ctx.lineTo(xb - T.d * 6, y - 4); ctx.stroke(); }
    ctx.restore(); };
  PLAN_FX.w4gust = (e) => {
    const T = gustT(e); e.w4T = null; sfx('whoosh');
    const q = { kind: 'w4quills', x: T.x, d: T.d, gap: T.gap, el: 0, t: 9, max: 9, dmg: edmg(e), hit: false, end: 1.9 };
    hazards.push(q);
    act(e, 'gust', (h, dt, e) => {
      e.facing = T.d; const g = (h.el - .28) / 1.1;
      e.w4pose = { beat: g < 0 ? 1 : g < 1 ? Math.cos(g * TAU * 2) : 1 }; // two great downstrokes
      if (g >= 0 && g < 1 && P.state !== 'dead') { const f = .55 + .45 * Math.max(0, -Math.cos(g * TAU * 2)); if ((P.x - e.x) * T.d > -10) P.x = xClamp(P.x + T.d * GUST * f * dt);
        if (Math.random() < .6) parts.push({ x: e.x + T.d * rand(30, 200), y: rand(FLOOR_TOP, FLOOR_BOT), z: rand(2, 40), vx: T.d * rand(320, 420), vy: 0, vz: 0, life: .4, max: .4, col: 'rgba(220,200,255,.5)', size: rand(2, 3), shape: 'streak', rot: 0, vr: 0 }); }
      if (g >= 0 && !h.blown) { h.blown = 1; sfx('slam'); shakeMag = Math.max(shakeMag, 5); }
      if (g >= 1) { recover(e, 1.0); return true; } // spent: your opening
      return false;
    });
  };
  reg('w4quills', {
    update(h, dt) { h.el += dt; const u = h.el / .26;
      if (u >= 1 && !h.landed) { h.landed = 1; sfx('crunch'); for (let l = 0; l < LANES; l++) if (l !== h.gap) burst(h.x, laneY(l), 2, ['#FF8A3C', '#2A1A36', '#FFD27A'], 5, 'rock', 0); }
      if (h.landed && !h.hit && h.el < h.end - .3 && P.z < 34 && laneOf(P.y) !== h.gap && Math.abs(P.x - h.x) < 15) { h.hit = true; hitP(h.dmg, h.x + h.d * 30, true); }
      if (h.el > h.end) h.t = -1; },
    draw(h, t) { if (!h.landed) for (let l = 0; l < LANES; l++) if (l !== h.gap) { ctx.fillStyle = `rgba(20,8,24,${.2 + .4 * cl01(h.el / .26)})`; ell(h.x, laneY(l), 9, 3); ctx.fill(); } },
    ups(h, list, t) { const u = cl01(h.el / .26), z = 200 * (1 - u * u), f = 1 - cl01((h.el - h.end + .4) / .4); // the quills, falling, then standing in the floor, root down
      for (let l = 0; l < LANES; l++) { if (l === h.gap) continue; const y = laneY(l); list.push([y, () => { ctx.save(); ctx.globalAlpha = f;
        for (const [ox, lean, L] of [[-7 + (l % 2) * 3, -.22, 34], [6 - (l % 2) * 3, .2, 30]]) { ctx.save(); ctx.translate(h.x + ox, y - z); pinion(0, 0, -Math.PI / 2 + lean - h.d * .06, L, 7.4, false, DR.ember); ctx.restore(); }
        ctx.restore(); glowAt(h.x, y - z - 30, 14, EMBER, .4 * f); }]); } },
    box(h, box) { box(h.x, (FLOOR_TOP + FLOOR_BOT) / 2, 0, 40, 260); },
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

  // ---------------- the Ty'iga's harder shapes of its attacks ----------------
  Object.assign(BOSS_WIND, { w4leap: .8, w4sweep: .9, w4gaze: .85 });
  // HUNTING LEAP (wolf): it leaps out of sight; a shadow hunts you across the floor, stops, and it comes down there like a falling star. Two or three times
  TELL_FX.w4leap = (e, t, k) => { ctx.save(); ctx.fillStyle = tellCol(k); ell(e.x, e.y, 30 + 20 * k, 9 + 6 * k); ctx.fill(); ctx.restore(); }; // it gathers itself
  PLAN_FX.w4leap = (e) => {
    const n = e.phase >= 2 ? 3 : 2; sfx('whoosh'); dust(e.x, e.y, 14); e.w4T = null;
    act(e, 'leap', (h, dt, e) => {
      const L = 1.25, i = Math.floor(h.el / L), k = (h.el % L) / L;
      if (i >= n) { e.w4vis = 1; recover(e, 1.0); return true; }
      if (h.i !== i) { h.i = i; h.hit = false; h.lock = null; h.tx = P.x; h.ty = P.y; }
      if (k < .14) { e.w4vis = 1 - k / .14; }
      else if (k < .66) { e.w4vis = 0; if (k < .54) { h.tx += (P.x - h.tx) * Math.min(1, dt * 7); h.ty += (P.y - h.ty) * Math.min(1, dt * 7); } else if (!h.lock) { h.lock = 1; sfx('charge', 1); } } // the shadow hunts you, then stops
      else { if (!h.hit) { h.hit = true; e.x = xClamp(h.tx); e.y = yClamp(h.ty); e.w4vis = 1; shakeMag = Math.max(shakeMag, 12); sfx('slam'); hitstop = Math.max(hitstop, .05);
          burst(e.x, e.y, 8, ['#2A1A36', '#FF9A50', '#FFFFFF'], 22, 'rock', 0, true); fx.push({ kind: 'ring', x: e.x, y: e.y, z: 2, t: .45, max: .45, r: 120, col: '#FF9A50', flat: 1 });
          if (inEll(P.x, P.y, e.x, e.y, 78) && P.z < 40) hitP(Math.round(edmg(e) * 1.35), e.x, true); } }
      return false;
    }, { i: -1 }).draw = (h, t) => { if (h.hit || h.i < 0) return; const k = ((h.el % 1.25) / 1.25); if (k < .14) return; const lock = k >= .54;
      ctx.save(); ctx.fillStyle = `rgba(20,8,24,${lock ? .55 : .3})`; ell(h.tx, h.ty, 60, 19); ctx.fill(); ctx.strokeStyle = lock ? `rgba(255,120,90,${.6 + .4 * Math.sin(t * 40)})` : 'rgba(255,130,110,.45)'; ctx.lineWidth = lock ? 2.6 : 1.6; ell(h.tx, h.ty, 78, 78 / 2.2); ctx.stroke(); ctx.restore(); };
  };
  // BURNING SWEEP (drake): walls of fire roll across the arena one after another, each with a single lane left clear, a different one each time
  const sweepT = (e) => targets(e, () => { const dir = P.x < e.x ? -1 : 1, gaps = []; let g = laneOf(P.y);
    for (let i = 0; i < 3; i++) { const opts = [0, 1, 2, 3].filter(l => l !== g && Math.abs(l - g) <= 2); g = pick(opts); gaps.push(g); } return { dir: -dir, gaps }; }); // (never the lane you stand in, never too far to reach)
  TELL_FX.w4sweep = (e, t, k) => { const T = sweepT(e), g = T.gaps[0]; ctx.save();
    for (let l = 0; l < LANES; l++) { ctx.fillStyle = l === g ? `rgba(120,230,170,${.12 + .2 * k})` : tellCol(k, .7); ctx.fillRect(camX, laneY(l) - laneH * .45, VW, laneH * .9); }
    ctx.restore(); };
  PLAN_FX.w4sweep = (e) => {
    const T = sweepT(e); e.w4T = null; sfx('roar'); shakeMag = 8;
    T.gaps.forEach((g, i) => hazards.push({ kind: 'w4firewall', gap: g, next: T.gaps[i + 1], dir: T.dir, x: T.dir > 0 ? camX - 40 : camX + VW + 40, delay: i * .95, sp: 300, dmg: Math.round(edmg(e) * 1.1), hit: false, t: 9, max: 9 }));
    act(e, 'sweep', (h, dt, e) => { if (h.el > 1.2) { recover(e, 1.6); return true; } return false; });
  };
  reg('w4firewall', {
    update(h, dt) { if (h.delay > 0) { h.delay -= dt; return; } h.x += h.dir * h.sp * dt;
      if (!h.hit && Math.abs(P.x - h.x) < 18 && laneOf(P.y) !== h.gap && P.z < 70) { h.hit = true; hitP(h.dmg, h.x - h.dir * 10, true); }
      if (Math.random() < .9) parts.push({ x: h.x + rand(-8, 8), y: rand(FLOOR_TOP + 6, FLOOR_BOT), z: rand(0, 40), vx: h.dir * rand(20, 80), vy: 0, vz: rand(40, 120), life: .5, max: .5, col: pick(['#FFD27A', '#FF8A3A', '#E84A2A']), size: rand(2, 4), shape: 'puff' });
      if (h.dir > 0 ? h.x > camX + VW + 60 : h.x < camX - 60) h.t = -1; },
    draw(h, t) { if (h.delay > 0) { if (h.delay < .7) { const k = 1 - h.delay / .7; ctx.save(); ctx.fillStyle = `rgba(120,230,170,${.25 * k})`; ctx.fillRect(camX, laneY(h.gap) - laneH * .45, VW, laneH * .9); ctx.restore(); } return; } // the next wall's clear lane shows before it comes
      ctx.save(); ctx.fillStyle = 'rgba(120,230,170,.18)'; ctx.fillRect(camX, laneY(h.gap) - laneH * .45, VW, laneH * .9); ctx.restore(); },
    ups(h, list, t) { if (h.delay > 0) return; for (let l = 0; l < LANES; l++) { if (l === h.gap) continue; const y = laneY(l);
      list.push([y + 2, () => { ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 4; i++) { const hh = 46 + 18 * Math.sin(t * 14 + i * 1.7 + l), x = h.x + (i - 1.5) * 7, g = ctx.createLinearGradient(0, y - hh, 0, y); g.addColorStop(0, 'rgba(255,90,30,0)'); g.addColorStop(.5, 'rgba(255,140,50,.55)'); g.addColorStop(1, 'rgba(255,230,160,.85)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 9, y + 3); ctx.quadraticCurveTo(x - 6 + Math.sin(t * 20 + i) * 4, y - hh * .5, x + Math.sin(t * 9 + i) * 5, y - hh); ctx.quadraticCurveTo(x + 6, y - hh * .5, x + 9, y + 3); ctx.closePath(); ctx.fill(); }
        ctx.restore(); }]); } },
    box(h, box) { box(h.x, (FLOOR_TOP + FLOOR_BOT) / 2, 0, 40, 120); },
  });
  // GAZE OF A THOUSAND FACES (mask): its faces open their eyes one after another; each line of sight follows you, holds, and burns. They overlap: keep moving
  TELL_FX.w4gaze = (e, t, k) => { ctx.save(); ctx.strokeStyle = tellLine(k); ctx.lineWidth = 1.4; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t; ctx.beginPath(); ctx.moveTo(e.x, e.y - e.z * .3 - 60); ctx.lineTo(e.x + Math.cos(a) * 90 * k, e.y - 60 + Math.sin(a) * 40 * k); ctx.stroke(); } ctx.restore(); };
  PLAN_FX.w4gaze = (e) => {
    const n = 6; e.w4T = null; sfx('charge', 2);
    for (let i = 0; i < n; i++) hazards.push({ kind: 'w4gazebeam', delay: i * .34, a: rand(-.9, .9) + (i % 2 ? Math.PI : 0), track: .6, hold: .26, burn: .16, x: P.x, y: P.y, dmg: Math.round(edmg(e) * .85), hit: false, t: 9, max: 9 });
    act(e, 'gaze', (h, dt, e) => { if (h.el > n * .34 + 1.1) { recover(e, 1.3); return true; } return false; });
  };
  reg('w4gazebeam', {
    update(h, dt) { if (h.delay > 0) { h.delay -= dt; h.x = P.x; h.y = P.y; return; } h.el = (h.el || 0) + dt;
      if (h.el < h.track) { h.x += (P.x - h.x) * Math.min(1, dt * 9); h.y += (P.y - h.y) * Math.min(1, dt * 9); }
      else if (h.el >= h.track + h.hold && h.el < h.track + h.hold + h.burn) { if (!h.fired) { h.fired = true; sfx('shoot'); shakeMag = Math.max(shakeMag, 4); }
        const c = Math.cos(h.a), s = Math.sin(h.a) * .35, dx = P.x - h.x, dy = P.y - h.y, d = Math.abs(dx * s - dy * c) / Math.hypot(c, s);
        if (!h.hit && d < 13 && P.z < 60) { h.hit = true; hitP(h.dmg, h.x - c * 40, true); } }
      else if (h.el >= h.track + h.hold + h.burn) h.t = -1; },
    draw(h, t) { if (h.delay > 0 || !h.el) return; const c = Math.cos(h.a), s = Math.sin(h.a) * .35, L = 700, lock = h.el >= h.track, fire = h.el >= h.track + h.hold;
      ctx.save(); ctx.lineCap = 'round';
      if (!fire) { ctx.strokeStyle = lock ? `rgba(255,120,110,${.55 + .45 * Math.sin(t * 50)})` : 'rgba(255,140,120,.35)'; ctx.lineWidth = lock ? 2.4 : 1.2; ctx.setLineDash(lock ? [] : [8, 6]); }
      else { ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(220,170,255,.9)'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(h.x - c * L, h.y - s * L); ctx.lineTo(h.x + c * L, h.y + s * L); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 5; }
      ctx.beginPath(); ctx.moveTo(h.x - c * L, h.y - s * L); ctx.lineTo(h.x + c * L, h.y + s * L); ctx.stroke();
      if (!fire) { ctx.setLineDash([]); ctx.strokeStyle = 'rgba(255,140,120,.6)'; ctx.lineWidth = 1.4; ell(h.x, h.y, 14, 6); ctx.stroke(); }
      ctx.restore(); },
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
  const FORM_BOX = { 1: [52, 68], 2: [44, 72], 3: [42, 84] }; // the wolf, the drake, the Mask
  MECH_FX.w4rim = {
    start(m) { m.ph = 1; },
    update(m, dt) {
      const e = boss && boss.def === BOSSES.tyiga ? boss : null; if (!e) return;
      if (e.phase !== m.ph) { e.w4from = m.ph; m.ph = e.phase; e.w4shift = 1; smokePuff(e.x, e.y, 30, 30); sfx('roar'); e.w4T = null; }
      if (e.w4shift > 0) e.w4shift = Math.max(0, e.w4shift - dt / 1.3);
      if (!e.dead) { const [w, h] = FORM_BOX[e.phase] || FORM_BOX[1]; e.hw = w * e.size; e.hh = h * e.size; }
      const hl = e.phase === 3 && !e.dead && !(e.w4shift > 0); if (hl && !e.w4hl) e.w4H = null; e.w4hl = hl; // the Mask's hands live in the world
      if (stillT > 0) return;
      m.clk = (m.clk || 0) + dt;
      if (e.w4hl) handsUpdate(e, dt, m.clk);
      e.w4halo = e.state === 'w4act' && e.w4a === 'faces' ? 0 : Math.min(1, (e.w4halo ?? 1) + dt * .4); // the fallen faces grow back
      if (e.state === 'wind' && e.plan === 'w4faces') e.w4mood = 1 - e.t / e.windMax > .42 ? facesT(e).first : 0; // its face shows which fall first
      else if (!(e.state === 'w4act' && e.w4a === 'faces')) e.w4mood = 0;
      if (!e.dead && Math.random() < dt * 10) parts.push({ x: camX + rand(0, VW), y: rand(FLOOR_TOP, FLOOR_BOT), z: 0, vx: rand(-6, 6), vy: 0, vz: rand(30, 60), life: 2.2, max: 2.2, col: pick(['rgba(255,150,70,.8)', 'rgba(255,200,120,.7)', 'rgba(150,100,200,.6)']), size: rand(1.2, 2.2), shape: 'star', rot: 0, vr: 1, w4: 1 }); // embers rising out of the Abyss
    },
    boxes(m, box) { hzBoxes(box); const e = boss && boss.def === BOSSES.tyiga ? boss : null; if (e && e.w4hl && e.w4H) for (const h of e.w4H) box(h.x, h.y, h.z, 60 * e.size, 60 * e.size); },
    list(m, list, t) { hzList(list, t); const e = boss && boss.def === BOSSES.tyiga ? boss : null; if (e) handsList(e, list); },
  };
  // the arena's weather and its light: the shared code gives an unknown boss a generic sparkle and an unset tint, so this
  // recolors the sparkle as ash and embers, and leaves the canvas holding this boss's own tint color between frames
  let lastTint = 0;
  const tintLoop = () => {
    requestAnimationFrame(tintLoop);
    if (typeof boss === 'undefined' || !boss || boss.def !== BOSSES.tyiga || boss.dead) return;
    const g = cv.getContext('2d'); g.fillStyle = ['rgba(150,60,150,.32)', 'rgba(150,60,150,.32)', 'rgba(200,70,60,.34)', 'rgba(110,70,170,.34)'][boss.phase || 1];
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
        const side = i % 4, u = hash1(i * 3.3), len = (110 + hash1(i + 7) * 260) * c, w = 26 + hash1(i + 2) * 40;
        const [x0, y0, ang] = side === 0 ? [u * X1, Y0 - 4, Math.PI / 2] : side === 1 ? [u * X1, Y1 + 4, -Math.PI / 2] : side === 2 ? [-4, Y0 + u * H, 0] : [X1 + 4, Y0 + u * H, Math.PI];
        const curl = (hash1(i + 11) - .5) * 2.2, mx = x0 + Math.cos(ang + curl * .3) * len * .55, my = y0 + Math.sin(ang + curl * .3) * len * .55, ex = x0 + Math.cos(ang + curl) * len, ey = y0 + Math.sin(ang + curl) * len;
        const s = taper(x0, y0, mx, my, ex, ey, w, .6, 8); trace(s.L, s.R); ctx.fillStyle = '#0A0610'; ctx.fill();
        ctx.strokeStyle = `rgba(150,100,200,${.25 * c})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(s.L[0], s.L[1]); for (let k = 2; k < s.L.length; k += 2) ctx.lineTo(s.L[k], s.L[k + 1]); ctx.stroke();
      }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(230,180,90,${.5 * c})`; ctx.lineWidth = 1.6; ctx.beginPath(); // the gold of the Logrus, burning in the ink
      for (let i = 0; i < 9; i++) { let x = cx + (hash1(i) - .5) * X1 * .9, y = cy + (hash1(i + 4) - .5) * H * .8, a = hash1(i + 9) * TAU; ctx.moveTo(x, y); for (let s = 0; s < 10 * c; s++) { a += Math.sin(i * 3 + s) * .9; x += Math.cos(a) * 14; y += Math.sin(a) * 10; ctx.lineTo(x, y); } }
      ctx.stroke(); ctx.restore();
    } else {
      const q = 1 - c, R = Math.hypot(X1, H) * .64 * Math.pow(q, 1.3), edge = (a) => R * (1 + .12 * Math.sin(a * 5 + 1) + .07 * Math.sin(a * 11 + 3) + .04 * Math.sin(a * 23));
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
      const k = c, h = lerp(70, X1 / .62 * .98, Math.pow(Math.min(1, p * 2), 3)), w = h * .62, rot = (1 - k) * -.25;
      ctx.save(); ctx.translate(cx, cy + (1 - k) * 20); ctx.rotate(rot);
      ctx.fillStyle = 'rgba(255,220,150,.25)'; ctx.fillRect(-w / 2 - w * .12, -h / 2 - w * .12, w * 1.24, h + w * .24); // its glow
      trumpPicture(-w / 2, -h / 2, w, h, t); trumpFrame(-w / 2, -h / 2, w, h, 1);
      ctx.restore();
    } else {
      const k = 1 - c, h = X1 / .62 * .98 * (1 + k * 1.2), w = h * .62;
      ctx.save(); ctx.translate(cx, cy); trumpFrame(-w / 2, -h / 2, w, h, c); ctx.restore();
      ctx.fillStyle = `rgba(255,236,190,${c * .25})`; ctx.fillRect(0, Y0, X1, H);
    }
  };
  };
  window.w4Late = late;
})();
