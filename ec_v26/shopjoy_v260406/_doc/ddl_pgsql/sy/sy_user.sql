-- sy_user 테이블 DDL
-- 관리자 사용자

CREATE TABLE shopjoy_2604.sy_user (
    user_id           VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id           VARCHAR(21)  NOT NULL,
    login_id          VARCHAR(50)  NOT NULL,
    login_pwd_hash    VARCHAR(255) NOT NULL,
    user_nm           VARCHAR(50)  NOT NULL,
    user_email        VARCHAR(100),
    user_phone        VARCHAR(20) ,
    dept_id           VARCHAR(21) ,
    role_id           VARCHAR(21) ,
    user_status_cd    VARCHAR(20)  DEFAULT 'ACTIVE'::character varying,
    last_login        TIMESTAMP   ,
    login_fail_cnt    INTEGER      DEFAULT 0,
    user_memo         TEXT        ,
    reg_by            VARCHAR(30) ,
    reg_date          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by            VARCHAR(30) ,
    upd_date          TIMESTAMP   ,
    auth_method_cd    VARCHAR(20)  DEFAULT 'MAIN'::character varying,
    last_login_date   TIMESTAMP   ,
    app_type_cd       VARCHAR(2)  ,
    profile_attach_id VARCHAR(21) 
);

COMMENT ON TABLE  shopjoy_2604.sy_user IS '관리자 사용자';
COMMENT ON COLUMN shopjoy_2604.sy_user.user_id IS '사용자ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.sy_user.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.sy_user.login_id IS '로그인 아이디';
COMMENT ON COLUMN shopjoy_2604.sy_user.login_pwd_hash IS '비밀번호 (bcrypt)';
COMMENT ON COLUMN shopjoy_2604.sy_user.user_nm IS '사용자명';
COMMENT ON COLUMN shopjoy_2604.sy_user.user_email IS '이메일';
COMMENT ON COLUMN shopjoy_2604.sy_user.user_phone IS '연락처';
COMMENT ON COLUMN shopjoy_2604.sy_user.dept_id IS '부서ID (sy_dept.dept_id)';
COMMENT ON COLUMN shopjoy_2604.sy_user.role_id IS '역할ID (sy_role.role_id)';
COMMENT ON COLUMN shopjoy_2604.sy_user.user_status_cd IS '상태 (코드: USER_STATUS)';
COMMENT ON COLUMN shopjoy_2604.sy_user.last_login IS '최근 로그인';
COMMENT ON COLUMN shopjoy_2604.sy_user.login_fail_cnt IS '로그인 실패 횟수';
COMMENT ON COLUMN shopjoy_2604.sy_user.user_memo IS '메모';
COMMENT ON COLUMN shopjoy_2604.sy_user.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_user.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.sy_user.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_user.upd_date IS '수정일';
COMMENT ON COLUMN shopjoy_2604.sy_user.auth_method_cd IS '인증방식 (코드: AUTH_METHOD)';
COMMENT ON COLUMN shopjoy_2604.sy_user.last_login_date IS '마지막 로그인 일시';
COMMENT ON COLUMN shopjoy_2604.sy_user.app_type_cd IS '앱 유형 (코드: APP_TYPE — FO:사용자앱, BO:관리자앱, SO:판매자앱, DO:배달기사앱, CO:고객사앱)';
COMMENT ON COLUMN shopjoy_2604.sy_user.profile_attach_id IS '프로필 첨부아이디';

CREATE INDEX idx_sy_user_site ON shopjoy_2604.sy_user USING btree (site_id);
CREATE UNIQUE INDEX sy_user_login_id_key ON shopjoy_2604.sy_user USING btree (login_id);
