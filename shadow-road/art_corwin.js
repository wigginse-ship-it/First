'use strict';
// ---------- the Prince of Shadow: his costume, piece by piece, and his cloak ----------
// After the reference sheet: a black doublet quilted in a diamond lattice over a white shirt, and a
// high collar, steel pauldrons, vambraces and knee cops, crossed sword belts with a scabbard at the left hip, tall
// buckled boots, and over it all a great black cloak painted in dry, ragged brushstrokes, pinned at the throat with a
// silver rose on a short chain.
// Every piece is drawn by its own function from a flat palette (the look: strings only, so a greyed copy of it greys
// every piece), and the piece is picked by the look's slot names, so gear can swap one later:
//   CORWIN.parts.mail[look.mail]       the torso and its collar
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
  const metal = (x0, y0, x1, y1, col) => { // polished steel, as in the sheet's armor detail: a hot white highlight where it
    // faces the light, the plain metal, a dark reflection of the ground across its turn, and warm light thrown back at its far edge
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, C(shade(col, .62))); g.addColorStop(.16, C(shade(col, .3))); g.addColorStop(.38, C(col)); g.addColorStop(.58, C(shade(col, -.58)));
    g.addColorStop(.76, C(shade(col, -.3))); g.addColorStop(.9, C(TINT || FLASH ? col : mixC(col, '#B08A5A', .3))); g.addColorStop(1, C(shade(col, -.2)));
    return g;
  };
  const mixC = (a, b, k) => { const p = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)], A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
  const rivet = (x, y, r = .55) => { ctx.fillStyle = C('#2A2C34'); circle(x, y, r); ctx.fill(); if (DET()) { ctx.fillStyle = 'rgba(255,255,255,.85)'; circle(x - r * .3, y - r * .3, r * .42); ctx.fill(); } };
  const glint = (x0, y0, x1, y1, w = .7, a = .9) => { if (!DET()) return; ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore(); }; // a specular streak
  // shading laid only over what is already painted of him (his own layer, paint.js): cast shadows, core shadows
  const atop = (fn) => { if (!DET() || typeof heroG === 'undefined' || ctx !== heroG) return; ctx.save(); ctx.globalCompositeOperation = 'source-atop'; fn(); ctx.restore(); };
  // a frame along a segment: origin at A, +x toward B, +y across it
  const along = (ax, ay, bx, by) => { ctx.translate(ax, ay); ctx.rotate(Math.atan2(by - ay, bx - ax)); return Math.hypot(bx - ax, by - ay); };

  // ======================================================== legs ========================================================
  const trousers = {
    skin(L, far) { return [far ? shade(L.legs, -.16) : L.legs, far ? shade(L.boots, -.16) : L.boots]; }, // dark breeches above the knee, the shaft of a tall riding boot below
    thigh(L, ax, ay, bx, by, far, s = 1) { // loose cloth: a couple of soft creases pulling toward the knee
      if (!FINE()) return; ctx.save(); const len = along(ax, ay, bx, by); ctx.scale(1, s); ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(6,4,10,.55)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(len * .25, -3.6); ctx.quadraticCurveTo(len * .55, -1, len * .9, -2.2); ctx.moveTo(len * .35, 3.4); ctx.quadraticCurveTo(len * .6, 1.4, len * .92, 2.2); ctx.stroke();
      ctx.strokeStyle = shade(far ? shade(L.legs, -.16) : L.legs, .35); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(len * .3, -2.6); ctx.quadraticCurveTo(len * .55, -.4, len * .85, -1.4); ctx.stroke();
      ctx.restore();
    },
    shin() {},
    shinDetail(L, ax, ay, bx, by, far, s = 1) { // the boot's turned-down cuff under the knee and two buckled straps
      ctx.save(); const len = along(ax, ay, bx, by); ctx.scale(1, s);
      const cuff = far ? shade(L.cuff, -.16) : L.cuff, bt = far ? shade(L.boots, -.16) : L.boots;
      atop(() => { ctx.fillStyle = 'rgba(10,6,6,.35)'; ctx.fillRect(4.6, -4.2, 2.2, 8.4); }); // the cuff's shadow on the shaft
      ctx.beginPath(); ctx.moveTo(1, -4.6); ctx.lineTo(5.4, -4.3); ctx.lineTo(5, -1.5); ctx.lineTo(5.6, .8); ctx.lineTo(5, 4.3); ctx.lineTo(1, 4.6); ctx.quadraticCurveTo(.2, 0, 1, -4.6); ctx.closePath();
      const cg = ctx.createLinearGradient(0, -4.6, 0, 4.6); cg.addColorStop(0, C(shade(cuff, .3))); cg.addColorStop(.45, C(cuff)); cg.addColorStop(1, C(shade(cuff, -.4))); ctx.fillStyle = cg; ctx.fill(); outline(.7);
      if (DET()) { ctx.strokeStyle = shade(cuff, -.45); ctx.lineWidth = .4; ctx.beginPath(); ctx.moveTo(2.2, -3.4); ctx.lineTo(4.4, -3.2); ctx.moveTo(2.4, 2.6); ctx.lineTo(4.4, 3.4); ctx.stroke(); }
      for (const k of [.5, .78]) { const x = len * k; ctx.fillStyle = C(shade(L.leather, far ? -.45 : -.3)); ctx.fillRect(x - .8, -3.6, 1.6, 7.2);
        ctx.strokeStyle = C(far ? shade(L.brass, -.35) : shade(L.brass, -.1)); ctx.lineWidth = .4; ctx.strokeRect(x - .8, -3.7, 1.6, 1.5); }
      if (DET()) { ctx.strokeStyle = shade(bt, .5); ctx.lineWidth = .65; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(6.6, -2.4); ctx.lineTo(len - 1.6, -1.8); ctx.stroke(); // the shine down the polished shaft
        atop(() => { ctx.fillStyle = 'rgba(8,4,4,.4)'; ctx.fillRect(5, 1.2, len, 3.4); }); }
      ctx.restore();
    },
    knee(L, x, y, ux, uy, far, s = 1) { // a pointed, shield-shaped poleyn, a lame above and below it, a fan at the outer side, riveted
      const CS = (CLOAK_GEO && CLOAK_GEO.CS) ?? 1, col = far ? shade(L.steel, -.2) : L.steel;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(-ux, uy)); ctx.scale(s * .82, s * .82); // +y down the leg, +x out the front of the knee
      const fw = lerp(4.2, 5.8, CS), bw = lerp(4.2, 2.8, CS), o = 1.3 * CS;
      ctx.beginPath(); ctx.ellipse(o - .8, .2, 3 * (.4 + .6 * CS), 3.2, 0, 0, TAU); ctx.fillStyle = metal(o + 2, -3, o - 3, 3, shade(col, -.15)); ctx.fill(); outline(.7); // the fan
      for (const [cy, h] of [[-5.6, 2.2], [5.2, 2.4]]) { ctx.beginPath(); ctx.moveTo(o - bw * .85, cy - h / 2); ctx.lineTo(o + fw * .85, cy - h / 2); ctx.quadraticCurveTo(o + fw * .95, cy, o + fw * .8, cy + h / 2); ctx.lineTo(o - bw * .8, cy + h / 2); ctx.closePath(); ctx.fillStyle = metal(o + fw, cy - h, o - bw, cy + h, col); ctx.fill(); outline(.65); }
      const sh = () => { ctx.beginPath(); ctx.moveTo(o - bw, -4.6); ctx.quadraticCurveTo(o + (fw - bw) / 2, -5.4, o + fw, -4.6); ctx.quadraticCurveTo(o + fw * 1.02, .6, o + fw * .3, 4.4); ctx.lineTo(o, 5.6); ctx.lineTo(o - bw * .3, 4.4); ctx.quadraticCurveTo(o - bw * 1.02, .6, o - bw, -4.6); ctx.closePath(); };
      sh(); ctx.fillStyle = metal(o + fw, -4.6, o - bw, 5, col); ctx.fill(); outline(.8);
      if (DET()) { ctx.strokeStyle = shade(col, .7); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(o + .2, -4.6); ctx.lineTo(o + .3, 5.6); ctx.stroke(); // the ridge, catching the light
        ctx.strokeStyle = 'rgba(20,16,24,.6)'; ctx.beginPath(); ctx.moveTo(o - .3, -4.4); ctx.lineTo(o - .2, 5.4); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.85)'; ell(o + fw * .45, -2.2, .9, 1.8, -.2); ctx.fill(); }
      rivet(o - bw * .6, -3.6, .42); rivet(o + fw * .6, -3.6, .42); rivet(o, 3.4, .42);
      ctx.restore();
    },
    foot(L, x, far) { // the boot's foot: a squared toe, a stacked heel and a buckled strap over the instep
      const bc = far ? shade(L.boots, -.16) : L.boots;
      ctx.beginPath(); ctx.moveTo(x - 3.2, -8.4); ctx.lineTo(x - 3.8, -2.4); ctx.lineTo(x - 4.4, 0); ctx.lineTo(x + 7, 0); ctx.quadraticCurveTo(x + 7.4, -2.8, x + 5, -3.8); ctx.quadraticCurveTo(x + 2.6, -4.6, x + 2.4, -8.4); ctx.closePath();
      const bg = ctx.createLinearGradient(x - 3, -8, x + 6, 0); bg.addColorStop(0, C(shade(bc, -.3))); bg.addColorStop(.55, C(bc)); bg.addColorStop(.85, C(shade(bc, .22))); bg.addColorStop(1, C(shade(bc, -.2)));
      ctx.fillStyle = bg; ctx.fill(); outline(.9);
      ctx.fillStyle = C(shade(bc, -.62)); ctx.fillRect(x - 4.4, -1.4, 11.6, 1.4); ctx.fillRect(x - 4.4, -2.7, 3.4, 1.4); // sole and heel
      ctx.strokeStyle = C(shade(L.leather, -.3)); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x + .2, -6.2); ctx.lineTo(x + 3.8, -3.6); ctx.stroke();
      ctx.strokeStyle = C(far ? shade(L.brass, -.35) : shade(L.brass, -.1)); ctx.lineWidth = .4; ctx.strokeRect(x + 1.2, -5.7, 1.5, 1.3);
      if (DET()) { ctx.fillStyle = 'rgba(255,240,220,.5)'; ell(x + 4.8, -2.6, 1.8, .6, -.3); ctx.fill(); }
    },
  };
  // A whole leg, skinned (art.js skinLimb): one outline from hip to knee to ankle, the trouser and the boot shaft one
  // limb, then what the slot lays over it (stripes, plates, greaves), the foot set at (fx, fy) and turned by rot, the
  // boot's cuff and straps, and the knee cop. The nearer leg passes far=false.
  // width profiles: [root, upper swell, joint, where the upper swell sits (0..1), lower swell, end, where it sits]
  // legs: the hip wide to blend into the seat, the thigh full, a narrower knee, the calf, the ankle
  // arms: the deltoid out of the shoulder, the bicep, a narrow elbow, the forearm's swell near it, the wrist
  const LEGW = [10.2, 9.6, 6.2, .34, 6.5, 4.5, .34], ARMW = [8.4, 7.6, 5.8, .42, 6.4, 4.6, .3];
  function legSkin(L, hx, hy, kx, ky, ax, ay, far, s = 1, kit = PART('pants', L)) {
    const [c1, c2] = kit.skin ? kit.skin(L, far) : [far ? shade(L.legs, -.16) : L.legs, far ? shade(L.boots, -.16) : L.boots];
    skinLimb(hx, hy, kx, ky, ax, ay, kit.legW || LEGW, s, c1, c2 === c1 ? null : c2, .6);
    kit.thigh(L, hx, hy, kx, ky, far, s); kit.shin(L, kx, ky, ax, ay, far, s);
  }
  const FOOT_SY = .86;
  function leg(L, hx, hy, kx, ky, ax, ay, fx, fy, rot, bsc, far, s = 1) {
    const kit = PART('pants', L);
    legSkin(L, hx, hy, kx, ky, ax, ay, far, s, kit);
    ctx.save(); ctx.translate(fx, fy); if (rot) ctx.rotate(rot); ctx.scale(bsc * .88, FOOT_SY); kit.foot(L, 0, far); ctx.restore(); // (the foot kept its own height: the legs' frame is drawn tall)
    kit.shinDetail(L, kx, ky, ax, ay, far, s);
    const tx = kx - hx, ty = ky - hy, sx = ax - kx, sy = ay - ky, tl = Math.hypot(tx, ty) || 1, sl = Math.hypot(sx, sy) || 1;
    kit.knee(L, kx, ky, tx / tl + sx / sl, ty / tl + sy / sl, far, s);
  }
  // the seat: the trousers between the tops of the two thighs, so they grow out of one pelvis instead of two pins
  // (drawn after the far leg and before the near one, whose un-inked root melts into it). In the legs' own frame.
  function seat(L, x0, x1, hy, s = 1, sink = 0) {
    const kit = PART('pants', L), col = (kit.skin ? kit.skin(L, false) : [L.legs])[0], a = Math.min(x0, x1) - 3.6 * s, b = Math.max(x0, x1) + 3.6 * s, m = (a + b) / 2, d = (4.2 + sink * .12) * s;
    ctx.beginPath(); ctx.moveTo(a, hy - 2.6); ctx.lineTo(b, hy - 2.6); ctx.quadraticCurveTo(b + .6, hy + d * .7, m + (b - m) * .35, hy + d); ctx.quadraticCurveTo(m, hy + d * 1.12, m - (m - a) * .35, hy + d); ctx.quadraticCurveTo(a - .6, hy + d * .7, a, hy - 2.6); ctx.closePath();
    ctx.fillStyle = C(col); ctx.fill();
    if (FINE()) { ctx.strokeStyle = 'rgba(12,6,16,.4)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(m - (m - a) * .3, hy + d * .95); ctx.quadraticCurveTo(m, hy + d * 1.05, m + (b - m) * .3, hy + d * .95); ctx.stroke(); } // the fork of the seat
  }
  // A whole arm, skinned: shoulder to elbow to wrist as one sleeve, the deltoid swelling out of the shoulder, then what
  // the slot lays over it (folds, the vambrace or bracer down the forearm)
  function arm(L, ax, ay, bx, by, cx, cy, far) {
    const kit = PART('gauntlets', L), col = kit.skin ? kit.skin(L, far) : (far ? shade(L.shirt, -.24) : L.shirt);
    skinLimb(ax, ay, bx, by, cx, cy, kit.armW || ARMW, 1, col, null);
    kit.sleeve(L, ax, ay, bx, by, far); kit.fore(L, bx, by, cx, cy, far);
  }

  // ===================================================== arms =====================================================
  const vambrace = {
    skin(L, far) { return far ? shade(L.shirt, -.24) : L.shirt; }, // the white shirt sleeve, full and loose, down to the wrist
    sleeve(L, ax, ay, bx, by, far) { // the upper cannon: steel lames down the upper arm to the elbow, the shirt puffing out below them
      const col = far ? shade(L.steel, -.24) : L.steel, sh = far ? shade(L.shirt, -.24) : L.shirt;
      ctx.save(); const len = along(ax, ay, bx, by);
      if (FINE()) { ctx.strokeStyle = shade(sh, -.32); ctx.lineWidth = .55; ctx.beginPath(); ctx.moveTo(len * .82, -3.4); ctx.quadraticCurveTo(len * .9 + 1, 0, len * .84, 3.4); ctx.stroke(); } // the puff's fold
      for (let i = 1; i >= 0; i--) { // two overlapping bands under the pauldron, the upper over the lower
        const x = len * (.18 + i * .2), w = len * .24, hw = 4 - i * .15;
        ctx.beginPath(); ctx.moveTo(x - w * .1, -hw); ctx.lineTo(x + w, -hw + .3); ctx.quadraticCurveTo(x + w + 1.2, 0, x + w, hw - .3); ctx.lineTo(x - w * .1, hw); ctx.quadraticCurveTo(x - w * .1 - 1, 0, x - w * .1, -hw); ctx.closePath();
        ctx.fillStyle = metal(0, -hw, 0, hw, col); ctx.fill(); outline(.8);
        glint(x + .4, -hw + 1, x + w - .6, -hw + 1.2, .55, .8); rivet(x + w * .5, hw - 1.2, .4);
      }
      ctx.restore();
    },
    fore(L, ax, ay, bx, by, far) { // a big steel vambrace flared at the wrist, strapped over the sleeve with leather and brass
      const col = far ? shade(L.steel, -.22) : L.steel, lth = far ? shade(L.leather, -.2) : L.leather;
      ctx.save(); const len = along(ax, ay, bx, by);
      const path = () => { ctx.beginPath(); ctx.moveTo(1.4, -3.3); ctx.quadraticCurveTo(len * .5, -3.1, len - 1.6, -3.7); ctx.lineTo(len + .6, -4.6); ctx.quadraticCurveTo(len + 1.6, 0, len + .6, 4.6); ctx.lineTo(len - 1.6, 3.7); ctx.quadraticCurveTo(len * .5, 3.1, 1.4, 3.3); ctx.quadraticCurveTo(0, 0, 1.4, -3.3); ctx.closePath(); };
      path(); ctx.fillStyle = metal(0, -4.6, 0, 4.6, col); ctx.fill();
      atop(() => { path(); ctx.clip(); ctx.fillStyle = 'rgba(10,8,12,.35)'; ctx.fillRect(-1, 1.6, len + 3, 4); }); // its underside in shadow
      path(); outline(.9);
      ctx.strokeStyle = C(shade(col, -.4)); ctx.lineWidth = .45; ctx.beginPath(); ctx.moveTo(len - 1.6, -3.6); ctx.quadraticCurveTo(len - 1, 0, len - 1.6, 3.6); ctx.stroke(); // the flared cuff's edge
      for (const k of [.3, .66]) { const x = len * k; ctx.fillStyle = C(lth); ctx.fillRect(x - .75, -3.5, 1.5, 7); ctx.fillStyle = C(shade(lth, -.35)); ctx.fillRect(x - .75, 2.4, 1.5, 1.1); ctx.fillStyle = C(far ? shade(L.brass, -.2) : L.brass); ctx.fillRect(x - 1, -3.7, 2, 1.6); }
      glint(2.6, -2, len - 2.4, -2.5, .65, .95); rivet(len - .4, -3.2, .42); rivet(len - .4, 3.2, .42);
      ctx.restore();
      if (FINE()) { ctx.strokeStyle = shade(far ? shade(L.shirt, -.24) : L.shirt, -.35); ctx.lineWidth = .55; ctx.beginPath(); ctx.arc(ax, ay, 2.4, 0, Math.PI * .9); ctx.stroke(); } // the shirt gathering at the elbow
    },
    pauldron(L, x, y, ang, far, s = 1) { // a big layered pauldron: a domed cap over three riveted lames, polished bright
      const col = far ? shade(L.pauldron, -.24) : L.pauldron;
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
      atop(() => { ctx.fillStyle = 'rgba(8,6,10,.42)'; ell(-.4, 7.6, 7.4, 3.6); ctx.fill(); }); // its shadow cast down the arm
      const lame = (cy, rx, ry) => { ctx.beginPath(); ctx.ellipse(0, cy, rx, ry, 0, 0, Math.PI); ctx.lineTo(-rx, cy - .6); ctx.lineTo(rx, cy - .6); ctx.closePath(); ctx.fillStyle = metal(rx * .5, cy - 1, -rx * .4, cy + ry, col); ctx.fill(); outline(.75);
        glint(rx * .1, cy + ry * .55, rx * .7, cy + ry * .3, .5, .75); rivet(-rx * .78, cy + .5, .42); rivet(rx * .78, cy + .5, .42); };
      lame(5.6, 5.4, 3.2); lame(3.7, 6.3, 3.3); lame(1.8, 7.1, 3.3);
      const cap = () => { ctx.beginPath(); ctx.ellipse(0, .4, 8, 6.2, 0, Math.PI, TAU); ctx.ellipse(0, .4, 8, 1.9, 0, 0, Math.PI); ctx.closePath(); };
      cap(); ctx.fillStyle = metal(4, -6, -3, 2.4, col); ctx.fill();
      atop(() => { cap(); ctx.clip(); ctx.fillStyle = 'rgba(14,10,16,.45)'; ell(-6.4, 1.2, 4.6, 6); ctx.fill(); }); // turned from the light
      cap(); outline(.9);
      if (DET()) { ctx.fillStyle = 'rgba(255,255,255,.8)'; ell(2.6, -3.2, 2.8, .85, -.35); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.95)'; circle(3.4, -3.6, .55); ctx.fill();
        ctx.strokeStyle = shade(col, -.5); ctx.lineWidth = .45; ctx.beginPath(); ctx.ellipse(0, .4, 6.6, 4.6, 0, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); } // the shine, and the cap's rolled edge
      for (const a of [1.15, 1.5, 1.85]) rivet(Math.cos(Math.PI * a) * 6.9, .4 + Math.sin(Math.PI * a) * 5.2, .5);
      ctx.restore();
    },
  };

  // ===================================================== torso =====================================================
  let TW = 1; // how wide the chest reads: full face on, slimmer turned side-on (a chest is deeper than it is wide only in cartoons)
  // The torso bends at the waist in two parts: the chest goes with the lean (the upper body's frame), the pelvis turns
  // back by BEND toward the legs, and every point between is turned by a smooth share of it, so the sides flex in one
  // curve (the front creasing as he folds forward, the back arching as he rears) and the belts ride with the pelvis.
  let BEND = 0, BH = 0;
  const bendW = (y) => sstep((y - (BH - 14)) / 13);
  const BP = (x, y) => { const a = BEND * bendW(y); if (!a) return [x, y]; const c = Math.cos(a), s = Math.sin(a), dy = y - BH; return [x * c - dy * s, BH + x * s + dy * c]; };
  const torsoPath = (ty, HIP) => {
    // shoulders over a chest that tapers to a narrow waist; the front is a flat plane, no pigeon breast
    const w = TW; BH = HIP;
    const mv = (x, y) => { const p = BP(x, y); ctx.moveTo(p[0], p[1]); }, ln = (x, y) => { const p = BP(x, y); ctx.lineTo(p[0], p[1]); }, qc = (x1, y1, x, y) => { const a = BP(x1, y1), b = BP(x, y); ctx.quadraticCurveTo(a[0], a[1], b[0], b[1]); };
    ctx.beginPath(); mv(-9.4 * w, ty + 2.2); qc(0, ty - 1.6, 9.4 * w, ty + 2.2);
    ln(8.8 * w, ty + 9); qc(7.2 * w, ty + 14, 6 * w, ty + 16.5); qc(5.4 * w, HIP - 5.2, 5.6 * w, HIP - 3); qc(5.8 * w, HIP - .8, 6 * w, HIP + 1.5);
    ln(-6 * w, HIP + 1.5); qc(-5.8 * w, HIP - .8, -5.6 * w, HIP - 3); qc(-5.4 * w, HIP - 5.2, -6 * w, ty + 16.5); qc(-7.2 * w, ty + 14, -8.8 * w, ty + 9); ln(-9.4 * w, ty + 2.2); ctx.closePath();
  };
  const pelvis = (HIP) => { if (!BEND) return; ctx.translate(0, HIP); ctx.rotate(BEND); ctx.translate(0, -HIP); }; // the belts' frame
  const doublet = {
    torso(L, g) {
      const { HIP, SHO, CS, Y, BACK } = g, ty = SHO - 2, body = L.body;
      TW = .62 + .38 * Math.abs(Y);
      const tg = ctx.createLinearGradient(-10, ty, 10, ty + 22); // lit from the upper right, black cloth: only a sheen where it turns to the light
      tg.addColorStop(0, C(shade(body, -.5))); tg.addColorStop(.5, C(body)); tg.addColorStop(.85, C(shade(body, .16))); tg.addColorStop(1, C(shade(body, .05)));
      torsoPath(ty, HIP); ctx.fillStyle = tg; ctx.fill();
      if (DET()) {
        ctx.save(); torsoPath(ty, HIP); ctx.clip();
        if (FINE()) { // a fine diamond lattice, a gold dot at every crossing and one in every diamond, as in the sheet
          const ph = ((-Y * 5) % 4.2 + 4.2) % 4.2, h = HIP + 3 - ty;
          ctx.strokeStyle = 'rgba(120,112,140,.22)'; ctx.lineWidth = .35; ctx.beginPath();
          for (let k = -18; k <= 24; k += 4.2) { ctx.moveTo(k + ph - 8, ty); ctx.lineTo(k + ph + 8, ty + h); ctx.moveTo(k + ph + 8, ty); ctx.lineTo(k + ph - 8, ty + h); }
          ctx.stroke();
          const n = Math.round(h / 4.2 * 1.9);
          for (const lit of [0, 1]) { ctx.beginPath(); // (batched: one path per tone)
            for (let r = 0; r < n; r++) for (let k = -18; k <= 24; k += 4.2) { if (((r + Math.round(k)) % 3 === 0) !== !!lit) continue; ctx.rect(k + ph + (r % 2 ? 2.1 : 0) - .25, ty + r * 2.1 - .25, .5, .5); }
            ctx.fillStyle = lit ? 'rgba(246,216,142,.92)' : 'rgba(214,176,92,.7)'; ctx.fill(); }
        }
        ctx.fillStyle = 'rgba(0,0,0,.42)'; ctx.beginPath(); ctx.moveTo(-11, ty); ctx.lineTo(-3.4, ty); ctx.quadraticCurveTo(-6, ty + 12, -3.8, HIP + 2); ctx.lineTo(-11, HIP + 2); ctx.closePath(); ctx.fill(); // the side away from the light
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(-12, ty - 1, 24, 3.4); // the cowl's shadow across the shoulders
        ctx.strokeStyle = shade(body, .55); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(8.8 * TW, ty + 3); ctx.lineTo(8.4 * TW, ty + 9); ctx.quadraticCurveTo(7 * TW, ty + 13.5, 6 * TW, ty + 16); ctx.stroke(); // rim light
        ctx.restore();
      }
      torsoPath(ty, HIP); outline();
      if (BACK) { // from behind: the seam down his spine
        ctx.strokeStyle = C(shade(body, -.5)); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(0, ty + 2); ctx.lineTo(0, HIP - 2); ctx.stroke();
        return;
      }
      const fx = 6.6 * TW * Math.pow(CS, 1.6); // where the doublet buttons: the chest's edge in profile, down his middle face on
      if (Y > -.3) {
        ctx.strokeStyle = C(shade(body, -.7)); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(fx, ty + 5); ctx.lineTo(fx - .4, HIP - 1); ctx.stroke();
        ctx.strokeStyle = C(shade(L.trim, -.15)); ctx.lineWidth = .35; ctx.beginPath(); ctx.moveTo(fx + .7, ty + 5); ctx.lineTo(fx + .3, HIP - 8); ctx.stroke(); // a gold edge down the front
        for (let k = 0; k < 6; k++) { const y = ty + 6 + k * 2.6; ctx.fillStyle = C(L.button); circle(fx + .5, y, .62); ctx.fill(); if (DET()) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(fx + .25, y - .5, .4, .4); } }
      }
    },
    // the high white stand-up collar, and the silver rose that pins the cloak
    neck(L, g) {
      const { SHO, NECK, CS, Y, BACK } = g, ty = SHO - 2, nx = 1.2, sh = L.shirt;
      // the collar: a band standing up round the neck, highest at the back, open at the throat, its points turned out
      const a0 = Math.atan2(CS, Y), r = 3.1, pts = [];
      for (let i = 0; i <= 10; i++) { const th = a0 - Math.PI / 2 + Math.PI * i / 10; if (!BACK && Math.cos(th) > .86) continue; pts.push([nx + r * (Math.cos(th) * CS - Math.sin(th) * Y), th]); }
      if (pts.length > 1) {
        const top = (th) => NECK - 3.4 - 1.4 * Math.max(0, -Math.cos(th)) + (Math.cos(th) > .5 ? .4 : 0);
        const path = () => { ctx.beginPath(); pts.forEach(([x, th], i) => { const y = top(th); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0], NECK + 2.8); ctx.closePath(); };
        path(); const cg = ctx.createLinearGradient(nx - 3, 0, nx + 3, 0); cg.addColorStop(0, C(shade(sh, -.38))); cg.addColorStop(.6, C(sh)); cg.addColorStop(1, C(shade(sh, -.1))); ctx.fillStyle = cg; ctx.fill(); outline(.65);
        if (DET()) { ctx.strokeStyle = shade(sh, -.35); ctx.lineWidth = .35; ctx.beginPath(); pts.forEach(([x, th], i) => { const y = top(th) + 1; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); } // the stitched edge
      }
      if (BACK) return;
      const F = Math.pow(CS, 1.6), xn = nx + 2.2 * F - .2; // where the throat is (the rose pins the cloak there)
      const rx = xn + .3, ry = ty - .1;
      const ex = nx + 7.2 * (Math.cos(-1.25) * CS - Math.sin(-1.25) * Y), ey = ty + 2; // the cloak's far edge, at the collarbone
      if (Math.abs(ex - rx) > 1.5) { for (let i = 1; i <= 7; i++) { const u = i / 8, x = lerp(rx, ex, u), y = lerp(ry, ey, u) + Math.sin(u * Math.PI) * 2.6; // a chain of small links
        ctx.strokeStyle = C(shade(L.brass, -.15)); ctx.lineWidth = .32; ell(x, y, .5, .32, i % 2 ? .6 : -.4); ctx.stroke(); } }
      roseClasp(rx, ry, 2.6, L.steel);
    },
  };
  function roseClasp(x, y, r, col) { // a silver rose seen face on: a ring of cupped petals round a tight spiral heart, polished
    const dk = shade(col, -.55), lt = shade(col, .6);
    ctx.save(); ctx.translate(x, y);
    if (DET()) { ctx.fillStyle = 'rgba(6,4,8,.45)'; circle(.5, .6, r * 1.1); ctx.fill(); } // its shadow on the cloth
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - .6; ctx.beginPath(); ctx.arc(Math.cos(a) * r * .5, Math.sin(a) * r * .5, r * .55, a - 1.6, a + 1.6); ctx.closePath(); // the outer petals, lit from the upper right
      ctx.fillStyle = C(Math.cos(a + .8) > 0 ? lt : Math.cos(a + .8) > -.5 ? col : shade(col, -.3)); ctx.fill(); outline(.4); }
    circle(0, 0, r * .62); ctx.fillStyle = C(shade(col, -.15)); ctx.fill(); outline(.4);
    if (DET()) { ctx.strokeStyle = dk; ctx.lineWidth = .42; ctx.lineCap = 'round'; ctx.beginPath(); // the heart: a spiral of inner petals
      for (let t = 0; t <= 1; t += .05) { const a = t * TAU * 1.8 + .4, rr = r * (.08 + .5 * t); t ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.stroke();
      ctx.strokeStyle = lt; ctx.lineWidth = .3; ctx.beginPath(); for (let t = .1; t <= 1; t += .05) { const a = t * TAU * 1.8 + .9, rr = r * (.08 + .5 * t); t > .1 ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.95)'; circle(r * .42, -r * .5, r * .13); ctx.fill(); }
    ctx.restore();
  }

  // ===================================================== waist =====================================================
  const ring = (g, r, th) => { const fx = r * .8 * Math.cos(th), lz = r * Math.sin(th); return [fx * g.CS - lz * g.Y, fx * g.Y + lz * g.CS]; }; // [x on screen, depth toward us]
  const swordbelt = {
    belts(L, g) {
      const { HIP, CS, Y } = g, a0 = Math.atan2(CS, Y), HJ = g.HIPJ ?? HIP + 7.6;
      // the doublet's skirt: six panels falling from the belt over the tops of his thighs, black, bordered in gold, the furthest first
      const tabs = [];
      for (let k = 0; k < 6; k++) { const th = k / 6 * TAU + Math.PI / 6, d = Math.cos(th - a0); if (d > .02) tabs.push([d, th]); }
      tabs.sort((a, b) => a[0] - b[0]);
      const swing = clamp(g.sw * 1.4, -1.8, 1.8), y0 = HIP + .6;
      for (const [d, th] of tabs) {
        const [x0] = ring(g, 8.2, th - .5), [x1] = ring(g, 8.2, th + .5), [x2] = ring(g, 10.2, th + .54), [x3] = ring(g, 10.2, th - .54), y1 = HJ + 2.4 - (1 - d) * 1.4, sx = swing * Math.cos(th);
        const path = () => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x2 + sx, y1); ctx.lineTo(x3 + sx, y1); ctx.closePath(); };
        path(); const pg = ctx.createLinearGradient(0, y0, 0, y1); pg.addColorStop(0, C(shade(L.body, -.3))); pg.addColorStop(.6, C(shade(L.body, -.05 + d * .2))); pg.addColorStop(1, C(shade(L.body, -.2))); ctx.fillStyle = pg; ctx.fill(); outline(.65);
        const ix = (a, b, t) => a + (b - a) * t;
        if (d > .25) { ctx.strokeStyle = C(shade(L.trim, d > .6 ? 0 : -.25)); ctx.lineWidth = .5; ctx.beginPath(); // the gold border, and a scroll worked into its foot
          ctx.moveTo(ix(x0, x1, .14), y0 + 1.2); ctx.lineTo(ix(x3, x2, .14) + sx, y1 - 1); ctx.lineTo(ix(x3, x2, .86) + sx, y1 - 1); ctx.lineTo(ix(x0, x1, .86), y0 + 1.2); ctx.stroke();
          if (FINE() && d > .5) { const cx = ix(x3, x2, .5) + sx, cy = y1 - 3.2, w = Math.abs(x2 - x3) * .22; ctx.lineWidth = .35; ctx.beginPath(); ctx.moveTo(cx - w, cy + 1); ctx.quadraticCurveTo(cx - w, cy - 1.4, cx, cy - .4); ctx.quadraticCurveTo(cx + w, cy + .6, cx + w, cy - 1.2); ctx.moveTo(cx, cy - .4); ctx.lineTo(cx, cy + 1.4); ctx.stroke(); } }
      }
      atop(() => { ctx.fillStyle = 'rgba(8,4,6,.45)'; const [xa] = ring(g, 9, a0 - Math.PI / 2), [xb] = ring(g, 9, a0 + Math.PI / 2); ctx.fillRect(Math.min(xa, xb) - 2, HIP + 1.2, Math.abs(xb - xa) + 4, 2.2); }); // the belt's shadow on the skirt
      // the belts: a wide one at the waist, and the sword belt slung lower across the hips, from his right hip down to his left
      const band = (yOf, r, w, col) => {
        const pts = []; for (let i = 0; i <= 12; i++) { const th = a0 - Math.PI / 2 + Math.PI * i / 12, [x] = ring(g, r, th); pts.push([x, yOf(th)]); }
        const path = () => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); };
        ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
        path(); ctx.strokeStyle = FLASH ? '#FFFFFF' : INK; ctx.lineWidth = w + 1.8 * OUTK; ctx.stroke();
        path(); ctx.strokeStyle = C(col); ctx.lineWidth = w; ctx.stroke();
        if (DET()) { ctx.save(); ctx.translate(0, -w * .32); path(); ctx.strokeStyle = shade(col, .35); ctx.lineWidth = .5; ctx.stroke(); ctx.restore();
          ctx.save(); ctx.translate(0, w * .3); path(); ctx.strokeStyle = shade(col, -.45); ctx.lineWidth = .7; ctx.stroke(); ctx.restore();
          if (FINE()) { ctx.save(); ctx.setLineDash([.5, .7]); ctx.translate(0, -w * .22); path(); ctx.strokeStyle = shade(col, .5); ctx.lineWidth = .25; ctx.stroke(); ctx.restore(); } }
      };
      const buckle = (th, r, y, s) => { const [x, d] = ring(g, r, th); if (d < .5) return; const w = s * (.45 + .55 * d / r);
        rrect(x - w, y - s * 1.15, w * 2, s * 2.3, .5); const bg = ctx.createLinearGradient(x - w, y - s, x + w, y + s); bg.addColorStop(0, C(shade(L.brass, .45))); bg.addColorStop(.5, C(L.brass)); bg.addColorStop(1, C(shade(L.brass, -.4))); ctx.fillStyle = bg; ctx.fill(); outline(.6);
        ctx.fillStyle = C(shade(L.leather, -.4)); ctx.fillRect(x - w * .55, y - s * .62, w * 1.1, s * 1.24); ctx.fillStyle = C(shade(L.brass, .3)); ctx.fillRect(x - .25, y - s * .72, .5, s * 1.44); };
      const sling = (th) => HIP + 3.4 - 3 * Math.sin(th);
      band(sling, 8.9, 2.3, shade(L.leather, -.14));
      band(() => HIP - .4, 8.1, 3.4, L.leather);
      buckle(0, 8.1, HIP - .4, 1.55); buckle(.55, 8.9, sling(.55), 1.1);
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
  // A great cloak worn round him, not a cape off his back: nine strands hang from a ring round his shoulders, from the
  // far front edge (pinned near the rose at his throat), over the far shoulder, across his back, over the near shoulder to
  // the near front edge; each strand is six points. How far round his front the ring reaches is the cloak's wrap (WR):
  // standing, it closes round him, the front edges falling over his shoulders and down his chest; walking it loosens;
  // running, lunging, leaping and spinning it is thrown open and streams behind, and as he stops it swings back round him.
  // Where each point wants to be (its target) comes from the pose: the drape, a flare at the hem, a trail behind him as he
  // moves, a sway with each stride, a slow stir of air. For the live prince those targets are springs: every point keeps
  // its place in the world and is pulled toward its target, the hem softest, so the cloth lags, overshoots and settles; air
  // drag streams it out behind a run and lifts it as he falls; it lies on the street when he goes down. Anything else that
  // draws him (afterimages, menus, portraits) uses a snapshot or the targets.
  // The cloak is a character of its own: two springs of its own (the wrap, and a flare that every burst of speed kicks and
  // that overshoots as it settles) exaggerate his movements, and its paint is alive: rough brushstrokes that come and go,
  // drifting over the cloth, faster the faster it moves, smeared along its motion, and flung off its edges as ragged
  // dry-brush flicks when it whips.
  const S = 9, M = 5, NP = S * (M + 1), MID = (S - 1) / 2;
  const KJ = [0, 280, 190, 128, 84, 52];     // spring stiffness down a strand (1/s^2): the hem softest, so it whips
  const GRAVITY = 230, DRAG_X = 2.7, DRAG_Y = 2.5, DAMP = 1.15, H = 1 / 120;
  const tgt = new Float32Array(NP * 2), loc = new Float32Array(NP * 2), rest = new Float32Array(NP), DEP = new Float32Array(S);
  const ix = (i, j) => (i * (M + 1) + j) * 2;
  const SIM = { pts: new Float32Array(NP * 2), sp: new Float32Array((M + 1) * 2), sq: new Float32Array((M + 1) * 2), dA: new Float32Array(M + 1), ok: false, wx: 0, wy: 0, at: 0, acc: 0, f: 1,
    dt: 0, mwx: 0, mwy: 0, bvx: 0, bvy: 0, fo: 0, fv: 0, wr: 1, wv: 0, spin: 0, vx: 0, vy: 0, spd: 0, pc: 0 };
  let CLOAK_GEO = null, WR = 1, FO = 0, SPD = 0, LVX = 0, LVY = 0, CUTF = -1, CUTN = 2;
  // the hem is torn: teeth and notches along it, fixed once so they never shimmer (JN of them across the cloth)
  const JN = 48, JAG = []; for (let k = 0; k <= JN; k++) JAG.push(k % 3 === 1 ? 2.2 + hsh(k) * 3 : k % 5 === 3 ? -1.2 - hsh(k + 9) : hsh(k + 40) * .9);
  const SPECKS = []; for (let k = 0; k < 80; k++) SPECKS.push({ u: hsh(k + 601), v: .06 + hsh(k + 643) * .9, g: hsh(k + 687) < .4 }); // specks of gold and grey flecked through the black (CLOAK TEXTURE in the sheet)
  // the living brushstrokes: each is reborn somewhere new on the cloth every so often (on its own clock, faster as the
  // cloak moves), and swells and fades over its life, so the paint is never quite the same twice
  const NS = 70, STK = []; for (let k = 0; k < NS; k++) STK.push({ ph: hsh(k + 901), rt: .55 + hsh(k + 907) * .9, u: 0, v: 0, du: 0, dv: 0, bd: 0, w: 0, c: 'd', e: 0, sm: 0, dry: 0 });
  const wrapAim = (g, z, speed) => { // how closed round him the cloak wants to be (1: wrapped, 0: thrown wide open)
    const p = g.pose; let w = .94;
    if (g.gait) w = p.run ? .22 : .7;
    if (p.trail || p.flat || p.sweep !== undefined || (p.ext || 0) > 0 || p.kickK !== undefined || p.kick || p.lead) w = Math.min(w, .36);
    if (p.spin || p.rot) w = Math.min(w, .25);
    if (z > 3) w = Math.min(w, .42);
    return clamp(w - clamp(Math.abs(p.flow || 0) / 40, 0, .45) - clamp(speed / 520, 0, .5), 0, 1);
  };
  // the cloak's moods, once a frame for the live prince: its wrap and its flare (two springs, each overshooting as it
  // settles), and the clock its paint lives by
  function motion(g, CD) {
    const now = (typeof BL !== 'undefined' && BL.clock) ? BL.clock() : performance.now();
    let dt = Math.min(.05, Math.max(0, (now - SIM.at) / 1000)); SIM.at = now;
    const frozen = (typeof hitstop !== 'undefined' && hitstop > 0) || (typeof mode !== 'undefined' && mode !== 'play' && mode !== 'title');
    if (frozen) dt = 0; else if (typeof slowmo !== 'undefined' && slowmo > 0) dt *= .3;
    SIM.dt = dt; let mx = CD.wx - SIM.mwx, my = CD.wy - SIM.mwy; SIM.mwx = CD.wx; SIM.mwy = CD.wy;
    if (!dt) return; if (Math.abs(mx) > 60 || Math.abs(my) > 60 || !(now - SIM.seen < 400)) mx = my = 0; // moved somewhere at once
    const q = Math.min(1, dt * 14), ox = SIM.bvx, oy = SIM.bvy; SIM.bvx += (mx / dt - SIM.bvx) * q; SIM.bvy += (my / dt - SIM.bvy) * q;
    const sv = ((g.pose.spin || 0) - SIM.spin) / dt; SIM.spin = g.pose.spin || 0;
    const sp = Math.hypot(SIM.bvx, SIM.bvy), fa = clamp(Math.hypot(SIM.bvx * .0036, SIM.bvy * .0026) + Math.min(.8, Math.abs(sv) * .03), 0, 1.3);
    SIM.fv += Math.min(14, Math.hypot(SIM.bvx - ox, SIM.bvy - oy) * .022); // every burst of speed (a lunge, a dodge, a leap, a landing) kicks it out
    SIM.fv += (55 * (fa - SIM.fo) - 7 * SIM.fv) * dt; SIM.fo = clamp(SIM.fo + SIM.fv * dt, -.3, 1.8);
    SIM.wv += (34 * (wrapAim(g, CD.z, sp) - SIM.wr) - 7.5 * SIM.wv) * dt; SIM.wr = clamp(SIM.wr + SIM.wv * dt, -.15, 1.1);
    SIM.pc += dt * (.3 + Math.min(SIM.spd, 320) / 48); // its paint stirs slowly while it hangs still, and boils as it flies
  }
  function targets(L, g) {
    const { Y, CS, HIP, SHO, HX, LEAN, walk, sw, pose, gait, t } = g, cl = Math.cos(LEAN), sl = Math.sin(LEAN);
    const flow = clamp(pose.flow || 0, -12, 20), down = pose.down ? 1 : 0;
    const trail = 6.5 + flow * 1.05 + (gait ? (pose.run ? 7 : 2 + Math.abs(sw) * 1.6) : 0) + FO * 9;
    const br = pose.breath || 0, air = Math.sin(t * 1.1);
    // a wind off the road while he stands: slow gusts that never quite die away (three slow sines, so it never
    // repeats or flickers), and a billow running down the cloth from the shoulders to the hem with each gust
    const wk = pose.stance && !walk ? 1 : gait ? .3 : pose.down ? 0 : .6;
    const nearK = clamp(Y / .35, 0, 1) * .22; // turned to us, the far half is held behind him: the near half spreads a little wider to keep the cloak as full
    const gust = wk * clamp(.5 + .28 * Math.sin(t * .41) + .18 * Math.sin(t * 1.03 + 1.3) + .1 * Math.sin(t * 2.2 + .4), .05, 1.1);
    const PE = Math.PI * lerp(.56, .8, clamp(WR, 0, 1.1)); // how far round his front the cloak reaches, each side
    for (let i = 0; i < S; i++) {
      const phi = (i / (S - 1) * 2 - 1) * PE, sp = Math.sin(phi), cp = Math.cos(phi), front = Math.max(0, -cp), back = Math.max(0, cp);
      const fxa = -6.4 * cp + 1.2 - front * 1.5, lza = 11.2 * sp * (1 - front * .22), ya = SHO - 1.6 + (1 - Math.abs(sp)) * .8 - front * 1.8; // (round the front, the edges come in toward the throat)
      DEP[i] = fxa * Y + lza * CS; // how far toward us this strand hangs from (> 0: in front of his body)
      const ax0 = fxa * CS - lza * Y, ax = HX + ax0 * cl - (ya - HIP) * sl, ay = HIP + ax0 * sl + (ya - HIP) * cl;
      const len = (45 + 3.5 * cp - 5 * front) * 1.24 * (1 - down * .1), // (longer again: to the ankle)
         fl = 21 + .36 * Math.abs(flow) + FO * 13 + down * 4 + (pose.stance && !walk ? 6 : 0); // standing, it spreads wide round him; every burst of speed flares it
      for (let j = 0; j <= M; j++) {
        const o = ix(i, j); if (!j) { tgt[o] = ax; tgt[o + 1] = ay; continue; }
        const v = j / M, vf = Math.pow(v, .85);
        const sway = (Math.sin(walk * .5 + i * .9 - v * 1.6) * (gait ? 3 : 0) + (air * 1.2 + br * .4) * Math.sin(i * 1.7 + v * 2.2 + t * .7)) * v; // it drifts on the air even standing
        const bil = Math.sin(t * 2.05 - v * 3.1 + i * .75) * (.6 + .4 * Math.sin(t * .7 + i)); // the billow, travelling down the cloth
        const sweep = front * (7 + 13 * (1 - clamp(WR, 0, 1))) * Math.pow(v, 1.1); // the front edges fall away behind his arm, the more the more it is thrown open
        const ofx = -back * 1.15 * fl * vf + front * .3 * fl * vf - sweep - trail * Math.pow(v, 1.5) + sway
          - gust * (3.8 * Math.pow(v, 1.3) + 2.2 * bil * v), olz = sp * vf * (fl * (1 - front * .92) + front * 1.5) * (1 + gust * .16 * bil * v + FO * .12 + (sp > 0 ? nearK : 0));
        let dyy = 0; const L3 = len * v, hz = Math.min(L3 * .94, Math.hypot(ofx, olz)), dy = Math.sqrt(L3 * L3 - hz * hz) + br * .35 * v; // it keeps its length: streaming out, it rises
        let dx = ofx * CS - olz * Y, a = LEAN * (1 - .8 * v), ca = Math.cos(a), sa = Math.sin(a);
        if (down) { // knocked flat: the near half lies over him like a shroud down to his boots, the rest spreads on the street past his head
          if (i >= MID) { const q = (i - MID) / MID; dx = lerp(1.5, 7.5, q) * Math.min(1, v * 3); dyy = L3 * .92; } else { dx = -2 - olz * .3 - 3 * v; dyy = -L3 * .7; } }
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
  const SP = (M + 1) * 2, spT = new Float32Array(SP), WGT = []; for (let i = 0; i < S; i++) WGT.push(.5 + .5 * (1 - Math.abs(i - MID) / MID));
  function simulate(g, CD) {
    const Mrel = CD.Binv.multiply(ctx.getTransform()), a = Mrel.a, b = Mrel.b, c = Mrel.c, d = Mrel.d, e = Mrel.e, f = Mrel.f;
    const tb = loc; // targets in B
    for (let k = 0; k < NP; k++) { const x = tgt[k * 2], y = tgt[k * 2 + 1]; tb[k * 2] = a * x + c * y + e; tb[k * 2 + 1] = b * x + d * y + f; }
    for (let i = 0; i < S; i++) for (let j = 1; j <= M; j++) { const o = ix(i, j), p = ix(i, j - 1); rest[o / 2] = Math.hypot(tb[o] - tb[p], tb[o + 1] - tb[p + 1]); }
    for (let j = 0; j <= M; j++) { spT[j * 2] = tb[ix(MID, j)]; spT[j * 2 + 1] = tb[ix(MID, j) + 1]; }
    const now = SIM.at, dt = SIM.dt;
    const P = SIM.sp, Q = SIM.sq, mx = CD.wx - SIM.wx, my = CD.wy - SIM.wy;
    if (!SIM.ok || Math.abs(mx) > 60 || Math.abs(my) > 60 || !(now - SIM.seen < 400)) { P.set(spT); Q.set(spT); SIM.ok = true; SIM.acc = 0; SIM.fo = SIM.fv = SIM.wv = 0; SIM.spd = 0; } // a fresh start, or he was moved somewhere at once
    else if (mx || my) for (let j = 0; j <= M; j++) { P[j * 2] -= mx; P[j * 2 + 1] -= my; Q[j * 2] -= mx; Q[j * 2 + 1] -= my; } // the cloth stays where it was in the world
    SIM.wx = CD.wx; SIM.wy = CD.wy; SIM.seen = now; SIM.f = CD.facing;
    const pose = g.pose, free = pose.down || pose.rot || pose.spin, soft = pose.down ? .55 : free ? .5 : 1, ground = CD.z - .4;
    SIM.acc += dt; let n = 0; const hx = P[M * 2], hy = P[M * 2 + 1];
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
        const o = j * 2, p = o - 2, dx = P[o] - P[p], dy = P[o + 1] - P[p + 1], l = Math.hypot(dx, dy) || 1e-4, r = rest[ix(MID, j) / 2];
        const want = l > r * 1.06 ? r * 1.06 : l < r * .6 ? r * .6 : l; if (want !== l) { P[o] = P[p] + dx * want / l; P[o + 1] = P[p + 1] + dy * want / l; }
        if (P[o + 1] > ground) { P[o + 1] = ground; Q[o] = P[o] - (P[o] - Q[o]) * .4; } // it lies on the street, dragging
      }
    }
    if (n === 7) SIM.acc = 0;
    if (dt > 0) { const vx = (P[M * 2] - hx) / dt, vy = (P[M * 2 + 1] - hy) / dt, q = Math.min(1, dt * 10); SIM.vx += (vx - SIM.vx) * q; SIM.vy += (vy - SIM.vy) * q; SIM.spd = Math.hypot(SIM.vx, SIM.vy); } // how fast the hem flies through the air
    if (pose.down) { const q = 1 - Math.exp(-dt * 3.5); P[0] = Q[0] = spT[0]; P[1] = Q[1] = spT[1]; for (let k = 2; k < SP; k++) { P[k] += (spT[k] - P[k]) * q; Q[k] = P[k]; } } // knocked flat, it settles over him rather than swinging
    // lay the spine's throw on every strand as a turn of each of its segments (most at the back, less at the front
    // edges), so the strands fan out from one another however far the cloth is thrown, and keep their lengths
    const out = SIM.pts, dA = SIM.dA;
    for (let j = 1; j <= M; j++) { const o = j * 2, p = o - 2;
      let d = Math.atan2(P[o + 1] - P[p + 1], P[o] - P[p]) - Math.atan2(spT[o + 1] - spT[p + 1], spT[o] - spT[p]); d = Math.atan2(Math.sin(d), Math.cos(d)); dA[j] = d; }
    for (let i = 0; i < S; i++) {
      const w = WGT[i], o0 = ix(i, 0); out[o0] = tb[o0]; out[o0 + 1] = tb[o0 + 1];
      for (let j = 1; j <= M; j++) {
        const o = ix(i, j), p = ix(i, j - 1), r = rest[o / 2], ta = Math.atan2(tb[o + 1] - tb[p + 1], tb[o] - tb[p]) + dA[j] * w;
        let x = out[p] + Math.cos(ta) * r, y = out[p + 1] + Math.sin(ta) * r;
        if (!free && y < out[o0 + 1] + j * 2) y = out[o0 + 1] + j * 2; // never thrown up over his own shoulders
        if (y > ground) y = ground;
        out[o] = x; out[o + 1] = y;
      }
    }
    toLocal(Mrel, out, 1);
    const iv = Mrel.inverse(); LVX = iv.a * SIM.vx + iv.c * SIM.vy; LVY = iv.b * SIM.vx + iv.d * SIM.vy; SPD = SIM.spd; // its flight, in his own frame
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
  // The back of the cloak always hangs behind him: turned toward us, no strand that hangs behind his body may stand out
  // past it on the side away from us (the far side is toward +x then). Every such point is held inside the edge of his
  // torso (in the upper body's frame, so it follows a lean), and below the waist inside the line of his hips, with a soft
  // limit that eases the cloth up to the edge rather than creasing it there. The strands wrapped round his front (DEP > 0)
  // are free: they fall over his shoulders and down his chest. Seen side-on or from behind it is left free; flips, spins
  // and falls too.
  function behind(g) {
    const { Y, HX, HIP, SHO, LEAN, pose } = g; if (pose.down || pose.rot || pose.spin || Y <= 0) return;
    const on = clamp(Y / .35, 0, 1), TWc = .62 + .38 * Math.abs(Y), slack = (1 - on) * 40, cl = Math.cos(LEAN), sl = Math.sin(LEAN), S0 = 2.4;
    const edge = (yu) => { const d = yu - SHO; return (d < 7 ? lerp(9.4, 8.8, d / 7) : d < 14.5 ? lerp(8.8, 6, (d - 7) / 7.5) : d < 19 ? lerp(6, 5.6, (d - 14.5) / 4.5) : 5.8) * TWc - 1.2; };
    for (let k = 0; k < NP; k++) {
      if (DEP[Math.floor(k / (M + 1))] > 0) continue;
      const x = loc[k * 2] - HX, y = loc[k * 2 + 1] - HIP, xu = x * cl + y * sl, yu = -x * sl + y * cl + HIP; // into the upper body's frame
      const lim = edge(Math.max(SHO, yu)) + slack, a = lim - S0; if (xu <= a) continue;
      const xn = a + S0 * (1 - Math.exp(-(xu - a) / S0)), dx = xn - xu; // eased up to the edge, never past it
      loc[k * 2] += dx * cl; loc[k * 2 + 1] += dx * sl;
    }
  }
  // work out where the cloak is this frame; returns the points in his drawing frame
  function begin(L, g) {
    CLOAK_GEO = g; const CD = CLOAK_DRAW, live = CD && CD.live && !g.pose.noSim;
    if (live) { motion(g, CD); WR = SIM.wr; FO = SIM.fo; }
    else if (CD && CD.live && SIM.ok) { WR = SIM.wr; FO = SIM.fo; }
    else { WR = wrapAim(g, CD ? CD.z : 0, 0); FO = clamp(Math.abs(g.pose.flow || 0) / 22, 0, 1); SPD = 0; LVX = LVY = 0; }
    targets(L, g);
    if (live) simulate(g, CD);
    else if (CD && (CD.live || g.pose.cloakS)) { const Mrel = CD.Binv.multiply(ctx.getTransform()); if (CD.live && SIM.ok) toLocal(Mrel, SIM.pts, 1); else toLocal(Mrel, g.pose.cloakS, CD.facing); }
    else { loc.set(tgt); if (!g.pose.rot && !g.pose.down) { const gr = (CD ? CD.z : 0) - .5; for (let k = 0; k < NP; k++) if (loc[k * 2 + 1] > gr) loc[k * 2 + 1] = gr; } }
    behind(g);
    // where the cloth crosses from behind him to in front of him, on each side (in u, across the cloth): the parts round
    // his front are drawn over his body (after his torso, under the weapon arm), the rest behind him
    CUTF = -1; CUTN = 2; const thr = 2.5;
    if (!g.BACK && !g.pose.down) {
      if (DEP[0] > thr) { let i = 0; while (i < MID && DEP[i + 1] > thr) i++; CUTF = (i + (DEP[i] - thr) / Math.max(1e-3, DEP[i] - DEP[i + 1])) / (S - 1); }
      if (DEP[S - 1] > thr) { let i = S - 1; while (i > MID && DEP[i - 1] > thr) i--; CUTN = (i - (DEP[i] - thr) / Math.max(1e-3, DEP[i] - DEP[i - 1])) / (S - 1); }
    }
    brushes(g.t);
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
  // this frame's living strokes: each one reborn at a new place when its clock turns over, swelling and fading over its life
  function brushes(t) {
    const pc = SIM.pc, sp = clamp(SPD / 160, 0, 1.6);
    for (let k = 0; k < NS; k++) {
      const s = STK[k], cyc = pc * s.rt + s.ph, gen = Math.floor(cyc), life = cyc - gen, sd = k * 13.7 + gen * 71.3;
      s.e = Math.sin(Math.PI * life);
      s.u = -.02 + hsh(sd) * 1.04 + .015 * Math.sin(t * .8 + k); s.v = .02 + hsh(sd + 1) * .86;
      if (hsh(sd + 2) < .2) { s.dv = .03 + hsh(sd + 3) * .08; s.du = (hsh(sd + 4) < .5 ? -1 : 1) * (.1 + hsh(sd + 5) * .14); } // a few dragged across the grain
      else { s.dv = (.1 + hsh(sd + 3) * .4) * (1 + sp * .45); s.du = (hsh(sd + 4) - .5) * .18; }
      s.bd = (hsh(sd + 6) - .5) * .14; s.w = 1.4 + Math.pow(hsh(sd + 7), 1.4) * 5.4; s.dry = hsh(sd + 8) < .5 && s.w > 2.6;
      const r = hsh(sd + 9); s.c = r < .33 ? 'd' : r < .6 ? 's' : r < .74 ? 'g' : r < .85 ? 'l' : 'b';
      s.sm = sp * (2 + hsh(sd + 10) * 7); // smeared along its flight
    }
  }
  // one brushstroke as a filled ribbon: loaded at the start, tapering to a dry tail; off: a sideways offset (in widths),
  // wf: its width, qe: how much of its length (the bristles of a dry stroke break off at different lengths)
  const RX = new Float32Array(4), RY = new Float32Array(4), NX = new Float32Array(4), NY = new Float32Array(4), RW = [.8, 1, .8, .22];
  function ribbon(Pt, u, v, du, dv, bd, w, sm, off, wf, qe) {
    const ln = Math.hypot(LVX, LVY) || 1, nx = -LVX / ln, ny = -LVY / ln;
    for (let q = 0; q < 4; q++) { const f = q / 3 * qe; uv(Pt, u + du * f + bd * Math.sin(Math.PI * f), v + dv * f); RX[q] = UX + nx * sm * f; RY[q] = UY + ny * sm * f; }
    for (let q = 0; q < 4; q++) { const a = Math.max(0, q - 1), b = Math.min(3, q + 1), tx = RX[b] - RX[a], ty = RY[b] - RY[a], tl = Math.hypot(tx, ty) || 1; NX[q] = -ty / tl; NY[q] = tx / tl; }
    const o = w * off;
    for (let q = 0; q < 4; q++) { const h = w * RW[q] * wf * .5; q ? ctx.lineTo(RX[q] + NX[q] * (o + h), RY[q] + NY[q] * (o + h)) : ctx.moveTo(RX[q] + NX[q] * (o + h), RY[q] + NY[q] * (o + h)); }
    for (let q = 3; q >= 0; q--) { const h = w * RW[q] * wf * .5; ctx.lineTo(RX[q] + NX[q] * (o - h), RY[q] + NY[q] * (o - h)); }
    ctx.closePath();
  }
  const CCOL = (L, c) => c === 's' ? L.cloakSlate : c === 'g' ? L.cloakGrey : c === 'l' ? L.cloakLt : c === 'd' ? '#050407' : L.cloak;
  const CALPHA = { d: .75, s: .5, g: .3, l: .36, b: .9 };
  const FOLDS = 5;
  // a piece of the cloak, from u0 to u1 across it: lining (the inside of the far side, seen past him), the back of the
  // cloak (behind him), or the part wrapped round his front
  function sheet(L, Pt, u0, u1, lining, frontPart) {
    if (u1 - u0 < .01) return;
    const t = CLOAK_GEO.t, det = DET(), fine = FINE(), sp = clamp(SPD / 160, 0, 1.6);
    const path = new Path2D(), n0 = Math.ceil(u0 * (S - 1) + 1e-3), n1 = Math.floor(u1 * (S - 1) - 1e-3);
    uv(Pt, u0, 0); path.moveTo(UX, UY);
    for (let i = n0; i <= n1; i++) { uv(Pt, i / (S - 1), 0); path.lineTo(UX, UY); } // across the shoulders
    const side = (u, down) => { for (let k = 1; k <= M; k++) { const j = down ? k : M - k; uv(Pt, u, j / M); const x0 = UX, y0 = UY; uv(Pt, u, (down ? j + 1 : j - 1) / M); // down (or up) one edge, smoothed
        if ((down && j < M) || (!down && j > 0)) path.quadraticCurveTo(x0, y0, (x0 + UX) / 2, (y0 + UY) / 2); else path.lineTo(x0, y0); } };
    uv(Pt, u1, 0); path.lineTo(UX, UY); side(u1, true);
    const nj = Math.max(2, Math.ceil((u1 - u0) * JN)); // the torn hem
    for (let k = 0; k <= nj; k++) { const u = u1 - (u1 - u0) * k / nj; uv(Pt, u, 1); const hx = UX, hy = UY; uv(Pt, u, .8); let ux = UX - hx, uy = UY - hy; const ul = Math.hypot(ux, uy) || 1;
      const jg = JAG[Math.round(u * JN)] * (k % 2 ? 1 : .35); path.lineTo(hx + ux / ul * jg, hy + uy / ul * jg); }
    side(u0, false); path.closePath();
    // the cloth itself: lit at the shoulders, falling into shadow toward the hem; the inside a cold, deep grey
    uv(Pt, (u0 + u1) / 2, 0); const gx0 = UX, gy0 = UY; uv(Pt, (u0 + u1) / 2, 1);
    const base = lining ? (L.cloakLining || '#1E2029') : L.cloak, gr = ctx.createLinearGradient(gx0, gy0, UX, UY);
    gr.addColorStop(0, C(shade(base, frontPart ? .22 : .14))); gr.addColorStop(.45, C(base)); gr.addColorStop(1, C(shade(base, -.45)));
    ctx.fillStyle = gr; ctx.fill(path);
    if (!det) return;
    const lo = u0 - .02, hi = u1 + .02;
    ctx.save(); ctx.clip(path); ctx.lineCap = 'round';
    if (fine) { // the folds: deep troughs and a cold light on each ridge, drifting as the cloth moves, swinging wider as it flies
      ctx.beginPath(); const b0 = ctx.globalAlpha;
      for (let k = 0; k < FOLDS; k++) { const u = (k + .2 + hsh(k + 77) * .6) / FOLDS + .03 * Math.sin(t * .5 + k * 1.7) + FO * .05 * Math.sin(t * 2.6 + k * 2.3); if (u < lo || u > hi) continue;
        ribbon(Pt, u, .03 + hsh(k + 511) * .2, (hsh(k + 507) - .5) * .2, .45 + hsh(k + 517) * .5, (hsh(k + 3) - .5) * .16, 2.4 + 2.6 * hsh(k + 5), 0, 0, 1, 1); }
      ctx.fillStyle = '#030205'; ctx.globalAlpha = b0 * .5; ctx.fill();
      ctx.beginPath(); for (let k = 0; k < FOLDS; k++) { if (k % 2) continue; const u = (k + .2 + hsh(k + 77) * .6) / FOLDS + .045 + .03 * Math.sin(t * .5 + k * 1.7) + FO * .05 * Math.sin(t * 2.6 + k * 2.3); if (u < lo || u > hi) continue;
        ribbon(Pt, u, .06 + hsh(k + 521) * .2, (hsh(k + 507) - .5) * .1, .35 + hsh(k + 527) * .4, 0, 1, 0, 0, 1, 1); }
      ctx.fillStyle = L.cloakSlate; ctx.globalAlpha = b0 * .32; ctx.fill(); ctx.globalAlpha = b0;
      for (const gold of [true, false]) { ctx.beginPath(); for (const s of SPECKS) { if (s.g !== gold || s.u < lo || s.u > hi) continue; uv(Pt, s.u, s.v); ctx.rect(UX - .22, UY - .22, .44, .44); }
        ctx.fillStyle = gold ? 'rgba(206,168,96,.75)' : 'rgba(150,152,164,.5)'; ctx.fill(); }
    }
    // the living brushwork, batched by color so it costs a handful of fills
    const ga = ctx.globalAlpha;
    for (const c of ['d', 's', 'g', 'l', 'b']) {
      if (!fine && (c === 'l' || c === 'g')) continue;
      ctx.beginPath(); let any = false;
      for (const s of STK) { if (s.c !== c || s.u < lo || s.u > hi || s.e < .06) continue; const w = s.w * Math.sqrt(s.e) * (lining ? .8 : 1);
        if (s.dry) for (const [o, wf, qe] of [[-.42, .5, .55 + .4 * hsh(s.u * 97)], [0, .55, 1], [.48, .42, .4 + .5 * hsh(s.v * 89)]]) ribbon(Pt, s.u, s.v, s.du, s.dv, s.bd, w, s.sm, o, wf, qe); // a dry brush: its bristles break apart
        else ribbon(Pt, s.u, s.v, s.du, s.dv, s.bd, w, s.sm, 0, 1, 1);
        any = true; }
      if (any) { ctx.fillStyle = CCOL(L, c); ctx.globalAlpha = ga * CALPHA[c] * (lining && c !== 'd' ? .7 : 1); ctx.fill(); }
    }
    ctx.globalAlpha = ga; ctx.restore();
    // its front edges: inked, with the inside of the cloth showing as a thin turned-back strip
    for (const ue of [0, 1]) { if (ue < u0 - 1e-3 || ue > u1 + 1e-3) continue;
      if (fine && !lining) { ctx.beginPath(); for (let k = 0; k <= M; k++) { uv(Pt, ue, k / M * .97); const x = UX, y = UY; uv(Pt, ue + (ue ? -.035 : .035), k / M * .97); const ox = (UX - x) * .45, oy = (UY - y) * .45; k ? ctx.lineTo(x + ox, y + oy) : ctx.moveTo(x + ox, y + oy); }
        ctx.strokeStyle = L.cloakSlate; ctx.lineWidth = 1.1; const a0 = ctx.globalAlpha; ctx.globalAlpha = a0 * .55; ctx.stroke(); ctx.globalAlpha = a0; }
      ctx.beginPath(); for (let k = M; k >= 0; k--) { uv(Pt, ue, k / M); k === M ? ctx.moveTo(UX, UY) : ctx.lineTo(UX, UY); } ctx.lineJoin = 'round'; outline(1);
    }
    if (fine) flicks(L, Pt, u0, u1, sp, lining);
  }
  // dry-brush flicks off the cloth's edges: a few short bristle tips at the hem while it hangs, ragged strokes flung off
  // the hem and its trailing edges (away from where it flies) as it whips, longer the faster it goes
  function flicks(L, Pt, u0, u1, sp, lining) {
    const pc = SIM.pc, ln = Math.hypot(LVX, LVY) || 1, nx = -LVX / ln, ny = -LVY / ln, mv = Math.min(1, sp);
    const ga = ctx.globalAlpha; uv(Pt, (u0 + u1) / 2, .5); const cx = UX, cy = UY;
    for (const c of ['b', 's']) {
      ctx.beginPath();
      const nh = Math.round((u1 - u0) * (14 + sp * 22)); // off the hem
      for (let m = 0; m < nh; m++) { const sd = m * 17.1 + Math.floor(pc * 1.3 + hsh(m + 3)) * 5.7 + (lining ? 300 : 0); if ((hsh(sd + 2) < .25) !== (c === 's')) continue;
        const u = u0 + (u1 - u0) * hsh(sd); uv(Pt, u, .8); const ax = UX, ay = UY; uv(Pt, u, .96 + hsh(sd + 4) * .04); let dx = UX - ax, dy = UY - ay; const dl = Math.hypot(dx, dy) || 1; dx = dx / dl + nx * mv * 1.3; dy = dy / dl + ny * mv * 1.3;
        const l2 = Math.hypot(dx, dy) || 1, L2 = (1.6 + hsh(sd + 1) * 3.4) * (1 + sp * 2.2); flick(UX, UY, dx / l2, dy / l2, L2, .5 + hsh(sd + 5) * 1.1); }
      if (sp > .15) for (const ue of [0, .5, 1]) { if (ue < u0 - 1e-3 || ue > u1 + 1e-3) continue; // off its trailing edges
        const ne = Math.round(sp * 7);
        for (let m = 0; m < ne; m++) { const sd = m * 23.3 + ue * 91 + Math.floor(pc * 1.7 + hsh(m + 7)) * 3.1; if ((hsh(sd + 2) < .3) !== (c === 's')) continue;
          const v = .2 + hsh(sd) * .78; uv(Pt, ue, v); const bx = UX, by = UY; uv(Pt, ue, v + .06); let tx = UX - bx, ty = UY - by; const tl = Math.hypot(tx, ty) || 1; let ox = -ty / tl, oy = tx / tl;
          if (ox * (bx - cx) + oy * (by - cy) < 0) { ox = -ox; oy = -oy; } if (ox * nx + oy * ny < -.1) continue;
          let dx = ox * .5 + nx * 1.2, dy = oy * .5 + ny * 1.2; const dl = Math.hypot(dx, dy) || 1; flick(bx - ox * .8, by - oy * .8, dx / dl, dy / dl, (2.5 + hsh(sd + 1) * 6) * sp, .5 + hsh(sd + 3) * 1.2); }
      }
      ctx.fillStyle = c === 's' ? L.cloakSlate : C(lining ? (L.cloakLining || '#1E2029') : L.cloak); ctx.globalAlpha = ga * (c === 's' ? .55 : 1); ctx.fill();
    }
    ctx.globalAlpha = ga;
  }
  function flick(x, y, dx, dy, len, w) { // a tapering bristle stroke, from x, y along dx, dy, bending a little as it goes
    const px = -dy, py = dx, bend = (hsh(x * 7.1 + y) - .5) * len * .3;
    ctx.moveTo(x + px * w, y + py * w); ctx.quadraticCurveTo(x + dx * len * .5 + px * (w * .6 + bend), y + dy * len * .5 + py * (w * .6 + bend), x + dx * len + px * bend * .6, y + dy * len + py * bend * .6);
    ctx.quadraticCurveTo(x + dx * len * .5 - px * (w * .3 - bend), y + dy * len * .5 - py * (w * .3 - bend), x - px * w, y - py * w); ctx.closePath();
  }
  // one half of the cloak, from a front edge to the back strand: whatever of it hangs behind him (the parts round his
  // front are drawn by front(), over his body); with his back to us or knocked down, all of it
  function half(L, Pt, far) {
    const BK = CLOAK_GEO && CLOAK_GEO.BACK;
    if (far) sheet(L, Pt, Math.max(0, CUTF - .04), .5, !BK, false);
    else sheet(L, Pt, .5, Math.min(1, CUTN + .04), false, false);
  }
  // the cloak where it wraps round his front, over his shoulders and down his chest: drawn after his torso, under his weapon arm
  function front(L, g) {
    if (CUTF < 0 && CUTN > 1) return;
    ctx.save(); ctx.translate(0, g.HIP); ctx.rotate(-g.LEAN); ctx.translate(-g.HX, -g.HIP); // (out of the upper body's frame)
    if (CUTF >= 0) sheet(L, loc, 0, Math.min(.5, CUTF), false, true);
    if (CUTN <= 1) sheet(L, loc, Math.max(.5, CUTN), 1, false, true);
    ctx.restore();
  }
  // folds and the cloth's specks on the cowl (precomputed, so nothing shimmers)
  const COWL_SPECK = []; for (let k = 0; k < 26; k++) COWL_SPECK.push([hsh(k + 301), hsh(k + 333), hsh(k + 377) < .35]);
  function hood(L, g, back) { // the hood, bunched in heavy folds behind his neck, or lying in a deep cowl down his back when he faces away
    const { SHO, NECK, CS, Y } = g, P = (fx, lz) => fx * CS - lz * Y;
    const path = () => { ctx.beginPath();
      if (back) { ctx.moveTo(P(-2, 10.5), SHO + 2.6); ctx.quadraticCurveTo(P(-4, 9), NECK - 4.6, P(-3, 0), NECK - 5.6); ctx.quadraticCurveTo(P(-4, -9), NECK - 4.6, P(-2, -10.5), SHO + 2.6);
        ctx.quadraticCurveTo(P(-6, -7), SHO + 10, P(-7, 0), SHO + 17); ctx.quadraticCurveTo(P(-6, 7), SHO + 10, P(-2, 10.5), SHO + 2.6); }
      else { const x = P(-5.4, 0); ctx.moveTo(x + 5, NECK + 2.4); ctx.quadraticCurveTo(x + 3, NECK - 6.6, x - 3.6, NECK - 3.6); ctx.quadraticCurveTo(x - 8.4, SHO - 1, x - 6, SHO + 7); ctx.lineTo(x + 3.6, SHO + 5); ctx.closePath(); } };
    path(); const hg = ctx.createLinearGradient(P(0, 0) + 6, NECK - 6, P(0, 0) - 6, SHO + 12); hg.addColorStop(0, C(shade(L.cloak, .22))); hg.addColorStop(.5, C(L.cloak)); hg.addColorStop(1, C(shade(L.cloak, -.4)));
    ctx.fillStyle = hg; ctx.fill(); outline(.9);
    if (DET()) { ctx.save(); path(); ctx.clip(); ctx.lineCap = 'round'; const x = P(-5.4, 0);
      ctx.strokeStyle = 'rgba(2,2,4,.7)'; ctx.lineWidth = 1.1; ctx.beginPath(); // the deep folds
      if (back) { for (const d of [-1, 1]) { ctx.moveTo(P(-3, d * 7.5), NECK - 2.6); ctx.quadraticCurveTo(P(-5, d * 4), SHO + 6, P(-6.4, d * .8), SHO + 14); ctx.moveTo(P(-3, d * 3.2), NECK - 4.6); ctx.quadraticCurveTo(P(-4.4, d * 2), SHO + 3, P(-5.6, d * .4), SHO + 9); } }
      else { ctx.moveTo(x + 2, NECK - 3.6); ctx.quadraticCurveTo(x - 2.6, NECK - 2, x - 4.6, SHO + 4); ctx.moveTo(x + 3.2, NECK - .6); ctx.lineTo(x - .6, SHO + 4); }
      ctx.stroke();
      ctx.strokeStyle = L.cloakSlate; ctx.globalAlpha *= .7; ctx.lineWidth = .6; ctx.beginPath(); // light along the ridges between them
      if (back) { for (const d of [-1, 1]) { ctx.moveTo(P(-3, d * 5.4), NECK - 3.8); ctx.quadraticCurveTo(P(-5, d * 3), SHO + 4, P(-6, d * .6), SHO + 11); } }
      else { ctx.moveTo(x + 1, NECK - 5); ctx.quadraticCurveTo(x - 3.8, NECK - 3.4, x - 5.6, SHO + 3); }
      ctx.stroke();
      ctx.restore(); }
  }
  function mantle(L, g) { // the cloak where it lies over his shoulders: a thick, bunched cowl round the back of his neck, open at the throat
    front(L, g); // (first, the cloak where it wraps round his front: the cowl lies over its top)
    const { SHO, NECK, CS, Y } = g, P = (fx, lz) => fx * CS - lz * Y, out = [], inn = [];
    for (let i = 0; i <= 14; i++) {
      const th = .74 + (TAU - 1.48) * i / 14, c = Math.cos(th), s = Math.sin(th), ro = 12.4 + Math.sin(th * 5) * .8, ri = 3.4;
      out.push([P(ro * c - 1, ro * s), SHO + 3.4 + 3 * Math.abs(s) - 2 * Math.max(0, -c) + Math.cos(th * 4) * .6]);
      inn.push([P(ri * c + 1.2, ri * s), NECK + 1.4 + .8 * c - 3.2 * Math.max(0, -c)]); // rising behind the neck
    }
    const path = () => { ctx.beginPath(); out.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); for (let i = inn.length - 1; i >= 0; i--) ctx.lineTo(inn[i][0], inn[i][1]); ctx.closePath(); };
    path(); const mg = ctx.createLinearGradient(P(0, -8), NECK - 4, P(0, 8), SHO + 8); mg.addColorStop(0, C(shade(L.cloak, .2))); mg.addColorStop(.6, C(L.cloak)); mg.addColorStop(1, C(shade(L.cloak, -.4)));
    ctx.fillStyle = mg; ctx.fill(); outline(.9);
    if (FINE()) { ctx.save(); path(); ctx.clip(); ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(2,2,4,.75)'; ctx.lineWidth = 1; ctx.beginPath(); // deep folds bunched round the neck
      for (const k of [2, 4, 6, 8, 10, 12]) { ctx.moveTo((inn[k][0] * 3 + out[k][0]) / 4, (inn[k][1] * 3 + out[k][1]) / 4); ctx.quadraticCurveTo((inn[k + 1][0] + out[k][0]) / 2, (inn[k + 1][1] + out[k][1]) / 2 + .6, out[k][0], out[k][1] + .4); } ctx.stroke();
      ctx.strokeStyle = L.cloakSlate; ctx.lineWidth = .55; ctx.beginPath();
      for (const k of [3, 5, 9, 11]) { ctx.moveTo((inn[k][0] * 2 + out[k][0]) / 3, (inn[k][1] * 2 + out[k][1]) / 3); ctx.lineTo((inn[k][0] + out[k][0] * 3) / 4, (inn[k][1] + out[k][1] * 3) / 4); } ctx.stroke();
      for (const g0 of [true, false]) { ctx.beginPath(); for (const [u, v, gold] of COWL_SPECK) { if (gold !== g0) continue; const k = Math.floor(u * 13.99), q = u * 14 - k, ox = lerp(out[k][0], out[k + 1][0], q), oy = lerp(out[k][1], out[k + 1][1], q), ix = lerp(inn[k][0], inn[k + 1][0], q), iy = lerp(inn[k][1], inn[k + 1][1], q);
        ctx.rect(lerp(ix, ox, .2 + v * .7) - .2, lerp(iy, oy, .2 + v * .7) - .2, .4, .4); } ctx.fillStyle = g0 ? 'rgba(214,176,100,.8)' : 'rgba(150,150,160,.55)'; ctx.fill(); }
      ctx.restore(); }
  }
  const cloak = { begin, half, front, hood, mantle, snapshot, sim: SIM };

  const parts = { mail: { doublet }, pants: { trousers }, gauntlets: { vambrace }, waist: { swordbelt } };
  const DEF = { mail: 'doublet', pants: 'trousers', gauntlets: 'vambrace', waist: 'swordbelt' };
  const PART = (slot, L) => parts[slot][L[slot]] || parts[slot][DEF[slot]];
  // the drawing helpers the armor sets share (art_gear.js): TW is set here the way the doublet sets it
  const kit = { DET, FINE, metal, rivet, glint, atop, mixC, along, ring, torsoPath, pelvis, setTW(Y) { TW = .62 + .38 * Math.abs(Y); return TW; }, get TW() { return TW; }, setBend(b) { BEND = b; } };
  return { parts, PART, DEF, leg, legSkin, seat, arm, cloak, roseClasp, kit, LEGW, ARMW, get geo() { return CLOAK_GEO; } };
})();
