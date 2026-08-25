/* ShopJoy FO 모듈 - 소스젠 상세/편집 (DDL 탭 편집 + 소스 생성 + 결과 ZIP 을 DB 첨부로 보관)
   목록 화면(MdSgProjectListPage)에서 "?view=editor&projectId=xxx" 로 진입 — projectId 없으면 신규 작성.

   생성 엔진은 p2605_sourcegen 프로젝트의 순수 클라이언트 JS 를 그대로 가져다 쓴다
   (assets/md/sg/sourcegen/*.js — gnParseDdl / gnGenerate 가 전역으로 노출됨). */

const SG_TAB_COUNT = 10;   // DDL 탭 최대 개수 (원본 소스젠과 동일)

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

/* SG_PROJECT_TEMPLATES — [프로젝트템플릿다운로드] 모달에 보여줄 목록(DB 유형별 3개씩).
   전부 준비중(미구현) 항목이라 실제 다운로드 URL 없이 label/desc 만 갖는다 — 클릭 시 토스트만 안내. */
const SG_PROJECT_TEMPLATES = [
  { db: 'ORACLE', dbLabel: 'Oracle', items: [
    { key: 'ora-tpl1', label: '회원관리 템플릿',  desc: '회원/등급/주소 CRUD 기본형' },
    { key: 'ora-tpl2', label: '게시판 템플릿',    desc: '게시판/댓글/첨부 CRUD 기본형' },
    { key: 'ora-tpl3', label: '주문관리 템플릿',  desc: '주문/주문상품 CRUD 기본형' },
  ] },
  { db: 'POSTGRESQL', dbLabel: 'PostgreSQL', items: [
    { key: 'pg-tpl1', label: '회원관리 템플릿',  desc: '회원/등급/주소 CRUD 기본형' },
    { key: 'pg-tpl2', label: '게시판 템플릿',    desc: '게시판/댓글/첨부 CRUD 기본형' },
    { key: 'pg-tpl3', label: '주문관리 템플릿',  desc: '주문/주문상품 CRUD 기본형' },
  ] },
];

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
      activeTabIdx: 0,        // 현재 편집 중인 DDL 탭
      activeFile: '',         // 결과 뷰어에서 선택된 파일 키
      resultTabIdx: 0,        // 결과 뷰어에서 보고 있는 탭
      copied: false,
      genMemo: '',
      templateModalOpen: false,  // 프로젝트 템플릿 다운로드 모달 표시 여부
      templateDbTab: 'POSTGRESQL', // 템플릿 모달 안 DB 탭 선택('ORACLE' | 'POSTGRESQL')
      stackPopOpen: false,       // [소스 생성] 언어/스택 선택 팝오버 표시 여부
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

    /* tabs — DDL 탭 10개. files 는 생성 결과(파일경로 → 소스문자열) */
    const tabs = reactive(
      Array.from({ length: SG_TAB_COUNT }, (_, i) => ({
        tabNo: i + 1, ddlText: '', schemaNm: '', tableNm: '', classNm: '', endpoint: '', swaggerTag: '', subPackage: '',
        files: {}, error: '', generatedAt: '',
      }))
    );

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
    const cfCurTab = computed(() => tabs[uiState.activeTabIdx] || tabs[0]);
    const cfResultTab = computed(() => tabs[uiState.resultTabIdx] || tabs[0]);
    const cfTotalFileCount = computed(() => tabs.reduce((s, t) => s + Object.keys(t.files).length, 0));
    /* cfFilledTabs — DDL 이 실제로 입력된 탭만 (생성/저장 대상) */
    const cfFilledTabs = computed(() => tabs.filter(t => (t.ddlText || '').trim()));
    /* cfResultTabIndices — 생성 결과가 있는 탭 인덱스 */
    const cfResultTabIndices = computed(() =>
      tabs.map((t, i) => (Object.keys(t.files).length ? i : -1)).filter(i => i >= 0));

    /* cfGroupedFiles — 결과 뷰어 좌측 트리 (그룹 → 파일 목록).
       구분자 제목은 "{구획} - {스택}" 형식(예: "Backend - JPA", "Frontend - Vue3 CDN (with common)")
       — 팝오버 구획 헤더 없이 단독 노출되는 자리라 구획 정보를 제목에 직접 포함시킨다(2026-08-26). */
    const cfGroupedFiles = computed(() => {
      const all = Object.keys(cfResultTab.value.files);
      return SG_FILE_GROUPS
        .map(g => ({ title: fnCategoryLabel(g.prefix) + ' - ' + (g.short || g.title), files: all.filter(n => n.startsWith(g.prefix)) }))
        .filter(g => g.files.length > 0);
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
          !await props.showConfirm('샘플 넣기', `탭 ${t.tabNo} 의 현재 DDL 을 샘플로 덮어쓰시겠습니까?`)) return;
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

      /* DDL 탭 복원 — 저장된 tabNo 자리에 그대로 채우고 나머지는 빈 탭 유지 */
      tabs.forEach(t => Object.assign(t, { ddlText: '', schemaNm: '', tableNm: '', classNm: '', endpoint: '', swaggerTag: '', subPackage: '', files: {}, error: '', generatedAt: '' }));
      const ddlRes = await mdSgApiSvc.ddl.getList(p.projectId, '소스젠', 'DDL조회');
      (ddlRes.data?.data || []).forEach(d => {
        const idx = (d.tabNo || 1) - 1;
        if (idx < 0 || idx >= SG_TAB_COUNT) return;
        Object.assign(tabs[idx], {
          ddlText: d.ddlText || '', schemaNm: d.schemaNm || '', tableNm: d.tableNm || '',
          classNm: d.classNm || '', endpoint: d.endpoint || '', swaggerTag: d.swaggerTag || '',
          subPackage: d.subPackage || '',
        });
      });

      await fnLoadGenHists(p.projectId);
      uiState.dtlMode = 'view';  // 목록에서 들어온 진입은 항상 보기모드 — [수정] 클릭 시에만 편집
      uiState.activeTabIdx = 0;
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
      tabs.forEach(t => Object.assign(t, { ddlText: '', schemaNm: '', tableNm: '', classNm: '', endpoint: '', swaggerTag: '', subPackage: '', files: {}, error: '', generatedAt: '' }));
      genHists.splice(0, genHists.length);
      uiState.dtlMode = 'edit';
      uiState.activeTabIdx = 0;
      uiState.activeFile = '';
      history.replaceState(null, '', 'fo-md-sg-sourcegen.html?view=editor');
    };
    const onSwitchToEdit = () => { uiState.dtlMode = 'edit'; };
    const onCancelEdit = async () => {
      if (form.projectId) await fnLoadProject(form.projectId);
      uiState.dtlMode = 'view';
    };

    /* ── 4b) 프로젝트 템플릿 다운로드 / 프로젝트 업로드 (둘 다 미구현 — 준비중 안내만) ── */
    const onTemplateModalOpen = () => { uiState.templateModalOpen = true; };
    const onTemplateModalClose = () => { uiState.templateModalOpen = false; };
    const onTemplateDbTab = (db) => { uiState.templateDbTab = db; };
    /* onTemplateItemClick — 템플릿 항목 클릭. 실제 다운로드는 미구현이라 안내만(2026-08-25) */
    const onTemplateItemClick = () => { props.showToast('준비중입니다.', 'info'); };
    /* onProjectUpload — 프로젝트 업로드 버튼. 미구현이라 안내만(2026-08-25) */
    const onProjectUpload = () => { props.showToast('준비중입니다.', 'info'); };
    const cfTemplateItems = computed(() => {
      const grp = SG_PROJECT_TEMPLATES.find(g => g.db === uiState.templateDbTab);
      return grp ? grp.items : [];
    });

    /* ── 5) DDL 탭 편집 ── */
    const onSelectTab = (i) => { uiState.activeTabIdx = i; };
    const onClearTab = async () => {
      if (!await props.showConfirm('현재 탭 초기화', `탭 ${uiState.activeTabIdx + 1} 의 DDL 을 지우시겠습니까?`)) return;
      Object.assign(cfCurTab.value, { ddlText: '', schemaNm: '', tableNm: '', classNm: '', endpoint: '', swaggerTag: '', subPackage: '', files: {}, error: '', generatedAt: '' });
    };
    const onClearAllTabs = async () => {
      if (!await props.showConfirm('전체 초기화', '모든 DDL 탭과 생성 결과를 지우시겠습니까?')) return;
      tabs.forEach(t => Object.assign(t, { ddlText: '', schemaNm: '', tableNm: '', classNm: '', endpoint: '', swaggerTag: '', subPackage: '', files: {}, error: '', generatedAt: '' }));
      uiState.activeFile = '';
    };
    const fnHasData = (i) => !!(tabs[i].ddlText || '').trim();

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
        /* 결과 뷰어를 첫 성공 탭 + 첫 파일로 맞춘다 */
        const first = cfResultTabIndices.value[0];
        if (first !== undefined) {
          uiState.resultTabIdx = first;
          const keys = Object.keys(tabs[first].files);
          uiState.activeFile = keys[0] || '';
          fnHighlight();
        }
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

    /* ── 7) 결과 뷰어 ── */
    const onSelectResultTab = (i) => {
      uiState.resultTabIdx = i;
      const keys = Object.keys(tabs[i].files);
      uiState.activeFile = keys[0] || '';
      fnHighlight();
    };
    const onSelectFile = (fn) => { uiState.activeFile = fn; fnHighlight(); };
    const onCopyCode = async () => {
      const code = cfResultTab.value.files[uiState.activeFile] || '';
      try {
        await navigator.clipboard.writeText(code);
        uiState.copied = true;
        setTimeout(() => { uiState.copied = false; }, 1500);
      } catch (e) {
        props.showToast('클립보드 복사에 실패했습니다.', 'error');
      }
    };
    const onDownloadFile = () => {
      const fn = uiState.activeFile;
      if (!fn) return;
      const blob = new Blob([cfResultTab.value.files[fn] || ''], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fn.split('/').pop();
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
      }, '소스젠', 'ZIP다운로드').catch(() => { /* 로그 실패는 무시 — 다운로드 자체는 이미 완료됨 */ });
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
      tabs.forEach(t => Object.assign(t, { ddlText: '', schemaNm: '', tableNm: '', classNm: '', endpoint: '', swaggerTag: '', subPackage: '', files: {}, error: '', generatedAt: '' }));
      if (snap.basePackage) form.basePackage = snap.basePackage;
      if (snap.dbTypeCd) form.dbTypeCd = snap.dbTypeCd;
      (snap.tabs || []).forEach(s => {
        const idx = (s.tabNo || 1) - 1;
        if (idx < 0 || idx >= SG_TAB_COUNT) return;
        Object.assign(tabs[idx], {
          ddlText: s.ddlText || '', schemaNm: s.schemaNm || '', tableNm: s.tableNm || '',
          classNm: s.classNm || '', endpoint: s.endpoint || '', swaggerTag: s.swaggerTag || '', subPackage: s.subPackage || '',
        });
      });
      uiState.activeTabIdx = 0;
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
          tabNo: t.tabNo, ddlText: t.ddlText, schemaNm: t.schemaNm, tableNm: t.tableNm,
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
      cfReadonly, cfIsNew, cfCurTab, cfResultTab, cfTotalFileCount, cfFilledTabs,
      cfResultTabIndices, cfGroupedFiles,
      fnHasData, fnLangOf,
      SG_SAMPLE_GROUPS, onLoadSample, codeBoxRef, thumbInputRef,
      onOpenThumbPicker, onThumbFileChange, onRemoveThumb,
      onDdlInput, onBackToList, onNewProject, onSwitchToEdit, onCancelEdit,
      cfTemplateItems, onTemplateModalOpen, onTemplateModalClose, onTemplateDbTab, onTemplateItemClick, onProjectUpload,
      onSelectTab, onClearTab, onClearAllTabs, onGenerate,
      SG_STACK_SECTIONS, selectedStacks, onOpenStackPop, onCloseStackPop, onToggleStack, onGenerateConfirmed,
      SG_STACK_VERSION_OPTIONS, stackVersions, fnStackVersion, onChangeVersion,
      onSelectResultTab, onSelectFile, onCopyCode, onDownloadFile, onDownloadZip,
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
    <div class="sg-panel-title">소스젠 목록 (DDL 입력) <span class="sg-panel-sub">(탭 하나 = 테이블 하나. 입력하면 스키마·테이블·클래스명이 자동 추출됩니다)</span>
      <span style="margin-left:auto;display:flex;gap:6px;">
        <button type="button" class="sg-btn sg-btn-accent" @click="onTemplateModalOpen">📥 프로젝트템플릿다운로드</button>
        <button type="button" class="sg-btn sg-btn-accent" @click="onProjectUpload">📤 프로젝트업로드</button>
      </span>
    </div>
    <div class="sg-ddl-tabs">
      <button v-for="(t, i) in tabs" :key="t.tabNo" class="sg-ddl-tab"
        :class="{ active: uiState.activeTabIdx===i, 'has-data': fnHasData(i) }"
        @click="onSelectTab(i)">
        탭 {{ t.tabNo }}<span v-if="fnHasData(i)" class="sg-ddl-dot"></span>
      </button>
    </div>

    <div class="sg-opts">
      <div class="sg-opt-row"><label>Schema</label><input v-model="cfCurTab.schemaNm" :readonly="cfReadonly" placeholder="(DDL에서 자동)" /></div>
      <div class="sg-opt-row"><label>Table</label><input v-model="cfCurTab.tableNm" readonly placeholder="(DDL에서 자동)" /></div>
      <div class="sg-opt-row"><label>Sub Package</label>
        <input v-model="cfCurTab.subPackage" :readonly="cfReadonly" placeholder="(테이블명 접두어 자동)"
          title="Base Package 하위 폴더. 예: 테이블 zz_exam1 -> zz" class="sg-mono" /></div>
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

  <!-- ═══ 생성 결과 뷰어 ═══ -->
  <div class="sg-panel" v-if="cfTotalFileCount">
    <div class="sg-panel-title">
      생성 결과 — 탭 {{ uiState.resultTabIdx + 1 }}
      <span class="sg-panel-sub">({{ Object.keys(cfResultTab.files).length }}개 파일 / 전체 {{ cfTotalFileCount }}개)</span>
      <span v-if="cfResultTab.generatedAt" class="sg-gen-at">생성: {{ cfResultTab.generatedAt }}</span>
    </div>

    <div class="sg-ddl-tabs" v-if="cfResultTabIndices.length > 1">
      <button v-for="i in cfResultTabIndices" :key="'r'+i" class="sg-ddl-tab"
        :class="{ active: uiState.resultTabIdx===i }" @click="onSelectResultTab(i)">
        탭 {{ i+1 }} ({{ Object.keys(tabs[i].files).length }})
      </button>
    </div>

    <div class="sg-result-body">
      <div class="sg-files">
        <template v-for="grp in cfGroupedFiles" :key="grp.title">
          <div class="sg-file-grp">{{ grp.title }}</div>
          <button class="sg-file-btn" v-for="fn in grp.files" :key="fn"
            :class="{ active: uiState.activeFile===fn }" @click="onSelectFile(fn)"
            :title="fn">{{ fn }}</button>
        </template>
      </div>
      <div class="sg-code-pane">
        <div class="sg-file-info" v-if="uiState.activeFile">
          <span class="sg-file-path">{{ uiState.activeFile }}</span>
          <div class="sg-file-actions">
            <span v-if="uiState.copied" class="sg-copied">✓ 복사됨</span>
            <button class="btn btn-sm btn-secondary" @click="onCopyCode">복사</button>
            <button class="btn btn-sm btn-secondary" @click="onDownloadFile">다운로드</button>
          </div>
        </div>
        <pre v-if="uiState.activeFile" ref="codeBoxRef" :key="uiState.resultTabIdx + '|' + uiState.activeFile"
          class="sg-code line-numbers" :class="'language-' + fnLangOf(uiState.activeFile)"><code
          :class="'language-' + fnLangOf(uiState.activeFile)">{{ cfResultTab.files[uiState.activeFile] }}</code></pre>
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

  <!-- ═══ 프로젝트 템플릿 다운로드 모달 (미구현 — 항목 클릭 시 준비중 안내만) ═══ -->
  <fo-modal :show="uiState.templateModalOpen" title="프로젝트 템플릿 다운로드" width="480px"
    box-pad="20px" @close="onTemplateModalClose">
    <div class="sg-view-toggle" style="margin-bottom:14px;">
      <button type="button" :class="{ active: uiState.templateDbTab==='ORACLE' }" @click="onTemplateDbTab('ORACLE')">Oracle</button>
      <button type="button" :class="{ active: uiState.templateDbTab==='POSTGRESQL' }" @click="onTemplateDbTab('POSTGRESQL')">PostgreSQL</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      <button v-for="t in cfTemplateItems" :key="t.key" type="button" class="sg-sample-btn"
        style="width:100%;justify-content:space-between;" @click="onTemplateItemClick">
        {{ t.label }}<span class="sg-sample-desc">{{ t.desc }}</span>
      </button>
    </div>
  </fo-modal>
</div>
`,
};
