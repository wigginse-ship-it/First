// ---------- arrows: a short bow on his back and a quiver of at most five ----------
// Not a weapon of its own: any time, he can draw and loose one. Arrows are rare (only archers, gunners and other
// shooters carry them), so each is strong enough to drop an ordinary foe, can crit, and flies straight into the first
// thing in its way. The forge can improve them: each level is a better arrow, and looks it.
const ARROW_MAX = 5;
const ARROW_TIERS = [
  { name: 'Ash Arrows', dmg: 58, crit: 0, pierce: 0, blast: 0, desc: 'Plain ash shafts and goose fletching.' },
  { name: 'Barbed Steel', dmg: 70, crit: .12, pierce: 0, blast: 0, desc: 'Barbed steel heads: harder hits and more criticals.' },
  { name: 'Silver Broadheads', dmg: 84, crit: .15, pierce: 1, blast: 0, desc: 'Broad silver heads that punch through the first foe into a second.' },
  { name: 'Rune Arrows', dmg: 98, crit: .18, pierce: 1, blast: 46, desc: 'Runes cut in the shaft burst on impact, catching whoever stands close.' },
  { name: 'Starfall Arrows', dmg: 116, crit: .28, pierce: 2, blast: 60, desc: 'Fletched with light: each one falls like a star and goes through three.' },
];
const aTier = () => ARROW_TIERS[Math.min(ARROW_TIERS.length, save.alv || 1) - 1];
const arrowCost = (lvl) => ({ s: Math.round([0, 200, 400, 700, 1100][lvl] * (1 + .5 * (save.cycle || 0))), g: Math.round([0, 3, 5, 8, 12][lvl] * (1 + .5 * (save.cycle || 0))) }); // a better arrow is dear, but within reach
function maybeDropArrow(e) {
  if (!e.def.ranged || e.boss || (save.arrows || 0) + loot.filter(k => k.kind === 'arrow').length >= ARROW_MAX) return;
  if (Math.random() < (e.elite || e.champ ? .25 : .08)) loot.push(makeLoot('arrow', e.x, e.y, 1));
}
function gainArrow() {
  save.arrows = Math.min(ARROW_MAX, (save.arrows || 0) + 1); persist();
  floatText(P.x, P.y, 80, '+ARROW', '#E8D8B0', 13); refreshArrows();
}
function startShoot() {
  if (!(save.arrows > 0)) { floatText(P.x, P.y, 80, 'NO ARROWS', 'rgba(220,210,200,.85)', 12); return; }
  if (Math.abs(input.mx) > .3) P.facing = Math.sign(input.mx);
  P.state = 'shoot'; P.t = 0; P.charge = 0; P.drawing = true; P.aim = 0; P.full = false; P.seq = ''; P.vx = 0; sfx('swing', .3);
}
// hold the bow button to keep the arrow drawn: up and down aim it, and the longer it's held the harder it flies
// (a full draw, about .7s, is the arrow's whole strength; a snap shot has 40% of it). Let go to loose.
function updateShoot(dt) {
  if (P.drawing) {
    P.charge = Math.min(1, P.charge + dt / .7);
    if (P.full) P.sinceFull += dt;
    if (P.charge >= 1 && !P.full) { P.full = true; P.sinceFull = 0; sfx('charge', 2); burst(P.x + P.facing * 26, P.y, P.z + 40, ['#FFF0C0', '#FFFFFF'], 8, 'spark'); }
    if (Math.abs(input.mx) > .4) P.facing = Math.sign(input.mx);
    P.aim += (clamp(-input.my, -1, 1) * (input.my < 0 ? .6 : .35) - P.aim) * Math.min(1, dt * 8);
    if (pressed.dodge) { P.drawing = false; startDodge(); return; } // let the string down and dodge: the arrow is kept
    if (!input.shoot) loose();
    return;
  }
  P.t += dt;
  if (P.t >= .22) P.state = P.z > 0 ? 'jump' : 'idle';
}
// the bow's eye: the foe the arrow is loosed at. Ahead of him in his lane; if he is aiming up or down, the one nearest that line
function arrowTarget(z0) {
  let best = null, bs = 1e9;
  for (const e of enemies) { if (e.dead || e.state === 'dying' || e.state === 'enter') continue; // (not one still on its way in)
    const dx = (e.x - P.x) * P.facing; if (dx < 8 || dx > 640 || Math.abs(e.y - P.y) > 44 + e.hw * .3) continue;
    const off = Math.abs(Math.atan2(e.z + e.hh * .5 - z0, dx) - P.aim); if (Math.abs(P.aim) > .12 && off > .45) continue; // aimed: only what lies near the line
    const s = Math.abs(P.aim) > .12 ? off * 400 + dx * .2 : dx + Math.abs(e.y - P.y) * 3; if (s < bs) { bs = s; best = e; } }
  return best;
}
// in flight the arrow bends gently onto its foe: up to a flier's body, down to a crab or a slime, across into its lane
function steerArrow(p, dt) {
  const e = p.tgt; if (!e || e.dead) return;
  const dx = (e.x - p.x) * Math.sign(p.vx); if (dx < -e.hw) { p.tgt = null; return; } // gone past it
  const t = Math.max(.04, (dx + 4) / Math.abs(p.vx)), k = Math.min(1, dt * 14);
  p.vz += ((Math.max(0, e.z) + e.hh * .5 - p.z) / t - p.vz) * k; p.vy = (p.vy || 0) + (clamp((e.y - p.y) / t, -260, 260) - (p.vy || 0)) * k;
}
function loose() {
  P.drawing = false; P.t = 0; save.arrows--; persist(); refreshArrows();
  const T = aTier(), lvl = Math.min(5, save.alv || 1), k = P.charge, sp = 520 + 320 * k;
  const perfect = P.full && P.sinceFull < .12; // let go the instant the draw is full: a perfect release always crits
  if (perfect) { floatText(P.x, P.y, 96, 'PERFECT', '#FFE08A', 15); flashT = .06; burst(P.x + P.facing * 28, P.y, P.z + 40, ['#FFE08A', '#FFFFFF'], 14, 'spark', P.facing, true); }
  projs.push({ owner: 'p', arrow: lvl, x: P.x + P.facing * 22, y: P.y, z: Math.max(30, P.z + 40), vx: P.facing * sp * Math.cos(P.aim), vz: sp * Math.sin(P.aim),
    dmg: Math.round(T.dmg * worldDiff().hp * (.4 + .6 * k) * (perfect ? 1.15 : 1) * (1 + gearStat('arrow'))), perfect, life: 1.3, hit: new Set(), tgt: arrowTarget(Math.max(30, P.z + 40)), pierce: k >= 1 ? T.pierce : 0, crit: T.crit + (k >= 1 ? .1 : 0), blast: k >= 1 ? T.blast : T.blast * .5, full: k >= 1 });
  sfx('shoot'); P.vx = -P.facing * (40 + 60 * k);
}
// while drawn: a faint line along the shot, brightening to gold at full strength
function drawAimLine() {
  if (P.state !== 'shoot' || !P.drawing) return;
  const x0 = P.x + P.facing * 24, z0 = Math.max(30, P.z + 40), c = Math.cos(P.aim), s = Math.sin(P.aim), full = P.charge >= 1;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.setLineDash([4, 6]); ctx.lineWidth = full ? 1.6 : 1;
  const perfectNow = full && P.sinceFull < .12; // the window: the line flares white-gold for an instant
  ctx.strokeStyle = perfectNow ? 'rgba(255,250,220,1)' : full ? 'rgba(255,220,140,.7)' : `rgba(240,230,210,${.15 + .35 * P.charge})`; if (perfectNow) ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.moveTo(x0, P.y - z0); ctx.lineTo(x0 + P.facing * c * 150, P.y - z0 - s * 150); ctx.stroke(); ctx.restore();
}
// an arrow in flight strikes the first foe in its path (returns true when it is spent)
function arrowHit(p) {
  let best = null, bd = 1e9;
  for (const e of enemies) {
    if (e.dead || p.hit.has(e)) continue;
    const dx = (e.x - p.x) * Math.sign(p.vx);
    if (dx < -e.hw - 6 || dx > e.hw + 16 || Math.abs(e.y - p.y) > 24 + e.hw * .3 || p.z < e.z - 12 || p.z > e.z + e.hh + 16) continue; // (a little forgiving: an arrow that grazes a foe takes it)
    if (dx < bd) { bd = dx; best = e; }
  }
  if (!best) return false;
  p.hit.add(best); if (best === p.tgt) p.tgt = null;
  const wasDead = best.dead;
  strike(best, p.dmg, Math.sign(p.vx), { dmg: p.dmg, kb: 300, launch: 120, power: 2, arrow: 1, crit: p.perfect || Math.random() < .08 + p.crit * .7 });
  if (best.dead && !wasDead) { // the killing arrow stays in the body, where it went in (in the foe's own frame: x along its facing, up negative)
    const sc = best.boss ? best.size || 1 : best.champ ? 1.3 : 1, f = best.facing || 1;
    (best.arrows = best.arrows || []).push({ x: clamp((p.x - best.x) * f / sc, -best.hw * .5, best.hw * .5), y: clamp(-(p.z - best.z) / sc, -best.hh * .92, -best.hh * .12),
      a: Math.atan2(-(p.vz || 0), Math.abs(p.vx)), d: Math.sign(p.vx) * f, lvl: p.arrow || 1 });
  }
  burst(best.x, best.y, p.z, ['#FFFFFF', '#E8D8B0'], 8, 'spark', Math.sign(p.vx));
  if (p.blast) { // rune and starfall arrows burst where they land
    fx.push({ kind: 'ring', x: best.x, y: best.y, z: 4, t: .35, max: .35, r: p.blast * 1.4, col: p.arrow >= 5 ? '#E8E0FF' : '#9FE8F0', flat: 1 });
    for (const o of enemies) if (o !== best && !o.dead && Math.hypot(o.x - best.x, (o.y - best.y) * 2) < p.blast) strike(o, p.dmg * .4, Math.sign(o.x - best.x) || 1, { dmg: p.dmg * .4, kb: 220, launch: 160, power: 1, arrow: 1 });
  }
  if (p.pierce > 0) { p.pierce--; return false; }
  return true;
}
// what an arrow looks like at each level: in flight, on the ground, on its forge card and stuck in the fallen.
// Each level is a finer arrow: ash with barred goose feathers and a lashed iron leaf; walnut, crimson-on-black vanes and
// a twice-barbed steel head; a sapphire-lacquered shaft ringed in gold, blue-and-white fletching and a vented silver
// broadhead; an ebony shaft whose cut runes pulse, teal-and-violet vanes and a faceted crystal point; a midnight shaft
// wound with gold and set with stars, iridescent plumes and a star-forged tip that twinkles. The light in them is small
// and crisp (never a halo), and is left off under FLASH or TINT, when only the silhouette is wanted.
const ARROW_TIP = [8, 10, 11, 11.5, 12.5]; // how far ahead of the shaft's end each head reaches
function arrowVane(x0, x1, s, h) { // the path of one feather vane, tail (x0) to front (x1), above (s -1) or below (s 1) the shaft
  ctx.beginPath(); ctx.moveTo(x1, s * .5); ctx.quadraticCurveTo(x0 + (x1 - x0) * .45, s * h * 1.08, x0 + .6, s * h);
  ctx.lineTo(x0 - 1.4, s * h * .78); ctx.lineTo(x0, s * .5); ctx.closePath();
}
function arrowStar(x, y, r, ri, n = 4, rot = 0) { // an n-pointed star's path
  ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = rot + i / (n * 2) * TAU, q = i % 2 ? ri : r; ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } ctx.closePath();
}
function runePath(x, g) { // one of four cut runes, centred at (x, 0), about 1.8 by 2.4
  ctx.beginPath();
  if (g === 0) { ctx.moveTo(x - .8, 1.1); ctx.lineTo(x - .8, -1.1); ctx.lineTo(x + .8, 0); ctx.lineTo(x - .8, .4); }
  else if (g === 1) { ctx.moveTo(x - .8, -1.1); ctx.lineTo(x + .8, 1.1); ctx.moveTo(x - .8, 1.1); ctx.lineTo(x + .8, -1.1); }
  else if (g === 2) { ctx.moveTo(x + .8, -1.1); ctx.lineTo(x - .7, 0); ctx.lineTo(x + .8, 1.1); ctx.moveTo(x - .9, -1.1); ctx.lineTo(x - .9, 1.1); }
  else { ctx.moveTo(x, -1.2); ctx.lineTo(x + .9, 0); ctx.lineTo(x, 1.2); ctx.lineTo(x - .9, 0); ctx.closePath(); }
}
function arrowBand(x, w, col, h = 1.25) { ctx.beginPath(); ctx.rect(x, -h, w, h * 2); ctx.fillStyle = C(col); ctx.fill(); outline(.35); } // a ring, lashing or ferrule round the shaft
function arrowHead(pts, top, bot) { // a symmetric head from its upper outline (x, y pairs from the point back): lit above, shadowed below
  ctx.beginPath(); ctx.moveTo(pts[0], 0); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], -pts[i + 1]); ctx.lineTo(pts[pts.length - 2], 0); ctx.closePath(); ctx.fillStyle = C(top); ctx.fill();
  ctx.beginPath(); ctx.moveTo(pts[0], 0); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.lineTo(pts[pts.length - 2], 0); ctx.closePath(); ctx.fillStyle = C(bot); ctx.fill();
  ctx.beginPath(); ctx.moveTo(pts[0], 0); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], -pts[i + 1]); for (let i = pts.length - 2; i >= 2; i -= 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); outline(.6);
}
function drawArrowShape(lvl, len = 30) {
  lvl = Math.max(1, Math.min(5, lvl | 0 || 1));
  const fine = !FLASH && !TINT, t = performance.now() / 1000, L = len;
  const fb = -L + 1.2, ff = -L + Math.max(7.5, L * .37); // the fletching's tail and front
  ctx.save(); ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
  // the shaft, with a lit edge along its top
  const SH = [['#B8945E', '#E6CC98'], ['#5E3C2A', '#9A6A4E'], ['#24398A', '#6A88E0'], ['#211A2E', '#54426E'], ['#1C1848', '#5650B0']][lvl - 1], thick = lvl >= 4 ? 1.8 : 1.5;
  ctx.beginPath(); ctx.moveTo(-L - .5, 0); ctx.lineTo(0, 0); ctx.strokeStyle = C(OUT); ctx.lineWidth = thick + 1.3; ctx.stroke();
  ctx.strokeStyle = C(SH[0]); ctx.lineWidth = thick; ctx.stroke();
  if (fine) { ctx.strokeStyle = SH[1]; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(-L, -thick * .28); ctx.lineTo(-1, -thick * .28); ctx.stroke(); }
  // what is set in the shaft
  if (lvl === 2) { arrowBand(ff + 1, .8, '#A8AEBA'); arrowBand(ff + 2.6, .8, '#A8AEBA'); }
  else if (lvl === 3) { for (const x of [ff + 1, -L * .48, -5.2]) arrowBand(x, 1, '#E8C060', 1.2); if (fine) { ctx.fillStyle = '#F4F6FF'; for (const x of [ff + 1, -L * .48, -5.2]) ctx.fillRect(x + .2, -1, .5, .7); } }
  else if (lvl === 4) { // runes cut in the ebony, their light running up the shaft toward the head
    arrowBand(ff + .6, 1, '#C89A3A', 1.2);
    const x0 = ff + 2.6, n = Math.max(2, Math.floor((-3.6 - x0) / 3.3));
    for (let i = 0; i < n; i++) { const x = x0 + i * 3.3 + 1;
      runePath(x, i % 4);
      ctx.strokeStyle = C('#4FC8DC'); ctx.lineWidth = .7; ctx.stroke();
      if (fine) { const b = .5 + .5 * Math.sin(t * 7 - i * 1.2); if (b > .45) { ctx.globalAlpha = Math.min(1, (b - .45) * 2.2); ctx.strokeStyle = '#E8FFFF'; ctx.lineWidth = .5; ctx.stroke(); ctx.globalAlpha = 1; } } }
  } else if (lvl === 5) { // a gold wire wound round it, and little stars set between the turns
    ctx.beginPath(); for (let x = ff + 1; x < -4; x += 2.4) { ctx.moveTo(x, 1.1); ctx.lineTo(x + 1.3, -1.1); }
    ctx.strokeStyle = C('#F0C860'); ctx.lineWidth = .6; ctx.stroke();
    if (fine) for (let i = 0, x = ff + 3.6; x < -6; x += 7.2, i++) { const b = .55 + .45 * Math.sin(t * 5 + i * 2.1); ctx.globalAlpha = b; ctx.fillStyle = '#FFFFFF'; arrowStar(x, 0, .9 + .5 * b, .25); ctx.fill(); ctx.globalAlpha = 1; }
  }
  // the fletching
  if (lvl === 1) { // goose feathers, grey-barred, lashed with red thread
    for (const s of [-1, 1]) { arrowVane(fb, ff, s, 3.4); ctx.fillStyle = C('#DCD3C2'); ctx.fill();
      if (fine) { ctx.save(); ctx.clip(); ctx.strokeStyle = '#7A6048'; ctx.lineWidth = .9; ctx.beginPath(); for (let x = fb + 1; x < ff - 1; x += (ff - fb) / 3.6) { ctx.moveTo(x, 0); ctx.lineTo(x - 1.6, s * 4); } ctx.stroke(); ctx.restore(); }
      arrowVane(fb, ff, s, 3.4); outline(.5); }
    arrowBand(ff - .4, 1.5, '#B4382C', 1.1); arrowBand(-3.6, 1.4, '#B4382C', 1.1);
  } else if (lvl === 2) { // black vanes with crimson vanes laid over them and a white edge
    for (const s of [-1, 1]) { arrowVane(fb - 1, ff, s, 4.1); ctx.fillStyle = C('#2A2630'); ctx.fill(); outline(.5);
      ctx.save(); ctx.clip(); ctx.fillStyle = C('#F0E8E0'); ctx.beginPath(); ctx.moveTo(fb - 3, 0); ctx.lineTo(fb + 1.4, 0); ctx.lineTo(fb - .4, s * 5); ctx.lineTo(fb - 3, s * 5); ctx.fill(); ctx.restore(); // white tips
      arrowVane(fb - 1, ff, s, 4.1); outline(.5);
      arrowVane(fb + 1.4, ff - .6, s, 2.7); ctx.fillStyle = C('#C8303A'); ctx.fill(); outline(.4); }
    ctx.fillStyle = C('#C8303A'); ctx.fillRect(fb + 1, -.5, ff - fb - 2, 1);
  } else if (lvl === 3) { // sapphire vanes, white ones over them with blue bars, a gold quill between
    for (const s of [-1, 1]) { arrowVane(fb - 1.6, ff, s, 4.5); ctx.fillStyle = C('#3460D0'); ctx.fill(); outline(.5);
      arrowVane(fb + .8, ff - 1, s, 3.1); ctx.fillStyle = C('#F2F4FA'); ctx.fill();
      if (fine) { ctx.save(); ctx.clip(); ctx.strokeStyle = '#4A78E0'; ctx.lineWidth = .8; ctx.beginPath(); for (const u of [.3, .62]) { const x = fb + .8 + (ff - fb - 1.8) * u; ctx.moveTo(x, 0); ctx.lineTo(x - 1.4, s * 3.6); } ctx.stroke(); ctx.restore(); }
      arrowVane(fb + .8, ff - 1, s, 3.1); outline(.4); }
    ctx.fillStyle = C('#E8C060'); ctx.fillRect(fb, -.45, ff - fb - 1, .9);
  } else if (lvl === 4) { // teal vanes edged with rune-light, violet ones over them
    for (const s of [-1, 1]) { arrowVane(fb - 1.6, ff, s, 4.7); ctx.fillStyle = C('#22A8B8'); ctx.fill(); outline(.5);
      if (fine) { ctx.strokeStyle = '#C8FFFF'; ctx.lineWidth = .45; ctx.beginPath(); ctx.moveTo(ff - 1.5, s * 1.4); ctx.quadraticCurveTo(fb + (ff - fb) * .45, s * 4.6, fb - .6, s * 4.2); ctx.stroke(); }
      arrowVane(fb + .6, ff - .8, s, 3.2); ctx.fillStyle = C('#6C48D0'); ctx.fill(); outline(.4); }
    ctx.fillStyle = C('#9A78F0'); ctx.fillRect(fb, -.45, ff - fb - 1, .9);
  } else { // iridescent plumes, three deep, their colours slowly turning
    const sw = fine ? Math.sin(t * 1.8) * 18 : 0;
    const cols = fine ? [`hsl(${262 + sw},82%,62%)`, `hsl(${320 + sw},85%,68%)`, `hsl(${44 + sw * .5},100%,70%)`] : ['#7C4CF0', '#F068C0', '#FFD266'];
    for (const s of [-1, 1]) {
      arrowVane(fb - 3, ff, s, 5.2); ctx.fillStyle = C(cols[0]); ctx.fill(); outline(.5);
      arrowVane(fb - 1.4, ff - 1, s, 3.8); ctx.fillStyle = C(cols[1]); ctx.fill(); outline(.4);
      arrowVane(fb + .2, ff - 2, s, 2.4); ctx.fillStyle = C(cols[2]); ctx.fill(); outline(.35);
      if (fine) { ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = .4; ctx.beginPath(); ctx.moveTo(ff - 1.5, s * 1.6); ctx.quadraticCurveTo(fb - 3 + (ff - fb + 3) * .45, s * 5.1, fb - 2.4, s * 5.1); ctx.stroke(); }
    }
    ctx.fillStyle = C('#FFE08A'); ctx.fillRect(fb - 1, -.45, ff - fb, .9);
  }
  // the nock
  ctx.beginPath(); ctx.rect(-L - 2.2, -1.2, 2.4, 2.4); ctx.fillStyle = C(['#6A4A2E', '#B8BEC8', '#D8DEE8', '#C89A3A', '#FFD266'][lvl - 1]); ctx.fill(); outline(.4);
  ctx.fillStyle = C(OUT); ctx.fillRect(-L - 2.3, -.35, 1.2, .7);
  // the head
  if (lvl === 1) { // a hand-forged iron leaf with a ridge down it
    arrowHead([8, 0, 5.5, 1.9, 2.5, 2.4, .2, 1.6, -1.2, 1], '#A6AEBE', '#6E7486');
    if (fine) { ctx.strokeStyle = '#E2E8F0'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(-.6, -.15); ctx.lineTo(7, -.15); ctx.stroke(); }
  } else if (lvl === 2) { // a steel spike with two pairs of swept barbs
    arrowBand(-3.4, 1, '#C8303A', 1.1); arrowBand(-2.4, 2.2, '#9AA0AE', 1.15);
    arrowHead([10, 0, 4, 1.9, 1.3, 3.9, 2.6, 1.35, .6, 1.5, -.9, 3.1, .3, 1.05, -1.4, 1], '#C4CAD6', '#7E8494');
    if (fine) { ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(9.4, -.25); ctx.lineTo(4, -1.7); ctx.lineTo(1.6, -3.5); ctx.stroke(); }
  } else if (lvl === 3) { // a wide silver broadhead, vented, with a gold ridge
    arrowBand(-3.6, 3, '#D8DEE8', 1.2);
    arrowHead([11, 0, 6, 2.6, 1.8, 4.5, -.9, 4.9, 1, 1.4, -1.6, 1.2], '#EEF1F7', '#A4ACC0');
    ctx.fillStyle = C('#2A2440'); for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(5.6, s * .95); ctx.lineTo(2.7, s * 2.6); ctx.lineTo(2.5, s * .95); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = C('#E8C060'); ctx.lineWidth = .75; ctx.beginPath(); ctx.moveTo(-1.4, 0); ctx.lineTo(9.6, 0); ctx.stroke();
    if (fine) { ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(10.4, -.3); ctx.lineTo(6, -2.35); ctx.lineTo(2.2, -4.2); ctx.stroke(); }
  } else if (lvl === 4) { // a faceted crystal point in a gold collar
    arrowBand(-3, 2.6, '#C89A3A', 1.35);
    const P4 = [11.5, 0, 6, 2.9, .6, 2.5, -1.4, 0];
    ctx.beginPath(); ctx.moveTo(11.5, 0); ctx.lineTo(6, -2.9); ctx.lineTo(.6, -2.5); ctx.lineTo(-1.4, 0); ctx.closePath(); ctx.fillStyle = C('#BFF8FF'); ctx.fill();
    ctx.beginPath(); ctx.moveTo(11.5, 0); ctx.lineTo(6, 2.9); ctx.lineTo(.6, 2.5); ctx.lineTo(-1.4, 0); ctx.closePath(); ctx.fillStyle = C('#2E98B8'); ctx.fill();
    ctx.beginPath(); ctx.moveTo(11.5, 0); ctx.lineTo(6, -.9); ctx.lineTo(.6, -.8); ctx.lineTo(-1.4, 0); ctx.lineTo(.6, .8); ctx.lineTo(6, .9); ctx.closePath(); ctx.fillStyle = C('#6FDCEE'); ctx.fill();
    ctx.beginPath(); for (let i = 0; i < P4.length; i += 2) ctx.lineTo(P4[i], -P4[i + 1]); for (let i = P4.length - 4; i >= 2; i -= 2) ctx.lineTo(P4[i], P4[i + 1]); ctx.closePath(); outline(.6);
    if (fine) { const u = (t * .9) % 1.6; if (u < 1) { const x = .8 + u * 9.5, h = x < 6 ? 2.5 + (x - .6) / 5.4 * .4 : 2.9 * (11.5 - x) / 5.5; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(x - .3, -.9); ctx.lineTo(x + .4, -h * .85); ctx.stroke(); } } // a glint crossing the facet
  } else { // star-forged: a long gold spike rising from a star, with a twinkle at its point
    arrowBand(-3.8, 1.6, '#E8B84A', 1.3);
    arrowHead([12.5, 0, 3.4, 1.5, 1.4, 1.1], '#FFF2C0', '#E0A840');
    arrowStar(2.6, 0, 4.6, 1.25, 4); ctx.fillStyle = C('#FFD86A'); ctx.fill(); outline(.55);
    arrowStar(2.6, 0, 2.7, .9, 4, TAU / 8); ctx.fillStyle = C('#FFF6D8'); ctx.fill(); outline(.35);
    if (fine) {
      ctx.fillStyle = '#FFFFFF'; circle(2.6, 0, .75); ctx.fill();
      ctx.fillStyle = '#B48CFF'; ctx.fillRect(-3.4, -.5, .9, 1); // a violet stone in the collar
      const k = Math.pow(Math.max(0, Math.sin(t * 3.4)), 6); if (k > .05) { ctx.globalAlpha = k; ctx.fillStyle = '#FFFFFF'; arrowStar(12.5, 0, 1 + 2.6 * k, .3, 4, t * .8); ctx.fill(); ctx.globalAlpha = 1; }
    }
  }
  ctx.restore();
}
// the light an arrow leaves behind in flight, behind its fletching: speed lines for plain arrows, a silver streak,
// twin rune ribbons that weave, a tapering starfall ribbon shedding sparks. Thin and crisp, never a glow.
function drawArrowTrail(p) {
  if (FLASH || TINT) return;
  const lv = Math.max(1, Math.min(5, p.arrow | 0 || 1)), t = performance.now() / 1000, ph = (p.x || 0) * .07, x0 = -31, len = p.full ? 1 : .75;
  ctx.save(); ctx.lineCap = 'round';
  if (lv <= 2) {
    if (!p.full && lv === 1) { ctx.restore(); return; }
    ctx.lineWidth = .8; ctx.strokeStyle = 'rgba(255,248,232,.38)'; ctx.beginPath(); ctx.moveTo(x0 - 3, -2.6); ctx.lineTo(x0 - 3 - 30 * len, -2.6); ctx.moveTo(x0 - 6, 2.6); ctx.lineTo(x0 - 6 - 22 * len, 2.6); ctx.stroke();
    if (lv === 2) { ctx.strokeStyle = 'rgba(210,50,60,.5)'; ctx.beginPath(); ctx.moveTo(x0 - 2, 0); ctx.lineTo(x0 - 2 - 26 * len, 0); ctx.stroke(); }
  } else if (lv === 3) {
    const g = ctx.createLinearGradient(x0, 0, x0 - 70 * len, 0); g.addColorStop(0, 'rgba(240,244,255,.65)'); g.addColorStop(1, 'rgba(240,244,255,0)');
    ctx.fillStyle = g; ctx.fillRect(x0 - 70 * len, -.7, 70 * len, 1.4);
    ctx.lineWidth = .7; ctx.strokeStyle = 'rgba(90,130,240,.45)'; ctx.beginPath(); ctx.moveTo(x0 - 2, -3); ctx.lineTo(x0 - 2 - 34 * len, -3); ctx.moveTo(x0 - 2, 3); ctx.lineTo(x0 - 2 - 34 * len, 3); ctx.stroke();
  } else if (lv === 4) { // two ribbons, cyan and violet, weaving round each other
    const n = 14, span = 72 * len;
    for (const [s, col] of [[1, '127,232,248'], [-1, '150,110,240']]) {
      ctx.lineWidth = 1.1; let px = x0, py = 0;
      for (let i = 1; i <= n; i++) { const u = i / n, x = x0 - u * span, y = s * 2.8 * Math.min(1, u * 2.2) * Math.sin(u * 8 - t * 14 + ph);
        ctx.strokeStyle = `rgba(${col},${(.75 * (1 - u)).toFixed(3)})`; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke(); px = x; py = y; }
    }
    ctx.fillStyle = '#D8FFFF'; for (let i = 0; i < 3; i++) { const d = (t * 95 + i * 24 + ph * 9) % 66, a = 1 - d / 66; ctx.globalAlpha = a; ctx.fillRect(x0 - 4 - d, Math.sin(d * .2 + i) * 3 - .6, 1.2, 1.2); } // rune sparks
  } else { // a tapering ribbon, gold to rose to violet, and little stars falling from it
    const n = 12, span = 92 * len, top = [], bot = [];
    for (let i = 0; i <= n; i++) { const u = i / n, x = x0 + 2 - u * span, y = 1.8 * u * Math.sin(u * 6 - t * 10 + ph), w = 1.7 * (1 - u) + .15; top.push(x, y - w); bot.push(x, y + w); }
    ctx.beginPath(); ctx.moveTo(top[0], top[1]); for (let i = 2; i < top.length; i += 2) ctx.lineTo(top[i], top[i + 1]); for (let i = bot.length - 2; i >= 0; i -= 2) ctx.lineTo(bot[i], bot[i + 1]); ctx.closePath();
    const g = ctx.createLinearGradient(x0, 0, x0 - span, 0); g.addColorStop(0, 'rgba(255,232,150,.9)'); g.addColorStop(.35, 'rgba(255,120,200,.7)'); g.addColorStop(.7, 'rgba(140,100,255,.45)'); g.addColorStop(1, 'rgba(120,90,255,0)');
    ctx.fillStyle = g; ctx.fill();
    for (let i = 0; i < 4; i++) { const d = (t * 80 + i * 21 + ph * 9) % 80, a = 1 - d / 80; ctx.globalAlpha = a; ctx.fillStyle = i % 2 ? '#FFFFFF' : '#FFE08A'; arrowStar(x0 - 6 - d, (i % 2 ? -1 : 1) * (1.5 + d * .06), 1.6 * a + .5, .35); ctx.fill(); }
  }
  ctx.restore();
}
function drawArrowProj(p) {
  const ang = Math.atan2(p.vz || 0, Math.abs(p.vx));
  const x = p.x, y = p.y - p.z;
  ctx.save(); shadow(p.x, p.y, 4); ctx.translate(x, y); ctx.scale(Math.sign(p.vx), 1); ctx.rotate(-ang);
  drawArrowTrail(p); // its streak of light
  drawArrowShape(p.arrow); ctx.restore();
}
function drawArrowLoot(k, t) { // an arrow stuck in the ground, a glint winking at its point
  const x = k.x, y = k.y - k.z, lv = Math.min(5, save.alv || 1), tip = ARROW_TIP[lv - 1];
  shadow(k.x, k.y, 5);
  ctx.save(); ctx.translate(x, y - 4); ctx.rotate(-1.1); drawArrowShape(lv, 22);
  if (!FLASH && !TINT) { const a = .35 + .65 * Math.pow(.5 + .5 * Math.sin(t * 4 + k.x), 3); ctx.globalAlpha = a; ctx.fillStyle = ['#FFF0C0', '#FFFFFF', '#FFFFFF', '#D8FFFF', '#FFF2B0'][lv - 1];
    arrowStar(tip, 0, 1.6 + 1.8 * a, .35, 4, 1.1 + t * .6); ctx.fill(); }
  ctx.restore();
}
// the short bow, drawn in his hand while he looses
function drawShortBow(pose) {
  const k = pose.draw || 0;
  ctx.save(); ctx.translate(-9.5, 0); // (the riser sits in his fist)
  ctx.strokeStyle = C('#5A3A22'); ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(10, 0, 15, -1.2, 1.2); ctx.stroke(); outline(.1);
  ctx.strokeStyle = C('#E8E0D0'); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(10 + Math.cos(-1.2) * 15, Math.sin(-1.2) * 15); ctx.lineTo(10 - k * 10, 0); ctx.lineTo(10 + Math.cos(1.2) * 15, Math.sin(1.2) * 15); ctx.stroke();
  if (k > 0 && k < 1) { ctx.save(); ctx.translate(26, 0); drawArrowShape(Math.min(5, save.alv || 1), 18 + k * 8); ctx.restore(); }
  ctx.restore();
  gripHand(pose.glove || '#2E2C36'); // (its fingers wrapped round the riser: GRIP is turned across for the bow)
}
// the quiver count on the HUD, and the BOW button on touch screens
let arrowHudEl = null;
function refreshArrows() {
  if (!arrowHudEl) { // a row of arrows under the health and Trump bars
    const bars = document.querySelector('.hud-l .bars'); if (!bars) return;
    arrowHudEl = document.createElement('div'); arrowHudEl.id = 'arrowHud'; arrowHudEl.title = 'Arrows';
    arrowHudEl.style.cssText = 'display:flex;gap:3px;align-items:center;height:12px;margin:3px 0 1px;pointer-events:none;filter:drop-shadow(0 1px 1px #000)';
    bars.insertBefore(arrowHudEl, document.getElementById('wname'));
  }
  const n = save.arrows || 0; arrowHudEl.hidden = n <= 0;
  const icon = '<svg width="22" height="10" viewBox="0 0 22 10" aria-hidden="true"><line x1="3" y1="5" x2="17" y2="5" stroke="#E8D8B0" stroke-width="1.6"/><path d="M15 1.6 L21 5 L15 8.4 Z" fill="#C8CEDA" stroke="#2A1B2C" stroke-width=".6"/><path d="M1 1.6 L5 5 L1 8.4 M3.4 1.6 L7.4 5 L3.4 8.4" fill="none" stroke="#D8AA55" stroke-width="1.1"/></svg>';
  arrowHudEl.innerHTML = icon.repeat(n);
  const b = document.getElementById('shootBtn'); if (b) { b.hidden = false; b.innerHTML = '<span>BOW<br>' + n + '</span>'; b.style.filter = n ? '' : 'grayscale(1) brightness(.6)'; } // always there, so you know it exists; dim when the quiver is empty
}
