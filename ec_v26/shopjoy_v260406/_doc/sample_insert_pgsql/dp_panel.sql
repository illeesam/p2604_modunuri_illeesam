-- ============================================================================
-- dp_panel: 디스플레이 패널(콘텐츠 묶음 단위) 샘플 데이터
-- 정책 참조: _doc/정책서/ec/dp/dp.05.전시Panel.md
-- 패널유형(DISP_TYPE): 배너/상품리스트/HTML 등
-- 상태(DISP_STATUS): ACTIVE / INACTIVE
-- visibility_targets: 패널 레벨 노출 대상 ^PUBLIC^MEMBER^VIP^
-- ID 형식: P + YYMMDDhhmmss + rand4 (총 17자)
-- ============================================================================

-- ======================================================================
-- 사이트01 - 모바일 메인용 패널
-- ======================================================================
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042010100001', '01', '봄시즌 메인 패널', 'BANNER', 'PATH_PANEL.SPRING', '^PUBLIC^', 'Y', '2026-04-01', '2026-04-30', 'ACTIVE', NULL, '{"theme":"spring","bg_color":"#fff0f4"}', 'admin01', '2026-04-20 10:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042010100002', '01', '히어로 슬라이더 패널', 'SLIDER', 'PATH_PANEL.HERO', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, '{"slide_count":3,"auto_play":true}', 'admin01', '2026-04-20 10:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042010100003', '01', '카테고리 퀵메뉴 패널', 'GRID', 'PATH_PANEL.QUICK', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, '{"cols":4}', 'admin01', '2026-04-20 10:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042010100004', '01', '베스트셀러 패널', 'PRODUCT_LIST', 'PATH_PANEL.BEST', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, '{"limit":8}', 'admin01', '2026-04-20 10:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042010100005', '01', '신상품 패널', 'PRODUCT_LIST', 'PATH_PANEL.NEW', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, '{"limit":8}', 'admin01', '2026-04-20 10:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042010100006', '01', '할인특가 패널', 'PRODUCT_LIST', 'PATH_PANEL.DISCOUNT', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, '{"min_discount_rate":20}', 'admin01', '2026-04-20 10:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042010100007', '01', '진행중 이벤트 패널', 'BANNER', 'PATH_PANEL.EVENT', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, NULL, 'admin01', '2026-04-20 10:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042010100008', '01', '하단 안내 패널', 'HTML', 'PATH_PANEL.BOTTOM', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, NULL, 'admin01', '2026-04-20 10:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042010100009', '01', '플로팅 채팅 패널', 'FLOATING', 'PATH_PANEL.CHAT', '^MEMBER^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, NULL, 'admin01', '2026-04-20 10:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042010100010', '01', '쿠폰 발급 패널', 'COUPON', 'PATH_PANEL.COUPON', '^MEMBER^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, '{"coupon_count":3}', 'admin01', '2026-04-20 10:00:00.000', NULL, NULL);

-- ======================================================================
-- 사이트01 - PC 메인용 패널
-- ======================================================================
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042010200001', '01', 'PC 히어로 패널', 'SLIDER', 'PATH_PANEL.PC.HERO', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, '{"slide_count":5}', 'admin01', '2026-04-20 10:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042010200002', '01', 'PC 카테고리 네비', 'GRID', 'PATH_PANEL.PC.NAV', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, '{"cols":8}', 'admin01', '2026-04-20 10:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042010200003', '01', 'PC 베스트 그리드', 'PRODUCT_LIST', 'PATH_PANEL.PC.BEST', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, '{"limit":12}', 'admin01', '2026-04-20 10:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042010200004', '01', 'PC 신상품 그리드', 'PRODUCT_LIST', 'PATH_PANEL.PC.NEW', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, '{"limit":12}', 'admin01', '2026-04-20 10:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042010200005', '01', 'PC 사이드바 패널', 'BANNER', 'PATH_PANEL.PC.SIDE', '^MEMBER^VIP^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, NULL, 'admin01', '2026-04-20 10:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042010200006', '01', 'PC 이벤트 배너', 'BANNER', 'PATH_PANEL.PC.EVENT', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, NULL, 'admin01', '2026-04-20 10:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042010200007', '01', 'PC 하단 푸터 패널', 'HTML', 'PATH_PANEL.PC.FOOTER', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, NULL, 'admin01', '2026-04-20 10:30:00.000', NULL, NULL);

-- ======================================================================
-- 사이트01 - 상품목록/상세용 패널
-- ======================================================================
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042010400001', '01', '상품목록 상단 배너', 'BANNER', 'PATH_PANEL.LIST.TOP', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, NULL, 'admin01', '2026-04-20 10:40:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042010400002', '01', '상품목록 필터 패널', 'FILTER', 'PATH_PANEL.LIST.FILTER', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, NULL, 'admin01', '2026-04-20 10:40:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042010600001', '01', '상품상세 추천 패널', 'PRODUCT_LIST', 'PATH_PANEL.VIEW.REC', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, '{"limit":4}', 'admin01', '2026-04-20 10:40:00.000', NULL, NULL);

-- ======================================================================
-- 사이트01 - 봄기획전 / 크리스마스 팝업 패널
-- ======================================================================
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042010800001', '01', '봄기획전 히어로 패널', 'BANNER', 'PATH_PANEL.SPRING.HERO', '^PUBLIC^', 'Y', '2026-04-01', '2026-04-30', 'ACTIVE', NULL, NULL, 'admin01', '2026-04-20 10:50:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042010800002', '01', '봄기획전 상품 패널', 'PRODUCT_LIST', 'PATH_PANEL.SPRING.PROD', '^PUBLIC^', 'Y', '2026-04-01', '2026-04-30', 'ACTIVE', NULL, '{"limit":12}', 'admin01', '2026-04-20 10:50:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042010800003', '01', '봄기획전 쿠폰 패널', 'COUPON', 'PATH_PANEL.SPRING.COUPON', '^MEMBER^', 'Y', '2026-04-01', '2026-04-30', 'ACTIVE', NULL, NULL, 'admin01', '2026-04-20 10:50:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042010900001', '01', '크리스마스 팝업 패널', 'POPUP', 'PATH_PANEL.XMAS', '^PUBLIC^', 'Y', '2026-12-24', '2026-12-25', 'INACTIVE', 'ACTIVE', NULL, 'admin01', '2026-04-20 10:50:00.000', NULL, NULL);

-- ======================================================================
-- 사이트01 - 마이페이지/장바구니 패널
-- ======================================================================
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042011000001', '01', '마이페이지 프로모션', 'BANNER', 'PATH_PANEL.MY.PROMO', '^MEMBER^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, NULL, 'admin01', '2026-04-20 11:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042011100001', '01', '장바구니 추천 패널', 'PRODUCT_LIST', 'PATH_PANEL.CART.REC', '^MEMBER^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, '{"limit":6}', 'admin01', '2026-04-20 11:00:00.000', NULL, NULL);

-- ======================================================================
-- 사이트02 - 메인/상품/이벤트 패널
-- ======================================================================
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042011200001', '02', '에코 메인 배너', 'BANNER', 'PATH_PANEL.ECO.TOP', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, NULL, 'admin02', '2026-04-20 11:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042011200002', '02', '친환경 상품 패널', 'PRODUCT_LIST', 'PATH_PANEL.ECO.PROD', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, '{"limit":8}', 'admin02', '2026-04-20 11:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042011200003', '02', '에코 안내 카드', 'HTML', 'PATH_PANEL.ECO.INFO', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, NULL, 'admin02', '2026-04-20 11:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042011300001', '02', 'PC 에코 히어로', 'SLIDER', 'PATH_PANEL.ECO.PC.HERO', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, NULL, 'admin02', '2026-04-20 11:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042011300002', '02', 'PC 친환경 그리드', 'PRODUCT_LIST', 'PATH_PANEL.ECO.PC.GRID', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, '{"limit":12}', 'admin02', '2026-04-20 11:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042011400001', '02', '상품목록 배너 패널', 'BANNER', 'PATH_PANEL.LIST.TOP', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, NULL, 'admin02', '2026-04-20 11:40:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042011500001', '02', '에코 기획전 히어로 패널', 'BANNER', 'PATH_PANEL.ECO_EVENT.HERO', '^PUBLIC^', 'Y', '2026-04-22', '2026-05-31', 'ACTIVE', NULL, NULL, 'admin02', '2026-04-20 11:40:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042011500002', '02', '에코 기획전 상품 패널', 'PRODUCT_LIST', 'PATH_PANEL.ECO_EVENT.PROD', '^PUBLIC^', 'Y', '2026-04-22', '2026-05-31', 'ACTIVE', NULL, '{"limit":12}', 'admin02', '2026-04-20 11:40:00.000', NULL, NULL);

-- ======================================================================
-- 사이트03 - 럭셔리/VIP/갈라 기획전 패널
-- ======================================================================
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042012100001', '03', '럭셔리 모바일 히어로', 'SLIDER', 'PATH_PANEL.LUXE.HERO', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, NULL, 'admin03', '2026-04-20 12:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042012100002', '03', '프리미엄 상품 패널', 'PRODUCT_LIST', 'PATH_PANEL.LUXE.PREMIUM', '^MEMBER^VIP^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, '{"limit":6}', 'admin03', '2026-04-20 12:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042012200001', '03', 'PC 럭셔리 히어로', 'SLIDER', 'PATH_PANEL.LUXE.PC.HERO', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, NULL, 'admin03', '2026-04-20 12:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042012200002', '03', 'PC 프리미엄 그리드', 'PRODUCT_LIST', 'PATH_PANEL.LUXE.PC.PREMIUM', '^MEMBER^VIP^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, '{"limit":12}', 'admin03', '2026-04-20 12:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042012300001', '03', 'VIP 라운지 메인 패널', 'HTML', 'PATH_PANEL.VIP.MAIN', '^VIP^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, NULL, 'admin03', '2026-04-20 12:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042012300002', '03', 'VIP 혜택 그리드 패널', 'GRID', 'PATH_PANEL.VIP.BENEFIT', '^VIP^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, NULL, 'admin03', '2026-04-20 12:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042012400001', '03', '갈라 기획전 히어로 패널', 'BANNER', 'PATH_PANEL.GALA.HERO', '^MEMBER^VIP^', 'Y', '2026-05-01', '2026-05-15', 'ACTIVE', NULL, NULL, 'admin03', '2026-04-20 12:30:00.000', NULL, NULL);

-- ======================================================================
-- 관리자 BO 대시보드/통계 패널
-- ======================================================================
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042013100001', NULL, 'BO KPI 카드 패널', 'GRID', 'PATH_PANEL.BO.KPI', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, '{"cols":4}', 'SYSTEM', '2026-04-20 13:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042013100002', NULL, 'BO 매출/주문 차트 패널', 'CHART', 'PATH_PANEL.BO.CHART', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, NULL, 'SYSTEM', '2026-04-20 13:30:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042013200001', NULL, 'BO 매출 통계 패널', 'CHART', 'PATH_PANEL.BO.STATS', '^PUBLIC^', 'Y', '2026-04-01', '2099-12-31', 'ACTIVE', NULL, NULL, 'SYSTEM', '2026-04-20 13:30:00.000', NULL, NULL);

-- ======================================================================
-- 비활성/이력추적용 샘플 (status_cd_before 활용)
-- ======================================================================
INSERT INTO shopjoy_2604.dp_panel VALUES ('P26042013900001', '01', '구버전 메인배너 (보관)', 'BANNER', 'PATH_PANEL.LEGACY', '^PUBLIC^', 'N', '2026-01-01', '2026-03-31', 'INACTIVE', 'ACTIVE', NULL, 'admin01', '2026-04-20 13:30:00.000', 'admin01', '2026-04-01 00:00:00.000');
