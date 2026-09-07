/* ------------------------------------------------------------------
   wordmark.js — the footer wordmark, built out of particles.

   The studio name is drawn to an offscreen canvas, its pixels sampled,
   and one particle placed at each. They drift gently on their own; the
   pointer pushes them aside like beads in water and they ease back.

   Deliberately 2D canvas, not WebGL: the page already runs two WebGL
   contexts (hero and carousel) and a third would cost real battery on
   a phone for a decorative flourish.
------------------------------------------------------------------ */

const SETTINGS = {
  sample: 4,          /* read every Nth pixel of the rendered text */
  maxParticles: 5000, /* raise the sample step rather than exceed this */
  dotSize: 1.7,
  spring: 0.055,      /* pull back to the letterform */
  damping: 0.86,
  radius: 120,        /* how far the pointer reaches */
  push: 2.6,          /* how hard it shoves */
  drift: 0.18         /* idle motion, so it never looks frozen */
};

export function createWordmark({ canvas, text, reduced }) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  let particles = [];
  let raf = 0, inView = false, dpr = 1;
  let w = 0, h = 0;
  const pointer = { x: -9999, y: -9999, active: false };

  const styles = getComputedStyle(document.documentElement);
  const base = styles.getPropertyValue('--linen').trim() || '#f0ebe3';
  const accent = styles.getPropertyValue('--candle').trim() || '#e2b087';

  /* ---------- build the letterform ---------- */
  function build() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;

    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.round(rect.width);
    h = Math.round(rect.height);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* draw the text once, offscreen, purely to read its pixels */
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    const octx = off.getContext('2d', { willReadFrequently: true });

    /* size the type to fill the width, with a little breathing room */
    let size = h * 0.9;
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    const font = weight => `${weight} ${size}px Inter, system-ui, sans-serif`;
    octx.font = font(200);
    const target = w * 0.94;
    const measured = octx.measureText(text).width;
    size = Math.max(12, size * (target / measured));
    octx.font = font(200);
    octx.letterSpacing = '0.02em';
    octx.fillStyle = '#fff';
    octx.fillText(text, w / 2, h / 2);

    const data = octx.getImageData(0, 0, w, h).data;

    /* widen the sampling step until the count is sane on small screens */
    let step = SETTINGS.sample;
    let found;
    do {
      found = [];
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          if (data[(y * w + x) * 4 + 3] > 128) found.push([x, y]);
        }
      }
      step += 1;
    } while (found.length > SETTINGS.maxParticles && step < 14);

    particles = found.map(([x, y]) => ({
      hx: x, hy: y,                                   /* home */
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 40,
      vx: 0, vy: 0,
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.8,
      lit: 0
    }));
  }

  /* ---------- animation ---------- */
  let t = 0;
  function frame() {
    raf = requestAnimationFrame(frame);
    if (!inView || document.hidden) return;

    t += 0.01;
    ctx.clearRect(0, 0, w, h);

    const r2 = SETTINGS.radius * SETTINGS.radius;

    for (const p of particles) {
      /* idle drift keeps the word breathing */
      const dx = Math.sin(t * p.speed + p.phase) * SETTINGS.drift;
      const dy = Math.cos(t * p.speed * 0.8 + p.phase) * SETTINGS.drift;

      /* pointer pushes outward, strongest at the centre of its reach */
      let lit = 0;
      if (pointer.active) {
        const ox = p.x - pointer.x, oy = p.y - pointer.y;
        const d2 = ox * ox + oy * oy;
        if (d2 < r2 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const force = (1 - d / SETTINGS.radius) * SETTINGS.push;
          p.vx += (ox / d) * force;
          p.vy += (oy / d) * force;
          lit = 1 - d / SETTINGS.radius;
        }
      }

      /* spring home */
      p.vx += (p.hx - p.x) * SETTINGS.spring + dx;
      p.vy += (p.hy - p.y) * SETTINGS.spring + dy;
      p.vx *= SETTINGS.damping;
      p.vy *= SETTINGS.damping;
      p.x += p.vx;
      p.y += p.vy;

      p.lit += (lit - p.lit) * 0.18;

      /* particles the pointer has disturbed warm towards the accent */
      ctx.fillStyle = p.lit > 0.02 ? accent : base;
      ctx.globalAlpha = 0.30 + p.lit * 0.7;
      ctx.fillRect(p.x, p.y, SETTINGS.dotSize, SETTINGS.dotSize);
    }
    ctx.globalAlpha = 1;
  }

  /* a still, legible version for reduced-motion and no-JS-animation cases */
  function drawStatic() {
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = base;
    for (const p of particles) ctx.fillRect(p.hx, p.hy, SETTINGS.dotSize, SETTINGS.dotSize);
    ctx.globalAlpha = 1;
  }

  /* ---------- input ---------- */
  const move = e => {
    const r = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    pointer.x = cx - r.left;
    pointer.y = cy - r.top;
    /* a generous margin so it reacts as the cursor approaches */
    pointer.active = pointer.x > -80 && pointer.x < r.width + 80 &&
                     pointer.y > -80 && pointer.y < r.height + 80;
  };
  const leave = () => { pointer.active = false; };

  let resizeTimer;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { build(); if (reduced) drawStatic(); }, 180);
  };

  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('touchmove', move, { passive: true });
  canvas.addEventListener('pointerleave', leave);
  window.addEventListener('blur', leave);
  window.addEventListener('resize', onResize);

  const io = new IntersectionObserver(e => { inView = e[0].isIntersecting; }, { threshold: 0.05 });
  io.observe(canvas);

  /* Paint a still frame the moment it is built, so the wordmark is never
     blank — the loop only runs once the footer scrolls into view, and a
     throttled tab can hold that off indefinitely. */
  build();
  drawStatic();

  /* fonts change the letterform, so rebuild once they have landed */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { build(); drawStatic(); });
  }

  if (!reduced) raf = requestAnimationFrame(frame);

  return {
    dispose() {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('touchmove', move);
      canvas.removeEventListener('pointerleave', leave);
      window.removeEventListener('blur', leave);
      window.removeEventListener('resize', onResize);
    }
  };
}
