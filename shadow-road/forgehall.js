'use strict';
// ======================================================================================================
// THE CROSSROADS FORGE, WALKED. Between worlds the forge can be a hall to walk through instead of one long menu: a
// smithy at the crossroads of Shadow, painted in the game's own manner (stone and firelight, a Pattern laid in the floor
// at the door he comes in by, the road open at the far end), with the family and their friends each keeping a stall:
//   Gérard at the anvil: the weapons (levels and tempers, the rapier's eighth level)
//   Julian, the huntsman of Arden: the arrows
//   Ganelon, the old soldier: armor (what is worn and carried; the inventory) and the Horn's Long March
//   Dworkin, who drew the Trumps: the cards (and the deck drawn again, on the Rim)
//   Fiona the sorceress: the black drawn out (cleansing) and the cursed weapons fed and purified (New Game+)
//   Llewella of Rebma, at the sea-mirror: the Pearl (its relic row, and the reforged Pearl's tempers)
//   Random the gambler: shards for sigils (New Game+)
// Only those with something to sell are there. He walks with the game's own controls (keys, a gamepad, the joystick),
// and up to a stall a prompt comes up (Talk · J, or a Talk button on a touchscreen); talking opens that one's panel.
//
// The panel is the forge menu itself (#forgeOv), shown through a lens: every piece of the forge is tagged with its section
// (data-sec: ui.js and the files that add to it), and a vendor's panel shows only his sections, so every button is the
// menu's own button, with its own prices and rules (nothing is copied), and every wrapper's rows reach their vendor.
// The full menu stays as it was; "Menu view" in the hall and "Walk the forge" in the menu switch between the two, and
// the choice is remembered (localStorage 'shadowroad-forgeview'). The door at the far end is "Walk on" (#walkBtn).
//
// The hall's stone, stalls and floor are painted once into tiles (only the fires, the glass, the Pattern's shimmer and
// the figures move); the figures are drawn in the game's figure layer (inkBegin/inkEnd), the prince by drawPlayerAt.
// Hooks: showOnly, openForge, renderForge, onKeyMenu and drawScene are wrapped.
// Console / tests: FORGEHALL (state, cast, goTo(id), talk(), close(), view('hall' | 'menu')).
// ======================================================================================================
(() => {
  const PREF_KEY = 'shadowroad-forgeview';
  let pref = 'hall';
  try { const v = localStorage.getItem(PREF_KEY); if (v === 'menu' || v === 'hall') pref = v; } catch (e) {}
  const setPref = (v) => { pref = v; try { localStorage.setItem(PREF_KEY, v); } catch (e) {} };
  const cl01 = (k) => clamp(k, 0, 1), sm = (k) => { k = cl01(k); return k * k * (3 - 2 * k); };
  const hsh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const fine = () => !FLASH && !TINT && !LITE;
  const glowR = (x, y, r, rgb, a) => { if (a <= 0 || r <= 0 || FLASH || TINT) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.45, `rgba(${rgb},${a * .4})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); };
  const ovEl = () => document.getElementById('forgeOv');

  // ======================================================================================================
  // THE CAST
  // ======================================================================================================
  // a belt with no sword at it, for those who carry none (the sword belt's own belts, its scabbard left off)
  try { const W = CORWIN.parts.waist; if (W.swordbelt && !W.fhGirdle) W.fhGirdle = Object.assign(Object.create(W.swordbelt), { scabbard() {} }); } catch (e) {}
  const base = (o) => Object.assign({}, HERO, o);
  const LOOKS = {
    gerard: () => base({ skin: '#D4A882', glove: '#C4986E', hair: '#6A4428', hairLt: '#9A6A44', hairDk: '#2E1A0E', eye: '#5A7AA0', waist: 'fhGirdle', body: '#3E5A86', lattice: '#5A78A6', button: '#B8B8C0', trim: '#8A6A3A', shirt: '#D8D0C0', sleeve: '#D8D0C0', legs: '#3A3028', boots: '#3A2A1E', coat: '#6A4228', coat2: '#5A3820' }),
    julian: () => base({ skin: '#E4CCB4', glove: '#D8BCA0', hair: '#141018', hairLt: '#3A3440', hairDk: '#060408', eye: '#6A8A5A', body: '#DCDAD2', lattice: '#B8B6AE', button: '#3A6A4A', trim: '#3A6A4A', shirt: '#E4E2DA', sleeve: '#CFCDC4', steel: '#D8D8D0', pauldron: '#E4E2DA', legs: '#34443A', boots: '#2A2A22', cuff: '#3A5A42' }),
    dworkin: () => base({ skin: '#D8B898', glove: '#CCA888', hair: '#E6E0D4', hairLt: '#FFFFFF', hairDk: '#A8A094', eye: '#8A7AB8', waist: 'fhGirdle', body: '#4A3A5E', lattice: '#5E4C76', button: '#C8A858', trim: '#C8A858', shirt: '#6A5A80', sleeve: '#4A3A5E', legs: '#3A2E48', boots: '#2A2030', coat: '#3E2E52', coat2: '#342646', longHair: 1, steel: '#5E4C76', pauldron: '#5E4C76', glove: '#CCA888' }),
    fiona: () => base({ skin: '#F0D8C6', glove: '#E8CCB8', hair: '#C2442A', hairLt: '#E8784A', hairDk: '#6A1A0E', eye: '#3A9A6A', waist: 'fhGirdle', body: '#3E7A4A', lattice: '#5A9A62', button: '#D8C080', trim: '#D8C080', shirt: '#E8E0C8', sleeve: '#3E7A4A', legs: '#2E5A3A', boots: '#2A3020', coat: '#2E5A3A', coat2: '#264A30', longHair: 1, steel: '#2E5A3A', pauldron: '#3E7A4A', hairLong: 1 }),
    llewella: () => base({ skin: '#D6E0CE', glove: '#C8D4C0', hair: '#3A8A6A', hairLt: '#6ABA96', hairDk: '#14402E', eye: '#3ABAB0', waist: 'fhGirdle', body: '#2A6A7A', lattice: '#4A8A9A', button: '#E8F0E8', trim: '#B0E0D8', shirt: '#D8ECE6', sleeve: '#2A6A7A', legs: '#1F5260', boots: '#18343C', coat: '#1F5260', coat2: '#184450', longHair: 1, steel: '#1F5260', pauldron: '#2A6A7A', hairLong: 1 }),
    random: () => base({ skin: '#D8B090', glove: '#C8A080', hair: '#B08A48', hairLt: '#D8B070', hairDk: '#5A4020', eye: '#6A8AB0', body: '#8A4A2A', lattice: '#A8643A', button: '#D8AA55', trim: '#D8AA55', shirt: '#E8DCC4', sleeve: '#E8DCC4', legs: '#3A2E2A', boots: '#3A2418' }),
    ganelon: () => (window.W8 && W8.riderLook) ? W8.riderLook('ganelon', { hand: null }) : base({ skin: '#D09A74', hair: '#8A4426', hairLt: '#B8704A', hairDk: '#3E1A0C', eye: '#4A6A3A', body: '#24365E', lattice: '#34466E', trim: '#D8AA55' }),
  };
  const CAST = {
    gerard: { name: 'Gérard', role: 'Weapons', secs: ['weapons'], bg: ['#A2B6D0', '#2A3A5A'], s: 1.12, f: -1,
      lines: () => {
        if (save.owned.rapier && save.wl.rapier === WLEARN && wLearn('rapier') > WLEARN) return 'That rapier of yours... there is something under its finish, brother. Give me the hammer to it, and we will see what it really is.';
        if (save.cycle > 0) return pick(['Round the road again? Then the iron must go harder too. I will temper what you carry.', 'Shadow-steel takes a good edge, if you hit it hard enough and often enough. Lay it on the anvil.']);
        return pick(['Lay it on the anvil, Corwin. Every level I beat into it, it remembers. Steel is more loyal than family.', 'Shadow-steel takes a good edge, if you hit it hard enough and often enough. Show me what you carry.']); } },
    julian: { name: 'Julian', role: 'Arrows', secs: ['arrows'], bg: ['#CED8C4', '#3A4A3A'], s: 1, f: -1,
      lines: () => pick(['Grey goose and Arden yew. My hounds have run down worse than anything you will shoot at.', 'Arrows are scarce on your road, brother. Make each one count. I would.']) },
    ganelon: { name: 'Ganelon', role: 'Armor', secs: ['gear', 'march'], bg: ['#8AA0C8', '#1A2440'], s: 1.04, f: -1,
      lines: () => document.getElementById('w8marchForge') ? 'Mail before glory. And the horn: blow it as we rode at the Black Circle, and the march goes on behind you.'
        : pick(['Mail before glory, Corwin. I learned that at the Black Circle, and so will you.', 'Let us see what you have hauled out of Shadow in that bag. Some of it might even fit.']) },
    dworkin: { name: 'Dworkin', role: 'Trumps', secs: ['cards'], bg: ['#C8B8E8', '#2A1E40'], s: .86, f: -1,
      lines: () => (save.stage > FORK && !save.done) ? 'The deck again? Every card is a door, if the hand that drew it was steady. Draw another, if the road you hold is not the one you want.'
        : pick(['Every card is a door, if the hand that drew it was steady. Mine was, once. Mostly.', 'Hold still. No, not you: the ink. Whose face shall I give you?']) },
    fiona: { name: 'Fiona', role: 'Curses', secs: ['cursed', 'cleanse'], bg: ['#A8D0AC', '#284A38'], s: .96, f: -1,
      lines: () => pick(['The black runs through it like ink in water. It can be drawn out, for a price, and it comes out cleaner than it went in.', 'Hold it in the fire and do not flinch, brother. I will not.']) },
    llewella: { name: 'Llewella', role: 'The Pearl', secs: ['pearl'], bg: ['#86C4C4', '#1A3A48'], s: .96, f: -1,
      lines: () => pick(['The sea gave it up for you. Moire will want to hear that you kept it well.', 'Look into the glass, Corwin: the tide is still turning in it.']) },
    random: { name: 'Random', role: 'Trade', secs: ['trade'], bg: ['#D49866', '#4A2A1A'], s: 1, f: -1,
      lines: () => pick(['Shards for sigils, brother. The house always takes its little cut.', 'I would give you a better rate, but then I would not be me, would I?']) },
  };
  const ORDER = ['gerard', 'julian', 'ganelon', 'dworkin', 'fiona', 'llewella', 'random'];
  const present = {
    gerard: () => true, julian: () => true, dworkin: () => true,
    ganelon: () => { const g = save.gear || {}; return !!((g.eq && GEAR_SLOTS.some(s => g.eq[s])) || (g.bag && g.bag.length) || document.getElementById('w8marchForge')); },
    fiona: () => !!document.querySelector('#forgeOv [data-sec="cursed"], #forgeOv [data-sec="cleanse"]'),
    llewella: () => !!document.querySelector('#forgeOv [data-sec="pearl"]'),
    random: () => !!document.getElementById('sigilTrade'),
  };

  // ======================================================================================================
  // STATE AND LAYOUT
  // ======================================================================================================
  const H = { on: false, panel: null, resume: null, x: 110, y: 300, f: 1, walk: 0, moving: false, run: false, cam: 0, t: 0, last: 0,
    cast: [], door: 0, len: 900, target: null, key: '', sparks: [], embers: [], padA: false, padB: false, hint: 0, struck: {} };
  const STEP = 230, FIRST = 330;
  const FT = () => FLOOR_TOP;
  const heroYMin = () => FT() + 36, heroYMax = () => FLOOR_BOT - 4;
  const vendorY = () => FT() + 22;
  function computeCast() {
    const ids = ORDER.filter(id => { try { return present[id](); } catch (e) { return false; } });
    H.cast = ids.map((id, i) => ({ id, x: FIRST + i * STEP, ph: hsh(i + 3) * 10 }));
    H.door = FIRST + Math.max(0, ids.length - 1) * STEP + 290; H.len = H.door + 150;
    H.key = ids.join(',');
  }
  function placeHero() { H.x = 112; H.y = clamp(FT() + 64, heroYMin(), heroYMax()); H.f = 1; H.walk = 0; H.cam = 0; H.hint = 7; }

  // ======================================================================================================
  // THE LENS: the forge menu, shown whole, or only one vendor's sections
  // ======================================================================================================
  function ensureTags() {
    const ov = ovEl(); if (!ov) return; const wrap = ov.querySelector('.wrap'); if (!wrap) return;
    const fc = document.getElementById('forgeCards'), tc = document.getElementById('trumpCards'), foot = ov.querySelector('.forge-foot'), plq = ov.querySelector('.plaque');
    if (plq) plq.dataset.sec = 'head';
    if (fc) fc.dataset.sec = 'box'; if (tc) tc.dataset.sec = 'box'; if (foot) foot.dataset.sec = 'box';
    // the headings over the weapons and over the cards
    for (const [box, sec] of [[fc, 'weapons'], [tc, 'cards']]) { if (!box) continue; let el = box.previousElementSibling;
      for (let k = 0; k < 2 && el; k++, el = el.previousElementSibling) if ((el.classList.contains('h3') || el.classList.contains('small')) && !el.dataset.sec) el.dataset.sec = sec; }
    const tag = (id, sec) => { const el = document.getElementById(id); if (el && !el.dataset.sec) el.dataset.sec = sec; };
    tag('cForge', 'cleanse'); tag('w7relicRow', 'pearl'); tag('w8marchForge', 'march'); tag('sigilTrade', 'trade');
    tag('walkBtn', 'menu'); tag('forgeTitleBtn', 'menu'); tag('forgeInvBtn', 'gear'); tag('redrawBtn', 'cards'); tag('fhWalkHallBtn', 'menu');
    if (fc) for (const c of fc.children) if (!c.dataset.sec) c.dataset.sec = c.classList.contains('cwcard') ? 'cursed' : 'weapons';
    if (tc) for (const c of tc.children) if (!c.dataset.sec) c.dataset.sec = 'cards';
    // anything else laid into the forge by a file that does not tag its rows: the smith's stall has it
    for (const c of wrap.children) if (!c.dataset.sec) c.dataset.sec = 'weapons';
    if (foot) for (const c of foot.children) if (!c.dataset.sec) c.dataset.sec = 'menu';
  }
  function applyLens() {
    const ov = ovEl(); if (!ov) return; ensureTags(); ensureMenuBtn();
    const V = H.on && H.panel ? CAST[H.panel] : null, secs = V ? V.secs : null;
    ov.classList.toggle('vendor', !!V);
    if (V) ov.dataset.vendor = H.panel; else delete ov.dataset.vendor;
    const show = (el, on) => el.classList.toggle('vhide', !on);
    for (const el of ov.querySelectorAll('[data-sec]')) { const s = el.dataset.sec;
      if (s === 'box' || s === 'head') continue;
      if (s === 'hall') { show(el, !!V); continue; }
      if (s === 'menu') { show(el, !V); continue; }
      show(el, !V || secs.includes(s)); }
    for (const box of ov.querySelectorAll('[data-sec="box"]')) show(box, !V || [...box.children].some(c => !c.classList.contains('vhide') && !c.hidden));
    if (V) { fillHead(); fillGear(); }
    { const lab = document.querySelector('#sigilTrade > span'); if (lab) lab.textContent = V && H.panel === 'random' ? 'Random will deal:' : 'The smith will trade:'; }
  }
  // the "Walk the forge" button in the menu's foot
  function ensureMenuBtn() {
    if (document.getElementById('fhWalkHallBtn')) return; const walk = document.getElementById('walkBtn'); if (!walk) return;
    const b = document.createElement('button'); b.id = 'fhWalkHallBtn'; b.className = 'cta alt'; b.type = 'button'; b.textContent = 'Walk the forge'; b.dataset.sec = 'menu';
    b.title = 'Walk through the forge hall and talk to each smith in turn';
    b.addEventListener('click', () => { audioInit(); setPref('hall'); H.panel = null; showOnly('forgeOv'); });
    const foot = walk.parentElement; foot.insertBefore(b, document.getElementById('forgeTitleBtn') || null);
  }
  // the vendor's head of the panel: his portrait, his name and trade, a word from him, and the way back to the hall
  let headFor = '';
  function fillHead() {
    const ov = ovEl(), wrap = ov.querySelector('.wrap'); let el = document.getElementById('fhHead');
    if (!el) { el = document.createElement('div'); el.id = 'fhHead'; el.className = 'face dealt'; el.dataset.sec = 'hall';
      el.innerHTML = `<canvas width="132" height="132" aria-hidden="true"></canvas><div class="fh-who"><div class="fh-name"></div><div class="fh-role"></div><p class="fh-line"></p></div><button class="cta alt" type="button" id="fhBackBtn">Back to the hall</button>`;
      el.querySelector('#fhBackBtn').addEventListener('click', () => closePanel());
      wrap.insertBefore(el, wrap.firstChild); }
    if (headFor === H.panel) return; headFor = H.panel;
    const V = CAST[H.panel];
    el.querySelector('.fh-name').textContent = V.name; el.querySelector('.fh-role').textContent = V.role.toUpperCase();
    el.querySelector('.fh-line').textContent = '"' + V.lines() + '"';
    el.querySelector('#fhBackBtn').innerHTML = KBD ? 'Back to the hall <kbd>Esc</kbd>' : 'Back to the hall';
    try { portrait(el.querySelector('canvas'), H.panel); } catch (e) { console.error(e); }
  }
  function fillGear() {
    const ov = ovEl(), foot = ov.querySelector('.forge-foot'); let el = document.getElementById('fhGear');
    if (H.panel !== 'ganelon') { if (el) el.classList.add('vhide'); return; }
    if (!el) { el = document.createElement('div'); el.id = 'fhGear'; el.className = 'face'; el.dataset.sec = 'gear'; foot.parentNode.insertBefore(el, foot); }
    el.classList.remove('vhide');
    const g = save.gear, esc = (t) => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const rows = ['mail', 'gauntlets', 'waist', 'pants'].map(s => { const it = g.eq[s]; return `<li class="${it ? 'got' : ''}"><b>${SLOT_NAME[s]}</b> · ${it ? esc(itemName(it)) : '<em>nothing worn</em>'}</li>`; }).join('');
    el.innerHTML = `<h3 class="h3">Worn</h3><ul class="fh-gear">${rows}</ul><p class="small">In the bag: ${g.bag.length} of ${BAG_MAX}. Open the inventory to put pieces on, take them off, or break them down for shards.</p>`;
  }

  // ======================================================================================================
  // ENTERING, LEAVING, TALKING
  // ======================================================================================================
  let ui = null;
  function buildUi() {
    if (ui) return ui;
    const st = document.createElement('style'); st.id = 'fhStyle'; st.textContent = CSS; document.head.appendChild(st);
    ui = document.createElement('div'); ui.id = 'fhUi'; ui.hidden = true;
    ui.innerHTML = `<div class="fh-top"><div class="fh-plate"><div class="fh-kick" id="fhKick"></div><div class="fh-title">The Crossroads Forge</div><div class="fh-mats"><span class="s">&#9670; <b id="fhShards">0</b></span><span class="g">&#10022; <b id="fhSigils">0</b></span></div></div>
      <div class="fh-btns"><button class="cta alt" type="button" id="fhMenuBtn">Menu view</button></div></div>
      <div class="fh-hint" id="fhHint"></div>
      <button type="button" class="fh-talk" id="fhTalk" hidden><span class="fh-tw"></span><span class="fh-tk"></span></button>`;
    (document.getElementById('app') || document.body).appendChild(ui);
    ui.querySelector('#fhMenuBtn').addEventListener('click', () => { audioInit(); setPref('menu'); H.panel = null; showOnly('forgeOv'); const ov = ovEl(); if (ov) ov.scrollTop = 0; });
    const talk = ui.querySelector('#fhTalk');
    talk.addEventListener('pointerdown', (e) => { e.preventDefault(); audioInit(); interact(); });
    talk.addEventListener('click', (e) => { if (e.detail === 0) interact(); }); // (a keyboard's Enter on the focused button)
    return ui;
  }
  function enterHall() {
    buildUi(); H.on = true; H.flush = true;
    if (!H.cast.length) { computeCast(); placeHero(); }
    try { if (typeof setZoom === 'function' && VIEW_H !== VIEW_NORMAL) setZoom(VIEW_NORMAL); } catch (e) {}
    app.classList.add('fhall');
    ui.hidden = false; refreshUi(); H.target = null; setPrompt(null);
    if (H.resume && CAST[H.resume] && H.cast.some(v => v.id === H.resume)) { const id = H.resume; H.resume = null; openPanel(id, true); }
    else { H.panel = null; ovEl().hidden = true; app.classList.remove('nocontrols'); applyLens(); }
  }
  function leaveHall(keep) {
    H.resume = keep ? H.panel : null;
    H.on = false; H.panel = null; headFor = '';
    app.classList.remove('fhall');
    if (ui) ui.hidden = true;
    applyLens();
  }
  function openPanel(id, back) {
    const ov = ovEl(); H.panel = id; headFor = ''; keys.clear(); clearInput();
    renderForge(); applyLens();
    ov.hidden = false; app.classList.add('nocontrols'); ov.scrollTop = 0;
    if (ui) { ui.querySelector('#fhTalk').hidden = true; }
    if (!back) sfx('pick');
    if (KBD) { const b = document.getElementById('fhBackBtn'); if (b) try { b.focus({ preventScroll: true }); } catch (e) {} }
  }
  function closePanel() {
    if (!H.panel) return; const ov = ovEl();
    H.panel = null; headFor = ''; ov.hidden = true; app.classList.remove('nocontrols'); applyLens(); refreshUi(); H.target = null; setPrompt(null);
    keys.clear(); clearInput();
    try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) {}
  }
  function interact() {
    if (!H.on || H.panel || blocked()) return;
    const T = H.target; if (!T) return;
    if (T === 'door') { const w = document.getElementById('walkBtn'); if (w) w.click(); return; }
    openPanel(T);
  }
  function blocked() { return mode !== 'forge' || !!document.getElementById('w8verseOv') || !!(window.BRANCH && BRANCH.active) || app.classList.contains('port'); }
  function refreshUi() {
    if (!ui) return; const k = document.getElementById('forgeKicker');
    ui.querySelector('#fhKick').textContent = k ? k.textContent : 'BETWEEN WORLDS';
    ui.querySelector('#fhShards').textContent = save.shards; ui.querySelector('#fhSigils').textContent = save.sigils;
  }
  let promptKey = '';
  function setPrompt(T) {
    if (!ui) return; const b = ui.querySelector('#fhTalk'), key = (T || '') + '|' + KBD;
    if (key === promptKey && !b.hidden === !!T) return; promptKey = key;
    if (!T || H.panel) { b.hidden = true; return; }
    b.hidden = false; b.classList.toggle('door', T === 'door');
    const who = T === 'door' ? `Walk on: ${STAGES[roadStage()].name}` : `${CAST[T].name} · ${CAST[T].role}`;
    b.querySelector('.fh-tw').textContent = who;
    b.querySelector('.fh-tk').innerHTML = KBD ? `${T === 'door' ? 'Walk on' : 'Talk'} <kbd>J</kbd>` : (T === 'door' ? 'WALK ON' : 'TALK');
  }

  // ---------------- the hooks ----------------
  { const _so = showOnly; showOnly = function (id) {
    const want = id === 'forgeOv' && pref === 'hall', was = H.on;
    _so(id);
    if (want) enterHall();
    else if (was) leaveHall(id === 'invOv');
  }; }
  { const _of = openForge; openForge = function (k) {
    H.cast = []; H.panel = null; H.resume = null; H.sparks.length = 0; H.embers.length = 0;
    const r = _of(k);
    try { computeCast(); placeHero(); applyLens(); if (H.on) refreshUi(); for (const c of tiles.values()) retire(c); tiles.clear(); tileKey = ''; } catch (e) { console.error(e); }
    return r;
  }; }
  { const _rf = renderForge; renderForge = function (note) { const r = _rf(note); try { applyLens(); refreshUi(); } catch (e) { console.error(e); } return r; }; }
  { const _ok = onKeyMenu; onKeyMenu = (e) => {
    if (H.on && mode === 'forge') {
      const c = e.code;
      if (H.panel) {
        if (c === 'Escape' || c === 'Backspace') { e.preventDefault(); closePanel(); return true; }
        if (c === 'KeyM') return true;
        return true; // (the panel's own buttons take Enter and Space natively; nothing else reaches the hall)
      }
      if (blocked()) return true;
      if (c === 'Enter' || c === 'NumpadEnter' || c === 'KeyJ' || c === 'KeyZ' || c === 'KeyE' || c === 'Space') { if (document.activeElement && document.activeElement.tagName === 'BUTTON' && (c === 'Enter' || c === 'Space')) return true; e.preventDefault(); if (!e.repeat) interact(); return true; }
      if (c === 'Escape' || c === 'KeyP') return true;
      return false; // (the walking keys reach the game's key set: readMove)
    }
    return _ok ? _ok(e) : false;
  }; }
  // (the first frame in the hall still goes through the scene's own wrappers once, so anything left running when the forge
// came up, a world's ending above all, sees that something else has taken over and lets go quietly)
  { const _ds = drawScene; drawScene = function (t) { if (H.on && mode === 'forge') { if (H.flush) { H.flush = false; try { _ds(t); } catch (e) { console.error(e); } } hallFrame(t); return; } return _ds(t); }; }
  window.addEventListener('blur', () => { if (H.on) { keys.clear(); clearInput(); } });

  // ======================================================================================================
  // EACH FRAME
  // ======================================================================================================
  function readPad() {
    let gp = null; try { gp = navigator.getGamepads && [...navigator.getGamepads()].find(Boolean); } catch (e) {} if (!gp) return null;
    const b = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed), ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    let mx = Math.abs(ax) > .25 ? ax : 0, my = Math.abs(ay) > .25 ? ay : 0;
    if (b(14)) mx = -1; if (b(15)) mx = 1; if (b(12)) my = -1; if (b(13)) my = 1;
    return { mx, my, a: b(0), b: b(1) };
  }
  function update(dt) {
    const pad = readPad();
    if (pad) { if (pad.b && !H.padB && H.panel) closePanel(); if (pad.a && !H.padA && !H.panel) interact(); H.padA = pad.a; H.padB = pad.b; }
    let mx = 0, my = 0;
    if (!H.panel && !blocked()) { readMove(); mx = input.mx; my = input.my; if (pad && (pad.mx || pad.my)) { mx = pad.mx; my = pad.my; } }
    const run = !!input.run && Math.abs(mx) > .3, sp = run ? 220 : 118;
    H.moving = Math.hypot(mx, my) > .05; H.run = run && H.moving;
    if (H.moving) {
      H.x = clamp(H.x + mx * sp * dt, 40, H.len - 40); H.y = clamp(H.y + my * sp * .62 * dt, heroYMin(), heroYMax());
      if (Math.abs(mx) > .1) H.f = Math.sign(mx); H.walk += dt * (run ? 13 : 8.5) * Math.max(.5, Math.hypot(mx, my));
    }
    const camT = clamp(H.x - VW * .42, 0, Math.max(0, H.len - VW));
    H.cam += (camT - H.cam) * Math.min(1, dt * 6); if (Math.abs(camT - H.cam) < .2) H.cam = camT;
    // who is near enough to talk to
    let T = null, best = 64;
    for (const v of H.cast) { const d = Math.abs(H.x - v.x); if (d < best) { best = d; T = v.id; } }
    if (H.x > H.door - 70) T = 'door';
    if (T !== H.target) { H.target = T; }
    setPrompt(H.panel ? null : T);
    if (H.hint > 0) { H.hint -= dt; const el = ui && ui.querySelector('#fhHint'); if (el) { el.textContent = KBD ? 'A / D or ← → to walk, W / S along the hall · J to talk' : 'Joystick to walk · tap Talk at a stall'; el.style.opacity = String(cl01(H.hint / 1.5)); } }
    // sparks and embers
    for (const s of H.sparks) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 260 * dt; }
    H.sparks = H.sparks.filter(s => s.t < s.life);
    const g = H.cast.find(v => v.id === 'gerard');
    if (g && H.embers.length < 18 && Math.random() < dt * 9) H.embers.push({ x: g.x + 14 + rand(-20, 20), y: FT() - 60, vx: rand(-6, 6), vy: rand(-26, -14), t: 0, life: rand(1.6, 3) });
    for (const e of H.embers) { e.t += dt; e.x += e.vx * dt + Math.sin(e.t * 3 + e.life) * .3; e.y += e.vy * dt; }
    H.embers = H.embers.filter(e => e.t < e.life);
  }
  function hallFrame(t) {
    const dt = Math.min(.05, Math.max(0, t - (H.last || t))); H.last = t; H.t += dt;
    update(dt);
    const T = H.t;
    ctx.save();
    try {
      ctx.fillStyle = '#0E0908'; ctx.fillRect(0, Y_OFF - 2, VW, VIEW_H + 4);
      ctx.translate(-Math.round(H.cam * K) / K, 0);
      drawTiles();
      liveBack(T);
      figures(T);
      liveFront(T);
    } finally { ctx.restore(); }
    vignette();
  }

  // ======================================================================================================
  // THE STATIC HALL, painted once into tiles
  // ======================================================================================================
  const TW = 256, tiles = new Map(); let tileKey = '';
  function drawTiles() {
    const S = Math.min(K, 2), key = [S.toFixed(3), FT(), H.key, VH].join('|');
    if (key !== tileKey) { for (const c of tiles.values()) retire(c); tiles.clear(); tileKey = key; }
    const i0 = Math.floor(H.cam / TW), i1 = Math.floor((H.cam + VW) / TW);
    let painted = 0;
    for (let i = i0; i <= i1; i++) { let c = tiles.get(i); if (!c) { c = paintTile(i, S); tiles.set(i, c); painted++; } ctx.drawImage(c, i * TW, 0, TW, VH); }
    // one more ahead, when this frame painted none
    if (!painted) { const j = H.f > 0 ? i1 + 1 : i0 - 1; if (j >= 0 && j * TW < H.len && !tiles.has(j)) tiles.set(j, paintTile(j, S)); }
    if (tiles.size > 14) for (const k of [...tiles.keys()]) if (k < i0 - 3 || k > i1 + 3) { retire(tiles.get(k)); tiles.delete(k); }
  }
  function paintTile(i, S) {
    const x0 = i * TW, c = document.createElement('canvas'); c.width = Math.ceil(TW * S); c.height = Math.ceil(VH * S);
    const g = c.getContext('2d'), old = ctx, fl = FLASH, ti = TINT, li = LITE; ctx = g; FLASH = false; TINT = null; LITE = false;
    try { g.scale(S, S); g.translate(-x0, 0); paintHall(x0, x0 + TW); }
    catch (e) { console.error(e); }
    finally { ctx = old; FLASH = fl; TINT = ti; LITE = li; }
    return c;
  }
  const STONE = ['#3A2A24', '#43302A', '#33251F', '#3E2E26', '#2E221D'];
  function paintHall(x0, x1) {
    const ft = FT(), L = H.len;
    // the back wall: dressed stone, darker toward the vaults
    const wg = ctx.createLinearGradient(0, 0, 0, ft); wg.addColorStop(0, '#120B0A'); wg.addColorStop(.45, '#271B17'); wg.addColorStop(1, '#3A2A21');
    ctx.fillStyle = wg; ctx.fillRect(x0, 0, x1 - x0, ft);
    for (let r = 0, y = ft - 16; y > -16; r++, y -= 16) { const off = (r % 2) * 22;
      for (let cx = Math.floor((x0 - off) / 44) * 44 + off - 44; cx < x1 + 44; cx += 44) { const hv = hsh(cx * .37 + r * 17.3);
        ctx.fillStyle = shade(STONE[Math.floor(hv * STONE.length)], (y / ft - 1) * .5); ctx.fillRect(cx + .8, y + .8, 42.4, 14.4);
        ctx.fillStyle = 'rgba(255,220,180,.04)'; ctx.fillRect(cx + .8, y + .8, 42.4, 1.2); } }
    // the vault's shadow over the top of the wall
    const vg = ctx.createLinearGradient(0, 0, 0, ft); vg.addColorStop(0, 'rgba(8,4,4,.85)'); vg.addColorStop(.4, 'rgba(8,4,4,.35)'); vg.addColorStop(1, 'rgba(8,4,4,0)');
    ctx.fillStyle = vg; ctx.fillRect(x0, 0, x1 - x0, ft);
    // the far end, where he comes in: a high window of the Pattern's blue
    if (x0 < 140) endWall(ft);
    // the stalls, each in an alcove between two pillars
    for (const v of H.cast) if (v.x + 140 > x0 && v.x - 140 < x1) { alcove(v.x, ft, CAST[v.id].bg); STATIONS[v.id](v.x, ft); }
    if (H.door + 160 > x0 && H.door - 160 < x1) door(H.door, ft);
    const cols = new Set(); for (const v of H.cast) { cols.add(v.x - STEP / 2); cols.add(v.x + STEP / 2); } cols.add(H.door - 125);
    for (const px of cols) if (px + 30 > x0 && px - 30 < x1 && px < H.door - 100) pillar(px, ft);
    // the skirting where wall meets floor
    ctx.fillStyle = '#1A110E'; ctx.fillRect(x0, ft - 5, x1 - x0, 6);
    // the floor: flagstones laid in rows, worn smooth down the middle
    const fg = ctx.createLinearGradient(0, ft, 0, VH); fg.addColorStop(0, '#3E2E26'); fg.addColorStop(.5, '#2C201B'); fg.addColorStop(1, '#1A1210');
    ctx.fillStyle = fg; ctx.fillRect(x0, ft, x1 - x0, VH - ft);
    const rows = [0, 9, 20, 34, 51, 72, 97, 126]; ctx.lineWidth = .8;
    for (let r = 0; r < rows.length - 1; r++) { const ya = ft + rows[r], yb = Math.min(VH, ft + rows[r + 1]), w = 38 + r * 12, off = (r % 2) * w * .5;
      ctx.strokeStyle = 'rgba(10,6,4,.55)'; ctx.beginPath(); ctx.moveTo(x0, ya); ctx.lineTo(x1, ya); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,220,180,.05)'; ctx.beginPath(); ctx.moveTo(x0, ya + 1); ctx.lineTo(x1, ya + 1); ctx.stroke();
      for (let sx = Math.floor((x0 - off) / w) * w + off; sx < x1 + w; sx += w) { const hv = hsh(sx * .71 + r * 9.1);
        ctx.fillStyle = `rgba(${hv > .5 ? '255,225,190' : '0,0,0'},${.03 + hsh(sx + r) * .05})`; ctx.fillRect(sx + 1, ya + 1.5, w - 2, yb - ya - 2);
        ctx.strokeStyle = 'rgba(10,6,4,.5)'; ctx.beginPath(); ctx.moveTo(sx, ya); ctx.lineTo(sx + (r - 3) * 1.5, yb); ctx.stroke(); } }
    // a runner of silver laid in along the hall, the Pattern's own line, from the door he came in by to the road
    for (const [dy, a] of [[46, .5], [100, .35]]) { ctx.strokeStyle = `rgba(150,180,230,${a})`; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(Math.max(x0, 270), ft + dy); ctx.lineTo(Math.min(x1, L - 60), ft + dy); ctx.stroke(); }
    // the stalls' floor-pieces, in front of the wall
    for (const v of H.cast) if (v.x + 140 > x0 && v.x - 140 < x1 && FLOOR[v.id]) FLOOR[v.id](v.x, ft);
    // the light of each stall pooled on the floor in front of it
    for (const v of H.cast) if (v.x + 160 > x0 && v.x - 160 < x1) { const [r, gg, b] = POOL[v.id] || [255, 170, 90];
      ctx.save(); ctx.translate(v.x, ft + 30); ctx.scale(1, .3); const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, 150); pg.addColorStop(0, `rgba(${r},${gg},${b},.18)`); pg.addColorStop(1, `rgba(${r},${gg},${b},0)`); ctx.fillStyle = pg; ctx.fillRect(-150, -150, 300, 300); ctx.restore(); }
    // painted: the brush grain over the lot, anchored to the hall so it runs on across the tiles
    ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.globalAlpha = .45; ctx.scale(.5, .5); ctx.fillStyle = texPat(ctx, 'brush'); ctx.fillRect(x0 * 2, 0, (x1 - x0) * 2, VH * 2); ctx.restore();
    ctx.save(); ctx.globalAlpha = .1; ctx.scale(.5, .5); ctx.fillStyle = texPat(ctx, 'hatch'); ctx.fillRect(x0 * 2, (ft + 60) * 2, (x1 - x0) * 2, (VH - ft - 60) * 2); ctx.restore();
  }
  const POOL = { gerard: [255, 150, 70], julian: [220, 230, 190], ganelon: [200, 200, 230], dworkin: [190, 170, 255], fiona: [200, 120, 255], llewella: [120, 230, 220], random: [255, 200, 120] };
  function endWall(ft) {
    ctx.fillStyle = '#1C1311'; ctx.fillRect(0, 0, 34, ft);
    const wx = 80, top = ft - 150, bot = ft - 40;
    ctx.fillStyle = '#120A0A'; ctx.beginPath(); ctx.moveTo(wx - 26, bot); ctx.lineTo(wx - 26, top + 26); ctx.quadraticCurveTo(wx, top - 8, wx + 26, top + 26); ctx.lineTo(wx + 26, bot); ctx.closePath(); ctx.fill();
    const gl = ctx.createLinearGradient(0, top, 0, bot); gl.addColorStop(0, '#5A84D8'); gl.addColorStop(.6, '#2A4A9A'); gl.addColorStop(1, '#16285A');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.moveTo(wx - 20, bot - 4); ctx.lineTo(wx - 20, top + 28); ctx.quadraticCurveTo(wx, top, wx + 20, top + 28); ctx.lineTo(wx + 20, bot - 4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(200,220,255,.75)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let k = 0; k < 4; k++) { const r = 4 + k * 4.2; ctx.moveTo(wx + r, top + 62); ctx.arc(wx, top + 62, r, 0, Math.PI * (1.5 + k * .1)); } ctx.stroke();
    ctx.strokeStyle = '#0C0606'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(wx, top + 8); ctx.lineTo(wx, bot - 4); ctx.moveTo(wx - 20, top + 62); ctx.lineTo(wx + 20, top + 62); ctx.stroke();
    ctx.fillStyle = '#2A1E1A'; ctx.fillRect(wx - 30, bot - 4, 60, 6);
  }
  function alcove(x, ft, bg) {
    const w = STEP - 40, top = ft - 150, sp = ft - 106;
    const path = () => { ctx.beginPath(); ctx.moveTo(x - w / 2, ft); ctx.lineTo(x - w / 2, sp); ctx.quadraticCurveTo(x - w / 2, top + 10, x, top); ctx.quadraticCurveTo(x + w / 2, top + 10, x + w / 2, sp); ctx.lineTo(x + w / 2, ft); ctx.closePath(); };
    path(); ctx.fillStyle = '#1A110F'; ctx.fill();
    ctx.save(); path(); ctx.clip();
    const ag = ctx.createRadialGradient(x, ft - 40, 4, x, ft - 40, w * .7); ag.addColorStop(0, shade(bg[1], .25)); ag.addColorStop(.7, shade(bg[1], -.4)); ag.addColorStop(1, '#120A09');
    ctx.globalAlpha = .7; ctx.fillStyle = ag; ctx.fillRect(x - w, top, w * 2, ft - top); ctx.globalAlpha = 1;
    for (let r = 0, y = ft - 14; y > top; r++, y -= 14) for (let cx = x - w / 2 + (r % 2) * 13 - 26; cx < x + w / 2; cx += 26) { ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = .6; ctx.strokeRect(cx, y, 26, 14); }
    ctx.restore();
    path(); ctx.strokeStyle = '#5A4436'; ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = '#120A08'; ctx.lineWidth = 1; ctx.stroke();
    // the keystone, and the stall's colours in a little shield on it
    ctx.fillStyle = '#5E4A3C'; ctx.beginPath(); ctx.moveTo(x - 7, top - 4); ctx.lineTo(x + 7, top - 4); ctx.lineTo(x + 5, top + 12); ctx.lineTo(x - 5, top + 12); ctx.closePath(); ctx.fill(); outline(.8);
    ctx.fillStyle = bg[0]; ctx.beginPath(); ctx.moveTo(x - 3.4, top); ctx.lineTo(x + 3.4, top); ctx.lineTo(x + 3, top + 5); ctx.lineTo(x, top + 8); ctx.lineTo(x - 3, top + 5); ctx.closePath(); ctx.fill();
  }
  function pillar(x, ft) {
    const top = ft - 176, w = 24;
    const pg = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); pg.addColorStop(0, '#2A1E1A'); pg.addColorStop(.6, '#5A463A'); pg.addColorStop(1, '#3A2C24');
    ctx.fillStyle = pg; ctx.fillRect(x - w / 2, top, w, ft - top);
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = .6; for (let y = ft - 22; y > top; y -= 22) { ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); ctx.stroke(); }
    ctx.fillStyle = '#4A3A30'; ctx.fillRect(x - w / 2 - 5, ft - 12, w + 10, 12); ctx.fillRect(x - w / 2 - 4, top + 52, w + 8, 7);
    ctx.fillStyle = '#6A5444'; ctx.fillRect(x - w / 2 - 5, ft - 12, w + 10, 2); ctx.fillRect(x - w / 2 - 4, top + 52, w + 8, 1.5);
    // a torch in its iron bracket
    const ty = ft - 92; ctx.strokeStyle = '#141010'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 4, ty + 14); ctx.lineTo(x + 2, ty + 4); ctx.lineTo(x + 2, ty - 4); ctx.stroke();
    ctx.fillStyle = '#3A2A1E'; ctx.beginPath(); ctx.moveTo(x - 2, ty - 6); ctx.lineTo(x + 6, ty - 6); ctx.lineTo(x + 4, ty + 2); ctx.lineTo(x, ty + 2); ctx.closePath(); ctx.fill(); outline(.6);
    const lg = ctx.createRadialGradient(x + 2, ty - 10, 0, x + 2, ty - 10, 40); lg.addColorStop(0, 'rgba(255,170,90,.22)'); lg.addColorStop(1, 'rgba(255,170,90,0)'); ctx.fillStyle = lg; ctx.fillRect(x - 40, ty - 50, 84, 84);
  }
  function door(x, ft) {
    const w = 132, top = ft - 172, sp = ft - 96;
    const path = () => { ctx.beginPath(); ctx.moveTo(x - w / 2, ft + 2); ctx.lineTo(x - w / 2, sp); ctx.quadraticCurveTo(x - w / 2, top + 14, x, top); ctx.quadraticCurveTo(x + w / 2, top + 14, x + w / 2, sp); ctx.lineTo(x + w / 2, ft + 2); ctx.closePath(); };
    ctx.save(); path(); ctx.clip();
    const sk = ctx.createLinearGradient(0, top, 0, ft); sk.addColorStop(0, '#2A2456'); sk.addColorStop(.45, '#8A4A6A'); sk.addColorStop(.8, '#E8945A'); sk.addColorStop(1, '#F6C07A');
    ctx.fillStyle = sk; ctx.fillRect(x - w, top, w * 2, ft - top + 4);
    ctx.fillStyle = 'rgba(255,240,210,.9)'; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.arc(x - 55 + hsh(k) * 110, top + 10 + hsh(k + 9) * 50, .7, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#4A2E48'; ctx.beginPath(); ctx.moveTo(x - w, ft - 24); ctx.quadraticCurveTo(x - 30, ft - 46, x + 10, ft - 30); ctx.quadraticCurveTo(x + 40, ft - 22, x + w, ft - 34); ctx.lineTo(x + w, ft + 4); ctx.lineTo(x - w, ft + 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2E1C2C'; ctx.beginPath(); ctx.moveTo(x - w, ft - 10); ctx.quadraticCurveTo(x, ft - 22, x + w, ft - 8); ctx.lineTo(x + w, ft + 4); ctx.lineTo(x - w, ft + 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(240,190,120,.6)'; ctx.beginPath(); ctx.moveTo(x - 3, ft - 16); ctx.lineTo(x + 3, ft - 16); ctx.lineTo(x + 34, ft + 4); ctx.lineTo(x - 34, ft + 4); ctx.closePath(); ctx.fill();
    ctx.restore();
    // the doors stood open, and the arch round them
    for (const sd of [-1, 1]) { const ex = x + sd * w / 2; ctx.fillStyle = '#3A2418'; ctx.beginPath(); ctx.moveTo(ex, sp + 4); ctx.lineTo(ex + sd * 22, sp + 14); ctx.lineTo(ex + sd * 22, ft + 6); ctx.lineTo(ex, ft + 2); ctx.closePath(); ctx.fill(); outline(.8);
      ctx.strokeStyle = '#141010'; ctx.lineWidth = 1.6; for (const k of [.25, .7]) { const yy = lerp(sp + 8, ft, k); ctx.beginPath(); ctx.moveTo(ex, yy); ctx.lineTo(ex + sd * 22, yy + 8); ctx.stroke(); } }
    path(); ctx.strokeStyle = '#6A5444'; ctx.lineWidth = 8; ctx.stroke(); ctx.strokeStyle = '#140C0A'; ctx.lineWidth = 1.2; ctx.stroke();
    // the light of the road on the floor
    ctx.save(); ctx.translate(x, ft + 30); ctx.scale(1, .32); const lg = ctx.createRadialGradient(0, 0, 0, 0, 0, 170); lg.addColorStop(0, 'rgba(255,200,140,.26)'); lg.addColorStop(1, 'rgba(255,200,140,0)'); ctx.fillStyle = lg; ctx.fillRect(-170, -170, 340, 340); ctx.restore();
  }
  // ---------------- the stalls ----------------
  const iron = '#24201E', ironL = '#5A5450';
  const STATIONS = {
    gerard(x, ft) { // the forge: a brick hearth under a hood of black iron, the fire's mouth, tongs and hammers on the wall, a quench barrel
      const hx = x + 34;
      ctx.fillStyle = '#4A2A20'; ctx.fillRect(hx - 48, ft - 62, 96, 62);
      for (let r = 0, y = ft - 8; y > ft - 62; r++, y -= 8) for (let cx = hx - 48 + (r % 2) * 8; cx < hx + 48; cx += 16) { ctx.fillStyle = r % 3 ? '#5A3224' : '#4E2C20'; ctx.fillRect(cx + .5, y + .5, 15, 7); }
      ctx.fillStyle = '#2A1612'; ctx.fillRect(hx - 52, ft - 66, 104, 6);
      ctx.fillStyle = iron; ctx.beginPath(); ctx.moveTo(hx - 54, ft - 66); ctx.lineTo(hx + 54, ft - 66); ctx.lineTo(hx + 18, ft - 140); ctx.lineTo(hx + 18, ft - 200); ctx.lineTo(hx - 18, ft - 200); ctx.lineTo(hx - 18, ft - 140); ctx.closePath(); ctx.fill(); outline(1);
      ctx.strokeStyle = ironL; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx - 48, ft - 70); ctx.lineTo(hx + 48, ft - 70); ctx.stroke();
      ctx.fillStyle = '#120806'; ctx.beginPath(); ctx.moveTo(hx - 28, ft - 12); ctx.lineTo(hx - 28, ft - 36); ctx.quadraticCurveTo(hx, ft - 56, hx + 28, ft - 36); ctx.lineTo(hx + 28, ft - 12); ctx.closePath(); ctx.fill();
      const cg = ctx.createLinearGradient(0, ft - 34, 0, ft - 12); cg.addColorStop(0, 'rgba(255,120,40,.2)'); cg.addColorStop(1, '#FF8A30'); ctx.fillStyle = cg; ctx.fillRect(hx - 26, ft - 26, 52, 14);
      for (let k = 0; k < 9; k++) { ctx.fillStyle = k % 2 ? '#FFD27A' : '#C2401A'; ctx.beginPath(); ctx.arc(hx - 22 + k * 5.5, ft - 14 - hsh(k) * 4, 2.6, 0, TAU); ctx.fill(); }
      // tools on the wall
      ctx.strokeStyle = iron; ctx.lineWidth = 1.6; for (let k = 0; k < 4; k++) { const tx = x - 86 + k * 12; ctx.beginPath(); ctx.moveTo(tx, ft - 128); ctx.lineTo(tx + (k % 2 ? 2 : -2), ft - 80); ctx.stroke(); }
      ctx.fillStyle = iron; ctx.fillRect(x - 92, ft - 132, 46, 3);
      for (const k of [0, 2]) { ctx.fillStyle = '#2E2A28'; ctx.fillRect(x - 92 + k * 12, ft - 84, 9, 6); }
    },
    julian(x, ft) { // the huntsman's wall: a rack of bows and quivers, a stag's antlers, a straw butt with its painted rings
      ctx.fillStyle = '#3A2A1C'; ctx.fillRect(x - 74, ft - 118, 148, 6); ctx.fillRect(x - 74, ft - 66, 148, 5);
      for (let k = 0; k < 3; k++) { const bx = x - 52 + k * 48; ctx.strokeStyle = '#6A4626'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx - 4, ft - 116); ctx.quadraticCurveTo(bx + 14, ft - 92, bx - 4, ft - 68); ctx.stroke();
        ctx.strokeStyle = '#E8E0C8'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(bx - 4, ft - 116); ctx.lineTo(bx - 4, ft - 68); ctx.stroke();
        ctx.fillStyle = '#5A3A20'; ctx.fillRect(bx + 12, ft - 112, 8, 30); ctx.strokeStyle = '#E8E0C8'; ctx.lineWidth = .8; for (let a = 0; a < 3; a++) { ctx.beginPath(); ctx.moveTo(bx + 14 + a * 2, ft - 112); ctx.lineTo(bx + 14 + a * 2, ft - 118); ctx.stroke(); } }
      // the antlers
      ctx.strokeStyle = '#D8C8A8'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x, ft - 130); ctx.quadraticCurveTo(x + sd * 20, ft - 136, x + sd * 30, ft - 158); ctx.moveTo(x + sd * 14, ft - 134); ctx.lineTo(x + sd * 14, ft - 148); ctx.moveTo(x + sd * 22, ft - 142); ctx.lineTo(x + sd * 30, ft - 146); ctx.stroke(); }
      ctx.fillStyle = '#5A3A22'; ell(x, ft - 128, 6, 5); ctx.fill(); outline(.6);
    },
    ganelon(x, ft) { // the armory: two stands with mail on them, his shield and Lorraine's on the wall, a banner
      for (const [sx, col] of [[x - 74, '#5E626A'], [x + 70, '#70747C']]) { ctx.fillStyle = '#3A2A1E'; ctx.fillRect(sx - 1.5, ft - 70, 3, 70); ctx.fillRect(sx - 12, ft - 3, 24, 3);
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(sx - 14, ft - 74); ctx.quadraticCurveTo(sx, ft - 80, sx + 14, ft - 74); ctx.lineTo(sx + 11, ft - 40); ctx.quadraticCurveTo(sx, ft - 36, sx - 11, ft - 40); ctx.closePath(); ctx.fill(); outline(.9);
        ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(sx + 3, ft - 72, 3, 28); ctx.fillStyle = col; ell(sx, ft - 86, 7, 8); ctx.fill(); outline(.8); }
      const shield = (sx, sy, field, charge, chev) => { ctx.fillStyle = field; ctx.beginPath(); ctx.moveTo(sx - 13, sy - 16); ctx.lineTo(sx + 13, sy - 16); ctx.lineTo(sx + 13, sy); ctx.quadraticCurveTo(sx + 12, sy + 12, sx, sy + 18); ctx.quadraticCurveTo(sx - 12, sy + 12, sx - 13, sy); ctx.closePath(); ctx.fill();
        ctx.save(); ctx.clip(); ctx.fillStyle = charge; if (chev) { ctx.beginPath(); ctx.moveTo(sx - 14, sy + 8); ctx.lineTo(sx, sy - 6); ctx.lineTo(sx + 14, sy + 8); ctx.lineTo(sx + 14, sy + 14); ctx.lineTo(sx, sy); ctx.lineTo(sx - 14, sy + 14); ctx.closePath(); ctx.fill(); } else { ctx.translate(sx, sy); ctx.rotate(.8); ctx.fillRect(-30, -3.4, 60, 6.8); } ctx.restore();
        ctx.beginPath(); ctx.moveTo(sx - 13, sy - 16); ctx.lineTo(sx + 13, sy - 16); ctx.lineTo(sx + 13, sy); ctx.quadraticCurveTo(sx + 12, sy + 12, sx, sy + 18); ctx.quadraticCurveTo(sx - 12, sy + 12, sx - 13, sy); ctx.closePath(); outline(1); };
      shield(x - 28, ft - 108, '#24365E', '#D8AA55', true); shield(x + 26, ft - 108, '#D8AA55', '#B82A2A', false);
      ctx.fillStyle = '#7A1E18'; ctx.beginPath(); ctx.moveTo(x - 10, ft - 164); ctx.lineTo(x + 10, ft - 164); ctx.lineTo(x + 10, ft - 132); ctx.lineTo(x, ft - 138); ctx.lineTo(x - 10, ft - 132); ctx.closePath(); ctx.fill(); outline(.6);
      ctx.strokeStyle = '#D8AA55'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 12, ft - 164); ctx.lineTo(x + 12, ft - 164); ctx.stroke();
    },
    dworkin(x, ft) { // the draughtsman's corner: shelves of inks and old books, and a half-drawn Trump on an easel
      ctx.fillStyle = '#2E1E16'; ctx.fillRect(x + 22, ft - 128, 70, 110);
      for (let s = 0; s < 4; s++) { const sy = ft - 124 + s * 27; ctx.fillStyle = '#4A3222'; ctx.fillRect(x + 22, sy + 22, 70, 3);
        for (let k = 0, bx = x + 25; bx < x + 88; k++) { const bw = 4 + hsh(s * 13 + k) * 4, bh = 12 + hsh(s * 7 + k) * 9; ctx.fillStyle = ['#6A2A2A', '#2A4A6A', '#5A5A2A', '#3A2A4A', '#7A5A2A'][(s + k) % 5]; ctx.fillRect(bx, sy + 22 - bh, bw, bh); bx += bw + .8; } }
      ctx.strokeStyle = '#4A3222'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 84, ft); ctx.lineTo(x - 70, ft - 96); ctx.lineTo(x - 56, ft); ctx.moveTo(x - 70, ft - 96); ctx.lineTo(x - 70, ft - 4); ctx.stroke();
      ctx.fillStyle = '#E8DCC0'; ctx.fillRect(x - 86, ft - 92, 32, 50); ctx.strokeStyle = '#C9A050'; ctx.lineWidth = 1.6; ctx.strokeRect(x - 86, ft - 92, 32, 50);
      const tg = ctx.createLinearGradient(0, ft - 90, 0, ft - 44); tg.addColorStop(0, '#9ABCE8'); tg.addColorStop(1, '#2A3A6A'); ctx.fillStyle = tg; ctx.fillRect(x - 83, ft - 89, 26, 34);
      ctx.strokeStyle = 'rgba(240,248,255,.8)'; ctx.lineWidth = .7; ctx.beginPath(); for (let k = 0; k < 3; k++) { ctx.moveTo(x - 70 + 3 + k * 3, ft - 72); ctx.arc(x - 70, ft - 72, 3 + k * 3, 0, Math.PI * 1.6); } ctx.stroke();
    },
    fiona(x, ft) { // the sorceress's shelf of vials, herbs hung to dry, and a circle of runes in the floor
      ctx.fillStyle = '#3A2A20'; ctx.fillRect(x + 20, ft - 92, 76, 4); ctx.fillRect(x + 20, ft - 60, 76, 4);
      for (let s = 0; s < 2; s++) for (let k = 0; k < 7; k++) { const vx = x + 26 + k * 10, vy = ft - 92 + s * 32; ctx.fillStyle = ['#7A3AB8', '#3AB88A', '#B83A5A', '#D8B84A'][(k + s) % 4]; ctx.globalAlpha = .85; rrect(vx - 3, vy - 12, 6, 12, 2); ctx.fill(); ctx.globalAlpha = 1; ctx.fillStyle = '#E8DCC0'; ctx.fillRect(vx - 1.5, vy - 15, 3, 3); }
      ctx.strokeStyle = '#3A2A1E'; ctx.lineWidth = 1; for (let k = 0; k < 5; k++) { const hx = x - 80 + k * 13; ctx.beginPath(); ctx.moveTo(hx, ft - 170); ctx.lineTo(hx, ft - 140); ctx.stroke(); ctx.fillStyle = k % 2 ? '#5A7A3A' : '#7A6A3A'; ell(hx, ft - 134, 4, 8); ctx.fill(); }
    },
    llewella(x, ft) { // the sea-mirror: a tall glass in a frame of nacre, the sea standing in it
      const mx = x + 38, my = ft - 76, rx = 30, ry = 58;
      ctx.fillStyle = '#E8E0D6'; ell(mx, my, rx + 7, ry + 7); ctx.fill(); outline(1.2);
      const fr = ctx.createLinearGradient(mx - rx, my - ry, mx + rx, my + ry); fr.addColorStop(0, '#F8F4FF'); fr.addColorStop(.4, '#C8D8E8'); fr.addColorStop(.7, '#F0D8E8'); fr.addColorStop(1, '#A8C0D0'); ctx.fillStyle = fr; ell(mx, my, rx + 5, ry + 5); ctx.fill();
      const wg = ctx.createLinearGradient(0, my - ry, 0, my + ry); wg.addColorStop(0, '#5AB8C8'); wg.addColorStop(.5, '#1E5A78'); wg.addColorStop(1, '#0A2438'); ctx.fillStyle = wg; ell(mx, my, rx, ry); ctx.fill();
      ctx.save(); ell(mx, my, rx, ry); ctx.clip(); ctx.fillStyle = 'rgba(20,50,70,.75)';
      for (const [dx, h] of [[-14, 26], [-5, 40], [5, 32], [14, 22]]) { ctx.beginPath(); ctx.moveTo(mx + dx - 3, my + 18); ctx.lineTo(mx + dx, my + 18 + h); ctx.lineTo(mx + dx + 3, my + 18); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU, sx = mx + Math.cos(a) * (rx + 5), sy = my + Math.sin(a) * (ry + 5); ctx.fillStyle = '#F4E8E0'; ell(sx, sy, 3.4, 2.6, a); ctx.fill(); outline(.5); }
      ctx.fillStyle = '#C86A6A'; ctx.beginPath(); ctx.moveTo(x - 70, ft); ctx.quadraticCurveTo(x - 80, ft - 28, x - 72, ft - 40); ctx.quadraticCurveTo(x - 64, ft - 26, x - 60, ft - 36); ctx.quadraticCurveTo(x - 54, ft - 18, x - 56, ft); ctx.closePath(); ctx.fill(); outline(.7);
    },
    random(x, ft) { // the gambler's corner: a lantern, a drum, playing cards pinned up on the wall
      for (let k = 0; k < 5; k++) { const cx = x + 26 + k * 13, cy = ft - 120 + (k % 2) * 8; ctx.save(); ctx.translate(cx, cy); ctx.rotate((k - 2) * .12); ctx.fillStyle = '#F0E6D0'; ctx.fillRect(-5, -7.5, 10, 15); ctx.strokeStyle = '#C9A050'; ctx.lineWidth = .7; ctx.strokeRect(-5, -7.5, 10, 15); ctx.fillStyle = k % 2 ? '#B82A2A' : '#1A1418'; ctx.font = '700 7px Georgia'; ctx.textAlign = 'center'; ctx.fillText(['♠', '♥', '♣', '♦', '♠'][k], 0, 3); ctx.restore(); }
      ctx.strokeStyle = iron; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 50, ft - 170); ctx.lineTo(x - 50, ft - 128); ctx.stroke();
      ctx.fillStyle = '#3A2A1E'; rrect(x - 57, ft - 128, 14, 18, 3); ctx.fill(); outline(.7); ctx.fillStyle = '#FFD890'; ctx.fillRect(x - 54, ft - 124, 8, 10);
    },
  };
  const FLOOR = { // the pieces of each stall standing out on the floor
    gerard(x, ft) { const ax = x - 40, ay = ft + 22; // the anvil on its stump, and the quench barrel
      ctx.fillStyle = '#5A3C26'; ctx.fillRect(ax - 10, ay - 16, 20, 16); outline(.8); ctx.fillStyle = '#6E4E34'; ell(ax, ay - 16, 10, 2.6); ctx.fill();
      ctx.strokeStyle = 'rgba(30,16,8,.6)'; ctx.lineWidth = .6; for (const dx of [-5, 1, 6]) { ctx.beginPath(); ctx.moveTo(ax + dx, ay - 14); ctx.lineTo(ax + dx + 1, ay - 1); ctx.stroke(); }
      const an = () => { ctx.beginPath(); ctx.moveTo(ax - 18, ay - 30); ctx.lineTo(ax + 13, ay - 30); ctx.quadraticCurveTo(ax + 27, ay - 29, ax + 30, ay - 25); ctx.quadraticCurveTo(ax + 20, ay - 24, ax + 13, ay - 23); ctx.lineTo(ax + 7, ay - 23); ctx.lineTo(ax + 9, ay - 16); ctx.lineTo(ax - 11, ay - 16); ctx.lineTo(ax - 9, ay - 23); ctx.lineTo(ax - 18, ay - 26); ctx.closePath(); };
      const ag = ctx.createLinearGradient(ax - 18, 0, ax + 30, 0); ag.addColorStop(0, '#2A2624'); ag.addColorStop(.6, '#4A4440'); ag.addColorStop(1, '#8A6A50');
      an(); ctx.fillStyle = ag; ctx.fill(); outline(1.1);
      ctx.fillStyle = '#B8A894'; ctx.fillRect(ax - 17, ay - 30, 30, 1.4); ctx.fillStyle = 'rgba(255,170,90,.55)'; ctx.fillRect(ax + 2, ay - 30, 14, 1.2);
      const bx = x + 92; ctx.fillStyle = '#5A3A22'; rrect(bx - 13, ft - 6, 26, 26, 4); ctx.fill(); outline(.9); ctx.strokeStyle = iron; ctx.lineWidth = 1.6; for (const yy of [ft - 1, ft + 13]) { ctx.beginPath(); ctx.moveTo(bx - 13, yy); ctx.lineTo(bx + 13, yy); ctx.stroke(); }
      ctx.fillStyle = '#1A2A30'; ell(bx, ft - 6, 12, 2.6); ctx.fill(); },
    julian(x, ft) { const tx = x + 66, ty = ft + 2; // the straw butt
      ctx.fillStyle = '#4A3222'; ctx.save(); ctx.translate(tx, ty); ctx.rotate(.12); ctx.fillRect(-2, -10, 3, 30); ctx.restore();
      ctx.fillStyle = '#C8A860'; ell(tx, ty - 22, 18, 20); ctx.fill(); outline(1);
      for (const [r, c] of [[14, '#E8E0C8'], [10, '#B83A2A'], [6, '#E8E0C8'], [3, '#D8AA55']]) { ctx.fillStyle = c; ell(tx, ty - 22, r, r * 1.1); ctx.fill(); }
      ctx.strokeStyle = '#6A4626'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(tx - 2, ty - 24); ctx.lineTo(tx - 16, ty - 30); ctx.moveTo(tx + 4, ty - 18); ctx.lineTo(tx - 10, ty - 14); ctx.stroke(); },
    dworkin(x, ft) { const tx = x - 40; // his table, the Trumps laid out on it
      ctx.fillStyle = '#3A2418'; ctx.fillRect(tx - 34, ft - 4, 4, 26); ctx.fillRect(tx + 30, ft - 4, 4, 26);
      ctx.fillStyle = '#5A3A24'; ctx.fillRect(tx - 38, ft - 10, 76, 7); outline(.8); ctx.fillStyle = '#6E4A2E'; ctx.fillRect(tx - 38, ft - 10, 76, 1.5);
      const cols = ['#C8503E', '#4A6A9A', '#3E7A4A', '#E4E2DA', '#D49866', '#2A6A7A'];
      for (let k = 0; k < 6; k++) { const cx = tx - 30 + k * 11; ctx.save(); ctx.translate(cx, ft - 12); ctx.scale(1, .5); ctx.rotate((k - 2.5) * .1); ctx.fillStyle = '#E8EEF8'; ctx.fillRect(-4.5, -7, 9, 14); ctx.fillStyle = cols[k]; ctx.fillRect(-3.5, -6, 7, 11); ctx.restore(); }
      ctx.fillStyle = '#141018'; ell(tx + 26, ft - 13, 3, 2); ctx.fill(); ctx.fillStyle = '#E8E0C8'; ctx.fillRect(tx - 34, ft - 17, 2.4, 7); },
    fiona(x, ft) { const bx = x - 44; // the brazier on its tripod, over its circle of runes
      ctx.strokeStyle = 'rgba(190,120,255,.4)'; ctx.lineWidth = 1; ell(bx, ft + 20, 34, 8); ctx.stroke(); ell(bx, ft + 20, 28, 6.4); ctx.stroke();
      ctx.fillStyle = 'rgba(210,150,255,.5)'; for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; ctx.fillRect(bx + Math.cos(a) * 31 - 1, ft + 20 + Math.sin(a) * 7.2 - 1, 2, 2); }
      ctx.strokeStyle = iron; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx - 12, ft + 20); ctx.lineTo(bx - 4, ft - 2); ctx.moveTo(bx + 12, ft + 20); ctx.lineTo(bx + 4, ft - 2); ctx.moveTo(bx, ft + 22); ctx.lineTo(bx, ft - 2); ctx.stroke();
      ctx.fillStyle = iron; ctx.beginPath(); ctx.moveTo(bx - 15, ft - 8); ctx.lineTo(bx + 15, ft - 8); ctx.quadraticCurveTo(bx + 12, ft + 2, bx, ft + 2); ctx.quadraticCurveTo(bx - 12, ft + 2, bx - 15, ft - 8); ctx.closePath(); ctx.fill(); outline(.9); },
    random(x, ft) { const tx = x - 44; // the card table, its baize, dice and stacked coin; his drum
      ctx.fillStyle = '#3A2418'; ctx.fillRect(tx - 26, ft - 4, 4, 26); ctx.fillRect(tx + 22, ft - 4, 4, 26);
      ctx.fillStyle = '#1E5A3A'; ctx.fillRect(tx - 30, ft - 10, 60, 7); outline(.8);
      ctx.fillStyle = '#F0E6D0'; ctx.fillRect(tx - 20, ft - 15, 5, 5); ctx.fillRect(tx - 12, ft - 14, 5, 5); ctx.fillStyle = '#1A1418'; ctx.fillRect(tx - 18.4, ft - 13.4, 1.2, 1.2); ctx.fillRect(tx - 10, ft - 12, 1.2, 1.2);
      for (let k = 0; k < 3; k++) for (let j = 0; j <= k; j++) { ctx.fillStyle = '#D8AA55'; ell(tx + 6 + k * 7, ft - 11 - j * 1.6, 3, 1.1); ctx.fill(); }
      const dx = x + 62; ctx.fillStyle = '#8A2A22'; ctx.fillRect(dx - 14, ft - 2, 28, 20); ctx.fillStyle = '#E8DCC0'; ell(dx, ft - 2, 14, 4); ctx.fill(); outline(.8);
      ctx.strokeStyle = '#D8AA55'; ctx.lineWidth = .8; ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(dx - 14 + k * 9.3, ft); ctx.lineTo(dx - 9 + k * 9.3, ft + 16); } ctx.stroke(); },
  };

  // ======================================================================================================
  // WHAT MOVES: the fires, the glass, the Pattern, and the figures
  // ======================================================================================================
  function flame(x, y, s, t, rgbIn, rgbOut, seed) {
    const f = 1 + .18 * Math.sin(t * 11 + seed) + .1 * Math.sin(t * 23 + seed * 2);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(${rgbOut},.75)`; ctx.beginPath(); ctx.moveTo(x - 3.6 * s, y); ctx.quadraticCurveTo(x - 4 * s, y - 6 * s * f, x + Math.sin(t * 7 + seed) * 1.4 * s, y - 13 * s * f); ctx.quadraticCurveTo(x + 4 * s, y - 6 * s * f, x + 3.6 * s, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = `rgba(${rgbIn},.9)`; ctx.beginPath(); ctx.moveTo(x - 1.8 * s, y); ctx.quadraticCurveTo(x - 2 * s, y - 3.6 * s * f, x, y - 7 * s * f); ctx.quadraticCurveTo(x + 2 * s, y - 3.6 * s * f, x + 1.8 * s, y); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function liveBack(t) {
    const ft = FT(), x0 = H.cam - 160, x1 = H.cam + VW + 160;
    // the Pattern laid in the floor by the door he came in by, its lines burning faintly
    if (window.W7 && W7.drawPattern && 40 < x1) { ctx.save(); ctx.translate(178, ft + 58); ctx.scale(-.42, .42); try { W7.drawPattern(0, 0, .35, .85, .45 + .25 * Math.sin(t * .9), t); } catch (e) {} ctx.restore(); }
    // torches on the pillars
    const cols = new Set(); for (const v of H.cast) { cols.add(v.x - STEP / 2); cols.add(v.x + STEP / 2); } cols.add(H.door - 125);
    for (const px of cols) if (px > x0 && px < x1 && px < H.door - 100) { flame(px + 2, ft - 98, 1.1, t, '255,240,180', '255,130,50', px); glowR(px + 2, ft - 104, 46, '255,160,80', .16 + .04 * Math.sin(t * 9 + px)); }
    for (const v of H.cast) { if (v.x + 160 < x0 || v.x - 160 > x1) continue; const x = v.x;
      if (v.id === 'gerard') { const hx = x + 34, k = .75 + .25 * Math.sin(t * 5.2) * Math.sin(t * 2.3 + 1); for (let i = 0; i < 6; i++) flame(hx - 18 + i * 7, ft - 16, 1.2 + hsh(i) * .6, t, '255,236,160', '255,110,40', i * 3.1);
        glowR(hx, ft - 22, 70, '255,130,50', .32 * k); glowR(hx, ft - 10, 130, '255,110,40', .12 * k); }
      else if (v.id === 'fiona') { const bx = x - 44; for (let i = 0; i < 4; i++) flame(bx - 9 + i * 6, ft - 8, 1.3 + hsh(i + 5) * .5, t, '240,220,255', '170,90,255', i * 2.3);
        glowR(bx, ft - 18, 70, '170,100,255', .28 + .06 * Math.sin(t * 6)); glowR(bx, ft + 20, 44, '200,140,255', .12 + .05 * Math.sin(t * 1.7)); }
      else if (v.id === 'dworkin') { flame(x - 73, ft - 17, .7, t, '255,240,190', '255,170,80', 4); glowR(x - 73, ft - 20, 34, '255,190,110', .22); }
      else if (v.id === 'random') { glowR(x - 50, ft - 118, 36, '255,210,130', .24 + .04 * Math.sin(t * 4)); }
      else if (v.id === 'llewella') { mirrorLive(x + 38, ft - 76, 30, 58, t); }
      else if (v.id === 'julian') { glowR(x, ft - 120, 60, '220,230,190', .06); }
      else if (v.id === 'ganelon') { glowR(x, ft - 108, 60, '200,210,240', .06); }
    }
    // the road's light through the door
    if (H.door > x0 && H.door < x1) { glowR(H.door, ft - 40, 120, '255,190,120', .14 + .03 * Math.sin(t * .8)); ctx.save(); ctx.font = '700 8px Cinzel, Georgia, serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,236,196,.9)'; ctx.strokeStyle = 'rgba(20,10,10,.8)'; ctx.lineWidth = 2.6;
      const s = `THE ROAD · ${String(STAGES[roadStage()].name).toUpperCase()}`; ctx.strokeText(s, H.door, ft - 124); ctx.fillText(s, H.door, ft - 124); ctx.restore(); }
  }
  function mirrorLive(mx, my, rx, ry, t) { // the sea standing in the glass: light moving down through it, and the drowned towers of Rebma swaying
    ctx.save(); ell(mx, my, rx, ry); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 5; k++) { const y = my - ry + ((t * 14 + k * 26) % (ry * 2)); ctx.strokeStyle = `rgba(170,240,255,${.16 - Math.abs(y - my) / ry * .12})`; ctx.lineWidth = 1; ctx.beginPath(); for (let x = mx - rx; x <= mx + rx; x += 4) ctx.lineTo(x, y + Math.sin(x * .3 + t * 2 + k) * 1.6); ctx.stroke(); }
    for (let k = 0; k < 3; k++) { const a = t * .5 + k * 2.1; ctx.fillStyle = 'rgba(200,250,255,.12)'; ctx.beginPath(); ctx.moveTo(mx + Math.sin(a) * 10 - 4, my - ry); ctx.lineTo(mx + Math.sin(a) * 18 + 6, my + ry); ctx.lineTo(mx + Math.sin(a) * 18 - 2, my + ry); ctx.lineTo(mx + Math.sin(a) * 10 - 8, my - ry); ctx.closePath(); ctx.fill(); }
    ctx.restore(); glowR(mx, my, 70, '110,220,230', .12 + .04 * Math.sin(t * 1.3));
  }
  function liveFront(t) {
    if (fine()) { ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const e of H.embers) { const a = (1 - e.t / e.life) * .9; ctx.fillStyle = `rgba(255,${150 + 60 * a | 0},70,${a})`; ctx.fillRect(e.x - .7, e.y - .7, 1.4, 1.4); }
      for (const s of H.sparks) { const a = 1 - s.t / s.life; ctx.strokeStyle = `rgba(255,${200 + 50 * a | 0},120,${a})`; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * .02, s.y - s.vy * .02); ctx.stroke(); }
      ctx.restore(); }
    // the names over the stalls
    for (const v of H.cast) { const V = CAST[v.id], near = v.id === H.target, a = near ? 1 : cl01(1.4 - Math.abs(v.x - H.x) / 240) * .8 + .2;
      if (v.x < H.cam - 80 || v.x > H.cam + VW + 80) continue;
      const y = vendorY() - 112 * V.s; ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.strokeStyle = 'rgba(20,10,14,.9)'; ctx.lineWidth = 3;
      ctx.font = '700 9px Cinzel, Georgia, serif'; ctx.fillStyle = near ? '#FFE8A8' : '#EBCB7C'; ctx.strokeText(V.name.toUpperCase(), v.x, y); ctx.fillText(V.name.toUpperCase(), v.x, y);
      ctx.font = '700 6.5px Cinzel, Georgia, serif'; ctx.fillStyle = '#E8DCC8'; ctx.lineWidth = 2.4; ctx.strokeText(V.role.toUpperCase(), v.x, y + 9); ctx.fillText(V.role.toUpperCase(), v.x, y + 9);
      ctx.restore(); }
  }
  function vignette() {
    ctx.save(); const g = ctx.createRadialGradient(VW / 2, Y_OFF + VIEW_H * .55, VIEW_H * .3, VW / 2, Y_OFF + VIEW_H * .55, VW * .72);
    g.addColorStop(0, 'rgba(10,5,6,0)'); g.addColorStop(1, 'rgba(10,5,6,.55)'); ctx.fillStyle = g; ctx.fillRect(0, Y_OFF, VW, VIEW_H); ctx.restore();
  }

  // ---------------- the figures ----------------
  const lookCache = {};
  const lookOf = (id) => lookCache[id] || (lookCache[id] = LOOKS[id]());
  // each one's idle: Gérard at the anvil until he is spoken to; the others at their own small business
  function vendorPose(v, t, near) {
    const id = v.id, br = Math.sin(t * 1.6 + v.ph), p = { walk: 0, Y: .22, headTurn: false, noCloak: 1, weapon: 'fists', breath: br, arm: 1.15, backArm: 1.2 };
    if (id === 'gerard') {
      p.weapon = 'hammer'; p.tier = 1;
      if (near) { p.arm = 1.2; p.grip = .6; p.Y = .3; return p; }
      const q = ((t + v.ph) % 1.3) / 1.3; let a;
      if (q < .62) a = lerp(.6, -2.3, sm(q / .62)); else if (q < .74) a = lerp(-2.3, .6, ((q - .62) / .12) ** 2); else a = .6;
      p.arm = a; p.lean = q > .62 && q < .8 ? .18 : .06; p.backArm = .9; p.backElbow = 1.2; p.sink = q > .7 && q < .85 ? 2 : 0;
      const k = Math.floor((t + v.ph) / 1.3); if (q >= .74 && H.struck.gerard !== k) { H.struck.gerard = k; strikeSparks(v); }
      return p;
    }
    if (id === 'julian') { p.weapon = 'shortbow'; p.arm = .55 + .05 * br; p.grip = -.2; p.backArm = 1.0; return p; }
    if (id === 'dworkin') { p.lean = .32; p.arm = near ? .8 : .55 + .22 * Math.sin(t * 2.2 + v.ph); p.elbow = near ? 0 : .9; p.backArm = 1.4; p.backElbow = 1.2; return p; }
    if (id === 'ganelon') { p.arm = 1.0; p.elbow = .9; p.backArm = 1.3; p.backElbow = .3; p.Y = .3; return p; }
    if (id === 'fiona') { p.arm = near ? 1.0 : .1 + .15 * Math.sin(t * 1.3 + v.ph); p.elbow = near ? 0 : .5; p.backArm = near ? 1.2 : .3 + .12 * Math.sin(t * 1.1); p.backElbow = near ? 0 : .5; return p; }
    if (id === 'llewella') { p.arm = near ? 1.0 : .25 + .08 * Math.sin(t * .9 + v.ph); p.backArm = 1.15; p.lean = -.04; return p; }
    if (id === 'random') { const sh = Math.sin(t * 7 + v.ph); p.arm = .9; p.elbow = 1.5 + (near ? 0 : .12 * sh); p.backArm = .95; p.backElbow = 1.5 - (near ? 0 : .12 * sh); return p; }
    return p;
  }
  function strikeSparks(v) {
    const ax = v.x - 40, ay = FT() + 22 - 28;
    for (let k = 0; k < 9; k++) H.sparks.push({ x: ax + rand(-4, 6), y: ay, vx: rand(-70, 70), vy: rand(-150, -40), t: 0, life: rand(.25, .55) });
    if (!H.panel && Math.abs(H.x - v.x) < 280 && sfxOn && actx && actx.state === 'running') { try { tone(2400, .09, 'triangle', .025); tone(3600, .05, 'sine', .012); } catch (e) {} }
  }
  // the beard a few of them wear (in the head's own frame, as drawHumanoid leaves it in HEAD_MASK), and Dworkin's long one
  function beard(hy, col, grey, len) {
    ctx.save(); ctx.translate(0, hy + 3); ctx.scale(1, len); ctx.translate(0, -(hy + 3));
    const bd = () => { ctx.beginPath(); ctx.moveTo(1.4, hy - .4); ctx.quadraticCurveTo(1.6, hy + 7, 3.6, hy + 11); ctx.quadraticCurveTo(5.4, hy + 16.4, 10.4, hy + 17.2); ctx.lineTo(11.2, hy + 15.4); ctx.quadraticCurveTo(12.6, hy + 11.4, 10.8, hy + 8.4);
      ctx.lineTo(9.7, hy + 7.2); ctx.lineTo(10.2, hy + 6.2); ctx.lineTo(10.9, hy + 5.4); ctx.quadraticCurveTo(10.2, hy + 3.9, 8.6, hy + 4.1); ctx.quadraticCurveTo(7, hy + 4.6, 6.6, hy + 6.4); ctx.quadraticCurveTo(5.4, hy + 4.4, 4.4, hy + 1.6); ctx.closePath(); };
    bd(); let fill = C(col);
    if (fine() && grey) { const g = ctx.createLinearGradient(0, hy, 0, hy + 16); g.addColorStop(0, col); g.addColorStop(1, grey); fill = g; }
    ctx.fillStyle = fill; ctx.fill(); outline(.9);
    if (fine()) { ctx.save(); bd(); ctx.clip(); ctx.lineCap = 'round'; ctx.lineWidth = .45; for (let i = 0; i < 9; i++) { const x = 2.6 + i * .95, y = hy + 3 + (i % 3); ctx.strokeStyle = i % 3 === 1 ? 'rgba(255,248,236,.45)' : 'rgba(30,14,6,.4)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + .8, y + 6, x + 1.4 + i * .2, y + 10.5); ctx.stroke(); } ctx.restore(); }
    ctx.restore();
  }
  // long hair falling from the crown down the back to the shoulders (Fiona's red, Llewella's sea-green), in the head's frame
  function longHair(L, hy, t) {
    const sw = Math.sin(t * 1.3) * .8, p = () => { ctx.beginPath(); ctx.moveTo(4, hy - 10.6); ctx.quadraticCurveTo(-8, hy - 12, -10.4, hy - 2); ctx.quadraticCurveTo(-12.4 + sw, hy + 14, -10.6 + sw, hy + 30);
      ctx.quadraticCurveTo(-6 + sw, hy + 33, -1.6 + sw * .6, hy + 29); ctx.quadraticCurveTo(-3.6, hy + 16, -2.4, hy + 4); ctx.quadraticCurveTo(-1, hy - 4, 6, hy - 6.4); ctx.closePath(); };
    p(); let fill = C(L.hair);
    if (fine()) { const g = ctx.createLinearGradient(-12, 0, 4, 0); g.addColorStop(0, L.hairDk); g.addColorStop(.6, L.hair); g.addColorStop(1, L.hairLt); fill = g; }
    ctx.fillStyle = fill; ctx.fill(); outline(.9);
    if (fine()) { ctx.strokeStyle = C(L.hairLt); ctx.globalAlpha = .5; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(-6, hy - 6); ctx.quadraticCurveTo(-9 + sw, hy + 10, -7.6 + sw, hy + 26); ctx.stroke(); ctx.globalAlpha = 1; }
  }
  function dressHead(id, L, head, t) {
    ctx.save(); ctx.setTransform(head.m);
    try {
      if (id === 'ganelon' && window.W8 && W8.headGear) W8.headGear(L, head.hy, t);
      else if (id === 'gerard') beard(head.hy, '#6A4428', '#8A6040', 1);
      else if (id === 'dworkin') { longHair(L, head.hy, t); beard(head.hy, '#E6E0D4', '#FFFFFF', 1.7); }
      else if (L.hairLong) longHair(L, head.hy, t);
    } finally { ctx.restore(); }
  }
  function drawVendor(v, t) {
    const V = CAST[v.id], L = lookOf(v.id), near = H.target === v.id || H.panel === v.id, y = vendorY();
    const f = near || Math.abs(H.x - v.x) < 150 ? (Math.sign(H.x - v.x) || V.f) : V.f;
    const pose = vendorPose(v, t, near);
    ctx.save(); ctx.translate(v.x, y); ctx.scale(f * V.s, V.s);
    shadow(0, 0, 13);
    const hm = HEAD_MASK, W8o = window.W8, hih = W8o ? W8o.hornInHand : undefined; HEAD_MASK = null;
    if (W8o && v.id !== 'ganelon') W8o.hornInHand = true; // (the Horn of Lorraine rides at the prince's belt once won: only Ganelon's own hangs at his, w8_late.js)
    try { drawHumanoid(L, pose); } finally { if (W8o) W8o.hornInHand = hih; }
    const head = HEAD_MASK; HEAD_MASK = hm;
    if (head) dressHead(v.id, L, head, t);
    ctx.restore();
    hatchActor(v.x, y, 13 * V.s, 50 * V.s);
  }
  function drawHero(t) {
    const st = H.moving ? (H.run ? 'run' : 'walk') : 'idle';
    const m = mode; mode = 'play';
    try {
      const pose = KIT ? KIT.poseAs(st, H.walk) : { walk: H.walk };
      pose.live = 1;
      shadow(H.x, H.y, 13);
      drawPlayerAt(H.x, H.y, 0, H.f, pose, 1);
      hatchActor(H.x, H.y, 13, 50);
    } finally { mode = m; }
  }
  const KIT = window.ENDINGS && ENDINGS.kit;
  function figures(t) {
    const list = [], boxes = [];
    for (const v of H.cast) { if (v.x < H.cam - 90 || v.x > H.cam + VW + 90) continue; const s = CAST[v.id].s; list.push([vendorY(), () => drawVendor(v, t)]); boxes.push([v.x - 70 * s, vendorY() - 130 * s, v.x + 70 * s, vendorY() + 14]); }
    list.push([H.y, () => drawHero(t)]); boxes.push([H.x - 90, H.y - 150, H.x + 90, H.y + 16]);
    list.sort((a, b) => a[0] - b[0]);
    const hm = HEAD_MASK;
    inkBegin(boxes);
    try { for (const [, fn] of list) { try { fn(); } catch (e) { console.error(e); } } }
    finally { inkEnd(); HEAD_MASK = hm; }
  }

  // ---------------- a vendor's portrait, for the head of the panel ----------------
  function portrait(cv, id) {
    const V = CAST[id], L = lookOf(id), g = cv.getContext('2d'), W = cv.width, Hh = cv.height, old = ctx, fl = FLASH, ti = TINT, hm = HEAD_MASK;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, Hh);
    const bg = g.createLinearGradient(0, 0, 0, Hh); bg.addColorStop(0, V.bg[0]); bg.addColorStop(1, V.bg[1]); g.fillStyle = bg; g.fillRect(0, 0, W, Hh);
    const lg = g.createRadialGradient(W * .55, Hh * .32, 2, W * .55, Hh * .32, W * .6); lg.addColorStop(0, 'rgba(255,244,220,.35)'); lg.addColorStop(1, 'rgba(255,244,220,0)'); g.fillStyle = lg; g.fillRect(0, 0, W, Hh);
    ctx = g; FLASH = false; TINT = null;
    try {
      const s = Hh / 38; g.setTransform(s, 0, 0, s, W * .44, Hh + 56 * s);
      const pose = vendorPose({ id, ph: 0, x: 0 }, 0, true); pose.Y = .2; pose.breath = 0;
      HEAD_MASK = null; drawHumanoid(L, pose); const head = HEAD_MASK;
      if (head) dressHead(id, L, head, 0);
    } finally { ctx = old; FLASH = fl; TINT = ti; HEAD_MASK = hm; }
    g.setTransform(1, 0, 0, 1, 0, 0);
    try { paintCard(cv, W / 96); } catch (e) {}
  }

  // ======================================================================================================
  // THE LOOK OF THE HALL'S PAGE: its plate, its prompt, and the vendor's panel over it
  // ======================================================================================================
  const CSS = `
  #fhUi { position: absolute; inset: 0; z-index: 4; pointer-events: none; font-family: var(--ui); }
  #fhUi .fh-top { position: absolute; top: max(8px, env(safe-area-inset-top, 0px)); left: max(12px, env(safe-area-inset-left, 0px)); right: max(12px, env(safe-area-inset-right, 0px)); display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
  #fhUi .fh-plate { pointer-events: none; padding: 6px 14px 7px; border-radius: 8px; border: 1.5px solid transparent; text-align: center;
    background: var(--engrave) padding-box, var(--lacq) padding-box, var(--foil) border-box; box-shadow: inset 0 0 0 2px rgba(0,0,0,.6), inset 0 0 0 3px rgba(214,174,88,.35), 0 6px 14px -6px rgba(0,0,0,.8); opacity: .94; }
  #fhUi .fh-kick { font: 700 8.5px var(--label); letter-spacing: .2em; color: var(--gold); }
  #fhUi .fh-title { font: 700 clamp(13px, 2.2vw, 18px) var(--title); color: var(--text); text-shadow: 0 2px 0 #2A0E18; }
  #fhUi .fh-mats { display: flex; gap: 12px; justify-content: center; font: 700 12.5px var(--label); margin-top: 2px; font-variant-numeric: tabular-nums; }
  #fhUi .fh-mats .s { color: var(--mint); } #fhUi .fh-mats .g { color: var(--petal); }
  #fhUi .fh-btns { pointer-events: auto; display: flex; gap: 8px; }
  #fhUi .fh-btns .cta { min-height: 36px; padding: 6px 14px; font-size: 12.5px; }
  #fhUi .fh-hint { position: absolute; left: 50%; bottom: 84px; translate: -50% 0; font: 600 12px var(--label); letter-spacing: .06em; color: rgba(244,234,219,.85); text-shadow: 0 1px 2px #000; white-space: nowrap; transition: opacity .3s; }
  #fhUi .fh-talk { pointer-events: auto; position: absolute; left: 50%; bottom: max(14px, env(safe-area-inset-bottom, 0px)); translate: -50% 0; display: grid; gap: 2px; justify-items: center; cursor: pointer;
    padding: 8px 22px 9px; border-radius: 10px; border: 1.5px solid transparent; color: var(--text); font-family: var(--label);
    background: var(--engrave) padding-box, var(--lacq) padding-box, var(--foil) border-box; box-shadow: inset 0 0 0 2px rgba(0,0,0,.6), inset 0 0 0 3px rgba(214,174,88,.38), 0 8px 18px -6px rgba(0,0,0,.85), 0 0 18px rgba(216,170,85,.25); animation: fhIn .18s ease-out; }
  #fhUi .fh-talk .fh-tw { font: 700 13px var(--label); letter-spacing: .08em; color: #EBCB7C; white-space: nowrap; }
  #fhUi .fh-talk .fh-tk { font: 700 11px var(--label); letter-spacing: .12em; color: var(--soft); }
  html:not(.kbd) #fhUi .fh-talk { left: auto; translate: none; right: max(26px, env(safe-area-inset-right, 0px)); bottom: 22px; min-width: 132px; min-height: 92px; align-content: center; border-radius: 16px; }
  html:not(.kbd) #fhUi .fh-talk .fh-tk { font-size: 18px; color: var(--text); letter-spacing: .16em; }
  html:not(.kbd) #fhUi .fh-talk:active { translate: 0 2px; }
  @keyframes fhIn { from { opacity: 0; } to { opacity: 1; } }
  #app.fhall #controls .btn, #app.fhall #runTip { display: none !important; }
  #forgeOv .vhide { display: none !important; }
  #forgeOv.vendor { background: rgba(10,6,8,.62) !important; background-image: none !important; }
  #forgeOv.vendor > .wrap { max-width: 780px; gap: 10px; }
  #forgeOv.vendor .plaque { padding: 6px 16px 7px; gap: 4px; }
  #forgeOv.vendor .plaque > .kicker, #forgeOv.vendor .plaque > .h2, #forgeOv.vendor .plaque > .pip { display: none; }
  #fhHead { width: 100%; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 14px; align-items: center; padding: 10px 14px; text-align: left; }
  #fhHead canvas { width: 76px; height: 76px; border-radius: 6px; box-shadow: 0 0 0 1px #0A0705, 0 0 0 2.5px #C9A050, 0 0 0 3.5px #0A0705; }
  #fhHead .fh-name { font: 700 clamp(18px, 3vw, 24px) var(--title); color: var(--text); line-height: 1.1; }
  #fhHead .fh-role { font: 700 10px var(--label); letter-spacing: .2em; color: var(--gold); margin-top: 2px; }
  #fhHead .fh-line { margin: 5px 0 0; font-size: 13.5px; line-height: 1.4; color: var(--soft); font-style: italic; }
  #fhHead .cta { white-space: nowrap; padding-inline: 16px; }
  #fhGear { width: 100%; max-width: 520px; display: grid; gap: 6px; justify-items: center; padding: 10px 16px 12px; }
  #fhGear .h3 { margin: 0; }
  #fhGear ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 3px; text-align: left; width: 100%; font-size: 13px; color: var(--soft); }
  #fhGear li.got { color: var(--mint); } #fhGear li b { color: var(--text); }
  #forgeOv:not(.vendor) #fhHead, #forgeOv:not(.vendor) #fhGear { display: none !important; }
  @media (max-width: 620px) { #fhHead { grid-template-columns: auto minmax(0, 1fr); } #fhHead .cta { grid-column: 1 / -1; } }
  `;

  // ======================================================================================================
  // CONSOLE AND TESTS
  // ======================================================================================================
  window.FORGEHALL = {
    get state() { return { on: H.on, panel: H.panel, x: H.x, y: H.y, cam: H.cam, target: H.target, door: H.door, len: H.len, pref, cast: H.cast.map(v => ({ id: v.id, x: v.x })) }; },
    CAST, ORDER,
    goTo(id) { const v = id === 'door' ? { x: H.door } : H.cast.find(q => q.id === id); if (!v) return false; H.x = v.x + (id === 'door' ? 20 : 30); H.y = clamp(FT() + 50, heroYMin(), heroYMax()); H.cam = clamp(H.x - VW * .42, 0, Math.max(0, H.len - VW)); H.target = id; return true; },
    talk: () => interact(), close: () => closePanel(),
    view(v) { setPref(v === 'menu' ? 'menu' : 'hall'); if (mode === 'forge') showOnly('forgeOv'); return pref; },
    tiles: () => tiles.size,
    // (a test can paint any of them in any pose: FORGEHALL.dbg.draw(id, pose, x, y, s) on the current context)
    dbg: { lookOf, vendorPose, draw(id, pose, x, y, s = 1) { const L = lookOf(id), hm = HEAD_MASK; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); HEAD_MASK = null; drawHumanoid(L, pose); const head = HEAD_MASK; HEAD_MASK = hm;
      if (head) dressHead(id, L, head, 0);
      ctx.restore(); } },
  };
})();
