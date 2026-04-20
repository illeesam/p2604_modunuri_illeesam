-- SKU 가격 변경 이력
CREATE TABLE pdh_prod_sku_price_hist (
    hist_id             VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    sku_id              VARCHAR(21)     NOT NULL,               -- pd_prod_sku.sku_id
    prod_id             VARCHAR(21)     NOT NULL,               -- pd_prod.prod_id
    add_price_before    BIGINT          NOT NULL,               -- 변경 전 추가금액
    add_price_after     BIGINT          NOT NULL,               -- 변경 후 추가금액
    chg_reason          VARCHAR(200),                           -- 변경사유 (예: 가격인상, 프로모션 종료)
    chg_by              VARCHAR(21),                            -- 처리자 (sy_user.user_id)
    chg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (hist_id)
);

COMMENT ON TABLE pdh_prod_sku_price_hist IS 'SKU 가격 변경 이력';
COMMENT ON COLUMN pdh_prod_sku_price_hist.hist_id           IS '이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pdh_prod_sku_price_hist.site_id           IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pdh_prod_sku_price_hist.sku_id            IS 'SKU ID (pd_prod_sku.sku_id)';
COMMENT ON COLUMN pdh_prod_sku_price_hist.prod_id           IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pdh_prod_sku_price_hist.add_price_before  IS '변경 전 옵션 추가금액';
COMMENT ON COLUMN pdh_prod_sku_price_hist.add_price_after   IS '변경 후 옵션 추가금액';
COMMENT ON COLUMN pdh_prod_sku_price_hist.chg_reason        IS '변경사유';
COMMENT ON COLUMN pdh_prod_sku_price_hist.chg_by            IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN pdh_prod_sku_price_hist.chg_date          IS '처리일시';
COMMENT ON COLUMN pdh_prod_sku_price_hist.reg_by            IS '등록자';
COMMENT ON COLUMN pdh_prod_sku_price_hist.reg_date          IS '등록일';
COMMENT ON COLUMN pdh_prod_sku_price_hist.upd_by   IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pdh_prod_sku_price_hist.upd_date IS '수정일';

CREATE INDEX idx_pdh_prod_sku_price_hist_sku  ON pdh_prod_sku_price_hist (sku_id);
CREATE INDEX idx_pdh_prod_sku_price_hist_prod ON pdh_prod_sku_price_hist (prod_id);
CREATE INDEX idx_pdh_prod_sku_price_hist_date ON pdh_prod_sku_price_hist (chg_date);
