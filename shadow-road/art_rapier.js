// ---------- Grayswandir, the prince's own sword: a different blade at each level ----------
// 1 a plain arming sword; 2 a swept-hilt rapier, its steel loops guarding the hand; 3 the Silver Rose, a silvered blade
// etched with filigree under a cup-hilt of rose petals; 4 the Pattern blade, starlit grey with the Pattern of Amber
// running down it in light; 5 Grayswandir itself: a night-silver blade, the Pattern glowing and pulsing, stars caught
// along its edge, a rose guard set with a green stone. Drawn in hand space: the hand at (16,0), the point along +x.
function gbGlow(fn) { if (FLASH || TINT) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); }
function gbStar(x, y, r, a) { ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * .22, y - r * .22); ctx.lineTo(x + r, y); ctx.lineTo(x + r * .22, y + r * .22); ctx.lineTo(x, y + r); ctx.lineTo(x - r * .22, y + r * .22); ctx.lineTo(x - r, y); ctx.lineTo(x - r * .22, y - r * .22); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; }
// the Pattern: a meander of light down the middle of the blade
function gbPattern(x0, x1, amp, col, w, a) {
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.globalAlpha = a; ctx.lineCap = 'round'; ctx.beginPath();
  for (let x = x0; x <= x1; x += 1.5) { const k = (x - x0) / (x1 - x0), y = Math.sin(x * .55) * amp * (1 - k * .6) + Math.sin(x * 1.7) * amp * .25; x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
  ctx.stroke(); ctx.globalAlpha = 1;
}
function gbRose(x, y, r, petal, core) { // a little rose of overlapping petals
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .3; ctx.fillStyle = C(i % 2 ? petal : shade(petal, .22)); ell(x + Math.cos(a) * r * .55, y + Math.sin(a) * r * .55, r * .62, r * .42, a); ctx.fill(); }
  ctx.fillStyle = C(core); circle(x, y, r * .38); ctx.fill(); outline(.7);
}
function drawGrayblade(pose) {
  const tier = clamp(pose.tier || 1, 1, 5), now = performance.now() / 1000;
  const len = [40, 44, 46, 48, 50][tier - 1], x0 = 20, tip = x0 + len + 4, w = [2.4, 1.8, 1.9, 2.1, 2.3][tier - 1] * .88; // a fencer's blade: well short of the great sword, and slim
  // each level is forged from a stranger metal: blue starsteel, verdigris greenbronze, rose-gold, violet moonglass, night-silver
  const bc = ['#9FB8DA', '#62AC90', '#E6A88E', '#9A6EDC', '#4A4C5E'][tier - 1];
  const metal = ['#6E86AC', '#3E7A62', '#C88468', '#6A48B0', '#D8DCE8'][tier - 1]; // its guard and fittings
  const shine = ['#E8F2FF', '#D8FFE8', '#FFE8DC', '#F0E0FF', '#C8D0FF'][tier - 1];
  // the grip and pommel
  limb([5, 0, 17, 0], ['#5A3A2A', '#2E2A30', '#2A2430', '#22202C', '#18161E'][tier - 1], 3.6);
  if (tier >= 2) { ctx.strokeStyle = C(metal); ctx.lineWidth = .7; ctx.beginPath(); for (let x = 7; x < 16; x += 1.6) { ctx.moveTo(x, -1.8); ctx.lineTo(x + 1, 1.8); } ctx.stroke(); } // wire-wrapped grip
  if (tier >= 3) { ctx.save(); ctx.translate(3.6, 0); ctx.rotate(Math.PI / 2); silverRose(0, 0, .95, false, metal); ctx.restore(); } // a rosebud for a pommel // a rose for a pommel
  else { ctx.fillStyle = C(metal); circle(4.6, 0, 2.8); ctx.fill(); outline(1); }
  // the blade: long and narrow, tapering to a needle point
  const blade = () => { ctx.beginPath(); ctx.moveTo(x0, -w); ctx.lineTo(x0 + len * .82, -w * .7); ctx.lineTo(tip, 0); ctx.lineTo(x0 + len * .82, w * .7); ctx.lineTo(x0, w); ctx.closePath(); };
  blade();
  const bg = ctx.createLinearGradient(0, -w, 0, w); bg.addColorStop(0, C(shade(bc, .4))); bg.addColorStop(.5, C(bc)); bg.addColorStop(1, C(shade(bc, -.3)));
  ctx.fillStyle = bg; ctx.fill(); outline(1.5);
  ctx.fillStyle = C(shine); ctx.fillRect(x0 + 2, -w * .62, len * .8, .9); // the edge catching the light
  if (tier === 2) { ctx.fillStyle = C(shade(bc, -.35)); ctx.fillRect(x0 + 3, -.4, len * .5, .9); } // fuller
  if (tier === 3 && !FLASH && !TINT) { // filigree etched into the silver
    ctx.strokeStyle = 'rgba(140,70,60,.7)'; ctx.lineWidth = .55; ctx.beginPath();
    for (let x = x0 + 4; x < x0 + len * .6; x += 7) { ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + 2, -2, x + 3.5, 0); ctx.quadraticCurveTo(x + 5, 2, x + 7, 0); }
    ctx.stroke();
  }
  if (tier >= 4) { // the Pattern, running down the blade in light
    const pulse = tier >= 5 ? .55 + .45 * Math.sin(now * 2.2) : .7;
    if (!FLASH && !TINT) gbPattern(x0 + 2, x0 + len * .86, w * .55, tier >= 5 ? '#2A2C3E' : '#4A2E80', 1.2, .9);
    gbGlow(() => { gbPattern(x0 + 2, x0 + len * .86, w * .55, tier >= 5 ? '#B8C4FF' : '#E0B8FF', 1.6, .55 * pulse); gbPattern(x0 + 2, x0 + len * .86, w * .55, '#FFFFFF', .6, .8 * pulse); });
  }
  if (tier >= 5) gbGlow(() => { // stars caught along the edge, each brightening in turn
    ctx.fillStyle = '#F4F0FF';
    for (let i = 0; i < 5; i++) { const k = (i + .5) / 5, a = Math.max(0, Math.sin(now * 2.6 - i * 1.3)); if (a > .15) gbStar(x0 + len * k * .92, (i % 2 ? -1 : 1) * w * .5, 1.6 + a * 2.2, a * .9); }
    ctx.fillStyle = 'rgba(240,236,255,.9)'; gbStar(tip - 1, 0, 2.6 + Math.sin(now * 3.1) * .8, .8); // a star at the very point
  });
  // the guard
  if (tier === 1) { rrect(16, -7.5, 3.6, 15, 1.4); ctx.fillStyle = C(metal); ctx.fill(); outline(1.3); } // a plain cross
  else if (tier === 2) { // a swept hilt: a cross, a knuckle bow over the hand, and loops of steel
    ctx.strokeStyle = C(metal); ctx.lineCap = 'round'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(18, -9); ctx.lineTo(18, 9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(18, -6); ctx.bezierCurveTo(12, -10, 4, -8, 3, -2); ctx.stroke(); // knuckle bow
    ctx.lineWidth = 1.3; ctx.beginPath(); ctx.ellipse(21, -3.2, 3.4, 2.4, 0, 0, TAU); ctx.moveTo(24.4, 3.2); ctx.ellipse(21, 3.2, 3.4, 2.4, 0, 0, TAU); ctx.stroke(); // side rings
    ctx.fillStyle = C(shade(metal, .35)); circle(18, -9, 1.6); ctx.fill(); circle(18, 9, 1.6); ctx.fill();
  } else { // a cup of silver rose petals, swept quillons, and a knuckle bow of thorny silver
    const pet = metal;
    ctx.strokeStyle = C(shade(metal, -.1)); ctx.lineCap = 'round'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(18, -4); ctx.bezierCurveTo(13, -12, 5, -9, 3, -2.6); ctx.stroke(); // knuckle bow
    if (tier >= 4) { ctx.lineWidth = 1; ctx.beginPath(); for (const k of [.3, .55, .8]) { const x = 18 - 15 * k, y = -4 - 6.5 * Math.sin(k * Math.PI); ctx.moveTo(x, y); ctx.lineTo(x - 1.4, y - 2.2); } ctx.stroke(); } // thorns
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(19, -1); ctx.quadraticCurveTo(22, -9, 27, -11); ctx.moveTo(19, 1); ctx.quadraticCurveTo(15, 9, 10, 11); ctx.stroke(); // swept quillons
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * .55; ctx.fillStyle = C(i % 2 ? pet : shade(pet, .18)); ell(18 + Math.cos(a) * .8, Math.sin(a) * 5.4, 4.4, 2.8, a); ctx.fill(); outline(.8); } // the cup of petals
    if (tier >= 5) { ctx.fillStyle = C('#4FAE6A'); circle(19, 0, 1.9); ctx.fill(); outline(.7); gbGlow(() => { ctx.fillStyle = 'rgba(110,230,150,.5)'; circle(19, 0, 3.4); ctx.fill(); }); } // a green stone, the color of his eyes
    else { ctx.fillStyle = C(tier === 4 ? '#E8C8FF' : '#FFE0D0'); circle(19, 0, 1.6); ctx.fill(); }
  }
  if (pose.glow) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .5; ctx.fillStyle = pose.glow; rrect(16, -8, len + 12, 16, 7); ctx.fill(); ctx.restore(); }
  if (!pose.noHand) gripHand(pose.glove || '#2E2C36');
}
