-- sy_vendor 테이블 DDL
-- 판매/배송업체 (사업체/법인)

CREATE TABLE shopjoy_2604.sy_vendor (
    vendor_id           VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id             VARCHAR(21)  NOT NULL,
    vendor_no           VARCHAR(20)  NOT NULL,
    corp_no             VARCHAR(20) ,
    vendor_nm           VARCHAR(100) NOT NULL,
    vendor_nm_en        VARCHAR(100),
    ceo_nm              VARCHAR(50) ,
    vendor_type         VARCHAR(50) ,
    vendor_item         VARCHAR(100),
    vendor_class_cd     VARCHAR(20) ,
    vendor_zip_code     VARCHAR(10) ,
    vendor_addr         VARCHAR(200),
    vendor_addr_detail  VARCHAR(200),
    vendor_phone        VARCHAR(20) ,
    vendor_fax          VARCHAR(20) ,
    vendor_email        VARCHAR(100),
    vendor_homepage     VARCHAR(200),
    vendor_bank_nm      VARCHAR(50) ,
    vendor_bank_account VARCHAR(50) ,
    vendor_bank_holder  VARCHAR(50) ,
    vendor_reg_url      VARCHAR(500),
    open_date           DATE        ,
    contract_date       DATE        ,
    vendor_status_cd    VARCHAR(20)  DEFAULT 'ACTIVE'::character varying,
    path_id             VARCHAR(21) ,
    vendor_remark       VARCHAR(500),
    reg_by              VARCHAR(30) ,
    reg_date            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30) ,
    upd_date            TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.sy_vendor IS '판매/배송업체 (사업체/법인)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.vendor_id IS '판매/배송업체ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.vendor_no IS '판매/배송업체등록번호';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.corp_no IS '법인등록번호 (선택)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.vendor_nm IS '상호 / 회사명';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.vendor_nm_en IS '영문 상호';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.ceo_nm IS '대표자명';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.vendor_type IS '업태';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.vendor_item IS '종목';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.vendor_class_cd IS '판매/배송업체구분 (코드: VENDOR_CLASS)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.vendor_zip_code IS '우편번호';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.vendor_addr IS '주소';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.vendor_addr_detail IS '상세주소';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.vendor_phone IS '대표 전화';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.vendor_fax IS '팩스';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.vendor_email IS '대표 이메일';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.vendor_homepage IS '홈페이지';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.vendor_bank_nm IS '은행명';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.vendor_bank_account IS '계좌번호';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.vendor_bank_holder IS '예금주';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.vendor_reg_url IS '판매/배송업체등록증 첨부 URL';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.open_date IS '개업일자';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.contract_date IS '계약일자';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.vendor_status_cd IS '상태 (코드: VENDOR_STATUS)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.path_id IS '점(.) 구분 표시경로';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.vendor_remark IS '비고';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_vendor.upd_date IS '수정일';

CREATE INDEX idx_sy_vendor_site ON shopjoy_2604.sy_vendor USING btree (site_id);
CREATE INDEX idx_sy_vendor_status ON shopjoy_2604.sy_vendor USING btree (vendor_status_cd);
CREATE UNIQUE INDEX sy_vendor_vendor_no_key ON shopjoy_2604.sy_vendor USING btree (vendor_no);
