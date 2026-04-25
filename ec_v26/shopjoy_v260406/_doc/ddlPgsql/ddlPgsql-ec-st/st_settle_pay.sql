-- ============================================================
-- st_settle_pay : 정산지급
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE st_settle_pay (
    settle_pay_id       VARCHAR(21)     NOT NULL,
    settle_id           VARCHAR(21)     NOT NULL,               -- st_settle.settle_id
    site_id             VARCHAR(21),
    vendor_id           VARCHAR(21)     NOT NULL,               -- sy_vendor.vendor_id
    pay_amt             BIGINT          NOT NULL,               -- 지급금액
    pay_method_cd       VARCHAR(20)     DEFAULT 'BANK_TRANSFER', -- 코드: PAY_METHOD_CD
    bank_nm             VARCHAR(50),                            -- 은행명
    bank_account        VARCHAR(50),                            -- 계좌번호
    bank_holder         VARCHAR(50),                            -- 예금주
    pay_status_cd       VARCHAR(20)     DEFAULT 'PENDING',      -- 코드: SETTLE_PAY_STATUS (PENDING:지급대기/COMPLT:지급완료/FAILED:지급실패)
    pay_status_cd_before VARCHAR(20),
    pay_date            TIMESTAMP,                              -- 실지급 일시
    pay_by              VARCHAR(21),                            -- 지급처리자 (sy_user.user_id)
    settle_pay_memo     TEXT,
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (settle_pay_id)
);

COMMENT ON TABLE st_settle_pay IS '정산지급';
COMMENT ON COLUMN st_settle_pay.settle_pay_id    IS '정산지급ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN st_settle_pay.settle_id        IS '정산ID (st_settle.settle_id)';
COMMENT ON COLUMN st_settle_pay.site_id          IS '사이트ID';
COMMENT ON COLUMN st_settle_pay.vendor_id        IS '업체ID (sy_vendor.vendor_id)';
COMMENT ON COLUMN st_settle_pay.pay_amt          IS '지급금액';
COMMENT ON COLUMN st_settle_pay.pay_method_cd    IS '지급수단 (코드: PAY_METHOD_CD)';
COMMENT ON COLUMN st_settle_pay.bank_nm          IS '은행명';
COMMENT ON COLUMN st_settle_pay.bank_account     IS '계좌번호';
COMMENT ON COLUMN st_settle_pay.bank_holder      IS '예금주';
COMMENT ON COLUMN st_settle_pay.pay_status_cd    IS '지급상태 (코드: SETTLE_PAY_STATUS — PENDING/COMPLT/FAILED)';
COMMENT ON COLUMN st_settle_pay.pay_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN st_settle_pay.pay_date         IS '실지급 일시';
COMMENT ON COLUMN st_settle_pay.pay_by           IS '지급처리자 (sy_user.user_id)';
COMMENT ON COLUMN st_settle_pay.settle_pay_memo  IS '메모';
COMMENT ON COLUMN st_settle_pay.reg_by           IS '등록자';
COMMENT ON COLUMN st_settle_pay.reg_date         IS '등록일';
COMMENT ON COLUMN st_settle_pay.upd_by           IS '수정자';
COMMENT ON COLUMN st_settle_pay.upd_date         IS '수정일';

CREATE INDEX idx_st_settle_pay_settle ON st_settle_pay (settle_id);
CREATE INDEX idx_st_settle_pay_vendor ON st_settle_pay (vendor_id);
CREATE INDEX idx_st_settle_pay_status ON st_settle_pay (pay_status_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] st_settle_pay.pay_method_cd (지급수단) : PAY_METHOD { BANK_TRANSFER:무통장입금, VBANK:가상계좌, TOSS:토스페이먼츠, KAKAO:카카오페이, NAVER:네이버페이, MOBILE:핸드폰결제, SAVE:적립금결제, ZERO:0원결제 }
-- [CODES] st_settle_pay.pay_status_cd (지급상태) : SETTLE_PAY_STATUS { PENDING:대기, REQUESTED:지급요청, COMPLT:지급완료, FAILED:실패, DISPUTED:이의신청 }
