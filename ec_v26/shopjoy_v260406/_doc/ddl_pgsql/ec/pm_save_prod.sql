-- pm_save_prod 테이블 DDL
-- 적립금 적용 상품 전개 (배치 생성, pm_save_item 기반)

CREATE TABLE shopjoy_2604.pm_save_prod (
    save_prod_id VARCHAR(21)  NOT NULL,
    save_id    VARCHAR(21) NOT NULL,
    prod_id    VARCHAR(21) NOT NULL,
    reg_site_id    VARCHAR(21) NOT NULL,
    reg_date   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pm_save_prod_pk_save_prod_id PRIMARY KEY (save_prod_id),
    CONSTRAINT pm_save_prod_uk_save_id_prod_id_x2 UNIQUE (save_id, prod_id)
);

COMMENT ON TABLE  shopjoy_2604.pm_save_prod IS '적립금 적용 상품 전개 (배치 생성)';
COMMENT ON COLUMN shopjoy_2604.pm_save_prod.save_prod_id IS '적립상품ID (PK)';
COMMENT ON COLUMN shopjoy_2604.pm_save_prod.save_id  IS '적립금ID (pm_save.save_id)';
COMMENT ON COLUMN shopjoy_2604.pm_save_prod.prod_id  IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.pm_save_prod.reg_site_id  IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pm_save_prod.reg_date IS '배치 생성일시';

CREATE INDEX pm_save_prod_ix01_prod_id ON shopjoy_2604.pm_save_prod USING btree (prod_id);
