CREATE TABLE pdh_prod_opt_sku_chg_hist (
    hist_id         VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    sku_id          VARCHAR(16)     NOT NULL,              -- FK: pd_prod_opt_sku.prod_opt_sku_id
    prod_id         VARCHAR(16)     NOT NULL,              -- FK: pd_prod.prod_idprod_id
    chg_type_cd     VARCHAR(30),                            -- 변경유형코드 (PRICE / STOCK / STATUS 등)
    before_val      TEXT,                                   -- 변경전값
    after_val       TEXT,                                   -- 변경후값
    chg_reason      VARCHAR(200),                           -- 변경사유
    chg_by          VARCHAR(16),                            -- 처리자 (sy_user.user_id)
    chg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP, -- 처리일시
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (hist_no)
);

COMMENT ON TABLE pdh_prod_opt_sku_chg_hist IS 'SKU 변경 이력 (가격/재고/상태)';
COMMENT ON COLUMN pdh_prod_opt_sku_chg_hist.hist_id      IS '이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pdh_prod_opt_sku_chg_hist.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pdh_prod_opt_sku_chg_hist.sku_id       IS 'SKU ID (pd_prod_opt_sku.)';
COMMENT ON COLUMN pdh_prod_opt_sku_chg_hist.prod_id      IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pdh_prod_opt_sku_chg_hist.chg_type_cd  IS '변경유형코드 (PRICE=가격, STOCK=재고, STATUS=상태)';
COMMENT ON COLUMN pdh_prod_opt_sku_chg_hist.before_val   IS '변경전값';
COMMENT ON COLUMN pdh_prod_opt_sku_chg_hist.after_val    IS '변경후값';
COMMENT ON COLUMN pdh_prod_opt_sku_chg_hist.chg_reason   IS '변경사유 (예: 가격인상, 재고입고, 옵션폐기)';
COMMENT ON COLUMN pdh_prod_opt_sku_chg_hist.chg_by       IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN pdh_prod_opt_sku_chg_hist.chg_date     IS '처리일시';
COMMENT ON COLUMN pdh_prod_opt_sku_chg_hist.reg_by       IS '등록자 (sy_user.user_id, mb_mem.member_id)';
COMMENT ON COLUMN pdh_prod_opt_sku_chg_hist.reg_date     IS '등록일';
COMMENT ON COLUMN pdh_prod_opt_sku_chg_hist.upd_by       IS '수정자 (sy_user.user_id, mb_mem.member_id)';
COMMENT ON COLUMN pdh_prod_opt_sku_chg_hist.upd_date     IS '수정일';

-- 변경 예시:
-- chg_type='PRICE', before_val='1000', after_val='1500', chg_reason='프로모션 가격인상'
-- chg_type='STOCK', before_val='50', after_val='30', chg_reason='판매'
-- chg_type='STATUS', before_val='Y', after_val='N', chg_reason='옵션폐기'
