-- pdh_prod_sku_price_hist 테이블 DDL
-- SKU 가격 변경 이력

CREATE TABLE shopjoy_2604.pdh_prod_sku_price_hist (
    hist_id          VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id          VARCHAR(21)  NOT NULL,
    sku_id           VARCHAR(21)  NOT NULL,
    prod_id          VARCHAR(21)  NOT NULL,
    add_price_before BIGINT       NOT NULL,
    add_price_after  BIGINT       NOT NULL,
    chg_reason       VARCHAR(200),
    chg_by           VARCHAR(20) ,
    chg_date         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    reg_by           VARCHAR(30) ,
    reg_date         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(30) ,
    upd_date         TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.pdh_prod_sku_price_hist IS 'SKU 가격 변경 이력';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_sku_price_hist.hist_id IS '이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_sku_price_hist.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_sku_price_hist.sku_id IS 'SKU ID (pd_prod_sku.sku_id)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_sku_price_hist.prod_id IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_sku_price_hist.add_price_before IS '변경 전 옵션 추가금액';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_sku_price_hist.add_price_after IS '변경 후 옵션 추가금액';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_sku_price_hist.chg_reason IS '변경사유';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_sku_price_hist.chg_by IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_sku_price_hist.chg_date IS '처리일시';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_sku_price_hist.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_sku_price_hist.reg_date IS '등록일';

CREATE INDEX idx_pdh_prod_sku_price_hist_date ON shopjoy_2604.pdh_prod_sku_price_hist USING btree (chg_date);
CREATE INDEX idx_pdh_prod_sku_price_hist_prod ON shopjoy_2604.pdh_prod_sku_price_hist USING btree (prod_id);
CREATE INDEX idx_pdh_prod_sku_price_hist_site ON shopjoy_2604.pdh_prod_sku_price_hist USING btree (site_id);
CREATE INDEX idx_pdh_prod_sku_price_hist_sku ON shopjoy_2604.pdh_prod_sku_price_hist USING btree (sku_id);
