-- ============================================================
-- ec_blog_like : 블로그 좋아요
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================

CREATE TABLE ec_blog_like (
    like_id         VARCHAR(16)     NOT NULL,
    blog_id         VARCHAR(16)     NOT NULL,              -- FK: ec_blog.blog_id
    user_id         VARCHAR(16)     NOT NULL,              -- FK: sy_member.user_id (회원만 가능)
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (like_id),
    UNIQUE (blog_id, user_id)                              -- 중복 방지
);

COMMENT ON TABLE  ec_blog_like       IS '블로그 좋아요';
COMMENT ON COLUMN ec_blog_like.like_id IS '좋아요ID';
COMMENT ON COLUMN ec_blog_like.blog_id IS '블로그ID (ec_blog.blog_id)';
COMMENT ON COLUMN ec_blog_like.user_id IS '사용자ID (sy_member.user_id)';
COMMENT ON COLUMN ec_blog_like.reg_date IS '등록일';

CREATE INDEX idx_ec_blog_like_blog ON ec_blog_like (blog_id);
CREATE INDEX idx_ec_blog_like_user ON ec_blog_like (user_id);
