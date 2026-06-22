-- ============================================================
-- cm_dashboard : ui_nm 컬럼 추가 (2026-06-23)
-- 대상화면명 — 대시보드가 여러 개이므로 화면 구분 필드 추가
-- ============================================================
ALTER TABLE shopjoy_2604.cm_dashboard
    ADD COLUMN IF NOT EXISTS ui_nm VARCHAR(100);

COMMENT ON COLUMN shopjoy_2604.cm_dashboard.ui_nm IS '대상화면명 (DashboardBoEc01 등)';

-- comp_id 기준으로 대상화면명 일괄 업데이트 (샘플 데이터 반영)
UPDATE shopjoy_2604.cm_dashboard
SET ui_nm = CASE
    WHEN comp_id LIKE 'COMP01%' THEN 'DashboardBoEc01'
    WHEN comp_id LIKE 'COMP02%' THEN 'DashboardBoEc02'
    WHEN comp_id LIKE 'COMP03%' THEN 'DashboardBoEc03'
    WHEN comp_id LIKE 'COMP04%' THEN 'DashboardBoEc02'
    ELSE NULL
END
WHERE ui_nm IS NULL;

CREATE INDEX IF NOT EXISTS idx_cm_dashboard_ui_nm ON shopjoy_2604.cm_dashboard (ui_nm);
