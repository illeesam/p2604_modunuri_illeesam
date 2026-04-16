-- ============================================================
-- dp_area : 디스플레이 영역 (샘플 데이터)
-- ============================================================

-- 모바일 메인 > 상단 배너 영역
INSERT INTO dp_area (area_id, ui_id, site_id, area_cd, area_nm, area_type_cd, area_desc, disp_path, sort_ord, use_yn, reg_by, reg_date)
VALUES ('260401010001', '260401000001', '260401', 'MOBILE_TOP_BANNER', '상단 배너', 'FULL', '모바일 상단 배너 영역', 'FRONT.모바일메인.상단배너', 1, 'Y', 'admin001', CURRENT_TIMESTAMP);

-- 모바일 메인 > 상품 추천 영역
INSERT INTO dp_area (area_id, ui_id, site_id, area_cd, area_nm, area_type_cd, area_desc, disp_path, sort_ord, use_yn, reg_by, reg_date)
VALUES ('260401010002', '260401000001', '260401', 'MOBILE_PROD_REC', '추천상품', 'FULL', '모바일 추천상품 영역', 'FRONT.모바일메인.추천상품', 2, 'Y', 'admin001', CURRENT_TIMESTAMP);

-- PC 메인 > 상단 배너 영역
INSERT INTO dp_area (area_id, ui_id, site_id, area_cd, area_nm, area_type_cd, area_desc, disp_path, sort_ord, use_yn, reg_by, reg_date)
VALUES ('260401010003', '260401000002', '260401', 'PC_TOP_BANNER', 'PC 상단 배너', 'FULL', 'PC 상단 배너 영역', 'FRONT.PC메인.상단배너', 1, 'Y', 'admin001', CURRENT_TIMESTAMP);

-- PC 메인 > 사이드바 영역
INSERT INTO dp_area (area_id, ui_id, site_id, area_cd, area_nm, area_type_cd, area_desc, disp_path, sort_ord, use_yn, reg_by, reg_date)
VALUES ('260401010004', '260401000002', '260401', 'PC_SIDEBAR', 'PC 사이드바', 'SIDEBAR', 'PC 좌측 사이드바 영역', 'FRONT.PC메인.사이드바', 2, 'Y', 'admin001', CURRENT_TIMESTAMP);

-- 이벤트 페이지 > 메인 콘텐츠 영역
INSERT INTO dp_area (area_id, ui_id, site_id, area_cd, area_nm, area_type_cd, area_desc, disp_path, sort_ord, use_yn, reg_by, reg_date)
VALUES ('260401010005', '260401000003', '260401', 'EVENT_CONTENT', '이벤트 콘텐츠', 'FULL', '이벤트 페이지 메인 영역', 'FRONT.이벤트.콘텐츠', 1, 'Y', 'admin001', CURRENT_TIMESTAMP);
