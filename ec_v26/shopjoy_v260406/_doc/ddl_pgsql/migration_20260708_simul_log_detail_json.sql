-- migration_20260708_simul_log_detail_json.sql
-- zd_simul_log에 ui_nm, detail_json 컬럼 추가
-- 엔티티(ZdSimulLog.java)에는 이미 선언되어 있으나 DDL에 누락되어 있어 추가

ALTER TABLE shopjoy_2604.zd_simul_log
    ADD COLUMN IF NOT EXISTS ui_nm       VARCHAR(50),
    ADD COLUMN IF NOT EXISTS detail_json TEXT;

COMMENT ON COLUMN shopjoy_2604.zd_simul_log.ui_nm       IS '화면명 (업무/화면 구분용)';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.detail_json IS '생성/수정된 엔티티 상세 JSON (params)';
