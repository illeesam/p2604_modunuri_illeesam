-- syh_user_login_log 테이블 DDL
-- 관리자 사용자 로그인 로그

CREATE TABLE shopjoy_2604.syh_user_login_log (
    log_id            VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id           VARCHAR(21)  NOT NULL,
    user_id           VARCHAR(21) ,
    login_id          VARCHAR(100),
    login_date        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    result_cd         VARCHAR(20)  DEFAULT 'SUCCESS'::character varying,
    fail_cnt          INTEGER      DEFAULT 0,
    ip                VARCHAR(50) ,
    device            VARCHAR(200),
    os                VARCHAR(50) ,
    browser           VARCHAR(50) ,
    access_token      VARCHAR(512),
    access_token_exp  TIMESTAMP   ,
    refresh_token     VARCHAR(512),
    refresh_token_exp TIMESTAMP   ,
    reg_by            VARCHAR(30) ,
    reg_date          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by            VARCHAR(30) ,
    upd_date          TIMESTAMP   ,
    auth_id           VARCHAR(21) ,
    ui_nm             VARCHAR(200),
    cmd_nm            VARCHAR(200),
    file_nm           VARCHAR(200),
    func_nm           VARCHAR(200),
    line_no           VARCHAR(10) ,
    trace_id          VARCHAR(50) 
);

COMMENT ON TABLE  shopjoy_2604.syh_user_login_log IS '관리자 사용자 로그인 로그';
COMMENT ON COLUMN shopjoy_2604.syh_user_login_log.log_id IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.syh_user_login_log.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.syh_user_login_log.user_id IS '사용자ID (로그인 실패 시 NULL)';
COMMENT ON COLUMN shopjoy_2604.syh_user_login_log.login_id IS '입력한 로그인ID';
COMMENT ON COLUMN shopjoy_2604.syh_user_login_log.login_date IS '로그인 시도일시';
COMMENT ON COLUMN shopjoy_2604.syh_user_login_log.result_cd IS '결과 (코드: LOGIN_RESULT)';
COMMENT ON COLUMN shopjoy_2604.syh_user_login_log.fail_cnt IS '해당 시점 연속 실패 횟수';
COMMENT ON COLUMN shopjoy_2604.syh_user_login_log.ip IS 'IP주소';
COMMENT ON COLUMN shopjoy_2604.syh_user_login_log.device IS 'User-Agent 전문';
COMMENT ON COLUMN shopjoy_2604.syh_user_login_log.os IS 'OS 정보';
COMMENT ON COLUMN shopjoy_2604.syh_user_login_log.browser IS '브라우저 정보';
COMMENT ON COLUMN shopjoy_2604.syh_user_login_log.access_token IS '액세스 토큰 (SHA-256 해시값 저장 권장, 로그인 실패 시 NULL)';
COMMENT ON COLUMN shopjoy_2604.syh_user_login_log.access_token_exp IS '액세스 토큰 만료일시';
COMMENT ON COLUMN shopjoy_2604.syh_user_login_log.refresh_token IS '리프레시 토큰 (SHA-256 해시값 저장 권장)';
COMMENT ON COLUMN shopjoy_2604.syh_user_login_log.refresh_token_exp IS '리프레시 토큰 만료일시';
COMMENT ON COLUMN shopjoy_2604.syh_user_login_log.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.syh_user_login_log.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.syh_user_login_log.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.syh_user_login_log.upd_date IS '수정일';
COMMENT ON COLUMN shopjoy_2604.syh_user_login_log.auth_id IS '인증ID';
COMMENT ON COLUMN shopjoy_2604.syh_user_login_log.ui_nm IS '화면명 (X-UI-Nm 헤더)';
COMMENT ON COLUMN shopjoy_2604.syh_user_login_log.cmd_nm IS '기능명 (X-Cmd-Nm 헤더)';

CREATE INDEX idx_syh_user_login_log_date ON shopjoy_2604.syh_user_login_log USING btree (login_date);
CREATE INDEX idx_syh_user_login_log_ip ON shopjoy_2604.syh_user_login_log USING btree (ip);
CREATE INDEX idx_syh_user_login_log_site ON shopjoy_2604.syh_user_login_log USING btree (site_id);
CREATE INDEX idx_syh_user_login_log_user ON shopjoy_2604.syh_user_login_log USING btree (user_id);
