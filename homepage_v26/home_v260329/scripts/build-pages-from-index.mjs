/**
 * One-off: slice index.html PAGE blocks → pages/*.js (studio inject).
 * Run: node homepage_v26/home_v260329/scripts/build-pages-from-index.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const indexPath = path.join(root, 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

const PAGES = [
  { marker: 'HOME', file: 'Home.js', name: 'PageHome', componentTag: 'page-home' },
  { marker: 'ABOUT', file: 'About.js', name: 'PageAbout', componentTag: 'page-about' },
  { marker: 'SERVICES', file: 'Services.js', name: 'PageServices', componentTag: 'page-services' },
  { marker: 'PORTFOLIO', file: 'Portfolio.js', name: 'PagePortfolio', componentTag: 'page-portfolio' },
  { marker: 'BLOG', file: 'Blog.js', name: 'PageBlog', componentTag: 'page-blog' },
  { marker: 'BLOG DETAIL', file: 'BlogDetail.js', name: 'PageBlogDetail', componentTag: 'page-blog-detail' },
  { marker: 'CONTACT', file: 'Contact.js', name: 'PageContact', componentTag: 'page-contact' },
];

function extractPageInner(full, markerLabel) {
  const marker = `<!-- ===== PAGE: ${markerLabel} ===== -->`;
  const start = full.indexOf(marker);
  if (start === -1) throw new Error('Missing marker: ' + markerLabel);
  const divStart = full.indexOf('<div', start);
  const gt = full.indexOf('>', divStart);
  const innerStart = gt + 1;
  let depth = 1;
  let i = innerStart;
  while (depth > 0 && i < full.length) {
    const nextOpen = full.indexOf('<div', i);
    const nextClose = full.indexOf('</div>', i);
    if (nextClose === -1) throw new Error('Unclosed div: ' + markerLabel);
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = nextOpen + 4;
    } else {
      depth--;
      i = nextClose + 6;
    }
  }
  const inner = full.slice(innerStart, i - 6);
  const openTag = full.slice(divStart, gt + 1);
  const attrs = openTag.replace(/^<div\s*/, '').replace(/>$/, '');
  const attrsNoShow = attrs
    .replace(/\s*v-show="page==='[^']*'"\s*/g, ' ')
    .replace(/\s*v-show="page===\"[^\"]*\""\s*/g, ' ')
    .trim();
  const rootOpen = attrsNoShow ? `<div ${attrsNoShow}>` : '<div>';
  return `${rootOpen}\n${inner.trim()}\n</div>`;
}

function transformTemplate(tpl) {
  let s = tpl;
  s = s.replace(/\bnavigate\(/g, 'studio.navigate(');
  s = s.replace(/\bconfig\./g, 'studio.config.');
  s = s.replace(/\bheroStats\b/g, 'studio.heroStats');
  s = s.replace(/\bteam\b/g, 'studio.team');
  s = s.replace(/\bposts\b/g, 'studio.posts');
  s = s.replace(/\bcats\b/g, 'studio.cats');
  s = s.replace(/\bactiveCat\b/g, 'studio.activeCat');
  s = s.replace(/@click="studio\.activeCat=cat"/g, '@click="studio.setActiveCat(cat)"');
  s = s.replace(/\bsearchText\b/g, 'studio.searchText');
  s = s.replace(/\bresetPagination\b/g, 'studio.resetPagination');
  s = s.replace(/\bdisplayedPortfolio\b/g, 'studio.displayedPortfolio');
  s = s.replace(/\bfilteredPortfolio\b/g, 'studio.filteredPortfolio');
  s = s.replace(/\bhasMore\b/g, 'studio.hasMore');
  s = s.replace(/\bopenBlogDetail\(/g, 'studio.openBlogDetail(');
  s = s.replace(/\bcloseBlogDetail\b/g, 'studio.closeBlogDetail');
  s = s.replace(/\bblogModal\b/g, 'studio.blogModal');
  s = s.replace(/\bformErrors\b/g, 'studio.formErrors');
  s = s.replace(/\bclearFormError\(/g, 'studio.clearFormError(');
  s = s.replace(/\bcontactServiceRows\b/g, 'studio.contactServiceRows');
  s = s.replace(/\bcontactBudgetRows\b/g, 'studio.contactBudgetRows');
  s = s.replace(/\bsubmitForm\b/g, 'studio.submitForm');
  s = s.replace(/\bform\./g, 'studio.form.');
  s = s.replace(/\bv-model="form\./g, 'v-model="studio.form.');
  s = s.replace(/@click="openFaq=openFaq===faq\.q\?null:faq\.q"/g, '@click="studio.toggleFaq(faq.q)"');
  s = s.replace(/\bopenFaq===/g, 'studio.openFaq===');
  s = s.replace(/\bvalues\b/g, 'studio.values');
  return s;
}

for (const p of PAGES) {
  const raw = extractPageInner(html, p.marker);
  const body = transformTemplate(raw);
  const out = `/* HOME — ${p.marker} (index.html 본문 분리) */
(function (g) {
  g.HomePages = g.HomePages || {};
  g.HomePages.${p.name} = {
    name: '${p.name}',
    inject: ['studio'],
    template: \`
${body.replace(/`/g, '\\`').replace(/\$/g, '\\$')}
\`,
  };
})(typeof window !== 'undefined' ? window : globalThis);
`;
  fs.writeFileSync(path.join(root, 'pages', p.file), out, 'utf8');
  console.log('wrote', p.file);
}

console.log('done');
