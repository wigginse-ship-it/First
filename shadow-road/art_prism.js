'use strict';
// Prism & sky creatures: the Prism Imp, the Aurora Jelly, the Shard Crab and the Sky Ray, redrawn in a high-fidelity
// cel-shaded style. Light comes from the UPPER RIGHT: hard shadow planes sit lower-left, a lit rim runs along top/right edges.
(function () {
  const LX = .6, LY = -.8; // direction toward the light
  const DET = () => !FLASH && !TINT;
  const poly = (pts) => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let k = 2; k < pts.length; k += 2) ctx.lineTo(pts[k], pts[k + 1]); ctx.closePath(); };
  const fillPoly = (pts, col) => { poly(pts); ctx.fillStyle = C(col); ctx.fill(); };
  // cel shading for any closed path: base fill, a hard crescent of shadow on the lower-left, an optional deeper core,
  // a lit rim on the upper-right, then the ink outline
  function cel(path, base, dk, off, lt, ow = 1.3) {
    path(); ctx.fillStyle = C(base); ctx.fill();
    if (DET()) {
      ctx.save(); path(); ctx.clip();
      ctx.fillStyle = dk; ctx.fillRect(-400, -400, 800, 800);
      ctx.save(); ctx.translate(off, -off); path(); ctx.fillStyle = base; ctx.fill(); ctx.restore();
      if (lt) { ctx.translate(-1.1, 1.1); path(); ctx.strokeStyle = lt; ctx.lineWidth = 1.8; ctx.stroke(); }
      ctx.restore();
    }
    path(); outline(ow);
  }
  // a smooth tapered tube through a list of points (tails, tentacles, whips), shaded on its lower-left side
  function tubePath(pts, w0, w1) {
    const n = pts.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const p = pts[Math.max(0, i - 1)], q = pts[Math.min(n - 1, i + 1)];
      let tx = q[0] - p[0], ty = q[1] - p[1]; const d = Math.hypot(tx, ty) || 1; tx /= d; ty /= d;
      const w = (w0 + (w1 - w0) * i / (n - 1)) / 2;
      L.push([pts[i][0] - ty * w, pts[i][1] + tx * w]); R.push([pts[i][0] + ty * w, pts[i][1] - tx * w]);
    }
    return () => {
      ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]);
      for (let i = 1; i < n - 1; i++) ctx.quadraticCurveTo(L[i][0], L[i][1], (L[i][0] + L[i + 1][0]) / 2, (L[i][1] + L[i + 1][1]) / 2);
      ctx.lineTo(L[n - 1][0], L[n - 1][1]);
      ctx.quadraticCurveTo(pts[n - 1][0] + (pts[n - 1][0] - pts[n - 2][0]) * .3, pts[n - 1][1] + (pts[n - 1][1] - pts[n - 2][1]) * .3, R[n - 1][0], R[n - 1][1]);
      for (let i = n - 2; i > 0; i--) ctx.quadraticCurveTo(R[i][0], R[i][1], (R[i][0] + R[i - 1][0]) / 2, (R[i][1] + R[i - 1][1]) / 2);
      ctx.lineTo(R[0][0], R[0][1]); ctx.closePath();
    };
  }
  function tube(pts, w0, w1, col, dk, lt, ow = 1.1) { cel(tubePath(pts, w0, w1), col, dk || shade(col, -.35), Math.max(.8, (w0 + w1) * .18), lt, ow); }
  // a faceted crystal shard from a base point: a ridge splits it into a lit and a shadowed face, with a bright glint on the ridge
  const ICE = { lt: '#E4FCFF', mid: '#8ADBEA', dk: '#4F6FBE', deep: '#33317A' };
  const ROSE = { lt: '#FFE2F6', mid: '#E29AE0', dk: '#8A4FB4', deep: '#4E2A7A' };
  function shard(x, y, len, ang, w, pal = ICE, ow = 1.1) {
    const dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx;
    const tx = x + dx * len, ty = y + dy * len;
    const s1x = x + dx * len * .62 + px * w * .5, s1y = y + dy * len * .62 + py * w * .5;
    const s2x = x + dx * len * .55 - px * w * .45, s2y = y + dy * len * .55 - py * w * .45;
    const b1x = x + px * w * .42, b1y = y + py * w * .42, b2x = x - px * w * .42, b2y = y - py * w * .42;
    const rx = x + dx * len * .5 + px * w * .06, ry = y + dy * len * .5 + py * w * .06; // ridge midpoint
    const litP = (px * LX + py * LY) > 0; // which side of the ridge faces the light
    fillPoly([b1x, b1y, s1x, s1y, tx, ty, rx, ry, x, y], litP ? pal.lt : pal.dk);
    fillPoly([b2x, b2y, s2x, s2y, tx, ty, rx, ry, x, y], litP ? pal.dk : pal.mid);
    if (DET()) {
      fillPoly([litP ? s1x : s2x, litP ? s1y : s2y, tx, ty, rx, ry], litP ? '#FFFFFF' : pal.mid); // the bright upper facet
      ctx.fillStyle = pal.deep; poly([litP ? b2x : b1x, litP ? b2y : b1y, x + dx * len * .3 - (litP ? px : -px) * w * .3, y + dy * len * .3 - (litP ? py : -py) * w * .3, x, y]); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(tx, ty); ctx.stroke();
    }
    poly([b1x, b1y, s1x, s1y, tx, ty, s2x, s2y, b2x, b2y]); outline(ow);
  }
  function glint(x, y, r, col = 'rgba(255,255,255,.95)') { // a four-point sparkle
    if (!DET()) return;
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * .22, y - r * .22); ctx.lineTo(x + r, y); ctx.lineTo(x + r * .22, y + r * .22); ctx.lineTo(x, y + r); ctx.lineTo(x - r * .22, y + r * .22); ctx.lineTo(x - r, y); ctx.lineTo(x - r * .22, y - r * .22); ctx.closePath(); ctx.fill();
  }
  function bloom(x, y, r, rgb, al) { // a soft additive glow
    if (!DET() || al <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${al})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  function slitEye(x, y, w, h, tilt, col, rgb, al = .7) { // a narrow glowing slit, no googly whites
    bloom(x, y, w * 1.6, rgb, al);
    ctx.fillStyle = C(col); ctx.beginPath(); ctx.moveTo(x - w / 2, y + tilt); ctx.quadraticCurveTo(x, y - h, x + w / 2, y - tilt); ctx.quadraticCurveTo(x, y + h * .5, x - w / 2, y + tilt); ctx.closePath(); ctx.fill();
    if (DET()) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + w * .1, y - h * .45, w * .18, h * .4); }
  }
  function talon(x, y, ang, len, w, col = '#EDE4D4') { // a curved claw
    const dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx;
    ctx.beginPath(); ctx.moveTo(x + px * w, y + py * w);
    ctx.quadraticCurveTo(x + dx * len * .7 + px * w * .6, y + dy * len * .7 + py * w * .6, x + dx * len + px * len * .35, y + dy * len + py * len * .35);
    ctx.quadraticCurveTo(x + dx * len * .45 - px * w * .2, y + dy * len * .45 - py * w * .2, x - px * w, y - py * w); ctx.closePath();
    ctx.fillStyle = C(col); ctx.fill(); outline(.8);
  }

  // ---------------- PRISM IMP ----------------
  // a small, hunched, wiry demon: digitigrade legs, long clawed arms, tattered bat wings, a barbed tail,
  // crystal horns and a ridge of crystal growing out of its spine. Glowing slit eyes over a fanged jaw.
  const IMP = { sk: '#7A4896', lt: '#C490D8', dk: '#43245A', deep: '#2C163E', belly: '#8E5E9E', mem: '#3E2252', memL: '#6A3A82' };
  function impWing(ax, ay, flap, far) {
    const k = far ? .82 : 1, base = far ? shade(IMP.mem, -.3) : IMP.mem;
    const wa = -2.35 + flap, wx = ax + Math.cos(wa) * 9 * k, wy = ay + Math.sin(wa) * 9 * k; // the wrist
    const tips = [[-2.0, 9], [-2.75, 10], [-3.35, 8]].map(([an, l]) => [wx + Math.cos(an + flap * .6) * l * k, wy + Math.sin(an + flap * .6) * l * k]);
    const path = () => {
      ctx.beginPath(); ctx.moveTo(ax + 1, ay); ctx.lineTo(wx, wy); ctx.lineTo(tips[0][0], tips[0][1]);
      ctx.quadraticCurveTo((tips[0][0] + tips[1][0]) / 2 + 1.5, (tips[0][1] + tips[1][1]) / 2 + 2.5, tips[1][0], tips[1][1]);
      ctx.quadraticCurveTo((tips[1][0] + tips[2][0]) / 2 + 2.5, (tips[1][1] + tips[2][1]) / 2 + 1.5, tips[2][0], tips[2][1]);
      ctx.quadraticCurveTo(ax - 4, ay + 2, ax - 1, ay + 5); ctx.closePath();
    };
    cel(path, base, shade(base, -.3), 1.6, far ? null : IMP.memL, 1.1);
    if (DET()) { // finger bones through the membrane
      ctx.strokeStyle = far ? '#5A3470' : '#8A5AA0'; ctx.lineWidth = .9; ctx.beginPath();
      ctx.moveTo(ax + 1, ay); ctx.lineTo(wx, wy); for (const p of tips) { ctx.moveTo(wx, wy); ctx.lineTo(p[0], p[1]); } ctx.stroke();
    }
    ctx.fillStyle = C(far ? '#9A8AA8' : '#E6DCEC'); ctx.beginPath(); ctx.moveTo(wx - 1, wy); ctx.lineTo(wx + .6, wy - 3); ctx.lineTo(wx + 1.2, wy + .4); ctx.fill(); // wrist hook
  }
  function impLeg(hx, hy, far, crouch) {
    const col = far ? IMP.dk : IMP.sk, x0 = far ? hx - 3 : hx;
    const kx = x0 + 5.5, ky = (hy - 4) / 2 + crouch * .3, ax = x0 - 2.5, ay = -3.2, toe = x0 + 3.8;
    seg(x0, hy, kx, ky, 6.4, 4, col, 1.6); // thigh
    seg(kx, ky, ax, ay, 3.8, 2.4, col, .6); // shin, angled back to the raised heel
    const fp = () => { ctx.beginPath(); ctx.moveTo(ax - 1.2, ay - .8); ctx.quadraticCurveTo(ax + 3, ay - 1.4, toe + 1, -1.4); ctx.lineTo(toe + 1.6, 0); ctx.lineTo(ax - .4, 0); ctx.closePath(); };
    cel(fp, col, shade(col, -.35), .8, null, 1);
    talon(toe + 1, -1, .25, 3, .7, far ? '#A89CB0' : '#EDE4D4'); talon(toe - 1.2, -.8, .45, 2.4, .6, far ? '#A89CB0' : '#EDE4D4');
    ctx.fillStyle = C(far ? '#A89CB0' : '#EDE4D4'); ctx.beginPath(); ctx.moveTo(ax - .6, ay); ctx.lineTo(ax - 3, ay - 1.4); ctx.lineTo(ax - .2, ay - 1.6); ctx.fill(); // heel spur
  }
  CREATURES.imp = function (e, a) {
    a = a || {}; const t = a.t || 0, wd = a.wind || 0, atk = !!a.atk, sq = e.sq || 1;
    ctx.save(); ctx.scale(1 + (1 - sq) * .45, sq);
    const crouch = wd * 4 - (atk ? 1.5 : 0), lean = atk ? 5 : -wd * 2.5, br = Math.sin(t * 5) * .5;
    const hx = -2 + lean * .3, hy = -13 + crouch, sx = 5 + lean, sy = -22.5 + crouch * 1.2 + br, hdx = sx + 4.5 + (atk ? 1.5 : 0), hdy = sy - 4.5;
    const flap = Math.sin(t * 14) * .35 - wd * .3;
    // wings, far arm and far leg, then the tail, all behind the body
    impWing(sx - 4, sy + 1, flap - .15, true);
    impLeg(hx, hy, true, crouch);
    const tw = Math.sin(t * 3.4) * 2;
    tube([[hx - 3, hy + 1.5], [-11, hy + 4], [-16, hy + 1 + tw * .4], [-18.5, hy - 5 + tw], [-17, hy - 10 + tw]], 3.6, 1.4, IMP.sk, IMP.dk, IMP.lt);
    shard(-17, hy - 9.5 + tw, 6, -1.2 + tw * .05, 3.4, ROSE, 1); // barbed crystal tail tip
    // far arm, hanging behind the chest
    const fe = atk ? [sx + 3, sy + 4] : [sx - 4, sy + 6 - wd * 4], fh = atk ? [sx + 10, sy + 3] : wd ? [sx - 7, sy - 2] : [sx - 1, sy + 11];
    seg(sx - 2, sy + 1, fe[0], fe[1], 3.8, 2.8, IMP.dk, 1); seg(fe[0], fe[1], fh[0], fh[1], 2.8, 2.2, IMP.dk, .5);
    const fa = Math.atan2(fh[1] - fe[1], fh[0] - fe[0]); for (let k = -1; k <= 1; k++) talon(fh[0], fh[1], fa + k * .35 + .2, 3.2, .55, '#A89CB0');
    // the body: a hunched, wiry torso with a pot belly and a hump of shoulder
    const torso = () => {
      ctx.beginPath(); ctx.moveTo(hx - 5, hy + 1.5);
      ctx.bezierCurveTo(hx - 7, hy - 5, sx - 9, sy + 2, sx - 4, sy - 2.5); // the curved spine up to the hump
      ctx.quadraticCurveTo(sx, sy - 4.2, sx + 3.6, sy - 1.6); // neck
      ctx.quadraticCurveTo(sx + 5.4, sy + 3, sx + 3.6, sy + 6); // chest
      ctx.quadraticCurveTo(sx + 2.6, hy - 1, hx + 5.5, hy + 1); // belly
      ctx.quadraticCurveTo(hx + 1, hy + 3.4, hx - 5, hy + 1.5); ctx.closePath();
    };
    cel(torso, IMP.sk, IMP.dk, 2.6, IMP.lt, 1.4);
    if (DET()) {
      ctx.save(); torso(); ctx.clip();
      ctx.fillStyle = IMP.deep; ctx.beginPath(); ctx.moveTo(hx - 8, hy + 4); ctx.quadraticCurveTo(hx - 5, hy - 5, sx - 8, sy + 1); ctx.lineTo(sx - 11, sy); ctx.lineTo(hx - 10, hy + 4); ctx.fill(); // core shadow down the back
      ctx.fillStyle = IMP.belly; ctx.beginPath(); ctx.moveTo(sx + 4, sy + 2); ctx.quadraticCurveTo(sx + 4, hy - 2, hx + 5, hy + 1); ctx.lineTo(hx + 2, hy + 1); ctx.quadraticCurveTo(sx + 1, hy - 3, sx + 2, sy + 2); ctx.fill(); // belly plates
      ctx.strokeStyle = IMP.dk; ctx.lineWidth = .7; ctx.beginPath(); // ribs and belly creases
      for (let k = 0; k < 3; k++) { const yy = sy + 3 + k * 2.4; ctx.moveTo(sx - 2 + k * .3, yy - 1); ctx.quadraticCurveTo(sx + 1, yy + .6, sx + 3.4 - k * .5, yy); }
      ctx.moveTo(hx + 2, hy - 1.2); ctx.lineTo(hx + 4.4, hy - .6); ctx.stroke();
      ctx.fillStyle = 'rgba(255,230,255,.5)'; ctx.fillRect(sx + 2.5, sy - 1, .9, 2.6); // sheen on the collarbone
      ctx.restore();
    }
    // a ridge of crystal growing out of the spine
    shard(sx - 7.5, sy + 3, 6, -2.5, 3.6, ICE); shard(sx - 5, sy - .6, 8.5, -2.15, 4.4, ICE); shard(sx - 1.6, sy - 2.6, 6, -1.9, 3.4, ROSE);
    // the near leg
    impLeg(hx, hy, false, crouch);
    // the head: a narrow, wedge-shaped skull with a heavy brow, a long jaw and backswept crystal horns
    ctx.save(); ctx.translate(hdx, hdy); ctx.rotate(atk ? .15 : -wd * .1);
    shard(1, -5, 7.5, -2.0, 3, { lt: '#B6E4F0', mid: '#6AAFC8', dk: '#3E4E96', deep: '#2A2660' }); // far horn
    ctx.fillStyle = C(IMP.dk); ctx.beginPath(); ctx.moveTo(-3, -2.4); ctx.lineTo(-9.5, -5.5); ctx.lineTo(-3.5, .2); ctx.closePath(); ctx.fill(); outline(1); // a pointed ear
    const jaw = .12 + wd * .5 + (atk ? .65 : 0);
    ctx.save(); ctx.translate(.5, 1.2); ctx.rotate(jaw); // the lower jaw, hinged under the ear
    fillPoly([-1, 0, 7, .4, 7.4, 1, 1, 3.6], '#2A0C22'); // the mouth's interior
    ctx.fillStyle = C('#EDE4D4'); for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(2.2 + k * 1.8, .6); ctx.lineTo(3 + k * 1.8, -1.6 + k * .2); ctx.lineTo(3.6 + k * 1.8, .6); ctx.fill(); }
    const jw = () => { ctx.beginPath(); ctx.moveTo(-1.2, -.2); ctx.lineTo(7.2, .4); ctx.quadraticCurveTo(7.4, 2, 5.6, 2.6); ctx.quadraticCurveTo(2, 3.8, -1, 2.4); ctx.closePath(); };
    cel(jw, IMP.sk, IMP.dk, 1.2, null, 1.05);
    ctx.restore();
    if (jaw > .3) { fillPoly([.8, 1.2, 8.5, .8, 8 + jaw * 3, 1.4 + jaw * 5, 1, 2.4], '#2A0C22'); bloom(5, 2, 4, '255,120,200', wd * .5); }
    const skull = () => {
      ctx.beginPath(); ctx.moveTo(-5, -1); ctx.quadraticCurveTo(-4.4, -6, .4, -6.2); // back of the skull and crown
      ctx.lineTo(4.4, -4.6); ctx.lineTo(6.2, -3.2); // a heavy brow
      ctx.quadraticCurveTo(8.6, -2.2, 9.6, -.4); ctx.lineTo(9.2, 1); // the long snout and nose
      ctx.lineTo(7.4, 1.6); ctx.lineTo(1, 1.8); ctx.quadraticCurveTo(-2, 3.6, -4, 2.6); ctx.closePath(); // upper lip, cheek
    };
    cel(skull, IMP.sk, IMP.dk, 1.8, IMP.lt, 1.2);
    if (DET()) {
      ctx.fillStyle = IMP.deep; poly([1.2, -3.2, 6.4, -3.2, 5.6, -1.6, 2.2, -1.2]); ctx.fill(); // the deep socket under the brow
      ctx.fillStyle = IMP.dk; poly([2, .2, 6.6, -.4, 8.6, .9, 4, 1.3]); ctx.fill(); // the cheek plane
      ctx.strokeStyle = IMP.deep; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(6.6, -1.4); ctx.lineTo(8.6, -1); ctx.moveTo(-1, -1.5); ctx.quadraticCurveTo(.4, .2, -.4, 1.4); ctx.stroke(); // snout wrinkle, cheekbone
      ctx.fillStyle = IMP.deep; ctx.fillRect(8.4, -.6, .8, .6); // nostril
    }
    ctx.fillStyle = C('#EDE4D4'); ctx.beginPath(); ctx.moveTo(6.4, 1.5); ctx.lineTo(6.9, 3.6 + jaw * 1.5); ctx.lineTo(7.6, 1.4); ctx.fill(); ctx.beginPath(); ctx.moveTo(3.4, 1.7); ctx.lineTo(3.8, 3); ctx.lineTo(4.4, 1.7); ctx.fill(); // fangs
    slitEye(4, -2.2, 3.8, 1.5, .5, wd > .3 || atk ? '#FFF0FF' : '#C8FCFF', wd > .3 || atk ? '255,120,220' : '120,240,255', .55 + wd * .4);
    ctx.fillStyle = C(IMP.deep); poly([1, -4.1, 6.8, -3.9, 6.2, -3.1, 3.2, -3.2]); ctx.fill(); // the brow drawn down over the eye
    shard(-.6, -5.2, 10, -2.45, 3.8, ICE); // the near horn, swept back
    shard(2.8, -5, 4.5, -1.75, 2.2, ROSE); // a small brow spike
    ctx.restore();
    // the near arm: long and wiry, claws raised back when winding up, raked forward when striking
    const S = [sx + 1, sy + 1.5], E = atk ? [sx + 6.5, sy + 3] : wd ? [sx - 4, sy + 4.5] : [sx - 1.6, sy + 7.5], H = atk ? [sx + 13.5, sy + 1] : wd ? [sx - 2, sy - 4.5 * wd] : [sx + 5, sy + 10.5];
    seg(S[0], S[1], E[0], E[1], 4.6, 3.2, shade(IMP.sk, .1), 1.2); seg(E[0], E[1], H[0], H[1], 3.4, 2.6, shade(IMP.sk, .1), .6);
    shard(S[0] - .4, S[1] - 1, 4.2, -1.6, 2.6, ICE, .9); // a crystal stud on the shoulder
    const ha = Math.atan2(H[1] - E[1], H[0] - E[0]); for (let k = -1; k <= 1; k++) talon(H[0], H[1], ha + k * .38 + .25, 3.8, .65);
    ctx.restore();
  };

  // ---------------- AURORA JELLY ----------------
  // a drifting bell of translucent, shifting aurora light: radial canals and four glowing gonads inside, a ring of
  // sensory lights round the scalloped rim, two burning slits looking out through the bell, frilled oral arms and long
  // stinging tentacles strung with luminous nodes. When it winds up to fire, the bell clenches and its core flares.
  const hsla = (h, s, l, al) => `hsla(${h},${s}%,${l}%,${al})`;
  function jellyTentacle(x0, y0, len, i, t, col, w, nodes, splay) {
    const pts = [[x0, y0]];
    for (let k = 1; k <= 6; k++) pts.push([x0 - k * (1.3 + splay) + Math.sin(t * 3.6 + k * .9 + i * 1.7) * (1 + k * .35), y0 + k * len / 6]);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k < pts.length - 1; k++) ctx.quadraticCurveTo(pts[k][0], pts[k][1], (pts[k][0] + pts[k + 1][0]) / 2, (pts[k][1] + pts[k + 1][1]) / 2);
    ctx.lineTo(pts[6][0], pts[6][1]);
    ctx.strokeStyle = FLASH ? '#fff' : 'rgba(42,27,44,.55)'; ctx.lineWidth = w + 1.1; ctx.stroke();
    ctx.strokeStyle = C(col); ctx.lineWidth = w; ctx.stroke();
    if (nodes && DET()) { ctx.fillStyle = 'rgba(255,255,255,.9)'; for (const k of [2, 4, 6]) { circle(pts[k][0], pts[k][1], w * .55); ctx.fill(); } }
    return pts;
  }
  CREATURES.jelly = function (e, a) {
    a = a || {}; const t = a.t || 0, wd = a.wind || 0, atk = !!a.atk;
    const pulse = Math.sin(t * 3.2), hue = 192 + Math.sin(t * .8) * 26;
    const bw = 16.5 * (1 - pulse * .05 - wd * .1 + (atk ? .1 : 0)), bh = 15 * (1 + pulse * .07 + wd * .08 - (atk ? .08 : 0)), cy = -15 + pulse * .6;
    const ax = 1.8; // the bell leans into its drift
    const body = hsla(hue + 18, 62, 60, .8), bodyDk = hsla(hue + 58, 52, 36, .86), bodyLt = hsla(hue - 12, 90, 86, .95);
    const glow = hsla(hue - 30, 100, 76, 1), glowRGB = hue < 192 ? '120,255,220' : '150,190,255', hot = '255,140,230';
    const splay = atk ? -1.6 : wd * 1.2;
    bloom(0, cy - bh * .4, 30, glowRGB, .14 + wd * .2); // the aura it drifts in
    // trailing tentacles behind
    for (let i = 0; i < 3; i++) jellyTentacle(-11 + i * 7.5, cy + 1.5, 21 + i * 3, i, t, hsla(hue + 70, 55, 52, .7), .8, false, splay);
    // the subumbrella, the dark hollow seen through the bell's mouth
    ell(.5, cy + .6, bw * .92, 3.2); ctx.fillStyle = C(hsla(hue + 70, 50, 22, .85)); ctx.fill();
    // frilled oral arms
    for (let i = 0; i < 3; i++) {
      const x0 = -4 + i * 4, pts = [];
      for (let k = 0; k <= 4; k++) pts.push([x0 - k * (1.6 + splay) + Math.sin(t * 2.6 + k * 1.1 + i * 2) * (k * .7), cy + 1 + k * (3.4 + i * .5)]);
      const col = i === 1 ? hsla(hue + 110, 60, 66, .85) : hsla(hue + 95, 55, 56, .82);
      tube(pts, 4.4, 1.4, col, hsla(hue + 120, 50, 36, .85), null, .9);
      if (DET()) { ctx.strokeStyle = 'rgba(255,220,250,.6)'; ctx.lineWidth = .7; ctx.setLineDash([1.2, 1.3]); ctx.beginPath(); ctx.moveTo(pts[0][0] + 1.4, pts[0][1]); for (let k = 1; k <= 4; k++) ctx.lineTo(pts[k][0] + 1.2 - k * .25, pts[k][1]); ctx.stroke(); ctx.setLineDash([]); }
    }
    // the bell
    const lobes = 7;
    const bell = () => {
      ctx.beginPath(); ctx.moveTo(-bw, cy);
      ctx.bezierCurveTo(-bw * 1.02, cy - bh * .72, -bw * .55 + ax, cy - bh * 1.04, ax, cy - bh);
      ctx.bezierCurveTo(bw * .58 + ax, cy - bh * .98, bw * 1.04, cy - bh * .66, bw, cy);
      for (let k = 1; k <= lobes; k++) { const x1 = bw - 2 * bw * k / lobes, xm = (x1 + bw - 2 * bw * (k - 1) / lobes) / 2; ctx.quadraticCurveTo(xm, cy + 3.2, x1, cy + .4); }
      ctx.closePath();
    };
    cel(bell, body, bodyDk, 4.2, bodyLt, 1.5);
    if (DET()) {
      ctx.save(); bell(); ctx.clip();
      // a second, deeper shadow plane low on the left of the bell
      ctx.fillStyle = hsla(hue + 70, 55, 26, .5); ctx.beginPath(); ctx.moveTo(-bw - 2, cy - bh * .45); ctx.quadraticCurveTo(-bw * .55, cy - bh * .2, -bw * .2, cy + 4); ctx.lineTo(-bw - 2, cy + 4); ctx.fill();
      // radial canals
      ctx.strokeStyle = hsla(hue - 20, 90, 85, .45); ctx.lineWidth = .7; ctx.beginPath();
      for (let k = 0; k < 7; k++) { const u = -1 + 2 * k / 6, ex = u * bw * .96, sx2 = ax + u * bw * .2; ctx.moveTo(sx2, cy - bh * .7); ctx.quadraticCurveTo(ex * .9 + ax * .4, cy - bh * .45 * (1 - u * u * .5), ex, cy + 1); }
      ctx.stroke();
      // the stomach and manubrium: a darker inner dome
      ell(ax * .6, cy - bh * .3, bw * .5, bh * .42); ctx.fillStyle = hsla(hue + 80, 50, 30, .55); ctx.fill();
      ctx.restore();
      // four glowing gonads, horseshoe-shaped, flaring as it charges
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      const gl = .55 + wd * .45 + (atk ? .3 : 0) + pulse * .08;
      for (let k = 0; k < 4; k++) { // four horseshoe lobes in a ring round the stomach, seen in perspective
        const th = k * Math.PI / 2 + .6 + t * .15, front = Math.sin(th) > 0, gx = ax * .6 + Math.cos(th) * bw * .3, gy = cy - bh * .36 + Math.sin(th) * bh * .13, r = front ? 2.8 : 2;
        ctx.strokeStyle = `rgba(${k % 2 ? hot : glowRGB},${gl * (front ? .75 : .4)})`; ctx.lineWidth = front ? 1.4 : 1;
        ctx.beginPath(); ctx.ellipse(gx, gy, r, r * .5, 0, th + .9, th + .9 + Math.PI * 1.55); ctx.stroke();
      }
      ctx.restore();
      bloom(ax * .6, cy - bh * .32, 9 + wd * 9, '255,255,255', .25 + wd * .55 + (atk ? .4 : 0)); // the charging core
      // a hard specular highlight on the upper right of the dome, and sparkles
      ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath();
      ctx.moveTo(ax + bw * .18, cy - bh * .93); ctx.quadraticCurveTo(ax + bw * .7, cy - bh * .86, bw * .86, cy - bh * .42);
      ctx.quadraticCurveTo(bw * .6, cy - bh * .66, ax + bw * .18, cy - bh * .93); ctx.fill();
      glint(ax + bw * .45, cy - bh * .8, 2.4); glint(bw * .78, cy - bh * .3, 1.4);
      // sensory lights round the rim
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k <= lobes; k++) { const x1 = bw - 2 * bw * k / lobes, on = .5 + .5 * Math.sin(t * 5 - k * .9); ctx.fillStyle = `rgba(${k % 2 ? hot : glowRGB},${.45 + on * .5})`; circle(x1, cy + .6, 1.1); ctx.fill(); }
      ctx.restore();
    }
    // two burning slits, looking out through the front of the bell
    slitEye(bw * .52 + ax * .5, cy - bh * .28, 3, 1.1, -.4, wd > .3 || atk ? '#FFF2FF' : '#FFE0FA', hot, .55 + wd * .4);
    slitEye(bw * .78 + ax * .3, cy - bh * .22, 2.2, .9, -.4, wd > .3 || atk ? '#FFF2FF' : '#FFE0FA', hot, .4 + wd * .4);
    // stinging tentacles in front, strung with luminous nodes
    for (let i = 0; i < 3; i++) jellyTentacle(-7 + i * 7.5, cy + 1.6, 18 + (i % 2) * 6, i + 4, t, glow, .9, true, splay);
  };

  // ---------------- SHARD CRAB ----------------
  // an armored crab of dark indigo chitin, its carapace a jagged cluster of crystal shards. Segmented, spiked legs,
  // a heavy crystal crusher claw that gapes open as it winds up and snaps shut on the strike, stalked glowing eyes.
  const CH = { b: '#4A3E7E', lt: '#8A7EC4', dk: '#2C2452', deep: '#1C1638' };
  function crabLeg(bx, by, kx, ky, tx, ty, far) { // coxa out to a high knee, then a jointed shin down to a crystal point
    const col = far ? CH.dk : CH.b;
    seg(bx, by, kx, ky, 5.4, 4.4, col, 1.2);
    const fx = kx + (tx - kx) * .55 + (tx > kx ? 1.6 : -1.6), fy = ky + (ty - ky) * .5;
    seg(kx, ky, fx, fy, 4.2, 3.4, col, .8);
    const dx = tx - fx, dy = ty - fy, L = Math.hypot(dx, dy) || 1;
    ctx.beginPath(); ctx.moveTo(fx - dy / L * 1.7, fy + dx / L * 1.7); ctx.lineTo(tx, ty); ctx.lineTo(fx + dy / L * 1.7, fy - dx / L * 1.7); ctx.closePath();
    ctx.fillStyle = C(far ? '#4E6AA8' : '#9AE0EE'); ctx.fill(); outline(.9); // a crystal-tipped dactyl
    if (DET() && !far) { ctx.fillStyle = '#E4FCFF'; poly([fx + dy / L * 1.2, fy - dx / L * 1.2, tx, ty, fx, fy]); ctx.fill(); }
    ctx.fillStyle = C(far ? CH.deep : CH.lt); circle(kx, ky, 1.3); ctx.fill(); // knee joint
    if (!far) shard(kx, ky - 1.5, 3.6, -1.57 + (tx > bx ? .55 : -.55), 2.2, ICE, .8); // a spur on the knee
  }
  function crabClaw(px, py, ang, open, scale, far) {
    ctx.save(); ctx.translate(px, py); ctx.rotate(ang); ctx.scale(scale, scale);
    const pal = far ? { lt: '#A6C8E8', mid: '#6A9AC8', dk: '#3E4890', deep: '#262460' } : ICE;
    // the movable finger, hinged low at the front of the palm
    ctx.save(); ctx.translate(9, 1.6); ctx.rotate(open);
    const dac = () => { ctx.beginPath(); ctx.moveTo(-1, -1); ctx.quadraticCurveTo(5, -1.6, 10, 1.6); ctx.lineTo(8.6, 2.6); ctx.lineTo(7.4, 2); ctx.lineTo(6.2, 3.4); ctx.lineTo(4.6, 2.6); ctx.quadraticCurveTo(1.4, 3.8, -1, 2.4); ctx.closePath(); };
    cel(dac, pal.mid, pal.dk, 1.2, pal.lt, 1.1);
    ctx.restore();
    // the palm: a faceted crystal block with a fixed, toothed finger
    const palm = [-2, -4.4, 4, -6.4, 9.6, -5.2, 13, -3.4, 18.6, -1.6, 15, -.4, 13.4, .8, 12, .2, 9.6, 2.6, 3, 4.4, -2, 3];
    fillPoly(palm, pal.mid);
    if (DET()) {
      fillPoly([4, -6.4, 9.6, -5.2, 13, -3.4, 18.6, -1.6, 9, -1.2, 3.4, -1.6], pal.lt); // the lit top facets
      fillPoly([9, -1.2, 18.6, -1.6, 15, -.4, 13.4, .8, 12, .2], '#FFFFFF');
      fillPoly([-2, 3, 3, 4.4, 9.6, 2.6, 6, .6, -2, .2], pal.dk); // the shadowed underside
      fillPoly([-2, .2, 6, .6, 3.4, -1.6, -2, -4.4], pal.deep);
      ctx.strokeStyle = pal.dk; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(3.4, -1.6); ctx.lineTo(9, -1.2); ctx.lineTo(6, .6); ctx.moveTo(9.6, -5.2); ctx.lineTo(9, -1.2); ctx.stroke();
    }
    poly(palm); outline(1.3);
    if (!far) glint(13, -3.6, 2.2);
    ctx.restore();
  }
  CREATURES.crab = function (e, a) {
    a = a || {}; const t = a.t || 0, wd = a.wind || 0, atk = !!a.atk, ph = (a.walk || 0) * 1.3;
    const bob = Math.abs(Math.sin(ph)) * -1, lunge = atk ? 3 : -wd * 2, rear = wd * 1.5;
    ctx.save(); ctx.translate(lunge, bob);
    // far legs, darker, behind
    for (let i = 0; i < 3; i++) { const bx = -11 + i * 8, s = i - 1.2, sw = Math.sin(ph + i * 2.1 + Math.PI) * 2.6;
      crabLeg(bx + 3, -14, bx + 3 + s * 7, -18 + rear, bx + 3 + s * 12 + sw, -bob, true); }
    // the far claw, raised
    seg(14, -16, 19, -23 - rear, 3.6, 3.2, CH.dk, .6);
    crabClaw(18, -24 - rear * 1.5, -.55 - wd * .4 + (atk ? .5 : 0), atk ? .02 : .2 + wd * .45, .62, true);
    // the chitin body beneath the crystal
    const under = () => { ctx.beginPath(); ctx.moveTo(-20, -12); ctx.quadraticCurveTo(-19, -20, -12, -22); ctx.lineTo(13, -22.5); ctx.quadraticCurveTo(21, -20, 21.5, -14); ctx.quadraticCurveTo(19, -8.5, 10, -8); ctx.lineTo(-12, -8); ctx.quadraticCurveTo(-19, -8.5, -20, -12); ctx.closePath(); };
    cel(under, CH.b, CH.dk, 2.4, CH.lt, 1.5);
    if (DET()) { // abdominal plates and the mouthparts at the front
      ctx.strokeStyle = CH.deep; ctx.lineWidth = .8; ctx.beginPath();
      for (let k = 0; k < 4; k++) { const x = -12 + k * 6.5; ctx.moveTo(x, -9); ctx.quadraticCurveTo(x + 2, -12, x + 1, -15); }
      ctx.stroke();
      ctx.fillStyle = CH.lt; ctx.fillRect(-10, -11.6, 18, .8);
    }
    const mx = Math.sin(t * 7) * .6;
    fillPoly([18, -15, 23, -13.4 + mx, 22.4, -11, 18.4, -10.4], '#6A5AA8'); poly([18, -15, 23, -13.4 + mx, 22.4, -11, 18.4, -10.4]); outline(.9); // mandible plates
    fillPoly([18.6, -11.6, 22, -10 - mx, 21, -8.4, 18, -9], '#3E3270'); poly([18.6, -11.6, 22, -10 - mx, 21, -8.4, 18, -9]); outline(.9);
    if (DET()) { ctx.strokeStyle = '#B8AEE0'; ctx.lineWidth = .5; ctx.beginPath(); for (let k = 0; k < 3; k++) { ctx.moveTo(22.6, -13 + k * 1.4); ctx.lineTo(24.2, -13.4 + k * 1.6 + mx); } ctx.stroke(); }
    // eye stalks with small, glowing, beaded eyes
    for (const [x, h, far] of [[13.5, 7.5, 1], [16.5, 8.5, 0]]) {
      const ex = x + 2 + Math.sin(t * 2 + x) * .6, ey = -21.5 - h - wd * 1.5;
      limb([x, -21.5, ex, ey], far ? CH.dk : CH.b, 1.8);
      circle(ex, ey, 2); ctx.fillStyle = C('#1A0E1E'); ctx.fill(); outline(.8);
      bloom(ex + .4, ey, 4.5, '255,90,150', .5 + wd * .4);
      ctx.fillStyle = C(wd > .3 || atk ? '#FFD0E4' : '#FF5A8E'); ell(ex + .5, ey, 1.1, .7); ctx.fill();
      if (DET()) { ctx.fillStyle = '#fff'; ctx.fillRect(ex + .8, ey - 1, .6, .6); }
    }
    // the crystal carapace: a faceted base plate crowned with jagged shards that lean back
    const plate = [-21, -14, -18, -22.5, -9, -27, 5, -27.5, 15, -24, 20.5, -17.5, 9, -15.5, -6, -15];
    fillPoly(plate, ICE.mid);
    if (DET()) {
      fillPoly([5, -27.5, 15, -24, 20.5, -17.5, 9, -21], ICE.lt); fillPoly([-9, -27, 5, -27.5, 9, -21, -2, -21.5], '#B8EEF6');
      fillPoly([-21, -14, -18, -22.5, -9, -27, -2, -21.5, -6, -15], ICE.dk); fillPoly([-21, -14, -18, -22.5, -12, -18, -6, -15], ICE.deep);
      fillPoly([-6, -15, -2, -21.5, 9, -21, 9, -15.5], ICE.mid);
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(9, -21); ctx.lineTo(-2, -21.5); ctx.moveTo(9, -21); ctx.lineTo(20.5, -17.5); ctx.stroke();
    }
    poly(plate); outline(1.5);
    const sh = [[-17, -20, 7, -2.45, 5, ICE], [-12, -24, 11, -2.1, 7, ROSE], [-4, -26, 12.5, -1.85, 8, ICE], [4, -26.5, 10, -1.6, 7, ICE], [11, -24, 6.5, -1.3, 5, ROSE], [-8, -22, 6, -2.7, 4, ICE], [15, -21, 4.5, -1.05, 3.4, ICE]];
    for (const [x, y, l, an, w, p] of sh) shard(x, y, l * (1 + wd * .06), an, w, p, 1.1);
    glint(-2.5, -36, 2.6); glint(7, -33, 1.6);
    // the near legs
    for (let i = 0; i < 3; i++) { const bx = -12 + i * 8, s = i - 1.3, sw = Math.sin(ph + i * 2.1) * 2.6;
      crabLeg(bx, -11, bx + s * 7.5, -16.5 + rear, bx + s * 12.5 + sw, -bob, false); }
    // the crusher claw: gapes open on the wind-up, snaps shut on the strike
    const open = atk ? -.05 : .18 + wd * .55 + Math.sin(t * 3) * .04;
    seg(14, -12, 19, -8 + rear * .4, 5.6, 5, CH.b, 1);
    shard(17.5, -10.5, 4, -1.3, 2.6, ICE, .8);
    crabClaw(18.5, -11 + rear * .3, -.22 - wd * .4 + (atk ? .2 : 0), open, (atk ? 1.12 : 1.04) * (e.bare ? 1.18 : 1), false); // (out of its borrowed shell, armor_a.js, the claw swells)
    ctx.restore();
  };

  // ---------------- SKY RAY ----------------
  // a manta of the skyport winds, seen from a little above: dark slate dorsal skin with pale spots and cartilage ridges
  // across its wings, rolled cephalic horns framing the mouth, a pale belly, a whip tail with a barbed sting and a
  // riveted brass harness band. It rears back with a glowing maw before it fires, and dips its head into a dive.
  const RAY = { b: '#3E4A80', lt: '#7A8CC8', dk: '#272E58', deep: '#1A1E3E', belly: '#D8D2E8', bellyDk: '#9E98C0', spot: '#A8BCE8' };
  function rayWing(far, f) {
    const tipx = far ? -5 : -3, tipy = far ? -15.5 + f * .85 : 16.5 + f, ry = far ? -2.6 : 2.4;
    const path = () => {
      ctx.beginPath(); ctx.moveTo(9, ry);
      ctx.bezierCurveTo(7, ry + (tipy - ry) * .55, 3, tipy - (far ? -1 : 1) * 1.5, tipx, tipy); // the leading edge
      ctx.quadraticCurveTo(tipx - 3, tipy + (far ? 1.5 : -1.5), tipx - 4.5, tipy + (far ? 2 : -2.6)); // the swept tip
      ctx.bezierCurveTo(-9, ry + (tipy - ry) * .45, -11, ry + (tipy - ry) * .2, -14, ry * .3); ctx.closePath(); // the trailing edge
    };
    const base = far ? shade(RAY.b, -.18) : RAY.b;
    cel(path, base, far ? RAY.deep : RAY.dk, far ? 2 : 3, far ? null : RAY.lt, 1.4);
    if (DET()) {
      ctx.save(); path(); ctx.clip();
      ctx.strokeStyle = far ? RAY.deep : RAY.dk; ctx.lineWidth = .7; ctx.beginPath(); // cartilage ridges fanning out from the root
      for (let k = 0; k < 5; k++) { const u = k / 4, ex = tipx + 1 - u * 13, ey = tipy + (ry - tipy) * u * .55; ctx.moveTo(6 - u * 12, ry); ctx.quadraticCurveTo((6 - u * 12 + ex) / 2 + 1.5, (ry + ey) / 2, ex, ey); }
      ctx.stroke();
      ctx.fillStyle = far ? shade(RAY.spot, -.4) : RAY.spot; // pale spots
      for (const [u, v, r] of [[.35, .4, 1.2], [.55, .62, .9], [.2, .7, .8], [.65, .3, .7]]) { ell(9 - u * 18, ry + (tipy - ry) * v, r * 1.4, r); ctx.fill(); }
      if (!far) { ctx.strokeStyle = '#E8EEFF'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(8.4, ry + (tipy - ry) * .25); ctx.bezierCurveTo(6.6, ry + (tipy - ry) * .6, 3, tipy - 2.2, tipx + .6, tipy - .8); ctx.stroke(); } // light along the leading edge
      ctx.restore();
    }
  }
  CREATURES.skyray = function (e, a) {
    a = a || {}; const t = a.t || 0, wd = a.wind || 0, atk = !!a.atk;
    const f = Math.sin(t * 5) * 5 * (1 - wd * .5), dive = atk ? .3 : -wd * .28 + Math.sin(t * 2.5) * .04;
    ctx.save(); ctx.translate(-wd * 3, -13 + Math.sin(t * 2.5 + 1) * 1); ctx.rotate(dive);
    // the whip tail with a barbed sting
    const tw = Math.sin(t * 3) * 3 + wd * 4;
    tube([[-12, 0], [-22, .6 + tw * .3], [-32, -1 + tw * .7], [-40, -3 + tw], [-46, -5.5 + tw * .8]], 2.8, .5, RAY.dk, RAY.deep, RAY.lt, 1);
    shard(-19, -.4 + tw * .2, 6, -2.95, 2.2, { lt: '#F0E8D8', mid: '#C8B8A0', dk: '#7A6A5A', deep: '#4A3E36' }, .9); // the sting
    // the far wing, above and behind
    rayWing(true, f);
    // pelvic fins
    fillPoly([-10, 1, -15, 4.5, -13, .6], RAY.dk); poly([-10, 1, -15, 4.5, -13, .6]); outline(1);
    // the body: a thick, muscular disc centre with rolled cephalic horns
    const body = () => {
      ctx.beginPath(); ctx.moveTo(-14, -.4);
      ctx.bezierCurveTo(-8, -6, 4, -6.4, 12, -4.4); // the raised back
      ctx.quadraticCurveTo(16.5, -4.2, 18, -5.2); ctx.quadraticCurveTo(23.5, -7.4, 24.4, -3.6); ctx.quadraticCurveTo(22.6, -3.8, 21, -2.4); // the upper horn
      ctx.quadraticCurveTo(19.6, -1, 21.2, .6); // the mouth
      ctx.quadraticCurveTo(23.6, 1.6, 23.4, 4.6); ctx.quadraticCurveTo(19.6, 4.6, 17.6, 3.6); // the lower horn
      ctx.quadraticCurveTo(14, 5.6, 6, 5.6); ctx.bezierCurveTo(-2, 5.4, -9, 3.4, -14, -.4); ctx.closePath();
    };
    cel(body, RAY.b, RAY.dk, 2.4, RAY.lt, 1.5);
    if (DET()) {
      ctx.save(); body(); ctx.clip();
      ctx.fillStyle = RAY.belly; ctx.beginPath(); ctx.moveTo(-14, 1.6); ctx.bezierCurveTo(-4, 2.4, 8, 2.2, 18, 2.4); ctx.lineTo(24, 6); ctx.lineTo(-14, 6); ctx.fill(); // the pale belly
      ctx.fillStyle = RAY.bellyDk; ctx.beginPath(); ctx.moveTo(-14, 3.6); ctx.bezierCurveTo(-4, 4.6, 6, 4.4, 14, 4.2); ctx.lineTo(14, 7); ctx.lineTo(-14, 7); ctx.fill();
      ctx.strokeStyle = RAY.bellyDk; ctx.lineWidth = .6; ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(9 - k * 1.6, 2.8); ctx.lineTo(8.2 - k * 1.6, 4.6); } ctx.stroke(); // gill slits
      ctx.fillStyle = RAY.deep; ctx.beginPath(); ctx.moveTo(-10, -1.6); ctx.bezierCurveTo(-2, -4.6, 6, -4.4, 12, -3.2); ctx.lineTo(12, -1.8); ctx.bezierCurveTo(4, -2.6, -4, -2, -10, -1.6); ctx.fill(); // the spine's furrow
      ctx.fillStyle = RAY.spot; ell(-1, -3.8, 1.4, .8); ctx.fill(); ell(-6, -2.6, 1, .6); ctx.fill();
      ctx.restore();
    }
    // a riveted brass harness band around the body, its tether ring
    const hb = () => { ctx.beginPath(); ctx.moveTo(3, -5.8); ctx.quadraticCurveTo(5, .2, 3.6, 5.6); ctx.lineTo(6.4, 5.6); ctx.quadraticCurveTo(7.8, .2, 5.8, -5.9); ctx.closePath(); };
    cel(hb, '#B8893E', '#7A5424', 1, '#F2D08A', 1);
    ctx.fillStyle = C('#F2D08A'); for (const y of [-3, 0, 3]) { circle(5.1 + y * .05, y, .55); ctx.fill(); }
    ctx.strokeStyle = C('#7A5424'); ctx.lineWidth = 1.2; circle(4.6, 7.4, 1.8); ctx.stroke();
    // the eye: a small glowing slit set under a heavy ridge, and a glowing maw when it winds up to fire
    slitEye(15, -2.2, 3, 1, .4, wd > .3 || atk ? '#FFF4D8' : '#FFD86A', '255,190,90', .5 + wd * .4);
    ctx.fillStyle = C(RAY.deep); poly([12.6, -3.6, 17.4, -4, 16.8, -3, 13, -2.6]); ctx.fill();
    if (wd > 0 || atk) { bloom(21.5, -.6, 6 + wd * 6, '255,210,120', .4 + wd * .5); ctx.fillStyle = C('#FFF0C8'); ell(21, -.8, .9 + wd, .6 + wd * .5); ctx.fill(); }
    // the near wing, below and in front
    rayWing(false, f);
    ctx.restore();
  };
})();
