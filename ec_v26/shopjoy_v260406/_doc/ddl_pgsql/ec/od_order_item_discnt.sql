-- od_order_item_discnt 테이블 DDL
-- 주문상품할인 내역 (즉시할인·상품쿠폰)

CREATE TABLE shopjoy_2604.od_order_item_discnt (
    item_discnt_id   VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id          VARCHAR(21) ,
    order_id         VARCHAR(21)  NOT NULL,
    order_item_id    VARCHAR(21)  NOT NULL,
    discnt_type_cd   VARCHAR(30)  NOT NULL,
    coupon_id        VARCHAR(21) ,
    coupon_issue_id  VARCHAR(21) ,
    discnt_rate      NUMERIC(5,2),
    unit_discnt_amt  BIGINT       DEFAULT 0,
    total_discnt_amt BIGINT       DEFAULT 0,
    order_qty        INTEGER      DEFAULT 1,
    reg_by           VARCHAR(30) ,
    reg_date         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(30) ,
    upd_date         TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.od_order_item_discnt IS '주문상품할인 내역 (즉시할인·상품쿠폰)';
COMMENT ON COLUMN shopjoy_2604.od_order_item_discnt.item_discnt_id IS '주문상품할인ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.od_order_item_discnt.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.od_order_item_discnt.order_id IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN shopjoy_2604.od_order_item_discnt.order_item_id IS '주문상품ID (od_order_item.order_item_id)';
COMMENT ON COLUMN shopjoy_2604.od_order_item_discnt.discnt_type_cd IS '할인유형코드 (코드: ORDER_ITEM_DISCNT_TYPE — ITEM_DISCNT/ITEM_COUPON)';
COMMENT ON COLUMN shopjoy_2604.od_order_item_discnt.coupon_id IS '쿠폰ID (pm_coupon.coupon_id — ITEM_COUPON인 경우)';
COMMENT ON COLUMN shopjoy_2604.od_order_item_discnt.coupon_issue_id IS '쿠폰발급ID (pm_coupon_issue.coupon_issue_id — ITEM_COUPON인 경우)';
COMMENT ON COLUMN shopjoy_2604.od_order_item_discnt.discnt_rate IS '할인율 (% — 비율할인인 경우)';
COMMENT ON COLUMN shopjoy_2604.od_order_item_discnt.unit_discnt_amt IS '1개당 할인금액';
COMMENT ON COLUMN shopjoy_2604.od_order_item_discnt.total_discnt_amt IS '전체 할인금액 (unit_discnt_amt × order_qty)';
COMMENT ON COLUMN shopjoy_2604.od_order_item_discnt.order_qty IS '주문수량 스냅샷';
COMMENT ON COLUMN shopjoy_2604.od_order_item_discnt.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.od_order_item_discnt.reg_date IS '등록일시';

CREATE INDEX idx_od_item_discnt_coupon ON shopjoy_2604.od_order_item_discnt USING btree (coupon_id) WHERE (coupon_id IS NOT NULL);
CREATE INDEX idx_od_item_discnt_item ON shopjoy_2604.od_order_item_discnt USING btree (order_item_id);
CREATE INDEX idx_od_item_discnt_order ON shopjoy_2604.od_order_item_discnt USING btree (order_id);
CREATE INDEX idx_od_item_discnt_type ON shopjoy_2604.od_order_item_discnt USING btree (discnt_type_cd);
