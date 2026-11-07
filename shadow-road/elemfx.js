'use strict';
// ---------- the elements, painted: fire, frost, storm, blood, the abyss and the tide ----------
// Every elemental effect is drawn from a few small pictures painted once into offscreen canvases (a flame tongue in six
// poses, an ember, a hex flake, ice shards, rime, a blood drop and its splat, a wisp of the abyss, glows) and then laid
// down scaled, turned and faded per particle, so a crowd of burning, frozen and shocked foes costs a handful of
// drawImage calls each. Only the lightning is drawn as paths (it has to be new every frame), and it is kept short.
// What it hooks (visual only; nothing here changes a number in the fight):
//   burst(...)      new materials 'fire', 'frost', 'storm', 'blood', 'void', 'tide'
//   drawPart(p)     new shapes 'flame', 'ember', 'smoke', 'flake', 'ice', 'spark', 'drop', 'wisp'
//   drawFx(f)       the forked 'bolt' redrawn branching, and 'elb', the bloom at the heart of an elemental burst
//   updateFx(dt)    lift for flames and smoke, drops that splash, a frozen foe shattering as it thaws, a struck foe crackling
//   drawTrail / drawFlatTrail  a branded weapon's swing streams flame, frost or lightning
//   FXEL.status(e, t, scale)   (from drawEnemy) a foe burning, chilled, frozen in ice, shocked
const FXEL = (() => {
  const RS = 4; // sprite pixels per world unit
  const lite = () => (typeof PAINT_LITE !== 'undefined' && PAINT_LITE) || (typeof PAINT_Q !== 'undefined' && PAINT_Q === 0);
  const busy = () => lite() || (typeof CROWD !== 'undefined' && CROWD);
  const cache = new Map();
  // a sprite: w x h units, anchored at (ax, ay) units from its top left; paint(g) draws in units with the anchor at 0,0
  function sprite(key, w, h, ax, ay, paint) {
    let S = cache.get(key); if (S) return S;
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w * RS)); c.height = Math.max(1, Math.ceil(h * RS));
    const g = c.getContext('2d'); g.setTransform(RS, 0, 0, RS, ax * RS, ay * RS); g.lineJoin = 'round'; g.lineCap = 'round'; paint(g);
    S = { c, w, h, ax, ay }; cache.set(key, S); return S;
  }
  // lay a sprite down at x, y, sc times its size; with a turn (and a stretch along it) it is drawn about its anchor
  // the particles are many: while they are drawn (FAST.on) the scene's transform is read once a frame and each turned sprite
  // is set straight onto it, instead of a save, translate, rotate, scale and restore per particle
  const FAST = { on: false, f: -1, c: null, m: null };
  let frameNo = 0;
  { const _ds = drawScene; drawScene = function (t) { frameNo++; return _ds(t); }; }
  function put(S, x, y, sc, rot, sx, sy) {
    if (!(sc > 0)) return;
    if (!rot && !sx && !sy) { ctx.drawImage(S.c, x - S.ax * sc, y - S.ay * sc, S.w * sc, S.h * sc); return; }
    if (FAST.on) {
      if (FAST.f !== frameNo || FAST.c !== ctx) { FAST.m = ctx.getTransform(); FAST.f = frameNo; FAST.c = ctx; }
      const M = FAST.m, c = Math.cos(rot || 0), s = Math.sin(rot || 0), kx = sc * (sx || 1), ky = sc * (sy || 1);
      ctx.setTransform((M.a * c + M.c * s) * kx, (M.b * c + M.d * s) * kx, (M.c * c - M.a * s) * ky, (M.d * c - M.b * s) * ky, M.a * x + M.c * y + M.e, M.b * x + M.d * y + M.f);
      ctx.drawImage(S.c, -S.ax, -S.ay, S.w, S.h); ctx.setTransform(M); return;
    }
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(sc * (sx || 1), sc * (sy || 1));
    ctx.drawImage(S.c, -S.ax, -S.ay, S.w, S.h); ctx.restore();
  }
  const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

  // ---------------- palettes ----------------
  const FIRE = {
    fire: { ink: '#4A1208', tip: '#B82A16', body: '#EE5A1C', mid: '#FFA034', core: '#FFF2C4', glow: '255,140,60', em: ['#FFF4D0', '#FFC860', '#FF7A2A'], smoke: '58,38,34' },
    black: { ink: '#000000', tip: '#14081C', body: '#2E1040', mid: '#7A1C64', core: '#E04C80', glow: '170,40,130', em: ['#E04C80', '#9A2A9A', '#5A2A7A'], smoke: '16,6,20' },
    white: { ink: '#8A6428', tip: '#E0B050', body: '#FFD880', mid: '#FFF0C0', core: '#FFFFFF', glow: '255,226,160', em: ['#FFFFFF', '#FFF0C0', '#FFE08A'], smoke: '230,210,170' },
  };
  const DROP = {
    blood: { ink: '#3A040A', body: '#A8182A', dk: '#6A0C16', hi: '#FF9AA0' },
    water: { ink: '#1E5A6E', body: '#8ED8EC', dk: '#4A9CB8', hi: '#FFFFFF' },
    nacre: { ink: '#7A3A50', body: '#F2C4D4', dk: '#C88AA2', hi: '#FFFFFF' },
  };

  // ---------------- fire ----------------
  // a flame tongue: a teardrop curling up to a point, licks off its sides; dark red tip, orange body, a hot white-yellow
  // heart low down, an ink line round it and a few brush strokes up through it. 20 x 40 units, anchored at its foot.
  function tongue(g, w, h, lean, curl, oy = 0) {
    const tx = lean * h, ty = oy - h, b = oy;
    g.beginPath(); g.moveTo(tx, ty);
    g.bezierCurveTo(tx + w * (.2 + curl), ty + h * .34, w * .62, b - h * .42, w * .5, b - w * .45);
    g.bezierCurveTo(w * .5, b + w * .1, -w * .5, b + w * .1, -w * .5, b - w * .45);
    g.bezierCurveTo(-w * .64, b - h * .46, tx - w * (.28 - curl), ty + h * .42, tx, ty);
    g.closePath();
  }
  const POSES = [[-.12, .12, 1, 1], [.1, -.1, 1, 0], [-.04, .2, 0, 1], [.16, -.18, 1, 1], [0, .05, 0, 0], [-.2, -.05, 1, 0]];
  function flameSprite(pal, v) {
    return sprite('fl' + pal + v, 22, 42, 11, 40, (g) => {
      const P = FIRE[pal], [lean, curl, lickL, lickR] = POSES[v], W = 13, H = 36;
      const grad = (y0, y1, a, b) => { const q = g.createLinearGradient(0, y0, 0, y1); q.addColorStop(0, a); q.addColorStop(1, b); return q; };
      // the body, its licks, then the ink line round all of it
      g.fillStyle = grad(0, -H, P.body, P.tip); tongue(g, W, H, lean, curl); g.fill();
      if (lickL) { tongue(g, W * .42, H * .5, -.42, .1, -H * .16); g.fill(); }
      if (lickR) { tongue(g, W * .38, H * .44, .44, -.1, -H * .22); g.fill(); }
      g.strokeStyle = P.ink; g.globalAlpha = .75; g.lineWidth = .9; tongue(g, W, H, lean, curl); g.stroke();
      if (lickL) { tongue(g, W * .42, H * .5, -.42, .1, -H * .16); g.stroke(); }
      if (lickR) { tongue(g, W * .38, H * .44, .44, -.1, -H * .22); g.stroke(); }
      g.globalAlpha = 1;
      g.fillStyle = grad(0, -H * .72, P.mid, P.body); tongue(g, W * .68, H * .72, lean * .9, curl * .7, -.4); g.fill();
      g.fillStyle = grad(0, -H * .4, P.core, P.mid); tongue(g, W * .4, H * .4, lean * .7, curl * .4, -.8); g.fill();
      // brushwork: thin strokes of the hotter colour licking up through the body
      g.strokeStyle = P.mid; g.lineWidth = .7; g.globalAlpha = .55;
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * W * .2, -H * .2); g.quadraticCurveTo(s * W * .28 + lean * H * .3, -H * .5, lean * H * .7 + s * W * .08, -H * .8); g.stroke(); }
      g.globalAlpha = 1;
    });
  }
  const glowSpr = (rgb) => sprite('gl' + rgb, 2, 2, 1, 1, (g) => { const q = g.createRadialGradient(0, 0, 0, 0, 0, 1); q.addColorStop(0, `rgba(${rgb},.9)`); q.addColorStop(.35, `rgba(${rgb},.38)`); q.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = q; g.fillRect(-1, -1, 2, 2); });
  // an ember: a white-hot fleck in a coloured glow, with a fading tail behind it (drawn stretched along its flight)
  const emberSpr = (pal) => sprite('em' + pal, 12, 4, 2, 2, (g) => { const [c0, c1, c2] = FIRE[pal].em;
    const q = g.createLinearGradient(0, 0, 10, 0); q.addColorStop(0, c1); q.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = q; g.globalAlpha = .7;
    g.beginPath(); g.moveTo(0, -1.1); g.lineTo(10, 0); g.lineTo(0, 1.1); g.closePath(); g.fill(); g.globalAlpha = 1;
    const r = g.createRadialGradient(0, 0, 0, 0, 0, 2); r.addColorStop(0, c0); r.addColorStop(.4, c1); r.addColorStop(.75, c2); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(-2, -2, 4, 4); });
  // a wisp of smoke: three soft lobes, a darker underside
  const smokeSpr = (rgb, v) => sprite('sm' + rgb + v, 16, 16, 8, 8, (g) => {
    for (let i = 0; i < 4; i++) { const a = i * 2.1 + v, r = 3.2 + hash(v * 7 + i) * 2.4, x = Math.cos(a) * 2.6, y = Math.sin(a) * 2;
      const q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, `rgba(${rgb},.5)`); q.addColorStop(.7, `rgba(${rgb},.32)`); q.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); } });

  // ---------------- frost ----------------
  // a six-armed flake: a dendrite inked in blue under white, a little hexagonal plate at its heart
  const flakeSpr = (v) => sprite('fk' + v, 12, 12, 6, 6, (g) => {
    const arm = (w, col) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath();
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, ca = Math.cos(a), sa = Math.sin(a), L = 5;
        g.moveTo(0, 0); g.lineTo(ca * L, sa * L);
        for (const [d, l] of v === 1 ? [[2.4, 1.8]] : v === 2 ? [[1.6, 1.2], [3.4, 1.4]] : [[2.2, 1.6], [3.8, 1]]) for (const s of [-1, 1]) { const b = a + s * 1.05; g.moveTo(ca * d, sa * d); g.lineTo(ca * d + Math.cos(b) * l, sa * d + Math.sin(b) * l); } }
      g.stroke(); };
    arm(1.6, 'rgba(40,96,150,.9)'); arm(.75, '#FFFFFF');
    g.fillStyle = '#E8F8FF'; g.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .52; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 1.3, Math.sin(a) * 1.3); } g.closePath(); g.fill(); });
  // an ice shard: a long faceted crystal, a pale lit face and a deeper one, a glint along its edge, inked round
  const SHARDS = [[[0, -7], [1.9, -1.6], [1.4, 5.6], [-1.5, 5], [-2, -1]], [[.4, -6], [2.2, -.4], [.6, 6], [-1.8, 3.8], [-1.6, -2]], [[-.3, -7.4], [1.5, -2.4], [2, 3], [0, 6.4], [-1.9, 1.6]]];
  const shardSpr = (v, tint) => sprite('sh' + v + (tint || ''), 6, 16, 3, 8, (g) => {
    const p = SHARDS[v], [lt, dk, ink] = tint === 'n' ? ['#FFF3F6', '#D49EB0', '#6A3A50'] : ['#DDF6FF', '#6EA8D8', '#1C3A58'];
    const path = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => g[i ? 'lineTo' : 'moveTo'](x, y)); g.closePath(); };
    g.fillStyle = dk; path(p); g.fill();
    g.fillStyle = lt; path([p[0], p[1], p[2], [(p[2][0] + p[3][0]) / 2 + .3, (p[2][1] + p[3][1]) / 2]]); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = .55; g.beginPath(); g.moveTo(p[0][0], p[0][1]); g.lineTo(p[1][0], p[1][1]); g.lineTo(p[2][0], p[2][1]); g.stroke();
    g.strokeStyle = ink; g.lineWidth = .7; path(p); g.stroke(); });
  // rime: needles of frost feathering out from a point, with tiny flakes caught in them
  const rimeSpr = (v) => sprite('rm' + v, 14, 14, 7, 7, (g) => {
    const n = 7 + v * 2;
    for (let pass = 0; pass < 2; pass++) { g.strokeStyle = pass ? 'rgba(255,255,255,.95)' : 'rgba(60,120,180,.55)'; g.lineWidth = pass ? .45 : 1; g.beginPath();
      for (let i = 0; i < n; i++) { const a = i / n * TAU + hash(v * 11 + i) * .6, L = 2.5 + hash(v * 5 + i) * 3.6, ca = Math.cos(a), sa = Math.sin(a);
        g.moveTo(ca * .6, sa * .6); g.lineTo(ca * L, sa * L); const m = L * .55; g.moveTo(ca * m, sa * m); g.lineTo(ca * m + Math.cos(a + .7) * 1.1, sa * m + Math.sin(a + .7) * 1.1); }
      g.stroke(); }
    g.fillStyle = 'rgba(235,250,255,.9)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc((hash(v + i * 3) - .5) * 7, (hash(v + i * 5) - .5) * 7, .45, 0, TAU); g.fill(); } });
  // a crust of hoarfrost: a pale bloom speckled with white grains and a few needles
  const crustSpr = (v) => sprite('cr' + v, 24, 14, 12, 7, (g) => { const r = mulberry(v * 29 + 5);
    const q = g.createRadialGradient(0, 0, 0, 0, 0, 11); q.addColorStop(0, 'rgba(236,250,255,.75)'); q.addColorStop(.6, 'rgba(200,236,255,.45)'); q.addColorStop(1, 'rgba(200,236,255,0)');
    g.fillStyle = q; g.save(); g.scale(1, .55); g.beginPath(); g.arc(0, 0, 11, 0, TAU); g.fill(); g.restore();
    g.fillStyle = '#FFFFFF'; for (let i = 0; i < 26; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 9; g.beginPath(); g.arc(Math.cos(a) * d, Math.sin(a) * d * .5, .25 + r() * .45, 0, TAU); g.fill(); }
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = .35; g.beginPath(); for (let i = 0; i < 8; i++) { const x = (r() - .5) * 16, y = (r() - .5) * 7, a = r() * TAU, l = 1 + r() * 2; g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); } g.stroke(); });
  // a soft wash, bottom to top, laid over a figure (frost, fire and storm each their own)
  const washSpr = (key, rgbA, a0, a1) => sprite('ws' + key, 1, 32, 0, 32, (g) => { const q = g.createLinearGradient(0, 0, 0, -32); q.addColorStop(0, `rgba(${rgbA},${a0})`); q.addColorStop(1, `rgba(${rgbA},${a1})`); g.fillStyle = q; g.fillRect(0, -32, 1, 32); });
  // a frozen foe's block of ice, by size: faceted, translucent, lit from the upper right, an ink line round it, snow at its foot
  const iceKeys = [];
  function iceSpr(w, h) {
    w = Math.max(20, Math.round(w / 4) * 4); h = Math.max(20, Math.round(h / 4) * 4);
    const key = 'ice' + w + 'x' + h;
    if (!cache.has(key)) { iceKeys.push(key); if (iceKeys.length > 24) { const old = iceKeys.shift(); const S = cache.get(old); if (S) { S.c.width = S.c.height = 1; } cache.delete(old); } }
    return sprite(key, w + 6, h + 8, w / 2 + 3, h + 4, (g) => {
      const r = mulberry(w * 31 + h), hw = w / 2, J = (k) => (r() - .5) * k;
      const hull = [[-hw + J(3), 2], [-hw - 2 + J(2), -h * .35], [-hw + 1 + J(3), -h * .78], [-hw * .45 + J(4), -h - 1 + J(3)], [hw * .15 + J(4), -h + 2 + J(4)],
        [hw * .7 + J(3), -h - 2 + J(2)], [hw + 2 + J(2), -h * .6], [hw + J(3), -h * .2], [hw * .6, 2], [0, 3]];
      const c1 = [-hw * .25 + J(5), -h * .62 + J(6)], c2 = [hw * .3 + J(5), -h * .3 + J(6)];
      const path = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => g[i ? 'lineTo' : 'moveTo'](x, y)); g.closePath(); };
      g.fillStyle = 'rgba(150,205,240,.42)'; path(hull); g.fill();
      // facets: a fan from two points inside, each face shaded by which way it turns to the light
      for (let i = 0; i < hull.length; i++) { const A = hull[i], B = hull[(i + 1) % hull.length], C = (A[1] + B[1]) / 2 < -h * .48 ? c1 : c2;
        const mx = (A[0] + B[0] + C[0]) / 3, my = (A[1] + B[1] + C[1]) / 3, lit = clamp(.5 + (mx / hw) * .3 - (my / h + .5) * .5, 0, 1);
        g.fillStyle = lit > .55 ? `rgba(225,246,255,${.18 + .3 * lit})` : `rgba(70,130,190,${.12 + .22 * (1 - lit)})`; path([A, B, C]); g.fill(); }
      g.fillStyle = 'rgba(200,236,255,.2)'; path([c1, c2, hull[6], hull[4]]); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = .6; g.beginPath();
      for (const P of hull) { const C = P[1] < -h * .48 ? c1 : c2; g.moveTo(P[0], P[1]); g.lineTo(C[0], C[1]); } g.moveTo(c1[0], c1[1]); g.lineTo(c2[0], c2[1]); g.stroke();
      // a crack or two
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = .5; g.beginPath(); let x = c2[0], y = c2[1]; g.moveTo(x, y); for (let i = 0; i < 4; i++) { x += J(9); y += h * .1 + J(4); g.lineTo(x, y); } g.stroke();
      // the bright edges toward the light, the ink line all round
      g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(hull[3][0], hull[3][1]); for (const P of [hull[4], hull[5], hull[6], hull[7]]) g.lineTo(P[0] - .8, P[1] + .8); g.stroke();
      g.strokeStyle = '#1C3A58'; g.lineWidth = 1.1; path(hull); g.stroke();
      // snow drifted round its foot
      g.fillStyle = '#F4FBFF'; g.strokeStyle = 'rgba(40,90,140,.6)'; g.lineWidth = .6; g.beginPath();
      for (let i = 0; i < 6; i++) { const cx = -hw + (i + .5) * w / 6 + J(3), rr = 2.2 + r() * 2.4; g.moveTo(cx + rr, 2); g.ellipse(cx, 2, rr, rr * .6, 0, Math.PI, 0); } g.fill(); g.stroke();
    });
  }
  // ---------------- storm ----------------
  const sparkSpr = (rgb) => sprite('sp' + rgb, 10, 10, 5, 5, (g) => {
    const q = g.createRadialGradient(0, 0, 0, 0, 0, 5); q.addColorStop(0, `rgba(${rgb},.75)`); q.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = q; g.fillRect(-5, -5, 10, 10);
    g.fillStyle = '#FFFFFF'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, L = i % 2 ? .7 : 4.2; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * L, Math.sin(a) * L); } g.closePath(); g.fill(); });
  const hexRgb = (c) => { if (/^#[0-9a-f]{6}$/i.test(c)) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; } const m = String(c).match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/); return m ? [+m[1], +m[2], +m[3]] : [220, 220, 255]; };
  // a jagged line from A to B, its points displaced at random (rr) and to either side; returns a flat [x, y, ...] list
  function jag(rr, x0, y0, x1, y1, n, amp) {
    const pts = [x0, y0], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    for (let i = 1; i < n; i++) { const q = i / n, o = (rr() - .5) * 2 * amp * Math.sin(Math.PI * q) ** .6; pts.push(x0 + dx * q + nx * o, y0 + dy * q + ny * o); }
    pts.push(x1, y1); return pts;
  }
  function strokePts(pts) { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.stroke(); }
  // a bolt, with its branches: [main, ...branches] as point lists
  function forked(rr, x0, y0, x1, y1, nb) {
    const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(5, Math.min(12, Math.round(L / 12))), main = jag(rr, x0, y0, x1, y1, n, Math.min(16, 4 + L * .09)), out = [main];
    for (let b = 0; b < nb; b++) { const j = 1 + Math.floor(rr() * (n - 1)), px = main[j * 2], py = main[j * 2 + 1], a = Math.atan2(y1 - y0, x1 - x0) + (rr() < .5 ? -1 : 1) * (.5 + rr() * .6), l = L * (.18 + rr() * .2);
      out.push(jag(rr, px, py, px + Math.cos(a) * l, py + Math.sin(a) * l, 3, l * .25)); }
    return out;
  }
  function drawLightning(paths, col, a, wide) {
    const [r, g, b] = hexRgb(col), dark = (r * .3 + g * .59 + b * .11) < 90;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (dark) { // black lightning: an ink stroke with its colour burning down the middle
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a * .85; ctx.strokeStyle = '#08040C'; ctx.lineWidth = 3.6 * wide; paths.forEach(strokePts);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.strokeStyle = `rgb(${Math.min(255, r + 90)},${Math.min(255, g + 40)},${Math.min(255, b + 120)})`; ctx.lineWidth = 1.1 * wide; paths.forEach(strokePts); return; }
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a * .16; ctx.strokeStyle = `rgb(${r},${g},${b})`; ctx.lineWidth = 5 * wide; strokePts(paths[0]);
    ctx.globalAlpha = a * .75; ctx.lineWidth = 1.7 * wide; paths.forEach(strokePts);
    ctx.globalAlpha = a; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = .7 * wide; paths.forEach((p, i) => { if (!i || wide > .8) strokePts(p); });
  }
  // ---------------- blood, the tide, the abyss ----------------
  const dropSpr = (pal) => sprite('dr' + pal, 6, 9, 3, 5.5, (g) => { const D = DROP[pal];
    const path = () => { g.beginPath(); g.moveTo(0, -5); g.bezierCurveTo(.8, -2.6, 2.2, -.8, 2.2, .9); g.arc(0, .9, 2.2, 0, Math.PI); g.bezierCurveTo(-2.2, -.8, -.8, -2.6, 0, -5); g.closePath(); };
    g.fillStyle = D.body; path(); g.fill(); g.fillStyle = D.dk; g.beginPath(); g.arc(.4, 1.4, 1.6, 0, Math.PI); g.fill();
    g.strokeStyle = D.ink; g.lineWidth = .55; path(); g.stroke();
    g.fillStyle = D.hi; g.globalAlpha = .9; g.beginPath(); g.ellipse(-.8, .1, .55, .9, -.3, 0, TAU); g.fill(); });
  const splatSpr = (pal, v) => sprite('sp' + pal + v, 14, 6, 7, 3, (g) => { const D = DROP[pal], r = mulberry(v * 17 + 3);
    const q = [1, .8 + r() * .3, .9, .75 + r() * .3, 1.05, .85]; // a pool with a gently uneven edge
    const path = () => { g.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU, f = i / 4, j = Math.floor(f) % 6, m = q[j] + (q[(j + 1) % 6] - q[j]) * (f - Math.floor(f)); g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 4.6 * m, Math.sin(a) * 1.5 * m); } g.closePath(); };
    g.fillStyle = D.body; path(); g.fill(); g.strokeStyle = D.ink; g.lineWidth = .45; g.stroke();
    g.fillStyle = D.dk; g.beginPath(); g.ellipse(.6, .5, 3, .8, 0, 0, TAU); g.fill();
    g.fillStyle = D.body; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc((r() - .5) * 13, (r() - .5) * 4, .5 + r() * .5, 0, TAU); g.fill(); }
    g.fillStyle = D.hi; g.globalAlpha = .8; g.beginPath(); g.ellipse(-1.6, -.5, 1.2, .35, 0, 0, TAU); g.fill(); });
  // a curl of the abyss: dark violet smoke, a thread of sea-green light along its rim
  const wispSpr = (v) => sprite('wi' + v, 16, 16, 8, 8, (g) => {
    for (let i = 0; i < 3; i++) { const a = v * 2 + i * 2.2, x = Math.cos(a) * 2.4, y = Math.sin(a) * 2, rr = 3.4 + i * .6;
      const q = g.createRadialGradient(x, y, 0, x, y, rr); q.addColorStop(0, 'rgba(26,16,52,.85)'); q.addColorStop(.75, 'rgba(46,30,90,.55)'); q.addColorStop(1, 'rgba(46,30,90,0)'); g.fillStyle = q; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
    g.strokeStyle = 'rgba(120,236,204,.85)'; g.lineWidth = .55; g.beginPath(); g.arc(0, 0, 4.2, v * 1.3, v * 1.3 + 2.2); g.stroke();
    g.strokeStyle = 'rgba(190,170,255,.5)'; g.beginPath(); g.arc(.6, .4, 2.4, v * 1.3 + 3, v * 1.3 + 4.6); g.stroke(); });

  // ---------------- particles ----------------
  const MINE = new Set(['flame', 'ember', 'smoke', 'flake', 'ice', 'spark', 'drop', 'wisp']);
  const AIRY = new Set(['flame', 'ember', 'smoke', 'flake', 'spark', 'wisp']); // these go out when they touch the floor
  const now = () => performance.now() / 1000;
  function drawMine(p) {
    const x = p.x, y = p.y - p.z, age = 1 - p.life / p.max, fade = p.rest ? Math.min(1, p.life / .6) : Math.min(1, p.life / Math.min(.3, p.max));
    switch (p.shape) {
      case 'flame': { // a lick of flame thrown off: swells, then shrinks to nothing as it rises; flickers through its poses
        const s = p.size / 36 * Math.sin(Math.PI * Math.min(1, .25 + age * .9)), v = (Math.floor(now() * 14 + p.rot * 3) % 6 + 6) % 6;
        ctx.globalAlpha = Math.min(1, fade * 1.4); put(flameSprite(p.pal || 'fire', v), x, y + p.size * .25 * s, s, clamp(-p.vx * .004, -.6, .6) + (p.lean || 0)); break; }
      case 'ember': { const sp = Math.hypot(p.vx, p.vz), a = Math.atan2(p.vz, -p.vx);
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fade * (.75 + .25 * Math.sin(now() * 30 + p.rot * 9));
        put(emberSpr(p.pal || 'fire'), x, y, p.size * .55, a, clamp(.4 + sp * .006, .4, 1.6), 1); ctx.globalCompositeOperation = 'source-over'; break; }
      case 'smoke': ctx.globalAlpha = fade * .7 * (1 - age * .5); put(smokeSpr(p.rgb || FIRE[p.pal || 'fire'].smoke, Math.abs(p.rot * 3 | 0) % 3), x, y, p.size * (.5 + age * 1.1) / 8, p.rot); break;
      case 'flake': ctx.globalAlpha = fade; put(flakeSpr(Math.abs(p.rot * 7 | 0) % 3), x, y, p.size / 6, p.rot, 1, .55 + .45 * Math.abs(Math.cos(p.rot * 1.3))); break;
      case 'ice': ctx.globalAlpha = fade; put(shardSpr(Math.abs(p.v | 0) % 3, p.tint), x, p.rest ? p.y - 1 : y, p.size / 6, p.rest ? (p.rot > 0 ? 1.45 : -1.45) : p.rot, 1, p.rest ? .6 : .5 + .5 * Math.abs(Math.cos(p.rot * .8))); break;
      case 'spark': { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fade;
        const [r, g, b] = hexRgb(p.col || '#E8E0FF'); ctx.strokeStyle = `rgb(${r},${g},${b})`; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - p.vx * .035, y + p.vz * .035); ctx.stroke();
        put(sparkSpr(`${r},${g},${b}`), x, y, p.size / 4 * (.7 + .3 * Math.sin(now() * 40 + p.rot * 5)), p.rot); ctx.globalCompositeOperation = 'source-over'; break; }
      case 'drop': ctx.globalAlpha = fade;
        if (p.rest) put(splatSpr(p.pal || 'blood', (p.rot * 5 | 0) & 1), x, p.y, p.size * .45 * (1 + Math.min(.4, (p.max - p.life) * 2)));
        else put(dropSpr(p.pal || 'blood'), x, y, p.size * .4, Math.atan2(p.vx, p.vz) + Math.PI, 1, 1 + Math.min(.6, Math.hypot(p.vx, p.vz) * .002));
        break;
      case 'wisp': ctx.globalAlpha = Math.min(1, fade * 1.6); put(wispSpr(Math.abs(p.rot * 3 | 0) % 3), x, y, p.size / 3.4 * (.75 + age * .5), p.rot + age * 2); break;
    }
    ctx.globalAlpha = 1;
  }
  const room = () => parts.length < 420;
  const P_ = (o) => { if (room()) { o.max = o.life; parts.push(o); } return o; };
  // one particle of an element: what = 'flame' | 'ember' | 'smoke' (fire, black or white), and the rest
  function flameP(x, y, z, size, pal, vx = 0, vz = 0) { return P_({ x, y, z, vx: vx + rand(-14, 14), vy: rand(-4, 4), vz: vz + rand(10, 40), life: rand(.3, .5), col: '#FF8A4A', size, shape: 'flame', pal, rot: rand(0, 6), vr: 0, lift: .96 }); }
  function emberP(x, y, z, pal, sp = 1) { const a = rand(0, TAU); return P_({ x, y, z, vx: Math.cos(a) * rand(30, 120) * sp, vy: rand(-10, 10), vz: rand(40, 200) * sp, life: rand(.5, 1.1), col: '#FFC860', size: rand(2.2, 3.6), shape: 'ember', pal, rot: rand(0, 6), vr: 0, lift: .82 }); }
  function smokeP(x, y, z, pal) { return P_({ x, y, z, vx: rand(-12, 12), vy: 0, vz: rand(18, 40), life: rand(.7, 1.1), col: '#444', size: rand(5, 8), shape: 'smoke', pal, rot: rand(0, 6), vr: rand(-1, 1), lift: 1 }); }
  function flakeP(x, y, z, sp = 1) { const a = rand(0, TAU); return P_({ x, y, z, vx: Math.cos(a) * rand(20, 90) * sp, vy: rand(-8, 8), vz: rand(20, 140) * sp, life: rand(.7, 1.3), col: '#FFFFFF', size: rand(2.6, 4.4), shape: 'flake', rot: rand(0, 6), vr: rand(-4, 4), lift: .9 }); }
  function iceP(x, y, z, sp = 1, dir = 0, tint) { const a = rand(0, TAU), s = rand(80, 230) * sp; return P_({ x, y, z, vx: Math.cos(a) * s + dir * rand(30, 120), vy: Math.sin(a) * s * .2, vz: rand(90, 300) * sp, life: rand(1.1, 1.9), col: '#9FE0FF', size: rand(2.6, 5), shape: 'ice', v: rand(0, 3) | 0, tint, rot: rand(0, 6), vr: rand(-14, 14), rest: false }); }
  function sparkP(x, y, z, col, sp = 1, dir = 0) { const a = rand(0, TAU), s = rand(120, 320) * sp; return P_({ x, y, z, vx: Math.cos(a) * s + dir * 60, vy: rand(-20, 20), vz: Math.sin(a) * s * .7 + 60, life: rand(.14, .3), col, size: rand(2.4, 4), shape: 'spark', rot: rand(0, 6), vr: 0, lift: .7 }); }
  function dropP(x, y, z, pal, sp = 1, dir = 0) { const a = rand(0, TAU); return P_({ x, y, z, vx: Math.cos(a) * rand(30, 110) * sp + dir * rand(20, 80), vy: rand(-12, 12), vz: rand(40, 190) * sp, life: rand(1, 1.6), col: '#B01E2E', size: rand(1.8, 3), shape: 'drop', pal, rot: rand(0, 6), vr: 0, rest: false }); }
  function mistP(x, y, z, size) { return P_({ x, y, z, vx: rand(-25, 25), vy: 0, vz: rand(5, 25), life: rand(.5, .7), col: '#E0F4FF', size, shape: 'smoke', rgb: '225,245,255', rot: rand(0, 6), vr: rand(-1, 1), lift: .9 }); }
  function wispP(x, y, z, vx = 0, vy = 0) { return P_({ x, y, z, vx: vx + rand(-20, 20), vy, vz: rand(10, 40), life: rand(.45, .8), col: '#2A1C50', size: rand(4, 7), shape: 'wisp', rot: rand(0, 6), vr: 0, lift: 1 }); }

  // ---------------- bursts ----------------
  const ELM = new Set(['fire', 'frost', 'storm', 'blood', 'void', 'tide']);
  const bloom = (el, x, y, z, r, col, pal) => { if (fx.length < 60) fx.push({ kind: 'elb', el, x, y, z, r, col, pal, t: el === 'storm' ? .2 : .32, max: el === 'storm' ? .2 : .32, seed: rand(0, 99) }); };
  function emit(x, y, z, cols, n, mat, dir = 0, big) {
    cols = Array.isArray(cols) ? cols : [cols]; n = Math.round(n * (busy() ? .6 : 1)); const sp = big ? 1.25 : 1;
    if (mat === 'fire') {
      const pal = cols.some(c => /^#(0|1|2|3)/.test(c)) && !cols.some(c => /^#F/i.test(c)) ? 'black' : 'fire';
      if (n >= 4) bloom('fire', x, y, z, big ? 26 : 16, null, pal);
      for (let i = 0; i < n; i++) { const k = i % 5;
        if (k < 2) flameP(x + rand(-10, 10), y + rand(-3, 3), z + rand(-6, 8), rand(12, big ? 24 : 18), pal, rand(-90, 90) + dir * 50, rand(0, 50));
        else if (k < 4) emberP(x, y, z, pal, sp); else smokeP(x + rand(-6, 6), y, z + rand(0, 10), pal); }
    } else if (mat === 'frost') {
      if (n >= 6) bloom('frost', x, y, z, big ? 28 : 18);
      for (let i = 0; i < n; i++) { if (i % 3 === 1) flakeP(x, y, z, sp); else iceP(x, y, z, sp * .8, dir); }
      for (let i = 0; i < 2; i++) mistP(x + rand(-8, 8), y, z + rand(-6, 6), rand(6, 9));
    } else if (mat === 'storm') {
      const col = cols.find(c => c !== '#FFFFFF') || '#E8E0FF';
      bloom('storm', x, y, z, big ? 30 : 20, col);
      for (let i = 0; i < n; i++) sparkP(x, y, z, i % 3 ? col : '#FFFFFF', sp, dir);
    } else if (mat === 'blood') { for (let i = 0; i < n; i++) dropP(x, y, z, 'blood', sp, dir); }
    else if (mat === 'tide') { for (let i = 0; i < n; i++) dropP(x, y, z, 'water', sp, dir); }
    else if (mat === 'void') { for (let i = 0; i < n; i++) { const a = rand(0, TAU); wispP(x + Math.cos(a) * 30, y + Math.sin(a) * 10, z + rand(-10, 20), -Math.cos(a) * 90, -Math.sin(a) * 20); } }
  }
  { const _b = burst; burst = function (x, y, z, cols, n, mat, dir, big) { if (ELM.has(mat)) return emit(x, y, z, cols, n, mat, dir, big); return _b(x, y, z, cols, n, mat, dir, big); }; }
  { const _dp = drawPart; drawPart = function (p) { if (!MINE.has(p.shape)) return _dp(p); FAST.on = true; try { drawMine(p); } finally { FAST.on = false; } }; }

  // ---------------- the bolt, and the blooms ----------------
  function drawBolt(f) {
    const k = f.t / f.max, a = Math.min(1, k * 1.6), fr = Math.floor(f.t * 30), L = Math.hypot(f.x2 - f.x, (f.y2 - f.z2) - (f.y - f.z)), nb = busy() ? 1 : L > 60 ? 2 : 1;
    const x0 = f.x, y0 = f.y - f.z, x1 = f.x2, y1 = f.y2 - f.z2;
    ctx.save();
    if (!busy()) drawLightning(forked(mulberry(Math.floor(f.seed * 1000) + fr + 1), x0, y0, x1, y1, 0), f.col, a * .35, .7); // the afterimage of the last flicker
    drawLightning(forked(mulberry(Math.floor(f.seed * 1000) + fr), x0, y0, x1, y1, nb), f.col, a, 1);
    const [r, g, b] = hexRgb(f.col), rgb = `${r},${g},${b}`;
    if (r * .3 + g * .59 + b * .11 >= 90) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * .8; const G = glowSpr(rgb); put(G, x0, y0, 14); put(G, x1, y1, 18); put(sparkSpr(rgb), x1, y1, 1.2 + k, fr); }
    ctx.restore();
  }
  function drawBloom(f) {
    const k = f.t / f.max, e = 1 - k, x = f.x, y = f.y - f.z;
    ctx.save();
    if (f.el === 'fire') {
      // a gout of flame: tongues flung out round the heart of it, all of them bending up as fire does, a hot glow under them
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, k * 1.3); put(glowSpr(FIRE[f.pal || 'fire'].glow), x, y, f.r * (1.1 + e * .8));
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      const n = busy() ? 5 : 7, sw = Math.sin(Math.PI * Math.min(1, e * 1.3 + .12));
      for (let i = 0; i < n; i++) { const j = hash(f.seed + i), a = f.seed + (i + j * .7) / n * TAU, d = f.r * (.1 + (.45 + .4 * j) * e), s = f.r / 32 * sw * (.45 + .75 * hash(f.seed * 3 + i));
        put(flameSprite(f.pal || 'fire', (i + Math.floor(e * 9)) % 6), x + Math.cos(a) * d, y + Math.sin(a) * d * .5 + 10 * s, s, Math.cos(a) * (.4 + .5 * j) * (1 - e * .4)); }
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k * k; put(glowSpr('255,240,200'), x, y, f.r * .7);
    } else if (f.el === 'frost') {
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k * .7; put(glowSpr('190,232,255'), x, y, f.r * (1 + e * .6));
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = Math.min(1, k * 2);
      const n = busy() ? 5 : 8;
      for (let i = 0; i < n; i++) { const a = f.seed + i / n * TAU, g = Math.min(1, e * 3), d = f.r * (.25 + .45 * g); put(shardSpr(i % 3), x + Math.cos(a) * d, y + Math.sin(a) * d * .8, f.r / 22 * (i % 2 ? .65 : 1) * (.5 + .5 * g), a + Math.PI / 2, 1, 1); }
      ctx.strokeStyle = 'rgba(235,250,255,.9)'; ctx.lineWidth = 1.4 * k; ctx.beginPath(); ctx.ellipse(x, y, f.r * (.6 + e), f.r * (.6 + e) * .8, 0, 0, TAU); ctx.stroke();
    } else if (f.el === 'storm') {
      const [r, g, b] = hexRgb(f.col), rgb = `${r},${g},${b}`, rr = mulberry(Math.floor(f.seed * 100) + Math.floor(f.t * 40));
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k * .8; put(glowSpr(rgb), x, y, f.r * 1.1); put(sparkSpr(rgb), x, y, 1.2 + e * 1.4, f.seed);
      const n = busy() ? 2 : 4, paths = [];
      for (let i = 0; i < n; i++) { const a = f.seed + i / n * TAU + rr() * .6, l = f.r * (.7 + rr() * .7); paths.push(jag(rr, x, y, x + Math.cos(a) * l, y + Math.sin(a) * l * .8, 4, l * .22)); }
      drawLightning(paths, f.col, k * .8, .6);
    }
    ctx.restore();
  }
  { const _df = drawFx; drawFx = function (f) { if (f.kind === 'bolt') return drawBolt(f); if (f.kind === 'elb') return drawBloom(f); return _df(f); }; }

  // ---------------- a foe's state: burning, chilled, frozen, shocked ----------------
  const front = []; // drawn after the figure layer is laid on the page (inkEnd), in front of the figures
  { const _ib = inkBegin; inkBegin = function (boxes) { front.length = 0; return _ib(boxes); }; }
  { const _ie = inkEnd; inkEnd = function (...a) { const r = _ie(...a); if (front.length) { const L = front.splice(0); for (const f of L) { try { f(); } catch (err) { console.error(err); } } ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; } return r; }; }
  const inInk = () => typeof inkG !== 'undefined' && inkG && ctx === inkG;
  // flame tongues licking up a body: across its width, from its feet to its shoulders, the tallest in the middle
  function tongues(e, t, x, foot, w, h, pal, k, back) {
    const n = busy() ? (back ? 2 : 3) : 4, sd = e._sd, H = Math.max(h, 30);
    for (let i = 0; i < n; i++) {
      const u = (i + .5) / n * 2 - 1 + (hash(sd + i) - .5) * .3, j = hash(sd + i * 3 + (back ? 7 : 0)), ph = j * 6;
      const hgt = H * (back ? .85 : .58) * (1 - Math.abs(u) * .3) * (.78 + .28 * Math.sin(t * 11 + ph)) * (.75 + .5 * j) * k, s = hgt / 36;
      const bx = x + u * w * (back ? .9 : .7) + Math.sin(t * 7 + ph) * 1.5, by = foot - h * (back ? j * .22 : .02 + j * .45);
      ctx.globalAlpha = back ? .95 : .9; put(flameSprite(pal, (Math.floor(t * 13 + ph * 2) % 6 + 6) % 6), bx, by, s, u * .25 + Math.sin(t * 5 + ph) * .1);
    }
  }
  function status(e, t, scale) {
    if (e.dead) { e._zap = 0; return; }
    const burn = e.burn > 0 || (e.cwBurn && e.cwBurn.t > 0), chill = e.chill > 0 || e.frozen > 0, zap = e._zap > 0;
    if (!burn && !chill && !zap) { if (e._fzA) e._fzA = 0; if (e._chA) e._chA = 0; return; }
    if (e._sd === undefined) e._sd = Math.random() * 100;
    const sc = scale || 1, w = e.hw * sc, h = e.hh * sc, x = e.x, foot = e.y - e.z, top = foot - h, ink = inInk(), dl = busy();
    if (burn) {
      const pal = e.burn > 0 ? 'fire' : 'black', k = Math.min(1, (e.burn > 0 ? e.burn : e.cwBurn.t) / .4);
      // behind: the heat's glow and the taller tongues rising behind the body
      // (in a crowd, or the lighter paint, only a boss keeps these: the glow is a lot of pixels for each of many foes)
      if (!dl || e.boss) onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k * (.55 + .12 * Math.sin(t * 9 + e._sd)); put(glowSpr(FIRE[pal].glow), x, foot - h * .4, Math.max(w * 1.4, h * .65));
        ctx.globalCompositeOperation = 'source-over'; tongues(e, t, x, foot, w, h, pal, k, true); ctx.restore(); });
      // on the body: firelight washing up it from below
      if (ink) { ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.globalAlpha = k * (.5 + .12 * Math.sin(t * 13 + e._sd)); put(washSpr(pal === 'fire' ? 'f' : 'b', pal === 'fire' ? '255,120,40' : '60,10,70', .85, 0), x - w - 4, foot + 2, 1, 0, (w * 2 + 8), (h * .9) / 32); ctx.restore(); }
      front.push(() => { ctx.save(); tongues(e, t, x, foot, w, h, pal, k, false); ctx.restore(); });
    }
    if (chill) {
      if (!e._chA) e._chA = t; const grow = Math.min(1, (t - e._chA) / .5), k = Math.min(1, Math.max(e.chill || 0, e.frozen || 0) / .4);
      const cover = e.frozen > 0 ? 1 : (.5 + .17 * Math.min(3, e.frost || 0)) * grow;
      if (ink) { ctx.save(); ctx.globalCompositeOperation = 'source-atop';
        ctx.globalAlpha = k * (e.frozen > 0 ? .75 : .55); put(washSpr('c', '170,220,255', .8, .15), x - w - 4, foot + 2, 1, 0, w * 2 + 8, (h + 6) * Math.max(.4, cover) / 32);
        // rime creeping up from the feet, caught only on the body itself: a crust of hoarfrost, needles of frost on it
        ctx.globalAlpha = k * .9;
        for (let i = 0, m = dl ? 2 : 4; i < m; i++) { const v = (i + .3) / m * cover * .9; put(crustSpr(i % 3), x + (hash(e._sd + i * 5) - .5) * w * .9, foot - v * h, Math.max(w * 1.3, 18) / 24, (hash(i) - .5) * .6); }
        const n = dl ? 7 : 13; ctx.globalAlpha = k;
        for (let i = 0; i < n; i++) { const v = hash(e._sd + i * 1.7); if (v > cover) continue; const u = hash(e._sd + i * 2.3) * 2 - 1;
          put(rimeSpr(i % 3), x + u * w * .85, foot - v * h, (10 + hash(i + e._sd) * 8) / 14 * (.6 + .4 * Math.min(1, (cover - v) * 4 + .2)), i); }
        ctx.restore();
      } else { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k * .28; ctx.fillStyle = 'rgb(140,200,255)'; ell(x, foot - h / 2, w + 6, h / 2 + 6); ctx.fill(); ctx.restore(); }
      if (e.frozen > 0) { // the block of ice it is held in, rising round it in a moment
        if (!e._fzA) e._fzA = t; const g = Math.min(1, (t - e._fzA) / .16), S = iceSpr(w * 2 + 12, h + 10), k2 = Math.min(1, e.frozen / .25);
        ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = .92 * k2;
        if (g >= 1) put(S, x, foot + 3, 1); else { const sh = S.c.height * g; ctx.drawImage(S.c, 0, S.c.height - sh, S.c.width, sh, x - S.ax, foot + 3 - S.ay + S.h * (1 - g), S.w, S.h * g); }
        ctx.restore();
        front.push(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const q = ((t * .45 + hash(e._sd)) % 1); if (q < .35) { const s = q / .35; ctx.globalAlpha = Math.sin(Math.PI * s) * k2;
          put(sparkSpr('200,240,255'), x - w * .3 + w * 1.1 * s, top - 2 + h * .35 * s, 1.1, s * 2); } ctx.restore(); });
      } else e._fzA = 0;
    } else e._chA = 0;
    if (zap) { // a shocked foe: a violet-white flicker over it and arcs crackling from point to point on it
      const k = Math.min(1, e._zap / .25), fr = Math.floor(t * 24), on = (fr + (e._sd | 0)) % 3 !== 0;
      if (ink && on) { ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.globalAlpha = .4 * k; put(washSpr('z', '230,225,255', .9, .5), x - w - 4, foot + 2, 1, 0, w * 2 + 8, (h + 6) / 32); ctx.restore(); }
      const col = e._zc || '#E8E0FF';
      front.push(() => { ctx.save(); const rr = mulberry(fr * 13 + (e._sd * 100 | 0)), n = dl ? 1 : 2, paths = [];
        for (let i = 0; i < n; i++) { const a0 = rr() * TAU, a1 = a0 + 1.5 + rr() * 2.5, R = (q) => [x + Math.cos(q) * w * (.6 + rr() * .4), foot - h * .5 + Math.sin(q) * h * .45];
          const [ax, ay] = R(a0), [bx, by] = R(a1); paths.push(jag(rr, ax, ay, bx, by, 5, 6)); }
        drawLightning(paths, col, k * (on ? 1 : .5), .65); ctx.restore(); });
    }
  }

  // ---------------- each frame: lift, splashes, thaw, crackle ----------------
  { const _uf = updateFx; updateFx = function (dt) {
    for (const p of parts) if (p.lift && !p.rest) { p.vz += GRAV * .9 * dt * p.lift; if (p.shape === 'flame' || p.shape === 'smoke' || p.shape === 'wisp') { p.vx *= 1 - Math.min(1, dt * 3); p.vy *= 1 - Math.min(1, dt * 3); }
      else if (p.shape === 'ember') p.vx += Math.sin(p.life * 9 + p.rot) * 160 * dt; else if (p.shape === 'flake') p.vx += Math.sin(p.life * 6 + p.rot) * 90 * dt; }
    _uf(dt);
    for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; if (!p.rest) continue;
      if (AIRY.has(p.shape)) p.life = 0;
      else if (p.shape === 'drop' && !p.spl) { p.spl = 1; p.life = Math.max(p.life, .9); p.max = Math.max(p.max, p.life); p.z = 0; // a drop lands: it splats, and a fleck or two jumps off
        if (!busy()) for (let j = 0; j < 2 && room(); j++) parts.push({ x: p.x, y: p.y, z: 1, vx: rand(-50, 50), vy: rand(-6, 6), vz: rand(50, 90), life: .3, max: .3, col: '#B01E2E', size: p.size * .45, shape: 'drop', pal: p.pal, rot: p.rot, vr: 0, rest: false, spl: 1 }); } }
    parts = parts.filter(p => p.life > 0);
    for (const f of fx) if (f.kind === 'bolt' && !f._zp) { f._zp = 1; // whoever a bolt touches crackles with it a moment after
      for (const e of enemies) if (!e.dead && (Math.abs(e.x - f.x2) < 26 && Math.abs(e.y - f.y2) < 20 || Math.abs(e.x - f.x) < 26 && Math.abs(e.y - f.y) < 20)) { e._zap = .75; e._zc = f.col; } }
    const crowd = busy();
    for (const e of enemies) {
      if (e._zap > 0) { e._zap -= dt; if (!crowd && Math.random() < dt * 10) sparkP(e.x + rand(-e.hw, e.hw), e.y, e.z + rand(0, e.hh), e._zc || '#E8E0FF', .4); }
      const fz = e.frozen > 0 && !e.dead;
      if (e._fz && !fz) { // the ice breaks: it bursts off in shards, a puff of cold
        const cy = e.z + e.hh * .5; for (let i = 0, n = crowd ? 8 : 14; i < n; i++) { const q = iceP(e.x + rand(-e.hw, e.hw), e.y + rand(-3, 3), cy + rand(-e.hh * .4, e.hh * .4), .9); q.size *= 1.35; }
        for (let i = 0; i < 3; i++) mistP(e.x + rand(-e.hw, e.hw), e.y, cy + rand(-10, 10), rand(8, 12)); }
      e._fz = fz;
      if (!crowd && !e.dead && e.chill > 0 && !(e.frozen > 0) && Math.random() < dt * 3) flakeP(e.x + rand(-e.hw, e.hw), e.y, e.z + e.hh * rand(.3, .9), .2);
    }
  }; }

  // ---------------- a branded weapon's swing ----------------
  const brandCol = () => typeof brandT !== 'undefined' && brandT > 0 && typeof ELEMENTS !== 'undefined' ? `rgba(${ELEMENTS[brandEl].rgb},.95)` : null;
  // pts: [x, y, nx, ny] along the swing, tail first; drawn in the figure's own space
  function dressTrail(pts, el) {
    const t = now(), n = pts.length; if (n < 2) return;
    ctx.save();
    if (el === 'fire') { ctx.globalAlpha = .95;
      for (let i = 0; i < n; i++) { const [x, y, nx, ny] = pts[i], k = (i + 1) / n, s = (9 + 20 * k) / 36 * (.8 + .2 * Math.sin(t * 20 + i * 2.3));
        put(flameSprite('fire', (Math.floor(t * 14) + i) % 6), x - nx * 3, y - ny * 3, s, Math.atan2(ny - 1.3, nx) + Math.PI / 2); } // (licking outward off the edge, and up, as flame does)
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .5; const [lx, ly] = pts[n - 1]; put(glowSpr(FIRE.fire.glow), lx, ly, 16);
    } else if (el === 'frost') {
      for (let i = 0; i < n; i++) { const [x, y, nx, ny] = pts[i], k = (i + 1) / n; ctx.globalAlpha = .6 + .4 * k;
        put(shardSpr(i % 3), x + nx * 4, y + ny * 4, (.5 + .7 * k) * 1.2, Math.atan2(ny, nx) + Math.PI / 2); if (i % 2) put(flakeSpr(i % 3), x - nx * 5, y - ny * 5, .9 * k, t * 3 + i); }
      ctx.strokeStyle = 'rgba(240,252,255,.85)'; ctx.lineWidth = 1.1; ctx.beginPath(); pts.forEach(([x, y, nx, ny], i) => ctx[i ? 'lineTo' : 'moveTo'](x + nx * 5, y + ny * 5)); ctx.stroke();
    } else if (el === 'storm') {
      const rr = mulberry(Math.floor(t * 30)), paths = [];
      for (let p = 0; p < 2; p++) { const q = []; for (let i = 0; i < n; i++) { const [x, y, nx, ny] = pts[i], o = (rr() - .5) * 18; q.push(x + nx * o, y + ny * o); } paths.push(q); }
      drawLightning(paths, ELEMENTS.storm.col, 1, 1);
      const [lx, ly] = pts[n - 1]; ctx.globalCompositeOperation = 'lighter'; put(sparkSpr('232,224,255'), lx, ly, 1.5, t * 9);
    }
    ctx.restore();
  }
  { const _dt = drawTrail; drawTrail = function (cx, cy, pose) { _dt(cx, cy, pose); const bc = brandCol(); if (!bc || pose.trailCol !== bc) return;
    const a0 = pose.trailFrom, a1 = pose.arm, r = pose.trail; if (Math.abs(a1 - a0) < .05) return; const n = busy() ? 5 : 9, pts = [];
    for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * (.15 + .85 * i / (n - 1)), c = Math.cos(a), s = Math.sin(a); pts.push([cx + c * r, cy + s * r, c, s]); }
    onPage(() => dressTrail(pts, brandEl)); }; }
  { const _dft = drawFlatTrail; drawFlatTrail = function (cx, cy, f) { _dft(cx, cy, f); const bc = brandCol(); if (!bc || f.col !== bc) return;
    const n = busy() ? 5 : 8, pts = [], A0 = f.rev ? Math.PI : 0, A1 = f.rev ? Math.PI * (1 - f.k) : Math.PI * f.k;
    for (let i = 0; i < n; i++) { const a = A0 + (A1 - A0) * (.1 + .9 * i / (n - 1)), c = Math.cos(a), s = Math.sin(a), L = Math.hypot(c, s * 3.3) || 1; pts.push([cx + c * f.r, cy + 6 + s * f.r * .3, c / L, s * 3.3 / L]); }
    onPage(() => dressTrail(pts, brandEl)); }; }
  // a thrust's streak (art.js): along the line of the thrust, in the arm's own space
  function streak(x0, x1, st) { const bc = brandCol(); if (!bc || st.col !== bc || !(st.a > .05)) return;
    const n = busy() ? 4 : 6, pts = []; for (let i = 0; i < n; i++) pts.push([x0 + (x1 - x0) * i / (n - 1), 0, 0, -1]);
    onPage(() => { ctx.save(); ctx.globalAlpha = Math.min(1, st.a * 1.2); dressTrail(pts, brandEl); ctx.restore(); }); }

  // ---------------- for the rest of the game ----------------
  return {
    status, emit, streak, flameP, emberP, smokeP, flakeP, iceP, sparkP, dropP, wispP,
    // a burning foe's sparks and smoke, in place of the old puffs (as often as they were)
    burning(e, pal = 'fire') { const r = Math.random(), x = e.x + rand(-e.hw, e.hw) * .6, z = e.z + rand(e.hh * .1, e.hh * .9);
      if (r < .55) P_({ x, y: e.y, z, vx: rand(-25, 25), vy: 0, vz: rand(60, 150), life: rand(.4, .7), col: '#FFC860', size: rand(2, 3.2), shape: 'ember', pal, rot: rand(0, 6), vr: 0, lift: .9 });
      else if (r < .75 && !busy()) smokeP(x, e.y, e.z + e.hh * rand(.7, 1), pal); },
    // the brand's element shed from the weapon as it is carried
    shed(el, x, y, z) {
      if (el === 'fire') { if (Math.random() < .5) flameP(x, y, z, rand(8, 13), 'fire', 0, 20); else P_({ x, y, z, vx: rand(-25, 25), vy: 0, vz: rand(60, 120), life: rand(.4, .7), col: '#FFC860', size: rand(2, 3), shape: 'ember', pal: 'fire', rot: rand(0, 6), vr: 0, lift: .9 }); }
      else if (el === 'frost') P_({ x, y, z, vx: rand(-15, 15), vy: 0, vz: rand(-10, 10), life: rand(.6, 1), col: '#FFFFFF', size: rand(2.2, 3.6), shape: 'flake', rot: rand(0, 6), vr: rand(-3, 3), lift: .93 });
      else sparkP(x, y, z, ELEMENTS.storm.col, .45);
    },
  };
})();
