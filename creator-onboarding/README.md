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
- **Fixed UI:** status bar, pager dots (seven), "Create a Free Account", "Log In" and the home indicator never move. Both buttons have a press state and do nothing else.
- **Entrance animations:** each screen's elements play in as it arrives and replay on every visit (details below).
- **Intro parallax:** while you swipe, each circle on the Intro moves at its own speed on top of the slide's movement (details below).
- **Spinning globe:** the Get discovered screen has a live wireframe globe that turns once every 26 seconds. Four UI pills (New Follower, Played Your Song, Added to Playlist, Liked Your Album) pop in one at a time, starting with the one on the right, and then keep cycling in and out with two or three showing. A new pill pops every 1.05 seconds.
- **Static cards:** the Connect with your fans post card animates in and then stays still (it does not scroll).

## Files

| Path | What it is |
| --- | --- |
| `index.html` | All seven screens plus the fixed UI |
| `styles.css` | Layout, components, entrance and idle animations |
| `app.js` | Swipe, loop, autoplay, entrance triggers, parallax, globe and pills, fit-to-window |
| `assets/` | Fixed glow (`top-blur.png`), status bar and button SVGs |
| `assets/intro/` | Album covers (used on the Drop as much music screen) |
| `assets/fig/` | Assets for Get discovered, Get paid and Know who's listening (flags, orbs, chart line, thumbnails, post glow) |
| `assets/fig2/` | Assets from the second Figma round: Intro avatars (`i-*`) and logo, globe-pill flags, new orbs, the post screenshot, the two share cards (`card-*`) and the four collage tiles (`tile-*`) |
| `guides/` | The original static JPG exports from round one. Reference only, not used at runtime |
| `.claude/launch.json` | Preview-server config for Claude Code |

## Source of truth: Figma

File `2T2fRhKourVK8TMhAuLekN` (AM — Creator App), page "Onboarding/Login/Signup" (`3060:3733`):

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

Figma asset URLs expire after 7 days, which is why every asset is downloaded into `assets/`.

### Updating from Figma

1. List the page's frames with `get_metadata` on `3060:3733` (the output is large and gets saved to a file; search it for `AM-Onboarding`).
2. Pull each changed frame with `get_design_context` (it returns layer positions, sizes and download URLs for the images).
3. Compare against a `get_screenshot` of the frame. Do this for anything tilted or cropped: Figma's code export can miss image rotation.
4. For anything the code export gets wrong, or that uses a font we don't have, export the node with `download_assets` and `defaultScale: 4`, and use it as an image.
5. Download assets into `assets/` and convert them to WebP. Use a new filename when you replace a file (see Gotchas).

## Design decisions worth remembering

- **Fonts:** Open Sans everywhere (400/500/600/700). The heavy wide font on "60M Monthly Listeners Worldwide" is not available, so that block is an image (`assets/fig/reach-title.webp`). The two "Now Playing" share cards also use a font we don't have (Gilroy), so they are images too.
- **Background glow:** a single fixed image (`assets/top-blur.png`, the Figma `top_blur` node) sits behind every slide and never moves or fades. Nothing on a slide carries its own glow.
- **Layered screens:** the graphics are real HTML/CSS layers wherever possible, not cropped images. We first tried slicing the flat JPGs into pieces; that left hard edges and ghost boxes wherever elements overlapped, so every screen was rebuilt from the Figma layers instead.
- **Live text:** headlines, subtext, stat cards, track rows, the globe pills and the chart labels are real text.
- **Image exports (and how they were cleaned up):**
  - **Share cards** (`assets/fig2/card-front.webp`, `card-back.webp`): Figma exports the front card inside a hard-edged shadow box, which covered the back card. That box is cut away with a rounded, rotated mask, and the soft shadow is re-added in CSS (`.share-front`). If the back card ever looks missing, that box is the cause.
  - **Collage tiles** (`tile-a` to `tile-d`): the exports come out flattened onto the page color, so that background is converted to transparency, otherwise dark squares show over the glow. Figma also rotates the phone image inside tile C in a way its code export doesn't describe, so rebuilding that crop from the raw image gave a wrongly tilted phone. That is why the tiles are exported whole.
  - **Fans post card** (`fans-post.webp`) is a screenshot, as in the design.
- **Text block position:** the headline and subtext are bottom-aligned so the block ends at y=600 on every screen, matching Figma.
- **Pager dots** are live and animate, and there are seven of them. The Figma frames still draw six, which looks like it wasn't updated for the new screen.
- **Intro:** a 3D Audiomack logo in the middle of three rings with seven circular artist photos. Each photo is the Figma image placed inside its circle exactly as designed.

## How the animation works

- A slide gets the class `in` once it is mostly in frame (less than half a slide away) and loses it when fully out of frame, so entrances replay on every visit.
- Every animatable element has the class `p` plus an effect class (`fx-pop`, `fx-rise`, `fx-rise-big`, `fx-rise-s`, `fx-left`, `fx-right`, `fx-zoom`, `fx-fade`, `fx-ring`, `fx-wipe`, `fx-fill`).
- `--d` sets an element's start delay and `--dur` an optional duration, both inline in `index.html`. Tweak those to retime anything. On the last screen the two share cards share the same `--d` on purpose, so they land together.
- Idle motion (orbs pulse, avatars and cards drift) is `idle-pulse` / `idle-float`. It is turned off for people who prefer reduced motion.
- The chart line and the progress bars draw in with a `clip-path` wipe.
- **Globe pills** are not part of that system. `app.js` turns the `show` class on and off for each `.pill`. Each one is visible for 60% of a 4.2-second cycle and the four start one after another, so the first build-up goes 1, 2, 3 pills and then two or three show at any time. Change `PERIOD` (speed) and `WINDOW` (how many show at once) in `app.js`.
- **Intro parallax:** each circle has a `--depth` value inline in `index.html` (1 means 100px of extra travel per slide). The big photos near the viewer travel furthest, the small ones less, the logo barely, and the rings lag behind. `app.js` feeds the swipe position in as `--par` on each graphic, and the `.par` rule in `styles.css` turns that into movement. Raise the depths, or the `100px` in that rule, for more.

## Gotchas

- **Browsers cache by filename.** When a file is replaced with a different version, give it a new name (that's why the cards are `card-*.webp` and not `share-*.webp`), or the old version can keep showing until a hard refresh. The preview pane caches the HTML, CSS and JS too: run `fetch(url, {cache: 'reload'})` on them, then reload.
- **Do not use CSS `mask-image` with a local file.** Browsers block it when the page is opened straight from disk (`file://`), though it works from a server. This is why the globe is drawn on a `<canvas>` instead.
- **Figma frame screenshots come at 1x.** `get_screenshot` caps at the frame's own size, so `top-blur.png` is that image upscaled 2x, which is fine for a soft blur. `download_assets` with `defaultScale` (up to 4) gives real high-resolution exports, which is what the cards and tiles use.
- **The Figma "40" layer blur is not CSS `blur(40px)`.** It matched CSS `blur(30px)` when we compared against Figma's own render, which is why we use the exported image rather than re-creating the blur.

## History

- **Round 1:** built the six-screen flow from static JPGs, then rebuilt every screen as layered HTML/CSS from the Figma layers. Added the fixed glow, the entrance animations and the spinning globe.
- **Round 2:** updated the Intro (new logo and photo circles), Get discovered (UI pills that pop in and out around the globe), Drop as much music (cover collage) and Connect with your fans (screenshot card). Added the seventh screen, More ways to grow. Added the Intro parallax.

## Ideas not done yet

- Count-up numbers (60M, 640,827, the stats). The 60M heading would need its font first.
- Wire the buttons to real destinations.
- Tie each pill to a point on the globe, so it appears when that spot turns to face the viewer.
