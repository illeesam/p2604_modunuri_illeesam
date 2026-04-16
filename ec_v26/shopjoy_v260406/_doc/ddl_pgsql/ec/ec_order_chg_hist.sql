-- ============================================================
-- ec_order_chg_hist : 주문 변경 이력 (필드 단위 변경 추적)
--   chg_type 예: PAY_METHOD / RECV_INFO / AMOUNT / MEMO / COUPON / CACHE / APPROVAL
-- ============================================================
CREATE TABLE ec_order_chg_hist (
    order_chg_hist_id  VARCHAR(16)     NOT NULL,
    site_id            VARCHAR(16),                            -- sy_site.site_id
    order_id           VARCHAR(16)     NOT NULL,
    chg_type           VARCHAR(30)     NOT NULL,               -- 변경유형 (PAY_METHOD/RECV_INFO/AMOUNT/MEMO/COUPON/CACHE/APPROVAL)
    chg_field          VARCHAR(50),                            -- 변경 필드명 (예: pay_method_cd, recv_addr)
    before_val         TEXT,                                   -- 변경전값
    after_val          TEXT,                                   -- 변경후값
    chg_reason         VARCHAR(300),                           -- 변경사유
    chg_user_id             VARCHAR(16),                            -- 처리자 (sy_user.user_id)
    chg_date           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by             VARCHAR(16),
    reg_date           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by             VARCHAR(16),
    upd_date           TIMESTAMP,
    PRIMARY KEY (order_chg_hist_id)
);

COMMENT ON TABLE  ec_order_chg_hist                    IS '주문 변경 이력';
COMMENT ON COLUMN ec_order_chg_hist.order_chg_hist_id  IS '이력ID';
COMMENT ON COLUMN ec_order_chg_hist.site_id            IS '사이트ID';
COMMENT ON COLUMN ec_order_chg_hist.order_id           IS '주문ID';
COMMENT ON COLUMN ec_order_chg_hist.chg_type           IS '변경유형 (PAY_METHOD/RECV_INFO/AMOUNT/MEMO/COUPON/CACHE/APPROVAL)';
COMMENT ON COLUMN ec_order_chg_hist.chg_field          IS '변경 필드명';
COMMENT ON COLUMN ec_order_chg_hist.before_val         IS '변경전값';
COMMENT ON COLUMN ec_order_chg_hist.after_val          IS '변경후값';
COMMENT ON COLUMN ec_order_chg_hist.chg_reason         IS '변경사유';
COMMENT ON COLUMN ec_order_chg_hist.chg_user_id             IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN ec_order_chg_hist.chg_date           IS '처리일시';
COMMENT ON COLUMN ec_order_chg_hist.reg_by             IS '등록자';
COMMENT ON COLUMN ec_order_chg_hist.reg_date           IS '등록일';
COMMENT ON COLUMN ec_order_chg_hist.upd_by             IS '수정자';
COMMENT ON COLUMN ec_order_chg_hist.upd_date           IS '수정일';

CREATE INDEX idx_ec_order_chg_hist_order ON ec_order_chg_hist (order_id);
CREATE INDEX idx_ec_order_chg_hist_type  ON ec_order_chg_hist (chg_type);
CREATE INDEX idx_ec_order_chg_hist_date  ON ec_order_chg_hist (chg_date);
