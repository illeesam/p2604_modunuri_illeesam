'use strict';
/**
 * AdminData.js → dp_* 테이블 INSERT SQL 생성기
 *
 * 사용법:
 *   node _doc/generate_sample_sql_dp.js
 *   → _doc/sample_data_dp.sql 생성
 *
 * 생성 순서:
 *   1. dp_widget_lib  (170건 — widgetLibs)
 *   2. dp_widget      (170건 — widgetLibs 동일 데이터로 위젯 인스턴스)
 *   3. dp_ui          (5건  — HOME/PRODUCT/MYPAGE/MOBILE/EVENT)
 *   4. dp_area        (11건 — HOME_BANNER / HOME_PRODUCT / HOME_CHART 등)
 *   5. dp_ui_area     (각 UI↔Area 매핑)
 *   6. dp_panel       (77건 — displays 각 항목)
 *   7. dp_area_panel  (77건 — Area↔Panel 매핑)
 *   8. dp_panel_item  (77×5 = 385건 — displays[].rows)
 */

const fs   = require('fs');
const path = require('path');

global.Vue    = { reactive: (x) => x };
global.window = {};
require(path.resolve(__dirname, '../pages/admin/AdminData.js'));
const D = global.window.adminData;

// ── 상수 ─────────────────────────────────────────────
const SCHEMA   = 'shopjoy_2604';
const REG_BY   = 'SYSTEM';
const REG_DATE = '2026-04-20 00:00:00';
const SITE_ID  = 'SITE000001';

// ── ID 헬퍼 ──────────────────────────────────────────
const mkId = (prefix, n) => `${prefix}${String(n).padStart(6, '0')}`;

// ── SQL 유틸 ─────────────────────────────────────────
const esc = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number')  return String(v);
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  return `'${String(v).replace(/'/g, "''")}'`;
};
const dv  = (s) => s || null;
const tsv = (s) => s ? String(s).replace('T', ' ') : null;

const lines = [];
const section = (title) => {
  lines.push('');
  lines.push('-- ================================================================');
  lines.push(`-- ${title}`);
  lines.push('-- ================================================================');
};
const insert = (table, cols, vals) =>
  lines.push(`INSERT INTO ${SCHEMA}.${table} (${cols.join(', ')}) VALUES (${vals.map(esc).join(', ')}) ON CONFLICT DO NOTHING;`);

// ── 위젯유형 코드 맵 ──────────────────────────────────
const statusStMap = { '활성': 'ACTIVE', '비활성': 'INACTIVE' };
const dispStMap   = { '활성': 'SHOW',   '비활성': 'HIDE' };
const visMap      = { '항상 표시': '^PUBLIC^', '로그인 필요': '^MEMBER^', '비로그인 전용': '^GUEST^', '로그인+VIP': '^VIP^', '로그인+등급': '^MEMBER^' };

// ── 위젯라이브러리 libId → DB ID 맵 ─────────────────
const libIdMap = {};

// ────────────────────────────────────────────────────
// 1. dp_widget_lib
// ────────────────────────────────────────────────────
section('1. dp_widget_lib — 위젯 라이브러리 (170건)');
D.widgetLibs.forEach((lib, i) => {
  const id = mkId('WL', i + 1);
  libIdMap[lib.libId] = id;

  // config_schema — 타입별 필수 키 JSON 샘플
  const configMap = {
    image_banner:   '{"imageUrl":"","altText":"","linkUrl":"","clickAction":"navigate"}',
    product_slider: '{"productIds":"","clickAction":"navigate"}',
    product:        '{"productIds":"","clickAction":"navigate"}',
    cond_product:   '{"condCategory":"","condSort":"newest","condLimit":8}',
    chart_bar:      '{"chartTitle":"","chartLabels":"","chartValues":""}',
    chart_line:     '{"chartTitle":"","chartLabels":"","chartValues":""}',
    chart_pie:      '{"chartTitle":"","chartLabels":"","chartValues":""}',
    text_banner:    '{"textContent":"","bgColor":"#ffffff","textColor":"#222222"}',
    info_card:      '{"infoTitle":"","infoBody":""}',
    popup:          '{"imageUrl":"","linkUrl":"","popupWidth":600,"popupHeight":400}',
    file:           '{"fileUrl":"","fileLabel":""}',
    file_list:      '{"fileListJson":"[]"}',
    coupon:         '{"couponCode":"","couponDesc":""}',
    html_editor:    '{"htmlContent":""}',
    event_banner:   '{"eventId":""}',
    cache_banner:   '{"cacheDesc":"","cacheAmount":0}',
    widget_embed:   '{"embedCode":""}',
    barcode:        '{"codeValue":"","codeFormat":"CODE128"}',
    countdown:      '{"countdownTarget":"","countdownTitle":""}',
    markdown:       '{"markdownContent":""}',
    video_player:   '{"videoUrl":"","videoType":"youtube"}',
    map_widget:     '{"mapAddress":"","mapLat":"","mapLng":""}',
  };

  const usedPaths = (lib.usedPaths || []).join(',');
  const configSchema = configMap[lib.widgetType] || '{}';

  insert('dp_widget_lib',
    ['widget_lib_id','site_id','widget_code','widget_nm','widget_type_cd',
     'widget_lib_desc','disp_path','config_schema','is_system','sort_ord',
     'use_yn','reg_by','reg_date'],
    [id, SITE_ID, `WGT_${String(lib.libId).padStart(3,'0')}`, lib.name, lib.widgetType,
     dv(lib.desc), dv(usedPaths) || null, configSchema, 'N', lib.libId,
     statusStMap[lib.status] === 'INACTIVE' ? 'N' : 'Y', REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────
// 2. dp_widget — 위젯 인스턴스 (widgetLibs 기반)
// ────────────────────────────────────────────────────
section('2. dp_widget — 위젯 인스턴스 (170건)');
D.widgetLibs.forEach((lib, i) => {
  const id      = mkId('WG', i + 1);
  const libId   = libIdMap[lib.libId];

  // widget_config_json — 타입별 설정 직렬화
  let cfg = {};
  if (lib.imageUrl)       cfg.imageUrl = lib.imageUrl;
  if (lib.altText)        cfg.altText  = lib.altText;
  if (lib.linkUrl)        cfg.linkUrl  = lib.linkUrl;
  if (lib.productIds)     cfg.productIds = lib.productIds;
  if (lib.chartTitle)     cfg.chartTitle = lib.chartTitle;
  if (lib.chartLabels)    cfg.chartLabels = lib.chartLabels;
  if (lib.chartValues)    cfg.chartValues = lib.chartValues;
  if (lib.textContent)    cfg.textContent = lib.textContent;
  if (lib.bgColor)        cfg.bgColor  = lib.bgColor;
  if (lib.textColor)      cfg.textColor = lib.textColor;
  if (lib.infoTitle)      cfg.infoTitle = lib.infoTitle;
  if (lib.infoBody)       cfg.infoBody = lib.infoBody;
  if (lib.popupWidth)     cfg.popupWidth = lib.popupWidth;
  if (lib.popupHeight)    cfg.popupHeight = lib.popupHeight;
  if (lib.fileUrl)        cfg.fileUrl  = lib.fileUrl;
  if (lib.fileLabel)      cfg.fileLabel = lib.fileLabel;
  if (lib.fileListJson)   cfg.fileListJson = lib.fileListJson;
  if (lib.couponCode)     cfg.couponCode = lib.couponCode;
  if (lib.couponDesc)     cfg.couponDesc = lib.couponDesc;
  if (lib.htmlContent)    cfg.htmlContent = lib.htmlContent;
  if (lib.eventId)        cfg.eventId  = lib.eventId;
  if (lib.cacheDesc)      cfg.cacheDesc = lib.cacheDesc;
  if (lib.cacheAmount)    cfg.cacheAmount = lib.cacheAmount;
  if (lib.embedCode)      cfg.embedCode = lib.embedCode;
  if (lib.condCategory !== undefined) cfg.condCategory = lib.condCategory;
  if (lib.condSort)       cfg.condSort = lib.condSort;
  if (lib.condLimit)      cfg.condLimit = lib.condLimit;
  const cfgJson = Object.keys(cfg).length ? JSON.stringify(cfg) : null;

  insert('dp_widget',
    ['widget_id','widget_lib_id','site_id','widget_nm','widget_type_cd',
     'widget_desc','title_show_yn','widget_lib_ref_yn','widget_config_json',
     'sort_ord','use_yn','disp_env','reg_by','reg_date'],
    [id, libId, SITE_ID, lib.name, lib.widgetType,
     dv(lib.desc), lib.titleYn === 'Y' ? 'Y' : 'N', 'Y', dv(cfgJson),
     lib.libId, statusStMap[lib.status] === 'INACTIVE' ? 'N' : 'Y',
     '^PROD^', REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────
// 3. dp_ui — UI 화면 정의 (5건)
// ────────────────────────────────────────────────────
section('3. dp_ui — UI 화면 정의');
const uiDefs = [
  { id:'DPUI000001', cd:'PC_HOME',     nm:'PC 메인홈',      desc:'PC 메인 홈페이지 UI', device:'PC',     path:'/index',   ord:1 },
  { id:'DPUI000002', cd:'PC_PRODUCT',  nm:'PC 상품상세',    desc:'PC 상품 상세 페이지 UI', device:'PC', path:'/product', ord:2 },
  { id:'DPUI000003', cd:'PC_MYPAGE',   nm:'PC 마이페이지',  desc:'PC 마이페이지 UI', device:'PC',        path:'/my',      ord:3 },
  { id:'DPUI000004', cd:'MOBILE_HOME', nm:'모바일 메인홈',  desc:'모바일 메인 홈 UI', device:'MOBILE',   path:'/m/index', ord:4 },
  { id:'DPUI000005', cd:'PC_EVENT',    nm:'PC 이벤트',      desc:'PC 이벤트 페이지 UI', device:'PC',     path:'/event',   ord:5 },
];
const uiIdMap = {};
uiDefs.forEach(u => {
  uiIdMap[u.cd] = u.id;
  insert('dp_ui',
    ['ui_id','site_id','ui_cd','ui_nm','ui_desc','device_type_cd','ui_path',
     'sort_ord','use_yn','reg_by','reg_date'],
    [u.id, SITE_ID, u.cd, u.nm, u.desc, u.device, u.path, u.ord, 'Y', REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────
// 4. dp_area — 영역 정의 (11건)
// ────────────────────────────────────────────────────
section('4. dp_area — 영역 정의');
// area_cd → (ui_cd, area_nm, area_type, desc, disp_path)
const areaDefs = [
  { cd:'HOME_BANNER',  ui:'PC_HOME',    nm:'홈 메인배너 영역',    type:'FULL',    desc:'홈 상단 메인 배너 슬라이드 영역', path:'FRONT.홈.메인배너' },
  { cd:'HOME_PRODUCT', ui:'PC_HOME',    nm:'홈 상품 영역',        type:'FULL',    desc:'홈 상품 추천/베스트/특가 영역',   path:'FRONT.홈.상품영역' },
  { cd:'HOME_CHART',   ui:'PC_HOME',    nm:'홈 차트 영역',        type:'FULL',    desc:'홈 판매/통계 차트 영역',           path:'FRONT.홈.차트영역' },
  { cd:'HOME_EVENT',   ui:'PC_HOME',    nm:'홈 이벤트 영역',      type:'FULL',    desc:'홈 이벤트/프로모션 배너 영역',     path:'FRONT.홈.이벤트영역' },
  { cd:'SIDEBAR_TOP',  ui:'PC_HOME',    nm:'사이드바 상단 영역',  type:'SIDEBAR', desc:'PC 사이드바 상단 위젯 영역',       path:'FRONT.홈.사이드바상단' },
  { cd:'SIDEBAR_MID',  ui:'PC_HOME',    nm:'사이드바 중간 영역',  type:'SIDEBAR', desc:'PC 사이드바 중간 위젯 영역',       path:'FRONT.홈.사이드바중단' },
  { cd:'SIDEBAR_BOT',  ui:'PC_HOME',    nm:'사이드바 하단 영역',  type:'SIDEBAR', desc:'PC 사이드바 하단 위젯 영역',       path:'FRONT.홈.사이드바하단' },
  { cd:'PRODUCT_TOP',  ui:'PC_PRODUCT', nm:'상품 상단 영역',      type:'FULL',    desc:'상품 상세 상단 노출 영역',         path:'FRONT.상품상세.상단' },
  { cd:'PRODUCT_BTM',  ui:'PC_PRODUCT', nm:'상품 하단 영역',      type:'FULL',    desc:'상품 상세 하단 추천/리뷰 영역',    path:'FRONT.상품상세.하단' },
  { cd:'MY_PAGE',      ui:'PC_MYPAGE',  nm:'마이페이지 영역',     type:'FULL',    desc:'마이페이지 위젯 영역',             path:'FRONT.마이페이지' },
  { cd:'FOOTER',       ui:'PC_HOME',    nm:'푸터 영역',           type:'FULL',    desc:'사이트 공통 푸터 위젯 영역',       path:'FRONT.공통.푸터' },
];
const areaIdMap = {};
areaDefs.forEach((a, i) => {
  const id = mkId('DPAR', i + 1);
  areaIdMap[a.cd] = id;
  const uiId = uiIdMap[a.ui];
  insert('dp_area',
    ['area_id','ui_id','site_id','area_cd','area_nm','area_type_cd',
     'area_desc','disp_path','use_yn','reg_by','reg_date'],
    [id, uiId, SITE_ID, a.cd, a.nm, a.type, a.desc, a.path, 'Y', REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────
// 5. dp_ui_area — UI↔영역 매핑
// ────────────────────────────────────────────────────
section('5. dp_ui_area — UI-영역 매핑');
// UI별 연결 영역 목록 (정렬순서 포함)
const uiAreaLinks = [
  // PC_HOME: HOME_BANNER(1) HOME_PRODUCT(2) HOME_CHART(3) HOME_EVENT(4) SIDEBAR_TOP(5) SIDEBAR_MID(6) SIDEBAR_BOT(7) FOOTER(8)
  { ui:'PC_HOME',    area:'HOME_BANNER',  ord:1, vis:'^PUBLIC^' },
  { ui:'PC_HOME',    area:'HOME_PRODUCT', ord:2, vis:'^PUBLIC^' },
  { ui:'PC_HOME',    area:'HOME_CHART',   ord:3, vis:'^PUBLIC^' },
  { ui:'PC_HOME',    area:'HOME_EVENT',   ord:4, vis:'^PUBLIC^' },
  { ui:'PC_HOME',    area:'SIDEBAR_TOP',  ord:5, vis:'^PUBLIC^' },
  { ui:'PC_HOME',    area:'SIDEBAR_MID',  ord:6, vis:'^PUBLIC^' },
  { ui:'PC_HOME',    area:'SIDEBAR_BOT',  ord:7, vis:'^PUBLIC^' },
  { ui:'PC_HOME',    area:'FOOTER',       ord:8, vis:'^PUBLIC^' },
  // PC_PRODUCT: PRODUCT_TOP(1) PRODUCT_BTM(2)
  { ui:'PC_PRODUCT', area:'PRODUCT_TOP',  ord:1, vis:'^PUBLIC^' },
  { ui:'PC_PRODUCT', area:'PRODUCT_BTM',  ord:2, vis:'^PUBLIC^' },
  // PC_MYPAGE: MY_PAGE(1)
  { ui:'PC_MYPAGE',  area:'MY_PAGE',      ord:1, vis:'^MEMBER^' },
  // MOBILE_HOME: HOME_BANNER(1) HOME_PRODUCT(2) HOME_EVENT(3) FOOTER(4)
  { ui:'MOBILE_HOME',area:'HOME_BANNER',  ord:1, vis:'^PUBLIC^' },
  { ui:'MOBILE_HOME',area:'HOME_PRODUCT', ord:2, vis:'^PUBLIC^' },
  { ui:'MOBILE_HOME',area:'HOME_EVENT',   ord:3, vis:'^PUBLIC^' },
  { ui:'MOBILE_HOME',area:'FOOTER',       ord:4, vis:'^PUBLIC^' },
  // PC_EVENT: HOME_EVENT(1)
  { ui:'PC_EVENT',   area:'HOME_EVENT',   ord:1, vis:'^PUBLIC^' },
];
let uiAreaSeq = 1;
uiAreaLinks.forEach(lk => {
  const id     = mkId('DPUA', uiAreaSeq++);
  const uiId   = uiIdMap[lk.ui];
  const areaId = areaIdMap[lk.area];
  insert('dp_ui_area',
    ['ui_area_id','ui_id','area_id','area_sort_ord','visibility_targets',
     'disp_env','disp_yn','use_yn','reg_by','reg_date'],
    [id, uiId, areaId, lk.ord, lk.vis, '^PROD^', 'Y', 'Y', REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────
// 6. dp_panel — 패널 (displays 77건)
// ────────────────────────────────────────────────────
section('6. dp_panel — 패널 (77건)');
const panelIdMap = {};  // dispId → DB panel_id
D.displays.forEach((dp, i) => {
  const id  = mkId('DPPL', i + 1);
  panelIdMap[dp.dispId] = id;

  const vis     = visMap[dp.condition] || '^PUBLIC^';
  const status  = dispStMap[dp.status] || 'SHOW';
  const dpPath  = `FRONT.${dp.area}`;

  insert('dp_panel',
    ['panel_id','site_id','panel_nm','panel_type_cd','disp_path',
     'visibility_targets','use_yn','use_start_date','use_end_date',
     'disp_panel_status_cd','reg_by','reg_date'],
    [id, SITE_ID, dp.name, dp.widgetType, dpPath,
     vis, 'Y', dv(dp.dispStartDate), dv(dp.dispEndDate),
     status, REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────
// 7. dp_area_panel — Area↔Panel 매핑 (77건)
// ────────────────────────────────────────────────────
section('7. dp_area_panel — 영역-패널 매핑 (77건)');
D.displays.forEach((dp, i) => {
  const id      = mkId('DPAP', i + 1);
  const areaId  = areaIdMap[dp.area];
  const panelId = panelIdMap[dp.dispId];
  const vis     = visMap[dp.condition] || '^PUBLIC^';
  const status  = dp.status === '활성' ? 'Y' : 'N';

  insert('dp_area_panel',
    ['area_panel_id','area_id','panel_id','panel_sort_ord',
     'visibility_targets','disp_yn','disp_start_date','disp_end_date',
     'disp_env','use_yn','reg_by','reg_date'],
    [id, areaId, panelId, dp.sortOrder || i + 1,
     vis, status, dv(dp.dispStartDate), dv(dp.dispEndDate),
     '^PROD^', 'Y', REG_BY, REG_DATE]
  );
});

// ────────────────────────────────────────────────────
// 8. dp_panel_item — 패널 항목 (displays[].rows = 385건)
// ────────────────────────────────────────────────────
section('8. dp_panel_item — 패널 항목 (385건)');
// widgetType → 첫 번째 매칭 libId 맵 (lib_ref_yn = Y)
const typeLibMap = {};
D.widgetLibs.forEach(lib => {
  if (!typeLibMap[lib.widgetType]) typeLibMap[lib.widgetType] = libIdMap[lib.libId];
});

let itemSeq = 1;
D.displays.forEach((dp) => {
  const panelId = panelIdMap[dp.dispId];
  const panelVis = visMap[dp.condition] || '^PUBLIC^';

  (dp.rows || []).forEach((row) => {
    const id        = mkId('DPPI', itemSeq++);
    const wLibId    = typeLibMap[row.widgetType] || null;
    const cfgJson   = JSON.stringify({
      clickAction: row.clickAction,
      clickTarget: row.clickTarget,
    });

    insert('dp_panel_item',
      ['panel_item_id','panel_id','widget_lib_id','widget_type_cd',
       'widget_title','title_show_yn','widget_lib_ref_yn',
       'content_type_cd','item_sort_ord','widget_config_json',
       'visibility_targets','disp_yn','disp_env',
       'use_yn','reg_by','reg_date'],
      [id, panelId, wLibId, row.widgetType,
       row.widgetNm, row.titleYn || 'N', wLibId ? 'Y' : 'N',
       'WIDGET', row.sortOrder || 0, cfgJson,
       panelVis, dp.status === '활성' ? 'Y' : 'N', '^PROD^',
       'Y', REG_BY, REG_DATE]
    );
  });
});

// ────────────────────────────────────────────────────
// 출력
// ────────────────────────────────────────────────────
const header = [
  '-- ================================================================',
  '-- AdminData.js → dp_* 전시관리 샘플 데이터',
  '-- 생성: generate_sample_sql_dp.js',
  '-- 스키마: shopjoy_2604',
  '-- 순서: dp_widget_lib → dp_widget → dp_ui → dp_area',
  '--        → dp_ui_area → dp_panel → dp_area_panel → dp_panel_item',
  '-- ================================================================',
  'SET search_path TO shopjoy_2604;',
  '',
].join('\n');

const output = header + lines.join('\n') + '\n';
const outFile = path.resolve(__dirname, 'sample_data_dp.sql');
fs.writeFileSync(outFile, output, 'utf8');

const cnt = lines.filter(l => l.startsWith('INSERT')).length;
console.log(`완료: ${cnt}개 INSERT → ${outFile}`);
