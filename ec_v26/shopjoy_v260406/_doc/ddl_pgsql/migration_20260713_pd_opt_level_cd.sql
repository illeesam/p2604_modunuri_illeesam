-- migration_20260713_pd_opt_level_cd.sql
-- 2026-07-13: 상품 옵션 레벨 분류 코드 컬럼 재설계
--
-- 변경 내용:
--   pd_prod:          opt_type_cd             → prod_opt_type_level1_cd (rename)
--   pd_prod_opt_type: prod_opt_input_type_cd  → DROP
--                     prod_opt_type_level1_cd → ADD (VARCHAR 20)
--                     prod_opt_type_level2_cd → ADD (VARCHAR 20)
--   pd_prod_opt:      prod_opt_val_code_id    → DROP
--                     opt_style               → prod_opt_style (rename)
--                     prod_opt_type_level1_cd → ADD (VARCHAR 20, 비정규화)
--                     prod_opt_type_level2_cd → ADD (VARCHAR 20, 비정규화, NULL 가능)

SET search_path = shopjoy_2604;

-- ============================================================
-- 1) pd_prod: opt_type_cd → prod_opt_type_level1_cd
-- ============================================================
ALTER TABLE pd_prod
  RENAME COLUMN opt_type_cd TO prod_opt_type_level1_cd;

COMMENT ON COLUMN pd_prod.prod_opt_type_level1_cd
  IS '옵션 1단 분류 코드 (코드: PROD_OPT_CATEGORY level=1) — 옵션형 상품에서 옵션 그룹들이 속하는 1단 분류 (COLOR/SIZE 등)';

-- ============================================================
-- 2) pd_prod_opt_type: prod_opt_input_type_cd DROP, 신규 컬럼 ADD
-- ============================================================
ALTER TABLE pd_prod_opt_type
  DROP COLUMN IF EXISTS prod_opt_input_type_cd;

ALTER TABLE pd_prod_opt_type
  ADD COLUMN prod_opt_type_level1_cd VARCHAR(20),
  ADD COLUMN prod_opt_type_level2_cd VARCHAR(20);

COMMENT ON COLUMN pd_prod_opt_type.prod_opt_type_level1_cd
  IS '이 차원이 속한 1단 분류 코드 (코드: PROD_OPT_CATEGORY level=1 — COLOR/SIZE 등)';
COMMENT ON COLUMN pd_prod_opt_type.prod_opt_type_level2_cd
  IS '이 차원이 속한 2단 분류 코드 (NULL 가능)';

-- ============================================================
-- 3) pd_prod_opt: prod_opt_val_code_id DROP, opt_style RENAME, 신규 컬럼 ADD
-- ============================================================
ALTER TABLE pd_prod_opt
  DROP COLUMN IF EXISTS prod_opt_val_code_id;

ALTER TABLE pd_prod_opt
  RENAME COLUMN opt_style TO prod_opt_style;

ALTER TABLE pd_prod_opt
  ADD COLUMN prod_opt_type_level1_cd VARCHAR(20),
  ADD COLUMN prod_opt_type_level2_cd VARCHAR(20);

COMMENT ON COLUMN pd_prod_opt.prod_opt_style
  IS '옵션 스타일 (컬러 hex 값, 아이콘 클래스 등 자유 문자열). 비어 있으면 표시명 텍스트만 사용';
COMMENT ON COLUMN pd_prod_opt.prod_opt_type_level1_cd
  IS '1단 분류 코드 — pd_prod.prod_opt_type_level1_cd 비정규화 (COLOR/SIZE 등)';
COMMENT ON COLUMN pd_prod_opt.prod_opt_type_level2_cd
  IS '2단 분류 코드 — pd_prod_opt_type.prod_opt_type_level2_cd 비정규화 (NULL 가능)';
