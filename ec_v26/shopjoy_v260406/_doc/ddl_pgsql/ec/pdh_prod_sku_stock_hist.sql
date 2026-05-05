-- pdh_prod_sku_stock_hist 테이블 DDL
-- SKU 재고 변경 이력

CREATE TABLE shopjoy_2604.pdh_prod_sku_stock_hist (
    hist_id       VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id       VARCHAR(21) ,
    sku_id        VARCHAR(21)  NOT NULL,
    prod_id       VARCHAR(21)  NOT NULL,
    stock_before  INTEGER      NOT NULL,
    stock_after   INTEGER      NOT NULL,
    chg_qty       INTEGER      NOT NULL,
    chg_reason_cd VARCHAR(20)  NOT NULL,
    chg_reason    VARCHAR(200),
    order_item_id VARCHAR(21) ,
    chg_by        VARCHAR(20) ,
    chg_date      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    reg_by        VARCHAR(30) ,
    reg_date      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by        VARCHAR(30) ,
    upd_date      TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.pdh_prod_sku_stock_hist IS 'SKU 재고 변경 이력';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_sku_stock_hist.hist_id IS '이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_sku_stock_hist.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_sku_stock_hist.sku_id IS 'SKU ID (pd_prod_sku.sku_id)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_sku_stock_hist.prod_id IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_sku_stock_hist.stock_before IS '변경 전 재고수량';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_sku_stock_hist.stock_after IS '변경 후 재고수량';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_sku_stock_hist.chg_qty IS '변동수량 (양수=입고, 음수=출고/판매)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_sku_stock_hist.chg_reason_cd IS '변동사유 (코드: SKU_STOCK_CHG — SALE/PURCHASE/RETURN/EXCHANGE/ADJUST/CLAIM/ADMIN)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_sku_stock_hist.chg_reason IS '변동사유 상세';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_sku_stock_hist.order_item_id IS '연관 주문상품ID (od_order_item.order_item_id, SALE/RETURN/EXCHANGE/CLAIM 시)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_sku_stock_hist.chg_by IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_sku_stock_hist.chg_date IS '처리일시';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_sku_stock_hist.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_sku_stock_hist.reg_date IS '등록일';

CREATE INDEX idx_pdh_prod_sku_stock_hist_date ON shopjoy_2604.pdh_prod_sku_stock_hist USING btree (chg_date);
CREATE INDEX idx_pdh_prod_sku_stock_hist_order ON shopjoy_2604.pdh_prod_sku_stock_hist USING btree (order_item_id) WHERE (order_item_id IS NOT NULL);
CREATE INDEX idx_pdh_prod_sku_stock_hist_prod ON shopjoy_2604.pdh_prod_sku_stock_hist USING btree (prod_id);
CREATE INDEX idx_pdh_prod_sku_stock_hist_reason ON shopjoy_2604.pdh_prod_sku_stock_hist USING btree (chg_reason_cd);
CREATE INDEX idx_pdh_prod_sku_stock_hist_sku ON shopjoy_2604.pdh_prod_sku_stock_hist USING btree (sku_id);
