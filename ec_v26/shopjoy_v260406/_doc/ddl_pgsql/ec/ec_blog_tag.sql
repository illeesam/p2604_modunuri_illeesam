-- ============================================================
CREATE TABLE ec_blog (
    blog_id         VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    category_cd     VARCHAR(20),                            -- 코드: BLOG_CATEGORY (FASHION/LIFESTYLE/TREND/HOWTO)
    title           VARCHAR(200)    NOT NULL,
    excerpt         VARCHAR(500),                           -- 요약
    content_html    TEXT,                                   -- 본문 (HTML)
    thumb_url       VARCHAR(500),                           -- 썸네일URL
    author_id       VARCHAR(16),                            -- 작성자 (sy_user.user_id 또는 ec_member.member_id)
    author_nm       VARCHAR(50),                            -- 작성자명 (스냅샷)
    status_cd       VARCHAR(20)     DEFAULT 'DRAFT',        -- 코드: BLOG_STATUS (DRAFT/PUBLISHED/HIDDEN)
    publish_date    TIMESTAMP,                              -- 공개일시
    read_time       VARCHAR(20),                            -- 읽기 시간 (예: 5분)
    view_count      INTEGER         DEFAULT 0,
    comment_count   INTEGER         DEFAULT 0,
    sort_ord        INTEGER         DEFAULT 0,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (blog_id)
);

COMMENT ON TABLE  ec_blog                 IS '블로그 게시글';
COMMENT ON COLUMN ec_blog.blog_id         IS '블로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_blog.site_id         IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_blog.category_cd     IS '카테고리 (코드: BLOG_CATEGORY)';
COMMENT ON COLUMN ec_blog.title           IS '제목';
COMMENT ON COLUMN ec_blog.excerpt         IS '요약';
COMMENT ON COLUMN ec_blog.content_html    IS '본문 (HTML)';
COMMENT ON COLUMN ec_blog.thumb_url       IS '썸네일URL';
COMMENT ON COLUMN ec_blog.author_id       IS '작성자ID';
COMMENT ON COLUMN ec_blog.author_nm       IS '작성자명 (스냅샷)';
COMMENT ON COLUMN ec_blog.status_cd       IS '상태 (코드: BLOG_STATUS)';
COMMENT ON COLUMN ec_blog.publish_date    IS '공개일시';
COMMENT ON COLUMN ec_blog.read_time       IS '읽기 시간';
COMMENT ON COLUMN ec_blog.view_count      IS '조회수';
COMMENT ON COLUMN ec_blog.comment_count   IS '댓글수';
COMMENT ON COLUMN ec_blog.sort_ord        IS '정렬순서';
COMMENT ON COLUMN ec_blog.reg_by          IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_blog.reg_date        IS '등록일';
COMMENT ON COLUMN ec_blog.upd_by          IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN ec_blog.upd_date        IS '수정일';

CREATE INDEX idx_ec_blog_category ON ec_blog (category_cd, status_cd);
CREATE INDEX idx_ec_blog_date     ON ec_blog (publish_date);
CREATE INDEX idx_ec_blog_author   ON ec_blog (author_id);

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
