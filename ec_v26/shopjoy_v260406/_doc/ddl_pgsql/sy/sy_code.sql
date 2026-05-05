-- sy_code 테이블 DDL
-- 공통코드

CREATE TABLE shopjoy_2604.sy_code (
    code_id           VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id           VARCHAR(21) ,
    code_grp          VARCHAR(50)  NOT NULL,
    code_value        VARCHAR(50)  NOT NULL,
    code_label        VARCHAR(100) NOT NULL,
    sort_ord          INTEGER      DEFAULT 0,
    use_yn            VARCHAR(1)   DEFAULT 'Y',
    parent_code_value VARCHAR(50) ,
    child_code_values VARCHAR(500),
    code_remark       VARCHAR(300),
    reg_by            VARCHAR(30) ,
    reg_date          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by            VARCHAR(30) ,
    upd_date          TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.sy_code IS '공통코드';
COMMENT ON COLUMN shopjoy_2604.sy_code.code_id IS '코드ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.sy_code.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.sy_code.code_grp IS '코드그룹 (sy_code_grp.code_grp)';
COMMENT ON COLUMN shopjoy_2604.sy_code.code_value IS '코드값 (저장값)';
COMMENT ON COLUMN shopjoy_2604.sy_code.code_label IS '코드라벨 (표시명)';
COMMENT ON COLUMN shopjoy_2604.sy_code.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.sy_code.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.sy_code.parent_code_value IS '부모 코드값 (트리 구조 시 상위 code_value, null이면 루트)';
COMMENT ON COLUMN shopjoy_2604.sy_code.child_code_values IS '허용 자식/전이 코드값 목록 (^VAL1^VAL2^ 형식 — 상태 전이 제약이나 하위 코드 목록)';
COMMENT ON COLUMN shopjoy_2604.sy_code.code_remark IS '비고';
COMMENT ON COLUMN shopjoy_2604.sy_code.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_code.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.sy_code.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_code.upd_date IS '수정일';

CREATE INDEX idx_sy_code_grp ON shopjoy_2604.sy_code USING btree (code_grp);
CREATE UNIQUE INDEX idx_sy_code_grp_value ON shopjoy_2604.sy_code USING btree (code_grp, code_value);
CREATE INDEX idx_sy_code_use ON shopjoy_2604.sy_code USING btree (code_grp, use_yn);
CREATE UNIQUE INDEX sy_code_code_grp_code_value_key ON shopjoy_2604.sy_code USING btree (code_grp, code_value);
