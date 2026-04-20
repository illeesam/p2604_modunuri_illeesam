CREATE TABLE cm_bltn_reply (
    comment_id      VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),
    blog_id         VARCHAR(21)     NOT NULL,              -- cm_bltn.
    parent_comment_id VARCHAR(21),                          -- 대댓글 (cm_bltn_reply.blog_comment_id)
    writer_id       VARCHAR(21),                            -- 작성자ID (mb_member.member_id)
    writer_nm       VARCHAR(50),                            -- 작성자명 (스냅샷)
    blog_comment_content TEXT            NOT NULL,
    comment_status_cd VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: COMMENT_STATUS (ACTIVE/HIDDEN/DELETED)
    comment_status_cd_before VARCHAR(20),                    -- 변경 전 댓글상태
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (comment_id)
);

COMMENT ON TABLE cm_bltn_reply IS '블로그 댓글';
COMMENT ON COLUMN cm_bltn_reply.comment_id   IS '댓글ID';
COMMENT ON COLUMN cm_bltn_reply.site_id      IS '사이트ID';
COMMENT ON COLUMN cm_bltn_reply.blog_id      IS '블로그ID';
COMMENT ON COLUMN cm_bltn_reply.parent_comment_id IS '대댓글 부모ID';
COMMENT ON COLUMN cm_bltn_reply.writer_id    IS '작성자ID';
COMMENT ON COLUMN cm_bltn_reply.writer_nm    IS '작성자명';
COMMENT ON COLUMN cm_bltn_reply.blog_comment_content IS '댓글 내용';
COMMENT ON COLUMN cm_bltn_reply.comment_status_cd IS '상태 (코드: COMMENT_STATUS)';
COMMENT ON COLUMN cm_bltn_reply.comment_status_cd_before IS '변경 전 댓글상태 (코드: COMMENT_STATUS)';
COMMENT ON COLUMN cm_bltn_reply.reg_by       IS '등록자';
COMMENT ON COLUMN cm_bltn_reply.reg_date     IS '등록일';
COMMENT ON COLUMN cm_bltn_reply.upd_by       IS '수정자';
COMMENT ON COLUMN cm_bltn_reply.upd_date     IS '수정일';

CREATE INDEX idx_cm_bltn_reply_blog   ON cm_bltn_reply (blog_id);
CREATE INDEX idx_cm_bltn_reply_parent ON cm_bltn_reply (parent_comment_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] cm_bltn_reply.comment_status_cd (상태) : BBS_STATUS { ACTIVE:활성, HIDDEN:숨김, DELETED:삭제 }
