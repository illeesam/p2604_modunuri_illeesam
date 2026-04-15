-- ============================================================
CREATE TABLE ec_review (
    review_id       VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    prod_id         VARCHAR(16)     NOT NULL,               -- ec_prod.prod_id
    order_item_id   VARCHAR(16),                           -- ec_order_item.order_item_id (구매확정 리뷰)
    member_id       VARCHAR(16)     NOT NULL,               -- ec_member.member_id
    member_nm       VARCHAR(50),                           -- 작성자명 스냅샷
    rating          SMALLINT        DEFAULT 5,             -- 평점 1~5
    title           VARCHAR(200),                          -- 리뷰 제목
    content         TEXT,                                  -- 리뷰 본문
    opt_id_1        VARCHAR(16),                           -- 옵션1 값ID (ec_prod_opt.opt_id, 예: 색상)
    opt_id_2        VARCHAR(16),                           -- 옵션2 값ID (ec_prod_opt.opt_id, 예: 사이즈)
    opt_nm_1        VARCHAR(100),                          -- 옵션1명 스냅샷 (옵션 삭제 시 표시용)
    opt_nm_2        VARCHAR(100),                          -- 옵션2명 스냅샷 (옵션 삭제 시 표시용)
    is_photo        CHAR(1)         DEFAULT 'N',           -- 포토리뷰 여부 Y/N
    is_best         CHAR(1)         DEFAULT 'N',           -- 베스트리뷰 여부 Y/N
    status_cd       VARCHAR(20)     DEFAULT 'ACTIVE',      -- 코드: REVIEW_STATUS (ACTIVE/HIDDEN/DELETED)
    helpful_cnt     INTEGER         DEFAULT 0,             -- 도움돼요 수
    reply_cnt       INTEGER         DEFAULT 0,             -- 댓글 수
    cache_give      BIGINT          DEFAULT 0,             -- 지급 적립금
    view_count      INTEGER         DEFAULT 0,
    memo            TEXT,                                  -- 관리자 메모
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (review_id)
);

COMMENT ON TABLE  ec_review                IS '상품 리뷰';
COMMENT ON COLUMN ec_review.review_id      IS '리뷰ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_review.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_review.prod_id        IS '상품ID (ec_prod.prod_id)';
COMMENT ON COLUMN ec_review.order_item_id  IS '주문상품ID (ec_order_item.order_item_id)';
COMMENT ON COLUMN ec_review.member_id      IS '회원ID (ec_member.member_id)';
COMMENT ON COLUMN ec_review.member_nm      IS '작성자명 스냅샷';
COMMENT ON COLUMN ec_review.rating         IS '평점 (1~5)';
COMMENT ON COLUMN ec_review.title          IS '리뷰 제목';
COMMENT ON COLUMN ec_review.content        IS '리뷰 본문';
COMMENT ON COLUMN ec_review.opt_id_1       IS '옵션1 값ID (ec_prod_opt.opt_id, 예: 색상)';
COMMENT ON COLUMN ec_review.opt_id_2       IS '옵션2 값ID (ec_prod_opt.opt_id, 예: 사이즈)';
COMMENT ON COLUMN ec_review.opt_nm_1       IS '옵션1명 스냅샷 — opt_id 삭제 시에도 표시 가능 (예: 블랙)';
COMMENT ON COLUMN ec_review.opt_nm_2       IS '옵션2명 스냅샷 — opt_id 삭제 시에도 표시 가능 (예: M)';
COMMENT ON COLUMN ec_review.is_photo       IS '포토리뷰여부 Y/N';
COMMENT ON COLUMN ec_review.is_best        IS '베스트리뷰여부 Y/N';
COMMENT ON COLUMN ec_review.status_cd      IS '상태 (코드: REVIEW_STATUS)';
COMMENT ON COLUMN ec_review.helpful_cnt    IS '도움돼요 수';
COMMENT ON COLUMN ec_review.reply_cnt      IS '댓글 수';
COMMENT ON COLUMN ec_review.cache_give     IS '리뷰 작성 지급 적립금';
COMMENT ON COLUMN ec_review.view_count     IS '조회수';
COMMENT ON COLUMN ec_review.memo           IS '관리자 메모';
COMMENT ON COLUMN ec_review.reg_by         IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_review.reg_date       IS '등록일';
COMMENT ON COLUMN ec_review.upd_by         IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN ec_review.upd_date       IS '수정일';

CREATE INDEX idx_ec_review_prod   ON ec_review (prod_id);
CREATE INDEX idx_ec_review_member ON ec_review (member_id);
CREATE INDEX idx_ec_review_opt1   ON ec_review (opt_id_1);  -- 색상별 리뷰 조회
CREATE INDEX idx_ec_review_opt2   ON ec_review (opt_id_2);  -- 사이즈별 리뷰 조회

-- 리뷰 이미지/동영상
-- attach_id → sy_attach.attach_id (파일 실체: url, file_nm, file_size 등은 sy_attach에서 조회)
-- thumb_url은 동영상 썸네일처럼 별도 생성 파일이므로 유지
CREATE TABLE ec_review_media (
    media_id        VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),
    review_id       VARCHAR(16)     NOT NULL,              -- ec_review.review_id
    attach_id       VARCHAR(16)     NOT NULL,              -- sy_attach.attach_id
    media_type_cd   VARCHAR(20)     DEFAULT 'IMAGE',       -- 코드: MEDIA_TYPE (IMAGE/VIDEO)
    thumb_url       VARCHAR(500),                          -- 동영상 썸네일 URL (이미지는 sy_attach.url 사용)
    sort_ord        INTEGER         DEFAULT 0,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (media_id)
);

COMMENT ON TABLE  ec_review_media              IS '리뷰 이미지/동영상';
COMMENT ON COLUMN ec_review_media.media_id     IS '미디어ID';
COMMENT ON COLUMN ec_review_media.site_id      IS '사이트ID';
COMMENT ON COLUMN ec_review_media.review_id    IS '리뷰ID (ec_review.review_id)';
COMMENT ON COLUMN ec_review_media.attach_id    IS '첨부파일ID (sy_attach.attach_id) — url·파일명 여기서 조회';
COMMENT ON COLUMN ec_review_media.media_type_cd IS '미디어유형 (코드: MEDIA_TYPE)';
COMMENT ON COLUMN ec_review_media.thumb_url    IS '동영상 썸네일URL (이미지는 sy_attach.url 사용)';
COMMENT ON COLUMN ec_review_media.sort_ord     IS '정렬순서';
COMMENT ON COLUMN ec_review_media.reg_by       IS '등록자';
COMMENT ON COLUMN ec_review_media.reg_date     IS '등록일';
COMMENT ON COLUMN ec_review_media.upd_by       IS '수정자';
COMMENT ON COLUMN ec_review_media.upd_date     IS '수정일';

CREATE INDEX idx_ec_review_media_review ON ec_review_media (review_id);
CREATE INDEX idx_ec_review_media_attach ON ec_review_media (attach_id);

-- 리뷰 댓글 (판매자 답변 포함)
