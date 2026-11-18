# Audiomack Creator Onboarding (prototype)

A swipeable 7-screen onboarding flow built in plain HTML, CSS and JS. It exists to sell the idea, so it is a prototype: the buttons do nothing and the content is placeholder.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 5173
```

Then visit http://localhost:5173. There is no build step and no dependencies. Fonts load from Google Fonts, so the first load needs internet.

## What it does

- **Frame:** a fixed 375×812 container centered on a `#333333` page. It scales down if the window is smaller.
- **Order:** Intro → Get discovered → Get paid → Drop as much music → Know who's listening → Connect with your fans → More ways to grow. It loops in both directions.
- **Swipe:** mouse drag, touch swipe or the left/right arrow keys. The graphic and text fade out and the next ones fade in as you drag, with a slight parallax.
- **Autoplay:** advances every 6 seconds and stops for good once the user swipes or presses an arrow key.
- **Fixed UI:** status bar, pager dots, "Create a Free Account", "Log In" and the home indicator never move. Both buttons have a press state and do nothing else.
- **Entrance animations:** each screen's elements play in as it arrives and replay on every visit (details below).
- **Spinning globe:** the Get discovered screen has a live wireframe globe that turns once every 26 seconds. Four UI pills (New Follower, Played Your Song, Added to Playlist, Liked Your Album) pop in one at a time, starting with the one on the right, and then keep cycling in and out with two or three showing, on a 4.2-second cycle, so a new pill pops every 1.05 seconds.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | All seven screens plus the fixed UI |
| `styles.css` | Layout, components, entrance and idle animations |
| `app.js` | Swipe, loop, autoplay, entrance triggers, globe, fit-to-window |
| `assets/` | Fixed glow, status bar and button SVGs |
| `assets/intro/` | Album covers (used on the Drop as much music screen) |
| `assets/fig/` | Assets for Get discovered, Get paid and Know who's listening (flags, orbs, chart line, thumbnails) |
| `assets/fig2/` | Assets from the second Figma round: Intro avatars and logo, globe-pill flags, the new orbs, the post screenshot and the More ways to grow collage |
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
| More ways to grow (added in round 2) | `11114:3751` |
| Background glow (`top_blur`) | `11083:2194` |

Figma asset URLs expire after 7 days, which is why every asset is downloaded into `assets/`. To refresh one, fetch the node with `get_design_context`.

## Design decisions worth remembering

- **Fonts:** Open Sans everywhere (400/500/600/700). The heavy wide font on "60M Monthly Listeners Worldwide" is not available, so that one block is an image (`assets/fig/reach-title.webp`). The two "Now Playing" share cards on the last screen also use a font we don't have (Gilroy), so they are exported from Figma as images at 4x (`assets/fig2/card-front.webp` and `card-back.webp`). Figma exports the front card inside a hard-edged shadow box, so that box is cut away and the soft shadow is re-added in CSS (`.share-front`). If the back card ever looks missing, that box is the cause.
- **Background glow:** a single fixed image (`assets/top-blur.png`, the Figma `top_blur` node) sits behind every slide and never moves or fades. Nothing on a slide carries its own glow.
- **Layered screens:** the graphics are real HTML/CSS layers, not cropped images. We first tried slicing the flat JPGs into pieces; that left hard edges and ghost boxes wherever elements overlapped, so every screen was rebuilt from the Figma layers instead.
- **Text is live:** headlines, subtext, stat cards, track rows, the globe pills and the chart labels are real text. The Fans post card and the four "More ways to grow" tiles (`tile-a` to `tile-d`) are images exported from Figma. The tile exports come out flattened onto the page color, so that background is converted to transparency, otherwise dark squares show over the glow. Figma rotates the phone image inside tile C in a way its code export doesn't describe, so rebuilding that crop from the raw image gave a wrongly tilted phone.
- **Text block position:** the headline and subtext are bottom-aligned so the block ends at y=600 on every screen, matching Figma.
- **Pager dots** are live and animate, and there are seven of them. The Figma frames still draw six, which looks like it wasn't updated for the new screen.
- **Intro parallax:** while you swipe, each circle on the Intro moves at its own speed on top of the slide's movement. The big photos near the viewer travel furthest, the small ones less, the logo barely, and the rings lag behind. Each element has a `--depth` value inline in `index.html` (1 means 100px extra per slide). `app.js` feeds the swipe position in as `--par`, and the `.par` rule in `styles.css` turns that into movement. Raise the depths, or the `100px` in that rule, for more.
- **Intro:** a 3D Audiomack logo in the middle of three rings with seven circular artist photos. Each photo is the new Figma image placed inside its circle exactly as designed.

## How the animation works

- A slide gets the class `in` once it is mostly in frame (less than half a slide away) and loses it when fully out of frame, so entrances replay on every visit.
- Every animatable element has the class `p` plus an effect class (`fx-pop`, `fx-rise`, `fx-rise-big`, `fx-rise-s`, `fx-left`, `fx-right`, `fx-zoom`, `fx-fade`, `fx-ring`, `fx-wipe`, `fx-fill`).
- `--d` sets an element's start delay and `--dur` an optional duration, both inline in `index.html`. Tweak those to retime anything.
- **Globe pills** are not part of that system. `app.js` turns the `show` class on and off for each `.pill`: each one is visible for 60% of a 4.2-second cycle and the four start one after another, so the first build-up goes 1, 2, 3 pills and then two or three show at any time. Change `PERIOD` (speed) and `WINDOW` (how many show at once) in `app.js`.
- Idle motion (orbs pulse, avatars and cards drift) is `idle-pulse` / `idle-float`. It is turned off for people who prefer reduced motion.
- The chart line and the progress bars draw in with a `clip-path` wipe.

## Gotchas

- **Browsers cache images by filename.** When a file is replaced with a different version, give it a new name (that's why the cards are `card-*.webp` and not `share-*.webp`), or the old version can keep showing until a hard refresh.
- **Do not use CSS `mask-image` with a local file.** Browsers block it when the page is opened straight from disk (`file://`), though it works from a server. This is why the globe is drawn on a `<canvas>` instead.
- **Figma exports only come at 1x.** `top-blur.png` is that image upscaled 2x, which is fine for a soft blur. Photos and icons were exported from the asset URLs at full size.
- **The Figma "40" layer blur is not CSS `blur(40px)`.** It matched CSS `blur(30px)` when we compared against Figma's own render, which is why we use the exported image rather than re-creating the blur.

## Ideas not done yet

- Count-up numbers (60M, 640,827, the stats). The 60M heading would need its font first.
- Wire the buttons to real destinations.
- Tie each pill to a point on the globe, so it appears when that spot turns to face the viewer.
