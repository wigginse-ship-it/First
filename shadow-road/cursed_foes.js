'use strict';
// ======================================================================================================
// CURSED FOES: the curse drawn into a regular foe's own body (New Game+, see corruption.js)
// ------------------------------------------------------------------------------------------------------
// A cursed foe is drawn as ever, and the curse grows out of its own drawing, not pasted over it. Its silhouette is read
// once per kind of foe (a small private drawing, read back: where its body is, its top edge, its head, its middle, its
// back), and everything is laid out from that: what sticks out of it (thorns, shards, horns, a limb) is drawn just
// before the body so the body covers the root, and what lies on its skin (bark, plates, eyes, cracks, char) is painted in
// a shared working canvas cut to the shape of its body as it is drawn this frame (its own art once more, in white), so it
// keeps to the limbs as they move. The Circle drains a little of its colour there too.
//   EVERY CURSED FOE   black veins rising out of the ground over its body, the Red pulsing up them.
//   PLAIN / MIMIC      the Circle burned into its chest, veins running out of the brand.
//   SPLIT              a black seam down its middle, the Red in it, opening wider the more it is hurt.
//   LOOT               black shards grown into it, a few standing out of its back, glinting.
//   MIMIC              its shadow is his: Corwin's stance on the floor under it; it stands up as it gives his blow back.
//   CARRIER            the knot of ink on its back has rooted into it: black roots running down into the body.
//   MARKED BY A LORD   (elites: 'mask') the lord whose blow it borrows has grown into it, each in its own way:
//     Mossback   black bark and dead moss creeping up its limbs, briar canes out of its back
//     Colossus   rust-black brass plates bolted into it, a gear in its back, a furnace grate in its chest
//     Wyrm       obsidian shards jutting from its shoulders and spine, glassy black patches at their roots
//     Ty'iga     eyes opened all over it, an extra jointed limb arching over it out of its back
//     Benedict   ink-black lamellar plates, sword-cuts that drip ink, a black blade still in its back
//     Sleeper    its face turned to cracked porcelain with the void showing through, more patches on its body
//     King       cracked glass grown into it, each patch reflecting the Black Circle; glass spikes at its shoulders
//     Goat-Lord  black horns out of its head; its body burning black from the hem up, embers at the edge
//   As it winds up the borrowed blow (the last second of its count) every growth flares: that is the telegraph.
// In the lighter paint (LITE, PAINT_LITE, the crowd) there is no working canvas: the skin is cut to the body's shape as
// it was read, and the growths are drawn plain.
// ======================================================================================================
(() => {
  const now = () => performance.now() / 1000;
  const cl01 = (k) => k < 0 ? 0 : k > 1 ? 1 : k, sm = (k) => { k = cl01(k); return k * k * (3 - 2 * k); };
  const lite = () => !!LITE || (typeof PAINT_LITE !== 'undefined' && (PAINT_LITE || PAINT_Q === 0));
  const PI = Math.PI, angD = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
  const hstr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h | 0; };
  const LORDS = ['mossback', 'colossus', 'wyrm', 'tyiga', 'benedict', 'sleeper', 'w7king', 'w8goat'];
  const keyOf = (e) => e.cTrait === 'mask' && LORDS.includes(e.cMask) ? e.cMask : ['split', 'loot', 'mimic', 'carrier'].includes(e.cTrait) ? e.cTrait : 'none';
  const STAT = { cal: 0, full: 0, atop: 0, cheap: 0 }, ASH = 'rgba(112,106,118,.26)';

  // ---------------- its body, read once per kind of foe ----------------
  const CAL = new Map(), CW = 176, CH = 192, GP = 4;
  let calCv = null, calG = null;
  function paintInto(g, tint, fn) { // (draw into another canvas, every colour TINT (or its own, tint null), no flash)
    const oc = ctx, mc = typeof mainCtx !== 'undefined' ? mainCtx : null, tt = TINT, fl = FLASH; ctx = g; if (mc) mainCtx = g; TINT = tint; FLASH = false;
    try { fn(); } finally { ctx = oc; if (mc) mainCtx = mc; TINT = tt; FLASH = fl; }
  }
  function calOf(e, o, a, arm) {
    const key = e.type + (arm ? '+' : ''); let c = CAL.get(key); if (c) return c;
    const S = clamp(130 / Math.max(24, e.hh * 1.35, e.hw * 3.2), .4, 3), OX = CW / 2, OY = CH - 24, gw = CW / GP, gh = CH / GP, grid = new Uint8Array(gw * gh);
    let ok = false; STAT.cal++;
    try {
      if (!calCv) { calCv = document.createElement('canvas'); calCv.width = CW; calCv.height = CH; calG = calCv.getContext('2d', { willReadFrequently: true }) || calCv.getContext('2d'); }
      const g = calG; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, CW, CH); g.setTransform(S, 0, 0, S, OX, OY);
      const a2 = { walk: 0, t: a.t, wind: 0, atk: false, hurt: false, pose: a.pose };
      paintInto(g, '#FFFFFF', () => { o(e, a2); if (arm) ARMOR[e.type].draw(e, a2); });
      const d = g.getImageData(0, 0, CW, CH).data; let n = 0;
      for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) { let k = 0; for (const [ox, oy] of [[1, 1], [3, 1], [1, 3], [3, 3]]) if (d[((gy * GP + oy) * CW + gx * GP + ox) * 4 + 3] > 110) k++; if (k >= 2) { grid[gy * gw + gx] = 1; n++; } }
      ok = n >= 10;
    } catch (err) { ok = false; } // (a drawing that can't be read: its box serves)
    if (!ok) { grid.fill(0); for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) { const lx = (gx * GP + 2 - OX) / S, ly = (gy * GP + 2 - OY) / S; if (Math.abs(lx) < e.hw && ly < 0 && ly > -e.hh) grid[gy * gw + gx] = 1; } }
    c = derive({ S, gs: GP / S, gx0: -OX / S, gy0: -OY / S, gw, gh, grid, lay: {} });
    CAL.set(key, c); return c;
  }
  const inB = (c, x, y) => { const gx = Math.floor((x - c.gx0) / c.gs), gy = Math.floor((y - c.gy0) / c.gs); return gx >= 0 && gy >= 0 && gx < c.gw && gy < c.gh && !!c.grid[gy * c.gw + gx]; };
  function derive(c) {
    const { gw, gh, grid, gs } = c, at = (gx, gy) => gx >= 0 && gy >= 0 && gx < gw && gy < gh && !!grid[gy * gw + gx], lx = (gx) => c.gx0 + (gx + .5) * gs, ly = (gy) => c.gy0 + (gy + .5) * gs;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; const inner = [];
    for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) if (at(gx, gy)) { x0 = Math.min(x0, lx(gx) - gs / 2); x1 = Math.max(x1, lx(gx) + gs / 2); y0 = Math.min(y0, ly(gy) - gs / 2); y1 = Math.max(y1, ly(gy) + gs / 2);
      if (at(gx - 1, gy) && at(gx + 1, gy) && at(gx, gy - 1) && at(gx, gy + 1)) inner.push(lx(gx), ly(gy)); }
    if (x0 > x1) { x0 = -10; x1 = 10; y0 = -40; y1 = 0; }
    Object.assign(c, { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, inner });
    c.u = clamp(Math.sqrt(c.w * c.h) / 50, .45, 2.4);
    // its top edge, where the body is thick enough (not the point of a spear), with the outward lean there
    const topT = []; for (let gx = 0; gx < gw; gx++) { let ty = null; for (let gy = 0; gy < gh - 2; gy++) if (at(gx, gy) && at(gx, gy + 1) && at(gx, gy + 2)) { ty = ly(gy) - gs * .5; break; } topT.push(ty); }
    const topAt = (gx) => { for (let d = 0; d < 4; d++) { if (topT[gx + d] != null) return topT[gx + d]; if (topT[gx - d] != null) return topT[gx - d]; } return y0; };
    c.tops = []; const step = Math.max(1, Math.round(c.w / 16 / gs));
    for (let gx = 1; gx < gw - 1; gx += step) if (topT[gx] != null) c.tops.push({ x: lx(gx), y: topT[gx], n: Math.atan2(-1, (topAt(gx + 2) - topAt(gx - 2)) / (gs * 4)) });
    // its head: high and to the front
    let hb = null, hs = -1e9; for (const p of c.tops) { const s = (y1 - p.y) / c.h + .45 * (p.x - c.cx) / c.w; if (s > hs) { hs = s; hb = p; } }
    const hr = clamp(c.h * .1, 2.5, 13); hb = hb || { x: c.cx, y: y0 };
    c.head = { x: hb.x, y: hb.y + hr * .95, r: hr };
    c.back = c.tops.filter(p => p.x < c.head.x - hr * .7).sort((p, q) => q.x - p.x);
    // its middle, for the brand
    { let sx = 0, sy = 0, n = 0; for (let i = 0; i < inner.length; i += 2) { const y = inner[i + 1]; if (y > y0 + c.h * .28 && y < y0 + c.h * .58) { sx += inner[i]; sy += y; n++; } }
      c.chest = n ? { x: sx / n + c.w * .06, y: sy / n } : { x: c.cx, y: c.cy }; if (!inB(c, c.chest.x, c.chest.y)) c.chest = { x: sx / Math.max(1, n), y: n ? sy / n : c.cy }; }
    // a line down its middle (top to bottom when it stands, back to front when it is long)
    const seam = [], tall = c.h >= c.w * .85;
    if (tall) { let px = c.head.x; for (let gy = 0; gy < gh; gy++) { const y = ly(gy); if (y < y0 + c.h * .1 || y > y1 - c.h * .2) continue; let best = null;
        for (let gx = 0; gx < gw; gx++) if (at(gx, gy) && !at(gx - 1, gy)) { let e2 = gx; while (at(e2 + 1, gy)) e2++; const m = (lx(gx) + lx(e2)) / 2; if (best == null || Math.abs(m - px) < Math.abs(best - px)) best = m; }
        if (best != null) { px = best; seam.push(best, y); } } }
    else { let py = c.cy; for (let gx = 0; gx < gw; gx++) { const x = lx(gx); if (x < x0 + c.w * .12 || x > x1 - c.w * .12) continue; let best = null;
        for (let gy = 0; gy < gh; gy++) if (at(gx, gy) && !at(gx, gy - 1)) { let e2 = gy; while (at(gx, e2 + 1)) e2++; const m = ly(gy) + (ly(e2) - ly(gy)) * .45; if (best == null || Math.abs(m - py) < Math.abs(best - py)) best = m; }
        if (best != null) { py = best; seam.push(x, best); } } }
    for (let k = 0; k < 2; k++) for (let i = 2; i < seam.length - 2; i += 2) { seam[i] = (seam[i - 2] + seam[i] * 2 + seam[i + 2]) / 4; seam[i + 1] = (seam[i - 1] + seam[i + 1] * 2 + seam[i + 3]) / 4; }
    c.seam = seam.length >= 6 ? seam : [c.cx, y0 + c.h * .15, c.cx, c.cy, c.cx, y1 - c.h * .2];
    // its shape as it was read, as a path (the lighter paint cuts its skin to this)
    const B = new Path2D(), BD = new Path2D(); for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) if (at(gx, gy) && !at(gx - 1, gy)) { let e2 = gx; while (at(e2 + 1, gy)) e2++; B.rect(lx(gx) - gs * .5, ly(gy) - gs * .55, (e2 - gx + 1) * gs, gs * 1.1); BD.rect(lx(gx) - gs * 1.8, ly(gy) - gs * 1.8, (e2 - gx + 3.6) * gs, gs * 3.6); }
    c.body = B; c.bodyD = BD; return c; // (bodyD: its shape grown a little, for the limbs as they move)
  }
  const inPick = (r, c, f) => { const I = c.inner; if (!I.length) return [c.cx, c.cy]; for (let i = 0; i < 40; i++) { const k = (r() * I.length / 2 | 0) * 2; if (!f || f(I[k], I[k + 1])) return [I[k], I[k + 1]]; } const k = (r() * I.length / 2 | 0) * 2; return [I[k], I[k + 1]]; };
  const spread = (r, c, n, f, minD) => { const out = []; for (let i = 0; i < n * 20 && out.length < n; i++) { const p = inPick(r, c, f); if (out.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < minD)) continue; out.push(p); } return out; };
  // veins: walks from their sources over the body, branching; they end where the body ends
  function walks(r, c, srcs, o) {
    const P0 = new Path2D(), P1 = new Path2D(), seg = Math.max(1.1, c.gs * .9);
    const go = (x, y, an, len, d) => { const Pt = d ? P1 : P0; Pt.moveTo(x, y); let l = 0, miss = o.free || 0;
      while (l < len) { an += (r() - .5) * (o.wig || .8); if (o.up) an += angD(an, -PI / 2) * o.up; if (o.down) an += angD(an, PI / 2) * o.down;
        x += Math.cos(an) * seg; y += Math.sin(an) * seg; l += seg;
        if (!inB(c, x, y)) { if (miss-- <= 0) break; } Pt.lineTo(x, y);
        if (d < 1 && r() < (o.br ?? .14)) go(x, y, an + (r() < .5 ? -.9 : .9), (len - l) * .55, d + 1); } };
    for (const s of srcs) go(s[0], s[1], s[2], s[3], 0); return [P0, P1];
  }
  function layout(c, k, e) { // (made once for each kind of foe and each look)
    let L = c.lay[k]; if (L) return L; const r = mulberry(hstr(e.type + ':' + k)), u = c.u;
    L = c.lay[k] = { r };
    if (!LORDS.includes(k)) { // the veins out of the ground, and the brand's
      const srcs = []; for (let i = 0; i < 6; i++) { const [x, y] = inPick(r, c, (x, y) => y > c.y1 - c.h * .22); srcs.push([x, y, -PI / 2 + (r() - .5) * .8, c.h * (.35 + r() * .3)]); }
      L.v = walks(r, c, srcs, { up: .1, wig: .9 });
      if (k === 'none' || k === 'mimic') { const b = c.chest, s2 = []; for (let i = 0; i < 6; i++) s2.push([b.x, b.y, i / 6 * PI * 2 + r() * .5, c.h * (.14 + r() * .14)]); L.bv = walks(r, c, s2, { wig: .7, br: .2 }); }
    }
    (GEN[k] || (() => {}))(L, r, c, u, e);
    return L;
  }

  // ---------------- shapes ----------------
  function shard(x, y, an, len, w, col, facet, rim) { // a long faceted splinter from (x, y) out along an
    const cx = Math.cos(an), sy = Math.sin(an), nx = -sy * w, ny = cx * w, tx = x + cx * len, ty = y + sy * len, mx = x + cx * len * .45, my = y + sy * len * .45;
    ctx.beginPath(); ctx.moveTo(x + nx, y + ny); ctx.lineTo(mx + nx * .9, my + ny * .9); ctx.lineTo(tx, ty); ctx.lineTo(mx - nx * .75, my - ny * .75); ctx.lineTo(x - nx, y - ny); ctx.closePath(); ctx.fillStyle = C(col); ctx.fill();
    if (FLASH || TINT) return;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(mx + nx * .9, my + ny * .9); ctx.lineTo(tx, ty); ctx.closePath(); ctx.fillStyle = facet; ctx.fill();
    if (rim) { ctx.strokeStyle = rim; ctx.lineWidth = Math.max(.4, w * .18); ctx.beginPath(); ctx.moveTo(mx + nx * .9, my + ny * .9); ctx.lineTo(tx, ty); ctx.stroke(); }
  }
  function cane(x, y, an, len, curl, w0, col, thorn, tip) { // a tapered arching briar, thorns hooked back along it
    const n = 7, P = []; let a = an, px = x, py = y; for (let i = 0; i <= n; i++) { P.push([px, py, a]); px += Math.cos(a) * len / n; py += Math.sin(a) * len / n; a += curl * .3; }
    ctx.beginPath(); for (let i = 0; i <= n; i++) { const q = P[i], w = w0 * (1 - i / n * .88); ctx.lineTo(q[0] - Math.sin(q[2]) * w, q[1] + Math.cos(q[2]) * w); }
    for (let i = n; i >= 0; i--) { const q = P[i], w = w0 * (1 - i / n * .88); ctx.lineTo(q[0] + Math.sin(q[2]) * w, q[1] - Math.cos(q[2]) * w); }
    ctx.closePath(); ctx.fillStyle = C(col); ctx.fill();
    ctx.beginPath(); for (let i = 1; i < n; i++) { const q = P[i], sd = i % 2 ? 1 : -1, w = w0 * (1 - i / n * .88), s = (1.2 + w * 1.1), na = q[2] + sd * PI / 2, bx = q[0] + Math.cos(na) * w * .8, by = q[1] + Math.sin(na) * w * .8, ta = q[2] + sd * 2.3;
      ctx.moveTo(bx + Math.cos(q[2]) * s * .7, by + Math.sin(q[2]) * s * .7); ctx.lineTo(bx + Math.cos(ta) * s * 1.7, by + Math.sin(ta) * s * 1.7); ctx.lineTo(bx - Math.cos(q[2]) * s * .5, by - Math.sin(q[2]) * s * .5); ctx.closePath(); }
    ctx.fill(); if (thorn && !FLASH && !TINT) { ctx.strokeStyle = thorn; ctx.lineWidth = .6; ctx.stroke(); }
    if (tip && !FLASH && !TINT) { const q = P[n]; ctx.fillStyle = tip; circle(q[0], q[1], w0 * .75); ctx.fill(); }
    return P[n];
  }
  function gearPath(x, y, R, n, rot) { ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a0 = rot + i / (n * 2) * PI * 2, rr = i % 2 ? R * .78 : R; ctx.lineTo(x + Math.cos(a0 - .12) * rr, y + Math.sin(a0 - .12) * rr); ctx.lineTo(x + Math.cos(a0 + .12) * rr, y + Math.sin(a0 + .12) * rr); } ctx.closePath(); }
  function poly(pts) { ctx.beginPath(); for (let i = 0; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); }
  function blob(r, x, y, R, n) { const p = []; for (let i = 0; i < n; i++) { const a = i / n * PI * 2 + (r() - .5) * .5, rr = R * (.7 + r() * .45); p.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr * .9); } return p; }
  const glow = (x, y, R, rgb, a) => { if (a <= .01) return; const g = ctx.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - R, y - R, R * 2, R * 2); };
  function crack(q, w, rgb, a, t) { const CA = window.CURSE_ART; if (CA && CA.crack) CA.crack(q, w, { burn: 0, T: t }, { rgb, a, edge: 'rgba(225,215,225,.35)' }); }
  function walkPts(r, x, y, an, len, seg, wig) { const q = [x, y]; for (let l = 0; l < len; l += seg) { an += (r() - .5) * wig; x += Math.cos(an) * seg; y += Math.sin(an) * seg; q.push(x, y); } return q; }

  // ---------------- each look: GEN lays it out once; under (before the body), skin (on it, cut to its shape), over ----------------
  const GEN = {}, LOOK = {};
  const veinsSkin = (s) => { const L = s.L, u = s.u; if (!L.v) return; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(14,8,14,.82)'; ctx.lineWidth = 1.5 * u; ctx.stroke(L.v[0]); ctx.lineWidth = .8 * u; ctx.stroke(L.v[1]);
    if (L.bv) { ctx.lineWidth = 1.2 * u; ctx.stroke(L.bv[0]); ctx.lineWidth = .65 * u; ctx.stroke(L.bv[1]); }
    if (!s.lite) { ctx.strokeStyle = 'rgba(205,36,46,.75)'; ctx.lineWidth = .6 * u; ctx.setLineDash([3 * u, 13 * u]); ctx.lineDashOffset = s.t * 14 * u; ctx.stroke(L.v[0]); if (L.bv) { ctx.lineDashOffset = -s.t * 10 * u; ctx.stroke(L.bv[0]); } ctx.setLineDash([]); ctx.lineDashOffset = 0; } };
  const brand = (s) => { const b = s.c.chest, u = s.u, p = .5 + .5 * Math.sin(s.t * 4 + s.e.cid * 9);
    ctx.strokeStyle = 'rgba(10,6,10,.92)'; ctx.lineWidth = 1.4 * u; circle(b.x, b.y, 2.9 * u); ctx.stroke();
    ctx.strokeStyle = 'rgba(120,20,28,.7)'; ctx.lineWidth = .5 * u; circle(b.x, b.y, 2.3 * u); ctx.stroke();
    if (!s.lite) glow(b.x, b.y, 3.6 * u, '230,50,50', .35 + .25 * p);
    ctx.fillStyle = `rgb(${190 + 60 * p | 0},40,46)`; circle(b.x, b.y, 1.05 * u); ctx.fill(); };
  // PLAIN, MIMIC: the brand and its veins
  LOOK.none = LOOK.mimic = { skin(s) { veinsSkin(s); brand(s); } };
  // SPLIT: a seam down its middle, wider as it is hurt
  LOOK.split = { skin(s) { veinsSkin(s); const c = s.c, u = s.u, hk = s.hurt, q = c.seam;
    crack(q, (1 + 3.6 * hk) * u, '235,46,44', .55 + .35 * hk, s.t);
    if (!s.lite) { const L = s.L; ctx.strokeStyle = 'rgba(8,4,8,.85)'; ctx.lineWidth = .6 * u; ctx.stroke(L.tears); } } };
  GEN.split = (L, r, c, u) => { const q = c.seam, P = new Path2D(); for (let i = 2; i < q.length - 2; i += 4) { const dx = q[i + 2] - q[i - 2], dy = q[i + 3] - q[i - 1], l = Math.hypot(dx, dy) || 1;
    for (const sd of [-1, 1]) if (r() < .7) { let x = q[i], y = q[i + 1], an = Math.atan2(dx * sd, -dy * sd) + (r() - .5) * .8; P.moveTo(x, y); for (let j = 0; j < 3; j++) { an += (r() - .5) * .9; x += Math.cos(an) * 2.2 * u; y += Math.sin(an) * 2.2 * u; P.lineTo(x, y); } } } L.tears = P; };
  // LOOT: black shards grown into it
  GEN.loot = (L, r, c, u) => {
    L.out = c.back.concat(c.tops).filter((p, i, A) => A.indexOf(p) === i).filter((p, i) => i % 2 === 0).slice(0, 3).map(p => ({ x: p.x, y: p.y + 1.5 * u, a: p.n - .3 + (r() - .5) * .4, l: (6 + r() * 5) * u, w: (1.5 + r() * .8) * u, ph: r() * 3 }));
    L.ins = spread(r, c, 3, (x, y) => y < c.y1 - c.h * .2, 7 * u).map(([x, y]) => ({ x, y, a: -PI / 2 + (r() - .5) * 2.4, l: (3.5 + r() * 2.5) * u, w: (1.1 + r() * .5) * u, ph: r() * 3 }));
  };
  const SH = ['#0E0912', 'rgba(70,50,90,.9)', 'rgba(210,190,240,.75)'];
  const glint = (s, x, y, ph) => { if (s.lite || FLASH || TINT) return; const g = 1 - Math.abs(((s.t * .55 + ph) % 2.2) - .25) / .2; if (g <= 0) return; const u = s.u;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,240,255,${g})`; const R = 3.2 * u * g; ctx.beginPath(); ctx.moveTo(x, y - R); ctx.lineTo(x + R * .2, y - R * .2); ctx.lineTo(x + R, y); ctx.lineTo(x + R * .2, y + R * .2); ctx.lineTo(x, y + R); ctx.lineTo(x - R * .2, y + R * .2); ctx.lineTo(x - R, y); ctx.lineTo(x - R * .2, y - R * .2); ctx.closePath(); ctx.fill(); ctx.restore(); };
  LOOK.loot = {
    under(s) { for (const q of s.L.out) shard(q.x, q.y, q.a, q.l, q.w, SH[0], SH[1], SH[2]); },
    skin(s) { veinsSkin(s); for (const q of s.L.ins) { ctx.fillStyle = 'rgba(10,6,12,.5)'; ell(q.x, q.y, q.w * 1.6, q.w * 1.2); ctx.fill(); shard(q.x - Math.cos(q.a) * q.l * .3, q.y - Math.sin(q.a) * q.l * .3, q.a, q.l, q.w, SH[0], SH[1], SH[2]); } },
    over(s) { for (const q of s.L.out) glint(s, q.x + Math.cos(q.a) * q.l * .8, q.y + Math.sin(q.a) * q.l * .8, q.ph); for (const q of s.L.ins) glint(s, q.x + Math.cos(q.a) * q.l * .5, q.y + Math.sin(q.a) * q.l * .5, q.ph + 1.1); },
  };
  // CARRIER: the knot on its back has rooted into it
  GEN.carrier = (L, r, c, u, e) => { const B = e.cBase || e, ax = -B.hw * .62, ay = -B.hh * .96 + 2 * u, s = [];
    for (let i = 0; i < 5; i++) s.push([ax, ay, PI / 2 + (r() - .5) * 1.6, c.h * (.3 + r() * .25)]); L.roots = walks(r, c, s, { down: .08, wig: .7, free: 4, br: .25 }); L.ax = ax; L.ay = ay; };
  LOOK.carrier = { skin(s) { veinsSkin(s); const L = s.L, u = s.u; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(10,7,12,.9)'; ctx.lineWidth = 1.2 * u; ctx.stroke(L.roots[1]); },
    over(s) { const L = s.L, u = s.u; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = C('#0A070C'); ctx.lineWidth = 2.6 * u; ctx.stroke(L.roots[0]);
      ctx.fillStyle = C('#0A070C'); ell(L.ax, L.ay + 1.5 * u, 4.4 * u, 3 * u); ctx.fill();
      if (!s.lite && !FLASH && !TINT) { ctx.strokeStyle = 'rgba(150,140,152,.45)'; ctx.lineWidth = .5 * u; ctx.stroke(L.roots[0]); ctx.strokeStyle = 'rgba(205,36,46,.8)'; ctx.lineWidth = .8 * u; ctx.setLineDash([2 * u, 10 * u]); ctx.lineDashOffset = -s.t * 16 * u; ctx.stroke(L.roots[0]); ctx.setLineDash([]); ctx.lineDashOffset = 0; } } };

  // ---- the lords ----
  // Mossback: black bark and dead moss creeping up it, briar out of its back
  GEN.mossback = (L, r, c, u) => {
    L.ph = r() * 9; const G = new Path2D(), K = new Path2D(), Mo = new Path2D(), band = (x) => c.y1 - c.h * (.44 + .06 * Math.sin(x * .35 / u + L.ph) + .035 * Math.sin(x * .9 / u + L.ph * 2));
    for (let x = c.x0; x < c.x1; x += 2.4 * u) { let y = c.y1 + 2, xx = x; G.moveTo(xx, y); const top = band(x) + 2 * u; while (y > top) { y -= 2 * u; xx += (r() - .5) * 1.2 * u; G.lineTo(xx, y); } }
    for (let i = 0; i < 5; i++) { const [x, y] = inPick(r, c, (x, y) => y > band(x) + 3 * u); const q = walkPts(r, x, y, -PI / 2 + (r() - .5), (5 + r() * 6) * u, 1.6 * u, 1.2); K.moveTo(q[0], q[1]); for (let j = 2; j < q.length; j += 2) K.lineTo(q[j], q[j + 1]); }
    const dot = (x, y, R) => { Mo.moveTo(x + R, y); Mo.arc(x, y, R, 0, PI * 2); };
    for (let x = c.x0; x < c.x1; x += 1.6 * u) if (r() < .7) dot(x + (r() - .5) * u, band(x) + (r() - .3) * 2.5 * u, (.5 + r() * 1.1) * u);
    for (const p of c.tops) if (r() < .6) for (let j = 0; j < 3; j++) dot(p.x + (r() - .5) * 3 * u, p.y + (.5 + r() * 2) * u, (.5 + r() * 1) * u);
    L.band = band; L.grain = G; L.cracks = K; L.moss = Mo;
    const bk = c.back.length ? c.back : c.tops; L.canes = [0, 1, 2].map(i => bk[Math.min(bk.length - 1, Math.round(i * (bk.length - 1) / 2.4))]).filter(Boolean).map((p, i) => ({ x: p.x, y: p.y + 2 * u, a: -PI / 2 - .35 - i * .32 + (r() - .5) * .2, l: c.h * (.32 + .1 * (i % 2)) , cu: i % 2 ? .5 : -.4, w: (1.5 + .3 * (2 - i)) * u, ph: r() * 6 }));
  };
  LOOK.mossback = { pig: 'rgba(40,46,22,.16)',
    under(s) { const F = s.F, u = s.u; for (const q of s.L.canes) cane(q.x, q.y, q.a + Math.sin(s.t * 1.3 + q.ph) * .04 - .12 * F, q.l * (1 + .18 * F), q.cu, q.w, '#0E0A08', F > .05 ? `rgba(230,60,50,${F})` : null, F > .05 ? `rgba(${200 + 55 * F | 0},40,40,${.5 + .5 * F})` : null); },
    skin(s) { const L = s.L, c = s.c, u = s.u, F = s.F, k = .06 * F; ctx.beginPath(); ctx.moveTo(c.x0 - 2, c.y1 + 4); for (let x = c.x0 - 2; x <= c.x1 + 2; x += 2 * u) ctx.lineTo(x, L.band(x) - c.h * k); ctx.lineTo(c.x1 + 2, c.y1 + 4); ctx.closePath();
      ctx.fillStyle = '#1D1610'; ctx.fill(); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(70,56,40,.8)'; ctx.lineWidth = .55 * u; ctx.stroke(L.grain);
      ctx.strokeStyle = '#070403'; ctx.lineWidth = 1 * u; ctx.stroke(L.cracks); if (F > .05 && !s.lite) { ctx.strokeStyle = `rgba(255,90,40,${F * .9})`; ctx.lineWidth = .45 * u; ctx.stroke(L.cracks); }
      ctx.fillStyle = '#4C5038'; ctx.fill(L.moss); if (!s.lite) { ctx.save(); ctx.translate(-.3 * u, -.4 * u); ctx.fillStyle = 'rgba(126,132,98,.7)'; ctx.fill(L.moss); ctx.restore(); } } };
  // Colossus: brass plates bolted into it, a gear in its back, a furnace in its chest
  GEN.colossus = (L, r, c, u) => {
    L.plates = spread(r, c, 4, (x, y) => y < c.y1 - c.h * .12 && Math.hypot(x - c.chest.x, y - c.chest.y) > 6 * u, 6 * u).map(([x, y]) => { const w = (3 + r() * 2.2) * u, h = (2.4 + r() * 1.8) * u, a = (r() - .5) * .6, ca = Math.cos(a), sa = Math.sin(a), P = [];
      for (const [px, py] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const qx = px * w * (.8 + r() * .3), qy = py * h * (.8 + r() * .3); P.push(x + qx * ca - qy * sa, y + qx * sa + qy * ca); }
      return { x, y, P, rv: [[P[0] * .8 + P[4] * .2, P[1] * .8 + P[5] * .2], [P[2] * .8 + P[6] * .2, P[3] * .8 + P[7] * .2], [P[4] * .8 + P[0] * .2, P[5] * .8 + P[1] * .2]] }; });
    const R = new Path2D(); for (const p of L.plates) for (let i = 0; i < 4; i++) { const x = p.x + (r() - .5) * 9 * u, y = p.y + (r() * .9 + .2) * 4 * u; if (!inB(c, x, y)) continue; R.moveTo(x + u, y); R.ellipse(x, y, (.5 + r() * 1.1) * u, (.8 + r() * 1.8) * u, 0, 0, PI * 2); } L.rust = R;
    const bk = c.back.length ? c.back : c.tops; const g = bk[Math.min(bk.length - 1, 1)] || { x: c.x0 + c.w * .3, y: c.y0 }; L.gear = { x: g.x, y: g.y + 2.5 * u, R: clamp(c.h * .12, 3.5 * u, 9 * u) };
    L.fur = { x: c.chest.x, y: c.chest.y, w: clamp(c.w * .09, 2 * u, 3.4 * u) }; };
  LOOK.colossus = { pig: 'rgba(70,40,20,.16)',
    under(s) { const g = s.L.gear, u = s.u, rot = s.t * (.6 + 2.4 * s.F); gearPath(g.x, g.y, g.R, 9, rot); ctx.fillStyle = C('#2A1C10'); ctx.fill(); if (FLASH || TINT) return; ctx.strokeStyle = '#7A5A2C'; ctx.lineWidth = .6 * u; ctx.stroke();
      ctx.fillStyle = '#120A06'; circle(g.x, g.y, g.R * .38); ctx.fill(); ctx.fillStyle = '#9A7438'; circle(g.x, g.y, g.R * .14); ctx.fill(); },
    skin(s) { const L = s.L, u = s.u, F = s.F;
      ctx.fillStyle = 'rgba(92,40,16,.5)'; ctx.fill(L.rust);
      for (const p of L.plates) { poly(p.P); ctx.fillStyle = '#2A1F16'; ctx.fill(); ctx.strokeStyle = '#0E0804'; ctx.lineWidth = .8 * u; ctx.stroke();
        ctx.strokeStyle = 'rgba(160,120,64,.6)'; ctx.lineWidth = .45 * u; ctx.beginPath(); ctx.moveTo(p.P[0], p.P[1] + .5 * u); ctx.lineTo(p.P[2], p.P[3] + .5 * u); ctx.stroke();
        ctx.fillStyle = 'rgba(120,52,20,.55)'; ell((p.P[4] + p.P[6]) / 2, (p.P[5] + p.P[7]) / 2 - .6 * u, u * 1.6, u * .8); ctx.fill();
        ctx.fillStyle = '#B08850'; for (const [x, y] of p.rv) { circle(x, y, .42 * u); ctx.fill(); } }
      // the furnace: a grate let into its chest, the fire behind it
      const f = L.fur, w = f.w, h = w * .78, p = .5 + .5 * Math.sin(s.t * 7), k = Math.max(F, .12 + .1 * p);
      ctx.fillStyle = '#140C06'; ctx.beginPath(); ctx.ellipse(f.x, f.y, w * 1.35, h * 1.35, 0, 0, PI * 2); ctx.fill();
      if (!s.lite) glow(f.x, f.y, w * 1.7, `255,${110 + 100 * F | 0},40`, .3 + .7 * F);
      ctx.fillStyle = `rgb(${110 + 145 * k | 0},${36 + 130 * F | 0},${8 + 40 * F | 0})`; ctx.beginPath(); ctx.ellipse(f.x, f.y, w, h, 0, 0, PI * 2); ctx.fill();
      ctx.strokeStyle = '#140C06'; ctx.lineWidth = .9 * u; ctx.beginPath(); for (let i = -1; i <= 1; i++) { ctx.moveTo(f.x - w, f.y + i * h * .5); ctx.lineTo(f.x + w, f.y + i * h * .5); } ctx.stroke();
      ctx.strokeStyle = 'rgba(176,136,72,.7)'; ctx.lineWidth = .45 * u; ctx.beginPath(); ctx.ellipse(f.x, f.y, w * 1.35, h * 1.35, 0, PI * 1.1, PI * 1.9); ctx.stroke(); },
    over(s) { if (s.lite || s.F < .05) return; const f = s.L.fur; ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(f.x, f.y, 10 * s.u * (1 + s.F), '255,120,40', .5 * s.F); ctx.restore();
      if (Math.random() < .3 * s.F) spark(s, f.x, f.y, ['#FFD27A', '#FF8A3A', '#FFF0C0'], 'star'); } };
  // Wyrm: obsidian shards out of its shoulders and spine
  GEN.wyrm = (L, r, c, u) => { const src = c.back.concat(c.tops.filter(p => !c.back.includes(p) && Math.abs(p.x - c.head.x) > c.head.r * .8)); const pick = [];
    for (const p of src) if (!pick.some(q => Math.abs(q.x - p.x) < 4.5 * u) && pick.length < 5) pick.push(p);
    L.sh = pick.map((p, i) => ({ x: p.x, y: p.y + 2 * u, a: p.n - .25 + (r() - .5) * .45, l: (7 + r() * 7) * u * (i < 2 ? 1.15 : .9), w: (1.6 + r() * 1.2) * u }));
    L.pat = L.sh.slice(0, 3).map(q => blob(r, q.x + (r() - .5) * 2 * u, q.y + 3 * u, (2.6 + r() * 1.6) * u, 6));
    const K = new Path2D(); for (const q of L.sh) { for (let j = 0; j < 2; j++) { const w = walkPts(r, q.x, q.y + 2 * u, PI / 2 + (r() - .5) * 1.4, (4 + r() * 5) * u, 1.5 * u, .9); K.moveTo(w[0], w[1]); for (let i = 2; i < w.length; i += 2) K.lineTo(w[i], w[i + 1]); } } L.k = K; };
  LOOK.wyrm = { pig: 'rgba(30,22,52,.16)',
    under(s) { const F = s.F, rim = `rgba(${160 + 80 * F | 0},${220 - 90 * F | 0},${230},.8)`; for (const q of s.L.sh) shard(q.x, q.y, q.a, q.l * (1 + .25 * F), q.w, '#0C0914', 'rgba(52,44,80,.95)', rim); },
    skin(s) { const L = s.L, u = s.u; for (const p of L.pat) { poly(p); ctx.fillStyle = '#100C18'; ctx.fill(); ctx.strokeStyle = 'rgba(130,190,210,.45)'; ctx.lineWidth = .4 * u; ctx.stroke(); }
      ctx.strokeStyle = '#0A0710'; ctx.lineWidth = .8 * u; ctx.stroke(L.k); if (s.F > .05 && !s.lite) { ctx.strokeStyle = `rgba(220,110,255,${s.F})`; ctx.lineWidth = .4 * u; ctx.stroke(L.k); } },
    over(s) { if (s.lite || s.F < .05) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; for (const q of s.L.sh) { const l = q.l * (1 + .25 * s.F), ca = Math.cos(q.a), sa = Math.sin(q.a); glow(q.x + ca * l * .6, q.y + sa * l * .6, l * .55, '200,90,255', .4 * s.F);
      ctx.strokeStyle = `rgba(240,170,255,${s.F})`; ctx.lineWidth = q.w * .4; ctx.beginPath(); ctx.moveTo(q.x + ca * l * .15, q.y + sa * l * .15); ctx.lineTo(q.x + ca * l * .85, q.y + sa * l * .85); ctx.stroke(); } ctx.restore(); } };
  // Ty'iga: eyes opened all over it, an extra jointed limb out of its back
  GEN.tyiga = (L, r, c, u) => { L.eyes = spread(r, c, c.h > 50 ? 4 : 3, (x, y) => Math.hypot(x - c.head.x, y - c.head.y) > c.head.r * 1.4, 6 * u).map(([x, y], i) => ({ x, y, r: (1.9 + r() * 1.2) * u, rot: (r() - .5) * .6, seed: i + 1 + r() }));
    const bk = c.back.length ? c.back : c.tops, b = bk[Math.min(bk.length - 1, Math.floor(bk.length * .35))] || { x: c.x0 + c.w * .3, y: c.y0 }; L.limb = { x: b.x, y: b.y + 3 * u, l1: c.h * .3, l2: c.h * .3, l3: c.h * .13, w: clamp(2.3 * u, 1.6, 5) }; };
  const seg = (x, y, an, len, w0, w1, col) => { const ex = x + Math.cos(an) * len, ey = y + Math.sin(an) * len, nx = -Math.sin(an), ny = Math.cos(an);
    ctx.beginPath(); ctx.moveTo(x + nx * w0, y + ny * w0); ctx.quadraticCurveTo((x + ex) / 2 + nx * w0 * 1.5, (y + ey) / 2 + ny * w0 * 1.5, ex + nx * w1, ey + ny * w1); ctx.lineTo(ex - nx * w1, ey - ny * w1); ctx.lineTo(x - nx * w0, y - ny * w0); ctx.closePath(); ctx.fillStyle = C(col); ctx.fill(); return [ex, ey]; };
  LOOK.tyiga = { pig: 'rgba(60,20,70,.14)',
    under(s) { const q = s.L.limb, F = s.F, tw = Math.sin(s.t * 2.2 + s.e.cid * 7) * .06, w = q.w;
      const a1 = -2.05 - .3 * F + tw, [kx, ky] = seg(q.x, q.y, a1, q.l1, w * 1.3, w, '#2A1430'), a2 = a1 + 2.1 - .55 * F, [jx, jy] = seg(kx, ky, a2, q.l2, w, w * .7, '#2A1430');
      ctx.fillStyle = C('#3C1E44'); circle(kx, ky, w * 1.2); ctx.fill(); circle(jx, jy, w * .9); ctx.fill();
      const a3 = a2 + .9, sp = .25 + .55 * F; seg(jx, jy, a3 - sp, q.l3, w * .7, .2, '#D0C0CC'); seg(jx, jy, a3 + sp, q.l3 * .8, w * .6, .2, '#D0C0CC');
      if (!FLASH && !TINT) { ctx.strokeStyle = 'rgba(160,100,170,.7)'; ctx.lineWidth = w * .3; ctx.beginPath(); ctx.moveTo(q.x - Math.sin(a1) * w * .5, q.y + Math.cos(a1) * w * .5); ctx.lineTo(kx - Math.sin(a1) * w * .4, ky + Math.cos(a1) * w * .4); ctx.stroke();
        ctx.fillStyle = 'rgba(12,4,14,.9)'; for (const [x, y, rr] of [[kx, ky, w * .5], [jx, jy, w * .4]]) { circle(x, y, rr); ctx.fill(); } ctx.fillStyle = `rgba(230,60,60,${.6 + .4 * F})`; circle(kx, ky, w * .25); ctx.fill(); } },
    skin(s) { const CA = window.CURSE_ART, look = CA ? CA.toward(s.e) : 1; for (const q of s.L.eyes) { if (!s.lite) glow(q.x, q.y, q.r * 2.2, '40,8,50', .55);
        if (CA && CA.eye && !s.lite) CA.eye(q.x, q.y, q.r, .45 + .55 * s.F, { t: s.t, seed: q.seed, look, rot: q.rot, lid: '#4A2050', white: '#E8D8C4' });
        else { ctx.fillStyle = '#4A2050'; ell(q.x, q.y, q.r * 1.2, q.r * .7); ctx.fill(); ctx.fillStyle = '#E8D8C4'; ell(q.x, q.y, q.r * .9, q.r * .45); ctx.fill(); ctx.fillStyle = '#B01820'; circle(q.x + look * q.r * .2, q.y, q.r * .35); ctx.fill(); } } } };
  // Benedict: ink-black lamellar plates, sword-cuts dripping ink, a black blade left in its back
  GEN.benedict = (L, r, c, u) => { const pl = [];
    for (const p of c.tops) { if (p.x > c.head.x - c.head.r * .6 && p.x < c.head.x + c.head.r * 1.2 && c.h > c.w) continue; for (let j = 0; j < 3; j++) { const y = p.y + (1.6 + j * 2.6) * u, x = p.x + (j % 2) * 1.6 * u; if (inB(c, x, y)) pl.push(x, y, p.n + PI / 2); } } L.pl = pl;
    L.cuts = spread(r, c, 3, (x, y) => y < c.y1 - c.h * .15, 6 * u).map(([x, y]) => ({ x, y, a: -.65 + (r() - .5) * .7, l: (7 + r() * 6) * u }));
    L.drips = []; for (const q of L.cuts) for (let j = 0; j < 2; j++) { const k = (r() - .5) * .7; L.drips.push(q.x + Math.cos(q.a) * q.l * k, q.y + Math.sin(q.a) * q.l * k + .6 * u, (2.5 + r() * 4) * u, .8 * u); }
    const bk = c.back.length ? c.back : c.tops, b = bk[Math.min(bk.length - 1, 1)] || { x: c.x0 + c.w * .3, y: c.y0 }; L.blade = { x: b.x, y: b.y + 5 * u, a: -PI / 2 - .85, l: Math.max(c.h * .26, 10 * u) }; };
  LOOK.benedict = { pig: 'rgba(18,22,38,.18)',
    under(s) { const b = s.L.blade, u = s.u, F = s.F, ca = Math.cos(b.a), sa = Math.sin(b.a), nx = -sa, ny = ca, w = 1.4 * u, gx = b.x + ca * b.l, gy = b.y + sa * b.l;
      ctx.beginPath(); ctx.moveTo(b.x + nx * w, b.y + ny * w); ctx.lineTo(gx + nx * w, gy + ny * w); ctx.lineTo(gx - nx * w, gy - ny * w); ctx.lineTo(b.x - nx * w * .4, b.y - ny * w * .4); ctx.closePath(); ctx.fillStyle = C('#0E1018'); ctx.fill();
      if (!FLASH && !TINT) { ctx.strokeStyle = `rgba(${170 + 60 * F | 0},${185 + 50 * F | 0},230,${.6 + .4 * F})`; ctx.lineWidth = .5 * u; ctx.beginPath(); ctx.moveTo(b.x + nx * w, b.y + ny * w); ctx.lineTo(gx + nx * w, gy + ny * w); ctx.stroke(); }
      ctx.strokeStyle = C('#14161E'); ctx.lineCap = 'round'; ctx.lineWidth = 1.1 * u; ctx.beginPath(); ctx.moveTo(gx + nx * 2.4 * u, gy + ny * 2.4 * u - ca * u); ctx.lineTo(gx - nx * 2.4 * u, gy - ny * 2.4 * u - ca * u); ctx.stroke();
      ctx.lineWidth = 1.1 * u; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + ca * 4 * u, gy + sa * 4 * u); ctx.stroke(); ctx.fillStyle = C('#14161E'); circle(gx + ca * 4.6 * u, gy + sa * 4.6 * u, 1 * u); ctx.fill(); },
    skin(s) { const L = s.L, u = s.u, F = s.F, P = L.pl;
      if (!L.plP) { const A = new Path2D(), Bp = new Path2D(), w = 2.1 * u, h = 3.1 * u; for (let i = 0; i < P.length; i += 3) { const m = new DOMMatrix().translateSelf(P[i], P[i + 1]).rotateSelf(P[i + 2] * .6 * 180 / PI), q = new Path2D(), r2 = new Path2D();
          q.moveTo(-w, -h * .45); q.lineTo(w, -h * .45); q.lineTo(w, h * .15); q.quadraticCurveTo(w, h * .55, 0, h * .65); q.quadraticCurveTo(-w, h * .55, -w, h * .15); q.closePath(); r2.moveTo(-w * .7, h * .25); r2.quadraticCurveTo(0, h * .5, w * .7, h * .25); A.addPath(q, m); Bp.addPath(r2, m); } L.plP = A; L.plR = Bp; }
      ctx.fillStyle = '#12151E'; ctx.fill(L.plP); ctx.strokeStyle = '#05060A'; ctx.lineWidth = .5 * u; ctx.stroke(L.plP); if (!s.lite) { ctx.strokeStyle = 'rgba(110,126,160,.6)'; ctx.lineWidth = .4 * u; ctx.stroke(L.plR); }
      for (const q of L.cuts) { const ca = Math.cos(q.a), sa = Math.sin(q.a), w = (.9 + .7 * F) * u; ctx.beginPath(); ctx.moveTo(q.x - ca * q.l / 2, q.y - sa * q.l / 2); ctx.quadraticCurveTo(q.x - sa * w, q.y + ca * w, q.x + ca * q.l / 2, q.y + sa * q.l / 2); ctx.quadraticCurveTo(q.x + sa * w, q.y - ca * w, q.x - ca * q.l / 2, q.y - sa * q.l / 2); ctx.closePath();
        ctx.fillStyle = '#05060A'; ctx.fill(); ctx.strokeStyle = `rgba(200,212,234,${.45 + .55 * F})`; ctx.lineWidth = (.4 + .5 * F) * u; ctx.stroke(); }
      const CA = window.CURSE_ART; if (CA && CA.drips) { const D = L.drips; if (F > .05) { const d2 = D.slice(); for (let i = 2; i < d2.length; i += 4) d2[i] *= 1 + F; CA.drips(d2, s.t, '#06070C'); } else CA.drips(D, s.t, '#06070C'); } },
    over(s) { if (s.lite || s.F < .05) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const q of s.L.cuts) glow(q.x, q.y, q.l * .7, '190,210,255', .4 * s.F); ctx.restore(); } };
  // Sleeper: its face turned to cracked porcelain, the void through the cracks
  GEN.sleeper = (L, r, c, u) => { const h = c.head; L.face = blob(r, h.x + h.r * .1, h.y, h.r * 1.35, 9);
    L.pat = c.tops.filter(p => Math.abs(p.x - h.x) > h.r * 1.8).filter((p, i) => i % 3 === 1).slice(0, 2).map(p => { const x = p.x, y = p.y + 2.5 * u, R = (3 + r() * 2) * u, q = []; for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2 + (r() - .5) * .7, rr = R * (.55 + r() * .7); q.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr * .8); } return { x, y, p: q }; });
    const K = new Path2D(), web = (x, y, R, n) => { for (let i = 0; i < n; i++) { const q = walkPts(r, x, y, r() * PI * 2, R * (.6 + r() * .6), Math.max(.8, R / 5), .9); K.moveTo(q[0], q[1]); for (let j = 2; j < q.length; j += 2) K.lineTo(q[j], q[j + 1]); } };
    web(h.x, h.y, h.r * 1.4, 9); for (const q of L.pat) web(q.x, q.y, 4 * u, 5); L.web = K;
    L.fis = [walkPts(r, h.x - h.r * 1.2, h.y - h.r * .5, .55, h.r * 2.4, h.r * .3, .6), walkPts(r, h.x + h.r * .2, h.y - h.r * 1.2, 1.7, h.r * 1.8, h.r * .3, .6)]; };
  LOOK.sleeper = { pig: 'rgba(70,64,62,.12)',
    skin(s) { const L = s.L, u = s.u, h = s.c.head, F = s.F;
      for (const p of [L.face].concat(L.pat.map(q => q.p))) { poly(p); ctx.fillStyle = '#E6DED0'; ctx.fill(); ctx.strokeStyle = 'rgba(90,80,72,.6)'; ctx.lineWidth = .45 * u; ctx.stroke(); }
      if (!s.lite) { ctx.fillStyle = 'rgba(150,140,128,.35)'; ell(h.x + h.r * .1, h.y + h.r * .55, h.r * 1.2, h.r * .6); ctx.fill(); }
      ctx.strokeStyle = 'rgba(70,60,56,.85)'; ctx.lineWidth = .35 * u; ctx.stroke(L.web);
      ctx.strokeStyle = '#3A322E'; ctx.lineWidth = .5 * u; ctx.beginPath(); for (const sx of [.55, -.2]) { const x = h.x + h.r * sx, y = h.y - h.r * .05; ctx.moveTo(x - h.r * .3, y); ctx.quadraticCurveTo(x, y + h.r * .22, x + h.r * .3, y); } ctx.stroke();
      for (const q of L.fis) crack(q, (.7 + 1.4 * F) * u, '150,120,240', .5 + .5 * F, s.t); },
    over(s) { if (s.lite || s.F < .05) return; const h = s.c.head; ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(h.x, h.y, h.r * 2.4, '140,110,255', .3 * s.F); ctx.restore();
      if (Math.random() < .2 * s.F) spark(s, h.x, h.y, ['#EDE5D6', '#C8C0B4'], 'blob'); } };
  // the King in the Glass: cracked glass grown into it, each patch with the Black Circle in it
  GEN.w7king = (L, r, c, u) => { L.gl = spread(r, c, 3, (x, y) => y < c.y1 - c.h * .15, 9 * u).map(([x, y]) => { const R = (4 + r() * 2.6) * u, a0 = r() * PI, p = [];
      for (let i = 0; i < 5; i++) { const a = a0 + i / 5 * PI * 2 + (r() - .5) * .5, rr = R * (i % 2 ? .55 + r() * .3 : 1 + r() * .35); p.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      const K = []; for (let i = 0; i < 4; i++) { const a = r() * PI * 2, q = walkPts(r, x + Math.cos(a) * R * .7, y + Math.sin(a) * R * .7, a, R * (.6 + r() * .9), R * .35, .5); K.push(q); }
      return { x, y, R, p, K, ph: r() * 6, sk: (r() - .5) * .8 }; });
    const tp = c.tops.filter(p => Math.abs(p.x - c.head.x) > c.head.r * .9 && Math.abs(p.x - c.head.x) < c.w * .4); L.sp = tp.filter((p, i) => i % 2 === 0).slice(0, 3).map(p => ({ x: p.x, y: p.y + 1.5 * u, a: p.n + (r() - .5) * .3, l: (4 + r() * 3.5) * u, w: 1.2 * u })); };
  LOOK.w7king = { pig: 'rgba(40,70,82,.12)',
    under(s) { for (const q of s.L.sp) shard(q.x, q.y, q.a, q.l * (1 + .2 * s.F), q.w, 'rgba(190,232,232,.85)', 'rgba(255,255,255,.55)', 'rgba(30,70,84,.9)'); },
    skin(s) { const u = s.u, F = s.F; for (const g of s.L.gl) {
        ctx.strokeStyle = 'rgba(16,40,48,.8)'; ctx.lineWidth = .5 * u; ctx.beginPath(); for (const k of g.K) { ctx.moveTo(k[0], k[1]); for (let i = 2; i < k.length; i += 2) ctx.lineTo(k[i], k[i + 1]); } ctx.stroke();
        if (!s.lite) { ctx.strokeStyle = 'rgba(220,250,250,.55)'; ctx.lineWidth = .25 * u; ctx.stroke(); }
        poly(g.p); ctx.fillStyle = 'rgba(150,206,212,.9)'; ctx.fill(); ctx.save(); poly(g.p); ctx.clip();
        ctx.fillStyle = 'rgba(30,76,90,.7)'; ctx.beginPath(); ctx.moveTo(g.x - g.R * 2, g.y + g.R * .4); ctx.lineTo(g.x + g.R * 2, g.y - g.R * .6); ctx.lineTo(g.x + g.R * 2, g.y + g.R * 2); ctx.lineTo(g.x - g.R * 2, g.y + g.R * 2); ctx.closePath(); ctx.fill();
        ctx.translate(g.x + g.R * .35, g.y + g.R * .2); ctx.rotate(g.sk); ctx.scale(1, .55); ctx.strokeStyle = '#060406'; ctx.lineWidth = g.R * .3; circle(0, 0, g.R * .75); ctx.stroke();
        ctx.strokeStyle = `rgba(${200 + 55 * Math.sin(s.t * 4 + g.ph) | 0},40,48,${.45 + .55 * F})`; ctx.lineWidth = g.R * (.06 + .1 * F); circle(0, 0, g.R * .75); ctx.stroke(); ctx.restore();
        if (!s.lite) { ctx.strokeStyle = `rgba(255,255,255,${.55 + .45 * F})`; ctx.lineWidth = .6 * u; ctx.beginPath(); ctx.moveTo(g.p[0], g.p[1]); ctx.lineTo(g.p[2], g.p[3]); ctx.stroke(); }
        poly(g.p); ctx.strokeStyle = '#0E2A32'; ctx.lineWidth = .65 * u; ctx.stroke(); } },
    over(s) { if (s.lite || s.F < .05) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const g of s.L.gl) glow(g.x, g.y, g.R * 2.2, '230,60,70', .35 * s.F); ctx.restore(); } };
  // the Goat-Lord: black horns out of its head, its body burning black from the hem
  GEN.w8goat = (L, r, c, u) => { L.ph = r() * 9; const h = c.head; L.hl = Math.max(h.r * 3.2, 12 * u); L.hw = Math.max(h.r * .5, 1.5 * u);
    L.em = []; for (let x = c.x0; x < c.x1; x += 2.2 * u) if (r() < .5) L.em.push(x, r() * 3 + 1, r() * 6);
    };
  const hornPts = (x, y, len, w, dir, curl) => { const n = 10, A = [], B = []; let an = -PI / 2 + .45 - (dir - 1) * 1.4, px = x, py = y;
    for (let i = 0; i <= n; i++) { const k = i / n, ww = w * (1 - k * .9); A.push(px - Math.sin(an) * ww, py + Math.cos(an) * ww); B.push(px + Math.sin(an) * ww, py - Math.cos(an) * ww); px += Math.cos(an) * len / n; py += Math.sin(an) * len / n; an -= curl * (.2 + .12 * k) * dir; }
    return [A, B]; };
  function horn(s, x, y, dir, len, w, col, F) { const [A, B] = hornPts(x, y, len, w, dir, 1); ctx.beginPath(); for (let i = 0; i < A.length; i += 2) ctx.lineTo(A[i], A[i + 1]); for (let i = B.length - 2; i >= 0; i -= 2) ctx.lineTo(B[i], B[i + 1]); ctx.closePath(); ctx.fillStyle = C(col); ctx.fill();
    if (FLASH || TINT) return; ctx.strokeStyle = 'rgba(60,50,54,.9)'; ctx.lineWidth = .4 * s.u; ctx.beginPath(); for (let i = 4; i < A.length - 4; i += 4) { ctx.moveTo(A[i], A[i + 1]); ctx.lineTo(B[i], B[i + 1]); } ctx.stroke();
    if (F > .05) { ctx.strokeStyle = `rgba(255,${90 + 80 * F | 0},40,${F})`; ctx.lineWidth = .6 * s.u; ctx.beginPath(); for (let i = 0; i < A.length - 6; i += 2) ctx.lineTo((A[i] + B[i]) / 2, (A[i + 1] + B[i + 1]) / 2); ctx.stroke(); } }
  LOOK.w8goat = { pig: 'rgba(30,18,18,.18)',
    under(s) { const h = s.c.head, L = s.L; horn(s, h.x - h.r * .55, h.y - h.r * .5, 1.25, L.hl * .85 * (1 + .1 * s.F), L.hw * .9, '#060405', s.F); },
    over(s) { const h = s.c.head, L = s.L; horn(s, h.x + h.r * .2, h.y - h.r * .55, 1, L.hl * (1 + .1 * s.F), L.hw, '#0E0909', s.F);
      if (!s.lite && s.F > .05) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(h.x, h.y - h.r * .6, h.r * 1.4, '255,70,30', .55 * s.F); ctx.restore(); if (Math.random() < .35 * s.F) spark(s, h.x, s.c.y1 - s.c.h * .3, ['#FF8A3A', '#FFC060', '#FF5A20'], 'star'); } },
    skin(s) { const c = s.c, u = s.u, F = s.F, t = s.t, L = s.L, edge = (x) => c.y1 - c.h * (.24 + .08 * F + .035 * Math.sin(x * .5 / u + t * 5 + L.ph) + .02 * Math.sin(x * 1.3 / u - t * 8));
      ctx.beginPath(); ctx.moveTo(c.x0 - 2, c.y1 + 4); for (let x = c.x0 - 2; x <= c.x1 + 2; x += 1.5 * u) ctx.lineTo(x, edge(x)); ctx.lineTo(c.x1 + 2, c.y1 + 4); ctx.closePath(); ctx.fillStyle = '#0A0606'; ctx.fill();
      if (!s.lite) { const y = c.y1 - c.h * (.24 + .08 * F), g = ctx.createLinearGradient(0, y - 7 * u, 0, y); g.addColorStop(0, 'rgba(20,10,10,0)'); g.addColorStop(1, 'rgba(20,10,10,.55)'); ctx.fillStyle = g; ctx.fillRect(c.x0 - 2, y - 7 * u, c.w + 4, 7 * u + 2); }
      ctx.beginPath(); for (let x = c.x0 - 2; x <= c.x1 + 2; x += 1.5 * u) ctx.lineTo(x, edge(x)); 
      ctx.beginPath(); for (let x = c.x0 - 2; x <= c.x1 + 2; x += 1.5 * u) ctx.lineTo(x, edge(x)); ctx.strokeStyle = `rgba(255,${110 + 60 * F | 0},40,${.75 + .25 * F})`; ctx.lineWidth = (1 + .8 * F) * u; ctx.stroke();
      if (!s.lite) { ctx.strokeStyle = `rgba(255,220,120,${.4 + .5 * F})`; ctx.lineWidth = .4 * u; ctx.stroke(); }
      const E = L.em; ctx.fillStyle = `rgba(255,${120 + 80 * F | 0},50,.9)`; for (let i = 0; i < E.length; i += 3) { const x = E[i], f = (t * .8 + E[i + 2]) % 1.4; if (f > 1) continue; circle(x, edge(x) + E[i + 1] * u * .8 + 2 * u - f * 4 * u, .45 * u * (1 - f * .6)); ctx.fill(); }
      if (F > .1 && !s.lite) { ctx.fillStyle = '#0A0606'; for (let i = 0; i < 5; i++) { const x = c.x0 + c.w * (i + .5) / 5, y = edge(x) + .5 * u, hh = (3 + 3 * Math.sin(t * 9 + i * 2)) * u * F, w = 1.4 * u;
          ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x - w * .6, y - hh * .6, x + Math.sin(t * 7 + i) * w, y - hh); ctx.quadraticCurveTo(x + w * .6, y - hh * .5, x + w, y); ctx.closePath(); ctx.fill(); ctx.strokeStyle = `rgba(255,130,40,${F})`; ctx.lineWidth = .4 * u; ctx.stroke(); } } } };

  // motes off it, in the world (its drawing's transform is read to place them)
  function spark(s, x, y, cols, shape) { const e = s.e, sc = e.champ ? 1.3 : 1;
    parts.push({ x: e.x + x * e.facing * sc, y: e.y, z: Math.max(2, e.z - y * sc), vx: rand(-30, 30), vy: 0, vz: rand(40, 110), life: .5, max: .5, col: pick(cols), size: rand(1.2, 2.4), shape, rot: rand(0, 6), vr: rand(-6, 6) }); }

  // ---------------- the working canvases (shared, grown when needed, never made per frame) ----------------
  const WK = { m: null, mg: null, f: null, fg: null }, WK_PX = 60000;
  function wk(k, w, h) { const c = WK[k]; if (c && c.width >= w && c.height >= h) return WK[k + 'g'];
    const n = document.createElement('canvas'); n.width = Math.max(64, Math.ceil(w * 1.2), c ? c.width : 0); n.height = Math.max(64, Math.ceil(h * 1.2), c ? c.height : 0); if (c) { c.width = 1; c.height = 1; }
    WK[k] = n; return (WK[k + 'g'] = n.getContext('2d')); }
  function skinPass(s, o, A, a) {
    const c = s.c, Lk = LOOK[s.k], ga = ctx.globalAlpha; if (ga < .03) return;
    const pig = Lk.pig || 'rgba(26,20,30,.14)', desat = LORDS.includes(s.k) ? .5 : .62;
    if (s.lite) { STAT.cheap++; ctx.save(); ctx.clip(c.body); ctx.fillStyle = pig; ctx.fillRect(c.x0, c.y0, c.w, c.h); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; try { Lk.skin(s); } finally { ctx.restore(); } return; }
    if (typeof inkG !== 'undefined' && inkG && ctx === inkG) { // (on the figures' own layer: laid on only where it is already painted, near its shape; the creature is not drawn again)
      STAT.atop++; ctx.save(); ctx.clip(c.bodyD); ctx.globalCompositeOperation = 'source-atop'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      try { ctx.fillStyle = ASH; ctx.fillRect(c.x0 - 8, c.y0 - 8, c.w + 16, c.h + 16); ctx.fillStyle = pig; ctx.fillRect(c.x0 - 8, c.y0 - 8, c.w + 16, c.h + 16); Lk.skin(s); } finally { ctx.restore(); } return; }
    STAT.full++;
    const M = ctx.getTransform(), cv = ctx.canvas, pad = Math.max(c.w, c.h) * .14; let X0 = 1e9, Y0 = 1e9, X1 = -1e9, Y1 = -1e9;
    for (const px of [c.x0 - pad, c.x1 + pad]) for (const py of [c.y0 - pad, c.y1 + pad * .5]) { const X = M.a * px + M.c * py + M.e, Y = M.b * px + M.d * py + M.f; if (X < X0) X0 = X; if (X > X1) X1 = X; if (Y < Y0) Y0 = Y; if (Y > Y1) Y1 = Y; }
    X0 = Math.max(0, Math.floor(X0)); Y0 = Math.max(0, Math.floor(Y0)); X1 = Math.min(cv.width, Math.ceil(X1)); Y1 = Math.min(cv.height, Math.ceil(Y1));
    const W = X1 - X0, H = Y1 - Y0; if (W < 4 || H < 4) return;
    const q = Math.min(1, Math.sqrt(WK_PX / (W * H))), w = Math.ceil(W * q), h = Math.ceil(H * q);
    const mg = wk('m', w, h), fg = wk('f', w, h), loc = (g) => g.setTransform(M.a * q, M.b * q, M.c * q, M.d * q, (M.e - X0) * q, (M.f - Y0) * q);
    // its own shape this frame, in white
    mg.setTransform(1, 0, 0, 1, 0, 0); mg.globalAlpha = 1; mg.globalCompositeOperation = 'source-over'; mg.clearRect(0, 0, w + 1, h + 1); loc(mg);
    paintInto(mg, '#FFFFFF', () => { o(s.e, a); if (A) A(s.e, a); });
    // what lies on its skin, then cut to that shape
    fg.setTransform(1, 0, 0, 1, 0, 0); fg.globalAlpha = 1; fg.globalCompositeOperation = 'source-over'; fg.clearRect(0, 0, w + 1, h + 1); loc(fg);
    paintInto(fg, null, () => { fg.save(); fg.lineCap = 'round'; fg.lineJoin = 'round'; fg.fillStyle = pig; fg.fillRect(c.x0 - pad, c.y0 - pad, c.w + pad * 2, c.h + pad * 2); try { Lk.skin(s); } finally { fg.restore(); } });
    fg.setTransform(1, 0, 0, 1, 0, 0); fg.globalCompositeOperation = 'destination-in'; fg.drawImage(WK.m, 0, 0, w, h, 0, 0, w, h); fg.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = ga * desat; ctx.drawImage(WK.m, 0, 0, w, h, X0, Y0, W, H);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = ga; ctx.drawImage(WK.f, 0, 0, w, h, X0, Y0, W, H); ctx.restore();
  }

  // ---------------- Corwin's shadow, for the mimic (drawn once, small) ----------------
  let CORW = null;
  function corwin() { if (CORW !== null) return CORW; CORW = false;
    try { const W = 90, H = 120, cv = document.createElement('canvas'); cv.width = W * 2; cv.height = H * 2; const g = cv.getContext('2d'); g.setTransform(2, 0, 0, 2, W * .5 * 2, (H - 4) * 2);
      paintInto(g, '#06030A', () => drawHumanoid(heroLook(), { weapon: save && save.weapon || 'sword', stance: 1, arm: -.35, lean: .1 }));
      CORW = { cv, W, H, ox: W * .5, oy: H - 4 }; } catch (err) { console.error(err); CORW = false; }
    return CORW; }
  function mimicShade(e, t) { const S = corwin(); if (!S || TINT || FLASH) return; const live = window.CURSE && CURSE.live ? CURSE.live() : null, q = live && live.mimics ? live.mimics.find(m => m.e === e && !m.done) : null;
    const up = q ? sm(q.t / .3) : 0, k = Math.max(32, e.hh * 1.02) / 70, f = () => { ctx.save(); ctx.globalAlpha *= (.5 + .3 * up) * (e.w4vis ?? 1);
      ctx.translate(e.x - e.facing * 2, e.y + 1); ctx.transform(e.facing, 0, -.7 * e.facing * (1 - up), .58 + .42 * up, 0, 0); ctx.scale(k, k);
      ctx.drawImage(S.cv, -S.ox, -S.oy, S.W, S.H); if (up > .2) { ctx.fillStyle = `rgba(230,40,48,${up})`; circle(5, -62, 1.4); ctx.fill(); circle(1.5, -62, 1.2); ctx.fill(); } ctx.restore(); };
    f(); }
  // ---------------- a lord's mark on an elite: a low smoulder round it, brighter as it winds ----------------
  const AURA = { mossback: '40,60,20', colossus: '120,60,20', wyrm: '90,40,150', tyiga: '110,30,120', benedict: '40,50,90', sleeper: '90,80,140', w7king: '40,110,130', w8goat: '140,30,20' };
  function aura(e, F, t) { if (TINT || FLASH) return; const sc = e.champ ? 1.3 : 1, cy = e.y - e.z - e.hh * sc * .5, R = Math.max(e.hw * 1.7, e.hh * .62) * sc * (1 + .15 * F), a = (.2 + .26 * F) * (.85 + .15 * Math.sin(t * (4 + 14 * F))), rgb = F > .5 ? '190,36,40' : AURA[e.cMask] || '60,30,60';
    const f = () => { ctx.save(); ctx.globalAlpha *= e.w4vis ?? 1; if (lite()) { ctx.fillStyle = `rgba(${rgb},${a * .6})`; ell(e.x, cy, R * .8, R * .7); ctx.fill(); } else { ctx.translate(e.x, cy); ctx.scale(1, .85); glow(0, 0, R, rgb, a); } ctx.restore(); };
    if (typeof inkG !== 'undefined' && inkG && ctx === inkG) onMain(f); else f(); }
  function flareOf(e) { if (e.cTrait !== 'mask') return 0; const T = now(), w = e.cAtkT < 1.1 ? 1 - Math.max(0, e.cAtkT) / 1.1 : 0, r = e.cFireT ? 1 - (T - e.cFireT) / .55 : 0; return cl01(Math.max(w * (.8 + .2 * Math.sin(T * 26)), r)); }

  // ---------------- drawing a cursed foe (from corruption.js's drawEnemy): de(e, t) draws it as ever ----------------
  function draw(e, t, de) {
    const k = keyOf(e), Lk = LOOK[k], key = e.def && e.def.draw, o = key && CREATURES[key];
    if (!Lk || !o) return de(e, t);
    const F = flareOf(e);
    if (k === 'mimic') mimicShade(e, t);
    if (e.cTrait === 'mask' && !e.dead) aura(e, F, t);
    const A = e.elite && e.guard > 0 && !e.bare && ARMOR[e.type] ? ARMOR[e.type] : null, od = A ? A.draw : null, arm = A ? (en, a) => od.call(A, en, a) : null;
    let done = false, pend = null;
    const after = (s, a) => { try { if (FLASH || TINT) { s.lite = true; s.F = 0; if (Lk.over) { ctx.save(); Lk.over(s); ctx.restore(); } return; } skinPass(s, o, arm, a); if (Lk.over) { ctx.save(); Lk.over(s); ctx.restore(); } } catch (err) { console.error(err); } };
    CREATURES[key] = function (en, a) {
      if (en !== e || done) return o.call(this, en, a); done = true;
      let s = null;
      try { const c = calOf(e, o, a, !!A); s = { e, c, L: layout(c, k, e), k, t, F, u: c.u, a, hurt: cl01(1 - e.hp / Math.max(1, e.maxHp)), lite: lite() };
        if (Lk.under) { ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; Lk.under(s); ctx.restore(); } } catch (err) { console.error(err); s = null; }
      o.call(this, en, a);
      if (s) { if (A) pend = s; else after(s, a); }
    };
    if (A) A.draw = function (en, a) { od.call(this, en, a); if (en === e && pend) { const s = pend; pend = null; after(s, a); } };
    try { de(e, t); } finally { CREATURES[key] = o; if (A) A.draw = od; }
  }
  window.CURSED_LOOK = { draw, LORDS, LOOK, CAL, STAT, flareOf, keyOf, corwin };
})();
