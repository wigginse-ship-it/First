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
const arrowCost = (lvl) => ({ s: Math.round((70 * lvl + 18 * lvl * lvl) * (1 + .5 * (save.cycle || 0))), g: Math.round(lvl * 1.5 * (1 + .5 * (save.cycle || 0))) });
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
  P.state = 'shoot'; P.t = 0; P.loosed = false; P.seq = ''; P.vx = 0; sfx('swing', .3);
}
function updateShoot(dt) { // draw, loose, recover
  P.t += dt;
  if (!P.loosed && P.t >= .16) {
    P.loosed = true; save.arrows--; persist(); refreshArrows();
    const T = aTier(), lvl = Math.min(5, save.alv || 1);
    projs.push({ owner: 'p', arrow: lvl, x: P.x + P.facing * 22, y: P.y, z: Math.max(30, P.z + 38), vx: P.facing * 820, dmg: Math.round(T.dmg * worldDiff().hp), life: 1.2, hit: new Set(), pierce: T.pierce, crit: T.crit, blast: T.blast });
    sfx('shoot'); P.vx = -P.facing * 60;
  }
  if (P.t >= .36) P.state = P.z > 0 ? 'jump' : 'idle';
}
// an arrow in flight strikes the first foe in its path (returns true when it is spent)
function arrowHit(p) {
  let best = null, bd = 1e9;
  for (const e of enemies) {
    if (e.dead || p.hit.has(e)) continue;
    const dx = (e.x - p.x) * Math.sign(p.vx);
    if (dx < -e.hw - 6 || dx > e.hw + 16 || Math.abs(e.y - p.y) > 20 + e.hw * .2 || p.z < e.z - 6 || p.z > e.z + e.hh + 10) continue;
    if (dx < bd) { bd = dx; best = e; }
  }
  if (!best) return false;
  p.hit.add(best);
  strike(best, p.dmg, Math.sign(p.vx), { dmg: p.dmg, kb: 300, launch: 120, power: 2, arrow: 1, crit: Math.random() < .15 + p.crit });
  burst(best.x, best.y, p.z, ['#FFFFFF', '#E8D8B0'], 8, 'spark', Math.sign(p.vx));
  if (p.blast) { // rune and starfall arrows burst where they land
    fx.push({ kind: 'ring', x: best.x, y: best.y, z: 4, t: .35, max: .35, r: p.blast * 1.4, col: p.arrow >= 5 ? '#E8E0FF' : '#9FE8F0', flat: 1 });
    for (const o of enemies) if (o !== best && !o.dead && Math.hypot(o.x - best.x, (o.y - best.y) * 2) < p.blast) strike(o, p.dmg * .4, Math.sign(o.x - best.x) || 1, { dmg: p.dmg * .4, kb: 220, launch: 160, power: 1, arrow: 1 });
  }
  if (p.pierce > 0) { p.pierce--; return false; }
  return true;
}
// what an arrow looks like at each level: in flight, on the ground and on its forge card
function drawArrowShape(lvl, len = 30) {
  const shaft = ['#A88A5E', '#6E6A70', '#D8DCE6', '#3A3048', '#E8E0FF'][lvl - 1], fl = ['#E8E0D0', '#5A5A66', '#C8CEDA', '#7FD8E8', '#B8A8FF'][lvl - 1], head = ['#8E96A8', '#B8BEC8', '#E8ECF4', '#9FE8F0', '#FFFFFF'][lvl - 1];
  if (lvl >= 4) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = lvl >= 5 ? 'rgba(200,190,255,.5)' : 'rgba(159,232,240,.4)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(4, 0); ctx.stroke(); ctx.restore(); }
  ctx.strokeStyle = C(OUT); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(0, 0); ctx.stroke();
  ctx.strokeStyle = C(shaft); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(0, 0); ctx.stroke();
  if (lvl === 4) { ctx.fillStyle = C('#9FE8F0'); for (const x of [-20, -14, -8]) ctx.fillRect(x, -.6, 2, 1.2); } // runes in the shaft
  ctx.fillStyle = C(fl); for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(-len - 4, s * 4); ctx.lineTo(-len + 7, s * 1.2); ctx.closePath(); ctx.fill(); outline(.6); } // fletching
  ctx.fillStyle = C(head); ctx.beginPath(); // the head: a little leaf, barbs, a broadhead, a rune point, a star
  if (lvl === 1) { ctx.moveTo(6, 0); ctx.lineTo(-1, -2); ctx.lineTo(-1, 2); }
  else if (lvl === 2) { ctx.moveTo(7, 0); ctx.lineTo(-1, -2.6); ctx.lineTo(1, 0); ctx.lineTo(-1, 2.6); }
  else if (lvl === 3) { ctx.moveTo(8, 0); ctx.lineTo(-1, -3.6); ctx.lineTo(0, 0); ctx.lineTo(-1, 3.6); }
  else if (lvl === 4) { ctx.moveTo(8, 0); ctx.lineTo(1, -3); ctx.lineTo(-2, 0); ctx.lineTo(1, 3); }
  else { for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, r = i % 2 ? 1.6 : 4.6; ctx.lineTo(3 + Math.cos(a) * r, Math.sin(a) * r); } }
  ctx.closePath(); ctx.fill(); outline(.7);
}
function drawArrowProj(p) {
  const x = p.x, y = p.y - p.z;
  ctx.save(); shadow(p.x, p.y, 4); ctx.translate(x, y); ctx.scale(Math.sign(p.vx), 1);
  if (p.arrow >= 3) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(-70, 0, 0, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, p.arrow >= 5 ? 'rgba(220,210,255,.6)' : 'rgba(230,240,255,.4)'); ctx.fillStyle = g; ctx.fillRect(-70, -1.5, 70, 3); ctx.restore(); } // its streak of light
  drawArrowShape(p.arrow); ctx.restore();
}
function drawArrowLoot(k, t) { // an arrow stuck in the ground, gleaming
  const x = k.x, y = k.y - k.z;
  shadow(k.x, k.y, 5);
  ctx.save(); ctx.translate(x, y - 4); ctx.rotate(-1.1); drawArrowShape(Math.min(5, save.alv || 1), 22); ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .4 + .3 * Math.sin(t * 5 + k.x); ctx.fillStyle = '#FFF0C0'; circle(x + 4, y - 14, 2); ctx.fill(); ctx.restore();
}
// the short bow, drawn in his hand while he looses
function drawShortBow(pose) {
  const k = pose.draw || 0;
  ctx.strokeStyle = C('#5A3A22'); ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(10, 0, 15, -1.2, 1.2); ctx.stroke(); outline(.1);
  ctx.strokeStyle = C('#E8E0D0'); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(10 + Math.cos(-1.2) * 15, Math.sin(-1.2) * 15); ctx.lineTo(10 - k * 10, 0); ctx.lineTo(10 + Math.cos(1.2) * 15, Math.sin(1.2) * 15); ctx.stroke();
  if (k > 0 && k < 1) { ctx.save(); ctx.translate(26, 0); drawArrowShape(Math.min(5, save.alv || 1), 18 + k * 8); ctx.restore(); }
  gripHand(pose.glove || '#2E2C36');
}
// the quiver count on the HUD, and the BOW button on touch screens
let arrowHudEl = null;
function refreshArrows() {
  if (!arrowHudEl) {
    const host = document.querySelector('.hud-r'); if (!host) return;
    arrowHudEl = document.createElement('div'); arrowHudEl.id = 'arrowHud'; arrowHudEl.title = 'Arrows';
    arrowHudEl.style.cssText = 'display:flex;gap:2px;align-items:center;font:700 12px Cinzel,Georgia,serif;color:#E8D8B0;text-shadow:0 1px 2px #000';
    host.insertBefore(arrowHudEl, host.firstChild);
  }
  const n = save.arrows || 0; arrowHudEl.hidden = n <= 0;
  arrowHudEl.innerHTML = '➶'.repeat(n);
  const b = document.getElementById('shootBtn'); if (b) { b.hidden = n <= 0; b.textContent = 'BOW ' + n; }
}
