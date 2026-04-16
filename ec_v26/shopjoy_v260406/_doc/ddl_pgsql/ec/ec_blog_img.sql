-- ============================================================
-- ec_blog_img : 블로그 이미지
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================

CREATE TABLE ec_blog_img (
    blog_img_id     VARCHAR(16)     NOT NULL,
    blog_id         VARCHAR(16)     NOT NULL,              -- FK: ec_blog.blog_id
    img_url         VARCHAR(500)    NOT NULL,              -- 원본 이미지 URL
    thumb_url       VARCHAR(500),                           -- 썸네일 이미지 URL
    img_alt_text    VARCHAR(200),                           -- 대체텍스트
    sort_ord        INTEGER         DEFAULT 0,              -- 정렬순서
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (blog_img_id)
);

COMMENT ON TABLE  ec_blog_img           IS '블로그 이미지';
COMMENT ON COLUMN ec_blog_img.blog_img_id IS '블로그이미지ID';
COMMENT ON COLUMN ec_blog_img.blog_id     IS '블로그ID (ec_blog.blog_id)';
COMMENT ON COLUMN ec_blog_img.img_url     IS '원본 이미지 URL';
COMMENT ON COLUMN ec_blog_img.thumb_url   IS '썸네일 이미지 URL';
COMMENT ON COLUMN ec_blog_img.img_alt_text IS '이미지 대체텍스트';
COMMENT ON COLUMN ec_blog_img.sort_ord    IS '정렬순서';
COMMENT ON COLUMN ec_blog_img.reg_by      IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN ec_blog_img.reg_date    IS '등록일';

CREATE INDEX idx_ec_blog_img_blog ON ec_blog_img (blog_id);
