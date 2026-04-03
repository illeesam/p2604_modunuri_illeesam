/**
 * One-off: normalize site-config.json schema (menuId/menuName, codes camelCase, etc.)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const FILES = [
  'anynuri_v260329/api/base/site-config.json',
  'artLeaseSale_v260330/api/base/site-config.json',
  'careMate_v260330/api/base/site-config.json',
  'dangoeul_v260330/api/base/site-config.json',
  'home_v260329/api/base/site-config.json',
  'modunuri_v260329/api/base/site-config.json',
  'partyroom_v260329/api/base/site-config.json',
];

function migrateMenuItem(obj) {
  if (!obj || typeof obj !== 'object') return;
  if ('menuId' in obj || 'menu_id' in obj) return;
  if (!('id' in obj && 'label' in obj)) return;
  obj.menuId = obj.id;
  delete obj.id;
  obj.menuName = obj.label;
  delete obj.label;
}

function migrateMenusInRoot(data) {
  if (Array.isArray(data.topMenu)) data.topMenu.forEach(migrateMenuItem);
  if (Array.isArray(data.sidebarMenu)) {
    data.sidebarMenu.forEach((sec) => {
      if (Array.isArray(sec.items)) sec.items.forEach(migrateMenuItem);
    });
  }
  if (Array.isArray(data.menus)) data.menus.forEach(migrateMenuItem);
}

function migrateCodes(data) {
  if (!Array.isArray(data.codes)) return;
  for (const c of data.codes) {
    if (c.code_id !== undefined) {
      c.codeId = c.code_id;
      delete c.code_id;
    }
    if (c.code_grp !== undefined) {
      c.codeGrp = c.code_grp;
      delete c.code_grp;
    }
    if (c.code_value !== undefined) {
      c.codeValue = c.code_value;
      delete c.code_value;
    }
    if (c.code_label !== undefined) {
      c.codeLabel = c.code_label;
      delete c.code_label;
    }
  }
}

function migrateCategories(data) {
  if (!Array.isArray(data.categories)) return;
  const arr = data.categories;
  if (arr.length === 0) {
    data.categorys = [];
    delete data.categories;
    return;
  }
  const first = arr[0];
  if (typeof first === 'string') {
    const slugMap = { 로맨스: 'romance', 액션: 'action', 판타지: 'fantasy', 코미디: 'comedy', SF: 'sf' };
    data.categorys = arr.map((s) => {
      if (s === '전체') return { categoryId: 'all', categoryName: '전체' };
      return { categoryId: slugMap[s] || s, categoryName: s };
    });
    delete data.categories;
    return;
  }
  if (typeof first === 'object' && first !== null && !Array.isArray(first)) {
    data.categorys = arr.map((o) => {
      const out = { categoryId: o.id, categoryName: o.label };
      if (o.icon != null) out.icon = o.icon;
      if (o.color != null) out.color = o.color;
      if (o.desc != null) out.desc = o.desc;
      return out;
    });
    delete data.categories;
  }
}

function migrateProducts(data) {
  if (!Array.isArray(data.products)) return;
  for (const p of data.products) {
    if (p.id !== undefined) {
      p.productId = p.id;
      delete p.id;
    }
    if (p.name !== undefined) {
      p.productName = p.name;
      delete p.name;
    }
  }
}

function migrateRooms(data) {
  if (!Array.isArray(data.rooms)) return;
  for (const r of data.rooms) {
    if (r.id !== undefined) {
      r.roomId = r.id;
      delete r.id;
    }
    if (r.name !== undefined) {
      r.roomName = r.name;
      delete r.name;
    }
  }
}

function migrateArtworks(data) {
  if (!Array.isArray(data.artworks)) return;
  for (const a of data.artworks) {
    if (a.id !== undefined) {
      a.artworkId = a.id;
      delete a.id;
    }
    if (a.name !== undefined) {
      a.artworkName = a.name;
      delete a.name;
    }
  }
}

function migrateHospitalsDept(data) {
  if (Array.isArray(data.hospitals) && data.hospitals.length && typeof data.hospitals[0] === 'string') {
    data.hospitals = data.hospitals.map((name, i) => ({ hospitalId: i + 1, hospitalName: name }));
  }
  if (Array.isArray(data.departments) && data.departments.length && typeof data.departments[0] === 'string') {
    data.departments = data.departments.map((name, i) => ({ departmentId: 20 + i, departmentName: name }));
  }
}

for (const rel of FILES) {
  const fp = path.join(ROOT, rel);
  const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
  migrateMenusInRoot(data);
  migrateCodes(data);
  migrateCategories(data);
  migrateProducts(data);
  migrateRooms(data);
  migrateArtworks(data);
  migrateHospitalsDept(data);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log('migrated', rel);
}
