'use strict';
// Card-table motif for the menus: the overlays in index.html are laid out as cards on a velvet table (see the
// card-table section of the <style> block). This file only adds behaviour on top of ui.js, never replaces it:
// - whenever an overlay appears, its cards are dealt in (the title card turns over from face down);
// - forge cards, which ui.js rebuilds on every purchase, get corner indices and a slight tilt like a hand of cards;
// - the title card gets a painted trump portrait of the prince;
// - #app gets .mfx-table while a full-table menu is up, which draws a gilded edge round the screen.
(() => {
  const $1 = (s) => document.querySelector(s);
  const app = $1('#app');
  if (!app) return;
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const TABLE = ['titleOv', 'forgeOv', 'winOv']; // overlays that cover the game completely
  const OVS = ['titleOv', 'forgeOv', 'pauseOv', 'overOv', 'winOv', 'invOv'];

  // ---------- dealing ----------
  function deal(ov) {
    app.classList.toggle('mfx-table', TABLE.some(id => !$1('#' + id).hidden));
    if (ov.hidden || reduced()) return;
    // cards deal in reading order; the first few come off the deck one after another, later ones close behind
    let i = ov.id === 'titleOv' ? 5 : 0; // on the title the lesson cards follow once the main card has turned over
    ov.querySelectorAll('.dealt, .cards > .card, .howto > div').forEach((el) => {
      if (!el.offsetParent) return;
      const k = Math.min(i++, 14);
      el.style.setProperty('--i', k);
      el.style.setProperty('--dr', ((k % 2 ? 1 : -1) * (5 + (k * 7) % 5)) + 'deg');
      el.style.setProperty('--dx', ((k % 3) - 1) * 12 + 'px');
    });
    ov.classList.remove('mfx-in'); void ov.offsetWidth; ov.classList.add('mfx-in');
    clearTimeout(ov._mfxT); ov._mfxT = setTimeout(() => ov.classList.remove('mfx-in'), 1300);
  }
  const shown = new MutationObserver((recs) => {
    const seen = new Set();
    for (const r of recs) if (!seen.has(r.target)) { seen.add(r.target); if (!r.target.hidden) deal(r.target); }
    if (OVS.every(id => $1('#' + id).hidden)) app.classList.remove('mfx-table');
  });
  OVS.forEach(id => { const el = $1('#' + id); if (el) shown.observe(el, { attributes: true, attributeFilter: ['hidden'] }); });

  // ---------- the forge: corner indices and a hand's worth of tilt ----------
  function pip(cls, rank, suit) {
    const s = document.createElement('span'); s.className = 'pip' + (cls ? ' ' + cls : ''); s.setAttribute('aria-hidden', 'true');
    s.textContent = rank; const i = document.createElement('i'); i.textContent = suit; s.appendChild(i); return s;
  }
  function decorate(box, trumps) {
    if (!box) return;
    const cards = [...box.children];
    cards.forEach((c, n) => {
      if (c.querySelector(':scope > .pip')) return;
      const lv = (c.querySelector('.lv') || {}).textContent || '';
      let rank, suit;
      if (trumps) { rank = ROMAN[n + 1] || String(n + 1); suit = '✦'; }
      else {
        const m = lv.match(/^LV (\d+)\/\d+/);
        rank = m ? (ROMAN[+m[1]] || m[1]) : (c.classList.contains('locked') ? '?' : '0');
        suit = '♠︎';
      }
      c.prepend(pip('tr', rank, suit)); c.prepend(pip('', rank, suit));
      const t = ((n % 2 ? 1 : -1) * (.5 + ((n * 5) % 3) * .35)).toFixed(2);
      c.style.setProperty('--tilt', t + 'deg');
    });
  }
  const fc = $1('#forgeCards'), tc = $1('#trumpCards');
  const redo = new MutationObserver(() => { decorate(fc, false); decorate(tc, true); });
  [fc, tc].forEach(b => b && redo.observe(b, { childList: true }));
  decorate(fc, false); decorate(tc, true);

  // ---------- the title card's trump: the prince on the road, the true city on its mountain behind him ----------
  // the title card shows the prince's painted portrait (head and shoulders, from the character art); the little painted
  // scene below is only a fallback if the picture can't be loaded
  function portrait() {
    const cvp = $1('#mfxPortrait'); if (!cvp) return;
    const img = new Image();
    img.onload = () => { const g = cvp.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(img, 0, 0, cvp.width, cvp.height); };
    img.onerror = paintedPortrait;
    img.src = 'corwin_portrait.jpg';
  }
  function paintedPortrait() {
    const cvp = $1('#mfxPortrait'); if (!cvp) return;
    const box = cvp.closest('.trump-portrait');
    let old = null;
    try {
      const g = cvp.getContext('2d'); old = ctx; ctx = g;
      const s = cvp.width / 96; g.setTransform(s, 0, 0, s, 0, 0); // a 96 x 134 picture
      const H = 134;
      const sky = g.createLinearGradient(0, 0, 0, 92);
      [[0, '#1E1636'], [.45, '#5A3458'], [.8, '#C8706A'], [1, '#F0B070']].forEach(([o, c]) => sky.addColorStop(o, c));
      g.fillStyle = sky; g.fillRect(0, 0, 96, H);
      g.fillStyle = 'rgba(255,240,200,.85)'; // a few stars and a pale moon
      [[12, 10], [30, 18], [70, 8], [84, 22], [52, 14], [20, 30]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, .6, 0, TAU); g.fill(); });
      g.fillStyle = 'rgba(255,236,200,.8)'; g.beginPath(); g.arc(76, 30, 6, 0, TAU); g.fill();
      g.fillStyle = '#5A3458'; g.beginPath(); g.arc(78.5, 28.5, 5.2, 0, TAU); g.fill();
      // the mountain, and the city's towers along its crown
      g.fillStyle = '#3A2442'; g.beginPath(); g.moveTo(0, 92); g.lineTo(18, 70); g.lineTo(34, 58); g.lineTo(46, 48); g.lineTo(58, 56); g.lineTo(74, 66); g.lineTo(96, 78); g.lineTo(96, 92); g.closePath(); g.fill();
      g.fillStyle = '#2A1834';
      [[38, 46, 3, 10], [42, 40, 3, 14], [46, 36, 3, 18], [50, 42, 3, 12], [54, 47, 3, 9], [44, 33, 1, 4], [47, 31, 1.2, 6]].forEach(([x, y, w, h]) => g.fillRect(x, y, w, h));
      g.fillStyle = 'rgba(255,200,120,.9)'; [[47, 40], [43, 45], [51, 46]].forEach(([x, y]) => g.fillRect(x, y, .8, 1.4));
      // the ground and the road running back to the city
      const gr = g.createLinearGradient(0, 88, 0, H); gr.addColorStop(0, '#2C1C30'); gr.addColorStop(1, '#140C16');
      g.fillStyle = gr; g.fillRect(0, 88, 96, H - 88);
      const rd = g.createLinearGradient(0, 88, 0, H); rd.addColorStop(0, 'rgba(240,176,112,.55)'); rd.addColorStop(1, 'rgba(120,80,70,.5)');
      g.fillStyle = rd; g.beginPath(); g.moveTo(45, 88); g.lineTo(51, 88); g.lineTo(80, H); g.lineTo(18, H); g.closePath(); g.fill();
      // the prince, half turned toward us, sword lowered
      g.save(); g.translate(46, 126); g.scale(1.22, 1.22);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(0, 0, 14, 3, 0, 0, TAU); g.fill();
      drawHumanoid(HERO, { weapon: 'sword', arm: .5, Y: .55, breath: 0 });
      g.restore();
      ctx = old;
      if (typeof paintCard === 'function') paintCard(cvp, s * .6);
    } catch (e) {
      if (old) ctx = old;
      if (box) box.classList.add('noart');
    }
  }
  portrait();

  // the title is already up when this loads: deal it now
  const t = $1('#titleOv');
  if (t && !t.hidden) deal(t);
})();
