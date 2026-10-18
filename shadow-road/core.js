'use strict';
// ---------- shared constants & helpers ----------
let VW = 640; // widens on long phones so they see more street
const VH = 360, FLOOR_TOP = 238, FLOOR_BOT = 346;
// how much of the scene the camera shows (it crops the top of the sky so fighters read bigger); boss fights pull back
const VIEW_NORMAL = 276, VIEW_BOSS = 318;
let VIEW_H = VIEW_NORMAL, Y_OFF = VH - VIEW_H;
function setZoom(h) { if (VIEW_H === h) return; VIEW_H = h; Y_OFF = VH - VIEW_H; if (typeof layout === 'function') layout(); }
const GRAV = 1000, TAU = Math.PI * 2;
const $ = (s) => document.querySelector(s);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const app = $('#app'), cv = $('#cv');
let ctx = cv.getContext('2d');
let K = 1; // canvas pixels per world unit

// ---------- save ----------
const SAVE_KEY = 'shadowroad-save-v2';
const freshSave = () => ({
  stage: 0, shards: 0, sigils: 0, cycle: 0, started: false,
  owned: { fists: true, hammer: false, staff: false, sword: false, rapier: false },
  wl: { fists: 1, hammer: 1, staff: 1, sword: 1, rapier: 1 },
  armor: 1, weapon: 'fists', pity: {},
  trumps: { stag: false, brand: false, mirror: false, phoenix: false, stillness: false }, trump: null, tlv: {},
});
let save = freshSave();
try {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) {
    const s = JSON.parse(raw), f = freshSave();
    save = Object.assign(f, s, { owned: Object.assign(f.owned, s.owned), wl: Object.assign(f.wl, s.wl), trumps: Object.assign(f.trumps, s.trumps) });
  }
} catch (e) {}
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }

// ---------- sound (synthesized, starts on first touch) ----------
let actx = null, noiseBuf = null, sfxOn = true;
try { sfxOn = localStorage.getItem('shadowroad-sfx') !== '0'; } catch (e) {}
// iPhones mute web audio when the ring/silent switch is on. Asking for 'playback' audio (like a music or video app)
// lets the game be heard anyway; the Sound and Music buttons in the pause menu still turn it off.
let silentFix = null;
function unmuteOnSilent() {
  try { if (navigator.audioSession) { navigator.audioSession.type = 'playback'; return; } } catch (e) {}
  if (silentFix) return; // older iPhones: a silent, looping media element puts the page in the same playback mode
  try {
    const n = 2048, b = new Uint8Array(44 + n), v = new DataView(b.buffer), w = (o, t) => [...t].forEach((c, i) => b[o + i] = c.charCodeAt(0));
    w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true); b.fill(128, 44);
    silentFix = new Audio(URL.createObjectURL(new Blob([b], { type: 'audio/wav' }))); silentFix.loop = true; silentFix.setAttribute('playsinline', '');
    silentFix.play().catch(() => { silentFix = null; });
  } catch (e) { silentFix = null; }
}
function audioInit() {
  unmuteOnSilent();
  if (actx) { if (actx.state !== 'running') actx.resume().catch(() => {}); return; }
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    noiseBuf = actx.createBuffer(1, actx.sampleRate * 0.4, actx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { actx = null; }
  if (actx && musicWant) playMusic(musicWant); // music waits for the first touch
}
function tone(freq, dur, type, vol, slide, delay = 0) {
  const t0 = actx.currentTime + delay;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0 + dur);
}
function noise(dur, vol, freq, q = 0.8) {
  const s = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
  s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(vol, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
  s.connect(f).connect(g).connect(actx.destination); s.start(); s.stop(actx.currentTime + dur);
}
// hit sounds are layered per material, and get deeper and longer the harder the hit
function sfx(k, power = 1) {
  if (!sfxOn || !actx) return;
  try {
    switch (k) {
      case 'swing': noise(0.09, 0.1, 2600 + Math.random() * 800, 1.2); break;
      case 'whoosh': noise(0.2, 0.14, 1400, 0.6); break;
      case 'hit-flesh': noise(0.08 + 0.06 * power, 0.32, 700 - 200 * power); tone(150 - 40 * power, 0.1 + 0.08 * power, 'square', 0.09, 50); break;
      case 'hit-goo': noise(0.12, 0.25, 400); tone(320, 0.15, 'sine', 0.12, 90); break;
      case 'hit-metal': noise(0.06, 0.25, 3200, 3); tone(880 - 200 * power, 0.18, 'triangle', 0.08, 600); tone(1320, 0.12, 'square', 0.03); break;
      case 'hit-crystal': tone(1500 + Math.random() * 400, 0.25, 'sine', 0.08); noise(0.06, 0.2, 4000, 2); break;
      case 'slam': noise(0.3, 0.45, 220); tone(70, 0.35, 'sine', 0.25, 35); break;
      case 'hurt': tone(240, 0.25, 'sawtooth', 0.1, 80); break;
      case 'pick': tone(880, 0.08, 'triangle', 0.08, 1320); break;
      case 'weapon': [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, 'triangle', 0.09, 0, i * 0.08)); break;
      case 'jump': tone(300, 0.12, 'triangle', 0.06, 520); break;
      case 'shoot': tone(1200, 0.14, 'square', 0.035, 300); break;
      case 'charge': tone(400 + 200 * power, 0.14, 'sine', 0.09, 800 + 300 * power); break;
      case 'trump': [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, 0.4, 'sine', 0.1, 0, i * 0.05)); noise(0.5, 0.15, 3000, 0.5); break;
      case 'buy': tone(660, 0.1, 'triangle', 0.1); tone(990, 0.16, 'triangle', 0.1, 0, 0.09); break;
      case 'slice': noise(0.12, 0.3, 5200, 2); tone(2400, 0.25, 'sine', 0.06, 600); noise(0.25, 0.2, 700); break;
      case 'crunch': noise(0.2, 0.4, 600, 1.4); tone(110, 0.2, 'square', 0.1, 50); noise(0.1, 0.3, 2400, 3); break;
      case 'roar': noise(0.9, 0.5, 260, 0.5); tone(70, 0.9, 'sawtooth', 0.12, 45); tone(110, 0.7, 'square', 0.05, 60); break;
      case 'crit': tone(1760, 0.18, 'triangle', 0.1, 2640); tone(2637, 0.3, 'sine', 0.06); noise(0.12, 0.35, 3000, 1.5); break;
      case 'growl': tone(90, 0.45, 'sawtooth', 0.07, 60); noise(0.4, 0.12, 300, 0.7); break;
      case 'break': noise(0.25, 0.35, 1800, 0.7); tone(1200, 0.3, 'sine', 0.06, 2400); break;
    }
  } catch (e) {}
}

// iOS only lets a tap that ends (not one that starts) switch audio on, and it can pause audio when you leave the app:
// so any finished tap, click or key wakes the sound back up
for (const ev of ['touchend', 'click', 'keydown']) document.addEventListener(ev, () => { if (!actx || actx.state !== 'running') audioInit(); }, { passive: true, capture: true });
document.addEventListener('visibilitychange', () => { if (!document.hidden && actx && actx.state !== 'running') actx.resume().catch(() => {}); });

// ---------- phone or desktop ----------
// A mouse-and-keyboard computer gets keyboard controls (no on-screen buttons, key names in the menus); a touchscreen
// gets the joystick and buttons. It starts from what the device says it has and follows whatever you actually use.
let KBD = false;
function setKbd(on) {
  if (KBD === on) return; KBD = on;
  document.documentElement.classList.toggle('kbd', on);
  if (typeof onInputModeChange === 'function') onInputModeChange();
}
try { setKbd(matchMedia('(hover: hover) and (pointer: fine)').matches); } catch (e) {} // a mouse means a computer, even one with a touchscreen
window.addEventListener('keydown', () => setKbd(true), true);
window.addEventListener('touchstart', () => setKbd(false), { passive: true, capture: true });

// ---------- input ----------
const input = { mx: 0, my: 0, run: false, light: false, heavy: false, jump: false, dodge: false, swap: false, trump: false };
const pressed = {};
function press(k) { if (!input[k]) pressed[k] = true; input[k] = true; }
function release(k) { input[k] = false; }
function clearInput() { for (const k in input) if (typeof input[k] === 'boolean') input[k] = false; input.mx = input.my = 0; }

// double-tap (or double-flick) a direction to run
let lastTap = { dir: 0, t: 0 }, runDir = 0;
function dirTap(dir) {
  const now = performance.now();
  if (lastTap.dir === dir && now - lastTap.t < 300) { input.run = true; runDir = dir; }
  lastTap = { dir, t: now };
}

const joy = $('#joy'), knob = $('#knob');
let joyId = null, joyC = null, joyMx = 0, joyMy = 0, prevNx = 0;
joy.addEventListener('pointerdown', (e) => {
  e.preventDefault(); audioInit(); joyId = e.pointerId; joy.classList.add('held');
  try { joy.setPointerCapture(e.pointerId); } catch (_) {}
  const r = joy.getBoundingClientRect(); joyC = { x: r.left + r.width / 2, y: r.top + r.height / 2, R: r.width * 0.36 };
  moveJoy(e);
});
joy.addEventListener('pointermove', (e) => { if (e.pointerId === joyId) moveJoy(e); });
function endJoy(e) { if (e.pointerId !== joyId) return; joyId = null; joy.classList.remove('held'); joyMx = joyMy = 0; prevNx = 0; knob.style.transform = ''; }
joy.addEventListener('pointerup', endJoy); joy.addEventListener('pointercancel', endJoy); joy.addEventListener('lostpointercapture', endJoy);
function moveJoy(e) {
  let dx = e.clientX - joyC.x, dy = e.clientY - joyC.y; const d = Math.hypot(dx, dy), R = joyC.R;
  if (d > R) { dx *= R / d; dy *= R / d; }
  knob.style.transform = `translate(${dx}px, ${dy}px)`;
  let nx = dx / R, ny = dy / R;
  if (Math.hypot(nx, ny) < 0.22) { nx = 0; ny = 0; }
  if (Math.abs(prevNx) < 0.35 && Math.abs(nx) >= 0.6) dirTap(Math.sign(nx));
  prevNx = nx; joyMx = nx; joyMy = ny;
}
document.querySelectorAll('.btn').forEach((b) => {
  const k = b.dataset.k;
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); audioInit(); try { b.setPointerCapture(e.pointerId); } catch (_) {} b.classList.add('on'); press(k); });
  const up = () => { b.classList.remove('on'); release(k); };
  b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
  b.addEventListener('contextmenu', (e) => e.preventDefault());
});
const KEYMAP = { KeyJ: 'light', KeyZ: 'light', KeyK: 'heavy', KeyX: 'heavy', Space: 'jump', KeyL: 'dodge', ShiftLeft: 'dodge', KeyQ: 'swap', KeyC: 'swap', KeyE: 'trump', KeyV: 'trump' };
const keys = new Set();
let onKeyMenu = null; // set by ui.js for Escape/pause handling
window.addEventListener('keydown', (e) => {
  if (onKeyMenu && onKeyMenu(e)) return;
  if (!e.repeat) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') dirTap(-1);
    if (e.code === 'ArrowRight' || e.code === 'KeyD') dirTap(1);
  }
  keys.add(e.code);
  if (KEYMAP[e.code]) { e.preventDefault(); if (!e.repeat) press(KEYMAP[e.code]); }
  if (e.code.startsWith('Arrow')) e.preventDefault();
});
window.addEventListener('keyup', (e) => { keys.delete(e.code); if (KEYMAP[e.code]) release(KEYMAP[e.code]); });
function readMove() {
  let kx = 0, ky = 0;
  if (keys.has('ArrowLeft') || keys.has('KeyA')) kx -= 1;
  if (keys.has('ArrowRight') || keys.has('KeyD')) kx += 1;
  if (keys.has('ArrowUp') || keys.has('KeyW')) ky -= 1;
  if (keys.has('ArrowDown') || keys.has('KeyS')) ky += 1;
  input.mx = joyId !== null ? joyMx : kx; input.my = joyId !== null ? joyMy : ky;
  if (input.run && (Math.sign(input.mx) !== runDir || Math.abs(input.mx) < 0.3)) input.run = false;
}
// stop iOS page bounce and zoom while playing, but let menus scroll
document.addEventListener('touchmove', (e) => { if (!e.target.closest('.ov')) e.preventDefault(); }, { passive: false });
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());
