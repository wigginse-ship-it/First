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
  TEX = { brush, sky, hatch: hc, crack: qc, varnish: vc };
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
// boxes: [x0, y0, x1, y1] in world units around everything about to be painted
function inkBegin(boxes) {
  mainCtx = ctx; if (PAINT_Q === 0) return;
  if (!inkC || inkC.width !== cv.width || inkC.height !== cv.height) { retire(inkC); retire(silC); retire(rimC); rimC = null; [inkC, inkG] = texCanvas(cv.width, cv.height); [silC, silG] = texCanvas(cv.width, cv.height); }
  const m = ctx.getTransform(); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const b of boxes) { x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]); }
  const pad = 8 * K;
  IB.x = Math.max(0, Math.floor(x0 * m.a + m.e - pad)); IB.y = Math.max(0, Math.floor(y0 * m.d + m.f - pad));
  IB.w = Math.max(0, Math.min(cv.width, Math.ceil(x1 * m.a + m.e + pad)) - IB.x); IB.h = Math.max(0, Math.min(cv.height, Math.ceil(y1 * m.d + m.f + pad)) - IB.y);
  inkG.setTransform(1, 0, 0, 1, 0, 0); inkG.clearRect(0, 0, inkC.width, inkC.height);
  inkG.setTransform(m);
  ctx = inkG;
}
function onMain(fn) { const c = ctx; ctx = mainCtx; ctx.save(); ctx.setTransform(c.getTransform()); fn(); ctx.restore(); ctx = c; }
// brushwork and modelling on one figure: the strokes are anchored to the figure, so they travel with it.
// Light comes from the upper right; fine umber strokes build up the shadow on the lower left.
function hatchActor(x, y, hw, hh, a = .26) {
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
    inkG.save(); inkG.setTransform(1, 0, 0, 1, 0, 0); inkG.globalCompositeOperation = 'source-atop'; inkG.globalAlpha = al; blit(inkG, rimC, 0, 0); inkG.restore();
  }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  // a firm, steady contour all the way round, the way figures were outlined before the paint went on
  ctx.globalAlpha = .95; for (const [dx, dy] of CONTOUR) blit(ctx, silC, dx * K, dy * K);
  ctx.globalAlpha = 1; blit(ctx, inkC, 0, 0);
  ctx.restore();
}

// ---------- the finished panel: brushed sky, crackled varnish and a gilded frame ----------
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
  // gilded frame: a dark outer edge, a band of gold leaf with punched dots, and a thin vermilion fillet inside
  const b = Math.round(m * .028), gold = g.createLinearGradient(0, 0, w, h);
  gold.addColorStop(0, '#7A5A22'); gold.addColorStop(.25, '#D8B460'); gold.addColorStop(.5, '#9C7A34'); gold.addColorStop(.75, '#E6C878'); gold.addColorStop(1, '#7A5A22');
  const ring = (o, i) => { g.beginPath(); g.rect(o, o, w - o * 2, h - o * 2); g.rect(i, i, w - i * 2, h - i * 2); };
  ring(0, b * 1.25); g.fillStyle = '#24160C'; g.fill('evenodd');
  ring(b * .35, b * 1.25); g.fillStyle = gold; g.fill('evenodd');
  g.save(); ring(b * .35, b * 1.25); g.clip('evenodd'); g.globalAlpha = .55; g.fillStyle = texPat(g, 'brush'); g.fillRect(0, 0, w, h); g.restore();
  g.fillStyle = 'rgba(70,45,15,.75)'; // punchwork along the gold
  const dot = (x, y) => { g.beginPath(); g.arc(x, y, b * .09, 0, TAU); g.fill(); };
  for (let x = b; x < w - b; x += b * .55) { dot(x, b * .8); dot(x, h - b * .8); }
  for (let y = b * 1.35; y < h - b; y += b * .55) { dot(b * .8, y); dot(w - b * .8, y); }
  g.strokeStyle = '#A8321E'; g.lineWidth = Math.max(1, b * .12); g.strokeRect(b * 1.3, b * 1.3, w - b * 2.6, h - b * 2.6);
  g.strokeStyle = '#24160C'; g.lineWidth = Math.max(1, b * .08); g.strokeRect(b * 1.22, b * 1.22, w - b * 2.44, h - b * 2.44);
  for (const [x, y] of [[b * .8, b * .8], [w - b * .8, b * .8], [b * .8, h - b * .8], [w - b * .8, h - b * .8]]) { // a lozenge at each corner
    g.fillStyle = '#A8321E'; g.beginPath(); g.moveTo(x, y - b * .55); g.lineTo(x + b * .55, y); g.lineTo(x, y + b * .55); g.lineTo(x - b * .55, y); g.closePath(); g.fill();
    g.fillStyle = '#E6C878'; g.beginPath(); g.arc(x, y, b * .16, 0, TAU); g.fill();
  }
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
