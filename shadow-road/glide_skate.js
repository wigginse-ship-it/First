'use strict';
// SKATING ON THE CURRENT. The Pearl's glide (pearl_ng.js) carries him on CUR.vx / CUR.vy; this poses him as a skater
// driven by that real motion, in place of a single static stance:
//  push strokes while he gathers speed: one leg drives out and back behind him while he rides the other, bent, under his
//    hips, then it swings back in and the other pushes; quick hard strokes from a standstill, slower longer ones nearer
//    cruising speed, none at all at top speed (the low, crouched tuck);
//  let go of the stick and he rides on with both feet together, rising a little, then sets an edge to brake as he slows;
//  steer against the way he is going and he skids side-on, weight thrown back against the slide, before pushing off again;
//  curves lean him round them, the inside knee deeper, the arms out for balance.
// Blows, the dodge-fling, jumps and the rest keep their own poses: only the gliding stance is replaced.
// (Loaded after pearl_ng.js and pearl_weapon.js; reads PEARLNG.CUR. window.SKATE holds the live state, for tests.)
(() => {
  if (typeof PEARLNG === 'undefined' || !PEARLNG.CUR) return;
  const PN = PEARLNG, CUR = PN.CUR, T = PN.T, LOCO = ['idle', 'walk', 'run'];
  const SK = { ph: 0, amp: 0, aF: 0, s0: 0, h0: null, turn: 0, curve: 0, skid: 0, coast: 0, brake: 0, on: 0, rate: 0 };
  window.SKATE = SK;
  const sm = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const ap = (v, t, dt, tau) => v + (t - v) * (1 - Math.exp(-dt / tau));
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  // his cruising speed, as the glide works it out
  const cruise = () => { let k = 1; try { k = (W_SPEED[P.w] || 1) * (P.shrink || 1) * (1 + gearStat('speed')) * (typeof roomSlow !== 'undefined' ? roomSlow : 1); } catch (e) {} return T.cruise * k; };
  const active = () => PN.curOn() && P && LOCO.includes(P.state) && P.z <= 0;
  const speed = () => Math.hypot(CUR.vx, CUR.vy / T.YK);

  // ---------------- reading the motion, once per update ----------------
  { const _up = updatePlayer; updatePlayer = function (dt) {
    _up(dt);
    try { step(dt); } catch (e) { console.error(e); }
  }; }
  function step(dt) {
    if (!P || !(dt > 0)) return;
    const s = speed(), on = active() && (s > 3 || CUR.lay > .05);
    SK.on = ap(SK.on, on ? 1 : 0, dt, on ? .05 : .08);
    if (!on) { SK.s0 = s; SK.h0 = null; SK.amp = ap(SK.amp, 0, dt, .1); SK.skid = ap(SK.skid, 0, dt, .1); SK.aF = 0; SK.turn = 0; SK.curve = ap(SK.curve, 0, dt, .1); return; }
    const cr = cruise(), vyE = CUR.vy / T.YK, h = Math.atan2(vyE, CUR.vx), held = CUR.lay > .5;
    SK.aF = ap(SK.aF, (s - SK.s0) / dt, dt, .1); SK.s0 = s;
    // steering against the way he goes: how hard the stick is laid back against the motion
    const dot = s > 1 ? Math.cos(CUR.layA - h) : 1, against = held && s > 45 ? sm((-.25 - dot) / .5) * sm(s / 140) : 0;
    SK.skid = ap(SK.skid, against, dt, against > SK.skid ? .06 : .16);
    // how hard he is gathering speed: full while the current still accelerates him, nothing at top speed or coasting
    const gather = held && against < .2 ? clamp(SK.aF / (T.acc * (cr / T.cruise) * .55), 0, 1) : 0;
    const want = gather * (1 - .3 * clamp(s / cr, 0, 1));
    if (SK.amp < .02 && s < 40) SK.ph = 0;
    SK.amp = ap(SK.amp, want, dt, want > SK.amp ? .05 : .32);
    // stroke rate: quick, choppy strides off the mark, long and slow ones near cruising speed (cycles a second, two strokes each)
    SK.rate = lerp(1.45, .75, sm(s / cr));
    if (SK.amp > .01 || (SK.ph % Math.PI) > .05) SK.ph += TAU * SK.rate * dt * (SK.amp > .01 ? 1 : 1.4);
    if (SK.ph > TAU * 64) SK.ph -= TAU * 64;
    // curves: how fast his heading swings, toward us (+) or away
    if (s > 60 && SK.h0 !== null && against < .3) SK.turn = ap(SK.turn, wrap(h - SK.h0) / dt, dt, .12); else SK.turn = ap(SK.turn, 0, dt, .1);
    SK.h0 = s > 20 ? h : null;
    SK.curve = clamp(SK.turn * P.facing / 1.8, -1, 1) * sm(s / (cr * .6)) * Math.min(1, Math.abs(Math.cos(h)) * 1.6); // (a curve through straight toward or away from us is the walk's own turn)
    // coasting (the stick let go), and the edge he sets to brake as it bleeds away
    SK.coast = ap(SK.coast, held ? 0 : 1, dt, held ? .08 : .2);
    SK.brake = ap(SK.brake, sm((175 - s) / 120) * (s > 6 ? 1 : 0), dt, .15);
    // ice off the edge in a skid or a hard stop
    const spray = Math.max(SK.skid, SK.coast * SK.brake * .6) * clamp(s / 200, 0, 1);
    if (spray > .25 && Math.random() < dt * 36 * spray && parts.length < 400) { const a = h, ux = Math.cos(a), uy = Math.sin(a);
      parts.push({ x: P.x + ux * 10 + rand(-3, 3), y: P.y + rand(-2, 2), z: 1, vx: ux * rand(60, 150) + rand(-30, 30), vy: uy * rand(20, 50) + rand(-12, 12), vz: rand(50, 140), life: .35, max: .35, col: pick(['rgba(230,252,248,.95)', 'rgba(170,230,225,.9)', '#FFFFFF']), size: rand(1.4, 2.6), shape: 'puff', rot: 0, vr: 0 }); }
  }

  // ---------------- the stances ----------------
  // legs in his facing frame: f the near foot, b the far one (+ ahead of the hips), fk/bk the knees, fl/bl a lifted foot
  const READY = { f: 3, b: -3, fk: 7, bk: 7, w: 1.15, sink: 4.5, lean: .26 };   // off the mark: knees bent, ready to drive
  const TUCK = { f: -6, b: 6, fk: 9, bk: 9, w: 1, sink: 8, lean: .45 };         // top speed: the low crouch, weight over both blades
  const RIDE = { f: 2.5, b: -1.5, fk: 4, bk: 4, w: .85, sink: 3, lean: .14 };   // coasting: feet together, rising
  const BRAKE = { f: 9, b: -7, fk: 7, bk: 3, w: 1.6, sink: 5.5, lean: -.14 };   // an edge set: the lead knee bent, the other foot dragged behind
  const SKID = { f: 7, b: -14, fk: 11, bk: 2, w: 1.5, sink: 8.5, lean: .3 };    // side-on, the braking leg braced into the slide behind him
  const KEYS = ['f', 'b', 'fk', 'bk', 'w', 'sink', 'lean'];
  const mix = (A, B, q) => { const o = {}; for (const k of KEYS) o[k] = lerp(A[k], B[k] ?? A[k], q); o.fl = lerp(A.fl || 0, B.fl || 0, q); o.bl = lerp(A.bl || 0, B.bl || 0, q); return o; };
  // one leg through a stroke cycle (u 0..1): drive out behind, swing back in with the foot lifted, then ride it
  function stroke(u, A) {
    const reach = 17 * A;
    if (u < .4) { const e = Math.sin(Math.PI / 2 * u / .4); return { f: lerp(4, -reach, e), k: lerp(10.5, 1.2, e), l: 0 }; }
    if (u < .52) { const r = (u - .4) / .12; return { f: -reach - .8 * r, k: 1.2, l: r * 1.6 * A }; }
    if (u < .72) { const r = (u - .52) / .2, e = .5 - .5 * Math.cos(Math.PI * r); return { f: lerp(-reach - .8, 5.5, e), k: 1.2 + 12 * Math.sin(Math.PI * Math.min(1, r * 1.15)) + 9 * e * (1 - r), l: Math.sin(Math.PI * r) * (3 + 4 * A) + 1.6 * A * (1 - r) }; }
    const r = (u - .72) / .28; return { f: lerp(5.5, 4, r), k: lerp(11.5, 10.5, r), l: 0 };
  }
  const base = (w) => { w = WEAPONS[w] && WEAPONS[w].pearl ? WEAPONS[w].base : w; return w; };

  { const _pp = playerPose; playerPose = function () {
    const pose = _pp();
    if (!P || SK.on < .01 || !active() || pose.down) return pose;
    const s = speed(), cr = cruise(), sn = clamp(s / cr, 0, 1), fw = CUR.vx * P.facing, on = sm(SK.on);
    const amp = SK.amp * (1 - SK.skid) * (1 - SK.coast * .8), skid = SK.skid, coast = SK.coast * (1 - skid), brake = SK.brake * coast;
    const c = SK.curve * (1 - skid), ac = Math.abs(c);
    // the stance under him: from the ready crouch into the tuck as he gathers speed (the tuck's weight distribution held as it was)
    let S = mix(READY, TUCK, sm((s - 70) / (cr * .85 - 70)));
    S.lean = lerp(S.lean, clamp(fw / 650, -.3, .5), sm((s - 120) / 140));
    // the strokes: each leg half a cycle behind the other
    if (amp > .005) {
      const A = lerp(1, .85, sn), uN = ((SK.ph / TAU) % 1 + 1) % 1, uF = (uN + .5) % 1;
      const n = stroke(uN, A), fr = stroke(uF, A), bob = 1.6 * Math.abs(Math.sin(SK.ph * 2));
      S = mix(S, { f: n.f, b: fr.f, fk: n.k, bk: fr.k, fl: n.l, bl: fr.l, w: 1.25, sink: S.sink + 1 + bob * A, lean: Math.max(S.lean, .42 + .1 * (1 - sn)) }, Math.min(1, amp * 1.7));
    }
    if (coast > .005) S = mix(S, RIDE, coast * (1 - brake) * (1 - sn * .55));
    if (brake > .005) { const B = Object.assign({}, BRAKE); if (fw < 0) { B.f = -BRAKE.b; B.b = -BRAKE.f; B.fk = BRAKE.bk; B.bk = BRAKE.fk; B.lean = -BRAKE.lean; } S = mix(S, B, brake); }
    if (skid > .005) S = mix(S, SKID, skid);
    // a curve: the inside knee deeper, the stance wider, the body lower and turned into it
    if (ac > .01) { if (c > 0) S.fk += 4 * ac; else S.bk += 4 * ac; S.w += .45 * ac; S.sink += 1.5 * ac; }
    // ---- set it on the pose, eased in from whatever he was doing ----
    const L0 = pose.legs || { f: 7, b: -7, fk: 3, bk: 3, w: 1 }, q = on;
    const L = { f: lerp(L0.f, S.f, q), b: lerp(L0.b, S.b, q), fk: lerp(L0.fk, S.fk, q), bk: lerp(L0.bk, S.bk, q), w: lerp(L0.w || 1, S.w, q) };
    if (S.fl * q > .05) L.fl = S.fl * q; if (S.bl * q > .05) L.bl = S.bl * q;
    pose.legs = L; pose.walk = 0; pose.run = 0; pose.crouch = 0; delete pose.breath;
    pose.sink = lerp(pose.sink || 0, S.sink, q); pose.lean = lerp(pose.lean || 0, S.lean, q);
    pose.shift = lerp(pose.shift || 0, (skid * 1.8 - brake * 1.2 * Math.sign(fw || 1)) + amp * .6, q);
    pose.flow = clamp(fw / 45, -10, 14);
    pose.yaw = clamp((pose.yaw ?? P.yawV ?? 0) + (c * .4 + skid * .5) * q, -1, 1);
    arms(pose, q, amp, sn, ac, skid, coast, brake);
    return pose;
  }; }

  // ---------------- the arms ----------------
  // counter-swung with the strokes (the near arm comes forward as the near leg drives back), held low and back in the
  // tuck, out for balance on a curve or a skid; a weapon arm keeps its weapon well clear of the street
  // arm/elbow in the tuck, how far the weapon arm may swing; wa: the weapon's own angle on the screen (0 ahead, PI/2 straight
  // down), slow (off the mark, braking) and fast (the tuck): the grip is worked out from it so the weapon holds its line
  // while the arm swings and the body leans, and never dips into the street
  const CARRY = {
    fists: { arm: 2.25, elbow: .35, swing: .8, sElbow: 1.1 },
    sword: { arm: 1.95, elbow: .25, swing: .14, sElbow: .3, slow: -.25, fast: 3.42 - TAU },
    hammer: { arm: 1.85, elbow: .2, swing: .12, sElbow: .25, slow: 2.9, fast: 3.3 },
    staff: { arm: .95, elbow: .55, swing: .22, sElbow: .55, slow: -.02, fast: -.04 },
    rapier: { arm: 1.35, elbow: .3, swing: .35, sElbow: .45, slow: .2, fast: .06 },
  };
  function arms(pose, q, amp, sn, ac, skid, coast, brake) {
    const w = base(P.w), C = CARRY[w] || CARRY.fists, fist = w === 'fists' || !CARRY[w];
    const sw = Math.sin(SK.ph) * amp; // + while the near leg drives back: the near arm forward, the far one back
    const tuck = sm((sn - .55) / .4) * (1 - coast * .6);
    const bal = Math.max(ac, skid, brake * .7);
    // the weapon (near) arm
    if (!pose.armGone && !pose.twoHand) {
      const restA = fist ? lerp(1.45, C.arm, tuck) : C.arm, restE = fist ? lerp(1.2, C.elbow, tuck) : C.elbow;
      let a = restA - sw * C.swing * (fist ? 1.15 : 1), e = lerp(restE, C.sElbow, amp);
      if (fist && amp > .01) e = lerp(e, 1.25 + .35 * Math.max(0, sw), amp);
      if (bal > .01) { a = lerp(a, fist ? .35 : C.arm - .25, bal); e = lerp(e, fist ? .5 : C.elbow, bal); }
      if (C.slow !== undefined) { // (the great sword is carried point-up ahead off the mark, hoisted up and over to trail behind him at speed)
        const fast = sm((sn - .35) / .5) * (1 - Math.max(skid, brake, coast * .5)), wa = lerp(C.slow, C.fast, fast);
        const g0 = (pose.arm ?? 1.1) - (pose.elbow || 0) + (pose.grip || 0) + (pose.lean || 0);
        pose.grip = lerp(g0, wa, q) - (pose.lean || 0) - lerp(pose.arm ?? 1.1, a, q) + lerp(pose.elbow || 0, e, q);
      }
      pose.arm = lerp(pose.arm ?? 1.1, a, q); pose.elbow = lerp(pose.elbow || 0, e, q);
      delete pose.armSwing;
    }
    // the free (far) arm
    if (w === 'rapier' && tuck > .5 && amp < .3 && bal < .3) { if (q > .5) rapierOffHand(pose, 'tuck'); return; } // the fencer's free hand in the small of his back, a speed skater's tuck
    if (!pose.twoHand) {
      let a = lerp(1.5, 2.55, tuck) + sw * (fist ? .95 : .85), e = lerp(.9, .3, tuck);
      if (amp > .01) e = lerp(e, 1.0 - .5 * Math.max(0, sw), amp);
      if (bal > .01) { a = lerp(a, 2.95, bal); e = lerp(e, .25, bal); }
      pose.backArm = lerp(pose.backArm ?? 1.25, a, q); pose.backElbow = lerp(pose.backElbow ?? -.25, e, q);
      if (q > .5) { pose.backHold = 0; pose.openHand = bal > .4 ? 1 : 0; pose.backOver = 0; pose.backWrist = 0; }
    }
  }
})();
