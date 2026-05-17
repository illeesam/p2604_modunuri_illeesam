-- sy_role 테이블 DDL
-- 역할 (권한그룹)

CREATE TABLE shopjoy_2604.sy_role (
    role_id        VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id        VARCHAR(21)  NOT NULL,
    role_code      VARCHAR(50)  NOT NULL,
    role_nm        VARCHAR(100) NOT NULL,
    parent_role_id VARCHAR(21) ,
    role_type_cd   VARCHAR(20) ,
    sort_ord       INTEGER      DEFAULT 0,
    use_yn         VARCHAR(1)   DEFAULT 'Y'::bpchar,
    restrict_perm  VARCHAR(1)   DEFAULT 'N'::bpchar,
    role_remark    VARCHAR(300),
    reg_by         VARCHAR(30) ,
    reg_date       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by         VARCHAR(30) ,
    upd_date       TIMESTAMP   ,
    path_id        VARCHAR(21) 
);

COMMENT ON TABLE  shopjoy_2604.sy_role IS '역할 (권한그룹)';
COMMENT ON COLUMN shopjoy_2604.sy_role.role_id IS '역할ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.sy_role.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.sy_role.role_code IS '역할코드';
COMMENT ON COLUMN shopjoy_2604.sy_role.role_nm IS '역할명';
COMMENT ON COLUMN shopjoy_2604.sy_role.parent_role_id IS '상위역할ID';
COMMENT ON COLUMN shopjoy_2604.sy_role.role_type_cd IS '역할유형 (코드: ROLE_TYPE — SYSTEM/CUSTOM)';
COMMENT ON COLUMN shopjoy_2604.sy_role.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.sy_role.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.sy_role.restrict_perm IS '제한권한여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.sy_role.role_remark IS '비고';
COMMENT ON COLUMN shopjoy_2604.sy_role.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_role.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.sy_role.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_role.upd_date IS '수정일';
COMMENT ON COLUMN shopjoy_2604.sy_role.path_id IS '점(.) 구분 표시경로 (트리 빌드용)';

CREATE INDEX idx_sy_role_site ON shopjoy_2604.sy_role USING btree (site_id);
CREATE UNIQUE INDEX sy_role_role_code_key ON shopjoy_2604.sy_role USING btree (role_code);
