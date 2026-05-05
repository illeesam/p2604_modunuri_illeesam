-- sy_template 테이블 DDL
-- 발송 템플릿

CREATE TABLE shopjoy_2604.sy_template (
    template_id      VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id          VARCHAR(21) ,
    template_type_cd VARCHAR(20)  NOT NULL,
    template_code    VARCHAR(50)  NOT NULL,
    template_nm      VARCHAR(100) NOT NULL,
    template_subject VARCHAR(200),
    template_content TEXT         NOT NULL,
    sample_params    TEXT        ,
    use_yn           VARCHAR(1)   DEFAULT 'Y',
    reg_by           VARCHAR(30) ,
    reg_date         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(30) ,
    upd_date         TIMESTAMP   ,
    path_id          VARCHAR(21) 
);

COMMENT ON TABLE  shopjoy_2604.sy_template IS '발송 템플릿';
COMMENT ON COLUMN shopjoy_2604.sy_template.template_id IS '템플릿ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.sy_template.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.sy_template.template_type_cd IS '템플릿유형 (코드: TEMPLATE_TYPE)';
COMMENT ON COLUMN shopjoy_2604.sy_template.template_code IS '템플릿코드';
COMMENT ON COLUMN shopjoy_2604.sy_template.template_nm IS '템플릿명';
COMMENT ON COLUMN shopjoy_2604.sy_template.template_subject IS '제목 (이메일용)';
COMMENT ON COLUMN shopjoy_2604.sy_template.template_content IS '내용 (치환변수 포함)';
COMMENT ON COLUMN shopjoy_2604.sy_template.sample_params IS '치환변수 예시 (JSON)';
COMMENT ON COLUMN shopjoy_2604.sy_template.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.sy_template.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_template.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.sy_template.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_template.upd_date IS '수정일';
COMMENT ON COLUMN shopjoy_2604.sy_template.path_id IS '점(.) 구분 표시경로 (트리 빌드용)';

CREATE UNIQUE INDEX sy_template_template_type_cd_template_code_key ON shopjoy_2604.sy_template USING btree (template_type_cd, template_code);
