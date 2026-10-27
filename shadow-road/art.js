'use strict';
// ---------- palette & drawing helpers ----------
const OUT = '#2A1B2C';          // warm dark ink used for every outline
let FLASH = false;              // when true, every color helper returns white (hit flash)
let TINT = null;                // when set, every color helper returns this one color (shadow afterimages)
const C = (c) => FLASH ? '#FFFFFF' : TINT || c;
let OUTK = 1, INK = OUT;
let HEAD_MASK = null; // where the prince's head was drawn this frame (its transform and hy), so the paint layer can leave it smooth (paint.js)
const FINE_OK = () => !FLASH && !TINT && (typeof PAINT_Q === 'undefined' || PAINT_Q > 0);        // the prince is inked finer, in a deeper brown-black (set while he is drawn)
function outline(w = 1.6) { ctx.lineWidth = w * OUTK; ctx.strokeStyle = FLASH ? '#FFFFFF' : INK; ctx.stroke(); }
function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
function ell(x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, TAU); }
function limb(pts, col, w) { // a thick round-capped limb with an outline
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.strokeStyle = FLASH ? '#fff' : INK; ctx.lineWidth = w + 2.2 * OUTK; ctx.stroke();
  ctx.strokeStyle = C(col); ctx.lineWidth = w; ctx.stroke();
}
function shade(hex, amt) { // lighten (amt > 0) or darken (amt < 0) a #rrggbb color, for painted light and shadow
  if (!hex || hex[0] !== '#' || hex.length !== 7) return hex;
  const n = parseInt(hex.slice(1), 16), f = (c) => Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt));
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(f).map(c => c.toString(16).padStart(2, '0')).join('');
}
function shadow(x, y, rx) { // cast on the floor, so it is painted under the inked figures
  const f = () => { ctx.fillStyle = 'rgba(40,20,60,.3)'; ell(x, y, rx, rx * .28); ctx.fill(); };
  if (inkG && (ctx === inkG || ctx === heroG)) onMain(f); else f();
}

// the hero's face, drawn in more detail than anyone else, in a comic-cover style: a three-quarter view with flat
// planes of light and shadow. A long face with high cheekbones and a strong, angular jaw; heavy brows drawn down
// over deep-set green eyes; a long straight nose; stubble; and dark, wavy hair with volume, swept back over the ears.
function drawCorwinHead(look, hy) {
  const sk = look.skin, mid = shade(sk, -.16), dark = shade(sk, -.34), ink = '#141016';
  ctx.fillStyle = C(shade(sk, -.2)); ctx.fillRect(-.6, hy + 5, 5, 7); // neck, a little in the jaw's shadow
  const head = () => {
    ctx.beginPath(); ctx.moveTo(-5.6, hy - 8);
    ctx.quadraticCurveTo(.4, hy - 11.2, 5.6, hy - 9.6); ctx.quadraticCurveTo(9, hy - 8, 9.2, hy - 3.8); // crown and brow
    ctx.lineTo(9.7, hy - 2.2); ctx.lineTo(9.3, hy - 1); ctx.lineTo(10.6, hy + 2.8); ctx.lineTo(9.5, hy + 3.4); // brow ridge, a long straight nose
    ctx.lineTo(9.6, hy + 4.6); ctx.lineTo(9.2, hy + 5.6); ctx.lineTo(9.9, hy + 7.4); ctx.lineTo(9.3, hy + 9.4); // lips and a prominent chin
    ctx.lineTo(6.6, hy + 10.2); ctx.lineTo(1.6, hy + 7.8); // the strong angle of the jaw
    ctx.lineTo(-2.8, hy + 3); ctx.quadraticCurveTo(-7, hy - 1, -5.6, hy - 8); ctx.closePath();
  };
  head(); ctx.fillStyle = C(sk); ctx.fill();
  ctx.save(); head(); ctx.clip();
  if (!FLASH && !TINT) { // one even skin tone, modelled only by a soft gradient: the back of the head turns gently from the light
    const g = ctx.createLinearGradient(-6, 0, 4, 0); g.addColorStop(0, 'rgba(70,40,40,.2)'); g.addColorStop(1, 'rgba(70,40,40,0)'); ctx.fillStyle = g; ctx.fillRect(-10, hy - 12, 20, 24);
    const sg = ctx.createLinearGradient(0, hy + 4, 0, hy + 10); sg.addColorStop(0, 'rgba(40,28,34,0)'); sg.addColorStop(1, 'rgba(40,28,34,.1)'); ctx.fillStyle = sg; ctx.fillRect(-2, hy + 4, 13, 8); // a very light, even stubble on the jaw
  }
  ctx.restore();
  head(); outline(1.05);
  ctx.strokeStyle = C(shade(sk, -.5)); ctx.lineWidth = .55; ctx.beginPath();
  ctx.moveTo(8.6, hy + 3.4); ctx.quadraticCurveTo(7.6, hy + 4.6, 7.8, hy + 6.2); // the crease from nose to mouth
  ctx.moveTo(9.3, hy + 8); ctx.lineTo(9.6, hy + 9); // a hint of a cleft in the chin
  ctx.stroke();
  ctx.fillStyle = C(dark); ctx.beginPath(); ctx.moveTo(9.4, hy + 3.1); ctx.lineTo(10.2, hy + 3); ctx.lineTo(9.6, hy + 3.5); ctx.fill(); // nostril
  ctx.fillStyle = C(shade(sk, -.2)); ell(-2.2, hy + 1.6, 1.4, 2.2); ctx.fill(); // ear
  // eyes: whites, green irises toward the front, a heavy upper lid
  ctx.fillStyle = C('#EDE6DC'); ctx.beginPath(); ctx.moveTo(4.4, hy - 1); ctx.lineTo(7.4, hy - 1.3); ctx.lineTo(7.1, hy + .3); ctx.lineTo(4.9, hy + .2); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(8.6, hy - 1.2); ctx.lineTo(9.6, hy - 1.3); ctx.lineTo(9.5, hy + .2); ctx.lineTo(8.7, hy + .2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C(look.eye); ctx.fillRect(5.9, hy - 1.2, 1.4, 1.5); ctx.fillRect(9, hy - 1.2, .6, 1.4);
  ctx.fillStyle = C(ink); ctx.fillRect(6.5, hy - .9, .75, .9); ctx.fillRect(9.2, hy - .9, .4, .8); // pupils
  ctx.fillStyle = C('#FFFFFF'); ctx.fillRect(6.1, hy - 1.1, .4, .4); // a glint
  ctx.fillStyle = C(ink); ctx.fillRect(4.2, hy - 1.6, 3.4, .75); ctx.fillRect(8.4, hy - 1.6, 1.3, .65); // upper lids
  // heavy brows drawn down toward the nose, with a crease between them
  ctx.beginPath(); ctx.moveTo(3.4, hy - 3.9); ctx.lineTo(6, hy - 4.1); ctx.lineTo(8.4, hy - 3); ctx.lineTo(8.1, hy - 2.2); ctx.lineTo(5.8, hy - 3); ctx.lineTo(3.8, hy - 2.8); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(8.9, hy - 2.7); ctx.lineTo(9.9, hy - 3.6); ctx.lineTo(9.9, hy - 2.7); ctx.lineTo(9.1, hy - 2.1); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = C(shade(sk, -.45)); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(8.7, hy - 3.6); ctx.lineTo(8.8, hy - 2.6); ctx.stroke();
  ctx.fillStyle = C(shade(sk, -.55)); ctx.beginPath(); ctx.moveTo(7.6, hy + 5); ctx.lineTo(9.5, hy + 4.7); ctx.lineTo(9.4, hy + 5.3); ctx.lineTo(7.8, hy + 5.4); ctx.closePath(); ctx.fill(); // a set mouth
  ctx.fillStyle = C(shade(sk, .12)); ctx.fillRect(8.2, hy + 5.7, 1.1, .5); // light on the lower lip
  // shaggy dark-brown hair, longer and tousled: a ragged fringe falling over the brow, locks over the ear, and
  // pointed ends at the nape lying on the collar (with the same locks as the turned head, so the turn is seamless)
  const hair = look.hair, hl = look.hairLt || shade(hair, .4), hd = look.hairDk || shade(hair, -.5);
  ctx.save(); ctx.globalCompositeOperation = 'destination-over'; hairLocks(look, hy, 0, .6, 'back', true); ctx.restore();
  ctx.beginPath(); // a full mop: the fringe falling over the brow, a sideburn, a lock over the ear, ragged ends on the collar
  ctx.moveTo(10.6, hy - 6.4);
  ctx.lineTo(9.7, hy - 3.4); ctx.lineTo(8.8, hy - 5.4); ctx.lineTo(7.7, hy - 2.4); ctx.lineTo(6.6, hy - 4.8); ctx.lineTo(5.3, hy - 2); ctx.lineTo(4.3, hy - 4.4); ctx.lineTo(3, hy - 1.6); // the fringe
  ctx.lineTo(2.2, hy - 3.2); ctx.lineTo(1.6, hy + 3); ctx.lineTo(.5, hy + 1); // the sideburn
  ctx.lineTo(-.3, hy + 5.6); ctx.lineTo(-1.4, hy + 2.8); ctx.lineTo(-2.3, hy + 7); // a lock over the ear
  ctx.lineTo(-3.6, hy + 4.6); ctx.lineTo(-4.4, hy + 9.8); ctx.lineTo(-5.6, hy + 6.2); ctx.lineTo(-6.8, hy + 10.4); ctx.lineTo(-7.6, hy + 6); ctx.lineTo(-9.4, hy + 8.6); ctx.lineTo(-9.2, hy + 3.4); // ends on the collar
  ctx.quadraticCurveTo(-10.6, hy - 1.6, -10.4, hy - 5.4); ctx.lineTo(-11.6, hy - 7.2); ctx.lineTo(-9.9, hy - 8.8); ctx.lineTo(-11, hy - 10.8); // full at the back,
  for (const [x, y] of [[-8.8, hy - 12.2], [-9.4, hy - 14], [-6.8, hy - 13.9], [-6.4, hy - 15.8], [-3.8, hy - 14.6], [-2.6, hy - 16.4], [-.3, hy - 14.9], [1.6, hy - 16.3], [3, hy - 14.7], [5.4, hy - 15.6], [6.3, hy - 13.7], [9.2, hy - 13.7], [9.3, hy - 11.8], [11.8, hy - 11.1], [10.6, hy - 9.4], [12.3, hy - 8]]) ctx.lineTo(x, y); // and shaggy over the crown
  ctx.lineTo(10.6, hy - 6.4); ctx.closePath();
  ctx.fillStyle = C(hair); ctx.fill(); outline(1.05);
  if (!FLASH && !TINT) {
    ctx.save(); ctx.clip(); ctx.lineCap = 'round';
    ctx.fillStyle = hd; ctx.beginPath(); ctx.moveTo(-10, hy - 4); ctx.quadraticCurveTo(-5, hy - 1, -1, hy + 2); ctx.lineTo(-1, hy + 10); ctx.lineTo(-10, hy + 10); ctx.closePath(); ctx.fill(); // the shadowed back of the head
    ctx.strokeStyle = hd; ctx.lineWidth = .65; ctx.beginPath(); // locks, combed back by hand and falling where they like
    ctx.moveTo(8.6, hy - 9.6); ctx.quadraticCurveTo(4, hy - 10.6, -1.6, hy - 9); ctx.quadraticCurveTo(-5.4, hy - 6.8, -6.2, hy + 4);
    ctx.moveTo(6, hy - 7.4); ctx.quadraticCurveTo(1.6, hy - 8, -2.2, hy - 4.6); ctx.quadraticCurveTo(-3.6, hy - 1, -3.2, hy + 7);
    ctx.moveTo(9.6, hy - 7.4); ctx.quadraticCurveTo(8, hy - 6, 7.2, hy - 3.2); ctx.moveTo(5.2, hy - 6.8); ctx.quadraticCurveTo(4.6, hy - 5, 4.6, hy - 3.4);
    ctx.stroke();
    ctx.strokeStyle = hl; ctx.lineWidth = .7; ctx.beginPath(); // warm light catching the top of the mop
    ctx.moveTo(9, hy - 11.4); ctx.quadraticCurveTo(3.6, hy - 14, -2.6, hy - 13); ctx.moveTo(10.2, hy - 8.4); ctx.quadraticCurveTo(7.4, hy - 10.2, 4.6, hy - 9.8);
    ctx.moveTo(2.4, hy - 12.8); ctx.quadraticCurveTo(-2, hy - 12.4, -5.6, hy - 10.4); ctx.moveTo(6.2, hy - 7.2); ctx.quadraticCurveTo(4.4, hy - 8.6, 2.6, hy - 6.6); ctx.stroke();
    ctx.restore();
  }
  hairLocks(look, hy, 0, .6, 'front', true);
}

// His hair: shaggy, layered locks, each fixed to a place on the skull (a longitude phi round from the face, an
// elevation e up from the ears) and projected for his turn, so the hair turns with the head and never reshapes. Only
// the tips give a little with his motion (HAIR_SWAY, in head space). Crown locks stand up and sweep back and to one
// side; locks fall over the ears; jagged ends lie on the nape; a few strands fall over the brow.
let HAIR_SWAY = [0, 0];
// set while an armored foe is drawn (armor_a.js): drawHumanoid / drawAutomaton call it inside the body, before the front arm
let ARMOR_MID = null;
const HAIR_LOCKS = (() => {
  // base (phi, e) on the skull, tip (phi + dp, te) at radius R + out, base half-width w (radians); k: which group.
  // A full, shaggy mop as in the sheet: locks falling from the crown over the brow, the ears and down to the collar
  const L = [], h = (i) => { const v = Math.sin(i * 91.7 + 7.3) * 43758.5; return v - Math.floor(v); };
  for (let i = 0; i < 10; i++) { const phi = -Math.PI + (i + .5) * TAU / 10 + (h(i) - .5) * .25; // the crown falling outward every way, fullest over the brow
    L.push({ phi, e: 1.02 + h(i + 1) * .12, dp: (h(i + 2) - .5) * .5, te: .42 + h(i + 3) * .2 - (Math.abs(phi) > 2 ? .25 : 0), out: 2.8 + h(i + 4) * 1.6, w: .5, k: 'crown' }); }
  for (let i = 0; i < 9; i++) { const phi = -Math.PI + (i + .1) * TAU / 9 + (h(i + 70) - .5) * .3; // a second, lower layer: messy volume standing out round the head
    if (Math.abs(phi) < .5) continue; L.push({ phi, e: .72 + h(i + 71) * .1, dp: (h(i + 72) - .5) * .4, te: .02 + h(i + 73) * .22, out: 3.2 + h(i + 74) * 1.6, w: .42, k: 'crown' }); }
  for (let i = 0; i < 7; i++) L.push({ phi: -2.7 + i * .9 + (h(i + 90) - .5) * .3, e: .9, dp: (h(i + 91) - .5) * .5, te: 1.02 + h(i + 92) * .2, out: 2.2 + h(i + 93) * 1.1, w: .34, k: 'crown' }); // ragged tufts over the top
  for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) L.push({ phi: sd * (1.25 + i * .42), e: .62 - i * .04, dp: sd * (.1 + h(i + 21) * .1), te: -.48 - h(i + 11 + sd) * .3, out: 2.9 + h(i + 13) * 1.2, w: .34, k: 'side' }); // over the ears
  for (let i = 0; i < 7; i++) L.push({ phi: Math.PI + (i - 3) * .36, e: .55, dp: (i - 3) * .06, te: -1.12 - [.2, .05, .28, .12, .24, .02, .16][i], out: 2.4 + [1.1, .5, 1.4, .7, 1.1, .4, .9][i], w: .3, k: 'nape' }); // ragged ends down to the collar
  for (let i = 0; i < 5; i++) L.push({ phi: -.62 + i * .31, e: .86, dp: (i % 2 ? .1 : -.06) + .06, te: .2 + h(i + 40) * .16, out: .7 + h(i + 44) * .5, w: .2, k: 'fringe' }); // locks falling over the brow
  return L;
})();
function hairLocks(look, hy, Y, cx, which, profile) {
  const CS = Math.sqrt(Math.max(0, 1 - Y * Y)), th = Math.atan2(Y, CS), cy = hy - 2.4, R = 8.1;
  const pt = (phi, e, r) => [cx + r * Math.cos(e) * Math.cos(phi + th), cy - r * Math.sin(e) * 1.1, Math.cos(e) * Math.sin(phi + th)];
  const hair = look.hair, hl = look.hairLt || shade(hair, .4), hd = look.hairDk || shade(hair, -.5);
  const list = [];
  for (const l of HAIR_LOCKS) {
    if (profile && l.k === 'fringe') continue;
    if (l.k === 'fringe' && Y < -.25) continue;
    const d = pt(l.phi, l.e, R)[2];
    if (which === 'back' ? d >= 0 : d < 0) continue;
    list.push([d, l]);
  }
  list.sort((a, b) => a[0] - b[0]);
  const sx = HAIR_SWAY[0], sy = HAIR_SWAY[1], back = which === 'back';
  for (const [d, l] of list) {
    const a = pt(l.phi - l.w, l.e, R * .9), b = pt(l.phi + l.w, l.e, R * .9), tp = pt(l.phi + l.dp, l.te, R + l.out);
    const g = (l.out + 1.5) / 3, tx = tp[0] + sx * g, ty = tp[1] + sy * g;
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ax = tx - mx, ay = ty - my, al = Math.hypot(ax, ay) || 1, nx = -ay / al, ny = ax / al;
    const bw = Math.hypot(b[0] - a[0], b[1] - a[1]) * .5 + .8, sgn = Math.sign((a[0] - mx) * nx + (a[1] - my) * ny) || 1; // the lock swells, then narrows to its point
    ctx.beginPath(); ctx.moveTo(a[0], a[1]);
    ctx.quadraticCurveTo(mx + ax * .45 + nx * bw * sgn, my + ay * .45 + ny * bw * sgn, tx, ty);
    ctx.quadraticCurveTo(mx + ax * .45 - nx * bw * sgn * .8, my + ay * .45 - ny * bw * sgn * .8, b[0], b[1]); ctx.closePath();
    ctx.fillStyle = C(back ? hd : hair); ctx.fill(); outline(back ? .8 : .7);
    if (!back && !FLASH && !TINT) { const sh = l.phi * 7.3 % 1; ctx.strokeStyle = d > .1 && Math.abs(sh) < .55 ? hl : hd; const ga = ctx.globalAlpha; ctx.globalAlpha = ga * .7; ctx.lineWidth = .45; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mx + ax * .15 + nx * bw * .3, my + ay * .15 + ny * bw * .3); ctx.quadraticCurveTo(mx + ax * .5 + nx * bw * .4, my + ay * .5 + ny * bw * .4, mx + ax * .8, my + ay * .8); ctx.stroke(); ctx.globalAlpha = ga; }
  }
}
// The same head turned away from profile, for his 3/4, front and back views. The head is treated as a solid: every
// feature sits at an angle around it (0 = straight ahead, + toward the near side) and is projected for the body's
// turn Y (sin of the turn: +1 facing the viewer, -1 facing away). Features on the hidden side drop out.
function drawCorwinHeadTurn(look, hy, Y) {
  const sk = look.skin, mid = shade(sk, -.16), dark = shade(sk, -.34), ink = '#141016';
  const CS = Math.sqrt(Math.max(0, 1 - Y * Y)), th = Math.atan2(Y, CS), cx = 1.4;
  const P = (phi, r) => cx + r * Math.cos(phi + th), D = (phi) => Math.sin(phi + th);
  if (Y > -.4) { ctx.fillStyle = C(shade(sk, -.2)); ctx.fillRect(cx - 2.8, hy + 5, 5.6, 7); } // neck (from behind, the hood and the hair hide it)
  const skull = () => { ell(cx, hy - 1.6, 7.3, 8.4); };
  const jaw = () => { // cheeks down to the jaw's corners and the chin, wherever they face the viewer
    ctx.beginPath(); const pts = [[-1.35, 7.2, 1.6], [-1.02, 6.8, 6.8], [-.42, 5.4, 9.2], [0, 5.6, 10], [.42, 5.4, 9.2], [1.02, 6.8, 6.8], [1.35, 7.2, 1.6]];
    pts.forEach(([phi, r, dy], i) => { const x = P(phi, r), y = hy + dy; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath();
  };
  // shaggy hair: the locks at the back and the far side hang below the skull, so they are laid in before it
  const hair = look.hair, hl = look.hairLt || shade(hair, .4), hd = look.hairDk || shade(hair, -.5);
  const lock = (phi, r, y0, y1, w) => { ctx.moveTo(P(phi - w, r), y0); ctx.lineTo(P(phi, r - .4), y1); ctx.lineTo(P(phi + w, r), y0); };
  const backLocks = (front) => { ctx.beginPath(); for (let k = 1; k < 8; k++) { const phi = Math.PI + (k - 4) * .44; if ((D(phi) >= .3) === front) lock(phi, 8.1, hy + (front ? -.5 : 1.6), hy + 6 + [2.6, .4, 3.4, 1.2, 3, .2, 2.2][k - 1], front ? .3 : .26); } ctx.fillStyle = C(front ? hair : shade(hair, -.25)); ctx.fill(); outline(front ? .5 : .9); };
  if (look.corwin) hairLocks(look, hy, Y, cx, 'back'); else backLocks(false);
  // outline the two shapes, then fill them again so only their joined edge keeps its line
  const shapes = Y < -.4 ? [skull] : [skull, jaw]; // (from behind, the jaw is hidden by the back of the head)
  for (const f of shapes) { f(); ctx.lineWidth = 2.1 * OUTK; ctx.strokeStyle = FLASH ? '#FFFFFF' : INK; ctx.stroke(); }
  for (const f of shapes) { f(); ctx.fillStyle = C(sk); ctx.fill(); }
  if (!FLASH && !TINT) { // light from the upper right: the far side of the head turns into shadow
    const face = new Path2D(); face.ellipse(cx, hy - 1.6, 7.3, 8.4, 0, 0, TAU);
    if (Y >= -.4) { // the jaw joined to it, wound the same way round as the skull so the two make one shape
      const jp = new Path2D(), q = [[-1.35, 7.2, 1.6], [-1.02, 6.8, 6.8], [-.42, 5.4, 9.2], [0, 5.6, 10], [.42, 5.4, 9.2], [1.02, 6.8, 6.8], [1.35, 7.2, 1.6]].map(([phi, r, dy]) => [P(phi, r), hy + dy]);
      let ar = 0; q.forEach(([x, y], i) => { const [x2, y2] = q[(i + 1) % q.length]; ar += x * y2 - x2 * y; }); if (ar < 0) q.reverse();
      q.forEach(([x, y], i) => i ? jp.lineTo(x, y) : jp.moveTo(x, y)); jp.closePath(); face.addPath(jp); }
    ctx.save(); ctx.clip(face); // one even skin tone, modelled by a single soft gradient across the whole head
    const g = ctx.createLinearGradient(cx - 7, 0, cx + 7, 0); g.addColorStop(0, 'rgba(70,40,40,.2)'); g.addColorStop(.6, 'rgba(70,40,40,0)'); ctx.fillStyle = g; ctx.fillRect(cx - 9, hy - 12, 18, 24);
    const sg = ctx.createLinearGradient(0, hy + 2.6, 0, hy + 7); sg.addColorStop(0, 'rgba(40,28,34,0)'); sg.addColorStop(1, 'rgba(40,28,34,.1)'); ctx.fillStyle = sg; ctx.fillRect(cx - 9, hy + 2.6, 18, 9); // a very light, even stubble along the jaw
    ctx.restore();
  }
  if (Y > -.25) { // the face
    for (const sd of [-1, 1]) { // deep-set eyes under heavy brows, green irises looking where he faces
      const phi = sd * .42, d = D(phi); if (d < .12) continue;
      const ex = P(phi, 6.6), ew = 1.5 * Math.pow(d, .7);
      ctx.fillStyle = C('#EDE6DC'); ell(ex, hy - .5, ew, .75); ctx.fill();
      const ix = ex + .45 * CS * Math.sign(Math.cos(th) || 1); ctx.fillStyle = C(look.eye); ell(ix, hy - .55, .8 * Math.max(.5, d), .72); ctx.fill();
      ctx.fillStyle = C(ink); ell(ix, hy - .55, .38 * Math.max(.5, d), .4); ctx.fill();
      ctx.fillStyle = C('#FFFFFF'); ctx.fillRect(ix - .45, hy - 1, .35, .35);
      ctx.fillStyle = C(ink); ctx.fillRect(ex - ew, hy - 1.45, ew * 2, .7); // the upper lid
      const bi = P(sd * .16, 7), bo = P(sd * .8, 6.9); // the brow, drawn down toward the nose
      ctx.beginPath(); ctx.moveTo(bi, hy - 2.5); ctx.lineTo(bo, hy - 3.9); ctx.lineTo(bo, hy - 3); ctx.lineTo(bi, hy - 1.7); ctx.closePath(); ctx.fill();
    }
    const nb = P(0, 7.2), nt = P(0, 8.9); // a long straight nose; its shadow falls on the side away from the light
    ctx.strokeStyle = C(shade(sk, -.32)); ctx.lineWidth = .5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(nb - .5, hy - .6); ctx.lineTo(nt - .2, hy + 3); ctx.lineTo(nt - 1.4, hy + 3.4); ctx.stroke(); // its edge, a single soft line
    ctx.strokeStyle = C(shade(sk, .12)); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(nb + .3, hy - 1.4); ctx.lineTo(nt + .2, hy + 2.6); ctx.stroke();
    ctx.fillStyle = C(shade(sk, -.5)); for (const sd of [-1, 1]) if (D(sd * .2) > .2) { ell(P(sd * .2, 8.1), hy + 3.3, .45, .3); ctx.fill(); } // nostrils
    const m0 = D(-.34) > 0 ? P(-.34, 6.6) : P(-Math.PI / 2 - th, 6.6), m1 = D(.34) > 0 ? P(.34, 6.6) : P(Math.PI / 2 - th, 6.6); // a set mouth
    ctx.strokeStyle = C(shade(sk, -.55)); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(m0, hy + 5.4); ctx.lineTo(m1, hy + 5.2); ctx.stroke();
    ctx.fillStyle = C(shade(sk, .12)); ctx.fillRect(Math.min(m0, m1) + Math.abs(m1 - m0) * .25, hy + 5.8, Math.abs(m1 - m0) * .5, .45);
  }
  for (const sd of [-1, 1]) { // ears, at the sides of the head
    const phi = sd * 1.62, d = D(phi); if (d < -.3) continue;
    ctx.fillStyle = C(shade(sk, -.18)); ell(P(phi, 7), hy + 1.4, .6 + .6 * Math.abs(Math.cos(phi + th)), 1.9); ctx.fill(); outline(.6);
  }
  // the hair: a cap fixed to the skull (it turns with him, it does not reshape), cut away for the face, with a ragged
  // fringe over the brow and locks over the ears
  const hairShape = () => ell(cx - .3, hy - 3.6, 9.9, 9.7);
  ctx.save(); hairShape(); ctx.clip(); ctx.beginPath(); ctx.rect(cx - 13, hy - 15, 26, Y > -.25 ? 19.4 : 21); ctx.clip();
  ctx.beginPath(); ctx.rect(cx - 13, hy - 15, 26, 32);
  if (Y > -.25) { const fv = clamp((Y + .25) / .55, 0, 1); const fx0 = cx + 4 * CS, frx = (3.9 + 2.1 * Math.max(0, Y)) * (.6 + .4 * fv); ctx.moveTo(fx0 + frx, hy + 3.4); ctx.ellipse(fx0, hy + 3.4, frx, 9.6, 0, 0, TAU); } // the face, cut out of the hair
  const hg = ctx.createLinearGradient(cx + 6, hy - 13, cx - 6, hy + 4); hg.addColorStop(0, C(shade(hair, .25))); hg.addColorStop(.45, C(hair)); hg.addColorStop(1, C(hd));
  ctx.fillStyle = hg; ctx.fill('evenodd');
  ctx.restore();
  ctx.beginPath(); ctx.ellipse(cx - .3, hy - 3.6, 10, 9.8, 0, Math.PI * .9, Math.PI * (Y > -.25 ? 1.76 : 2.1)); outline(1.05); // the crown's edge, kept off the face
  hairLocks(look, hy, Y, cx, 'front'); // the locks over it: the crown, over the ears, the nape, strands over the brow
  if (!FLASH && !TINT) {
    ctx.strokeStyle = hd; ctx.lineWidth = .6; ctx.lineCap = 'round'; ctx.beginPath(); // locks combed back by hand
    for (const o of [-3.4, 0, 3.4]) {
      if (Y > -.25) { ctx.moveTo(cx + o + 2.5 * CS, hy - 7.2); ctx.quadraticCurveTo(cx + o * .9, hy - 10.6, cx + o * .6 - 3 * CS, hy - 11.2); }
      else if (o) { ctx.moveTo(cx + o * .5, hy - 9.6); ctx.quadraticCurveTo(cx + o * .9, hy - 5, cx + o * .9, hy + 1.6); }
    }
    ctx.stroke();
    ctx.strokeStyle = hl; ctx.lineWidth = .6; ctx.globalAlpha *= .8; ctx.beginPath(); // warm light catching the top of the mop
    ctx.moveTo(cx + 6, hy - 10.6); ctx.quadraticCurveTo(cx + 1, hy - 13.4, cx - 5, hy - 11); ctx.stroke(); ctx.globalAlpha /= .8;
  }
}

// a hand in hand space (the wrist at x=13, the fingers toward +x): a clenched fist, knuckles forward, or a relaxed
// open hand with the fingers loosely curled and the thumb along the top
let HAND_S = 1; // the prince's hands are drawn smaller, in proportion to his figure
function drawHand(g, open) {
  if (HAND_S !== 1) { ctx.save(); ctx.translate(14, 0); ctx.scale(HAND_S, HAND_S); ctx.translate(-14, 0); const s = HAND_S; HAND_S = 1; drawHand(g, open); HAND_S = s; ctx.restore(); return; }
  if (open) {
    const fin = (y0, len, curl) => { const f = () => { ctx.beginPath(); ctx.moveTo(18.4, y0); ctx.quadraticCurveTo(18.4 + len * .7, y0 + curl * .3, 18.4 + len, y0 + curl); }; ctx.lineCap = 'round';
      f(); ctx.strokeStyle = FLASH ? '#FFFFFF' : INK; ctx.lineWidth = 1.7 + 1.4 * OUTK; ctx.stroke(); f(); ctx.strokeStyle = C(g); ctx.lineWidth = 1.7; ctx.stroke(); };
    for (const [y, l, c] of [[2.2, 3.6, 1.8], [.75, 4.6, 2], [-.75, 4.9, 1.8], [-2.2, 4.4, 1.5]]) fin(y, l, c); // little finger to index
    rrect(12.8, -3.2, 6.4, 6.4, 2.2); ctx.fillStyle = C(g); ctx.fill(); outline(1.1); // the palm and back of the hand
    if (!FLASH && !TINT) { ctx.fillStyle = shade(g, -.25); ctx.fillRect(13.2, 1.2, 6.2, 2.2); }
    const th = () => { ctx.beginPath(); ctx.moveTo(15, -3.4); ctx.quadraticCurveTo(18, -5.6, 20.6, -4.6); }; ctx.lineCap = 'round';
    th(); ctx.strokeStyle = FLASH ? '#FFFFFF' : INK; ctx.lineWidth = 2 + 1.4 * OUTK; ctx.stroke(); th(); ctx.strokeStyle = C(g); ctx.lineWidth = 2; ctx.stroke(); // the thumb
    if (HAND_PLATE) handPlates(g, true);
    return;
  }
  rrect(12.8, -4.5, 9.4, 9, 3); ctx.fillStyle = C(g); ctx.fill(); outline(1.1);
  if (!FLASH && !TINT) { ctx.fillStyle = shade(g, -.3); ctx.fillRect(13.3, 1.3, 8.4, 2.6); ctx.strokeStyle = shade(g, .4); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(21.4, -3.5); ctx.lineTo(21.4, 3); ctx.stroke(); }
  ctx.strokeStyle = C(shade(g, -.55)); ctx.lineWidth = .6; ctx.beginPath();
  for (const y of [-2.2, 0, 2.2]) { ctx.moveTo(18.6, y); ctx.lineTo(22, y); } // the folded fingers
  ctx.moveTo(18.4, -4.2); ctx.lineTo(18.4, 4.2); ctx.moveTo(15.4, -2.6); ctx.quadraticCurveTo(17.4, -3.1, 18.8, -1.4); ctx.stroke(); // the knuckle line, the thumb across
  if (HAND_PLATE) handPlates(g, false);
}
// the silver arm's gauntlet: a flared cuff at the wrist, a plate over the back of the hand and one over the knuckles
function handPlates(g, open) {
  ctx.beginPath(); ctx.moveTo(10.8, -5.4); ctx.lineTo(14.2, -4.4); ctx.lineTo(14.2, 4.4); ctx.lineTo(10.8, 5.4); ctx.closePath(); ctx.fillStyle = C(shade(g, -.12)); ctx.fill(); outline(.8);
  rrect(13.6, -3.6, open ? 5 : 4.4, open ? 4.2 : 7.2, 1.3); ctx.fillStyle = C(shade(g, .22)); ctx.fill(); outline(.6);
  if (!open) { rrect(18.4, -4.4, 3.6, 8.8, 1.2); ctx.fillStyle = C(shade(g, .12)); ctx.fill(); outline(.6); }
  if (!FLASH && !TINT) { ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(14.4, -3, 2.6, .7); }
}
// his silver rose: a rosebud seen from the side, petals cupped around a curled heart, on a short stem with a leaf
function silverRose(x, y, s, stem, base = '#A4AAB8') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const dk = shade(base, -.38), lt = shade(base, .32);
  if (stem) {
    ctx.strokeStyle = C('#4E5A48'); ctx.lineWidth = .9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 2.6); ctx.quadraticCurveTo(-.6, 5, -1.6, 6.6); ctx.stroke();
    ctx.fillStyle = C('#5E6E54'); ctx.beginPath(); ctx.moveTo(-.8, 4.6); ctx.quadraticCurveTo(-3.6, 3.6, -3.8, 5.6); ctx.quadraticCurveTo(-2.2, 5.8, -.8, 4.6); ctx.fill();
  }
  ctx.fillStyle = C(dk); ctx.beginPath(); ctx.moveTo(-2.8, -.4); ctx.quadraticCurveTo(-3.2, 2.6, 0, 2.8); ctx.quadraticCurveTo(3.2, 2.6, 2.8, -.4); ctx.quadraticCurveTo(0, 1, -2.8, -.4); ctx.fill(); // the cup
  ctx.fillStyle = C(base); ctx.beginPath(); ctx.moveTo(-2.6, -.6); ctx.quadraticCurveTo(-2.4, -3, 0, -3.1); ctx.quadraticCurveTo(2.4, -3, 2.6, -.6); ctx.quadraticCurveTo(0, 1.4, -2.6, -.6); ctx.fill(); outline(.6); // the bud
  ctx.fillStyle = C(lt); ctx.beginPath(); ctx.moveTo(-2.4, -.5); ctx.quadraticCurveTo(-1.6, 1.8, .6, 2.2); ctx.quadraticCurveTo(-1, .4, -.8, -1.2); ctx.closePath(); ctx.fill(); // the outer petal folding over, catching light
  ctx.strokeStyle = C(dk); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(-1.2, -1.6); ctx.quadraticCurveTo(0, -2.6, 1.2, -1.4); ctx.quadraticCurveTo(.4, -.4, -.4, -1.2); ctx.stroke(); // the curl of the heart
  ctx.restore();
}
// ---------- weapons (drawn in hand space: the hand is at (16,0), pointing along +x) ----------
// A hand closed round a handle, drawn in two layers so the handle passes through the fist: the back layer (the palm
// and the far side of the fist) is laid down before the handle, the front one (the fingers curled over the front of
// the handle, their knuckles, and the thumb wrapped round from the other side) after it. The fist is centred at
// GRIP.cx along the handle (hand space: the handle runs along x), turned by GRIP.rot (a bow's riser runs across).
// gripHand() draws the front layer when the back was laid already (GRIP.back), else the whole fist.
const GRIP = { cx: 17.1, rot: 0, back: false };
function gripCX(kind) { // where the fist closes on each weapon: a sword's or a rapier's on the grip below the guard
  return kind === 'sword' || kind === 'grayblade' || kind === 'rapier' ? 15.9 - 3.7 * HAND_S : kind === 'shortbow' ? 15.5 : 17.1;
}
function gripFrame(cx, rot, fn) { ctx.save(); ctx.translate(cx, 0); if (rot) ctx.rotate(rot); ctx.scale(HAND_S, HAND_S); fn(); ctx.restore(); }
function gripBack(col, cx = GRIP.cx, rot = GRIP.rot) {
  gripFrame(cx, rot, () => {
    if (HAND_PLATE) { ctx.beginPath(); ctx.moveTo(-6.6, -5.4); ctx.lineTo(-3.2, -4.4); ctx.lineTo(-3.2, 4.4); ctx.lineTo(-6.6, 5.4); ctx.closePath(); ctx.fillStyle = C(shade(col, -.12)); ctx.fill(); outline(.8); } // the gauntlet's cuff
    rrect(-3.7, -4.4, 7.4, 8.6, 2.6); ctx.fillStyle = C(shade(col, -.3)); ctx.fill(); outline(1.1); // the palm and the far side of the fist
  });
}
function gripFront(col, cx = GRIP.cx, rot = GRIP.rot) {
  gripFrame(cx, rot, () => {
    const det = !FLASH && !TINT;
    // four fingers, little finger (toward the pommel) to index (toward the guard), each curled over the front of the handle
    for (const [x, t, b] of [[-2.76, -2.9, 3.3], [-.92, -3.5, 3.9], [.92, -3.6, 4], [2.76, -3.4, 3.8]]) {
      rrect(x - .95, t, 1.9, b - t, .92);
      if (det) { const g = ctx.createLinearGradient(0, t, 0, b); g.addColorStop(0, shade(col, .1)); g.addColorStop(.55, col); g.addColorStop(1, shade(col, -.22)); ctx.fillStyle = g; } else ctx.fillStyle = C(col);
      ctx.fill(); outline(.65);
      if (det) {
        ctx.fillStyle = shade(col, .3); ell(x + .1, t + .62, .62, .42); ctx.fill(); // the knuckle
        ctx.strokeStyle = shade(col, -.45); ctx.lineWidth = .35; ctx.beginPath(); ctx.moveTo(x - .6, 1.1); ctx.quadraticCurveTo(x, 1.4, x + .6, 1.1); ctx.stroke(); // the middle joint's crease
      }
      if (HAND_PLATE) { ctx.fillStyle = C(shade(col, .14)); rrect(x - .95, t, 1.9, 2.2, .8); ctx.fill(); outline(.45); } // the gauntlet's lames over the knuckles
    }
    // the thumb, wrapped round from the other side and laid across the index finger
    const th = () => { ctx.beginPath(); ctx.moveTo(-1.6, -4.3); ctx.quadraticCurveTo(2.7, -4.9, 3.1, -.6); }; ctx.lineCap = 'round';
    th(); ctx.strokeStyle = FLASH ? '#FFFFFF' : INK; ctx.lineWidth = 2.1 + 1.3 * OUTK; ctx.stroke(); th(); ctx.strokeStyle = C(shade(col, .06)); ctx.lineWidth = 2.1; ctx.stroke();
    if (det) { ctx.fillStyle = shade(col, .35); ell(3.05, -1.05, .55, .4, 1.2); ctx.fill(); } // the thumbnail
    if (HAND_PLATE && det) { ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(-2.9, -3.2, 2.4, .5); }
  });
}
function gripHand(col) { // a gloved hand closed around a haft (the weapon's last stroke)
  if (GRIP.back) { GRIP.back = false; gripFront(col); return; }
  gripBack(col); gripFront(col);
}
function drawWeapon(kind, pose) {
  if (kind === 'fists' || !kind) { drawHand((pose && pose.glove) || '#FFF1E0', pose && pose.openHand); return; }
  if (kind === 'grayblade' || kind === 'rapier') { drawGrayblade(pose || {}); return; }
  if (kind === 'shortbow') { drawShortBow(pose || {}); return; } // the prince's own sword (art_rapier.js)
  // the hero's weapons change as they level: 1 iron and wood, 2 steel and leather, 3 gold and a gem, 4 runes that glow, 5 shadow-steel
  const tier = (pose && pose.tier) || 1, hand = (pose && pose.glove) || '#FFF1E0';
  const glowRune = (x, y, w, h, col) => { ctx.save(); if (!FLASH) { ctx.shadowColor = col; ctx.shadowBlur = 8; } ctx.fillStyle = C(col); ctx.fillRect(x, y, w, h); ctx.restore(); };
  const glow = (col, blur, fn) => { ctx.save(); if (!FLASH && !TINT) { ctx.shadowColor = col; ctx.shadowBlur = blur; } fn(); ctx.restore(); };
  const poly = (pts, col, w = 1.4) => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let k = 2; k < pts.length; k += 2) ctx.lineTo(pts[k], pts[k + 1]); ctx.closePath(); ctx.fillStyle = typeof col === 'string' ? C(col) : col; ctx.fill(); outline(w); };
  const vgrad = (y0, y1, col) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, C(shade(col, .35))); g.addColorStop(.5, C(col)); g.addColorStop(1, C(shade(col, -.3))); return g; };
  if (kind === 'hammer') {
    // each level is a different hammer: 1 an iron maul, 2 a steel war hammer with a beak, 3 a gilded, flanged maul with a ruby,
    // 4 a stormforged anvil-head with a spike and cyan runes, 5 the Shadow Breaker, black crystal crowned with spikes in a violet haze
    const L = tier >= 4 ? 48 : 44;
    const haft = ['#9A6234', '#6A4A30', '#4A2A1E', '#2A3444', '#1A1622'][tier - 1];
    limb([4, 0, L, 0], haft, 4);
    if (tier >= 2) { ctx.fillStyle = C(['', '#3A2A20', '#D8AA55', '#9FE8F0', '#8A6ACF'][tier - 1]); for (let x = 8; x < 30; x += 5) ctx.fillRect(x, -2.4, 1.8, 4.8); } // wraps and bands up the haft
    if (tier >= 3) { ctx.fillStyle = C(tier >= 5 ? '#8A6ACF' : tier >= 4 ? '#7F9AB8' : '#D8AA55'); circle(3, 0, 3.4); ctx.fill(); outline(1); } // pommel
    if (tier === 1) { rrect(36, -12, 18, 24, 4); ctx.fillStyle = vgrad(-12, 12, '#7E8494'); ctx.fill(); outline(); ctx.fillStyle = C('#5A606E'); ctx.fillRect(38, -12, 14, 2); }
    else if (tier === 2) {
      poly([38, 12, 52, 12, 45, 23], '#8E96A8', 1.3); // the beak behind
      rrect(36, -12, 18, 24, 3); ctx.fillStyle = vgrad(-12, 12, '#AAB2C2'); ctx.fill(); outline();
      ctx.fillStyle = C('#E8ECF4'); ctx.fillRect(37, -12, 16, 2.2); // bright striking face
      ctx.fillStyle = C('#5A606E'); circle(45, 0, 2.2); ctx.fill();
    } else if (tier === 3) {
      poly([35, -10, 38, -15, 52, -15, 55, -10, 55, 10, 52, 15, 38, 15, 35, 10], vgrad(-15, 15, '#B8BCC8'), 1.6); // flanged, eight-sided head
      ctx.fillStyle = C('#D8AA55'); ctx.fillRect(36, -15, 3, 30); ctx.fillRect(51, -15, 3, 30); ctx.fillRect(38, -2, 14, 4);
      glow('#E86A80', 8, () => { ctx.fillStyle = C('#C8304A'); ctx.beginPath(); ctx.moveTo(45, -5); ctx.lineTo(49, 0); ctx.lineTo(45, 5); ctx.lineTo(41, 0); ctx.closePath(); ctx.fill(); }); // ruby
    } else if (tier === 4) {
      poly([41, 14, 49, 14, 45, 28], '#9FB4C8', 1.3); // a spike behind
      poly([33, -18, 57, -18, 54, -12, 52, -6, 52, 6, 54, 12, 57, 18, 33, 18, 36, 12, 38, 6, 38, -6, 36, -12], vgrad(-18, 18, '#7F9AB8'), 1.7); // anvil head, flared faces
      ctx.fillStyle = C('#C8D8E8'); ctx.fillRect(34, -18, 22, 2.4); ctx.fillRect(34, 15.6, 22, 2.4);
      for (const y of [-11, -4, 3, 10]) glow('#9FE8F0', 9, () => { ctx.fillStyle = C('#BFF5FF'); ctx.fillRect(43, y - 1.5, 4, 2.4); }); // runes
    } else {
      poly([38, 16, 42, 30, 45, 18, 48, 34, 52, 16], '#2E2A3E', 1.3); // crystal spikes behind
      poly([40, -16, 42, -30, 45, -18, 48, -26, 50, -16], '#2E2A3E', 1.3); // and above
      poly([32, -16, 58, -16, 60, -8, 56, 0, 60, 8, 58, 16, 32, 16, 30, 8, 34, 0, 30, -8], vgrad(-16, 16, '#2E2A3E'), 1.8); // obsidian head
      ctx.strokeStyle = C('#B89CFF'); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(33, -12); ctx.lineTo(44, -2); ctx.lineTo(39, 8); ctx.moveTo(57, -10); ctx.lineTo(48, 2); ctx.lineTo(55, 12); ctx.stroke(); // violet cracks
      glow('#B89CFF', 12, () => { ctx.fillStyle = C('#D8C8FF'); circle(45, 0, 3.6); ctx.fill(); });
    }
    if (!(pose && pose.noHand)) gripHand(hand); return;
  }
  if (kind === 'staff') {
    // 1 a plain ash staff, 2 ironbound with steel points, 3 crimson lacquer with gold bands and a tassel,
    // 4 the Moonspear: pale silver with a crescent blade, 5 the Shadow Pole: black, with violet crystal blades at both ends
    const len = tier >= 4 ? 62 : 58, back = -28;
    const shaft = ['#B56B2E', '#6A4A30', '#9A2A30', '#A8BCD0', '#1C1626'][tier - 1];
    const rib = ['#C8607A', '#C8607A', '#E8343A', '#9FE8F0', '#8A6ACF'][tier - 1];
    ctx.strokeStyle = C(rib); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(back + 2, 0); ctx.quadraticCurveTo(back - 6, 8, back - 10 + Math.sin(performance.now() / 120) * 3, 14); ctx.stroke(); // ribbon
    if (tier === 3) { ctx.fillStyle = C('#E8343A'); ctx.beginPath(); ctx.moveTo(back - 9, 13); ctx.lineTo(back - 14, 22); ctx.lineTo(back - 6, 21); ctx.closePath(); ctx.fill(); } // tassel
    limb([back, 0, len, 0], shaft, 3.6);
    if (tier === 1) { ctx.fillStyle = C('#C9A86A'); rrect(back - 4, -3, 7, 6, 2); ctx.fill(); rrect(len - 4, -3, 7, 6, 2); ctx.fill(); }
    else if (tier === 2) {
      ctx.fillStyle = C('#5A606E'); for (const x of [-8, 6, 26, 40]) ctx.fillRect(x, -2.4, 2.4, 4.8); // iron bands
      poly([len - 3, -3, len + 9, 0, len - 3, 3], '#C8CCD4', 1.1); poly([back + 3, -3, back - 9, 0, back + 3, 3], '#C8CCD4', 1.1); // steel points
    } else if (tier === 3) {
      ctx.fillStyle = C('#D8AA55'); for (const x of [-12, 0, 12, 28, 42]) ctx.fillRect(x, -2.6, 2.6, 5.2);
      for (const x of [back - 3, len - 2]) { ctx.fillStyle = C('#D8AA55'); circle(x, 0, 4.4); ctx.fill(); outline(1.1); ctx.fillStyle = C('#E8343A'); circle(x, 0, 1.6); ctx.fill(); } // gilded knobs set with garnets
    } else if (tier === 4) {
      ctx.beginPath(); ctx.moveTo(len - 4, -2); ctx.quadraticCurveTo(len + 14, -16, len + 20, -2); ctx.quadraticCurveTo(len + 12, -8, len + 2, 0); ctx.quadraticCurveTo(len + 12, 8, len + 20, 2); ctx.quadraticCurveTo(len + 14, 16, len - 4, 2); ctx.closePath(); // a crescent blade
      ctx.fillStyle = vgrad(-14, 14, '#E2EEF8'); ctx.fill(); outline(1.3);
      ctx.fillStyle = C('#7F9AB8'); rrect(back - 4, -3, 7, 6, 2); ctx.fill();
      for (const x of [-6, 14, 34]) glow('#9FE8F0', 8, () => { ctx.fillStyle = C('#BFF5FF'); ctx.fillRect(x, -2.6, 2, 5.2); });
    } else {
      for (const [x, d] of [[len - 2, 1], [back + 2, -1]]) glow('#B89CFF', 12, () => poly([x, -3.4, x + d * 6, -6, x + d * 22, 0, x + d * 6, 6, x, 3.4], '#4A3A7A', 1.2)); // crystal blades
      ctx.fillStyle = C('#B89CFF'); for (const x of [-10, 8, 26, 44]) ctx.fillRect(x, -2.4, 1.6, 4.8);
    }
    if (!(pose && pose.noHand)) gripHand(hand); return;
  }
  if (kind === 'sword' && tier <= 4) {
    // the hero's great sword, a different blade at each level: 1 a plain iron greatsword, 2 a steel claymore with a
    // downswept guard and a dark fuller, 3 a gilded zweihänder with a winged guard, a gem and parrying hooks,
    // 4 a frost flamberge, its wavy blade lit with runes. (Level 5, the black shadow blade, is drawn below.)
    const len = [64, 67, 70, 72][tier - 1], x0 = 20, tip = x0 + len + 6;
    limb([6, 0, 17, 0], ['#4A2E20', '#3A2A20', '#5A1E22', '#2A3444'][tier - 1], 4); // grip
    { const pc = ['#C9A052', '#C9A052', '#D8AA55', '#9FB4C8'][tier - 1], pr = tier >= 3 ? 3.6 : 3.1; // a round brass pommel, polished
      const pg = ctx.createRadialGradient(5.8, -1.2, .3, 5, 0, pr); pg.addColorStop(0, C(shade(pc, .6))); pg.addColorStop(.5, C(pc)); pg.addColorStop(1, C(shade(pc, -.45)));
      ctx.fillStyle = pg; circle(5, 0, pr); ctx.fill(); outline(1); }
    if (!FLASH && !TINT && tier <= 2) { ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = .5; ctx.beginPath(); for (let x = 8; x < 16; x += 1.6) { ctx.moveTo(x, -1.9); ctx.lineTo(x + 1, 1.9); } ctx.stroke(); } // the grip's leather binding
    const bc = ['#B8BEC8', '#DCE2EC', '#ECF0F8', '#CFE6F4'][tier - 1];
    ctx.beginPath();
    if (tier === 4) { // a flame-shaped edge, rippling along both sides
      const n = 7; ctx.moveTo(x0, -5);
      for (let k = 1; k <= n; k++) { const x = x0 + len * k / n, w = 5 - k * .25; ctx.quadraticCurveTo(x - len / n / 2, -w - 2.2, x, -w); }
      ctx.lineTo(tip + 2, 0);
      for (let k = n; k >= 1; k--) { const x = x0 + len * (k - 1) / n, w = 5 - (k - 1) * .25; ctx.quadraticCurveTo(x + len / n / 2, w + 2.2, x, w); }
    } else { const w = tier === 3 ? 6 : 5; ctx.moveTo(x0, -w); ctx.lineTo(x0 + len, -3); ctx.lineTo(tip, 0); ctx.lineTo(x0 + len, 3); ctx.lineTo(x0, w); }
    ctx.closePath();
    const bg = ctx.createLinearGradient(0, -6, 0, 6); bg.addColorStop(0, C(shade(bc, .35))); bg.addColorStop(.5, C(bc)); bg.addColorStop(1, C(shade(bc, -.25)));
    ctx.fillStyle = bg; ctx.fill(); outline(1.8);
    ctx.fillStyle = C('#FFFFFF'); ctx.fillRect(x0 + 2, -3, len - 4, 1.2); // the edge catching light
    if (tier >= 2) { ctx.fillStyle = C(tier === 4 ? '#7F9AB8' : shade(bc, -.4)); ctx.fillRect(x0 + 4, -.6, len * .72, 1.4); } // fuller
    if (tier === 1) { // a straight brass crossguard, flaring a little to rounded ends
      ctx.beginPath(); ctx.moveTo(16.2, -9.4); ctx.quadraticCurveTo(18, -8, 19.8, -9.4); ctx.lineTo(19.4, 9.4); ctx.quadraticCurveTo(18, 8, 16.6, 9.4); ctx.closePath();
      const gg = ctx.createLinearGradient(16, 0, 20, 0); gg.addColorStop(0, C('#F2D48A')); gg.addColorStop(.5, C('#C9A052')); gg.addColorStop(1, C('#7A5A24')); ctx.fillStyle = gg; ctx.fill(); outline(1.2);
      ctx.fillStyle = C('#C9A052'); circle(18, -9.6, 1.6); ctx.fill(); outline(.8); circle(18, 9.6, 1.6); ctx.fill(); outline(.8); }
    else if (tier === 2) { // downswept brass quillons ending in knobs
      ctx.strokeStyle = C('#C9A052'); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(14, -12); ctx.quadraticCurveTo(19, -6, 19, 0); ctx.quadraticCurveTo(19, 6, 14, 12); ctx.stroke();
      ctx.fillStyle = C('#EAD08A'); circle(14, -12, 2.2); ctx.fill(); circle(14, 12, 2.2); ctx.fill();
    } else if (tier === 3) {
      ctx.fillStyle = C('#D8AA55'); ctx.beginPath(); ctx.moveTo(18, -4); ctx.lineTo(13, -14); ctx.lineTo(22, -5); ctx.lineTo(22, 5); ctx.lineTo(13, 14); ctx.lineTo(18, 4); ctx.closePath(); ctx.fill(); outline(1.2); // winged guard
      poly([30, -6, 33, -10, 35, -6], '#D8AA55', 1); poly([30, 6, 33, 10, 35, 6], '#D8AA55', 1); // parrying hooks
      glow('#E86A80', 8, () => { ctx.fillStyle = C('#C8304A'); circle(20, 0, 2.3); ctx.fill(); });
    } else { // a curved guard of blue steel, and frost runes down the blade
      ctx.strokeStyle = C('#7F9AB8'); ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(22, -13); ctx.quadraticCurveTo(15, -6, 19, 0); ctx.quadraticCurveTo(15, 6, 22, 13); ctx.stroke();
      for (let x = 28; x < 14 + len; x += 9) glowRune(x, -.8, 4, 1.6, '#9FE8F0');
    }
    if (pose && pose.glow) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .55; ctx.fillStyle = pose.glow; rrect(16, -10, len + 14, 20, 8); ctx.fill(); ctx.restore(); }
    if (!(pose && pose.noHand)) gripHand(hand); // his hand closed on the grip
    return;
  }
  // enemies' weapons can be redrawn in their own file (art_world.js) without touching the hero's
  if (kind !== 'sword' && typeof ENEMY_WEAPONS !== 'undefined' && ENEMY_WEAPONS[kind]) { ENEMY_WEAPONS[kind](pose || {}); return; }
  if (kind === 'sword' || kind === 'blade' || kind === 'prism') {
    const hero = kind === 'sword', len = hero ? 64 + (tier >= 4 ? 8 : tier >= 2 ? 3 : 0) : 44;
    const bc = kind === 'prism' ? '#C9F6FF' : kind === 'blade' ? '#BFF5EF' : ['#C8CCD4', '#E2E8F2', '#E8F0FF', '#DDE6FF', '#2A2236'][tier - 1];
    const edge = hero && tier >= 5 ? '#B89CFF' : '#FFFFFF';
    limb([6, 0, 17, 0], hero && tier >= 2 ? '#3A2A20' : '#5A3A2A', 4);
    if (hero && tier >= 3) { ctx.fillStyle = C('#D8AA55'); ctx.beginPath(); ctx.moveTo(18, -4); ctx.lineTo(14, -12); ctx.lineTo(21, -5); ctx.lineTo(21, 5); ctx.lineTo(14, 12); ctx.lineTo(18, 4); ctx.closePath(); ctx.fill(); outline(1.2); ctx.fillStyle = C('#C8607A'); circle(19.5, 0, 2); ctx.fill(); } // winged crossguard with a gem
    else { rrect(16, -9, 4, 18, 2); ctx.fillStyle = C(hero && tier >= 2 ? '#A8B0C2' : '#D8AA55'); ctx.fill(); outline(1.5); }
    ctx.beginPath(); ctx.moveTo(20, -5); ctx.lineTo(20 + len, -3); ctx.lineTo(26 + len, 0); ctx.lineTo(20 + len, 3); ctx.lineTo(20, 5); ctx.closePath();
    const bg = ctx.createLinearGradient(0, -5, 0, 5); bg.addColorStop(0, C(shade(bc, .35))); bg.addColorStop(.5, C(bc)); bg.addColorStop(1, C(shade(bc, -.25)));
    ctx.fillStyle = bg; ctx.fill(); outline(1.8);
    ctx.fillStyle = C(edge); ctx.fillRect(22, -3, len - 4, 1.4);
    if (hero && tier >= 4) for (let x = 28; x < 16 + len; x += 9) glowRune(x, -.8, 4, 1.6, tier >= 5 ? '#B89CFF' : '#9FE8F0'); // runes down the fuller
    if (hero && tier >= 5 && !FLASH) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(184,156,255,.22)'; rrect(18, -9, len + 12, 18, 9); ctx.fill(); ctx.restore(); }
    if (pose && pose.glow) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .55;
      ctx.fillStyle = pose.glow; rrect(16, -10, len + 14, 20, 8); ctx.fill(); ctx.restore();
    }
    if (hero && !(pose && pose.noHand)) gripHand(pose.glove || "#FFF1E0");
    return;
  }
  if (kind === 'dagger') { limb([6, 0, 17, 0], '#4A3A2A', 3.5); ctx.beginPath(); ctx.moveTo(18, -3); ctx.lineTo(36, 0); ctx.lineTo(18, 3); ctx.closePath(); ctx.fillStyle = C('#D8DCE6'); ctx.fill(); outline(1.2); return; }
  if (kind === 'bow') { ctx.strokeStyle = C('#6E4A2A'); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(10, 0, 18, -1.3, 1.3); ctx.stroke(); ctx.strokeStyle = C('#E8E0D0'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(10 + Math.cos(-1.3) * 18, Math.sin(-1.3) * 18); ctx.lineTo(2, 0); ctx.lineTo(10 + Math.cos(1.3) * 18, Math.sin(1.3) * 18); ctx.stroke(); circle(17, 0, 4); ctx.fillStyle = C('#E8C4A4'); ctx.fill(); return; }
  if (kind === 'rifle') { rrect(2, -3, 34, 6, 2); ctx.fillStyle = C('#5A4A3E'); ctx.fill(); outline(1.4); ctx.fillStyle = C('#9A7038'); ctx.fillRect(14, -4.5, 12, 2); ctx.fillStyle = C('#9FD8E8'); circle(36, 0, 2.2); ctx.fill(); return; }
  if (kind === 'orb') { limb([4, 0, 30, 0], '#3A3050', 3); ctx.save(); if (!FLASH) { ctx.shadowColor = '#9FE8F0'; ctx.shadowBlur = 10; } circle(33, 0, 6); ctx.fillStyle = C('#BFF0F5'); ctx.fill(); ctx.restore(); return; }
  if (kind === 'cannon') { rrect(4, -6, 26, 12, 4); ctx.fillStyle = C('#3CC6C0'); ctx.fill(); outline(); ctx.fillStyle = C('#FFF4A8'); circle(30, 0, 3); ctx.fill(); return; }
}

// ---------- humanoids: the hero, the brass automatons and the colossus ----------
// Feet at y=0, hips at -26, shoulders at -46, head at -56. +x is the facing direction.
// a shaped limb segment from joint A to joint B: tapered, with a muscle swell, a shadowed underside,
// a rim of light along the top edge and an outline. Widths are the limb's thickness at each joint.
function seg(ax, ay, bx, by, wa, wb, col, bul = 0) {
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, ang = Math.atan2(dy, dx);
  const mx = (ax + bx) / 2, my = (ay + by) / 2, wm = (wa + wb) / 4;
  const path = () => {
    ctx.beginPath(); ctx.moveTo(ax + nx * wa / 2, ay + ny * wa / 2);
    ctx.quadraticCurveTo(mx + nx * (wm + bul), my + ny * (wm + bul), bx + nx * wb / 2, by + ny * wb / 2);
    ctx.arc(bx, by, wb / 2, ang + Math.PI / 2, ang - Math.PI / 2, true);
    ctx.quadraticCurveTo(mx - nx * (wm + bul * .5), my - ny * (wm + bul * .5), ax - nx * wa / 2, ay - ny * wa / 2);
    ctx.arc(ax, ay, wa / 2, ang - Math.PI / 2, ang - Math.PI * 1.5, true); ctx.closePath();
  };
  path(); ctx.fillStyle = C(col); ctx.fill();
  if (!FLASH && !TINT) {
    ctx.save(); path(); ctx.clip(); ctx.lineCap = 'round';
    ctx.strokeStyle = shade(col, -.32); ctx.lineWidth = (wa + wb) * .32; // the shadowed underside
    ctx.beginPath(); ctx.moveTo(ax + nx * wa / 2, ay + ny * wa / 2); ctx.quadraticCurveTo(mx + nx * (wm + bul), my + ny * (wm + bul), bx + nx * wb / 2, by + ny * wb / 2); ctx.stroke();
    ctx.strokeStyle = shade(col, .3); ctx.lineWidth = .9; // light along the top edge
    ctx.beginPath(); ctx.moveTo(ax - nx * (wa / 2 - .7), ay - ny * (wa / 2 - .7)); ctx.quadraticCurveTo(mx - nx * (wm + bul * .5 - .7), my - ny * (wm + bul * .5 - .7), bx - nx * (wb / 2 - .7), by - ny * (wb / 2 - .7)); ctx.stroke();
    ctx.restore();
  }
  path(); outline(1.1);
}
// ---------- skinned limbs (the prince) ----------
// One arm or leg drawn as a single closed outline down its chain of joints (shoulder-elbow-wrist, hip-knee-ankle)
// instead of two sticks pinned together. Both edges are offset from the bones by a width profile (W: the root, the
// upper swell, the joint, where the upper swell sits, the lower swell, the end, where it sits) and traced with smooth curves,
// so the joint reads as one bending limb: the outside of the bend stays round (an arc about the joint), the inside
// compresses into a soft crease where the two offset edges meet. The root is left un-inked so it melts into the
// shoulder or the seat it grows out of. col2 (optional) colors the lower half from just past the joint: a boot shaft
// under the knee. Shadow along the +n edge and a rim of light along the other, as seg() does.
const SKL = [], SKR = []; // reused point buffers: [x0, y0, x1, y1, ...] down each edge
const skW = (a, m, b, u, t) => t < u ? a + (m - a) * (1 - Math.cos(Math.PI * t / u)) / 2 : m + (b - m) * (1 - Math.cos(Math.PI * (t - u) / (1 - u))) / 2;
function skinEdges(ax, ay, bx, by, cx, cy, W, s) {
  let d1x = bx - ax, d1y = by - ay; const l1 = Math.hypot(d1x, d1y) || 1e-3; d1x /= l1; d1y /= l1;
  let d2x = cx - bx, d2y = cy - by; const l2 = Math.hypot(d2x, d2y) || 1e-3; d2x /= l2; d2y /= l2;
  const cr = d1x * d2y - d1y * d2x, th = Math.acos(clamp(d1x * d2x + d1y * d2y, -1, 1)), j = W[2] * s / 2;
  const cut = j * Math.tan(Math.min(th, 2.5) / 2) * 1.05; // how far the inside edges overlap at the bend
  SKL.length = 0; SKR.length = 0;
  for (const sd of [1, -1]) {
    const E = sd > 0 ? SKL : SKR, inner = th > .06 && (cr > 0) === (sd > 0);
    for (const t of [0, .22, .45, .7, .88]) { if (inner && (1 - t) * l1 < cut) continue; const w = skW(W[0], W[1], W[2], W[3], t) * s / 2;
      E.push(ax + d1x * t * l1 - d1y * sd * w, ay + d1y * t * l1 + d1x * sd * w); }
    if (th <= .06) E.push(bx - d1y * sd * j, by + d1x * sd * j);
    else if (inner) { // the crease: where the two inside edges meet, pulled in a little as the flesh compresses
      let nx = -d1y - d2y, ny = d1x + d2x; const nl = Math.hypot(nx, ny) || 1; nx = nx / nl * sd; ny = ny / nl * sd;
      const r = Math.min(j * 1.25, j / Math.max(.3, Math.cos(th / 2))) * .88; E.push(bx + nx * r, by + ny * r);
    } else { // round over the outside of the joint
      const a0 = Math.atan2(d1x * sd, -d1y * sd); let da = Math.atan2(d2x * sd, -d2y * sd) - a0; da = Math.atan2(Math.sin(da), Math.cos(da));
      for (const q of [0, .5, 1]) { const a = a0 + da * q, r = j * (1.03 + .05 * Math.sin(Math.PI * q)); E.push(bx + Math.cos(a) * r, by + Math.sin(a) * r); }
    }
    for (const t of [.12, .3, .55, .8, 1]) { if (inner && t * l2 < cut) continue; const w = skW(W[2], W[4], W[5], W[6], t) * s / 2;
      E.push(bx + d2x * t * l2 - d2y * sd * w, by + d2y * t * l2 + d2x * sd * w); }
  }
  return { d1x, d1y, d2x, d2y, th, cr, j };
}
function skTrace(E, rev, first) { // a smooth curve through an edge's points (midpoint quadratics)
  const n = E.length / 2, at = (i) => (rev ? n - 1 - i : i) * 2;
  let o = at(0); if (first) ctx.moveTo(E[o], E[o + 1]); else ctx.lineTo(E[o], E[o + 1]);
  for (let i = 1; i < n - 1; i++) { const p = at(i), q = at(i + 1); ctx.quadraticCurveTo(E[p], E[p + 1], (E[p] + E[q]) / 2, (E[p + 1] + E[q + 1]) / 2); }
  o = at(n - 1); ctx.lineTo(E[o], E[o + 1]);
}
function skinLimb(ax, ay, bx, by, cx, cy, W, s, col, col2, split = .5) {
  const g = skinEdges(ax, ay, bx, by, cx, cy, W, s), ra = W[0] * s / 2, rc = W[5] * s / 2;
  const a1 = Math.atan2(g.d1y, g.d1x), a2 = Math.atan2(g.d2y, g.d2x);
  const path = (close) => { ctx.beginPath(); skTrace(SKL, false, true); ctx.arc(cx, cy, rc, a2 + Math.PI / 2, a2 - Math.PI / 2, true); skTrace(SKR, true, false);
    if (close) { ctx.arc(ax, ay, ra, a1 - Math.PI / 2, a1 - Math.PI * 1.5, true); ctx.closePath(); } };
  path(true); ctx.fillStyle = C(col); ctx.fill();
  const det = !FLASH && !TINT;
  if (col2 || det) {
    ctx.save(); path(true); ctx.clip();
    if (col2) { // the lower half in its own color, from just past the joint
      const ox = bx + g.d2x * split * s, oy = by + g.d2y * split * s, w = W[4] * s * .75, L = Math.hypot(cx - bx, cy - by) + 12;
      ctx.beginPath(); ctx.moveTo(ox - g.d2y * w, oy + g.d2x * w); ctx.lineTo(ox + g.d2y * w, oy - g.d2x * w); ctx.lineTo(ox + g.d2y * w + g.d2x * L, oy - g.d2x * w + g.d2y * L); ctx.lineTo(ox - g.d2y * w + g.d2x * L, oy + g.d2x * w + g.d2y * L); ctx.closePath();
      ctx.fillStyle = C(col2); ctx.fill();
    }
    if (det) {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const fine = OUTK < 1; // (the prince: a rounder form, a soft core shadow and a reflected light inside it)
      if (fine) { ctx.strokeStyle = 'rgba(12,6,16,.2)'; ctx.lineWidth = (W[1] + W[4]) * s * .62; ctx.beginPath(); skTrace(SKL, false, true); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(12,6,16,.34)'; ctx.lineWidth = (W[1] + W[4]) * s * .3; ctx.beginPath(); skTrace(SKL, false, true); ctx.stroke(); // the shadowed side
      if (fine) { ctx.strokeStyle = 'rgba(150,120,100,.14)'; ctx.lineWidth = .9; ctx.beginPath(); skTrace(SKL, false, true); ctx.stroke(); }
      ctx.strokeStyle = fine ? 'rgba(255,248,236,.16)' : 'rgba(255,248,236,.3)'; ctx.lineWidth = fine ? 2.6 : 1.7; ctx.beginPath(); skTrace(SKR, false, true); ctx.stroke(); // light along the other
      if (fine) { ctx.strokeStyle = 'rgba(255,248,236,.22)'; ctx.lineWidth = .8; ctx.beginPath(); skTrace(SKR, false, true); ctx.stroke(); }
      if (g.th > .45) { // the crease on the inside of the bend
        const sd = g.cr > 0 ? 1 : -1; let nx = -g.d1y - g.d2y, ny = g.d1x + g.d2x; const nl = Math.hypot(nx, ny) || 1; nx = nx / nl * sd; ny = ny / nl * sd;
        const r = g.j * Math.min(1.1, .9 / Math.max(.3, Math.cos(g.th / 2)));
        ctx.strokeStyle = 'rgba(12,6,16,.5)'; ctx.lineWidth = .75; ctx.beginPath(); ctx.moveTo(bx + nx * r, by + ny * r); ctx.lineTo(bx + nx * r * .3, by + ny * r * .3); ctx.stroke();
      }
    }
    ctx.restore();
  }
  path(false); ctx.lineJoin = 'round'; outline(1.1);
}
// a booted foot, toe forward: shaft, heel, a thick sole and a shine on the toe
function boot(x, col) {
  ctx.beginPath(); ctx.moveTo(x - 3.4, -9); ctx.lineTo(x - 4, -1.4); ctx.lineTo(x - 4.4, 0); ctx.lineTo(x + 6.6, 0); ctx.quadraticCurveTo(x + 7, -2.8, x + 4.6, -3.8); ctx.quadraticCurveTo(x + 2.4, -4.6, x + 2.2, -9); ctx.closePath();
  ctx.fillStyle = C(col); ctx.fill(); outline(1.1);
  ctx.fillStyle = C(shade(col, -.5)); ctx.fillRect(x - 4.4, -1.4, 11, 1.4); // sole
  ctx.fillStyle = C(shade(col, .25)); ctx.fillRect(x - 3.6, -9, 6, 1.6); // cuff
  if (!FLASH && !TINT) { ctx.fillStyle = 'rgba(255,245,230,.35)'; ell(x + 4.4, -2.6, 1.6, .7, -.3); ctx.fill(); } // shine
}
// Kicks are animated from the move's progress: the knee chambers up, the leg snaps out, then folds back.
// 'lunge' is a driving thrust kick on the ground: the body arches back over a deep-bent standing leg and the
// heel goes out at chest height. 'drop' is a flying dropkick: the body lays out flat in the air and both feet
// spear forward together, soles first.
function kickOut(k, h0, h1) { // 0 chambered .. 1 full extension, with a snap out and a slower recovery
  return k < h0 ? ease(k / h0) * .25 : k <= h1 ? .25 + .75 * Math.min(1, (k - h0) / Math.max(.04, (h1 - h0) * .3)) : Math.max(0, 1 - ease((k - h1) / Math.max(.05, 1 - h1)));
}
function drawKickLegs(look, pose, HIP, hx, Y = 0, CS = 1, LS = 1) {
  const out = kickOut(pose.kickK, pose.kickH[0], pose.kickH[1]), chamber = pose.kickK < pose.kickH[0];
  const L = (a, b, t) => a + (b - a) * t, legs = look.legs;
  // the prince's legs are dressed by his own costume (art_corwin.js): trousers, knee cops and tall boots
  const cw = look.corwin ? CORWIN.PART('pants', look) : null; let last = null;
  const deco = () => { if (!cw || !last) return; const [h, kn, ft, far, s] = last; last = null; cw.shinDetail(look, kn[0], kn[1], ft[0], ft[1], far, s);
    const tx = kn[0] - h[0], ty = kn[1] - h[1], sx = ft[0] - kn[0], sy = ft[1] - kn[1], tl = Math.hypot(tx, ty) || 1, sl = Math.hypot(sx, sy) || 1; cw.knee(look, kn[0], kn[1], tx / tl + sx / sl, ty / tl + sy / sl, far, s); };
  const foot = (col) => { if (cw) { ctx.save(); ctx.scale(1 / LS, 1); cw.foot(look, 0, col !== look.boots); ctx.restore(); } else boot(0, col); }; // (drawn long: keep the foot its length)
  const bootAt = (x, y, ang, col) => { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.translate(-1, 9); foot(col); ctx.restore(); deco(); };
  const footAt = (x, col, rot = 0) => { ctx.save(); ctx.translate(x, 0); if (rot) ctx.rotate(rot); foot(col); ctx.restore(); deco(); };
  const lw = pose.kickStyle === 'drop' ? 1.25 : 1, limb = (h, kn, ft, col) => {
    if (cw) { const far = col !== legs; CORWIN.legSkin(look, h[0], h[1], kn[0], kn[1], ft[0], ft[1], far, lw / LS, cw); last = [h, kn, ft, far, lw / LS]; return; }
    seg(h[0], h[1], kn[0], kn[1], 8.4 * lw, 6.6 * lw, col, .9); seg(kn[0], kn[1], ft[0], ft[1], 6.6 * lw, 5 * lw, col, .8); };
  // turned, each leg is foreshortened along his facing and set out to its own side; the nearer one is drawn last
  const SX = pose.kickStyle === 'drop' ? 1 : Math.max(.4, CS); // the dropkick's legs point straight along the body: turning doesn't shorten them
  ctx.save(); ctx.scale(SX, 1);
  const side = (lz, f) => { ctx.save(); ctx.translate(-lz * Y / SX, 0); f(); ctx.restore(); };
  const kickFar = Y < -.2; // his back to us: the kicking leg reaches away on the far side of his body
  let support, kicker;
  if (pose.kickStyle === 'drop') {
    // both legs tuck to the chest, then shoot out straight and together; the body is laid out by pose.rot.
    // Piked at the hips so the legs and the body make a clear V, the far leg a touch higher
    const t = chamber ? 0 : out;
    const far = [[-1 + hx, HIP], [L(9, 4, t), L(HIP + 4, HIP + 16, t)], [L(1, 6, t), L(HIP + 12, HIP + 32, t)]];
    const near = [[3 + hx, HIP], [L(12, 6, t), L(HIP + 2, HIP + 16, t)], [L(5, 8, t), L(HIP + 11, HIP + 32, t)]]; // legs locked straight out, soles leading
    const fa = L(-.5, 0, t);
    support = () => side(-4, () => { limb(...far, shade(legs, -.15)); bootAt(far[2][0], far[2][1] - 9, fa, shade(look.boots, -.1)); });
    kicker = () => side(4, () => { limb(...near, legs); bootAt(near[2][0], near[2][1] - 9, fa, look.boots); });
  } else if (pose.kickStyle === 'round') {
    // a roundhouse: the standing leg straight under him (tucked up when he is airborne), the kicking leg swung out level at the hip
    const air = pose.kickAir;
    support = () => side(-4, () => {
      if (air) { limb([-2 + hx, HIP], [8, HIP + 9], [-1, HIP + 17], shade(legs, -.15)); bootAt(-2, HIP + 21, -.5, shade(look.boots, -.1)); }
      else { limb([-2 + hx, HIP], [-1, -15], [-3, -8], shade(legs, -.15)); footAt(-3.4, shade(look.boots, -.1)); }
    });
    const kn = [L(12, 16, out), L(HIP + 2, HIP - 2, out)], ft = [L(6, 33, out), L(HIP + 12, HIP - 5, out)];
    kicker = () => side(4, () => { limb([2 + hx, HIP], kn, ft, kickFar ? shade(legs, -.15) : legs); bootAt(ft[0], ft[1], L(.4, -Math.PI / 2 + .5, out), look.boots); });
  } else if (pose.kickStyle === 'slide') {
    // a baseball slide: the trailing leg folded under him, knee down on the street, and the lead leg shot out low along it, toe up
    const kn0 = [L(-6, -12, out), L(-12, -5, out)], ft0 = [L(-2, -3, out), L(-6, -2.5, out)];
    support = () => side(-4, () => { limb([-2 + hx, HIP], kn0, ft0, kickFar ? legs : shade(legs, -.15)); bootAt(ft0[0], ft0[1], L(.3, 1.35, out), kickFar ? look.boots : shade(look.boots, -.1)); });
    const kn = [L(10, 17, out), L(HIP + 5, -9, out)], ft = [L(14, 33, out), L(HIP + 14, -6, out)];
    kicker = () => side(4, () => { limb([2 + hx, HIP], kn, ft, kickFar ? shade(legs, -.15) : legs); bootAt(ft[0], ft[1], L(.2, -Math.PI / 2 + .3, out), kickFar ? shade(look.boots, -.1) : look.boots); });
  } else {
    // a driving thrust kick: the standing leg bent deep and turned out, heel up, pushing the hips in; the kicking
    // leg's knee pulled up high to the chest, then the heel driven straight out, leg locked, at chest height
    const sx = L(-4, -11, out), skx = L(2, 4, out), sky = L(-15, -12, out);
    if (pose.kickTuck) support = () => side(-4, () => { // in the air the other leg is folded up tight under him, knee high, heel to the seat
      const kn = [L(6, 10, out), L(HIP + 4, HIP + 1, out)], ft = [L(-3, -6, out), L(HIP + 12, HIP + 9, out)];
      limb([-2 + hx, HIP], kn, ft, kickFar ? legs : shade(legs, -.15)); bootAt(ft[0], ft[1], L(.9, 1.2, out), kickFar ? look.boots : shade(look.boots, -.1)); });
    else support = () => side(-4, () => { limb([-2 + hx, HIP], [skx, sky], [sx + .4, -8], kickFar ? legs : shade(legs, -.15)); footAt(sx, kickFar ? look.boots : shade(look.boots, -.1), -.22 * out); });
    const kn = [L(13, 17, out), L(HIP - 7, HIP - 5, out)], ft = [L(12, 35, out), L(HIP + 6, HIP - 9, out)];
    kicker = () => side(4, () => { limb([2 + hx, HIP], kn, ft, kickFar ? shade(legs, -.15) : legs); bootAt(ft[0], ft[1], L(.2, -Math.PI / 2 - .12, out), kickFar ? shade(look.boots, -.1) : look.boots); });
  }
  const seat = () => { if (cw) side(0, () => CORWIN.seat(look, -2 + hx, 2 + hx, HIP, lw / LS, 4)); }; // the thighs grow out of one seat
  if (kickFar) { kicker(); seat(); support(); } else { support(); seat(); kicker(); }
  ctx.restore();
}
// where the weapon's grip is, a little below the weapon hand, in the upper body's frame: the same chain of transforms
// frontArm() draws through (shoulder, arm, sweep, reach or bent elbow, wrist turn), worked out ahead so the far arm can reach it
function twoHandGrip(pose, PX, SHO, sw, armSw, ASX, AS = 1, SWL = 9.5) {
  const arm = (pose.arm ?? 1.1) - sw * (pose.run ? .8 : .3) * armSw, ca = Math.cos(arm) * ASX, sa = Math.sin(arm), D = 180 / Math.PI;
  let m = new DOMMatrix().translate(PX(1, SWL), SHO + 2).rotate(Math.atan2(sa, ca) * D).scale(Math.hypot(ca, sa), 1);
  if (pose.sweep !== undefined) m = m.scale(Math.sign(pose.sweep || 1) * Math.max(.14, Math.abs(pose.sweep)), 1);
  if (pose.elbow) { const eb = -pose.elbow; m = m.translate(10 * AS + Math.cos(eb) * 9 * AS, Math.sin(eb) * 9 * AS).rotate(eb * D).translate(-15, 0); }
  else m = m.translate(19 * AS + (pose.ext || 0) * 12 - 15, 0);
  if (pose.grip) m = m.translate(17, 0).rotate(pose.grip * D).translate(-17, 0);
  const a = m.transformPoint({ x: 9.5, y: 0 }), b = m.transformPoint({ x: 14, y: 0 });
  return { x: a.x, y: a.y, ang: Math.atan2(b.y - a.y, b.x - a.x) };
}
// Figures are built heroic: long legs, a broad V of shoulders over a narrow waist, and a head about a sixth of their height.
// Feet at y=0, hips at -30, shoulders at -49, head at -61. +x is the facing direction.
// The shoulder guard on the shoulder away from us is shown only when he is square to us (or square away): turned
// three-quarters, it would sit on the edge of his chest. It fades out over the turn. a: how square he is to us (|Y|), 1 for the near shoulder
function farPauldron(fn, a) { const k = sstep((a - .89) / .08); if (k <= .01) return; if (k >= .99) { fn(); return; } const ga = ctx.globalAlpha; ctx.globalAlpha = ga * k; fn(); ctx.globalAlpha = ga; }
const WAIST_UP = 7.6; // how far above his hip joint the prince's belt is worn
const LEG_A = 10.4, LEG_B = 12.6; // the prince's thigh and shin (legs' frame): a long shin, the knee high, as in the sheet
function drawHumanoid(look, pose) {
  const walk = pose.walk || 0, sw = Math.sin(walk);
  // the prince can turn: Y is how far he has turned from profile toward the viewer (+1, chest to us) or away (-1, his back)
  const Y = look.corwin ? clamp(pose.Y ?? pose.yaw ?? 0, -1, 1) : 0, CS = Math.sqrt(1 - Y * Y), BACK = Y < -.35;
  const PX = (fx, lz) => fx * CS - lz * Y; // where a point lands as he turns: fx along his facing, lz out to his near side
  // his hips can lead his chest round (YL: the turn of the hips and legs; the hips start each blow, the shoulders follow)
  const YL = look.corwin ? clamp(pose.YL ?? Y, -1, 1) : Y, CSL = Math.sqrt(1 - YL * YL), PXL = (fx, lz) => fx * CSL - lz * YL;
  // lead: the hands swapped for a blow struck chest-to-us (the rapier's thrusts): the weapon arm hangs from the shoulder that
  // has come round to lead (screen-forward), the free arm from the one that went back, so nothing crosses his body; an arm
  // reaching fore or aft then lies across the picture, so it no longer foreshortens
  const SG = pose.lead ? -1 : 1;
  const ASX = pose.lead ? 1 : Math.max(.32, CS); // arms swinging fore and aft foreshorten as he turns
  const CW = look.corwin ? CORWIN : null, arms = CW ? CW.PART('gauntlets', look) : null; // the prince's own costume and cloak (art_corwin.js)
  HAND_PLATE = !!(CW && look.gauntPlate);
  if (CW) { OUTK = .55; INK = '#170D0C'; } // the prince is inked with a fine pen
  // the prince is built as a heroic adult, about seven heads tall at the same overall height: a smaller head on a
  // defined neck, broad shoulders over a long torso, legs half his height (drawn at LS about the feet) and long arms (AS)
  // per-pose proportion touches, eased by blendPose: legX stretches a stride fore and aft (never taller), armS lengthens a reach
  const LS = CW ? 1.3 : 1, AS = CW ? 1.3 * (pose.armS || 1) : 1, SWL = CW ? 9.4 : 9.5, LX = CW ? (pose.legX || 1) : 1; HAND_S = CW ? .66 : 1;
  ctx.save();
  if (pose.oy) ctx.translate(0, pose.oy); // the whole figure dropped (a slide)
  if (pose.rot) { ctx.translate(0, -34); ctx.rotate(pose.rot); ctx.translate(0, 34); }
  if (pose.down) { ctx.translate(-6, -4); ctx.rotate(-1.5); }
  // a walking or running body carries its weight: the hips dip as each foot lands and rise as the legs pass,
  // and each arm swings against its own leg
  const gait = walk && !pose.legs && !pose.kick && pose.kickK === undefined && !pose.down && !pose.crouch;
  const bob = gait ? (pose.run ? (1 - Math.abs(sw)) * 3 : Math.abs(sw) * 1.6) : 0, armSw = gait ? (pose.armSwing ?? (pose.weapon === 'fists' || !pose.weapon ? 1 : .4)) : 0; // (armSwing: a carry that swings more freely, like the bo's)
  const br = pose.breath ? (pose.breath + 1) * .45 : 0; // breathing settles the body over planted feet
  // the prince fights from wide, low lunges, as in the sheet's attack strips: a planted stance (legs, sink) is set wider and lower
  const LUNGE = CW && pose.legs && !pose.stance && pose.kickK === undefined ? clamp((pose.sink || 0) / 7, 0, 1) : 0;
  const cr = (pose.crouchK ?? (pose.crouch ? 8 : (pose.sink || 0) * (1 + .25 * LUNGE))) + bob + br, HIPL = -30 + cr; // sink: how far the hips drop into a stance
  const HIP = HIPL * LS, SHO = CW ? HIP - 22 : -49 + cr, NECK = CW ? SHO - 2.6 : -53 + cr; // (HIPL: the hips in the legs' own, unscaled frame)
  const skin = look.skin || '#C9A07E', sleeve = look.sleeve || look.body;
  // the whole upper body bends at the waist; as it tips forward the hips slide back to keep his weight over his feet,
  // and as it arches back they push forward
  const LEAN = ((pose.lean || 0) * (1 - .35 * LUNGE) + (gait ? Math.sin(walk * 2) * .025 : 0)) * (.25 + .75 * CS), HX = (clamp(-LEAN * 6, -5, 5) + (pose.shift || 0)) * CS; // seen from the front, a bend is mostly toward or away from us
  // (shift: his weight carried forward over the front foot as a blow lands, back over the rear one as he loads)
  const upper = () => { ctx.translate(HX, HIP); ctx.rotate(LEAN); ctx.translate(0, -HIP); }, HXL = HX / LS;
  // his cloak: where it hangs this frame, then drawn in layers: the far half behind everything, the near half behind
  // his legs and in front of his far arm, and the whole of it over him when his back is to us
  const G = CW ? { Y, CS, PX, HIP, SHO, NECK, HX, LEAN, cr, walk, sw, gait, pose, BACK, SWL, t: performance.now() / 1000 } : null;
  const CP = CW && !pose.noCloak ? CW.cloak.begin(look, G) : null;
  if (CP && !BACK) { CW.cloak.half(look, CP, true); ctx.save(); upper(); CW.cloak.hood(look, G, false); ctx.restore(); }
  ctx.save(); upper();
  // cape flows behind
  if (look.cape) {
    const flow = (pose.flow || 0) + Math.abs(sw) * 4;
    ctx.beginPath(); ctx.moveTo(-4, SHO); ctx.quadraticCurveTo(-20 - flow, SHO + 18, -18 - flow * 1.4, -8 + Math.sin(walk * .5) * 3);
    ctx.lineTo(-4, HIP + 14); ctx.closePath(); ctx.fillStyle = C(look.cape); ctx.fill(); outline(1.8);
  }
  const hs = look.corwin ? .53 : .9, headScale = () => { ctx.translate(1, NECK); ctx.scale(hs, hs); ctx.translate(-1, -NECK); };
  if (look.longHair) {
    ctx.save(); headScale();
    const flow = (pose.flow || 0) * .8 + Math.abs(sw) * 2;
    ctx.beginPath(); ctx.moveTo(-4, SHO - 18); ctx.quadraticCurveTo(-14 - flow, SHO - 10, -12 - flow * 1.3, SHO + 8 + Math.sin(walk * .7) * 2);
    ctx.lineTo(-6, SHO + 2); ctx.quadraticCurveTo(-6, SHO - 8, 0, SHO - 14); ctx.closePath(); ctx.fillStyle = C(look.hair); ctx.fill(); outline(1.4);
    ctx.restore();
  }
  ctx.restore();
  // long coat tails swing from the waist; turned, they hang behind him, and over his legs when his back is to us
  const drawCoat = () => { if (!look.coat) return;
    ctx.save(); if (Y) { const k = Math.max(.55, CS); ctx.translate(5 * (1 - k), 0); ctx.scale(k, 1); }
    const flow = (pose.flow || 0) + Math.abs(sw) * 5;
    for (const [dx, k] of [[-2, 1], [3, .7]]) {
      ctx.beginPath(); ctx.moveTo(dx - 7, HIP - 2); ctx.quadraticCurveTo(dx - 13 - flow * k, HIP + 12, dx - 15 - flow * 1.5 * k, -5 + Math.sin(walk + dx) * 2);
      ctx.lineTo(dx - 11 - flow * k, -9); ctx.lineTo(dx - 9 - flow * k * .8, -3); ctx.lineTo(dx - 4, -11 + cr * .5); ctx.lineTo(dx + 2, HIP); ctx.closePath();
      ctx.fillStyle = C(k === 1 ? look.coat : look.coat2 || look.coat); ctx.fill(); outline(1.4);
      if (!FLASH && !TINT) { ctx.strokeStyle = shade(k === 1 ? look.coat : look.coat2 || look.coat, -.35); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(dx - 6, HIP + 2); ctx.quadraticCurveTo(dx - 10 - flow * k * .6, HIP + 14, dx - 10 - flow * k, -8); ctx.stroke(); } // a fold
    }
    ctx.restore();
  };
  if (!BACK) drawCoat();
  // back arm, a shade darker for being further away
  ctx.save(); upper();
  const ba = (pose.backArm ?? 1.25) + sw * (pose.run ? .42 : .3) * (gait && !pose.backHold ? 1 : 0), bsx = PX(-3, -SG * SWL), bsy = SHO + 1.5;
  const bb = pose.backElbow !== undefined ? -pose.backElbow : .25; // how far the forearm folds up from the upper arm
  const bl = 1 + (pose.backReach || 0); // a thrown rear hand reaches further, the shoulder driven through
  let bex = bsx + Math.cos(ba) * 10 * AS * bl * ASX, bey = bsy + Math.sin(ba) * 10 * AS * bl, bwx = bex + Math.cos(ba + bb) * 9 * AS * bl * ASX, bwy = bey + Math.sin(ba + bb) * 9 * AS * bl;
  let bha = Math.atan2(Math.sin(ba + bb), Math.cos(ba + bb) * ASX) + (pose.backWrist || 0); // the far hand's angle (backWrist: the wrist curled over)
  if (pose.twoHand) { // both hands on the grip: the far hand is solved onto the hilt, just below the weapon hand, every frame
    const g = twoHandGrip(pose, PX, SHO, sw, armSw, ASX, AS, SWL), gap = pose.gripGap || 4.5 * HAND_S, wx = g.x - Math.cos(g.ang) * gap, wy = g.y - Math.sin(g.ang) * gap; // (a staff is held with the hands apart)
    const dx = wx - bsx, dy = wy - bsy, d = Math.hypot(dx, dy) || 1e-3, k = Math.max(1, d / (18.6 * AS)), L1 = 10 * AS * k, L2 = 9 * AS * k; // a long reach stretches the shoulder through
    const A = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)), b0 = Math.atan2(dy, dx);
    const e1 = [bsx + Math.cos(b0 + A) * L1, bsy + Math.sin(b0 + A) * L1], e2 = [bsx + Math.cos(b0 - A) * L1, bsy + Math.sin(b0 - A) * L1];
    [bex, bey] = e1[1] > e2[1] ? e1 : e2; bwx = wx; bwy = wy; bha = g.ang; // the elbow bends down, under the blade
  }
  const across = pose.twoHand && !BACK; // a two-handed grip: the far arm reaches across his chest, drawn over it
  const farArm = () => {
  if (arms) CW.arm(look, bsx, bsy, bex, bey, bwx, bwy, true); // one skinned arm, shoulder to wrist
  else { seg(bsx, bsy, bex, bey, 8, 6.4, shade(sleeve, -.18), 1.3); seg(bex, bey, bwx, bwy, 6.4, 4.8, shade(sleeve, -.18), .8); }
  if (!across) farHand();
  };
  const farHand = () => { ctx.save(); ctx.translate(bwx, bwy); ctx.rotate(bha); ctx.translate(-13, 0); drawHand(shade(look.glove || skin, -.18), pose.twoHand ? 0 : pose.openHand); ctx.restore(); }; // the far hand
  // on a two-handed grip the far hand closes round the handle too, in two layers either side of it, just behind the weapon hand
  // (on a sword's grip the two fists sit one against the other below the guard; on a haft, where the old hand was)
  const farGrip = (front) => { const kind = pose.weapon || look.weapon, gap = pose.gripGap || 4.5 * HAND_S;
    const cx = (kind === 'sword' || kind === 'grayblade') && !pose.gripGap ? 13 + gripCX(kind) - 7.4 * HAND_S - (9.5 - gap) : 14 + 3.5 * HAND_S;
    ctx.save(); ctx.translate(bwx, bwy); ctx.rotate(bha); ctx.translate(-13, 0); (front ? gripFront : gripBack)(shade(look.glove || skin, -.18), cx, 0); ctx.restore(); };
  const overCloak = pose.backOver && !across && !BACK; // the fencer's free arm is shown over his cloak: raised behind, thrown back, or the hand in the small of his back
  if (!across && !overCloak) farArm();
  const bpA = clamp((ba - 1.25) * .3, -.5, .5); // his far shoulder guard: hidden by his chest in profile, over the cloak when he faces us
  if (arms && Y < .3 && !across) farPauldron(() => arms.pauldron(look, bsx, bsy - 1, bpA, true, .5), Y >= 0 ? Y : 1);
  ctx.restore();
  if (CP && !BACK && !pose.down) CW.cloak.half(look, CP, false);
  if (overCloak) { ctx.save(); upper(); farArm(); ctx.restore(); }
  // legs: thighs and calves with a swell, pants tucked into boots (the prince's drawn at LS about his feet, so they are long)
  const legs = look.legs, LW = 1 / LS;
  ctx.save(); if (LS !== 1 || LX !== 1) ctx.scale(LS * LX, LS);
  { const HIP = HIPL, HX = HXL / LX, Y = YL, CS = CSL, PX = PXL; // (the legs turn with the hips)
  if (pose.kickK !== undefined) drawKickLegs(look, pose, HIP, HX, Y, CS, LS);
  else if (pose.kick) {
    const kb = pose.kickBend || 0, kx = 17 - kb, ky = HIP - 2 - 5 * kb, fx = 30 - 3 * kb, fy = HIP - 4 + 2 * kb; // kickBend: the knee gives a little
    if (CW) { const r = -Math.PI / 2 + .2 * kb; CW.leg(look, -2, HIP, -5, HIP + 15, -4, -8, -4, 0, 0, LW, true, LW); CW.seat(look, -2, 2, HIP, LW, 4); CW.leg(look, 2, HIP, kx, ky, fx, fy, fx - Math.cos(r) - 9 * Math.sin(r), fy - Math.sin(r) + 9 * Math.cos(r), r, LW, false, LW); }
    else {
    seg(-2, HIP, -5, HIP + 15, 8, 6, shade(legs, -.15), .6); seg(-5, HIP + 15, -4, -8, 6, 4.6, shade(legs, -.15), .8); boot(-4, shade(look.boots, -.1));
    seg(2, HIP, kx, ky, 8.4, 6.4, legs, .8); seg(kx, ky, fx, fy, 6.4, 4.8, legs, .6);
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(-Math.PI / 2 + .2 * kb); ctx.translate(-1, 9); boot(0, look.boots); ctx.restore();
    }
  } else if (pose.down) {
    if (CW) { CW.leg(look, -2, HIP, -3, -19, -5, -7.4, -5.4, 1, 0, LW, true, LW); CW.seat(look, -2, 2, HIP, LW); CW.leg(look, 2, HIP, 5, -19, 7, -7.4, 6.6, 1, 0, LW, false, LW); } // laid out flat, legs long
    else { seg(-2, HIP, -4, -13, 8, 6, legs, .6); seg(-4, -13, -6, -6, 6, 4.6, legs, .6); seg(2, HIP, 6, -13, 8, 6, legs, .6); seg(6, -13, 8, -6, 6, 4.6, legs, .6); }
  } else {
    const run = pose.run ? 1.95 : 1.15, st = pose.stance && !walk; // a fighting stance at rest: feet apart, knees loose
    let f1 = st ? -7 : sw * 10 * run, f2 = st ? 7 : -sw * 10 * run;
    const WALK = CW && gait && !pose.run; // his ordinary walk keeps its own stride: knees placed by the gait, not the straight-leg solver
    let k1 = gait ? 1.5 : cr ? 9 : st ? 2 : Math.max(0, sw) * 6, k2 = gait ? 1.5 : cr ? 9 : st ? 3 : Math.max(0, -sw) * 6; // in a stride the knees stay long; the bend comes from the lifting leg
    if (pose.legs) { // an attack stance: where each foot plants and how far each knee bends
      const L = pose.legs, WX = 1 + .4 * LUNGE; f1 = L.b * WX; f2 = L.f * WX; k1 = L.bk; k2 = L.fk;
    }
    const ky = -15 + cr * .45;
    // in a stride the foot swinging forward peels off the ground, heel first, the knee leading it through
    const lh = gait ? (pose.run ? 11 : 3.5) : 0, l1 = Math.max(0, Math.cos(walk)) * lh, l2 = Math.max(0, -Math.cos(walk)) * lh;
    const bsc = .5 + .5 * CS; // a boot seen from the front is narrower
    const W = (pose.legs && pose.legs.w) || 1; // how far apart the feet are set, side to side (seen when he is turned)
    const PL = pose.legs || {}, heel = clamp(PL.bh || 0, 0, 1); // a planted stance can lift a foot (fl, bl) and raise the rear heel (bh)
    const leg = (x, lz, f, k, col, bc, lift, kl = 0) => {
      const hx0 = PX(x, lz * .8) + HX; let kx = PX(x + f * .5 + k + lift * .5 + kl * .4, lz * (.9 + (W - 1) * .8)) + HX * .5, kyy = ky - lift * (pose.run ? .55 : .35) - kl * .6 - (x < 0 && pose.legs ? pose.legs.bku || 0 : 0); const fx = PX(x + f - lift * .4, lz * W);
      lift += kl;
      if (WALK) {
        const ax = fx - .6 * CS, ay = -8 - lift, rot = lift ? lift * .03 : 0;
        CW.leg(look, hx0, HIP, kx, kyy, ax, ay, fx, -lift, rot, bsc * LW, col !== legs, LW); return; }
      if (CW) { // worked out in his own facing plane (F forward, y up), then turned to the screen: a two-bone leg of
        // fixed thigh and shin, so it stands straight when the hips are high and bends only as they sink or a foot lifts
        const lzH = lz * .8, lzK = lz * (.9 + (W - 1) * .8), lzF = lz * W;
        const footF = x + f - (lift - kl) * .4; let aF = footF - .6, aY = -7.2 - lift, oF = footF, oy = -lift, rot = lift ? lift * .03 : 0;
        if (x < 0 && heel > .01) { // the rear heel comes up: the foot rolls over its toe, the ankle and knee rising with it
          const a = heel * .62, tF = footF + 5.6 * LW, ca = Math.cos(a), sa = Math.sin(a), dx = aF - tF;
          aF = tF + dx * ca + 8 * sa; aY = -lift + dx * sa - 8 * ca; oF = tF + (footF - tF) * ca; oy = -lift + (footF - tF) * sa; rot += a;
        }
        let ux = aF - x, uy = aY - HIP; const d = Math.hypot(ux, uy) || 1e-3; ux /= d; uy /= d;
        const TH = LEG_A, SH = LEG_B, al = d >= TH + SH ? d * TH / (TH + SH) : (TH * TH - SH * SH + d * d) / (2 * d), hk = d >= TH + SH ? 0 : Math.sqrt(Math.max(0, TH * TH - al * al));
        const bend = hk + k * .35 * (1 - .75 * LUNGE) + kl * .25; // (and a little give of its own: a loose knee, or one driven up)
        const kF = x + ux * al + uy * bend, kY = HIP + uy * al - ux * bend - (x < 0 && pose.legs ? pose.legs.bku || 0 : 0) - heel * 1.2;
        CW.leg(look, PX(x, lzH) + HX, HIP, PX(kF, lzK) + HX * .5, kY, PX(aF, lzF), aY, PX(oF, lzF), oy, rot, bsc * LW, col !== legs, LW); return; }
      seg(hx0, HIP, kx, kyy, 8.4, 6.2, col, .9); seg(kx, kyy, fx - .6 * CS, -8 - lift, 6.2, 4.6, col, 1);
      ctx.save(); ctx.translate(fx, -lift); if (lift) ctx.rotate(lift * .03); ctx.scale(bsc, 1); boot(0, bc); ctx.restore();
    };
    // nearer leg drawn last: in profile that is the near side, turned it is whichever foot is closer to us
    const dFar = (-3 + f1) * Y - 5.5 * CS, dNear = (3 + f2) * Y + 5.5 * CS, nearFirst = dNear < dFar;
    const L1 = () => leg(-3, -5.5, f1, k1, nearFirst ? legs : shade(legs, -.15), nearFirst ? look.boots : shade(look.boots, -.12), l1, PL.bl || 0);
    const L2 = () => leg(3, 5.5, f2, k2, nearFirst ? shade(legs, -.15) : legs, nearFirst ? shade(look.boots, -.12) : look.boots, l2, PL.fl || 0);
    const seat = () => { if (CW) CW.seat(look, PX(-3, -4.4) + HX, PX(3, 4.4) + HX, HIP, LW, cr); }; // the tops of the thighs joined in one seat
    if (nearFirst) { L2(); seat(); L1(); } else { L1(); seat(); L2(); }
  }
  }
  ctx.restore();
  if (BACK) drawCoat();
  // a blow in progress is never hidden by the cloak: with his back to us the weapon arm is then drawn over it
  const atkVis = !!(pose.trail || pose.flat || pose.sweep !== undefined || (pose.ext || 0) > 0 || pose.twoHand || pose.glow);
  if (BACK && !atkVis) { ctx.save(); upper(); frontArm(); ctx.restore(); } // his back is to us: the weapon arm is on the far side of him
  // torso (leans around the hips): a broad V of shoulders over a narrow waist
  ctx.save(); upper();
  if (look.robot) {
    rrect(-12, SHO - 2, 24, 30, 6); ctx.fillStyle = C(look.body); ctx.fill(); outline();
    if (!FLASH && !TINT) { ctx.fillStyle = shade(look.body, -.25); ctx.fillRect(-11, SHO - 1, 6, 27); ctx.fillStyle = shade(look.body, .3); ctx.fillRect(7, SHO, 1.4, 24); } // plated sides
    ctx.fillStyle = C(look.trim); ctx.fillRect(-12, HIP - 3, 24, 4.5);
    ctx.save(); ctx.globalCompositeOperation = FLASH ? 'source-over' : 'lighter'; ctx.fillStyle = C(look.core); circle(0, SHO + 10, 4.8); ctx.fill(); ctx.restore();
  } else if (CW) { // the prince: his scabbard, the doublet, the belts and the tabs at his hips
    const waist = CW.PART('waist', look), pel = () => CW.kit.pelvis(HIP);
    // the pelvis stays nearer the legs than the chest does, so he bends at the waist; and as a blow starts the pelvis
    // turns into it a beat ahead of the chest (leanLead), the torso coiling and uncoiling about the waist
    CW.kit.setBend(clamp(-LEAN * .6 + (pose.leanLead || 0) * .5, -.7, .7));
    // the belts and the scabbard turn with the hips, and are worn at the waist, well above the hip joint (the doublet's
    // skirt falls from them over the tops of his thighs); HIPJ: the hip joint, for whatever hangs to it
    const GL = Object.assign({}, G, { Y: YL, CS: CSL, PX: PXL, HIP: HIP - WAIST_UP, HIPJ: HIP });
    ctx.save(); pel(); waist.scabbard(look, GL, pose.weapon === 'rapier'); ctx.restore();
    CW.PART('mail', look).torso(look, G);
    ctx.save(); pel(); waist.belts(look, GL); ctx.restore();
    CW.kit.setBend(0);
  } else {
    const ty = SHO - 2;
    const torso = () => {
      ctx.beginPath(); ctx.moveTo(-10.4, ty + 2); ctx.quadraticCurveTo(0, ty - 2.4, 10.4, ty + 2); // shoulder line
      ctx.quadraticCurveTo(11, ty + 9, 7.6, ty + 15); ctx.quadraticCurveTo(6.4, HIP - 4, 7.6, HIP + 1.5); // chest tapering to the waist
      ctx.lineTo(-7.6, HIP + 1.5); ctx.quadraticCurveTo(-6.6, HIP - 4, -7.8, ty + 15); ctx.quadraticCurveTo(-11, ty + 9, -10.4, ty + 2); ctx.closePath();
    };
    const tg = ctx.createLinearGradient(-10, ty, 10, ty + 20); // lit from the upper right
    tg.addColorStop(0, C(shade(look.body, -.32))); tg.addColorStop(.55, C(look.body)); tg.addColorStop(1, C(shade(look.body, .2)));
    torso(); ctx.fillStyle = tg; ctx.fill();
    if (!FLASH && !TINT) {
      ctx.save(); torso(); ctx.clip();
      ctx.fillStyle = shade(look.body, -.3); ctx.beginPath(); ctx.moveTo(-11, ty); ctx.lineTo(-3, ty); ctx.quadraticCurveTo(-5.6, ty + 12, -3.4, HIP + 2); ctx.lineTo(-11, HIP + 2); ctx.closePath(); ctx.fill(); // the side away from the light
      ctx.strokeStyle = shade(look.body, -.45); ctx.lineWidth = .9; ctx.beginPath(); // the chest, and folds pulling toward the waist
      ctx.moveTo(-6, ty + 9); ctx.quadraticCurveTo(0, ty + 11.4, 7, ty + 8.6); ctx.moveTo(-5, ty + 13); ctx.quadraticCurveTo(-2, ty + 17, -3, HIP - 1); ctx.moveTo(5.4, ty + 12); ctx.quadraticCurveTo(3.4, ty + 17, 4.6, HIP - 1); ctx.stroke();
      ctx.strokeStyle = shade(look.body, .35); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(9.4, ty + 3); ctx.quadraticCurveTo(10, ty + 9, 7.2, ty + 14.6); ctx.stroke(); // rim light
      ctx.restore();
    }
    torso(); outline();
    if (BACK) { // from behind: a high collar, the seam down his spine, the coat pulled across his shoulder blades
      ctx.fillStyle = C(shade(look.body, -.35)); ctx.beginPath(); ctx.moveTo(-5, ty - .8); ctx.quadraticCurveTo(0, ty + 2.6, 5, ty - .8); ctx.lineTo(4, ty - 2.4); ctx.lineTo(-4, ty - 2.4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = C(shade(look.body, -.5)); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(0, ty + 2); ctx.lineTo(0, HIP - 2);
      ctx.moveTo(-8, ty + 5); ctx.quadraticCurveTo(-4, ty + 9, -1.4, ty + 6); ctx.moveTo(8, ty + 5); ctx.quadraticCurveTo(4, ty + 9, 1.4, ty + 6); ctx.stroke();
      ctx.fillStyle = C(look.trim); ctx.fillRect(-8, HIP - 2.5, 16, 3.6); // belt
    } else {
    ctx.fillStyle = C(skin); ctx.beginPath(); ctx.moveTo(-3, ty - .6); ctx.lineTo(0, ty + 4); ctx.lineTo(3.4, ty - .6); ctx.closePath(); ctx.fill(); // the open throat
    ctx.fillStyle = C(shade(look.body, .18)); // lapels
    ctx.beginPath(); ctx.moveTo(-6.4, ty + .6); ctx.lineTo(-.4, ty + 9); ctx.lineTo(-3, ty - .4); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(6.8, ty + .6); ctx.lineTo(.6, ty + 9); ctx.lineTo(3.4, ty - .4); ctx.closePath(); ctx.fill();
    if (look.strap) { ctx.strokeStyle = C(look.strap); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-9, ty + 3); ctx.lineTo(7, HIP - 2); ctx.stroke(); }
    if (look.plate) { // breastplate, lit and trimmed
      const pg = ctx.createLinearGradient(-9, ty, 9, ty + 20); pg.addColorStop(0, C(shade(look.plate, -.25))); pg.addColorStop(.55, C(look.plate)); pg.addColorStop(.75, C(shade(look.plate, .45))); pg.addColorStop(1, C(look.plate));
      ctx.beginPath(); ctx.moveTo(-9, ty + 3); ctx.quadraticCurveTo(0, ty - 1, 9, ty + 3); ctx.lineTo(7.6, ty + 18); ctx.quadraticCurveTo(0, ty + 23, -7.4, ty + 18); ctx.closePath(); ctx.fillStyle = pg; ctx.fill(); outline(1.3);
      if (look.plateTrim) { ctx.strokeStyle = C(look.plateTrim); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-7.4, ty + 17); ctx.quadraticCurveTo(0, ty + 22, 7.4, ty + 17); ctx.moveTo(0, ty + 1); ctx.lineTo(0, ty + 20); ctx.stroke(); }
      if (look.runes) { ctx.save(); if (!FLASH) { ctx.shadowColor = look.runes; ctx.shadowBlur = 6; } ctx.strokeStyle = C(look.runes); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-4, ty + 6); ctx.lineTo(-2, ty + 10); ctx.lineTo(-4, ty + 13); ctx.moveTo(4, ty + 6); ctx.lineTo(2, ty + 10); ctx.lineTo(4, ty + 13); ctx.stroke(); ctx.restore(); }
    }
    ctx.fillStyle = C(look.trim); ctx.fillRect(-8, HIP - 2.5, 16, 3.6); // belt
    ctx.fillStyle = C('#C9A86A'); ctx.fillRect(1.4, HIP - 3, 3.6, 4.6); ctx.fillStyle = C(shade(look.trim, -.5)); ctx.fillRect(2.4, HIP - 2, 1.6, 2.6); // buckle
    if (look.rose) { // his silver rose, pinned at the breast
      silverRose(-4.6, SHO + 5.6, 1.15, true);
    }
    if (look.chain) { ctx.strokeStyle = C(look.trim); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-8, HIP + 1); ctx.quadraticCurveTo(-2, HIP + 6, 6, HIP + 2); ctx.stroke(); }
    }
  }
  ctx.restore();
  if (CP && pose.down) CW.cloak.half(look, CP, false); // knocked down, the cloak lies over him
  if (CW) { // the cloak over his back when he faces away; otherwise the cloak over his shoulders, his far shoulder guard, collar and the rose
    if (BACK && CP) { CW.cloak.half(look, CP, true); CW.cloak.half(look, CP, false); }
    ctx.save(); upper();
    if (BACK) { CW.PART('mail', look).neck(look, G); if (CP) CW.cloak.hood(look, G, true); }
    else { if (CP) CW.cloak.mantle(look, G); if (arms && Y >= .3 && !across) farPauldron(() => arms.pauldron(look, bsx, bsy - 1, bpA, true, .5), Y); CW.PART('mail', look).neck(look, G); }
    ctx.restore();
  }
  ctx.save(); upper();
  // head
  const hy = CW ? NECK - 14 : -61 + cr; // (in the head's own frame, which headScale shrinks about the neck)
  ctx.save(); ctx.translate(1, NECK); ctx.rotate(-LEAN * (CW ? .55 : .3)); ctx.translate(-1, -NECK); // the head stays level on the eyes, as a fighter's does
  if (look.robot) {
    rrect(-8, hy - 8, 17, 15, 4); ctx.fillStyle = C(look.helm); ctx.fill(); outline();
    ctx.fillStyle = C(look.visor); ctx.fillRect(1, hy - 3, 8, 3.5);
    if (look.plume) { ctx.fillStyle = C(look.plume); ctx.beginPath(); ctx.moveTo(-6, hy - 8); ctx.quadraticCurveTo(-14, hy - 18, -20, hy - 8); ctx.quadraticCurveTo(-12, hy - 10, -6, hy - 4); ctx.fill(); }
  } else if (look.corwin) {
    // the hair's tips give a little to his motion (blown back by speed, a bob with each stride); only the tips move
    HAIR_SWAY = [clamp(-(pose.flow || 0) * .1 - (gait ? (pose.run ? 1.4 : .4) : 0) + Math.sin(walk * 2) * (gait ? .35 : 0) + Math.sin(performance.now() / 900) * .15, -2.6, 1.2),
      clamp((gait ? Math.cos(walk * 2) * (pose.run ? .5 : .2) : 0) - (pose.crouch && !gait ? .4 : 0), -1, 1)];
    const HY = pose.HY ?? Y; // his head can stay turned toward what is in front of him while his chest is turned to us
    ctx.save(); headScale(); HEAD_MASK = { m: ctx.getTransform(), hy }; if (!(pose.headTurn ?? Math.abs(HY) >= .3)) drawCorwinHead(look, hy); else drawCorwinHeadTurn(look, hy, HY); ctx.restore();
  } else {
    ctx.save(); headScale();
    ctx.fillStyle = C(shade(skin, -.22)); ctx.fillRect(-1.5, hy + 5, 5, 6); // neck
    const sg = ctx.createRadialGradient(4, hy - 3, 1, 1, hy, 10); sg.addColorStop(0, C(shade(skin, .12))); sg.addColorStop(1, C(shade(skin, -.18)));
    ctx.beginPath(); ctx.moveTo(-5.6, hy - 7); ctx.quadraticCurveTo(1, hy - 10.4, 6, hy - 8.4); ctx.quadraticCurveTo(9.2, hy - 6, 9, hy - 1); ctx.lineTo(10, hy + 2.4); ctx.lineTo(9, hy + 3); ctx.quadraticCurveTo(9.4, hy + 7.6, 6.4, hy + 8.8); ctx.quadraticCurveTo(2, hy + 9, -2.4, hy + 5); ctx.quadraticCurveTo(-7.6, hy, -5.6, hy - 7); ctx.closePath(); // a squarer, adult head
    ctx.fillStyle = sg; ctx.fill(); outline();
    ell(-2.6, hy + 1, 1.7, 2.4); ctx.fillStyle = C(shade(skin, -.2)); ctx.fill(); // ear
    if (!look.mask) { ctx.strokeStyle = C(shade(skin, -.45)); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(6.6, hy + 4.8); ctx.lineTo(8.6, hy + 4.6); ctx.stroke(); } // mouth
    ctx.fillStyle = C('#F2ECE6'); ctx.fillRect(4.6, hy - 1.4, 3, 1.6); // the eye
    if (look.eye) { ctx.save(); if (!FLASH) { ctx.shadowColor = look.eye; ctx.shadowBlur = 6; } ctx.fillStyle = C(look.eye); ctx.fillRect(6, hy - 1.4, 1.4, 1.6); ctx.restore(); }
    else { ctx.fillStyle = C(look.iris || '#3A2E2A'); ctx.fillRect(6, hy - 1.4, 1.4, 1.6); }
    ctx.fillStyle = C('#1A1214'); ctx.fillRect(4.4, hy - 1.9, 3.4, .7); // upper lid
    ctx.fillStyle = C(look.hair || look.hood || OUT); ctx.beginPath(); ctx.moveTo(3.6, hy - 3.8); ctx.lineTo(8.4, hy - 3.4); ctx.lineTo(8.2, hy - 2.5); ctx.lineTo(3.8, hy - 2.8); ctx.closePath(); ctx.fill(); // brow
    if (look.hood) { // a deep hood hides the face in shadow
      ctx.fillStyle = C(look.hood); ctx.beginPath(); ctx.moveTo(-10, hy + 7); ctx.quadraticCurveTo(-12, hy - 12, 2, hy - 12); ctx.quadraticCurveTo(12, hy - 10, 10, hy + 2); ctx.lineTo(4, hy + 1); ctx.quadraticCurveTo(2, hy - 6, -4, hy - 2); ctx.lineTo(-5, hy + 8); ctx.closePath(); ctx.fill(); outline(1.4);
    } else {
      ctx.fillStyle = C(look.hair); ctx.beginPath(); // short hair with a hairline above the brow
      ctx.moveTo(-6.4, hy + 3); ctx.quadraticCurveTo(-8.6, hy - 8, -2, hy - 10.6); ctx.quadraticCurveTo(6, hy - 11.6, 9, hy - 5); ctx.quadraticCurveTo(5, hy - 7, 1, hy - 6.4); ctx.quadraticCurveTo(-2, hy - 5, -3, hy + 1.6); ctx.closePath(); ctx.fill(); outline(1);
      ctx.strokeStyle = C(shade(look.hair, .35)); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-5, hy - 6); ctx.quadraticCurveTo(-1, hy - 10, 5, hy - 9.4); ctx.stroke(); // light in the hair
    }
    if (look.crown) { ctx.fillStyle = C(look.crown); ctx.beginPath(); ctx.moveTo(-6, hy - 8); ctx.lineTo(-4, hy - 13); ctx.lineTo(-1, hy - 9); ctx.lineTo(2, hy - 14); ctx.lineTo(4, hy - 9); ctx.lineTo(6, hy - 12); ctx.lineTo(7, hy - 7); ctx.closePath(); ctx.fill(); }
    if (look.mask) { ctx.fillStyle = C(look.mask); ctx.beginPath(); ctx.moveTo(-1, hy + 1.5); ctx.lineTo(10, hy + 1); ctx.lineTo(9, hy + 7); ctx.lineTo(0, hy + 8); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  ctx.restore();
  if (ARMOR_MID && !CW) ARMOR_MID({ HIP, SHO, NECK, hy, cr, LEAN, head: () => { ctx.translate(1, NECK); ctx.rotate(-LEAN * .3); ctx.scale(.9, .9); ctx.translate(-1, -NECK); } }); // breakable armor worn on the body (armor_a.js)
  if (BACK && atkVis) frontArm(); // (still in the upper body's frame)
  if (across) { farArm(); farGrip(false); if (arms) farPauldron(() => arms.pauldron(look, bsx, bsy - 1, bpA, true, .5), Y >= 0 ? Y : 1); } // (still in the upper body's frame here)
  if (!BACK) frontArm();
  if (across) farGrip(true); // its hand closed on the hilt over the grip, beside the weapon hand
  // front arm + weapon: shoulder, a bent elbow, forearm, hand
  function frontArm() {
  const arm = (pose.arm ?? 1.1) - sw * (pose.run ? .8 : .3) * armSw;
  const ARX = 19 * (AS - 1); // longer arms carry the weapon further out: its trails follow
  if (pose.trail) drawTrail(0, SHO + 2, ARX ? Object.assign({}, pose, { trail: pose.trail + ARX }) : pose);
  if (pose.flat) drawFlatTrail(1, SHO + 2, ARX ? Object.assign({}, pose.flat, { r: pose.flat.r + ARX }) : pose.flat);
  ctx.save(); ctx.translate(PX(1, SG * SWL), SHO + 2);
  { const ca = Math.cos(arm) * ASX, sa = Math.sin(arm); ctx.rotate(Math.atan2(sa, ca)); ctx.scale(Math.hypot(ca, sa), 1); } // turned, the arm only shortens along its length: it never gets thinner
  if (pose.sweep !== undefined) ctx.scale(Math.sign(pose.sweep || 1) * Math.max(.14, Math.abs(pose.sweep)), 1); // a horizontal swing: the weapon comes around the body
  const reach = 19 * AS + (pose.ext || 0) * 12; // a thrust drives the arm out
  const ex = reach * .53, ey = 1.6 - (pose.ext || 0) * 1.2;
  if (pose.elbow) { // a bent elbow: the upper arm hangs, the forearm comes forward from it
    const eb = -pose.elbow, hx = 10 * AS + Math.cos(eb) * 9 * AS, hy = Math.sin(eb) * 9 * AS;
    if (arms) CW.arm(look, 0, 0, 10 * AS, 0, hx, hy, BACK);
    else { seg(0, 0, 10, 0, 8.6, 6.6, sleeve, 1.4); seg(10, 0, hx, hy, 6.6, 5, sleeve, .9); }
    ctx.translate(hx, hy); ctx.rotate(eb); ctx.translate(-15, 0);
  } else if (arms) CW.arm(look, 0, 0, ex, ey, reach, 0, BACK);
  else { seg(0, 0, ex, ey, 8.6, 6.6, sleeve, 1.4); seg(ex, ey, reach, 0, 6.6, 5, sleeve, .9); }
  pose.glove = look.glove;
  if (pose.streak) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = pose.streak.a; ctx.strokeStyle = pose.streak.col; ctx.lineWidth = 2; for (const dy of [-4, 0, 4]) { ctx.beginPath(); ctx.moveTo(reach + 6, dy); ctx.lineTo(reach + pose.streak.len, dy * .4); ctx.stroke(); } ctx.restore(); }
  if (!pose.elbow) ctx.translate(reach - 15, 0);
  if (pose.grip) { ctx.translate(17, 0); ctx.rotate(pose.grip); ctx.translate(-17, 0); } // the wrist turns the weapon to rest it
  { const kind = pose.weapon || look.weapon, held = ['hammer', 'staff', 'sword', 'grayblade', 'rapier', 'shortbow'].includes(kind) && !pose.noHand; // (the weapons whose last stroke is the hand)
    if (held) { GRIP.cx = gripCX(kind); GRIP.rot = kind === 'shortbow' ? Math.PI / 2 : 0; gripBack(look.glove || '#FFF1E0'); GRIP.back = true; } // the palm, under the handle
    if (pose.slide) { ctx.translate(pose.slide, 0); GRIP.cx -= pose.slide; } // (the weapon slid through his hands, as in a pole vault's grip near the end)
    drawWeapon(kind, pose); // (its last stroke closes the fingers over the handle: gripHand)
    GRIP.back = false; GRIP.cx = 17.1; GRIP.rot = 0; }
  ctx.restore();
  if (arms) farPauldron(() => arms.pauldron(look, PX(1, SG * SWL), SHO + .4, clamp((arm - 1.1) * .3, -.45, .45), BACK, .54), Y >= 0 ? 1 : -Y); // (his back to us, this is the far shoulder)
  else if (look.pauldron) { ctx.save(); ctx.translate(PX(1, 9.5) - 1, 0);
    ctx.beginPath(); ctx.ellipse(1, SHO + 1, 8.6, 6.4, -.3, Math.PI * .9, Math.PI * 2.1); ctx.closePath(); ctx.fillStyle = C(look.pauldron); ctx.fill();
    if (!FLASH && !TINT) { ctx.fillStyle = shade(look.pauldron, .35); ell(4, SHO - 2.4, 3, 1.2, -.3); ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(1, SHO + 1, 8.6, 6.4, -.3, Math.PI * .9, Math.PI * 2.1); ctx.closePath(); outline(1.4); ctx.fillStyle = C(look.trim); ctx.fillRect(-4, SHO - 1, 9, 1.5);
  ctx.restore(); }
  }
  ctx.restore();
  ctx.restore();
  HAND_S = 1; HAND_PLATE = false; OUTK = 1; INK = OUT;
}
// swing trails are dry-brush strokes of light: many thin bristle lines instead of one solid band.
// They are painted straight onto the page so the ink pass does not outline them.
function brushArc(path, col, w, a) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = col; ctx.lineCap = 'round';
  const n = 7;
  for (let i = 0; i < n; i++) {
    const h = Math.abs(Math.sin(i * 12.9898 + 4.1)) * 1000 % 1, k = i / (n - 1);
    ctx.globalAlpha = a * (.35 + h * .65) * (1 - k * .5); ctx.lineWidth = .8 + h * w * .35;
    path((k - .3) * w * 1.6, h); ctx.stroke();
  }
  ctx.restore();
}
function onPage(f) { if (inkG && (ctx === inkG || ctx === heroG)) onMain(f); else f(); }
function drawFlatTrail(cx, cy, f) { // the trail of a horizontal swing: a flattened arc around the waist
  onPage(() => brushArc((o, h) => { const r = f.r + o; ctx.beginPath(); ctx.ellipse(cx, cy + 6, Math.max(1, r), Math.max(1, r * .3), 0, f.rev ? Math.PI * (1 - f.k * (.85 + h * .15)) : 0, f.rev ? Math.PI : Math.PI * f.k * (.85 + h * .15), false); }, f.col, f.w, .8));
}
function drawTrail(cx, cy, pose) {
  const a0 = pose.trailFrom, a1 = pose.arm, r = pose.trail;
  if (Math.abs(a1 - a0) < .05) return;
  const lo = Math.min(a0, a1), hi = Math.max(a0, a1), lead = a1 > a0;
  onPage(() => brushArc((o, h) => { ctx.beginPath(); const cut = (hi - lo) * h * .25; ctx.arc(cx, cy, Math.max(1, r + o - 4), lead ? lo + cut : lo, lead ? hi : hi - cut); }, pose.trailCol, (pose.trailW || 6) * 1.6, .85));
}
// the Prince of Shadow, after Corwin, as in the reference sheet: shaggy dark-brown hair, green eyes, a black quilted doublet
// over a white shirt, steel at the shoulders, forearms and knees, brown leather belts and boots, brass fittings,
// and a great black cloak brushed with slate and grey. Every color is a flat string, so a greyed copy greys all of it.
// mail / pants / gauntlets / waist name the piece drawn for each slot (art_corwin.js), so gear can swap them later.
const HERO = { corwin: 1, mail: 'doublet', pants: 'trousers', gauntlets: 'vambrace', waist: 'swordbelt',
  skin: '#D8AC88', glove: '#C89A76', hair: '#33231A', hairLt: '#7E5A3A', hairDk: '#140D09', eye: '#3FA08A',
  body: '#1E1C24', lattice: '#43404F', button: '#BDB6A6', trim: '#BC9440', shirt: '#E9E3D5', sleeve: '#E9E3D5',
  steel: '#A4A4A8', pauldron: '#A4A4A8', leather: '#6A4228', brass: '#CBA251', scab: '#5A3822',
  legs: '#2B2832', boots: '#3E2C22', cuff: '#5C4231',
  cloak: '#09080B', cloakSlate: '#111015', cloakGrey: '#0E0D12', cloakLt: '#141318' }; // all off-blacks: the cloak is black through and through, its brushwork only a shade apart
// his look comes from the armor he wears (gear.js): each slot he fills swaps that part of his costume for the set's
// own piece; an empty slot keeps his traveller's costume above
function heroLook() {
  if (!heroLookCache) heroLookCache = buildHeroLook(save.gear.eq);
  return Object.assign({}, heroLookCache);
}
// human enemies, a third of every world
const HUMANS = {
  bandit:   { skin: '#C9A07E', hood: '#5A6A3E', body: '#6E5A3E', sleeve: '#5A4A34', trim: '#A88A5A', legs: '#3E3428', boots: '#2E2418', mask: '#3A3428', weapon: 'dagger' },
  archer:   { skin: '#D2AE8C', hood: '#3E5A4A', body: '#4E6A52', sleeve: '#3E5642', trim: '#C9B07A', legs: '#2E3A30', boots: '#2A2418', weapon: 'bow' },
  corsair:  { skin: '#C0906E', hair: '#2A1E1A', body: '#8A3A3A', sleeve: '#6E2E2E', trim: '#D8AA55', legs: '#2E2A38', boots: '#3A2418', mask: '#2A2030', weapon: 'blade' },
  gunner:   { skin: '#D8B898', hair: '#5A3A2A', body: '#3E5A70', sleeve: '#344C5E', trim: '#C9A060', legs: '#2A2E3A', boots: '#2E2418', weapon: 'rifle', pauldron: '#8A6A3A' },
  cultist:  { skin: '#B8A0C0', hood: '#4A2A5A', body: '#3A2048', sleeve: '#30183C', trim: '#C878A8', legs: '#24142E', boots: '#1A0E20', eye: '#E8A0D8', weapon: 'prism' },
  witch:    { skin: '#D8C0D0', hood: '#2E3A6A', body: '#283460', sleeve: '#222C52', trim: '#8CC8D0', legs: '#1A2040', boots: '#141830', eye: '#9FE8F0', weapon: 'orb' },
};
const KNIGHT = { robot: 1, body: '#B88A48', sleeve: '#9A7038', trim: '#4E9A90', legs: '#6A4A28', boots: '#43301C', helm: '#C99B55', visor: '#9FF0E8', core: '#9FF0E8', plume: '#4E9A90', weapon: 'blade' };
const KNIGHT_MOSS = { robot: 1, body: '#7E8A6A', sleeve: '#6A7458', trim: '#5E8A52', legs: '#4A503E', boots: '#33382A', helm: '#8A9474', visor: '#EED48A', core: '#EED48A', plume: '#5E8A52', weapon: 'blade' };
const COLOSSUS = { robot: 1, body: '#A87A3A', sleeve: '#8A6030', trim: '#3E8A84', legs: '#5A3E22', boots: '#3A2816', helm: '#C2934E', visor: '#E86A80', core: '#F08A9A', plume: '#B8445A', weapon: 'cannon', cape: '#2E5E62' };

// ---------- worlds (painted in layers: far ridges fade into the sky, near things are rich and dark) ----------
const THEMES = {
  bloom: { name: 'golden hour', sky: ['#2F3D6B', '#7D6FA0', '#E2A487', '#F6D9A8'], sun: [0.78, 0.36, '255,214,150'], haze: '232,190,160',
    floorA: '#6E7E4A', floorB: '#3E5134', path: '#B89A72', grade: { desat: .22, top: 'rgba(70,90,170,.45)', bot: 'rgba(240,160,90,.45)', vig: 'rgba(40,20,50,.55)' } },
  sky:   { sky: ['#283560', '#5A6A9E', '#D69479', '#F2C99C'], sun: [0.2, 0.42, '255,200,160'], haze: '220,180,170',
    floorA: '#A08868', floorB: '#6E5C48', path: '#5E8F88', grade: { desat: .25, top: 'rgba(60,80,160,.45)', bot: 'rgba(230,150,100,.42)', vig: 'rgba(30,20,45,.55)' } },
  prism: { sky: ['#120E2A', '#33225C', '#723873', '#B8607A'], sun: [0.5, 0.25, '200,170,255'], haze: '150,110,190',
    floorA: '#3A2E58', floorB: '#1C1630', path: '#7FC7C9', grade: { desat: .18, top: 'rgba(60,70,190,.5)', bot: 'rgba(200,90,130,.4)', vig: 'rgba(10,6,25,.6)' } },
};
let bgFar = null, bgMid = null, bgKey = '', grain = null;
function makeLayer(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w * K); c.height = Math.ceil(h * K); const g = c.getContext('2d'); g.scale(K, K); return [c, g]; }
let DAB_X = 0; // world offset while painting scrolling layers, so a dab keeps its shape as it scrolls past
function dab(x, y, r, col, a = 1) { // a brush dab; its shape comes from its world position so it never flickers
  const h = Math.abs(Math.sin((x + DAB_X) * 12.99 + y * 78.23)) * 1000 % 1;
  ctx.globalAlpha = a; ctx.fillStyle = col; ell(x, y, r, r * (.72 + h * .28), h * 3); ctx.fill(); ctx.globalAlpha = 1;
}
function inkDab(x, y, r, col) { // a dab of foliage with a loose pen line around it
  const h = Math.abs(Math.sin((x + DAB_X) * 12.99 + y * 78.23)) * 1000 % 1;
  ctx.fillStyle = col; ell(x, y, r, r * (.72 + h * .28), h * 3); ctx.fill();
  ctx.strokeStyle = 'rgba(30,18,25,.55)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.ellipse(x, y, r, r * (.72 + h * .28), h * 3, Math.PI * (1.0 + h * .3), Math.PI * (1.9 + h * .3)); ctx.stroke();
}
function softDab(x, y, r, rgb, a) { // a feathered puff of color, for clouds and nebulae
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.55, `rgba(${rgb},${a * .55})`); g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function ridge(y0, amp, freq, col, seed) { // a hazy mountain ridge
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, FLOOR_TOP);
  for (let x = 0; x <= 1280; x += 16) ctx.lineTo(x, y0 + Math.sin(x * freq + seed) * amp + Math.sin(x * freq * 2.7 + seed * 2) * amp * .35);
  ctx.lineTo(1280, FLOOR_TOP); ctx.fill();
}
function hazeBand(g, col, y0, y1, a) { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(1, `rgba(${col},${a})`); g.fillStyle = gr; g.fillRect(0, y0, 1280, y1 - y0); }
function paintTree(x, base, h, rnd, greens, glow) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#2A2226'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x - 6, base - h * .5, x + 4, base - h * .8); ctx.stroke();
  ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 1, base - h * .55); ctx.quadraticCurveTo(x + 18, base - h * .7, x + 26, base - h * .82); ctx.stroke();
  for (let i = 0; i < 26; i++) { // canopy painted with overlapping dabs, lit from the upper right
    const a = rnd() * TAU, d = rnd() * 30, cx = x + 4 + Math.cos(a) * d * 1.3, cy = base - h * .86 + Math.sin(a) * d * .8;
    dab(cx, cy, 9 + rnd() * 9, greens[Math.floor(rnd() * 2)], .9);
  }
  for (let i = 0; i < 10; i++) dab(x + 10 + rnd() * 26, base - h * .95 + rnd() * 26, 4 + rnd() * 6, greens[2], .55);
  if (glow) for (let i = 0; i < 5; i++) { const gx = x - 20 + rnd() * 50, gy = base - h * .8 + rnd() * 30; ctx.save(); ctx.shadowColor = glow; ctx.shadowBlur = 8; dab(gx, gy, 2.2, glow, .95); ctx.restore(); }
}
function buildBackground(themeId, seed) {
  const key = themeId + K + seed; if (key === bgKey) return; bgKey = key;
  const rnd = mulberry(seed), th = THEMES[themeId];
  const [fc, f] = makeLayer(1280, FLOOR_TOP), [mc, m] = makeLayer(1280, FLOOR_TOP);
  const old = ctx;
  if (themeId === 'bloom') {
    ctx = f;
    ridge(150, 26, .006, '#8C86AE', 1); hazeBand(f, th.haze, 120, FLOOR_TOP, .55);
    for (let i = 0; i < 5; i++) { // drifting islands with thin falls of water
      const x = 120 + i * 250 + rnd() * 60, y = 60 + rnd() * 50, w = 60 + rnd() * 50;
      ctx.fillStyle = '#7E7AA0'; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.quadraticCurveTo(x, y + w * .9, x + w / 2, y); ctx.fill();
      for (let j = 0; j < 8; j++) dab(x - w / 2 + rnd() * w, y - 4 - rnd() * 10, 6 + rnd() * 6, '#6E8A86', .9);
      const wf = ctx.createLinearGradient(0, y, 0, y + 110); wf.addColorStop(0, 'rgba(240,235,255,.35)'); wf.addColorStop(1, 'rgba(240,235,255,0)'); ctx.fillStyle = wf; ctx.fillRect(x + w * .15, y + 6, 2, 110);
    }
    ridge(178, 18, .009, '#6F7E8E', 3); hazeBand(f, th.haze, 160, FLOOR_TOP, .45);
    ctx = m;
    ridge(205, 10, .012, '#4E6656', 5);
    for (let i = 0; i < 9; i++) paintTree(rnd() * 1280, FLOOR_TOP, 120 + rnd() * 70, rnd, ['#2F5446', '#3D6A52', '#C9C57E'], i % 2 ? '#F2C9A0' : null);
    for (let i = 0; i < 3; i++) { // an old stone arch overgrown with ivy
      const x = 200 + i * 420 + rnd() * 60;
      ctx.fillStyle = '#6A6470'; ctx.fillRect(x, FLOOR_TOP - 70, 12, 70); ctx.fillRect(x + 58, FLOOR_TOP - 70, 12, 70);
      ctx.beginPath(); ctx.arc(x + 35, FLOOR_TOP - 70, 35, Math.PI, 0); ctx.arc(x + 35, FLOOR_TOP - 70, 23, 0, Math.PI, true); ctx.fill();
      for (let j = 0; j < 14; j++) dab(x + rnd() * 70, FLOOR_TOP - 100 + rnd() * 70, 3 + rnd() * 4, '#3D6A52', .9);
    }
  } else if (themeId === 'sky') {
    ctx = f;
    ridge(160, 14, .005, '#8C7FA6', 2); hazeBand(f, th.haze, 120, FLOOR_TOP, .5);
    for (let i = 0; i < 10; i++) { // far towers, lamps already lit
      const x = i * 130 + rnd() * 40, w = 22 + rnd() * 20, h = 80 + rnd() * 80;
      ctx.fillStyle = '#6E6A8E'; ctx.fillRect(x, FLOOR_TOP - h, w, h);
      ctx.beginPath(); ctx.arc(x + w / 2, FLOOR_TOP - h, w / 2, Math.PI, 0); ctx.fillStyle = '#5E7E86'; ctx.fill();
      for (let y = FLOOR_TOP - h + 12; y < FLOOR_TOP - 8; y += 16) if (rnd() < .6) { ctx.save(); ctx.shadowColor = '#FFD9A0'; ctx.shadowBlur = 6; ctx.fillStyle = '#FFE2B0'; ctx.fillRect(x + w / 2 - 2, y, 4, 6); ctx.restore(); }
    }
    for (let i = 0; i < 3; i++) { // airships against the dusk
      const x = 220 + i * 420 + rnd() * 60, y = 50 + rnd() * 40;
      ctx.fillStyle = '#5E5272'; ell(x, y, 46, 14); ctx.fill(); ctx.fillStyle = '#7A6A86'; ell(x - 4, y - 5, 34, 5); ctx.fill();
      ctx.fillStyle = '#4A3E58'; rrect(x - 14, y + 14, 28, 7, 3); ctx.fill();
      ctx.save(); ctx.shadowColor = '#FFC98A'; ctx.shadowBlur = 8; ctx.fillStyle = '#FFD9A0'; circle(x + 10, y + 18, 2); ctx.fill(); ctx.restore();
    }
    hazeBand(f, th.haze, 150, FLOOR_TOP, .4);
    ctx = m;
    for (let i = 0; i < 6; i++) { // weathered gears on iron pillars
      const x = 80 + i * 220 + rnd() * 50, y = FLOOR_TOP - 70 - rnd() * 40, r = 22 + rnd() * 14;
      ctx.fillStyle = '#3E3A46'; ctx.fillRect(x - 5, y, 10, FLOOR_TOP - y);
      ctx.fillStyle = '#8A6A3E'; for (let k = 0; k < 10; k++) { ctx.save(); ctx.translate(x, y); ctx.rotate(k / 10 * TAU); ctx.fillRect(r - 2, -4, 8, 8); ctx.restore(); }
      circle(x, y, r); ctx.fill(); ctx.fillStyle = '#A8844A'; ctx.beginPath(); ctx.arc(x, y, r, Math.PI * 1.1, Math.PI * 1.7); ctx.lineTo(x, y); ctx.fill();
      ctx.fillStyle = '#4E7A74'; circle(x, y, r * .35); ctx.fill();
    }
  } else {
    ctx = f;
    for (let i = 0; i < 70; i++) { ctx.fillStyle = `rgba(255,245,255,${.3 + rnd() * .6})`; circle(rnd() * 1280, rnd() * 140, rnd() * 1.2 + .3); ctx.fill(); }
    for (let i = 0; i < 7; i++) softDab(rnd() * 1280, 40 + rnd() * 80, 80 + rnd() * 70, ['110,80,190', '170,70,150', '60,110,180'][i % 3], .35);
    for (let i = 0; i < 14; i++) { // drifting crystals, glowing from inside
      const x = rnd() * 1280, y = 30 + rnd() * 120, s = 8 + rnd() * 18, hue = [190, 280, 330, 45][i % 4];
      ctx.save(); ctx.shadowColor = `hsl(${hue},70%,70%)`; ctx.shadowBlur = 14;
      ctx.fillStyle = `hsla(${hue},45%,62%,.9)`; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * .55, y); ctx.lineTo(x, y + s * 1.2); ctx.lineTo(x - s * .55, y); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * .55, y); ctx.lineTo(x, y); ctx.closePath(); ctx.fill();
    }
    ridge(185, 20, .007, '#3A2A5E', 4); hazeBand(f, th.haze, 150, FLOOR_TOP, .35);
    ctx = m;
    for (let i = 0; i < 11; i++) { // crystal spires
      const x = rnd() * 1280, h = 50 + rnd() * 110, w = 14 + rnd() * 16, hue = [190, 280, 330, 170][i % 4];
      const g = ctx.createLinearGradient(x - w, 0, x + w, 0); g.addColorStop(0, `hsl(${hue},35%,30%)`); g.addColorStop(.6, `hsl(${hue},45%,52%)`); g.addColorStop(1, `hsl(${hue},55%,72%)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w / 2, FLOOR_TOP); ctx.lineTo(x - w / 2, FLOOR_TOP - h); ctx.lineTo(x, FLOOR_TOP - h - w); ctx.lineTo(x + w / 2, FLOOR_TOP - h); ctx.lineTo(x + w / 2, FLOOR_TOP); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.shadowColor = `hsl(${hue},80%,75%)`; ctx.shadowBlur = 10; ctx.fillStyle = `hsla(${hue},80%,85%,.7)`; ctx.fillRect(x + w / 2 - 3, FLOOR_TOP - h, 1.5, h * .8); ctx.restore();
    }
  }
  ctx = old;
  paintLayer(fc, { ink: '#3A2A30', line: .3, lw: .9, brush: .8, hatch: 0, seed: 3 });
  paintLayer(mc, { ink: '#1A100C', line: .85, lw: 1.1, brush: 1, hatch: .2, seed: 7 });
  releaseScratch(); retire(bgFar); retire(bgMid); // give the old world's layers and the working canvases back right away
  bgFar = fc; bgMid = mc;
  if (!grain) { // canvas-and-brush texture laid over the whole picture
    grain = document.createElement('canvas'); grain.width = grain.height = 256;
    const g = grain.getContext('2d'), r2 = mulberry(7);
    g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) { const v = Math.floor(100 + r2() * 56); g.fillStyle = `rgba(${v},${v},${v},.35)`; g.beginPath(); g.ellipse(r2() * 256, r2() * 256, 2 + r2() * 9, 1 + r2() * 3, r2() * 3, 0, TAU); g.fill(); }
  }
}
function drawWorld(themeId, camX, t) {
  const th = THEMES[themeId];
  const g = ctx.createLinearGradient(0, Y_OFF, 0, FLOOR_TOP);
  g.addColorStop(0, th.sky[0]); g.addColorStop(.45, th.sky[1]); g.addColorStop(.82, th.sky[2]); g.addColorStop(1, th.sky[3]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, FLOOR_TOP);
  const sx = VW * th.sun[0] - camX * .02, sy = Y_OFF + VIEW_H * th.sun[1];
  const sg = ctx.createRadialGradient(sx, sy, 4, sx, sy, 160); sg.addColorStop(0, `rgba(${th.sun[2]},.95)`); sg.addColorStop(.15, `rgba(${th.sun[2]},.5)`); sg.addColorStop(1, `rgba(${th.sun[2]},0)`);
  ctx.fillStyle = sg; ctx.fillRect(sx - 160, sy - 160, 320, 320);
  if (typeof WORLD_TILT !== 'undefined' && WORLD_TILT) { ctx.save(); ctx.translate(VW / 2, FLOOR_TOP); ctx.rotate(WORLD_TILT); ctx.scale(1.3, 1.3); ctx.translate(-VW / 2, -FLOOR_TOP); } // the deck banks: the world beyond the rail tilts
  skyWash(camX);
  const skyKind = th.skyKind || (themeId === 'prism' ? 'ribbons' : 'clouds'); // a locale may also paint its own live sky
  if (th.liveSky) th.liveSky(camX, t);
  else if (skyKind === 'none') {}
  else if (skyKind === 'ribbons') {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { ctx.strokeStyle = `hsla(${170 + i * 60 + Math.sin(t * .3) * 20},60%,60%,.12)`; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(-20, 80 + i * 24); for (let x = 0; x <= VW + 40; x += 40) ctx.lineTo(x, 80 + i * 24 + Math.sin(x * .01 + t * .5 + i) * 16); ctx.stroke(); }
    ctx.restore();
  } else {
    for (let i = 0; i < 5; i++) { // soft painted clouds catching the low sun
      const cx = ((i * 300 - camX * .06 - t * 4) % 1500 + 1500) % 1500 - 200, cy = Y_OFF + 20 + (i * 41) % 70;
      softDab(cx, cy, 60, th.haze, .45); softDab(cx + 50, cy - 10, 48, '255,236,220', .4); softDab(cx + 100, cy + 4, 44, th.haze, .35);
    }
  }
  const fx = -((camX * .15) % 1280), mx = -((camX * .45) % 1280);
  ctx.drawImage(bgFar, fx, 0, 1280, FLOOR_TOP); ctx.drawImage(bgFar, fx + 1280, 0, 1280, FLOOR_TOP);
  ctx.drawImage(bgMid, mx, 0, 1280, FLOOR_TOP); ctx.drawImage(bgMid, mx + 1280, 0, 1280, FLOOR_TOP);
  // the low sun washes warm light over the middle distance
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const wash = ctx.createRadialGradient(sx, sy, 10, sx, sy, VW * .7); wash.addColorStop(0, `rgba(${th.sun[2]},.22)`); wash.addColorStop(1, `rgba(${th.sun[2]},0)`);
  ctx.fillStyle = wash; ctx.fillRect(0, Y_OFF, VW, FLOOR_TOP - Y_OFF);
  ctx.restore();
  if (typeof WORLD_TILT !== 'undefined' && WORLD_TILT) ctx.restore();
  drawFloor(themeId, th, camX, t);
}
function drawFloor(themeId, th, camX, t) {
  DAB_X = camX;
  drawFloorLayer(themeId, th, camX, t);
  DAB_X = 0;
  // the ground is brushed in too, and its near edge is modelled into shadow with fine strokes
  ctx.save(); ctx.beginPath(); ctx.rect(0, FLOOR_TOP - 2, VW, VH - FLOOR_TOP + 2); ctx.clip();
  ctx.translate(-(camX % 512), 0); ctx.fillStyle = texPat(ctx, 'brush');
  ctx.save(); ctx.scale(.5, .5); ctx.fillRect(0, (FLOOR_TOP - 2) * 2, (VW + 512) * 2, (VH - FLOOR_TOP + 2) * 2); ctx.restore();
  ctx.globalAlpha = .16; ctx.fillStyle = texPat(ctx, 'hatch'); ctx.scale(.5, .5); ctx.fillRect(0, (VH - 34) * 2, (VW + 512) * 2, 68);
  ctx.restore();
}
function drawFloorLayer(themeId, th, camX, t) {
  const fg = ctx.createLinearGradient(0, FLOOR_TOP, 0, VH);
  fg.addColorStop(0, th.floorA); fg.addColorStop(1, th.floorB);
  ctx.fillStyle = fg; ctx.fillRect(0, FLOOR_TOP - 4, VW, VH - FLOOR_TOP + 4);
  const off = (n) => ((-camX) % n + n) % n - n;
  const hsh = (x) => { const s = Math.sin(x * 12.9898) * 43758.5453; return s - Math.floor(s); }; // stable per-tile randomness
  if (themeId === 'bloom') {
    for (let x = off(46); x < VW + 46; x += 46) { const w = Math.floor((x + camX) / 46); inkDab(x, FLOOR_TOP - 6, 22, '#2F5446'); inkDab(x + 22, FLOOR_TOP - 10, 18, '#3D6A52'); if (hsh(w) > .6) { ctx.save(); ctx.shadowColor = '#F2C9A0'; ctx.shadowBlur = 6; dab(x + 12, FLOOR_TOP - 18, 2.5, '#F6D6B8', 1); ctx.restore(); } }
    const pg = ctx.createLinearGradient(0, FLOOR_TOP + 30, 0, FLOOR_TOP + 92); pg.addColorStop(0, 'rgba(184,154,114,0)'); pg.addColorStop(.3, 'rgba(184,154,114,.85)'); pg.addColorStop(.75, 'rgba(160,128,92,.85)'); pg.addColorStop(1, 'rgba(160,128,92,0)');
    ctx.fillStyle = pg; ctx.fillRect(0, FLOOR_TOP + 30, VW, 62);
    for (let x = off(34); x < VW + 34; x += 34) { const w = Math.floor((x + camX) / 34); dab(x + hsh(w) * 20, FLOOR_TOP + 46 + hsh(w + 1) * 36, 6 + hsh(w + 2) * 6, hsh(w + 3) > .5 ? '#C9AE86' : '#9A7E5E', .55); }
    for (let x = off(28); x < VW + 28; x += 28) { const w = Math.floor((x + camX) / 28); ctx.strokeStyle = hsh(w) > .5 ? '#86A05E' : '#506E40'; ctx.lineWidth = 1.5; const gy = FLOOR_TOP + 10 + hsh(w + 5) * 22; ctx.beginPath(); ctx.moveTo(x, gy + 6); ctx.lineTo(x + 2, gy - 2); ctx.moveTo(x + 4, gy + 6); ctx.lineTo(x + 7, gy); ctx.stroke(); if (hsh(w + 9) > .7) dab(x + 3, gy - 3, 2.2, hsh(w + 4) > .5 ? '#D98CA0' : '#F0E0C0', 1); }
    for (let x = off(40); x < VW + 40; x += 40) { const w = Math.floor((x + camX) / 40); dab(x + hsh(w) * 30, VH - 14 + hsh(w + 1) * 10, 10 + hsh(w + 2) * 8, '#33482C', .6); }
  } else if (themeId === 'sky') {
    ctx.fillStyle = '#4A3E46'; ctx.fillRect(0, FLOOR_TOP - 22, VW, 3); ctx.fillRect(0, FLOOR_TOP - 6, VW, 6);
    for (let x = off(36); x < VW + 36; x += 36) ctx.fillRect(x, FLOOR_TOP - 22, 3, 18);
    for (let row = 0, y = FLOOR_TOP; y < VH; row++, y += 18 + row * 3) {
      ctx.fillStyle = 'rgba(60,44,40,.35)'; ctx.fillRect(0, y, VW, 1.2);
      for (let x = off(64) + (row % 2) * 32; x < VW + 64; x += 64) {
        const w = Math.floor((x + camX) / 64) + row * 31;
        ctx.fillStyle = 'rgba(60,44,40,.3)'; ctx.fillRect(x, y, 1.2, 18 + row * 3);
        dab(x + 32, y + 9, 10, hsh(w) > .5 ? 'rgba(200,170,130,.35)' : 'rgba(110,90,70,.25)', 1);
        if (hsh(w + 3) > .65) dab(x + 20, y + 10, 4, 'rgba(94,143,136,.6)', 1);
      }
    }
  } else {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let x = off(90); x < VW + 90; x += 90) { // glowing veins in the obsidian
      const w = Math.floor((x + camX) / 90), y0 = FLOOR_TOP + 8 + hsh(w) * 80;
      ctx.strokeStyle = `hsla(${hsh(w + 1) > .5 ? 180 : 320},70%,65%,${.25 + .15 * Math.sin(t * 2 + w)})`; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x + 24, y0 + 6); ctx.lineTo(x + 40, y0 - 2); ctx.lineTo(x + 70, y0 + 8); ctx.stroke();
    }
    ctx.restore();
    for (let x = off(30); x < VW + 30; x += 30) { const w = Math.floor((x + camX) / 30); ctx.fillStyle = `hsl(${[190, 280, 330][w % 3 < 0 ? 0 : w % 3]},30%,${40 + hsh(w) * 15}%)`; ctx.beginPath(); ctx.moveTo(x, FLOOR_TOP); ctx.lineTo(x + 7, FLOOR_TOP - 10 - hsh(w) * 10); ctx.lineTo(x + 14, FLOOR_TOP); ctx.fill(); }
  }
}
// a final pass that grades the whole frame like a painting: calmer saturation, warm/cool light, canvas texture, vignette
function gradeFrame(themeId) {
  const gd = THEMES[themeId].grade, y = Y_OFF, h = VIEW_H;
  ctx.save();
  ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgba(128,128,128,${gd.desat * .35})`; // panel paintings keep their pigments rich ctx.fillRect(0, y, VW, h);
  ctx.globalCompositeOperation = 'soft-light';
  const lg = ctx.createLinearGradient(0, y, 0, y + h); lg.addColorStop(0, gd.top); lg.addColorStop(1, gd.bot); ctx.fillStyle = lg; ctx.fillRect(0, y, VW, h);
  ctx.globalCompositeOperation = 'multiply';
  const vg = ctx.createRadialGradient(VW / 2, y + h * .55, h * .45, VW / 2, y + h * .55, VW * .72); vg.addColorStop(0, 'rgba(255,255,255,0)'); vg.addColorStop(1, gd.vig);
  ctx.fillStyle = vg; ctx.fillRect(0, y, VW, h);
  ctx.restore();
}
