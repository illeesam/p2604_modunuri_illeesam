-- ============================================================
-- sy_bbm : 게시판 마스터 (게시판 설정)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE sy_bbm (
    bbm_id          VARCHAR(16)     NOT NULL,
    bbm_code        VARCHAR(50)     NOT NULL,
    bbm_name        VARCHAR(100)    NOT NULL,
    bbm_type        VARCHAR(20)     DEFAULT 'NORMAL',       -- NORMAL/FAQ/REVIEW/QNA
    allow_comment   CHAR(1)         DEFAULT 'N',
    allow_attach    CHAR(1)         DEFAULT 'N',
    allow_like      CHAR(1)         DEFAULT 'N',
    content_type    VARCHAR(20)     DEFAULT 'TEXT',         -- TEXT/HTML
    scope_type      VARCHAR(20)     DEFAULT 'ALL',          -- ALL/MEMBER/ADMIN
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    remark          VARCHAR(300),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_date        TIMESTAMP,
    PRIMARY KEY (bbm_id),
    UNIQUE (bbm_code)
);

COMMENT ON TABLE  sy_bbm                  IS '게시판 마스터';
COMMENT ON COLUMN sy_bbm.bbm_id           IS '게시판ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_bbm.bbm_code         IS '게시판코드';
COMMENT ON COLUMN sy_bbm.bbm_name         IS '게시판명';
COMMENT ON COLUMN sy_bbm.bbm_type         IS '게시판유형 (NORMAL/FAQ/REVIEW/QNA)';
COMMENT ON COLUMN sy_bbm.allow_comment    IS '댓글허용 Y/N';
COMMENT ON COLUMN sy_bbm.allow_attach     IS '첨부허용 Y/N';
COMMENT ON COLUMN sy_bbm.allow_like       IS '좋아요허용 Y/N';
COMMENT ON COLUMN sy_bbm.content_type     IS '내용유형 (TEXT/HTML)';
COMMENT ON COLUMN sy_bbm.scope_type       IS '접근범위 (ALL/MEMBER/ADMIN)';
COMMENT ON COLUMN sy_bbm.sort_ord         IS '정렬순서';
COMMENT ON COLUMN sy_bbm.use_yn           IS '사용여부 Y/N';
COMMENT ON COLUMN sy_bbm.remark           IS '비고';
COMMENT ON COLUMN sy_bbm.reg_date         IS '등록일';
COMMENT ON COLUMN sy_bbm.upd_date         IS '수정일';
