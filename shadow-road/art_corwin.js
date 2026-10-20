'use strict';
// ---------- the Prince of Shadow: his costume, piece by piece, and his cloak ----------
// After the reference sheet: a black doublet quilted in a diamond lattice over a white shirt, a ruffled jabot and a
// high collar, steel pauldrons, vambraces and knee cops, crossed sword belts with a scabbard at the left hip, tall
// buckled boots, and over it all a great black cloak painted in dry, ragged brushstrokes, pinned at the throat with a
// silver rose on a short chain.
// Every piece is drawn by its own function from a flat palette (the look: strings only, so a greyed copy of it greys
// every piece), and the piece is picked by the look's slot names, so gear can swap one later:
//   CORWIN.parts.mail[look.mail]       the torso, its collar and jabot
//   CORWIN.parts.pants[look.pants]     thighs, shins, knees and boots
//   CORWIN.parts.gauntlets[look.gauntlets]  sleeves, forearms, shoulder guards and hands
//   CORWIN.parts.waist[look.waist]     belts, the skirt tabs at the hips and the scabbard
// drawHumanoid (art.js) calls these at the right moments of its own back-to-front order.
let HAND_PLATE = false; // while set, drawHand gives his hands the plates of a silver gauntlet
let CLOAK_DRAW = null;  // set by drawPlayerAt around his figure: the frame the cloak's motion is worked out in
const CORWIN = (() => {
  const DET = () => !FLASH && !TINT;
  const FINE = () => DET() && (typeof PAINT_Q === 'undefined' || PAINT_Q > 0);
  const hsh = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const metal = (x0, y0, x1, y1, col) => { // polished steel: bright where it faces the light, dark where it turns away
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, C(shade(col, .55))); g.addColorStop(.38, C(col)); g.addColorStop(.62, C(shade(col, -.28))); g.addColorStop(1, C(shade(col, .12)));
    return g;
  };
  const rivet = (x, y, r = .55) => { ctx.fillStyle = C('#3A3C46'); circle(x, y, r); ctx.fill(); if (DET()) { ctx.fillStyle = 'rgba(255,255,255,.75)'; circle(x - r * .3, y - r * .3, r * .4); ctx.fill(); } };
  // a frame along a segment: origin at A, +x toward B, +y across it
  const along = (ax, ay, bx, by) => { ctx.translate(ax, ay); ctx.rotate(Math.atan2(by - ay, bx - ax)); return Math.hypot(bx - ax, by - ay); };

  // ======================================================== legs ========================================================
  const trousers = {
    thigh(L, ax, ay, bx, by, far, s = 1) { seg(ax, ay, bx, by, 8.6 * s, 6.6 * s, far ? shade(L.legs, -.16) : L.legs, 1); },
    shin(L, ax, ay, bx, by, far, s = 1) { seg(ax, ay, bx, by, 6.9 * s, 5.4 * s, far ? shade(L.boots, -.16) : L.boots, .9); }, // the shaft of a tall riding boot
    shinDetail(L, ax, ay, bx, by, far, s = 1) { // the boot's turned-down cuff under the knee and two buckled straps
      ctx.save(); const len = along(ax, ay, bx, by); ctx.scale(1, s);
      const cuff = far ? shade(L.cuff, -.16) : L.cuff;
      rrect(1.4, -4.1, 3.6, 8.2, 1.2); ctx.fillStyle = C(cuff); ctx.fill(); outline(.8);
      if (DET()) { ctx.fillStyle = shade(cuff, .28); ctx.fillRect(1.8, -3.6, 1, 7.2); }
      for (const k of [.52, .82]) {
        const x = len * k; ctx.fillStyle = C(shade(L.leather, -.3)); ctx.fillRect(x - .7, -3.3, 1.4, 6.6);
        ctx.fillStyle = C(far ? shade(L.steel, -.2) : L.steel); ctx.fillRect(x - 1, -3.5, 2, 1.8);
      }
      if (DET()) { ctx.strokeStyle = shade(far ? shade(L.boots, -.16) : L.boots, .35); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(5.6, -2.1); ctx.lineTo(len - 1, -1.6); ctx.stroke(); } // the shine down the shaft
      ctx.restore();
    },
    knee(L, x, y, ux, uy, far, s = 1) { // a riveted steel knee cop, a fan at its outer side; u: the leg's direction at the knee
      const CS = (CLOAK_GEO && CLOAK_GEO.CS) ?? 1, col = far ? shade(L.steel, -.2) : L.steel;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(-ux, uy)); ctx.scale(s, s); // +y down the leg, +x out the front of the knee
      const fw = lerp(3.1, 4.6, CS), bw = lerp(3.1, 2.2, CS), o = 1.4 * CS;
      ctx.beginPath(); ctx.ellipse(o - .6, .3, 2.9 * (.4 + .6 * CS), 3, 0, 0, TAU); ctx.fillStyle = C(shade(col, -.18)); ctx.fill(); outline(.8); // the fan
      ctx.beginPath(); ctx.moveTo(o, -4.6); ctx.quadraticCurveTo(o + fw * .9, -3, o + fw, -.3); ctx.quadraticCurveTo(o + fw * .7, 2.8, o, 4.4); ctx.quadraticCurveTo(o - bw, 2.4, o - bw, -.2); ctx.quadraticCurveTo(o - bw * .8, -3.2, o, -4.6); ctx.closePath();
      ctx.fillStyle = metal(o + fw, -4.6, o - bw, 4.4, col); ctx.fill(); outline(.9);
      if (DET()) { ctx.strokeStyle = shade(col, .6); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(o + .4, -4); ctx.lineTo(o + fw * .55, -.4); ctx.lineTo(o + .4, 3.8); ctx.stroke(); } // the ridge
      rivet(o, -3.4); rivet(o, 3.2);
      ctx.restore();
    },
    foot(L, x, far) { // the boot's foot: a squared toe, a stacked heel and a buckled strap over the instep
      const bc = far ? shade(L.boots, -.16) : L.boots;
      ctx.beginPath(); ctx.moveTo(x - 3.2, -8.4); ctx.lineTo(x - 3.8, -2.4); ctx.lineTo(x - 4.4, 0); ctx.lineTo(x + 7, 0); ctx.quadraticCurveTo(x + 7.3, -2.8, x + 5, -3.8); ctx.quadraticCurveTo(x + 2.6, -4.6, x + 2.4, -8.4); ctx.closePath();
      ctx.fillStyle = C(bc); ctx.fill(); outline(1.1);
      ctx.fillStyle = C(shade(bc, -.55)); ctx.fillRect(x - 4.4, -1.5, 11.4, 1.5); ctx.fillRect(x - 4.4, -2.7, 3.4, 1.4); // sole and heel
      ctx.strokeStyle = C(shade(L.leather, -.3)); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + .4, -6); ctx.lineTo(x + 3.8, -3.6); ctx.stroke();
      ctx.fillStyle = C(far ? shade(L.steel, -.2) : L.steel); ctx.fillRect(x + 1.2, -5.8, 1.7, 1.6);
      if (DET()) { ctx.fillStyle = 'rgba(255,240,220,.38)'; ell(x + 4.6, -2.5, 1.7, .7, -.3); ctx.fill(); }
    },
  };
  // a whole leg: hip to knee to ankle, the foot set at (fx, fy) and turned by rot; the nearer leg passes far=false
  function leg(L, hx, hy, kx, ky, ax, ay, fx, fy, rot, bsc, far, s = 1) {
    const kit = PART('pants', L);
    kit.thigh(L, hx, hy, kx, ky, far, s);
    kit.shin(L, kx, ky, ax, ay, far, s);
    ctx.save(); ctx.translate(fx, fy); if (rot) ctx.rotate(rot); if (bsc !== 1) ctx.scale(bsc, 1); kit.foot(L, 0, far); ctx.restore();
    kit.shinDetail(L, kx, ky, ax, ay, far, s);
    const tx = kx - hx, ty = ky - hy, sx = ax - kx, sy = ay - ky, tl = Math.hypot(tx, ty) || 1, sl = Math.hypot(sx, sy) || 1;
    kit.knee(L, kx, ky, tx / tl + sx / sl, ty / tl + sy / sl, far, s);
  }

  // ===================================================== arms =====================================================
  const vambrace = {
    sleeve(L, ax, ay, bx, by, far) { // the white shirt sleeve, full and loose
      const col = far ? shade(L.shirt, -.24) : L.shirt;
      seg(ax, ay, bx, by, 7.4, 6.2, col, 1.8);
      if (FINE()) { ctx.save(); const len = along(ax, ay, bx, by); ctx.strokeStyle = shade(col, -.3); ctx.lineWidth = .6; ctx.beginPath(); for (const k of [.35, .62]) { ctx.moveTo(len * k, -3.6); ctx.quadraticCurveTo(len * k + 1.6, 0, len * k - .4, 3.6); } ctx.stroke(); ctx.restore(); } // folds
    },
    fore(L, ax, ay, bx, by, far) { // a steel vambrace strapped over the sleeve, the shirt bunched at the elbow above it
      const col = far ? shade(L.steel, -.22) : L.steel;
      ctx.save(); const len = along(ax, ay, bx, by);
      ctx.beginPath(); ctx.moveTo(1.6, -3.1); ctx.lineTo(len - .4, -2.4); ctx.quadraticCurveTo(len + .9, 0, len - .4, 2.4); ctx.lineTo(1.6, 3.1); ctx.quadraticCurveTo(.2, 0, 1.6, -3.1); ctx.closePath();
      ctx.fillStyle = metal(0, -3.1, 0, 3.1, col); ctx.fill(); outline(1);
      for (const k of [.36, .76]) { const x = len * k; ctx.fillStyle = C(far ? shade(L.leather, -.2) : L.leather); ctx.fillRect(x - .7, -3.2, 1.4, 6.4); ctx.fillStyle = C(shade(col, .2)); ctx.fillRect(x - .9, -3.4, 1.8, 1.4); }
      if (DET()) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(3, -1.9); ctx.lineTo(len - 2, -1.5); ctx.stroke(); }
      ctx.restore();
      ell(ax, ay, 2.6, 2.3); ctx.fillStyle = C(far ? shade(L.shirt, -.3) : shade(L.shirt, -.08)); ctx.fill(); outline(.7); // the shirt gathered at the elbow
    },
    pauldron(L, x, y, ang, far, s = 1) { // layered steel lames over the shoulder, riveted, the cap on top
      const col = far ? shade(L.pauldron, -.24) : L.pauldron;
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
      const lame = (cy, rx, ry) => { ctx.beginPath(); ctx.ellipse(0, cy, rx, ry, 0, 0, Math.PI); ctx.lineTo(-rx, cy - .6); ctx.lineTo(rx, cy - .6); ctx.closePath(); ctx.fillStyle = metal(0, cy - 1, 0, cy + ry, col); ctx.fill(); outline(.9); };
      lame(4, 5.6, 3.3); lame(2, 6.5, 3.3);
      ctx.beginPath(); ctx.ellipse(0, .4, 7.4, 5.6, 0, Math.PI, TAU); ctx.ellipse(0, .4, 7.4, 1.8, 0, 0, Math.PI); ctx.closePath(); // the cap
      ctx.fillStyle = metal(3, -5, -3, 2, col); ctx.fill(); outline(1.1);
      if (DET()) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ell(2.4, -2.8, 2.6, .9, -.35); ctx.fill(); ctx.strokeStyle = shade(col, -.45); ctx.lineWidth = .5; ctx.beginPath(); ctx.ellipse(0, .4, 6, 4.2, 0, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); }
      rivet(-5.2, .6); rivet(5.2, .6); rivet(0, 3.4, .45); rivet(0, 5.6, .45);
      ctx.restore();
    },
  };

  // ===================================================== torso =====================================================
  const torsoPath = (ty, HIP) => {
    // broad shoulders over a deep chest, tapering to a narrow waist
    ctx.beginPath(); ctx.moveTo(-10.2, ty + 2.2); ctx.quadraticCurveTo(0, ty - 2.4, 10.2, ty + 2.2);
    ctx.quadraticCurveTo(10.6, ty + 10, 6.6, ty + 16.5); ctx.quadraticCurveTo(5.3, HIP - 4, 6.4, HIP + 1.5);
    ctx.lineTo(-6.4, HIP + 1.5); ctx.quadraticCurveTo(-5.5, HIP - 4, -6.8, ty + 16.5); ctx.quadraticCurveTo(-10.6, ty + 10, -10.2, ty + 2.2); ctx.closePath();
  };
  const doublet = {
    torso(L, g) {
      const { HIP, SHO, CS, Y, BACK } = g, ty = SHO - 2, body = L.body;
      const tg = ctx.createLinearGradient(-10, ty, 10, ty + 22); // lit from the upper right
      tg.addColorStop(0, C(shade(body, -.3))); tg.addColorStop(.55, C(body)); tg.addColorStop(1, C(shade(body, .4)));
      torsoPath(ty, HIP); ctx.fillStyle = tg; ctx.fill();
      if (DET()) {
        ctx.save(); torsoPath(ty, HIP); ctx.clip();
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.moveTo(-11, ty); ctx.lineTo(-3, ty); ctx.quadraticCurveTo(-5.6, ty + 12, -3.4, HIP + 2); ctx.lineTo(-11, HIP + 2); ctx.closePath(); ctx.fill();
        if (FINE()) { // quilted in a diamond lattice, a small stud at every crossing
          const ph = ((-Y * 5) % 4.6 + 4.6) % 4.6, h = HIP + 3 - ty;
          ctx.strokeStyle = L.lattice; ctx.lineWidth = .45; ctx.beginPath();
          for (let k = -16; k <= 22; k += 4.6) { ctx.moveTo(k + ph - 7, ty); ctx.lineTo(k + ph + 7, ty + h); ctx.moveTo(k + ph + 7, ty); ctx.lineTo(k + ph - 7, ty + h); }
          ctx.stroke();
          ctx.fillStyle = shade(L.lattice, .25);
          for (let r = 0; r < 6; r++) for (let k = -16; k <= 22; k += 4.6) { const y = ty + r * h / 6 + h / 12, x = k + ph + (r % 2 ? 2.3 : 0) - 7 + 7; ctx.fillRect(x - .3, y - .3, .6, .6); }
        }
        ctx.strokeStyle = shade(body, .5); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(9.4, ty + 3); ctx.quadraticCurveTo(10, ty + 9, 7.2, ty + 14.6); ctx.stroke(); // rim light
        ctx.restore();
      }
      torsoPath(ty, HIP); outline();
      if (BACK) { // from behind: the seam down his spine
        ctx.strokeStyle = C(shade(body, -.5)); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(0, ty + 2); ctx.lineTo(0, HIP - 2); ctx.stroke();
        return;
      }
      const fx = 6.6 * Math.pow(CS, 1.6); // where the doublet buttons: the chest's edge in profile, down his middle face on
      if (Y > -.3) {
        ctx.strokeStyle = C(shade(body, -.6)); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(fx, ty + 7); ctx.lineTo(fx - .4, HIP - 1); ctx.stroke();
        for (let k = 0; k < 5; k++) { const y = ty + 10 + k * 3.3; ctx.fillStyle = C(L.button); circle(fx + .5, y, .78); ctx.fill(); if (DET()) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(fx + .2, y - .6, .45, .45); } }
      }
      if (L.strap) { ctx.strokeStyle = C(L.strap); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-9 * CS + 8 * Y * 0, ty + 3); ctx.lineTo(7 * CS - 4 * Y, HIP - 3); ctx.stroke(); outline(.1); }
      if (L.plate) { // a steel breastplate over the doublet (the forge's armor), lit and trimmed
        const pg = ctx.createLinearGradient(-9, ty, 9, ty + 20); pg.addColorStop(0, C(shade(L.plate, -.25))); pg.addColorStop(.55, C(L.plate)); pg.addColorStop(.75, C(shade(L.plate, .45))); pg.addColorStop(1, C(L.plate));
        ctx.beginPath(); ctx.moveTo(-9, ty + 6); ctx.quadraticCurveTo(0, ty + 3, 9, ty + 6); ctx.lineTo(7.6, ty + 18); ctx.quadraticCurveTo(0, ty + 23, -7.4, ty + 18); ctx.closePath(); ctx.fillStyle = pg; ctx.fill(); outline(1.3);
        if (L.plateTrim) { ctx.strokeStyle = C(L.plateTrim); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-7.4, ty + 17); ctx.quadraticCurveTo(0, ty + 22, 7.4, ty + 17); ctx.moveTo(fx * .6, ty + 5); ctx.lineTo(fx * .6, ty + 20); ctx.stroke(); }
        if (L.runes) { ctx.save(); if (!FLASH) { ctx.shadowColor = L.runes; ctx.shadowBlur = 6; } ctx.strokeStyle = C(L.runes); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-4, ty + 9); ctx.lineTo(-2, ty + 12); ctx.lineTo(-4, ty + 15); ctx.moveTo(4, ty + 9); ctx.lineTo(2, ty + 12); ctx.lineTo(4, ty + 15); ctx.stroke(); ctx.restore(); }
      }
    },
    // the high white collar, the ruffled jabot falling from his throat, and the silver rose that pins the cloak
    neck(L, g) {
      const { SHO, NECK, CS, Y, BACK } = g, ty = SHO - 2, nx = 1.2, sh = L.shirt;
      // the collar: a band standing round the neck, highest at the back, its points open at the throat
      const a0 = Math.atan2(CS, Y), r = 2.9, pts = [];
      for (let i = 0; i <= 8; i++) { const th = a0 - Math.PI / 2 + Math.PI * i / 8; if (!BACK && Math.cos(th) > .82) continue; pts.push([nx + r * (Math.cos(th) * CS - Math.sin(th) * Y), th]); }
      if (pts.length > 1) {
        ctx.beginPath(); pts.forEach(([x, th], i) => { const y = NECK - 2.2 - 1.2 * Math.max(0, -Math.cos(th)) - (Math.cos(th) > .5 ? .8 : 0); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0], NECK + 2.8);
        ctx.closePath(); ctx.fillStyle = C(shade(sh, -.1)); ctx.fill(); outline(.8);
      }
      if (BACK) return;
      // the jabot: tiers of ruffled lace from the throat down over the chest, the lowest first
      const F = Math.pow(CS, 1.6), xn = nx + 2.4 * F - .2, xc = .6 + 9.4 * F, wy = Math.abs(Y);
      for (let k = 3; k >= 0; k--) {
        const q = k / 3, x = lerp(xn, xc, q * .85), y = ty - .6 + k * 2.4, w = 1.9 + 2.2 * wy + k * .5;
        ctx.beginPath(); ctx.moveTo(x - w * .45, y);
        ctx.quadraticCurveTo(x - w * .8, y + 2.2, x - w * .62, y + 3.6);
        for (let s = 0; s < 3; s++) { const x0 = x - w * .62 + w * 1.24 * s / 3, x1 = x - w * .62 + w * 1.24 * (s + 1) / 3; ctx.quadraticCurveTo((x0 + x1) / 2, y + 5, x1, y + 3.6); }
        ctx.quadraticCurveTo(x + w * .8, y + 2.2, x + w * .45, y); ctx.closePath();
        const jg = ctx.createLinearGradient(0, y, 0, y + 4.6); jg.addColorStop(0, C(shade(sh, -.22))); jg.addColorStop(.6, C(sh)); jg.addColorStop(1, C(shade(sh, .2)));
        ctx.fillStyle = jg; ctx.fill(); outline(.7);
        if (FINE()) { ctx.strokeStyle = shade(sh, -.3); ctx.lineWidth = .4; ctx.beginPath(); ctx.moveTo(x - w * .2, y + 1); ctx.lineTo(x - w * .3, y + 3.6); ctx.moveTo(x + w * .2, y + 1); ctx.lineTo(x + w * .3, y + 3.6); ctx.stroke(); }
      }
      // the clasp: a silver rose, and a short chain across to the cloak's other edge
      const rx = xn + .3, ry = ty - .4;
      const ex = nx + 6.8 * (Math.cos(-1.25) * CS - Math.sin(-1.25) * Y), ey = ty + 1.8; // the cloak's far edge, at the collarbone
      if (Math.abs(ex - rx) > 1.5) { ctx.fillStyle = C(L.steel); for (let i = 1; i <= 5; i++) { const u = i / 6, x = lerp(rx, ex, u), y = lerp(ry, ey, u) + Math.sin(u * Math.PI) * 2.2; circle(x, y, .55); ctx.fill(); } }
      roseClasp(rx, ry, 2.1, L.steel);
    },
  };
  function roseClasp(x, y, r, col) { // a silver rose seen face on: an outer ring of petals, an inner ring, and a curled heart
    const dk = shade(col, -.42), lt = shade(col, .4);
    ctx.save(); ctx.translate(x, y);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .3; ctx.fillStyle = C(i % 2 ? col : shade(col, -.12)); ell(Math.cos(a) * r * .55, Math.sin(a) * r * .55, r * .58, r * .42, a); ctx.fill(); }
    circle(0, 0, r * 1.02); outline(.6);
    ctx.fillStyle = C(lt); circle(r * .08, -r * .1, r * .55); ctx.fill();
    if (DET()) { ctx.strokeStyle = dk; ctx.lineWidth = .45; ctx.beginPath(); ctx.arc(0, 0, r * .42, .4, 4.4); ctx.moveTo(r * .2, 0); ctx.arc(0, 0, r * .2, 0, 3.6); ctx.stroke(); }
    ctx.restore();
  }

  // ===================================================== waist =====================================================
  const ring = (g, r, th) => { const fx = r * .8 * Math.cos(th), lz = r * Math.sin(th); return [fx * g.CS - lz * g.Y, fx * g.Y + lz * g.CS]; }; // [x on screen, depth toward us]
  const swordbelt = {
    belts(L, g) {
      const { HIP, CS, Y } = g, a0 = Math.atan2(CS, Y);
      // six gold-edged tabs hanging from the waist over the hips, the furthest first
      const tabs = [];
      for (let k = 0; k < 6; k++) { const th = k / 6 * TAU + Math.PI / 6, d = Math.cos(th - a0); if (d > .08) tabs.push([d, th]); }
      tabs.sort((a, b) => a[0] - b[0]);
      const swing = clamp(g.sw * 1.2, -1.5, 1.5);
      for (const [d, th] of tabs) {
        const [x0] = ring(g, 8, th - .42), [x1] = ring(g, 8, th + .42), [x2] = ring(g, 9.6, th + .44), [x3] = ring(g, 9.6, th - .44), y0 = HIP + .4, y1 = HIP + 7.4 - (1 - d) * 1.2, sx = swing * Math.cos(th);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x2 + sx, y1); ctx.lineTo(x3 + sx, y1); ctx.closePath();
        ctx.fillStyle = C(shade(L.body, -.1 + d * .25)); ctx.fill(); outline(.8);
        const ix = (a, b, t) => a + (b - a) * t;
        ctx.strokeStyle = C(L.trim); ctx.lineWidth = .55; ctx.beginPath();
        ctx.moveTo(ix(x0, x1, .12), y0 + .6); ctx.lineTo(ix(x3, x2, .12) + sx, y1 - .8); ctx.lineTo(ix(x3, x2, .88) + sx, y1 - .8); ctx.lineTo(ix(x0, x1, .88), y0 + .6); ctx.stroke();
      }
      // the belts: a wide one at the waist, and the sword belt slung lower, from his right hip down to his left
      const band = (yOf, r, w, col) => {
        const pts = []; for (let i = 0; i <= 10; i++) { const th = a0 - Math.PI / 2 + Math.PI * i / 10, [x] = ring(g, r, th); pts.push([x, yOf(th)]); }
        const path = () => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); };
        ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
        path(); ctx.strokeStyle = FLASH ? '#FFFFFF' : OUT; ctx.lineWidth = w + 1.8; ctx.stroke();
        path(); ctx.strokeStyle = C(col); ctx.lineWidth = w; ctx.stroke();
        if (DET()) { ctx.save(); ctx.translate(0, -w * .3); path(); ctx.strokeStyle = shade(col, .3); ctx.lineWidth = .6; ctx.stroke(); ctx.restore(); }
      };
      const buckle = (th, r, y, s) => { const [x, d] = ring(g, r, th); if (d < .5) return; const w = s * (.45 + .55 * d / r);
        rrect(x - w, y - s * 1.1, w * 2, s * 2.2, .5); ctx.fillStyle = C(L.brass); ctx.fill(); outline(.7);
        ctx.fillStyle = C(shade(L.leather, -.4)); ctx.fillRect(x - w * .55, y - s * .6, w * 1.1, s * 1.2); ctx.fillStyle = C(shade(L.brass, .3)); ctx.fillRect(x - .25, y - s * .7, .5, s * 1.4); };
      const sling = (th) => HIP + 2 - 2.4 * Math.sin(th);
      band(() => HIP - 1.8, 7.9, 3, L.leather);
      band(sling, 8.3, 2.3, shade(L.leather, -.12));
      buckle(0, 7.9, HIP - 1.8, 1.8); buckle(.55, 8.3, sling(.55), 1.3);
    },
    scabbard(L, g, drawn) { // brown leather and brass at his left hip, hanging back; his own sword in it unless it is in his hand
      const { HIP, CS, Y } = g, th = -1.85, fx = 7 * Math.cos(th), lz = 9.2 * Math.sin(th);
      const x0 = fx * CS - lz * Y, y0 = HIP + 2 - 2.4 * Math.sin(th) + .6;
      const a = .98 + Math.sin(g.walk) * .05 - (g.LEAN || 0) * .85, dx = -Math.cos(a) * CS + .42 * Y, dy = Math.sin(a), len = 31; // back, and out from his hip when seen from the front
      const x1 = x0 + dx * len, y1 = y0 + dy * len;
      if (!drawn) { // the hilt: a brass cross-guard and pommel on a dark grip, standing up out of the locket
        const hx = x0 - dx * 7, hy = y0 - dy * 7;
        limb([x0, y0, hx, hy], '#2E2220', 2.2);
        ctx.fillStyle = C(L.brass); circle(hx - dx * .8, hy - dy * .8, 1.5); ctx.fill(); outline(.7);
        ctx.save(); ctx.translate(x0, y0); ctx.rotate(Math.atan2(dy, dx)); rrect(-.9, -4.4, 1.8, 8.8, .8); ctx.fillStyle = C(L.brass); ctx.fill(); outline(.8); ctx.restore();
      }
      seg(x0, y0, x1, y1, 3.6, 2.6, L.scab, .2);
      ctx.save(); const l = along(x0, y0, x1, y1);
      ctx.fillStyle = C(L.brass); rrect(.6, -2.2, 3.4, 4.4, .6); ctx.fill(); outline(.7); // the locket
      ctx.fillRect(l * .5, -1.6, 1.2, 3.2); // a band
      ctx.beginPath(); ctx.moveTo(l - 4.2, -1.6); ctx.lineTo(l + 1.6, 0); ctx.lineTo(l - 4.2, 1.6); ctx.closePath(); ctx.fill(); outline(.7); // the chape
      if (DET()) { ctx.strokeStyle = shade(L.scab, .35); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(4.4, -.8); ctx.lineTo(l - 4.6, -.6); ctx.stroke(); }
      ctx.restore();
    },
  };

  // ===================================================== the cloak =====================================================
  // Seven strands hang from a ring round his shoulders, from the far front edge, across his back, to the near front
  // edge; each strand is five points. Where each point wants to be (its target) comes from the pose: the drape, a flare
  // at the hem, a trail behind him as he moves, a sway with each stride, a slow stir of air. For the live prince those
  // targets are springs: every point keeps its place in the world and is pulled toward its target, the hem softest, so
  // the cloth lags, overshoots and settles; air drag streams it out behind a run and lifts it as he falls; it lies on the
  // street when he goes down. Anything else that draws him (afterimages, menus, portraits) uses a snapshot or the targets.
  const S = 7, M = 4, NP = S * (M + 1), PHIMAX = Math.PI * .62;
  const KJ = [0, 260, 165, 105, 66];          // spring stiffness down a strand (1/s^2)
  const GRAVITY = 300, DRAG_X = 2.1, DRAG_Y = 2.2, DAMP = 2.4, H = 1 / 120;
  const tgt = new Float32Array(NP * 2), loc = new Float32Array(NP * 2), rest = new Float32Array(NP);
  const ix = (i, j) => (i * (M + 1) + j) * 2;
  const SIM = { pts: new Float32Array(NP * 2), sp: new Float32Array((M + 1) * 2), sq: new Float32Array((M + 1) * 2), dA: new Float32Array(M + 1), ok: false, wx: 0, wy: 0, at: 0, acc: 0, f: 1 };
  let CLOAK_GEO = null;
  // the hem is torn: teeth and notches along it, and bristle marks splaying past it, fixed once so they never shimmer
  const JAG = []; for (let k = 0; k < (S - 1) * 3; k++) JAG.push(k % 3 === 1 ? 2.2 + hsh(k) * 2.6 : hsh(k + 40) * .9);
  const STREAKS = [], BRISTLES = [];
  { // dry-brush streaks down the cloth: slate-blue and grey dragged through the black, a few lighter catches of the light
    const cols = ['s', 's', 'g', 'd', 's', 'g', 'l', 'd'];
    for (let k = 0; k < 18; k++) { const u = .03 + .94 * hsh(k + 3), v0 = .08 + hsh(k + 9) * .5; STREAKS.push({ u, du: (hsh(k + 17) - .5) * .06, v0, v1: Math.min(1.04, v0 + .25 + hsh(k + 21) * .5), c: cols[k % cols.length], w: .35 + hsh(k + 31) * .9 }); }
    for (let k = 0; k < 34; k++) { const u = (k + hsh(k + 51) * .8) / 34; BRISTLES.push({ u, du: (hsh(k + 57) - .5) * .05, v0: .86 + hsh(k + 61) * .08, v1: 1.02 + hsh(k + 67) * .13, c: k % 4 === 0 ? 's' : k % 7 === 0 ? 'g' : 'b', w: .5 + hsh(k + 71) * 1.1 }); }
    for (let k = 0; k < 12; k++) BRISTLES.push({ trail: 1, v: .25 + .7 * k / 11, len: 2.5 + hsh(k + 81) * 4.5, c: k % 2 ? 's' : 'b', w: .5 + hsh(k + 83) * .9 });
  }
  function targets(L, g) {
    const { Y, CS, HIP, SHO, HX, LEAN, walk, sw, pose, gait, t } = g, cl = Math.cos(LEAN), sl = Math.sin(LEAN);
    const flow = clamp(pose.flow || 0, -12, 20), down = pose.down ? 1 : 0;
    const still = 0, stream = 0, trail = 6.5 + flow * 1.05 + (gait ? (pose.run ? 7 : 2 + Math.abs(sw) * 1.6) : 0);
    const br = pose.breath || 0, air = Math.sin(t * 1.1);
    for (let i = 0; i < S; i++) {
      const phi = (i / (S - 1) * 2 - 1) * PHIMAX, sp = Math.sin(phi), cp = Math.cos(phi), front = Math.max(0, -cp);
      const fxa = -6.4 * cp + 1.2 - front * 1.5, lza = 10.3 * sp, ya = SHO - 1.6 + (1 - Math.abs(sp)) * .8;
      const ax0 = fxa * CS - lza * Y, ax = HX + ax0 * cl - (ya - HIP) * sl, ay = HIP + ax0 * sl + (ya - HIP) * cl;
      const len = (43 + 3.5 * cp - 6 * front) * (1 - down * .1), fl = 15.5 + .25 * Math.abs(flow) + down * 4 + (pose.stance && !walk ? 6 : 0); // standing, it spreads wide round him
      for (let j = 0; j <= M; j++) {
        const o = ix(i, j); if (!j) { tgt[o] = ax; tgt[o + 1] = ay; continue; }
        const v = j / M, vf = Math.pow(v, .85);
        const sway = (Math.sin(walk * .5 + i * .9 - v * 1.6) * (gait ? 1.8 : 0) + (air * .45 + br * .25) * Math.sin(i * 1.7 + v * 2.2)) * v;
        const ofx = -Math.max(0, cp) * 1.15 * fl * vf + front * (.3 + .45 * still) * fl * vf - trail * Math.pow(v, 1.5) - front * 6.5 * v + sway, olz = sp * fl * vf;
        let dyy = 0; const L3 = len * v, hz = Math.min(L3 * .94, Math.hypot(ofx, olz)), dy = Math.sqrt(L3 * L3 - hz * hz) + br * .35 * v; // it keeps its length: streaming out, it rises
        let dx = ofx * CS - olz * Y, a = LEAN * (1 - .8 * v), ca = Math.cos(a), sa = Math.sin(a);
        if (down) { // knocked flat: the near half lies over him like a shroud down to his boots, the rest spreads on the street past his head
          if (i >= (S - 1) / 2) { const q = (i - (S - 1) / 2) / ((S - 1) / 2); dx = lerp(1.5, 7.5, q) * Math.min(1, v * 3); dyy = L3 * .92; } else { dx = -2 - olz * .3 - 3 * v; dyy = -L3 * .7; } }
        const dy2 = down ? dyy : dy;
        tgt[o] = ax + dx * ca - dy2 * sa; tgt[o + 1] = ay + dx * sa + dy2 * ca;
      }
    }
  }
  // the live cloak, worked out in a frame fixed to the world at his feet (B: screen-aligned, world units). One spine, down
  // the middle of his back, is simulated: each of its points keeps its place in the world and is pulled toward where the
  // pose wants it, the hem softest, against air drag, so it lags, overshoots and settles. How far the spine is thrown
  // off its target is then laid on every strand (most at the back, less at the front edges) and each strand is pulled
  // back to its own length, so the cloth keeps its sweep and spread however hard it is thrown.
  const SP = (M + 1) * 2, spT = new Float32Array(SP), WGT = []; for (let i = 0; i < S; i++) WGT.push(.55 + .45 * (1 - Math.abs(i - (S - 1) / 2) / ((S - 1) / 2)));
  function simulate(g, CD) {
    const Mrel = CD.Binv.multiply(ctx.getTransform()), a = Mrel.a, b = Mrel.b, c = Mrel.c, d = Mrel.d, e = Mrel.e, f = Mrel.f;
    const tb = loc; // targets in B
    for (let k = 0; k < NP; k++) { const x = tgt[k * 2], y = tgt[k * 2 + 1]; tb[k * 2] = a * x + c * y + e; tb[k * 2 + 1] = b * x + d * y + f; }
    for (let i = 0; i < S; i++) for (let j = 1; j <= M; j++) { const o = ix(i, j), p = ix(i, j - 1); rest[o / 2] = Math.hypot(tb[o] - tb[p], tb[o + 1] - tb[p + 1]); }
    const mid = (S - 1) / 2; for (let j = 0; j <= M; j++) { spT[j * 2] = tb[ix(mid, j)]; spT[j * 2 + 1] = tb[ix(mid, j) + 1]; }
    const now = (typeof BL !== 'undefined' && BL.clock) ? BL.clock() : performance.now();
    let dt = Math.min(.05, Math.max(0, (now - SIM.at) / 1000)); SIM.at = now;
    const frozen = (typeof hitstop !== 'undefined' && hitstop > 0) || (typeof mode !== 'undefined' && mode !== 'play' && mode !== 'title');
    if (frozen) dt = 0; else if (typeof slowmo !== 'undefined' && slowmo > 0) dt *= .3;
    const P = SIM.sp, Q = SIM.sq, mx = CD.wx - SIM.wx, my = CD.wy - SIM.wy;
    if (!SIM.ok || Math.abs(mx) > 60 || Math.abs(my) > 60 || !(now - SIM.seen < 400)) { P.set(spT); Q.set(spT); SIM.ok = true; SIM.acc = 0; } // a fresh start, or he was moved somewhere at once
    else if (mx || my) for (let j = 0; j <= M; j++) { P[j * 2] -= mx; P[j * 2 + 1] -= my; Q[j * 2] -= mx; Q[j * 2 + 1] -= my; } // the cloth stays where it was in the world
    SIM.wx = CD.wx; SIM.wy = CD.wy; SIM.seen = now; SIM.f = CD.facing;
    const pose = g.pose, free = pose.down || pose.rot || pose.spin, soft = pose.down ? .55 : free ? .5 : 1, ground = CD.z - .4;
    SIM.acc += dt; let n = 0;
    if (pose.down) SIM.acc = 0; // (knocked flat: no swing, see below)
    while (SIM.acc >= H && n < 7) {
      SIM.acc -= H; n++;
      P[0] = Q[0] = spT[0]; P[1] = Q[1] = spT[1];
      for (let j = 1; j <= M; j++) {
        const o = j * 2, k = KJ[j] * soft, x = P[o], y = P[o + 1];
        let vx = (x - Q[o]) * (1 - (DRAG_X + DAMP) * H), vy = (y - Q[o + 1]) * (1 - (DRAG_Y + DAMP) * H);
        const lim = 22; vx = clamp(vx, -lim, lim); vy = clamp(vy, -lim, lim);
        const ax = k * (spT[o] - x), ay = k * (spT[o + 1] - GRAVITY / KJ[j] - y) + GRAVITY;
        Q[o] = x; Q[o + 1] = y; P[o] = x + vx + ax * H * H; P[o + 1] = y + vy + ay * H * H;
      }
      for (let j = 1; j <= M; j++) { // each point stays within reach of the one above it
        const o = j * 2, p = o - 2, dx = P[o] - P[p], dy = P[o + 1] - P[p + 1], l = Math.hypot(dx, dy) || 1e-4, r = rest[ix(mid, j) / 2];
        const want = l > r * 1.06 ? r * 1.06 : l < r * .6 ? r * .6 : l; if (want !== l) { P[o] = P[p] + dx * want / l; P[o + 1] = P[p + 1] + dy * want / l; }
        if (P[o + 1] > ground) { P[o + 1] = ground; Q[o] = P[o] - (P[o] - Q[o]) * .4; } // it lies on the street, dragging
      }
    }
    if (n === 7) SIM.acc = 0;
    if (pose.down) { const q = 1 - Math.exp(-dt * 3.5); P[0] = Q[0] = spT[0]; P[1] = Q[1] = spT[1]; for (let k = 2; k < SP; k++) { P[k] += (spT[k] - P[k]) * q; Q[k] = P[k]; } } // knocked flat, it settles over him rather than swinging
    // lay the spine's throw on every strand as a turn of each of its segments (most at the back, less at the front
    // edges), so the strands fan out from one another however far the cloth is thrown, and keep their lengths
    const out = SIM.pts, dA = SIM.dA;
    let acc = 0; for (let j = 1; j <= M; j++) { const o = j * 2, p = o - 2;
      let d = Math.atan2(P[o + 1] - P[p + 1], P[o] - P[p]) - Math.atan2(spT[o + 1] - spT[p + 1], spT[o] - spT[p]); d = Math.atan2(Math.sin(d), Math.cos(d)); acc = d; dA[j] = acc; }
    for (let i = 0; i < S; i++) {
      const w = WGT[i], o0 = ix(i, 0); out[o0] = tb[o0]; out[o0 + 1] = tb[o0 + 1];
      for (let j = 1; j <= M; j++) {
        const o = ix(i, j), p = ix(i, j - 1), r = rest[o / 2], ta = Math.atan2(tb[o + 1] - tb[p + 1], tb[o] - tb[p]) + dA[j] * w;
        let x = out[p] + Math.cos(ta) * r, y = out[p + 1] + Math.sin(ta) * r;
        if (!free && y < out[o0 + 1] + j * 2.5) y = out[o0 + 1] + j * 2.5; // never thrown up over his own shoulders
        if (y > ground) y = ground;
        out[o] = x; out[o + 1] = y;
      }
    }
    toLocal(Mrel, out, 1);
  }
  function toLocal(Mrel, src, fx) { // B frame -> his own drawing frame
    const iv = Mrel.inverse(), a = iv.a, b = iv.b, c = iv.c, d = iv.d, e = iv.e, f = iv.f;
    for (let k = 0; k < NP; k++) { const x = src[k * 2] * fx, y = src[k * 2 + 1]; loc[k * 2] = a * x + c * y + e; loc[k * 2 + 1] = b * x + d * y + f; }
  }
  function snapshot() { // for afterimages: the cloak as it is now, with the facing taken out
    if (!SIM.ok) return null; const s = new Float32Array(NP * 2);
    for (let k = 0; k < NP; k++) { s[k * 2] = SIM.pts[k * 2] * SIM.f; s[k * 2 + 1] = SIM.pts[k * 2 + 1]; }
    return s;
  }
  // work out where the cloak is this frame; returns the points in his drawing frame
  function begin(L, g) {
    CLOAK_GEO = g; targets(L, g);
    const CD = CLOAK_DRAW;
    if (CD && CD.live && !g.pose.noSim) simulate(g, CD);
    else if (CD && (CD.live || g.pose.cloakS)) { const Mrel = CD.Binv.multiply(ctx.getTransform()); if (CD.live && SIM.ok) toLocal(Mrel, SIM.pts, 1); else toLocal(Mrel, g.pose.cloakS, CD.facing); }
    else { loc.set(tgt); if (!g.pose.rot && !g.pose.down) { const gr = (CD ? CD.z : 0) - .5; for (let k = 0; k < NP; k++) if (loc[k * 2 + 1] > gr) loc[k * 2 + 1] = gr; } }
    return loc;
  }
  // a point on the cloth: u across it (0 the far front edge .. 1 the near one), v down it (1 the hem; beyond it extends)
  let UX = 0, UY = 0;
  function uv(Pt, u, v) {
    const fu = clamp(u, 0, 1) * (S - 1), i = Math.min(S - 2, Math.floor(fu)), a = fu - i, fv = Math.max(0, v) * M, j = Math.min(M - 1, Math.floor(fv)), b = fv - j;
    const p00 = ix(i, j), p10 = ix(i + 1, j), p01 = ix(i, j + 1), p11 = ix(i + 1, j + 1);
    UX = (Pt[p00] * (1 - a) + Pt[p10] * a) * (1 - b) + (Pt[p01] * (1 - a) + Pt[p11] * a) * b;
    UY = (Pt[p00 + 1] * (1 - a) + Pt[p10 + 1] * a) * (1 - b) + (Pt[p01 + 1] * (1 - a) + Pt[p11 + 1] * a) * b;
  }
  const CCOL = (L, c) => c === 's' ? L.cloakSlate : c === 'g' ? L.cloakGrey : c === 'l' ? L.cloakLt : c === 'd' ? '#08080C' : L.cloak;
  // one half of the cloak, from strand i0 (a front edge) to the back strand
  function half(L, Pt, far) {
    const i0 = far ? 0 : S - 1, i1 = (S - 1) / 2, st = far ? 1 : -1, u0 = i0 / (S - 1), u1 = .5;
    const base = far ? shade(L.cloak, -.25) : L.cloak;
    ctx.beginPath(); ctx.moveTo(Pt[ix(i0, 0)], Pt[ix(i0, 0) + 1]);
    for (let i = i0 + st; i !== i1 + st; i += st) ctx.lineTo(Pt[ix(i, 0)], Pt[ix(i, 0) + 1]); // across the shoulders
    for (let j = 1; j < M; j++) { const o = ix(i1, j), q = ix(i1, j + 1); ctx.quadraticCurveTo(Pt[o], Pt[o + 1], (Pt[o] + Pt[q]) / 2, (Pt[o + 1] + Pt[q + 1]) / 2); } // down the back
    ctx.lineTo(Pt[ix(i1, M)], Pt[ix(i1, M) + 1]);
    for (let i = i1; i !== i0; i -= st) { // the torn hem
      const a = ix(i, M), b = ix(i - st, M), a2 = ix(i, M - 1), b2 = ix(i - st, M - 1), gap = Math.min(i, i - st);
      for (let s = 1; s <= 3; s++) {
        const q = s / 3, x = lerp(Pt[a], Pt[b], q), y = lerp(Pt[a + 1], Pt[b + 1], q), ux = lerp(Pt[a2], Pt[b2], q) - x, uy = lerp(Pt[a2 + 1], Pt[b2 + 1], q) - y, ul = Math.hypot(ux, uy) || 1;
        const jg = s === 3 ? JAG[gap * 3] * .4 : JAG[gap * 3 + (st > 0 ? 3 - s : s)];
        ctx.lineTo(x + ux / ul * jg, y + uy / ul * jg);
      }
    }
    for (let j = M - 1; j >= 1; j--) { const o = ix(i0, j), q = ix(i0, j - 1); ctx.quadraticCurveTo(Pt[o], Pt[o + 1], (Pt[o] + Pt[q]) / 2, (Pt[o + 1] + Pt[q + 1]) / 2); } // up the front edge
    ctx.closePath(); ctx.fillStyle = C(base); ctx.fill();
    ctx.beginPath(); ctx.moveTo(Pt[ix(i0, M)], Pt[ix(i0, M) + 1]); // ink only along the front edge: the hem is left to the brush
    for (let j = M - 1; j >= 0; j--) ctx.lineTo(Pt[ix(i0, j)], Pt[ix(i0, j) + 1]);
    ctx.lineJoin = 'round'; outline(1);
    // the brushwork, batched by color so it costs a handful of strokes
    const lo = Math.min(u0, u1), hi = Math.max(u0, u1), det = DET(), fine = FINE(), few = !fine;
    ctx.lineCap = 'round';
    for (const c of ['d', 's', 'g', 'l', 'b']) {
      if (!det && c !== 'b') continue;
      ctx.strokeStyle = det ? CCOL(L, c) : C(L.cloak); ctx.globalAlpha = c === 'l' ? .22 : c === 'b' ? 1 : c === 'd' ? .7 : .38;
      for (const wcls of [0, 1]) {
        ctx.beginPath(); let any = false;
        if (det && c !== 'b' && !(few && c === 'l')) for (const s of STREAKS) { if (s.c !== c || (s.w > 1.1 ? 1 : 0) !== wcls || s.u < lo || s.u > hi) continue; if (far && few) continue;
          for (let q = 0; q <= 4; q++) { const v = lerp(s.v0, s.v1, q / 4); uv(Pt, s.u + s.du * q / 4, v); q ? ctx.lineTo(UX, UY) : ctx.moveTo(UX, UY); } any = true; }
        for (const s of BRISTLES) { if (s.trail || (s.c === 'b' ? 'b' : s.c) !== c || (s.w > 1 ? 1 : 0) !== wcls || s.u < lo || s.u > hi) continue; if (few && (s.u * 34 | 0) % 2) continue;
          uv(Pt, s.u, s.v0); ctx.moveTo(UX, UY); uv(Pt, s.u + s.du, s.v1); ctx.lineTo(UX, UY); any = true; }
        if (!far) for (const s of BRISTLES) { if (!s.trail || s.c !== c || (s.w > 1 ? 1 : 0) !== wcls) continue; // splayed marks off the trailing edge
          uv(Pt, .5, s.v); const bx = UX, by = UY; uv(Pt, .22, s.v); const sx = UX, sy = UY; uv(Pt, .78, s.v); let ox = bx - (sx + UX) / 2, oy = by - (sy + UY) / 2; const ol = Math.hypot(ox, oy); if (ol < 2.5) continue;
          ox /= ol; oy /= ol; uv(Pt, .5, s.v + .15); let dx = UX - bx, dy = UY - by; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
          ctx.moveTo(bx - ox * .6, by - oy * .6); ctx.lineTo(bx + (ox * .55 + dx) * s.len, by + (oy * .55 + dy) * s.len); any = true; }
        if (any) { ctx.lineWidth = wcls ? 1.15 : .6; ctx.stroke(); }
      }
    }
    ctx.globalAlpha = 1;
  }
  function hood(L, g, back) { // the hood, bunched behind his neck, or hanging down his back when he faces away
    const { SHO, NECK, CS, Y } = g, P = (fx, lz) => fx * CS - lz * Y;
    ctx.beginPath();
    if (back) { ctx.moveTo(P(-2, 6.5), SHO - 3); ctx.quadraticCurveTo(P(-7, 5), SHO + 7, P(-6.5, 0), SHO + 13); ctx.quadraticCurveTo(P(-7, -5), SHO + 7, P(-2, -6.5), SHO - 3); ctx.quadraticCurveTo(P(-5, 0), NECK - 2, P(-2, 6.5), SHO - 3); }
    else { const x = P(-5.4, 0); ctx.moveTo(x + 4.2, NECK + 2); ctx.quadraticCurveTo(x + 2, NECK - 4.6, x - 3.4, NECK - 2); ctx.quadraticCurveTo(x - 6.6, SHO, x - 4.6, SHO + 5); ctx.lineTo(x + 3, SHO + 4); ctx.closePath(); }
    ctx.fillStyle = C(L.cloak); ctx.fill(); outline(1);
    if (DET()) { ctx.strokeStyle = L.cloakSlate; ctx.lineWidth = .8; ctx.lineCap = 'round'; ctx.beginPath(); const x = P(-5.4, 0);
      if (back) { ctx.moveTo(P(-3, 3), SHO - 1); ctx.quadraticCurveTo(P(-6, 1), SHO + 6, P(-6.4, 0), SHO + 11); ctx.moveTo(P(-3, -3), SHO); ctx.lineTo(P(-5.6, -2), SHO + 8); }
      else { ctx.moveTo(x + 1.6, NECK - 2.4); ctx.quadraticCurveTo(x - 2.4, NECK - 1, x - 3.4, SHO + 3); ctx.moveTo(x + 2.6, NECK); ctx.lineTo(x - .4, SHO + 3); }
      ctx.stroke(); }
  }
  function mantle(L, g) { // the cloak where it lies over his shoulders, round the back of his neck, open at the throat
    const { SHO, NECK, CS, Y } = g, P = (fx, lz) => fx * CS - lz * Y, out = [], inn = [];
    for (let i = 0; i <= 12; i++) {
      const th = .78 + (TAU - 1.56) * i / 12, c = Math.cos(th), s = Math.sin(th), ro = 12 + Math.sin(th * 5) * .7, ri = 2.7;
      out.push([P(ro * c - 1, ro * s), SHO + 2.4 + 2.4 * Math.abs(s) - 1.6 * Math.max(0, -c) + Math.cos(th * 4) * .5]);
      inn.push([P(ri * c + 1.2, ri * s), NECK + 1.6 + .8 * c]);
    }
    ctx.beginPath(); out.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); for (let i = inn.length - 1; i >= 0; i--) ctx.lineTo(inn[i][0], inn[i][1]); ctx.closePath();
    ctx.fillStyle = C(L.cloak); ctx.fill(); outline(1);
    if (FINE()) { ctx.strokeStyle = L.cloakSlate; ctx.lineWidth = .7; ctx.lineCap = 'round'; ctx.beginPath();
      for (const k of [2, 4, 8, 10]) { ctx.moveTo((inn[k][0] * 2 + out[k][0]) / 3, (inn[k][1] * 2 + out[k][1]) / 3); ctx.lineTo(out[k][0], out[k][1] + .4); } ctx.stroke(); }
  }
  const cloak = { begin, half, hood, mantle, snapshot, sim: SIM };

  const parts = { mail: { doublet }, pants: { trousers }, gauntlets: { vambrace }, waist: { swordbelt } };
  const DEF = { mail: 'doublet', pants: 'trousers', gauntlets: 'vambrace', waist: 'swordbelt' };
  const PART = (slot, L) => parts[slot][L[slot]] || parts[slot][DEF[slot]];
  return { parts, PART, leg, cloak, roseClasp, get geo() { return CLOAK_GEO; } };
})();
