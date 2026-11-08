'use strict';
// ======================================================================================================
// THE UNICORN'S BOONS: what only she gives. When she comes to the forge and he goes to her, she leaves one of these,
// kept for good (save.uniBoons), never one he already has, and nothing else in the game gives them:
//   horn   A Sliver of Her Horn    the perfect window of every charged blow (and the bow's draw) is 60% wider
//   mane   A Hair of Her Mane      once in each world, a blow that would kill him leaves him standing, at 30%
//   hoof   The Print of Her Hoof   the first blow he takes in each place does him no harm
//   tear   Her Tear                each new place he comes into, a fifth of his health comes back
//   star   Her Starlight           now and then a kill gives back a little of his health
// With all five his, she blesses him instead: full health, and (round the road again) the curse eased.
// The forge (forgehall.js uniGive) asks UNIBOON.give() for the gift.
// ======================================================================================================
(() => {
  const BOONS = {
    horn: { name: 'A Sliver of Her Horn', txt: 'perfect windows on charged blows are wider' },
    mane: { name: 'A Hair of Her Mane', txt: 'once in each world, a killing blow leaves you standing' },
    hoof: { name: 'The Print of Her Hoof', txt: 'the first blow you take in each place does no harm' },
    tear: { name: 'Her Tear', txt: 'each new place restores a fifth of your health' },
    star: { name: 'Her Starlight', txt: 'kills now and then restore a little health' },
  };
  const ORDER = ['horn', 'hoof', 'tear', 'mane', 'star'];
  const owned = () => (typeof save !== 'undefined' && save && Array.isArray(save.uniBoons)) ? save.uniBoons : [];
  const has = (k) => owned().includes(k);
  const S = { hoofUsed: false, maneStage: -1 };

  function give(rnd) {
    const left = ORDER.filter(k => !has(k));
    if (!left.length) { // all hers given: a blessing
      if (P) P.hp = maxHp();
      let txt = 'She breathes on you: your wounds close.';
      try { if ((save.cycle | 0) >= 1 && window.CURSE && CURSE.ease) { CURSE.ease(10, 'the Unicorn\'s blessing'); txt = 'She breathes on you: your wounds close, and the black in you thins.'; } } catch (e) {}
      return { key: null, txt };
    }
    const k = left[Math.floor((rnd ?? Math.random()) * left.length) % left.length];
    save.uniBoons = owned().concat([k]); persist();
    try { banner(BOONS[k].name.toUpperCase(), 'THE UNICORN\'S GIFT · ' + BOONS[k].txt.toUpperCase() + ' · FOR GOOD', 4.2); } catch (e) {}
    return { key: k, txt: `${BOONS[k].name}: ${BOONS[k].txt}.` };
  }

  // the horn: a wider perfect window
  { const _ct = chargeTiming; chargeTiming = function (w) { const r = _ct(w); if (has('horn') && P.clvl && !r.open && r.since <= PC_WIN * 1.6) { r.open = true; r.over = 0; r.mul = 1; } return r; }; }
  // the hoof: the first blow in each place does no harm; the tear: each new place gives back health
  { const _ez = enterZone; enterZone = function (z, Zs) { const r = _ez(z, Zs); S.hoofUsed = false;
    if (has('tear') && P && P.hp > 0 && P.hp < maxHp()) { const h = Math.round(maxHp() * .2); P.hp = Math.min(maxHp(), P.hp + h); try { floatText(P.x, P.y, 100, '+' + h + ' · HER TEAR', '#DDE8FF', 13); } catch (e) {} }
    return r; }; }
  { const _ss = startStage; startStage = function (i) { const r = _ss(i); S.hoofUsed = false; return r; }; }
  { const _pd = playerDamage; playerDamage = function (dmg, fromX, big) {
    if (has('hoof') && !S.hoofUsed && P && P.inv <= 0 && P.state !== 'dead' && P.state !== 'dodge' && !(P.state === 'down' || (P.state === 'hurt' && P.knocked))) {
      S.hoofUsed = true; P.inv = .8; try { floatText(P.x, P.y, 100, 'HER HOOF TURNS IT', '#DDE8FF', 13); fx.push({ kind: 'ring', x: P.x, y: P.y, z: 30, t: .45, max: .45, r: 60, col: '#E8F0FF', flat: 0 }); sfx('hit-crystal'); } catch (e) {}
      return; }
    return _pd(dmg, fromX, big); }; }
  // the mane: once in each world, a killing blow leaves him standing
  { const _ds = deathSave; deathSave = function () { if (_ds()) return true;
    if (has('mane') && S.maneStage !== stageIdx && P) { S.maneStage = stageIdx; P.hp = Math.round(maxHp() * .3); P.inv = 1.4;
      try { banner('HER MANE', 'YOU STAND AGAIN · ONCE IN EACH WORLD', 1.6); flashT = .2; slowmo = .5; sfx('learned'); fx.push({ kind: 'ring', x: P.x, y: P.y, z: 10, t: .6, max: .6, r: 140, col: '#E8F0FF', flat: 1 }); } catch (e) {}
      return true; }
    return false; }; }
  // starlight: now and then a kill gives back a little
  { const _ke = killEnemy; killEnemy = function (e, dir, m) { const was = e && e.dead, r = _ke(e, dir, m);
    if (!was && e && e.dead && has('star') && P && P.hp > 0 && Math.random() < .12) { const h = Math.max(1, Math.round(maxHp() * .03)); P.hp = Math.min(maxHp(), P.hp + h); try { floatText(P.x, P.y, 90, '+' + h, '#DDE8FF', 12); } catch (e2) {} }
    return r; }; }

  window.UNIBOON = { BOONS, ORDER, give, has, owned };
})();
