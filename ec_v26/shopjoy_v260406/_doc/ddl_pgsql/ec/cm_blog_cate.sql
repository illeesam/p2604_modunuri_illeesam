-- cm_blog_cate 테이블 DDL
-- 블로그 카테고리

CREATE TABLE shopjoy_2604.cm_blog_cate (
    blog_cate_id        VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id             VARCHAR(21)  NOT NULL,
    blog_cate_nm        VARCHAR(100) NOT NULL,
    parent_blog_cate_id VARCHAR(21) ,
    sort_ord            INTEGER      DEFAULT 0,
    use_yn              VARCHAR(1)   DEFAULT 'Y'::bpchar,
    reg_by              VARCHAR(30) ,
    reg_date            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30) ,
    upd_date            TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.cm_blog_cate IS '블로그 카테고리';
COMMENT ON COLUMN shopjoy_2604.cm_blog_cate.blog_cate_id IS '블로그카테고리ID';
COMMENT ON COLUMN shopjoy_2604.cm_blog_cate.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.cm_blog_cate.blog_cate_nm IS '카테고리명';
COMMENT ON COLUMN shopjoy_2604.cm_blog_cate.parent_blog_cate_id IS '상위 카테고리ID (NULL이면 최상위)';
COMMENT ON COLUMN shopjoy_2604.cm_blog_cate.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.cm_blog_cate.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.cm_blog_cate.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.cm_blog_cate.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.cm_blog_cate.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.cm_blog_cate.upd_date IS '수정일';

CREATE INDEX idx_cm_blog_cate_site ON shopjoy_2604.cm_blog_cate USING btree (site_id);
