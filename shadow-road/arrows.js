// ---------- arrows: a short bow on his back and a quiver of at most five ----------
// Not a weapon of its own: any time, he can draw and loose one. Arrows are rare (only archers, gunners and other
// shooters carry them) and are for picking off the crowd, not for felling bosses. The forge can improve them: each of
// the seven levels is a better arrow, looks it, and keeps every trick of the ones before while learning one of its own.
// dmg is a full draw's damage in the first world (it grows with each world as the foes do); the tricks:
// bleed (barbs: the foe bleeds a little more), pierce (through to the next foe), blast (a rune burst round the struck
// foe), split (on the first foe it breaks into falling stars that fly on), ret (an arrow that kills walks back through
// Shadow into the quiver) and chain (the Pattern's fire leaps to foes nearby). Every share of damage a trick deals goes
// through arrowVs, and each foe takes at most one share of the tricks per arrow, so nothing adds up against a boss.
const ARROW_MAX = 5;
const ARROW_TIERS = [
  { name: 'Ash Arrows', dmg: 14, crit: 0, pierce: 0, blast: 0, skill: 'A True Shot', desc: 'Plain ash shafts and goose fletching. Hold for a full draw; let go the instant it is full for a perfect shot.' },
  { name: 'Barbed Steel', dmg: 17, crit: .08, pierce: 0, blast: 0, bleed: 1, skill: 'Bleed', desc: 'Barbed steel heads tear going in: the foe bleeds for a moment after.' },
  { name: 'Silver Broadheads', dmg: 20, crit: .1, pierce: 1, blast: 0, bleed: 1, skill: 'Pierce', desc: 'Broad silver heads: at a full draw they punch through the first foe into a second.' },
  { name: 'Rune Arrows', dmg: 23, crit: .12, pierce: 1, blast: 42, bleed: 1, skill: 'Rune Burst', desc: 'Runes cut in the shaft burst on impact, catching whoever stands close.' },
  { name: 'Starfall Arrows', dmg: 27, crit: .14, pierce: 1, blast: 46, bleed: 1, split: 2, skill: 'Starsplit', desc: 'At a full draw each one breaks on the first foe into two falling stars, which fly on into the foes behind.' },
  { name: 'Shadowsteel Arrows', dmg: 30, crit: .16, pierce: 1, blast: 50, bleed: 1, split: 2, ret: 1, skill: 'Shadow-walk', desc: 'Raven-fletched and forged in Shadow: an arrow that kills walks back through Shadow into your quiver.' },
  { name: 'Pattern Arrows', dmg: 34, crit: .18, pierce: 1, blast: 54, bleed: 1, split: 2, ret: 1, chain: 2, skill: 'Pattern Fire', desc: "Lit with the Pattern's blue fire: at a full draw it leaps from the struck foe to two more nearby." },
];
const ARROW_LV = ARROW_TIERS.length;
const arrowLv = () => Math.max(1, Math.min(ARROW_LV, save.alv || 1));
// arrows are for picking off the crowd: bosses and champions shrug most of one off
const arrowVs = e => e.boss ? .15 : e.champ ? .45 : 1;
const aTier = () => ARROW_TIERS[arrowLv() - 1];
// a better arrow is dear, but within reach
const arrowCost = (lvl) => ({ s: Math.round([0, 200, 400, 700, 1100, 1500, 2000][lvl] * (1 + .5 * (save.cycle || 0))), g: Math.round([0, 3, 5, 8, 12, 15, 19][lvl] * (1 + .5 * (save.cycle || 0))) });
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
  const T = aTier(), lvl = arrowLv(), k = P.charge, sp = 520 + 320 * k, full = k >= 1;
  const perfect = P.full && P.sinceFull < .12; // let go the instant the draw is full: a perfect release always crits
  if (perfect) { floatText(P.x, P.y, 96, 'PERFECT', '#FFE08A', 15); flashT = .06; burst(P.x + P.facing * 28, P.y, P.z + 40, ['#FFE08A', '#FFFFFF'], 14, 'spark', P.facing, true); }
  projs.push({ owner: 'p', arrow: lvl, x: P.x + P.facing * 22, y: P.y, z: Math.max(30, P.z + 40), vx: P.facing * sp * Math.cos(P.aim), vz: sp * Math.sin(P.aim),
    dmg: Math.round(T.dmg * worldDiff().hp * (.4 + .6 * k) * (perfect ? 1.15 : 1) * (1 + gearStat('arrow'))), perfect, life: 1.3, hit: new Set(), splash: new Set(), tgt: arrowTarget(Math.max(30, P.z + 40)),
    pierce: full ? T.pierce : 0, crit: T.crit + (full ? .1 : 0), blast: full ? T.blast : T.blast * .5, full,
    bleed: T.bleed || 0, split: full ? T.split || 0 : 0, ret: T.ret || 0, chain: T.chain ? (full ? T.chain : 1) : 0 });
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
    if (e.dead || p.hit.has(e) || (p.shard && p.splash.has(e))) continue;
    const dx = (e.x - p.x) * Math.sign(p.vx);
    if (dx < -e.hw - 6 || dx > e.hw + 16 || Math.abs(e.y - p.y) > 24 + e.hw * .3 || p.z < e.z - 12 || p.z > e.z + e.hh + 16) continue; // (a little forgiving: an arrow that grazes a foe takes it)
    if (dx < bd) { bd = dx; best = e; }
  }
  if (!best) return false;
  p.hit.add(best); if (best === p.tgt) p.tgt = null; if (p.shard) p.splash.add(best);
  const wasDead = best.dead, dir = Math.sign(p.vx), first = !p.struck; p.struck = true;
  const ad = p.dmg * arrowVs(best);
  strike(best, ad, dir, p.shard ? { dmg: ad, kb: 140, launch: 60, power: 1, arrow: 1, crit: Math.random() < p.crit * .5 } : { dmg: ad, kb: 300, launch: 120, power: 2, arrow: 1, crit: p.perfect || Math.random() < .08 + p.crit * .7 });
  if (p.bleed && !best.dead) arrowBleed(best, p.dmg * .06 * arrowVs(best)); // barbs: it bleeds for a moment after
  const killed = best.dead && !wasDead;
  if (killed && p.ret && !p.returned && !p.shard) { // shadowsteel: the killing arrow walks back through Shadow into the quiver
    p.returned = true; save.arrows = Math.min(ARROW_MAX, (save.arrows || 0) + 1); persist(); refreshArrows();
    floatText(P.x, P.y, 92, 'ARROW RETURNS', '#C8B0F0', 12);
    for (let i = 0; i < 7; i++) parts.push({ x: best.x + rand(-6, 6), y: best.y, z: p.z + rand(-6, 6), vx: rand(-30, 30), vy: 0, vz: rand(20, 60), life: rand(.35, .55), max: .55, col: pick(['#3A2A58', '#7A5AB8', '#C8B0F0']), size: rand(2, 3.2), shape: 'puff' });
    for (let i = 0; i < 5; i++) parts.push({ x: P.x - P.facing * rand(4, 10), y: P.y, z: rand(44, 62), vx: rand(-14, 14), vy: 0, vz: rand(-10, 30), life: rand(.3, .5), max: .5, col: pick(['#7A5AB8', '#C8B0F0', '#FFFFFF']), size: rand(1.6, 2.6), shape: 'puff' });
  }
  if (killed && !p.shard && !p.returned) { // the killing arrow stays in the body, where it went in (in the foe's own frame: x along its facing, up negative)
    const sc = best.boss ? best.size || 1 : best.champ ? 1.3 : 1, f = best.facing || 1;
    (best.arrows = best.arrows || []).push({ x: clamp((p.x - best.x) * f / sc, -best.hw * .5, best.hw * .5), y: clamp(-(p.z - best.z) / sc, -best.hh * .92, -best.hh * .12),
      a: Math.atan2(-(p.vz || 0), Math.abs(p.vx)), d: dir * f, lvl: p.arrow || 1 });
  }
  burst(best.x, best.y, p.z, p.shard ? ['#FFFFFF', '#FFE08A'] : ['#FFFFFF', '#E8D8B0'], p.shard ? 5 : 8, 'spark', dir);
  if (p.shard) return true;
  const share = (o, k, m) => { if (o === best || o.dead || p.splash.has(o)) return; p.splash.add(o); const d = p.dmg * k * arrowVs(o); strike(o, d, Math.sign(o.x - best.x) || dir, Object.assign({ dmg: d, arrow: 1 }, m)); if (p.bleed && !o.dead) arrowBleed(o, p.dmg * .04 * arrowVs(o)); };
  if (p.blast) { // rune arrows and finer burst where they land
    fx.push({ kind: 'ring', x: best.x, y: best.y, z: 4, t: .35, max: .35, r: p.blast * 1.4, col: ['#9FE8F0', '#E8E0FF', '#B89AF0', '#A8D0FF'][Math.min(3, p.arrow - 4)], flat: 1 });
    for (const o of enemies) if (Math.hypot(o.x - best.x, (o.y - best.y) * 2) < p.blast) share(o, .3, { kb: 220, launch: 160, power: 1 });
  }
  if (p.chain && first) { // pattern fire: blue lightning leaps from the struck foe to the nearest others
    const cz = best.z + best.hh * .55;
    const near = enemies.filter(o => o !== best && !o.dead && !p.splash.has(o) && Math.hypot(o.x - best.x, (o.y - best.y) * 2) < 170).sort((u, v) => Math.hypot(u.x - best.x, u.y - best.y) - Math.hypot(v.x - best.x, v.y - best.y)).slice(0, p.chain);
    for (const o of near) { fx.push({ kind: 'bolt', x: best.x, y: best.y, z: cz, x2: o.x, y2: o.y, z2: o.z + o.hh * .5, t: .22, max: .22, col: '#6AA8FF', seed: Math.random() * 99 }); share(o, .35, { kb: 60, power: 0, el: 1 }); }
    if (near.length) sfx('shoot', .4);
  }
  if (p.split && first) { // starsplit: two falling stars break off and fly on, fanning out across the lanes behind
    for (let i = 0; i < p.split; i++) { const s = i % 2 ? 1 : -1;
      projs.push({ owner: 'p', arrow: p.arrow, shard: 1, x: p.x, y: p.y, z: p.z, vx: p.vx * .8, vy: s * 170, vz: 0, dmg: Math.round(p.dmg * .3), life: .5, hit: p.hit, splash: p.splash, tgt: null, pierce: 0, crit: p.crit, blast: 0, bleed: p.bleed, full: true }); }
  }
  if (p.pierce > 0) { p.pierce--; return false; }
  return true;
}
// barbs: a little more damage in drops over a second and a half (already scaled by arrowVs by the caller)
function arrowBleed(e, per) {
  if (!(per > 0)) return;
  e.bleed = 1.6; e.bleedPer = Math.max(e.bleedPer && e.bleed > 0 ? e.bleedPer : 0, per); e.bleedTick = e.bleedTick > 0 ? e.bleedTick : .4;
}
function updateBleed(e, dt) {
  e.bleed -= dt; e.bleedTick -= dt;
  if (Math.random() < dt * 9) parts.push({ x: e.x + rand(-e.hw, e.hw) * .4, y: e.y, z: e.z + e.hh * rand(.35, .7), vx: rand(-12, 12), vy: 0, vz: rand(-20, 30), life: .45, max: .45, col: pick(['#B01E2E', '#E0404A']), size: rand(1.6, 2.4), shape: 'blob' });
  if (e.bleedTick <= 0) {
    e.bleedTick = .4; const d = Math.max(1, Math.round(e.bleedPer)); e.hp -= d;
    floatText(e.x, e.y, e.z + e.hh + 6, String(d), '#E0505A', 10);
    if (e.hp <= 0) { e.bleed = 0; killEnemy(e, 1, { trump: 1 }); }
  }
  if (e.bleed <= 0) { e.bleed = 0; e.bleedPer = 0; }
}
// what an arrow looks like at each level: in flight, on the ground, on its forge card and stuck in the fallen.
// Each level is a finer arrow: ash with barred goose feathers and a lashed iron leaf; walnut, crimson-on-black vanes and
// a twice-barbed steel head; a sapphire-lacquered shaft ringed in gold, blue-and-white fletching and a vented silver
// broadhead; an ebony shaft whose cut runes pulse, teal-and-violet vanes and a faceted crystal point; a midnight shaft
// wound with gold and set with stars, iridescent plumes and a star-forged tip that twinkles; a smoke-dark shadowsteel
// shaft cut with violet chevrons, ragged raven fletching over violet and a hooked obsidian blade with a violet edge; a
// pale Pattern shaft with a blue line running its length like the Pattern's own, swan-and-sapphire vanes and a forked
// blue-white point that crackles. The light in them is small and crisp (never a halo), and is left off under FLASH or
// TINT, when only the silhouette is wanted.
const ARROW_TIP = [8, 10, 11, 11.5, 12.5, 12.5, 13]; // how far ahead of the shaft's end each head reaches
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
function ravenVane(x0, x1, s, h) { // a raven's vane, its trailing edge ragged with two notches
  ctx.beginPath(); ctx.moveTo(x1, s * .5); ctx.quadraticCurveTo(x0 + (x1 - x0) * .35, s * h * 1.1, x0 + 1.6, s * h);
  ctx.lineTo(x0 + 2.6, s * h * .7); ctx.lineTo(x0 + .2, s * h * .78); ctx.lineTo(x0 + 1.4, s * h * .46); ctx.lineTo(x0 - 1.2, s * h * .5); ctx.lineTo(x0, s * .5); ctx.closePath();
}
function chevron(x, h = 1.1) { ctx.beginPath(); ctx.moveTo(x - .9, -h); ctx.lineTo(x + .5, 0); ctx.lineTo(x - .9, h); } // a mark pointing toward the head
function shadowHead(fine, t, ph = 0) { // a hooked obsidian blade with a violet edge, in a silver collar
  arrowBand(-3.4, 2.2, '#C8CCD8', 1.25);
  arrowHead([12.5, 0, 7.4, 2, 3, 3, -.2, 3.9, 1.4, 1.25, -1.6, 1.1], '#6E5C9A', '#241C38');
  ctx.strokeStyle = C('#9A7AE0'); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(-1, 0); ctx.lineTo(10, 0); ctx.stroke(); // its violet spine
  const edge = () => { ctx.beginPath(); ctx.moveTo(12, -.2); ctx.lineTo(7.4, -1.7); ctx.lineTo(3, -2.7); ctx.lineTo(.4, -3.4); };
  edge(); ctx.strokeStyle = C('#B89AF0'); ctx.lineWidth = .55; ctx.stroke();
  if (fine) { const b = Math.max(0, Math.sin(t * 4.2 + ph)); if (b > .3) { ctx.globalAlpha = b; edge(); ctx.strokeStyle = '#F4ECFF'; ctx.lineWidth = .4; ctx.stroke(); ctx.globalAlpha = 1; } } // the edge's gleam
}
function patternHead(fine, t, ph = 0) { // a forked blue-white point: a long white blade, two blue prongs swept forward, in a sapphire collar
  arrowBand(-3.6, 2.2, '#2E6CE8', 1.3);
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(.2, s * 1.2); ctx.lineTo(3.2, s * 4.3); ctx.lineTo(7.8, s * 5.1); ctx.lineTo(4.4, s * 2.7); ctx.lineTo(4, s * 1.2); ctx.closePath(); ctx.fillStyle = C(s < 0 ? '#8FC0FF' : '#3A7AF0'); ctx.fill(); outline(.45); }
  arrowHead([13, 0, 7.4, 1.6, 2.4, 2.2, -1.6, 1.1], '#F4F8FF', '#8EAEF0');
  ctx.strokeStyle = C('#2E6CE8'); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(-1, 0); ctx.lineTo(11, 0); ctx.stroke(); // the blue fire down its middle
  if (fine) { const q = Math.pow(Math.max(0, Math.sin(t * 4.1 + ph)), 8); if (q > .08) { // now and then a crackle at its point
    ctx.globalAlpha = q; ctx.strokeStyle = '#DDEBFF'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(14.4, -1.1); ctx.lineTo(14.9, .3); ctx.lineTo(16.2, -.6); ctx.stroke(); ctx.globalAlpha = 1; } }
}
function drawArrowShape(lvl, len = 30) {
  lvl = Math.max(1, Math.min(ARROW_LV, lvl | 0 || 1));
  const fine = !FLASH && !TINT, t = performance.now() / 1000, L = len;
  const fb = -L + 1.2, ff = -L + Math.max(7.5, L * .37); // the fletching's tail and front
  ctx.save(); ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
  // the shaft, with a lit edge along its top
  const SH = [['#B8945E', '#E6CC98'], ['#5E3C2A', '#9A6A4E'], ['#24398A', '#6A88E0'], ['#211A2E', '#54426E'], ['#1C1848', '#5650B0'], ['#2A2236', '#6E5C92'], ['#C8D2EC', '#FFFFFF']][lvl - 1], thick = lvl >= 4 ? 1.8 : 1.5;
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
  } else if (lvl === 6) { // a silver ring, and violet chevrons cut in the smoke-dark steel, their light pulsing toward the head
    arrowBand(ff + .6, 1, '#C8CCD8', 1.2);
    for (let i = 0, x = ff + 3.4; x < -5; x += 3.2, i++) { chevron(x); ctx.strokeStyle = C('#8A6AD0'); ctx.lineWidth = .7; ctx.stroke();
      if (fine) { const b = .5 + .5 * Math.sin(t * 6 - i * 1.1); if (b > .5) { ctx.globalAlpha = (b - .5) * 2; ctx.strokeStyle = '#E8DCFF'; ctx.lineWidth = .45; ctx.stroke(); ctx.globalAlpha = 1; } } }
  } else if (lvl === 7) { // the Pattern's blue line running the length of the pale shaft, its fire travelling up it
    arrowBand(ff + .6, 1, '#2E6CE8', 1.2);
    const x0 = ff + 2, x1 = -4.4, wy = x => .75 * Math.sin((x - x0) * 1.05);
    ctx.beginPath(); for (let x = x0; x <= x1; x += .5) ctx.lineTo(x, wy(x)); ctx.strokeStyle = C('#2E6CE8'); ctx.lineWidth = .6; ctx.stroke();
    if (fine) { const u = (t * 1.3) % 1, xa = x0 + (x1 - x0) * u; ctx.beginPath(); for (let x = xa; x <= Math.min(x1, xa + 3); x += .5) ctx.lineTo(x, wy(x)); ctx.strokeStyle = '#E8F4FF'; ctx.lineWidth = .55; ctx.stroke(); }
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
  } else if (lvl === 6) { // ragged raven vanes over violet ones, a silver quill between
    for (const s of [-1, 1]) { arrowVane(fb - 2.2, ff, s, 5); ctx.fillStyle = C('#5A3E96'); ctx.fill(); outline(.5);
      ravenVane(fb - .6, ff - .4, s, 4.6); ctx.fillStyle = C('#1A1424'); ctx.fill(); outline(.45);
      if (fine) { ctx.strokeStyle = '#6E5C92'; ctx.lineWidth = .45; ctx.beginPath(); ctx.moveTo(ff - 1.6, s * 1.3); ctx.quadraticCurveTo(fb + (ff - fb) * .4, s * 4.4, fb + 1.2, s * 4.3); ctx.stroke(); } }
    ctx.fillStyle = C('#C8CCD8'); ctx.fillRect(fb, -.45, ff - fb - 1, .9);
  } else if (lvl === 7) { // white swan vanes, sapphire ones over them and pale ones over those, a thread of blue fire along the edge
    for (const s of [-1, 1]) { arrowVane(fb - 2.6, ff, s, 5.1); ctx.fillStyle = C('#F2F6FF'); ctx.fill(); outline(.5);
      if (fine) { ctx.strokeStyle = '#6AA8FF'; ctx.lineWidth = .45; ctx.beginPath(); const n = 6; for (let i = 0; i <= n; i++) { const u = i / n, x = ff - 1.5 - u * (ff - fb + 1); ctx.lineTo(x, s * (1.6 + 3.1 * Math.sin(u * 2.4) + (i % 2 ? -.5 : 0))); } ctx.stroke(); }
      arrowVane(fb - .8, ff - 1, s, 3.6); ctx.fillStyle = C('#3A7AF0'); ctx.fill(); outline(.4);
      arrowVane(fb + .8, ff - 2, s, 2.2); ctx.fillStyle = C('#DDEBFF'); ctx.fill(); outline(.35); }
    ctx.fillStyle = C('#2E6CE8'); ctx.fillRect(fb - 1, -.45, ff - fb, .9);
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
  ctx.beginPath(); ctx.rect(-L - 2.2, -1.2, 2.4, 2.4); ctx.fillStyle = C(['#6A4A2E', '#B8BEC8', '#D8DEE8', '#C89A3A', '#FFD266', '#C8CCD8', '#6AA8FF'][lvl - 1]); ctx.fill(); outline(.4);
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
  } else if (lvl === 6) shadowHead(fine, t);
  else if (lvl === 7) patternHead(fine, t);
  else { // star-forged: a long gold spike rising from a star, with a twinkle at its point
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
// twin rune ribbons that weave, a tapering starfall ribbon shedding sparks, wisps of shadow left hanging, a thread of
// blue Pattern lightning. Thin and crisp, never a glow.
function drawArrowTrail(p) {
  if (FLASH || TINT) return;
  const lv = Math.max(1, Math.min(ARROW_LV, p.arrow | 0 || 1)), t = performance.now() / 1000, ph = (p.x || 0) * .07, x0 = -31, len = p.full ? 1 : .75;
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
  } else if (lv === 6) { // a thin silver line, and little wisps of shadow left hanging behind it
    const span = 70 * len, g = ctx.createLinearGradient(x0, 0, x0 - span, 0); g.addColorStop(0, 'rgba(200,176,240,.6)'); g.addColorStop(1, 'rgba(200,176,240,0)');
    ctx.fillStyle = g; ctx.fillRect(x0 - span, -.6, span, 1.2);
    for (let i = 0; i < 5; i++) { const d = (t * 70 + i * 15 + ph * 9) % 72, a = 1 - d / 72; ctx.globalAlpha = a * .8; ctx.fillStyle = i % 2 ? '#3A2A58' : '#7A5AB8';
      circle(x0 - 3 - d, Math.sin(d * .15 + i * 1.7) * 2.6, .8 + d * .025); ctx.fill(); }
  } else if (lv === 7) { // a thread of blue lightning, flickering, white at its heart
    const span = 84 * len, r = mulberry(Math.floor(t * 24 + ph * 13)), pts = [];
    for (let i = 0; i <= 9; i++) { const u = i / 9; pts.push(x0 + 1 - u * span, i ? (r() - .5) * 5.4 * Math.min(1, u * 3) : 0); }
    for (const [w, col] of [[1.4, 'rgba(90,150,255,.55)'], [.6, 'rgba(235,245,255,.85)']]) { ctx.lineWidth = w; ctx.lineJoin = 'round';
      for (let i = 2; i < pts.length; i += 2) { ctx.globalAlpha = 1 - i / pts.length; ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(pts[i - 2], pts[i - 1]); ctx.lineTo(pts[i], pts[i + 1]); ctx.stroke(); } }
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
function drawStarShard(p) { // a falling star broken off a starfall arrow: a small gold star and a short tapering streak
  const x = p.x, y = p.y - p.z, d = Math.sign(p.vx), t = performance.now() / 1000;
  ctx.save(); ctx.translate(x, y); ctx.scale(d, 1); ctx.rotate(-Math.atan2(p.vy || 0, Math.abs(p.vx)) * .35);
  if (!FLASH && !TINT) { ctx.beginPath(); ctx.moveTo(-2, -1.8); ctx.lineTo(-34, 0); ctx.lineTo(-2, 1.8); ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, -34, 0); g.addColorStop(0, 'rgba(255,224,138,.85)'); g.addColorStop(.5, 'rgba(255,120,200,.45)'); g.addColorStop(1, 'rgba(140,100,255,0)'); ctx.fillStyle = g; ctx.fill(); }
  arrowStar(0, 0, 5, 1.6, 4, t * 9); ctx.fillStyle = C('#FFD86A'); ctx.fill(); outline(.6);
  arrowStar(0, 0, 2.6, .9, 4, t * 9 + TAU / 8); ctx.fillStyle = C('#FFF6D8'); ctx.fill();
  ctx.restore();
}
function drawArrowProj(p) {
  if (p.shard) { drawStarShard(p); return; }
  const ang = Math.atan2(p.vz || 0, Math.abs(p.vx));
  const x = p.x, y = p.y - p.z;
  ctx.save(); shadow(p.x, p.y, 4); ctx.translate(x, y); ctx.scale(Math.sign(p.vx), 1); ctx.rotate(-ang);
  drawArrowTrail(p); // its streak of light
  drawArrowShape(p.arrow); ctx.restore();
}
function drawArrowLoot(k, t) { // an arrow stuck in the ground, a glint winking at its point
  const x = k.x, y = k.y - k.z, lv = arrowLv(), tip = ARROW_TIP[lv - 1];
  shadow(k.x, k.y, 5);
  ctx.save(); ctx.translate(x, y - 4); ctx.rotate(-1.1); drawArrowShape(lv, 22);
  if (!FLASH && !TINT) { const a = .35 + .65 * Math.pow(.5 + .5 * Math.sin(t * 4 + k.x), 3); ctx.globalAlpha = a; ctx.fillStyle = ['#FFF0C0', '#FFFFFF', '#FFFFFF', '#D8FFFF', '#FFF2B0', '#E8DCFF', '#DDEBFF'][lv - 1];
    arrowStar(tip, 0, 1.6 + 1.8 * a, .35, 4, 1.1 + t * .6); ctx.fill(); }
  ctx.restore();
}
// ---------- the bow: one for each tier of arrow, made to match it, and longer and grander as the arrows get finer ----------
// 1 a little ash self-bow lashed with red thread, horn-nocked, a barred goose feather tied at the grip; 2 a walnut
// recurve, crimson-wrapped, banded in steel, its tips capped in steel swept back into barbs, black-and-crimson
// silencers on the string; 3 a longer sapphire composite with a silver riser, a gold ridge down its back, gold rings
// and little vented silver broadheads for tips; 4 a big ebony rune bow, its cut runes pulsing cyan, banded in gold and
// teal, tipped with faceted crystals; 5 the starfall longbow, midnight wound with gold wire and set with twinkling
// stars, a gold riser, gold star-spike finials and a plume of shifting violet, rose and gold at the grip; 6 the
// shadowsteel recurve, smoke-dark and silver-banded, violet chevrons pulsing down its limbs, a violet stone in its silver
// riser, a raven feather at the grip and hooked obsidian blades for tips; 7 the Pattern bow, the longest, pale as
// moonlit silver with the Pattern's blue line winding down each limb and its fire running along it, a sapphire riser,
// swan-and-sapphire feathers at the grip and forked blue-white points for tips.
// Each is drawn along its centreline from one tip (u -1) through the riser in his fist (u 0) to the other (u 1), in
// hand space (the arm along +x, the bow across it). The light in them is small and crisp, and left off under FLASH or TINT.
const BOW_R = 15.5; // the riser's centre in hand space: where his fist closes (gripCX 'shortbow')
const BOW_TIERS = [ // H half-length; d the limbs' sweep back at rest, p its curve, fx how much more at full draw; rc the tips' recurve
  // forward, from rs along the limb; g the riser's half-length; wr, wl, wt thickness at the riser, the limbs and the tips
  { H: 12, d: 6, p: 1.6, fx: 3.4, rc: 0, rs: .7, g: 3.4, wr: 2.9, wl: 2.5, wt: 1.3, col: ['#B8945E', '#E6CC98', '#8A6A40'], str: '#EDE4D0' },
  { H: 14.5, d: 6.2, p: 2.1, fx: 3.6, rc: 5.6, rs: .6, g: 3.8, wr: 3.4, wl: 2.7, wt: 1.4, col: ['#5E3C2A', '#9A6A4E', '#3A2416'], str: '#D8D4CC' },
  { H: 17.5, d: 6.4, p: 1.8, fx: 4.2, rc: 2.6, rs: .72, g: 4.4, wr: 3.6, wl: 2.7, wt: 1.3, col: ['#24398A', '#6A88E0', '#16245E'], str: '#F2F4FA' },
  { H: 20.5, d: 6.4, p: 1.15, fx: 4.2, rc: 0, rs: .78, g: 4.8, wr: 4.2, wl: 3.1, wt: 1.6, col: ['#211A2E', '#54426E', '#110C1A'], str: '#BFF8FF' },
  { H: 24, d: 9, p: 2, fx: 4.6, rc: 4.6, rs: .68, g: 5.2, wr: 4, wl: 3.2, wt: 1.3, col: ['#1C1848', '#5650B0', '#0E0A2C'], str: '#FFE8A8' },
  { H: 26.5, d: 9.4, p: 1.9, fx: 4.8, rc: 6, rs: .64, g: 5.4, wr: 4.3, wl: 3.3, wt: 1.3, col: ['#2A2236', '#6E5C92', '#140F1E'], str: '#D8C8F4' },
  { H: 29, d: 10, p: 1.6, fx: 5, rc: 3.6, rs: .72, g: 5.8, wr: 4.5, wl: 3.4, wt: 1.4, col: ['#C8D2EC', '#FFFFFF', '#8A96BC'], str: '#BFE0FF' },
];
function bowPos(B, u, k) {
  const a = Math.abs(u), g = B.g / B.H, s = Math.max(0, (a - g) / (1 - g)), q = Math.max(0, (s - B.rs) / (1 - B.rs));
  return [BOW_R - (B.d + B.fx * k) * Math.pow(s, B.p) + B.rc * (1 - .45 * k) * q * q, (u < 0 ? -1 : 1) * a * B.H * (1 - .04 * k), s];
}
function bowFrame(B, u, k) { // a point on the centreline: where, its tangent (t) and normal (n, toward the back), its thickness, and how far out along the limb (s)
  const [x, y, s] = bowPos(B, u, k), p0 = bowPos(B, u - .004, k), p1 = bowPos(B, u + .004, k);
  let tx = p1[0] - p0[0], ty = p1[1] - p0[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
  const w = s <= 0 ? B.wr : s < .14 ? lerp(B.wr, B.wl, s / .14) : lerp(B.wl, B.wt, Math.pow((s - .14) / .86, 1.3));
  return { x, y, tx, ty, nx: ty, ny: -tx, w, s, u };
}
const bowU = (B, s) => B.g / B.H + (1 - B.g / B.H) * s; // u at a fraction s along the limb
function bowStrip(F, o0, o1) { // the band between offsets o0 and o1 across the bow (fractions of its thickness, + toward its back)
  ctx.beginPath(); for (const p of F) ctx.lineTo(p.x + p.nx * p.w * o1, p.y + p.ny * p.w * o1);
  for (let i = F.length - 1; i >= 0; i--) { const p = F[i]; ctx.lineTo(p.x + p.nx * p.w * o0, p.y + p.ny * p.w * o0); } ctx.closePath();
}
function bowLine(F, o) { ctx.beginPath(); for (const p of F) ctx.lineTo(p.x + p.nx * p.w * o, p.y + p.ny * p.w * o); }
function bowLocal(f, fn, out = 0) { // into a frame at f: x along the limb (outward, toward its tip, if out is set), y toward the back
  const sg = out ? (f.u < 0 ? -1 : 1) : 1; ctx.save(); ctx.translate(f.x, f.y); ctx.transform(sg * f.tx, sg * f.ty, f.nx, f.ny, 0, 0); fn(); ctx.restore();
}
function bowBand(f, len, col, over = .3) { bowLocal(f, () => { ctx.beginPath(); ctx.rect(-len / 2, -f.w / 2 - over, len, f.w + over * 2); ctx.fillStyle = C(col); ctx.fill(); outline(.35); }); }
function bowTwin(B, u, k, fn) { for (const sg of [-1, 1]) fn(bowFrame(B, sg * u, k), sg); } // the same on both limbs
function bowPlume(f, dir, fn) { // something hung from the bow at f, swinging back toward him and out along the limb
  const sg = f.u < 0 ? -1 : 1, dx = -f.nx + dir * sg * f.tx, dy = -f.ny + dir * sg * f.ty;
  ctx.save(); ctx.translate(f.x - f.nx * f.w * .5, f.y - f.ny * f.w * .5); ctx.rotate(Math.atan2(dy, dx) + Math.PI); fn(); ctx.restore(); // (it hangs along local -x)
}
function drawBow(lvl, k, nockArrow) {
  lvl = Math.max(1, Math.min(BOW_TIERS.length, lvl | 0 || 1));
  const B = BOW_TIERS[lvl - 1], fine = !FLASH && !TINT, t = performance.now() / 1000, g = B.g / B.H;
  // the centreline, sampled more finely toward the tips
  const us = [0, g * .5, g], n = Math.round(8 + B.H * .5); for (let i = 1; i <= n; i++) us.push(bowU(B, Math.pow(i / n, .85)));
  const F = []; for (let i = us.length - 1; i > 0; i--) F.push(bowFrame(B, -us[i], k)); for (const u of us) F.push(bowFrame(B, u, k));
  const R = F.filter(p => p.s <= 0); // the riser
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // the string, from tip to tip, drawn back to his cheek
  const ta = bowFrame(B, -1, k), tb = bowFrame(B, 1, k), sa = [ta.x - ta.nx * ta.w * .3, ta.y - ta.ny * ta.w * .3], sb = [tb.x - tb.nx * tb.w * .3, tb.y - tb.ny * tb.w * .3];
  const rest = (sa[0] + sb[0]) / 2, nk = k > 0 ? Math.min(rest, .5 - 10 * k) : rest; // (the same path his drawing hand takes)
  const str = () => { ctx.beginPath(); ctx.moveTo(sa[0], sa[1]); ctx.lineTo(nk, 0); ctx.lineTo(sb[0], sb[1]); };
  str(); ctx.strokeStyle = FLASH ? '#FFFFFF' : INK; ctx.lineWidth = .75 + 1 * OUTK; ctx.stroke(); str(); ctx.strokeStyle = C(B.str); ctx.lineWidth = .75; ctx.stroke();
  if (lvl === 2) for (const [x, y] of [sa, sb]) { const px = lerp(x, nk, .24), py = lerp(y, 0, .24); // black-and-crimson silencers
    ell(px, py, 1.3, .9); ctx.fillStyle = C('#2A2630'); ctx.fill(); outline(.4); ctx.fillStyle = C('#C8303A'); circle(px - .3, py, .45); ctx.fill(); }
  // hung below the grip, behind the limbs
  if (lvl === 1) { // a barred goose feather on a red thread
    bowPlume(bowFrame(B, g + .02, k), .9, () => {
      ctx.strokeStyle = C('#B4382C'); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-1.6, 0); ctx.stroke();
      for (const s of [-1, 1]) { arrowVane(-8, -1.6, s, 1.5); ctx.fillStyle = C('#DCD3C2'); ctx.fill();
        if (fine) { ctx.save(); ctx.clip(); ctx.strokeStyle = '#7A6048'; ctx.lineWidth = .7; ctx.beginPath(); for (const x of [-6.6, -4.8, -3]) { ctx.moveTo(x, 0); ctx.lineTo(x - 1, s * 2); } ctx.stroke(); ctx.restore(); }
        arrowVane(-8, -1.6, s, 1.5); outline(.4); }
    });
  } else if (lvl === 6) { // a raven feather on a silver thread
    bowPlume(bowFrame(B, g + .02, k), .85, () => {
      ctx.strokeStyle = C('#C8CCD8'); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-1.8, 0); ctx.stroke();
      for (const s of [-1, 1]) { arrowVane(-9.6, -1.8, s, 2.2); ctx.fillStyle = C('#5A3E96'); ctx.fill(); outline(.4);
        ravenVane(-9, -1.8, s, 1.9); ctx.fillStyle = C('#1A1424'); ctx.fill(); outline(.35); }
    });
  } else if (lvl === 7) { // swan feathers over sapphire ones, capped in silver
    bowPlume(bowFrame(B, g, k), .75, () => {
      for (const s of [-1, 1]) { arrowVane(-9.4, -1, s, 2.5); ctx.fillStyle = C('#F2F6FF'); ctx.fill(); outline(.45);
        arrowVane(-7.8, -1, s, 1.7); ctx.fillStyle = C('#3A7AF0'); ctx.fill(); outline(.35);
        arrowVane(-6.2, -1, s, 1); ctx.fillStyle = C('#DDEBFF'); ctx.fill(); outline(.3); }
      ctx.fillStyle = C('#C8CCD8'); ctx.fillRect(-2, -.7, 2, 1.4);
    });
  } else if (lvl === 5) { // a plume of three, its colours slowly turning
    const sw = fine ? Math.sin(t * 1.8) * 18 : 0;
    const cols = fine ? [`hsl(${262 + sw},82%,62%)`, `hsl(${320 + sw},85%,68%)`, `hsl(${44 + sw * .5},100%,70%)`] : ['#7C4CF0', '#F068C0', '#FFD266'];
    bowPlume(bowFrame(B, g, k), .75, () => {
      for (const s of [-1, 1]) { arrowVane(-9, -1, s, 2.6); ctx.fillStyle = C(cols[0]); ctx.fill(); outline(.45);
        arrowVane(-7.6, -1, s, 1.8); ctx.fillStyle = C(cols[1]); ctx.fill(); outline(.35);
        arrowVane(-6, -1, s, 1.1); ctx.fillStyle = C(cols[2]); ctx.fill(); outline(.3); }
      ctx.fillStyle = C('#E8B84A'); ctx.fillRect(-2, -.7, 2, 1.4); // its gold cap
    });
  }
  // the bow itself: the wood, its belly in shadow, a lit edge down its back
  bowStrip(F, -.5, .5); ctx.fillStyle = C(B.col[0]); ctx.fill();
  bowStrip(F, -.5, -.12); ctx.fillStyle = C(B.col[2]); ctx.fill();
  if (fine) { bowLine(F, .24); ctx.strokeStyle = B.col[1]; ctx.lineWidth = .5; ctx.stroke(); }
  // what is set in it
  if (lvl === 1) {
    if (fine) { bowLine(F, -.02); ctx.strokeStyle = '#9C7A4A'; ctx.lineWidth = .3; ctx.stroke(); } // the grain
    bowTwin(B, g + .05, k, f => bowBand(f, 1.7, '#B4382C', .25)); // red thread lashing either side of his fist
    bowTwin(B, .95, k, f => bowBand(f, 1.6, '#4A3222', .2)); // horn nocks
  } else if (lvl === 2) {
    bowStrip(R, -.55, .55); ctx.fillStyle = C('#C8303A'); ctx.fill(); outline(.4); // the crimson grip
    bowTwin(B, g + .03, k, f => bowBand(f, .9, '#A8AEBA')); bowTwin(B, g + .1, k, f => bowBand(f, .9, '#A8AEBA'));
    bowTwin(B, .9, k, (f, sg) => { bowBand(f, 1.2, '#A8AEBA', .25); });
    for (const sg of [-1, 1]) bowLocal(bowFrame(B, sg * .97, k), () => { // the steel cap, swept back into a barb
      ctx.beginPath(); ctx.moveTo(2.4, 0); ctx.lineTo(.6, 1.2); ctx.lineTo(-2.6, 3.4); ctx.lineTo(-.9, .9); ctx.lineTo(-1.2, -.9); ctx.lineTo(.6, -1); ctx.closePath();
      ctx.fillStyle = C('#B4BAC6'); ctx.fill(); outline(.45);
      if (fine) { ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = .4; ctx.beginPath(); ctx.moveTo(1.9, .1); ctx.lineTo(.4, 1.2); ctx.lineTo(-1.8, 2.8); ctx.stroke(); }
    }, 1);
  } else if (lvl === 3) {
    bowStrip(R, -.56, .56); ctx.fillStyle = C('#D8DEE8'); ctx.fill(); outline(.4); // the silver riser
    if (fine) { bowLine(R, .3); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = .45; ctx.stroke(); }
    bowLine(F.filter(p => p.s > 0 && p.u < 0), .3); ctx.strokeStyle = C('#E8C060'); ctx.lineWidth = .6; ctx.stroke(); // the gold ridge down its back
    bowLine(F.filter(p => p.s > 0 && p.u > 0), .3); ctx.stroke();
    for (const s of [0, .45, .8]) bowTwin(B, bowU(B, s) + .015, k, f => { bowBand(f, 1, '#E8C060', .3); if (fine) bowLocal(f, () => { ctx.fillStyle = '#FFF6D8'; ctx.fillRect(-.25, f.w * .1, .5, .55); }); });
    for (const sg of [-1, 1]) bowLocal(bowFrame(B, sg, k), () => { // a little vented silver broadhead for a tip
      ctx.scale(.42, .42); ctx.translate(1.5, 0);
      arrowHead([11, 0, 6, 2.6, 1.8, 4.5, -.9, 4.9, 1, 1.4, -1.6, 1.2], '#EEF1F7', '#A4ACC0');
      ctx.fillStyle = C('#2A2440'); for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(5.6, s * .95); ctx.lineTo(2.7, s * 2.6); ctx.lineTo(2.5, s * .95); ctx.closePath(); ctx.fill(); }
      ctx.strokeStyle = C('#E8C060'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-1.4, 0); ctx.lineTo(9.6, 0); ctx.stroke();
    }, 1);
  } else if (lvl === 4) {
    bowStrip(R, -.55, .55); ctx.fillStyle = C('#6C48D0'); ctx.fill(); outline(.4); // a violet grip
    if (fine) { ctx.fillStyle = '#9A78F0'; bowStrip(R, .1, .4); ctx.fill(); }
    bowTwin(B, g + .01, k, f => bowBand(f, .8, '#22A8B8', .3)); bowTwin(B, g + .055, k, f => bowBand(f, 1.3, '#C89A3A', .35)); bowTwin(B, bowU(B, .52), k, f => bowBand(f, 1.3, '#C89A3A', .3));
    let i = 0; for (const s of [.13, .26, .39, .66, .8]) bowTwin(B, bowU(B, s), k, (f, sg) => { const j = i++; // runes cut down each limb, their light running out from the grip
      bowLocal(f, () => { ctx.scale(.8, .8); runePath(0, (j >> 1) % 4); ctx.strokeStyle = C('#4FC8DC'); ctx.lineWidth = .8; ctx.stroke();
        if (fine) { const b = .5 + .5 * Math.sin(t * 7 - (j >> 1) * 1.2); if (b > .45) { ctx.globalAlpha = Math.min(1, (b - .45) * 2.2); ctx.strokeStyle = '#E8FFFF'; ctx.lineWidth = .55; ctx.stroke(); ctx.globalAlpha = 1; } } }, 1); });
    for (const sg of [-1, 1]) bowLocal(bowFrame(B, sg * .985, k), () => { // a faceted crystal for a tip, in a gold collar
      ctx.beginPath(); ctx.rect(-1.2, -1.2, 1.4, 2.4); ctx.fillStyle = C('#C89A3A'); ctx.fill(); outline(.35);
      ctx.scale(.55, .55); ctx.translate(1.6, 0);
      const P4 = [11.5, 0, 6, 2.9, .6, 2.5, -1.4, 0];
      ctx.beginPath(); ctx.moveTo(11.5, 0); ctx.lineTo(6, -2.9); ctx.lineTo(.6, -2.5); ctx.lineTo(-1.4, 0); ctx.closePath(); ctx.fillStyle = C('#BFF8FF'); ctx.fill();
      ctx.beginPath(); ctx.moveTo(11.5, 0); ctx.lineTo(6, 2.9); ctx.lineTo(.6, 2.5); ctx.lineTo(-1.4, 0); ctx.closePath(); ctx.fillStyle = C('#2E98B8'); ctx.fill();
      ctx.beginPath(); ctx.moveTo(11.5, 0); ctx.lineTo(6, -.9); ctx.lineTo(.6, -.8); ctx.lineTo(-1.4, 0); ctx.lineTo(.6, .8); ctx.lineTo(6, .9); ctx.closePath(); ctx.fillStyle = C('#6FDCEE'); ctx.fill();
      ctx.beginPath(); for (let i = 0; i < P4.length; i += 2) ctx.lineTo(P4[i], -P4[i + 1]); for (let i = P4.length - 4; i >= 2; i -= 2) ctx.lineTo(P4[i], P4[i + 1]); ctx.closePath(); outline(.8);
      if (fine) { const u = (t * .9 + (sg > 0 ? .8 : 0)) % 1.6; if (u < 1) { const x = .8 + u * 9.5, h = x < 6 ? 2.5 + (x - .6) / 5.4 * .4 : 2.9 * (11.5 - x) / 5.5; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - .3, -.9); ctx.lineTo(x + .4, -h * .85); ctx.stroke(); } }
    }, 1);
  } else if (lvl === 6) {
    bowStrip(R, -.56, .56); ctx.fillStyle = C('#C8CCD8'); ctx.fill(); outline(.4); // the silver riser
    if (fine) { bowLine(R, .3); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = .45; ctx.stroke(); }
    { const f = bowFrame(B, 0, k); ctx.beginPath(); ctx.moveTo(f.x, f.y - 1.4); ctx.lineTo(f.x + 1, f.y); ctx.lineTo(f.x, f.y + 1.4); ctx.lineTo(f.x - 1, f.y); ctx.closePath(); ctx.fillStyle = C('#8A6AD0'); ctx.fill(); outline(.35); } // a violet stone under his fist
    bowTwin(B, g + .025, k, f => bowBand(f, 1.2, '#C8CCD8', .3)); bowTwin(B, bowU(B, .5), k, f => bowBand(f, 1.1, '#C8CCD8', .3));
    let i = 0; for (const s of [.14, .26, .38, .64, .76]) bowTwin(B, bowU(B, s), k, (f, sg) => { const j = i++; // violet chevrons cut down each limb, pulsing out from the grip
      bowLocal(f, () => { chevron(0, f.w * .32); ctx.strokeStyle = C('#8A6AD0'); ctx.lineWidth = .7; ctx.stroke();
        if (fine) { const b = .5 + .5 * Math.sin(t * 6 - (j >> 1) * 1.1); if (b > .5) { ctx.globalAlpha = (b - .5) * 2; ctx.strokeStyle = '#E8DCFF'; ctx.lineWidth = .45; ctx.stroke(); ctx.globalAlpha = 1; } } }, 1); });
    for (const sg of [-1, 1]) bowLocal(bowFrame(B, sg * .975, k), () => { ctx.scale(.5, .5); ctx.translate(2.4, 0); shadowHead(fine, t, sg * 1.3); }, 1); // a hooked obsidian blade for a tip
  } else if (lvl === 7) {
    bowStrip(R, -.56, .56); ctx.fillStyle = C('#2E6CE8'); ctx.fill(); outline(.4); // the sapphire riser
    if (fine) { bowLine(R, .3); ctx.strokeStyle = '#8FC0FF'; ctx.lineWidth = .45; ctx.stroke(); }
    for (const side of [-1, 1]) { // the Pattern's blue line winding down each limb, its fire running out along it
      const L = F.filter(p => p.s > .03 && p.s < .93 && p.u * side > 0); if (side < 0) L.reverse();
      const off = p => .26 * Math.sin(p.s * 19);
      ctx.beginPath(); for (const p of L) ctx.lineTo(p.x + p.nx * p.w * off(p), p.y + p.ny * p.w * off(p)); ctx.strokeStyle = C('#2E6CE8'); ctx.lineWidth = .6; ctx.stroke();
      if (fine) { const u = (t * 1.1 + (side > 0 ? .5 : 0)) % 1, i0 = Math.floor(u * (L.length - 3)); ctx.beginPath(); for (let i = i0; i < i0 + 3; i++) { const p = L[i]; ctx.lineTo(p.x + p.nx * p.w * off(p), p.y + p.ny * p.w * off(p)); } ctx.strokeStyle = '#E8F4FF'; ctx.lineWidth = .55; ctx.stroke(); }
    }
    bowTwin(B, g + .02, k, f => bowBand(f, 1.3, '#C8CCD8', .35)); bowTwin(B, g + .065, k, f => bowBand(f, .8, '#2E6CE8', .3)); bowTwin(B, bowU(B, .94), k, f => bowBand(f, 1, '#C8CCD8', .3));
    for (const sg of [-1, 1]) bowLocal(bowFrame(B, sg * .98, k), () => { ctx.scale(.5, .5); ctx.translate(2.6, 0); patternHead(fine, t, sg * 1.7); }, 1); // a forked blue-white point for a tip
  } else {
    bowStrip(R, -.56, .56); ctx.fillStyle = C('#E8B84A'); ctx.fill(); outline(.4); // the gold riser
    if (fine) { bowLine(R, .3); ctx.strokeStyle = '#FFF2C0'; ctx.lineWidth = .45; ctx.stroke();
      for (const sg of [-1, 1]) { const f = bowFrame(B, sg * g * .86, k); ctx.fillStyle = '#B48CFF'; ctx.beginPath(); ctx.moveTo(f.x, f.y - .9); ctx.lineTo(f.x + .7, f.y); ctx.lineTo(f.x, f.y + .9); ctx.lineTo(f.x - .7, f.y); ctx.fill(); } } // violet stones above and below his fist
    ctx.beginPath(); // gold wire wound round the limbs
    for (let i = 1; i <= 9; i++) for (const sg of [-1, 1]) { const f = bowFrame(B, sg * bowU(B, .02 + i * .095), k), h = f.w * .5;
      ctx.moveTo(f.x - f.nx * h - f.tx * .7, f.y - f.ny * h - f.ty * .7); ctx.lineTo(f.x + f.nx * h + f.tx * .7, f.y + f.ny * h + f.ty * .7); }
    ctx.strokeStyle = C('#F0C860'); ctx.lineWidth = .5; ctx.lineCap = 'butt'; ctx.stroke(); ctx.lineCap = 'round';
    bowTwin(B, g + .02, k, f => bowBand(f, 1.4, '#E8B84A', .35));
    if (fine) { let i = 0; for (const s of [.31, .59, .78]) bowTwin(B, bowU(B, s), k, f => { const b = .55 + .45 * Math.sin(t * 5 + i++ * 2.1); ctx.globalAlpha = b; ctx.fillStyle = '#FFFFFF'; arrowStar(f.x, f.y, .9 + .6 * b, .25); ctx.fill(); ctx.globalAlpha = 1; }); } // stars set between the turns
    for (const sg of [-1, 1]) bowLocal(bowFrame(B, sg * .98, k), () => { // a gold star with a spike rising from it, for a tip
      arrowHead([6.2, 0, 2, .8, .6, .6], '#FFF2C0', '#E0A840');
      arrowStar(1, 0, 3.2, .9, 4); ctx.fillStyle = C('#FFD86A'); ctx.fill(); outline(.45);
      arrowStar(1, 0, 1.8, .6, 4, TAU / 8); ctx.fillStyle = C('#FFF6D8'); ctx.fill();
      if (fine) { const q = Math.pow(Math.max(0, Math.sin(t * 3.4 + sg * 1.7)), 6); if (q > .05) { ctx.globalAlpha = q; ctx.fillStyle = '#FFFFFF'; arrowStar(6.2, 0, .8 + 2 * q, .25, 4, t * .8); ctx.fill(); ctx.globalAlpha = 1; } }
    }, 1);
  }
  bowStrip(F, -.5, .5); outline(.6); // its outline, last, so the bands sit inside it
  // an arrow of the tier he has, nocked on the string
  if (nockArrow && k > 0) { ctx.save(); ctx.translate(nk + 27.6, 0); drawArrowShape(lvl, 26); ctx.restore(); }
  ctx.restore();
}
// the bow in his hand while he draws and looses: its riser in his fist, his fingers closing over it last
function drawShortBow(pose) {
  drawBow(pose.bowTier || arrowLv(), pose.draw || 0, true);
  gripHand(pose.glove || '#2E2C36'); // (GRIP is turned across for the bow)
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
