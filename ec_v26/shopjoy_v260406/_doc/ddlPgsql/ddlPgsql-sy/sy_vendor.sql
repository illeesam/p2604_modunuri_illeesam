-- ============================================================
-- sy_vendor : 판매/배송업체 (사업체/법인)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE sy_vendor (
    vendor_id          VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    vendor_no          VARCHAR(20)     NOT NULL,               -- 판매/배송업체등록번호 (123-45-67890)
    corp_no         VARCHAR(20),                            -- 법인등록번호 (선택)
    vendor_nm          VARCHAR(100)    NOT NULL,               -- 상호 / 회사명
    vendor_nm_en       VARCHAR(100),                           -- 영문 상호
    ceo_nm          VARCHAR(50),                            -- 대표자명
    vendor_type        VARCHAR(50),                            -- 업태 (예: 도소매)
    vendor_item        VARCHAR(100),                           -- 종목 (예: 의류, 잡화)
    vendor_class_cd    VARCHAR(20),                            -- 코드: VENDOR_CLASS (개인/법인/면세/간이)
    vendor_zip_code VARCHAR(10),
    vendor_addr     VARCHAR(200),
    vendor_addr_detail VARCHAR(200),
    vendor_phone    VARCHAR(20),
    vendor_fax      VARCHAR(20),
    vendor_email    VARCHAR(100),
    vendor_homepage VARCHAR(200),
    vendor_bank_nm  VARCHAR(50),                            -- 은행명
    vendor_bank_account VARCHAR(50),                            -- 계좌번호
    vendor_bank_holder VARCHAR(50),                            -- 예금주
    vendor_reg_url     VARCHAR(500),                           -- 판매/배송업체등록증 첨부 URL
    open_date       DATE,                                   -- 개업일자
    contract_date   DATE,                                   -- 계약일자
    vendor_status_cd VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: VENDOR_STATUS (ACTIVE/SUSPENDED/TERMINATED)
    disp_path       VARCHAR(200),                           -- 점(.) 구분 표시경로
    vendor_remark   VARCHAR(500),
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (vendor_id),
    UNIQUE (vendor_no)
);

COMMENT ON TABLE  sy_vendor                IS '판매/배송업체 (사업체/법인)';
COMMENT ON COLUMN sy_vendor.vendor_id         IS '판매/배송업체ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_vendor.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_vendor.vendor_no         IS '판매/배송업체등록번호';
COMMENT ON COLUMN sy_vendor.corp_no        IS '법인등록번호 (선택)';
COMMENT ON COLUMN sy_vendor.vendor_nm         IS '상호 / 회사명';
COMMENT ON COLUMN sy_vendor.vendor_nm_en      IS '영문 상호';
COMMENT ON COLUMN sy_vendor.ceo_nm         IS '대표자명';
COMMENT ON COLUMN sy_vendor.vendor_type       IS '업태';
COMMENT ON COLUMN sy_vendor.vendor_item       IS '종목';
COMMENT ON COLUMN sy_vendor.vendor_class_cd   IS '판매/배송업체구분 (코드: VENDOR_CLASS)';
COMMENT ON COLUMN sy_vendor.vendor_zip_code IS '우편번호';
COMMENT ON COLUMN sy_vendor.vendor_addr     IS '주소';
COMMENT ON COLUMN sy_vendor.vendor_addr_detail IS '상세주소';
COMMENT ON COLUMN sy_vendor.vendor_phone    IS '대표 전화';
COMMENT ON COLUMN sy_vendor.vendor_fax      IS '팩스';
COMMENT ON COLUMN sy_vendor.vendor_email    IS '대표 이메일';
COMMENT ON COLUMN sy_vendor.vendor_homepage IS '홈페이지';
COMMENT ON COLUMN sy_vendor.vendor_bank_nm  IS '은행명';
COMMENT ON COLUMN sy_vendor.vendor_bank_account IS '계좌번호';
COMMENT ON COLUMN sy_vendor.vendor_bank_holder IS '예금주';
COMMENT ON COLUMN sy_vendor.vendor_reg_url    IS '판매/배송업체등록증 첨부 URL';
COMMENT ON COLUMN sy_vendor.open_date      IS '개업일자';
COMMENT ON COLUMN sy_vendor.contract_date  IS '계약일자';
COMMENT ON COLUMN sy_vendor.vendor_status_cd IS '상태 (코드: VENDOR_STATUS)';
COMMENT ON COLUMN sy_vendor.disp_path      IS '점(.) 구분 표시경로';
COMMENT ON COLUMN sy_vendor.vendor_remark  IS '비고';
COMMENT ON COLUMN sy_vendor.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_vendor.reg_date       IS '등록일';
COMMENT ON COLUMN sy_vendor.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_vendor.upd_date       IS '수정일';

CREATE INDEX idx_sy_vendor_site   ON sy_vendor (site_id);
CREATE INDEX idx_sy_vendor_status ON sy_vendor (vendor_status_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_vendor.vendor_class_cd (판매/배송업체구분) : VENDOR_CLASS { INDIVIDUAL:개인사업자, CORPORATION:법인사업자, TAX_EXEMPT:면세사업자, SIMPLIFIED:간이과세자 }
-- [CODES] sy_vendor.vendor_status_cd (상태) : 업체상태 { ACTIVE:활성, REVIEWING:심사중, BLOCKED:정지 }
