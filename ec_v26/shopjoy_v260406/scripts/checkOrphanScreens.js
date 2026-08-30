/* checkOrphanScreens.js — lazy-load 등록 상태를 종합 점검하는 진단 스크립트.
 *
 * 4가지 체크를 순서대로 수행한다 (2026-08-30: ②③④ 추가):
 *
 * ① 등록 누락(orphan) — "화면 소스 파일을 만들었는데 어디에도 등록을 안 한" 경우.
 *    pages/bo(+pages/co)/**\/*.js (또는 pages/fo/**\/*.js) 전체 목록을 디스크에서 직접 훑고,
 *    eager <script src="pages/..."> 태그들 + lib/app/{bo,fo}AppLazyClasses.js 맵 값들의
 *    합집합("등록된 파일")과 비교해서, 어디에도 안 걸린 파일을 report 한다.
 *
 * ② eager/lazy 이중등록 — boAppComp.js/foAppComp.js 의 eager app.component() 체인이
 *    참조하는 window.XXX 이름이 동시에 lazy 맵의 키이기도 한 경우를 찾는다.
 *    이 세션에서 여러 번 수작업으로 했던 "체인 크래시 지뢰" 점검(§CLAUDE.md 랜드마인:
 *    lazy 클래스가 eager 체인에 남아있으면 부팅 시 window.XXX 가 아직 undefined 라
 *    app.component()에 undefined 가 들어가고 체인의 다음 호출이 깨진다)을 고정 도구화한 것.
 *
 * ③ 클래스명 중복정의 — 서로 다른 두 파일이 같은 window.ClassName= 을 정의하는 경우.
 *    generateBoLazyClasses.js/generateFoLazyClasses.js 의 map[cls]=f 대입은 나중에 스캔된
 *    파일이 조용히 먼저 것을 덮어써버리므로, 이 상태는 지금 아무 경고 없이 넘어간다.
 *
 * ④ 도달 불가(unreachable) — lazy 맵엔 등록돼 있지만(=로드는 됨) 그 화면으로 이어지는
 *    pageId/메뉴/부모 화면의 <kebab-tag> 참조가 정적으로 하나도 안 잡히는 경우.
 *    (예: ZdSimulPromoMng — 파일은 있고 맵에도 있지만 어느 메뉴에서도 열 수 없던 사례)
 *    ⚠️ 이건 정적 텍스트 스캔 기반 근사치라 100% 정확하지 않다 — "확인 필요" 목록이지
 *    자동으로 지워도 되는 목록이 아니다. 사람이 봐서 (a) 다른 독립 팝업 html 에서
 *    참조되는지 (b) 의도적으로 비활성화된 화면인지 (c) 진짜 죽은 코드인지 판단할 것.
 *
 * 브라우저 런타임(부팅 시 자동 체크)으로는 ①③④를 할 수 없다 — 브라우저 JS 는 디스크에
 * 뭐가 있는지 자체를 모르므로 파일시스템 접근 가능한 Node 스크립트로만 가능하다.
 *
 * 사용법: node scripts/checkOrphanScreens.js   (= npm run check-orphans)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/* walkJsFiles — dir 아래 .js 파일을 재귀적으로 전부 모아 ROOT 기준 상대경로(슬래시 통일)로 반환 */
function walkJsFiles(dir) {
  const out = [];
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return out;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkJsFiles(rel));
    } else if (entry.name.endsWith('.js')) {
      out.push(rel.split(path.sep).join('/'));
    }
  }
  return out;
}

/* extractGlobalNames — generateBoLazyClasses.js/generateFoLazyClasses.js/
   verifyLazyClassIntegrity.js 와 동일한 패턴. window.X= 또는 global.X=(IIFE 파라미터
   별칭) 대입에서 클래스명을 전부 추출한다(한 파일에 여러 개일 수 있음). */
function extractGlobalNames(absFilePath) {
  const src = fs.readFileSync(absFilePath, 'utf8');
  const matches = [...src.matchAll(/^[ \t]*(?:window|global)\.([A-Z][A-Za-z0-9_]*)\s*=/gm)];
  return new Set(matches.map((m) => m[1]));
}

/* kebabToPascal — 'pd-prod-mng' -> 'PdProdMng' (런타임 auto-discovery 와 동일 변환) */
function kebabToPascal(kebab) {
  return kebab.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

/* scanTemplateTags — 파일 텍스트에서 <kebab-tag> 참조를 전부 뽑아 PascalCase Set 으로.
   런타임(boAppBase.js/foAppBase.js)의 /<([a-z][a-z0-9]*(?:-[a-z0-9]+)+)\b/g 와 동일 정규식 —
   단, 런타임은 로드된 컴포넌트의 .template 프로퍼티만 보지만 이 스크립트는 파일 텍스트
   전체를 본다(정적 분석이라 실행 없이 .template 값을 알 수 없음) — 그래서 100% 정확하진
   않지만(문자열 리터럴 오탐 가능) 근사치로는 충분하다. */
function scanTemplateTags(absFilePath) {
  const src = fs.readFileSync(absFilePath, 'utf8');
  const tags = [...new Set([...src.matchAll(/<([a-z][a-z0-9]*(?:-[a-z0-9]+)+)\b/g)].map((m) => m[1]))];
  return tags.map(kebabToPascal);
}

/* loadLazyMapValues — {className: filePath} 형태의 window.XXX_LAZY_CLASS_FILES 값을 Set 으로 */
function loadLazyMapValues(mapFile, globalKey) {
  global.window = global.window || {};
  delete require.cache[path.join(ROOT, mapFile)];
  try {
    require(path.join(ROOT, mapFile));
  } catch (e) {
    console.error(`[checkOrphanScreens] ${mapFile} 로드 실패:`, e.message);
    return new Set();
  }
  return new Set(Object.values(global.window[globalKey] || {}));
}

/* eagerScriptSrcs — htmlFile 안의 <script src="prefix..."> 값들을 배열로 (prefix 로 필터) */
function eagerScriptSrcs(htmlFile, prefix) {
  const html = fs.readFileSync(path.join(ROOT, htmlFile), 'utf8');
  const all = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map((m) => m[1]);
  return prefix ? all.filter((s) => s.startsWith(prefix)) : all;
}

/* ============================================================
 * ① 등록 누락(orphan)
 * ============================================================ */
function checkOrphans(label, { pagesDirs, htmlFile, mapFile, globalKey }) {
  const onDisk = pagesDirs.flatMap((d) => walkJsFiles(d));
  const registered = new Set([
    ...pagesDirs.flatMap((d) => eagerScriptSrcs(htmlFile, d + '/')),
    ...loadLazyMapValues(mapFile, globalKey),
  ]);
  const orphans = onDisk.filter((f) => !registered.has(f));

  console.log(`\n=== ① ${label} — 등록 누락(orphan) ===`);
  console.log(`디스크상 파일: ${onDisk.length}개 | 등록된 파일: ${registered.size}개`);
  if (orphans.length === 0) {
    console.log('✅ 등록 누락 없음');
  } else {
    console.log(`⚠️  등록 안 된(orphan) 파일 ${orphans.length}개:`);
    orphans.forEach((f) => console.log('   -', f));
  }
  return orphans;
}

/* ============================================================
 * ② eager/lazy 이중등록(체인 크래시 지뢰)
 * ============================================================ */
function extractEagerGlobalRefs(compFile) {
  const src = fs.readFileSync(path.join(ROOT, compFile), 'utf8');
  const names = new Set();
  // 표준 패턴: .component('Xxx', window.Yyy ...) — 단, 같은 줄에 if (window...) 가드가
  // 있는 라인(예: `if (window.XsStore) app.component('XsStore', window.XsStore);`,
  // 또는 forEach 콜백 안 `if (window[name]) app.component(name, window[name]);`)은
  // "있으면 등록, 없으면 조용히 스킵" 하는 안전한 패턴이라 제외한다 — 이건 부팅 시점에
  // window.XXX 가 아직 없어도 체인을 깨지 않으므로 이중등록 지뢰가 아니다.
  src.split('\n').forEach((line) => {
    if (/if\s*\(\s*window/.test(line)) return;
    const m = line.match(/\.component\(\s*'[^']*'\s*,\s*window\.([A-Za-z0-9_]+)/);
    if (m) names.add(m[1]);
  });
  return names;
}

function checkEagerLazyOverlap(label, { compFile, lazyMap }) {
  const eagerNames = extractEagerGlobalRefs(compFile);
  const overlap = [...eagerNames].filter((n) => Object.prototype.hasOwnProperty.call(lazyMap, n));

  console.log(`\n=== ② ${label} — eager/lazy 이중등록(체인 크래시 지뢰) ===`);
  console.log(`eager 등록 클래스: ${eagerNames.size}개 | lazy 맵 클래스: ${Object.keys(lazyMap).length}개`);
  if (overlap.length === 0) {
    console.log('✅ 겹치는 클래스 없음');
  } else {
    console.log(`🚨 eager 체인과 lazy 맵에 동시에 있는 클래스 ${overlap.length}개 — 부팅 시점에 아직`);
    console.log('   로드 안 된 window.XXX 가 undefined 로 .component() 에 들어가 체인 전체가');
    console.log('   깨질 수 있다. lazy 맵에서 빼거나 eager 체인에서 빼서 한쪽만 남길 것:');
    overlap.forEach((n) => console.log(`   - ${n} (${lazyMap[n]})`));
  }
  return overlap;
}

/* ============================================================
 * ③ 클래스명 중복정의
 * ============================================================ */
function checkDuplicateClassNames(label, pagesDirs) {
  const files = pagesDirs.flatMap((d) => walkJsFiles(d));
  const owner = {}; // className -> [file, ...]
  files.forEach((relPath) => {
    const names = extractGlobalNames(path.join(ROOT, relPath));
    names.forEach((n) => {
      if (!owner[n]) owner[n] = [];
      owner[n].push(relPath);
    });
  });
  const dups = Object.entries(owner).filter(([, arr]) => arr.length > 1);

  console.log(`\n=== ③ ${label} — 클래스명 중복정의 ===`);
  console.log(`검사한 클래스명: ${Object.keys(owner).length}개 (파일 ${files.length}개)`);
  if (dups.length === 0) {
    console.log('✅ 중복 없음');
  } else {
    console.log(`🚨 같은 이름을 여러 파일이 정의 ${dups.length}건 — 맵 생성 시 나중에 스캔된`);
    console.log('   파일이 조용히 앞의 걸 덮어써 한쪽이 유령 파일이 된다:');
    dups.forEach(([n, arr]) => console.log(`   - ${n}: ${arr.join(' , ')}`));
  }
  return dups;
}

/* ============================================================
 * ④ 도달 불가(unreachable) — 정적 근사치
 * ============================================================ */
function checkReachability(label, { pagesDirs, htmlFile, lazyMap, rootClasses }) {
  const visited = new Set(rootClasses);
  const queue = [...rootClasses];

  // 모든 eager <script> 파일도 한 번씩 스캔해서 "eager 가 lazy 를 태그로 품는" 경로를 잡는다.
  const eagerFiles = eagerScriptSrcs(htmlFile, null)
    .filter((s) => !/^https?:\/\//.test(s))
    .map((s) => s.split('/').join(path.sep));
  eagerFiles.forEach((relPath) => {
    const abs = path.join(ROOT, relPath);
    if (!fs.existsSync(abs)) return;
    scanTemplateTags(abs).forEach((cls) => {
      if (Object.prototype.hasOwnProperty.call(lazyMap, cls) && !visited.has(cls)) {
        visited.add(cls);
        queue.push(cls);
      }
    });
  });

  while (queue.length) {
    const cls = queue.pop();
    const relPath = lazyMap[cls];
    if (!relPath) continue;
    const abs = path.join(ROOT, relPath);
    if (!fs.existsSync(abs)) continue;
    scanTemplateTags(abs).forEach((cls2) => {
      if (Object.prototype.hasOwnProperty.call(lazyMap, cls2) && !visited.has(cls2)) {
        visited.add(cls2);
        queue.push(cls2);
      }
    });
  }

  const unreachable = Object.keys(lazyMap).filter((c) => !visited.has(c));

  console.log(`\n=== ④ ${label} — 도달 불가(unreachable, 정적 근사치) ===`);
  console.log(`lazy 맵 클래스: ${Object.keys(lazyMap).length}개 | 도달 확인됨: ${visited.size - (visited.size - (Object.keys(lazyMap).length - unreachable.length))}개`);
  if (unreachable.length === 0) {
    console.log('✅ 전부 어딘가에서 참조됨(정적 스캔 기준)');
  } else {
    console.log(`⚠️  어느 pageId/메뉴/화면에서도 정적으로 참조를 못 찾은 클래스 ${unreachable.length}개`);
    console.log('   (독립 팝업 html 에서만 열리거나, 비활성 사이트 변형이거나, 진짜 죽은 코드일 수 있음 —');
    console.log('   사람이 확인 필요, 자동 삭제 금지):');
    unreachable.forEach((c) => console.log(`   - ${c} (${lazyMap[c]})`));
  }
  return unreachable;
}

/* ============================================================
 * 실행
 * ============================================================ */
global.window = { FO_SITE_NO: process.env.FO_SITE_NO || '01', BO_SITE_NO: process.env.BO_SITE_NO || '01' };

const boOrphans = checkOrphans('BO (pages/bo + pages/co)', {
  pagesDirs: ['pages/bo', 'pages/co'],
  htmlFile: 'bo.html',
  mapFile: 'lib/app/boAppLazyClasses.js',
  globalKey: 'BO_LAZY_CLASS_FILES',
});
const foOrphans = checkOrphans('FO (pages/fo)', {
  pagesDirs: ['pages/fo'],
  htmlFile: 'index.html',
  mapFile: 'lib/app/foAppLazyClasses.js',
  globalKey: 'FO_LAZY_CLASS_FILES',
});

// ②③④ 는 이미 메모리에 로드된 맵을 재사용
require(path.join(ROOT, 'lib/app/boAppLazyClasses.js'));
require(path.join(ROOT, 'lib/app/foAppLazyClasses.js'));
const BO_LAZY_CLASS_FILES = global.window.BO_LAZY_CLASS_FILES || {};
const FO_LAZY_CLASS_FILES = global.window.FO_LAZY_CLASS_FILES || {};
const BO_APP_COMP_PAGE = global.window.BO_APP_COMP_PAGE || {};
const FO_PAGE_TO_CLASS = global.window.FO_PAGE_TO_CLASS || {};

const boOverlap = checkEagerLazyOverlap('BO', { compFile: 'lib/app/boAppComp.js', lazyMap: BO_LAZY_CLASS_FILES });
const foOverlap = checkEagerLazyOverlap('FO', { compFile: 'lib/app/foAppComp.js', lazyMap: FO_LAZY_CLASS_FILES });

const boDups = checkDuplicateClassNames('BO (pages/bo + pages/co)', ['pages/bo', 'pages/co']);
const foDups = checkDuplicateClassNames('FO (pages/fo)', ['pages/fo']);

const boRoots = Object.values(BO_APP_COMP_PAGE).map(kebabToPascal);
const boUnreachable = checkReachability('BO', {
  pagesDirs: ['pages/bo', 'pages/co'], htmlFile: 'bo.html', lazyMap: BO_LAZY_CLASS_FILES, rootClasses: boRoots,
});
const foRoots = Object.values(FO_PAGE_TO_CLASS);
const foUnreachable = checkReachability('FO', {
  pagesDirs: ['pages/fo'], htmlFile: 'index.html', lazyMap: FO_LAZY_CLASS_FILES, rootClasses: foRoots,
});

const total = boOrphans.length + foOrphans.length + boOverlap.length + foOverlap.length + boDups.length + foDups.length;
console.log(`\n=== 종합: 치명적 문제(①②③) ${total}개 / 확인 필요(④) ${boUnreachable.length + foUnreachable.length}개 ===`);
// ④(도달 불가)는 오탐 가능성이 있는 "확인 필요" 목록이라 exit code 실패 판정에는 포함하지 않는다.
process.exit(total > 0 ? 1 : 0);
