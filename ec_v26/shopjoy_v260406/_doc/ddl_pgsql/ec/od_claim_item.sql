-- od_claim_item 테이블 DDL
-- 클레임 항목 (클레임 대상 주문상품 명세)

CREATE TABLE shopjoy_2604.od_claim_item (
    claim_item_id               VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id                     VARCHAR(21) ,
    claim_id                    VARCHAR(21)  NOT NULL,
    order_item_id               VARCHAR(21)  NOT NULL,
    prod_id                     VARCHAR(21) ,
    prod_nm                     VARCHAR(200),
    prod_option                 VARCHAR(500),
    unit_price                  BIGINT       DEFAULT 0,
    claim_qty                   INTEGER      DEFAULT 1,
    item_amt                    BIGINT       DEFAULT 0,
    refund_amt                  BIGINT       DEFAULT 0,
    claim_item_status_cd        VARCHAR(20)  DEFAULT 'REQUESTED',
    claim_item_status_cd_before VARCHAR(20) ,
    return_shipping_fee         BIGINT       DEFAULT 0,
    inbound_shipping_fee        BIGINT       DEFAULT 0,
    exchange_shipping_fee       BIGINT       DEFAULT 0,
    reg_by                      VARCHAR(30) ,
    reg_date                    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by                      VARCHAR(30) ,
    upd_date                    TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.od_claim_item IS '클레임 항목 (클레임 대상 주문상품 명세)';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.claim_item_id IS '클레임항목ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.claim_id IS '클레임ID (od_claim.)';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.order_item_id IS '주문상품ID (od_order_item.)';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.prod_id IS '상품ID';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.prod_nm IS '상품명 (주문시점 스냅샷)';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.prod_option IS '옵션 (색상/사이즈 스냅샷)';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.unit_price IS '판매가 (단가)';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.claim_qty IS '클레임 수량';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.item_amt IS '클레임금액 (unit_price × claim_qty)';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.refund_amt IS '환불금액';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.claim_item_status_cd IS '항목상태 (코드: CLAIM_ITEM_STATUS)';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.claim_item_status_cd_before IS '변경 전 클레임상태 (코드: CLAIM_ITEM_STATUS)';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.return_shipping_fee IS '해당 항목의 수거배송료';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.inbound_shipping_fee IS '해당 항목의 반입배송료';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.exchange_shipping_fee IS '해당 항목의 교환 발송배송료';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.od_claim_item.upd_date IS '수정일';
