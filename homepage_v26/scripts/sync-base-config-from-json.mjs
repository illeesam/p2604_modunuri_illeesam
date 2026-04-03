/**
 * Overwrite each app's base/config.js from api/base/site-config.json (offline fallback).
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

for (const app of APPS) {
  const jsonPath = path.join(ROOT, app, 'api', 'base', 'site-config.json');
  const outPath = path.join(ROOT, app, 'base', 'config.js');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const body =
    '/* Synced from api/base/site-config.json (do not diverge structure manually) */\n' +
    'window.SITE_CONFIG = ' +
    JSON.stringify(data, null, 2) +
    ';\n';
  fs.writeFileSync(outPath, body, 'utf8');
  console.log('wrote', path.relative(ROOT, outPath));
}
