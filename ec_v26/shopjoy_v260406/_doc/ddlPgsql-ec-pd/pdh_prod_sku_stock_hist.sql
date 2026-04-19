-- SKU 재고 변경 이력
CREATE TABLE pdh_prod_sku_stock_hist (
    hist_id             VARCHAR(16)     NOT NULL,
    site_id             VARCHAR(16),                            -- sy_site.site_id
    sku_id              VARCHAR(16)     NOT NULL,               -- pd_prod_sku.sku_id
    prod_id             VARCHAR(16)     NOT NULL,               -- pd_prod.prod_id
    stock_before        INTEGER         NOT NULL,               -- 변경 전 재고수량
    stock_after         INTEGER         NOT NULL,               -- 변경 후 재고수량
    chg_qty             INTEGER         NOT NULL,               -- 변동수량 (양수=입고, 음수=출고)
    chg_reason_cd       VARCHAR(20)     NOT NULL,               -- 코드: SKU_STOCK_CHG (변동사유)
    chg_reason          VARCHAR(200),                           -- 변동사유 상세
    order_item_id       VARCHAR(16),                            -- 연관 주문상품ID (SALE/RETURN/EXCHANGE/CLAIM 시)
    chg_by              VARCHAR(16),                            -- 처리자 (sy_user.user_id)
    chg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by              VARCHAR(16),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (hist_id)
);

COMMENT ON TABLE pdh_prod_sku_stock_hist IS 'SKU 재고 변경 이력';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.hist_id          IS '이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.site_id          IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.sku_id           IS 'SKU ID (pd_prod_sku.sku_id)';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.prod_id          IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.stock_before     IS '변경 전 재고수량';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.stock_after      IS '변경 후 재고수량';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.chg_qty          IS '변동수량 (양수=입고, 음수=출고/판매)';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.chg_reason_cd    IS '변동사유 (코드: SKU_STOCK_CHG — SALE/PURCHASE/RETURN/EXCHANGE/ADJUST/CLAIM/ADMIN)';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.chg_reason       IS '변동사유 상세';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.order_item_id    IS '연관 주문상품ID (od_order_item.order_item_id, SALE/RETURN/EXCHANGE/CLAIM 시)';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.chg_by           IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.chg_date         IS '처리일시';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.reg_by           IS '등록자';
COMMENT ON COLUMN pdh_prod_sku_stock_hist.reg_date         IS '등록일';

CREATE INDEX idx_pdh_prod_sku_stock_hist_sku    ON pdh_prod_sku_stock_hist (sku_id);
CREATE INDEX idx_pdh_prod_sku_stock_hist_prod   ON pdh_prod_sku_stock_hist (prod_id);
CREATE INDEX idx_pdh_prod_sku_stock_hist_date   ON pdh_prod_sku_stock_hist (chg_date);
CREATE INDEX idx_pdh_prod_sku_stock_hist_reason ON pdh_prod_sku_stock_hist (chg_reason_cd);
CREATE INDEX idx_pdh_prod_sku_stock_hist_order  ON pdh_prod_sku_stock_hist (order_item_id) WHERE order_item_id IS NOT NULL;

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pdh_prod_sku_stock_hist.chg_reason_cd (변동사유) : SKU_STOCK_CHG:
--   SALE     : 판매 (주문)
--   PURCHASE : 매입/입고
--   RETURN   : 반품 입고
--   EXCHANGE : 교환 (출고/입고)
--   CLAIM    : 클레임 처리
--   ADJUST   : 재고조정 (실사 후 보정)
--   ADMIN    : 관리자 수동변경
