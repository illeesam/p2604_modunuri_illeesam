-- st_settle_pay 테이블 DDL
-- 정산지급

CREATE TABLE shopjoy_2604.st_settle_pay (
    settle_pay_id        VARCHAR(21) NOT NULL PRIMARY KEY,
    settle_id            VARCHAR(21) NOT NULL,
    site_id              VARCHAR(21) NOT NULL,
    vendor_id            VARCHAR(21) NOT NULL,
    pay_amt              BIGINT      NOT NULL,
    pay_method_cd        VARCHAR(20) DEFAULT 'BANK_TRANSFER'::character varying,
    bank_nm              VARCHAR(50),
    bank_account         VARCHAR(50),
    bank_holder          VARCHAR(50),
    pay_status_cd        VARCHAR(20) DEFAULT 'PENDING'::character varying,
    pay_status_cd_before VARCHAR(20),
    pay_date             TIMESTAMP  ,
    pay_by               VARCHAR(20),
    settle_pay_memo      TEXT       ,
    reg_by               VARCHAR(30),
    reg_date             TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    upd_by               VARCHAR(30),
    upd_date             TIMESTAMP  
);

COMMENT ON TABLE  shopjoy_2604.st_settle_pay IS '정산지급';
COMMENT ON COLUMN shopjoy_2604.st_settle_pay.settle_pay_id IS '정산지급ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.st_settle_pay.settle_id IS '정산ID (st_settle.settle_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_pay.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.st_settle_pay.vendor_id IS '업체ID (sy_vendor.vendor_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_pay.pay_amt IS '지급금액';
COMMENT ON COLUMN shopjoy_2604.st_settle_pay.pay_method_cd IS '지급수단 (코드: PAY_METHOD_CD)';
COMMENT ON COLUMN shopjoy_2604.st_settle_pay.bank_nm IS '은행명';
COMMENT ON COLUMN shopjoy_2604.st_settle_pay.bank_account IS '계좌번호';
COMMENT ON COLUMN shopjoy_2604.st_settle_pay.bank_holder IS '예금주';
COMMENT ON COLUMN shopjoy_2604.st_settle_pay.pay_status_cd IS '지급상태 (코드: SETTLE_PAY_STATUS — PENDING/COMPLT/FAILED)';
COMMENT ON COLUMN shopjoy_2604.st_settle_pay.pay_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN shopjoy_2604.st_settle_pay.pay_date IS '실지급 일시';
COMMENT ON COLUMN shopjoy_2604.st_settle_pay.pay_by IS '지급처리자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_pay.settle_pay_memo IS '메모';
COMMENT ON COLUMN shopjoy_2604.st_settle_pay.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.st_settle_pay.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.st_settle_pay.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.st_settle_pay.upd_date IS '수정일';

CREATE INDEX idx_st_settle_pay_settle ON shopjoy_2604.st_settle_pay USING btree (settle_id);
CREATE INDEX idx_st_settle_pay_site ON shopjoy_2604.st_settle_pay USING btree (site_id);
CREATE INDEX idx_st_settle_pay_status ON shopjoy_2604.st_settle_pay USING btree (pay_status_cd);
CREATE INDEX idx_st_settle_pay_vendor ON shopjoy_2604.st_settle_pay USING btree (vendor_id);
