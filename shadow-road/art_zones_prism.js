'use strict';
// prism world: the new locales (approach area and boss room). Registers THEMES, AW_FAR, AW_MID and AW_FLOOR entries.
//   prism2    - The Inverted Gallery: an impossible gallery, a second world hanging upside down overhead, a checkered glass floor
//   prismBoss - The Wyrm's Nest: a crystal cathedral built from the ribs of something vast, open to the stars, a rose window of light
// Everything lives inside this closure so nothing collides with the other art files sharing the global scope.
(() => {
  const T = FLOOR_TOP;
  let roseC = null, nebC = null, roseX = 0, nestRibs = [], galleryCols = []; // kept from painting for the live sky and the floor's reflections
  const flipY = (yc, fn) => { ctx.save(); ctx.translate(0, 2 * yc); ctx.scale(1, -1); fn(); ctx.restore(); }; // the world hung upside down about y = yc
  const add = (fn) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
  const hsla = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
  const poly = (pts) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); };
  const spark = (x, y, s, col) => { ctx.fillStyle = col; awPath([x, y - s, x + s * .16, y - s * .16, x + s, y, x + s * .16, y + s * .16, x, y + s, x - s * .16, y + s * .16, x - s, y, x - s * .16, y - s * .16]); ctx.fill(); };
  const sideGrad = (x0, x1, P) => { // light across a rounded member, from the side the light comes from
    const g = ctx.createLinearGradient(x0, 0, x1, 0), L = AW_SUN < 0;
    g.addColorStop(0, L ? P.lit : P.dark); g.addColorStop(L ? .28 : .72, P.base); g.addColorStop(L ? .55 : .45, P.base); g.addColorStop(1, L ? P.dark : P.lit);
    return g;
  };
  const slab = (x, y, w, h, P) => { // a moulded block: rounded light across it, a lit top edge, a dark seat
    ctx.fillStyle = sideGrad(x, x + w, P); ctx.fillRect(x, y, w, h);
    ctx.fillStyle = P.lit; ctx.globalAlpha = .7; ctx.fillRect(x, y, w, Math.min(1.2, h * .3)); ctx.fillStyle = P.dark; ctx.globalAlpha = .55; ctx.fillRect(x, y + h - Math.min(1.2, h * .3), w, Math.min(1.2, h * .3)); ctx.globalAlpha = 1;
  };

  // ======================================================================================================
  // THE INVERTED GALLERY — architectural pieces
  // ======================================================================================================
  // a fluted marble column; its capital at `top`, its foot at `base`. o.cap / o.foot add the mouldings, o.brk breaks the top off
  function zColumn(x, top, base, w, P, o, rnd) {
    const cH = o.cap ? w * .95 : 0, fH = o.foot ? w * .62 : 0, s0 = top + cH, s1 = base - fH, tw = w * .84;
    // the shaft, tapering a little toward the top, its top edge ragged if broken
    const pts = [[x - w / 2, s1]];
    if (o.brk) { const n = 5; for (let k = 0; k <= n; k++) pts.push([x - tw / 2 + tw * k / n, s0 + (k % 2 ? 1 : -1) * w * (.12 + rnd() * .3) + (k === 0 || k === n ? w * .2 : 0)]); }
    else { pts.push([x - tw / 2, s0], [x + tw / 2, s0]); }
    pts.push([x + w / 2, s1]);
    poly(pts); ctx.fillStyle = sideGrad(x - w / 2, x + w / 2, P); ctx.fill();
    ctx.save(); poly(pts); ctx.clip(); // flutes: a shadowed groove with a lit lip beside it
    ctx.lineWidth = Math.max(.5, w * .05);
    for (let k = -2; k <= 2; k++) { const fx = x + k * w * .19; ctx.strokeStyle = P.dark; ctx.globalAlpha = .32; ctx.beginPath(); ctx.moveTo(fx, s0); ctx.lineTo(fx + k * .4, s1); ctx.stroke(); ctx.strokeStyle = P.lit; ctx.globalAlpha = .22; ctx.beginPath(); ctx.moveTo(fx - AW_SUN * w * .06, s0); ctx.lineTo(fx - AW_SUN * w * .06 + k * .4, s1); ctx.stroke(); }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 4; i++) dab(x + (rnd() - .5) * w * .7, s0 + rnd() * (s1 - s0), w * (.12 + rnd() * .12), rnd() < .5 ? P.lit : P.dark, .12); // the marble's clouding
    ctx.restore();
    if (o.brk) { ctx.fillStyle = P.dark; ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(pts[1][0], pts[1][1]); for (let k = 2; k < pts.length - 1; k++) ctx.lineTo(pts[k][0], pts[k][1]); for (let k = pts.length - 2; k >= 1; k--) ctx.lineTo(pts[k][0], pts[k][1] + 2); ctx.fill(); ctx.globalAlpha = 1; }
    if (o.cap) { // abacus, echinus with its two volutes, a gilt necking ring
      slab(x - w * .78, top, w * 1.56, w * .2, P);
      slab(x - w * .58, top + w * .2, w * 1.16, w * .32, P);
      for (const s of [-1, 1]) {
        const vx = x + s * w * .6, vy = top + w * .44, r = w * .23;
        ctx.fillStyle = s === -AW_SUN ? P.lit : P.base; circle(vx, vy, r); ctx.fill();
        ctx.strokeStyle = P.dark; ctx.lineWidth = Math.max(.5, w * .05); ctx.beginPath(); ctx.arc(vx, vy, r * .62, 0, Math.PI * 1.6); ctx.stroke(); ctx.fillStyle = P.dark; circle(vx, vy, r * .2); ctx.fill();
      }
      ctx.fillStyle = P.gold; ctx.fillRect(x - tw / 2 - .5, top + w * .56, tw + 1, w * .14); ctx.fillStyle = P.goldLit; ctx.globalAlpha = .8; ctx.fillRect(x - tw / 2 - .5, top + w * .56, tw + 1, w * .04); ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(30,18,50,.35)'; ctx.fillRect(x - tw / 2, top + w * .7, tw, w * .25); // the shadow under the capital
    }
    if (o.foot) { slab(x - w * .64, s1, w * 1.28, fH * .45, P); slab(x - w * .8, s1 + fH * .45, w * 1.6, fH * .55, P); }
  }
  // a round arch on two piers: coursed piers, imposts, a ring of voussoirs with a keystone, an entablature above
  function zArch(cx, base, ri, ph, P, rnd, o = {}) {
    const pw = ri * .42, ring = ri * .36, ro = ri + ring, sy = base - ph, N = 9;
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? cx - ri - pw : cx + ri;
      ctx.fillStyle = sideGrad(x0, x0 + pw, P); ctx.fillRect(x0, sy, pw, ph);
      ctx.strokeStyle = P.mortar; ctx.globalAlpha = .5; ctx.lineWidth = .7; ctx.beginPath();
      for (let y = base - 8, k = 0; y > sy + 3; y -= 8 + rnd() * 2, k++) { ctx.moveTo(x0, y); ctx.lineTo(x0 + pw, y); const jx = x0 + pw * (k % 2 ? .35 : .65); ctx.moveTo(jx, y); ctx.lineTo(jx, y - 8); }
      ctx.stroke(); ctx.globalAlpha = 1;
      slab(x0 - 2.5, sy - 5, pw + 5, 5, P); // the impost
      if (o.foot !== false) slab(x0 - 2, base - 6, pw + 4, 6, P);
    }
    const yc = sy - 5;
    for (let k = 0; k < N; k++) {
      const a0 = Math.PI + k * Math.PI / N, a1 = a0 + Math.PI / N, am = (a0 + a1) / 2, key = k === (N - 1) / 2 ? ring * .3 : 0;
      const lit = Math.max(0, -AW_SUN * -Math.cos(am) * .5 - Math.sin(am) * .4);
      ctx.beginPath(); ctx.arc(cx, yc, ro + key, a0, a1); ctx.arc(cx, yc, ri, a1, a0, true); ctx.closePath();
      ctx.fillStyle = awMix(awMix(P.base, P.dark, rnd() * .3), P.lit, Math.min(1, lit)); ctx.fill();
      ctx.strokeStyle = P.mortar; ctx.lineWidth = .8; ctx.stroke();
      if (key) { ctx.fillStyle = P.gold; ctx.beginPath(); ctx.arc(cx, yc, ro + key, a0 + .05, a1 - .05); ctx.arc(cx, yc, ro + key - 2.2, a1 - .05, a0 + .05, true); ctx.fill(); }
    }
    ctx.strokeStyle = 'rgba(30,18,50,.45)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(cx, yc, ri + 1.3, Math.PI, TAU); ctx.stroke(); // the soffit falls into shadow
    if (o.top) { // a cornice laid across the crown
      const ey = yc - ro - 9; slab(cx - ri - pw - 6, ey, (ri + pw + 6) * 2, 6, P); ctx.fillStyle = P.gold; ctx.fillRect(cx - ri - pw - 6, ey + 6, (ri + pw + 6) * 2, 1.4);
      ctx.fillStyle = P.base; ctx.globalAlpha = .95; ctx.beginPath(); ctx.moveTo(cx - ri - pw, ey + 7); ctx.lineTo(cx - ri - pw, yc); ctx.arc(cx, yc, ro, Math.PI, Math.PI * 1.32); ctx.lineTo(cx - ri - pw, ey + 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx + ri + pw, ey + 7); ctx.lineTo(cx + ri + pw, yc); ctx.arc(cx, yc, ro, 0, -Math.PI * .32, true); ctx.lineTo(cx + ri + pw, ey + 7); ctx.fill(); ctx.globalAlpha = 1;
    }
  }
  // a floating flight of stairs, rising to the right from (x, y): lit treads, shaded risers, a sloped soffit and a slender rail
  function zStair(x, y, n, sw, sh, P, rail = true) {
    const th = sh * 1.6, pts = [[x, y + th]];
    pts.push([x, y]); for (let i = 0; i < n; i++) { pts.push([x + i * sw, y - (i + 1) * sh], [x + (i + 1) * sw, y - (i + 1) * sh]); }
    pts.push([x + n * sw, y - n * sh + th], [x + sw * .5, y + th]);
    poly(pts); ctx.fillStyle = P.base; ctx.fill();
    const sof = ctx.createLinearGradient(0, y - n * sh, 0, y + th); sof.addColorStop(0, P.dark); sof.addColorStop(1, awMix(P.dark, P.base, .4));
    ctx.fillStyle = sof; ctx.globalAlpha = .8; awPath([x, y + th, x + n * sw, y - n * sh + th, x + n * sw, y - n * sh + th * .45, x, y + th * .45]); ctx.fill(); ctx.globalAlpha = 1;
    for (let i = 0; i < n; i++) {
      const tx = x + i * sw, ty = y - (i + 1) * sh;
      ctx.fillStyle = P.lit; ctx.globalAlpha = .85; ctx.fillRect(tx, ty, sw, 1.3); // the tread catches the light
      ctx.fillStyle = P.dark; ctx.globalAlpha = .3; ctx.fillRect(tx, ty + 1.3, sw * .22, sh - 1.3); ctx.globalAlpha = 1; // the riser's shadowed corner
    }
    if (rail) {
      ctx.strokeStyle = P.dark; ctx.lineWidth = .9; ctx.beginPath();
      for (let i = 0; i < n; i += 2) { const px = x + i * sw + sw * .5, py = y - (i + 1) * sh; ctx.moveTo(px, py); ctx.lineTo(px, py - sh * 2.2); }
      ctx.stroke(); ctx.strokeStyle = P.gold; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(x + sw * .5, y - sh * 3.2); ctx.lineTo(x + (n - .5) * sw, y - (n + 2.2) * sh); ctx.stroke();
    }
  }
  // an ornate gilt frame, floating; 'mirror' holds a pane of silvered glass reflecting another sky, 'empty' frames only the air
  function zFrame(x, y, w, h, rot, kind, oval, rnd, G) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const b = Math.min(w, h) * .15, outer = () => oval ? ell(0, 0, w / 2, h / 2) : ctx.rect(-w / 2, -h / 2, w, h), inner = () => oval ? ctx.ellipse(0, 0, w / 2 - b, h / 2 - b, 0, 0, TAU) : ctx.rect(-w / 2 + b, -h / 2 + b, w - b * 2, h - b * 2);
    if (kind === 'mirror') { // the glass: a paler sky with a little arch standing in it the right way up, and a streak of light
      ctx.save(); ctx.beginPath(); inner(); ctx.clip();
      const mg = ctx.createLinearGradient(0, -h / 2, 0, h / 2); mg.addColorStop(0, G.m0); mg.addColorStop(.62, G.m1); mg.addColorStop(1, G.m2); ctx.fillStyle = mg; ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.fillStyle = G.mHz; ctx.fillRect(-w / 2, h * .12, w, h); // a horizon inside the mirror
      ctx.fillStyle = G.mArch; const ar = w * .14; ctx.beginPath(); ctx.moveTo(-ar * 1.6, h * .14); ctx.lineTo(-ar * 1.6, -h * .02); ctx.arc(0, -h * .02, ar * 1.6, Math.PI, 0); ctx.lineTo(ar * 1.6, h * .14); ctx.lineTo(ar, h * .14); ctx.lineTo(ar, -h * .02); ctx.arc(0, -h * .02, ar, 0, Math.PI, true); ctx.lineTo(-ar, h * .14); ctx.fill();
      ctx.strokeStyle = 'rgba(255,250,255,.38)'; ctx.lineWidth = w * .07; ctx.beginPath(); ctx.moveTo(-w * .4, h * .1); ctx.lineTo(-w * .05, -h * .45); ctx.stroke(); ctx.lineWidth = w * .025; ctx.beginPath(); ctx.moveTo(-w * .2, h * .2); ctx.lineTo(w * .1, -h * .3); ctx.stroke();
      ctx.restore();
    }
    // the gilt moulding
    ctx.beginPath(); outer(); inner(); const gg = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    gg.addColorStop(0, G.goldLit); gg.addColorStop(.35, G.gold); gg.addColorStop(.7, G.goldDk); gg.addColorStop(1, G.gold); ctx.fillStyle = gg; ctx.fill('evenodd');
    ctx.strokeStyle = G.goldDk; ctx.lineWidth = .8; ctx.beginPath(); outer(); ctx.stroke(); ctx.beginPath(); inner(); ctx.stroke();
    // a row of beads round the middle of the moulding, lit on their upper sides
    const bw = w / 2 - b / 2, bh = h / 2 - b / 2, per = oval ? Math.PI * (bw + bh) : 2 * (bw + bh) * 2, nb = Math.floor(per / 3.6);
    for (let i = 0; i < nb; i++) {
      let px, py; const k = i / nb;
      if (oval) { const a = k * TAU; px = Math.cos(a) * bw; py = Math.sin(a) * bh; }
      else { const L = k * 4 * (bw + bh), W2 = bw * 2, H2 = bh * 2; if (L < W2) { px = -bw + L; py = -bh; } else if (L < W2 + H2) { px = bw; py = -bh + L - W2; } else if (L < W2 * 2 + H2) { px = bw - (L - W2 - H2); py = bh; } else { px = -bw; py = bh - (L - W2 * 2 - H2); } }
      ctx.fillStyle = G.goldDk; circle(px + .3, py + .3, b * .22); ctx.fill(); ctx.fillStyle = G.goldLit; circle(px - .15, py - .15, b * .16); ctx.fill();
    }
    if (!oval) for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { // corner rosettes
      const rx = cx * (w / 2 - b / 2), ry = cy * (h / 2 - b / 2);
      for (let p = 0; p < 5; p++) { const a = p / 5 * TAU + rot; dab(rx + Math.cos(a) * b * .45, ry + Math.sin(a) * b * .45, b * .38, p < 2 ? G.goldLit : G.gold, 1); }
      ctx.fillStyle = G.goldDk; circle(rx, ry, b * .25); ctx.fill();
    }
    // a shell crest above, and a pendant drop below
    const ty = -h / 2 - (oval ? -b * .2 : 0);
    ctx.fillStyle = G.gold; ctx.beginPath(); ctx.moveTo(-b * 1.6, ty + .5); ctx.arc(0, ty + .5, b * 1.6, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = G.goldDk; ctx.lineWidth = .6; ctx.beginPath(); for (let r = 0; r < 5; r++) { const a = Math.PI + (r + .5) / 5 * Math.PI; ctx.moveTo(0, ty + .5); ctx.lineTo(Math.cos(a) * b * 1.55, ty + .5 + Math.sin(a) * b * 1.55); } ctx.stroke();
    dab(-b * .5, ty - b * .7, b * .4, G.goldLit, .9);
    ctx.fillStyle = G.gold; circle(0, h / 2 + b * .2 - (oval ? b * .3 : 0), b * .55); ctx.fill(); dab(-b * .15, h / 2 - (oval ? b * .3 : 0), b * .25, G.goldLit, 1);
    ctx.restore();
  }
  // a little temple front, drawn the right way up (it is hung upside down by its caller)
  function zTemple(x, base, w, h, P, rnd) {
    const n = 4 + Math.floor(rnd() * 3), cw = w / (n * 1.8), top = base - h;
    slab(x - w / 2 - 4, base - 3, w + 8, 3, P); slab(x - w / 2 - 2, base - 6, w + 4, 3, P);
    for (let i = 0; i < n; i++) { const cx = x - w / 2 + cw + i * (w - cw * 2) / (n - 1); ctx.fillStyle = sideGrad(cx - cw / 2, cx + cw / 2, P); ctx.fillRect(cx - cw / 2, top + 7, cw, h - 13); slab(cx - cw * .8, top + 5, cw * 1.6, 2.5, P); }
    slab(x - w / 2 - 3, top, w + 6, 5.5, P);
    ctx.fillStyle = P.base; awPath([x - w / 2 - 4, top, x, top - h * .3, x + w / 2 + 4, top]); ctx.fill();
    ctx.fillStyle = P.lit; ctx.globalAlpha = .55; awPath(AW_SUN < 0 ? [x - w / 2 - 4, top, x, top - h * .3, x, top - h * .3 + 1.6, x - w / 2 + 1, top] : [x + w / 2 + 4, top, x, top - h * .3, x, top - h * .3 + 1.6, x + w / 2 - 1, top]); ctx.fill(); ctx.globalAlpha = 1;
  }
  // a domed tower, drawn the right way up
  function zDome(x, base, w, h, P) {
    const top = base - h;
    ctx.fillStyle = sideGrad(x - w / 2, x + w / 2, P); ctx.fillRect(x - w / 2, top + w * .5, w, h - w * .5);
    slab(x - w / 2 - 2, top + w * .5 - 2, w + 4, 3, P);
    ctx.fillStyle = sideGrad(x - w / 2, x + w / 2, P); ctx.beginPath(); ctx.arc(x, top + w * .5, w / 2, Math.PI, 0); ctx.fill();
    ctx.fillStyle = P.dark; ctx.fillRect(x - .8, top - w * .3, 1.6, w * .32); circle(x, top - w * .3, 1.6); ctx.fill();
    ctx.fillStyle = P.dark; ctx.globalAlpha = .5; for (let y = top + w * .7; y < base - 6; y += 9) ctx.fillRect(x - w * .12, y, w * .24, 5); ctx.globalAlpha = 1;
  }

  // ---------- the palettes ----------
  const MARBLE = { base: '#9C86B8', lit: '#FFE4D2', dark: '#261C4C', mortar: '#2E2448', gold: '#C9A04E', goldLit: '#FFE8A8' };
  const GILT = { gold: '#C29440', goldLit: '#FFE6A0', goldDk: '#5E3E1C', m0: '#E6D6F0', m1: '#A898CC', m2: '#7C6CA6', mHz: 'rgba(70,56,110,.35)', mArch: 'rgba(80,64,124,.55)' };

  // ======================================================================================================
  // THE INVERTED GALLERY — far layer: a second world hangs upside down from the sky; a pale arcade on the horizon
  // ======================================================================================================
  function galleryFar(rnd, th, f) {
    AW_SUN = -1;
    for (let i = 0; i < 50; i++) { ctx.fillStyle = `rgba(255,246,255,${.2 + rnd() * .4})`; circle(rnd() * AW_W, 112 + rnd() * 50, rnd() * .9 + .3); ctx.fill(); }
    add(() => { for (let i = 0; i < 9; i++) { const x = rnd() * AW_W, y = 130 + rnd() * 70, r = 80 + rnd() * 70; awWrap(x, r, (x) => awSoft(x, y, r, r * .4, ['255,170,215', '150,200,255', '255,220,160'][i % 3], .16)); } });
    // the hanging world: an upside-down country, its ground for our ceiling
    const cP = { base: '#6A5C98', lit: '#E8BED2', dark: '#3C3268', mortar: '#342A5C', gold: '#B0909E', goldLit: '#E8CCD0' };
    flipY(119, () => {
      awRange(rnd, { n: 7, base: 142, hMin: 6, hMax: 30, col: '#463A78', lit: '#9A80BE', litA: .5, jag: 8, steps: 3, shade: 'rgba(40,30,80,.3)' });
    });
    const cw = awWave(311, [[3, 4], [8, 2]]), cy = (x) => 118 + cw(x); // where the hanging world's ground meets the air
    ctx.fillStyle = '#504384'; ctx.beginPath(); ctx.moveTo(0, 0); for (let x = 0; x <= AW_W; x += 8) ctx.lineTo(x, cy(x)); ctx.lineTo(AW_W, 0); ctx.fill();
    for (let x = 0; x < AW_W; x += 4) dab(x, cy(x) - 4 - rnd() * 8, 2.5 + rnd() * 3, rnd() < .4 ? '#6A5A9C' : '#3A2E6A', .9);
    { const rg = ctx.createLinearGradient(0, 96, 0, 116); rg.addColorStop(0, 'rgba(240,170,170,0)'); rg.addColorStop(1, 'rgba(240,170,170,.5)'); ctx.save(); ctx.beginPath(); ctx.moveTo(0, 0); for (let x = 0; x <= AW_W; x += 8) ctx.lineTo(x, cy(x)); ctx.lineTo(AW_W, 0); ctx.clip(); ctx.fillStyle = rg; ctx.fillRect(0, 90, AW_W, 30); ctx.restore(); }
    ctx.fillStyle = '#F4C4B4'; ctx.globalAlpha = .8; ctx.beginPath(); ctx.moveTo(0, cy(0)); for (let x = 0; x <= AW_W; x += 8) ctx.lineTo(x, cy(x)); for (let x = AW_W; x >= 0; x -= 8) ctx.lineTo(x, cy(x) - 1.6); ctx.fill(); ctx.globalAlpha = 1; // its lit rim
    // its buildings, hanging from it head-down: temple fronts, domed towers, an arcade, a stray staircase
    for (let i = 0; i < 4; i++) { const x = 90 + i * 320 + rnd() * 80, w = 46 + rnd() * 26; awWR(x, w, rnd, (x, r) => flipY(cy(x) / 2 + .5, () => zTemple(x, 0, w, 30 + r() * 12, cP, r))); }
    for (let i = 0; i < 5; i++) { const x = 30 + i * 256 + rnd() * 90, w = 10 + rnd() * 8, h = 34 + rnd() * 30; awWR(x, w, rnd, (x) => flipY(cy(x) / 2 + .5, () => zDome(x, 0, w, h, cP))); }
    for (let i = 0; i < 6; i++) { const x = rnd() * AW_W; awWR(x, 20, rnd, (x, r) => flipY(cy(x) / 2 + 1, () => awCluster(x, 0, 12 + r() * 12, [190, 280, 320][i % 3], r, 44))); }
    // a haze between us and the hanging world
    const hz = ctx.createLinearGradient(0, 84, 0, 160); hz.addColorStop(0, `rgba(${th.haze},.22)`); hz.addColorStop(1, `rgba(${th.haze},0)`); ctx.fillStyle = hz; ctx.fillRect(0, 0, AW_W, 160);
    ctx.fillStyle = `rgba(${th.haze},.15)`; ctx.fillRect(0, 0, AW_W, 84);
    // stairs adrift in the air between the two floors, at angles that cannot all be right
    const sP = { base: '#8A7AB2', lit: '#F0D4E4', dark: '#4A3E78', gold: '#C8A8B0' };
    for (let i = 0; i < 4; i++) { const x = 120 + i * 320 + rnd() * 100, y = 150 + rnd() * 34, rot = (rnd() - .5) * .9, flip = i % 2;
      awWR(x, 60, rnd, (x) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); if (flip) ctx.scale(1, -1); zStair(-30, 0, 6, 9, 5.5, sP, true); ctx.restore(); }); }
    hazeBand(f, th.haze, 150, T, .22);
    // the far gallery: a two-storey arcade on the horizon, broken off here and there into columns that stop in the air
    const aTop = 176, aBase = 214, bay = 40;
    ctx.fillStyle = '#62528E'; ctx.beginPath(); ctx.rect(0, aTop, AW_W, aBase - aTop);
    for (let x = 0; x < AW_W; x += bay) { const x0 = x + 8, x1 = x + bay - 8, sp = aBase - 12; ctx.moveTo(x0, aBase); ctx.lineTo(x0, sp); ctx.arc((x0 + x1) / 2, sp, (x1 - x0) / 2, Math.PI, 0); ctx.lineTo(x1, aBase); ctx.closePath(); }
    ctx.fill('evenodd');
    ctx.fillStyle = '#F4C0A8'; ctx.globalAlpha = .6; for (let x = 0; x < AW_W; x += bay) ctx.fillRect(x + 7, aTop + 14, 1.4, aBase - aTop - 14); ctx.fillRect(0, aTop, AW_W, 1.2); ctx.globalAlpha = 1;
    for (let x = 0; x < AW_W; x += bay) { // the upper storey: some bays whole, some only their columns, some gone
      const k = Math.floor(x / bay), r = Math.abs(Math.sin(k * 7.3 + 1)) * 1000 % 1;
      if (r < .55) { ctx.fillStyle = '#62528E'; ctx.beginPath(); ctx.rect(x, aTop - 22, bay, 22); ctx.moveTo(x + 12, aTop); ctx.lineTo(x + 12, aTop - 10); ctx.arc(x + 20, aTop - 10, 8, Math.PI, 0); ctx.lineTo(x + 28, aTop); ctx.closePath(); ctx.fill('evenodd');
        ctx.fillStyle = '#F4C0A8'; ctx.globalAlpha = .55; ctx.fillRect(x, aTop - 22, bay, 1.1); ctx.fillRect(x + 11, aTop - 18, 1.2, 18); ctx.globalAlpha = 1; }
      else if (r < .85) { ctx.fillStyle = '#62528E'; const ch = 10 + r * 30; ctx.fillRect(x + 4, aTop - ch, 4, ch); ctx.fillRect(x + 2, aTop - ch - 2, 8, 2.5); ctx.fillStyle = '#F4C0A8'; ctx.globalAlpha = .55; ctx.fillRect(x + 4, aTop - ch, 1.2, ch); ctx.globalAlpha = 1; }
    }
    hazeBand(f, th.haze, 176, T, .26);
    ridge(226, 4, .01, '#7E70A4', 9);
    hazeBand(f, th.haze, 205, T, .3);
  }

  // ---------- mid layer: arches and stairs hung from the sky, columns that stop in the air, gilt frames and mirrors adrift ----------
  function galleryMid(rnd) {
    AW_SUN = -1;
    const P = MARBLE, Pd = { base: '#6E5C9E', lit: '#F4C8C0', dark: '#201840', mortar: '#1E1638', gold: '#B89048', goldLit: '#F2D898' };
    // upside-down arches whose piers come down out of the sky
    for (let i = 0; i < 2; i++) { const x = 330 + i * 640 + rnd() * 80; awWR(x, 70, rnd, (x, r) => flipY(135, () => zArch(x, T + 10, 32 + r() * 6, 76, Pd, r, { foot: false }))); }
    // a staircase hanging head-down from a pier in the sky
    for (let i = 0; i < 2; i++) { const x = 40 + i * 640 + rnd() * 80; awWR(x + 48, 70, rnd, (xx) => {
      const x = xx - 48; ctx.fillStyle = sideGrad(x - 6, x + 12, Pd); ctx.fillRect(x - 6, 0, 18, 92); slab(x - 9, 90, 24, 5, Pd);
      flipY(150, () => zStair(x, T - 36, 8, 12, 7.5, Pd, true));
    }); }
    // columns hanging from nowhere, their capitals pointing at the floor
    const cols = []; galleryCols = [];
    for (let i = 0; i < 3; i++) { const x = 200 + i * 427 + rnd() * 60, w = 12 + rnd() * 4, end = 112 + rnd() * 26; cols.push([x, w]); awWR(x, w, rnd, (x, r) => flipY(100, () => zColumn(x, 200 - end, 160, w, Pd, { cap: true }, r))); }
    // columns rising from the floor and simply stopping: whole, or broken with their drums floating above the break
    for (let i = 0; i < 4; i++) { const x = 100 + i * 320 + rnd() * 70, w = 15 + rnd() * 5, top = 118 + rnd() * 30, brk = i % 2 === 1; cols.push([x, w * 1.4]); galleryCols.push([x, w, top]);
      awWR(x, w * 1.2, rnd, (x, r) => {
        zColumn(x, top, T + 2, w, P, { cap: !brk, foot: true, brk }, r);
        if (brk) for (let k = 0; k < 3; k++) { const dy = top - 12 - k * (w * .9 + 6) - r() * 4, dw = w * .84; ctx.save(); ctx.translate(x + (r() - .5) * 6, dy); ctx.rotate((r() - .5) * .35); zColumn(0, -w * .45, w * .45, dw, P, {}, r); ctx.restore(); }
        for (let k = 0; k < 5; k++) dab(x + (r() - .5) * w * 2.4, T - 1, 2 + r() * 2.5, r() < .5 ? '#4A3E72' : '#7A6CA4', .9);
      }); }
    // floating frames and mirrors, hung in the gaps between the columns
    for (let i = 0; i < 6; i++) {
      let x = i * 213 + 60 + rnd() * 110; const y = 112 + rnd() * 62, w = 26 + rnd() * 18, h = 34 + rnd() * 20, rot = (rnd() - .5) * .4, kind = ['mirror', 'empty', 'mirror', 'empty', 'empty', 'mirror'][i], oval = i === 2 || i === 4, fw = Math.max(w, h) * .8;
      for (let n = 0; n < 12 && cols.some(([cx, cw]) => { const d = Math.abs(((x - cx) % AW_W + AW_W * 1.5) % AW_W - AW_W / 2); return d < w / 2 + cw + 4; }); n++) x += 14;
      add(() => awWrap(x, fw * 1.6, (x) => awSoft(x, y + 4, fw * 1.4, fw * 1.1, kind === 'mirror' ? '230,200,255' : '255,210,170', .18)));
      awWR(x, fw, rnd, (x, r) => zFrame(x, y, w, h, rot, kind, oval, r, GILT));
    }
    // a pedestal with crystals, and low plinths along the foot of the gallery
    for (let i = 0; i < 3; i++) { const x = 260 + i * 427 + rnd() * 80; awWR(x, 30, rnd, (x, r) => { slab(x - 12, T - 22, 24, 22, P); slab(x - 15, T - 26, 30, 4, P); ctx.fillStyle = P.gold; ctx.fillRect(x - 12, T - 21, 24, 1.2); awCluster(x, T - 25, 16 + r() * 10, [190, 300, 50][i], r, 56); }); }
    for (let i = 0; i < 10; i++) awWR(rnd() * AW_W, 20, rnd, (x, r) => awCluster(x, T + 2, 9 + r() * 12, [190, 280, 320, 170][i % 4], r, 50));
  }

  // ---------- floor: a checkered pavement of marble and black glass, laid on the slant, mirroring the hanging world ----------
  function galleryFloor(rnd, th) {
    const N = 32, CW = AW_W / N, S = -.5;
    ctx.fillStyle = '#16112A'; ctx.fillRect(0, T - 1, AW_W, VH - T + 1);
    const rows = []; for (let y = T + 2, h = 7.5; y < VH; y += h, h *= 1.16) rows.push([y, h]);
    rows.forEach(([y0, h], r) => {
      const y1 = y0 + h, ox0 = (y0 - T) * S, ox1 = (y1 - T) * S, fog = 1 - r / rows.length;
      for (let c = -4; c < N + 4; c++) {
        const cm = ((c % N) + N) % N, cr = mulberry(cm * 97 + r * 1013 + 7), light = (c + r) % 2 === 0;
        const xa = c * CW + ox0, xb = c * CW + ox1, g = .6;
        const cell = [[xa + g, y0 + g], [xa + CW - g, y0 + g], [xb + CW - g, y1 - g], [xb + g, y1 - g]];
        if (Math.max(xa, xb) + CW < -2 || Math.min(xa, xb) > AW_W + 2) continue;
        poly(cell);
        const gr = ctx.createLinearGradient(0, y0, 0, y1);
        if (light) { const l = 22 + fog * 12 + cr() * 4; gr.addColorStop(0, hsla(312, 18, l + 7)); gr.addColorStop(1, hsla(290, 20, l - 6)); }
        else { const l = 4 + fog * 3; gr.addColorStop(0, hsla(242, 42, l + 5)); gr.addColorStop(1, hsla(238, 46, l)); }
        ctx.fillStyle = gr; ctx.fill();
        ctx.save(); poly(cell); ctx.clip();
        if (light) { // clouding and veins in the marble
                    ctx.strokeStyle = 'rgba(80,60,120,.4)'; ctx.lineWidth = .6; ctx.beginPath(); let vx = xa + CW * cr(), vy = y0; ctx.moveTo(vx, vy);
          for (let k = 0; k < 3; k++) { const nx = vx + (cr() - .3) * CW * .5, ny = vy + h * .4; ctx.quadraticCurveTo(vx + (cr() - .5) * 8, (vy + ny) / 2, nx, ny); vx = nx; vy = ny; } ctx.stroke();
          ctx.strokeStyle = 'rgba(255,245,255,.35)'; ctx.lineWidth = .4; ctx.stroke();
        } else { // the black glass holds the sky: a rosy horizon, and the hanging world's pale towers, right way up
          const rg = ctx.createLinearGradient(0, y0, 0, y1); rg.addColorStop(0, `rgba(230,170,200,${.16 * fog})`); rg.addColorStop(1, 'rgba(230,170,200,0)'); ctx.fillStyle = rg; ctx.fillRect(Math.min(xa, xb), y0, CW + Math.abs(ox1 - ox0), h);
          if (cr() < .5) { const rx = Math.min(xa, xb) + CW * (.2 + cr() * .6); ctx.fillStyle = `rgba(200,180,240,${.1 + fog * .08})`; ctx.fillRect(rx, y0, 2 + cr() * 3, h * .8); }
          if (cr() < .25) spark(xa + CW * cr(), y0 + h * cr(), 1.4, 'rgba(255,240,255,.55)');
        }
        ctx.restore();
        ctx.fillStyle = light ? 'rgba(255,244,255,.45)' : 'rgba(190,170,255,.28)'; ctx.fillRect(xa + 1, y0 + .7, CW - 2, .8); // the bevel catches the light
      }
    });
    add(() => { // the floor mirrors the gallery: pale streaks under the columns, a rosy wash at the back
      const wg = ctx.createLinearGradient(0, T, 0, T + 60); wg.addColorStop(0, 'rgba(220,150,200,.16)'); wg.addColorStop(1, 'rgba(220,160,200,0)'); ctx.fillStyle = wg; ctx.fillRect(0, T, AW_W, 60);
      for (let i = 0; i < 12; i++) { const x = rnd() * AW_W, w = 6 + rnd() * 12, L = 40 + rnd() * 50; awWrap(x, w, (x) => { const g = ctx.createLinearGradient(0, T, 0, T + L); g.addColorStop(0, i % 3 ? 'rgba(200,180,240,.16)' : 'rgba(255,220,150,.14)'); g.addColorStop(1, 'rgba(200,180,240,0)'); ctx.fillStyle = g; ctx.fillRect(x - w / 2, T, w, L); }); }
    });
    // a gilt border along the back of the pavement
    ctx.fillStyle = '#5E3E1C'; ctx.fillRect(0, T - 1, AW_W, 3.4); ctx.fillStyle = '#C29440'; ctx.fillRect(0, T - 1, AW_W, 2); ctx.fillStyle = '#FFE6A0'; ctx.globalAlpha = .7; ctx.fillRect(0, T - 1, AW_W, .7); ctx.globalAlpha = 1;
    // things lying at the back: a toppled column drum, a fallen frame, crystals
    for (let i = 0; i < 3; i++) awWR(150 + i * 427 + rnd() * 100, 30, rnd, (x, r) => { const w = 22 + r() * 10, d = 13; ctx.fillStyle = sideGrad(x - w / 2, x + w / 2, MARBLE); ctx.fillRect(x - w / 2, T - d, w, d); ctx.fillStyle = 'rgba(40,30,70,.35)'; for (let k = 1; k < 4; k++) ctx.fillRect(x - w / 2, T - d + k * d / 4, w, .7);
      ctx.fillStyle = '#D8C8E8'; ell(x + w / 2, T - d / 2, 3.2, d / 2); ctx.fill(); ctx.strokeStyle = 'rgba(80,60,120,.6)'; ctx.lineWidth = .6; ell(x + w / 2, T - d / 2, 2, d / 3); ctx.stroke(); });
    for (let i = 0; i < 2; i++) awWR(400 + i * 640 + rnd() * 80, 26, rnd, (x, r) => zFrame(x, T - 9, 30, 20, -.15 + r() * .1, 'empty', false, r, GILT));
    for (let i = 0; i < 10; i++) awWR(rnd() * AW_W, 22, rnd, (x, r) => awCluster(x, T + 1, 8 + r() * 12, [190, 280, 320, 50][i % 4], r, 54));
    const sh = ctx.createLinearGradient(0, VH - 36, 0, VH); sh.addColorStop(0, 'rgba(10,6,20,0)'); sh.addColorStop(1, 'rgba(10,6,20,.45)'); ctx.fillStyle = sh; ctx.fillRect(0, VH - 36, AW_W, 36);
  }

  // ======================================================================================================
  // THE WYRM'S NEST — a cathedral of crystal ribs, open to the stars, a rose window burning at its heart
  // ======================================================================================================
  
  // one rib of the great cage: a tapering bow of bone-crystal from (x0, y0) bending through (cx, cy) to its tip at (x1, y1)
  function zRib(x0, y0, cx, cy, x1, y1, w0, w1, B, rnd, segs = 5) {
    const N = 28, L = [], R = [], mid = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, u = 1 - t, x = u * u * x0 + 2 * u * t * cx + t * t * x1, y = u * u * y0 + 2 * u * t * cy + t * t * y1;
      const dx = 2 * u * (cx - x0) + 2 * t * (x1 - cx), dy = 2 * u * (cy - y0) + 2 * t * (y1 - cy), d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
      const w = (w0 + (w1 - w0) * t) * (1 + .35 * Math.sin(Math.PI * t)) * (i === N ? .15 : 1);
      L.push([x + nx * w / 2, y + ny * w / 2]); R.push([x - nx * w / 2, y - ny * w / 2]); mid.push([x, y, nx, ny, w]);
    }
    const outline = L.concat(R.slice().reverse());
    poly(outline); ctx.fillStyle = B.dark; ctx.fill();
    // the lit face: the half of the bow that faces the light (the outer, upper side), with a bright crest along it
    const lit = L.concat(mid.slice().reverse().map(([x, y]) => [x, y]));
    poly(lit); const lg = ctx.createLinearGradient(x0, y0, x1, y1); lg.addColorStop(0, B.lit); lg.addColorStop(.5, B.base); lg.addColorStop(1, awMix(B.base, B.dark, .4)); ctx.fillStyle = lg; ctx.fill();
    ctx.save(); poly(outline); ctx.clip();
    for (let i = 2; i < N - 2; i += 2) { const [x, y, nx, ny, w] = mid[i]; dab(x + nx * w * .25, y + ny * w * .25, w * .22, rnd() < .5 ? B.lit : B.base, .25); }
    add(() => { // a vein of light deep in the crystal
      ctx.strokeStyle = B.core; ctx.lineWidth = Math.max(1.2, w0 * .12); ctx.globalAlpha = .55; ctx.beginPath(); mid.forEach(([x, y, nx, ny, w], i) => { const px = x - nx * w * .12, py = y - ny * w * .12; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.stroke();
      ctx.lineWidth = Math.max(.6, w0 * .04); ctx.globalAlpha = .8; ctx.stroke();
    });
    // facets: fine slanted fractures, and the joints where the rib is made of segments
    ctx.strokeStyle = B.edge; ctx.lineWidth = .7; ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]); L.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.stroke(); ctx.globalAlpha = 1;
    for (let s = 1; s < segs; s++) {
      const i = Math.round(s / segs * N), [x, y, nx, ny, w] = mid[i];
      ctx.strokeStyle = B.dark; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x + nx * w * .55, y + ny * w * .55); ctx.lineTo(x - nx * w * .55, y - ny * w * .55); ctx.stroke();
      ctx.strokeStyle = B.lit; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(x + nx * w * .5 + 1.2, y + ny * w * .5 + 1.2); ctx.lineTo(x + 1.2, y + 1.2); ctx.stroke();
    }
    ctx.restore();
    for (let s = 1; s < segs; s++) { const i = Math.round(s / segs * N), [x, y, nx, ny, w] = mid[i]; ctx.fillStyle = B.base; ell(x + nx * w * .55, y + ny * w * .55, w * .18, w * .14, Math.atan2(ny, nx)); ctx.fill(); ctx.fillStyle = B.lit; ctx.globalAlpha = .7; circle(x + nx * w * .6, y + ny * w * .6, w * .07); ctx.fill(); ctx.globalAlpha = 1; } // knuckles at the joints
    return mid;
  }
  // a shed scale: a rounded shield of iridescent crystal, the colors sliding across it
  function zScale(x, y, s, rot, hue, a = 1, flat = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(1, flat); ctx.rotate(rot); ctx.globalAlpha = a;
    const path = () => { ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(s * .95, -s * .7, s * .8, s * .1); ctx.quadraticCurveTo(s * .5, s * .85, 0, s); ctx.quadraticCurveTo(-s * .5, s * .85, -s * .8, s * .1); ctx.quadraticCurveTo(-s * .95, -s * .7, 0, -s); ctx.closePath(); };
    path(); const g = ctx.createLinearGradient(-s, -s, s, s); g.addColorStop(0, hsla(hue, 45, 72)); g.addColorStop(.45, hsla(hue + 60, 36, 44)); g.addColorStop(1, hsla(hue + 130, 40, 24)); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = .9; ctx.strokeStyle = 'rgba(20,10,30,.8)'; ctx.stroke();
    ctx.strokeStyle = hsla(hue + 30, 80, 88, .7); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(0, -s * .8); ctx.lineTo(0, s * .8); ctx.moveTo(-s * .55, -s * .3); ctx.quadraticCurveTo(-s * .2, -s * .65, 0, -s * .8); ctx.stroke();
    ctx.restore(); ctx.globalAlpha = 1;
  }
  const BONE = { base: '#9C8CC0', lit: '#F0E4F4', dark: '#3A2E5C', edge: '#FFF6FF', core: '#9FE8F0' };
  const BONE_FAR = { base: '#5E5288', lit: '#A898C8', dark: '#3A3062', edge: '#C8B8E8', core: '#7FB8D8' };

  // the rose window, painted once into its own canvas and hung in the live sky (so it stays put while the ribs slide past)
  function buildRose() {
    const S = 180, R = 72, [c, g] = makeLayer(S, S), old = ctx; ctx = g; ctx.translate(S / 2, S / 2);
    add(() => softDab(0, 0, R * 1.25, '255,190,230', .35));
    const hues = [330, 280, 200, 45, 300, 180];
    ctx.fillStyle = '#1E1634'; circle(0, 0, R); ctx.fill(); // the stone disc behind the glass
    const pane = (pts, h, l) => { poly(pts); const pg = ctx.createRadialGradient(0, 0, 4, 0, 0, R); pg.addColorStop(0, hsla(h, 70, l + 22)); pg.addColorStop(1, hsla(h, 60, l)); ctx.fillStyle = pg; ctx.fill(); };
    // the outer ring of twenty-four lancets, then twelve petals, then the oculus
    for (let i = 0; i < 24; i++) { const a0 = i / 24 * TAU, a1 = (i + 1) / 24 * TAU, r0 = R * .7, r1 = R * .93; pane([[Math.cos(a0 + .02) * r0, Math.sin(a0 + .02) * r0], [Math.cos(a0 + .03) * r1, Math.sin(a0 + .03) * r1], [Math.cos((a0 + a1) / 2) * (r1 + 2), Math.sin((a0 + a1) / 2) * (r1 + 2)], [Math.cos(a1 - .03) * r1, Math.sin(a1 - .03) * r1], [Math.cos(a1 - .02) * r0, Math.sin(a1 - .02) * r0]], hues[i % 6], 34); }
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, px = Math.cos(a) * R * .45, py = Math.sin(a) * R * .45; ctx.save(); ctx.translate(px, py); ctx.rotate(a);
      ell(0, 0, R * .2, R * .11); const pg = ctx.createRadialGradient(-R * .05, 0, 1, 0, 0, R * .2); pg.addColorStop(0, hsla(hues[(i + 2) % 6], 75, 72)); pg.addColorStop(1, hsla(hues[(i + 2) % 6], 60, 38)); ctx.fillStyle = pg; ctx.fill(); ctx.restore(); }
    const og = ctx.createRadialGradient(0, 0, 0, 0, 0, R * .22); og.addColorStop(0, '#FFF4E0'); og.addColorStop(.5, '#F4C88A'); og.addColorStop(1, '#B85A8A'); ctx.fillStyle = og; circle(0, 0, R * .22); ctx.fill();
    // the tracery: stone mullions, rings and cusps, lit from the top
    ctx.lineCap = 'round';
    const stone = (w, fn) => { ctx.strokeStyle = '#2A2040'; ctx.lineWidth = w + 1.4; ctx.beginPath(); fn(); ctx.stroke(); ctx.strokeStyle = '#8A7AA8'; ctx.lineWidth = w; ctx.beginPath(); fn(); ctx.stroke(); };
    stone(2.2, () => { for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; ctx.moveTo(Math.cos(a) * R * .7, Math.sin(a) * R * .7); ctx.lineTo(Math.cos(a) * R * .95, Math.sin(a) * R * .95); } });
    stone(1.6, () => { for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, px = Math.cos(a) * R * .45, py = Math.sin(a) * R * .45; ctx.moveTo(px + Math.cos(a) * R * .2, py + Math.sin(a) * R * .2); ctx.ellipse(px, py, R * .2, R * .11, a, 0, TAU); } });
    stone(2.6, () => { ctx.moveTo(R * .7, 0); ctx.arc(0, 0, R * .7, 0, TAU); ctx.moveTo(R * .24, 0); ctx.arc(0, 0, R * .24, 0, TAU); });
    // the heavy outer moulding
    ctx.lineWidth = 8; ctx.strokeStyle = '#2A2040'; circle(0, 0, R + 1); ctx.stroke(); ctx.lineWidth = 6; const mg = ctx.createLinearGradient(0, -R, 0, R); mg.addColorStop(0, '#C8B4DC'); mg.addColorStop(.5, '#6E5E92'); mg.addColorStop(1, '#3A2E58'); ctx.strokeStyle = mg; circle(0, 0, R + 1); ctx.stroke();
    for (let i = 0; i < 32; i++) { const a = i / 32 * TAU; dab(Math.cos(a) * (R + 1), Math.sin(a) * (R + 1), 1.6, Math.sin(a) < -.2 ? '#F0E0F4' : '#4E4070', .7); }
    add(() => { softDab(0, 0, R * .5, '255,230,200', .35); softDab(0, 0, R * .9, '230,160,255', .15); });
    ctx = old;
    paintLayer(c, { ink: '#140C20', line: .55, lw: .9, brush: .7, hatch: 0, seed: 11 });
    return c;
  }
  // a swirl of nebula, also painted once, that turns very slowly behind the window
  function buildNebula(rnd) {
    const S = 420, [c, g] = makeLayer(S, S), old = ctx; ctx = g; ctx.translate(S / 2, S / 2);
    add(() => {
      for (let arm = 0; arm < 3; arm++) for (let i = 0; i < 16; i++) { const k = i / 16, a = arm / 3 * TAU + k * 2.6, d = 30 + k * 160; softDab(Math.cos(a) * d, Math.sin(a) * d * .8, 40 + k * 30, ['150,80,200', '200,70,140', '60,120,200'][arm], .2 * (1 - k * .6)); }
      softDab(0, 0, 90, '255,190,220', .22);
    });
    ctx = old; return c;
  }
  function nestFar(rnd, th, f) {
    AW_SUN = 1;
    retire(roseC); retire(nebC); roseC = buildRose(); nebC = buildNebula(rnd);
    for (let i = 0; i < 240; i++) { ctx.fillStyle = `rgba(255,248,255,${.2 + rnd() * .7})`; circle(rnd() * AW_W, rnd() * 200, rnd() * 1.1 + .25); ctx.fill(); }
    add(() => {
      for (let i = 0; i < 14; i++) { const x = rnd() * AW_W, y = 40 + rnd() * 150, s = 2.5 + rnd() * 3; awWrap(x, 8, (x) => spark(x, y, s, 'rgba(255,240,255,.8)')); }
      for (let i = 0; i < 8; i++) { const x = rnd() * AW_W, y = 60 + rnd() * 110, r = 80 + rnd() * 90; awWrap(x, r, (x) => awSoft(x, y, r, r * .5, ['90,60,170', '150,60,140', '50,90,170'][i % 3], .22)); }
    });
    // the far side of the cage: hazy ribs bowing the other way, rooted in a crystal shore
    for (let i = 0; i < 8; i++) { const x = i * 160 + rnd() * 30; awWR(x, 140, rnd, (x, r) => zRib(x, 66, x - 120, 92, x - 92, 214, 13, 5, BONE_FAR, r, 4)); }
    { const hg = ctx.createLinearGradient(0, 90, 0, T); hg.addColorStop(0, `rgba(${th.haze},0)`); hg.addColorStop(1, `rgba(${th.haze},.3)`); ctx.fillStyle = hg; ctx.fillRect(0, 90, AW_W, T - 90); }
    // the far spine of the beast, a chain of vertebrae against the stars
    for (let x = 0; x < AW_W; x += 20) { const y = 66 + Math.sin(x * TAU / AW_W * 2) * 3; ctx.fillStyle = BONE_FAR.dark; ell(x + 10, y, 10, 6); ctx.fill(); ctx.fillStyle = BONE_FAR.base; ell(x + 10, y - 1.5, 8, 3.5); ctx.fill(); ctx.fillStyle = BONE_FAR.dark; awPath([x + 7, y - 4, x + 10, y - 16, x + 13, y - 4]); ctx.fill(); }
    hazeBand(f, th.haze, 120, T, .35);
    awRange(rnd, { n: 13, base: 228, hMin: 6, hMax: 34, col: '#241C44', lit: '#5A4A92', litA: .55, jag: 6, steps: 2, vDepth: .35, gully: 'rgba(170,230,255,.15)' });
    for (let i = 0; i < 8; i++) awWR(rnd() * AW_W, 30, rnd, (x, r) => awCluster(x, 224, 14 + r() * 18, [190, 280, 320, 200][i % 4], r, 40));
    hazeBand(f, th.haze, 196, T, .3);
  }
  function nestMid(rnd) {
    AW_SUN = 1;
    // the near ribs: three great bows of crystal bone sweeping down from the spine overhead into the floor
    const ribs = [];
    for (let i = 0; i < 3; i++) ribs.push(60 + i * 427 + rnd() * 40);
    nestRibs = ribs.slice();
    for (const x of ribs) awWR(x, 300, rnd, (x, r) => {
      zRib(x - 10, 82, x + 200, 70, x + 236, T + 6, 26, 9, BONE, r, 5);
      // crystals and shed scales piled where the rib enters the ground
      awCluster(x + 226, T + 2, 30 + r() * 14, 200 + r() * 40, r, 54); awCluster(x + 256, T + 3, 16 + r() * 8, 290, r, 50);
      for (let k = 0; k < 5; k++) zScale(x + 200 + r() * 70, T - 1 - r() * 4, 5 + r() * 3, (r() - .5) * 2, 180 + r() * 160, 1, .6);
      // icicles of crystal hanging from the rib's underside
      for (let k = 0; k < 4; k++) { const t = .15 + k * .12 + r() * .05, u = 1 - t, px = u * u * (x - 10) + 2 * u * t * (x + 200) + t * t * (x + 236), py = u * u * 82 + 2 * u * t * 70 + t * t * (T + 6); awCrystal(px - 4, py + 8, 10 + r() * 14, 5 + r() * 3, Math.PI + (r() - .5) * .3, 190 + r() * 120, 50, 56); }
    });
    // the spine, overhead: a chain of vertebrae, each with its spur, lit from the window below it
    const sp = awWave(57, [[2, 3], [5, 1.5]]);
    for (let x0 = 0; x0 < AW_W; x0 += 32) awWrap(x0 + 16, 26, (cx) => {
      const x = cx - 16, y = 78 + sp(cx);
      // the spur, swept back, and the wings of bone to either side
      ctx.fillStyle = BONE.dark; awPath([cx - 7, y - 6, cx - 4, y - 22, cx + 6, y - 40, cx + 10, y - 38, cx + 7, y - 6]); ctx.fill();
      ctx.fillStyle = BONE.base; awPath([cx - 3, y - 20, cx + 6, y - 38, cx + 8, y - 37, cx + 5, y - 6, cx + 1, y - 6]); ctx.fill();
      ctx.fillStyle = BONE.dark; awPath([x + 4, y - 2, x - 4, y + 9, x + 2, y + 10, x + 10, y + 3]); ctx.fill(); awPath([x + 28, y - 2, x + 38, y + 8, x + 32, y + 10, x + 22, y + 3]); ctx.fill();
      // the body: waisted, darker above, catching the window's light along its lower rim
      const body = () => { ctx.beginPath(); ctx.moveTo(x + 2, y - 9); ctx.lineTo(x + 30, y - 9); ctx.quadraticCurveTo(x + 25, y, x + 30, y + 10); ctx.lineTo(x + 2, y + 10); ctx.quadraticCurveTo(x + 7, y, x + 2, y - 9); ctx.closePath(); };
      body(); const vg = ctx.createLinearGradient(0, y - 9, 0, y + 10); vg.addColorStop(0, BONE.dark); vg.addColorStop(.5, BONE.base); vg.addColorStop(.88, awMix(BONE.base, BONE.lit, .5)); vg.addColorStop(1, BONE.lit); ctx.fillStyle = vg; ctx.fill();
      ctx.save(); body(); ctx.clip(); dab(cx + 3, y - 2, 6, BONE.dark, .25); dab(cx - 5, y + 4, 4, BONE.lit, .2); ctx.restore();
      ctx.fillStyle = '#1A1230'; ell(x + 32, y + .5, 2.4, 8.5); ctx.fill(); // the disc between one bone and the next
      add(() => { ctx.fillStyle = 'rgba(160,230,240,.3)'; ctx.fillRect(x + 6, y + 8, 20, 1); });
    });
    // crystal shards adrift in the nave, and a few scales caught in the air
    for (let i = 0; i < 5; i++) { const x = rnd() * AW_W, y = 92 + rnd() * 60, s = 6 + rnd() * 8, a = (rnd() - .5) * 1.2, hue = [190, 280, 320, 200, 260][i];
      awWrap(x, s * 2, (x) => { add(() => softDab(x, y, s * 2, '190,170,255', .18)); awCrystal(x, y, s, s * .5, a, hue, 50, 60); awCrystal(x, y, s * .6, s * .5, a + Math.PI, hue, 50, 50); }); }
    for (let i = 0; i < 6; i++) { const x = rnd() * AW_W, y = 120 + rnd() * 70; awWrap(x, 8, (x) => zScale(x, y, 3 + rnd() * 2, rnd() * TAU, 160 + i * 30, .85)); }
    for (let i = 0; i < 10; i++) awWR(rnd() * AW_W, 20, rnd, (x, r) => awCluster(x, T + 2, 9 + r() * 12, [190, 280, 320, 170][i % 4], r, 46));
  }
  // the floor: great slabs of dark mirror-glass; the stars are in it, joined into the shapes of old constellations
  function nestFloor(rnd, th) {
    ctx.fillStyle = '#05040C'; ctx.fillRect(0, T - 1, AW_W, VH - T + 1);
    let y = T + 1, row = 0;
    for (const h of [12, 17, 22, 30, 41]) {
      for (const [x0, w] of awRow(rnd, h * 6, h * 11)) awWR(x0, w, rnd, (x, r) => {
        const g = ctx.createLinearGradient(0, y, 0, y + h); const l = 1 - row * .1;
        g.addColorStop(0, hsla(248 + r() * 12, 40, 15 * l)); g.addColorStop(1, hsla(252, 44, 6 * l)); ctx.fillStyle = g; ctx.fillRect(x + .6, y + .6, w - 1.2, h - 1.2);
        ctx.fillStyle = 'rgba(170,150,240,.4)'; ctx.fillRect(x + .9, y + .6, w - 1.8, .8); ctx.fillStyle = 'rgba(140,120,220,.22)'; ctx.fillRect(x + .6, y + .6, .7, h - 1.2);
        if (r() < .25) { ctx.strokeStyle = 'rgba(200,190,255,.18)'; ctx.lineWidth = .5; ctx.beginPath(); const cx = x + w * r(); ctx.moveTo(cx, y + 1); ctx.lineTo(cx + 6, y + h * .5); ctx.lineTo(cx + 3, y + h - 1); ctx.stroke(); } // a hairline fracture
      });
      y += h; row++;
    }
    add(() => {
      // the starfield, mirrored
      for (let i = 0; i < 170; i++) { const x = rnd() * AW_W, yy = T + 4 + rnd() * (VH - T - 8); ctx.fillStyle = `rgba(230,225,255,${.12 + rnd() * .3})`; circle(x, yy, .3 + rnd() * .7); ctx.fill(); }
      // the glow of the nave's light lying along the back of the floor, and pale streaks under the ribs
      const wg = ctx.createLinearGradient(0, T, 0, T + 55); wg.addColorStop(0, 'rgba(150,110,200,.28)'); wg.addColorStop(1, 'rgba(150,110,200,0)'); ctx.fillStyle = wg; ctx.fillRect(0, T, AW_W, 55);
      for (let i = 0; i < 10; i++) { const x = rnd() * AW_W, w = 6 + rnd() * 16, L = 40 + rnd() * 60; awWrap(x, w, (x) => { const g = ctx.createLinearGradient(0, T, 0, T + L); g.addColorStop(0, 'rgba(210,190,250,.14)'); g.addColorStop(1, 'rgba(210,190,250,0)'); ctx.fillStyle = g; ctx.fillRect(x - w / 2, T, w, L); }); }
      // constellations: a few bright stars joined by fine lines
      for (let i = 0; i < 9; i++) {
        const cx = i * 142 + rnd() * 80, cy = T + 22 + rnd() * 80, n = 4 + Math.floor(rnd() * 3), pts = [];
        for (let k = 0; k < n; k++) pts.push([cx + (rnd() - .3) * 70, cy + (rnd() - .5) * 26 * (1 + (cy - T) / 80)]);
        awWrap(cx, 80, (ox) => { const d = ox - cx;
          ctx.strokeStyle = 'rgba(170,210,255,.22)'; ctx.lineWidth = .6; ctx.beginPath(); pts.forEach(([px, py], k) => k ? ctx.lineTo(px + d, py) : ctx.moveTo(px + d, py)); ctx.stroke();
          pts.forEach(([px, py], k) => { spark(px + d, py, k === 0 ? 3 : 1.8, 'rgba(230,240,255,.55)'); ctx.fillStyle = 'rgba(255,255,255,.75)'; circle(px + d, py, .7); ctx.fill(); });
        });
      }
    });
    // the arena seal: a great ring inlaid in the glass, with the wyrm's sigil
    const sx = 640, sy = T + 62, R = 170;
    awGlow('#B8A0FF', 6, () => {
      ctx.strokeStyle = 'rgba(190,170,255,.4)'; ctx.lineWidth = 1.2; ell(sx, sy, R, R * .2); ctx.stroke(); ctx.lineWidth = .8; ell(sx, sy, R * .86, R * .17); ctx.stroke();
      ctx.beginPath(); for (let k = 0; k < 36; k++) { const a = k / 36 * TAU, c = Math.cos(a), s = Math.sin(a); ctx.moveTo(sx + c * R * .87, sy + s * R * .172); ctx.lineTo(sx + c * R * .985, sy + s * R * .197); } ctx.stroke();
      ctx.strokeStyle = 'rgba(160,230,240,.35)'; ctx.beginPath(); for (let k = 0; k <= 7; k++) { const a = k * 3 / 7 * TAU - Math.PI / 2; const px = sx + Math.cos(a) * R * .7, py = sy + Math.sin(a) * R * .14; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); // a seven-pointed star
    });
    // scales the wyrm has shed, and broken crystal, along the back edge
    for (let i = 0; i < 16; i++) awWR(rnd() * AW_W, 14, rnd, (x, r) => zScale(x, T + 2 + r() * 9, 5 + r() * 4, (r() - .5) * 2.4, 170 + r() * 170, 1, .5));
    for (let i = 0; i < 8; i++) awWR(rnd() * AW_W, 20, rnd, (x, r) => { const w = 7 + r() * 9; awFillPts([x - w, T + 4, x - w * .5, T - w * .6, x + w * .3, T - w * .8, x + w, T + 4], '#2A2248'); awFillPts([x + w * .3, T - w * .8, x + w, T + 4, x + w * .2, T + 4], '#6A5A9E', .85); });
    for (let i = 0; i < 12; i++) awWR(rnd() * AW_W, 22, rnd, (x, r) => awCluster(x, T + 1, 8 + r() * 12, [190, 280, 320, 200][i % 4], r, 50));
    const sh = ctx.createLinearGradient(0, VH - 40, 0, VH); sh.addColorStop(0, 'rgba(2,1,8,0)'); sh.addColorStop(1, 'rgba(2,1,8,.5)'); ctx.fillStyle = sh; ctx.fillRect(0, VH - 40, AW_W, 40);
  }

  // ======================================================================================================
  // THEMES and registration
  // ======================================================================================================
  THEMES.prism2 = {
    name: 'the inverted gallery', sky: ['#141036', '#3A2C72', '#9A5E98', '#F0B490'], sun: [0.24, 0.42, '214,136,196'], haze: '196,172,220',
    floorA: '#7A6CA0', floorB: '#1C1630', path: '#C29440', skyKind: 'none',
    grade: { desat: .12, top: 'rgba(50,50,170,.5)', bot: 'rgba(150,60,120,.45)', vig: 'rgba(12,6,28,.65)' },
    liveSky(camX, t) { // slow fans of split light, as if through a prism, from the low sun
      const th = THEMES.prism2, sx = VW * th.sun[0] - camX * .02, sy = Y_OFF + VIEW_H * th.sun[1], len = VW * 1.3;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const a = -.34 + i * .27 + Math.sin(t * .06 + i * 2.1) * .03;
        [[350, -.022], [130, 0], [205, .022]].forEach(([h, da]) => {
          const b = a + da, w = .018;
          const g = ctx.createLinearGradient(sx, sy, sx + Math.cos(b) * len, sy + Math.sin(b) * len); g.addColorStop(0, hsla(h, 80, 72, .2)); g.addColorStop(.6, hsla(h, 80, 72, .07)); g.addColorStop(1, hsla(h, 80, 72, 0));
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(b - w) * len, sy + Math.sin(b - w) * len); ctx.lineTo(sx + Math.cos(b + w) * len, sy + Math.sin(b + w) * len); ctx.fill();
        });
      }
      ctx.restore();
    },
    liveFloor(camX, t) { // pools of split light drift slowly over the pavement
      const mx = -(((camX * .45) % AW_W) + AW_W) % AW_W;
      for (const [cx, w, top] of galleryCols) for (const k of [0, AW_W, -AW_W]) { // the columns stand mirrored in the polished floor, sliding with them
        const x = mx + cx + k; if (x < -30 || x > VW + 30) continue;
        const L = (FLOOR_TOP - top) * .5, g = ctx.createLinearGradient(0, FLOOR_TOP, 0, FLOOR_TOP + L); g.addColorStop(0, 'rgba(230,200,240,.13)'); g.addColorStop(1, 'rgba(230,200,240,0)');
        ctx.fillStyle = g; ctx.fillRect(x - w / 2, FLOOR_TOP + 1, w, L);
      }
      for (let i = 0; i < 3; i++) {
        const x = ((i * 540 + t * 5 - camX) % 1620 + 1620) % 1620 - 260, y = FLOOR_TOP + 30 + i * 26, h = (t * 4 + i * 120) % 360;
        ctx.save(); ctx.translate(x, y); ctx.scale(1, .22); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 120); g.addColorStop(0, hsla(h, 70, 70, .09)); g.addColorStop(1, hsla(h, 70, 70, 0)); ctx.fillStyle = g; ctx.fillRect(-120, -120, 240, 240); ctx.restore();
      }
    },
  };
  THEMES.prismBoss = {
    name: "the wyrm's nest", sky: ['#04030C', '#100A26', '#261544', '#4E2458'], sun: [0.5, 0.21, '230,180,255'], haze: '110,80,160',
    floorA: '#1A1634', floorB: '#05040C', path: '#9FE8F0', skyKind: 'none',
    grade: { desat: .1, top: 'rgba(40,40,170,.5)', bot: 'rgba(170,80,170,.38)', vig: 'rgba(4,2,14,.7)' },
    liveSky(camX, t) { // the nebula turns, the rose window burns, a few shards drift across the dark
      const th = THEMES.prismBoss, wx = VW * .5 + Math.sin(camX * .0007) * 26, wy = 122;
      roseX = wx; th.sun[0] = (wx + camX * .02) / VW; th.sun[1] = (wy - Y_OFF) / VIEW_H; // keep the sky's glow behind the window
      if (nebC) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .75; ctx.translate(wx, wy); ctx.rotate(t * .012); ctx.drawImage(nebC, -210, -210, 420, 420); ctx.restore(); }
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * .02, w = .05, L = 260; ctx.fillStyle = 'rgba(240,200,255,.045)'; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(a - w) * L, wy + Math.sin(a - w) * L); ctx.lineTo(wx + Math.cos(a + w) * L, wy + Math.sin(a + w) * L); ctx.fill(); }
      ctx.restore();
      if (roseC) { ctx.globalAlpha = .92; ctx.drawImage(roseC, wx - 90, wy - 90, 180, 180); ctx.globalAlpha = 1; }
      const W = VW + 120;
      for (let i = 0; i < 6; i++) { // shards, slowly turning as they drift
        const x = ((i * 173 + t * (3 + i % 3 * 1.5) - camX * .1) % W + W) % W - 60, y = 66 + (i * 47) % 120 + Math.sin(t * .25 + i) * 5, s = 3 + (i % 3) * 1.6, a = t * .08 * (i % 2 ? 1 : -1) + i;
        const c = Math.cos(a), sn = Math.sin(a), p = (u, v) => [x + u * c - v * sn, y + u * sn + v * c];
        const A = p(0, -s * 1.6), B = p(s * .6, 0), Cc = p(0, s * 1.6), D = p(-s * .6, 0);
        ctx.fillStyle = 'rgba(60,44,100,.85)'; poly([A, B, Cc, D]); ctx.fill();
        ctx.fillStyle = `hsla(${[190, 280, 320][i % 3]},60%,72%,.8)`; poly([A, B, p(0, 0)]); ctx.fill();
      }
    },
    liveFloor(camX, t) { // the window's light lies in the mirror-glass below it, breathing slowly
      const mx = -(((camX * .45) % AW_W) + AW_W) % AW_W, R = (y) => FLOOR_TOP + (FLOOR_TOP - y) * .42;
      const rg = ctx.createLinearGradient(0, FLOOR_TOP, 0, FLOOR_TOP + 72); rg.addColorStop(0, 'rgba(210,190,255,.12)'); rg.addColorStop(1, 'rgba(210,190,255,0)');
      ctx.strokeStyle = rg; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath();
      for (const rx of nestRibs) for (const k of [0, AW_W, -AW_W]) { // the ribs, mirrored in the glass, sliding with them
        const x = mx + rx + k; if (x + 240 < -10 || x - 10 > VW + 10) continue;
        ctx.moveTo(x + 236, R(T + 2)); ctx.quadraticCurveTo(x + 200, R(70), x - 10, R(82));
      }
      ctx.stroke();
      const a = .1 + .025 * Math.sin(t * .4);
      ctx.save(); ctx.translate(roseX, FLOOR_TOP + 40); ctx.scale(.55, 1); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 80); g.addColorStop(0, `rgba(240,190,255,${a})`); g.addColorStop(1, 'rgba(240,190,255,0)'); ctx.fillStyle = g; ctx.fillRect(-80, -80, 160, 160); ctx.restore();
    },
  };
  AW_FAR.prism2 = galleryFar; AW_MID.prism2 = galleryMid; AW_FLOOR.prism2 = galleryFloor;
  AW_FAR.prismBoss = nestFar; AW_MID.prismBoss = nestMid; AW_FLOOR.prismBoss = nestFloor;
})();
