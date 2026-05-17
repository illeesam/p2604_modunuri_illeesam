-- od_pay 테이블 DDL
-- 결제 (주문당 N건 결제 가능 — 분할결제)

CREATE TABLE shopjoy_2604.od_pay (
    pay_id                  VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id                 VARCHAR(21)  NOT NULL,
    order_id                VARCHAR(21)  NOT NULL,
    claim_id                VARCHAR(21) ,
    pay_div_cd              VARCHAR(20) ,
    pay_dir_cd              VARCHAR(20) ,
    pay_occur_type_cd       VARCHAR(20) ,
    pay_method_cd           VARCHAR(20)  NOT NULL,
    pay_channel_cd          VARCHAR(20) ,
    pay_amt                 BIGINT       NOT NULL,
    pay_status_cd           VARCHAR(20)  DEFAULT 'PENDING'::character varying,
    pay_status_cd_before    VARCHAR(20) ,
    pay_date                TIMESTAMP   ,
    pg_company_cd           VARCHAR(20) ,
    pg_transaction_id       VARCHAR(100),
    pg_approval_no          VARCHAR(50) ,
    pg_response             TEXT        ,
    vbank_account           VARCHAR(20) ,
    vbank_bank_code         VARCHAR(10) ,
    vbank_bank_nm           VARCHAR(50) ,
    vbank_holder_nm         VARCHAR(50) ,
    vbank_due_date          DATE        ,
    vbank_deposit_nm        VARCHAR(50) ,
    vbank_deposit_date      TIMESTAMP   ,
    card_no                 VARCHAR(20) ,
    card_issuer_cd          VARCHAR(20) ,
    card_issuer_nm          VARCHAR(50) ,
    card_type_cd            VARCHAR(20) ,
    installment_month       INTEGER      DEFAULT 0,
    refund_amt              BIGINT       DEFAULT 0,
    refund_status_cd        VARCHAR(20) ,
    refund_status_cd_before VARCHAR(20) ,
    refund_date             TIMESTAMP   ,
    refund_reason           VARCHAR(300),
    failure_reason          VARCHAR(500),
    failure_code            VARCHAR(50) ,
    failure_date            TIMESTAMP   ,
    memo                    VARCHAR(300),
    reg_by                  VARCHAR(30) ,
    reg_date                TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by                  VARCHAR(30) ,
    upd_date                TIMESTAMP   ,
    CONSTRAINT fk_od_pay_order FOREIGN KEY (order_id) REFERENCES shopjoy_2604.od_order (order_id)
);

COMMENT ON TABLE  shopjoy_2604.od_pay IS '결제 (주문당 N건 결제 가능 — 분할결제)';
COMMENT ON COLUMN shopjoy_2604.od_pay.pay_id IS '결제ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.od_pay.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.od_pay.order_id IS '주문ID (od_order.)';
COMMENT ON COLUMN shopjoy_2604.od_pay.claim_id IS '클레임ID (od_claim. — 클레임 추가결제 시)';
COMMENT ON COLUMN shopjoy_2604.od_pay.pay_div_cd IS '주문/클레임 구분 (코드: PAY_DIV — ORDER/CLAIM)';
COMMENT ON COLUMN shopjoy_2604.od_pay.pay_dir_cd IS '입금/환불 방향 (코드: PAY_DIR — DEPOSIT/REFUND)';
COMMENT ON COLUMN shopjoy_2604.od_pay.pay_occur_type_cd IS '결제발생유형 (코드: PAY_OCCUR_TYPE — ORDER/CLAIM_EXTRA/EXCHANGE_EXTRA)';
COMMENT ON COLUMN shopjoy_2604.od_pay.pay_method_cd IS '결제수단 (코드: PAY_METHOD)';
COMMENT ON COLUMN shopjoy_2604.od_pay.pay_channel_cd IS '결제채널 (코드: PAY_CHANNEL — TOSS만: CARD/ACCOUNT/KAKAO/NAVER)';
COMMENT ON COLUMN shopjoy_2604.od_pay.pay_amt IS '결제 금액';
COMMENT ON COLUMN shopjoy_2604.od_pay.pay_status_cd IS '결제상태 (코드: PAY_STATUS)';
COMMENT ON COLUMN shopjoy_2604.od_pay.pay_status_cd_before IS '변경 전 결제상태 (코드: PAY_STATUS)';
COMMENT ON COLUMN shopjoy_2604.od_pay.pay_date IS '결제 완료일시';
COMMENT ON COLUMN shopjoy_2604.od_pay.pg_company_cd IS 'PG사 (TOSS/KAKAO/NAVER 등)';
COMMENT ON COLUMN shopjoy_2604.od_pay.pg_transaction_id IS 'PG 거래ID';
COMMENT ON COLUMN shopjoy_2604.od_pay.pg_approval_no IS 'PG 승인번호';
COMMENT ON COLUMN shopjoy_2604.od_pay.pg_response IS 'PG 응답 데이터 (JSON)';
COMMENT ON COLUMN shopjoy_2604.od_pay.vbank_account IS '가상계좌 계좌번호';
COMMENT ON COLUMN shopjoy_2604.od_pay.vbank_bank_code IS '가상계좌 은행코드 (코드: BANK_CODE)';
COMMENT ON COLUMN shopjoy_2604.od_pay.vbank_bank_nm IS '가상계좌 은행명';
COMMENT ON COLUMN shopjoy_2604.od_pay.vbank_holder_nm IS '가상계좌 예금주명';
COMMENT ON COLUMN shopjoy_2604.od_pay.vbank_due_date IS '가상계좌 입금기한';
COMMENT ON COLUMN shopjoy_2604.od_pay.vbank_deposit_nm IS '가상계좌 입금자명';
COMMENT ON COLUMN shopjoy_2604.od_pay.vbank_deposit_date IS '가상계좌 입금확인일시';
COMMENT ON COLUMN shopjoy_2604.od_pay.card_no IS '카드번호 (마스킹: ****-****-****-5678)';
COMMENT ON COLUMN shopjoy_2604.od_pay.card_issuer_cd IS '카드사 코드';
COMMENT ON COLUMN shopjoy_2604.od_pay.card_issuer_nm IS '카드사명';
COMMENT ON COLUMN shopjoy_2604.od_pay.card_type_cd IS '카드 타입 (코드: CARD_TYPE — CREDIT/DEBIT/CHECK)';
COMMENT ON COLUMN shopjoy_2604.od_pay.installment_month IS '할부 개월수 (0=일시불)';
COMMENT ON COLUMN shopjoy_2604.od_pay.refund_amt IS '환불 금액';
COMMENT ON COLUMN shopjoy_2604.od_pay.refund_status_cd IS '환불 상태 (코드: REFUND_STATUS)';
COMMENT ON COLUMN shopjoy_2604.od_pay.refund_status_cd_before IS '변경 전 환불상태 (코드: REFUND_STATUS)';
COMMENT ON COLUMN shopjoy_2604.od_pay.refund_date IS '환불 완료일시';
COMMENT ON COLUMN shopjoy_2604.od_pay.refund_reason IS '환불 사유';
COMMENT ON COLUMN shopjoy_2604.od_pay.failure_reason IS '결제 실패 사유';
COMMENT ON COLUMN shopjoy_2604.od_pay.failure_code IS '결제 실패 코드 (PG 오류코드)';
COMMENT ON COLUMN shopjoy_2604.od_pay.failure_date IS '결제 실패일시';
COMMENT ON COLUMN shopjoy_2604.od_pay.memo IS '메모';
COMMENT ON COLUMN shopjoy_2604.od_pay.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.od_pay.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.od_pay.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.od_pay.upd_date IS '수정일';

CREATE INDEX idx_od_pay_claim ON shopjoy_2604.od_pay USING btree (claim_id) WHERE (claim_id IS NOT NULL);
CREATE INDEX idx_od_pay_date ON shopjoy_2604.od_pay USING btree (pay_date);
CREATE INDEX idx_od_pay_div ON shopjoy_2604.od_pay USING btree (pay_div_cd, pay_dir_cd);
CREATE INDEX idx_od_pay_method ON shopjoy_2604.od_pay USING btree (pay_method_cd, pay_status_cd);
CREATE INDEX idx_od_pay_order ON shopjoy_2604.od_pay USING btree (order_id);
CREATE INDEX idx_od_pay_pg_tid ON shopjoy_2604.od_pay USING btree (pg_transaction_id);
CREATE INDEX idx_od_pay_site ON shopjoy_2604.od_pay USING btree (site_id);
CREATE INDEX idx_od_pay_status ON shopjoy_2604.od_pay USING btree (pay_status_cd);
CREATE INDEX idx_od_pay_vbank_due ON shopjoy_2604.od_pay USING btree (vbank_due_date) WHERE (vbank_due_date IS NOT NULL);
