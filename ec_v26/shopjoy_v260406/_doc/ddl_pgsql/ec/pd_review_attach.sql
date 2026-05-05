-- pd_review_attach 테이블 DDL
-- 리뷰 이미지/동영상

CREATE TABLE shopjoy_2604.pd_review_attach (
    review_attach_id VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id          VARCHAR(21) ,
    review_id        VARCHAR(21)  NOT NULL,
    attach_id        VARCHAR(21)  NOT NULL,
    media_type_cd    VARCHAR(20)  DEFAULT 'IMAGE',
    thumb_url        VARCHAR(500),
    sort_ord         INTEGER      DEFAULT 0,
    reg_by           VARCHAR(30) ,
    reg_date         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(30) ,
    upd_date         TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.pd_review_attach IS '리뷰 이미지/동영상';
COMMENT ON COLUMN shopjoy_2604.pd_review_attach.review_attach_id IS '미디어ID';
COMMENT ON COLUMN shopjoy_2604.pd_review_attach.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.pd_review_attach.review_id IS '리뷰ID (pd_review.)';
COMMENT ON COLUMN shopjoy_2604.pd_review_attach.attach_id IS '첨부파일ID (sy_attach.attach_id) — url·파일명 여기서 조회';
COMMENT ON COLUMN shopjoy_2604.pd_review_attach.media_type_cd IS '미디어유형 (코드: MEDIA_TYPE)';
COMMENT ON COLUMN shopjoy_2604.pd_review_attach.thumb_url IS '동영상 썸네일URL (이미지는 sy_attach.url 사용)';
COMMENT ON COLUMN shopjoy_2604.pd_review_attach.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.pd_review_attach.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.pd_review_attach.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.pd_review_attach.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.pd_review_attach.upd_date IS '수정일';

CREATE INDEX idx_pd_review_media_attach ON shopjoy_2604.pd_review_attach USING btree (attach_id);
CREATE INDEX idx_pd_review_media_review ON shopjoy_2604.pd_review_attach USING btree (review_id);
