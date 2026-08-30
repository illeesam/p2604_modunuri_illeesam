/* verifyLazyClassIntegrity.js — lib/app/{bo,fo}AppLazyClasses.js 의 "클래스명 -> 파일경로"
 * 매핑이 실제 파일 내용과 여전히 일치하는지 검증한다.
 *
 * 용도 1) 지금 당장 — 소스에 대해 돌려서 "생성기를 안 돌려서 맵이 낡았다"를 잡는 이중 안전망
 *        (generateBoLazyClasses.js/generateFoLazyClasses.js 를 깜빡하고 안 돌린 경우)
 * 용도 2) 나중에 esbuild/terser 로 배포용 압축 파이프라인을 만들 때 — 압축된 dist/ 폴더를
 *        대상으로 돌려서 "property mangling 이 켜져서 window.ClassName 의 ClassName 이
 *        다른 이름으로 바뀌었다" 를 배포 전에 즉시 잡는 게이트로 쓴다.
 *        예) node scripts/verifyLazyClassIntegrity.js --dir dist
 *        여기서 실패하면(exit 1) 배포 스크립트/CI 가 그 자리에서 멈추도록 연결해두면,
 *        "압축 옵션 잘못 켰는지 사람이 기억해야 하는" 리스크가 사라진다.
 *
 * 사용법: node scripts/verifyLazyClassIntegrity.js [--dir <검사할 루트 디렉토리, 기본=프로젝트 루트>]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const argDirIdx = process.argv.indexOf('--dir');
const TARGET_DIR = argDirIdx >= 0 && process.argv[argDirIdx + 1]
  ? path.resolve(ROOT, process.argv[argDirIdx + 1])
  : ROOT;

/* extractGlobalNames — generateBoLazyClasses.js/generateFoLazyClasses.js 와 동일한 패턴.
   window.X= 또는 global.X=(IIFE 파라미터 별칭) 대입에서 클래스명을 전부 추출한다. */
function extractGlobalNames(absFilePath) {
  const src = fs.readFileSync(absFilePath, 'utf8');
  const matches = [...src.matchAll(/^[ \t]*(?:window|global)\.([A-Z][A-Za-z0-9_]*)\s*=/gm)];
  return new Set(matches.map((m) => m[1]));
}

function verifyMap(label, map, regToGlobal) {
  let ok = 0;
  const failed = [];
  Object.entries(map).forEach(([regName, relPath]) => {
    const absPath = path.join(TARGET_DIR, relPath);
    if (!fs.existsSync(absPath)) {
      failed.push({ regName, relPath, reason: '파일이 없음' });
      return;
    }
    const expectedGlobal = (regToGlobal && regToGlobal[regName]) || regName;
    const found = extractGlobalNames(absPath);
    if (found.has(expectedGlobal)) {
      ok++;
    } else {
      failed.push({ regName, relPath, reason: `window.${expectedGlobal}= 을 못 찾음(발견된 이름: ${[...found].join(', ') || '없음'})` });
    }
  });
  console.log(`\n=== ${label} (검사 대상: ${TARGET_DIR}) ===`);
  console.log(`정상: ${ok}개 / 전체: ${Object.keys(map).length}개`);
  if (failed.length) {
    console.log(`⚠️  불일치 ${failed.length}개:`);
    failed.forEach((f) => console.log(`   - ${f.regName} (${f.relPath}): ${f.reason}`));
  } else {
    console.log('✅ 전부 일치');
  }
  return failed.length;
}

global.window = { FO_SITE_NO: process.env.FO_SITE_NO || '01', BO_SITE_NO: process.env.BO_SITE_NO || '01' };
require(path.join(ROOT, 'lib/app/boAppLazyClasses.js'));
require(path.join(ROOT, 'lib/app/foAppLazyClasses.js'));

const boFail = verifyMap('BO_LAZY_CLASS_FILES', global.window.BO_LAZY_CLASS_FILES, null);
const foFail = verifyMap('FO_LAZY_CLASS_FILES', global.window.FO_LAZY_CLASS_FILES, global.window.FO_REG_TO_GLOBAL);

const total = boFail + foFail;
console.log(`\n=== 총 ${total}개 불일치 ===`);
process.exit(total > 0 ? 1 : 0);
