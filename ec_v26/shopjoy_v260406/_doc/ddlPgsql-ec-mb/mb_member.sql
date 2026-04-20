-- ============================================================
CREATE TABLE mb_member (
    member_id       VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    member_email    VARCHAR(100)    NOT NULL,
    member_password VARCHAR(255)    NOT NULL,
    member_nm       VARCHAR(50)     NOT NULL,
    member_phone    VARCHAR(20),
    member_gender   VARCHAR(1),                             -- M/F
    birth_date      DATE,
    grade_cd        VARCHAR(20)     DEFAULT 'BASIC',        -- 코드: MEMBER_GRADE
    member_status_cd VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: MEMBER_STATUS
    member_status_cd_before VARCHAR(20),                    -- 변경 전 회원상태
    join_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    last_login      TIMESTAMP,
    order_count     INTEGER         DEFAULT 0,
    total_purchase_amt BIGINT       DEFAULT 0,
    cache_balance_amt  BIGINT       DEFAULT 0,
    member_zip_code VARCHAR(10),
    member_addr     VARCHAR(200),
    member_addr_detail VARCHAR(200),
    member_memo     TEXT,
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (member_id),
    UNIQUE (member_email)
);

COMMENT ON TABLE mb_member IS '회원';
COMMENT ON COLUMN mb_member.member_id      IS '회원ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN mb_member.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN mb_member.member_email   IS '이메일 (로그인 ID)';
COMMENT ON COLUMN mb_member.member_password IS '비밀번호 (bcrypt)';
COMMENT ON COLUMN mb_member.member_nm      IS '회원명';
COMMENT ON COLUMN mb_member.member_phone   IS '연락처';
COMMENT ON COLUMN mb_member.member_gender  IS '성별 M/F';
COMMENT ON COLUMN mb_member.birth_date     IS '생년월일';
COMMENT ON COLUMN mb_member.grade_cd       IS '등급 (코드: MEMBER_GRADE)';
COMMENT ON COLUMN mb_member.member_status_cd IS '상태 (코드: MEMBER_STATUS)';
COMMENT ON COLUMN mb_member.member_status_cd_before IS '변경 전 회원상태 (코드: MEMBER_STATUS)';
COMMENT ON COLUMN mb_member.join_date      IS '가입일';
COMMENT ON COLUMN mb_member.last_login     IS '최근 로그인';
COMMENT ON COLUMN mb_member.order_count    IS '주문 건수';
COMMENT ON COLUMN mb_member.total_purchase_amt IS '누적 구매금액';
COMMENT ON COLUMN mb_member.cache_balance_amt  IS '적립금 잔액';
COMMENT ON COLUMN mb_member.member_zip_code IS '우편번호';
COMMENT ON COLUMN mb_member.member_addr    IS '주소';
COMMENT ON COLUMN mb_member.member_addr_detail IS '상세주소';
COMMENT ON COLUMN mb_member.member_memo    IS '메모';
COMMENT ON COLUMN mb_member.reg_by         IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN mb_member.reg_date       IS '등록일';
COMMENT ON COLUMN mb_member.upd_by         IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN mb_member.upd_date       IS '수정일';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] mb_member.grade_cd (등급) : 회원등급 { VIP:VIP, GOLD:우수, NORMAL:일반 }
-- [CODES] mb_member.member_status_cd (상태) : 회원상태 { ACTIVE:활성, BLOCKED:정지, WITHDRAWN:탈퇴 }
