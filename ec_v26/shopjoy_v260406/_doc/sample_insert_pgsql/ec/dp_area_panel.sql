-- ============================================================
-- dp_area_panel : 디스플레이 영역-패널 매핑 (샘플 데이터)
-- ============================================================

-- 모바일 상단 배너 영역 > 배너 패널 1
INSERT INTO dp_area_panel (area_panel_id, area_id, panel_id, panel_sort_ord, use_yn, reg_by, reg_date)
VALUES ('260401050001', '260401010001', '260401020001', 1, 'Y', 'admin001', CURRENT_TIMESTAMP);

-- 모바일 상단 배너 영역 > 배너 패널 2
INSERT INTO dp_area_panel (area_panel_id, area_id, panel_id, panel_sort_ord, use_yn, reg_by, reg_date)
VALUES ('260401050002', '260401010001', '260401020002', 2, 'Y', 'admin001', CURRENT_TIMESTAMP);

-- 모바일 추천상품 영역 > 슬라이더 패널
INSERT INTO dp_area_panel (area_panel_id, area_id, panel_id, panel_sort_ord, use_yn, reg_by, reg_date)
VALUES ('260401050003', '260401010002', '260401020003', 1, 'Y', 'admin001', CURRENT_TIMESTAMP);

-- PC 상단 배너 영역 > PC 배너 패널
INSERT INTO dp_area_panel (area_panel_id, area_id, panel_id, panel_sort_ord, use_yn, reg_by, reg_date)
VALUES ('260401050004', '260401010003', '260401020004', 1, 'Y', 'admin001', CURRENT_TIMESTAMP);

-- PC 사이드바 영역 > 추천상품 패널
INSERT INTO dp_area_panel (area_panel_id, area_id, panel_id, panel_sort_ord, use_yn, reg_by, reg_date)
VALUES ('260401050005', '260401010004', '260401020005', 1, 'Y', 'admin001', CURRENT_TIMESTAMP);

-- 이벤트 콘텐츠 영역 > 이벤트 메인 패널
INSERT INTO dp_area_panel (area_panel_id, area_id, panel_id, panel_sort_ord, use_yn, reg_by, reg_date)
VALUES ('260401050006', '260401010005', '260401020006', 1, 'Y', 'admin001', CURRENT_TIMESTAMP);
