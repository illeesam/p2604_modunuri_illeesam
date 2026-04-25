-- SKU 상태 변경 이력 (use_yn Y/N 등 상태 변경)
-- 가격 변경 → pdh_prod_sku_price_hist
-- 재고 변경 → pdh_prod_sku_stock_hist
CREATE TABLE pdh_prod_sku_chg_hist (
    hist_id         VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    sku_id          VARCHAR(21)     NOT NULL,               -- pd_prod_sku.sku_id
    prod_id         VARCHAR(21)     NOT NULL,               -- pd_prod.prod_id
    chg_type_cd     VARCHAR(30)     NOT NULL,               -- 변경유형 (코드: SKU_CHG_TYPE — STATUS 등)
    before_val      VARCHAR(100),                           -- 변경 전 값
    after_val       VARCHAR(100),                           -- 변경 후 값
    chg_reason      VARCHAR(200),                           -- 변경사유
    chg_by          VARCHAR(21),                            -- 처리자 (sy_user.user_id)
    chg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (hist_id)
);

COMMENT ON TABLE pdh_prod_sku_chg_hist IS 'SKU 상태 변경 이력 (가격→price_hist, 재고→stock_hist)';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.hist_id      IS '이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.sku_id       IS 'SKU ID (pd_prod_sku.sku_id)';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.prod_id      IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.chg_type_cd  IS '변경유형 (코드: SKU_CHG_TYPE — STATUS 등)';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.before_val   IS '변경 전 값';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.after_val    IS '변경 후 값';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.chg_reason   IS '변경사유';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.chg_by       IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.chg_date     IS '처리일시';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.reg_by       IS '등록자';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.reg_date     IS '등록일';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.upd_by   IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pdh_prod_sku_chg_hist.upd_date IS '수정일';

CREATE INDEX idx_pdh_prod_sku_chg_hist_sku  ON pdh_prod_sku_chg_hist (sku_id);
CREATE INDEX idx_pdh_prod_sku_chg_hist_prod ON pdh_prod_sku_chg_hist (prod_id);
