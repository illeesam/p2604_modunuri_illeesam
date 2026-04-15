-- 상품 이미지 (다중)
-- opt_id_1 만 있으면 해당 색상 공통, opt_id_2 도 있으면 특정 사이즈 전용
-- 둘 다 NULL이면 상품 대표(공통) 이미지
CREATE TABLE ec_prod_img (
    prod_img_id     VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    prod_id         VARCHAR(16)     NOT NULL,
    opt_id_1        VARCHAR(16),                            -- 옵션1 값ID (ec_prod_opt.opt_id, 예: 색상-블랙)
    opt_id_2        VARCHAR(16),                            -- 옵션2 값ID (ec_prod_opt.opt_id, 예: 사이즈-M)
    img_url         VARCHAR(500)    NOT NULL,
    sort_ord        INTEGER         DEFAULT 0,
    is_thumb        CHAR(1)         DEFAULT 'N',
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (prod_img_id)
);

COMMENT ON TABLE  ec_prod_img             IS '상품 이미지';
COMMENT ON COLUMN ec_prod_img.prod_img_id IS '상품이미지ID';
COMMENT ON COLUMN ec_prod_img.site_id     IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_prod_img.prod_id     IS '상품ID';
COMMENT ON COLUMN ec_prod_img.opt_id_1    IS '옵션1 값ID (색상 등, NULL이면 공통 이미지)';
COMMENT ON COLUMN ec_prod_img.opt_id_2    IS '옵션2 값ID (사이즈 등, NULL이면 색상 공통)';
COMMENT ON COLUMN ec_prod_img.img_url     IS '이미지URL';
COMMENT ON COLUMN ec_prod_img.sort_ord    IS '정렬순서';
COMMENT ON COLUMN ec_prod_img.is_thumb    IS '대표이미지여부 Y/N';
COMMENT ON COLUMN ec_prod_img.reg_by      IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_prod_img.reg_date    IS '등록일';
COMMENT ON COLUMN ec_prod_img.upd_by      IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN ec_prod_img.upd_date    IS '수정일';

CREATE INDEX idx_ec_prod_img_opt ON ec_prod_img (prod_id, opt_id_1, opt_id_2);

-- 상품 옵션 그룹 (예: 색상, 사이즈)
