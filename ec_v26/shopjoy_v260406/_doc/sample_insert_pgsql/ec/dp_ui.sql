-- ============================================================
-- dp_ui : 디스플레이 UI (샘플 데이터)
-- ============================================================

-- 모바일 메인 UI
INSERT INTO dp_ui (ui_id, site_id, ui_cd, ui_nm, ui_desc, device_type_cd, ui_path, sort_ord, use_yn, reg_by, reg_date)
VALUES ('260401000001', '260401', 'MOBILE_MAIN', '모바일 메인', '모바일 메인 페이지 UI', 'MOBILE', 'FRONT.모바일메인', 1, 'Y', 'admin001', CURRENT_TIMESTAMP);

-- PC 메인 UI
INSERT INTO dp_ui (ui_id, site_id, ui_cd, ui_nm, ui_desc, device_type_cd, ui_path, sort_ord, use_yn, reg_by, reg_date)
VALUES ('260401000002', '260401', 'PC_MAIN', 'PC 메인', 'PC 메인 페이지 UI', 'PC', 'FRONT.PC메인', 2, 'Y', 'admin001', CURRENT_TIMESTAMP);

-- 이벤트 페이지 UI
INSERT INTO dp_ui (ui_id, site_id, ui_cd, ui_nm, ui_desc, device_type_cd, ui_path, sort_ord, use_yn, reg_by, reg_date)
VALUES ('260401000003', '260401', 'EVENT_PAGE', '이벤트 페이지', '이벤트 전용 페이지 UI', 'ALL', 'FRONT.이벤트', 3, 'Y', 'admin001', CURRENT_TIMESTAMP);
