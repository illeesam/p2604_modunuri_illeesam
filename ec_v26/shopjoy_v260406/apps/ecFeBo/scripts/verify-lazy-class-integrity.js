/* verify-lazy-class-integrity.js — lib/app/{bo,fo}AppLazyClasses.js 의 "클래스명 -> 파일경로"
 * 매핑이 실제 파일 내용과 여전히 일치하는지 검증한다.
 *
 * 용도 1) 지금 당장 — 소스에 대해 돌려서 "생성기를 안 돌려서 맵이 낡았다"를 잡는 이중 안전망
 *        (generate-bo-lazy-classes.js/generate-fo-lazy-classes.js 를 깜빡하고 안 돌린 경우)
 * 용도 2) 나중에 esbuild/terser 로 배포용 압축 파이프라인을 만들 때 — 압축된 dist/ 폴더를
 *        대상으로 돌려서 "property mangling 이 켜져서 window.ClassName 의 ClassName 이
 *        다른 이름으로 바뀌었다" 를 배포 전에 즉시 잡는 게이트로 쓴다.
 *        예) node scripts/verify-lazy-class-integrity.js --dir dist
 *        여기서 실패하면(exit 1) 배포 스크립트/CI 가 그 자리에서 멈추도록 연결해두면,
 *        "압축 옵션 잘못 켰는지 사람이 기억해야 하는" 리스크가 사라진다.
 *
 * 사용법: node scripts/verify-lazy-class-integrity.js [--dir <검사할 루트 디렉토리, 기본=프로젝트 루트>]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const argDirIdx = process.argv.indexOf('--dir');
const TARGET_DIR = argDirIdx >= 0 && process.argv[argDirIdx + 1]
  ? path.resolve(ROOT, process.argv[argDirIdx + 1])
  : ROOT;

// 2026-09-05: 이 스크립트가 찍는 모든 로그 앞에 파일명 태그를 자동으로 붙인다(console.log/warn/error
// 를 한 번만 감싸서, 개별 호출부를 전부 고칠 필요 없이 항상 적용되게 함). 맨 앞 개행(\n)은
// 그대로 유지해서 기존 줄바꿈 스타일(단계 사이 빈 줄)이 안 깨지게 한다.
const TAG = '[verify-lazy-class-integrity.js]';
function hms() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
['log', 'warn', 'error'].forEach((level) => {
  const orig = console[level].bind(console);
  console[level] = (first, ...rest) => {
    const prefix = `[${hms()}]${TAG}`;
    if (typeof first === 'string') {
      const m = first.match(/^\n+/);
      orig(m ? m[0] + prefix + ' ' + first.slice(m[0].length) : prefix + ' ' + first, ...rest);
    } else {
      orig(prefix, first, ...rest);
    }
  };
});

/* extractGlobalNames — generate-bo-lazy-classes.js/generate-fo-lazy-classes.js 와 동일한 패턴.
   window.X= 또는 global.X=(IIFE 파라미터 별칭) 대입에서 클래스명을 전부 추출한다. */
function extractGlobalNames(absFilePath) {
  const src = fs.readFileSync(absFilePath, 'utf8');
  // 2026-08-30 수정: 원래 ^[ \t]* (줄 시작) 앵커였으나, minify 된 코드는 여러 문장이 한 줄에
  // 붙어(`];window.X={...`) window.X= 가 더 이상 줄 시작이 아니게 된다 — build:minify 도입 후
  // dist/ 검증(verify-dist)에서 정상 파일 48개가 오탐으로 잡혔던 원인. "식별자 문자가 아닌 것
  // 뒤에 오는 window./global." 로 조건을 바꿔 줄 위치와 무관하게 매치한다.
  const matches = [...src.matchAll(/(?<![\w.$])(?:window|global)\.([A-Z][A-Za-z0-9_]*)\s*=(?!=)/g)];
  return new Set(matches.map((m) => m[1]));
}

function verifyMap(stepLabel, label, map, regToGlobal) {
  console.log(`\n[${stepLabel}] ${label} 검증 — 맵의 각 항목이 실제 파일에 여전히 존재하는지 확인 (대상: ${TARGET_DIR})`);
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
  console.log(`  ㄴ 맵 전체 ${Object.keys(map).length}개 항목을 하나씩 파일 열어서 대조`);
  if (failed.length) {
    console.log(`  결과: ⚠️  불일치 ${failed.length}개 (정상 ${ok}개)`);
    failed.forEach((f) => console.log(`   - ${f.regName} (${f.relPath}): ${f.reason}`));
  } else {
    console.log(`  결과: ✅ 전부 일치 (${ok}개)`);
  }
  return failed.length;
}

console.log(`▶ 시작 : lazy 클래스 맵이 실제 파일과 일치하는지 검증 (대상: ${TARGET_DIR})`);
global.window = { FO_SITE_NO: process.env.FO_SITE_NO || '01', BO_SITE_NO: process.env.BO_SITE_NO || '01' };
require(path.join(ROOT, 'lib/app/boAppLazyClasses.js'));
require(path.join(ROOT, 'lib/app/foAppLazyClasses.js'));

const boFail = verifyMap('1', 'BO_LAZY_CLASS_FILES', global.window.BO_LAZY_CLASS_FILES, null);
const foFail = verifyMap('2', 'FO_LAZY_CLASS_FILES', global.window.FO_LAZY_CLASS_FILES, global.window.FO_REG_TO_GLOBAL);

const total = boFail + foFail;
console.log(`\n[종합] 총 ${total}개 불일치`);
console.log('◀ 완료');
process.exit(total > 0 ? 1 : 0);
