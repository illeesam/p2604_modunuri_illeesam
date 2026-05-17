-- cm_blog_tag 테이블 DDL
-- 블로그 태그

CREATE TABLE shopjoy_2604.cm_blog_tag (
    blog_tag_id VARCHAR(21) NOT NULL PRIMARY KEY,
    site_id     VARCHAR(21) NOT NULL,
    blog_id     VARCHAR(21) NOT NULL,
    tag_nm      VARCHAR(50) NOT NULL,
    sort_ord    INTEGER     DEFAULT 0,
    reg_by      VARCHAR(30),
    reg_date    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    upd_by      VARCHAR(30),
    upd_date    TIMESTAMP  
);

COMMENT ON TABLE  shopjoy_2604.cm_blog_tag IS '블로그 태그';
COMMENT ON COLUMN shopjoy_2604.cm_blog_tag.blog_tag_id IS '태그ID';
COMMENT ON COLUMN shopjoy_2604.cm_blog_tag.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.cm_blog_tag.blog_id IS '블로그ID';
COMMENT ON COLUMN shopjoy_2604.cm_blog_tag.tag_nm IS '태그명';
COMMENT ON COLUMN shopjoy_2604.cm_blog_tag.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.cm_blog_tag.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_blog_tag.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.cm_blog_tag.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_blog_tag.upd_date IS '수정일';

CREATE INDEX idx_cm_blog_tag_site ON shopjoy_2604.cm_blog_tag USING btree (site_id);
CREATE INDEX idx_cm_bltn_tag_blog ON shopjoy_2604.cm_blog_tag USING btree (blog_id);
