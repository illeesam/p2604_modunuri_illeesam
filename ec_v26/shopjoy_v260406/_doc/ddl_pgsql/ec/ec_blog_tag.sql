-- 블로그 태그
CREATE TABLE ec_blog_tag (
    blog_tag_id     VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),
    blog_id         VARCHAR(16)     NOT NULL,              -- ec_blog.blog_id
    tag_nm          VARCHAR(50)     NOT NULL,
    sort_ord        INTEGER         DEFAULT 0,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (blog_tag_id)
);

COMMENT ON TABLE  ec_blog_tag            IS '블로그 태그';
COMMENT ON COLUMN ec_blog_tag.blog_tag_id IS '태그ID';
COMMENT ON COLUMN ec_blog_tag.site_id    IS '사이트ID';
COMMENT ON COLUMN ec_blog_tag.blog_id    IS '블로그ID';
COMMENT ON COLUMN ec_blog_tag.tag_nm     IS '태그명';
COMMENT ON COLUMN ec_blog_tag.sort_ord   IS '정렬순서';
COMMENT ON COLUMN ec_blog_tag.reg_by     IS '등록자';
COMMENT ON COLUMN ec_blog_tag.reg_date   IS '등록일';
COMMENT ON COLUMN ec_blog_tag.upd_by     IS '수정자';
COMMENT ON COLUMN ec_blog_tag.upd_date   IS '수정일';

CREATE INDEX idx_ec_blog_tag_blog ON ec_blog_tag (blog_id);

-- 블로그 댓글
