// Run: node test.js
const assert = require('assert');
const N = require('./nav.js');

const proj = N.makeProjector({ lat: 37.7749, lon: -122.4194 });
const xy = proj.toXY(37.7749 + 0.001, -122.4194);
assert(Math.abs(xy.y - 110.54) < 0.01 && Math.abs(xy.x) < 1e-9, 'projection north');
const ll = proj.toLL(100, 200), back = proj.toXY(ll.lat, ll.lon);
assert(Math.abs(back.x - 100) < 1e-6 && Math.abs(back.y - 200) < 1e-6, 'round trip');

assert.strictEqual(N.bearing(0, 1), 0); assert.strictEqual(N.bearing(1, 0), 90); assert.strictEqual(N.bearing(0, -1), 180); assert.strictEqual(N.bearing(-1, 0), 270);
assert.strictEqual(N.angleDiff(350, 10), 20); assert.strictEqual(N.angleDiff(10, 350), -20);

// facing east, a point to the east is dead ahead; north is on your left
let f = N.toForward(10, 0, 90); assert(Math.abs(f.x) < 1e-9 && Math.abs(f.y - 10) < 1e-9, 'east ahead');
f = N.toForward(0, 10, 90); assert(Math.abs(f.x + 10) < 1e-9 && Math.abs(f.y) < 1e-9, 'north on left');

// route: north 100 m, then east 100 m
const mkLL = (x, y) => { const p = proj.toLL(x, y); return [p.lon, p.lat]; };
const osrm = {
  distance: 200, duration: 150, geometry: { coordinates: [mkLL(0, 0), mkLL(0, 100), mkLL(100, 100)] },
  legs: [{ steps: [
    { maneuver: { type: 'depart', location: mkLL(0, 0) }, name: 'A St', distance: 100 },
    { maneuver: { type: 'turn', modifier: 'right', location: mkLL(0, 100) }, name: 'B St', distance: 100 },
    { maneuver: { type: 'arrive', location: mkLL(100, 100) }, name: '', distance: 0 },
  ] }],
};
const r = N.buildRoute(osrm, proj);
assert(Math.abs(r.total - 200) < 0.5);
let sn = N.snap(r.pts, r.cum, { x: 3, y: 40 });
assert(Math.abs(sn.along - 40) < 0.5 && Math.abs(sn.dist - 3) < 0.1, 'snap');
let p = N.progress(r, sn.along);
assert.strictEqual(p.index, 0); assert.strictEqual(p.next.modifier, 'right');
assert(Math.abs(p.toManeuver - 60) < 0.5, 'distance to turn');
p = N.progress(r, 150); assert.strictEqual(p.index, 1); assert.strictEqual(p.next.type, 'arrive');
p = N.progress(r, 199); assert(p.arrived || p.toManeuver < 2);
assert.strictEqual(N.arrowAngle(r.steps[1]), 90); assert.strictEqual(N.arrowAngle(r.steps[2]), 0);

// snap window stops a doubling-back route from jumping to its second half
const loop = [{ x: 0, y: 0 }, { x: 0, y: 100 }, { x: 5, y: 100 }, { x: 5, y: 0 }];
const lc = N.cumulative(loop);
sn = N.snap(loop, lc, { x: 2, y: 50 }, 0, 1); assert.strictEqual(sn.seg, 0);

assert.strictEqual(N.instruction(r.steps[1]), 'Turn right onto B St');
assert.strictEqual(N.instruction({ type: 'turn', modifier: 'uturn', name: '' }), 'Make a U-turn');
assert.strictEqual(N.instruction(r.steps[2]), 'Arrive at destination');

assert.deepStrictEqual(N.formatDist(30, 'imperial'), { v: '100', u: 'ft' });
assert.deepStrictEqual(N.formatDist(800, 'imperial'), { v: '0.5', u: 'mi' });
assert.deepStrictEqual(N.formatDist(430, 'metric'), { v: '430', u: 'm' });
assert.deepStrictEqual(N.formatDist(2500, 'metric'), { v: '2.5', u: 'km' });
assert.strictEqual(N.formatEta(30), '1 min'); assert.strictEqual(N.formatEta(4000), '1 h 7 min');

// near-plane clipping
assert.strictEqual(N.clipNear({ x: 0, y: -5 }, { x: 0, y: -1 }, 1), null);
const c = N.clipNear({ x: 0, y: -1 }, { x: 4, y: 3 }, 1); assert(Math.abs(c[0].x - 2) < 1e-9 && c[0].y === 1);
console.log('all nav tests passed');
