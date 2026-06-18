-- sy_prop 테이블 prop_profile 컬럼 추가 (2026-06-18)
-- 용도: 프로퍼티를 특정 Spring 활성 프로파일(local/dev/prod)에만 적용
-- 형식: ^local^dev^ (caret 구분 멀티값, 비어있으면 전체 환경 적용)

ALTER TABLE shopjoy_2604.sy_prop
    ADD COLUMN IF NOT EXISTS prop_profile VARCHAR(100);

COMMENT ON COLUMN shopjoy_2604.sy_prop.prop_profile
    IS '적용 프로파일 (^local^dev^prod^ 형식, 비어있으면 전체 환경 적용)';
