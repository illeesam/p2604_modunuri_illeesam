-- ============================================================
CREATE TABLE pd_dliv_tmplt (
    dliv_tmplt_id       VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    vendor_id           VARCHAR(21),                            -- sy_vendor.vendor_id
    dliv_tmplt_nm       VARCHAR(100)    NOT NULL,
    dliv_method_cd      VARCHAR(20),                            -- 코드: DLIV_METHOD (COURIER/DIRECT/PICKUP)
    dliv_pay_type_cd    VARCHAR(20),                            -- 코드: DLIV_PAY_TYPE (PREPAY/COD)
    dliv_courier_cd     VARCHAR(30),                            -- 배송 택배사 코드
    dliv_cost           BIGINT          DEFAULT 0,              -- 기본 배송비
    free_dliv_min_amt   BIGINT          DEFAULT 0,              -- 무료배송 최소 주문금액 (0=무조건 유료)
    island_extra_cost   BIGINT          DEFAULT 0,              -- 도서산간 추가배송비
    return_cost         BIGINT          DEFAULT 0,              -- 반품배송비 (편도)
    exchange_cost       BIGINT          DEFAULT 0,              -- 교환배송비 (왕복)
    return_courier_cd   VARCHAR(30),                            -- 반품 택배사 코드
    return_addr_zip     VARCHAR(10),                            -- 반품지 우편번호
    return_addr         VARCHAR(200),                           -- 반품지 주소
    return_addr_detail  VARCHAR(200),                           -- 반품지 상세주소
    return_tel_no       VARCHAR(20),                            -- 반품지 전화번호
    base_dliv_yn        VARCHAR(1)      DEFAULT 'N',            -- 기본 배송지 여부
    use_yn              VARCHAR(1)      DEFAULT 'Y',
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (dliv_tmplt_id)
);

COMMENT ON TABLE pd_dliv_tmplt IS '배송템플릿';
COMMENT ON COLUMN pd_dliv_tmplt.dliv_tmplt_id     IS '배송템플릿ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pd_dliv_tmplt.site_id           IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_dliv_tmplt.vendor_id         IS '업체ID (sy_vendor.vendor_id)';
COMMENT ON COLUMN pd_dliv_tmplt.dliv_tmplt_nm     IS '템플릿명';
COMMENT ON COLUMN pd_dliv_tmplt.dliv_method_cd    IS '배송방법코드 (코드: DLIV_METHOD)';
COMMENT ON COLUMN pd_dliv_tmplt.dliv_pay_type_cd  IS '배송비결제유형 (코드: DLIV_PAY_TYPE) PREPAY:선결제/COD:착불';
COMMENT ON COLUMN pd_dliv_tmplt.dliv_courier_cd   IS '배송 택배사 코드';
COMMENT ON COLUMN pd_dliv_tmplt.dliv_cost         IS '기본 배송비';
COMMENT ON COLUMN pd_dliv_tmplt.free_dliv_min_amt IS '무료배송 최소 주문금액';
COMMENT ON COLUMN pd_dliv_tmplt.island_extra_cost IS '도서산간 추가배송비';
COMMENT ON COLUMN pd_dliv_tmplt.return_cost       IS '반품배송비 (편도)';
COMMENT ON COLUMN pd_dliv_tmplt.exchange_cost     IS '교환배송비 (왕복=반품+재발송)';
COMMENT ON COLUMN pd_dliv_tmplt.return_courier_cd IS '반품 택배사 코드';
COMMENT ON COLUMN pd_dliv_tmplt.return_addr_zip   IS '반품지 우편번호';
COMMENT ON COLUMN pd_dliv_tmplt.return_addr       IS '반품지 주소';
COMMENT ON COLUMN pd_dliv_tmplt.return_addr_detail IS '반품지 상세주소';
COMMENT ON COLUMN pd_dliv_tmplt.return_tel_no     IS '반품지 전화번호';
COMMENT ON COLUMN pd_dliv_tmplt.base_dliv_yn      IS '기본배송지여부 Y/N';
COMMENT ON COLUMN pd_dliv_tmplt.use_yn            IS '사용여부 Y/N';
COMMENT ON COLUMN pd_dliv_tmplt.reg_by            IS '등록자ID';
COMMENT ON COLUMN pd_dliv_tmplt.reg_date          IS '등록일시';
COMMENT ON COLUMN pd_dliv_tmplt.upd_by            IS '수정자ID';
COMMENT ON COLUMN pd_dliv_tmplt.upd_date          IS '수정일시';

CREATE INDEX idx_pd_dliv_tmplt_vendor ON pd_dliv_tmplt (vendor_id);
CREATE INDEX idx_pd_dliv_tmplt_site   ON pd_dliv_tmplt (site_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pd_dliv_tmplt.dliv_method_cd (배송방법코드) : DLIV_METHOD { COURIER:택배, DIRECT:직접배송, PICKUP:방문수령, SAME_DAY:당일배송 }
-- [CODES] pd_dliv_tmplt.dliv_pay_type_cd (배송비결제유형 PREPAY:선결제/COD:착불) : DLIV_PAY_TYPE { PREPAY:선불, COD:착불 }
