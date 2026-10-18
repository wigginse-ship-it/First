// ---------- hidden Trump rooms: one in each world's approach, behind a gate that only one card opens ----------
// Once the approach is clear, a ghostly Trump stands near its end. Play the right card beside it and the card opens
// a way into the Hall of Trumps: a room of champions, and a rich reward, and from there the road goes on to the boss.
const SECRET_KEY = ['stag', 'brand', 'mirror', 'stillness', 'phoenix'];
let SECRET_ROOM = null, secretHint = false;
const secretKey = () => SECRET_KEY[stageIdx % SECRET_KEY.length];
function secretGate() {
  if (zoneIdx !== 1 || !stage || stage.secret || stage.bossRoom) return null;
  return { x: stage.len - 300, y: FLOOR_TOP + 34 };
}
const gateOpen = () => waveIdx >= stage.waves.length && !waveActive;
function trySecret() {
  const g = secretGate(); if (!g || !gateOpen() || zoneTrans || Math.abs(P.x - g.x) > 70) return false;
  if (save.trump !== secretKey()) { floatText(g.x, g.y, 120, `THE GATE WANTS ${TRUMPS[secretKey()].name.toUpperCase()}`, '#EED48A', 13); return false; }
  trumpCharge = 0; banner(TRUMPS[secretKey()].name, 'THE CARD OPENS A WAY', 1.6);
  zoneTrans = { kind: 'trumpgate', t: 0, dur: 2.2, swapped: false, secret: true }; P.inv = 9; sfx('trump'); flashT = .2;
  return true;
}
function enterSecret() {
  const w = baseStage.waves[1].map(t => t.replace('*', '')), champ = baseStage.waves[2].map(t => t.replace('*', '')).filter(t => EDEF[t] && EDEF[t].move !== 'fly');
  SECRET_ROOM = { title: 'The Hall of Trumps', sub: `${TRUMPS[secretKey()].name.toUpperCase()} OPENED THE WAY · CHAMPIONS WAIT`, theme: 'trumpRealm', len: 1100, pods: [760],
    rawWaves: [[...w.slice(0, 4).map(t => t + '*'), pick(champ) + '!', pick(champ) + '!']] };
  enterZone(1, SECRET_ROOM); mech = null; secretHint = false;
}
function updateSecret(dt) {
  const g = secretGate();
  if (g && gateOpen() && !secretHint && Math.abs(P.x - g.x) < 140) { secretHint = true; floatText(g.x, g.y, 110, `A TRUMP GATE · PLAY ${TRUMPS[secretKey()].name.toUpperCase()}`, '#EED48A', 13); }
  if (stage.secret && gateOpen() && !stage.rewarded) { // the Trump's reward
    stage.rewarded = true; const x = P.x + 60, y = P.y;
    banner('THE TRUMP’S REWARD', 'SHARDS, SIGILS AND A BOON', 2);
    for (let i = 0; i < 10; i++) loot.push(makeLoot('shard', x, y, 6 + stageIdx * 4));
    for (let i = 0; i < 2 + (stageIdx >= 2 ? 1 : 0); i++) loot.push(makeLoot('sigil', x, y, 1));
    loot.push(Object.assign(makeLoot('power', x, y, 0), { power: pick(POWER_ORDER) }));
    burst(x, y, 40, ['#EED48A', '#FFFFFF', '#C8607A'], 40, 'spark', 0, true); sfx('weapon');
  }
}
function secretBoxes(box) { const g = secretGate(); if (g) box(g.x, g.y, 0, 50, 100); }
function secretList(list, t) {
  const g = secretGate(); if (!g) return;
  list.push([g.y, () => onMain(() => { // a tall ghost of a card, standing on the road, its emblem faint until the way is clear
    const open = gateOpen(), a = (open ? .75 : .25) + .1 * Math.sin(t * 2), h = 92, w = 58, x = g.x - w / 2, y = g.y - h;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
    const gg = ctx.createLinearGradient(0, y, 0, g.y); gg.addColorStop(0, 'rgba(238,212,138,.35)'); gg.addColorStop(1, 'rgba(238,212,138,.05)'); ctx.fillStyle = gg; rrect(x, y, w, h, 5); ctx.fill();
    ctx.strokeStyle = '#EED48A'; ctx.lineWidth = 2; rrect(x, y, w, h, 5); ctx.stroke(); ctx.lineWidth = .8; rrect(x + 5, y + 5, w - 10, h - 10, 3); ctx.stroke();
    ctx.fillStyle = '#FFF0C0'; drawTrumpGlyph(secretKey(), g.x, y + h * .45, 12);
    ctx.restore();
  })]);
}
function drawTrumpGlyph(id, x, y, s) { // a small emblem for each card
  ctx.beginPath();
  if (id === 'stag') { ctx.moveTo(x, y + s); ctx.lineTo(x, y - s * .3); ctx.moveTo(x, y - s * .3); ctx.lineTo(x - s * .8, y - s); ctx.moveTo(x - s * .4, y - s * .6); ctx.lineTo(x - s * .7, y - s * .3); ctx.moveTo(x, y - s * .3); ctx.lineTo(x + s * .8, y - s); ctx.moveTo(x + s * .4, y - s * .6); ctx.lineTo(x + s * .7, y - s * .3); ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 2; ctx.stroke(); return; }
  if (id === 'brand') { ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x + s, y, x, y + s); ctx.quadraticCurveTo(x - s, y, x, y - s); }
  else if (id === 'mirror') { ctx.ellipse(x - s * .35, y, s * .45, s * .8, 0, 0, TAU); ctx.moveTo(x + s * .8, y); ctx.ellipse(x + s * .35, y, s * .45, s * .8, 0, 0, TAU); }
  else if (id === 'stillness') { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); } ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 2; ctx.stroke(); return; }
  else { ctx.moveTo(x, y - s); ctx.lineTo(x + s * .9, y + s * .6); ctx.lineTo(x, y + s * .2); ctx.lineTo(x - s * .9, y + s * .6); ctx.closePath(); }
  ctx.fill();
}
// the way in: a great card falls over the view, turns face up, and you step through it
TRANS_FX.trumpgate = (T, p, c, inP, t) => {
  const cx = VW / 2, cy = Y_OFF + VIEW_H / 2, w = 220 * (.4 + .6 * c), h = 300 * (.4 + .6 * c), flip = Math.cos(p * Math.PI * 2);
  ctx.fillStyle = `rgba(20,12,24,${.75 * c})`; ctx.fillRect(0, Y_OFF, VW, VIEW_H);
  ctx.save(); ctx.translate(cx, cy); ctx.scale(Math.max(.04, Math.abs(flip)), 1);
  const face = flip < 0, g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  if (face) { g.addColorStop(0, '#F6E6B8'); g.addColorStop(1, '#C9A86A'); } else { g.addColorStop(0, '#2A1830'); g.addColorStop(1, '#120A18'); }
  ctx.fillStyle = g; rrect(-w / 2, -h / 2, w, h, 10); ctx.fill();
  ctx.strokeStyle = '#D8AA55'; ctx.lineWidth = 4; rrect(-w / 2, -h / 2, w, h, 10); ctx.stroke(); ctx.lineWidth = 1.5; rrect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 6); ctx.stroke();
  ctx.fillStyle = face ? '#5A3A1A' : '#EED48A'; drawTrumpGlyph(secretKey(), 0, 0, 40 * (.4 + .6 * c));
  ctx.restore();
};

// ---------- the Hall of Trumps: painted like the inside of a card ----------
THEMES.trumpRealm = { name: 'the hall of trumps', sky: ['#3A2440', '#7A5A6A', '#D8B888', '#F4E2B8'], sun: [.5, .3, '255,236,190'], haze: '240,220,180', skyKind: 'none',
  floorA: '#C8B48A', floorB: '#6A5438', path: '#E8D8B0', grade: { desat: .1, top: 'rgba(120,80,140,.35)', bot: 'rgba(240,190,120,.35)', vig: 'rgba(40,20,40,.55)' } };
AW_FAR.trumpRealm = (rnd, th, f) => {
  const g = ctx.createLinearGradient(0, 0, 0, FLOOR_TOP); g.addColorStop(0, '#3A2440'); g.addColorStop(.6, '#B89070'); g.addColorStop(1, '#F0DCB0'); ctx.fillStyle = g; ctx.fillRect(0, 0, AW_W + 1, FLOOR_TOP);
  for (let i = 0; i < 9; i++) { // great faint cards standing in the haze, each with its emblem
    const x = 40 + i * 142 + rnd() * 30, w = 70 + rnd() * 30, h = w * 1.5, y = FLOOR_TOP - h - 10 - rnd() * 40;
    awWrap(x, w, (xx) => { ctx.globalAlpha = .35; ctx.fillStyle = '#F6E6C0'; rrect(xx, y, w, h, 6); ctx.fill(); ctx.strokeStyle = '#B8904A'; ctx.lineWidth = 2; rrect(xx, y, w, h, 6); ctx.stroke(); rrect(xx + 6, y + 6, w - 12, h - 12, 4); ctx.stroke();
      ctx.fillStyle = '#8A6A3A'; drawTrumpGlyph(SECRET_KEY[i % 5], xx + w / 2, y + h * .45, w * .22); ctx.globalAlpha = 1; });
  }
};
AW_MID.trumpRealm = (rnd) => {
  for (let i = 0; i < 6; i++) { // gilt columns and arches
    const x = 60 + i * 214 + rnd() * 20, top = 90 + rnd() * 30;
    awWrap(x, 40, (xx) => {
      const cg = ctx.createLinearGradient(xx - 12, 0, xx + 12, 0); cg.addColorStop(0, '#8A6A3A'); cg.addColorStop(.5, '#F0D890'); cg.addColorStop(1, '#7A5A2A');
      ctx.fillStyle = cg; ctx.fillRect(xx - 11, top, 22, FLOOR_TOP - top); outline(1.2); ctx.strokeRect(xx - 11, top, 22, FLOOR_TOP - top);
      ctx.fillStyle = '#D8AA55'; ctx.fillRect(xx - 16, top - 8, 32, 9); ctx.fillRect(xx - 15, FLOOR_TOP - 10, 30, 10);
      ctx.strokeStyle = '#D8AA55'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(xx + 107, top - 4, 107, Math.PI, TAU); ctx.stroke(); ctx.strokeStyle = '#6A4A20'; ctx.lineWidth = 1.2; ctx.stroke();
    });
  }
  for (let i = 0; i < 7; i++) { const x = rnd() * AW_W, y = 60 + rnd() * 90, a = rnd() - .5; awWrap(x, 30, (xx) => { ctx.save(); ctx.translate(xx, y); ctx.rotate(a); ctx.fillStyle = '#F6E6C0'; rrect(-12, -18, 24, 36, 3); ctx.fill(); ctx.strokeStyle = '#B8904A'; ctx.lineWidth = 1.4; rrect(-12, -18, 24, 36, 3); ctx.stroke(); ctx.fillStyle = '#C8607A'; drawTrumpGlyph(SECRET_KEY[i % 5], 0, 0, 7); ctx.restore(); }); } // drifting cards
};
AW_FLOOR.trumpRealm = (rnd, th) => {
  const wy = FLOOR_TOP - 18, wg = ctx.createLinearGradient(0, wy, 0, FLOOR_TOP); wg.addColorStop(0, '#6A4A2A'); wg.addColorStop(1, '#3A2616'); // a gilt wainscot at the back of the floor
  ctx.fillStyle = wg; ctx.fillRect(0, wy, AW_W + 1, 18); ctx.fillStyle = '#D8AA55'; ctx.fillRect(0, wy, AW_W + 1, 2); ctx.fillRect(0, FLOOR_TOP - 2, AW_W + 1, 2);
  ctx.strokeStyle = '#B8904A'; ctx.lineWidth = 1; for (let x = 10; x < AW_W; x += 64) ctx.strokeRect(x, wy + 4, 52, 10);
  for (let y = FLOOR_TOP; y < VH; y += 22) for (let x = 0; x < AW_W + 1; x += 40) { // a marble floor of cream and black, inlaid with gold
    const dark = ((x / 40) + Math.floor((y - AW_FT0) / 22)) % 2 === 0, sk = (y - FLOOR_TOP) * .3;
    ctx.fillStyle = dark ? '#2A1E22' : '#E8D8B4'; ctx.beginPath(); ctx.moveTo(x + sk, y); ctx.lineTo(x + 40 + sk, y); ctx.lineTo(x + 40 + sk + 6.6, y + 22); ctx.lineTo(x + sk + 6.6, y + 22); ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = '#D8AA55'; ctx.lineWidth = 1.2; for (let y = FLOOR_TOP; y < VH; y += 22) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(AW_W + 1, y); ctx.stroke(); }
};
