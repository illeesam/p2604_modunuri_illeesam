-- ============================================================
-- pm_plan_item : 기획전 상품
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE pm_plan_item (
    plan_item_id        VARCHAR(21)     NOT NULL,
    plan_id             VARCHAR(21)     NOT NULL,               -- pm_plan.plan_id
    site_id             VARCHAR(21),
    prod_id             VARCHAR(21)     NOT NULL,               -- pd_prod.prod_id
    sort_ord            INTEGER         DEFAULT 0,
    plan_item_memo      VARCHAR(500),                           -- 항목 메모 (특가/한정수량 등)
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (plan_item_id),
    UNIQUE (plan_id, prod_id)
);

COMMENT ON TABLE pm_plan_item IS '기획전 상품';
COMMENT ON COLUMN pm_plan_item.plan_item_id  IS '기획전상품ID';
COMMENT ON COLUMN pm_plan_item.plan_id       IS '기획전ID (pm_plan.plan_id)';
COMMENT ON COLUMN pm_plan_item.site_id       IS '사이트ID';
COMMENT ON COLUMN pm_plan_item.prod_id       IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pm_plan_item.sort_ord      IS '정렬순서';
COMMENT ON COLUMN pm_plan_item.plan_item_memo IS '항목 메모 (특가/한정수량 등)';
COMMENT ON COLUMN pm_plan_item.reg_by        IS '등록자';
COMMENT ON COLUMN pm_plan_item.reg_date      IS '등록일';
COMMENT ON COLUMN pm_plan_item.upd_by        IS '수정자';
COMMENT ON COLUMN pm_plan_item.upd_date      IS '수정일';

CREATE INDEX idx_pm_plan_item_plan ON pm_plan_item (plan_id);
CREATE INDEX idx_pm_plan_item_prod ON pm_plan_item (prod_id);
