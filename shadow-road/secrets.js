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
// the gate doesn't always open on the same place: it deals one of several rooms, never the same one twice running
const SECRET_KINDS = ['hall', 'grove', 'vault', 'duel'];
const SECRET_BUILD = {
  hall() { // the Hall of Trumps: armored foes and two champions, and a rich reward
    const w = baseStage.waves[1].map(t => t.replace('*', '')), champ = baseStage.waves[2].map(t => t.replace('*', '')).filter(t => EDEF[t] && EDEF[t].move !== 'fly');
    return { title: 'The Hall of Trumps', sub: `${TRUMPS[secretKey()].name.toUpperCase()} OPENED THE WAY · CHAMPIONS WAIT`, theme: 'trumpRealm', len: 1100, pods: [760],
      rawWaves: [[...w.slice(0, 4).map(t => t + '*'), pick(champ) + '!', pick(champ) + '!']] };
  },
  grove() { // the Unicorn's Grove: no fight at all; she offers three gifts and you may take one
    return { title: 'The Grove of the Unicorn', sub: 'SHE OFFERS THREE GIFTS · TAKE ONE', theme: 'unicornGrove', len: 1100, pods: [], rawWaves: [] };
  },
  vault() { // the Drowned Vault of Rebma: break what you can before the tide comes back in (one urn is not an urn)
    return { title: 'The Drowned Vault of Rebma', sub: 'BREAK WHAT YOU CAN · THE TIDE RETURNS', theme: 'rebmaVault', len: 1100, pods: [], rawWaves: [] };
  },
  duel() { EDEF.eric = ericDef(); // a Prince of Amber steps out of his own card: beat him and he pays the forfeit
    return { title: 'A Duel in Shadow', sub: 'ERIC OF AMBER WILL NOT STEP ASIDE', theme: 'trumpRealm', len: 1000, pods: [], rawWaves: [['eric!']] };
  },
};
function enterSecret() {
  const kind = window.__forceRoom || pick(SECRET_KINDS.filter(k => k !== save.lastSecret)); save.lastSecret = kind; persist();
  SECRET_ROOM = SECRET_BUILD[kind](); SECRET_ROOM.kind = kind;
  enterZone(1, SECRET_ROOM); mech = null; secretHint = false;
  stage.room = { kind, t: 0 };
  if (kind === 'grove') stage.room.offers = dealBoons();
  if (kind === 'vault') { stage.room.left = 20; stage.room.started = false;
    const xs = []; for (let i = 0; i < 14; i++) xs.push(240 + i * 58 + rand(-14, 14));
    const gold = Math.floor(rand(3, 14)), mimic = (gold + 4 + Math.floor(rand(0, 6))) % 14;
    props = xs.map((x, i) => ({ kind: 'pod', urn: true, gold: i === gold, mimic: i === mimic && i !== gold, x, y: FLOOR_TOP + 22 + ((i * 37) % 5) * 16, hp: i === gold ? 4 : 2, theme: 'vault' }));
  }
}
// ---------- the Unicorn's gifts ----------
const boonW = () => [save.weapon, ...WEAPON_ORDER].find(id => id !== 'fists' && save.owned[id] && save.wl[id] < WMAX());
const BOONS = {
  edge: { name: "The Unicorn's Edge", sub: () => `${WEAPONS[boonW()].name.toUpperCase()} +1 LEVEL`, ok: () => !!boonW(), give() { const id = boonW(); save.wl[id]++; } },
  heart: { name: 'Heart of the Unicorn', sub: () => '+30 MAX HEALTH, FOR GOOD', ok: () => save.armor < 5, give() { save.armor++; P.hp = maxHp(); } },
  quiver: { name: 'Quiver of Starlight', sub: () => save.alv < 5 ? `A FULL QUIVER · ${ARROW_TIERS[save.alv].name.toUpperCase()}` : 'A FULL QUIVER', ok: () => true, give() { save.arrows = ARROW_MAX; if (save.alv < 5) save.alv++; refreshArrows(); } },
  card: { name: 'A Trump, Freshly Drawn', sub: () => { const id = TRUMP_ORDER.find(k => !save.trumps[k]); return id ? `THE ${TRUMPS[id].name.toUpperCase()}` : 'ONE OF YOUR CARDS, INSCRIBED DEEPER'; },
    ok: () => TRUMP_ORDER.some(k => !save.trumps[k] || TL(k) < 3),
    give() { const id = TRUMP_ORDER.find(k => !save.trumps[k]); if (id) { save.trumps[id] = true; if (!save.trump) save.trump = id; } else { const k = pick(TRUMP_ORDER.filter(k => TL(k) < 3)); save.tlv[k] = TL(k) + 1; } } },
  hoard: { name: "The Unicorn's Hoard", sub: () => `${hoardN()} SHARDS`, ok: () => true, give() { const n = hoardN(); save.shards += n; runShards += n; } },
  ink: { name: 'The Inkwell of Dworkin', sub: () => `${5 + stageIdx} SIGILS`, ok: () => true, give() { save.sigils += 5 + stageIdx; runSigils += 5 + stageIdx; } },
  blade: { name: 'A Blade from Shadow', sub: () => 'A WEAPON YOU HAVE NOT FOUND', ok: () => WEAPON_ORDER.some(id => id !== 'fists' && !save.owned[id]), give() { gainWeapon(pick(WEAPON_ORDER.filter(id => id !== 'fists' && !save.owned[id]))); } },
};
const hoardN = () => Math.round(110 * (1 + stageIdx * .8) * (1 + .5 * save.cycle));
function dealBoons() {
  const ids = Object.keys(BOONS).filter(k => BOONS[k].ok()).sort(() => Math.random() - .5).slice(0, 3);
  return ids.map((id, i) => ({ id, x: 470 + i * 150, y: FLOOR_TOP + 50, label: BOONS[id].sub() }));
}
function updateSecret(dt) {
  const g = secretGate();
  if (g && gateOpen() && !secretHint && Math.abs(P.x - g.x) < 140) { secretHint = true; floatText(g.x, g.y, 110, `A TRUMP GATE · PLAY ${TRUMPS[secretKey()].name.toUpperCase()}`, '#EED48A', 13); }
  if (!stage.secret || !stage.room) return;
  const R = stage.room; R.t += dt;
  if (R.kind === 'grove' && !R.chosen && !zoneTrans) for (const o of R.offers) {
    if (Math.abs(P.x - o.x) < 26 && Math.abs(P.y - o.y) < 22 && P.z < 12) { // walk into a gift to take it; the others fade
      R.chosen = o.id; BOONS[o.id].give(); persist(); refreshHud(true);
      banner(BOONS[o.id].name, o.label, 2.4); sfx('weapon'); flashT = .15;
      burst(o.x, o.y, 40, ['#FFFFFF', '#EED48A', '#C8D8F0'], 36, 'spark', 0, true); break;
    }
  }
  if (R.kind === 'vault' && !zoneTrans) {
    if (!R.started) { R.started = true; R.left = 20; }
    if (R.left > 0) { R.left -= dt;
      if (R.left <= 0 || !props.some(p => p.urn)) { R.left = 0; // the tide comes back and takes the rest
        for (const p of props) if (p.urn) { p.broken = true; for (let i = 0; i < 6; i++) parts.push({ x: p.x + rand(-10, 10), y: p.y, z: rand(5, 30), vx: rand(-10, 10), vy: 0, vz: rand(40, 90), life: 1, max: 1, col: 'rgba(200,240,240,.6)', size: rand(2, 4), shape: 'puff', rot: 0, vr: 0 }); }
        banner(props.some(p => p.urn) ? 'THE TIDE RETURNS' : 'THE VAULT IS EMPTY', 'THE WAY ON LIES AHEAD', 1.8);
      } }
    if (Math.random() < dt * 8) parts.push({ x: camX + rand(0, VW), y: rand(FLOOR_TOP, FLOOR_BOT), z: 0, vx: 0, vy: 0, vz: rand(30, 60), life: 2.5, max: 2.5, col: 'rgba(210,245,245,.45)', size: rand(1.5, 3), shape: 'puff', rot: 0, vr: 0 }); // bubbles
  }
  if ((R.kind === 'hall' || R.kind === 'duel') && gateOpen() && !stage.rewarded) { // the reward for the fight
    stage.rewarded = true; const x = P.x + 60, y = P.y;
    if (R.kind === 'hall') {
      banner('THE TRUMP’S REWARD', 'SHARDS, SIGILS, ARROWS AND A BOON', 2);
      for (let i = 0; i < 10; i++) loot.push(makeLoot('shard', x, y, 6 + stageIdx * 4));
      for (let i = 0; i < 2 + (stageIdx >= 2 ? 1 : 0); i++) loot.push(makeLoot('sigil', x, y, 1));
      for (let i = 0; i < 2; i++) loot.push(makeLoot('arrow', x, y, 1));
    } else { // Eric yields, and pays: a level for your weapon (or a purse if they're all tempered), and ink
      const id = boonW();
      if (id) { save.wl[id]++; persist(); banner('ERIC YIELDS', `${WEAPONS[id].name.toUpperCase()} +1 LEVEL · AND HIS PURSE`, 2.4); }
      else { banner('ERIC YIELDS', 'HIS PURSE IS YOURS', 2.2); for (let i = 0; i < 8; i++) loot.push(makeLoot('shard', x, y, Math.round(hoardN() / 8))); }
      for (let i = 0; i < 3; i++) loot.push(makeLoot('sigil', x, y, 1));
    }
    loot.push(Object.assign(makeLoot('power', x, y, 0), { power: pick(POWER_ORDER) }));
    burst(x, y, 40, ['#EED48A', '#FFFFFF', '#C8607A'], 40, 'spark', 0, true); sfx('weapon');
  }
}
function secretBoxes(box) { const g = secretGate(); if (g) box(g.x, g.y, 0, 50, 100); const R = stage && stage.room; if (R && R.offers) { for (const o of R.offers) box(o.x, o.y, 0, 70, 120); box(980, FLOOR_TOP + 30, 0, 90, 140); } }
function secretList(list, t) {
  roomList(list, t);
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

// ---------- what the rooms show ----------
function roomList(list, t) {
  const R = stage && stage.secret && stage.room; if (!R) return;
  if (R.kind === 'grove') {
    list.push([FLOOR_TOP + 30, () => drawUnicorn(980, FLOOR_TOP + 30, t)]);
    for (const o of R.offers) { if (R.chosen && R.chosen !== o.id) continue; if (R.chosen && R.t > 9) continue;
      list.push([o.y, () => onMain(() => { // a gift: a small standing card of light over a mossy stone
        const bob = Math.sin(t * 2 + o.x) * 3, x = o.x, y = o.y - 34 + bob, took = R.chosen === o.id;
        ctx.fillStyle = C('#5E6A52'); ell(x, o.y - 4, 18, 7); ctx.fill(); outline(1.2);
        ctx.save(); ctx.globalAlpha = took ? .5 : 1;
        const g = ctx.createLinearGradient(0, y - 30, 0, y + 20); g.addColorStop(0, '#FFF6DE'); g.addColorStop(1, '#D8C49A');
        ctx.fillStyle = g; rrect(x - 15, y - 30, 30, 46, 4); ctx.fill(); ctx.strokeStyle = '#B8904A'; ctx.lineWidth = 1.6; rrect(x - 15, y - 30, 30, 46, 4); ctx.stroke();
        ctx.fillStyle = '#8A6A3A'; drawBoonGlyph(o.id, x, y - 8, 9);
        ctx.font = '600 9px Cinzel, serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFF0C8'; ctx.strokeStyle = 'rgba(30,20,30,.85)'; ctx.lineWidth = 3;
        const n = BOONS[o.id].name.toUpperCase(); ctx.strokeText(n, x, y - 40); ctx.fillText(n, x, y - 40);
        ctx.font = '600 7px Cinzel, serif'; ctx.fillStyle = '#E8D8B0'; ctx.strokeText(o.label, x, y - 30 - 1 + 52 + 18); ctx.fillText(o.label, x, y - 30 - 1 + 52 + 18);
        ctx.restore();
      })]);
    }
  }
  if (R.kind === 'vault' && R.left > 0) list.push([VH + 1, () => onMain(() => { // the tide clock
    const x = camX + VW / 2, y = Y_OFF + 44; ctx.font = '700 15px Cinzel, serif'; ctx.textAlign = 'center';
    ctx.fillStyle = R.left < 5 ? '#FF9A8A' : '#E8F8F4'; ctx.strokeStyle = 'rgba(10,30,40,.85)'; ctx.lineWidth = 4;
    const s = `THE TIDE RETURNS · ${Math.ceil(R.left)}`; ctx.strokeText(s, x, y); ctx.fillText(s, x, y);
  })]);
}
function drawBoonGlyph(id, x, y, s) {
  ctx.beginPath();
  if (id === 'edge') { ctx.moveTo(x, y - s * 1.3); ctx.lineTo(x + s * .25, y + s * .5); ctx.lineTo(x - s * .25, y + s * .5); ctx.closePath(); ctx.fill(); ctx.fillRect(x - s * .6, y + s * .5, s * 1.2, s * .2); ctx.fillRect(x - s * .1, y + s * .7, s * .2, s * .5); return; }
  if (id === 'heart') { ctx.moveTo(x, y + s); ctx.bezierCurveTo(x - s * 1.4, y - s * .2, x - s * .5, y - s * 1.2, x, y - s * .4); ctx.bezierCurveTo(x + s * .5, y - s * 1.2, x + s * 1.4, y - s * .2, x, y + s); ctx.fill(); return; }
  if (id === 'quiver') { ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1.6; for (let i = -1; i <= 1; i++) { ctx.moveTo(x + i * s * .4, y + s); ctx.lineTo(x + i * s * .4, y - s); ctx.moveTo(x + i * s * .4 - 2, y - s + 3); ctx.lineTo(x + i * s * .4, y - s); ctx.lineTo(x + i * s * .4 + 2, y - s + 3); } ctx.stroke(); return; }
  if (id === 'card') { ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1.4; rrect(x - s * .6, y - s, s * 1.2, s * 2, 2); ctx.stroke(); drawTrumpGlyph('brand', x, y, s * .5); return; }
  if (id === 'hoard') { for (let i = 0; i < 3; i++) { ctx.moveTo(x + (i - 1) * s * .6, y - s * .6 + (i % 2) * s * .4); ctx.lineTo(x + (i - 1) * s * .6 + s * .35, y + (i % 2) * s * .4); ctx.lineTo(x + (i - 1) * s * .6, y + s * .6 + (i % 2) * s * .4); ctx.lineTo(x + (i - 1) * s * .6 - s * .35, y + (i % 2) * s * .4); ctx.closePath(); } ctx.fill(); return; }
  if (id === 'ink') { ctx.moveTo(x - s * .6, y + s); ctx.lineTo(x + s * .6, y + s); ctx.lineTo(x + s * .4, y); ctx.lineTo(x - s * .4, y); ctx.closePath(); ctx.fill(); ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + s * .9, y - s * 1.2); ctx.stroke(); return; }
  ctx.moveTo(x - s, y + s); ctx.lineTo(x + s, y - s); ctx.lineWidth = 2.4; ctx.strokeStyle = ctx.fillStyle; ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - s * .5, y - s * .2); ctx.lineTo(x + s * .2, y + s * .5); ctx.stroke(); // blade
}
// the Unicorn of Amber, standing at the far edge of her grove, white against the dark trees
function drawUnicorn(x, y, t) {
  const b = Math.sin(t * 1.3) * 1.5, hd = Math.sin(t * .7) * .06;
  ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1); shadow(0, 0, 40);
  const W = '#F4F0E8', S = '#C8C4D0';
  ctx.strokeStyle = C(S); ctx.lineWidth = 5; ctx.lineCap = 'round'; // legs
  for (const [lx, k] of [[-22, 0], [-14, 1], [18, 0], [26, 1]]) { ctx.beginPath(); ctx.moveTo(lx, -40); ctx.quadraticCurveTo(lx + (k ? 2 : -2), -20, lx + (k ? 3 : 0), -2); ctx.stroke(); }
  ctx.fillStyle = C('#B8A878'); for (const lx of [-22, -11, 18, 29]) { ctx.fillRect(lx - 3, -4, 6, 4); }
  ctx.fillStyle = C(W); ctx.beginPath(); ctx.ellipse(0, -46 + b, 32, 15, 0, 0, TAU); ctx.fill(); outline(1.4); // body
  ctx.save(); ctx.translate(26, -54 + b); ctx.rotate(-.5 + hd); // neck and head
  ctx.beginPath(); ctx.moveTo(-8, 8); ctx.lineTo(-4, -26); ctx.lineTo(8, -28); ctx.lineTo(10, 6); ctx.closePath(); ctx.fill(); outline(1.2);
  ctx.save(); ctx.translate(4, -28); ctx.rotate(1.2); ctx.beginPath(); ctx.ellipse(8, 0, 13, 6.5, 0, 0, TAU); ctx.fillStyle = C(W); ctx.fill(); outline(1.2);
  ctx.fillStyle = C('#2A2030'); circle(4, -2, 1.4); ctx.fill();
  ctx.strokeStyle = C('#E8D8A0'); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(-4, -22); ctx.stroke(); // the horn
  ctx.strokeStyle = C('#B8A060'); ctx.lineWidth = .8; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-1 - i, -8 - i * 3.5); ctx.lineTo(1 - i, -9.5 - i * 3.5); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = C('#E2DEEA'); ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-6, -24 + i * 8); ctx.quadraticCurveTo(-14, -18 + i * 8 + Math.sin(t * 2 + i) * 2, -12, -10 + i * 8); ctx.stroke(); } // mane
  ctx.restore();
  ctx.strokeStyle = C('#E2DEEA'); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-30, -50 + b); ctx.quadraticCurveTo(-46, -40 + Math.sin(t * 1.6) * 4, -42, -22); ctx.stroke(); // tail
  ctx.restore();
}
// Eric of Amber: a knight's frame in his colors, a duellist who sees your swings coming
const ericDef = () => Object.assign({}, EDEF.chknight || EDEF.bandit, { name: 'Eric of Amber', noRandom: 1, hp: 70, dmg: 13, spd: 90, plans: EDEF.chknight ? ['swing', 'swing', 'w4blink'] : ['swing'], sigil: 0 });
// the vault's urns: amphorae from a drowned city, full of shards; one is gold all through, and one bites back
{
  const _hit = hitProp;
  hitProp = function (p, m) {
    if (!p.urn) return _hit(p, m);
    p.hp -= (m.power || 0) >= 1 ? 2 : 1; p.flash = .1; hitstop = Math.max(hitstop, .04); shakeMag = Math.max(shakeMag, 3); sfx('hit-crystal');
    burst(p.x, p.y, 20, p.gold ? ['#FFE8A0', '#D8AA55'] : ['#7AB8B0', '#C8E8E0', '#5A8A80'], 8, 'shard', P.facing);
    if (p.hp > 0) return;
    p.broken = true; sfx('break'); burst(p.x, p.y, 20, ['#C8E8E0', '#7AB8B0', '#FFFFFF'], 20, 'shard', 0, true);
    if (p.mimic) { // it was never an urn
      const pool = baseStage.waves[1].map(t => t.replace('*', '')).filter(t => EDEF[t] && EDEF[t].move !== 'fly');
      const e = spawnEnemy(pick(pool.length ? pool : ['slime']) + '*', 1); e.x = p.x; e.y = p.y; setEntrance(e, 'rise'); e.x = p.x; e.y = p.y; e.vaultMimic = 1;
      floatText(p.x, p.y, 60, 'A MIMIC!', '#FF9A8A', 14); waveActive = true; return;
    }
    if (p.gold) {
      floatText(p.x, p.y, 70, 'A GOLDEN URN', '#EED48A', 15); flashT = .1;
      for (let i = 0; i < 6; i++) loot.push(makeLoot('shard', p.x, p.y, 5 + stageIdx * 3));
      for (let i = 0; i < 3; i++) loot.push(makeLoot('sigil', p.x, p.y, 1));
      loot.push(makeLoot('arrow', p.x, p.y, 1)); loot.push(Object.assign(makeLoot('power', p.x, p.y, 0), { power: pick(POWER_ORDER) }));
      const un = WEAPON_ORDER.filter(id => id !== 'fists' && !save.owned[id]); if (un.length && Math.random() < .35) loot.push(makeLoot('weapon', p.x, p.y, 0, pick(un)));
      return;
    }
    for (let i = 0; i < 3; i++) loot.push(makeLoot('shard', p.x, p.y, 2 + stageIdx * 2));
    if (Math.random() < .2) loot.push(makeLoot('sigil', p.x, p.y, 1));
    if (Math.random() < .15) loot.push(makeLoot('heal', p.x, p.y, 20));
  };
  const _pod = drawPod;
  drawPod = function (p, t) {
    if (!p.urn) return _pod(p, t);
    ctx.save(); ctx.translate(p.x, p.y); shadow(0, 0, 14);
    const body = p.gold ? '#D8AA55' : p.mimic ? '#6E9A90' : '#6E9A90', dark = p.gold ? '#8A6A2A' : '#3E5E58';
    if (p.mimic && Math.sin(t * 9 + p.x) > .93) ctx.translate(rand(-1, 1), 0); // the faintest shiver
    ctx.fillStyle = C(body); ctx.beginPath(); ctx.moveTo(-6, -38); ctx.quadraticCurveTo(-16, -30, -14, -16); ctx.quadraticCurveTo(-12, -2, -5, 0); ctx.lineTo(5, 0); ctx.quadraticCurveTo(12, -2, 14, -16); ctx.quadraticCurveTo(16, -30, 6, -38); ctx.closePath(); ctx.fill(); outline(1.6);
    ctx.fillStyle = C(dark); ctx.fillRect(-7, -42, 14, 5); ctx.strokeStyle = C(dark); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-11, -32, 5, 1.5, 4.6); ctx.moveTo(11, -37); ctx.arc(11, -32, 5, -1.5, 1.6); ctx.stroke();
    ctx.strokeStyle = C(p.gold ? '#FFF0C0' : '#A8D0C8'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-13, -20); ctx.quadraticCurveTo(0, -16, 13, -20); ctx.moveTo(-12, -14); ctx.quadraticCurveTo(0, -10, 12, -14); ctx.stroke();
    if (p.gold) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,220,140,${.12 + .08 * Math.sin(t * 3)})`; ell(0, -20, 22, 26); ctx.fill(); ctx.restore(); }
    ctx.restore();
  };
}
// the rooms' painted places: a moonlit Vale for the grove, and a hall of Rebma under the sea for the vault
THEMES.unicornGrove = Object.assign({}, THEMES.bloom, { name: 'the unicorn grove', sky: ['#0E1630', '#26345A', '#56688A', '#A8B4C4'], sun: [.7, .22, '230,236,255'], haze: '150,170,200',
  grade: { desat: .3, top: 'rgba(40,60,130,.5)', bot: 'rgba(150,170,210,.3)', vig: 'rgba(10,10,30,.6)' } });
THEMES.rebmaVault = Object.assign({}, THEMES.trumpRealm, { name: 'the drowned vault', sky: ['#082028', '#103844', '#2A6A70', '#6AA8A0'], haze: '90,160,160',
  grade: { desat: .25, top: 'rgba(20,90,110,.55)', bot: 'rgba(60,150,140,.4)', vig: 'rgba(0,20,30,.65)' } });
AW_FAR.rebmaVault = (rnd, th, f) => {
  const g = ctx.createLinearGradient(0, 0, 0, FLOOR_TOP); g.addColorStop(0, '#061A22'); g.addColorStop(.6, '#14404A'); g.addColorStop(1, '#3A7A76'); ctx.fillStyle = g; ctx.fillRect(0, 0, AW_W + 1, FLOOR_TOP);
  for (let i = 0; i < 7; i++) { const x = rnd() * AW_W, w = 30 + rnd() * 50; awWrap(x, w * 3, (xx) => { // shafts of light down through the water
    const sg = ctx.createLinearGradient(0, 0, 0, FLOOR_TOP); sg.addColorStop(0, 'rgba(200,240,230,.22)'); sg.addColorStop(1, 'rgba(200,240,230,0)'); ctx.fillStyle = sg;
    ctx.beginPath(); ctx.moveTo(xx, 0); ctx.lineTo(xx + w, 0); ctx.lineTo(xx + w * 2.4, FLOOR_TOP); ctx.lineTo(xx + w * 1.2, FLOOR_TOP); ctx.closePath(); ctx.fill(); }); }
  for (let i = 0; i < 6; i++) { const x = 60 + i * 214 + rnd() * 40, h = 90 + rnd() * 60; awWrap(x, 90, (xx) => { // towers of the drowned city, far off
    ctx.fillStyle = 'rgba(20,60,66,.7)'; ctx.fillRect(xx, FLOOR_TOP - h, 34, h); ctx.beginPath(); ctx.moveTo(xx - 4, FLOOR_TOP - h); ctx.lineTo(xx + 17, FLOOR_TOP - h - 30); ctx.lineTo(xx + 38, FLOOR_TOP - h); ctx.fill(); }); }
  for (let i = 0; i < 20; i++) { const x = rnd() * AW_W, y = FLOOR_TOP - rnd() * 40; ctx.strokeStyle = 'rgba(60,120,90,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, FLOOR_TOP); ctx.quadraticCurveTo(x + 6, y - 20, x - 2, y - 40); ctx.stroke(); } // kelp
};
AW_MID.rebmaVault = AW_MID.trumpRealm; AW_FLOOR.rebmaVault = AW_FLOOR.trumpRealm;
