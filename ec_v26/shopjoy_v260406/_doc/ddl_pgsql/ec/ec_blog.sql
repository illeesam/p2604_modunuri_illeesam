-- ============================================================
-- ec_blog : 블로그 게시글 + 카테고리/댓글/이미지/좋아요
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================

-- 블로그 카테고리
CREATE TABLE ec_blog_cate (
    blog_cate_id    VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    blog_cate_nm    VARCHAR(100)    NOT NULL,              -- 카테고리명
    parent_id       VARCHAR(16),                            -- 상위 카테고리ID (계층형)
    sort_ord        INTEGER         DEFAULT 0,              -- 정렬순서
    use_yn          CHAR(1)         DEFAULT 'Y',            -- 사용여부 Y/N
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (blog_cate_id)
);

COMMENT ON TABLE  ec_blog_cate             IS '블로그 카테고리';
COMMENT ON COLUMN ec_blog_cate.blog_cate_id IS '블로그카테고리ID';
COMMENT ON COLUMN ec_blog_cate.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_blog_cate.blog_cate_nm IS '카테고리명';
COMMENT ON COLUMN ec_blog_cate.parent_id    IS '상위 카테고리ID (NULL이면 최상위)';
COMMENT ON COLUMN ec_blog_cate.sort_ord     IS '정렬순서';
COMMENT ON COLUMN ec_blog_cate.use_yn       IS '사용여부 Y/N';
COMMENT ON COLUMN ec_blog_cate.reg_by       IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_blog_cate.reg_date     IS '등록일';
COMMENT ON COLUMN ec_blog_cate.upd_by       IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN ec_blog_cate.upd_date     IS '수정일';

-- 블로그 게시글
CREATE TABLE ec_blog (
    blog_id         VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    blog_cate_id    VARCHAR(16),                            -- FK: ec_blog_cate.blog_cate_id
    blog_title      VARCHAR(200)    NOT NULL,              -- 제목
    blog_summary    VARCHAR(500),                           -- 요약 (미리보기용)
    blog_content    TEXT            NOT NULL,              -- 본문 (HTML)
    blog_author     VARCHAR(100),                           -- 작성자 이름
    prod_id         VARCHAR(16),                            -- FK: ec_prod.prod_id (선택사항, 상품 관련 글)
    view_count      INTEGER         DEFAULT 0,              -- 조회수
    use_yn          CHAR(1)         DEFAULT 'Y',            -- 공개여부 Y/N
    is_notice       CHAR(1)         DEFAULT 'N',            -- 공지글 여부 Y/N (상단 고정)
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (blog_id)
);

COMMENT ON TABLE  ec_blog              IS '블로그 게시글';
COMMENT ON COLUMN ec_blog.blog_id      IS '블로그ID';
COMMENT ON COLUMN ec_blog.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_blog.blog_cate_id IS '블로그카테고리ID (ec_blog_cate.blog_cate_id)';
COMMENT ON COLUMN ec_blog.blog_title   IS '제목';
COMMENT ON COLUMN ec_blog.blog_summary IS '요약 (미리보기, 검색결과용)';
COMMENT ON COLUMN ec_blog.blog_content IS '본문 (HTML 에디터)';
COMMENT ON COLUMN ec_blog.blog_author  IS '작성자 이름';
COMMENT ON COLUMN ec_blog.prod_id      IS '상품ID (ec_prod.prod_id, 상품 관련 글일 때만)';
COMMENT ON COLUMN ec_blog.view_count   IS '조회수';
COMMENT ON COLUMN ec_blog.use_yn       IS '공개여부 Y/N (비공개 글)';
COMMENT ON COLUMN ec_blog.is_notice    IS '공지글 여부 Y/N (상단 고정)';
COMMENT ON COLUMN ec_blog.reg_by       IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_blog.reg_date     IS '등록일';
COMMENT ON COLUMN ec_blog.upd_by       IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN ec_blog.upd_date     IS '수정일';

CREATE INDEX idx_ec_blog_cate ON ec_blog (blog_cate_id);
CREATE INDEX idx_ec_blog_prod ON ec_blog (prod_id);
CREATE INDEX idx_ec_blog_date ON ec_blog (reg_date DESC);

-- 블로그 이미지
CREATE TABLE ec_blog_img (
    blog_img_id     VARCHAR(16)     NOT NULL,
    blog_id         VARCHAR(16)     NOT NULL,              -- FK: ec_blog.blog_id
    img_url         VARCHAR(500)    NOT NULL,              -- 원본 이미지 URL
    thumb_url       VARCHAR(500),                           -- 썸네일 이미지 URL
    img_alt_text    VARCHAR(200),                           -- 대체텍스트
    sort_ord        INTEGER         DEFAULT 0,              -- 정렬순서
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (blog_img_id)
);

COMMENT ON TABLE  ec_blog_img           IS '블로그 이미지';
COMMENT ON COLUMN ec_blog_img.blog_img_id IS '블로그이미지ID';
COMMENT ON COLUMN ec_blog_img.blog_id     IS '블로그ID (ec_blog.blog_id)';
COMMENT ON COLUMN ec_blog_img.img_url     IS '원본 이미지 URL';
COMMENT ON COLUMN ec_blog_img.thumb_url   IS '썸네일 이미지 URL';
COMMENT ON COLUMN ec_blog_img.img_alt_text IS '이미지 대체텍스트';
COMMENT ON COLUMN ec_blog_img.sort_ord    IS '정렬순서';
COMMENT ON COLUMN ec_blog_img.reg_by      IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_blog_img.reg_date    IS '등록일';

CREATE INDEX idx_ec_blog_img_blog ON ec_blog_img (blog_id);

-- 블로그 댓글
CREATE TABLE ec_blog_comment (
    comment_id      VARCHAR(16)     NOT NULL,
    blog_id         VARCHAR(16)     NOT NULL,              -- FK: ec_blog.blog_id
    user_id         VARCHAR(16),                            -- FK: sy_member.user_id (NULL이면 비회원)
    user_nm         VARCHAR(100),                           -- 댓글 작성자 이름
    user_email      VARCHAR(100),                           -- 댓글 작성자 이메일 (비회원용)
    comment_content TEXT            NOT NULL,              -- 댓글 내용
    parent_id       VARCHAR(16),                            -- 답글의 경우 상위 댓글ID
    like_count      INTEGER         DEFAULT 0,              -- 좋아요
    use_yn          CHAR(1)         DEFAULT 'Y',            -- 승인여부 Y/N
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (comment_id)
);

COMMENT ON TABLE  ec_blog_comment          IS '블로그 댓글 (답글 지원)';
COMMENT ON COLUMN ec_blog_comment.comment_id IS '댓글ID';
COMMENT ON COLUMN ec_blog_comment.blog_id    IS '블로그ID (ec_blog.blog_id)';
COMMENT ON COLUMN ec_blog_comment.user_id    IS '사용자ID (sy_member.user_id, NULL이면 비회원)';
COMMENT ON COLUMN ec_blog_comment.user_nm    IS '댓글 작성자 이름';
COMMENT ON COLUMN ec_blog_comment.user_email IS '댓글 작성자 이메일 (비회원용)';
COMMENT ON COLUMN ec_blog_comment.comment_content IS '댓글 내용';
COMMENT ON COLUMN ec_blog_comment.parent_id IS '상위 댓글ID (답글일 경우)';
COMMENT ON COLUMN ec_blog_comment.like_count IS '좋아요 개수';
COMMENT ON COLUMN ec_blog_comment.use_yn    IS '승인여부 Y/N (관리자 승인)';
COMMENT ON COLUMN ec_blog_comment.reg_by    IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_blog_comment.reg_date  IS '등록일';
COMMENT ON COLUMN ec_blog_comment.upd_by    IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN ec_blog_comment.upd_date  IS '수정일';

CREATE INDEX idx_ec_blog_comment_blog ON ec_blog_comment (blog_id);
CREATE INDEX idx_ec_blog_comment_parent ON ec_blog_comment (parent_id);

-- 블로그 좋아요
CREATE TABLE ec_blog_like (
    like_id         VARCHAR(16)     NOT NULL,
    blog_id         VARCHAR(16)     NOT NULL,              -- FK: ec_blog.blog_id
    user_id         VARCHAR(16)     NOT NULL,              -- FK: sy_member.user_id (회원만 가능)
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (like_id),
    UNIQUE (blog_id, user_id)                              -- 중복 방지
);

COMMENT ON TABLE  ec_blog_like       IS '블로그 좋아요';
COMMENT ON COLUMN ec_blog_like.like_id IS '좋아요ID';
COMMENT ON COLUMN ec_blog_like.blog_id IS '블로그ID (ec_blog.blog_id)';
COMMENT ON COLUMN ec_blog_like.user_id IS '사용자ID (sy_member.user_id)';
COMMENT ON COLUMN ec_blog_like.reg_date IS '등록일';

CREATE INDEX idx_ec_blog_like_blog ON ec_blog_like (blog_id);
CREATE INDEX idx_ec_blog_like_user ON ec_blog_like (user_id);

-- 샘플 데이터:
-- ec_blog_cate: 카테고리(신상품, 상품후기, 패션정보, 이벤트)
-- ec_blog: 제목, 요약, HTML 내용, 조회수, 공개여부
-- ec_blog_img: 썸네일, 원본 이미지
-- ec_blog_comment: 댓글, 답글, 승인여부
-- ec_blog_like: 회원의 좋아요 (한 번만 가능)
