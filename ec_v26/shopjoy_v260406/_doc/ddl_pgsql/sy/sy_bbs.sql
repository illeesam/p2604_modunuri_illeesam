-- sy_bbs 테이블 DDL
-- 게시물

CREATE TABLE shopjoy_2604.sy_bbs (
    bbs_id        VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id       VARCHAR(21)  NOT NULL,
    bbm_id        VARCHAR(21)  NOT NULL,
    parent_bbs_id VARCHAR(21) ,
    member_id     VARCHAR(21) ,
    author_nm     VARCHAR(50) ,
    bbs_title     VARCHAR(200) NOT NULL,
    content_html  TEXT        ,
    attach_grp_id VARCHAR(21) ,
    view_count    INTEGER      DEFAULT 0,
    like_count    INTEGER      DEFAULT 0,
    comment_count INTEGER      DEFAULT 0,
    is_fixed      VARCHAR(1)   DEFAULT 'N'::bpchar,
    bbs_status_cd VARCHAR(20)  DEFAULT 'ACTIVE'::character varying,
    reg_by        VARCHAR(30) ,
    reg_date      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by        VARCHAR(30) ,
    upd_date      TIMESTAMP   ,
    path_id       VARCHAR(21) 
);

COMMENT ON TABLE  shopjoy_2604.sy_bbs IS '게시물';
COMMENT ON COLUMN shopjoy_2604.sy_bbs.bbs_id IS '게시물ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.sy_bbs.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.sy_bbs.bbm_id IS '게시판ID';
COMMENT ON COLUMN shopjoy_2604.sy_bbs.parent_bbs_id IS '부모게시물ID (답글)';
COMMENT ON COLUMN shopjoy_2604.sy_bbs.member_id IS '작성자 회원ID';
COMMENT ON COLUMN shopjoy_2604.sy_bbs.author_nm IS '작성자명';
COMMENT ON COLUMN shopjoy_2604.sy_bbs.bbs_title IS '제목';
COMMENT ON COLUMN shopjoy_2604.sy_bbs.content_html IS '내용 (HTML)';
COMMENT ON COLUMN shopjoy_2604.sy_bbs.attach_grp_id IS '첨부파일그룹ID';
COMMENT ON COLUMN shopjoy_2604.sy_bbs.view_count IS '조회수';
COMMENT ON COLUMN shopjoy_2604.sy_bbs.like_count IS '좋아요수';
COMMENT ON COLUMN shopjoy_2604.sy_bbs.comment_count IS '댓글수';
COMMENT ON COLUMN shopjoy_2604.sy_bbs.is_fixed IS '상단고정 Y/N';
COMMENT ON COLUMN shopjoy_2604.sy_bbs.bbs_status_cd IS '상태 (ACTIVE/DELETED/HIDDEN)';
COMMENT ON COLUMN shopjoy_2604.sy_bbs.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_bbs.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.sy_bbs.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_bbs.upd_date IS '수정일';
COMMENT ON COLUMN shopjoy_2604.sy_bbs.path_id IS '점(.) 구분 표시경로 (트리 빌드용)';

CREATE INDEX idx_sy_bbs_site ON shopjoy_2604.sy_bbs USING btree (site_id);
