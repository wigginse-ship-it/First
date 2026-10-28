'use strict';
// ---------- the machines: sky drones (and their lantern and prism kin), the cog spider, the kettle tank and the
// brass automaton (and its mossy cousin, the sentinel). Light falls from the upper right; every plate gets a hard
// shadow plane on its lower-left, a rim of light on its upper-right, rivets, panel lines and a little grime.
(function () {
  const DET = () => !FLASH && !TINT && !LITE;
  // a cel-shaded plate. build() adds the outline of the shape to the current path (no beginPath).
  // The shadow plane is the part of the shape that the shape, slid up and to the right, no longer covers.
  function plate(build, col, o) {
    o = o || {};
    const sd = o.sd ?? 2.4, hd = o.hd ?? 1, ow = o.ow ?? 1.3;
    ctx.beginPath(); build(); ctx.fillStyle = C(col); ctx.fill();
    if (DET()) {
      ctx.save(); ctx.beginPath(); build(); ctx.clip();
      if (sd) { ctx.beginPath(); build(); ctx.save(); ctx.translate(sd, -sd); build(); ctx.restore(); ctx.fillStyle = shade(col, o.dk ?? -.34); ctx.fill('evenodd'); }
      if (o.sd2) { ctx.beginPath(); build(); ctx.save(); ctx.translate(o.sd2, -o.sd2); build(); ctx.restore(); ctx.fillStyle = shade(col, -.55); ctx.fill('evenodd'); }
      if (hd) { ctx.beginPath(); build(); ctx.save(); ctx.translate(-hd, hd); build(); ctx.restore(); ctx.fillStyle = shade(col, o.hi ?? .42); ctx.fill('evenodd'); }
      if (o.grime) { ctx.fillStyle = 'rgba(40,26,20,.22)'; ctx.beginPath(); o.grime(); ctx.fill(); }
      if (o.inner) o.inner();
      ctx.restore();
    } else if (o.inner && o.always) { ctx.save(); ctx.beginPath(); build(); ctx.clip(); o.inner(); ctx.restore(); }
    ctx.beginPath(); build(); outline(ow);
  }
  function rivet(x, y, col, r) {
    r = r || .95;
    ctx.fillStyle = C(shade(col, -.5)); circle(x, y, r); ctx.fill();
    if (DET()) { ctx.fillStyle = shade(col, .6); circle(x + r * .3, y - r * .3, r * .45); ctx.fill(); }
  }
  function line(pts, col, w) { ctx.strokeStyle = C(col); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.stroke(); }
  // a soft additive glow, painted only in colour (never during the hit flash or as an afterimage)
  function glow(x, y, r, rgb, a) {
    if (!DET() || a <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; circle(x, y, r); ctx.fill(); ctx.restore();
  }
  // a glowing lens in a dark steel housing: glass, hot core and a pin of specular light
  function lens(x, y, r, col, rgb, heat, housing) {
    ctx.fillStyle = C(housing || '#3A3440'); circle(x, y, r + 1.6); ctx.fill(); outline(1.2);
    const g = ctx.createRadialGradient(x + r * .25, y - r * .2, 0, x, y, r);
    g.addColorStop(0, C('#FFFFFF')); g.addColorStop(.35, C(col)); g.addColorStop(1, C(shade(col, -.55)));
    ctx.fillStyle = g; circle(x, y, r); ctx.fill();
    if (DET()) { ctx.fillStyle = 'rgba(255,255,255,.9)'; circle(x + r * .4, y - r * .45, Math.max(.5, r * .22)); ctx.fill(); }
    glow(x, y, r * (2.4 + heat * 2.2), rgb, .35 + heat * .5);
  }
  // a toothed gear
  function gearPath(x, y, r, n, rot) {
    for (let i = 0; i < n * 2; i++) {
      const a0 = rot + i / (n * 2) * TAU, a1 = rot + (i + 1) / (n * 2) * TAU, rr = i % 2 ? r * .78 : r;
      if (i === 0) ctx.moveTo(x + Math.cos(a0) * rr, y + Math.sin(a0) * rr); else ctx.lineTo(x + Math.cos(a0) * rr, y + Math.sin(a0) * rr);
      ctx.lineTo(x + Math.cos(a1) * rr, y + Math.sin(a1) * rr);
    }
    ctx.closePath();
  }
  function gear(x, y, r, n, rot, col) {
    plate(() => gearPath(x, y, r, n, rot), col, { sd: r * .18, hd: .7, ow: 1 });
    ctx.fillStyle = C(shade(col, -.45)); circle(x, y, r * .32); ctx.fill(); outline(.8);
    rivet(x, y, col, r * .14);
  }
  const red = (w) => w > .05;

  // ================= SKY DRONE / LANTERN DRONE / SHARD DRONE =================
  const DRONE_PAL = {
    sky:     { hull: '#C4CAD6', band: '#B88A48', steel: '#5E6678', lens: '#5EEAD8', lrgb: '94,234,216', jet: '120,220,255' },
    lantern: { hull: '#6E5A46', band: '#D8AA55', steel: '#4A4038', lens: '#FFB04A', lrgb: '255,176,74', jet: '255,170,90' },
    prism:   { hull: '#8C7AB8', band: '#5A5070', steel: '#3E3654', lens: '#F07AE8', lrgb: '240,122,232', jet: '200,150,255' },
  };
  function rotor(x, y, t, col, k) {
    // a hub on a pylon and a blurred blade disc with two blades caught mid-turn
    const sp = t * 46 + k;
    if (DET()) { ctx.fillStyle = 'rgba(225,235,250,.32)'; ell(x, y - 1, 12, 2.2); ctx.fill(); }
    const c1 = Math.cos(sp) * 12, c2 = Math.cos(sp + Math.PI / 2) * 12;
    ctx.lineCap = 'round';
    line([x - c1, y - 1 - Math.sin(sp) * .8, x + c1, y - 1 + Math.sin(sp) * .8], OUT, 3);
    line([x - c1, y - 1 - Math.sin(sp) * .8, x + c1, y - 1 + Math.sin(sp) * .8], shade(col, .3), 1.6);
    line([x - c2, y - 1, x + c2, y - 1], shade(col, .1), 1.2);
    plate(() => { rrect(x - 2.6, y - 2.6, 5.2, 4.6, 1.5); }, col, { sd: 1, hd: .6, ow: 1 });
  }
  function prismVane(x, y, t, k, P) {
    const s = Math.cos(t * 5 + k), w = 3 + Math.abs(s) * 3.5;
    plate(() => { ctx.moveTo(x, y - 8); ctx.lineTo(x + w, y - 1); ctx.lineTo(x, y + 3); ctx.lineTo(x - w, y - 1); ctx.closePath(); }, s > 0 ? '#A8E4EC' : '#C89AE8', { sd: 1.6, hd: .8, ow: 1 });
    glow(x, y - 2, 7, P.jet, .3);
  }
  CREATURES.drone = function (e, a) {
    a = a || {};
    const kind = e.def.pal === 'lantern' ? 'lantern' : e.def.pal === 'prism' ? 'prism' : 'sky', P = DRONE_PAL[kind];
    const t = a.t || 0, w = a.wind || 0, hot = red(w);
    const tilt = w ? -.24 * w : a.atk ? .14 : Math.sin(t * 2) * .07, bob = Math.sin(t * 3.1) * 1.2;
    ctx.save(); ctx.translate(a.atk ? -2 : 0, -12 + bob); ctx.rotate(tilt);
    // ---- below the hull: thruster flame, or the lantern on its chain
    if (kind === 'lantern') {
      const sway = Math.sin(t * 2.3) * .18;
      ctx.save(); ctx.translate(-1, 8); ctx.rotate(sway);
      ctx.strokeStyle = C('#3A3028'); ctx.lineWidth = 1.2; ctx.setLineDash([1.6, 1.2]); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 7); ctx.stroke(); ctx.setLineDash([]);
      const fl = .75 + Math.sin(t * 17) * .12 + Math.sin(t * 29) * .08;
      glow(0, 14, 16, '255,170,70', .45 * fl + w * .3);
      // cage: a domed brass cap, glass, bars and a base
      plate(() => { ctx.moveTo(-5, 9); ctx.quadraticCurveTo(0, 4, 5, 9); ctx.lineTo(5.6, 10); ctx.lineTo(-5.6, 10); ctx.closePath(); }, P.band, { sd: 1, hd: .6, ow: 1 });
      const lg = ctx.createRadialGradient(0, 14.5, .5, 0, 14.5, 5.5); lg.addColorStop(0, C('#FFF6D0')); lg.addColorStop(.5, C('#FFB850')); lg.addColorStop(1, C('#C8602A'));
      ctx.fillStyle = lg; rrect(-4.2, 10, 8.4, 9, 2); ctx.fill(); outline(1);
      for (const x of [-2.2, 0, 2.2]) line([x, 10.2, x, 18.8], '#3A3028', .8);
      plate(() => { rrect(-5.2, 18.6, 10.4, 2.4, .8); }, P.band, { sd: .8, hd: .5, ow: 1 });
      ctx.restore();
    } else {
      const fl = 9 + Math.sin(t * 40) * 2.5 + w * 4;
      if (DET()) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const jg = ctx.createLinearGradient(0, 8, 0, 8 + fl); jg.addColorStop(0, `rgba(255,255,255,.9)`); jg.addColorStop(.3, `rgba(${P.jet},.7)`); jg.addColorStop(1, `rgba(${P.jet},0)`);
        ctx.fillStyle = jg; ctx.beginPath(); ctx.moveTo(-5.4, 8); ctx.quadraticCurveTo(-1.5, 8 + fl * 1.6, 2.4, 8); ctx.closePath(); ctx.fill(); ctx.restore();
      }
      plate(() => { ctx.moveTo(-6, 5); ctx.lineTo(3, 5); ctx.lineTo(4, 9.5); ctx.lineTo(-7, 9.5); ctx.closePath(); }, P.steel, { sd: 1.4, hd: .7, ow: 1.1 }); // nozzle bell
      line([-6, 7.8, 3.6, 7.8], shade(P.steel, .35), .6);
    }
    // ---- rotors (sky, lantern) or floating crystal vanes (prism), behind the hull
    if (kind === 'prism') {
      prismVane(-11, -11, t, 0, P); prismVane(11, -12, t, 1.7, P);
    } else {
      for (const s of [-1, 1]) { ctx.lineCap = 'round'; limb([s * 5, -6, s * 12, -12, s * 13, -15], P.steel, 2.4); }
      rotor(-13, -16, t, P.steel, 0); rotor(13, -16, t, P.steel, 1.3);
    }
    // ---- the gun under the chin
    const rec = a.atk ? -2.5 : 0;
    plate(() => { rrect(5 + rec, 4.5, 13, 3.6, 1.2); }, P.steel, { sd: 1.2, hd: .6, ow: 1.1 });
    plate(() => { rrect(15 + rec, 3.8, 3.4, 5, 1); }, kind === 'sky' ? P.band : P.steel, { sd: .8, hd: .5, ow: 1 }); // muzzle collar
    if (hot) glow(19 + rec, 6.3, 5 + w * 5, '255,90,90', .6 * w);
    // ---- the hull
    if (kind === 'prism') {
      // a faceted crystal clasped in a dark iron cage
      const pts = [-15, 0, -9, -10, 4, -12, 15, -3, 10, 8, -7, 9];
      const hullP = () => { ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); };
      ctx.beginPath(); hullP(); ctx.fillStyle = C(P.hull); ctx.fill();
      const fc = [1, -1], facets = [['#B8A8E8', 2, 3], ['#D8CCF8', 3, 4], ['#9C88D0', 4, 5], ['#6E5AA0', 5, 0], ['#5A4890', 0, 1], ['#8A7AC4', 1, 2]];
      for (const [c, i0, i1] of facets) { ctx.beginPath(); ctx.moveTo(fc[0], fc[1]); ctx.lineTo(pts[i0 * 2], pts[i0 * 2 + 1]); ctx.lineTo(pts[i1 * 2], pts[i1 * 2 + 1]); ctx.closePath(); ctx.fillStyle = C(c); ctx.fill(); }
      if (DET()) { ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(4, -11); ctx.lineTo(13.5, -3); ctx.moveTo(-8, -9); ctx.lineTo(1, -1); ctx.stroke(); glow(2, -1, 14, '200,140,255', .25); }
      ctx.beginPath(); hullP(); outline(1.4);
      // the iron clasp band and its rivets
      plate(() => { ctx.moveTo(-4, -11); ctx.lineTo(0, -11.6); ctx.lineTo(-2, 9); ctx.lineTo(-6, 9); ctx.closePath(); }, P.steel, { sd: 1, hd: .6, ow: 1.1 });
      plate(() => { ctx.moveTo(-14, -1); ctx.lineTo(14.6, -3.6); ctx.lineTo(13.4, 0); ctx.lineTo(-13.6, 2.6); ctx.closePath(); }, P.steel, { sd: 1, hd: .6, ow: 1.1 });
      for (const [x, y] of [[-10, 1.4], [-3.4, .6], [5, -.4], [11, -1.4]]) rivet(x, y, '#9088A8', .8);
      // shards growing out of its back
      for (const [x, y, h, r] of [[-10, -7, 8, -.7], [-5, -10, 6, -.25]]) plate(() => { ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.moveTo(-2, 1); ctx.lineTo(0, -h); ctx.lineTo(2.4, 1); ctx.closePath(); ctx.restore(); }, '#C8E8F2', { sd: 1, hd: .5, ow: 1 });
      lens(9, -1.5, 3.4 + w, hot ? '#FF5A6A' : P.lens, hot ? '255,90,106' : P.lrgb, w, P.steel);
      ctx.restore(); return;
    }
    const hb = () => { ctx.ellipse(0, 0, 15.5, 10, 0, 0, TAU); };
    plate(hb, P.hull, {
      sd: 3, sd2: kind === 'lantern' ? 0 : 0, hd: 1.2, ow: 1.6,
      grime: () => { ctx.ellipse(-4, 8, 11, 3, 0, 0, TAU); },
      inner: () => {
        // panel lines and a riveted band round the belly
        ctx.strokeStyle = shade(P.hull, -.45); ctx.lineWidth = .7; ctx.beginPath();
        ctx.moveTo(-6, -9.6); ctx.quadraticCurveTo(-9, 0, -6, 9.6); ctx.moveTo(-15, -2); ctx.quadraticCurveTo(-4, -5, 4, -9); ctx.stroke();
        if (kind === 'lantern') { ctx.fillStyle = 'rgba(70,90,60,.35)'; ell(-9, 5, 4, 2); ctx.fill(); ell(3, 8, 3, 1.5); ctx.fill(); } // verdigris and soot
      },
    });
    plate(() => { ctx.moveTo(-15.4, 1); ctx.quadraticCurveTo(0, 4.6, 15.4, 1); ctx.lineTo(15, 4); ctx.quadraticCurveTo(0, 7.8, -14.8, 4); ctx.closePath(); }, P.band, { sd: 1.1, hd: .6, ow: 1.1 });
    for (let i = 0; i < 6; i++) { const x = -12 + i * 4.8; rivet(x, 2.6 + (1 - Math.pow(x / 15, 2)) * 2.4, P.band, .75); }
    // a top hatch and an exhaust grille at the back
    plate(() => { ctx.moveTo(-6, -9); ctx.quadraticCurveTo(-1, -14.5, 5, -9.4); ctx.closePath(); }, kind === 'sky' ? P.band : shade(P.hull, .15), { sd: 1, hd: .6, ow: 1.1 });
    rivet(-.5, -11, P.band, .7);
    plate(() => { rrect(-17.5, -4, 4, 6, 1); }, P.steel, { sd: .8, hd: .5, ow: 1 });
    for (const y of [-2.6, -.8, 1]) line([-17, y, -14.4, y], OUT, .5);
    if (kind === 'lantern') { // a little crown of spikes on the lantern-drone's hull
      for (const x of [-3, 1, 5]) plate(() => { ctx.moveTo(x - 1.4, -9.4 + Math.abs(x) * .12); ctx.lineTo(x, -15); ctx.lineTo(x + 1.4, -9.6); ctx.closePath(); }, P.band, { sd: .6, hd: .4, ow: .9 });
    }
    // the lens, sunk under a heavy brow plate so it glares
    lens(10, -.5, 4.2 + w * .8, hot ? '#FF4A5A' : P.lens, hot ? '255,74,90' : P.lrgb, w, P.steel);
    plate(() => { ctx.moveTo(3.6, -6.4); ctx.lineTo(13.2, -7.6); ctx.lineTo(16, -3.4); ctx.lineTo(12.6, -3); ctx.quadraticCurveTo(9, -4.8, 5.6, -3.4); ctx.closePath(); }, kind === 'sky' ? '#8E96A8' : P.band, { sd: 1, hd: .7, ow: 1.1 });
    ctx.restore();
  };

  // ================= COG SPIDER =================
  const SP = { shell: '#B88A48', steel: '#6E7486', dark: '#3E3A44', joint: '#C99B55', lens: '#FF6A3A' };
  CREATURES.spider = function (e, a) {
    a = a || {};
    const t = a.t || 0, w = a.wind || 0, ph = (a.walk || 0) * 1.4;
    ctx.save();
    // winding up it crouches and rears its head; striking it lunges forward
    ctx.translate(a.atk ? 5 : -w * 2, 0);
    const bodyY = -19 + w * 3 + (a.atk ? -2 : 0), rear = a.atk ? .12 : -.22 * w;
    const legs = (side) => {
      const far = side < 0, col = far ? shade(SP.steel, -.3) : SP.steel, jc = far ? shade(SP.joint, -.3) : SP.joint;
      const hipX = [-8, -3, 3, 8], kneeX = [-19, -10, 10, 19], footX = [-25, -14, 13, 25];
      for (let i = 0; i < 4; i++) {
        const p = ph + i * Math.PI / 2 + (far ? Math.PI : 0), lift = Math.max(0, Math.cos(p)) * 3.5, st = Math.sin(p) * 4;
        const hx = hipX[i] + (far ? -2 : 0), hy = bodyY + 2, kx = kneeX[i] + st * .5 + (far ? -2 : 0), ky = -35 + w * 3 - lift + (i === 0 || i === 3 ? 2 : 0);
        const fx = footX[i] + st + (far ? -3 : 0), fy = -lift - (far ? 1 : 0);
        // reach forward with the front legs while winding up
        const kx2 = i === 3 ? kx + w * 3 : kx, ky2 = i === 3 ? ky - w * 5 : ky, fx2 = i === 3 ? fx + w * 4 : fx, fy2 = i === 3 ? fy - w * 8 : fy;
        seg(hx, hy, kx2, ky2, 4.4, 3.4, col, .4);
        seg(kx2, ky2, fx2, fy2 - 1.5, 3.2, 1.6, col, .3);
        // a hooked steel claw for a foot
        ctx.beginPath(); ctx.moveTo(fx2 - 1.4, fy2 - 2.4); ctx.lineTo(fx2 + (i < 2 ? -1.6 : 1.6), fy2 + .2); ctx.lineTo(fx2 + 1.2, fy2 - 2.2); ctx.closePath(); ctx.fillStyle = C(SP.dark); ctx.fill(); outline(.8);
        // the brass knee joint with a piston running down the thigh
        if (!far && DET()) line([hx + 1, hy - 2, (hx + kx2) / 2 + 1, (hy + ky2) / 2 - 1.5], shade(SP.steel, .45), .7);
        ctx.fillStyle = C(jc); circle(kx2, ky2, 2.3); ctx.fill(); outline(.9);
        rivet(kx2, ky2, jc, .7);
      }
    };
    legs(-1); legs(1);
    ctx.save(); ctx.translate(2, bodyY); ctx.rotate(rear); ctx.translate(-2, -bodyY);
    // ---- the abdomen: a brass boiler with riveted bands and a window onto its spinning gears
    const ax = -9, ay = bodyY - 1;
    plate(() => { ctx.ellipse(ax, ay, 13.5, 11, -.15, 0, TAU); }, SP.shell, {
      sd: 3, hd: 1.2, ow: 1.6, grime: () => { ctx.ellipse(ax - 3, ay + 8, 10, 3, 0, 0, TAU); },
      inner: () => { ctx.strokeStyle = shade(SP.shell, -.45); ctx.lineWidth = .7; ctx.beginPath(); ctx.ellipse(ax, ay, 12.5, 10.5, -.15, -1.9, -1.2); ctx.stroke(); },
    });
    for (const k of [-6, 5]) {
      plate(() => { ctx.ellipse(ax + k, ay, 2, 10.2 - Math.abs(k) * .35, -.15, 0, TAU); }, shade(SP.shell, -.12), { sd: .8, hd: .6, ow: 1 });
      for (const dy of [-6, 0, 6]) rivet(ax + k + .2, ay + dy, SP.shell, .65);
    }
    // the gear window
    ctx.fillStyle = C('#241A1C'); circle(ax - .5, ay + .5, 5.2); ctx.fill(); outline(1.1);
    ctx.save(); circle(ax - .5, ay + .5, 5); ctx.clip();
    gear(ax - 2, ay + 1.5, 4.6, 8, t * 2.4, '#D8AA55'); gear(ax + 2.6, ay - 2.4, 3, 6, -t * 3.7, '#9AA2B4');
    ctx.restore();
    ctx.strokeStyle = C(SP.joint); ctx.lineWidth = 1.2; circle(ax - .5, ay + .5, 5.4); ctx.stroke();
    // an exhaust spout on top, puffing
    plate(() => { ctx.moveTo(ax - 7, ay - 8); ctx.lineTo(ax - 9, ay - 14); ctx.lineTo(ax - 5.6, ay - 14.4); ctx.lineTo(ax - 4, ay - 9.4); ctx.closePath(); }, SP.steel, { sd: .8, hd: .5, ow: 1 });
    if (DET()) { const pf = (t * 1.4) % 1; ctx.fillStyle = `rgba(240,236,228,${.55 * (1 - pf)})`; circle(ax - 8 - pf * 4, ay - 16 - pf * 8, 1.6 + pf * 3); ctx.fill(); }
    // ---- the head-plate (cephalothorax): dark steel with a cluster of lenses and pincer mandibles
    const hx = 7, hy = bodyY;
    const op = a.atk ? .55 : w * .35 + Math.sin(t * 4) * .05;
    for (const s of [-1, 1]) { // the mandibles, the far one darker
      ctx.save(); ctx.translate(hx + 8, hy + 3); ctx.rotate(s * op * .8 + (s < 0 ? .1 : 0));
      plate(() => { ctx.moveTo(-1, -1.6 * s); ctx.quadraticCurveTo(6, -2 * s, 8, 3 * s + 1); ctx.lineTo(5.4, 1.4 * s + .6); ctx.quadraticCurveTo(4, .6 * s, -1, 1.6 * s); ctx.closePath(); }, s < 0 ? shade(SP.dark, .3) : '#8A8E9E', { sd: .8, hd: .5, ow: 1 });
      ctx.restore();
    }
    plate(() => { ctx.moveTo(hx - 7, hy - 6); ctx.quadraticCurveTo(hx + 1, hy - 10.5, hx + 10, hy - 4); ctx.quadraticCurveTo(hx + 13, hy + 1, hx + 9, hy + 5.6); ctx.lineTo(hx - 6, hy + 6); ctx.quadraticCurveTo(hx - 9, hy, hx - 7, hy - 6); ctx.closePath(); }, SP.steel, {
      sd: 2.2, hd: 1, ow: 1.5,
      inner: () => { ctx.strokeStyle = shade(SP.steel, -.5); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(hx - 1, hy - 8); ctx.quadraticCurveTo(hx + 1, hy, hx - 1, hy + 6); ctx.stroke(); },
    });
    rivet(hx - 3.6, hy - 4, SP.steel); rivet(hx - 4, hy + 2.6, SP.steel);
    // a brass brow ridge and the lenses beneath
    const lc = red(w) || a.atk ? '#FF3A4A' : SP.lens, lr = red(w) || a.atk ? '255,60,70' : '255,120,60';
    lens(hx + 7.4, hy - 1.2, 2.6 + w * .5, lc, lr, w, SP.dark);
    lens(hx + 3.4, hy - 3.6, 1.5, lc, lr, w * .5, SP.dark);
    lens(hx + 4, hy + 1.8, 1.3, lc, lr, w * .5, SP.dark);
    plate(() => { ctx.moveTo(hx + .6, hy - 6.6); ctx.lineTo(hx + 9, hy - 6.4); ctx.lineTo(hx + 11.4, hy - 3.4); ctx.lineTo(hx + 4, hy - 5); ctx.closePath(); }, SP.joint, { sd: .8, hd: .5, ow: 1 });
    ctx.restore();
    ctx.restore();
  };

  // ================= KETTLE TANK =================
  const TK = { brass: '#B88A48', copper: '#A8603A', steel: '#727A8C', dark: '#3A3236', tread: '#2E2A2C', teal: '#4E9A90' };
  CREATURES.tank = function (e, a) {
    a = a || {};
    const t = a.t || 0, w = a.wind || 0, roll = (a.walk || 0) * 3, hot = red(w);
    const shake = w > .6 ? Math.sin(t * 90) * .6 * w : 0;
    ctx.save(); ctx.translate(shake, a.atk ? -1 : 0);
    // ---- the chimney at the back with its smoke
    const chx = -19;
    if (DET()) for (let i = 0; i < 3; i++) {
      const p = (t * .9 + i / 3) % 1, r = 3 + p * 6;
      ctx.fillStyle = `rgba(${hot ? '90,80,84' : '236,230,222'},${.6 * (1 - p)})`; circle(chx + Math.sin(t * 2 + i) * 2 - p * 8, -66 - p * 22, r); ctx.fill();
    }
    plate(() => { ctx.moveTo(chx - 3.2, -42); ctx.lineTo(chx - 2.6, -62); ctx.lineTo(chx + 2.6, -62); ctx.lineTo(chx + 3.2, -42); ctx.closePath(); }, TK.steel, { sd: 1.6, hd: .8, ow: 1.3 });
    plate(() => { ctx.moveTo(chx - 4.6, -62); ctx.lineTo(chx - 3.4, -67); ctx.lineTo(chx + 3.4, -67); ctx.lineTo(chx + 4.6, -62); ctx.closePath(); }, TK.dark, { sd: 1, hd: .6, ow: 1.2 }); // flared cap
    plate(() => { rrect(chx - 3.6, -53, 7.2, 2.4, .6); }, TK.brass, { sd: .8, hd: .5, ow: 1 });
    if (hot) glow(chx, -66, 7, '255,140,60', .5 * w);
    // ---- the kettle handle arching over the boiler
    ctx.lineCap = 'round';
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 5.2; ctx.beginPath(); ctx.moveTo(-10, -46); ctx.bezierCurveTo(-10, -60, 8, -60, 8, -46); ctx.stroke();
    ctx.strokeStyle = C(TK.brass); ctx.lineWidth = 3; ctx.stroke();
    if (DET()) { ctx.strokeStyle = shade(TK.brass, .5); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-1, -56.4); ctx.bezierCurveTo(4, -56.4, 7, -53, 7.2, -48); ctx.stroke(); }
    // ---- treads: a rubber-and-iron track with links that crawl, and spoked road wheels
    const trk = () => { rrect(-29, -15, 58, 15, 7.5); };
    ctx.beginPath(); trk(); ctx.fillStyle = C(TK.tread); ctx.fill();
    ctx.save(); ctx.beginPath(); trk(); ctx.clip();
    const off = ((a.walk || 0) * 4) % 4.4;
    ctx.fillStyle = C('#4A4446');
    for (let x = -30 + off; x < 31; x += 4.4) { ctx.fillRect(x, -15, 2.2, 2.2); ctx.fillRect(x - off * 2 + 1, -2.2, 2.2, 2.2); }
    ctx.restore();
    ctx.beginPath(); trk(); outline(1.8);
    for (let i = -2; i <= 2; i++) {
      const x = i * 11, r = i === 2 || i === -2 ? 5.6 : 4.8;
      plate(() => { ctx.arc(x, -7.5, r, 0, TAU); }, '#5A5458', { sd: 1.2, hd: .6, ow: 1.2 });
      ctx.save(); ctx.translate(x, -7.5); ctx.rotate(roll);
      ctx.fillStyle = C(TK.brass); circle(0, 0, r * .62); ctx.fill(); outline(.8);
      ctx.strokeStyle = C(shade(TK.brass, -.5)); ctx.lineWidth = .9; ctx.beginPath(); for (let k = 0; k < 3; k++) { const an = k / 3 * TAU; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(an) * r * .6, Math.sin(an) * r * .6); } ctx.stroke();
      ctx.restore(); rivet(x, -7.5, TK.brass, .9);
    }
    // a riveted mudguard skirt over the tracks
    plate(() => { ctx.moveTo(-31, -19); ctx.lineTo(29, -19); ctx.lineTo(31, -14.6); ctx.lineTo(-29, -14.6); ctx.closePath(); }, TK.steel, {
      sd: 1.4, hd: .7, ow: 1.3, grime: () => { ctx.rect(-31, -16.4, 62, 2); },
    });
    for (let i = 0; i < 8; i++) rivet(-26 + i * 7.4, -16.8, TK.steel, .75);
    // ---- the boiler: a fat riveted brass drum with a domed top
    const boiler = () => { ctx.moveTo(-25, -19); ctx.lineTo(-26, -38); ctx.quadraticCurveTo(-25, -47, -14, -48); ctx.lineTo(8, -48); ctx.quadraticCurveTo(18, -47, 18, -38); ctx.lineTo(17, -19); ctx.closePath(); };
    plate(boiler, TK.brass, {
      sd: 4, hd: 1.4, ow: 2,
      grime: () => { ctx.moveTo(-26, -24); ctx.quadraticCurveTo(-4, -28, 18, -22); ctx.lineTo(18, -18); ctx.lineTo(-26, -18); ctx.closePath(); ctx.moveTo(-3, -48); ctx.quadraticCurveTo(-5, -40, -2, -36); ctx.lineTo(0, -48); },
      inner: () => { // rivet seams and a dent
        ctx.strokeStyle = shade(TK.brass, -.4); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-26, -33); ctx.lineTo(18, -33); ctx.stroke();
        ctx.strokeStyle = shade(TK.brass, .5); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(-26, -32.2); ctx.lineTo(18, -32.2); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,240,200,.55)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(12, -45); ctx.quadraticCurveTo(15.6, -42, 15.4, -36); ctx.stroke(); // the specular streak
      },
    });
    for (let i = 0; i < 7; i++) rivet(-23 + i * 6.6, -34.4, TK.brass, .75);
    for (const x of [-16, 4]) { plate(() => { rrect(x - 1.6, -47.6, 3.2, 28.4, 1); }, TK.copper, { sd: .9, hd: .6, ow: 1 }); for (const y of [-43, -37, -28, -23]) rivet(x, y, TK.copper, .7); }
    // a teal enamel stripe, chipped
    plate(() => { ctx.rect(-25.6, -30, 43, 3.6); }, TK.teal, { sd: .8, hd: .6, ow: 1.1, inner: () => { ctx.fillStyle = shade(TK.brass, -.1); ctx.fillRect(-8, -30, 3, 1.4); ctx.fillRect(10, -27.6, 2.4, 1.2); } });
    // the pressure gauge, its needle trembling toward red as it winds up
    plate(() => { ctx.arc(-9.4, -40.4, 4.6, 0, TAU); }, TK.copper, { sd: 1, hd: .6, ow: 1.2 });
    ctx.fillStyle = C('#EDE3CC'); circle(-9.4, -40.4, 3.2); ctx.fill();
    if (DET()) { ctx.strokeStyle = '#C04040'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(-9.4, -40.4, 2.4, -.6, .4); ctx.stroke(); }
    const na = -2.4 + .9 + w * 1.9 + Math.sin(t * 13) * .08;
    line([-9.4, -40.4, -9.4 + Math.cos(na) * 2.8, -40.4 + Math.sin(na) * 2.8], OUT, .9);
    // the furnace door low on the front: glowing through its grate
    const fh = .55 + Math.sin(t * 9) * .1 + w * .45;
    glow(4, -23.5, 10 + w * 8, '255,130,50', .35 + w * .4);
    plate(() => { rrect(-3, -27.6, 13, 8.4, 2); }, TK.dark, { sd: .8, hd: .5, ow: 1.2 });
    const fg = ctx.createLinearGradient(0, -26.6, 0, -20); fg.addColorStop(0, C(`rgba(255,${190 + w * 60 | 0},90,${fh})`)); fg.addColorStop(1, C('#C83A1A'));
    ctx.fillStyle = fg; ctx.fillRect(-1.6, -26.4, 10.2, 6);
    for (let x = .4; x < 8.6; x += 2.1) line([x, -26.4, x, -20.4], OUT, .9);
    // a riveted porthole with a red sentinel lens
    lens(11.4, -40, 3.4 + w * .6, hot ? '#FF4A3A' : '#FFB04A', hot ? '255,74,58' : '255,176,74', w, TK.dark);
    ctx.strokeStyle = C(TK.copper); ctx.lineWidth = 1.6; circle(11.4, -40, 5.6); ctx.stroke();
    for (let k = 0; k < 6; k++) rivet(11.4 + Math.cos(k / 6 * TAU) * 5.6, -40 + Math.sin(k / 6 * TAU) * 5.6, TK.copper, .55);
    // ---- the cannon: a heavy spout on a trunnion; it rises and draws back as it winds up
    const ang = -.35 * w, rec = a.atk ? -4 : -w * 2.5;
    // a ribbed hose from the boiler top to the breech
    ctx.lineCap = 'round';
    ctx.strokeStyle = C(OUT); ctx.lineWidth = 4.4; ctx.beginPath(); ctx.moveTo(-2, -48); ctx.quadraticCurveTo(10, -58 - w * 2, 16, -40); ctx.stroke();
    ctx.strokeStyle = C('#4A4248'); ctx.lineWidth = 2.6; ctx.stroke();
    if (DET()) { ctx.strokeStyle = '#6E666C'; ctx.lineWidth = 2.6; ctx.setLineDash([.8, 1.4]); ctx.stroke(); ctx.setLineDash([]); }
    ctx.save(); ctx.translate(16, -34); ctx.rotate(ang); ctx.translate(rec, 0);
    plate(() => { ctx.moveTo(-3, -6.4); ctx.lineTo(18, -4.6); ctx.lineTo(18, 4.6); ctx.lineTo(-3, 6.4); ctx.closePath(); }, TK.steel, {
      sd: 2.2, hd: 1, ow: 1.5, inner: () => { ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(0, -4.6); ctx.lineTo(17, -3.4); ctx.stroke(); },
    });
    plate(() => { rrect(5, -6.2, 3, 12.4, 1); }, TK.brass, { sd: .8, hd: .5, ow: 1 });
    plate(() => { ctx.moveTo(17, -6.6); ctx.lineTo(25, -6); ctx.lineTo(25, 6); ctx.lineTo(17, 6.6); ctx.closePath(); }, TK.dark, { sd: 1, hd: .6, ow: 1.3 }); // muzzle brake
    for (const x of [19.4, 22.4]) line([x, -5.6, x, 5.6], '#1A1418', 1);
    ctx.fillStyle = C('#140E10'); ell(25, 0, 1.6, 4.4); ctx.fill();
    if (hot || a.atk) { glow(26, 0, 6 + w * 8, '255,110,70', .4 + w * .5); ctx.fillStyle = C('#FFD08A'); ell(25.2, 0, .9, 2.6 * Math.max(w, a.atk ? 1 : 0)); ctx.fill(); }
    ctx.restore();
    // the trunnion bolt
    plate(() => { ctx.arc(16, -34, 4.2, 0, TAU); }, TK.copper, { sd: 1, hd: .6, ow: 1.2 }); rivet(16, -34, TK.copper, 1.2);
    ctx.restore();
  };

  // ================= BRASS AUTOMATON / MOSS SENTINEL =================
  // the same skeleton and pose fields as drawHumanoid: feet at 0, hips -30, shoulders -49, head -61, facing +x
  const AUTO = {
    brass: { plate: '#C2914C', dark: '#8A6232', steel: '#7A8292', joint: '#3E3436', trim: '#3E8A84', visor: '#9FF0E8', vrgb: '159,240,232', core: '#9FF0E8', crgb: '120,240,225', gauntlet: '#8A8E9E', weapon: 'blade' },
    moss: { plate: '#8A9070', dark: '#5A6248', steel: '#6E7466', joint: '#33362C', trim: '#6E5A3A', visor: '#FFD27A', vrgb: '255,200,110', core: '#FFD27A', crgb: '255,190,90', gauntlet: '#6E7466', weapon: 'blade', moss: ['#4E7A3E', '#6E9A4E', '#8EB45E'] },
  };
  function mossClump(x, y, r, L) {
    if (!L.moss) return;
    const M = L.moss;
    ctx.fillStyle = C(M[0]); ell(x, y, r, r * .55); ctx.fill(); outline(.9);
    ctx.fillStyle = C(M[1]); ell(x + r * .2, y - r * .2, r * .7, r * .35); ctx.fill();
    if (DET()) { ctx.fillStyle = M[2]; ell(x + r * .4, y - r * .32, r * .35, r * .16); ctx.fill(); }
  }
  function sabaton(x, col) {
    plate(() => { ctx.moveTo(x - 4.2, -9); ctx.lineTo(x - 4.8, 0); ctx.lineTo(x + 7.6, 0); ctx.quadraticCurveTo(x + 7.6, -3.4, x + 4, -5); ctx.lineTo(x + 2.8, -9); ctx.closePath(); }, col, { sd: 1.6, hd: .7, ow: 1.1 });
    ctx.fillStyle = C(shade(col, -.55)); ctx.fillRect(x - 4.8, -1.3, 12.4, 1.3);
    line([x + .6, -6.6, x + 4.4, -4.8], shade(col, -.45), .6); rivet(x - 1.6, -6, col, .7);
  }
  function joint(x, y, r, L) { r *= .85; ctx.fillStyle = C(shade(L.dark, -.25)); circle(x, y, r); ctx.fill(); outline(.9); rivet(x + .2, y - .2, L.steel, r * .4); }
  function drawAutomaton(L, pose, t) {
    pose = pose || {}; t = t || 0;
    const walk = pose.walk || 0, sw = Math.sin(walk);
    ctx.save();
    if (pose.rot) { ctx.translate(0, -34); ctx.rotate(pose.rot); ctx.translate(0, 34); }
    if (pose.down) { ctx.translate(-6, -4); ctx.rotate(-1.5); }
    const cr = pose.crouch ? 8 : 0, HIP = -30 + cr, SHO = -49 + cr;
    const dkP = shade(L.plate, -.2), dkS = shade(L.steel, -.22);
    // ---- exhaust stacks on the back, venting steam
    for (const [x, h] of [[-8, 11], [-5, 8]]) plate(() => { ctx.moveTo(x - 1.8, SHO + 5); ctx.lineTo(x - 4.6, SHO - h); ctx.lineTo(x - 1, SHO - h - .6); ctx.lineTo(x + 1.6, SHO + 4); ctx.closePath(); }, dkS, { sd: .8, hd: .5, ow: 1 });
    if (DET() && !pose.down) for (let i = 0; i < 2; i++) { const p = (t * 1.1 + i * .5) % 1; ctx.fillStyle = `rgba(236,232,226,${.45 * (1 - p)})`; circle(-13 - p * 6, SHO - 13 - p * 12, 1.6 + p * 3.4); ctx.fill(); }
    // ---- back arm: piston-jointed, a shade darker
    const ba = pose.backArm ?? (1.25 + sw * .4), bsx = -3, bsy = SHO + 1.5;
    const bex = bsx + Math.cos(ba) * 8, bey = bsy + Math.sin(ba) * 8, bwx = bex + Math.cos(ba + .25) * 7.5, bwy = bey + Math.sin(ba + .25) * 7.5;
    seg(bsx, bsy, bex, bey, 6.6, 5.4, shade(L.plate, -.32), .8); seg(bex, bey, bwx, bwy, 5.2, 4.4, shade(L.steel, -.3), .4);
    joint(bex, bey, 2.4, L);
    plate(() => { ctx.arc(bwx + Math.cos(ba) * 1.6, bwy + Math.sin(ba) * 1.6, 3, 0, TAU); }, shade(L.gauntlet, -.3), { sd: 1, hd: .5, ow: 1 });
    // ---- legs: plated thighs, ball knees, greaves and sabatons
    const leg = (x, kneeX, kneeY, footX, col, pc, boots) => {
      seg(x, HIP, kneeX, kneeY, 7.6, 5.8, col, .6);
      seg(kneeX, kneeY, footX - .6, -8, 5.6, 4.6, col, .4);
      // a greave plate over the shin
      const gx = (kneeX + footX) / 2, gy = (kneeY - 8) / 2, an = Math.atan2(-8 - kneeY, footX - kneeX);
      ctx.save(); ctx.translate(gx, gy); ctx.rotate(an);
      plate(() => { ctx.moveTo(-5, -3.6); ctx.lineTo(5, -3); ctx.lineTo(5.4, 2.6); ctx.lineTo(-5, 3.4); ctx.closePath(); }, pc, { sd: 1.2, hd: .6, ow: 1 });
      rivet(-3, 0, pc, .6); ctx.restore();
      joint(kneeX, kneeY, 3, L);
      sabaton(footX, boots);
    };
    if (pose.kick) {
      leg(-3, -5, HIP + 15, -4, dkS, shade(L.plate, -.3), shade(L.steel, -.3));
      seg(2, HIP, 17, HIP - 2, 7.8, 6, L.steel, .6); seg(17, HIP - 2, 30, HIP - 4, 6, 4.8, L.steel, .5); joint(17, HIP - 2, 3, L);
      ctx.save(); ctx.translate(30, HIP - 4); ctx.rotate(-Math.PI / 2); ctx.translate(-1, 9); sabaton(0, L.steel); ctx.restore();
    } else if (pose.down) {
      seg(-2, HIP, -4, -13, 7.6, 5.8, dkS, .5); seg(-4, -13, -6, -6, 5.8, 4.6, dkS, .4); joint(-4, -13, 2.6, L);
      seg(2, HIP, 6, -13, 7.6, 5.8, L.steel, .5); seg(6, -13, 8, -6, 5.8, 4.6, L.steel, .4); joint(6, -13, 2.6, L);
    } else {
      const run = pose.run ? 1.6 : 1;
      const f1 = sw * 10 * run, f2 = -sw * 10 * run;
      const k1 = cr ? 9 : Math.max(0, sw) * 6, k2 = cr ? 9 : Math.max(0, -sw) * 6, ky = -15 + cr * .45;
      leg(-3, -3 + f1 * .5 + k1, ky, -3 + f1, dkS, shade(L.plate, -.3), shade(L.steel, -.3)); // the far leg
      leg(3, 3 + f2 * .5 + k2, ky, 3 + f2, L.steel, L.plate, L.steel);
    }
    // ---- torso, leaning around the hips
    ctx.save(); ctx.translate(0, HIP); ctx.rotate(pose.lean || 0); ctx.translate(0, -HIP);
    // tassets: hanging hip plates
    plate(() => { ctx.moveTo(-9, HIP - 3); ctx.lineTo(-10.6, HIP + 6); ctx.lineTo(-3, HIP + 7.6); ctx.lineTo(-1.6, HIP - 2); ctx.closePath(); }, shade(L.dark, -.1), { sd: 1.2, hd: .6, ow: 1.1 });
    plate(() => { ctx.moveTo(0, HIP - 2); ctx.lineTo(.6, HIP + 7.6); ctx.lineTo(9.4, HIP + 6.4); ctx.lineTo(8.6, HIP - 3); ctx.closePath(); }, L.dark, { sd: 1.2, hd: .6, ow: 1.1 });
    rivet(5, HIP + 4.4, L.dark, .7); rivet(-6.6, HIP + 4, L.dark, .7);
    // a jointed steel waist
    plate(() => { rrect(-7.6, HIP - 9, 15.6, 8, 2); }, shade(L.steel, -.3), { sd: 1.4, hd: .6, ow: 1.1, inner: () => { ctx.strokeStyle = shade(L.steel, -.5); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(-8, HIP - 5); ctx.lineTo(8, HIP - 5); ctx.stroke(); } });
    // the cuirass: a barrel chest of riveted plate
    const chest = () => { ctx.moveTo(-11.4, SHO - 1); ctx.quadraticCurveTo(0, SHO - 4.6, 12, SHO - 1.4); ctx.lineTo(12.6, SHO + 7); ctx.quadraticCurveTo(11.6, SHO + 15, 8.4, HIP - 7); ctx.lineTo(-8, HIP - 7); ctx.quadraticCurveTo(-11, SHO + 15, -12, SHO + 7); ctx.closePath(); };
    plate(chest, L.plate, {
      sd: 3.6, hd: 1.2, ow: 1.6,
      grime: () => { ctx.ellipse(-4, HIP - 7, 9, 3, 0, 0, TAU); },
      inner: () => {
        ctx.strokeStyle = shade(L.plate, -.45); ctx.lineWidth = .8; ctx.beginPath(); // the keel and the plate seams
        ctx.moveTo(3.6, SHO - 3.4); ctx.quadraticCurveTo(5, SHO + 8, 3.4, HIP - 7);
        ctx.moveTo(-11, SHO + 12); ctx.quadraticCurveTo(0, SHO + 15, 11.6, SHO + 11); ctx.stroke();
        ctx.strokeStyle = shade(L.plate, .5); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(4.4, SHO - 3); ctx.quadraticCurveTo(5.8, SHO + 8, 4.2, HIP - 7.4); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,245,215,.55)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(9.6, SHO); ctx.quadraticCurveTo(11.6, SHO + 6, 10.4, SHO + 11); ctx.stroke(); // specular
        if (L.moss && DET()) { ctx.fillStyle = 'rgba(150,180,110,.5)'; for (const [x, y, r] of [[-7, SHO + 4, 1.6], [-4, SHO + 17, 1.2], [7, SHO + 15, 1], [-9, SHO + 10, 1]]) { circle(x, y, r); ctx.fill(); } } // lichen
      },
    });
    for (const [x, y] of [[-9, SHO + 1], [-10, SHO + 9], [10.4, SHO + 1], [11, SHO + 8.6], [-6.6, HIP - 9], [7, HIP - 9]]) rivet(x, y, L.plate, .8);
    // the furnace core behind a grille
    const cx = -2.6, cy = SHO + 10.5;
    glow(cx, cy, 8, L.crgb, .38 + Math.sin(t * 5) * .08);
    ctx.fillStyle = C(L.joint); circle(cx, cy, 5.6); ctx.fill(); outline(1.2);
    const cg = ctx.createRadialGradient(cx + 1, cy - 1, .5, cx, cy, 4.4); cg.addColorStop(0, C('#FFFFFF')); cg.addColorStop(.45, C(L.core)); cg.addColorStop(1, C(shade(L.core, -.5)));
    ctx.fillStyle = cg; circle(cx, cy, 4.3); ctx.fill();
    for (const dx of [-1.6, 0, 1.6]) line([cx + dx, cy - 4, cx + dx, cy + 4], L.joint, .8);
    ctx.strokeStyle = C(L.dark); ctx.lineWidth = 1.2; circle(cx, cy, 5.6); ctx.stroke();
    for (let k = 0; k < 4; k++) rivet(cx + Math.cos(k / 4 * TAU + .8) * 5.6, cy + Math.sin(k / 4 * TAU + .8) * 5.6, L.dark, .55);
    // the trim belt with a cog buckle
    plate(() => { ctx.rect(-8.6, HIP - 8.6, 17.4, 3.4); }, L.trim, { sd: .8, hd: .6, ow: 1 });
    gear(4, HIP - 7, 2.8, 6, .3, '#D8AA55');
    if (L.moss) { mossClump(-8, SHO + 18, 3, L); }
    // ---- the head: a great helm with a glowing slit visor and a crest
    const hy = -61 + cr;
    seg(0, SHO - 1, 1.2, hy + 5, 4.6, 4, L.joint, 0); // neck cables
    plate(() => { ctx.moveTo(-7, SHO - 1.4); ctx.quadraticCurveTo(1, SHO - 6, 8.6, SHO - 2); ctx.lineTo(7.4, SHO + 1.6); ctx.quadraticCurveTo(1, SHO - 1.6, -6.4, SHO + 1.6); ctx.closePath(); }, L.dark, { sd: 1, hd: .6, ow: 1.1 }); // gorget
    if (L.moss) { // a fern sprouting from the back of the helm
      ctx.strokeStyle = C(L.moss[0]); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-5, hy - 7); ctx.quadraticCurveTo(-12, hy - 14, -18, hy - 9); ctx.stroke();
      for (let i = 1; i <= 4; i++) { const u = i / 5, px = -5 - 13 * u, py = hy - 7 - Math.sin(u * Math.PI) * 6; ctx.fillStyle = C(L.moss[1 + (i % 2)]); ell(px, py - 1.6, 2.2, .9, -.6 - u); ctx.fill(); ell(px + .6, py + 1.4, 2, .8, .6); ctx.fill(); }
    } else { // a brass crest fin, enamelled in stripes
      plate(() => { ctx.moveTo(-6, hy - 6); ctx.quadraticCurveTo(-4, hy - 15, 5, hy - 13); ctx.lineTo(4, hy - 9); ctx.quadraticCurveTo(-1, hy - 10, -3, hy - 5); ctx.closePath(); }, L.trim, {
        sd: 1, hd: .6, ow: 1.1, inner: () => { ctx.strokeStyle = shade(L.trim, -.45); ctx.lineWidth = .7; ctx.beginPath(); for (const x of [-3, 0, 3]) { ctx.moveTo(x, hy - 14); ctx.lineTo(x - 1.4, hy - 6); } ctx.stroke(); },
      });
    }
    const helm = () => { ctx.moveTo(-7.4, hy + 5.6); ctx.lineTo(-8, hy - 3); ctx.quadraticCurveTo(-7, hy - 10, 1, hy - 10.6); ctx.quadraticCurveTo(8.6, hy - 10.4, 9.6, hy - 4); ctx.lineTo(11, hy + 1); ctx.lineTo(9.6, hy + 6.4); ctx.lineTo(4, hy + 7.4); ctx.closePath(); };
    plate(helm, L.plate, {
      sd: 2.6, hd: 1.1, ow: 1.5,
      inner: () => {
        ctx.strokeStyle = shade(L.plate, -.45); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(-1.6, hy - 10.4); ctx.quadraticCurveTo(-3.4, hy - 1, -1, hy + 7); ctx.stroke(); // the seam of the faceplate
        ctx.strokeStyle = 'rgba(255,245,215,.6)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(4, hy - 9.6); ctx.quadraticCurveTo(8, hy - 9, 9, hy - 5); ctx.stroke();
      },
    });
    rivet(-4.6, hy - 2, L.plate, .8); rivet(-4.4, hy + 3, L.plate, .8);
    // breathing vents along the jaw
    for (const x of [4.4, 6.4, 8.4]) line([x, hy + 3.2, x - .4, hy + 6], OUT, .7);
    // the visor: a narrow hot slit under a heavy brow
    ctx.fillStyle = C('#1A1214'); ctx.beginPath(); ctx.moveTo(.6, hy - 4.4); ctx.lineTo(10.4, hy - 4.6); ctx.lineTo(10.8, hy - 1.6); ctx.lineTo(1, hy - 1.4); ctx.closePath(); ctx.fill();
    const hurtV = pose.arm === -1 && (pose.lean || 0) < -.3;
    glow(7, hy - 3, 9, L.vrgb, hurtV ? .2 : .55);
    ctx.fillStyle = C(L.visor); ctx.fillRect(2, hy - 3.6, 8.4, 1.5);
    if (DET()) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(6.6, hy - 3.4, 2.8, .9); }
    plate(() => { ctx.moveTo(-.4, hy - 6.6); ctx.lineTo(10, hy - 6.4); ctx.lineTo(11.4, hy - 4); ctx.lineTo(.4, hy - 4.4); ctx.closePath(); }, L.dark, { sd: .7, hd: .5, ow: 1 });
    if (L.moss) mossClump(-1.4, hy - 9.6, 3.4, L);
    if (ARMOR_MID) ARMOR_MID({ HIP, SHO, hy, cr, LEAN: pose.lean || 0, head: () => {} }); // breakable armor worn on the body (armor_a.js)
    // ---- front arm + weapon: plated upper arm, a ball elbow, a forearm with its piston, a steel gauntlet
    const arm = pose.arm ?? (1.1 - sw * .35);
    if (pose.trail) drawTrail(0, SHO + 2, pose);
    if (pose.flat) drawFlatTrail(1, SHO + 2, pose.flat);
    ctx.save(); ctx.translate(1, SHO + 2); ctx.rotate(arm);
    if (pose.sweep !== undefined) ctx.scale(Math.sign(pose.sweep || 1) * Math.max(.14, Math.abs(pose.sweep)), 1);
    const reach = 15 + (pose.ext || 0) * 12, ex = reach * .5, ey = 1.6 - (pose.ext || 0) * 1.2;
    seg(0, 0, ex, ey, 7.2, 5.8, L.plate, 1);
    seg(ex, ey, reach, 0, 5.8, 4.6, L.steel, .5);
    if (DET()) line([ex + 1.4, ey - 2.2, reach - 1.6, -2], shade(L.steel, .55), .8); // the forearm piston rod
    joint(ex, ey, 2.8, L);
    pose.glove = L.gauntlet;
    if (pose.streak) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = pose.streak.a; ctx.strokeStyle = pose.streak.col; ctx.lineWidth = 2; for (const dy of [-4, 0, 4]) { ctx.beginPath(); ctx.moveTo(reach + 6, dy); ctx.lineTo(reach + pose.streak.len, dy * .4); ctx.stroke(); } ctx.restore(); }
    ctx.translate(reach - 15, 0);
    if (pose.grip) { ctx.translate(17, 0); ctx.rotate(pose.grip); ctx.translate(-17, 0); }
    drawWeapon(pose.weapon || L.weapon, pose);
    // the gauntlet closed over the grip: a segmented steel fist
    plate(() => { rrect(10.4, -4, 7, 8, 2.2); }, L.gauntlet, { sd: 1.2, hd: .6, ow: 1.1 });
    line([12.8, -3.6, 12.8, 3.6], shade(L.gauntlet, -.5), .6); line([15, -3.6, 15, 3.6], shade(L.gauntlet, -.5), .6);
    ctx.restore();
    // ---- the pauldron: two layered plates over the front shoulder
    plate(() => { ctx.ellipse(2, SHO + 3, 6.6, 4, -.2, Math.PI * .9, Math.PI * 2.1); ctx.closePath(); }, L.dark, { sd: 1.1, hd: .6, ow: 1.1 });
    plate(() => { ctx.ellipse(1, SHO + .4, 7.6, 5.4, -.25, Math.PI * .9, Math.PI * 2.08); ctx.closePath(); }, L.plate, {
      sd: 2, hd: 1, ow: 1.3, inner: () => { ctx.fillStyle = 'rgba(255,245,215,.55)'; ell(4.4, SHO - 2.6, 2.6, .9, -.3); ctx.fill(); },
    });
    { const a0 = Math.PI * .9, a1 = Math.PI * 2.08, c = Math.cos(-.25), si = Math.sin(-.25), P = (an) => [1 + 7.6 * Math.cos(an) * c - 5.4 * Math.sin(an) * si, SHO + .4 + 7.6 * Math.cos(an) * si + 5.4 * Math.sin(an) * c];
      const [x0, y0] = P(a0), [x1, y1] = P(a1); ctx.lineCap = 'round'; line([x0 + .6, y0 - .6, x1 - .6, y1 - .4], OUT, 2.8); line([x0 + .6, y0 - .6, x1 - .6, y1 - .4], L.trim, 1.4); }
    for (const [x, y] of [[-4, SHO - .4], [1, SHO - 3], [5.6, SHO - 3]]) rivet(x, y, L.plate, .7);
    if (L.moss) { mossClump(1.6, SHO - 4.6, 5, L);
      ctx.strokeStyle = C(L.moss[0]); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(-5, SHO + 3); ctx.quadraticCurveTo(-6.4, SHO + 9, -5, SHO + 14); ctx.moveTo(6, SHO + 2); ctx.quadraticCurveTo(7.4, SHO + 6, 6.6, SHO + 10); ctx.stroke(); // hanging vines
      ctx.fillStyle = C(L.moss[2]); ell(-5.2, SHO + 9, 1.2, .6, .4); ctx.fill(); ell(7, SHO + 7, 1.1, .6, -.4); ctx.fill();
      ctx.fillStyle = C('#F2D88A'); circle(4.6, SHO - 7, 1); ctx.fill(); ctx.fillStyle = C('#E8A0B0'); circle(-1.6, hy - 13.4, .9); ctx.fill(); }
    ctx.restore();
    ctx.restore();
  }
  CREATURES.knight = function (e, a) {
    a = a || {};
    drawAutomaton(e.def.look === 'moss' ? AUTO.moss : AUTO.brass, a.pose || { walk: a.walk || 0 }, a.t || 0);
  };
})();
