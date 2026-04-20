-- 블로그 태그
CREATE TABLE cm_bltn_tag (
    blog_tag_id     VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),
    blog_id         VARCHAR(21)     NOT NULL,              -- cm_bltn.
    tag_nm          VARCHAR(50)     NOT NULL,
    sort_ord        INTEGER         DEFAULT 0,
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (blog_tag_id)
);

COMMENT ON TABLE cm_bltn_tag IS '블로그 태그';
COMMENT ON COLUMN cm_bltn_tag.blog_tag_id IS '태그ID';
COMMENT ON COLUMN cm_bltn_tag.site_id    IS '사이트ID';
COMMENT ON COLUMN cm_bltn_tag.blog_id    IS '블로그ID';
COMMENT ON COLUMN cm_bltn_tag.tag_nm     IS '태그명';
COMMENT ON COLUMN cm_bltn_tag.sort_ord   IS '정렬순서';
COMMENT ON COLUMN cm_bltn_tag.reg_by     IS '등록자';
COMMENT ON COLUMN cm_bltn_tag.reg_date   IS '등록일';
COMMENT ON COLUMN cm_bltn_tag.upd_by     IS '수정자';
COMMENT ON COLUMN cm_bltn_tag.upd_date   IS '수정일';

CREATE INDEX idx_cm_bltn_tag_blog ON cm_bltn_tag (blog_id);

-- 블로그 댓글
