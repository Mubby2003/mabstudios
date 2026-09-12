/* ------------------------------------------------------------------
   main.js — everything that is not a shader: preloader, cursor, nav,
   filtered archive, lightbox, reveals, counters, forms.
------------------------------------------------------------------ */
import { CATEGORIES, PHOTOS, HERO_SLIDES, REEL } from './data.js';
import { createHero } from './hero.js';
import { createReel } from './gallery3d.js';
import { createWordmark } from './wordmark.js';

/* ==================================================================
   ⚙  SETTINGS — the only lines you need to touch to go live
   ==================================================================

   ENQUIRY_ENDPOINT switches the contact form on. To get one:

     1. Sign up at https://formspree.io with info@mabstudios.co.uk
     2. New Project → New Form, call it "Website enquiries"
     3. Copy the endpoint it shows you. It looks like:
          https://formspree.io/f/abcdwxyz
     4. Paste it between the quotes below and save this file.
     5. Send yourself a test enquiry. Formspree emails you once to
        confirm the address — click that link and the form is live.

   Leave it empty and the form still validates, then asks people to use
   WhatsApp or email instead. Nothing breaks either way.

   The endpoint is a public URL — it is safe in this file, it only ever
   accepts messages. It is not a password.
================================================================== */
const ENQUIRY_ENDPOINT   = '';    // e.g. 'https://formspree.io/f/abcdwxyz'
const NEWSLETTER_ENDPOINT = '';   // optional; falls back to the one above
const STUDIO_EMAIL = 'info@mabstudios.co.uk';

/* TikTok handle, with or without the @. Leave it empty and every TikTok
   link stays hidden — nothing points at a guessed account. */
const TIKTOK_HANDLE = 'mabstudios';   // tiktok.com/@mabstudios

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse  = window.matchMedia('(hover: none)').matches;

/* ================= SOCIAL LINKS ================= */
function initSocial() {
  const handle = TIKTOK_HANDLE.trim().replace(/^@/, '');
  if (!handle) return;                       /* stays hidden until one is set */
  const url = `https://www.tiktok.com/@${handle}`;
  $$('[data-tiktok]').forEach(slot => {
    const a = $('a', slot);
    if (a) { a.href = url; a.textContent = `@${handle}`; }
    slot.hidden = false;
  });
}

/* ================= CUSTOM CURSOR ================= */
function initCursor() {
  if (coarse || reduced) { $('#cursor').remove(); return { setLabel() {}, drag() {} }; }
  const el = $('#cursor'), dot = $('.cursor__dot', el), ring = $('.cursor__ring', el), label = $('.cursor__label', el);
  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;

  addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; }, { passive: true });
  (function loop() {
    rx += (x - rx) * 0.16; ry += (y - ry) * 0.16;
    dot.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%)`;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  })();

  document.addEventListener('pointerover', e => {
    const t = e.target.closest('[data-cursor], a, button');
    el.classList.toggle('is-hover', !!t);
  });

  return {
    setLabel(text) { label.textContent = text || ''; },
    drag(on) { el.classList.toggle('is-drag', on); }
  };
}

/* ================= MAGNETIC BUTTONS ================= */
function initMagnets() {
  if (coarse || reduced) return;
  $$('[data-magnetic]').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const mx = e.clientX - r.left - r.width / 2;
      const my = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${mx * 0.22}px, ${my * 0.32}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* ================= NAV + MENU ================= */
function initNav() {
  const nav = $('#nav'), burger = $('#burger'), menu = $('#menu'), progress = $('#progress');
  let last = 0;

  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle('is-stuck', y > 40);
    nav.classList.toggle('is-hidden', y > 400 && y > last && !menu.classList.contains('is-open'));
    last = y;
    const max = document.body.scrollHeight - innerHeight;
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const close = () => {
    menu.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
  };
  burger.addEventListener('click', () => {
    const open = !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', open);
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);
  });
  $$('#menu a').forEach(a => a.addEventListener('click', close));

  /* active section in the nav */
  const links = $$('.nav__links a');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['reel', 'work', 'services', 'studio', 'contact'].forEach(id => { const s = document.getElementById(id); s && spy.observe(s); });
}

/* ================= REVEALS + COUNTERS ================= */
function initReveals() {
  const targets = $$('[data-reveal], .tile, .card, .steps li, .studio__media, .studio__text, .quote__inner, .contact__intro');
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      obs.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  targets.forEach(t => io.observe(t));

  /* safety net: if observers never fire (odd embeds, throttled tabs), nothing
     that is already on screen should stay invisible */
  setTimeout(() => {
    $$('[data-reveal], .tile, .card, .steps li').forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight) el.classList.add('is-in');
    });
  }, 2500);

  return io;
}

function initCounters() {
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, to = +el.dataset.count;
      const t0 = performance.now(), dur = 1600;
      (function run(now) {
        const p = Math.min(1, (now - t0) / dur);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(run);
      })(t0);
      obs.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => io.observe(el));
}

/* ================= LIGHTBOX ================= */
const lb = {
  el: $('#lb'), img: $('#lbImg'), title: $('#lbTitle'), place: $('#lbPlace'), count: $('#lbCount'),
  list: [], i: 0,
  open(list, i) {
    this.list = list; this.i = i;
    this.render();
    this.el.classList.add('is-open');
    this.el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
  },
  close() {
    this.el.classList.remove('is-open');
    this.el.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
  },
  step(d) { this.i = (this.i + d + this.list.length) % this.list.length; this.render(); },
  render() {
    const p = this.list[this.i];
    this.img.style.opacity = 0;
    const next = new Image();
    next.onload = () => { this.img.src = p.src; this.img.style.opacity = ''; };
    next.src = p.src;
    this.img.alt = `${p.title || 'Photograph'} — ${p.place || ''}`;
    this.title.textContent = p.title || '';
    this.place.textContent = p.venue ? `${p.place} · ${p.venue}` : (p.place || '');
    this.count.textContent = `${String(this.i + 1).padStart(2, '0')} / ${String(this.list.length).padStart(2, '0')}`;
  }
};
$('#lbClose').addEventListener('click', () => lb.close());
$('#lbPrev').addEventListener('click', () => lb.step(-1));
$('#lbNext').addEventListener('click', () => lb.step(1));
lb.el.addEventListener('click', e => { if (e.target === lb.el) lb.close(); });
addEventListener('keydown', e => {
  if (!lb.el.classList.contains('is-open')) return;
  if (e.key === 'Escape') lb.close();
  if (e.key === 'ArrowLeft') lb.step(-1);
  if (e.key === 'ArrowRight') lb.step(1);
});

/* ================= WORK GRID ================= */
const PAGE = 12;
function initGrid(revealIO) {
  const grid = $('#grid'), filters = $('#filters'), more = $('#loadMore');
  let cat = 'all', shown = PAGE;

  CATEGORIES.forEach(c => {
    const b = document.createElement('button');
    b.textContent = c.label;
    b.dataset.cat = c.id;
    b.setAttribute('role', 'tab');
    b.classList.toggle('is-on', c.id === 'all');
    b.addEventListener('click', () => {
      cat = c.id; shown = PAGE;
      $$('button', filters).forEach(x => x.classList.toggle('is-on', x === b));
      render();
    });
    filters.appendChild(b);
  });

  function visible() { return cat === 'all' ? PHOTOS : PHOTOS.filter(p => p.cat === cat); }

  function render() {
    const list = visible();
    const slice = list.slice(0, shown);
    grid.innerHTML = '';
    slice.forEach((p, i) => {
      const fig = document.createElement('figure');
      fig.className = 'tile';
      fig.setAttribute('data-cursor', 'hover');
      fig.setAttribute('tabindex', '0');
      /* venue is optional — the caption falls back to the shoot type alone */
      const where = p.venue ? `${p.place} · ${p.venue}` : p.place;
      fig.innerHTML = `
        <img src="${p.src}" alt="${p.title} — ${where}" width="${p.w}" height="${p.h}" loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async">
        <span class="tile__veil"></span>
        <span class="tile__year">${p.year}</span>
        <figcaption class="tile__cap"><strong>${p.title}</strong><span>${p.place}</span>${p.venue ? `<em class="tile__venue">${p.venue}</em>` : ''}</figcaption>`;
      const open = () => lb.open(list, i);
      fig.addEventListener('click', open);
      fig.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
      grid.appendChild(fig);
      revealIO.observe(fig);
    });
    more.parentElement.classList.toggle('is-done', shown >= list.length);
  }

  more.addEventListener('click', () => { shown += PAGE; render(); });
  render();
}

/* ================= FORMS ================= */
function initForm() {
  const form = $('#form'), note = $('#formNote');
  const rules = {
    name:    v => v.trim().length > 1 || 'Please tell us what to call you.',
    email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'That email does not look right.',
    /* deliberately loose: UK mobiles, landlines and +44 forms all vary, and
       rejecting a real number is far worse than accepting an odd one */
    phone:   v => (v.replace(/\D/g, '').length >= 7) || 'A number we can reach you on, please.',
    message: v => v.trim().length > 9 || 'A sentence or two is plenty.'
  };
  const REQUIRED = ['name', 'email', 'phone', 'message'];

  /* the standing note only promises an inbox once one is configured */
  if (ENQUIRY_ENDPOINT) {
    note.textContent = 'Your enquiry comes straight to the studio inbox. Prefer to chat? WhatsApp is faster.';
  }

  const check = input => {
    const rule = rules[input.name];
    if (!rule) return true;
    const res = rule(input.value);
    const field = input.closest('.field');
    field.classList.toggle('has-error', res !== true);
    $('small', field).textContent = res === true ? '' : res;
    return res === true;
  };

  $$('input, textarea', form).forEach(input => {
    input.addEventListener('blur', () => check(input));
    input.addEventListener('input', () => { if (input.closest('.field').classList.contains('has-error')) check(input); });
  });

  /* ---- date field ----
     The native control is fiddly: the calendar only opens from the small
     icon, and an empty field still shows dd/mm/yyyy at full strength. */
  const date = form.elements.date;
  if (date) {
    const today = new Date();
    date.min = today.toISOString().slice(0, 10);              /* no past dates */
    today.setFullYear(today.getFullYear() + 3);
    date.max = today.toISOString().slice(0, 10);

    const markEmpty = () => date.classList.toggle('is-empty', !date.value);
    markEmpty();
    date.addEventListener('input', markEmpty);
    date.addEventListener('change', markEmpty);

    /* tapping anywhere in the field opens the picker, not just the icon */
    date.addEventListener('click', () => { try { date.showPicker(); } catch {} });
    date.addEventListener('focus', () => { try { date.showPicker(); } catch {} });
  }

  const btn = $('button[type="submit"] span', form) || $('button[type="submit"]', form);
  const btnLabel = btn.textContent;

  const say = (text, good) => {
    note.textContent = text;
    note.classList.toggle('is-good', !!good);
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const ok = REQUIRED.map(n => check(form.elements[n])).every(Boolean);
    if (!ok) { say('Almost — a couple of fields need another look.'); return; }

    const first = form.elements.name.value.trim().split(' ')[0];

    /* no endpoint configured yet: validate, then point them at WhatsApp */
    if (!ENQUIRY_ENDPOINT) {
      form.classList.add('is-sent');
      say(`Thank you, ${first} — this form is not connected to an inbox yet, so please send the same details on WhatsApp or to ${STUDIO_EMAIL} and we will reply.`, true);
      return;
    }

    form.classList.add('is-sending');
    btn.textContent = 'Sending…';
    say('Sending your enquiry…');

    try {
      const res = await fetch(ENQUIRY_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      });

      if (res.ok) {
        form.classList.remove('is-sending');
        form.classList.add('is-sent');
        btn.textContent = 'Sent';
        say(`Thank you, ${first} — your enquiry is with us. We will reply to ${form.elements.email.value.trim()}. If it is urgent, WhatsApp is faster.`, true);
        form.reset();
        return;
      }

      /* Formspree returns a JSON body explaining what it did not like */
      const data = await res.json().catch(() => null);
      const why = data && data.errors ? data.errors.map(x => x.message).join(' ') : '';
      throw new Error(why || `The form service returned ${res.status}.`);

    } catch (err) {
      form.classList.remove('is-sending');
      btn.textContent = btnLabel;
      say(`That did not send — ${err.message} Please WhatsApp us or email ${STUDIO_EMAIL} instead.`);
    }
  });

  /* ---- newsletter ---- */
  const sub = $('#subForm');
  const subInput = $('input', sub);

  sub.addEventListener('submit', async e => {
    e.preventDefault();
    const value = subInput.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) { subInput.focus(); return; }

    const endpoint = NEWSLETTER_ENDPOINT || ENQUIRY_ENDPOINT;
    if (endpoint) {
      subInput.disabled = true;
      try {
        const body = new FormData();
        body.append('email', value);
        body.append('_subject', 'Newsletter signup — mabstudios.co.uk');
        body.append('signup', 'Newsletter');
        const res = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body });
        if (!res.ok) throw new Error();
      } catch {
        subInput.disabled = false;
        subInput.value = '';
        subInput.placeholder = 'That did not send — try again later.';
        return;
      }
      subInput.disabled = false;
    }

    sub.classList.add('is-ok');
    subInput.value = '';
    subInput.placeholder = 'Subscribed — thank you.';
  });
}

/* ================= HERO ================= */
async function initHero() {
  const canvas = $('#heroCanvas'), fallback = $('#heroFallback');
  const idxEl = $('#heroIdx'), labelEl = $('#heroLabel'), placeEl = $('#heroPlace'), dots = $('#heroDots');

  HERO_SLIDES.forEach((s, i) => {
    const b = document.createElement('button');
    b.innerHTML = '<i></i>';
    b.setAttribute('aria-label', `Show slide ${i + 1}: ${s.label}`);
    b.addEventListener('click', () => hero && hero.goTo(i));
    dots.appendChild(b);
  });

  const paint = (i, slide) => {
    idxEl.textContent = String(i + 1).padStart(2, '0');
    labelEl.textContent = slide.label;
    placeEl.textContent = slide.place;
    $$('button', dots).forEach((b, n) => {
      b.classList.remove('is-on');
      if (n === i) { void b.offsetWidth; b.classList.add('is-on'); }
    });
  };

  const useFallback = () => {
    canvas.style.display = 'none';
    fallback.classList.add('is-on');
    let i = 0;
    const swap = () => {
      fallback.style.backgroundImage = `url(${HERO_SLIDES[i].src})`;
      paint(i, HERO_SLIDES[i]);
      i = (i + 1) % HERO_SLIDES.length;
    };
    swap();
    if (!reduced) setInterval(swap, 6000);
  };

  const hero = reduced ? null : createHero({ canvas, slides: HERO_SLIDES, onChange: paint });
  if (!hero) { useFallback(); return; }
  const ok = await hero.start();
  if (!ok) { hero.dispose(); useFallback(); }
}

/* ================= REEL ================= */
function initReel(cursor) {
  const canvas = $('#reelCanvas'), fallbackEl = $('#reelFallback');
  const titleEl = $('#reelTitle'), placeEl = $('#reelPlace');

  const useFallback = () => {
    canvas.style.display = 'none';
    fallbackEl.hidden = false;
    REEL.forEach((item, i) => {
      const img = new Image();
      img.src = item.src;
      img.alt = `${item.title} — ${item.place}`;
      img.loading = 'lazy';
      img.addEventListener('click', () => lb.open(REEL, i));
      fallbackEl.appendChild(img);
    });
    titleEl.textContent = REEL[0].title;
    placeEl.textContent = REEL[0].place;
  };

  if (reduced) { useFallback(); return; }

  const reel = createReel({
    canvas,
    items: REEL,
    onCaption: item => { titleEl.textContent = item.title; placeEl.textContent = item.place; },
    onOpen: i => lb.open(REEL, i),
    onDragState: on => cursor.drag(on)
  });

  if (!reel) { useFallback(); return; }
  cursor.setLabel('Drag');
}

/* ================= BOOT ================= */
(async function boot() {
  $('#year').textContent = new Date().getFullYear();

  const cursor = initCursor();
  initMagnets();
  initSocial();
  initNav();
  const revealIO = initReveals();
  initCounters();
  initGrid(revealIO);
  initForm();

  /* the page is readable straight away; the hero paints in behind it */
  document.documentElement.classList.add('is-ready');

  await initHero();
  initReel(cursor);

  const markCanvas = $('#markCanvas');
  if (markCanvas) createWordmark({ canvas: markCanvas, text: 'MAB STUDIOS', reduced });
})();
