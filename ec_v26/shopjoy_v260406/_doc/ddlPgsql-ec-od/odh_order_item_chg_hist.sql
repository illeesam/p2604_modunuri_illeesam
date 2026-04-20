-- ============================================================
-- ec_order_item_chg_hist : 주문 품목 변경 이력 (필드 단위 변경 추적)
--   chg_type 예: QTY / PRICE / OPT / STATUS / AMOUNT / COUPON
-- ============================================================
CREATE TABLE odh_order_item_chg_hist (
    order_item_chg_hist_id  VARCHAR(21)     NOT NULL,
    site_id                 VARCHAR(21),                            -- sy_site.site_id
    order_id                VARCHAR(21)     NOT NULL,               -- od_order.
    order_item_id           VARCHAR(21)     NOT NULL,               -- od_order_item.
    chg_type_cd             VARCHAR(30)     NOT NULL,               -- 변경유형코드 (QTY/PRICE/OPT/STATUS/AMOUNT/COUPON)
    chg_field               VARCHAR(50),                            -- 변경 필드명
    before_val              TEXT,                                   -- 변경전값
    after_val               TEXT,                                   -- 변경후값
    chg_reason              VARCHAR(300),                           -- 변경사유
    chg_user_id                  VARCHAR(21),                            -- 처리자 (sy_user.user_id)
    chg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by                  VARCHAR(30),
    reg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                  VARCHAR(30),
    upd_date                TIMESTAMP,
    PRIMARY KEY (order_item_chg_hist_id)
);

COMMENT ON TABLE odh_order_item_chg_hist IS '주문 품목 변경 이력';
COMMENT ON COLUMN odh_order_item_chg_hist.order_item_chg_hist_id  IS '이력ID';
COMMENT ON COLUMN odh_order_item_chg_hist.site_id                 IS '사이트ID';
COMMENT ON COLUMN odh_order_item_chg_hist.order_id                IS '주문ID (od_order.)';
COMMENT ON COLUMN odh_order_item_chg_hist.order_item_id           IS '주문품목ID (od_order_item.)';
COMMENT ON COLUMN odh_order_item_chg_hist.chg_type_cd             IS '변경유형코드 (QTY/PRICE/OPT/STATUS/AMOUNT/COUPON)';
COMMENT ON COLUMN odh_order_item_chg_hist.chg_field               IS '변경 필드명';
COMMENT ON COLUMN odh_order_item_chg_hist.before_val              IS '변경전값';
COMMENT ON COLUMN odh_order_item_chg_hist.after_val               IS '변경후값';
COMMENT ON COLUMN odh_order_item_chg_hist.chg_reason              IS '변경사유';
COMMENT ON COLUMN odh_order_item_chg_hist.chg_user_id                  IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN odh_order_item_chg_hist.chg_date                IS '처리일시';
COMMENT ON COLUMN odh_order_item_chg_hist.reg_by                  IS '등록자';
COMMENT ON COLUMN odh_order_item_chg_hist.reg_date                IS '등록일';
COMMENT ON COLUMN odh_order_item_chg_hist.upd_by                  IS '수정자';
COMMENT ON COLUMN odh_order_item_chg_hist.upd_date                IS '수정일';

CREATE INDEX idx_odh_order_item_chg_hist_order ON odh_order_item_chg_hist (order_id);
CREATE INDEX idx_odh_order_item_chg_hist_item  ON odh_order_item_chg_hist (order_item_id);
CREATE INDEX idx_odh_order_item_chg_hist_type  ON odh_order_item_chg_hist (chg_type_cd);
CREATE INDEX idx_odh_order_item_chg_hist_date  ON odh_order_item_chg_hist (chg_date);
