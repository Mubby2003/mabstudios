/* ------------------------------------------------------------------
   palette.js — reads the studio's own photographs and reports the
   colours that actually recur in them, so the site's palette is taken
   from the work rather than invented.

     node palette.js
------------------------------------------------------------------ */
const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');

const DIR = path.join(__dirname, 'site', 'assets', 'img', 'ig');

const hex = (r, g, b) => '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

function hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

/* coarse buckets so near-identical shades collapse together */
const KEY = 24;

const global = new Map();

for (const file of fs.readdirSync(DIR).filter(f => f.endsWith('.jpg')).sort()) {
  const raw = jpeg.decode(fs.readFileSync(path.join(DIR, file)), { useTArray: true });
  const { width, height, data } = raw;
  const buckets = new Map();

  for (let y = 0; y < height; y += 3) {
    for (let x = 0; x < width; x += 3) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const k = `${Math.floor(r / KEY)},${Math.floor(g / KEY)},${Math.floor(b / KEY)}`;
      const cur = buckets.get(k) || { n: 0, r: 0, g: 0, b: 0 };
      cur.n++; cur.r += r; cur.g += g; cur.b += b;
      buckets.set(k, cur);
      const gk = global.get(k) || { n: 0, r: 0, g: 0, b: 0 };
      gk.n++; gk.r += r; gk.g += g; gk.b += b;
      global.set(k, gk);
    }
  }

  const top = [...buckets.values()]
    .sort((a, b) => b.n - a.n).slice(0, 4)
    .map(c => {
      const R = c.r / c.n, G = c.g / c.n, B = c.b / c.n;
      const [h, s, l] = hsl(R, G, B);
      return `${hex(R, G, B)} h${h} s${s} l${l}`;
    });
  console.log(`${file}  ${top.join('   ')}`);
}

/* the most saturated recurring colours across the whole body of work —
   these are the ones with a point of view, not the neutrals */
console.log('\n--- recurring, most saturated across all 12 ---');
[...global.values()]
  .filter(c => c.n > 900)
  .map(c => {
    const R = c.r / c.n, G = c.g / c.n, B = c.b / c.n;
    const [h, s, l] = hsl(R, G, B);
    return { hex: hex(R, G, B), h, s, l, n: c.n };
  })
  .filter(c => c.s > 14 && c.l > 8 && c.l < 82)
  .sort((a, b) => b.s * Math.log(b.n) - a.s * Math.log(a.n))
  .slice(0, 14)
  .forEach(c => console.log(`  ${c.hex}  hue ${String(c.h).padStart(3)}  sat ${String(c.s).padStart(2)}  light ${String(c.l).padStart(2)}  weight ${c.n}`));

console.log('\n--- overall neutrals (the grounds they shoot on) ---');
[...global.values()]
  .map(c => {
    const R = c.r / c.n, G = c.g / c.n, B = c.b / c.n;
    const [h, s, l] = hsl(R, G, B);
    return { hex: hex(R, G, B), h, s, l, n: c.n };
  })
  .filter(c => c.s <= 14)
  .sort((a, b) => b.n - a.n)
  .slice(0, 6)
  .forEach(c => console.log(`  ${c.hex}  hue ${String(c.h).padStart(3)}  sat ${String(c.s).padStart(2)}  light ${String(c.l).padStart(2)}  weight ${c.n}`));
