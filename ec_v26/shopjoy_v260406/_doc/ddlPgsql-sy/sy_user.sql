-- ============================================================
CREATE TABLE sy_user (
    user_id         VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    login_id        VARCHAR(50)     NOT NULL,
    user_password   VARCHAR(255)    NOT NULL,
    user_nm         VARCHAR(50)     NOT NULL,
    user_email      VARCHAR(100),
    user_phone      VARCHAR(20),
    dept_id         VARCHAR(21),                            -- sy_dept.dept_id
    role_id         VARCHAR(21),                            -- sy_role.role_id
    user_status_cd  VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: USER_STATUS
    last_login      TIMESTAMP,
    login_fail_cnt  SMALLINT        DEFAULT 0,
    user_memo       TEXT,
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    -- ── 인증 ──
    auth_method_cd  VARCHAR(20)     DEFAULT 'MAIN',         -- 코드: AUTH_METHOD (MAIN/SMS/OTP/AUTHENTICATOR)
    last_login_date TIMESTAMP,

    PRIMARY KEY (user_id),
    UNIQUE (login_id)
);

COMMENT ON TABLE  sy_user                  IS '관리자 사용자';
COMMENT ON COLUMN sy_user.user_id          IS '사용자ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_user.site_id          IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_user.login_id         IS '로그인 아이디';
COMMENT ON COLUMN sy_user.user_password    IS '비밀번호 (bcrypt)';
COMMENT ON COLUMN sy_user.user_nm          IS '사용자명';
COMMENT ON COLUMN sy_user.user_email       IS '이메일';
COMMENT ON COLUMN sy_user.user_phone       IS '연락처';
COMMENT ON COLUMN sy_user.dept_id          IS '부서ID (sy_dept.dept_id)';
COMMENT ON COLUMN sy_user.role_id          IS '역할ID (sy_role.role_id)';
COMMENT ON COLUMN sy_user.user_status_cd   IS '상태 (코드: USER_STATUS)';
COMMENT ON COLUMN sy_user.last_login       IS '최근 로그인';
COMMENT ON COLUMN sy_user.login_fail_cnt   IS '로그인 실패 횟수';
COMMENT ON COLUMN sy_user.user_memo        IS '메모';
COMMENT ON COLUMN sy_user.reg_by           IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_user.reg_date         IS '등록일';
COMMENT ON COLUMN sy_user.upd_by           IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_user.upd_date         IS '수정일';
COMMENT ON COLUMN sy_user.auth_method_cd   IS '인증방식 (코드: AUTH_METHOD)';
COMMENT ON COLUMN sy_user.last_login_date  IS '마지막 로그인 일시';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_user.user_status_cd (상태) : 사용자상태 { ACTIVE:활성, INACTIVE:비활성 }
-- [CODES] sy_user.auth_method_cd (인증방식) : AUTH_METHOD { EMAIL:이메일, GOOGLE:구글, KAKAO:카카오, NAVER:네이버 }
