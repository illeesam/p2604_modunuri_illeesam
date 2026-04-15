-- ============================================================
-- ec_prod : 상품
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
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
