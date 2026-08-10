-- pm_event_prod 테이블 DDL
-- 이벤트 적용 상품 전개 (배치 생성, pm_event_item 기반)

CREATE TABLE shopjoy_2604.pm_event_prod (
    event_id   VARCHAR(21) NOT NULL,
    prod_id    VARCHAR(21) NOT NULL,
    reg_site_id    VARCHAR(21) NOT NULL,
    reg_date   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pm_event_prod_pk_event_id_prod_id_x2 PRIMARY KEY (event_id, prod_id)
);

COMMENT ON TABLE  shopjoy_2604.pm_event_prod IS '이벤트 적용 상품 전개 (배치 생성)';
COMMENT ON COLUMN shopjoy_2604.pm_event_prod.event_id IS '이벤트ID (pm_event.event_id)';
COMMENT ON COLUMN shopjoy_2604.pm_event_prod.prod_id  IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.pm_event_prod.reg_site_id  IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pm_event_prod.reg_date IS '배치 생성일시';

CREATE INDEX pm_event_prod_ix01_prod_id ON shopjoy_2604.pm_event_prod USING btree (prod_id);
CREATE INDEX pm_event_prod_ix_event ON shopjoy_2604.pm_event_prod USING btree (event_id);
