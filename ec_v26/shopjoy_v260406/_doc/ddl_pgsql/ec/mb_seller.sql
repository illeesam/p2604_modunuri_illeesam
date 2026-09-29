-- mb_seller 테이블 DDL
-- 판매자 (개인/업체 공통 — 셀러 정체성 허브)

CREATE TABLE shopjoy_2604.mb_seller (
    seller_id           VARCHAR(21)  NOT NULL CONSTRAINT mb_seller_pk_seller_id PRIMARY KEY,
    seller_nm           VARCHAR(100) NOT NULL,
    seller_type_cd      VARCHAR(20) ,
    seller_status_cd    VARCHAR(20) ,
    vendor_id           VARCHAR(21) ,
    settle_bank_nm      VARCHAR(50) ,
    settle_bank_account VARCHAR(50) ,
    settle_bank_holder  VARCHAR(50) ,
    reg_by              VARCHAR(30) ,
    reg_date            TIMESTAMP    DEFAULT now(),
    reg_site_id         VARCHAR(21) ,
    upd_by              VARCHAR(30) ,
    upd_date            TIMESTAMP   ,
    CONSTRAINT mb_seller_fk_vendor_id FOREIGN KEY (vendor_id) REFERENCES shopjoy_2604.sy_vendor (vendor_id)
);

COMMENT ON TABLE  shopjoy_2604.mb_seller IS '판매자 (개인/업체 공통 — 셀러 정체성 허브)';
COMMENT ON COLUMN shopjoy_2604.mb_seller.seller_id IS 'PK (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.mb_seller.seller_nm IS '노출용 판매자명';
COMMENT ON COLUMN shopjoy_2604.mb_seller.seller_type_cd IS '판매자 유형 (코드: SELLER_TYPE_CD — INDIVIDUAL/COMPANY)';
COMMENT ON COLUMN shopjoy_2604.mb_seller.seller_status_cd IS '판매자 상태 (코드: SELLER_STATUS_CD — PENDING/ACTIVE/SUSPENDED)';
COMMENT ON COLUMN shopjoy_2604.mb_seller.vendor_id IS '업체 상세정보 (sy_vendor.vendor_id) — 업체일 때만, 개인은 NULL';
COMMENT ON COLUMN shopjoy_2604.mb_seller.settle_bank_nm IS '정산 은행명';
COMMENT ON COLUMN shopjoy_2604.mb_seller.settle_bank_account IS '정산 계좌번호';
COMMENT ON COLUMN shopjoy_2604.mb_seller.settle_bank_holder IS '정산 예금주명';

CREATE INDEX mb_seller_ix01_vendor_id ON shopjoy_2604.mb_seller USING btree (vendor_id);
