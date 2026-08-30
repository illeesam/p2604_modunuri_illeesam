/* ShopJoy BO - 메뉴 구조 데이터 (boAppBase.js 에서 분리) */
(function () {
  /* ── 메뉴 구조 ── */
  /* BO_SITE_NO 기준으로 상단 메뉴 필터링
  - 02: 고객센터 제외
  - 03: 프로모션 제외 */
  const _BO_SITE_NO = window.BO_SITE_NO || '01';
  const _ALL_TOP_MENUS = [
    { id: 'home', label: '홈' },
    { id: 'member', label: '회원관리' },
    { id: 'product', label: '상품관리' },
    { id: 'order', label: '주문관리' },
    { id: 'promotion', label: '프로모션' },
    { id: 'display', label: '전시관리' },
    { id: 'customer', label: '고객센터' },
    { id: 'settle', label: '정산' },
    { id: 'system', label: '시스템' },
    { id: 'module', label: '모듈' },   // 코바늘 등 독립 FO 모듈의 BO 관리화면 — 그룹으로 계속 추가
    { id: 'devtools', label: '개발도구' },
    { id: 'simul', label: '시뮬레이션' },
  ];
  const TOP_MENUS = _ALL_TOP_MENUS.filter((m) => {
    if (_BO_SITE_NO === '02' && m.id === 'customer') return false;
    if (_BO_SITE_NO === '03' && m.id === 'promotion') return false;
    return true;
  });

  /* SYS 메뉴 트리를 한 번도 짜지 않았을 때 좌측 '대시보드' 그룹에 보여줄 기본 항목.
     지금까지 하드코딩돼 있던 두 개 그대로다 — 설정 전에는 기존과 동일하게 보인다. */
  const HOME_FALLBACK_DASH = [
    { id: 'dashboard', label: 'EC대시보드' },
    { id: 'appMonitorDashboard', label: 'App모니터대시보드' },
  ];

  const LEFT_MENUS = {
    /* home 은 그룹 헤더도 항목도 전부 동적이다 (템플릿 §대시보드 좌측메뉴 참조).
         대시보드        ← cm_dashboard_menu(SYS) 트리. 없으면 HOME_FALLBACK_DASH 로 폴백
         사용자 대시보드   ← cm_dashboard_menu(USER) 트리. 없으면 볼 수 있는 개인 대시보드 전체
         대시보드 관리     ← LEFT_MENUS_TAIL.home (동적 항목 아래)
         메가드롭다운용 정적 항목은 아래에 명시 */
    home: [
      { group: '대시보드' },
      { id: 'dashboard', label: 'EC대시보드' },
      { id: 'appMonitorDashboard', label: 'App모니터대시보드' },
      { group: '대시보드 관리' },
      { id: 'cmDashboardMng', label: '대시보드 관리' },
      { id: 'cmDashboardItemMng', label: '대시보드 항목관리' },
      { id: 'cmDashboardDataMng', label: '대시보드 데이타관리' },
      { id: 'cmDashboardLayoutMng', label: '대시보드 항목배치' },
      { id: 'cmDashboardSysMenuMng', label: '대시보드 메뉴관리' },
      { group: '사용자 대시보드 관리' },
      { id: 'cmDashboardMyMng', label: '사용자 대시보드 관리' },
      { id: 'cmDashboardMenuMng', label: '사용자 대시보드 메뉴관리' },
    ],
    member: [
      { group: '회원' },
      { id: 'mbMemberMng', label: '회원관리' },
      { group: '등급·그룹' },
      { id: 'mbMemGradeMng', label: '회원등급관리' },
      { id: 'mbMemGroupMng', label: '회원그룹관리' },
    ],
    product: [
      { group: '상품' },
      { id: 'pdProdMng', label: '상품관리' },
      { id: 'pdSingleProdMng', label: '단품상품등록' },
      { id: 'pdOptionProdMng', label: '옵션상품등록' },
      { id: 'pdGroupProdMng', label: '묶음상품등록' },
      { id: 'pdSetProdMng', label: '세트상품등록' },
      { id: 'pdGiftProdMng', label: '사은상품등록' },
      { group: '카테고리' },
      { id: 'pdCategoryMng', label: '카테고리관리' },
      { id: 'pdCategoryProdMng', label: '카테고리상품관리' },
      { group: '상품옵션관리' },
      { id: 'pdOptCodeMng', label: '상품옵션관리' },
      { group: '상품템플릿' },
      { id: 'pdDlivTmpltMng', label: '배송템플릿관리' },
      { group: '상품정보관리' },
      { id: 'pdReviewMng', label: '상품리뷰관리' },
      { id: 'pdQnaMng', label: '상품Q&A관리' },
      { id: 'pdRestockNotiMng', label: '재입고알림' },
      { id: 'pdTagMng', label: '태그관리' },
    ],
    order: [
      { id: 'odOrderItemMng', label: '주문항목관리' },
      { id: 'odOrderMng', label: '주문관리' },
      { id: 'odClaimMng', label: '클레임관리' },
      { id: 'odDlivMng', label: '배송관리' },
      { id: 'odOrderKanban', label: '주문 칸반보드' },
      { id: 'odCartMng', label: '장바구니관리' },
    ],
    promotion: [
      { group: '판촉' },
      { id: 'pmCouponMng', label: '쿠폰관리' },
      { id: 'pmCacheMng', label: '캐쉬관리' },
      { id: 'pmDiscntMng', label: '할인관리' },
      { id: 'pmSaveMng', label: '적립금관리' },
      { id: 'pmGiftMng', label: '사은품관리' },
      { id: 'pmVoucherMng', label: '상품권관리' },
      { group: '이벤트' },
      { id: 'pmEventMng', label: '이벤트관리' },
      { id: 'pmPlanMng', label: '기획전관리' },
    ],
    display: [
      { group: '미리보기' },
      { id: 'dpDispUiPreview', label: '전시UI미리보기' },
      { id: 'dpDispAreaPreview', label: '전시영역미리보기' },
      { id: 'dpDispPanelPreview', label: '전시패널미리보기' },
      { id: 'dpDispWidgetPreview', label: '전시위젯미리보기' },
      { id: 'dpDispWidgetLibPreview', label: '전시위젯Lib미리보기' },
      { group: '전시관리' },
      { id: 'dpDispUiMng', label: '전시UI관리' },
      { id: 'dpDispAreaMng', label: '전시영역관리' },
      { id: 'dpDispPanelMng', label: '전시패널관리' },
      { group: '전시위젯관리' },
      { id: 'dpDispWidgetMng', label: '전시위젯관리' },
      { group: '전시리소스' },
      { id: 'dpDispWidgetLibMng', label: '전시위젯Lib' },
    ],
    customer: [
      { group: '고객' },
      { id: 'mbCustInfoMng', label: '고객종합정보' },
      { group: '고객센터' },
      { id: 'syContactMng', label: '문의관리' },
      { id: 'cmChattMng', label: '채팅관리' },
      { id: 'cmChattKanban', label: '채팅칸반보드' },
      { group: '공통업무' },
      { id: 'cmNoticeMng', label: '공지사항관리' },
      { id: 'cmFaqMng', label: 'FAQ관리' },
      { id: 'cmBlogMng', label: '뉴스&블로그 관리' },
      { id: 'syBbmMng', label: '게시판관리' },
      { id: 'syBbsMng', label: '게시글관리' },
      { id: 'syExceldownMng', label: '엑셀다운로드' },
    ],
    settle: [
      { group: '기준정보' },
      { id: 'stConfigMng', label: '정산기준관리' },
      { id: 'stDlivFeePolicyMng', label: '배송수수료정책' },
      { group: '수집원장' },
      { id: 'stRawMng', label: '정산수집원장' },
      { group: '정산작업' },
      { id: 'stSettleAdjMng', label: '정산조정' },
      { id: 'stSettleEtcAdjMng', label: '정산기타조정' },
      { id: 'stSettleCloseMng', label: '정산마감' },
      { id: 'stSettlePayMng', label: '정산지급관리' },
      { group: '정산현황' },
      { id: 'stStatusMng', label: '정산현황' },
      { group: '대사관리' },
      { id: 'stReconOrderMng', label: '주문-정산 대사' },
      { id: 'stReconPayMng', label: '결제-정산 대사' },
      { id: 'stReconClaimMng', label: '클레임-정산 대사' },
      { id: 'stReconVendorMng', label: '업체-정산 대사' },
      { group: 'ERP 연동' },
      { id: 'stErpGenMng', label: 'ERP 전표생성' },
      { id: 'stErpViewMng', label: 'ERP 전표조회' },
      { id: 'stErpReconMng', label: 'ERP 전표대사' },
    ],
    system: [
      { group: '기준정보' },
      { id: 'sySiteMng', label: '사이트관리' },
      { id: 'syCodeMng', label: '공통코드관리' },
      { id: 'syBrandMng', label: '브랜드관리' },
      { group: '공통기능' },
      { id: 'cmPopupMng', label: '공통팝업관리' },
      { group: '업체' },
      { id: 'syVendorMng', label: '업체' },
      { id: 'syVendorUserMng', label: '업체사용자' },
      { id: 'syVendorInfoMng', label: '업체정보' },
      { group: '시스템' },
      { id: 'syAttachMng', label: '첨부파일 통합조회' },
      { id: 'syTemplateMng', label: '템플릿관리' },
      { id: 'syBatchMng', label: '배치스케즐관리' },
      { id: 'syAlarmMng', label: '알림관리' },
      { id: 'syPropMng', label: '프로퍼티관리' },
      { id: 'syPathMng', label: '표시경로' },
      { id: 'syI18nMng', label: '다국어관리' },
      { group: '조직' },
      { id: 'syUserMng', label: '사용자관리' },
      { id: 'syDeptMng', label: '부서관리' },
      { group: '메뉴' },
      { id: 'syMenuMng', label: '메뉴관리' },
      { id: 'syRoleMng', label: '역할관리' },
      { group: '이력조회' },
      { id: 'syMemberLoginHist', label: '회원로그인이력' },
      { id: 'syUserLoginHist', label: '사용자로그인이력' },
      { id: 'syApiLogMng', label: 'API로그조회' },
      { id: 'sySendMsgLog', label: '메시지발송이력' },
    ],
    devtools: [
      { group: 'api' },
      { id: 'syPostman', label: 'postman' },
      { group: '스토어' },
      { id: 'zdInfDashboard', label: '연동설정대시보드' },
      { id: 'zdStore', label: 'store정보관리' },
      { id: 'zdLocalStorage', label: 'localstorage정보관리' },
      { group: '소셜 로그인' },
      { id: 'zdTestSnsLoginKakao', label: '카카오 로그인 테스트' },
      { id: 'zdTestSnsLoginGoogle', label: '구글 로그인 테스트' },
      { id: 'zdTestSnsLoginNaver', label: '네이버 로그인 테스트' },
      { group: '결제' },
      { id: 'zdTestPayTossWidget',  label: '토스 결제위젯 테스트' },
      { id: 'zdTestPayTossBrandpay', label: '토스 브랜드페이 테스트' },
      { id: 'zdTestPayKakaopay',   label: '카카오페이 결제 테스트' },
      { id: 'zdTestPayNaverpay',   label: '네이버페이 결제 테스트' },
      { group: '지도' },
      { id: 'zdTestMapKakao',  label: '카카오 지도 테스트' },
      { id: 'zdTestMapNaver', label: '네이버 지도 테스트' },
      { id: 'zdTestMapGoogle', label: '구글 지도 테스트' },
      { group: '메일 / SMS / 푸시 알림' },
      { id: 'zdTestMailSmtp', label: 'SMTP 메일 테스트' },
      { id: 'zdTestSms', label: 'SMS 테스트' },
      { id: 'zdTestPushAlimFcm', label: 'FCM 푸시 테스트' },
      { id: 'zdTestPushAlimApns', label: 'APNs 푸시 테스트' },
      { group: '채팅 / AI' },
      { id: 'zdTestAiChatbot', label: 'AI 챗봇 테스트' },
      { id: 'zdTestChattingKakaoChannel', label: '카카오채널 메시지 테스트' },
      { id: 'zdTestShareKakao', label: '카카오톡 공유 테스트' },
      { id: 'zdTestChattingWebSocket', label: 'WebSocket 채팅 테스트' },
      { group: '앱 메시지' },
      { id: 'zdTestAppMsgSendReceiv', label: 'Android/iOS 메시지 발송&수신' },
    ],
    simul: [
      { group: '회원' },
      { id: 'zdSimulMemberMng', label: '회원시뮬' },
      { id: 'zdSimulUserMng', label: '사용자시뮬' },
      { id: 'zdSimulVendorMng', label: '업체시뮬' },
      { group: '상품/주문' },
      { id: 'zdSimulProdMng', label: '상품시뮬' },
      { id: 'zdSimulOrderMng', label: '주문시뮬' },
      { id: 'zdSimulClaimMng', label: '클레임시뮬' },
      { id: 'zdSimulKanbanMng', label: '주문칸반시뮬' },
      { group: '프로모션' },
      { id: 'zdSimulCouponMng', label: '쿠폰시뮬' },
      { id: 'zdSimulDiscntMng', label: '할인시뮬' },
      { id: 'zdSimulSaveMng',   label: '적립금시뮬' },
      { group: '전시/이벤트' },
      { id: 'zdSimulPlanMng', label: '기획전시뮬' },
      { id: 'zdSimulEventMng', label: '이벤트시뮬' },
      { group: '정산/재무' },
      { id: 'zdSimulSettleMng', label: '정산시뮬' },
      { id: 'zdSimulVoucherMng', label: '전표시뮬' },
      { group: '알림' },
      { id: 'zdSimulNotiKakao',  label: '메시지전송(알림톡)' },
      { id: 'zdSimulNotiSms',    label: '메시지전송(SMS)' },
      { id: 'zdSimulNotiMail',   label: '메시지전송(메일)' },
      { id: 'zdSimulNotiChat',   label: '메시지전송(채팅)' },
      { id: 'zdSimulNotiNotice', label: '공지사항생성' },
      { id: 'zdSimulNotiError',  label: '오류정보생성' },
      { group: '이력' },
      { id: 'zdSimulLogMng', label: '시뮬로그' },
    ],
    /* 모듈 — 독립 FO 모듈(자체 HTML 진입점 + 자체 헤더/사이드바)의 BO 관리화면.
       모듈이 늘어날 때마다 이 배열 안에 { group: '모듈명' } 블록을 계속 추가한다. */
    module: [
      { group: '코바늘' },
      { id: 'mdCbPatternMng', label: '도안관리' },
      { id: 'mdCbSymbolMng', label: '기호관리' },
      { id: 'mdCbYarnMng', label: '실관리' },
      { group: '소스젠' },
      { id: 'mdSgProjectMng', label: '프로젝트관리' },
      { id: 'mdSgGenHistMng', label: '생성이력관리' },
      { id: 'mdSgDownloadHistMng', label: '다운로드이력관리' },
      { id: 'mdSgStackMng', label: '언어/스택관리' },
    ],
  };

  /* 동적 목록(사용자 대시보드) '아래'에 붙는 좌측메뉴. */
  const LEFT_MENUS_TAIL = {
    home: [
      { group: '대시보드 관리' },
      { id: 'cmDashboardMng', label: '대시보드 관리' },
      { id: 'cmDashboardItemMng', label: '대시보드 항목관리' },
      { id: 'cmDashboardDataMng', label: '대시보드 데이타관리' },
      { id: 'cmDashboardLayoutMng', label: '대시보드 항목배치' },
      { id: 'cmDashboardSysMenuMng', label: '대시보드 메뉴관리' },
      { group: '사용자 대시보드 관리' },
      { id: 'cmDashboardMyMng', label: '사용자 대시보드 관리' },
      { id: 'cmDashboardMenuMng', label: '사용자 대시보드 메뉴관리' },
    ],
  };

  const LEFT_MENUS_ALL = Object.fromEntries(
    Object.keys(LEFT_MENUS).map((top) => [top, [...LEFT_MENUS[top], ...(LEFT_MENUS_TAIL[top] || []),
                                              ...(top === 'home' ? HOME_FALLBACK_DASH : [])]]),
  );

  const PAGE_TO_TOP = { dashboard: 'home' };
  const PAGE_LABELS = {};
  Object.entries(LEFT_MENUS_ALL).forEach(([top, items]) => {
    items
      .filter((item) => item.id)
      .forEach((item) => {
        PAGE_TO_TOP[item.id] = top;
        PAGE_TO_TOP[item.id.replace('Mng', 'Dtl')] = top;
        PAGE_LABELS[item.id] = item.label;
        PAGE_LABELS[item.id.replace('Mng', 'Dtl')] = item.label + ' 상세';
      });
  });

  PAGE_LABELS['dashboard'] = '대시보드';

  PAGE_TO_TOP['odOrderKanban'] = 'order';
  PAGE_LABELS['odOrderKanban'] = '주문 칸반 보드';

  PAGE_TO_TOP['pdProdHist'] = 'product';
  PAGE_LABELS['pdProdHist'] = '상품 이력';

  const ALL_PAGES = [
    'dashboard',
    'odOrderKanban',
    'pdProdHist',
    ...Object.values(LEFT_MENUS_ALL)
      .flat()
      .filter((p) => p.id)
      .map((p) => p.id),
    ...Object.values(LEFT_MENUS_ALL)
      .flat()
      .filter((p) => p.id)
      .map((p) => p.id.replace('Mng', 'Dtl')),
  ];

  const MULTI_TAB_PAGES = new Set(['odOrderKanban', 'cmDashboardMyMng', 'pdProdDtl', 'pdProdHist']);

  const toTabId = (pg, id) => {
    if (MULTI_TAB_PAGES.has(pg) && id) return pg + '__' + id;
    if (pg.endsWith('Dtl')) return pg.replace('Dtl', 'Mng');
    return pg;
  };

  const toPageFromTabId = (tabId) => {
    const sep = tabId.indexOf('__');
    return sep === -1 ? tabId : tabId.slice(0, sep);
  };

  const toIdFromTabId = (tabId) => {
    const sep = tabId.indexOf('__');
    return sep === -1 ? null : tabId.slice(sep + 2);
  };

  const AUTH_METHODS = ['메인', 'SMS', 'OTP', 'Authenticator'];

  window.boMenuData = {
    TOP_MENUS,
    HOME_FALLBACK_DASH,
    LEFT_MENUS,
    LEFT_MENUS_TAIL,
    LEFT_MENUS_ALL,
    PAGE_TO_TOP,
    PAGE_LABELS,
    ALL_PAGES,
    MULTI_TAB_PAGES,
    toTabId,
    toPageFromTabId,
    toIdFromTabId,
    AUTH_METHODS,
  };
})();
