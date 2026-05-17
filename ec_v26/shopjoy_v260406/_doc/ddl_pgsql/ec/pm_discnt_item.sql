-- pm_discnt_item 테이블 DDL
-- 할인 대상 항목

CREATE TABLE shopjoy_2604.pm_discnt_item (
    discnt_item_id VARCHAR(21) NOT NULL PRIMARY KEY,
    discnt_id      VARCHAR(21) NOT NULL,
    site_id        VARCHAR(21) NOT NULL,
    target_type_cd VARCHAR(20) NOT NULL,
    target_id      VARCHAR(21) NOT NULL,
    reg_by         VARCHAR(30),
    reg_date       TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    upd_by         VARCHAR(30),
    upd_date       TIMESTAMP  
);

COMMENT ON TABLE  shopjoy_2604.pm_discnt_item IS '할인 대상 항목';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_item.discnt_item_id IS '할인항목ID';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_item.discnt_id IS '할인ID (pm_discnt.discnt_id)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_item.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_item.target_type_cd IS '대상유형 (코드: DISCNT_ITEM_TARGET)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_item.target_id IS '대상ID (category_id/prod_id/grade_cd)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_item.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_item.reg_date IS '등록일';

CREATE INDEX idx_pm_discnt_item_discnt ON shopjoy_2604.pm_discnt_item USING btree (discnt_id);
CREATE INDEX idx_pm_discnt_item_site ON shopjoy_2604.pm_discnt_item USING btree (site_id);
CREATE INDEX idx_pm_discnt_item_target ON shopjoy_2604.pm_discnt_item USING btree (target_type_cd, target_id);
CREATE UNIQUE INDEX pm_discnt_item_discnt_id_target_type_cd_target_id_key ON shopjoy_2604.pm_discnt_item USING btree (discnt_id, target_type_cd, target_id);
