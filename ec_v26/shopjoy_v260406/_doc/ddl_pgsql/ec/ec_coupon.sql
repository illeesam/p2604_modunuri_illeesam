-- ============================================================
-- ec_coupon : 쿠폰
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE ec_coupon (
    coupon_id       VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    coupon_cd       VARCHAR(50)     NOT NULL,               -- 쿠폰코드 (중복 방지)
    coupon_nm       VARCHAR(100)    NOT NULL,
    coupon_type_cd  VARCHAR(20)     NOT NULL,               -- 코드: COUPON_TYPE (RATE/FIXED)
    discount_rate   DECIMAL(5, 2)   DEFAULT 0,              -- 할인률 (%)
    discount_amt    BIGINT          DEFAULT 0,              -- 할인금액
    min_order_amt   BIGINT          DEFAULT 0,              -- 최소주문금액
    max_discount_amt BIGINT,                                -- 최대할인한도
    issue_limit     INTEGER,                                -- 총발급한도 (NULL = 무제한)
    issue_cnt       INTEGER         DEFAULT 0,              -- 발급수
    coupon_desc     TEXT,                                   -- 쿠폰설명
    valid_from      DATE,                                   -- 유효기간 시작
    valid_to        DATE,                                   -- 유효기간 종료
    coupon_status_cd VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: COUPON_STATUS (ACTIVE/INACTIVE/EXPIRED)
    coupon_status_cd_before VARCHAR(20),                     -- 변경 전 쿠폰상태
    use_yn          CHAR(1)         DEFAULT 'Y',
    target_type_cd  VARCHAR(20),                            -- 코드: COUPON_TARGET (ALL/MEMBER/GRADE)
    target_value    VARCHAR(200),                           -- 적용대상값 (등급코드, 회원ID 등)
    memo            TEXT,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (coupon_id),
    UNIQUE (coupon_cd)
);

COMMENT ON TABLE  ec_coupon                     IS '쿠폰';
COMMENT ON COLUMN ec_coupon.coupon_id           IS '쿠폰ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_coupon.site_id             IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_coupon.coupon_cd           IS '쿠폰코드';
COMMENT ON COLUMN ec_coupon.coupon_nm           IS '쿠폰명';
COMMENT ON COLUMN ec_coupon.coupon_type_cd      IS '쿠폰유형 (코드: COUPON_TYPE)';
COMMENT ON COLUMN ec_coupon.discount_rate       IS '할인률 (%)';
COMMENT ON COLUMN ec_coupon.discount_amt        IS '할인금액';
COMMENT ON COLUMN ec_coupon.min_order_amt       IS '최소주문금액';
COMMENT ON COLUMN ec_coupon.max_discount_amt    IS '최대할인한도';
COMMENT ON COLUMN ec_coupon.issue_limit         IS '총발급한도 (NULL=무제한)';
COMMENT ON COLUMN ec_coupon.issue_cnt           IS '발급된 개수';
COMMENT ON COLUMN ec_coupon.coupon_desc         IS '쿠폰설명';
COMMENT ON COLUMN ec_coupon.valid_from          IS '유효기간 시작';
COMMENT ON COLUMN ec_coupon.valid_to            IS '유효기간 종료';
COMMENT ON COLUMN ec_coupon.coupon_status_cd    IS '상태 (코드: COUPON_STATUS)';
COMMENT ON COLUMN ec_coupon.coupon_status_cd_before IS '변경 전 쿠폰상태 (코드: COUPON_STATUS)';
COMMENT ON COLUMN ec_coupon.use_yn              IS '사용여부 Y/N';
COMMENT ON COLUMN ec_coupon.target_type_cd      IS '적용대상 (코드: COUPON_TARGET)';
COMMENT ON COLUMN ec_coupon.target_value        IS '적용대상값';
COMMENT ON COLUMN ec_coupon.memo                IS '메모';
COMMENT ON COLUMN ec_coupon.reg_by              IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN ec_coupon.reg_date            IS '등록일';
COMMENT ON COLUMN ec_coupon.upd_by              IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN ec_coupon.upd_date            IS '수정일';

CREATE INDEX idx_ec_coupon_code ON ec_coupon (coupon_cd);
CREATE INDEX idx_ec_coupon_type ON ec_coupon (coupon_type_cd);
CREATE INDEX idx_ec_coupon_status ON ec_coupon (coupon_status_cd);
