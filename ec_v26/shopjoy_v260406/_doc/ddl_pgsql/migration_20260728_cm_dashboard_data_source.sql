-- ============================================================================
-- cm_dashboard_item — 실데이터 소스 연결 (2026-07-28)
--
-- 지금까지 대시보드 데이터는 전부 cm_dashboard_item_data 에 미리 넣어둔 행이었다.
-- 샘플/집계 배치 결과를 보여주는 데는 맞지만, "지금 미처리 주문이 몇 건인가" 같은
-- 항목은 조회 시점에 실제 테이블을 세야 의미가 있다.
--
-- data_source_cd 가 있으면 조회 시 등록된 집계 쿼리를 돌려 실데이터를 반환하고,
-- 없으면 기존대로 cm_dashboard_item_data 를 읽는다(하위호환 — 기존 대시보드 무영향).
--   → CmDashboardDataSourceRegistry 에 같은 이름으로 등록돼 있어야 한다.
--     등록되지 않은 값이면 조용히 저장 데이터로 폴백한다(오타로 화면이 죽지 않게).
--
-- 왜 SQL 을 컬럼에 담지 않는가: 임의 SQL 을 DB 값으로 두면 화면에서 편집 가능한
-- 인젝션 경로가 된다. 이름만 두고 실제 쿼리는 코드에 둔다.
-- ============================================================================

ALTER TABLE shopjoy_2604.cm_dashboard_item
    ADD COLUMN IF NOT EXISTS data_source_cd VARCHAR(50);

COMMENT ON COLUMN shopjoy_2604.cm_dashboard_item.data_source_cd IS
  '실데이터 소스명 (CmDashboardDataSourceRegistry 등록명). 비우면 cm_dashboard_item_data 사용';

CREATE INDEX IF NOT EXISTS ix_cm_dashboard_item_source
    ON shopjoy_2604.cm_dashboard_item (data_source_cd);
