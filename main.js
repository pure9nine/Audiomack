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
