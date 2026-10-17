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
function pauseGame() { if (mode !== 'play') return; mode = 'pause'; showOnly('pauseOv'); $('#sfxBtn').textContent = 'Sound: ' + (sfxOn ? 'on' : 'off'); }
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
    const can = owned && !max && save.shards >= c.s && save.sigils >= c.g;
    const d = document.createElement('div'); d.className = 'card' + (owned ? '' : ' locked');
    const moves = unlockList(id).map(m => `<li class="${lvl >= m.lvl ? 'got' : m.lvl === lvl + 1 ? 'next' : ''}">LV${m.lvl} ${m.name} <em>· ${m.how}</em></li>`).join('');
    d.innerHTML = `<canvas width="192" height="192"></canvas><div class="lv">${owned ? `LV ${lvl}/5 · DAMAGE ×${wMult(id).toFixed(1)}` : 'NOT FOUND YET'}</div><div class="nm">${w.name}</div>
      <p>${owned ? w.desc : (id === 'sword' ? 'A brass automaton in the Skyport carries it.' : id === 'staff' ? 'A moss golem in Bloomwild Vale carries it.' : 'A thornboar in Bloomwild Vale carries it.') + ' Look for the gold shimmer.'}</p><ul>${moves}</ul>
      ${owned ? `<button class="buy" type="button" ${can ? '' : 'disabled'}>${max ? 'Every move learned' : `Learn next move · ${costTxt(c)}`}</button>` : ''}`;
    drawIcon(d.querySelector('canvas'), id, .78);
    const b = d.querySelector('button');
    if (b) b.addEventListener('click', () => {
      if (!can) return;
      save.shards -= c.s; save.sigils -= c.g; save.wl[id]++; persist(); sfx('buy');
      const learned = unlockList(id).find(m => m.lvl === save.wl[id]);
      renderForge(`${w.name} is now level ${save.wl[id]}.${learned ? ` New move: ${learned.name} (${learned.how}).` : ''}`);
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
  const cols = { stag: ['#8FB8D8', '#2A1D5C'], mirror: ['#C9B8FF', '#2A1D5C'], phoenix: ['#D8834A', '#5A1D3C'], stillness: ['#8FE9FF', '#1C1240'] }[id];
  bg.addColorStop(0, cols[0]); bg.addColorStop(1, cols[1]); g.fillStyle = bg; rrect(14, 4, 68, 88, 8); g.fill();
  g.lineWidth = 2; g.strokeStyle = '#D8AA55'; g.stroke();
  g.save(); g.translate(48, 48);
  if (id === 'stag') { g.translate(-14, 30); g.scale(.62, .62); drawStag({ x: 0, y: 0 }, 1); }
  else if (id === 'mirror') { g.translate(0, 30); g.scale(.62, .62); g.globalAlpha = .5; g.save(); g.translate(-14, 0); drawHumanoid(HERO, { arm: -.6, weapon: 'staff' }); g.restore(); g.globalAlpha = 1; g.translate(12, 0); g.scale(-1, 1); drawHumanoid(HERO, { arm: -.6, weapon: 'staff' }); }
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
  let dt = Math.min(1 / 30, (now - last) / 1000); last = now;
  const t = now / 1000;
  if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0) $('#banner').classList.remove('on'); }
  const live = mode === 'play' && !app.classList.contains('port');
  if (live) {
    readMove();
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
