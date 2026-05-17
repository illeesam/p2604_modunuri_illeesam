-- mbh_member_token_log 테이블 DDL
-- 회원 토큰 이력

CREATE TABLE shopjoy_2604.mbh_member_token_log (
    log_id           VARCHAR(21)   NOT NULL PRIMARY KEY,
    site_id          VARCHAR(21)   NOT NULL,
    member_id        VARCHAR(21)   NOT NULL,
    login_log_id     VARCHAR(21)  ,
    action_cd        VARCHAR(20)   NOT NULL,
    token_type_cd    VARCHAR(20)   NOT NULL,
    access_token     VARCHAR(512)  NOT NULL,
    token_exp        TIMESTAMP    ,
    prev_token       VARCHAR(512) ,
    ip               VARCHAR(50)  ,
    device_info      VARCHAR(200) ,
    revoke_reason    VARCHAR(200) ,
    reg_by           VARCHAR(30)  ,
    reg_date         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(30)  ,
    upd_date         TIMESTAMP    ,
    refresh_token    VARCHAR(null),
    auth_id          VARCHAR(21)  ,
    ui_nm            VARCHAR(200) ,
    cmd_nm           VARCHAR(200) ,
    file_nm          VARCHAR(200) ,
    func_nm          VARCHAR(200) ,
    line_no          VARCHAR(10)  ,
    trace_id         VARCHAR(50)  ,
    access_token_exp TIMESTAMP    
);

COMMENT ON TABLE  shopjoy_2604.mbh_member_token_log IS '회원 토큰 이력';
COMMENT ON COLUMN shopjoy_2604.mbh_member_token_log.log_id IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.mbh_member_token_log.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.mbh_member_token_log.member_id IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.mbh_member_token_log.login_log_id IS '최초 로그인 로그ID (mb_member_login_log.)';
COMMENT ON COLUMN shopjoy_2604.mbh_member_token_log.action_cd IS '토큰 액션 (코드: TOKEN_ACTION — ISSUE/REFRESH/REVOKE/EXPIRE)';
COMMENT ON COLUMN shopjoy_2604.mbh_member_token_log.token_type_cd IS '토큰 유형 (코드: TOKEN_TYPE — ACCESS/REFRESH)';
COMMENT ON COLUMN shopjoy_2604.mbh_member_token_log.access_token IS '토큰값 (SHA-256 해시 저장 권장)';
COMMENT ON COLUMN shopjoy_2604.mbh_member_token_log.token_exp IS '토큰 만료일시';
COMMENT ON COLUMN shopjoy_2604.mbh_member_token_log.prev_token IS '갱신 전 토큰 해시 (REFRESH 액션 시)';
COMMENT ON COLUMN shopjoy_2604.mbh_member_token_log.ip IS 'IP주소';
COMMENT ON COLUMN shopjoy_2604.mbh_member_token_log.device_info IS 'User-Agent';
COMMENT ON COLUMN shopjoy_2604.mbh_member_token_log.revoke_reason IS '폐기 사유 (LOGOUT/FORCE/EXPIRED 등)';
COMMENT ON COLUMN shopjoy_2604.mbh_member_token_log.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.mbh_member_token_log.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.mbh_member_token_log.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.mbh_member_token_log.upd_date IS '수정일';
COMMENT ON COLUMN shopjoy_2604.mbh_member_token_log.refresh_token IS '리푸레쉬 토큰';
COMMENT ON COLUMN shopjoy_2604.mbh_member_token_log.auth_id IS '인증ID';
COMMENT ON COLUMN shopjoy_2604.mbh_member_token_log.ui_nm IS '화면명 (X-UI-Nm 헤더)';
COMMENT ON COLUMN shopjoy_2604.mbh_member_token_log.cmd_nm IS '기능명 (X-Cmd-Nm 헤더)';
COMMENT ON COLUMN shopjoy_2604.mbh_member_token_log.access_token_exp IS '액세스 토큰 만료일시';

CREATE INDEX idx_mbh_member_token_log_action ON shopjoy_2604.mbh_member_token_log USING btree (action_cd);
CREATE INDEX idx_mbh_member_token_log_date ON shopjoy_2604.mbh_member_token_log USING btree (reg_date);
CREATE INDEX idx_mbh_member_token_log_login_log ON shopjoy_2604.mbh_member_token_log USING btree (login_log_id);
CREATE INDEX idx_mbh_member_token_log_member ON shopjoy_2604.mbh_member_token_log USING btree (member_id);
CREATE INDEX idx_mbh_member_token_log_site ON shopjoy_2604.mbh_member_token_log USING btree (site_id);
