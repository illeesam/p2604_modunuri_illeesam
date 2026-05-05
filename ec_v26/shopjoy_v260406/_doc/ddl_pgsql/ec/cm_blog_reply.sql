-- cm_blog_reply 테이블 DDL
-- 블로그 댓글

CREATE TABLE shopjoy_2604.cm_blog_reply (
    comment_id               VARCHAR(21) NOT NULL PRIMARY KEY,
    site_id                  VARCHAR(21),
    blog_id                  VARCHAR(21) NOT NULL,
    parent_comment_id        VARCHAR(21),
    writer_id                VARCHAR(21),
    writer_nm                VARCHAR(50),
    blog_comment_content     TEXT        NOT NULL,
    comment_status_cd        VARCHAR(20) DEFAULT 'ACTIVE',
    comment_status_cd_before VARCHAR(20),
    reg_by                   VARCHAR(30),
    reg_date                 TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    upd_by                   VARCHAR(30),
    upd_date                 TIMESTAMP  
);

COMMENT ON TABLE  shopjoy_2604.cm_blog_reply IS '블로그 댓글';
COMMENT ON COLUMN shopjoy_2604.cm_blog_reply.comment_id IS '댓글ID';
COMMENT ON COLUMN shopjoy_2604.cm_blog_reply.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.cm_blog_reply.blog_id IS '블로그ID';
COMMENT ON COLUMN shopjoy_2604.cm_blog_reply.parent_comment_id IS '대댓글 부모ID';
COMMENT ON COLUMN shopjoy_2604.cm_blog_reply.writer_id IS '작성자ID';
COMMENT ON COLUMN shopjoy_2604.cm_blog_reply.writer_nm IS '작성자명';
COMMENT ON COLUMN shopjoy_2604.cm_blog_reply.blog_comment_content IS '댓글 내용';
COMMENT ON COLUMN shopjoy_2604.cm_blog_reply.comment_status_cd IS '상태 (코드: COMMENT_STATUS)';
COMMENT ON COLUMN shopjoy_2604.cm_blog_reply.comment_status_cd_before IS '변경 전 댓글상태 (코드: COMMENT_STATUS)';
COMMENT ON COLUMN shopjoy_2604.cm_blog_reply.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.cm_blog_reply.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.cm_blog_reply.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.cm_blog_reply.upd_date IS '수정일';

CREATE INDEX idx_cm_blog_reply_parent ON shopjoy_2604.cm_blog_reply USING btree (parent_comment_id);
CREATE INDEX idx_cm_bltn_reply_blog ON shopjoy_2604.cm_blog_reply USING btree (blog_id);
