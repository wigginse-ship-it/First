'use strict';
// ---------- palette & drawing helpers ----------
const OUT = '#2A1B2C';          // warm dark ink used for every outline
let FLASH = false;              // when true, every color helper returns white (hit flash)
const C = (c) => FLASH ? '#FFFFFF' : c;
function outline(w = 1.6) { ctx.lineWidth = w; ctx.strokeStyle = FLASH ? '#FFFFFF' : OUT; ctx.stroke(); }
function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
function ell(x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, TAU); }
function limb(pts, col, w) { // a thick round-capped limb with an outline
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.strokeStyle = FLASH ? '#fff' : OUT; ctx.lineWidth = w + 2.2; ctx.stroke();
  ctx.strokeStyle = C(col); ctx.lineWidth = w; ctx.stroke();
}
function shade(hex, amt) { // lighten (amt > 0) or darken (amt < 0) a #rrggbb color, for painted light and shadow
  if (!hex || hex[0] !== '#' || hex.length !== 7) return hex;
  const n = parseInt(hex.slice(1), 16), f = (c) => Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt));
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(f).map(c => c.toString(16).padStart(2, '0')).join('');
}
function shadow(x, y, rx) { // cast on the floor, so it is painted under the inked figures
  const f = () => { ctx.fillStyle = 'rgba(40,20,60,.3)'; ell(x, y, rx, rx * .28); ctx.fill(); };
  if (inkG && ctx === inkG) onMain(f); else f();
}

// the hero's face, drawn the way good sprite art handles a face at this size: a three-quarter view,
// two flat tones of skin with a hard shadow edge, dark brows over simple eyes, the nose only a shadow,
// and the hair as a few big chunky locks with one band of light on them
function drawCorwinHead(look, hy) {
  const sk = look.skin, shadowSk = shade(sk, -.3), ink = '#141016';
  ctx.fillStyle = C(shade(sk, -.38)); ctx.fillRect(-1.6, hy + 5, 5.6, 6.5); // neck, in the jaw's shadow
  const head = () => {
    ctx.beginPath(); ctx.moveTo(-6, hy - 7);
    ctx.quadraticCurveTo(0, hy - 10.4, 5.4, hy - 9.2); ctx.quadraticCurveTo(9.2, hy - 7.6, 9.2, hy - 3); // crown and brow
    ctx.lineTo(9.6, hy + 2.4); ctx.quadraticCurveTo(9.4, hy + 6.6, 7.6, hy + 8.2); // cheek down to a square chin
    ctx.quadraticCurveTo(5, hy + 9.4, 1.4, hy + 7.6); ctx.lineTo(-4.4, hy + 3.6); // jaw back to the ear
    ctx.quadraticCurveTo(-8.4, hy + 1, -6, hy - 7); ctx.closePath();
  };
  head(); ctx.fillStyle = C(sk); ctx.fill();
  ctx.save(); head(); ctx.clip(); // the hard-edged shadow side, turned away from the light
  ctx.fillStyle = C(shadowSk); ctx.beginPath(); ctx.moveTo(-10, hy - 12); ctx.lineTo(1, hy - 12); ctx.quadraticCurveTo(-.4, hy + 1, 2.4, hy + 6.2); ctx.quadraticCurveTo(6, hy + 7.6, 9.4, hy + 6.6); ctx.lineTo(9.4, hy + 12); ctx.lineTo(-10, hy + 12); ctx.closePath(); ctx.fill();
  ctx.fillRect(3, hy - 2.6, 7, 1.1); // the brow throws a shadow across the eyes
  ctx.beginPath(); ctx.moveTo(8.7, hy - .6); ctx.lineTo(9.8, hy + 2.6); ctx.lineTo(8, hy + 2.6); ctx.closePath(); ctx.fill(); // the nose, told by its shadow
  ctx.restore();
  head(); outline(1.1);
  ctx.fillStyle = C(shade(sk, -.42)); ell(-2.4, hy + 1.8, 1.4, 2.1); ctx.fill(); // ear
  // eyes: a dark lash line with a glint of green; the far eye is narrower, turned away
  ctx.fillStyle = C(ink); ctx.beginPath(); ctx.moveTo(4.2, hy - 1.4); ctx.lineTo(7.3, hy - 1.6); ctx.lineTo(7, hy + .3); ctx.lineTo(4.6, hy + .2); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(8.4, hy - 1.5); ctx.lineTo(9.6, hy - 1.6); ctx.lineTo(9.5, hy + .2); ctx.lineTo(8.5, hy + .2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C(look.eye); ctx.fillRect(5.6, hy - 1, 1.3, 1.1); ctx.fillRect(8.8, hy - 1, .6, 1);
  // brows: heavy and level, drawing down toward the nose
  ctx.fillStyle = C(ink); ctx.beginPath(); ctx.moveTo(3.4, hy - 3.6); ctx.lineTo(7.8, hy - 3.2); ctx.lineTo(7.6, hy - 2.1); ctx.lineTo(3.8, hy - 2.5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(8.5, hy - 3.1); ctx.lineTo(9.8, hy - 3.5); ctx.lineTo(9.7, hy - 2.5); ctx.lineTo(8.5, hy - 2.1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C(shade(sk, -.5)); ctx.fillRect(6.6, hy + 4.4, 2.4, .8); // a set mouth
  // black hair: swept-back bulk falling to the collar, a sideburn, and a few heavy locks over the brow
  ctx.fillStyle = C(look.hair); ctx.beginPath();
  ctx.moveTo(10, hy - 5);
  ctx.quadraticCurveTo(9.4, hy - 11.4, 2, hy - 12.4); ctx.quadraticCurveTo(-6.6, hy - 12.6, -9.6, hy - 5);
  ctx.quadraticCurveTo(-11.2, hy + 3, -9.2, hy + 11); ctx.lineTo(-6.8, hy + 8.6); ctx.lineTo(-5.6, hy + 11.6); ctx.lineTo(-3.6, hy + 5.6);
  ctx.quadraticCurveTo(-4, hy + 1, -3, hy - 1.6); ctx.lineTo(-.6, hy - 1.4); ctx.lineTo(-.2, hy + 3.4); ctx.lineTo(1.8, hy - 4.4);
  ctx.lineTo(4.4, hy - 4.8); ctx.lineTo(5.4, hy - 2.8); ctx.lineTo(6.6, hy - 5.4); ctx.lineTo(8.4, hy - 3.8); ctx.closePath();
  ctx.fill(); outline(1.1);
  ctx.fillStyle = C('#454A62'); ctx.beginPath(); // one band of cool light along the top of the hair
  ctx.moveTo(7.4, hy - 9); ctx.quadraticCurveTo(1, hy - 12, -6.4, hy - 8.4); ctx.quadraticCurveTo(0, hy - 10.4, 6.6, hy - 7.6); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-8.8, hy - 1); ctx.quadraticCurveTo(-9.6, hy + 4, -8.4, hy + 8.4); ctx.quadraticCurveTo(-8.4, hy + 3, -7.6, hy - .6); ctx.closePath(); ctx.fill();
}

// ---------- weapons (drawn in hand space: the hand is at (16,0), pointing along +x) ----------
function drawWeapon(kind, pose) {
  if (kind === 'fists' || !kind) { circle(17, 0, 4.5); ctx.fillStyle = C((pose && pose.glove) || '#FFF1E0'); ctx.fill(); outline(1.5); return; }
  // the hero's weapons change as they level: 1 iron and wood, 2 steel and leather, 3 gold and a gem, 4 runes that glow, 5 shadow-steel with a violet aura
  const tier = (pose && pose.tier) || 1, hand = (pose && pose.glove) || '#FFF1E0';
  const glowRune = (x, y, w, h, col) => { ctx.save(); if (!FLASH) { ctx.shadowColor = col; ctx.shadowBlur = 8; } ctx.fillStyle = C(col); ctx.fillRect(x, y, w, h); ctx.restore(); };
  if (kind === 'hammer') {
    const big = tier >= 4 ? 3 : 0, head = ['#7E8494', '#A8B0C2', '#B8BCC8', '#9AA4BC', '#2E2A3E'][tier - 1];
    limb([4, 0, 44 + big, 0], tier >= 5 ? '#241E2E' : tier >= 2 ? '#6A4A30' : '#9A6234', 4);
    if (tier >= 2) { ctx.fillStyle = C('#3A2A20'); for (let x = 8; x < 30; x += 5) ctx.fillRect(x, -2.4, 2, 4.8); } // leather wraps
    const hg = ctx.createLinearGradient(0, -12 - big, 0, 12 + big); hg.addColorStop(0, C(shade(head, .3))); hg.addColorStop(1, C(shade(head, -.3)));
    rrect(36 + big * .5, -12 - big, 18 + big, 24 + big * 2, 4); ctx.fillStyle = hg; ctx.fill(); outline();
    if (tier >= 3) { ctx.fillStyle = C('#D8AA55'); ctx.fillRect(37 + big * .5, -12 - big, 2.5, 24 + big * 2); ctx.fillRect(51 + big * 1.5, -12 - big, 2.5, 24 + big * 2); }
    ctx.fillStyle = C(tier >= 5 ? '#B89CFF' : tier >= 3 ? '#C8607A' : '#8FB8D8'); circle(45 + big, 0, 2.6 + (tier >= 3 ? 1 : 0)); ctx.fill();
    if (tier >= 4) { glowRune(40 + big, -9 - big, 1.4, 6, tier >= 5 ? '#B89CFF' : '#9FE8F0'); glowRune(49 + big, 3, 1.4, 6, tier >= 5 ? '#B89CFF' : '#9FE8F0'); }
    if (tier >= 5 && !FLASH) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(184,156,255,.25)'; rrect(32, -18, 30, 36, 10); ctx.fill(); ctx.restore(); }
    circle(17, 0, 4); ctx.fillStyle = C(hand); ctx.fill(); return;
  }
  if (kind === 'staff') {
    const len = 58 + (tier >= 4 ? 6 : 0), cap = ['#C9A86A', '#A8B0C2', '#D8AA55', '#D8AA55', '#B89CFF'][tier - 1];
    limb([-28, 0, len, 0], ['#B56B2E', '#8A5A3A', '#2E2440', '#2E2440', '#1C1626'][tier - 1], 3.5);
    if (tier >= 2) { ctx.fillStyle = C(tier >= 3 ? '#D8AA55' : '#5A3A28'); for (const x of [-8, 6, 26, 40]) ctx.fillRect(x, -2.3, 2, 4.6); } // bands
    ctx.fillStyle = C(cap); rrect(-32, -3, 7, 6, 2); ctx.fill(); rrect(len - 4, -3, 7, 6, 2); ctx.fill();
    if (tier >= 4) for (const x of [-30, len - 2]) { ctx.save(); if (!FLASH) { ctx.shadowColor = tier >= 5 ? '#B89CFF' : '#9FE8F0'; ctx.shadowBlur = 10; } ctx.fillStyle = C(tier >= 5 ? '#D8C8FF' : '#BFF5FF'); ctx.beginPath(); ctx.moveTo(x - 1, -6); ctx.lineTo(x + 3, 0); ctx.lineTo(x - 1, 6); ctx.lineTo(x - 5, 0); ctx.closePath(); ctx.fill(); ctx.restore(); }
    ctx.strokeStyle = C(tier >= 5 ? '#8A6ACF' : '#C8607A'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.quadraticCurveTo(-34, 8, -38 + Math.sin(performance.now() / 120) * 3, 14); ctx.stroke(); // ribbon
    circle(17, 0, 4); ctx.fillStyle = C(hand); ctx.fill(); return;
  }
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
function drawHumanoid(look, pose) {
  const walk = pose.walk || 0, sw = Math.sin(walk);
  ctx.save();
  if (pose.rot) { ctx.translate(0, -30); ctx.rotate(pose.rot); ctx.translate(0, 30); }
  if (pose.down) { ctx.translate(-6, -4); ctx.rotate(-1.5); }
  const cr = pose.crouch ? 7 : 0;
  // cape flows behind
  if (look.cape) {
    const flow = (pose.flow || 0) + Math.abs(sw) * 4;
    ctx.beginPath(); ctx.moveTo(-3, -46 + cr); ctx.quadraticCurveTo(-18 - flow, -30 + cr, -16 - flow * 1.4, -8 + Math.sin(walk * .5) * 3);
    ctx.lineTo(-4, -14 + cr); ctx.closePath(); ctx.fillStyle = C(look.cape); ctx.fill(); outline(1.8);
  }
  // the hero's head is drawn a little larger than life, so his face reads at a glance
  const hs = look.corwin ? 1.28 : 1, headScale = () => { ctx.translate(1, -51 + cr); ctx.scale(hs, hs); ctx.translate(-1, 51 - cr); };
  // long hair streams behind the head
  if (look.longHair) {
    ctx.save(); headScale();
    const flow = (pose.flow || 0) * .8 + Math.abs(sw) * 2;
    ctx.beginPath(); ctx.moveTo(-4, -64 + cr); ctx.quadraticCurveTo(-14 - flow, -56 + cr, -12 - flow * 1.3, -38 + cr + Math.sin(walk * .7) * 2);
    ctx.lineTo(-6, -44 + cr); ctx.quadraticCurveTo(-6, -54 + cr, 0, -60 + cr); ctx.closePath(); ctx.fillStyle = C(look.hair); ctx.fill(); outline(1.4);
    ctx.restore();
  }
  // tattered coat tails swing from the waist
  if (look.coat) {
    const flow = (pose.flow || 0) + Math.abs(sw) * 5;
    for (const [dx, k] of [[-2, 1], [3, .7]]) {
      ctx.beginPath(); ctx.moveTo(dx - 6, -30 + cr); ctx.quadraticCurveTo(dx - 12 - flow * k, -16 + cr, dx - 14 - flow * 1.5 * k, -4 + Math.sin(walk + dx) * 2);
      ctx.lineTo(dx - 10 - flow * k, -8); ctx.lineTo(dx - 8 - flow * k * .8, -2); ctx.lineTo(dx - 4, -10 + cr * .5); ctx.lineTo(dx + 2, -28 + cr); ctx.closePath();
      ctx.fillStyle = C(k === 1 ? look.coat : look.coat2 || look.coat); ctx.fill(); outline(1.4);
    }
  }
  // back arm
  const ba = pose.backArm ?? (1.25 - sw * .4);
  limb([-2, -44 + cr, -2 + Math.cos(ba) * 15, -44 + cr + Math.sin(ba) * 15], look.sleeve || look.body, 5.5);
  // legs
  const hipY = -26 + cr;
  if (pose.kick) {
    limb([-2, hipY, -6, hipY + 12, -4, 0], look.legs, 6);
    limb([2, hipY, 18, hipY - 2, 32, hipY - 4], look.legs, 6);
    ctx.fillStyle = C(look.boots); circle(33, hipY - 4, 4.5); ctx.fill(); outline(1.5);
  } else if (pose.down) {
    limb([-2, hipY, -4, -12, -6, 0], look.legs, 6); limb([2, hipY, 6, -12, 8, 0], look.legs, 6);
  } else {
    const run = pose.run ? 1.6 : 1;
    const f1 = sw * 9 * run, f2 = -sw * 9 * run;
    const k1 = cr ? 8 : Math.max(0, sw) * 5, k2 = cr ? 8 : Math.max(0, -sw) * 5;
    limb([-3, hipY, -3 + f1 * .5 + k1, -13 + cr * .4, -3 + f1, 0], look.legs, 6);
    limb([3, hipY, 3 + f2 * .5 + k2, -13 + cr * .4, 3 + f2, 0], look.legs, 6);
    for (const f of [f1, f2 + 6]) { ctx.fillStyle = C(look.boots); rrect(-6 + f, -5, 9, 6, 2); ctx.fill(); ctx.fillStyle = C(shade(look.boots, .25)); ctx.fillRect(-6 + f, -6.5, 6, 2); ctx.fillStyle = C(shade(look.boots, -.45)); ctx.fillRect(-6 + f, -.8, 9.5, 1.2); }
  }
  // torso (leans around the hips)
  ctx.save(); ctx.translate(0, hipY); ctx.rotate(pose.lean || 0); ctx.translate(0, -hipY);
  if (look.robot) {
    rrect(-11, -50 + cr, 22, 26, 5); ctx.fillStyle = C(look.body); ctx.fill(); outline();
    ctx.fillStyle = C(look.trim); ctx.fillRect(-11, -30 + cr, 22, 4);
    ctx.save(); ctx.globalCompositeOperation = FLASH ? 'source-over' : 'lighter'; ctx.fillStyle = C(look.core); circle(0, -40 + cr, 4.5); ctx.fill(); ctx.restore();
  } else {
    const ty = -48 + cr;
    const tg = ctx.createLinearGradient(-9, ty, 9, ty + 25); // lit from the upper right, like the low sun
    tg.addColorStop(0, C(shade(look.body, -.3))); tg.addColorStop(.6, C(look.body)); tg.addColorStop(1, C(shade(look.body, .16)));
    rrect(-9, ty, 18, 25, 6); ctx.fillStyle = tg; ctx.fill(); outline();
    ctx.strokeStyle = C(shade(look.body, -.4)); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(-5, ty + 7); ctx.quadraticCurveTo(-3, ty + 12, -4, ty + 18); ctx.moveTo(4, ty + 10); ctx.quadraticCurveTo(6, ty + 15, 5, ty + 20); ctx.stroke(); // cloth folds
    ctx.fillStyle = C(shade(look.body, .2)); ctx.beginPath(); ctx.moveTo(-6, ty + 1); ctx.lineTo(0, ty + 7); ctx.lineTo(6, ty + 1); ctx.lineTo(3, ty); ctx.lineTo(0, ty + 3); ctx.lineTo(-3, ty); ctx.closePath(); ctx.fill(); // collar
    if (look.strap) { ctx.strokeStyle = C(look.strap); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-8, ty + 3); ctx.lineTo(7, ty + 20); ctx.stroke(); }
    if (look.plate) { // breastplate, lit and trimmed
      const pg = ctx.createLinearGradient(-8, ty, 8, ty + 18); pg.addColorStop(0, C(shade(look.plate, -.25))); pg.addColorStop(.55, C(look.plate)); pg.addColorStop(.75, C(shade(look.plate, .45))); pg.addColorStop(1, C(look.plate));
      ctx.beginPath(); ctx.moveTo(-8, ty + 3); ctx.quadraticCurveTo(0, ty - 1, 8, ty + 3); ctx.lineTo(7, ty + 16); ctx.quadraticCurveTo(0, ty + 21, -7, ty + 16); ctx.closePath(); ctx.fillStyle = pg; ctx.fill(); outline(1.3);
      if (look.plateTrim) { ctx.strokeStyle = C(look.plateTrim); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-7, ty + 15); ctx.quadraticCurveTo(0, ty + 20, 7, ty + 15); ctx.moveTo(0, ty + 1); ctx.lineTo(0, ty + 18); ctx.stroke(); }
      if (look.runes) { ctx.save(); if (!FLASH) { ctx.shadowColor = look.runes; ctx.shadowBlur = 6; } ctx.strokeStyle = C(look.runes); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-4, ty + 6); ctx.lineTo(-2, ty + 10); ctx.lineTo(-4, ty + 13); ctx.moveTo(4, ty + 6); ctx.lineTo(2, ty + 10); ctx.lineTo(4, ty + 13); ctx.stroke(); ctx.restore(); }
    }
    ctx.fillStyle = C(look.trim); ctx.fillRect(-9, -28 + cr, 18, 3.5); if (!look.plate) ctx.fillRect(-1.5, ty, 3, 20);
    ctx.fillStyle = C('#C9A86A'); ctx.fillRect(1, -28.5 + cr, 3.5, 4.5); ctx.fillStyle = C(shade(look.trim, -.5)); ctx.fillRect(2, -27.5 + cr, 1.5, 2.5); // buckle
    if (look.rose) { // his silver rose, pinned at the breast
      const rx = -4.4, ry = -41.5 + cr; ctx.save(); ctx.translate(rx, ry); ctx.scale(1.5, 1.5); ctx.translate(-rx, -ry);
      ctx.strokeStyle = C('#5E6E5A'); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(rx, ry + 1.5); ctx.lineTo(rx - 1.5, ry + 5); ctx.stroke();
      for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - .3; ctx.fillStyle = C(i % 2 ? '#C8CEDA' : '#E8ECF4'); ell(rx + Math.cos(a) * 1.3, ry + Math.sin(a) * 1.3, 1.5, 1.1, a); ctx.fill(); }
      ctx.fillStyle = C('#8E96A8'); circle(rx, ry, .8); ctx.fill(); ctx.restore();
    }
    if (look.chain) { ctx.strokeStyle = C(look.trim); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-8, -26 + cr); ctx.quadraticCurveTo(-2, -20 + cr, 6, -25 + cr); ctx.stroke(); }
  }
  // head
  const hy = -58 + cr;
  if (look.robot) {
    rrect(-8, hy - 8, 17, 15, 4); ctx.fillStyle = C(look.helm); ctx.fill(); outline();
    ctx.fillStyle = C(look.visor); ctx.fillRect(1, hy - 3, 8, 3.5);
    if (look.plume) { ctx.fillStyle = C(look.plume); ctx.beginPath(); ctx.moveTo(-6, hy - 8); ctx.quadraticCurveTo(-14, hy - 18, -20, hy - 8); ctx.quadraticCurveTo(-12, hy - 10, -6, hy - 4); ctx.fill(); }
  } else if (look.corwin) {
    ctx.save(); headScale(); drawCorwinHead(look, hy); ctx.restore();
  } else {
    ctx.fillStyle = C(shade(look.skin, -.22)); ctx.fillRect(-1.5, hy + 5, 5, 6); // neck
    const sg = ctx.createRadialGradient(4, hy - 3, 1, 1, hy, 10); sg.addColorStop(0, C(shade(look.skin, .12))); sg.addColorStop(1, C(shade(look.skin, -.18)));
    ell(1, hy, 7.8, 8.8); ctx.fillStyle = sg; ctx.fill(); outline();
    ell(-3.2, hy + 1, 1.8, 2.6); ctx.fillStyle = C(shade(look.skin, -.15)); ctx.fill(); // ear
    if (!look.mask) { ctx.strokeStyle = C(shade(look.skin, -.45)); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(7.6, hy - .6); ctx.lineTo(8.7, hy + 1.8); ctx.lineTo(7.4, hy + 2.3); ctx.moveTo(5, hy + 4.6); ctx.quadraticCurveTo(6.2, hy + 5.2, 7.3, hy + 4.4); ctx.stroke(); } // nose and mouth
    ell(5, hy - .8, 2.1, 1.5); ctx.fillStyle = C('#F2ECE6'); ctx.fill(); // the eye
    if (look.eye) { ctx.save(); if (!FLASH) { ctx.shadowColor = look.eye; ctx.shadowBlur = 6; } ctx.fillStyle = C(look.eye); circle(5.6, hy - .8, 1.3); ctx.fill(); ctx.restore(); }
    else { ctx.fillStyle = C(look.iris || '#3A2E2A'); circle(5.6, hy - .8, 1.2); ctx.fill(); }
    ctx.fillStyle = C('#FFFFFF'); ctx.fillRect(5.8, hy - 1.6, .8, .8);
    ctx.strokeStyle = C(look.hair || look.hood || OUT); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(2.6, hy - 3.6); ctx.quadraticCurveTo(5, hy - 4.6, 7.4, hy - 3.4); ctx.stroke(); // brow
    if (look.hood) { // a deep hood hides the face in shadow
      ctx.fillStyle = C(look.hood); ctx.beginPath(); ctx.moveTo(-10, hy + 7); ctx.quadraticCurveTo(-12, hy - 12, 2, hy - 12); ctx.quadraticCurveTo(12, hy - 10, 10, hy + 2); ctx.lineTo(4, hy + 1); ctx.quadraticCurveTo(2, hy - 6, -4, hy - 2); ctx.lineTo(-5, hy + 8); ctx.closePath(); ctx.fill(); outline(1.4);
    } else {
      ctx.fillStyle = C(look.hair); ctx.beginPath(); // hair with a real hairline above the brow
      ctx.moveTo(-8.6, hy + 6); ctx.quadraticCurveTo(-11, hy - 6, -3, hy - 9.6); ctx.quadraticCurveTo(5, hy - 11.2, 8.6, hy - 4.4); ctx.quadraticCurveTo(5, hy - 6.6, 1, hy - 6.2); ctx.quadraticCurveTo(-3, hy - 5, -4, hy + 2.5); ctx.closePath(); ctx.fill(); outline(1);
      if (look.fringe) { ctx.beginPath(); ctx.moveTo(1, hy - 8); ctx.quadraticCurveTo(7, hy - 6, 6.5, hy - 1.5); ctx.quadraticCurveTo(5, hy - 4.5, 2.5, hy - 5.5); ctx.closePath(); ctx.fill(); }
      ctx.strokeStyle = C(shade(look.hair, .35)); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-6, hy - 5); ctx.quadraticCurveTo(-2, hy - 9, 4, hy - 8.4); ctx.moveTo(-7, hy); ctx.quadraticCurveTo(-6, hy - 4, -3, hy - 6.5); ctx.stroke(); // locks catching the light
    }
    if (look.crown) { ctx.fillStyle = C(look.crown); ctx.beginPath(); ctx.moveTo(-6, hy - 8); ctx.lineTo(-4, hy - 13); ctx.lineTo(-1, hy - 9); ctx.lineTo(2, hy - 14); ctx.lineTo(4, hy - 9); ctx.lineTo(6, hy - 12); ctx.lineTo(7, hy - 7); ctx.closePath(); ctx.fill(); }
    if (look.mask) { ctx.fillStyle = C(look.mask); ctx.beginPath(); ctx.moveTo(-1, hy + 1.5); ctx.lineTo(9, hy + 1); ctx.lineTo(8, hy + 6.5); ctx.lineTo(0, hy + 7); ctx.closePath(); ctx.fill(); }
  }
  // front arm + weapon
  const arm = pose.arm ?? (1.1 + sw * .35);
  if (pose.trail) drawTrail(0, -45 + cr, pose);
  if (pose.flat) drawFlatTrail(1, -45 + cr, pose.flat);
  ctx.save(); ctx.translate(1, -45 + cr); ctx.rotate(arm);
  if (pose.sweep !== undefined) ctx.scale(Math.sign(pose.sweep || 1) * Math.max(.14, Math.abs(pose.sweep)), 1); // a horizontal swing: the weapon comes around the body
  const reach = 15 + (pose.ext || 0) * 12; // a thrust drives the arm out
  limb([0, 0, reach, 0], look.sleeve || look.body, 5.5);
  pose.glove = look.glove;
  if (pose.streak) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = pose.streak.a; ctx.strokeStyle = pose.streak.col; ctx.lineWidth = 2; for (const dy of [-4, 0, 4]) { ctx.beginPath(); ctx.moveTo(reach + 6, dy); ctx.lineTo(reach + pose.streak.len, dy * .4); ctx.stroke(); } ctx.restore(); }
  ctx.translate(reach - 15, 0);
  drawWeapon(pose.weapon || look.weapon, pose);
  ctx.restore();
  if (look.pauldron) { ctx.beginPath(); ctx.ellipse(1, -45 + cr, 8, 6, -.3, Math.PI * .9, Math.PI * 2.1); ctx.closePath(); ctx.fillStyle = C(look.pauldron); ctx.fill(); outline(1.4); ctx.fillStyle = C(look.trim); ctx.fillRect(-4, -47 + cr, 9, 1.5); }
  ctx.restore();
  ctx.restore();
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
function onPage(f) { if (inkG && ctx === inkG) onMain(f); else f(); }
function drawFlatTrail(cx, cy, f) { // the trail of a horizontal swing: a flattened arc around the waist
  onPage(() => brushArc((o, h) => { const r = f.r + o; ctx.beginPath(); ctx.ellipse(cx, cy + 6, Math.max(1, r), Math.max(1, r * .3), 0, f.rev ? Math.PI * (1 - f.k * (.85 + h * .15)) : 0, f.rev ? Math.PI : Math.PI * f.k * (.85 + h * .15), false); }, f.col, f.w, .8));
}
function drawTrail(cx, cy, pose) {
  const a0 = pose.trailFrom, a1 = pose.arm, r = pose.trail;
  if (Math.abs(a1 - a0) < .05) return;
  const lo = Math.min(a0, a1), hi = Math.max(a0, a1), lead = a1 > a0;
  onPage(() => brushArc((o, h) => { ctx.beginPath(); const cut = (hi - lo) * h * .25; ctx.arc(cx, cy, Math.max(1, r + o - 4), lead ? lo + cut : lo, lead ? hi : hi - cut); }, pose.trailCol, (pose.trailW || 6) * 1.6, .85));
}
// the Prince of Shadow, after Corwin: black hair to the shoulder, green eyes, dressed in black and silver with a silver rose
const HERO = { corwin: 1, rose: 1, glove: '#2A2830', skin: '#DCC4AE', hair: '#141218', body: '#1E1C24', sleeve: '#1A181F', trim: '#B8BECC', legs: '#17151B', boots: '#26222A', coat: '#22202A', coat2: '#2C2A36', pauldron: '#3A3A46', eye: '#4FAE6A', chain: 1 };
// the hero's armor shows its forge level: 2 a leather strap and shoulder guard, 3 a steel breastplate, 4 silver trim, 5 shadow-plate with runes
function heroLook() {
  const a = save.armor, L = Object.assign({}, HERO);
  if (a >= 2) { L.strap = '#4A3A2E'; L.pauldron = '#5A4A3E'; }
  if (a >= 3) { L.plate = '#8E96A8'; L.pauldron = '#8E96A8'; L.strap = null; }
  if (a >= 4) { L.plateTrim = '#E4E8F0'; L.trim = '#E4E8F0'; } // bright silver, his colors
  if (a >= 5) { L.plate = '#3A344E'; L.pauldron = '#2E2A40'; L.runes = '#B89CFF'; }
  return L;
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
  skyWash(camX);
  if (themeId === 'prism') {
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
