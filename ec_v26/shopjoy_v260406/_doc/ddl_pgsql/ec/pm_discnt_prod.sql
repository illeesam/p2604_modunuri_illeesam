-- pm_discnt_prod 테이블 DDL
-- 할인 적용 상품 전개 (배치 생성, pm_discnt_item 기반)

CREATE TABLE shopjoy_2604.pm_discnt_prod (
    discnt_id  VARCHAR(21) NOT NULL,
    prod_id    VARCHAR(21) NOT NULL,
    site_id    VARCHAR(21) NOT NULL,
    reg_date   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (discnt_id, prod_id)
);

COMMENT ON TABLE  shopjoy_2604.pm_discnt_prod IS '할인 적용 상품 전개 (배치 생성)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_prod.discnt_id IS '할인ID (pm_discnt.discnt_id)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_prod.prod_id   IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_prod.site_id   IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_prod.reg_date  IS '배치 생성일시';

CREATE INDEX idx_pm_discnt_prod_prod   ON shopjoy_2604.pm_discnt_prod USING btree (prod_id);
CREATE INDEX idx_pm_discnt_prod_site   ON shopjoy_2604.pm_discnt_prod USING btree (site_id);
CREATE INDEX idx_pm_discnt_prod_discnt ON shopjoy_2604.pm_discnt_prod USING btree (discnt_id);
