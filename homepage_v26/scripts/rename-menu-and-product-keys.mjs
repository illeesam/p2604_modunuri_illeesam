/**
 * site-config: menu_id/menu_name → menuId/menuName;
 * products[]: category/categoryLabel → categoryId/categoryName
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

function renameMenuKeys(obj) {
  if (!obj || typeof obj !== 'object') return;
  if ('menu_id' in obj) {
    obj.menuId = obj.menu_id;
    delete obj.menu_id;
  }
  if ('menu_name' in obj) {
    obj.menuName = obj.menu_name;
    delete obj.menu_name;
  }
}

function migrateMenus(data) {
  if (Array.isArray(data.topMenu)) data.topMenu.forEach(renameMenuKeys);
  if (Array.isArray(data.sidebarMenu)) {
    data.sidebarMenu.forEach((sec) => {
      if (Array.isArray(sec.items)) sec.items.forEach(renameMenuKeys);
    });
  }
  if (Array.isArray(data.menus)) data.menus.forEach(renameMenuKeys);
}

function migrateProducts(data) {
  if (!Array.isArray(data.products)) return;
  for (const p of data.products) {
    if (p && typeof p === 'object') {
      if ('category' in p) {
        p.categoryId = p.category;
        delete p.category;
      }
      if ('categoryLabel' in p) {
        p.categoryName = p.categoryLabel;
        delete p.categoryLabel;
      }
    }
  }
}

for (const rel of FILES) {
  const fp = path.join(ROOT, rel);
  const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
  migrateMenus(data);
  migrateProducts(data);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log('updated', rel);
}
