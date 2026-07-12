-- ============================================================
-- Migration: opt_id_1/2 → prod_opt_id_1/2
-- Date: 2026-07-12
-- 대상 테이블: od_cart / od_order_item / od_dliv_item / pd_prod_img / pd_prod_sku / st_settle_raw
-- 이전 마이그레이션(migration_20260712_pd_prod_opt_rename.sql)이 opt_item_id_1/2 → opt_id_1/2 를 적용한 경우
-- 이 스크립트가 opt_id_1/2 → prod_opt_id_1/2 로 2차 rename 한다.
-- DB에 아직 opt_item_id_1/2 가 있는 경우(1차 미적용)는 먼저 migration_20260712_pd_prod_opt_rename.sql 실행 후 이 스크립트를 실행한다.
-- ============================================================

-- 1. od_cart
ALTER TABLE shopjoy_2604.od_cart RENAME COLUMN opt_id_1 TO prod_opt_id_1;
ALTER TABLE shopjoy_2604.od_cart RENAME COLUMN opt_id_2 TO prod_opt_id_2;

COMMENT ON COLUMN shopjoy_2604.od_cart.prod_opt_id_1 IS '옵션1 값ID (pd_prod_opt.opt_id)';
COMMENT ON COLUMN shopjoy_2604.od_cart.prod_opt_id_2 IS '옵션2 값ID (pd_prod_opt.opt_id)';

-- 2. od_order_item
ALTER TABLE shopjoy_2604.od_order_item RENAME COLUMN opt_id_1 TO prod_opt_id_1;
ALTER TABLE shopjoy_2604.od_order_item RENAME COLUMN opt_id_2 TO prod_opt_id_2;

COMMENT ON COLUMN shopjoy_2604.od_order_item.prod_opt_id_1 IS '옵션1 값ID 스냅샷 (pd_prod_opt.opt_id)';
COMMENT ON COLUMN shopjoy_2604.od_order_item.prod_opt_id_2 IS '옵션2 값ID 스냅샷 (pd_prod_opt.opt_id)';

-- 3. od_dliv_item
ALTER TABLE shopjoy_2604.od_dliv_item RENAME COLUMN opt_id_1 TO prod_opt_id_1;
ALTER TABLE shopjoy_2604.od_dliv_item RENAME COLUMN opt_id_2 TO prod_opt_id_2;

COMMENT ON COLUMN shopjoy_2604.od_dliv_item.prod_opt_id_1 IS '옵션1 값ID 스냅샷 (pd_prod_opt.opt_id)';
COMMENT ON COLUMN shopjoy_2604.od_dliv_item.prod_opt_id_2 IS '옵션2 값ID 스냅샷 (pd_prod_opt.opt_id)';

-- 4. pd_prod_img
ALTER TABLE shopjoy_2604.pd_prod_img RENAME COLUMN opt_id_1 TO prod_opt_id_1;
ALTER TABLE shopjoy_2604.pd_prod_img RENAME COLUMN opt_id_2 TO prod_opt_id_2;

COMMENT ON COLUMN shopjoy_2604.pd_prod_img.prod_opt_id_1 IS '옵션1 값ID (pd_prod_opt.opt_id) — 이미지 연결';
COMMENT ON COLUMN shopjoy_2604.pd_prod_img.prod_opt_id_2 IS '옵션2 값ID (pd_prod_opt.opt_id) — 이미지 연결';

-- 5. pd_prod_sku
ALTER TABLE shopjoy_2604.pd_prod_sku RENAME COLUMN opt_id_1 TO prod_opt_id_1;
ALTER TABLE shopjoy_2604.pd_prod_sku RENAME COLUMN opt_id_2 TO prod_opt_id_2;

COMMENT ON COLUMN shopjoy_2604.pd_prod_sku.prod_opt_id_1 IS '옵션1 값ID (pd_prod_opt.opt_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_sku.prod_opt_id_2 IS '옵션2 값ID (pd_prod_opt.opt_id)';

-- 6. st_settle_raw
ALTER TABLE shopjoy_2604.st_settle_raw RENAME COLUMN opt_id_1 TO prod_opt_id_1;
ALTER TABLE shopjoy_2604.st_settle_raw RENAME COLUMN opt_id_2 TO prod_opt_id_2;

COMMENT ON COLUMN shopjoy_2604.st_settle_raw.prod_opt_id_1 IS '옵션1 값ID 스냅샷 (pd_prod_opt.opt_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.prod_opt_id_2 IS '옵션2 값ID 스냅샷 (pd_prod_opt.opt_id)';
