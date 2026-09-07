/* ------------------------------------------------------------------
   data.js — every photograph on the site.

   These are MAB Studios' own frames, pulled from @mabstudiosuk. They
   are Instagram grid copies (640px), which is fine for the archive but
   soft behind the full-screen hero — drop the full-resolution files
   into /assets/img/ig/ over the top of these and everything sharpens
   with no code change.

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
  { src: 'assets/img/ig/ig-01.jpg', w: 513, h: 640, cat: 'weddings',    title: 'Black Tie, White Cape', place: 'Wedding portrait',   year: '2026' },
  { src: 'assets/img/ig/ig-02.jpg', w: 512, h: 640, cat: 'weddings',    title: 'Out of the Pavilion',   place: 'Wedding day',        year: '2025' },
  { src: 'assets/img/ig/ig-03.jpg', w: 480, h: 640, cat: 'weddings',    title: 'Held Close',            place: 'Pre-wedding',        year: '2025' },

  /* --- Traditional ------------------------------------------------- */
  { src: 'assets/img/ig/ig-08.jpg', w: 480, h: 640, cat: 'traditional', title: 'Red Gele',              place: 'Traditional bridal', year: '2026' },
  { src: 'assets/img/ig/ig-07.jpg', w: 480, h: 640, cat: 'traditional', title: 'Aso Oke, Two Ways',     place: 'Traditional couple', year: '2026' },

  /* --- Portraits --------------------------------------------------- */
  { src: 'assets/img/ig/ig-05.jpg', w: 512, h: 640, cat: 'portraits',   title: 'Emerald',               place: 'Studio portrait',    year: '2026' },
  { src: 'assets/img/ig/ig-06.jpg', w: 512, h: 640, cat: 'portraits',   title: 'Silver Fringe',         place: 'Studio portrait',    year: '2026' },
  { src: 'assets/img/ig/ig-09.jpg', w: 640, h: 512, cat: 'portraits',   title: 'Three',                 place: 'Group portrait',     year: '2026' },
  { src: 'assets/img/ig/ig-10.jpg', w: 480, h: 640, cat: 'portraits',   title: 'Rose Gold',             place: 'Studio portrait',    year: '2026' },
  { src: 'assets/img/ig/ig-12.jpg', w: 512, h: 640, cat: 'portraits',   title: 'Mint',                  place: 'Personal branding',  year: '2026' },

  /* --- Events ------------------------------------------------------ */
  { src: 'assets/img/ig/ig-11.jpg', w: 480, h: 640, cat: 'events',      title: 'Make a Wish',           place: 'Birthday shoot',     year: '2026' },
  { src: 'assets/img/ig/ig-04.jpg', w: 480, h: 640, cat: 'events',      title: 'Dance in the Park',     place: 'Celebration',        year: '2026' }
];

/* The hero cycles through these, in order. */
export const HERO_SLIDES = [
  { src: 'assets/img/ig/ig-01.jpg', label: 'Black Tie, White Cape', place: 'Wedding portrait' },
  { src: 'assets/img/ig/ig-08.jpg', label: 'Red Gele',              place: 'Traditional bridal' },
  { src: 'assets/img/ig/ig-05.jpg', label: 'Emerald',               place: 'Studio portrait' },
  { src: 'assets/img/ig/ig-02.jpg', label: 'Out of the Pavilion',   place: 'Wedding day' },
  { src: 'assets/img/ig/ig-09.jpg', label: 'Three',                 place: 'Group portrait' }
];

/* The draggable 3D carousel. */
export const REEL = [
  'assets/img/ig/ig-08.jpg',
  'assets/img/ig/ig-01.jpg',
  'assets/img/ig/ig-05.jpg',
  'assets/img/ig/ig-07.jpg',
  'assets/img/ig/ig-10.jpg',
  'assets/img/ig/ig-02.jpg',
  'assets/img/ig/ig-06.jpg',
  'assets/img/ig/ig-04.jpg',
  'assets/img/ig/ig-12.jpg',
  'assets/img/ig/ig-03.jpg'
].map((src, i) => {
  const meta = PHOTOS.find(p => p.src === src) || {};
  return { src, title: meta.title || '', place: meta.place || '', index: i };
});
