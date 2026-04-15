-- ============================================================
CREATE TABLE ec_prod (
    prod_id         VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    category_id     VARCHAR(16),
    brand_id        VARCHAR(16),
    vendor_id       VARCHAR(16),
    prod_nm         VARCHAR(200)    NOT NULL,
    prod_code       VARCHAR(50),
    price           BIGINT          DEFAULT 0,
    sale_price      BIGINT          DEFAULT 0,
    stock           INTEGER         DEFAULT 0,
    status_cd       VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: PRODUCT_STATUS
    thumbnail_url   VARCHAR(500),
    content_html    TEXT,
    weight          NUMERIC(10,2),
    size_info_cd    VARCHAR(100),                           -- 코드: PRODUCT_SIZE
    is_new          CHAR(1)         DEFAULT 'N',
    is_best         CHAR(1)         DEFAULT 'N',
    view_count      INTEGER         DEFAULT 0,
    sale_count      INTEGER         DEFAULT 0,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (prod_id)
);

COMMENT ON TABLE  ec_prod               IS '상품';
COMMENT ON COLUMN ec_prod.prod_id       IS '상품ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_prod.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_prod.category_id   IS '카테고리ID';
COMMENT ON COLUMN ec_prod.brand_id      IS '브랜드ID';
COMMENT ON COLUMN ec_prod.vendor_id     IS '업체ID';
COMMENT ON COLUMN ec_prod.prod_nm       IS '상품명';
COMMENT ON COLUMN ec_prod.prod_code     IS '상품코드(SKU)';
COMMENT ON COLUMN ec_prod.price         IS '정가';
COMMENT ON COLUMN ec_prod.sale_price    IS '판매가';
COMMENT ON COLUMN ec_prod.stock         IS '재고수량';
COMMENT ON COLUMN ec_prod.status_cd     IS '상태 (코드: PRODUCT_STATUS)';
COMMENT ON COLUMN ec_prod.thumbnail_url IS '썸네일URL';
COMMENT ON COLUMN ec_prod.content_html  IS '상세설명 (HTML)';
COMMENT ON COLUMN ec_prod.weight        IS '무게(kg)';
COMMENT ON COLUMN ec_prod.size_info_cd  IS '사이즈 (코드: PRODUCT_SIZE)';
COMMENT ON COLUMN ec_prod.is_new        IS '신상품여부 Y/N';
COMMENT ON COLUMN ec_prod.is_best       IS '베스트여부 Y/N';
COMMENT ON COLUMN ec_prod.view_count    IS '조회수';
COMMENT ON COLUMN ec_prod.sale_count    IS '판매수';
COMMENT ON COLUMN ec_prod.reg_by        IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_prod.reg_date      IS '등록일';
COMMENT ON COLUMN ec_prod.upd_by        IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN ec_prod.upd_date      IS '수정일';

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
