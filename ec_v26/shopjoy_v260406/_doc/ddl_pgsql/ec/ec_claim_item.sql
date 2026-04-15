-- 클레임 항목 (클레임 대상 주문상품 명세)
CREATE TABLE ec_claim_item (
    claim_item_id   VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    claim_id        VARCHAR(16)     NOT NULL,
    order_item_id   VARCHAR(16)     NOT NULL,               -- 원 주문상품ID
    prod_id         VARCHAR(16),
    prod_nm         VARCHAR(200),                           -- 상품명 (주문시점 스냅샷)
    prod_option     VARCHAR(500),                           -- 옵션 (색상/사이즈 스냅샷)
    unit_price      BIGINT          DEFAULT 0,
    qty             INTEGER         DEFAULT 1,
    item_price      BIGINT          DEFAULT 0,              -- 소계 (unit_price * qty)
    refund_amount   BIGINT          DEFAULT 0,              -- 항목별 환불금액
    status_cd       VARCHAR(20)     DEFAULT 'REQUESTED',    -- 코드: CLAIM_STATUS
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (claim_item_id)
);

COMMENT ON TABLE  ec_claim_item               IS '클레임 항목 (클레임 대상 주문상품 명세)';
COMMENT ON COLUMN ec_claim_item.claim_item_id IS '클레임항목ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_claim_item.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_claim_item.claim_id      IS '클레임ID (ec_claim.claim_id)';
COMMENT ON COLUMN ec_claim_item.order_item_id IS '주문상품ID (ec_order_item.order_item_id)';
COMMENT ON COLUMN ec_claim_item.prod_id       IS '상품ID';
COMMENT ON COLUMN ec_claim_item.prod_nm       IS '상품명 (주문시점 스냅샷)';
COMMENT ON COLUMN ec_claim_item.prod_option   IS '옵션 (색상/사이즈 스냅샷)';
COMMENT ON COLUMN ec_claim_item.unit_price    IS '단가';
COMMENT ON COLUMN ec_claim_item.qty           IS '클레임 수량';
COMMENT ON COLUMN ec_claim_item.item_price    IS '소계 (단가 × 수량)';
COMMENT ON COLUMN ec_claim_item.refund_amount IS '항목별 환불금액';
COMMENT ON COLUMN ec_claim_item.status_cd     IS '항목상태 (코드: CLAIM_STATUS)';
COMMENT ON COLUMN ec_claim_item.reg_by        IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_claim_item.reg_date      IS '등록일';
COMMENT ON COLUMN ec_claim_item.upd_by        IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN ec_claim_item.upd_date      IS '수정일';
