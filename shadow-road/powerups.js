// ---------- powerups: rare drops that last a few seconds, so they are worth grabbing before the wave is done ----------
// Each shows on the prince while it lasts, flickers as it runs out, and goes out with a puff and a word.
const POWERS = {
  haste:   { name: 'QUICKSILVER', col: '#BFE8FF', rgb: '191,232,255', dur: 8, desc: 'faster feet and quicker strikes' },
  might:   { name: 'EMBER STRENGTH', col: '#FF9A5A', rgb: '255,154,90', dur: 8, desc: 'hits land harder' },
  ward:    { name: 'STONE SKIN', col: '#EED48A', rgb: '238,212,138', dur: 8, desc: 'blows only half hurt' },
  leech:   { name: 'BLOODTHIRST', col: '#E0566E', rgb: '224,86,110', dur: 8, desc: 'every hit heals a little' },
  fortune: { name: 'GILDED HAND', col: '#F2D27A', rgb: '242,210,122', dur: 10, desc: 'foes drop twice the shards' },
};
const POWER_ORDER = Object.keys(POWERS);
let PW = {}; // what is active: kind -> seconds left
const pw = (k) => (PW[k] || 0) > 0;
function resetPowers() { PW = {}; }
function maybeDropPower(e) {
  if (e.boss) return;
  if (Math.random() < (e.elite ? .3 : .055)) loot.push(Object.assign(makeLoot('power', e.x, e.y, 0), { power: pick(POWER_ORDER) }));
}
function gainPower(kind) {
  const p = POWERS[kind]; PW[kind] = p.dur;
  sfx('trump'); floatText(P.x, P.y, 96 + 16 * POWER_ORDER.filter(q => q !== kind && PW[q] > 0).length, p.name, p.col, 15);
  burst(P.x, P.y, 40, [p.col, '#FFFFFF'], 18, 'spark', 0, true); fx.push({ kind: 'ring', x: P.x, y: P.y, z: 20, t: .4, max: .4, r: 60, col: p.col, flat: 1 });
}
function updatePowers(dt) {
  for (const k in PW) {
    if (PW[k] <= 0) continue;
    PW[k] -= dt;
    if (PW[k] <= 0) { // it goes out: a puff and a word, so you know
      const p = POWERS[k]; floatText(P.x, P.y, 90, p.name.split(' ').pop() + ' FADES', 'rgba(220,210,200,.9)', 12);
      for (let i = 0; i < 10; i++) parts.push({ x: P.x + rand(-12, 12), y: P.y, z: rand(10, 60), vx: rand(-40, 40), vy: 0, vz: rand(20, 60), life: .6, max: .6, col: `rgba(${p.rgb},.6)`, size: rand(4, 7), shape: 'puff', rot: 0, vr: 0 });
      continue;
    }
    const p = POWERS[k];
    if (k === 'haste' && Math.random() < dt * 14) { addGhost(); }
    if (k === 'might' && Math.random() < dt * 24) parts.push({ x: P.x + P.facing * rand(4, 30), y: P.y, z: rand(30, 60), vx: rand(-15, 15), vy: 0, vz: rand(40, 90), life: .45, max: .45, col: pick(['#FF9A5A', '#FFD27A']), size: rand(1.6, 2.8), shape: 'star', rot: 0, vr: 6 });
    if (k === 'leech' && Math.random() < dt * 10) parts.push({ x: P.x + rand(-40, 40), y: P.y + rand(-8, 8), z: rand(10, 70), vx: 0, vy: 0, vz: 0, life: .5, max: .5, col: p.col, size: 2, shape: 'blob', home: 1 });
    if (k === 'fortune' && Math.random() < dt * 8) parts.push({ x: P.x + rand(-16, 16), y: P.y, z: rand(20, 70), vx: 0, vy: 0, vz: 20, life: .5, max: .5, col: '#FFF0B0', size: 2.4, shape: 'star', rot: 0, vr: 4 });
  }
  for (const pt of parts) if (pt.home) { pt.x += (P.x - pt.x) * Math.min(1, .16); pt.z += (40 - pt.z) * .16; } // blood motes drawn into him
}
// the aura on the prince for each active power; it flickers in its last two seconds
function drawPowerAura(t) {
  for (const k in PW) {
    const left = PW[k]; if (left <= 0) continue;
    const p = POWERS[k], fade = left < 2 ? (Math.sin(t * 22) > 0 ? .35 : 1) : 1, cy = P.y - P.z - 34;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fade;
    if (k === 'ward') { // a shell of light around him
      const g = ctx.createRadialGradient(P.x, cy, 18, P.x, cy, 40); g.addColorStop(0, `rgba(${p.rgb},0)`); g.addColorStop(.8, `rgba(${p.rgb},.28)`); g.addColorStop(1, `rgba(${p.rgb},0)`);
      ctx.fillStyle = g; ell(P.x, cy, 34, 42); ctx.fill();
      ctx.strokeStyle = `rgba(${p.rgb},.6)`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(P.x, cy, 32, 40, 0, t * 2, t * 2 + 4.4); ctx.stroke();
    } else {
      const g = ctx.createRadialGradient(P.x, cy + 10, 4, P.x, cy + 10, 44); g.addColorStop(0, `rgba(${p.rgb},.32)`); g.addColorStop(1, `rgba(${p.rgb},0)`);
      ctx.fillStyle = g; ell(P.x, cy + 10, 34, 46); ctx.fill();
    }
    ctx.restore();
  }
  // a little ring of timers over his head, one per active power
  let i = 0; const act = POWER_ORDER.filter(k => PW[k] > 0);
  for (const k of act) {
    const p = POWERS[k], x = P.x + (i - (act.length - 1) / 2) * 14, y = P.y - P.z - 92, frac = PW[k] / p.dur; i++;
    ctx.fillStyle = 'rgba(20,12,24,.6)'; circle(x, y, 5.5); ctx.fill();
    ctx.strokeStyle = p.col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 5, -Math.PI / 2, -Math.PI / 2 + TAU * frac); ctx.stroke();
    ctx.fillStyle = p.col; drawPowerGlyph(k, x, y, 2.6);
  }
}
function drawPowerGlyph(k, x, y, s) {
  ctx.beginPath();
  if (k === 'haste') { ctx.moveTo(x - s, y - s); ctx.lineTo(x + s * .2, y); ctx.lineTo(x - s, y + s); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 1.2, y); ctx.lineTo(x, y + s); ctx.lineWidth = 1; ctx.strokeStyle = ctx.fillStyle; ctx.stroke(); return; }
  if (k === 'might') { ctx.moveTo(x, y - s * 1.3); ctx.quadraticCurveTo(x + s * 1.2, y, x, y + s); ctx.quadraticCurveTo(x - s * 1.2, y, x, y - s * 1.3); }
  else if (k === 'ward') { ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y - s); ctx.lineTo(x + s, y); ctx.quadraticCurveTo(x, y + s * 1.4, x - s, y); ctx.closePath(); }
  else if (k === 'leech') { ctx.moveTo(x, y - s * 1.2); ctx.quadraticCurveTo(x + s, y + .3 * s, x, y + s); ctx.quadraticCurveTo(x - s, y + .3 * s, x, y - s * 1.2); }
  else { for (let j = 0; j < 8; j++) { const a = j / 8 * TAU, r = j % 2 ? s * .45 : s * 1.2; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); }
  ctx.fill();
}
// the drop: a small painted card spinning slowly above the ground, glowing its color; it blinks before it fades away
function drawPowerLoot(k, t) {
  const p = POWERS[k.power], x = k.x, y = k.y - k.z - 12 - Math.sin(t * 4 + k.x) * 2.5;
  if (k.t > 6 && Math.sin(t * 20) < 0) return;
  shadow(k.x, k.y, 6);
  ctx.save(); ctx.translate(x, y); ctx.scale(Math.cos(t * 2.2 + k.x), 1);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 18); g.addColorStop(0, `rgba(${p.rgb},.6)`); g.addColorStop(1, `rgba(${p.rgb},0)`); ctx.fillStyle = g; circle(0, 0, 18); ctx.fill(); ctx.restore();
  rrect(-6, -8, 12, 16, 2); ctx.fillStyle = '#1A1218'; ctx.fill(); ctx.strokeStyle = '#D8AA55'; ctx.lineWidth = 1.2; ctx.stroke(); // a tiny gilt-edged card
  ctx.fillStyle = p.col; drawPowerGlyph(k.power, 0, 0, 3.2);
  ctx.restore();
}
