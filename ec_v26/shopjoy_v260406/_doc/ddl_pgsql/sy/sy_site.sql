-- sy_site 테이블 DDL
-- 사이트

CREATE TABLE shopjoy_2604.sy_site (
    site_id          VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_code        VARCHAR(50)  NOT NULL,
    site_type_cd     VARCHAR(20) ,
    site_nm          VARCHAR(100) NOT NULL,
    site_domain      VARCHAR(200),
    logo_url         VARCHAR(500),
    favicon_url      VARCHAR(500),
    site_desc        TEXT        ,
    site_email       VARCHAR(100),
    site_phone       VARCHAR(20) ,
    site_zip_code    VARCHAR(10) ,
    site_address     VARCHAR(300),
    site_business_no VARCHAR(20) ,
    site_ceo         VARCHAR(50) ,
    site_status_cd   VARCHAR(20)  DEFAULT 'ACTIVE',
    config_json      TEXT        ,
    reg_by           VARCHAR(30) ,
    reg_date         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(30) ,
    upd_date         TIMESTAMP   ,
    path_id          VARCHAR(21) 
);

COMMENT ON TABLE  shopjoy_2604.sy_site IS '사이트';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_id IS '사이트ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_code IS '사이트코드';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_type_cd IS '사이트유형 (코드: SITE_TYPE — EC/ADMIN/API)';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_nm IS '사이트명';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_domain IS '도메인';
COMMENT ON COLUMN shopjoy_2604.sy_site.logo_url IS '로고URL';
COMMENT ON COLUMN shopjoy_2604.sy_site.favicon_url IS '파비콘URL';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_desc IS '사이트설명';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_email IS '대표이메일';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_phone IS '대표전화';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_zip_code IS '우편번호';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_address IS '주소';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_business_no IS '사업자번호';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_ceo IS '대표자명';
COMMENT ON COLUMN shopjoy_2604.sy_site.site_status_cd IS '상태 (코드: SITE_STATUS)';
COMMENT ON COLUMN shopjoy_2604.sy_site.config_json IS '확장설정 (JSON)';
COMMENT ON COLUMN shopjoy_2604.sy_site.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_site.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.sy_site.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_site.upd_date IS '수정일';
COMMENT ON COLUMN shopjoy_2604.sy_site.path_id IS '점(.) 구분 표시경로 (트리 빌드용)';

CREATE UNIQUE INDEX sy_site_site_code_key ON shopjoy_2604.sy_site USING btree (site_code);
