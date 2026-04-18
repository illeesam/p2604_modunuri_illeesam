-- 주문 상품
CREATE TABLE od_order_item (
    order_item_id   VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    order_id        VARCHAR(16)     NOT NULL,
    prod_id         VARCHAR(16)     NOT NULL,
    sku_id          VARCHAR(16),                            -- pd_prod_opt_sku.
    opt_id_1    VARCHAR(16),                            -- 옵션1 값ID (ec_prod_opt)
    opt_id_2    VARCHAR(16),                            -- 옵션2 값ID (ec_prod_opt)
    unit_price      BIGINT          DEFAULT 0,              -- 판매가 (단가)
    order_qty       INTEGER         DEFAULT 1,              -- 주문수량
    item_order_amt  BIGINT          DEFAULT 0,              -- 주문금액 (unit_price × order_qty)
    cancel_qty      INTEGER         DEFAULT 0,              -- 취소수량
    item_cancel_amt BIGINT          DEFAULT 0,              -- 취소금액 (클레임으로 인한 누적 취소액)
    complet_qty     INTEGER         DEFAULT 0,              -- 판매완료수량
    item_completed_amt BIGINT       DEFAULT 0,              -- 완료금액 (item_order_amt - item_cancel_amt)
    order_item_status_cd VARCHAR(20)     DEFAULT 'ORDERED',      -- 코드: ORDER_ITEM_STATUS
    order_item_status_cd_before VARCHAR(20),                 -- 변경 전 상품상태
    -- ── 부분배송 시 배송정보 ──
    outbound_shipping_fee BIGINT       DEFAULT 0,           -- 해당 항목의 배송료
    dliv_courier_cd VARCHAR(30),                            -- 배송 택배사
    dliv_tracking_no VARCHAR(100),                          -- 배송 송장
    dliv_ship_date  TIMESTAMP,                              -- 출고일시
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (order_item_id)
);

COMMENT ON TABLE od_order_item IS '주문상품';
COMMENT ON COLUMN od_order_item.order_item_id IS '주문상품ID';
COMMENT ON COLUMN od_order_item.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN od_order_item.order_id      IS '주문ID';
COMMENT ON COLUMN od_order_item.prod_id       IS '상품ID';
COMMENT ON COLUMN od_order_item.sku_id        IS 'SKU ID (pd_prod_opt_sku., 무옵션 시 NULL)';
COMMENT ON COLUMN od_order_item.opt_id_1  IS '옵션1 값ID (pd_prod_opt.)';
COMMENT ON COLUMN od_order_item.opt_id_2  IS '옵션2 값ID (pd_prod_opt.)';
COMMENT ON COLUMN od_order_item.unit_price    IS '판매가 (단가, 옵션 추가금액 포함)';
COMMENT ON COLUMN od_order_item.order_qty     IS '주문수량';
COMMENT ON COLUMN od_order_item.item_order_amt IS '주문금액 (unit_price × order_qty)';
COMMENT ON COLUMN od_order_item.cancel_qty    IS '취소수량';
COMMENT ON COLUMN od_order_item.item_cancel_amt IS '취소금액 (클레임으로 인한 누적 취소액)';
COMMENT ON COLUMN od_order_item.complet_qty   IS '판매완료수량';
COMMENT ON COLUMN od_order_item.item_completed_amt IS '완료금액 (item_order_amt - item_cancel_amt)';
COMMENT ON COLUMN od_order_item.order_item_status_cd IS '품목 주문 상태 (코드: ORDER_ITEM_STATUS — 주문흐름 전용: ORDERED/PAID/PREPARING/SHIPPING/DELIVERED/CONFIRMED/CANCELLED. 클레임 상태는 od_claim_item.claim_item_status_cd 가 별도 관리)';
COMMENT ON COLUMN od_order_item.order_item_status_cd_before IS '변경 전 품목상태 (코드: ORDER_ITEM_STATUS)';
COMMENT ON COLUMN od_order_item.outbound_shipping_fee IS '해당 항목의 배송료 (부분배송 시)';
COMMENT ON COLUMN od_order_item.dliv_courier_cd IS '해당 항목의 배송 택배사 (코드: COURIER)';
COMMENT ON COLUMN od_order_item.dliv_tracking_no IS '해당 항목의 배송 송장번호';
COMMENT ON COLUMN od_order_item.dliv_ship_date IS '해당 항목의 출고일시';
COMMENT ON COLUMN od_order_item.reg_by        IS '등록자 (sy_user.user_id, mb_mem.member_id)';
COMMENT ON COLUMN od_order_item.reg_date      IS '등록일';
COMMENT ON COLUMN od_order_item.upd_by        IS '수정자 (sy_user.user_id, mb_mem.member_id)';
COMMENT ON COLUMN od_order_item.upd_date      IS '수정일';
