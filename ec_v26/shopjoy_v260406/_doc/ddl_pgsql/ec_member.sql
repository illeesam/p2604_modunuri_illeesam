-- ============================================================
-- ec_member : 회원
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE ec_member (
    member_id       VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    email           VARCHAR(100)    NOT NULL,
    password        VARCHAR(255)    NOT NULL,
    member_nm            VARCHAR(50)     NOT NULL,
    phone           VARCHAR(20),
    gender          VARCHAR(1),                             -- M/F
    birth_date      DATE,
    grade_cd        VARCHAR(20)     DEFAULT 'BASIC',        -- 코드: MEMBER_GRADE
    status_cd       VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: MEMBER_STATUS
    join_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    last_login      TIMESTAMP,
    order_count     INTEGER         DEFAULT 0,
    total_purchase  BIGINT          DEFAULT 0,
    cache_balance   BIGINT          DEFAULT 0,
    zip_cd        VARCHAR(10),
    address            VARCHAR(200),
    address_detail     VARCHAR(200),
    memo            TEXT,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (member_id),
    UNIQUE (email)
);

COMMENT ON TABLE  ec_member                IS '회원';
COMMENT ON COLUMN ec_member.member_id      IS '회원ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_member.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_member.email          IS '이메일 (로그인 ID)';
COMMENT ON COLUMN ec_member.password       IS '비밀번호 (bcrypt)';
COMMENT ON COLUMN ec_member.member_nm           IS '이름';
COMMENT ON COLUMN ec_member.phone          IS '연락처';
COMMENT ON COLUMN ec_member.gender         IS '성별 M/F';
COMMENT ON COLUMN ec_member.birth_date     IS '생년월일';
COMMENT ON COLUMN ec_member.grade_cd       IS '등급 (코드: MEMBER_GRADE)';
COMMENT ON COLUMN ec_member.status_cd      IS '상태 (코드: MEMBER_STATUS)';
COMMENT ON COLUMN ec_member.join_date      IS '가입일';
COMMENT ON COLUMN ec_member.last_login     IS '최근 로그인';
COMMENT ON COLUMN ec_member.order_count    IS '주문 건수';
COMMENT ON COLUMN ec_member.total_purchase IS '누적 구매금액';
COMMENT ON COLUMN ec_member.cache_balance  IS '적립금 잔액';
COMMENT ON COLUMN ec_member.zip_cd       IS '우편번호';
COMMENT ON COLUMN ec_member.address           IS '주소';
COMMENT ON COLUMN ec_member.address_detail    IS '상세주소';
COMMENT ON COLUMN ec_member.memo           IS '메모';
COMMENT ON COLUMN ec_member.reg_by         IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_member.reg_date       IS '등록일';
COMMENT ON COLUMN ec_member.upd_by         IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN ec_member.upd_date       IS '수정일';

-- 로그인 이력
CREATE TABLE ec_member_login_hist (
    login_hist_id   VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    member_id       VARCHAR(16)     NOT NULL,
    login_date      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    ip              VARCHAR(50),
    device          VARCHAR(100),
    result          VARCHAR(20)     DEFAULT 'SUCCESS',      -- SUCCESS / FAIL
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (login_hist_id)
);

COMMENT ON TABLE  ec_member_login_hist               IS '회원 로그인 이력';
COMMENT ON COLUMN ec_member_login_hist.login_hist_id IS '로그인이력ID';
COMMENT ON COLUMN ec_member_login_hist.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_member_login_hist.member_id     IS '회원ID';
COMMENT ON COLUMN ec_member_login_hist.login_date    IS '로그인일시';
COMMENT ON COLUMN ec_member_login_hist.ip            IS 'IP주소';
COMMENT ON COLUMN ec_member_login_hist.device        IS '디바이스';
COMMENT ON COLUMN ec_member_login_hist.result        IS '결과 (SUCCESS/FAIL)';
COMMENT ON COLUMN ec_member_login_hist.reg_by        IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_member_login_hist.reg_date      IS '등록일';
COMMENT ON COLUMN ec_member_login_hist.upd_by        IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN ec_member_login_hist.upd_date      IS '수정일';
