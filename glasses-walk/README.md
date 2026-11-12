# Walk — live walking navigation for Meta Ray-Ban Display

A heads-up walking navigator: search an address, then watch the street grid turn as you turn.
Static HTML/JS, no build step, no API keys — it is designed to ship as a **Meta Ray-Ban Display Web App**.

## Views (tap / Enter cycles; long-press or `T` shows the toolbar)

| View | What you see |
|------|--------------|
| **Ahead** (default) | Walk-through street view: real-width roads with kerbs, sidewalks and centre lines, extruded buildings either side, flowing chevrons on the route, fog in the distance. The destination building is gold with a name tag (visible through the fog) and the last instruction reads "Arrive at <name>". Zoom raises the camera: eye level → raised → high → drone |
| **Turn-by-turn** | Big first-person card: arrow, distance to the next turn, street, "then…" |
| **Overhead** | Top-down, heading-up map with building footprints, street names and 4 zoom levels (≈120 m → 1 km) |
| **Whole route** | North-up overview of start → destination |

Keys: `Enter`/`Space`/`V` next view · `+`/`-` zoom · `/` or `S` search · `M` voice · `Esc` end route.
Voice prompts ("In 150 feet, turn right onto…") use the browser's speech synthesis.

## Data (all free, no keys)
- Streets, paths and building footprints (with heights where mapped, else ~9 m): OpenStreetMap via Overpass · Address search: Nominatim · Walking routes: routing.openstreetmap.de (OSRM foot)
- These are public community servers with fair-use limits — fine for personal use. For anything bigger, host your own or use a commercial provider.
- Rerouting happens automatically after you are >40 m off the route for three fixes.

## Try it on a computer (no GPS needed)
```bash
cd glasses-walk && python3 -m http.server 8000
# open http://localhost:8000/?demo=1            (simulated walk on a fake grid)
# options: &view=chase|turn|overhead|overview  &speed=3  &units=metric
```
Real mode (no `?demo`) needs location permission and an HTTPS origin.

## Speed and precise location
- **Rendering:** runs at the display's refresh rate (no 30 fps cap) and adapts: if drawing takes too much of a frame it drops detail (sidewalks, centre lines, far buildings, resolution) and brings it back when there's headroom. Force a level with `?q=0|1|2`; `?debug=1` shows fps / ms / level. On a stress scene (1,500 roads + 1,800 buildings) the first-person frame went from ~68 ms to ~23 ms in a software-rendered desktop browser (relative numbers only; a phone GPU differs).
- **Position filter:** each GPS fix is weighted by its reported accuracy (Kalman filter), device speed/heading sharpen velocity, and the dot is dead-reckoned between fixes so it glides at full frame rate instead of hopping once a second. In simulation it cuts GPS error roughly in half (7.3 m → 3.6 m rms).
- **Street lock:** when you're within ~12 m (or 1.2× the GPS accuracy) of the route the dot snaps to the street, and the camera faces along it. Standing still it follows the compass; walking it follows your direction of travel.
- **Accuracy-aware:** rerouting and "head back to the route" thresholds widen when GPS is poor; the accuracy circle is drawn on the ground; the footer shows `GPS ±N ft`; turn prompts come earlier when you walk faster or the fix is poor.
- **Fast start:** asks for a quick coarse fix (cached / Wi-Fi / cell) *and* precise GPS at the same time, so something shows within about a second and sharpens to full accuracy when the satellites lock; remembers your last area for search; loads a small patch of map first, then the full area. The start screen shows live status ("Finding you… 4 s", "Sharpening GPS ±120 ft").

## Ground and "get back to the route"
- Instead of a black void, the scene has a tinted **ground** with OSM **parks (green), water (blue), car parks (gray)**, so roads read clearly against everything else. Toolbar → **Ground** turns it off (or `?ground=0`) if the tint is too bright on your glasses; black is see-through on additive displays.
- If you're more than 15 m from the route (in a park, a car park, GPS drift), the banner switches to **"Head to the route — to your left"** with a gold arrow and distance, and a gold line + ring marks the nearest point to rejoin.

## No GPS? Tell it where you are
If location is denied, times out or isn't available, the start screen shows why. Tap it (or press `S`, then **Set my location**) and type an address, a place, or raw coordinates like `37.7749, -122.4194`. You can also start from a link: `…/glasses-walk/?lat=37.7749&lon=-122.4194`. If you pick a destination first, it remembers it and starts the route as soon as your location is known. A real GPS fix replaces a typed location automatically. A typed location doesn't move, so this gets you a route and the street scene but not live walking.

## Put it on the glasses
1. Host this folder on any HTTPS static host (GitHub Pages, Netlify, Cloudflare Pages…).
2. Register it as a Web App in Meta's Wearables developer preview (developers.meta.com/wearables) and share via the URL.
3. Open it on the glasses and say or type a destination.

### Things I could not verify (read this before relying on it)
This was built and tested only in a desktop browser. I could not read Meta's developer docs from my sandbox, so these are **assumptions to check on real hardware**:
- **Whether Web Apps get GPS (`navigator.geolocation`) and compass (`deviceorientation`).** The code uses both and falls back gracefully. If the glasses don't expose them, the fix is to have the phone feed location/heading to the app (a small relay) or move to Meta's native Device Access Toolkit (iOS/Android) path.
- **Display size.** The UI is square and scales with the window; I designed for roughly 600×600. Black is transparent on this kind of display, so colours are bright on pure black.
- **Input.** Tap/Enter/Tab-focus are supported; how the Neural Band gestures map to them needs checking.
- **Safety.** Keep it to glances, and don't let it replace paying attention to traffic.

## Files
`index.html` UI shell · `app.js` sensors, data, renderer, UI · `nav.js` pure maths (projection, snapping, maneuvers) · `test.js` (`node test.js`)
