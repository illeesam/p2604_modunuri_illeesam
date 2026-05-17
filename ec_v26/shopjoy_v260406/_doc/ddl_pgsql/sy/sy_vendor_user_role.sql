-- sy_vendor_user_role 테이블 DDL
-- 업체 사용자 역할 연결

CREATE TABLE shopjoy_2604.sy_vendor_user_role (
    vendor_user_role_id     VARCHAR(21)  NOT NULL PRIMARY KEY,
    vendor_id               VARCHAR(21)  NOT NULL,
    user_id                 VARCHAR(21)  NOT NULL,
    role_id                 VARCHAR(21)  NOT NULL,
    grant_user_id           VARCHAR(21) ,
    grant_date              TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    valid_from              DATE        ,
    valid_to                DATE        ,
    vendor_user_role_remark VARCHAR(500),
    reg_by                  VARCHAR(30) ,
    reg_date                TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by                  VARCHAR(30) ,
    upd_date                TIMESTAMP   ,
    site_id                 VARCHAR(21)  NOT NULL
);

COMMENT ON TABLE  shopjoy_2604.sy_vendor_user_role IS '업체 사용자 역할 연결';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user_role.vendor_user_role_id IS '업체사용자역할ID (PK)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user_role.vendor_id IS '업체ID (sy_vendor.vendor_id)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user_role.user_id IS '업체사용자ID (sy_vendor_user.vendor_user_id)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user_role.role_id IS '역할ID (sy_role.role_id)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user_role.grant_user_id IS '역할 부여자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user_role.grant_date IS '역할 부여일시';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user_role.valid_from IS '유효 시작일';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user_role.valid_to IS '유효 종료일';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user_role.vendor_user_role_remark IS '비고';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user_role.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user_role.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user_role.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_user_role.upd_date IS '수정일';

CREATE INDEX idx_sy_vendor_user_role_role ON shopjoy_2604.sy_vendor_user_role USING btree (role_id);
CREATE INDEX idx_sy_vendor_user_role_site ON shopjoy_2604.sy_vendor_user_role USING btree (site_id);
CREATE INDEX idx_sy_vendor_user_role_user ON shopjoy_2604.sy_vendor_user_role USING btree (user_id);
CREATE INDEX idx_sy_vendor_user_role_vendor ON shopjoy_2604.sy_vendor_user_role USING btree (vendor_id);
CREATE UNIQUE INDEX sy_vendor_user_role_vendor_id_user_id_role_id_key ON shopjoy_2604.sy_vendor_user_role USING btree (vendor_id, user_id, role_id);
