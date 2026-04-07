/**
 * site-config.json: if products/artworks/works use categoryId but categorys is missing or empty,
 * build categorys [{ categoryId, categoryName }]. Also append any product categoryId missing from categorys.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const APPS = [
  'anynuri_v260329',
  'artLeaseSale_v260330',
  'careMate_v260330',
  'dangoeul_v260330',
  'home_v260329',
  'modunuri_v260329',
  'partyroom_v260329',
];

/** Display labels for known slugs (fallback: categoryId string as-is) */
const CATEGORY_NAME_BY_ID = {
  all: '전체',
  romance: '로맨스',
  action: '액션',
  fantasy: '판타지',
  comedy: '코미디',
  sf: 'SF',
  flower: '꽃',
  landscape: '풍경',
  stillLife: '정물',
  animal: '동물',
  seedling: '모종',
  set: '세트',
  analytics: '시각화',
  collaboration: '협업',
  security: '보안',
  erp: 'ERP',
  app: '앱',
  cloud: '클라우드',
  purchase: 'e커머스',
  homepage: '홈페이지',
  admin: 'Admin',
  hospital: '병원동행',
  daily: '일상생활지원',
  disabled: '장애인활동지원',
  care: '요양보호사',
};

function collectCategoryIdsFromLists(data) {
  const ids = new Set();
  for (const key of ['products', 'artworks', 'works']) {
    const arr = data[key];
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      if (item && item.categoryId != null && item.categoryId !== '') {
        ids.add(String(item.categoryId));
      }
    }
  }
  return ids;
}

function needsCategorys(data) {
  const ids = collectCategoryIdsFromLists(data);
  if (ids.size === 0) return { ids, action: 'skip' };
  const raw = data.categorys;
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ids, action: 'init' };
  }
  const known = new Set(raw.map((c) => String(c.categoryId)));
  for (const id of ids) {
    if (!known.has(id)) return { ids, action: 'merge' };
  }
  return { ids, action: 'ok' };
}

function labelFor(id) {
  return CATEGORY_NAME_BY_ID[id] ?? id;
}

for (const app of APPS) {
  const jsonPath = path.join(ROOT, app, 'api', 'base', 'site-config.json');
  if (!fs.existsSync(jsonPath)) continue;

  const text = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(text);
  const { ids, action } = needsCategorys(data);

  if (action === 'skip') {
    console.log(app, 'no categoryId on products/artworks/works — skipped');
    continue;
  }

  if (action === 'init') {
    const ordered = [...ids].sort();
    data.categorys = ordered.map((categoryId) => ({
      categoryId,
      categoryName: labelFor(categoryId),
    }));
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(app, 'wrote categorys', data.categorys.length, 'entries');
    continue;
  }

  if (action === 'merge') {
    const rows = Array.isArray(data.categorys) ? [...data.categorys] : [];
    const known = new Set(rows.map((c) => String(c.categoryId)));
    for (const id of [...ids].sort()) {
      if (!known.has(id)) {
        rows.push({ categoryId: id, categoryName: labelFor(id) });
        known.add(id);
      }
    }
    data.categorys = rows;
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(app, 'merged categorys, total', rows.length);
    continue;
  }

  console.log(app, 'categorys ok');
}
