-- ============================================================
-- migration: st_settle_adj.aprv_status_cd 컬럼 추가
--
-- 사유: Entity/Service/Frontend 는 승인상태 컬럼을 사용 중이나 DDL 누락.
--       프로젝트 표준(`_cd` 접미어)에 맞춰 `aprv_status_cd` 로 신규 추가.
--       값은 이미 등록된 공통코드 그룹 SETTLE_ADJ_STATUS (대기/승인/반려) 사용.
-- 적용일: 2026-05-05
-- ============================================================

ALTER TABLE shopjoy_2604.st_settle_adj
    ADD COLUMN IF NOT EXISTS aprv_status_cd VARCHAR(20);

COMMENT ON COLUMN shopjoy_2604.st_settle_adj.aprv_status_cd
    IS '승인상태 (코드: SETTLE_ADJ_STATUS — 대기/승인/반려)';

-- 기존 NULL 행 기본값(대기) 채움
UPDATE shopjoy_2604.st_settle_adj
   SET aprv_status_cd = '대기'
 WHERE aprv_status_cd IS NULL;
