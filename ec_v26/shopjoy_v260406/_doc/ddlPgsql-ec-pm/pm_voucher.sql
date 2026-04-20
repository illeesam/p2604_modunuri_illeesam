-- ============================================================
-- pm_voucher : 상품권 (금액권/정률권)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE pm_voucher (
    voucher_id          VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),
    voucher_nm          VARCHAR(100)    NOT NULL,               -- 상품권명
    voucher_type_cd     VARCHAR(20)     NOT NULL,               -- 코드: VOUCHER_TYPE (AMOUNT:금액권/RATE:정률권)
    voucher_value       NUMERIC(10,2)   NOT NULL,               -- 권면금액 (금액이면 원, 정률이면 %)
    min_order_amt       BIGINT          DEFAULT 0,              -- 사용 최소주문금액
    max_discnt_amt      BIGINT,                                 -- 최대할인한도 (정률권, NULL=무제한)
    expire_month        INTEGER,                                 -- 발급 후 유효기간 (개월, NULL=무제한)
    voucher_status_cd   VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: VOUCHER_STATUS (ACTIVE/INACTIVE/EXPIRED)
    voucher_status_cd_before VARCHAR(20),
    voucher_desc        TEXT,
    use_yn              CHAR(1)         DEFAULT 'Y',
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (voucher_id)
);

COMMENT ON TABLE pm_voucher IS '상품권';
COMMENT ON COLUMN pm_voucher.voucher_id         IS '상품권ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pm_voucher.site_id            IS '사이트ID';
COMMENT ON COLUMN pm_voucher.voucher_nm         IS '상품권명';
COMMENT ON COLUMN pm_voucher.voucher_type_cd    IS '유형 (코드: VOUCHER_TYPE — AMOUNT/RATE)';
COMMENT ON COLUMN pm_voucher.voucher_value      IS '권면금액 또는 할인율';
COMMENT ON COLUMN pm_voucher.min_order_amt      IS '사용 최소주문금액';
COMMENT ON COLUMN pm_voucher.max_discnt_amt     IS '최대할인한도 (정률권)';
COMMENT ON COLUMN pm_voucher.expire_month       IS '유효기간 (발급 후 N개월, NULL=무제한)';
COMMENT ON COLUMN pm_voucher.voucher_status_cd  IS '상태 (코드: VOUCHER_STATUS)';
COMMENT ON COLUMN pm_voucher.voucher_status_cd_before IS '변경 전 상태';
COMMENT ON COLUMN pm_voucher.voucher_desc       IS '상품권 설명';
COMMENT ON COLUMN pm_voucher.use_yn             IS '사용여부 Y/N';
COMMENT ON COLUMN pm_voucher.reg_by             IS '등록자';
COMMENT ON COLUMN pm_voucher.reg_date           IS '등록일';
COMMENT ON COLUMN pm_voucher.upd_by             IS '수정자';
COMMENT ON COLUMN pm_voucher.upd_date           IS '수정일';

CREATE INDEX idx_pm_voucher_site   ON pm_voucher (site_id);
CREATE INDEX idx_pm_voucher_status ON pm_voucher (voucher_status_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_voucher.voucher_type_cd (유형) : GIFT_TYPE { PRODUCT:상품형, SAMPLE:샘플형, ETC:기타 }
-- [CODES] pm_voucher.voucher_status_cd (상태) : GIFT_STATUS { ACTIVE:활성, INACTIVE:비활성 }
