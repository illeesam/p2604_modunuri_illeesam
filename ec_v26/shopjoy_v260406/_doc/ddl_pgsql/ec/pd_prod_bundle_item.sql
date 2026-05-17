-- pd_prod_bundle_item 테이블 DDL
-- 묶음상품 구성품 (prod_type_cd=BUNDLE)

CREATE TABLE shopjoy_2604.pd_prod_bundle_item (
    bundle_item_id VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id        VARCHAR(21)  NOT NULL,
    bundle_prod_id VARCHAR(21)  NOT NULL,
    item_prod_id   VARCHAR(21)  NOT NULL,
    item_sku_id    VARCHAR(21) ,
    item_qty       INTEGER      DEFAULT 1,
    price_rate     NUMERIC(5,2) NOT NULL,
    sort_ord       INTEGER      DEFAULT 0,
    use_yn         VARCHAR(1)   DEFAULT 'Y'::bpchar,
    reg_by         VARCHAR(30) ,
    reg_date       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by         VARCHAR(30) ,
    upd_date       TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.pd_prod_bundle_item IS '묶음상품 구성품 (prod_type_cd=BUNDLE)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_bundle_item.bundle_item_id IS '묶음구성ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_bundle_item.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_bundle_item.bundle_prod_id IS '묶음상품ID (pd_prod.prod_id, prod_type_cd=BUNDLE)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_bundle_item.item_prod_id IS '구성품 상품ID (pd_prod.prod_id) — 독립 판매 상품';
COMMENT ON COLUMN shopjoy_2604.pd_prod_bundle_item.item_sku_id IS '구성품 SKU ID (pd_prod_sku.sku_id, NULL=SKU 미지정)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_bundle_item.item_qty IS '구성 수량 (기본 1)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_bundle_item.price_rate IS '가격 안분율 (%) — 구성품 합계 100% 필수, 부분클레임 환불 계산 기준';
COMMENT ON COLUMN shopjoy_2604.pd_prod_bundle_item.sort_ord IS '노출 정렬 순서';
COMMENT ON COLUMN shopjoy_2604.pd_prod_bundle_item.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.pd_prod_bundle_item.reg_by IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_bundle_item.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.pd_prod_bundle_item.upd_by IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_bundle_item.upd_date IS '수정일';

CREATE INDEX idx_pd_prod_bundle_item_bundle ON shopjoy_2604.pd_prod_bundle_item USING btree (bundle_prod_id, sort_ord);
CREATE INDEX idx_pd_prod_bundle_item_item ON shopjoy_2604.pd_prod_bundle_item USING btree (item_prod_id);
CREATE INDEX idx_pd_prod_bundle_item_site ON shopjoy_2604.pd_prod_bundle_item USING btree (site_id);
CREATE UNIQUE INDEX pd_prod_bundle_item_bundle_prod_id_item_prod_id_key ON shopjoy_2604.pd_prod_bundle_item USING btree (bundle_prod_id, item_prod_id);
