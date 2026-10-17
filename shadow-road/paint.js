'use strict';
// ---------- the hand-painted look: paper, watercolor pigment, pencil hatching and boiling ink ----------
// Every fighter, creature, boss and weapon is painted into one layer, which is then inked, hatched and
// pressed onto paper like an illustrated trump card. Backgrounds get the same washes when they are built.

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

let TEX = null;
function paintTextures() {
  if (TEX) return TEX;
  const S = 256;
  // cold-press paper: soft mottling plus a fine tooth, slightly cream; used with multiply
  const [pc, pg] = texCanvas(S, S), pd = pg.createImageData(S, S);
  const n1 = tileNoise(11, 8), n2 = tileNoise(12, 32), n3 = tileNoise(13, 128);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = x / S, v = y / S;
    const tooth = n3(u * 128, v * 128), mot = n1(u * 8, v * 8) * .55 + n2(u * 32, v * 32) * .45;
    const d = mot * 11 + Math.pow(tooth, 3) * 22, i = (y * S + x) * 4;
    pd.data[i] = 255 - d * .8; pd.data[i + 1] = 252 - d; pd.data[i + 2] = 242 - d * 1.15; pd.data[i + 3] = 255;
  }
  pg.putImageData(pd, 0, 0);
  const pr = mulberry(14); pg.lineCap = 'round'; // paper fibres
  for (let i = 0; i < 70; i++) {
    const x = pr() * S, y = pr() * S, a = pr() * TAU, l = 4 + pr() * 10;
    pg.strokeStyle = pr() < .5 ? 'rgba(255,255,255,.5)' : 'rgba(150,130,110,.18)'; pg.lineWidth = .6;
    pg.beginPath(); pg.moveTo(x, y); pg.quadraticCurveTo(x + Math.cos(a + 1) * l * .5, y + Math.sin(a + 1) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); pg.stroke();
  }
  // pigment granulation: pigment settling into the paper's tooth, in blotchy patches
  const [gc, gg] = texCanvas(S, S), gd = gg.createImageData(S, S);
  const m1 = tileNoise(21, 6), m2 = tileNoise(22, 64), m3 = tileNoise(23, 256);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = x / S, v = y / S, patch = m1(u * 6, v * 6), sp = m3(u * 256, v * 256) * .6 + m2(u * 64, v * 64) * .4;
    const a = clamp((sp - .52) * 2.2, 0, 1) * (.35 + patch * .9) + clamp(patch - .55, 0, 1) * .5, i = (y * S + x) * 4;
    gd.data[i] = 60; gd.data[i + 1] = 34; gd.data[i + 2] = 46; gd.data[i + 3] = Math.round(clamp(a, 0, 1) * 150);
  }
  gg.putImageData(gd, 0, 0);
  // pencil hatching: loose diagonal strokes of varying weight, some broken
  const [hc, hg] = texCanvas(64, 64), hr = mulberry(31); hg.lineCap = 'round';
  for (let k = -64; k < 128; k += 5) {
    hg.strokeStyle = `rgba(38,22,34,${.35 + hr() * .5})`; hg.lineWidth = .7 + hr() * .8;
    const brk = hr() < .35 ? 20 + hr() * 30 : 99;
    hg.beginPath(); hg.moveTo(k, 64); hg.lineTo(k + Math.min(64, brk), 64 - Math.min(64, brk)); hg.stroke();
    for (const o of [-64, 64]) { hg.beginPath(); hg.moveTo(k + o, 64); hg.lineTo(k + o + Math.min(64, brk), 64 - Math.min(64, brk)); hg.stroke(); }
  }
  // watercolor blooms: pale washes whose pigment dries darker at the rim
  const [wc, wg] = texCanvas(512, 256), wr = mulberry(41);
  for (let i = 0; i < 46; i++) {
    const x = wr() * 512, y = wr() * 256, r = 18 + wr() * 60;
    for (const ox of [-512, 0, 512]) for (const oy of [-256, 0, 256]) {
      const cx = x + ox, cy = y + oy; if (cx < -r || cx > 512 + r || cy < -r || cy > 256 + r) continue;
      const g = wg.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, 'rgba(120,80,90,.05)'); g.addColorStop(.78, 'rgba(120,80,90,.1)'); g.addColorStop(.93, 'rgba(90,50,70,.32)'); g.addColorStop(1, 'rgba(90,50,70,0)');
      wg.fillStyle = g; wg.beginPath();
      for (let a = 0; a <= TAU + .01; a += TAU / 18) { const rr = r * (.86 + .14 * Math.sin(a * 3 + i) + .05 * Math.sin(a * 7 + i * 2)); wg.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
      wg.fill();
    }
  }
  const [gc2, gg2] = texCanvas(512, 256); // blooms and granulation baked into one opaque sheet, laid on with multiply
  gg2.fillStyle = '#FFFFFF'; gg2.fillRect(0, 0, 512, 256); gg2.drawImage(wc, 0, 0);
  gg2.globalAlpha = .55; gg2.drawImage(gc, 0, 0); gg2.drawImage(gc, 256, 0);
  TEX = { paper: pc, gran: gc, hatch: hc, wash: wc, pig: gc2 };
  return TEX;
}
function texPat(g, name) { // patterns belong to a context, so cache one per context
  const T = paintTextures(); g.__pat = g.__pat || {};
  return g.__pat[name] || (g.__pat[name] = g.createPattern(T[name], 'repeat'));
}

// ---------- painting a pre-rendered background layer ----------
// ink: contour color and strength, gran: how much pigment settles in the tooth, bleed: soft edge darkening
function paintLayer(canvas, o) {
  const w = canvas.width, h = canvas.height, g = canvas.getContext('2d');
  { const [tc, tg] = texCanvas(w, h), [cc, cg] = texCanvas(w, h); cg.drawImage(canvas, 0, 0); wobbleInto(cc, g, tc, tg, K, o.seed || 0, .9 * K, true); } // the layer tiles, so its wobble wraps around
  const [sc, s] = texCanvas(w, h);
  s.drawImage(canvas, 0, 0); s.globalCompositeOperation = 'source-in'; s.fillStyle = o.ink; s.fillRect(0, 0, w, h);
  // pigment pools at the edge of each wash as it dries: a thin dark rim just inside every shape
  const [ec, eg] = texCanvas(w, h), [tc, tg] = texCanvas(w, h);
  for (const [dx, dy] of [[0, 2.4], [1.8, 1], [-1.8, 1], [0, -1.6]]) {
    tg.globalCompositeOperation = 'copy'; tg.drawImage(sc, 0, 0);
    tg.globalCompositeOperation = 'destination-out'; tg.drawImage(sc, dx * K, dy * K);
    eg.drawImage(tc, 0, 0);
  }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'source-atop'; g.globalAlpha = o.bleed; g.drawImage(ec, 0, 0);
  g.globalAlpha = 1;
  g.fillStyle = texPat(g, 'gran'); g.globalAlpha = o.gran; g.fillRect(0, 0, w, h);
  if (o.hatch) { g.globalAlpha = o.hatch; g.fillStyle = texPat(g, 'hatch'); g.fillRect(0, h * .55, w, h * .45); }
  g.globalAlpha = 1;
  // an ink contour drawn just outside every shape, a little broken like a dip pen
  g.globalCompositeOperation = 'destination-over'; g.globalAlpha = o.line;
  const lw = o.lw * K, r = mulberry(5);
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + .4; g.drawImage(sc, Math.cos(a) * lw * (.7 + r() * .5), Math.sin(a) * lw * (.7 + r() * .5)); }
  g.restore();
}

// ---------- the actor layer ----------
let inkC = null, inkG = null, silC = null, silG = null, rimC = null, rimG = null, mainCtx = null;
// paint quality steps down by itself if the phone can't keep up: 2 = everything, 1 = no wobble or wet edges, 0 = no ink layer
let PAINT_Q = 2, perfN = 0, perfT = 0, perfSkip = 60, perfPrev = 0, perfLock = false;
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
const IB = { x: 0, y: 0, w: 0, h: 0 }; // the screen box the figures occupy; all the ink work stays inside it
// boxes: [x0, y0, x1, y1] in world units around everything about to be painted
function inkBegin(boxes) {
  mainCtx = ctx; if (PAINT_Q === 0) return;
  if (!inkC || inkC.width !== cv.width || inkC.height !== cv.height) {
    [inkC, inkG] = texCanvas(cv.width, cv.height); [silC, silG] = texCanvas(cv.width, cv.height); [rimC, rimG] = texCanvas(cv.width, cv.height);
  }
  const m = ctx.getTransform(); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const b of boxes) { x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]); }
  const pad = 8 * K;
  IB.x = Math.max(0, Math.floor(x0 * m.a + m.e - pad)); IB.y = Math.max(0, Math.floor(y0 * m.d + m.f - pad));
  IB.w = Math.max(0, Math.min(cv.width, Math.ceil(x1 * m.a + m.e + pad)) - IB.x); IB.h = Math.max(0, Math.min(cv.height, Math.ceil(y1 * m.d + m.f + pad)) - IB.y);
  inkG.setTransform(1, 0, 0, 1, 0, 0); inkG.clearRect(0, 0, inkC.width, inkC.height);
  inkG.setTransform(m);
  mainCtx = ctx; ctx = inkG;
}
function onMain(fn) { const c = ctx; ctx = mainCtx; ctx.save(); ctx.setTransform(c.getTransform()); fn(); ctx.restore(); ctx = c; }
// pencil hatching across the shadowed side of a figure, and a wet highlight where the light hits
// (the light comes from the upper right). Layers of hatching build up toward the darkest part.
function hatchActor(x, y, hw, hh, a = .42) {
  if (FLASH || ctx !== inkG) return;
  const b = Math.floor(performance.now() / 125) % 3, R = Math.max(hw, hh);
  ctx.save(); ctx.globalCompositeOperation = 'source-atop';
  const lg = ctx.createRadialGradient(x + hw * .45, y - hh * .78, 0, x + hw * .45, y - hh * .78, R * .75);
  lg.addColorStop(0, 'rgba(255,244,222,.26)'); lg.addColorStop(1, 'rgba(255,244,222,0)');
  ctx.fillStyle = lg; ctx.fillRect(x - R, y - hh - R, R * 2, hh + R * 2);
  ctx.translate(x + b * 1.3, y); ctx.fillStyle = texPat(ctx, 'hatch');
  ctx.scale(.5, .5); // the texture is drawn at half size so its strokes stay fine
  for (let i = 0; i < 3; i++) {
    const k = 1 - i * .28; ctx.globalAlpha = a * (.45 + i * .2);
    ell((-hw * .9 - i * hw * .2) * 2, (-hh * .35 + i * hh * .08) * 2, hw * 1.7 * k * 2, hh * .85 * k * 2); ctx.fill();
  }
  ctx.rotate(Math.PI / 2); ctx.globalAlpha = a * .7; // cross-hatching in the deepest shadow
  ell((-hh * .12) * 2, (hw * 1.2) * 2, hh * .32 * 2, hw * .7 * 2); ctx.fill();
  ctx.restore();
}
// no hand draws a ruled line: shift thin bands of the layer back and forth so every edge wavers a little
const WOB = tileNoise(91, 64);
function wobbleInto(src, dst, tmp, tg, px, o, amp, wrap) { // src -> tmp (rows shift sideways) -> dst (columns shift up and down)
  const w = src.width, h = src.height, band = Math.max(2, Math.round(2 * px));
  tg.save(); tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, w, h); // ('copy' would wipe everything outside each band)
  for (let y = 0; y < h; y += band) { const d = (WOB(y / px * .05, o) - .5) * 2 * amp; tg.drawImage(src, 0, y, w, band, d, y, w, band); if (wrap) tg.drawImage(src, 0, y, w, band, d - Math.sign(d) * w, y, w, band); }
  tg.restore();
  dst.save(); dst.setTransform(1, 0, 0, 1, 0, 0); dst.globalCompositeOperation = 'source-over'; dst.clearRect(0, 0, w, h);
  for (let x = 0; x < w; x += band) dst.drawImage(tmp, x, 0, band, h, x, (WOB(x / px * .05, o + 20) - .5) * 2 * amp, band, h);
  dst.restore();
}
function wobble(boil, px) { // the same band shifting as wobbleInto, kept inside the figures' box
  const { x, y, w, h } = IB, band = Math.max(2, Math.round(2 * px)), amp = .75 * px, o = boil % 16 * 4.3;
  silG.setTransform(1, 0, 0, 1, 0, 0); silG.globalCompositeOperation = 'source-over'; silG.clearRect(x, y, w, h);
  for (let yy = y; yy < y + h; yy += band) { const bh = Math.min(band, y + h - yy); silG.drawImage(inkC, x, yy, w, bh, x + (WOB(yy / px * .05, o) - .5) * 2 * amp, yy, w, bh); }
  inkG.save(); inkG.setTransform(1, 0, 0, 1, 0, 0); inkG.clearRect(x, y, w, h);
  for (let xx = x; xx < x + w; xx += band) { const bw = Math.min(band, x + w - xx); inkG.drawImage(silC, xx, y, bw, h, xx, y + (WOB(xx / px * .05, o + 20) - .5) * 2 * amp, bw, h); }
  inkG.restore();
}
function blit(g, src, dx, dy) { const { x, y, w, h } = IB; g.drawImage(src, x, y, w, h, x + dx, y + dy, w, h); }
function inkEnd(t) {
  ctx = mainCtx; if (PAINT_Q === 0) return;
  const full = PAINT_Q >= 2;
  const { x, y, w, h } = IB; if (w < 2 || h < 2) return;
  const boil = Math.floor(t * 8), r = mulberry(boil * 7 + 3), px = K; // px: one world unit in screen pixels
  if (full) wobble(boil, px);
  silG.globalCompositeOperation = 'copy'; blit(silG, inkC, 0, 0);
  silG.globalCompositeOperation = 'source-in'; silG.fillStyle = '#1E1219'; silG.fillRect(x, y, w, h);
  inkG.save(); inkG.setTransform(1, 0, 0, 1, 0, 0);
  // pigment settles into the paper and the wash dries unevenly in blooms, re-laid with every drawing
  inkG.globalCompositeOperation = 'multiply';
  inkG.save(); const ws = px * .7, ox = r() * 512 * ws, oy = r() * 256 * ws; inkG.translate(-ox, -oy); inkG.scale(ws, ws); inkG.fillStyle = texPat(inkG, 'pig');
  inkG.fillRect((x + ox) / ws, (y + oy) / ws, w / ws, h / ws); inkG.restore();
  inkG.globalCompositeOperation = 'destination-in'; blit(inkG, silC, 0, 0); // multiply also tints empty paper, so trim back to the figures
  // the wash dries darker along its edges: a thin rim of pooled pigment inside each figure
  if (full) {
    rimG.globalCompositeOperation = 'copy'; blit(rimG, silC, 0, 0);
    rimG.globalCompositeOperation = 'destination-out'; blit(rimG, silC, 1.6 * px, -2 * px);
    inkG.globalCompositeOperation = 'source-atop'; inkG.globalAlpha = .32; blit(inkG, rimC, 0, 0);
  }
  inkG.restore();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.beginPath(); ctx.rect(x - 4 * px, y - 4 * px, w + 8 * px, h + 8 * px); ctx.clip();
  // the wash bleeds a little past the lines, the way watercolor runs on damp paper
  if (full) { ctx.globalAlpha = .22; blit(ctx, inkC, -1.6 * px, -1.2 * px); }
  // boiling ink contour: redrawn by hand eight times a second, never quite in the same place
  ctx.globalAlpha = .9;
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + r() * 1.2; const d = (1.1 + r() * .45) * px; blit(ctx, silC, Math.cos(a) * d, Math.sin(a) * d); }
  ctx.globalAlpha = .3; { const a = r() * TAU, d = 2.4 * px; blit(ctx, silC, Math.cos(a) * d, Math.sin(a) * d); } // a loose second pass of the pen
  ctx.globalAlpha = 1; blit(ctx, inkC, 0, 0);
  ctx.restore();
}

// ---------- the finished page: paper tooth, sky washes and a deckled trump-card border ----------
let borderC = null, borderKey = '';
function buildBorder() {
  const key = cv.width + 'x' + cv.height; if (key === borderKey) return; borderKey = key;
  const w = cv.width, h = cv.height, [c, g] = texCanvas(w, h), r = mulberry(77), m = Math.min(w, h);
  g.fillStyle = texPat(g, 'paper'); g.fillRect(0, 0, w, h);
  // a ragged, hand-torn edge washed in dark pigment, with the wash fading inward
  const nz = tileNoise(78, 64); // a torn edge wanders smoothly, with a little fine fraying
  const edge = (t) => m * (.012 + .02 * nz(t * 3, 0) + .006 * nz(t * 17, 9) + r() * .0025);
  g.fillStyle = 'rgba(28,16,26,.95)';
  g.beginPath(); g.rect(-10, -10, w + 20, h + 20);
  const N = 240; g.moveTo(edge(0), edge(0));
  for (let i = 1; i <= N; i++) g.lineTo(i / N * w, edge(i * .04));
  for (let i = 1; i <= N * .5; i++) g.lineTo(w - edge(i * .05 + 3), i / (N * .5) * h);
  for (let i = 1; i <= N; i++) g.lineTo(w - i / N * w, h - edge(i * .045 + 7));
  for (let i = 1; i <= N * .5; i++) g.lineTo(edge(i * .035 + 11), h - i / (N * .5) * h);
  g.fill('evenodd');
  const vg = g.createRadialGradient(w / 2, h * .55, m * .55, w / 2, h * .55, w * .62);
  vg.addColorStop(0, 'rgba(60,30,40,0)'); vg.addColorStop(1, 'rgba(60,30,40,.35)'); g.globalCompositeOperation = 'source-atop'; g.fillStyle = vg; g.fillRect(0, 0, w, h);
  borderC = c;
}
function skyWash(camX) { // blooms of pigment drifting slowly across the sky
  const T = paintTextures();
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .8;
  const s = 1.4, ox = -((camX * .03) % (512 * s));
  for (let x = ox; x < VW; x += 512 * s) ctx.drawImage(T.wash, x, Y_OFF - 20, 512 * s, 256 * s);
  ctx.restore();
}
function paperFrame() {
  buildBorder();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(borderC, 0, 0);
  ctx.restore();
}

// ---------- card portraits (weapon cards in the forge, trump cards) get the same treatment ----------
function paintCard(canvas, px) {
  const w = canvas.width, h = canvas.height, g = canvas.getContext('2d');
  const [sc, s] = texCanvas(w, h), [ec, eg] = texCanvas(w, h);
  s.drawImage(canvas, 0, 0); s.globalCompositeOperation = 'source-in'; s.fillStyle = '#1E1219'; s.fillRect(0, 0, w, h);
  eg.drawImage(sc, 0, 0); eg.globalCompositeOperation = 'destination-out'; eg.drawImage(sc, 1.4 * px, -1.8 * px);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'source-atop'; g.globalAlpha = .3; g.drawImage(ec, 0, 0);
  g.globalAlpha = .5; g.fillStyle = texPat(g, 'gran'); g.fillRect(0, 0, w, h);
  g.globalAlpha = 1; g.globalCompositeOperation = 'multiply'; g.fillStyle = texPat(g, 'wash'); g.fillRect(0, 0, w, h);
  g.fillStyle = texPat(g, 'paper'); g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'destination-in'; g.drawImage(sc, 0, 0);
  g.globalCompositeOperation = 'destination-over'; g.globalAlpha = .9;
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + .5; g.drawImage(sc, Math.cos(a) * px * 1.1, Math.sin(a) * px * 1.1); }
  g.restore();
}

// the menus share the game's paper: hand the textures to the page's CSS
try {
  const T = paintTextures(), st = document.documentElement.style;
  st.setProperty('--paper', `url(${T.paper.toDataURL()})`); st.setProperty('--wash', `url(${T.wash.toDataURL()})`);
  document.documentElement.classList.add('paper');
} catch (e) {}
