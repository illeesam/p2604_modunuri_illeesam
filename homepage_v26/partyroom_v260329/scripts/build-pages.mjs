import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const extractDir = path.join(root, '.extract');
const pagesDir = path.join(root, 'pages');

const STYLE_BOOKING = `
      <style>
        @media (max-width: 680px) {
          .booking-layout { grid-template-columns: 1fr !important; }
        }
      </style>`;

const PAGE_META = [
  { file: 'Home.js', comp: 'PageHome', key: 'home', extra: '' },
  { file: 'About.js', comp: 'PageAbout', key: 'about', extra: '' },
  { file: 'Products.js', comp: 'PageProducts', key: 'products', extra: '' },
  { file: 'Detail.js', comp: 'PageDetail', key: 'detail', extra: '' },
  { file: 'Space.js', comp: 'PageSpace', key: 'space', extra: '' },
  { file: 'Blog.js', comp: 'PageBlog', key: 'blog', extra: '' },
  { file: 'BlogDetail.js', comp: 'PageBlogDetail', key: 'blogDetail', extra: '' },
  { file: 'Location.js', comp: 'PageLocation', key: 'location', extra: '' },
  { file: 'Contact.js', comp: 'PageContact', key: 'contact', extra: '' },
  { file: 'Faq.js', comp: 'PageFaq', key: 'faq', extra: '' },
  { file: 'Booking.js', comp: 'PageBooking', key: 'booking', extra: STYLE_BOOKING },
];

function transform(html) {
  let s = html.trimEnd();
  s = s.replace(
    /@click="\(\) => \{ booking\.room = selectedRoom\.roomId; navigate\('booking'\); \}"/g,
    '@click="partyroom.reserveThisRoom"'
  );
  s = s.replace(
    /@click="openFaq = openFaq === idx \? null : idx"/g,
    '@click="partyroom.toggleFaqAt(idx)"'
  );
  s = s.replace(/@click="activeTag = tag"/g, '@click="partyroom.setActiveTag(tag)"');

  const pairs = [
    [/\bconfig\./g, 'partyroom.config.'],
    [/\bnavigate\(/g, 'partyroom.navigate('],
    [/\bselectRoom\(/g, 'partyroom.selectRoom('],
    [/\bopenBlogDetail\(/g, 'partyroom.openBlogDetail('],
    [/@click="closeBlogDetail"/g, '@click="partyroom.closeBlogDetail"'],
    [/@click="submitContact"/g, '@click="partyroom.submitContact"'],
    [/@click="submitBooking"/g, '@click="partyroom.submitBooking"'],
    [/\bclearContactError\(/g, 'partyroom.clearContactError('],
    [/\bclearBookingError\(/g, 'partyroom.clearBookingError('],
    [/@input="resetPagination"/g, '@input="partyroom.resetPagination"'],
    [/\bv-model="searchText"/g, 'v-model="partyroom.searchText"'],
    [/\bv-model="contactForm\./g, 'v-model="partyroom.contactForm.'],
    [/\bv-model="booking\./g, 'v-model="partyroom.booking.'],
    [/\ballTags\b/g, 'partyroom.allTags'],
    [/\bactiveTag\b/g, 'partyroom.activeTag'],
    [/\bfilteredRooms\b/g, 'partyroom.filteredRooms'],
    [/\bdisplayedRooms\b/g, 'partyroom.displayedRooms'],
    [/\bhasMore\b/g, 'partyroom.hasMore'],
    [/\bselectedRoom\b/g, 'partyroom.selectedRoom'],
    [/\bblogModal\b/g, 'partyroom.blogModal'],
    [/\bbookingErrors\b/g, 'partyroom.bookingErrors'],
    [/\bbookingTotal\b/g, 'partyroom.bookingTotal'],
    [/\bcontactErrors\b/g, 'partyroom.contactErrors'],
    [/\bv-for="room in rooms"/g, 'v-for="room in partyroom.rooms"'],
    [/\brooms\.filter\b/g, 'partyroom.rooms.filter'],
    [/\brooms\.slice\b/g, 'partyroom.rooms.slice'],
    [/\brooms\.length\b/g, 'partyroom.rooms.length'],
    [/\bopenFaq\b/g, 'partyroom.openFaq'],
  ];
  for (const [re, to] of pairs) s = s.replace(re, to);
  s = s.replace(/(?<!partyroom\.)booking\./g, 'partyroom.booking.');
  return s;
}

function escTemplate(s) {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

fs.mkdirSync(pagesDir, { recursive: true });

for (const m of PAGE_META) {
  const raw = fs.readFileSync(path.join(extractDir, `${m.key}.html`), 'utf8');
  const inner = transform(raw) + m.extra;
  const tpl = escTemplate(inner);
  const out = `/* PARTYROOM — ${m.key} (index.html 분리) */
(function (g) {
  g.PartyroomPages = g.PartyroomPages || {};
  g.PartyroomPages.${m.comp} = {
    name: '${m.comp}',
    inject: ['partyroom'],
    template: \`
${tpl}
    \`,
  };
})(window);
`;
  fs.writeFileSync(path.join(pagesDir, m.file), out);
  console.log('wrote', m.file);
}
