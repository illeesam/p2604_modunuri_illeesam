-- od_refund_method 테이블 DDL
-- 환불수단 내역 (수단별 환불금액 및 우선순위)

CREATE TABLE shopjoy_2604.od_refund_method (
    refund_method_id        VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id                 VARCHAR(21)  NOT NULL,
    refund_id               VARCHAR(21)  NOT NULL,
    order_id                VARCHAR(21)  NOT NULL,
    pay_method_cd           VARCHAR(20)  NOT NULL,
    refund_priority         INTEGER      DEFAULT 1,
    refund_amt              BIGINT       DEFAULT 0,
    refund_avail_amt        BIGINT       DEFAULT 0,
    refund_status_cd        VARCHAR(20)  DEFAULT 'PENDING'::character varying,
    refund_status_cd_before VARCHAR(20) ,
    refund_date             TIMESTAMP   ,
    pay_id                  VARCHAR(21) ,
    pg_refund_id            VARCHAR(100),
    pg_response             TEXT        ,
    reg_by                  VARCHAR(30) ,
    reg_date                TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by                  VARCHAR(30) ,
    upd_date                TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.od_refund_method IS '환불수단 내역 (수단별 환불금액 및 우선순위)';
COMMENT ON COLUMN shopjoy_2604.od_refund_method.refund_method_id IS '환불수단ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.od_refund_method.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.od_refund_method.refund_id IS '환불ID (od_refund.refund_id)';
COMMENT ON COLUMN shopjoy_2604.od_refund_method.order_id IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN shopjoy_2604.od_refund_method.pay_method_cd IS '결제수단코드 (코드: PAY_METHOD — BANK_TRANSFER/VBANK/TOSS/KAKAO/NAVER/MOBILE/CACHE/SAVE)';
COMMENT ON COLUMN shopjoy_2604.od_refund_method.refund_priority IS '환불 우선순위 (1=카드·현금성 결제수단, 2=캐쉬, 3=적립금)';
COMMENT ON COLUMN shopjoy_2604.od_refund_method.refund_amt IS '해당 수단으로 환불할 금액';
COMMENT ON COLUMN shopjoy_2604.od_refund_method.refund_avail_amt IS '해당 수단 잔여 환불 가능금액 (원 결제액 - 기환불 누적액)';
COMMENT ON COLUMN shopjoy_2604.od_refund_method.refund_status_cd IS '수단별 환불상태 (코드: REFUND_STATUS — PENDING/COMPLT/FAILED)';
COMMENT ON COLUMN shopjoy_2604.od_refund_method.refund_status_cd_before IS '변경 전 환불상태 (코드: REFUND_STATUS)';
COMMENT ON COLUMN shopjoy_2604.od_refund_method.refund_date IS '해당 수단 환불 완료일시';
COMMENT ON COLUMN shopjoy_2604.od_refund_method.pay_id IS '원 결제 레코드ID (od_pay.pay_id)';
COMMENT ON COLUMN shopjoy_2604.od_refund_method.pg_refund_id IS 'PG 환불 거래ID';
COMMENT ON COLUMN shopjoy_2604.od_refund_method.pg_response IS 'PG 환불 응답 JSON';
COMMENT ON COLUMN shopjoy_2604.od_refund_method.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.od_refund_method.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.od_refund_method.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.od_refund_method.upd_date IS '수정일시';

CREATE INDEX idx_od_refund_method_order ON shopjoy_2604.od_refund_method USING btree (order_id);
CREATE INDEX idx_od_refund_method_pay ON shopjoy_2604.od_refund_method USING btree (pay_id) WHERE (pay_id IS NOT NULL);
CREATE INDEX idx_od_refund_method_prio ON shopjoy_2604.od_refund_method USING btree (refund_id, refund_priority);
CREATE INDEX idx_od_refund_method_refund ON shopjoy_2604.od_refund_method USING btree (refund_id);
CREATE INDEX idx_od_refund_method_site ON shopjoy_2604.od_refund_method USING btree (site_id);
CREATE INDEX idx_od_refund_method_status ON shopjoy_2604.od_refund_method USING btree (refund_status_cd);
