-- pm_plan_item 테이블 DDL
-- 기획전 상품

CREATE TABLE shopjoy_2604.pm_plan_item (
    plan_item_id   VARCHAR(21)  NOT NULL PRIMARY KEY,
    plan_id        VARCHAR(21)  NOT NULL,
    site_id        VARCHAR(21)  NOT NULL,
    prod_id        VARCHAR(21)  NOT NULL,
    sort_ord       INTEGER      DEFAULT 0,
    plan_item_memo VARCHAR(500),
    reg_by         VARCHAR(30) ,
    reg_date       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by         VARCHAR(30) ,
    upd_date       TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.pm_plan_item IS '기획전 상품';
COMMENT ON COLUMN shopjoy_2604.pm_plan_item.plan_item_id IS '기획전상품ID';
COMMENT ON COLUMN shopjoy_2604.pm_plan_item.plan_id IS '기획전ID (pm_plan.plan_id)';
COMMENT ON COLUMN shopjoy_2604.pm_plan_item.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.pm_plan_item.prod_id IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.pm_plan_item.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.pm_plan_item.plan_item_memo IS '항목 메모 (특가/한정수량 등)';
COMMENT ON COLUMN shopjoy_2604.pm_plan_item.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.pm_plan_item.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.pm_plan_item.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.pm_plan_item.upd_date IS '수정일';

CREATE INDEX idx_pm_plan_item_plan ON shopjoy_2604.pm_plan_item USING btree (plan_id);
CREATE INDEX idx_pm_plan_item_prod ON shopjoy_2604.pm_plan_item USING btree (prod_id);
CREATE INDEX idx_pm_plan_item_site ON shopjoy_2604.pm_plan_item USING btree (site_id);
CREATE UNIQUE INDEX pm_plan_item_plan_id_prod_id_key ON shopjoy_2604.pm_plan_item USING btree (plan_id, prod_id);
