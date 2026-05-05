-- sy_vendor_content 테이블 DDL
-- 판매/배송업체 콘텐츠 (회사소개/배너/약관 등)

CREATE TABLE shopjoy_2604.sy_vendor_content (
    vendor_content_id        VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id                  VARCHAR(21) ,
    vendor_id                VARCHAR(21)  NOT NULL,
    content_type_cd          VARCHAR(30)  NOT NULL,
    vendor_content_title     VARCHAR(200),
    vendor_content_subtitle  VARCHAR(300),
    content_html             TEXT        ,
    thumb_url                VARCHAR(500),
    image_url                VARCHAR(500),
    link_url                 VARCHAR(500),
    attach_grp_id            VARCHAR(21) ,
    lang_cd                  VARCHAR(10)  DEFAULT 'ko',
    start_date               TIMESTAMP   ,
    end_date                 TIMESTAMP   ,
    sort_ord                 INTEGER      DEFAULT 0,
    vendor_content_status_cd VARCHAR(20)  DEFAULT 'ACTIVE',
    use_yn                   VARCHAR(1)   DEFAULT 'Y',
    view_count               INTEGER      DEFAULT 0,
    vendor_content_remark    VARCHAR(500),
    reg_by                   VARCHAR(30) ,
    reg_date                 TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by                   VARCHAR(30) ,
    upd_date                 TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.sy_vendor_content IS '판매/배송업체 콘텐츠 (회사소개/배너/약관 등)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_content.vendor_content_id IS '업체콘텐츠ID (PK)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_content.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_content.vendor_id IS '업체ID (sy_vendor.vendor_id)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_content.content_type_cd IS '콘텐츠유형 (코드: VENDOR_CONTENT_TYPE)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_content.vendor_content_title IS '제목';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_content.vendor_content_subtitle IS '부제';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_content.content_html IS '본문 (HTML)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_content.thumb_url IS '썸네일 URL';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_content.image_url IS '대표 이미지 URL';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_content.link_url IS '링크 URL';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_content.attach_grp_id IS '첨부파일그룹ID (sy_attach_grp.attach_grp_id)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_content.lang_cd IS '언어코드 (ko/en/ja)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_content.start_date IS '노출 시작일시';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_content.end_date IS '노출 종료일시';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_content.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_content.vendor_content_status_cd IS '상태 (코드: VENDOR_CONTENT_STATUS)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_content.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_content.view_count IS '조회수';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_content.vendor_content_remark IS '비고';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_content.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_content.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_content.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_content.upd_date IS '수정일';

CREATE INDEX idx_sy_vendor_content_date ON shopjoy_2604.sy_vendor_content USING btree (start_date, end_date);
CREATE INDEX idx_sy_vendor_content_status ON shopjoy_2604.sy_vendor_content USING btree (vendor_content_status_cd);
CREATE INDEX idx_sy_vendor_content_type ON shopjoy_2604.sy_vendor_content USING btree (content_type_cd);
CREATE INDEX idx_sy_vendor_content_vendor ON shopjoy_2604.sy_vendor_content USING btree (vendor_id);
