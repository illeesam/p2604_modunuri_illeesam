-- ============================================================================
-- dp_ui: 디스플레이 UI (최상위 화면 정의) 샘플 데이터
-- 정책 참조: _doc/정책서/ec/dp/dp.03.전시Ui.md
-- 디바이스유형(DEVICE_TYPE): MOBILE / PC / TABLET
-- (site_id, ui_cd) UNIQUE
-- ID 형식: U + YYMMDDhhmmss + rand4 (총 17자)
-- ============================================================================

-- ======================================================================
-- 사이트01 - UI 정의
-- ======================================================================
INSERT INTO shopjoy_2604.dp_ui VALUES ('U26041910000001', '01', 'MOBILE_MAIN', '모바일 메인', '사이트01 모바일 메인 화면 - 베이지/카키 톤', 'MOBILE', 'PATH_FRONT_MAIN', 1, 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_ui VALUES ('U26041910000002', '01', 'PC_MAIN', 'PC 메인', '사이트01 PC 메인 화면 - 베이지/카키 톤', 'PC', 'PATH_FRONT_MAIN', 2, 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_ui VALUES ('U26041910000003', '01', 'TABLET_MAIN', '태블릿 메인', '사이트01 태블릿 메인 화면', 'TABLET', 'PATH_FRONT_MAIN', 3, 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_ui VALUES ('U26041910000004', '01', 'MOBILE_PROD_LIST', '모바일 상품목록', '사이트01 모바일 상품목록 화면', 'MOBILE', 'PATH_FRONT_PROD_LIST', 4, 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_ui VALUES ('U26041910000005', '01', 'PC_PROD_LIST', 'PC 상품목록', '사이트01 PC 상품목록 화면', 'PC', 'PATH_FRONT_PROD_LIST', 5, 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_ui VALUES ('U26041910000006', '01', 'MOBILE_PROD_VIEW', '모바일 상품상세', '사이트01 모바일 상품상세 화면', 'MOBILE', 'PATH_FRONT_PROD_VIEW', 6, 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_ui VALUES ('U26041910000007', '01', 'PC_PROD_VIEW', 'PC 상품상세', '사이트01 PC 상품상세 화면', 'PC', 'PATH_FRONT_PROD_VIEW', 7, 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_ui VALUES ('U26041910000008', '01', 'EVENT_2026_SPRING', '2026 봄 기획전', '사이트01 봄 시즌 기획전 한시 운영 UI (4월 한정)', 'MOBILE', 'PATH_EVENT', 10, 'Y', '2026-04-01', '2026-04-30', 'admin01', '2026-04-19 10:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_ui VALUES ('U26041910000009', '01', 'POPUP_XMAS_2026', '크리스마스 팝업', '사이트01 크리스마스 한정 팝업 UI', 'MOBILE', 'PATH_POPUP', 11, 'Y', '2026-12-24', '2026-12-25', 'admin01', '2026-04-19 10:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_ui VALUES ('U26041910000010', '01', 'MOBILE_MY', '모바일 마이페이지', '사이트01 모바일 마이페이지 메인', 'MOBILE', 'PATH_MY', 8, 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_ui VALUES ('U26041910000011', '01', 'MOBILE_CART', '모바일 장바구니', '사이트01 모바일 장바구니 화면', 'MOBILE', 'PATH_CART', 9, 'Y', '2026-04-01', '2099-12-31', 'admin01', '2026-04-19 10:00:00.000', NULL, NULL);

-- ======================================================================
-- 사이트02 - UI 정의 (민트 그린)
-- ======================================================================
INSERT INTO shopjoy_2604.dp_ui VALUES ('U26041911000001', '02', 'MOBILE_MAIN', '모바일 메인', '사이트02 모바일 메인 - 민트/세이지 그린 톤', 'MOBILE', 'PATH_FRONT_MAIN', 1, 'Y', '2026-04-01', '2099-12-31', 'admin02', '2026-04-19 11:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_ui VALUES ('U26041911000002', '02', 'PC_MAIN', 'PC 메인', '사이트02 PC 메인 - 민트/세이지 그린 톤', 'PC', 'PATH_FRONT_MAIN', 2, 'Y', '2026-04-01', '2099-12-31', 'admin02', '2026-04-19 11:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_ui VALUES ('U26041911000003', '02', 'MOBILE_PROD_LIST', '모바일 상품목록', '사이트02 모바일 친환경상품 목록', 'MOBILE', 'PATH_FRONT_PROD_LIST', 3, 'Y', '2026-04-01', '2099-12-31', 'admin02', '2026-04-19 11:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_ui VALUES ('U26041911000004', '02', 'PC_PROD_LIST', 'PC 상품목록', '사이트02 PC 친환경상품 목록', 'PC', 'PATH_FRONT_PROD_LIST', 4, 'Y', '2026-04-01', '2099-12-31', 'admin02', '2026-04-19 11:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_ui VALUES ('U26041911000005', '02', 'EVENT_ECO_2026', '에코 기획전', '사이트02 친환경 시즌 기획전', 'MOBILE', 'PATH_EVENT', 10, 'Y', '2026-04-22', '2026-05-31', 'admin02', '2026-04-19 11:00:00.000', NULL, NULL);

-- ======================================================================
-- 사이트03 - UI 정의 (로얄 퍼플 럭셔리)
-- ======================================================================
INSERT INTO shopjoy_2604.dp_ui VALUES ('U26041912000001', '03', 'MOBILE_MAIN', '모바일 메인', '사이트03 모바일 메인 - 로얄 퍼플 럭셔리', 'MOBILE', 'PATH_FRONT_MAIN', 1, 'Y', '2026-04-01', '2099-12-31', 'admin03', '2026-04-19 12:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_ui VALUES ('U26041912000002', '03', 'PC_MAIN', 'PC 메인', '사이트03 PC 메인 - 로얄 퍼플 럭셔리', 'PC', 'PATH_FRONT_MAIN', 2, 'Y', '2026-04-01', '2099-12-31', 'admin03', '2026-04-19 12:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_ui VALUES ('U26041912000003', '03', 'VIP_LOUNGE', 'VIP 라운지', '사이트03 VIP 회원 전용 라운지 화면', 'PC', 'PATH_VIP', 3, 'Y', '2026-04-01', '2099-12-31', 'admin03', '2026-04-19 12:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_ui VALUES ('U26041912000004', '03', 'EVENT_GALA_2026', '갈라 기획전', '사이트03 봄 갈라 한정 기획전', 'PC', 'PATH_EVENT', 10, 'Y', '2026-05-01', '2026-05-15', 'admin03', '2026-04-19 12:00:00.000', NULL, NULL);

-- ======================================================================
-- 관리자 BO UI - 대시보드/통계
-- ======================================================================
INSERT INTO shopjoy_2604.dp_ui VALUES ('U26041913000001', NULL, 'BO_DASHBOARD', '관리자 대시보드', 'BO 메인 대시보드 - 통계/차트', 'PC', 'PATH_BO_HOME', 1, 'Y', '2026-04-01', '2099-12-31', 'SYSTEM', '2026-04-19 13:00:00.000', NULL, NULL);
INSERT INTO shopjoy_2604.dp_ui VALUES ('U26041913000002', NULL, 'BO_STATS_SALES', '매출 통계', 'BO 매출 통계 화면', 'PC', 'PATH_BO_STATS', 2, 'Y', '2026-04-01', '2099-12-31', 'SYSTEM', '2026-04-19 13:00:00.000', NULL, NULL);
