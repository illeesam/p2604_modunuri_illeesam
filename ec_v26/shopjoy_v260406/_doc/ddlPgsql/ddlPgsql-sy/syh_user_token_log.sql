-- ============================================================
-- syh_user_token_log : 관리자 사용자 토큰 이력
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(21)
-- 용도: 액세스/리프레시 토큰 발급·갱신·폐기 전 생애주기 추적
-- 보안 주의: access_token/refresh_token 컬럼은 SHA-256 해시값 저장 권장 (원문 저장 금지)
-- 중복로그인: user_id당 1건 유지 (신규 로그인 시 기존 행 DELETE 후 INSERT)
-- ============================================================
CREATE TABLE syh_user_token_log (
    log_id              VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    user_id             VARCHAR(21)     NOT NULL,              -- sy_user.user_id
    login_log_id        VARCHAR(21),                           -- syh_user_login_log.log_id (최초 발급 시점 연결)
    action_cd           VARCHAR(20)     NOT NULL,              -- 코드: TOKEN_ACTION (ISSUE/REFRESH/REVOKE/EXPIRE)
    token_type_cd       VARCHAR(20)     NOT NULL,              -- 코드: TOKEN_TYPE (ACCESS/REFRESH)
    access_token        VARCHAR(512)    NOT NULL,              -- 액세스 토큰 (SHA-256 해시값 저장 권장)
    token_exp           TIMESTAMP,                             -- 액세스 토큰 만료일시
    prev_token          VARCHAR(512),                          -- 갱신 전 액세스 토큰 해시 (REFRESH 액션 시)
    refresh_token       VARCHAR(512),                          -- 리프레시 토큰 (SHA-256 해시값 저장 권장, 서버 DB에만 보관)
    ip                  VARCHAR(50),
    device_info         VARCHAR(200),                          -- User-Agent
    revoke_reason       VARCHAR(200),                          -- 폐기 사유 (REVOKE 시: LOGOUT/FORCE/EXPIRED 등)
    access_token_exp    TIMESTAMP,                             -- 액세스 토큰 만료일시
    ui_nm               VARCHAR(100),                          -- 화면명 (X-UI-Nm 헤더)
    cmd_nm              VARCHAR(100),                          -- 기능명 (X-Cmd-Nm 헤더)
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (log_id)
);

COMMENT ON TABLE  syh_user_token_log                        IS '관리자 사용자 토큰 이력';
COMMENT ON COLUMN syh_user_token_log.log_id                 IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN syh_user_token_log.site_id                IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN syh_user_token_log.user_id                IS '사용자ID (sy_user.user_id)';
COMMENT ON COLUMN syh_user_token_log.login_log_id           IS '최초 로그인 로그ID (syh_user_login_log.log_id)';
COMMENT ON COLUMN syh_user_token_log.action_cd              IS '토큰 액션 (코드: TOKEN_ACTION — ISSUE/REFRESH/REVOKE/EXPIRE)';
COMMENT ON COLUMN syh_user_token_log.token_type_cd          IS '토큰 유형 (코드: TOKEN_TYPE — ACCESS/REFRESH)';
COMMENT ON COLUMN syh_user_token_log.access_token           IS '액세스 토큰 (SHA-256 해시 저장 권장)';
COMMENT ON COLUMN syh_user_token_log.token_exp              IS '액세스 토큰 만료일시';
COMMENT ON COLUMN syh_user_token_log.prev_token             IS '갱신 전 액세스 토큰 해시 (REFRESH 액션 시)';
COMMENT ON COLUMN syh_user_token_log.refresh_token          IS '리프레시 토큰 (SHA-256 해시 저장 권장, 서버 DB에만 보관)';
COMMENT ON COLUMN syh_user_token_log.ip                     IS 'IP주소';
COMMENT ON COLUMN syh_user_token_log.device_info            IS 'User-Agent';
COMMENT ON COLUMN syh_user_token_log.revoke_reason          IS '폐기 사유 (LOGOUT/FORCE/EXPIRED 등)';
COMMENT ON COLUMN syh_user_token_log.access_token_exp       IS '액세스 토큰 만료일시';
COMMENT ON COLUMN syh_user_token_log.ui_nm                  IS '화면명 (X-UI-Nm 헤더)';
COMMENT ON COLUMN syh_user_token_log.cmd_nm                 IS '기능명 (X-Cmd-Nm 헤더)';
COMMENT ON COLUMN syh_user_token_log.reg_by                 IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN syh_user_token_log.reg_date               IS '등록일';
COMMENT ON COLUMN syh_user_token_log.upd_by                 IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN syh_user_token_log.upd_date               IS '수정일';

CREATE INDEX idx_syh_user_token_log_user      ON syh_user_token_log (user_id);
CREATE INDEX idx_syh_user_token_log_action    ON syh_user_token_log (action_cd);
CREATE INDEX idx_syh_user_token_log_login_log ON syh_user_token_log (login_log_id);
CREATE INDEX idx_syh_user_token_log_date      ON syh_user_token_log (reg_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] syh_user_token_log.action_cd   (토큰 액션) : TOKEN_ACTION { ISSUE:발급, REFRESH:갱신, EXPIRE:만료, REVOKE:폐기, LOGOUT:로그아웃 }
-- [CODES] syh_user_token_log.token_type_cd (토큰 유형) : TOKEN_TYPE { ACCESS:액세스, REFRESH:리프레시 }
