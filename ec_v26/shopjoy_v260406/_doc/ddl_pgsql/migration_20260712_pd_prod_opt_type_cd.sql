-- migration: pd_prod 에 opt_type_cd 컬럼 추가
ALTER TABLE shopjoy_2604.pd_prod ADD COLUMN IF NOT EXISTS opt_type_cd VARCHAR(20);
COMMENT ON COLUMN shopjoy_2604.pd_prod.opt_type_cd IS '옵션 카테고리 코드 (코드: PROD_OPT_CATEGORY level=1) — 옵션형 상품에서 옵션 그룹들이 속하는 카테고리';
