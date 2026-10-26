/* ============================================================
   BIRTHDAY STORY WEBSITE - BEHAVIOUR
   You normally don't need to edit this file.
   ============================================================ */
(() => {
  'use strict';

  const html = document.documentElement;
  const DIR = html.dir === 'rtl' ? -1 : 1; // -1 = story moves right-to-left
  html.style.setProperty('--dir', DIR);

  const track = document.getElementById('track');
  const slides = [...track.querySelectorAll('.slide')];
  const total = slides.length;
  const dotsBox = document.getElementById('dots');
  const fill = document.getElementById('progressFill');
  const counter = document.getElementById('counter');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let index = -1;
  let lastMove = 0;

  /* ---------- stagger the reveal animations ---------- */
  slides.forEach((slide) => {
    slide.querySelectorAll('.reveal').forEach((el, k) => {
      el.style.setProperty('--d', (0.25 + k * 0.13).toFixed(2) + 's');
    });
  });

  /* ---------- dots ---------- */
  const dots = slides.map((_, k) => {
    const d = document.createElement('button');
    d.className = 'dot';
    d.setAttribute('aria-label', 'Go to slide ' + (k + 1));
    d.addEventListener('click', () => go(k));
    dotsBox.appendChild(d);
    return d;
  });

  /* ---------- animated counters ---------- */
  function runCounters(slide) {
    slide.querySelectorAll('[data-count]').forEach((el) => {
      const end = parseFloat(el.dataset.count);
      if (isNaN(end)) return;
      const pre = el.dataset.prefix || '';
      const suf = el.dataset.suffix || '';
      const dur = reduceMotion ? 1 : 1700;
      const t0 = performance.now() + 500; // wait for the slide to arrive
      (function tick() {
        const p = Math.min(1, Math.max(0, (performance.now() - t0) / dur));
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + Math.round(end * e).toLocaleString() + suf;
        if (p < 1) requestAnimationFrame(tick);
      })();
    });
  }

  /* ---------- go to a slide ---------- */
  function go(n, fromHash) {
    n = Math.max(0, Math.min(total - 1, n));
    if (n === index) return;
    lastMove = Date.now();

    if (index >= 0) slides[index].classList.remove('active');
    index = n;
    const slide = slides[index];
    slide.classList.add('active');
    slide.querySelector('.slide-inner')?.scrollTo(0, 0);

    track.style.setProperty('--i', index);
    document.body.style.setProperty('--glow', slide.dataset.glow || 'rgba(150,170,255,.25)');

    dots.forEach((d, k) => d.classList.toggle('on', k === index));
    fill.style.width = (total > 1 ? (index / (total - 1)) * 100 : 100) + '%';
    counter.textContent = index + 1 + ' / ' + total;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === total - 1;

    if (!fromHash) history.replaceState(null, '', '#' + (index + 1));

    runCounters(slide);
    if (slide.hasAttribute('data-finale')) setTimeout(() => burst(), 900);
  }

  const step = (d) => go(index + d);

  /* ---------- controls ---------- */
  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));
  document.querySelectorAll('[data-next]').forEach((b) => b.addEventListener('click', () => step(1)));

  // keyboard: the arrow that points "forward" depends on reading direction
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') step(DIR);
    else if (e.key === 'ArrowLeft') step(-DIR);
    else if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); step(-1); }
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(total - 1);
  });

  // swipe
  let tx = 0, ty = 0;
  document.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - tx;
    const dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step((dx < 0 ? 1 : -1) * DIR);
  }, { passive: true });

  // mouse wheel / trackpad (lets tall slides scroll first)
  function canScroll(el, dy) {
    if (!el) return false;
    if (el.scrollHeight <= el.clientHeight + 1) return false;
    return dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0;
  }
  window.addEventListener('wheel', (e) => {
    const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX * DIR;
    if (Math.abs(delta) < 25) return;
    if (canScroll(e.target.closest('.slide-inner'), delta)) return;
    if (Date.now() - lastMove < 900) return;
    step(delta > 0 ? 1 : -1);
  }, { passive: true });

  /* ---------- stars ---------- */
  const sc = document.getElementById('stars');
  const sctx = sc.getContext('2d');
  let stars = [];
  let feathers = [];
  function sizeStars() {
    sc.width = innerWidth; sc.height = innerHeight;
    const n = Math.min(160, Math.floor((sc.width * sc.height) / 9000));
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * sc.width, y: Math.random() * sc.height,
      r: Math.random() * 1.4 + 0.3, p: Math.random() * Math.PI * 2,
      s: Math.random() * 0.015 + 0.004, v: Math.random() * 0.12 + 0.02,
    }));
    feathers = Array.from({ length: 9 }, () => ({
      x: Math.random() * sc.width, y: Math.random() * sc.height,
      z: Math.random() * 9 + 9, a: Math.random() * Math.PI * 2, va: (Math.random() - 0.5) * 0.006,
      vy: Math.random() * 0.25 + 0.12, ph: Math.random() * Math.PI * 2, sw: Math.random() * 0.4 + 0.2,
    }));
  }
  function drawStars() {
    sctx.clearRect(0, 0, sc.width, sc.height);
    for (const s of stars) {
      s.p += s.s;
      s.y -= reduceMotion ? 0 : s.v;
      if (s.y < -2) { s.y = sc.height + 2; s.x = Math.random() * sc.width; }
      sctx.globalAlpha = 0.25 + 0.55 * Math.abs(Math.sin(s.p));
      sctx.fillStyle = '#fff';
      sctx.beginPath(); sctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); sctx.fill();
    }
    // slowly drifting feathers
    for (const f of feathers) {
      if (!reduceMotion) { f.ph += 0.01; f.y += f.vy; f.x += Math.sin(f.ph) * f.sw; f.a += f.va; }
      if (f.y > sc.height + 30) { f.y = -30; f.x = Math.random() * sc.width; }
      sctx.save();
      sctx.translate(f.x, f.y); sctx.rotate(f.a + Math.sin(f.ph) * 0.5);
      sctx.globalAlpha = 0.22; sctx.fillStyle = '#e6ebff'; sctx.strokeStyle = '#ffffff'; sctx.lineWidth = 0.8;
      sctx.beginPath(); sctx.ellipse(0, 0, f.z * 0.26, f.z, 0, 0, Math.PI * 2); sctx.fill();
      sctx.beginPath(); sctx.moveTo(0, -f.z * 1.1); sctx.lineTo(0, f.z * 1.1); sctx.stroke();
      sctx.restore();
    }
    sctx.globalAlpha = 1;
    requestAnimationFrame(drawStars);
  }
  sizeStars(); drawStars();

  /* ---------- confetti ---------- */
  const cc = document.getElementById('confetti');
  const cctx = cc.getContext('2d');
  let bits = [];
  let confettiRunning = false;
  function burst() {
    if (reduceMotion) return;
    cc.width = innerWidth; cc.height = innerHeight;
    const colors = ['#a9b8ff', '#e6ebff', '#ffffff', '#c9a8ff'];
    for (let k = 0; k < 160; k++) {
      bits.push({
        x: cc.width / 2 + (Math.random() - 0.5) * 120,
        y: cc.height * 0.6,
        vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 16 - 6,
        w: Math.random() * 8 + 4, h: Math.random() * 5 + 3,
        a: Math.random() * Math.PI * 2, va: (Math.random() - 0.5) * 0.4,
        c: colors[(Math.random() * colors.length) | 0], life: 0,
      });
    }
    if (!confettiRunning) { confettiRunning = true; fall(); }
  }
  function fall() {
    cctx.clearRect(0, 0, cc.width, cc.height);
    bits = bits.filter((b) => b.life < 260 && b.y < cc.height + 20);
    for (const b of bits) {
      b.life++; b.vy += 0.35; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.a += b.va;
      cctx.save();
      cctx.globalAlpha = Math.max(0, 1 - b.life / 260);
      cctx.translate(b.x, b.y); cctx.rotate(b.a);
      cctx.fillStyle = b.c; cctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      cctx.restore();
    }
    if (bits.length) requestAnimationFrame(fall);
    else { confettiRunning = false; cctx.clearRect(0, 0, cc.width, cc.height); }
  }
  document.getElementById('celebrate')?.addEventListener('click', burst);

  /* ---------- music (optional) ---------- */
  const bgm = document.getElementById('bgm');
  const musicBtn = document.getElementById('musicBtn');
  if (bgm && bgm.getAttribute('src')) {
    musicBtn.hidden = false;
    const setState = () => musicBtn.classList.toggle('playing', !bgm.paused);
    musicBtn.addEventListener('click', () => { bgm.paused ? bgm.play().catch(() => {}) : bgm.pause(); setState(); });
    // browsers block autoplay, so start on the first click / key press
    const startOnce = () => { bgm.play().then(setState).catch(() => {}); };
    document.addEventListener('click', (e) => { if (!musicBtn.contains(e.target)) startOnce(); }, { once: true });
  }

  /* ---------- resize + start ---------- */
  addEventListener('resize', () => { sizeStars(); cc.width = innerWidth; cc.height = innerHeight; });
  const fromHash = parseInt(location.hash.slice(1), 10);
  go(!isNaN(fromHash) ? fromHash - 1 : 0, true);
})();
