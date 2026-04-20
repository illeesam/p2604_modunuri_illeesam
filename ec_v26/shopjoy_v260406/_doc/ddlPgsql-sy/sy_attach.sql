-- 첨부파일
CREATE TABLE sy_attach (
    attach_id       VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    attach_grp_id   VARCHAR(21)     NOT NULL,
    file_nm         VARCHAR(300)    NOT NULL,
    file_size       BIGINT          DEFAULT 0,              -- bytes
    file_ext        VARCHAR(20),
    mime_type_cd    VARCHAR(100),
    stored_nm       VARCHAR(300),                           -- 서버 저장 파일명
    attach_url      VARCHAR(500),                           -- 기본 저장소 접근 URL
    cdn_host        VARCHAR(100),                           -- CDN 호스트 (예: cdn.example.com)
    cdn_img_url     VARCHAR(500),                           -- CDN 원본 이미지 URL (없으면 attach_url 사용)
    cdn_thumb_url   VARCHAR(500),                           -- CDN 썸네일 URL (이미지 파일용)
    sort_ord        INTEGER         DEFAULT 0,
    attach_memo     VARCHAR(300),
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
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
COMMENT ON COLUMN sy_attach.mime_type_cd     IS 'MIME 타입 (코드: MIME_TYPE)';
COMMENT ON COLUMN sy_attach.stored_nm        IS '저장 파일명 (UUID)';
COMMENT ON COLUMN sy_attach.attach_url       IS '기본 저장소 접근 URL';
COMMENT ON COLUMN sy_attach.cdn_host         IS 'CDN 호스트명 (예: cdn.example.com)';
COMMENT ON COLUMN sy_attach.cdn_img_url      IS 'CDN 원본 이미지 URL (NULL이면 attach_url 사용)';
COMMENT ON COLUMN sy_attach.cdn_thumb_url    IS 'CDN 썸네일 URL (이미지 파일, 목록/검색용)';
COMMENT ON COLUMN sy_attach.sort_ord         IS '정렬순서';
COMMENT ON COLUMN sy_attach.attach_memo      IS '메모';
COMMENT ON COLUMN sy_attach.reg_by           IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_attach.reg_date         IS '등록일';
COMMENT ON COLUMN sy_attach.upd_by           IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_attach.upd_date         IS '수정일';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_attach.mime_type_cd (MIME 타입) : MIME_TYPE { IMAGE:이미지, VIDEO:동영상, DOCUMENT:문서, TEXT:텍스트, APPLICATION:응용프로그램 }
