'use strict';
// ---------- Shadow rooms: what waits behind a card gate is dealt fresh every time ----------
// A card gate opens on a room that is generated from a seed. The seed deals, in order:
//   a kind of room   (a fight in the lists, a horde to hold off, your own shadow, a champion, a gauntlet to run, a shrine
//                     that asks a price, a pedlar's stall, three face-down cards, stones that sing a tune to repeat, a
//                     golden quarry to chase; or one of the four old rooms: the Hall of Cards, the Unicorn's grove,
//                     the drowned vault and Eric's duel)
//   a place          (a palette and a mood, a sky with something strange in it, a landmark on the horizon, what stands
//                     along the road, and the floor), painted once into the same cached layers as every other place
//   strange rules    (weightless, lightless, rime, giants, lilliput, quicksilver foes, glass, volatile, hydra, storm,
//                     embers, against the clock, bounty, blessed) that change the fight and raise or lower the reward
//   a name           ("The Lightless Arena of Bleys", "Fiona's Moonlit Shrine"...), a tune of its own, and the reward,
//                     which scales with the world, the cycle and how hard the rules make it.
// For testing: window.__roomSeed = 1234 (and/or window.__forceRoom = 'arena') before the gate opens, or ?room=1234 or
// ?room=1234:puzzle in the address; srTest(seed, kind) jumps straight into one from anywhere in a stage.
const SR = { hooked: false, theme: null };
function srRng(seed) {
  const f = mulberry(seed >>> 0);
  return { f, n: (a, b) => a + f() * (b - a), i: (a, b) => a + Math.floor(f() * (b - a + 1)), pick: (a) => a[Math.floor(f() * a.length)], chance: (p) => f() < p,
    shuffle: (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    weighted: (o) => { let s = 0; for (const k in o) s += o[k]; let x = f() * s; for (const k in o) { x -= o[k]; if (x <= 0) return k; } return Object.keys(o)[0]; } };
}
// ---------------- color ----------------
function srHex(h, s, l) {
  h = ((h % 360) + 360) % 360; s = clamp(s, 0, 100) / 100; l = clamp(l, 0, 100) / 100;
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}
const srRgb = (hex) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(',');
const SR_MOODS = { // lightness and saturation of the four bands of sky, top to horizon, and how far each band's hue turns
  dusk:  { L: [16, 32, 58, 80], S: [30, 34, 46, 60], hz: [0, 25, 150, 175], stars: .3, adj: ['Twilit', 'Gloaming'] },
  night: { L: [7, 14, 28, 44], S: [40, 38, 34, 40], hz: [0, 10, 30, 60], stars: 1, adj: ['Midnight', 'Nocturnal'] },
  day:   { L: [46, 60, 74, 88], S: [30, 34, 36, 44], hz: [0, -10, -30, 30], stars: 0, adj: ['Bright', 'Noonday'] },
  ember: { L: [10, 24, 46, 72], S: [50, 60, 70, 80], hz: [0, 10, 25, 40], stars: .2, hue: [330, 40], adj: ['Ember', 'Smouldering'] },
  abyss: { L: [5, 11, 22, 36], S: [50, 50, 45, 50], hz: [0, 0, 20, 40], stars: .6, adj: ['Abyssal', 'Sunken'] },
  pale:  { L: [60, 70, 80, 90], S: [14, 16, 22, 30], hz: [0, 20, 40, 60], stars: 0, adj: ['Pale', 'Bleached'] },
  storm: { L: [18, 28, 42, 60], S: [12, 14, 18, 26], hz: [0, 0, 10, 20], stars: 0, adj: ['Grey', 'Thunderous'] },
  deep:  { L: [8, 18, 34, 52], S: [60, 55, 50, 45], hz: [0, -10, -20, -30], stars: 0, hue: [170, 230], adj: ['Drowned', 'Fathomless'] },
  vivid: { L: [20, 38, 56, 74], S: [70, 72, 75, 80], hz: [0, 40, 90, 140], stars: .4, adj: ['Fevered', 'Painted'] },
  void:  { L: [3, 6, 11, 20], S: [20, 30, 40, 50], hz: [0, 20, 40, 60], stars: .5, adj: ['Empty', 'Starless'] },
};
function srPalette(G) {
  const r = G.r, mood = G.forceMood || r.pick(Object.keys(SR_MOODS)), M = SR_MOODS[mood];
  const H = M.hue ? (M.hue[0] + r.n(0, (M.hue[1] - M.hue[0] + 360) % 360)) % 360 : r.n(0, 360), acc = H + r.pick([150, 180, 210, 120, 240, 60]);
  const sky = M.L.map((l, i) => srHex(H + M.hz[i], M.S[i], l)), lo = M.L[0] < 30;
  const far = srHex(H + 15, M.S[1] * .6 + 6, lerp(M.L[1], M.L[2], .45) * .85 + 4), farLit = srHex(H + M.hz[3], M.S[3] * .9, Math.min(88, M.L[3] + 2));
  const farDark = srHex(H + 10, M.S[1] * .5 + 8, lerp(M.L[0], M.L[1], .6) + 4);
  const mH = H + r.n(-40, 40), gH = H + r.n(-70, 70), leafH = r.chance(.5) ? r.n(70, 160) : H + r.n(-50, 50);
  const midL = clamp(M.L[1] * .7 + 8, 10, 46);
  const p = {
    mood, H, sky, far, farLit, farDark, hazeRgb: srRgb(srHex(H + M.hz[2], M.S[2] * .8, clamp(M.L[2] + 6, 20, 86))),
    mid: { dark: srHex(mH, 22, midL * .55), base: srHex(mH, 26, midL), lit: srHex(H + M.hz[3], M.S[3] * .9 + 10, clamp(M.L[3] + 2, 55, 90)) },
    stone: { base: srHex(mH + 10, 14, midL + 14), lit: srHex(H + M.hz[3], 40, clamp(M.L[3] + 4, 60, 90)), dark: srHex(mH, 18, midL * .5 + 4), mortar: srHex(mH, 20, midL * .4 + 2) },
    ground: { a: srHex(gH, 24, lo ? 34 : 44), b: srHex(gH + 10, 26, lo ? 14 : 22), c: srHex(gH - 15, 30, lo ? 26 : 36), lit: srHex(H + M.hz[3], 34, clamp(M.L[3] + 2, 58, 88)) },
    leaf: [srHex(leafH, 30, lo ? 18 : 24), srHex(leafH + 8, 34, lo ? 28 : 36), srHex(leafH + 25, 44, lo ? 50 : 62)],
    acc: srHex(acc, 72, 66), accDeep: srHex(acc, 55, 38), moon: srHex(H + M.hz[3], 30, 90), bone: srHex(H + 30, 18, 82),
    sunX: r.n(.15, .85), sunY: r.n(.18, .42), stars: M.stars,
  };
  p.accRgb = srRgb(p.acc); p.sunRgb = srRgb(srHex(H + M.hz[3], 70, 84)); p.darkRgb = srRgb(srHex(H, 40, 8)); p.side = p.sunX < .5 ? -1 : 1;
  return p;
}
// ---------------- the sky: one strange thing hangs in it ----------------
const SR_SKY = {
  moon(G, r, p) {
    const n = r.chance(.35) ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const R = i ? r.n(9, 16) : r.n(24, 44), x = r.n(80, AW_W - 80), y = i ? r.n(98, 120) : r.n(108, 146), col = i ? p.acc : p.moon, ring = !i && r.chance(.4), tilt = r.n(-.4, .1);
      awWrap(x, R * 3, (x) => {
        softDab(x, y, R * 2.9, srRgb(col), .3);
        if (ring) { ctx.strokeStyle = `rgba(${p.accRgb},.55)`; ctx.lineWidth = R * .14; ctx.beginPath(); ctx.ellipse(x, y, R * 2, R * .5, tilt, Math.PI, TAU); ctx.stroke(); }
        const g = ctx.createRadialGradient(x + p.side * R * .35, y - R * .35, R * .1, x, y, R); g.addColorStop(0, shade(col, .25)); g.addColorStop(.7, col); g.addColorStop(1, shade(col, -.3));
        ctx.fillStyle = g; circle(x, y, R); ctx.fill();
        ctx.save(); circle(x, y, R); ctx.clip(); const rr = mulberry(Math.floor(x));
        for (let k = 0; k < 9; k++) dab(x + (rr() - .5) * R * 1.5, y + (rr() - .5) * R * 1.5, R * (.08 + rr() * .16), shade(col, -.22), .4);
        ctx.fillStyle = `rgba(${p.darkRgb},.35)`; circle(x - p.side * R * .9, y + R * .2, R * 1.05); ctx.fill(); ctx.restore(); // its dark side
        if (ring) { ctx.strokeStyle = `rgba(${p.accRgb},.75)`; ctx.lineWidth = R * .14; ctx.beginPath(); ctx.ellipse(x, y, R * 2, R * .5, tilt, 0, Math.PI); ctx.stroke(); }
      });
    }
    SR_SKY.stars(G, r, p, .5);
  },
  stars(G, r, p, k = 1) {
    for (let i = 0; i < 190 * k; i++) { ctx.fillStyle = `rgba(255,248,240,${(.25 + r.f() * .6) * Math.max(.3, p.stars)})`; circle(r.f() * AW_W, 84 + r.f() * 120, r.f() * 1.1 + .3); ctx.fill(); }
    if (k < 1) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const w = awWave(G.seed + 3, [[1, 24], [3, 10]]);
    for (let x = 0; x < AW_W; x += 9) awSoft(x, 140 + w(x), 30 + r.f() * 20, 14, r.chance(.5) ? p.accRgb : p.hazeRgb, .12); // a milky river of stars
    for (let i = 0; i < 7; i++) { const x = r.f() * AW_W, y = 100 + r.f() * 70, R = 50 + r.f() * 60; awWrap(x, R, (x) => awSoft(x, y, R, R * .5, i % 2 ? p.accRgb : p.sunRgb, .2)); }
    ctx.restore();
  },
  aurora(G, r, p) {
    SR_SKY.stars(G, r, p, .6);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let c = 0; c < 3; c++) {
      const top = awWave(G.seed + c * 11, [[2, 18], [5, 8], [9, 3]]), len = awWave(G.seed + c * 17, [[3, 16], [7, 6]]), y0 = 96 + c * 14, col = c === 1 ? p.sunRgb : p.accRgb;
      const g = ctx.createLinearGradient(0, y0 - 20, 0, y0 + 90); g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(.25, `rgba(${col},.42)`); g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, y0 + top(0));
      for (let x = 0; x <= AW_W; x += 8) ctx.lineTo(x, y0 + top(x)); for (let x = AW_W; x >= 0; x -= 8) ctx.lineTo(x, y0 + top(x) + 60 + len(x)); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = `rgba(${col},.18)`; ctx.lineWidth = 1.2; ctx.beginPath(); for (let x = 0; x < AW_W; x += 5 + r.f() * 7) { ctx.moveTo(x, y0 + top(x)); ctx.lineTo(x, y0 + top(x) + 40 + len(x)); } ctx.stroke(); // the curtain's folds
    }
    ctx.restore();
  },
  cards(G, r, p) { // great faint cards turning slowly in the air, each with an emblem
    for (let i = 0; i < 9; i++) {
      const x = 40 + i * 142 + r.n(0, 40), w = r.n(34, 58), h = w * 1.5, y = r.n(96, 170), a = r.n(-.35, .35), gl = SECRET_KEY[(i + G.seed) % 5];
      awWrap(x, w * 1.5, (x) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.globalAlpha = .5;
        ctx.fillStyle = shade(p.moon, -.05); rrect(-w / 2, -h / 2, w, h, 4); ctx.fill(); ctx.strokeStyle = p.accDeep; ctx.lineWidth = 1.6; rrect(-w / 2, -h / 2, w, h, 4); ctx.stroke(); rrect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 3); ctx.stroke();
        ctx.fillStyle = p.accDeep; drawTrumpGlyph(gl, 0, -2, w * .22); ctx.restore(); });
    }
  },
  pattern(G, r, p) { // the Pattern itself, burned faintly into the sky: a great maze of broken arcs
    SR_SKY.stars(G, r, p, .4);
    const x0 = r.n(150, AW_W - 150), y0 = r.n(128, 150), R0 = r.n(60, 80);
    awWrap(x0, R0 + 20, (x0) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDab(x0, y0, R0 * 1.6, p.accRgb, .2);
      const rr = mulberry(G.seed);
      for (let k = 0; k < 7; k++) { const R = R0 * (1 - k / 8), n = 2 + (k % 3); ctx.strokeStyle = `rgba(${p.accRgb},${.55 - k * .04})`; ctx.lineWidth = 2;
        for (let s = 0; s < n; s++) { const a0 = rr() * TAU, a1 = a0 + TAU / n - .4 - rr() * .4; ctx.beginPath(); ctx.ellipse(x0, y0, R, R * .62, 0, a0, a1); ctx.stroke(); } }
      ctx.restore(); });
  },
  eye(G, r, p) { // an eye as wide as the sky, half-lidded, watching the road
    SR_SKY.stars(G, r, p, .4);
    const x = r.n(200, AW_W - 200), y = r.n(125, 145), w = r.n(90, 130), h = w * .34;
    awWrap(x, w + 20, (x) => {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDab(x, y, w * 1.3, p.accRgb, .2); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x, y - h * 1.9, x + w, y); ctx.quadraticCurveTo(x, y + h * 1.9, x - w, y); ctx.closePath();
      ctx.fillStyle = shade(p.moon, -.1); ctx.globalAlpha = .7; ctx.fill(); ctx.clip(); ctx.globalAlpha = 1;
      const g = ctx.createRadialGradient(x, y, 2, x, y, h * 1.1); g.addColorStop(0, '#0A0610'); g.addColorStop(.32, '#0A0610'); g.addColorStop(.36, p.acc); g.addColorStop(1, p.accDeep);
      ctx.fillStyle = g; circle(x, y, h * 1.1); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(x + h * .3, y - h * .35, h * .14); ctx.fill();
      ctx.fillStyle = `rgba(${p.darkRgb},.55)`; ctx.fillRect(x - w, y - h * 2, w * 2, h * 1.25); // the heavy lid
      ctx.restore();
      ctx.strokeStyle = shade(p.far, -.3); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x, y - h * 1.9, x + w, y); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x, y + h * 1.9, x + w, y); ctx.stroke();
      ctx.lineWidth = 1.2; for (let i = -4; i <= 4; i++) { const lx = x + i * w * .2; ctx.beginPath(); ctx.moveTo(lx, y - h * .95 * (1 - Math.abs(i) / 6)); ctx.lineTo(lx + i * 2, y - h * 1.35 * (1 - Math.abs(i) / 6)); ctx.stroke(); } // lashes
    });
  },
  shatter(G, r, p) { // the sky has cracked like a pane, and light leaks through
    SR_SKY.stars(G, r, p, .4);
    const cx = r.n(200, AW_W - 200), cy = r.n(110, 140);
    awWrap(cx, 260, (cx) => { ctx.save(); ctx.globalCompositeOperation = 'lighter';
      softDab(cx, cy, 70, p.accRgb, .3); const rr = mulberry(G.seed + 9);
      for (let k = 0; k < 9; k++) { let a = rr() * TAU, x = cx, y = cy; ctx.strokeStyle = `rgba(${p.accRgb},.75)`; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x, y);
        for (let s = 0; s < 6; s++) { a += (rr() - .5) * .9; const l = 16 + rr() * 28; x += Math.cos(a) * l; y += Math.sin(a) * l * .6; ctx.lineTo(x, y); } ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = .8; ctx.stroke(); }
      ctx.restore();
      for (let k = 0; k < 10; k++) { const x = cx + (rr() - .5) * 300, y = cy + (rr() - .5) * 80, s = 4 + rr() * 8, a = rr() * TAU; ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = shade(p.sky[1], .3); awPath([-s, -s * .4, s * .3, -s, s, s * .5, -s * .2, s * .7]); ctx.fill(); ctx.fillStyle = `rgba(${p.accRgb},.5)`; awPath([-s, -s * .4, s * .3, -s, 0, 0]); ctx.fill(); ctx.restore(); }
    });
  },
  clouds(G, r, p) {
    const lit = shade(p.farLit, .1), body = awMix(p.far, p.farLit, .45);
    awCloudBank(r.n(150, 170), r.f, { shadow: shade(p.far, -.05), body, lit, rim: shade(lit, .2) }, 30, 12, 26);
    awCloudBank(r.n(185, 200), r.f, { shadow: shade(p.far, .05), body: awMix(body, p.farLit, .2), lit, rim: shade(lit, .25) }, 22, 9, 18);
  },
  comets(G, r, p) {
    SR_SKY.stars(G, r, p, .7);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) { const x = r.f() * AW_W, y = r.n(92, 150), l = r.n(60, 140), a = r.n(.25, .55) * (r.chance(.5) ? 1 : -1);
      awWrap(x, l, (x) => { const g = ctx.createLinearGradient(x, y, x - Math.cos(a) * l, y - Math.sin(a) * l); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.2, `rgba(${p.accRgb},.55)`); g.addColorStop(1, `rgba(${p.accRgb},0)`);
        ctx.strokeStyle = g; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - Math.cos(a) * l, y - Math.sin(a) * l); ctx.stroke(); softDab(x, y, 8, '255,255,255', .5); }); }
    ctx.restore();
  },
  suns(G, r, p) { // two suns of different fires, low over the land
    for (const [k, col] of [[0, p.sunRgb], [1, p.accRgb]]) { const x = r.n(100, AW_W - 100), y = r.n(110, 150), R = k ? r.n(10, 16) : r.n(18, 26);
      awWrap(x, R * 4, (x) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDab(x, y, R * 4, col, .4); ctx.restore(); ctx.fillStyle = `rgb(${col})`; circle(x, y, R); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.5)'; circle(x, y, R * .6); ctx.fill(); }); }
    ctx.strokeStyle = `rgba(${p.hazeRgb},.5)`; ctx.lineWidth = 2; for (let i = 0; i < 14; i++) { const x = r.f() * AW_W, y = r.n(100, 180), l = r.n(60, 160); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l, y + r.n(-2, 2)); ctx.stroke(); }
  },
};
// ---------------- the horizon: one great thing stands on it ----------------
const SR_LAND = {
  range(G, r, p) { awRange(r.f, { n: r.i(5, 8), base: 214, hMin: 40, hMax: 100, col: p.far, lit: p.farLit, litA: .5, snow: r.chance(.5) ? 150 : 0, snowLit: shade(p.moon, .1), snowShade: awMix(p.moon, p.far, .4),
    gully: `rgba(${p.darkRgb},.2)`, shade: `rgba(${p.darkRgb},.28)`, jag: r.n(5, 12), steps: r.i(3, 6) }); },
  islands(G, r, p) {
    SR_LAND.range(G, srRng(G.seed + 5), Object.assign({}, p, { far: awMix(p.far, p.sky[2], .4) }));
    hazeBand(ctx, p.hazeRgb, 130, FLOOR_TOP, .35);
    const ip = { rock: p.far, lit: p.farLit, band: `rgba(${p.darkRgb},.3)`, root: p.farDark, grass: p.leaf[1], grassLit: p.leaf[2], tree0: p.leaf[0], tree1: p.leaf[1], tree2: p.leaf[2], stone: p.stone.base, roof: p.accDeep };
    for (let i = 0; i < 5; i++) awIsland(110 + i * 256 + r.n(0, 50), r.n(104, 140), r.n(46, 90), r.f, ip, { trees: r.i(0, 3), tower: r.chance(.4), fall: r.chance(.6) });
  },
  spires(G, r, p) {
    const pa = { wall: p.far, lit: p.farLit, dark: p.farDark, roof: p.accDeep, roofLit: p.acc, win: shade(p.moon, .1), winDark: p.farDark, flag: p.acc, glow: p.acc, face: p.moon };
    for (let i = 0; i < 9; i++) awTower(i * 142 + r.n(0, 60), 214, r.n(12, 24), r.n(60, 130), r.f, pa, r.chance(.12) ? 'clock' : null);
  },
  inverted(G, r, p) { // mountains hanging point-down out of the sky, and the plain under them
    ctx.save(); ctx.translate(0, 298); ctx.scale(1, -1);
    awRange(r.f, { n: r.i(4, 7), base: 230, hMin: 40, hMax: 92, col: awMix(p.far, p.sky[0], .3), lit: p.farLit, litA: .4, jag: r.n(6, 12), steps: 4, gully: `rgba(${p.darkRgb},.2)` });
    ctx.restore();
    for (let i = 0; i < 12; i++) { const x = r.f() * AW_W, y = r.n(110, 150); ctx.fillStyle = shade(p.far, -.1); awPath([x - 3, y, x + 3, y, x, y + 6 + r.f() * 10]); ctx.fill(); } // stones falling up, or down
    SR_LAND.range(G, r, Object.assign({}, p, { far: awMix(p.far, p.sky[2], .2) }));
  },
  swords(G, r, p) { // the blades of giants, driven into the plain long ago
    SR_LAND.range(G, srRng(G.seed + 2), Object.assign({}, p, { far: awMix(p.far, p.sky[2], .45), farLit: awMix(p.farLit, p.sky[2], .3) }));
    hazeBand(ctx, p.hazeRgb, 140, FLOOR_TOP, .4);
    for (let i = 0; i < r.i(3, 5); i++) { const x = r.n(60, AW_W - 60), base = r.n(206, 220), h = r.n(80, 125), a = r.n(-.3, .3), w = r.n(7, 11);
      awWrap(x, 60, (x) => { ctx.save(); ctx.translate(x, base); ctx.rotate(a);
        ctx.fillStyle = shade(p.far, -.15); awPath([-w, 0, -w * .9, -h, 0, -h - w * 1.6, w * .9, -h, w, 0]); ctx.fill();
        ctx.fillStyle = p.farLit; ctx.globalAlpha = .55; awPath([0, 0, 0, -h - w * 1.6, w * .9 * p.side, -h, w * p.side, 0]); ctx.fill(); ctx.globalAlpha = 1;
        ctx.fillStyle = p.farDark; ctx.fillRect(-w * 3, -h - w * 1.6 - 5, w * 6, 5); ctx.fillRect(-w * .5, -h - w * 1.6 - 26, w, 22); circle(0, -h - w * 1.6 - 28, w * .8); ctx.fill(); // guard, grip, pommel
        ctx.restore(); });
    }
  },
  statue(G, r, p) { // a colossus of a robed king, his face worn away, a halo of the place's light behind his head
    SR_LAND.range(G, srRng(G.seed + 4), Object.assign({}, p, { far: awMix(p.far, p.sky[2], .45), farLit: awMix(p.farLit, p.sky[2], .3) }));
    const x = r.n(200, AW_W - 200), base = 216, h = r.n(120, 140), w = h * .36, broken = r.chance(.5);
    awWrap(x, w * 2, (x) => {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDab(x, base - h + 6, w * 1.4, p.accRgb, .3); ctx.restore();
      const col = shade(p.far, -.12);
      ctx.fillStyle = col; awPath([x - w, base, x - w * .55, base - h * .62, x - w * .42, base - h * .78, x + w * .42, base - h * .78, x + w * .55, base - h * .62, x + w, base]); ctx.fill(); // robe and shoulders
      ell(x, base - h * .86, w * .26, h * .1); ctx.fill(); // head
      ctx.fillRect(x - w * .24, base - h * .98, w * .48, h * .06); for (let k = -2; k <= 2; k++) awPath([x + k * w * .1 - w * .05, base - h * .97, x + k * w * .1, base - h * 1.04, x + k * w * .1 + w * .05, base - h * .97]), ctx.fill(); // crown
      ctx.fillStyle = p.farLit; ctx.globalAlpha = .45; awPath([x, base, x, base - h * .78, x + p.side * w * .42, base - h * .78, x + p.side * w * .55, base - h * .62, x + p.side * w, base]); ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = `rgba(${p.darkRgb},.4)`; ctx.lineWidth = 1.2; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(x - w * .4 + k * w * .16, base - h * .7); ctx.lineTo(x - w * .7 + k * w * .28, base); ctx.stroke(); } // the folds
      ctx.fillStyle = col; ctx.save(); ctx.translate(x + w * .35, base - h * .62); ctx.rotate(-.2); ctx.fillRect(-3, -h * .5, 6, h * .9); ctx.restore(); // a staff
      if (broken) { ctx.fillStyle = p.sky[2]; ctx.globalAlpha = .9; awPath([x - w * .7, base - h * .5, x - w * .3, base - h * .7, x - w * .5, base - h * .3]); ctx.fill(); ctx.globalAlpha = 1; }
    });
  },
  stair(G, r, p) { // the stair of Tir-na Nog'th, climbing from the plain to a pale city in the sky
    SR_LAND.range(G, srRng(G.seed + 6), Object.assign({}, p, { far: awMix(p.far, p.sky[2], .4) }));
    const x0 = r.n(150, AW_W - 450), cx = x0 + 260, cy = r.n(108, 120), ghost = shade(p.moon, -.08);
    awWrap(cx, 320, (dx) => { const o = dx - cx;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDab(cx + o, cy + 4, 120, p.sunRgb, .22); ctx.restore();
      ctx.globalAlpha = .75; ctx.fillStyle = ghost;
      for (let i = 0; i < 9; i++) { const tx = cx + o - 80 + i * 20, th = 16 + ((i * 37) % 30); ctx.fillRect(tx - 5, cy - th, 10, th + 6); awPath([tx - 6, cy - th, tx, cy - th - 12, tx + 6, cy - th]); ctx.fill(); }
      ctx.fillRect(cx + o - 90, cy, 180, 6); ctx.beginPath(); ctx.ellipse(cx + o, cy + 6, 92, 14, 0, 0, Math.PI); ctx.fill(); // its rock, cut off below
      ctx.globalAlpha = .55; ctx.strokeStyle = ghost; ctx.lineWidth = 3; ctx.beginPath(); let x = x0 + o, y = 214; ctx.moveTo(x, y); // the stair, in flights
      for (let k = 0; k < 7; k++) { const nx = x + (k % 2 ? -1 : 1) * r.n(30, 50) + 30, ny = y - (214 - cy - 14) / 7; ctx.lineTo(nx, ny); x = nx; y = ny; } ctx.stroke(); ctx.globalAlpha = 1;
    });
  },
  tree(G, r, p) { // one tree as old as the road, its crown in the clouds
    SR_LAND.range(G, srRng(G.seed + 8), Object.assign({}, p, { far: awMix(p.far, p.sky[2], .45), farLit: awMix(p.farLit, p.sky[2], .3) }));
    hazeBand(ctx, p.hazeRgb, 140, FLOOR_TOP, .3);
    const x = r.n(200, AW_W - 200), g = [awMix(p.leaf[0], p.far, .5), awMix(p.leaf[1], p.far, .45), awMix(p.leaf[2], p.farLit, .3)];
    awWR(x, 200, r.f, (x, rr) => { ctx.save(); ctx.translate(x, 222); ctx.scale(1.25, 1.25); paintTree(0, 0, 112, rr, g, r.chance(.5) ? p.acc : null); ctx.restore(); });
  },
  crystals(G, r, p) {
    SR_LAND.range(G, srRng(G.seed + 3), p);
    const hue = (G.pal.H + 180) % 360;
    for (let i = 0; i < 6; i++) awWR(r.n(0, AW_W), 70, r.f, (x, rr) => awCluster(x, 214, r.n(40, 80), hue + (i % 3) * 30, rr, 46));
  },
  castle(G, r, p) {
    SR_LAND.range(G, srRng(G.seed + 7), Object.assign({}, p, { far: awMix(p.far, p.sky[2], .3) }));
    const hy = awHills(206, [[3, 8], [7, 4], [13, 2]], G.seed % 97, shade(p.far, -.08), p.farLit, .4);
    const cx = r.n(150, AW_W - 150); awWrap(cx, 60, (x) => awCastle(x, hy(cx) + 2, r.n(.6, .9), { wall: shade(p.far, -.05), lit: p.farLit, roof: p.accDeep, roofLit: p.acc, win: shade(p.moon, .1), flag: p.acc }));
  },
};
// ---------------- what stands along the road ----------------
const SR_MID = {
  colonnade(G, r, p) { const s = p.stone;
    for (let i = 0; i < 7; i++) awWR(i * 183 + r.n(0, 50), 40, r.f, (x, rr) => {
      const top = FLOOR_TOP - 70 - rr() * 60, broken = rr() < .4, t2 = broken ? top + 20 + rr() * 40 : top, w = 18;
      const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(p.side > 0 ? 0 : 1, s.dark); g.addColorStop(.5, s.base); g.addColorStop(p.side > 0 ? 1 : 0, s.lit);
      ctx.fillStyle = g; ctx.fillRect(x - w / 2, t2, w, FLOOR_TOP - t2);
      ctx.strokeStyle = `rgba(${p.darkRgb},.3)`; ctx.lineWidth = 1; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(x + k * 5, t2 + 4); ctx.lineTo(x + k * 5, FLOOR_TOP - 8); ctx.stroke(); } // flutes
      ctx.fillStyle = s.base; ctx.fillRect(x - 13, FLOOR_TOP - 9, 26, 9);
      if (!broken) { ctx.fillStyle = s.lit; ctx.fillRect(x - 14, top - 8, 28, 8); ctx.fillStyle = s.dark; ctx.fillRect(x - 12, top - 1, 24, 2); }
      else { ctx.fillStyle = s.base; awPath([x - w / 2, t2, x - 3, t2 - 8, x + 2, t2 - 3, x + w / 2, t2 - 9, x + w / 2, t2 + 2, x - w / 2, t2 + 2]); ctx.fill(); ctx.fillStyle = s.base; ell(x + 26, FLOOR_TOP - 4, 12, 5, .1); ctx.fill(); }
      if (rr() < .6) for (let k = 0; k < 12; k++) dab(x + (rr() - .5) * 22, t2 + rr() * (FLOOR_TOP - t2) * .6, 2 + rr() * 3, p.leaf[k % 3], .9); // ivy
    });
  },
  grove(G, r, p) {
    awHills(206, [[2, 9], [5, 5], [11, 2]], G.seed % 89, p.mid.base, p.mid.lit, .45);
    for (let i = 0; i < 6; i++) awWR(i * 213 + r.n(0, 80), 100, r.f, (x, rr) => paintTree(x, FLOOR_TOP + 2, 110 + rr() * 60, rr, p.leaf, rr() < .4 ? p.acc : null));
    for (let x = 0; x < AW_W; x += 60) awWR(x + r.n(0, 30), 30, r.f, (x, rr) => awBush(x, FLOOR_TOP + 3, 26 + rr() * 26, 10 + rr() * 10, rr, [shade(p.leaf[0], -.3), p.leaf[0], p.leaf[1], p.leaf[2]]));
  },
  crystals(G, r, p) { const hue = (G.pal.H + 180) % 360;
    for (let i = 0; i < 8; i++) { const sz = r.n(40, 80); awWR(i * 160 + r.n(0, 90), sz, r.f, (x, rr) => awCluster(x, FLOOR_TOP, sz, hue + (i % 3) * 25, rr, 52)); }
  },
  monoliths(G, r, p) { const s = p.stone;
    for (let i = 0; i < 6; i++) awWR(i * 213 + r.n(0, 80), 30, r.f, (x, rr) => {
      const w = 16 + rr() * 14, h = 50 + rr() * 60, top = FLOOR_TOP - h, tilt = (rr() - .5) * 8;
      const pts = [x - w / 2, FLOOR_TOP, x - w * .42 + tilt, top + 6, x + tilt, top, x + w * .44 + tilt, top + 4, x + w / 2, FLOOR_TOP];
      awFillPts(pts, s.base); ctx.save(); awPath(pts); ctx.clip(); ctx.fillStyle = s.lit; ctx.globalAlpha = .5; ctx.fillRect(p.side > 0 ? x + w * .15 : x - w, top - 4, w * .9, h + 8); ctx.globalAlpha = 1;
      for (let k = 0; k < 8; k++) dab(x + (rr() - .5) * w, top + rr() * h, 2 + rr() * 3, k % 2 ? s.dark : p.leaf[1], .5); ctx.restore();
      awGlow(p.acc, 8, () => { ctx.strokeStyle = p.acc; ctx.lineWidth = 1.2; ctx.beginPath(); for (let gy = top + 14; gy < FLOOR_TOP - 12; gy += 13) { const gx = x + tilt * (1 - (gy - top) / h) * .5; if (rr() < .5) { ctx.moveTo(gx - 3, gy); ctx.lineTo(gx + 3, gy); ctx.moveTo(gx, gy - 4); ctx.lineTo(gx, gy + 4); } else { ctx.moveTo(gx + 3, gy); ctx.arc(gx, gy, 3, 0, TAU); } } ctx.stroke(); });
    });
  },
  banners(G, r, p) {
    for (let i = 0; i < 8; i++) awWR(i * 160 + r.n(0, 60), 30, r.f, (x, rr) => {
      const h = 90 + rr() * 50, top = FLOOR_TOP - h, col = rr() < .5 ? p.acc : p.accDeep, bw = 14 + rr() * 6, bl = 40 + rr() * 30;
      ctx.fillStyle = p.stone.dark; ctx.fillRect(x - 1.6, top, 3.2, h); ctx.fillStyle = p.stone.lit; circle(x, top - 2, 3); ctx.fill(); ctx.fillRect(x - bw / 2 - 3, top + 4, bw + 6, 2.4);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - bw / 2, top + 6); ctx.lineTo(x + bw / 2, top + 6); ctx.lineTo(x + bw / 2 + 2, top + 6 + bl); ctx.lineTo(x, top + bl - 6); ctx.lineTo(x - bw / 2 + 2, top + 6 + bl); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade(col, -.3); ctx.fillRect(x - bw / 2, top + 6, bw * .3, bl - 4); ctx.fillStyle = p.moon; drawTrumpGlyph(SECRET_KEY[Math.floor(rr() * 5)], x, top + 6 + bl * .4, 5);
    });
  },
  ribs(G, r, p) { // the ribs of something vast that died here, arching over the road
    const bone = p.bone, sh = shade(bone, -.35);
    const x0 = r.n(100, 500), n = r.i(5, 8);
    for (let i = 0; i < n; i++) awWR(x0 + i * 70, 120, r.f, (x, rr) => {
      const h = 100 + Math.sin(i / (n - 1) * Math.PI) * 40, lean = 40 + rr() * 20;
      ctx.lineCap = 'round'; ctx.strokeStyle = sh; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x, FLOOR_TOP); ctx.quadraticCurveTo(x - 10, FLOOR_TOP - h, x + lean, FLOOR_TOP - h * .78); ctx.stroke();
      ctx.strokeStyle = bone; ctx.lineWidth = 6; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.4; ctx.stroke();
    });
    awWR(x0 - 60, 60, r.f, (x) => { ctx.fillStyle = p.bone; ell(x, FLOOR_TOP - 16, 34, 18, -.2); ctx.fill(); ctx.fillStyle = `rgba(${p.darkRgb},.8)`; ell(x + 8, FLOOR_TOP - 22, 6, 5); ctx.fill(); }); // the skull, half sunk
  },
  lanterns(G, r, p) {
    for (let i = 0; i < 7; i++) awWR(i * 183 + r.n(0, 60), 20, r.f, (x, rr) => {
      const h = 60 + rr() * 30; ctx.fillStyle = p.stone.dark; ctx.fillRect(x - 1.4, FLOOR_TOP - h, 2.8, h); ctx.fillRect(x - 4, FLOOR_TOP - 6, 8, 6);
      ctx.strokeStyle = p.stone.dark; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, FLOOR_TOP - h); ctx.quadraticCurveTo(x + 3, FLOOR_TOP - h - 8, x + 10, FLOOR_TOP - h - 5); ctx.stroke();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDab(x + 10, FLOOR_TOP - h + 4, 22, p.accRgb, .45); ctx.restore();
      ctx.fillStyle = p.acc; rrect(x + 6, FLOOR_TOP - h - 2, 8, 11, 2); ctx.fill(); ctx.fillStyle = '#FFF6E0'; ctx.fillRect(x + 8.5, FLOOR_TOP - h + 1, 3, 5);
    });
  },
  mirrors(G, r, p) { // tall mirrors stand along the road, and each shows another sky
    for (let i = 0; i < 5; i++) awWR(i * 256 + r.n(0, 90), 40, r.f, (x, rr) => {
      const w = 26 + rr() * 10, h = 64 + rr() * 30, y = FLOOR_TOP - h - 4, hue = G.pal.H + 60 + rr() * 240;
      const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, srHex(hue, 40, 22)); g.addColorStop(1, srHex(hue + 30, 50, 66));
      ctx.fillStyle = '#C9A050'; rrect(x - w / 2 - 4, y - 4, w + 8, h + 8, w / 2); ctx.fill(); ctx.fillStyle = g; rrect(x - w / 2, y, w, h, w / 2 - 3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; awPath([x - w * .3, y + h * .2, x - w * .1, y + h * .1, x + w * .2, y + h * .8, x, y + h * .9]); ctx.fill();
      ctx.fillStyle = '#8A6A30'; ctx.fillRect(x - 2, FLOOR_TOP - 6, 4, 6); ctx.fillRect(x - 10, FLOOR_TOP - 2, 20, 2);
    });
  },
  cards(G, r, p) { // cards as tall as a man, stuck upright in the ground
    for (let i = 0; i < 7; i++) awWR(i * 183 + r.n(0, 60), 40, r.f, (x, rr) => {
      const w = 34 + rr() * 10, h = w * 1.5, a = (rr() - .5) * .3, back = rr() < .45;
      ctx.save(); ctx.translate(x, FLOOR_TOP + 4); ctx.rotate(a);
      ctx.fillStyle = back ? p.accDeep : p.moon; rrect(-w / 2, -h, w, h, 4); ctx.fill(); ctx.strokeStyle = back ? p.acc : '#B8904A'; ctx.lineWidth = 1.6; rrect(-w / 2 + 3, -h + 3, w - 6, h - 6, 3); ctx.stroke();
      if (back) { ctx.lineWidth = .8; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(-w / 2 + 6, -h / 2 + k * 8); ctx.lineTo(0, -h / 2 + k * 8 - 8); ctx.lineTo(w / 2 - 6, -h / 2 + k * 8); ctx.stroke(); } }
      else { ctx.fillStyle = p.accDeep; drawTrumpGlyph(SECRET_KEY[Math.floor(rr() * 5)], 0, -h / 2, w * .25); }
      ctx.restore();
    });
  },
  statues(G, r, p) { const s = p.stone;
    for (let i = 0; i < 5; i++) awWR(i * 256 + r.n(0, 100), 30, r.f, (x, rr) => {
      ctx.fillStyle = s.dark; ctx.fillRect(x - 13, FLOOR_TOP - 22, 26, 22); ctx.fillStyle = s.lit; ctx.fillRect(x - 14, FLOOR_TOP - 24, 28, 3);
      const h = 50 + rr() * 16, b = FLOOR_TOP - 24; ctx.fillStyle = s.base; awPath([x - 10, b, x - 7, b - h * .7, x - 6, b - h * .85, x, b - h, x + 6, b - h * .85, x + 7, b - h * .7, x + 10, b]); ctx.fill(); // a hooded figure
      ctx.fillStyle = `rgba(${p.darkRgb},.7)`; ell(x + p.side * 1, b - h * .82, 3.4, 4.4); ctx.fill();
      ctx.fillStyle = s.lit; ctx.globalAlpha = .45; awPath([x, b, x, b - h, x + p.side * 6, b - h * .85, x + p.side * 10, b]); ctx.fill(); ctx.globalAlpha = 1;
    });
  },
};
// ---------------- the floor ----------------
function srFloorBase(G, p) {
  const T = FLOOR_TOP, fg = ctx.createLinearGradient(0, T - 4, 0, VH); fg.addColorStop(0, p.ground.a); fg.addColorStop(1, p.ground.b);
  ctx.fillStyle = fg; ctx.fillRect(0, T - 4, AW_W, VH - T + 4);
}
const SR_FLOOR = {
  checker(G, r, p) { srFloorBase(G, p); const A = awMix(p.stone.lit, p.ground.a, .3), B = awMix(p.stone.dark, p.ground.b, .3), gold = awMix(p.acc, '#D8AA55', .5);
    for (let y = FLOOR_TOP; y < VH; y += 22) for (let x = 0; x < AW_W + 1; x += 40) { const dark = ((x / 40) + Math.floor((y - FLOOR_TOP) / 22)) % 2 === 0, sk = (y - FLOOR_TOP) * .3;
      ctx.fillStyle = dark ? B : A; ctx.beginPath(); ctx.moveTo(x + sk, y); ctx.lineTo(x + 40 + sk, y); ctx.lineTo(x + 46.6 + sk, y + 22); ctx.lineTo(x + sk + 6.6, y + 22); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = gold; ctx.lineWidth = 1; for (let y = FLOOR_TOP; y < VH; y += 22) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(AW_W + 1, y); ctx.stroke(); }
    for (let i = 0; i < 140; i++) dab(r.f() * AW_W, FLOOR_TOP + r.f() * (VH - FLOOR_TOP), 3 + r.f() * 6, r.chance(.5) ? '#FFFFFF' : '#000000', .05);
  },
  flags(G, r, p) { srFloorBase(G, p); const st = { base: p.stone.base, lit: p.stone.lit, dark: p.stone.dark, mortar: p.stone.mortar };
    ctx.fillStyle = st.mortar; ctx.fillRect(0, FLOOR_TOP, AW_W, VH - FLOOR_TOP);
    for (let y = FLOOR_TOP, h = 9; y < VH; y += h, h *= 1.14) for (const [x, w] of awRow(r.f, 22 + h, 40 + h * 2)) { awBlock(x, y, w, h, st, r.f); if (x + w > AW_W) awBlock(x - AW_W, y, w, h, st, r.f); }
    for (let i = 0; i < 70; i++) { const x = r.f() * AW_W, y = FLOOR_TOP + r.f() * (VH - FLOOR_TOP); awWrap(x, 10, (x) => dab(x, y, 2 + r.f() * 4, p.leaf[r.i(0, 1)], .6)); } // moss in the joints
  },
  moss(G, r, p) { srFloorBase(G, p);
    for (let i = 0; i < 300; i++) { const x = r.f() * AW_W, y = FLOOR_TOP + r.f() * (VH - FLOOR_TOP); awWrap(x, 12, (x) => dab(x, y, 4 + r.f() * 8, r.chance(.5) ? p.leaf[1] : p.leaf[0], .35)); }
    const pg = ctx.createLinearGradient(0, FLOOR_TOP + 30, 0, FLOOR_TOP + 96); pg.addColorStop(0, `rgba(${srRgb(p.ground.c)},0)`); pg.addColorStop(.3, `rgba(${srRgb(p.ground.c)},.8)`); pg.addColorStop(.75, `rgba(${srRgb(p.ground.c)},.8)`); pg.addColorStop(1, `rgba(${srRgb(p.ground.c)},0)`);
    ctx.fillStyle = pg; ctx.fillRect(0, FLOOR_TOP + 30, AW_W, 66); // a worn path down the middle
    awBlades(r.f, 520, FLOOR_TOP - 2, FLOOR_TOP + 26, 10, [p.leaf[0], p.leaf[1], p.leaf[2]]);
    awBlades(r.f, 200, VH - 30, VH, 14, [p.leaf[0], p.leaf[1]]);
    for (let i = 0; i < 40; i++) { const x = r.f() * AW_W, y = FLOOR_TOP + 6 + r.f() * 30; dab(x, y, 1.6 + r.f(), r.chance(.5) ? p.acc : '#F6ECD0', .9); } // flowers
  },
  sand(G, r, p) { srFloorBase(G, p);
    for (let k = 0; k < 26; k++) { const y0 = FLOOR_TOP + 4 + k * 4.6, w = awWave(G.seed + k, [[r.i(3, 8), 2 + k * .1], [r.i(9, 15), 1]]);
      ctx.strokeStyle = k % 2 ? `rgba(${srRgb(p.ground.lit)},.35)` : `rgba(${p.darkRgb},.22)`; ctx.lineWidth = 1 + k * .05; ctx.beginPath(); for (let x = 0; x <= AW_W; x += 8) ctx[x ? 'lineTo' : 'moveTo'](x, y0 + w(x)); ctx.stroke(); }
    for (let i = 0; i < 26; i++) { const x = r.f() * AW_W, y = FLOOR_TOP + 10 + r.f() * 90; awWrap(x, 10, (x) => { ctx.fillStyle = p.stone.dark; ell(x, y, 3 + r.f() * 5, 2 + r.f() * 2); ctx.fill(); }); }
  },
  glass(G, r, p) { // a floor of dark glass that holds the sky
    const g = ctx.createLinearGradient(0, FLOOR_TOP - 4, 0, VH); g.addColorStop(0, awMix(p.sky[3], p.ground.b, .45)); g.addColorStop(.35, awMix(p.sky[1], p.ground.b, .55)); g.addColorStop(1, shade(p.ground.b, -.3));
    ctx.fillStyle = g; ctx.fillRect(0, FLOOR_TOP - 4, AW_W, VH - FLOOR_TOP + 4);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 60; i++) { const x = r.f() * AW_W, y = FLOOR_TOP + 4 + r.f() * (VH - FLOOR_TOP), l = 20 + r.f() * 80; ctx.fillStyle = `rgba(${r.chance(.5) ? p.accRgb : p.sunRgb},${.05 + r.f() * .1})`; ctx.fillRect(x, y, l, 1.2); }
    ctx.restore();
    ctx.strokeStyle = `rgba(${p.accRgb},.35)`; ctx.lineWidth = .8; for (let i = 0; i < 18; i++) { let x = r.f() * AW_W, y = FLOOR_TOP + r.f() * 100; ctx.beginPath(); ctx.moveTo(x, y); for (let s = 0; s < 4; s++) { x += 8 + r.f() * 14; y += (r.f() - .5) * 10; ctx.lineTo(x, y); } ctx.stroke(); }
  },
  pattern(G, r, p) { // dark stone with the line of a Pattern inlaid, glowing
    srFloorBase(G, Object.assign({}, p, { ground: Object.assign({}, p.ground, { a: shade(p.ground.a, -.35), b: shade(p.ground.b, -.4) }) }));
    for (let i = 0; i < 200; i++) dab(r.f() * AW_W, FLOOR_TOP + r.f() * (VH - FLOOR_TOP), 3 + r.f() * 7, r.chance(.5) ? p.stone.base : p.stone.dark, .2);
    const w1 = awWave(G.seed + 21, [[4, 18], [9, 8]]), w2 = awWave(G.seed + 22, [[3, 14], [7, 10]]);
    for (const [w, y0] of [[w1, FLOOR_TOP + 34], [w2, FLOOR_TOP + 80]]) {
      ctx.lineCap = 'round'; ctx.strokeStyle = `rgba(${p.accRgb},.25)`; ctx.lineWidth = 9; ctx.beginPath(); for (let x = 0; x <= AW_W; x += 6) ctx[x ? 'lineTo' : 'moveTo'](x, y0 + w(x)); ctx.stroke();
      ctx.strokeStyle = p.acc; ctx.lineWidth = 2.4; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = .8; ctx.stroke();
    }
    for (let i = 0; i < 8; i++) { const x = r.f() * AW_W, y = FLOOR_TOP + 20 + r.f() * 90, R = 10 + r.f() * 14; awWrap(x, R, (x) => { ctx.strokeStyle = `rgba(${p.accRgb},.55)`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(x, y, R, R * .35, 0, r.f() * 3, r.f() * 3 + 4); ctx.stroke(); }); }
  },
  mosaic(G, r, p) { srFloorBase(G, p); const H = G.pal.H + r.n(-30, 30);
    for (let y = FLOOR_TOP, h = 7; y < VH; y += h, h *= 1.08) for (let x = 0; x < AW_W; x += h * 1.2) {
      ctx.fillStyle = srHex(H + (r.f() - .5) * 50, 26 + r.f() * 20, 26 + r.f() * 22 + (y - FLOOR_TOP) * -.05); ctx.fillRect(x + .6, y + .6, h * 1.2 - 1.2, h - 1.2); }
    for (let i = 0; i < 6; i++) { const x = 100 + i * 213, y = FLOOR_TOP + 60; ctx.fillStyle = `rgba(${p.accRgb},.3)`; drawTrumpGlyph(SECRET_KEY[i % 5], x, y, 12); }
  },
  cracked(G, r, p) { srFloorBase(G, p);
    for (let i = 0; i < 160; i++) dab(r.f() * AW_W, FLOOR_TOP + r.f() * (VH - FLOOR_TOP), 4 + r.f() * 8, r.chance(.5) ? p.ground.c : p.ground.b, .3);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) { let x = r.f() * AW_W, y = FLOOR_TOP + 6 + r.f() * 100; const pts = [[x, y]]; for (let s = 0; s < 5; s++) { x += 6 + r.f() * 16; y += (r.f() - .45) * 12; pts.push([x, y]); }
      for (const [lw, a] of [[5, .12], [1.6, .6]]) { ctx.strokeStyle = `rgba(${p.accRgb},${a})`; ctx.lineWidth = lw; ctx.beginPath(); pts.forEach((q, k) => k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke(); } }
    ctx.restore();
  },
  water(G, r, p) { // ankle-deep water over flagstones, holding the light
    SR_FLOOR.flags(G, r, p);
    const g = ctx.createLinearGradient(0, FLOOR_TOP, 0, VH); g.addColorStop(0, `rgba(${srRgb(p.sky[2])},.55)`); g.addColorStop(1, `rgba(${srRgb(p.sky[1])},.5)`); ctx.fillStyle = g; ctx.fillRect(0, FLOOR_TOP - 2, AW_W, VH - FLOOR_TOP + 2);
    ctx.strokeStyle = `rgba(${srRgb(p.sky[3])},.45)`; ctx.lineWidth = 1; for (let i = 0; i < 70; i++) { const x = r.f() * AW_W, y = FLOOR_TOP + 4 + r.f() * (VH - FLOOR_TOP), l = 8 + r.f() * 26; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l, y); ctx.stroke(); }
  },
};
function srVerge(G, r, p) { // where the floor meets the back of the scene
  const k = G.scene.verge;
  if (k === 'wainscot') { const wy = FLOOR_TOP - 18, wg = ctx.createLinearGradient(0, wy, 0, FLOOR_TOP); wg.addColorStop(0, p.stone.base); wg.addColorStop(1, p.stone.dark);
    ctx.fillStyle = wg; ctx.fillRect(0, wy, AW_W + 1, 18); ctx.fillStyle = p.acc; ctx.fillRect(0, wy, AW_W + 1, 2); ctx.fillRect(0, FLOOR_TOP - 2, AW_W + 1, 2);
    ctx.strokeStyle = p.stone.lit; ctx.lineWidth = 1; for (let x = 10; x < AW_W; x += 64) ctx.strokeRect(x, wy + 4, 52, 10); }
  else if (k === 'rubble') for (let i = 0; i < 40; i++) awWR(r.f() * AW_W, 14, r.f, (x, rr) => { const w = 5 + rr() * 9; awFillPts([x - w, FLOOR_TOP + 3, x - w * .5, FLOOR_TOP - w * .6, x + w * .4, FLOOR_TOP - w * .7, x + w, FLOOR_TOP + 3], p.stone.dark); awFillPts([x + w * .4, FLOOR_TOP - w * .7, x + w, FLOOR_TOP + 3, x, FLOOR_TOP + 3], p.stone.lit, .6); });
  else if (k === 'hedge') for (let x = 0; x < AW_W; x += 40) awWR(x + r.n(0, 14), 30, r.f, (x, rr) => awBush(x, FLOOR_TOP + 2, 34 + rr() * 16, 10 + rr() * 6, rr, [shade(p.leaf[0], -.3), p.leaf[0], p.leaf[1], p.leaf[2]]));
  else if (k === 'crystals') { const hue = (G.pal.H + 180) % 360; for (let i = 0; i < 14; i++) awWR(r.f() * AW_W, 20, r.f, (x, rr) => awCluster(x, FLOOR_TOP + 2, 10 + rr() * 14, hue + (i % 3) * 20, rr, 46)); }
  const sh = ctx.createLinearGradient(0, VH - 36, 0, VH); sh.addColorStop(0, `rgba(${p.darkRgb},0)`); sh.addColorStop(1, `rgba(${p.darkRgb},.45)`); ctx.fillStyle = sh; ctx.fillRect(0, VH - 36, AW_W, 36);
}
function srFrost(G, r, p) { // rime: frost laid over whatever the floor is
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 90; i++) { const x = r.f() * AW_W, y = FLOOR_TOP + r.f() * (VH - FLOOR_TOP); awWrap(x, 30, (x) => awSoft(x, y, 18 + r.f() * 26, 6 + r.f() * 6, '190,225,255', .22)); }
  ctx.strokeStyle = 'rgba(220,240,255,.45)'; ctx.lineWidth = .7; for (let i = 0; i < 40; i++) { const x = r.f() * AW_W, y = FLOOR_TOP + r.f() * (VH - FLOOR_TOP); ctx.beginPath(); for (let k = 0; k < 3; k++) { const a = r.f() * Math.PI; ctx.moveTo(x - Math.cos(a) * 6, y - Math.sin(a) * 3); ctx.lineTo(x + Math.cos(a) * 6, y + Math.sin(a) * 3); } ctx.stroke(); }
  ctx.restore();
}
// ---------------- stranger skies, horizons, roadsides and floors ----------------
Object.assign(SR_SKY, {
  void(G, r, p) { // nothing at all up there but slow geometry and a ring of light
    for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(${p.accRgb},${.2 + r.f() * .4})`; circle(r.f() * AW_W, 84 + r.f() * 120, r.f() * .9 + .3); ctx.fill(); }
    const cx = r.n(150, AW_W - 150), cy = r.n(118, 140), R = r.n(40, 60);
    awWrap(cx, R * 2, (x) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${p.accRgb},.7)`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, cy, R, R * .9, .3, 0, TAU); ctx.stroke(); softDab(x, cy, R * 1.6, p.accRgb, .18); ctx.restore(); });
    for (let i = 0; i < 9; i++) { const x = r.f() * AW_W, y = r.n(96, 186), s = r.n(6, 20), a = r.f() * TAU, n = r.i(3, 6);
      awWrap(x, s * 2, (x) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); const pts = []; for (let k = 0; k < n; k++) pts.push(Math.cos(k / n * TAU) * s, Math.sin(k / n * TAU) * s);
        ctx.fillStyle = shade(p.sky[1], .25); awPath(pts); ctx.fill(); ctx.fillStyle = `rgba(${p.accRgb},.45)`; awPath([0, 0, pts[0], pts[1], pts[2], pts[3]]); ctx.fill(); ctx.restore(); }); }
  },
  caustics(G, r, p) { // the light comes down through deep water
    for (let i = 0; i < 9; i++) { const x = r.f() * AW_W, w = r.n(20, 60); awWrap(x, w * 3, (x) => { const g = ctx.createLinearGradient(0, 84, 0, FLOOR_TOP); g.addColorStop(0, `rgba(${p.sunRgb},.3)`); g.addColorStop(1, `rgba(${p.sunRgb},0)`); ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x, 80); ctx.lineTo(x + w, 80); ctx.lineTo(x + w * 2.4, FLOOR_TOP); ctx.lineTo(x + w * 1.2, FLOOR_TOP); ctx.closePath(); ctx.fill(); }); }
    ctx.strokeStyle = `rgba(${p.sunRgb},.35)`; ctx.lineWidth = 1.2; for (let i = 0; i < 40; i++) { const x = r.f() * AW_W, y = 86 + r.f() * 16; ctx.beginPath(); ctx.ellipse(x, y, 10 + r.f() * 14, 3, 0, 0, TAU); ctx.stroke(); } // the ripple of the surface far above
    for (let i = 0; i < 50; i++) { ctx.strokeStyle = 'rgba(230,250,255,.4)'; ctx.lineWidth = .8; circle(r.f() * AW_W, 100 + r.f() * 120, 1 + r.f() * 3); ctx.stroke(); } // bubbles
  },
  storm(G, r, p) { // a low roof of storm cloud, split by lightning
    const dark = shade(p.sky[0], -.1), mid = awMix(p.sky[1], p.sky[0], .4);
    awCloudBank(r.n(96, 106), r.f, { shadow: dark, body: mid, lit: shade(mid, .15), rim: shade(mid, .3) }, 26, 16, 34);
    awCloudBank(r.n(118, 130), r.f, { shadow: mid, body: shade(mid, .08), lit: shade(mid, .2), rim: shade(mid, .35) }, 22, 10, 24);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { let x = r.f() * AW_W, y = 120; ctx.strokeStyle = 'rgba(220,230,255,.85)'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(x, y); while (y < 214) { y += 10 + r.f() * 14; x += (r.f() - .5) * 22; ctx.lineTo(x, y); } ctx.stroke(); softDab(x, 120, 50, '200,210,255', .2); }
    ctx.restore();
  },
  rain(G, r, p) { SR_SKY.clouds(G, r, p);
    ctx.strokeStyle = `rgba(${srRgb(p.sky[3])},.35)`; ctx.lineWidth = .8; ctx.beginPath(); for (let i = 0; i < 500; i++) { const x = r.f() * AW_W, y = 90 + r.f() * 140; ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 12); } ctx.stroke(); },
  nebula(G, r, p) { SR_SKY.stars(G, r, p, .8); ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) { const x = r.f() * AW_W, y = r.n(90, 180), R = r.n(30, 90); awWrap(x, R, (x) => awSoft(x, y, R, R * .6, [p.accRgb, p.sunRgb, srRgb(srHex(p.H + 90, 60, 60))][i % 3], .14)); } ctx.restore(); },
});
Object.assign(SR_LAND, {
  machinery(G, r, p) { // the engines of some vast clockwork lie half-buried on the plain, smoking
    SR_LAND.range(G, srRng(G.seed + 9), Object.assign({}, p, { far: awMix(p.far, p.sky[2], .45), farLit: awMix(p.farLit, p.sky[2], .3) }));
    const br = { base: shade(p.far, -.05), lit: p.farLit, dark: p.farDark, edge: p.farLit, hub: p.accDeep, hubLit: p.acc };
    for (let i = 0; i < 5; i++) { const x = r.n(0, AW_W), R = r.n(26, 56), y = 214 - R * r.n(.2, .7); awWrap(x, R * 1.2, (x) => awGear(x, y, R, Math.round(R * .5), r.f() * TAU, br)); }
    for (let i = 0; i < 5; i++) { const x = r.n(0, AW_W), h = r.n(50, 100); awWrap(x, 40, (x) => { ctx.fillStyle = p.farDark; ctx.fillRect(x - 5, 214 - h, 10, h); ctx.fillRect(x - 7, 214 - h - 4, 14, 5);
      for (let k = 0; k < 6; k++) awSoft(x + k * 9 + Math.sin(k) * 4, 214 - h - 10 - k * 10, 8 + k * 3, 6 + k * 2, p.hazeRgb, .4); }); }
  },
  arches(G, r, p) { const s = p.stone, far = awMix(s.base, p.far, .5), lit = awMix(s.lit, p.farLit, .4); // an aqueduct of a dead empire striding across the land
    SR_LAND.range(G, srRng(G.seed + 10), Object.assign({}, p, { far: awMix(p.far, p.sky[2], .45) }));
    const y0 = r.n(150, 175), span = r.n(40, 60), gap = r.chance(.6) ? r.i(2, 6) : -1;
    ctx.fillStyle = far; for (let x = 0, i = 0; x < AW_W; x += span, i++) { if (i === gap) continue; ctx.fillRect(x, y0, span, 10); ctx.fillRect(x, y0, 9, 214 - y0); ctx.beginPath(); ctx.moveTo(x + 9, y0 + 10); ctx.quadraticCurveTo(x + span / 2, y0 + 10 + span * .1, x + span, y0 + 10); ctx.lineTo(x + span, y0 + 22); ctx.quadraticCurveTo(x + span / 2, y0 + 14, x + 9, y0 + 22); ctx.fill(); }
    ctx.fillStyle = lit; ctx.globalAlpha = .5; for (let x = 0, i = 0; x < AW_W; x += span, i++) if (i !== gap) ctx.fillRect(x + (p.side > 0 ? 6 : 0), y0, 3, 214 - y0); ctx.fillRect(0, y0, AW_W, 2); ctx.globalAlpha = 1;
  },
  mushrooms(G, r, p) { // a forest of giant fungus, caps glowing underneath
    SR_LAND.range(G, srRng(G.seed + 12), Object.assign({}, p, { far: awMix(p.far, p.sky[2], .5) }));
    for (let i = 0; i < 12; i++) awWR(r.n(0, AW_W), 50, r.f, (x, rr) => { const h = 40 + rr() * 80, w = 20 + rr() * 30, b = 214 + rr() * 6, col = awMix(p.far, p.acc, .2 + rr() * .3);
      ctx.fillStyle = shade(p.far, -.1); ctx.beginPath(); ctx.moveTo(x - 4, b); ctx.quadraticCurveTo(x - 2 + (rr() - .5) * 16, b - h * .5, x, b - h); ctx.lineTo(x + 4, b - h); ctx.quadraticCurveTo(x + 3, b - h * .5, x + 5, b); ctx.fill();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDab(x, b - h + 4, w * .9, p.accRgb, .3); ctx.restore();
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, b - h, w, w * .45, 0, Math.PI, TAU); ctx.fill(); ctx.fillStyle = p.farLit; ctx.globalAlpha = .4; ctx.beginPath(); ctx.ellipse(x + p.side * w * .2, b - h - w * .1, w * .6, w * .25, 0, Math.PI, TAU); ctx.fill(); ctx.globalAlpha = 1;
      for (let k = 0; k < 5; k++) dab(x + (rr() - .5) * w * 1.2, b - h - rr() * w * .35, 1.5 + rr() * 2, p.moon, .7); });
  },
  sea(G, r, p) { // the plain ends in a sea, and something sails on it
    const y = r.n(196, 206), g = ctx.createLinearGradient(0, y, 0, FLOOR_TOP); g.addColorStop(0, shade(p.sky[3], -.2)); g.addColorStop(1, shade(p.sky[1], -.1)); ctx.fillStyle = g; ctx.fillRect(0, y, AW_W, FLOOR_TOP - y);
    ctx.strokeStyle = `rgba(${p.sunRgb},.5)`; ctx.lineWidth = 1; for (let i = 0; i < 60; i++) { const x = r.f() * AW_W, yy = y + 2 + r.f() * 30; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + 6 + r.f() * 16, yy); ctx.stroke(); }
    for (let i = 0; i < r.i(2, 4); i++) { const x = r.f() * AW_W, s = r.n(.6, 1.2); awWrap(x, 30, (x) => { ctx.fillStyle = p.farDark; ctx.beginPath(); ctx.moveTo(x - 16 * s, y); ctx.lineTo(x + 16 * s, y); ctx.lineTo(x + 11 * s, y + 5 * s); ctx.lineTo(x - 12 * s, y + 5 * s); ctx.fill(); ctx.fillRect(x - .7, y - 30 * s, 1.4, 30 * s);
      ctx.fillStyle = shade(p.moon, -.1); ctx.beginPath(); ctx.moveTo(x + 1, y - 28 * s); ctx.quadraticCurveTo(x + 14 * s, y - 16 * s, x + 1, y - 4 * s); ctx.fill(); }); }
    const lx = r.f() * AW_W; awWrap(lx, 30, (x) => { ctx.fillStyle = p.farDark; awPath([x - 7, y, x - 4, y - 50, x + 4, y - 50, x + 7, y]); ctx.fill(); ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDab(x, y - 54, 30, p.sunRgb, .55); ctx.restore(); ctx.fillStyle = '#FFF4D0'; ctx.fillRect(x - 3, y - 57, 6, 6); }); // a lighthouse
  },
  ziggurats(G, r, p) { SR_LAND.range(G, srRng(G.seed + 13), Object.assign({}, p, { far: awMix(p.far, p.sky[2], .5) }));
    for (let i = 0; i < r.i(2, 4); i++) { const x = r.n(80, AW_W - 80), w = r.n(90, 150), steps = r.i(4, 7), sh = r.n(10, 16);
      awWrap(x, w, (x) => { for (let k = 0; k < steps; k++) { const ww = w * (1 - k / steps), yy = 214 - (k + 1) * sh; ctx.fillStyle = shade(p.far, -.05 - k * .02); ctx.fillRect(x - ww / 2, yy, ww, sh + 1); ctx.fillStyle = p.farLit; ctx.globalAlpha = .45; ctx.fillRect(p.side > 0 ? x + ww / 2 - ww * .25 : x - ww / 2, yy, ww * .25, sh); ctx.fillRect(x - ww / 2, yy, ww, 1.5); ctx.globalAlpha = 1; }
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDab(x, 214 - steps * sh - 6, 22, p.accRgb, .5); ctx.restore(); }); }
  },
  chess(G, r, p) { // the pieces of a game played by giants, left where they stood
    SR_LAND.range(G, srRng(G.seed + 14), Object.assign({}, p, { far: awMix(p.far, p.sky[2], .5) }));
    for (let i = 0; i < r.i(4, 7); i++) { const x = r.n(0, AW_W), s = r.n(1.4, 2.6), dark = r.chance(.5), col = dark ? p.farDark : awMix(p.moon, p.far, .35), k = r.pick(['pawn', 'rook', 'bishop', 'king']);
      awWrap(x, 40 * s, (x) => { ctx.save(); ctx.translate(x, 216); ctx.scale(s, s); ctx.fillStyle = col; ctx.fillRect(-12, -6, 24, 6); awPath([-9, -6, -6, -30, 6, -30, 9, -6]); ctx.fill();
        if (k === 'pawn') { circle(0, -36, 7); ctx.fill(); } else if (k === 'rook') { ctx.fillRect(-9, -42, 18, 12); for (let q = -9; q < 9; q += 6) ctx.fillRect(q, -46, 4, 4); } else if (k === 'bishop') { ell(0, -40, 7, 11); ctx.fill(); } else { ctx.fillRect(-7, -44, 14, 14); ctx.fillRect(-1.5, -54, 3, 10); ctx.fillRect(-5, -51, 10, 3); }
        ctx.fillStyle = p.farLit; ctx.globalAlpha = .4; ctx.fillRect(p.side > 0 ? 2 : -8, -30, 6, 24); ctx.globalAlpha = 1; ctx.restore(); }); }
  },
});
Object.assign(SR_MID, {
  fungus(G, r, p) { for (let i = 0; i < 9; i++) awWR(i * 142 + r.n(0, 80), 50, r.f, (x, rr) => { const h = 50 + rr() * 70, w = 18 + rr() * 26, b = FLOOR_TOP + 2, cap = rr() < .5 ? p.acc : awMix(p.acc, p.mid.lit, .5);
      ctx.fillStyle = p.bone; ctx.beginPath(); ctx.moveTo(x - 5, b); ctx.quadraticCurveTo(x - 3 + (rr() - .5) * 20, b - h * .5, x - 2, b - h); ctx.lineTo(x + 3, b - h); ctx.quadraticCurveTo(x + 4, b - h * .5, x + 6, b); ctx.fill(); ctx.fillStyle = shade(p.bone, -.3); ctx.fillRect(x - 5, b - h * .4, 3, h * .4);
      ctx.fillStyle = shade(cap, -.35); ctx.beginPath(); ctx.ellipse(x, b - h + 2, w, w * .3, 0, 0, Math.PI); ctx.fill(); for (let k = -3; k <= 3; k++) { ctx.strokeStyle = shade(cap, -.5); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(x, b - h + 2); ctx.lineTo(x + k * w * .3, b - h + 6); ctx.stroke(); }
      ctx.fillStyle = cap; ctx.beginPath(); ctx.ellipse(x, b - h, w, w * .55, 0, Math.PI, TAU); ctx.fill(); for (let k = 0; k < 6; k++) dab(x + (rr() - .5) * w * 1.3, b - h - rr() * w * .4, 2 + rr() * 3, '#FFF4E0', .8); }); },
  gears(G, r, p) { const br = { base: p.stone.base, lit: p.stone.lit, dark: p.stone.dark, edge: p.acc, hub: p.accDeep, hubLit: p.acc };
    for (let i = 0; i < 6; i++) awWR(70 + i * 213 + r.n(0, 50), 60, r.f, (x, rr) => { const y = FLOOR_TOP - 80 - rr() * 40, R = 24 + rr() * 18; awPillar(x, y, FLOOR_TOP, 12, { base: p.stone.base, lit: p.stone.lit, dark: p.stone.dark });
      awGear(x, y, R, Math.round(R * .55), rr() * TAU, br); if (rr() < .6) awGear(x + R * 1.5, y + R * .5, R * .5, 8, rr() * TAU, br); }); },
  roots(G, r, p) { // the roots of something enormous arch up out of the ground and back into it
    const col = shade(p.mid.base, -.1), lit = p.mid.lit;
    for (let i = 0; i < 7; i++) awWR(i * 183 + r.n(0, 60), 120, r.f, (x, rr) => { const w = 60 + rr() * 80, h = 40 + rr() * 70, th = 8 + rr() * 8;
      ctx.lineCap = 'round'; ctx.strokeStyle = col; ctx.lineWidth = th; ctx.beginPath(); ctx.moveTo(x, FLOOR_TOP + 4); ctx.bezierCurveTo(x + w * .1, FLOOR_TOP - h, x + w * .8, FLOOR_TOP - h * 1.1, x + w, FLOOR_TOP + 4); ctx.stroke();
      ctx.strokeStyle = lit; ctx.globalAlpha = .4; ctx.lineWidth = th * .3; ctx.stroke(); ctx.globalAlpha = 1; for (let k = 0; k < 6; k++) dab(x + rr() * w, FLOOR_TOP - rr() * h * .8, 2 + rr() * 3, p.leaf[1], .8); }); },
  obelisks(G, r, p) { const s = p.stone;
    for (let i = 0; i < 6; i++) awWR(i * 213 + r.n(0, 80), 30, r.f, (x, rr) => { const h = 80 + rr() * 60, w = 14 + rr() * 6;
      awFillPts([x - w / 2, FLOOR_TOP, x - w * .35, FLOOR_TOP - h, x, FLOOR_TOP - h - w * .8, x + w * .35, FLOOR_TOP - h, x + w / 2, FLOOR_TOP], s.base);
      awFillPts(p.side > 0 ? [x, FLOOR_TOP, x, FLOOR_TOP - h - w * .8, x + w * .35, FLOOR_TOP - h, x + w / 2, FLOOR_TOP] : [x, FLOOR_TOP, x, FLOOR_TOP - h - w * .8, x - w * .35, FLOOR_TOP - h, x - w / 2, FLOOR_TOP], s.lit, .5);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDab(x, FLOOR_TOP - h - w * .5, 14, p.accRgb, .6); ctx.restore(); ctx.fillStyle = s.dark; ctx.fillRect(x - w * .7, FLOOR_TOP - 6, w * 1.4, 6); }); },
  chains(G, r, p) { // chains hang out of the sky, weighted with cages and bells
    for (let i = 0; i < 8; i++) awWR(i * 160 + r.n(0, 60), 20, r.f, (x, rr) => { const end = 110 + rr() * 90; ctx.strokeStyle = p.stone.dark; ctx.lineWidth = 2;
      for (let y = 70; y < end; y += 7) { ctx.beginPath(); ctx.ellipse(x, y, (y / 7) % 2 < 1 ? 2.4 : .8, 3.6, 0, 0, TAU); ctx.stroke(); }
      if (rr() < .5) { ctx.strokeStyle = p.stone.lit; ctx.lineWidth = 1.2; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * 4, end); ctx.lineTo(x + k * 5, end + 26); ctx.stroke(); } ctx.fillStyle = p.stone.dark; ctx.fillRect(x - 12, end + 24, 24, 3); ell(x, end, 10, 3); ctx.fill(); }
      else { ctx.fillStyle = '#B8904A'; ctx.beginPath(); ctx.moveTo(x - 8, end + 16); ctx.quadraticCurveTo(x - 7, end, x, end); ctx.quadraticCurveTo(x + 7, end, x + 8, end + 16); ctx.closePath(); ctx.fill(); } }); },
});
Object.assign(SR_FLOOR, {
  clouds(G, r, p) { // the road runs over cloud: soft heaps of it, lit on top, shadowed beneath
    const top = awMix(p.sky[3], '#FFFFFF', .25), low = awMix(p.sky[2], p.sky[1], .55), g = ctx.createLinearGradient(0, FLOOR_TOP - 4, 0, VH); g.addColorStop(0, top); g.addColorStop(1, low); ctx.fillStyle = g; ctx.fillRect(0, FLOOR_TOP - 4, AW_W, VH - FLOOR_TOP + 4);
    const sh = srRgb(shade(low, -.15)), lt = srRgb(awMix(top, '#FFFFFF', .4));
    for (let i = 0; i < 220; i++) { const y = FLOOR_TOP + Math.pow(r.f(), .8) * (VH - FLOOR_TOP), x = r.f() * AW_W, R = 10 + (y - FLOOR_TOP) * .25 + r.f() * 18;
      awWrap(x, R * 1.6, (x) => { awSoft(x, y + R * .35, R * 1.5, R * .55, sh, .22); awSoft(x - p.side * R * .2, y - R * .1, R * 1.1, R * .45, lt, .3); }); }
    for (let i = 0; i < 40; i++) { const x = r.f() * AW_W, y = FLOOR_TOP + 10 + r.f() * 100; awWrap(x, 40, (x) => awSoft(x, y, 30 + r.f() * 40, 6, sh, .18)); } // gaps where the sky shows through below
  },
  roots(G, r, p) { srFloorBase(G, p);
    for (let i = 0; i < 200; i++) dab(r.f() * AW_W, FLOOR_TOP + r.f() * (VH - FLOOR_TOP), 4 + r.f() * 8, r.chance(.5) ? p.ground.c : p.ground.b, .35);
    for (let i = 0; i < 30; i++) { let x = r.f() * AW_W, y = FLOOR_TOP + r.f() * (VH - FLOOR_TOP); const th = 2 + r.f() * 5, a0 = r.n(-.3, .3), pts = [[x, y]];
      for (let s = 0; s < 6; s++) { x += Math.cos(a0 + Math.sin(s) * .5) * 20; y += Math.sin(a0 + s * .7) * 6; pts.push([x, y]); }
      for (const [w, c] of [[th + 2, shade(p.ground.b, -.4)], [th, shade(p.ground.c, -.15)], [th * .3, p.ground.lit]]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.globalAlpha = c === p.ground.lit ? .4 : 1; ctx.beginPath(); pts.forEach((q, k) => k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke(); } ctx.globalAlpha = 1; }
  },
  planks(G, r, p) { srFloorBase(G, p); const wood = awMix(p.ground.a, '#8A5A3A', .5);
    for (let y = FLOOR_TOP, h = 8; y < VH; y += h, h *= 1.1) for (const [x, w] of awRow(r.f, 60 + h * 3, 120 + h * 5)) { for (const ox of x + w > AW_W ? [0, -AW_W] : [0]) { ctx.fillStyle = shade(wood, (r.f() - .5) * .3); ctx.fillRect(x + ox + .5, y + .5, w - 1, h - 1); ctx.fillStyle = shade(wood, -.4); ctx.fillRect(x + ox + 3, y + h / 2 - .5, 1.4, 1.4); ctx.fillRect(x + ox + w - 5, y + h / 2 - .5, 1.4, 1.4); }
      ctx.strokeStyle = `rgba(${p.darkRgb},.25)`; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(x, y + h * .35); ctx.lineTo(x + w, y + h * .4); ctx.stroke(); }
  },
});
// ---------------- the place: palette and parts, painted into the usual cached layers ----------------
const SR_SCENE_W = {
  sky: { moon: 1.2, stars: .8, aurora: 1, cards: .8, pattern: .9, eye: .7, shatter: .8, clouds: .9, comets: .8, suns: .8, void: .8, caustics: .7, storm: .8, rain: .6, nebula: .8 },
  land: { range: .9, islands: 1, spires: 1, inverted: .9, swords: .9, statue: .8, stair: .7, tree: .9, crystals: .8, castle: .7, machinery: .9, arches: .9, mushrooms: .9, sea: .9, ziggurats: .8, chess: .7 },
  mid: { colonnade: 1, grove: 1, crystals: .9, monoliths: .9, banners: .8, ribs: .7, lanterns: .9, mirrors: .7, cards: .8, statues: .8, fungus: .9, gears: .8, roots: .9, obelisks: .8, chains: .7 },
  floor: { checker: 1, flags: 1, moss: 1, sand: .8, glass: .8, pattern: .9, mosaic: .8, cracked: .9, water: .7, clouds: .7, roots: .8, planks: .8 },
  verge: { none: 1, wainscot: .7, rubble: 1, hedge: .7, crystals: .6 },
  motes: { none: .6, embers: 1, snow: 1, petals: .8, sparks: 1, cards: .7, wisps: .8, rain: .6, bubbles: .5 },
};
function srScene(G) {
  const r = G.r; G.pal = srPalette(G);
  G.scene = { sky: r.weighted(SR_SCENE_W.sky), land: r.weighted(SR_SCENE_W.land), mid: r.weighted(SR_SCENE_W.mid), floor: r.weighted(SR_SCENE_W.floor), verge: r.weighted(SR_SCENE_W.verge), motes: r.weighted(SR_SCENE_W.motes) };
  if (G.pal.mood === 'day' || G.pal.mood === 'pale') { if (['stars', 'aurora', 'comets', 'nebula', 'void'].includes(G.scene.sky)) G.scene.sky = r.pick(['clouds', 'suns', 'moon', 'cards', 'rain']); }
  if (G.scene.sky === 'caustics') { G.scene.motes = 'bubbles'; if (G.pal.mood !== 'deep') { G.forceMood = 'deep'; G.pal = srPalette(G); } if (r.chance(.6)) G.scene.floor = r.pick(['sand', 'water', 'mosaic']); } // under water, things follow
  if (G.scene.sky === 'rain' || G.scene.sky === 'storm') G.scene.motes = r.chance(.7) ? 'rain' : G.scene.motes;
  if (G.scene.floor === 'clouds' && ['sea', 'chess'].includes(G.scene.land)) G.scene.land = 'islands';
  const id = 'shadowroom' + G.seed, p = G.pal;
  if (SR.theme && SR.theme !== id) { for (const T of [THEMES, AW_FAR, AW_MID, AW_FLOOR, TRACKS, COMPILED]) delete T[SR.theme]; } // only the latest room's place is kept
  SR.theme = id; G.theme = id;
  THEMES[id] = { name: 'a room in shadow', sky: p.sky, sun: [p.sunX, p.sunY, p.sunRgb], haze: p.hazeRgb, skyKind: 'none', floorA: p.ground.a, floorB: p.ground.b, path: p.ground.c,
    grade: { desat: .12, top: `rgba(${srRgb(p.sky[1])},.4)`, bot: `rgba(${p.hazeRgb},.32)`, vig: `rgba(${p.darkRgb},.6)` },
    liveFloor: (camX, t) => srMotes(G, camX, t) };
  const sc = G.scene; sc.land2 = r.chance(.4) ? r.weighted(SR_SCENE_W.land) : null; sc.mid2 = r.chance(.35) ? r.weighted(SR_SCENE_W.mid) : null; sc.ridge = r.chance(.7); sc.hazeK = r.n(.15, .6);
  if (sc.land2 === sc.land || ['sea'].includes(sc.land2)) sc.land2 = null; if (sc.mid2 === sc.mid) sc.mid2 = null;
  AW_FAR[id] = (rnd, th, f) => { const r2 = srRng(G.seed * 7 + 1); AW_SUN = p.side;
    SR_SKY[sc.sky](G, r2, p); hazeBand(f, p.hazeRgb, 150, FLOOR_TOP, .15 + sc.hazeK * .3);
    if (sc.land2) { ctx.save(); ctx.translate(0, -18); SR_LAND[sc.land2](G, srRng(G.seed * 3 + 2), Object.assign({}, p, { far: awMix(p.far, p.sky[2], .55), farLit: awMix(p.farLit, p.sky[2], .4), farDark: awMix(p.farDark, p.sky[2], .5) })); ctx.restore(); hazeBand(f, p.hazeRgb, 120, FLOOR_TOP, .45); }
    SR_LAND[sc.land](G, r2, p); hazeBand(f, p.hazeRgb, 176, FLOOR_TOP, sc.hazeK);
    if (sc.ridge) { awRange(r2.f, { n: r2.i(9, 15), base: 230, hMin: 4, hMax: 24, col: awMix(p.far, p.mid.base, .5), lit: p.farLit, litA: .35, jag: 5, steps: 2, vDepth: .4 }); hazeBand(f, p.hazeRgb, 206, FLOOR_TOP, .3); } };
  AW_MID[id] = () => { AW_SUN = p.side; if (sc.mid2) { SR_MID[sc.mid2](G, srRng(G.seed * 19 + 7), Object.assign({}, p, { mid: { dark: awMix(p.mid.dark, p.far, .5), base: awMix(p.mid.base, p.far, .5), lit: p.mid.lit } })); hazeBand(ctx, p.hazeRgb, 120, FLOOR_TOP, .35); }
    SR_MID[sc.mid](G, srRng(G.seed * 13 + 3), p); };
  AW_FLOOR[id] = () => { const r2 = srRng(G.seed * 17 + 5); AW_SUN = p.side; SR_FLOOR[sc.floor](G, r2, p); if (G.mods.includes('rime')) srFrost(G, r2, p); srVerge(G, r2, p); };
  TRACKS[id] = srTrack(G);
}
function srMotes(G, camX, t) { // a few things drifting through the air of the place (cheap: worked out from the time, no state)
  const k = G.scene.motes, p = G.pal; if (k === 'none' && !G.mods.includes('weightless')) return;
  const up = G.mods.includes('weightless') || k === 'embers' || k === 'wisps' || k === 'sparks' || k === 'bubbles';
  for (let i = 0; i < 18; i++) {
    const h1 = hash1(i + G.seed % 100), h2 = hash1(i * 7 + 3), sp = 10 + h2 * 22, span = VH - Y_OFF + 40;
    const x = ((h1 * (VW + 200) - camX * (.4 + h2 * .6) + Math.sin(t * .6 + i) * 20) % (VW + 200) + VW + 200) % (VW + 200) - 100;
    let y = ((h2 * span + t * sp * (up ? -1 : 1)) % span + span) % span + Y_OFF - 20;
    const a = Math.min(1, Math.sin(((y - Y_OFF + 20) / span) * Math.PI) * 1.4);
    if (k === 'cards') { ctx.save(); ctx.translate(x, y); ctx.rotate(t * (.5 + h1) + i); ctx.scale(Math.cos(t * 1.3 + i), 1); ctx.fillStyle = `rgba(250,236,200,${.5 * a})`; ctx.fillRect(-3, -4.5, 6, 9); ctx.restore(); continue; }
    if (k === 'rain') { ctx.strokeStyle = `rgba(${p.hazeRgb},${.5 * a})`; ctx.lineWidth = 1; for (let j = 0; j < 3; j++) { const rx = (x + j * 97 + t * 40) % (VW + 100) - 50, ry = (y * 3 + j * 120 + t * 420) % (VH - Y_OFF) + Y_OFF; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 11); ctx.stroke(); } continue; }
    if (k === 'bubbles') { ctx.strokeStyle = `rgba(230,250,255,${.55 * a})`; ctx.lineWidth = .9; circle(x + Math.sin(t * 2 + i) * 4, y, 1.5 + h1 * 2.5); ctx.stroke(); continue; }
    if (k === 'petals') { ctx.fillStyle = `rgba(${p.accRgb},${.45 * a})`; ell(x, y, 2.6, 1.3, t * 2 + i); ctx.fill(); continue; }
    const col = k === 'embers' ? '255,150,80' : k === 'snow' ? '240,246,255' : k === 'wisps' ? p.accRgb : k === 'none' ? p.hazeRgb : p.sunRgb;
    ctx.fillStyle = `rgba(${col},${(k === 'snow' ? .6 : .5) * a * (.6 + .4 * Math.sin(t * 3 + i))})`; circle(x, y, k === 'wisps' ? 2.4 : 1.4 + h2); ctx.fill();
  }
}
// ---------------- a tune for the room, written from the same seed ----------------
const SR_NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const SR_MODES = { aeolian: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], harmonic: [0, 2, 3, 5, 7, 8, 11], mixolydian: [0, 2, 4, 5, 7, 9, 10], lydian: [0, 2, 4, 6, 7, 9, 11] };
function srTrack(G) {
  const r = srRng(G.seed * 31 + 11), key = r.i(0, 11), modeN = r.pick(Object.keys(SR_MODES)), mode = SR_MODES[modeN];
  const triad = (d) => { const a = mode[d % 7], b = mode[(d + 2) % 7] + (d + 2 >= 7 ? 12 : 0), c = mode[(d + 4) % 7] + (d + 4 >= 7 ? 12 : 0), t3 = b - a, t5 = c - a;
    return SR_NOTES[(key + a) % 12] + (t3 === 4 && t5 === 7 ? '' : t3 === 3 && t5 === 7 ? 'm' : t3 === 3 && t5 === 6 ? 'dim' : t3 === 4 && t5 === 8 ? 'aug' : '5'); };
  const progs = [[0, 5, 3, 4], [0, 3, 4, 0], [0, 6, 5, 4], [0, 2, 5, 4], [0, 5, 6, 4], [0, 3, 6, 4], [0, 4, 5, 3], [0, 6, 3, 4]];
  const pA = r.pick(progs), pB = r.pick(progs);
  const fightK = ['arena', 'horde', 'champion', 'mirror', 'hall', 'duel', 'hunt', 'gauntlet'].includes(G.kind);
  const style = G.mods.includes('lightless') ? 'creep' : fightK ? r.pick(['battle', 'drive', 'march', 'tribal', 'industrial']) : G.kind === 'merchant' || G.kind === 'gamble' ? r.pick(['shuffle', 'plain']) : r.pick(['mystic', 'hymn', 'ambient', 'calm']);
  const BPM = { battle: [150, 172], drive: [132, 152], march: [120, 140], tribal: [108, 124], industrial: [100, 120], shuffle: [108, 124], plain: [110, 130], mystic: [108, 128], hymn: [70, 84], ambient: [62, 74], calm: [76, 90], creep: [92, 106] }[style];
  const rhythms = ['x---x---x-x-x---', 'x-x-x---x---x-x-', 'x--x--x-x---x---', 'x-------x---x-x-', 'x---x-x-x-x-x---', 'x-xx-x--x-x-x---', 'x---x---x-------', 'x-x-x-x-x---x---'];
  const scaleMidi = []; for (let o = 4; o <= 6; o++) for (const s of mode) scaleMidi.push(12 * (o + 1) + key + s); // C4 = 60
  const nameOf = (m) => SR_NOTES[m % 12] + (Math.floor(m / 12) - 1);
  const chordTones = (d) => [0, 2, 4].map(k => mode[(d + k) % 7]);
  const melody = (prog) => { let idx = 7 + r.i(0, 4); const bars = [];
    prog.forEach((d, b) => { const rh = r.pick(rhythms).split(''), out = [];
      rh.forEach((c, i) => { if (c !== 'x') { out.push(i === 0 ? '.' : '-'); return; }
        if (i % 4 === 0) { const tones = chordTones(d); let best = idx, bd = 99; for (let j = Math.max(0, idx - 4); j <= Math.min(scaleMidi.length - 1, idx + 4); j++) if (tones.includes(((scaleMidi[j] - key) % 12 + 12) % 12) && Math.abs(j - idx) < bd) { bd = Math.abs(j - idx); best = j; } idx = best; }
        else idx = clamp(idx + r.pick([-2, -1, -1, 1, 1, 2, 0]), 4, scaleMidi.length - 6);
        if (b === prog.length - 1 && i >= 12) { idx = 7; }
        out.push(nameOf(scaleMidi[idx])); });
      bars.push(out.join(' ')); });
    return bars; };
  return { bpm: Math.round(r.n(BPM[0], BPM[1])), style, duty: r.pick([.25, .5, .125]), vib: r.i(8, 14), echo: r.n(.08, .3), kit: r.pick(['std', 'heavy', 'metal', 'soft']), vol: 1.05,
    form: ['A', 'B', 'A', r.chance(.5) ? 'B+2' : 'B'], parts: { A: { chords: pA.map(triad), lead: melody(pA) }, B: { chords: pB.map(triad), lead: melody(pB) } } };
}

// ---------------- strange rules ----------------
// any: may turn up in any room; need: only in rooms that have that feature; risk: how much it adds to the reward
const SR_MODS = {
  weightless: { tag: 'WEIGHTLESS', risk: .1, any: 1, adj: ['Weightless', 'Floating'] },
  lightless:  { tag: 'LIGHTLESS', risk: .3, any: 1, adj: ['Lightless', 'Unlit'] },
  rime:       { tag: 'RIME', risk: .15, any: 1, adj: ['Frozen', 'Rimed'] },
  giants:     { tag: 'GIANTS', risk: .3, adj: ['Titanic', 'Giant-Haunted'], no: ['lilliput'] },
  lilliput:   { tag: 'LILLIPUT', risk: -.15, adj: ['Little', 'Dwindling'], no: ['giants', 'hydra'] },
  swift:      { tag: 'QUICKSILVER FOES', risk: .25, adj: ['Restless', 'Quicksilver'] },
  glass:      { tag: 'GLASS', risk: .35, adj: ['Glass', 'Brittle'], no: ['blessed'] },
  volatile:   { tag: 'VOLATILE', risk: .25, adj: ['Volatile', 'Smoking'] },
  hydra:      { tag: 'HYDRA', risk: .3, adj: ['Multiplying', 'Teeming'], no: ['lilliput'] },
  storm:      { tag: 'STORM', risk: .2, adj: ['Thundering', 'Storm-Lashed'] },
  embers:     { tag: 'EMBERS', risk: .25, adj: ['Burning', 'Scorched'] },
  clock:      { tag: 'AGAINST THE CLOCK', risk: .3, adj: ['Hurried', 'Ticking'], need: 'clock' },
  bounty:     { tag: 'BOUNTY', risk: .2, adj: ['Crowned', 'Wanted'], need: 'bounty' },
  blessed:    { tag: 'BLESSED', risk: -.2, adj: ['Blessed', 'Hallowed'], no: ['glass'] },
};
function srPickMods(G) {
  const r = G.r, K = SR_KINDS[G.kind] || {}, fight = !!K.fight, pool = Object.keys(SR_MODS).filter(m => { const M = SR_MODS[m]; return (fight && !K.only) ? (!M.need || K[M.need]) : M.any; });
  let n = fight ? (r.f() < .22 ? 0 : r.f() < .62 ? 1 : 2) : (r.chance(.35) ? 1 : 0);
  if (fight && stageIdx >= 3 && r.chance(.35)) n++;
  if (K.only) n = Math.min(n, 1);
  const mods = [];
  for (const m of r.shuffle(pool)) { if (mods.length >= n) break; if (mods.some(o => (SR_MODS[o].no || []).includes(m) || (SR_MODS[m].no || []).includes(o))) continue; mods.push(m); }
  if (window.__roomMods) return window.__roomMods.filter(m => SR_MODS[m]); // (testing: force the rules)
  return mods;
}

// ---------------- names ----------------
const SR_OWNERS = ['Oberon', 'Dworkin', 'Brand', 'Bleys', 'Fiona', 'Flora', 'Llewella', 'Deirdre', 'Caine', 'Gerard', 'Julian', 'Random', 'Benedict', 'Eric', 'Merlin', 'Dara', 'Jasra', 'Moire', 'Vialle', 'Ganelon', 'Martin', 'Delwin', 'Sand', 'Osric', 'Finndo', 'the Unicorn', 'the Serpent', 'the Jackal Lord', 'the Hanged Man', 'the King of Swords', 'the Pale Queen'];
const SR_ABSTRACT = ['Seven Moons', 'Broken Hours', 'the Last Light', 'Lost Cards', 'Unwritten Names', 'the Burning Sea', 'Quiet Thunder', 'Teeth and Silver', 'the Folded Sky', 'Ash and Amber', 'the Long Dusk', 'Ten Thousand Doors', 'the Drowned Bell', 'Glass Rain', 'the Laughing Dark', 'Small Gods', 'the Second Sun', 'Salt and Iron', 'Forgotten Kings', 'the Shuffled Deck'];
const SR_SKY_ADJ = { moon: ['Moonlit', 'Silvered'], stars: ['Starlit', 'Starfallen'], aurora: ['Shimmering', 'Veiled'], cards: ['Painted', 'Dealt'], pattern: ['Inscribed', 'Labyrinthine'], eye: ['Watching', 'Unblinking'], shatter: ['Broken', 'Shattered'], clouds: ['Cloudborne', 'High'], comets: ['Comet-Struck', 'Falling'], suns: ['Twin-Sunned', 'Sunstruck'], void: ['Empty', 'Hollow'], caustics: ['Drowned', 'Sunken'], storm: ['Thundering', 'Storm-Dark'], rain: ['Weeping', 'Rain-Washed'], nebula: ['Star-Born', 'Nebulous'] };
const SR_CAST = { beasts: ['Menagerie', 'Kennels'], machines: ['Foundry', 'Engine-Yard'], humans: ['Barracks', 'Muster'], ghosts: ['Haunt', 'Wake'], crystal: ['Geode', 'Prism'] };
function srName(G) {
  const r = G.r, K = SR_KINDS[G.kind], cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const adjs = []; for (const m of G.mods) adjs.push(...SR_MODS[m].adj, ...SR_MODS[m].adj); // the rules name the room first
  if (G.scene) adjs.push(...(SR_SKY_ADJ[G.scene.sky] || []), ...SR_MOODS[G.pal.mood].adj);
  const adj = r.pick(adjs.length ? adjs : ['Shadowed']), owner = r.pick(SR_OWNERS);
  let place = r.pick(K.place); if (G.cast && SR_CAST[G.cast] && ['arena', 'horde', 'champion'].includes(G.kind) && r.chance(.5)) place = r.pick(SR_CAST[G.cast]);
  const forms = [() => `The ${adj} ${place}`, () => `The ${place} of ${owner}`, () => `${cap(owner)}'s ${adj} ${place}`, () => `The ${adj} ${place} of ${owner}`, () => `The ${place} of ${r.pick(SR_ABSTRACT)}`, () => `${cap(owner)}'s ${place}`];
  G.owner = owner; G.title = r.pick(forms)();
  const tags = G.mods.map(m => SR_MODS[m].tag).slice(0, 2);
  G.sub = [K.sub(G), ...tags].join(' · ');
}
const srEpithet = (r) => `${r.pick(['Gor', 'Mal', 'Vex', 'Ul', 'Thra', 'Kesh', 'Mor', 'Brag', 'Zar', 'Ish', 'Oro', 'Fen', 'Grim', 'Skar', 'Hal', 'Ruk', 'Ves', 'Dor'])}${r.pick(['lath', 'ugor', 'ith', 'dun', 'mok', 'ra', 'vane', 'gul', 'esh', 'orn', 'ax', 'ilda', 'ok', 'umbra', 'eth'])} ${r.pick(['the Unbroken', 'the Hollow', 'Who Was Promised', 'the Twice-Dead', 'of the Long Teeth', 'the Patient', 'the Glad', 'Shadow-Eater', 'the Last of Many', 'the Unwritten', 'Oathbreaker', 'the Smiling', 'Card-Torn', 'the Uninvited'])}`;

// ---------------- who fights here ----------------
function srRoster(G) { // a cast for the room: foes of one sort drawn from every world, or strangers of all sorts
  const r = G.r, all = Object.keys(EDEF).filter(k => !EDEF[k].noRandom && !(typeof BOSSES !== 'undefined' && BOSSES[k]));
  const is = { beasts: (d) => d.kind === 'creature' || ['fur', 'goo'].includes(d.mat), machines: (d) => d.mat === 'metal' && d.draw !== 'human', humans: (d) => d.kind === 'human' || d.draw === 'human', ghosts: (d) => d.mat === 'ghost' || d.kind === 'ghost', crystal: (d) => d.mat === 'crystal' };
  const casts = r.shuffle(['strangers', 'strangers', 'beasts', 'machines', 'humans', 'ghosts', 'crystal']);
  for (const c of casts) { if (c === 'strangers') { G.cast = 'strangers'; return all; } const pool = all.filter(k => is[c](EDEF[k])); if (pool.length >= 4) { G.cast = c; return pool; } }
  G.cast = 'strangers'; return all;
}
function srWave(G, pool, n, champ) {
  const r = G.r, heavy = (k) => EDEF[k].hp >= 120, ground = pool.filter(k => EDEF[k].move !== 'fly'), out = []; let heavies = 0;
  for (let i = 0; i < n; i++) { let k = r.pick(pool); for (let j = 0; j < 4 && heavy(k) && (heavies >= (stageIdx >= 2 ? 2 : 1)); j++) k = r.pick(pool); if (heavy(k)) heavies++;
    out.push(k + (stageIdx >= 1 && !heavy(k) && r.chance(.18) ? '*' : '')); }
  if (champ) out.push(r.pick(ground.length ? ground : ['bandit']) + '!');
  return out;
}

// ---------------- the kinds of room ----------------
// fight: the rules of a fight can apply; clock / bounty: those two rules can; build(G): the room's length and waves;
// start(R): set it up once it is entered; update(R, dt); list(R, list, t) / boxes(R, box): what it shows
const SR_KINDS = {
  // the four old rooms (secrets.js builds and runs them; here only what the dealer needs to know)
  hall: { fight: 1, clock: 1, bounty: 1, place: ['Hall'], sub: () => '' }, duel: { fight: 1, clock: 1, place: ['Duel'], sub: () => '' },
  grove: { place: ['Grove'], sub: () => '' }, vault: { place: ['Vault'], sub: () => '' },
  arena: { fight: 1, clock: 1, bounty: 1, place: ['Arena', 'Lists', 'Pit', 'Ring', 'Proving Ground', 'Colosseum', 'Bear-Garden'],
    sub: (G) => `${G.rounds} ROUNDS · ${G.cast === 'strangers' ? 'FOES FROM EVERY SHADOW' : `${G.cast.toUpperCase()} OF EVERY SHADOW`}`,
    build(G) { const pool = srRoster(G); G.rounds = 2 + (G.r.chance(.45) ? 1 : 0); G.entry = G.r.chance(.6) ? 'trump' : null;
      const w = []; for (let i = 0; i < G.rounds; i++) w.push(srWave(G, pool, 3 + Math.floor(stageIdx / 2) + i, i === G.rounds - 1)); return { len: 1200, rawWaves: w }; },
    value: (G) => .8 + .25 * G.rounds },
  horde: { fight: 1, bounty: 1, place: ['Last Stand', 'Breach', 'Siege', 'Killing Floor', 'Held Gate'], sub: (G) => `HOLD FOR ${G.hold} SECONDS`,
    build(G) { G.pool = srRoster(G).filter(k => EDEF[k].hp < 120); if (G.pool.length < 3) G.pool = ['bandit', 'slime', 'boar'].filter(k => EDEF[k]); G.hold = 26 + Math.min(10, stageIdx * 2); G.entry = G.r.chance(.5) ? 'trump' : null; return { len: 1500, rawWaves: [] }; },
    start(R) { R.phase = 'wait'; R.kills = 0; R.spawnT = 0; },
    update(R, dt) { const G = R.gen;
      if (R.phase === 'wait' && P.x > 420) { R.phase = 'fight'; lockX = 300; R.left = G.hold; banner('HOLD THE LINE', `${G.hold} SECONDS`, 1.6); sfx('roar'); }
      if (R.phase !== 'fight') return;
      R.left -= dt; R.spawnT -= dt; R.hot = true;
      const alive = enemies.filter(e => !e.dead).length + spawnQ.length, cap = 3 + Math.min(3, stageIdx);
      if (R.spawnT <= 0 && alive < cap) { R.spawnT = Math.max(.6, 1.6 - stageIdx * .15) * (alive < 2 ? .5 : 1); spawnQ.push({ type: G.r.pick(G.pool), side: Math.random() < .5 ? 1 : -1, at: 0, drop: null }); waveActive = true; }
      if (R.left <= 0) { R.phase = 'done'; R.hot = false; spawnQ.length = 0;
        for (const e of enemies) if (!e.dead) { e.remove = true; burst(e.x, e.y, e.hh * .5, ['#2A1830', '#6A4A7A', '#FFFFFF'], 14, 'spark', 0, true); }
        banner('THE LINE HOLDS', `${R.kills} FELL BEFORE YOU`, 2); srChest(R, Math.min(2.4, .5 + R.kills * .07)); lockX = null; }
    } },
  mirror: { fight: 1, clock: 1, place: ['Mirror', 'Looking-Glass', 'Hall of Reflections', 'Silvered Door'], sub: () => 'YOUR SHADOW WILL NOT STEP ASIDE',
    build(G) { srShadowDef(); G.entry = 'mirror'; return { len: 1200, rawWaves: [['srshadow']] }; }, value: () => 1.2,
    update(R) { for (const e of enemies) if (e.type === 'srshadow' && !e.dead && !e.srSplit && e.hp < e.maxHp * .5) { // the mirror cracks: now there are two
      e.srSplit = 1; SR.noEnt = true; const o = spawnEnemy('srshadow', 1); SR.noEnt = false; o.x = clamp(e.x + (P.x > e.x ? -90 : 90), camX + 40, camX + VW - 40); o.y = e.y; o.hp = o.maxHp = e.hp; o.srSplit = 1; o.state = 'idle'; o.cd = 1;
      floatText(e.x, e.y, e.hh + 30, 'THE MIRROR CRACKS', '#C8B8F0', 16); sfx('break'); flashT = .12; burst(e.x, e.y, e.hh * .6, ['#FFFFFF', '#C8B8F0', '#2A1830'], 30, 'crystal', 0, true); } },
    reward(R, x, y) { const id = boonW(); if (id) { save.wl[id]++; persist(); floatText(x, y, 80, `${WEAPONS[id].name.toUpperCase()} +1 LEVEL`, '#EED48A', 15); } } },
  champion: { fight: 1, clock: 1, place: ['Lists', 'Duelling Ground', "Champion's Ring", 'Tilting Yard'], sub: (G) => `${G.champName.toUpperCase()} AWAITS`,
    build(G) { const pool = srRoster(G), ground = pool.filter(k => EDEF[k].move !== 'fly'); G.champType = G.r.pick(ground.length ? ground : ['bandit']); G.champName = srEpithet(G.r); G.entry = 'trump';
      return { len: 1200, rawWaves: [srWave(G, pool.filter(k => EDEF[k].hp < 120), 2 + Math.floor(stageIdx / 2), false), [G.champType + '!']] }; },
    value: () => 1.5 },
  gauntlet: { only: 1, place: ['Gauntlet', 'Run', 'Causeway', 'Narrow Way'], sub: () => 'RUN THE GAUNTLET · GATHER THE SPARKS',
    build(G) { G.gpats = G.r.shuffle(['rain', 'beam', 'wall', 'ring', 'spikes']).slice(0, 3); return { len: 2300, rawWaves: [] }; },
    start(R) { const r = srRng(R.gen.seed + 77); R.motes = []; R.hits = 0; R.hzT = 1.5; R.lastHp = P.hp;
      for (let x = 320; x < 2300 - 560; x += 58 + r.f() * 30) R.motes.push({ x, y: FLOOR_TOP + 16 + r.f() * (FLOOR_BOT - FLOOR_TOP - 26), z: r.chance(.2) ? 52 : 12, got: false }); },
    update(R, dt) { const G = R.gen, end = stage.len - 520, dmg = 8 + stageIdx * 3, col = G.pal.accRgb;
      if (P.hp < R.lastHp) R.hits++; R.lastHp = P.hp;
      for (const m of R.motes) if (!m.got && Math.abs(P.x - m.x) < 20 && Math.abs(P.y - m.y) < 18 && Math.abs(P.z + 10 - m.z) < 30) { m.got = true; sfx('pick'); burst(m.x, m.y, m.z, ['#FFFFFF', G.pal.acc], 8, 'spark'); }
      if (R.done || P.x < 280) return;
      if (P.x > end) { R.done = true; const got = R.motes.filter(m => m.got).length, all = R.motes.length;
        banner(R.hits ? 'THROUGH THE GAUNTLET' : 'UNTOUCHED', `${got} OF ${all} SPARKS`, 2); srChest(R, .5 + 1.1 * got / all + (R.hits ? 0 : .5), stage.len - 430); return; }
      R.hzT -= dt; if (R.hzT > 0) return; R.hzT = Math.max(.75, 1.5 - stageIdx * .12) * (.8 + Math.random() * .4);
      const pat = pick(G.gpats), ax = Math.min(P.x + 140, end);
      if (pat === 'rain') for (let i = 0; i < 3; i++) { const t = 1.05 + i * .18; hazards.push({ kind: 'fall', x: ax - 60 + i * 55 + rand(-20, 20), y: rand(FLOOR_TOP + 12, FLOOR_BOT - 6), r: 26, t, max: t, dmg, col }); }
      if (pat === 'beam') hazards.push({ kind: 'beam', y: clamp(P.y + rand(-10, 10), FLOOR_TOP + 10, FLOOR_BOT - 4), t: 1.3, max: 1.3, dmg, col });
      if (pat === 'wall') hazards.push({ kind: 'wall', x: camX + VW + 30, dir: -1, speed: 160 + stageIdx * 12, gapY: rand(FLOOR_TOP + 26, FLOOR_BOT - 18), wait: .7, t: 99, dmg });
      if (pat === 'ring') { const x = ax + 40, y = clamp(P.y, FLOOR_TOP + 20, FLOOR_BOT - 20); hazards.push({ kind: 'ring', x, y, r: 0, speed: 220, delay: .7, dmg, t: 99 }); fx.push({ kind: 'ring', x, y, z: 2, t: .7, max: .7, r: 40, col: G.pal.acc, flat: 1 }); }
      if (pat === 'spikes') { const gap = Math.floor(rand(0, 5)); for (let k = 0; k < 6; k++) if (k !== gap && k !== gap + 1) { const t = 1 + k * .05; hazards.push({ kind: 'spike', x: ax + k * 10, y: FLOOR_TOP + 14 + k * 17, r: 20, t, max: t, dmg, col }); } }
    },
    list(R, list, t) { const p = R.gen.pal; list.push([0, () => onMain(() => { for (const m of R.motes) { if (m.got || m.x < camX - 20 || m.x > camX + VW + 20) continue; // the sparks: points of the room's light, waiting along the way
      const y = m.y - m.z + Math.sin(t * 3 + m.x) * 3; ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDab(m.x, y, 14, p.accRgb, .55); ctx.fillStyle = '#FFFFFF'; awPath([m.x, y - 6, m.x + 1.5, y - 1.5, m.x + 6, y, m.x + 1.5, y + 1.5, m.x, y + 6, m.x - 1.5, y + 1.5, m.x - 6, y, m.x - 1.5, y - 1.5]); ctx.fill(); ctx.restore();
      if (m.z > 20) { ctx.fillStyle = `rgba(${p.accRgb},.25)`; ell(m.x, m.y, 7, 2.4); ctx.fill(); } } })]); } },
  shrine: { place: ['Shrine', 'Altar', 'Chapel', 'Sanctum', 'Reliquary'], sub: (G) => `${G.owner.toUpperCase()} ASKS A PRICE`,
    build(G) { const r = G.r, pool = r.shuffle(['blood', 'quiver', 'tithe', 'ink', 'fate', 'fate']).filter((k, i, a) => a.indexOf(k) === i);
      G.offers = ['bless', ...pool.filter(k => SR_OFFERS[k].ok()).slice(0, 2)]; while (G.offers.length < 3) G.offers.push('fate');
      G.offers = r.shuffle(G.offers); return { len: 1300, rawWaves: [] }; },
    start(R) { R.pads = R.gen.offers.map((id, i) => ({ id, x: 480 + i * 170, y: FLOOR_TOP + 46, p: 0 })); },
    update(R, dt) { if (R.chosen) return; srPads(R, dt, .8, (pd) => { const O = SR_OFFERS[pd.id];
      if (!O.ok()) { floatText(pd.x, pd.y, 110, 'YOU CANNOT PAY', '#FF9A8A', 13); return; }
      R.chosen = pd.id; pd.done = true; O.give(R, pd); persist(); refreshHud(true); sfx('trump'); flashT = .12; burst(pd.x, pd.y, 60, ['#FFFFFF', R.gen.pal.acc, '#EED48A'], 36, 'spark', 0, true); }); },
    list(R, list, t) { srAltars(R, list, t); }, boxes(R, box) { for (const pd of R.pads) box(pd.x, pd.y, 0, 60, 130); } },
  merchant: { place: ['Bazaar', 'Market', 'Stall', 'Emporium', 'Night Market'], sub: (G) => `${G.merchant.split(',')[0].toUpperCase()} HAS WARES`,
    build(G) { const r = G.r; G.merchant = `${r.pick(['Grimbald', 'Old Tessaly', 'Mother Quill', 'Hobb', 'Cassius Fen', 'Lirien', 'Sorrowmint', 'Bartholomew Nine', 'Nell of the Ninety Pockets'])}, ${r.pick(['Pedlar of Shadow', 'Dealer in Small Wonders', 'Purveyor of Lost Things', 'Factor of the Black Road', 'Who Sells Doors'])}`;
      G.wares = r.shuffle(Object.keys(SR_WARES)).filter(k => SR_WARES[k].ok()).slice(0, 4); return { len: 1300, rawWaves: [] }; },
    start(R) { R.pads = R.gen.wares.map((id, i) => ({ id, x: 440 + i * 128, y: FLOOR_TOP + 50, p: 0, price: SR_WARES[id].price() })); R.greet = false; },
    update(R, dt) { if (!R.greet && P.x > 330) { R.greet = true; floatText(930, FLOOR_TOP + 30, 130, pick(['WARES FROM A HUNDRED SHADOWS', 'NO REFUNDS IN SHADOW, PRINCE', 'STAND A WHILE AND IT IS YOURS', 'EVERYTHING HAS A PRICE. THESE ARE CHEAP']), '#EED48A', 13); }
      srPads(R, dt, .6, (pd) => { const W = SR_WARES[pd.id], [n, cur] = pd.price;
        if (save[cur] < n) { floatText(pd.x, pd.y, 110, `NOT ENOUGH ${cur.toUpperCase()}`, '#FF9A8A', 13); return; }
        save[cur] -= n; pd.done = true; W.give(R, pd); persist(); refreshHud(true); sfx('buy'); burst(pd.x, pd.y, 50, ['#FFFFFF', '#EED48A'], 20, 'spark', 0, true); floatText(pd.x, pd.y, 100, W.name.toUpperCase(), '#EED48A', 14); }); },
    list(R, list, t) { srStall(R, list, t); }, boxes(R, box) { for (const pd of R.pads) box(pd.x, pd.y, 0, 50, 110); box(930, FLOOR_TOP + 30, 0, 90, 150); } },
  gamble: { place: ['Gaming House', 'Table', 'Wager', 'Card Room'], sub: () => 'THREE CARDS · ONE FORTUNE',
    build(G) { G.deal = G.r.shuffle(['fortune', 'plain', 'ambush']); G.pool = srRoster(G).filter(k => EDEF[k].hp < 130); return { len: 1300, rawWaves: [] }; },
    start(R) { R.pads = R.gen.deal.map((id, i) => ({ id, x: 500 + i * 150, y: FLOOR_TOP + 44, p: 0, flip: 0 })); },
    update(R, dt) { for (const pd of R.pads) if (pd.done || (R.chosen && R.t - R.chosenAt > 1.2)) pd.flip = Math.min(1, pd.flip + dt * 2.5);
      if (R.chosen) { if (R.chosen === 'ambush' && R.amb && !waveActive && !spawnQ.length && !R.paid) { R.paid = true; srChest(R, 1.15); } return; }
      srPads(R, dt, .6, (pd) => { R.chosen = pd.id; R.chosenAt = R.t; pd.done = true; sfx('trump'); flashT = .1; const G = R.gen;
        if (pd.id === 'fortune') { banner('FORTUNE', 'THE CARD SMILES ON YOU', 2); srChest(R, 2.1, pd.x); }
        else if (pd.id === 'plain') { banner('A MODEST HAND', 'SOMETHING, AT LEAST', 2); srChest(R, .8, pd.x); }
        else { banner('THE KNAVE OF SWORDS', 'IT WAS A TRAP', 2); R.amb = true; lockX = clamp(camX, 0, stage.len - VW); srWave(G, G.pool, 3 + Math.floor(stageIdx / 2), false).forEach((tp, j) => spawnQ.push({ type: tp, side: j % 2 ? -1 : 1, at: .6 + j * .7, drop: null })); waveActive = true; R.hot = true; } }); },
    list(R, list, t) { srCards(R, list, t); }, boxes(R, box) { for (const pd of R.pads) box(pd.x, pd.y, 0, 50, 130); } },
  puzzle: { place: ['Pattern', 'Riddle', 'Maze of Stones', 'Cipher', 'Singing Stones'], sub: () => 'WATCH THE STONES · WALK THEIR ORDER',
    build(G) { const r = G.r, n = 4 + (stageIdx >= 2 ? 1 : 0) + (r.chance(.3) ? 1 : 0), L = Math.min(7, 3 + Math.floor(stageIdx / 2) + (r.chance(.4) ? 1 : 0));
      G.stones = []; for (let i = 0; i < n; i++) G.stones.push({ x: 420 + i * (460 / (n - 1)) + r.n(-12, 12), y: i % 2 ? FLOOR_TOP + 30 + r.n(0, 14) : FLOOR_BOT - 26 - r.n(0, 14), f: 0, glyph: i });
      const pent = [0, 2, 4, 7, 9, 12, 14], base = 330 * Math.pow(2, r.i(0, 5) / 12); G.stones.forEach((s, i) => s.hz = base * Math.pow(2, pent[i % 7] / 12));
      G.seq = []; for (let i = 0; i < L; i++) { let k; do k = r.i(0, n - 1); while (k === G.seq[i - 1]); G.seq.push(k); }
      G.pool = srRoster(G).filter(k => EDEF[k].hp < 130); return { len: 1500, rawWaves: [] }; },
    start(R) { R.phase = 'wait'; R.stones = R.gen.stones.map(s => Object.assign({}, s, { p: 0 })); },
    update(R, dt) { const G = R.gen;
      for (const s of R.stones) s.f = Math.max(0, s.f - dt * 1.6);
      if (R.phase === 'wait' && P.x > 400) { R.phase = 'show'; R.k = -1; R.st = .9; lockX = 300; floatText(P.x, P.y, 110, 'WATCH THE STONES', '#EED48A', 15); }
      if (R.phase === 'show') { R.st -= dt; if (R.st <= 0) { R.k++; if (R.k >= G.seq.length) { R.phase = 'input'; R.pos = 0; floatText(P.x, P.y, 110, 'NOW WALK THEIR ORDER', '#EED48A', 15); return; } const s = R.stones[G.seq[R.k]]; s.f = 1; srTone(s.hz); R.st = Math.max(.5, .85 - stageIdx * .05); } return; }
      if (R.phase === 'input') srPads({ pads: R.stones }, dt, .28, (s) => { s.f = 1;
        if (R.stones.indexOf(s) === G.seq[R.pos]) { srTone(s.hz); R.pos++; floatText(s.x, s.y, 50, `${R.pos} / ${G.seq.length}`, '#EED48A', 13);
          if (R.pos >= G.seq.length) { R.phase = 'won'; lockX = null; banner('THE STONES SING', 'YOU WALKED THEIR ORDER TRUE', 2); sfx('weapon'); for (const q of R.stones) q.f = 1; srChest(R, 1.6); } }
        else { R.phase = 'failed'; sfx('hurt'); srTone(s.hz * .94); banner('A WRONG NOTE', 'THE STONES ARE ANGERED', 2); R.hot = true;
          srWave(G, G.pool, 3 + Math.floor(stageIdx / 2), false).forEach((tp, j) => spawnQ.push({ type: tp, side: j % 2 ? -1 : 1, at: .5 + j * .7, drop: null })); waveActive = true; } }, true);
      if (R.phase === 'failed' && !waveActive && !spawnQ.length && !R.paid) { R.paid = true; R.hot = false; lockX = null; srChest(R, .7); } },
    list(R, list, t) { srStones(R, list, t); } },
  hunt: { only: 1, place: ['Hunt', 'Chase', 'Quarry', 'Golden Run'], sub: (G) => `CATCH THE GOLDEN ${EDEF[G.quarry].name.toUpperCase()}`,
    build(G) { const opts = ['slime', 'boar', 'imp', 'chhound', 'cloudram', 'spider', 'w5hound', 'shardling'].filter(k => EDEF[k]); G.quarry = G.r.pick(opts.length ? opts : ['bandit']); return { len: 1500, rawWaves: [] }; },
    start(R) { R.phase = 'wait'; },
    update(R, dt) { const G = R.gen;
      if (R.phase === 'wait' && P.x > 420) { R.phase = 'chase'; lockX = 300; R.left = 18; SR.noEnt = true; const e = spawnEnemy(G.quarry, 1); SR.noEnt = false;
        e.x = Math.min(camX + VW - 60, P.x + 260); e.y = (FLOOR_TOP + FLOOR_BOT) / 2; e.srGold = 1; e.srTint = '#E8B850'; e.hp = e.maxHp = Math.round(e.maxHp * 2.2); e.def = Object.assign({}, e.def, { name: 'Golden ' + e.def.name, spd: 1 }); e.cd = 99;
        R.q = e; R.qhp = e.hp; waveActive = true; banner(`THE GOLDEN ${e.def.name.replace('Golden ', '').toUpperCase()}`, 'EVERY BLOW SHAKES GOLD LOOSE', 1.8); burst(e.x, e.y, 30, ['#FFE8A0', '#FFFFFF'], 30, 'spark', 0, true); sfx('trump'); }
      if (R.phase !== 'chase') return; const e = R.q; R.left -= dt;
      if (e.dead) { R.phase = 'done'; banner('CAUGHT', 'IT WAS GOLD ALL THROUGH', 2); srChest(R, 2.1); lockX = null; return; }
      e.cd = 99; if (e.hp < R.qhp) { const n = Math.min(4, 1 + Math.floor((R.qhp - e.hp) / 12)); for (let i = 0; i < n; i++) loot.push(makeLoot('shard', e.x, e.y, Math.round((4 + stageIdx * 3) * (1 + .5 * save.cycle)))); R.qhp = e.hp; }
      if (R.left <= 0) { R.phase = 'done'; e.remove = true; burst(e.x, e.y, 30, ['#FFE8A0', '#FFFFFF', '#2A1830'], 30, 'spark', 0, true); banner('IT SLIPPED AWAY', 'BACK INTO SHADOW, WITH THE REST OF ITS GOLD', 2.2); lockX = null; sfx('whoosh'); return; }
      if (Math.random() < dt * 10) parts.push({ x: e.x + rand(-e.hw, e.hw), y: e.y, z: e.z + rand(0, e.hh), vx: 0, vy: 0, vz: rand(20, 60), life: .7, max: .7, col: pick(['#FFE8A0', '#FFFFFF']), size: rand(1.5, 3), shape: 'star', rot: 0, vr: 5 });
      if (['hurt', 'down', 'dying', 'enter'].includes(e.state) || e.air || e.z > 0) return; // it runs: away from him, wheeling when cornered
      const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy * 1.6) || 1, near = d < 240, sp = (near ? 150 + stageIdx * 8 : 50) * (G.mods.includes('swift') ? 1.3 : 1);
      R.blink = (R.blink || 0) - dt;
      if (near && R.blink <= 0 && (e.x < leftWall() + 50 || e.x > rightWall() - 50) && d < 120) { // cornered: it jinks clean past him
        R.blink = 2.2; burst(e.x, e.y, 20, ['#FFE8A0', '#FFFFFF'], 14, 'spark'); e.x = clamp(P.x - Math.sign(dx || 1) * 200, leftWall() + 40, rightWall() - 40); e.y = clamp(P.y + rand(-40, 40), FLOOR_TOP + 14, FLOOR_BOT - 8); burst(e.x, e.y, 20, ['#FFE8A0', '#FFFFFF'], 14, 'spark'); sfx('whoosh'); return; }
      const wob = Math.sin(R.t * 2.3) * .6, vx = near ? dx / d : Math.cos(R.t * .7), vy = near ? dy / d + wob : Math.sin(R.t * 1.1);
      e.x = clamp(e.x + vx * sp * dt, leftWall() + 20, rightWall() - 20); e.y = clamp(e.y + vy * sp * .6 * dt, FLOOR_TOP + 12, FLOOR_BOT - 6); e.facing = Math.sign(vx) || e.facing; e.walk += dt * (near ? 14 : 6); e.state = 'idle'; } },
};
// what the shrine offers, and what the pedlar sells
const srPrice = (n) => Math.round(n * (1 + stageIdx * .8) * (1 + .5 * save.cycle) / 5) * 5;
const SR_OFFERS = {
  bless: { name: 'A Blessing', cost: () => 'FREELY GIVEN', ok: () => true, col: '#EED48A', glyph: 'heart',
    give(R, pd) { P.hp = maxHp(); const k = pick(POWER_ORDER); gainPower(k); PW[k] = 30; banner('BLESSED', `HEALED · ${POWERS[k].name} FOR THIRTY SECONDS`, 2.2); } },
  blood: { name: 'Give Blood', cost: () => 'A THIRD OF YOUR LIFE', ok: () => P.hp > maxHp() * .45, col: '#D0566A', glyph: 'heart',
    give(R, pd) { const n = Math.round(maxHp() * .33); P.hp -= n; floatText(P.x, P.y, 70, '-' + n, '#D0566A', 16); hurtFlash = .3; banner('THE ALTAR DRINKS', 'AND PAYS IN KIND', 2); srChest(R, 1.7, pd.x); } },
  quiver: { name: 'Give Your Arrows', cost: () => 'EVERY ARROW YOU CARRY', ok: () => (save.arrows || 0) >= 2, col: '#9FD8E0', glyph: 'quiver',
    give(R, pd) { const n = save.arrows; save.arrows = 0; refreshArrows(); const s = 2 + n; save.sigils += s; runSigils += s; banner('THE ARROWS ARE TAKEN', `${s} SIGILS IN THEIR PLACE`, 2); } },
  tithe: { name: 'A Tithe of Shards', cost: () => `${srPrice(70)} SHARDS`, ok: () => save.shards >= srPrice(70), col: '#7EC2B0', glyph: 'hoard',
    give(R, pd) { save.shards -= srPrice(70); banner('THE TITHE IS ACCEPTED', 'ARMOR FROM THE RELIQUARY', 2); const t = rollTier(true); gearDrop(pd.x, pd.y, t, rollEnchants(t, 1, 1)); gearDrop(pd.x, pd.y, rollTier(true), rollEnchants(t, .6, .3)); } },
  ink: { name: 'Ink for an Edge', cost: () => `${3 + stageIdx} SIGILS`, ok: () => save.sigils >= 3 + stageIdx && !!boonW(), col: '#C8607A', glyph: 'edge',
    give(R, pd) { save.sigils -= 3 + stageIdx; const id = boonW(); save.wl[id]++; banner(`${WEAPONS[id].name} +1 LEVEL`, 'THE INK IS DRUNK', 2.2); } },
  fate: { name: 'Trust to Fate', cost: () => 'WHO CAN SAY?', ok: () => true, col: '#B8A0FF', glyph: 'card',
    give(R, pd) { if (Math.random() < .55) { banner('FATE IS KIND', 'TODAY', 2); srChest(R, 1.6, pd.x); }
      else { banner('FATE IS CRUEL', 'TODAY', 2); R.hot = true; R.amb = true; const pool = srRoster(R.gen).filter(k => EDEF[k].hp < 130); srWave(R.gen, pool, 3 + Math.floor(stageIdx / 2), false).forEach((tp, j) => spawnQ.push({ type: tp, side: j % 2 ? -1 : 1, at: .5 + j * .7, drop: null })); waveActive = true; } } },
};
const SR_WARES = {
  armor: { name: 'Shadow-Forged Armor', glyph: 'heart', ok: () => true, price: () => [srPrice(60), 'shards'], give(R, pd) { const t = rollTier(true); gearDrop(pd.x, pd.y, t, rollEnchants(t, .9, .5)); } },
  edge: { name: 'A Whetstone of Dworkin', glyph: 'edge', ok: () => !!boonW(), price: () => [3 + stageIdx, 'sigils'], give() { const id = boonW(); save.wl[id]++; banner(`${WEAPONS[id].name} +1 LEVEL`, 'SHARPER THAN BEFORE', 2); } },
  card: { name: 'A Fresh-Drawn Card', glyph: 'card', ok: () => BOONS.card.ok(), price: () => [srPrice(140), 'shards'], give() { const s = BOONS.card.sub(); BOONS.card.give(); banner('A CARD', s, 2.2); } },
  quiver: { name: 'Quiver of Starlight', glyph: 'quiver', ok: () => true, price: () => [srPrice(35), 'shards'], give() { BOONS.quiver.give(); } },
  salve: { name: 'Salve of Rebma', glyph: 'heart', ok: () => true, price: () => [srPrice(20), 'shards'], give() { P.hp = maxHp(); floatText(P.x, P.y, 80, 'HEALED', '#7EC2B0', 15); } },
  power: { name: 'A Spark in a Bottle', glyph: 'ink', ok: () => true, price: () => [srPrice(15), 'shards'], give() { const k = pick(POWER_ORDER); gainPower(k); PW[k] = 20; } },
  parcel: { name: 'A Sealed Parcel', glyph: 'hoard', ok: () => true, price: () => [srPrice(50), 'shards'], give(R, pd) { srPay(pd.x, pd.y, rand(.3, 2.2)); } },
  blade: { name: 'A Blade from Shadow', glyph: 'blade', ok: () => BOONS.blade.ok(), price: () => [srPrice(220), 'shards'], give() { BOONS.blade.give(); } },
  ink: { name: 'Dworkin\'s Ink', glyph: 'ink', ok: () => true, price: () => [srPrice(45), 'shards'], give() { const n = 3 + stageIdx; save.sigils += n; runSigils += n; } },
};
function srShadowDef() { // the prince's own shadow, stepped out of a mirror: a duellist's frame, dark all through
  EDEF.srshadow = Object.assign({}, EDEF.chknight || EDEF.bandit, { name: "The Prince's Shadow", noRandom: 1, hp: 120, dmg: 12, spd: 96, plans: EDEF.chknight ? ['swing', 'w4blink', 'swing', 'pounce'] : ['swing', 'pounce'], sigil: 1, shards: [10, 14] });
}

// ---------------- dealing a room ----------------
const SR_KIND_W = { hall: 1.1, grove: .7, vault: .7, duel: .6, arena: 1.3, horde: 1, mirror: .9, champion: .9, gauntlet: 1, shrine: .9, merchant: 1, gamble: 1, puzzle: 1, hunt: 1 };
const SR_CLASSIC = ['hall', 'grove', 'vault', 'duel'];
{ const q = /[?&]room=(\d+)(?::(\w+))?/.exec(location.search); if (q) { window.__roomSeed = +q[1]; if (q[2]) window.__forceRoom = q[2]; } }
function srDeal() {
  const forced = window.__roomSeed != null, seed = forced ? (+window.__roomSeed >>> 0) : (Math.random() * 2147483647) >>> 0; window.__roomSeed = null;
  const r = srRng(seed), w = Object.assign({}, SR_KIND_W); if (!forced && save.lastSecret) delete w[save.lastSecret];
  let kind = r.weighted(w); if (window.__forceRoom && SR_KIND_W[window.__forceRoom]) kind = window.__forceRoom;
  const G = { seed, r, kind, classic: SR_CLASSIC.includes(kind), mods: [] };
  G.mods = srPickMods(G);
  const K = SR_KINDS[kind];
  if (!G.classic) { G.build = K.build(G); srScene(G); srName(G); }
  else { // the old rooms keep their names (their rules show in the subtitle); the hall and the duel are mostly held somewhere new
    if ((kind === 'hall' || kind === 'duel') && r.chance(.7)) srScene(G);
    G.title = null; G.sub = null; }
  if (G.mods.includes('blessed')) G.blessPow = pick(POWER_ORDER);
  G.mult = Math.max(.6, 1 + G.mods.reduce((s, m) => s + SR_MODS[m].risk, 0));
  SR.last = G; return G;
}
function srRoom(G) { return { title: G.title, sub: G.sub, theme: G.theme, len: G.build.len, pods: [], rawWaves: G.build.rawWaves.map(w => w.slice()) }; }
function srDressClassic(Z, G) { // an old room under new rules: its name takes the first rule's word, and the rules join its subtitle
  if (!G.mods.length) return;
  const adj = SR_MODS[G.mods[0]].adj[0]; Z.title = Z.title.replace(/^(The|A) /, `$1 ${adj} `);
  Z.sub = [Z.sub.split(' · ')[0], ...G.mods.map(m => SR_MODS[m].tag)].slice(0, 3).join(' · ');
}
function srTest(seed, kind, mods) { // (testing) straight into a room from anywhere in a stage
  if (seed != null) window.__roomSeed = seed; if (kind) window.__forceRoom = kind; if (mods) window.__roomMods = mods;
  zoneIdx = 1; waveIdx = stage.waves.length; waveActive = false; zoneTrans = null; enterSecret();
  if (kind) window.__forceRoom = null; window.__roomMods = null;
  P.x = 60; const Z = SECRET_ROOM; banner(Z.title, Z.sub, 2.6); return { seed: stage.room.gen.seed, kind: stage.room.kind, title: Z.title, sub: Z.sub, mods: stage.room.gen.mods, scene: stage.room.gen.scene };
}

// ---------------- running a room ----------------
function srStart(R) {
  srHooks(); const G = R.gen; R.hot = false;
  if (G.blessPow) { gainPower(G.blessPow); PW[G.blessPow] = 4; }
  const K = SR_KINDS[R.kind]; if (K && K.start && !G.classic) K.start(R);
}
const srHas = (R, m) => R.gen.mods.includes(m);
function srUpdate(R, dt) {
  const G = R.gen, K = SR_KINDS[R.kind], hot = waveActive || R.hot;
  if (srHas(R, 'weightless')) roomGrav = .5;
  if (G.blessPow) PW[G.blessPow] = Math.max(PW[G.blessPow] || 0, 2.5);
  for (const e of enemies) { if (!e.srInit && !e.boss) srMutate(R, e); if (e.dead && !e.srDead) { e.srDead = 1; srOnDeath(R, e); } }
  if (!G.classic && K.update) K.update(R, dt);
  if (!G.classic && K.value && !R.done && stage.waves.length && waveIdx >= stage.waves.length && !waveActive) { R.done = true; srChest(R, K.value(G)); } // the last wave falls: the room pays
  if (srHas(R, 'clock')) { if (R.clock == null) R.clock = 18 + 14 * Math.max(1, stage.waves.length);
    const running = (waveIdx > 0 || waveActive) && waveIdx < stage.waves.length; if (running && !R.clockLost) { R.clock -= dt; if (R.clock <= 0) { R.clock = 0; R.clockLost = true; floatText(P.x, P.y, 110, 'TOO SLOW · THE BONUS IS LOST', '#FF9A8A', 14); sfx('hurt'); } } }
  if (srHas(R, 'storm') && hot) { R.stormT = (R.stormT ?? 1.5) - dt; if (R.stormT <= 0) { R.stormT = rand(1.3, 2.3);
    const live = enemies.filter(e => !e.dead && e.state !== 'enter'), at = Math.random() < .5 || !live.length ? P : pick(live);
    hazards.push({ kind: 'srbolt', x: clamp(at.x + rand(-50, 50), camX + 30, camX + VW - 30), y: clamp(at.y + rand(-16, 16), FLOOR_TOP + 8, FLOOR_BOT), r: 34, t: 1.1, max: 1.1, dmg: 9 + stageIdx * 3 }); } }
  if (srHas(R, 'embers') && hot) { R.emberT = (R.emberT ?? 2) - dt; if (R.emberT <= 0) { R.emberT = rand(2.2, 3.2);
    hazards.push({ kind: 'srfire', x: clamp(P.x + rand(-90, 90), camX + 40, camX + VW - 40), y: clamp(P.y + rand(-24, 24), FLOOR_TOP + 10, FLOOR_BOT - 4), r: 40, t: 4.6, max: 4.6, warm: .9, dmg: 6 + stageIdx * 2 }); } }
  if (srHas(R, 'rime')) { // the floor is ice: he is slow to get going, and slides on when he stops
    const iv = R.iv || (R.iv = { x: 0, y: 0 }), free = ['idle', 'walk', 'run'].includes(P.state), tx = free ? input.mx * (input.run ? 240 : SPX) : 0, ty = free ? input.my * SPY : 0;
    if (free) { iv.x += (tx - iv.x) * Math.min(1, dt * 1.7); iv.y += (ty - iv.y) * Math.min(1, dt * 1.7); P.x = clamp(P.x + (iv.x - tx) * dt, leftWall(), rightWall()); P.y = clamp(P.y + (iv.y - ty) * dt, FLOOR_TOP + 4, FLOOR_BOT);
      if (Math.abs(iv.x - tx) > 60 && Math.random() < dt * 20) parts.push({ x: P.x, y: P.y + 2, z: 1, vx: -iv.x * .2, vy: 0, vz: rand(20, 50), life: .4, max: .4, col: 'rgba(220,240,255,.8)', size: rand(1.5, 3), shape: 'puff', rot: 0, vr: 0 }); }
    else { iv.x = 0; iv.y = 0; } }
  if (R.chest) srChestUpdate(R, dt);
}
function srMutate(R, e) {
  e.srInit = 1; const G = R.gen;
  if (srHas(R, 'giants')) { e.srScale = 1.3; e.hw *= 1.2; e.hp = e.maxHp = Math.round(e.maxHp * 1.5); e.dmg = Math.round(e.dmg * 1.15); e.weightK = .7; }
  if (srHas(R, 'lilliput') && !e.srGold) e.srTiny = 1;
  if (srHas(R, 'swift')) e.def = Object.assign({}, e.def, { spd: e.def.spd * 1.35, cd: e.def.cd.map(v => v * .72), wind: e.def.wind * .88 });
  if (srHas(R, 'glass')) { e.hp = e.maxHp = Math.max(1, Math.round(e.maxHp * .5)); e.dmg = Math.round(e.dmg * 1.8); }
  if (e.type === 'srshadow') { e.srTint = '#140A1E'; e.srEyes = '#C8B8F0'; }
  if (R.kind === 'champion' && e.champ) { e.srScale = (e.srScale || 1) * 1.15; floatText(e.x, e.y, e.hh + 52, G.champName.toUpperCase(), '#FFD27A', 15); }
  if (srHas(R, 'bounty') && !e.champ && !e.srChild && !e.srGold && !enemies.some(o => o.srCrown && !o.dead) && !(R.crowned > waveIdx)) { e.srCrown = 1; R.crowned = waveIdx + 1; }
}
function srOnDeath(R, e) {
  if (R.kind === 'horde' && R.phase === 'fight') R.kills++;
  if (e.srCrown) { floatText(e.x, e.y, e.hh + 30, 'BOUNTY!', '#FFD27A', 17); for (let i = 0; i < 3; i++) loot.push(makeLoot('sigil', e.x, e.y, 1)); secretGear(e.x, e.y, .7); sfx('weapon'); }
  if (srHas(R, 'volatile') && !e.boss) hazards.push({ kind: 'srboom', x: e.x, y: e.y, r: 64, t: .95, max: .95, dmg: 10 + stageIdx * 3 });
  if (srHas(R, 'hydra') && !e.srChild && !e.champ && !e.boss && e.def.move !== 'fly' && e.type !== 'srshadow' && enemies.filter(o => !o.dead).length < 9) { // two small ones crawl out of it
    for (const s of [-1, 1]) { SR.noEnt = true; const c = spawnEnemy(e.type, s); SR.noEnt = false; c.x = clamp(e.x + s * 24, camX + 30, camX + VW - 30); c.y = clamp(e.y + rand(-10, 10), FLOOR_TOP + 8, FLOOR_BOT); c.srChild = 1; c.srTiny = 1; c.hp = c.maxHp = Math.max(1, Math.round(c.maxHp * .4)); c.state = 'idle'; c.cd = rand(.8, 1.4); c.vz = 160; c.z = 1; c.vx = s * 80; c.air = true; }
    floatText(e.x, e.y, e.hh + 20, 'IT SPLITS', '#C8E89A', 14); waveActive = true; }
}
// ---------------- the room's reward: a card-box rises out of the floor; walk into it ----------------
function srChest(R, v, x) {
  x = clamp(x != null ? x : P.x + 90 * (P.facing || 1), camX + 70, camX + VW - 70);
  R.chest = { x, y: clamp(P.y, FLOOR_TOP + 34, FLOOR_BOT - 20), v: v * R.gen.mult * (R.clockLost ? .7 : 1), t: 0, open: false };
  sfx('trump'); burst(R.chest.x, R.chest.y, 10, ['#FFFFFF', R.gen.pal ? R.gen.pal.acc : '#EED48A', '#EED48A'], 24, 'spark', 0, true);
  fx.push({ kind: 'ring', x: R.chest.x, y: R.chest.y, z: 2, t: .5, max: .5, r: 70, col: '#EED48A', flat: 1 });
}
function srChestUpdate(R, dt) {
  const c = R.chest; c.t += dt; if (c.open || c.t < .7) return;
  if (Math.abs(P.x - c.x) < 32 && Math.abs(P.y - c.y) < 22 && P.z < 20) {
    c.open = true; shakeMag = Math.max(shakeMag, 4); flashT = .12;
    const said = srPay(c.x, c.y - 4, c.v); if (SR_KINDS[R.kind].reward) SR_KINDS[R.kind].reward(R, c.x, c.y);
    banner('THE ROOM PAYS', said, 2.4);
  }
}
function srPay(x, y, v) { // shards, sigils, arrows, armor and a power, more of each as v grows; a very rich room may give a card or a blade too
  v = Math.max(.3, v); const sv = Math.round((5 + stageIdx * 4) * (1 + .5 * save.cycle)), out = [];
  for (let i = 0; i < Math.round(4 + 6 * v); i++) loot.push(makeLoot('shard', x, y, sv)); out.push('SHARDS');
  const ns = Math.floor(.6 + 1.6 * v + Math.random() * .8); for (let i = 0; i < ns; i++) loot.push(makeLoot('sigil', x, y, 1)); if (ns) out.push(`${ns} SIGIL${ns > 1 ? 'S' : ''}`);
  const na = v >= .7 ? 2 : 1; for (let i = 0; i < na; i++) loot.push(makeLoot('arrow', x, y, 1));
  const ng = v >= 2.2 ? 2 : v >= .8 ? 1 : Math.random() < v ? 1 : 0; if (ng) { secretGear(x, y, clamp(.25 + .3 * v, 0, 1), ng); out.push(ng > 1 ? 'TWO PIECES OF ARMOR' : 'ARMOR'); }
  if (v >= .5) loot.push(Object.assign(makeLoot('power', x, y, 0), { power: pick(POWER_ORDER) }));
  if (v >= 1) loot.push(makeLoot('heal', x, y, 25));
  if (v >= 1.8 && Math.random() < .5) { const b = ['card', 'blade', 'edge'].filter(k => BOONS[k].ok()); if (b.length) { const k = pick(b), s = BOONS[k].sub(); BOONS[k].give(); out.push(s); persist(); } }
  burst(x, y, 30, ['#EED48A', '#FFFFFF', '#C8607A'], 40, 'spark', 0, true); sfx('weapon');
  return out.slice(0, 3).join(' · ');
}
function srBonus(x, y, k) { // an old room under hard rules pays a little over its usual
  if (k <= 0) return; for (let i = 0; i < Math.round(8 * k); i++) loot.push(makeLoot('shard', x, y, Math.round((5 + stageIdx * 4) * (1 + .5 * save.cycle))));
  for (let i = 0; i < Math.round(2 * k); i++) loot.push(makeLoot('sigil', x, y, 1)); floatText(x, y, 90, 'THE RULES PAY TOO', '#EED48A', 13);
}
// stand on something for a moment to choose it (passing over it doesn't count); a ring fills while you do
function srPads(R, dt, dwell, fire, small) {
  for (const pd of R.pads) { if (pd.done) continue; pd.dw = dwell;
    const on = Math.abs(P.x - pd.x) < (small ? 22 : 26) && Math.abs(P.y - pd.y) < (small ? 14 : 20) && P.z < 10 && P.state !== 'dead';
    if (pd.lock) { if (!on) pd.lock = false; pd.p = 0; continue; } // (it waits for you to step off before it counts again)
    pd.p = on ? (pd.p || 0) + dt : 0;
    if (on && pd.p >= dwell) { pd.p = 0; pd.lock = true; fire(pd); if (R.chosen && R.kind !== 'merchant') return; }
  }
}
const srTone = (hz) => { if (!sfxOn || !actx) return; try { tone(hz, .5, 'triangle', .1); tone(hz * 2, .3, 'sine', .03); } catch (e) {} };

// ---------------- new hazards: lightning that strikes anyone, burning ground, and foes that burst ----------------
const srHurtAll = (x, y, r, dmg, playerToo) => {
  if (playerToo && Math.hypot(P.x - x, (P.y - y) * 2.2) < r + 8 && P.z < 30) playerDamage(dmg, x, true);
  for (const e of enemies) if (!e.dead && e.state !== 'enter' && Math.hypot(e.x - x, (e.y - y) * 2.2) < r + e.hw && e.z < 40) strike(e, dmg * 1.6, Math.sign(e.x - x) || 1, { dmg: dmg * 1.6, kb: 180, launch: 260, power: 1 });
};
HAZARD_FX.srbolt = {
  update(h) { if (h.t <= 0 && !h.done) { h.done = true; srHurtAll(h.x, h.y, h.r, h.dmg, true); sfx('crit'); sfx('slam'); shakeMag = Math.max(shakeMag, 7); flashT = Math.max(flashT, .08);
    burst(h.x, h.y, 6, ['#FFFFFF', '#C8D8FF', '#8FA8FF'], 18, 'spark', 0, true); fx.push({ kind: 'ring', x: h.x, y: h.y, z: 2, t: .3, max: .3, r: h.r * 1.6, col: '#C8D8FF', flat: 1 }); } },
  draw(h, t) { const k = 1 - Math.max(0, h.t) / h.max;
    if (!h.done) { ctx.strokeStyle = `rgba(200,216,255,${.5 + .4 * Math.sin(t * 20)})`; ctx.lineWidth = 2; ell(h.x, h.y, h.r, h.r * .32); ctx.stroke(); ctx.fillStyle = `rgba(200,216,255,${.12 + .25 * k})`; ell(h.x, h.y, h.r * k, h.r * .32 * k); ctx.fill(); return; }
    const a = Math.max(0, 1 + h.t / .35); if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; const rr = mulberry(Math.floor(h.x * 7));
    for (const [w, c] of [[7, 'rgba(140,170,255,.5)'], [2.4, '#FFFFFF']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); let x = h.x + (rr() - .5) * 40, y = Y_OFF; ctx.moveTo(x, y); while (y < h.y) { y += 18 + rr() * 16; x += (rr() - .5) * 26; ctx.lineTo(y >= h.y ? h.x : x, Math.min(y, h.y)); } ctx.stroke(); }
    ctx.restore(); } };
HAZARD_FX.srfire = {
  update(h, dt) { if (h.max - h.t < h.warm) return; h.tick = (h.tick || 0) - dt; if (h.tick > 0) return; h.tick = .45;
    if (Math.hypot(P.x - h.x, (P.y - h.y) * 2.2) < h.r && P.z < 12) playerDamage(h.dmg, h.x, false);
    for (const e of enemies) if (!e.dead && e.state !== 'enter' && e.z < 12 && Math.hypot(e.x - h.x, (e.y - h.y) * 2.2) < h.r + e.hw * .5) strike(e, h.dmg, Math.sign(e.x - h.x) || 1, { dmg: h.dmg, kb: 40, launch: 0, power: 0 }); },
  draw(h, t) { const age = h.max - h.t;
    if (age < h.warm) { const k = age / h.warm; ctx.strokeStyle = `rgba(255,150,70,${.5 + .4 * Math.sin(t * 18)})`; ctx.lineWidth = 2; ell(h.x, h.y, h.r, h.r * .32); ctx.stroke(); ctx.fillStyle = `rgba(255,120,50,${.1 + .2 * k})`; ell(h.x, h.y, h.r * k, h.r * .32 * k); ctx.fill(); return; }
    const fade = Math.min(1, h.t / .5, (age - h.warm) / .2); ctx.save(); ctx.globalAlpha = Math.max(0, fade);
    ctx.fillStyle = 'rgba(60,20,10,.5)'; ell(h.x, h.y, h.r, h.r * .32); ctx.fill(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, fx0 = h.x + Math.cos(a) * h.r * .7 * ((i * 37) % 10) / 10, fy = h.y + Math.sin(a) * h.r * .22, fh = 14 + 10 * Math.sin(t * 9 + i * 2.1);
      const g = ctx.createLinearGradient(0, fy - fh, 0, fy); g.addColorStop(0, 'rgba(255,220,120,0)'); g.addColorStop(1, 'rgba(255,120,50,.8)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(fx0 - 5, fy); ctx.quadraticCurveTo(fx0 - 3, fy - fh * .6, fx0 + Math.sin(t * 7 + i) * 3, fy - fh); ctx.quadraticCurveTo(fx0 + 3, fy - fh * .6, fx0 + 5, fy); ctx.fill(); }
    ctx.restore(); } };
HAZARD_FX.srboom = {
  update(h) { if (h.t <= 0 && !h.done) { h.done = true; srHurtAll(h.x, h.y, h.r, h.dmg, true); sfx('slam'); shakeMag = Math.max(shakeMag, 7); burst(h.x, h.y, 10, ['#FFD27A', '#FF7A4A', '#FFFFFF'], 22, 'spark', 0, true); fx.push({ kind: 'ring', x: h.x, y: h.y, z: 2, t: .35, max: .35, r: h.r * 1.4, col: '#FFB35A', flat: 1 }); } },
  draw(h, t) { if (h.done) return; const k = 1 - h.t / h.max; ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(255,120,60,${.4 + .5 * Math.abs(Math.sin(t * (10 + k * 20)))})`; ctx.lineWidth = 2; ell(h.x, h.y, h.r, h.r * .32); ctx.stroke(); softDab(h.x, h.y - 10, 20 + k * 20, '255,140,70', .3 + k * .4); ctx.restore(); } };

// ---------------- drawing the rooms' furniture (painted once each place, like the props) ----------------
function srChestSprite(open) {
  const p = SR.last && SR.last.pal || { acc: '#C8607A', accDeep: '#5A2A3A' };
  return propSprite(open ? 'srchestO' : 'srchest', 70, 64, 35, 54, () => {
    const body = shade(p.accDeep, -.1), gold = '#D8AA55', lit = '#FFE8A8';
    ctx.fillStyle = body; rrect(-24, -24, 48, 24, 3); ctx.fill(); // the box
    for (let i = 0; i < 8; i++) dab(-22 + i * 6, -14 + (i % 2) * 6, 4, shade(body, i % 2 ? .15 : -.2), .5);
    ctx.fillStyle = gold; ctx.fillRect(-24, -6, 48, 3); ctx.fillRect(-14, -24, 3, 24); ctx.fillRect(11, -24, 3, 24);
    if (!open) { ctx.fillStyle = shade(body, .1); ctx.beginPath(); ctx.moveTo(-25, -24); ctx.quadraticCurveTo(0, -40, 25, -24); ctx.closePath(); ctx.fill(); ctx.fillStyle = gold; ctx.fillRect(-25, -26, 50, 3);
      ctx.fillStyle = lit; drawTrumpGlyph(SECRET_KEY[(SR.last ? SR.last.seed : 0) % 5], 0, -14, 6); ctx.fillStyle = gold; rrect(-4, -27, 8, 8, 2); ctx.fill(); }
    else { ctx.fillStyle = shade(body, -.25); ctx.beginPath(); ctx.moveTo(-25, -24); ctx.lineTo(-22, -48); ctx.quadraticCurveTo(0, -60, 22, -48); ctx.lineTo(25, -24); ctx.closePath(); ctx.fill(); ctx.fillStyle = gold; ctx.fillRect(-23, -48, 46, 2.5);
      ctx.fillStyle = '#FFF2C8'; ell(0, -24, 20, 4); ctx.fill(); }
  }, { foot: 10, seed: 71, haze: .05, line: .7 });
}
function srChestList(R, list, t) {
  const c = R.chest; if (!c) return; const rise = Math.min(1, c.t / .6);
  list.push([c.y, () => { onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDab(c.x, c.y - 16, 46, '255,220,140', c.open ? .12 : .22 + .1 * Math.sin(t * 4)); ctx.restore(); });
    propDraw(srChestSprite(c.open), c.x, c.y, { sy: .3 + .7 * ease(rise), sh: 26 }); }]);
}
function srBoxes(R, box) { const K = SR_KINDS[R.kind]; if (K && K.boxes && !R.gen.classic) K.boxes(R, box); if (R.chest) box(R.chest.x, R.chest.y, 0, 60, 100); }
function srList(R, list, t) {
  const K = SR_KINDS[R.kind]; if (K && K.list && !R.gen.classic) K.list(R, list, t);
  srChestList(R, list, t);
  for (const e of enemies) { if (e.dead) continue;
    if (e.srCrown) list.push([e.y + .2, () => onMain(() => { const s = (e.srScale || 1) * (e.champ ? 1.3 : 1), y = e.y - e.z - e.hh * s - 30 + Math.sin(t * 3) * 2; // a crown floats over the one with a price on its head
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDab(e.x, y, 16, '255,210,120', .35); ctx.restore(); ctx.fillStyle = '#FFD27A'; awPath([e.x - 9, y + 4, e.x - 9, y - 4, e.x - 4.5, y, e.x, y - 7, e.x + 4.5, y, e.x + 9, y - 4, e.x + 9, y + 4]); ctx.fill(); ctx.strokeStyle = '#6A4A1A'; ctx.lineWidth = 1; ctx.stroke(); })]);
    if (e.srEyes) list.push([e.y + .2, () => onMain(() => { const y = e.y - e.z - e.hh * .86; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = e.srEyes; circle(e.x + e.facing * 3, y, 1.6); ctx.fill(); circle(e.x + e.facing * 7, y, 1.3); ctx.fill(); softDab(e.x + e.facing * 5, y, 7, '200,184,240', .4); ctx.restore(); })]);
  }
}
function srLabel(x, y, s, size, col) { ctx.font = `600 ${size}px Cinzel, serif`; ctx.textAlign = 'center'; ctx.fillStyle = col || '#FFF0C8'; ctx.strokeStyle = 'rgba(30,20,30,.85)'; ctx.lineWidth = 3; ctx.strokeText(s, x, y); ctx.fillText(s, x, y); }
function srRing(pd, x, y) { if (!(pd.p > 0) || pd.done) return; const k = clamp(pd.p / (pd.dw || 1), 0, 1); ctx.strokeStyle = 'rgba(255,240,200,.9)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(x, y, 22, 7, 0, -Math.PI / 2, -Math.PI / 2 + TAU * k); ctx.stroke(); }
function srAltars(R, list, t) {
  const p = R.gen.pal;
  for (const pd of R.pads) { const O = SR_OFFERS[pd.id], gone = R.chosen && R.chosen !== pd.id;
    list.push([pd.y, () => {
      const sp = propSprite('sraltar', 60, 80, 30, 72, () => { const s = p.stone; ctx.fillStyle = s.dark; ctx.fillRect(-16, -8, 32, 8); ctx.fillStyle = s.base; ctx.fillRect(-11, -40, 22, 33); ctx.fillStyle = s.lit; ctx.fillRect(p.side > 0 ? 3 : -11, -40, 8, 33);
        ctx.fillStyle = s.base; ctx.fillRect(-15, -46, 30, 7); ctx.fillStyle = s.lit; ctx.fillRect(-15, -46, 30, 2); ctx.fillStyle = s.dark; ell(0, -48, 12, 4); ctx.fill(); ctx.fillStyle = p.accDeep; drawTrumpGlyph(SECRET_KEY[2], 0, -24, 6); }, { foot: 12, seed: 33 });
      propDraw(sp, pd.x, pd.y, { sh: 22 });
      onMain(() => { const a = gone ? Math.max(0, 1 - (R.t - (R.chosenAtT || R.t)) ) * 0 + .25 : 1; ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'lighter'; // the offering burns in the bowl
        const fy = pd.y - 52, col = srRgb(O.col); softDab(pd.x, fy - 6, 24, col, .4 + .1 * Math.sin(t * 5 + pd.x));
        for (let i = 0; i < 3; i++) { const fh = 12 + 5 * Math.sin(t * 8 + i * 2), fx0 = pd.x + (i - 1) * 4; const g = ctx.createLinearGradient(0, fy - fh, 0, fy); g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},.9)`); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(fx0 - 4, fy); ctx.quadraticCurveTo(fx0, fy - fh * 1.2, fx0 + 4, fy); ctx.fill(); }
        ctx.restore(); if (gone) return; ctx.save(); ctx.fillStyle = O.col; drawBoonGlyph(O.glyph, pd.x, fy - 26 + Math.sin(t * 2 + pd.x) * 2, 7); ctx.restore();
        if (R.chosen === pd.id) { srLabel(pd.x, fy - 44, 'GIVEN', 9); return; }
        srLabel(pd.x, fy - 44, O.name.toUpperCase(), 9); srLabel(pd.x, pd.y + 18, O.cost(), 7, '#E8D8B0'); srRing(pd, pd.x, pd.y); });
    }]);
  }
}
function srStall(R, list, t) {
  const p = R.gen.pal, mx = 930, my = FLOOR_TOP + 30;
  list.push([my, () => { const sp = propSprite('srstall', 150, 140, 75, 128, () => { // a pedlar's stall: a striped awning, a cloth-hung table, and the pedlar hooded behind it
      ctx.fillStyle = '#3A2A20'; ctx.fillRect(-58, -112, 5, 112); ctx.fillRect(53, -112, 5, 112);
      ctx.fillStyle = '#2A1E2A'; ctx.beginPath(); ctx.moveTo(-18, -38); ctx.quadraticCurveTo(-22, -84, 0, -92); ctx.quadraticCurveTo(22, -84, 18, -38); ctx.closePath(); ctx.fill(); // the pedlar, hooded
      ctx.fillStyle = '#120A12'; ell(0, -74, 8, 9); ctx.fill();
      for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? p.acc : '#F0E2C0'; awPath([-62 + i * 21, -118, -41 + i * 21, -118, -41 + i * 21 + 2, -100, -62 + i * 21 + 2, -100]); ctx.fill(); ctx.beginPath(); ctx.arc(-51 + i * 21 + 1, -100, 10.5, 0, Math.PI); ctx.fill(); }
      ctx.fillStyle = shade(p.accDeep, -.1); ctx.fillRect(-56, -40, 112, 40); ctx.fillStyle = p.acc; ctx.fillRect(-56, -40, 112, 4);
      for (let i = 0; i < 5; i++) { ctx.fillStyle = [p.moon, p.acc, '#9FD8E0', '#D8AA55', p.leaf[2]][i]; rrect(-46 + i * 20, -54, 10, 14, 3); ctx.fill(); } // jars and bottles on the counter
      ctx.fillStyle = '#D8AA55'; ctx.fillRect(40, -96, 2, 18); circle(41, -74, 5); ctx.fill();
    }, { foot: 14, seed: 41 });
    propDraw(sp, mx, my, { sh: 70 });
    onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDab(mx + 41, my - 74, 26, '255,210,140', .45 + .1 * Math.sin(t * 3)); ctx.fillStyle = '#E8D8FF'; const bl = Math.sin(t * .9) > .97 ? 0 : 1; if (bl) { circle(mx - 3, my - 74, 1.4); ctx.fill(); circle(mx + 3, my - 74, 1.4); ctx.fill(); } ctx.restore();
      srLabel(mx, my - 146, R.gen.merchant.toUpperCase(), 8, '#EED48A'); }); }]);
  for (const pd of R.pads) { const W = SR_WARES[pd.id];
    list.push([pd.y, () => { const sp = propSprite('srped', 40, 50, 20, 44, () => { const s = p.stone; ctx.fillStyle = s.dark; ctx.fillRect(-12, -6, 24, 6); ctx.fillStyle = s.base; ctx.fillRect(-8, -26, 16, 21); ctx.fillStyle = s.lit; ctx.fillRect(p.side > 0 ? 2 : -8, -26, 6, 21); ctx.fillStyle = s.base; ctx.fillRect(-11, -30, 22, 5); }, { foot: 8, seed: 21 });
      propDraw(sp, pd.x, pd.y, { sh: 16 });
      onMain(() => { const y = pd.y - 46 + Math.sin(t * 2 + pd.x) * 2;
        if (pd.done) { srLabel(pd.x, pd.y - 40, 'SOLD', 9, '#C8B8A0'); return; }
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDab(pd.x, y, 18, p.accRgb, .35); ctx.restore(); ctx.fillStyle = '#FFF0C8'; drawBoonGlyph(W.glyph, pd.x, y, 7);
        srLabel(pd.x, y - 16, W.name.toUpperCase(), 7); srLabel(pd.x, pd.y + 16, `${pd.price[0]} ${pd.price[1].toUpperCase()}`, 8, save[pd.price[1]] >= pd.price[0] ? '#9FE8C0' : '#FF9A8A'); srRing(pd, pd.x, pd.y); }); }]);
  }
}
function srCards(R, list, t) {
  const p = R.gen.pal, face = { fortune: ['FORTUNE', 'hoard', '#EED48A'], plain: ['A MODEST HAND', 'ink', '#C8D8F0'], ambush: ['THE KNAVE', 'blade', '#FF8A7A'] };
  for (const pd of R.pads) list.push([pd.y, () => {
    const sp = propSprite('srstand', 50, 40, 25, 34, () => { ctx.fillStyle = '#3A2A20'; ctx.fillRect(-14, -8, 28, 6); ctx.fillRect(-2, -30, 4, 26); ctx.fillRect(-12, -2, 4, 2); ctx.fillRect(8, -2, 4, 2); }, { foot: 6, seed: 23 });
    propDraw(sp, pd.x, pd.y, { sh: 20 });
    onMain(() => { const w = 34, h = 52, cy = pd.y - 34 - h / 2 + Math.sin(t * 1.6 + pd.x) * 1.5, s = Math.cos(pd.flip * Math.PI), up = s < 0; // the card turns over
      ctx.save(); ctx.translate(pd.x, cy); ctx.scale(Math.max(.05, Math.abs(s)), 1);
      ctx.fillStyle = up ? '#F6E6B8' : p.accDeep; rrect(-w / 2, -h / 2, w, h, 4); ctx.fill(); ctx.strokeStyle = up ? '#B8904A' : p.acc; ctx.lineWidth = 1.6; rrect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6, 3); ctx.stroke();
      if (up) { const f = face[pd.id]; ctx.fillStyle = f[2] === '#EED48A' ? '#8A6A3A' : '#5A3A3A'; drawBoonGlyph(f[1], 0, -2, 9); }
      else { ctx.fillStyle = p.acc; drawTrumpGlyph(SECRET_KEY[(R.gen.seed + 1) % 5], 0, 0, 9); }
      ctx.restore();
      if (up) srLabel(pd.x, cy - h / 2 - 8, face[pd.id][0], 8, face[pd.id][2]); else if (!R.chosen) srRing(pd, pd.x, pd.y); }); }]);
}
function srStones(R, list, t) {
  const p = R.gen.pal; list.push([0, () => onMain(() => { for (const s of R.stones) { // flat stones in the floor, each cut with a rune; lit, they sing
    ctx.fillStyle = p.stone.dark; ell(s.x, s.y + 2, 26, 9); ctx.fill(); ctx.fillStyle = p.stone.base; ell(s.x, s.y, 24, 8); ctx.fill(); ctx.strokeStyle = p.stone.lit; ctx.lineWidth = 1; ell(s.x, s.y - .5, 22, 7); ctx.stroke();
    const lit = s.f, ready = R.phase === 'input';
    if (lit > 0 || ready) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDab(s.x, s.y, 30, p.accRgb, lit * .7 + (ready ? .08 : 0)); if (lit > .05) softDab(s.x, s.y - 30, 26, p.accRgb, lit * .35); ctx.restore(); }
    ctx.save(); ctx.translate(s.x, s.y); ctx.scale(1, .34); ctx.fillStyle = lit > .1 ? '#FFFFFF' : p.accDeep; drawTrumpGlyph(SECRET_KEY[s.glyph % 5], 0, 0, 12); ctx.restore();
    if (ready) srRing(s, s.x, s.y + 1);
  } })]);
}

// ---------------- in the dark: only what is near you, and what glows, can be seen ----------------
let srDarkC = null;
function srOverlay() {
  if (typeof stage === 'undefined' || !stage || !stage.secret || !stage.room || !stage.room.gen || zoneTrans) return;
  const R = stage.room, G = R.gen;
  if (srHas(R, 'lightless')) {
    const S = 4, w = Math.ceil(VW / S), h = Math.ceil(VH / S); if (!srDarkC) srDarkC = document.createElement('canvas'); if (srDarkC.width !== w || srDarkC.height !== h) { srDarkC.width = w; srDarkC.height = h; }
    const g = srDarkC.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(5,2,10,.96)'; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'destination-out'; g.setTransform(1 / S, 0, 0, 1 / S, -camX / S, 0);
    const hole = (x, y, r, a = 1) => { const gr = g.createRadialGradient(x, y, r * .25, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
    hole(P.x, P.y - P.z - 30, 150 + 6 * Math.sin(performance.now() / 300));
    for (const h of hazards) hole(h.x != null ? h.x : P.x, h.y, (h.r || 30) * 1.6, .8);
    for (const k of loot) hole(k.x, k.y - 10, 30, .7);
    for (const p of projs) if (p.owner === 'e') hole(p.x, p.y - (p.z || 0), 40, .9);
    if (R.chest) hole(R.chest.x, R.chest.y - 20, 90);
    for (const pd of R.pads || []) hole(pd.x, pd.y - 40, 70, .8);
    for (const s of R.stones || []) if (s.f > 0 || R.phase === 'input') hole(s.x, s.y, 50, .5 + .5 * s.f);
    if (R.kind === 'merchant') hole(971, FLOOR_TOP - 44, 110);
    ctx.save(); ctx.setTransform(ctx.getTransform()); ctx.imageSmoothingEnabled = true; ctx.drawImage(srDarkC, 0, 0, w * S, h * S); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; // eyes in the dark: you can always tell where they are
    for (const e of enemies) { if (e.dead) continue; const x = e.x - camX, y = e.y - e.z - e.hh * (e.srScale || 1) * .8, f = e.facing || 1;
      ctx.fillStyle = e.state === 'wind' ? 'rgba(255,90,70,.95)' : 'rgba(255,190,120,.8)'; circle(x + f * 2, y, 1.6); ctx.fill(); circle(x + f * 7, y, 1.4); ctx.fill(); softDab(x + f * 4, y, 9, '255,140,90', .3); }
    ctx.restore();
  }
  ctx.save(); ctx.textAlign = 'center'; // the rules in force, and any clock
  if (G.mods.length) { ctx.font = '600 8px Cinzel, serif'; ctx.fillStyle = 'rgba(255,240,200,.85)'; ctx.strokeStyle = 'rgba(20,12,24,.8)'; ctx.lineWidth = 3; const s = G.mods.map(m => SR_MODS[m].tag).join('  ·  '); ctx.strokeText(s, VW / 2, Y_OFF + 16); ctx.fillText(s, VW / 2, Y_OFF + 16); }
  const clock = (s, warn) => { ctx.font = '700 15px Cinzel, serif'; ctx.fillStyle = warn ? '#FF9A8A' : '#E8F8F4'; ctx.strokeStyle = 'rgba(10,20,30,.85)'; ctx.lineWidth = 4; ctx.strokeText(s, VW / 2, Y_OFF + 40); ctx.fillText(s, VW / 2, Y_OFF + 40); };
  if (R.kind === 'horde' && R.phase === 'fight') clock(`HOLD · ${Math.ceil(R.left)}`, R.left < 6);
  else if (R.kind === 'hunt' && R.phase === 'chase') clock(`IT ESCAPES IN ${Math.ceil(R.left)}`, R.left < 6);
  else if (R.clock != null && !R.clockLost && waveIdx < stage.waves.length && (waveIdx > 0 || waveActive)) clock(`${Math.ceil(R.clock)}`, R.clock < 8);
  ctx.restore();
}
{ const _gf = gradeFrame; gradeFrame = function (themeId) { _gf(themeId); srOverlay(); }; }
// hooks into things that are defined after this file loads, put in when the first room is entered
function srHooks() {
  if (SR.hooked) return; SR.hooked = true;
  const _de = drawEnemy;
  drawEnemy = function (e, t) {
    if (!e.srScale && !e.srTint && !e.srTiny) return _de(e, t);
    const s = (e.srScale || 1) * (e.srTiny ? .62 : 1), ti = TINT; ctx.save();
    if (s !== 1) { ctx.translate(e.x, e.y); ctx.scale(s, s); ctx.translate(-e.x, -e.y); }
    if (e.srTint) TINT = e.srTint;
    try { _de(e, t); } finally { TINT = ti; ctx.restore(); }
    if (e.srGold && !e.dead) onMain(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; softDab(e.x, e.y - e.z - e.hh * .5, e.hh * .9, '255,220,130', .25 + .1 * Math.sin(t * 6)); ctx.restore(); });
  };
  const _ce = chooseEntrance;
  chooseEntrance = function (e) {
    if (SR.noEnt) return false;
    const R = stage && stage.secret && stage.room; if (R && R.gen && R.gen.entry) return setEntrance(e, R.gen.entry) || _ce(e);
    return _ce(e);
  };
  const _st = strike; // a tiny foe (lilliput, or a hydra's spawn) is punted like a shrunken one, and takes the same extra
  strike = function (e, base, dir, m, ...a) { if (e && e.srTiny && !e.boss) { base = Math.round(base * 1.4); m = Object.assign({}, m, { kb: (m && m.kb || 0) * 1.8 + 80, launch: (m && m.launch || 0) * 1.3 + 80 }); } return _st(e, base, dir, m, ...a); };
}
