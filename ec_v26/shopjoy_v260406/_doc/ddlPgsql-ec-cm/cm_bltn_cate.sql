-- ============================================================
-- ec_blog_cate : 블로그 카테고리
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================

CREATE TABLE cm_bltn_cate (
    blog_cate_id    VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    blog_cate_nm    VARCHAR(100)    NOT NULL,              -- 카테고리명
    parent_blog_cate_id VARCHAR(21),                        -- 상위 카테고리ID (계층형)
    sort_ord        INTEGER         DEFAULT 0,              -- 정렬순서
    use_yn          CHAR(1)         DEFAULT 'Y',            -- 사용여부 Y/N
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (blog_cate_id)
);

COMMENT ON TABLE cm_bltn_cate IS '블로그 카테고리';
COMMENT ON COLUMN cm_bltn_cate.blog_cate_id IS '블로그카테고리ID';
COMMENT ON COLUMN cm_bltn_cate.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN cm_bltn_cate.blog_cate_nm IS '카테고리명';
COMMENT ON COLUMN cm_bltn_cate.parent_blog_cate_id IS '상위 카테고리ID (NULL이면 최상위)';
COMMENT ON COLUMN cm_bltn_cate.sort_ord     IS '정렬순서';
COMMENT ON COLUMN cm_bltn_cate.use_yn       IS '사용여부 Y/N';
COMMENT ON COLUMN cm_bltn_cate.reg_by       IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN cm_bltn_cate.reg_date     IS '등록일';
COMMENT ON COLUMN cm_bltn_cate.upd_by       IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN cm_bltn_cate.upd_date     IS '수정일';
