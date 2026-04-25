-- ============================================================
-- od_refund_method : 환불수단 내역
-- 환불 1건에 대해 결제수단별(카드/캐쉬/적립금) 환불금액을 기록
-- 우선순위: 카드(1) → 캐쉬(2) → 적립금(3)
-- ============================================================
CREATE TABLE od_refund_method (
    refund_method_id    VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    refund_id           VARCHAR(21)     NOT NULL,               -- od_refund.refund_id
    order_id            VARCHAR(21)     NOT NULL,               -- od_order.order_id (조회 편의)
    -- ── 수단 정보 ──
    pay_method_cd       VARCHAR(20)     NOT NULL,               -- 코드: PAY_METHOD (BANK_TRANSFER/VBANK/TOSS/KAKAO/NAVER/MOBILE/CACHE/SAVE)
                                                                --   CACHE : 캐쉬(충전금) 차감분 환불
                                                                --   SAVE  : 적립금 차감분 환불
    refund_priority     SMALLINT        DEFAULT 1,              -- 환불 우선순위 (1=카드/현금성, 2=캐쉬, 3=적립금)
    -- ── 금액 ──
    refund_amt          BIGINT          DEFAULT 0,              -- 해당 수단으로 환불할 금액
    refund_avail_amt    BIGINT          DEFAULT 0,              -- 해당 수단 잔여 환불 가능금액 (원 결제금액 - 기환불액)
    -- ── 처리 정보 ──
    refund_status_cd    VARCHAR(20)     DEFAULT 'PENDING',      -- 코드: REFUND_STATUS (PENDING/COMPLT/FAILED)
    refund_status_cd_before VARCHAR(20),
    refund_date         TIMESTAMP,                              -- 해당 수단 환불 완료일시
    -- ── PG/내부 처리 참조 ──
    pay_id              VARCHAR(21),                            -- od_pay.pay_id (원 결제 레코드 참조)
    pg_refund_id        VARCHAR(100),                           -- PG 환불 거래ID
    pg_response         TEXT,                                   -- PG 환불 응답 JSON
    -- ── 기본 ──
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (refund_method_id)
);

COMMENT ON TABLE od_refund_method IS '환불수단 내역 (수단별 환불금액 및 우선순위)';
COMMENT ON COLUMN od_refund_method.refund_method_id  IS '환불수단ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN od_refund_method.site_id           IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN od_refund_method.refund_id         IS '환불ID (od_refund.refund_id)';
COMMENT ON COLUMN od_refund_method.order_id          IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN od_refund_method.pay_method_cd     IS '결제수단코드 (코드: PAY_METHOD — BANK_TRANSFER/VBANK/TOSS/KAKAO/NAVER/MOBILE/CACHE/SAVE)';
COMMENT ON COLUMN od_refund_method.refund_priority   IS '환불 우선순위 (1=카드·현금성 결제수단, 2=캐쉬, 3=적립금)';
COMMENT ON COLUMN od_refund_method.refund_amt        IS '해당 수단으로 환불할 금액';
COMMENT ON COLUMN od_refund_method.refund_avail_amt  IS '해당 수단 잔여 환불 가능금액 (원 결제액 - 기환불 누적액)';
COMMENT ON COLUMN od_refund_method.refund_status_cd  IS '수단별 환불상태 (코드: REFUND_STATUS — PENDING/COMPLT/FAILED)';
COMMENT ON COLUMN od_refund_method.refund_status_cd_before IS '변경 전 환불상태 (코드: REFUND_STATUS)';
COMMENT ON COLUMN od_refund_method.refund_date       IS '해당 수단 환불 완료일시';
COMMENT ON COLUMN od_refund_method.pay_id            IS '원 결제 레코드ID (od_pay.pay_id)';
COMMENT ON COLUMN od_refund_method.pg_refund_id      IS 'PG 환불 거래ID';
COMMENT ON COLUMN od_refund_method.pg_response       IS 'PG 환불 응답 JSON';
COMMENT ON COLUMN od_refund_method.reg_by            IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_refund_method.reg_date          IS '등록일시';
COMMENT ON COLUMN od_refund_method.upd_by            IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_refund_method.upd_date          IS '수정일시';

CREATE INDEX idx_od_refund_method_refund  ON od_refund_method (refund_id);
CREATE INDEX idx_od_refund_method_order   ON od_refund_method (order_id);
CREATE INDEX idx_od_refund_method_pay     ON od_refund_method (pay_id) WHERE pay_id IS NOT NULL;
CREATE INDEX idx_od_refund_method_status  ON od_refund_method (refund_status_cd);
CREATE INDEX idx_od_refund_method_prio    ON od_refund_method (refund_id, refund_priority);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] od_refund_method.pay_method_cd (결제수단코드) : 결제수단 { BANK_TRANSFER:무통장입금, VBANK:가상계좌, TOSS:토스페이먼츠, KAKAO:카카오페이, NAVER:네이버페이, MOBILE:핸드폰결제, SAVE:적립금결제, ZERO:0원결제 }
-- [CODES] od_refund_method.refund_status_cd (수단별 환불상태) : REFUND_STATUS { PENDING:대기, COMPLT:완료, FAILED:실패 }
