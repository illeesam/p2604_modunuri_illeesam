-- 상품 이미지 (다중)
-- opt_item_id_1 만 있으면 해당 색상 공통, opt_item_id_2 도 있으면 특정 사이즈 전용
-- 둘 다 NULL이면 상품 대표(공통) 이미지
-- attach_id: 파일 관리 시스템(sy_attach)과 연계 시 사용
CREATE TABLE pd_prod_img (
    prod_img_id     VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    prod_id         VARCHAR(21)     NOT NULL,              -- FK: pd_prod.prod_id
    opt_item_id_1   VARCHAR(21),                            -- 옵션1 값ID (pd_prod_opt_item.opt_item_id, 예: 색상-블랙)
    opt_item_id_2   VARCHAR(21),                            -- 옵션2 값ID (pd_prod_opt_item.opt_item_id, 예: 사이즈-M)
    attach_id       VARCHAR(21),                            -- FK: sy_attach.attach_id (원본 파일 참조)
    cdn_host        VARCHAR(100),                           -- CDN 호스트명 (예: cdn.example.com)
    cdn_img_url     VARCHAR(500),                           -- CDN 원본 이미지 URL (상세 페이지용)
    cdn_thumb_url   VARCHAR(500),                           -- CDN 썸네일 이미지 URL (목록/검색/카테고리용)
    img_alt_text    VARCHAR(200),                           -- 이미지 대체텍스트 (SEO/접근성)
    sort_ord        INTEGER         DEFAULT 0,              -- 정렬순서
    is_thumb        CHAR(1)         DEFAULT 'N',            -- 대표이미지여부 Y/N
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (prod_img_id)
);

COMMENT ON TABLE pd_prod_img IS '상품 이미지';
COMMENT ON COLUMN pd_prod_img.prod_img_id    IS '상품이미지ID';
COMMENT ON COLUMN pd_prod_img.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_prod_img.prod_id        IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pd_prod_img.opt_item_id_1  IS '옵션1 값ID (pd_prod_opt_item.opt_item_id, 색상 등, NULL이면 공통 이미지)';
COMMENT ON COLUMN pd_prod_img.opt_item_id_2  IS '옵션2 값ID (pd_prod_opt_item.opt_item_id, 사이즈 등, NULL이면 색상 공통)';
COMMENT ON COLUMN pd_prod_img.attach_id      IS '첨부파일ID (sy_attach.attach_id, 원본 파일 보관용)';
COMMENT ON COLUMN pd_prod_img.cdn_host       IS 'CDN 호스트명 (예: cdn.example.com, 원본 시점의 CDN)';
COMMENT ON COLUMN pd_prod_img.cdn_img_url    IS 'CDN 원본 이미지 URL (상세 페이지용, sy_attach 기준)';
COMMENT ON COLUMN pd_prod_img.cdn_thumb_url  IS 'CDN 썸네일 URL (목록/검색/카테고리용, sy_attach 기준)';
COMMENT ON COLUMN pd_prod_img.img_alt_text   IS '이미지 대체텍스트 (alt 속성, SEO/접근성)';
COMMENT ON COLUMN pd_prod_img.sort_ord       IS '정렬순서';
COMMENT ON COLUMN pd_prod_img.is_thumb       IS '대표이미지여부 Y/N';
COMMENT ON COLUMN pd_prod_img.reg_by         IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod_img.reg_date       IS '등록일';
COMMENT ON COLUMN pd_prod_img.upd_by         IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod_img.upd_date       IS '수정일';

CREATE INDEX idx_pd_prod_img_opt ON pd_prod_img (prod_id, opt_item_id_1, opt_item_id_2);
