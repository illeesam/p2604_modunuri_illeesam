-- cm_blog_file 테이블 DDL
-- 블로그 이미지

CREATE TABLE shopjoy_2604.cm_blog_file (
    blog_img_id  VARCHAR(21)  NOT NULL PRIMARY KEY,
    blog_id      VARCHAR(21)  NOT NULL,
    img_url      VARCHAR(500) NOT NULL,
    thumb_url    VARCHAR(500),
    img_alt_text VARCHAR(200),
    sort_ord     INTEGER      DEFAULT 0,
    reg_by       VARCHAR(30) ,
    reg_date     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_date     TIMESTAMP   ,
    upd_by       VARCHAR(30) 
);

COMMENT ON TABLE  shopjoy_2604.cm_blog_file IS '블로그 이미지';
COMMENT ON COLUMN shopjoy_2604.cm_blog_file.blog_img_id IS '블로그이미지ID';
COMMENT ON COLUMN shopjoy_2604.cm_blog_file.blog_id IS '블로그ID (cm_bltn.)';
COMMENT ON COLUMN shopjoy_2604.cm_blog_file.img_url IS '원본 이미지 URL';
COMMENT ON COLUMN shopjoy_2604.cm_blog_file.thumb_url IS '썸네일 이미지 URL';
COMMENT ON COLUMN shopjoy_2604.cm_blog_file.img_alt_text IS '이미지 대체텍스트';
COMMENT ON COLUMN shopjoy_2604.cm_blog_file.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.cm_blog_file.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.cm_blog_file.reg_date IS '등록일';

CREATE INDEX idx_cm_bltn_file_blog ON shopjoy_2604.cm_blog_file USING btree (blog_id);
