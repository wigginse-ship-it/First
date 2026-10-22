'use strict';
// ---------- the painted look: a medieval panel painting ----------
// Every fighter, creature, boss and weapon is painted into one layer, which gets a firm dark contour,
// visible brushwork and fine tempera-style modelling strokes. The whole picture then sits under aged,
// crackled varnish inside a gilded frame. Nothing here changes from frame to frame on its own, so the
// picture holds still: textures are anchored to the figure or the world, never to the screen.

// tileable value noise: 0..1 at (x, y) on a grid that wraps every `per` cells
function tileNoise(seed, per) {
  const r = mulberry(seed), g = []; for (let i = 0; i < per * per; i++) g.push(r());
  const at = (i, j) => g[((j % per + per) % per) * per + ((i % per + per) % per)];
  return (x, y) => {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    return lerp(lerp(at(i, j), at(i + 1, j), sx), lerp(at(i, j + 1), at(i + 1, j + 1), sx), sy);
  };
}
function texCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
// Safari caps the total memory all canvases may use, and frees a dropped canvas only when it gets around to it.
// So big working canvases are borrowed from a small pool, and anything retired is shrunk to nothing at once.
const POOL = [];
function scratch(i, w, h) {
  let p = POOL[i]; if (!p) p = POOL[i] = texCanvas(w, h);
  const [c, g] = p;
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } else { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, w, h); }
  return p;
}
function releaseScratch() { for (const p of POOL) if (p) { p[0].width = 1; p[0].height = 1; } }
function retire(c) { if (c) { c.width = 1; c.height = 1; } }
// draw something on a tile so it wraps seamlessly across the edges
function wrapDraw(w, h, fn) { for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) fn(ox, oy); }

let TEX = null;
function paintTextures() {
  if (TEX) return TEX;
  // brushwork: short, overlapping strokes of lighter and darker paint, mostly laid in one direction
  const brushes = (S, H, seed, n, len, dir, wid = 1, k = 1) => {
    const [c, g] = texCanvas(S, H), r = mulberry(seed); g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const x = r() * S, y = r() * H, a = (Array.isArray(dir) ? dir[Math.floor(r() * dir.length)] : dir) + (r() - .5) * .6, l = len * (.5 + r()), light = r() < .5;
      const col = light ? `rgba(255,238,205,${(.04 + r() * .07) * k})` : `rgba(45,28,16,${(.04 + r() * .08) * k})`, lw = (2 + r() * 2.5) * wid, bend = (r() - .5) * l * .5;
      wrapDraw(S, H, (ox, oy) => {
        const x0 = x + ox, y0 = y + oy; if (x0 < -l || x0 > S + l || y0 < -l || y0 > H + l) return;
        g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(x0, y0);
        g.quadraticCurveTo(x0 + Math.cos(a) * l * .5 - Math.sin(a) * bend, y0 + Math.sin(a) * l * .5 + Math.cos(a) * bend, x0 + Math.cos(a) * l, y0 + Math.sin(a) * l); g.stroke();
      });
    }
    return c;
  };
  // short, broad dabs crossing in a few directions, like tempera laid on in small strokes
  const brush = brushes(128, 128, 51, 260, 5.5, [-.7, .5, 1.4]), sky = brushes(512, 256, 52, 520, 30, -.04, 1.4, 1.2);
  // tempera modelling: fine parallel strokes in warm umber, how panel painters built up shadow
  const [hc, hg] = texCanvas(64, 64), hr = mulberry(31); hg.lineCap = 'round';
  for (let k = -64; k < 128; k += 4) {
    hg.strokeStyle = `rgba(52,30,16,${.3 + hr() * .45})`; hg.lineWidth = .6 + hr() * .7;
    const len = 18 + hr() * 30, st = hr() * (64 - len * .7);
    wrapDraw(64, 64, (ox) => { hg.beginPath(); hg.moveTo(k + ox + st, 64 - st); hg.quadraticCurveTo(k + ox + st + len * .5 + 2, 64 - st - len * .5, k + ox + st + len * .7, 64 - st - len * .7); hg.stroke(); });
  }
  // craquelure: the fine network of cracks in old varnish, on a transparent sheet
  const [qc, qg] = texCanvas(512, 512), qr = mulberry(61), N = 14, cell = 512 / N, pts = [];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) pts.push([(i + .2 + qr() * .6) * cell, (j + .2 + qr() * .6) * cell]);
  const P = (i, j) => { const p = pts[((j + N) % N) * N + ((i + N) % N)]; return [p[0] + Math.floor(i / N) * 512, p[1] + Math.floor(j / N) * 512]; };
  qg.lineJoin = 'round';
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) for (const [di, dj] of [[1, 0], [0, 1], [1, 1]]) {
    if (di && dj && qr() < .6) continue;
    const a = P(i, j), b = P(i + di, j + dj), mx = (a[0] + b[0]) / 2 + (qr() - .5) * cell * .35, my = (a[1] + b[1]) / 2 + (qr() - .5) * cell * .35;
    const al = .07 + qr() * .1, lw = .4 + qr() * .4;
    wrapDraw(512, 512, (ox, oy) => {
      qg.strokeStyle = `rgba(40,24,10,${al})`; qg.lineWidth = lw; qg.beginPath(); qg.moveTo(a[0] + ox, a[1] + oy); qg.lineTo(mx + ox, my + oy); qg.lineTo(b[0] + ox, b[1] + oy); qg.stroke();
    });
  }
  // the panel itself: warm, uneven varnish, mottled a little darker in places; used with multiply
  const [vc, vg] = texCanvas(256, 256), vd = vg.createImageData(256, 256), n1 = tileNoise(11, 8), n2 = tileNoise(12, 32);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const d = n1(x / 32, y / 32) * 14 + n2(x / 8, y / 8) * 7, i = (y * 256 + x) * 4;
    vd.data[i] = 252 - d * .7; vd.data[i + 1] = 240 - d; vd.data[i + 2] = 212 - d * 1.3; vd.data[i + 3] = 255;
  }
  vg.putImageData(vd, 0, 0);
  // dry brush for the prince: long, thin, nearly vertical drags of dark and pale paint, and a scatter of fine specks
  const [dc, dg] = texCanvas(96, 160), dr = mulberry(77); dg.lineCap = 'round';
  for (let i = 0; i < 300; i++) {
    const x = dr() * 96, y = dr() * 160, l = 6 + dr() * 24, a = Math.PI / 2 + (dr() - .5) * .26, dark = dr() < .6;
    const col = dark ? `rgba(10,6,8,${.14 + dr() * .22})` : `rgba(255,240,214,${.08 + dr() * .11})`, lw = .4 + dr() * 1.1;
    wrapDraw(96, 160, (ox, oy) => { dg.strokeStyle = col; dg.lineWidth = lw; dg.beginPath(); dg.moveTo(x + ox, y + oy); dg.lineTo(x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l); dg.stroke(); });
  }
  for (let i = 0; i < 90; i++) { const x = dr() * 96, y = dr() * 160; dg.fillStyle = dr() < .5 ? 'rgba(12,8,8,.3)' : 'rgba(255,236,200,.16)'; dg.fillRect(x, y, .8 + dr() * .7, .8 + dr() * .7); }
  TEX = { brush, sky, hatch: hc, crack: qc, varnish: vc, dry: dc };
  return TEX;
}
function texPat(g, name) { // patterns belong to a context, so cache one per context
  const T = paintTextures(); g.__pat = g.__pat || {};
  return g.__pat[name] || (g.__pat[name] = g.createPattern(T[name], 'repeat'));
}

// ---------- painting a pre-rendered background layer (done once, when a world is built) ----------
// ink: contour color, line: contour strength, lw: contour width, brush: how much brushwork shows, hatch: modelling strokes low down
function paintLayer(canvas, o) {
  const w = canvas.width, h = canvas.height, g = canvas.getContext('2d');
  { const [tc, tg] = scratch(0, w, h), [cc, cg] = scratch(1, w, h); cg.drawImage(canvas, 0, 0); wobbleInto(cc, g, tc, tg, K, o.seed || 0, .7 * K); } // painted by hand, so no edge is ruled
  const [sc, s] = scratch(2, w, h);
  s.drawImage(canvas, 0, 0); s.globalCompositeOperation = 'source-in'; s.fillStyle = o.ink; s.fillRect(0, 0, w, h);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  g.globalAlpha = o.brush; g.fillStyle = texPat(g, 'brush'); g.save(); g.scale(K / 2, K / 2); g.fillRect(0, 0, w * 2 / K, h * 2 / K); g.restore();
  if (o.hatch) { g.globalAlpha = o.hatch; g.fillStyle = texPat(g, 'hatch'); g.fillRect(0, h * .55, w, h * .45); }
  // a firm contour just outside every shape
  g.globalCompositeOperation = 'destination-over'; g.globalAlpha = o.line;
  const lw = o.lw * K;
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + .4; g.drawImage(sc, Math.cos(a) * lw, Math.sin(a) * lw); }
  g.restore();
}
const WOB = tileNoise(91, 64);
function wobbleInto(src, dst, tmp, tg, px, o, amp) { // src -> tmp (rows shift sideways) -> dst (columns shift up and down); the layer tiles, so rows wrap
  const w = src.width, h = src.height, band = Math.max(2, Math.round(2 * px));
  tg.save(); tg.setTransform(1, 0, 0, 1, 0, 0); tg.clearRect(0, 0, w, h); // (not 'copy', which would wipe everything outside each band)
  for (let y = 0; y < h; y += band) { const d = (WOB(y / px * .05, o) - .5) * 2 * amp; tg.drawImage(src, 0, y, w, band, d, y, w, band); tg.drawImage(src, 0, y, w, band, d - Math.sign(d) * w, y, w, band); }
  tg.restore();
  dst.save(); dst.setTransform(1, 0, 0, 1, 0, 0); dst.globalCompositeOperation = 'source-over'; dst.clearRect(0, 0, w, h);
  for (let x = 0; x < w; x += band) dst.drawImage(tmp, x, 0, band, h, x, (WOB(x / px * .05, o + 20) - .5) * 2 * amp, band, h);
  dst.restore();
}

// ---------- the figure layer ----------
let inkC = null, inkG = null, silC = null, silG = null, rimC = null, rimG = null, mainCtx = null;
// paint quality steps down by itself if the phone can't keep up: 1 = painted figures, 0 = figures drawn straight onto the page
let PAINT_Q = 1, perfN = 0, perfT = 0, perfSkip = 60, perfPrev = 0, perfLock = false;
function paintPerf(rawDt) {
  if (perfLock) return;
  if (perfSkip > 0) { perfSkip--; return; } // ignore the first second after starting or a change
  if (rawDt > .2) { perfN = perfT = 0; return; } // a stall (tab switch, menu) says nothing about drawing speed
  perfN++; perfT += rawDt;
  if (perfN < 90) return;
  const avg = perfT / perfN; perfN = perfT = 0;
  // stepping down didn't speed anything up: the frame rate is capped (Low Power Mode runs at 30), so put the art back
  if (perfPrev && avg > perfPrev * .9) { PAINT_Q++; perfLock = true; return; }
  perfPrev = 0;
  if (avg > 1 / 42 && PAINT_Q > 0) { PAINT_Q--; perfPrev = avg; perfSkip = 30; }
}
const IB = { x: 0, y: 0, w: 0, h: 0 }; // the screen box the figures occupy; all the work stays inside it
// The prince is painted on a layer of his own inside the figure layer, after the reference sheet: a fine dark ink line
// instead of the thick contour, no pale rim, and his own brushwork (dry, mostly vertical strokes, a few specks, umber
// modelling on the side away from the light). His box on screen is HB; inkEnd leaves him out of its contour and rim.
const HB = { x: 0, y: 0, w: 0, h: 0, on: false };
let heroC = null, heroG = null, heroSC = null, heroSG = null, HERO_HATCHED = false;
function heroInk(cx, cy, fn) {
  if (PAINT_Q === 0 || ctx !== inkG || HB.on || TINT || FLASH) { fn(); return; }
  const m = ctx.getTransform(); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [px, py] of [[cx - 135, cy - 150], [cx + 135, cy - 150], [cx - 135, cy + 18], [cx + 135, cy + 18]]) { const X = m.a * px + m.c * py + m.e, Y = m.b * px + m.d * py + m.f; x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); }
  x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(inkC.width, Math.ceil(x1)); y1 = Math.min(inkC.height, Math.ceil(y1));
  const w = x1 - x0, h = y1 - y0; if (w < 4 || h < 4) { fn(); return; }
  if (!heroC || heroC.width < w || heroC.height < h) { retire(heroC); retire(heroSC); [heroC, heroG] = texCanvas(w + 64, h + 64); [heroSC, heroSG] = texCanvas(w + 64, h + 64); }
  Object.assign(HB, { x: x0, y: y0, w, h, on: true });
  heroG.setTransform(1, 0, 0, 1, 0, 0); heroG.globalCompositeOperation = 'source-over'; heroG.globalAlpha = 1; heroG.clearRect(0, 0, w + 2, h + 2);
  heroG.setTransform(m.a, m.b, m.c, m.d, m.e - x0, m.f - y0);
  const prev = ctx; ctx = heroG;
  HEAD_MASK = null;
  try { fn(); heroPaint(cx, cy); } finally { ctx = prev; }
  // the ink line: his own silhouette, a fine stroke's width all round, laid under him on his layer
  const r = .5 * K;
  heroSG.setTransform(1, 0, 0, 1, 0, 0); heroSG.globalCompositeOperation = 'copy'; heroSG.drawImage(heroC, 0, 0, w, h, 0, 0, w, h);
  heroSG.globalCompositeOperation = 'source-in'; heroSG.fillStyle = '#120A08'; heroSG.fillRect(0, 0, w, h);
  heroG.save(); heroG.setTransform(1, 0, 0, 1, 0, 0); heroG.globalCompositeOperation = 'destination-over'; heroG.globalAlpha = .92;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [.7, .7], [-.7, .7], [.7, -.7], [-.7, -.7]]) heroG.drawImage(heroSC, 0, 0, w, h, dx * r, dy * r, w, h);
  heroG.restore();
  inkG.save(); inkG.setTransform(1, 0, 0, 1, 0, 0); inkG.globalCompositeOperation = 'source-over'; inkG.globalAlpha = 1; inkG.drawImage(heroC, 0, 0, w, h, x0, y0, w, h); inkG.restore();
  // his mask for inkEnd: his layer, ink line and all, with even its faintest brush marks made solid
  heroSG.globalCompositeOperation = 'copy'; heroSG.drawImage(heroC, 0, 0, w, h, 0, 0, w, h);
  heroSG.globalCompositeOperation = 'lighter'; for (let i = 0; i < 2; i++) heroSG.drawImage(heroSC, 0, 0, w, h, 0, 0, w, h);
  HERO_HATCHED = true;
}
// his brushwork, on his own layer only (in world units about his feet at cx, cy)
function heroPaint(x, y) {
  if (!DETAIL_OK()) return;
  const hw = 14, hh = 52, R = 56;
  ctx.save(); ctx.globalCompositeOperation = 'source-atop';
  if (HEAD_MASK) { // his face, neck and hair keep their own smooth paint: the brushwork is clipped away from the head
    const m = ctx.getTransform(), clip = new Path2D(), hd = new Path2D(), y = HEAD_MASK.hy;
    clip.rect(-1e4, -1e4, 2e4, 2e4);
    hd.ellipse(.6, y - 3, 12.4, 13.4, 0, 0, TAU); hd.rect(-1.4, y + 4, 6.4, 8.4); // (head space: the head and hair, and the neck below)
    ctx.setTransform(1, 0, 0, 1, 0, 0); const all = new Path2D(); all.addPath(clip); all.addPath(hd, HEAD_MASK.m); ctx.clip(all, 'evenodd'); ctx.setTransform(m);
  }
  const lg = ctx.createRadialGradient(x + 8, y - 64, 0, x + 8, y - 64, 46); // light from the upper right
  lg.addColorStop(0, 'rgba(255,236,206,.13)'); lg.addColorStop(1, 'rgba(255,236,206,0)'); ctx.fillStyle = lg; ctx.fillRect(x - 50, y - 112, 100, 70);
  const dg = ctx.createLinearGradient(0, y - 30, 0, y + 2); dg.addColorStop(0, 'rgba(14,8,10,0)'); dg.addColorStop(1, 'rgba(14,8,10,.22)'); ctx.fillStyle = dg; ctx.fillRect(x - 75, y - 30, 150, 34); // the legs settle into shadow toward the street
  ctx.translate(x, y); ctx.scale(.5, .5);
  ctx.globalAlpha = .55; ctx.fillStyle = texPat(ctx, 'brush'); ctx.fillRect(-150, -210, 300, 222);
  ctx.fillStyle = texPat(ctx, 'hatch');
  for (let i = 0; i < 2; i++) { const k = 1 - i * .3; ctx.globalAlpha = .2 * (.6 + i * .3); ell((-hw * .9 - i * hw * .2) * 2, (-hh * .35 + i * hh * .08) * 2, hw * 1.7 * k * 2, hh * .85 * k * 2); ctx.fill(); }
  ctx.restore();
}
const DETAIL_OK = () => !FLASH && !TINT;
// boxes: [x0, y0, x1, y1] in world units around everything about to be painted
function inkBegin(boxes) {
  mainCtx = ctx; if (PAINT_Q === 0) return;
  if (!inkC || inkC.width !== cv.width || inkC.height !== cv.height) { retire(inkC); retire(silC); retire(rimC); rimC = null; [inkC, inkG] = texCanvas(cv.width, cv.height); [silC, silG] = texCanvas(cv.width, cv.height); }
  const m = ctx.getTransform(); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const b of boxes) { x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]); }
  const pad = 8 * K;
  IB.x = Math.max(0, Math.floor(x0 * m.a + m.e - pad)); IB.y = Math.max(0, Math.floor(y0 * m.d + m.f - pad));
  IB.w = Math.max(0, Math.min(cv.width, Math.ceil(x1 * m.a + m.e + pad)) - IB.x); IB.h = Math.max(0, Math.min(cv.height, Math.ceil(y1 * m.d + m.f + pad)) - IB.y);
  inkG.setTransform(1, 0, 0, 1, 0, 0); inkG.clearRect(0, 0, inkC.width, inkC.height); HB.on = false; HERO_HATCHED = false;
  inkG.setTransform(m);
  ctx = inkG;
}
function onMain(fn) { const c = ctx, t = c.getTransform(); if (c === heroG && heroG) { t.e += HB.x; t.f += HB.y; } // (his own layer is offset to his box)
  ctx = mainCtx; ctx.save(); ctx.setTransform(t); fn(); ctx.restore(); ctx = c; }
// brushwork and modelling on one figure: the strokes are anchored to the figure, so they travel with it.
// Light comes from the upper right; fine umber strokes build up the shadow on the lower left.
function hatchActor(x, y, hw, hh, a = .26) {
  if (HERO_HATCHED) { HERO_HATCHED = false; return; } // (the prince was painted on his own layer)
  if (FLASH || ctx !== inkG) return;
  const R = Math.max(hw, hh);
  ctx.save(); ctx.globalCompositeOperation = 'source-atop';
  const lg = ctx.createRadialGradient(x + hw * .45, y - hh * .8, 0, x + hw * .45, y - hh * .8, R * .7);
  lg.addColorStop(0, 'rgba(255,236,200,.22)'); lg.addColorStop(1, 'rgba(255,236,200,0)');
  ctx.fillStyle = lg; ctx.fillRect(x - R, y - hh - R, R * 2, hh + R * 2);
  ctx.translate(x, y); ctx.scale(.5, .5); // textures at half size so the strokes stay fine
  ctx.fillStyle = texPat(ctx, 'brush'); ctx.fillRect(-R * 3, -(hh + R) * 2, R * 6, (hh + R) * 2 + 40);
  ctx.fillStyle = texPat(ctx, 'hatch');
  for (let i = 0; i < 2; i++) {
    const k = 1 - i * .3; ctx.globalAlpha = a * (.6 + i * .3);
    ell((-hw * .9 - i * hw * .2) * 2, (-hh * .35 + i * hh * .08) * 2, hw * 1.7 * k * 2, hh * .85 * k * 2); ctx.fill();
  }
  ctx.restore();
}
function blit(g, src, dx, dy) { const { x, y, w, h } = IB; g.drawImage(src, x, y, w, h, x + dx, y + dy, w, h); }
const CONTOUR = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [a * 1.15, b * 1.15]);
function inkEnd() {
  ctx = mainCtx; if (PAINT_Q === 0) return;
  const { x, y, w, h } = IB; if (w < 2 || h < 2) return;
  silG.setTransform(1, 0, 0, 1, 0, 0); silG.globalCompositeOperation = 'copy'; blit(silG, inkC, 0, 0);
  silG.globalCompositeOperation = 'source-in'; silG.fillStyle = '#1A100C'; silG.fillRect(x, y, w, h);
  // light catching every figure's upper-right edges, and shadow gathering along the lower-left: gives each one volume
  if (!rimC || rimC.width !== inkC.width || rimC.height !== inkC.height) [rimC, rimG] = texCanvas(inkC.width, inkC.height);
  for (const [dx, dy, col, al] of [[-1.4, 1.4, '#FFF0D2', .55]]) {
    rimG.setTransform(1, 0, 0, 1, 0, 0); rimG.globalCompositeOperation = 'copy'; blit(rimG, silC, 0, 0);
    rimG.globalCompositeOperation = 'destination-out'; blit(rimG, silC, dx * K, dy * K);
    rimG.globalCompositeOperation = 'source-in'; rimG.fillStyle = col; rimG.fillRect(x, y, w, h);
    if (HB.on) { rimG.globalCompositeOperation = 'destination-out'; rimG.drawImage(heroSC, 0, 0, HB.w, HB.h, HB.x, HB.y, HB.w, HB.h); } // (none on the prince)
    inkG.save(); inkG.setTransform(1, 0, 0, 1, 0, 0); inkG.globalCompositeOperation = 'source-atop'; inkG.globalAlpha = al; blit(inkG, rimC, 0, 0); inkG.restore();
  }
  if (HB.on) { silG.globalCompositeOperation = 'destination-out'; silG.drawImage(heroSC, 0, 0, HB.w, HB.h, HB.x, HB.y, HB.w, HB.h); silG.globalCompositeOperation = 'source-over'; } // he carries his own fine line (the mask is made solid, so no fringe of his edge is left to be contoured)
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  // a firm, steady contour all the way round, the way figures were outlined before the paint went on
  ctx.globalAlpha = .95; for (const [dx, dy] of CONTOUR) blit(ctx, silC, dx * K, dy * K);
  ctx.globalAlpha = 1; blit(ctx, inkC, 0, 0);
  ctx.restore();
}

// ---------- the finished panel: brushed sky, crackled varnish and a gilded frame ----------
// The frame is dressed like a deluxe playing card: a black lacquered border engraved with fine lines, rules of
// polished gold foil pressed into it (each one embossed: a shadow below, a glint along its top), notched inner
// corners, gold scrollwork filling each corner and a small ornament at the middle of every side.
const FRAME_B = .038; // the frame's unit; the border is FRAME_B * 1.35 of the short side (ui.js keeps the HUD inside it)
function frameOrnate(g, w, h, b) {
  const W = b * 1.35, cut = b * .75; // the border's width; the radius of the notch at each inner corner
  const foil = g.createLinearGradient(0, 0, w * .6, h * 1.2); // foil catches the light in bands
  [[0, '#5E3F12'], [.08, '#E2BE66'], [.13, '#FFF2BE'], [.2, '#C08F38'], [.34, '#6A4A18'], [.5, '#D6AE58'], [.56, '#FFF0B4'], [.64, '#B0812D'], [.8, '#73521C'], [.92, '#E8C878'], [1, '#6A4A18']].forEach(([o, c]) => foil.addColorStop(o, c));
  const band = () => { g.beginPath(); g.rect(0, 0, w, h); g.rect(W, W, w - W * 2, h - W * 2); };
  // lacquer, with a soft sheen toward the light
  const lq = g.createLinearGradient(0, 0, w, h); lq.addColorStop(0, '#1C1712'); lq.addColorStop(.5, '#0B0907'); lq.addColorStop(1, '#16110C');
  band(); g.fillStyle = lq; g.fill('evenodd');
  // engraving: fine lines raking across the black, like the card's pressed linework
  g.save(); band(); g.clip('evenodd'); g.strokeStyle = 'rgba(255,226,160,.07)'; g.lineWidth = Math.max(.6, b * .03);
  g.beginPath(); for (let x = -h; x < w; x += Math.max(2.5, b * .11)) { g.moveTo(x, 0); g.lineTo(x + h, h); } g.stroke(); g.restore();
  // embossed gold: drawn three times, a shadow, the foil itself, and a thin glint
  const gild = (path, lw, fill) => {
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    g.translate(lw * .45, lw * .55); path(); if (fill) { g.fillStyle = 'rgba(0,0,0,.6)'; g.fill(); } else { g.strokeStyle = 'rgba(0,0,0,.65)'; g.lineWidth = lw; g.stroke(); }
    g.translate(-lw * .45, -lw * .55); path(); if (fill) { g.fillStyle = foil; g.fill(); } else { g.strokeStyle = foil; g.lineWidth = lw; g.stroke(); }
    g.translate(-lw * .22, -lw * .28); path(); g.strokeStyle = 'rgba(255,250,222,.55)'; g.lineWidth = Math.max(.5, lw * .28); g.stroke();
    g.restore();
  };
  const notched = (o, r) => () => { // a rectangle inset by o whose corners are bitten by quarter circles of radius r
    g.beginPath(); g.moveTo(o + r, o); g.lineTo(w - o - r, o); g.arc(w - o, o, r, Math.PI, Math.PI / 2, true);
    g.lineTo(w - o, h - o - r); g.arc(w - o, h - o, r, -Math.PI / 2, -Math.PI, true);
    g.lineTo(o + r, h - o); g.arc(o, h - o, r, 0, -Math.PI / 2, true);
    g.lineTo(o, o + r); g.arc(o, o, r, Math.PI / 2, 0, true); g.closePath();
  };
  gild(() => { g.beginPath(); g.rect(b * .16, b * .16, w - b * .32, h - b * .32); }, Math.max(1.6, b * .2)); // the outer rule, doubled
  gild(() => { g.beginPath(); g.rect(b * .4, b * .4, w - b * .8, h - b * .8); }, Math.max(.8, b * .06));
  gild(notched(b * 1.08, cut), Math.max(1.2, b * .13)); // the inner rule, notched at the corners, with a hairline inside it
  gild(notched(b * 1.26, cut * 1.15), Math.max(.6, b * .04));
  g.fillStyle = foil; // a beaded line between them
  const bead = (x, y) => { g.beginPath(); g.arc(x, y, b * .055, 0, TAU); g.fill(); }; // kept clear of the corner and middle ornaments
  for (let x = b * 4.2; x < w - b * 4.2; x += b * .32) if (Math.abs(x - w / 2) > b * 1.5) { bead(x, b * .66); bead(x, h - b * .66); }
  for (let y = b * 4.2; y < h - b * 4.2; y += b * .32) if (Math.abs(y - h / 2) > b * 1.5) { bead(b * .66, y); bead(w - b * .66, y); }
  // the picture's own edge: a dark hairline so the painting sits down inside the frame
  g.strokeStyle = 'rgba(0,0,0,.8)'; g.lineWidth = Math.max(1, b * .07); g.strokeRect(W, W, w - W * 2, h - W * 2);
  // a C-scroll: a curl that winds in on itself, the stroke thinning as it goes
  const scroll = (x, y, r, a0, turn, lw) => gild(() => {
    g.beginPath(); const n = 26;
    for (let i = 0; i <= n; i++) { const t = i / n, a = a0 + turn * t * Math.PI * 1.6, rr = r * (1 - t * .72); const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; i ? g.lineTo(px, py) : g.moveTo(px, py); }
  }, lw);
  const leaf = (x, y, len, ang, lw) => gild(() => { // a pointed acanthus leaf
    g.beginPath(); g.save(); g.translate(x, y); g.rotate(ang);
    g.moveTo(0, 0); g.quadraticCurveTo(len * .5, -len * .32, len, 0); g.quadraticCurveTo(len * .5, len * .32, 0, 0); g.restore();
  }, lw, true);
  const corner = (sx, sy) => { // each corner is one design, mirrored into place
    g.save(); g.translate(sx < 0 ? w : 0, sy < 0 ? h : 0); g.scale(sx, sy);
    const lw = Math.max(1.2, b * .12), c = b * 1.08;
    // a gold boss in the notch, set with a garnet
    gild(() => { g.beginPath(); g.arc(c, c, b * .62, 0, TAU); }, 0, true); gild(() => { g.beginPath(); g.arc(c, c, b * .62, 0, TAU); }, lw * .6);
    const gr = g.createRadialGradient(c - b * .12, c - b * .14, b * .02, c, c, b * .4); gr.addColorStop(0, '#E0606A'); gr.addColorStop(.5, '#7A1420'); gr.addColorStop(1, '#2A0508');
    g.fillStyle = gr; g.beginPath(); g.arc(c, c, b * .4, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,230,225,.85)'; g.beginPath(); g.arc(c - b * .13, c - b * .15, b * .08, 0, TAU); g.fill();
    // scrolls running out along both sides of the corner, and leaves springing between them
    for (const flip of [0, 1]) {
      g.save(); if (flip) { g.transform(0, 1, 1, 0, 0, 0); } // the same ornament reflected across the diagonal
      scroll(c + b * 1.25, b * .66, b * .42, Math.PI, 1, lw);
      scroll(c + b * 2.15, b * .66, b * .3, 0, -1, lw * .85);
      leaf(c + b * .5, b * .66, b * .9, -.08, lw * .6);
      gild(() => { g.beginPath(); g.moveTo(c + b * .45, b * .66); g.quadraticCurveTo(c + b * 1.7, b * .2, c + b * 2.7, b * .66); }, lw * .7);
      g.restore();
    }
    leaf(c + b * .2, c + b * .2, b * 1.1, Math.PI / 4, lw * .6); // pointing in, toward the picture
    g.restore();
  };
  corner(1, 1); corner(-1, 1); corner(1, -1); corner(-1, -1);
  const midOrn = (x, y, rot) => { // a small lozenge with a curl to either side, set into the middle of each side
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(1.35, 1.35); const lw = Math.max(1, b * .09);
    gild(() => { g.beginPath(); g.moveTo(0, -b * .42); g.lineTo(b * .3, 0); g.lineTo(0, b * .42); g.lineTo(-b * .3, 0); g.closePath(); }, lw, true);
    g.fillStyle = '#5A0E12'; g.beginPath(); g.moveTo(0, -b * .2); g.lineTo(b * .14, 0); g.lineTo(0, b * .2); g.lineTo(-b * .14, 0); g.closePath(); g.fill();
    for (const d of [-1, 1]) { g.save(); g.scale(d, 1); scroll(b * .9, 0, b * .3, Math.PI, 1, lw * .85); leaf(b * .35, 0, b * .9, 0, lw * .5); g.restore(); }
    g.restore();
  };
  midOrn(w / 2, b * .66, 0); midOrn(w / 2, h - b * .66, 0); midOrn(b * .66, h / 2, Math.PI / 2); midOrn(w - b * .66, h / 2, Math.PI / 2);
}
let frameC = null, frameKey = '';
function buildFrame() {
  const key = cv.width + 'x' + cv.height; if (key === frameKey) return; frameKey = key;
  const w = cv.width, h = cv.height, m = Math.min(w, h);
  // one translucent sheet laid over the picture: a warm varnish tone, its cracks, edges darkened by age, and the frame
  retire(frameC); const [c, g] = texCanvas(w, h);
  g.fillStyle = 'rgba(150,100,40,.1)'; g.fillRect(0, 0, w, h);
  g.save(); const cs = Math.max(.6, K / 4.5); g.scale(cs, cs); g.fillStyle = texPat(g, 'crack'); g.fillRect(0, 0, w / cs, h / cs); g.restore();
  const vg = g.createRadialGradient(w / 2, h * .5, m * .5, w / 2, h * .5, w * .62);
  vg.addColorStop(0, 'rgba(90,60,30,0)'); vg.addColorStop(1, 'rgba(90,55,25,.4)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
  // (no border round the play area any more: the whole picture is the stage)
  frameC = c;
}
function skyWash(camX) { // the sky is laid in with long, nearly level strokes that drift slowly with the view
  ctx.save(); const s = .9, ox = -((camX * .03) % (512 * s));
  ctx.beginPath(); ctx.rect(0, Y_OFF, VW, FLOOR_TOP - Y_OFF); ctx.clip();
  ctx.translate(ox, Y_OFF); ctx.scale(s, s); ctx.fillStyle = texPat(ctx, 'sky'); ctx.fillRect(0, 0, (VW + 512) / s, (FLOOR_TOP - Y_OFF) / s);
  ctx.restore();
}
function paperFrame() {
  buildFrame();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(frameC, 0, 0);
  ctx.restore();
}

// ---------- card portraits (weapon cards in the forge, trump cards) get the same treatment ----------
function paintCard(canvas, px) {
  const w = canvas.width, h = canvas.height, g = canvas.getContext('2d');
  const [sc, s] = texCanvas(w, h);
  s.drawImage(canvas, 0, 0); s.globalCompositeOperation = 'source-in'; s.fillStyle = '#1A100C'; s.fillRect(0, 0, w, h);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'source-atop'; g.save(); g.scale(px / 2, px / 2); g.fillStyle = texPat(g, 'brush'); g.fillRect(0, 0, w * 2 / px, h * 2 / px); g.restore();
  g.globalCompositeOperation = 'multiply'; g.fillStyle = texPat(g, 'varnish'); g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'destination-in'; g.drawImage(sc, 0, 0);
  g.globalCompositeOperation = 'destination-over'; g.globalAlpha = .95;
  for (const [dx, dy] of CONTOUR) g.drawImage(sc, dx * px, dy * px);
  g.restore();
}

// the menus share the panel: hand the textures to the page's CSS
try {
  const T = paintTextures(), st = document.documentElement.style;
  st.setProperty('--paper', `url(${T.varnish.toDataURL()})`); st.setProperty('--wash', `url(${T.crack.toDataURL()})`);
  document.documentElement.classList.add('paper');
} catch (e) {}
