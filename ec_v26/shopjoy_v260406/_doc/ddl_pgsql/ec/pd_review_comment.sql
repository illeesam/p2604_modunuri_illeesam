-- pd_review_comment 테이블 DDL
-- 리뷰 댓글

CREATE TABLE shopjoy_2604.pd_review_comment (
    review_comment_id    VARCHAR(21) NOT NULL PRIMARY KEY,
    site_id              VARCHAR(21) NOT NULL,
    review_id            VARCHAR(21) NOT NULL,
    parent_reply_id      VARCHAR(21),
    writer_type_cd       VARCHAR(20) DEFAULT 'MEMBER'::character varying,
    writer_id            VARCHAR(21),
    writer_nm            VARCHAR(50),
    review_reply_content TEXT        NOT NULL,
    reply_status_cd      VARCHAR(20) DEFAULT 'ACTIVE'::character varying,
    reg_by               VARCHAR(30),
    reg_date             TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    upd_by               VARCHAR(30),
    upd_date             TIMESTAMP  
);

COMMENT ON TABLE  shopjoy_2604.pd_review_comment IS '리뷰 댓글';
COMMENT ON COLUMN shopjoy_2604.pd_review_comment.review_comment_id IS '댓글ID';
COMMENT ON COLUMN shopjoy_2604.pd_review_comment.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.pd_review_comment.review_id IS '리뷰ID (pd_review.)';
COMMENT ON COLUMN shopjoy_2604.pd_review_comment.parent_reply_id IS '상위댓글ID (대댓글)';
COMMENT ON COLUMN shopjoy_2604.pd_review_comment.writer_type_cd IS '작성자유형 (코드: REVIEW_WRITER_TYPE — MEMBER/SELLER/ADMIN)';
COMMENT ON COLUMN shopjoy_2604.pd_review_comment.writer_id IS '작성자ID';
COMMENT ON COLUMN shopjoy_2604.pd_review_comment.writer_nm IS '작성자명';
COMMENT ON COLUMN shopjoy_2604.pd_review_comment.review_reply_content IS '댓글 내용';
COMMENT ON COLUMN shopjoy_2604.pd_review_comment.reply_status_cd IS '상태 (ACTIVE/HIDDEN/DELETED)';
COMMENT ON COLUMN shopjoy_2604.pd_review_comment.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.pd_review_comment.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.pd_review_comment.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.pd_review_comment.upd_date IS '수정일';

CREATE INDEX idx_pd_review_comment_site ON shopjoy_2604.pd_review_comment USING btree (site_id);
