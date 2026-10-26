'use strict';
// ---------- HUD ----------
const hpEl = $('#hp'), bossHpEl = $('#bosshp'), tbarEl = $('#tbar'), trumpBtn = $('#trumpBtn');
let bannerT = 0;
function banner(title, sub, dur) { $('#bt').textContent = title; $('#bs').textContent = sub || ''; $('#banner').classList.add('on'); bannerT = dur; }
function refreshHud(full) {
  if (!P) return;
  hpEl.style.width = (100 * P.hp / maxHp()) + '%';
  $('#shards').textContent = save.shards; $('#sigils').textContent = save.sigils;
  if (full) {
    $('#wname').textContent = WEAPONS[P.w].name.toUpperCase();
    $('#wlv').textContent = 'LV' + save.wl[P.w];
    drawIcon($('#wcardCv'), P.w, .8);
    $('#tbarWrap').hidden = !save.trump; trumpBtn.hidden = !save.trump;
    if (save.trump) trumpBtn.textContent = 'CARD';
  }
}
let lastCombo = 0;
function refreshCombo(hit) {
  const el = $('#combo');
  el.classList.toggle('on', comboN >= 2);
  $('#comboN').textContent = comboN;
  if (hit && comboN !== lastCombo) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  lastCombo = comboN;
}
function hudTick() {
  hpEl.style.width = (100 * P.hp / maxHp()) + '%';
  if (boss) bossHpEl.style.width = Math.max(0, 100 * boss.hp / boss.maxHp) + '%';
  if (save.trump) {
    tbarEl.style.width = (100 * trumpCharge / TRUMP_CHARGE) + '%';
    trumpBtn.classList.toggle('ready', trumpCharge >= TRUMP_CHARGE);
  }
}

// ---------- screens ----------
const OVERLAYS = ['titleOv', 'forgeOv', 'pauseOv', 'overOv', 'winOv', 'invOv'];
function showOnly(id) {
  OVERLAYS.forEach(o => { $('#' + o).hidden = o !== id; });
  app.classList.toggle('nocontrols', id !== null && id !== 'pauseOv');
  app.classList.toggle('playing', id === null);
  $('#hud').hidden = id === 'titleOv' || id === 'forgeOv' || id === 'winOv' || (id === 'invOv' && typeof invFrom !== 'undefined' && invFrom === 'forge');
}
// ---------- the road forks after the dream ----------
// Worlds 0-4 are walked in order. The dream (world 4, FORK) ends on the Rim of the Abyss with his deck of Trumps, and the
// card the player picks there (branch.js) sets save.branch: the world the road goes on to, 5 Tir-na Nog'th, 6 Rebma or
// 7 Lorraine. Each of those ends the road: its own ending, then the win card, and save.endings records the endings seen
// ({ moon, rebma, lorraine }). A new cycle of the road clears save.branch, so the choice comes round again.
const FORK = 4;
const isFinal = (i) => i > FORK;
const branchStage = () => (save.branch > FORK && STAGES[save.branch]) ? save.branch : FORK + 1; // (a road whose world is not there falls back to the moon)
const roadStage = () => { const i = save.stage | 0; return i > FORK ? (STAGES[i] ? i : FORK + 1) : Math.min(i, STAGES.length - 1); }; // where "Walk on" leads
const endingId = (i) => (window.BRANCH && BRANCH.idOf(i)) || ['moon', 'rebma', 'lorraine'][i - FORK - 1] || 'world' + i;
const endingsSeen = () => Object.keys(save.endings || {}).filter(k => save.endings[k]).length;
{ // saves from before the road forked: the moon was the only road from the Rim, and stage 6 meant the road was walked
  if (!save.endings) save.endings = {};
  if (save.branch === undefined) {
    if (save.stage > FORK + 1) { save.stage = FORK + 1; save.branch = FORK + 1; save.done = true; save.endings.moon = true; }
    else save.branch = save.stage === FORK + 1 ? FORK + 1 : null;
    if (save.started) persist();
  }
}
function play(i, zone = 0) {
  save.started = true; persist(); clearInput();
  startStage(i); retryZone = 0;
  if (zone > 0) { enterZone(zone); const Z = ZONES[i].zones[zone]; banner(Z.title, Z.sub, 2.4); } // a retry starts where you fell
  mode = 'play'; showOnly(null); playMusic(STAGES[i].theme);
}
function pauseGame() { if (mode !== 'play') return; mode = 'pause'; showOnly('pauseOv'); if (typeof invBtnText === 'function') $('#invBtn').textContent = invBtnText(); $('#musicBtn').textContent = 'Music: ' + (musicOn ? 'on' : 'off'); $('#moveTitle').textContent = WEAPONS[P.w].name + ' moves'; $('#moveList').innerHTML = moveListHtml(P.w); $('#sfxBtn').textContent = 'Sound: ' + (sfxOn ? 'on' : 'off'); }
function resume() { mode = 'play'; clearInput(); showOnly(null); }
function gameOver() {
  mode = 'over'; persist();
  $('#overText').textContent = `${stage.name} got the better of you this time. You keep everything you picked up: ${runShards} shards and ${runSigils} sigil${runSigils === 1 ? '' : 's'}. Spend them at the forge, or jump straight back in.`;
  showOnly('overOv'); playMusic('fallen');
}
function stageClear() {
  for (const k of loot) { // sweep up loot still on the ground
    if (k.kind === 'shard') { save.shards += k.val; runShards += k.val; }
    else if (k.kind === 'sigil') { save.sigils += k.val; runSigils += k.val; }
    else if (k.kind === 'weapon') save.owned[k.weapon] = true;
    else if (k.kind === 'gear') sweepGear(k);
  }
  loot = [];
  const from = stageIdx;
  if (isFinal(from)) { // the end of the road: each of the worlds past the fork is the last
    save.stage = from; save.branch = from; save.done = true; save.endings = save.endings || {}; save.endings[endingId(from)] = true; persist();
    mode = 'win'; winCard(from); showOnly('winOv'); playMusic('title');
  } else {
    save.stage = from === FORK ? branchStage() : from + 1; persist();
    openForge(`WORLD CLEARED: +${runShards} SHARDS, +${runSigils} SIGILS`);
  }
}
// the win card, for whichever road was walked (a world's own ending may write over it after: art_w5.js does)
let winAt = 0;
function winCard(i) {
  winAt = performance.now(); // (the key that skips the last of an ending must not also start a new cycle: onKeyMenu)
  const c = window.BRANCH && BRANCH.card(i), W = (c && c.win) || {}, relic = c && c.relic;
  const k = $('#winOv .kicker'), h2 = $('#winOv .h2');
  if (k) k.textContent = W.kicker || 'THE ROAD IS WALKED'; if (h2) h2.textContent = W.title || `${STAGES[i].name} is behind you`;
  $('#winText').textContent = W.text || `Every shadow of the road is behind you${relic ? `, and ${relic.name} is yours` : ''}. Walking the road again starts a harder cycle: enemies hit harder and have more health, but drop more shards. Your weapons, levels and cards come with you.`;
  const row = $('#winOv .row');
  if (row && !$('#w5TitleBtn')) { const b = document.createElement('button'); b.className = 'cta alt'; b.id = 'w5TitleBtn'; b.type = 'button'; b.textContent = 'Title screen'; b.addEventListener('click', () => { mode = 'title'; refreshTitle(); showOnly('titleOv'); playMusic('title'); }); row.appendChild(b); } // (the id art_w5.js gives its own, so there is only ever one)
  Promise.resolve().then(() => { // after any world's own words: how many of the roads' ends have been seen
    let el = $('#winTally'); if (!el) { el = document.createElement('p'); el.id = 'winTally'; el.className = 'small'; $('#winText').after(el); }
    const n = endingsSeen();
    el.textContent = n >= 3 ? 'All three roads from the Rim are walked: the moon, the sea and the Black Circle.' : `Endings seen: ${n} of 3. On the next cycle the deck comes out again on the Rim: draw another Trump, and another road.`;
  });
}

// ---------- explaining moves: inputs shown as button chips ----------
// on a keyboard the chips name the keys instead of the buttons
const KEY_CHIP = { SHOOT: 'I', A: 'J', H: 'K', HOLDA: 'HOLD J', HOLD: 'HOLD K', HOLD3: 'HOLD K TO 3RD FLASH', HOLD4: 'HOLD K TO 4TH FLASH', RUNJUMP: 'RUN + SPACE', RUN: 'RUN', WALK: 'WALK', JUMP: 'SPACE', DODGE: 'L' };
const CHIP = { SHOOT: ['BOW', 'j'], A: ['ATTACK', 'a'], H: ['HEAVY', 'h'], HOLDA: ['HOLD ATTACK', 'a'], HOLD: ['HOLD HEAVY', 'h'], HOLD3: ['HOLD HEAVY TO 3RD FLASH', 'h'], HOLD4: ['HOLD HEAVY TO 4TH FLASH', 'h'], RUNJUMP: ['RUNNING JUMP', 'j'], RUN: ['RUN', 'r'], WALK: ['WALK', 'r'], JUMP: ['JUMP', 'j'], DODGE: ['DODGE', 'd'] };
const KEY_INPUTS = { RH: ['DODGE', '+H'], J2: ['JUMP', 'JUMP'], AX: ['JUMP', '+HOLDA'], X: ['HOLDA'], M: ['WALK', '+A'], AH: ['JUMP', '+HOLD'], JH: ['JUMP', '+H'], DA: ['RUNJUMP', '+A'], HOLD4: ['HOLD4'], HC: ['HOLD'], D: ['RUN', '+A'], DH: ['RUN', '+H'], A: ['JUMP', '+A'], R: ['DODGE', '+A'] };
function inputsFor(id, m) {
  if (!m.key) return ['HOLD3'];
  if (m.key === 'HOLD4') return ['HOLD4'];
  if (m.seq) return m.seq;
  if (KEY_INPUTS[m.key]) return KEY_INPUTS[m.key];
  return m.key.split('').map((c, i) => c === 'L' ? 'A' : (id === 'sword' && i === 0 ? 'HOLD' : 'H'));
}
function chips(id, m) {
  return '<span class="chips">' + inputsFor(id, m).map((tk, i) => {
    const plus = tk[0] === '+', c = CHIP[plus ? tk.slice(1) : tk];
    const name = plus ? tk.slice(1) : tk;
    return (i ? `<i>${plus ? '+' : '›'}</i>` : '') + `<span class="chip ${c[1]}">${KBD ? KEY_CHIP[name] : c[0]}</span>`;
  }).join('') + '</span>';
}
const BASICS = [
  { key: 'L', name: 'Combo', desc: 'Tap Attack again and again to chain the full combo.', seq: ['A', 'A', 'A'] },
  { key: 'JH', name: 'Air heavy', desc: 'Heavy in the air: every weapon has its own big aerial move, once per jump.' },
  { key: 'DA', name: 'Running jump attack', desc: 'Jump out of a run, then Attack: a flying strike that keeps all your speed.' },
  { key: 'X', name: 'Launcher', desc: 'Hold Attack to throw an enemy into the air. Tap Jump right after to leap up after them.' },
  { key: 'A', name: 'Air combo', desc: 'Up to three Attacks in the air. Air hits keep enemies floating and hit harder; the third drives them into the ground.', seq: ['JUMP', '+A', 'A', 'A'] },
  { key: 'H', name: 'Heavy', desc: 'A launcher or finisher. With the Great Sword, hold to charge. Mix it into the combos below.', seq: ['H'] },
  { key: 'D', name: 'Dash attack', desc: 'Run (flick the joystick twice, or tap a direction key twice), then attack.' },
  { key: 'R', name: 'Dodge counter', desc: 'Tap Attack during a dodge to strike out of it.' },
  { key: 'S', name: 'Arrows', desc: 'A short bow, with any weapon. Arrows are rare (shooters drop them) and you carry five at most; each one flies straight into the first foe in its way, hits hard and can crit.', seq: ['SHOOT'] },
];
function moveListHtml(id) {
  const lvl = save.wl[id], tree = WEAPONS[id].tree;
  const basics = BASICS.map(b => `<li class="got"><b>${b.name}</b> ${chips(id, b)}<br><em>${b.desc}</em></li>`).join('');
  const combos = Object.values(tree).filter(m => m.name && !m.lvl && m.key !== 'X').map(m => `<li class="got"><b>${m.name}</b> ${chips(id, m)}</li>`).join('');
  const learned = unlockList(id).map(m => `<li class="${lvl >= m.lvl ? 'got' : m.lvl === lvl + 1 ? 'next' : ''}"><b>LV${m.lvl} · ${m.name}</b> ${chips(id, m)}<br><em>${lvl >= m.lvl ? m.desc : m.lvl === lvl + 1 ? 'Next at the forge: ' + m.desc : 'Locked: ' + m.desc}</em></li>`).join('');
  return `<ul class="moves">${basics}${combos}${learned}</ul>`;
}

// ---------- the forge ----------
// prices climb steeply, and each new cycle of the road makes everything dearer again
const cyc = () => 1 + .5 * (save.cycle || 0);
const WMAX = () => save.cycle > 0 ? WLEARN + 6 : WLEARN; // past level 7 (new cycles only) each level is a plain damage bump
// tuned so a world pays for one or two upgrades, no more
const wCost = (lvl) => lvl < WLEARN ? { s: Math.round([0, 90, 190, 330, 520, 760, 1050][lvl] * cyc()), g: Math.round([0, 1, 2, 3, 5, 7, 9][lvl] * cyc()) } : { s: Math.round((1600 + 250 * (lvl - WLEARN)) * cyc()), g: Math.round((14 + 3 * (lvl - WLEARN)) * cyc()) }; // level 7, the last move, is a step dearer than 6
const tCost = (lv) => ({ s: Math.round([0, 320, 760][lv] * cyc()), g: Math.round([0, 9, 18][lv] * cyc()) }); // inscribing a card again, to level II or III
const costTxt = (c) => `${c.s} ◆${c.g ? ` + ${c.g} ✦` : ''}`;
function openForge(kicker) {
  mode = 'forge'; showOnly('forgeOv'); playMusic('forge');
  $('#forgeKicker').textContent = kicker || 'BETWEEN WORLDS';
  renderForge();
  $('#forgeOv').scrollTop = 0;
}
function renderForge(note) {
  $('#fShards').textContent = save.shards; $('#fSigils').textContent = save.sigils;
  const wrap = $('#forgeCards'); wrap.innerHTML = '';
  for (const id of WEAPON_ORDER) {
    if (id === 'fists') continue; // bare hands have nothing to forge
    const w = WEAPONS[id], owned = save.owned[id], lvl = save.wl[id], max = lvl >= WMAX(), c = wCost(lvl);
    const bare = id === 'fists'; // fists never level up
    const can = owned && !bare && !max && save.shards >= c.s && save.sigils >= c.g;
    const d = document.createElement('div'); d.className = 'card' + (owned ? '' : ' locked');
    const moves = unlockList(id).map(m => `<li class="${lvl >= m.lvl ? 'got' : m.lvl === lvl + 1 ? 'next' : ''}"><b>LV${m.lvl} · ${m.name}</b> ${chips(id, m)}<br><em>${m.desc}</em></li>`).join('');
    d.innerHTML = `<canvas width="192" height="192"></canvas><div class="lv">${bare ? 'ALWAYS WITH YOU' : owned ? `LV ${lvl}/${WMAX()} · DAMAGE ×${wMult(id).toFixed(2)}` : 'NOT FOUND YET'}</div><div class="nm">${w.name}</div>
      <p>${bare ? w.desc + ' Fists never level up.' : owned ? w.desc : 'Not found yet. Defeat enemies to find it.'}</p><ul>${moves}</ul>
      ${owned && !bare ? `<button class="buy" type="button" ${can ? '' : 'disabled'}>${max ? (WMAX() > WLEARN ? 'Fully tempered' : 'Every move learned') : lvl >= WLEARN ? `Temper: +4% damage · ${costTxt(c)}` : `Level up: new move + 20% damage · ${costTxt(c)}`}</button>` : ''}`;
    drawIcon(d.querySelector('canvas'), id, .78);
    const b = d.querySelector('button');
    if (b) b.addEventListener('click', () => {
      if (!can) return;
      save.shards -= c.s; save.sigils -= c.g; save.wl[id]++; persist(); sfx('buy');
      const learned = unlockList(id).find(m => m.lvl === save.wl[id]);
      renderForge(`${w.name} is now level ${save.wl[id]}: damage ×${wMult(id).toFixed(2)}.${learned ? ` New move: ${learned.name}. ${learned.how}.` : ''}`);
    });
    wrap.appendChild(d);
  }
  // the arrows: seven levels, each a better arrow with a trick of its own
  const al = Math.min(ARROW_TIERS.length, save.alv || 1), ac2 = arrowCost(al), almax = al >= ARROW_TIERS.length, alcan = !almax && save.shards >= ac2.s && save.sigils >= ac2.g;
  const da = document.createElement('div'); da.className = 'card';
  da.innerHTML = `<canvas width="192" height="192"></canvas><div class="lv">LV ${al}/${ARROW_TIERS.length} · ${save.arrows || 0}/${ARROW_MAX} IN THE QUIVER</div><div class="nm">${aTier().name}</div>
    <p>Rare arrows from fallen shooters, loosed with any weapon, for picking off the crowd: a full draw strikes the first foe in its path for ${aTier().dmg}+ damage, though bosses and champions shrug most of it off. Each level keeps the tricks of the last.</p>
    <ul>${ARROW_TIERS.map((tt, i) => `<li class="${al >= i + 1 ? 'got' : al === i ? 'next' : ''}"><b>LV${i + 1} · ${tt.name}</b> · ${tt.skill}<br><em>${tt.desc}</em></li>`).join('')}</ul>
    <button class="buy" type="button" ${alcan ? '' : 'disabled'}>${almax ? 'The finest arrows' : `Fletch better arrows · ${costTxt(ac2)}`}</button>`;
  drawIcon(da.querySelector('canvas'), 'arrow', .78);
  da.querySelector('button').addEventListener('click', () => {
    if (!alcan) return;
    save.shards -= ac2.s; save.sigils -= ac2.g; save.alv = al + 1; persist(); sfx('buy');
    renderForge(`Your arrows are now ${aTier().name}.`);
  });
  wrap.appendChild(da);

  const tw = $('#trumpCards'); tw.innerHTML = '';
  for (const id of TRUMP_ORDER) {
    const tc = TRUMPS[id], has = save.trumps[id], on = save.trump === id;
    const d2 = document.createElement('div'); d2.className = 'card' + (on ? ' on' : '');
    const lv = TL(id), uc = tCost(lv), ucan = has && lv < 3 && save.shards >= uc.s && save.sigils >= uc.g, roman = ['', 'I', 'II', 'III'];
    const ups = TRUMP_UP[id].map((u, i) => `<li class="${lv >= i + 2 ? 'got' : lv === i + 1 ? 'next' : ''}"><b>${roman[i + 2]}</b> ${u}</li>`).join('');
    d2.innerHTML = `<canvas width="192" height="192"></canvas><div class="lv">${has ? (on ? 'IN YOUR HAND' : 'INSCRIBED') + ' · ' + roman[lv] : `COSTS ${Math.round(tc.cost * cyc())} ✦`}</div><div class="nm">${tc.name}</div><p>${tc.desc}</p><ul>${ups}</ul>
      <button class="buy pink" type="button" ${!has && save.sigils < Math.round(tc.cost * cyc()) ? 'disabled' : ''}>${has ? (on ? 'Put it away' : 'Take it into battle') : `Inscribe · ${Math.round(tc.cost * cyc())} ✦`}</button>
      ${has && lv < 3 ? `<button class="buy up" type="button" ${ucan ? '' : 'disabled'}>Inscribe again → ${roman[lv + 1]} · ${costTxt(uc)}</button>` : ''}`;
    drawTrumpArt(d2.querySelector('canvas'), id);
    d2.querySelector('button').addEventListener('click', () => {
      if (!has) { const cost = Math.round(tc.cost * cyc()); if (save.sigils < cost) return; save.sigils -= cost; save.trumps[id] = true; save.trump = id; sfx('trump'); persist(); renderForge(`${tc.name} inscribed and in your hand.`); return; }
      save.trump = on ? null : id; persist(); sfx('buy'); renderForge(on ? `${tc.name} put away.` : `${tc.name} is in your hand.`);
    });
    const ub = d2.querySelector('button.up');
    if (ub) ub.addEventListener('click', () => { if (!ucan) return; save.shards -= uc.s; save.sigils -= uc.g; save.tlv[id] = lv + 1; persist(); sfx('trump'); renderForge(`${tc.name} inscribed again: level ${roman[lv + 1]}.`); });
    tw.appendChild(d2);
  }
  $('#forgeNote').textContent = note || '';
  $('#walkBtn').textContent = `Walk on: ${STAGES[roadStage()].name}`;
}
function drawTrumpArt(canvas, id) {
  const g = canvas.getContext('2d'), old = ctx; ctx = g;
  g.setTransform(canvas.width / 96, 0, 0, canvas.width / 96, 0, 0);
  const bg = g.createLinearGradient(0, 0, 0, 96);
  const cols = { brand: ['#E8945A', '#2A1D3C'], stag: ['#8FB8D8', '#2A1D5C'], mirror: ['#C9B8FF', '#2A1D5C'], phoenix: ['#D8834A', '#5A1D3C'], stillness: ['#8FE9FF', '#1C1240'] }[id];
  bg.addColorStop(0, cols[0]); bg.addColorStop(1, cols[1]); g.fillStyle = bg; rrect(14, 4, 68, 88, 8); g.fill();
  g.lineWidth = 2; g.strokeStyle = '#D8AA55'; g.stroke();
  g.save(); g.translate(48, 48);
  if (id === 'stag') { g.translate(-14, 30); g.scale(.62, .62); drawStag({ x: 0, y: 0 }, 1); }
  else if (id === 'mirror') { g.translate(0, 30); g.scale(.62, .62); g.globalAlpha = .5; g.save(); g.translate(-14, 0); drawHumanoid(HERO, { arm: -.6, weapon: 'staff' }); g.restore(); g.globalAlpha = 1; g.translate(12, 0); g.scale(-1, 1); drawHumanoid(HERO, { arm: -.6, weapon: 'staff' }); }
  else if (id === 'brand') { g.save(); g.rotate(-.6); g.scale(1.1, 1.1); drawWeapon('sword', { glow: '#FF8A4A' }); g.restore(); g.fillStyle = '#9FE0FF'; g.beginPath(); g.moveTo(-18, 18); g.lineTo(-12, 8); g.lineTo(-6, 18); g.fill(); g.strokeStyle = '#E8E0FF'; g.lineWidth = 2; g.beginPath(); g.moveTo(14, -24); g.lineTo(8, -12); g.lineTo(16, -10); g.lineTo(10, 2); g.stroke(); }
  else if (id === 'phoenix') { g.fillStyle = '#EED48A'; g.beginPath(); g.moveTo(0, -30); g.quadraticCurveTo(30, -10, 26, 20); g.quadraticCurveTo(10, 4, 0, 30); g.quadraticCurveTo(-10, 4, -26, 20); g.quadraticCurveTo(-30, -10, 0, -30); g.fill(); g.fillStyle = '#D04A62'; circle(0, -6, 8); g.fill(); }
  else { g.strokeStyle = '#FFFFFF'; g.lineWidth = 3; circle(0, 0, 26); g.stroke(); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -18); g.moveTo(0, 0); g.lineTo(12, 6); g.stroke(); }
  g.restore(); ctx = old;
  paintCard(canvas, canvas.width / 96);
}

// ---------- title & buttons ----------
function refreshTitle() {
  const has = save.started;
  $('#contBtn').hidden = !has;
  $('#newBtn').textContent = has ? 'New journey' : 'Begin the journey';
  $('#newBtn').className = has ? 'cta alt' : 'cta';
  const found = WEAPON_ORDER.filter(id => save.owned[id]).map(id => WEAPONS[id].name).join(', ');
  const ends = endingsSeen();
  $('#saveInfo').textContent = has ? `Saved: ${save.atChoice ? 'the Rim of the Abyss, deck in hand' : STAGES[roadStage()].name}${save.done ? ' (the road walked)' : ''}${save.cycle ? ', cycle ' + (save.cycle + 1) : ''}${ends ? ` · endings ${ends}/3` : ''} · ${save.shards} shards · ${save.sigils} sigils · ${found}` : '';
}
let confirmNew = false;
$('#contBtn').addEventListener('click', () => { audioInit(); if (save.atChoice && window.BRANCH) BRANCH.resume(); else if (save.stage > 0) openForge(); else play(0); }); // (left with the deck in hand: back to the Rim)
$('#newBtn').addEventListener('click', () => {
  audioInit();
  if (save.started && !confirmNew) { confirmNew = true; $('#newBtn').textContent = 'Tap again to erase your save'; return; }
  confirmNew = false; save = freshSave(); gearChanged(); persist(); play(0);
});
$('#walkBtn').addEventListener('click', () => play(roadStage()));
$('#forgeTitleBtn').addEventListener('click', () => { mode = 'title'; refreshTitle(); showOnly('titleOv'); });
$('#pauseBtn').addEventListener('click', pauseGame);
// one button (and the M key) silences everything, sound and music together, and remembers it; turning it back on restores both
const SPK = (on) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/>${on ? '<path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' : '<path d="M16.5 9.5l5 5M21.5 9.5l-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'}</svg>`;
function refreshMute() { const on = sfxOn || musicOn, b = $('#muteBtn'); if (!b) return; b.innerHTML = SPK(on); b.setAttribute('aria-label', on ? 'Mute sound' : 'Unmute sound'); b.setAttribute('aria-pressed', on ? 'false' : 'true');
  if ($('#sfxBtn')) $('#sfxBtn').textContent = 'Sound: ' + (sfxOn ? 'on' : 'off'); if ($('#musicBtn')) $('#musicBtn').textContent = 'Music: ' + (musicOn ? 'on' : 'off'); }
function toggleMute() { const on = !(sfxOn || musicOn); sfxOn = on; try { localStorage.setItem('shadowroad-sfx', on ? '1' : '0'); } catch (e) {} setMusic(on); refreshMute(); }
$('#muteBtn').addEventListener('click', (e) => { e.stopPropagation(); toggleMute(); });
window.addEventListener('keydown', (e) => { if (e.code === 'KeyM' && !e.repeat && !(e.target && /INPUT|TEXTAREA/.test(e.target.tagName))) toggleMute(); });
refreshMute();
$('#resumeBtn').addEventListener('click', resume);
$('#sfxBtn').addEventListener('click', () => { setTimeout(refreshMute); sfxOn = !sfxOn; try { localStorage.setItem('shadowroad-sfx', sfxOn ? '1' : '0'); } catch (e) {} $('#sfxBtn').textContent = 'Sound: ' + (sfxOn ? 'on' : 'off'); });
$('#quitBtn').addEventListener('click', () => { persist(); mode = 'title'; refreshTitle(); showOnly('titleOv'); playMusic('title'); });
$('#musicBtn').addEventListener('click', () => { setTimeout(refreshMute); setMusic(!musicOn); $('#musicBtn').textContent = 'Music: ' + (musicOn ? 'on' : 'off'); });
$('#retryBtn').addEventListener('click', () => play(roadStage()));
$('#overForgeBtn').addEventListener('click', () => openForge('REGROUP AND REFORGE'));
$('#cycleBtn').addEventListener('click', () => { // a new cycle: the road from the start, and the choice on the Rim to make again
  save.cycle++; save.stage = 0; save.branch = null; save.done = false; save.atChoice = false;
  if (save.silverArm) { save.owned.fists = true; save.weapon = 'fists'; } // (it starts with Benedict's silver arm on, once it is won)
  if (window.BRANCH) BRANCH.newCycle(); // (and each relic won on the other roads takes hold: their files)
  persist(); openForge('CYCLE ' + (save.cycle + 1) + ' BEGINS');
});
onKeyMenu = (e) => {
  if (mode === 'inv') return invKey(e); // the inventory has its own keys (inventory.js)
  if (mode === 'win' && performance.now() - winAt < 900 && (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space')) { e.preventDefault(); return true; } // (fresh from an ending's skip)
  if (e.code === 'Enter' || e.code === 'NumpadEnter') { // Enter takes the main choice on any menu
    const btn = { title: $('#contBtn').hidden ? $('#newBtn') : $('#contBtn'), forge: $('#walkBtn'), pause: $('#resumeBtn'), over: document.querySelector('#overOv .cta'), win: document.querySelector('#winOv .cta') }[mode];
    if (btn && document.activeElement?.tagName !== 'BUTTON') { btn.click(); return true; }
  }
  if (mode === 'pause' && e.code === 'Escape') { resume(); return true; }
  if (mode === 'play' && (e.code === 'Escape' || e.code === 'KeyP')) { pauseGame(); return true; }
  return mode !== 'play';
};

// ---------- layout: the world is 360 units tall; wider screens see more of the street ----------
let ox = 0, oy = 0;
function onInputModeChange() { if (mode === 'pause') $('#moveList').innerHTML = moveListHtml(P.w); layout(); }
function layout() {
  const r = app.getBoundingClientRect(), cw = r.width, ch = r.height;
  if (!cw || !ch) return;
  const land = cw / ch > 1.15 || KBD; // a desktop window is never asked to rotate
  app.classList.toggle('land', land); app.classList.toggle('port', !land);
  if (!land) { joyId = null; joyMx = joyMy = 0; knob.style.transform = ''; clearInput(); }
  VW = clamp(Math.round(cw / ch * VIEW_H), 480, 680);
  const s = Math.min(cw / VW, ch / VIEW_H), gw = VW * s, gh = VIEW_H * s;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  K = s * dpr;
  cv.width = Math.round(gw * dpr); cv.height = Math.round(gh * dpr);
  Object.assign(cv.style, { width: gw + 'px', height: gh + 'px', left: (cw - gw) / 2 + 'px', top: (ch - gh) / 2 + 'px' });
  Object.assign($('#hud').style, { left: (cw - gw) / 2 + 'px', top: (ch - gh) / 2 + 'px', width: gw + 'px', height: gh + 'px' });
  $('#hud').style.setProperty('--fi', '6px'); // the HUD's inset from the edge (there is no frame now)
  if (stage) { bgKey = ''; buildBackground(stage.theme, stageIdx * 97 + 13); camX = clamp(camX, 0, Math.max(0, stage.len - VW)); }
}
window.addEventListener('resize', layout);
if (window.ResizeObserver) new ResizeObserver(layout).observe(app);

// ---------- main loop ----------
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame); // ask for the next frame first, so nothing that goes wrong below can stop the game
  try { step(now); } catch (e) { // a drawing failure falls back to the plain renderer rather than freezing
    console.error(e); if (typeof PAINT_Q !== 'undefined' && PAINT_Q > 0) { PAINT_Q = 0; perfLock = true; } if (inkG && ctx === inkG) ctx = mainCtx;
  }
}
function step(now) {
  const rawDt = Math.min(.25, (now - last) / 1000); // real seconds, even if the frame rate drops
  let dt = Math.min(1 / 30, rawDt); last = now;
  const t = now / 1000;
  if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0) $('#banner').classList.remove('on'); }
  const live = mode === 'play' && !app.classList.contains('port');
  if (live) {
    readMove();
    if (input.light) P.holdL = (P.holdL || 0) + rawDt; else { P.holdL = 0; P.holdUsed = false; } // real time, so hit freezes don't stall a held button
    P.holdH = input.heavy ? (P.holdH || 0) + rawDt : 0;
    if (slowmo > 0) { slowmo -= dt; dt *= .3; }
    const froze = hitstop > 0;
    if (froze) hitstop -= dt;
    else if (zoneTrans) updateZoneTrans(dt);
    else { updatePlayer(dt); updateWorld(dt); }
    updateFx(hitstop > 0 ? dt * .25 : dt);
    shakeMag = Math.max(0, shakeMag - dt * 30); zoom = Math.max(0, zoom - dt * .25);
    flashT = Math.max(0, flashT - dt); hurtFlash = Math.max(0, hurtFlash - dt);
    if (!froze) for (const k in pressed) pressed[k] = false; // a press during a hit freeze is kept until the action has actually resumed
    hudTick();
  } else if (mode === 'title' && P) { // the title screen keeps a gentle scene moving behind it
    P.walk += dt * 8; updateFx(dt);
  }
  ctx.setTransform(K, 0, 0, K, 0, -Y_OFF * K);
  if (stage && P) { drawScene(t); if (live) paintPerf(rawDt); }
}

// ---------- boot ----------
layout();
startStage(roadStage());
$('#banner').classList.remove('on'); bannerT = 0;
P.x = 200; P.state = 'walk';
[['slime', 330], ['boar', 420]].forEach(([k, x]) => { const e = spawnEnemy(k, 1); e.x = x; e.facing = -1; });
refreshTitle(); showOnly('titleOv'); playMusic('title');
requestAnimationFrame(frame);
