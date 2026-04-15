CREATE TABLE ec_prod_opt_sku (
    sku_id          VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    prod_id         VARCHAR(16)     NOT NULL,
    opt_id_1    VARCHAR(16),                            -- 옵션1 값ID (예: 색상-블랙)
    opt_id_2    VARCHAR(16),                            -- 옵션2 값ID (예: 사이즈-M)
    sku_code        VARCHAR(50),                            -- 자체 SKU 코드
    add_price       BIGINT          DEFAULT 0,              -- 옵션 추가금액
    stock           INTEGER         DEFAULT 0,              -- 옵션 조합별 재고
    use_yn          CHAR(1)         DEFAULT 'Y',
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (sku_id)
);

COMMENT ON TABLE  ec_prod_opt_sku              IS '상품 옵션 SKU (조합별 재고/가격)';
COMMENT ON COLUMN ec_prod_opt_sku.sku_id       IS 'SKU ID';
COMMENT ON COLUMN ec_prod_opt_sku.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_prod_opt_sku.prod_id      IS '상품ID';
COMMENT ON COLUMN ec_prod_opt_sku.opt_id_1 IS '옵션1 값ID (ec_prod_opt.opt_id)';
COMMENT ON COLUMN ec_prod_opt_sku.opt_id_2 IS '옵션2 값ID (ec_prod_opt.opt_id)';
COMMENT ON COLUMN ec_prod_opt_sku.sku_code     IS '자체 SKU 코드';
COMMENT ON COLUMN ec_prod_opt_sku.add_price    IS '옵션 추가금액 (기본가 대비)';
COMMENT ON COLUMN ec_prod_opt_sku.stock        IS '해당 옵션 조합 재고수량';
COMMENT ON COLUMN ec_prod_opt_sku.use_yn       IS '사용여부 Y/N';
COMMENT ON COLUMN ec_prod_opt_sku.reg_by       IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_prod_opt_sku.reg_date     IS '등록일';
COMMENT ON COLUMN ec_prod_opt_sku.upd_by       IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN ec_prod_opt_sku.upd_date     IS '수정일';

-- 상품 변경 이력
