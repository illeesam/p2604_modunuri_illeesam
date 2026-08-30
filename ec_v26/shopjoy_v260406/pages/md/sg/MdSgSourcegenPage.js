/* ShopJoy FO 모듈 - 소스젠 상세/편집 (DDL 탭 편집 + 소스 생성 + 결과 ZIP 을 DB 첨부로 보관)
   목록 화면(MdSgProjectListPage)에서 "?view=editor&projectId=xxx" 로 진입 — projectId 없으면 신규 작성.

   생성 엔진은 p2605_sourcegen 프로젝트의 순수 클라이언트 JS 를 그대로 가져다 쓴다
   (assets/md/sg/sourcegen/*.js — gnParseDdl / gnGenerate 가 전역으로 노출됨). */

/* SG_FILE_GROUPS — 생성 결과 파일을 좌측 트리에서 묶는 기준(원본 sourcegen_postgresql.html 의 groupedFiles 이식).
   `short` — [소스 생성] 팝오버 체크리스트 전용 축약 라벨(2026-08-26). 팝오버는 이미 "BACKEND" 구획
   헤더 아래 나열되므로 항목마다 "Backend (...)" 를 반복할 필요가 없다. `title` 은 결과 뷰어(파일트리
   구분자, 구획 헤더 없이 단독 노출)용으로 그대로 유지 — 두 화면의 맥락이 달라 라벨을 분리했다. */
const SG_FILE_GROUPS = [
  { title: 'Backend (JPA)',            short: 'JPA',        prefix: 'backend_jpa/' },
  { title: 'Backend (MyBatis)',        short: 'MyBatis',     prefix: 'backend_mybatis/' },
  { title: 'Backend (Python)',         short: 'Python',      prefix: 'backend_python/' },
  { title: 'Backend (C# EF Core)',     short: 'C# EF Core',  prefix: 'backend_csharp_efcore/' },
  { title: 'Backend (C# Dapper)',      short: 'C# Dapper',   prefix: 'backend_csharp_dapper/' },
  { title: 'Backend (NestJS 10)',      short: 'NestJS 10',   prefix: 'backend_nestjs/' },
  { title: 'Backend (Express 4)',      short: 'Express 4',   prefix: 'backend_expressjs/' },
  { title: 'Vue3 CDN (with common)',   prefix: 'frontend_vue3cdn_with_common/' },
  { title: 'Vue3 CDN (standalone)',    prefix: 'frontend_vue3cdn_standalone/' },
  { title: 'Vue3 SFC',                 prefix: 'frontend_vue3/' },
  { title: 'React',                    prefix: 'frontend_react/' },
  { title: 'React CDN (standalone)',   prefix: 'frontend_react_cdn_standalone/' },
  { title: 'Svelte',                   prefix: 'frontend_svelte/' },
  { title: 'Svelte CDN (standalone)',  prefix: 'frontend_svelte_cdn_standalone/' },
  { title: 'PyScript CDN (standalone)',prefix: 'frontend_pyscript_cdn_standalone/' },
  { title: 'Flutter (Mobile)',         prefix: 'frontend_flutter/' },
  { title: 'React Native (Mobile)',    prefix: 'frontend_react_native/' },
  { title: 'Android (Compose)',        prefix: 'frontend_android/' },
  { title: 'iOS (SwiftUI)',            prefix: 'frontend_ios/' },
  { title: 'Nuxt 4 + Prisma',          prefix: 'fullstack_nuxt/' },
  { title: 'Next.js 15 + Prisma',      prefix: 'fullstack_nextjs/' },
  { title: 'DDL',                      prefix: 'ddl/' },
];

/* SG_STACK_SECTIONS — [소스 생성] 팝오버 체크리스트를 5개 구획(Backend/Frontend/Fullstack/모바일 앱/기타)
   으로 묶어 보여준다(2026-08-26). SG_FILE_GROUPS 를 유일한 기준으로 삼아 prefix 로만 재분류 — 목록
   자체(제목/개수)가 바뀌어도 이 매핑만 따라가면 된다. */
const SG_MOBILE_PREFIXES = ['frontend_flutter/', 'frontend_react_native/', 'frontend_android/', 'frontend_ios/'];
const SG_STACK_SECTIONS = [
  { label: 'Backend',  items: SG_FILE_GROUPS.filter(g => g.prefix.startsWith('backend_')) },
  { label: 'Frontend', items: SG_FILE_GROUPS.filter(g => g.prefix.startsWith('frontend_') && !SG_MOBILE_PREFIXES.includes(g.prefix)) },
  { label: 'Fullstack', items: SG_FILE_GROUPS.filter(g => g.prefix.startsWith('fullstack_')) },
  { label: '모바일 앱', items: SG_FILE_GROUPS.filter(g => SG_MOBILE_PREFIXES.includes(g.prefix)) },
  { label: '기타',      items: SG_FILE_GROUPS.filter(g => g.prefix === 'ddl/') },
];

/* fnCategoryLabel(결과 뷰어 파일트리 구분자용 영문 구획 라벨)은 2026-08-30 "생성된 소스목록"이
   스택 구분 헤더 없는 실제 경로 트리(cfGenFileTree)로 바뀌면서 유일한 호출부(cfGroupedFiles)가
   삭제되어 함께 제거. */

/* fnBuildTree / fnFlattenTree — subPackage(점(.)으로 구분한 경로) 기준 트리 빌더 + 평탄화(2026-08-26).
   DDL 입력 좌측 트리(전체 탭 대상)와 생성 결과 좌측 트리(생성 결과 있는 탭만 대상) 양쪽에서 공용으로
   쓴다 — 대상 탭 목록만 다르고 트리 구성 로직은 동일해서 중복 없이 함수로 뺐다. */
function fnBuildTree(tabList) {
  const root = { path: '', name: '', children: [], tabs: [] };
  const nodeMap = { '': root };
  const ensureNode = (path) => {
    if (nodeMap[path]) return nodeMap[path];
    const segs = path.split('.');
    const name = segs[segs.length - 1];
    const parent = ensureNode(segs.slice(0, -1).join('.'));
    const node = { path, name, children: [], tabs: [] };
    parent.children.push(node);
    nodeMap[path] = node;
    return node;
  };
  tabList.forEach(t => {
    const path = (t.subPackage || '').trim();
    (path ? ensureNode(path) : root).tabs.push(t);
  });
  return root;
}
/* fnCountTabs — 폴더 노드 하나 밑에(하위 폴더까지 재귀 포함) 딸린 테이블(탭) 총수(2026-08-30,
   좌측 트리 폴더명 옆 "항목 개수" 표시용). */
function fnCountTabs(node) {
  return node.tabs.length + node.children.reduce((s, c) => s + fnCountTabs(c), 0);
}
function fnFlattenTree(root, collapsedMap) {
  const out = [];
  const walk = (node, depth) => {
    node.children.forEach(child => {
      out.push({ kind: 'folder', depth, path: child.path, name: child.name, count: fnCountTabs(child) });
      if (!collapsedMap[child.path]) walk(child, depth + 1);
    });
    node.tabs.forEach(t => out.push({ kind: 'tab', depth, tab: t }));
  };
  walk(root, 0);
  return out;
}

/* fnBuildFileTree / fnFlattenFileTree — "생성된 소스목록"을 언어/스택 그룹 헤더("Backend - JPA" 등)
   구분 없이, 실제 생성 경로(entry.realPath — fnZipPath 로 계산한 진짜 ZIP 내부 경로) 그대로 폴더
   트리로 보여주기 위한 빌더(2026-08-30). fnBuildTree/fnFlattenTree 와 구조는 같되 경로 구분자가
   점(.)이 아닌 슬래시(/)이고, 리프가 탭이 아니라 파일 엔트리라는 점만 다르다.
   여러 테이블이 만든 파일의 실제 경로가 우연히 같으면(예: 테이블마다 동일한 backend_jpa/util/
   VoUtil.java → 같은 실제 경로) 같은 트리 리프 하나로 자연히 합쳐진다(실제 ZIP 도 마찬가지로
   나중 것이 앞의 것을 덮어쓸 뿐 파일 1개만 남으므로 "실제 생성된 파일정보"와 일치). */
function fnBuildFileTree(entries) {
  const root = { path: '', name: '', children: [], files: [] };
  const nodeMap = { '': root };
  const ensureNode = (path) => {
    if (nodeMap[path]) return nodeMap[path];
    const segs = path.split('/');
    const name = segs[segs.length - 1];
    const parent = ensureNode(segs.slice(0, -1).join('/'));
    const node = { path, name, children: [], files: [] };
    parent.children.push(node);
    nodeMap[path] = node;
    return node;
  };
  const seen = new Set();
  entries.forEach(e => {
    if (seen.has(e.realPath)) return;
    seen.add(e.realPath);
    const segs = e.realPath.split('/');
    const dir = segs.slice(0, -1).join('/');
    (dir ? ensureNode(dir) : root).files.push(e);
  });
  return root;
}
function fnFlattenFileTree(root, collapsedMap) {
  const out = [];
  const walk = (node, depth) => {
    node.children.forEach(child => {
      out.push({ kind: 'folder', depth, path: child.path, name: child.name });
      if (!collapsedMap[child.path]) walk(child, depth + 1);
    });
    node.files.forEach(entry => out.push({ kind: 'file', depth, entry }));
  };
  walk(root, 0);
  return out;
}

/* SG_STACK_STORAGE_KEY / fnLoadSelectedStacks — [소스 생성] 팝오버의 언어/스택 체크 상태를
   브라우저에 기억한다(2026-08-26). 기본값은 Backend(JPA) + React 만 체크 — 전체 스택을 다 켜두면
   테이블 1개에도 130개 넘는 파일이 쏟아져 실제 안 쓰는 스택까지 매번 뒤져야 하는 부담이 커진다. */
const SG_STACK_STORAGE_KEY = 'modu-md-sg-selected-stacks';
const SG_DEFAULT_STACKS = ['backend_jpa/', 'frontend_react/'];
function fnLoadSelectedStacks() {
  try {
    const raw = localStorage.getItem(SG_STACK_STORAGE_KEY);
    if (!raw) return [...SG_DEFAULT_STACKS];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || !arr.length) return [...SG_DEFAULT_STACKS];
    const valid = arr.filter(p => SG_FILE_GROUPS.some(g => g.prefix === p));
    return valid.length ? valid : [...SG_DEFAULT_STACKS];
  } catch (e) { return [...SG_DEFAULT_STACKS]; }
}

/* SG_STACK_VERSION_STORAGE_KEY / SG_STACK_VERSION_OPTIONS / fnLoadStackVersions — 스택별 버전 선택도
   체크 상태와 별개로 브라우저에 기억한다(2026-08-26). 기본값은 전부 'v1'. */
const SG_STACK_VERSION_STORAGE_KEY = 'modu-md-sg-stack-versions';
const SG_STACK_VERSION_OPTIONS = ['v1', 'v2', 'v3'];
function fnLoadStackVersions() {
  try {
    const raw = localStorage.getItem(SG_STACK_VERSION_STORAGE_KEY);
    const obj = raw ? JSON.parse(raw) : null;
    return (obj && typeof obj === 'object' && !Array.isArray(obj)) ? obj : {};
  } catch (e) { return {}; }
}

/* SG_ZIP_PATHS — 파일맵 키 → ZIP 안의 실제 경로 (원본 bdZipPath 이식).
   각 스택을 모듈 폴더로 한 단계 더 감싸 JPA/MyBatis 등이 서로 덮어쓰지 않게 한다.
   순서가 중요: 더 긴 prefix 를 먼저 둬야 한다(frontend_react_cdn_standalone/ 이 frontend_react/ 보다 먼저).
   2026-08-30: "src" 로 통일 시도(1차) 후 `sourcegen_fe_svelte/src/src/App.svelte` 처럼 경로가
   중복되는 버그 발견 → 원인 파악 후 대상 축소(2차). nestjs/expressjs/svelte/react_native 는
   생성기 자체가 이미 파일 절반을 자기 "src/" 폴더 밑에 만들고(main.ts, App.svelte 등) 나머지
   절반(package.json 등)은 프로젝트 루트에 두는데, 여기서 또 "src/" 로 감싸면 이미 src/ 가 붙은
   파일은 "src/src/..." 로 겹치고 루트여야 할 설정파일까지 src/ 안으로 잘못 들어간다.
   flutter(lib/)·android(app/src/...)·ios(Sources/)·csharp·python·nuxt/nextjs(app/·server/·lib/)도
   전부 자기 스택 고유의 올바른 폴더 구조 + 루트 설정파일을 이미 갖고 있어 똑같은 문제 — 이 12개는
   "src" 통일 대상에서 제외하고 모듈 폴더만 감싼 원래 형태로 되돌렸다.
   "src" 통일은 내부에 자체 서브폴더 구조/루트파일이 없는 것만 안전하다: 단일 파일만 나오는 CDN
   계열(vue3cdn with-common/standalone, react/svelte/pyscript cdn standalone)과, 애초에 flat 하게
   파일 몇 개만 나오는 vue3/react. Vue3 CDN 은 같은 모듈 안에 with-common/standalone 두 변형이
   공존해 "src" 하나로 합칠 수 없으므로 src/ 밑에 한 단계 더(with-common, standalone)로 유지.
   2026-08-30: 모듈 폴더명 앞의 "sourcegen_" 접두어도 제거(예: sourcegen_be_jpa → be_jpa) —
   ZIP 자체가 이미 소스젠 산출물이라는 게 자명해서 폴더마다 반복할 필요가 없었다. */
const SG_ZIP_PATHS = [
  { p: 'backend_python/',                  to: 'be_python/' },
  { p: 'backend_csharp_efcore/',           to: 'be_csharp_efcore/' },
  { p: 'backend_csharp_dapper/',           to: 'be_csharp_dapper/' },
  { p: 'backend_nestjs/',                  to: 'be_nestjs10/' },
  { p: 'backend_expressjs/',               to: 'be_expressjs4/' },
  { p: 'frontend_vue3cdn_with_common/',    to: 'fe_vue3_cdn/src/with-common/' },
  { p: 'frontend_vue3cdn_standalone/',     to: 'fe_vue3_cdn/src/standalone/' },
  { p: 'frontend_vue3/',                   to: 'fe_vue3/src/views/' },
  { p: 'frontend_react_cdn_standalone/',   to: 'fe_react_cdn/src/' },
  { p: 'frontend_react_native/',           to: 'fe_react_native/' },
  { p: 'frontend_react/',                  to: 'fe_react/src/pages/' },
  { p: 'frontend_svelte_cdn_standalone/',  to: 'fe_svelte_cdn/src/' },
  { p: 'frontend_svelte/',                 to: 'fe_svelte/' },
  { p: 'frontend_pyscript_cdn_standalone/',to: 'fe_pyscript_cdn/src/' },
  { p: 'frontend_flutter/',                to: 'fe_flutter/' },
  { p: 'frontend_android/',                to: 'fe_android_compose/' },
  { p: 'frontend_ios/',                    to: 'fe_ios_swiftui/' },
  { p: 'fullstack_nuxt/',                  to: 'full_nuxt4/' },
  { p: 'fullstack_nextjs/',                to: 'full_nextjs15/' },
];

/* fnZipPath — 파일맵 키를 ZIP 내부 경로로 변환. JPA/MyBatis 는 패키지 경로가 끼어들어 별도 처리. */
function fnZipPath(fn, pkgPath) {
  if (fn.startsWith('ddl/')) return fn;                       // DDL 은 ZIP 루트 (모든 스택 공용 메타)
  if (fn.startsWith('backend_jpa/')) {
    return `be_jpa/src/main/java/${pkgPath}/` + fn.substring('backend_jpa/'.length);
  }
  if (fn.startsWith('backend_mybatis/mapper/') && fn.endsWith('.xml')) {
    return 'be_mybatis/src/main/resources/mapper/' + fn.substring('backend_mybatis/mapper/'.length);
  }
  if (fn.startsWith('backend_mybatis/')) {
    return `be_mybatis/src/main/java/${pkgPath}/` + fn.substring('backend_mybatis/'.length);
  }
  const hit = SG_ZIP_PATHS.find(m => fn.startsWith(m.p));
  if (hit) return hit.to + fn.substring(hit.p.length);
  return `_misc/${fn}`;                                       // 분류 안 된 파일 (fallback)
}

/* fnEffectivePkg — Base Package + 탭별 Sub Package 를 합친 실제 생성 패키지.
   com.exam.app + zz -> com.exam.app.zz (Sub Package 비우면 Base Package 그대로, 2026-08-26) */
function fnEffectivePkg(basePackage, subPackage) {
  const base = basePackage || 'com.exam.app';
  return subPackage ? base + '.' + subPackage : base;
}

/* fnExtractOpts — DDL 문자열에서 schema/table/className/endpoint 를 자동 추출(원본 이식).
   subPackage — 테이블명 접두어(endpoint 를 만들 때 떼어내는 것과 동일한 조각)를 basePackage 하위
   폴더명으로 그대로 재사용한다. 예: zz_exam1 -> endpoint 'exam1' / subPackage 'zz' (2026-08-26) */
function fnExtractOpts(ddlText) {
  const m = (ddlText || '').match(/CREATE\s+TABLE\s+(?:(\w+)\.)?(\w+)/i);
  if (!m) return null;
  const table = m[2];
  const className = table.toLowerCase().split('_')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  const prefixM = table.match(/^([a-z]+)_/i);
  return {
    schemaNm: m[1] || '',
    tableNm: table,
    classNm: className,
    endpoint: table.replace(/^[a-z]+_/, ''),
    swaggerTag: className,
    subPackage: prefixM ? prefixM[1].toLowerCase() : '',
  };
}

/* fnLangOf — 파일 확장자 → Prism 언어 클래스 (원본 sourcegen_postgresql.html 의 fmLangOf 이식) */
function fnLangOf(fn) {
  const n = (fn || '').toLowerCase();
  if (n.endsWith('.java'))                       return 'java';
  if (n.endsWith('.xml'))                        return 'markup';
  if (n.endsWith('.html') || n.endsWith('.vue')) return 'markup';
  if (n.endsWith('.jsx'))                        return 'jsx';
  if (n.endsWith('.js'))                         return 'javascript';
  if (n.endsWith('.sql'))                        return 'sql';
  if (n.endsWith('.py'))                         return 'python';
  if (n.endsWith('.cs'))                         return 'csharp';
  if (n.endsWith('.csproj'))                     return 'markup';
  if (n.endsWith('.json'))                       return 'json';
  if (n.endsWith('.dart'))                       return 'dart';
  if (n.endsWith('.tsx') || n.endsWith('.ts'))   return 'jsx';
  if (n.endsWith('.yaml') || n.endsWith('.yml')) return 'yaml';
  if (n.endsWith('.kt') || n.endsWith('.kts'))   return 'kotlin';
  if (n.endsWith('.swift'))                      return 'swift';
  if (n.endsWith('.gradle'))                     return 'groovy';
  if (n.endsWith('.prisma') || n.endsWith('.env') || n.endsWith('.example')) return 'none';
  return 'none';
}

/* fnTsSuffix — 자동 생성 이름 접미어 "_YYYYMMDD_hhmm".
   ⭐ 이 접미어 패턴이 이름에 들어 있으면 "사용자가 직접 지은 이름이 아니라 자동 생성된 이름"으로 본다
   (소스젠·코바늘 공통 규칙). 사용자가 이름을 비워두고 저장하면 이 형식으로 자동으로 채워준다. */
function fnTsSuffix(d) {
  d = d || new Date();
  const p = n => String(n).padStart(2, '0');
  return `_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
}

/* ══════════════════ 대표이미지 — 첨부가 없으면 DDL 정보로 자동 생성 ══════════════════
   업로드된 사진이 없으면 저장 시 DDL 요약(테이블명 + 컬럼 목록)을 카드 이미지로 그려 올린다.
   코바늘 모듈의 자동 썸네일과 같은 방식 — 외부 라이브러리 없이 SVG 조립 → canvas 래스터화. */
const SG_THUMB_W = 480, SG_THUMB_H = 300;

/* fnEsc — SVG 안에 들어갈 텍스트의 XML 특수문자 이스케이프 */
function fnEsc(t) {
  return String(t == null ? '' : t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* fnBuildDdlThumbSvg — DDL 파싱 결과(meta)로 카드형 썸네일 SVG 조립.
   meta 가 없으면(파싱 실패/DDL 없음) 소스젠명만 큼직하게 넣은 기본 카드를 만든다. */
function fnBuildDdlThumbSvg(meta, projectNm, basePackage, dbTypeCd) {
  const W = SG_THUMB_W, H = SG_THUMB_H;
  const title = meta ? meta.table : (projectNm || 'sourcegen');
  const cols = meta ? meta.cols.slice(0, 9) : [];
  const more = meta && meta.cols.length > 9 ? (meta.cols.length - 9) : 0;

  let rows = '';
  cols.forEach((c, i) => {
    const y = 108 + i * 20;
    const pk = c.isPk ? '<tspan fill="#c9a96e" font-weight="700">PK </tspan>' : '';
    const typ = c.sqlType + (c.size ? '(' + c.size + ')' : '');
    rows += `<text x="26" y="${y}" font-size="12" font-family="Consolas,Monaco,monospace" fill="#cfd3dc">`
         +  `${pk}${fnEsc(c.name)}</text>`
         +  `<text x="${W - 26}" y="${y}" font-size="11" font-family="Consolas,Monaco,monospace" `
         +  `fill="#7f8794" text-anchor="end">${fnEsc(typ)}</text>`;
  });
  if (more) {
    rows += `<text x="26" y="${108 + cols.length * 20}" font-size="11" `
         +  `font-family="Consolas,Monaco,monospace" fill="#6b727e">… 외 ${more}개 컬럼</text>`;
  }
  if (!meta) {
    rows = `<text x="26" y="130" font-size="13" fill="#7f8794">DDL 미입력 — 저장 후 DDL 을 넣으면 요약이 표시됩니다</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`
    + `<rect width="${W}" height="${H}" fill="#1e222b"/>`
    + `<rect x="0" y="0" width="${W}" height="4" fill="#c9a96e"/>`
    + `<text x="26" y="44" font-size="11" font-weight="700" fill="#c9a96e" letter-spacing="2">SOURCE GENERATOR</text>`
    + `<text x="26" y="74" font-size="20" font-weight="700" fill="#ffffff" `
    + `font-family="Consolas,Monaco,monospace">${fnEsc(title)}</text>`
    + `<line x1="26" y1="88" x2="${W - 26}" y2="88" stroke="#39404d" stroke-width="1"/>`
    + rows
    + `<text x="26" y="${H - 20}" font-size="11" fill="#6b727e" `
    + `font-family="Consolas,Monaco,monospace">${fnEsc(basePackage || '')}</text>`
    + `<text x="${W - 26}" y="${H - 20}" font-size="11" fill="#6b727e" text-anchor="end">`
    + `${fnEsc(dbTypeCd === 'ORACLE' ? 'Oracle' : 'PostgreSQL')}</text>`
    + `</svg>`;
}

/* fnSvgToPngBlob — SVG 문자열을 오프스크린 <img>+<canvas> 로 PNG Blob 변환 */
function fnSvgToPngBlob(svgString, w, h) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1e222b';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('캔버스 변환 실패')), 'image/png');
    };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

/* SG_SAMPLE_GROUPS — [샘플] 버튼으로 바로 넣어볼 수 있는 예제 DDL (PostgreSQL / Oracle 두 벌).
   exam1~3 는 원본 소스젠 샘플(단일PK / 복합PK 2개 / 복합PK 3개)이고, shopjoy 는 이 프로젝트 자체
   DDL 스타일(컬럼 레벨 인라인 PK)이다 — 두 PK 표기가 모두 되는지 화면에서 바로 확인할 수 있게 함께 둔다.
   PostgreSQL 은 VARCHAR, Oracle 은 VARCHAR2/NUMBER 를 쓴다(원본 sourcegen_oracle.html 과 동일).
   샘플을 누르면 그 샘플의 DB 유형으로 상단 [DB 유형] 도 함께 맞춰준다(생성 결과가 DB 별로 다름). */
/* SG_DDL_SY_CODE_GRP / SG_DDL_SY_CODE / SG_DDL_SY_NOTICE — 실제 프로젝트 DDL(_doc/ddl_pgsql/sy/)에서
   그대로 가져온 예제 3종(2026-08-28 추가, zz_exam 시리즈에 이어 "진짜 업무 테이블" 예제로 보강).
   CREATE TABLE + COMMENT 만 남기고 VIEW/INDEX 구문은 샘플 취지에 안 맞아 제외했다. Oracle 버전은
   중복 관리를 피하려고 fnPgDdlToOracle() 로 그 자리에서 변환해 쓴다(아래 SG_SAMPLE_GROUPS 참조). */
const SG_DDL_SY_CODE_GRP = `CREATE TABLE shopjoy_2604.sy_code_grp (
    code_grp_id   VARCHAR(21)  NOT NULL CONSTRAINT sy_code_grp_pk_code_grp_id PRIMARY KEY,
    reg_site_id   VARCHAR(21)  NOT NULL,
    code_grp      VARCHAR(50)  NOT NULL,
    grp_nm        VARCHAR(100) NOT NULL,
    path_id       VARCHAR(21) ,
    code_grp_desc VARCHAR(300),
    use_yn        VARCHAR(1)   DEFAULT 'Y',
    reg_by        VARCHAR(30) ,
    reg_date      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by        VARCHAR(30) ,
    upd_date      TIMESTAMP
);
COMMENT ON TABLE  shopjoy_2604.sy_code_grp                IS '공통코드 그룹';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp.code_grp_id    IS '코드그룹ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp.reg_site_id    IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp.code_grp       IS '코드그룹코드 (예: MEMBER_GRADE)';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp.grp_nm         IS '그룹명';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp.path_id        IS '점(.) 구분 표시경로 (트리 빌드용)';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp.code_grp_desc  IS '코드그룹설명';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp.use_yn         IS '사용여부 Y/N';
`;

const SG_DDL_SY_CODE = `CREATE TABLE shopjoy_2604.sy_code (
    code_id           VARCHAR(21)  NOT NULL CONSTRAINT sy_code_pk_code_id PRIMARY KEY,
    reg_site_id       VARCHAR(21)  NOT NULL,
    code_grp_id       VARCHAR(50)  NOT NULL,
    code_value        VARCHAR(50)  NOT NULL,
    code_label        VARCHAR(100) NOT NULL,
    sort_ord          INTEGER      DEFAULT 0,
    use_yn            VARCHAR(1)   DEFAULT 'Y',
    parent_code_value VARCHAR(50) ,
    child_code_values VARCHAR(500),
    code_remark       VARCHAR(300),
    reg_by            VARCHAR(30) ,
    reg_date          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by            VARCHAR(30) ,
    upd_date          TIMESTAMP   ,
    code_level        INTEGER     ,
    code_opt1         VARCHAR(200),
    CONSTRAINT sy_code_fk_code_grp_id FOREIGN KEY (code_grp_id) REFERENCES shopjoy_2604.sy_code_grp(code_grp_id)
);
COMMENT ON TABLE  shopjoy_2604.sy_code                    IS '공통코드';
COMMENT ON COLUMN shopjoy_2604.sy_code.code_id            IS '코드ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.sy_code.reg_site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.sy_code.code_grp_id        IS '코드그룹ID (sy_code_grp.code_grp_id FK)';
COMMENT ON COLUMN shopjoy_2604.sy_code.code_value         IS '코드값 (저장값)';
COMMENT ON COLUMN shopjoy_2604.sy_code.code_label         IS '코드라벨 (표시명)';
COMMENT ON COLUMN shopjoy_2604.sy_code.sort_ord           IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.sy_code.use_yn             IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.sy_code.parent_code_value  IS '부모 코드값 (트리 구조 시 상위 code_value)';
COMMENT ON COLUMN shopjoy_2604.sy_code.child_code_values  IS '허용 자식/전이 코드값 목록 (^VAL1^VAL2^ 형식)';
COMMENT ON COLUMN shopjoy_2604.sy_code.code_remark        IS '비고';
COMMENT ON COLUMN shopjoy_2604.sy_code.code_level         IS '코드 트리 레벨 (1=루트, 2=중간, 3=리프 등)';
COMMENT ON COLUMN shopjoy_2604.sy_code.code_opt1          IS '코드별 부가 옵션 1 (색상 hex, 아이콘 클래스 등)';
`;

const SG_DDL_SY_NOTICE = `CREATE TABLE shopjoy_2604.sy_notice (
    notice_id        VARCHAR(21)  NOT NULL CONSTRAINT sy_notice_pk_notice_id PRIMARY KEY,
    reg_site_id      VARCHAR(21)  NOT NULL,
    notice_title     VARCHAR(200) NOT NULL,
    notice_type_cd   VARCHAR(30) ,
    is_fixed         VARCHAR(1)   DEFAULT 'N',
    content_html     TEXT        ,
    start_date       TIMESTAMP   ,
    end_date         TIMESTAMP   ,
    notice_status_cd VARCHAR(20)  DEFAULT 'ACTIVE',
    view_count       INTEGER      DEFAULT 0,
    reg_by           VARCHAR(30) ,
    reg_date         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(30) ,
    upd_date         TIMESTAMP
);
COMMENT ON TABLE  shopjoy_2604.sy_notice                  IS '공지사항';
COMMENT ON COLUMN shopjoy_2604.sy_notice.notice_id        IS '공지ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.sy_notice.reg_site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.sy_notice.notice_title     IS '제목';
COMMENT ON COLUMN shopjoy_2604.sy_notice.notice_type_cd   IS '공지유형 (코드: NOTICE_TYPE)';
COMMENT ON COLUMN shopjoy_2604.sy_notice.is_fixed         IS '상단고정 Y/N';
COMMENT ON COLUMN shopjoy_2604.sy_notice.content_html     IS '내용 (HTML)';
COMMENT ON COLUMN shopjoy_2604.sy_notice.start_date       IS '노출시작일';
COMMENT ON COLUMN shopjoy_2604.sy_notice.end_date         IS '노출종료일';
COMMENT ON COLUMN shopjoy_2604.sy_notice.notice_status_cd IS '상태 (ACTIVE/INACTIVE)';
COMMENT ON COLUMN shopjoy_2604.sy_notice.view_count       IS '조회수';
`;

const SG_SAMPLE_GROUPS = [
  { db: 'POSTGRESQL', dbLabel: 'PostgreSQL', items: [
    { key: 'pg1', label: 'zz_exam1', desc: '단일 PK',     text: `CREATE TABLE shopjoy_2604.zz_exam1 (
    exam1_id  VARCHAR(20)   NOT NULL,
    exam1_nm  VARCHAR(20)   NOT NULL,
    col11     VARCHAR(200)  NULL,
    col12     VARCHAR(200)  NULL,
    col13     VARCHAR(200)  NULL,
    reg_id    VARCHAR(20)   NULL,
    reg_dt    TIMESTAMP     NULL,
    upd_id    VARCHAR(20)   NULL,
    upd_dt    TIMESTAMP     NULL,
    CONSTRAINT pk_zz_exam1 PRIMARY KEY (exam1_id)
);
COMMENT ON TABLE  shopjoy_2604.zz_exam1            IS 'zz_exam1';
COMMENT ON COLUMN shopjoy_2604.zz_exam1.exam1_id   IS 'PK';
COMMENT ON COLUMN shopjoy_2604.zz_exam1.exam1_nm   IS '이름';
` },
    { key: 'pg2', label: 'zz_exam2', desc: '복합 PK 2개', text: `CREATE TABLE shopjoy_2604.zz_exam2 (
    exam1_id  VARCHAR(20)   NOT NULL,
    exam2_id  VARCHAR(20)   NOT NULL,
    exam2_nm  VARCHAR(20)   NOT NULL,
    col21     VARCHAR(200)  NULL,
    col22     VARCHAR(200)  NULL,
    reg_id    VARCHAR(20)   NULL,
    reg_dt    TIMESTAMP     NULL,
    upd_id    VARCHAR(20)   NULL,
    upd_dt    TIMESTAMP     NULL,
    CONSTRAINT pk_zz_exam2 PRIMARY KEY (exam1_id, exam2_id)
);
COMMENT ON TABLE  shopjoy_2604.zz_exam2            IS 'zz_exam2';
COMMENT ON COLUMN shopjoy_2604.zz_exam2.exam1_id   IS 'PK (zz_exam1 참조)';
COMMENT ON COLUMN shopjoy_2604.zz_exam2.exam2_id   IS 'PK';
COMMENT ON COLUMN shopjoy_2604.zz_exam2.exam2_nm   IS '이름';
` },
    { key: 'pg3', label: 'zz_exam3', desc: '복합 PK 3개', text: `CREATE TABLE shopjoy_2604.zz_exam3 (
    exam1_id  VARCHAR(20)   NOT NULL,
    exam2_id  VARCHAR(20)   NOT NULL,
    exam3_id  VARCHAR(20)   NOT NULL,
    exam3_nm  VARCHAR(20)   NOT NULL,
    col31     VARCHAR(200)  NULL,
    col32     VARCHAR(200)  NULL,
    reg_id    VARCHAR(20)   NULL,
    reg_dt    TIMESTAMP     NULL,
    upd_id    VARCHAR(20)   NULL,
    upd_dt    TIMESTAMP     NULL,
    CONSTRAINT pk_zz_exam3 PRIMARY KEY (exam1_id, exam2_id, exam3_id)
);
COMMENT ON TABLE  shopjoy_2604.zz_exam3            IS 'zz_exam3';
COMMENT ON COLUMN shopjoy_2604.zz_exam3.exam1_id   IS 'PK (zz_exam1 참조)';
COMMENT ON COLUMN shopjoy_2604.zz_exam3.exam2_id   IS 'PK';
COMMENT ON COLUMN shopjoy_2604.zz_exam3.exam3_nm   IS '이름';
` },
    { key: 'pgcg', label: 'sy_code_grp', desc: '공통코드 그룹', text: SG_DDL_SY_CODE_GRP },
    { key: 'pgc',  label: 'sy_code', desc: 'FK 참조(코드)', text: SG_DDL_SY_CODE },
    { key: 'pgn',  label: 'sy_notice', desc: '공지사항', text: SG_DDL_SY_NOTICE },
    { key: 'pgs', label: 'ShopJoy 스타일', desc: '인라인 PK', text: `CREATE TABLE shopjoy_2604.md_sg_project (
    project_id        VARCHAR(21)  NOT NULL CONSTRAINT md_sg_project_pk_project_id PRIMARY KEY,
    site_id           VARCHAR(21)  NOT NULL,
    reg_site_id       VARCHAR(21)  NOT NULL,
    project_nm        VARCHAR(200) NOT NULL,
    project_desc      VARCHAR(500),
    base_package      VARCHAR(200),
    db_type_cd        VARCHAR(20),
    ddl_count         INTEGER,
    last_gen_date     TIMESTAMP,
    use_yn            VARCHAR(1),
    reg_by            VARCHAR(30),
    reg_date          TIMESTAMP,
    upd_by            VARCHAR(30),
    upd_date          TIMESTAMP
);
COMMENT ON TABLE  shopjoy_2604.md_sg_project              IS '소스젠 프로젝트 마스터';
COMMENT ON COLUMN shopjoy_2604.md_sg_project.project_id   IS '프로젝트ID';
COMMENT ON COLUMN shopjoy_2604.md_sg_project.project_nm   IS '프로젝트명';
COMMENT ON COLUMN shopjoy_2604.md_sg_project.base_package IS 'Base Package';
` },
  ] },
  { db: 'ORACLE', dbLabel: 'Oracle', items: [
    { key: 'or1', label: 'zz_exam1', desc: '단일 PK',     text: `CREATE TABLE shopjoy_2604.zz_exam1 (
    exam1_id  VARCHAR2(20)   NOT NULL,
    exam1_nm  VARCHAR2(20)   NOT NULL,
    col11     VARCHAR2(200)  NULL,
    col12     VARCHAR2(200)  NULL,
    col13     VARCHAR2(200)  NULL,
    reg_id    VARCHAR2(20)   NULL,
    reg_dt    TIMESTAMP     NULL,
    upd_id    VARCHAR2(20)   NULL,
    upd_dt    TIMESTAMP     NULL,
    CONSTRAINT pk_zz_exam1 PRIMARY KEY (exam1_id)
);
COMMENT ON TABLE  shopjoy_2604.zz_exam1            IS 'zz_exam1';
COMMENT ON COLUMN shopjoy_2604.zz_exam1.exam1_id   IS 'PK';
COMMENT ON COLUMN shopjoy_2604.zz_exam1.exam1_nm   IS '이름';
` },
    { key: 'or2', label: 'zz_exam2', desc: '복합 PK 2개', text: `CREATE TABLE shopjoy_2604.zz_exam2 (
    exam1_id  VARCHAR2(20)   NOT NULL,
    exam2_id  VARCHAR2(20)   NOT NULL,
    exam2_nm  VARCHAR2(20)   NOT NULL,
    col21     VARCHAR2(200)  NULL,
    col22     VARCHAR2(200)  NULL,
    reg_id    VARCHAR2(20)   NULL,
    reg_dt    TIMESTAMP     NULL,
    upd_id    VARCHAR2(20)   NULL,
    upd_dt    TIMESTAMP     NULL,
    CONSTRAINT pk_zz_exam2 PRIMARY KEY (exam1_id, exam2_id)
);
COMMENT ON TABLE  shopjoy_2604.zz_exam2            IS 'zz_exam2';
COMMENT ON COLUMN shopjoy_2604.zz_exam2.exam1_id   IS 'PK (zz_exam1 참조)';
COMMENT ON COLUMN shopjoy_2604.zz_exam2.exam2_id   IS 'PK';
COMMENT ON COLUMN shopjoy_2604.zz_exam2.exam2_nm   IS '이름';
` },
    { key: 'or3', label: 'zz_exam3', desc: '복합 PK 3개', text: `CREATE TABLE shopjoy_2604.zz_exam3 (
    exam1_id  VARCHAR2(20)   NOT NULL,
    exam2_id  VARCHAR2(20)   NOT NULL,
    exam3_id  VARCHAR2(20)   NOT NULL,
    exam3_nm  VARCHAR2(20)   NOT NULL,
    col31     VARCHAR2(200)  NULL,
    col32     VARCHAR2(200)  NULL,
    reg_id    VARCHAR2(20)   NULL,
    reg_dt    TIMESTAMP     NULL,
    upd_id    VARCHAR2(20)   NULL,
    upd_dt    TIMESTAMP     NULL,
    CONSTRAINT pk_zz_exam3 PRIMARY KEY (exam1_id, exam2_id, exam3_id)
);
COMMENT ON TABLE  shopjoy_2604.zz_exam3            IS 'zz_exam3';
COMMENT ON COLUMN shopjoy_2604.zz_exam3.exam1_id   IS 'PK (zz_exam1 참조)';
COMMENT ON COLUMN shopjoy_2604.zz_exam3.exam2_id   IS 'PK';
COMMENT ON COLUMN shopjoy_2604.zz_exam3.exam3_nm   IS '이름';
` },
    { key: 'orcg', label: 'sy_code_grp', desc: '공통코드 그룹', text: fnPgDdlToOracle(SG_DDL_SY_CODE_GRP) },
    { key: 'orc',  label: 'sy_code', desc: 'FK 참조(코드)', text: fnPgDdlToOracle(SG_DDL_SY_CODE) },
    { key: 'orn',  label: 'sy_notice', desc: '공지사항', text: fnPgDdlToOracle(SG_DDL_SY_NOTICE) },
    { key: 'ors', label: 'ShopJoy 스타일', desc: '인라인 PK', text: `CREATE TABLE shopjoy_2604.md_sg_project (
    project_id        VARCHAR2(21)  NOT NULL CONSTRAINT md_sg_project_pk_project_id PRIMARY KEY,
    site_id           VARCHAR2(21)  NOT NULL,
    project_nm        VARCHAR2(200) NOT NULL,
    base_package      VARCHAR2(200),
    ddl_count         NUMBER,
    last_gen_date     TIMESTAMP,
    use_yn            VARCHAR2(1),
    reg_by            VARCHAR2(30),
    reg_date          TIMESTAMP
);
COMMENT ON TABLE  shopjoy_2604.md_sg_project              IS '소스젠 프로젝트 마스터';
COMMENT ON COLUMN shopjoy_2604.md_sg_project.project_nm   IS '프로젝트명';
` },
  ] },
];

/* SG_TEMPLATE_DOMAINS — [프로젝트템플릿다운로드] 목록. 실제 프로젝트 DDL(_doc/ddl_pgsql/)을
   업무구분(도메인 prefix)별로 묶은 것 — 지어낸 목업이 아니라 진짜 테이블 목록(2026-08-26).
   각 파일은 { dir, fn } — dir 은 _doc/ddl_pgsql/ 밑의 실제 폴더(ec|sy|cb|sg), fn 은 그 폴더의
   실제 .sql 파일명(확장자 제외). 기본 업무구분(mb~sy)에 더해 zz(샘플)/md(모듈) 및 sy 조합 그룹을
   2026-08-26 추가 — zz/md 는 폴더가 여러 개(ec+sy, cb+sg)라 다운로드 시 파일명이 겹칠 수 있어
   onDownloadTemplate 에서 겹치는 파일명만 "dir/파일명" 으로 풀어 담는다.
   DB 탭(Oracle/PostgreSQL)은 이 목록을 바꾸지 않고 다운로드 시 변환 여부만 결정한다
   (원본이 전부 PostgreSQL 이라 Oracle 은 fnPgDdlToOracle 로 최선 변환 — 정확도는 참고용). */
const fnMk = (dir, files) => files.map(fn => ({ dir, fn }));

const SGD_MB = fnMk('ec', [
  'mb_device_token', 'mb_like', 'mb_member', 'mb_member_addr', 'mb_member_grade',
  'mb_member_group', 'mb_member_group_map', 'mb_member_role', 'mb_member_sns',
  'mbh_member_login_log', 'mbh_member_token_log',
]);
const SGD_PD = fnMk('ec', [
  'pd_category', 'pd_category_prod', 'pd_dliv_tmplt', 'pd_prod', 'pd_prod_bundle_item',
  'pd_prod_content', 'pd_prod_img', 'pd_prod_opt', 'pd_prod_plan', 'pd_prod_qna',
  'pd_prod_rel', 'pd_prod_set_item', 'pd_prod_sku', 'pd_prod_stock', 'pd_prod_tag',
  'pd_restock_noti', 'pd_review', 'pd_review_attach', 'pd_review_comment', 'pd_tag',
  'pdh_prod_chg_hist', 'pdh_prod_content_chg_hist', 'pdh_prod_sku_chg_hist',
  'pdh_prod_sku_price_hist', 'pdh_prod_sku_stock_hist', 'pdh_prod_status_hist', 'pdh_prod_view_log',
]);
const SGD_OD = fnMk('ec', [
  'od_cart', 'od_claim', 'od_claim_item', 'od_dliv', 'od_dliv_item', 'od_order',
  'od_order_discnt', 'od_order_item', 'od_order_item_discnt', 'od_pay', 'od_pay_method',
  'od_refund', 'od_refund_method',
  'odh_claim_chg_hist', 'odh_claim_item_chg_hist', 'odh_claim_item_status_hist', 'odh_claim_status_hist',
  'odh_dliv_chg_hist', 'odh_dliv_item_chg_hist', 'odh_dliv_status_hist',
  'odh_order_chg_hist', 'odh_order_item_chg_hist', 'odh_order_item_status_hist', 'odh_order_status_hist',
  'odh_pay_chg_hist', 'odh_pay_status_hist',
]);
const SGD_PM = fnMk('ec', [
  'pm_cache', 'pm_coupon', 'pm_coupon_issue', 'pm_coupon_item', 'pm_coupon_prod', 'pm_coupon_usage',
  'pm_discnt', 'pm_discnt_item', 'pm_discnt_prod', 'pm_discnt_usage',
  'pm_event', 'pm_event_benefit', 'pm_event_item', 'pm_event_prod',
  'pm_gift', 'pm_gift_cond', 'pm_gift_issue',
  'pm_plan', 'pm_plan_item',
  'pm_save', 'pm_save_issue', 'pm_save_item', 'pm_save_policy', 'pm_save_prod', 'pm_save_usage',
  'pm_voucher', 'pm_voucher_issue',
]);
const SGD_DP = fnMk('ec', ['dp_area', 'dp_panel', 'dp_panel_item', 'dp_ui', 'dp_widget', 'dp_widget_lib']);
const SGD_ST = fnMk('ec', [
  'st_erp_voucher', 'st_erp_voucher_line', 'st_recon', 'st_settle', 'st_settle_adj',
  'st_settle_close', 'st_settle_config', 'st_settle_etc_adj', 'st_settle_item',
  'st_settle_pay', 'st_settle_raw',
]);
const SGD_CM = fnMk('ec', [
  'cm_blog', 'cm_blog_cate', 'cm_blog_file', 'cm_blog_good', 'cm_blog_reply', 'cm_blog_tag',
  'cm_chatt', 'cm_chatt_member', 'cm_chatt_msg',
  'cm_dashboard', 'cm_dashboard_item', 'cm_dashboard_item_data', 'cm_dashboard_menu',
  'cm_faq', 'cm_path', 'cm_popup', 'cm_popup_item',
  'cmh_push_log',
]);
const SGD_SY = fnMk('sy', [
  'sy_alarm', 'sy_attach', 'sy_batch', 'sy_bbm', 'sy_bbs', 'sy_brand', 'sy_code', 'sy_code_grp',
  'sy_contact', 'sy_dept', 'sy_exceldown', 'sy_i18n', 'sy_menu', 'sy_noti', 'sy_notice', 'sy_path',
  'sy_prop', 'sy_role', 'sy_role_menu', 'sy_site', 'sy_template', 'sy_user', 'sy_user_bookmark',
  'sy_user_pref', 'sy_user_role', 'sy_vendor', 'sy_vendor_brand', 'sy_vendor_content',
  'sy_vendor_user', 'sy_vendor_user_role', 'sy_voc',
  'syh_access_error_log', 'syh_access_log', 'syh_alarm_send_hist', 'syh_api_log', 'syh_batch_hist',
  'syh_batch_log', 'syh_ext_test_log', 'syh_send_email_log', 'syh_send_msg_log',
  'syh_user_login_log', 'syh_user_token_log',
]);
/* zz — 샘플 테이블. _doc/ddl_pgsql/ec/ 와 sy/ 양쪽에 흩어져 있다(개발용 zz_sample0~3 + zz_exam/zz_exmy). */
const SGD_ZZ = [
  ...fnMk('ec', ['zz_exam1', 'zz_exam2', 'zz_exam3', 'zz_exmy1', 'zz_exmy2', 'zz_exmy3',
    'zz_sample0', 'zz_sample1', 'zz_sample2', 'zz_sample3']),
  ...fnMk('sy', ['zz_sample0', 'zz_sample1', 'zz_sample2']),
];
/* md — 모듈(독립 FO 모듈) 테이블. cb(코바늘 도안) + sg(소스젠 자기 자신) 두 폴더에 걸쳐 있다. */
const SGD_MD = [
  ...fnMk('cb', ['md_cb_pattern', 'md_cb_pattern_cell', 'md_cb_pattern_yarn', 'md_cb_symbol', 'md_cb_yarn']),
  ...fnMk('sg', ['md_sg_download_hist', 'md_sg_project', 'md_sg_sourcegen', 'md_sg_sourcegen_hist', 'md_sg_stack']),
];

const SG_TEMPLATE_DOMAINS = [
  { key: 'all', label: 'shopjoy_2604 전체', files: [
    ...SGD_MB, ...SGD_PD, ...SGD_OD, ...SGD_PM, ...SGD_DP, ...SGD_ST, ...SGD_CM, ...SGD_SY, ...SGD_ZZ, ...SGD_MD,
  ] },
  { key: 'mb', label: '회원관리', files: SGD_MB },
  { key: 'pd', label: '상품관리', files: SGD_PD },
  { key: 'od', label: '주문관리', files: SGD_OD },
  { key: 'pm', label: '프로모션관리', files: SGD_PM },
  { key: 'dp', label: '전시관리', files: SGD_DP },
  { key: 'st', label: '정산관리', files: SGD_ST },
  { key: 'cm', label: '공통관리', files: SGD_CM },
  { key: 'sy', label: '시스템관리', files: SGD_SY },
  { key: 'zz', label: '샘플(zz)', files: SGD_ZZ },
  { key: 'md', label: '모듈(md)', files: SGD_MD },
  { key: 'sy_cm', label: '시스템관리 + 공통관리', files: [...SGD_SY, ...SGD_CM] },
  { key: 'sy_zz', label: '시스템관리 + 샘플(zz)', files: [...SGD_SY, ...SGD_ZZ] },
  { key: 'sy_zz_cm', label: '시스템관리 + 샘플(zz) + 공통관리', files: [...SGD_SY, ...SGD_ZZ, ...SGD_CM] },
];

/* fnPgDdlToOracle — PostgreSQL DDL → Oracle 방언 최선 변환(2026-08-26).
   원본 DDL 이 전부 PostgreSQL 뿐이라 Oracle 탭은 이 함수로 즉석 변환한다 — 정식 마이그레이션
   도구가 아니라 "템플릿 참고용" 수준의 최선 변환(타입/인덱스 구문 위주)이라는 한계를 UI 안내에 남긴다. */
/* fnDownloadTs — 다운로드 파일명용 타임스탬프 "yyyyMMdd_HHmm" (2026-08-26, 템플릿 ZIP 파일명 규칙). */
function fnDownloadTs() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
}

function fnPgDdlToOracle(sql) {
  return sql
    .replace(/\bVARCHAR\(/gi, 'VARCHAR2(')
    .replace(/\bTEXT\b/g, 'CLOB')
    .replace(/\bBOOLEAN\b/gi, 'NUMBER(1)')
    .replace(/\bBIGINT\b/gi, 'NUMBER(19)')
    .replace(/\bINTEGER\b/gi, 'NUMBER(10)')
    .replace(/\bDEFAULT\s+CURRENT_TIMESTAMP\b/gi, 'DEFAULT SYSTIMESTAMP')
    .replace(/\s+USING\s+btree\s*/gi, ' ')
    .replace(/::[a-zA-Z_][a-zA-Z_ ]*/g, '');  // PG 캐스트(::character varying 등) 제거 — Oracle 엔 없는 구문
}

window.MdSgSourcegenPage = {
  name: 'MdSgSourcegenPage',
  props: {
    showToast: { type: Function, default: () => {} },                      // 토스트 알림
    showConfirm: { type: Function, default: () => Promise.resolve(true) }, // 확인 모달
  },
  setup(props) {
    const { reactive, ref, computed, watch, onMounted } = Vue;

    /* ── 1) 상태 선언 (ref/reactive 를 computed/watch 보다 먼저) ── */
    const uiState = reactive({
      loading: false, generating: false, thumbUploading: false,
      autoThumb: true,        // 대표이미지 미첨부 시 DDL 정보로 자동 생성 (기본 ON)
      dtlMode: 'edit',        // 'view' | 'edit' — 목록에서 행 클릭=보기, [수정] 클릭=수정모드
      activeTabId: null,      // 현재 편집 중인 DDL 탭(tabId — 배열 재정렬과 무관한 안정 식별자)
      activeFile: '',         // 결과 뷰어에서 선택된 파일 키
      resultTabId: null,      // 결과 뷰어에서 보고 있는 탭(tabId) — resultScopeKind==='tab' 일 때만 사용
      resultScopeKind: 'root', // 결과 뷰어 범위 'root'(전체) | 'folder'(경로 하위 전부) | 'tab'(테이블 1개)
      resultScopePath: '',     // resultScopeKind==='folder' 일 때 그 경로
      resultTreeCollapsed: {}, // 결과 뷰어 좌측 트리 — 접힌 폴더 경로 집합
      genFileTreeCollapsed: {}, // 2026-08-30: "생성된 소스목록"(실제 경로 트리) — 접힌 폴더 경로 집합
      treeNewFolderParent: null, // 트리 [+ 새 폴더] 입력 중인 부모 경로(''=최상위, null=입력 안 함)
      treeNewFolderText: '',     // 트리 [+ 새 폴더] 입력값
      treeRenamePath: null,      // 트리 노드 이름변경 입력 중인 대상 경로(null=입력 안 함)
      treeRenameText: '',        // 트리 노드 이름변경 입력값
      treeDragKind: null,        // 드래그 중인 대상 종류('tab' | 'folder')
      treeDragTabId: null,       // 드래그 중인 탭 id (kind==='tab')
      treeDragFolderPath: null,  // 드래그 중인 폴더 경로 (kind==='folder')
      treeCollapsed: {},         // { [path]: true } — 접힌 폴더 경로 집합
      copied: false,
      genMemo: '',
      templateModalOpen: false,  // 프로젝트 템플릿 다운로드 모달 표시 여부
      templateDbTab: 'POSTGRESQL', // 템플릿 모달 안 DB 탭 선택('ORACLE' | 'POSTGRESQL')
      templateDownloadingKey: '', // 다운로드 진행중인 도메인 key(중복클릭 방지 + 버튼 로딩표시)
      stackPopOpen: false,       // [소스 생성] 언어/스택 선택 팝오버 표시 여부
      uploadModalOpen: false,    // 프로젝트업로드 모달 표시 여부
      uploadDbType: 'POSTGRESQL', // 업로드 파일의 DDL 방언(파싱 기준 사전선택) 'ORACLE' | 'POSTGRESQL'
      uploadReplaceExisting: true, // 2026-08-30: 체크(기본) → 기존 DDL 탭 전체 교체 / 해제 → 기존 탭에 누적 추가
      uploading: false,          // 업로드 파일 처리중
      autoFolderByPrefix: true,  // 테이블약어로 폴더생성하기 — 기본 ON(현재 동작). 끄면 새 탭은
                                 // subPackage 미지정(루트)으로만 추가되고 폴더 배치는 드래그로 직접 한다(2026-08-28).
      histTab: 'gen',            // 화면 하단 [이력] 탭 — 'gen'(생성 이력) | 'download'(생성결과 다운로드 이력)
    });

    /* selectedStacks — [소스 생성] 팝오버 체크 상태(SG_FILE_GROUPS.prefix 배열). localStorage 영속화 */
    const selectedStacks = reactive(fnLoadSelectedStacks());
    /* stackVersions — 스택별 버전 선택 { prefix: 'v1'|'v2'|'v3' }. localStorage 영속화 */
    const stackVersions = reactive(fnLoadStackVersions());

    const form = reactive({
      projectId: null, projectNm: '', projectDesc: '',
      basePackage: 'com.exam.app', dbTypeCd: 'POSTGRESQL',
      thumbnailUrl: '', thumbnailAttachId: null,
    });
    const thumbInputRef = ref(null);
    const uploadFileInputRef = ref(null);

    /* tabs — DDL 탭(테이블) 목록. 2026-08-26 부터 10개 고정 슬롯을 없애고 개수 제한 없는 배열로 바꿨다
       (좌측 트리에서 subPackage 기준으로 묶어 보여주는 구조로 바뀌면서 "탭 10개"라는 전제가 사라짐).
       tabId 는 배열 재정렬(드래그 이동)과 무관하게 특정 탭을 계속 가리키기 위한 내부 전용 식별자 —
       tabNo 는 저장 시 현재 배열 순서로 다시 매겨지는 표시/정렬용 값(구 "탭 1~10" 번호와 호환). */
    let _tabSeq = 0;
    const fnNewTab = (overrides = {}) => ({
      tabId: ++_tabSeq, tabNo: 0,
      ddlText: '', schemaNm: '', tableNm: '', classNm: '', endpoint: '', swaggerTag: '', subPackage: '',
      files: {}, error: '', generatedAt: '',
      ...overrides,
    });
    const tabs = reactive([fnNewTab()]);   // 신규 프로젝트는 빈 탭 1개로 시작

    const genHists = reactive([]);   // 생성 이력(첨부 ZIP) 목록
    /* genHistPager / templateDlHistPager — 2026-08-30: 서버사이드 페이징 도입(정책: 클라이언트
       사이드 페이징 금지). 이전엔 genHists 는 아예 페이징 없이 프로젝트의 전체 이력을,
       templateDlHist 는 항상 1페이지(10건)만 고정으로 불러와 2페이지 이상을 볼 방법이 없었다. */
    const genHistPager = reactive({ pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [10, 20, 50] });
    const templateDlHistPager = reactive({ pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [10, 20, 50] });
    /* templateDlHistGridColumns — [다운로드 이력](화면 최하단, 프로젝트 무관 전역 로그) 컬럼 정의.
       genHistGridColumns 와 동일한 fo-grid 패턴. projectNm 에 소스생성/템플릿 구분이 섞여 온다
       (템플릿 다운로드는 "[템플릿] " 접두어 — fnLogTemplateDownload 참조). */
    const templateDlHistGridColumns = [
      { key: 'regDate',    label: '일시', width: '150px', fmt: (v) => coUtil.cofYmdHm(v) || '-' },
      { key: 'projectNm',  label: '구분', width: '160px', fmt: (v) => v || '(제목없음)' },
      // 2026-08-30: 소스젠 결과 다운로드일 때만 값 있음(템플릿 다운로드는 '-') — genHistGridColumns 와 동일하게 축소 폰트
      // 2026-08-30: noEllipsis + white-space:normal — 길면 한 줄 말줄임 대신 개행해서 전부 보이게.
      // width 고정 해제(파일명 컬럼 제거로 생긴 여유 폭을 이 컬럼이 그대로 흡수하게).
      { key: 'selectedStacks', label: '선택 언어/스택', fmt: (v) => v || '-', cellTitle: (v) => v || '',
        noEllipsis: true, cellStyle: 'font-size:10.5px;line-height:1.5;white-space:normal;word-break:break-word;' },
      // 파일명(zipFileNm)은 2026-08-30 화면에서 안 보여도 된다는 요청으로 컬럼 자체 제거(데이터는 여전히 저장됨)
      { key: 'fileCount',  label: '건수', width: '80px', align: 'center', fmt: (v) => v || 0 },
      { key: 'genMemo',    label: '메모', width: '140px', fmt: (v) => v || '-' },
      // 2026-08-30: 누가 다운로드했는지 — memberNm(FO 회원 조인) 이 없으면 regBy(ID) 로 폴백
      { key: 'memberNm',   label: '다운로드자', width: '100px', fmt: (v, row) => v || row?.regBy || '-' },
    ];
    /* 재다운로드(2026-08-30) — attachId/zipUrl 이 있는 행(이 컬럼 추가 이후 기록)만 노출.
       plain href 링크라 클릭해도 이 그리드에 새 로그를 남기지 않는다(요청사항: "이때는
       다운로드 이력 저장 안 해도 되"). */
    templateDlHistGridColumns.push({ type: 'actions', actions: [
      // cls: 'btn btn-xs btn-secondary' 는 FO 전역 CSS에 정의가 없어 브라우저 기본 링크 모양으로
      // 보이던 것뿐 — 의도한 모양(텍스트 링크)을 명시적으로 sg-hist-link 로 고정(2026-08-30).
      { label: '다운로드', cls: 'sg-hist-link', href: (row) => row.zipUrl, visible: (row) => !!row.zipUrl },
    ] });

    /* genHistGridColumns — fo-grid 전환(2026-08-25). 번호는 idx+1(페이저 없는 로컬 배열이라
       그대로), 일시/크기는 coUtil 공통 헬퍼(cofYmdHm/cofFileSize) 사용. */
    const genHistGridColumns = [
      { key: 'genDate',     label: '생성일시', width: '150px', fmt: (v) => coUtil.cofYmdHm(v) || '-' },
      // 2026-08-30: noEllipsis + white-space:normal — 길면 한 줄 말줄임 대신 개행해서 전부 보이게.
      // width 고정 해제(파일명 컬럼 제거로 생긴 여유 폭을 이 컬럼이 그대로 흡수하게).
      { key: 'selectedStacks', label: '선택 언어/스택', fmt: (v) => v || '-', cellTitle: (v) => v || '',
        noEllipsis: true, cellStyle: 'font-size:10.5px;line-height:1.5;white-space:normal;word-break:break-word;' }, // 항목명+버전이 여러 개 이어붙어 길어질 수 있어 축소
      // 파일명(zipFileNm)은 2026-08-30 화면에서 안 보여도 된다는 요청으로 컬럼 자체 제거(데이터는 여전히 저장됨)
      { key: 'ddlCount',    label: '테이블', width: '80px', align: 'center', fmt: (v) => v || 0 },
      { key: 'fileCount',   label: '파일수', width: '80px', align: 'center', fmt: (v) => v || 0 },
      { key: 'zipFileSize', label: '크기', width: '90px', align: 'right', fmt: (v) => coUtil.cofFileSize(v) },
      { key: 'downloadCount', label: '다운로드수', width: '90px', align: 'center', fmt: (v) => v || 0 },
      { key: 'genMemo',     label: '메모', fmt: (v) => v || '-' },
      // 2026-08-30: 누가 생성했는지 — regUserNm(BO 관리자 조인) 우선, 없으면 memberNm(FO 회원 조인), 그것도 없으면 regBy(ID)
      { key: 'regUserNm',   label: '생성자', width: '100px', fmt: (v, row) => v || row?.memberNm || row?.regBy || '-' },
    ];

    const cfReadonly = computed(() => uiState.dtlMode === 'view');
    /* cfShowZipDownload — 2026-08-30: [ZIP 다운로드] 는 항상 "전체" 를 묶어서 내려받으므로
       (fnBuildZipBlob 이 tabs 전체를 순회), 좌측 트리에서 특정 테이블/폴더만 보고 있을 때
       버튼을 보여주면 "지금 보고 있는 것만" 다운로드될 거라 오해하기 쉽다 — "생성 결과 — 전체"
       를 보고 있을 때만 노출한다.
       2026-08-30 추가: cfTotalFileCount(생성 결과) 가 0 이면 버튼 자체를 숨긴다 — 예전엔
       [생성 결과] 패널이 안 보이는데도(v-if="cfTotalFileCount") 이 버튼만 비활성 상태로 계속
       떠 있어 "패널이 보일 때만 나와야 한다"는 요청. 이제 [생성 결과] 패널과 노출 조건이
       같아져 항상 같이 보이거나 같이 사라진다. */
    const cfShowZipDownload = computed(() => !cfReadonly.value && uiState.resultScopeKind === 'root' && cfTotalFileCount.value > 0);

    /* type:'actions' — 관리 버튼모음도 별도 배열로 분리하지 않고 genHistGridColumns 항목 하나로 선언
       (#row-actions 슬롯 대체, 2026-08-25). cfReadonly 선언 직후에 둔다 — 삭제 버튼이 그 값을 읽는다. */
    genHistGridColumns.push({ type: 'actions', actions: [
      // 2026-08-30: href(단순 링크) → onClick(다운로드수 증가 후 열기). cls 는 박스형 버튼이 아닌
      // [생성결과 다운로드 이력] 의 href 링크와 같은 텍스트 링크 모양(sg-hist-link)으로 통일.
      { label: '다운로드', cls: 'sg-hist-link', onClick: (row) => onDownloadGenHistZip(row), visible: (row) => !!row.zipUrl },
      { label: '불러오기', cls: 'btn btn-xs btn_detail', onClick: (row) => onLoadSnapshot(row), visible: (row) => !!row.ddlSnapshotJson },
      { label: '삭제',     cls: 'btn btn_row_delete', onClick: (row) => onDeleteGenHist(row), visible: () => !cfReadonly.value }, // btn_row_delete 는 xs 크기 내장(병기 불필요)
    ] });
    const cfIsNew = computed(() => !form.projectId);
    const cfCurTab = computed(() => tabs.find(t => t.tabId === uiState.activeTabId) || tabs[0]);
    const cfTotalFileCount = computed(() => tabs.reduce((s, t) => s + Object.keys(t.files).length, 0));
    /* cfFilledTabs — DDL 이 실제로 입력된 탭만 (생성/저장 대상) */
    const cfFilledTabs = computed(() => tabs.filter(t => (t.ddlText || '').trim()));
    /* cfResultTabs — 생성 결과가 있는 탭들(탭 id 기준 — 배열 인덱스는 드래그 이동으로 바뀔 수 있어 안 씀) */
    const cfResultTabs = computed(() => tabs.filter(t => Object.keys(t.files).length));

    /* ── 결과 뷰어 좌측 트리(2026-08-26) — DDL 트리와 같은 구조를 생성 결과 있는 탭만으로 다시 그려서
       "루트=전체 / 폴더=그 하위 전부 / 테이블=그 테이블만" 3단계 범위 선택을 지원한다. */
    const cfResultTree = computed(() => fnBuildTree(cfResultTabs.value));
    const cfResultTreeFlat = computed(() => fnFlattenTree(cfResultTree.value, uiState.resultTreeCollapsed));

    /* cfResultScopeTabs — 현재 선택된 범위(전체/폴더/테이블)에 해당하는 결과-보유 탭들 */
    const cfResultScopeTabs = computed(() => {
      if (uiState.resultScopeKind === 'tab') {
        const t = tabs.find(x => x.tabId === uiState.resultTabId);
        return t && Object.keys(t.files).length ? [t] : [];
      }
      if (uiState.resultScopeKind === 'folder') {
        const path = uiState.resultScopePath;
        return cfResultTabs.value.filter(t => (t.subPackage || '') === path || (t.subPackage || '').startsWith(path + '.'));
      }
      return cfResultTabs.value;   // 'root' — 전체
    });
    /* cfResultScopeLabel — 결과 패널 제목에 쓸 범위 이름 */
    const cfResultScopeLabel = computed(() => {
      if (uiState.resultScopeKind === 'tab') {
        const t = tabs.find(x => x.tabId === uiState.resultTabId);
        return t ? (t.tableNm || '테이블') : '테이블';
      }
      if (uiState.resultScopeKind === 'folder') return uiState.resultScopePath || '최상위';
      return '전체';
    });
    /* cfScopeFileEntries — 범위 안 모든 탭의 파일을 하나의 평탄 목록으로. 테이블이 2개 이상이면
       같은 상대경로 파일(예: backend_jpa/util/VoUtil.java)이 테이블마다 있을 수 있어 key 를
       tabId 로 구분한다. realPath(2026-08-30) — fnZipPath 로 계산한 실제 ZIP 내부 경로(=실제
       생성 경로). 소스목록 트리/소스정보 파일경로 표시에 이 값을 쓴다(내부 논리 키인 fn 대신). */
    const cfScopeFileEntries = computed(() => {
      const tabsInScope = cfResultScopeTabs.value;
      const multi = tabsInScope.length > 1;
      const out = [];
      tabsInScope.forEach(t => {
        const pkgPath = fnEffectivePkg(form.basePackage, t.subPackage).replace(/\./g, '/');
        Object.keys(t.files).forEach(fn => {
          out.push({ key: t.tabId + '::' + fn, fn, tableNm: t.tableNm || '(이름없음)', content: t.files[fn], multi,
            realPath: fnZipPath(fn, pkgPath) });
        });
      });
      return out;
    });
    /* cfGenFileTree / cfGenFileTreeFlat — "생성된 소스목록"(2026-08-30, 구 cfGroupedFiles 대체).
       기존엔 "Backend - JPA" 같은 스택 구분 헤더로 나눈 평탄 버튼 목록이었는데, 실제 생성되는
       파일 구조 그대로(구분 헤더 없이) 폴더 트리로 보여달라는 요청 — fnBuildFileTree 가 이미
       실제 경로(realPath) 기준으로 트리를 쌓으므로 스택별 폴더(be_jpa 등)가 자연히
       구분되어 보인다. */
    const cfGenFileTree = computed(() => fnBuildFileTree(cfScopeFileEntries.value));
    const cfGenFileTreeFlat = computed(() => fnFlattenFileTree(cfGenFileTree.value, uiState.genFileTreeCollapsed));
    /* cfGenFileCount — 트리에 실제로 나열되는(중복 제거된) 파일 리프 수. 여러 테이블이 만든 동일
       실제경로 파일(공용 유틸 등)은 트리에서 1개로 합쳐지므로 cfScopeFileEntries.length 와 다를 수
       있다 — "소스목록" 옆 총개수는 이 값을 써야 화면에 실제로 보이는 항목 수와 일치한다. */
    const cfGenFileCount = computed(() => cfGenFileTreeFlat.value.filter(r => r.kind === 'file').length);
    /* cfActiveEntry — 현재 선택된 파일(uiState.activeFile = "tabId::경로") 하나 찾기 */
    const cfActiveEntry = computed(() => cfScopeFileEntries.value.find(e => e.key === uiState.activeFile) || null);
    const cfResultScopeTabsCount = computed(() => cfResultScopeTabs.value.length);
    /* cfResultScopeGeneratedAt — 범위가 테이블 1개일 때만 그 생성시각 표시(여러 테이블 묶인 범위는
       테이블마다 생성시각이 달라 대표값이 의미 없어 아예 안 보여준다) */
    const cfResultScopeGeneratedAt = computed(() => {
      if (uiState.resultScopeKind !== 'tab') return '';
      const t = tabs.find(x => x.tabId === uiState.resultTabId);
      return t ? t.generatedAt : '';
    });

    /* fnGateAutoSubPackage — fnExtractOpts() 결과에서 subPackage(테이블약어 폴더 자동배치)를
       [테이블약어로 폴더생성하기] 체크 여부에 따라 걸러낸다. 꺼져 있으면 subPackage 키 자체를
       빼서 반환한다 — 새 탭(fnNewTab 기본값 '')은 자연히 루트에 남고, 기존 탭을 덮어쓸 때도
       (예: 샘플 중복 클릭 시 덮어쓰기) 사용자가 드래그로 이미 옮겨둔 폴더 위치를 건드리지
       않는다(2026-08-28). */
    const fnGateAutoSubPackage = (opts) => {
      if (!opts) return opts;
      if (uiState.autoFolderByPrefix) return opts;
      const { subPackage, ...rest } = opts;
      return rest;
    };

    /* ── 2) DDL 입력 → 옵션 자동 추출 (watch 대신 입력 핸들러에서 직접 호출) ── */
    const onDdlInput = () => {
      const t = cfCurTab.value;
      const opts = fnGateAutoSubPackage(fnExtractOpts(t.ddlText));
      if (opts) Object.assign(t, opts);
      fnFillAutoName();
    };

    /* fnFillAutoName — 소스젠명이 비어 있으면 "테이블명_YYYYMMDD_hhmm" 으로 채운다.
       기준 테이블은 입력된 첫 탭(보통 탭1)의 테이블명. 사용자가 직접 지운/입력한 값은 건드리지 않는다. */
    const fnFillAutoName = () => {
      if (cfReadonly.value) return;
      if (form.projectNm && form.projectNm.trim()) return;
      const first = cfFilledTabs.value[0];
      if (!first || !first.tableNm) return;
      form.projectNm = first.tableNm + fnTsSuffix();
    };

    /* onLoadSample — [샘플] 버튼: 기본은 기존 탭들에 새 탭을 "추가"한다(잘못 넣었으면 그 탭에서
       [삭제]하면 되므로 확인창 없음). 현재 탭이 아직 빈 탭이면 그 자리를 그대로 채워 불필요한
       빈 탭이 남지 않게 한다. 단, 같은 테이블명의 탭이 이미 있으면(같은 샘플 중복 클릭 등) 새로
       추가하지 않고 그 기존 탭을 덮어쓸지 확인창으로 물은 뒤 처리한다(2026-08-28 — 중복 탭이
       쌓이던 문제 보완). 생성 결과가 DB 별로 달라지므로 샘플이 속한 DB 유형으로 상단 [DB 유형]
       도 함께 맞춘다. */
    const onLoadSample = async (s, dbTypeCd) => {
      if (dbTypeCd) form.dbTypeCd = dbTypeCd;
      const opts = fnExtractOpts(s.text);
      const dupe = opts && tabs.find(x => x.tableNm === opts.tableNm && (x.ddlText || '').trim());
      if (dupe) {
        if (!await props.showConfirm('샘플 넣기', `[${dupe.tableNm}] 테이블이 이미 있습니다. 덮어쓰시겠습니까?`)) return;
        uiState.activeTabId = dupe.tabId;
        Object.assign(dupe, fnGateAutoSubPackage(opts), { ddlText: s.text, files: {}, error: '', generatedAt: '' });
        fnFillAutoName();
        return;
      }
      const cur = cfCurTab.value;
      const t = (cur && !(cur.ddlText || '').trim()) ? cur : fnNewTab();
      if (t !== cur) { tabs.push(t); uiState.activeTabId = t.tabId; }
      t.ddlText = s.text;
      if (opts) Object.assign(t, fnGateAutoSubPackage(opts));
      t.files = {}; t.error = ''; t.generatedAt = '';
      fnFillAutoName();
    };

    /* onSampleSelectChange — 헤더의 예제 DDL select(2026-08-30, 기존 버튼 그리드 대체) 변경 핸들러.
       "값을 고르는 즉시 실행하고 되돌리는" 실행형 컨트롤이라, :value 를 상수 ''로만 바인딩해두면
       Vue 가 다음 렌더에서 "값이 안 바뀌었다"고 보고 DOM 패치를 건너뛸 수 있어 select 표시가
       고른 항목에 그대로 남을 위험이 있다 — evt.target.value 를 직접 되돌려 확실히 초기화한다. */
    const onSampleSelectChange = async (evt) => {
      const val = evt.target.value;
      evt.target.value = '';
      if (!val) return;
      const [db, key] = val.split('::');
      const grp = SG_SAMPLE_GROUPS.find(g => g.db === db);
      const s = grp && grp.items.find(x => x.key === key);
      if (s) await onLoadSample(s, db);
    };

    /* ── 대표이미지 — 수동 업로드 / 제거 / (미첨부 시) DDL 자동생성 ── */
    const onOpenThumbPicker = () => {
      if (cfReadonly.value || uiState.thumbUploading) return;
      thumbInputRef.value?.click();
    };
    const onRemoveThumb = () => { form.thumbnailUrl = ''; form.thumbnailAttachId = null; };
    const onThumbFileChange = async (e) => {
      const f = e.target.files?.[0]; e.target.value = '';
      if (!f) return;
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) { props.showToast('이미지 파일만 업로드할 수 있습니다.', 'error'); return; }
      if (f.size > 5 * 1024 * 1024) { props.showToast('5MB 이하 이미지만 업로드할 수 있습니다.', 'error'); return; }
      uiState.thumbUploading = true;
      try {
        const fd = new FormData();
        fd.append('files', f);
        fd.append('businessCode', 'md_sg_project');
        const res = await coApiSvc.cmUpload.uploadMulti(fd, '소스젠', '대표이미지업로드');
        const up = (res.data?.data?.files || [])[0];
        if (up) {
          form.thumbnailUrl = up.cdnImgUrl || up.attachUrl || '';
          form.thumbnailAttachId = up.attachId || null;
          props.showToast('대표이미지가 등록되었습니다.', 'success');
        }
      } catch (err) {
        props.showToast(coUtil.cofErrMsg(err, '이미지 업로드 중 오류가 발생했습니다.'), 'error', 0);
      } finally {
        uiState.thumbUploading = false;
      }
    };

    /* fnAutoThumbFromDdl — 첨부가 없을 때 첫 DDL 탭 정보로 썸네일을 만들어 올린다.
       실패해도 저장 자체는 막지 않는다(대표이미지는 부가 기능). */
    const fnAutoThumbFromDdl = async () => {
      try {
        const first = cfFilledTabs.value[0];
        let meta = null;
        if (first && typeof gnParseDdl === 'function') {
          try { meta = gnParseDdl(first.ddlText, form.dbTypeCd === 'ORACLE' ? 'oracle' : 'postgresql'); }
          catch (e) { meta = null; }   // 파싱 실패해도 기본 카드로 계속 진행
        }
        const svg = fnBuildDdlThumbSvg(meta, form.projectNm, form.basePackage, form.dbTypeCd);
        const blob = await fnSvgToPngBlob(svg, SG_THUMB_W, SG_THUMB_H);
        const fd = new FormData();
        fd.append('files', blob, 'sg-thumb.png');
        fd.append('businessCode', 'md_sg_project');
        const res = await coApiSvc.cmUpload.uploadMulti(fd, '소스젠', '대표이미지자동생성');
        const up = (res.data?.data?.files || [])[0];
        if (up) {
          form.thumbnailUrl = up.cdnImgUrl || up.attachUrl || '';
          form.thumbnailAttachId = up.attachId || null;
        }
      } catch (e) { /* 자동 생성 실패 시 대표이미지 없이 저장 진행 */ }
    };

    /* fnHighlight — Prism 재적용. 코드가 v-html 없이 텍스트로 들어가므로
       DOM 갱신(nextTick) 뒤에 highlightElement 를 직접 호출해야 색이 입혀진다.
       Prism 이 없으면(로드 실패) 조용히 넘어가 평문으로 보인다. */
    const codeBoxRef = ref(null);
    const fnHighlight = async () => {
      await Vue.nextTick();
      if (typeof Prism === 'undefined' || !codeBoxRef.value) return;
      const codeEl = codeBoxRef.value.querySelector('code');
      if (codeEl) Prism.highlightElement(codeEl);
    };
    /* ddlCodeBoxRef / fnHighlightDdl — 2026-08-30: DDL 입력 영역을 [소스정보] 코드뷰어처럼
       Prism 하이라이트로 보여준다. 보기모드는 <pre> 단독, 편집모드는 그 위에 투명 <textarea>
       를 겹친 오버레이 에디터(위 템플릿 주석 참조) — 어느 쪽이든 같은 ref/함수를 공유한다. */
    const ddlCodeBoxRef = ref(null);
    const fnHighlightDdl = async () => {
      await Vue.nextTick();
      if (typeof Prism === 'undefined' || !ddlCodeBoxRef.value) return;
      const codeEl = ddlCodeBoxRef.value.querySelector('code');
      if (codeEl) Prism.highlightElement(codeEl);
    };
    /* 탭 전환·타이핑뿐 아니라 [수정]→[취소](edit→view) 모드 전환에도 다시 하이라이트해야 한다 —
       cfReadonly 만 바뀌고 ddlText 값 자체는 그대로인 경우(취소는 서버 재조회로 tabs 를 통째로
       새 객체로 교체하지만 텍스트 내용은 동일)까지 값 비교만으로는 "변경 없음"으로 보여 감지가
       안 됐다("수정 클릭 후 취소 클릭하면 컬러가 흑백으로 바뀐다" 버그). 매 평가마다 새 배열을
       반환해 Vue 가 항상 "변경됨"으로 보고 재실행하게 한다(fnHighlightDdl 은 멱등이라 여분 호출
       비용 낮음). */
    watch(() => [cfReadonly.value, cfCurTab.value ? cfCurTab.value.ddlText : null],
      () => fnHighlightDdl(), { immediate: true });
    /* onDdlScroll — 편집모드 오버레이에서 투명 textarea 를 스크롤하면 그 아래 하이라이트된
       <pre> 도 같은 위치로 맞춰 스크롤해야 색 입혀진 글자가 커서를 계속 따라간다. */
    const onDdlScroll = (e) => {
      if (!ddlCodeBoxRef.value) return;
      ddlCodeBoxRef.value.scrollTop = e.target.scrollTop;
      ddlCodeBoxRef.value.scrollLeft = e.target.scrollLeft;
    };

    /* ── 3) 데이터 로드 ── */
    const fnLoadProject = async (projectId) => {
      const res = await mdSgApiSvc.project.getById(projectId, '소스젠', '상세조회');
      const p = res.data?.data;
      if (!p) { props.showToast('존재하지 않는 프로젝트입니다.', 'error'); return; }
      Object.assign(form, {
        projectId: p.projectId, projectNm: p.projectNm, projectDesc: p.projectDesc || '',
        basePackage: p.basePackage || 'com.exam.app', dbTypeCd: p.dbTypeCd || 'POSTGRESQL',
        thumbnailUrl: p.thumbnailUrl || '', thumbnailAttachId: p.thumbnailAttachId || null,
      });

      /* DDL 탭 복원 — 서버가 준 순서(tabNo asc)대로 tabs 배열을 통째로 새로 구성한다
         (2026-08-26, 고정 10슬롯 폐지 — 저장된 탭 수만큼 그대로 생긴다). */
      const ddlRes = await mdSgApiSvc.ddl.getList(p.projectId, '소스젠', 'DDL조회');
      const ddlRows = ddlRes.data?.data || [];
      tabs.splice(0, tabs.length, ...(ddlRows.length ? ddlRows.map(d => fnNewTab({
        tabNo: d.tabNo || 0, ddlText: d.ddlText || '', schemaNm: d.schemaNm || '', tableNm: d.tableNm || '',
        classNm: d.classNm || '', endpoint: d.endpoint || '', swaggerTag: d.swaggerTag || '',
        subPackage: d.subPackage || '',
      })) : [fnNewTab()]));

      await fnLoadGenHists(p.projectId, true);
      uiState.dtlMode = 'view';  // 목록에서 들어온 진입은 항상 보기모드 — [수정] 클릭 시에만 편집
      uiState.activeTabId = tabs[0].tabId;
    };

    /* fnLoadGenHists — 2026-08-30: getList(전체 로드) → getPage(서버사이드 페이징)로 전환.
       projectId 가 바뀌는 호출(행 전환 등)은 1페이지로 되돌린다. */
    const fnLoadGenHists = async (projectId, resetPage) => {
      if (resetPage) genHistPager.pageNo = 1;
      const res = await mdSgApiSvc.genHist.getPage(
        { projectId, pageNo: genHistPager.pageNo, pageSize: genHistPager.pageSize }, '소스젠', '생성이력조회');
      const d = res.data?.data || {};
      genHists.splice(0, genHists.length, ...(d.pageList || []));
      genHistPager.pageTotalCount = d.pageTotalCount || 0;
      genHistPager.pageTotalPage = d.pageTotalPage || 1;
    };
    const onSetPageGenHist = (n) => { genHistPager.pageNo = n; fnLoadGenHists(form.projectId); };
    const onSizeChangeGenHist = () => { fnLoadGenHists(form.projectId, true); };

    /* ── 4) 화면 이동 / 모드 전환 ── */
    const onBackToList = () => { location.href = 'fo-md-sg-sourcegen.html?view=list'; };
    const onNewProject = () => {
      Object.assign(form, { projectId: null, projectNm: '', projectDesc: '', basePackage: 'com.exam.app',
        dbTypeCd: 'POSTGRESQL', thumbnailUrl: '', thumbnailAttachId: null });
      tabs.splice(0, tabs.length, fnNewTab());
      genHists.splice(0, genHists.length);
      Object.assign(genHistPager, { pageNo: 1, pageTotalCount: 0, pageTotalPage: 1 });
      uiState.dtlMode = 'edit';
      uiState.activeTabId = tabs[0].tabId;
      uiState.activeFile = '';
      history.replaceState(null, '', 'fo-md-sg-sourcegen.html?view=editor');
    };
    const onSwitchToEdit = () => { uiState.dtlMode = 'edit'; };
    const onCancelEdit = async () => {
      if (form.projectId) await fnLoadProject(form.projectId);
      uiState.dtlMode = 'view';
    };

    /* ── 4b) 프로젝트 템플릿 다운로드 / 프로젝트 업로드 ── */
    const onTemplateModalOpen = () => { uiState.templateModalOpen = true; };
    const onTemplateModalClose = () => { uiState.templateModalOpen = false; };
    const onTemplateDbTab = (db) => { uiState.templateDbTab = db; };

    /* onProjectUploadStart — [프로젝트업로드] 버튼. DB유형 사전선택 모달을 연다(2026-08-26) */
    const onProjectUploadStart = () => { uiState.uploadModalOpen = true; };
    const onProjectUploadDbPick = (db) => { uiState.uploadDbType = db; };
    const onOpenUploadPicker = () => { uploadFileInputRef.value?.click(); };

    /* fnSplitDdlStatements — 텍스트 하나에 CREATE TABLE 이 여러 개 이어붙어 있어도(직접 붙여넣거나
       여러 테이블을 한 .sql 에 모아 올린 경우) 테이블 단위로 쪼갠다. 그 테이블 뒤에 따라오는
       COMMENT ON / CREATE INDEX 등 부속 구문은 다음 CREATE TABLE 직전까지 같은 조각으로 묶인다. */
    const fnSplitDdlStatements = (text) => {
      const marker = /CREATE\s+TABLE\s+/gi;
      const starts = [];
      let m;
      while ((m = marker.exec(text))) starts.push(m.index);
      if (!starts.length) return [];
      return starts.map((s, i) => text.slice(s, i + 1 < starts.length ? starts[i + 1] : text.length).trim());
    };

    /* onProjectUploadFile — 파일 선택 즉시 파싱해서 트리에 반영한다. txt/sql 은 그대로 읽고,
       zip 은 안의 txt/sql 파일들을 전부 읽어 합친다.
       2026-08-30: 기존엔 기존 탭에 계속 추가만 해서 같은 파일을 다시 올리면 좌측 트리에 같은
       테이블이 중복으로 쌓였다("좌측 소스정보 지우고 다시 만들어주면 되" 요청) — 모달의
       [기존정보 초기화] 체크박스(uiState.uploadReplaceExisting, 기본 체크)로 동작을 고른다:
       체크 시 업로드 내용으로 전체 교체(+이미 입력된 내용이 있으면 확인), 해제 시 기존 방식대로
       기존 탭 뒤에 누적 추가(확인 불필요 — 데이터를 지우지 않으므로). */
    const onProjectUploadFile = async (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      const nameLower = file.name.toLowerCase();
      if (!/\.(txt|sql|zip)$/.test(nameLower)) {
        props.showToast('txt, sql, zip 파일만 업로드할 수 있습니다.', 'error'); return;
      }
      uiState.uploading = true;
      try {
        const texts = [];
        if (nameLower.endsWith('.zip')) {
          if (typeof JSZip !== 'function') throw new Error('JSZip 이 로드되지 않았습니다.');
          const zip = await JSZip.loadAsync(file);
          const entries = Object.values(zip.files).filter(f => !f.dir && /\.(txt|sql)$/i.test(f.name));
          if (!entries.length) throw new Error('ZIP 안에 txt/sql 파일이 없습니다.');
          for (const entry of entries) texts.push(await entry.async('text'));
        } else {
          texts.push(await file.text());
        }
        const isOracle = uiState.uploadDbType === 'ORACLE';
        const dbType = isOracle ? 'oracle' : 'postgresql';
        const newTabs = [];
        texts.forEach(text => {
          fnSplitDdlStatements(text).forEach(stmt => {
            const opts = fnExtractOpts(stmt);
            if (!opts) return;
            /* 실제 파싱 가능한지도 확인 — 파싱 실패하는 조각은 건너뛰고 나머지는 계속 진행 */
            try { gnParseDdl(stmt, dbType); } catch (e) { return; }
            newTabs.push(fnNewTab({ ddlText: stmt, ...fnGateAutoSubPackage(opts) }));
          });
        });
        if (!newTabs.length) throw new Error('CREATE TABLE 구문을 찾지 못했습니다.');
        if (uiState.uploadReplaceExisting) {
          if (cfFilledTabs.value.length &&
            !await props.showConfirm('프로젝트 업로드', '업로드한 내용으로 현재 DDL 탭을 전부 교체하시겠습니까?\n(현재 입력된 내용은 사라집니다)')) {
            return;
          }
          tabs.splice(0, tabs.length, ...newTabs);
        } else {
          newTabs.forEach(t => tabs.push(t));
        }
        form.dbTypeCd = uiState.uploadDbType;
        uiState.activeTabId = newTabs[0].tabId;
        uiState.uploadModalOpen = false;
        fnFillAutoName();
        props.showToast(`${newTabs.length}개 테이블을 불러왔습니다.`, 'success');
      } catch (err) {
        props.showToast(err.message || '업로드 파일 처리 중 오류가 발생했습니다.', 'error', 0);
      } finally {
        uiState.uploading = false;
      }
    };

    /* onDownloadTemplate — 업무구분(도메인) 하나를 골라 실제 DDL(_doc/ddl_pgsql/)을 그대로
       ZIP 으로 묶어 다운로드한다(2026-08-26). Oracle 탭이면 fnPgDdlToOracle 로 변환해서 담는다.
       Live Server 로 서비스되는 정적 파일을 fetch 로 그대로 읽어오는 방식 — 별도 백엔드 API 불필요. */
    const onDownloadTemplate = async (domain) => {
      if (uiState.templateDownloadingKey) return;   // 중복 클릭 방지
      if (typeof JSZip !== 'function') { props.showToast('JSZip 이 로드되지 않았습니다.', 'error', 0); return; }
      uiState.templateDownloadingKey = domain.key;
      try {
        const isOracle = uiState.templateDbTab === 'ORACLE';
        /* zz/md 등 조합 그룹은 폴더가 여러 개(ec+sy, cb+sg)라 같은 파일명이 겹칠 수 있다 —
           겹치는 파일명만 "dir/파일명" 으로 풀어 담아 충돌을 피한다(2026-08-26). */
        const fnCount = {};
        domain.files.forEach(f => { fnCount[f.fn] = (fnCount[f.fn] || 0) + 1; });
        const results = await Promise.all(domain.files.map(async (f) => {
          const res = await fetch(`_doc/ddl_pgsql/${f.dir}/${f.fn}.sql`);
          if (!res.ok) throw new Error(`${f.fn}.sql 을 불러오지 못했습니다. (${res.status})`);
          const text = await res.text();
          const zipPath = fnCount[f.fn] > 1 ? `${f.dir}/${f.fn}.sql` : `${f.fn}.sql`;
          return { zipPath, text: isOracle ? fnPgDdlToOracle(text) : text };
        }));
        const zip = new JSZip();
        results.forEach(({ zipPath, text }) => { zip.file(zipPath, text); });
        const blob = await zip.generateAsync({ type: 'blob' });
        /* 파일명 형식(2026-08-26): sourcegen_template_{yyyyMMdd}_{HHmm}_{db구분}_{도메인key}_{테이블수}.zip
           예) sourcegen_template_20260826_0750_postgresql_sy_zz_cm_121.zip — 언제/어떤 DB용/어떤 묶음을
           몇 개 테이블로 받았는지 파일명만 보고 구분할 수 있게(같은 묶음도 시각마다 파일명이 달라짐). */
        const zipNm = `sourcegen_template_${fnDownloadTs()}_${isOracle ? 'oracle' : 'postgresql'}_${domain.key}_${domain.files.length}.zip`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = zipNm;
        a.click();
        URL.revokeObjectURL(url);
        props.showToast(`${domain.label} 템플릿(${domain.files.length}개 테이블)을 다운로드했습니다.`, 'success');
        fnLogTemplateDownload(domain, zipNm);
      } catch (err) {
        props.showToast(err.message || '템플릿 다운로드 중 오류가 발생했습니다.', 'error', 0);
      } finally {
        uiState.templateDownloadingKey = '';
      }
    };

    /* onDownloadCurrentDdl — [현재정보다운로드](2026-08-30). 지금 편집 중인 DDL 탭 전체를
       [프로젝트업로드]가 그대로 다시 읽어들일 수 있는 .sql 텍스트로 내보낸다 — 저장 여부와
       무관하게(신규/미저장 상태에서도) 지금 화면 상태를 백업하거나 다른 프로젝트/환경으로
       옮기고 싶을 때 쓴다. 스키마·테이블·클래스명 등은 DDL 텍스트(COMMENT ON) 안에 이미 다
       담겨 있어(화면 상단 필드는 이걸 자동 추출한 값) ddlText 만 이어붙이면 충분히 왕복된다. */
    const onDownloadCurrentDdl = () => {
      if (!cfFilledTabs.value.length) { props.showToast('다운로드할 DDL 이 없습니다. 먼저 테이블을 입력해주세요.', 'error'); return; }
      const text = cfFilledTabs.value.map(t => (t.ddlText || '').trim()).filter(Boolean).join('\n\n');
      const nm = ((form.projectNm && form.projectNm.trim()) || 'sourcegen').replace(/[^\w가-힣.-]+/g, '_');
      const fileName = `${nm}_${fnDownloadTs()}.sql`;
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      props.showToast(`${cfFilledTabs.value.length}개 테이블의 DDL 을 다운로드했습니다.`, 'success');
    };

    /* fnLogTemplateDownload — 템플릿 ZIP 다운로드도 fnLogDownload 와 같은 md_sg_download_hist 에
       남긴다(2026-08-26) — 로그성 호출이라 실패해도 무시. 성공하면 모달 하단 이력 목록을 새로고침. */
    const fnLogTemplateDownload = (domain, zipNm) => {
      mdSgApiSvc.downloadHist.create({
        projectId: form.projectId || null,
        projectNm: `[템플릿] ${domain.label}`,
        basePackage: null,
        zipFileNm: zipNm,
        ddlCount: domain.files.length,
        fileCount: domain.files.length,
      }, '소스젠', 'ZIP다운로드').then(() => fnLoadTemplateDlHist(true)).catch(() => { /* 로그 실패는 무시 */ });
    };

    /* templateDlHist — 화면 최하단 [다운로드 이력] 패널에 보여줄 최근 다운로드 이력(공용 로그 최근 N건).
       프로젝트 열람 여부와 무관하게 페이지 진입 시 한 번 로드(onMounted). 소스 생성 결과 ZIP
       다운로드(fnLogDownload)와 템플릿 ZIP 다운로드(fnLogTemplateDownload)가 같은 md_sg_download_hist
       테이블을 쓰므로 둘 다 여기 섞여 보인다 — projectNm 에 "[템플릿] " 접두어로 구분. */
    const templateDlHist = ref([]);
    /* fnLoadTemplateDlHist — 2026-08-30: pageNo 고정 1건 조회 → templateDlHistPager 기반
       서버사이드 페이징으로 전환(이전엔 2페이지 이상을 볼 방법이 아예 없었다). */
    const fnLoadTemplateDlHist = async (resetPage) => {
      if (resetPage) templateDlHistPager.pageNo = 1;
      try {
        const res = await mdSgApiSvc.downloadHist.getPage(
          { pageNo: templateDlHistPager.pageNo, pageSize: templateDlHistPager.pageSize }, '소스젠', '다운로드이력조회');
        const d = res.data?.data || {};
        templateDlHist.value = d.pageList || [];
        templateDlHistPager.pageTotalCount = d.pageTotalCount || 0;
        templateDlHistPager.pageTotalPage = d.pageTotalPage || 1;
      } catch (err) { /* 조회 실패는 조용히 무시 — 목록이 비어 보일 뿐 모달 사용에 지장 없음 */ }
    };
    const onSetPageDlHist = (n) => { templateDlHistPager.pageNo = n; fnLoadTemplateDlHist(); };
    const onSizeChangeDlHist = () => { fnLoadTemplateDlHist(true); };

    /* histTabs — 화면 하단 [이력] 탭 정의 (생성 이력 / 생성결과 다운로드 이력 통합, 2026-08-28).
       탭 정의는 computed 금지 → reactive + getter 카운트 표준 패턴.
       2026-08-30 버그수정: genHists/templateDlHist 는 서버사이드 페이징 도입 이후 "현재 페이지에
       실린 행"만 담고 있어(pageSize=10), .length 를 쓰면 배지가 항상 페이지 크기(10) 근처로
       보였다("총 15건인데 배지는 10") — 전체 건수는 pager.pageTotalCount 에 있으므로 그걸 쓴다.
       페이징 있는 목록의 탭 배지는 항상 이 값을 참조할 것(정책서 sy.51 §Dtl 탭 뷰모드 참고). */
    const histTabs = reactive([
      { id: 'gen',      label: '생성 이력', icon: '📎', get count() { return genHistPager.pageTotalCount; } },
      { id: 'download', label: '생성결과 다운로드 이력', icon: '⬇', get count() { return templateDlHistPager.pageTotalCount; } },
    ]);

    /* ── 5) DDL 탭 편집 + 좌측 트리(subPackage 계층) ──
       2026-08-26: 상단 "탭1~탭10" 가로 탭을 폐기하고 좌측 트리로 바꿨다. 트리 레벨은 subPackage 를
       "."(dot) 로 나눈 경로 그대로 — 예) subPackage "ec.mb" → "ec" 폴더 아래 "mb" 폴더.
       탭 자체가 곧 트리의 리프(테이블) 노드이고, 폴더는 실체가 없는 "탭들의 subPackage 접두어 그룹"
       이라 폴더만 남기고 탭을 전부 지우면 그 폴더도 자연히 사라진다(별도 폴더 테이블 불필요). */
    const onSelectTab = (tabId) => { uiState.activeTabId = tabId; };

    /* cfTree — tabs(전체) 를 subPackage 경로로 묶은 트리. { path, name, children:[폴더], tabs:[리프] } */
    const cfTree = computed(() => fnBuildTree(tabs));

    /* cfTreeFlat — cfTree 를 화면에 그리기 좋은 평탄 배열로 펼친다(깊이 정보 포함, DFS 전위순회).
       실제 재귀 컴포넌트를 새로 안 만들고 v-for 한 번으로 트리를 그리기 위한 표준 패턴
       (BoGridCrud 의 flatRows 트리 모드와 동일 발상). 접힌(treeCollapsed) 폴더는 자식을 건너뛴다. */
    const cfTreeFlat = computed(() => fnFlattenTree(cfTree.value, uiState.treeCollapsed));

    /* fnEnsureNotEmpty — tabs 가 0개가 되는 상황(전부 삭제)을 막는 안전장치 — 항상 최소 1개 유지 */
    const fnEnsureNotEmpty = () => {
      if (!tabs.length) tabs.push(fnNewTab());
      if (!tabs.some(t => t.tabId === uiState.activeTabId)) uiState.activeTabId = tabs[0].tabId;
    };

    /* onAddTab — 폴더(path) 아래에 새 빈 테이블(탭) 1개 추가 후 선택 */
    const onAddTab = (parentPath) => {
      const t = fnNewTab({ subPackage: parentPath || '' });
      tabs.push(t);
      uiState.activeTabId = t.tabId;
    };
    /* onDeleteTab — 탭(테이블) 1개 삭제. 2026-08-30: 항목(리프)은 confirm 없이 바로 삭제하도록
       변경 — 폴더 삭제(여러 테이블이 한꺼번에 사라짐)와 달리 테이블 1개 삭제는 되돌리기 쉽고
       (다시 추가하면 그만) 매번 확인창을 띄우는 게 번거롭다는 요청. */
    const onDeleteTab = (tabId) => {
      const idx = tabs.findIndex(x => x.tabId === tabId);
      if (idx < 0) return;
      tabs.splice(idx, 1);
      fnEnsureNotEmpty();
    };
    /* onClearTab(현재탭 초기화)은 2026-08-30 버튼 제거와 함께 삭제 — 좌측 트리 툴바의
       [초기화](onClearAllTabs) 로 통합. */
    const onClearAllTabs = async () => {
      if (!await props.showConfirm('전체 초기화', '모든 DDL 탭과 생성 결과를 지우시겠습니까?')) return;
      tabs.splice(0, tabs.length, fnNewTab());
      uiState.activeTabId = tabs[0].tabId;
      uiState.activeFile = '';
    };

    /* ── 트리 폴더(=subPackage 경로) 관리: 생성/이름변경(레벨 추가·제거)/삭제 ── */
    const onTreeToggle = (path) => { uiState.treeCollapsed[path] = !uiState.treeCollapsed[path]; };
    const onAddFolderStart = (parentPath) => { uiState.treeNewFolderParent = parentPath; uiState.treeNewFolderText = ''; };
    const onAddFolderCancel = () => { uiState.treeNewFolderParent = null; uiState.treeNewFolderText = ''; };
    /* onAddFolderConfirm — 입력값에 "."을 포함하면 그만큼 depth 가 한 번에 생긴다(예: "ec.mb" 입력 → 2단계) */
    const onAddFolderConfirm = () => {
      const name = (uiState.treeNewFolderText || '').trim();
      if (!name) { props.showToast('폴더명을 입력해주세요.', 'error'); return; }
      const parent = uiState.treeNewFolderParent;
      const newPath = parent ? `${parent}.${name}` : name;
      onAddTab(newPath);
      uiState.treeNewFolderParent = null; uiState.treeNewFolderText = '';
    };
    const onRenameNodeStart = (path) => { uiState.treeRenamePath = path; uiState.treeRenameText = path.split('.').pop(); };
    const onRenameNodeCancel = () => { uiState.treeRenamePath = null; uiState.treeRenameText = ''; };
    /* onRenameNodeConfirm — 노드 이름(경로 마지막 조각)을 바꾼다. 새 이름에 "."을 넣으면 그만큼 하위
       레벨이 새로 생기고(깊이 추가), 부모 경로만 남기고 지우면 레벨이 하나 줄어든다(깊이 제거) —
       별도 "레벨 추가/제거" 버튼 없이 이름변경 하나로 다 처리(전체가 문자열 경로 편집이라 동일). */
    const onRenameNodeConfirm = () => {
      const oldPath = uiState.treeRenamePath;
      const name = (uiState.treeRenameText || '').trim();
      if (!name) { props.showToast('이름을 입력해주세요.', 'error'); return; }
      const parentPath = oldPath.includes('.') ? oldPath.slice(0, oldPath.lastIndexOf('.')) : '';
      const newPath = parentPath ? `${parentPath}.${name}` : name;
      if (newPath !== oldPath) {
        tabs.forEach(t => {
          const p = t.subPackage || '';
          if (p === oldPath) t.subPackage = newPath;
          else if (p.startsWith(oldPath + '.')) t.subPackage = newPath + p.slice(oldPath.length);
        });
      }
      uiState.treeRenamePath = null; uiState.treeRenameText = '';
    };
    /* onDeleteFolder — 2026-08-30: 폴더 안에 지워질 테이블(자식 노드)이 있을 때만 confirm.
       비어 있는 폴더(자식 없음)는 바로 삭제 — 잃을 내용이 없으므로 확인이 불필요하다. */
    const onDeleteFolder = async (path) => {
      const affected = tabs.filter(t => t.subPackage === path || (t.subPackage || '').startsWith(path + '.'));
      if (affected.length &&
        !await props.showConfirm('폴더 삭제', `[${path}] 폴더와 그 안의 테이블 ${affected.length}개를 모두 삭제하시겠습니까?`)) return;
      affected.forEach(t => { const i = tabs.indexOf(t); if (i >= 0) tabs.splice(i, 1); });
      fnEnsureNotEmpty();
    };

    /* ── 드래그 이동: 탭(테이블)을 다른 폴더로 옮기거나, 폴더째 다른 폴더 밑으로 옮긴다 ── */
    const onDragStartTab = (tabId) => { uiState.treeDragKind = 'tab'; uiState.treeDragTabId = tabId; uiState.treeDragFolderPath = null; };
    const onDragStartFolder = (path) => { uiState.treeDragKind = 'folder'; uiState.treeDragFolderPath = path; uiState.treeDragTabId = null; };
    const onDragEnd = () => { uiState.treeDragKind = null; uiState.treeDragTabId = null; uiState.treeDragFolderPath = null; };
    /* onDropOnFolder — targetPath === '' 이면 최상위(루트)로 이동 */
    const onDropOnFolder = (targetPath) => {
      if (uiState.treeDragKind === 'tab') {
        const t = tabs.find(x => x.tabId === uiState.treeDragTabId);
        if (t) t.subPackage = targetPath;
      } else if (uiState.treeDragKind === 'folder') {
        const srcPath = uiState.treeDragFolderPath;
        if (srcPath && srcPath !== targetPath && targetPath !== srcPath && !targetPath.startsWith(srcPath + '.')) {
          const name = srcPath.split('.').pop();
          const newPath = targetPath ? `${targetPath}.${name}` : name;
          tabs.forEach(t => {
            const p = t.subPackage || '';
            if (p === srcPath) t.subPackage = newPath;
            else if (p.startsWith(srcPath + '.')) t.subPackage = newPath + p.slice(srcPath.length);
          });
        }
      }
      onDragEnd();
    };

    /* ── 6) 소스 생성 — 브라우저에서 전 탭 일괄 생성 ──
       [소스 생성] 버튼은 바로 생성하지 않고 언어/스택 선택 팝오버를 먼저 띄운다(2026-08-26).
       체크한 스택 prefix 로 gnGenerate 결과를 걸러내 정말 필요한 파일만 남긴다. */
    const onOpenStackPop = () => { uiState.stackPopOpen = true; };
    const onCloseStackPop = () => { uiState.stackPopOpen = false; };
    const onToggleStack = (prefix) => {
      const i = selectedStacks.indexOf(prefix);
      if (i >= 0) selectedStacks.splice(i, 1); else selectedStacks.push(prefix);
      try { localStorage.setItem(SG_STACK_STORAGE_KEY, JSON.stringify(selectedStacks)); } catch (e) { /* 저장 실패 무시 */ }
    };
    const fnStackVersion = (prefix) => stackVersions[prefix] || 'v1';
    const onChangeVersion = (prefix, version) => {
      stackVersions[prefix] = version;
      try { localStorage.setItem(SG_STACK_VERSION_STORAGE_KEY, JSON.stringify(stackVersions)); } catch (e) { /* 저장 실패 무시 */ }
    };
    const onGenerateConfirmed = () => { uiState.stackPopOpen = false; onGenerate(); };

    const onGenerate = async () => {
      if (typeof gnParseDdl !== 'function' || typeof gnGenerate !== 'function') {
        props.showToast('생성 엔진(assets/md/sg/sourcegen/*.js)이 로드되지 않았습니다.', 'error', 0);
        return;
      }
      if (!cfFilledTabs.value.length) { props.showToast('DDL 을 먼저 입력해주세요.', 'error'); return; }
      if (!selectedStacks.length) { props.showToast('생성할 언어/스택을 하나 이상 선택해주세요.', 'error'); return; }
      uiState.generating = true;
      try {
        const dbType = form.dbTypeCd === 'ORACLE' ? 'oracle' : 'postgresql';
        let okCount = 0;
        tabs.forEach(t => {
          t.error = '';
          const raw = (t.ddlText || '').trim();
          if (!raw) { t.files = {}; t.generatedAt = ''; return; }
          try {
            const meta = gnParseDdl(raw, dbType);
            const opts = {
              basePackage: fnEffectivePkg(form.basePackage, t.subPackage),
              className: t.classNm || undefined,
              endpoint: t.endpoint || undefined,
              tag: t.swaggerTag || undefined,
              rawDdl: raw,
            };
            const generated = gnGenerate(meta, opts);
            /* 선택한 스택 prefix 로만 필터링 — 체크 안 한 언어/프레임워크 파일은 결과에서 제외 */
            t.files = Object.fromEntries(
              Object.entries(generated).filter(([fn]) => selectedStacks.some(p => fn.startsWith(p)))
            );
            t.generatedAt = new Date().toLocaleString('ko-KR');
            okCount++;
          } catch (e) {
            t.files = {};
            t.error = e.message || 'DDL 파싱에 실패했습니다.';
          }
        });
        /* 생성 직후엔 "전체"(root) 범위로 열어서 방금 생성된 모든 테이블의 결과를 한눈에 보게 한다 */
        uiState.resultScopeKind = 'root';
        const firstEntry = cfScopeFileEntries.value[0];
        uiState.activeFile = firstEntry ? firstEntry.key : '';
        fnHighlight();
        const failed = tabs.filter(t => t.error).length;

        /* 정상 생성(okCount>0) 시 결과를 [생성 이력]에 자동 보관.
           2026-08-30: 신규(미저장, projectId 없음) 프로젝트도 [저장]을 먼저 누르지 않아도
           fnAutoCreateProject 로 조용히 자동 저장한 뒤 보관한다(예전엔 이미 저장된 프로젝트만
           가능 — [저장] 을 눌러야만 이력이 남았음).
           보관 자체가 실패해도 생성은 이미 끝났으므로 되돌리지 않고 안내만 한다. */
        let archived = false;
        if (okCount) {
          try {
            const projectId = form.projectId || await fnAutoCreateProject();
            await fnArchiveZip(projectId, uiState.genMemo);
            uiState.genMemo = '';
            await fnLoadGenHists(projectId, true); // 방금 생긴 이력은 항상 1페이지 맨 위 — 1페이지로 되돌려서 바로 보이게
            archived = true;
          } catch (e) {
            props.showToast('생성은 완료됐지만 이력 보관에 실패했습니다: ' + coUtil.cofErrMsg(e, ''), 'error', 0);
          }
        }

        props.showToast(
          failed ? `${okCount}개 탭 생성 완료 (실패 ${failed}개 — 탭별 오류 메시지 확인)`
                 : `${okCount}개 탭, 총 ${cfTotalFileCount.value}개 파일을 생성했습니다.` + (archived ? ' (이력에 보관됨)' : ''),
          failed ? 'info' : 'success');
      } catch (err) {
        props.showToast(err.message || '소스 생성 중 오류가 발생했습니다.', 'error', 0);
      } finally {
        uiState.generating = false;
      }
    };

    /* ── 7) 결과 뷰어 — 좌측 트리에서 범위(전체/폴더/테이블) 선택 ── */
    const onSelectResultScope = (kind, payload) => {
      uiState.resultScopeKind = kind;
      if (kind === 'folder') uiState.resultScopePath = payload;
      if (kind === 'tab') uiState.resultTabId = payload;
      const firstEntry = cfScopeFileEntries.value[0];
      uiState.activeFile = firstEntry ? firstEntry.key : '';
      fnHighlight();
    };
    const onResultTreeToggle = (path) => { uiState.resultTreeCollapsed[path] = !uiState.resultTreeCollapsed[path]; };
    const onGenFileTreeToggle = (path) => { uiState.genFileTreeCollapsed[path] = !uiState.genFileTreeCollapsed[path]; };
    const onSelectFile = (key) => { uiState.activeFile = key; fnHighlight(); };
    const onCopyCode = async () => {
      const code = cfActiveEntry.value?.content || '';
      try {
        await navigator.clipboard.writeText(code);
        uiState.copied = true;
        setTimeout(() => { uiState.copied = false; }, 1500);
      } catch (e) {
        props.showToast('클립보드 복사에 실패했습니다.', 'error');
      }
    };
    const onDownloadFile = () => {
      const entry = cfActiveEntry.value;
      if (!entry) return;
      const blob = new Blob([entry.content || ''], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = entry.fn.split('/').pop();
      a.click();
      URL.revokeObjectURL(url);
    };

    /* fnBuildZipBlob — 전 탭 생성 결과를 ZIP Blob 으로 묶는다(다운로드/DB첨부 공용).
       탭마다 Sub Package 가 다를 수 있어 pkgPath 도 탭별로 계산한다(2026-08-26). */
    const fnBuildZipBlob = async () => {
      if (typeof JSZip !== 'function') throw new Error('JSZip 이 로드되지 않았습니다.');
      const zip = new JSZip();
      tabs.forEach(t => {
        const pkgPath = fnEffectivePkg(form.basePackage, t.subPackage).replace(/\./g, '/');
        Object.entries(t.files).forEach(([fn, content]) => {
          zip.file(fnZipPath(fn, pkgPath), content);
        });
      });
      return zip.generateAsync({ type: 'blob' });
    };

    /* fnZipName — "sourcegen_프로젝트명_yyyyMMdd_HHmmss.zip" */
    /* fnZipName — 2026-08-30: 예전엔 "sourcegen_{프로젝트명}_{현재시각}.zip" 이었는데, 프로젝트명이
       자동생성 규칙(fnFillAutoName)으로 이미 "테이블명_YYYYMMDD_hhmm" 처럼 타임스탬프를 포함하고
       있어 뒤에 또 현재시각이 붙으면 "sourcegen_sy_alarm_20260830_0801_20260830_085238.zip" 처럼
       시각이 두 번 겹쳐 보였다("id20260830_cre20260830_085238" 형태로 정리해달라는 요청) — 사람이
       바꿀 수 있는 프로젝트명 대신 불변인 projectId 를 쓰고, 시각 앞에 cre(생성시각)를 붙인다.
       projectId 가 없는(저장 전 신규) 프로젝트는 id 부분 자체를 생략한다. */
    const fnZipName = () => {
      const d = new Date();
      const p = n => String(n).padStart(2, '0');
      const ts = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
      const idPart = form.projectId ? `id${form.projectId}_` : '';
      return `sourcegen_${idPart}cre${ts}.zip`;
    };

    const onDownloadZip = async () => {
      if (!cfTotalFileCount.value) { props.showToast('먼저 [생성] 을 실행해주세요.', 'error'); return; }
      try {
        const blob = await fnBuildZipBlob();
        const zipName = fnZipName();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = zipName;
        a.click();
        URL.revokeObjectURL(url);
        fnLogDownload(zipName, blob);
      } catch (err) {
        props.showToast(err.message || 'ZIP 생성 중 오류가 발생했습니다.', 'error', 0);
      }
    };

    /* fnLogDownload — [⬇ ZIP 다운로드] 클릭 기록(다운로드이력관리 화면용, 2026-08-26).
       2026-08-30: 로그만 남기던 것에서 ZIP 도 공통 업로드 API 로 함께 올려 attachId/zipUrl 을
       같이 저장 — 이 이력 그리드에서도 재다운로드가 가능해진다(genHist 와 같은 방식).
       업로드까지 실패해도 다운로드 자체는 이미 끝났으니 그냥 로그만(파일 없이) 남긴다.
       로그성 호출 — 실패해도 방금 끝난 다운로드 자체에는 영향 주지 않는다(await 없이 fire-and-forget). */
    const fnLogDownload = async (zipName, blob) => {
      let attachId = null, zipUrl = null;
      try {
        const fd = new FormData();
        fd.append('files', blob, zipName);
        fd.append('businessCode', 'md_sg_gen');
        const upRes = await coApiSvc.cmUpload.uploadMulti(fd, '소스젠', 'ZIP다운로드업로드');
        const uploaded = (upRes.data?.data?.files || [])[0];
        if (uploaded) { attachId = uploaded.attachId || null; zipUrl = uploaded.cdnImgUrl || uploaded.attachUrl || null; }
      } catch (e) { /* 업로드 실패해도 로그는 남긴다(재다운로드만 안 될 뿐) */ }
      mdSgApiSvc.downloadHist.create({
        projectId: form.projectId || null,
        projectNm: form.projectNm || null,
        basePackage: form.basePackage || null,
        zipFileNm: zipName,
        ddlCount: cfFilledTabs.value.length,
        fileCount: cfTotalFileCount.value,
        attachId, zipUrl,
        selectedStacks: fnSelectedStacksLabel() || null,
        genMemo: uiState.genMemo || null,
      }, '소스젠', 'ZIP다운로드').then(() => fnLoadTemplateDlHist(true)).catch(() => { /* 로그 실패는 무시 — 다운로드 자체는 이미 완료됨 */ });
    };

    /* ── 8) 생성 결과를 DB 에 첨부로 보관 ──
       ZIP 을 공통 업로드 API(/co/cm/upload/multi)로 올려 sy_attach 에 적재하고,
       받은 attachId/URL 을 md_sg_sourcegen_hist 에 이력으로 남긴다. */
    /* fnBuildDdlSnapshot — 이 생성 시점의 DDL 탭 입력값(JSON)을 만든다. 생성된 소스 자체(파일 텍스트)는
       탭 경계가 사라진 ZIP 하나로만 합쳐져 있어 그대로 복원할 수 없다 — 대신 "재생성 가능한 입력값"만
       스냅샷으로 남기고, [불러오기] 는 에디터에 이 입력을 되돌린 뒤 사용자가 다시 [소스 생성] 하는 방식
       (엔진이 최신화돼도 항상 최신 규칙으로 재생성됨, 2026-08-26). */
    const fnBuildDdlSnapshot = () => JSON.stringify({
      basePackage: form.basePackage || '',
      dbTypeCd: form.dbTypeCd || '',
      tabs: cfFilledTabs.value.map(t => ({
        tabNo: t.tabNo, ddlText: t.ddlText, schemaNm: t.schemaNm, tableNm: t.tableNm,
        classNm: t.classNm, endpoint: t.endpoint, swaggerTag: t.swaggerTag, subPackage: t.subPackage,
      })),
    });

    /* fnSelectedStacksLabel — 이번 생성에 고른 언어/스택(selectedStacks, prefix 배열)을
       사람이 읽는 라벨로 바꿔 콤마로 이어붙인다(2026-08-30, 생성 이력 그리드 표시용).
       SG_FILE_GROUPS 의 title 을 그대로 쓴다 — 팝오버 체크리스트 항목 이름과 항상 일치.
       각 항목 뒤에 그 시점 버전(fnStackVersion, 팝오버에서 고른 v1/v2...)도 같이 남긴다 —
       나중에 이 이력을 볼 때 "그때 어떤 버전으로 생성했는지"까지 알 수 있어야 하므로. */
    const fnSelectedStacksLabel = () => selectedStacks
      .map(p => (SG_FILE_GROUPS.find(g => g.prefix === p)?.title || p) + ' ' + fnStackVersion(p))
      .join(', ');

    /* fnParseSelectedStacksLabel — fnSelectedStacksLabel 의 역변환(2026-08-30, [불러오기] 시
       "생성 결과"까지 자동 재생성하기 위함). "Backend (JPA) v1, Vue3 CDN (standalone) v1" 형태를
       SG_FILE_GROUPS 항목(prefix)+버전 배열로 되돌린다. 생성 결과 파일 자체는 ZIP 으로만 보관돼
       있어 개별 파일 단위로 직접 복원할 수 없으므로(다중 테이블/스택이 하나의 폴더 구조로 합쳐져
       역매핑이 불가) 유일한 방법은 "그 시점과 같은 스택 선택으로 다시 생성"하는 것 — 라벨을 못
       읽으면(과거 이력 등) 빈 배열을 돌려주고 호출부가 기존처럼 수동 생성으로 폴백한다. */
    const fnParseSelectedStacksLabel = (label) => {
      if (!label) return [];
      return label.split(',').map(s => s.trim()).filter(Boolean).map(part => {
        const m = part.match(/^(.*)\s+(v\d+)$/);
        const grp = SG_FILE_GROUPS.find(g => g.title === (m ? m[1] : part));
        return grp ? { prefix: grp.prefix, version: m ? m[2] : 'v1' } : null;
      }).filter(Boolean);
    };

    /* fnAutoCreateProject — [소스 생성] 시점에 아직 저장 전(신규, projectId 없음)이어도 생성
       이력을 남길 수 있도록 프로젝트를 조용히 자동 생성한다(2026-08-30, "저장 안 해도 소스생성
       되고 이력에 표시되면 좋겠다" 요청). genHist.create/downloadHist 는 projectId 에 매달리는
       구조라 신규 상태로는 이력을 남길 수 없었던 제약을 해소.
       onSave 와 달리 [저장] 버튼을 직접 누른 게 아니므로 showConfirm 없이 자동 진행한다 —
       "처리 버튼은 confirm 필수" 정책은 사용자가 명시적으로 누르는 저장/삭제류 버튼 대상이고,
       이건 [소스 생성] 클릭의 부수 효과(파일 생성이 이미 그 자체로 결과를 만드는 동작)일 뿐이다.
       DDL 행도 함께 저장해 이후 프로젝트 목록에서 재진입해도 DDL 탭이 비어 보이지 않게 한다.
       실패하면 throw(호출부인 onGenerate 가 "이력 보관 실패" 로 안내). */
    const fnAutoCreateProject = async () => {
      fnFillAutoName();
      if (!form.projectNm || !form.projectNm.trim()) form.projectNm = 'sourcegen' + fnTsSuffix();
      const body = {
        projectNm: form.projectNm, projectDesc: form.projectDesc,
        basePackage: form.basePackage, dbTypeCd: form.dbTypeCd,
        thumbnailUrl: form.thumbnailUrl || null, thumbnailAttachId: form.thumbnailAttachId || null,
      };
      const res = await mdSgApiSvc.project.create(body, '소스젠', '자동등록');
      const projectId = res.data?.data?.projectId;
      form.projectId = projectId;
      history.replaceState(null, '', 'fo-md-sg-sourcegen.html?view=editor&projectId=' + encodeURIComponent(projectId));
      const rows = cfFilledTabs.value.map((t, i) => ({
        tabNo: i + 1, ddlText: t.ddlText, schemaNm: t.schemaNm, tableNm: t.tableNm,
        classNm: t.classNm, endpoint: t.endpoint, swaggerTag: t.swaggerTag, subPackage: t.subPackage || null,
        sortOrd: i, useYn: 'Y',
      }));
      await mdSgApiSvc.ddl.saveList(projectId, rows, '소스젠', 'DDL저장');
      return projectId;
    };

    /* fnArchiveZip — 생성 결과를 ZIP 으로 묶어 업로드하고 이력 1건을 남긴다.
       [소스 생성] 직후 자동 보관과 [저장](신규 프로젝트 최초 저장) 시 자동 보관이 함께 쓴다
       (2026-08-30: 수동 [생성결과 보관] 버튼은 제거 — 소스 생성 시 이미 자동으로 보관되어 불필요).
       실패하면 throw 한다(호출부에서 처리). */
    const fnArchiveZip = async (projectId, memo) => {
      const blob = await fnBuildZipBlob();
      const zipNm = fnZipName();
      const fd = new FormData();
      fd.append('files', blob, zipNm);
      fd.append('businessCode', 'md_sg_gen');
      const upRes = await coApiSvc.cmUpload.uploadMulti(fd, '소스젠', '생성결과업로드');
      const uploaded = (upRes.data?.data?.files || [])[0];
      if (!uploaded) throw new Error('업로드 결과를 받지 못했습니다.');

      await mdSgApiSvc.genHist.create(projectId, {
        ddlCount: cfFilledTabs.value.length,
        fileCount: cfTotalFileCount.value,
        attachId: uploaded.attachId || null,
        zipFileNm: zipNm,
        zipFileSize: blob.size,
        zipUrl: uploaded.cdnImgUrl || uploaded.attachUrl || null,
        genMemo: memo || null,
        ddlSnapshotJson: fnBuildDdlSnapshot(),
        selectedStacks: fnSelectedStacksLabel() || null,
      }, '소스젠', '생성이력등록');
    };

    /* onLoadSnapshot — [생성결과 보관 이력]의 [불러오기]. 그 시점의 DDL 탭 입력값을 에디터로 복원한다.
       2026-08-30: row.selectedStacks(그 시점 선택 언어/스택 라벨)를 읽을 수 있으면 복원 직후 같은
       스택 선택으로 [소스 생성]까지 자동 실행해 "생성 결과"도 같이 복원한다("생성 결과 정보도
       불러올 수 있어?" 요청 — 생성된 소스 파일 자체는 ZIP 으로만 보관돼 있어 파일 단위 복원은
       불가능하고, 같은 조건으로 다시 생성하는 것이 유일한 방법). 라벨을 못 읽으면(과거 이력 등)
       기존처럼 DDL만 복원하고 사용자가 직접 [소스 생성]을 눌러야 한다. */
    const onLoadSnapshot = async (row) => {
      if (!row.ddlSnapshotJson) { props.showToast('이 이력에는 불러올 DDL 스냅샷이 없습니다.', 'error'); return; }
      let snap;
      try { snap = JSON.parse(row.ddlSnapshotJson); } catch (e) { props.showToast('스냅샷 데이터를 읽을 수 없습니다.', 'error'); return; }
      const parsedStacks = fnParseSelectedStacksLabel(row.selectedStacks);
      if (!await props.showConfirm('생성결과 불러오기',
        `${coUtil.cofYmdHm(row.genDate) || ''} 생성 시점의 DDL 탭 입력값으로 되돌리시겠습니까?` +
        (parsedStacks.length
          ? '\n(현재 편집 중인 DDL 탭 내용은 덮어써지고, 그 시점 선택 언어/스택으로 자동 재생성됩니다)'
          : '\n(현재 편집 중인 DDL 탭 내용은 덮어써집니다 — 다시 생성하려면 [소스 생성]을 눌러주세요)'))) return;
      if (snap.basePackage) form.basePackage = snap.basePackage;
      if (snap.dbTypeCd) form.dbTypeCd = snap.dbTypeCd;
      const restored = (snap.tabs || []).map(s => fnNewTab({
        tabNo: s.tabNo || 0, ddlText: s.ddlText || '', schemaNm: s.schemaNm || '', tableNm: s.tableNm || '',
        classNm: s.classNm || '', endpoint: s.endpoint || '', swaggerTag: s.swaggerTag || '', subPackage: s.subPackage || '',
      }));
      tabs.splice(0, tabs.length, ...(restored.length ? restored : [fnNewTab()]));
      uiState.activeTabId = tabs[0].tabId;
      uiState.activeFile = '';
      if (cfReadonly.value) uiState.dtlMode = 'edit';
      if (parsedStacks.length) {
        selectedStacks.splice(0, selectedStacks.length, ...parsedStacks.map(p => p.prefix));
        parsedStacks.forEach(p => { stackVersions[p.prefix] = p.version; });
        await onGenerate(); // 자체 성공/실패 토스트를 띄우므로 별도 안내 불필요
      } else {
        props.showToast('DDL 탭을 불러왔습니다. [소스 생성]을 눌러 다시 생성해주세요.', 'success');
      }
    };

    /* onDownloadGenHistZip — 생성 이력 그리드 [다운로드] 클릭(2026-08-30). 실제 파일 열기는
       카운트 증가 요청과 무관하게 바로 진행(증가 API 가 느리거나 실패해도 다운로드는 막지
       않는다) — row.downloadCount 는 서버가 돌려준 최신값으로 낙관적 갱신한다.
       이 재다운로드도 "다운로드 이벤트"이므로 [생성결과 다운로드 이력] 에도 1건 남긴다 —
       파일을 다시 올릴 필요 없이 이 이력이 이미 갖고 있는 attachId/zipUrl 을 그대로 복사한다
       (2026-08-30 — 기존엔 상단 [ZIP 다운로드] 클릭만 로그에 남고 여기서 다시 받으면 로그가
       안 늘어 "4번 눌렀는데 이력이 그대로"였다). */
    const onDownloadGenHistZip = async (row) => {
      window.open(row.zipUrl, '_blank');
      try {
        const res = await mdSgApiSvc.genHist.incrementDownload(row.sourcegenHistId, '소스젠', '재다운로드');
        row.downloadCount = res.data?.data ?? ((row.downloadCount || 0) + 1);
      } catch (e) { /* 카운트 실패는 무시 — 다운로드 자체는 이미 열림 */ }
      try {
        await mdSgApiSvc.downloadHist.create({
          projectId: form.projectId || null,
          projectNm: form.projectNm || null,
          basePackage: form.basePackage || null,
          zipFileNm: row.zipFileNm,
          ddlCount: row.ddlCount,
          fileCount: row.fileCount,
          attachId: row.attachId || null,
          zipUrl: row.zipUrl || null,
          selectedStacks: row.selectedStacks || null,
          genMemo: row.genMemo || null,
        }, '소스젠', '생성이력재다운로드');
        await fnLoadTemplateDlHist(true);
      } catch (e) { /* 로그 실패는 무시 — 다운로드 자체는 이미 열림 */ }
    };

    const onDeleteGenHist = async (h) => {
      if (!await props.showConfirm('이력 삭제', `${h.zipFileNm} 이력을 삭제하시겠습니까?`)) return;
      try {
        await mdSgApiSvc.genHist.remove(h.sourcegenHistId, '소스젠', '생성이력삭제');
        await fnLoadGenHists(form.projectId);
        props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        props.showToast(coUtil.cofErrMsg(err, '삭제 중 오류가 발생했습니다.'), 'error', 0);
      }
    };

    /* ── 9) 프로젝트 저장/삭제 ── */
    const onSave = async () => {
      /* 소스젠명 미입력 → "테이블명_YYYYMMDD_hhmm" 으로 자동 부여 (첫 DDL 탭의 테이블명 기준) */
      fnFillAutoName();
      if (!form.projectNm || !form.projectNm.trim()) form.projectNm = 'sourcegen' + fnTsSuffix();
      if (!await props.showConfirm('저장', '프로젝트와 DDL 탭을 저장하시겠습니까?')) return;
      uiState.loading = true;
      try {
        /* 대표이미지 미첨부 + [DDL로 자동생성] 체크 → DDL 정보로 카드 이미지를 만들어 채운다 */
        if (!form.thumbnailUrl && uiState.autoThumb) await fnAutoThumbFromDdl();
        const body = {
          projectNm: form.projectNm, projectDesc: form.projectDesc,
          basePackage: form.basePackage, dbTypeCd: form.dbTypeCd,
          thumbnailUrl: form.thumbnailUrl || null, thumbnailAttachId: form.thumbnailAttachId || null,
        };
        let projectId = form.projectId;
        if (!projectId) {
          const res = await mdSgApiSvc.project.create(body, '소스젠', '등록');
          projectId = res.data?.data?.projectId;
          form.projectId = projectId;
          history.replaceState(null, '', 'fo-md-sg-sourcegen.html?view=editor&projectId=' + encodeURIComponent(projectId));
        } else {
          await mdSgApiSvc.project.update(projectId, body, '소스젠', '수정');
        }
        /* DDL 탭 — 입력된 탭만 전체 교체 저장 */
        const rows = cfFilledTabs.value.map((t, i) => ({
          tabNo: i + 1, ddlText: t.ddlText, schemaNm: t.schemaNm, tableNm: t.tableNm,
          classNm: t.classNm, endpoint: t.endpoint, swaggerTag: t.swaggerTag, subPackage: t.subPackage || null,
          sortOrd: i, useYn: 'Y',
        }));
        await mdSgApiSvc.ddl.saveList(projectId, rows, '소스젠', 'DDL저장');

        /* 생성 결과가 있으면 [저장]할 때마다 이력에도 자동 보관한다.
           이력 보관이 실패해도 프로젝트 저장 자체는 이미 성공했으므로 되돌리지 않고 안내만 한다. */
        let archived = false;
        if (cfTotalFileCount.value) {
          try {
            await fnArchiveZip(projectId, uiState.genMemo);
            uiState.genMemo = '';
            await fnLoadGenHists(projectId, true);
            archived = true;
          } catch (e) {
            props.showToast('저장은 완료됐지만 생성결과 보관에 실패했습니다: '
              + (coUtil.cofErrMsg(e, '')), 'info', 0);
          }
        }
        props.showToast(archived
          ? `저장되었습니다. (생성결과 ${cfTotalFileCount.value}개 파일도 이력에 보관)`
          : '저장되었습니다.', 'success');
      } catch (err) {
        props.showToast(coUtil.cofErrMsg(err, '저장 중 오류가 발생했습니다.'), 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    const onDeleteProject = async () => {
      if (!form.projectId) return;
      if (!await props.showConfirm('삭제', `${form.projectNm} 프로젝트를 삭제하시겠습니까? (DDL 탭·생성 이력도 함께 삭제됩니다)`)) return;
      try {
        await mdSgApiSvc.project.remove(form.projectId, '소스젠', '삭제');
        onBackToList();
      } catch (err) {
        props.showToast(coUtil.cofErrMsg(err, '삭제 중 오류가 발생했습니다.'), 'error', 0);
      }
    };

    /* ── 10) 진입 ── */
    onMounted(async () => {
      const qs = new URLSearchParams(location.search);
      const openId = qs.get('projectId');
      if (openId) await fnLoadProject(openId);
      fnLoadTemplateDlHist();  // 화면 최하단 [다운로드 이력] — 프로젝트 무관 전역 로그
    });

    return {
      uiState, form, tabs, genHists, genHistGridColumns, genHistPager, onSetPageGenHist, onSizeChangeGenHist,
      templateDlHistPager, onSetPageDlHist, onSizeChangeDlHist,
      cfReadonly, cfShowZipDownload, cfIsNew, cfCurTab, cfTotalFileCount, cfFilledTabs,
      cfResultTabs, cfGenFileTreeFlat, cfGenFileCount, onGenFileTreeToggle, cfTree, cfTreeFlat,
      cfResultTreeFlat, cfResultScopeLabel, cfActiveEntry, cfScopeFileEntries, cfResultScopeGeneratedAt, cfResultScopeTabsCount,
      fnLangOf,
      SG_SAMPLE_GROUPS, onLoadSample, onSampleSelectChange, codeBoxRef, ddlCodeBoxRef, thumbInputRef,
      onOpenThumbPicker, onThumbFileChange, onRemoveThumb,
      onDdlInput, onDdlScroll, onBackToList, onNewProject, onSwitchToEdit, onCancelEdit,
      SG_TEMPLATE_DOMAINS, onTemplateModalOpen, onTemplateModalClose, onTemplateDbTab, onDownloadTemplate, onDownloadCurrentDdl,
      templateDlHist, templateDlHistGridColumns, histTabs,
      onProjectUploadStart, onProjectUploadDbPick, onProjectUploadFile, onOpenUploadPicker, uploadFileInputRef,
      onSelectTab, onClearAllTabs, onGenerate,
      onAddTab, onDeleteTab, onTreeToggle,
      onAddFolderStart, onAddFolderCancel, onAddFolderConfirm,
      onRenameNodeStart, onRenameNodeCancel, onRenameNodeConfirm, onDeleteFolder,
      onDragStartTab, onDragStartFolder, onDragEnd, onDropOnFolder,
      SG_STACK_SECTIONS, selectedStacks, onOpenStackPop, onCloseStackPop, onToggleStack, onGenerateConfirmed,
      SG_STACK_VERSION_OPTIONS, stackVersions, fnStackVersion, onChangeVersion,
      onSelectResultScope, onResultTreeToggle, onSelectFile, onCopyCode, onDownloadFile, onDownloadZip,
      onDeleteGenHist, onSave, onDeleteProject,
    };
  },
  template: /* html */`
<div class="sg-page">
  <div class="sg-hero">
    <div class="sg-hero-eyebrow">SOURCE GENERATOR</div>
    <h1 class="sg-hero-title">
      ⚙️ {{ cfIsNew ? '새 소스젠 프로젝트' : (cfReadonly ? '프로젝트 상세보기' : '프로젝트 편집') }}
      <span v-if="form.projectId" class="sg-detail-id">#{{ form.projectId }}</span>
    </h1>
    <div class="sg-hero-sub">
      {{ cfIsNew ? 'DDL 을 넣고 [생성] 을 누르면 20여 개 스택의 소스가 한 번에 만들어집니다'
        : (cfReadonly ? '저장된 프로젝트입니다. 수정하려면 아래 [수정] 버튼을 눌러주세요' : 'DDL 탭을 편집하고 [생성] 으로 결과를 확인하세요') }}
    </div>
  </div>

  <div class="sg-detail-head">
    <button class="btn btn_list sg-back-btn" @click="onBackToList">← 목록으로</button>
    <button class="btn btn_new sg-back-btn" @click="onNewProject" style="margin-left:auto;">+ 신규 프로젝트</button>
  </div>

  <!-- ═══ 프로젝트 기본정보 ═══ -->
  <div class="sg-panel">
    <div class="sg-opts">
      <div class="sg-opt-row"><label>대표이미지</label>
        <div class="sg-thumb-wrap">
          <div class="sg-thumb-box" :class="{ 'sg-locked': cfReadonly }" @click="onOpenThumbPicker"
            title="목록에 표시될 이미지 — 비워두면 저장 시 DDL 정보로 자동 생성됩니다">
            <img v-if="form.thumbnailUrl" :src="form.thumbnailUrl" class="sg-thumb-img" />
            <span v-else class="sg-thumb-ph">{{ uiState.thumbUploading ? '⏳' : '＋' }}</span>
            <span v-if="form.thumbnailUrl && !cfReadonly" class="sg-thumb-del" @click.stop="onRemoveThumb" title="제거">✕</span>
          </div>
          <input ref="thumbInputRef" type="file" accept="image/*" style="display:none" @change="onThumbFileChange" />
          <label v-if="!cfReadonly" class="sg-thumb-chk"
            title="첨부한 이미지가 없으면 저장할 때 DDL 요약 카드를 자동으로 만들어 대표이미지로 씁니다">
            <input type="checkbox" v-model="uiState.autoThumb" /> DDL 자동생성
          </label>
        </div></div>
      <div class="sg-opt-row"><label>프로젝트명</label>
        <input v-model="form.projectNm" :readonly="cfReadonly" placeholder="비우면 테이블명_날짜시각 자동" class="sg-in-nm" /></div>
      <div class="sg-opt-row"><label>Base Package</label>
        <input v-model="form.basePackage" :readonly="cfReadonly" placeholder="com.exam.app" class="sg-in-pkg sg-mono" /></div>
      <div class="sg-opt-row"><label>DB 유형</label>
        <select v-model="form.dbTypeCd" :disabled="cfReadonly" class="sg-in-db">
          <option value="POSTGRESQL">PostgreSQL</option>
          <option value="ORACLE">Oracle</option>
        </select></div>
    </div>
    <div class="sg-opt-row sg-desc-row"><label>설명</label>
      <textarea v-model="form.projectDesc" :readonly="cfReadonly" rows="2"
        placeholder="설명(선택)" class="sg-desc-ta"></textarea></div>
  </div>

  <!-- ═══ DDL 탭 ═══ -->
  <div class="sg-panel">
    <!-- 2026-08-30: 패널 제목을 항상 "목록" 고정 표기하지 않고, cfIsNew/cfReadonly 상태에 맞춰
         소스젠 신규(등록 전)/소스젠 상세(보기모드)/소스젠 편집(수정모드)으로 구분 표시 -->
    <div class="sg-panel-title">{{ cfIsNew ? '소스젠 신규' : (cfReadonly ? '소스젠 상세' : '소스젠 편집') }} (DDL 입력) <span class="sg-panel-sub">(좌측 트리에서 테이블 선택. 입력하면 스키마·테이블·클래스명이 자동 추출됩니다)</span>
      <span style="margin-left:auto;display:flex;gap:6px;align-items:center;">
        <!-- 2026-08-30: [현재탭 초기화]/[전체 초기화] 버튼 제거(좌측 트리 툴바의 [초기화] 버튼과
             중복 — 그쪽이 전체 초기화를 이미 담당). 예제 DDL(버튼 그리드 → select 트리)만 유지.
             select 는 optgroup(DB 유형)으로 트리처럼 묶고, 값을 고르는 즉시 그 예제로 새 탭을
             추가한 뒤 다시 placeholder 로 되돌린다(값 자체를 기억할 필요 없는 "실행형" 선택이라
             select 상태를 유지하지 않음). -->
        <!-- 2026-08-30: 템플릿다운로드/현재정보다운로드/프로젝트업로드도 편집모드 전용으로
             통일 — 보기모드는 조회만 하는 화면이라 이 3개(전부 DDL 을 "바꾸는" 도구)는 필요 없다. -->
        <template v-if="!cfReadonly">
          <select class="form-control sg-sample-select" style="width:auto;max-width:220px;"
            :value="''" @change="onSampleSelectChange($event)" title="예제 DDL — 선택하면 새 탭이 추가됩니다(빈 탭이면 그 자리를 채움)">
            <option value="" disabled>예제 DDL 선택…</option>
            <optgroup v-for="grp in SG_SAMPLE_GROUPS" :key="grp.db" :label="grp.dbLabel">
              <option v-for="s in grp.items" :key="grp.db + '::' + s.key" :value="grp.db + '::' + s.key">
                {{ s.label }} — {{ s.desc }}
              </option>
            </optgroup>
          </select>
          <button type="button" class="sg-btn sg-btn-accent" @click="onTemplateModalOpen">📥 프로젝트템플릿다운로드</button>
          <button type="button" class="sg-btn sg-btn-accent" @click="onDownloadCurrentDdl">💾 현재정보다운로드</button>
          <button type="button" class="sg-btn sg-btn-accent" @click="onProjectUploadStart">📤 프로젝트업로드</button>
        </template>
      </span>
    </div>

    <div class="sg-ddl-layout">
      <!-- ═══ 좌측: subPackage 기준 트리 (폴더=subPackage 경로, 리프=테이블) ═══ -->
      <div class="sg-ddl-tree">
        <div class="sg-ddl-tree-toolbar">
          <!-- 2026-08-30: 트리 폭(240px 고정)에 버튼+체크박스가 한 줄로는 다 안 들어와 텍스트가
               잘렸다 — 체크박스는 둘째 줄로 내리고, 비어난 첫 줄 자리에 [초기화] 버튼 추가 -->
          <div class="sg-ddl-tree-toolbar-row">
            <button type="button" class="sg-btn sg-btn-ghost sg-btn-xs" :disabled="cfReadonly" @click="onAddFolderStart('')">+ 폴더</button>
            <button type="button" class="sg-btn sg-btn-ghost sg-btn-xs" :disabled="cfReadonly" @click="onAddTab('')">+ 테이블</button>
            <button type="button" class="sg-btn sg-btn-ghost sg-btn-xs" :disabled="cfReadonly" @click="onClearAllTabs">초기화</button>
          </div>
          <div class="sg-ddl-tree-toolbar-row">
            <!-- 2026-08-30: 첫 줄에 있던 총개수가 버튼 3개에 밀려 잘려 보여서 둘째 줄 맨 앞으로 이동 -->
            <span class="sg-ddl-tree-count">{{ tabs.length }}개</span>
            <label class="sg-thumb-chk"
              title="켜두면 새/샘플 테이블이 테이블명 접두어(예: sy_code -> sy)로 자동 폴더 배치됩니다. 끄면 루트에 추가되며, 폴더 배치는 드래그로 직접 합니다">
              <input type="checkbox" v-model="uiState.autoFolderByPrefix" :disabled="cfReadonly" /> 테이블약어폴더구분
            </label>
          </div>
        </div>
        <div v-if="uiState.treeNewFolderParent !== null" class="sg-tree-new-folder">
          <div class="sg-tree-new-folder-parent">{{ uiState.treeNewFolderParent || '최상위' }} 아래에</div>
          <input v-model="uiState.treeNewFolderText" class="sg-mono" placeholder="예: ec.mb (점으로 여러 단계 한번에)"
            @keyup.enter="onAddFolderConfirm" @keyup.esc="onAddFolderCancel" />
          <div class="sg-tree-new-folder-actions">
            <button type="button" class="sg-btn sg-btn-dark sg-btn-xs" @click="onAddFolderConfirm">확인</button>
            <button type="button" class="sg-btn sg-btn-ghost sg-btn-xs" @click="onAddFolderCancel">취소</button>
          </div>
        </div>
        <div class="sg-ddl-tree-list" @dragover.prevent @drop="onDropOnFolder('')">
          <div v-if="!cfTreeFlat.length" class="sg-tree-empty">테이블이 없습니다. [+ 테이블] 로 추가해주세요.</div>
          <div v-for="row in cfTreeFlat" :key="row.kind + ':' + (row.kind==='folder' ? row.path : row.tab.tabId)"
            class="sg-tree-row" :class="[row.kind==='folder' ? 'sg-tree-row-folder' : 'sg-tree-row-tab',
              { active: row.kind==='tab' && row.tab.tabId===uiState.activeTabId }]"
            :style="{ paddingLeft: (row.depth*16+8) + 'px' }"
            :draggable="!cfReadonly"
            @dragstart.stop="row.kind==='tab' ? onDragStartTab(row.tab.tabId) : onDragStartFolder(row.path)"
            @dragend="onDragEnd"
            @dragover.prevent
            @drop.stop="row.kind==='folder' ? onDropOnFolder(row.path) : null"
            @click="row.kind==='folder' ? onTreeToggle(row.path) : onSelectTab(row.tab.tabId)">
            <template v-if="row.kind==='folder'">
              <span class="sg-tree-toggle">{{ uiState.treeCollapsed[row.path] ? '▸' : '▾' }}</span>
              <span class="sg-tree-icon">📁</span>
              <template v-if="uiState.treeRenamePath===row.path">
                <input v-model="uiState.treeRenameText" class="sg-mono sg-tree-rename-input" @click.stop
                  @keyup.enter="onRenameNodeConfirm" @keyup.esc="onRenameNodeCancel" />
                <button type="button" class="sg-tree-mini-btn" title="확인" @click.stop="onRenameNodeConfirm">✓</button>
                <button type="button" class="sg-tree-mini-btn" title="취소" @click.stop="onRenameNodeCancel">✕</button>
              </template>
              <template v-else>
                <span class="sg-tree-label">{{ row.name }}</span>
                <span class="sg-tree-count">{{ row.count }}</span>
                <span v-if="!cfReadonly" class="sg-tree-actions">
                  <button type="button" class="sg-tree-mini-btn" title="이 폴더에 테이블 추가" @click.stop="onAddTab(row.path)">＋</button>
                  <button type="button" class="sg-tree-mini-btn" title="이름변경(점으로 깊이 조절)" @click.stop="onRenameNodeStart(row.path)">✎</button>
                  <button type="button" class="sg-tree-mini-btn" title="폴더 삭제" @click.stop="onDeleteFolder(row.path)">🗑</button>
                </span>
              </template>
            </template>
            <template v-else>
              <span class="sg-tree-icon">{{ (row.tab.ddlText||'').trim() ? '📄' : '📃' }}</span>
              <span class="sg-tree-label">{{ row.tab.tableNm || '(새 테이블)' }}</span>
              <span v-if="!cfReadonly" class="sg-tree-actions">
                <button type="button" class="sg-tree-mini-btn" title="삭제" @click.stop="onDeleteTab(row.tab.tabId)">🗑</button>
              </span>
            </template>
          </div>
        </div>
      </div>

      <!-- ═══ 우측: 선택된 테이블 편집 영역 ═══ -->
      <div class="sg-ddl-editor">
    <div class="sg-opts">
      <div class="sg-opt-row"><label>Schema</label><input v-model="cfCurTab.schemaNm" :readonly="cfReadonly" placeholder="(DDL에서 자동)" /></div>
      <div class="sg-opt-row"><label>Table</label><input v-model="cfCurTab.tableNm" readonly placeholder="(DDL에서 자동)" /></div>
      <div class="sg-opt-row"><label>Sub Package</label>
        <input v-model="cfCurTab.subPackage" :readonly="cfReadonly" placeholder="(테이블명 접두어 자동)"
          title="Base Package 하위 폴더 = 좌측 트리 경로. 예: ec.mb" class="sg-mono" /></div>
      <div class="sg-opt-row"><label>Class Name</label><input v-model="cfCurTab.classNm" :readonly="cfReadonly" placeholder="(테이블명에서 자동)" /></div>
      <div class="sg-opt-row"><label>Endpoint</label><input v-model="cfCurTab.endpoint" :readonly="cfReadonly" placeholder="(테이블명에서 자동)" /></div>
      <div class="sg-opt-row"><label>Swagger Tag</label><input v-model="cfCurTab.swaggerTag" :readonly="cfReadonly" placeholder="(Class Name 과 동일)" /></div>
    </div>

    <!-- 2026-08-30: 편집모드도 보기모드와 같은 Prism 컬러로 보이게(요청: "편집 의 소스 코드
         스타일 보기모드처럼 같게 해줘") — 오버레이 에디터 기법(Prism 공식 예제/
         react-simple-code-editor 와 동일): 실제 입력은 완전히 투명한 <textarea>가 받고, 그
         아래 하이라이트된 <pre> 가 겹쳐서 색만 보여준다. 두 레이어는 폰트·줄높이·패딩이 한
         글자도 다르면 커서와 글자 줄이 어긋나므로 CSS(.sg-ddl-code / .sg-ddl-textarea-overlay)
         에서 반드시 같은 값을 맞춘다. 보기모드는 textarea 없이 <pre> 만 그대로 노출(투명 처리
         불필요 — 읽기 전용이므로). :key 로 탭 전환마다 새로 그려 highlightElement 가 다시
         걸리게 한다(ddlCodeBoxRef watch 참조 — watch 는 이제 모드 무관하게 항상 재하이라이트). -->
    <div class="sg-ddl-edit-wrap">
      <pre ref="ddlCodeBoxRef" :key="cfCurTab.tabId" aria-hidden="true"
        class="sg-code sg-ddl-code line-numbers language-sql"><code class="language-sql">{{ cfCurTab.ddlText }}</code></pre>
      <textarea v-if="!cfReadonly" v-model="cfCurTab.ddlText" @input="onDdlInput" @scroll="onDdlScroll"
        class="sg-ddl-textarea-overlay" spellcheck="false" wrap="off"
        placeholder="CREATE TABLE schema.tbl ( ... );"></textarea>
    </div>
    <div v-if="cfCurTab.error" class="sg-msg-error">{{ cfCurTab.error }}</div>

    <!-- 2026-08-30: [메모]+[소스 생성] 을 하단 버튼란(화면 우측 구석)에서 이 DDL 편집 영역
         바로 아래로 이동 — 버튼이 화면 가장자리에 있으면 언어/스택 팝오버가 그 버튼 중심으로
         뜨다가 뷰포트 오른쪽 밖으로 잘려서 "모바일 앱"/"기타" 칸이 안 보이던 문제도 같이
         해결된다(팝오버가 이제 화면 중앙에 더 가까운 위치에서 뜬다). -->
    <div v-if="!cfReadonly" style="display:flex;margin-top:12px;">
      <span style="margin-left:auto;display:flex;gap:8px;align-items:center;">
        <input v-model="uiState.genMemo" class="form-control" style="width:220px;"
          placeholder="보관 메모(선택) — 예: v1 초안, 리뷰 반영" />
        <div class="sg-gen-wrap">
          <button class="sg-btn sg-btn-dark" @click="onOpenStackPop" :disabled="uiState.generating">
            {{ uiState.generating ? '생성 중…' : '⚙️ 소스생성' }}
          </button>
          <template v-if="uiState.stackPopOpen">
            <div class="sg-stack-backdrop" @click="onCloseStackPop"></div>
            <div class="sg-stack-pop">
              <div class="sg-stack-pop-title">생성할 언어/스택 선택</div>
              <div class="sg-stack-pop-list">
                <div v-for="sec in SG_STACK_SECTIONS" :key="sec.label" class="sg-stack-section">
                  <div class="sg-stack-section-title">{{ sec.label }}</div>
                  <div class="sg-stack-section-grid">
                    <label v-for="g in sec.items" :key="g.prefix" class="sg-stack-item">
                      <input type="checkbox" :checked="selectedStacks.includes(g.prefix)" @change="onToggleStack(g.prefix)" />
                      <span class="sg-stack-item-label">{{ g.short || g.title }}</span>
                      <select class="sg-stack-version" :value="fnStackVersion(g.prefix)"
                        :disabled="!selectedStacks.includes(g.prefix)" @click.stop
                        @change="onChangeVersion(g.prefix, $event.target.value)">
                        <option v-for="v in SG_STACK_VERSION_OPTIONS" :key="v" :value="v">{{ v }}</option>
                      </select>
                    </label>
                  </div>
                </div>
              </div>
              <div class="sg-stack-pop-actions">
                <button type="button" class="sg-btn sg-btn-ghost" @click="onCloseStackPop">취소</button>
                <button type="button" class="sg-btn sg-btn-dark" @click="onGenerateConfirmed" :disabled="!selectedStacks.length">생성 시작</button>
              </div>
            </div>
          </template>
        </div>
      </span>
    </div>

      </div>
      <!-- ═══ □ 우측: 편집 영역 ═══ -->
    </div>
  </div>

  <!-- ═══ 상단 액션(저장/소스생성/삭제/취소) — 2026-08-30: [생성 결과] 를 스크롤해서 내려가지
       않아도 바로 보이도록 그 위로 이동. ZIP 다운로드만 [생성 결과] 확인 직후가 자연스러워
       원래 위치(그 아래)에 그대로 둔다. ═══ -->
  <div class="sg-detail-bottom-actions">
    <template v-if="cfReadonly">
      <button class="btn btn_edit" @click="onSwitchToEdit">수정</button>
      <button v-if="form.projectId" class="btn btn_delete" @click="onDeleteProject">삭제</button>
    </template>
    <template v-else>
      <button class="btn btn_save" @click="onSave" :disabled="uiState.loading">저장</button>
      <!-- 2026-08-30: 패턴 A — 편집모드 [삭제] 제거(보기모드에만 유지, 프로젝트 전체 표준 변경) -->
      <button v-if="form.projectId" class="btn btn_cancel" @click="onCancelEdit">취소</button>
    </template>
  </div>

  <!-- ═══ 생성 결과 뷰어 ═══ -->
  <div class="sg-panel" v-if="cfTotalFileCount">
    <div class="sg-panel-title">
      {{ uiState.resultScopeKind === 'root' ? '생성 결과' : '생성 결과 — ' + cfResultScopeLabel }}
      <span class="sg-panel-sub">({{ cfScopeFileEntries.length }}개 파일 / 테이블 {{ cfResultScopeTabsCount }}개 / 전체 {{ cfTotalFileCount }}개)</span>
      <span v-if="cfResultScopeGeneratedAt" class="sg-gen-at">생성: {{ cfResultScopeGeneratedAt }}</span>
    </div>

    <div class="sg-result-body">
      <!-- ═══ ① 테이블목록: 범위 선택 트리 — 전체(root) / 폴더 / 테이블 ═══ -->
      <div class="sg-result-tree-col">
        <div class="sg-result-col-title">테이블목록</div>
        <div class="sg-result-tree">
          <div class="sg-tree-row" :class="{ active: uiState.resultScopeKind==='root' }" @click="onSelectResultScope('root')">
            <span class="sg-tree-icon">📦</span><span class="sg-tree-label">전체</span>
          </div>
          <div v-for="row in cfResultTreeFlat" :key="row.kind + ':' + (row.kind==='folder' ? row.path : row.tab.tabId)"
            class="sg-tree-row" :class="[row.kind==='folder' ? 'sg-tree-row-folder' : 'sg-tree-row-tab',
              { active: (row.kind==='folder' && uiState.resultScopeKind==='folder' && uiState.resultScopePath===row.path)
                     || (row.kind==='tab' && uiState.resultScopeKind==='tab' && uiState.resultTabId===row.tab.tabId) }]"
            :style="{ paddingLeft: (row.depth*16+8) + 'px' }"
            @click="row.kind==='folder' ? onSelectResultScope('folder', row.path) : onSelectResultScope('tab', row.tab.tabId)">
            <template v-if="row.kind==='folder'">
              <span class="sg-tree-toggle" @click.stop="onResultTreeToggle(row.path)">{{ uiState.resultTreeCollapsed[row.path] ? '▸' : '▾' }}</span>
              <span class="sg-tree-icon">📁</span><span class="sg-tree-label">{{ row.name }}</span>
            </template>
            <template v-else>
              <span class="sg-tree-icon">📄</span><span class="sg-tree-label">{{ row.tab.tableNm || '테이블' }}</span>
            </template>
          </div>
        </div>
      </div>
      <!-- ═══ ② 생성된 소스목록: 실제 생성 경로(realPath) 그대로의 폴더 트리 ═══
           2026-08-30: 스택 구분 헤더("Backend - JPA" 등) 없이, 실제 ZIP 에 담기는 경로 그대로
           보여달라는 요청 — 폴더 자체가 be_jpa/… 처럼 스택별로 자연히 나뉘어 보인다. -->
      <div class="sg-files-col">
        <div class="sg-result-col-title">생성된 소스목록 <span class="sg-result-col-count">{{ cfGenFileCount }}개</span></div>
        <div class="sg-files">
          <div v-for="row in cfGenFileTreeFlat" :key="row.kind + ':' + (row.kind==='folder' ? row.path : row.entry.key)"
            class="sg-tree-row" :class="[row.kind==='folder' ? 'sg-tree-row-folder' : 'sg-tree-row-tab',
              { active: row.kind==='file' && uiState.activeFile===row.entry.key }]"
            :style="{ paddingLeft: (row.depth*16+8) + 'px' }"
            :title="row.kind==='file' ? row.entry.realPath : row.path"
            @click="row.kind==='folder' ? onGenFileTreeToggle(row.path) : onSelectFile(row.entry.key)">
            <template v-if="row.kind==='folder'">
              <span class="sg-tree-toggle">{{ uiState.genFileTreeCollapsed[row.path] ? '▸' : '▾' }}</span>
              <span class="sg-tree-icon">📁</span><span class="sg-tree-label">{{ row.name }}</span>
            </template>
            <template v-else>
              <span class="sg-tree-icon">📄</span><span class="sg-tree-label">{{ row.entry.realPath.split('/').pop() }}</span>
            </template>
          </div>
        </div>
      </div>
      <!-- ═══ ③ 소스정보: 선택 파일 코드 뷰어 ═══ -->
      <div class="sg-code-pane">
        <div class="sg-file-info" v-if="cfActiveEntry">
          <span class="sg-file-path">{{ cfActiveEntry.realPath }}</span>
          <div class="sg-file-actions">
            <span v-if="uiState.copied" class="sg-copied">✓ 복사됨</span>
            <button class="btn btn-sm btn-secondary" @click="onCopyCode">복사</button>
            <button class="btn btn-sm btn-secondary" @click="onDownloadFile">다운로드</button>
          </div>
        </div>
        <pre v-if="cfActiveEntry" ref="codeBoxRef" :key="uiState.activeFile"
          class="sg-code line-numbers" :class="'language-' + fnLangOf(cfActiveEntry.fn)"><code
          :class="'language-' + fnLangOf(cfActiveEntry.fn)">{{ cfActiveEntry.content }}</code></pre>
        <div v-else class="sg-empty-hint">좌측에서 파일을 선택하세요</div>
      </div>
    </div>
  </div>

  <!-- ═══ ZIP 다운로드 (2026-08-30: 이 위치 유지 — 생성 결과를 확인한 직후 바로 다운로드).
       cfShowZipDownload 가 이미 cfTotalFileCount>0 을 포함하므로 :disabled 는 불필요(항상 true 상태로만 렌더). ═══ -->
  <div class="sg-detail-bottom-actions" v-if="cfShowZipDownload">
    <button class="sg-btn sg-btn-green" @click="onDownloadZip">⬇ ZIP 다운로드</button>
  </div>

  <!-- ═══ 이력 탭 — 생성 이력(DB 첨부) / 생성결과 다운로드 이력(클릭 로그) 통합, 2026-08-28 ═══ -->
  <div class="sg-panel">
    <div class="sg-panel-title">🕒 이력</div>
    <fo-tab-bar :tabs="histTabs" :tab="uiState.histTab"
      @tab-select="id => uiState.histTab = id" />
    <template v-if="uiState.histTab==='gen'">
      <!-- 보관 메모 입력은 2026-08-30 상단 액션바([소스 생성] 왼쪽)로 이동 — 여기 중복 배치 제거. -->
      <!-- 2026-08-30: 서버사이드 페이징 적용(정책: 클라이언트 사이드 페이징 금지) — :pager 를 주면
           fo-grid 가 번호를 페이지 기준으로 자동 계산한다. class="sg-hist-table" 은 행간을
           좁히는 스코프 CSS(전역 .fo-grid-table 에는 영향 없음). -->
      <div class="sg-list-count">총 {{ genHistPager.pageTotalCount }}개</div>
      <fo-grid class="sg-hist-table" :columns="genHistGridColumns" :rows="genHists" :pager="genHistPager" row-key="sourcegenHistId" bare
        empty-text="보관된 생성결과가 없습니다. [소스 생성] 을 실행하면 자동으로 보관됩니다.">
        <!-- 2026-08-30: 파일명 컬럼 제거로 넓어진 관리열을 좁은 폭 + 2줄 wrap 으로 다시 축소
             (columns 의 type:'actions' 항목은 그대로 두되 #row-actions 슬롯이 항상 우선이므로
             렌더는 이쪽 마크업이 담당 — visible/onClick 조건은 그 배열과 동일하게 맞춘다). -->
        <template #row-actions="{ row }">
          <div class="sg-hist-actions">
            <a v-if="row.zipUrl" class="sg-hist-link" @click="onDownloadGenHistZip(row)">다운로드</a>
            <button v-if="row.ddlSnapshotJson" type="button" class="btn btn-xs btn_detail" @click="onLoadSnapshot(row)">불러오기</button>
            <button v-if="!cfReadonly" type="button" class="btn btn_row_delete" @click="onDeleteGenHist(row)">삭제</button>
          </div>
        </template>
      </fo-grid>
      <fo-pager :pager="genHistPager" :on-set-page="onSetPageGenHist" :on-size-change="onSizeChangeGenHist" />
    </template>
    <template v-else>
      <div class="sg-list-count">총 {{ templateDlHistPager.pageTotalCount }}개</div>
      <fo-grid class="sg-hist-table" :columns="templateDlHistGridColumns" :rows="templateDlHist" :pager="templateDlHistPager" row-key="downloadHistId" bare
        empty-text="다운로드 이력이 없습니다.">
        <!-- 생성이력 그리드와 관리열 폭을 맞추기 위해 같은 wrapper 재사용(버튼은 1개뿐이라 실제로는 줄바꿈 안 됨).
             plain href 링크 — 클릭해도 이 그리드에 새 로그를 남기지 않는다(기존 동작 그대로). -->
        <template #row-actions="{ row }">
          <div class="sg-hist-actions">
            <a v-if="row.zipUrl" class="sg-hist-link" :href="row.zipUrl" target="_blank" rel="noopener">다운로드</a>
          </div>
        </template>
      </fo-grid>
      <fo-pager :pager="templateDlHistPager" :on-set-page="onSetPageDlHist" :on-size-change="onSizeChangeDlHist" />
    </template>
  </div>

  <!-- ═══ 프로젝트 템플릿 다운로드 모달 — 실제 DDL(_doc/ddl_pgsql/)을 업무구분별로 묶어 ZIP 다운로드 ═══ -->
  <fo-modal :show="uiState.templateModalOpen" title="프로젝트 템플릿 다운로드" width="520px"
    box-pad="20px" @close="onTemplateModalClose">
    <div class="sg-view-toggle" style="margin-bottom:6px;">
      <button type="button" :class="{ active: uiState.templateDbTab==='ORACLE' }" @click="onTemplateDbTab('ORACLE')">Oracle</button>
      <button type="button" :class="{ active: uiState.templateDbTab==='POSTGRESQL' }" @click="onTemplateDbTab('POSTGRESQL')">PostgreSQL</button>
    </div>
    <div v-if="uiState.templateDbTab==='ORACLE'" style="font-size:11px;color:var(--text-muted,#999);margin-bottom:10px;">
      ※ 원본은 PostgreSQL DDL 이며, 다운로드 시 Oracle 문법으로 자동 변환합니다(타입/인덱스 구문 위주 — 참고용, 배포 전 검토 필요)
    </div>
    <div v-else style="margin-bottom:10px;"></div>
    <div style="display:flex;flex-direction:column;gap:6px;max-height:400px;overflow-y:auto;">
      <div v-for="d in SG_TEMPLATE_DOMAINS" :key="d.key" class="sg-sample-btn"
        style="width:100%;justify-content:space-between;cursor:default;">
        <span>{{ d.label }}<span class="sg-sample-desc">{{ d.files.length }}개 테이블</span></span>
        <button type="button" class="sg-btn sg-btn-dark" style="flex:0 0 auto;"
          :disabled="!!uiState.templateDownloadingKey" @click="onDownloadTemplate(d)">
          {{ uiState.templateDownloadingKey===d.key ? '내려받는 중…' : '⬇ 다운로드' }}
        </button>
      </div>
    </div>
  </fo-modal>

  <!-- ═══ 프로젝트업로드 모달 — DB 유형 사전선택 + txt/sql/zip 업로드 ═══ -->
  <fo-modal :show="uiState.uploadModalOpen" title="프로젝트 업로드" width="440px"
    box-pad="20px" @close="uiState.uploadModalOpen = false">
    <div class="sg-view-toggle" style="margin-bottom:10px;">
      <button type="button" :class="{ active: uiState.uploadDbType==='ORACLE' }" @click="onProjectUploadDbPick('ORACLE')">Oracle</button>
      <button type="button" :class="{ active: uiState.uploadDbType==='POSTGRESQL' }" @click="onProjectUploadDbPick('POSTGRESQL')">PostgreSQL</button>
    </div>
    <div style="font-size:11px;color:var(--text-muted,#999);margin-bottom:14px;">
      업로드할 파일의 DDL 방언을 먼저 선택해주세요(파싱 기준). txt / sql / zip(txt·sql 포함) 파일만 가능하며,
      한 파일에 CREATE TABLE 이 여러 개 있어도 테이블 단위로 나눠 좌측 트리에 추가됩니다.
    </div>
    <!-- 2026-08-30: 기본 체크(교체) — 체크 해제 시 기존 탭에 누적 추가(예전 동작) -->
    <label class="sg-thumb-chk" style="margin-bottom:12px;"
      title="체크: 업로드 내용으로 좌측 트리를 전부 교체합니다. 해제: 기존 탭은 그대로 두고 뒤에 누적 추가합니다">
      <input type="checkbox" v-model="uiState.uploadReplaceExisting" /> 기존정보 초기화
    </label>
    <input ref="uploadFileInputRef" type="file" accept=".txt,.sql,.zip" style="display:none" @change="onProjectUploadFile" />
    <button type="button" class="sg-btn sg-btn-dark" style="width:100%;justify-content:center;"
      :disabled="uiState.uploading" @click="onOpenUploadPicker">
      {{ uiState.uploading ? '처리 중…' : '📁 파일 선택' }}
    </button>
  </fo-modal>
</div>
`,
};
