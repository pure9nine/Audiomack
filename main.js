/* Audiomack design shot — the only behaviour on the page.
   Kept deliberately small: no dependencies, no build step. */
(function () {
  "use strict";

  // Nav picks up a background once the page leaves the top of the hero.
  var nav = document.getElementById("nav");
  if (!nav) return;

  var ticking = false;

  function update() {
    nav.classList.toggle("is-scrolled", window.scrollY > 8);
    ticking = false;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  update();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

/* Hero artist thumbnails start with the sub text (~1.86s, after the 1.5s hold)
   — each on its own random beat within a tight window so they don't pop in all
   at once. These stills will become looping videos later; the motion stays. */
(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var cards = document.querySelectorAll(".hero__card");
  Array.prototype.forEach.call(cards, function (card) {
    // scatter the pop across a tight ~0.3s window opening as the lede fades in
    card.style.animationDelay = (1.86 + Math.random() * 0.3).toFixed(2) + "s";
  });
})();

/* Hero card videos: under reduced-motion they hold their poster frame instead
   of looping, and elsewhere play() is called by hand — the autoplay attribute
   alone is not honoured by every browser, and a rejected play is just the
   poster showing, not an error worth surfacing. Pages loaded in a background
   tab get their video-only media paused to save power, so playback is kicked
   again whenever the tab comes to the front.

   The entrance cascade is also parked (`.is-holding`, see the stylesheet)
   until every video has buffered enough to play through, so the reveal never
   shows a card that hasn't started moving. A hard cap keeps a stalled network
   from holding the page hostage, and a video that errors counts as done —
   its poster is the best it will ever show. Nothing is held when the cards
   aren't on show (mobile drops them).

   The wait and the cascade's built-in 1.5s hold run on the same clock: time
   spent holding is credited against each entrance delay on release, up to
   that 1.5s share, so a slow network eats the designed pause before it adds
   any of its own. */
(function () {
  "use strict";

  var videos = document.querySelectorAll(".hero__card video");
  if (!videos.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    Array.prototype.forEach.call(videos, function (video) {
      video.removeAttribute("autoplay");
      video.pause();
    });
    return;
  }

  function playAll() {
    Array.prototype.forEach.call(videos, function (video) {
      var playing = video.play();
      if (playing && playing.catch) playing.catch(function () {});
    });
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") playAll();
  });

  playAll();

  var cards = document.querySelector(".hero__cards");
  if (!cards || getComputedStyle(cards).display === "none") return;

  var HOLD_CAP_MS = 4000;
  var HOLD_SHARE_S = 1.5; // the cascade's own pre-entrance hold, from the CSS
  var root = document.documentElement;
  var waiting = videos.length;
  var heldAt = performance.now();
  var released = false;

  root.classList.add("is-holding");

  function release() {
    if (released) return;
    released = true;

    // Credit the time already spent holding against each entrance delay, so
    // the video wait eats the designed 1.5s pause before adding any of its
    // own. A negative delay just starts an animation partway in — the nav,
    // due earliest, arrives mid-fade or already settled.
    var credit = Math.min((performance.now() - heldAt) / 1000, HOLD_SHARE_S);
    if (credit > 0.05) {
      var held = document.querySelectorAll(
        ".nav, .hero__type, .hero__title-line, .hero__lede, .hero__actions, .hero__card"
      );
      Array.prototype.forEach.call(held, function (el) {
        var delay = parseFloat(getComputedStyle(el).animationDelay) || 0;
        el.style.animationDelay = (delay - credit).toFixed(2) + "s";
      });
    }

    root.classList.remove("is-holding");
  }

  function done() {
    waiting -= 1;
    if (waiting === 0) release();
  }

  Array.prototype.forEach.call(videos, function (video) {
    // HAVE_ENOUGH_DATA already — small files often land before this runs
    if (video.readyState >= 4) {
      done();
      return;
    }
    var settled = false;
    function onSettled() {
      if (settled) return;
      settled = true;
      done();
    }
    video.addEventListener("canplaythrough", onSettled);
    video.addEventListener("error", onSettled);
  });

  window.setTimeout(release, HOLD_CAP_MS);
})();

/* Sections that reveal as they scroll into view — the quote fades up (its thumb
   and name a beat behind), the wordmark comes from half strength to full. The
   fades and their stagger live in the stylesheet; this only says when.

   Priming from here means a section only ever starts hidden or dimmed when
   there's script around to bring it back. Thresholds are per-section: enough of
   each on screen that the thing being revealed has actually arrived before it
   starts. `once` decides whether it stays revealed or resets on the way back. */
(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;

  var targets = [
    // the quote runs to ~62% of its section's height, so anything lower leaves
    // it hugging the bottom edge and the fade plays half unseen
    { selector: ".quote", threshold: 0.65, once: true },
    // the wordmark plays both ways — scrolling back up sinks it again
    { selector: ".wordmark", threshold: 0.6, once: false },
  ];

  // Extra stops on either side of the trigger. The callback only fires when a
  // listed threshold is crossed, so without them a crossing that samples a hair
  // under its own threshold would stick; the next stop corrects it either way.
  function stopsFor(threshold) {
    var stops = [0, 0.25, 0.5, 0.75, 1];
    if (stops.indexOf(threshold) === -1) stops.push(threshold);
    return stops.sort(function (a, b) {
      return a - b;
    });
  }

  targets.forEach(function (target) {
    var el = document.querySelector(target.selector);
    if (!el) return;

    el.classList.add("is-primed");

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          // isIntersecting flips true on the first sliver, so go by how much of
          // the section is actually on screen instead.
          if (entry.intersectionRatio >= target.threshold) {
            entry.target.classList.add("is-in");
            if (target.once) io.unobserve(entry.target);
          } else if (!target.once) {
            entry.target.classList.remove("is-in");
          }
        });
      },
      { threshold: stopsFor(target.threshold) }
    );

    io.observe(el);
  });
})();

/* Hero artist thumbnails drift as the page scrolls, each at a rate set by its
   data-depth, so the nearer cards trail further behind the scroll than the far
   ones and the group reads with a bit of depth. Written to `translate` rather
   than `transform`: hero-pop owns `scale`, and the two individual properties
   compose, so the drift never fights the pop-in. */
(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var RATE = 0.12; // fraction of the scroll a depth-1 card lags behind by
  var cards = document.querySelectorAll(".hero__card");
  if (!cards.length) return;

  var depths = Array.prototype.map.call(cards, function (card) {
    return parseFloat(card.getAttribute("data-depth")) || 0.5;
  });

  var ticking = false;

  function update() {
    // Only the hero parallaxes, so stop once it has scrolled away — past that
    // the offset is off-screen work nobody sees.
    var y = Math.min(window.scrollY, window.innerHeight);
    Array.prototype.forEach.call(cards, function (card, i) {
      card.style.translate = "0 " + (y * depths[i] * RATE).toFixed(1) + "px";
    });
    ticking = false;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  update();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

/* Stat numbers count up from zero as the stats block reveals. The reveal itself
   (the rise + fade) is the CSS `stats-in` animation; we start the count off the
   same delay — read straight from the computed style — so the two stay locked
   together however that timing is tuned in the stylesheet.

   Each value keeps whatever wraps its digits — the "M+", the "#" on the rank —
   by splitting the text into a leading non-digit prefix, the integer, and the
   rest. Under reduced-motion we bail out entirely: the CSS reveal is off and the
   numbers simply stand at their final values from the markup. */
(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.requestAnimationFrame) return;

  var stats = document.querySelector(".stats");
  if (!stats) return;

  var DURATION = 1200; // ms to run from zero to the final value

  var nums = Array.prototype.map
    .call(stats.querySelectorAll(".stat__num"), function (el) {
      var parts = /^(\D*)(\d+)(.*)$/.exec(el.textContent);
      if (!parts) return null;
      return {
        el: el,
        prefix: parts[1],
        target: parseInt(parts[2], 10),
        suffix: parts[3],
      };
    })
    .filter(Boolean);

  if (!nums.length) return;

  function render(n, value) {
    n.el.textContent = n.prefix + value + n.suffix;
  }

  function run() {
    var begin = null;

    function step(now) {
      if (begin === null) begin = now;
      var t = Math.min((now - begin) / DURATION, 1);
      var eased = 1 - Math.pow(1 - t, 3); // easeOutCubic — quick, then settles
      nums.forEach(function (n) {
        render(n, Math.round(n.target * eased));
      });
      if (t < 1) window.requestAnimationFrame(step);
    }

    window.requestAnimationFrame(step);
  }

  // Match the reveal's own delay (e.g. "2.1s") so the count starts as the block
  // arrives, not before. Hold the digits at zero through the wait.
  var delay = parseFloat(getComputedStyle(stats).animationDelay) || 0;
  nums.forEach(function (n) {
    render(n, 0);
  });
  window.setTimeout(run, delay * 1000);
})();

/* Playlist rail — drifts left forever, one strip per 60s to match the collage.
   A cloned strip makes the wrap seamless. The drift itself is a Web Animation
   rather than a CSS one so hover can ease the speed down to a near-stop:
   playbackRate retimes in place, where swapping animation-duration would jump. */
(function () {
  "use strict";

  var LOOP_MS = 60000; // one strip per loop, same cadence as .collage__track
  var HOVER_RATE = 0.04; // near-stop, but never quite still
  var RAMP_MS = 700; // how long the speed takes to settle either way

  if (
    !document.body.animate ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  var rails = document.querySelectorAll("[data-marquee]");

  Array.prototype.forEach.call(rails, function (rail) {
    var track = rail.querySelector(".rail__track");
    var strip = rail.querySelector(".rail__items");
    if (!track || !strip) return;

    var anim;

    // The track has to stay covered all the way to the wrap: at the far end of
    // the loop the rail is showing the second strip onward, so it needs a full
    // rail's width of strips past the first. Sizes change with the breakpoint,
    // so the count is worked out from measurements rather than hard-coded.
    function ensureStrips() {
      var guard = 8;
      while (
        track.scrollWidth < strip.offsetWidth + rail.clientWidth &&
        guard--
      ) {
        var clone = strip.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        track.appendChild(clone);
      }
    }

    // The first clone's offsetLeft is one strip plus the track gap, so ending
    // the loop there lands it exactly where the original strip started.
    function build() {
      ensureStrips();

      var distance = track.children[1] ? track.children[1].offsetLeft : 0;
      if (!distance) return;

      var at = anim ? anim.currentTime : 0;
      var rate = anim ? anim.playbackRate : 1;
      if (anim) anim.cancel();

      anim = track.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(" + -distance + "px)" },
        ],
        { duration: LOOP_MS, iterations: Infinity, easing: "linear" }
      );
      anim.currentTime = at;
      anim.playbackRate = rate;
    }

    build();

    // Ramping playbackRate by hand: setting it outright would snap the speed.
    // The rAF only lives for the length of the ramp, not the length of the loop.
    var ramping = 0;

    function rampTo(target) {
      if (!anim) return;
      window.cancelAnimationFrame(ramping);

      var from = anim.playbackRate;
      var started = null;

      ramping = window.requestAnimationFrame(function step(now) {
        if (started === null) started = now;
        var t = Math.min((now - started) / RAMP_MS, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        anim.playbackRate = from + (target - from) * eased;
        if (t < 1) ramping = window.requestAnimationFrame(step);
      });
    }

    rail.addEventListener("pointerenter", function () {
      rampTo(HOVER_RATE);
    });
    rail.addEventListener("pointerleave", function () {
      rampTo(1);
    });

    var resizeTimer;
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(build, 150);
    });

    // Artwork that lands late would shift the strip width out from under the
    // measured loop, so re-measure once everything has settled.
    window.addEventListener("load", build);
  });
})();
