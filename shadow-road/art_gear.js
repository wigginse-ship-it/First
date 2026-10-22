'use strict';
// ---------- the armor sets on the prince: new pieces for his costume's four slots ----------
// Each set adds one part to each slot table in art_corwin.js (CORWIN.parts.mail / pants / gauntlets / waist), drawn to
// the same contract as his own doublet, trousers, vambraces and sword belt, which stay his traveller's costume for an
// empty slot. A part reads only its own slot's palette keys (m_ mail, p_ legs, g_ gauntlets and glove, w_ waist), so a
// mix of sets reads as a mix. The cloak, the silver rose clasp at the throat and his scabbard are kept with every set.
//   wayfarer  worn tan leather laced over rough wool, wrapped shins, a rope belt and pouch
//   corsair   an oxblood coat, brass buttons and a studded bandolier, navy breeches in cuffed sea-boots, a crimson sash
//   prism     violet glass scales catching cyan light, faceted crystal greaves and vambraces, a sash woven of light
//   chaos     black plate inlaid with blood-red and seamed with embers, spiked shoulders and knees, a chain girdle
//   moon      moon-silver plate chased with silver-leaf filigree, a crescent at the breast, a moonstone at the girdle
(() => {
  const K = CORWIN.kit, D = CORWIN.parts, { DET, FINE, metal, rivet, along, ring } = K;
  const dk = (c, far, k = -.18) => far ? shade(c, k) : c;
  const glowOn = (col, b) => { if (DET()) { ctx.shadowColor = col; ctx.shadowBlur = b; } };
  const poly = (pts) => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); };
  const fill = (col) => { ctx.fillStyle = typeof col === 'string' ? C(col) : col; ctx.fill(); };

  // ================================================= mail: the torso =================================================
  // the torso's base coat, lit from the upper right, and the side turned from the light; returns the frame for details
  function torsoBase(L, g, col, lit = .4, isMetal) {
    const { HIP, SHO, Y } = g, ty = SHO - 2, TW = K.setTW(Y);
    const tg = isMetal ? metal(10, ty, -10, ty + 22, col) : (() => { const t = ctx.createLinearGradient(-10, ty, 10, ty + 22); t.addColorStop(0, C(shade(col, -.3))); t.addColorStop(.55, C(col)); t.addColorStop(1, C(shade(col, lit))); return t; })();
    K.torsoPath(ty, HIP); fill(tg);
    return { ty, TW, HIP, fx: 6.6 * TW * Math.pow(g.CS, 1.6), fw: Math.max(.34, 1 - .66 * g.CS), front: Y > -.3 && !g.BACK };
  }
  function clipTorso(f, fn) { ctx.save(); K.torsoPath(f.ty, f.HIP); ctx.clip(); fn(); if (DET()) { ctx.fillStyle = 'rgba(0,0,0,.26)'; ctx.beginPath(); ctx.moveTo(-11, f.ty); ctx.lineTo(-3, f.ty); ctx.quadraticCurveTo(-5.6, f.ty + 12, -3.4, f.HIP + 2); ctx.lineTo(-11, f.HIP + 2); ctx.closePath(); ctx.fill(); } ctx.restore(); }
  const frontFrame = (f, fn) => { if (!f.front) return; ctx.save(); ctx.translate(f.fx, 0); ctx.scale(f.fw, 1); fn(); ctx.restore(); };
  const spine = (f, col) => { if (!f.front) { ctx.strokeStyle = C(shade(col, -.5)); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(0, f.ty + 2); ctx.lineTo(0, f.HIP - 2); ctx.stroke(); } };
  // the collar and the rose clasp are his own (the doublet's), in the set's color
  const neckIn = (key) => function (L, g) { D.mail.doublet.neck(Object.assign({}, L, { shirt: L[key] }), g); };

  const wayfarerMail = {
    torso(L, g) {
      const f = torsoBase(L, g, L.m_a, .35);
      clipTorso(f, () => {
        ctx.save(); ctx.scale(f.TW, 1);
        if (DET()) { ctx.save(); ctx.setLineDash([1.1, 1.3]); ctx.strokeStyle = shade(L.m_d, .1); ctx.lineWidth = .6; ctx.beginPath(); // stitched seams: the yoke and both sides
          ctx.moveTo(-10, f.ty + 4.2); ctx.quadraticCurveTo(0, f.ty + 1.8, 10, f.ty + 4.2); ctx.moveTo(-5.4, f.ty + 5); ctx.quadraticCurveTo(-4.6, f.ty + 13, -5, f.HIP + 1); ctx.moveTo(5.6, f.ty + 5); ctx.quadraticCurveTo(4.8, f.ty + 13, 5.2, f.HIP + 1); ctx.stroke(); ctx.restore(); }
        rrect(f.front ? -6.6 : 1.8, f.ty + 13, 3.8, 3.6, .8); fill(shade(L.m_a, -.22)); outline(.5); // a scuffed patch
        if (DET()) { ctx.fillStyle = 'rgba(255,230,190,.16)'; ell(3, f.ty + 8, 2.6, 1.2, -.4); ctx.fill(); }
        ctx.restore();
      });
      K.torsoPath(f.ty, f.HIP); outline(); spine(f, L.m_a);
      frontFrame(f, () => { // rough wool showing in a V at the throat, laced across with a thong
        poly([-3.8, f.ty - .4, 0, f.ty + 9, 3.8, f.ty - .4]); fill(L.m_c); outline(.6);
        if (DET()) { ctx.strokeStyle = shade(L.m_c, -.25); ctx.lineWidth = .45; ctx.beginPath(); for (const x of [-1.6, .2, 1.8]) { ctx.moveTo(x, f.ty + .4); ctx.lineTo(x * .5, f.ty + 6); } ctx.stroke(); }
        ctx.strokeStyle = C(L.m_b); ctx.lineWidth = .75; ctx.beginPath();
        for (let i = 0; i < 4; i++) { const y = f.ty + 1.6 + i * 2.2, a = 2.8 - i * .55; ctx.moveTo(-a, y); ctx.lineTo(a, y + 1.9); ctx.moveTo(a, y); ctx.lineTo(-a, y + 1.9); }
        ctx.stroke();
      });
    },
    neck: neckIn('m_collar'),
  };
  const corsairMail = {
    torso(L, g) {
      const f = torsoBase(L, g, L.m_a, .32);
      clipTorso(f, () => {
        ctx.save(); ctx.scale(f.TW, 1);
        const x0 = f.front ? -10 : 10, x1 = f.front ? 7 : -7; // the bandolier, studded with brass, over the near shoulder
        ctx.lineCap = 'butt'; ctx.strokeStyle = C(INK); ctx.lineWidth = 3 + 1.4 * OUTK; ctx.beginPath(); ctx.moveTo(x0, f.ty + 1); ctx.lineTo(x1, f.HIP); ctx.stroke();
        ctx.strokeStyle = C(L.m_b); ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = C(L.m_c); for (const k of [.1, .26, .42, .58, .74, .9]) { circle(lerp(x0, x1, k), lerp(f.ty + 1, f.HIP, k), .62); ctx.fill(); }
        if (DET()) { ctx.strokeStyle = shade(L.m_a, -.4); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(-9, f.HIP - 4.5); ctx.quadraticCurveTo(0, f.HIP - 3, 9, f.HIP - 4.5); ctx.stroke(); } // the coat's waist seam
        ctx.restore();
      });
      K.torsoPath(f.ty, f.HIP); outline(); spine(f, L.m_a);
      frontFrame(f, () => { // the turned-back facings, and two rows of brass buttons
        for (const d of [-1, 1]) { poly([d * 1.2, f.ty, d * 5.6, f.ty + 1.2, d * 2.6, f.ty + 7, d * 3.2, f.HIP - 4, d * 1.2, f.HIP - 4]); fill(shade(L.m_d, d < 0 ? -.15 : 0)); outline(.5); }
        ctx.fillStyle = C(L.m_c); for (const y of [f.ty + 8, f.ty + 11.5, f.ty + 15]) for (const x of [-2.2, 2.2]) { circle(x, y, .82); ctx.fill(); if (DET()) { ctx.fillStyle = 'rgba(255,255,240,.8)'; ctx.fillRect(x - .4, y - .55, .4, .4); ctx.fillStyle = C(L.m_c); } }
      });
    },
    neck: neckIn('m_collar'),
  };
  const prismMail = {
    torso(L, g) {
      const f = torsoBase(L, g, L.m_a, .3);
      clipTorso(f, () => { // rows of overlapping glass scales, lit toward the light, a few catching cyan
        ctx.save(); ctx.scale(f.TW, 1);
        const ph = ((-g.Y * 4) % 4.4 + 4.4) % 4.4;
        let r = 0;
        for (let y = f.ty - 1.4; y < f.HIP + 2; y += 3, r++) {
          let i = 0;
          for (let x = -14 + ph + (r % 2) * 2.2; x < 14; x += 4.4, i++) {
            ctx.beginPath(); ctx.moveTo(x - 2.3, y); ctx.quadraticCurveTo(x - 2.3, y + 3.3, x, y + 3.9); ctx.quadraticCurveTo(x + 2.3, y + 3.3, x + 2.3, y); ctx.closePath();
            fill(x > 3 ? shade(L.m_b, .12) : x > -3 ? L.m_b : shade(L.m_b, -.28)); ctx.strokeStyle = C(shade(L.m_a, -.45)); ctx.lineWidth = .45; ctx.stroke();
            if (DET() && (r * 3 + i) % 4 === 1 && x > -3) { ctx.strokeStyle = L.m_c; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(x + .3, y + .7); ctx.lineTo(x + 1.3, y + 2.5); ctx.stroke(); }
          }
        }
        ctx.restore();
      });
      K.torsoPath(f.ty, f.HIP); outline();
      frontFrame(f, () => { // a crystal gorget at the throat
        poly([-4, f.ty - .2, 0, f.ty + 5.4, 4, f.ty - .2, 0, f.ty + 1.6]); fill(L.m_d); outline(.6);
        ctx.save(); glowOn(L.m_c, 4); ctx.strokeStyle = C(L.m_c); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(0, f.ty + 1.8); ctx.lineTo(0, f.ty + 4.8); ctx.stroke(); ctx.restore();
      });
    },
    neck: neckIn('m_collar'),
  };
  const chaosMail = {
    torso(L, g) {
      const f = torsoBase(L, g, L.m_a, .25);
      clipTorso(f, () => {
        ctx.save(); ctx.translate(f.front ? f.fx * .45 : 0, 0); ctx.scale(f.TW * (f.front ? Math.max(.6, f.fw) : 1), 1);
        poly([-10.6, f.ty + 1.8, -3, f.ty - .8, 3, f.ty - .8, 10.6, f.ty + 1.8, 8.4, f.ty + 12.6, 0, f.ty + 16, -8.2, f.ty + 12.6]); fill(metal(9, f.ty, -9, f.ty + 16, L.m_b)); outline(.9); // the black breastplate
        if (f.front) { poly([-6, f.ty + 3.6, 0, f.ty + 2, 6.2, f.ty + 3.6, 5, f.ty + 10.6, 0, f.ty + 13.2, -4.8, f.ty + 10.6]); fill(L.m_d); } // a blood-red inlay
        for (const y of [f.ty + 16.6, f.ty + 19.6]) { rrect(-9, y, 18, 2.7, 1); fill(shade(L.m_b, -.12)); outline(.6); } // lames over the belly
        ctx.save(); glowOn(L.m_c, 4); ctx.strokeStyle = C(L.m_c); ctx.lineWidth = .7; ctx.beginPath(); // the ember seams
        if (f.front) { ctx.moveTo(0, f.ty + 2.4); ctx.lineTo(-1, f.ty + 5.8); ctx.lineTo(.8, f.ty + 8.4); ctx.lineTo(-.4, f.ty + 12.4); }
        else { ctx.moveTo(0, f.ty + 1); ctx.lineTo(0, f.ty + 15); }
        ctx.moveTo(-8.2, f.ty + 13); ctx.lineTo(0, f.ty + 16.4); ctx.lineTo(8.4, f.ty + 13); ctx.moveTo(-8.6, f.ty + 19.3); ctx.lineTo(8.6, f.ty + 19.3); ctx.stroke(); ctx.restore();
        ctx.restore();
      });
      K.torsoPath(f.ty, f.HIP); outline(1.2);
    },
    neck: neckIn('m_collar'),
  };
  const moonMail = {
    torso(L, g) {
      const f = torsoBase(L, g, L.m_a, .5, true);
      clipTorso(f, () => {
        ctx.save(); ctx.translate(f.front ? f.fx * .45 : 0, 0); ctx.scale(f.TW * (f.front ? Math.max(.6, f.fw) : 1), 1);
        for (const y of [f.ty + 17.4, f.ty + 20.2]) { ctx.strokeStyle = C(L.m_b); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(-9, y); ctx.quadraticCurveTo(0, y + 1.5, 9, y); ctx.stroke(); } // lames
        if (DET()) { ctx.fillStyle = 'rgba(255,255,255,.5)'; ell(4, f.ty + 6, 2.6, 5, -.25); ctx.fill(); } // the shine
        ctx.strokeStyle = C(L.m_c); ctx.lineWidth = .55; ctx.beginPath(); // silver-leaf filigree: a vine curling out each side, with leaves
        for (const d of [-1, 1]) { ctx.moveTo(0, f.ty + 15.4); ctx.bezierCurveTo(d * 3, f.ty + 12, d * 7, f.ty + 14, d * 6.6, f.ty + 9); ctx.bezierCurveTo(d * 6.2, f.ty + 6, d * 3.4, f.ty + 6.4, d * 4, f.ty + 8.4); }
        ctx.stroke(); ctx.fillStyle = C(L.m_c);
        for (const d of [-1, 1]) for (const [x, y, a] of [[4.4, 12.8, .6], [7, 11.4, -.4], [5.6, 6.8, 1.2], [2, 14.4, -.8]]) { ell(d * x, f.ty + y, 1.1, .5, d * a); ctx.fill(); }
        ctx.strokeStyle = C(shade(L.m_b, -.2)); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(0, f.ty + 1); ctx.lineTo(0, f.ty + 15); ctx.stroke(); // the ridge down the middle
        ctx.restore();
      });
      K.torsoPath(f.ty, f.HIP); outline(1.1);
      frontFrame(f, () => { // a crescent moon at the breast
        ctx.save(); glowOn('#D8E4FF', 4); ctx.fillStyle = C(L.m_c); ctx.beginPath(); ctx.arc(-.4, f.ty + 5.4, 2.5, .6, Math.PI * 2 - .6, false); ctx.arc(.9, f.ty + 5.4, 2, Math.PI * 2 - .9, .9, true); ctx.closePath(); ctx.fill(); ctx.restore();
        ctx.beginPath(); ctx.arc(-.4, f.ty + 5.4, 2.5, .6, Math.PI * 2 - .6, false); ctx.arc(.9, f.ty + 5.4, 2, Math.PI * 2 - .9, .9, true); ctx.closePath(); outline(.45);
      });
    },
    neck: neckIn('m_collar'),
  };

  // ================================================= legs =================================================
  // the legs are skinned by CORWIN.legSkin (one outline hip to ankle, thigh color above the knee and shin color below,
  // from skin()); thigh() and shin() only lay the set's own pieces over it
  const thighSeg = () => {}, shinSeg = () => {};
  const legSkin = (a, b) => function (L, far) { return [dk(L[a], far, -.16), dk(L[b], far, -.16)]; };
  // a boot's foot (toe toward +x, the sole on y=0): toe 'round' (a worn shoe-boot), 'square', 'point' (a sabaton)
  function footShape(x, toe) {
    ctx.beginPath(); ctx.moveTo(x - 3.2, -8.4); ctx.lineTo(x - 3.8, -2.4); ctx.lineTo(x - 4.4, 0);
    if (toe === 'point') { ctx.lineTo(x + 8.4, 0); ctx.quadraticCurveTo(x + 6, -3.2, x + 3, -4.4); }
    else if (toe === 'round') { ctx.lineTo(x + 6.2, 0); ctx.quadraticCurveTo(x + 7.6, -3.6, x + 4, -4.4); }
    else { ctx.lineTo(x + 7, 0); ctx.quadraticCurveTo(x + 7.3, -2.8, x + 5, -3.8); }
    ctx.quadraticCurveTo(x + 2.6, -4.6, x + 2.4, -8.4); ctx.closePath();
  }
  function footBase(x, col, toe, isMetal) {
    footShape(x, toe); fill(isMetal ? metal(x + 6, -8, x - 3, 0, col) : col); outline(1.1);
    ctx.fillStyle = C(shade(col, -.55)); ctx.fillRect(x - 4.4, -1.5, toe === 'point' ? 12.4 : 11.4, 1.5);
    if (DET()) { ctx.fillStyle = 'rgba(255,240,220,.38)'; ell(x + 4.4, -2.5, 1.7, .7, -.3); ctx.fill(); }
  }
  const kneeFrame = (x, y, ux, uy, s, fn) => { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(-ux, uy)); ctx.scale(s, s); fn(); ctx.restore(); }; // +y down the leg, +x out the front of the knee
  const wayfarerLegs = {
    skin: legSkin('p_a', 'p_b'),
    thigh(L, ax, ay, bx, by, far, s = 1) { thighSeg(ax, ay, bx, by, L.p_a, far, s); },
    shin(L, ax, ay, bx, by, far, s = 1) { shinSeg(ax, ay, bx, by, L.p_b, far, s); },
    shinDetail(L, ax, ay, bx, by, far, s = 1) { // wool puttees wound round the shin
      ctx.save(); const len = along(ax, ay, bx, by); ctx.scale(1, s);
      ctx.strokeStyle = C(dk(shade(L.p_b, -.35), far)); ctx.lineWidth = .7; ctx.beginPath();
      for (let x = 2; x < len - 1; x += 2.6) { ctx.moveTo(x, -3.2); ctx.lineTo(x + 1.6, 3); }
      ctx.stroke(); ctx.restore();
    },
    knee(L, x, y, ux, uy, far, s = 1) { kneeFrame(x, y, ux, uy, s, () => { rrect(-.4, -3, 4, 5.4, 1.2); fill(dk(L.p_c, far)); outline(.6); if (DET()) { ctx.save(); ctx.setLineDash([.8, .9]); ctx.strokeStyle = shade(L.p_c, .45); ctx.lineWidth = .4; rrect(.3, -2.3, 2.6, 4, .8); ctx.stroke(); ctx.restore(); } }); },
    foot(L, x, far) { footBase(x, dk(L.p_boot, far), 'round'); ctx.strokeStyle = C(L.p_d); ctx.lineWidth = .5; ctx.beginPath(); for (const k of [0, 1.4, 2.8]) { ctx.moveTo(x + .2 + k * .5, -7 + k); ctx.lineTo(x + 2.4 + k * .5, -6.4 + k); } ctx.stroke(); },
  };
  const corsairLegs = {
    skin: legSkin('p_a', 'p_b'),
    thigh(L, ax, ay, bx, by, far, s = 1) { thighSeg(ax, ay, bx, by, L.p_a, far, s); // a cream stripe down the outside of the leg
      ctx.save(); const len = along(ax, ay, bx, by); ctx.strokeStyle = C(dk(L.p_d, far)); ctx.lineWidth = .9 * s; ctx.beginPath(); ctx.moveTo(1, -.6 * s); ctx.lineTo(len - 1, -.4 * s); ctx.stroke(); ctx.restore(); },
    shin(L, ax, ay, bx, by, far, s = 1) { shinSeg(ax, ay, bx, by, L.p_b, far, s); },
    shinDetail(L, ax, ay, bx, by, far, s = 1) { // the sea-boot's wide flared cuff, a brass buckle on its strap
      ctx.save(); const len = along(ax, ay, bx, by); ctx.scale(1, s);
      poly([-1.4, -5.6, 5.4, -4.4, 5.4, 4.4, -1.4, 5.6]); fill(dk(L.p_e || shade(L.p_b, .28), far)); outline(.8);
      ctx.fillStyle = C(dk(shade(L.p_b, -.3), far)); ctx.fillRect(len * .62 - .8, -3.3, 1.6, 6.6);
      ctx.fillStyle = C(dk(L.p_c, far)); ctx.fillRect(len * .62 - 1.1, -3.6, 2.2, 2);
      if (DET()) { ctx.strokeStyle = shade(L.p_b, .45); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(6, -2); ctx.lineTo(len - 1, -1.6); ctx.stroke(); }
      ctx.restore();
    },
    knee() {}, // the boot's cuff rides over the knee
    foot(L, x, far) { footBase(x, dk(L.p_boot, far), 'square'); ctx.fillStyle = C(dk(L.p_c, far)); ctx.fillRect(x + .6, -6, 2.2, 2.2); ctx.fillStyle = C(shade(L.p_boot, -.4)); ctx.fillRect(x - 4.4, -2.9, 3.6, 1.4); },
  };
  const prismLegs = {
    skin: legSkin('p_a', 'p_b'),
    thigh(L, ax, ay, bx, by, far, s = 1) { thighSeg(ax, ay, bx, by, L.p_a, far, s); },
    shin(L, ax, ay, bx, by, far, s = 1) { // a faceted crystal greave
      ctx.save(); const len = along(ax, ay, bx, by); ctx.scale(1, s); const col = dk(L.p_b, far);
      poly([.6, -3.6, len * .5, -3.9, len + .6, -2.6, len + .6, 2.6, len * .5, 3.9, .6, 3.6]); fill(col); outline(1);
      poly([1.4, -3.2, len * .5, -3.5, len * .5, .2, 1.4, .2]); fill(shade(col, .22));
      ctx.restore();
    },
    shinDetail(L, ax, ay, bx, by, far, s = 1) {
      ctx.save(); const len = along(ax, ay, bx, by); ctx.scale(1, s);
      ctx.save(); glowOn(L.p_d, 3); ctx.strokeStyle = C(dk(L.p_d, far)); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(2, -2.6); ctx.lineTo(len * .5, -3.1); ctx.lineTo(len - .4, -1.8); ctx.stroke(); ctx.restore();
      ctx.strokeStyle = C(shade(L.p_b, -.35)); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(len * .5, -3.8); ctx.lineTo(len * .5, 3.8); ctx.stroke();
      ctx.restore();
    },
    knee(L, x, y, ux, uy, far, s = 1) { kneeFrame(x, y, ux, uy, s, () => { poly([-1.4, 0, 1.8, -4.4, 5, 0, 1.8, 4.2]); fill(dk(L.p_c, far)); outline(.7); poly([1.8, -4.4, 5, 0, 1.8, .2]); fill(dk(shade(L.p_c, .3), far)); }); },
    foot(L, x, far) { footBase(x, dk(L.p_boot, far), 'square'); poly([x + 2.4, -4.4, x + 5.4, -4, x + 7, 0, x + 2.6, 0]); fill(dk(L.p_c, far)); outline(.6); },
  };
  const chaosLegs = {
    skin: legSkin('p_a', 'p_b'),
    thigh(L, ax, ay, bx, by, far, s = 1) { thighSeg(ax, ay, bx, by, L.p_a, far, s); // red-lacquered lames across the thigh
      ctx.save(); const len = along(ax, ay, bx, by); ctx.scale(1, s);
      for (const k of [.3, .62]) { rrect(len * k - 1.3, -4.4, 2.6, 8.8, .8); fill(dk(L.p_c, far)); outline(.5); }
      ctx.restore(); },
    shin(L, ax, ay, bx, by, far, s = 1) { ctx.save(); const len = along(ax, ay, bx, by); ctx.scale(1, s); const col = dk(L.p_b, far); // a black plate greave
      poly([.4, -3.8, len + .4, -2.8, len + .8, 2.6, .4, 3.6]); fill(metal(0, -3.8, 0, 3.6, col)); outline(1); ctx.restore(); },
    shinDetail(L, ax, ay, bx, by, far, s = 1) {
      ctx.save(); const len = along(ax, ay, bx, by); ctx.scale(1, s);
      ctx.save(); glowOn(L.p_d, 4); ctx.strokeStyle = C(dk(L.p_d, far)); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(2, -1); ctx.lineTo(len * .4, .6); ctx.lineTo(len * .7, -.8); ctx.lineTo(len - 1, .4); ctx.stroke(); ctx.restore();
      rivet(2.4, -2.4); rivet(len - 1.6, -1.8);
      ctx.restore();
    },
    knee(L, x, y, ux, uy, far, s = 1) { kneeFrame(x, y, ux, uy, s, () => { // a spiked knee cop, an ember at its heart
      poly([-2, -4, 2.4, -4.6, 4.8, -1.4, 9, -2.2, 4.8, 1.2, 3, 4.6, -2, 3.8]); fill(metal(5, -4, -2, 4, dk(L.p_c, far))); outline(.8);
      ctx.save(); glowOn(L.p_d, 4); ctx.fillStyle = C(L.p_d); circle(1.6, 0, .85); ctx.fill(); ctx.restore(); }); },
    foot(L, x, far) { footBase(x, dk(L.p_boot, far), 'point', true); poly([x - 2.8, -8, x + 2.2, -8, x + 3.6, -4.2, x - 3.2, -3.6]); fill(dk(L.p_c, far)); outline(.6); },
  };
  const moonLegs = {
    skin: legSkin('p_a', 'p_b'),
    thigh(L, ax, ay, bx, by, far, s = 1) { thighSeg(ax, ay, bx, by, L.p_a, far, s); // fine mail: rows of little rings
      if (!FINE()) return; ctx.save(); const len = along(ax, ay, bx, by); ctx.scale(1, s); ctx.strokeStyle = shade(L.p_a, far ? .05 : .3); ctx.lineWidth = .35;
      for (let x = 1.5; x < len - 1; x += 1.7) for (let y = -3; y <= 3; y += 1.6) { ctx.beginPath(); ctx.arc(x + (y % 3.2 ? .8 : 0), y, .55, 0, Math.PI); ctx.stroke(); }
      ctx.restore(); },
    shin(L, ax, ay, bx, by, far, s = 1) { ctx.save(); const len = along(ax, ay, bx, by); ctx.scale(1, s); const col = dk(L.p_b, far, -.2); // a moon-silver greave
      ctx.beginPath(); ctx.moveTo(.6, -3.7); ctx.lineTo(len, -2.8); ctx.quadraticCurveTo(len + 1.2, 0, len, 2.8); ctx.lineTo(.6, 3.7); ctx.quadraticCurveTo(-.6, 0, .6, -3.7); ctx.closePath(); fill(metal(0, -3.7, 0, 3.7, col)); outline(1); ctx.restore(); },
    shinDetail(L, ax, ay, bx, by, far, s = 1) {
      ctx.save(); const len = along(ax, ay, bx, by); ctx.scale(1, s);
      ctx.strokeStyle = C(dk(L.p_d, far, -.3)); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(2, 0); ctx.bezierCurveTo(len * .3, -2.6, len * .5, 2.4, len * .75, 0); ctx.stroke();
      ctx.fillStyle = C(dk(L.p_d, far, -.3)); for (const [k, y, a] of [[.3, -1.6, .5], [.55, 1.4, -.5]]) { ell(len * k, y, 1, .45, a); ctx.fill(); }
      if (DET()) { ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(3, -2.4); ctx.lineTo(len - 2, -2); ctx.stroke(); }
      ctx.restore();
    },
    knee(L, x, y, ux, uy, far, s = 1) { kneeFrame(x, y, ux, uy, s, () => { // a round cop with a filigree ring, a smaller lame under it
      ell(1.6, 3.2, 2.6, 1.8); fill(metal(3, 1.6, 0, 5, dk(L.p_c, far, -.2))); outline(.6);
      circle(1.8, -.4, 3.4); fill(metal(4, -3.6, -1, 3, dk(L.p_c, far, -.2))); outline(.8);
      ctx.strokeStyle = C(dk(L.p_b, far, -.3)); ctx.lineWidth = .45; ctx.beginPath(); ctx.arc(1.8, -.4, 2, 0, TAU); ctx.stroke(); }); },
    foot(L, x, far) { footBase(x, dk(L.p_boot, far, -.2), 'point', true); ctx.strokeStyle = C(shade(L.p_boot, -.35)); ctx.lineWidth = .5; ctx.beginPath(); for (const k of [1.5, 3.5, 5.5]) { ctx.moveTo(x + k - .4, -4.4 + k * .1); ctx.lineTo(x + k + .6, -.6); } ctx.stroke(); },
  };

  // ================================================= arms =================================================
  // a forearm plate shaped like his vambrace, in the set's color (metal shaded, or flat for leather and glass)
  function bracer(ax, ay, bx, by, col, isMetal) {
    const len = along(ax, ay, bx, by);
    ctx.beginPath(); ctx.moveTo(1.6, -3.1); ctx.lineTo(len - .4, -2.5); ctx.quadraticCurveTo(len + .9, 0, len - .4, 2.5); ctx.lineTo(1.6, 3.1); ctx.quadraticCurveTo(.2, 0, 1.6, -3.1); ctx.closePath();
    fill(isMetal ? metal(0, -3.1, 0, 3.1, col) : (() => { const g = ctx.createLinearGradient(0, -3.1, 0, 3.1); g.addColorStop(0, C(shade(col, .25))); g.addColorStop(.5, C(col)); g.addColorStop(1, C(shade(col, -.3))); return g; })()); outline(1);
    return len;
  }
  // the arms are skinned by CORWIN.arm (one sleeve from shoulder to wrist, in skin()'s color); sleeve() lays its folds
  // on it and fore() the set's bracer down the forearm. The shirt gathers at the elbow in a fold, not a ball.
  const elbowPuff = (ax, ay, col, far) => { if (FINE()) { ctx.strokeStyle = shade(dk(col, far, -.24), -.35); ctx.lineWidth = .6; ctx.beginPath(); ctx.arc(ax, ay, 2.2, 0, Math.PI * .9); ctx.stroke(); } };
  const armSkin = function (L, far) { return dk(L.g_sleeve, far, -.24); }, W = CORWIN.ARMW, wide = (k) => W.map((v, i) => i === 3 || i === 6 ? v : v * k); // (3 and 6 are where the swells sit)
  const sleeveSeg = (L, ax, ay, bx, by, far) => { const col = dk(L.g_sleeve, far, -.24);
    if (FINE()) { ctx.save(); const len = along(ax, ay, bx, by); ctx.strokeStyle = shade(col, -.3); ctx.lineWidth = .6; ctx.beginPath(); for (const k of [.35, .62]) { ctx.moveTo(len * k, -3.6); ctx.quadraticCurveTo(len * k + 1.6, 0, len * k - .4, 3.6); } ctx.stroke(); ctx.restore(); } };
  const pauldronFrame = (x, y, ang, s, fn) => { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s); fn(); ctx.restore(); };
  const wayfarerArms = {
    skin: armSkin,
    sleeve(L, ax, ay, bx, by, far) { sleeveSeg(L, ax, ay, bx, by, far); },
    fore(L, ax, ay, bx, by, far) { // a laced leather bracer, cloth wound at the wrist
      ctx.save(); const len = bracer(ax, ay, bx, by, dk(L.g_a, far, -.22));
      ctx.strokeStyle = C(dk(L.g_c, far)); ctx.lineWidth = .8; ctx.beginPath(); for (const x of [len - 3.4, len - 2]) { ctx.moveTo(x - .6, -2.8); ctx.lineTo(x + .6, 2.8); } ctx.stroke();
      ctx.strokeStyle = C(shade(L.g_a, -.45)); ctx.lineWidth = .5; ctx.beginPath(); for (let x = 3; x < len - 5; x += 2) { ctx.moveTo(x, -1.4); ctx.lineTo(x + 1, 1.4); ctx.moveTo(x + 1, -1.4); ctx.lineTo(x, 1.4); } ctx.stroke(); // the lacing
      ctx.restore(); elbowPuff(ax, ay, L.g_sleeve, far);
    },
    pauldron(L, x, y, ang, far, s = 1) { pauldronFrame(x, y, ang, s, () => { // a small cap of boiled leather
      const col = dk(L.g_pau, far, -.24);
      ctx.beginPath(); ctx.ellipse(0, 1, 6.4, 4.6, 0, Math.PI * 1.02, TAU - .02); ctx.ellipse(0, 1, 6.4, 1.6, 0, 0, Math.PI); ctx.closePath(); fill(col); outline(1);
      if (DET()) { ctx.save(); ctx.setLineDash([.9, 1]); ctx.strokeStyle = shade(col, .5); ctx.lineWidth = .5; ctx.beginPath(); ctx.ellipse(0, 1, 5, 3.4, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); ctx.restore(); } }); },
  };
  const corsairArms = {
    skin: armSkin,
    armW: wide(1.1),
    sleeve(L, ax, ay, bx, by, far) { sleeveSeg(L, ax, ay, bx, by, far); }, // a full cream shirt sleeve
    fore(L, ax, ay, bx, by, far) { // a leather gauntlet with a flared brass cuff and studs
      ctx.save(); const len = bracer(ax, ay, bx, by, dk(L.g_a, far, -.22));
      ctx.fillStyle = C(dk(L.g_c, far)); for (const x of [4, 7, 10]) if (x < len - 4) { circle(x, -1.2, .55); ctx.fill(); circle(x + 1.4, 1.2, .55); ctx.fill(); }
      poly([len - 4.2, -3.2, len + .6, -4.6, len + .6, 4.6, len - 4.2, 3.2]); fill(metal(0, -4.6, 0, 4.6, dk(L.g_c, far))); outline(.8);
      ctx.restore(); elbowPuff(ax, ay, L.g_sleeve, far);
    },
    pauldron(L, x, y, ang, far, s = 1) { pauldronFrame(x, y, ang, s, () => { // a round brass plate, studded
      const col = dk(L.g_pau, far, -.24);
      ctx.beginPath(); ctx.ellipse(0, .6, 7.6, 5.8, 0, Math.PI, TAU); ctx.ellipse(0, .6, 7.6, 2.2, 0, 0, Math.PI); ctx.closePath(); fill(metal(3, -5, -3, 3, col)); outline(1.1);
      ctx.strokeStyle = C(shade(col, -.4)); ctx.lineWidth = .6; ctx.beginPath(); ctx.ellipse(0, .6, 6.2, 4.4, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      for (const [px, py] of [[-5, -.4], [-2.4, -3.6], [1.4, -4.2], [4.6, -2.2]]) rivet(px, py, .6); }); },
  };
  const prismArms = {
    skin: armSkin,
    sleeve(L, ax, ay, bx, by, far) { sleeveSeg(L, ax, ay, bx, by, far); },
    fore(L, ax, ay, bx, by, far) { // a vambrace cut from violet crystal, a cyan ridge of light along it
      ctx.save(); const len = along(ax, ay, bx, by), col = dk(L.g_a, far, -.22);
      poly([1, -3.4, len * .55, -4.2, len + .6, -2.6, len + .6, 2.6, len * .55, 3.6, 1, 3.2]); fill(col); outline(1);
      poly([1.6, -3, len * .55, -3.8, len * .55, -.4, 1.6, -.4]); fill(shade(col, .25));
      ctx.save(); glowOn(L.g_c, 4); ctx.strokeStyle = C(dk(L.g_c, far)); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(2, -.4); ctx.lineTo(len - .6, -.2); ctx.stroke(); ctx.restore();
      ctx.restore(); elbowPuff(ax, ay, L.g_sleeve, far);
    },
    pauldron(L, x, y, ang, far, s = 1) { pauldronFrame(x, y, ang, s, () => { // shards of crystal standing up off the shoulder
      const col = dk(L.g_pau, far, -.24);
      for (const [pts, k] of [[[-7, 2.4, -5.6, -3.6, -1, -5, 0, 2], -.12], [[-1.6, 2.2, .4, -7, 6, -3.4, 6.6, 2.2], .16]]) { poly(pts); fill(shade(col, k)); outline(.9); }
      ctx.save(); glowOn(L.g_c, 3); ctx.strokeStyle = C(L.g_c); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(.6, -6.2); ctx.lineTo(5.2, -3.2); ctx.stroke(); ctx.restore(); }); },
  };
  const chaosArms = {
    skin: armSkin,
    sleeve(L, ax, ay, bx, by, far) { sleeveSeg(L, ax, ay, bx, by, far); },
    fore(L, ax, ay, bx, by, far) { // a black talon-gauntlet: red plates, a fin standing off the forearm, an ember seam
      ctx.save(); const len = bracer(ax, ay, bx, by, dk(L.g_a, far, -.22), true);
      poly([len * .3, -3, len * .5, -6.6, len * .72, -2.8]); fill(dk(L.g_c, far)); outline(.7);
      rrect(len * .2, -1.2, len * .55, 2.4, .8); fill(dk(L.g_c, far));
      ctx.save(); glowOn(L.g_d, 4); ctx.strokeStyle = C(L.g_d); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(len * .22, 0); ctx.lineTo(len * .74, 0); ctx.stroke(); ctx.restore();
      ctx.restore(); elbowPuff(ax, ay, L.g_sleeve, far);
    },
    pauldron(L, x, y, ang, far, s = 1) { pauldronFrame(x, y, ang, s, () => { // a heavy black pauldron with two spikes and an ember rim
      const col = dk(L.g_pau, far, -.24);
      for (const [px, h] of [[-3.4, 7.6], [2.2, 6]]) { poly([px - 2, -3.4, px + .8, -3.4 - h, px + 2.4, -3.8]); fill(shade(L.g_c, -.1)); outline(.8); }
      ctx.beginPath(); ctx.ellipse(0, .6, 8.4, 6.2, 0, Math.PI, TAU); ctx.ellipse(0, .6, 8.4, 2.6, 0, 0, Math.PI); ctx.closePath(); fill(metal(3, -5, -3, 3, col)); outline(1.2);
      ctx.save(); glowOn(L.g_d, 4); ctx.strokeStyle = C(L.g_d); ctx.lineWidth = .7; ctx.beginPath(); ctx.ellipse(0, .6, 7, 4.8, 0, Math.PI * 1.06, Math.PI * 1.94); ctx.stroke(); ctx.restore();
      ctx.fillStyle = C(L.g_c); ctx.fillRect(-5, 1.2, 10, 1.4); }); },
  };
  const moonArms = {
    skin: armSkin,
    sleeve(L, ax, ay, bx, by, far) { const col = dk(L.g_sleeve, far, -.24); // fine mail
      if (FINE()) { ctx.save(); const len = along(ax, ay, bx, by); ctx.strokeStyle = shade(col, .32); ctx.lineWidth = .35; for (let x = 1.5; x < len - 1; x += 1.6) for (let y = -2.6; y <= 2.6; y += 1.5) { ctx.beginPath(); ctx.arc(x, y, .5, 0, Math.PI); ctx.stroke(); } ctx.restore(); } },
    fore(L, ax, ay, bx, by, far) { // a moon-silver vambrace chased with a leaf
      ctx.save(); const len = bracer(ax, ay, bx, by, dk(L.g_a, far, -.22), true);
      ctx.strokeStyle = C(dk(L.g_c, far)); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(2.4, 1); ctx.bezierCurveTo(len * .35, -2.4, len * .55, 2.2, len * .8, -.4); ctx.stroke();
      ctx.fillStyle = C(dk(L.g_c, far)); ell(len * .35, -1.1, .9, .4, .5); ctx.fill(); ell(len * .6, 1, .9, .4, -.5); ctx.fill();
      if (DET()) { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(3, -2); ctx.lineTo(len - 2, -1.6); ctx.stroke(); }
      ctx.restore(); elbowPuff(ax, ay, L.g_sleeve, far);
    },
    pauldron(L, x, y, ang, far, s = 1) { pauldronFrame(x, y, ang, s, () => { // three moon-silver lames under a domed cap, filigree on the cap
      const col = dk(L.g_pau, far, -.24);
      const lame = (cy, rx, ry) => { ctx.beginPath(); ctx.ellipse(0, cy, rx, ry, 0, 0, Math.PI); ctx.lineTo(-rx, cy - .6); ctx.lineTo(rx, cy - .6); ctx.closePath(); fill(metal(0, cy - 1, 0, cy + ry, col)); outline(.9); };
      lame(5.4, 5, 3); lame(3.6, 5.9, 3.2); lame(1.8, 6.8, 3.2);
      ctx.beginPath(); ctx.ellipse(0, .4, 7.8, 6, 0, Math.PI, TAU); ctx.ellipse(0, .4, 7.8, 1.8, 0, 0, Math.PI); ctx.closePath(); fill(metal(3, -5, -3, 2, col)); outline(1.1);
      ctx.strokeStyle = C(dk(L.g_c, far)); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(-5, -.6); ctx.bezierCurveTo(-3, -5, 2, -5.4, 4.6, -2.2); ctx.moveTo(-1, -4.2); ctx.quadraticCurveTo(0, -2.2, 1.6, -2.6); ctx.stroke();
      if (DET()) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ell(2.6, -3, 2.4, .8, -.35); ctx.fill(); } }); },
  };

  // ================================================= waist =================================================
  // a band round his waist (yOf: its height at each angle round him), only the side toward us
  function band(g, yOf, r, w, col, deco) {
    const a0 = Math.atan2(g.CS, g.Y), pts = [];
    for (let i = 0; i <= 10; i++) { const th = a0 - Math.PI / 2 + Math.PI * i / 10, [x] = ring(g, r, th); pts.push([x, yOf(th)]); }
    const path = () => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); };
    ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
    path(); ctx.strokeStyle = FLASH ? '#FFFFFF' : INK; ctx.lineWidth = w + 1.8 * OUTK; ctx.stroke();
    path(); ctx.strokeStyle = C(col); ctx.lineWidth = w; ctx.stroke();
    if (DET()) { ctx.save(); ctx.translate(0, -w * .3); path(); ctx.strokeStyle = shade(col, .3); ctx.lineWidth = .6; ctx.stroke(); ctx.restore(); }
    if (deco) for (let i = 0; i < pts.length - 1; i++) deco(pts[i], pts[i + 1], i);
  }
  const sling = (g) => (th) => g.HIP + 2 - 2.4 * Math.sin(th);
  const atFront = (g, r, th = 0) => ring(g, r, th); // [x, depth]: depth > .5 when it faces us
  // tabs hanging from the waist round his hips, the furthest first (lo..hi: their length; draw: how each one is painted)
  function tabs(g, n, len, paint) {
    const a0 = Math.atan2(g.CS, g.Y), list = [];
    for (let k = 0; k < n; k++) { const th = k / n * TAU + Math.PI / n, d = Math.cos(th - a0); if (d > .08) list.push([d, th]); }
    list.sort((a, b) => a[0] - b[0]);
    const swing = clamp(g.sw * 1.2, -1.5, 1.5);
    for (const [d, th] of list) {
      const [x0] = ring(g, 8, th - .42), [x1] = ring(g, 8, th + .42), [x2] = ring(g, 9.6, th + .44), [x3] = ring(g, 9.6, th - .44), y0 = g.HIP + .4, y1 = g.HIP + len - (1 - d) * 1.2, sx = swing * Math.cos(th);
      paint(x0, x1, x2 + sx, x3 + sx, y0, y1, d);
    }
  }
  const scabbard = D.waist.swordbelt.scabbard; // his own sword and scabbard, with every belt
  const wayfarerWaist = {
    belts(L, g) {
      const H = g.HIP;
      band(g, () => H - 1.6, 7.9, 3, L.w_a, ([xa, ya], [xb, yb], i) => { if (!DET()) return; ctx.strokeStyle = shade(L.w_a, -.35); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(xa, ya - 1.4); ctx.lineTo((xa + xb) / 2, ya + 1.4); ctx.stroke(); }); // a twisted rope
      band(g, sling(g), 8.3, 2, L.w_b);
      const [px, d] = atFront(g, 8.6, .9); // a pouch on his near hip
      if (d > .3) { rrect(px - 2.6, H, 5.2, 5.4, 1.4); fill(L.w_c); outline(.8); poly([px - 2.8, H - .2, px + 2.8, H - .2, px + 2.4, H + 2.2, px - 2.4, H + 2.2]); fill(shade(L.w_c, .2)); outline(.6); ctx.fillStyle = C(L.w_d); circle(px, H + 1.6, .6); ctx.fill(); }
      const [kx, kd] = atFront(g, 7.9, -.2); if (kd > .5) { ell(kx, H - 1.6, 1.8, 1.6); fill(shade(L.w_a, -.1)); outline(.6); } // the knot
    },
    scabbard,
  };
  const corsairWaist = {
    belts(L, g) {
      const H = g.HIP;
      const [kx, kd] = atFront(g, 8.2, -.5); // the knot's two tails, hanging over the far hip
      if (kd > .3) for (const [dx, len, k] of [[-1, 9, -.16], [1.2, 7, 0]]) { poly([kx + dx - 1.4, H, kx + dx + 1.4, H, kx + dx + 2, H + len, kx + dx + .2, H + len - 1.4, kx + dx - 1.6, H + len]); fill(shade(L.w_a, k)); outline(.6); }
      band(g, () => H - 1.8, 8, 4.6, L.w_a, ([xa, ya], [xb, yb]) => { if (!DET()) return; ctx.strokeStyle = shade(L.w_a, -.35); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(xa, ya - .6); ctx.lineTo(xb, yb + .4); ctx.stroke(); }); // a wide crimson sash
      if (kd > .3) { ell(kx, H - 1.6, 2.2, 2.2); fill(shade(L.w_a, .12)); outline(.6); }
      band(g, sling(g), 8.4, 2.2, '#3A2418');
      const [bx, bd] = atFront(g, 8.4, .55); if (bd > .5) { rrect(bx - 1.4, sling(g)(.55) - 1.6, 2.8, 3.2, .5); fill(L.w_c); outline(.7); }
    },
    scabbard,
  };
  const prismWaist = {
    belts(L, g) {
      const H = g.HIP;
      tabs(g, 6, 7.6, (x0, x1, x2, x3, y0, y1, d) => { poly([x0, y0, x1, y0, (x1 + x2) / 2 + .6, y1, (x0 + x3) / 2 - .6, y1]); fill(shade(L.w_d, -.1 + d * .3)); outline(.7); // glass tabs, pointed
        ctx.strokeStyle = C(L.w_c); ctx.lineWidth = .45; ctx.beginPath(); ctx.moveTo((x0 + x1) / 2, y0 + 1); ctx.lineTo(((x0 + x3) + (x1 + x2)) / 4, y1 - 1); ctx.stroke(); });
      band(g, () => H - 1.6, 7.9, 3.2, L.w_a, ([xa, ya], [xb, yb]) => { if (!DET()) return; ctx.strokeStyle = shade(L.w_a, -.25); ctx.lineWidth = .4; ctx.beginPath(); ctx.moveTo(xa, ya - .7); ctx.lineTo(xb, yb - .7); ctx.moveTo(xa, ya + .7); ctx.lineTo(xb, yb + .7); ctx.stroke(); }); // a sash woven of pale light
      band(g, sling(g), 8.3, 2, L.w_b);
      const [cx, cd] = atFront(g, 7.9, .1); if (cd > .5) { const pts = [cx - 2, H - 1.6, cx, H - 4.8, cx + 2, H - 1.6, cx, H + 1.6]; ctx.save(); glowOn(L.w_c, 5); poly(pts); fill(L.w_c); ctx.restore(); poly(pts); outline(.6); } // the crystal clasp
    },
    scabbard,
  };
  const chaosWaist = {
    belts(L, g) {
      const H = g.HIP;
      tabs(g, 4, 9, (x0, x1, x2, x3, y0, y1, d) => { const xm = (x2 + x3) / 2; poly([x0, y0, x1, y0, x2, y1 - 2, xm + (x2 - x3) * .15, y1 - .6, xm, y1 + 1.2, xm - (x2 - x3) * .15, y1 - .6, x3, y1 - 2]); fill(metal(x1, y0, x0, y1, shade(L.w_b, d * .3))); outline(.8); // jagged black tassets
        ctx.strokeStyle = C(L.w_c); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(x0 + (x1 - x0) * .15, y0 + .8); ctx.lineTo(x3 + (x2 - x3) * .15, y1 - 2.4); ctx.moveTo(x1 - (x1 - x0) * .15, y0 + .8); ctx.lineTo(x2 - (x2 - x3) * .15, y1 - 2.4); ctx.stroke(); });
      band(g, () => H - 1.6, 7.9, 2.6, shade(L.w_a, -.3), ([xa, ya], [xb, yb], i) => { ell((xa + xb) / 2, (ya + yb) / 2, Math.max(.6, Math.abs(xb - xa) * .55), 1.2); ctx.strokeStyle = C(L.w_a); ctx.lineWidth = .8; ctx.stroke(); }); // a girdle of chain
      band(g, sling(g), 8.3, 2, L.w_b);
      const [px, pd] = atFront(g, 7.9, .1); if (pd > .5) { poly([px - 2.8, H - 4, px + 2.8, H - 4, px + 3.2, H + .6, px, H + 2.6, px - 3.2, H + .6]); fill(metal(px + 3, H - 4, px - 3, H + 2, L.w_c)); outline(.8); ctx.save(); glowOn(L.w_d, 5); ctx.fillStyle = C(L.w_d); circle(px, H - 1, .95); ctx.fill(); ctx.restore(); }
    },
    scabbard,
  };
  const moonWaist = {
    belts(L, g) {
      const H = g.HIP;
      tabs(g, 6, 7.4, (x0, x1, x2, x3, y0, y1, d) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x2, y1 - 1); ctx.quadraticCurveTo((x2 + x3) / 2, y1 + 1.4, x3, y1 - 1); ctx.closePath(); fill(metal(x1, y0, x0, y1, shade(L.w_a, -.12 + d * .14))); outline(.7); // rounded silver tassets
        ctx.strokeStyle = C(L.w_b); ctx.lineWidth = .45; ctx.beginPath(); ctx.moveTo(x0 + (x1 - x0) * .2, y0 + 1); ctx.quadraticCurveTo((x0 + x1 + x2 + x3) / 4, y1 - 3, x1 - (x1 - x0) * .2, y0 + 1); ctx.stroke(); });
      band(g, () => H - 1.6, 7.9, 3.2, L.w_a);
      band(g, sling(g), 8.3, 1.8, L.w_b);
      const [cx, cd] = atFront(g, 7.9, .1); if (cd > .5) { // a crescent clasp set with a moonstone
        ctx.fillStyle = C(L.w_c); ctx.beginPath(); ctx.arc(cx, H - 1.6, 2.6, .7, Math.PI * 2 - .7); ctx.arc(cx + 1.2, H - 1.6, 2, Math.PI * 2 - 1, 1, true); ctx.closePath(); ctx.fill(); outline(.5);
        ctx.save(); glowOn(L.w_d, 5); ctx.fillStyle = C(L.w_d); circle(cx - .6, H - 1.6, .9); ctx.fill(); ctx.restore(); }
    },
    scabbard,
  };

  Object.assign(D.mail, { wayfarerMail, corsairMail, prismMail, chaosMail, moonMail });
  Object.assign(D.pants, { wayfarerLegs, corsairLegs, prismLegs, chaosLegs, moonLegs });
  Object.assign(D.gauntlets, { wayfarerArms, corsairArms, prismArms, chaosArms, moonArms });
  Object.assign(D.waist, { wayfarerWaist, corsairWaist, prismWaist, chaosWaist, moonWaist });
})();

// ---------- an enchanted piece on him: a faint gold-violet glow and three motes circling slowly ----------
// (painted on the page behind the inked figure; it never flickers, it only drifts)
function drawGearAura(t, front) {
  if (!P || P.state === 'dead' || !heroLook().enchanted) return;
  const cy = P.y - P.z - 40;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  if (!front) { const g = ctx.createRadialGradient(P.x, cy, 4, P.x, cy, 50); g.addColorStop(0, 'rgba(240,200,110,.3)'); g.addColorStop(.55, 'rgba(184,140,255,.18)'); g.addColorStop(1, 'rgba(184,140,255,0)');
    ctx.fillStyle = g; ell(P.x, cy, 32, 50); ctx.fill(); }
  for (let i = 0; i < 3; i++) { // each mote passes in front of him for half its circle and behind him for the other half
    const a = t * .9 + i * TAU / 3; if ((Math.sin(a) > 0) !== !!front) continue;
    const x = P.x + Math.cos(a) * 18, y = cy + 4 + Math.sin(a * 1.3 + i) * 24;
    const mg = ctx.createRadialGradient(x, y, 0, x, y, 4.2); mg.addColorStop(0, i === 1 ? 'rgba(220,190,255,1)' : 'rgba(255,232,160,1)'); mg.addColorStop(.4, i === 1 ? 'rgba(184,140,255,.6)' : 'rgba(240,200,110,.6)'); mg.addColorStop(1, 'rgba(184,140,255,0)');
    ctx.fillStyle = mg; circle(x, y, 4.2); ctx.fill();
  }
  ctx.restore();
}

// ---------- a piece on its own (inventory cells, loot on the floor), drawn with the same parts, in a 64 x 64 box ----------
function drawGearPiece(it) {
  const L = buildHeroLook({ [it.slot]: it }), CW = CORWIN, part = CW.PART(it.slot, L);
  const G = { Y: .82, CS: Math.sqrt(1 - .82 * .82), HIP: -37.2, SHO: -59.2, NECK: -62.8, HX: 0, LEAN: 0, walk: 0, sw: 0, gait: 0, BACK: false, pose: {}, t: 0 };
  G.PX = (fx, lz) => fx * G.CS - lz * G.Y;
  ctx.save(); ctx.translate(32, 32);
  if (it.slot === 'mail') { ctx.scale(1.75, 1.75); ctx.translate(0, 48); part.torso(L, G); }
  else if (it.slot === 'waist') { ctx.scale(2.2, 2.2); ctx.translate(0, 35.4); part.belts(L, G); }
  else if (it.slot === 'pants') { ctx.scale(1.55, 1.55); ctx.translate(-1, 15.5);
    for (const [x, f, far] of [[-4, -4, true], [4, 4, false]]) CW.leg(L, x, -30, x + f * .5 + 1, -15, x + f - .6, -8, x + f, 0, 0, 1, far, 1); }
  else { ctx.rotate(-.55); ctx.scale(1.5, 1.5); ctx.translate(-14, 2); // gauntlet: shoulder guard, sleeve, forearm and fist
    CW.arm(L, -6, 0, 3, .4, 18, 0, false);
    HAND_PLATE = !!L.gauntPlate; ctx.save(); ctx.translate(18 - 13, 0); drawHand(L.glove, false); ctx.restore(); HAND_PLATE = false;
    part.pauldron(L, -6, -1.4, 0, false, .7); }
  ctx.restore();
}
// a little four-pointed glint: the mark of an enchanted piece (gold, ringed in violet)
function drawGlint(x, y, s) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, s * 2.2); g.addColorStop(0, 'rgba(255,230,160,.9)'); g.addColorStop(.45, 'rgba(184,140,255,.45)'); g.addColorStop(1, 'rgba(184,140,255,0)');
  ctx.fillStyle = g; circle(x, y, s * 2.2); ctx.fill();
  ctx.fillStyle = '#FFF0C0'; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU - Math.PI / 2, r = i % 2 ? s * .35 : s * 1.6; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); ctx.fill();
  ctx.restore();
}
const TIER_GLOW = [null, '226,206,160', '140,220,160', '150,180,255', '255,130,70', '232,240,255'];
function drawGearLoot(k, t) { // on the floor: the piece itself standing in a glow of its tier's color, a ring of violet if enchanted
  const it = k.item, x = k.x, y = k.y - k.z - 18 - Math.sin(t * 3 + k.x) * 1.5, rgb = TIER_GLOW[it.set], en = it.ench.length;
  shadow(k.x, k.y, 8);
  onPage(() => { ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 2, x, y, 24); g.addColorStop(0, `rgba(${rgb},.5)`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; circle(x, y, 24); ctx.fill();
    const fg = ctx.createRadialGradient(k.x, k.y, 1, k.x, k.y, 18); fg.addColorStop(0, `rgba(${rgb},.45)`); fg.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = fg; ell(k.x, k.y, 18, 5); ctx.fill(); // its light on the floor
    if (en) { ctx.strokeStyle = 'rgba(214,170,255,.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(k.x, k.y, 14, 3.6, 0, 0, TAU); ctx.stroke(); }
    ctx.restore(); });
  ctx.save(); ctx.translate(x, y); ctx.scale(.4, .4); ctx.translate(-32, -32); drawGearPiece(it); ctx.restore();
  if (en) onPage(() => drawGlint(x + 10, y - 10, 2.6));
}
// a piece's portrait on a small canvas (inventory cells)
function drawGearIcon(canvas, it) {
  const g = canvas.getContext('2d'), old = ctx; ctx = g;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, canvas.width, canvas.height);
  if (!it) { ctx = old; return; }
  const s = canvas.width / 64; g.setTransform(s, 0, 0, s, 0, 0);
  try { drawGearPiece(it); } finally { ctx = old; }
  paintCard(canvas, s * .7);
  if (it.ench.length) { const o = ctx; ctx = g; g.setTransform(s, 0, 0, s, 0, 0); drawGlint(53, 11, 3.6); ctx = o; }
}
