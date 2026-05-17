-- odh_pay_status_hist 테이블 DDL
-- 결제 상태 이력 (결제 상태 변경만 추적)

CREATE TABLE shopjoy_2604.odh_pay_status_hist (
    pay_status_hist_id   VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id              VARCHAR(21)  NOT NULL,
    pay_id               VARCHAR(21)  NOT NULL,
    order_id             VARCHAR(21)  NOT NULL,
    pay_status_cd_before VARCHAR(20) ,
    pay_status_cd        VARCHAR(20) ,
    status_reason        VARCHAR(300),
    chg_user_id          VARCHAR(21) ,
    chg_date             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    memo                 VARCHAR(300),
    reg_by               VARCHAR(30) ,
    reg_date             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by               VARCHAR(30) ,
    upd_date             TIMESTAMP   ,
    CONSTRAINT fk_ec_pay_status_hist_pay FOREIGN KEY (pay_id) REFERENCES shopjoy_2604.od_pay (pay_id)
);

COMMENT ON TABLE  shopjoy_2604.odh_pay_status_hist IS '결제 상태 이력 (결제 상태 변경만 추적)';
COMMENT ON COLUMN shopjoy_2604.odh_pay_status_hist.pay_status_hist_id IS '결제상태이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.odh_pay_status_hist.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.odh_pay_status_hist.pay_id IS '결제ID (od_pay.)';
COMMENT ON COLUMN shopjoy_2604.odh_pay_status_hist.order_id IS '주문ID (od_order.)';
COMMENT ON COLUMN shopjoy_2604.odh_pay_status_hist.pay_status_cd_before IS '변경 전 결제상태 (코드: PAY_STATUS)';
COMMENT ON COLUMN shopjoy_2604.odh_pay_status_hist.pay_status_cd IS '변경 후 결제상태 (코드: PAY_STATUS)';
COMMENT ON COLUMN shopjoy_2604.odh_pay_status_hist.status_reason IS '상태 변경 사유';
COMMENT ON COLUMN shopjoy_2604.odh_pay_status_hist.chg_user_id IS '변경 담당자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.odh_pay_status_hist.chg_date IS '변경 일시';
COMMENT ON COLUMN shopjoy_2604.odh_pay_status_hist.memo IS '메모';
COMMENT ON COLUMN shopjoy_2604.odh_pay_status_hist.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.odh_pay_status_hist.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.odh_pay_status_hist.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.odh_pay_status_hist.upd_date IS '수정일';

CREATE INDEX idx_odh_pay_status_hist_date ON shopjoy_2604.odh_pay_status_hist USING btree (chg_date);
CREATE INDEX idx_odh_pay_status_hist_order ON shopjoy_2604.odh_pay_status_hist USING btree (order_id);
CREATE INDEX idx_odh_pay_status_hist_pay ON shopjoy_2604.odh_pay_status_hist USING btree (pay_id);
CREATE INDEX idx_odh_pay_status_hist_site ON shopjoy_2604.odh_pay_status_hist USING btree (site_id);
