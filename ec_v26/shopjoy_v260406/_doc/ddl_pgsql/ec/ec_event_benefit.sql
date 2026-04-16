-- 이벤트 혜택 (쿠폰/적립 등 구체 혜택 항목)
CREATE TABLE ec_event_benefit (
    benefit_id      VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),
    event_id        VARCHAR(16)     NOT NULL,              -- ec_event.event_id
    benefit_nm      VARCHAR(100)    NOT NULL,
    benefit_type_cd VARCHAR(20),                            -- 코드: BENEFIT_TYPE (COUPON/POINT/DISCOUNT/GIFT)
    condition_desc  VARCHAR(200),                           -- 조건 설명 (예: 20만원 이상)
    benefit_value   VARCHAR(100),                           -- 혜택 값 (예: 10,000원, 10%)
    coupon_id       VARCHAR(16),                            -- 연결 쿠폰ID (ec_coupon.coupon_id)
    sort_ord        INTEGER         DEFAULT 0,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (benefit_id)
);

COMMENT ON TABLE  ec_event_benefit                  IS '이벤트 혜택';
COMMENT ON COLUMN ec_event_benefit.benefit_id       IS '혜택ID';
COMMENT ON COLUMN ec_event_benefit.site_id          IS '사이트ID';
COMMENT ON COLUMN ec_event_benefit.event_id         IS '이벤트ID';
COMMENT ON COLUMN ec_event_benefit.benefit_nm       IS '혜택명';
COMMENT ON COLUMN ec_event_benefit.benefit_type_cd  IS '혜택유형 (코드: BENEFIT_TYPE)';
COMMENT ON COLUMN ec_event_benefit.condition_desc   IS '조건 설명';
COMMENT ON COLUMN ec_event_benefit.benefit_value    IS '혜택 값';
COMMENT ON COLUMN ec_event_benefit.coupon_id        IS '연결 쿠폰ID';
COMMENT ON COLUMN ec_event_benefit.sort_ord         IS '정렬순서';
COMMENT ON COLUMN ec_event_benefit.reg_by           IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN ec_event_benefit.reg_date         IS '등록일';
COMMENT ON COLUMN ec_event_benefit.upd_by           IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN ec_event_benefit.upd_date         IS '수정일';

CREATE INDEX idx_ec_event_benefit_event ON ec_event_benefit (event_id);
