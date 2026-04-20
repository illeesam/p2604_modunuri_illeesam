-- ============================================================
-- sy_vendor_brand : 판매/배송업체-브랜드 매핑
--   한 업체(sy_vendor)는 여러 브랜드(sy_brand)를 취급할 수 있고
--   한 브랜드는 여러 업체에 의해 공급될 수 있음 (N:N)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE sy_vendor_brand (
    vendor_brand_id VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    vendor_id       VARCHAR(21)     NOT NULL,               -- sy_vendor.vendor_id
    brand_id        VARCHAR(21)     NOT NULL,               -- sy_brand.brand_id
    is_main         CHAR(1)         DEFAULT 'N',            -- 대표 브랜드 여부 Y/N
    contract_cd     VARCHAR(20),                            -- 코드: VENDOR_BRAND_CONTRACT (직매입/위탁/제휴 등)
    start_date      DATE,                                   -- 계약 시작일
    end_date        DATE,                                   -- 계약 종료일
    commission_rate NUMERIC(5,2),                           -- 수수료율 (%)
    sort_ord        INTEGER         DEFAULT 0,
    use_yn          CHAR(1)         DEFAULT 'Y',
    vendor_brand_remark VARCHAR(500),
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (vendor_brand_id),
    UNIQUE (vendor_id, brand_id)
);

COMMENT ON TABLE  sy_vendor_brand                 IS '판매/배송업체-브랜드 매핑';
COMMENT ON COLUMN sy_vendor_brand.vendor_brand_id IS '업체브랜드ID (PK)';
COMMENT ON COLUMN sy_vendor_brand.site_id         IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_vendor_brand.vendor_id       IS '업체ID (sy_vendor.vendor_id)';
COMMENT ON COLUMN sy_vendor_brand.brand_id        IS '브랜드ID (sy_brand.brand_id)';
COMMENT ON COLUMN sy_vendor_brand.is_main         IS '대표 브랜드 여부 Y/N';
COMMENT ON COLUMN sy_vendor_brand.contract_cd     IS '계약유형 (코드: VENDOR_BRAND_CONTRACT)';
COMMENT ON COLUMN sy_vendor_brand.start_date      IS '계약 시작일';
COMMENT ON COLUMN sy_vendor_brand.end_date        IS '계약 종료일';
COMMENT ON COLUMN sy_vendor_brand.commission_rate IS '수수료율 (%)';
COMMENT ON COLUMN sy_vendor_brand.sort_ord        IS '정렬순서';
COMMENT ON COLUMN sy_vendor_brand.use_yn          IS '사용여부 Y/N';
COMMENT ON COLUMN sy_vendor_brand.vendor_brand_remark IS '비고';
COMMENT ON COLUMN sy_vendor_brand.reg_by          IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_vendor_brand.reg_date        IS '등록일';
COMMENT ON COLUMN sy_vendor_brand.upd_by          IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_vendor_brand.upd_date        IS '수정일';

CREATE INDEX idx_sy_vendor_brand_vendor ON sy_vendor_brand (vendor_id);
CREATE INDEX idx_sy_vendor_brand_brand  ON sy_vendor_brand (brand_id);
CREATE INDEX idx_sy_vendor_brand_use    ON sy_vendor_brand (use_yn);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_vendor_brand.contract_cd (계약유형) : BRAND_CONTRACT { EXCLUSIVE:독점, NON_EXCLUSIVE:비독점, CONSIGN:위탁 }
