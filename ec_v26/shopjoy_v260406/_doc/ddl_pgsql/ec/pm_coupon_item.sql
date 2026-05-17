-- pm_coupon_item 테이블 DDL
-- 쿠폰 적용 대상 항목 (상품/카테고리/판매자/브랜드)

CREATE TABLE shopjoy_2604.pm_coupon_item (
    coupon_item_id VARCHAR(21) NOT NULL PRIMARY KEY,
    coupon_id      VARCHAR(21) NOT NULL,
    site_id        VARCHAR(21) NOT NULL,
    target_type_cd VARCHAR(20) NOT NULL,
    target_id      VARCHAR(21) NOT NULL,
    reg_by         VARCHAR(30),
    reg_date       TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    upd_by         VARCHAR(30),
    upd_date       TIMESTAMP  
);

COMMENT ON TABLE  shopjoy_2604.pm_coupon_item IS '쿠폰 적용 대상 항목 (상품/카테고리/판매자/브랜드)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_item.coupon_item_id IS '쿠폰항목ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_item.coupon_id IS '쿠폰ID (pm_coupon.coupon_id)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_item.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_item.target_type_cd IS '대상유형 (코드: COUPON_ITEM_TARGET — PRODUCT/CATEGORY/VENDOR/BRAND)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_item.target_id IS '대상ID (prod_id / category_id / vendor_id / brand_id)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_item.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_item.reg_date IS '등록일';

CREATE INDEX idx_pm_coupon_item_coupon ON shopjoy_2604.pm_coupon_item USING btree (coupon_id);
CREATE INDEX idx_pm_coupon_item_site ON shopjoy_2604.pm_coupon_item USING btree (site_id);
CREATE INDEX idx_pm_coupon_item_target ON shopjoy_2604.pm_coupon_item USING btree (target_type_cd, target_id);
CREATE UNIQUE INDEX pm_coupon_item_coupon_id_target_type_cd_target_id_key ON shopjoy_2604.pm_coupon_item USING btree (coupon_id, target_type_cd, target_id);
