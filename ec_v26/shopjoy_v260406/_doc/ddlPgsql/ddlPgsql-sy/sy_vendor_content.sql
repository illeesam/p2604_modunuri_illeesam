-- ============================================================
-- sy_vendor_content : 판매/배송업체 콘텐츠 (회사소개/배너/약관/정책 등)
--   업체별 노출 콘텐츠를 유형별로 다건 관리
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE sy_vendor_content (
    vendor_content_id VARCHAR(21)     NOT NULL,
    site_id           VARCHAR(21),                            -- sy_site.site_id
    vendor_id         VARCHAR(21)     NOT NULL,               -- sy_vendor.vendor_id
    content_type_cd   VARCHAR(30)     NOT NULL,               -- 코드: VENDOR_CONTENT_TYPE (INTRO/BANNER/TERMS/POLICY/NOTICE/FAQ/GUIDE)
    vendor_content_title VARCHAR(200),
    vendor_content_subtitle VARCHAR(300),
    content_html      TEXT,                                   -- 본문 (HTML)
    thumb_url         VARCHAR(500),                           -- 썸네일 이미지
    image_url         VARCHAR(500),                           -- 대표 이미지
    link_url          VARCHAR(500),                           -- 링크 URL
    attach_grp_id     VARCHAR(21),                            -- sy_attach_grp.attach_grp_id
    lang_cd           VARCHAR(10)     DEFAULT 'ko',           -- 다국어 (ko/en/ja 등)
    start_date        TIMESTAMP,                              -- 노출 시작
    end_date          TIMESTAMP,                              -- 노출 종료
    sort_ord          INTEGER         DEFAULT 0,
    vendor_content_status_cd VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: VENDOR_CONTENT_STATUS (DRAFT/ACTIVE/INACTIVE)
    use_yn            CHAR(1)         DEFAULT 'Y',
    view_count        INTEGER         DEFAULT 0,
    vendor_content_remark VARCHAR(500),
    reg_by            VARCHAR(30),
    reg_date          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by            VARCHAR(30),
    upd_date          TIMESTAMP,
    PRIMARY KEY (vendor_content_id)
);

COMMENT ON TABLE  sy_vendor_content                   IS '판매/배송업체 콘텐츠 (회사소개/배너/약관 등)';
COMMENT ON COLUMN sy_vendor_content.vendor_content_id IS '업체콘텐츠ID (PK)';
COMMENT ON COLUMN sy_vendor_content.site_id           IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_vendor_content.vendor_id         IS '업체ID (sy_vendor.vendor_id)';
COMMENT ON COLUMN sy_vendor_content.content_type_cd   IS '콘텐츠유형 (코드: VENDOR_CONTENT_TYPE)';
COMMENT ON COLUMN sy_vendor_content.vendor_content_title IS '제목';
COMMENT ON COLUMN sy_vendor_content.vendor_content_subtitle IS '부제';
COMMENT ON COLUMN sy_vendor_content.content_html      IS '본문 (HTML)';
COMMENT ON COLUMN sy_vendor_content.thumb_url         IS '썸네일 URL';
COMMENT ON COLUMN sy_vendor_content.image_url         IS '대표 이미지 URL';
COMMENT ON COLUMN sy_vendor_content.link_url          IS '링크 URL';
COMMENT ON COLUMN sy_vendor_content.attach_grp_id     IS '첨부파일그룹ID (sy_attach_grp.attach_grp_id)';
COMMENT ON COLUMN sy_vendor_content.lang_cd           IS '언어코드 (ko/en/ja)';
COMMENT ON COLUMN sy_vendor_content.start_date        IS '노출 시작일시';
COMMENT ON COLUMN sy_vendor_content.end_date          IS '노출 종료일시';
COMMENT ON COLUMN sy_vendor_content.sort_ord          IS '정렬순서';
COMMENT ON COLUMN sy_vendor_content.vendor_content_status_cd IS '상태 (코드: VENDOR_CONTENT_STATUS)';
COMMENT ON COLUMN sy_vendor_content.use_yn            IS '사용여부 Y/N';
COMMENT ON COLUMN sy_vendor_content.view_count        IS '조회수';
COMMENT ON COLUMN sy_vendor_content.vendor_content_remark IS '비고';
COMMENT ON COLUMN sy_vendor_content.reg_by            IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_vendor_content.reg_date          IS '등록일';
COMMENT ON COLUMN sy_vendor_content.upd_by            IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_vendor_content.upd_date          IS '수정일';

CREATE INDEX idx_sy_vendor_content_vendor ON sy_vendor_content (vendor_id);
CREATE INDEX idx_sy_vendor_content_type   ON sy_vendor_content (content_type_cd);
CREATE INDEX idx_sy_vendor_content_status ON sy_vendor_content (vendor_content_status_cd);
CREATE INDEX idx_sy_vendor_content_date   ON sy_vendor_content (start_date, end_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_vendor_content.content_type_cd (콘텐츠유형) : VENDOR_CONTENT_TYPE { INTRO:소개, POLICY:정책, NOTICE:공지 }
-- [CODES] sy_vendor_content.vendor_content_status_cd (상태) : VENDOR_CONTENT_STATUS { DRAFT:초안, ACTIVE:활성, INACTIVE:비활성 }
