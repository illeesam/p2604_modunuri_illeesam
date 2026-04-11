-- ============================================================
-- sy_vendor : 업체 (판매업체 / 배송업체)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE sy_vendor (
    vendor_id       VARCHAR(16)     NOT NULL,
    vendor_type     VARCHAR(20)     NOT NULL,               -- SELLER/COURIER/BOTH
    vendor_name     VARCHAR(100)    NOT NULL,
    vendor_code     VARCHAR(50),
    ceo             VARCHAR(50),
    biz_no          VARCHAR(20),
    phone           VARCHAR(20),
    fax             VARCHAR(20),
    email           VARCHAR(100),
    zip_code        VARCHAR(10),
    address         VARCHAR(300),
    contract_date   DATE,
    contract_end    DATE,
    status_cd       VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: VENDOR_STATUS
    bank_name       VARCHAR(50),
    bank_account    VARCHAR(50),
    bank_holder     VARCHAR(50),
    memo            TEXT,
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_date        TIMESTAMP,
    PRIMARY KEY (vendor_id)
);

COMMENT ON TABLE  sy_vendor                IS '업체';
COMMENT ON COLUMN sy_vendor.vendor_id      IS '업체ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_vendor.vendor_type    IS '업체유형 (SELLER/COURIER/BOTH)';
COMMENT ON COLUMN sy_vendor.vendor_name    IS '업체명';
COMMENT ON COLUMN sy_vendor.vendor_code    IS '업체코드';
COMMENT ON COLUMN sy_vendor.ceo            IS '대표자명';
COMMENT ON COLUMN sy_vendor.biz_no         IS '사업자번호';
COMMENT ON COLUMN sy_vendor.phone          IS '전화번호';
COMMENT ON COLUMN sy_vendor.fax            IS '팩스';
COMMENT ON COLUMN sy_vendor.email          IS '이메일';
COMMENT ON COLUMN sy_vendor.zip_code       IS '우편번호';
COMMENT ON COLUMN sy_vendor.address        IS '주소';
COMMENT ON COLUMN sy_vendor.contract_date  IS '계약시작일';
COMMENT ON COLUMN sy_vendor.contract_end   IS '계약종료일';
COMMENT ON COLUMN sy_vendor.status_cd      IS '상태 (코드: VENDOR_STATUS)';
COMMENT ON COLUMN sy_vendor.bank_name      IS '은행명';
COMMENT ON COLUMN sy_vendor.bank_account   IS '계좌번호';
COMMENT ON COLUMN sy_vendor.bank_holder    IS '예금주';
COMMENT ON COLUMN sy_vendor.memo           IS '메모';
COMMENT ON COLUMN sy_vendor.reg_date       IS '등록일';
COMMENT ON COLUMN sy_vendor.upd_date       IS '수정일';
