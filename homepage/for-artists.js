/* For Artists page.
   1. Each feature card plays its entrance when it scrolls into view and resets
      when it has fully left, so it replays on every visit (same contract as the
      creator-onboarding slides: the card gains/loses `.in`).
   2. Cards are laid out at 564x730 and scaled down with --k in narrower columns.
   3. The wireframe globe on "Get Discovered" turns while its card is in view. */
(function () {
  "use strict";

  var cards = Array.prototype.slice.call(document.querySelectorAll(".fa-card"));
  if (!cards.length) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- fit ---- */
  function fit() {
    cards.forEach(function (card) {
      card.style.setProperty("--k", Math.min(1, card.clientWidth / 564).toFixed(4));
    });
  }
  window.addEventListener("resize", fit);
  fit();

  /* ---- entrance replay ---- */
  if (reduce || !("IntersectionObserver" in window)) {
    cards.forEach(function (card) { card.classList.add("in"); });
  } else {
    var stops = [];
    for (var i = 0; i <= 20; i++) stops.push(i / 20);
    // The hero text cascades first (its last piece, the button, lands ~2.1s
    // after load), so a card that is already on screen at load waits for that,
    // then the pair plays one after the other, left to right.
    var HERO_DONE_MS = 2100;
    var STAGGER_MS = 150;

    function reveal(card) {
      var wait = Math.max(0, HERO_DONE_MS - performance.now());
      var col = cards.indexOf(card) % 2;
      window.clearTimeout(card._t);
      card._t = window.setTimeout(function () {
        card.classList.add("in");
      }, wait + (wait > 0 ? col * STAGGER_MS : 0));
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.intersectionRatio >= 0.35) reveal(entry.target);
          else if (entry.intersectionRatio === 0) {
            window.clearTimeout(entry.target._t);
            entry.target.classList.remove("in");
          }
        });
      },
      { threshold: stops }
    );
    cards.forEach(function (card) { io.observe(card); });
  }

  /* ---- spinning wireframe globe ---- */
  (function globe() {
    var canvas = document.querySelector("canvas.globe");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var card = canvas.closest(".fa-card");
    var W = 300, H = 289, CX = 150, CY = 148, R = 134;
    var DEG = Math.PI / 180;
    var tilt = 17 * DEG, pitch = 22 * DEG;
    var ct = Math.cos(tilt), st = Math.sin(tilt), cp = Math.cos(pitch), sp = Math.sin(pitch);
    var REV_SECONDS = 26;

    canvas.width = W * 2;
    canvas.height = H * 2;
    ctx.scale(2, 2);

    function project(lat, lon, spin) {
      var cl = Math.cos(lat), l = lon + spin;
      var x = cl * Math.sin(l), y = Math.sin(lat), z = cl * Math.cos(l);
      var y1 = y * cp - z * sp, z1 = y * sp + z * cp;
      return [CX + R * (x * ct + y1 * st), CY - R * (-x * st + y1 * ct), z1];
    }

    function draw(spin) {
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, W, H);
      var front = new Path2D(), back = new Path2D();
      function line(pts) {
        for (var i = 1; i < pts.length; i++) {
          var a = pts[i - 1], b = pts[i];
          var p = (a[2] + b[2]) / 2 > 0 ? front : back;
          p.moveTo(a[0], a[1]);
          p.lineTo(b[0], b[1]);
        }
      }
      var pts, k, lat, lon;
      for (k = 0; k < 24; k++) {
        pts = [];
        for (lat = -90; lat <= 90; lat += 5) pts.push(project(lat * DEG, k * 15 * DEG, spin));
        line(pts);
      }
      for (lat = -75; lat <= 75; lat += 15) {
        pts = [];
        for (lon = 0; lon <= 360; lon += 5) pts.push(project(lat * DEG, lon * DEG, spin));
        line(pts);
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255,255,255,.15)";
      ctx.stroke(back);
      ctx.strokeStyle = "rgba(255,255,255,.4)";
      ctx.stroke(front);
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,.28)";
      ctx.stroke();

      // fade out toward the bottom, like the design
      ctx.globalCompositeOperation = "destination-in";
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    draw(0.4);
    if (reduce) return;
    (function tick(now) {
      if (card.classList.contains("in")) draw((now / 1000) * (2 * Math.PI / REV_SECONDS));
      window.requestAnimationFrame(tick);
    })(performance.now());
  })();
})();
