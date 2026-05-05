-- sy_user_role 테이블 DDL
-- 관리자 사용자-역할 매핑 (N:M)

CREATE TABLE shopjoy_2604.sy_user_role (
    user_role_id     VARCHAR(21)  NOT NULL PRIMARY KEY,
    user_id          VARCHAR(21)  NOT NULL,
    role_id          VARCHAR(21)  NOT NULL,
    grant_user_id    VARCHAR(21) ,
    grant_date       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    valid_from       DATE        ,
    valid_to         DATE        ,
    user_role_remark VARCHAR(500),
    reg_by           VARCHAR(30) ,
    reg_date         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(30) ,
    upd_date         TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.sy_user_role IS '관리자 사용자-역할 매핑 (N:M)';
COMMENT ON COLUMN shopjoy_2604.sy_user_role.user_role_id IS '사용자역할ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.sy_user_role.user_id IS '사용자ID (sy_user.user_id, UNIQUE with role_id)';
COMMENT ON COLUMN shopjoy_2604.sy_user_role.role_id IS '역할ID (sy_role.role_id, UNIQUE with user_id)';
COMMENT ON COLUMN shopjoy_2604.sy_user_role.grant_user_id IS '부여자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.sy_user_role.grant_date IS '부여일시';
COMMENT ON COLUMN shopjoy_2604.sy_user_role.valid_from IS '적용 시작일';
COMMENT ON COLUMN shopjoy_2604.sy_user_role.valid_to IS '적용 종료일';
COMMENT ON COLUMN shopjoy_2604.sy_user_role.user_role_remark IS '비고';
COMMENT ON COLUMN shopjoy_2604.sy_user_role.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_user_role.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.sy_user_role.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_user_role.upd_date IS '수정일';

CREATE INDEX idx_sy_user_role_role ON shopjoy_2604.sy_user_role USING btree (role_id);
CREATE INDEX idx_sy_user_role_user ON shopjoy_2604.sy_user_role USING btree (user_id);
CREATE UNIQUE INDEX sy_user_role_user_id_role_id_key ON shopjoy_2604.sy_user_role USING btree (user_id, role_id);
