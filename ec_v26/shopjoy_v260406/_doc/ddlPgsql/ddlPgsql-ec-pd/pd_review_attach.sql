-- 리뷰 이미지/동영상
-- attach_id → sy_attach.attach_id (파일 실체: url, file_nm, file_size 등은 sy_attach에서 조회)
-- thumb_url은 동영상 썸네일처럼 별도 생성 파일이므로 유지
CREATE TABLE pd_review_attach (
    review_attach_id        VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),
    review_id       VARCHAR(21)     NOT NULL,              -- pd_review.
    attach_id       VARCHAR(21)     NOT NULL,              -- sy_attach.attach_id
    media_type_cd   VARCHAR(20)     DEFAULT 'IMAGE',       -- 코드: MEDIA_TYPE (IMAGE/VIDEO)
    thumb_url       VARCHAR(500),                          -- 동영상 썸네일 URL (이미지는 sy_attach.url 사용)
    sort_ord        INTEGER         DEFAULT 0,
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (review_attach_id)
);

COMMENT ON TABLE pd_review_attach IS '리뷰 이미지/동영상';
COMMENT ON COLUMN pd_review_attach.review_attach_id     IS '미디어ID';
COMMENT ON COLUMN pd_review_attach.site_id      IS '사이트ID';
COMMENT ON COLUMN pd_review_attach.review_id    IS '리뷰ID (pd_review.)';
COMMENT ON COLUMN pd_review_attach.attach_id    IS '첨부파일ID (sy_attach.attach_id) — url·파일명 여기서 조회';
COMMENT ON COLUMN pd_review_attach.media_type_cd IS '미디어유형 (코드: MEDIA_TYPE)';
COMMENT ON COLUMN pd_review_attach.thumb_url    IS '동영상 썸네일URL (이미지는 sy_attach.url 사용)';
COMMENT ON COLUMN pd_review_attach.sort_ord     IS '정렬순서';
COMMENT ON COLUMN pd_review_attach.reg_by       IS '등록자';
COMMENT ON COLUMN pd_review_attach.reg_date     IS '등록일';
COMMENT ON COLUMN pd_review_attach.upd_by       IS '수정자';
COMMENT ON COLUMN pd_review_attach.upd_date     IS '수정일';

CREATE INDEX idx_pd_review_media_review ON pd_review_attach (review_id);
CREATE INDEX idx_pd_review_media_attach ON pd_review_attach (attach_id);

-- 리뷰 댓글 (판매자 답변 포함)

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pd_review_attach.media_type_cd (미디어유형) : MEDIA_TYPE { IMAGE:이미지, VIDEO:동영상, DOCUMENT:문서 }
