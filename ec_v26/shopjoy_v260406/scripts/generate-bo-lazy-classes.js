/* generate-bo-lazy-classes.js — BO 화면 추가 시 사람이 손대는 파일을 이 파일 하나로 통일한다.
 *
 * 새 BO 화면을 추가하면:
 *   1) 화면 소스 파일 작성 (pages/bo/... 또는 pages/co/...)
 *   2) 이 파일 상단의 BO_APP_COMP_PAGE 에 `pageId: 'kebab-태그명'` 한 줄 추가
 *   3) `npm run gen-bo-lazy` 실행 (또는 VS Code Task)
 * 이게 끝이다 — lib/app/boAppLazyClasses.js 는 이 스크립트가 매번 전체를 다시 만드는
 * 산출물이라 절대 손으로 고치지 않는다. boAppComp.js(eager 등록 로직)도 lazy 화면은
 * 건드릴 필요가 없다(자동탐지 + 이 맵으로 처리됨).
 *
 * 원리: "클래스명 -> 파일경로" 맵은 사람이 외워서 적을 정보가 아니다 —
 *   1) pages/bo, pages/co(FO/BO 공용, 예: OdOrderKanban.js) 아래 .js 파일을 전부 훑고
 *   2) bo.html 에 eager <script> 로 이미 걸린 파일은 제외(그건 lazy 대상이 아니므로)
 *   3) 남은 파일 각각을 열어서 실제로 `window.ClassName = `(또는 IIFE 파라미터 별칭
 *      `global.ClassName = `) 로 뭘 등록하는지 직접 읽는다
 *
 * 사용법: node scripts/generate-bo-lazy-classes.js   (= npm run gen-bo-lazy)
 *
 * 실행하면 콘솔에 [1]~[3] 단계 + [완료] 요약이 순서대로 찍힌다:
 *   [1] 대상 파일 수집 (pages/bo+pages/co 스캔 → eager 제외 → lazy 대상 확정)
 *   [2] 각 파일에서 window.ClassName= 등록명 추출
 *   [3] boAppLazyClasses.js 파일 생성
 *   [완료] 페이지 N개, lazy 클래스 M개
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// 2026-09-05: 이 스크립트가 찍는 모든 로그 앞에 파일명 태그를 자동으로 붙인다(console.log/warn/error
// 를 한 번만 감싸서, 개별 호출부를 전부 고칠 필요 없이 항상 적용되게 함). 맨 앞 개행(\n)은
// 그대로 유지해서 기존 줄바꿈 스타일(단계 사이 빈 줄)이 안 깨지게 한다.
const TAG = '[generate-bo-lazy-classes.js]';
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

/* ── 사람이 결정해야 하는 부분: pageId -> kebab 태그명. "이 화면을 메뉴/URL 에서 어떤
   pageId 로 부를지"는 파일명에서 기계적으로 못 뽑는, 사람이 짓는 이름이다.
   새 BO 화면을 추가할 때 여기 한 줄만 추가하면 된다. (구 lib/app/boAppCompPage.js 를
   이 파일로 흡수 — 그 파일은 삭제했다) */
const BO_APP_COMP_PAGE = {
  dashboard: 'dashboard-bo-ec' + '{BO_SITE_NO}', // 런타임에 window.BO_SITE_NO 로 치환(아래 출력부 참조)
  appMonitorDashboard: 'dashboard-bo-app-monitor',
  mbMemberMng: 'mb-member-mng',
  mbMemberDtl: 'mb-member-dtl',
  mbMemGradeMng: 'mb-mem-grade-mng',
  mbMemGroupMng: 'mb-mem-group-mng',
  pdProdMng: 'pd-prod-mng',
  pdProdDtl: 'pd-prod-dtl',
  pdProdHist: 'pd-prod-hist',
  pdDlivTmpltMng: 'pd-dliv-tmplt-mng',
  pdSingleProdMng: 'pd-single-prod-mng',
  pdOptionProdMng: 'pd-option-prod-mng',
  pdGroupProdMng: 'pd-group-prod-mng',
  pdSetProdMng: 'pd-set-prod-mng',
  pdGiftProdMng: 'pd-gift-prod-mng',
  pdReviewMng: 'pd-review-mng',
  pdQnaMng: 'pd-qna-mng',
  pdRestockNotiMng: 'pd-restock-noti-mng',
  pdTagMng: 'pd-tag-mng',
  odOrderKanban: 'od-order-kanban',
  odOrderMng: 'od-order-mng',
  odOrderItemMng: 'od-order-item-mng',
  odOrderDtl: 'od-order-dtl',
  odOrderItemDtl: 'od-order-item-dtl',
  odClaimMng: 'od-claim-mng',
  odClaimDtl: 'od-claim-dtl',
  odDlivMng: 'od-dliv-mng',
  odDlivDtl: 'od-dliv-dtl',
  odCartMng: 'od-cart-mng',
  pmCouponMng: 'pm-coupon-mng',
  pmCouponDtl: 'pm-coupon-dtl',
  pmCacheMng: 'pm-cache-mng',
  pmCacheDtl: 'pm-cache-dtl',
  dpDispPanelMng: 'dp-disp-panel-mng',
  dpDispAreaPreview: 'dp-disp-area-preview',
  dpDispAreaMng: 'dp-disp-area-mng',
  dpDispUiPreview: 'dp-disp-ui-preview',
  dpDispPanelPreview: 'dp-disp-panel-preview',
  dpDispWidgetPreview: 'dp-disp-widget-preview',
  dpDispAreaDtl: 'dp-disp-area-dtl',
  dpDispUiMng: 'dp-disp-ui-mng',
  dpDispUiDtl: 'dp-disp-ui-dtl',
  dpDispWidgetMng: 'dp-disp-widget-mng',
  dpDispWidgetDtl: 'dp-disp-widget-dtl',
  dpDispPanelDtl: 'dp-disp-panel-dtl',
  dpDispWidgetLibMng: 'dp-disp-widget-lib-mng',
  dpDispWidgetLibDtl: 'dp-disp-widget-lib-dtl',
  dpDispWidgetLibPreview: 'dp-disp-widget-lib-preview',
  stConfigMng: 'st-config-mng',
  stDlivFeePolicyMng: 'st-dliv-fee-policy-mng',
  stRawMng: 'st-raw-mng',
  stSettleAdjMng: 'st-settle-adj-mng',
  stSettleEtcAdjMng: 'st-settle-etc-adj-mng',
  stSettleCloseMng: 'st-settle-close-mng',
  stSettlePayMng: 'st-settle-pay-mng',
  stStatusMng: 'st-status-mng',
  stReconOrderMng: 'st-recon-order-mng',
  stReconPayMng: 'st-recon-pay-mng',
  stReconClaimMng: 'st-recon-claim-mng',
  stReconVendorMng: 'st-recon-vendor-mng',
  stErpGenMng: 'st-erp-gen-mng',
  stErpViewMng: 'st-erp-view-mng',
  stErpReconMng: 'st-erp-recon-mng',
  pmEventMng: 'pm-event-mng',
  pmEventDtl: 'pm-event-dtl',
  pmPlanMng: 'pm-plan-mng',
  pmPlanDtl: 'pm-plan-dtl',
  pmDiscntMng: 'pm-discnt-mng',
  pmDiscntDtl: 'pm-discnt-dtl',
  pmSaveMng: 'pm-save-mng',
  pmSaveDtl: 'pm-save-dtl',
  pmGiftMng: 'pm-gift-mng',
  pmGiftDtl: 'pm-gift-dtl',
  pmVoucherMng: 'pm-voucher-mng',
  pmVoucherDtl: 'pm-voucher-dtl',
  mbCustInfoMng: 'mb-cust-info-mng',
  syContactMng: 'sy-contact-mng',
  syContactDtl: 'sy-contact-dtl',
  cmChattMng: 'cm-chatt-mng',
  cmChattDtl: 'cm-chatt-dtl',
  cmChattKanban: 'cm-chatt-kanban',
  sySiteMng: 'sy-site-mng',
  sySiteDtl: 'sy-site-dtl',
  syCodeMng: 'sy-code-mng',
  syCodeDtl: 'sy-code-dtl',
  syBrandMng: 'sy-brand-mng',
  syAttachMng: 'sy-attach-mng',
  syTemplateMng: 'sy-template-mng',
  syTemplateDtl: 'sy-template-dtl',
  syVendorMng: 'sy-vendor-mng',
  syVendorDtl: 'sy-vendor-dtl',
  syVendorUserMng: 'sy-vendor-user-mng',
  syVendorInfoMng: 'sy-vendor-info-mng',
  pdCategoryMng: 'pd-category-mng',
  pdCategoryDtl: 'pd-category-dtl',
  pdCategoryProdMng: 'pd-category-prod-mng',
  pdOptCodeMng: 'pd-opt-code-mng-page',
  mdCbSymbolMng: 'md-cb-symbol-mng',
  mdCbYarnMng: 'md-cb-yarn-mng',
  mdCbPatternMng: 'md-cb-pattern-mng',
  mdSgProjectMng: 'md-sg-project-mng',
  mdSgGenHistMng: 'md-sg-gen-hist-mng',
  mdSgDownloadHistMng: 'md-sg-download-hist-mng',
  mdSgStackMng: 'md-sg-stack-mng',
  syUserMng: 'sy-user-mng',
  syUserDtl: 'sy-user-dtl',
  syBatchMng: 'sy-batch-mng',
  syBatchDtl: 'sy-batch-dtl',
  syDeptMng: 'sy-dept-mng',
  syMenuMng: 'sy-menu-mng',
  syRoleMng: 'sy-role-mng',
  cmNoticeMng: 'cm-notice-mng',
  cmNoticeDtl: 'cm-notice-dtl',
  cmFaqMng: 'cm-faq-mng',
  cmFaqDtl: 'cm-faq-dtl',
  cmBlogMng: 'cm-blog-mng',
  cmDashboardMng: 'cm-dashboard-mng',
  cmDashboardItemMng: 'cm-dashboard-item-mng',
  cmDashboardDataMng: 'cm-dashboard-data-mng',
  cmDashboardLayoutMng: 'cm-dashboard-layout-mng',
  cmDashboardMyMng: 'cm-dashboard-my-mng',
  cmDashboardMenuMng: 'cm-dashboard-menu-mng',
  cmDashboardSysMenuMng: 'cm-dashboard-sys-menu-mng',
  cmPopupMng: 'cm-popup-mng',
  syAlarmMng: 'sy-alarm-mng',
  syAlarmDtl: 'sy-alarm-dtl',
  syPropMng: 'sy-prop-mng',
  syPathMng: 'sy-path-mng',
  syI18nMng: 'sy-i18n-mng',
  syBbmMng: 'sy-bbm-mng',
  syBbmDtl: 'sy-bbm-dtl',
  syBbsMng: 'sy-bbs-mng',
  syBbsDtl: 'sy-bbs-dtl',
  syMemberLoginHist: 'sy-member-login-hist',
  syUserLoginHist: 'sy-user-login-hist',
  syExceldownMng: 'sy-exceldown-mng',
  syApiLogMng: 'sy-api-log-mng',
  sySendMsgLog: 'sy-send-msg-log-mng',
  syPostman: 'sy-postman',
  zdInfDashboard: 'zd-inf-dashboard',
  zdStore: 'zd-store',
  zdLocalStorage: 'zd-local-storage',
  zdTestSnsLoginKakao: 'zd-test-sns-login-kakao',
  zdTestSnsLoginGoogle: 'zd-test-sns-login-google',
  zdTestPayTossWidget: 'zd-test-pay-toss-widget',
  zdTestPayTossBrandpay: 'zd-test-pay-toss-brandpay',
  zdTestPayKakaopay: 'zd-test-pay-kakaopay',
  zdTestPayNaverpay: 'zd-test-pay-naverpay',
  zdTestMapKakao: 'zd-test-map-kakao',
  zdTestMapNaver: 'zd-test-map-naver',
  zdTestMapGoogle: 'zd-test-map-google',
  zdTestMailSmtp: 'zd-test-mail-smtp',
  zdTestSms: 'zd-test-sms',
  zdTestPushAlimFcm: 'zd-test-push-alim-fcm',
  zdTestPushAlimApns: 'zd-test-push-alim-apns',
  zdTestSnsLoginNaver: 'zd-test-sns-login-naver',
  zdTestAiChatbot: 'zd-test-ai-chatbot',
  zdTestChattingKakaoChannel: 'zd-test-chatting-kakao-channel',
  zdTestShareKakao: 'zd-test-share-kakao',
  zdTestChattingWebSocket: 'zd-test-chatting-web-socket',
  zdTestAppMsgSendReceiv: 'zd-test-app-msg-send-receiv',
  zdSimulMemberMng: 'zd-simul-member-mng',
  zdSimulCouponMng: 'zd-simul-coupon-mng',
  zdSimulDiscntMng: 'zd-simul-discnt-mng',
  zdSimulSaveMng: 'zd-simul-save-mng',
  zdSimulPlanMng: 'zd-simul-plan-mng',
  zdSimulEventMng: 'zd-simul-event-mng',
  zdSimulProdMng: 'zd-simul-prod-mng',
  zdSimulOrderMng: 'zd-simul-order-mng',
  zdSimulClaimMng: 'zd-simul-claim-mng',
  zdSimulKanbanMng: 'zd-simul-kanban-mng',
  zdSimulSettleMng: 'zd-simul-settle-mng',
  zdSimulUserMng: 'zd-simul-user-mng',
  zdSimulVendorMng: 'zd-simul-vendor-mng',
  zdSimulVoucherMng: 'zd-simul-voucher-mng',
  zdSimulLogMng: 'zd-simul-log-mng',
  // 알림 시뮬레이션 — 6개 메뉴가 같은 컴포넌트를 mode prop 만 바꿔 쓴다
  zdSimulNotiKakao: 'zd-simul-noti-mng',
  zdSimulNotiSms: 'zd-simul-noti-mng',
  zdSimulNotiMail: 'zd-simul-noti-mng',
  zdSimulNotiChat: 'zd-simul-noti-mng',
  zdSimulNotiNotice: 'zd-simul-noti-mng',
  zdSimulNotiError: 'zd-simul-noti-mng',
};

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
   `_ecOrderDtlState` 같은 언더스코어 접두어 내부 상태 변수는 클래스가 아니므로 제외
   (PascalCase, 대문자 시작만 클래스로 인정). */
function extractGlobalNames(filePath) {
  const src = fs.readFileSync(path.join(ROOT, filePath), 'utf8');
  // 2026-08-30 수정: ^[ \t]*(줄 시작) 앵커는 minify 된 코드(여러 문장이 한 줄에 붙음)에서
  // 깨진다 — verify-lazy-class-integrity.js 와 동일 수정. (generateBoLazyClasses 는 항상 원본
  // 소스만 스캔하므로 영향은 없지만, 세 스크립트가 같은 정규식을 공유하도록 통일해둔다.)
  const matches = [...src.matchAll(/(?<![\w.$])(?:window|global)\.([A-Z][A-Za-z0-9_]*)\s*=(?!=)/g)];
  return [...new Set(matches.map((m) => m[1]))];
}

function stringifyMap(obj, indent = '  ') {
  return Object.keys(obj).sort().map((k) => `${indent}${k}: ${JSON.stringify(obj[k])},`).join('\n');
}

function generate() {
  console.log('▶ 시작 : BO lazy 클래스 맵(lib/app/boAppLazyClasses.js) 자동 생성');

  console.log('\n[1] 대상 파일 수집');
  const onDisk = [...walkJsFiles('pages/bo'), ...walkJsFiles('pages/co')];
  console.log(`  ㄴ pages/bo + pages/co 재귀 스캔: ${onDisk.length}개 .js 파일`);
  const eager = new Set([
    ...eagerScriptSrcs('bo.html', 'pages/bo/'),
    ...eagerScriptSrcs('bo.html', 'pages/co/'),
  ]);
  console.log(`  ㄴ bo.html 에 이미 eager <script> 로 걸린 파일 제외 대상: ${eager.size}개`);
  const lazyFiles = onDisk.filter((f) => !eager.has(f));
  console.log(`  ㄴ 남은 lazy 대상 파일: ${lazyFiles.length}개`);

  console.log('\n[2] 각 파일에서 window.ClassName= 등록명 추출');
  const classMap = {};
  const skipped = [];
  lazyFiles.forEach((f) => {
    const names = extractGlobalNames(f);
    if (names.length) names.forEach((cls) => { classMap[cls] = f; });
    else skipped.push(f);
  });
  console.log(`  ㄴ 클래스명 ${Object.keys(classMap).length}개 추출 완료(파일 1개가 여러 클래스를 등록하는 경우 포함)`);
  if (skipped.length) {
    console.warn(`  ㄴ ⚠️  window.ClassName= 패턴을 못 찾아 건너뜀(수동 확인 필요) ${skipped.length}개:`, skipped);
  }

  console.log('\n[3] boAppLazyClasses.js 파일 생성');
  // BO_APP_COMP_PAGE.dashboard 는 window.BO_SITE_NO 를 런타임에 읽어야 하므로, 문자열로
  // 정적으로 못 굳히고 표현식('dashboard-bo-ec' + (window.BO_SITE_NO || '01'))으로 출력한다.
  const pageEntries = Object.keys(BO_APP_COMP_PAGE).sort().map((k) => {
    if (k === 'dashboard') return `  dashboard: 'dashboard-bo-ec' + (window.BO_SITE_NO || '01'),`;
    return `  ${k}: ${JSON.stringify(BO_APP_COMP_PAGE[k])},`;
  }).join('\n');

  const out = `/* ShopJoy BO - 페이지 라우팅 + lazy-load 클래스 맵 (scripts/generate-bo-lazy-classes.js 로 자동 생성 — 손으로 고치지 말 것!)
   BO 화면을 추가할 때 사람이 손대는 파일은 scripts/generate-bo-lazy-classes.js 하나뿐이다:
     1) 화면 소스 작성 (pages/bo/... 또는 pages/co/...)
     2) generate-bo-lazy-classes.js 상단 BO_APP_COMP_PAGE 에 pageId: 'kebab-태그명' 한 줄 추가
     3) node scripts/generate-bo-lazy-classes.js (또는 npm run gen-bo-lazy) 실행
   이 파일(boAppLazyClasses.js) 은 그 결과물이라 재생성될 때마다 전체가 덮어써진다.
   아래 각 블록 위 주석에 무슨 용도인지 설명해뒀다.
   예외(그대로 eager 유지, 자동탐지가 원리상 못 찾는 순수 JS 호출 파일): ZdSimulBase.js /
   CmDashboardWidgetUtil.js — bo.html 에 그대로 남아있어 이 스크립트가 자동으로 제외한다. */

/* BO_APP_COMP_PAGE — "pageId(화면 식별자) → kebab-case 태그명" 매핑.
   boAppBase.js 의 탭 라우팅(<component :is="PAGE_COMP_MAP[pageId]">)이 이 값으로
   실제 렌더링할 컴포넌트 태그를 찾는다. 새 화면 추가 시 사람이 결정해서 넣는 유일한 정보 —
   이 파일 말고 scripts/generate-bo-lazy-classes.js 상단의 BO_APP_COMP_PAGE 에 추가할 것. */
window.BO_APP_COMP_PAGE = {
${pageEntries}
};

/* BO_LAZY_CLASS_FILES — "클래스명(=window 전역명) → 스크립트 파일 경로" 매핑.
   boAppBase.js 의 lazy 로더(fnEnsurePageLoaded/fnCollectFiles)가 화면을 처음 열 때
   이 맵을 보고 어떤 파일을 loadModule()(동적 import())로 불러올지 찾는다.
   pages/bo, pages/co 전체를 스캔해서 100% 자동 생성 — 사람이 직접 추가할 항목 없음. */
window.BO_LAZY_CLASS_FILES = {
${stringifyMap(classMap)}
};
`;
  fs.writeFileSync(path.join(ROOT, 'lib/app/boAppLazyClasses.js'), out);
  console.log(`  ㄴ 파일 기록 완료: lib/app/boAppLazyClasses.js`);
  console.log(`\n[완료] 페이지(pageId) ${Object.keys(BO_APP_COMP_PAGE).length}개, lazy 클래스 ${Object.keys(classMap).length}개`);
  console.log('◀ 완료');
}

generate();
