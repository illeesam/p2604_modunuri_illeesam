-- pd_prod_sku 테이블 DDL
-- 상품 옵션 SKU (조합별 재고/가격)

CREATE TABLE shopjoy_2604.pd_prod_sku (
    sku_id         VARCHAR(21) NOT NULL PRIMARY KEY,
    site_id        VARCHAR(21) NOT NULL,
    prod_id        VARCHAR(21) NOT NULL,
    opt_item_id_1  VARCHAR(21),
    opt_item_id_2  VARCHAR(21),
    sku_code       VARCHAR(50),
    add_price      BIGINT      DEFAULT 0,
    prod_opt_stock INTEGER     DEFAULT 0,
    use_yn         VARCHAR(1)  DEFAULT 'Y'::bpchar,
    reg_by         VARCHAR(30),
    reg_date       TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    upd_by         VARCHAR(30),
    upd_date       TIMESTAMP  
);

COMMENT ON TABLE  shopjoy_2604.pd_prod_sku IS '상품 옵션 SKU (조합별 재고/가격)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_sku.sku_id IS 'SKU ID';
COMMENT ON COLUMN shopjoy_2604.pd_prod_sku.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_sku.prod_id IS '상품ID';
COMMENT ON COLUMN shopjoy_2604.pd_prod_sku.opt_item_id_1 IS '옵션1 값ID (pd_prod_opt_item.opt_item_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_sku.opt_item_id_2 IS '옵션2 값ID (pd_prod_opt_item.opt_item_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_sku.sku_code IS '자체 SKU 코드';
COMMENT ON COLUMN shopjoy_2604.pd_prod_sku.add_price IS '옵션 추가금액 (기본가 대비)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_sku.prod_opt_stock IS '해당 옵션 조합 재고수량';
COMMENT ON COLUMN shopjoy_2604.pd_prod_sku.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.pd_prod_sku.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_sku.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.pd_prod_sku.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_sku.upd_date IS '수정일';

CREATE INDEX idx_pd_prod_sku_site ON shopjoy_2604.pd_prod_sku USING btree (site_id);
