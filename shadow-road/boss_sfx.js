'use strict';
// ======================================================================================================
// THE BOSSES' VOICES. Every lord of a world gets its own small set of sounds, built like the rest (core.js: tone, noise,
// thump through the one softened bus): a call when it comes on, a cue as it winds up a big attack (so it can be heard
// coming), the weight of its blows, a grunt when it is hurt (at most one every .6 s), a crack when it is staggered, and
// a death. Stone grinds and booms, brass ratchets and hisses steam, crystal rings, a man breathes and his steel rings,
// a dreamer hums in slow detuned beats; a lord corrupted by the Black Circle has a low dark undertone under its voice.
// How it hooks in, without touching the fights themselves:
//  - while a boss's own code runs (its update, its rule of the room, the hazards it set going, the morphs its wounds
//    start), the generic sounds it asks for (roar, growl, slam, whoosh, swing, charge, crunch, shoot) are played in its
//    own voice instead, so nothing is stacked: the growl of world.js's wind-up becomes its telegraph, and so on;
//  - its first roar is its entrance call (or, for those that never roar on coming in, a moment after it appears);
//  - hurtEnemy and killEnemy are wrapped for its hurt, stagger and death sounds (its stagger's crunch and its fall's
//    slam are replaced, not doubled);
//  - the King in the Glass, whose attacks start inside his rule, is given his telegraph when a new attack begins.
// ======================================================================================================
const BSX = (() => {
  const now = () => performance.now() / 1000;
  const R = (a, b) => a + Math.random() * (b - a);
  // ---------------- building blocks ----------------
  const ring = (f, d, v, dl = 0) => { tone(f, d, 'sine', v, 0, dl); tone(f * 2.76, d * .55, 'sine', v * .35, 0, dl); tone(f * 5.4, d * .3, 'sine', v * .14, 0, dl); }; // (a struck bar: inharmonic partials)
  const clicks = (n, gap, v, f, dl = 0) => { for (let i = 0; i < n; i++) noise(.016, v * R(.75, 1.1), f * R(.9, 1.1), 5, dl + i * gap * R(.85, 1.15)); };
  const beat = (f, d, v, df, ty = 'sine', s = 0, dl = 0) => { tone(f, d, ty, v, s, dl); tone(f + df, d, ty, v, s ? s + df : 0, dl); }; // two close tones beating slowly
  const snarl = (f, n, step, v, dl = 0) => { for (let i = 0; i < n; i++) tone(f * R(.88, 1.12), step * 1.5, 'sawtooth', v * R(.7, 1), f * .74, dl + i * step); };
  const bleat = (f, n, step, v, dl = 0) => { for (let i = 0; i < n; i++) tone(f * (i % 2 ? 1.07 : 1), step * 1.35, 'sawtooth', v, f * .95, dl + i * step); };
  const breath = (d, v, f = 1600, dl = 0) => { noise(d, v, f, .7, dl); noise(d * .8, v * .55, f * .42, .8, dl); };
  const shatter = (v, dl = 0) => { noise(.05, v, 4200, 2, dl); tone(R(1800, 2200), .2, 'sine', v * .16, 0, dl + .01); tone(R(2600, 3000), .14, 'sine', v * .09, 0, dl + .03); };
  const scrape = (d, v, f = 3400, dl = 0) => noise(d, v, f, 3, dl); // steel drawn on steel, boots on stone
  // the corrupted lord's undertone, under its calls: felt more than heard
  const under = (d) => { tone(43, d, 'sine', .05, 34); tone(65, d * .8, 'triangle', .018, 51); noise(d * .9, .03, 95, 1.6); };

  // ---------------- the voices ----------------
  // slots: intro, roar, tell, slam, whoosh, swing, charge, crunch, shoot, hurt, stagger, death (p: the power the fight asked for)
  const V = {};
  // OLD MOSSBACK, the walking grove: groaning wood, rustling leaves, stone that grinds and booms
  V.moss = {
    intro: () => { thump(70, 28, .7, .26); noise(.8, .2, 160, .6); tone(56, .8, 'sawtooth', .05, 36); noise(.5, .07, 380, 5, .1); noise(.45, .06, 1500, .6, .2); },
    roar: () => { thump(76, 30, .5, .22); noise(.55, .18, 170, .6); tone(60, .55, 'sawtooth', .045, 40); noise(.35, .06, 420, 5, .08); },
    tell: () => { tone(92, .45, 'sawtooth', .04, 66); noise(.42, .06, 340, 5); noise(.35, .07, 1400, .6, .05); thump(90, 50, .2, .1); },
    slam: () => { thump(82, 30, .38, .32); noise(.3, .22, 150, .7); noise(.03, .11, 1700, 3, .03); noise(.03, .08, 1100, 3, .08); },
    whoosh: () => { noise(.24, .1, 900, .6); noise(.16, .045, 2600, .8, .03); },
    swing: () => { noise(.14, .08, 1200, .8); },
    crunch: () => { thump(110, 44, .18, .24); noise(.12, .22, 700, 1.5); noise(.04, .14, 2400, 4); },
    charge: () => { tone(58, .5, 'triangle', .07, 110); noise(.5, .1, 240, 1); noise(.3, .05, 900, 4, .15); },
    hurt: () => { thump(140, 70, .12, .15); noise(.1, .1, 460, 4); tone(118, .18, 'sawtooth', .02, 84); },
    stagger: () => { noise(.07, .22, 1700, 2); thump(92, 34, .32, .3); tone(110, .5, 'sawtooth', .04, 58, .04); noise(.4, .12, 200, .7, .04); },
    death: () => { tone(84, 1, 'sawtooth', .05, 30); thump(70, 24, .8, .32); noise(.9, .2, 170, .6); noise(.5, .08, 1300, .6, .2); noise(.06, .14, 1800, 3, .3); noise(.06, .1, 1200, 3, .5); },
  };
  // THE BRASS COLOSSUS: a clockwork warden; ratchets, steam, brass horns, metal booms
  V.colossus = {
    intro: () => { thump(60, 30, .55, .26); tone(98, .8, 'sawtooth', .045, 92); tone(147, .8, 'sawtooth', .028, 138); noise(.7, .1, 3800, .7, .05); clicks(4, .07, .1, 2600); },
    roar: () => { thump(66, 32, .4, .22); tone(104, .55, 'sawtooth', .04, 96); tone(156, .5, 'sawtooth', .024, 146); noise(.5, .09, 3800, .7); },
    tell: () => { clicks(5, .055, .14, 2800); tone(220, .3, 'triangle', .03, 330); noise(.32, .07, 3600, .8, .2); thump(110, 60, .1, .1); },
    slam: () => { thump(86, 32, .36, .32); noise(.26, .2, 220, .8); tone(310, .35, 'triangle', .04, 290); tone(523, .2, 'sine', .018); },
    whoosh: () => { noise(.22, .1, 2600, .7); noise(.18, .07, 700, .8); },
    swing: () => { noise(.12, .08, 1600, 1); tone(240, .12, 'triangle', .022, 160); },
    charge: (p) => { tone(170, .45, 'sawtooth', .022 + .006 * p, 400); noise(.42, .05, 3200, .8); clicks(3, .09, .07, 2200); },
    crunch: () => { thump(120, 50, .16, .22); noise(.03, .16, 3000, 3); tone(400, .15, 'triangle', .035, 360); },
    shoot: () => { thump(170, 80, .08, .13); noise(.04, .08, 1800, 2); clicks(2, .05, .06, 2600, .03); },
    hurt: () => { noise(.03, .13, 3000, 3); tone(430, .14, 'triangle', .03, 390); thump(120, 60, .08, .12); noise(.12, .04, 4000, .8, .02); },
    stagger: () => { tone(262, .45, 'triangle', .05, 240); noise(.45, .12, 3600, .7); thump(90, 38, .3, .28); clicks(4, .05, .12, 2200, .05); },
    death: () => { for (let i = 0; i < 6; i++) noise(.02, .14, 2400, 5, i * (.06 + i * .02)); tone(110, .9, 'sawtooth', .045, 40); thump(62, 26, .8, .32); noise(.9, .12, 3200, .6, .1); tone(330, .7, 'triangle', .03, 250, .1); },
  };
  // THE KALEIDOSCOPE WYRM: a hissing roar with a breathy rasp, crystal that rings
  V.wyrm = {
    intro: () => { noise(.8, .2, 1100, .5); noise(.7, .17, 300, .6); tone(82, .8, 'sawtooth', .05, 52); thump(62, 30, .5, .2); tone(1320, .5, 'sine', .018, 0, .05); tone(1980, .35, 'sine', .01, 0, .08); },
    roar: () => { noise(.55, .17, 1150, .5); noise(.5, .14, 300, .6); tone(86, .55, 'sawtooth', .045, 56); thump(66, 32, .35, .17); tone(1400, .35, 'sine', .014, 0, .04); },
    tell: () => { noise(.3, .09, 900, .9); noise(.3, .08, 1700, .9, .14); tone(70, .45, 'sawtooth', .035, 96); tone(990, .3, 'sine', .012, 1320, .1); },
    slam: () => { thump(84, 32, .34, .3); noise(.25, .2, 260, .8); shatter(.12, .02); },
    whoosh: () => { noise(.3, .12, 520, .6); noise(.2, .06, 1500, .8, .05); },
    swing: () => { noise(.18, .1, 700, .7); },
    charge: (p) => { tone(660, .4, 'sine', .028 + .006 * p, 990); tone(990, .34, 'sine', .014, 1480, .03); noise(.35, .05, 1400, .8); },
    crunch: () => { thump(120, 48, .16, .22); noise(.1, .2, 1200, 1.2); shatter(.1); },
    shoot: () => { noise(.12, .09, 1000, .8); tone(700, .12, 'sine', .02, 1100); },
    hurt: () => { noise(.13, .11, 1300, 1.2); tone(300, .13, 'sawtooth', .02, 190); tone(R(1500, 1700), .12, 'sine', .016); },
    stagger: () => { shatter(.2); noise(.4, .16, 1000, .6, .02); thump(96, 36, .3, .26); tone(140, .4, 'sawtooth', .03, 70, .04); },
    death: () => { noise(1, .18, 900, .5); tone(96, 1, 'sawtooth', .05, 32); thump(64, 24, .8, .3); for (let i = 0; i < 5; i++) tone(R(1100, 2400), .3, 'sine', .016, 0, .1 + i * .11); noise(.06, .12, 4200, 2, .2); },
  };
  // THE TY'IGA, by the shape it wears: the shadow-wolf (snarls and snapping jaws), the Drake (fire-roar and wingbeats),
  // the Mask of a Thousand Faces (a chord of voices that do not quite agree)
  V.ty1 = {
    intro: () => { snarl(118, 6, .07, .045); noise(.5, .15, 520, .8); tone(110, .6, 'triangle', .045, 160, .1); tone(220, .5, 'sawtooth', .02, 300, .12); thump(70, 34, .4, .2); },
    roar: () => { snarl(122, 5, .06, .042); tone(118, .45, 'triangle', .04, 160, .05); tone(236, .4, 'sawtooth', .018, 310, .07); noise(.4, .13, 560, .8); },
    tell: () => { snarl(96, 5, .065, .04); noise(.34, .07, 420, 1); },
    slam: () => { thump(96, 36, .3, .3); noise(.2, .2, 260, .8); noise(.1, .08, 2600, 2, .02); },
    whoosh: () => { noise(.18, .1, 800, .7); noise(.1, .05, 2200, .9, .02); },
    swing: () => { noise(.12, .09, 1700, 1); noise(.05, .06, 3000, 2, .04); },
    charge: () => { snarl(88, 4, .08, .03); noise(.3, .06, 380, 1); },
    crunch: () => { noise(.03, .2, 1800, 2); thump(170, 60, .12, .22); noise(.08, .14, 600, 1.4, .01); },
    shoot: () => { noise(.1, .08, 900, 1); },
    hurt: () => { tone(380, .14, 'sawtooth', .022, 250); noise(.1, .1, 900, 1.2); thump(140, 70, .08, .1); },
    stagger: () => { tone(420, .3, 'sawtooth', .03, 200); noise(.25, .14, 800, 1); thump(100, 40, .26, .26); },
    death: () => { tone(330, .8, 'sawtooth', .03, 140); tone(165, .9, 'triangle', .045, 70); noise(.8, .15, 600, .7); thump(70, 26, .7, .3); },
  };
  V.ty2 = {
    intro: () => { noise(.75, .2, 340, .6); noise(.6, .12, 1000, .6, .05); tone(74, .75, 'sawtooth', .05, 48); thump(60, 30, .5, .24); noise(.15, .12, 220, .7, .45); },
    roar: () => { noise(.5, .18, 340, .6); noise(.45, .1, 1050, .6, .04); tone(80, .5, 'sawtooth', .045, 52); thump(66, 32, .35, .2); },
    tell: () => { noise(.14, .12, 240, .7); noise(.14, .1, 240, .7, .2); tone(84, .4, 'sawtooth', .03, 120, .05); noise(.3, .05, 900, .6, .1); },
    slam: () => { thump(88, 32, .34, .32); noise(.28, .22, 240, .8); noise(.2, .08, 1200, .6, .03); },
    whoosh: () => { noise(.16, .13, 260, .7); noise(.12, .06, 700, .7, .02); },
    swing: () => { noise(.14, .1, 400, .7); },
    charge: () => { noise(.45, .1, 700, .5); tone(90, .45, 'sawtooth', .03, 150); },
    crunch: () => { thump(110, 44, .18, .24); noise(.14, .2, 500, 1.2); },
    shoot: () => { noise(.14, .1, 600, .6); tone(200, .12, 'sawtooth', .015, 120); },
    hurt: () => { noise(.12, .11, 700, 1); tone(200, .16, 'sawtooth', .022, 130); thump(130, 60, .08, .1); },
    stagger: () => { noise(.12, .16, 240, .7); noise(.3, .14, 900, .7, .05); thump(84, 32, .32, .28); tone(150, .4, 'sawtooth', .03, 70); },
    death: () => { noise(.9, .18, 380, .6); tone(90, 1, 'sawtooth', .05, 30); thump(62, 24, .8, .3); noise(.15, .12, 230, .7, .3); noise(.15, .08, 230, .7, .6); },
  };
  V.ty3 = {
    intro: () => { [98, 147, 196.5, 233].forEach((f, i) => tone(f * R(.99, 1.01), .8, 'sawtooth', .02, f * .9, i * .03)); noise(.7, .1, 700, .6); thump(64, 30, .5, .22); beat(392, .6, .008, 3.5, 'sine', 0, .1); },
    roar: () => { [104, 156, 208.5].forEach((f, i) => tone(f * R(.98, 1.02), .55, 'sawtooth', .022, f * .88, i * .025)); noise(.45, .1, 760, .6); thump(70, 32, .32, .18); },
    tell: () => { beat(196, .5, .03, 3, 'triangle', 220); beat(294, .45, .014, 4.5, 'sine', 330, .05); noise(.3, .04, 1200, .7); },
    slam: () => { thump(90, 34, .32, .3); noise(.24, .2, 260, .8); beat(150, .3, .02, 6, 'sawtooth', 110); },
    whoosh: () => { noise(.2, .09, 1100, .6); beat(330, .18, .008, 7, 'sine', 260); },
    swing: () => { noise(.14, .09, 1400, .8); },
    charge: (p) => { beat(220, .5, .026 + .004 * p, 2.5, 'sine', 330); beat(330, .45, .012, 3.7, 'sine', 495, .04); },
    crunch: () => { thump(130, 50, .16, .24); noise(.08, .2, 900, 1.4); beat(180, .2, .02, 9, 'sawtooth', 120); },
    shoot: () => { noise(.1, .08, 1300, 1); tone(500, .12, 'sine', .02, 300); },
    hurt: () => { beat(260, .16, .02, 11, 'sawtooth', 200); noise(.08, .08, 1500, 1); thump(140, 70, .07, .1); },
    stagger: () => { [180, 240, 300].forEach((f, i) => tone(f, .4, 'sawtooth', .02, f * .55, i * .02)); noise(.3, .12, 900, .7); thump(90, 34, .3, .26); },
    death: () => { [98, 131, 175, 233, 311].forEach((f, i) => tone(f * R(.98, 1.02), 1, 'sawtooth', .016, f * .5, i * .05)); noise(.9, .14, 700, .6); thump(62, 24, .8, .3); },
  };
  // THE PHANTOM OF BENEDICT, by his shape. The man: no roars; steel that rings, a sharp breath, the scrape of boots
  V.ben1 = {
    intro: () => { breath(.2, .12, 1900); scrape(.42, .12, 3600, .12); ring(1250, .55, .028, .12); scrape(.14, .07, 420, .02); thump(140, 70, .1, .1, .02); },
    roar: () => { breath(.16, .12, 1800); ring(1180, .45, .024, .04); scrape(.12, .08, 500); thump(130, 60, .1, .12); },
    tell: () => { breath(.22, .08, 1500); scrape(.18, .08, 420, .04); ring(1320, .3, .016, .12); },
    slam: () => { thump(120, 52, .16, .26); noise(.08, .12, 420, 1.2); ring(980, .3, .02, .01); },
    whoosh: () => { noise(.12, .1, 3000, 1.2); noise(.1, .06, 1200, 1, .01); },
    swing: () => { noise(.1, .09, 3200, 1.3); },
    charge: () => { ring(1400, .35, .022); scrape(.2, .06, 3800); },
    crunch: () => { noise(.03, .16, 3400, 3); ring(820, .25, .03); thump(130, 60, .08, .14); },
    shoot: () => { noise(.06, .08, 2400, 1.5); tone(800, .08, 'triangle', .02, 400); },
    hurt: () => { breath(.09, .1, 1100); noise(.03, .06, 5200, 3, .01); thump(130, 80, .06, .1); },
    stagger: () => { breath(.14, .12, 1000); scrape(.22, .1, 3000, .02); ring(700, .3, .03, .04); thump(110, 50, .2, .22, .02); },
    death: () => { breath(.4, .1, 900); ring(600, 1, .03, .1); scrape(.5, .08, 2800, .15); thump(90, 40, .5, .26, .3); },
  };
  // the Host of Benedict: a war-cry of many throats, a horn, shields and pikes
  V.ben2 = {
    intro: () => { [196, 233, 262, 294].forEach((f, i) => tone(f * R(.97, 1.03), .6, 'sawtooth', .014, f * .85, i * .03)); noise(.6, .14, 800, .5); tone(147, .6, 'sawtooth', .035, 147, .1); thump(70, 34, .4, .24); },
    roar: () => { [200, 238, 266, 300].forEach((f, i) => tone(f * R(.97, 1.03), .45, 'sawtooth', .013, f * .85, i * .03)); noise(.45, .13, 820, .5); thump(76, 34, .3, .2); },
    tell: () => { tone(147, .42, 'sawtooth', .032, 150); tone(220, .42, 'sawtooth', .016, 224); clicks(5, .06, .1, 1800, .02); },
    slam: () => { thump(96, 36, .3, .3); noise(.2, .2, 300, .8); clicks(5, .03, .12, 3000, .02); },
    whoosh: () => { noise(.3, .1, 900, .5); clicks(4, .05, .07, 600); },
    swing: () => { noise(.12, .09, 2600, 1.2); },
    charge: () => { tone(147, .4, 'sawtooth', .03, 196); noise(.35, .06, 1500, .7); },
    crunch: () => { thump(120, 50, .14, .22); clicks(4, .025, .14, 3200); },
    shoot: () => { noise(.1, .09, 2800, 1.4); noise(.15, .05, 900, .8, .03); },
    hurt: () => { [240, 290].forEach(f => tone(f * R(.95, 1.05), .14, 'sawtooth', .014, f * .8)); noise(.08, .09, 1000, 1); thump(130, 70, .07, .1); },
    stagger: () => { clicks(7, .03, .14, 2800); thump(96, 36, .3, .26); noise(.3, .12, 600, .7); },
    death: () => { [196, 233, 262].forEach((f, i) => tone(f, .9, 'sawtooth', .014, f * .5, i * .04)); clicks(10, .05, .1, 2600, .1); thump(70, 28, .7, .28); noise(.8, .12, 500, .6); },
  };
  // the Swordsman in the Stars: glass and silver, a slow shimmer under it
  V.ben3 = {
    intro: () => { [784, 1175, 1568].forEach((f, i) => tone(f, .7, 'sine', .016, 0, i * .07)); beat(98, .9, .05, 2, 'sine', 0); thump(58, 30, .6, .2); noise(.6, .04, 3000, .6); },
    roar: () => { [880, 1320].forEach((f, i) => tone(f, .5, 'sine', .016, 0, i * .06)); beat(110, .6, .045, 2.5); thump(64, 32, .4, .18); },
    tell: () => { [660, 880, 1100].forEach((f, i) => tone(f, .22, 'sine', .02, 0, i * .07)); beat(165, .4, .02, 3); },
    slam: () => { thump(86, 32, .32, .3); noise(.22, .18, 260, .8); shatter(.12, .02); },
    whoosh: () => { noise(.24, .08, 2000, .5); beat(1320, .2, .006, 5); },
    swing: () => { noise(.14, .08, 2600, .8); tone(1600, .1, 'sine', .01); },
    charge: () => { beat(440, .4, .022, 3); tone(880, .35, 'sine', .01, 1320); },
    crunch: () => { thump(120, 50, .14, .2); shatter(.14); },
    shoot: () => { tone(1200, .12, 'sine', .022, 700); noise(.05, .07, 3600, 2); },
    hurt: () => { tone(R(1300, 1500), .14, 'sine', .024); beat(220, .15, .02, 7); noise(.05, .06, 3000, 2); },
    stagger: () => { shatter(.2); beat(147, .4, .04, 3); thump(96, 36, .26, .24); },
    death: () => { for (let i = 0; i < 6; i++) tone(R(800, 1800), .4, 'sine', .014, 0, i * .09); beat(98, 1.1, .05, 1.5, 'sine', 70); thump(60, 26, .7, .26); },
  };
  // the Moon Panoply: a creature of swords; many blades scraping, great steel rings, sword-feet on stone
  V.ben4 = {
    intro: () => { ring(196, .9, .04); ring(262, .8, .024, .05); scrape(.5, .1, 3000, .02); thump(56, 28, .7, .28); noise(.6, .1, 220, .6); },
    roar: () => { ring(208, .6, .036); scrape(.4, .09, 3200); thump(62, 30, .45, .22); noise(.4, .08, 240, .6); },
    tell: () => { scrape(.35, .12, 3000); clicks(4, .07, .12, 4200, .05); ring(300, .3, .018, .12); },
    slam: () => { thump(84, 30, .36, .32); noise(.24, .18, 240, .8); ring(240, .4, .028, .01); },
    whoosh: () => { noise(.2, .12, 1800, .9); noise(.18, .06, 600, .8); },
    swing: () => { noise(.14, .1, 2400, 1.1); },
    charge: () => { ring(330, .45, .026); scrape(.35, .05, 4000); },
    crunch: () => { thump(110, 44, .16, .24); noise(.03, .16, 3200, 3); ring(420, .3, .026); },
    shoot: () => { noise(.08, .09, 2600, 1.4); },
    hurt: () => { ring(R(520, 600), .22, .022); noise(.03, .1, 3800, 3); thump(110, 60, .08, .12); },
    stagger: () => { ring(180, .6, .04); clicks(6, .04, .14, 3600, .02); thump(88, 32, .3, .28); },
    death: () => { ring(150, 1.1, .045); for (let i = 0; i < 8; i++) noise(.025, .12, R(2800, 4400), 5, .15 + i * .09); thump(56, 24, .9, .32); scrape(.6, .08, 2600, .1); },
  };
  // THE SLEEPER: something vast dreaming; slow detuned beating tones, breathing like a snore
  V.sleeper = {
    intro: () => { beat(110, 1.1, .05, 2.2); beat(165, 1, .025, 1.7, 'triangle', 0, .1); noise(.9, .06, 420, .5); thump(58, 34, .6, .16); },
    roar: () => { tone(66, .6, 'sawtooth', .045, 54); noise(.6, .15, 250, .9); beat(98, .7, .04, 3); thump(64, 36, .4, .16); },
    tell: () => { beat(147, .5, .04, 2.5, 'sine', 131); noise(.4, .05, 330, .7); },
    charge: (p) => { beat(220, .55, .035 + .006 * p, 3.2, 'sine', 247); beat(330, .5, .014, 2.1, 'triangle', 370, .06); },
    slam: () => { thump(70, 32, .4, .3); noise(.26, .12, 200, .8); beat(147, .35, .022, 4, 'sine', 139); },
    whoosh: () => { noise(.26, .09, 680, .5); },
    swing: () => { noise(.18, .08, 900, .6); },
    shoot: () => { tone(400, .14, 'sine', .03, 220); noise(.06, .05, 1200, 1); },
    crunch: () => { thump(100, 44, .16, .22); noise(.1, .14, 500, 1.2); },
    hurt: () => { beat(130, .3, .04, 4.5, 'triangle', 110); noise(.2, .05, 380, .8); },
    stagger: () => { thump(80, 36, .3, .26); beat(110, .5, .04, 3, 'sawtooth', 82); noise(.4, .1, 300, .7); },
    death: () => { beat(196, 1.2, .04, 1.6, 'sine', 98); beat(147, 1.1, .035, 2.3, 'triangle', 73, .1); noise(1, .07, 400, .5); thump(56, 26, .8, .26); },
  };
  // THE KING IN THE GLASS: sea and mirror; glassy rings, water booms, the rush of a wave
  V.king = {
    intro: () => { [392, 587, 784].forEach((f, i) => tone(f, .7, 'sine', .016, f * .985, i * .08)); thump(55, 36, .8, .22); noise(.8, .09, 340, .5); },
    roar: () => { noise(.55, .16, 560, .6); ring(660, .4, .02, .02); tone(70, .5, 'sawtooth', .04, 46); thump(60, 34, .4, .2); },
    tell: () => { tone(520, .26, 'sine', .035, 880); tone(1040, .18, 'sine', .012, 1560, .06); clicks(4, .05, .06, 900); noise(.25, .04, 600, .6); },
    slam: () => { thump(76, 32, .32, .3); noise(.3, .18, 300, .7); ring(1180, .3, .016, .02); },
    whoosh: () => { noise(.34, .1, 600, .5); },
    swing: () => { noise(.18, .09, 1000, .7); },
    charge: () => { tone(440, .4, 'sine', .028, 660); tone(880, .3, 'sine', .01, 1320, .05); },
    crunch: () => { thump(110, 48, .14, .2); shatter(.14); },
    shoot: () => { tone(1500, .1, 'sine', .022, 800); noise(.06, .08, 3200, 2); },
    hurt: () => { tone(R(1500, 1700), .12, 'sine', .028); noise(.06, .08, 2600, 2); thump(120, 60, .07, .1); },
    stagger: () => { shatter(.2); thump(90, 36, .3, .26); noise(.3, .1, 500, .7, .02); },
    death: () => { shatter(.22); for (let i = 0; i < 6; i++) tone(R(900, 2000) * (1 - i * .08), .35, 'sine', .016, 0, .06 + i * .1); thump(54, 26, .9, .28); noise(.9, .1, 300, .5, .05); },
  };
  // THE GOAT-LORD, by his shape: the Goat-Lord (bleats and hooves), the Tithe (his engine: ratchet, creaking timber,
  // millstones), the Horned Gate (iron groans, chains), the curse (a low dissonant chord and a whisper)
  V.goat1 = {
    intro: () => { bleat(150, 7, .07, .035); noise(.55, .14, 640, .7); thump(66, 30, .5, .24); noise(.1, .1, 300, 1, .4); },
    roar: () => { bleat(158, 5, .065, .035); noise(.4, .12, 680, .7); thump(72, 32, .3, .2); },
    tell: () => { noise(.12, .12, 320, 1); noise(.08, .1, 1500, 1.5, .12); thump(96, 50, .1, .14, .02); noise(.18, .08, 2600, 3, .2); },
    slam: () => { thump(90, 32, .32, .32); noise(.24, .2, 260, .8); tone(420, .1, 'triangle', .035, 380); },
    whoosh: () => { noise(.18, .1, 1000, .7); },
    swing: () => { noise(.12, .09, 1600, 1); },
    charge: () => { bleat(120, 4, .08, .02); noise(.35, .06, 500, .8); },
    crunch: () => { thump(130, 56, .14, .22); noise(.06, .16, 1100, 2); },
    shoot: () => { noise(.1, .08, 1200, 1); },
    hurt: () => { bleat(240, 2, .05, .022); noise(.08, .08, 900, 1); thump(140, 70, .07, .1); },
    stagger: () => { bleat(200, 3, .06, .03); thump(92, 34, .3, .26); noise(.3, .12, 500, .8); },
    death: () => { bleat(140, 8, .09, .03); tone(110, 1, 'sawtooth', .03, 40, .2); thump(60, 24, .8, .3, .2); noise(.8, .14, 300, .6, .2); },
  };
  V.goat2 = {
    roar: () => { tone(90, .5, 'sawtooth', .035, 70); noise(.45, .08, 600, 4); clicks(6, .06, .12, 1600); thump(70, 34, .35, .2); },
    tell: () => { clicks(6, .06, .15, 1500); noise(.4, .07, 500, 5, .05); },
    slam: () => { thump(80, 32, .34, .32); noise(.26, .2, 200, .8); noise(.06, .12, 900, 3, .01); },
    whoosh: () => { noise(.22, .1, 700, .6); clicks(2, .05, .08, 1200); },
    swing: () => { noise(.14, .09, 1200, .8); },
    charge: () => { clicks(8, .05, .12, 1400); tone(70, .45, 'sawtooth', .03, 90); },
    crunch: () => { thump(100, 44, .18, .24); noise(.2, .18, 400, 1.3); noise(.25, .06, 300, 5, .05); },
    shoot: () => { noise(.06, .08, 900, 2); thump(150, 70, .08, .12); },
    hurt: () => { noise(.12, .07, 560, 5); thump(130, 70, .07, .1); bleat(230, 2, .05, .016); },
    stagger: () => { noise(.4, .1, 480, 5); thump(90, 34, .3, .26); clicks(5, .05, .12, 1500); },
    death: () => { noise(.7, .1, 450, 5); thump(60, 24, .8, .3); clicks(8, .08, .12, 1400, .05); },
  };
  V.goat3 = {
    roar: () => { tone(52, .7, 'sawtooth', .05, 42); tone(78, .6, 'sawtooth', .025, 64); noise(.6, .14, 180, .6); clicks(6, .045, .09, 3000, .1); thump(56, 30, .5, .24); },
    tell: () => { tone(62, .5, 'sawtooth', .04, 48); clicks(5, .05, .1, 3200, .08); noise(.4, .06, 200, .7); },
    slam: () => { thump(76, 28, .4, .32); noise(.3, .2, 180, .8); clicks(4, .03, .1, 3000, .02); },
    whoosh: () => { noise(.26, .1, 500, .6); },
    swing: () => { noise(.16, .09, 900, .8); },
    charge: () => { tone(55, .5, 'sawtooth', .04, 82); noise(.45, .07, 220, .8); },
    crunch: () => { thump(100, 40, .18, .24); noise(.12, .18, 400, 1.3); clicks(3, .03, .1, 3000); },
    shoot: () => { noise(.08, .08, 1000, 1); },
    hurt: () => { tone(90, .2, 'sawtooth', .03, 70); clicks(2, .04, .08, 3000); thump(110, 60, .08, .1); },
    stagger: () => { tone(70, .45, 'sawtooth', .04, 46); thump(84, 32, .32, .28); clicks(6, .04, .12, 2800); },
    death: () => { tone(58, 1, 'sawtooth', .05, 28); thump(54, 22, .9, .32); noise(.9, .16, 170, .6); clicks(10, .07, .1, 2800, .1); },
  };
  V.goat4 = {
    roar: () => { beat(73, .65, .03, 4.7, 'sawtooth', 69); tone(104, .6, 'sawtooth', .016, 98); noise(.55, .06, 2200, .6); thump(60, 32, .45, .22); },
    tell: () => { beat(82, .5, .03, 5.3, 'sawtooth', 78); noise(.4, .06, 2400, .6, .05); },
    slam: () => { thump(80, 30, .36, .32); noise(.26, .18, 200, .8); beat(110, .3, .016, 7, 'sawtooth', 100); },
    whoosh: () => { noise(.26, .08, 1800, .6); },
    swing: () => { noise(.16, .08, 2000, .7); },
    charge: () => { beat(98, .5, .03, 3.9, 'sawtooth', 110); noise(.4, .05, 2600, .6); },
    crunch: () => { thump(110, 44, .16, .22); noise(.1, .14, 600, 1.2); },
    shoot: () => { noise(.1, .07, 2000, .8); },
    hurt: () => { beat(130, .2, .024, 9, 'sawtooth', 110); noise(.1, .05, 2400, .7); thump(120, 60, .07, .1); },
    stagger: () => { beat(90, .45, .035, 6, 'sawtooth', 60); thump(86, 32, .3, .26); noise(.3, .07, 2200, .6); },
    death: () => { beat(73, 1.1, .03, 3.1, 'sawtooth', 37); beat(110, 1, .016, 4.4, 'sawtooth', 55, .05); noise(1, .07, 2200, .5); thump(54, 22, .9, .32); bleat(130, 6, .1, .02, .25); },
  };
  // a shape without an entrance of its own (he only changes into it) keeps the first shape's
  for (const k of ['goat2', 'goat3', 'goat4']) V[k].intro = V.goat1.intro;

  // ---------------- which voice ----------------
  const voiceOf = (e) => {
    if (!e || !e.boss || !e.def) return null;
    switch (e.def.draw) {
      case 'mossback': return 'moss';
      case 'colossus': return 'colossus';
      case 'wyrm': return 'wyrm';
      case 'tyiga': return 'ty' + Math.min(3, Math.max(1, e.phase || 1));
      case 'w5benedict': return 'ben' + Math.min(4, Math.max(1, e.bph || 1));
      case 'w6sleeper': return 'sleeper';
      case 'w7king': return 'king';
      case 'w8goat': return 'goat' + Math.min(4, Math.max(1, e.w8form || 1));
    }
    return null;
  };
  // how often each may sound (seconds): the hurt grunt at most every .6, calls never on top of each other
  const GAP = { intro: 2, roar: .4, tell: .3, slam: .08, whoosh: .06, swing: .05, charge: .12, crunch: .08, shoot: .05, hurt: .6, stagger: .5, death: 2 };
  const UNDER = { intro: 1, roar: .7, tell: .45, stagger: .5, death: 1.1 }; // (the corrupted lord's undertone, and how long)
  // each sound's level, set by rendering them all offline (sfxboss.cjs) against the core set: calls and deaths no louder
  // than the core roar and slam (about -10 dBFS at peak), wind-up cues near -19, hurt grunts near -20
  const TRIM = { 'moss-hurt': 0.63, 'moss-stagger': 0.82, 'moss-death': 0.82, 'colossus-slam': 0.89, 'colossus-shoot': 0.6, 'colossus-hurt': 0.74, 'colossus-death': 0.8, 'wyrm-roar': 0.85, 'wyrm-tell': 1.74, 'wyrm-hurt': 1.72, 'wyrm-death': 0.76, 'ty1-intro': 1.3, 'ty1-roar': 3, 'ty1-tell': 2.66, 'ty1-death': 0.83, 'ty2-tell': 3.35, 'ty2-death': 0.78, 'ty3-intro': 1.17, 'ty3-roar': 1.16, 'ty3-tell': 1.64, 'ty3-death': 0.85, 'ben1-intro': 1.7, 'ben1-roar': 1.3, 'ben1-tell': 2.5, 'ben1-slam': 1.17, 'ben1-crunch': 1.19, 'ben1-stagger': 1.17, 'ben2-tell': 3.3, 'ben3-tell': 1.95, 'ben3-hurt': 1.38, 'ben4-tell': 2.75, 'ben4-hurt': 0.77, 'sleeper-intro': 1.26, 'sleeper-tell': 1.35, 'sleeper-hurt': 1.33, 'sleeper-stagger': 0.85, 'king-intro': 1.19, 'king-tell': 2.16, 'king-charge': 1.43, 'goat1-charge': 1.23, 'goat1-shoot': 1.48, 'goat2-tell': 3.98, 'goat2-charge': 1.38, 'goat2-shoot': 0.62, 'goat2-hurt': 1.17, 'goat3-roar': 0.8, 'goat3-tell': 2.79, 'goat3-shoot': 1.41, 'goat3-death': 0.83, 'goat4-roar': 0.82, 'goat4-tell': 2.11, 'goat4-death': 0.78 };
  let BP = 1, CURSED = false;
  window.SFX_EXTRA = window.SFX_EXTRA || {};
  for (const v in V) for (const s in V[v]) {
    const key = 'boss-' + v + '-' + s, fn = V[v][s];
    SFX_GAP[key] = GAP[s] ?? .05;
    if (key === 'boss-ty2-whoosh') SFX_GAP[key] = .35; // (the Drake's wingbeats: steady, not a flutter)
    const g = TRIM[v + '-' + s] || 1;
    SFX_EXTRA[key] = () => { if (BSX.debug) log.push(key); const k0 = VOLK; VOLK = k0 * g * (CURSED && UNDER[s] ? .84 : 1); try { fn(BP); } finally { VOLK = k0; } if (CURSED && UNDER[s]) under(UNDER[s]); };
  }
  const _sfx = sfx;
  const log = [];
  let CTX = null, LIMIT = null, MUTE = null;
  // play one of a boss's own sounds; false if it has none for that (then the caller plays the generic one)
  function play(e, slot, power = 1, p = 1) {
    const v = voiceOf(e); if (!v || !V[v][slot]) return false;
    const key = 'boss-' + v + '-' + slot;
    const c = CTX, b = BP, cu = CURSED; CTX = null; BP = p; CURSED = !!(e.cB || e.cursed);
    try { _sfx(key, power); } finally { CTX = c; BP = b; CURSED = cu; }
    return true;
  }
  const MAP = { roar: 'roar', growl: 'tell', slam: 'slam', whoosh: 'whoosh', swing: 'swing', charge: 'charge', crunch: 'crunch', shoot: 'shoot' };
  const HIT = { charge: 1 }; // (core.js treats these as hits: their power is how hard, not how loud)
  sfx = function (k, power = 1) {
    if (MUTE && MUTE[k]) { MUTE[k] = 2; return; }
    const e = CTX, slot = e && MAP[k];
    if (slot && (!LIMIT || LIMIT[k])) {
      if (slot === 'roar' && !e.bsxIntro) { e.bsxIntro = now(); if (play(e, 'intro')) return; }
      else if (slot === 'roar' && now() - e.bsxIntro < 1.5) return; // (its entrance call already said it)
      if (HIT[k] ? play(e, slot, 1, power) : play(e, slot, power, power)) return;
    }
    return _sfx(k, power);
  };
  // run fn as the boss e's own code (or, with e null, as nobody's); the hazards it starts are marked as its
  function run(e, fn, limit = null) {
    const c = CTX, l = LIMIT;
    if (typeof hazards !== 'undefined') for (const h of hazards) if (h.bsx === undefined) h.bsx = c;
    CTX = e; LIMIT = limit;
    try { return fn(); } finally {
      if (typeof hazards !== 'undefined') for (const h of hazards) if (h.bsx === undefined) h.bsx = e;
      CTX = c; LIMIT = l;
    }
  }
  // its entrance call, for a boss that does not roar as it comes on
  function introCheck(e) {
    if (e.bsxIntro || e.dead) return;
    const t = now(); if (!e.bsxSeen) e.bsxSeen = t;
    const wait = { w6sleeper: .3, w7king: .3 }[e.def.draw] ?? 2.2;
    if (t - e.bsxSeen >= wait && typeof stage !== 'undefined' && stage && stage.bossRoom) { e.bsxIntro = t; play(e, 'intro'); }
  }
  const bossNow = () => (typeof boss !== 'undefined' && boss && boss.boss && !boss.dead ? boss : null);

  // ---------------- the hooks ----------------
  { const _u = updateEnemy; updateEnemy = function (e, dt) { if (!e || !e.boss) return _u.apply(this, arguments); introCheck(e); return run(e, () => _u.apply(this, arguments)); }; }
  // a boss room's own rule is its boss's (the sleeper, the King and the Goat-Lord are run by theirs)
  let kingCur = null;
  { const _m = updateMech; updateMech = function (dt) {
    const e = typeof stage !== 'undefined' && stage && stage.bossRoom ? bossNow() : null;
    if (!e) return _m.apply(this, arguments);
    introCheck(e);
    const r = run(e, () => _m.apply(this, arguments));
    if (e.def.draw === 'w7king' && window.W7 && W7.G) { const c = W7.G.cur || null; if (c && c !== kingCur && !e.dead) play(e, 'tell'); kingCur = c; } // (his attacks start inside his rule: the cue as each begins)
    return r;
  }; }
  // hazards a boss set going sound in its voice for as long as they run
  const wrapHz = () => { for (const k in HAZARD_FX) { const H = HAZARD_FX[k]; if (!H || typeof H.update !== 'function' || H.update.bsx) continue;
    const u = H.update; H.update = function (h, dt) { const o = h && (h.bsx || (h.e && h.e.boss ? h.e : null)); if (o && o !== CTX && !o.dead) return run(o, () => u.apply(this, arguments)); return u.apply(this, arguments); }; H.update.bsx = 1; } };
  wrapHz();
  { const _uh = updateHazards; updateHazards = function (dt) { if (bossNow()) wrapHz(); return _uh.apply(this, arguments); }; } // (kinds registered later get it too)
  // what the player and the other foes do is nobody's voice, even when a boss's attack sets it off
  { const _pd = playerDamage; playerDamage = function () { return run(null, () => _pd.apply(this, arguments)); }; }
  { const _st = strike; strike = function () { return run(null, () => _st.apply(this, arguments)); }; }
  { const _sp = spawnEnemy; spawnEnemy = function () { return run(null, () => _sp.apply(this, arguments)); }; }
  // hurt: a grunt (at most every .6 s); its stagger's crunch becomes its own stagger sound; a shape-change it sets off
  // (the Goat-Lord's, the Phantom's) calls in the boss's voice
  { const _he = hurtEnemy; hurtEnemy = function (e, dmg) {
    if (!e || !e.boss || e.dead) return run(null, () => _he.apply(this, arguments));
    const hp0 = e.hp, m0 = MUTE, mute = { crunch: 1 }; MUTE = mute; let r;
    try { r = run(e, () => _he.apply(this, arguments), { roar: 1, growl: 1, slam: 1 }); } finally { MUTE = m0; }
    if (!e.dead) { if (mute.crunch === 2) { if (!play(e, 'stagger')) _sfx('crunch'); } else if (e.hp < hp0) play(e, 'hurt'); }
    return r;
  }; }
  // death: its own fall, in place of the generic boom
  { const _ke = killEnemy; killEnemy = function (e) {
    if (!e || !e.boss || e.dead) return run(null, () => _ke.apply(this, arguments));
    const m0 = MUTE, mute = { slam: 1 }; MUTE = mute; let r;
    try { r = run(null, () => _ke.apply(this, arguments)); } finally { MUTE = m0; }
    if (e.dead) { e.bsxDied = 1; if (!play(e, 'death') && mute.slam === 2) _sfx('slam'); } else if (mute.slam === 2) _sfx('slam');
    return r;
  }; }
  return { run, play, voiceOf, V, log, debug: false };
})();
window.BSX = BSX;
