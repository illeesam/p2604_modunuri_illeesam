-- 블로그 태그
CREATE TABLE cm_bltn_tag (
    blog_tag_id     VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),
    blog_id         VARCHAR(16)     NOT NULL,              -- cm_bltn.
    tag_nm          VARCHAR(50)     NOT NULL,
    sort_ord        INTEGER         DEFAULT 0,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (blog_tag_id)
);

COMMENT ON TABLE cm_bltn_tag IS '블로그 태그';
COMMENT ON COLUMN cm_bltn_tag.blog_tag_idblog_tag_id IS '태그ID';
COMMENT ON COLUMN cm_bltn_tag.blog_tag_idsite_id    IS '사이트ID';
COMMENT ON COLUMN cm_bltn_tag.blog_tag_idblog_id    IS '블로그ID';
COMMENT ON COLUMN cm_bltn_tag.blog_tag_idtag_nm     IS '태그명';
COMMENT ON COLUMN cm_bltn_tag.blog_tag_idsort_ord   IS '정렬순서';
COMMENT ON COLUMN cm_bltn_tag.blog_tag_idreg_by     IS '등록자';
COMMENT ON COLUMN cm_bltn_tag.blog_tag_idreg_date   IS '등록일';
COMMENT ON COLUMN cm_bltn_tag.blog_tag_idupd_by     IS '수정자';
COMMENT ON COLUMN cm_bltn_tag.blog_tag_idupd_date   IS '수정일';

CREATE INDEX idx_cm_bltn_tag_blog ON cm_bltn_tag (blog_id);

-- 블로그 댓글
