-- ============================================================
-- ec_coupon : 쿠폰 / ec_coupon_usage : 쿠폰 사용 이력
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE ec_coupon (
    coupon_id       VARCHAR(16)     NOT NULL,
    coupon_code     VARCHAR(50)     NOT NULL,
    coupon_name     VARCHAR(100)    NOT NULL,
    discount_type_cd VARCHAR(20)    NOT NULL,               -- 코드: COUPON_TYPE (RATE/FIXED)
    discount_value  INTEGER         DEFAULT 0,              -- 할인율(%) 또는 할인금액
    min_order       BIGINT          DEFAULT 0,              -- 최소주문금액
    max_discount    BIGINT,                                 -- 최대할인한도 (rate형만)
    issue_to        VARCHAR(20)     DEFAULT 'ALL',          -- ALL/GRADE/MEMBER
    issue_count     INTEGER         DEFAULT 0,              -- 발급수량 (0=무제한)
    use_count       INTEGER         DEFAULT 0,
    start_date      TIMESTAMP,
    end_date        TIMESTAMP,
    status_cd       VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: COUPON_STATUS
    memo            TEXT,
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_date        TIMESTAMP,
    PRIMARY KEY (coupon_id),
    UNIQUE (coupon_code)
);

COMMENT ON TABLE  ec_coupon                IS '쿠폰';
COMMENT ON COLUMN ec_coupon.coupon_id      IS '쿠폰ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_coupon.coupon_code    IS '쿠폰코드';
COMMENT ON COLUMN ec_coupon.coupon_name    IS '쿠폰명';
COMMENT ON COLUMN ec_coupon.discount_type_cd IS '할인유형 (코드: COUPON_TYPE)';
COMMENT ON COLUMN ec_coupon.discount_value IS '할인값 (율:% / 정액:원)';
COMMENT ON COLUMN ec_coupon.min_order      IS '최소주문금액';
COMMENT ON COLUMN ec_coupon.max_discount   IS '최대할인한도';
COMMENT ON COLUMN ec_coupon.issue_to       IS '발급대상 (ALL/GRADE/MEMBER)';
COMMENT ON COLUMN ec_coupon.issue_count    IS '발급수량 (0=무제한)';
COMMENT ON COLUMN ec_coupon.use_count      IS '사용건수';
COMMENT ON COLUMN ec_coupon.start_date     IS '유효시작일';
COMMENT ON COLUMN ec_coupon.end_date       IS '유효종료일';
COMMENT ON COLUMN ec_coupon.status_cd      IS '상태 (코드: COUPON_STATUS)';
COMMENT ON COLUMN ec_coupon.memo           IS '메모';
COMMENT ON COLUMN ec_coupon.reg_date       IS '등록일';
COMMENT ON COLUMN ec_coupon.upd_date       IS '수정일';

-- 쿠폰 발급 (회원별 보유)
CREATE TABLE ec_coupon_issue (
    issue_id        VARCHAR(16)     NOT NULL,
    coupon_id       VARCHAR(16)     NOT NULL,
    member_id       VARCHAR(16)     NOT NULL,
    issue_date      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    use_yn          CHAR(1)         DEFAULT 'N',
    use_date        TIMESTAMP,
    order_id        VARCHAR(16),
    PRIMARY KEY (issue_id)
);

COMMENT ON TABLE  ec_coupon_issue           IS '쿠폰 발급';
COMMENT ON COLUMN ec_coupon_issue.issue_id  IS '발급ID';
COMMENT ON COLUMN ec_coupon_issue.coupon_id IS '쿠폰ID';
COMMENT ON COLUMN ec_coupon_issue.member_id IS '회원ID';
COMMENT ON COLUMN ec_coupon_issue.issue_date IS '발급일시';
COMMENT ON COLUMN ec_coupon_issue.use_yn    IS '사용여부 Y/N';
COMMENT ON COLUMN ec_coupon_issue.use_date  IS '사용일시';
COMMENT ON COLUMN ec_coupon_issue.order_id  IS '사용주문ID';

-- 쿠폰 사용 이력
CREATE TABLE ec_coupon_usage (
    usage_id        VARCHAR(16)     NOT NULL,
    coupon_id       VARCHAR(16)     NOT NULL,
    coupon_code     VARCHAR(50),
    coupon_name     VARCHAR(100),
    member_id       VARCHAR(16),
    order_id        VARCHAR(16),
    discount_type   VARCHAR(20),
    discount_value  INTEGER         DEFAULT 0,
    discount_amt    BIGINT          DEFAULT 0,              -- 실할인금액
    used_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usage_id)
);

COMMENT ON TABLE  ec_coupon_usage             IS '쿠폰 사용 이력';
COMMENT ON COLUMN ec_coupon_usage.usage_id    IS '사용이력ID';
COMMENT ON COLUMN ec_coupon_usage.coupon_id   IS '쿠폰ID';
COMMENT ON COLUMN ec_coupon_usage.coupon_code IS '쿠폰코드';
COMMENT ON COLUMN ec_coupon_usage.coupon_name IS '쿠폰명';
COMMENT ON COLUMN ec_coupon_usage.member_id   IS '회원ID';
COMMENT ON COLUMN ec_coupon_usage.order_id    IS '주문ID';
COMMENT ON COLUMN ec_coupon_usage.discount_type IS '할인유형';
COMMENT ON COLUMN ec_coupon_usage.discount_value IS '할인값';
COMMENT ON COLUMN ec_coupon_usage.discount_amt IS '실할인금액';
COMMENT ON COLUMN ec_coupon_usage.used_date   IS '사용일시';
