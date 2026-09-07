/* ------------------------------------------------------------------
   build-artifact.js — compiles the multi-file site in /site into ONE
   self-contained HTML file that can be published as an Artifact.

     node build-artifact.js

   What it does:
     · inlines css/style.css and all four JS modules into one scope
     · swaps `import * as THREE from 'three'` for the UMD build on cdnjs
     · replaces every local image path with a base64 data URI, using the
       copies in /site/assets/img/ig
     · swaps the self-hosted fonts for the Google Fonts stylesheet
       (the only font host an Artifact is allowed to reach)

   Edit the real site in /site — then re-run this and republish.
------------------------------------------------------------------ */
const fs = require('fs');
const path = require('path');

const ROOT   = __dirname;
const SITE   = path.join(ROOT, 'site');
const SMALL  = path.join(ROOT, 'site', 'assets', 'img', 'ig');
const OUT    = path.join(ROOT, 'build', 'mab-studios.html');

const THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.min.js';
const FONTS_CDN = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300&family=Inter:wght@300;400;500;600&display=swap';

const read = p => fs.readFileSync(p, 'utf8');

/* ---------- image paths -> data URIs ---------- */
const dataUri = new Map();
for (const file of fs.readdirSync(SMALL)) {
  if (!file.endsWith('.jpg')) continue;
  const b64 = fs.readFileSync(path.join(SMALL, file)).toString('base64');
  dataUri.set(file, `data:image/jpeg;base64,${b64}`);
}

let missing = 0;

/* HTML: the handful of <img src> paths become data URIs directly */
function inlineImages(text) {
  return text.replace(/assets\/img\/[a-z]+\/([\w-]+\.jpg)/g, (whole, file) => {
    const uri = dataUri.get(file);
    if (!uri) { console.warn(`  ! no small copy of ${file} — left as a path`); missing++; return whole; }
    return uri;
  });
}

/* JS: several photos are referenced two or three times over (archive, hero,
   reel), so they point at one shared table instead of repeating the base64 */
const used = new Set();
function tableRefs(text) {
  return text.replace(/(['"`])assets\/img\/[a-z]+\/([\w-]+\.jpg)\1/g, (whole, q, file) => {
    if (!dataUri.has(file)) { console.warn(`  ! no small copy of ${file}`); missing++; return whole; }
    used.add(file);
    return `IMG[${JSON.stringify(file)}]`;
  });
}

/* ---------- javascript: four modules, one scope ---------- */
const stripModule = src => src
  .replace(/^\s*import[^;]+;\s*$/gm, '')                 // import * as THREE / import {...}
  .replace(/^export\s+/gm, '');                          // export const / export function

const js = ['data.js', 'hero.js', 'gallery3d.js', 'main.js']
  .map(f => `/* ===== ${f} ===== */\n` + stripModule(read(path.join(SITE, 'js', f))))
  .join('\n\n');

const jsRefs = tableRefs(js);
const table = [...used].sort().map(f => `${JSON.stringify(f)}:${JSON.stringify(dataUri.get(f))}`).join(',\n');
const bundle = `(function(){\n"use strict";\nconst THREE = window.THREE;\nconst IMG = {\n${table}\n};\n\n${jsRefs}\n})();`;

/* ---------- css ---------- */
const css = read(path.join(SITE, 'css', 'style.css'));

/* ---------- html ---------- */
let html = read(path.join(SITE, 'index.html'));

const body = html
  .slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'))
  .replace(/<script type="module"[^>]*><\/script>/g, '');

/* the artifact gallery wants a name, not the SEO sentence in site/index.html */
const title = 'MAB Studios';

const out = `<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS_CDN}">
<style>
${css}
</style>
<script src="${THREE_CDN}"></script>
${inlineImages(body)}
<script>
${bundle}
</script>
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out, 'utf8');

const mb = (Buffer.byteLength(out) / 1024 / 1024).toFixed(2);
console.log(`\n  built  ${path.relative(ROOT, OUT)}`);
console.log(`  size   ${mb} MB  (Artifact limit is 16 MB)`);
console.log(`  images ${dataUri.size} inlined${missing ? `, ${missing} missing` : ''}\n`);
