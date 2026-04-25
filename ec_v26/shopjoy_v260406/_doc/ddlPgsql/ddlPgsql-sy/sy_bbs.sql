-- ============================================================
-- sy_bbs : 게시물
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE sy_bbs (
    bbs_id          VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    bbm_id          VARCHAR(21)     NOT NULL,
    parent_bbs_id   VARCHAR(21),                            -- 답글 시 부모글 ID
    member_id       VARCHAR(21),
    author_nm          VARCHAR(50),
    bbs_title       VARCHAR(200)    NOT NULL,
    content_html    TEXT,
    attach_grp_id   VARCHAR(21),
    view_count      INTEGER         DEFAULT 0,
    like_count      INTEGER         DEFAULT 0,
    comment_count   INTEGER         DEFAULT 0,
    is_fixed        CHAR(1)         DEFAULT 'N',
    bbs_status_cd   VARCHAR(20)     DEFAULT 'ACTIVE',       -- ACTIVE/DELETED/HIDDEN
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    disp_path       VARCHAR(200),                           -- 점(.) 구분 표시경로
    PRIMARY KEY (bbs_id)
);

COMMENT ON TABLE  sy_bbs                   IS '게시물';
COMMENT ON COLUMN sy_bbs.bbs_id            IS '게시물ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_bbs.site_id           IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_bbs.bbm_id            IS '게시판ID';
COMMENT ON COLUMN sy_bbs.parent_bbs_id     IS '부모게시물ID (답글)';
COMMENT ON COLUMN sy_bbs.member_id         IS '작성자 회원ID';
COMMENT ON COLUMN sy_bbs.author_nm            IS '작성자명';
COMMENT ON COLUMN sy_bbs.bbs_title         IS '제목';
COMMENT ON COLUMN sy_bbs.content_html      IS '내용 (HTML)';
COMMENT ON COLUMN sy_bbs.attach_grp_id     IS '첨부파일그룹ID';
COMMENT ON COLUMN sy_bbs.view_count        IS '조회수';
COMMENT ON COLUMN sy_bbs.like_count        IS '좋아요수';
COMMENT ON COLUMN sy_bbs.comment_count     IS '댓글수';
COMMENT ON COLUMN sy_bbs.is_fixed          IS '상단고정 Y/N';
COMMENT ON COLUMN sy_bbs.bbs_status_cd     IS '상태 (ACTIVE/DELETED/HIDDEN)';
COMMENT ON COLUMN sy_bbs.reg_by            IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_bbs.reg_date          IS '등록일';
COMMENT ON COLUMN sy_bbs.upd_by            IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_bbs.upd_date          IS '수정일';
COMMENT ON COLUMN sy_bbs.disp_path IS '점(.) 구분 표시경로 (트리 빌드용)';
