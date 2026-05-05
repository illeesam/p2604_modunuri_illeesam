-- pdh_prod_status_hist 테이블 DDL
-- 상품 상태 이력

CREATE TABLE shopjoy_2604.pdh_prod_status_hist (
    prod_status_hist_id VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id             VARCHAR(21) ,
    prod_id             VARCHAR(21)  NOT NULL,
    before_status_cd    VARCHAR(20) ,
    after_status_cd     VARCHAR(20)  NOT NULL,
    memo                VARCHAR(300),
    proc_user_id        VARCHAR(21) ,
    proc_date           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    reg_by              VARCHAR(30) ,
    reg_date            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30) ,
    upd_date            TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.pdh_prod_status_hist IS '상품 상태 이력';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_status_hist.prod_status_hist_id IS '이력ID';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_status_hist.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_status_hist.prod_id IS '상품ID';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_status_hist.before_status_cd IS '이전상태 (코드: PRODUCT_STATUS)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_status_hist.after_status_cd IS '변경상태 (코드: PRODUCT_STATUS)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_status_hist.memo IS '처리메모';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_status_hist.proc_user_id IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_status_hist.proc_date IS '처리일시';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_status_hist.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_status_hist.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_status_hist.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.pdh_prod_status_hist.upd_date IS '수정일';

CREATE INDEX idx_pdh_prod_status_hist_date ON shopjoy_2604.pdh_prod_status_hist USING btree (proc_date);
CREATE INDEX idx_pdh_prod_status_hist_prod ON shopjoy_2604.pdh_prod_status_hist USING btree (prod_id);
