-- ============================================================================
-- dp_area: 디스플레이 영역(구역) 샘플 데이터
-- 정책 참조: _doc/정책서/ec/dp/dp.04.전시Area.md
-- 영역유형(DISP_AREA_TYPE): FULL / SIDEBAR / POPUP / FLOATING / GRID
-- (site_id, area_cd) UNIQUE
-- ID 형식: A + YYMMDDhhmmss + rand4 (총 17자)
-- ui_id FK -> dp_ui.ui_id (영역의 기본 소속 UI)
-- ============================================================================

-- ======================================================================
-- 사이트01 - 모바일 메인 (U26041910000001) 영역들
-- ======================================================================
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041910100001', 'U26041910000001', '01', 'MOBILE_MAIN_TOP', '모바일 메인 상단', 'FULL', '모바일 메인 최상단 풀배너 영역', 'PATH_FRONT_MAIN.TOP', 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:10:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041910100002', 'U26041910000001', '01', 'MOBILE_MAIN_HERO', '모바일 메인 히어로', 'FULL', '모바일 메인 히어로 슬라이더', 'PATH_FRONT_MAIN.HERO', 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:10:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041910100003', 'U26041910000001', '01', 'MOBILE_MAIN_QUICK', '모바일 메인 퀵메뉴', 'GRID', '모바일 카테고리 퀵메뉴 그리드', 'PATH_FRONT_MAIN.QUICK', 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:10:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041910100004', 'U26041910000001', '01', 'MOBILE_MAIN_PROD_BEST', '모바일 메인 베스트', 'FULL', '모바일 베스트셀러 영역', 'PATH_FRONT_MAIN.BEST', 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:10:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041910100005', 'U26041910000001', '01', 'MOBILE_MAIN_PROD_NEW', '모바일 메인 신상품', 'FULL', '모바일 신상품 영역', 'PATH_FRONT_MAIN.NEW', 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:10:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041910100006', 'U26041910000001', '01', 'MOBILE_MAIN_EVENT', '모바일 메인 이벤트', 'FULL', '모바일 진행중 이벤트 배너 영역', 'PATH_FRONT_MAIN.EVENT', 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:10:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041910100007', 'U26041910000001', '01', 'MOBILE_MAIN_BOTTOM', '모바일 메인 하단', 'FULL', '모바일 메인 하단 안내/공지 영역', 'PATH_FRONT_MAIN.BOTTOM', 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:10:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041910100008', 'U26041910000001', '01', 'MOBILE_FLOAT_CHAT', '모바일 플로팅 채팅', 'FLOATING', '모바일 우하단 채팅 플로팅 버튼', 'PATH_FRONT_MAIN.FLOAT', 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:10:00.000', NULL, NULL);

-- ======================================================================
-- 사이트01 - PC 메인 (U26041910000002) 영역들
-- ======================================================================
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041910200001', 'U26041910000002', '01', 'PC_MAIN_HERO', 'PC 메인 히어로', 'FULL', 'PC 메인 히어로 풀너비 배너', 'PATH_FRONT_MAIN.PC.HERO', 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:20:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041910200002', 'U26041910000002', '01', 'PC_MAIN_CAT_NAV', 'PC 메인 카테고리네비', 'GRID', 'PC 메인 상단 카테고리 네비게이션', 'PATH_FRONT_MAIN.PC.NAV', 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:20:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041910200003', 'U26041910000002', '01', 'PC_MAIN_PROD_BEST', 'PC 베스트셀러', 'FULL', 'PC 메인 베스트셀러 그리드', 'PATH_FRONT_MAIN.PC.BEST', 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:20:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041910200004', 'U26041910000002', '01', 'PC_MAIN_PROD_NEW', 'PC 신상품', 'FULL', 'PC 메인 신상품 영역', 'PATH_FRONT_MAIN.PC.NEW', 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:20:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041910200005', 'U26041910000002', '01', 'PC_SIDEBAR_RIGHT', 'PC 우측 사이드바', 'SIDEBAR', 'PC 메인 우측 사이드바 (광고/추천)', 'PATH_FRONT_MAIN.PC.SIDE', 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:20:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041910200006', 'U26041910000002', '01', 'PC_MAIN_EVENT', 'PC 이벤트', 'FULL', 'PC 메인 이벤트 배너', 'PATH_FRONT_MAIN.PC.EVENT', 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:20:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041910200007', 'U26041910000002', '01', 'PC_MAIN_FOOTER', 'PC 메인 푸터', 'FULL', 'PC 메인 하단 푸터 안내', 'PATH_FRONT_MAIN.PC.FOOTER', 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:20:00.000', NULL, NULL);

-- ======================================================================
-- 사이트01 - 상품목록 (U26041910000004 모바일, U26041910000005 PC) 영역
-- ======================================================================
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041910400001', 'U26041910000004', '01', 'MOBILE_LIST_TOP_BANNER', '상품목록 상단배너', 'FULL', '모바일 상품목록 상단 배너', 'PATH_FRONT_PROD_LIST.TOP', 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041910400002', 'U26041910000004', '01', 'MOBILE_LIST_FILTER', '상품목록 필터', 'FULL', '모바일 상품목록 필터 영역', 'PATH_FRONT_PROD_LIST.FILTER', 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041910500001', 'U26041910000005', '01', 'PC_LIST_TOP_BANNER', 'PC 상품목록 상단배너', 'FULL', 'PC 상품목록 상단 배너', 'PATH_FRONT_PROD_LIST.PC.TOP', 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041910500002', 'U26041910000005', '01', 'PC_LIST_SIDE_FILTER', 'PC 좌측 필터', 'SIDEBAR', 'PC 상품목록 좌측 필터 영역', 'PATH_FRONT_PROD_LIST.PC.SIDE', 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:30:00.000', NULL, NULL);

-- ======================================================================
-- 사이트01 - 상품상세 (U26041910000006 모바일, U26041910000007 PC) 영역
-- ======================================================================
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041910600001', 'U26041910000006', '01', 'MOBILE_VIEW_REC', '모바일 추천상품', 'FULL', '모바일 상품상세 하단 추천상품', 'PATH_FRONT_PROD_VIEW.REC', 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:40:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041910700001', 'U26041910000007', '01', 'PC_VIEW_REC', 'PC 추천상품', 'FULL', 'PC 상품상세 우측 추천상품', 'PATH_FRONT_PROD_VIEW.PC.REC', 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:40:00.000', NULL, NULL);

-- ======================================================================
-- 사이트01 - 이벤트/팝업 (U26041910000008 봄기획전, U26041910000009 크리스마스)
-- ======================================================================
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041910800001', 'U26041910000008', '01', 'EVENT_SPRING_HERO', '봄기획전 히어로', 'FULL', '봄기획전 메인 히어로 배너', 'PATH_EVENT.SPRING.HERO', 'Y', '2026-04-01', '2026-04-30', 'admin01', '2026-04-19 10:50:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041910800002', 'U26041910000008', '01', 'EVENT_SPRING_PROD', '봄기획전 상품', 'GRID', '봄기획전 추천 상품 그리드', 'PATH_EVENT.SPRING.PROD', 'Y', '2026-04-01', '2026-04-30', 'admin01', '2026-04-19 10:50:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041910800003', 'U26041910000008', '01', 'EVENT_SPRING_COUPON', '봄기획전 쿠폰', 'FULL', '봄기획전 쿠폰 발급 영역', 'PATH_EVENT.SPRING.COUPON', 'Y', '2026-04-01', '2026-04-30', 'admin01', '2026-04-19 10:50:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041910900001', 'U26041910000009', '01', 'POPUP_XMAS_LAYER', '크리스마스 팝업레이어', 'POPUP', '크리스마스 한정 팝업 레이어', 'PATH_POPUP.XMAS', 'Y', '2026-12-24', '2026-12-25', 'admin01', '2026-04-19 10:50:00.000', NULL, NULL);

-- ======================================================================
-- 사이트01 - 마이페이지/장바구니 (U26041910000010, U26041910000011)
-- ======================================================================
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041911000001', 'U26041910000010', '01', 'MOBILE_MY_PROMO', '마이페이지 프로모션', 'FULL', '마이페이지 상단 프로모션 영역', 'PATH_MY.PROMO', 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 11:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041911100001', 'U26041910000011', '01', 'MOBILE_CART_REC', '장바구니 추천', 'FULL', '장바구니 하단 추천상품', 'PATH_CART.REC', 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 11:00:00.000', NULL, NULL);

-- ======================================================================
-- 사이트02 - 모바일/PC 메인 (U26041911000001, U26041911000002) 영역
-- ======================================================================
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041911200001', 'U26041911000001', '02', 'MOBILE_MAIN_TOP', '모바일 메인 상단', 'FULL', '사이트02 모바일 메인 상단', 'PATH_FRONT_MAIN.TOP', 'Y', '2026-04-01', '2099-12-31', 'admin02', '2026-04-19 11:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041911200002', 'U26041911000001', '02', 'MOBILE_MAIN_ECO', '모바일 친환경상품', 'FULL', '사이트02 모바일 친환경 상품 영역', 'PATH_FRONT_MAIN.ECO', 'Y', '2026-04-01', '2099-12-31', 'admin02', '2026-04-19 11:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041911200003', 'U26041911000001', '02', 'MOBILE_MAIN_INFO', '모바일 안내영역', 'GRID', '사이트02 모바일 친환경 안내 카드', 'PATH_FRONT_MAIN.INFO', 'Y', '2026-04-01', '2099-12-31', 'admin02', '2026-04-19 11:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041911300001', 'U26041911000002', '02', 'PC_MAIN_HERO', 'PC 메인 히어로', 'FULL', '사이트02 PC 메인 히어로', 'PATH_FRONT_MAIN.PC.HERO', 'Y', '2026-04-01', '2099-12-31', 'admin02', '2026-04-19 11:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041911300002', 'U26041911000002', '02', 'PC_MAIN_GRID', 'PC 친환경상품 그리드', 'GRID', '사이트02 PC 친환경 상품 그리드', 'PATH_FRONT_MAIN.PC.GRID', 'Y', '2026-04-01', '2099-12-31', 'admin02', '2026-04-19 11:30:00.000', NULL, NULL);

-- ======================================================================
-- 사이트02 - 상품목록/이벤트 영역
-- ======================================================================
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041911400001', 'U26041911000003', '02', 'MOBILE_LIST_BANNER', '상품목록 배너', 'FULL', '사이트02 상품목록 배너', 'PATH_FRONT_PROD_LIST.TOP', 'Y', '2026-04-01', '2099-12-31', 'admin02', '2026-04-19 11:40:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041911500001', 'U26041911000005', '02', 'EVENT_ECO_HERO', '에코 기획전 히어로', 'FULL', '사이트02 에코 기획전 메인 히어로', 'PATH_EVENT.ECO.HERO', 'Y', '2026-04-22', '2026-05-31', 'admin02', '2026-04-19 11:40:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041911500002', 'U26041911000005', '02', 'EVENT_ECO_PROD', '에코 기획전 상품', 'GRID', '사이트02 에코 기획전 상품 그리드', 'PATH_EVENT.ECO.PROD', 'Y', '2026-04-22', '2026-05-31', 'admin02', '2026-04-19 11:40:00.000', NULL, NULL);

-- ======================================================================
-- 사이트03 - 모바일/PC 메인 (U26041912000001, U26041912000002) 영역
-- ======================================================================
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041912100001', 'U26041912000001', '03', 'MOBILE_MAIN_HERO', '모바일 럭셔리 히어로', 'FULL', '사이트03 모바일 럭셔리 히어로', 'PATH_FRONT_MAIN.HERO', 'Y', '2026-04-01', '2099-12-31', 'admin03', '2026-04-19 12:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041912100002', 'U26041912000001', '03', 'MOBILE_MAIN_PREMIUM', '모바일 프리미엄', 'FULL', '사이트03 모바일 프리미엄 상품', 'PATH_FRONT_MAIN.PREMIUM', 'Y', '2026-04-01', '2099-12-31', 'admin03', '2026-04-19 12:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041912200001', 'U26041912000002', '03', 'PC_MAIN_HERO', 'PC 럭셔리 히어로', 'FULL', '사이트03 PC 럭셔리 히어로', 'PATH_FRONT_MAIN.PC.HERO', 'Y', '2026-04-01', '2099-12-31', 'admin03', '2026-04-19 12:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041912200002', 'U26041912000002', '03', 'PC_MAIN_PREMIUM', 'PC 프리미엄', 'FULL', '사이트03 PC 프리미엄 상품 그리드', 'PATH_FRONT_MAIN.PC.PREMIUM', 'Y', '2026-04-01', '2099-12-31', 'admin03', '2026-04-19 12:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041912300001', 'U26041912000003', '03', 'VIP_LOUNGE_MAIN', 'VIP 라운지 메인', 'FULL', '사이트03 VIP 라운지 메인 콘텐츠', 'PATH_VIP.MAIN', 'Y', '2026-04-01', '2099-12-31', 'admin03', '2026-04-19 12:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041912300002', 'U26041912000003', '03', 'VIP_LOUNGE_BENEFIT', 'VIP 혜택', 'GRID', '사이트03 VIP 전용 혜택 그리드', 'PATH_VIP.BENEFIT', 'Y', '2026-04-01', '2099-12-31', 'admin03', '2026-04-19 12:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041912400001', 'U26041912000004', '03', 'EVENT_GALA_HERO', '갈라 기획전 히어로', 'FULL', '사이트03 갈라 기획전 히어로', 'PATH_EVENT.GALA.HERO', 'Y', '2026-05-01', '2026-05-15', 'admin03', '2026-04-19 12:30:00.000', NULL, NULL);

-- ======================================================================
-- 관리자 BO 대시보드 (U26041913000001, U26041913000002) 영역
-- ======================================================================
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041913100001', 'U26041913000001', NULL, 'BO_DASH_KPI', 'BO 대시보드 KPI', 'GRID', 'BO 대시보드 핵심지표 KPI 카드', 'PATH_BO_HOME.KPI', 'Y', '2026-04-01', '2099-12-31', 'SYSTEM', '2026-04-19 13:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041913100002', 'U26041913000001', NULL, 'BO_DASH_CHART', 'BO 대시보드 차트', 'FULL', 'BO 대시보드 매출/주문 차트', 'PATH_BO_HOME.CHART', 'Y', '2026-04-01', '2099-12-31', 'SYSTEM', '2026-04-19 13:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_area VALUES ('A26041913200001', 'U26041913000002', NULL, 'BO_STATS_SALES', '매출 통계 메인', 'FULL', 'BO 매출 통계 차트 영역', 'PATH_BO_STATS.SALES', 'Y', '2026-04-01', '2099-12-31', 'SYSTEM', '2026-04-19 13:30:00.000', NULL, NULL);
