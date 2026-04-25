-- ============================================================
-- ec_pay_chg_hist : 결제 변경 이력 (모든 결제 변경 추적)
-- 변경유형: 승인(APPROVE), 완료(COMPLETE), 실패(FAIL), 환불(REFUND), 취소(CANCEL), 재시도(RETRY) 등
-- 상태 변경 외 모든 변경사항 기록 (PG 응답, 환불 등)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE odh_pay_chg_hist (
    pay_chg_hist_id     VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    pay_id              VARCHAR(21)     NOT NULL,               -- od_pay.
    order_id            VARCHAR(21)     NOT NULL,               -- od_order.
    pay_status_cd_before VARCHAR(20),                           -- 변경 전 결제상태 (PAY_STATUS)
    pay_status_cd_after VARCHAR(20),                            -- 변경 후 결제상태 (PAY_STATUS)
    chg_type_cd         VARCHAR(30)     NOT NULL,               -- 코드: PAYMENT_CHG_TYPE
                                                                 -- (APPROVE=승인, COMPLETE=완료, FAIL=실패,
                                                                 --  REFUND=환불, CANCEL=취소, RETRY=재시도)
    chg_reason          VARCHAR(300),                           -- 변경 사유
    pg_response         TEXT,                                   -- PG 응답 데이터 (JSON)
    refund_amt          BIGINT,                                 -- 환불 금액 (환불 시만)
    refund_pg_tid       VARCHAR(100),                           -- 환불 거래 ID (환불 시만)
    chg_user_id         VARCHAR(21),                            -- 변경 담당자 (sy_user.user_id, mb_member.member_id)
    chg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    memo                VARCHAR(300),
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (pay_chg_hist_id),
    CONSTRAINT fk_ec_pay_chg_hist_pay FOREIGN KEY (pay_id) REFERENCES od_pay (pay_id)
);

COMMENT ON TABLE odh_pay_chg_hist IS '결제 변경 이력 (모든 결제 변경사항 추적)';
COMMENT ON COLUMN odh_pay_chg_hist.pay_chg_hist_id     IS '결제변경이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN odh_pay_chg_hist.site_id             IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN odh_pay_chg_hist.pay_id              IS '결제ID (od_pay.)';
COMMENT ON COLUMN odh_pay_chg_hist.order_id            IS '주문ID (od_order.)';
COMMENT ON COLUMN odh_pay_chg_hist.pay_status_cd_before IS '변경 전 결제상태 (코드: PAY_STATUS)';
COMMENT ON COLUMN odh_pay_chg_hist.pay_status_cd_after  IS '변경 후 결제상태 (코드: PAY_STATUS)';
COMMENT ON COLUMN odh_pay_chg_hist.chg_type_cd         IS '변경유형 (코드: PAYMENT_CHG_TYPE)';
COMMENT ON COLUMN odh_pay_chg_hist.chg_reason          IS '변경 사유 (예: PG 승인 완료, 수동 환불 등)';
COMMENT ON COLUMN odh_pay_chg_hist.pg_response         IS 'PG 응답 데이터 (JSON)';
COMMENT ON COLUMN odh_pay_chg_hist.refund_amt          IS '환불 금액 (환불 시만)';
COMMENT ON COLUMN odh_pay_chg_hist.refund_pg_tid       IS '환불 거래ID (환불 시 PG로부터 받은 ID)';
COMMENT ON COLUMN odh_pay_chg_hist.chg_user_id         IS '변경 담당자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_pay_chg_hist.chg_date            IS '변경 일시';
COMMENT ON COLUMN odh_pay_chg_hist.memo                IS '메모';
COMMENT ON COLUMN odh_pay_chg_hist.reg_by              IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_pay_chg_hist.reg_date            IS '등록일';
COMMENT ON COLUMN odh_pay_chg_hist.upd_by              IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_pay_chg_hist.upd_date            IS '수정일';

CREATE INDEX idx_odh_pay_chg_hist_pay        ON odh_pay_chg_hist (pay_id);
CREATE INDEX idx_odh_pay_chg_hist_order      ON odh_pay_chg_hist (order_id);
CREATE INDEX idx_odh_pay_chg_hist_chg_type   ON odh_pay_chg_hist (chg_type_cd);
CREATE INDEX idx_odh_pay_chg_hist_date       ON odh_pay_chg_hist (chg_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] odh_pay_chg_hist.chg_type_cd (변경유형) : PAY_CHG_TYPE { STATUS:상태변경, METHOD:수단변경, AMOUNT:금액변경 }
