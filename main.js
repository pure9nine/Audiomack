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
