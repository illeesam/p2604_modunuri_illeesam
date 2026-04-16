-- ============================================================
-- dp_ui_area : 디스플레이 UI-영역 매핑 (샘플 데이터)
-- ============================================================

-- 모바일 메인 UI > 상단 배너 영역
INSERT INTO dp_ui_area (ui_area_id, ui_id, area_id, area_sort_ord, use_yn, reg_by, reg_date)
VALUES ('260401060001', '260401000001', '260401010001', 1, 'Y', 'admin001', CURRENT_TIMESTAMP);

-- 모바일 메인 UI > 추천상품 영역
INSERT INTO dp_ui_area (ui_area_id, ui_id, area_id, area_sort_ord, use_yn, reg_by, reg_date)
VALUES ('260401060002', '260401000001', '260401010002', 2, 'Y', 'admin001', CURRENT_TIMESTAMP);

-- PC 메인 UI > 상단 배너 영역
INSERT INTO dp_ui_area (ui_area_id, ui_id, area_id, area_sort_ord, use_yn, reg_by, reg_date)
VALUES ('260401060003', '260401000002', '260401010003', 1, 'Y', 'admin001', CURRENT_TIMESTAMP);

-- PC 메인 UI > 사이드바 영역
INSERT INTO dp_ui_area (ui_area_id, ui_id, area_id, area_sort_ord, use_yn, reg_by, reg_date)
VALUES ('260401060004', '260401000002', '260401010004', 2, 'Y', 'admin001', CURRENT_TIMESTAMP);

-- 이벤트 페이지 UI > 콘텐츠 영역
INSERT INTO dp_ui_area (ui_area_id, ui_id, area_id, area_sort_ord, use_yn, reg_by, reg_date)
VALUES ('260401060005', '260401000003', '260401010005', 1, 'Y', 'admin001', CURRENT_TIMESTAMP);
