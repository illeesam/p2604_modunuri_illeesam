CREATE TABLE ec_blog_comment (
    comment_id      VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),
    blog_id         VARCHAR(16)     NOT NULL,              -- ec_blog.blog_id
    parent_comment_id VARCHAR(16),                          -- 대댓글 (ec_blog_comment.comment_id)
    writer_id       VARCHAR(16),                            -- 작성자ID (ec_member.member_id)
    writer_nm       VARCHAR(50),                            -- 작성자명 (스냅샷)
    blog_comment_content TEXT            NOT NULL,
    comment_status_cd VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: COMMENT_STATUS (ACTIVE/HIDDEN/DELETED)
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (comment_id)
);

COMMENT ON TABLE  ec_blog_comment              IS '블로그 댓글';
COMMENT ON COLUMN ec_blog_comment.comment_id   IS '댓글ID';
COMMENT ON COLUMN ec_blog_comment.site_id      IS '사이트ID';
COMMENT ON COLUMN ec_blog_comment.blog_id      IS '블로그ID';
COMMENT ON COLUMN ec_blog_comment.parent_comment_id IS '대댓글 부모ID';
COMMENT ON COLUMN ec_blog_comment.writer_id    IS '작성자ID';
COMMENT ON COLUMN ec_blog_comment.writer_nm    IS '작성자명';
COMMENT ON COLUMN ec_blog_comment.blog_comment_content IS '댓글 내용';
COMMENT ON COLUMN ec_blog_comment.comment_status_cd IS '상태 (코드: COMMENT_STATUS)';
COMMENT ON COLUMN ec_blog_comment.reg_by       IS '등록자';
COMMENT ON COLUMN ec_blog_comment.reg_date     IS '등록일';
COMMENT ON COLUMN ec_blog_comment.upd_by       IS '수정자';
COMMENT ON COLUMN ec_blog_comment.upd_date     IS '수정일';

CREATE INDEX idx_ec_blog_comment_blog   ON ec_blog_comment (blog_id);
CREATE INDEX idx_ec_blog_comment_parent ON ec_blog_comment (parent_comment_id);
