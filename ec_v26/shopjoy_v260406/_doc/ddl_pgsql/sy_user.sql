-- ============================================================
-- sy_user : 관리자 사용자
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE sy_user (
    user_id         VARCHAR(16)     NOT NULL,
    login_id        VARCHAR(50)     NOT NULL,
    password        VARCHAR(255)    NOT NULL,
    name            VARCHAR(50)     NOT NULL,
    email           VARCHAR(100),
    phone           VARCHAR(20),
    dept_id         VARCHAR(16),
    role_id         VARCHAR(16),
    status_cd       VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: USER_STATUS
    last_login      TIMESTAMP,
    login_fail_cnt  SMALLINT        DEFAULT 0,
    memo            TEXT,
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_date        TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE (login_id)
);

COMMENT ON TABLE  sy_user                  IS '관리자 사용자';
COMMENT ON COLUMN sy_user.user_id          IS '사용자ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_user.login_id         IS '로그인 아이디';
COMMENT ON COLUMN sy_user.password         IS '비밀번호 (bcrypt)';
COMMENT ON COLUMN sy_user.name             IS '이름';
COMMENT ON COLUMN sy_user.email            IS '이메일';
COMMENT ON COLUMN sy_user.phone            IS '연락처';
COMMENT ON COLUMN sy_user.dept_id          IS '부서ID';
COMMENT ON COLUMN sy_user.role_id          IS '역할ID';
COMMENT ON COLUMN sy_user.status_cd        IS '상태 (코드: USER_STATUS)';
COMMENT ON COLUMN sy_user.last_login       IS '최근 로그인';
COMMENT ON COLUMN sy_user.login_fail_cnt   IS '로그인 실패 횟수';
COMMENT ON COLUMN sy_user.memo             IS '메모';
COMMENT ON COLUMN sy_user.reg_date         IS '등록일';
COMMENT ON COLUMN sy_user.upd_date         IS '수정일';

-- 관리자 로그인 이력
CREATE TABLE sy_user_login_hist (
    login_hist_id   VARCHAR(16)     NOT NULL,
    user_id         VARCHAR(16)     NOT NULL,
    login_date      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    ip              VARCHAR(50),
    device          VARCHAR(100),
    result          VARCHAR(20)     DEFAULT 'SUCCESS',
    PRIMARY KEY (login_hist_id)
);

COMMENT ON TABLE  sy_user_login_hist               IS '관리자 로그인 이력';
COMMENT ON COLUMN sy_user_login_hist.login_hist_id IS '로그인이력ID';
COMMENT ON COLUMN sy_user_login_hist.user_id       IS '사용자ID';
COMMENT ON COLUMN sy_user_login_hist.login_date    IS '로그인일시';
COMMENT ON COLUMN sy_user_login_hist.ip            IS 'IP주소';
COMMENT ON COLUMN sy_user_login_hist.device        IS '디바이스';
COMMENT ON COLUMN sy_user_login_hist.result        IS '결과 (SUCCESS/FAIL)';
