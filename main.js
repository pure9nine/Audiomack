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
