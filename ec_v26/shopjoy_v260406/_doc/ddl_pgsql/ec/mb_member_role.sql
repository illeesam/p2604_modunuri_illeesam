-- mb_member_role 테이블 DDL
-- 회원 역할 연결

CREATE TABLE shopjoy_2604.mb_member_role (
    member_role_id     VARCHAR(21)  NOT NULL PRIMARY KEY,
    member_id          VARCHAR(21)  NOT NULL,
    role_id            VARCHAR(21)  NOT NULL,
    grant_user_id      VARCHAR(21) ,
    grant_date         TIMESTAMP   ,
    valid_from         DATE        ,
    valid_to           DATE        ,
    member_role_remark VARCHAR(500),
    reg_by             VARCHAR(30) ,
    reg_date           TIMESTAMP    DEFAULT now(),
    upd_by             VARCHAR(30) ,
    upd_date           TIMESTAMP   ,
    CONSTRAINT fk_mb_member_role_grant FOREIGN KEY (grant_user_id) REFERENCES shopjoy_2604.sy_user (user_id),
    CONSTRAINT fk_mb_member_role_member FOREIGN KEY (member_id) REFERENCES shopjoy_2604.mb_member (member_id),
    CONSTRAINT fk_mb_member_role_role FOREIGN KEY (role_id) REFERENCES shopjoy_2604.sy_role (role_id)
);

COMMENT ON TABLE  shopjoy_2604.mb_member_role IS '회원 역할 연결';
COMMENT ON COLUMN shopjoy_2604.mb_member_role.member_role_id IS 'PK';
COMMENT ON COLUMN shopjoy_2604.mb_member_role.member_id IS '회원 ID (mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.mb_member_role.role_id IS '역할 ID (sy_role.role_id)';
COMMENT ON COLUMN shopjoy_2604.mb_member_role.grant_user_id IS '권한 부여 관리자 ID';
COMMENT ON COLUMN shopjoy_2604.mb_member_role.grant_date IS '권한 부여 일시';
COMMENT ON COLUMN shopjoy_2604.mb_member_role.valid_from IS '유효 시작일';
COMMENT ON COLUMN shopjoy_2604.mb_member_role.valid_to IS '유효 종료일';
COMMENT ON COLUMN shopjoy_2604.mb_member_role.member_role_remark IS '비고';

CREATE INDEX idx_mb_member_role_member ON shopjoy_2604.mb_member_role USING btree (member_id);
CREATE INDEX idx_mb_member_role_role ON shopjoy_2604.mb_member_role USING btree (role_id);
