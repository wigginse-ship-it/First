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
    if (!DET()) return; ctx.save(); path(); ctx.clip();
    const g = ctx.createRadialGradient(x, y, r * .05, x, y, r); g.addColorStop(0, `rgba(${hiCol || '255,248,224'},${hiA})`); g.addColorStop(.38, `rgba(${hiCol || '255,248,224'},0)`); g.addColorStop(.72, `rgba(${loCol || '16,10,8'},${loA * .25})`); g.addColorStop(1, `rgba(${loCol || '16,10,8'},${loA})`);
    ctx.fillStyle = g; ctx.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4); ctx.restore();
  }
  // round-metal shading across a cylinder (a barrel, a stack, a greave): from the lit edge (x0, y0) to the shadowed one (x1, y1)
  function cylShade(path, x0, y0, x1, y1, k) {
    if (!DET()) return; k = k || 1; ctx.save(); path(); ctx.clip();
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, `rgba(255,246,220,${.06 * k})`); g.addColorStop(.16, `rgba(255,246,220,${.42 * k})`); g.addColorStop(.3, 'rgba(255,246,220,0)'); g.addColorStop(.66, `rgba(18,10,6,${.1 * k})`); g.addColorStop(1, `rgba(18,10,6,${.46 * k})`);
    ctx.fillStyle = g; const mx = Math.min(x0, x1) - 40, my = Math.min(y0, y1) - 40; ctx.fillRect(mx, my, Math.abs(x1 - x0) + 80, Math.abs(y1 - y0) + 80); ctx.restore();
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
      ctx.save(); tracePath(top, bot); ctx.clip(); // stipple: the cushion's dark hollows low down, a few lit tips
      const dk = [], lt = [];
      for (let i = 0; i < bot.length; i += 2) { const j = Math.min(i, top.length - 2); for (let m = 0; m < 3; m++) { const u = .35 + m * .22, x = lerp2(top[j], bot[i], u) + (hsh(i + m * 13 + k0) - .5) * 4, y = lerp2(top[j + 1], bot[i + 1], u); dk.push(x, y, .9, .7); if (m === 0) lt.push(x + 1.6, y - 2.2, .7, .5); } }
      dots(dk, shade(pal.moss, -.3)); dots(lt, shade(pal.moss, .5)); ctx.restore();
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
      ctx.save(); poly([x - 9.5, -31 + bob, x + 9.5, -31 + bob, kx + 7, ky, kx - 7, ky]); ctx.clip(); // the shadow of the shell's rim on the top of the leg
      const g = ctx.createLinearGradient(0, -31 + bob, 0, -18 + bob); g.addColorStop(0, 'rgba(12,8,6,.55)'); g.addColorStop(1, 'rgba(12,8,6,0)'); ctx.fillStyle = g; ctx.fillRect(x - 14, -32 + bob, 30, 15); ctx.restore(); }
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
    clipIn(dome, () => { const g = ctx.createLinearGradient(0, cy - 16, 0, cy); g.addColorStop(0, 'rgba(10,8,4,0)'); g.addColorStop(1, 'rgba(10,8,4,.5)'); ctx.fillStyle = g; ctx.fillRect(cx - rx, cy - 16, rx * 2, 16); }); // the dome darkens down into the rim
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
  // THE BRASS COLOSSUS, Warden of the Skyport: a walking brass fortress with a furnace heart and a cannon arm.
  // Same skeleton and pose fields as drawHumanoid: feet at 0, hips -30, shoulders -49, head -61 (scaled 1.9 here).
  // ===================================================================================================
  // each phase has its own palette, so it reads by colour alone (it switches at the transformation's pop):
  // 1 bright polished gold-brass, teal cape and trim, a magenta crest, a cool blue eye;
  // 2 darker bronze-copper with verdigris in the seams and edges, the cape faded, the teal gone grey-green, an amber eye;
  // 3 heat-blued gunmetal with temper bands about the core, the cape charred, a black crest, a blazing red eye, red accents
  const CBP = {
    1: { brass: '#C8963E', sleeve: '#A0703A', frame: '#4A3A30', legs: '#5E4226', steel: '#A4A8AE', trim: '#2EA89E', helm: '#D6A652', visor: '#A8E4FF', eye: '120,200,255', plume: '#C83C7A', cape: '#2A6E72', bore: '#FFF4A8', coil: '#3CC6C0', coilGlow: '120,255,240', cog: '#B08A52', patina: null },
    2: { brass: '#8E5C36', sleeve: '#6E4A30', frame: '#3E342E', legs: '#4C3826', steel: '#8A9490', trim: '#6A887C', helm: '#986440', visor: '#FFB040', eye: '255,170,60', plume: '#8A3E5A', cape: '#4A5A56', bore: '#FFF4A8', coil: '#6AA89A', coilGlow: '150,220,190', cog: '#9A7448', patina: '#4FB094' },
    3: { brass: '#4A4652', sleeve: '#3A3640', frame: '#221E24', legs: '#2C2830', steel: '#625E6A', trim: '#B8402E', helm: '#54505C', visor: '#FF4A30', eye: '255,60,40', plume: '#1E1618', cape: '#2A2022', bore: '#FFD0A0', coil: '#E8603A', coilGlow: '255,130,70', cog: '#6A4A40', patina: null },
  };
  let CB = CBP[1];
  function brassPlate(pathFn, col, shadowPts, rimFn, ow) { // fill, a hard shadow plane, a lit rim, an outline
    pathFn(); ctx.fillStyle = C(col); ctx.fill();
    clipIn(pathFn, () => { if (shadowPts) { poly(shadowPts); ctx.fillStyle = shade(col, -.34); ctx.fill(); } if (rimFn) { ctx.strokeStyle = shade(col, .5); ctx.lineWidth = 1; ctx.beginPath(); rimFn(); ctx.stroke(); } });
    if (CB.patina && DET()) clipIn(pathFn, () => { ctx.strokeStyle = CB.patina; ctx.globalAlpha = .75; ctx.lineWidth = 2; pathFn(); ctx.stroke(); ctx.globalAlpha = 1; }); // verdigris creeping in from the edges
    pathFn(); outline(ow || 1.2);
  }
  // a toothed cog turned to ang: teeth, a lit arc on its face, a dark hub
  function cog(x, y, r, n, ang, col, ow) {
    const w = Math.PI / (n * 2) * .62;
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) { const a0 = ang + i / (n * 2) * TAU, rr = i % 2 ? r * .74 : r; ctx.lineTo(x + Math.cos(a0 - w) * rr, y + Math.sin(a0 - w) * rr); ctx.lineTo(x + Math.cos(a0 + w) * rr, y + Math.sin(a0 + w) * rr); }
    ctx.closePath(); ctx.fillStyle = C(col); ctx.fill(); outline(ow || .8);
    if (DET()) { ctx.strokeStyle = shade(col, -.42); ctx.lineWidth = .6; circle(x, y, r * .5); ctx.stroke(); ctx.strokeStyle = shade(col, .5); ctx.beginPath(); ctx.arc(x, y, r * .6, -1.9, -.5); ctx.stroke(); }
    circle(x, y, r * .2); ctx.fillStyle = C('#1E1612'); ctx.fill();
  }
  // ---- how far gone the machine looks, phase by phase (visual only: the fight's numbers live in world.js)
  // 1 polished and whole, slow gears, a steady fire; 2 plates blown off over the clockwork, steam from the joints, a
  // cracked faceplate, faster gears and sparks; 3 overdrive: a red-hot core, glowing seams, a bare frame showing through,
  // heavy smoke, a heat pulse, a flaring eye, jittering pistons, shedding bolts.
  // At each phase change it transforms: the pressure builds for a beat (it shudders, its seams go white-hot, steam leaks),
  // then the plates burst off with debris and a blast of steam and it shows its new state.
  const CV_POP = .32, CV_MAX = 1.15, CV_SPIN = [0, .5, 2.4, 7.5];
  const cvPhase = (e, ph) => (e.cvx && !e.cvx.popped ? e.cvx.from : ph);
  // steam and smoke live in a small pool of their own (no gravity, so they rise; capped, so phones stay smooth)
  function cvPuff(e, ux, uy, vx, vy, r, life, kind) {
    const pool = e.cvSm || (e.cvSm = []), cap = (typeof CROWD !== 'undefined' && CROWD) || LITE ? 12 : 26;
    if (pool.length >= cap) return;
    const s = 1.9 * (e.size || 1);
    pool.push({ x: e.x + e.facing * ux * s, z: e.z - uy * s, vx: vx * e.facing * s, vz: -vy * s, r, life, max: life, kind });
  }
  const CV_JOINTS = [[2, -54], [1, -47], [-4, -46], [4, -16], [-3, -16], [0, -30], [-10, -46]];
  function cvBurst(e, to) { // the pop: plates, cogs and bolts fly, sparks spray, steam blasts out of every joint
    const s = 1.9 * (e.size || 1), room = () => parts.length < 420;
    const brassCols = to === 3 ? ['#5A5662', '#8A5A8A', '#FF8A4A', '#C8A050'] : ['#E0B870', '#C8963E', '#8E5C36', '#4FB094'];
    for (let i = 0; i < (to === 3 ? 10 : 8) && room(); i++) { const j = CV_JOINTS[i % 3 === 0 ? 1 : i % 3 === 1 ? 2 : 6];
      parts.push({ x: e.x + e.facing * (j[0] + rand(-4, 4)) * s, y: e.y + rand(-6, 6), z: e.z - (j[1] + rand(-4, 8)) * s, vx: rand(-220, 220), vy: rand(-20, 20), vz: rand(160, 340), life: 1.5, max: 1.5, col: pick(brassCols), size: rand(3.5, 6), shape: 'plate', rot: rand(0, TAU), vr: rand(-10, 10) }); }
    for (let i = 0; i < 3 && room(); i++) parts.push({ x: e.x + rand(-12, 12), y: e.y + rand(-6, 6), z: e.z + rand(60, 100), vx: rand(-160, 160), vy: rand(-15, 15), vz: rand(200, 320), life: 1.6, max: 1.6, col: pick(['#B4843E', '#8A7A6A']), size: rand(2.6, 4), shape: 'gear', rot: rand(0, TAU), vr: rand(-9, 9) });
    for (let i = 0; i < 6 && room(); i++) parts.push({ x: e.x + rand(-16, 16), y: e.y + rand(-6, 6), z: e.z + rand(50, 120), vx: rand(-200, 200), vy: rand(-15, 15), vz: rand(120, 300), life: 1.2, max: 1.2, col: '#A4A8AE', size: rand(2, 3), shape: 'bolt', rot: rand(0, TAU), vr: rand(-12, 12) });
    if (typeof burst === 'function') burst(e.x, e.y, e.z + 50 * s, to === 3 ? ['#FFFFFF', '#FF9A4A', '#FF5A3A'] : ['#FFFFFF', '#FFE2A0', '#FF9A4A'], 14, 'spark', 0, true);
    for (const j of CV_JOINTS) { const d = j[0] >= 0 ? 1 : -1; cvPuff(e, j[0], j[1], d * rand(10, 26), -rand(4, 14), rand(3, 4.6), rand(.6, .9), 'steam'); }
    fx.push({ kind: 'ring', x: e.x, y: e.y, z: 2, t: .45, max: .45, r: 130, col: '#F0E6DC', flat: 1 });
    shakeMag = Math.max(shakeMag, 9); if (typeof sfx === 'function') sfx('whoosh');
  }
  // called each frame from updateBossRoom (boss_fx.js): the transformation clock, and the machine's breath by phase
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
    const vph = cvPhase(e, ph), r = Math.random, s = 1.9 * (e.size || 1);
    // smoke from the stacks: light wisps, then grey, then a heavy black plume
    if (r() < dt * [0, 1.6, 3, 6][vph]) { const x = pick([-13, -6.6]); cvPuff(e, x, x < -10 ? -73 : -79, rand(-4, 2), -rand(10, 16), vph === 3 ? rand(4, 5.6) : rand(2.6, 3.8), vph === 3 ? 1.4 : 1.1, vph === 3 ? 'soot' : vph === 2 ? 'smoke' : 'wisp'); }
    // steam venting from the joints
    if (vph >= 2 && r() < dt * (vph === 3 ? 11 : 8)) { const j = pick(CV_JOINTS); cvPuff(e, j[0], j[1], (j[0] >= 0 ? 1 : -1) * rand(6, 16), -rand(2, 9), rand(2.2, 3.4), .65, 'steam'); }
    if (parts.length > 380) return;
    // sparks from the torn plates
    if (vph >= 2 && r() < dt * (vph === 3 ? 7 : 3.5)) parts.push({ x: e.x + e.facing * rand(-14, 2) * s, y: e.y, z: e.z + rand(28, 44) * s, vx: rand(-90, 90), vy: 0, vz: rand(60, 180), life: .5, max: .5, col: pick(vph === 3 ? ['#FFE2A0', '#FF7A3A'] : ['#FFD27A', '#FF9A5A']), size: 2, shape: 'streak', rot: 0, vr: 0 });
    // overdrive: it sheds bolts and scraps of plate as it goes
    if (vph === 3 && r() < dt * 1.3) parts.push({ x: e.x + e.facing * rand(-12, 12) * s, y: e.y + rand(-4, 4), z: e.z + rand(20, 50) * s, vx: rand(-60, 60), vy: rand(-8, 8), vz: rand(20, 120), life: 1, max: 1, col: pick(['#A4A8AE', '#8A5A30', '#D08A4A']), size: rand(2, 3.2), shape: r() < .6 ? 'bolt' : 'plate', rot: rand(0, TAU), vr: rand(-10, 10) });
  };
  function cvDrawPuffs(e) { // in the creature's own space: undo the boss's place, facing and scale
    const pool = e.cvSm; if (!pool || !pool.length || FLASH || TINT) return;
    const s = 1.9 * (e.size || 1) * (e.sqx || 1);
    for (const p of pool) {
      const k = p.life / p.max; if (k <= 0) continue;
      const ux = (p.x - e.x) * e.facing / s, uy = -(p.z - e.z) / s, rr = p.r * (1.6 - k * .6);
      const al = Math.min(1, k * 2.2) * (p.kind === 'soot' ? .5 : p.kind === 'smoke' ? .36 : p.kind === 'wisp' ? .24 : .38);
      ctx.globalAlpha = al; ctx.fillStyle = p.kind === 'soot' ? '#3A2E2C' : p.kind === 'smoke' ? '#8A807A' : '#F2ECE6';
      circle(ux, uy, rr); ctx.fill();
      if (!LITE) { ctx.fillStyle = p.kind === 'soot' ? '#5E4C46' : '#FFFFFF'; circle(ux + rr * .28, uy - rr * .3, rr * .55); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }
  function colossusLeg(x, f, k, HIP, cr, far, down, hot, bare, spin, jit) {
    const dk = far ? -.24 : 0, brass = shade(CB.brass, dk - (hot ? .05 : 0));
    let kx, ky, ax, ay;
    if (down) { kx = x + (far ? -2 : 4); ky = -13; ax = x + (far ? -4 : 6); ay = -5; }
    else { kx = x + f * .5 + k; ky = -15 + cr * .45; ax = x + f - .6; ay = -8; }
    seg(x, HIP, kx, ky, 11, 8.6, shade(CB.legs, dk), 1); // the dark frame of the thigh
    // a piston behind the shin
    const pj = jit || 0;
    limb([kx - 3, ky + 1 + pj, ax - 3.6, ay - 1], shade(CB.steel, dk), 1.4);
    seg(kx, ky, ax, ay, 8.6, 7, shade(CB.legs, dk), .5);
    // the thigh plate (blown off in the later phases, baring the frame, a piston and the hip cog)
    const ta = Math.atan2(ky - HIP, kx - x) - Math.PI / 2, tl = Math.hypot(kx - x, ky - HIP);
    ctx.save(); ctx.translate(x, HIP); ctx.rotate(ta);
    if (bare) {
      rrect(-1.4, 2, 3.6, tl * .5, 1); ctx.fillStyle = C(shade(CB.steel, dk - .1)); ctx.fill(); outline(.9);
      line([.4, 2 + tl * .5, .4 + pj * .4, tl - 2 + pj], C(shade(CB.steel, dk + .15)), 1.3);
      if (DET()) line([1.4, 2.6, 1.4, 1 + tl * .5], shade(CB.steel, .5), .5);
      if (hot) add(() => { ctx.strokeStyle = 'rgba(255,110,50,.6)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(-4, 1); ctx.lineTo(-3.4, tl - 2); ctx.stroke(); });
      cog(0, 0, 4.2, 8, (spin || 0) * (far ? -1 : 1), shade(CB.cog, dk), .9);
      fillPoly([-5.6, -.6, -2.6, -1, -3.4, 2.4, -5.2, 1.8], brass, 1); // a torn stub of the plate left on its rivet
    } else {
      brassPlate(() => poly([-5.6, 0, 6.4, -1, 6, tl - 3, -4.6, tl - 2]), brass, [-6, -2, -1.4, -2, -1.4, tl, -6, tl], () => { ctx.moveTo(5.2, 0); ctx.lineTo(4.9, tl - 3.5); }, 1.1);
      cylShade(() => poly([-5.6, 0, 6.4, -1, 6, tl - 3, -4.6, tl - 2]), 6.4, 0, -5.6, 0, .8);
      if (DET()) { ctx.strokeStyle = shade(brass, -.45); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(-5.2, tl * .45); ctx.lineTo(6.2, tl * .42); ctx.stroke(); }
      rivet(3.6, 2.2, .8, brass); rivet(3.6, tl - 5, .8, brass);
    }
    ctx.restore();
    // the shin greave
    const sa = Math.atan2(ay - ky, ax - kx) - Math.PI / 2, sl = Math.hypot(ax - kx, ay - ky);
    ctx.save(); ctx.translate(kx, ky); ctx.rotate(sa);
    brassPlate(() => poly([-3.4, 1, 5, 1.4, 6.2, sl - 2.4, 2, sl + .4, -3, sl - 1]), brass, [-4, 0, .4, 0, .2, sl + 1, -4, sl + 1], () => { ctx.moveTo(5.2, 2); ctx.lineTo(6, sl - 2.8); }, 1.1);
    cylShade(() => poly([-3.4, 1, 5, 1.4, 6.2, sl - 2.4, 2, sl + .4, -3, sl - 1]), 6.2, 0, -3.4, 0, .8);
    if (DET()) { ctx.strokeStyle = shade(brass, -.5); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(-2.6, sl * .5); ctx.quadraticCurveTo(1.6, sl * .5 - 1.6, 5.4, sl * .5); ctx.stroke(); ctx.strokeStyle = shade(brass, .4); ctx.beginPath(); ctx.moveTo(-2.4, sl * .5 + .6); ctx.quadraticCurveTo(1.6, sl * .5 - 1, 5.4, sl * .5 + .6); ctx.stroke(); } // a ridge across the greave
    rivet(2.6, 3.6, .75, brass); rivet(3, sl - 3.2, .75, brass);
    ctx.restore();
    // the knee: a round cap with a bolt
    circle(kx + 1.2, ky, 4.6); ctx.fillStyle = C(shade(brass, .08)); ctx.fill();
    if (DET()) { ctx.fillStyle = shade(brass, -.35); ctx.beginPath(); ctx.arc(kx + 1.2, ky, 4.6, Math.PI * .25, Math.PI * 1.25); ctx.closePath(); ctx.fill(); ctx.fillStyle = shade(brass, .5); ell(kx + 2.4, ky - 2, 1.6, .9, -.6); ctx.fill(); }
    circle(kx + 1.2, ky, 4.6); outline(1.1); rivet(kx + 1.2, ky, 1.1, CB.steel);
    // the sabaton: a heavy, segmented iron foot
    const fx = down ? ax : x + f;
    if (down) { ctx.save(); ctx.translate(ax, ay); ctx.rotate(-1.2); ctx.translate(-fx, 0); }
    const foot = [fx - 5, -9, fx - 6.6, -1.4, fx - 6.6, 0, fx + 10.6, 0, fx + 11, -2.4, fx + 7.6, -5.2, fx + 3, -6.6, fx + 2.2, -9];
    fillPoly(foot, shade(CB.frame, dk + .06), 0);
    detPoly([fx - 6.6, -2.2, fx + 11, -2.2, fx + 10.6, 0, fx - 6.6, 0], shade(CB.frame, -.45));
    detPoly([fx - 5, -9, fx - 6.4, -2.2, fx - 1.6, -2.2, fx - 1.2, -9], shade(CB.frame, -.3));
    poly(foot); outline(1.1);
    fillPoly([fx + 2.6, -6.4, fx + 7.6, -5, fx + 10.6, -2.4, fx + 4, -2.4], shade(brass, .05), 1); // the brass toe-cap
    if (DET()) { line([fx + 3.4, -6.2, fx + 7.4, -5, fx + 9.8, -3], shade(brass, .5), .7); line([fx + 2.2, -8.6, fx + 1.8, -3], shade(CB.frame, .3), .6); }
    if (down) ctx.restore();
  }
  function colossusHead(hy, wind, phase, rage, t, flow, down, flare) {
    const P3 = phase === 3;
    fillPoly([-2.6, hy + 4, 3.6, hy + 4, 3.8, hy + 10, -2.4, hy + 10], '#2E2622', 1); // neck
    if (DET()) { line([-2.4, hy + 6, 3.6, hy + 6], '#5E544E', .7); line([-2.4, hy + 8, 3.6, hy + 8], '#5E544E', .7); }
    // the crimson horsehair crest flowing back
    const fl = flow + (down ? 0 : Math.sin(t * 3) * 1.2);
    const torn = phase >= 2; // (from phase two the crest is half torn away, its end ragged)
    const plume = torn ? () => { ctx.beginPath(); ctx.moveTo(4, hy - 11.6); ctx.quadraticCurveTo(-6, hy - 17, -13 - fl, hy - 12.4); ctx.lineTo(-15.6 - fl, hy - 9.4); ctx.lineTo(-12.4 - fl, hy - 8.8); ctx.lineTo(-16.4 - fl * 1.1, hy - 4.6); ctx.lineTo(-12 - fl, hy - 5.6); ctx.lineTo(-11.2, hy - 2.6); ctx.quadraticCurveTo(-9, hy - 6, -7, hy - 8); ctx.closePath(); }
      : () => { ctx.beginPath(); ctx.moveTo(4, hy - 11.6); ctx.quadraticCurveTo(-6, hy - 17, -15 - fl, hy - 12); ctx.quadraticCurveTo(-21 - fl * 1.3, hy - 8, -22 - fl * 1.5, hy - 1); ctx.lineTo(-18 - fl * 1.2, hy - 4); ctx.lineTo(-18.5 - fl * 1.2, hy + 1.5); ctx.quadraticCurveTo(-14 - fl, hy - 6, -7, hy - 8); ctx.closePath(); };
    const pc = CB.plume; // (faded in phase two; in overdrive scorched black, its ends smouldering)
    plume(); ctx.fillStyle = C(pc); ctx.fill();
    clipIn(plume, () => { ctx.fillStyle = shade(pc, -.38); poly([-26 - fl * 2, hy - 8, 6, hy - 9.6, 6, hy + 4, -26 - fl * 2, hy + 4]); ctx.fill(); ctx.strokeStyle = shade(pc, .35); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(2, hy - 13); ctx.quadraticCurveTo(-8, hy - 16, -16 - fl, hy - 11); ctx.moveTo(-4, hy - 12); ctx.quadraticCurveTo(-12, hy - 13, -19 - fl, hy - 6); ctx.stroke(); });
    if (DET()) { ctx.save(); plume(); ctx.clip(); ctx.strokeStyle = shade(pc, -.5); ctx.lineWidth = .4; ctx.beginPath(); for (let i = 0; i < 6; i++) { const o = i * 1.3; ctx.moveTo(3 - i * 1.4, hy - 12 + o * .3); ctx.quadraticCurveTo(-8 - i, hy - 14 + o, -18 - fl * 1.2, hy - 9 + o * 1.4); } ctx.stroke(); ctx.restore(); } // its horsehair
    plume(); outline(1.1);
    if (phase === 3) add(() => { ctx.strokeStyle = `rgba(255,120,50,${.6 + .3 * Math.sin(t * 10)})`; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(-13 - fl, hy - 12.4); ctx.lineTo(-15.6 - fl, hy - 9.4); ctx.lineTo(-12.4 - fl, hy - 8.8); ctx.lineTo(-16.4 - fl * 1.1, hy - 4.6); ctx.lineTo(-12 - fl, hy - 5.6); ctx.stroke(); });
    // the great helm
    const helm = () => { ctx.beginPath(); ctx.moveTo(-7.6, hy + 5); ctx.lineTo(-8.4, hy - 3); ctx.quadraticCurveTo(-7.4, hy - 11.4, 1, hy - 12); ctx.quadraticCurveTo(8.6, hy - 11.4, 10, hy - 4.4); ctx.lineTo(10.6, hy + 1.6); ctx.lineTo(8.6, hy + 6.4); ctx.lineTo(1.4, hy + 7.4); ctx.closePath(); };
    const hc = CB.helm;
    helm(); ctx.fillStyle = C(hc); ctx.fill();
    clipIn(helm, () => {
      ctx.fillStyle = shade(hc, -.36); poly([-10, hy - 13, -2, hy - 13, -3.4, hy + 9, -10, hy + 9]); ctx.fill(); // the side of the helm, turned from the light
      ctx.fillStyle = shade(hc, -.18); poly([-2, hy - 13, 1.6, hy - 13, .4, hy + 9, -3.4, hy + 9]); ctx.fill();
      ctx.fillStyle = shade(hc, .4); ell(5, hy - 9, 3.6, 1.2, -.25); ctx.fill(); // a bright shine on the dome
      ctx.strokeStyle = shade(hc, .5); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(4, hy - 11.4); ctx.quadraticCurveTo(9, hy - 10, 9.8, hy - 4); ctx.stroke();
      if (phase === 3) { const g = ctx.createLinearGradient(0, hy + 8, 0, hy - 6); g.addColorStop(0, 'rgba(216,176,96,.5)'); g.addColorStop(.35, 'rgba(184,112,64,.35)'); g.addColorStop(.65, 'rgba(138,74,160,.35)'); g.addColorStop(1, 'rgba(74,106,200,0)'); ctx.fillStyle = g; ctx.fillRect(-10, hy - 6, 22, 14); } // heat tint rising up the helm from the fire below
      ctx.fillStyle = '#1E1612'; for (let i = 0; i < 3; i++) ctx.fillRect(4.6, hy + 2.2 + i * 1.5, 5.4, .8); // breathing grille
      if (!LITE) { const g = ctx.createRadialGradient(5.4, hy - 8.4, .5, 3, hy - 4, 14); g.addColorStop(0, 'rgba(255,250,230,.3)'); g.addColorStop(.35, 'rgba(255,250,230,0)'); g.addColorStop(.75, 'rgba(14,8,6,.12)'); g.addColorStop(1, 'rgba(14,8,6,.42)'); ctx.fillStyle = g; ctx.fillRect(-10, hy - 13, 22, 22); }
      ctx.strokeStyle = shade(hc, -.5); ctx.lineWidth = .55; ctx.beginPath(); ctx.moveTo(-8.4, hy - 4.6); ctx.quadraticCurveTo(-4, hy - 6.8, 1.4, hy - 6.2); ctx.moveTo(-8.2, hy - 2.6); ctx.quadraticCurveTo(-4, hy - 4.6, 1.4, hy - 4); ctx.stroke(); // an engraved brow band
      ctx.strokeStyle = shade(hc, .35); ctx.beginPath(); ctx.moveTo(-8.2, hy - 4); ctx.quadraticCurveTo(-4, hy - 6.2, 1.4, hy - 5.6); ctx.stroke();
      ctx.strokeStyle = shade(hc, -.45); ctx.beginPath(); for (let i = 0; i < 4; i++) { const x = -6.6 + i * 2.1; ctx.moveTo(x, hy - 4.2 - i * .4); ctx.quadraticCurveTo(x + .8, hy - 5.6 - i * .4, x + 1.6, hy - 4.4 - i * .4); } ctx.stroke(); // its little scrolls
      if (CB.patina) { ctx.strokeStyle = CB.patina; ctx.globalAlpha = .55; ctx.lineWidth = .6; ctx.beginPath(); for (const x of [-5, -1, 3]) { ctx.moveTo(x, hy - 1); ctx.lineTo(x + .2, hy + 2.6); } ctx.stroke(); ctx.globalAlpha = 1; } // verdigris weeping from the rivets
    });
    helm(); outline(1.3);
    if (phase >= 2) { // the faceplate cracked across; in overdrive the jaw is broken open on the fire inside
      if (phase === 3) { const jaw = [10.6, hy + 1.2, 10.4, hy + 3.4, 8.6, hy + 6.4, 6.4, hy + 7.2, 7.4, hy + 4.6];
        fillPoly(jaw, '#1A0E0C', 0); add(() => { ctx.fillStyle = `rgba(255,90,40,${.6 + .3 * Math.sin(t * 11)})`; circle(8.8, hy + 4.6, 2); ctx.fill(); });
        poly(jaw); ctx.strokeStyle = C(shade(hc, .45)); ctx.lineWidth = .8; ctx.stroke(); }
      const hk = () => { ctx.beginPath(); ctx.moveTo(5.6, hy - 11.9); ctx.lineTo(4.2, hy - 8.6); ctx.lineTo(5.8, hy - 7); ctx.lineTo(4.8, hy - 5.6); ctx.moveTo(4.2, hy - 8.6); ctx.lineTo(1.4, hy - 9.6); ctx.moveTo(8.8, hy - .8); ctx.lineTo(7.4, hy + 2.4); ctx.lineTo(8.8, hy + 4.2); ctx.lineTo(7.6, hy + 6.8); };
      hk(); ctx.strokeStyle = C('#1E1410'); ctx.lineWidth = 1.1; ctx.stroke();
      if (phase === 3) glow('#FF6A3A', 6, () => { hk(); ctx.strokeStyle = C('#FFB070'); ctx.lineWidth = .5; ctx.stroke(); });
    }
    // a heavy brow over the visor slit, which burns brighter as it winds up
    fillPoly([1, hy - 5.6, 10.4, hy - 5.2, 10.4, hy - 3.6, 1.4, hy - 3.8], shade(hc, -.15), 1);
    fillPoly([1.6, hy - 3.6, 10.4, hy - 3.4, 10.2, hy - .8, 2.2, hy - 1.4], '#160E10', 0);
    const flick = phase === 2 && wind < .05 && Math.sin(t * 37) + Math.sin(t * 13.7) > .9; // (in phase two the damaged lens stutters)
    const vc = flick ? '#6A4A20' : CB.visor;
    glow(vc, flick ? 2 : 8 + wind * 10, () => { ctx.fillStyle = C(vc); poly([3, -2.9 + hy, 10.2, -2.7 + hy, 10, -1.4 + hy, 3.4, -1.8 + hy]); ctx.fill(); });
    if (DET()) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(7.6, hy - 2.6, 1.8, .6); }
    if (flare > .02) add(() => { // the lens flares: a long streak across the slit, a short one through it, a bloom
      const L = 12 + flare * 14, g = ctx.createLinearGradient(8 - L, 0, 8 + L, 0);
      g.addColorStop(0, 'rgba(255,90,60,0)'); g.addColorStop(.5, `rgba(255,236,220,${.9 * flare})`); g.addColorStop(1, 'rgba(255,90,60,0)');
      ctx.fillStyle = g; ctx.fillRect(8 - L, hy - 2.7, L * 2, 1.3);
      ctx.fillStyle = `rgba(255,220,200,${.7 * flare})`; ctx.fillRect(8.1, hy - 2 - 6 * flare, .7, 12 * flare);
      ctx.fillStyle = `rgba(255,120,90,${.35 * flare})`; circle(8.4, hy - 2, 3 + flare * 3); ctx.fill();
    });
    if (wind > .05) add(() => { const g = ctx.createRadialGradient(8, hy - 2, 0, 8, hy - 2, 9); g.addColorStop(0, `rgba(${CB.eye},${.55 * wind})`); g.addColorStop(1, 'rgba(255,90,120,0)'); ctx.fillStyle = g; circle(8, hy - 2, 9); ctx.fill(); });
    rivet(-5, hy - 1, .8, hc); rivet(-5, hy + 3, .8, hc); rivet(-1, hy - 9, .7, hc);
    fillPoly([-6, hy - 10, 0, hy - 13.4, 6, hy - 12.2, 0, hy - 11.4], shade(hc, .1), 1); // a crest ridge
  }
  function colossusCannon(wind, pulling, rage, phase, t, planWind) {
    // the forearm is the cannon: a coil-wound breech drum, a banded barrel and a slotted muzzle brake
    seg(0, 0, 9, 1.4, 10, 8.4, CB.sleeve, 1.2);
    circle(9, 1.4, 4.8); ctx.fillStyle = C(CB.frame); ctx.fill(); outline(1.1); rivet(9, 1.4, 1.4, CB.steel);
    const drum = () => rrect(9.5, -7.4, 13, 15, 3.4);
    brassPlate(drum, CB.brass, [9, 1.5, 24, 1.5, 24, 9, 9, 9], () => { ctx.moveTo(11, -7); ctx.lineTo(21, -7); }, 1.3);
    const cg = planWind ? .5 + wind * .5 : pulling ? .8 : .25;
    for (const x of [12, 15.4, 18.8]) {
      ctx.fillStyle = C(shade(CB.coil, -.25)); ctx.fillRect(x, -7.2, 2, 14.4);
      if (DET()) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(${CB.coilGlow},${cg * .8})`; ctx.fillRect(x + .3, -6.8, 1.4, 13.6); ctx.restore(); }
    }
    cylShade(drum, 0, -7.4, 0, 7.6);
    if (DET()) { ctx.strokeStyle = 'rgba(14,10,8,.55)'; ctx.lineWidth = .4; ctx.beginPath(); for (const x of [12, 15.4, 18.8]) for (let y = -6.4; y < 7; y += 1.3) { ctx.moveTo(x, y); ctx.lineTo(x + 2, y + .5); } ctx.stroke(); } // the windings of each coil
    const barrel = () => rrect(22, -5, 17, 10, 2);
    brassPlate(barrel, '#5A4E48', [21, 1, 40, 1, 40, 6, 21, 6], () => { ctx.moveTo(23, -4.2); ctx.lineTo(38, -4.2); }, 1.3);
    cylShade(barrel, 0, -5, 0, 5);
    if (DET()) { ctx.strokeStyle = 'rgba(20,14,12,.5)'; ctx.lineWidth = .5; ctx.beginPath(); for (let x = 28.4; x < 37; x += 1.6) { ctx.moveTo(x, -3.6); ctx.lineTo(x, -1.6); } ctx.stroke(); } // rifling flutes along the barrel
    for (const x of [25, 31]) { rrect(x, -5.8, 2.6, 11.6, 1); ctx.fillStyle = C(shade(CB.brass, .05)); ctx.fill(); cylShade(() => rrect(x, -5.8, 2.6, 11.6, 1), 0, -5.8, 0, 5.8); rrect(x, -5.8, 2.6, 11.6, 1); outline(.9); }
    const brake = () => rrect(38, -6.8, 8, 13.6, 2);
    brassPlate(brake, CB.brass, [37, 1.5, 47, 1.5, 47, 8, 37, 8], () => { ctx.moveTo(39.6, -6.2); ctx.lineTo(45, -6.2); }, 1.3);
    cylShade(brake, 0, -6.8, 0, 6.8);
    ctx.fillStyle = C('#1A1210'); ctx.fillRect(40, -5.6, 1.6, 3.6); ctx.fillRect(40, 2, 1.6, 3.6); ctx.fillRect(43, -5.6, 1.6, 3.6); ctx.fillRect(43, 2, 1.6, 3.6);
    const bc = rage ? '#FFD0A0' : CB.bore, br = 3.4 + (planWind ? wind * 1.6 : 0);
    glow(rage ? '#FF7A4A' : '#FFE27A', 6 + (planWind ? wind * 12 : 0), () => { ell(46.4, 0, 1.8, br); ctx.fillStyle = C(bc); ctx.fill(); });
    if (planWind && wind > .05) add(() => { const g = ctx.createRadialGradient(48, 0, 0, 48, 0, 10 + wind * 10); g.addColorStop(0, `rgba(255,240,170,${.6 * wind})`); g.addColorStop(1, 'rgba(255,190,90,0)'); ctx.fillStyle = g; circle(48, 0, 10 + wind * 10); ctx.fill(); });
    if (pulling) add(() => { // a magnetic field reaches out from the muzzle
      ctx.strokeStyle = 'rgba(159,216,232,.85)'; ctx.lineWidth = 1.4;
      for (let i = 0; i < 4; i++) { const k = (t * 2.4 + i / 4) % 1, x = 74 - k * 26; ctx.globalAlpha = Math.sin(k * Math.PI); ctx.beginPath(); ctx.ellipse(x, 0, 3 + (1 - k) * 4, 6 + (1 - k) * 10, 0, Math.PI * .5, Math.PI * 1.5, true); ctx.stroke(); }
    });
  }
  CREATURES.colossus = function (e, a) {
    a = a || {};
    // (phase here is the phase it looks like: during a transformation it holds the old one until the plates burst)
    const pose = a.pose || {}, t = a.t || 0, rage = !!e.enraged, phase = cvPhase(e, Math.min(3, Math.max(1, e.phase || 1))), wind = a.wind || 0, P3 = phase === 3;
    const X = e.cvx, pre = X && !X.popped ? X.t / CV_POP : 0, post = X && X.popped ? Math.max(0, 1 - (X.t - CV_POP) / (CV_MAX - CV_POP)) : 0;
    const spin = t * CV_SPIN[phase], shake = e.dead ? 0 : Math.max(pre * 1.4, post * .9, P3 ? .3 : 0);
    const jx = shake * Math.sin(t * 61), jy = shake * Math.cos(t * 47) * .6;
    const planWind = e.state === 'wind', pulling = e.state === 'pull';
    ctx.save(); ctx.scale(1.9, 1.9); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const walk = pose.walk || 0, sw = Math.sin(walk), down = !!pose.down;
    if (pose.rot) { ctx.translate(0, -34); ctx.rotate(pose.rot); ctx.translate(0, 34); }
    if (down) { ctx.translate(-6, -4); ctx.rotate(-1.5); }
    const cr = pose.crouch ? 8 : 0, HIP = -30 + cr, SHO = -49 + cr, hy = -61 + cr;
    const flow = (pose.flow || 0) + Math.abs(sw) * 4 + (pose.run ? 6 : 0);
    CB = CBP[phase];
    const hot = P3, brass = CB.brass;
    const br = e.dead || down ? 0 : Math.sin(t * 2.1) * .32; // (it breathes: the boiler rises and settles on its hips with the fire's draught)
    const lean = () => { ctx.translate(jx, HIP + jy - br); ctx.rotate(pose.lean || 0); ctx.translate(0, -HIP); };
    if (P3 && !e.dead) add(() => { // overdrive: a red heat pulse about it, and the air shimmering over its head
      const pr = .5 + .5 * Math.sin(t * 5), g = ctx.createRadialGradient(0, SHO + 10, 4, 0, SHO + 10, 46);
      g.addColorStop(0, `rgba(255,80,40,${.2 + .16 * pr})`); g.addColorStop(1, 'rgba(255,40,20,0)'); ctx.fillStyle = g; circle(0, SHO + 10, 46); ctx.fill();
      ctx.strokeStyle = 'rgba(255,190,160,.2)'; ctx.lineWidth = 1.1; ctx.beginPath();
      for (let i = 0; i < 3; i++) { const x0 = -12 + i * 9, q = t * 4 + i * 2; ctx.moveTo(x0, hy - 14); for (let k = 1; k <= 4; k++) ctx.quadraticCurveTo(x0 + Math.sin(q + k) * 2.6, hy - 16.5 - (k - 1) * 5, x0 + Math.sin(q + k + .5) * .8, hy - 14 - k * 5); }
      ctx.stroke(); });
    // ---- behind the body: smokestacks, the cape, the flywheel, the far arm
    ctx.save(); lean();
    for (const [x, h] of [[-13, 21], [-6.6, 27]]) {
      const st = () => rrect(x - 2.6, SHO - 4 - h, 5.2, h, 1.2);
      brassPlate(st, '#5A4A3E', [x - 3, SHO - 4 - h, x - .6, SHO - 4 - h, x - .6, SHO, x - 3, SHO], () => { ctx.moveTo(x + 1.8, SHO - 3 - h); ctx.lineTo(x + 1.8, SHO - 6); }, 1.1);
      cylShade(st, x + 2.6, 0, x - 2.6, 0);
      if (DET()) { dots([x + .8, SHO - h + 8, .35, .35, x + .8, SHO - h + 13, .35, .35, x + .8, SHO - 8, .35, .35], 'rgba(255,236,200,.6)'); ctx.fillStyle = 'rgba(20,12,10,.35)'; ctx.fillRect(x - 2.6, SHO - 2 - h, 5.2, 2.4); } // rivets, and soot under the cap
      fillPoly([x - 3.6, SHO - 4 - h, x + 3.6, SHO - 4 - h, x + 3, SHO - 1.6 - h, x - 3, SHO - 1.6 - h], '#3A302A', 1); // the cap
      ctx.fillStyle = C(shade(CB.brass, -.1)); ctx.fillRect(x - 2.6, SHO - h + 4, 5.2, 1.4);
      if (DET()) { ctx.fillStyle = P3 || rage ? `rgba(255,120,60,${.7 + .3 * Math.sin(t * 12 + x)})` : 'rgba(40,30,30,.9)'; ell(x, SHO - 4 - h, 2.6, .9); ctx.fill(); }
    }
    // the cape: heavy, tattered, flowing behind
    const wv = Math.sin(walk * .5 + t * 1.5) * 2.4;
    const cape = () => { ctx.beginPath(); ctx.moveTo(-6, SHO - 3); ctx.quadraticCurveTo(-18 - flow, SHO + 8, -22 - flow * 1.4, -5 + wv);
      ctx.lineTo(-19 - flow * 1.3, -9 + wv); ctx.lineTo(-17 - flow * 1.15, -3 + wv * .8); ctx.lineTo(-14 - flow, -8 + wv * .6); ctx.lineTo(-11 - flow * .8, -1 + wv * .5); ctx.lineTo(-8.6 - flow * .6, -7); ctx.lineTo(-5, -4);
      ctx.lineTo(-4, HIP + 6); ctx.lineTo(2, SHO + 1); ctx.closePath(); };
    cape(); ctx.fillStyle = C(CB.cape); ctx.fill();
    clipIn(cape, () => {
      ctx.fillStyle = shade(CB.cape, -.4); ctx.beginPath(); ctx.moveTo(-9, SHO); ctx.quadraticCurveTo(-18 - flow, SHO + 14, -26 - flow * 1.5, 0); ctx.lineTo(-30 - flow * 2, 4); ctx.lineTo(-30 - flow * 2, SHO); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = shade(CB.cape, -.5); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-6, SHO + 2); ctx.quadraticCurveTo(-12 - flow * .6, SHO + 18, -12 - flow, -4); ctx.moveTo(-4, SHO + 8); ctx.quadraticCurveTo(-6 - flow * .4, HIP + 4, -7 - flow * .6, -6); ctx.stroke();
      ctx.strokeStyle = shade(CB.cape, .3); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(-5, SHO - 1); ctx.quadraticCurveTo(-9 - flow * .4, SHO + 10, -9 - flow * .7, HIP + 2); ctx.stroke();
      if (!LITE) { const x0 = -24 - flow * 1.4, g = ctx.createLinearGradient(x0, 0, 2, 0); // the heavy cloth hangs in folds: soft bands of light and shade across it
        g.addColorStop(0, 'rgba(10,6,8,.4)'); g.addColorStop(.18, 'rgba(255,240,220,.2)'); g.addColorStop(.32, 'rgba(10,6,8,.36)'); g.addColorStop(.5, 'rgba(255,240,220,.22)'); g.addColorStop(.66, 'rgba(10,6,8,.3)'); g.addColorStop(.84, 'rgba(255,240,220,.14)'); g.addColorStop(1, 'rgba(10,6,8,.35)');
        ctx.fillStyle = g; ctx.fillRect(x0 - 8, SHO - 6, 40 + flow * 1.4, 60); }
      ctx.fillStyle = shade(CB.brass, .05); ctx.fillRect(-30, SHO - 4, 34, 2.2); // brass-trimmed top edge
      ctx.strokeStyle = shade(CB.trim, .1); ctx.globalAlpha = .7; ctx.lineWidth = .7; ctx.setLineDash([1.2, 1]); ctx.beginPath(); ctx.moveTo(-30, SHO - .8); ctx.lineTo(4, SHO - .8); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; // a stitched border under it
      if (phase >= 2) { // scorched along its hem (charred through in overdrive)
        ctx.fillStyle = P3 ? 'rgba(14,8,8,.6)' : 'rgba(30,20,14,.45)'; ctx.beginPath(); ctx.moveTo(-34, -14 + wv); ctx.quadraticCurveTo(-16, -17, -2, -12); ctx.lineTo(-2, 4); ctx.lineTo(-34, 4); ctx.closePath(); ctx.fill();
        if (P3) { ctx.fillStyle = 'rgba(14,8,8,.4)'; ctx.fillRect(-34, SHO - 2, 40, 10); }
      }
    });
    cape(); outline(1.4);
    if (P3 && !e.dead) add(() => { ctx.strokeStyle = `rgba(255,140,60,${.6 + .3 * Math.sin(t * 9)})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-22 - flow * 1.4, -5 + wv); ctx.lineTo(-19 - flow * 1.3, -9 + wv); ctx.lineTo(-17 - flow * 1.15, -3 + wv * .8); ctx.lineTo(-14 - flow, -8 + wv * .6); ctx.lineTo(-11 - flow * .8, -1 + wv * .5); ctx.stroke(); });
    { const wc = CB.cog; // the flywheel on its back, past the cape: slow, then quick, then a red-hot blur
      cog(-14.6, SHO + 3, 7.6, 10, spin, wc, 1.2);
      if (phase >= 2 && DET()) { ctx.strokeStyle = P3 ? 'rgba(255,150,90,.55)' : 'rgba(255,240,220,.35)'; ctx.lineWidth = .9; ctx.beginPath(); ctx.arc(-14.6, SHO + 3, 9, spin * 1.3, spin * 1.3 + (P3 ? 2.4 : 1.2)); ctx.stroke(); }
      if (P3) add(() => { ctx.strokeStyle = `rgba(255,110,50,${.45 + .3 * Math.sin(t * 9)})`; ctx.lineWidth = 1.3; circle(-14.6, SHO + 3, 6.6); ctx.stroke(); }); }
    // the far arm, in shadow: upper arm, elbow joint, a heavy gauntlet and fist
    const ba = pose.backArm ?? (1.25 + sw * .4), bsx = -4, bsy = SHO + 1.5;
    const bex = bsx + Math.cos(ba) * 9, bey = bsy + Math.sin(ba) * 9, bwx = bex + Math.cos(ba + .25) * 9, bwy = bey + Math.sin(ba + .25) * 9;
    seg(bsx, bsy, bex, bey, 9, 7.4, shade(CB.sleeve, -.25), 1);
    seg(bex, bey, bwx, bwy, 8.4, 9.6, shade(brass, -.3), .6);
    circle(bex, bey, 3.4); ctx.fillStyle = C('#2E2622'); ctx.fill(); outline(1); rivet(bex, bey, 1, CB.steel);
    const bfx = bwx + Math.cos(ba + .25) * 2.4, bfy = bwy + Math.sin(ba + .25) * 2.4;
    rrect(bfx - 4, bfy - 4, 8, 8, 2.4); ctx.fillStyle = C(shade(CB.frame, -.1)); ctx.fill(); outline(1.1);
    ctx.restore();
    // ---- legs
    const pj = P3 && !e.dead ? Math.sin(t * 70) * .9 : 0; // overdrive: the pistons judder
    if (down) { colossusLeg(-3, 0, 0, HIP, cr, true, true, hot, P3, spin, 0); colossusLeg(3, 0, 0, HIP, cr, false, true, hot, phase >= 2, spin, 0); }
    else {
      const run = pose.run ? 1.6 : 1, f1 = sw * 10 * run, f2 = -sw * 10 * run;
      const k1 = cr ? 9 : Math.max(0, sw) * 6, k2 = cr ? 9 : Math.max(0, -sw) * 6;
      colossusLeg(-3, f1, k1, HIP, cr, true, false, hot, P3, spin, -pj); colossusLeg(3, f2, k2, HIP, cr, false, false, hot, phase >= 2, spin, pj);
    }
    // ---- the body, leaning about the hips
    ctx.save(); lean();
    // the pelvis: a cog housing and hanging tassets
    ctx.beginPath(); ctx.arc(0, HIP + 1, 7.4, 0, Math.PI); ctx.closePath(); ctx.fillStyle = C(CB.frame); ctx.fill(); outline(1.1);
    if (DET()) { for (let i = 1; i < 6; i++) { const an = i / 6 * Math.PI; ctx.fillStyle = '#6E625A'; circle(Math.cos(an) * 6.2, HIP + 1 + Math.sin(an) * 6.2, .7); ctx.fill(); } }
    cog(0, HIP + 2.4, 3.6, 8, -spin * 1.6, shade(CB.cog, -.1), .8); // the hip cog, turning with the phase
    brassPlate(() => poly([-11, HIP - 1, -2, HIP - 1, -3, HIP + 9, -10.4, HIP + 8]), shade(brass, -.25), [-12, HIP - 2, -8, HIP - 2, -8, HIP + 10, -12, HIP + 10], null, 1.1);
    brassPlate(() => poly([1, HIP - 1, 11, HIP - 1, 11.6, HIP + 8.4, 2.4, HIP + 9.6]), brass, [0, HIP - 2, 4, HIP - 2, 4.4, HIP + 11, 0, HIP + 11], () => { ctx.moveTo(10.4, HIP); ctx.lineTo(10.8, HIP + 8); }, 1.1);
    cylShade(() => poly([1, HIP - 1, 11, HIP - 1, 11.6, HIP + 8.4, 2.4, HIP + 9.6]), 11.6, 0, 1, 0, .7);
    rivet(7.6, HIP + 2, .8, brass); rivet(7.8, HIP + 6.4, .8, brass);
    // the boiler chest: broad shoulders over a narrower waist
    const seams = () => { ctx.beginPath(); ctx.moveTo(-15, SHO + 4); ctx.quadraticCurveTo(0, SHO + 1, 16, SHO + 4); ctx.moveTo(-13, HIP - 9); ctx.quadraticCurveTo(0, HIP - 7, 14, HIP - 9); ctx.moveTo(-12, HIP - 5); ctx.quadraticCurveTo(0, HIP - 3.4, 12, HIP - 5); ctx.moveTo(0, SHO + 4); ctx.lineTo(0, SHO + 6.4); };
    const chest = () => { ctx.beginPath(); ctx.moveTo(-14, SHO + 2); ctx.quadraticCurveTo(-13, SHO - 5, 0, SHO - 5.6); ctx.quadraticCurveTo(13.4, SHO - 5, 15.4, SHO + 2);
      ctx.quadraticCurveTo(16.2, SHO + 12, 11, HIP - 4); ctx.lineTo(9, HIP + 1); ctx.lineTo(-9, HIP + 1); ctx.lineTo(-11, HIP - 4); ctx.quadraticCurveTo(-16, SHO + 12, -14, SHO + 2); ctx.closePath(); };
    const cg = ctx.createLinearGradient(-14, SHO, 14, SHO + 16); cg.addColorStop(0, C(shade(brass, -.1))); cg.addColorStop(.6, C(brass)); cg.addColorStop(1, C(shade(brass, .18)));
    chest(); ctx.fillStyle = cg; ctx.fill();
    clipIn(chest, () => {
      ctx.fillStyle = shade(brass, -.38); ctx.beginPath(); ctx.moveTo(-17, SHO - 7); ctx.lineTo(-6, SHO - 7); ctx.quadraticCurveTo(-9.6, SHO + 10, -6.4, HIP + 2); ctx.lineTo(-17, HIP + 2); ctx.closePath(); ctx.fill(); // the side in shadow
      ctx.fillStyle = shade(brass, -.18); ctx.beginPath(); ctx.moveTo(-6, SHO - 7); ctx.lineTo(-3, SHO - 7); ctx.quadraticCurveTo(-6, SHO + 10, -3.4, HIP + 2); ctx.lineTo(-6.4, HIP + 2); ctx.quadraticCurveTo(-9.6, SHO + 10, -6, SHO - 7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade(brass, .3); ctx.beginPath(); ctx.moveTo(-2, SHO - 6); ctx.quadraticCurveTo(10, SHO - 6, 15, SHO + 1); ctx.lineTo(13, SHO + 2.4); ctx.quadraticCurveTo(8, SHO - 2.6, -2, SHO - 3.4); ctx.closePath(); ctx.fill(); // light across the collar plate
      ctx.strokeStyle = shade(brass, -.55); ctx.lineWidth = .9; seams(); ctx.stroke(); // plate seams: the collar, the breastplate and the lames over the belly
      ctx.strokeStyle = shade(brass, .5); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-12, HIP - 8.2); ctx.quadraticCurveTo(0, HIP - 6.2, 13.6, HIP - 8.2); ctx.moveTo(-11, HIP - 4.2); ctx.quadraticCurveTo(0, HIP - 2.6, 11.6, HIP - 4.2); ctx.stroke();
      ctx.strokeStyle = shade(brass, .55); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(15, SHO + 3); ctx.quadraticCurveTo(15.6, SHO + 12, 10.6, HIP - 4.4); ctx.stroke(); // rim light
      for (let i = 0; i < 7; i++) { const x = -11 + i * 3.8; rivet(x, SHO + 3.6 + Math.abs(x) * .04 - (Math.abs(x) < 6 ? .8 : 0), .7, brass); }
      for (const x of [-8, 8]) { rivet(x, HIP - 7.4, .55, brass); rivet(x * .9, HIP - 3.4, .55, brass); } // the lames riveted on
      if (!P3) { // engraving: a sun in splendour cut round the furnace hatch, a scroll on the breast (dark cut, a lit lip under it)
        const eng = (dx, dy) => { ctx.beginPath(); for (let i = 0; i < 11; i++) { const an = Math.PI + .2 + i / 10 * (Math.PI - .4), r0 = 8.2, r1 = i % 2 ? 9.8 : 11.2; ctx.moveTo(dx + Math.cos(an) * r0, SHO + 12 + dy + Math.sin(an) * r0 * .9); ctx.lineTo(dx + Math.cos(an) * r1, SHO + 12 + dy + Math.sin(an) * r1 * .9); }
          ctx.moveTo(12.6 + dx, SHO + 9 + dy); ctx.arc(11.6 + dx, SHO + 9 + dy, 1, 0, Math.PI * 1.6); ctx.quadraticCurveTo(10, SHO + 6 + dy, 12.4 + dx, SHO + 6.4 + dy); ctx.quadraticCurveTo(14.6 + dx, SHO + 7.4 + dy, 13.6 + dx, SHO + 11 + dy); ctx.quadraticCurveTo(12, SHO + 14 + dy, 9 + dx, SHO + 13 + dy); };
        ctx.lineWidth = .5; ctx.strokeStyle = shade(brass, .4); eng(-.3, .35); ctx.stroke(); ctx.strokeStyle = shade(brass, -.5); eng(0, 0); ctx.stroke();
      }
      if (!LITE) { // the round of the breastplate: a broad soft shine high on the lit side, shadow tucked under the pauldron and the helm
        const k = phase === 1 ? .32 : phase === 2 ? .16 : .08, g = ctx.createRadialGradient(9, SHO - 1, .5, 9, SHO - 1, 10); g.addColorStop(0, `rgba(255,250,232,${k})`); g.addColorStop(1, 'rgba(255,250,232,0)'); ctx.fillStyle = g; ctx.fillRect(-1, SHO - 11, 20, 20);
        const o = ctx.createRadialGradient(2, SHO + 7.6, 1, 2, SHO + 7.6, 11); o.addColorStop(0, 'rgba(14,8,6,.34)'); o.addColorStop(1, 'rgba(14,8,6,0)'); ctx.fillStyle = o; ctx.fillRect(-9, SHO - 4, 22, 23);
        const n = ctx.createRadialGradient(1.5, SHO - 5.6, .5, 1.5, SHO - 5.6, 6.5); n.addColorStop(0, 'rgba(14,8,6,.45)'); n.addColorStop(1, 'rgba(14,8,6,0)'); ctx.fillStyle = n; ctx.fillRect(-6, SHO - 12, 15, 13);
      }
      if (phase === 1) { // still polished: a clean bright sheen runs down the breastplate
        ctx.fillStyle = 'rgba(255,250,226,.32)'; poly([6, SHO - 6, 9.6, SHO - 6, 3.6, HIP + 2, 0, HIP + 2]); ctx.fill();
        ctx.fillStyle = 'rgba(255,250,226,.2)'; poly([11, SHO - 4, 12.2, SHO - 4, 7, HIP + 2, 5.8, HIP + 2]); ctx.fill();
      } else { // scorched: soot blown out across the brass from the wounds
        ctx.fillStyle = P3 ? 'rgba(40,14,10,.38)' : 'rgba(34,22,16,.42)'; ell(-6, SHO + 8, 8, 5, .5); ctx.fill(); ell(9, HIP - 9, 6, 3.4, -.3); ctx.fill(); ell(4, SHO - 2, 5, 2.4, .2); ctx.fill(); ell(12, SHO + 8, 3, 6, .2); ctx.fill();
      }
      if (CB.patina) { // verdigris in the seams and along the plate edges
        ctx.globalAlpha = .7; ctx.strokeStyle = CB.patina; ctx.lineWidth = 1.3; seams(); ctx.stroke(); ctx.lineWidth = 2.4; chest(); ctx.stroke();
        ctx.fillStyle = CB.patina; ell(13, SHO + 1, 2.4, 1.2, .4); ctx.fill(); ell(-2, HIP - 5.6, 3, .9); ctx.fill();
        ctx.globalAlpha = .5; ctx.lineWidth = .7; ctx.beginPath(); for (let i = 0; i < 7; i++) { const x = -11 + i * 3.8, y = SHO + 4.2; ctx.moveTo(x, y); ctx.lineTo(x + .15, y + 2 + (i * 7 % 5) * .8); } for (const x of [-8, 8]) { ctx.moveTo(x, HIP - 7); ctx.lineTo(x, HIP - 4.6); } ctx.stroke(); // weeping down from the rivets
        dots([4, SHO + 1, .5, .4, -9, SHO + 6, .6, .4, 13, SHO + 12, .5, .5, -3, HIP - 9.6, .5, .3], CB.patina); ctx.globalAlpha = 1;
      }
      if (P3) { // heat tint: temper bands of straw, purple and blue ringed about the core
        ctx.lineWidth = 2.6; ctx.globalAlpha = .55;
        for (const [r, col] of [[9, '#D8B060'], [11.6, '#B87040'], [14.2, '#8A4AA0'], [17, '#4A6AC8']]) { ctx.strokeStyle = col; circle(0, SHO + 12, r); ctx.stroke(); }
        ctx.globalAlpha = 1;
      }
    });
    if (phase >= 2) { // phase two: the breastplate blown open over the clockwork; three: the plating gone to a bare, red-hot frame
      const big = P3;
      const hole = big ? [-15.8, SHO + 3.4, -6, SHO + 2.6, -5.4, SHO + 9, -6.4, HIP - 3, -11.6, HIP - 2.2, -16.2, SHO + 13]
        : [-15.8, SHO + 4.6, -10.6, SHO + 3.6, -6, SHO + 4.6, -5.4, SHO + 10, -6.6, HIP - 10, -12, HIP - 10.6, -16, SHO + 13];
      fillPoly(hole, '#1A1210', 0);
      clipIn(() => poly(hole), () => {
        const fl = .8 + .2 * Math.sin(t * (big ? 17 : 9)), g = ctx.createRadialGradient(-4, SHO + 11, 1, -4, SHO + 11, big ? 15 : 13);
        g.addColorStop(0, big ? `rgba(255,110,50,${fl})` : `rgba(255,150,60,${fl})`); g.addColorStop(1, big ? 'rgba(110,30,14,0)' : 'rgba(90,30,10,.2)'); ctx.fillStyle = g; ctx.fillRect(-18, SHO, 15, 24);
        ctx.strokeStyle = '#6E6862'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-16, SHO + 8); ctx.quadraticCurveTo(-12, SHO + 14, -6, SHO + 16); ctx.stroke();
        cog(-11.2, SHO + 9.6, 4.4, 9, spin * 1.4, big ? '#A0603A' : '#D8A450', 1);
        cog(-7.4, SHO + 14.4, 2.8, 7, -spin * 2.1 + .3, big ? '#8A5030' : '#B88440', .9);
        if (big) {
          for (const y of [SHO + 4.6, SHO + 15.6, SHO + 20.6]) { ctx.fillStyle = '#3A2E28'; ctx.fillRect(-17, y, 14, 2); ctx.fillStyle = '#FF8A4A'; ctx.fillRect(-17, y + 1.4, 14, .6); ctx.fillStyle = '#7A6A5E'; ctx.fillRect(-17, y, 14, .5); }
          ctx.fillStyle = '#3A2E28'; ctx.fillRect(-13.6, SHO, 1.8, 24);
        }
      });
      poly(hole); ctx.strokeStyle = C(shade(brass, .45)); ctx.lineWidth = 1.1; ctx.stroke();
      add(() => { poly(hole); ctx.strokeStyle = big ? `rgba(255,120,60,${.55 + .3 * Math.sin(t * 8)})` : 'rgba(255,170,90,.55)'; ctx.lineWidth = big ? 1.3 : 1.1; ctx.stroke(); });
      // the whole belly plate torn away: a big cog turning in the furnace light (the hatch covers the middle of it)
      const belly = [-11.6, HIP - 11.4, -2, HIP - 12.2, 13.6, HIP - 11.6, 12.6, HIP - 6.4, 10.8, HIP - 2.6, -9.6, HIP - 2.6, -11.4, HIP - 6];
      fillPoly(belly, '#1A1210', 0);
      clipIn(() => poly(belly), () => {
        const k = .7 + .3 * Math.sin(t * (big ? 13 : 6)), g = ctx.createLinearGradient(0, 0, 14, 0);
        g.addColorStop(0, big ? `rgba(255,90,40,${k})` : `rgba(255,140,50,${k})`); g.addColorStop(1, big ? 'rgba(140,30,14,.3)' : 'rgba(80,26,10,.3)'); ctx.fillStyle = g; ctx.fillRect(-12, HIP - 13, 26, 11);
        ctx.fillStyle = '#3A2E28'; ctx.fillRect(-12, HIP - 8, 26, 1.4);
        cog(10.2, HIP - 7.4, 5, 10, -spin * 1.2, big ? '#A0603A' : '#D8A450', 1.1);
        cog(-9.4, HIP - 7, 3.2, 7, spin * 1.8, big ? '#8A5030' : '#B88440', .9);
      });
      poly(belly); ctx.strokeStyle = C(shade(brass, .45)); ctx.lineWidth = 1; ctx.stroke();
      add(() => { poly(belly); ctx.strokeStyle = big ? 'rgba(255,110,50,.7)' : 'rgba(255,170,90,.35)'; ctx.lineWidth = 1; ctx.stroke(); });
      const crk = () => { ctx.beginPath(); ctx.moveTo(9, SHO - 2); ctx.lineTo(6.4, SHO + 1.6); ctx.lineTo(8.6, SHO + 4); ctx.moveTo(10, HIP - 10); ctx.lineTo(7.6, HIP - 7); ctx.moveTo(-10, HIP - 7); ctx.lineTo(-7, HIP - 5);
        if (big) { ctx.moveTo(14.6, SHO + 6); ctx.lineTo(11.6, SHO + 8.4); ctx.lineTo(13, SHO + 11); ctx.moveTo(-3.4, SHO - 4.6); ctx.lineTo(-1.6, SHO - 1.6); ctx.lineTo(-3, SHO + 1); } };
      crk(); ctx.strokeStyle = C('#2A1E16'); ctx.lineWidth = 1.3; ctx.stroke();
      if (P3) glow('#FF6A3A', 8, () => { crk(); ctx.strokeStyle = C('#FFB070'); ctx.lineWidth = .6; ctx.stroke(); });
    }
    // overdrive, or the pressure building before a transformation: the seams glow white-hot
    const seamHot = Math.max(P3 && !e.dead ? .5 + .3 * Math.sin(t * 7) : 0, pre);
    if (seamHot > .02) add(() => { seams(); ctx.strokeStyle = `rgba(255,120,50,${seamHot})`; ctx.lineWidth = 1.7; ctx.stroke(); ctx.strokeStyle = `rgba(255,236,190,${seamHot * .8})`; ctx.lineWidth = .6; ctx.stroke(); });
    chest(); outline(1.5);
    if (phase >= 2) add(() => { // the furnace's light spills out of the openings across the plating
      const k = .2 + .08 * Math.sin(t * (P3 ? 15 : 7)), col = P3 ? '255,80,40' : '255,150,60';
      for (const [x, y, r] of [[-10, SHO + 11, 13], [10, HIP - 7, 12]]) { const g = ctx.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, `rgba(${col},${k})`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; circle(x, y, r); ctx.fill(); }
    });
    // the furnace: a grated hatch over a roaring fire
    // the fire: steady and banked whole, roaring once opened, a ragged white-red flicker in overdrive
    const fy = SHO + 6.4, fr = phase === 1 ? .5 + Math.sin(t * 2.2) * .08 : P3 ? .5 + .5 * Math.sin(t * 23) * Math.sin(t * 7.3) : Math.sin(t * 13) * .5 + .5, roar = Math.max(wind, pulling ? .7 : 0, pre, post * .8);
    rrect(-6.8, fy, 13.6, 11.6, 2.8); ctx.fillStyle = C('#2E2420'); ctx.fill(); outline(1.2);
    const fire = () => rrect(-5.2, fy + 1.6, 10.4, 8.4, 1.8);
    const fg = ctx.createRadialGradient(0, fy + 6.6, .5, 0, fy + 5.8, 7.4);
    fg.addColorStop(0, C(P3 || rage ? '#FFFFFF' : phase === 2 ? '#FFE6A0' : '#FFF2B0')); fg.addColorStop(.35 + fr * .1, C(P3 ? '#FF8A5A' : rage ? '#FFC07A' : phase === 2 ? '#FF9A3A' : '#FFB050')); fg.addColorStop(1, C(P3 ? '#D8261A' : rage ? '#E8402A' : phase === 2 ? '#D8441E' : '#C8502A'));
    glow(rage || P3 ? '#FF5A4A' : '#F2A65A', rage ? 16 : 10, () => { fire(); ctx.fillStyle = fg; ctx.fill(); });
    if (phase >= 2 && DET()) glow('#FF7A4A', 12, () => { ctx.fillStyle = '#FFE2B0'; circle(0, fy + 6, (P3 ? 3.4 : 2.6) + fr * .6); ctx.fill(); }); // the exposed core
    ctx.fillStyle = C('#2A1E18'); for (const x of [-3.4, -.6, 2.2]) ctx.fillRect(x, fy + 1.2, 1.4, 9.2); // grate
    ctx.fillRect(-5.4, fy + 5.2, 10.8, 1);
    if (DET()) { line([-6, fy + .7, 6, fy + .7], '#6E5E52', .7); }
    add(() => { const g = ctx.createRadialGradient(0, fy + 6, 2, 0, fy + 6, 16 + roar * 10); g.addColorStop(0, P3 ? `rgba(255,90,50,${.5 + fr * .15 + roar * .3})` : `rgba(255,170,90,${.35 + fr * .1 + roar * .3 + (rage ? .15 : 0) + (phase === 2 ? .1 : 0)})`); g.addColorStop(1, 'rgba(255,110,60,0)'); ctx.fillStyle = g; circle(0, fy + 6, 16 + roar * 10 + (P3 ? 6 : 0)); ctx.fill(); });
    // a pressure gauge on the breast, needle climbing with each phase
    circle(10.2, SHO + 3.4, 2.8); ctx.fillStyle = C(shade(brass, -.3)); ctx.fill(); outline(1);
    circle(10.2, SHO + 3.4, 1.9); ctx.fillStyle = C('#ECE2C8'); ctx.fill();
    if (DET()) { ctx.strokeStyle = '#C8304A'; ctx.lineWidth = .6; ctx.beginPath(); ctx.arc(10.2, SHO + 3.4, 1.5, -.6, .4); ctx.stroke(); }
    const na = -2.4 + phase * .9 + Math.sin(t * (P3 ? 20 : 3)) * (P3 ? .2 : .08);
    ctx.strokeStyle = C('#1A1214'); ctx.lineWidth = .55; ctx.beginPath(); ctx.moveTo(10.2, SHO + 3.4); ctx.lineTo(10.2 + Math.cos(na) * 1.7, SHO + 3.4 + Math.sin(na) * 1.7); ctx.stroke();
    // the waist band, teal trim with a gear boss
    rrect(-10.4, HIP - 3, 20.8, 4.4, 1.2); ctx.fillStyle = C(CB.trim); ctx.fill();
    clipIn(() => rrect(-10.4, HIP - 3, 20.8, 4.4, 1.2), () => { ctx.fillStyle = shade(CB.trim, -.4); ctx.fillRect(-11, HIP - .4, 22, 3); ctx.fillStyle = shade(CB.trim, .45); ctx.fillRect(-10, HIP - 2.6, 20, .8); });
    rrect(-10.4, HIP - 3, 20.8, 4.4, 1.2); outline(1.1);
    circle(2.6, HIP - .8, 2.6); ctx.fillStyle = C(shade(brass, .1)); ctx.fill(); outline(1); rivet(2.6, HIP - .8, .9, brass);
    // the shoulder mortar on the far shoulder, raised to lob its volley
    ctx.save(); ctx.translate(-7, SHO - 3.4); ctx.rotate(-.55 - (planWind && e.plan === 'volley' ? .5 * wind : 0));
    rrect(-3, -3.4, 6, 6.8, 1.6); ctx.fillStyle = C(CB.frame); ctx.fill(); outline(1);
    brassPlate(() => rrect(0, -3.2, 15, 6.4, 1.8), shade(brass, -.2), [-1, .6, 16, .6, 16, 4, -1, 4], () => { ctx.moveTo(1, -2.6); ctx.lineTo(14, -2.6); }, 1.1);
    cylShade(() => rrect(0, -3.2, 15, 6.4, 1.8), 0, -3.2, 0, 3.2, .8);
    ctx.fillStyle = C(shade(brass, .05)); ctx.fillRect(5, -3.6, 1.6, 7.2); ctx.fillRect(10, -3.6, 1.6, 7.2);
    rrect(14, -4, 3.4, 8, 1.2); ctx.fillStyle = C('#3A302A'); ctx.fill(); outline(1);
    glow(rage ? '#FF7A8A' : '#EED48A', 6, () => { ell(17.2, 0, 1, 2.4); ctx.fillStyle = C(rage ? '#FF7A8A' : '#EED48A'); ctx.fill(); });
    ctx.restore();
    // the head
    colossusHead(hy, wind, phase, rage, t, flow * .5, down, e.dead ? 0 : Math.max(P3 ? .65 + .3 * Math.sin(t * 9) : 0, pre, post));
    // the cannon arm
    const arm = pose.arm ?? (1.1 - sw * .35);
    if (pose.trail && typeof drawTrail === 'function') drawTrail(0, SHO + 2, pose);
    ctx.save(); ctx.translate(1, SHO + 2); ctx.rotate(arm);
    colossusCannon(wind, pulling, rage, phase, t, planWind);
    ctx.restore();
    // the great layered pauldron over the cannon shoulder
    const pa = (k, ry) => { ctx.beginPath(); ctx.ellipse(1, SHO + 1 + k * 2.6, 10 - k * .8, ry, -.25, Math.PI * .92, Math.PI * 2.08); ctx.closePath(); };
    for (let k = 2; k >= (P3 ? 2 : phase === 2 ? 1 : 0); k--) { // (its outer plate is blown off in phase two, and the next one in overdrive)
      const col = shade(brass, k === 0 ? .06 : -.12 - k * .08);
      pa(k, 7 - k); ctx.fillStyle = C(col); ctx.fill();
      clipIn(() => pa(k, 7 - k), () => { ctx.fillStyle = shade(col, -.35); ctx.fillRect(-12, SHO - 8, 7, 20); if (k === 0) { ctx.fillStyle = shade(col, .5); ell(5, SHO - 3.4, 4, 1.4, -.3); ctx.fill(); }
        if (P3) { ctx.lineWidth = 1.8; ctx.globalAlpha = .6; for (const [r, c] of [[4, '#D8B060'], [6, '#8A4AA0'], [8, '#4A6AC8']]) { ctx.strokeStyle = c; circle(1, SHO + 12, r + 4); ctx.stroke(); } ctx.globalAlpha = 1; } });
      if (DET()) { orbShade(() => pa(k, 7 - k), 6, SHO - 4 + k * 2.6, 13 - k, .22, .5);
        ctx.save(); pa(k, 7 - k); ctx.clip(); ctx.lineWidth = .5; // an engraved border following the rim of the plate
        ctx.strokeStyle = shade(col, .42); ctx.beginPath(); ctx.ellipse(1 - .25, SHO + 1 + k * 2.6 + .35, 8.4 - k * .8, 5.6 - k, -.25, Math.PI * 1.02, Math.PI * 1.98); ctx.stroke();
        ctx.strokeStyle = shade(col, -.5); ctx.beginPath(); ctx.ellipse(1, SHO + 1 + k * 2.6, 8.4 - k * .8, 5.6 - k, -.25, Math.PI * 1.02, Math.PI * 1.98); ctx.stroke(); ctx.restore();
        if (k === (P3 ? 2 : phase === 2 ? 1 : 0)) for (let i = 0; i < 5; i++) { const an = Math.PI * (1.12 + i * .19); rivet(1 + Math.cos(an - .25) * (8.6 - k * .8), SHO + 1 + k * 2.6 + Math.sin(an - .25) * (5.8 - k) * .98, .5, col); } }
      pa(k, 7 - k); outline(1.2);
    }
    if (phase >= 2) { // the bare shoulder: a ball joint, its strut and a cog (in overdrive the torn plate edge glows)
      line([-5, SHO - 2, 8, SHO - 3.6], C('#3A2E28'), 2.2);
      circle(1.4, SHO - 1, 4.4); ctx.fillStyle = C('#4A3A30'); ctx.fill(); outline(1.1);
      cog(1.4, SHO - 1, 3.4, 8, spin * 1.2, shade(CB.cog, .15), .8);
      if (P3) add(() => { ctx.strokeStyle = `rgba(255,120,60,${.6 + .3 * Math.sin(t * 8)})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(1, SHO + 6.2, 8.4, 5, -.25, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); });
    } else {
    ctx.fillStyle = C(CB.trim); ctx.fillRect(-6, SHO + 1.2, 13, 1.4);
    rivet(-3, SHO - 2, .8, brass); rivet(4.6, SHO - 3, .8, brass);
    }
    if (phase >= 2) { // a ruptured steam pipe over the far shoulder, jetting a steady plume up and back
      line([-9, SHO + 2, -13.6, SHO - 1.4, -15.6, SHO - 5.4], C('#5E5852'), 2.6);
      if (DET()) line([-9.4, SHO + 1.2, -13.8, SHO - 2.2], '#9A948C', .6);
      fillPoly([-17.4, SHO - 5, -15.6, SHO - 7.2, -13.6, SHO - 5.6, -14.6, SHO - 4.4, -15.8, SHO - 5.8], '#6E6862', .9); // the burst, flared mouth
      if (!FLASH && !TINT && !e.dead) {
        const n = LITE ? 4 : 7;
        for (let i = 0; i < n; i++) { const u = (t * (P3 ? 2.2 : 1.7) + i / n) % 1, x = -16 - u * 9 - Math.sin(u * 5 + i) * 1.4, y = SHO - 7 - u * 24, r = 1.4 + u * (P3 ? 5.4 : 4.6);
          ctx.globalAlpha = (1 - u) * (P3 ? .5 : .62); ctx.fillStyle = P3 ? '#B8ACA4' : '#F4EEE8'; circle(x, y, r); ctx.fill();
          if (!LITE) { ctx.fillStyle = '#FFFFFF'; circle(x + r * .3, y - r * .3, r * .5); ctx.fill(); } }
        ctx.globalAlpha = 1;
      }
    }
    if (P3 && !FLASH && !TINT) { // phase three: red-hot all over
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,70,40,${.16 + .08 * Math.sin(t * 8)})`; chest(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(1, SHO + 6.2, 8.4, 5, -.25, Math.PI * .92, Math.PI * 2.08); ctx.fill(); ctx.restore();
    }
    if (post > .02 && DET()) { // just transformed: the freshly torn metal still flashes white-hot
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,230,190,${.55 * post * post})`; chest(); ctx.fill(); ctx.restore();
    }
    ctx.restore();
    ctx.restore();
    // the steam and smoke it breathes (spawned in colossusFx: world space, drawn here over the body)
    if (e.x !== undefined) { ctx.save(); ctx.scale(1.9, 1.9); cvDrawPuffs(e); ctx.restore(); }
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
      ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); ctx.lineTo(pts[2], pts[3]); ctx.quadraticCurveTo(ctl[0], ctl[1], pts[4], pts[5]); ctx.closePath();
      const h = (hueBase + t * 40 + k * 46) % 360;
      ctx.fillStyle = C(P3 ? (k % 2 ? 'rgba(58,42,74,.92)' : 'rgba(40,28,54,.92)') : `hsla(${h},${rage ? 80 : 68}%,${far ? 44 : 58}%,.9)`); ctx.fill();
      if (DET()) { // each pane is two facets: one catching the light, one in shadow
        ctx.save(); ctx.clip(); ctx.fillStyle = P3 ? 'rgba(232,192,106,.18)' : `hsla(${h},75%,${far ? 64 : 76}%,.6)`; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); ctx.lineTo(pts[2], pts[3]); ctx.lineTo(ctl[0], ctl[1]); ctx.closePath(); ctx.fill();
        // light passing through the glass: bright near the bone, deepening and shifting hue toward the trailing edge
        const ex = (pts[2] + pts[4]) / 2, ey = (pts[3] + pts[5]) / 2, g = ctx.createLinearGradient(pts[0], pts[1], ex, ey);
        if (P3) { g.addColorStop(0, 'rgba(255,220,150,.22)'); g.addColorStop(.6, 'rgba(120,70,160,0)'); g.addColorStop(1, 'rgba(10,4,16,.4)'); }
        else { g.addColorStop(0, `hsla(${h + 40},90%,92%,.5)`); g.addColorStop(.55, `hsla(${h},80%,60%,0)`); g.addColorStop(1, `hsla(${h - 50},80%,28%,.42)`); }
        ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = P3 ? 'rgba(255,220,150,.55)' : 'rgba(255,255,255,.6)'; ctx.lineWidth = .55; ctx.beginPath(); // a fracture in the glass, and a refracted streak
        const fx = lerp2(pts[0], ex, .35), fy = lerp2(pts[1], ey, .35); ctx.moveTo(fx, fy); ctx.lineTo(lerp2(fx, pts[2], .45), lerp2(fy, pts[3], .45) + 2); ctx.moveTo(fx, fy); ctx.lineTo(lerp2(fx, ex, .6) - 1, lerp2(fy, ey, .6)); ctx.lineTo(lerp2(fx, pts[4], .7), lerp2(fy, pts[5], .7));
        ctx.stroke();
        ctx.strokeStyle = P3 ? 'rgba(232,192,106,.7)' : `hsla(${h + 150},95%,72%,.85)`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(pts[2], pts[3]); ctx.quadraticCurveTo(ctl[0], ctl[1], pts[4], pts[5]); ctx.stroke(); // the prismatic fringe along the trailing edge
        ctx.restore();
      }
      outline(1.2);
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
        if (!LITE) { // light refracted through the crystal: a bright core, hue-shifted, dark at the far wall
          const g = ctx.createRadialGradient(L * .25, -r * .2, r * .05, 0, 0, r * 1.15);
          if (P3) { g.addColorStop(0, 'rgba(255,214,140,.32)'); g.addColorStop(.45, 'rgba(140,90,180,.06)'); g.addColorStop(1, 'rgba(6,2,12,.45)'); }
          else { g.addColorStop(0, `hsla(${hue(i) + 50},95%,90%,.55)`); g.addColorStop(.45, `hsla(${hue(i) + 20},85%,65%,.08)`); g.addColorStop(1, `hsla(${hue(i) - 40},70%,22%,.45)`); }
          ctx.fillStyle = g; ctx.fillRect(-L * 1.5, -r * 1.2, L * 3, r * 2.4);
        }
        ctx.strokeStyle = P3 ? 'rgba(232,192,106,.35)' : 'rgba(255,255,255,.35)'; ctx.lineWidth = .5; ctx.beginPath(); // the star cut: facets meeting at the table
        for (let k = 0; k < ring.length; k += 4) { ctx.moveTo(L * .15, r * .02); ctx.lineTo(ring[k], ring[k + 1]); } ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.85)'; poly([L * .1, -r * .9, L * .6, -r * .92, L * .4, -r * .66, -L * .1, -r * .66]); ctx.fill(); // a specular glint
        ctx.lineWidth = 1; ctx.strokeStyle = P3 ? 'rgba(255,200,110,.5)' : `hsla(${hue(i) + 120},95%,70%,.7)`; ctx.beginPath(); ctx.moveTo(-L * .95, r * .78); ctx.lineTo(L * .5, r * .94); ctx.lineTo(L * 1.05, r * .46); ctx.stroke(); // dispersion: a coloured fringe along the lower edge
      });
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
