/* generate-fo-lazy-classes.js — FO 화면 추가 시 사람이 손대는 파일을 이 파일 하나로 통일한다.
 *
 * 새 FO "최상위 페이지"를 추가하면:
 *   1) 화면 소스 파일 작성 (pages/fo/...)
 *   2) 이 파일 상단 FO_PAGE_TO_CLASS_STATIC 에 pageId: 'ClassName' 한 줄 추가
 *      (파일 내부 window 전역명이 등록 태그명과 다르면 FO_REG_TO_GLOBAL 에도 한 줄 추가 —
 *      아주 드문 케이스: 예) <blog-page> 태그인데 파일은 window.Blog)
 *   3) `npm run gen-fo-lazy` 실행 (또는 VS Code Task)
 * 다른 화면 안에 <kebab-tag> 로 인라인 임베드만 되는 하위 컴포넌트는 2)가 필요 없다 —
 * boAppBase.js/foAppBase.js 의 자동탐지가 알아서 찾는다.
 * lib/app/foAppLazyClasses.js 는 이 스크립트의 산출물이라 절대 손으로 고치지 않는다.
 *
 * 사용법: node scripts/generate-fo-lazy-classes.js   (= npm run gen-fo-lazy)
 *
 * 실행하면 콘솔에 [1]~[3] 단계 + [완료] 요약이 순서대로 찍힌다:
 *   [1] 대상 파일 수집 (pages/fo 스캔 → eager/제외목록/사이트별동적파일 제외 → lazy 대상 확정)
 *   [2] 각 파일에서 window.ClassName= 등록명 추출 (+ FO_REG_TO_GLOBAL 역매핑 적용)
 *   [3] foAppLazyClasses.js 파일 생성 (+ FO_SITE_NO 별 Home/Prod 동적 항목 주입)
 *   [완료] lazy 클래스 M개
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// 2026-09-05: 이 스크립트가 찍는 모든 로그 앞에 파일명 태그를 자동으로 붙인다(console.log/warn/error
// 를 한 번만 감싸서, 개별 호출부를 전부 고칠 필요 없이 항상 적용되게 함). 맨 앞 개행(\n)은
// 그대로 유지해서 기존 줄바꿈 스타일(단계 사이 빈 줄)이 안 깨지게 한다.
const TAG = '[generate-fo-lazy-classes.js]';
['log', 'warn', 'error'].forEach((level) => {
  const orig = console[level].bind(console);
  console[level] = (first, ...rest) => {
    if (typeof first === 'string') {
      const m = first.match(/^\n+/);
      orig(m ? m[0] + TAG + ' ' + first.slice(m[0].length) : TAG + ' ' + first, ...rest);
    } else {
      orig(TAG, first, ...rest);
    }
  };
});

/* ── 사람이 결정해야 하는 부분(파일명만 보고는 못 정하는 것들) ── */

// 태그 등록명이 파일 내부 window 전역명과 다른 극소수 예외(이 화면들은 파일 리팩터링
// 전까지는 안 늘어남 — 새로 추가하는 화면은 보통 파일 내부 이름 == 등록명 컨벤션을 따르므로
// 여기 추가할 일은 거의 없다).
const FO_REG_TO_GLOBAL = {
  BlogPage: 'Blog',
  LikePage: 'Like',
  LocationPage: 'Location',
  AboutPage: 'About',
  XdDispUi01: 'DispUi01',
  XdDispUi02: 'DispUi02',
  XdDispUi03: 'DispUi03',
  XdDispUi04: 'DispUi04',
  XdDispUi05: 'DispUi05',
  XdDispUi06: 'DispUi06',
};

// page(id) -> 진입 클래스. "이 화면을 URL/메뉴에서 어떤 pageId 로 부를지"는 사람이 짓는
// 이름이라 파일명에서 기계적으로 못 뽑는다. 새 "최상위 페이지"를 추가할 때만 여기 한 줄
// 추가하면 된다(기존 화면 안에 인라인 임베드되는 하위 컴포넌트는 여기 안 넣어도 됨).
const FO_PAGE_TO_CLASS_STATIC = {
  cart: 'Cart', order: 'Order', contact: 'Contact', faq: 'Faq',
  event: 'EventPage', eventView: 'EventView',
  blog: 'BlogPage', blogView: 'BlogView', blogEdit: 'BlogEdit',
  like: 'LikePage', location: 'LocationPage', about: 'AboutPage',
  myOrder: 'MyOrder', myClaim: 'MyClaim', myCoupon: 'MyCoupon',
  myCache: 'MyCache', myContact: 'MyContact', myChatt: 'MyChatt',
  dispUi01: 'XdDispUi01', dispUi02: 'XdDispUi02', dispUi03: 'XdDispUi03',
  dispUi04: 'XdDispUi04', dispUi05: 'XdDispUi05', dispUi06: 'XdDispUi06',
  sample01: 'XsSample01', sample02: 'XsSample02', sample03: 'XsSample03',
  sample04: 'XsSample04', sample05: 'XsSample05', sample06: 'XsSample06',
  sample07: 'XsSample07', sample11: 'XsSample11', sample12: 'XsSample12',
  sample13: 'XsSample13', sample14: 'XsSample14', sample21: 'XsSample21',
  sample22: 'XsSample22', sample23: 'XsSample23',
  xsStore: 'XsStore', xsLocalStorage: 'XsLocalStorage',
};

// Sample08~10 은 index.html 에서 <script> 자체가 주석 처리되어 죽어있는 기존 운영 상태 —
// 자동 스캔이 "eager 로 안 걸려있으니 lazy 대상"으로 착각하지 않도록 명시적으로 제외한다.
const FO_EXCLUDE_FROM_LAZY = new Set(['pages/fo/xs/Sample08.js', 'pages/fo/xs/Sample09.js', 'pages/fo/xs/Sample10.js']);

// Home01/Home02/.../Prod01List/Prod02View 등 FO_SITE_NO 별 동적 이름 파일 — 자동 스캔 대상에서
// 빼고, 파일 하단 IIFE 가 "현재 세션의 FO_SITE_NO 것 하나만" 런타임에 추가하게 한다.
const FO_DYNAMIC_SITE_FILE = /^pages\/fo\/(Home\d+|Prod\d+(List|View))\.js$/;

/* ── 여기부터는 전부 자동 ── */

function walkJsFiles(dir) {
  const out = [];
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return out;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkJsFiles(rel));
    else if (entry.name.endsWith('.js')) out.push(rel.split(path.sep).join('/'));
  }
  return out;
}

function eagerScriptSrcs(htmlFile, prefix) {
  const html = fs.readFileSync(path.join(ROOT, htmlFile), 'utf8');
  const all = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map((m) => m[1]);
  return new Set(all.filter((s) => s.startsWith(prefix)));
}

/* extractGlobalNames — window.X= 또는 global.X=(IIFE 파라미터 별칭) 대입에서 클래스명 전부 추출.
   들여쓰기된 대입(IIFE 안)도 잡고, 한 파일이 여러 클래스를 등록하는 경우도 전부 잡는다.
   언더스코어 접두어 내부 상태 변수는 클래스가 아니므로 제외(PascalCase, 대문자 시작만 인정). */
function extractGlobalNames(filePath) {
  const src = fs.readFileSync(path.join(ROOT, filePath), 'utf8');
  // 2026-08-30 수정: ^[ \t]*(줄 시작) 앵커는 minify 된 코드(여러 문장이 한 줄에 붙음)에서
  // 깨진다 — verify-lazy-class-integrity.js 와 동일 수정. (generateFoLazyClasses 는 항상 원본
  // 소스만 스캔하므로 영향은 없지만, 세 스크립트가 같은 정규식을 공유하도록 통일해둔다.)
  const matches = [...src.matchAll(/(?<![\w.$])(?:window|global)\.([A-Z][A-Za-z0-9_]*)\s*=(?!=)/g)];
  return [...new Set(matches.map((m) => m[1]))];
}

function stringifyMap(obj, indent = '  ') {
  return Object.keys(obj).sort().map((k) => `${indent}${k}: ${JSON.stringify(obj[k])},`).join('\n');
}

function generate() {
  console.log('▶ 시작 : FO lazy 클래스 맵(lib/app/foAppLazyClasses.js) 자동 생성');

  console.log('\n[1] 대상 파일 수집');
  const onDisk = walkJsFiles('pages/fo');
  console.log(`  ㄴ pages/fo 재귀 스캔: ${onDisk.length}개 .js 파일`);
  const eager = eagerScriptSrcs('index.html', 'pages/fo/');
  console.log(`  ㄴ index.html 에 이미 eager <script> 로 걸린 파일 제외: ${eager.size}개`);
  console.log(`  ㄴ 죽어있는 화면(FO_EXCLUDE_FROM_LAZY) 제외: ${FO_EXCLUDE_FROM_LAZY.size}개`);
  const lazyFiles = onDisk.filter((f) => !eager.has(f) && !FO_EXCLUDE_FROM_LAZY.has(f) && !FO_DYNAMIC_SITE_FILE.test(f));
  console.log(`  ㄴ 사이트별 동적 파일(Home0N/Prod0NList/View, 아래 [3]에서 별도 주입) 제외`);
  console.log(`  ㄴ 남은 lazy 대상 파일: ${lazyFiles.length}개`);

  console.log('\n[2] 각 파일에서 window.ClassName= 등록명 추출');
  // REG_TO_GLOBAL 의 값(window 전역명) 기준으로 "이미 다른 이름으로 등록될 파일"을 역매핑
  const globalToReg = {};
  Object.entries(FO_REG_TO_GLOBAL).forEach(([reg, glob]) => { globalToReg[glob] = reg; });

  const map = {};
  const skipped = [];
  lazyFiles.forEach((f) => {
    const names = extractGlobalNames(f);
    if (!names.length) { skipped.push(f); return; }
    names.forEach((globalName) => {
      const regName = globalToReg[globalName] || globalName;
      map[regName] = f;
    });
  });
  console.log(`  ㄴ 등록명 ${Object.keys(map).length}개 추출 완료(FO_REG_TO_GLOBAL 역매핑 ${Object.keys(globalToReg).length}건 적용)`);
  if (skipped.length) {
    console.warn(`  ㄴ ⚠️  window.ClassName= 패턴을 못 찾아 건너뜀(수동 확인 필요) ${skipped.length}개:`, skipped);
  }

  console.log('\n[3] foAppLazyClasses.js 파일 생성 (+ FO_SITE_NO 별 Home/Prod 동적 항목 주입)');
  const out = `/* ShopJoy FO - lazy-load 대상 클래스 맵 (scripts/generate-fo-lazy-classes.js 로 자동 생성 — 손으로 고치지 말 것!)
   FO 화면을 추가할 때 사람이 손대는 파일은 scripts/generate-fo-lazy-classes.js 하나뿐이다:
     1) 화면 소스 작성 (pages/fo/...)
     2) generate-fo-lazy-classes.js 상단 FO_PAGE_TO_CLASS_STATIC 에 pageId: 'ClassName' 한 줄 추가
        (등록 태그명이 파일 내부 window 전역명과 다르면 FO_REG_TO_GLOBAL 에도 추가)
     3) node scripts/generate-fo-lazy-classes.js (또는 npm run gen-fo-lazy) 실행
   이 파일(foAppLazyClasses.js) 은 그 결과물이라 재생성될 때마다 전체가 덮어써진다.
   아래 각 블록 위 주석에 무슨 용도인지 설명해뒀다. */

/* FO_LAZY_CLASS_FILES — "등록명(태그 PascalCase 기준) → 스크립트 파일 경로" 매핑.
   foAppBase.js 의 lazy 로더(fnEnsurePageLoaded/fnCollectClasses)가 화면을 처음 열 때
   이 맵을 보고 어떤 파일을 loadModule()(동적 import())로 불러올지 찾는다.
   pages/fo 전체를 스캔해서 100% 자동 생성 — 사람이 직접 추가할 항목 없음. */
window.FO_LAZY_CLASS_FILES = {
${stringifyMap(map)}
};

/* FO_REG_TO_GLOBAL — "등록명(태그 기준) → 실제 window 전역 변수명" 매핑.
   대부분은 등록명과 파일 내부 window 전역명이 같아서(예: Cart → window.Cart) 필요 없지만,
   극소수(예: <blog-page> 태그인데 파일은 window.Blog) 는 다를 수 있어 여기서 보정한다.
   자동 계산 불가 — 새로 이런 케이스가 생기면 generate-fo-lazy-classes.js 상단에 직접 추가. */
window.FO_REG_TO_GLOBAL = {
${stringifyMap(FO_REG_TO_GLOBAL)}
};

/* FO_PAGE_TO_CLASS — "pageId(화면 식별자) → 진입 등록명" 매핑.
   foAppBase.js 가 navigate()/URL 복원 시 이 값으로 어떤 클래스를 로드해야 할지 찾는다.
   BO 의 BO_APP_COMP_PAGE 와 같은 역할이지만, FO 는 kebab 태그 매핑 테이블이 따로 없어서
   pageId 가 바로 등록명으로 연결된다. 새 "최상위 페이지" 추가 시 사람이 결정해서 넣는
   유일한 정보 — 이 파일 말고 scripts/generate-fo-lazy-classes.js 상단의
   FO_PAGE_TO_CLASS_STATIC 에 추가할 것(하위 임베드 컴포넌트는 여기 안 넣어도 자동탐지됨). */
window.FO_PAGE_TO_CLASS = {
${stringifyMap(FO_PAGE_TO_CLASS_STATIC)}
};

/* home/prodList/prodView — FO_SITE_NO 별 동적 이름(Home01/Prod01List/Prod01View 등)이라
   위 정적 객체엔 못 적어서 부팅 시점의 window.FO_SITE_NO 를 읽어 여기서 직접 추가한다. */
(function () {
  var N = window.FO_SITE_NO || '01';
  window.FO_LAZY_CLASS_FILES['Home' + N]          = 'pages/fo/Home' + N + '.js';
  window.FO_LAZY_CLASS_FILES['Prod' + N + 'List'] = 'pages/fo/Prod' + N + 'List.js';
  window.FO_LAZY_CLASS_FILES['Prod' + N + 'View'] = 'pages/fo/Prod' + N + 'View.js';
  window.FO_PAGE_TO_CLASS.home     = 'Home' + N;
  window.FO_PAGE_TO_CLASS.prodList = 'Prod' + N + 'List';
  window.FO_PAGE_TO_CLASS.prodView = 'Prod' + N + 'View';
})();
`;
  fs.writeFileSync(path.join(ROOT, 'lib/app/foAppLazyClasses.js'), out);
  console.log(`  ㄴ 파일 기록 완료: lib/app/foAppLazyClasses.js`);
  console.log(`\n[완료] lazy 클래스 ${Object.keys(map).length}개(사이트별 동적 3개는 부팅 시점에 추가로 붙음)`);
  console.log('◀ 완료');
}

generate();
