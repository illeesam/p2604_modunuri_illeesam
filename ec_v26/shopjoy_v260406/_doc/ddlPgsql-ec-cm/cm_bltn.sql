-- ============================================================
-- ec_blog : 블로그 게시글
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================

CREATE TABLE cm_bltn (
    blog_id         VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    blog_cate_id    VARCHAR(21),                            -- FK: cm_bltn_cate.blog_cate_idblog_cate_id
    blog_title      VARCHAR(200)    NOT NULL,              -- 제목
    blog_summary    VARCHAR(500),                           -- 요약 (미리보기용)
    blog_content    TEXT            NOT NULL,              -- 본문 (HTML)
    blog_author     VARCHAR(100),                           -- 작성자 이름
    prod_id         VARCHAR(21),                            -- FK: pd_prod.prod_idprod_id (선택사항, 상품 관련 글)
    view_count      INTEGER         DEFAULT 0,              -- 조회수
    use_yn          CHAR(1)         DEFAULT 'Y',            -- 공개여부 Y/N
    is_notice       CHAR(1)         DEFAULT 'N',            -- 공지글 여부 Y/N (상단 고정)
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (blog_id)
);

COMMENT ON TABLE cm_bltn IS '블로그 게시글';
COMMENT ON COLUMN cm_bltn.blog_id      IS '블로그ID';
COMMENT ON COLUMN cm_bltn.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN cm_bltn.blog_cate_id IS '블로그카테고리ID (cm_bltn_cate.blog_cate_id)';
COMMENT ON COLUMN cm_bltn.blog_title   IS '제목';
COMMENT ON COLUMN cm_bltn.blog_summary IS '요약 (미리보기, 검색결과용)';
COMMENT ON COLUMN cm_bltn.blog_content IS '본문 (HTML 에디터)';
COMMENT ON COLUMN cm_bltn.blog_author  IS '작성자 이름';
COMMENT ON COLUMN cm_bltn.prod_id      IS '상품ID (pd_prod.prod_id, 상품 관련 글일 때만)';
COMMENT ON COLUMN cm_bltn.view_count   IS '조회수';
COMMENT ON COLUMN cm_bltn.use_yn       IS '공개여부 Y/N (비공개 글)';
COMMENT ON COLUMN cm_bltn.is_notice    IS '공지글 여부 Y/N (상단 고정)';
COMMENT ON COLUMN cm_bltn.reg_by       IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN cm_bltn.reg_date     IS '등록일';
COMMENT ON COLUMN cm_bltn.upd_by       IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN cm_bltn.upd_date     IS '수정일';

CREATE INDEX idx_cm_bltn_cate ON cm_bltn (blog_cate_id);
CREATE INDEX idx_cm_bltn_prod ON cm_bltn (prod_id);
CREATE INDEX idx_cm_bltn_date ON cm_bltn (reg_date DESC);
