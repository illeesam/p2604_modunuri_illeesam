-- ============================================================
-- ec_blog_img : 블로그 이미지
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================

CREATE TABLE cm_bltn_file (
    blog_img_id     VARCHAR(21)     NOT NULL,
    blog_id         VARCHAR(21)     NOT NULL,              -- FK: cm_bltn.blog_id
    img_url         VARCHAR(500)    NOT NULL,              -- 원본 이미지 URL
    thumb_url       VARCHAR(500),                           -- 썸네일 이미지 URL
    img_alt_text    VARCHAR(200),                           -- 대체텍스트
    sort_ord        INTEGER         DEFAULT 0,              -- 정렬순서
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (blog_img_id)
);

COMMENT ON TABLE cm_bltn_file IS '블로그 이미지';
COMMENT ON COLUMN cm_bltn_file.blog_img_id IS '블로그이미지ID';
COMMENT ON COLUMN cm_bltn_file.blog_id     IS '블로그ID (cm_bltn.)';
COMMENT ON COLUMN cm_bltn_file.img_url     IS '원본 이미지 URL';
COMMENT ON COLUMN cm_bltn_file.thumb_url   IS '썸네일 이미지 URL';
COMMENT ON COLUMN cm_bltn_file.img_alt_text IS '이미지 대체텍스트';
COMMENT ON COLUMN cm_bltn_file.sort_ord    IS '정렬순서';
COMMENT ON COLUMN cm_bltn_file.reg_by      IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN cm_bltn_file.reg_date    IS '등록일';
COMMENT ON COLUMN cm_bltn_file.upd_by   IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN cm_bltn_file.upd_date IS '수정일';

CREATE INDEX idx_cm_bltn_file_blog ON cm_bltn_file (blog_id);
