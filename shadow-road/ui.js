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
    if (save.trump) trumpBtn.textContent = 'TRUMP';
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
const OVERLAYS = ['titleOv', 'forgeOv', 'pauseOv', 'overOv', 'winOv'];
function showOnly(id) {
  OVERLAYS.forEach(o => { $('#' + o).hidden = o !== id; });
  app.classList.toggle('nocontrols', id !== null && id !== 'pauseOv');
  app.classList.toggle('playing', id === null);
  $('#hud').hidden = id === 'titleOv' || id === 'forgeOv' || id === 'winOv';
}
function play(i) {
  save.started = true; persist(); clearInput();
  startStage(i); mode = 'play'; showOnly(null);
}
function pauseGame() { if (mode !== 'play') return; mode = 'pause'; showOnly('pauseOv'); $('#moveTitle').textContent = WEAPONS[P.w].name + ' moves'; $('#moveList').innerHTML = moveListHtml(P.w); $('#sfxBtn').textContent = 'Sound: ' + (sfxOn ? 'on' : 'off'); }
function resume() { mode = 'play'; clearInput(); showOnly(null); }
function gameOver() {
  mode = 'over'; persist();
  $('#overText').textContent = `${stage.name} got the better of you this time. You keep everything you picked up: ${runShards} shards and ${runSigils} sigil${runSigils === 1 ? '' : 's'}. Spend them at the forge, or jump straight back in.`;
  showOnly('overOv');
}
function stageClear() {
  for (const k of loot) { // sweep up loot still on the ground
    if (k.kind === 'shard') { save.shards += k.val; runShards += k.val; }
    else if (k.kind === 'sigil') { save.sigils += k.val; runSigils += k.val; }
    else if (k.kind === 'weapon') save.owned[k.weapon] = true;
  }
  loot = [];
  save.stage += 1; persist();
  if (save.stage >= STAGES.length) {
    mode = 'win';
    $('#winText').textContent = 'All three shadows are behind you. Walking the road again starts a harder cycle: enemies hit harder and have more health, but drop more shards. Your weapons, levels and Trump cards come with you.';
    showOnly('winOv');
  } else openForge(`WORLD CLEARED: +${runShards} SHARDS, +${runSigils} SIGILS`);
}

// ---------- explaining moves: inputs shown as button chips ----------
const CHIP = { A: ['ATTACK', 'a'], H: ['HEAVY', 'h'], HOLDA: ['HOLD ATTACK', 'a'], HOLD: ['HOLD HEAVY', 'h'], HOLD3: ['HOLD HEAVY TO 3RD FLASH', 'h'], RUN: ['RUN', 'r'], WALK: ['WALK', 'r'], JUMP: ['JUMP', 'j'], DODGE: ['DODGE', 'd'] };
const KEY_INPUTS = { RH: ['DODGE', '+H'], J2: ['JUMP', 'JUMP'], AX: ['JUMP', '+HOLDA'], X: ['HOLDA'], M: ['WALK', '+A'], AH: ['JUMP', '+H'], HC: ['HOLD'], D: ['RUN', '+A'], DH: ['RUN', '+H'], A: ['JUMP', '+A'], R: ['DODGE', '+A'] };
function inputsFor(id, m) {
  if (!m.key) return ['HOLD3'];
  if (m.seq) return m.seq;
  if (KEY_INPUTS[m.key]) return KEY_INPUTS[m.key];
  return m.key.split('').map((c, i) => c === 'L' ? 'A' : (id === 'sword' && i === 0 ? 'HOLD' : 'H'));
}
function chips(id, m) {
  return '<span class="chips">' + inputsFor(id, m).map((tk, i) => {
    const plus = tk[0] === '+', c = CHIP[plus ? tk.slice(1) : tk];
    return (i ? `<i>${plus ? '+' : '›'}</i>` : '') + `<span class="chip ${c[1]}">${c[0]}</span>`;
  }).join('') + '</span>';
}
const BASICS = [
  { key: 'L', name: 'Combo', desc: 'Tap Attack again and again to chain the full combo.', seq: ['A', 'A', 'A'] },
  { key: 'X', name: 'Launcher', desc: 'Hold Attack to throw an enemy into the air. Tap Jump right after to leap up after them.' },
  { key: 'A', name: 'Air combo', desc: 'Up to three Attacks in the air. Air hits keep enemies floating and hit harder; the third drives them into the ground.', seq: ['JUMP', '+A', 'A', 'A'] },
  { key: 'H', name: 'Heavy', desc: 'A launcher or finisher. With the Great Sword, hold to charge. Mix it into combos below.', seq: ['H'] },
  { key: 'D', name: 'Dash attack', desc: 'Flick the joystick twice to run, then attack.' },
  { key: 'R', name: 'Dodge counter', desc: 'Tap Attack during a roll to spring out of it.' },
];
function moveListHtml(id) {
  const lvl = save.wl[id], tree = WEAPONS[id].tree;
  const basics = BASICS.map(b => `<li class="got"><b>${b.name}</b> ${chips(id, b)}<br><em>${b.desc}</em></li>`).join('');
  const combos = Object.values(tree).filter(m => m.name && !m.lvl && m.key !== 'X').map(m => `<li class="got"><b>${m.name}</b> ${chips(id, m)}</li>`).join('');
  const learned = unlockList(id).map(m => `<li class="${lvl >= m.lvl ? 'got' : m.lvl === lvl + 1 ? 'next' : ''}"><b>LV${m.lvl} · ${m.name}</b> ${chips(id, m)}<br><em>${lvl >= m.lvl ? m.desc : m.lvl === lvl + 1 ? 'Next at the forge: ' + m.desc : 'Locked: ' + m.desc}</em></li>`).join('');
  return `<ul class="moves">${basics}${combos}${learned}</ul>`;
}

// ---------- the forge ----------
const wCost = (lvl) => ({ s: 30 * lvl, g: lvl >= 2 ? lvl - 1 : 0 });
const aCost = (lvl) => ({ s: 35 * lvl, g: lvl >= 3 ? lvl - 2 : 0 });
const costTxt = (c) => `${c.s} ◆${c.g ? ` + ${c.g} ✦` : ''}`;
function openForge(kicker) {
  mode = 'forge'; showOnly('forgeOv');
  $('#forgeKicker').textContent = kicker || 'BETWEEN WORLDS';
  renderForge();
  $('#forgeOv').scrollTop = 0;
}
function renderForge(note) {
  $('#fShards').textContent = save.shards; $('#fSigils').textContent = save.sigils;
  const wrap = $('#forgeCards'); wrap.innerHTML = '';
  for (const id of WEAPON_ORDER) {
    const w = WEAPONS[id], owned = save.owned[id], lvl = save.wl[id], max = lvl >= 5, c = wCost(lvl);
    const bare = id === 'fists'; // fists never level up
    const can = owned && !bare && !max && save.shards >= c.s && save.sigils >= c.g;
    const d = document.createElement('div'); d.className = 'card' + (owned ? '' : ' locked');
    const moves = unlockList(id).map(m => `<li class="${lvl >= m.lvl ? 'got' : m.lvl === lvl + 1 ? 'next' : ''}"><b>LV${m.lvl} · ${m.name}</b> ${chips(id, m)}<br><em>${m.desc}</em></li>`).join('');
    d.innerHTML = `<canvas width="192" height="192"></canvas><div class="lv">${bare ? 'ALWAYS WITH YOU' : owned ? `LV ${lvl}/5 · DAMAGE ×${wMult(id).toFixed(1)}` : 'NOT FOUND YET'}</div><div class="nm">${w.name}</div>
      <p>${bare ? w.desc + ' Bare hands never level up: find weapons to grow stronger.' : owned ? w.desc + ' All its combos are yours from the start; each level teaches a new move.' : 'Not found yet. Any enemy in any world might be carrying it, and each world without a find makes the next one likelier.'}</p><ul>${moves}</ul>
      ${owned && !bare ? `<button class="buy" type="button" ${can ? '' : 'disabled'}>${max ? 'Every move learned' : `Level up: new move + 20% damage · ${costTxt(c)}`}</button>` : ''}`;
    drawIcon(d.querySelector('canvas'), id, .78);
    const b = d.querySelector('button');
    if (b) b.addEventListener('click', () => {
      if (!can) return;
      save.shards -= c.s; save.sigils -= c.g; save.wl[id]++; persist(); sfx('buy');
      const learned = unlockList(id).find(m => m.lvl === save.wl[id]);
      renderForge(`${w.name} is now level ${save.wl[id]}: damage ×${wMult(id).toFixed(1)}.${learned ? ` New move: ${learned.name}. ${learned.how}.` : ''}`);
    });
    wrap.appendChild(d);
  }
  const a = save.armor, ac = aCost(a), amax = a >= 5, acan = !amax && save.shards >= ac.s && save.sigils >= ac.g;
  const d = document.createElement('div'); d.className = 'card';
  d.innerHTML = `<canvas width="192" height="192"></canvas><div class="lv">LV ${a}/5</div><div class="nm">Rose Mail</div>
    <p>Max health ${maxHp()}${amax ? '' : ` → ${maxHp() + 30}`}. Health refills at the start of every world.</p>
    <button class="buy" type="button" ${acan ? '' : 'disabled'}>${amax ? 'Fully forged' : `Reinforce · ${costTxt(ac)}`}</button>`;
  drawIcon(d.querySelector('canvas'), 'fists', .78);
  d.querySelector('button').addEventListener('click', () => {
    if (!acan) return;
    save.shards -= ac.s; save.sigils -= ac.g; save.armor++; persist(); sfx('buy');
    renderForge(`Rose Mail reinforced: max health ${maxHp()}.`);
  });
  wrap.appendChild(d);

  const tw = $('#trumpCards'); tw.innerHTML = '';
  for (const id of TRUMP_ORDER) {
    const tc = TRUMPS[id], has = save.trumps[id], on = save.trump === id;
    const d2 = document.createElement('div'); d2.className = 'card' + (on ? ' on' : '');
    d2.innerHTML = `<canvas width="192" height="192"></canvas><div class="lv">${has ? (on ? 'IN YOUR HAND' : 'INSCRIBED') : `COSTS ${tc.cost} ✦`}</div><div class="nm">${tc.name}</div><p>${tc.desc}</p>
      <button class="buy pink" type="button" ${!has && save.sigils < tc.cost ? 'disabled' : ''}>${has ? (on ? 'Put it away' : 'Take it into battle') : `Inscribe · ${tc.cost} ✦`}</button>`;
    drawTrumpArt(d2.querySelector('canvas'), id);
    d2.querySelector('button').addEventListener('click', () => {
      if (!has) { if (save.sigils < tc.cost) return; save.sigils -= tc.cost; save.trumps[id] = true; save.trump = id; sfx('trump'); persist(); renderForge(`${tc.name} inscribed and in your hand.`); return; }
      save.trump = on ? null : id; persist(); sfx('buy'); renderForge(on ? `${tc.name} put away.` : `${tc.name} is in your hand.`);
    });
    tw.appendChild(d2);
  }
  $('#forgeNote').textContent = note || '';
  $('#walkBtn').textContent = `Walk on: ${STAGES[Math.min(save.stage, STAGES.length - 1)].name}`;
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
}

// ---------- title & buttons ----------
function refreshTitle() {
  const has = save.started;
  $('#contBtn').hidden = !has;
  $('#newBtn').textContent = has ? 'New journey' : 'Begin the journey';
  $('#newBtn').className = has ? 'cta alt' : 'cta';
  const found = WEAPON_ORDER.filter(id => save.owned[id]).map(id => WEAPONS[id].name).join(', ');
  $('#saveInfo').textContent = has ? `Saved: ${STAGES[Math.min(save.stage, STAGES.length - 1)].name}${save.cycle ? ', cycle ' + (save.cycle + 1) : ''} · ${save.shards} shards · ${save.sigils} sigils · ${found}` : '';
}
let confirmNew = false;
$('#contBtn').addEventListener('click', () => { audioInit(); if (save.stage > 0) openForge(); else play(0); });
$('#newBtn').addEventListener('click', () => {
  audioInit();
  if (save.started && !confirmNew) { confirmNew = true; $('#newBtn').textContent = 'Tap again to erase your save'; return; }
  confirmNew = false; save = freshSave(); persist(); play(0);
});
$('#walkBtn').addEventListener('click', () => play(Math.min(save.stage, STAGES.length - 1)));
$('#forgeTitleBtn').addEventListener('click', () => { mode = 'title'; refreshTitle(); showOnly('titleOv'); });
$('#pauseBtn').addEventListener('click', pauseGame);
$('#resumeBtn').addEventListener('click', resume);
$('#sfxBtn').addEventListener('click', () => { sfxOn = !sfxOn; try { localStorage.setItem('shadowroad-sfx', sfxOn ? '1' : '0'); } catch (e) {} $('#sfxBtn').textContent = 'Sound: ' + (sfxOn ? 'on' : 'off'); });
$('#quitBtn').addEventListener('click', () => { persist(); mode = 'title'; refreshTitle(); showOnly('titleOv'); });
$('#retryBtn').addEventListener('click', () => play(save.stage));
$('#overForgeBtn').addEventListener('click', () => openForge('REGROUP AND REFORGE'));
$('#cycleBtn').addEventListener('click', () => { save.cycle++; save.stage = 0; persist(); openForge('CYCLE ' + (save.cycle + 1) + ' BEGINS'); });
onKeyMenu = (e) => {
  if (mode === 'pause' && e.code === 'Escape') { resume(); return true; }
  if (mode === 'play' && (e.code === 'Escape' || e.code === 'KeyP')) { pauseGame(); return true; }
  return mode !== 'play';
};

// ---------- layout: the world is 360 units tall; wider screens see more of the street ----------
let ox = 0, oy = 0;
function layout() {
  const r = app.getBoundingClientRect(), cw = r.width, ch = r.height;
  if (!cw || !ch) return;
  const land = cw / ch > 1.15;
  app.classList.toggle('land', land); app.classList.toggle('port', !land);
  if (!land) { joyId = null; joyMx = joyMy = 0; knob.style.transform = ''; clearInput(); }
  VW = clamp(Math.round(cw / ch * VIEW_H), 480, 680);
  const s = Math.min(cw / VW, ch / VIEW_H), gw = VW * s, gh = VIEW_H * s;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  K = s * dpr;
  cv.width = Math.round(gw * dpr); cv.height = Math.round(gh * dpr);
  Object.assign(cv.style, { width: gw + 'px', height: gh + 'px', left: (cw - gw) / 2 + 'px', top: (ch - gh) / 2 + 'px' });
  Object.assign($('#hud').style, { left: (cw - gw) / 2 + 'px', top: (ch - gh) / 2 + 'px', width: gw + 'px', height: gh + 'px' });
  if (stage) { bgKey = ''; buildBackground(stage.theme, stageIdx * 97 + 13); camX = clamp(camX, 0, Math.max(0, stage.len - VW)); }
}
window.addEventListener('resize', layout);
if (window.ResizeObserver) new ResizeObserver(layout).observe(app);

// ---------- main loop ----------
let last = performance.now();
function frame(now) {
  const rawDt = Math.min(.25, (now - last) / 1000); // real seconds, even if the frame rate drops
  let dt = Math.min(1 / 30, rawDt); last = now;
  const t = now / 1000;
  if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0) $('#banner').classList.remove('on'); }
  const live = mode === 'play' && !app.classList.contains('port');
  if (live) {
    readMove();
    if (input.light) P.holdL = (P.holdL || 0) + rawDt; else { P.holdL = 0; P.holdUsed = false; } // real time, so hit freezes don't stall a held button
    if (slowmo > 0) { slowmo -= dt; dt *= .3; }
    if (hitstop > 0) hitstop -= dt;
    else { updatePlayer(dt); updateWorld(dt); }
    updateFx(hitstop > 0 ? dt * .25 : dt);
    shakeMag = Math.max(0, shakeMag - dt * 30); zoom = Math.max(0, zoom - dt * .25);
    flashT = Math.max(0, flashT - dt); hurtFlash = Math.max(0, hurtFlash - dt);
    for (const k in pressed) pressed[k] = false;
    hudTick();
  } else if (mode === 'title' && P) { // the title screen keeps a gentle scene moving behind it
    P.walk += dt * 8; updateFx(dt);
  }
  ctx.setTransform(K, 0, 0, K, 0, -Y_OFF * K);
  if (stage && P) drawScene(t);
  requestAnimationFrame(frame);
}

// ---------- boot ----------
layout();
startStage(Math.min(save.stage, STAGES.length - 1));
$('#banner').classList.remove('on'); bannerT = 0;
P.x = 200; P.state = 'walk';
[['slime', 330], ['boar', 420]].forEach(([k, x]) => { const e = spawnEnemy(k, 1); e.x = x; e.facing = -1; });
refreshTitle(); showOnly('titleOv');
requestAnimationFrame(frame);
