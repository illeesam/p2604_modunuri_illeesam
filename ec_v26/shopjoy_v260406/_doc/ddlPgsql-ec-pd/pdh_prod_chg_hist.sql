CREATE TABLE pdh_prod_chg_hist (
    prod_chg_hist_id    VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    prod_id         VARCHAR(21)     NOT NULL,
    chg_type_cd     VARCHAR(30),                            -- 변경유형코드 (PRICE / STOCK / STATUS)
    before_val      TEXT,
    after_val       TEXT,
    chg_reason      VARCHAR(200),
    chg_user_id          VARCHAR(21),
    chg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (prod_chg_hist_id)
);

COMMENT ON TABLE pdh_prod_chg_hist IS '상품 변경 이력';
COMMENT ON COLUMN pdh_prod_chg_hist.prod_chg_hist_id IS '이력ID';
COMMENT ON COLUMN pdh_prod_chg_hist.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pdh_prod_chg_hist.prod_id      IS '상품ID';
COMMENT ON COLUMN pdh_prod_chg_hist.chg_type_cd  IS '변경유형코드 (PRICE/STOCK/STATUS)';
COMMENT ON COLUMN pdh_prod_chg_hist.before_val   IS '변경전값';
COMMENT ON COLUMN pdh_prod_chg_hist.after_val    IS '변경후값';
COMMENT ON COLUMN pdh_prod_chg_hist.chg_reason   IS '변경사유';
COMMENT ON COLUMN pdh_prod_chg_hist.chg_user_id       IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN pdh_prod_chg_hist.chg_date     IS '처리일시';
COMMENT ON COLUMN pdh_prod_chg_hist.reg_by       IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pdh_prod_chg_hist.reg_date     IS '등록일';
COMMENT ON COLUMN pdh_prod_chg_hist.upd_by       IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pdh_prod_chg_hist.upd_date     IS '수정일';
