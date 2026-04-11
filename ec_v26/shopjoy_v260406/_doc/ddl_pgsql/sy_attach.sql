-- ============================================================
-- sy_attach_grp : 첨부파일 그룹 / sy_attach : 첨부파일
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================

-- 첨부파일 그룹
CREATE TABLE sy_attach_grp (
    attach_grp_id   VARCHAR(16)     NOT NULL,
    grp_name        VARCHAR(100),
    grp_code        VARCHAR(50),
    description     VARCHAR(300),
    max_count       SMALLINT        DEFAULT 10,
    max_size_mb     SMALLINT        DEFAULT 10,
    allow_ext       VARCHAR(200),                           -- 허용확장자 (콤마구분)
    ref_type        VARCHAR(50),                            -- NOTICE/BBS/PRODUCT/CONTACT
    ref_id          VARCHAR(16),
    status          VARCHAR(20)     DEFAULT 'ACTIVE',
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (attach_grp_id)
);

COMMENT ON TABLE  sy_attach_grp                IS '첨부파일 그룹';
COMMENT ON COLUMN sy_attach_grp.attach_grp_id  IS '첨부그룹ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_attach_grp.grp_name       IS '그룹명';
COMMENT ON COLUMN sy_attach_grp.grp_code       IS '그룹코드';
COMMENT ON COLUMN sy_attach_grp.description    IS '설명';
COMMENT ON COLUMN sy_attach_grp.max_count      IS '최대 파일수';
COMMENT ON COLUMN sy_attach_grp.max_size_mb    IS '파일당 최대크기(MB)';
COMMENT ON COLUMN sy_attach_grp.allow_ext      IS '허용 확장자 (콤마구분)';
COMMENT ON COLUMN sy_attach_grp.ref_type       IS '참조유형';
COMMENT ON COLUMN sy_attach_grp.ref_id         IS '참조ID';
COMMENT ON COLUMN sy_attach_grp.status         IS '상태';
COMMENT ON COLUMN sy_attach_grp.reg_date       IS '등록일';

-- 첨부파일
CREATE TABLE sy_attach (
    attach_id       VARCHAR(16)     NOT NULL,
    attach_grp_id   VARCHAR(16)     NOT NULL,
    file_name       VARCHAR(300)    NOT NULL,
    file_size       BIGINT          DEFAULT 0,              -- bytes
    file_ext        VARCHAR(20),
    mime_type       VARCHAR(100),
    stored_name     VARCHAR(300),                           -- 서버 저장 파일명
    url             VARCHAR(500),
    sort_ord        INTEGER         DEFAULT 0,
    memo            VARCHAR(300),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (attach_id)
);

COMMENT ON TABLE  sy_attach                  IS '첨부파일';
COMMENT ON COLUMN sy_attach.attach_id        IS '첨부파일ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_attach.attach_grp_id    IS '첨부그룹ID';
COMMENT ON COLUMN sy_attach.file_name        IS '원본파일명';
COMMENT ON COLUMN sy_attach.file_size        IS '파일크기(bytes)';
COMMENT ON COLUMN sy_attach.file_ext         IS '확장자';
COMMENT ON COLUMN sy_attach.mime_type        IS 'MIME 타입';
COMMENT ON COLUMN sy_attach.stored_name      IS '저장 파일명 (UUID)';
COMMENT ON COLUMN sy_attach.url              IS '접근 URL';
COMMENT ON COLUMN sy_attach.sort_ord         IS '정렬순서';
COMMENT ON COLUMN sy_attach.memo             IS '메모';
COMMENT ON COLUMN sy_attach.reg_date         IS '등록일';
