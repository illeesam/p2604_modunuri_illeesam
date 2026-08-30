-- migration: opt_type_cd 를 pd_prod_opt / pd_prod_opt_item 에서 제거
-- pd_prod.opt_type_cd 가 단일 관리 컬럼으로 유지됨
-- 실행 전 확인: SELECT prod_id, opt_type_cd FROM shopjoy_2604.pd_prod_opt LIMIT 20;

ALTER TABLE shopjoy_2604.pd_prod_opt      DROP COLUMN IF EXISTS opt_type_cd;
ALTER TABLE shopjoy_2604.pd_prod_opt_item DROP COLUMN IF EXISTS opt_type_cd;

-- pd_prod 에 opt_type_cd 추가 (단일 관리 컬럼)
ALTER TABLE shopjoy_2604.pd_prod ADD COLUMN IF NOT EXISTS opt_type_cd VARCHAR(20);
COMMENT ON COLUMN shopjoy_2604.pd_prod.opt_type_cd IS 'opt type cd (OPT_TYPE: COLOR/SIZE/MATERIAL/CUSTOM)';

-- pd_prod_opt_item.opt_nm → opt_item_nm 컬럼명 변경
ALTER TABLE shopjoy_2604.pd_prod_opt_item RENAME COLUMN opt_nm TO opt_item_nm;
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_item.opt_item_nm IS 'opt item nm (예: 빨강, M)';

-- pd_prod_opt.opt_grp_nm → opt_nm 컬럼명 변경
ALTER TABLE shopjoy_2604.pd_prod_opt RENAME COLUMN opt_grp_nm TO opt_nm;
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt.opt_nm IS 'opt nm (예: 색상, 사이즈)';

-- pd_prod_opt_item.opt_val → opt_item_val, opt_val_code_id → opt_item_val_code_id 컬럼명 변경
ALTER TABLE shopjoy_2604.pd_prod_opt_item RENAME COLUMN opt_val TO opt_item_val;
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_item.opt_item_val IS '실제 저장값 — opt_item_val_code_id 선택 시 codeValue 자동 채움, 직접입력도 허용';
ALTER TABLE shopjoy_2604.pd_prod_opt_item RENAME COLUMN opt_val_code_id TO opt_item_val_code_id;
COMMENT ON COLUMN shopjoy_2604.pd_prod_opt_item.opt_item_val_code_id IS 'OPT_ITEM_VAL 공통코드 참조ID (sy_code.code_id) — NULL이면 opt_item_val 직접입력';
