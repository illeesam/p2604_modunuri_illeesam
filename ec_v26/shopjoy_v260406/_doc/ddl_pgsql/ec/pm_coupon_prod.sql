-- pm_coupon_prod 테이블 DDL
-- 쿠폰 적용 상품 전개 (배치 생성, pm_coupon_item 기반)

CREATE TABLE shopjoy_2604.pm_coupon_prod (
    coupon_id  VARCHAR(21) NOT NULL,
    prod_id    VARCHAR(21) NOT NULL,
    site_id    VARCHAR(21) NOT NULL,
    reg_date   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (coupon_id, prod_id)
);

COMMENT ON TABLE  shopjoy_2604.pm_coupon_prod IS '쿠폰 적용 상품 전개 (배치 생성)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_prod.coupon_id IS '쿠폰ID (pm_coupon.coupon_id)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_prod.prod_id   IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_prod.site_id   IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_prod.reg_date  IS '배치 생성일시';

CREATE INDEX idx_pm_coupon_prod_prod   ON shopjoy_2604.pm_coupon_prod USING btree (prod_id);
CREATE INDEX idx_pm_coupon_prod_site   ON shopjoy_2604.pm_coupon_prod USING btree (site_id);
CREATE INDEX idx_pm_coupon_prod_coupon ON shopjoy_2604.pm_coupon_prod USING btree (coupon_id);
