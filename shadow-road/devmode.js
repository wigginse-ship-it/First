'use strict';
// ---------- dev mode: jump straight to any world, zone or boss for testing ----------
// A small "Dev mode" button under the title's Continue / New journey. It opens a panel listing every world and its
// zones (the last zone of each is its boss room), the Trump choice after the dream, and a few test switches. Jumping
// changes the save, so the first time the panel is used it keeps a copy of the save as it was; "Restore my save" puts
// that copy back. Console: devMode() opens the panel.
(() => {
  const BACKUP = 'shadowroad-devbackup', OPTS = 'shadowroad-devopts';
  const DEV = window.DEV = { god: false };
  let opts = { god: false, arsenal: false, relics: false, cycle: 0 };
  try { Object.assign(opts, JSON.parse(localStorage.getItem(OPTS) || '{}')); } catch (e) {}
  const keepOpts = () => { try { localStorage.setItem(OPTS, JSON.stringify(opts)); } catch (e) {} };
  DEV.god = !!opts.god;

  // invincible: blows land (and flash) but take nothing off
  { const _pd = playerDamage; playerDamage = function (dmg, fromX, big) { if (DEV.god && P) { const hp = P.hp; _pd(dmg, fromX, big); P.hp = Math.max(hp, P.hp); return; } return _pd(dmg, fromX, big); }; }

  const backup = () => { try { if (!localStorage.getItem(BACKUP)) localStorage.setItem(BACKUP, localStorage.getItem(SAVE_KEY) || JSON.stringify(freshSave())); } catch (e) {} };
  function restore() {
    try { const raw = localStorage.getItem(BACKUP); if (!raw) return; localStorage.setItem(SAVE_KEY, raw); localStorage.removeItem(BACKUP); } catch (e) {}
    location.reload();
  }

  function applyOpts() {
    save.started = true;
    save.cycle = Math.max(0, opts.cycle | 0);
    if (opts.arsenal) { for (const id of WEAPON_ORDER) { save.owned[id] = true; save.wl[id] = Math.max(save.wl[id] || 1, WMAX()); } if (typeof ARROW_TIERS !== 'undefined') save.alv = ARROW_TIERS.length; }
    if (opts.relics) { save.silverArm = true; save.w7relic = true; save.w8relic = true; }
  }
  function go(i, zone) {
    backup(); applyOpts(); close();
    save.stage = i; save.done = false; save.atChoice = false; save.branch = i >= 5 ? i : null;
    persist(); play(i, zone);
    if (DEV.god && P) P.hp = maxHp();
  }
  function toChoice() {
    backup(); applyOpts(); close();
    save.stage = 4; save.done = false; save.branch = null; save.atChoice = true; persist();
    if (window.BRANCH && BRANCH.resume) { play(4, 0); BRANCH.resume(); }
  }

  // ---------------- the panel ----------------
  let el = null;
  function close() { if (el) { el.remove(); el = null; } }
  function open() {
    close();
    el = document.createElement('div'); el.id = 'devPanel';
    el.innerHTML = `<style>
      #devPanel { position: fixed; inset: 0; z-index: 9999; background: rgba(8,6,14,.86); display: flex; align-items: center; justify-content: center; font: 13px/1.4 system-ui, sans-serif; color: #F2E8D4; }
      #devPanel .box { background: #1E1A2A; border: 1px solid #8E7A52; border-radius: 10px; padding: 14px 16px; width: min(720px, calc(100vw - 32px)); max-height: calc(100vh - 32px); overflow: auto; box-sizing: border-box; }
      #devPanel h3 { margin: 0 0 8px; font-size: 15px; letter-spacing: .08em; color: #EED48A; }
      #devPanel .w { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 6px 0; border-top: 1px solid rgba(238,212,138,.15); }
      #devPanel .w b { min-width: 170px; }
      #devPanel button { font: inherit; background: #3A3050; color: #F2E8D4; border: 1px solid #6E5E8A; border-radius: 6px; padding: 5px 10px; cursor: pointer; min-height: 32px; }
      #devPanel button:hover, #devPanel button:focus { background: #54467A; outline: none; }
      #devPanel button.boss { border-color: #C8607A; }
      #devPanel .opts { display: flex; flex-wrap: wrap; gap: 12px; margin: 4px 0 8px; }
      #devPanel label { display: flex; gap: 5px; align-items: center; cursor: pointer; }
      #devPanel .foot { display: flex; justify-content: space-between; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
      #devPanel .note { opacity: .65; font-size: 12px; }
    </style><div class="box"><h3>DEV MODE · JUMP TO A LEVEL</h3>
      <div class="opts">
        <label><input type="checkbox" data-o="god"> Invincible</label>
        <label><input type="checkbox" data-o="arsenal"> All weapons, max level, best arrows</label>
        <label><input type="checkbox" data-o="relics"> All relics</label>
        <label>Cycle <select data-o="cycle">${[0, 1, 2, 3].map(c => `<option value="${c}">${c ? 'NG+' + c : 'first'}</option>`).join('')}</select></label>
      </div>
      <div class="list"></div>
      <div class="foot"><span class="note">Jumping changes your save; the first jump keeps a copy of it.</span>
        <span><button data-a="restore">Restore my save</button> <button data-a="close">Close</button></span></div></div>`;
    const list = el.querySelector('.list');
    STAGES.forEach((S, i) => {
      const Z = (ZONES[i] && ZONES[i].zones) || [{}], row = document.createElement('div'); row.className = 'w';
      row.innerHTML = `<b>${i + 1}. ${S.name}</b>` + Z.map((z, k) => `<button data-i="${i}" data-z="${k}" class="${z.boss ? 'boss' : ''}">${z.boss ? 'Boss' : z.title ? z.title : 'Zone ' + (k + 1)}</button>`).join('');
      list.appendChild(row);
      if (i === 4 && window.BRANCH) { const r2 = document.createElement('div'); r2.className = 'w'; r2.innerHTML = `<b>Trump choice</b><button data-a="choice">The deck on the Rim (after the dream)</button>`; list.appendChild(r2); }
    });
    for (const c of el.querySelectorAll('[data-o]')) {
      const k = c.dataset.o; if (c.type === 'checkbox') c.checked = !!opts[k]; else c.value = String(opts[k] | 0);
      c.addEventListener('change', () => { opts[k] = c.type === 'checkbox' ? c.checked : +c.value; DEV.god = !!opts.god; keepOpts(); });
    }
    el.addEventListener('click', (ev) => {
      const b = ev.target.closest('button'); if (!b) { if (ev.target === el) close(); return; }
      if (b.dataset.i !== undefined) { audioInit(); go(+b.dataset.i, +b.dataset.z); }
      else if (b.dataset.a === 'choice') { audioInit(); toChoice(); }
      else if (b.dataset.a === 'restore') restore();
      else if (b.dataset.a === 'close') close();
    });
    el.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { ev.stopPropagation(); close(); } else ev.stopPropagation(); });
    document.body.appendChild(el);
    const first = el.querySelector('button[data-i]'); if (first) first.focus();
  }
  window.devMode = open;

  // the button, beside Continue / New journey on the title
  const row = document.querySelector('#newBtn') && document.querySelector('#newBtn').parentElement;
  if (row) { const b = document.createElement('button'); b.className = 'cta alt'; b.id = 'devBtn'; b.type = 'button'; b.textContent = 'Dev mode'; b.addEventListener('click', open); row.appendChild(b); }
})();
