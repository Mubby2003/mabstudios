/* ------------------------------------------------------------------
   import-photos.js — drop photographs in, get a website out.

     1. put JPEGs in  incoming/
     2. node import-photos.js
     3. paste the printed rows into site/js/data.js

   For each photograph it writes three sizes into site/assets/img/ig/:

       name-1500.jpg   lightbox, hero, retina
       name-800.jpg    archive grid on a laptop
       name-400.jpg    archive grid on a phone

   The page picks whichever it needs through srcset, so a phone never
   downloads a 1500px file to show it 380px wide. That is the single
   biggest thing holding the site's load time down.

   Filenames become titles: "red-gele.jpg" -> "Red Gele". Rename the
   files before importing and the captions write themselves.
------------------------------------------------------------------ */
const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');

const IN   = path.join(__dirname, 'incoming');
const OUT  = path.join(__dirname, 'site', 'assets', 'img', 'ig');
const SIZES = [1500, 800, 400];
const QUALITY = { 1500: 82, 800: 80, 400: 78 };

/* box filter: averages every source pixel landing in a destination pixel.
   Slower than nearest-neighbour, but it is the difference between crisp
   and mushy when you are shrinking a 4000px file to 400px. */
function resize(src, sw, sh, dw, dh) {
  const dst = Buffer.alloc(dw * dh * 4);
  const xr = sw / dw, yr = sh / dh;
  for (let y = 0; y < dh; y++) {
    const y0 = Math.floor(y * yr), y1 = Math.min(sh, Math.ceil((y + 1) * yr));
    for (let x = 0; x < dw; x++) {
      const x0 = Math.floor(x * xr), x1 = Math.min(sw, Math.ceil((x + 1) * xr));
      let r = 0, g = 0, b = 0, n = 0;
      for (let sy = y0; sy < y1; sy++) {
        let i = (sy * sw + x0) * 4;
        for (let sx = x0; sx < x1; sx++, i += 4) { r += src[i]; g += src[i + 1]; b += src[i + 2]; n++; }
      }
      const o = (y * dw + x) * 4;
      dst[o] = r / n; dst[o + 1] = g / n; dst[o + 2] = b / n; dst[o + 3] = 255;
    }
  }
  return dst;
}

const titleFrom = f =>
  path.basename(f, path.extname(f))
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());

const slugFrom = f =>
  path.basename(f, path.extname(f))
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

if (!fs.existsSync(IN)) {
  fs.mkdirSync(IN, { recursive: true });
  console.log(`\n  Created ${path.relative(__dirname, IN)}/ — put JPEGs in there and run this again.\n`);
  process.exit(0);
}

const files = fs.readdirSync(IN).filter(f => /\.jpe?g$/i.test(f)).sort();
if (!files.length) {
  console.log(`\n  Nothing in ${path.relative(__dirname, IN)}/ yet. Put JPEGs in there and run this again.\n`);
  process.exit(0);
}

fs.mkdirSync(OUT, { recursive: true });
console.log(`\n  Importing ${files.length} photograph${files.length > 1 ? 's' : ''}…\n`);

const rows = [];
let written = 0, bytes = 0, skipped = 0;

for (const file of files) {
  const slug = slugFrom(file);
  try {
    const img = jpeg.decode(fs.readFileSync(path.join(IN, file)), { useTArray: true, maxMemoryUsageInMB: 2048 });
    const longEdge = Math.max(img.width, img.height);
    const out = [];

    for (const size of SIZES) {
      const scale = Math.min(1, size / longEdge);
      const dw = Math.max(1, Math.round(img.width * scale));
      const dh = Math.max(1, Math.round(img.height * scale));
      let out_bytes;

      if (scale === 1) {
        /* already at or under this size — copy the original bytes rather than
           decode and re-encode, which would throw away quality for nothing */
        out_bytes = fs.readFileSync(path.join(IN, file));
      } else {
        const data = resize(img.data, img.width, img.height, dw, dh);
        out_bytes = jpeg.encode({ data, width: dw, height: dh }, QUALITY[size]).data;
      }

      fs.writeFileSync(path.join(OUT, `${slug}-${size}.jpg`), out_bytes);
      out.push({ size, dw, dh, bytes: out_bytes.length, copied: scale === 1 });
      written++; bytes += out_bytes.length;
    }

    const full = out[0];
    rows.push(`  { src: 'assets/img/ig/${slug}', w: ${full.dw}, h: ${full.dh}, cat: 'weddings', title: '${titleFrom(file).replace(/'/g, "\\'")}', place: '', venue: '', year: '${new Date().getFullYear()}' },`);

    console.log(`  ${file}`);
    console.log(`      ${img.width}x${img.height}  ->  ` +
      out.map(o => `${o.dw}x${o.dh} ${Math.round(o.bytes / 1024)}KB`).join('   '));
  } catch (e) {
    skipped++;
    console.log(`  ! ${file} — could not read it (${e.message})`);
  }
}

console.log(`\n  ${written} files written, ${(bytes / 1024 / 1024).toFixed(1)} MB total${skipped ? `, ${skipped} skipped` : ''}`);

if (rows.length) {
  console.log(`\n  ---- paste into PHOTOS in site/js/data.js, then set cat/place/venue ----\n`);
  console.log(rows.join('\n'));
  console.log(`
  cat must be one of: weddings, traditional, portraits, events
  place is the shoot type, e.g. 'Wedding portrait'
  venue is optional — the location, if you want it shown

  Then: node build-artifact.js && git add -A && git commit && git push
`);
}
