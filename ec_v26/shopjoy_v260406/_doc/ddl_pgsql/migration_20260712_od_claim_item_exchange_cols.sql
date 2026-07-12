-- migration_20260712_od_claim_item_exchange_cols.sql
-- od_claim_item 교환 관련 컬럼 추가 (prod_sku_id + new_* 8개)
-- 적용 대상: shopjoy_2604
-- 실행 전 백업 권장

-- 1) 기존 스냅샷 컬럼에 누락된 prod_sku_id 추가
ALTER TABLE shopjoy_2604.od_claim_item
    ADD COLUMN IF NOT EXISTS prod_sku_id VARCHAR(21);

COMMENT ON COLUMN shopjoy_2604.od_claim_item.prod_sku_id IS 'SKU ID (pd_prod_sku.prod_sku_id, 주문시점 스냅샷)';

-- 2) 교환 요청 대상 컬럼 추가 (취소/반품 시 NULL, 교환 시에만 사용)
ALTER TABLE shopjoy_2604.od_claim_item
    ADD COLUMN IF NOT EXISTS new_prod_id      VARCHAR(21),
    ADD COLUMN IF NOT EXISTS new_prod_sku_id  VARCHAR(21),
    ADD COLUMN IF NOT EXISTS new_prod_opt_id_1 VARCHAR(21),
    ADD COLUMN IF NOT EXISTS new_prod_opt_id_2 VARCHAR(21),
    ADD COLUMN IF NOT EXISTS new_prod_nm      VARCHAR(200),
    ADD COLUMN IF NOT EXISTS new_prod_option  VARCHAR(500),
    ADD COLUMN IF NOT EXISTS new_qty          INTEGER,
    ADD COLUMN IF NOT EXISTS new_unit_price   BIGINT;

COMMENT ON COLUMN shopjoy_2604.od_claim_item.new_prod_id      IS '[교환] 교환 요청 상품ID (claim_type_cd=EXCHANGE 시에만 사용)';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.new_prod_sku_id  IS '[교환] 교환 요청 SKU ID';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.new_prod_opt_id_1 IS '[교환] 교환 요청 옵션1 값ID';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.new_prod_opt_id_2 IS '[교환] 교환 요청 옵션2 값ID';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.new_prod_nm      IS '[교환] 교환 요청 상품명';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.new_prod_option  IS '[교환] 교환 요청 옵션 텍스트';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.new_qty          IS '[교환] 교환 요청 수량';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.new_unit_price   IS '[교환] 교환 요청 단가 (정산 차액 계산: new_unit_price*new_qty - unit_price*claim_qty)';

-- 3) od_dliv_item 코멘트 수정 (opt_id → prod_opt_id)
COMMENT ON COLUMN shopjoy_2604.od_dliv_item.prod_opt_id_1 IS '옵션1 값ID 스냅샷 (pd_prod_opt.prod_opt_id)';
COMMENT ON COLUMN shopjoy_2604.od_dliv_item.prod_opt_id_2 IS '옵션2 값ID 스냅샷 (pd_prod_opt.prod_opt_id)';
