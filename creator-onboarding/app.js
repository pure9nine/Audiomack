(() => {
  const phone  = document.getElementById('phone');
  const slides = Array.from(document.querySelectorAll('.slide'));
  const dots   = Array.from(document.querySelectorAll('.dots i'));
  const N = slides.length;

  const AUTOPLAY_MS   = 6000;  // time on each slide before auto-advancing
  const DRAG_PER_SLIDE = 300;  // px of drag for a full slide change
  const ART_SHIFT     = 150;   // px the graphic travels while fading
  const COPY_SHIFT    = 60;    // px the text travels (less = subtle parallax)

  let pos = 0;                 // float slide position; integer = settled on a slide
  let scale = 1;
  let autoplay = true;         // turned off for good once the user swipes
  let timer = null;
  let anim = null;
  let ready = false;           // entrances start only after the first paint

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const mod = (n, m) => ((n % m) + m) % m;

  /* ---------- render ---------- */
  function render() {
    for (let i = 0; i < N; i++) {
      // signed distance of slide i from the current position, wrapped for looping
      let d = mod(i - pos + N / 2, N) - N / 2;
      const a = Math.abs(d);
      const s = slides[i];

      if (a >= 1) {
        s.style.visibility = 'hidden';
        s.style.opacity = 0;
        s.classList.remove('in');           // reset so the entrance replays next visit
        continue;
      }
      if (ready && a < 0.5) s.classList.add('in');   // mostly in frame: play the entrance
      s.style.visibility = 'visible';
      s.style.opacity = 1;

      const art  = s.firstElementChild;
      const copy = s.querySelector('.copy');

      // graphic: fade out, then back in with the next one
      art.style.opacity   = clamp(1 - a * 1.5, 0, 1);
      art.style.transform = `translate3d(${(d * ART_SHIFT).toFixed(2)}px,0,0)`;

      // text fades a little faster so it's gone before the next one arrives
      copy.style.opacity   = clamp(1 - a * 2.2, 0, 1);
      copy.style.transform = `translate3d(${(d * COPY_SHIFT).toFixed(2)}px,0,0)`;
    }

    const active = mod(Math.round(pos), N);
    dots.forEach((el, i) => el.classList.toggle('on', i === active));
  }

  /* ---------- animation ---------- */
  function animateTo(target, ms) {
    cancelAnimationFrame(anim);
    const from = pos;
    const dist = target - from;
    if (Math.abs(dist) < 0.001) { pos = target; render(); settled(); return; }
    const dur = ms ?? clamp(Math.abs(dist) * 520, 180, 560);
    const t0 = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);

    const step = now => {
      const t = clamp((now - t0) / dur, 0, 1);
      pos = from + dist * ease(t);
      render();
      if (t < 1) anim = requestAnimationFrame(step);
      else { pos = target; render(); settled(); }
    };
    anim = requestAnimationFrame(step);
  }

  /* ---------- autoplay ---------- */
  function settled() {
    clearTimeout(timer);
    if (!autoplay) return;
    timer = setTimeout(() => animateTo(Math.round(pos) + 1), AUTOPLAY_MS);
  }

  function stopAutoplay() {
    autoplay = false;
    clearTimeout(timer);
  }

  /* ---------- drag / swipe ---------- */
  let dragging = false, moved = false;
  let startX = 0, startPos = 0, lastX = 0, lastT = 0, velocity = 0;

  phone.addEventListener('pointerdown', e => {
    if (e.button !== undefined && e.button !== 0) return;
    cancelAnimationFrame(anim);
    clearTimeout(timer);
    dragging = true;
    moved = false;
    startX = lastX = e.clientX;
    startPos = pos;
    lastT = e.timeStamp;
    velocity = 0;
  });

  phone.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = (e.clientX - startX) / scale;
    if (!moved && Math.abs(dx) > 6) {
      moved = true;
      stopAutoplay();                       // they're swiping: no more auto-advance
      phone.classList.add('dragging');
      try { phone.setPointerCapture(e.pointerId); } catch (_) {}
    }
    if (!moved) return;

    // never travel more than one slide from where the drag started
    pos = clamp(startPos - dx / DRAG_PER_SLIDE, startPos - 1, startPos + 1);

    const dt = e.timeStamp - lastT;
    if (dt > 0) velocity = 0.8 * velocity + 0.2 * ((e.clientX - lastX) / scale / dt);
    lastX = e.clientX;
    lastT = e.timeStamp;
    render();
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    phone.classList.remove('dragging');
    if (!moved) { settled(); return; }

    const delta = pos - startPos;               // + = heading to next slide
    // always snap to a whole slide (startPos can be fractional if the drag
    // began while an auto-advance was still animating)
    let target = Math.round(pos);
    if (Math.abs(delta) > 0.2 || Math.abs(velocity) > 0.4) {
      const dir = Math.abs(velocity) > 0.4 ? -Math.sign(velocity) : Math.sign(delta);
      if (dir > 0) target = Math.floor(startPos) + 1;
      else if (dir < 0) target = Math.ceil(startPos) - 1;
    }
    animateTo(target);
  }
  phone.addEventListener('pointerup', endDrag);
  phone.addEventListener('pointercancel', endDrag);

  // a swipe that ends on a button shouldn't count as a click
  phone.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

  /* ---------- keyboard ---------- */
  window.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    stopAutoplay();
    animateTo(Math.round(pos) + (e.key === 'ArrowRight' ? 1 : -1));
  });

  /* ---------- fit the 375x812 frame to short/narrow windows ---------- */
  function fit() {
    scale = Math.min(1, window.innerHeight / 812, window.innerWidth / 375);
    document.documentElement.style.setProperty('--scale', scale);
  }
  window.addEventListener('resize', fit);
  fit();

  /* ---------- go ---------- */
  render();
  void phone.offsetHeight;                      // commit the "before" state so the first entrance animates
  requestAnimationFrame(() => { ready = true; render(); });
  settled();
})();
