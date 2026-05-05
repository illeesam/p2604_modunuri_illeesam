-- pm_event_item 테이블 DDL
-- 이벤트 적용 대상 항목 (상품/카테고리/판매자/브랜드)

CREATE TABLE shopjoy_2604.pm_event_item (
    event_item_id  VARCHAR(21) NOT NULL PRIMARY KEY,
    event_id       VARCHAR(21) NOT NULL,
    site_id        VARCHAR(21),
    target_type_cd VARCHAR(20) NOT NULL,
    target_id      VARCHAR(21) NOT NULL,
    sort_no        INTEGER     DEFAULT 0,
    reg_by         VARCHAR(30),
    reg_date       TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    upd_by         VARCHAR(30),
    upd_date       TIMESTAMP  
);

COMMENT ON TABLE  shopjoy_2604.pm_event_item IS '이벤트 적용 대상 항목 (상품/카테고리/판매자/브랜드)';
COMMENT ON COLUMN shopjoy_2604.pm_event_item.event_item_id IS '이벤트항목ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.pm_event_item.event_id IS '이벤트ID (pm_event.event_id)';
COMMENT ON COLUMN shopjoy_2604.pm_event_item.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pm_event_item.target_type_cd IS '대상유형 (코드: EVENT_ITEM_TARGET — PRODUCT/CATEGORY/VENDOR/BRAND)';
COMMENT ON COLUMN shopjoy_2604.pm_event_item.target_id IS '대상ID (prod_id / category_id / vendor_id / brand_id)';
COMMENT ON COLUMN shopjoy_2604.pm_event_item.sort_no IS '이벤트 내 노출 순서';
COMMENT ON COLUMN shopjoy_2604.pm_event_item.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.pm_event_item.reg_date IS '등록일';

CREATE INDEX idx_pm_event_item_event ON shopjoy_2604.pm_event_item USING btree (event_id);
CREATE INDEX idx_pm_event_item_target ON shopjoy_2604.pm_event_item USING btree (target_type_cd, target_id);
CREATE UNIQUE INDEX pm_event_item_event_id_target_type_cd_target_id_key ON shopjoy_2604.pm_event_item USING btree (event_id, target_type_cd, target_id);
