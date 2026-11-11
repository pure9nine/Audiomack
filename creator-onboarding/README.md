# Audiomack Creator Onboarding (prototype)

A swipeable 6-screen onboarding flow built in plain HTML, CSS and JS. It exists to sell the idea, so it is a prototype: the buttons do nothing and the content is placeholder (`FPO` markers are intentional).

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 5173
```

Then visit http://localhost:5173. There is no build step and no dependencies. Fonts load from Google Fonts, so the first load needs internet.

## What it does

- **Frame:** a fixed 375×812 container centered on a `#333333` page. It scales down if the window is smaller.
- **Order:** Intro → Get discovered → Get paid → Drop as much music → Know who's listening → Connect with your fans. It loops in both directions.
- **Swipe:** mouse drag, touch swipe or the left/right arrow keys. The graphic and text fade out and the next ones fade in as you drag, with a slight parallax.
- **Autoplay:** advances every 6 seconds and stops for good once the user swipes or presses an arrow key.
- **Fixed UI:** status bar, pager dots, "Create a Free Account", "Login" and the home indicator never move. Both buttons have a press state and do nothing else.
- **Entrance animations:** each screen's elements play in as it arrives and replay on every visit (details below).
- **Spinning globe:** the Get discovered screen has a live wireframe globe that turns once every 26 seconds.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | All six screens plus the fixed UI |
| `styles.css` | Layout, components, entrance and idle animations |
| `app.js` | Swipe, loop, autoplay, entrance triggers, globe, fit-to-window |
| `assets/` | Fixed glow, status bar and button SVGs |
| `assets/intro/` | Intro album covers and upload orb |
| `assets/fig/` | Everything for the other five screens (photos, flags, orbs, chart line, card art) |
| `guides/` | The original static JPG exports. Reference only, not used at runtime |
| `.claude/launch.json` | Preview-server config for Claude Code |

## Source of truth: Figma

File `2T2fRhKourVK8TMhAuLekN` (AM — Creator App), page "Onboarding/Login/Signup":

| Screen | Node |
| --- | --- |
| Intro | `10682:1800` |
| Get discovered (reach) | `10949:1688` |
| Get paid (mont) | `10948:1558` |
| Drop as much music (uploads) | `11078:6857` |
| Know who's listening (stats) | `11080:2473` |
| Connect with your fans | `11081:2485` |
| Background glow (`top_blur`) | `11083:2194` |

Figma asset URLs expire after 7 days, which is why every asset is downloaded into `assets/`. To refresh one, fetch the node with `get_design_context`.

## Design decisions worth remembering

- **Fonts:** Open Sans everywhere (400/500/600/700). The heavy wide font on "60M Monthly Listeners Worldwide" is not available, so that one block is an image (`assets/fig/reach-title.webp`). The red `FPO` placeholders use Archivo Black as a stand-in.
- **Background glow:** a single fixed image (`assets/top-blur.png`, the Figma `top_blur` node) sits behind every slide and never moves or fades. Nothing on a slide carries its own glow.
- **Layered screens:** the graphics are real HTML/CSS layers, not cropped images. We first tried slicing the flat JPGs into pieces; that left hard edges and ghost boxes wherever elements overlapped, so every screen was rebuilt from the Figma layers instead.
- **Text is live:** headlines, subtext, stat cards, track rows, the post card and the chart labels are real text.
- **Text block position:** the headline and subtext are bottom-aligned so the block ends at y=600 on every screen, matching Figma.
- **Pager dots** are live and animate. The dots baked into the JPGs were wrong anyway (slides 2–6 all showed dot 3 active).

## How the animation works

- A slide gets the class `in` once it is mostly in frame (less than half a slide away) and loses it when fully out of frame, so entrances replay on every visit.
- Every animatable element has the class `p` plus an effect class (`fx-pop`, `fx-rise`, `fx-rise-big`, `fx-rise-s`, `fx-left`, `fx-right`, `fx-zoom`, `fx-fade`, `fx-ring`, `fx-wipe`, `fx-fill`).
- `--d` sets an element's start delay and `--dur` an optional duration, both inline in `index.html`. Tweak those to retime anything.
- Idle motion (orbs pulse, avatars and cards drift) is `idle-pulse` / `idle-float`. It is turned off for people who prefer reduced motion.
- The chart line and the progress bars draw in with a `clip-path` wipe.

## Gotchas

- **Do not use CSS `mask-image` with a local file.** Browsers block it when the page is opened straight from disk (`file://`), though it works from a server. This is why the globe is drawn on a `<canvas>` instead.
- **Figma exports only come at 1x.** `top-blur.png` is that image upscaled 2x, which is fine for a soft blur. Photos and icons were exported from the asset URLs at full size.
- **The Figma "40" layer blur is not CSS `blur(40px)`.** It matched CSS `blur(30px)` when we compared against Figma's own render, which is why we use the exported image rather than re-creating the blur.

## Ideas not done yet

- Count-up numbers (60M, 640,827, the stats). The 60M heading would need its font first.
- Wire the buttons to real destinations.
- Swap the `FPO` placeholders for final artwork.
