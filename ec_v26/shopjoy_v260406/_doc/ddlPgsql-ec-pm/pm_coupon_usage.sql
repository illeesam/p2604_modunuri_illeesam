-- ============================================================
-- pm_coupon_usage : 쿠폰 사용 이력
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE pm_coupon_usage (
    usage_id            VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    coupon_id           VARCHAR(21)     NOT NULL,               -- pm_coupon.coupon_id
    coupon_code         VARCHAR(50),                            -- 쿠폰코드 스냅샷
    coupon_nm           VARCHAR(100),                           -- 쿠폰명 스냅샷
    member_id           VARCHAR(21),                            -- mb_member.member_id
    order_id            VARCHAR(21),                            -- od_order.order_id
    order_item_id       VARCHAR(21),                            -- od_order_item.order_item_id (상품별 쿠폰 적용 시)
    prod_id             VARCHAR(21),                            -- pd_prod.prod_id (쿠폰 적용 상품)
    discount_type_cd    VARCHAR(20),                            -- 할인유형 (RATE/FIXED)
    discount_value      INTEGER         DEFAULT 0,              -- 할인값 (율 또는 금액)
    discount_amt        BIGINT          DEFAULT 0,              -- 실할인금액
    used_date           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,

    PRIMARY KEY (usage_id)
);

COMMENT ON TABLE  pm_coupon_usage IS '쿠폰 사용 이력';
COMMENT ON COLUMN pm_coupon_usage.usage_id         IS '사용이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pm_coupon_usage.site_id          IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pm_coupon_usage.coupon_id        IS '쿠폰ID (pm_coupon.coupon_id)';
COMMENT ON COLUMN pm_coupon_usage.coupon_code      IS '쿠폰코드 스냅샷';
COMMENT ON COLUMN pm_coupon_usage.coupon_nm        IS '쿠폰명 스냅샷';
COMMENT ON COLUMN pm_coupon_usage.member_id        IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN pm_coupon_usage.order_id         IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN pm_coupon_usage.order_item_id    IS '주문상품ID (od_order_item.order_item_id, 상품별 쿠폰 적용 시)';
COMMENT ON COLUMN pm_coupon_usage.prod_id          IS '상품ID (pd_prod.prod_id, 쿠폰 적용 상품)';
COMMENT ON COLUMN pm_coupon_usage.discount_type_cd IS '할인유형 (RATE=정률 / FIXED=정액)';
COMMENT ON COLUMN pm_coupon_usage.discount_value   IS '할인값 (정률: % / 정액: 원)';
COMMENT ON COLUMN pm_coupon_usage.discount_amt     IS '실할인금액';
COMMENT ON COLUMN pm_coupon_usage.used_date        IS '사용일시';
COMMENT ON COLUMN pm_coupon_usage.reg_by           IS '등록자';
COMMENT ON COLUMN pm_coupon_usage.reg_date         IS '등록일';
COMMENT ON COLUMN pm_coupon_usage.upd_by           IS '수정자';
COMMENT ON COLUMN pm_coupon_usage.upd_date         IS '수정일';

CREATE INDEX idx_pm_coupon_usage_coupon ON pm_coupon_usage (coupon_id);
CREATE INDEX idx_pm_coupon_usage_member ON pm_coupon_usage (member_id);
CREATE INDEX idx_pm_coupon_usage_order  ON pm_coupon_usage (order_id);
CREATE INDEX idx_pm_coupon_usage_item   ON pm_coupon_usage (order_item_id);
CREATE INDEX idx_pm_coupon_usage_prod   ON pm_coupon_usage (prod_id);
