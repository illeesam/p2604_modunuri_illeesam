-- sy_code_grp 테이블 DDL
-- 공통코드 그룹

CREATE TABLE shopjoy_2604.sy_code_grp (
    code_grp_id   VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id       VARCHAR(21) ,
    code_grp      VARCHAR(50)  NOT NULL,
    grp_nm        VARCHAR(100) NOT NULL,
    path_id       VARCHAR(21) ,
    code_grp_desc VARCHAR(300),
    use_yn        VARCHAR(1)   DEFAULT 'Y',
    reg_by        VARCHAR(30) ,
    reg_date      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by        VARCHAR(30) ,
    upd_date      TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.sy_code_grp IS '공통코드 그룹';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp.code_grp_id IS '코드그룹ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp.code_grp IS '코드그룹코드 (예: MEMBER_GRADE, UNIQUE with site_id)';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp.grp_nm IS '그룹명';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp.path_id IS '점(.) 구분 표시경로 (트리 빌드용)';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp.code_grp_desc IS '코드그룹설명';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_code_grp.upd_date IS '수정일';

CREATE INDEX idx_sy_code_grp_code ON shopjoy_2604.sy_code_grp USING btree (code_grp);
CREATE UNIQUE INDEX sy_code_grp_site_id_code_grp_key ON shopjoy_2604.sy_code_grp USING btree (site_id, code_grp);
