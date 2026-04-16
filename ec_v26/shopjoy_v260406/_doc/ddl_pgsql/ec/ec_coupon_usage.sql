CREATE TABLE ec_coupon_usage (
    usage_id        VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    coupon_id       VARCHAR(16)     NOT NULL,
    coupon_code     VARCHAR(50),
    coupon_nm       VARCHAR(100),
    member_id       VARCHAR(16),
    order_id        VARCHAR(16),
    discount_type_cd VARCHAR(20),
    discount_value  INTEGER         DEFAULT 0,
    discount_amt    BIGINT          DEFAULT 0,              -- 실할인금액
    used_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (usage_id)
);

COMMENT ON TABLE  ec_coupon_usage              IS '쿠폰 사용 이력';
COMMENT ON COLUMN ec_coupon_usage.usage_id     IS '사용이력ID';
COMMENT ON COLUMN ec_coupon_usage.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_coupon_usage.coupon_id    IS '쿠폰ID';
COMMENT ON COLUMN ec_coupon_usage.coupon_code  IS '쿠폰코드';
COMMENT ON COLUMN ec_coupon_usage.coupon_nm    IS '쿠폰명';
COMMENT ON COLUMN ec_coupon_usage.member_id    IS '회원ID';
COMMENT ON COLUMN ec_coupon_usage.order_id     IS '주문ID';
COMMENT ON COLUMN ec_coupon_usage.discount_type_cd IS '할인유형';
COMMENT ON COLUMN ec_coupon_usage.discount_value IS '할인값';
COMMENT ON COLUMN ec_coupon_usage.discount_amt IS '실할인금액';
COMMENT ON COLUMN ec_coupon_usage.used_date    IS '사용일시';
COMMENT ON COLUMN ec_coupon_usage.reg_by       IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN ec_coupon_usage.reg_date     IS '등록일';
COMMENT ON COLUMN ec_coupon_usage.upd_by       IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN ec_coupon_usage.upd_date     IS '수정일';
