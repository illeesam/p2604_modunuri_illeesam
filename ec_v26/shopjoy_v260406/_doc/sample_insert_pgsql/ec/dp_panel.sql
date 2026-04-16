-- ============================================================
-- dp_panel : 디스플레이 패널 (샘플 데이터)
-- ============================================================

-- 모바일 메인 > 상단 배너 > 패널 1
INSERT INTO dp_panel (panel_id, area_id, site_id, panel_nm, panel_type_cd, disp_path, sort_ord, visibility_targets, disp_panel_status_cd, content_json, reg_by, reg_date)
VALUES ('260401020001', '260401010001', '260401', '모바일 배너 1', 'BANNER', 'FRONT.모바일메인.상단배너.패널1', 1, '^PUBLIC^', 'ACTIVE', '{}', 'admin001', CURRENT_TIMESTAMP);

-- 모바일 메인 > 상단 배너 > 패널 2
INSERT INTO dp_panel (panel_id, area_id, site_id, panel_nm, panel_type_cd, disp_path, sort_ord, visibility_targets, disp_panel_status_cd, content_json, reg_by, reg_date)
VALUES ('260401020002', '260401010001', '260401', '모바일 배너 2', 'BANNER', 'FRONT.모바일메인.상단배너.패널2', 2, '^PUBLIC^MEMBER^', 'ACTIVE', '{}', 'admin001', CURRENT_TIMESTAMP);

-- 모바일 메인 > 추천상품 > 패널
INSERT INTO dp_panel (panel_id, area_id, site_id, panel_nm, panel_type_cd, disp_path, sort_ord, visibility_targets, disp_panel_status_cd, content_json, reg_by, reg_date)
VALUES ('260401020003', '260401010002', '260401', '추천상품 슬라이더', 'SLIDER', 'FRONT.모바일메인.추천상품.슬라이더', 1, '^PUBLIC^', 'ACTIVE', '{}', 'admin001', CURRENT_TIMESTAMP);

-- PC 메인 > 상단 배너 > 패널
INSERT INTO dp_panel (panel_id, area_id, site_id, panel_nm, panel_type_cd, disp_path, sort_ord, visibility_targets, disp_panel_status_cd, content_json, reg_by, reg_date)
VALUES ('260401020004', '260401010003', '260401', 'PC 메인 배너', 'BANNER', 'FRONT.PC메인.상단배너.패널', 1, '^PUBLIC^', 'ACTIVE', '{}', 'admin001', CURRENT_TIMESTAMP);

-- PC 메인 > 사이드바 > 패널
INSERT INTO dp_panel (panel_id, area_id, site_id, panel_nm, panel_type_cd, disp_path, sort_ord, visibility_targets, disp_panel_status_cd, content_json, reg_by, reg_date)
VALUES ('260401020005', '260401010004', '260401', 'PC 사이드바 추천', 'PRODUCT', 'FRONT.PC메인.사이드바.추천상품', 1, '^PUBLIC^', 'ACTIVE', '{}', 'admin001', CURRENT_TIMESTAMP);

-- 이벤트 페이지 > 콘텐츠 > 메인 패널
INSERT INTO dp_panel (panel_id, area_id, site_id, panel_nm, panel_type_cd, disp_path, sort_ord, visibility_targets, disp_panel_status_cd, content_json, reg_by, reg_date)
VALUES ('260401020006', '260401010005', '260401', '이벤트 메인 콘텐츠', 'CONTENT', 'FRONT.이벤트.콘텐츠.메인', 1, '^PUBLIC^', 'ACTIVE', '{}', 'admin001', CURRENT_TIMESTAMP);
