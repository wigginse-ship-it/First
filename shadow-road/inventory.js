'use strict';
// ---------- the inventory: a spread of two cards on the table, opened from the pause menu (or the forge) ----------
// The left card shows the prince in what he wears, his four slots, his defense and the set bonuses awake on him; the
// right card is the bag (24 places), and the chosen piece: its stats, its set, its enchantments and how it compares
// with what he has on. Tap a piece to look at it and tap it again to put it on (or take it off); on a keyboard the
// arrows move, Enter puts on or takes off, X salvages and Esc goes back. The game stays paused the whole time.
let invFrom = 'pause', invSel = { k: 'eq', slot: 'mail' }, invSalvArm = null, invNote = '';
const invCols = () => { const el = $('#invBag'); const n = el ? getComputedStyle(el).gridTemplateColumns.split(' ').length : 6; return n > 1 ? n : 6; }; // 6 across, or 8 on a short screen
const INV_SLOT_ORDER = ['mail', 'gauntlets', 'waist', 'pants'];
const pct = (v) => Math.round(v * 100) + '%';
const esc = (t) => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function openInventory(from) {
  invFrom = from || (mode === 'forge' ? 'forge' : 'pause'); mode = 'inv'; invSalvArm = null; invNote = '';
  if (!selItem()) invSel = save.gear.bag.length ? { k: 'bag', i: 0 } : { k: 'eq', slot: 'mail' };
  $('#invOv').classList.toggle('glass', invFrom === 'pause');
  showOnly('invOv'); renderInventory(); $('#invOv').scrollTop = 0;
  if (KBD) focusSel();
}
function closeInventory() {
  invSalvArm = null; persist();
  if (invFrom === 'forge') { mode = 'forge'; showOnly('forgeOv'); renderForge(); }
  else { mode = 'pause'; showOnly('pauseOv'); $('#invBtn').textContent = invBtnText(); refreshHud(); }
}
const invBtnText = () => `Inventory · ${save.gear.bag.length}/${BAG_MAX}`;
function selItem() { const g = save.gear; return invSel.k === 'eq' ? g.eq[invSel.slot] : g.bag[invSel.i]; }

// ---------- what a piece says about itself ----------
function setLine(id, n, would) { // a set's bonuses at n pieces worn (would: how many if this piece went on)
  const S = GEAR_SETS[id], row = (need, b, label) => `<li class="${n >= need ? 'got' : would >= need ? 'next' : ''}"><b>${label}</b> ${esc(b.txt)}${n < need && would >= need ? ' <em>(this piece would wake it)</em>' : ''}</li>`;
  return row(2, S.b2, '2 pieces:') + row(4, S.b4, `4 pieces · ${esc(S.b4.name)}:`);
}
function itemHtml(it, where) {
  const S = GEAR_SETS[it.set], g = save.gear, worn = where === 'eq', cur = g.eq[it.slot], n = setCounts(g.eq)[it.set] || 0;
  const would = worn ? n : n + (cur && cur.set === it.set ? 0 : 1);
  let h = `<div class="inv-name ${it.ench.length ? 'ench' : ''}" style="--sc:${S.col}">${esc(itemName(it))}</div>
    <div class="inv-sub">${['', 'I', 'II', 'III', 'IV', 'V'][it.set]} · ${esc(S.name)} · ${SLOT_NAME[it.slot]}${it.q ? ` · quality +${it.q}` : ''}${worn ? ' · <b>worn</b>' : ''}</div>
    <ul class="inv-stat"><li><b>Defense ${itemDef(it)}</b> · <b>+${itemHp(it)} max health</b></li>`;
  for (const a of it.ench) h += `<li class="ench">✦ ${esc(affixTxt(it, a))}</li>`;
  h += '</ul>';
  if (!worn) { // set against what he has on in that slot
    const after = Object.assign({}, g.eq, { [it.slot]: it }), A = statsFor(after), B = statsFor(g.eq);
    const dd = A.def - B.def, dh = A.hp - B.hp, sg = (v) => (v > 0 ? '+' : '') + v, cl = (v) => v > 0 ? 'up' : v < 0 ? 'down' : '';
    h += `<div class="inv-cmp"><div>${cur ? `Instead of <b>${esc(itemName(cur))}</b>` : `The ${SLOT_NAME[it.slot].toLowerCase()} slot is empty`}</div>
      <span class="${cl(dd)}">Defense ${sg(dd)}</span> · <span class="${cl(dh)}">Health ${sg(Math.round(dh))}</span> · blows land <span class="${cl(dd)}">${pct(gearDR(A.def))}</span> softer (now ${pct(gearDR(B.def))})`;
    if (cur) { const lose = cur.ench.filter(a => !it.ench.some(b => b.k === a.k)); if (lose.length) h += `<div class="down">Loses: ${lose.map(a => esc(affixTxt(cur, a))).join(', ')}</div>`; }
    const nb = setCounts(after), na = setCounts(g.eq);
    for (const id in na) if ((nb[id] || 0) < na[id] && na[id] >= 2 && (nb[id] || 0) < (na[id] >= 4 ? 4 : 2)) h += `<div class="down">Breaks the ${esc(GEAR_SETS[id].name)} ${na[id] >= 4 ? '4' : '2'}-piece bonus</div>`;
    h += '</div>';
  }
  h += `<ul class="inv-set"><li class="hd">${esc(S.name)} · ${n}/4 worn</li>${setLine(it.set, n, would)}</ul>
    <p class="inv-look">${esc(S.look)}. Found in ${esc(S.where)}.</p>`;
  return h;
}
function statsHtml() {
  const st = statsFor(save.gear.eq), rows = [`<b>Defense ${st.def}</b>: blows land ${pct(gearDR(st.def))} softer`, `<b>Max health ${maxHp()}</b>`];
  const lines = [];
  for (const k of AFFIX_IDS) if (k === 'hp' ? st.hp - (st.pieceHp || 0) > .5 : st[k]) { const A = AFFIXES[k]; if (k === 'hp') { lines.push(`+${Math.round(st.hp - st.pieceHp)} max health from enchantments`); continue; } lines.push(A.pct ? `+${pct(st[k])} ${A.txt}` : A.sec ? `+${st[k].toFixed(2)}s ${A.txt}` : `+${Math.round(st[k])} ${A.txt}`); }
  const n = setCounts(save.gear.eq), sets = Object.keys(n).sort((a, b) => n[b] - n[a]);
  let h = `<div class="inv-totals">${rows.join(' · ')}</div>`;
  if (lines.length) h += `<div class="inv-aff">${lines.map(esc).join(' · ')}</div>`;
  h += sets.length ? sets.map(id => `<ul class="inv-set"><li class="hd" style="color:${GEAR_SETS[id].col}">${esc(GEAR_SETS[id].name)} · ${n[id]}/4</li>${setLine(+id, n[id], n[id])}</ul>`).join('')
    : '<p class="small">No armor yet: he walks in his traveller\'s clothes. Armor drops from foes, more often from glowing elites, champions and bosses, and from the rooms behind the card gates.</p>';
  return h;
}

// ---------- drawing ----------
function drawInvFigure(look) {
  const cvf = $('#invFig'); if (!cvf) return;
  const g = cvf.getContext('2d'), old = ctx; ctx = g;
  try {
    const s = cvf.width / 80; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cvf.width, cvf.height); g.setTransform(s, 0, 0, s, 0, 0);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(40, 103, 20, 3.4, 0, 0, TAU); g.fill();
    g.translate(42, 102); g.scale(1.12, 1.12);
    if (look.enchanted) { g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(0, -42, 6, 0, -42, 50); gr.addColorStop(0, 'rgba(232,192,96,.22)'); gr.addColorStop(1, 'rgba(184,140,255,0)'); g.fillStyle = gr; g.fillRect(-50, -100, 100, 100); g.restore(); }
    // facing us, empty-handed, arms easy at his sides: the armor is what's on show
    drawHumanoid(look, { weapon: 'fists', arm: 1.45, elbow: .2, backArm: 1.65, backElbow: .2, openHand: 1, Y: .98, look: 0, breath: 0, legs: { f: -4, b: 4, fk: .8, bk: .8, w: 1.7 } });
  } finally { ctx = old; }
  paintCard(cvf, cvf.width / 80 * .6);
}
function cellHtml(it, attrs, label) {
  const S = it && GEAR_SETS[it.set];
  return `<button type="button" class="inv-cell${it ? '' : ' empty'}${it && it.ench.length ? ' ench' : ''}" ${attrs} ${it ? `style="--tc:${S.col}" aria-label="${esc(itemName(it))}"` : `aria-label="${label || 'empty'}"`}><canvas width="96" height="96"></canvas>${label ? `<span>${label}</span>` : ''}</button>`;
}
function renderInventory() {
  const g = save.gear, it = selItem();
  if (!it && invSel.k === 'bag' && invSel.i >= g.bag.length && g.bag.length) invSel.i = g.bag.length - 1;
  // the figure: wearing what he has on, or trying on the chosen piece from the bag
  const trying = invSel.k === 'bag' && it, look = trying ? buildHeroLook(Object.assign({}, g.eq, { [it.slot]: it })) : heroLook();
  drawInvFigure(look); $('#invFigCap').textContent = trying ? 'TRYING ON' : 'WEARING';
  const slots = $('#invSlots'); slots.innerHTML = INV_SLOT_ORDER.map(s => cellHtml(g.eq[s], `data-slot="${s}"`, SLOT_NAME[s])).join('');
  slots.querySelectorAll('.inv-cell').forEach(b => { const s = b.dataset.slot; drawGearIcon(b.querySelector('canvas'), g.eq[s]); b.classList.toggle('sel', invSel.k === 'eq' && invSel.slot === s); b.addEventListener('click', () => invPick({ k: 'eq', slot: s })); });
  const bag = $('#invBag'); let h = '';
  for (let i = 0; i < BAG_MAX; i++) h += cellHtml(g.bag[i], `data-i="${i}"`);
  bag.innerHTML = h;
  bag.querySelectorAll('.inv-cell').forEach(b => { const i = +b.dataset.i; drawGearIcon(b.querySelector('canvas'), g.bag[i]); b.classList.toggle('sel', invSel.k === 'bag' && invSel.i === i); b.addEventListener('click', () => invPick({ k: 'bag', i })); });
  $('#invCount').textContent = `${g.bag.length}/${BAG_MAX}`;
  $('#invFull').hidden = g.bag.length < BAG_MAX;
  $('#invStats').innerHTML = statsHtml();
  $('#invDetail').innerHTML = it ? itemHtml(it, invSel.k) : `<p class="small">${invSel.k === 'eq' ? `Nothing worn on the ${SLOT_NAME[invSel.slot].toLowerCase()}.` : 'An empty place in the bag.'}</p>`;
  const act = $('#invAct'), salv = $('#invSalv');
  act.disabled = !it || (invSel.k === 'eq' && g.bag.length >= BAG_MAX);
  act.textContent = !it ? 'Equip' : invSel.k === 'eq' ? (g.bag.length >= BAG_MAX ? 'Bag full' : 'Take off') : g.eq[it.slot] ? 'Swap it on' : 'Put it on';
  salv.disabled = !it;
  salv.textContent = it ? (invSalvArm === selKey() ? `Tap again: +${salvageValue(it)} ◆` : `Salvage · +${salvageValue(it)} ◆`) : 'Salvage';
  $('#invNote').textContent = invNote;
  $('#invShards').textContent = save.shards;
}
const selKey = () => invSel.k === 'eq' ? 'eq:' + invSel.slot : 'bag:' + invSel.i;

// ---------- acting ----------
function invPick(sel) { // a tap: the first picks a piece, a second on the same piece puts it on or takes it off
  const same = sel.k === invSel.k && (sel.k === 'eq' ? sel.slot === invSel.slot : sel.i === invSel.i);
  invSel = sel; invSalvArm = null; invNote = '';
  if (same && selItem()) { invPrimary(); return; }
  sfx('swing', .3); renderInventory(); if (KBD) focusSel();
}
function invPrimary() {
  const g = save.gear, it = selItem(); if (!it) return;
  invSalvArm = null;
  if (invSel.k === 'bag') { equipItem(invSel.i); invNote = `${itemName(it)} put on.`; invSel = { k: 'eq', slot: it.slot }; sfx('buy'); }
  else if (unequipSlot(invSel.slot)) { invNote = `${itemName(it)} taken off, into the bag.`; invSel = { k: 'bag', i: g.bag.length - 1 }; sfx('swing'); }
  else invNote = 'The bag is full: salvage something first.';
  renderInventory(); if (KBD) focusSel();
}
function invSalvage() {
  const it = selItem(); if (!it) return;
  if (invSalvArm !== selKey()) { invSalvArm = selKey(); renderInventory(); if (KBD) focusSel(); return; } // asks once more
  const v = salvageItem(invSel.k, invSel.k === 'eq' ? invSel.slot : invSel.i); invSalvArm = null;
  invNote = `${itemName(it)} salvaged for ${v} shards.`; sfx('break');
  renderInventory(); if (KBD) focusSel();
}
function focusSel() {
  const b = invSel.k === 'eq' ? document.querySelector(`#invSlots [data-slot="${invSel.slot}"]`) : document.querySelector(`#invBag [data-i="${invSel.i}"]`);
  if (b) b.focus({ preventScroll: false });
}
// arrows move round one grid: the four slots are a column on the left, the bag six columns to its right
function invMove(dx, dy) {
  const N = invCols(), rows = Math.ceil(BAG_MAX / N);
  let col = invSel.k === 'eq' ? 0 : 1 + invSel.i % N, row = invSel.k === 'eq' ? INV_SLOT_ORDER.indexOf(invSel.slot) : Math.floor(invSel.i / N);
  col = clamp(col + dx, 0, N); row = clamp(row + dy, 0, col === 0 ? INV_SLOT_ORDER.length - 1 : rows - 1);
  invSel = col === 0 ? { k: 'eq', slot: INV_SLOT_ORDER[row] } : { k: 'bag', i: Math.min(BAG_MAX - 1, row * N + col - 1) };
  invSalvArm = null; invNote = ''; renderInventory(); focusSel();
}
function invKey(e) {
  const c = e.code;
  if (c === 'Escape' || c === 'Backspace' || c === 'KeyK') { e.preventDefault(); closeInventory(); return true; }
  if (c === 'ArrowLeft' || c === 'KeyA') { e.preventDefault(); invMove(-1, 0); return true; }
  if (c === 'ArrowRight' || c === 'KeyD') { e.preventDefault(); invMove(1, 0); return true; }
  if (c === 'ArrowUp' || c === 'KeyW') { e.preventDefault(); invMove(0, -1); return true; }
  if (c === 'ArrowDown' || c === 'KeyS') { e.preventDefault(); invMove(0, 1); return true; }
  if (c === 'Enter' || c === 'NumpadEnter' || c === 'Space' || c === 'KeyJ') {
    const a = document.activeElement; // a focused button of the panel's own (Salvage, Back) takes the key itself
    if (a && a.tagName === 'BUTTON' && !a.classList.contains('inv-cell') && (c === 'Enter' || c === 'Space')) return true;
    e.preventDefault(); invPrimary(); return true;
  }
  if (c === 'KeyX' || c === 'Delete') { e.preventDefault(); invSalvage(); return true; }
  return true; // nothing else reaches the game while the panel is open
}
$('#invBtn').addEventListener('click', () => openInventory('pause'));
$('#forgeInvBtn').addEventListener('click', () => openInventory('forge'));
$('#invAct').addEventListener('click', invPrimary);
$('#invSalv').addEventListener('click', invSalvage);
$('#invBack').addEventListener('click', closeInventory);
// the pause menu's button says how full the bag is
{ const _rf = renderForge; renderForge = function (note) { _rf(note); $('#forgeInvBtn').textContent = invBtnText(); }; }
