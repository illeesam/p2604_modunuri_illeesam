-- ============================================================
-- st_settle_raw : 정산 수집원장
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 기본 수집 단위: od_order_item / od_claim_item
-- 프로모션·쿠폰·할인·상품권·캐쉬·사은품·마일리지 등
-- 정산에 영향을 미치는 모든 요소를 1행에 펼쳐 저장
-- ============================================================
CREATE TABLE st_settle_raw (
    settle_raw_id           VARCHAR(16)     NOT NULL,
    site_id                 VARCHAR(16)     NOT NULL,               -- sy_site.site_id

    -- ── 수집 구분
    raw_type_cd             VARCHAR(20)     NOT NULL,               -- 코드: RAW_TYPE (ORDER:주문/CLAIM:클레임)
    raw_status_cd           VARCHAR(20)     DEFAULT 'PENDING',      -- 코드: RAW_STATUS (PENDING/COLLECTED/SETTLED/EXCLUDED)
    raw_status_cd_before    VARCHAR(20),                            -- 변경 전 상태

    -- ── 주문 원천
    order_id                VARCHAR(16)     NOT NULL,               -- od_order.order_id
    order_no                VARCHAR(30),                            -- 주문번호 (스냅샷)
    order_item_id           VARCHAR(16)     NOT NULL,               -- od_order_item.order_item_id
    order_date              TIMESTAMP,                              -- 주문일시 (스냅샷)

    -- ── 클레임 원천 (클레임 수집 시)
    claim_id                VARCHAR(16),                            -- od_claim.claim_id
    claim_item_id           VARCHAR(16),                            -- od_claim_item.claim_item_id

    -- ── 업체
    vendor_id               VARCHAR(16),                            -- sy_vendor.vendor_id
    vendor_type_cd          VARCHAR(20),                            -- 코드: VENDOR_TYPE (SALE:판매/DLIV:배송/EXTERNAL:외부)

    -- ── 상품 · MD
    prod_id                 VARCHAR(16),                            -- pd_prod.prod_id
    prod_nm                 VARCHAR(200),                           -- 상품명 (스냅샷)
    md_user_id              VARCHAR(16),                            -- 담당 MD (sy_user.user_id)

    -- ── 수량 · 가격
    order_qty               INTEGER         DEFAULT 0,              -- 주문수량
    unit_price              BIGINT          DEFAULT 0,              -- 단가
    item_price              BIGINT          DEFAULT 0,              -- 소계 (unit_price × order_qty)

    -- ── 할인 금액
    discnt_amt              BIGINT          DEFAULT 0,              -- 직접할인금액
    coupon_discnt_amt       BIGINT          DEFAULT 0,              -- 쿠폰할인금액
    promo_discnt_amt        BIGINT          DEFAULT 0,              -- 프로모션할인금액

    -- ── 프로모션 · 쿠폰 · 할인 참조
    promo_id                VARCHAR(16),                            -- pm_event.event_id (프로모션)
    coupon_id               VARCHAR(16),                            -- pm_coupon.coupon_id
    coupon_issue_id         VARCHAR(16),                            -- pm_coupon_issue.coupon_issue_id
    discnt_id               VARCHAR(16),                            -- pm_discnt.discnt_id

    -- ── 상품권
    voucher_id              VARCHAR(16),                            -- pm_voucher.voucher_id
    voucher_issue_id        VARCHAR(16),                            -- pm_voucher_issue.voucher_issue_id
    voucher_use_amt         BIGINT          DEFAULT 0,              -- 상품권 사용금액

    -- ── 캐쉬 · 마일리지
    cache_use_amt           BIGINT          DEFAULT 0,              -- 캐쉬(적립금) 사용금액
    mileage_use_amt         BIGINT          DEFAULT 0,              -- 마일리지 사용금액

    -- ── 사은품
    gift_id                 VARCHAR(16),                            -- pm_gift.gift_id
    gift_amt                BIGINT          DEFAULT 0,              -- 사은품 원가금액 (정산 차감)

    -- ── 결제
    pay_method_cd           VARCHAR(20),                            -- 코드: PAY_METHOD_CD

    -- ── 정산 집계 금액
    settle_target_amt       BIGINT          DEFAULT 0,              -- 정산대상금액 (item_price - 모든할인)
    settle_fee_rate         NUMERIC(5,2)    DEFAULT 0,              -- 수수료율 (%)
    settle_fee_amt          BIGINT          DEFAULT 0,              -- 수수료금액
    settle_amt              BIGINT          DEFAULT 0,              -- 정산금액 (settle_target_amt - settle_fee_amt)

    -- ── 정산 집계 연결
    settle_period           VARCHAR(7),                             -- 정산기간 (YYYY-MM)
    settle_id               VARCHAR(16),                            -- st_settle.settle_id (집계 후 연결)

    reg_by                  VARCHAR(16),
    reg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                  VARCHAR(16),
    upd_date                TIMESTAMP,

    PRIMARY KEY (settle_raw_id)
);

COMMENT ON TABLE  st_settle_raw IS '정산 수집원장 (od_order_item / od_claim_item 기반 정산 원천 데이터)';
COMMENT ON COLUMN st_settle_raw.settle_raw_id        IS '수집원장ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN st_settle_raw.site_id              IS '사이트ID';
COMMENT ON COLUMN st_settle_raw.raw_type_cd          IS '수집유형 (코드: RAW_TYPE — ORDER/CLAIM)';
COMMENT ON COLUMN st_settle_raw.raw_status_cd        IS '수집상태 (코드: RAW_STATUS)';
COMMENT ON COLUMN st_settle_raw.raw_status_cd_before IS '변경 전 수집상태';
COMMENT ON COLUMN st_settle_raw.order_id             IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN st_settle_raw.order_no             IS '주문번호 스냅샷';
COMMENT ON COLUMN st_settle_raw.order_item_id        IS '주문상품ID (od_order_item.order_item_id)';
COMMENT ON COLUMN st_settle_raw.order_date           IS '주문일시 스냅샷';
COMMENT ON COLUMN st_settle_raw.claim_id             IS '클레임ID (클레임 수집 시)';
COMMENT ON COLUMN st_settle_raw.claim_item_id        IS '클레임상품ID (클레임 수집 시)';
COMMENT ON COLUMN st_settle_raw.vendor_id            IS '업체ID';
COMMENT ON COLUMN st_settle_raw.vendor_type_cd       IS '업체구분 (코드: VENDOR_TYPE — SALE/DLIV/EXTERNAL)';
COMMENT ON COLUMN st_settle_raw.prod_id              IS '상품ID';
COMMENT ON COLUMN st_settle_raw.prod_nm              IS '상품명 스냅샷';
COMMENT ON COLUMN st_settle_raw.md_user_id           IS '담당MD (sy_user.user_id)';
COMMENT ON COLUMN st_settle_raw.order_qty            IS '주문수량';
COMMENT ON COLUMN st_settle_raw.unit_price           IS '단가';
COMMENT ON COLUMN st_settle_raw.item_price           IS '소계 (unit_price × order_qty)';
COMMENT ON COLUMN st_settle_raw.discnt_amt           IS '직접할인금액';
COMMENT ON COLUMN st_settle_raw.coupon_discnt_amt    IS '쿠폰할인금액';
COMMENT ON COLUMN st_settle_raw.promo_discnt_amt     IS '프로모션할인금액';
COMMENT ON COLUMN st_settle_raw.promo_id             IS '프로모션ID (pm_event.event_id)';
COMMENT ON COLUMN st_settle_raw.coupon_id            IS '쿠폰ID (pm_coupon.coupon_id)';
COMMENT ON COLUMN st_settle_raw.coupon_issue_id      IS '쿠폰발급ID (pm_coupon_issue.coupon_issue_id)';
COMMENT ON COLUMN st_settle_raw.discnt_id            IS '할인ID (pm_discnt.discnt_id)';
COMMENT ON COLUMN st_settle_raw.voucher_id           IS '상품권ID (pm_voucher.voucher_id)';
COMMENT ON COLUMN st_settle_raw.voucher_issue_id     IS '상품권발급ID (pm_voucher_issue.voucher_issue_id)';
COMMENT ON COLUMN st_settle_raw.voucher_use_amt      IS '상품권 사용금액';
COMMENT ON COLUMN st_settle_raw.cache_use_amt        IS '캐쉬(적립금) 사용금액';
COMMENT ON COLUMN st_settle_raw.mileage_use_amt      IS '마일리지 사용금액';
COMMENT ON COLUMN st_settle_raw.gift_id              IS '사은품ID (pm_gift.gift_id)';
COMMENT ON COLUMN st_settle_raw.gift_amt             IS '사은품 원가금액 (정산 차감 대상)';
COMMENT ON COLUMN st_settle_raw.pay_method_cd        IS '결제수단 (코드: PAY_METHOD_CD)';
COMMENT ON COLUMN st_settle_raw.settle_target_amt    IS '정산대상금액 (item_price - 모든 할인)';
COMMENT ON COLUMN st_settle_raw.settle_fee_rate      IS '수수료율 (%)';
COMMENT ON COLUMN st_settle_raw.settle_fee_amt       IS '수수료금액';
COMMENT ON COLUMN st_settle_raw.settle_amt           IS '정산금액 (settle_target_amt - settle_fee_amt)';
COMMENT ON COLUMN st_settle_raw.settle_period        IS '정산기간 (YYYY-MM)';
COMMENT ON COLUMN st_settle_raw.settle_id            IS '정산집계ID (st_settle.settle_id, 집계 후 연결)';
COMMENT ON COLUMN st_settle_raw.reg_by               IS '등록자';
COMMENT ON COLUMN st_settle_raw.reg_date             IS '등록일';
COMMENT ON COLUMN st_settle_raw.upd_by               IS '수정자';
COMMENT ON COLUMN st_settle_raw.upd_date             IS '수정일';

CREATE INDEX idx_st_settle_raw_order    ON st_settle_raw (order_id);
CREATE INDEX idx_st_settle_raw_item     ON st_settle_raw (order_item_id);
CREATE INDEX idx_st_settle_raw_claim    ON st_settle_raw (claim_id);
CREATE INDEX idx_st_settle_raw_vendor   ON st_settle_raw (site_id, vendor_id);
CREATE INDEX idx_st_settle_raw_prod     ON st_settle_raw (prod_id);
CREATE INDEX idx_st_settle_raw_md       ON st_settle_raw (md_user_id);
CREATE INDEX idx_st_settle_raw_period   ON st_settle_raw (settle_period, vendor_id);
CREATE INDEX idx_st_settle_raw_settle   ON st_settle_raw (settle_id);
CREATE INDEX idx_st_settle_raw_status   ON st_settle_raw (raw_status_cd);
CREATE INDEX idx_st_settle_raw_promo    ON st_settle_raw (promo_id);
CREATE INDEX idx_st_settle_raw_coupon   ON st_settle_raw (coupon_id);
CREATE INDEX idx_st_settle_raw_pay      ON st_settle_raw (pay_method_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] st_settle_raw.raw_type_cd (수집유형) : RAW_TYPE(RAW_TYPE) { 코드값 미정의 }
-- [CODES] st_settle_raw.raw_status_cd (수집상태) : RAW_STATUS(RAW_STATUS) { 코드값 미정의 }
-- [CODES] st_settle_raw.vendor_type_cd (업체구분) : VENDOR_TYPE(VENDOR_TYPE) { 코드값 미정의 }
-- [CODES] st_settle_raw.pay_method_cd (결제수단) : PAY_METHOD_CD(PAY_METHOD_CD) { 코드값 미정의 }
