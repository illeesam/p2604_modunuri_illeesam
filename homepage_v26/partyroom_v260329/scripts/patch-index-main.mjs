import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const start = '    <!-- MAIN CONTENT -->';
const mainOpen = '<main style="flex:1;min-width:0;overflow-x:hidden;">';
const i = html.indexOf(start);
if (i < 0) {
  console.error('start not found');
  process.exit(1);
}
const iMain = html.indexOf(mainOpen, i);
if (iMain < 0) {
  console.error('main not found');
  process.exit(1);
}
const j = html.indexOf('    </main>', iMain);
if (j < 0) {
  console.error('end main not found');
  process.exit(1);
}
const replacement = `    <!-- MAIN CONTENT -->
    <main style="flex:1;min-width:0;overflow-x:hidden;">
      <page-home v-show="page === 'home'" />
      <page-about v-show="page === 'about'" />
      <page-products v-show="page === 'products'" />
      <page-detail v-show="page === 'detail'" />
      <page-space v-show="page === 'space'" />
      <page-blog v-show="page === 'blog'" />
      <page-blog-detail v-show="page === 'blogDetail'" />
      <page-location v-show="page === 'location'" />
      <page-contact v-show="page === 'contact'" />
      <page-faq v-show="page === 'faq'" />
      <page-booking v-show="page === 'booking'" />
    </main>`;

html = html.slice(0, i) + replacement + html.slice(j + '    </main>'.length);
fs.writeFileSync(indexPath, html);
console.log('patched main');
