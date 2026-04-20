-- ============================================================
-- sy_bbm : 게시판 마스터 (게시판 설정)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE sy_bbm (
    bbm_id          VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    bbm_code        VARCHAR(50)     NOT NULL,
    bbm_nm          VARCHAR(100)    NOT NULL,
    disp_path       VARCHAR(200),                           -- 점(.) 구분 표시경로
    bbm_type_cd     VARCHAR(20)     DEFAULT 'NORMAL',       -- 코드: BBM_TYPE (NORMAL/FAQ/REVIEW/QNA)
    allow_comment   CHAR(1)         DEFAULT 'N',
    allow_attach    CHAR(1)         DEFAULT 'N',
    allow_like      CHAR(1)         DEFAULT 'N',
    content_type_cd VARCHAR(20)     DEFAULT 'TEXT',         -- 코드: BBM_CONTENT_TYPE (TEXT/HTML)
    scope_type_cd   VARCHAR(20)     DEFAULT 'ALL',          -- 코드: BBM_SCOPE_TYPE (ALL/MEMBER/ADMIN)
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    bbm_remark      VARCHAR(300),
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (bbm_id),
    UNIQUE (bbm_code)
);

COMMENT ON TABLE  sy_bbm                  IS '게시판 마스터';
COMMENT ON COLUMN sy_bbm.bbm_id           IS '게시판ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_bbm.site_id          IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_bbm.bbm_code         IS '게시판코드';
COMMENT ON COLUMN sy_bbm.bbm_nm           IS '게시판명';
COMMENT ON COLUMN sy_bbm.bbm_type_cd       IS '게시판유형 (코드: BBM_TYPE — NORMAL/FAQ/REVIEW/QNA)';
COMMENT ON COLUMN sy_bbm.allow_comment     IS '댓글허용 Y/N';
COMMENT ON COLUMN sy_bbm.allow_attach      IS '첨부허용 Y/N';
COMMENT ON COLUMN sy_bbm.allow_like        IS '좋아요허용 Y/N';
COMMENT ON COLUMN sy_bbm.content_type_cd   IS '내용유형 (코드: BBM_CONTENT_TYPE — TEXT/HTML)';
COMMENT ON COLUMN sy_bbm.scope_type_cd     IS '접근범위 (코드: BBM_SCOPE_TYPE — ALL/MEMBER/ADMIN)';
COMMENT ON COLUMN sy_bbm.sort_ord         IS '정렬순서';
COMMENT ON COLUMN sy_bbm.use_yn           IS '사용여부 Y/N';
COMMENT ON COLUMN sy_bbm.bbm_remark       IS '비고';
COMMENT ON COLUMN sy_bbm.reg_by           IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_bbm.reg_date         IS '등록일';
COMMENT ON COLUMN sy_bbm.upd_by           IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_bbm.upd_date         IS '수정일';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_bbm.bbm_type_cd (게시판유형) : BBM_TYPE { NORMAL:일반, NOTICE:공지, EVENT:이벤트, COOKIE:쿠키 }
-- [CODES] sy_bbm.content_type_cd (내용유형) : CONTENT_TYPE { TEXT:텍스트, HTML:HTML, IMAGE:이미지, VIDEO:동영상, MARKDOWN:마크다운 }
-- [CODES] sy_bbm.scope_type_cd (접근범위) : SCOPE_TYPE { ALL:전체, MEMBER:회원, ADMIN:관리자 }
