-- ============================================================================
-- 마이그레이션: 일자(Date) 의미 컬럼을 TIMESTAMP → DATE 로 변경
--
-- 배경: 화면에서 <input type="date"> 로 'yyyy-MM-dd' 만 입력받고, JPA Entity 도
--       LocalDate 로 통일. DB 컬럼은 TIMESTAMP 인데 시각 부분이 의미 없이 00:00:00
--       으로 채워져 일관성 저하. (사실 LocalDate ↔ TIMESTAMP 자동 변환은 가능하나
--       의미 명확화와 인덱스/조회 효율을 위해 DATE 로 정정)
--
-- 대상 테이블 / 컬럼:
--   - shopjoy_2604.sy_notice (start_date, end_date)
--   - shopjoy_2604.pm_plan   (start_date, end_date)
--   - shopjoy_2604.pm_gift   (start_date, end_date)
--   - shopjoy_2604.pm_discnt (start_date, end_date)
--
-- 제외 대상 (시각 의미 유지):
--   - shopjoy_2604.sy_vendor_content (start_date, end_date)  ← 노출 일시
--   - shopjoy_2604.sy_alarm 등 이력성 테이블 send_date, run_date 등
--
-- 일자: 2026-05-28
--
-- 변경:
--   - 컬럼 타입 TIMESTAMP → DATE (시각 부분 절단)
--   - 종속 인덱스(idx_pm_plan_date / idx_pm_gift_date / idx_pm_discnt_date)는
--     PostgreSQL ALTER COLUMN TYPE 시 자동 재구축됨
--   - 컬럼 코멘트 갱신: "...일시" → "...일자"
--
-- 적용 순서:
--   1) BEGIN
--   2) ALTER COLUMN TYPE 4건 (테이블별)
--   3) COMMENT 갱신
--   4) COMMIT
--
-- 롤백:
--   - DATE → TIMESTAMP 는 정보 손실 없이 복원 가능 (시각은 00:00:00 로 채워짐)
--   - ALTER TABLE ... ALTER COLUMN start_date TYPE TIMESTAMP USING start_date::timestamp;
-- ============================================================================

BEGIN;

-- 1) sy_notice
ALTER TABLE shopjoy_2604.sy_notice
    ALTER COLUMN start_date TYPE DATE USING start_date::date,
    ALTER COLUMN end_date   TYPE DATE USING end_date::date;
COMMENT ON COLUMN shopjoy_2604.sy_notice.start_date IS '노출시작일';
COMMENT ON COLUMN shopjoy_2604.sy_notice.end_date   IS '노출종료일';

-- 2) pm_plan
ALTER TABLE shopjoy_2604.pm_plan
    ALTER COLUMN start_date TYPE DATE USING start_date::date,
    ALTER COLUMN end_date   TYPE DATE USING end_date::date;
COMMENT ON COLUMN shopjoy_2604.pm_plan.start_date IS '시작일';
COMMENT ON COLUMN shopjoy_2604.pm_plan.end_date   IS '종료일';

-- 3) pm_gift
ALTER TABLE shopjoy_2604.pm_gift
    ALTER COLUMN start_date TYPE DATE USING start_date::date,
    ALTER COLUMN end_date   TYPE DATE USING end_date::date;
COMMENT ON COLUMN shopjoy_2604.pm_gift.start_date IS '시작일';
COMMENT ON COLUMN shopjoy_2604.pm_gift.end_date   IS '종료일';

-- 4) pm_discnt
ALTER TABLE shopjoy_2604.pm_discnt
    ALTER COLUMN start_date TYPE DATE USING start_date::date,
    ALTER COLUMN end_date   TYPE DATE USING end_date::date;
COMMENT ON COLUMN shopjoy_2604.pm_discnt.start_date IS '할인 시작일';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.end_date   IS '할인 종료일';

COMMIT;

-- 검증 쿼리
-- SELECT table_name, column_name, data_type
--   FROM information_schema.columns
--  WHERE table_schema = 'shopjoy_2604'
--    AND table_name IN ('sy_notice', 'pm_plan', 'pm_gift', 'pm_discnt')
--    AND column_name IN ('start_date', 'end_date')
--  ORDER BY table_name, column_name;
