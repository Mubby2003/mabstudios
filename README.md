# MAB Studios — photography site

An interactive one-page site for MAB Studios ([@mabstudiosuk](https://www.instagram.com/mabstudiosuk)),
a UK photography studio shooting portraits, weddings, traditional
ceremonies and events. Two WebGL pieces (three.js) carry the interaction:
a shader-driven hero slideshow and a draggable 3D carousel. Everything
else is hand-written HTML/CSS/JS — no framework, no build step for the
site itself.

## Run it

```bash
node server.js
```

Then open <http://localhost:5173>.

No Node? There is a PowerShell server that needs nothing installed:

```bash
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```

Opening `site/index.html` straight from the file system will **not** work —
browsers block ES modules and WebGL textures over `file://`. Use a server.

## Layout

```
Mubby Project/
├─ server.js              tiny static server (no dependencies)
├─ serve.ps1              same thing, for machines without Node
├─ build-artifact.js      compiles /site into one shareable HTML file
├─ palette.js             samples the photographs for the site's colours
├─ site/
│  ├─ index.html          all the markup
│  ├─ css/style.css       the whole design system, in sections
│  ├─ js/
│  │  ├─ data.js          every photograph, caption and category
│  │  ├─ hero.js          WebGL hero slideshow
│  │  ├─ gallery3d.js     WebGL "Signature Series" carousel
│  │  └─ main.js          nav, archive, lightbox, forms, reveals
│  └─ assets/
│     ├─ img/ig/          the 12 photographs
│     ├─ fonts/           Cormorant Garamond + Inter, self-hosted
│     └─ vendor/          three.js r160
└─ build/                 output of build-artifact.js
```

## The photographs

The 12 frames in `site/assets/img/ig/` are MAB Studios' own work, taken
from the public Instagram grid. They are Instagram's 640px copies — sharp
enough for the archive grid, a little soft behind the full-screen hero.

**To sharpen the site:** drop the full-resolution originals into that
folder using the same filenames (`ig-01.jpg` … `ig-12.jpg`) and everything
improves with no code change. Update the `w:` and `h:` values in
[site/js/data.js](site/js/data.js) so the grid reserves the right space.

## Colours

The palette is sampled from the photographs rather than invented:

```bash
node palette.js
```

It prints the colours that recur across the archive. The tokens at the top
of [site/css/style.css](site/css/style.css) are named after where each one
came from:

| Token | Value | Taken from |
| --- | --- | --- |
| `--ash` | `#0d0a08` | the warm near-black of the tuxedo and car |
| `--paper` / `--linen` | `#e8e4dc` / `#f0ebe3` | the grey seamless behind the studio portraits |
| `--candle` | `#e2b087` | the warm highlight on skin and aso oke |
| `--gele` | `#6b070b` | the deep red of the gele and beaded corset |
| `--emerald` | `#06665a` | the green backdrop behind the cream gown |
| `--sienna` | `#804125` | the woven stripe and the brown seamless |

Candlelight is the accent on dark sections, emerald on the light ones, and
Gele Red is spent in exactly one place — the featured service card.

## Changing things

**Photographs** — add a file to `site/assets/img/ig/`, then add one row to
`PHOTOS` in [site/js/data.js](site/js/data.js). That list feeds the archive
grid, the filters and the lightbox. `HERO_SLIDES` picks what the hero
cycles through; `REEL` picks what sits on the 3D carousel.

**Words** — all in [site/index.html](site/index.html). Services are three
`<article class="card">` blocks; add or remove them freely.

## Publishing

`build-artifact.js` flattens the site into one HTML file with the images
embedded:

```bash
node build-artifact.js
```

It writes `build/mab-studios.html` (~0.9 MB), loading three.js from a CDN
and the fonts from Google. Re-run it after any edit to `/site`, then
republish.

For ordinary web hosting, upload the `site/` folder as-is — it is already
a complete static site.

## Switching the contact form on

The form is fully wired for [Formspree](https://formspree.io) — it just
needs your endpoint. Open [site/js/main.js](site/js/main.js) and look at
the settings block at the top:

```js
const ENQUIRY_ENDPOINT   = '';    // e.g. 'https://formspree.io/f/abcdwxyz'
```

To fill it in:

1. Sign up at <https://formspree.io> using `info@mabstudios.co.uk`.
2. **New Project → New Form**, name it "Website enquiries".
3. Copy the endpoint it gives you (`https://formspree.io/f/xxxxxxxx`).
4. Paste it between the quotes and save.
5. Send yourself a test enquiry. Formspree emails you once to confirm the
   address — click that link and the form is live.
6. Re-run `node build-artifact.js` if you want the published copy updated
   too.

The free plan allows 50 submissions a month. The endpoint is a public URL,
so it is safe to leave in this file — it only accepts messages, it is not
a password.

**While it is empty** the form still validates and then asks people to use
WhatsApp or email, so nothing is broken in the meantime.

What already works around it: a "Sending…" state, a confirmation naming
the address the reply will go to, an error message that keeps everything
the visitor typed so they can retry, a hidden `_gotcha` spam trap, and a
`_subject` line so the email arrives readable. The newsletter box posts to
`NEWSLETTER_ENDPOINT`, falling back to the enquiry one.

## Still to do

- **There is no testimonials section.** The earlier draft had invented
  quotes; those were removed. Send real client reviews and it can go back.
- **Service cards say "enquire for rates"** rather than listing prices,
  since no real prices were available.
- **Behance / Journal links** were removed; only Instagram, WhatsApp and
  email are linked, because those are the channels on the profile.
