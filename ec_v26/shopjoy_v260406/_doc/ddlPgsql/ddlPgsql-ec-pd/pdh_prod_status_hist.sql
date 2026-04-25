-- ============================================================
-- ec_prod_status_hist : 상품 상태 이력 (status_cd 변경 추적)
-- ============================================================
CREATE TABLE pdh_prod_status_hist (
    prod_status_hist_id  VARCHAR(21)     NOT NULL,
    site_id              VARCHAR(21),                            -- sy_site.site_id
    prod_id              VARCHAR(21)     NOT NULL,
    before_status_cd     VARCHAR(20),                            -- 이전 상태 (코드: PRODUCT_STATUS)
    after_status_cd      VARCHAR(20)     NOT NULL,               -- 변경 상태
    memo                 VARCHAR(300),                           -- 처리 메모
    proc_user_id              VARCHAR(21),                            -- 처리자 (sy_user.user_id)
    proc_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by               VARCHAR(30),
    reg_date             TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by               VARCHAR(30),
    upd_date             TIMESTAMP,
    PRIMARY KEY (prod_status_hist_id)
);

COMMENT ON TABLE pdh_prod_status_hist IS '상품 상태 이력';
COMMENT ON COLUMN pdh_prod_status_hist.prod_status_hist_id IS '이력ID';
COMMENT ON COLUMN pdh_prod_status_hist.site_id             IS '사이트ID';
COMMENT ON COLUMN pdh_prod_status_hist.prod_id             IS '상품ID';
COMMENT ON COLUMN pdh_prod_status_hist.before_status_cd    IS '이전상태 (코드: PRODUCT_STATUS)';
COMMENT ON COLUMN pdh_prod_status_hist.after_status_cd     IS '변경상태 (코드: PRODUCT_STATUS)';
COMMENT ON COLUMN pdh_prod_status_hist.memo                IS '처리메모';
COMMENT ON COLUMN pdh_prod_status_hist.proc_user_id             IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN pdh_prod_status_hist.proc_date           IS '처리일시';
COMMENT ON COLUMN pdh_prod_status_hist.reg_by              IS '등록자';
COMMENT ON COLUMN pdh_prod_status_hist.reg_date            IS '등록일';
COMMENT ON COLUMN pdh_prod_status_hist.upd_by              IS '수정자';
COMMENT ON COLUMN pdh_prod_status_hist.upd_date            IS '수정일';

CREATE INDEX idx_pdh_prod_status_hist_prod ON pdh_prod_status_hist (prod_id);
CREATE INDEX idx_pdh_prod_status_hist_date ON pdh_prod_status_hist (proc_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pdh_prod_status_hist.before_status_cd (이전상태) : 상품상태 { ON_SALE:판매중, PREPARING:준비중, SOLD_OUT:품절, SUSPENDED:판매중지 }
-- [CODES] pdh_prod_status_hist.after_status_cd (변경상태) : 상품상태 { ON_SALE:판매중, PREPARING:준비중, SOLD_OUT:품절, SUSPENDED:판매중지 }
