# Walk — live walking navigation for Meta Ray-Ban Display

A heads-up walking navigator: search an address, then watch the street grid turn as you turn.
Static HTML/JS, no build step, no API keys — it is designed to ship as a **Meta Ray-Ban Display Web App**.

## Views (tap / Enter cycles; long-press or `T` shows the toolbar)

| View | What you see |
|------|--------------|
| **Ahead** (default) | Walk-through street view: real-width roads with kerbs, sidewalks and centre lines, extruded buildings either side, flowing chevrons on the route, fog in the distance. Zoom raises the camera: eye level → raised → high → drone |
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
