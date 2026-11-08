'use strict';
// ======================================================================================================
// THE CROSSROADS FORGE, WALKED. Between worlds the forge can be a hall to walk through instead of one long menu: a round
// smithy at the crossroads of Shadow, seen whole from its door (no camera moves), painted in the game's own manner. The
// Pattern is laid in the floor at the near end, where he comes in; the road stands open in the arch at the far wall; and
// along the far wall and the two side walls the family and their friends each keep a stall, royalty keeping it as a favour:
//   Gérard at the anvil (far wall): the weapons (levels and tempers, the rapier's eighth level)
//   Julian, the huntsman of Arden (far wall): the arrows
//   Dworkin, the hunchbacked old maker of the Trumps (far wall): the cards (and the deck drawn again, on the Rim)
//   Ganelon, the old soldier (far wall): armor (what is worn and carried; the inventory) and the Horn's Long March
//   Fiona the sorceress (left wall): the black drawn out (cleansing) and the cursed weapons fed and purified (New Game+)
//   Random the gambler (left wall): shards for sigils (New Game+)
//   Llewella of Rebma, at the sea-mirror (right wall): the Pearl (its relic row, and the reforged Pearl's tempers)
// Only those with something to sell are there (an empty stall stands shuttered). He walks the floor with the game's own
// controls (keys, a gamepad, the joystick), nearer and smaller toward the far wall; up to a stall a prompt comes up
// (Talk · J, or a Talk button on a touchscreen) and talking opens that one's panel. Attack swings his weapon, harmlessly.
//
// They live: each has a working loop and, every few seconds (never all at once), an idle of their own (Gérard wipes his
// brow, quenches a blade, flexes; Julian looses at his butt and the arrows stay in it; Ganelon polishes a helm or leans on
// his sword; Dworkin shuffles, floats a glowing card, sparks a little Pattern, mutters; Fiona flares her brazier, studies a
// vial; Llewella's mirror ripples, a fish crosses it, she trails her hand in it; Random rolls dice, drums a fill, flips a
// card). They greet him as he comes near, react when he buys from them, flinch when he swings near them, glance at him if
// he runs past, and wave him off when he leaves by the road. A word from them now and then shows in a small bubble.
//
// The panel is the forge menu itself (#forgeOv), shown through a lens: every piece of the forge is tagged with its section
// (data-sec: ui.js and the files that add to it), and a vendor's panel shows only his sections, so every button is the
// menu's own button, with its own prices and rules (nothing is copied), and every wrapper's rows reach their vendor.
// The full menu stays as it was; "Menu view" in the hall and "Walk the forge" in the menu switch between the two, and
// each visit opens as the hall (the menu view is for that visit only). The road's arch is "Walk on" (#walkBtn).
//
// The hall's stone, stalls and floor are painted once into one layer (only the fires, the glass, the Pattern's shimmer and
// the figures move); the figures are drawn in the game's figure layer (inkBegin/inkEnd), the prince by drawPlayerAt.
// Hooks: showOnly, openForge, renderForge, onKeyMenu and drawScene are wrapped.
// Console / tests: FORGEHALL (state, cast, goTo(id), talk(), close(), view('hall' | 'menu'), act(id, kind), swing()).
// ======================================================================================================
(() => {
  const PREF_KEY = 'shadowroad-forgeview';
  let pref = 'hall';
  // (every visit opens as the walked hall; "Menu view" holds only for the visit it is chosen in)
  try { localStorage.removeItem(PREF_KEY); } catch (e) {}
  const setPref = (v) => { pref = v; };
  const cl01 = (k) => clamp(k, 0, 1), sm = (k) => { k = cl01(k); return k * k * (3 - 2 * k); };
  const hsh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const fine = () => !FLASH && !TINT && !LITE;
  const glowR = (x, y, r, rgb, a) => { if (a <= 0 || r <= 0 || FLASH || TINT) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.45, `rgba(${rgb},${a * .4})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); };
  const ovEl = () => document.getElementById('forgeOv');
  const env = (u, a = .15, b = .15) => cl01(Math.min(u / a, (1 - u) / b)); // (an act's weight: eased in over its first a, out over its last b)

  // ======================================================================================================
  // THE CAST: the princes and princesses in their own colours, cloaked and clasped, with circlets and chains; Ganelon a
  // lord in his own arms; Dworkin his own small, hunched self in rich old robes (drawn by hand below, not on the prince's body)
  // ======================================================================================================
  // a belt with no sword at it, for those who carry none (the sword belt's own belts, its scabbard left off)
  try { const W = CORWIN.parts.waist; if (W.swordbelt && !W.fhGirdle) W.fhGirdle = Object.assign(Object.create(W.swordbelt), { scabbard() {} }); } catch (e) {}
  const base = (o) => Object.assign({}, HERO, o);
  const cloakOf = (c, lining) => ({ cape: c, capeLining: lining }); // (a mantle hung from the shoulders, clasped at the throat: drawHumanoid's own cape)
  const LOOKS = {
    gerard: () => base(Object.assign({ hairStyle: 'shaggy', skin: '#D4A882', glove: '#C4986E', hair: '#6A4428', hairLt: '#9A6A44', hairDk: '#2E1A0E', eye: '#5A7AA0', waist: 'fhGirdle', body: '#3E5A86', lattice: '#5A78A6', button: '#C8CCD8', trim: '#B8BCC6', shirt: '#C8CCD4', sleeve: '#5A6270', steel: '#9AA2B0', pauldron: '#5A6270', legs: '#3E4450', boots: '#2A2A30', cuff: '#4A5262',
      circlet: '#C8CCD8', chain: '#C8CCD8', clasp: '#C8CCD8', fullBeard: ['#6A4428', '#8A6040', 1] }, cloakOf('#4A505C', '#2E4670'))),
    julian: () => base(Object.assign({ hairStyle: 'longStraight', skin: '#E4CCB4', glove: '#E4E2DA', hair: '#141018', hairLt: '#3A3440', hairDk: '#060408', eye: '#6A8A5A', body: '#E6E4DC', lattice: '#B4C4AC', button: '#3A7A4A', trim: '#3A7A4A', shirt: '#2E5A3A', sleeve: '#D8DCD0', steel: '#E4E6DE', pauldron: '#ECECE4', legs: '#2E4A36', boots: '#2A2A22', cuff: '#3A6A46',
      circlet: '#D8AA55', sash: '#3A7A4A', clasp: '#D8AA55' }, cloakOf('#1E4A2E', '#E4E2DA'))),
    random: () => base(Object.assign({ hairStyle: 'short', skin: '#D8B090', glove: '#C8A080', hair: '#B08A48', hairLt: '#D8B070', hairDk: '#5A4020', eye: '#6A8AB0', body: '#8A4226', lattice: '#A85A34', button: '#E0B050', trim: '#E0B050', shirt: '#F0E2C0', sleeve: '#7A3A20', steel: '#B08A48', pauldron: '#7A3A20', legs: '#4A2E22', boots: '#3A2418', cuff: '#5A3420',
      circlet: '#E0B050', chain: '#E0B050', clasp: '#E0B050' }, cloakOf('#5A2A18', '#D8AA55'))),
    fiona: () => base(Object.assign({ hairStyle: 'redFlow', skin: '#F2DACA', glove: '#F2DACA', hair: '#C2442A', hairLt: '#E8784A', hairDk: '#6A1A0E', eye: '#3A9A6A', waist: 'fhGirdle', body: '#4E2C6E', lattice: '#6A4A8A', button: '#D8C080', trim: '#D8C080', shirt: '#E8E0C8', sleeve: '#3E7A4A', steel: '#3E7A4A', pauldron: '#4E2C6E', legs: '#2E5A3A', boots: '#2E5A3A', cuff: '#D8C080',
      hairLong: 1, lips: '#B04A50', circlet: '#D8C080', coronet: 1, necklace: '#D8C080', clasp: '#D8C080', gown: ['#3E7A4A', '#22482C', '#D8C080', '#5A3A7A'] }, cloakOf('#3A1E52', '#3E7A4A'))),
    llewella: () => base(Object.assign({ hairStyle: 'greenWave', skin: '#BCD4B6', glove: '#BCD4B6', hair: '#3A8A6A', hairLt: '#6ABA96', hairDk: '#14402E', eye: '#3ABAB0', waist: 'fhGirdle', body: '#2A7A7A', lattice: '#4A9A9A', button: '#E0ECF0', trim: '#D8E4E8', shirt: '#D8ECE6', sleeve: '#3A8A8A', steel: '#3A8A8A', pauldron: '#2A7A7A', legs: '#1F5260', boots: '#1F5260', cuff: '#D8E4E8',
      hairLong: 1, lips: '#5A8A80', circlet: '#E0E8EC', pearls: 1, necklace: '#F0F0EC', clasp: '#E0E8EC', gown: ['#2A7A7A', '#164848', '#D8E4E8', '#3A9A96'] }, cloakOf('#1A4A50', '#C8D8DC'))),
    ganelon: () => Object.assign((window.W8 && W8.riderLook) ? W8.riderLook('ganelon', { hand: null }) : base({ skin: '#D09A74', hair: '#8A4426', hairLt: '#B8704A', hairDk: '#3E1A0C', eye: '#4A6A3A', body: '#24365E', lattice: '#34466E', trim: '#D8AA55' }),
      cloakOf('#6A1A14', '#24365E'), { clasp: '#D8AA55', headGear: 1 }),
    dworkin: () => ({ dwarf: 1, skin: '#D8B898', robe: '#4A2A5E', robeLt: '#6A4A82', robeDk: '#2A1838', trim: '#D8AA55', inner: '#2E3A5A', cap: '#2A1838', hair: '#ECE6DA', hairDk: '#B8B0A4', boots: '#3A2418', belt: '#5A3420' }),
  };
  const CAST = {
    gerard: { name: 'Gérard', role: 'Weapons', secs: ['weapons'], bg: ['#A2B6D0', '#2A3A5A'], s: 1.16, w: 1.12, f: -1,
      say: { greet: ['Brother.', 'Corwin. Good.', 'Back in one piece, I see.', 'There he is.', 'Come in out of Shadow.'],
        startle: ['Easy! Not in my forge.', 'Swing that at me and I will take it off you.', 'Mind the anvil, brother!', 'Not near the quench.'],
        buy: ['Good steel, that.', 'It will hold.', 'Feel the balance on it now.', 'That will bite.', 'Better than new.'],
        bye: ['Go carefully, Corwin.', 'Bring it back nicked, not broken.', 'Strike first.', 'Keep your guard up, brother.'],
        idle: ['Hm. Needs more heat.', 'Benedict would want this edge finer.', 'Hold, hold... there.', 'Good iron. Stubborn, like us.', 'Where did I put the tongs...'] },
      lines: () => {
        if (save.owned.rapier && save.wl.rapier === WLEARN && wLearn('rapier') > WLEARN) return 'That rapier of yours... there is something under its finish, brother. Give me the hammer to it, and we will see what it really is.';
        if (save.cycle > 0) return pick(['Round the road again? Then the iron must go harder too. I will temper what you carry.', 'Shadow-steel takes a good edge, if you hit it hard enough and often enough. Lay it on the anvil.']);
        return pick(['Lay it on the anvil, Corwin. Every level I beat into it, it remembers. Steel is more loyal than family.', 'Shadow-steel takes a good edge, if you hit it hard enough and often enough. Show me what you carry.',
          'I could wrestle a bull for you, or I could temper that blade. The blade will thank me more.', 'Every nick on that edge is a story. I would rather hear fewer stories.', 'Set it down. Let the fire do the talking.']); } },
    julian: { name: 'Julian', role: 'Arrows', secs: ['arrows'], bg: ['#CED8C4', '#3A4A3A'], s: 1.02, w: .93, f: 1,
      say: { greet: ['Corwin.', 'Brother.', 'You again.', 'Ah. The hunter returns.', 'Well. Still breathing.'],
        startle: ['Mind where you point that.', 'Try that in Arden and my hounds will have you.', 'Careless.', 'I have shot men for less.'],
        buy: ['Dead centre.', 'Fletched true.', 'They will fly straight.', 'Do not waste them.', 'Arden yew. You are welcome.'],
        bye: ['Good hunting.', 'Aim before you loose, brother.', 'Do not come back empty-handed.', 'Ride fast.'],
        idle: ['Too much wind for a clean shot.', 'Morgenstern would have run that down by now.', 'Steady...', 'The hounds are restless.', 'Hm. Pulled left.'] },
      lines: () => pick(['Grey goose and Arden yew. My hounds have run down worse than anything you will shoot at.', 'Arrows are scarce on your road, brother. Make each one count. I would.',
        'I hunt what runs through Arden. You hunt what runs through Shadow. The arrows do not care which.', 'A good shaft is patient. Most of the family is not.', 'Choose your arrows the way you choose your enemies: carefully, and not too many.']) },
    ganelon: { name: 'Ganelon', role: 'Armor', secs: ['gear', 'march'], bg: ['#8AA0C8', '#1A2440'], s: 1.04, w: 1.05, f: -1,
      say: { greet: ['Corwin!', 'My lord!', 'There you are, lad.', 'Ha! Still standing.', 'Good to see you whole.'],
        startle: ['Ha! Save it for the road.', 'Not bad. Your guard is low, though.', 'Easy, easy. I am on your side.', 'You swing like a man who has slept too little.'],
        buy: ['Well chosen.', 'That will turn a blade.', 'Wear it in good health.', 'Snug? It should be.', 'A fine fit.'],
        bye: ['Ride well, my friend.', 'Keep your back to a wall.', 'Come back to me in one piece.', 'Remember Avalon.'],
        idle: ['These straps will not last.', 'In Avalon we polished till we could see our faces.', 'Rust. Always rust.', 'Hm. A dent the size of a fist.', 'Good leather, this.'] },
      lines: () => document.getElementById('w8marchForge') ? 'Mail before glory. And the horn: blow it as we rode at the Black Circle, and the march goes on behind you.'
        : pick(['Mail before glory, Corwin. I learned that at the Black Circle, and so will you.', 'Let us see what you have hauled out of Shadow in that bag. Some of it might even fit.',
          'You exiled me once, and I forgave you. Do not make me patch you up as well.', 'A soldier is only as good as what stands between him and the steel.']) },
    dworkin: { name: 'Dworkin', role: 'Trumps', secs: ['cards'], bg: ['#C8B8E8', '#2A1E40'], s: 1, w: 1, f: -1,
      say: { greet: ['Ah. The boy.', 'Oberon? No... the other one.', 'You. You have your father\'s chin.', 'Hm? Yes, yes, come in.', 'Corwin! Or is it Thursday?', 'Do not step on the Pattern. Oh. You did. Never mind.', 'Have we met? We have. Often.'],
        startle: ['Careful of my ink!', 'The cards! Mind the cards!', 'Violence. Always violence with your family.', 'Shoo. Shoo!', 'I drew you with better manners than that.', 'If you spill that pot I will draw you a pig.'],
        buy: ['Mm. Good. Good.', 'A fine likeness, if I say so. And I do.', 'Do not let it see you blink.', 'Still wet. Do not touch the eyes.', 'That one bites. Gently.', 'Hold it to the light. No, the other light.'],
        bye: ['Mind the Pattern.', 'Off you go. Off, off.', 'Bring me back some colour, the blue is running out.', 'Do not get lost in a card. I will not come looking.'],
        mutter: ['...Brand never could hold a line...', '...seven parts lamp-black, one part blood... or was it the other way...', '...the unicorn had such sad eyes...', '...a door, a door, every face a door...', '...Oberon never paid me for the first deck...', '...if I tilt the world a little, the ink runs uphill...', '...where did I leave the Jewel... no, the boy has it...', '...not that face. Never that face again...', '...one more card. Just one more...', '...the Pattern hums when it is pleased. It is not pleased...', '...shadows of shadows, and the ink still smells of the sea...'],
        idle: ['Hmm. Hmmm.', 'Who drew this? Oh. I did.', 'No, no, the nose is wrong.', 'Ha! Ha. Yes.', 'Shh. The cards are thinking.'] },
      lines: () => (save.stage > FORK && !save.done) ? pick(['The deck again? Every card is a door, if the hand that drew it was steady. Draw another, if the road you hold is not the one you want.', 'Another road? The cards will show you one. They always do. Whether you like it is your affair.'])
        : pick(['Every card is a door, if the hand that drew it was steady. Mine was, once. Mostly.', 'Hold still. No, not you: the ink. Whose face shall I give you?',
          'I drew the first of these when your father was a boy, and he was a dreadful boy.', 'A Trump is only a picture until someone remembers to be afraid of it.', 'Sit. Do not sit there. That is the Abyss. In miniature.', 'Faces, faces. I am running out of faces. Bring me some new ones.']) },
    fiona: { name: 'Fiona', role: 'Curses', secs: ['cursed', 'cleanse'], bg: ['#A8D0AC', '#284A38'], s: .88, w: .94, f: -1,
      say: { greet: ['Brother.', 'Corwin. You look tired.', 'Ah. And what have you brought back this time?', 'There is black on you. Come here.', 'Sit, before you fall.'],
        startle: ['Really, Corwin.', 'Do not test me in my own circle.', 'How very like Eric.', 'Put that down before it puts you down.'],
        buy: ['It is done.', 'Cleaner. For now.', 'The fire took it. Mostly.', 'Do not thank me. Pay me.', 'There. Breathe.'],
        bye: ['Be wary of the black.', 'Do not let the road into you.', 'Come back before it spreads.', 'Watch your shadow, brother.'],
        idle: ['The flame is too blue.', 'Hm. Brand would have liked this one.', 'Patience. The curse is patient too.', 'Bleed it slowly...', 'Such a mess, our family.'] },
      lines: () => pick(['The black runs through it like ink in water. It can be drawn out, for a price, and it comes out cleaner than it went in.', 'Hold it in the fire and do not flinch, brother. I will not.',
        'Curses are only promises somebody else made for you. I can unmake most of them.', 'You carry the black road with you, Corwin. I can smell it.', 'Do not mistake the cure for a kindness. It hurts.']) },
    llewella: { name: 'Llewella', role: 'The Pearl', secs: ['pearl'], bg: ['#86C4C4', '#1A3A48'], s: .95, w: .95, f: 1,
      say: { greet: ['Corwin.', 'Brother. You smell of the road.', 'The tide brought you back.', 'Rebma sends her greetings. Moire less so.', 'Come, look into the water.'],
        startle: ['Not near the glass!', 'The mirror is older than you are.', 'Careful. The sea is listening.', 'If you crack it, you go through it.'],
        buy: ['The sea remembers.', 'It shines brighter in your hand.', 'Keep it wet. Figuratively.', 'Moire would be furious. Good.', 'A pearl for a prince.'],
        bye: ['Swim well, brother.', 'Do not drown.', 'The stairs down to Rebma are always open to you.', 'Mind the deep water.'],
        idle: ['The tide is late today.', 'Hush, little fish.', 'There is a storm somewhere under the glass.', 'Rebma is quiet tonight.', 'Salt and silver.'] },
      lines: () => pick(['The sea gave it up for you. Moire will want to hear that you kept it well.', 'Look into the glass, Corwin: the tide is still turning in it.',
        'Everything the sea takes, it gives back changed. The Pearl is no different.', 'Walk the Pattern under the water once, and you never quite dry off.', 'Hold it to your ear. That is not the sea. That is Rebma.']) },
    random: { name: 'Random', role: 'Trade', secs: ['trade'], bg: ['#D49866', '#4A2A1A'], s: .9, w: .92, f: -1,
      say: { greet: ['Hey, Corwin!', 'Well, look who it is.', 'Brother! Got any money?', 'Ah, my favourite customer.', 'Corwin! Cut the deck?'],
        startle: ['Whoa! I am unarmed!', 'Hey, hey, I paid you back!', 'Watch it, I just tuned these drums.', 'Do that again and the rate goes up.'],
        buy: ['Pleasure doing business.', 'Nice. You got robbed, but nice.', 'The house thanks you.', 'Sold, to the man with the sword.', 'Spend it wisely. Or not, that is fun too.'],
        bye: ['Don\'t lose it all at once.', 'Bring me something shiny.', 'If you see Benedict, you never saw me.', 'Later, brother.'],
        idle: ['Seven. No... seven again?', 'Anybody want to bet on Gérard?', '*drums a little fill*', 'I swear these dice are honest.', 'Hm. Snake eyes.'] },
      lines: () => pick(['Shards for sigils, brother. The house always takes its little cut.', 'I would give you a better rate, but then I would not be me, would I?',
        'Everything is for sale here, brother. Including my opinion of your hair.', 'You win some, you lose some. I mostly win some.', 'Trade with me, Corwin, I am the only honest crook in the hall.']) },
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
  // THE HALL'S SHAPE: a far wall with the road's arch in its middle and two stalls either side of it, and two side walls
  // running out toward the near end, two stalls on each (the right wall's nearer bay holds the Unicorn on her plinth).
  // Everything is laid out in the view itself, so all of it is seen at once; the far end is drawn smaller (sAt).
  // ======================================================================================================
  // the people drawn larger than the hall's own scale (the bays stay where they are, and their booths are built to the keepers'
  // size): the keepers by VFIG, he by HFIG
  const VFIG = 1.45, HFIG = 1.22;
  const SLOT_OF = { dworkin: 'BL2', gerard: 'BL1', julian: 'BR1', ganelon: 'BR2', fiona: 'SL1', random: 'SL2', llewella: 'SR1' };
  let GEO = null;
  function geo() {
    const key = [VW, Y_OFF, VIEW_H].join('|'); if (GEO && GEO.key === key) return GEO;
    const cx = VW / 2, yb = Y_OFF + VIEW_H * .46, bx = VW * .21, bot = VH, drop = (bot - yb) * .97, k = drop / bx;
    const sAt = (y) => lerp(.56, .82, cl01((y - yb) / (bot - yb)));
    const footY = (x) => x < bx ? yb + (bx - x) * k : x > VW - bx ? yb + (x - (VW - bx)) * k : yb;
    const slots = {};
    // (the far wall is all stalls now: four equal bays across it; the road is reached by the near side of the hall, off the bottom of the view)
    // (the bays aren't equal: each is as wide as its trade needs, Gérard's whole smithy the widest, Dworkin's desk the narrowest)
    const BAYS = [['BL2', .8], ['BL1', 1.6], ['BR1', 1.05], ['BR2', .95]], BWT = BAYS.reduce((a, b) => a + b[1], 0), WALL = VW - 2 * bx, piers = [];
    let at = bx;
    for (const [id, wgt] of BAYS) { const cell = WALL * wgt / BWT, x = at + cell / 2, s = sAt(yb);
      slots[id] = { id, kind: 'back', dir: 0, wx: x, wy: yb, s, sg: 1, m: new DOMMatrix([s, 0, 0, s, x, yb]), cell }; at += cell; piers.push(at); }
    piers.pop();
    for (const [id, t, dir, hw] of [['SL1', .24, 1, 58], ['SL2', .62, 1, 52], ['SR1', .28, -1, 66], ['SR2', .66, -1, 50]]) {
      const x = dir > 0 ? bx * (1 - t) : VW - bx * (1 - t), y = yb + t * drop, s = sAt(y) * .96, a = s * .62;
      slots[id] = { id, kind: dir > 0 ? 'left' : 'right', dir, wx: x, wy: y, s, sg: dir, m: new DOMMatrix([dir * a, -k * a, 0, s, x, y]), sideHw: hw }; }
    // (hw: a booth's half-width in the stall's units, a far-wall bay's to the piers between them; mv: the keeper's frame, the stall's scaled to VFIG about the feet)
    for (const sl of Object.values(slots)) { const p = sl.m.transformPoint(new DOMPoint(0, 22)); sl.vx = p.x; sl.vy = p.y;
      sl.hw = sl.kind === 'back' ? sl.cell / 2 / sl.s - 6 : sl.sideHw; sl.mv = sl.m.translate(0, 22).scale(VFIG, VFIG).translate(0, -22);
      sl.tx = sl.vx + (sl.dir ? sl.dir * 40 * sl.s : 0); sl.ty = sl.vy + (sl.dir ? 30 : 30) * sl.s;
      // (dv: a booth's depth, out of its wall, in the stall's own frame: a side wall's booth stands well out into the hall, square
      // to its wall (straight across the view, a little down); a far-wall booth only a little, toward us and away from the middle.
      // mf: the booth's front (its posts, awning, lantern and sign); mb: its back, set into the wall behind)
      // mw: the wares on the back (a side booth's let down a little, so its awning, standing out over them, leaves them in sight)
      if (sl.kind === 'back') { sl.dv = { x: (sl.wx - cx) / VW * 14, y: 9 }; sl.mf = sl.m; sl.mb = sl.mw = sl.m.translate(-sl.dv.x, -sl.dv.y); }
      else { const D = 30, q = .12; sl.dv = { x: D / .62, y: D * (q + k) }; sl.mf = sl.m.translate(sl.dv.x / 2, sl.dv.y / 2); sl.mb = sl.m.translate(-sl.dv.x / 2, -sl.dv.y / 2); sl.mw = sl.mb.translate(0, sl.dv.y * .9); } }
    const door = { x: cx, y: bot, s: sAt(bot), tx: cx, ty: bot - 12 };
    door.m = new DOMMatrix([door.s, 0, 0, door.s, cx, bot]);
    return (GEO = { key, cx, yb, bx, drop, k, bot, sAt, footY, slots, door, piers, pat: { x: cx, y: yb + (bot - yb) * .58 } });
  }

  // ======================================================================================================
  // STATE
  // ======================================================================================================
  const H = { on: false, panel: null, resume: null, x: 320, y: 340, f: 1, walk: 0, moving: false, run: false, t: 0, last: 0,
    cast: [], key: '', target: null, sparks: [], embers: [], fx: [], padA: false, padB: false, hint: 0, swing: null, leaving: null, idleGate: 2, snap: null };
  function computeCast() {
    const ids = ORDER.filter(id => { try { return present[id](); } catch (e) { return false; } });
    H.cast = ids.map((id, i) => ({ id, slot: SLOT_OF[id], ph: hsh(i + 3) * 10, act: null, next: 1 + i * 1.2 + hsh(i + 9) * 2, last: '', near: false, away: true, say: null, stuck: [], dx: 0 }));
    H.key = ids.join(',');
  }
  const SL = (v) => geo().slots[v.slot];
  function placeHero() { const G = geo(); H.x = G.cx + 30; H.y = G.pat.y + 4; H.f = -1; H.walk = 0; H.hint = 7; H.swing = null; H.leaving = null; H.idleGate = 1; }
  const heroYMin = (x) => geo().footY(x) + 14, heroYMax = () => VH - 6;

  const vxOf = (v) => { const sl = SL(v); return sl.vx + (v.dx || 0) * sl.m.a; };
  const STEP = 230;
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
      <div class="fh-btns"><button class="cta alt" type="button" id="fhMenuBtn">Menu view</button><button class="cta" type="button" id="fhWalkBtn">Walk on &#9656;</button></div></div>
      <div class="fh-hint" id="fhHint"></div>
      <button type="button" class="fh-talk" id="fhTalk" hidden><span class="fh-tw"></span><span class="fh-tk"></span></button>`;
    (document.getElementById('app') || document.body).appendChild(ui);
    ui.querySelector('#fhMenuBtn').addEventListener('click', () => { audioInit(); setPref('menu'); H.panel = null; showOnly('forgeOv'); const ov = ovEl(); if (ov) ov.scrollTop = 0; });
    ui.querySelector('#fhWalkBtn').addEventListener('click', () => { audioInit(); quickWalk(); });
    const talk = ui.querySelector('#fhTalk');
    talk.addEventListener('pointerdown', (e) => { e.preventDefault(); audioInit(); interact(); });
    talk.addEventListener('click', (e) => { if (e.detail === 0) interact(); }); // (a keyboard's Enter on the focused button)
    return ui;
  }
  // tap (or click) someone and he walks over and talks to them: a keeper, the Unicorn, or the way out to the road
  function hallTap(e) {
    if (!H.on || H.panel || H.leaving || mode !== 'forge' || blocked()) return;
    const c = cv.getBoundingClientRect(); if (!c.width) return; const u = VW / c.width, x = (e.clientX - c.left) * u, y = Y_OFF + (e.clientY - c.top) * u, G = geo();
    let best = null, bd = 1e9;
    for (const v of H.cast) { const sl = SL(v), s = sl.s * VFIG, vx = vxOf(v), top = sl.vy - 104 * s, hw = 30 * s + 6;
      if (x > vx - hw && x < vx + hw && y > top && y < sl.vy + 26) { const d = Math.abs(x - vx); if (d < bd) { bd = d; best = { id: v.id, tx: sl.tx, ty: sl.ty }; } } }
    if (!best && U.on && U.phase === 'wait') { const us = uniS(); if (Math.abs(x - U.x) < 70 * us && y > U.y - 120 * us && y < U.y + 14) { const sp = uniSpot(); best = { id: 'unicorn', tx: sp.x, ty: sp.y }; } }
    if (!best && y > G.bot - 46 && Math.abs(x - G.door.x) < 90) best = { id: 'door', tx: G.door.tx, ty: G.door.ty };
    if (!best) return;
    e.preventDefault(); audioInit(); H.auto = best; sfx('pick');
  }
  let tapOn = false;
  function enterHall() {
    if (!tapOn) { tapOn = true; cv.addEventListener('pointerdown', hallTap); }
    buildUi(); H.on = true; H.flush = true;
    try { if (!U.on && save.fhUni && save.fhUni.key === visitKey()) uniSpawn(); } catch (e) { console.error(e); }
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
    const ov = ovEl(); H.panel = id; headFor = ''; keys.clear(); clearInput(); H.snap = { s: save.shards, g: save.sigils };
    renderForge(); applyLens();
    ov.hidden = false; app.classList.add('nocontrols'); ov.scrollTop = 0;
    if (ui) { ui.querySelector('#fhTalk').hidden = true; }
    if (!back) sfx('pick');
    if (KBD) { const b = document.getElementById('fhBackBtn'); if (b) try { b.focus({ preventScroll: true }); } catch (e) {} }
  }
  function closePanel() {
    if (!H.panel) return; const ov = ovEl(), v = H.cast.find(q => q.id === H.panel);
    if (v && v.pendingBuy) { v.pendingBuy = false; act(v, BUY[v.id], null, { buy: 1 }); say(v, CAST[v.id].say.buy, 2); buyFx(v); }
    H.panel = null; headFor = ''; ov.hidden = true; app.classList.remove('nocontrols'); applyLens(); refreshUi(); H.target = null; setPrompt(null);
    keys.clear(); clearInput();
    try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) {}
  }
  function interact() {
    if (!H.on || H.panel || blocked()) return;
    const T = H.target; if (!T) return;
    if (T === 'door') { leave(); return; }
    if (T === 'unicorn') { uniTalk(); return; }
    // Ganelon's trade is the inventory itself: talking to him opens it straight away (back to the hall after, or to his
    // panel when the Horn's Long March is also his to offer)
    if (T === 'ganelon' && typeof openInventory === 'function') { keys.clear(); clearInput(); sfx('pick'); H.panel = document.getElementById('w8marchForge') ? 'ganelon' : null; openInventory('forge'); return; }
    openPanel(T);
  }
  // the quick way out: straight on to the next world, as the menu's Walk on and the road's arch do (no walking to it)
  function quickWalk() { if (!H.on || mode !== 'forge') return; if (H.panel) closePanel(); const w = document.getElementById('walkBtn'); if (w) w.click(); }
  function blocked() { return mode !== 'forge' || !!document.getElementById('w8verseOv') || !!(window.BRANCH && BRANCH.active) || app.classList.contains('port'); }
  function refreshUi() {
    if (!ui) return; const k = document.getElementById('forgeKicker');
    ui.querySelector('#fhKick').textContent = k ? k.textContent : 'BETWEEN WORLDS';
    const wb = ui.querySelector('#fhWalkBtn'); wb.innerHTML = `Walk on &#9656;${KBD ? ' <kbd>N</kbd>' : ''}`; wb.title = `Walk on to ${STAGES[roadStage()].name}`;
    ui.querySelector('#fhShards').textContent = save.shards; ui.querySelector('#fhSigils').textContent = save.sigils;
  }
  let promptKey = '';
  function setPrompt(T) {
    if (!ui) return; const b = ui.querySelector('#fhTalk'), key = (T || '') + '|' + KBD;
    if (key === promptKey && !b.hidden === !!T) return; promptKey = key;
    if (!T || H.panel) { b.hidden = true; return; }
    b.hidden = false; b.classList.toggle('door', T === 'door');
    const who = T === 'door' ? `Walk on: ${STAGES[roadStage()].name}` : T === 'unicorn' ? 'The Unicorn of Amber' : `${CAST[T].name} · ${CAST[T].role}`;
    b.querySelector('.fh-tw').textContent = who;
    b.querySelector('.fh-tk').innerHTML = KBD ? `${T === 'door' ? 'Walk on' : T === 'unicorn' ? 'Approach' : 'Talk'} <kbd>J</kbd>` : (T === 'door' ? 'WALK ON' : T === 'unicorn' ? 'APPROACH' : 'TALK');
  }

  // ---------------- the hooks ----------------
  { const _so = showOnly; showOnly = function (id) {
    const want = id === 'forgeOv' && pref === 'hall', was = H.on;
    _so(id);
    if (want) enterHall();
    else if (was) { if (id === null && save.fhUni && save.fhUni.on && !save.fhUni.done) { save.fhUni.done = true; persist(); } leaveHall(id === 'invOv'); } // (walked on without going to the Unicorn: her gift is lost)
  }; }
  { const _of = openForge; openForge = function (k) {
    pref = 'hall';
    H.cast = []; H.panel = null; H.resume = null; H.auto = null; H.chat = null; H.chatT = undefined; H.chatSeen = new Set(); H.fx.length = 0;
    const r = _of(k);
    try { computeCast(); placeHero(); applyLens(); if (H.on) refreshUi(); staticKey = ''; uniDecide(); U.on = false; H.uniLook = 0; if (H.on) uniSpawn(); } catch (e) { console.error(e); }
    return r;
  }; }
  { const _rf = renderForge; renderForge = function (note) { const r = _rf(note);
    try { applyLens(); refreshUi();
      // a purchase at the stall that is open: its keeper answers it
      if (H.on && H.panel && H.snap && (save.shards < H.snap.s || save.sigils < H.snap.g)) { const v = H.cast.find(q => q.id === H.panel); if (v) bought(v); }
      if (H.panel) H.snap = { s: save.shards, g: save.sigils };
    } catch (e) { console.error(e); } return r; }; }
  { const _ok = onKeyMenu; onKeyMenu = (e) => {
    if (H.on && mode === 'forge') {
      const c = e.code;
      if (H.panel) {
        if (c === 'Escape' || c === 'Backspace') { e.preventDefault(); closePanel(); return true; }
        if (c === 'KeyM') return true;
        return true; // (the panel's own buttons take Enter and Space natively; nothing else reaches the hall)
      }
      if (blocked()) return true;
      if (c === 'Enter' || c === 'NumpadEnter' || c === 'KeyJ' || c === 'KeyZ' || c === 'KeyE' || c === 'Space') { if (document.activeElement && document.activeElement.tagName === 'BUTTON' && (c === 'Enter' || c === 'Space')) return true; e.preventDefault();
        if (!e.repeat) { if (H.target || c === 'Enter' || c === 'NumpadEnter' || c === 'KeyE') interact(); else if (c === 'KeyJ' || c === 'KeyZ') swing(false); } return true; }
      if (c === 'KeyN') { e.preventDefault(); if (!e.repeat) quickWalk(); return true; }
      if (c === 'KeyK' || c === 'KeyX') { e.preventDefault(); if (!e.repeat) swing(true); return true; }
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
    return { mx, my, a: b(0), b: b(1), x: b(2), go: b(9) || b(3) };
  }
  const near = (v) => { const sl = SL(v); return Math.hypot(H.x - sl.tx, (H.y - sl.ty) * 1.4); };
  function update(dt) {
    const G = geo(), pad = readPad();
    if (pad) { if (pad.b && !H.padB && H.panel) closePanel(); if (pad.a && !H.padA && !H.panel) { if (H.target) interact(); else swing(false); } if (pad.x && !H.padX && !H.panel) swing(true); if (pad.go && !H.padGo) { H.padGo = true; quickWalk(); return; } H.padGo = pad.go; H.padA = pad.a; H.padB = pad.b; H.padX = pad.x; }
    let mx = 0, my = 0;
    if (!H.panel && !blocked() && !H.leaving) {
      readMove(); mx = input.mx; my = input.my; if (pad && (pad.mx || pad.my)) { mx = pad.mx; my = pad.my; }
      if (pressed.light || pressed.heavy) swing(!!pressed.heavy);
    }
    for (const k in pressed) pressed[k] = false;
    if (H.auto && !H.panel && !H.leaving) { // walking to whoever was tapped: any stick or key of his own takes over
      if (Math.hypot(mx, my) > .1) H.auto = null;
      else { const A = H.auto, dx = A.tx - H.x, dy = A.ty - H.y, d = Math.hypot(dx, dy * 1.4); A.t = (A.t || 0) + dt;
        if (d < 7 || A.t > 6) { H.auto = null; if (d < 40) { if (A.id === 'door') leave(); else if (A.id === 'unicorn') uniTalk(); else { H.target = A.id; interact(); } } }
        else { const n = Math.max(1e-3, Math.hypot(dx, dy)); mx = dx / n * Math.min(1, d / 18); my = dy / n * Math.min(1, d / 18) / .66; if (Math.abs(my) > 1) { mx /= Math.abs(my); my = Math.sign(my); } A.run = d > 110; } } }
    if (H.leaving) { const L = H.leaving; L.t += dt; mx = clamp((G.door.tx - H.x) / 30, -1, 1); my = 1;
      if (L.t > 1.15 && !L.done) { L.done = true; const w = document.getElementById('walkBtn'); if (w) w.click(); return; } }
    const s = G.sAt(H.y), run = ((!!input.run && Math.abs(mx) > .3) || !!(H.auto && H.auto.run)), sp = (run ? 230 : 125) * s / .6;
    H.moving = Math.hypot(mx, my) > .05; H.run = run && H.moving;
    if (H.swing) { H.swing.t += dt; if (H.swing.t >= H.swing.dur) H.swing = null; mx *= .2; my *= .2; }
    if (H.moving) {
      H.x = clamp(H.x + mx * sp * dt, 10, VW - 10); H.y = clamp(H.y + my * sp * .66 * dt, heroYMin(H.x), heroYMax());
      if (H.y < heroYMin(H.x)) H.y = heroYMin(H.x);
      if (Math.abs(mx) > .1 && !H.swing) H.f = Math.sign(mx); H.walk += dt * (run ? 13 : 8.5) * Math.max(.5, Math.hypot(mx, my));
    }
    // who is near enough to talk to
    let T = null, best = 30;
    for (const v of H.cast) { const d = near(v); if (d < best) { best = d; T = v.id; } }
    if (Math.hypot(H.x - G.door.tx, (H.y - G.door.ty) * 1.4) < 30) T = 'door';
    if (U.on && U.phase === 'wait') { const sp = uniSpot(); if (Math.hypot(H.x - sp.x, (H.y - sp.y) * 1.4) < 34) T = 'unicorn'; }
    H.target = T;
    setPrompt(H.panel || H.leaving ? null : T);
    if (H.hint > 0) { H.hint -= dt; const el = ui && ui.querySelector('#fhHint'); if (el) { el.textContent = KBD ? 'Arrows / WASD to walk · J to talk · K to swing' : 'Joystick to walk · tap Talk at a stall'; el.style.opacity = String(cl01(H.hint / 1.5)); } }
    life(dt); uniUpdate(dt); if (H.uniLook > 0) H.uniLook -= dt;
    // sparks, embers and the rest, in their stall's own frame
    for (const p of H.fx) { p.t += dt; p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt; p.vy = (p.vy || 0) + (p.g || 0) * dt; }
    H.fx = H.fx.filter(p => p.t < p.life);
    const g = H.cast.find(v => v.id === 'gerard');
    if (g && H.fx.length < 40 && Math.random() < dt * 7) H.fx.push({ k: 'ember', v: g, wall: 1, x: rand(-24, 24), y: -72, vx: rand(-6, 6), vy: rand(-26, -14), t: 0, life: rand(1.6, 3) });
  }
  function hallFrame(t) {
    const dt = Math.min(.05, Math.max(0, t - (H.last || t))); H.last = t; H.t += dt;
    update(dt);
    if (!H.on) return;
    const T = H.t;
    ctx.save();
    try {
      ctx.fillStyle = '#0E0908'; ctx.fillRect(0, Y_OFF - 2, VW, VIEW_H + 4);
      drawStatic();
      liveBack(T);
      figures(T);
      liveFront(T);
    } finally { ctx.restore(); }
    vignette();
  }

  // ======================================================================================================
  // THE STATIC HALL, painted once into its own layer
  // ======================================================================================================
  // (and a second layer, as cheap: the desks and tables the keepers stand behind, laid over them before he is drawn)
  let staticC = null, frontC = null, staticKey = '';
  function drawStatic() {
    const G = geo(), S = Math.min(K, 2), key = [G.key, S.toFixed(3), H.key].join('|');
    if (key !== staticKey || !staticC) { retire(staticC); retire(frontC); staticC = paintStatic(S, paintHall); frontC = paintStatic(S, paintFront); staticKey = key; }
    ctx.drawImage(staticC, 0, Y_OFF, VW, VH - Y_OFF);
  }
  function drawFront() { if (frontC) ctx.drawImage(frontC, 0, Y_OFF, VW, VH - Y_OFF); }
  function paintStatic(S, paint) {
    const c = document.createElement('canvas'); c.width = Math.ceil(VW * S); c.height = Math.ceil((VH - Y_OFF) * S);
    const g = c.getContext('2d'), old = ctx, fl = FLASH, ti = TINT, li = LITE; ctx = g; FLASH = false; TINT = null; LITE = false;
    try { g.scale(S, S); g.translate(0, -Y_OFF); paint(); }
    catch (e) { console.error(e); }
    finally { ctx = old; FLASH = fl; TINT = ti; LITE = li; }
    return c;
  }
  function paintFront() {
    for (const v of H.cast) if (FRONT[v.id]) withM(SL(v).mv, () => FRONT[v.id]());
    // the side booths' fronts, far to near, each with what stands before its keeper
    const G = geo();
    for (const id of ['SL1', 'SR1', 'SL2', 'SR2']) { const sl = G.slots[id], v = H.cast.find(q => q.slot === id), U = side3(sl);
      try { withM(U, () => { if (v && FRONT3[v.id]) FRONT3[v.id](sl); side3(sl, 1); sideFront(sl, v ? v.id : null); }); } catch (e) { console.error(e); } }
  }
  const STONE = ['#3A2A24', '#43302A', '#33251F', '#3E2E26', '#2E221D'];
  const withM = (m, fn) => { ctx.save(); ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f); try { fn(); } finally { ctx.restore(); } };
  function stones(x0, x1, y0, y1, row, w, slope) { // dressed stone in courses (slope: the courses run down this much per unit across, for a side wall)
    for (let r = 0, y = y1 - row; y > y0 - row - Math.abs(slope) * (x1 - x0); r++, y -= row) { const off = (r % 2) * w / 2;
      for (let cx = x0 - w + off; cx < x1 + w; cx += w) { const hv = hsh(cx * .37 + r * 17.3), yy = y + slope * (cx - x0);
        ctx.fillStyle = shade(STONE[Math.floor(hv * STONE.length)], ((yy - Y_OFF) / (y1 - Y_OFF) - 1) * .45);
        ctx.beginPath(); ctx.moveTo(cx + .6, yy + .6); ctx.lineTo(cx + w - .6, yy + .6 + slope * w); ctx.lineTo(cx + w - .6, yy + row - .6 + slope * w); ctx.lineTo(cx + .6, yy + row - .6); ctx.closePath(); ctx.fill();
        // (each stone dressed: its upper edge catching the light, its lower in shade, the mortar sunk between; a chip or a crack now and then)
        ctx.lineWidth = .7; ctx.strokeStyle = 'rgba(255,222,186,.09)'; ctx.beginPath(); ctx.moveTo(cx + 1, yy + 1.1); ctx.lineTo(cx + w - 1.4, yy + 1.1 + slope * w); ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,.32)'; ctx.beginPath(); ctx.moveTo(cx + 1.4, yy + row - 1.1); ctx.lineTo(cx + w - 1, yy + row - 1.1 + slope * w); ctx.lineTo(cx + w - 1, yy + 1.4 + slope * w); ctx.stroke();
        const h2 = hsh(cx * 1.13 + r * 7.7);
        if (h2 > .86) { ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = .5; ctx.beginPath(); const sx = cx + w * (.2 + hsh(h2) * .5); ctx.moveTo(sx, yy + 1 + slope * (sx - cx)); ctx.lineTo(sx + 2, yy + row * .5 + slope * (sx - cx)); ctx.lineTo(sx + .5, yy + row - 1 + slope * (sx - cx)); ctx.stroke(); }
        else if (h2 < .1) { ctx.fillStyle = 'rgba(0,0,0,.22)'; ell(cx + w * .7, yy + row * .4 + slope * w * .7, 2.2, 1.2); ctx.fill(); } } }
  }
  // the timbers of the roof: a great beam along the top of each wall, its face lit from below, its soffit in shade, on corbels
  function beams(G, top) {
    const { yb, bx, drop } = G, H0 = 228, TH = 16, sF = G.sAt(yb), sN = G.sAt(yb + drop) * .96;
    const yF = yb - H0 * sF, yN = yb + drop - H0 * sN, tF = TH * sF, tN = TH * sN;
    const face = (pts, y0, y1) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) ctx.lineTo(q[0], q[1]); ctx.closePath();
      const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#2A1A12'); g.addColorStop(.6, '#4A3222'); g.addColorStop(1, '#5E4230'); ctx.fillStyle = g; ctx.fill(); outline(1); };
    // (the soffits first: the underside of each beam, seen from below, in shade)
    ctx.fillStyle = '#160E0A'; ctx.fillRect(bx, yF, VW - 2 * bx, 5 * sF);
    for (const d of [1, -1]) { const xw = d > 0 ? 0 : VW, xc = d > 0 ? bx : VW - bx; quad([xc, yF], [xw, yN], [xw, yN + 6 * sN], [xc, yF + 5 * sF]); ctx.fill(); }
    face([[bx, yF - tF], [VW - bx, yF - tF], [VW - bx, yF], [bx, yF]], yF - tF, yF);
    ctx.strokeStyle = 'rgba(20,10,6,.4)'; ctx.lineWidth = .6; ctx.beginPath(); for (let k = 0; k < 3; k++) { const y = yF - tF * (.25 + k * .25); ctx.moveTo(bx + 4, y); for (let x = bx + 4; x < VW - bx; x += 30) ctx.lineTo(x, y + (hsh(x + k) - .5) * .8); } ctx.stroke();
    for (const d of [1, -1]) { const xw = d > 0 ? 0 : VW, xc = d > 0 ? bx : VW - bx; face([[xc, yF - tF], [xw, yN - tN], [xw, yN], [xc, yF]], yF - tF, yN); }
    // corbels under the far beam, over the piers between the bays, and at the corners
    for (const x of [bx + 8, ...G.piers, VW - bx - 8]) { const s = sF; ctx.beginPath(); ctx.moveTo(x - 9 * s, yF + 5 * s); ctx.lineTo(x + 9 * s, yF + 5 * s); ctx.lineTo(x + 5 * s, yF + 20 * s); ctx.quadraticCurveTo(x, yF + 26 * s, x - 5 * s, yF + 20 * s); ctx.closePath();
      const g = ctx.createLinearGradient(x - 9 * s, 0, x + 9 * s, 0); g.addColorStop(0, '#2A1A12'); g.addColorStop(.5, '#4E3624'); g.addColorStop(1, '#22150E'); ctx.fillStyle = g; ctx.fill(); outline(.8); }
    // a shade thrown down the wall under each beam
    const sg = ctx.createLinearGradient(0, yF + 5 * sF, 0, yF + 40 * sF); sg.addColorStop(0, 'rgba(6,3,3,.55)'); sg.addColorStop(1, 'rgba(6,3,3,0)'); ctx.fillStyle = sg; ctx.fillRect(bx, yF + 5 * sF, VW - 2 * bx, 35 * sF);
  }
  function pilaster(G, dir, t) { // a stone pilaster standing out of a side wall between its bays, its face to the hall and its side to us
    const x = dir > 0 ? G.bx * (1 - t) : VW - G.bx * (1 - t), y = G.yb + t * G.drop, s = G.sAt(y) * .96, a = s * .62, k = G.k, w = 9 * a, E = 13 * s, h = 228 * s;
    const n0 = [x - dir * w, y + k * w], n1 = [x + dir * w, y - k * w]; // (its near and far edges at the foot, on the wall)
    // the side toward us, from the wall out into the hall
    quad([n0[0], n0[1] - h], [n0[0] + dir * E, n0[1] - h], [n0[0] + dir * E, n0[1]], [n0[0], n0[1]]);
    const g1 = ctx.createLinearGradient(n0[0], 0, n0[0] + dir * E, 0); g1.addColorStop(0, '#2A1E19'); g1.addColorStop(1, '#4E3C32'); ctx.fillStyle = g1; ctx.fill(); outline(.8);
    ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = .6; ctx.beginPath(); for (let v = 18 * s; v < h; v += 18 * s) { ctx.moveTo(n0[0], n0[1] - v); ctx.lineTo(n0[0] + dir * E, n0[1] - v); } ctx.stroke(); ctx.restore();
    // its face, out in the hall, square to the room
    quad([n0[0] + dir * E, n0[1] - h], [n1[0] + dir * E, n1[1] - h], [n1[0] + dir * E, n1[1]], [n0[0] + dir * E, n0[1]]);
    const g2 = ctx.createLinearGradient(n0[0] + dir * E, 0, n1[0] + dir * E, 0); g2.addColorStop(0, '#6A5444'); g2.addColorStop(1, '#3E3028'); ctx.fillStyle = g2; ctx.fill(); outline(.9);
    ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = .6; ctx.beginPath(); for (let v = 18 * s; v < h; v += 18 * s) { ctx.moveTo(n0[0] + dir * E, n0[1] - v); ctx.lineTo(n1[0] + dir * E, n1[1] - v); } ctx.stroke();
    ctx.strokeStyle = 'rgba(255,225,190,.14)'; ctx.beginPath(); for (let v = 18 * s; v < h; v += 18 * s) { ctx.moveTo(n0[0] + dir * E, n0[1] - v + 1); ctx.lineTo(n1[0] + dir * E, n1[1] - v + 1); } ctx.stroke(); ctx.restore();
    // its base, a plinth a little wider
    const b = 5 * s; quad([n0[0] - dir * 0, n0[1] - 14 * s], [n0[0] + dir * (E + b), n0[1] - 14 * s], [n0[0] + dir * (E + b), n0[1] + 1], [n0[0], n0[1] + 1]); ctx.fillStyle = '#3A2C24'; ctx.fill(); outline(.7);
    ctx.fillStyle = 'rgba(255,225,190,.14)'; ctx.fillRect(Math.min(n0[0], n0[0] + dir * (E + b)), n0[1] - 14 * s, E + b, 1.2);
    // (and its shade on the floor beside it, away from the hall's light)
    ctx.save(); ctx.translate(n0[0] + dir * E * .5, n0[1] + 3); ctx.scale(1, .3); const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, 22 * s); sg.addColorStop(0, 'rgba(6,3,3,.45)'); sg.addColorStop(1, 'rgba(6,3,3,0)'); ctx.fillStyle = sg; ctx.fillRect(-30 * s, -30 * s, 60 * s, 60 * s); ctx.restore();
  }
  function paintHall() {
    const G = geo(), { cx, yb, bx, drop, k } = G, top = Y_OFF - 4;
    ctx.fillStyle = '#100A09'; ctx.fillRect(0, top, VW, VH - top);
    // the far wall
    ctx.save(); ctx.beginPath(); ctx.rect(bx, top, VW - 2 * bx, yb - top); ctx.clip();
    const wg = ctx.createLinearGradient(0, top, 0, yb); wg.addColorStop(0, '#140C0B'); wg.addColorStop(1, '#3A2A21'); ctx.fillStyle = wg; ctx.fillRect(bx, top, VW - 2 * bx, yb - top);
    stones(bx, VW - bx, top, yb, 10, 26, 0); ctx.restore();
    // the side walls, running out toward us
    for (const dir of [1, -1]) { const x0 = dir > 0 ? 0 : VW - bx, x1 = dir > 0 ? bx : VW;
      ctx.save(); ctx.beginPath(); if (dir > 0) { ctx.moveTo(0, top); ctx.lineTo(bx, top); ctx.lineTo(bx, yb); ctx.lineTo(0, yb + drop); } else { ctx.moveTo(VW, top); ctx.lineTo(VW - bx, top); ctx.lineTo(VW - bx, yb); ctx.lineTo(VW, yb + drop); } ctx.closePath(); ctx.clip();
      const sg = ctx.createLinearGradient(x0, 0, x1, 0); sg.addColorStop(dir > 0 ? 0 : 1, '#1E1512'); sg.addColorStop(dir > 0 ? 1 : 0, '#33251E'); ctx.fillStyle = sg; ctx.fillRect(x0, top, bx, yb + drop - top);
      stones(x0, x1, top, yb + drop, 12, 30, dir > 0 ? -k : k); ctx.restore(); }
    // the vault's shadow over the tops of the walls
    const vg = ctx.createLinearGradient(0, top, 0, yb); vg.addColorStop(0, 'rgba(8,4,4,.9)'); vg.addColorStop(.45, 'rgba(8,4,4,.3)'); vg.addColorStop(1, 'rgba(8,4,4,0)'); ctx.fillStyle = vg; ctx.fillRect(0, top, VW, yb + drop - top);
    // corner piers where the walls meet
    for (const x of [bx, VW - bx]) { const pg = ctx.createLinearGradient(x - 7, 0, x + 7, 0); pg.addColorStop(0, '#2A1E1A'); pg.addColorStop(.6, '#5A463A'); pg.addColorStop(1, '#3A2C24'); ctx.fillStyle = pg; ctx.fillRect(x - 7, top, 14, yb - top);
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = .6; ctx.beginPath(); for (let y = yb - 12; y > top; y -= 12) { ctx.moveTo(x - 7, y); ctx.lineTo(x + 7, y); } ctx.stroke();
      ctx.fillStyle = 'rgba(255,225,190,.1)'; ctx.fillRect(x - 1, top, 1.2, yb - top);
      // (the shade of the corner, deepening into it on either side)
      for (const sd of [-1, 1]) { const cg = ctx.createLinearGradient(x + sd * 7, 0, x + sd * 30, 0); cg.addColorStop(0, 'rgba(6,3,3,.5)'); cg.addColorStop(1, 'rgba(6,3,3,0)'); ctx.fillStyle = cg; ctx.fillRect(Math.min(x + sd * 7, x + sd * 30), top, 23, yb - top); } }
    beams(G, top);
    // the skirting where the walls meet the floor
    ctx.strokeStyle = '#1A110E'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, yb + drop); ctx.lineTo(bx, yb); ctx.lineTo(VW - bx, yb); ctx.lineTo(VW, yb + drop); ctx.stroke();
    // the floor, its flagstones running away to the far wall
    ctx.save(); ctx.beginPath(); ctx.moveTo(0, yb + drop); ctx.lineTo(bx, yb); ctx.lineTo(VW - bx, yb); ctx.lineTo(VW, yb + drop); ctx.lineTo(VW, VH); ctx.lineTo(0, VH); ctx.closePath(); ctx.clip();
    const fg = ctx.createLinearGradient(0, yb, 0, VH); fg.addColorStop(0, '#2C201B'); fg.addColorStop(.4, '#3E2E26'); fg.addColorStop(1, '#22180F'); ctx.fillStyle = fg; ctx.fillRect(0, yb, VW, VH - yb);
    const vy = yb - VIEW_H * 1.1;
    { // each flag a little its own colour, its near edge worn and lit, a crack or a chip here and there
      const xs = (i, y) => cx + i * VW * .085 * ((y - vy) / (VH - vy)), ys = []; for (let y = yb + 4, d = 6; y < VH + d; y += d, d *= 1.32) ys.push(y); ys.unshift(yb);
      for (let j = 0; j < ys.length - 1; j++) for (let i = -17; i <= 16; i++) { const y0 = ys[j], y1 = ys[j + 1], hv = hsh(i * 3.7 + j * 11.3), off = (j % 2) * .5;
        const a0 = xs(i + off, y0), a1 = xs(i + 1 + off, y0), b0 = xs(i + off, y1), b1 = xs(i + 1 + off, y1);
        quad([a0, y0], [a1, y0], [b1, y1], [b0, y1]); ctx.fillStyle = hv > .5 ? `rgba(255,226,190,${((hv - .5) * .12).toFixed(3)})` : `rgba(0,0,0,${((.5 - hv) * .26).toFixed(3)})`; ctx.fill();
        const th = y1 - y0; ctx.strokeStyle = 'rgba(255,222,186,.07)'; ctx.lineWidth = Math.min(1.4, th * .1); ctx.beginPath(); ctx.moveTo(b0 + 1, y1 - .8); ctx.lineTo(b1 - 1, y1 - .8); ctx.stroke();
        if (hv > .9) { ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = .6; ctx.beginPath(); const mx = lerp(a0, a1, .3); ctx.moveTo(mx, y0 + 1); ctx.lineTo(lerp(a0, a1, .5), y0 + th * .45); ctx.lineTo(lerp(b0, b1, .42), y1 - 1); ctx.stroke(); }
        else if (hv < .07) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ell(lerp(a1, b1, .5) - 3, (y0 + y1) / 2, th * .25, th * .12); ctx.fill(); } }
      // the stone polished by feet down the middle of the hall, taking a sheen
      ctx.save(); ctx.translate(cx, yb + (VH - yb) * .55); ctx.scale(1, .45); const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, VW * .42); pg.addColorStop(0, 'rgba(255,214,170,.09)'); pg.addColorStop(1, 'rgba(255,214,170,0)'); ctx.fillStyle = pg; ctx.fillRect(-VW, -VW, VW * 2, VW * 2); ctx.restore(); }
    ctx.strokeStyle = 'rgba(10,6,4,.5)'; ctx.lineWidth = .8; ctx.beginPath();
    for (let i = -16; i <= 16; i++) { const xb = cx + i * VW * .085; ctx.moveTo(cx + (xb - cx) * ((yb - vy) / (VH - vy)), yb); ctx.lineTo(xb, VH); } ctx.stroke();
    for (let i = 0, y = yb + 4, d = 6; y < VH; i++, y += d, d *= 1.32) { ctx.strokeStyle = 'rgba(10,6,4,.5)'; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VW, y); ctx.stroke(); ctx.strokeStyle = 'rgba(255,220,180,.05)'; ctx.beginPath(); ctx.moveTo(0, y + 1); ctx.lineTo(VW, y + 1); ctx.stroke(); }
    for (let i = 0; i < 70; i++) { const x = hsh(i) * VW, y = yb + hsh(i + 50) * (VH - yb), r = (3 + hsh(i + 9) * 8) * G.sAt(y); ctx.fillStyle = `rgba(${hsh(i + 3) > .5 ? '255,225,190' : '0,0,0'},.05)`; ell(x, y, r * 2, r * .7); ctx.fill(); }
    // a silver runner from the Pattern to the road
    ctx.strokeStyle = 'rgba(150,180,230,.35)'; ctx.lineWidth = 1; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sd * 14, yb + 6); ctx.lineTo(cx + sd * 40, VH); ctx.stroke(); }
    ctx.restore();
    // the stalls (the far wall's first, then the side walls', far to near), each standing out from its wall onto the floor
    pilaster(G, 1, .465); pilaster(G, -1, .57);
    for (const x of G.piers) { const s = G.sAt(yb); ctx.save(); ctx.translate(x, yb); ctx.scale(s, s); pillar(0, 0); ctx.restore(); }
    const order = ['BL2', 'BL1', 'BR1', 'BR2', 'SL1', 'SR1', 'SL2', 'SR2'];
    for (const id of order) { const sl = G.slots[id], v = H.cast.find(q => q.slot === id);
      ctx.save(); if (sl.kind === 'back') { ctx.beginPath(); ctx.rect(sl.wx - sl.cell / 2, top, sl.cell, yb - top + 40); ctx.clip(); }
      try { stall(sl, v ? v.id : null); } finally { ctx.restore(); } }
    // the stalls' floor-pieces, and the light of each pooled on the floor
    for (const v of H.cast) { const sl = SL(v); if (FLOOR[v.id]) withM(sl.mv, () => FLOOR[v.id]());
      const [r, gg, b] = POOL[v.id] || [255, 170, 90]; ctx.save(); ctx.translate(sl.vx, sl.vy + 4); ctx.scale(1, .32); const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, 90 * sl.s); pg.addColorStop(0, `rgba(${r},${gg},${b},.2)`); pg.addColorStop(1, `rgba(${r},${gg},${b},0)`); ctx.fillStyle = pg; ctx.fillRect(-100, -300, 200, 600); ctx.restore(); }
    // the lights of the hall caught in the floor: the torches on the far wall and the forge's fire, each a long soft streak down the stone
    { const sF = G.sAt(yb); ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const streak = (x, y, w, len, rgb, a) => { ctx.save(); ctx.translate(x, y); ctx.scale(w / len, 1); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, len); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.5, `rgba(${rgb},${a * .3})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(-len, 0, len * 2, len); ctx.restore(); };
      for (const x of [VW * .3, VW * .43, VW * .57, VW * .7]) streak(x, yb + 3, 7 * sF, 46 * sF, '255,170,90', .16);
      const g = H.cast.find(v => v.id === 'gerard'); if (g) { const sl = SL(g); streak(sl.wx, yb + 2, 30 * sF, 90 * sF, '255,140,60', .2); }
      for (const v of H.cast) { const sl = SL(v); if (sl.kind === 'back') continue; const [r, gg, b] = POOL[v.id] || [255, 170, 90]; streak(sl.vx + sl.dir * 18 * sl.s, sl.vy + 4, 16 * sl.s, 60 * sl.s, `${r},${gg},${b}`, .1); }
      ctx.restore(); }
    // painted: the brush grain over the lot
    ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.globalAlpha = .45; ctx.scale(.5, .5); ctx.fillStyle = texPat(ctx, 'brush'); ctx.fillRect(0, top * 2, VW * 2, (VH - top) * 2); ctx.restore();
    ctx.save(); ctx.globalAlpha = .08; ctx.scale(.5, .5); ctx.fillStyle = texPat(ctx, 'hatch'); ctx.fillRect(0, (yb + 40) * 2, VW * 2, (VH - yb - 40) * 2); ctx.restore();
  }
  const POOL = { gerard: [255, 150, 70], julian: [220, 230, 190], ganelon: [200, 200, 230], dworkin: [190, 170, 255], fiona: [200, 120, 255], llewella: [120, 230, 220], random: [255, 200, 120] };
  function unicorn(x, ft) { // the Unicorn of Amber on her plinth, white stone
    ctx.fillStyle = '#5E5048'; ctx.fillRect(x - 40, ft - 26, 80, 26); outline(1); ctx.fillStyle = '#6E6056'; ctx.fillRect(x - 44, ft - 30, 88, 6); outline(.8);
    const W = '#E8E4DC', Wd = '#B8B2A8'; ctx.lineCap = 'round';
    for (const [lx, a] of [[-18, .1], [-10, -.1], [14, .15], [22, -.05]]) { ctx.strokeStyle = lx < 0 ? Wd : W; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + lx, ft - 56); ctx.lineTo(x + lx + a * 20, ft - 30); ctx.stroke(); }
    ctx.fillStyle = W; ell(x + 2, ft - 64, 30, 14, -.05); ctx.fill(); outline(1);
    ctx.beginPath(); ctx.moveTo(x + 22, ft - 70); ctx.lineTo(x + 34, ft - 100); ctx.lineTo(x + 46, ft - 98); ctx.lineTo(x + 40, ft - 70); ctx.closePath(); ctx.fill(); outline(1);
    ell(x + 48, ft - 102, 11, 6.5, .35); ctx.fill(); outline(1);
    ctx.strokeStyle = '#F4E8B0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 52, ft - 108); ctx.lineTo(x + 64, ft - 128); ctx.stroke();
    ctx.strokeStyle = Wd; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 26, ft - 66); ctx.quadraticCurveTo(x - 40, ft - 60, x - 36, ft - 42); ctx.stroke();
    ctx.fillStyle = Wd; ctx.beginPath(); ctx.moveTo(x + 32, ft - 100); ctx.quadraticCurveTo(x + 22, ft - 90, x + 20, ft - 72); ctx.lineTo(x + 26, ft - 74); ctx.closePath(); ctx.fill();
  }

  // ======================================================================================================
  // LIFE: each one's idles now and then, and their answers to what he does
  // ======================================================================================================
  const IDLES = { gerard: [['brow', 2.4], ['quench', 3.4], ['flex', 2]], julian: [['shoot', 2.8], ['string', 1.8], ['check', 2]], ganelon: [['helm', 3], ['lean', 3.2]],
    dworkin: [['shuffle', 2.4], ['float', 2.8], ['spark', 2], ['mutter', 2.6]], fiona: [['flare', 2], ['vial', 2.6]], llewella: [['ripple', 2], ['fish', 3.4], ['trail', 2.6]], random: [['dice', 2.2], ['drum', 1.8], ['flip', 2]] };
  const BUY = { gerard: 'pound', julian: 'shoot', ganelon: 'salute', dworkin: 'float', fiona: 'flare', llewella: 'ripple', random: 'grin' };
  const DUR = { greet: 1.5, startle: .9, glance: .9, wave: 1.6, pound: 1.9, salute: 1.6, grin: 2 };
  function act(v, k, dur, o = {}) {
    if (!v) return; const d = dur || DUR[k] || (IDLES[v.id].find(q => q[0] === k) || [0, 2])[1];
    v.act = Object.assign({ k, t: 0, dur: d, delay: 0 }, o); v.last = k;
    if (k === 'shoot') v.shot = false;
    if (k === 'quench') v.dx = 0;
  }
  // a line for this keeper: from a pool when given one, never the same one twice running
  function say(v, txt, dur = 2.2) { if (!v || !txt) return; if (Array.isArray(txt)) { const pool = txt.filter(q => q !== v.lastSaid); txt = pick(pool.length ? pool : txt); } v.lastSaid = txt; v.say = { txt, t: 0, dur: Math.max(dur * 1.5, 2 + txt.length * .065) }; }
  // the keepers talk among themselves: now and then two (or three) of those present have a short exchange
  const CHAT = [
    [['dworkin', 'Gérard, have you seen my blue?'], ['gerard', 'Your blue what?'], ['dworkin', 'Exactly.']],
    [['random', 'Ten shards says Gérard can lift the anvil one-handed.'], ['gerard', 'Twenty says I can lift you.'], ['random', '...no bet.']],
    [['julian', 'Your hammering scares the hounds, Gérard.'], ['gerard', 'Your hounds scare the horses.'], ['julian', 'Good.']],
    [['fiona', 'Dworkin, you have ink in your beard again.'], ['dworkin', 'It is not ink. It is a map.'], ['fiona', 'Of what?'], ['dworkin', 'My beard.']],
    [['llewella', 'The glass is cloudy today.'], ['fiona', 'So is our brother.']],
    [['random', 'Dworkin! Draw me a card where I win.'], ['dworkin', 'I drew you one where you are quiet. It did not take.']],
    [['ganelon', 'In my day we fought with what we could carry.'], ['julian', 'In your day you carried too much.'], ['ganelon', 'And I am still here, archer.']],
    [['gerard', 'Fiona, your fire is stealing my heat.'], ['fiona', 'Your heat is too loud.']],
    [['dworkin', 'Has anyone seen the Unicorn?'], ['random', 'Not since you asked yesterday.'], ['dworkin', 'Yesterday? How time flies when it is not looking.']],
    [['llewella', 'Random, you still owe Moire a pearl.'], ['random', 'Moire owes me a rematch.']],
    [['julian', 'Dworkin, my card has the wrong hounds on it.'], ['dworkin', 'They are the right hounds. They are simply someone else\'s.']],
    [['ganelon', 'Gérard, lend me your arm for a strap.'], ['gerard', 'You will want it back in one piece, I suppose.']],
    [['fiona', 'Llewella, your sea is dripping on my circle.'], ['llewella', 'Then your circle is learning to swim.']],
    [['random', 'Anyone fancy a hand?'], ['julian', 'Not with your cards.'], ['ganelon', 'Not with your hands.']],
    [['dworkin', '...Brand. Bleys. Caine...'], ['gerard', 'He is counting us again.'], ['dworkin', '...one missing. Always one missing.']],
    [['dworkin', 'If you look at the Pattern long enough, it looks back.'], ['fiona', 'Then stop looking, old man.'], ['dworkin', 'I cannot. It is rude.']],
    [['gerard', 'Julian. That arrow is in my wall.'], ['julian', 'It is in the target.'], ['gerard', 'The target is in my wall.']],
    [['llewella', 'Dworkin, what is the sea made of?'], ['dworkin', 'Blue. And then more blue. I ran out, you see.']],
    [['random', 'Ganelon, how much for the helmet?'], ['ganelon', 'More than you have.'], ['random', 'Everybody says that.']],
    [['fiona', 'The black road is wider than last time.'], ['julian', 'Then shoot straighter.'], ['gerard', 'Then hit harder.']],
  ];
  function chatTick(dt) {
    if (H.panel || H.leaving || !H.on) return;
    if (H.chat) { const C = H.chat; C.t -= dt; if (C.t > 0) return; const line = C.lines[C.i++]; if (!line) { H.chat = null; H.chatT = rand(14, 24); return; }
      const v = H.cast.find(q => q.id === line[0]); if (v) { say(v, line[1], 3.6 + line[1].length * .06); if (!v.act) act(v, 'glance', 1.6); C.t = Math.max(3.2, 2.2 + line[1].length * .075); } else C.t = 0; return; } // (each line stays up a good while, still showing as the answer comes)
    H.chatT = (H.chatT ?? rand(5, 9)) - dt; if (H.chatT > 0) return;
    const here = new Set(H.cast.map(v => v.id)), seen = H.chatSeen || (H.chatSeen = new Set());
    const ok = CHAT.map((c, i) => [c, i]).filter(([c, i]) => !seen.has(i) && c.every(l => here.has(l[0])));
    if (!ok.length) { H.chatT = 30; return; }
    const [c, i] = pick(ok); seen.add(i); H.chat = { lines: c, i: 0, t: 0 };
  }
  function life(dt) {
    chatTick(dt);
    H.idleGate -= dt; const busy = H.cast.filter(v => v.act && v.act.idle).length;
    for (const v of H.cast) {
      if (v.say) { v.say.t += dt; if (v.say.t > v.say.dur) v.say = null; }
      if (v.act) { if (v.act.delay > 0) v.act.delay -= dt; else { v.act.t += dt; if (v.act.t >= v.act.dur) v.act = null; } }
      const d = near(v);
      // a greeting as he comes up to the stall; a glance if he runs past close by
      if (d < 46 && v.away && !H.panel && !H.leaving) { v.away = false; if (!v.act || v.act.idle) { act(v, 'greet'); say(v, CAST[v.id].say.greet, 1.8); } }
      else if (d > 90) v.away = true;
      if (H.run && d < 70 && (!v.act || v.act.idle) && !v.glanced) { v.glanced = true; act(v, 'glance'); }
      if (d > 110) v.glanced = false;
      v.next -= dt;
      if (!v.act && v.next <= 0 && H.idleGate <= 0 && busy < 2 && !(H.panel === v.id)) {
        const opts = IDLES[v.id].filter(q => q[0] !== v.last), [k, du] = pick(opts.length ? opts : IDLES[v.id]);
        act(v, k, du, { idle: true }); if (k === 'mutter') say(v, CAST.dworkin.say.mutter, 2.6); else if (!H.chat && CAST[v.id].say.idle && Math.random() < (v.id === 'dworkin' ? .45 : .22)) say(v, CAST[v.id].say.idle, 2);
        v.next = rand(4, 9); H.idleGate = rand(1.2, 2.4);
      }
    }
  }
  // a purchase at a stall: the stall's own answer, now (behind the panel) and again when the panel is put away
  function bought(v) { if (!v) return; act(v, BUY[v.id], null, { buy: 1 }); v.pendingBuy = true; buyFx(v); }
  function buyFx(v) {
    if (v.id === 'random') for (let k = 0; k < 8; k++) H.fx.push({ k: 'shard', v, x: rand(-8, 8), y: -4, vx: rand(50, 80), vy: rand(-90, -50), g: 160, t: 0, life: .6 + k * .03 });
    if (v.id === 'dworkin') for (let k = 0; k < 6; k++) H.fx.push({ k: 'spark2', v, x: rand(-10, 10), y: -12 - k * 8, t: 0, life: .8 + k * .1 });
  }
  // a swing in the hall: harmless, but those near enough start
  function swing(heavy) {
    if (H.swing || H.panel || H.leaving || blocked()) return;
    const W = WEAPONS[P && P.w] || WEAPONS.fists, m = (heavy ? W.tree.H : W.tree.L) || W.tree.L;
    if (!m) return; H.swing = { m, t: 0, dur: Math.max(.25, Math.min(.7, m.dur || .3)) }; sfx('swing');
    for (const v of H.cast) { const sl = SL(v), d = Math.hypot(H.x - sl.vx, H.y - sl.vy); if (d < 120) { act(v, 'startle', null, { delay: d / 500 }); if (Math.random() < .6 || d < 60) say(v, CAST[v.id].say.startle, 1.8); } }
  }
  function leave() {
    if (H.leaving) return; H.leaving = { t: 0 };
    const G = geo(); let first = null, bd = 1e9;
    for (const v of H.cast) { if (v.id === 'dworkin') continue; const sl = SL(v); act(v, 'wave', 1.8, { delay: hsh(sl.wx) * .25 }); const d = Math.hypot(sl.vx - G.door.x, sl.vy - G.door.y); if (d < bd) { bd = d; first = v; } } // (Dworkin, bent over his cards, never even notices him go)
    if (first) say(first, CAST[first.id].say.bye, 1.6);
  }


  // ======================================================================================================
  // THE UNICORN. Now and then (about one forge visit in fourteen, never two visits running, never the first forge of a
  // new game) the Unicorn of Amber is there: she comes in a shimmer just inside the road's arch, and waits on the floor.
  // The stall-keepers turn to her (Gérard kneels; someone murmurs; Random whistles low). If he goes up to her and speaks,
  // she bows her head and leaves a gift where she stood, then is gone; if he walks on without going to her, it is lost.
  // The roll is made once per visit, from a salt kept on the save and the visit itself (cycle, world, road), and kept on
  // the save (save.fhUni), so reopening the forge or reloading in the middle of a visit never rolls again.
  // She is unicorn.js's own drawing (UNICORN.drawNew), laid straight onto the page in the hall's perspective.
  // ======================================================================================================
  const UNI_P = .07, U = { on: false };
  const visitKey = () => `${save.cycle | 0}|${save.stage | 0}|${save.branch ?? ''}`;
  function uniRoll(key, salt) { let h = 2166136261; for (const ch of key + '#' + salt) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 100000) / 100000 < UNI_P; }
  function uniDecide() {
    if (!save.fhSalt) save.fhSalt = Math.floor(Math.random() * 1e9) + 1;
    const key = visitKey(), R = save.fhUni || (save.fhUni = { key: '', on: false, done: false, prev: false });
    if (R.key !== key) { const first = (save.cycle | 0) === 0 && (save.stage | 0) <= 1;
      const prev = !!R.on; Object.assign(R, { key, prev, on: !first && !prev && uniRoll(key, save.fhSalt), done: false }); persist(); }
    return R;
  }
  function uniSpawn() {
    const R = save.fhUni, G = geo();
    if (!window.UNICORN || !UNICORN.drawNew || !R || !R.on || R.done) { U.on = false; return; }
    // she has no stall: she simply comes, wherever there is room on the floor (clear of the Pattern, the door and him), and faces him
    let px = G.cx + VW * .1, py = G.yb + (G.bot - G.yb) * .3;
    for (let i = 0; i < 80; i++) { const x = rand(50, VW - 50), y = rand(G.yb + 40, G.bot - 30);
      const onFloor = y > G.footY(x) + 24, offPat = ((x - G.pat.x) / 150) ** 2 + ((y - G.pat.y) / 44) ** 2 > 1, offDoor = Math.abs(x - G.cx) > 90 || y < G.bot - 70;
      const offHim = Math.hypot(x - H.x, (y - H.y) * 1.6) > 110, offStalls = Object.values(G.slots).every(sl => Math.hypot(x - sl.tx, (y - sl.ty) * 1.4) > 80);
      if (onFloor && offPat && offDoor && offHim && offStalls) { px = x; py = y; break; } }
    Object.assign(U, { say: null, say2: null, on: true, phase: 'in', t: 0, x: px, y: py, f: Math.sign(H.x - px) || -1, said: false, gleam: 0, gift: null, sparks: [] });
  }
  const uniS = () => geo().sAt(U.y) * .92;
  const uniSpot = () => ({ x: U.x + U.f * 64 * uniS(), y: U.y + 12 }); // (in front of her head: she faces down the hall toward the door he came in by)
  function uniUpdate(dt) {
    if (!U.on) return; U.t += dt;
    if (U.phase === 'in' && U.t > 1.6) { U.phase = 'wait'; U.t = 0; }
    if (U.phase === 'gift') { if (U.t > 1.0 && !U.gift) uniGive(); if (U.t > 2.6) { U.phase = 'out'; U.t = 0; } }
    if (U.phase === 'out' && U.t > 1.5) { U.phase = 'gone'; U.t = 0; }
    if (U.phase === 'gone' && U.t > 5) U.on = false;
    if (U.phase === 'in' && U.t > .5 && !U.said) { U.said = true; uniHeralds(); }
    if (U.phase !== 'gone' && fine() && Math.random() < dt * (U.phase === 'wait' ? 6 : 26)) { const s = uniS(); U.sparks.push({ x: U.x + rand(-40, 40) * s, y: U.y - rand(0, 110) * s, t: 0, life: rand(.6, 1.2) }); }
    for (const S2 of [U.say, U.say2]) if (S2) S2.t += dt;
    for (const p of U.sparks) { p.t += dt; p.y -= 8 * dt; } U.sparks = U.sparks.filter(p => p.t < p.life);
  }
  function uniHeralds() { // the stall-keepers turn to her: Gérard kneels, someone murmurs, Random whistles low
    H.uniLook = 6; const lines = { julian: '...the Unicorn.', fiona: '...the Unicorn.', llewella: 'She came...', ganelon: 'By the Pattern...', dworkin: 'Ah. Her.' };
    let said = 0;
    for (const v of H.cast) {
      if (v.id === 'gerard') { act(v, 'kneel', 5); say(v, 'My lady.', 2.4); }
      else if (v.id === 'random') { act(v, 'glance', 2); say(v, '*a low whistle*', 2.2); if (sfxOn && actx) try { tone(1400, .25, 'sine', .03, 2100); tone(2100, .35, 'sine', .025, 1300, .28); } catch (e) {} }
      else { act(v, 'glance', 2.4); if (said < 2 && lines[v.id]) { said++; say(v, lines[v.id], 2.4); } }
    }
    if (sfxOn && actx) try { for (let i = 0; i < 5; i++) tone(1320 + i * 220, .5, 'sine', .018, 0, i * .09); } catch (e) {}
  }
  // the gift: a purse, a free level for the weapon in hand, a card inscribed again, or (rarest, in New Game+) the black eased
  function uniGive() {
    const R = save.fhUni, c = 1 + .5 * (save.cycle || 0), rnd = (() => { let h = (save.fhSalt || 1) ^ 0x9e3779b9; for (const ch of R.key) h = Math.imul(h ^ ch.charCodeAt(0), 2654435761); return ((h >>> 0) % 1000) / 1000; })();
    // what only she gives (unicorn_boons.js): one of her own boons, kept for good, never one he has; with all hers, a blessing
    let g = null; try { if (window.UNIBOON) g = UNIBOON.give(rnd).txt; } catch (e) { console.error(e); }
    if (!g) { const s = Math.round(400 * c), gg = Math.round(8 * c); save.shards += s; save.sigils += gg; g = `+${s} shards, +${gg} sigils.`; }
    U.gift = g; R.done = true; persist(); refreshUi(); try { renderForge(); } catch (e) {}
    sfx('learned'); flashT = Math.max(flashT || 0, .06);
    for (let i = 0; i < 40; i++) { const a = rand(0, TAU), r = rand(10, 60) * uniS(); U.sparks.push({ x: U.x + Math.cos(a) * r, y: U.y - 40 * uniS() + Math.sin(a) * r * .6, t: 0, life: rand(.8, 1.6), big: 1 }); }
    U.say = { txt: 'The Unicorn bows her head. Something gleams where she stood.', t: 0, dur: 6.5 }; U.say2 = { txt: g, t: 0, dur: 6.5 };
  }
  function uniTalk() { if (!U.on || U.phase !== 'wait') return; U.phase = 'gift'; U.t = 0; H.f = Math.sign(U.x - H.x) || 1; }
  function uniDraw(t) {
    if (!U.on || U.phase === 'gone' || !window.UNICORN) return;
    const s = uniS(), a = U.phase === 'in' ? sm(U.t / 1.6) : U.phase === 'out' ? 1 - sm(U.t / 1.5) : 1, bow = U.phase === 'gift' ? Math.sin(Math.min(1, U.t / 2.2) * Math.PI) : 0;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(U.x, U.y); ctx.scale(s * -U.f, s); // (she is drawn facing left)
    try { UNICORN.drawNew(0, 0, t, { bow }); } catch (e) { console.error(e); }
    ctx.restore();
    glowR(U.x, U.y - 60 * s, 90 * s, '230,236,255', .12 * a + .25 * bow);
  }
  function uniFront(t, u) {
    if (!U.on) return; const s = uniS();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const p of U.sparks) { const a = Math.sin(p.t / p.life * Math.PI); ctx.fillStyle = `rgba(240,244,255,${a * .9})`; const r = (p.big ? 1.6 : 1) * (1 + .3 * Math.sin(p.t * 20)); ctx.beginPath(); ctx.moveTo(p.x, p.y - r * 2); ctx.lineTo(p.x + r * .5, p.y); ctx.lineTo(p.x, p.y + r * 2); ctx.lineTo(p.x - r * .5, p.y); ctx.closePath(); ctx.fill(); ctx.fillRect(p.x - r * 1.6, p.y - .3, r * 3.2, .6); }
    ctx.restore();
    if (U.gift && (U.phase === 'out' || U.phase === 'gone')) glowR(U.x, U.y - 4, 22 * s + 4 * Math.sin(t * 4), '255,244,200', .5 * (U.phase === 'gone' ? Math.max(0, 1 - U.t / 5) : 1));
    for (const [S2, dy] of [[U.say, 0], [U.say2, 1]]) if (S2 && S2.t < S2.dur) bubble(clamp(U.x, 120, VW - 120), U.y - 128 * s + dy * 26 * u, S2, u);
  }

  // ---------------- the figures' poses ----------------
  // where a prince's hand is, in his own frame (feet at 0, facing +x): from the shoulder, the upper arm, the forearm
  const handAt = (a, e, back) => { const sx = back ? -3 : 1, sy = back ? -59.5 : -59; if (e === undefined) e = back ? -.25 : 0;
    return e ? [sx + 13 * Math.cos(a) + 12 * Math.cos(a - e), sy + 13 * Math.sin(a) + 12 * Math.sin(a - e)] : [sx + 25 * Math.cos(a), sy + 25 * Math.sin(a)]; };
  function basePose(v, t) {
    const id = v.id, br = Math.sin(t * 1.6 + v.ph), p = { walk: 0, Y: .22, headTurn: false, weapon: 'fists', breath: br, arm: 1.15, backArm: 1.2, lean: -.03 };
    p.noCloak = 1;
    if (id === 'gerard') { p.weapon = 'hammer'; p.tier = 1;
      const q = ((t + v.ph) % 1.3) / 1.3; let a;
      if (q < .62) a = lerp(.6, -2.3, sm(q / .62)); else if (q < .74) a = lerp(-2.3, .6, ((q - .62) / .12) ** 2); else a = .6;
      p.arm = a; p.lean = q > .62 && q < .8 ? .16 : .04; p.backArm = .9; p.backElbow = 1.2; p.sink = q > .7 && q < .85 ? 2 : 0; p.work = -1;
      const k = Math.floor((t + v.ph) / 1.3); if (q >= .74 && v.struck !== k) { v.struck = k; strikeSparks(v, 1); } }
    else if (id === 'julian') { p.weapon = 'shortbow'; p.arm = .9; p.grip = .2; p.backArm = 1.25; }
    else if (id === 'ganelon') { p.arm = 1.0; p.elbow = .9; p.backArm = 1.3; p.backElbow = .3; p.Y = .3; }
    else if (id === 'fiona') { p.arm = .25 + .08 * Math.sin(t * 1.3 + v.ph); p.elbow = .5; p.backArm = 1.15; p.backElbow = .9; p.work = -1; }
    else if (id === 'llewella') { p.arm = 1.15; p.elbow = 1.0; p.backArm = 1.15; p.backElbow = 1.0; }
    else if (id === 'random') { const sh = Math.sin(t * 7 + v.ph); p.arm = .9; p.elbow = 1.5 + .1 * sh; p.backArm = .95; p.backElbow = 1.5 - .1 * sh; }
    return p;
  }
  function vendorPose(v, t) {
    const p = basePose(v, t), A = v.act; v.hold = null;
    if (!A || A.delay > 0) return p;
    const u = cl01(A.t / A.dur), w = env(u, .15, .2), id = v.id;
    const wave = () => { p.weapon = id === 'gerard' ? 'hammer' : p.weapon; if (id === 'gerard') { p.arm = 1.2; p.grip = .6; p.sink = 0; p.lean = 0; p.backArm = lerp(p.backArm, -1.9 + .3 * Math.sin(u * TAU * 3), w); p.backElbow = lerp(1, .6, w); }
      else { p.arm = lerp(p.arm, -1.9 + .3 * Math.sin(u * TAU * 3), w); p.elbow = lerp(p.elbow || 0, .6, w); } p.face = 1; };
    switch (A.k) {
      case 'greet': case 'wave': wave(); break;
      case 'glance': p.face = 1; p.lean = -.06 * w; break;
      case 'kneel': p.weapon = id === 'gerard' ? 'hammer' : p.weapon; p.arm = 1.2; p.grip = .6; p.sink = 11 * w; p.lean = .3 * w; p.backArm = lerp(p.backArm, .6, w); p.backElbow = lerp(p.backElbow || 0, 1.6, w); p.face = 1; break;
      case 'startle': p.face = 1; if (id === 'gerard') { p.arm = 1.2; p.grip = .6; p.sink = 0; } else { p.arm = lerp(p.arm, -.5, w); p.elbow = lerp(p.elbow || 0, 1.7, w); }
        p.backArm = lerp(p.backArm, -.3, w); p.backElbow = lerp(p.backElbow || 0, 1.7, w); p.lean = -.22 * w; p.oy = -3 * Math.sin(Math.min(1, u * 2.5) * Math.PI); break;
      // Gérard
      case 'brow': p.arm = 1.2; p.grip = .6; p.sink = 0; p.lean = 0; p.backArm = lerp(.9, -.75, w); p.backElbow = lerp(1.2, 2.5, w); p.face = 1; break;
      case 'quench': { p.weapon = 'fists'; p.work = 1; const walkOut = u < .25 ? u / .25 : u > .75 ? (1 - u) / .25 : 1; v.dx = 58 * sm(walkOut); p.walk = (u < .25 || u > .75) ? t * 9 : 0;
        const dip = u > .3 && u < .7 ? Math.sin((u - .3) / .4 * Math.PI) : 0; p.arm = .5 + dip * .7; p.elbow = .4; p.backArm = .8; p.lean = .1 * dip;
        v.hold = { k: 'tongs', glow: 1 - cl01((u - .45) / .2) };
        if (dip > .5 && Math.random() < .5) H.fx.push({ k: 'steam', v, x: GERARD_BARREL + rand(-6, 6), y: -6, vx: rand(-6, 6), vy: rand(-30, -18), t: 0, life: rand(.8, 1.4) });
        if (u > .45 && !A.hiss) { A.hiss = 1; if (sfxOn && actx && !H.panel) try { noise(.5, .05, 3800, .5); } catch (e) {} } break; }
      case 'flex': p.arm = 1.2; p.grip = .6; p.sink = 0; p.backArm = lerp(.9, -.1, w); p.backElbow = lerp(1.2, 2.3 + .15 * Math.sin(u * TAU * 2), w); p.lean = -.05 * w; p.face = 1; break;
      case 'pound': { const q = (u * 3) % 1, a = q < .55 ? lerp(.6, -2.2, sm(q / .55)) : q < .7 ? lerp(-2.2, .6, ((q - .55) / .15) ** 2) : .6; p.arm = a; p.lean = .14; p.work = -1;
        const n = Math.floor(u * 3); if (q >= .7 && A.n !== n && n < 3) { A.n = n; strikeSparks(v, 2.4); } break; }
      // Julian
      case 'shoot': { p.work = 1; p.Y = .1; const draw = u < .2 ? 0 : u < .6 ? sm((u - .2) / .4) : u < .66 ? 1 : 0;
        p.arm = lerp(.9, -.02, w); p.grip = lerp(.2, -1.45, w); p.backArm = lerp(1.25, -.08, w); p.backElbow = lerp(0, 2.5 * draw + .4, w);
        if (u >= .63 && !v.shot) { v.shot = true; v.arrowT = 0; H.fx.push({ k: 'arrow', v, x: 0, y: 0, t: 0, life: .22 }); if (sfxOn && actx && !H.panel) try { tone(520, .06, 'triangle', .02, 300); } catch (e) {} } break; }
      case 'string': p.arm = lerp(.9, .3, w); p.grip = lerp(.2, -1.2, w); p.backArm = lerp(1.25, .2, w); p.backElbow = lerp(0, 1.1 + .2 * Math.sin(u * 40), w); break;
      case 'check': p.backArm = lerp(1.25, -.4, w); p.backElbow = lerp(0, 2.2, w); v.hold = { k: 'arrow', back: 1 }; break;
      // Ganelon
      case 'helm': p.arm = lerp(1, .35, w); p.elbow = lerp(.9, 1.3, w); p.backArm = lerp(1.3, .45 + .12 * Math.sin(u * 18), w); p.backElbow = lerp(.3, 1.2, w); v.hold = { k: 'helm', a: w }; p.lean = .05; break;
      case 'lean': p.arm = lerp(1, .75, w); p.elbow = lerp(.9, .3, w); p.backArm = lerp(1.3, .8, w); p.backElbow = lerp(.3, .3, w); p.lean = .12 * w; v.hold = { k: 'sword', a: w }; break;
      case 'salute': p.arm = lerp(1, -1.7, w); p.elbow = lerp(.9, 2.5, w); p.face = 1; break;
      // Fiona
      case 'flare': p.arm = lerp(p.arm, -.9 - .2 * Math.sin(u * 9), w); p.elbow = .3; p.backArm = lerp(.9, -.6, w); p.backElbow = .3; p.work = -1; break;
      case 'vial': p.arm = lerp(p.arm, -.55, w); p.elbow = lerp(.5, 1.3, w); p.face = 1; v.hold = { k: 'vial', a: w, tilt: Math.sin(u * 7) * .4 }; break;
      // Llewella
      case 'trail': p.work = 1; p.arm = lerp(1, .05, w); p.elbow = lerp(.8, .1, w); p.lean = .06 * w; break;
      case 'ripple': case 'fish': p.work = 1; break;
      // Random
      case 'dice': if (!A.thrown && u > .4) { A.thrown = 1; for (let k = 0; k < 2; k++) H.fx.push({ k: 'die', v, x: -10, y: -14, vx: rand(-40, -15), vy: rand(-60, -30), g: 300, t: 0, life: .45 }); } p.work = -1; p.arm = lerp(.9, .5 - .5 * Math.sin(Math.min(1, u * 2.5) * Math.PI), w); p.elbow = lerp(1.5, .4, w); break;
      case 'drum': { p.work = 1; const s2 = Math.sin(u * 60); p.arm = lerp(.9, .55 + .25 * s2, w); p.elbow = .8; p.backArm = lerp(.95, .55 - .25 * s2, w); p.backElbow = .8;
        const n = Math.floor(u * 30); if (n !== A.n && n % 2 === 0 && n < 24) { A.n = n; if (sfxOn && actx && !H.panel && near(v) < 220) try { noise(.06, .06, 220 + (n % 4) * 60, 1.2); } catch (e) {} } break; }
      case 'flip': if (!A.thrown && u > .3) { A.thrown = 1; H.fx.push({ k: 'card', v, x: 8, y: -66, vx: 0, vy: -110, g: 300, t: 0, life: .75, col: '#B82A2A' }); } p.arm = lerp(.9, -.4, w); p.elbow = lerp(1.5, 1.2, w); p.face = 1; break;
      case 'grin': p.arm = lerp(.9, 1.05, w); p.elbow = lerp(1.5, 2.2, w); p.backArm = lerp(.95, .4, w); p.backElbow = lerp(1.5, .8, w); p.face = 1; p.lean = -.06 * w; break;
    }
    if (A.buy && A.t < .05 && !A.said) { A.said = 1; }
    return p;
  }
  function strikeSparks(v, n) {
    for (let k = 0; k < 9 * n; k++) H.fx.push({ k: 'spark', v, x: -34 + rand(-4, 6), y: -8, vx: rand(-70, 70) * n * .6, vy: rand(-150, -40) * Math.sqrt(n), g: 260, t: 0, life: rand(.25, .55) });
    if (!H.panel && near(v) < 200 && sfxOn && actx && actx.state === 'running') { try { tone(2400, .09, 'triangle', .02 * n); tone(3600, .05, 'sine', .01 * n); } catch (e) {} }
  }

  // ---------------- what moves at the stalls ----------------
  function flame(x, y, s, t, rgbIn, rgbOut, seed) {
    const f = 1 + .18 * Math.sin(t * 11 + seed) + .1 * Math.sin(t * 23 + seed * 2);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(${rgbOut},.75)`; ctx.beginPath(); ctx.moveTo(x - 3.6 * s, y); ctx.quadraticCurveTo(x - 4 * s, y - 6 * s * f, x + Math.sin(t * 7 + seed) * 1.4 * s, y - 13 * s * f); ctx.quadraticCurveTo(x + 4 * s, y - 6 * s * f, x + 3.6 * s, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = `rgba(${rgbIn},.9)`; ctx.beginPath(); ctx.moveTo(x - 1.8 * s, y); ctx.quadraticCurveTo(x - 2 * s, y - 3.6 * s * f, x, y - 7 * s * f); ctx.quadraticCurveTo(x + 2 * s, y - 3.6 * s * f, x + 1.8 * s, y); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function liveBack(t) {
    const G = geo(), yb = G.yb;
    // the Pattern laid in the floor at the near end, its lines burning faintly
    if (window.W7 && W7.drawPattern) { ctx.save(); ctx.translate(G.pat.x, G.pat.y); const s = Math.min(.42, VW / 1500); ctx.scale(-s, s); try { W7.drawPattern(0, 0, .35, .85, .45 + .25 * Math.sin(t * .9), t); } catch (e) {} ctx.restore(); }
    // torches on the far wall's piers
    for (const x of [VW * .3, VW * .43, VW * .57, VW * .7]) { const s = G.sAt(yb), y = yb - 98 * s; flame(x + s, y, 1.1 * s, t, '255,240,180', '255,130,50', x); glowR(x, y - 6 * s, 40 * s, '255,160,80', .2); }
    for (const v of H.cast) { const sl = SL(v), A = v.act && v.act.delay <= 0 ? v.act : null, u = A ? cl01(A.t / A.dur) : 0;
      // on the booth's back: the forge's fire-bed, the sea in the glass, the lanterns
      { const lp = LAMP(v.id, sl.hw), a = .26 + .05 * Math.sin(t * 4 + v.ph); if (lp) { if (sl.kind === 'back') withM(sl.mf, () => glowR(lp.x, lp.y, 30, '255,200,120', a));
        else withM(side3(sl, 1), () => { const p = lamp3(lp.x); glowR(p[0], p[1], 34, '255,200,120', a); }); } }
      if (v.id === 'gerard' || v.id === 'llewella') withM(sl.mw, () => {
        if (v.id === 'gerard') { const k = .75 + .25 * Math.sin(t * 5.2) * Math.sin(t * 2.3 + 1); for (let i = 0; i < 7; i++) flame(-27 + i * 9, -68, 1.3 + hsh(i) * .7, t, '255,236,160', '255,110,40', i * 3.1);
          glowR(0, -74, 60, '255,130,50', .34 * k); glowR(0, -40, 120, '255,110,40', .14 * k); glowR(0, -14, 26, '255,150,60', .3 * k); }
        else if (v.id === 'llewella') mirrorLive(MIRROR.mx, MIRROR.my, MIRROR.rx, MIRROR.ry, t, A, u);
      });
      // on the floor, in the keeper's own frame: the braziers, the arrows in the butt
      withM(sl.mv, () => {
        if (v.id === 'fiona') { const fl = A && (A.k === 'flare') ? 1 + 1.6 * env(u, .1, .4) : 1;
          for (const [bx, sc, f2] of [[-34, 1, fl]]) { for (let i = 0; i < 4; i++) flame(bx + (-9 + i * 6) * sc, 20 - 28 * sc, (1.3 + hsh(i + 5) * .5) * f2 * sc, t, '240,220,255', '170,90,255', i * 2.3 + bx);
            glowR(bx, 20 - 36 * sc, 60 * f2 * sc, '170,100,255', .28 + .06 * Math.sin(t * 6 + bx)); }
          glowR(-34, 20, 44, '200,140,255', .12 + .05 * Math.sin(t * 1.7) + (fl - 1) * .2); }
        else if (v.id === 'julian') { for (const sa of v.stuck) arrowAt(JULIAN_BUTT.x + sa[0], JULIAN_BUTT.y + sa[1], sa[2]); }
      }); }
    roadOut(t);
  }
  function roadOut(t) { // the way out to the road: the near side of the hall stands open, its light coming up off the street below the view
    const G = geo(), x = G.door.x, y = G.bot, near = Math.max(0, 1 - Math.hypot(H.x - G.door.tx, (H.y - G.door.ty) * 1.4) / 120);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, y - 46, 0, y); g.addColorStop(0, 'rgba(255,190,120,0)'); g.addColorStop(1, `rgba(255,190,120,${(.22 + .03 * Math.sin(t * .8) + .14 * near).toFixed(3)})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 46, y - 46); ctx.lineTo(x + 46, y - 46); ctx.lineTo(x + 78, y); ctx.lineTo(x - 78, y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = `rgba(255,214,150,${(.35 + .25 * near).toFixed(3)})`; ctx.lineWidth = 1.4; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sd * 46, y - 46); ctx.lineTo(x + sd * 78, y); ctx.stroke(); }
    ctx.restore();
  }
  function arrowAt(x, y, a) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.strokeStyle = '#4A3018'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-14, 0); ctx.stroke(); ctx.fillStyle = '#E8E0C8'; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-18, -2.4); ctx.lineTo(-17, 0); ctx.lineTo(-18, 2.4); ctx.closePath(); ctx.fill(); ctx.restore(); }
  function mirrorLive(mx, my, rx, ry, t, A, u) { // the sea standing in the glass: light moving down through it; its ripples, and now and then a fish
    ctx.save(); ell(mx, my, rx, ry); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 5; k++) { const y = my - ry + ((t * 14 + k * 26) % (ry * 2)); ctx.strokeStyle = `rgba(170,240,255,${.16 - Math.abs(y - my) / ry * .12})`; ctx.lineWidth = 1; ctx.beginPath(); for (let x = mx - rx; x <= mx + rx; x += 4) ctx.lineTo(x, y + Math.sin(x * .3 + t * 2 + k) * 1.6); ctx.stroke(); }
    if (A && (A.k === 'ripple' || A.k === 'trail')) { const cy = A.k === 'trail' ? my + 6 : my, cxx = A.k === 'trail' ? mx - rx + 6 : mx; for (let r = 0; r < 3; r++) { const q = u * 1.6 - r * .25; if (q <= 0 || q > 1) continue; ctx.strokeStyle = `rgba(200,250,255,${.6 * (1 - q)})`; ctx.lineWidth = 1.6; ell(cxx, cy, q * rx * 1.3, q * rx * .9); ctx.stroke(); } }
    if (A && A.k === 'fish') { const fx = lerp(mx + rx + 10, mx - rx - 10, u), fy = my + 10 + Math.sin(u * 9) * 4; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#E8A040'; ell(fx, fy, 6, 2.6); ctx.fill(); ctx.beginPath(); ctx.moveTo(fx + 5, fy); ctx.lineTo(fx + 10, fy - 3.4 * Math.sin(t * 14)); ctx.lineTo(fx + 10, fy + 3.4); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#1A1010'; circle(fx - 3.4, fy - .6, .7); ctx.fill(); }
    if (A && A.buy) for (let k = 0; k < 6; k++) { const q = (u * 1.5 + k / 6) % 1; ctx.strokeStyle = `rgba(220,255,255,${.7 * (1 - q)})`; ctx.lineWidth = .8; circle(mx - 14 + k * 6, my + ry - q * ry * 1.8, 1.6 + k % 2); ctx.stroke(); }
    for (let k = 0; k < 3; k++) { const a = t * .5 + k * 2.1; ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(200,250,255,.12)'; ctx.beginPath(); ctx.moveTo(mx + Math.sin(a) * 10 - 4, my - ry); ctx.lineTo(mx + Math.sin(a) * 18 + 6, my + ry); ctx.lineTo(mx + Math.sin(a) * 18 - 2, my + ry); ctx.lineTo(mx + Math.sin(a) * 10 - 8, my - ry); ctx.closePath(); ctx.fill(); }
    ctx.restore(); glowR(mx, my, 70, '110,220,230', .12 + .04 * Math.sin(t * 1.3) + (A && A.k !== 'fish' ? .15 * env(u) : 0));
  }
  // the units of the page per CSS pixel: labels and words are sized in CSS pixels so they stay readable on a phone
  const cssU = () => { const h = parseFloat(cv.style.height) || cv.clientHeight || 360; return VIEW_H / h; };
  function liveFront(t) {
    const G = geo(), u = cssU();
    if (fine()) for (const p of H.fx) { const sl = SL(p.v); withM(p.wall ? sl.mw : sl.mv, () => { const a = 1 - p.t / p.life;
      if (p.k === 'ember') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,${150 + 60 * a | 0},70,${a * .9})`; ctx.fillRect(p.x - .9, p.y - .9, 1.8, 1.8); ctx.restore(); }
      else if (p.k === 'spark') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,${200 + 50 * a | 0},120,${a})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * .025, p.y - p.vy * .025); ctx.stroke(); ctx.restore(); }
      else if (p.k === 'steam') { ctx.fillStyle = `rgba(230,230,240,${a * .35})`; ell(p.x, p.y, 4 + (1 - a) * 8, 3 + (1 - a) * 5); ctx.fill(); }
      else if (p.k === 'arrow') { const q = p.t / p.life, x = lerp(10, JULIAN_BUTT.x - 3, q), y = lerp(-38, JULIAN_BUTT.y, q); arrowAt(x, y, .55); if (p.t + .02 >= p.life && !p.hit) { p.hit = 1; p.v.stuck.push([rand(-4, 3), rand(-4, 4), .5 + rand(-.15, .15)]); if (p.v.stuck.length > 4) p.v.stuck.shift(); } }
      else if (p.k === 'card') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.t * 3); ctx.globalAlpha = Math.min(1, a * 2); ctx.fillStyle = '#E8EEF8'; ctx.fillRect(-4, -6, 8, 12); ctx.fillStyle = p.col; ctx.fillRect(-3, -5, 6, 10); ctx.restore(); glowR(p.x, p.y, 16, '200,190,255', .5 * a); }
      else if (p.k === 'shard') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(140,240,210,${a})`; ctx.beginPath(); ctx.moveTo(p.x, p.y - 3); ctx.lineTo(p.x + 2, p.y); ctx.lineTo(p.x, p.y + 3); ctx.lineTo(p.x - 2, p.y); ctx.closePath(); ctx.fill(); ctx.restore(); }
      else if (p.k === 'die') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.vx * p.t * .05); ctx.fillStyle = '#F0E6D0'; ctx.fillRect(-3, -3, 6, 6); ctx.strokeStyle = '#1A1418'; ctx.lineWidth = .6; ctx.strokeRect(-3, -3, 6, 6); ctx.fillStyle = '#1A1418'; ctx.fillRect(-.8, -.8, 1.6, 1.6); ctx.restore(); }
      else if (p.k === 'spark2') glowR(p.x, p.y, 10, '150,190,255', a * .9); }); }
    // Fiona's black candle and her bowl, on the table before her
    { const f = H.cast.find(v => v.id === 'fiona'), sl = f && SL(f); if (sl && sl.kind !== 'back') withM(side3(sl), () => { const T = FIONA_TABLE, c = P3(T.u + T.candle[0], -64, T.w + T.candle[1]), b = P3(T.u + 2, -55, T.w - 2);
        flame(c[0], c[1], .6, t, '220,255,220', '90,220,140', 7); glowR(c[0], c[1] - 2, 18, '120,255,170', .22);
        glowR(b[0], b[1], 16 + 3 * Math.sin(t * 1.9), '120,255,190', .2 + .06 * Math.sin(t * 2.7)); }); }
    // Dworkin's candle, on the desk he stands behind
    { const d = H.cast.find(v => v.id === 'dworkin'); if (d) withM(SL(d).mv, () => { flame(CANDLE.x, CANDLE.y, .7, t, '255,240,190', '255,170,80', 4); glowR(CANDLE.x, CANDLE.y - 3, 30, '255,190,110', .24); }); }
    // the names, on a board at each keeper's feet (clear of the plate and the buttons along the top), in CSS pixels so they
    // read on a phone; dimmed while he stands over one
    const f1 = 12 * u, f2 = 9.5 * u, hs = geo().sAt(H.y) * HFIG, hero = [H.x - 22 * hs, H.y - 100 * hs, H.x + 22 * hs, H.y + 4]; BUB.length = 0; HUD = hudBoxes(u);
    for (const v of H.cast) { const V = CAST[v.id], sl = SL(v), isT = v.id === H.target, x = sl.vx;
      const nm = V.name.toUpperCase(), rl = V.role.toUpperCase();
      ctx.save(); ctx.font = `700 ${f1.toFixed(2)}px Cinzel, Georgia, serif`; const w1 = ctx.measureText(nm).width; ctx.font = `700 ${f2.toFixed(2)}px Cinzel, Georgia, serif`; const w2 = ctx.measureText(rl).width;
      const w = Math.max(w1, w2) + 12 * u, h = f1 + f2 + 7 * u, bx = clamp(x - w / 2, 3 * u, VW - w - 3 * u), by = Math.min(sl.vy + 3 * u, VH - h - 2 * u);
      const over = hero[0] < bx + w && bx < hero[2] && hero[1] < by + h && by < hero[3];
      ctx.globalAlpha = over && !isT ? .3 : over ? .55 : isT ? 1 : .9;
      ctx.fillStyle = 'rgba(24,14,12,.82)'; rrect(bx, by, w, h, 3 * u); ctx.fill(); ctx.strokeStyle = isT ? 'rgba(255,224,150,.95)' : 'rgba(201,160,80,.75)'; ctx.lineWidth = (isT ? 1.4 : 1) * u; ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; const cx = bx + w / 2;
      ctx.font = `700 ${f1.toFixed(2)}px Cinzel, Georgia, serif`; ctx.fillStyle = isT ? '#FFE8A8' : '#EBCB7C'; ctx.fillText(nm, cx, by + 2.5 * u + f1 * .82);
      ctx.font = `700 ${f2.toFixed(2)}px Cinzel, Georgia, serif`; ctx.fillStyle = '#D8CCB8'; ctx.fillText(rl, cx, by + 3.5 * u + f1 + f2 * .78);
      ctx.restore();
      const fh = (v.id === 'dworkin' ? 62 : 96 * V.s) * sl.s * VFIG;
      if (v.say) bubble(vxOf(v), sl.vy - fh - 3 * u, v.say, u); }
    { ctx.save(); ctx.font = `700 ${(11 * u).toFixed(2)}px Cinzel, Georgia, serif`; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,236,196,.95)'; ctx.strokeStyle = 'rgba(20,10,10,.85)'; ctx.lineWidth = 2.8 * u; ctx.lineJoin = 'round';
      const s = `▼ THE ROAD · ${String(STAGES[roadStage()].name).toUpperCase()}`, y = G.bot - 6 * u; ctx.strokeText(s, G.door.x, y); ctx.fillText(s, G.door.x, y); ctx.restore(); }
    try { uniFront(t, u); } catch (e) { console.error(e); }
  }
  const BUB = [];
  let HUD = [];
  function hudBoxes(u) { // the plate and the buttons along the top, in the page's units
    if (!ui || ui.hidden) return []; const c = cv.getBoundingClientRect(), out = [];
    for (const el of ui.querySelectorAll('.fh-plate, .fh-btns')) { const r = el.getBoundingClientRect(); if (r.width) out.push([(r.left - c.left) * u, Y_OFF + (r.top - c.top) * u, (r.right - c.left) * u, Y_OFF + (r.bottom - c.top) * u]); }
    return out;
  }
  function bubble(x, y, S, u) { // a word, in a small parchment bubble over the speaker
    const a = cl01(Math.min(S.t / .15, (S.dur - S.t) / .3)); if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.font = `italic 600 ${(13.5 * u).toFixed(2)}px Spectral, Georgia, serif`; const w = ctx.measureText(S.txt).width + 16 * u, h = 20 * u;
    const bx = clamp(x - w / 2, 2, VW - w - 2); let by = y - h;
    for (let k = 0; k < 4; k++) { const hit = BUB.find(r => bx < r[0] + r[2] && r[0] < bx + w && by < r[1] + r[3] && r[1] < by + h); if (!hit) break; by = hit[1] - h - 2 * u; } // (one bubble never covers another: it rises over it)
    for (const r of HUD) if (bx < r[2] && r[0] < bx + w && by < r[3]) by = Math.max(by, r[3] + 3 * u); // (nor goes up under the plate or the buttons)
    BUB.push([bx, by, w, h]);
    ctx.fillStyle = 'rgba(244,234,214,.95)'; rrect(bx, by, w, h, 6 * u); ctx.fill(); ctx.strokeStyle = 'rgba(60,40,30,.8)'; ctx.lineWidth = .8 * u; ctx.stroke();
    const tx = clamp(x, bx + 4 * u, bx + w - 4 * u); ctx.beginPath(); ctx.moveTo(tx - 3 * u, by + h - .5); ctx.lineTo(tx, by + h + 4 * u); ctx.lineTo(tx + 3 * u, by + h - .5); ctx.closePath(); ctx.fillStyle = 'rgba(244,234,214,.95)'; ctx.fill();
    ctx.fillStyle = '#2A1A14'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(S.txt, bx + w / 2, by + h / 2 + .5 * u); ctx.restore();
  }
  function vignette() {
    ctx.save(); const g = ctx.createRadialGradient(VW / 2, Y_OFF + VIEW_H * .55, VIEW_H * .35, VW / 2, Y_OFF + VIEW_H * .55, VW * .75);
    g.addColorStop(0, 'rgba(10,5,6,0)'); g.addColorStop(1, 'rgba(10,5,6,.5)'); ctx.fillStyle = g; ctx.fillRect(0, Y_OFF, VW, VIEW_H); ctx.restore();
  }

  // ======================================================================================================
  // THE FIGURES
  // ======================================================================================================
  const lookCache = {};
  const lookOf = (id) => lookCache[id] || (lookCache[id] = LOOKS[id]());
  // ---------------- their heads: each their own face and hair (drawn in the prince's head frame, in place of his) ----------------
  function vendorHead(L, hy) {
    const sk = L.skin, st = L.hairStyle, hair = L.hair, hl = L.hairLt || shade(hair, .35), hd = L.hairDk || shade(hair, -.45), t = performance.now() / 1000, sw = Math.sin(t * 1.2 + (L.seed || 0)) * .7;
    const fillH = (path, col) => { path(); let f = C(col); if (fine()) { const g = ctx.createLinearGradient(-12, hy - 12, 8, hy + 20); g.addColorStop(0, hd); g.addColorStop(.55, col); g.addColorStop(1, hl); f = g; } ctx.fillStyle = f; ctx.fill();
      if (fine()) { // (the hair in locks: a few strands caught in the light, and the darks between them)
        ctx.save(); path(); ctx.clip(); ctx.lineCap = 'round';
        for (let i = 0; i < 6; i++) { const x0 = 7 - i * 3.4, y0 = hy - 12 + i * .6; ctx.strokeStyle = i % 2 ? 'rgba(0,0,0,.28)' : hl; ctx.globalAlpha = i % 2 ? 1 : .5; ctx.lineWidth = i % 2 ? .6 : .7;
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 - 5, y0 + 4, x0 - 7 + sw * .5, y0 + 14 + i * 2.4); ctx.stroke(); }
        ctx.globalAlpha = .35; ctx.fillStyle = '#FFF6E8'; ell(1, hy - 10.4, 4.4, 1.1, -.12); ctx.fill(); ctx.restore(); }
      path(); outline(.9); };
    // hair behind the head: the long falls (the princesses' let down past the shoulders)
    ctx.save(); if (st === 'redFlow' || st === 'greenWave') { ctx.translate(-2, hy); ctx.scale(1.2, 1.55); ctx.translate(2, -hy); }
    if (st === 'longStraight') fillH(() => { ctx.beginPath(); ctx.moveTo(2, hy - 10); ctx.quadraticCurveTo(-9, hy - 11, -10, hy - 2); ctx.lineTo(-10.6, hy + 24); ctx.lineTo(-2.4, hy + 24); ctx.lineTo(-2.4, hy + 4); ctx.closePath(); }, hair);
    if (st === 'redFlow') { fillH(() => { ctx.beginPath(); ctx.moveTo(3, hy - 11); ctx.quadraticCurveTo(-10, hy - 13, -12, hy - 1); ctx.quadraticCurveTo(-15 + sw, hy + 12, -12 + sw, hy + 30); ctx.quadraticCurveTo(-8 + sw, hy + 34, -4 + sw, hy + 28); ctx.quadraticCurveTo(-1, hy + 16, -2.4, hy + 5); ctx.closePath(); }, hair);
      if (fine()) { ctx.strokeStyle = hd; ctx.lineWidth = .7; ctx.beginPath(); for (let i = 0; i < 5; i++) { const y = hy + 4 + i * 4.6; ctx.moveTo(-8.6 + sw * .5, y); ctx.lineTo(-6.6 + sw * .5, y + 2.6); ctx.moveTo(-6.6 + sw * .5, y); ctx.lineTo(-8.6 + sw * .5, y + 2.6); } ctx.stroke(); } } // (a braid down the fall)
    if (st === 'greenWave') fillH(() => { ctx.beginPath(); ctx.moveTo(3, hy - 11); ctx.quadraticCurveTo(-10, hy - 13, -12.5, hy - 1);
      for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(-16 + (i % 2) * 4 + sw, hy + 4 + i * 7, -13 + (i % 2 ? -1 : 2) + sw, hy + 8 + i * 7);
      ctx.quadraticCurveTo(-6 + sw, hy + 36, -2 + sw, hy + 30); ctx.quadraticCurveTo(-4, hy + 16, -2.4, hy + 5); ctx.closePath(); }, hair);
    ctx.restore();
    // the head: neck, skull and jaw, ear, eye, brow, nose, mouth
    ctx.fillStyle = C(shade(sk, -.22)); ctx.fillRect(-1.5, hy + 5, 5, 6);
    const sg = fine() ? ctx.createRadialGradient(4, hy - 3, 1, 1, hy, 10) : null; if (sg) { sg.addColorStop(0, shade(sk, .12)); sg.addColorStop(1, shade(sk, -.18)); }
    ctx.beginPath(); ctx.moveTo(-5.6, hy - 7); ctx.quadraticCurveTo(1, hy - 10.4, 6, hy - 8.4); ctx.quadraticCurveTo(9.2, hy - 6, 9, hy - 1); ctx.lineTo(10.2, hy + 2.6); ctx.lineTo(9, hy + 3);
    ctx.quadraticCurveTo(9.4, hy + 7.4, 6.4, hy + 8.4); ctx.quadraticCurveTo(2, hy + 8.6, -2.4, hy + 5); ctx.quadraticCurveTo(-7.6, hy, -5.6, hy - 7); ctx.closePath();
    ctx.fillStyle = sg || C(sk); ctx.fill(); outline(1);
    ell(-1.6, hy + 1, 1.6, 2.3); ctx.fillStyle = C(shade(sk, -.2)); ctx.fill();
    if (fine()) { // (the planes of the face, painted: the cheek warm, the cheekbone lit, the side of the nose and the eye socket in shade)
      ctx.fillStyle = 'rgba(214,96,84,.16)'; ell(5.4, hy + 2.8, 2.4, 1.4); ctx.fill();
      ctx.fillStyle = 'rgba(255,244,230,.24)'; ell(6.4, hy + 1, 1.8, .7, -.2); ctx.fill();
      ctx.fillStyle = C(shade(sk, -.2)); ctx.beginPath(); ctx.moveTo(8.6, hy + .2); ctx.lineTo(10, hy + 2.8); ctx.lineTo(8.4, hy + 3.4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(60,30,30,.16)'; ell(6.2, hy - 1.6, 2.4, 1.3); ctx.fill();
      ctx.fillStyle = 'rgba(40,20,20,.18)'; ell(1.4, hy + 6.4, 3.4, 1.4, .3); ctx.fill(); }
    ctx.fillStyle = C('#F2ECE6'); ctx.fillRect(4.8, hy - 1.4, 2.8, 1.5); ctx.fillStyle = C(L.eye || '#3A2E2A'); ctx.fillRect(6.2, hy - 1.4, 1.3, 1.5);
    if (fine()) { ctx.fillStyle = '#100A0C'; ctx.fillRect(6.6, hy - 1.2, .6, 1.1); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(6.9, hy - 1.3, .45, .45); }
    ctx.fillStyle = C('#1A1214'); ctx.fillRect(4.6, hy - 1.9, 3.2, .6);
    ctx.fillStyle = C(L.brow || hd); ctx.beginPath(); ctx.moveTo(3.8, hy - 3.8); ctx.lineTo(8.4, hy - 3.6); ctx.lineTo(8.2, hy - 2.7); ctx.lineTo(4, hy - 2.9); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C(shade(sk, -.45)); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(6.8, hy + 4.8); ctx.lineTo(8.6, hy + 4.6); ctx.stroke();
    if (L.lips) { ctx.fillStyle = C(L.lips); ctx.fillRect(7, hy + 4.3, 1.6, .9); }
    // the hair over the head
    if (st === 'shaggy') fillH(() => { ctx.beginPath(); ctx.moveTo(8.6, hy - 6); ctx.lineTo(7.6, hy - 3.6); ctx.lineTo(6.4, hy - 5.6); ctx.lineTo(4.8, hy - 3.4); ctx.lineTo(3, hy - 5.2); ctx.lineTo(1.4, hy + 2); ctx.lineTo(-.6, hy + .4); ctx.lineTo(-2, hy + 6); ctx.lineTo(-4, hy + 3.4); ctx.lineTo(-6, hy + 9); ctx.lineTo(-7.6, hy + 5);
      ctx.lineTo(-10.4, hy + 7); ctx.quadraticCurveTo(-12.6, hy - 3, -10.6, hy - 9); ctx.lineTo(-12.2, hy - 11); ctx.lineTo(-8.6, hy - 12.4); ctx.lineTo(-8, hy - 15.4); ctx.lineTo(-4.6, hy - 13.8); ctx.lineTo(-2, hy - 16.6); ctx.lineTo(.4, hy - 13.8); ctx.lineTo(3.8, hy - 15.4); ctx.lineTo(4.6, hy - 12); ctx.lineTo(8.6, hy - 12.6); ctx.lineTo(7.4, hy - 9.6); ctx.lineTo(10.6, hy - 8.4); ctx.closePath(); }, hair);
    else if (st === 'short') fillH(() => { ctx.beginPath(); ctx.moveTo(8.4, hy - 6.6); ctx.lineTo(7, hy - 5); ctx.lineTo(5.6, hy - 6.4); ctx.lineTo(4, hy - 5); ctx.lineTo(2.2, hy - 5.6); ctx.lineTo(1.4, hy - 1.6); ctx.lineTo(-.4, hy - 2.6); ctx.lineTo(-2.6, hy + 1.6); ctx.lineTo(-4.6, hy - .2); ctx.lineTo(-6.6, hy + 2.4);
      ctx.quadraticCurveTo(-8.4, hy - 4, -7, hy - 8.6); ctx.lineTo(-8.8, hy - 10.6); ctx.lineTo(-5.4, hy - 10.8); ctx.lineTo(-4.6, hy - 13); ctx.lineTo(-1.6, hy - 11.4); ctx.lineTo(.6, hy - 13.4); ctx.lineTo(2.2, hy - 11.2); ctx.lineTo(5.4, hy - 12.2); ctx.lineTo(5.4, hy - 10); ctx.lineTo(8.8, hy - 9.6); ctx.closePath(); }, hair);
    else if (st === 'longStraight') fillH(() => { ctx.beginPath(); ctx.moveTo(9, hy - 7); ctx.quadraticCurveTo(8, hy - 11.6, 1, hy - 11.4); ctx.quadraticCurveTo(-8.6, hy - 11, -10, hy - 2); ctx.lineTo(-9.6, hy + 6); ctx.lineTo(-3, hy + 6); ctx.lineTo(-1.8, hy - 2); ctx.quadraticCurveTo(1, hy - 7.6, 9, hy - 7); ctx.closePath(); }, hair);
    else if (st === 'redFlow' || st === 'greenWave') { fillH(() => { ctx.beginPath(); ctx.moveTo(9.4, hy - 6.4); ctx.quadraticCurveTo(9, hy - 12, 1, hy - 12.4); ctx.quadraticCurveTo(-9.6, hy - 12, -11, hy - 2); ctx.quadraticCurveTo(-8, hy + 2, -3.6, hy + 4); ctx.quadraticCurveTo(-2.4, hy - 3.4, 2, hy - 6.6); ctx.quadraticCurveTo(6, hy - 8.2, 9.4, hy - 6.4); ctx.closePath(); }, hair);
      if (st === 'redFlow' && fine()) { ctx.fillStyle = hd; ell(-9, hy - 8, 3.6, 3); ctx.fill(); outline(.6); } } // (gathered up in a knot under her coronet, the rest let fall)
    else if (st === 'wisps') { ctx.save(); ctx.lineCap = 'round'; for (let i = 0; i < 9; i++) { const a = -2.6 + i * .14, x0 = Math.cos(a) * 9 - 2, y0 = hy - 2 + Math.sin(a) * 8; ctx.strokeStyle = C(i % 2 ? hair : hl); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 - 4 + sw, y0 + 2, x0 - 6 + sw * 1.4, y0 + 6 + (i % 3) * 2); ctx.stroke(); } ctx.restore(); }
  }
  { // the prince's head is drawn by name from drawHumanoid: a vendor with a face of their own gets it instead
    const _h = drawCorwinHead, _ht = drawCorwinHeadTurn;
    drawCorwinHead = function (look, hy) { if (look && look.hairStyle) return vendorHead(look, hy); return _h(look, hy); };
    drawCorwinHeadTurn = function (look, hy, Y) { if (look && look.hairStyle) return vendorHead(look, hy); return _ht(look, hy, Y); };
  }
  // the beard a few of them wear (in the head's own frame, as drawHumanoid leaves it in HEAD_MASK)
  function beard(hy, col, grey, len) {
    ctx.save(); ctx.translate(0, hy + 3); ctx.scale(1, len); ctx.translate(0, -(hy + 3));
    const bd = () => { ctx.beginPath(); ctx.moveTo(1.4, hy - .4); ctx.quadraticCurveTo(1.6, hy + 7, 3.6, hy + 11); ctx.quadraticCurveTo(5.4, hy + 16.4, 10.4, hy + 17.2); ctx.lineTo(11.2, hy + 15.4); ctx.quadraticCurveTo(12.6, hy + 11.4, 10.8, hy + 8.4);
      ctx.lineTo(9.7, hy + 7.2); ctx.lineTo(10.2, hy + 6.2); ctx.lineTo(10.9, hy + 5.4); ctx.quadraticCurveTo(10.2, hy + 3.9, 8.6, hy + 4.1); ctx.quadraticCurveTo(7, hy + 4.6, 6.6, hy + 6.4); ctx.quadraticCurveTo(5.4, hy + 4.4, 4.4, hy + 1.6); ctx.closePath(); };
    bd(); let fill = C(col);
    if (fine() && grey) { const g = ctx.createLinearGradient(0, hy, 0, hy + 16); g.addColorStop(0, col); g.addColorStop(1, grey); fill = g; }
    ctx.fillStyle = fill; ctx.fill(); outline(.9);
    ctx.restore();
  }
  function dressHead(L, head, t) { // over the head: Ganelon's coif, beards, and the circlets and coronets of Amber
    ctx.save(); ctx.setTransform(head.m);
    try {
      const hy = head.hy;
      if (L.headGear && window.W8 && W8.headGear) W8.headGear(L, hy, t);
      if (L.fullBeard) beard(hy, L.fullBeard[0], L.fullBeard[1], L.fullBeard[2]);
      if (L.circlet) { ctx.lineCap = 'round'; ctx.strokeStyle = FLASH ? '#fff' : shade(L.circlet, -.45); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-10.6, hy - 7.6); ctx.quadraticCurveTo(0, hy - 10.6, 9.6, hy - 7); ctx.stroke(); ctx.strokeStyle = C(L.circlet); ctx.lineWidth = 1.5; ctx.stroke();
        if (L.coronet) { ctx.fillStyle = C(L.circlet); for (const x of [-6, -1, 4]) { ctx.beginPath(); ctx.moveTo(x - 1.4, hy - 9.4); ctx.lineTo(x, hy - 13); ctx.lineTo(x + 1.4, hy - 9.6); ctx.closePath(); ctx.fill(); } }
        if (L.pearls) { ctx.fillStyle = C('#F8F6F0'); for (const x of [-7, -2, 3, 7.6]) { circle(x, hy - 8.8 - (x > 0 ? .4 : 0), .9); ctx.fill(); } }
        ctx.fillStyle = C(L.gem || '#B82A3A'); circle(6.4, hy - 7.9, .9); ctx.fill(); }
    } finally { ctx.restore(); }
  }
  function dressBody(L, p) { // over the body, in the figure's frame: a gown, a chain of office or a sash, a necklace, the cloak's clasp
    if (L.gown) { const [a, b, tr, pan] = L.gown, sw = Math.sin(performance.now() / 700 + (L.seed || 0)) * .6;
      const path = () => { ctx.beginPath(); ctx.moveTo(-8, -49); ctx.lineTo(8.4, -49); ctx.quadraticCurveTo(12, -26, 16 + sw, -1); ctx.quadraticCurveTo(0, 2.4, -16 + sw, -1); ctx.quadraticCurveTo(-12, -26, -8, -49); ctx.closePath(); };
      path(); let f = C(a); if (fine()) { const g = ctx.createLinearGradient(-16, 0, 16, 0); g.addColorStop(0, b); g.addColorStop(.6, a); g.addColorStop(1, shade(a, .18)); f = g; } ctx.fillStyle = f; ctx.fill(); outline(1);
      if (fine()) { ctx.save(); path(); ctx.clip(); ctx.fillStyle = pan; ctx.beginPath(); ctx.moveTo(1, -49); ctx.lineTo(5, -49); ctx.lineTo(9 + sw, -1); ctx.lineTo(1 + sw, -1); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(20,10,20,.35)'; ctx.lineWidth = .6; ctx.beginPath(); for (const x of [-9, -4, 11]) { ctx.moveTo(x * .45, -46); ctx.quadraticCurveTo(x * .8, -24, x + sw, -1); } ctx.stroke();
        // (the folds in the skirt, each with its lit ridge and its shaded hollow, falling from the waist; the bodice in shade under the breast)
        for (const x of [-12, -6.5, 3.5, 13]) { ctx.fillStyle = 'rgba(14,6,16,.2)'; ctx.beginPath(); ctx.moveTo(x * .4, -44); ctx.quadraticCurveTo(x * .78 - .6, -22, x + sw - 1.6, -.5); ctx.lineTo(x + sw + 1, -.5); ctx.quadraticCurveTo(x * .78 + .6, -22, x * .4 + .5, -44); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(255,246,230,.16)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(x * .4 + 1.2, -43); ctx.quadraticCurveTo(x * .78 + 1.6, -22, x + sw + 2.4, -1); ctx.stroke(); }
        const wg = ctx.createLinearGradient(0, -49, 0, -40); wg.addColorStop(0, 'rgba(10,4,12,.35)'); wg.addColorStop(1, 'rgba(10,4,12,0)'); ctx.fillStyle = wg; ctx.fillRect(-14, -49, 30, 9);
        const hg = ctx.createLinearGradient(0, -8, 0, 0); hg.addColorStop(0, 'rgba(10,4,12,0)'); hg.addColorStop(1, 'rgba(10,4,12,.3)'); ctx.fillStyle = hg; ctx.fillRect(-18, -8, 36, 9); ctx.restore(); }
      ctx.strokeStyle = C(tr); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-16 + sw, -1.6); ctx.quadraticCurveTo(0, 1.6, 16 + sw, -1.6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-8, -48.6); ctx.lineTo(8.4, -48.6); ctx.stroke(); }
    if (L.chain) { ctx.strokeStyle = C(L.chain); ctx.lineWidth = .9; ctx.setLineDash([1.2, .7]); ctx.beginPath(); ctx.moveTo(-4, -63); ctx.quadraticCurveTo(-1, -52, 5, -52); ctx.quadraticCurveTo(7, -56, 6, -63); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C(L.chain); circle(5, -51.4, 1.5); ctx.fill(); outline(.5); }
    if (L.sash) { ctx.strokeStyle = C(L.sash); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-6, -62); ctx.lineTo(7, -46); ctx.stroke(); }
    if (L.necklace) { ctx.strokeStyle = C(L.necklace); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-1, -64); ctx.quadraticCurveTo(3, -58.6, 7, -62.6); ctx.stroke(); ctx.fillStyle = C(L.gem || L.necklace); circle(3.6, -59.2, 1); ctx.fill(); }
    if (L.clasp && L.cape) { ctx.fillStyle = C(L.clasp); circle(2.6, -61.6, 1.3); ctx.fill(); outline(.4); }
  }
  // ---------------- Dworkin, drawn as himself: small, wide and hunched, a hump on his back, long arms, a great white beard ----------------
  function drawDwarf(L, p, t) {
    const br = (p.breath || 0) * .4, hy = -40 + br + (p.oy || 0), lean = p.lean || 0, sw = Math.sin(t * 1.3) * .5;
    const arm = (sx, sy, a, e, col, back) => { const ex = sx + 11 * Math.cos(a), ey = sy + 11 * Math.sin(a), hx = ex + 12 * Math.cos(a - e), hy2 = ey + 12 * Math.sin(a - e);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = FLASH ? '#fff' : INK; ctx.lineWidth = 6.6; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy2); ctx.stroke();
      ctx.strokeStyle = C(back ? shade(col, -.2) : col); ctx.lineWidth = 5; ctx.stroke();
      if (fine()) { ctx.save(); ctx.translate(-.9, -1); ctx.strokeStyle = back ? 'rgba(255,240,255,.08)' : 'rgba(255,240,255,.2)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy2); ctx.stroke(); ctx.restore(); }
      ctx.strokeStyle = C(L.trim); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(lerp(ex, hx, .7), lerp(ey, hy2, .7)); ctx.lineTo(lerp(ex, hx, .74), lerp(ey, hy2, .74)); ctx.stroke();
      ctx.fillStyle = C(back ? shade(L.skin, -.15) : L.skin); circle(hx, hy2, 2.6); ctx.fill(); outline(.8); return [hx, hy2]; };
    ctx.save(); if (p.oy) ctx.translate(0, p.oy);
    const hands = {};
    hands.b = arm(-3, -31 + br, p.ba ?? 1.5, p.be ?? .2, L.robeDk, true);
    // short legs and boots under the hem
    for (const [x, c] of [[-4, shade(L.boots, -.2)], [4, L.boots]]) { ctx.fillStyle = C(c); rrect(x - 3, -6, 7, 6, 2); ctx.fill(); outline(.8); }
    // the hump, then the robe over it, wide and short, velvet with gold at the hem and down the front
    ctx.save(); ctx.translate(0, -16); ctx.rotate(lean * .4); ctx.translate(0, 16);
    { let hf = C(L.robeDk); if (fine()) { const g = ctx.createRadialGradient(-11, -37 + br, 1, -9, -32 + br, 11); g.addColorStop(0, L.robe); g.addColorStop(1, L.robeDk); hf = g; } ctx.fillStyle = hf; ell(-9, -32 + br, 10, 9); ctx.fill(); outline(1); }
    const robe = () => { ctx.beginPath(); ctx.moveTo(-10, -36 + br); ctx.quadraticCurveTo(-2, -42 + br, 8, -36 + br); ctx.quadraticCurveTo(13, -20, 15 + sw * .3, -4); ctx.quadraticCurveTo(0, -1, -15 + sw * .3, -4); ctx.quadraticCurveTo(-14, -22, -10, -36 + br); ctx.closePath(); };
    robe(); let rf = C(L.robe); if (fine()) { const g = ctx.createLinearGradient(-15, -36, 15, -4); g.addColorStop(0, L.robeDk); g.addColorStop(.55, L.robe); g.addColorStop(1, L.robeLt); rf = g; } ctx.fillStyle = rf; ctx.fill(); outline(1.1);
    if (fine()) { ctx.save(); robe(); ctx.clip(); ctx.fillStyle = C(L.inner); ctx.beginPath(); ctx.moveTo(4, -38); ctx.lineTo(8, -38); ctx.lineTo(13, -3); ctx.lineTo(7, -3); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = C(L.trim); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(4, -38); ctx.lineTo(7, -3); ctx.moveTo(-15, -6.4); ctx.quadraticCurveTo(0, -3.6, 15, -6.4); ctx.stroke();
      ctx.fillStyle = C(L.trim); for (let i = 0; i < 6; i++) { circle(-12 + i * 5, -8.4 + Math.abs(i - 2.5) * .3, .6); ctx.fill(); }
      // (the heavy velvet in its folds: deep hollows and soft lit ridges falling from the belt, the shade gathered under the hump)
      for (const x of [-10, -5, 1, 10]) { ctx.fillStyle = 'rgba(16,6,22,.3)'; ctx.beginPath(); ctx.moveTo(x * .6, -19); ctx.quadraticCurveTo(x * .9 - .8, -11, x * 1.1 + sw * .3 - 1.4, -3); ctx.lineTo(x * 1.1 + sw * .3 + .8, -3); ctx.quadraticCurveTo(x * .9 + .4, -11, x * .6 + .6, -19); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,236,255,.16)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(x * .6 + 1.3, -18.5); ctx.quadraticCurveTo(x * .9 + 1.4, -11, x * 1.1 + sw * .3 + 2, -3.4); ctx.stroke(); }
      const sg = ctx.createRadialGradient(-8, -30, 1, -8, -30, 12); sg.addColorStop(0, 'rgba(12,4,16,.4)'); sg.addColorStop(1, 'rgba(12,4,16,0)'); ctx.fillStyle = sg; ctx.fillRect(-20, -42, 24, 24);
      ctx.strokeStyle = 'rgba(255,236,255,.22)'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(-4, -39 + br); ctx.quadraticCurveTo(4, -40 + br, 8, -36 + br); ctx.stroke(); ctx.restore(); }
    ctx.fillStyle = C(L.belt); ctx.fillRect(-11, -21, 23, 2.6); ctx.fillStyle = C(L.trim); ctx.fillRect(4, -21.6, 3, 3.6);
    ctx.restore();
    // the head, thrust forward off the hump: a big nose, bushy brows, a bald crown in a skullcap, wild white wisps, and the beard
    ctx.save(); ctx.translate(lean * 8, lean * 4);
    const hx = 7;
    { let hf = C(shade(L.skin, -.08)); if (fine()) { const g = ctx.createRadialGradient(hx + 3, hy - 1, 1, hx, hy, 9); g.addColorStop(0, shade(L.skin, .1)); g.addColorStop(1, shade(L.skin, -.22)); hf = g; } ctx.fillStyle = hf; ell(hx, hy, 8.4, 8); ctx.fill(); outline(1); }
    if (fine()) { ctx.fillStyle = 'rgba(214,96,84,.22)'; ell(hx + 4.6, hy + 2.2, 2.4, 1.6); ctx.fill(); ctx.fillStyle = 'rgba(60,30,30,.2)'; ell(hx + 4.6, hy - 1, 2.6, 1.6); ctx.fill(); }
    ctx.fillStyle = C(L.cap); ctx.beginPath(); ctx.arc(hx - .5, hy - 1.6, 8, Math.PI * 1.08, Math.PI * 1.92); ctx.closePath(); ctx.fill(); outline(.8); ctx.strokeStyle = C(L.trim); ctx.lineWidth = .9; ctx.beginPath(); ctx.arc(hx - .5, hy - 1.6, 7.6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.save(); ctx.lineCap = 'round'; for (let i = 0; i < 8; i++) { const a = 2.4 + i * .16, x0 = hx + Math.cos(a) * 8, y0 = hy + Math.sin(a) * 7.4 - 2; ctx.strokeStyle = C(i % 2 ? L.hair : L.hairDk); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 - 4 + sw, y0 - 2, x0 - 7 + sw * 2, y0 + 1 + (i % 3) * 2.4); ctx.stroke(); } ctx.restore();
    ctx.fillStyle = C(shade(L.skin, -.2)); ell(hx - 2, hy + .6, 1.6, 2.2); ctx.fill();
    ctx.fillStyle = C('#F2ECE6'); ctx.fillRect(hx + 3.4, hy - .8, 2.6, 1.4); ctx.fillStyle = C('#3A2A4A'); ctx.fillRect(hx + 4.6, hy - .8, 1.2, 1.4);
    if (fine()) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(hx + 5.2, hy - .7, .45, .45); ctx.strokeStyle = 'rgba(60,30,30,.5)'; ctx.lineWidth = .4; ctx.beginPath(); ctx.moveTo(hx + 3.4, hy + 1.2); ctx.lineTo(hx + 6, hy + 1); ctx.stroke(); }
    ctx.fillStyle = C(L.hair); ctx.beginPath(); ctx.moveTo(hx + 2.4, hy - 3.6); ctx.lineTo(hx + 8.4, hy - 3.2); ctx.lineTo(hx + 9.6, hy - 1.6); ctx.lineTo(hx + 3, hy - 2.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C(shade(L.skin, -.05)); ctx.beginPath(); ctx.moveTo(hx + 7, hy - 1); ctx.quadraticCurveTo(hx + 12.4, hy + 2.4, hx + 8.6, hy + 4.4); ctx.closePath(); ctx.fill(); outline(.7);
    if (fine()) { ctx.fillStyle = 'rgba(255,240,225,.4)'; ell(hx + 9.6, hy + 1.2, .9, .6); ctx.fill(); ctx.fillStyle = 'rgba(120,50,40,.3)'; ell(hx + 8.2, hy + 3.2, 1.2, .7); ctx.fill(); }
    const bd = () => { ctx.beginPath(); ctx.moveTo(hx + 1, hy + 2.4); ctx.quadraticCurveTo(hx + 4, hy + 5, hx + 9.4, hy + 4.4); ctx.quadraticCurveTo(hx + 13, hy + 14, hx + 9 + sw, hy + 24); ctx.quadraticCurveTo(hx + 4 + sw, hy + 27, hx + 1 + sw, hy + 22); ctx.quadraticCurveTo(hx - 4, hy + 12, hx + 1, hy + 2.4); ctx.closePath(); };
    bd(); let bf = C(L.hair); if (fine()) { const g = ctx.createLinearGradient(0, hy, 0, hy + 24); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, L.hairDk); bf = g; } ctx.fillStyle = bf; ctx.fill(); outline(.9);
    if (fine()) { ctx.save(); bd(); ctx.clip(); ctx.strokeStyle = 'rgba(120,110,100,.5)'; ctx.lineWidth = .5; ctx.beginPath(); for (let i = 0; i < 6; i++) { ctx.moveTo(hx + 2 + i * 1.6, hy + 5); ctx.quadraticCurveTo(hx + 3 + i * 1.6 + sw, hy + 14, hx + 2 + i * 1.2 + sw, hy + 24); } ctx.stroke(); ctx.restore(); }
    ctx.restore();
    hands.f = arm(4, -32 + br, p.fa ?? 1.3, p.fe ?? .3, L.robe, false);
    ctx.restore();
    return hands;
  }
  function dwarfPose(v, t) {
    const A = v.act && v.act.delay <= 0 ? v.act : null, u = A ? cl01(A.t / A.dur) : 0, w = A ? env(u, .15, .2) : 0;
    const p = { breath: Math.sin(t * 1.4 + v.ph), lean: .1, fa: .55 + .22 * Math.sin(t * 2.2 + v.ph), fe: .9, ba: 1.3, be: .5, work: -1 };
    if (!A) return p;
    switch (A.k) {
      case 'greet': case 'wave': p.fa = lerp(p.fa, -1.6 + .35 * Math.sin(u * TAU * 3), w); p.fe = .4; p.face = 1; break;
      case 'glance': p.face = 1; break;
      case 'startle': p.face = 1; p.lean = -.2 * w; p.fa = lerp(p.fa, -.6, w); p.fe = 1.6; p.ba = lerp(1.3, -.4, w); p.be = 1.5; p.oy = -3 * Math.sin(Math.min(1, u * 2.5) * Math.PI); break;
      case 'shuffle': p.fa = lerp(p.fa, .4 + .25 * Math.sin(u * 30), w); p.fe = 1.2; p.ba = lerp(1.3, .5 - .25 * Math.sin(u * 30), w); p.be = 1.1;
        if (Math.random() < .35) H.fx.push({ k: 'card', v, x: 8 + rand(-6, 6), y: -6, vx: rand(-30, 30), vy: rand(-60, -30), g: 160, t: 0, life: .45, col: pick(['#C8503E', '#4A6A9A', '#3E7A4A', '#D49866']) }); break;
      case 'float': p.fa = lerp(p.fa, -.9, w); p.fe = .3; p.face = 0; if (!A.card) { A.card = 1; H.fx.push({ k: 'card', v, x: 4, y: -8, vx: 4, vy: -26, t: 0, life: A.dur, col: '#4A6A9A' }); } break;
      case 'spark': p.fa = lerp(p.fa, -.2, w); p.fe = .2; if (Math.random() < .5) { const a = u * 14; H.fx.push({ k: 'spark2', v, x: -14 + Math.cos(a) * u * 14, y: -10 + Math.sin(a) * u * 6, t: 0, life: .5 }); } break;
      case 'mutter': p.lean = .2; p.fa = lerp(p.fa, .9, w); p.fe = 1.9; p.face = 1; break;
    }
    return p;
  }
  // ---------------- the props in their hands ----------------
  function holdProp(v, p, h) {
    const id = v.id, f = h.back ? handAt(p.backArm, p.backElbow, true) : handAt(p.arm, p.elbow, false);
    if (h.k === 'tongs') { ctx.strokeStyle = C(iron); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(f[0], f[1]); ctx.lineTo(f[0] + 16, f[1] + 6); ctx.stroke();
      ctx.strokeStyle = h.glow > .05 ? `rgba(255,${120 + 100 * h.glow | 0},60,1)` : '#6A6460'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f[0] + 14, f[1] + 5); ctx.lineTo(f[0] + 30, f[1] + 11); ctx.stroke(); }
    else if (h.k === 'arrow') { ctx.save(); ctx.translate(f[0], f[1]); ctx.rotate(-.5); ctx.strokeStyle = C('#4A3018'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(14, 0); ctx.stroke(); ctx.fillStyle = C('#C8C8D0'); ctx.beginPath(); ctx.moveTo(14, -1.6); ctx.lineTo(18, 0); ctx.lineTo(14, 1.6); ctx.closePath(); ctx.fill(); ctx.restore(); }
    else if (h.k === 'helm') { const b = handAt(p.backArm, p.backElbow, true), x = (f[0] + b[0]) / 2 + 3, y = (f[1] + b[1]) / 2 - 3; ctx.globalAlpha = h.a; ctx.fillStyle = C('#A6AAB2'); ctx.beginPath(); ctx.arc(x, y + 3, 6.4, Math.PI, 0); ctx.lineTo(x + 7.4, y + 4.4); ctx.lineTo(x - 7.4, y + 4.4); ctx.closePath(); ctx.fill(); outline(.8); if (fine()) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ell(x + 2, y - 1, 2, 1); ctx.fill(); } ctx.globalAlpha = 1; }
    else if (h.k === 'sword') { ctx.globalAlpha = h.a; const x = 17; ctx.strokeStyle = C('#C8CCD4'); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, -34); ctx.stroke();
      ctx.fillStyle = C('#D8AA55'); ctx.fillRect(x - 5, -36, 10, 2); ctx.fillStyle = C('#3A2418'); ctx.fillRect(x - 1, -44, 2, 8); ctx.fillStyle = C('#D8AA55'); circle(x, -45, 1.6); ctx.fill(); ctx.globalAlpha = 1; }
    else if (h.k === 'vial') { ctx.save(); ctx.translate(f[0], f[1] - 3); ctx.rotate(h.tilt); ctx.globalAlpha = h.a; ctx.fillStyle = 'rgba(90,220,150,.85)'; rrect(-2, -6, 4, 7, 1.6); ctx.fill(); outline(.5); ctx.fillStyle = C('#E8DCC0'); ctx.fillRect(-1, -8, 2, 2); ctx.restore(); if (h.a > .5) glowR(f[0], f[1] - 6, 10, '120,255,180', .4 * h.a); }
  }
  function drawVendor(v, t) {
    const V = CAST[v.id], L = lookOf(v.id), sl = SL(v), isNear = H.target === v.id || H.panel === v.id || near(v) < 70;
    const dwarf = !!L.dwarf, p = dwarf ? dwarfPose(v, t) : vendorPose(v, t);
    const x = vxOf(v), y = sl.vy, local = (p.work ?? V.f) * Math.sign(sl.m.a || 1);
    const toward = Math.sign(H.x - x) || 1, hall = Math.sign(geo().cx - x) || 1;
    const f = H.uniLook > 0 && U.on ? (Math.sign(U.x - x) || 1) : (p.face || isNear) && !(v.act && v.act.k === 'quench') ? toward : (p.work !== undefined ? local : (sl.kind === 'back' && v.id !== 'gerard' ? hall : local));
    const s = sl.s * VFIG, sx = s * (V.w || 1), sy = s * (dwarf ? 1 : V.s);
    // their feet on the floor: the soft shadow, and the dark where they touch it
    ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy); shadow(0, 0, dwarf ? 15 : 13);
    if (!FLASH) { ctx.fillStyle = 'rgba(12,6,8,.42)'; ell(0, .4, dwarf ? 11 : 8.6, dwarf ? 2.4 : 2); ctx.fill(); ctx.fillStyle = 'rgba(12,6,8,.3)'; ell(-f * 3, .6, dwarf ? 15 : 12, 2.8); ctx.fill(); }
    ctx.restore();
    let hands = null;
    const body = () => {
      if (dwarf) { hands = drawDwarf(L, p, t); return; }
      const hm = HEAD_MASK, W8o = window.W8, hih = W8o ? W8o.hornInHand : undefined; HEAD_MASK = null;
      if (W8o && v.id !== 'ganelon') W8o.hornInHand = true; // (the Horn of Lorraine rides at the prince's belt once won: only Ganelon's own hangs at his, w8_late.js)
      L.seed = v.ph;
      try { drawHumanoid(L, p); } finally { if (W8o) W8o.hornInHand = hih; }
      const head = HEAD_MASK; HEAD_MASK = hm;
      dressBody(L, p);
      if (head) dressHead(L, head, t);
      if (v.hold) holdProp(v, p, v.hold);
    };
    if (figLit()) litFigure(v, sl, x, y, f, sx, sy, body);
    else { ctx.save(); ctx.translate(x, y); ctx.scale(f * sx, sy); try { body(); } finally { ctx.restore(); } }
    if (hands && v.act && v.act.k === 'float' && v.act.delay <= 0) { ctx.save(); ctx.translate(x, y); ctx.scale(f * sx, sy); glowR(hands.f[0], hands.f[1], 10, '190,170,255', .5); ctx.restore(); }
    hatchActor(x, y, 13 * sx, (dwarf ? 32 : 50 * V.s) * s);
  }
  // Each keeper is drawn into a little canvas of their own and laid on the page from it, so the light can be painted over the
  // figure and nothing else: the body shaded into its own depth (the feet into the floor's shade, the side away from the hall's
  // light), and a rim of their stall's light along the head, the shoulders and the side toward it. A few small canvases a frame:
  // left out on the lightest settings, where they are drawn straight onto the page as before.
  const FIG = {};
  const figLit = () => fine() && !(typeof PAINT_LITE !== 'undefined' && PAINT_LITE) && typeof K !== 'undefined';
  const FX0 = 62, FY0 = 160, FY1 = 16;
  function litFigure(v, sl, x, y, f, sx, sy, body) {
    const S = Math.min(K, 2.4), W = FX0 * 2 * sx, Hh = (FY0 + FY1) * sy, cw = Math.ceil(W * S) + 2, ch = Math.ceil(Hh * S) + 2, left = x - FX0 * sx, topY = y - FY0 * sy;
    const F = FIG[v.id] || (FIG[v.id] = { a: document.createElement('canvas'), b: document.createElement('canvas') });
    for (const c of [F.a, F.b]) if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
    const g = F.a.getContext('2d'), old = ctx;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, cw, ch);
    ctx = g;
    try { g.setTransform(S, 0, 0, S, 0, 0); g.translate(FX0 * sx, FY0 * sy); g.scale(f * sx, sy); body(); }
    catch (e) { console.error(e); }
    finally { ctx = old; }
    // the light over the figure alone
    const hall = Math.sign(geo().cx - x) || 1, fy = FY0 * sy, fh = (v.id === 'dworkin' ? 62 : 104) * sy;
    g.setTransform(S, 0, 0, S, 0, 0); g.globalCompositeOperation = 'source-atop';
    const vg = g.createLinearGradient(0, fy - fh, 0, fy); vg.addColorStop(0, 'rgba(255,232,200,.05)'); vg.addColorStop(.3, 'rgba(255,232,200,0)'); vg.addColorStop(.78, 'rgba(14,7,12,0)'); vg.addColorStop(1, 'rgba(14,7,12,.42)');
    g.fillStyle = vg; g.fillRect(0, 0, W, Hh);
    const cxF = FX0 * sx, hw = 22 * sx, hg = g.createLinearGradient(cxF - hall * hw, 0, cxF + hall * hw, 0);
    hg.addColorStop(0, 'rgba(14,7,14,.34)'); hg.addColorStop(.5, 'rgba(14,7,14,.04)'); hg.addColorStop(.8, 'rgba(255,236,210,0)'); hg.addColorStop(1, 'rgba(255,236,210,.08)');
    g.fillStyle = hg; g.fillRect(0, 0, W, Hh);
    g.globalCompositeOperation = 'source-over';
    // the rim: the figure, less itself moved down and away from the light, in the stall's light
    const rgb = POOL[v.id] || [255, 190, 120], ls = sl.kind === 'back' ? (SHOPS[v.id] && SHOPS[v.id].lamp ? Math.sign(SHOPS[v.id].lamp * sl.m.a) : 0) : -sl.dir;
    const r = F.b.getContext('2d'); r.setTransform(1, 0, 0, 1, 0, 0); r.globalCompositeOperation = 'source-over'; r.clearRect(0, 0, cw, ch); r.drawImage(F.a, 0, 0);
    r.globalCompositeOperation = 'source-in'; r.fillStyle = `rgb(${Math.min(255, rgb[0] + 40)},${Math.min(255, rgb[1] + 40)},${Math.min(255, rgb[2] + 40)})`; r.fillRect(0, 0, cw, ch);
    r.globalCompositeOperation = 'destination-out'; const d = Math.max(1, .95 * S * Math.min(1.4, sy)); r.drawImage(F.a, -ls * d, d * 1.1);
    r.globalCompositeOperation = 'source-over';
    ctx.drawImage(F.a, 0, 0, cw, ch, left, topY, cw / S, ch / S);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .5; ctx.drawImage(F.b, 0, 0, cw, ch, left, topY, cw / S, ch / S); ctx.restore();
  }
  function heroPose(st) {
    const sw = H.swing, s0 = P.state, w0 = P.walk, m0 = P.move, t0 = P.t;
    try { if (sw) { P.state = 'atk'; P.move = sw.m; P.t = sw.t * (sw.m.dur || .3) / sw.dur; } else P.state = st; P.walk = H.walk; return playerPose(); }
    catch (e) { return { walk: H.walk }; }
    finally { P.state = s0; P.walk = w0; P.move = m0; P.t = t0; }
  }
  function drawHero(t) {
    const st = H.moving ? (H.run ? 'run' : 'walk') : 'idle', s = geo().sAt(H.y) * HFIG, a = H.leaving ? 1 - cl01((H.leaving.t - .7) / .4) : 1;
    if (a <= 0) return;
    const m = mode; mode = 'play';
    try {
      const pose = heroPose(st); pose.live = 1;
      ctx.save(); ctx.translate(H.x, H.y); ctx.scale(s, s); ctx.translate(-H.x, -H.y);
      ctx.save(); ctx.globalAlpha = a; shadow(H.x, H.y, 13); ctx.restore();
      drawPlayerAt(H.x, H.y, 0, H.f, pose, a);
      hatchActor(H.x, H.y, 13, 50);
      ctx.restore();
    } finally { mode = m; }
  }
  // The stall-keepers stand at the walls, always behind him (his floor starts in front of their feet), so they are drawn
  // first, straight onto the page with their own ink lines (the figure layer's contour and hatching cost far more than they
  // show at this size, seven times over, on a phone); then he is drawn in the figure layer as everywhere else.
  function figures(t) {
    const list = H.cast.map(v => [SL(v).vy, v]).sort((a, b) => a[0] - b[0]);
    for (const [, v] of list) { try { drawVendor(v, t); } catch (e) { console.error(e); } }
    drawFront();
    const s = geo().sAt(H.y) * HFIG, hm = HEAD_MASK, uniFirst = U.on && U.y <= H.y;
    if (uniFirst) uniDraw(t);
    inkBegin([[H.x - 140 * s, H.y - 170 * s, H.x + 140 * s, H.y + 40 * s]]); // (wide enough for the longest blades: a cursed or a level-7 greatsword, the Ygg staff, the Pearl's)
    try { drawHero(t); } catch (e) { console.error(e); }
    finally { inkEnd(); HEAD_MASK = hm; }
    if (U.on && !uniFirst) uniDraw(t);
  }

  // ---------------- a vendor's portrait, for the head of the panel ----------------
  function portrait(cv2, id) {
    const V = CAST[id], L = lookOf(id), g = cv2.getContext('2d'), W = cv2.width, Hh = cv2.height, old = ctx, fl = FLASH, ti = TINT, hm = HEAD_MASK;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, Hh);
    const bg = g.createLinearGradient(0, 0, 0, Hh); bg.addColorStop(0, V.bg[0]); bg.addColorStop(1, V.bg[1]); g.fillStyle = bg; g.fillRect(0, 0, W, Hh);
    const lg = g.createRadialGradient(W * .55, Hh * .32, 2, W * .55, Hh * .32, W * .6); lg.addColorStop(0, 'rgba(255,244,220,.35)'); lg.addColorStop(1, 'rgba(255,244,220,0)'); g.fillStyle = lg; g.fillRect(0, 0, W, Hh);
    ctx = g; FLASH = false; TINT = null;
    try {
      const v = { id, ph: 0, act: null, slot: SLOT_OF[id], stuck: [] };
      if (L.dwarf) { const s = Hh / 40; g.setTransform(s, 0, 0, s, W * .34, Hh + 14 * s); drawDwarf(L, { breath: 0, lean: .1, fa: .9, fe: 1.6, ba: 1.3, be: .5 }, 0); }
      else { const s = Hh / 38; g.setTransform(s, 0, 0, s, W * .44, Hh + 56 * s);
        const pose = basePose(v, 0); pose.Y = .2; pose.breath = 0; pose.sink = 0; if (id === 'gerard') { pose.arm = 1.2; pose.grip = .6; }
        HEAD_MASK = null; drawHumanoid(L, pose); const head = HEAD_MASK; dressBody(L, pose); if (head) dressHead(L, head, 0); }
    } finally { ctx = old; FLASH = fl; TINT = ti; HEAD_MASK = hm; }
    g.setTransform(1, 0, 0, 1, 0, 0);
    try { paintCard(cv2, W / 96); } catch (e) {}
  }

  // ---------------- the stalls, painted into the hall ----------------
  function alcove(x, ft, bg, w = STEP - 40) {
    const top = ft - 150, sp = ft - 106;
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
  // ---------------- the shop fronts ----------------
  // Each bay holds a booth: its back (boards, brick, plaster or tile, stained in the keeper's colours), the keeper's wares
  // racked and shelved on it, two posts and a lintel, an awning of the keeper's colours (or a pent roof of slates), a lantern,
  // and a sign with the trade's mark hung from an iron bracket. All in the stall's own frame (a side wall's is skewed, so its
  // booths stand on the wall in perspective), drawn to the keepers' size (up to 160 units tall in it). What stands out on the
  // floor (anvils, tables, braziers) is drawn in the keeper's frame (sl.mv: the stall's own, scaled to the keepers about
  // their feet); the desks and tables they stand behind are painted into a layer of their own, laid over them (FRONT).
  const iron = '#24201E', ironL = '#5A5450', SHOP_H = 200, AWN = -SHOP_H + 12, HEM = AWN + 26;
  function timber(x, y, w, h, col, horiz) { // a squared timber, lit from the left (or from above, laid across)
    const g = horiz ? ctx.createLinearGradient(0, y, 0, y + h) : ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, shade(col, .22)); g.addColorStop(.45, col); g.addColorStop(1, shade(col, -.38));
    ctx.fillStyle = g; ctx.beginPath(); ctx.rect(x, y, w, h); ctx.fill(); outline(.8);
    ctx.strokeStyle = 'rgba(20,10,6,.35)'; ctx.lineWidth = .5; ctx.beginPath();
    for (let k = 1; k < 3; k++) { if (horiz) { const yy = y + h * k / 3; ctx.moveTo(x + 2, yy); ctx.lineTo(x + w - 2, yy + hsh(x + k) - .5); } else { const xx = x + w * k / 3; ctx.moveTo(xx, y + 2); ctx.lineTo(xx + hsh(y + k) - .5, y + h - 2); } }
    ctx.stroke();
  }
  function boothBack(iw, kind, col) { // the booth's back wall, darker up under the awning
    const y0 = AWN;
    const g = ctx.createLinearGradient(0, y0, 0, 0); g.addColorStop(0, shade(col, -.5)); g.addColorStop(.45, shade(col, -.15)); g.addColorStop(1, col);
    ctx.fillStyle = g; ctx.fillRect(-iw, y0, iw * 2, -y0);
    ctx.save(); ctx.beginPath(); ctx.rect(-iw, y0, iw * 2, -y0); ctx.clip();
    if (kind === 'boards') for (let x = -iw, k = 0; x < iw; x += 10, k++) {
      ctx.fillStyle = `rgba(${hsh(k * 3.3) > .5 ? '255,230,190' : '0,0,0'},${.05 + hsh(k + 7) * .07})`; ctx.fillRect(x, y0, 10, -y0);
      ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, 0); ctx.stroke();
      if (hsh(k + 3) > .55) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ell(x + 5, -24 - hsh(k + 5) * 140, 1.3, 2.4); ctx.fill(); } }
    else if (kind === 'brick') for (let r = 0, y = -8; y > y0 - 8; r++, y -= 8) for (let x = -iw - (r % 2) * 8; x < iw; x += 16) {
      ctx.fillStyle = shade(col, (hsh(x * .71 + r * 3.1) - .5) * .4); ctx.fillRect(x + .6, y + .6, 14.8, 6.8); }
    else if (kind === 'plaster') { for (let k = 0; k < 14; k++) { ctx.fillStyle = `rgba(${hsh(k) > .5 ? '255,240,220' : '0,0,0'},.07)`; ell(-iw + hsh(k + 2) * iw * 2, y0 + hsh(k + 4) * -y0, 6 + hsh(k + 6) * 14, 4 + hsh(k + 8) * 8); ctx.fill(); }
      ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = .6; ctx.beginPath(); for (let k = 0; k < 4; k++) { let x = -iw + hsh(k + 20) * iw * 2, y = -10 - hsh(k + 21) * 150; ctx.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (hsh(k * 7 + j) - .5) * 10; y += 5 + hsh(k * 5 + j) * 6; ctx.lineTo(x, y); } } ctx.stroke(); }
    else if (kind === 'tile') for (let r = 0, y = 0; y > y0 - 8; r++, y -= 7) for (let x = -iw - (r % 2) * 5; x < iw + 10; x += 10) {
      ctx.fillStyle = shade(col, (hsh(x * .37 + r * 1.7) - .5) * .5); ctx.beginPath(); ctx.arc(x, y - 7, 5.4, 0, Math.PI); ctx.lineTo(x - 5.4, y - 9); ctx.lineTo(x + 5.4, y - 9); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(200,255,250,.12)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.arc(x, y - 7, 5, .2, Math.PI - .2); ctx.stroke(); }
    const sg = ctx.createLinearGradient(0, y0, 0, y0 + 70); sg.addColorStop(0, 'rgba(8,4,4,.8)'); sg.addColorStop(1, 'rgba(8,4,4,0)'); ctx.fillStyle = sg; ctx.fillRect(-iw, y0, iw * 2, 70);
    const fg = ctx.createLinearGradient(0, -30, 0, 0); fg.addColorStop(0, 'rgba(8,4,4,0)'); fg.addColorStop(1, 'rgba(8,4,4,.35)'); ctx.fillStyle = fg; ctx.fillRect(-iw, -30, iw * 2, 30);
    for (const sd of [-1, 1]) { const eg = ctx.createLinearGradient(sd * iw, 0, sd * (iw - 16), 0); eg.addColorStop(0, 'rgba(8,4,4,.55)'); eg.addColorStop(1, 'rgba(8,4,4,0)'); ctx.fillStyle = eg; ctx.fillRect(sd > 0 ? iw - 16 : -iw, y0, 16, -y0); }
    ctx.restore();
  }
  // DV: the depth of the booth being painted, out of its wall, in its own frame (geo's sl.dv); the blocks in it are drawn with it
  let DV = { x: 0, y: 9 };
  const deep = () => Math.abs(DV.x) > 10; // (a side wall's booth: it stands well out from its wall)
  const quad = (a, b, c, d) => { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); };
  // the faces of a block seen past its front (x0..x1 across, y0 its top, y1 its foot), its back (ox, oy) behind that: the side
  // turned toward us, and its top (lit), with the shade deepening into the back
  function blockSides(x0, y0, x1, y1, ox, oy, col, grain) {
    const sx = ox > 0 ? x0 : x1;
    if (Math.abs(ox) > .3) { quad([sx, y0], [sx - ox, y0 - oy], [sx - ox, y1 - oy], [sx, y1]);
      const g = ctx.createLinearGradient(sx, 0, sx - ox, 0); g.addColorStop(0, shade(col, -.42)); g.addColorStop(1, shade(col, -.66)); ctx.fillStyle = g; ctx.fill();
      if (grain) { ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = .5; ctx.beginPath(); for (let y = y0 + 5; y < y1 - 1; y += 5) { ctx.moveTo(sx, y); ctx.lineTo(sx - ox, y - oy); } ctx.stroke(); ctx.restore(); }
      quad([sx, y0], [sx - ox, y0 - oy], [sx - ox, y1 - oy], [sx, y1]); outline(.6); }
    if (oy > .3) { quad([x0, y0], [x1, y0], [x1 - ox, y0 - oy], [x0 - ox, y0 - oy]);
      const g = ctx.createLinearGradient(0, y0, 0, y0 - oy); g.addColorStop(0, shade(col, .2)); g.addColorStop(1, shade(col, -.15)); ctx.fillStyle = g; ctx.fill();
      if (grain) { ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(30,16,8,.3)'; ctx.lineWidth = .5; ctx.beginPath(); for (let k = 1; k < 3; k++) { const f = k / 3; ctx.moveTo(x0 - ox * f, y0 - oy * f); ctx.lineTo(x1 - ox * f, y0 - oy * f + hsh(x0 + k) - .5); } ctx.stroke(); ctx.restore(); }
      quad([x0, y0], [x1, y0], [x1 - ox, y0 - oy], [x0 - ox, y0 - oy]); outline(.6);
      ctx.strokeStyle = 'rgba(255,230,190,.28)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(x0 + .5, y0 - .4); ctx.lineTo(x1 - .5, y0 - .4); ctx.stroke(); }
  }
  function counter(x0, x1, top, col) { // a bench or counter along the back: it stands out from the back, its top seen over its front boards
    const f = deep() ? .42 : .5, ox = DV.x * f, oy = DV.y * f, bot = 0;
    // (the shadow it throws on the back behind it, then the block itself, its front out from the back by f of the booth)
    ctx.fillStyle = 'rgba(8,4,4,.35)'; ctx.fillRect(x0 - 2, top - 3, x1 - x0 + 4, -top + 3);
    ctx.save(); ctx.translate(ox, oy);
    blockSides(x0 - 2, top - 2, x1 + 2, bot, ox, oy, shade(col, .1), true);
    const g = ctx.createLinearGradient(0, top, 0, bot); g.addColorStop(0, shade(col, -.12)); g.addColorStop(1, shade(col, -.42)); ctx.fillStyle = g; ctx.fillRect(x0, top, x1 - x0, bot - top); ctx.beginPath(); ctx.rect(x0, top, x1 - x0, bot - top); outline(.8);
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = .6; ctx.beginPath(); for (let x = x0 + 9; x < x1 - 2; x += 9) { ctx.moveTo(x, top + 4); ctx.lineTo(x, bot); } ctx.stroke();
    ctx.strokeStyle = 'rgba(255,230,190,.12)'; ctx.beginPath(); for (let x = x0 + 9.8; x < x1 - 2; x += 9) { ctx.moveTo(x, top + 4); ctx.lineTo(x, bot); } ctx.stroke();
    timber(x0 - 2, top - 3, x1 - x0 + 4, 4, shade(col, .12), true);
    ctx.restore();
  }
  function awning(hw, cols) { // a cloth awning in two colours, its scalloped hem, the shade it throws into the booth
    const n = Math.max(5, Math.round(hw * 2 / 13)), d = HEM - AWN, b0 = -hw - 5, sw = (hw * 2 + 10) / n;
    ctx.fillStyle = 'rgba(6,3,3,.45)'; ctx.fillRect(-hw + 6, HEM, hw * 2 - 12, 16);
    const strip = (i) => { const xt0 = lerp(-hw + 2, hw - 2, i / n), xt1 = lerp(-hw + 2, hw - 2, (i + 1) / n), xb = b0 + i * sw;
      ctx.beginPath(); ctx.moveTo(xt0, AWN); ctx.lineTo(xt1, AWN); ctx.lineTo(xb + sw, AWN + d); ctx.arc(xb + sw / 2, AWN + d, sw / 2, 0, Math.PI); ctx.closePath(); };
    for (let i = 0; i < n; i++) { strip(i); ctx.fillStyle = cols[i % 2]; ctx.fill(); }
    ctx.save(); ctx.beginPath(); for (let i = 0; i < n; i++) { const xt0 = lerp(-hw + 2, hw - 2, i / n), xt1 = lerp(-hw + 2, hw - 2, (i + 1) / n), xb = b0 + i * sw; ctx.moveTo(xt0, AWN); ctx.lineTo(xt1, AWN); ctx.lineTo(xb + sw, AWN + d); ctx.arc(xb + sw / 2, AWN + d, sw / 2, 0, Math.PI); ctx.closePath(); } ctx.clip();
    const g = ctx.createLinearGradient(0, AWN, 0, HEM + 6); g.addColorStop(0, 'rgba(255,240,210,.22)'); g.addColorStop(.6, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.35)'); ctx.fillStyle = g; ctx.fillRect(-hw - 8, AWN, hw * 2 + 16, d + 8);
    ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = .7; ctx.beginPath(); for (let i = 0; i <= n; i++) { const xt = lerp(-hw + 2, hw - 2, i / n), xb = b0 + i * sw; ctx.moveTo(xt, AWN); ctx.lineTo(xb, AWN + d); } ctx.stroke();
    ctx.restore();
    for (let i = 0; i < n; i++) { strip(i); outline(.7); }
    ctx.strokeStyle = 'rgba(255,230,170,.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(b0 + 1, AWN + d - 2); ctx.lineTo(-b0 - 1, AWN + d - 2); ctx.stroke();
  }
  function slates(hw, col) { // a pent roof of slates over a smith's or an armourer's booth
    const d = HEM - AWN + 2, path = () => { ctx.beginPath(); ctx.moveTo(-hw + 1, AWN); ctx.lineTo(hw - 1, AWN); ctx.lineTo(hw + 6, AWN + d); ctx.lineTo(-hw - 6, AWN + d); ctx.closePath(); };
    ctx.fillStyle = 'rgba(6,3,3,.5)'; ctx.fillRect(-hw + 6, AWN + d, hw * 2 - 12, 16);
    path(); ctx.fillStyle = col; ctx.fill(); ctx.save(); path(); ctx.clip();
    for (let r = 0, y = AWN; y < AWN + d; r++, y += 6.5) for (let x = -hw - 8 + (r % 2) * 5; x < hw + 8; x += 10) {
      ctx.fillStyle = shade(col, (hsh(x * .53 + r * 2.3) - .5) * .5 + r * .04); ctx.beginPath(); ctx.moveTo(x + .5, y + .5); ctx.lineTo(x + 9.5, y + .5); ctx.lineTo(x + 9.5, y + 5.5); ctx.quadraticCurveTo(x + 5, y + 7.5, x + .5, y + 5.5); ctx.closePath(); ctx.fill(); }
    const g = ctx.createLinearGradient(0, AWN, 0, AWN + d); g.addColorStop(0, 'rgba(255,240,220,.18)'); g.addColorStop(1, 'rgba(0,0,0,.3)'); ctx.fillStyle = g; ctx.fillRect(-hw - 8, AWN, hw * 2 + 16, d);
    ctx.restore(); path(); outline(1);
    timber(-hw - 7, AWN + d - 1, hw * 2 + 14, 4, '#3A2A1E', true);
  }
  // ---------------- the booth in depth: all in the booth's front frame (sl.mf), its back DV behind it ----------------
  function boothFloor(hw) { // the booth's own floor, between its back and its front: boards gone dark at the back, and its shade on the hall's floor
    const ox = DV.x, oy = DV.y, x0 = -hw + 2, x1 = hw - 2;
    quad([x0, 1], [x1, 1], [x1 - ox, -oy], [x0 - ox, -oy]);
    const g = ctx.createLinearGradient(0, 1, -ox * .4, -oy); g.addColorStop(0, '#34261E'); g.addColorStop(1, '#140C0A'); ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = .6; ctx.beginPath();
    for (let k = 1; k < 4; k++) { const f = k / 4; ctx.moveTo(x0 - ox * f, -oy * f); ctx.lineTo(x1 - ox * f, -oy * f); } ctx.stroke();
    ctx.strokeStyle = 'rgba(255,220,180,.06)'; ctx.beginPath(); for (let k = 1; k < 4; k++) { const f = k / 4 - .04; ctx.moveTo(x0 - ox * f, -oy * f); ctx.lineTo(x1 - ox * f, -oy * f); } ctx.stroke(); ctx.restore();
    // (the shade under the booth, soft on the hall's floor in front of it)
    ctx.save(); ctx.translate(ox * .12, 4); ctx.scale(1, deep() ? .5 : .22); const sg = ctx.createRadialGradient(0, 0, hw * .2, 0, 0, hw * 1.15); sg.addColorStop(0, 'rgba(6,3,3,.42)'); sg.addColorStop(1, 'rgba(6,3,3,0)'); ctx.fillStyle = sg; ctx.fillRect(-hw * 1.3, -hw * 1.3, hw * 2.6, hw * 2.6); ctx.restore();
    const ag = ctx.createLinearGradient(0, 0, 0, 9); ag.addColorStop(0, 'rgba(6,3,3,.5)'); ag.addColorStop(1, 'rgba(6,3,3,0)'); ctx.fillStyle = ag; ctx.fillRect(-hw - 6, 0, hw * 2 + 12, 9);
  }
  function wallHalo(hw) { // the shadow the booth throws on the stone round its back (in the back's own frame)
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.75)'; ctx.shadowBlur = 14; ctx.fillStyle = 'rgba(10,6,5,.6)'; ctx.fillRect(-hw + 1, -SHOP_H + 4, hw * 2 - 2, SHOP_H - 4); ctx.restore();
  }
  function underside(hw, o) { // under the awning (or the slates): its lining, seen running back into the booth in shade
    const cols = o.awn || [shade(o.roof, -.2), shade(o.roof, -.35)], b0 = -hw - 5, ox = DV.x, oy = deep() ? 7 : 12, n = Math.max(5, Math.round(hw * 2 / 13)), sw = (hw * 2 + 10) / n, y = HEM + (o.roof ? 2 : 0);
    for (let i = 0; i < n; i++) { const xa = b0 + i * sw, xb = xa + sw; quad([xa, y], [xb, y], [xb - ox, y + oy], [xa - ox, y + oy]); ctx.fillStyle = shade(cols[i % 2], -.62); ctx.fill(); }
    quad([b0, y], [-b0, y], [-b0 - ox, y + oy], [b0 - ox, y + oy]); const g = ctx.createLinearGradient(0, y, 0, y + oy); g.addColorStop(0, 'rgba(6,3,3,.15)'); g.addColorStop(1, 'rgba(6,3,3,.6)'); ctx.fillStyle = g; ctx.fill(); outline(.6);
  }
  function boothFrame(hw, o) { // the posts on their stone footings, the lintel across, and the awning (or the slates) over it all, each with its depth
    const pc = o.post || '#5A3A24', ox = DV.x, oy = DV.y, sg = Math.sign(ox) || 1, dp = deep(), pd = dp ? .3 : 1;
    if (o.awn || o.roof) underside(hw, o);
    for (const sd of [-1, 1]) { const px = sd * (hw - 6);
      blockSides(px - 5.5, AWN - 4, px + 5.5, 8, ox * pd, 0, pc, true);
      // (the post's footing, a squared stone with its top seen)
      blockSides(px - 8, 4, px + 8, 16, ox * pd * .8 + sg * 2, oy * .5 + 2, '#5E5046', false);
      ctx.fillStyle = '#4E4038'; ctx.beginPath(); ctx.rect(px - 8, 4, 16, 12); ctx.fill(); outline(.8); ctx.fillStyle = '#6A5A4C'; ctx.fillRect(px - 8, 4, 16, 2);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(px - 8, 12, 16, 4);
      timber(px - 5.5, AWN - 4, 11, -AWN + 12, pc);
      // (the shade the post throws down its own inner side, where the booth is darker)
      const ig = ctx.createLinearGradient(px - sd * 5.5, 0, px - sd * 1.5, 0); ig.addColorStop(0, 'rgba(6,3,3,.35)'); ig.addColorStop(1, 'rgba(6,3,3,0)'); ctx.fillStyle = ig; ctx.fillRect(Math.min(px - sd * 5.5, px - sd * 1.5), AWN + 10, 4, -AWN - 2);
      ctx.fillStyle = shade(pc, -.2); ctx.beginPath(); ctx.moveTo(px - sd * 5.5, AWN + 34); ctx.lineTo(px - sd * 16, AWN + 30); ctx.lineTo(px - sd * 16, AWN + 26); ctx.lineTo(px - sd * 5.5, AWN + 26); ctx.closePath(); ctx.fill(); outline(.6);
      ctx.fillStyle = shade(pc, -.5); ctx.beginPath(); ctx.moveTo(px - sd * 5.5, AWN + 34); ctx.lineTo(px - sd * 16, AWN + 30); ctx.lineTo(px - sd * 16, AWN + 32); ctx.lineTo(px - sd * 5.5, AWN + 37); ctx.closePath(); ctx.fill();
      ctx.fillStyle = iron; circle(px, AWN + 30, .9); ctx.fill(); }
    // the lintel, with its underside in shade
    blockSides(-hw - 3, -SHOP_H, hw + 3, -SHOP_H + 13, ox * pd, 0, pc, true);
    timber(-hw - 3, -SHOP_H, hw * 2 + 6, 13, pc, true);
    ctx.fillStyle = 'rgba(6,3,3,.4)'; ctx.fillRect(-hw - 3, -SHOP_H + 10, hw * 2 + 6, 3);
    if (o.roof) slates(hw, o.roof); else if (o.awn) awning(hw, o.awn);
  }
  function hangSign(px, x, icon) { // a board on an iron bracket out of the post, the trade's mark painted on it
    const y = HEM + 8, w = 30, h = 23, sd = Math.sign(x - px) || 1;
    ctx.strokeStyle = iron; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px, y - 6); ctx.lineTo(x + sd * 13, y - 6); ctx.moveTo(px, y + 4); ctx.quadraticCurveTo(px + sd * 8, y - 5, px + sd * 14, y - 6); ctx.stroke();
    ctx.lineWidth = .9; ctx.beginPath(); for (const k of [-1, 1]) { ctx.moveTo(x + k * 10, y - 6); ctx.lineTo(x + k * 10, y); } ctx.stroke(); ctx.lineCap = 'butt';
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#6E4A2E'); g.addColorStop(1, '#3E2818'); ctx.fillStyle = g; rrect(x - w / 2, y, w, h, 3); ctx.fill(); outline(1);
    ctx.strokeStyle = '#C9A050'; ctx.lineWidth = 1; rrect(x - w / 2 + 2.2, y + 2.2, w - 4.4, h - 4.4, 2); ctx.stroke();
    ctx.save(); ctx.translate(x, y + h / 2); SIGNS[icon](); ctx.restore();
  }
  function lantern(x, lit) { // a lantern hung on its chain under the awning (its light is live, liveBack)
    const y = HEM + 16;
    ctx.strokeStyle = iron; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(x, HEM - 6); ctx.lineTo(x, y - 9); ctx.stroke();
    ctx.fillStyle = '#2A2420'; ctx.beginPath(); ctx.moveTo(x - 6, y - 7); ctx.lineTo(x, y - 12); ctx.lineTo(x + 6, y - 7); ctx.closePath(); ctx.fill(); outline(.6);
    ctx.fillStyle = lit ? '#FFD890' : '#3A3430'; ctx.fillRect(x - 4.4, y - 7, 8.8, 13); if (lit) { ctx.fillStyle = '#FFF4D0'; ctx.fillRect(x - 1.6, y - 4, 3.2, 6); }
    ctx.strokeStyle = '#2A2420'; ctx.lineWidth = 1.1; ctx.strokeRect(x - 4.4, y - 7, 8.8, 13); ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x, y + 6); ctx.stroke();
    ctx.fillStyle = '#2A2420'; ctx.fillRect(x - 5.4, y + 6, 10.8, 2.6);
  }
  // the trades' marks, painted on the signs (in a box about 20 wide)
  const SIGNS = {
    smith() { ctx.save(); ctx.rotate(-.7); ctx.fillStyle = '#D0D4DC'; ctx.fillRect(-1.2, -9, 2.4, 13); ctx.fillStyle = '#D8AA55'; ctx.fillRect(-4, 3.4, 8, 1.6); ctx.fillRect(-.9, 5, 1.8, 4); ctx.restore();
      ctx.save(); ctx.rotate(.7); ctx.fillStyle = '#8A6040'; ctx.fillRect(-.9, -6, 1.8, 15); ctx.fillStyle = '#B8BCC6'; ctx.fillRect(-4.6, -9, 9.2, 4.4); ctx.restore(); },
    hunt() { ctx.strokeStyle = '#E8D8B0'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(-3, 0, 8.5, -1.1, 1.1); ctx.stroke(); ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(-3 + 8.5 * Math.cos(1.1), -8.5 * Math.sin(1.1)); ctx.lineTo(-3 + 8.5 * Math.cos(1.1), 8.5 * Math.sin(1.1)); ctx.stroke();
      ctx.strokeStyle = '#E8E0C8'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(9, 0); ctx.stroke(); ctx.fillStyle = '#C8CCD4'; ctx.beginPath(); ctx.moveTo(9, -2); ctx.lineTo(12, 0); ctx.lineTo(9, 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#3A7A4A'; ctx.fillRect(-8, -1.8, 3, 3.6); },
    trump() { ctx.save(); ctx.rotate(-.12); ctx.fillStyle = '#E8EEF8'; ctx.fillRect(-6, -8.5, 12, 17); ctx.fillStyle = '#3A5A9A'; ctx.fillRect(-4.6, -7, 9.2, 14); ctx.strokeStyle = '#D8AA55'; ctx.lineWidth = .8; ctx.strokeRect(-4.6, -7, 9.2, 14);
      ctx.fillStyle = '#F4E8C0'; ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU - Math.PI / 2, r = k % 2 ? 1.4 : 3.6; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.restore(); },
    helm() { ctx.fillStyle = '#B8BCC6'; ctx.beginPath(); ctx.moveTo(-7, 7); ctx.lineTo(-7, -2); ctx.quadraticCurveTo(-7, -9, 0, -9); ctx.quadraticCurveTo(7, -9, 7, -2); ctx.lineTo(7, 7); ctx.closePath(); ctx.fill(); outline(.6);
      ctx.fillStyle = '#1A1418'; ctx.fillRect(-5, -2, 10, 1.6); ctx.fillRect(-.7, -2, 1.4, 6); ctx.fillStyle = '#B82A2A'; ctx.beginPath(); ctx.moveTo(0, -9); ctx.quadraticCurveTo(6, -13, 9, -8); ctx.quadraticCurveTo(5, -10, 0, -8); ctx.fill(); },
    flask() { ctx.fillStyle = 'rgba(190,120,255,.9)'; ctx.beginPath(); ctx.moveTo(-2, -7); ctx.lineTo(2, -7); ctx.lineTo(2, -3); ctx.quadraticCurveTo(8, 0, 6.4, 5); ctx.quadraticCurveTo(0, 9, -6.4, 5); ctx.quadraticCurveTo(-8, 0, -2, -3); ctx.closePath(); ctx.fill(); outline(.6);
      ctx.fillStyle = '#E8DCC0'; ctx.fillRect(-2.4, -9, 4.8, 2.4); ctx.fillStyle = 'rgba(255,255,255,.6)'; ell(-2.6, 2, 1.2, 2.4, .4); ctx.fill(); ctx.fillStyle = '#C8F0D0'; circle(2, 2, 1); ctx.fill(); },
    dice() { ctx.save(); ctx.rotate(.2); ctx.fillStyle = '#F0E6D0'; rrect(-7, -7, 14, 14, 2.4); ctx.fill(); outline(.6); ctx.fillStyle = '#B82A2A'; for (const [a, b] of [[-3.4, -3.4], [0, 0], [3.4, 3.4], [3.4, -3.4], [-3.4, 3.4]]) { circle(a, b, 1.3); ctx.fill(); } ctx.restore(); },
    pearl() { ctx.fillStyle = '#F0D8D0'; ctx.beginPath(); ctx.moveTo(-9, 2); ctx.quadraticCurveTo(0, -12, 9, 2); ctx.closePath(); ctx.fill(); outline(.5);
      ctx.strokeStyle = 'rgba(120,70,70,.5)'; ctx.lineWidth = .5; ctx.beginPath(); for (let k = -3; k <= 3; k++) { ctx.moveTo(0, 4); ctx.lineTo(k * 2.6, -5 + Math.abs(k) * 1.2); } ctx.stroke();
      ctx.fillStyle = '#F8F6F0'; circle(0, 4, 3.2); ctx.fill(); ctx.fillStyle = 'rgba(140,220,230,.6)'; circle(-1, 3, 1.2); ctx.fill(); },
  };
  // each keeper's booth: its back, its colours and its sign
  const SHOPS = {
    gerard: { back: 'brick', wall: '#5A3428', roof: '#3E4250', post: '#4A3226', sign: 'smith', side: 1 },
    julian: { back: 'boards', wall: '#3E4A30', awn: ['#2E6A3E', '#E4DCC4'], sign: 'hunt', side: -1, lamp: 1 },
    dworkin: { back: 'plaster', wall: '#4A3A5A', awn: ['#4E2C6E', '#C9A050'], sign: 'trump', side: 1, lamp: -1 },
    ganelon: { back: 'boards', wall: '#3A4256', roof: '#3A3E4A', post: '#4E3A2A', sign: 'helm', side: 1, lamp: -1 },
    fiona: { back: 'plaster', wall: '#3E2E4E', awn: ['#4E2C6E', '#3E7A4A'], sign: 'flask', side: 1 },
    random: { back: 'boards', wall: '#5A3424', awn: ['#9A2A22', '#E0B050'], sign: 'dice', side: 1, lamp: 1 },
    llewella: { back: 'tile', wall: '#1E5A64', awn: ['#2A7A7A', '#E0ECF0'], sign: 'pearl', side: -1, post: '#6A5A4A' },
  };
  const LAMP = (id, hw) => { const o = SHOPS[id]; return o.lamp ? { x: o.lamp * (hw - 7 - 12), y: HEM + 16 } : null; };
  // a stall is painted in three parts: its floor (in its front frame), its back and its wares (in its back frame, set into the
  // wall), and its front (posts, awning, lantern, sign) with the depth between them
  // ---------------- a side wall's booth, built in the round ----------------
  // A side booth is drawn in an upright frame at its foot on the wall (one unit the stall's), in three measures: u along its wall
  // (toward the far end), h up from the floor (negative) and w out from the wall's face into the hall. So its posts stand plumb
  // on the page, its far side runs square out of the wall, and its awning reaches out over the floor from the stone above it.
  // We see a block's top, its side toward the near end and its face to the hall. What stands nearer us than the keeper (the
  // near post, the awning's top, hem and cheek, the lantern and the sign, and whatever stands before them) is in the front layer.
  const SQ = .12, SB = 15, SF = 74, SA0 = -242, SA1 = -226, SVAL = 14, SLH = -196, SCL = -112;
  let P3 = (u, h, w) => [u, h + w];
  // (uo: the booth itself stands a little toward the near end of its bay, its keeper toward its middle; the keeper's own
  // things, before and behind them, are placed from where the keeper stands, unshifted)
  const SUO = { SL1: -8, SL2: -20, SR1: -8, SR2: -10 };
  function side3(sl, booth) { const ax = sl.m.a / sl.s, by = sl.m.b / sl.s, d = sl.dir, uo = booth ? SUO[sl.id] || 0 : 0;
    P3 = (u, h, w) => [ax * (u + uo) + d * w, by * (u + uo) + h + SQ * w];
    const o = sl.m.transformPoint(new DOMPoint(0, 0)); return new DOMMatrix([sl.s, 0, 0, sl.s, o.x, o.y]); }
  const path3 = (ps) => { ctx.beginPath(); ps.forEach((q, i) => { const p = P3(q[0], q[1], q[2]); if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.closePath(); };
  const lin3 = (a, b, cols) => { const p = P3(a[0], a[1], a[2]), q = P3(b[0], b[1], b[2]), g = ctx.createLinearGradient(p[0], p[1], q[0], q[1]); cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c)); return g; };
  // a flat thing painted in the plane of the wall at a depth w (x along the wall, y up and down)
  const wallPlane = (w, fn) => { const o = P3(0, 0, w), e = P3(1, 0, w); ctx.save(); ctx.transform(e[0] - o[0], e[1] - o[1], 0, 1, o[0], o[1]); try { fn(); } finally { ctx.restore(); } };
  // a flat thing painted square out of the wall at a place u (x out into the hall, y up and down)
  const sidePlane = (u, fn) => { const o = P3(u, 0, 0), e = P3(u, 0, 1); ctx.save(); ctx.transform(e[0] - o[0], e[1] - o[1], 0, 1, o[0], o[1]); try { fn(); } finally { ctx.restore(); } };
  function box3(u0, u1, h0, h1, w0, w1, col, grain) { // a squared block (h0 its top): its near side, its top and its face to the hall
    path3([[u0, h0, w0], [u0, h0, w1], [u0, h1, w1], [u0, h1, w0]]); ctx.fillStyle = lin3([u0, 0, w0], [u0, 0, w1], [shade(col, -.62), shade(col, -.34)]); ctx.fill(); outline(.7);
    path3([[u0, h0, w0], [u1, h0, w0], [u1, h0, w1], [u0, h0, w1]]); ctx.fillStyle = shade(col, .2); ctx.fill(); outline(.6);
    path3([[u0, h0, w1], [u1, h0, w1], [u1, h1, w1], [u0, h1, w1]]); ctx.fillStyle = lin3([u0, 0, w1], [u1, 0, w1], [shade(col, .16), col, shade(col, -.32)]); ctx.fill();
    if (grain && h1 - h0 > 20) { ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(20,10,6,.35)'; ctx.lineWidth = .5; ctx.beginPath();
      for (let k = 1; k < 3; k++) { const a = P3(lerp(u0, u1, k / 3), h0 + 2, w1), b = P3(lerp(u0, u1, k / 3), h1 - 2, w1); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0] + hsh(u0 + k) - .5, b[1]); } ctx.stroke();
      ctx.strokeStyle = 'rgba(255,228,190,.22)'; ctx.lineWidth = .8; ctx.beginPath(); { const a = P3(u0 + .6, h0 + 1, w1), b = P3(u0 + .6, h1 - 1, w1); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } ctx.stroke(); ctx.restore(); }
    path3([[u0, h0, w1], [u1, h0, w1], [u1, h1, w1], [u0, h1, w1]]); outline(.8);
  }
  function cyl3(uc, wc, r, h0, h1, side, top) { // an upright round thing (h0 its top): its side, lit toward the hall, and its top
    const N = 28, T = [], B = []; for (let i = 0; i < N; i++) { const a = i / N * TAU; T.push(P3(uc + Math.cos(a) * r, h0, wc + Math.sin(a) * r)); B.push(P3(uc + Math.cos(a) * r, h1, wc + Math.sin(a) * r)); }
    let iL = 0, iR = 0; for (let i = 1; i < N; i++) { if (T[i][0] < T[iL][0]) iL = i; if (T[i][0] > T[iR][0]) iR = i; }
    const arc = (A, from, to) => { const out = []; for (let i = from; ; i = (i + 1) % N) { out.push(A[i]); if (i === to) break; } return out; };
    let a1 = arc(T, iL, iR), a2 = arc(T, iR, iL); const my = (A) => A.reduce((s, p) => s + p[1], 0) / A.length;
    const lowT = my(a1) > my(a2) ? a1 : a2.slice().reverse(), lowB = (my(a1) > my(a2) ? arc(B, iL, iR) : arc(B, iR, iL).reverse());
    if (h1 > h0) { ctx.beginPath(); lowT.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); for (let i = lowB.length - 1; i >= 0; i--) ctx.lineTo(lowB[i][0], lowB[i][1]); ctx.closePath();
      const g = ctx.createLinearGradient(T[iL][0], 0, T[iR][0], 0); g.addColorStop(0, shade(side, -.4)); g.addColorStop(.6, side); g.addColorStop(1, shade(side, .18)); ctx.fillStyle = g; ctx.fill(); outline(.6); }
    if (top) { ctx.beginPath(); T.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fillStyle = top; ctx.fill(); outline(.5); }
    return T;
  }
  function sideFloor(hw) { // the booth's boards, from its back out to its sill, gone dark toward the wall; its shade on the hall's floor
    const x0 = -hw, x1 = hw, W = SF + 6;
    path3([[x0, 8, W + 2], [x1, 8, W + 2], [x1, 8, W + 24], [x0, 8, W + 24]]); ctx.fillStyle = lin3([0, 8, W], [0, 8, W + 24], ['rgba(6,3,3,.5)', 'rgba(6,3,3,0)']); ctx.fill();
    path3([[x0, 0, -SB], [x1, 0, -SB], [x1, 0, W], [x0, 0, W]]); ctx.fillStyle = lin3([0, 0, -SB], [0, 0, W], ['#140C0A', '#2A1E18', '#3A2A20']); ctx.fill();
    ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = .7; ctx.beginPath();
    for (let u = x0 + 11; u < x1; u += 11) { const a = P3(u, 0, -SB), b = P3(u, 0, W); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } ctx.stroke();
    ctx.strokeStyle = 'rgba(255,220,180,.07)'; ctx.beginPath(); for (let u = x0 + 12; u < x1; u += 11) { const a = P3(u, 0, -SB), b = P3(u, 0, W); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } ctx.stroke();
    // (the awning's shade, deepest along the wall)
    path3([[x0, 0, -SB], [x1, 0, -SB], [x1, 0, W], [x0, 0, W]]); ctx.fillStyle = lin3([0, 0, 0], [0, 0, W], ['rgba(6,3,3,.5)', 'rgba(6,3,3,.12)']); ctx.fill(); ctx.restore();
    path3([[x0, 0, -SB], [x1, 0, -SB], [x1, 0, W], [x0, 0, W]]); outline(.7);
    box3(x0, x1, -3, 1, W - 4, W, '#4A3424', false); // (its sill)
  }
  function sideInner(hw, o, closed) { // behind the keeper: the shade the awning throws on the wall, the far side of the booth seen from within, the far post
    const pc = o.post || '#5A3A24', U = hw - 2;
    path3([[-hw - 6, SA0 - 2, 0], [hw + 6, SA0 - 2, 0], [hw + 6, AWN + 4, 0], [-hw - 6, AWN + 4, 0]]); ctx.fillStyle = lin3([0, SA0, 0], [0, AWN + 4, 0], ['rgba(6,3,3,.82)', 'rgba(6,3,3,.45)']); ctx.fill();
    // (the lintel over the opening in the wall)
    box3(-hw + 4, hw - 4, AWN - 8, AWN + 3, -3, 2, shade(pc, -.1), true);
    // the far side: a low boarded side square out of the wall (kept low, so the next booth along is seen over it), its rail lit
    { const ph = -48, pts = [[U, 0, -SB], [U, ph, -SB], [U, ph, SF - 6], [U, 0, SF - 6]];
      path3(pts); ctx.fillStyle = lin3([U, 0, -SB], [U, 0, SF], [shade(pc, -.72), shade(pc, -.45), shade(pc, -.18)]); ctx.fill();
      ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = .8; ctx.beginPath(); for (let w = -SB + 9; w < SF; w += 9) { const a = P3(U, 0, w), b = P3(U, ph, w); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } ctx.stroke();
      ctx.strokeStyle = 'rgba(255,220,180,.08)'; ctx.beginPath(); for (let w = -SB + 10; w < SF; w += 9) { const a = P3(U, 0, w), b = P3(U, ph, w); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } ctx.stroke(); ctx.restore();
      path3(pts); outline(.8);
      box3(U - 3, U + 3, ph - 4, ph, -SB, SF - 6, shade(pc, .05), false); }
    const pu = hw - 7; box3(pu - 7, pu + 7, -11, 1, SF - 12, SF + 2, '#5E5046', false);
    box3(pu - 5, pu + 5, (closed ? SCL : SA1) + 6, -10, SF - 10, SF, pc, true);
  }
  function sideAwning(hw, cols) { // the awning: its top running out and down from the wall, its scalloped hem along the front, the near cheek
    const u0 = -hw - 4, u1 = hw + 4, W1 = SF + 4, n = Math.max(6, Math.round((u1 - u0) / 14));
    // (a batten along the wall where it is fixed)
    box3(u0 - 2, u1 + 2, SA0 - 6, SA0 + 1, -2, 3, '#3A2A1E', false);
    for (let i = 0; i < n; i++) { const a = lerp(u0, u1, i / n), b = lerp(u0, u1, (i + 1) / n), c = cols[i % 2];
      path3([[a, SA0, 0], [b, SA0, 0], [b, SA1, W1], [a, SA1, W1]]); ctx.fillStyle = lin3([0, SA0, 0], [0, SA1, W1], [shade(c, -.42), shade(c, -.1), shade(c, .12)]); ctx.fill(); }
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = .6; ctx.beginPath();
    for (let i = 0; i <= n; i++) { const a = P3(lerp(u0, u1, i / n), SA0, 0), b = P3(lerp(u0, u1, i / n), SA1, W1); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } ctx.stroke();
    ctx.strokeStyle = 'rgba(255,240,215,.18)'; ctx.lineWidth = .8; ctx.beginPath(); { const a = P3(u0, SA1 + 6 - (SA1 - SA0) * .12, W1 * .88), b = P3(u1, SA1 + 6 - (SA1 - SA0) * .12, W1 * .88); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } ctx.stroke();
    path3([[u0, SA0, 0], [u1, SA0, 0], [u1, SA1, W1], [u0, SA1, W1]]); outline(.9);
    // the hem along the front, hung from the awning's edge
    wallPlane(W1, () => { const sw = (u1 - u0) / n, strip = (i) => { const a = u0 + i * sw; ctx.beginPath(); ctx.moveTo(a, SA1); ctx.lineTo(a + sw, SA1); ctx.lineTo(a + sw, SA1 + SVAL - sw / 2); ctx.arc(a + sw / 2, SA1 + SVAL - sw / 2, sw / 2, 0, Math.PI); ctx.closePath(); };
      ctx.fillStyle = 'rgba(6,3,3,.3)'; ctx.fillRect(u0, SA1 + SVAL - 4, u1 - u0, 10);
      for (let i = 0; i < n; i++) { strip(i); ctx.fillStyle = cols[i % 2]; ctx.fill(); }
      const g = ctx.createLinearGradient(0, SA1, 0, SA1 + SVAL); g.addColorStop(0, 'rgba(255,240,210,.22)'); g.addColorStop(.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.3)');
      for (let i = 0; i < n; i++) { strip(i); ctx.fillStyle = g; ctx.fill(); outline(.7); }
      ctx.strokeStyle = 'rgba(255,230,170,.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(u0 + 1, SA1 + 2); ctx.lineTo(u1 - 1, SA1 + 2); ctx.stroke(); });
    // the near cheek, a flap of the cloth from the wall down to the hem
    sidePlane(u0, () => { ctx.beginPath(); ctx.moveTo(0, SA0); ctx.lineTo(W1, SA1); ctx.lineTo(W1, SA1 + SVAL); ctx.quadraticCurveTo(W1 * .45, SA1 + SVAL - 6, 0, SA0 + 16); ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, W1, 0); g.addColorStop(0, shade(cols[0], -.55)); g.addColorStop(1, shade(cols[0], -.18)); ctx.fillStyle = g; ctx.fill(); outline(.8);
      ctx.strokeStyle = cols[1]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W1, SA1 + SVAL - 1); ctx.quadraticCurveTo(W1 * .45, SA1 + SVAL - 7, 0, SA0 + 15); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = .6; ctx.beginPath(); for (const f of [.3, .6]) { ctx.moveTo(W1 * f, lerp(SA0, SA1, f) + 2); ctx.lineTo(W1 * f, lerp(SA0 + 16, SA1 + SVAL, f) - 3); } ctx.stroke(); });
  }
  function sideFurled(hw) { // an empty booth: a chain slung low across its front between the posts, a board on it, the awning taken down
    const W1 = SF - 5, pts = []; for (let i = 0; i <= 16; i++) { const f = i / 16; pts.push(P3(lerp(-hw + 7, hw - 7, f), -58 + Math.sin(f * Math.PI) * 14, W1)); }
    ctx.strokeStyle = iron; ctx.lineWidth = 1.6; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
    ctx.strokeStyle = ironL; ctx.lineWidth = .6; ctx.setLineDash([1.4, 1.6]); ctx.stroke(); ctx.setLineDash([]);
    const c = pts[8]; ctx.fillStyle = '#3E2A1C'; rrect(c[0] - 13, c[1] + 2, 26, 15, 2); ctx.fill(); outline(.9);
    ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(c[0] - 11, c[1] + 9); ctx.lineTo(c[0] + 11, c[1] + 9.6); ctx.stroke();
    ctx.strokeStyle = iron; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(c[0] - 8, c[1] + 2); ctx.lineTo(c[0] - 3, c[1] - 1); ctx.moveTo(c[0] + 8, c[1] + 2); ctx.lineTo(c[0] + 3, c[1] - 1); ctx.stroke();
  }
  const lamp3 = (lx) => P3(lx, SLH, SF - 8); // where a side booth's lantern hangs (its light is live, liveBack)
  function sideFront(sl, id) { // in the front layer: the near post, the awning (or its rafters, rolled), the lantern and the sign
    const hw = sl.hw, o = id ? SHOPS[id] : { post: '#4A3020' }, pc = o.post || '#5A3A24', pu = -hw + 7;
    if (!id) { box3(pu - 7, pu + 7, -11, 1, SF - 12, SF + 2, '#5E5046', false); box3(pu - 5, pu + 5, SCL + 6, -10, SF - 10, SF, pc, true); }
    else { // (a keeper's booth has no post at its near corner, to stand clear of the keeper: a brace out of the wall carries the awning there)
      const bu = -hw + 1, W = SF - 2, h0 = -138, h1 = SA1 + 4, t = 8;
      box3(bu, bu + 7, h0 - 5, h0 + 12, -1, 2, '#4A423C', false);
      path3([[bu, h0, 0], [bu + 7, h0, 0], [bu + 7, h1, W], [bu, h1, W]]); ctx.fillStyle = shade(pc, .2); ctx.fill(); outline(.6);
      path3([[bu, h0, 0], [bu, h1, W], [bu, h1 + t, W], [bu, h0 + t, 0]]); ctx.fillStyle = lin3([bu, 0, 0], [bu, 0, W], [shade(pc, -.45), shade(pc, -.1)]); ctx.fill(); outline(.7);
      ctx.fillStyle = ironL; for (const f of [.15, .85]) { const q = P3(bu, lerp(h0, h1, f) + t / 2, W * f); circle(q[0], q[1], .9); ctx.fill(); } }
    if (id && o.awn) sideAwning(hw, o.awn); else sideFurled(hw);
    if (o.lamp) { const lx = o.lamp * (hw - 19), p = lamp3(lx), top = P3(lx, SA1 + 4, SF - 8);
      ctx.strokeStyle = iron; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(p[0], p[1] - 8); ctx.stroke();
      ctx.save(); ctx.translate(p[0], p[1] - HEM - 16); lantern(0, true); ctx.restore(); }
    if (id && o.sign) { const su = -(hw - 18), a = P3(su - 8, SA1 + SVAL - 6, SF + 4), b = P3(su + 8, SA1 + SVAL - 6, SF + 4), c = P3(su, SA1 + SVAL + 12, SF + 4);
      // (a board on two chains from the awning's edge, its mark painted on it)
      const w = 28, h = 21, y = c[1] - 4; ctx.strokeStyle = iron; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0] - 9, y); ctx.moveTo(b[0], b[1]); ctx.lineTo(c[0] + 9, y); ctx.stroke();
      const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#6E4A2E'); g.addColorStop(1, '#3E2818'); ctx.fillStyle = g; rrect(c[0] - w / 2, y, w, h, 3); ctx.fill(); outline(1);
      ctx.strokeStyle = '#C9A050'; ctx.lineWidth = 1; rrect(c[0] - w / 2 + 2.2, y + 2.2, w - 4.4, h - 4.4, 2); ctx.stroke();
      ctx.save(); ctx.translate(c[0], y + h / 2); SIGNS[o.sign](); ctx.restore(); }
  }
  // what stands before (FRONT3) or behind (BEHIND3) a side wall's keeper, in the booth's upright frame
  const FRONT3 = {
    fiona() { fionaTable(); },
    random() { // his gaming table, between him and the hall: green baize, a hand of cards, the dice and their cup, stacked coin
      const uc = -47, wc = 54, U0 = uc - 14, U1 = uc + 14, W0 = wc - 11, W1 = wc + 11, top = -54, th = 5, wood = '#5A3220';
      { const p = P3(uc, 0, wc + 6); ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(1, .3); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 34); g.addColorStop(0, 'rgba(6,3,3,.5)'); g.addColorStop(1, 'rgba(6,3,3,0)'); ctx.fillStyle = g; ctx.fillRect(-40, -40, 80, 80); ctx.restore(); }
      for (const [lu, lw] of [[U1 - 4, W0 + 1], [U0 + 1, W0 + 1], [U1 - 4, W1 - 4], [U0 + 1, W1 - 4]]) box3(lu, lu + 3, top + th, 0, lw, lw + 3, '#2E1C12', false);
      // (its apron under the top, and the top itself, its edge in gold)
      box3(U0 + 1, U1 - 1, top + th, top + th + 7, W0 + 1, W1 - 1, shade(wood, -.08), false);
      box3(U0, U1, top, top + th, W0, W1, wood, false);
      { const a = P3(U0, top + 2.5, W1), b = P3(U1, top + 2.5, W1); ctx.strokeStyle = '#E0B050'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      path3([[U0 + 2, top, W0 + 2], [U1 - 2, top, W0 + 2], [U1 - 2, top, W1 - 2], [U0 + 2, top, W1 - 2]]); ctx.fillStyle = lin3([U0, top, W0], [U1, top, W1], ['#174A30', '#1E6A40', '#1A5A38']); ctx.fill();
      ctx.strokeStyle = 'rgba(224,176,80,.7)'; ctx.lineWidth = .6; ctx.stroke();
      // a hand of cards fanned face up on the baize, and the pack beside it
      const card = (cu, cw, rot, face) => { const c = Math.cos(rot), s = Math.sin(rot), hu = 3.4, hwd = 5; const q = [[-hu, -hwd], [hu, -hwd], [hu, hwd], [-hu, hwd]].map(([a, b]) => [cu + a * c - b * s, top - .4, cw + a * s + b * c]);
        path3(q); ctx.fillStyle = face ? '#F0E6D0' : '#7A1E18'; ctx.fill(); outline(.4);
        if (face) { const p = P3(cu, top - .4, cw); ctx.fillStyle = face; ell(p[0], p[1], 1.3, .9); ctx.fill(); } else { path3(q.map(([a, , b]) => [lerp(a, cu, .3), top - .5, lerp(b, cw, .3)])); ctx.strokeStyle = '#E0B050'; ctx.lineWidth = .4; ctx.stroke(); } };
      card(uc - 9, wc - 4, .2, 0); card(uc - 8.6, wc - 4.4, .2, 0);
      for (let k = 0; k < 4; k++) card(uc - 1 + k * 2.6, wc + 2 + k * .4, -.5 + k * .3, k % 2 ? '#B82A2A' : '#1A1418');
      // coin stacked, gold
      for (const [cu, cw, n] of [[uc + 10, wc - 5, 4], [uc + 13, wc + 1, 2], [uc + 7, wc - 1, 3]]) for (let j = 0; j < n; j++) cyl3(cu, cw, 2.6, top - 1.3 * (j + 1), top - 1.3 * j, '#B8862E', '#E8C060');
      // the dice, and their cup tipped on its side
      for (const [du, dw] of [[uc - 10, wc + 6], [uc - 5, wc + 8]]) { box3(du, du + 3.6, top - 3.6, top, dw, dw + 3.6, '#E8DCC4', false); const p = P3(du + 1.8, top - 3.6, dw + 1.8); ctx.fillStyle = '#B82A2A'; circle(p[0], p[1], .7); ctx.fill(); }
      { const p = P3(uc - 13, top - 3, wc - 7); ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(-.35); ctx.fillStyle = '#4A2A1A'; rrect(-5, -3.2, 9, 6.4, 1.6); ctx.fill(); outline(.5); ctx.fillStyle = '#1A0E0A'; ell(4, 0, 1.4, 3); ctx.fill(); ctx.strokeStyle = '#E0B050'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(-2, -3); ctx.lineTo(-2, 3); ctx.stroke(); ctx.restore(); }
    },
  };
  function cursedBlade(bu, bw) { // a cursed blade stood point-down in its block, the runes along it burning
    const base = '#2A2026';
    { const p = P3(bu, 0, bw); ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(1, .3); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 20); g.addColorStop(0, 'rgba(6,3,3,.5)'); g.addColorStop(1, 'rgba(6,3,3,0)'); ctx.fillStyle = g; ctx.fillRect(-24, -24, 48, 48); ctx.restore(); }
    box3(bu - 7, bu + 7, -9, 0, bw - 6, bw + 6, base, false);
    box3(bu - 5, bu + 5, -13, -9, bw - 4, bw + 4, shade(base, .1), false);
    const f = P3(bu, -13, bw), t = P3(bu, -72, bw);
    glowR(t[0], (f[1] + t[1]) / 2, 34, '170,90,255', .28);
    ctx.fillStyle = '#2E2638'; ctx.beginPath(); ctx.moveTo(f[0] - .6, f[1] + 2); ctx.lineTo(f[0] - 3.2, f[1] - 8); ctx.lineTo(t[0] - 3, t[1]); ctx.lineTo(t[0] + 3, t[1]); ctx.lineTo(f[0] + 3.2, f[1] - 8); ctx.lineTo(f[0] + .6, f[1] + 2); ctx.closePath(); ctx.fill(); outline(.7);
    ctx.fillStyle = 'rgba(200,160,255,.35)'; ctx.fillRect(t[0] - .4, t[1] + 2, .8, f[1] - t[1] - 10);
    ctx.fillStyle = '#C88AFF'; for (let k = 0; k < 5; k++) { const y = t[1] + 8 + k * 8.5; ctx.fillRect(t[0] - 1.4, y, 2.8, 1); ctx.fillRect(t[0] - .5, y - 1.6, 1, 4); }
    const cy = t[1]; ctx.fillStyle = '#3A2E40'; ctx.beginPath(); ctx.moveTo(t[0] - 11, cy + 1); ctx.quadraticCurveTo(t[0], cy - 3, t[0] + 11, cy + 1); ctx.lineTo(t[0] + 11, cy - 2); ctx.quadraticCurveTo(t[0], cy - 6, t[0] - 11, cy - 2); ctx.closePath(); ctx.fill(); outline(.6);
    ctx.fillStyle = '#3E7A4A'; ctx.fillRect(t[0] - 1.6, cy - 15, 3.2, 11); ctx.beginPath(); ctx.rect(t[0] - 1.6, cy - 15, 3.2, 11); outline(.5);
    ctx.strokeStyle = '#D8C080'; ctx.lineWidth = .5; ctx.beginPath(); for (let y = cy - 13; y < cy - 5; y += 2) { ctx.moveTo(t[0] - 1.6, y); ctx.lineTo(t[0] + 1.6, y + 1); } ctx.stroke();
    ctx.fillStyle = '#7A3AB8'; circle(t[0], cy - 17, 2.6); ctx.fill(); outline(.5); ctx.fillStyle = 'rgba(255,255,255,.6)'; circle(t[0] - .8, cy - 17.8, .8); ctx.fill();
    // (a chain wound round the block, and a tag on it)
    ctx.strokeStyle = '#6A6470'; ctx.lineWidth = 1; ctx.beginPath(); { const a = P3(bu - 7, -5, bw + 6), b = P3(bu + 7, -4, bw + 6); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo((a[0] + b[0]) / 2, a[1] + 3, b[0], b[1]); } ctx.stroke();
    }
  function fionaTable() { // before her, on the hall side: a little round table under a cloth, her scrying bowl on it, a black candle, a skull and her book of hexes
    const uc = FIONA_TABLE.u, wc = FIONA_TABLE.w, r = 12, top = -50;
    { const p = P3(uc, 0, wc); ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(1, .32); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 22); g.addColorStop(0, 'rgba(6,3,3,.5)'); g.addColorStop(1, 'rgba(6,3,3,0)'); ctx.fillStyle = g; ctx.fillRect(-26, -26, 52, 52); ctx.restore(); }
    cyl3(uc, wc, r + 1, top + 4, -2, '#3E2456', null);
    const T = cyl3(uc, wc, r, top, top + 4, '#4E2C6E', '#5A3480');
    // (the cloth's green fringe at the hem)
    { const N = 14; ctx.strokeStyle = '#3E7A4A'; ctx.lineWidth = 1.4; ctx.beginPath(); for (let i = 0; i <= N; i++) { const a = Math.PI * .12 + i / N * Math.PI * .76, p = P3(uc + Math.cos(a) * (r + 1), -3, wc + Math.sin(a) * (r + 1)); ctx.moveTo(p[0], p[1] - 3); ctx.lineTo(p[0], p[1] + 1); } ctx.stroke(); }
    void T;
    // the bowl, bronze, its water
    cyl3(uc + 2, wc - 2, 6, top - 5, top, '#7A5A2E', '#2A3A30');
    { const p = P3(uc + 2, top - 5, wc - 2); ctx.fillStyle = 'rgba(120,255,190,.55)'; ell(p[0], p[1] - .2, 4.4, 2.2); ctx.fill(); ctx.fillStyle = 'rgba(220,190,255,.6)'; ell(p[0] - 1.2, p[1] - .6, 1.6, .6); ctx.fill(); }
    // the black candle (its flame is live, liveBack), a skull, the book
    { const c = FIONA_TABLE.candle; cyl3(uc + c[0], wc + c[1], 1.8, top - 14, top, '#1A141E', '#2A2230'); }
    { const p = P3(uc - 7, top, wc + 5); ctx.fillStyle = '#E8E0D0'; ell(p[0], p[1] - 3.4, 3.4, 3.2); ctx.fill(); outline(.5); ctx.fillRect(p[0] - 2, p[1] - 1.4, 4, 2); ctx.fillStyle = '#1A1418'; circle(p[0] - 1.2, p[1] - 3.4, .8); circle(p[0] + 1.2, p[1] - 3.4, .8); ctx.fill(); }
    box3(uc - 4, uc + 5, top - 2.6, top, wc + 3, wc + 9, '#3E7A4A', false);
    { const p = P3(uc + .5, top - 2.6, wc + 6); ctx.fillStyle = '#D8C080'; circle(p[0], p[1], .9); ctx.fill(); }
    }
  const BEHIND3 = { fiona() { cursedBlade(FIONA_TABLE.bu, FIONA_TABLE.bw); } };
  const FIONA_TABLE = { u: -30, w: 64, candle: [-5, -6], bu: 20, bw: 16 };
  function sideStall(sl, id) {
    const hw = sl.hw, U = side3(sl, 1), uo = SUO[sl.id] || 0;
    DV = sl.dv;
    withM(U, () => sideFloor(hw));
    withM(sl.mb.translate(uo, 0), () => { wallHalo(hw - 4); if (id) boothBack(hw - 7, SHOPS[id].back, SHOPS[id].wall); else closedBack(hw); });
    if (id) withM(sl.mw.translate(uo, 0), () => WARES[id](hw - 7));
    side3(sl, 1); withM(U, () => sideInner(hw, id ? SHOPS[id] : { post: '#4A3020' }, !id));
    side3(sl); if (id && BEHIND3[id]) withM(U, () => BEHIND3[id](sl));
  }
  function stall(sl, id) {
    if (sl.kind !== 'back') return sideStall(sl, id);
    DV = sl.dv;
    withM(sl.mf, () => boothFloor(sl.hw));
    withM(sl.mb, () => { wallHalo(sl.hw - 4); if (id) boothBack(sl.hw - 7, SHOPS[id].back, SHOPS[id].wall); else closedBack(sl.hw); });
    if (id) withM(sl.mw, () => WARES[id](sl.hw - 7));
    withM(sl.mf, () => { if (id) shopFront(id, sl.hw); else closedFront(sl.hw); });
  }
  function shopFront(id, hw) {
    const o = SHOPS[id], iw = hw - 7;
    boothFrame(hw, o);
    if (o.lamp) lantern(LAMP(id, hw).x, true);
    if (o.sign) hangSign(o.side * (hw - 6), o.side * (iw - 17), o.sign);
  }
  function closedBack(hw) { // an empty bay: the booth shuttered, the awning rolled up, the sign turned to the wall, the lantern out
    const iw = hw - 7;
    boothBack(iw, 'boards', '#3A2A20');
    ctx.fillStyle = '#3A2418'; ctx.fillRect(-iw, -156, iw * 2, 156);
    for (let x = -iw, k = 0; x < iw; x += 11, k++) { ctx.fillStyle = `rgba(${hsh(k + 40) > .5 ? '255,230,190' : '0,0,0'},${.04 + hsh(k + 41) * .07})`; ctx.fillRect(x, -156, 11, 156); ctx.strokeStyle = 'rgba(10,6,4,.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, -156); ctx.lineTo(x, 0); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(10,6,4,.8)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, -156); ctx.lineTo(0, 0); ctx.stroke();
    for (const y of [-140, -22]) { ctx.fillStyle = iron; ctx.fillRect(-iw, y - 2, iw * 2, 4); ctx.fillStyle = ironL; for (let x = -iw + 6; x < iw; x += 14) { circle(x, y, .9); ctx.fill(); } }
    timber(-iw - 2, -84, iw * 2 + 4, 6, '#4A3020', true);
    ctx.fillStyle = '#6A5A3A'; rrect(-4, -82, 8, 9, 1.5); ctx.fill(); outline(.6); ctx.strokeStyle = '#6A5A3A'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, -82, 3, Math.PI, 0); ctx.stroke();
  }
  function closedFront(hw) {
    const iw = hw - 7;
    boothFrame(hw, { post: '#4A3020' });
    ctx.fillStyle = '#5A4A3A'; rrect(-hw + 4, AWN + 2, hw * 2 - 8, 9, 4.5); ctx.fill(); outline(.8);
    ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = .6; ctx.beginPath(); for (let x = -hw + 12; x < hw - 6; x += 9) { ctx.moveTo(x, AWN + 3); ctx.lineTo(x + 3, AWN + 10); } ctx.stroke();
    ctx.strokeStyle = '#2A1E14'; ctx.lineWidth = 1.2; ctx.beginPath(); for (const x of [-hw + 18, hw - 18]) { ctx.moveTo(x, AWN + 1); ctx.lineTo(x, AWN + 12); } ctx.stroke();
    const sx = hw - 6 - 23, sy = AWN + 30; ctx.strokeStyle = iron; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(hw - 6, sy - 6); ctx.lineTo(sx - 13, sy - 6); ctx.stroke();
    ctx.save(); ctx.translate(sx, sy - 6); ctx.rotate(.18); ctx.strokeStyle = iron; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-10, 6); ctx.moveTo(10, 0); ctx.lineTo(10, 6); ctx.stroke();
    ctx.fillStyle = '#3E2A1C'; rrect(-15, 6, 30, 23, 3); ctx.fill(); outline(1); ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(-13, 13); ctx.lineTo(13, 13); ctx.moveTo(-13, 21); ctx.lineTo(13, 21); ctx.stroke(); ctx.restore();
    lantern(-(iw - 12), false);
  }
  function sword(x, y, len, hilt, rot) { // a blade hung point down (or at an angle), its cross and grip
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
    const g = ctx.createLinearGradient(-2, 0, 2, 0); g.addColorStop(0, '#E8ECF2'); g.addColorStop(.5, '#A8B0BC'); g.addColorStop(1, '#6A707C');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(2, 0); ctx.lineTo(1.6, len - 4); ctx.lineTo(0, len); ctx.lineTo(-1.6, len - 4); ctx.closePath(); ctx.fill(); outline(.6);
    ctx.fillStyle = hilt || '#D8AA55'; ctx.fillRect(-6, -2.4, 12, 2.6); ctx.beginPath(); ctx.rect(-6, -2.4, 12, 2.6); outline(.5);
    ctx.fillStyle = '#3A2418'; ctx.fillRect(-1.3, -11, 2.6, 8.6); ctx.fillStyle = hilt || '#D8AA55'; circle(0, -12.4, 2); ctx.fill(); outline(.5);
    ctx.restore();
  }
  function helmAt(x, y, kind) { // a helm: a nasal helm, or a great helm with its slit
    ctx.fillStyle = kind ? '#8A9098' : '#A6AAB2';
    if (kind) { ctx.beginPath(); ctx.moveTo(x - 9, y + 10); ctx.lineTo(x - 9, y - 6); ctx.quadraticCurveTo(x, y - 12, x + 9, y - 6); ctx.lineTo(x + 9, y + 10); ctx.closePath(); ctx.fill(); outline(.8); ctx.fillStyle = '#141018'; ctx.fillRect(x - 7, y - 1, 14, 2); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x + 3, y - 6, 2, 15); }
    else { ctx.beginPath(); ctx.arc(x, y + 2, 8.6, Math.PI, 0); ctx.lineTo(x + 9.4, y + 5); ctx.lineTo(x - 9.4, y + 5); ctx.closePath(); ctx.fill(); outline(.8); ctx.fillRect(x - 1, y + 2, 2, 9); ctx.fillStyle = 'rgba(255,255,255,.4)'; ell(x + 3, y - 2, 2.4, 1.4); ctx.fill(); }
  }
  // the wares on each booth's back, in the stall's frame (iw: the booth's inner half-width)
  const WARES = {
    gerard(iw) { // the forge: a hearth of brick behind him, its fire-bed waist high under a hood of black iron and its flue; blades racked either side
      for (const sd of [-1, 1]) { const rx = sd * (iw - 11);
        timber(rx - 12, -150, 24, 4, '#4A3226', true);
        for (let k = 0; k < 3; k++) { const x = rx - 8 + k * 8; if (sd > 0 && k === 1) { ctx.fillStyle = '#5A3A22'; ctx.fillRect(x - 1.2, -148, 2.4, 92); ctx.fillStyle = '#9AA2B0'; ctx.beginPath(); ctx.moveTo(x + 1, -146); ctx.quadraticCurveTo(x + 9, -144, x + 10, -134); ctx.quadraticCurveTo(x + 6, -136, x + 1, -132); ctx.closePath(); ctx.fill(); outline(.6); }
          else sword(x, -134, 64 - (k % 2) * 8, k === 2 ? '#B8BCC6' : '#D8AA55'); } }
      ctx.fillStyle = '#4A2A20'; ctx.fillRect(-36, -58, 72, 58);
      ctx.save(); ctx.beginPath(); ctx.rect(-36, -58, 72, 58); ctx.clip();
      for (let r = 0, y = -8; y > -66; r++, y -= 8) for (let x = -44 + (r % 2) * 8; x < 36; x += 16) { ctx.fillStyle = hsh(x * .7 + r * 3.1) > .3 ? '#5A3224' : '#4E2C20'; ctx.fillRect(x + .5, y + .5, 15, 7); }
      ctx.restore(); ctx.beginPath(); ctx.rect(-36, -58, 72, 58); outline(1);
      ctx.fillStyle = '#120806'; ctx.beginPath(); ctx.moveTo(-18, -4); ctx.lineTo(-18, -26); ctx.quadraticCurveTo(0, -42, 18, -26); ctx.lineTo(18, -4); ctx.closePath(); ctx.fill();
      const cg = ctx.createLinearGradient(0, -30, 0, -4); cg.addColorStop(0, 'rgba(255,120,40,.15)'); cg.addColorStop(1, 'rgba(255,138,48,.9)'); ctx.fillStyle = cg; ctx.fillRect(-16, -22, 32, 18);
      timber(-40, -64, 80, 7, '#5E4A3C', true);
      ctx.fillStyle = '#1A0E0A'; ctx.fillRect(-32, -70, 64, 6);
      for (let k = 0; k < 13; k++) { ctx.fillStyle = k % 3 ? '#FFB060' : '#C2401A'; circle(-29 + k * 4.8, -69 - hsh(k + 30) * 2.4, 2.4); ctx.fill(); }
      ctx.fillStyle = iron; ctx.beginPath(); ctx.moveTo(-44, -76); ctx.lineTo(44, -76); ctx.lineTo(15, -124); ctx.lineTo(15, AWN); ctx.lineTo(-15, AWN); ctx.lineTo(-15, -124); ctx.closePath(); ctx.fill(); outline(1.1);
      ctx.strokeStyle = ironL; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-40, -79); ctx.lineTo(40, -79); ctx.moveTo(-12, -128); ctx.lineTo(-12, AWN + 2); ctx.stroke();
      ctx.fillStyle = ironL; for (let k = 0; k < 7; k++) { circle(-36 + k * 12, -78.5, .9); ctx.fill(); }
      const hg = ctx.createLinearGradient(0, -100, 0, -76); hg.addColorStop(0, 'rgba(255,120,50,0)'); hg.addColorStop(1, 'rgba(255,120,50,.28)'); ctx.fillStyle = hg; ctx.beginPath(); ctx.moveTo(-44, -76); ctx.lineTo(44, -76); ctx.lineTo(30, -100); ctx.lineTo(-30, -100); ctx.closePath(); ctx.fill();
      // the bellows, hung by the hearth
      ctx.fillStyle = '#6A4426'; ctx.beginPath(); ctx.moveTo(-iw + 2, -68); ctx.lineTo(-iw + 18, -62); ctx.lineTo(-iw + 18, -54); ctx.lineTo(-iw + 2, -48); ctx.closePath(); ctx.fill(); outline(.7); ctx.fillStyle = '#4A3226'; ctx.fillRect(-iw + 18, -60, 6, 4);
    },
    julian(iw) { // the huntsman's booth: longbows racked, quivers on their pegs, a stag's antlers over him, fletching on the bench
      counter(-iw + 2, iw - 2, -40, '#5A3A22');
      ctx.strokeStyle = '#4A3018'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 9; k++) { const y = -46 - (k % 3) * 1.6; ctx.moveTo(-iw + 8 + k * 2, y); ctx.lineTo(-iw + 30 + k * 2, y - 1); } ctx.stroke();
      for (let k = 0; k < 6; k++) { ctx.fillStyle = ['#E8E0C8', '#B83A2A', '#8A8A8A'][k % 3]; ell(iw - 26 + k * 3.4, -46, 1.6, 3.4, .5); ctx.fill(); }
      for (let k = 0; k < 3; k++) { const bx = -iw + 9 + k * 9; ctx.strokeStyle = '#6A4626'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(bx, -120); ctx.quadraticCurveTo(bx + 10, -88, bx, -56); ctx.stroke(); ctx.strokeStyle = '#E8E0C8'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(bx, -120); ctx.lineTo(bx, -56); ctx.stroke(); ctx.fillStyle = '#3A2418'; ctx.fillRect(bx + 4.4, -91, 3, 6); }
      timber(-iw + 4, -124, 28, 3.4, '#4A3226', true);
      for (const [qx, r] of [[iw - 24, -.12], [iw - 10, .1]]) { ctx.save(); ctx.translate(qx, -104); ctx.rotate(r);
        ctx.strokeStyle = '#E8E0C8'; ctx.lineWidth = .7; ctx.beginPath(); for (let a = 0; a < 5; a++) { ctx.moveTo(-3 + a * 1.6, -2); ctx.lineTo(-3.6 + a * 1.8, -10); } ctx.stroke();
        for (let a = 0; a < 5; a++) { ctx.fillStyle = a % 2 ? '#B83A2A' : '#E8E0C8'; ell(-3.6 + a * 1.8, -10, 1, 2.4); ctx.fill(); }
        ctx.fillStyle = '#5A3A20'; rrect(-5, -2, 10, 34, 2.4); ctx.fill(); outline(.7); ctx.fillStyle = '#3A7A4A'; ctx.fillRect(-5, 4, 10, 2); ctx.fillRect(-5, 24, 10, 2); ctx.restore();
        ctx.fillStyle = '#2A1E14'; circle(qx, -108, 1.4); ctx.fill(); }
      ctx.fillStyle = '#4A3222'; ctx.beginPath(); ctx.moveTo(-9, -146); ctx.lineTo(9, -146); ctx.lineTo(7, -134); ctx.quadraticCurveTo(0, -128, -7, -134); ctx.closePath(); ctx.fill(); outline(.7);
      ctx.strokeStyle = '#D8C8A8'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 4, -142); ctx.quadraticCurveTo(sd * 18, -148, sd * 28, -168); ctx.moveTo(sd * 13, -147); ctx.lineTo(sd * 12, -160); ctx.moveTo(sd * 20, -154); ctx.lineTo(sd * 30, -156); ctx.moveTo(sd * 24, -160); ctx.lineTo(sd * 22, -170); ctx.stroke(); }
      ctx.lineCap = 'butt'; ctx.fillStyle = '#6A4A30'; ell(0, -140, 5, 4.4); ctx.fill(); outline(.6);
    },
    dworkin(iw) { // the draughtsman's corner: shelves of inks and old books, Pattern sketches pinned up, a Trump half-drawn on its easel
      const sx0 = 18, sx1 = iw - 1;
      ctx.fillStyle = '#2E1E16'; ctx.fillRect(sx0, -118, sx1 - sx0, 118);
      for (let s = 0; s < 4; s++) { const sy = -118 + s * 29; ctx.fillStyle = '#4A3222'; ctx.fillRect(sx0, sy + 26, sx1 - sx0, 3);
        for (let k = 0, bx = sx0 + 2; bx < sx1 - 4; k++) { const bw = 3.4 + hsh(s * 13 + k) * 3.4, bh = 13 + hsh(s * 7 + k) * 10, lean = hsh(s + k * 3) > .85;
          ctx.fillStyle = ['#6A2A2A', '#2A4A6A', '#5A5A2A', '#3A2A4A', '#7A5A2A', '#1E3A2E'][(s + k) % 6];
          if (s === 3 && k % 3 === 1) { ctx.fillStyle = ['#1A1A2E', '#3A1414', '#14301E'][k % 3]; rrect(bx, sy + 26 - 9, 5, 9, 1.4); ctx.fill(); ctx.fillStyle = '#E8DCC0'; ctx.fillRect(bx + 1.6, sy + 13, 1.8, 4); bx += 6.4; continue; }
          if (lean) { ctx.save(); ctx.translate(bx, sy + 26); ctx.rotate(.25); ctx.fillRect(0, -bh, bw, bh); ctx.restore(); bx += bw + 3; } else { ctx.fillRect(bx, sy + 26 - bh, bw, bh); ctx.fillStyle = 'rgba(216,170,85,.5)'; ctx.fillRect(bx, sy + 26 - bh + 3, bw, .8); bx += bw + .7; } } }
      ctx.beginPath(); ctx.rect(sx0, -118, sx1 - sx0, 118); outline(.9);
      const sheet = (x, y, w, h, r, fn) => { ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.fillStyle = '#E4D4B0'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.fillStyle = 'rgba(120,80,40,.18)'; ctx.fillRect(-w / 2, h / 2 - 4, w, 4); ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); outline(.6); fn(w, h); ctx.fillStyle = '#B82A2A'; circle(0, -h / 2 + 2.4, 1.3); ctx.fill(); ctx.restore(); };
      sheet(-12, -128, 46, 38, -.04, () => { ctx.strokeStyle = 'rgba(60,40,90,.8)'; ctx.lineWidth = .7; ctx.beginPath(); for (let k = 0; k < 6; k++) { const r = 3 + k * 2.8, a0 = hsh(k + 60) * TAU; ctx.moveTo(Math.cos(a0) * r, Math.sin(a0) * r * .8); ctx.arc(0, 0, r, a0, a0 + TAU * .78); } ctx.stroke();
        ctx.beginPath(); for (let k = 0; k < 5; k++) { const a = hsh(k + 70) * TAU; ctx.moveTo(Math.cos(a) * 4, Math.sin(a) * 4); ctx.lineTo(Math.cos(a) * 17, Math.sin(a) * 17); } ctx.stroke(); });
      sheet(-iw + 12, -116, 18, 24, .1, () => { ctx.strokeStyle = 'rgba(60,40,30,.75)'; ctx.lineWidth = .6; ctx.beginPath(); circle(0, -5, 2.6); ctx.moveTo(0, -2.4); ctx.lineTo(0, 5); ctx.moveTo(-4, 0); ctx.lineTo(4, 0); ctx.moveTo(0, 5); ctx.lineTo(-3, 10); ctx.moveTo(0, 5); ctx.lineTo(3, 10); ctx.stroke(); });
      sheet(-iw + 10, -86, 14, 16, -.12, () => { ctx.fillStyle = 'rgba(60,40,90,.7)'; for (let k = 0; k < 7; k++) { circle(-4 + hsh(k + 80) * 8, -5 + hsh(k + 81) * 10, .7); ctx.fill(); } });
      ctx.strokeStyle = '#4A3222'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-iw + 4, 0); ctx.lineTo(-iw + 16, -66); ctx.lineTo(-iw + 28, 0); ctx.moveTo(-iw + 16, -66); ctx.lineTo(-iw + 16, -4); ctx.stroke();
      ctx.fillStyle = '#E8DCC0'; ctx.fillRect(-iw + 5, -62, 22, 32); ctx.strokeStyle = '#C9A050'; ctx.lineWidth = 1.4; ctx.strokeRect(-iw + 5, -62, 22, 32);
      const tg = ctx.createLinearGradient(0, -60, 0, -32); tg.addColorStop(0, '#9ABCE8'); tg.addColorStop(1, '#2A3A6A'); ctx.fillStyle = tg; ctx.fillRect(-iw + 7.5, -59.5, 17, 20);
      ctx.strokeStyle = 'rgba(240,248,255,.8)'; ctx.lineWidth = .6; ctx.beginPath(); for (let k = 0; k < 3; k++) { ctx.moveTo(-iw + 16 + 2 + k * 2, -50); ctx.arc(-iw + 16, -50, 2 + k * 2, 0, Math.PI * 1.6); } ctx.stroke();
      ctx.fillStyle = '#4A3222'; ctx.fillRect(-iw + 3, -31, 26, 2.4);
    },
    ganelon(iw) { // the armoury: two stands with mail and helms on them, his shield on the wall, his pennon, swords racked
      for (const [sd, col, kind] of [[-1, '#5E626A', 0], [1, '#70747C', 1]]) { const sx = sd * (iw - 13);
        ctx.fillStyle = '#3A2A1E'; ctx.fillRect(sx - 1.6, -96, 3.2, 96); ctx.fillRect(sx - 13, -3, 26, 3); ctx.fillRect(sx - 15, -84, 30, 3);
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(sx - 15, -84); ctx.quadraticCurveTo(sx, -90, sx + 15, -84); ctx.lineTo(sx + 17, -62); ctx.lineTo(sx + 12, -62); ctx.lineTo(sx + 12, -36); ctx.quadraticCurveTo(sx, -31, sx - 12, -36); ctx.lineTo(sx - 12, -62); ctx.lineTo(sx - 17, -62); ctx.closePath(); ctx.fill(); outline(.9);
        ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(20,20,30,.35)'; ctx.lineWidth = .5; ctx.beginPath(); for (let y = -86; y < -30; y += 2.4) { ctx.moveTo(sx - 18, y); ctx.lineTo(sx + 18, y + 1); } ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(sx + 4, -84, 3, 46); ctx.restore();
        ctx.fillStyle = '#5A3A22'; ctx.fillRect(sx - 12, -50, 24, 3);
        helmAt(sx, -98, kind); }
      const shield = (sx, sy, field, charge, chev, k) => { ctx.save(); ctx.translate(sx, sy); ctx.scale(k, k); const path = () => { ctx.beginPath(); ctx.moveTo(-13, -16); ctx.lineTo(13, -16); ctx.lineTo(13, 0); ctx.quadraticCurveTo(12, 12, 0, 18); ctx.quadraticCurveTo(-12, 12, -13, 0); ctx.closePath(); };
        path(); ctx.fillStyle = field; ctx.fill(); ctx.save(); path(); ctx.clip(); ctx.fillStyle = charge;
        if (chev) { ctx.beginPath(); ctx.moveTo(-14, 8); ctx.lineTo(0, -6); ctx.lineTo(14, 8); ctx.lineTo(14, 14); ctx.lineTo(0, 0); ctx.lineTo(-14, 14); ctx.closePath(); ctx.fill(); } else { ctx.rotate(.8); ctx.fillRect(-30, -3.4, 60, 6.8); }
        const g = ctx.createLinearGradient(-13, -16, 13, 18); g.addColorStop(0, 'rgba(255,255,255,.2)'); g.addColorStop(1, 'rgba(0,0,0,.25)'); ctx.fillStyle = g; ctx.fillRect(-14, -17, 28, 36); ctx.restore(); path(); outline(1.1); ctx.restore(); };
      shield(-(iw - 16), -138, '#24365E', '#D8AA55', true, .8);
      shield(-(iw - 30), -12, '#D8AA55', '#B82A2A', false, .62);
      ctx.fillStyle = '#7A1E18'; ctx.beginPath(); ctx.moveTo(-9, HEM); ctx.lineTo(9, HEM); ctx.lineTo(9, HEM + 14); ctx.lineTo(0, HEM + 9); ctx.lineTo(-9, HEM + 14); ctx.closePath(); ctx.fill(); outline(.6);
      ctx.fillStyle = '#D8AA55'; circle(0, HEM + 5, 2.2); ctx.fill();
    },
    fiona(iw) { // the sorceress's booth: an arcane circle on the wall, shelves of vials, herbs hung to dry, her cabinet and mortar
      const cy = -128; ctx.strokeStyle = 'rgba(190,130,255,.6)'; ctx.lineWidth = 1.2; circle(0, cy, 21); ctx.stroke(); ctx.lineWidth = .7; circle(0, cy, 16); ctx.stroke();
      ctx.beginPath(); for (let k = 0; k <= 7; k++) { const a = (k * 3 % 7) / 7 * TAU - Math.PI / 2; ctx.lineTo(Math.cos(a) * 16, cy + Math.sin(a) * 16); } ctx.stroke();
      ctx.fillStyle = 'rgba(210,160,255,.7)'; for (let k = 0; k < 14; k++) { const a = k / 14 * TAU; ctx.save(); ctx.translate(Math.cos(a) * 18.5, cy + Math.sin(a) * 18.5); ctx.rotate(a); ctx.fillRect(-.5, -1.2, 1, 2.4); if (k % 2) ctx.fillRect(-1.2, -.4, 2.4, .8); ctx.restore(); }
      for (let s = 0; s < 2; s++) { const sy = -92 + s * 30; timber(10, sy, iw - 10, 3, '#3A2A20', true);
        for (let k = 0; k < 4; k++) { const vx = 15 + k * ((iw - 18) / 4) + 2, tall = (k + s) % 3 === 0; ctx.fillStyle = ['#7A3AB8', '#3AB88A', '#B83A5A', '#D8B84A'][(k + s) % 4]; ctx.globalAlpha = .9;
          if (tall) { rrect(vx - 2.4, sy - 14, 4.8, 14, 1.8); } else { ctx.beginPath(); ctx.arc(vx, sy - 4.4, 4.4, 0, TAU); } ctx.fill(); ctx.globalAlpha = 1; outline(.5);
          ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(vx - 1.4, sy - (tall ? 12 : 7), 1, 3); ctx.fillStyle = '#E8DCC0'; ctx.fillRect(vx - 1.3, sy - (tall ? 17 : 11.4), 2.6, 3); } }
      ctx.strokeStyle = '#3A2A1E'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-iw + 2, -150); ctx.lineTo(-10, -150); ctx.stroke();
      for (let k = 0; k < 4; k++) { const hx = -iw + 7 + k * ((iw - 16) / 4); ctx.beginPath(); ctx.moveTo(hx, -150); ctx.lineTo(hx, -142); ctx.stroke(); ctx.fillStyle = ['#5A7A3A', '#7A6A3A', '#6A8A4A', '#8A5A6A'][k]; ell(hx, -132, 3.4, 9, (k - 1.5) * .08); ctx.fill(); outline(.4); }
      counter(-iw + 2, -10, -40, '#4A2E1E');
      ctx.fillStyle = '#6E6458'; ctx.beginPath(); ctx.moveTo(-iw + 8, -44); ctx.lineTo(-iw + 22, -44); ctx.quadraticCurveTo(-iw + 21, -36, -iw + 15, -36); ctx.quadraticCurveTo(-iw + 9, -36, -iw + 8, -44); ctx.closePath(); ctx.fill(); outline(.6);
      ctx.strokeStyle = '#B8AC98'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-iw + 17, -42); ctx.lineTo(-iw + 23, -52); ctx.stroke();
      ctx.fillStyle = '#E8E0D0'; ell(-iw + 32, -45, 4, 3.6); ctx.fill(); outline(.5); ctx.fillStyle = '#1A1418'; circle(-iw + 30.6, -45.6, .9); circle(-iw + 33.4, -45.6, .9); ctx.fill();
    },
    random(iw) { // the gambler's booth: cards pinned up in a fan, a tambour on the wall, a shelf of cups and dice, a drum below
      for (let k = 0; k < 5; k++) { const cx = -4 + k * 8, cy = -136 + Math.abs(k - 2) * 2.6; ctx.save(); ctx.translate(cx, cy); ctx.rotate((k - 2) * .2); ctx.fillStyle = '#F0E6D0'; ctx.fillRect(-5, -7.5, 10, 15); ctx.strokeStyle = '#C9A050'; ctx.lineWidth = .7; ctx.strokeRect(-5, -7.5, 10, 15); ctx.fillStyle = k % 2 ? '#B82A2A' : '#1A1418'; ctx.font = '700 7px Georgia'; ctx.textAlign = 'center'; ctx.fillText(['♠', '♥', '♣', '♦', '♠'][k], 0, 3); ctx.restore(); }
      ctx.fillStyle = '#B82A2A'; circle(12, -144, 1.4); ctx.fill();
      const dx = iw - 14, dy = -96; ctx.fillStyle = '#C8A870'; circle(dx, dy, 12); ctx.fill(); outline(.9); ctx.fillStyle = '#E8DCC0'; circle(dx, dy, 10); ctx.fill(); ctx.fillStyle = '#D8AA55'; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; circle(dx + Math.cos(a) * 11, dy + Math.sin(a) * 11, 1.3); ctx.fill(); }
      ctx.strokeStyle = 'rgba(120,80,40,.4)'; ctx.lineWidth = .6; circle(dx, dy, 6); ctx.stroke();
      timber(-iw + 2, -88, iw - 8, 3.4, '#4A3020', true);
      for (const [x, c, h] of [[-iw + 7, '#3A5A2A', 14], [-iw + 13, '#6A1E1E', 11], [-iw + 21, '#8A6A40', 7], [-iw + 29, '#B8A070', 8]]) { ctx.fillStyle = c; if (h > 10) { rrect(x - 2.4, -88 - h, 4.8, h, 1.6); ctx.fill(); outline(.5); ctx.fillRect(x - 1, -88 - h - 3, 2, 3); } else { ctx.beginPath(); ctx.moveTo(x - 3.4, -88 - h); ctx.lineTo(x + 3.4, -88 - h); ctx.lineTo(x + 2.6, -88); ctx.lineTo(x - 2.6, -88); ctx.closePath(); ctx.fill(); outline(.5); } }
      ctx.fillStyle = '#F0E6D0'; ctx.fillRect(-iw + 34, -93, 4.4, 4.4); ctx.fillStyle = '#1A1418'; ctx.fillRect(-iw + 35.6, -91.4, 1.2, 1.2);
      counter(-iw + 2, iw - 2, -34, '#5A3220');
    },
    llewella(iw) { // Rebma's booth: the sea-mirror framed in coral and shells, a net hung with floats and shells, tiles the colour of deep water
      const { mx, my, rx, ry } = MIRROR;
      ctx.strokeStyle = 'rgba(220,210,180,.55)'; ctx.lineWidth = .6; ctx.beginPath();
      for (let k = 0; k <= 5; k++) { const x = -iw + 3 + k * 6.4; ctx.moveTo(x, -124); ctx.quadraticCurveTo(x + 3, -96, x - 2, -62); } for (let k = 0; k < 8; k++) { const y = -122 + k * 8; ctx.moveTo(-iw + 2, y); ctx.quadraticCurveTo(-iw + 18, y + 3, -iw + 34, y - 1); } ctx.stroke();
      timber(-iw + 1, -127, 36, 3, '#6A5A4A', true);
      for (const [x, y, c] of [[-iw + 9, -104, '#5AB89A'], [-iw + 25, -80, '#7AC8D8']]) { ctx.fillStyle = c; circle(x, y, 4.6); ctx.fill(); outline(.6); ctx.fillStyle = 'rgba(255,255,255,.55)'; circle(x - 1.4, y - 1.4, 1.3); ctx.fill(); }
      counter(-iw + 2, -4, -30, '#6A5A48');
      for (const [x, y, c] of [[-iw + 8, -33, '#F0D8C8'], [-iw + 16, -34, '#E8C8A8'], [-iw + 26, -33, '#F4E0D0']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - 3.4, y + 1); ctx.quadraticCurveTo(x, y - 5, x + 3.4, y + 1); ctx.closePath(); ctx.fill(); outline(.4); }
      for (const [x, y] of [[-iw + 20, -112], [-iw + 10, -76]]) { ctx.fillStyle = '#F0D8C8'; ctx.beginPath(); ctx.moveTo(x - 4, y + 2); ctx.quadraticCurveTo(x, y - 6, x + 4, y + 2); ctx.closePath(); ctx.fill(); outline(.4); }
      ctx.fillStyle = '#E8E0D6'; ell(mx, my, rx + 7, ry + 7); ctx.fill(); outline(1.2);
      const fr = ctx.createLinearGradient(mx - rx, my - ry, mx + rx, my + ry); fr.addColorStop(0, '#F8F4FF'); fr.addColorStop(.4, '#C8D8E8'); fr.addColorStop(.7, '#F0D8E8'); fr.addColorStop(1, '#A8C0D0'); ctx.fillStyle = fr; ell(mx, my, rx + 5, ry + 5); ctx.fill();
      const wg = ctx.createLinearGradient(0, my - ry, 0, my + ry); wg.addColorStop(0, '#5AB8C8'); wg.addColorStop(.5, '#1E5A78'); wg.addColorStop(1, '#0A2438'); ctx.fillStyle = wg; ell(mx, my, rx, ry); ctx.fill();
      ctx.save(); ell(mx, my, rx, ry); ctx.clip(); ctx.fillStyle = 'rgba(20,50,70,.75)';
      for (const [dx, h] of [[-12, 22], [-4, 34], [5, 28], [13, 18]]) { ctx.beginPath(); ctx.moveTo(mx + dx - 3, my + ry - h); ctx.lineTo(mx + dx, my + ry + 4); ctx.lineTo(mx + dx + 3, my + ry - h); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      const coral = (x, y, sc, flip, col) => { ctx.save(); ctx.translate(x, y); ctx.scale(sc * flip, sc); ctx.strokeStyle = col; ctx.lineCap = 'round';
        for (const [w, pts] of [[3.4, [[0, 0], [2, -10], [-1, -20]]], [2.4, [[1.4, -8], [8, -14], [10, -22]]], [2, [[2, -12], [-6, -18], [-8, -26]]], [1.6, [[8, -14], [11, -15], [14, -16]]]]) { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]); ctx.stroke(); }
        ctx.restore(); ctx.lineCap = 'butt'; };
      coral(mx - rx + 2, my + ry + 8, 1.1, 1, '#D86A5A'); coral(mx + rx - 2, my + ry + 8, 1, -1, '#E8906A'); coral(mx + 2, my - ry - 2, .7, 1, '#D86A5A');
      for (let k = 0; k < 9; k++) { const a = -Math.PI / 2 + (k + .5) / 9 * TAU, sx = mx + Math.cos(a) * (rx + 6), sy = my + Math.sin(a) * (ry + 6);
        if (k % 3 === 0) { ctx.fillStyle = '#F4E0D0'; ctx.save(); ctx.translate(sx, sy); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(-4, 2); ctx.quadraticCurveTo(0, -6, 4, 2); ctx.closePath(); ctx.fill(); outline(.4); ctx.restore(); }
        else if (k % 3 === 1) { ctx.fillStyle = '#F8F6F0'; circle(sx, sy, 1.8); ctx.fill(); outline(.3); }
        else { ctx.fillStyle = '#E8C8A8'; ell(sx, sy, 2.6, 1.7, a); ctx.fill(); outline(.4); } }
      ctx.fillStyle = '#E8905A'; ctx.save(); ctx.translate(mx, my - ry - 10); ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU - Math.PI / 2, r = k % 2 ? 2 : 5.4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); outline(.5); ctx.restore();
    },
  };
  const MIRROR = { mx: 20, my: -84, rx: 21, ry: 52 };
  const GERARD_BARREL = 40, JULIAN_BUTT = { x: 40, y: -20 };
  function barrel(x, y0, hw, h, col, hoops) { // a coopered barrel: bellied staves lit from the left, iron hoops catching the light, its shade on the floor
    ctx.fillStyle = 'rgba(6,3,3,.4)'; ell(x + 2, y0 + h, hw * 1.25, 2.6); ctx.fill();
    const path = () => { ctx.beginPath(); ctx.moveTo(x - hw * .86, y0); ctx.quadraticCurveTo(x - hw * 1.08, y0 + h / 2, x - hw * .86, y0 + h); ctx.lineTo(x + hw * .86, y0 + h); ctx.quadraticCurveTo(x + hw * 1.08, y0 + h / 2, x + hw * .86, y0); ctx.closePath(); };
    path(); const g = ctx.createLinearGradient(x - hw, 0, x + hw, 0); g.addColorStop(0, shade(col, -.1)); g.addColorStop(.3, shade(col, .22)); g.addColorStop(.7, col); g.addColorStop(1, shade(col, -.5)); ctx.fillStyle = g; ctx.fill();
    ctx.save(); path(); ctx.clip(); ctx.strokeStyle = 'rgba(20,10,4,.45)'; ctx.lineWidth = .5; ctx.beginPath();
    for (let k = -2; k <= 2; k++) { const xs = x + k * hw * .38; ctx.moveTo(xs, y0); ctx.quadraticCurveTo(x + k * hw * .46, y0 + h / 2, xs, y0 + h); } ctx.stroke();
    const vg = ctx.createLinearGradient(0, y0 + h * .6, 0, y0 + h); vg.addColorStop(0, 'rgba(6,3,3,0)'); vg.addColorStop(1, 'rgba(6,3,3,.4)'); ctx.fillStyle = vg; ctx.fillRect(x - hw * 1.2, y0, hw * 2.4, h);
    for (const f of hoops) { const yy = y0 + h * f, bw = hw * (f > .2 && f < .8 ? 1.06 : .92); ctx.strokeStyle = iron; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - bw, yy); ctx.quadraticCurveTo(x, yy + 1.4, x + bw, yy); ctx.stroke();
      ctx.strokeStyle = 'rgba(200,190,180,.4)'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(x - bw * .8, yy - .5); ctx.quadraticCurveTo(x - bw * .3, yy + .3, x, yy + .2); ctx.stroke(); }
    ctx.restore(); path(); outline(.9);
  }
  const FLOOR = { // the pieces of each stall standing out on the floor, in the keeper's frame (sl.mv: their feet at (0, 22))
    gerard() { const ax = -30, ay = 22; // the anvil on its stump, and the quench barrel with its tongs
      ctx.fillStyle = 'rgba(6,3,3,.45)'; ell(ax + 2, ay, 14, 2.4); ctx.fill();
      ctx.fillStyle = '#5A3C26'; ctx.fillRect(ax - 10, ay - 16, 20, 16); outline(.8); ctx.fillStyle = '#6E4E34'; ell(ax, ay - 16, 10, 2.6); ctx.fill();
      ctx.strokeStyle = 'rgba(30,16,8,.6)'; ctx.lineWidth = .6; for (const dx of [-5, 1, 6]) { ctx.beginPath(); ctx.moveTo(ax + dx, ay - 14); ctx.lineTo(ax + dx + 1, ay - 1); ctx.stroke(); }
      const an = () => { ctx.beginPath(); ctx.moveTo(ax - 18, ay - 30); ctx.lineTo(ax + 13, ay - 30); ctx.quadraticCurveTo(ax + 27, ay - 29, ax + 30, ay - 25); ctx.quadraticCurveTo(ax + 20, ay - 24, ax + 13, ay - 23); ctx.lineTo(ax + 7, ay - 23); ctx.lineTo(ax + 9, ay - 16); ctx.lineTo(ax - 11, ay - 16); ctx.lineTo(ax - 9, ay - 23); ctx.lineTo(ax - 18, ay - 26); ctx.closePath(); };
      const ag = ctx.createLinearGradient(ax - 18, 0, ax + 30, 0); ag.addColorStop(0, '#2A2624'); ag.addColorStop(.6, '#4A4440'); ag.addColorStop(1, '#8A6A50');
      an(); ctx.fillStyle = ag; ctx.fill(); outline(1.1);
      ctx.fillStyle = '#B8A894'; ctx.fillRect(ax - 17, ay - 30, 30, 1.4); ctx.fillStyle = 'rgba(255,170,90,.55)'; ctx.fillRect(ax + 2, ay - 30, 14, 1.2);
      ctx.save(); an(); ctx.clip(); const sh = ctx.createLinearGradient(0, ay - 26, 0, ay - 16); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.4)'); ctx.fillStyle = sh; ctx.fillRect(ax - 20, ay - 26, 52, 10);
      ctx.strokeStyle = 'rgba(255,200,150,.35)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(ax + 13, ay - 29); ctx.quadraticCurveTo(ax + 24, ay - 28.4, ax + 29, ay - 25.4); ctx.stroke(); ctx.restore();
      const bx = GERARD_BARREL; barrel(bx, -4, 11, 24, '#5A3A22', [.2, .78]);
      ctx.fillStyle = '#4A2E1A'; ell(bx, -4, 9.6, 2.6); ctx.fill(); outline(.7); ctx.fillStyle = '#1A2A30'; ell(bx, -3.8, 8.4, 2); ctx.fill(); ctx.fillStyle = 'rgba(255,170,90,.35)'; ell(bx - 3, -4.2, 3, .6); ctx.fill(); ctx.strokeStyle = iron; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx + 4, -5); ctx.lineTo(bx + 9, -20); ctx.moveTo(bx + 6, -5); ctx.lineTo(bx + 10, -20); ctx.stroke(); },
    julian() { const tx = JULIAN_BUTT.x, ty = JULIAN_BUTT.y + 22; // the straw butt, and a barrel of arrows
      ctx.fillStyle = '#4A3222'; ctx.save(); ctx.translate(tx, ty); ctx.rotate(.12); ctx.fillRect(-2, -10, 3, 30); ctx.restore();
      ctx.fillStyle = '#C8A860'; ell(tx, ty - 22, 16, 18); ctx.fill(); outline(1);
      for (const [r, c] of [[12.6, '#E8E0C8'], [9, '#B83A2A'], [5.4, '#E8E0C8'], [2.7, '#D8AA55']]) { ctx.fillStyle = c; ell(tx, ty - 22, r, r * 1.1); ctx.fill(); }
      ctx.strokeStyle = '#6A4626'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(tx - 2, ty - 24); ctx.lineTo(tx - 14, ty - 30); ctx.moveTo(tx + 4, ty - 18); ctx.lineTo(tx - 9, ty - 14); ctx.stroke();
      const bx = -38; ctx.strokeStyle = '#6A4626'; ctx.lineWidth = .9; ctx.beginPath(); for (let k = 0; k < 7; k++) { ctx.moveTo(bx - 5 + k * 1.7, 2); ctx.lineTo(bx - 7 + k * 2.3, -14 - hsh(k + 90) * 4); } ctx.stroke();
      for (let k = 0; k < 7; k++) { ctx.fillStyle = k % 2 ? '#E8E0C8' : '#3A7A4A'; ell(bx - 7 + k * 2.3, -14 - hsh(k + 90) * 4, 1, 2.6); ctx.fill(); }
      barrel(bx, 0, 8, 21, '#6A4626', [.22, .78]); ctx.fillStyle = '#2A1A10'; ell(bx, 0, 6.8, 1.6); ctx.fill(); },
    ganelon() { // a sword stood point-down in a weapon stand
      const x = -34; ctx.fillStyle = '#4A3222'; ctx.fillRect(x - 9, 12, 18, 9); ctx.beginPath(); ctx.rect(x - 9, 12, 18, 9); outline(.7);
      for (const k of [-5, 0, 5]) sword(x + k, -24 + Math.abs(k) * .6, 38, k ? '#B8BCC6' : '#D8AA55', k * .02); },
    fiona() { // the braziers on their tripods, the big one over its circle of runes
      for (const [bx, sc] of [[-34, 1]]) { const fy = 20;
        if (sc === 1) { ctx.strokeStyle = 'rgba(190,120,255,.45)'; ctx.lineWidth = 1; ell(bx, fy, 30, 7.4); ctx.stroke(); ell(bx, fy, 24, 5.8); ctx.stroke();
          ctx.fillStyle = 'rgba(210,150,255,.55)'; for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; ctx.fillRect(bx + Math.cos(a) * 27 - 1, fy + Math.sin(a) * 6.6 - 1, 2, 2); } }
        ctx.save(); ctx.translate(bx, fy); ctx.scale(sc, sc);
        ctx.strokeStyle = iron; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(-4, -22); ctx.moveTo(11, 0); ctx.lineTo(4, -22); ctx.moveTo(0, 2); ctx.lineTo(0, -22); ctx.stroke();
        ctx.fillStyle = iron; ctx.beginPath(); ctx.moveTo(-14, -28); ctx.lineTo(14, -28); ctx.quadraticCurveTo(11, -18, 0, -18); ctx.quadraticCurveTo(-11, -18, -14, -28); ctx.closePath(); ctx.fill(); outline(.9);
        ctx.fillStyle = '#3A1A4A'; ell(0, -28, 13, 2.6); ctx.fill(); ctx.restore(); } },
    random() { const dx = -42; // his drum
      ctx.fillStyle = '#8A2A22'; ctx.fillRect(dx - 12, 2, 24, 18); ctx.beginPath(); ctx.rect(dx - 12, 2, 24, 18); outline(.8); ctx.fillStyle = '#E8DCC0'; ell(dx, 2, 12, 3.4); ctx.fill(); outline(.8);
      ctx.strokeStyle = '#D8AA55'; ctx.lineWidth = .8; ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(dx - 12 + k * 8, 4); ctx.lineTo(dx - 8 + k * 8, 18); } ctx.stroke();
      ctx.strokeStyle = '#4A3018'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(dx - 4, 0); ctx.lineTo(dx + 8, -8); ctx.moveTo(dx + 2, 0); ctx.lineTo(dx + 14, -5); ctx.stroke(); },
    llewella() { // coral on the floor, and a great clam open on its pearl
      ctx.fillStyle = '#C86A6A'; const x = -40; ctx.beginPath(); ctx.moveTo(x - 8, 22); ctx.quadraticCurveTo(x - 14, 0, x - 8, -8); ctx.quadraticCurveTo(x - 2, 2, x + 1, -4); ctx.quadraticCurveTo(x + 6, 10, x + 5, 22); ctx.closePath(); ctx.fill(); outline(.7);
      const cx = -22, cy = 18; ctx.fillStyle = '#D8C8C0'; ctx.beginPath(); ctx.moveTo(cx - 11, cy); ctx.quadraticCurveTo(cx, cy - 14, cx + 11, cy); ctx.closePath(); ctx.fill(); outline(.6);
      ctx.fillStyle = '#E8DCD4'; ctx.beginPath(); ctx.moveTo(cx - 11, cy); ctx.quadraticCurveTo(cx, cy + 6, cx + 11, cy); ctx.closePath(); ctx.fill(); outline(.6);
      ctx.fillStyle = '#F8F6F0'; circle(cx, cy - 1.6, 2.8); ctx.fill(); ctx.fillStyle = 'rgba(140,220,230,.6)'; circle(cx - .8, cy - 2.4, 1); ctx.fill(); },
  };
  const FRONT = { // what they stand behind, laid over them (a layer of its own), in the keeper's frame
    dworkin() { // his desk, cluttered: the Trumps fanned, inks and a quill, a lens on its arm, a candle, a rolled sketch, a Pattern half-drawn
      const x0 = -38, x1 = 38, top = 2, path = () => { ctx.beginPath(); ctx.moveTo(x0, top); ctx.lineTo(x1, top); ctx.lineTo(x1 - 4, top - 6); ctx.lineTo(x0 + 4, top - 6); ctx.closePath(); };
      ctx.fillStyle = '#2E1C12'; for (const lx of [x0 + 2, x1 - 7]) ctx.fillRect(lx, top + 14, 5, 16);
      const fg = ctx.createLinearGradient(0, top, 0, top + 16); fg.addColorStop(0, '#5A3A24'); fg.addColorStop(1, '#3A2416'); ctx.fillStyle = fg; ctx.beginPath(); ctx.rect(x0, top, x1 - x0, 16); ctx.fill(); outline(.9);
      ctx.strokeStyle = '#C9A050'; ctx.lineWidth = .8; ctx.strokeRect(x0 + 4, top + 3, x1 - x0 - 8, 10); ctx.fillStyle = '#C9A050'; circle(0, top + 8, 1.6); ctx.fill();
      path(); ctx.fillStyle = '#7A5232'; ctx.fill(); outline(.8);
      ctx.save(); ctx.translate(-14, top - 3); ctx.scale(1, .45); ctx.rotate(-.2); ctx.fillStyle = '#E4D4B0'; ctx.fillRect(-9, -7, 18, 14); ctx.strokeStyle = 'rgba(60,40,90,.8)'; ctx.lineWidth = .8; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.arc(0, 0, k * 2, k, k + 4.6); ctx.stroke(); } ctx.restore();
      const cols = ['#C8503E', '#4A6A9A', '#3E7A4A', '#E4E2DA', '#D49866', '#2A6A7A'];
      for (let k = 0; k < 6; k++) { ctx.save(); ctx.translate(6 + k * 2.6, top - 2); ctx.rotate((k - 2.5) * .22); ctx.fillStyle = '#E8EEF8'; ctx.fillRect(-3, -9, 6, 9); ctx.fillStyle = cols[k]; ctx.fillRect(-2.2, -8.2, 4.4, 7.4); ctx.restore(); }
      for (const [ix, c] of [[-28, '#141018'], [-23, '#3A1430']]) { ctx.fillStyle = c; rrect(ix - 2.4, top - 9, 4.8, 7, 1.4); ctx.fill(); outline(.4); ctx.fillStyle = '#5A4A3A'; ctx.fillRect(ix - 1.4, top - 10.4, 2.8, 1.6); }
      ctx.strokeStyle = '#E8E0C8'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-28, top - 9); ctx.quadraticCurveTo(-32, top - 18, -27, top - 24); ctx.stroke(); ctx.fillStyle = '#E8E0C8'; ell(-29, top - 19, 1.4, 4, -.3); ctx.fill();
      ctx.strokeStyle = '#B8904A'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(28, top - 3); ctx.lineTo(28, top - 12); ctx.lineTo(22, top - 17); ctx.stroke();
      ctx.fillStyle = 'rgba(190,230,255,.45)'; circle(20, top - 19, 4.4); ctx.fill(); ctx.strokeStyle = '#C9A050'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(18.6, top - 20.4, 1.1); ctx.fill();
      ctx.fillStyle = '#B8904A'; ell(28, top - 3, 3.4, 1); ctx.fill();
      ctx.fillStyle = '#D8C8A0'; ctx.save(); ctx.translate(-6, top - 7); ctx.rotate(-.15); rrect(-6, -1.6, 12, 3.2, 1.6); ctx.fill(); outline(.4); ctx.restore();
      ctx.fillStyle = '#B8A890'; ell(CANDLE.x, top - 3, 3.4, 1.1); ctx.fill(); ctx.fillStyle = '#ECE4D0'; ctx.fillRect(CANDLE.x - 1.4, CANDLE.y, 2.8, top - 3 - CANDLE.y); ctx.beginPath(); ctx.rect(CANDLE.x - 1.4, CANDLE.y, 2.8, top - 3 - CANDLE.y); outline(.4);
    },
  };
  const CANDLE = { x: -34, y: -10 };

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
  #fhUi .fh-btns .cta { min-height: 44px; padding: 6px 14px; font-size: 12.5px; }
  #fhUi #fhWalkBtn { min-width: 112px; font-size: 13.5px; }
  #fhUi #fhWalkBtn kbd { margin-left: 4px; color: #2A1606; border-color: rgba(70,40,8,.6); background: rgba(255,255,255,.25); }
  #fhUi .fh-hint { position: absolute; left: 50%; bottom: 84px; translate: -50% 0; font: 600 12px var(--label); letter-spacing: .06em; color: rgba(244,234,219,.85); text-shadow: 0 1px 2px #000; white-space: nowrap; transition: opacity .3s; }
  #fhUi .fh-talk { pointer-events: auto; position: absolute; left: 50%; bottom: max(14px, env(safe-area-inset-bottom, 0px)); translate: -50% 0; display: grid; gap: 2px; justify-items: center; cursor: pointer;
    padding: 8px 22px 9px; border-radius: 10px; border: 1.5px solid transparent; color: var(--text); font-family: var(--label);
    background: var(--engrave) padding-box, var(--lacq) padding-box, var(--foil) border-box; box-shadow: inset 0 0 0 2px rgba(0,0,0,.6), inset 0 0 0 3px rgba(214,174,88,.38), 0 8px 18px -6px rgba(0,0,0,.85), 0 0 18px rgba(216,170,85,.25); animation: fhIn .18s ease-out; }
  #fhUi .fh-talk .fh-tw { font: 700 13px var(--label); letter-spacing: .08em; color: #EBCB7C; white-space: nowrap; }
  #fhUi .fh-talk .fh-tk { font: 700 11px var(--label); letter-spacing: .12em; color: var(--soft); }
  html:not(.kbd) #fhUi .fh-talk { left: auto; translate: none; right: max(26px, env(safe-area-inset-right, 0px)); bottom: 22px; min-width: 132px; min-height: 92px; align-content: center; border-radius: 16px; }
  html:not(.kbd) #fhUi .fh-talk .fh-tk { font-size: 18px; color: var(--text); letter-spacing: .16em; }
  html:not(.kbd) #fhUi .fh-talk:active { translate: 0 2px; }
  @media (max-height: 460px) { /* (a short screen: the plate on two lines, its counts beside the title, so the far wall's booths show under it) */
    #fhUi .fh-plate { display: grid; grid-template-columns: auto auto; column-gap: 12px; align-items: center; padding: 4px 12px 5px; text-align: left; }
    #fhUi .fh-kick { grid-column: 1; font-size: 8px; } #fhUi .fh-title { grid-column: 1; font-size: 14px; line-height: 1.15; }
    #fhUi .fh-mats { grid-column: 2; grid-row: 1 / span 2; flex-direction: column; gap: 0; margin-top: 0; font-size: 12px; line-height: 1.25; } }
  @keyframes fhIn { from { opacity: 0; } to { opacity: 1; } }
  #app.fhall #controls .btn:not(.b-light), #app.fhall #runTip { display: none !important; }
  #app.fhall #controls .b-light { right: calc(var(--pr) + 64px); bottom: 132px; } /* (above the Talk button) */
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
    get state() { return { on: H.on, panel: H.panel, x: H.x, y: H.y, target: H.target, pref, leaving: !!H.leaving, swing: !!H.swing, cast: H.cast.map(v => ({ id: v.id, slot: v.slot, x: SL(v).vx, y: SL(v).vy, act: v.act && v.act.k, say: v.say && v.say.txt })) }; },
    CAST, ORDER, geo,
    goTo(id) { const G = geo(); let tx, ty; if (id === 'door') { tx = G.door.tx; ty = G.door.ty + 2; } else { const v = H.cast.find(q => q.id === id); if (!v) return false; tx = SL(v).tx; ty = SL(v).ty; }
      H.x = tx; H.y = clamp(ty, heroYMin(tx), heroYMax()); H.target = id; return true; },
    talk: () => interact(), close: () => closePanel(), swing: (heavy) => swing(!!heavy),
    act(id, k) { const v = H.cast.find(q => q.id === id); if (!v) return false; act(v, k, null, { idle: true }); if (k === 'mutter') say(v, CAST.dworkin.say.mutter, 2.4); return true; },
    hold(T) { H.cast.forEach(v => { v.next = T ?? 1e9; }); },
    view(v) { setPref(v === 'menu' ? 'menu' : 'hall'); if (mode === 'forge') showOnly('forgeOv'); return pref; },
    // (a test can paint any of them in any pose: FORGEHALL.dbg.draw(id, pose, x, y, s) on the current context)
    // (the Unicorn: force her for this visit, or read the roll; rate(n) samples the roll over n made-up visits)
    dev: { unicorn() { if (!save.fhUni || save.fhUni.key !== visitKey()) uniDecide(); Object.assign(save.fhUni, { on: true, done: false }); persist(); uniSpawn(); return U.on; },
      get uni() { return { on: U.on, phase: U.phase, x: U.x, y: U.y, gift: U.gift, spot: U.on ? uniSpot() : null, save: save.fhUni && Object.assign({}, save.fhUni) }; },
      roll: (key, salt) => uniRoll(key, salt), decide: () => Object.assign({}, uniDecide()),
      rate(n = 4000, salt = 12345) { let k = 0; for (let i = 0; i < n; i++) if (uniRoll(`${i % 3}|${i}|`, salt)) k++; return k / n; } },
    dbg: { lookOf, draw(id, pose, x, y, s = 1) { const L = lookOf(id), hm = HEAD_MASK; ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      if (L.dwarf) drawDwarf(L, pose, 0); else { HEAD_MASK = null; drawHumanoid(L, pose); const head = HEAD_MASK; HEAD_MASK = hm; dressBody(L, pose); if (head) dressHead(L, head, 0); }
      ctx.restore(); } },
  };
})();
