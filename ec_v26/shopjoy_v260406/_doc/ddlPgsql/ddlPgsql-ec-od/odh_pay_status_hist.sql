-- ============================================================
-- ec_pay_status_hist : 결제 상태 이력 (결제 상태 변경만 추적)
-- 상태 변경: PENDING → COMPLT, COMPLT → REFUNDED 등
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE odh_pay_status_hist (
    pay_status_hist_id    VARCHAR(21)     NOT NULL,
    site_id               VARCHAR(21),                        -- sy_site.site_id
    pay_id                VARCHAR(21)     NOT NULL,           -- od_pay.
    order_id              VARCHAR(21)     NOT NULL,           -- od_order.
    pay_status_cd_before  VARCHAR(20),                        -- 변경 전 결제상태 (코드: PAY_STATUS)
    pay_status_cd         VARCHAR(20),                        -- 변경 후 결제상태 (코드: PAY_STATUS)
    status_reason         VARCHAR(300),                       -- 상태 변경 사유
    chg_user_id           VARCHAR(21),                        -- 변경 담당자 (sy_user.user_id, mb_member.member_id)
    chg_date              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    memo                  VARCHAR(300),
    reg_by                VARCHAR(30),
    reg_date              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                VARCHAR(30),
    upd_date              TIMESTAMP,
    PRIMARY KEY (pay_status_hist_id),
    CONSTRAINT fk_ec_pay_status_hist_pay FOREIGN KEY (pay_id) REFERENCES od_pay (pay_id)
);

COMMENT ON TABLE odh_pay_status_hist IS '결제 상태 이력 (결제 상태 변경만 추적)';
COMMENT ON COLUMN odh_pay_status_hist.pay_status_hist_id    IS '결제상태이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN odh_pay_status_hist.site_id               IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN odh_pay_status_hist.pay_id                IS '결제ID (od_pay.)';
COMMENT ON COLUMN odh_pay_status_hist.order_id              IS '주문ID (od_order.)';
COMMENT ON COLUMN odh_pay_status_hist.pay_status_cd_before  IS '변경 전 결제상태 (코드: PAY_STATUS)';
COMMENT ON COLUMN odh_pay_status_hist.pay_status_cd         IS '변경 후 결제상태 (코드: PAY_STATUS)';
COMMENT ON COLUMN odh_pay_status_hist.status_reason         IS '상태 변경 사유';
COMMENT ON COLUMN odh_pay_status_hist.chg_user_id           IS '변경 담당자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_pay_status_hist.chg_date              IS '변경 일시';
COMMENT ON COLUMN odh_pay_status_hist.memo                  IS '메모';
COMMENT ON COLUMN odh_pay_status_hist.reg_by                IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_pay_status_hist.reg_date              IS '등록일';
COMMENT ON COLUMN odh_pay_status_hist.upd_by                IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_pay_status_hist.upd_date              IS '수정일';

CREATE INDEX idx_odh_pay_status_hist_pay   ON odh_pay_status_hist (pay_id);
CREATE INDEX idx_odh_pay_status_hist_order ON odh_pay_status_hist (order_id);
CREATE INDEX idx_odh_pay_status_hist_date  ON odh_pay_status_hist (chg_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] odh_pay_status_hist.pay_status_cd (변경 후 결제상태) : PAY_STATUS { PENDING:대기, COMPLT:완료, FAILED:실패, CANCELLED:취소, PARTIAL_REFUND:부분환불, REFUNDED:전액환불 }
