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
  // Seven strands hang from a ring round his shoulders, from the far front edge, across his back, to the near front
  // edge; each strand is five points. Where each point wants to be (its target) comes from the pose: the drape, a flare
  // at the hem, a trail behind him as he moves, a sway with each stride, a slow stir of air. For the live prince those
  // targets are springs: every point keeps its place in the world and is pulled toward its target, the hem softest, so
  // the cloth lags, overshoots and settles; air drag streams it out behind a run and lifts it as he falls; it lies on the
  // street when he goes down. Anything else that draws him (afterimages, menus, portraits) uses a snapshot or the targets.
  const S = 7, M = 4, NP = S * (M + 1), PHIMAX = Math.PI * .62;
  const KJ = [0, 260, 165, 105, 66];          // spring stiffness down a strand (1/s^2)
  const GRAVITY = 230, DRAG_X = 2.9, DRAG_Y = 2.7, DAMP = 1.7, H = 1 / 120;
  const tgt = new Float32Array(NP * 2), loc = new Float32Array(NP * 2), rest = new Float32Array(NP);
  const ix = (i, j) => (i * (M + 1) + j) * 2;
  const SIM = { pts: new Float32Array(NP * 2), sp: new Float32Array((M + 1) * 2), sq: new Float32Array((M + 1) * 2), dA: new Float32Array(M + 1), ok: false, wx: 0, wy: 0, at: 0, acc: 0, f: 1 };
  let CLOAK_GEO = null;
  // the hem is torn: teeth and notches along it, and bristle marks splaying past it, fixed once so they never shimmer
  const JAG = []; for (let k = 0; k < (S - 1) * 3; k++) JAG.push(k % 3 === 1 ? 2.2 + hsh(k) * 2.6 : hsh(k + 40) * .9);
  const STREAKS = [], BRISTLES = [], FOLDS = [], SPECKS = [];
  { // dry-brush streaks down the cloth: slate-blue and grey dragged through the black, a few lighter catches of the light
    const cols = ['s', 't', 'g', 'd', 's', 'g', 'l', 'd', 't'];
    // the long folds hanging straight down the cloth: deep black troughs, a cold catch of light on each ridge
    for (let k = 0; k < 6; k++) FOLDS.push({ u: (k + .3 + hsh(k + 501) * .4) / 6, du: (hsh(k + 507) - .5) * .08, v0: .06 + hsh(k + 511) * .22, v1: .55 + hsh(k + 517) * .4 }); // (a few, of uneven length, so they read as folds, not stripes)
    // specks of gold and grey flecked through the black (CLOAK TEXTURE in the sheet)
    for (let k = 0; k < 64; k++) SPECKS.push({ u: hsh(k + 601), v: .06 + hsh(k + 643) * .9, g: hsh(k + 687) < .45 });
    for (let k = 0; k < 30; k++) { const u = .03 + .94 * hsh(k + 3), v0 = .08 + hsh(k + 9) * .5; STREAKS.push({ u, du: (hsh(k + 17) - .5) * .06, v0, v1: Math.min(1.04, v0 + .25 + hsh(k + 21) * .5), c: cols[k % cols.length], w: .35 + hsh(k + 31) * .9 }); }
    for (let k = 0; k < 34; k++) { const u = (k + hsh(k + 51) * .8) / 34; BRISTLES.push({ u, du: (hsh(k + 57) - .5) * .05, v0: .86 + hsh(k + 61) * .08, v1: 1.02 + hsh(k + 67) * .13, c: k % 4 === 0 ? 's' : k % 7 === 0 ? 'g' : 'b', w: .5 + hsh(k + 71) * 1.1 }); }
    for (let k = 0; k < 12; k++) BRISTLES.push({ trail: 1, v: .25 + .7 * k / 11, len: 2.5 + hsh(k + 81) * 4.5, c: k % 2 ? 's' : 'b', w: .5 + hsh(k + 83) * .9 });
  }
  function targets(L, g) {
    const { Y, CS, HIP, SHO, HX, LEAN, walk, sw, pose, gait, t } = g, cl = Math.cos(LEAN), sl = Math.sin(LEAN);
    const flow = clamp(pose.flow || 0, -12, 20), down = pose.down ? 1 : 0;
    const still = 0, stream = 0, trail = 6.5 + flow * 1.05 + (gait ? (pose.run ? 7 : 2 + Math.abs(sw) * 1.6) : 0);
    const br = pose.breath || 0, air = Math.sin(t * 1.1);
    // a wind off the road while he stands: slow gusts that never quite die away (three slow sines, so it never
    // repeats or flickers), and a billow running down the cloth from the shoulders to the hem with each gust
    const wk = pose.stance && !walk ? 1 : gait ? .3 : pose.down ? 0 : .55;
    const nearK = clamp(Y / .35, 0, 1) * .22; // turned to us, the far half is held behind him: the near half spreads a little wider to keep the cloak as full
    const gust = wk * clamp(.5 + .28 * Math.sin(t * .41) + .18 * Math.sin(t * 1.03 + 1.3) + .1 * Math.sin(t * 2.2 + .4), .05, 1.1);
    for (let i = 0; i < S; i++) {
      const phi = (i / (S - 1) * 2 - 1) * PHIMAX, sp = Math.sin(phi), cp = Math.cos(phi), front = Math.max(0, -cp);
      const fxa = -6.4 * cp + 1.2 - front * 1.5, lza = 11.2 * sp, ya = SHO - 1.6 + (1 - Math.abs(sp)) * .8;
      const ax0 = fxa * CS - lza * Y, ax = HX + ax0 * cl - (ya - HIP) * sl, ay = HIP + ax0 * sl + (ya - HIP) * cl;
      const len = (45 + 3.5 * cp - 6 * front) * 1.12 * (1 - down * .1), // (a little longer: to the calf)
         fl = 18 + .32 * Math.abs(flow) + down * 4 + (pose.stance && !walk ? 6 : 0); // standing, it spreads wide round him
      for (let j = 0; j <= M; j++) {
        const o = ix(i, j); if (!j) { tgt[o] = ax; tgt[o + 1] = ay; continue; }
        const v = j / M, vf = Math.pow(v, .85);
        const sway = (Math.sin(walk * .5 + i * .9 - v * 1.6) * (gait ? 2.6 : 0) + (air * 1.1 + br * .4) * Math.sin(i * 1.7 + v * 2.2 + t * .7)) * v; // it drifts on the air even standing
        const bil = Math.sin(t * 2.05 - v * 3.1 + i * .75) * (.6 + .4 * Math.sin(t * .7 + i)); // the billow, travelling down the cloth
        const ofx = -Math.max(0, cp) * 1.15 * fl * vf + front * (.3 + .45 * still) * fl * vf - trail * Math.pow(v, 1.5) - front * 6.5 * v + sway
          - gust * (3.4 * Math.pow(v, 1.3) + 1.8 * bil * v), olz = sp * fl * vf * (1 + gust * .14 * bil * v + (sp > 0 ? nearK : 0));
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
  // The cloak always hangs behind him: turned toward us, no part of it may stand out past his body on the side away
  // from us (the far side is toward +x then). Every point is held inside the edge of his torso (in the upper body's
  // frame, so it follows a lean), and below the waist inside the line of his hips, with a soft limit that eases the
  // cloth up to the edge rather than creasing it there. Seen side-on or from behind it is left free; flips, spins and
  // falls too.
  function behind(g) {
    const { Y, HX, HIP, SHO, LEAN, pose } = g; if (pose.down || pose.rot || pose.spin || Y <= 0) return;
    const on = clamp(Y / .35, 0, 1), TWc = .62 + .38 * Math.abs(Y), slack = (1 - on) * 40, cl = Math.cos(LEAN), sl = Math.sin(LEAN), S0 = 2.4;
    const edge = (yu) => { const d = yu - SHO; return (d < 7 ? lerp(9.4, 8.8, d / 7) : d < 14.5 ? lerp(8.8, 6, (d - 7) / 7.5) : d < 19 ? lerp(6, 5.6, (d - 14.5) / 4.5) : 5.8) * TWc - 1.2; };
    for (let k = 0; k < NP; k++) {
      const x = loc[k * 2] - HX, y = loc[k * 2 + 1] - HIP, xu = x * cl + y * sl, yu = -x * sl + y * cl + HIP; // into the upper body's frame
      const lim = edge(Math.max(SHO, yu)) + slack, a = lim - S0; if (xu <= a) continue;
      const xn = a + S0 * (1 - Math.exp(-(xu - a) / S0)), dx = xn - xu; // eased up to the edge, never past it
      loc[k * 2] += dx * cl; loc[k * 2 + 1] += dx * sl;
    }
  }
  // work out where the cloak is this frame; returns the points in his drawing frame
  function begin(L, g) {
    CLOAK_GEO = g; targets(L, g);
    const CD = CLOAK_DRAW;
    if (CD && CD.live && !g.pose.noSim) simulate(g, CD);
    else if (CD && (CD.live || g.pose.cloakS)) { const Mrel = CD.Binv.multiply(ctx.getTransform()); if (CD.live && SIM.ok) toLocal(Mrel, SIM.pts, 1); else toLocal(Mrel, g.pose.cloakS, CD.facing); }
    else { loc.set(tgt); if (!g.pose.rot && !g.pose.down) { const gr = (CD ? CD.z : 0) - .5; for (let k = 0; k < NP; k++) if (loc[k * 2 + 1] > gr) loc[k * 2 + 1] = gr; } }
    behind(g);
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
  const CCOL = (L, c) => c === 't' ? (L.cloakTan || '#6E5E48') : c === 's' ? L.cloakSlate : c === 'g' ? L.cloakGrey : c === 'l' ? L.cloakLt : c === 'd' ? '#08080C' : L.cloak;
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
    if (FINE()) { // the folds and the specks, laid in before the dry-brush strokes
      const lo0 = Math.min(u0, u1), hi0 = Math.max(u0, u1); ctx.lineCap = 'round';
      for (const [col, w, off, a] of [['#030205', 2.6, 0, .45], [L.cloakSlate, .6, .045, .25]]) {
        ctx.strokeStyle = col; ctx.lineWidth = w; const ga = ctx.globalAlpha; ctx.globalAlpha = ga * a * (far ? .7 : 1); ctx.beginPath();
        for (const f of FOLDS) { const u = f.u + off; if (u < lo0 || u > hi0) continue; for (let q = 0; q <= 5; q++) { uv(Pt, u + f.du * q / 5, lerp(f.v0, f.v1, q / 5)); q ? ctx.lineTo(UX, UY) : ctx.moveTo(UX, UY); } }
        ctx.stroke(); ctx.globalAlpha = ga;
      }
      for (const gold of [true, false]) { ctx.beginPath(); for (const sp of SPECKS) { if (sp.g !== gold || sp.u < lo0 || sp.u > hi0) continue; uv(Pt, sp.u, sp.v); ctx.rect(UX - .22, UY - .22, .44, .44); }
        ctx.fillStyle = gold ? 'rgba(206,168,96,.75)' : 'rgba(150,152,164,.5)'; ctx.fill(); }
    }
    ctx.beginPath(); ctx.moveTo(Pt[ix(i0, M)], Pt[ix(i0, M) + 1]); // ink only along the front edge: the hem is left to the brush
    for (let j = M - 1; j >= 0; j--) ctx.lineTo(Pt[ix(i0, j)], Pt[ix(i0, j) + 1]);
    ctx.lineJoin = 'round'; outline(1);
    // the brushwork, batched by color so it costs a handful of strokes
    const lo = Math.min(u0, u1), hi = Math.max(u0, u1), det = DET(), fine = FINE(), few = !fine;
    ctx.lineCap = 'round';
    for (const c of ['d', 's', 't', 'g', 'l', 'b']) {
      if (!det && c !== 'b') continue;
      ctx.strokeStyle = det ? CCOL(L, c) : C(L.cloak); ctx.globalAlpha = c === 'l' ? .13 : c === 'b' ? 1 : c === 'd' ? .75 : .26;
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
        if (any) { ctx.lineWidth = c === 'b' ? (wcls ? 1.3 : .8) : wcls ? 2 : 1.1; ctx.stroke(); } // broad, loaded strokes of paint
      }
    }
    ctx.globalAlpha = 1;
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
  const cloak = { begin, half, hood, mantle, snapshot, sim: SIM };

  const parts = { mail: { doublet }, pants: { trousers }, gauntlets: { vambrace }, waist: { swordbelt } };
  const DEF = { mail: 'doublet', pants: 'trousers', gauntlets: 'vambrace', waist: 'swordbelt' };
  const PART = (slot, L) => parts[slot][L[slot]] || parts[slot][DEF[slot]];
  // the drawing helpers the armor sets share (art_gear.js): TW is set here the way the doublet sets it
  const kit = { DET, FINE, metal, rivet, glint, atop, mixC, along, ring, torsoPath, pelvis, setTW(Y) { TW = .62 + .38 * Math.abs(Y); return TW; }, get TW() { return TW; }, setBend(b) { BEND = b; } };
  return { parts, PART, DEF, leg, legSkin, seat, arm, cloak, roseClasp, kit, LEGW, ARMW, get geo() { return CLOAK_GEO; } };
})();
