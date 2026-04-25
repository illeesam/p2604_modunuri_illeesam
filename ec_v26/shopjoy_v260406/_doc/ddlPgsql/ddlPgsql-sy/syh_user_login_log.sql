-- ============================================================
-- syh_user_login_log : 관리자 사용자 로그인 로그
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- 보안 주의: access_token / refresh_token 은 SHA-256 해시값 저장 권장
-- ============================================================
CREATE TABLE syh_user_login_log (
    log_id              VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    user_id             VARCHAR(21),                           -- sy_user.user_id (실패 시 NULL 가능)
    login_id            VARCHAR(100),                          -- 입력한 로그인ID
    login_date          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    result_cd           VARCHAR(20)     DEFAULT 'SUCCESS',     -- 코드: LOGIN_RESULT (SUCCESS/FAIL_PWD/FAIL_LOCKED/FAIL_NOT_FOUND)
    fail_cnt            SMALLINT        DEFAULT 0,             -- 해당 시점 연속 실패 횟수
    ip                  VARCHAR(50),
    device              VARCHAR(200),                          -- User-Agent
    os                  VARCHAR(50),                           -- 파싱된 OS 정보
    browser             VARCHAR(50),                           -- 파싱된 브라우저 정보
    -- 로그인 성공 시 발급 토큰 정보 (실패 시 NULL)
    access_token        VARCHAR(512),                          -- 액세스 토큰 (SHA-256 해시 권장)
    access_token_exp    TIMESTAMP,                             -- 액세스 토큰 만료일시
    refresh_token       VARCHAR(512),                          -- 리프레시 토큰 (SHA-256 해시 권장)
    refresh_token_exp   TIMESTAMP,                             -- 리프레시 토큰 만료일시
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (log_id)
);

COMMENT ON TABLE  syh_user_login_log                   IS '관리자 사용자 로그인 로그';
COMMENT ON COLUMN syh_user_login_log.log_id            IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN syh_user_login_log.site_id           IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN syh_user_login_log.user_id           IS '사용자ID (로그인 실패 시 NULL)';
COMMENT ON COLUMN syh_user_login_log.login_id          IS '입력한 로그인ID';
COMMENT ON COLUMN syh_user_login_log.login_date        IS '로그인 시도일시';
COMMENT ON COLUMN syh_user_login_log.result_cd         IS '결과 (코드: LOGIN_RESULT)';
COMMENT ON COLUMN syh_user_login_log.fail_cnt          IS '해당 시점 연속 실패 횟수';
COMMENT ON COLUMN syh_user_login_log.ip                IS 'IP주소';
COMMENT ON COLUMN syh_user_login_log.device            IS 'User-Agent 전문';
COMMENT ON COLUMN syh_user_login_log.os                IS 'OS 정보';
COMMENT ON COLUMN syh_user_login_log.browser           IS '브라우저 정보';
COMMENT ON COLUMN syh_user_login_log.access_token      IS '액세스 토큰 (SHA-256 해시값 저장 권장, 로그인 실패 시 NULL)';
COMMENT ON COLUMN syh_user_login_log.access_token_exp  IS '액세스 토큰 만료일시';
COMMENT ON COLUMN syh_user_login_log.refresh_token     IS '리프레시 토큰 (SHA-256 해시값 저장 권장)';
COMMENT ON COLUMN syh_user_login_log.refresh_token_exp IS '리프레시 토큰 만료일시';
COMMENT ON COLUMN syh_user_login_log.reg_by            IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_user_login_log.reg_date          IS '등록일';
COMMENT ON COLUMN syh_user_login_log.upd_by            IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_user_login_log.upd_date          IS '수정일';

CREATE INDEX idx_syh_user_login_log_user  ON syh_user_login_log (user_id);
CREATE INDEX idx_syh_user_login_log_date  ON syh_user_login_log (login_date);
CREATE INDEX idx_syh_user_login_log_ip    ON syh_user_login_log (ip);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] syh_user_login_log.result_cd (결과) : LOGIN_RESULT { SUCCESS:성공, FAIL_PW:비밀번호오류, FAIL_LOCKED:잠금, FAIL_DORMANT:휴면, FAIL_WITHDRAWN:탈퇴 }
