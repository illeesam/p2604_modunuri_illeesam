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

/* fnCategoryLabel — 결과 뷰어 파일트리 구분자에 붙일 영문 구획 라벨(2026-08-26).
   SG_STACK_SECTIONS 와 동일 분류 기준(prefix)을 재사용 — 팝오버 구획과 항상 일치시킨다. */
function fnCategoryLabel(prefix) {
  if (prefix.startsWith('backend_')) return 'Backend';
  if (SG_MOBILE_PREFIXES.includes(prefix)) return 'Mobile';
  if (prefix.startsWith('frontend_')) return 'Frontend';
  if (prefix.startsWith('fullstack_')) return 'Fullstack';
  return 'Etc';
}

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
function fnFlattenTree(root, collapsedMap) {
  const out = [];
  const walk = (node, depth) => {
    node.children.forEach(child => {
      out.push({ kind: 'folder', depth, path: child.path, name: child.name });
      if (!collapsedMap[child.path]) walk(child, depth + 1);
    });
    node.tabs.forEach(t => out.push({ kind: 'tab', depth, tab: t }));
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
   순서가 중요: 더 긴 prefix 를 먼저 둬야 한다(frontend_react_cdn_standalone/ 이 frontend_react/ 보다 먼저). */
const SG_ZIP_PATHS = [
  { p: 'backend_python/',                  to: 'sourcegen_be_python/src_python/' },
  { p: 'backend_csharp_efcore/',           to: 'sourcegen_be_csharp_efcore/src_csharp_efcore/' },
  { p: 'backend_csharp_dapper/',           to: 'sourcegen_be_csharp_dapper/src_csharp_dapper/' },
  { p: 'backend_nestjs/',                  to: 'sourcegen_be_nestjs10/src_nestjs/' },
  { p: 'backend_expressjs/',               to: 'sourcegen_be_expressjs4/src_expressjs/' },
  { p: 'frontend_vue3cdn_with_common/',    to: 'sourcegen_fe_vue3_cdn/with-common/' },
  { p: 'frontend_vue3cdn_standalone/',     to: 'sourcegen_fe_vue3_cdn/standalone/' },
  { p: 'frontend_vue3/',                   to: 'sourcegen_fe_vue3/frontend-vue3/src/views/' },
  { p: 'frontend_react_cdn_standalone/',   to: 'sourcegen_fe_react_cdn/' },
  { p: 'frontend_react_native/',           to: 'sourcegen_fe_react_native/frontend-react-native/' },
  { p: 'frontend_react/',                  to: 'sourcegen_fe_react/frontend-react/src/pages/' },
  { p: 'frontend_svelte_cdn_standalone/',  to: 'sourcegen_fe_svelte_cdn/' },
  { p: 'frontend_svelte/',                 to: 'sourcegen_fe_svelte/frontend-svelte/' },
  { p: 'frontend_pyscript_cdn_standalone/',to: 'sourcegen_fe_pyscript_cdn/' },
  { p: 'frontend_flutter/',                to: 'sourcegen_fe_flutter/frontend-flutter/' },
  { p: 'frontend_android/',                to: 'sourcegen_fe_android_compose/frontend-android/' },
  { p: 'frontend_ios/',                    to: 'sourcegen_fe_ios_swiftui/frontend-ios/' },
  { p: 'fullstack_nuxt/',                  to: 'sourcegen_full_nuxt4/fullstack-nuxt/' },
  { p: 'fullstack_nextjs/',                to: 'sourcegen_full_nextjs15/fullstack-nextjs/' },
];

/* fnZipPath — 파일맵 키를 ZIP 내부 경로로 변환. JPA/MyBatis 는 패키지 경로가 끼어들어 별도 처리. */
function fnZipPath(fn, pkgPath) {
  if (fn.startsWith('ddl/')) return fn;                       // DDL 은 ZIP 루트 (모든 스택 공용 메타)
  if (fn.startsWith('backend_jpa/')) {
    return `sourcegen_be_jpa/src_jpa/main/java/${pkgPath}/` + fn.substring('backend_jpa/'.length);
  }
  if (fn.startsWith('backend_mybatis/mapper/') && fn.endsWith('.xml')) {
    return 'sourcegen_be_mybatis/src_mybatis/main/resources/mapper/' + fn.substring('backend_mybatis/mapper/'.length);
  }
  if (fn.startsWith('backend_mybatis/')) {
    return `sourcegen_be_mybatis/src_mybatis/main/java/${pkgPath}/` + fn.substring('backend_mybatis/'.length);
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
    const { reactive, ref, computed, onMounted } = Vue;

    /* ── 1) 상태 선언 (ref/reactive 를 computed/watch 보다 먼저) ── */
    const uiState = reactive({
      loading: false, generating: false, saving: false, thumbUploading: false,
      autoThumb: true,        // 대표이미지 미첨부 시 DDL 정보로 자동 생성 (기본 ON)
      dtlMode: 'edit',        // 'view' | 'edit' — 목록에서 행 클릭=보기, [수정] 클릭=수정모드
      activeTabId: null,      // 현재 편집 중인 DDL 탭(tabId — 배열 재정렬과 무관한 안정 식별자)
      activeFile: '',         // 결과 뷰어에서 선택된 파일 키
      resultTabId: null,      // 결과 뷰어에서 보고 있는 탭(tabId) — resultScopeKind==='tab' 일 때만 사용
      resultScopeKind: 'root', // 결과 뷰어 범위 'root'(전체) | 'folder'(경로 하위 전부) | 'tab'(테이블 1개)
      resultScopePath: '',     // resultScopeKind==='folder' 일 때 그 경로
      resultTreeCollapsed: {}, // 결과 뷰어 좌측 트리 — 접힌 폴더 경로 집합
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
      uploading: false,          // 업로드 파일 처리중
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
    /* genHistGridColumns — fo-grid 전환(2026-08-25). 번호는 idx+1(페이저 없는 로컬 배열이라
       그대로), 일시/크기는 coUtil 공통 헬퍼(cofYmdHm/cofFileSize) 사용. */
    const genHistGridColumns = [
      { key: 'genDate',     label: '생성일시', width: '150px', fmt: (v) => coUtil.cofYmdHm(v) || '-' },
      { key: 'zipFileNm',   label: '파일명', cellClass: 'sg-list-mono' },
      { key: 'ddlCount',    label: '테이블', width: '80px', align: 'center', fmt: (v) => v || 0 },
      { key: 'fileCount',   label: '파일수', width: '80px', align: 'center', fmt: (v) => v || 0 },
      { key: 'zipFileSize', label: '크기', width: '90px', align: 'right', fmt: (v) => coUtil.cofFileSize(v) },
      { key: 'genMemo',     label: '메모', fmt: (v) => v || '-' },
    ];

    const cfReadonly = computed(() => uiState.dtlMode === 'view');

    /* type:'actions' — 관리 버튼모음도 별도 배열로 분리하지 않고 genHistGridColumns 항목 하나로 선언
       (#row-actions 슬롯 대체, 2026-08-25). cfReadonly 선언 직후에 둔다 — 삭제 버튼이 그 값을 읽는다. */
    genHistGridColumns.push({ type: 'actions', actions: [
      { label: '다운로드', cls: 'btn btn-sm btn-secondary', href: (row) => row.zipUrl, visible: (row) => !!row.zipUrl },
      { label: '불러오기', cls: 'btn btn-sm btn_detail', onClick: (row) => onLoadSnapshot(row), visible: (row) => !!row.ddlSnapshotJson },
      { label: '삭제',     cls: 'btn btn-sm btn_row_delete', onClick: (row) => onDeleteGenHist(row), visible: () => !cfReadonly.value },
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
       tabId 로 구분하고, 화면 라벨도 다중일 때만 "테이블명/파일경로" 로 풀어서 보여준다. */
    const cfScopeFileEntries = computed(() => {
      const tabsInScope = cfResultScopeTabs.value;
      const multi = tabsInScope.length > 1;
      const out = [];
      tabsInScope.forEach(t => {
        Object.keys(t.files).forEach(fn => {
          out.push({ key: t.tabId + '::' + fn, fn, tableNm: t.tableNm || '(이름없음)', content: t.files[fn], multi });
        });
      });
      return out;
    });
    /* cfGroupedFiles — 결과 뷰어 좌측 파일목록 (그룹 → 파일 목록).
       구분자 제목은 "{구획} - {스택}" 형식(예: "Backend - JPA", "Frontend - Vue3 CDN (with common)")
       — 팝오버 구획 헤더 없이 단독 노출되는 자리라 구획 정보를 제목에 직접 포함시킨다(2026-08-26). */
    const cfGroupedFiles = computed(() => {
      const entries = cfScopeFileEntries.value;
      return SG_FILE_GROUPS
        .map(g => ({ title: fnCategoryLabel(g.prefix) + ' - ' + (g.short || g.title), files: entries.filter(e => e.fn.startsWith(g.prefix)) }))
        .filter(g => g.files.length > 0);
    });
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

    /* ── 2) DDL 입력 → 옵션 자동 추출 (watch 대신 입력 핸들러에서 직접 호출) ── */
    const onDdlInput = () => {
      const t = cfCurTab.value;
      const opts = fnExtractOpts(t.ddlText);
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

    /* onLoadSample — [샘플] 버튼: 현재 탭에 예제 DDL 을 채우고 옵션까지 자동 추출.
       생성 결과가 DB 별로 달라지므로 샘플이 속한 DB 유형으로 상단 [DB 유형] 도 함께 맞춘다. */
    const onLoadSample = async (s, dbTypeCd) => {
      const t = cfCurTab.value;
      if ((t.ddlText || '').trim() &&
          !await props.showConfirm('샘플 넣기', `[${t.tableNm || '현재 탭'}] 의 DDL 을 샘플로 덮어쓰시겠습니까?`)) return;
      if (dbTypeCd) form.dbTypeCd = dbTypeCd;
      t.ddlText = s.text;
      const opts = fnExtractOpts(t.ddlText);
      if (opts) Object.assign(t, opts);
      t.files = {}; t.error = ''; t.generatedAt = '';
      fnFillAutoName();
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

      await fnLoadGenHists(p.projectId);
      uiState.dtlMode = 'view';  // 목록에서 들어온 진입은 항상 보기모드 — [수정] 클릭 시에만 편집
      uiState.activeTabId = tabs[0].tabId;
    };

    const fnLoadGenHists = async (projectId) => {
      const res = await mdSgApiSvc.genHist.getList(projectId, '소스젠', '생성이력조회');
      genHists.splice(0, genHists.length, ...(res.data?.data || []));
    };

    /* ── 4) 화면 이동 / 모드 전환 ── */
    const onBackToList = () => { location.href = 'fo-md-sg-sourcegen.html?view=list'; };
    const onNewProject = () => {
      Object.assign(form, { projectId: null, projectNm: '', projectDesc: '', basePackage: 'com.exam.app',
        dbTypeCd: 'POSTGRESQL', thumbnailUrl: '', thumbnailAttachId: null });
      tabs.splice(0, tabs.length, fnNewTab());
      genHists.splice(0, genHists.length);
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
    const onTemplateModalOpen = () => { uiState.templateModalOpen = true; fnLoadTemplateDlHist(); };
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

    /* onProjectUploadFile — 파일 선택 즉시 파싱해서 트리에 테이블(탭)로 추가한다(기존 탭은 유지 —
       "업로드"는 가져오기이지 초기화가 아니다). txt/sql 은 그대로 읽고, zip 은 안의 txt/sql 파일들을
       전부 읽어 합친다. */
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
            newTabs.push(fnNewTab({ ddlText: stmt, ...opts }));
          });
        });
        if (!newTabs.length) throw new Error('CREATE TABLE 구문을 찾지 못했습니다.');
        newTabs.forEach(t => tabs.push(t));
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
      }, '소스젠', 'ZIP다운로드').then(fnLoadTemplateDlHist).catch(() => { /* 로그 실패는 무시 */ });
    };

    /* templateDlHist — [프로젝트 템플릿 다운로드] 모달 하단에 보여줄 최근 다운로드 이력(공용 로그 최근 N건).
       소스 생성 결과 ZIP 다운로드(fnLogDownload)와 템플릿 ZIP 다운로드(fnLogTemplateDownload)가 같은
       md_sg_download_hist 테이블을 쓰므로 둘 다 여기 섞여 보인다 — projectNm 에 "[템플릿] " 접두어로 구분. */
    const templateDlHist = ref([]);
    const fnLoadTemplateDlHist = async () => {
      try {
        const res = await mdSgApiSvc.downloadHist.getPage({ pageNo: 1, pageSize: 10 });
        templateDlHist.value = res.data?.data?.pageList || [];
      } catch (err) { /* 조회 실패는 조용히 무시 — 목록이 비어 보일 뿐 모달 사용에 지장 없음 */ }
    };

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
    /* onDeleteTab — 탭(테이블) 1개 삭제 */
    const onDeleteTab = async (tabId) => {
      const t = tabs.find(x => x.tabId === tabId);
      if (!t) return;
      if ((t.ddlText || '').trim() && !await props.showConfirm('테이블 삭제', `[${t.tableNm || '이 테이블'}] 을 목록에서 삭제하시겠습니까?`)) return;
      const idx = tabs.indexOf(t);
      if (idx >= 0) tabs.splice(idx, 1);
      fnEnsureNotEmpty();
    };
    const onClearTab = async () => {
      const t = cfCurTab.value;
      if (!await props.showConfirm('현재 테이블 초기화', `[${t.tableNm || '현재 테이블'}] 의 DDL 을 지우시겠습니까?`)) return;
      Object.assign(t, { ddlText: '', schemaNm: '', tableNm: '', classNm: '', endpoint: '', swaggerTag: '', files: {}, error: '', generatedAt: '' });
    };
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
    const onDeleteFolder = async (path) => {
      const affected = tabs.filter(t => t.subPackage === path || (t.subPackage || '').startsWith(path + '.'));
      if (!await props.showConfirm('폴더 삭제', `[${path}] 폴더와 그 안의 테이블 ${affected.length}개를 모두 삭제하시겠습니까?`)) return;
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
        props.showToast(
          failed ? `${okCount}개 탭 생성 완료 (실패 ${failed}개 — 탭별 오류 메시지 확인)`
                 : `${okCount}개 탭, 총 ${cfTotalFileCount.value}개 파일을 생성했습니다.`,
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
    const fnZipName = () => {
      const d = new Date();
      const p = n => String(n).padStart(2, '0');
      const ts = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
      const nm = (form.projectNm || 'project').replace(/[^\w가-힣.-]+/g, '_');
      return `sourcegen_${nm}_${ts}.zip`;
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
        fnLogDownload(zipName);
      } catch (err) {
        props.showToast(err.message || 'ZIP 생성 중 오류가 발생했습니다.', 'error', 0);
      }
    };

    /* fnLogDownload — [⬇ ZIP 다운로드] 클릭 기록(다운로드이력관리 화면용, 2026-08-26).
       로그성 호출 — 실패해도 방금 끝난 다운로드 자체에는 영향 주지 않는다(await 없이 fire-and-forget). */
    const fnLogDownload = (zipName) => {
      mdSgApiSvc.downloadHist.create({
        projectId: form.projectId || null,
        projectNm: form.projectNm || null,
        basePackage: form.basePackage || null,
        zipFileNm: zipName,
        ddlCount: cfFilledTabs.value.length,
        fileCount: cfTotalFileCount.value,
      }, '소스젠', 'ZIP다운로드').then(fnLoadTemplateDlHist).catch(() => { /* 로그 실패는 무시 — 다운로드 자체는 이미 완료됨 */ });
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

    /* fnArchiveZip — 생성 결과를 ZIP 으로 묶어 업로드하고 이력 1건을 남긴다.
       [저장] 시 자동 보관과 [생성결과 보관] 버튼이 함께 쓴다. 실패하면 throw 한다(호출부에서 처리). */
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
      }, '소스젠', '생성이력등록');
    };

    /* onLoadSnapshot — [생성결과 보관 이력]의 [불러오기]. 그 시점의 DDL 탭 입력값을 에디터로 복원한다
       (생성된 소스 자체가 아니라 "다시 생성할 수 있는 재료"를 되돌리는 것 — 복원 후 [소스 생성]을 다시
       눌러야 실제 파일이 나온다). 현재 편집 중인 탭 내용을 덮어쓰므로 확인을 받는다. */
    const onLoadSnapshot = async (row) => {
      if (!row.ddlSnapshotJson) { props.showToast('이 이력에는 불러올 DDL 스냅샷이 없습니다.', 'error'); return; }
      let snap;
      try { snap = JSON.parse(row.ddlSnapshotJson); } catch (e) { props.showToast('스냅샷 데이터를 읽을 수 없습니다.', 'error'); return; }
      if (!await props.showConfirm('생성결과 불러오기',
        `${coUtil.cofYmdHm(row.genDate) || ''} 생성 시점의 DDL 탭 입력값으로 되돌리시겠습니까?\n(현재 편집 중인 DDL 탭 내용은 덮어써집니다 — 다시 생성하려면 [소스 생성]을 눌러주세요)`)) return;
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
      props.showToast('DDL 탭을 불러왔습니다. [소스 생성]을 눌러 다시 생성해주세요.', 'success');
    };

    const onSaveZipToDb = async () => {
      if (!form.projectId) { props.showToast('먼저 프로젝트를 저장해주세요.', 'error'); return; }
      if (!cfTotalFileCount.value) { props.showToast('먼저 [생성] 을 실행해주세요.', 'error'); return; }
      if (!await props.showConfirm('생성결과 보관', '생성된 소스를 ZIP 으로 묶어 첨부로 보관하시겠습니까?')) return;
      uiState.saving = true;
      try {
        await fnArchiveZip(form.projectId, uiState.genMemo);
        uiState.genMemo = '';
        await fnLoadGenHists(form.projectId);
        props.showToast('생성결과를 첨부로 보관했습니다.', 'success');
      } catch (err) {
        props.showToast(coUtil.cofErrMsg(err, '보관 중 오류가 발생했습니다.'), 'error', 0);
      } finally {
        uiState.saving = false;
      }
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
            await fnLoadGenHists(projectId);
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
    });

    return {
      uiState, form, tabs, genHists, genHistGridColumns,
      cfReadonly, cfIsNew, cfCurTab, cfTotalFileCount, cfFilledTabs,
      cfResultTabs, cfGroupedFiles, cfTree, cfTreeFlat,
      cfResultTreeFlat, cfResultScopeLabel, cfActiveEntry, cfScopeFileEntries, cfResultScopeGeneratedAt, cfResultScopeTabsCount,
      fnLangOf,
      SG_SAMPLE_GROUPS, onLoadSample, codeBoxRef, thumbInputRef,
      onOpenThumbPicker, onThumbFileChange, onRemoveThumb,
      onDdlInput, onBackToList, onNewProject, onSwitchToEdit, onCancelEdit,
      SG_TEMPLATE_DOMAINS, onTemplateModalOpen, onTemplateModalClose, onTemplateDbTab, onDownloadTemplate,
      templateDlHist,
      onProjectUploadStart, onProjectUploadDbPick, onProjectUploadFile, onOpenUploadPicker, uploadFileInputRef,
      onSelectTab, onClearTab, onClearAllTabs, onGenerate,
      onAddTab, onDeleteTab, onTreeToggle,
      onAddFolderStart, onAddFolderCancel, onAddFolderConfirm,
      onRenameNodeStart, onRenameNodeCancel, onRenameNodeConfirm, onDeleteFolder,
      onDragStartTab, onDragStartFolder, onDragEnd, onDropOnFolder,
      SG_STACK_SECTIONS, selectedStacks, onOpenStackPop, onCloseStackPop, onToggleStack, onGenerateConfirmed,
      SG_STACK_VERSION_OPTIONS, stackVersions, fnStackVersion, onChangeVersion,
      onSelectResultScope, onResultTreeToggle, onSelectFile, onCopyCode, onDownloadFile, onDownloadZip,
      onSaveZipToDb, onDeleteGenHist, onSave, onDeleteProject,
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
    <div class="sg-panel-title">소스젠 목록 (DDL 입력) <span class="sg-panel-sub">(좌측 트리에서 테이블 선택. 입력하면 스키마·테이블·클래스명이 자동 추출됩니다)</span>
      <span style="margin-left:auto;display:flex;gap:6px;">
        <button type="button" class="sg-btn sg-btn-accent" @click="onTemplateModalOpen">📥 프로젝트템플릿다운로드</button>
        <button type="button" class="sg-btn sg-btn-accent" @click="onProjectUploadStart">📤 프로젝트업로드</button>
      </span>
    </div>

    <div class="sg-ddl-layout">
      <!-- ═══ 좌측: subPackage 기준 트리 (폴더=subPackage 경로, 리프=테이블) ═══ -->
      <div class="sg-ddl-tree">
        <div class="sg-ddl-tree-toolbar">
          <button type="button" class="sg-btn sg-btn-ghost sg-btn-xs" :disabled="cfReadonly" @click="onAddFolderStart('')">+ 폴더</button>
          <button type="button" class="sg-btn sg-btn-ghost sg-btn-xs" :disabled="cfReadonly" @click="onAddTab('')">+ 테이블</button>
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

    <textarea v-model="cfCurTab.ddlText" :readonly="cfReadonly" @input="onDdlInput" rows="22"
      class="form-control sg-ddl-textarea" placeholder="CREATE TABLE schema.tbl ( ... );"></textarea>
    <div v-if="cfCurTab.error" class="sg-msg-error">{{ cfCurTab.error }}</div>

    <div v-if="!cfReadonly" class="sg-samples">
      <div class="sg-samples-cap">예제 DDL <span>— 클릭하면 현재 탭에 채워지고 DB 유형도 함께 맞춰집니다</span></div>
      <div v-for="grp in SG_SAMPLE_GROUPS" :key="grp.db" class="sg-sample-row">
        <span class="sg-sample-label" :class="'sg-db-' + grp.db.toLowerCase()">{{ grp.dbLabel }}</span>
        <button v-for="s in grp.items" :key="s.key" class="sg-sample-btn"
          :class="{ 'sg-sample-on': form.dbTypeCd === grp.db }"
          :title="grp.dbLabel + ' · ' + s.desc + ' — 현재 탭에 넣기'" @click="onLoadSample(s, grp.db)">
          {{ s.label }}<span class="sg-sample-desc">{{ s.desc }}</span>
        </button>
      </div>
    </div>

    <div class="sg-ddl-actions">
      <div class="sg-ddl-actions-left">
        <template v-if="!cfReadonly">
          <button class="sg-btn sg-btn-ghost" @click="onClearTab">현재탭 초기화</button>
          <button class="sg-btn sg-btn-ghost" @click="onClearAllTabs">전체 초기화</button>
        </template>
      </div>
      <div class="sg-gen-wrap">
        <button class="sg-btn sg-btn-dark" @click="onOpenStackPop" :disabled="uiState.generating">
          {{ uiState.generating ? '생성 중…' : '⚙️ 소스 생성 (전체 탭)' }}
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
      <div class="sg-ddl-actions-right">
        <button class="sg-btn sg-btn-green" @click="onDownloadZip" :disabled="!cfTotalFileCount">⬇ ZIP 다운로드</button>
        <button v-if="!cfReadonly" class="sg-btn sg-btn-dark" @click="onSaveZipToDb"
          :disabled="!cfTotalFileCount || uiState.saving">
          {{ uiState.saving ? '보관 중…' : '📎 생성결과 보관' }}
        </button>
      </div>
    </div>
      </div>
      <!-- ═══ □ 우측: 편집 영역 ═══ -->
    </div>
  </div>

  <!-- ═══ 생성 결과 뷰어 ═══ -->
  <div class="sg-panel" v-if="cfTotalFileCount">
    <div class="sg-panel-title">
      생성 결과 — {{ cfResultScopeLabel }}
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
      <!-- ═══ ② 소스목록: 선택 범위의 파일 목록(스택별 그룹) ═══ -->
      <div class="sg-files-col">
        <div class="sg-result-col-title">소스목록</div>
        <div class="sg-files">
          <template v-for="grp in cfGroupedFiles" :key="grp.title">
            <div class="sg-file-grp">{{ grp.title }}</div>
            <button class="sg-file-btn" v-for="e in grp.files" :key="e.key"
              :class="{ active: uiState.activeFile===e.key }" @click="onSelectFile(e.key)"
              :title="e.fn">{{ e.multi ? e.tableNm + '/' + e.fn : e.fn }}</button>
          </template>
        </div>
      </div>
      <!-- ═══ ③ 소스정보: 선택 파일 코드 뷰어 ═══ -->
      <div class="sg-code-pane">
        <div class="sg-file-info" v-if="cfActiveEntry">
          <span class="sg-file-path">{{ cfActiveEntry.multi ? cfActiveEntry.tableNm + '/' + cfActiveEntry.fn : cfActiveEntry.fn }}</span>
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

  <!-- ═══ 생성결과 보관 이력 (DB 첨부) ═══ -->
  <div class="sg-panel" v-if="form.projectId">
    <div class="sg-panel-title">📎 생성결과 보관 이력 <span class="sg-panel-sub">(생성된 소스 ZIP 을 첨부로 DB 에 보관 — [저장] 할 때마다 자동으로 한 건 쌓입니다)</span></div>
    <div v-if="!cfReadonly" class="sg-memo-row">
      <input v-model="uiState.genMemo" class="form-control" placeholder="보관 메모(선택) — 예: v1 초안, 리뷰 반영본" />
    </div>
    <!-- fo-grid 전환(2026-08-25). 로컬 배열이라 pager 없음 — 번호는 show-row-no 기본값(idx+1)과 동일. -->
    <fo-grid :columns="genHistGridColumns" :rows="genHists" row-key="sourcegenHistId" bare
      empty-text="보관된 생성결과가 없습니다. [생성] 후 [생성결과 보관] 을 눌러주세요." />
  </div>

  <!-- ═══ 하단 액션 ═══ -->
  <div class="sg-detail-bottom-actions">
    <template v-if="cfReadonly">
      <button class="btn btn_edit" @click="onSwitchToEdit">수정</button>
      <button v-if="form.projectId" class="btn btn_delete" @click="onDeleteProject">삭제</button>
    </template>
    <template v-else>
      <button class="btn btn_save" @click="onSave" :disabled="uiState.loading">저장</button>
      <button v-if="form.projectId" class="btn btn_delete" @click="onDeleteProject">삭제</button>
      <button v-if="form.projectId" class="btn btn_cancel" @click="onCancelEdit">취소</button>
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

    <!-- ═══ 다운로드 이력 — 템플릿/생성결과 ZIP 클릭 로그 최근 10건(md_sg_download_hist) ═══ -->
    <div class="sg-dlhist-title">다운로드 이력</div>
    <div class="sg-hist-table-wrap">
      <table class="sg-hist-table">
        <thead><tr><th>일시</th><th>구분</th><th>파일명</th><th>건수</th></tr></thead>
        <tbody>
          <tr v-for="row in templateDlHist" :key="row.downloadHistId">
            <td>{{ row.regDate }}</td>
            <td>{{ row.projectNm || '(제목없음)' }}</td>
            <td>{{ row.zipFileNm }}</td>
            <td>{{ row.fileCount }}</td>
          </tr>
          <tr v-if="!templateDlHist.length"><td colspan="4" style="text-align:center;color:var(--text-muted,#999);">다운로드 이력이 없습니다.</td></tr>
        </tbody>
      </table>
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
    <input ref="uploadFileInputRef" type="file" accept=".txt,.sql,.zip" style="display:none" @change="onProjectUploadFile" />
    <button type="button" class="sg-btn sg-btn-dark" style="width:100%;justify-content:center;"
      :disabled="uiState.uploading" @click="onOpenUploadPicker">
      {{ uiState.uploading ? '처리 중…' : '📁 파일 선택' }}
    </button>
  </fo-modal>
</div>
`,
};
