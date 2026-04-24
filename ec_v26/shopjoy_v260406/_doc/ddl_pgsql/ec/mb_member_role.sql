-- mb_member_role 테이블 DDL
-- 회원 역할 연결: ec_member ↔ sy_role
-- sy_vendor_user_role 참고, vendor_id 없이 member_id 기준

CREATE TABLE shopjoy_2604.mb_member_role (
    member_role_id        VARCHAR(21)  NOT NULL PRIMARY KEY,   -- PK (MBR + yyMMddHHmmss + rand4)
    member_id             VARCHAR(21)  NOT NULL,               -- FK: ec_member.member_id
    role_id               VARCHAR(21)  NOT NULL,               -- FK: sy_role.role_id
    grant_user_id         VARCHAR(21),                         -- 권한 부여한 관리자 user_id
    grant_date            TIMESTAMP,                           -- 권한 부여 일시
    valid_from            DATE,                                 -- 유효 시작일 (NULL=제한없음)
    valid_to              DATE,                                 -- 유효 종료일 (NULL=제한없음)
    member_role_remark    VARCHAR(500),                        -- 비고
    reg_by                VARCHAR(30),
    reg_date              TIMESTAMP    DEFAULT NOW(),
    upd_by                VARCHAR(30),
    upd_date              TIMESTAMP,

    CONSTRAINT fk_mb_member_role_member FOREIGN KEY (member_id)    REFERENCES shopjoy_2604.ec_member (member_id),
    CONSTRAINT fk_mb_member_role_role   FOREIGN KEY (role_id)      REFERENCES shopjoy_2604.sy_role   (role_id),
    CONSTRAINT fk_mb_member_role_grant  FOREIGN KEY (grant_user_id) REFERENCES shopjoy_2604.sy_user  (user_id)
);

COMMENT ON TABLE  shopjoy_2604.mb_member_role                  IS '회원 역할 연결';
COMMENT ON COLUMN shopjoy_2604.mb_member_role.member_role_id   IS 'PK';
COMMENT ON COLUMN shopjoy_2604.mb_member_role.member_id        IS '회원 ID (ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.mb_member_role.role_id          IS '역할 ID (sy_role.role_id)';
COMMENT ON COLUMN shopjoy_2604.mb_member_role.grant_user_id    IS '권한 부여 관리자 ID';
COMMENT ON COLUMN shopjoy_2604.mb_member_role.grant_date       IS '권한 부여 일시';
COMMENT ON COLUMN shopjoy_2604.mb_member_role.valid_from       IS '유효 시작일';
COMMENT ON COLUMN shopjoy_2604.mb_member_role.valid_to         IS '유효 종료일';
COMMENT ON COLUMN shopjoy_2604.mb_member_role.member_role_remark IS '비고';

CREATE INDEX idx_mb_member_role_member ON shopjoy_2604.mb_member_role (member_id);
CREATE INDEX idx_mb_member_role_role   ON shopjoy_2604.mb_member_role (role_id);
