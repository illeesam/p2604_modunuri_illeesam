import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(/\r\n/g, '\n');

const start = html.indexOf('        <!-- ===== PAGE: HOME ===== -->');
const end = html.indexOf('\n\n      </div>\n    </div>\n\n    <!-- Footer -->', start);
if (start === -1 || end === -1) throw new Error('markers not found');

const replacement = `        <!-- 커스텀 태그는 명시적 </tag> 필요 (HTML에서 /> 는 형제가 아닌 중첩으로 파싱됨) -->
        <page-home v-show="page==='home'"></page-home>
        <page-about v-show="page==='about'"></page-about>
        <page-services v-show="page==='services'"></page-services>
        <page-portfolio v-show="page==='portfolio'"></page-portfolio>
        <page-blog v-show="page==='blog'"></page-blog>
        <page-blog-detail v-show="page==='blogDetail'"></page-blog-detail>
        <page-contact v-show="page==='contact'"></page-contact>`;

html = html.slice(0, start) + replacement + html.slice(end);
fs.writeFileSync(indexPath, html.replace(/\n/g, '\r\n'), 'utf8');
console.log('patched', indexPath);
