-- st_settle_item 테이블 DDL
-- 정산 항목 (주문항목별 명세)

CREATE TABLE shopjoy_2604.st_settle_item (
    settle_item_id      VARCHAR(21)  NOT NULL PRIMARY KEY,
    settle_id           VARCHAR(21)  NOT NULL,
    site_id             VARCHAR(21) ,
    order_id            VARCHAR(21)  NOT NULL,
    order_item_id       VARCHAR(21)  NOT NULL,
    vendor_id           VARCHAR(21)  NOT NULL,
    prod_id             VARCHAR(21) ,
    settle_item_type_cd VARCHAR(20)  DEFAULT 'SALE',
    order_date          TIMESTAMP   ,
    order_qty           INTEGER      DEFAULT 1,
    unit_price          BIGINT       DEFAULT 0,
    item_price          BIGINT       DEFAULT 0,
    discnt_amt          BIGINT       DEFAULT 0,
    commission_rate     NUMERIC(5,2) DEFAULT 0,
    commission_amt      BIGINT       DEFAULT 0,
    settle_item_amt     BIGINT       DEFAULT 0,
    reg_by              VARCHAR(30) ,
    reg_date            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30) ,
    upd_date            TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.st_settle_item IS '정산 항목 (주문항목별 명세)';
COMMENT ON COLUMN shopjoy_2604.st_settle_item.settle_item_id IS '정산항목ID';
COMMENT ON COLUMN shopjoy_2604.st_settle_item.settle_id IS '정산ID (st_settle.settle_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_item.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.st_settle_item.order_id IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_item.order_item_id IS '주문항목ID (od_order_item.order_item_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_item.vendor_id IS '업체ID';
COMMENT ON COLUMN shopjoy_2604.st_settle_item.prod_id IS '상품ID';
COMMENT ON COLUMN shopjoy_2604.st_settle_item.settle_item_type_cd IS '항목유형 (코드: SETTLE_ITEM_TYPE — SALE/CANCEL/RETURN)';
COMMENT ON COLUMN shopjoy_2604.st_settle_item.order_date IS '주문일시';
COMMENT ON COLUMN shopjoy_2604.st_settle_item.order_qty IS '주문수량';
COMMENT ON COLUMN shopjoy_2604.st_settle_item.unit_price IS '단가';
COMMENT ON COLUMN shopjoy_2604.st_settle_item.item_price IS '소계 (unit_price × order_qty)';
COMMENT ON COLUMN shopjoy_2604.st_settle_item.discnt_amt IS '할인금액';
COMMENT ON COLUMN shopjoy_2604.st_settle_item.commission_rate IS '수수료율 (%)';
COMMENT ON COLUMN shopjoy_2604.st_settle_item.commission_amt IS '수수료금액';
COMMENT ON COLUMN shopjoy_2604.st_settle_item.settle_item_amt IS '항목 정산금액';
COMMENT ON COLUMN shopjoy_2604.st_settle_item.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.st_settle_item.reg_date IS '등록일';

CREATE INDEX idx_st_settle_item_order ON shopjoy_2604.st_settle_item USING btree (order_id);
CREATE INDEX idx_st_settle_item_settle ON shopjoy_2604.st_settle_item USING btree (settle_id);
CREATE INDEX idx_st_settle_item_vendor ON shopjoy_2604.st_settle_item USING btree (vendor_id);
CREATE UNIQUE INDEX st_settle_item_settle_id_order_item_id_key ON shopjoy_2604.st_settle_item USING btree (settle_id, order_item_id);
