-- sy_vendor_brand 테이블 DDL
-- 판매/배송업체-브랜드 매핑

CREATE TABLE shopjoy_2604.sy_vendor_brand (
    vendor_brand_id     VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id             VARCHAR(21)  NOT NULL,
    vendor_id           VARCHAR(21)  NOT NULL,
    brand_id            VARCHAR(21)  NOT NULL,
    is_main             VARCHAR(1)   DEFAULT 'N'::bpchar,
    contract_cd         VARCHAR(20) ,
    start_date          DATE        ,
    end_date            DATE        ,
    commission_rate     NUMERIC(5,2),
    sort_ord            INTEGER      DEFAULT 0,
    use_yn              VARCHAR(1)   DEFAULT 'Y'::bpchar,
    vendor_brand_remark VARCHAR(500),
    reg_by              VARCHAR(30) ,
    reg_date            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30) ,
    upd_date            TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.sy_vendor_brand IS '판매/배송업체-브랜드 매핑';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_brand.vendor_brand_id IS '업체브랜드ID (PK)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_brand.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_brand.vendor_id IS '업체ID (sy_vendor.vendor_id)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_brand.brand_id IS '브랜드ID (sy_brand.brand_id)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_brand.is_main IS '대표 브랜드 여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_brand.contract_cd IS '계약유형 (코드: VENDOR_BRAND_CONTRACT)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_brand.start_date IS '계약 시작일';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_brand.end_date IS '계약 종료일';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_brand.commission_rate IS '수수료율 (%)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_brand.sort_ord IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_brand.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_brand.vendor_brand_remark IS '비고';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_brand.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_brand.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_brand.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor_brand.upd_date IS '수정일';

CREATE INDEX idx_sy_vendor_brand_brand ON shopjoy_2604.sy_vendor_brand USING btree (brand_id);
CREATE INDEX idx_sy_vendor_brand_site ON shopjoy_2604.sy_vendor_brand USING btree (site_id);
CREATE INDEX idx_sy_vendor_brand_use ON shopjoy_2604.sy_vendor_brand USING btree (use_yn);
CREATE INDEX idx_sy_vendor_brand_vendor ON shopjoy_2604.sy_vendor_brand USING btree (vendor_id);
CREATE UNIQUE INDEX sy_vendor_brand_vendor_id_brand_id_key ON shopjoy_2604.sy_vendor_brand USING btree (vendor_id, brand_id);
