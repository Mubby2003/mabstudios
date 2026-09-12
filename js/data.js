/* ------------------------------------------------------------------
   data.js — every photograph on the site.

   These are MAB Studios' own frames. Each one exists at three widths
   (400 / 800 / 1500) written by import-photos.js, and "src" below is the
   base name — no size, no extension. The helpers underneath turn it into
   a real file, and the archive uses srcset so a phone never downloads a
   1500px copy to show it 255px wide.

   To add more: put JPEGs in incoming/, run "node import-photos.js", and
   paste the rows it prints.

   Titles describe the frame. Nothing here invents a venue, a client
   name or a location that was not in the original post.
------------------------------------------------------------------ */

export const CATEGORIES = [
  { id: 'all',         label: 'All Work' },
  { id: 'weddings',    label: 'Weddings' },
  { id: 'traditional', label: 'Traditional' },
  { id: 'portraits',   label: 'Portraits' },
  { id: 'events',      label: 'Events' }
];

export const PHOTOS = [
  /* --- Weddings ---------------------------------------------------- */
  { src: 'assets/img/ig/black-tie-white-cape', w: 1203, h: 1500, cat: 'weddings',    title: 'Black Tie, White Cape', place: 'Wedding portrait',   venue: '',      year: '2026' },
  { src: 'assets/img/ig/out-of-the-pavilion', w: 1200, h: 1500, cat: 'weddings',    title: 'Out of the Pavilion',   place: 'Wedding day',        venue: '',      year: '2025' },
  { src: 'assets/img/ig/held-close', w: 1125, h: 1500, cat: 'weddings',    title: 'Held Close',            place: 'Pre-wedding',        venue: '',      year: '2025' },

  /* --- Traditional ------------------------------------------------- */
  { src: 'assets/img/ig/red-gele', w: 1125, h: 1500, cat: 'traditional', title: 'Red Gele',              place: 'Traditional bridal', venue: '',      year: '2026' },
  { src: 'assets/img/ig/aso-oke-two-ways', w: 1125, h: 1500, cat: 'traditional', title: 'Aso Oke, Two Ways',     place: 'Traditional couple', venue: '',      year: '2026' },

  /* --- Portraits --------------------------------------------------- */
  { src: 'assets/img/ig/emerald', w: 1200, h: 1500, cat: 'portraits',   title: 'Emerald',               place: 'Studio portrait',    venue: '',      year: '2026' },
  { src: 'assets/img/ig/silver-fringe', w: 1200, h: 1500, cat: 'portraits',   title: 'Silver Fringe',         place: 'Studio portrait',    venue: '',      year: '2026' },
  { src: 'assets/img/ig/three', w: 1500, h: 1200, cat: 'portraits',   title: 'Three',                 place: 'Group portrait',     venue: '',      year: '2026' },
  { src: 'assets/img/ig/rose-gold', w: 1125, h: 1500, cat: 'portraits',   title: 'Rose Gold',             place: 'Studio portrait',    venue: '',      year: '2026' },
  { src: 'assets/img/ig/mint', w: 1200, h: 1500, cat: 'portraits',   title: 'Mint',                  place: 'Personal branding',  venue: '',      year: '2026' },

  /* --- Events ------------------------------------------------------ */
  { src: 'assets/img/ig/make-a-wish', w: 1125, h: 1500, cat: 'events',      title: 'Make a Wish',           place: 'Birthday shoot',     venue: '',      year: '2026' },
  { src: 'assets/img/ig/dance-in-the-park', w: 1125, h: 1500, cat: 'events',      title: 'Dance in the Park',     place: 'Celebration',        venue: '',      year: '2026' }
];

/* ------------------------------------------------------------------
   Every photograph exists at three widths, written by import-photos.js.
   PHOTOS.src is the base name without a size or extension; these helpers
   turn it into a real file. A phone showing a tile 380px wide should not
   be downloading the 1500px copy.
------------------------------------------------------------------ */
export const SIZES = [400, 800, 1500];
export const img = (base, size = 1500) => `${base}-${size}.jpg`;
export const srcsetFor = base => SIZES.map(s => `${img(base, s)} ${s}w`).join(', ');

/* The hero cycles through these, in order. Full size: it fills the frame. */
export const HERO_SLIDES = [
  { src: img('assets/img/ig/black-tie-white-cape', 1500), label: 'Black Tie, White Cape', place: 'Wedding portrait' },
  { src: img('assets/img/ig/red-gele', 1500), label: 'Red Gele',              place: 'Traditional bridal' },
  { src: img('assets/img/ig/emerald', 1500), label: 'Emerald',               place: 'Studio portrait' },
  { src: img('assets/img/ig/out-of-the-pavilion', 1500), label: 'Out of the Pavilion',   place: 'Wedding day' },
  { src: img('assets/img/ig/three', 1500), label: 'Three',                 place: 'Group portrait' }
];

/* The draggable 3D carousel. */
export const REEL = [
  'assets/img/ig/red-gele',
  'assets/img/ig/black-tie-white-cape',
  'assets/img/ig/emerald',
  'assets/img/ig/aso-oke-two-ways',
  'assets/img/ig/rose-gold',
  'assets/img/ig/out-of-the-pavilion',
  'assets/img/ig/silver-fringe',
  'assets/img/ig/dance-in-the-park',
  'assets/img/ig/mint',
  'assets/img/ig/held-close',
].map((src, i) => {
  const meta = PHOTOS.find(p => p.src === src) || {};
  return { src: img(src, 800), full: img(src, 1500), title: meta.title || '', place: meta.place || '', index: i };
});
