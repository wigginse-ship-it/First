'use strict';
// ---------- the Bloomwild beasts: Jellybloom, Thornboar / Cloud Ram, Pollen Pixie, Mossling Golem / Prism Construct ----------
// Drawn in the same cel-shaded style as the hero: shaped silhouettes, a hard-edged shadow plane on the lower left,
// a lit rim along the top/right (light comes from the upper right), texture detail and dark ink outlines.
(function () {
  const FX = () => !FLASH && !TINT;
  const BIG = () => ctx.rect(-600, -600, 1200, 1200);

  // P(...) builds a reusable path: cmds M x y | L x y | Q cx cy x y | C c1x c1y c2x c2y x y | Z | E cx cy rx ry rot.
  // The returned function appends the shape offset by (ox, oy) to the current path (no beginPath).
  function P(...c) {
    return (ox, oy) => {
      let i = 0;
      while (i < c.length) {
        const k = c[i++];
        if (k === 'M') { ctx.moveTo(c[i] + ox, c[i + 1] + oy); i += 2; }
        else if (k === 'L') { ctx.lineTo(c[i] + ox, c[i + 1] + oy); i += 2; }
        else if (k === 'Q') { ctx.quadraticCurveTo(c[i] + ox, c[i + 1] + oy, c[i + 2] + ox, c[i + 3] + oy); i += 4; }
        else if (k === 'C') { ctx.bezierCurveTo(c[i] + ox, c[i + 1] + oy, c[i + 2] + ox, c[i + 3] + oy, c[i + 4] + ox, c[i + 5] + oy); i += 6; }
        else if (k === 'Z') ctx.closePath();
        else if (k === 'E') { const rx = Math.max(.1, c[i + 2]), ry = Math.max(.1, c[i + 3]), r = c[i + 4]; ctx.moveTo(c[i] + ox + Math.cos(r) * rx, c[i + 1] + oy + Math.sin(r) * rx); ctx.ellipse(c[i] + ox, c[i + 1] + oy, rx, ry, r, 0, TAU); i += 5; }
      }
    };
  }
  // a closed polygon from a flat [x0, y0, x1, y1, ...] list
  function poly(pts) {
    return (ox, oy) => { ctx.moveTo(pts[0] + ox, pts[1] + oy); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i] + ox, pts[i + 1] + oy); ctx.closePath(); };
  }
  // a lumpy, scalloped blob (wool, moss, cloud): n bumps around an ellipse, k = how far each bump swells
  function scal(cx, cy, rx, ry, n, k, seed = 0) {
    return (ox, oy) => {
      const pt = (i, f) => { const th = i / n * TAU, j = 1 + Math.sin(i * 12.9898 + seed) * .08; return [cx + ox + Math.cos(th) * rx * f * j, cy + oy + Math.sin(th) * ry * f * j]; };
      let p = pt(0, 1); ctx.moveTo(p[0], p[1]);
      for (let i = 0; i < n; i++) { const m = pt(i + .5, k), q = pt(i + 1, 1); ctx.quadraticCurveTo(m[0], m[1], q[0], q[1]); }
      ctx.closePath();
    };
  }
  // Cel shading: a flat base, a hard shadow plane on the lower left (the shape minus itself shifted toward the light),
  // an optional thin core shadow at the very edge, and a lit rim along the top/right. o.rot = the current local rotation,
  // so the light keeps coming from the upper right inside rotated limbs. o.tex() paints texture inside the clip.
  function cel(p, col, o = {}) {
    const d = o.d === undefined ? 3 : o.d, r = o.r === undefined ? 1.1 : o.r, w = o.w === undefined ? 1.6 : o.w;
    let lx = 1, ly = -.8;
    if (o.rot) { const c = Math.cos(-o.rot), s = Math.sin(-o.rot); const x = lx * c - ly * s; ly = lx * s + ly * c; lx = x; }
    ctx.beginPath(); p(0, 0); ctx.fillStyle = C(col); ctx.fill();
    if (FX()) {
      ctx.save(); ctx.beginPath(); p(0, 0); ctx.clip();
      if (o.under) o.under();
      if (d) { ctx.fillStyle = o.dark || shade(col, -.3); ctx.beginPath(); BIG(); p(lx * d, ly * d); ctx.fill('evenodd'); }
      if (o.deep) { ctx.fillStyle = o.deepCol || shade(col, -.5); ctx.beginPath(); BIG(); p(lx * o.deep, ly * o.deep); ctx.fill('evenodd'); }
      if (r) { ctx.fillStyle = o.lite || shade(col, .32); ctx.beginPath(); BIG(); p(-lx * r, -ly * r); ctx.fill('evenodd'); }
      if (o.tex) o.tex();
      ctx.restore();
    }
    if (w) { ctx.beginPath(); p(0, 0); outline(w); }
  }
  function strokes(list, col, w) { // short texture strokes: [x0, y0, x1, y1, ...] in groups of four
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath();
    for (let i = 0; i < list.length; i += 4) { ctx.moveTo(list[i], list[i + 1]); ctx.lineTo(list[i + 2], list[i + 3]); }
    ctx.stroke();
  }
  function glow(x, y, r, rgb, al) { // a small additive light (skipped while flashing or tinted)
    if (!FX()) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${al})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
  }
  // a small fierce eye: a dark socket, a glowing slit iris, a glint, and a heavy brow line above it
  function fierceEye(x, y, s, iris, rgb, a, tilt = -.25) {
    ctx.fillStyle = C(OUT); ell(x, y, 2.4 * s, 1.5 * s, tilt); ctx.fill();
    ctx.fillStyle = C(iris); ell(x + .3 * s, y, 1.35 * s, .75 * s, tilt); ctx.fill();
    if (FX()) {
      ctx.fillStyle = OUT; ell(x + .5 * s, y, .35 * s, .7 * s, 0); ctx.fill(); // slit pupil
      ctx.fillStyle = '#FFF6DA'; circle(x + 1 * s, y - .45 * s, .38 * s); ctx.fill(); // glint
      if (rgb) glow(x, y, 5 * s, rgb, a && a.wind ? .55 : .25);
    }
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 1.5 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 2.8 * s, y - 2.6 * s); ctx.lineTo(x + 2.6 * s, y - 1.1 * s); ctx.stroke(); // the brow, drawn down toward the snout
  }

  // ======================= JELLYBLOOM =======================
  // A hopping mass of pink goo with a carnivorous bloom on its crown, a half-digested bone in its gut,
  // slit eyes sunk in the jelly and a ragged maw that gapes as it winds up.
  CREATURES.slime = function (e, a) {
    a = a || {}; const t = a.t || 0, sq = (e && e.sq) || 1, wind = a.wind || 0;
    const wob = Math.sin(t * 6) * .035, w = 15.5 / Math.sqrt(sq) * (1 + wob + wind * .08), h = 25 * sq * (1 - wob - wind * .12);
    const lean = (a.atk ? 3 : 0) - wind * 2;
    const base = '#C84A78', lite = '#F4A6C0', dark = '#7A2350';
    // the glossy puddle it sits in
    cel(P('E', 1, -.6, w + 5, 2.6, 0), shade(base, -.25), { d: 1.2, r: .8, w: 1.2 });
    const body = P('M', -w - 3, 0, 'C', -w - 1.5, -h * .3, -w * 1.08, -h * .72, -w * .42 + lean * .5, -h * .97,
      'C', -w * .05 + lean, -h * 1.06, w * .55 + lean, -h * 1.02, w * .82 + lean, -h * .74,
      'C', w * 1.08 + lean * .5, -h * .45, w * .95, -h * .16, w + 3.5, 0,
      'Q', w * .6, 1.2, w * .2, .2, 'Q', -w * .3, 1.4, -w * .7, .2, 'Q', -w - 1.5, 1, -w - 3, 0, 'Z');
    cel(body, base, {
      d: 4.2, r: 1.5, w: 2, dark: shade(base, -.28), deep: 1.6, deepCol: dark, lite: lite,
      under: () => { // translucent goo: a deeper core, a swallowed bone and rising bubbles, seen through the jelly
        ctx.fillStyle = 'rgba(90,20,60,.35)'; ell(-w * .15, -h * .42, w * .55, h * .3, -.3); ctx.fill();
        ctx.save(); ctx.translate(-w * .2, -h * .38); ctx.rotate(-.5 + Math.sin(t * 1.3) * .08);
        ctx.fillStyle = 'rgba(236,214,196,.55)'; rrect(-5, -1, 10, 2, 1); ctx.fill(); circle(-5, -1.3, 1.6); ctx.fill(); circle(-5, 1.3, 1.6); ctx.fill(); circle(5, -1.3, 1.6); ctx.fill(); circle(5, 1.3, 1.6); ctx.fill();
        ctx.restore();
        ctx.fillStyle = 'rgba(255,214,228,.22)'; ell(w * .1, -h * .14, w * .9, h * .12); ctx.fill(); // subsurface glow near the floor
        ctx.strokeStyle = 'rgba(255,220,235,.55)'; ctx.lineWidth = .8;
        for (let i = 0; i < 4; i++) { const by = -((t * 9 + i * 6.5) % (h * .8)) - 3, bx = Math.sin(i * 2.3 + t) * w * .4 - 2; ctx.beginPath(); ctx.arc(bx, by, .9 + (i % 2) * .7, Math.PI, Math.PI * 1.9); ctx.stroke(); }
      },
      tex: () => { // sharp specular highlights on the upper right and drips running down the flanks
        ctx.fillStyle = 'rgba(255,248,252,.9)';
        ctx.beginPath(); ctx.moveTo(w * .1 + lean, -h * .93); ctx.quadraticCurveTo(w * .6 + lean, -h * .9, w * .72 + lean, -h * .62); ctx.quadraticCurveTo(w * .5 + lean, -h * .8, w * .1 + lean, -h * .93); ctx.fill();
        circle(w * .78 + lean * .5, -h * .5, 1.1); ctx.fill(); circle(w * .7, -h * .42, .6); ctx.fill();
        ctx.fillStyle = 'rgba(122,35,80,.55)';
        [[-w * .7, -h * .45, 1.6, 6], [w * .55, -h * .3, 1.3, 5], [-w * .2, -h * .2, 1.2, 4]].forEach(([x, y, r, l]) => { ctx.beginPath(); ctx.moveTo(x - r, y); ctx.quadraticCurveTo(x - r, y + l, x, y + l + r); ctx.quadraticCurveTo(x + r, y + l, x + r, y); ctx.closePath(); ctx.fill(); });
      },
    });
    // the bloom on its crown: hooked crimson petals around a dark throat
    const cx = -w * .1 + lean, cy = -h * 1.0, open = .25 + wind * .5 + Math.sin(t * 3) * .05;
    for (let i = 0; i < 5; i++) {
      const ang = -Math.PI / 2 + (i - 2) * (.55 + open * .25), L = 9 + (i % 2) * 2, px = cx + Math.cos(ang) * 2, py = cy + Math.sin(ang) * 1.5;
      const tx = px + Math.cos(ang) * L, ty = py + Math.sin(ang) * L, nx = -Math.sin(ang), ny = Math.cos(ang);
      const hook = (i - 2) * .9;
      cel(P('M', px - nx * 2.6, py - ny * 2.6, 'Q', px + Math.cos(ang) * L * .6 - nx * 3.5, py + Math.sin(ang) * L * .6 - ny * 3.5, tx + nx * hook, ty + ny * hook,
        'Q', px + Math.cos(ang) * L * .5 + nx * 2.5, py + Math.sin(ang) * L * .5 + ny * 2.5, px + nx * 2.6, py + ny * 2.6, 'Z'),
        i % 2 ? '#A8244E' : '#C0305A', { d: 1.6, r: .8, w: 1.2, tex: () => { strokes([px, py, tx * .7 + px * .3, ty * .7 + py * .3], 'rgba(60,10,30,.5)', .7); } });
    }
    cel(P('E', cx, cy + .5, 3.6, 2.2, 0), '#3A0E24', { d: 1, r: .6, w: 1.2 });
    ctx.fillStyle = C('#F2D27A'); for (let i = -1; i <= 1; i++) { circle(cx + i * 1.6, cy - .8 - Math.abs(i) * -.6, .8); ctx.fill(); }
    // the face: slit eyes sunk in dark hollows, and a ragged maw
    const fx = w * .42 + lean, fy = -h * .56;
    if (FX()) { ctx.fillStyle = 'rgba(90,16,52,.6)'; ell(fx - 1, fy + .3, 7.5, 3.6, -.12); ctx.fill(); }
    const eyeCol = a.hurt ? '#FFFFFF' : wind ? '#FFE36A' : '#F6E2A0';
    [[fx - 3.6, fy + .6, .85], [fx + 2.4, fy, 1]].forEach(([x, y, s]) => {
      ctx.fillStyle = C(OUT); ell(x, y, 2.3 * s, 1.4 * s, -.2); ctx.fill();
      ctx.fillStyle = C(eyeCol); ctx.beginPath(); ctx.moveTo(x - 1.8 * s, y + .3); ctx.quadraticCurveTo(x, y - 1.3 * s, x + 1.9 * s, y - .5 * s); ctx.quadraticCurveTo(x, y + .6 * s, x - 1.8 * s, y + .3); ctx.fill();
      if (FX()) glow(x, y, 4.5, '255,220,120', wind ? .5 : .22);
      ctx.strokeStyle = C(OUT); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - 2.2 * s, y - 2.6 * s); ctx.lineTo(x + 2.2 * s, y - 1.2 * s); ctx.stroke();
    });
    const gape = 1.2 + wind * 4 + (a.atk ? 5 : 0), my = -h * .3;
    ctx.beginPath(); ctx.moveTo(fx - 7, my - 1); ctx.quadraticCurveTo(fx - 1, my + gape * .2, fx + 4.5, my - 2.2);
    ctx.quadraticCurveTo(fx, my + gape, fx - 7, my - 1); ctx.closePath(); ctx.fillStyle = C('#3A0A22'); ctx.fill(); outline(1.3);
    ctx.fillStyle = C('#F4E6D8'); // needle teeth
    for (let i = 0; i < 5; i++) { const x = fx - 5.5 + i * 2.2; ctx.beginPath(); ctx.moveTo(x, my - 1.2 + i * -.15); ctx.lineTo(x + .7, my + .9 + gape * .25); ctx.lineTo(x + 1.4, my - 1.3 - i * .15); ctx.fill(); }
    if (gape > 2.5 && FX()) { ctx.strokeStyle = 'rgba(250,190,215,.7)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(fx - 3, my); ctx.quadraticCurveTo(fx - 2.5, my + gape * .7, fx - 1.5, my + gape * .5); ctx.stroke(); } // a strand of drool
  };

  // ======================= THORNBOAR / CLOUD RAM =======================
  function hoofLeg(hx, hy, front, s, lift, col, hoofCol) {
    const kx = hx + (front ? s * .55 + 1 : s * .45 - 3), ky = -7 + lift * .4, fx = hx + s + (front ? 1 : -1), fy = -1.4 - lift;
    seg(hx, hy, kx, ky, 10, 4.6, col, 1.8);
    seg(kx, ky, fx, fy, 4.4, 3.2, col, .4);
    ctx.beginPath(); ctx.moveTo(fx - 2.4, fy - 1.2); ctx.lineTo(fx + 2.2, fy - 1.4); ctx.lineTo(fx + 3.4, fy + 1.4); ctx.lineTo(fx - 2.6, fy + 1.4); ctx.closePath();
    ctx.fillStyle = C(hoofCol); ctx.fill(); outline(1.1);
    if (FX()) { ctx.fillStyle = shade(hoofCol, .35); ctx.fillRect(fx - 1.6, fy - 1.1, 3.4, .8); }
  }
  // a ram's horn: a thick ridged spiral that tapers as it curls back and under around the ear
  function ramHorn(cx, cy, R, wd, col, back) {
    const N = 22, out = [], inn = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, th = -1.05 - u * 4.5, r = R * (1 - .5 * u), hw = wd * (1 - .62 * u) / 2;
      out.push(cx + Math.cos(th) * (r + hw), cy + Math.sin(th) * (r + hw) * .92); inn.push(cx + Math.cos(th) * (r - hw), cy + Math.sin(th) * (r - hw) * .92);
    }
    const pts = out.slice(); for (let i = inn.length - 2; i >= 0; i -= 2) pts.push(inn[i], inn[i + 1]);
    cel(poly(pts), back ? shade(col, -.35) : col, {
      d: 2.4, r: 1, w: 1.4, tex: () => { // ridges across the horn
        ctx.strokeStyle = shade(col, -.4); ctx.lineWidth = .8; ctx.beginPath();
        for (let i = 1; i < N; i += 2) { ctx.moveTo(out[i * 2], out[i * 2 + 1]); ctx.lineTo(inn[i * 2], inn[i * 2 + 1]); }
        ctx.stroke();
      },
    });
  }
  CREATURES.boar = function (e, a) {
    a = a || {}; const ram = e && e.def && e.def.pal === 'ram', ph = a.walk || 0, t = a.t || 0, wind = a.wind || 0;
    const lunge = wind ? -4 * wind : a.atk ? 6 : 0, breathe = Math.sin(t * 3) * .5;
    const fur = ram ? '#DCD6E4' : '#9A5232', legC = ram ? '#4C4458' : '#5C3020', farC = ram ? '#352F40' : '#3E2014', hoof = ram ? '#221C26' : '#2A1A18';
    ctx.save(); ctx.translate(lunge, 0);
    if (wind) { ctx.translate(-14, 0); ctx.rotate(-.05 * wind); ctx.translate(14, 0); }
    // far legs, in shadow
    hoofLeg(-11, -16, false, Math.sin(ph + Math.PI) * 5, Math.max(0, Math.cos(ph + Math.PI)) * 2.4, farC, hoof);
    hoofLeg(14, -16, true, Math.sin(ph) * 5 + (wind ? -2 : 0), Math.max(0, Math.cos(ph)) * 2.4, farC, hoof);
    if (ram) {
      // a heaving cloud of wool
      const wool = scal(-1, -23 + breathe * .5, 22, 12.5, 13, 1.22, 3);
      cel(wool, fur, {
        d: 4, r: 1.4, w: 2, dark: '#A69CBC', deep: 1.4, deepCol: '#7C7096', lite: '#FFFFFF',
        tex: () => { // curls of fleece
          ctx.strokeStyle = 'rgba(110,98,140,.55)'; ctx.lineWidth = .9; ctx.beginPath();
          for (let i = 0; i < 9; i++) { const x = -17 + (i % 5) * 8 + (i > 4 ? 4 : 0), y = -27 + (i > 4 ? 8 : 0) + Math.sin(i * 3.1) * 2; ctx.moveTo(x + 2.4, y); ctx.arc(x, y, 2.4, 0, Math.PI * 1.4); }
          ctx.stroke();
        },
      });
    } else {
      // shaggy fringe hanging from the belly
      const fr = []; fr.push(-20, -15); for (let i = 0; i <= 8; i++) { const x = -18 + i * 4.2; fr.push(x, -12.5 + (i % 2) * .4, x + 2, -8.5 - (i % 3) * .6); } fr.push(17, -13);
      cel(poly(fr), shade(fur, -.35), { d: 1.4, r: 0, w: 1.2 });
      const body = P('M', -22, -17, 'C', -26, -24, -19, -29.5, -10, -29.5 + breathe * .3, 'C', -4, -30.5, -2, -35.5, 6, -35.5, 'C', 14, -35.5, 19.5, -30, 20.5, -24,
        'C', 21, -18, 18, -13, 12, -12, 'C', 4, -10, -6, -11, -14, -12, 'C', -19, -13, -22, -14, -22, -17, 'Z');
      cel(body, fur, {
        d: 4.5, r: 1.3, w: 2, deep: 1.5, lite: '#D08A5E',
        tex: () => { // coarse hair, darker toward the belly, lit flicks along the spine
          strokes([-18, -18, -20, -14, -13, -16, -15, -12, -8, -15, -10, -11.5, -2, -15, -4, -11, 4, -15, 2, -11.5, 10, -16, 8, -12, -16, -23, -18, -20, -9, -22, -11, -19, 0, -24, -2, -21, 8, -26, 6, -23, 14, -24, 13, -20.5], 'rgba(60,24,12,.55)', .9);
          strokes([-12, -27.5, -10, -25.5, -4, -29, -2, -27, 4, -33, 6, -31, 11, -32.5, 13, -30.5, 16, -29, 17.5, -27], 'rgba(240,178,130,.7)', .8);
        },
      });
      // a bristling dark mane along the spine, studded with thorns
      const sp = [-19, -26, -13, -29.5, -7, -31, -1, -34, 5, -35, 11, -33.5, 16, -30.5], m = [];
      for (let i = 0; i < sp.length; i += 2) { m.push(sp[i], sp[i + 1] + 3); }
      const mp = []; for (let i = 0; i < sp.length - 2; i += 2) { mp.push(sp[i], sp[i + 1] + 1.5, (sp[i] + sp[i + 2]) / 2 - 3, (sp[i + 1] + sp[i + 3]) / 2 - 5.5 - (i % 4) * .5); } mp.push(sp[sp.length - 2], sp[sp.length - 1] + 1.5);
      for (let i = m.length - 2; i >= 0; i -= 2) mp.push(m[i] + 1, m[i + 1] + 1);
      cel(poly(mp), '#3E2216', { d: 2, r: 1, lite: '#7A4A30', w: 1.4 });
      [[-12, -31, -.5, 8], [-2, -35, -.35, 10], [7, -36, -.2, 9], [-7, -33, -.45, 6]].forEach(([x, y, ang, L]) => {
        const tx = x + Math.sin(ang) * L - 2, ty = y - Math.cos(ang) * L;
        cel(P('M', x - 2, y + 1.5, 'Q', x - 1.5, y - L * .5, tx, ty, 'Q', x + .8, y - L * .4, x + 2.2, y + 1.5, 'Z'), '#5E7E3E', {
          d: 1.4, r: .8, w: 1.1, lite: '#A8C860', tex: () => { ctx.fillStyle = '#E2D69A'; ctx.beginPath(); ctx.arc(tx, ty, 1.4, 0, TAU); ctx.fill(); },
        });
      });
    }
    // near legs
    hoofLeg(-14, -17, false, Math.sin(ph) * 5, Math.max(0, Math.cos(ph)) * 2.4, legC, hoof);
    hoofLeg(11, -17, true, Math.sin(ph + Math.PI) * 5 + (wind ? 3 * Math.sin(t * 18) : 0), Math.max(0, Math.cos(ph + Math.PI)) * 2.4 + (wind ? 2 : 0), legC, hoof);
    // the head, lowered to charge while it winds up
    const hr = (ram ? .3 : .2) * wind + (a.atk ? .18 : 0) + Math.sin(ph * 2) * .03;
    ctx.save(); ctx.translate(13, -22); ctx.rotate(hr); ctx.translate(-13, 22);
    if (ram) {
      ramHorn(13.5, -25.5, 8.5, 6.4, '#C4A26C', true); // the far horn peeks out behind
      const head = P('M', 11, -30, 'C', 16, -34, 22, -32, 26, -27, 'L', 32.5, -19.5, 'Q', 34.5, -16, 32, -13, 'C', 29, -11, 25, -11, 21, -12.5, 'C', 16, -13.5, 12, -16, 10.5, -21, 'Z');
      cel(head, '#5E5670', { d: 2.8, r: 1.1, w: 1.8, deep: 1, lite: '#9A90B0', tex: () => { strokes([22, -27, 31, -18.5], 'rgba(170,160,196,.6)', .9); } });
      ctx.fillStyle = C('#2A2230'); ell(32.2, -16.4, .9, 1.4, .4); ctx.fill();
      ctx.strokeStyle = C(OUT); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(31.5, -13.2); ctx.lineTo(27, -12.6); ctx.stroke();
      fierceEye(22.6, -24.4, .95, wind ? '#FF7A3A' : '#E8B040', wind ? '255,110,50' : null, a);
      cel(scal(17, -30.5, 5, 2.8, 7, 1.3, 1), fur, { d: 1.4, r: .8, w: 1.4, dark: '#A69CBC', lite: '#FFFFFF' }); // a woolly forelock
      ramHorn(15.5, -25, 9, 7, '#D8B67C', false);
    } else {
      const head = P('M', 11, -31, 'C', 17, -33.5, 22, -29.5, 27, -24, 'L', 32, -20.5, 'Q', 34.8, -19.5, 34.4, -15, 'Q', 33.8, -11.8, 31, -12,
        'C', 28, -10, 24, -9.5, 20, -10.5, 'C', 15, -11.5, 11, -14, 9.5, -19, 'Z');
      cel(head, fur, {
        d: 3.2, r: 1.2, w: 1.8, deep: 1.1, lite: '#D08A5E',
        tex: () => { strokes([14, -16, 12.5, -12.5, 17, -14, 16, -11, 20, -13, 19.5, -10.5, 16, -27, 14, -24], 'rgba(60,24,12,.55)', .9); strokes([20, -29, 27, -22.5], 'rgba(240,178,130,.7)', .9); },
      });
      cel(P('E', 34, -16.2, 1.7, 3.5, 0), '#7A3A34', { d: .8, r: .5, w: 1.2 }); // the snout disc
      ctx.fillStyle = C('#2A1210'); ell(34.4, -17.3, .6, .9); ctx.fill(); ell(34.4, -14.6, .5, .7); ctx.fill();
      ctx.strokeStyle = C(OUT); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(31, -12.6); ctx.quadraticCurveTo(27, -11.8, 24.5, -12.6); ctx.stroke();
      cel(P('M', 26.8, -12.4, 'Q', 32, -12.6, 32.4, -21.2, 'Q', 30.2, -15.6, 26.2, -14.4, 'Z'), '#EADFC4', { d: 1, r: .6, w: 1.2, dark: '#B8A888' }); // the tusk
      cel(P('M', 13.5, -30, 'L', 8.5, -37.5, 'Q', 12.5, -35, 17, -31, 'Z'), shade(fur, -.1), { d: 1.4, r: .7, w: 1.3 }); // the ear, laid back
      fierceEye(22.4, -24.6, .95, wind ? '#FF5A3A' : '#E89A3A', wind ? '255,80,40' : null, a);
    }
    ctx.restore();
    ctx.restore();
  };

  // ======================= POLLEN PIXIE =======================
  // A wasp-waisted fae: dragonfly wings veined with light, a striped stinging abdomen, a thorny crown of petals,
  // burning eyes, and a ball of pollen-fire that swells in its claws as it winds up to throw.
  function pixieWing(rootX, rootY, ang, len, wid, flap, back) {
    ctx.save(); ctx.translate(rootX, rootY); ctx.rotate(ang); ctx.scale(1, flap);
    const p = P('M', 0, 0, 'C', len * .25, -wid, len * .8, -wid * .9, len, -wid * .2, 'C', len * .9, wid * .4, len * .4, wid * .5, 0, 0, 'Z');
    ctx.beginPath(); p(0, 0); ctx.fillStyle = C(back ? 'rgba(220,170,230,.45)' : 'rgba(250,215,240,.55)'); ctx.fill();
    if (FX()) {
      ctx.save(); ctx.beginPath(); p(0, 0); ctx.clip();
      ctx.fillStyle = back ? 'rgba(120,90,170,.3)' : 'rgba(255,255,255,.35)'; ell(len * .6, -wid * .45, len * .4, wid * .35); ctx.fill();
      ctx.strokeStyle = back ? 'rgba(90,50,110,.6)' : 'rgba(110,60,120,.7)'; ctx.lineWidth = .6; ctx.beginPath(); // veins
      ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * .5, -wid * .55, len, -wid * .2);
      for (let i = 1; i < 6; i++) { const x = len * i / 6; ctx.moveTo(x, -wid * .5 * Math.sin(Math.PI * i / 6) - wid * .1); ctx.lineTo(x + len * .06, wid * .35 * Math.sin(Math.PI * i / 6)); }
      ctx.stroke(); ctx.restore();
    }
    ctx.beginPath(); p(0, 0); ctx.lineWidth = 1; ctx.strokeStyle = FLASH ? '#fff' : 'rgba(42,27,44,.85)'; ctx.stroke();
    ctx.restore();
  }
  CREATURES.wisp = function (e, a) {
    a = a || {}; const t = a.t || 0, wind = a.wind || 0, atk = !!a.atk;
    const flap = .35 + .65 * Math.abs(Math.sin(t * 30)), bob = Math.sin(t * 3.2) * 1.2, by = -12 + bob;
    // pollen aura and drifting motes
    if (FX()) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, by, 1, 0, by, 22 + wind * 6); g.addColorStop(0, `rgba(255,220,130,${.35 + wind * .3})`); g.addColorStop(1, 'rgba(255,120,200,0)');
      ctx.fillStyle = g; circle(0, by, 22 + wind * 6); ctx.fill();
      ctx.fillStyle = 'rgba(255,236,150,.85)';
      for (let i = 0; i < 6; i++) { const an = t * (1.4 + i * .2) + i * 1.05, r = 12 + (i % 3) * 3.5; circle(Math.cos(an) * r, by + Math.sin(an) * r * .6, .7 + (i % 2) * .5); ctx.fill(); }
      ctx.restore();
    }
    ctx.save(); ctx.translate(0, by);
    const lean = atk ? .25 : -wind * .2; ctx.rotate(lean);
    pixieWing(-2, -4, -2.2, 17, 5, flap, true);
    pixieWing(-2, -3, -2.75, 13, 4, flap * .9, true);
    // dangling legs, trailing back
    const sw = Math.sin(t * 4) * 1.2;
    seg(-1, 3, -5, 8 + sw * .3, 2.6, 1.8, '#3E2A3A'); seg(-5, 8 + sw * .3, -9, 12 + sw, 1.8, 1.1, '#3E2A3A');
    // the striped abdomen and its sting
    const ab = P('M', -1, 1, 'C', 1, 6, -2, 13, -7, 14.5, 'Q', -10, 15, -11.5, 18, 'Q', -11, 13, -9, 10, 'C', -7, 6, -5, 3, -3, 0, 'Z');
    cel(ab, '#E2B03C', {
      d: 2, r: .8, w: 1.4, deep: .8, lite: '#FFE08A',
      tex: () => { ctx.strokeStyle = '#3A2228'; ctx.lineWidth = 1.7; ctx.beginPath(); ctx.moveTo(-5, 3); ctx.lineTo(0, 4); ctx.moveTo(-7, 6.5); ctx.lineTo(-.3, 7.5); ctx.moveTo(-9, 10); ctx.lineTo(-2, 10.8); ctx.moveTo(-10, 13); ctx.lineTo(-5, 13.6); ctx.stroke(); },
    });
    seg(1, 3, 4, 8 + sw * .3, 2.6, 1.8, '#4A3446'); seg(4, 8 + sw * .3, 2, 12.5 + sw, 1.8, 1.1, '#4A3446');
    // thorax: a dark chitin bodice
    cel(P('M', -4.5, -6, 'C', -1, -9, 4, -8, 4.6, -4, 'C', 5, 0, 2, 3, -1, 3, 'C', -4, 3, -6, -2, -4.5, -6, 'Z'), '#4A3446', { d: 1.8, r: .8, w: 1.5, lite: '#8C6A88', tex: () => { strokes([-2, -6, 0, 2, 1.5, -6.5, 3, 1], 'rgba(230,180,90,.55)', .8); } });
    // the far arm
    seg(-2, -5, -5, 0, 2.2, 1.6, '#B49A70'); seg(-5, 0, -3, 4, 1.6, 1.3, '#B49A70');
    // the head: a narrow, sharp-chinned fae face with a swept-back ear
    ctx.save(); ctx.translate(1.5, -11); ctx.scale(1.3, 1.3);
    cel(P('M', -4.2, -3.2, 'C', -3, -6, 3, -6.4, 4.6, -2.6, 'C', 5.4, -.6, 5.6, 1.6, 4.6, 3.4, 'L', 2.6, 4.6, 'C', 0, 4.6, -3, 3, -4.4, .6, 'Z'), '#DCC496', { d: 2.4, r: .8, w: 1.3, deep: .8, lite: '#FFF4D6', tex: () => { ctx.fillStyle = 'rgba(70,30,60,.55)'; ctx.beginPath(); ctx.moveTo(-1, -2.4); ctx.lineTo(5.6, -1.8); ctx.lineTo(5, .6); ctx.lineTo(0, .4); ctx.closePath(); ctx.fill(); } });
    cel(P('M', -2, -1.5, 'L', -9, -5, 'Q', -4.5, -.5, -2.4, 1, 'Z'), '#D6C08E', { d: 1, r: .5, w: 1.1 }); // pointed ear
    // a crown of hooked petals for hair
    [[-3.5, -4, -2.6, 8, '#B83A6A'], [-1, -5.2, -2.2, 9, '#D0507E'], [2, -5.4, -1.7, 7.5, '#B83A6A'], [3.8, -4, -1.2, 5.5, '#E06A92']].forEach(([x, y, ang, L, col]) => {
      const tx = x + Math.cos(ang) * L, ty = y + Math.sin(ang) * L;
      cel(P('M', x - 1.8, y + 1, 'Q', x + Math.cos(ang) * L * .5 - 2, y + Math.sin(ang) * L * .5 - 1.5, tx, ty, 'Q', x + Math.cos(ang) * L * .4 + 2, y + Math.sin(ang) * L * .4 + 1, x + 1.8, y + 1, 'Z'), col, { d: 1.2, r: .6, w: 1.1 });
    });
    // antennae tipped with pollen
    ctx.strokeStyle = C(OUT); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(2.5, -5); ctx.quadraticCurveTo(5, -10, 8.5, -10 + Math.sin(t * 5) * .8); ctx.moveTo(1, -5); ctx.quadraticCurveTo(2, -11, 4.5, -12.5 + Math.sin(t * 5 + 1) * .8); ctx.stroke();
    ctx.fillStyle = C('#FFE07A'); circle(8.5, -10 + Math.sin(t * 5) * .8, 1.1); ctx.fill(); circle(4.5, -12.5 + Math.sin(t * 5 + 1) * .8, 1); ctx.fill();
    // burning almond eye, hard brow
    ctx.fillStyle = C(OUT); ell(2.8, -.8, 2.2, 1.2, -.25); ctx.fill();
    ctx.fillStyle = C(a.hurt ? '#FFFFFF' : wind ? '#FFFFFF' : '#FFE07A'); ctx.beginPath(); ctx.moveTo(1, -.4); ctx.quadraticCurveTo(3, -2, 4.9, -1.3); ctx.quadraticCurveTo(3.2, -.2, 1, -.4); ctx.fill();
    glow(2.9, -.9, 4, '255,210,110', .3 + wind * .4);
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(.2, -3.2); ctx.lineTo(5, -1.9); ctx.stroke();
    ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(2, 2.8); ctx.lineTo(4.4, 2.3); ctx.stroke(); // a thin mouth
    ctx.restore();
    // the near arm, raised with a swelling ball of pollen-fire
    const reach = atk ? 1 : wind;
    const hx = 6 + reach * 4, hy = -4 - reach * 3 + (atk ? 3 : 0);
    seg(2, -5, 4 + reach * 2, -1 + -reach * 2, 2.4, 1.8, '#C8AE80'); seg(4 + reach * 2, -1 - reach * 2, hx, hy, 1.8, 1.4, '#C8AE80');
    ctx.strokeStyle = C(OUT); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + 2.2, hy - 1); ctx.moveTo(hx, hy); ctx.lineTo(hx + 2, hy + 1); ctx.stroke(); // claws
    const orb = 1.5 + wind * 3.5 + (atk ? 2.5 : 0) + Math.sin(t * 12) * .3;
    if (orb > 1.6) {
      glow(hx + 2, hy, orb * 3, '255,200,110', .7);
      ctx.fillStyle = C('#FFF2B0'); circle(hx + 2, hy, orb); ctx.fill();
      if (FX()) { ctx.fillStyle = '#FFFFFF'; circle(hx + 2.4, hy - .4, orb * .5); ctx.fill(); }
    }
    pixieWing(-1, -5, -1.85, 18, 5.5, flap, false);
    pixieWing(-1, -4, -2.4, 14, 4.2, flap * .95, false);
    ctx.restore();
  };

  // ======================= MOSSLING GOLEM / PRISM CONSTRUCT =======================
  // A hunched rock giant: a faceted boulder of a torso, a small brooding head sunk below its shoulders, stumpy legs,
  // and one huge club of an arm. Moss and flowers grow over its back; cracks glow with the light inside.
  // The Prism Construct is the same frame in blue crystal, with violet shards bristling where the moss would be.
  function shardCluster(x, y, list, cols) {
    list.forEach(([ang, L, wd], i) => {
      const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx, col = cols[i % cols.length];
      const bx = x + nx * (i - list.length / 2) * 2.2, byy = y + ny * (i - list.length / 2) * 2.2;
      const pts = [bx - nx * wd, byy - ny * wd, bx - nx * wd + dx * L * .78, byy - ny * wd + dy * L * .78, bx + dx * L, byy + dy * L, bx + nx * wd + dx * L * .78, byy + ny * wd + dy * L * .78, bx + nx * wd, byy + ny * wd];
      cel(poly(pts), col, {
        d: wd * .9, r: .9, w: 1.3, lite: '#FFFFFF',
        tex: () => { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(bx + dx * 2, byy + dy * 2); ctx.lineTo(bx + dx * L * .8, byy + dy * L * .8); ctx.lineTo(bx + dx * L, byy + dy * L); ctx.stroke(); },
      });
    });
  }
  function mossClump(cx, cy, rx, ry, n, seed, col) {
    cel(scal(cx, cy, rx, ry, n, 1.3, seed), col, {
      d: 2.2, r: 1, w: 1.4, lite: shade(col, .4),
      tex: () => { ctx.fillStyle = shade(col, -.35); for (let i = 0; i < n; i++) { const th = i / n * TAU; circle(cx + Math.cos(th) * rx * .5, cy + Math.sin(th) * ry * .45, .8); ctx.fill(); } },
    });
  }
  CREATURES.golem = function (e, a) {
    a = a || {}; const cry = !!(e && e.def && e.def.crystal), ph = a.walk || 0, t = a.t || 0, wind = a.wind || 0, atk = !!a.atk;
    const rock = cry ? '#7FB0D2' : '#8C8272', dk = cry ? '#3C5C9A' : '#5A5046', lt = cry ? '#E2F8FF' : '#C2B8A4';
    const molten = !cry && e && e.bare; // its guard broken (armor_a.js): the rock split open on a molten core
    const glowCol = cry ? '#E8FCFF' : molten ? '#FFB050' : '#FFD27A', glowRGB = cry ? '160,236,255' : molten ? '255,120,40' : '255,190,90';
    const moss = '#5E8A40';
    const bob = Math.abs(Math.sin(ph)) * 1.2 - wind * 2 + (atk ? 2 : 0), lean = atk ? 3 : -wind * 3;
    const rockTex = (pts) => () => { // cracks, pits and chips over a rock face
      ctx.strokeStyle = shade(dk, -.25); ctx.lineWidth = 1; ctx.beginPath();
      for (let i = 0; i < pts.length; i += 2) { const [x, y] = pts[i], [x2, y2] = pts[i + 1]; ctx.moveTo(x, y); ctx.lineTo((x + x2) / 2 + 1.5, (y + y2) / 2); ctx.lineTo(x2, y2); }
      ctx.stroke();
      ctx.strokeStyle = cry ? 'rgba(255,255,255,.6)' : 'rgba(230,220,200,.5)'; ctx.lineWidth = .7; ctx.beginPath();
      for (let i = 0; i < pts.length; i += 2) { const [x, y] = pts[i], [x2, y2] = pts[i + 1]; ctx.moveTo(x + .9, y - .7); ctx.lineTo((x + x2) / 2 + 2.4, (y + y2) / 2 - .7); ctx.lineTo(x2 + .9, y2 - .7); }
      ctx.stroke();
    };
    // the far arm, hanging in shadow behind the body
    const swayB = Math.sin(ph) * .12;
    ctx.save(); ctx.translate(-13 + lean * .5, -52 + bob); ctx.rotate(1.78 + swayB - wind * .4);
    cel(poly([-2, -6, 16, -6, 18, 6, -2, 7]), shade(rock, -.3), { d: 3, r: .8, w: 1.6, rot: 1.78 });
    cel(poly([14, -7, 28, -8, 33, -3, 33, 7, 27, 9, 14, 7]), shade(rock, -.3), { d: 3, r: .8, w: 1.6, rot: 1.78 });
    ctx.restore();
    // legs: thick stone pillars with slab feet
    const leg = (x, s, lift, col) => {
      const kx = x + s * .5, fx = x + s, fy = -lift;
      cel(poly([x - 7.5, -26 + bob, x + 6.5, -27 + bob, kx + 6.5, -11, kx + 1, -9, kx - 6.5, -10.5]), col, { d: 3.4, r: 1, w: 1.8, tex: rockTex([[x - 2, -22], [kx + 1, -13]]) });
      cel(poly([fx - 8, fy, fx - 7.5, fy - 9, fx - 1, fy - 12, fx + 6, fy - 10, fx + 11, fy - 3.5, fx + 11, fy]), col, { d: 3, r: 1, w: 1.8, deep: 1, tex: rockTex([[fx + 2, fy - 9], [fx + 4, fy - 2]]) });
      if (FX()) { ctx.strokeStyle = 'rgba(30,20,20,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(fx + 6, fy); ctx.lineTo(fx + 6.5, fy - 3); ctx.moveTo(fx + 2.5, fy); ctx.lineTo(fx + 3, fy - 3); ctx.stroke(); } // toe splits
    };
    leg(-8, Math.sin(ph + Math.PI) * 4.5, Math.max(0, Math.cos(ph + Math.PI)) * 3, shade(rock, -.22));
    leg(8, Math.sin(ph) * 4.5, Math.max(0, Math.cos(ph)) * 3, rock);
    ctx.save(); ctx.translate(lean, bob);
    // pelvis
    cel(poly([-16, -31, 14, -32, 16, -21, 2, -18, -14, -19]), shade(rock, -.12), { d: 3, r: 1, w: 1.8 });
    // the torso: a hunched, faceted boulder
    const torso = poly([-14, -24, -21, -33, -25.5, -46, -22, -59, -12, -67, 3, -68, 15, -62, 21, -53, 19, -41, 13, -29, 4, -23]);
    cel(torso, rock, {
      d: 6, r: 1.6, w: 2.4, deep: 2, lite: lt,
      tex: () => {
        // a lit facet plate across the upper chest and a shadowed plane under the ribs
        ctx.fillStyle = shade(rock, .16); ctx.beginPath(); ctx.moveTo(-6, -65); ctx.lineTo(6, -66); ctx.lineTo(17, -58); ctx.lineTo(18, -48); ctx.lineTo(6, -46); ctx.lineTo(-4, -54); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = shade(dk, -.2); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(-4, -54); ctx.lineTo(6, -46); ctx.lineTo(18, -48); ctx.moveTo(6, -46); ctx.lineTo(4, -35); ctx.lineTo(13, -29); ctx.moveTo(-4, -54); ctx.lineTo(-16, -48); ctx.stroke();
        ctx.fillStyle = shade(rock, -.18); ctx.beginPath(); ctx.moveTo(6, -46); ctx.lineTo(18, -45); ctx.lineTo(13, -29); ctx.lineTo(4, -35); ctx.closePath(); ctx.fill();
        rockTex([[-18, -42], [-12, -32], [-10, -60], [-15, -52], [10, -60], [14, -53]])();
        ctx.fillStyle = shade(dk, -.2); [[-8, -40, 1.1], [-15, -38, .8], [0, -58, .9], [-19, -50, .7]].forEach(([x, y, r]) => { circle(x, y, r); ctx.fill(); });
      },
    });
    // a glowing crack over the heart
    const pulse = .6 + .4 * Math.sin(t * 3) + wind * .6;
    ctx.beginPath(); ctx.moveTo(1, -50); ctx.lineTo(-3, -44); ctx.lineTo(1, -40); ctx.lineTo(-2, -33); ctx.lineTo(1.5, -40.5); ctx.lineTo(-1.5, -44); ctx.closePath();
    ctx.fillStyle = C(glowCol); ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = C(OUT); ctx.stroke();
    glow(-1, -42, 9 + wind * 4, glowRGB, .35 * pulse);
    if (molten) { // veins of fire split out from the heart across the torso
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const veins = [[-1, -44, -8, -49, -12, -56, -17, -60], [-2, -40, -10, -38, -17, -42, -22, -47], [0, -47, 4, -55, 2, -61, 6, -65], [-1, -36, -6, -31, -12, -28], [1, -42, 6, -38, 11, -33]];
      for (const [w, col] of [[3.4, OUT], [2.1, '#FF7A2A'], [.8, '#FFE6A0']]) { ctx.strokeStyle = C(col); ctx.lineWidth = w; ctx.beginPath(); for (const v of veins) { ctx.moveTo(v[0], v[1]); for (let i = 2; i < v.length; i += 2) ctx.lineTo(v[i], v[i + 1]); } ctx.stroke(); }
      glow(-8, -48, 18, '255,110,40', .3 * pulse); glow(4, -58, 10, '255,110,40', .25 * pulse);
    }
    // growth over the back and shoulders
    if (cry) {
      shardCluster(-12, -64, [[-2.1, 13, 2.6], [-1.75, 17, 3.2], [-1.4, 11, 2.4], [-2.5, 9, 2]], ['#B884D8', '#9FE0F0', '#D4A0EC']);
      shardCluster(-22, -52, [[-2.6, 9, 2.2], [-2.95, 7, 1.8]], ['#9FE0F0', '#B884D8']);
    } else {
      // hanging moss and trailing vines
      if (FX()) { ctx.strokeStyle = '#4A6E34'; ctx.lineWidth = 1.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-21, -58); ctx.quadraticCurveTo(-25 + Math.sin(t * 2) * .8, -50, -23.5, -43); ctx.moveTo(-17, -61); ctx.quadraticCurveTo(-19.5, -55, -18 + Math.sin(t * 2 + 1) * .8, -49); ctx.stroke(); ctx.fillStyle = '#6E9A4A'; [[-23.5, -43], [-18, -49], [-24, -50]].forEach(([x, y]) => { ell(x, y, 1.6, 1, .6); ctx.fill(); }); }
      mossClump(-10, -64.5, 13, 5, 11, 1, moss);
      mossClump(-21, -55, 5, 4, 6, 4, shade(moss, -.08));
      [[-14, -68, '#E07A9A'], [-6, -69, '#F2D27A'], [-19, -60, '#E07A9A']].forEach(([x, y, c]) => { ctx.fillStyle = C(c); for (let i = 0; i < 5; i++) { const th = i / 5 * TAU; circle(x + Math.cos(th) * 1.3, y + Math.sin(th) * 1.3, .9); ctx.fill(); } ctx.fillStyle = C('#FFF2C0'); circle(x, y, .7); ctx.fill(); });
    }
    // the head: a small brooding block sunk forward beneath the shoulders, with a heavy brow over one burning slit
    const hb = wind * 1.5;
    const head = poly([10, -67 + hb, 18, -72.5 + hb, 27, -69.5 + hb, 30.5, -61 + hb, 27.5, -52.5 + hb, 15, -51.5 + hb, 10, -57 + hb]);
    cel(head, rock, {
      d: 3.4, r: 1.2, w: 2, deep: 1.2, lite: lt,
      tex: () => {
        rockTex([[13, -70 + hb], [16, -65 + hb]])();
        ctx.fillStyle = shade(rock, -.42); ctx.beginPath(); ctx.moveTo(11, -63.5 + hb); ctx.lineTo(31, -65 + hb); ctx.lineTo(31, -59.5 + hb); ctx.lineTo(14, -58.5 + hb); ctx.closePath(); ctx.fill(); // the shadow under the brow
        ctx.strokeStyle = lt; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(11, -64.4 + hb); ctx.lineTo(31, -65.9 + hb); ctx.stroke(); // the lit brow ledge
      },
    });
    ctx.beginPath(); ctx.moveTo(18, -61.2 + hb); ctx.lineTo(28.5, -62.6 + hb); ctx.lineTo(27.2, -59.6 + hb); ctx.lineTo(19, -59.4 + hb); ctx.closePath();
    ctx.fillStyle = C(OUT); ctx.fill();
    ctx.beginPath(); ctx.moveTo(20, -60.6 + hb); ctx.lineTo(27.4, -61.9 + hb); ctx.lineTo(26.4, -60.2 + hb); ctx.lineTo(20.5, -60 + hb); ctx.closePath();
    ctx.fillStyle = C(a.hurt ? '#FFFFFF' : glowCol); ctx.fill();
    glow(24, -60.6 + hb, 7 + wind * 4, glowRGB, .45 + wind * .4);
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(18, -55.5 + hb); ctx.lineTo(27.5, -56 + hb); ctx.moveTo(21, -55.6 + hb); ctx.lineTo(21.4, -54 + hb); ctx.moveTo(24.5, -55.8 + hb); ctx.lineTo(24.8, -54.2 + hb); ctx.stroke(); // the jaw seam
    if (!cry) mossClump(18, -72 + hb, 6, 2.4, 6, 7, shade(moss, .06));
    else shardCluster(17, -72 + hb, [[-1.9, 7, 1.6], [-1.5, 9, 2]], ['#9FE0F0', '#D4A0EC']);
    // the near arm: a pauldron boulder, a thick upper arm and a great club of a fist
    const ang = atk ? .4 : wind ? 1.1 - wind * 3.2 : 1.1 + Math.sin(ph) * .1;
    ctx.save(); ctx.translate(4, -49); ctx.rotate(ang);
    const O = { d: 3.6, r: 1.2, w: 2, rot: ang + 0, lite: lt };
    cel(poly([-1, -6.5, 17, -7, 19, 6.5, 0, 7]), shade(rock, -.06), Object.assign({}, O, { tex: rockTex([[4, -3], [12, 3]]) }));
    cel(poly([15, -7.5, 27, -9, 31, -9.5, 39, -6, 41, 3, 37, 10, 27, 10.5, 15, 7.5]), rock, Object.assign({}, O, {
      d: 4.4, deep: 1.4,
      tex: () => { rockTex([[30, -7], [33, 2], [24, -6], [22, 6]])(); ctx.strokeStyle = shade(dk, -.25); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(36, -6); ctx.lineTo(35, 9); ctx.moveTo(39.5, -2); ctx.lineTo(39, 5); ctx.stroke(); }, // knuckle splits
    }));
    if (wind > .3 || atk) glow(36, 1, 12, glowRGB, wind * .35 + (atk ? .3 : 0));
    // shoulder boulder over the joint
    cel(poly([-9, -4, -5, -10, 4, -11.5, 10, -6, 9, 5, 2, 9, -7, 6]), rock, Object.assign({}, O, { d: 3, tex: rockTex([[-3, -7], [3, -2]]) }));
    ctx.restore();
    if (cry) shardCluster(3, -58, [[-1.3, 8, 2], [-1.65, 11, 2.4], [-2, 7, 1.8]], ['#D4A0EC', '#9FE0F0', '#B884D8']);
    else { mossClump(2, -58, 7.5, 3, 7, 9, moss); ctx.fillStyle = C('#E07A9A'); for (let i = 0; i < 5; i++) { const th = i / 5 * TAU; circle(5 + Math.cos(th) * 1.2, -60 + Math.sin(th) * 1.2, .85); ctx.fill(); } }
    ctx.restore();
  };
})();
