-- ============================================================
-- od_order_item_discnt : 주문상품 할인 내역
-- 상품(item) 단위 즉시할인 및 상품쿠폰 할인을 행별로 기록
-- 환불 시 개당 유효단가 계산의 기준 데이터
-- ============================================================
CREATE TABLE od_order_item_discnt (
    item_discnt_id      VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    order_id            VARCHAR(21)     NOT NULL,               -- od_order.order_id
    order_item_id       VARCHAR(21)     NOT NULL,               -- od_order_item.order_item_id
    -- ── 할인 구분 ──
    discnt_type_cd      VARCHAR(30)     NOT NULL,               -- 코드: ORDER_ITEM_DISCNT_TYPE
                                                                --   ITEM_DISCNT  : 즉시할인 (상품 판매가 기준 직접 할인)
                                                                --   ITEM_COUPON  : 상품쿠폰 할인
    -- ── 쿠폰 연결 (ITEM_COUPON인 경우) ──
    coupon_id           VARCHAR(21),                            -- pm_coupon.coupon_id
    coupon_issue_id     VARCHAR(21),                            -- pm_coupon_issue.coupon_issue_id
    -- ── 할인 금액 ──
    discnt_rate         DECIMAL(5,2),                           -- 할인율 (%) — 비율할인인 경우
    unit_discnt_amt     BIGINT          DEFAULT 0,              -- 1개당 할인금액
    total_discnt_amt    BIGINT          DEFAULT 0,              -- 전체 할인금액 (unit_discnt_amt × order_qty)
    order_qty           INTEGER         DEFAULT 1,              -- 주문수량 (스냅샷)
    -- ── 기본 ──
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (item_discnt_id)
);

COMMENT ON TABLE od_order_item_discnt IS '주문상품할인 내역 (즉시할인·상품쿠폰)';
COMMENT ON COLUMN od_order_item_discnt.item_discnt_id   IS '주문상품할인ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN od_order_item_discnt.site_id          IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN od_order_item_discnt.order_id         IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN od_order_item_discnt.order_item_id    IS '주문상품ID (od_order_item.order_item_id)';
COMMENT ON COLUMN od_order_item_discnt.discnt_type_cd   IS '할인유형코드 (코드: ORDER_ITEM_DISCNT_TYPE — ITEM_DISCNT/ITEM_COUPON)';
COMMENT ON COLUMN od_order_item_discnt.coupon_id        IS '쿠폰ID (pm_coupon.coupon_id — ITEM_COUPON인 경우)';
COMMENT ON COLUMN od_order_item_discnt.coupon_issue_id  IS '쿠폰발급ID (pm_coupon_issue.coupon_issue_id — ITEM_COUPON인 경우)';
COMMENT ON COLUMN od_order_item_discnt.discnt_rate      IS '할인율 (% — 비율할인인 경우)';
COMMENT ON COLUMN od_order_item_discnt.unit_discnt_amt  IS '1개당 할인금액';
COMMENT ON COLUMN od_order_item_discnt.total_discnt_amt IS '전체 할인금액 (unit_discnt_amt × order_qty)';
COMMENT ON COLUMN od_order_item_discnt.order_qty        IS '주문수량 스냅샷';
COMMENT ON COLUMN od_order_item_discnt.reg_by           IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_order_item_discnt.reg_date         IS '등록일시';
COMMENT ON COLUMN od_order_item_discnt.upd_by   IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_order_item_discnt.upd_date IS '수정일';

CREATE INDEX idx_od_item_discnt_order      ON od_order_item_discnt (order_id);
CREATE INDEX idx_od_item_discnt_item       ON od_order_item_discnt (order_item_id);
CREATE INDEX idx_od_item_discnt_type       ON od_order_item_discnt (discnt_type_cd);
CREATE INDEX idx_od_item_discnt_coupon     ON od_order_item_discnt (coupon_id) WHERE coupon_id IS NOT NULL;

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] od_order_item_discnt.discnt_type_cd (할인유형코드) : ORDER_DISCNT_TYPE { SALE_PRICE:판매가할인, PAY_DISCNT:결제할인, COUPON:쿠폰, PROMOTION:프로모션, SHIP_DISCNT:배송비할인, PRODUCT_DISCNT:상품할인, CLAIM_SHIP:클레임배송비 }
