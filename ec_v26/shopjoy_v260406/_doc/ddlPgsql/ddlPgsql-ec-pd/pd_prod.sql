-- ============================================================
-- pd_prod : 상품
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE pd_prod (
    prod_id         VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    category_id     VARCHAR(21),
    brand_id        VARCHAR(21),
    vendor_id       VARCHAR(21),
    md_user_id      VARCHAR(21),                            -- 담당MD (sy_user.user_id)
    prod_nm         VARCHAR(200)    NOT NULL,
    prod_type_cd    VARCHAR(20)     DEFAULT 'SINGLE',           -- 코드: PRODUCT_TYPE (SINGLE/GROUP/SET)
    prod_code       VARCHAR(50),
    list_price      BIGINT          DEFAULT 0,
    sale_price      BIGINT          DEFAULT 0,
    purchase_price  BIGINT,                                 -- 매입가(원가) — 내부 관리용
    margin_rate     DECIMAL(5,2),                           -- 마진율 (%) — 내부 관리용
    prod_stock      INTEGER         DEFAULT 0,
    prod_status_cd  VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: PRODUCT_STATUS
    prod_status_cd_before VARCHAR(20),                       -- 변경 전 상품상태
    thumbnail_url   VARCHAR(500),
    content_html    TEXT,
    weight          NUMERIC(10,2),
    size_info_cd    VARCHAR(100),                           -- 코드: PRODUCT_SIZE
    is_new          CHAR(1)         DEFAULT 'N',
    is_best         CHAR(1)         DEFAULT 'N',
    view_count      INTEGER         DEFAULT 0,
    sale_count      INTEGER         DEFAULT 0,
    -- 판매기간
    sale_start_date TIMESTAMP,                              -- 판매기간 시작 (NULL=즉시)
    sale_end_date   TIMESTAMP,                              -- 판매기간 종료 (NULL=무기한)
    -- 구매 제한
    min_buy_qty     INTEGER         DEFAULT 1,              -- 최소구매수량
    max_buy_qty     INTEGER,                                -- 최대구매수량 (NULL=무제한)
    day_max_buy_qty INTEGER,                                -- 1일 최대구매수량 (NULL=무제한)
    id_max_buy_qty  INTEGER,                                -- ID당 최대구매수량 (NULL=무제한)
    -- 성인/배송
    adlt_yn         CHAR(1)         DEFAULT 'N',            -- 성인상품 여부 Y/N
    same_day_dliv_yn CHAR(1)        DEFAULT 'N',            -- 당일배송여부 Y/N
    sold_out_yn     CHAR(1)         DEFAULT 'N',            -- 품절여부 Y/N
    dliv_tmplt_id   VARCHAR(21),                            -- 배송템플릿ID (pd_dliv_tmplt.dliv_tmplt_id)
    -- 혜택 적용 여부
    coupon_use_yn   CHAR(1)         DEFAULT 'Y',            -- 쿠폰 사용 가능 여부 Y/N
    save_use_yn     CHAR(1)         DEFAULT 'Y',            -- 적립금 사용 가능 여부 Y/N
    discnt_use_yn   CHAR(1)         DEFAULT 'Y',            -- 할인 적용 가능 여부 Y/N
    -- 홍보문구
    advrt_stmt      VARCHAR(500),                           -- 홍보문구
    advrt_start_date TIMESTAMP,                             -- 홍보문구 시작일시
    advrt_end_date  TIMESTAMP,                              -- 홍보문구 종료일시
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (prod_id)
);

COMMENT ON TABLE pd_prod IS '상품';
COMMENT ON COLUMN pd_prod.prod_id       IS '상품ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pd_prod.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_prod.category_id   IS '카테고리ID';
COMMENT ON COLUMN pd_prod.brand_id      IS '브랜드ID';
COMMENT ON COLUMN pd_prod.vendor_id     IS '업체ID';
COMMENT ON COLUMN pd_prod.md_user_id    IS '담당MD (sy_user.user_id) — 등록 시 본인 기본값, 변경 가능';
COMMENT ON COLUMN pd_prod.prod_nm       IS '상품명';
COMMENT ON COLUMN pd_prod.prod_type_cd  IS '상품유형 (코드: PRODUCT_TYPE — SINGLE/GROUP/SET)';
COMMENT ON COLUMN pd_prod.prod_code     IS '상품코드(SKU)';
COMMENT ON COLUMN pd_prod.list_price    IS '정가';
COMMENT ON COLUMN pd_prod.sale_price    IS '판매가';
COMMENT ON COLUMN pd_prod.purchase_price IS '매입가(원가) — 내부 관리용';
COMMENT ON COLUMN pd_prod.margin_rate   IS '마진율 (%) — 내부 관리용';
COMMENT ON COLUMN pd_prod.prod_stock    IS '재고수량';
COMMENT ON COLUMN pd_prod.prod_status_cd IS '상태 (코드: PRODUCT_STATUS)';
COMMENT ON COLUMN pd_prod.prod_status_cd_before IS '변경 전 상품상태 (코드: PRODUCT_STATUS)';
COMMENT ON COLUMN pd_prod.thumbnail_url IS '썸네일URL';
COMMENT ON COLUMN pd_prod.content_html  IS '상세설명 (HTML)';
COMMENT ON COLUMN pd_prod.weight        IS '무게(kg)';
COMMENT ON COLUMN pd_prod.size_info_cd  IS '사이즈 (코드: PRODUCT_SIZE)';
COMMENT ON COLUMN pd_prod.is_new        IS '신상품여부 Y/N';
COMMENT ON COLUMN pd_prod.is_best       IS '베스트여부 Y/N';
COMMENT ON COLUMN pd_prod.view_count    IS '조회수';
COMMENT ON COLUMN pd_prod.sale_count    IS '판매수';
COMMENT ON COLUMN pd_prod.sale_start_date IS '판매기간 시작 (NULL=즉시)';
COMMENT ON COLUMN pd_prod.sale_end_date IS '판매기간 종료 (NULL=무기한)';
COMMENT ON COLUMN pd_prod.min_buy_qty   IS '최소구매수량 (기본 1)';
COMMENT ON COLUMN pd_prod.max_buy_qty   IS '최대구매수량 (NULL=무제한)';
COMMENT ON COLUMN pd_prod.day_max_buy_qty IS '1일 최대구매수량 (NULL=무제한)';
COMMENT ON COLUMN pd_prod.id_max_buy_qty IS 'ID당 최대구매수량 (NULL=무제한)';
COMMENT ON COLUMN pd_prod.adlt_yn       IS '성인상품 여부 Y/N';
COMMENT ON COLUMN pd_prod.same_day_dliv_yn IS '당일배송여부 Y/N';
COMMENT ON COLUMN pd_prod.sold_out_yn   IS '품절여부 Y/N';
COMMENT ON COLUMN pd_prod.dliv_tmplt_id IS '배송템플릿ID (pd_dliv_tmplt.dliv_tmplt_id)';
COMMENT ON COLUMN pd_prod.coupon_use_yn IS '쿠폰 사용 가능 여부 Y/N';
COMMENT ON COLUMN pd_prod.save_use_yn   IS '적립금 사용 가능 여부 Y/N';
COMMENT ON COLUMN pd_prod.discnt_use_yn IS '할인 적용 가능 여부 Y/N';
COMMENT ON COLUMN pd_prod.advrt_stmt    IS '홍보문구 (500자 이내)';
COMMENT ON COLUMN pd_prod.advrt_start_date IS '홍보문구 시작일시';
COMMENT ON COLUMN pd_prod.advrt_end_date IS '홍보문구 종료일시';
COMMENT ON COLUMN pd_prod.reg_by        IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod.reg_date      IS '등록일';
COMMENT ON COLUMN pd_prod.upd_by        IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod.upd_date      IS '수정일';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pd_prod.prod_type_cd (상품유형) : PRODUCT_TYPE { SINGLE:단일상품, GROUP:그룹상품, SET:세트상품 }
-- [CODES] pd_prod.prod_status_cd (상태) : 상품상태 { ON_SALE:판매중, PREPARING:준비중, SOLD_OUT:품절, SUSPENDED:판매중지 }
-- [CODES] pd_prod.size_info_cd (사이즈) : 상품사이즈 { FREE:FREE, XS:XS, S:S, M:M, L:L, XL:XL, XXL:XXL }
