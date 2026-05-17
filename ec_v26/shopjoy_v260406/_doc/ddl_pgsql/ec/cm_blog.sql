-- cm_blog 테이블 DDL
-- 블로그 게시글

CREATE TABLE shopjoy_2604.cm_blog (
    blog_id      VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id      VARCHAR(21)  NOT NULL,
    blog_cate_id VARCHAR(21) ,
    blog_title   VARCHAR(200) NOT NULL,
    blog_summary VARCHAR(500),
    blog_content TEXT         NOT NULL,
    blog_author  VARCHAR(100),
    prod_id      VARCHAR(21) ,
    view_count   INTEGER      DEFAULT 0,
    use_yn       VARCHAR(1)   DEFAULT 'Y'::bpchar,
    is_notice    VARCHAR(1)   DEFAULT 'N'::bpchar,
    reg_by       VARCHAR(30) ,
    reg_date     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by       VARCHAR(30) ,
    upd_date     TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.cm_blog IS '블로그 게시글';
COMMENT ON COLUMN shopjoy_2604.cm_blog.blog_id IS '블로그ID';
COMMENT ON COLUMN shopjoy_2604.cm_blog.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.cm_blog.blog_cate_id IS '블로그카테고리ID (cm_bltn_cate.blog_cate_id)';
COMMENT ON COLUMN shopjoy_2604.cm_blog.blog_title IS '제목';
COMMENT ON COLUMN shopjoy_2604.cm_blog.blog_summary IS '요약 (미리보기, 검색결과용)';
COMMENT ON COLUMN shopjoy_2604.cm_blog.blog_content IS '본문 (HTML 에디터)';
COMMENT ON COLUMN shopjoy_2604.cm_blog.blog_author IS '작성자 이름';
COMMENT ON COLUMN shopjoy_2604.cm_blog.prod_id IS '상품ID (pd_prod.prod_id, 상품 관련 글일 때만)';
COMMENT ON COLUMN shopjoy_2604.cm_blog.view_count IS '조회수';
COMMENT ON COLUMN shopjoy_2604.cm_blog.use_yn IS '공개여부 Y/N (비공개 글)';
COMMENT ON COLUMN shopjoy_2604.cm_blog.is_notice IS '공지글 여부 Y/N (상단 고정)';
COMMENT ON COLUMN shopjoy_2604.cm_blog.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.cm_blog.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.cm_blog.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.cm_blog.upd_date IS '수정일';

CREATE INDEX idx_cm_blog_cate ON shopjoy_2604.cm_blog USING btree (blog_cate_id);
CREATE INDEX idx_cm_blog_date ON shopjoy_2604.cm_blog USING btree (reg_date DESC);
CREATE INDEX idx_cm_blog_prod ON shopjoy_2604.cm_blog USING btree (prod_id);
CREATE INDEX idx_cm_blog_site ON shopjoy_2604.cm_blog USING btree (site_id);
