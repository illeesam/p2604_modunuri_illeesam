-- 첨부파일
CREATE TABLE sy_attach (
    attach_id       VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    attach_grp_id   VARCHAR(16)     NOT NULL,
    file_nm         VARCHAR(300)    NOT NULL,
    file_size       BIGINT          DEFAULT 0,              -- bytes
    file_ext        VARCHAR(20),
    mime_type       VARCHAR(100),
    stored_nm       VARCHAR(300),                           -- 서버 저장 파일명
    url             VARCHAR(500),
    sort_ord        INTEGER         DEFAULT 0,
    memo            VARCHAR(300),
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (attach_id)
);

COMMENT ON TABLE  sy_attach                  IS '첨부파일';
COMMENT ON COLUMN sy_attach.attach_id        IS '첨부파일ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_attach.site_id          IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_attach.attach_grp_id    IS '첨부그룹ID';
COMMENT ON COLUMN sy_attach.file_nm          IS '원본파일명';
COMMENT ON COLUMN sy_attach.file_size        IS '파일크기(bytes)';
COMMENT ON COLUMN sy_attach.file_ext         IS '확장자';
COMMENT ON COLUMN sy_attach.mime_type        IS 'MIME 타입';
COMMENT ON COLUMN sy_attach.stored_nm        IS '저장 파일명 (UUID)';
COMMENT ON COLUMN sy_attach.url              IS '접근 URL';
COMMENT ON COLUMN sy_attach.sort_ord         IS '정렬순서';
COMMENT ON COLUMN sy_attach.memo             IS '메모';
COMMENT ON COLUMN sy_attach.reg_by           IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN sy_attach.reg_date         IS '등록일';
COMMENT ON COLUMN sy_attach.upd_by           IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN sy_attach.upd_date         IS '수정일';
