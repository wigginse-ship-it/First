'use strict';
// The three bosses, redrawn as the showpieces: Old Mossback, the Brass Colossus and the Kaleidoscope Wyrm.
// Everything lives in this closure so nothing here collides with the other art files.
// Light falls from the upper right: hard-edged shadow planes sit lower-left, a lit rim runs along top/right edges.
(() => {
  const DET = () => !FLASH && !TINT && !LITE; // detail shading is skipped in a hit-flash or a flat afterimage tint
  const LX = .6, LY = -.8;          // direction toward the light
  const poly = (pts) => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); };
  const fillPoly = (pts, col, ow) => { poly(pts); ctx.fillStyle = C(col); ctx.fill(); if (ow) outline(ow); };
  const detPoly = (pts, col) => { if (!DET()) return; poly(pts); ctx.fillStyle = col; ctx.fill(); };
  const glow = (col, blur, fn) => { ctx.save(); if (DET()) { ctx.shadowColor = col; ctx.shadowBlur = blur; } fn(); ctx.restore(); };
  const add = (fn) => { if (!DET()) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
  const clipIn = (path, fn) => { if (!DET()) return; ctx.save(); path(); ctx.clip(); fn(); ctx.restore(); };
  const line = (pts, col, w) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.stroke(); };
  const rivet = (x, y, r, col) => { circle(x, y, r); ctx.fillStyle = C(shade(col, -.45)); ctx.fill(); if (DET()) { circle(x + r * .25, y - r * .25, r * .55); ctx.fillStyle = shade(col, .55); ctx.fill(); } };
  const lerp2 = (a, b, k) => a + (b - a) * k;
  const hsh = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }; // a fixed pseudo-random number per seed
  // dots batched into one path and filled once (pitting, speckle, stipple): pts are [x, y, rx, ry] fours
  const dots = (pts, col) => { ctx.beginPath(); for (let i = 0; i < pts.length; i += 4) { ctx.moveTo(pts[i] + pts[i + 2], pts[i + 1]); ctx.ellipse(pts[i], pts[i + 1], pts[i + 2], pts[i + 3], 0, 0, TAU); } ctx.fillStyle = col; ctx.fill(); };
  // soft round-form shading laid over a filled shape (detail only): a warm highlight toward the light, falling off to a cool dark
  function orbShade(path, x, y, r, hiA, loA, hiCol, loCol) {
    if (!DET()) return; // (the shape is filled again with the gradient: no clip, so it stays cheap)
    const g = ctx.createRadialGradient(x, y, r * .05, x, y, r); g.addColorStop(0, `rgba(${hiCol || '255,248,224'},${hiA})`); g.addColorStop(.38, `rgba(${hiCol || '255,248,224'},0)`); g.addColorStop(.72, `rgba(${loCol || '16,10,8'},${loA * .25})`); g.addColorStop(1, `rgba(${loCol || '16,10,8'},${loA})`);
    path(); ctx.fillStyle = g; ctx.fill();
  }
  // round-metal shading across a cylinder (a barrel, a stack, a greave): from the lit edge (x0, y0) to the shadowed one (x1, y1)
  function cylShade(path, x0, y0, x1, y1, k) {
    if (!DET()) return; k = k || 1;
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, `rgba(255,246,220,${.06 * k})`); g.addColorStop(.16, `rgba(255,246,220,${.42 * k})`); g.addColorStop(.3, 'rgba(255,246,220,0)'); g.addColorStop(.66, `rgba(18,10,6,${.1 * k})`); g.addColorStop(1, `rgba(18,10,6,${.46 * k})`);
    path(); ctx.fillStyle = g; ctx.fill();
  }

  // a tapered, curved spike (horn, thorn, claw, spine): built along a quadratic curve, two-toned with the side away
  // from the light in shadow, a lit edge on the other side, optional ridges across it, and an outline.
  function taper(x0, y0, cx, cy, x1, y1, w0, w1, n) {
    n = n || 7; const L = [], R = [], M = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, iu = 1 - u;
      const x = iu * iu * x0 + 2 * iu * u * cx + u * u * x1, y = iu * iu * y0 + 2 * iu * u * cy + u * u * y1;
      const dx = 2 * iu * (cx - x0) + 2 * u * (x1 - cx), dy = 2 * iu * (cy - y0) + 2 * u * (y1 - cy), d = Math.hypot(dx, dy) || 1;
      const w = (w0 + (w1 - w0) * u) / 2, nx = -dy / d * w, ny = dx / d * w;
      L.push(x + nx, y + ny); R.push(x - nx, y - ny); M.push(x, y);
    }
    return { L, R, M };
  }
  function tracePath(A, B) { ctx.beginPath(); ctx.moveTo(A[0], A[1]); for (let i = 2; i < A.length; i += 2) ctx.lineTo(A[i], A[i + 1]); for (let i = B.length - 2; i >= 0; i -= 2) ctx.lineTo(B[i], B[i + 1]); ctx.closePath(); }
  function horn(x0, y0, cx, cy, x1, y1, w0, w1, col, ridges, ow) {
    const s = taper(x0, y0, cx, cy, x1, y1, w0, w1);
    tracePath(s.L, s.R); ctx.fillStyle = C(col); ctx.fill();
    if (DET()) {
      const k = s.L.length >> 2 & ~1, nx = s.L[k] - s.M[k], ny = s.L[k + 1] - s.M[k + 1], darkL = nx * -LX + ny * -LY > 0;
      tracePath(darkL ? s.L : s.R, s.M); ctx.fillStyle = shade(col, -.38); ctx.fill();
      const lit = darkL ? s.R : s.L; ctx.strokeStyle = shade(col, .45); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(lit[0], lit[1]); for (let i = 2; i < lit.length - 2; i += 2) ctx.lineTo(lit[i], lit[i + 1]); ctx.stroke();
      if (ridges) { ctx.strokeStyle = shade(col, -.5); ctx.lineWidth = .7; ctx.beginPath(); for (let i = 1; i <= ridges; i++) { const j = Math.round(i / (ridges + 1) * (s.L.length / 2 - 1)) * 2; ctx.moveTo(s.L[j], s.L[j + 1]); ctx.quadraticCurveTo(s.M[j] + (s.M[j + 2] - s.M[j]) * .8, s.M[j + 1] + (s.M[j + 3] - s.M[j + 1]) * .8, s.R[j], s.R[j + 1]); } ctx.stroke(); }
    }
    tracePath(s.L, s.R); outline(ow || 1.1);
  }
  // a scalloped, leafy/cloudy clump path
  function clump(x, y, r, n, seed) {
    ctx.beginPath();
    for (let k = 0; k <= n; k++) {
      const an = k / n * TAU + seed, rr = r * (k % 2 ? .82 : 1) * (1 + .08 * Math.sin(seed * 7 + k * 2.3));
      const px = x + Math.cos(an) * rr, py = y + Math.sin(an) * rr * .9;
      if (!k) ctx.moveTo(px, py);
      else { const am = (k - .5) / n * TAU + seed, rm = r * 1.12; ctx.quadraticCurveTo(x + Math.cos(am) * rm, y + Math.sin(am) * rm * .9, px, py); }
    }
    ctx.closePath();
  }

  // ===================================================================================================
  // OLD MOSSBACK, the Walking Grove: an ancient tortoise with a grove of trees and standing stones on its shell
  // ===================================================================================================
  // each phase reads at a glance: the green of the old grove; autumn, russet and amber, with shelf fungus breaking out
  // across the shell; and a deep violet blight, the grove dead and lit only by the spores glowing in it. The accents
  // (runes, eyes, cracks, thorns, the caps in the moss) follow the phase too, and so do his tells and his thorn rings
  const MOSS_PAL = {
    1: { plate: '#6E8A56', seam: '#1E2A1A', rim: '#DCD2B8', skin: '#6A7E50', moss: '#4E7A3E', leaf: ['#22402F', '#355E44', '#5E8E50', '#A6C878'], bark: '#4E3A2C',
      rune: '#9FE8C8', eye: '#EED48A', crack: null, thorn: '#6A4A30', tip: null, cap: '#9FE8D8', capGlow: '#9FE8C8', lichen: '#9AAA5A', bloom: '#ECC0CE', fern: '#3E6A3E',
      tell: '126,164,96', ring: ['#5E7A3A', '#7EA460'], sod: ['#5A4430', '#3E2E20', '#6E8A44', '#4E6A32'] },
    2: { plate: '#8A6A3C', seam: '#2A1A0E', rim: '#E6CC9C', skin: '#7E6640', moss: '#A0782A', leaf: ['#3E1A0E', '#7A3216', '#C2602A', '#F4B44A'], bark: '#4A2C1C',
      rune: '#FFC060', eye: '#FFB040', crack: null, thorn: '#5A3218', tip: null, cap: '#F08A3A', capGlow: '#FFB060', lichen: '#C8A040', bloom: '#E8783A', fern: '#8A5A22',
      tell: '214,150,70', ring: ['#7A4A22', '#B07A34'], sod: ['#6A4428', '#3E2614', '#B07A34', '#8A4A20'] },
    3: { plate: '#4E3E62', seam: '#140C1E', rim: '#B4A2C8', skin: '#544466', moss: '#3A2A50', leaf: ['#170C22', '#2E1A44', '#55327A', '#A774DA'], bark: '#2A1C34',
      rune: '#D890FF', eye: '#E878FF', crack: '#C870FF', thorn: '#2C1A3A', tip: '#E8A8FF', cap: '#C890FF', capGlow: '#D890FF', lichen: '#6A4E86', bloom: null, fern: null,
      tell: '186,120,236', ring: ['#3E2852', '#6A4688'], sod: ['#3A2A44', '#24182C', '#6A4688', '#4E3A62'] },
  };
  window.MOSS_TONE = (e) => MOSS_PAL[Math.min(3, Math.max(1, (e && e.phase) || 1))]; // (for his tells, thorn rings and the dive: boss_fx.js, mossdive.js)
  // where a ray from the focus meets the shell's edge (an upper half-ellipse closed by its base line, or a full ellipse)
  function shellEdge(cx, cy, rx, ry, fx, fy, th, dome) {
    const dx = Math.cos(th), dy = Math.sin(th), ox = (fx - cx) / rx, oy = (fy - cy) / ry, ux = dx / rx, uy = dy / ry;
    const A = ux * ux + uy * uy, B = 2 * (ox * ux + oy * uy), Cq = ox * ox + oy * oy - 1;
    let s = (-B + Math.sqrt(Math.max(0, B * B - 4 * A * Cq))) / (2 * A);
    if (dome && dy > 1e-4) s = Math.min(s, (cy - fy) / dy);
    return s;
  }
  // the shell's scutes: a central plate, a ring of large costal plates and a ring of small marginal plates, each
  // cel-shaded by which way it faces, with growth rings, a lit edge toward the light and dark seams between
  function shellPlates(cx, cy, rx, ry, fx, fy, dome, pal, rot, runeCol, runeA) {
    const K = 24, rays = [];
    for (let k = 0; k <= K; k++) { const th = rot + k / K * TAU; rays.push([Math.cos(th), Math.sin(th), shellEdge(cx, cy, rx, ry, fx, fy, th, dome)]); }
    const P = (k, s) => { const r = rays[k % K]; return [fx + r[0] * r[2] * s, fy + r[1] * r[2] * s]; };
    const scx = cx, scy = dome ? cy - ry * .35 : cy;
    const plate = (pts, inset) => {
      let mx = 0, my = 0; for (let i = 0; i < pts.length; i += 2) { mx += pts[i]; my += pts[i + 1]; } mx /= pts.length / 2; my /= pts.length / 2;
      const q = pts.map((v, i) => i % 2 ? my + (v - my) * inset : mx + (v - mx) * inset);
      let nx = mx - scx, ny = my - scy; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
      const b = nx * LX + ny * LY + (dome ? .1 : 0), col = b > .35 ? shade(pal.plate, .2) : b < -.3 ? shade(pal.plate, -.3) : pal.plate;
      poly(q); ctx.fillStyle = C(col); ctx.fill();
      if (DET()) {
        ctx.strokeStyle = shade(col, -.32); ctx.lineWidth = .8; // growth rings
        for (const g of [.66, .36]) { poly(q.map((v, i) => i % 2 ? my + (v - my) * g : mx + (v - mx) * g)); ctx.stroke(); }
        ctx.strokeStyle = shade(col, .38); ctx.lineWidth = 1; ctx.beginPath(); // a lit edge on the sides facing the light
        for (let i = 0; i < q.length; i += 2) {
          const x0 = q[i], y0 = q[i + 1], x1 = q[(i + 2) % q.length], y1 = q[(i + 3) % q.length], ex = x1 - x0, ey = y1 - y0, el = Math.hypot(ex, ey) || 1;
          let onx = ey / el, ony = -ex / el; if (onx * (mx - x0) + ony * (my - y0) > 0) { onx = -onx; ony = -ony; }
          if (onx * LX + ony * LY > .45) { ctx.moveTo(x0 + (mx - x0) * .08, y0 + (my - y0) * .08); ctx.lineTo(x1 + (mx - x1) * .08, y1 + (my - y1) * .08); }
        }
        ctx.stroke();
        ctx.strokeStyle = shade(col, -.42); ctx.lineWidth = 1.1; ctx.beginPath(); // and a shadowed bevel on the sides turned away
        for (let i = 0; i < q.length; i += 2) {
          const x0 = q[i], y0 = q[i + 1], x1 = q[(i + 2) % q.length], y1 = q[(i + 3) % q.length], ex = x1 - x0, ey = y1 - y0, el = Math.hypot(ex, ey) || 1;
          let onx = ey / el, ony = -ex / el; if (onx * (mx - x0) + ony * (my - y0) > 0) { onx = -onx; ony = -ony; }
          if (onx * LX + ony * LY < -.45) { ctx.moveTo(x0 + (mx - x0) * .07, y0 + (my - y0) * .07); ctx.lineTo(x1 + (mx - x1) * .07, y1 + (my - y1) * .07); }
        }
        ctx.stroke();
      }
      return [mx, my];
    };
    const centers = [];
    const inner = []; for (let k = 0; k < K; k += 4) inner.push(...P(k, .4));
    plate(inner, .9);
    for (let j = 0; j < 6; j++) { const k = j * 4; centers.push(plate([...P(k, .4), ...P(k + 2, .42), ...P(k + 4, .4), ...P(k + 4, .8), ...P(k + 3, .81), ...P(k + 1, .81), ...P(k, .8)], .92)); }
    for (let j = 0; j < 12; j++) { const k = j * 2; plate([...P(k, .8), ...P(k + 1, .81), ...P(k + 2, .8), ...P(k + 2, 1), ...P(k + 1, 1), ...P(k, 1)], .88); }
    if (DET()) { // the old horn weathered: pitting, pale flecks where it has worn smooth, and rosettes of lichen
      const pit = [], fleck = [], lich = [], lichD = [];
      for (let i = 0; i < 46; i++) { const r = rays[Math.floor(hsh(i) * K)], d = .14 + hsh(i + 50) * .8, q = r[2] * d, x = fx + r[0] * q, y = fy + r[1] * q;
        if (i % 3 === 2) fleck.push(x + 1, y - .6, .5 + hsh(i + 9) * .6, .4); else pit.push(x, y, .45 + hsh(i + 7) * .55, .35 + hsh(i + 3) * .4); }
      for (let i = 0; i < 12; i++) { const r = rays[Math.floor(hsh(i + 200) * K)], d = .5 + hsh(i + 250) * .45, q = r[2] * d, x = fx + r[0] * q, y = fy + r[1] * q, s = 1 + hsh(i + 300) * 1.6;
        lich.push(x, y, s * 1.3, s * .8, x + s, y + .5, s * .8, s * .6); lichD.push(x + .3, y + .3, s * .4, s * .3); }
      dots(pit, 'rgba(14,10,6,.42)'); dots(fleck, 'rgba(255,248,226,.32)'); dots(lich, pal.lichen); dots(lichD, shade(pal.lichen, -.35));
    }
    if (runeA > 0 && DET()) glow(runeCol, 8, () => { // old runes carved into the costal plates, softly alight
      ctx.globalAlpha = runeA; ctx.strokeStyle = runeCol; ctx.lineWidth = 1.3; ctx.beginPath();
      for (const [x, y] of centers) { ctx.moveTo(x + 2.6, y); ctx.arc(x, y, 2.6, 0, TAU); ctx.moveTo(x, y - 4.6); ctx.lineTo(x, y + 4.6); ctx.moveTo(x - 1.4, y - 4); ctx.lineTo(x, y - 5.6); ctx.lineTo(x + 1.4, y - 4); }
      ctx.stroke();
    });
    return { P, centers };
  }
  function mossPatch(sh, k0, k1, pal, t, drip) { // moss draped over the top of the shell, hanging in strands
    const top = [], bot = [];
    for (let k = k0; k <= k1; k++) { top.push(...sh.P(k, 1.03)); bot.push(...sh.P(k, k === k0 || k === k1 ? .96 : (k % 2 ? .74 : .86) - drip)); }
    tracePath(top, bot); ctx.fillStyle = C(pal.moss); ctx.fill(); outline(1.2);
    if (DET()) {
      for (let i = 0; i < top.length - 2; i += 2) { ctx.fillStyle = shade(pal.moss, .28); ell(top[i] + 1.5, top[i + 1] + 1.6, 3.2, 1.9); ctx.fill(); ctx.fillStyle = shade(pal.moss, .55); ell(top[i] + 2.4, top[i + 1] + .8, 1.4, .8); ctx.fill(); }
      { // stipple: the cushion's dark hollows low down, a few lit tips (all of them between its edges, so no clip is needed)
      const dk = [], lt = [];
      for (let i = 0; i < bot.length; i += 2) { const j = Math.min(i, top.length - 2); for (let m = 0; m < 3; m++) { const u = .35 + m * .22, x = lerp2(top[j], bot[i], u) + (hsh(i + m * 13 + k0) - .5) * 4, y = lerp2(top[j + 1], bot[i + 1], u); dk.push(x, y, .9, .7); if (m === 0) lt.push(x + 1.6, y - 2.2, .7, .5); } }
      dots(dk, shade(pal.moss, -.3)); dots(lt, shade(pal.moss, .5)); }
      ctx.strokeStyle = shade(pal.moss, -.35); ctx.lineWidth = 1; ctx.beginPath(); // hanging strands
      for (let i = 2; i < bot.length - 2; i += 4) { const sw = Math.sin(t * 1.8 + i) * 1.2, l = 4 + hsh(i + k0) * 4; ctx.moveTo(bot[i], bot[i + 1] - 1); ctx.quadraticCurveTo(bot[i] + sw, bot[i + 1] + l * .5, bot[i] + sw * 1.6, bot[i + 1] + l); }
      ctx.stroke();
      ctx.strokeStyle = shade(pal.moss, .35); ctx.lineWidth = .8; ctx.beginPath(); // sprigs standing up out of the cushion
      for (let i = 2; i < top.length - 2; i += 4) { const sw = Math.sin(t * 2.1 + i) * .8; ctx.moveTo(top[i], top[i + 1] + 1); ctx.lineTo(top[i] + sw - 1, top[i + 1] - 3.4); ctx.moveTo(top[i] + 1.4, top[i + 1] + 1); ctx.lineTo(top[i] + sw + 2, top[i + 1] - 2.6); }
      ctx.stroke();
    }
  }
  function canopy(clumps, pal, t, ow) { // a cel-shaded leaf mass: a single inked silhouette, then dark, mid and lit lobes
    const sway = (i) => Math.sin(t * 1.3 + i * .7) * 1.1;
    ctx.strokeStyle = FLASH ? '#FFFFFF' : OUT; ctx.lineWidth = ow * 2;
    clumps.forEach(([x, y, r], i) => { clump(x + sway(i), y, r, 10, i * 1.7); ctx.stroke(); });
    ctx.fillStyle = C(pal.leaf[0]); clumps.forEach(([x, y, r], i) => { clump(x + sway(i), y, r, 10, i * 1.7); ctx.fill(); });
    if (!DET()) return;
    ctx.fillStyle = pal.leaf[1]; clumps.forEach(([x, y, r], i) => { clump(x + sway(i) + r * .14, y - r * .16, r * .78, 9, i * 2.1 + 1); ctx.fill(); });
    ctx.fillStyle = pal.leaf[2]; clumps.forEach(([x, y, r], i) => { clump(x + sway(i) + r * .3, y - r * .34, r * .48, 8, i * 1.3 + 2); ctx.fill(); });
    ctx.fillStyle = pal.leaf[3]; clumps.forEach(([x, y, r], i) => { ell(x + sway(i) + r * .42, y - r * .5, r * .2, r * .12, -.5); ctx.fill(); });
    // single leaves picked out round each clump (dark ones down in the shade, bright ones where the light catches the edge)
    const dk = [], md = [], lt = [];
    clumps.forEach(([x, y, r], i) => { const sx = sway(i);
      for (let m = 0; m < 7; m++) { const an = m * .9 + i * 1.3, d = r * (.55 + hsh(i * 7 + m) * .4), lx = x + sx + Math.cos(an) * d, ly = y + Math.sin(an) * d * .85, up = Math.cos(an) * LX + Math.sin(an) * LY;
        (up > .3 ? lt : up < -.3 ? dk : md).push(lx, ly, 1.7, 1); } });
    const leaves = (pts, col) => { ctx.beginPath(); for (let i = 0; i < pts.length; i += 4) { ctx.moveTo(pts[i] + 1.7, pts[i + 1]); ctx.ellipse(pts[i], pts[i + 1], 1.7, 1, (i * .37) % 3 - 1.5, 0, TAU); } ctx.fillStyle = col; ctx.fill(); };
    leaves(dk, shade(pal.leaf[0], -.2)); leaves(md, pal.leaf[2]); leaves(lt, pal.leaf[3]);
  }
  function grove(e, a, pal, phase, rage, t) {
    const P3 = phase === 3;
    // a standing stone and a cairn on the shell, lichen on the stone
    const stone = [20, -80, 21, -101, 27, -109, 34, -104, 37, -80];
    fillPoly(stone, '#8A8478', 0);
    detPoly([20, -80, 21, -101, 27, -109, 26, -80], '#625C54');
    if (DET()) { orbShade(() => poly(stone), 33, -104, 26, .3, .45); dots([23, -92, .6, .5, 31, -98, .5, .4, 33, -86, .7, .5, 24, -84, .5, .5, 29, -82, .6, .4, 35, -95, .4, .4], 'rgba(30,26,22,.55)');
      ctx.fillStyle = C(pal.moss); ctx.beginPath(); ctx.moveTo(26.6, -108.6); ctx.quadraticCurveTo(31, -110, 34.2, -104); ctx.quadraticCurveTo(31, -104.6, 30, -102); ctx.quadraticCurveTo(28.6, -105, 26.6, -108.6); ctx.fill(); }
    if (DET()) { ctx.strokeStyle = '#B4AEA0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(28, -108); ctx.lineTo(34, -104); ctx.lineTo(36.4, -82); ctx.stroke(); line([29, -100, 31, -94, 29, -88], '#5A544C', .8); }
    poly(stone); outline(1.4);
    ctx.fillStyle = C(pal.lichen); ell(26, -97, 3, 1.6, .3); ctx.fill(); ell(31, -88, 2.2, 1.3); ctx.fill();
    glow(pal.rune, 6, () => { ctx.strokeStyle = C(rage ? '#FF9A5A' : shade(pal.rune, .3)); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(28.5, -102); ctx.lineTo(28.5, -95); ctx.moveTo(26.5, -99); ctx.lineTo(30.5, -97); ctx.stroke(); }); // a rune cut into the stone
    for (const [x, y, w, h] of [[40, -78, 9, 6], [14, -80, 7, 5]]) { ell(x, y, w, h); ctx.fillStyle = C('#7A7468'); ctx.fill(); if (DET()) { ctx.fillStyle = '#9A9488'; ell(x + w * .25, y - h * .35, w * .55, h * .4); ctx.fill(); } ell(x, y, w, h); outline(1.2); }
    // roots gripping the shell, a gnarled twisting trunk and its limbs
    horn(-8, -82, -24, -82, -34, -72, 5, 1.2, pal.bark, 0, 1.1);
    horn(-4, -82, 6, -84, 14, -77, 4, 1, pal.bark, 0, 1.1);
    horn(-8, -112, -22, -116, -34, -128, 5, 2, pal.bark, 2, 1.2);
    horn(-4, -126, 8, -130, 16, -146, 4.4, 1.6, pal.bark, 2, 1.2);
    horn(-6, -80, -18, -110, -3, -142, 12, 6, pal.bark, 0, 1.4);
    if (DET()) { ctx.strokeStyle = shade(pal.bark, -.45); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(-8, -86); ctx.quadraticCurveTo(-16, -108, -6, -134); ctx.moveTo(-3, -88); ctx.quadraticCurveTo(-11, -106, -2, -126); ctx.stroke(); ctx.fillStyle = shade(pal.bark, -.55); ell(-10, -104, 1.6, 3); ctx.fill();
      ctx.strokeStyle = shade(pal.bark, .3); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(-2, -84); ctx.quadraticCurveTo(-14.6, -110, -.4, -138); ctx.moveTo(-12, -96); ctx.lineTo(-11.4, -100); ctx.moveTo(-10.6, -117); ctx.lineTo(-9.6, -122); ctx.stroke(); // the lit side of the bark and its ridges
      ctx.strokeStyle = shade(pal.bark, -.3); ctx.beginPath(); ctx.arc(-10, -104, 2.6, 0, TAU); ctx.moveTo(-11, -126); ctx.arc(-12, -126, 1, 0, TAU); ctx.stroke(); }
    // ferns at the foot of the tree
    if (pal.fern) { ctx.strokeStyle = C(pal.fern); ctx.lineWidth = 1.6; ctx.lineCap = 'round'; for (const [x, d] of [[-18, -1], [6, 1], [-26, -1]]) { ctx.beginPath(); ctx.moveTo(x, -80); ctx.quadraticCurveTo(x + d * 6, -92, x + d * 12, -90 + Math.sin(t * 2 + x) * 1); ctx.stroke(); } }
    const clumps = [[-32, -130, 12], [-18, -146, 15], [0, -152, 15], [16, -142, 13], [-4, -134, 14], [-24, -154, 11], [10, -158, 11], [24, -132, 9]];
    canopy(clumps, pal, t, 1.6);
    if (phase === 2 && DET()) { // shelf fungus breaking out up the trunk, amber gills catching the light
      for (const [x, y, w, d] of [[-14, -98, 7, -1], [-4, -112, 6, 1], [-12, -124, 5, -1], [-2, -92, 5, 1]]) { ctx.save(); ctx.translate(x, y); ctx.scale(d, 1);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(w * .6, -w * .55, w * 1.15, -.4); ctx.quadraticCurveTo(w * .6, w * .25, 0, 1.6); ctx.closePath(); ctx.fillStyle = C('#D2843A'); ctx.fill(); outline(.9);
        ctx.fillStyle = '#F6C070'; ell(w * .5, -w * .28, w * .36, w * .13); ctx.fill(); ctx.strokeStyle = '#7A3A16'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(w * .15, .9); ctx.quadraticCurveTo(w * .6, .6, w * 1.05, -.2); ctx.stroke(); ctx.restore(); }
    }
    if (pal.bloom && !e.dead && DET()) { // a few leaves (petals in spring) let go of the crown and drift down past the shell
      const n = phase === 2 ? 5 : 3, ga = ctx.globalAlpha;
      for (let i = 0; i < n; i++) { const life = (t * .2 + i / n) % 1, x = -30 + ((i * 29) % 56) + Math.sin(t * 1.9 + i * 2.1) * 5 - life * 16, y = -134 + life * 74;
        ctx.globalAlpha = ga * Math.sin(life * Math.PI) * .9; ctx.fillStyle = phase === 2 ? pal.leaf[3 - (i % 2)] : i % 2 ? pal.bloom : pal.leaf[3];
        ell(x, y, 2, 1, Math.sin(t * 3 + i * 1.7) * 1.4); ctx.fill(); }
      ctx.globalAlpha = ga;
    }
    if (pal.bloom) { // blossoms (in autumn, the last of them gone to orange)
      for (let i = 0; i < 9; i++) { const an = i * 2.1 + .5, d = 6 + (i * 7) % 18, x = -6 + Math.cos(an) * d * 1.5, y = -142 + Math.sin(an) * d * .8;
        ctx.fillStyle = C(rage ? '#F09A5A' : pal.bloom); for (let p = 0; p < 4; p++) { ell(x + Math.cos(p * 1.57) * 1.3, y + Math.sin(p * 1.57) * 1.3, 1.3, 1.3); ctx.fill(); }
        ctx.fillStyle = C('#FFF2C8'); circle(x, y, .7); ctx.fill(); }
    } else if (!e.dead) { // phase three: the grove is blighted, its dead crown hung with glowing spore lights that drift up off it
      add(() => { for (let i = 0; i < 3; i++) { const fx = -20 + i * 18, fy = -146; const g = ctx.createRadialGradient(fx, fy, 1, fx, fy, 16); g.addColorStop(0, 'rgba(210,140,255,.32)'); g.addColorStop(1, 'rgba(150,70,220,0)'); ctx.fillStyle = g; circle(fx, fy, 16); ctx.fill(); } });
      for (let i = 0; i < 9; i++) { const life = (t * .35 + i / 9) % 1, x = -28 + ((i * 37) % 56) + Math.sin(t * 1.7 + i * 2.3) * 3, y = -138 - ((i * 13) % 20) - life * 26, r = 1.1 + (i % 3) * .45;
        glow(pal.capGlow, 7, () => { ctx.globalAlpha = Math.sin(life * Math.PI); ctx.fillStyle = C(i % 3 ? pal.tip : '#FFFFFF'); circle(x, y, r); ctx.fill(); }); }
    }
  }
  function mossHead(a, pal, phase, rage, t, eyeCol, lunge, bob) {
    const atk = !!a.atk, wind = a.wind || 0, P3 = phase === 3;
    const hx = 66 + lunge, hy = -40 + bob, open = atk ? .55 : wind ? .28 * wind : .04 + Math.sin(t * 1.6) * .03;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(atk ? .12 : wind ? -.18 * wind : Math.sin(t * 1.6) * .03);
    const skin = pal.skin;
    // horns, the far one first: ridged and swept back, then curling up
    horn(-6, -10, -22, -18, -18, -40, 7, 1.2, shade(pal.rim, -.25), 4, 1.2);
    // the moss beard
    const beard = () => { ctx.beginPath(); ctx.moveTo(-6, 6); for (let i = 0; i <= 6; i++) { const x = -6 + i * 4, l = 14 + (i % 2 ? -5 : 3) + Math.sin(t * 1.7 + i) * 1.4; ctx.quadraticCurveTo(x - 1, 8 + l, x + 2, 9 + l * .6); } ctx.lineTo(20, 6); ctx.closePath(); };
    beard(); ctx.fillStyle = C(pal.moss); ctx.fill(); outline(1.2);
    clipIn(beard, () => { ctx.fillStyle = shade(pal.moss, -.35); ctx.fillRect(-10, 6, 12, 30); ctx.strokeStyle = shade(pal.moss, .3); ctx.lineWidth = .8; ctx.beginPath(); for (let i = 0; i < 5; i++) { ctx.moveTo(-2 + i * 4.5, 10); ctx.lineTo(-1 + i * 4.5, 20 + (i % 2) * 5); } ctx.stroke(); });
    // mouth, then the lower beak hinged at the jaw
    fillPoly([-4, 3, 24, 2, 24, 3 + open * 26, -2, 7], '#2A1418', 0);
    ctx.save(); ctx.translate(-4, 4); ctx.rotate(open); ctx.translate(4, -4);
    const jaw = [-8, 3, 18, 2.4, 25, 3.4, 24, 7, 14, 11, 0, 11, -8, 8];
    fillPoly(jaw, shade(skin, -.12), 0); detPoly([-8, 6, 24, 5.4, 24, 7, 14, 11, 0, 11, -8, 8], shade(skin, -.4));
    fillPoly([14, 2.6, 25, 3.4, 24, 7, 15, 9], pal.rim, 0); detPoly([15, 6, 24, 6, 24, 7, 15, 9], shade(pal.rim, -.35));
    poly(jaw); outline(1.3);
    ctx.restore();
    // the skull: a heavy, wedge-shaped head with a hooked beak
    const skull = () => { ctx.beginPath(); ctx.moveTo(-12, -6); ctx.quadraticCurveTo(-6, -17, 7, -16); ctx.lineTo(14, -14.5); ctx.quadraticCurveTo(21, -12, 25, -6); ctx.quadraticCurveTo(30, -2.5, 28.5, 4.5); ctx.lineTo(25.5, 2); ctx.quadraticCurveTo(22, 3.2, 17, 3); ctx.lineTo(3, 3.6); ctx.quadraticCurveTo(-6, 8, -13, 3); ctx.closePath(); };
    skull(); ctx.fillStyle = C(skin); ctx.fill();
    clipIn(skull, () => {
      ctx.fillStyle = shade(skin, -.32); poly([-16, -2, 10, -3, 30, 0, 30, 8, -16, 8]); ctx.fill(); // the jaw and cheek in shadow
      ctx.fillStyle = shade(skin, .18); poly([-6, -18, 14, -17, 22, -11, 10, -11, -2, -10]); ctx.fill(); // lit crown
      // big head scales
      ctx.strokeStyle = shade(skin, -.45); ctx.lineWidth = .9; ctx.beginPath();
      ctx.moveTo(-2, -15); ctx.lineTo(1, -9); ctx.lineTo(-6, -5); ctx.moveTo(1, -9); ctx.lineTo(9, -10.5); ctx.moveTo(-6, -5); ctx.lineTo(-10, 1); ctx.moveTo(-2, -4); ctx.lineTo(4, -2); ctx.lineTo(3, 3); ctx.stroke();
      ctx.fillStyle = shade(skin, -.22); for (const [x, y] of [[-8, -1], [-4, 1], [-9, 3], [0, 0]]) { ell(x, y, 1.6, 1.1); ctx.fill(); }
      dots([-10, -6, .7, .5, -7, -9, .6, .5, -3, -11, .7, .5, 4, -13, .6, .4, 8, -2, .7, .5, 12, -1, .6, .5, 6, 1, .5, .4, -6, -2.5, .5, .4, 16, -6, .6, .4], shade(skin, -.38)); // pebbled hide
      dots([-6, -13, .7, .4, 2, -15.2, .8, .4, 9, -14.6, .6, .3], shade(skin, .42));
      ctx.strokeStyle = shade(skin, -.45); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(3, -4); ctx.quadraticCurveTo(8, -2.6, 14, -4.4); ctx.moveTo(4, -2); ctx.quadraticCurveTo(9, -.6, 13, -2); ctx.moveTo(15.4, -9); ctx.quadraticCurveTo(17.4, -7, 16.6, -4.6); ctx.stroke(); // the creases under the eye
      const g = ctx.createLinearGradient(0, -16, 0, 4); g.addColorStop(0, 'rgba(255,246,220,.12)'); g.addColorStop(.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(14,8,6,.28)'); ctx.fillStyle = g; ctx.fillRect(-16, -18, 48, 24);
    });
    // the horn-colored beak sheath
    const beak = [15, -14, 21, -11.5, 25, -6, 30, -2.5, 28.5, 4.5, 25.5, 2, 17, 3, 18, -4];
    fillPoly(beak, pal.rim, 0); detPoly([18, -4, 28, -2, 28.5, 4.5, 25.5, 2, 17, 3], shade(pal.rim, -.32));
    if (DET()) { line([17, -12.6, 22, -10, 25.4, -5.2], shade(pal.rim, .45), .9); line([20, -8, 21, -2], shade(pal.rim, -.4), .7); }
    skull(); outline(1.5);
    ctx.fillStyle = C('#1A1012'); ell(24.4, -6.4, 1.2, .7, .4); ctx.fill(); // nostril
    // deep-set glowing eye under a heavy brow plate
    fillPoly([5, -9.6, 14, -10.4, 13.6, -6, 6, -5.6], '#1A1214', 0);
    const blink = !a.hurt && !wind && !atk && (t % 5.3) > 5.12, ey = a.hurt ? .35 : blink ? .12 : 1, eg = 1 + wind * .8; // (a slow blink now and then)
    glow(eyeCol, (rage ? 14 : 9) * eg, () => { ctx.fillStyle = C(eyeCol); ctx.beginPath(); ctx.moveTo(6.4, -7.6); ctx.quadraticCurveTo(10, -9.6 * ey - (1 - ey) * 7.6, 13.4, -8.2); ctx.quadraticCurveTo(10, -6.4, 6.4, -7.6); ctx.closePath(); ctx.fill(); });
    if (!a.hurt && !blink) { ctx.fillStyle = C('#2A1408'); ell(10.6, -7.9, .6, 1.1); ctx.fill(); if (DET()) { ctx.fillStyle = 'rgba(255,255,240,.9)'; circle(11.4, -8.6, .38); ctx.fill(); } }
    if (wind) add(() => { const g = ctx.createRadialGradient(10, -8, 0, 10, -8, 10); g.addColorStop(0, `rgba(255,220,140,${.5 * wind})`); g.addColorStop(1, 'rgba(255,160,80,0)'); ctx.fillStyle = g; circle(10, -8, 10); ctx.fill(); });
    fillPoly([3, -11.5, 9, -14, 15.6, -12.4, 14.4, -9.4, 6, -9.2], shade(skin, -.08), 1.1); // brow
    if (DET()) line([5, -11.4, 9, -13.2, 15, -11.8], shade(skin, .35), .8);
    ctx.fillStyle = C(pal.lichen); ell(-4, -12, 2.6, 1.3, -.3); ctx.fill(); ell(2, -14.6, 1.6, .8); ctx.fill(); // lichen
    // the near horn
    horn(-2, -12, -14, -24, -6, -44, 8, 1.4, pal.rim, 5, 1.3);
    if (pal.tip && DET()) { ctx.fillStyle = pal.tip; circle(-6, -44, 1.6); ctx.fill(); }
    ctx.restore();
  }
  function mossLeg(x, p, col, ph, walking, bob, pal) {
    const s = Math.sin(ph + p * 3), lift = walking ? Math.max(0, Math.cos(ph + p * 3)) * 4 : 0;
    const fx = x + s * 7, kx = x + s * 3 + 3, ky = -17 - lift * .5 + bob * .5;
    seg(x, -30 + bob, kx, ky, 22, 17, col, 1.6);
    seg(kx, ky, fx, -6 - lift, 17, 16, col, 1);
    // big armored scales down the front of the leg
    for (let i = 0; i < 5; i++) {
      const u = (i + .5) / 5, sx = u < .5 ? lerp2(x, kx, u * 2) : lerp2(kx, fx, u * 2 - 1), sy = u < .5 ? lerp2(-30 + bob, ky, u * 2) : lerp2(ky, -6 - lift, u * 2 - 1);
      const scale = () => { ctx.beginPath(); ctx.moveTo(sx + 1, sy - 2); ctx.lineTo(sx + 9.4, sy - 2.6); ctx.quadraticCurveTo(sx + 9, sy + 2.6, sx + 5, sy + 3); ctx.quadraticCurveTo(sx + 1.4, sy + 2.4, sx + 1, sy - 2); ctx.closePath(); };
      scale(); ctx.fillStyle = C(shade(col, .12)); ctx.fill();
      clipIn(scale, () => { ctx.fillStyle = shade(col, -.2); ctx.fillRect(sx, sy + .8, 12, 4); ctx.fillStyle = shade(col, .4); ctx.fillRect(sx + 6.4, sy - 3, 3, 1.4); });
      scale(); outline(.8);
    }
    if (DET()) { ctx.strokeStyle = shade(col, -.42); ctx.lineWidth = .8; ctx.beginPath(); for (let i = 0; i < 3; i++) { const yy = ky - 2 + i * 4; ctx.moveTo(kx - 7, yy); ctx.quadraticCurveTo(kx - 3, yy + 2, kx + 1, yy); } ctx.stroke();
      dots([x - 6, -24 + bob, .7, .5, x - 3, -20 + bob, .6, .5, kx - 6, ky + 4, .7, .5, kx - 4, ky + 8, .6, .4, fx - 4, -10 - lift, .6, .4], shade(col, -.36));
      const g = ctx.createLinearGradient(0, -31 + bob, 0, -18 + bob); g.addColorStop(0, 'rgba(12,8,6,.55)'); g.addColorStop(1, 'rgba(12,8,6,0)'); // the shadow of the shell's rim on the top of the leg
      poly([x - 9.5, -31 + bob, x + 9.5, -31 + bob, kx + 7, ky, kx - 7, ky]); ctx.fillStyle = g; ctx.fill(); }
    // the broad foot and its blunt ivory nails
    ell(fx + 1, -4 - lift, 11, 4.6); ctx.fillStyle = C(shade(col, -.12)); ctx.fill(); outline(1.2);
    for (let c = 0; c < 3; c++) horn(fx + 2 + c * 4, -5 - lift, fx + 6 + c * 4, -5 - lift, fx + 8 + c * 4, -lift, 4.4, 1.2, pal.rim, 0, 1);
  }
  function tuckedShell(e, a, pal, phase, rage, t, runeCol) { // the roll: legs and head drawn in, a spinning boulder of shell
    const cx = 0, cy = -37, R = 43;
    circle(cx, cy, R); ctx.fillStyle = C(pal.seam); ctx.fill();
    const sh = shellPlates(cx, cy, R, R, cx + 3, cy - 3, false, pal, .13, runeCol, rage ? .9 : .5);
    // the plastron's bone band across the ball, with holes where the legs and head were drawn in
    ctx.save(); circle(cx, cy, R); ctx.clip();
    fillPoly([-40, cy - 4, 40, cy - 6, 40, cy + 4, -40, cy + 6], pal.rim, 1.3);
    detPoly([-40, cy + 1, 40, cy - 1, 40, cy + 4, -40, cy + 6], shade(pal.rim, -.3));
    for (const x of [-30, -12, 12, 30]) { ell(x, cy + (x > 0 ? -1 : 1), 4.5, 3.2); ctx.fillStyle = C('#140C0C'); ctx.fill(); }
    ctx.restore();
    glow(rage ? '#FF7A3A' : pal.eye, 8, () => { ctx.fillStyle = C(rage ? '#FF9A5A' : pal.eye); ell(31, cy - 1.4, 1.8, .9); ctx.fill(); });
    mossPatch(sh, 14, 19, pal, t, 0);
    orbShade(() => circle(cx, cy, R), cx + 16, cy - 20, R * 1.25, .3, .55);
    if (phase >= 2) for (let k = 0; k < 24; k += 3) { const [bx, by] = sh.P(k, .98), an = Math.atan2(by - cy, bx - cx); horn(bx, by, bx + Math.cos(an) * 8, by + Math.sin(an) * 8, bx + Math.cos(an - .5) * 14, by + Math.sin(an - .5) * 14, 5, .6, pal.thorn, 0, 1); }
    circle(cx, cy, R); outline(2.4);
    canopy([[-6, cy - R - 2, 9], [6, cy - R - 4, 8], [0, cy - R - 8, 7]], pal, t, 1.4);
  }
  CREATURES.mossback = function (e, a) {
    a = a || {};
    const t = a.t || 0, ph = a.walk || 0, rage = !!e.enraged, phase = Math.min(3, Math.max(1, e.phase || 1)), wind = a.wind || 0, atk = !!a.atk;
    const pal = MOSS_PAL[phase], P3 = phase === 3;
    const eyeCol = rage ? '#FF9A5A' : pal.eye;
    const runeCol = rage ? '#FF8A4A' : pal.rune, runeA = (rage ? .95 : P3 ? .85 : phase === 2 ? .7 : .55) + Math.sin(t * 2.4) * .12 + wind * .3;
    ctx.save(); ctx.scale(1.3, 1.3); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (e.state === 'dash' && e.plan === 'roll') { tuckedShell(e, a, pal, phase, rage, t, runeCol); ctx.restore(); return; }
    // the sweep (the red ring round him) is a jumping stomp, not a bite: he crouches, heaves his whole bulk up off the ground
    // (his shadow stays below), hangs, and comes crashing down on the ring, then squats from the impact
    const stomp = e.plan === 'sweep' && (e.state === 'wind' || e.state === 'strike');
    // the bramble burst is dug up: he drives his beak into the earth and claws at it, flinging sod behind him, then rears
    // back tearing the roots loose as the thorns rip up out of the ground around him
    const dig = e.plan === 'bramble' && (e.state === 'wind' || (e.state === 'recover' && e.t > .55));
    if (stomp) {
      if (e.state === 'wind') { const k = wind;
        const hop = k < .35 ? 0 : k < .82 ? ease((k - .35) / .47) * 44 : 44 * (1 - Math.pow((k - .82) / .18, 2));
        const sq = k < .35 ? ease(k / .35) * .12 : k < .5 ? .12 * (1 - (k - .35) / .15) - .06 * ((k - .35) / .15) : -.06 * (1 - Math.min(1, (k - .5) / .3));
        ctx.translate(0, -hop); ctx.scale(1 + sq * .6, 1 - sq);
      } else { const q = Math.min(1, e.t / .3); ctx.scale(1 + .14 * q, 1 - .16 * q); } // the landing squash
      a = Object.assign({}, a, { wind: 0, atk: false }); // the head stays in, the mouth shut
    } else if (dig) {
      if (e.state === 'wind') { const k = Math.min(1, wind / .3), pitch = .26 * ease(k) + (wind > .3 ? Math.sin(t * 26) * .035 : 0); // nose down into the ground, worrying at it
        ctx.translate(46, 0); ctx.rotate(pitch); ctx.translate(-46, 0); if (wind > .3) ctx.translate(Math.sin(t * 31) * 1.2, 0);
        a = Object.assign({}, a, { wind: 0, atk: wind > .3 });
      } else { const q = Math.min(1, (e.t - .55) / .65); // reared back, the torn roots coming up with him
        ctx.translate(-30, 0); ctx.rotate(-.2 * q); ctx.translate(30, 0); a = Object.assign({}, a, { wind: 0, atk: true }); }
    }
    const walking = !!a.walk, bob = walking ? -Math.abs(Math.sin(ph)) * 1.4 : Math.sin(t * 1.6) * .6;
    const lunge = stomp ? -4 : dig ? 8 : atk ? 22 : wind ? -10 * wind : Math.sin(t * 1.6) * 2;
    // the stone-plated tail
    const tw = Math.sin(t * 2) * 3;
    seg(-98, -14 + tw, -78, -18 + tw * .6, 4, 10, pal.skin, .6); seg(-78, -18 + tw * .6, -52, -24 + bob, 10, 17, pal.skin, 1);
    for (let i = 0; i < 4; i++) { const u = i / 4, x = lerp2(-56, -92, u), y = lerp2(-31 + bob, -19 + tw, u) - (1 - u) * 1.5; fillPoly([x - 4, y + 2, x, y - 5 + u * 2, x + 4, y + 2], shade(pal.plate, .05 - u * .1), 1); }
    // far legs, darker for being further away, then the neck coming from under the shell
    mossLeg(-30, 1, shade(pal.skin, -.24), ph, walking, bob, pal);
    mossLeg(30, 0, shade(pal.skin, -.24), ph, walking, bob, pal);
    seg(38, -28 + bob, 58 + lunge, -36 + bob, 25, 19, pal.skin, 2.2);
    if (DET()) { ctx.strokeStyle = shade(pal.skin, -.4); ctx.lineWidth = .9; ctx.beginPath(); for (let i = 0; i < 4; i++) { const x = 44 + i * 4 + lunge * (i / 5); ctx.moveTo(x, -38 + bob); ctx.quadraticCurveTo(x + 2.5, -30 + bob, x, -22 + bob); } ctx.stroke(); }
    // the shell: a high dome of scutes
    const cx = 0, cy = -33 + bob, rx = 64, ry = 50;
    const dome = () => { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, 0); ctx.closePath(); };
    dome(); ctx.fillStyle = C(pal.seam); ctx.fill();
    const sh = shellPlates(cx, cy, rx, ry, cx + 4, cy - 24, true, pal, .02, runeCol, runeA);
    if (phase >= 2) { // cracks split the shell (in phase three they glow like a kiln)
      const cr = [[-38, -60, -30, -52, -33, -44, -26, -38], [12, -78, 16, -70, 10, -62, 14, -54], [40, -58, 34, -52, 38, -44], [-12, -48, -4, -44, -8, -38]];
      const draw = () => { ctx.beginPath(); for (const c of cr) { ctx.moveTo(c[0], c[1] + bob); for (let i = 2; i < c.length; i += 2) ctx.lineTo(c[i], c[i + 1] + bob); } };
      draw(); ctx.strokeStyle = C('#140C0A'); ctx.lineWidth = 2.2; ctx.stroke();
      if (pal.crack) glow(pal.crack, 10, () => { draw(); ctx.globalAlpha = .75 + .25 * Math.sin(t * 4); ctx.strokeStyle = C(pal.crack); ctx.lineWidth = 1.1; ctx.stroke(); });
    }
    mossPatch(sh, 13, 17, pal, t, 0); mossPatch(sh, 18, 21, pal, t, .04); mossPatch(sh, 8, 11, pal, t, .02);
    { // cushions of moss heaped along the crown of the shell, each one a little inked mound, shaded and lit
      const md = []; for (const [th, r] of [[3.42, 5.4], [3.7, 6.6], [4.02, 7], [4.36, 6], [4.62, 4.6], [5.3, 4.4]]) md.push([cx + Math.cos(th) * (rx - 3), cy + Math.sin(th) * (ry - 3), r, th]);
      ctx.strokeStyle = FLASH ? '#FFFFFF' : OUT; ctx.lineWidth = 2.4; for (const [x, y, r, th] of md) { clump(x, y, r, 8, th * 3); ctx.stroke(); }
      ctx.fillStyle = C(shade(pal.moss, -.12)); for (const [x, y, r, th] of md) { clump(x, y, r, 8, th * 3); ctx.fill(); }
      if (DET()) { ctx.fillStyle = shade(pal.moss, .22); for (const [x, y, r, th] of md) { clump(x + r * .2, y - r * .25, r * .62, 7, th * 5); ctx.fill(); }
        const hi = []; for (const [x, y, r] of md) hi.push(x + r * .4, y - r * .5, r * .26, r * .16); dots(hi, shade(pal.moss, .55)); }
    }
    orbShade(dome, cx + 24, cy - 44, 92, .26, .5);
    if (DET()) { const g = ctx.createLinearGradient(0, cy - 16, 0, cy); g.addColorStop(0, 'rgba(10,8,4,0)'); g.addColorStop(1, 'rgba(10,8,4,.5)'); dome(); ctx.fillStyle = g; ctx.fill(); } // the dome darkens down into the rim
    // glowing mushrooms in the moss (more of them, and bigger, as the fungus takes him over)
    for (const [x, y, s] of [[-44, -64, 1], [-38, -66, .7], [46, -60, .8], ...(phase >= 2 ? [[-20, -80, .9], [30, -76, 1.1], [52, -50, .7]] : []), ...(P3 ? [[-52, -48, 1.2], [8, -84, .8], [38, -70, .9]] : [])]) {
      ctx.fillStyle = C('#D8CFB8'); ctx.fillRect(x - .8 * s, y + bob, 1.6 * s, 4 * s);
      glow(pal.capGlow, 8, () => { ctx.beginPath(); ctx.ellipse(x, y + bob, 3.6 * s, 2.6 * s, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = C(rage ? '#FFB07A' : pal.cap); ctx.fill(); });
    }
    if (phase >= 2) for (let i = 0; i < 11; i++) { // thorns burst through the shell
      const an = Math.PI + (i + .5) / 11 * Math.PI, bx = cx + Math.cos(an) * (rx - 3), by = cy + Math.sin(an) * (ry - 3);
      const nx = Math.cos(an), ny = Math.sin(an), L = 13 + (i % 3) * 4;
      horn(bx, by, bx + nx * L * .6, by + ny * L * .6, bx + nx * L - ny * -5 - 5, by + ny * L, 6, .6, pal.thorn, 0, 1.1);
      if (pal.tip && DET()) { ctx.fillStyle = pal.tip; circle(bx + nx * L - ny * -5 - 5, by + ny * L, 1.1); ctx.fill(); }
    }
    dome(); outline(2.6);
    if (DET()) { ctx.strokeStyle = shade(pal.plate, .5); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(cx, cy, rx - 2.4, ry - 2.4, 0, -1.25, -.25); ctx.stroke(); } // lit rim on the dome's shoulder
    // the bone rim of the plastron
    const band = () => rrect(-67, cy - 4, 134, 9, 4);
    band(); ctx.fillStyle = C(pal.rim); ctx.fill();
    clipIn(band, () => { ctx.fillStyle = shade(pal.rim, -.35); ctx.fillRect(-70, cy + 1, 140, 6); ctx.strokeStyle = shade(pal.rim, -.5); ctx.lineWidth = .9; ctx.beginPath(); for (let x = -56; x <= 56; x += 14) { ctx.moveTo(x, cy - 4); ctx.lineTo(x + 1, cy + 5); } ctx.stroke(); ctx.fillStyle = shade(pal.rim, .4); ctx.fillRect(-60, cy - 3.4, 120, 1.2); });
    band(); outline(2);
    if (DET()) { // vines and roots trailing down off the rim of the shell, swaying as he moves
      const vc = shade(P3 ? pal.lichen : pal.moss, -.3);
      ctx.strokeStyle = vc; ctx.lineWidth = 1.3; ctx.beginPath();
      const lv = [], tips = [];
      for (const [x, l, k] of [[-56, 12, 0], [-22, 15, 2], [22, 10, 3], [56, 13, 5]]) { const sw = Math.sin(t * 1.7 + k * 1.9 + ph) * 2.2, y0 = cy - 3;
        ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + sw * .5, y0 + l * .55, x + sw, y0 + l); tips.push(x + sw, y0 + l);
        for (let m = 1; m <= 3; m++) { const u = m / 3.4, d = m % 2 ? 1.7 : -1.7; lv.push(x + sw * u * u + d, y0 + l * u, 1.9, 1.1); } }
      ctx.stroke();
      if (!P3) { dots(lv, pal.leaf[2]); const hi = []; for (let i = 0; i < lv.length; i += 4) hi.push(lv[i] + .5, lv[i + 1] - .4, .8, .4); dots(hi, pal.leaf[3]); }
      else { const sp = []; for (let i = 0; i < tips.length; i += 2) sp.push(tips[i], tips[i + 1] + 1, 1, 1); dots(sp, pal.tip); }
    }
    // near legs and the head
    mossLeg(-44, 0, pal.skin, ph, walking, bob, pal);
    mossLeg(44, 1, pal.skin, ph, walking, bob, pal);
    mossHead(a, pal, phase, rage, t, eyeCol, lunge, bob);
    // the grove on its back
    ctx.save(); ctx.translate(0, bob); grove(e, a, pal, phase, rage, t); ctx.restore();
    ctx.restore();
  };

  // ===================================================================================================
  // THE BRASS COLOSSUS, Warden of the Skyport: a walking brass fortress, a furnace for a heart behind an iris hatch, and
  // a forearm cannon fed from the drum magazine on its back by a belt of shells over its shoulder.
  // Same skeleton and pose fields as drawHumanoid: feet at 0, hips -30, shoulders -49, head -61 (scaled 1.9 here).
  // The plate is painted like the prince's steel (art_corwin.js metal()): a hot highlight where it turns to the light,
  // the brass itself, a dark band of reflected floor across the turn, warm bounce light at the far edge; every plate
  // has a bevel (lit inner rim up and right, dark inner rim down and left), rivets and engraving.
  // ===================================================================================================
  // each phase has its own palette, so it reads by colour alone (it switches at the transformation's pop):
  // 1 bright polished gold-brass, teal enamel and banner, a magenta crest, a cool blue eye; the battery folded shut;
  // 2 darker bronze with verdigris in the seams, the iris hatch half blown, the shoulder battery unfolded, an amber eye;
  // 3 heat-blued gunmetal, the breastplate peeled back on a bare furnace and its ribs, a red-hot cannon, a red eye
  const CBP = {
    1: { brass: '#C8963E', sleeve: '#A0703A', frame: '#4A3A30', legs: '#5E4226', steel: '#A4A8AE', trim: '#2EA89E', helm: '#D6A652', visor: '#A8E4FF', eye: '120,200,255', plume: '#C83C7A', cape: '#2A6E72', bore: '#FFF4A8', coil: '#3CC6C0', coilGlow: '120,255,240', cog: '#B08A52', gun: '#5A4E48', patina: null,
      fire: ['#FFF6C8', '#FFB050', '#C8502A'] },
    2: { brass: '#8E5C36', sleeve: '#6E4A30', frame: '#3E342E', legs: '#4C3826', steel: '#8A9490', trim: '#6A887C', helm: '#986440', visor: '#FFB040', eye: '255,170,60', plume: '#8A3E5A', cape: '#4A5A56', bore: '#FFF4A8', coil: '#6AA89A', coilGlow: '150,220,190', cog: '#9A7448', gun: '#4E4440', patina: '#4FB094',
      fire: ['#FFEAA8', '#FF9A3A', '#D8441E'] },
    3: { brass: '#4A4652', sleeve: '#3A3640', frame: '#221E24', legs: '#2C2830', steel: '#625E6A', trim: '#B8402E', helm: '#54505C', visor: '#FF4A30', eye: '255,60,40', plume: '#1E1618', cape: '#2A2022', bore: '#FFD0A0', coil: '#E8603A', coilGlow: '255,130,70', cog: '#6A4A40', gun: '#3A3440', patina: null,
      fire: ['#FFFFFF', '#FF8A5A', '#D8261A'] },
  };
  // corrupted (New Game+, e.cB): the brass goes to a black, bone-dry brass, the enamel to oxblood, the fire to black-violet.
  // How far is CU.L: it grows with the curse's tier and with each phase (and spreads over it on its entrance)
  const CURSED = { brass: '#4C3E3C', sleeve: '#2C2024', frame: '#160E12', legs: '#22161A', steel: '#4E4450', trim: '#6A1A26', helm: '#5A4C4E', visor: '#D060FF', plume: '#140C10', cape: '#1C1218', bore: '#F0B0FF', coil: '#8A3AC8', cog: '#4A3438', gun: '#241C24' };
  const mixHex = (a, b, k) => { const p = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)], A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
  const PAL_CACHE = {};
  function cvPal(ph, L) { // (the phase's palette, blackened by the curse: cached per phase and step of corruption)
    const q = Math.round(L * 20), key = ph * 100 + q; if (PAL_CACHE[key]) return PAL_CACHE[key];
    const B = CBP[ph], k = q / 20 * .62, o = Object.assign({}, B);
    if (q) { for (const n in CURSED) o[n] = mixHex(B[n], CURSED[n], n === 'visor' || n === 'bore' || n === 'coil' ? Math.min(1, k * 1.5) : k); o.patina = B.patina && k < .5 ? mixHex(B.patina, '#3A2A3A', k * 2) : null;
      o.eye = q > 6 ? '210,90,255' : B.eye; o.coilGlow = q > 6 ? '190,90,255' : B.coilGlow;
      o.fire = [mixHex(B.fire[0], '#F4D8FF', Math.min(1, k * 1.4)), mixHex(B.fire[1], '#A040E0', Math.min(1, k * 1.4)), mixHex(B.fire[2], '#2A0830', Math.min(1, k * 1.4))]; }
    return (PAL_CACHE[key] = o);
  }
  let CB = CBP[1], CU = null; // CU: the curse as this frame draws it (null when the machine is clean)
  // polished metal, as the prince's armour is painted: a hot highlight toward the light, the metal, a dark band of
  // reflected ground across its turn, warm bounce at the far edge
  function metalG(x0, y0, x1, y1, col, warm) {
    if (!DET()) return C(col);
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, shade(col, .58)); g.addColorStop(.14, shade(col, .26)); g.addColorStop(.36, col); g.addColorStop(.58, shade(col, -.5));
    g.addColorStop(.78, shade(col, -.28)); g.addColorStop(.92, mixHex(col, warm || '#C87A4A', .32)); g.addColorStop(1, shade(col, -.22));
    return g;
  }
  // the corruption in one plate: rust-black creeping in from its seams, crusted blooms, an ember of violet in the seam
  function corrode(path, box, seed, k) {
    const a = CU.L * (k ?? 1); if (a < .04) return;
    const burn = CU.burn > 0, pul = .55 + .45 * Math.sin(CU.t * 4.2 + seed * 3);
    ctx.lineJoin = 'round';
    path(); ctx.strokeStyle = `rgba(12,6,10,${Math.min(.85, .35 + .55 * a)})`; ctx.lineWidth = (1 + 3.2 * a) * (box ? 1 : .4); ctx.stroke();
    if (burn || (a > .25 && (seed | 0) % 3 === 0)) { path(); ctx.strokeStyle = burn ? `rgba(255,214,120,${.85 * pul})` : `rgba(${150 + 60 * pul | 0},${40 + 40 * CU.hot | 0},${170 + 50 * pul | 0},${.25 + .35 * a})`; ctx.lineWidth = .5 + .8 * a; ctx.stroke(); }
    if (!box) return;
    // pitting, and rust run down from it in streaks (fine grain, not blots)
    const n = Math.round(a * 14), w = box[2] - box[0], h = box[3] - box[1], d1 = [], d3 = [];
    for (let i = 0; i < n; i++) { const x = box[0] + hsh(seed * 13 + i) * w, y = box[1] + Math.pow(hsh(seed * 7 + i * 3), .6) * h, s = .25 + hsh(seed + i * 5) * .45 * (.6 + a);
      d1.push(x, y, s * 1.2, s); if (i % 4 === 1) d3.push(x - s * .3, y - s * .3, s * .5, s * .4); }
    dots(d1, 'rgba(20,8,12,.8)'); if (d3.length) dots(d3, burn ? 'rgba(255,230,160,.9)' : 'rgba(220,150,255,.7)');
    ctx.strokeStyle = burn ? 'rgba(160,110,40,.5)' : 'rgba(70,24,30,.5)'; ctx.lineWidth = .7; ctx.beginPath();
    for (let i = 0; i < Math.round(a * 5); i++) { const x = box[0] + hsh(seed * 3 + i * 11) * w, y = box[1] + hsh(seed * 5 + i * 7) * h * .5, l = 2 + hsh(seed + i) * h * .6 * a; ctx.moveTo(x, y); ctx.quadraticCurveTo(x + .3, y + l * .6, x - .1, y + l); }
    ctx.stroke();
  }
  // a plate: its metal, a hard shadow plane, the bevel, verdigris (phase two) or the corruption, and its outline
  function plate(path, col, g, o) {
    o = o || {};
    path(); ctx.fillStyle = g ? metalG(g[0], g[1], g[2], g[3], col) : C(col); ctx.fill();
    if (DET() && (o.sh || o.fn || (o.bw || 1.5) > .85)) { // (the bevel and the corrosion only on the larger plates: a clip each is not cheap)
      ctx.save(); path(); ctx.clip();
      if (o.sh) { poly(o.sh); ctx.fillStyle = 'rgba(18,10,8,.34)'; ctx.fill(); }
      if (o.fn) o.fn();
      const bw = o.bw || 1.5;
      ctx.lineWidth = bw; ctx.translate(-.6, .6); path(); ctx.strokeStyle = shade(col, .62); ctx.globalAlpha = .8; ctx.stroke();
      ctx.translate(1.2, -1.2); path(); ctx.strokeStyle = 'rgba(14,8,6,.6)'; ctx.globalAlpha = 1; ctx.stroke(); ctx.translate(-.6, .6);
      if (CB.patina) { path(); ctx.strokeStyle = CB.patina; ctx.globalAlpha = .7; ctx.lineWidth = 2.2; ctx.stroke(); ctx.globalAlpha = 1; }
      if (CU) corrode(path, o.box, o.seed || 1, o.ck);
      ctx.restore();
    }
    path(); outline(o.ow || 1.2);
  }
  // a toothed cog turned to ang: teeth, a lit arc on its face, spokes, a dark hub
  function cog(x, y, r, n, ang, col, ow) {
    const w = Math.PI / (n * 2) * .62;
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) { const a0 = ang + i / (n * 2) * TAU, rr = i % 2 ? r * .76 : r; ctx.lineTo(x + Math.cos(a0 - w) * rr, y + Math.sin(a0 - w) * rr); ctx.lineTo(x + Math.cos(a0 + w) * rr, y + Math.sin(a0 + w) * rr); }
    ctx.closePath(); ctx.fillStyle = DET() ? metalG(x + r, y - r, x - r, y + r, col) : C(col); ctx.fill(); outline(ow || .8);
    if (DET()) { ctx.strokeStyle = shade(col, -.5); ctx.lineWidth = .55; circle(x, y, r * .56); ctx.stroke(); ctx.beginPath(); for (let i = 0; i < 4; i++) { const a = ang + i / 4 * Math.PI; ctx.moveTo(x + Math.cos(a) * r * .5, y + Math.sin(a) * r * .5); ctx.lineTo(x - Math.cos(a) * r * .5, y - Math.sin(a) * r * .5); } ctx.stroke();
      ctx.strokeStyle = shade(col, .55); ctx.beginPath(); ctx.arc(x, y, r * .64, -1.9, -.5); ctx.stroke(); }
    circle(x, y, r * .22); ctx.fillStyle = C('#1E1612'); ctx.fill();
  }
  const rivets = (pts, r, col) => { const a = [], b = []; for (let i = 0; i < pts.length; i += 2) { a.push(pts[i], pts[i + 1], r, r); b.push(pts[i] + r * .28, pts[i + 1] - r * .3, r * .5, r * .5); }
    dots(a, C(shade(col, -.42))); if (DET()) dots(b, shade(col, .62)); };
  // ---- how far gone the machine looks, phase by phase (visual only: the fight's numbers live in world.js)
  // At each phase change it transforms: the pressure builds for a beat (it shudders, its seams go white-hot, steam leaks),
  // then the plates burst off with debris and a blast of steam and it shows its new state.
  const CV_POP = .32, CV_MAX = 1.15, CV_SPIN = [0, .5, 2.4, 7.5];
  const cvPhase = (e, ph) => (e.cvx && !e.cvx.popped ? e.cvx.from : ph);
  // how long each attack's recovery lasts (world.js execute): the drawing reads where in it the machine is
  const CV_REC = { volley: .8, groundwave: .7, mines: .8, beam: 1.4, vent: 1.1, swing: .5 };
  // steam and smoke live in a small pool of their own (no gravity, so they rise; capped, so phones stay smooth)
  function cvPuff(e, ux, uy, vx, vy, r, life, kind) {
    const pool = e.cvSm || (e.cvSm = []), cap = (typeof CROWD !== 'undefined' && CROWD) || LITE ? 12 : 28;
    if (pool.length >= cap) return;
    const s = 1.9 * (e.size || 1);
    pool.push({ x: e.x + e.facing * ux * s, z: e.z - uy * s, vx: vx * e.facing * s, vz: -vy * s, r, life, max: life, kind });
  }
  const CV_JOINTS = [[2, -54], [1, -47], [-4, -46], [4, -16], [-3, -16], [0, -30], [-10, -46], [15, -40], [-14, -38]];
  function cvBurst(e, to) { // the pop: plates, cogs and bolts fly, sparks spray, steam blasts out of every joint
    const s = 1.9 * (e.size || 1), room = () => parts.length < 420, cur = e.cB && !e.dead;
    const brassCols = cur ? ['#3A2C2E', '#2A1E22', '#6A3A5A', '#B060E0'] : to === 3 ? ['#5A5662', '#8A5A8A', '#FF8A4A', '#C8A050'] : ['#E0B870', '#C8963E', '#8E5C36', '#4FB094'];
    for (let i = 0; i < (to === 3 ? 10 : 8) && room(); i++) { const j = CV_JOINTS[i % 3 === 0 ? 1 : i % 3 === 1 ? 2 : 6];
      parts.push({ x: e.x + e.facing * (j[0] + rand(-4, 4)) * s, y: e.y + rand(-6, 6), z: e.z - (j[1] + rand(-4, 8)) * s, vx: rand(-220, 220), vy: rand(-20, 20), vz: rand(160, 340), life: 1.5, max: 1.5, col: pick(brassCols), size: rand(3.5, 6), shape: 'plate', rot: rand(0, TAU), vr: rand(-10, 10) }); }
    for (let i = 0; i < 3 && room(); i++) parts.push({ x: e.x + rand(-12, 12), y: e.y + rand(-6, 6), z: e.z + rand(60, 100), vx: rand(-160, 160), vy: rand(-15, 15), vz: rand(200, 320), life: 1.6, max: 1.6, col: pick(['#B4843E', '#8A7A6A']), size: rand(2.6, 4), shape: 'gear', rot: rand(0, TAU), vr: rand(-9, 9) });
    for (let i = 0; i < 6 && room(); i++) parts.push({ x: e.x + rand(-16, 16), y: e.y + rand(-6, 6), z: e.z + rand(50, 120), vx: rand(-200, 200), vy: rand(-15, 15), vz: rand(120, 300), life: 1.2, max: 1.2, col: '#A4A8AE', size: rand(2, 3), shape: 'bolt', rot: rand(0, TAU), vr: rand(-12, 12) });
    if (typeof burst === 'function') burst(e.x, e.y, e.z + 50 * s, cur ? ['#FFFFFF', '#D8A0FF', '#6A2090'] : to === 3 ? ['#FFFFFF', '#FF9A4A', '#FF5A3A'] : ['#FFFFFF', '#FFE2A0', '#FF9A4A'], 14, 'spark', 0, true);
    for (const j of CV_JOINTS) { const d = j[0] >= 0 ? 1 : -1; cvPuff(e, j[0], j[1], d * rand(10, 26), -rand(4, 14), rand(3, 4.6), rand(.6, .9), cur ? 'soot' : 'steam'); }
    fx.push({ kind: 'ring', x: e.x, y: e.y, z: 2, t: .45, max: .45, r: 130, col: cur ? '#3A1A40' : '#F0E6DC', flat: 1 });
    shakeMag = Math.max(shakeMag, 9); if (typeof sfx === 'function') sfx('whoosh');
  }
  // where on the machine (in its own drawing's space) the cannon's muzzle and the battery's tubes are this frame
  // (set by the drawing, read by colossusFx for the smoke of a shot)
  const MUZ = new WeakMap();
  // called each frame from updateBossRoom (boss_fx.js): the transformation clock, the machine's breath by phase, and
  // the smoke and sparks of its shots
  window.colossusFx = function (e, dt) {
    if (!e || e.def.draw !== 'colossus') return;
    const pool = e.cvSm;
    if (pool) { for (const p of pool) { p.life -= dt; p.x += p.vx * dt; p.z += p.vz * dt; p.vx *= 1 - Math.min(1, dt * 1.6); p.vz *= 1 - Math.min(1, dt * .8); } if (pool.length && pool[0].life <= 0) e.cvSm = pool.filter(p => p.life > 0); }
    if (e.dead) { e.cvx = null; return; }
    const ph = Math.min(3, Math.max(1, e.phase || 1));
    if (e.cvPh === undefined || ph < e.cvPh) e.cvPh = ph;
    if (ph > e.cvPh) { e.cvx = { t: 0, from: e.cvPh, to: ph, popped: false }; e.cvPh = ph; }
    const X = e.cvx;
    if (X) { X.t += dt;
      if (!X.popped && X.t >= CV_POP) { X.popped = true; cvBurst(e, X.to); }
      else if (!X.popped && Math.random() < dt * 24) { const j = pick(CV_JOINTS); cvPuff(e, j[0], j[1], (j[0] >= 0 ? 1 : -1) * rand(6, 14), -rand(2, 8), rand(1.8, 3), .5, 'steam'); }
      if (X.t >= CV_MAX) e.cvx = null; }
    const vph = cvPhase(e, ph), r = Math.random, s = 1.9 * (e.size || 1), cur = !!e.cB;
    // a shot: smoke from the muzzle (volley, and the beam when it lets go), the battery's tubes (mines), the dust of the slam
    const inRec = e.state === 'recover' && CV_REC[e.plan], m = MUZ.get(e);
    if (inRec && !e.cvShot) { e.cvShot = 1;
      if (m && e.plan === 'volley') { for (let i = 0; i < 5; i++) cvPuff(e, m.mx + rand(-2, 2), m.my + rand(-2, 2), rand(4, 22), -rand(2, 12), rand(2.2, 3.6), rand(.6, 1), 'smoke');
        if (parts.length < 400) for (let i = 0; i < 3; i++) parts.push({ x: e.x + e.facing * m.bx * s, y: e.y, z: e.z - m.by * s, vx: -e.facing * rand(30, 90), vy: rand(-10, 10), vz: rand(120, 200), life: 1, max: 1, col: cur ? '#4A3A44' : '#E8C070', size: 2.4, shape: 'bolt', rot: rand(0, TAU), vr: rand(-14, 14) }); }
      if (m && e.plan === 'mines') for (let i = 0; i < 6; i++) cvPuff(e, m.tx + rand(-2, 2), m.ty + rand(-2, 2), rand(-6, 6), -rand(10, 24), rand(2.4, 3.8), rand(.8, 1.2), 'smoke');
      if (e.plan === 'groundwave') for (let i = 0; i < 8; i++) cvPuff(e, rand(-6, 22), -2, rand(-20, 30), -rand(2, 10), rand(3, 5), rand(.5, .9), cur ? 'soot' : 'smoke'); }
    if (!inRec) e.cvShot = 0;
    if (inRec && e.plan === 'beam' && m && e.cvShot === 1 && hazards.some(h => h.kind === 'beam' && h.fired && !h.cMine && !h.cEcho)) { e.cvShot = 2;
      for (let i = 0; i < 7; i++) cvPuff(e, m.mx + rand(-2, 2), m.my + rand(-2, 2), rand(6, 30), -rand(2, 14), rand(2.6, 4), rand(.7, 1.1), cur ? 'soot' : 'smoke'); }
    // smoke from the stacks: light wisps, then grey, then a heavy black plume (black from the first in a cursed machine)
    if (r() < dt * [0, 1.6, 3, 6][vph]) { const x = pick([-16, -10.5]); cvPuff(e, x, x < -13 ? -74 : -79, rand(-4, 2), -rand(10, 16), vph === 3 || cur ? rand(4, 5.6) : rand(2.6, 3.8), vph === 3 ? 1.4 : 1.1, cur || vph === 3 ? 'soot' : vph === 2 ? 'smoke' : 'wisp'); }
    // steam venting from the joints, and hissing out of the louvres as the vent builds
    if (vph >= 2 && r() < dt * (vph === 3 ? 11 : 8)) { const j = pick(CV_JOINTS); cvPuff(e, j[0], j[1], (j[0] >= 0 ? 1 : -1) * rand(6, 16), -rand(2, 9), rand(2.2, 3.4), .65, 'steam'); }
    if (e.state === 'wind' && e.plan === 'vent' && r() < dt * 30) { const j = pick([[15, -40], [-14, -38], [6, -14], [-6, -14]]); cvPuff(e, j[0], j[1], (j[0] >= 0 ? 1 : -1) * rand(10, 26), -rand(0, 6), rand(2, 3.4), .45, 'steam'); }
    if (parts.length > 380) return;
    // sparks from the torn plates (violet embers off the corruption)
    if ((vph >= 2 || cur) && r() < dt * (vph === 3 ? 7 : cur ? 4 : 3.5)) parts.push({ x: e.x + e.facing * rand(-14, 2) * s, y: e.y, z: e.z + rand(28, 44) * s, vx: rand(-90, 90), vy: 0, vz: rand(60, 180), life: .5, max: .5, col: pick(cur ? ['#E0A8FF', '#9A40E0'] : vph === 3 ? ['#FFE2A0', '#FF7A3A'] : ['#FFD27A', '#FF9A5A']), size: 2, shape: 'streak', rot: 0, vr: 0 });
    // burning back: the black crust flakes off it in gold-edged scraps
    if (cur && e.cB.burn > 0 && r() < dt * 9) parts.push({ x: e.x + e.facing * rand(-14, 14) * s, y: e.y + rand(-4, 4), z: e.z + rand(20, 60) * s, vx: rand(-80, 80), vy: rand(-8, 8), vz: rand(40, 140), life: .9, max: .9, col: pick(['#1A1014', '#3A2A2E', '#FFD27A']), size: rand(2, 3.4), shape: 'plate', rot: rand(0, TAU), vr: rand(-10, 10) });
    // overdrive: it sheds bolts and scraps of plate as it goes
    if (vph === 3 && r() < dt * 1.3) parts.push({ x: e.x + e.facing * rand(-12, 12) * s, y: e.y + rand(-4, 4), z: e.z + rand(20, 50) * s, vx: rand(-60, 60), vy: rand(-8, 8), vz: rand(20, 120), life: 1, max: 1, col: pick(cur ? ['#4E4450', '#3A2C2E', '#7A3A8A'] : ['#A4A8AE', '#8A5A30', '#D08A4A']), size: rand(2, 3.2), shape: r() < .6 ? 'bolt' : 'plate', rot: rand(0, TAU), vr: rand(-10, 10) });
  };
  function cvDrawPuffs(e) { // in the creature's own space: undo the boss's place, facing and scale
    const pool = e.cvSm; if (!pool || !pool.length || FLASH || TINT) return;
    const s = 1.9 * (e.size || 1) * (e.sqx || 1);
    for (const p of pool) {
      const k = p.life / p.max; if (k <= 0) continue;
      const ux = (p.x - e.x) * e.facing / s, uy = -(p.z - e.z) / s, rr = p.r * (1.6 - k * .6);
      const al = Math.min(1, k * 2.2) * (p.kind === 'soot' ? .5 : p.kind === 'smoke' ? .4 : p.kind === 'wisp' ? .24 : .38);
      ctx.globalAlpha = al; ctx.fillStyle = p.kind === 'soot' ? '#2E2428' : p.kind === 'smoke' ? '#8A807A' : '#F2ECE6';
      circle(ux, uy, rr); ctx.fill();
      if (!LITE) { ctx.fillStyle = p.kind === 'soot' ? '#56464E' : p.kind === 'smoke' ? '#B4ACA6' : '#FFFFFF'; circle(ux + rr * .28, uy - rr * .3, rr * .55); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- the legs
  function colossusLeg(x, f, k, HIP, cr, far, down, hot, bare, spin, jit) {
    const dk = far ? -.26 : 0, brass = shade(CB.brass, dk - (hot ? .05 : 0)), legs = shade(CB.legs, dk);
    let kx, ky, ax, ay;
    if (down) { kx = x + (far ? -2 : 4); ky = -13; ax = x + (far ? -4 : 6); ay = -5; }
    else { kx = x + f * .5 + k; ky = -15 + cr * .45; ax = x + f - .6; ay = -8; }
    seg(x, HIP, kx, ky, 11.4, 8.8, legs, 1); // the dark frame of the thigh
    const pj = jit || 0;
    // the hydraulic ram behind the shin: a bright rod sliding in its dark cylinder
    limb([kx - 3.4, ky + 1 + pj, ax - 3.8, ay - 1], shade(CB.frame, dk + .1), 2.4);
    if (DET()) line([kx - 3.2, ky + 2 + pj, (kx + ax) / 2 - 3.6, (ky + ay) / 2 + pj * .5], shade(CB.steel, .45), .6);
    seg(kx, ky, ax, ay, 8.8, 7, legs, .5);
    // the cuisse (blown off in the later phases, baring the frame, a piston and the hip cog)
    const ta = Math.atan2(ky - HIP, kx - x) - Math.PI / 2, tl = Math.hypot(kx - x, ky - HIP);
    ctx.save(); ctx.translate(x, HIP); ctx.rotate(ta);
    if (bare) {
      rrect(-1.6, 2, 3.8, tl * .52, 1); ctx.fillStyle = C(shade(CB.steel, dk - .1)); ctx.fill(); outline(.9);
      line([.4, 2 + tl * .5, .4 + pj * .4, tl - 2 + pj], C(shade(CB.steel, dk + .2)), 1.4);
      if (DET()) line([1.4, 2.6, 1.4, 1 + tl * .5], shade(CB.steel, .55), .5);
      if (hot) add(() => { ctx.strokeStyle = CU ? 'rgba(200,100,255,.6)' : 'rgba(255,110,50,.6)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(-4, 1); ctx.lineTo(-3.4, tl - 2); ctx.stroke(); });
      cog(0, 0, 4.4, 8, (spin || 0) * (far ? -1 : 1), shade(CB.cog, dk), .9);
      plate(() => poly([-5.8, -.6, -2.6, -1, -3.4, 2.6, -5.4, 1.8]), brass, null, { ow: 1, bw: .8 }); // a torn stub of the plate left on its rivet
    } else {
      const cu = () => { ctx.beginPath(); ctx.moveTo(-5.8, 0); ctx.quadraticCurveTo(.4, -2.2, 6.6, -1); ctx.lineTo(6.2, tl - 3.4); ctx.quadraticCurveTo(.6, tl - .6, -4.8, tl - 2.2); ctx.closePath(); };
      plate(cu, brass, [6.6, 0, -5.8, 0], { sh: [-7, -3, -2, -3, -2.4, tl, -7, tl], box: [-5, 0, 6, tl - 2], seed: far ? 11 : 12 });
      if (DET()) { ctx.strokeStyle = shade(brass, -.5); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(-5.4, tl * .48); ctx.quadraticCurveTo(.6, tl * .4, 6.3, tl * .44); ctx.stroke(); ctx.strokeStyle = shade(brass, .45); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(-5.2, tl * .48 + .7); ctx.quadraticCurveTo(.6, tl * .4 + .7, 6.2, tl * .44 + .7); ctx.stroke(); } // a lame line across it
      rivets([3.8, 2.4, 3.8, tl - 5.2, -2.6, 1.4], .8, brass);
    }
    ctx.restore();
    // the greave: a fluted shin plate with a ridge
    const sa = Math.atan2(ay - ky, ax - kx) - Math.PI / 2, sl = Math.hypot(ax - kx, ay - ky);
    ctx.save(); ctx.translate(kx, ky); ctx.rotate(sa);
    const gv = () => poly([-3.6, 1, 5.2, 1.4, 6.6, sl - 2.4, 2, sl + .6, -3.2, sl - 1]);
    plate(gv, brass, [6.6, 0, -3.6, 0], { sh: [-4.4, 0, .2, 0, 0, sl + 1, -4.4, sl + 1], box: [-3, 1, 6, sl], seed: far ? 21 : 22 });
    if (DET()) { ctx.strokeStyle = shade(brass, -.5); ctx.lineWidth = .55; ctx.beginPath(); ctx.moveTo(2.4, 2); ctx.lineTo(3.4, sl - .6); ctx.stroke(); ctx.strokeStyle = shade(brass, .6); ctx.beginPath(); ctx.moveTo(3, 2); ctx.lineTo(4, sl - 1); ctx.stroke(); } // the flute down its middle
    rivets([4.2, 3.6, 4.8, sl - 3.2], .75, brass);
    ctx.restore();
    // the knee cop: a domed cap and a fan at its side, a bolt through it
    ctx.save(); ctx.translate(kx + 1.2, ky);
    { const fan = () => { ctx.beginPath(); ctx.moveTo(0, -1); ctx.quadraticCurveTo(6.4, -4.6, 7.4, 1); ctx.quadraticCurveTo(5, 4.4, 0, 2); ctx.closePath(); };
      plate(fan, shade(brass, -.06), [7, -4, 0, 3], { ow: 1, bw: .9 }); }
    const kc = () => circle(0, 0, 4.8);
    plate(kc, shade(brass, .06), [3.4, -3.4, -3.4, 3.4], { ow: 1.1, bw: 1, box: [-3, -3, 3, 3], seed: far ? 31 : 32, ck: 1.3 });
    if (DET()) { ctx.fillStyle = 'rgba(255,250,232,.7)'; ell(1.6, -2.2, 1.7, .8, -.6); ctx.fill(); }
    rivets([0, 0], 1.2, CB.steel);
    ctx.restore();
    // the sabaton: a heavy, segmented iron foot with a brass toe-cap
    const fx = down ? ax : x + f;
    if (down) { ctx.save(); ctx.translate(ax, ay); ctx.rotate(-1.2); ctx.translate(-fx, 0); }
    const foot = [fx - 5.2, -9, fx - 6.8, -1.4, fx - 6.8, 0, fx + 11.4, 0, fx + 11.8, -2.4, fx + 8, -5.4, fx + 3, -6.8, fx + 2.2, -9];
    plate(() => poly(foot), shade(CB.frame, dk + .1), [fx + 8, -9, fx - 4, 0], { sh: [fx - 7, -2.2, fx + 12, -2.2, fx + 12, 1, fx - 7, 1], ow: 1.1 });
    if (DET()) { line([fx - 1.6, -8.6, fx - 2, -1], shade(CB.frame, .3), .6); line([fx + 2.6, -7.4, fx + 1.8, -1], shade(CB.frame, .3), .6); } // the lames of the foot
    const toe = () => { ctx.beginPath(); ctx.moveTo(fx + 2.6, -6.6); ctx.quadraticCurveTo(fx + 9, -5.8, fx + 11.2, -2.4); ctx.lineTo(fx + 4, -2.4); ctx.closePath(); };
    plate(toe, shade(brass, .05), [fx + 10, -7, fx + 3, -2], { ow: 1, bw: .8, box: [fx + 3, -6, fx + 10, -3], seed: far ? 41 : 42 });
    if (CU && CU.L > .5 && DET()) { ctx.fillStyle = C('#140A0E'); for (const d of [0, 3.2]) { ctx.beginPath(); ctx.moveTo(fx + 9.4 - d, -2.6); ctx.quadraticCurveTo(fx + 12.6 - d, -2.4, fx + 13.4 - d, .4); ctx.quadraticCurveTo(fx + 11.6 - d, -1, fx + 8.4 - d, -1.2); ctx.closePath(); ctx.fill(); } } // the toes grown into black talons
    if (down) ctx.restore();
  }

  // ---------------------------------------------------------------- the head
  function colossusHead(hy, wind, phase, rage, t, flow, down, flare) {
    const P3 = phase === 3, L = CU ? CU.L : 0, skull = CU && phase === 3 && L > .45;
    plate(() => poly([-3, hy + 4, 4, hy + 4, 4.2, hy + 10, -2.8, hy + 10]), '#2E2622', null, { ow: 1, bw: .6 }); // neck
    if (DET()) { line([-2.6, hy + 6, 3.8, hy + 6], '#5E544E', .7); line([-2.6, hy + 8, 3.8, hy + 8], '#5E544E', .7); }
    // the crest, flowing back: horsehair, torn from phase two; in a cursed machine it hardens into a fan of black spines
    const fl = flow + (down ? 0 : Math.sin(t * 3) * 1.2);
    if (CU && L > .35) {
      const n = 5 + Math.round(L * 3);
      for (let i = 0; i < n; i++) { const u = i / (n - 1), x0 = 4 - u * 11, y0 = hy - 11.4 + u * 3.6, len = (7 + 5 * Math.sin(u * 3)) * (.7 + L * .5);
        horn(x0, y0, x0 - len * .5 - fl * .3, y0 - len * .9, x0 - len * 1.1 - fl * .6, y0 - len * .3 + u * 4, 2.2, .2, CB.plume, 0, .9); }
      if (DET()) add(() => { ctx.strokeStyle = `rgba(200,90,255,${.35 + .25 * Math.sin(t * 5)})`; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(4, hy - 11.6); ctx.quadraticCurveTo(-4, hy - 13, -8, hy - 8); ctx.stroke(); });
    } else {
      const torn = phase >= 2;
      const plume = torn ? () => { ctx.beginPath(); ctx.moveTo(4, hy - 11.6); ctx.quadraticCurveTo(-6, hy - 17, -13 - fl, hy - 12.4); ctx.lineTo(-15.6 - fl, hy - 9.4); ctx.lineTo(-12.4 - fl, hy - 8.8); ctx.lineTo(-16.4 - fl * 1.1, hy - 4.6); ctx.lineTo(-12 - fl, hy - 5.6); ctx.lineTo(-11.2, hy - 2.6); ctx.quadraticCurveTo(-9, hy - 6, -7, hy - 8); ctx.closePath(); }
        : () => { ctx.beginPath(); ctx.moveTo(4, hy - 11.6); ctx.quadraticCurveTo(-6, hy - 17, -15 - fl, hy - 12); ctx.quadraticCurveTo(-21 - fl * 1.3, hy - 8, -22 - fl * 1.5, hy - 1); ctx.lineTo(-18 - fl * 1.2, hy - 4); ctx.lineTo(-18.5 - fl * 1.2, hy + 1.5); ctx.quadraticCurveTo(-14 - fl, hy - 6, -7, hy - 8); ctx.closePath(); };
      const pc = CB.plume;
      plume(); ctx.fillStyle = C(pc); ctx.fill();
      clipIn(plume, () => { ctx.fillStyle = shade(pc, -.4); poly([-26 - fl * 2, hy - 8, 6, hy - 9.6, 6, hy + 4, -26 - fl * 2, hy + 4]); ctx.fill();
        ctx.lineWidth = .45; for (let i = 0; i < 9; i++) { const o = i * 1.1; ctx.strokeStyle = i % 3 ? shade(pc, -.45) : shade(pc, .38); ctx.beginPath(); ctx.moveTo(3 - i * 1.2, hy - 12 + o * .3); ctx.quadraticCurveTo(-8 - i, hy - 14.6 + o, -19 - fl * 1.2, hy - 9 + o * 1.3); ctx.stroke(); } }); // its horsehair, strand by strand
      plume(); outline(1.1);
      if (P3) add(() => { ctx.strokeStyle = `rgba(255,120,50,${.6 + .3 * Math.sin(t * 10)})`; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(-13 - fl, hy - 12.4); ctx.lineTo(-15.6 - fl, hy - 9.4); ctx.lineTo(-12.4 - fl, hy - 8.8); ctx.lineTo(-16.4 - fl * 1.1, hy - 4.6); ctx.lineTo(-12 - fl, hy - 5.6); ctx.stroke(); });
    }
    // the great helm: a rounded bascinet with a deep brow over the visor and cheek plates swept back
    const helm = () => { ctx.beginPath(); ctx.moveTo(-7.8, hy + 5.4); ctx.lineTo(-8.6, hy - 3); ctx.quadraticCurveTo(-7.6, hy - 11.6, 1, hy - 12.2); ctx.quadraticCurveTo(8.8, hy - 11.6, 10.2, hy - 4.4); ctx.lineTo(10.8, hy + 1.6); ctx.lineTo(8.8, hy + 6.6); ctx.lineTo(1.4, hy + 7.6); ctx.closePath(); };
    const hc = CB.helm;
    plate(helm, hc, [9, hy - 12, -7, hy + 6], { sh: [-10, hy - 13, -2.6, hy - 13, -4, hy + 9, -10, hy + 9], box: [-7, hy - 10, 9, hy + 6], seed: 51, fn: () => {
      ctx.fillStyle = 'rgba(255,252,236,.75)'; ell(5, hy - 9, 3.6, 1.1, -.25); ctx.fill(); // the shine on the dome
      if (P3) { const g = ctx.createLinearGradient(0, hy + 8, 0, hy - 6); g.addColorStop(0, 'rgba(216,176,96,.5)'); g.addColorStop(.35, 'rgba(184,112,64,.35)'); g.addColorStop(.65, 'rgba(138,74,160,.35)'); g.addColorStop(1, 'rgba(74,106,200,0)'); ctx.fillStyle = g; ctx.fillRect(-10, hy - 6, 22, 14); } // temper colours rising up the helm from the fire below
      ctx.strokeStyle = shade(hc, -.5); ctx.lineWidth = .55; ctx.beginPath(); ctx.moveTo(-8.4, hy - 4.6); ctx.quadraticCurveTo(-4, hy - 6.8, 1.4, hy - 6.2); ctx.moveTo(-8.2, hy - 2.6); ctx.quadraticCurveTo(-4, hy - 4.6, 1.4, hy - 4); ctx.stroke(); // an engraved brow band, its scrolls
      ctx.strokeStyle = shade(hc, .45); ctx.beginPath(); ctx.moveTo(-8.2, hy - 4); ctx.quadraticCurveTo(-4, hy - 6.2, 1.4, hy - 5.6); ctx.stroke();
      ctx.strokeStyle = shade(hc, -.45); ctx.beginPath(); for (let i = 0; i < 4; i++) { const x = -6.6 + i * 2.1; ctx.moveTo(x, hy - 4.2 - i * .4); ctx.quadraticCurveTo(x + .8, hy - 5.6 - i * .4, x + 1.6, hy - 4.4 - i * .4); } ctx.stroke();
      ctx.strokeStyle = shade(hc, -.4); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(-1.6, hy + 7.4); ctx.quadraticCurveTo(-2.6, hy + 1, -1, hy - 1.2); ctx.stroke(); // the cheek plate's edge
    } });
    if (skull) { // cursed, in overdrive: the faceplate gone, and under it a face of black brass like bone, a jaw of rivets for teeth
      const face = [1.2, hy - 5.6, 10.8, hy - 5, 11.2, hy + 1, 9.6, hy + 6.8, 2.2, hy + 7.4, 1, hy + 1];
      fillPoly(face, '#0C0608', 0);
      plate(() => { ctx.beginPath(); ctx.moveTo(2, hy - 5); ctx.quadraticCurveTo(7, hy - 6.4, 10.4, hy - 4.4); ctx.lineTo(10.6, hy + .4); ctx.quadraticCurveTo(8.6, hy + 1.4, 7.6, hy + 3.6); ctx.lineTo(4, hy + 3.4); ctx.quadraticCurveTo(2.6, hy + .4, 2, hy - 5); ctx.closePath(); }, '#9A8A82', [10, hy - 6, 2, hy + 3], { ow: 1, bw: .8 }); // the skull's brow and cheek
      fillPoly([5, hy - 3.8, 9.8, hy - 3.4, 9.4, hy - .2, 7.4, hy + .6, 5.6, hy - .6], '#060204', 0); fillPoly([9.6, hy + .8, 10.6, hy + 1, 10.2, hy + 2.6], '#060204', 0); // the socket, and the nose's hole
      ctx.fillStyle = C('#C8B8A8'); for (let i = 0; i < 4; i++) { rrect(4.6 + i * 1.5, hy + 3.6 + Math.sin(t * 9 + i) * .3, 1.1, 2.6, .4); ctx.fill(); outline(.4); } // teeth that chatter
      rrect(4, hy + 5.6, 7, 1.6, .6); ctx.fillStyle = C('#4A3C40'); ctx.fill(); outline(.7); // the jaw
    } else {
      // a heavy brow over the visor slit, which burns brighter as it winds up
      plate(() => poly([1, hy - 5.8, 10.6, hy - 5.4, 10.6, hy - 3.6, 1.4, hy - 3.8]), shade(hc, -.12), [10, hy - 6, 1, hy - 3], { ow: 1, bw: .7 });
      fillPoly([1.6, hy - 3.6, 10.6, hy - 3.4, 10.4, hy - .8, 2.2, hy - 1.4], '#160E10', 0);
      plate(() => { ctx.beginPath(); ctx.moveTo(2.6, hy - .6); ctx.lineTo(10.8, hy - .2); ctx.lineTo(10.6, hy + 2.2); ctx.lineTo(8.8, hy + 6.4); ctx.lineTo(2.8, hy + 7.2); ctx.quadraticCurveTo(1.8, hy + 3, 2.6, hy - .6); ctx.closePath(); }, shade(hc, .04), [10, hy - 1, 3, hy + 7], { ow: 1, bw: .8, box: [3, hy, 10, hy + 6], seed: 52 }); // the bevor, its breaths
      ctx.fillStyle = C('#1E1612'); for (let i = 0; i < 4; i++) { rrect(4.8, hy + 1.4 + i * 1.4, 5, .7, .3); ctx.fill(); }
      if (phase >= 2) { // the faceplate cracked across; in overdrive the jaw is broken open on the fire inside
        if (P3) { const jaw = [10.6, hy + 1.2, 10.4, hy + 3.4, 8.6, hy + 6.4, 6.4, hy + 7.2, 7.4, hy + 4.6];
          fillPoly(jaw, '#1A0E0C', 0); add(() => { ctx.fillStyle = `rgba(255,90,40,${.6 + .3 * Math.sin(t * 11)})`; circle(8.8, hy + 4.6, 2); ctx.fill(); });
          poly(jaw); ctx.strokeStyle = C(shade(hc, .45)); ctx.lineWidth = .8; ctx.stroke(); }
        const hk = () => { ctx.beginPath(); ctx.moveTo(5.6, hy - 11.9); ctx.lineTo(4.2, hy - 8.6); ctx.lineTo(5.8, hy - 7); ctx.lineTo(4.8, hy - 5.6); ctx.moveTo(4.2, hy - 8.6); ctx.lineTo(1.4, hy - 9.6); ctx.moveTo(8.8, hy - .8); ctx.lineTo(7.4, hy + 2.4); ctx.lineTo(8.8, hy + 4.2); ctx.lineTo(7.6, hy + 6.8); };
        hk(); ctx.strokeStyle = C('#1E1410'); ctx.lineWidth = 1.1; ctx.stroke();
        if (P3 || L > .3) glow(CU ? '#B050FF' : '#FF6A3A', 6, () => { hk(); ctx.strokeStyle = C(CU ? '#E0B0FF' : '#FFB070'); ctx.lineWidth = .5; ctx.stroke(); });
      }
    }
    // the eye: a lens in the slit (a socket's ember once it is a skull)
    const flick = phase === 2 && wind < .05 && !CU && Math.sin(t * 37) + Math.sin(t * 13.7) > .9; // (in phase two the damaged lens stutters)
    const vc = flick ? '#6A4A20' : CB.visor;
    if (skull) glow(vc, 10 + wind * 10, () => { ctx.fillStyle = C(vc); circle(7.6, hy - 2.1, 1.3 + wind * .5); ctx.fill(); });
    else glow(vc, flick ? 2 : 8 + wind * 10, () => { ctx.fillStyle = C(vc); poly([3, -2.9 + hy, 10.4, -2.7 + hy, 10.2, -1.4 + hy, 3.4, -1.8 + hy]); ctx.fill(); });
    if (DET()) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(7.6, hy - 2.6, 1.8, .6); }
    if (flare > .02) add(() => { // the lens flares: a long streak across the slit, a short one through it, a bloom
      const Lf = 12 + flare * 14, g = ctx.createLinearGradient(8 - Lf, 0, 8 + Lf, 0), fc = CU ? '200,90,255' : '255,90,60';
      g.addColorStop(0, `rgba(${fc},0)`); g.addColorStop(.5, `rgba(255,236,240,${.9 * flare})`); g.addColorStop(1, `rgba(${fc},0)`);
      ctx.fillStyle = g; ctx.fillRect(8 - Lf, hy - 2.7, Lf * 2, 1.3);
      ctx.fillStyle = `rgba(255,220,230,${.7 * flare})`; ctx.fillRect(8.1, hy - 2 - 6 * flare, .7, 12 * flare);
      ctx.fillStyle = `rgba(${fc},${.35 * flare})`; circle(8.4, hy - 2, 3 + flare * 3); ctx.fill();
    });
    if (wind > .05) add(() => { const g = ctx.createRadialGradient(8, hy - 2, 0, 8, hy - 2, 9); g.addColorStop(0, `rgba(${CB.eye},${.55 * wind})`); g.addColorStop(1, `rgba(${CB.eye},0)`); ctx.fillStyle = g; circle(8, hy - 2, 9); ctx.fill(); });
    rivets([-5, hy - 1, -5, hy + 3, -1, hy - 9], .8, hc);
    plate(() => poly([-6, hy - 10, 0, hy - 13.6, 6.4, hy - 12.2, 0, hy - 11.2]), shade(hc, .1), [6, hy - 14, -6, hy - 10], { ow: 1, bw: .6 }); // a crest ridge
  }

  // ---------------------------------------------------------------- the cannon: the forearm itself, from the elbow out
  // a breech fed from above by the belt, a revolving drum of six chambers, a radiator of cooling fins over the barrel,
  // a ram blade under it to club with, and a muzzle of four petals that opens to fire. spin turns the drum; heat
  // reddens the fins; open opens the muzzle; charge gathers light in it; kick throws it back along itself.
  function colossusCannon(o) {
    const { t, phase, heat, open, charge, spin, kick, pulling, rage } = o, P3 = phase === 3, L = CU ? CU.L : 0, gun = CB.gun;
    ctx.save(); ctx.translate(-kick * 3, 0);
    // the ram blade under the barrel (a bone-white black-brass blade, toothed, in a cursed machine)
    { const bl = () => { ctx.beginPath(); ctx.moveTo(14, 4.4); ctx.lineTo(37, 4.6); ctx.quadraticCurveTo(43.6, 5.6, 46, 9.4); ctx.quadraticCurveTo(38, 8.8, 30, 9.6); ctx.lineTo(16, 8.6); ctx.closePath(); };
      plate(bl, CU ? mixHex(CB.steel, '#B8A8A0', L * .5) : CB.steel, [0, 4, 0, 10], { ow: 1.1, bw: .8 });
      if (DET()) { line([17, 7.8, 30, 8.6, 44, 9], 'rgba(255,255,255,.75)', .5); }
      if (CU && L > .55) { ctx.fillStyle = C('#140A0E'); ctx.beginPath(); for (let i = 0; i < 5; i++) { const x = 19 + i * 4.6; ctx.moveTo(x, 9.2); ctx.lineTo(x + 1.4, 12 + (i % 2) * 1.2); ctx.lineTo(x + 2.6, 9.4); } ctx.fill(); } }
    // the breech block: the belt feeds in through its top, the spent cases come out of its side
    const breech = () => rrect(1.4, -6.2, 9.6, 12.4, 2.2);
    plate(breech, CB.frame, [6, -6.2, 6, 6.2], { box: [2, -5, 10, 5], seed: 61, fn: () => { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(4, -1.4, 4.4, 2.6); } });
    rrect(3.6, -8.4, 5, 2.8, .8); ctx.fillStyle = C(shade(CB.frame, .2)); ctx.fill(); outline(.9); // the feed throat
    rivets([2.8, -4.6, 2.8, 4.4, 9.6, -4.6, 9.6, 4.4], .6, CB.steel);
    // the drum: a cylinder seen from the side, its chamber flutes rolling past as it turns
    const drum = () => rrect(10.4, -7.6, 10.4, 15.2, 3.6);
    drum(); ctx.fillStyle = metalG(15, -7.6, 15, 7.6, CB.brass); ctx.fill();
    if (DET()) clipIn(drum, () => { const d = (spin % 1 + 1) % 1; ctx.fillStyle = 'rgba(16,8,6,.55)';
      for (let i = -1; i < 4; i++) { const ph = (i + d) / 3, y = -Math.cos(ph * Math.PI) * 7.6, w = Math.sin(ph * Math.PI) * 2.6 + .3; if (ph < 0 || ph > 1) continue; rrect(11.4, y - w / 2, 8.4, w, w / 2); ctx.fill(); }
      ctx.fillStyle = shade(CB.brass, .7); ctx.globalAlpha = .7; ctx.fillRect(11, -5.6, 9.4, .8); ctx.globalAlpha = 1;
      if (CB.patina) { ctx.strokeStyle = CB.patina; ctx.globalAlpha = .6; ctx.lineWidth = 1.6; drum(); ctx.stroke(); ctx.globalAlpha = 1; }
      if (CU) corrode(drum, [11, -6, 20, 6], 62); });
    drum(); outline(1.2);
    for (const x of [10.6, 19.4]) { rrect(x, -8.2, 1.6, 16.4, .7); ctx.fillStyle = C(shade(CB.brass, -.2)); ctx.fill(); outline(.8); }
    // the barrel, under its radiator
    const barrel = () => rrect(20, -4.2, 18, 8.4, 2);
    barrel(); ctx.fillStyle = metalG(29, -4.2, 29, 4.2, gun, '#9A6A4A'); ctx.fill(); outline(1.2);
    if (heat > .05) add(() => { barrel(); ctx.fillStyle = CU ? `rgba(190,80,255,${.5 * heat})` : `rgba(255,${100 + 40 * Math.sin(t * 9) | 0},40,${.55 * heat})`; ctx.fill(); });
    // cooling fins: thin discs standing off the barrel, glowing from the root out as it heats (one shroud plate over them
    // while it is new; blown away from phase two)
    const nf = 7;
    for (let i = 0; i < nf; i++) { const x = 22 + i * 1.9, h = 6.6 - Math.abs(i - 3) * .25;
      ctx.fillStyle = C(shade(gun, i % 2 ? -.1 : .12)); ctx.fillRect(x, -h, 1.1, h * 2);
      if (DET()) { ctx.fillStyle = 'rgba(255,246,220,.55)'; ctx.fillRect(x, -h, 1.1, 1.6); ctx.fillStyle = 'rgba(10,6,4,.45)'; ctx.fillRect(x, h - 2.2, 1.1, 2.2); } }
    if (DET()) { ctx.strokeStyle = INK; ctx.lineWidth = .5; ctx.beginPath(); for (let i = 0; i < nf; i++) { const x = 22 + i * 1.9, h = 6.6 - Math.abs(i - 3) * .25; ctx.rect(x, -h, 1.1, h * 2); } ctx.stroke(); }
    if (heat > .05) add(() => { for (let i = 0; i < nf; i++) { const x = 22 + i * 1.9, h = (6.6 - Math.abs(i - 3) * .25) * (.4 + .6 * heat); ctx.fillStyle = CU ? `rgba(200,100,255,${.7 * heat})` : `rgba(255,${150 - 60 * heat | 0},60,${.75 * heat})`; ctx.fillRect(x, -h, 1.1, h * 2); } });
    if (phase === 1 && !CU) { const sh = () => { ctx.beginPath(); ctx.moveTo(21.4, -7.4); ctx.quadraticCurveTo(29, -9.4, 36.4, -7.2); ctx.lineTo(36.4, -4.4); ctx.lineTo(21.4, -4.6); ctx.closePath(); };
      plate(sh, CB.brass, [29, -9, 29, -4], { ow: 1.1, bw: .8 }); rivets([23, -6, 28, -6.6, 34, -6], .55, CB.brass);
      if (DET()) { ctx.strokeStyle = shade(CB.brass, -.5); ctx.lineWidth = .4; ctx.beginPath(); for (let i = 0; i < 5; i++) { const x = 24.4 + i * 2.2; ctx.moveTo(x, -7.6); ctx.lineTo(x + .8, -5); } ctx.stroke(); } }
    // the magnet coils at the muzzle end (they wake for the pull)
    for (const x of [33.6, 36]) { rrect(x, -5.4, 1.8, 10.8, .8); ctx.fillStyle = C(shade(CB.coil, -.2)); ctx.fill(); outline(.8);
      if (DET()) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(${CB.coilGlow},${pulling ? .85 : .2 + .5 * charge})`; ctx.fillRect(x + .3, -5, 1.2, 10); ctx.restore(); } }
    // the muzzle: a crown of four petals round the bore; they part to fire (in a cursed machine they are teeth)
    ctx.save(); ctx.translate(39, 0);
    const bc = rage ? '#FFD0A0' : CB.bore, br = 2.6 + open * 1.8 + charge * 1.2;
    glow(CU ? '#B050FF' : rage ? '#FF7A4A' : '#FFE27A', 5 + charge * 14, () => { ell(1, 0, 1.2 + open, br); ctx.fillStyle = C(charge > .05 || open > .2 ? bc : shade(gun, -.4)); ctx.fill(); });
    for (const sgn of [-1, 1]) for (const k of [0, 1]) { // two petals above, two below, the outer pair splaying wider
      const ang = sgn * (open * (.5 + k * .35)), len = 6.4 - k * 1.2, w0 = 3 - k * .4;
      ctx.save(); ctx.translate(-1, sgn * (1.6 + k * 1.6)); ctx.rotate(ang);
      const pet = () => { ctx.beginPath(); ctx.moveTo(0, -sgn * w0 * .3); ctx.lineTo(len * .7, -sgn * w0 * .5); ctx.quadraticCurveTo(len * 1.05, 0, len * (CU && L > .5 ? 1.3 : .95), sgn * w0 * .6); ctx.lineTo(0, sgn * w0); ctx.closePath(); };
      plate(pet, k ? shade(CB.brass, -.15) : CB.brass, [0, -sgn * 3, 0, sgn * 3], { ow: 1, bw: .7 });
      ctx.restore(); }
    if (charge > .02) add(() => { // the charge: light drawn in toward the bore, a ball of it swelling there
      const R = 6 + charge * 16, g = ctx.createRadialGradient(3, 0, 0, 3, 0, R); g.addColorStop(0, `rgba(255,250,240,${.9 * charge})`); g.addColorStop(.3, CU ? `rgba(200,110,255,${.7 * charge})` : `rgba(255,170,120,${.7 * charge})`); g.addColorStop(1, 'rgba(255,90,90,0)');
      ctx.fillStyle = g; circle(3, 0, R); ctx.fill();
      ctx.strokeStyle = CU ? `rgba(220,160,255,${.7 * charge})` : `rgba(255,220,190,${.7 * charge})`; ctx.lineWidth = .7; ctx.beginPath();
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t * 3, q = ((t * 2.4 + i * .37) % 1), d = 22 * (1 - q) + 3; ctx.moveTo(3 + Math.cos(a) * d, Math.sin(a) * d * .7); ctx.lineTo(3 + Math.cos(a) * (d - 4), Math.sin(a) * (d - 4) * .7); } ctx.stroke(); });
    ctx.restore();
    if (pulling) add(() => { // a magnetic field reaches out from the muzzle
      ctx.strokeStyle = CU ? 'rgba(200,140,255,.85)' : 'rgba(159,216,232,.85)'; ctx.lineWidth = 1.4;
      for (let i = 0; i < 4; i++) { const k = (t * 2.4 + i / 4) % 1, x = 70 - k * 26; ctx.globalAlpha = Math.sin(k * Math.PI); ctx.beginPath(); ctx.ellipse(x, 0, 3 + (1 - k) * 4, 6 + (1 - k) * 10, 0, Math.PI * .5, Math.PI * 1.5, true); ctx.stroke(); }
    });
    if (kick > .05) add(() => { const g = ctx.createRadialGradient(44, 0, 0, 44, 0, 8 + kick * 10); g.addColorStop(0, `rgba(255,255,240,${kick})`); g.addColorStop(.4, CU ? `rgba(210,120,255,${.8 * kick})` : `rgba(255,190,90,${.8 * kick})`); g.addColorStop(1, 'rgba(255,120,60,0)'); ctx.fillStyle = g; circle(44, 0, 8 + kick * 10); ctx.fill();
      ctx.fillStyle = `rgba(255,250,230,${kick * .9})`; poly([41, -1.2, 58 + kick * 10, 0, 41, 1.2]); ctx.fill(); poly([42, -1, 50, -6 * kick - 2, 44, 0]); ctx.fill(); poly([42, 1, 50, 6 * kick + 2, 44, 0]); ctx.fill(); }); // the muzzle flash
    ctx.restore();
  }
  // the belt of shells from the drum magazine on its back, over its shoulder, into the breech; it feeds as it fires
  // (in a cursed machine, past the middle of the corruption, the shells are vertebrae: a spine)
  function ammoBelt(ax, ay, cx, cy, bx, by, feed) {
    const n = 13, L = CU ? CU.L : 0, bone = CU && L > .5;
    const P = (u) => { const iu = 1 - u; return [iu * iu * ax + 2 * iu * u * cx + u * u * bx, iu * iu * ay + 2 * iu * u * cy + u * u * by]; };
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(cx, cy, bx, by);
    ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.stroke(); ctx.strokeStyle = C(bone ? '#1A1014' : '#3A2C24'); ctx.lineWidth = 2; ctx.stroke();
    const f = (feed % 1 + 1) % 1;
    for (let i = 0; i < n; i++) { const u = (i + f) / n; if (u > .97) continue; const [x, y] = P(u), [x2, y2] = P(Math.min(1, u + .01)), a = Math.atan2(y2 - y, x2 - x);
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      if (bone) { ell(0, 0, 1.1, 2.6); ctx.fillStyle = C(mixHex('#6A5A5C', '#B8A8A0', .4)); ctx.fill(); outline(.6); ctx.fillStyle = C('#1A1014'); ctx.beginPath(); ctx.moveTo(-.6, -2.4); ctx.lineTo(0, -4.4); ctx.lineTo(.6, -2.4); ctx.fill(); }
      else { rrect(-.75, -2.6, 1.5, 3.4, .5); ctx.fillStyle = C(CB.brass); ctx.fill(); outline(.45); ctx.fillStyle = C(shade(CB.steel, -.1)); ctx.beginPath(); ctx.moveTo(-.75, -2.6); ctx.quadraticCurveTo(0, -4, .75, -2.6); ctx.fill(); if (DET()) { ctx.fillStyle = 'rgba(255,250,230,.7)'; ctx.fillRect(.05, -2.2, .4, 2.4); } }
      ctx.restore(); }
  }

  CREATURES.colossus = function (e, a) {
    a = a || {};
    // (phase here is the phase it looks like: during a transformation it holds the old one until the plates burst)
    const pose = a.pose || {}, t = a.t || 0, rage = !!e.enraged, phase = cvPhase(e, Math.min(3, Math.max(1, e.phase || 1))), wind = a.wind || 0, P3 = phase === 3;
    const X = e.cvx, pre = X && !X.popped ? X.t / CV_POP : 0, post = X && X.popped ? Math.max(0, 1 - (X.t - CV_POP) / (CV_MAX - CV_POP)) : 0;
    // the curse, as this frame draws it
    const B = e.cB;
    if (B && !e.dead) {
      const grow = Math.min(1, (B.age || 0) / 3.2), g2 = grow * grow * (3 - 2 * grow), bt = Math.max(1, Math.min(4, B.bt | 0));
      const L = Math.min(1, (.18 + .17 * (bt - 1) + .21 * (phase - 1) + (B.surge ? .15 : 0)) * g2);
      const open = B.open > 0 && B.burn <= 0; if (open && !e.cvOt) e.cvOt = t; if (!open) e.cvOt = 0;
      CU = { L, bt, t, burn: B.burn > 0 ? Math.min(1, B.burn / .6) : 0, kw: B.wind > 0 ? 1 - B.wind / .8 : 0, ko: open ? Math.min(1, Math.max(0, (t - e.cvOt) / .28)) : 0, pts: B.pts || 0, need: bt >= 4 ? 4 : 3, hot: 0, surge: !!B.surge };
    } else CU = null;
    const sdir = CU ? -1 : 1; // (the curse grinds its cogs backwards, and they stutter)
    const spin = sdir * (t * CV_SPIN[phase] + (CU ? .35 * Math.sin(t * 6) : 0)), shake = e.dead ? 0 : Math.max(pre * 1.4, post * .9, P3 ? .3 : 0, CU ? CU.kw * .8 : 0);
    const jx = shake * Math.sin(t * 61), jy = shake * Math.cos(t * 47) * .6;
    const st = e.state, plan = e.plan, planWind = st === 'wind', pulling = st === 'pull';
    const rec = st === 'recover' && CV_REC[plan] ? Math.max(0, CV_REC[plan] - (e.t || 0)) : -1; // seconds since the attack went off
    // the beam's charge and shot: read off its hazard (it fires .9s after the machine lets it go)
    let bch = 0, bfire = 0;
    if (plan === 'beam' && (st === 'recover' || st === 'wind') && typeof hazards !== 'undefined') { if (st === 'wind') bch = wind * .4;
      else for (const h of hazards) if (h.kind === 'beam' && !h.cMine && !h.cEcho) { if (h.t > .35) bch = Math.max(bch, .4 + .6 * (1 - (h.t - .35) / Math.max(.01, h.max - .35))); else if (h.t > 0) bfire = Math.max(bfire, h.t / .35); } }
    ctx.save();
    // the Circle's ring closing on it while a cursed attack winds (on the floor, under it: a black ring of rust, an ember line)
    if (CU && CU.kw > 0 && !FLASH && !TINT) { const q = 1 - CU.kw, sz = e.size || 1, R = (e.hw * .9 + 30 + 90 * q) / sz;
      ctx.lineWidth = 7 / sz; ctx.strokeStyle = `rgba(8,4,8,${.85 * (1 - q * .5)})`; ell(0, 0, R, R * .3); ctx.stroke();
      ctx.lineWidth = 1.6 / sz; ctx.strokeStyle = `rgba(190,60,230,${.6 + .3 * Math.sin(t * 14)})`; ell(0, 0, R, R * .3); ctx.stroke();
      ctx.strokeStyle = 'rgba(12,6,10,.7)'; ctx.lineWidth = 1.2 / sz; ctx.beginPath(); for (let i = 0; i < 10; i++) { const an = i / 10 * TAU + .3, r0 = R * .55, r1 = R; ctx.moveTo(Math.cos(an) * r0, Math.sin(an) * r0 * .3); ctx.lineTo(Math.cos(an + .08) * (r0 + r1) / 2, Math.sin(an + .08) * (r0 + r1) / 2 * .3); ctx.lineTo(Math.cos(an) * r1, Math.sin(an) * r1 * .3); } ctx.stroke(); }
    ctx.scale(1.9, 1.9); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const walk = pose.walk || 0, sw = Math.sin(walk), down = !!pose.down;
    if (pose.rot) { ctx.translate(0, -34); ctx.rotate(pose.rot); ctx.translate(0, 34); }
    if (down) { ctx.translate(-6, -4); ctx.rotate(-1.5); }
    // the attack poses: the cannon arm (arm), the fist (bArm), a crouch (crK) and a lean, beat by beat
    let arm = pose.arm ?? (1.1 - sw * .35), bArm = pose.backArm ?? (1.25 + sw * .4), crK = pose.crouch ? 8 : 0, lean = pose.lean || 0;
    let heat = P3 ? .35 : 0, open = 0, charge = 0, dspin = 0, kick = 0, feed = 0, batUp = 0, batFire = 0, louv = 0;
    if (!down && !e.dead) {
      if (st === 'idle' || (st === 'recover' && rec < 0)) arm = .32 - sw * .14;
      if (planWind) {
        const w = Math.min(1, wind * 1.5);
        if (plan === 'swing') arm = lerp2(.3, -2.2, w);
        else if (plan === 'volley') { arm = .1; dspin = wind * 3; open = wind; charge = wind * .25; heat = Math.max(heat, wind * .4); }
        else if (plan === 'beam') { arm = .18; open = wind * .7; charge = bch; heat = Math.max(heat, wind * .6); crK = 3 * w; }
        else if (plan === 'mines') { arm = .55; batUp = w; crK = 2 * w; }
        else if (plan === 'groundwave') { arm = lerp2(.3, -1.9, w); bArm = lerp2(1.2, -2.3, w); crK = -1.5 * w; lean = -.15 * w; }
        else if (plan === 'vent') { arm = lerp2(.3, .95, w); bArm = lerp2(1.2, 1.7, w); crK = 4 * w; louv = w; }
        else if (plan === 'magnet') { arm = .05; open = wind; }
      }
      if (rec >= 0) {
        if (plan === 'volley') { const k = Math.max(0, 1 - rec / .28); arm = .1 - k * .3; kick = k; dspin = 3 + rec * 4; feed = rec * 3; open = Math.max(0, 1 - rec / .5); heat = Math.max(heat, .6 * (1 - rec / .8)); }
        else if (plan === 'beam') { arm = .18; open = 1; charge = bch; kick = bfire; heat = Math.max(heat, .4 + .6 * Math.max(bch, bfire)); if (bfire) arm -= .25 * bfire; crK = 3; }
        else if (plan === 'mines') { arm = .55; batUp = Math.max(0, 1 - rec / .8); batFire = Math.max(0, 1 - rec / .3); }
        else if (plan === 'groundwave') { const k = Math.max(0, 1 - rec / .7); arm = lerp2(.3, 1.35, k); bArm = lerp2(1.2, .9, k); crK = 8 * k; lean = .22 * k; }
        else if (plan === 'vent') { const k = Math.max(0, 1 - rec / 1.1); louv = k; arm = lerp2(.3, .95, k); }
      }
      if (pulling) { arm = .05; open = 1; charge = .3; }
      if (st === 'strike' && plan === 'swing') heat = Math.max(heat, .2);
    }
    if (CU) CU.hot = Math.max(CU.kw, CU.ko);
    const cr = crK, HIP = -30 + cr, SHO = -49 + cr, hy = -61 + cr;
    const flow = (pose.flow || 0) + Math.abs(sw) * 4 + (pose.run ? 6 : 0);
    CB = CU ? cvPal(phase, CU.L) : CBP[phase];
    const hot = P3, brass = CB.brass, L = CU ? CU.L : 0;
    const br = e.dead || down ? 0 : Math.sin(t * 2.1) * .32; // (it breathes: the boiler rises and settles on its hips with the fire's draught)
    const leanF = () => { ctx.translate(jx, HIP + jy - br); ctx.rotate(lean); ctx.translate(0, -HIP); };
    if (P3 && !e.dead) add(() => { // overdrive: a heat pulse about it, and the air shimmering over its head
      const pr = .5 + .5 * Math.sin(t * 5), g = ctx.createRadialGradient(0, SHO + 10, 4, 0, SHO + 10, 46), hc = CU ? '150,50,220' : '255,80,40';
      g.addColorStop(0, `rgba(${hc},${.2 + .16 * pr})`); g.addColorStop(1, `rgba(${hc},0)`); ctx.fillStyle = g; circle(0, SHO + 10, 46); ctx.fill();
      ctx.strokeStyle = 'rgba(255,190,160,.2)'; ctx.lineWidth = 1.1; ctx.beginPath();
      for (let i = 0; i < 3; i++) { const x0 = -12 + i * 9, q = t * 4 + i * 2; ctx.moveTo(x0, hy - 14); for (let k = 1; k <= 4; k++) ctx.quadraticCurveTo(x0 + Math.sin(q + k) * 2.6, hy - 16.5 - (k - 1) * 5, x0 + Math.sin(q + k + .5) * .8, hy - 14 - k * 5); }
      ctx.stroke(); });
    if (CU && !e.dead && DET()) { // a cursed machine stands in its own pall of black smoke
      const g = ctx.createRadialGradient(-2, SHO + 6, 6, -2, SHO + 6, 40 + 10 * L); g.addColorStop(0, `rgba(20,8,24,${.35 * L})`); g.addColorStop(1, 'rgba(20,8,24,0)'); ctx.fillStyle = g; circle(-2, SHO + 6, 40 + 10 * L); ctx.fill(); }

    // ======== behind the body: smokestacks, the drum magazine, the banner, the far arm (and the ruined arm the curse grows)
    ctx.save(); leanF();
    // the stacks: in a far-gone cursed machine they bend back into horns
    for (const [x, h, i] of [[-16, 21, 0], [-10.5, 27, 1]]) {
      if (CU && L > .6) { const hl = h * (1 + (L - .6)); horn(x, SHO - 2, x - 2 - i * 2, SHO - hl * .9, x - 10 - i * 4, SHO - hl * .7 - 4, 5.6, .6, CB.frame, 4, 1.1);
        add(() => { ctx.fillStyle = `rgba(190,80,255,${.4 + .3 * Math.sin(t * 6 + i)})`; circle(x - .6, SHO - hl * .45, 1.2); ctx.fill(); }); continue; }
      const stk = () => rrect(x - 2.7, SHO - 4 - h, 5.4, h + 4, 1.2);
      plate(stk, CB.gun, [x + 2.7, 0, x - 2.7, 0], { box: [x - 2, SHO - h, x + 2, SHO - 4], seed: 70 + i, fn: () => { ctx.fillStyle = 'rgba(20,12,10,.4)'; ctx.fillRect(x - 2.7, SHO - 2 - h, 5.4, 3); } });
      for (const y of [SHO - h + 5, SHO - 8]) { rrect(x - 3.2, y, 6.4, 1.8, .6); ctx.fillStyle = C(shade(brass, -.05)); ctx.fill(); outline(.8); } // brass bands
      plate(() => poly([x - 3.8, SHO - 4 - h, x + 3.8, SHO - 4 - h, x + 3.2, SHO - 1.4 - h, x - 3.2, SHO - 1.4 - h]), '#3A302A', null, { ow: 1, bw: .6 }); // the cap
      if (DET()) { ctx.fillStyle = P3 || rage ? `rgba(255,120,60,${.7 + .3 * Math.sin(t * 12 + x)})` : CU ? `rgba(160,60,220,${.6 + .3 * Math.sin(t * 7 + x)})` : 'rgba(40,30,30,.9)'; ell(x, SHO - 4 - h, 2.6, .9); ctx.fill(); }
    }
    // the banner hanging from its waist behind: teal and brass-fringed, scorched from phase two, rags in overdrive
    const wv = Math.sin(walk * .5 + t * 1.5) * 2.2;
    const ban = () => { ctx.beginPath(); ctx.moveTo(-9, HIP - 3); ctx.quadraticCurveTo(-15 - flow * .6, HIP + 6, -17 - flow, -6 + wv);
      if (P3) { ctx.lineTo(-15.5 - flow, -11 + wv); ctx.lineTo(-13.6 - flow * .8, -4 + wv * .7); ctx.lineTo(-11.6 - flow * .6, -12 + wv * .5); ctx.lineTo(-9.4 - flow * .5, -6); }
      else if (phase === 2) { ctx.lineTo(-15 - flow, -4 + wv); ctx.lineTo(-13 - flow * .8, -7 + wv * .7); ctx.lineTo(-10.6 - flow * .6, -1 + wv * .5); ctx.lineTo(-8.4 - flow * .5, -5); }
      else { ctx.lineTo(-12.6 - flow * .7, -1 + wv * .7); ctx.lineTo(-8 - flow * .4, -4 + wv * .3); }
      ctx.lineTo(-5, HIP + 4); ctx.closePath(); };
    ban(); ctx.fillStyle = C(CB.cape); ctx.fill();
    clipIn(ban, () => {
      const g = ctx.createLinearGradient(-19 - flow, 0, -5, 0); g.addColorStop(0, 'rgba(10,6,8,.45)'); g.addColorStop(.25, 'rgba(255,240,220,.16)'); g.addColorStop(.45, 'rgba(10,6,8,.4)'); g.addColorStop(.7, 'rgba(255,240,220,.2)'); g.addColorStop(1, 'rgba(10,6,8,.3)'); ctx.fillStyle = g; ctx.fillRect(-22 - flow, HIP - 4, 20 + flow, 34); // its folds
      ctx.strokeStyle = shade(CB.cape, -.5); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-8, HIP); ctx.quadraticCurveTo(-12 - flow * .4, HIP + 12, -13 - flow * .7, -5); ctx.stroke();
      ctx.fillStyle = shade(CB.trim, .1); ctx.fillRect(-20, HIP - 3, 16, 2); // a brass-trimmed top edge
      if (phase >= 2) { ctx.fillStyle = P3 ? 'rgba(14,8,8,.6)' : 'rgba(30,20,14,.45)'; ctx.fillRect(-24, -12 + wv * .5, 22, 14); }
      if (CU) { ctx.fillStyle = `rgba(10,4,8,${.4 * L})`; ctx.fillRect(-24, HIP - 4, 22, 40); } });
    ban(); outline(1.2);
    // the drum magazine on its back: a great round of shells, turning as the belt feeds from it
    { const mx = -15.4, my = SHO + 7, mr = 8.6;
      plate(() => circle(mx, my, mr), CB.frame, [mx + mr, my - mr, mx - mr, my + mr], { box: [mx - 6, my - 6, mx + 6, my + 6], seed: 81, ow: 1.3 });
      const ma = -spin * .4 - feed * 1.1;
      ctx.fillStyle = C(shade(CB.brass, -.1)); circle(mx, my, mr * .72); ctx.fill(); outline(.9);
      for (let i = 0; i < 8; i++) { const an = ma + i / 8 * TAU, x = mx + Math.cos(an) * mr * .5, y = my + Math.sin(an) * mr * .5; circle(x, y, 1.3); ctx.fillStyle = C(CU && L > .5 ? '#140A0E' : '#2A1E18'); ctx.fill(); if (DET()) { ctx.fillStyle = CU && L > .5 ? 'rgba(200,120,255,.6)' : shade(CB.brass, .5); circle(x + .3, y - .3, .5); ctx.fill(); } }
      if (DET()) { ctx.strokeStyle = 'rgba(255,248,224,.65)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.arc(mx, my, mr * .82, -1.7, -.3); ctx.stroke(); }
      cog(mx, my, 2.6, 7, ma, CB.cog, .7); }
    // the far arm, in shadow: a piston-driven arm and a great fist (it beats the ground for the groundwave)
    const bsx = -4, bsy = SHO + 1.5, bex = bsx + Math.cos(bArm) * 9.4, bey = bsy + Math.sin(bArm) * 9.4, fa = bArm + (planWind && plan === 'groundwave' ? -.2 : .25);
    const bwx = bex + Math.cos(fa) * 9.4, bwy = bey + Math.sin(fa) * 9.4;
    seg(bsx, bsy, bex, bey, 9.4, 7.8, shade(CB.sleeve, -.28), 1);
    seg(bex, bey, bwx, bwy, 8.6, 9.8, shade(brass, -.32), .6);
    limb([bsx + 2, bsy + 2, bwx - Math.cos(fa) * 3, bwy - Math.sin(fa) * 3], shade(CB.steel, -.25), 1.2); // its piston
    circle(bex, bey, 3.6); ctx.fillStyle = C('#2E2622'); ctx.fill(); outline(1); rivets([bex, bey], 1, CB.steel);
    { const fx = bwx + Math.cos(fa) * 2.6, fy = bwy + Math.sin(fa) * 2.6; ctx.save(); ctx.translate(fx, fy); ctx.rotate(fa - Math.PI / 2);
      plate(() => rrect(-4.6, -3, 9.2, 8.6, 2.6), shade(CB.frame, .02), [4, -3, -4, 5], { ow: 1.1, bw: .8 });
      ctx.strokeStyle = C(shade(CB.frame, -.4)); ctx.lineWidth = .6; ctx.beginPath(); for (const x of [-1.6, 1.4]) { ctx.moveTo(x, 1.6); ctx.lineTo(x, 5.4); } ctx.stroke(); // its knuckles
      plate(() => rrect(-4.8, -4, 9.6, 3.2, 1), shade(brass, -.3), null, { ow: .9, bw: .6 });
      ctx.restore(); }
    // the curse grows it a second arm out of its back: a ruined thing of black brass, thin as bone, its claw opening and
    // closing (a stub at first; long, jointed and clawed as the curse deepens; it flinches back while the curse burns)
    if (CU && (L > .38 || CU.bt >= 3)) {
      const g = Math.min(1, (L - .3) / .5) * (1 - .55 * CU.burn), rx = -12, ry = SHO - 1, a1 = -2.3 + .2 * Math.sin(t * 1.7) - CU.kw * .4, l1 = 7 + 9 * g, a2 = a1 + 1.4 + .35 * Math.sin(t * 2.3 + 1), l2 = 5 + 10 * g;
      const ex = rx + Math.cos(a1) * l1, ey = ry + Math.sin(a1) * l1, hx = ex + Math.cos(a2) * l2, hy2 = ey + Math.sin(a2) * l2, bone = mixHex('#5A4A4E', '#A89890', .3);
      horn(rx, ry, (rx + ex) / 2 - 1, (ry + ey) / 2 - 1, ex, ey, 3.6, 2.2, CB.frame, 2, 1);
      horn(ex, ey, (ex + hx) / 2 + 1, (ey + hy2) / 2, hx, hy2, 2.4, 1.4, bone, 3, 1);
      circle(ex, ey, 1.9); ctx.fillStyle = C(CB.steel); ctx.fill(); outline(.8);
      const op = .35 + .35 * Math.sin(t * 3) + CU.kw * .5;
      for (let i = 0; i < 3; i++) { const ca = a2 + (i - 1) * (.35 + op * .4), cl = 3 + 3.4 * g; horn(hx, hy2, hx + Math.cos(ca) * cl * .6, hy2 + Math.sin(ca) * cl * .6, hx + Math.cos(ca + .5) * cl, hy2 + Math.sin(ca + .5) * cl, 1.2, .1, '#1A1014', 0, .7); }
      if (DET()) add(() => { ctx.strokeStyle = `rgba(190,80,255,${.5 * g})`; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy2); ctx.stroke(); });
    }
    ctx.restore();

    // ======== the legs
    const pj = P3 && !e.dead ? Math.sin(t * 70) * .9 : 0; // overdrive: the pistons judder
    if (down) { colossusLeg(-3, 0, 0, HIP, cr, true, true, hot, P3, spin, 0); colossusLeg(3, 0, 0, HIP, cr, false, true, hot, phase >= 2, spin, 0); }
    else {
      const run = pose.run ? 1.6 : 1, f1 = sw * 10 * run, f2 = -sw * 10 * run;
      const k1 = cr > 2 ? cr + 1 : Math.max(0, sw) * 6, k2 = cr > 2 ? cr + 1 : Math.max(0, -sw) * 6;
      colossusLeg(-3, f1, k1, HIP, cr, true, false, hot, P3, spin, -pj); colossusLeg(3, f2, k2, HIP, cr, false, false, hot, phase >= 2, spin, pj);
    }

    // ======== the body, leaning about the hips
    ctx.save(); leanF();
    // the fauld: a cog housing, then a skirt of three overlapping lames on each side
    ctx.beginPath(); ctx.arc(0, HIP + 1, 7.6, 0, Math.PI); ctx.closePath(); ctx.fillStyle = C(CB.frame); ctx.fill(); outline(1.1);
    cog(0, HIP + 2.4, 3.8, 8, -spin * 1.6, shade(CB.cog, -.1), .8);
    for (let k = 2; k >= 0; k--) { const y = HIP - 1 + k * 2.8, d = k * .6;
      plate(() => poly([-11.2 + d, y, -2, y, -2.6, y + 4.2, -10.6 + d, y + 3.6]), shade(brass, -.28 - k * .04), [-2, y, -11, y + 4], { ow: 1, bw: .7, box: [-10, y, -3, y + 3], seed: 90 + k, ck: .8 });
      plate(() => poly([1.2, y, 11.6 - d, y - .4, 12 - d, y + 3.6, 2.2, y + 4.4]), shade(brass, -k * .06), [12, y - 1, 1, y + 4], { ow: 1, bw: .7, box: [2, y, 11, y + 3], seed: 95 + k, ck: .8 }); }
    rivets([7.6, HIP + .8, 8, HIP + 3.6, 8.2, HIP + 6.4], .7, brass);
    // the boiler cuirass: broad shoulders over a narrower waist
    const seams = () => { ctx.beginPath(); ctx.moveTo(-15, SHO + 4); ctx.quadraticCurveTo(0, SHO + 1, 16, SHO + 4); ctx.moveTo(-13, HIP - 9); ctx.quadraticCurveTo(0, HIP - 7, 14, HIP - 9); ctx.moveTo(-12, HIP - 5); ctx.quadraticCurveTo(0, HIP - 3.4, 12, HIP - 5); };
    const chest = () => { ctx.beginPath(); ctx.moveTo(-14, SHO + 2); ctx.quadraticCurveTo(-13, SHO - 5, 0, SHO - 5.6); ctx.quadraticCurveTo(13.4, SHO - 5, 15.6, SHO + 2);
      ctx.quadraticCurveTo(16.6, SHO + 12, 11, HIP - 4); ctx.lineTo(9, HIP + 1); ctx.lineTo(-9, HIP + 1); ctx.lineTo(-11, HIP - 4); ctx.quadraticCurveTo(-16, SHO + 12, -14, SHO + 2); ctx.closePath(); };
    const FX = .6, FY = SHO + 11.6, FR = 6.8; // the furnace port
    plate(chest, brass, [15, SHO - 5, -14, HIP], { box: [-13, SHO - 3, 14, HIP - 2], seed: 101, ck: 1.2, bw: 1.8, sh: [-17, SHO - 7, -6, SHO - 7, -9.6, SHO + 10, -6.4, HIP + 2, -17, HIP + 2], fn: () => {
      ctx.fillStyle = 'rgba(18,10,8,.18)'; ctx.beginPath(); ctx.moveTo(-6, SHO - 7); ctx.lineTo(-3, SHO - 7); ctx.quadraticCurveTo(-6, SHO + 10, -3.4, HIP + 2); ctx.lineTo(-6.4, HIP + 2); ctx.quadraticCurveTo(-9.6, SHO + 10, -6, SHO - 7); ctx.closePath(); ctx.fill(); // the turn of the barrel
      ctx.fillStyle = 'rgba(255,250,232,.32)'; ctx.beginPath(); ctx.moveTo(-2, SHO - 6); ctx.quadraticCurveTo(10, SHO - 6, 15, SHO + 1); ctx.lineTo(13, SHO + 2.4); ctx.quadraticCurveTo(8, SHO - 2.6, -2, SHO - 3.4); ctx.closePath(); ctx.fill(); // light across the collar plate
      ctx.strokeStyle = shade(brass, -.55); ctx.lineWidth = .9; seams(); ctx.stroke(); // plate seams: the collar and the lames over the belly
      ctx.strokeStyle = shade(brass, .55); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(-12, HIP - 8.2); ctx.quadraticCurveTo(0, HIP - 6.2, 13.6, HIP - 8.2); ctx.moveTo(-11, HIP - 4.2); ctx.quadraticCurveTo(0, HIP - 2.6, 11.6, HIP - 4.2); ctx.stroke();
      ctx.strokeStyle = shade(brass, .6); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(15.2, SHO + 3); ctx.quadraticCurveTo(15.8, SHO + 12, 10.6, HIP - 4.4); ctx.stroke(); // rim light
      if (!LITE) { const k = phase === 1 ? .34 : phase === 2 ? .18 : .08, g = ctx.createRadialGradient(10, SHO - 1, .5, 10, SHO - 1, 10); g.addColorStop(0, `rgba(255,250,232,${k})`); g.addColorStop(1, 'rgba(255,250,232,0)'); ctx.fillStyle = g; ctx.fillRect(0, SHO - 11, 20, 20); }
      if (phase === 1) { ctx.fillStyle = 'rgba(255,250,226,.28)'; poly([8, SHO - 6, 11, SHO - 6, 6.6, HIP + 2, 4, HIP + 2]); ctx.fill(); } // a clean polished sheen
      else { ctx.fillStyle = P3 ? 'rgba(40,14,10,.38)' : 'rgba(34,22,16,.42)'; ell(-6, SHO + 8, 8, 5, .5); ctx.fill(); ell(9, HIP - 9, 6, 3.4, -.3); ctx.fill(); ell(12, SHO + 8, 3, 6, .2); ctx.fill(); } // soot blown out of the wounds
      if (P3) { ctx.lineWidth = 2.4; ctx.globalAlpha = .5; for (const [r, col] of [[9.6, '#D8B060'], [12, '#B87040'], [14.4, '#8A4AA0'], [17, '#4A6AC8']]) { ctx.strokeStyle = col; circle(FX, FY, r); ctx.stroke(); } ctx.globalAlpha = 1; } // temper bands about the core
      if (!P3) { ctx.strokeStyle = shade(brass, .45); ctx.lineWidth = .5; for (const dd of [.35, 0]) { ctx.beginPath(); for (let i = 0; i < 16; i++) { const an = i / 16 * TAU, r0 = FR + 1.6, r1 = FR + (i % 2 ? 3 : 4.6); ctx.moveTo(FX + Math.cos(an) * r0 - dd, FY + Math.sin(an) * r0 + dd); ctx.lineTo(FX + Math.cos(an) * r1 - dd, FY + Math.sin(an) * r1 + dd); } ctx.stroke(); ctx.strokeStyle = shade(brass, -.5); } } // a sun in splendour engraved round the port
    } });
    rivets([-11, SHO + 3.4, -7.2, SHO + 2.8, -3.4, SHO + 2.4, 4.2, SHO + 2.4, 8, SHO + 2.8, 11.8, SHO + 3.4, -8, HIP - 7.4, 8, HIP - 7.4, -7.2, HIP - 3.4, 7.2, HIP - 3.4], .65, brass);
    // the vent louvres down its flank: they lift and breathe steam as the vent builds (white-hot slits)
    { const lx = 13.2; for (let i = 0; i < 3; i++) { const y = SHO + 5 + i * 3.4, o = louv * 1.4;
      fillPoly([lx - 3, y, lx + 1.6, y - .4, lx + 1.6, y + 1.6, lx - 3, y + 2], '#1A1210', 0);
      if (louv > .05) add(() => { ctx.fillStyle = `rgba(255,240,220,${.7 * louv})`; ctx.fillRect(lx - 2.6, y + .3, 4, 1.2); });
      plate(() => poly([lx - 3.4, y - o, lx + 2, y - .6 - o * 1.4, lx + 2, y + .8 - o, lx - 3.4, y + 1.2]), shade(brass, -.08), null, { ow: .8, bw: .5 }); } }
    if (phase >= 2) { // phase two: the breastplate blown open over the clockwork on the far side; three: torn back to a bare frame
      const big = P3;
      const hole = big ? [-15.8, SHO + 3.4, -8, SHO + 2.6, -7.4, SHO + 8, -8.4, HIP - 3, -11.6, HIP - 2.2, -16.2, SHO + 13]
        : [-15.8, SHO + 4.6, -10.6, SHO + 3.6, -8, SHO + 5, -7.6, SHO + 10, -8.6, HIP - 10, -12, HIP - 10.6, -16, SHO + 13];
      fillPoly(hole, '#1A1210', 0);
      clipIn(() => poly(hole), () => {
        const fl = .8 + .2 * Math.sin(t * (big ? 17 : 9)), g = ctx.createRadialGradient(-6, SHO + 11, 1, -6, SHO + 11, big ? 15 : 13), fc = CU ? '160,60,230' : big ? '255,110,50' : '255,150,60';
        g.addColorStop(0, `rgba(${fc},${fl})`); g.addColorStop(1, 'rgba(60,20,30,0)'); ctx.fillStyle = g; ctx.fillRect(-18, SHO, 15, 24);
        ctx.strokeStyle = '#6E6862'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-16, SHO + 8); ctx.quadraticCurveTo(-12, SHO + 14, -6, SHO + 16); ctx.stroke();
        cog(-12.2, SHO + 9.6, 4.4, 9, spin * 1.4, big ? '#A0603A' : '#D8A450', 1);
        cog(-9.4, SHO + 14.4, 2.8, 7, -spin * 2.1 + .3, big ? '#8A5030' : '#B88440', .9);
        if (big) for (const y of [SHO + 4.6, SHO + 15.6, SHO + 20.6]) { ctx.fillStyle = '#3A2E28'; ctx.fillRect(-17, y, 14, 2); ctx.fillStyle = CU ? '#B060F0' : '#FF8A4A'; ctx.fillRect(-17, y + 1.4, 14, .6); ctx.fillStyle = '#7A6A5E'; ctx.fillRect(-17, y, 14, .5); }
      });
      poly(hole); outline(1.1); if (DET()) { poly(hole); ctx.strokeStyle = shade(brass, .5); ctx.lineWidth = .5; ctx.stroke(); }
      add(() => { poly(hole); ctx.strokeStyle = CU ? `rgba(200,110,255,${.5 + .3 * Math.sin(t * 8)})` : big ? `rgba(255,120,60,${.3 + .2 * Math.sin(t * 8)})` : 'rgba(255,170,90,.3)'; ctx.lineWidth = .8; ctx.stroke(); });
      // the belly lames torn away: a big cog turning in the furnace light
      const belly = [7.2, HIP - 12.4, 13.8, HIP - 11.6, 12.8, HIP - 6.4, 10.8, HIP - 4, 7.4, HIP - 4.4, 6.4, HIP - 8];
      fillPoly(belly, '#1A1210', 0);
      clipIn(() => poly(belly), () => {
        const k = .7 + .3 * Math.sin(t * (big ? 13 : 6)), g = ctx.createLinearGradient(0, 0, 14, 0), fc = CU ? '150,50,220' : big ? '255,90,40' : '255,140,50';
        g.addColorStop(0, `rgba(${fc},${k})`); g.addColorStop(1, 'rgba(80,26,30,.3)'); ctx.fillStyle = g; ctx.fillRect(-12, HIP - 13, 26, 11);
        ctx.fillStyle = '#3A2E28'; ctx.fillRect(-12, HIP - 8, 26, 1.4);
        cog(10.2, HIP - 7.8, 5, 10, -spin * 1.2, big ? '#A0603A' : '#D8A450', 1.1);
      });
      poly(belly); ctx.strokeStyle = C(shade(brass, .45)); ctx.lineWidth = 1; ctx.stroke();
      const crk = () => { ctx.beginPath(); ctx.moveTo(9, SHO - 2); ctx.lineTo(6.4, SHO + 1.6); ctx.lineTo(8.6, SHO + 4); ctx.moveTo(10, HIP - 10); ctx.lineTo(7.6, HIP - 7);
        if (big) { ctx.moveTo(14.6, SHO + 6); ctx.lineTo(11.6, SHO + 8.4); ctx.lineTo(13, SHO + 11); ctx.moveTo(-3.4, SHO - 4.6); ctx.lineTo(-1.6, SHO - 1.6); ctx.lineTo(-3, SHO + 1); } };
      crk(); ctx.strokeStyle = C('#2A1E16'); ctx.lineWidth = 1.3; ctx.stroke();
      if (P3) glow(CU ? '#A040FF' : '#FF6A3A', 8, () => { crk(); ctx.strokeStyle = C(CU ? '#E0B0FF' : '#FFB070'); ctx.lineWidth = .6; ctx.stroke(); });
    }
    // in a cursed machine its plates warp: torn shards of black brass bent out from it, more with the curse
    if (CU && L > .3) { const n = Math.min(5, Math.round((L - .2) * 6));
      const sh = [[-13.6, SHO + 1, -1.2], [15.2, SHO + 9, .5], [-12.6, HIP - 6, -2.2], [11, SHO - 4, -.6], [13.4, HIP - 6, .9]];
      for (let i = 0; i < n; i++) { const [x, y, an] = sh[i], l = 4 + 3 * L + Math.sin(t * 2 + i) * .3; horn(x, y, x + Math.cos(an - .4) * l * .6, y + Math.sin(an - .4) * l * .6, x + Math.cos(an) * l, y + Math.sin(an) * l, 3, .4, mixHex(CB.brass, '#100A0C', .3), 1, .9); } }
    // overdrive, or the pressure building before a transformation: the seams glow white-hot
    const seamHot = Math.max(P3 && !e.dead ? .5 + .3 * Math.sin(t * 7) : 0, pre);
    if (seamHot > .02) add(() => { seams(); ctx.strokeStyle = CU ? `rgba(180,80,255,${seamHot})` : `rgba(255,120,50,${seamHot})`; ctx.lineWidth = 1.7; ctx.stroke(); ctx.strokeStyle = `rgba(255,236,220,${seamHot * .8})`; ctx.lineWidth = .6; ctx.stroke(); });
    if (phase >= 2) add(() => { // the furnace's light spills out of the openings across the plating
      const k = .2 + .08 * Math.sin(t * (P3 ? 15 : 7)), col = CU ? '170,70,240' : P3 ? '255,80,40' : '255,150,60';
      for (const [x, y, r] of [[-10, SHO + 11, 13], [10, HIP - 7, 12]]) { const g = ctx.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, `rgba(${col},${k})`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; circle(x, y, r); ctx.fill(); }
    });
    // ---- the furnace heart behind its iris hatch. Whole: six shutter blades shut over the fire, its light in the joins.
    // Phase two: half blown open, two blades gone. Overdrive: no hatch at all, the core spinning in a cage of ribs.
    // Cursed it is the weak point, built into it: the fire goes black-violet, the blades crack; as a Circle attack winds
    // the heart throbs; when the mark lies open the iris springs wide on a white-hot core, a clasp of light round it
    // for each blow it still wants; burning back it floods with gold.
    {
      const fr = phase === 1 ? .5 + Math.sin(t * 2.2) * .08 : P3 ? .5 + .5 * Math.sin(t * 23) * Math.sin(t * 7.3) : Math.sin(t * 13) * .5 + .5;
      const roar = Math.max(wind * (plan === 'vent' ? 1.2 : .6), pulling ? .7 : 0, pre, post * .8, charge * .6, CU ? Math.max(CU.kw, CU.ko) : 0) - (CU && !CU.burn ? .25 : 0);
      let iris = phase === 1 ? .08 + wind * .2 : phase === 2 ? .45 : 1;
      if (CU) iris = Math.max(Math.min(iris, .25 + .1 * L), CU.ko, CU.kw * .4, CU.burn * .6);
      const fire = CU && CU.burn ? ['#FFFFF0', '#FFD070', '#C87010'] : CU && CU.ko ? ['#FFFFFF', mixHex(CB.fire[1], '#FFE0E0', CU.ko * .6), mixHex(CB.fire[2], '#E83A30', CU.ko)] : CB.fire;
      rrect(FX - FR - 2, FY - FR - 2, (FR + 2) * 2, (FR + 2) * 2, FR + 2); ctx.fillStyle = C(shade(CB.frame, .1)); ctx.fill(); outline(1.3); // the port's collar
      if (DET()) { ctx.strokeStyle = shade(CB.frame, .55); ctx.lineWidth = .7; ctx.beginPath(); ctx.arc(FX, FY, FR + 1.3, -1.9, -.2); ctx.stroke(); }
      const fg = ctx.createRadialGradient(FX, FY + .6, .5, FX, FY, FR);
      fg.addColorStop(0, C(fire[0])); fg.addColorStop(.38 + fr * .1, C(fire[1])); fg.addColorStop(1, C(fire[2]));
      glow(CU ? '#A040FF' : rage || P3 ? '#FF5A4A' : '#F2A65A', 10 + roar * 8, () => { circle(FX, FY, FR); ctx.fillStyle = fg; ctx.fill(); });
      if (DET()) clipIn(() => circle(FX, FY, FR), () => { // the fire's tongues licking round inside
        ctx.fillStyle = CU && !CU.burn ? 'rgba(20,4,30,.45)' : 'rgba(255,255,230,.35)'; for (let i = 0; i < 5; i++) { const a = t * (2 + i * .4) + i * 1.3; ell(FX + Math.cos(a) * FR * .45, FY + Math.sin(a * 1.3) * FR * .35, 1.6, 3.2, a); ctx.fill(); } });
      // the core: a white sphere in a spinning ring (seen from phase two; always, once a cursed heart is open)
      if (iris > .3) { const cr2 = 2.6 + fr * .5 + (CU ? CU.ko * 1.4 : 0) + (P3 ? .6 : 0);
        glow(CU ? '#C060FF' : '#FF7A4A', 12, () => { ctx.fillStyle = C(CU && !CU.burn && !CU.ko ? '#F0C8FF' : '#FFF4E0'); circle(FX, FY, cr2); ctx.fill(); });
        ctx.strokeStyle = C(shade(CB.cog, .2)); ctx.lineWidth = .9; ctx.beginPath(); ctx.ellipse(FX, FY, cr2 + 2.2, (cr2 + 2.2) * Math.abs(Math.cos(spin * 1.3)), .5, 0, TAU); ctx.stroke(); }
      if (P3 && !(CU && CU.ko > .5)) { // overdrive: the ribs of the cage (black brass bones, cursed)
        ctx.lineCap = 'round'; for (const dx of [-4.6, 0, 4.6]) { line([FX + dx * .9, FY - FR + .6, FX + dx, FY + FR - .6], C(INK), 2.4); line([FX + dx * .9, FY - FR + .6, FX + dx, FY + FR - .6], C(CU ? '#5A4A50' : '#5A5462'), 1.3); } }
      // the shutter blades
      if (iris < .98) { ctx.save(); circle(FX, FY, FR); ctx.clip();
        const rot = (CU ? -1 : 1) * iris * 1.2;
        for (let i = 0; i < 6; i++) { if (phase === 2 && !CU && (i === 1 || i === 4)) continue;
          const a0 = i / 6 * TAU + rot, a1 = a0 + TAU / 6 * 1.18, ri = FR * iris * 1.05, ia = a1 + .9;
          const bp = () => { ctx.beginPath(); ctx.moveTo(FX + Math.cos(a0) * (FR + 1), FY + Math.sin(a0) * (FR + 1)); ctx.arc(FX, FY, FR + 1, a0, a1); ctx.lineTo(FX + Math.cos(ia) * ri, FY + Math.sin(ia) * ri); ctx.lineTo(FX + Math.cos(a0 + .9) * ri * .9, FY + Math.sin(a0 + .9) * ri * .9); ctx.closePath(); };
          bp(); ctx.fillStyle = DET() ? metalG(FX + Math.cos(a0) * FR, FY + Math.sin(a0) * FR, FX, FY, i % 2 ? shade(brass, -.12) : brass) : C(brass); ctx.fill(); outline(.8);
          if (CU && DET()) { const cx = FX + Math.cos(a0 + .5) * FR * .6, cy = FY + Math.sin(a0 + .5) * FR * .6; ctx.strokeStyle = CU.burn ? 'rgba(255,220,140,.9)' : `rgba(${150 + 90 * CU.kw | 0},${50 + 60 * CU.kw | 0},${200 + 55 * CU.kw | 0},${.35 + .4 * Math.max(L * .6, CU.kw)})`; ctx.lineWidth = .35 + .5 * CU.kw; ctx.beginPath(); ctx.moveTo(cx - 1.4, cy - 1); ctx.lineTo(cx, cy + .3); ctx.lineTo(cx + 1.6, cy - .4); ctx.lineTo(cx + 2.4, cy + 1.6); ctx.stroke(); } } // a crack across each blade, glowing
        ctx.restore();
        if (DET() && iris < .3) add(() => { ctx.strokeStyle = CU ? `rgba(200,110,255,${.4 + .4 * fr})` : `rgba(255,200,120,${.35 + .3 * fr + wind * .3})`; ctx.lineWidth = .6; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + (CU ? -1 : 1) * iris * 1.2 + TAU / 6 * 1.18; ctx.moveTo(FX + Math.cos(a) * FR, FY + Math.sin(a) * FR); ctx.lineTo(FX + Math.cos(a + .9) * FR * iris, FY + Math.sin(a + .9) * FR * iris); } ctx.stroke(); }); } // the fire's light in the joins
      circle(FX, FY, FR); outline(1.2);
      // a cursed heart lying open: clasps of light round the port, one dark for each blow it still wants
      if (CU && CU.ko > 0) { const pulse = .6 + .4 * Math.sin(t * 10);
        add(() => { const R = FR + 6 + 4 * pulse, g = ctx.createRadialGradient(FX, FY, FR * .4, FX, FY, R * 1.6); g.addColorStop(0, `rgba(255,250,240,${.75 * CU.ko})`); g.addColorStop(.45, `rgba(255,120,110,${.45 * CU.ko})`); g.addColorStop(1, 'rgba(255,60,60,0)'); ctx.fillStyle = g; circle(FX, FY, R * 1.6); ctx.fill(); });
        for (let i = 0; i < CU.need; i++) { const an = -Math.PI / 2 + (i - (CU.need - 1) / 2) * .62, x = FX + Math.cos(an) * (FR + 2.6), y = FY + Math.sin(an) * (FR + 2.6), hit = i < CU.pts;
          ctx.save(); ctx.translate(x, y); ctx.rotate(an + Math.PI / 2); rrect(-1.3, -1.6, 2.6, 3.2, .6); ctx.fillStyle = C(hit ? '#2A0E14' : '#FFF0D8'); ctx.fill(); outline(.7); ctx.restore(); } }
      if (CU && CU.burn) add(() => { const R = FR * (2.6 + .4 * Math.sin(t * 14)), g = ctx.createRadialGradient(FX, FY, 0, FX, FY, R); g.addColorStop(0, `rgba(255,240,200,${.85 * CU.burn})`); g.addColorStop(.4, `rgba(255,190,90,${.4 * CU.burn})`); g.addColorStop(1, 'rgba(255,140,40,0)'); ctx.fillStyle = g; circle(FX, FY, R); ctx.fill(); });
      if (CU && CU.kw > 0) add(() => { const g = ctx.createRadialGradient(FX, FY, 0, FX, FY, FR * 2.2); g.addColorStop(0, `rgba(230,120,255,${.6 * CU.kw * (.6 + .4 * Math.sin(t * 16))})`); g.addColorStop(1, 'rgba(160,40,220,0)'); ctx.fillStyle = g; circle(FX, FY, FR * 2.2); ctx.fill(); });
      add(() => { const g = ctx.createRadialGradient(FX, FY, 2, FX, FY, 16 + roar * 10), col = CU && !CU.burn ? '170,70,240' : P3 ? '255,90,50' : '255,170,90'; g.addColorStop(0, `rgba(${col},${.3 + fr * .12 + roar * .3 + (rage ? .15 : 0)})`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; circle(FX, FY, 16 + roar * 10); ctx.fill(); });
    }
    // a pressure gauge on the breast, needle climbing with each phase (spinning backwards round its dial, cursed)
    { const gx = 10.6, gy = SHO + 2.6;
      circle(gx, gy, 2.8); ctx.fillStyle = C(shade(brass, -.3)); ctx.fill(); outline(1);
      circle(gx, gy, 1.9); ctx.fillStyle = C(CU ? mixHex('#ECE2C8', '#3A2A30', L) : '#ECE2C8'); ctx.fill();
      if (DET()) { ctx.strokeStyle = '#C8304A'; ctx.lineWidth = .6; ctx.beginPath(); ctx.arc(gx, gy, 1.5, -.6, .4); ctx.stroke(); }
      const na = CU ? -t * 3 : -2.4 + phase * .9 + Math.sin(t * (P3 ? 20 : 3)) * (P3 ? .2 : .08);
      ctx.strokeStyle = C(CU ? '#D080FF' : '#1A1214'); ctx.lineWidth = .55; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(na) * 1.7, gy + Math.sin(na) * 1.7); ctx.stroke(); }
    // the waist band: enamel trim with a gear boss
    plate(() => rrect(-10.4, HIP - 3, 20.8, 4.4, 1.2), CB.trim, [0, HIP - 3, 0, HIP + 1.4], { ow: 1.1, bw: .7 });
    plate(() => circle(2.6, HIP - .8, 2.8), shade(brass, .1), [5, HIP - 3, 0, HIP + 2], { ow: 1, bw: .6 }); rivets([2.6, HIP - .8], .9, brass);
    // the gorget: a heavy collar the helm sits down into
    plate(() => { ctx.beginPath(); ctx.moveTo(-8.6, SHO - 3.4); ctx.quadraticCurveTo(1.4, SHO - 8.4, 11, SHO - 3.6); ctx.lineTo(10, SHO - 1); ctx.quadraticCurveTo(1.4, SHO - 4.8, -8, SHO - .8); ctx.closePath(); }, shade(brass, .04), [10, SHO - 8, -8, SHO], { ow: 1.1, bw: .8, box: [-7, SHO - 6, 9, SHO - 2], seed: 111 });
    // the shoulder battery on the far shoulder: folded shut under a domed hatch while it is new; from phase two it has
    // unfolded, three mortar tubes on a swivel, raised to lob the mines (their mouths glow, then smoke and kick)
    ctx.save(); ctx.translate(-16.4, SHO - 1.4);
    if (phase === 1) {
      plate(() => { ctx.beginPath(); ctx.moveTo(-6.6, 1.6); ctx.quadraticCurveTo(-6, -6.8, 3, -5.6); ctx.quadraticCurveTo(6.6, -4, 6, 1.6); ctx.closePath(); }, shade(brass, -.14), [5, -6, -6, 2], { ow: 1.1, sh: [-8, -8, -2.4, -8, -2.4, 3, -8, 3] });
      if (DET()) { line([-5, -.6, 4.6, -.6], shade(brass, -.5), .5); line([-1, -6.2, -1.4, 1], shade(brass, -.5), .5); }
      rivets([-4.4, .4, 3.6, .4, -1.2, -3], .55, brass);
    } else {
      const ang = -1.95 + .35 * batUp + .08 * batFire;
      plate(() => rrect(-3.4, -2.6, 6.8, 5.6, 1.4), CB.frame, null, { ow: 1, bw: .6 });
      cog(0, .2, 2.2, 7, spin * .6, CB.cog, .7);
      ctx.rotate(ang); ctx.translate(-batFire * 2, 0);
      for (const [dy, dk] of [[-3.4, -.25], [3.4, 0], [0, .08]]) {
        const tb = () => rrect(1, dy - 1.8, 13, 3.6, 1.2);
        plate(tb, shade(CU ? CB.gun : CB.brass, dk - .1), [0, dy - 1.8, 0, dy + 1.8], { ow: 1, bw: .6, box: [2, dy - 1, 13, dy + 1], seed: 120 + dy });
        plate(() => rrect(12.4, dy - 2.2, 2.6, 4.4, .8), shade(CB.gun, dk), null, { ow: .9, bw: .5 });
        if (batUp > .05 || batFire > .05) glow(CU ? '#B050FF' : '#FF9A4A', 5, () => { ell(15, dy, .8, 1.5); ctx.fillStyle = C(CU ? '#E0A0FF' : '#FFD08A'); ctx.fill(); }); }
      ctx.fillStyle = C(shade(CB.trim, -.1)); ctx.fillRect(4, -5.4, 1.4, 10.8); ctx.fillRect(9, -5.4, 1.4, 10.8); // the straps binding the tubes
      if (batFire > .05) add(() => { const g = ctx.createRadialGradient(17, 0, 0, 17, 0, 6 + batFire * 6); g.addColorStop(0, `rgba(255,240,200,${batFire})`); g.addColorStop(1, 'rgba(255,140,60,0)'); ctx.fillStyle = g; circle(17, 0, 6 + batFire * 6); ctx.fill(); });
    }
    ctx.restore();
    // the head
    colossusHead(hy, Math.max(wind, CU ? CU.kw : 0), phase, rage, t, flow * .5, down, e.dead ? 0 : Math.max(P3 ? .65 + .3 * Math.sin(t * 9) : 0, pre, post, CU ? CU.kw * .8 : 0));
    // ---- the cannon arm: upper arm, elbow, then the cannon is the forearm (and the belt that feeds it)
    if (pose.trail && typeof drawTrail === 'function') drawTrail(0, SHO + 2, pose);
    const sx = 2.4, sy = SHO - .4, ua = arm + (arm > -.6 ? (arm > .6 ? .2 : -.12) : .1), ex = sx + Math.cos(ua) * 8.4, ey = sy + Math.sin(ua) * 8.4;
    const ca = Math.cos(arm), sa = Math.sin(arm), bx = ex + ca * 6.2 - sa * -8.4, by = ey + sa * 6.2 + ca * -8.4; // the breech's feed throat
    MUZ.set(e, { mx: ex + ca * 44, my: ey + sa * 44, bx: ex + ca * 6, by: ey + sa * 6, tx: -16.4 + Math.cos(-1.95 + .35 * batUp) * 16, ty: SHO - 1.4 + Math.sin(-1.95 + .35 * batUp) * 16 });
    seg(sx, sy, ex, ey, 9.6, 8.6, CB.sleeve, 1.2);
    { ctx.save(); ctx.translate(sx, sy); ctx.rotate(ua); // the rerebrace: a plate over the upper arm
      plate(() => { ctx.beginPath(); ctx.moveTo(.6, -5.2); ctx.lineTo(8, -4.6); ctx.quadraticCurveTo(9.4, 0, 8, 4.4); ctx.lineTo(1, 5); ctx.quadraticCurveTo(-1, 0, .6, -5.2); ctx.closePath(); }, shade(brass, -.05), [4, -5, 4, 5], { ow: 1.1, bw: .8, box: [1, -4, 8, 4], seed: 131 });
      rivets([2.4, -3.4, 2.4, 3.4], .55, brass); ctx.restore(); }
    ammoBelt(-8.4, SHO + 1, 0, SHO - 3.4, bx, by, feed + (planWind && plan === 'volley' ? wind : 0));
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(arm);
    colossusCannon({ t, phase, heat, open, charge, spin: spin * .3 + dspin * t * .5 + (feed * .9), kick, pulling, rage });
    ctx.restore();
    circle(ex, ey, 4.4); ctx.fillStyle = C(CB.frame); ctx.fill(); outline(1.1); cog(ex, ey, 3.2, 8, spin * 1.4, CB.cog, .7); // the elbow
    // the great layered pauldron over the cannon shoulder
    const pa = (k, ry) => { ctx.beginPath(); ctx.ellipse(2.4, SHO - 1 + k * 2.4, 9.4 - k * .8, ry, -.25, Math.PI * .92, Math.PI * 2.08); ctx.closePath(); };
    const top = P3 ? 2 : phase === 2 ? 1 : 0;
    for (let k = 2; k >= top; k--) { // (its outer plate is blown off in phase two, and the next one in overdrive)
      const col = shade(brass, k === 0 ? .06 : -.12 - k * .08);
      plate(() => pa(k, 6.8 - k), col, [10, SHO - 8, -6, SHO + 5], { ow: 1.2, bw: 1, box: [-6, SHO - 4, 8, SHO + 2], seed: 140 + k, fn: () => {
        if (k === top) { ctx.fillStyle = 'rgba(255,252,236,.65)'; ell(6, SHO - 5 + k * 2.4, 3.6, 1.2, -.3); ctx.fill(); }
        ctx.lineWidth = .5; ctx.strokeStyle = shade(col, .45); ctx.beginPath(); ctx.ellipse(2.15, SHO - .65 + k * 2.4, 7.8 - k * .8, 5.6 - k, -.25, Math.PI * 1.02, Math.PI * 1.98); ctx.stroke(); // an engraved border following the rim
        ctx.strokeStyle = shade(col, -.5); ctx.beginPath(); ctx.ellipse(2.4, SHO - 1 + k * 2.4, 7.8 - k * .8, 5.6 - k, -.25, Math.PI * 1.02, Math.PI * 1.98); ctx.stroke();
      } });
      if (k === top) { const rv = []; for (let i = 0; i < 5; i++) { const an = Math.PI * (1.12 + i * .19); rv.push(2.4 + Math.cos(an - .25) * (8 - k * .8), SHO - 1 + k * 2.4 + Math.sin(an - .25) * (5.8 - k) * .98); } rivets(rv, .55, col); }
    }
    if (phase === 1) { ctx.fillStyle = C(CB.trim); ctx.fillRect(-4.6, SHO - .2, 13, 1.3); }
    else { // the bare shoulder: a ball joint and its cog (in overdrive the torn plate edge glows)
      cog(2.4, SHO - 1.6, 3.4, 8, spin * 1.2, shade(CB.cog, .15), .8);
      if (P3) add(() => { ctx.strokeStyle = CU ? `rgba(190,90,255,${.6 + .3 * Math.sin(t * 8)})` : `rgba(255,120,60,${.6 + .3 * Math.sin(t * 8)})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(2.4, SHO + 3.8, 7.6, 4.6, -.25, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); }); }
    if (phase >= 2) { // a ruptured steam pipe over the far shoulder, jetting a steady plume up and back
      line([-9, SHO + 2, -13.6, SHO - 1.4, -15.6, SHO - 5.4], C(INK), 3.6); line([-9, SHO + 2, -13.6, SHO - 1.4, -15.6, SHO - 5.4], C('#5E5852'), 2.4);
      if (DET()) line([-9.4, SHO + 1.2, -13.8, SHO - 2.2], '#9A948C', .6);
      fillPoly([-17.4, SHO - 5, -15.6, SHO - 7.2, -13.6, SHO - 5.6, -14.6, SHO - 4.4, -15.8, SHO - 5.8], '#6E6862', .9);
      if (!FLASH && !TINT && !e.dead) {
        const n = LITE ? 4 : 7;
        for (let i = 0; i < n; i++) { const u = (t * (P3 ? 2.2 : 1.7) + i / n) % 1, x = -16 - u * 9 - Math.sin(u * 5 + i) * 1.4, y = SHO - 7 - u * 24, r = 1.4 + u * (P3 ? 5.4 : 4.6);
          ctx.globalAlpha = (1 - u) * (P3 ? .5 : .62); ctx.fillStyle = CU ? '#3A2E36' : P3 ? '#B8ACA4' : '#F4EEE8'; circle(x, y, r); ctx.fill();
          if (!LITE) { ctx.fillStyle = CU ? '#5E4E58' : '#FFFFFF'; circle(x + r * .3, y - r * .3, r * .5); ctx.fill(); } }
        ctx.globalAlpha = 1;
      }
    }
    if (P3 && !FLASH && !TINT) { // phase three: red-hot all over (violet-black, cursed)
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = CU ? `rgba(120,40,180,${.12 + .06 * Math.sin(t * 8)})` : `rgba(255,70,40,${.06 + .04 * Math.sin(t * 8)})`; chest(); ctx.fill(); ctx.restore();
    }
    if (post > .02 && DET()) { // just transformed: the freshly torn metal still flashes white-hot
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,230,190,${.55 * post * post})`; chest(); ctx.fill(); ctx.restore();
    }
    ctx.restore();
    ctx.restore();
    // the steam and smoke it breathes (spawned in colossusFx: world space, drawn here over the body)
    if (e.x !== undefined) { ctx.save(); ctx.scale(1.9, 1.9); cvDrawPuffs(e); ctx.restore(); }
    CU = null;
  };

  // ===================================================================================================
  // THE KALEIDOSCOPE WYRM, Eater of Colors: a flying serpent of living crystal. Hover point at (0,0);
  // its faceted body trails ~180 units behind the head, to the left.
  // ===================================================================================================
  function wyrmWing(rx, ry, ang, far, hueBase, t, phase, rage) {
    const P3 = phase === 3;
    ctx.save(); ctx.translate(rx, ry); ctx.rotate(ang); ctx.scale(1.12, 1.12); if (far) ctx.scale(.82, .9);
    const W = [-20, -44], T1 = [-60, -74], T2 = [-74, -44], T3 = [-62, -16], T4 = [-34, -2];
    const pane = (pts, ctl, k) => {
      const pp = () => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); ctx.lineTo(pts[2], pts[3]); ctx.quadraticCurveTo(ctl[0], ctl[1], pts[4], pts[5]); ctx.closePath(); };
      pp();
      const h = (hueBase + t * 40 + k * 46) % 360;
      ctx.fillStyle = C(P3 ? (k % 2 ? 'rgba(58,42,74,.92)' : 'rgba(40,28,54,.92)') : `hsla(${h},${rage ? 80 : 68}%,${far ? 44 : 58}%,.9)`); ctx.fill();
      if (DET()) { // each pane is two facets: one catching the light, one in shadow
        ctx.save(); ctx.clip(); ctx.fillStyle = P3 ? 'rgba(232,192,106,.18)' : `hsla(${h},75%,${far ? 64 : 76}%,.6)`; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); ctx.lineTo(pts[2], pts[3]); ctx.lineTo(ctl[0], ctl[1]); ctx.closePath(); ctx.fill();
        // light passing through the glass: bright near the bone, deepening and shifting hue toward the trailing edge
        const ex = (pts[2] + pts[4]) / 2, ey = (pts[3] + pts[5]) / 2, g = ctx.createLinearGradient(pts[0], pts[1], ex, ey);
        if (P3) { g.addColorStop(0, 'rgba(255,220,150,.22)'); g.addColorStop(.6, 'rgba(120,70,160,0)'); g.addColorStop(1, 'rgba(10,4,16,.4)'); }
        else { g.addColorStop(0, `hsla(${h + 40},90%,92%,.5)`); g.addColorStop(.55, `hsla(${h},80%,60%,0)`); g.addColorStop(1, `hsla(${h - 50},80%,28%,.42)`); }
        pp(); ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = P3 ? 'rgba(255,220,150,.55)' : 'rgba(255,255,255,.6)'; ctx.lineWidth = .55; ctx.beginPath(); // a fracture in the glass, and a refracted streak
        const fx = lerp2(pts[0], ex, .35), fy = lerp2(pts[1], ey, .35); ctx.moveTo(fx, fy); ctx.lineTo(lerp2(fx, pts[2], .45), lerp2(fy, pts[3], .45) + 2); ctx.moveTo(fx, fy); ctx.lineTo(lerp2(fx, ex, .6) - 1, lerp2(fy, ey, .6)); ctx.lineTo(lerp2(fx, pts[4], .7), lerp2(fy, pts[5], .7));
        ctx.stroke();
        ctx.strokeStyle = P3 ? 'rgba(232,192,106,.7)' : `hsla(${h + 150},95%,72%,.85)`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(pts[2], pts[3]); ctx.quadraticCurveTo(ctl[0], ctl[1], pts[4], pts[5]); ctx.stroke(); // the prismatic fringe along the trailing edge
        ctx.restore();
      }
      pp(); outline(1.2);
    };
    pane([W[0], W[1], T1[0], T1[1], T2[0], T2[1]], [-52, -54], 0);
    pane([W[0], W[1], T2[0], T2[1], T3[0], T3[1]], [-52, -32], 1);
    pane([W[0], W[1], T3[0], T3[1], T4[0], T4[1]], [-38, -16], 2);
    pane([0, 0, W[0], W[1], T4[0], T4[1]], [-10, -18], 3);
    // the finger spars: crystal bones fanning from the wrist
    const bone = P3 ? '#E8C06A' : far ? '#B8A0C8' : '#F2E2C0';
    horn(2, -2, -8, -24, W[0], W[1], 6, 4, bone, 0, 1.2);
    for (const T of [T1, T2, T3]) horn(W[0], W[1], (W[0] + T[0]) / 2 + 3, (W[1] + T[1]) / 2 - 3, T[0], T[1], 3.4, .6, bone, 0, 1);
    horn(W[0], W[1], W[0] - 2, W[1] - 6, W[0] + 4, W[1] - 12, 3.2, .4, bone, 0, 1); // the thumb claw
    ctx.restore();
  }
  CREATURES.wyrm = function (e, a) {
    a = a || {};
    const t = a.t || 0, rage = !!e.enraged, phase = Math.min(3, Math.max(1, e.phase || 1)), wind = a.wind || 0, atk = !!a.atk, P3 = phase === 3;
    const hueBase = rage ? 300 : 0, sat = rage ? 72 : 52;
    const diving = e.state === 'dive', windDive = e.state === 'wind' && e.plan === 'dive', windBreath = e.state === 'wind' && e.plan !== 'dive';
    const grounded = !diving && (e.grounded || 0) > 0 && (e.z || 0) < 6 ? 1 : 0;
    const pitch = diving ? .42 : windDive ? -.32 * wind : 0;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (pitch) { ctx.translate(0, -22); ctx.rotate(pitch); ctx.translate(0, 22); }
    // the spine: point 0 is the neck, the rest trail behind, the wave growing toward the tail
    const N = 16, X = [], Y = [], R = [];
    for (let i = 0; i <= N; i++) {
      const r = 16.5 - i * .74, amp = 13 * Math.min(1, i / 4) * (grounded ? .25 : 1);
      let y = -21 + Math.sin(t * 3 - i * .5) * amp + i * 1.2;
      if (grounded) y = lerp2(y, -r * .95, .85);
      X.push(-6 - i * 11); Y.push(y); R.push(r);
    }
    const hue = (i) => (hueBase + t * 50 + i * 24) % 360;
    const segCol = (i, l) => P3 ? (l > 60 ? '#4A3A5E' : l < 45 ? '#140E1C' : (i % 2 ? '#2A1E36' : '#34264A')) : `hsl(${hue(i)},${sat}%,${l}%)`;
    // wing flap: they flare on a wind-up and fold back in a dive
    const flap = grounded ? .5 : Math.sin(t * 4) * .28 - (wind ? .3 * wind : 0) + (diving ? .7 : 0);
    wyrmWing(X[3] + 4, Y[3] - R[3] * .5, flap - .25, true, hueBase + 60, t, phase, rage);
    // the far foreleg
    const legs = (far) => {
      const sx = X[1] + 8, sy = Y[1] + R[1] * .35, reach = diving ? 1 : windDive ? .3 : 0;
      const ex = sx + 6 + reach * 8, ey = sy + 12 + reach * 4, wx = ex + 9 + reach * 10, wy = ey - 2 + reach * 6 + Math.sin(t * 3) * 1.5;
      const col = P3 ? '#2E2038' : far ? '#5A3E8A' : '#7E5AA8';
      seg(sx, sy, ex, ey, 8, 6, col, 1); seg(ex, ey, wx, wy, 6, 4.6, col, .5);
      for (let c = 0; c < 3; c++) horn(wx + 1, wy - 1 + c * 1.4, wx + 5 + c, wy + c * 1.6, wx + 5 + c * 1.6, wy + 5 + c * 1.2, 2.6, .4, P3 ? '#E8C06A' : '#F2E2C0', 0, .9);
    };
    legs(true);
    // the crystal tail fan
    for (const [da, l, k] of [[-.5, 22, 0], [0, 28, 1], [.5, 20, 2]]) {
      const an = Math.PI + da + Math.sin(t * 3 - N * .5) * .2, x0 = X[N], y0 = Y[N];
      horn(x0, y0, x0 + Math.cos(an) * l * .5, y0 + Math.sin(an) * l * .5 - 3, x0 + Math.cos(an) * l, y0 + Math.sin(an) * l, 7, .6, P3 ? '#3A2A4E' : `hsl(${hue(N + k * 3)},${sat + 10}%,64%)`, 0, 1.2);
    }
    // the body, tail first so each crystal ring overlaps the one behind it
    for (let i = N; i >= 0; i--) {
      const ia = Math.max(0, i - 1), ib = Math.min(N, i + 1), th = Math.atan2(Y[ia] - Y[ib], X[ia] - X[ib]), r = R[i], L = 7.4;
      ctx.save(); ctx.translate(X[i], Y[i]); ctx.rotate(th);
      const ring = [-L * 1.3, 0, -L, -r * .86, L * .5, -r, L * 1.1, -r * .5, L * 1.1, r * .5, L * .5, r, -L, r * .86];
      fillPoly(ring, segCol(i, 58), 0);
      clipIn(() => poly(ring), () => {
        ctx.fillStyle = segCol(i, 76); poly([-L * 1.4, -r * 1.1, L * 1.2, -r * 1.1, L * 1.2, -r * .36, -L * 1.4, -r * .2]); ctx.fill(); // the lit top facet
        ctx.fillStyle = segCol(i, 36); poly([-L * 1.4, r * .42, L * 1.2, r * .3, L * 1.2, r * 1.1, -L * 1.4, r * 1.1]); ctx.fill(); // the shadowed belly facet
        ctx.strokeStyle = P3 ? '#5A4A6E' : `hsl(${hue(i)},${sat}%,84%)`; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-L * .9, -r * .3); ctx.lineTo(L * .4, r * .32); ctx.stroke(); // a facet edge
        ctx.fillStyle = P3 ? '#E8C06A' : `hsl(${hue(i) + 30},40%,86%)`; ctx.fillRect(-L * 1.2, r * .74, L * 2.4, r * .12); // a pale ventral scute
        ctx.fillStyle = 'rgba(255,255,255,.85)'; poly([L * .1, -r * .9, L * .6, -r * .92, L * .4, -r * .66, -L * .1, -r * .66]); ctx.fill(); // a specular glint
      });
      if (DET()) { // (unclipped: each of these keeps inside the ring by itself)
        { // light refracted through the crystal: a bright core, hue-shifted, dark at the far wall
          const g = ctx.createRadialGradient(L * .25, -r * .2, r * .05, 0, 0, r * 1.15);
          if (P3) { g.addColorStop(0, 'rgba(255,214,140,.32)'); g.addColorStop(.45, 'rgba(140,90,180,.06)'); g.addColorStop(1, 'rgba(6,2,12,.45)'); }
          else { g.addColorStop(0, `hsla(${hue(i) + 50},95%,90%,.55)`); g.addColorStop(.45, `hsla(${hue(i) + 20},85%,65%,.08)`); g.addColorStop(1, `hsla(${hue(i) - 40},70%,22%,.45)`); }
          ctx.fillStyle = g; poly(ring); ctx.fill();
        }
        ctx.strokeStyle = P3 ? 'rgba(232,192,106,.35)' : 'rgba(255,255,255,.35)'; ctx.lineWidth = .5; ctx.beginPath(); // the star cut: facets meeting at the table
        for (let k = 0; k < ring.length; k += 4) { ctx.moveTo(L * .15, r * .02); ctx.lineTo(ring[k], ring[k + 1]); } ctx.stroke();
        ctx.lineWidth = 1; ctx.strokeStyle = P3 ? 'rgba(255,200,110,.5)' : `hsla(${hue(i) + 120},95%,70%,.7)`; ctx.beginPath(); ctx.moveTo(-L * .95, r * .78); ctx.lineTo(L * .5, r * .94); ctx.lineTo(L * 1.05, r * .46); ctx.stroke(); // dispersion: a coloured fringe along the lower edge
      }
      poly(ring); outline(1.6);
      if (P3) { ctx.strokeStyle = C('#E8C06A'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-L, -r * .82); ctx.lineTo(L * .5, -r * .96); ctx.lineTo(L * 1.05, -r * .48); ctx.stroke(); }
      add(() => { ctx.fillStyle = P3 ? 'rgba(255,200,110,.35)' : `hsla(${hue(i)},95%,72%,${.18 + phase * .1 + (rage ? .1 : 0)})`; ell(0, r * .02, L * .7, r * .2); ctx.fill(); }); // the living light inside
      const gl = (t * 9) % (N + 10) - i; // a glint running down the length of it, segment to segment
      if (!e.dead && gl > -1 && gl < 1) add(() => { const k = 1 - Math.abs(gl), x = L * .4, y = -r * .8, s = 3 + k * 6; ctx.fillStyle = `rgba(255,255,255,${.85 * k})`; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * .18, y - s * .18); ctx.lineTo(x + s, y); ctx.lineTo(x + s * .18, y + s * .18); ctx.lineTo(x, y + s); ctx.lineTo(x - s * .18, y + s * .18); ctx.lineTo(x - s, y); ctx.lineTo(x - s * .18, y - s * .18); ctx.closePath(); ctx.fill(); });
      if (phase >= 2 && i % 3 === 1 && DET()) { ctx.strokeStyle = P3 ? 'rgba(255,220,140,.9)' : 'rgba(255,255,255,.75)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-L * .2, -r * .7); ctx.lineTo(L * .2, -r * .2); ctx.lineTo(-L * .1, r * .3); ctx.stroke(); } // fractures
      if ((i % 2 === 0 || phase >= 2) && i > 0) { // dorsal crystal spines
        const h = (8 + (i % 4 === 0 ? 6 : 0)) * (phase >= 2 ? 1.3 : 1) * (1 - i / (N + 8));
        horn(-L * .1, -r * .9, -L * .4, -r - h * .6, -L * 1.3, -r - h, 6, .5, P3 ? '#E8C06A' : rage ? '#FFD27A' : '#F2E2A8', 0, 1.1);
      }
      ctx.restore();
    }
    legs(false);
    if (!e.dead && DET()) { // shards of its own crystal hanging in the air about it, turning and catching the light
      for (let j = 0; j < 6; j++) { const si = 2 + j * 2.4, i0 = Math.floor(si), x = X[i0] + Math.sin(t * 1.3 + j * 2) * 6, y = Y[i0] - R[i0] - 12 - (j % 3) * 7 + Math.sin(t * 1.9 + j) * 4, sp = Math.cos(t * 2.6 + j * 1.7), s = 2.4 + (j % 2);
        ctx.fillStyle = P3 ? (sp > 0 ? '#E8C06A' : '#3A2A4E') : `hsla(${hue(i0) + 60},85%,${62 + sp * 20}%,.9)`; const hw = s * (.5 + .5 * Math.abs(sp)); ctx.beginPath(); ctx.moveTo(x, y - s * 1.7); ctx.lineTo(x + hw, y - s * .1); ctx.lineTo(x, y + s * 1.3); ctx.lineTo(x - hw * .6, y); ctx.closePath(); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = .8; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(x, y - s * 1.7); ctx.lineTo(x + hw, y - s * .1); ctx.lineTo(x, y); ctx.closePath(); ctx.fill();
        if (sp > .85) add(() => { ctx.fillStyle = `rgba(255,255,255,${(sp - .85) * 6})`; circle(x, y - s * .4, s * .9); ctx.fill(); }); }
    }
    wyrmWing(X[3] + 6, Y[3] - R[3] * .55, flap, false, hueBase, t, phase, rage);
    // ---- the head
    const open = atk ? .62 : windBreath ? .42 * wind : windDive ? .2 * wind : .06 + Math.sin(t * 2) * .03;
    ctx.save(); ctx.translate(10, grounded ? -17 : -24); ctx.scale(1.28, 1.28); ctx.rotate((atk ? .1 : windBreath ? -.16 * wind : 0) + (diving ? .25 : 0) + Math.sin(t * 3) * .03);
    const hb = P3 ? '#2E2038' : rage ? '#B85AA0' : '#9A72C8', hl = P3 ? '#4A3A5E' : shade(hb, .4), hd = P3 ? '#140E1C' : shade(hb, -.42), gold = P3 ? '#E8C06A' : '#E0B55A';
    horn(0, -12, -14, -22, -32, -30, 5.6, .6, shade(gold, -.25), 3, 1.1); // the far horn
    // the open mouth: a throat lit by the breath it is drawing
    fillPoly([-6, -1, 36, -1, 34, 4 + open * 34, -6, 7], '#2A0E2A', 0);
    if (open > .15) add(() => { const g = ctx.createRadialGradient(6, 4 + open * 8, 0, 6, 4 + open * 8, 16); const c = rage ? '255,180,110' : P3 ? '255,230,160' : '220,180,255'; g.addColorStop(0, `rgba(${c},${.3 + wind * .6})`); g.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = g; circle(6, 4 + open * 8, 16); ctx.fill(); });
    // the lower jaw
    ctx.save(); ctx.translate(-4, 3); ctx.rotate(open); ctx.translate(4, -3);
    ctx.fillStyle = C('#FFFFFF'); for (let x = 10; x <= 30; x += 5) { ctx.beginPath(); ctx.moveTo(x, 3); ctx.lineTo(x + 1.6, -2.4 - (x === 30 ? 2 : 0)); ctx.lineTo(x + 3, 3); ctx.closePath(); ctx.fill(); }
    const jaw = [-8, 2, 31, 2.6, 35, 3.6, 33, 7.6, 20, 10, 4, 11.6, -6, 8.4];
    fillPoly(jaw, hb, 0); detPoly([-8, 5.6, 34, 5.6, 33, 7.6, 20, 10, 4, 11.6, -6, 8.4], hd);
    poly(jaw); outline(1.4);
    horn(-4, 8, -12, 12, -22, 12, 4, .4, gold, 0, 1); // a chin spike
    ctx.restore();
    // the skull: long, angular, cut like a gem
    const skull = () => { ctx.beginPath(); ctx.moveTo(-14, -4); ctx.quadraticCurveTo(-8, -16, 4, -15.4); ctx.lineTo(13, -13.4); ctx.lineTo(17.4, -9.2); ctx.lineTo(36, -6.6); ctx.quadraticCurveTo(42, -5.6, 41.6, -1); ctx.lineTo(38, 1.8); ctx.lineTo(10, 2.6); ctx.quadraticCurveTo(-4, 5, -14, 4); ctx.closePath(); };
    ctx.fillStyle = C('#FFFFFF'); for (let x = 12; x <= 32; x += 5) { ctx.beginPath(); ctx.moveTo(x, 1.6); ctx.lineTo(x + 1.6, 6.6 + (x === 32 ? 3 : 0)); ctx.lineTo(x + 3.2, 1.6); ctx.closePath(); ctx.fill(); outline(.6); }
    skull(); ctx.fillStyle = C(hb); ctx.fill();
    clipIn(skull, () => {
      ctx.fillStyle = hd; poly([-16, -1, 12, -2, 38, -1.4, 44, 3, -16, 8]); ctx.fill(); // the cheek in shadow
      ctx.fillStyle = hl; poly([-8, -17, 13, -14.6, 17.4, -10, 40, -7.4, 40, -5.6, 16, -7.4, 4, -9.4, -10, -8]); ctx.fill(); // the lit top plane
      ctx.strokeStyle = P3 ? gold : shade(hb, .6); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(17.4, -9.2); ctx.lineTo(24, -2); ctx.moveTo(4, -9.4); ctx.lineTo(-1, -1.6); ctx.moveTo(-10, -8); ctx.lineTo(-12, 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.8)'; poly([20, -9.6, 32, -7.8, 31, -7, 20, -8.6]); ctx.fill(); // a specular glint down the snout
      ctx.fillStyle = P3 ? 'rgba(232,192,106,.12)' : 'rgba(255,255,255,.14)'; poly([17.4, -9.2, 24, -2, 36, -6.6]); ctx.fill(); poly([4, -9.4, -1, -1.6, 12, -2]); ctx.fill(); // more cut facets, alternately lit
      ctx.fillStyle = P3 ? 'rgba(0,0,0,.25)' : 'rgba(20,6,40,.2)'; poly([24, -2, 36, -6.6, 41.6, -1, 38, 1.8]); ctx.fill(); poly([-12, 2, -1, -1.6, -10, -8]); ctx.fill();
      if (!LITE) { const g = ctx.createLinearGradient(0, -16, 0, 4); g.addColorStop(0, 'rgba(255,255,255,.14)'); g.addColorStop(.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(10,0,20,.3)'); ctx.fillStyle = g; ctx.fillRect(-16, -17, 60, 22); }
    });
    skull(); outline(1.6);
    // the cheek frills, a brow ridge over the slit of the eye, and a glowing nostril
    horn(-10, 0, -18, 2, -28, 0, 5, .5, gold, 0, 1); horn(-8, -4, -16, -6, -26, -10, 4.4, .5, gold, 0, 1);
    fillPoly([4, -12, 16, -11.4, 14.6, -8.4, 5, -8.8], hd, 1.1);
    const eyeCol = P3 ? '#FFFFFF' : rage ? '#FFD08A' : '#DFF8FF', glowCol = rage ? '#FFB060' : P3 ? '#FFE8A0' : '#9FE8F0';
    glow(glowCol, 10 + wind * 10, () => { ctx.fillStyle = C(eyeCol); ctx.beginPath(); ctx.moveTo(7, -7.6); ctx.quadraticCurveTo(11, -10.2, 15.6, -8.4); ctx.quadraticCurveTo(11.6, -5.6, 7, -7.6); ctx.closePath(); ctx.fill(); });
    if (!a.hurt) { ctx.fillStyle = C(OUT); ell(12, -7.9, .7, 1.7); ctx.fill(); if (DET()) { ctx.fillStyle = '#FFFFFF'; circle(13.4, -8.6, .4); ctx.fill(); } } else { ctx.fillStyle = C(hd); ctx.fillRect(6.6, -8.6, 9, 1.4); }
    glow(glowCol, 6, () => { ctx.fillStyle = C(eyeCol); ell(37.4, -4.6, 1.4, .6, .3); ctx.fill(); });
    // the swept-back crown of horns
    horn(8, -14, -6, -30, -24, -46, 6, .6, gold, 4, 1.2);
    horn(2, -14, -12, -24, -34, -32, 6.4, .6, gold, 4, 1.2);
    horn(14, -13, 10, -22, 2, -28, 3.6, .4, gold, 0, 1);
    { // a jewel set in the temple behind the eye, its colour turning against the body's
      const jw = [-7.4, -6.6, -4, -10.4, -.6, -6.8, -4, -3.4], jc = P3 ? '#E8603A' : `hsl(${hue(0) + 180},80%,62%)`;
      glow(jc, 6 + wind * 8, () => { fillPoly(jw, jc, 0); });
      detPoly([-7.4, -6.6, -4, -10.4, -4, -6.8], 'rgba(255,255,255,.55)'); detPoly([-4, -3.4, -.6, -6.8, -4, -6.8], 'rgba(0,0,0,.3)');
      poly(jw); outline(.9);
    }
    ctx.restore();
    ctx.restore();
    if (P3 && !e.dead && !FLASH && typeof parts !== 'undefined' && e.x !== undefined && Math.random() < .4) parts.push({ x: e.x - e.facing * rand(20, 150), y: e.y, z: e.z + rand(0, 50), vx: 0, vy: 0, vz: rand(20, 60), life: .8, max: .8, col: pick(['#E8C06A', '#FFF0C0']), size: 2.5, shape: 'star', rot: 0, vr: 4 });
  };
})();
