-- sy_dept 테이블 DDL
-- 부서

CREATE TABLE shopjoy_2604.sy_dept (
    dept_id        VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id        VARCHAR(21)  NOT NULL,
    dept_code      VARCHAR(50)  NOT NULL,
    dept_nm        VARCHAR(100) NOT NULL,
    parent_dept_id VARCHAR(21) ,
    dept_type_cd   VARCHAR(20) ,
    manager_id     VARCHAR(21) ,
    sort_ord       INTEGER      DEFAULT 0,
    use_yn         VARCHAR(1)   DEFAULT 'Y'::bpchar,
    dept_remark    VARCHAR(300),
    reg_by         VARCHAR(30) ,
    reg_date       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by         VARCHAR(30) ,
    upd_date       TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.sy_dept IS '부서';
COMMENT ON COLUMN shopjoy_2604.sy_dept.dept_id IS '부서ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.sy_dept.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.sy_dept.dept_code IS '부서코드';
COMMENT ON COLUMN shopjoy_2604.sy_dept.dept_nm IS '부서명';
COMMENT ON COLUMN shopjoy_2604.sy_dept.parent_dept_id IS '상위부서ID';
COMMENT ON COLUMN shopjoy_2604.sy_dept.dept_type_cd IS '부서유형 (코드: DEPT_TYPE)';
COMMENT ON COLUMN shopjoy_2604.sy_dept.manager_id IS '부서장 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.sy_dept.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.sy_dept.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.sy_dept.dept_remark IS '비고';
COMMENT ON COLUMN shopjoy_2604.sy_dept.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_dept.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.sy_dept.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_dept.upd_date IS '수정일';

CREATE INDEX idx_sy_dept_site ON shopjoy_2604.sy_dept USING btree (site_id);
CREATE UNIQUE INDEX sy_dept_dept_code_key ON shopjoy_2604.sy_dept USING btree (dept_code);
