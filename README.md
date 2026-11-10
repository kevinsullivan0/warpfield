# Warpfield

- [Launch the public active Site](https://warp-bubble-observatory-2026.kevinsulli.chatgpt.site)
- [Source repository](https://github.com/kevinsullivan0/warpfield)

The simulator and this source repository are public. This snapshot preserves the implementation behind Site version 11. See [source provenance](SOURCE-PROVENANCE.md) for the exact source identifier and verification scope.

A buildless WebGPU/WebGL2 optical flight experiment. Serve `dist/` over HTTP. The browser chooses the adapter and Metal/OpenGL path; Auto prefers WebGPU and falls back to WebGL2. One 4K sky and one graphics context are retained. High detail uses the device pixel ratio up to 2.5; Adaptive caps it at 1.7 and reduces pixel resolution during sustained expensive views; Low reduces it further. Performance reports record actual rendered dimensions.

For a local preview, run `python3 -m http.server 8000 --directory dist`, then open `http://localhost:8000`. Use a browser with WebGPU or WebGL2 support. No package installation or build step is required.

Run the numerical and behavioral checks with `node --test *.test.mjs`. The runtime additionally samples actual GPU source events through 50 c. T measures ten seconds of submitted-frame intervals after warm-up, with at most two frames outstanding.

## Views and controls

Optical shows received light. The hull, Sun, planets and distant sky use the same past-null paths and bolometric frequency gain. Layout shows current coordinates with unbent bodies and an optional centered shell. F switches representation while preserving flight state and camera. G opens Layout and cycles shell/ray diagram/off. HUD arrows, target rings and the map explicitly mark current navigation coordinates in both representations; optical images may be displaced. Visible planets can be selected, and one gold edge arrow points toward the selected target when it lies outside the guide area or behind the camera.

WASD/arrows steer the ship. Drag/IJKL looks in the bridge; outside drag orbits, Shift/right-drag pans, and Shift+IJKL orbits. The Drag button cycles Orbit/Pan/Look. C recenters look without moving the observer. The outside camera has an independent world bearing, so steering does not drag it around. Camera focus can follow the ship, orbit a current target, or release the observer at a fixed location. Orbit target changes only the camera. Visit/inspect explicitly repositions the ship, sets speed 0 and pauses. Switching between Bridge and External (buttons or V) uses a 1.2-second eased camera glide, including field of view. Reversing mid-glide starts from the displayed pose. External places a following observer behind the bridge look direction, including pitch and look offsets, even after planet-orbit or fixed-focus use. Returning to Bridge inherits the current outside viewing direction. Y / Frame bubble smoothly realigns with the stored bridge direction. Wheel or [/] changes outside distance; Shift-wheel or ,/. changes FOV. Camera distance uses a logarithmic slider.

Q/E or −/+ changes the speed immediately; Shift uses 5 c steps. With course assist, the chosen speed is a limit and the HUD shows the assisted speed. Space holds simulation time while retaining the snapshot's metric speed. Settings panels explicitly hold time as well. Clock, distance flown, current target range and observer state distinguish transport from a following camera or an infinite sky. Map scale stays fixed until changed. Assist accelerates gradually and slows while turning, including within one bubble radius. Solar approaches hold at their standoff. Disengaging P or steering manually keeps the effective speed rather than the former limit. Hiding guides leaves assist active. Explicit paused speed changes still alter the optical snapshot, including at a held standoff. O / Look at target aims only the camera at the current target; the steering line gives ship-relative left/right and climb/descend instructions. For a manual flyby, take over at a suitable speed and use the HUD guides to steer past the body. V switches bridge/outside, P toggles assist, N selects a target, X resets heading, Z also recenters look, R resets flight, H hides the interface, M toggles the map and ? opens help.

Play tour starts a continuous two-minute Solar flight. One world and clock persist; a damped observer glides between bridge, bubble, Earth and Jupiter views without cuts or fades during flight. Planet excursions are inspector camera movement, distinct from ship transport. Exit preserves actual speed and observer pose; Resume continues from the current Solar state. A fresh tour performs its departure setup once. Settings hold its time.

Solar assist offers Approach & hold or Flyby & release. Flyby uses an offset passage with minimum geometric center clearance 4R+body radius and planned separation1.4x that value. It checks actual-frame travel against all moving Solar bodies, first moves clear if starting inside clearance, eases steering on departure, and releases the same actual speed/heading. This is a geometric controller in the prescribed simulation, not certified spacecraft guidance.

Outside left-drag defaults to orbit; Shift/right-drag pans in the viewing plane. The Drag button cycles Orbit/Pan/Look for touch and mouse. Wheel zooms; IJKL looks; Shift+IJKL orbits. Y / Frame bubble uses6(1+v)R with an80-degree FOV to keep the enlarged encounter cone within view; pan or manual zoom takes over automatic framing. View planet gives a close outside observer around the selected current planet. Slow Solar presets start near3km/s (0.00001c), and Q/E uses fine steps below0.1c.

Visibility assistance includes illustrative surface fill so the night side keeps visible texture; Fixed exposure retains stronger darkness. This is a display choice and does not change geodesics, opacity or frequency gain.

## Source and spacetime model

Units are R=c=1, with σR=5:

    ds² = −dt² + dx² + dy² + (dz+b dt)²
    b = v(1−f)
    f(r) = [tanh(5(r+1))−tanh(5(r−1))]/[2 tanh(5)]

For past time s=−t, local outward direction n and log photon energy L,

    x' = n+b ez
    n' = −nz[∇b−n(n·∇b)]
    L' = −nz(n·∇b)

Solar bodies have prescribed circular coplanar orbits, illustrative initial phases, and NASA mean distances, diameters and orbital periods. `solar-system.mjs` supplies one source snapshot to rendering and navigation. R=1,000,000 km and R/c=3.33564095 s in Solar mode; one real second advances one physical Solar second. Source positions and orbital velocities are evaluated at emission time. Stable orbital displacement and separate camera-relative centers retain small-body precision at distant observers.

A source with exterior-frame velocity W has Eulerian velocity V=W−vf ez at the event. Its observed/source frequency is

    g = exp(−L) sqrt(1−|V|²)/(1+n·V).

This reduces to exterior SR Doppler shift, and to the existing comoving hull result when W=v ez. The first opaque event terminates a ray. A prescribed material event with |V|≥1 is censored/dark, never skipped as transparent. This acknowledges an undefined material response during a direct warp-wall encounter.

The hull is 93 triangles within 0.396103 R; its fixed-comoving worldlines stay timelike through 50 c. Its dimensions are schematic and tied to bubble scale. The Sun/planets retain a common measured Solar scale. Surface radiance, patterns and RGB tint are prescribed artwork. Optical display uses bolometric g⁴ and optional center-view exposure assistance; it does not reconstruct spectra or reflected sunlight through the metric.

Acceleration/turning use successive steady metrics rather than a persisted time-dependent flight-history spacetime. Solar gravity, matter backreaction and planetary responses to the wall are omitted. The outside camera samples instantaneous Eulerian frames; its inspector controls do not represent a fully evolved observer worldline. The bridge remains an ideal panorama without interior hull occlusion. Survey probes retain their constrained transparent pre-encounter emission model.

## Numerical implementation

`spatial.mjs` is the double-precision null-ray reference; `optics-kernel.mjs` emits paired WGSL/GLSL solvers. `scene-ray.mjs` adds CPU source events. `solar-optics.mjs` and `solar-gpu.mjs` implement retarded orbital states, source frequency and moving-sphere events. `solar-validation.mjs` supplies GPU/CPU fixtures including source occlusion, invalid material, 50 c and a distant Neptune observer.

Exterior segments are analytic beyond 3.2 R, neglecting a shape tail below 3e−10. Closest-approach entry avoids b²−ac cancellation. Numerical-region RK4 uses bounded gradient/spatial steps, shorter steps near surfaces and up to 4096 scene steps/48 R/c. Relative swept segments test moving bodies; event refinement runs on the numerical ray. A stackless preorder BVH searches the hull. Exterior planets are tested at display resolution after cached ray exits, preserving small discs independently of map sample spacing.

Solar bridge and outside views use 2D scene maps. Moving maps have bounded adaptive sampling; paused snapshots refine coherently into a second 513-sample map. Source epoch/position/heading changes restart Solar refinement, preventing mixed-time tiles. Survey bridge uses 1536 angular geodesics and axial symmetry. Mixed opaque/background cells retrace display pixels; all-surface cells interpolate events. Tiny off-axis images, caustics and facet boundaries remain finite-resolution limits. GPU arithmetic is 32-bit; sampled parity errors do not bound every pixel or remote observer.

The independent canonical-momentum Dormand–Prince oracle checks 78 selected sky rays through 100 c, plus hull and curved finite-source events. Exact published limits include transverse invariance and the axial ratio 1+v (51 at 50 c). This is an equation/limit comparison, not a digitized published 50 c image match. Runtime GPU tests compare actual source classification, positions, times and frequency with the CPU. Surface samples at shared hull edges may choose different triangles of the same opaque hull.

Performance measurements are session-specific. `docs/benchmark-v5.json` describes the previous hull-only release; the v6 report records this Solar-source renderer. Neither constitutes a universal 60 fps promise. The final WebGPU 50 c moving outside-orbit sample averaged 58.70 fps at 1632×918 (Adaptive, 1.275 rendered pixels/CSS pixel); its p95 interval was 17.6 ms and p99 33.2 ms. A fixed 2176×1224 pass averaged 52.72 fps, motivating the adaptive pixel controller. Close-planet and WebGPU bridge samples were about 60 fps. Native Firefox WebGL2 outside orbit averaged 57.31 fps at 3046×1758; the IAB Metal WebGL2 bridge first adaptive pass averaged 53.01 fps while changing resolution, with 33.4 ms p95. Both backends passed the same 63-case Solar event checks through 50 c. Browser/driver allocations are excluded from app-owned buffer/texture totals.

## Primary sources

- [NASA NSSDCA planetary facts](https://nssdc.gsfc.nasa.gov/planetary/factsheet/)
- [NASA solar facts](https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html)
- [Alcubierre](https://arxiv.org/abs/gr-qc/0009013)
- [Clark, Hiscock & Larson](https://arxiv.org/abs/gr-qc/9907019)
- [Müller & Weiskopf](https://arxiv.org/abs/1107.5650)

Release module graph: `v=8j`. Bump all browser imports/CSS together after incompatible changes.

Navigation update evidence: `docs/navigation-validation.json`. The 2 c moving Solar/outside orbit with HUD guides averaged 59.91 fps at 1000×720 in the measured session (p95 17.5 ms, p99 17.7 ms); this does not replace the broader renderer performance limits above.

Final polish timing: `docs/final-polish-validation.json` records the same paused Solar outside 50c snapshot at 750×540: WebGPU 57.30 fps (p95 17.7 ms), WebGL2/Metal 33.45 fps (p95 50.3 ms). The complete two-minute continuous tour was visually checked on WebGPU, with sampled timings near 60 fps. These are session measurements, not a general device guarantee.

Smooth-view update (10 November 2026): `camera-transition.mjs` interpolates ship-relative world offsets, normalized shortest-arc camera quaternions and FOV with a 1.2-second quintic ease. An interrupted transition restarts from its displayed pose; returning to Bridge inherits the received viewing direction. The existing 0.4R ideal-panorama handoff omits interior hull occlusion. The transition is an inspector-camera presentation, not a timelike accelerated observer trajectory. `docs/smooth-camera-validation.json` records paused, orbited, reversed and moving-flight checks. The WebGPU 2c Solar alternating-view sample averaged 56.01 fps during adaptive adjustment from 2176×1224 to 1741×979; p95 was 32.4 ms. This does not promise 60 fps for every scene or device.
