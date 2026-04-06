import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

/** Slice from v-show div up to (but not including) the HTML comment that introduces the next page. */
const pages = [
  { key: 'home', start: `<div v-show="page === 'home'"`, nextPageLabel: 'PAGE: ABOUT' },
  { key: 'about', start: `<div v-show="page === 'about'"`, nextPageLabel: 'PAGE: PRODUCTS' },
  { key: 'products', start: `<div v-show="page === 'products'"`, nextPageLabel: 'PAGE: DETAIL' },
  { key: 'detail', start: `<div v-show="page === 'detail'"`, nextPageLabel: 'PAGE: SPACE' },
  { key: 'space', start: `<div v-show="page === 'space'"`, nextPageLabel: 'PAGE: BLOG' },
  { key: 'blog', start: `<div v-show="page === 'blog'"`, nextPageLabel: 'PAGE: BLOG DETAIL' },
  { key: 'blogDetail', start: `<div v-show="page === 'blogDetail'"`, nextPageLabel: 'PAGE: LOCATION' },
  { key: 'location', start: `<div v-show="page === 'location'"`, nextPageLabel: 'PAGE: CONTACT' },
  { key: 'contact', start: `<div v-show="page === 'contact'"`, nextPageLabel: 'PAGE: FAQ' },
  { key: 'faq', start: `<div v-show="page === 'faq'"`, nextPageLabel: 'PAGE: BOOKING' },
  { key: 'booking', start: `<div v-show="page === 'booking'"`, nextPageLabel: 'BOOKING RESPONSIVE' },
];

const outDir = path.join(root, '.extract');
fs.mkdirSync(outDir, { recursive: true });

for (const p of pages) {
  const i = html.indexOf(p.start);
  if (i < 0) {
    console.error('start not found', p.key);
    process.exit(1);
  }
  let j;
  if (p.key === 'booking') {
    j = html.indexOf('<!-- Booking responsive -->', i + 1);
  } else {
    const labelPos = html.indexOf(p.nextPageLabel, i + 1);
    if (labelPos < 0) {
      console.error('label not found', p.key, p.nextPageLabel);
      process.exit(1);
    }
    j = html.lastIndexOf('<!--', labelPos);
    if (j < i) {
      console.error('comment rewind failed', p.key);
      process.exit(1);
    }
  }
  if (j < 0) {
    console.error('end not found', p.key);
    process.exit(1);
  }
  let chunk = html.slice(i, j);
  chunk = chunk.replace(/^<div v-show="page === '[^']+'"\s*/, '<div ');
  fs.writeFileSync(path.join(outDir, `${p.key}.html`), chunk.trimEnd());
  console.log(p.key, chunk.length);
}
