-- pm_coupon_prod 테이블 DDL
-- 쿠폰 적용 상품 전개 (배치 생성, pm_coupon_item 기반)

CREATE TABLE shopjoy_2604.pm_coupon_prod (
    coupon_prod_id VARCHAR(21)  NOT NULL,
    coupon_id  VARCHAR(21) NOT NULL,
    prod_id    VARCHAR(21) NOT NULL,
    reg_site_id    VARCHAR(21) NOT NULL,
    reg_date   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pm_coupon_prod_pk_coupon_prod_id PRIMARY KEY (coupon_prod_id),
    CONSTRAINT pm_coupon_prod_uk_coupon_id_prod_id_x2 UNIQUE (coupon_id, prod_id)
);

COMMENT ON TABLE  shopjoy_2604.pm_coupon_prod IS '쿠폰 적용 상품 전개 (배치 생성)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_prod.coupon_prod_id IS '쿠폰상품ID (PK)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_prod.coupon_id IS '쿠폰ID (pm_coupon.coupon_id)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_prod.prod_id   IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_prod.reg_site_id   IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_prod.reg_date  IS '배치 생성일시';

CREATE INDEX pm_coupon_prod_ix01_prod_id ON shopjoy_2604.pm_coupon_prod USING btree (prod_id);
