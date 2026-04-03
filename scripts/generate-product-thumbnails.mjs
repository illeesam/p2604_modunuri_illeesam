/**
 * 상품/작품 원본 이미지 옆에 `{stem}_thumbnail.webp` 생성 (목록·작은 썸네일용).
 * npm run thumbnails  (sharp: npm install)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, '..');

/**
 * 8개 사이트 중 래스터 상품·작품 폴더만 (로고·파비콘 재귀 제외).
 * 다른 사이트에 동일 패턴 폴더가 생기면 여기에 경로만 추가하면 됩니다.
 */
const PRODUCT_IMAGE_DIRS = [
  'homepage_v26/dangoeul_v260330/assets/images/products',
  'homepage_v26/artLeaseSale_v260330/assets/artworks',
];

const EXT = /\.(png|jpe?g)$/i;
const SKIP = /_thumbnail\.(webp|png|jpe?g)$/i;

const MAX_W = 420;
const WEBP_Q = 78;

async function makeThumb(srcPath) {
  const dir = path.dirname(srcPath);
  const base = path.basename(srcPath);
  if (!EXT.test(base) || SKIP.test(base)) return null;
  const stem = base.replace(/\.[^.]+$/, '');
  const dest = path.join(dir, `${stem}_thumbnail.webp`);
  await sharp(srcPath)
    .rotate()
    .resize({ width: MAX_W, withoutEnlargement: true })
    .webp({ quality: WEBP_Q, effort: 4 })
    .toFile(dest);
  return dest;
}

async function main() {
  let n = 0;
  for (const rel of PRODUCT_IMAGE_DIRS) {
    const dir = path.join(REPO, rel);
    if (!fs.existsSync(dir)) {
      console.warn('missing dir:', rel);
      continue;
    }
    for (const base of fs.readdirSync(dir)) {
      const f = path.join(dir, base);
      if (!fs.statSync(f).isFile()) continue;
      if (!EXT.test(base) || SKIP.test(base)) continue;
      try {
        const out = await makeThumb(f);
        if (out) {
          const inSz = fs.statSync(f).size;
          const outSz = fs.statSync(out).size;
          console.log(`${path.relative(REPO, out)}  (${inSz} → ${outSz} bytes)`);
          n++;
        }
      } catch (e) {
        console.error('skip', path.relative(REPO, f), e.message || e);
      }
    }
  }
  console.log(`Done. ${n} thumbnail(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
