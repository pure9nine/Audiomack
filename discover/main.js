// Audiomack — Discover (mobile) interactions.
// Header backdrop on scroll, genre pills, carousel dots, follow toggles,
// dismissible upsell and tab bar.

(() => {
  const scroll = document.getElementById("scroll");
  const header = document.getElementById("header");

  // Header picks up a backdrop once content slides underneath it.
  const syncHeader = () => header.classList.toggle("is-scrolled", scroll.scrollTop > 8);
  scroll.addEventListener("scroll", syncHeader, { passive: true });
  syncHeader();

  // Genre pills — single select.
  const filters = document.querySelectorAll(".filter");
  filters.forEach((pill) => {
    pill.addEventListener("click", () => {
      filters.forEach((p) => {
        const on = p === pill;
        p.classList.toggle("is-active", on);
        p.setAttribute("aria-pressed", String(on));
      });
    });
  });

  // Carousel dots follow the scroll position, and jump to a card on click.
  const carousel = document.getElementById("carousel");
  const dots = [...document.querySelectorAll("#carousel-dots button")];
  const cards = [...carousel.querySelectorAll(".foryou")];
  const step = () => cards[1].offsetLeft - cards[0].offsetLeft;

  const syncDots = () => {
    const max = carousel.scrollWidth - carousel.clientWidth;
    const index = carousel.scrollLeft >= max - 2 ? cards.length - 1 : Math.round(carousel.scrollLeft / step());
    dots.forEach((dot, i) => dot.setAttribute("aria-current", String(i === index)));
  };
  carousel.addEventListener("scroll", syncDots, { passive: true });
  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => carousel.scrollTo({ left: i * step(), behavior: "smooth" }));
  });

  // Follow buttons.
  document.querySelectorAll(".follow").forEach((btn) => {
    btn.addEventListener("click", () => {
      const on = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", String(on));
      btn.textContent = on ? "Following" : "Follow";
    });
  });

  // Dismissible upsell banner.
  document.querySelectorAll("[data-dismiss]").forEach((btn) => {
    btn.addEventListener("click", () => document.getElementById(btn.dataset.dismiss)?.remove());
  });

  // Tab bar — move the active state.
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      tabs.forEach((t) => (t === tab ? t.setAttribute("aria-current", "page") : t.removeAttribute("aria-current")));
    });
  });

})();
