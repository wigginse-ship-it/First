'use strict';
// bloom world: the new locales (approach area and boss room). Registers THEMES, AW_FAR, AW_MID and AW_FLOOR entries.
//   bloom2    — The Thornwood Hollow: dusk deep in an ancient wood, colossal roots arching overhead, toadstools, shelf fungi,
//               hanging moss and faint glowing fungus, warm shafts of low sun falling through the canopy.
//   bloomBoss — The Sunken Grove: Old Mossback's lair, a drowned ring of standing stones in a misty bog around one
//               enormous ancient tree; the floor is still water and mud with stepping stones, lily pads and reeds.
// Everything lives inside this closure so nothing collides with the other art files sharing the global scope.
(function () {
  const W = AW_W;
  const zbHash = (x) => { const s = Math.sin(x * 12.9898) * 43758.5453; return s - Math.floor(s); }; // stable per-tile randomness

  // ---------- shared painting helpers ----------
  function bez(p0, p1, p2, p3, n) { // samples a cubic bezier into n+1 points
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      out.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]);
    }
    return out;
  }
  function wiggle(P, amp, rnd, waves = 3) { // gnarls a centerline: pushes it in and out along its normals
    const ph = rnd() * TAU, ph2 = rnd() * TAU, n = P.length;
    return P.map((p, i) => {
      if (i === 0 || i === n - 1) return p;
      const a = P[i - 1], b = P[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, t = i / (n - 1);
      const o = (Math.sin(t * Math.PI * waves + ph) + Math.sin(t * Math.PI * waves * 2.3 + ph2) * .4) * amp * Math.sin(t * Math.PI);
      return [p[0] - dy / d * o, p[1] + dx / d * o];
    });
  }
  // a tapering limb (root, branch, trunk, stem) painted along a centerline: a body tone, a lit band on whichever flank faces
  // the sun, a shadowed flank, bark furrows running its length, dabbed highlights, and optional moss on top / moss hanging below
  function tube(P, wf, o, rnd) {
    const n = P.length, L = [], R = [], N = [], sx = AW_SUN * .5, sy = -.866;
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      const nx = -dy, ny = dx, w = wf(i / (n - 1)) / 2;
      N.push([nx, ny, w]); L.push([P[i][0] + nx * w, P[i][1] + ny * w]); R.push([P[i][0] - nx * w, P[i][1] - ny * w]);
    }
    const poly = () => { ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]); for (const q of L) ctx.lineTo(q[0], q[1]); for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]); ctx.closePath(); };
    poly(); ctx.fillStyle = o.base; ctx.fill();
    ctx.save(); poly(); ctx.clip();
    const quad = (i, s, k0, k1, col, a) => { // a band between offsets k0..k1 (in half-widths) on side s of segment i
      const [n0x, n0y, w0] = N[i], [n1x, n1y, w1] = N[i + 1], p = P[i], q = P[i + 1];
      ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath();
      ctx.moveTo(p[0] + s * n0x * w0 * k0, p[1] + s * n0y * w0 * k0); ctx.lineTo(q[0] + s * n1x * w1 * k0, q[1] + s * n1y * w1 * k0);
      ctx.lineTo(q[0] + s * n1x * w1 * k1, q[1] + s * n1y * w1 * k1); ctx.lineTo(p[0] + s * n0x * w0 * k1, p[1] + s * n0y * w0 * k1); ctx.closePath(); ctx.fill();
    };
    for (let i = 0; i < n - 1; i++) {
      const nx = (N[i][0] + N[i + 1][0]) / 2, ny = (N[i][1] + N[i + 1][1]) / 2, dl = nx * sx + ny * sy, s = dl >= 0 ? 1 : -1, k = Math.abs(dl);
      quad(i, -s, .15, 1.3, o.dark, .55 * (o.darkA ?? 1));
      quad(i, s, .25, 1.3, o.lit, k * (o.litA ?? .7));
      quad(i, s, .72, 1.3, o.rim || o.lit, k * k * (o.litA ?? .7) * .8);
    }
    ctx.globalAlpha = 1;
    if (o.furrow) { // bark grain along the limb
      ctx.strokeStyle = o.furrow; ctx.lineWidth = o.fw || .7; ctx.globalAlpha = .55; ctx.beginPath();
      for (const f of [-.62, -.3, .05, .38, .66]) { const j = rnd() * 9; for (let i = 0; i < n; i++) { const [nx, ny, w] = N[i], ff = f + Math.sin(i * .9 + j) * .08; const x = P[i][0] + nx * w * ff, y = P[i][1] + ny * w * ff; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } }
      ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (o.dabs) for (let i = 1; i < n - 1; i++) { // broken highlights and knots, the hand of the brush
      const [nx, ny, w] = N[i], dl = nx * sx + ny * sy, s = dl >= 0 ? 1 : -1;
      if (Math.abs(dl) > .3 && rnd() < .7) { const r = Math.min(2.6, Math.max(.7, w * (.1 + rnd() * .08))), k = .45 + rnd() * .35; ctx.globalAlpha = .45 + rnd() * .3; ctx.fillStyle = o.lit; ell(P[i][0] + s * nx * w * k, P[i][1] + s * ny * w * k, r * 2.4, r * .7, Math.atan2(nx, -ny)); ctx.fill(); ctx.globalAlpha = 1; }
      if (rnd() < .1 && w > 4) { const kx = P[i][0] + nx * w * (rnd() - .5), ky = P[i][1] + ny * w * (rnd() - .5), kr = Math.min(4, w * .2); dab(kx, ky, kr, o.dark, .8); dab(kx + AW_SUN * .6, ky - .6, kr * .45, o.lit, .5); }
    }
    ctx.restore();
    if (o.moss) for (let i = 1; i < n - 1; i++) { // moss gathered on the upper flank
      const [nx, ny, w] = N[i], u = ny < 0 ? 1 : -1;
      if (Math.abs(ny) < .35 || rnd() > o.moss) continue;
      const x = P[i][0] + u * nx * w * .78, y = P[i][1] + u * ny * w * .78, tx = -u * ny, ty = u * nx, sz = 1 + w * .1;
      const ang = Math.atan2(ty, tx), szc = Math.min(sz, 3.2);
      for (let k = 0; k < 4; k++) { const d = (rnd() - .5) * w * 1.2, rr = szc * (.8 + rnd() * .8); ctx.globalAlpha = .95; ctx.fillStyle = o.mossC[k < 2 ? 0 : 1]; ell(x + tx * d, y + ty * d - rnd() * 1.2, rr * 1.7, rr * .7, ang); ctx.fill(); }
      if (rnd() < .5) { ctx.fillStyle = o.mossC[2]; ctx.globalAlpha = .85; ell(x + AW_SUN * szc * .6, y - szc * .7, szc * .9, szc * .35, ang); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    if (o.hang && o.hangC) for (let i = 2; i < n - 2; i++) { // moss hanging from the underside
      const [nx, ny, w] = N[i], u = ny > 0 ? 1 : -1;
      if (Math.abs(ny) < .55 || rnd() > o.hang) continue;
      mossStrand(P[i][0] + u * nx * w * .8, P[i][1] + u * ny * w * .8, (o.hangL || 26) * (.4 + rnd() * .9), rnd, o.hangC);
    }
    return N;
  }
  function mossStrand(x, y, len, rnd, cols) { // a beard of moss: fine hanging threads, tufted, thinning toward the tip
    const ph = rnd() * TAU, sw = 1 + rnd() * 2, nt = 2 + Math.floor(rnd() * 2);
    ctx.lineCap = 'round';
    for (let s = 0; s < nt; s++) {
      const L = len * (.55 + rnd() * .45), dx = (s - (nt - 1) / 2) * 1.6;
      ctx.strokeStyle = cols[s % 2]; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(x + dx, y);
      for (let t = 0; t <= L; t += 3) ctx.lineTo(x + dx + Math.sin(t * .1 + ph + s) * sw, y + t); ctx.stroke();
      for (let t = 1; t < L; t += 2.4) {
        const k = 1 - t / L, px = x + dx + Math.sin(t * .1 + ph + s) * sw, r = .5 + k * 1.3 * (.6 + rnd() * .6);
        ctx.globalAlpha = .9; ctx.fillStyle = rnd() < .2 ? cols[2] : cols[Math.floor(rnd() * 2)]; ell(px + (rnd() - .5) * 1.4, y + t, r * .7, r * 1.5, (rnd() - .5) * .6); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
  function shaft(x, y0, y1, w0, w1, rgb, a, slant = .42) { // a shaft of light falling through the canopy (build time only)
    const dx = -AW_SUN * (y1 - y0) * slant;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(x, y0, x + dx, y1); g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(.18, `rgba(${rgb},${a})`); g.addColorStop(.6, `rgba(${rgb},${a * .55})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    for (const k of [1, .62, .3]) { ctx.globalAlpha = .38; ctx.beginPath(); ctx.moveTo(x - w0 * k / 2, y0); ctx.lineTo(x + w0 * k / 2, y0); ctx.lineTo(x + dx + w1 * k / 2, y1); ctx.lineTo(x + dx - w1 * k / 2, y1); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  function add(fn) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); }
  function glowSpot(x, y, r, rgb, a) { add(() => softDab(x, y, r, rgb, a)); }
  function leaf(x, y, l, ang, col) { ctx.fillStyle = col; ell(x, y, l, l * .42, ang); ctx.fill(); }

  // ---------- forest things ----------
  // a great toadstool: a curved stem with a ragged skirt, gills in shadow, a domed cap lit from the sun side and pale warts
  function toadstool(x, base, h, cw, lean, pal, rnd) {
    const tx = x + lean, ty = base - h, ch = cw * (.32 + rnd() * .18), sw = Math.max(2.4, cw * .16);
    const stem = bez([x, base + 1], [x + lean * .1, base - h * .4], [tx - lean * .2, ty + h * .3], [tx, ty + 2], 12);
    tube(stem, (t) => sw * (1.35 - .35 * t) + (t < .15 ? (1 - t / .15) * sw * .7 : 0), { base: pal.stem, lit: pal.stemLit, dark: pal.stemDk, litA: .8, dabs: 1 }, rnd);
    const rk = .7, rp = stem[Math.round(12 * rk)]; // the skirt
    ctx.fillStyle = pal.stem; ctx.beginPath(); ctx.moveTo(rp[0] - sw * 1.1, rp[1] - 1); ctx.quadraticCurveTo(rp[0], rp[1] - 2.4, rp[0] + sw * 1.1, rp[1] - 1);
    for (let k = 4; k >= 0; k--) ctx.lineTo(rp[0] - sw * 1.2 + k * sw * .6, rp[1] + 2 + (k % 2) * 2.4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = pal.stemDk; ctx.globalAlpha = .6; ctx.fillRect(rp[0] - sw * 1.1, rp[1] + 1.4, sw * 2.2, 1); ctx.globalAlpha = 1;
    // gills under the cap
    ctx.fillStyle = pal.gill; ell(tx, ty + 1, cw * .47, cw * .09); ctx.fill();
    ctx.strokeStyle = pal.gillLine; ctx.lineWidth = .5; ctx.beginPath(); for (let k = -6; k <= 6; k++) { ctx.moveTo(tx, ty + 1.6); ctx.lineTo(tx + k / 6 * cw * .45, ty + 1 + (1 - Math.abs(k / 6)) * cw * .06); } ctx.stroke();
    // the cap
    const capP = () => { ctx.beginPath(); ctx.moveTo(tx - cw / 2, ty + 1); ctx.bezierCurveTo(tx - cw * .52, ty - ch * .9, tx - cw * .2, ty - ch * 1.1, tx + AW_SUN * cw * .04, ty - ch); ctx.bezierCurveTo(tx + cw * .26, ty - ch * .98, tx + cw * .54, ty - ch * .8, tx + cw / 2, ty + 1); ctx.quadraticCurveTo(tx, ty - cw * .05, tx - cw / 2, ty + 1); ctx.closePath(); };
    const g = ctx.createRadialGradient(tx + AW_SUN * cw * .2, ty - ch * .8, 1, tx, ty - ch * .3, cw * .62); g.addColorStop(0, pal.capLit); g.addColorStop(.45, pal.cap); g.addColorStop(1, pal.capDk);
    capP(); ctx.fillStyle = g; ctx.fill();
    ctx.save(); capP(); ctx.clip();
    ctx.fillStyle = pal.capDk; ctx.globalAlpha = .7; ell(tx, ty + 1, cw * .55, ch * .28); ctx.fill(); ctx.globalAlpha = 1; // the rim curls under into shadow
    for (let i = 0; i < 10; i++) dab(tx + (rnd() - .5) * cw * .8, ty - ch * (.25 + rnd() * .6), cw * (.05 + rnd() * .06), rnd() < .5 ? pal.capLit : pal.capDk, .35); // brushwork in the cap
    const ns = 5 + Math.floor(cw / 10);
    for (let i = 0; i < ns; i++) { // warts, foreshortened toward the rim
      const u = (rnd() - .5) * 1.7, v = .25 + rnd() * .65, px = tx + u * cw * .42 * (1 - v * .25), py = ty - ch * v * (1 - u * u * .3), r = cw * (.03 + rnd() * .035) * (.6 + v * .5);
      ctx.fillStyle = pal.spotDk; ell(px - AW_SUN * .4, py + .5, r, r * .7); ctx.fill(); ctx.fillStyle = pal.spot; ell(px, py, r, r * .7); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = pal.capLit; ctx.lineWidth = 1.1; ctx.globalAlpha = .7; ctx.beginPath(); ctx.moveTo(tx + AW_SUN * cw * .05, ty - ch * .98); ctx.bezierCurveTo(tx + AW_SUN * cw * .26, ty - ch * .96, tx + AW_SUN * cw * .46, ty - ch * .7, tx + AW_SUN * cw * .5, ty - ch * .1); ctx.stroke(); ctx.globalAlpha = 1;
  }
  // a bracket fungus on bark: a pale top face, a lit lip, a dark underside, growth rings
  function shelf(x, y, w, pal) {
    for (let k = 0; k < 3; k++) {
      const ww = w * (1 - k * .24), yy = y + k * w * .32;
      ctx.fillStyle = pal.under; ctx.beginPath(); ctx.ellipse(x, yy + 1, ww, ww * .34, 0, 0, Math.PI); ctx.fill();
      const g = ctx.createLinearGradient(x - ww * AW_SUN, 0, x + ww * AW_SUN, 0); g.addColorStop(0, pal.dk); g.addColorStop(.6, pal.top); g.addColorStop(1, pal.lit);
      ctx.fillStyle = g; ell(x, yy, ww, ww * .22); ctx.fill();
      ctx.strokeStyle = pal.ring; ctx.lineWidth = .5; ctx.globalAlpha = .7; for (const f of [.75, .5]) { ctx.beginPath(); ctx.ellipse(x, yy - ww * .02, ww * f, ww * .22 * f, 0, Math.PI * .05, Math.PI * .95); ctx.stroke(); } ctx.globalAlpha = 1;
      ctx.strokeStyle = pal.lit; ctx.lineWidth = .9; ctx.beginPath(); ctx.ellipse(x, yy, ww, ww * .22, 0, Math.PI * (AW_SUN > 0 ? 1.55 : 1.05), Math.PI * (AW_SUN > 0 ? 1.95 : 1.45)); ctx.stroke();
    }
  }
  // a little cluster of glowing fungus: thin pale stems, cool luminous caps, a static halo
  function glowShrooms(x, base, n, rnd, rgb, s = 1) {
    glowSpot(x, base - 4 * s, 16 * s, rgb, .32);
    for (let i = 0; i < n; i++) {
      const sx = x + (rnd() - .5) * 14 * s, h = (3 + rnd() * 7) * s, lean = (rnd() - .5) * 3 * s, r = (1.2 + rnd() * 1.6) * s;
      ctx.strokeStyle = '#C8D8C8'; ctx.lineWidth = .7 * s; ctx.beginPath(); ctx.moveTo(sx, base); ctx.quadraticCurveTo(sx, base - h * .6, sx + lean, base - h); ctx.stroke();
      ctx.fillStyle = `rgb(${rgb})`; ctx.beginPath(); ctx.ellipse(sx + lean, base - h, r, r * .6, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.8)'; ell(sx + lean + AW_SUN * r * .3, base - h - r * .3, r * .35, r * .18); ctx.fill();
    }
    add(() => { ctx.fillStyle = `rgba(${rgb},.35)`; for (let i = 0; i < 3; i++) { circle(x + (rnd() - .5) * 18 * s, base - 4 * s - rnd() * 10 * s, .7); ctx.fill(); } });
  }
  // a colossal root heaving out of the earth and arching overhead before plunging back in
  function rootArch(x0, x1, base, apex, w, rnd, pal, extra = {}) {
    const span = x1 - x0, rise = base - apex;
    let P = bez([x0, base + 4], [x0 + span * .04, apex - rise * .2], [x1 - span * .2, apex - rise * .32], [x1, base + 4], 30);
    P = wiggle(P, w * .5, rnd, 2 + rnd() * 2);
    const fl = (t) => { const e = Math.min(t, 1 - t); return w * (.8 + .2 * Math.cos(t * TAU * 1.5)) * (1 + 1.5 * Math.max(0, 1 - e / .14) ** 2) * (t < .5 ? 1.15 : 1); };
    tube(P, fl, Object.assign({ furrow: pal.furrow, fw: .8, dabs: 1, moss: .55, mossC: pal.moss, hang: extra.hang ?? .35, hangL: extra.hangL || 34, hangC: pal.hangC, litA: .75 }, pal), rnd);
    for (const end of [0, 1]) for (let k = 0; k < 2; k++) { // smaller rootlets clawing into the ground at each foot
      const p = P[end ? 30 : 0], d = (end ? 1 : -1) * (k ? 1 : -.6), len = w * (1.6 + rnd() * 1.4);
      const Q = wiggle(bez([p[0], p[1] - w * .7], [p[0] + d * len * .4, p[1] - w * .8], [p[0] + d * len * .8, p[1] - w * .1], [p[0] + d * len, p[1] + 4], 10), w * .2, rnd);
      tube(Q, (t) => w * .55 * (1 - t * .75), Object.assign({ furrow: pal.furrow, dabs: 1, moss: .3, mossC: pal.moss }, pal), rnd);
    }
    return P;
  }
  // a giant trunk rising out of sight, with buttress roots, bracket fungus, moss and the odd glowing speck
  function giantTrunk(x, base, w, rnd, pal, o = {}) {
    const lean = (rnd() - .5) * w * .6;
    for (const s of [-1, 1]) for (let k = 0; k < 2; k++) { // buttresses behind and in front
      const ex = x + s * w * (1.1 + k * .7 + rnd() * .4), Q = wiggle(bez([x + s * w * .1, base - w * (1.6 + rnd())], [x + s * w * .5, base - w * .9], [ex - s * w * .3, base - 6], [ex, base + 3], 12), w * .1, rnd);
      if (k) tube(Q, (t) => w * (.5 - t * .32), Object.assign({ furrow: pal.furrow, dabs: 1, moss: .4, mossC: pal.moss }, pal), rnd);
    }
    const P = wiggle(bez([x, base + 2], [x - lean * .3, base - 90], [x + lean, -10], [x + lean * 1.2, -40], 26), w * .14, rnd, 2);
    tube(P, (t) => w * (1 + 1.1 * Math.max(0, 1 - t / .2) ** 2), Object.assign({ furrow: pal.furrow, fw: 1, dabs: 1, moss: .5, mossC: pal.moss, hang: 0, litA: .75 }, pal), rnd);
    for (const s of [-1, 1]) { // the near buttresses
      const ex = x + s * w * (1 + rnd() * .5), Q = wiggle(bez([x + s * w * .2, base - w * (1.1 + rnd() * .5)], [x + s * w * .55, base - w * .6], [ex - s * w * .25, base - 4], [ex, base + 4], 12), w * .08, rnd);
      tube(Q, (t) => w * (.6 - t * .38), Object.assign({ furrow: pal.furrow, dabs: 1, moss: .5, mossC: pal.moss }, pal), rnd);
    }
    // a dark hollow between the roots
    if (o.hollow) { const hy = base - w * .9; ctx.fillStyle = '#120E0C'; ctx.beginPath(); ctx.ellipse(x + lean * .05, hy, w * .22, w * .42, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = pal.lit; ctx.globalAlpha = .5; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(x + lean * .05, hy, w * .22, w * .42, 0, -Math.PI * .4 * AW_SUN, Math.PI * .4 * AW_SUN, AW_SUN < 0); ctx.stroke(); ctx.globalAlpha = 1; }
    const at = (y) => { let best = P[0]; for (const p of P) if (Math.abs(p[1] - y) < Math.abs(best[1] - y)) best = p; return best; };
    for (const [yy, s, ww] of o.shelves || []) { const p = at(yy); shelf(p[0] + s * w * .42, yy, ww, pal.shelf); }
    for (let i = 0; i < (o.glow || 0); i++) { const p = at(base - 20 - rnd() * 120); const gx = p[0] + (rnd() - .5) * w * .8, gy = p[1]; glowSpot(gx, gy, 6, pal.glow, .5); dab(gx, gy, 1, `rgb(${pal.glow})`, .9); }
    return P;
  }
  // a pale, hazy trunk far back in the wood
  function farTrunk(x, base, w, rnd, col, lit, top = -10, branches = true) {
    const lean = (rnd() - .5) * 20, P = wiggle(bez([x, base], [x, base - 60], [x + lean, top + 60], [x + lean, top], 10), w * .15, rnd, 2);
    tube(P, (t) => w * (1 + .9 * Math.max(0, 1 - t / .15) ** 2), { base: col, lit, dark: awMix(col, '#101820', .35), litA: .55, darkA: .6 }, rnd);
    for (const s of [-1, 1]) if (branches && rnd() < .7) { // a branch reaching up into the canopy
      const by = lerp(base, top, .55 + rnd() * .3), bx = lerp(x, x + lean, (base - by) / (base - top));
      tube(bez([bx, by], [bx + s * 12, by - 10], [bx + s * 24, by - 30], [bx + s * (30 + rnd() * 20), by - 50 - rnd() * 30], 6), (t) => w * .45 * (1 - t * .7), { base: col, lit, dark: awMix(col, '#101820', .35), litA: .5, darkA: .6 }, rnd);
    }
  }

  // ======================================================================================================
  // THE THORNWOOD HOLLOW
  // ======================================================================================================
  const TH_BARK = { base: '#3A302C', lit: '#B08A5E', rim: '#F0C88A', dark: '#16100E', furrow: '#1A1210', moss: ['#2E4A30', '#4E7040', '#9AAE5E'], hangC: ['#3E5638', '#6E8A58', '#A8B878'],
    shelf: { top: '#B88A50', lit: '#F2CE8A', dk: '#6A4A2E', under: '#3A2618', ring: '#7A5434' }, glow: '150,240,210' };
  const TH_TOAD = [
    { stem: '#D2C2A0', stemLit: '#FFF0CC', stemDk: '#6E604E', gill: '#5A3E30', gillLine: '#8A6A50', cap: '#A0442C', capLit: '#F09A5A', capDk: '#4A1E18', spot: '#F2E2C0', spotDk: '#7A3A28' },
    { stem: '#C8B898', stemLit: '#FCEACA', stemDk: '#625644', gill: '#5A4430', gillLine: '#8A7050', cap: '#B8762E', capLit: '#FFCB72', capDk: '#5A3214', spot: '#FBEBCB', spotDk: '#8A5226' },
    { stem: '#BCB4A4', stemLit: '#F0E8D4', stemDk: '#58525A', gill: '#3E3442', gillLine: '#6A5A6A', cap: '#6E4A62', capLit: '#D49AA0', capDk: '#2E1E30', spot: '#E8DCCC', spotDk: '#4E3446' },
  ];
  function canopy(rnd, y0, y1, g, n, rMin, rMax) { // a ceiling of leaves, heavy and dark, ragged along its lower edge
    for (let i = 0; i < n; i++) {
      const x = (i + rnd() * .8) * W / n, y = y0 + rnd() * (y1 - y0), r = rMin + rnd() * (rMax - rMin);
      awWR(x, r * 1.3, rnd, (x, r2) => awLeaves(x, y, r, r2, g, .7));
    }
  }

  function bloom2Far(rnd, th, f) {
    AW_SUN = 1;
    const T = FLOOR_TOP;
    const bg = ctx.createLinearGradient(0, 0, 0, T); // the deep of the wood: cool overhead, a warm glow low between the trunks
    bg.addColorStop(0, '#0E1820'); bg.addColorStop(.4, '#1A2A34'); bg.addColorStop(.66, '#2C4046'); bg.addColorStop(.88, '#4E5E58'); bg.addColorStop(1, '#8A8064');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, T);
    for (let i = 0; i < 4; i++) { const x = 140 + i * 320 + rnd() * 80; awWrap(x, 170, (x) => { softDab(x, 196, 150, '220,170,110', .26); softDab(x + 30, 204, 70, '255,214,150', .26); }); } // sunlit glades far off
    // the farthest trunks, pale in the haze
    for (let i = 0; i < 18; i++) { const x = i * W / 18 + rnd() * 40, w = 5 + rnd() * 7; awWR(x, 70, rnd, (x, r) => farTrunk(x, 206, w, r, '#4A5E68', '#A8A890')); }
    hazeBand(f, th.haze, 40, T, .35);
    // far roots arching between them
    for (let i = 0; i < 5; i++) { const x = i * W / 5 + rnd() * 60, sp = 110 + rnd() * 80, w = 7 + rnd() * 4;
      awWR(x, sp, rnd, (x, r) => rootArch(x - sp / 2, x + sp / 2, 210, 140 + r() * 30, w, r, { base: '#46524E', lit: '#B8A888', rim: '#D8C49A', dark: '#26302E', furrow: 'rgba(30,40,40,.6)', moss: ['#4A5E50', '#647A60', '#9AA880'], hangC: ['#4E6052', '#6A7E66', '#8E9E80'], litA: .55, darkA: .6 }, { hang: .4, hangL: 20 })); }
    // nearer trunks: darker, with branches climbing into the leaves
    for (let i = 0; i < 9; i++) { const x = i * W / 9 + 40 + rnd() * 60, w = 11 + rnd() * 10; awWR(x, 90, rnd, (x, r) => farTrunk(x, 214, w, r, '#2E3E44', '#B49A72')); }
    hazeBand(f, th.haze, 120, T, .4);
    awHills(212, [[3, 4], [8, 2], [17, 1]], 211, '#3C4640', '#A89068', .5);
    for (let x = 0; x < W; x += 4) dab(x, 212 + awWave(211, [[3, 4], [8, 2], [17, 1]])(x) - 1 - rnd() * 2, 2 + rnd() * 2.4, rnd() < .4 ? '#56604E' : '#2E3832', .9); // undergrowth along the crest
    // the canopy overhead, its lower edge ragged and catching a little warm light
    canopy(rnd, 50, 100, ['#101A1A', '#1A2A26', '#33463A', '#8C9064'], 18, 34, 50);
    canopy(rnd, 104, 132, ['#18241E', '#26382C', '#46604A', '#B4A470'], 22, 18, 30);
    for (let i = 0; i < 26; i++) { const x = rnd() * W, y = 70 + rnd() * 50; awWrap(x, 6, (x) => { dab(x, y, .9 + rnd() * 1.3, rnd() < .5 ? '#F2D8A0' : '#C8B488', .75); }); } // the sky glinting through gaps
    // long warm shafts slanting down through the wood
    for (let i = 0; i < 5; i++) { const x = 120 + i * 256 + rnd() * 80, w0 = 10 + rnd() * 16; awWrap(x, 160, (x) => shaft(x, 104, T, w0, w0 * 3, '255,206,140', .3 + rnd() * .1)); }
    hazeBand(f, th.haze, 170, T, .3);
    for (let i = 0; i < 14; i++) { const x = rnd() * W, y = 150 + rnd() * 60; awWrap(x, 10, (x) => { glowSpot(x, y, 7, '140,240,210', .35); dab(x, y, .9, '#D8FFF0', .8); }); } // faint glows deep in the wood
  }

  function bloom2Mid(rnd) {
    AW_SUN = 1;
    const T = FLOOR_TOP, g = ['#16241C', '#24382A', '#3E5E3E', '#9AA866'];
    awHills(222, [[2, 6], [5, 3], [11, 1.5]], 913, '#252C22', '#7A6E48', .45);
    // the great trunks of the hollow
    for (const [tx, tw, o] of [[120, 34, { shelves: [[150, 1, 12], [168, 1, 9], [112, -1, 10]], glow: 4, hollow: 1 }], [760, 42, { shelves: [[130, 1, 14], [150, 1, 10], [176, -1, 9]], glow: 5 }]]) {
      awWR(tx + rnd() * 30, 150, rnd, (x, r) => {
        const P = giantTrunk(x, T + 2, tw, r, TH_BARK, o), top = P[P.length - 6];
        for (let k = 0; k < 7; k++) awLeaves(top[0] + (k - 3) * 22 + (r() - .5) * 14, 70 + r() * 30 + Math.abs(k - 3) * 6, 18 + r() * 12, r, ['#14221C', '#22362A', '#4A6644', '#B8A870'], .6); // its crown hanging low over the hollow
      });
    }
    // colossal roots arching overhead between them
    for (const [ax, sp, apex, w, hang] of [[440, 330, 62, 24, .45], [1040, 300, 78, 21, .4]]) {
      awWR(ax + rnd() * 20, sp / 2 + 90, rnd, (x, r) => rootArch(x - sp / 2, x + sp / 2, T, apex, w, r, TH_BARK, { hang, hangL: 40 }));
    }
    // a lower, nearer root snaking along the ground
    for (const [ax, sp] of [[300, 160], [920, 140]]) awWR(ax + rnd() * 40, sp, rnd, (x, r) => rootArch(x - sp / 2, x + sp / 2, T + 2, T - 40 - r() * 20, 11, r, TH_BARK, { hang: .25, hangL: 14 }));
    // giant toadstools sheltering under the roots, and smaller ones crowding at their feet
    for (const [x, h, cw, pi] of [[400, 70, 64, 0], [470, 38, 34, 1], [590, 24, 22, 0], [1000, 58, 54, 1], [1090, 34, 30, 0], [258, 28, 26, 2], [880, 22, 20, 2]]) {
      awWR(x + rnd() * 20, cw, rnd, (x, r) => toadstool(x, T + 1, h, cw, (r() - .5) * h * .3, TH_TOAD[pi], r));
    }
    // undergrowth: dark bushes and ferns along the foot of everything
    for (let x = 0; x < W; x += 52) awWR(x + rnd() * 20, 34, rnd, (x, r) => { awBush(x, T + 3, 24 + r() * 30, 8 + r() * 10, r, g); if (r() < .6) awFern(x + 16, T + 2, 12 + r() * 8, '#24382A', '#7E9454'); });
    for (let i = 0; i < 9; i++) awWR(rnd() * W, 20, rnd, (x, r) => glowShrooms(x, T + 1, 4 + Math.floor(r() * 4), r, '160,245,215'));
    for (let i = 0; i < 8; i++) awWR(rnd() * W, 16, rnd, (x, r) => toadstool(x, T + 2, 8 + r() * 8, 8 + r() * 6, (r() - .5) * 4, TH_TOAD[Math.floor(r() * 3)], r));
  }

  function bloom2Floor(rnd, th) {
    const T = FLOOR_TOP, fg = ctx.createLinearGradient(0, T - 4, 0, VH);
    fg.addColorStop(0, '#363A28'); fg.addColorStop(.35, '#2C3020'); fg.addColorStop(1, '#14160E'); ctx.fillStyle = fg; ctx.fillRect(0, T - 4, W, VH - T + 4);
    for (let i = 0; i < 240; i++) { const x = rnd() * W, y = T + rnd() * (VH - T); awWrap(x, 12, (x) => dab(x, y, 4 + rnd() * 8, rnd() < .5 ? '#46482E' : '#1E2216', .35)); } // mottled loam
    // the path: a winding ribbon of trodden leaf litter between the roots
    const eA = awWave(517, [[2, 9], [5, 4], [9, 2]]), eB = awWave(733, [[3, 8], [6, 4], [11, 2]]);
    const top = (x) => T + 34 + eA(x), bot = (x) => T + 92 + eB(x);
    ctx.fillStyle = '#705A3A'; ctx.beginPath(); ctx.moveTo(0, top(0)); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, top(x)); for (let x = W; x >= 0; x -= 8) ctx.lineTo(x, bot(x)); ctx.closePath(); ctx.fill();
    for (let x = 0; x < W; x += 5) for (const [yf, s] of [[top, -1], [bot, 1]]) { const y = yf(x); awWrap(x, 8, (x) => dab(x, y + s * rnd() * 3, 3 + rnd() * 4, '#705A3A', 1)); } // ragged edges
    const pg = ctx.createLinearGradient(0, T + 30, 0, T + 100); pg.addColorStop(0, 'rgba(255,214,150,.0)'); pg.addColorStop(.45, 'rgba(255,214,150,.08)'); pg.addColorStop(1, 'rgba(255,214,150,0)'); ctx.fillStyle = pg; ctx.fillRect(0, T + 30, W, 70); // the walked middle catches the light
    for (let i = 0; i < 5; i++) { const x = rnd() * W, y = T + 50 + rnd() * 30; awWrap(x, 70, (x) => add(() => awSoft(x, y, 50 + rnd() * 30, 9, '255,196,120', .16))); } // pools of low sun on the path
    // fallen leaves, densest on the path: ochre, rust, umber and a few still green
    const LC = ['#6E4A26', '#5A3A20', '#7E5428', '#4A3A22', '#5E5630', '#8A5A2C', '#A8783A', '#6A3A22', '#C09048'];
    for (let i = 0; i < 950; i++) {
      const x = rnd() * W, onP = rnd() < .75, y = onP ? lerp(top(x) + 2, bot(x) - 2, rnd()) : T + rnd() * (VH - T), l = (1.6 + rnd() * 2.2) * (.7 + (y - T) / 160), ang = (rnd() - .5) * 2.4, col = LC[Math.floor(rnd() * LC.length)];
      awWrap(x, 6, (x) => { leaf(x + .4, y + .6, l, ang, 'rgba(30,20,12,.45)'); leaf(x, y, l, ang, col); if (rnd() < .22) { ctx.fillStyle = 'rgba(255,220,160,.3)'; ell(x + Math.cos(ang) * l * .2, y - .4, l * .5, l * .14, ang); ctx.fill(); } });
    }
    // roots running across the floor, half sunk in the loam, lit along their backs
    for (let i = 0; i < 7; i++) {
      const x = i * W / 7 + rnd() * 80, y0 = T + 6 + rnd() * 12, y1 = i % 2 ? T + 70 + rnd() * 50 : T + 14 + rnd() * 20, len = 140 + rnd() * 140, w = 5 + rnd() * 5 + (y1 - T) * .04;
      awWR(x, len + 20, rnd, (x, r) => {
        const P = wiggle(bez([x - len * .5, y0], [x - len * .2, y0 - 6], [x + len * .2, y1 + 4], [x + len * .5, y1], 18), 4, r);
        ctx.beginPath(); for (let k = 0; k < P.length; k++) { const p = P[k]; k ? ctx.lineTo(p[0] - 1, p[1] + w * .35) : ctx.moveTo(p[0] - 1, p[1] + w * .35); } ctx.lineWidth = w * .9; ctx.strokeStyle = 'rgba(16,12,8,.22)'; ctx.stroke(); // its shadow on the ground
        tube(P, (t) => w * (1 - t * .45) * (.8 + .2 * Math.sin(t * 9)), Object.assign({ furrow: TH_BARK.furrow, dabs: 1, moss: .35, mossC: TH_BARK.moss }, TH_BARK), r);
        for (let k = 0; k < 6; k++) { const p = P[2 + Math.floor(r() * 14)]; leaf(p[0] + (r() - .5) * 6, p[1] - w * .2, 2.2, (r() - .5) * 2, LC[Math.floor(r() * LC.length)]); }
      });
    }
    // moss cushions and pale pebbles, small toadstools and glowing caps in the litter
    for (let i = 0; i < 30; i++) { const x = rnd() * W, y = rnd() < .5 ? T + 6 + rnd() * 26 : T + 100 + rnd() * 18; const r0 = 4 + rnd() * 5; awWrap(x, 10, (x) => { ctx.fillStyle = '#243C24'; ell(x, y, r0, r0 * .38); ctx.fill(); ctx.fillStyle = '#4A6A3C'; ell(x + 1, y - r0 * .12, r0 * .7, r0 * .24); ctx.fill(); dab(x + r0 * .4, y - r0 * .2, 1.1, '#9AAE5E', .8); }); }
    for (let i = 0; i < 26; i++) { const x = rnd() * W, y = lerp(top(x), bot(x), rnd()), s = 1.6 + rnd() * 2.4; awWrap(x, 6, (x) => { ctx.fillStyle = 'rgba(20,14,10,.5)'; ell(x + .6, y + .8, s, s * .6); ctx.fill(); ctx.fillStyle = rnd() < .5 ? '#8A8478' : '#A49A86'; ell(x, y, s, s * .62); ctx.fill(); ctx.fillStyle = '#E2D8C0'; ell(x + s * .3, y - s * .2, s * .35, s * .2); ctx.fill(); }); }
    for (let i = 0; i < 9; i++) awWR(rnd() * W, 12, rnd, (x, r) => { const y = r() < .5 ? T + 8 + r() * 16 : T + 104 + r() * 10; toadstool(x, y, 6 + r() * 6, 7 + r() * 5, (r() - .5) * 3, TH_TOAD[Math.floor(r() * 3)], r); });
    for (let i = 0; i < 7; i++) awWR(rnd() * W, 18, rnd, (x, r) => glowShrooms(x, T + 6 + r() * 14, 3 + Math.floor(r() * 3), r, '160,245,215', .8));
    // the verge at the back: mossy hummocks, ferns and dark leaves
    const g = ['#14201A', '#22342A', '#3A5638', '#8E9E5E'];
    for (let x = 0; x < W; x += 74) awWR(x + rnd() * 30, 34, rnd, (x, r) => awBush(x, T + 3, 20 + r() * 24, 7 + r() * 10, r, g));
    for (let i = 0; i < 10; i++) awWR(rnd() * W, 40, rnd, (x, r) => { const l = 30 + r() * 30; tube(wiggle(bez([x - l, T + 6], [x - l * .4, T - 10 - r() * 8], [x + l * .4, T - 8 - r() * 8], [x + l, T + 6], 12), 2, r), (t) => 7 + 3 * Math.sin(t * Math.PI), Object.assign({ furrow: TH_BARK.furrow, dabs: 1, moss: .6, mossC: TH_BARK.moss }, TH_BARK), r); }); // root humps at the back
    for (let i = 0; i < 26; i++) awWR(rnd() * W, 20, rnd, (x, r) => awFern(x, T + 6, 10 + r() * 8, '#24382A', '#7E9454'));
    awBlades(rnd, 500, T, T + 30, 5, ['#2A3A24', '#3E5230', '#5E7440'], 1.1); awBlades(rnd, 500, VH - 50, VH, 6, ['#1E2A18', '#2E3E24', '#4A5E34'], 1.4);
    const sh = ctx.createLinearGradient(0, VH - 34, 0, VH); sh.addColorStop(0, 'rgba(10,12,10,0)'); sh.addColorStop(1, 'rgba(10,12,10,.5)'); ctx.fillStyle = sh; ctx.fillRect(0, VH - 34, W, 34);
  }

  // live: a handful of fireflies drifting slowly through the hollow (anchored to the world, never re-rolled)
  function bloom2Live(camX, t) {
    const S = 140, off = ((-camX) % S + S) % S - S;
    for (let x = off; x < VW + S; x += S) {
      const w = Math.floor((x + camX) / S + .5), ph = zbHash(w) * TAU;
      const px = x + zbHash(w + 1) * 120 + Math.sin(t * .23 + ph) * 18, py = FLOOR_TOP - 70 + zbHash(w + 2) * 120 + Math.sin(t * .31 + ph * 2) * 10;
      const a = .3 + .3 * (.5 + .5 * Math.sin(t * .7 + ph * 3));
      ctx.fillStyle = `rgba(190,255,170,${a * .22})`; circle(px, py, 4.5); ctx.fill();
      ctx.fillStyle = `rgba(230,255,200,${a})`; circle(px, py, 1.1); ctx.fill();
    }
  }

  // ======================================================================================================
  // THE SUNKEN GROVE
  // ======================================================================================================
  const SG_STONE = { base: '#6E6A76', lit: '#E2CCA4', dark: '#34323E', moss: ['#3E5A36', '#5E7E44', '#A8B870'], lichen: '#C8C49A' };
  const SG_OLD = { base: '#5A5650', lit: '#E8D2A4', rim: '#FFF0C8', dark: '#262426', furrow: 'rgba(30,26,26,.6)', moss: ['#4A6040', '#6A8450', '#B4BC80'], hangC: ['#5A6E50', '#7E9266', '#B8C094'] };

  // the ancient tree at the heart of the ring: drowned roots, a vast gnarled bole with a hollow, limbs reaching out of
  // sight, beards of moss, a few last tufts of leaves
  function oldTree(x, base, rnd, pal, sc = 1) {
    const w = 46 * sc, lean = (rnd() - .5) * 20;
    const leaves = [];
    const limb = (px, py, ang, len, lw, depth) => {
      const ex = px + Math.cos(ang) * len, ey = py + Math.sin(ang) * len, bend = (rnd() - .5) * len * .5;
      const P = wiggle(bez([px, py], [px + Math.cos(ang) * len * .35 - Math.sin(ang) * bend, py + Math.sin(ang) * len * .35 + Math.cos(ang) * bend], [ex - Math.cos(ang) * len * .3, ey - Math.sin(ang) * len * .3 + len * .1], [ex, ey], 10), lw * .17, rnd);
      tube(P, (t) => lw * (1 - t * .45), Object.assign({ furrow: pal.furrow, dabs: 1, moss: .5, mossC: pal.moss, hang: depth >= 1 ? .3 : .15, hangL: 26 * sc, hangC: pal.hangC, litA: .7 }, pal), rnd);
      if (depth > 0) { const nk = 2 + (rnd() < .4 ? 1 : 0); for (let k = 0; k < nk; k++) { const a = ang + (k - (nk - 1) / 2) * (.6 + rnd() * .4) + (rnd() - .5) * .3; limb(ex, ey, a, len * (.6 + rnd() * .2), lw * .58, depth - 1); } }
      else { if (rnd() < .55) leaves.push([ex, ey]); ctx.strokeStyle = pal.dark; ctx.lineWidth = .8; ctx.beginPath(); for (let k = 0; k < 3; k++) { const a = ang + (rnd() - .5) * 1.4; ctx.moveTo(ex, ey); ctx.lineTo(ex + Math.cos(a) * 9 * sc, ey + Math.sin(a) * 9 * sc); } ctx.stroke(); }
    };
    // roots spreading into the water
    for (let k = 0; k < 6; k++) { const s = k % 2 ? 1 : -1, d = (40 + rnd() * 60) * sc, Q = wiggle(bez([x + s * w * .3, base - w * .6], [x + s * w * .7, base - w * .5], [x + s * d * .8, base - 6], [x + s * d, base + 4], 12), w * .08, rnd); tube(Q, (t) => w * (.45 - t * .3), Object.assign({ furrow: pal.furrow, dabs: 1, moss: .5, mossC: pal.moss }, pal), rnd); }
    const topY = base - 96 * sc, P = wiggle(bez([x, base + 2], [x - lean * .4, base - 60 * sc], [x + lean, topY + 40 * sc], [x + lean, topY], 18), w * .12, rnd, 2);
    tube(P, (t) => w * (1 + 1.2 * Math.max(0, 1 - t / .25) ** 2) * (1 - t * .15), Object.assign({ furrow: pal.furrow, fw: 1, dabs: 1, moss: .6, mossC: pal.moss, litA: .75 }, pal), rnd);
    // the hollow in the bole
    const hy = base - 50 * sc, hx = x + lean * .3; ctx.fillStyle = '#2A2428'; ell(hx, hy, w * .16, w * .3); ctx.fill(); ctx.fillStyle = '#141014'; ell(hx + AW_SUN * w * .03, hy + w * .03, w * .1, w * .22); ctx.fill();
    ctx.strokeStyle = pal.lit; ctx.globalAlpha = .55; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(hx, hy, w * .17, w * .31, 0, -1.2, 1.2); ctx.stroke(); ctx.globalAlpha = 1;
    for (let i = 0; i < 6; i++) dab(hx + (rnd() - .5) * w * .5, hy - w * .42 + rnd() * 3, 2 + rnd() * 2, pal.moss[Math.floor(rnd() * 3)], .9);
    // the limbs
    const tx = x + lean, ty = topY + 6;
    limb(tx, ty, -Math.PI / 2 - 1.05 - rnd() * .2, 84 * sc, w * .64, 3);
    limb(tx, ty, -Math.PI / 2 + 1 + rnd() * .2, 88 * sc, w * .62, 3);
    limb(tx, ty - 4, -Math.PI / 2 - .25 + (rnd() - .5) * .3, 56 * sc, w * .48, 2);
    limb(tx, ty - 2, -Math.PI / 2 + .45, 50 * sc, w * .42, 2);
    // the last of its leaves, dusty gold and green
    for (const [lx, ly] of leaves) awLeaves(lx, ly, (9 + rnd() * 8) * sc, rnd, ['#3E5440', '#6A7E54', '#C8BC7E', '#FFF0C0'], .45);
  }
  // a standing stone: rough-dressed, lit on its sun face, lichen and moss, a carved spiral, the foot drowned in the bog
  function menhir(x, base, w, h, tilt, rnd, st, o = {}) {
    const top = base - h, k = [rnd(), rnd(), rnd(), rnd()];
    const pts = [x - w / 2, base + 3, x - w * (.46 + k[0] * .06) + tilt * .6, base - h * .55, x - w * .34 + tilt, top + 6 + k[1] * 8, x - w * .05 + tilt, top + k[2] * 3, x + w * .28 + tilt, top + 3 + k[3] * 5, x + w * .45 + tilt, top + 12, x + w * (.48 + k[1] * .04) + tilt * .5, base - h * .5, x + w / 2, base + 3];
    awFillPts(pts, st.base);
    ctx.save(); awPath(pts); ctx.clip();
    const lx = AW_SUN > 0 ? x + w * .12 : x - w * .12; // the sun face
    ctx.fillStyle = st.lit; ctx.globalAlpha = .55; awPath(AW_SUN > 0 ? [lx + tilt * .2, base + 4, lx + tilt + 2, top - 4, x + w + tilt, top - 4, x + w, base + 4] : [lx + tilt * .2, base + 4, lx + tilt - 2, top - 4, x - w + tilt, top - 4, x - w, base + 4]); ctx.fill();
    ctx.fillStyle = st.dark; ctx.globalAlpha = .55; awPath(AW_SUN > 0 ? [x - w, base + 4, x - w + tilt, top - 4, x - w * .3 + tilt, top - 4, x - w * .3, base + 4] : [x + w, base + 4, x + w + tilt, top - 4, x + w * .3 + tilt, top - 4, x + w * .3, base + 4]); ctx.fill(); ctx.globalAlpha = 1;
    for (let i = 0; i < 18; i++) { const yy = top + rnd() * h, xx = x + (rnd() - .5) * w + tilt * (1 - (yy - top) / h); ctx.globalAlpha = .35; ctx.fillStyle = rnd() < .5 ? awMix(st.base, st.lit, .35) : awMix(st.base, st.dark, .4); ell(xx, yy, 1.4 + rnd() * w * .09, 1 + rnd() * 2.2, (rnd() - .5) * .8); ctx.fill(); ctx.globalAlpha = 1; } // tooling and weather
    ctx.fillStyle = st.lit; ctx.globalAlpha = .7; ctx.fillRect(lx + tilt + 1, top, 1.4, h * .5); ctx.globalAlpha = 1; // the arris catching the light
    ctx.strokeStyle = st.dark; ctx.lineWidth = .7; ctx.globalAlpha = .7; ctx.beginPath(); // cracks
    for (let c = 0; c < 2; c++) { let cx = x + (rnd() - .5) * w * .6 + tilt * .5, cy = top + 4 + rnd() * h * .3; ctx.moveTo(cx, cy); for (let s = 0; s < 4; s++) { cx += (rnd() - .5) * 5; cy += 5 + rnd() * 8; ctx.lineTo(cx, cy); } }
    ctx.stroke(); ctx.globalAlpha = 1;
    if (o.spiral) { // a worn spiral carving: a dark groove with a lit lower lip
      const sx = x + tilt * .5, sy = top + h * .38, R = Math.min(w * .3, 9);
      for (const [col, dy, a] of [[st.dark, 0, .75], [st.lit, .8, .45]]) { ctx.strokeStyle = col; ctx.globalAlpha = a; ctx.lineWidth = .9; ctx.beginPath(); for (let t = 0; t < 14; t += .3) { const r = R * t / 14; const px = sx + Math.cos(t) * r, py = sy + dy + Math.sin(t) * r; t ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); } ctx.globalAlpha = 1;
    }
    ctx.fillStyle = 'rgba(20,24,26,.45)'; ctx.fillRect(x - w, base - 8, w * 2, 12); // wet and dark at the waterline
    ctx.restore();
    for (let i = 0; i < 5; i++) dab(x + (rnd() - .5) * w * .8, base - 4 - rnd() * 8, 2 + rnd() * 3, st.moss[Math.floor(rnd() * 2)], .9); // moss at the foot
    for (let i = 0; i < 6; i++) dab(x - w * .2 + tilt + (rnd() - .5) * w * .5, top + 3 + rnd() * 6, 1.4 + rnd() * 2.4, st.moss[1 + Math.floor(rnd() * 2)], .9); // and on the crown
    for (let i = 0; i < 7; i++) dab(x + (rnd() - .5) * w * .7 + tilt * .4, top + h * (.2 + rnd() * .6), .9 + rnd() * 1.6, st.lichen, .7); // lichen
    return { top, tilt };
  }
  function lintel(x0, x1, y, h, rnd, st) { // the capstone across two uprights, mossy on top with moss hanging off it
    const pts = [x0 - 4, y + h, x0 - 6, y + 2, x0 + 2, y - 1, x1 - 4, y - 2, x1 + 6, y + 1, x1 + 4, y + h];
    awFillPts(pts, st.base);
    ctx.save(); awPath(pts); ctx.clip();
    ctx.fillStyle = st.lit; ctx.globalAlpha = .6; ctx.fillRect(x0 - 8, y - 3, x1 - x0 + 16, 3.4); ctx.globalAlpha = .5; ctx.fillStyle = st.dark; ctx.fillRect(x0 - 8, y + h - 3.4, x1 - x0 + 16, 4); ctx.globalAlpha = 1;
    for (let i = 0; i < 12; i++) dab(lerp(x0, x1, rnd()), y + rnd() * h, 1.5 + rnd() * 2.5, rnd() < .5 ? awMix(st.base, st.lit, .3) : awMix(st.base, st.dark, .4), .45);
    ctx.restore();
    for (let i = 0; i < 18; i++) { ctx.fillStyle = st.moss[Math.floor(rnd() * 3)]; ell(lerp(x0, x1, rnd()), y - .3, 2 + rnd() * 3, .9 + rnd() * 1.1); ctx.fill(); }
    for (let i = 0; i < 5; i++) mossStrand(lerp(x0 + 4, x1 - 4, rnd()), y + h - 1, 10 + rnd() * 22, rnd, SG_OLD.hangC);
  }
  function reeds(x, base, n, h, rnd, cols, cattail = '#5A3A22') { // a clump of reeds and bulrushes
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const sx = x + (rnd() - .5) * n * 1.6, l = h * (.5 + rnd() * .6), lean = (rnd() - .4) * l * .35, col = cols[Math.floor(rnd() * cols.length)];
      ctx.strokeStyle = col; ctx.lineWidth = 1 + rnd() * .6; ctx.beginPath(); ctx.moveTo(sx, base); ctx.quadraticCurveTo(sx + lean * .2, base - l * .6, sx + lean, base - l); ctx.stroke();
      if (rnd() < .12) { ctx.fillStyle = cattail; ell(sx + lean * .95, base - l * .93, 1.4, 3.6, lean / l * .5); ctx.fill(); ctx.fillStyle = 'rgba(255,220,160,.5)'; ell(sx + lean * .95 + AW_SUN * .5, base - l * .95, .5, 2.4, lean / l * .5); ctx.fill(); }
    }
  }

  function bloomBossFar(rnd, th, f) {
    AW_SUN = 1;
    // a far shore: misty hills and a dim tree line, the other side of the drowned ring standing on it
    awHills(176, [[2, 10], [5, 4], [13, 2]], 401, '#8A98A0', '#E8D4B0', .4);
    const hy = awWave(401, [[2, 10], [5, 4], [13, 2]]);
    for (let x = 0; x < W; x += 3.4) dab(x, 176 + hy(x) - 1 - rnd() * 3, 2.4 + rnd() * 2.6, rnd() < .4 ? '#9AA6AC' : '#76868E', .95);
    for (let i = 0; i < 14; i++) { const x = rnd() * W; awWR(x, 20, rnd, (x, r) => farTrunk(x, 198, 2 + r() * 2.6, r, '#7A8890', '#C8C0A8', 160 + r() * 26, false)); } // drowned snags
    hazeBand(f, th.haze, 120, FLOOR_TOP, .42);
    const far = { base: '#7A8290', lit: '#E2D2B4', dark: '#5A6070', moss: ['#6A7E70', '#7E907A', '#A8B49A'], lichen: '#C8CCB8' };
    for (let i = 0; i < 11; i++) { const x = i * W / 11 + rnd() * 50, h = 18 + rnd() * 18; awWR(x, 14, rnd, (x, r) => menhir(x, 204, 7 + r() * 5, h, (r() - .5) * 4, r, far)); }
    // the still water of the bog stretching back to them
    const wg = ctx.createLinearGradient(0, 200, 0, FLOOR_TOP); wg.addColorStop(0, '#B8BCA8'); wg.addColorStop(1, '#8E9890'); ctx.fillStyle = wg; ctx.fillRect(0, 202, W, FLOOR_TOP - 202);
    ctx.strokeStyle = 'rgba(255,244,214,.45)'; ctx.lineWidth = .8; ctx.beginPath(); for (let i = 0; i < 70; i++) { const x = rnd() * W, y = 204 + rnd() * 32, l = 8 + rnd() * 30; ctx.moveTo(x, y); ctx.lineTo(x + l, y); } ctx.stroke();
    hazeBand(f, th.haze, 150, FLOOR_TOP, .32);
    // the ancient tree, twice to a tile so one always stands in the arena (one a little nearer and greater)
    for (const [x, sc] of [[330, 1.12], [970, 1]]) awWR(x + rnd() * 20, 330, rnd, (x, r) => {
      oldTree(x, 214, r, SG_OLD, sc);
      ctx.save(); ctx.beginPath(); ctx.rect(x - 140, 214, 280, FLOOR_TOP - 214); ctx.clip(); // its reflection, broken by ripples
      ctx.fillStyle = 'rgba(40,44,46,.35)'; for (let y = 216; y < FLOOR_TOP; y += 2.4) { const ww = 40 * sc * (1 + (y - 214) * .03); ctx.fillRect(x - ww / 2 + Math.sin(y * 1.3) * 3, y, ww, 1.4); }
      ctx.restore();
    });
    // mist lying on the water and a veil over the far stones
    for (let i = 0; i < 16; i++) { const x = rnd() * W, y = 194 + rnd() * 26, r = 60 + rnd() * 70; awWrap(x, r, (x) => awSoft(x, y, r, r * .16, '226,230,214', .5)); }
    hazeBand(f, th.haze, 196, FLOOR_TOP, .35);
    // shafts of light through the mist
    for (let i = 0; i < 6; i++) { const x = 60 + i * 213 + rnd() * 60, w0 = 12 + rnd() * 18; awWrap(x, 160, (x) => shaft(x, 20, FLOOR_TOP, w0, w0 * 2.6, '255,236,190', .2 + rnd() * .1, .36)); }
  }

  function bloomBossMid(rnd) {
    AW_SUN = 1;
    const T = FLOOR_TOP, rc = ['#4E5E34', '#6A7A40', '#8E9A52', '#B8B66A'];
    // the near water, from the stones down to the floor
    const wg = ctx.createLinearGradient(0, 210, 0, T); wg.addColorStop(0, 'rgba(138,148,138,0)'); wg.addColorStop(.35, 'rgba(138,148,138,1)'); wg.addColorStop(1, '#5E6A64'); ctx.fillStyle = wg; ctx.fillRect(0, 210, W, T - 210);
    ctx.strokeStyle = 'rgba(255,240,206,.4)'; ctx.lineWidth = .9; ctx.beginPath(); for (let i = 0; i < 60; i++) { const x = rnd() * W, y = 218 + rnd() * 20, l = 10 + rnd() * 34; ctx.moveTo(x, y); ctx.lineTo(x + l, y); } ctx.stroke();
    for (let i = 0; i < 14; i++) { const x = i * W / 14 + rnd() * 40, r = 70 + rnd() * 50; awWrap(x, r, (x) => awSoft(x, 216, r, r * .1, '226,230,214', .55)); } // mist hiding where the far water meets the near
    // the ring of standing stones: tall menhirs, two trilithons, one leaning, one fallen to a stump
    const stones = [[40, 'tall'], [200, 'lean'], [360, 'tri'], [560, 'stump'], [700, 'tall'], [860, 'tri'], [1060, 'tall'], [1180, 'small']];
    for (const [sx, kind] of stones) awWR(sx + rnd() * 20, 90, rnd, (x, r) => {
      const base = 228 + r() * 6, items = [];
      if (kind === 'tri') { const gap = 46 + r() * 10, h = 84 + r() * 16; items.push([x - gap / 2, 22, h, (r() - .5) * 3], [x + gap / 2, 24, h - 4, (r() - .5) * 3]); }
      else if (kind === 'tall') items.push([x, 26 + r() * 8, 110 + r() * 26, (r() - .5) * 5]);
      else if (kind === 'lean') items.push([x, 24, 96, 16 + r() * 6]);
      else if (kind === 'small') items.push([x, 18, 54 + r() * 10, (r() - .5) * 8]);
      else items.push([x, 30, 34, 4]);
      // their reflections first, so the stones stand in the water
      ctx.save(); ctx.beginPath(); ctx.rect(x - 90, base - 2, 180, T - base + 2); ctx.clip();
      for (const [ix, iw, ih, tl] of items) { ctx.fillStyle = 'rgba(46,44,56,.5)'; for (let y = base; y < T; y += 2.2) { const k = (y - base) / ih; ctx.fillRect(ix - iw / 2 + tl * k + Math.sin(y * 1.7) * 1.4, y, iw * (1 - k * .2), 1.3); } }
      ctx.restore();
      const tops = items.map(([ix, iw, ih, tl], k) => menhir(ix, base, iw, ih, tl, r, SG_STONE, { spiral: kind === 'tall' || (kind === 'tri' && k === 0) }));
      if (kind === 'tri') lintel(items[0][0] - 8, items[1][0] + 8, Math.min(tops[0].top, tops[1].top) - 9, 12, r, SG_STONE);
      if (kind === 'stump') { // the fallen top lying in the bog beside it
        const fx = x + 34, fy = base - 4; ctx.save(); ctx.translate(fx, fy); ctx.rotate(.12); awFillPts([-26, 4, -24, -8, 20, -10, 28, -2, 26, 5], SG_STONE.base); awFillPts([-24, -8, 20, -10, 28, -2, -22, -3], SG_STONE.lit, .55); ctx.restore();
        for (let i = 0; i < 8; i++) dab(fx - 20 + r() * 44, fy - 9 + r() * 4, 1.6 + r() * 2, SG_STONE.moss[Math.floor(r() * 3)], .9);
      }
      reeds(x + (r() < .5 ? -1 : 1) * (30 + r() * 20), base + 2, 12, 30, r, rc);
    });
    // mist curling round the feet of the stones
    for (let i = 0; i < 12; i++) { const x = rnd() * W, y = 220 + rnd() * 12, r = 40 + rnd() * 50; awWrap(x, r, (x) => awSoft(x, y, r, r * .14, '232,234,218', .38)); }
    // dead snags and reed beds between the stones
    for (let i = 0; i < 4; i++) awWR(i * 320 + 130 + rnd() * 60, 30, rnd, (x, r) => { const h = 30 + r() * 30; tube(wiggle(bez([x, T - 6], [x, T - h * .4], [x + 6, T - h * .7], [x + 4 + r() * 8, T - h], 8), 2, r), (t) => 7 * (1 - t * .7), Object.assign({ furrow: SG_OLD.furrow, dabs: 1, moss: .5, mossC: SG_OLD.moss, hang: 0 }, SG_OLD), r); });
    for (let i = 0; i < 12; i++) awWR(rnd() * W, 24, rnd, (x, r) => reeds(x, T - 2, 10 + Math.floor(r() * 8), 22 + r() * 16, r, rc));
  }

  function lumpy(x, y, rx, ry, r) { ctx.beginPath(); for (let k = 0; k < 14; k++) { const a = k / 14 * TAU, q = 1 + (r() - .5) * .22; k ? ctx.lineTo(x + Math.cos(a) * rx * q, y + Math.sin(a) * ry * q) : ctx.moveTo(x + Math.cos(a) * rx * q, y + Math.sin(a) * ry * q); } ctx.closePath(); }
  function bloomBossFloor(rnd, th) {
    const T = FLOOR_TOP;
    // still water, pale where it mirrors the misty sky, darker and greener toward us
    const wg = ctx.createLinearGradient(0, T - 6, 0, VH); wg.addColorStop(0, '#7E8A82'); wg.addColorStop(.25, '#5A6A62'); wg.addColorStop(.7, '#3A4A42'); wg.addColorStop(1, '#1E2A24');
    ctx.fillStyle = wg; ctx.fillRect(0, T - 6, W, VH - T + 6);
    const rg = ctx.createLinearGradient(0, T - 6, 0, T + 50); rg.addColorStop(0, 'rgba(226,222,190,.45)'); rg.addColorStop(1, 'rgba(226,222,190,0)'); ctx.fillStyle = rg; ctx.fillRect(0, T - 6, W, 56); // the misty sky mirrored at the back
    for (let i = 0; i < 180; i++) { const x = rnd() * W, y = T + rnd() * (VH - T); awWrap(x, 30, (x) => awSoft(x, y, 14 + rnd() * 20, 3 + rnd() * 3, rnd() < .5 ? '170,180,150' : '30,44,38', .25)); } // the mottle of reflections
    ctx.lineCap = 'round';
    for (const [col, n, lw] of [['rgba(255,240,206,.35)', 110, .9], ['rgba(20,30,26,.35)', 90, 1.1]]) { // level ripples laid in with a dry brush
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
      for (let i = 0; i < n; i++) { const x = rnd() * W, y = T + rnd() * (VH - T), l = (10 + rnd() * 40) * (.6 + (y - T) / 120); for (const ox of x + l > W ? [0, -W] : [0]) { ctx.moveTo(x + ox, y); ctx.lineTo(x + ox + l, y + (rnd() - .5)); } }
      ctx.stroke();
    }
    // mud flats and a sunken causeway of stepping stones through the shallows
    const mA = awWave(612, [[3, 6], [7, 3]]), mB = awWave(844, [[2, 7], [5, 3]]);
    for (let i = 0; i < 9; i++) { const x = i * W / 9 + rnd() * 60, w = 70 + rnd() * 70, y = T + 40 + rnd() * 50 + mA(x); awWR(x, w, rnd, (x, r) => {
      ctx.fillStyle = 'rgba(30,26,18,.35)'; ell(x + 2, y + 2, w * .55, w * .1); ctx.fill();
      ctx.fillStyle = '#5A5038'; ctx.beginPath(); for (let k = 0; k <= 20; k++) { const a = k / 20 * TAU, rr = 1 + (r() - .5) * .25; ctx.lineTo(x + Math.cos(a) * w * .5 * rr, y + Math.sin(a) * w * .085 * rr); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(30,26,18,.45)'; ctx.lineWidth = 1; ctx.stroke();
      for (let k = 0; k < 10; k++) dab(x + (r() - .5) * w * .8, y + (r() - .5) * w * .1, 3 + r() * 5, r() < .5 ? '#6A5E42' : '#4A422E', .6);
      ctx.fillStyle = 'rgba(255,236,200,.28)'; ell(x + w * .1, y - w * .04, w * .3, w * .02); ctx.fill(); // wet sheen
      for (let k = 0; k < 6; k++) dab(x + (r() - .5) * w * .7, y - w * .04, 1.4 + r() * 2, '#5E7A3E', .8);
    }); }
    for (let row = 0; row < 2; row++) for (const [x0, w0] of awRow(rnd, 60, 110)) awWR(x0 + w0 / 2, 30, rnd, (x, r) => { // the stepping stones
      if (r() < .25) return;
      const y = T + (row ? 82 : 48) + mB(x) + (r() - .5) * 10, sw = (12 + r() * 9) * (1 + row * .3), shh = sw * (.32 + r() * .08);
      ctx.fillStyle = 'rgba(14,20,18,.5)'; ell(x + 1, y + shh * .9, sw * 1.1, shh * .55); ctx.fill(); // the dark ring where it meets the water
      ctx.fillStyle = 'rgba(200,210,190,.25)'; ell(x, y + shh * 1.6, sw * .8, shh * .25); ctx.fill(); // its glint below
      ctx.fillStyle = '#4A4852'; lumpy(x, y + shh * .35, sw, shh * .8, r); ctx.fill(); // the wet flank
      const g = ctx.createLinearGradient(x - sw, y - shh, x + sw, y + shh); g.addColorStop(0, '#6E6A74'); g.addColorStop(.6, '#8E8A8C'); g.addColorStop(1, '#D8C8A6');
      ctx.fillStyle = g; lumpy(x, y, sw * .9, shh * .68, r); ctx.fill(); // the dry top, warm on the sun side
      ctx.fillStyle = 'rgba(255,244,220,.5)'; ell(x + sw * .35, y - shh * .2, sw * .3, shh * .18); ctx.fill();
      for (let k = 0; k < 4; k++) dab(x - sw * .4 + r() * sw * .5, y + shh * (r() * .3), 1.4 + r() * 2.4, SG_STONE.moss[Math.floor(r() * 3)], .9);
    });
    // lily pads: notched discs foreshortened by the low view, a few in flower
    for (let i = 0; i < 46; i++) { const x = rnd() * W, y = T + 8 + rnd() * (VH - T - 16), s = (4 + rnd() * 5) * (.7 + (y - T) / 110), a = rnd() * TAU, fl = rnd() < .16; awWrap(x, s * 2, (x) => {
      ctx.fillStyle = 'rgba(16,26,20,.45)'; ell(x + .8, y + 1.2, s * 1.05, s * .36); ctx.fill();
      ctx.fillStyle = rnd() < .5 ? '#3E6A3A' : '#4E7A40'; ctx.beginPath(); ctx.moveTo(x, y); ctx.ellipse(x, y, s, s * .34, 0, a, a + TAU - .5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(190,220,140,.55)'; ell(x + s * .3, y - s * .08, s * .45, s * .1); ctx.fill();
      if (fl) { for (let k = 0; k < 6; k++) { const pa = -Math.PI / 2 + (k - 2.5) * .45; ctx.fillStyle = k % 2 ? '#F2C8D4' : '#FFF0F2'; ell(x + Math.cos(pa) * s * .3, y - s * .2 + Math.sin(pa) * s * .12, s * .32, s * .14, pa); ctx.fill(); } dab(x, y - s * .28, s * .14, '#F6D870', 1); }
    }); }
    // the reed beds along the back edge, and the odd clump out in the water
    const rc = ['#3E4E2A', '#56683A', '#7A8A4A', '#A8AC64'];
    for (let x = 0; x < W; x += 30) awWR(x + rnd() * 20, 30, rnd, (x, r) => { if (Math.sin(x * .011) + Math.sin(x * .027 + 1) < -.3) return; reeds(x, T + 4 + r() * 4, 6 + Math.floor(r() * 12), 18 + r() * 26, r, rc); if (r() < .3) { ctx.fillStyle = '#3E3A30'; ell(x, T + 6, 10, 2.4); ctx.fill(); } });
    for (let i = 0; i < 5; i++) awWR(rnd() * W, 24, rnd, (x, r) => { const y = T + 30 + r() * 80; reeds(x, y, 8 + Math.floor(r() * 6), 18 + r() * 12, r, rc); ctx.strokeStyle = 'rgba(255,240,206,.35)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.ellipse(x, y + 1, 12, 2.4, 0, 0, TAU); ctx.stroke(); });
    for (let i = 0; i < 6; i++) awWR(rnd() * W, 16, rnd, (x, r) => { const y = T + 10 + r() * 16, w = 8 + r() * 8; // mossy boulders at the water's edge
      awFillPts([x - w, y, x - w * .8, y - w * .5, x - w * .2, y - w * .8, x + w * .5, y - w * .65, x + w, y - w * .1, x + w * .9, y], '#5E5C68');
      awFillPts([x - w * .2, y - w * .8, x + w * .5, y - w * .65, x + w, y - w * .1, x + w * .9, y, x + w * .15, y, x + w * .05, y - w * .4], '#D8C4A2', .6);
      dab(x - w * .5, y - w * .45, w * .35, '#4E6A3A', .9); dab(x - w * .1, y - w * .7, w * .2, '#7E9A50', .8);
      ctx.fillStyle = 'rgba(20,26,24,.5)'; ell(x, y, w * 1.1, 1.6); ctx.fill(); });
    const sh = ctx.createLinearGradient(0, VH - 34, 0, VH); sh.addColorStop(0, 'rgba(10,16,14,0)'); sh.addColorStop(1, 'rgba(10,16,14,.5)'); ctx.fillStyle = sh; ctx.fillRect(0, VH - 34, W, 34);
  }

  // live: mist drifting slowly over the water, and now and then a slow ring spreading where something stirred below
  function bossLive(camX, t) {
    for (let i = 0; i < 4; i++) { // mist banks, crossing the arena very slowly
      const span = VW + 400, x = ((i * 260 + t * (5 + i * 1.5) - camX * .2) % span + span) % span - 200, y = FLOOR_TOP + 6 + i * 22;
      ctx.save(); ctx.translate(x, y); ctx.scale(1, .16); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 180); g.addColorStop(0, 'rgba(200,210,196,.09)'); g.addColorStop(1, 'rgba(200,210,196,0)'); ctx.fillStyle = g; ctx.fillRect(-180, -180, 360, 360); ctx.restore();
    }
    const S = 260, off = ((-camX) % S + S) % S - S;
    ctx.lineWidth = .8;
    for (let x = off; x < VW + S; x += S) { // ripples
      const w = Math.floor((x + camX) / S + .5), per = 5 + zbHash(w) * 3, k = ((t + zbHash(w + 1) * per) % per) / per;
      const px = x + zbHash(w + 2) * 220, py = FLOOR_TOP + 20 + zbHash(w + 3) * 90;
      ctx.strokeStyle = `rgba(230,236,214,${.22 * (1 - k)})`; ctx.beginPath(); ctx.ellipse(px, py, 3 + k * 22, (3 + k * 22) * .26, 0, 0, TAU); ctx.stroke();
    }
    for (let x = ((-camX) % 210 + 210) % 210 - 210; x < VW + 210; x += 210) { // a few slow marsh-lights
      const w = Math.floor((x + camX) / 210 + .5), ph = zbHash(w + 7) * TAU, px = x + zbHash(w + 8) * 180 + Math.sin(t * .2 + ph) * 14, py = FLOOR_TOP - 40 + zbHash(w + 9) * 70 + Math.sin(t * .27 + ph) * 8, a = .25 + .2 * Math.sin(t * .6 + ph);
      ctx.fillStyle = `rgba(210,255,190,${a * .25})`; circle(px, py, 4.5); ctx.fill(); ctx.fillStyle = `rgba(240,255,220,${a})`; circle(px, py, 1); ctx.fill();
    }
  }

  // ---------- registration ----------
  THEMES.bloom2 = { name: 'thornwood dusk', sky: ['#141C24', '#24323A', '#5A5A4A', '#B08A5E'], sun: [0.74, 0.34, '240,186,120'], haze: '78,104,112',
    floorA: '#4A4630', floorB: '#1A1C12', path: '#6A5638', skyKind: 'none', liveFloor: bloom2Live,
    grade: { desat: .2, top: 'rgba(40,60,110,.5)', bot: 'rgba(230,150,80,.42)', vig: 'rgba(8,12,16,.68)' } };
  THEMES.bloomBoss = { name: 'sunken grove', sky: ['#3E4C5C', '#7E8E92', '#C8C4A6', '#ECDDB2'], sun: [0.64, 0.24, '255,228,176'], haze: '204,212,196',
    floorA: '#5A6A62', floorB: '#1E2A24', path: '#8E8A8C', liveFloor: bossLive,
    grade: { desat: .2, top: 'rgba(70,100,140,.45)', bot: 'rgba(220,180,110,.36)', vig: 'rgba(16,24,24,.62)' } };
  AW_FAR.bloom2 = bloom2Far; AW_MID.bloom2 = bloom2Mid; AW_FLOOR.bloom2 = bloom2Floor;
  AW_FAR.bloomBoss = bloomBossFar; AW_MID.bloomBoss = bloomBossMid; AW_FLOOR.bloomBoss = bloomBossFloor;
  window.ZB_ART = { bez, wiggle, tube, mossStrand, shaft, glowShrooms, rootArch, giantTrunk, farTrunk, toadstool, menhir, reeds, TH_BARK, TH_TOAD, SG_STONE, SG_OLD }; // (the end of each area paints with these: thresholds.js)
})();
