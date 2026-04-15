CREATE TABLE ec_prod_hist (
    prod_hist_id    VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    prod_id         VARCHAR(16)     NOT NULL,
    chg_type        VARCHAR(30),                            -- PRICE / STOCK / STATUS
    before_val      TEXT,
    after_val       TEXT,
    chg_reason      VARCHAR(200),
    chg_by          VARCHAR(16),
    chg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (prod_hist_id)
);

COMMENT ON TABLE  ec_prod_hist              IS '상품 변경 이력';
COMMENT ON COLUMN ec_prod_hist.prod_hist_id IS '이력ID';
COMMENT ON COLUMN ec_prod_hist.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_prod_hist.prod_id      IS '상품ID';
COMMENT ON COLUMN ec_prod_hist.chg_type     IS '변경유형 (PRICE/STOCK/STATUS)';
COMMENT ON COLUMN ec_prod_hist.before_val   IS '변경전값';
COMMENT ON COLUMN ec_prod_hist.after_val    IS '변경후값';
COMMENT ON COLUMN ec_prod_hist.chg_reason   IS '변경사유';
COMMENT ON COLUMN ec_prod_hist.chg_by       IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN ec_prod_hist.chg_date     IS '처리일시';
COMMENT ON COLUMN ec_prod_hist.reg_by       IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_prod_hist.reg_date     IS '등록일';
COMMENT ON COLUMN ec_prod_hist.upd_by       IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN ec_prod_hist.upd_date     IS '수정일';
