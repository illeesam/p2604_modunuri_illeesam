-- st_erp_voucher 테이블 DDL
-- ERP 전표 마스터 (정산 → ERP 회계 전표)

CREATE TABLE shopjoy_2604.st_erp_voucher (
    erp_voucher_id               VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id                      VARCHAR(21)  NOT NULL,
    vendor_id                    VARCHAR(21) ,
    settle_id                    VARCHAR(21) ,
    settle_ym                    VARCHAR(6)  ,
    erp_voucher_type_cd          VARCHAR(20)  NOT NULL,
    erp_voucher_status_cd        VARCHAR(20)  DEFAULT 'DRAFT'::character varying,
    erp_voucher_status_cd_before VARCHAR(20) ,
    voucher_date                 DATE         NOT NULL,
    erp_voucher_desc             VARCHAR(500),
    total_debit_amt              BIGINT       DEFAULT 0,
    total_credit_amt             BIGINT       DEFAULT 0,
    erp_send_date                TIMESTAMP   ,
    erp_voucher_no               VARCHAR(50) ,
    erp_res_msg                  VARCHAR(500),
    reg_by                       VARCHAR(30) ,
    reg_date                     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by                       VARCHAR(30) ,
    upd_date                     TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.st_erp_voucher IS 'ERP 전표 마스터 (정산 → ERP 회계 전표)';
COMMENT ON COLUMN shopjoy_2604.st_erp_voucher.erp_voucher_id IS 'ERP전표ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.st_erp_voucher.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.st_erp_voucher.vendor_id IS '업체ID';
COMMENT ON COLUMN shopjoy_2604.st_erp_voucher.settle_id IS '정산ID (st_settle.settle_id)';
COMMENT ON COLUMN shopjoy_2604.st_erp_voucher.settle_ym IS '정산년월 (YYYYMM)';
COMMENT ON COLUMN shopjoy_2604.st_erp_voucher.erp_voucher_type_cd IS '전표유형 (코드: ERP_VOUCHER_TYPE — SETTLE/RETURN/ADJ/PAY)';
COMMENT ON COLUMN shopjoy_2604.st_erp_voucher.erp_voucher_status_cd IS '전표상태 (코드: ERP_VOUCHER_STATUS — DRAFT/CONFIRMED/SENT/MATCHED/MISMATCH/ERROR)';
COMMENT ON COLUMN shopjoy_2604.st_erp_voucher.erp_voucher_status_cd_before IS '변경 전 전표상태';
COMMENT ON COLUMN shopjoy_2604.st_erp_voucher.voucher_date IS '전표 기준일자';
COMMENT ON COLUMN shopjoy_2604.st_erp_voucher.erp_voucher_desc IS '전표 적요';
COMMENT ON COLUMN shopjoy_2604.st_erp_voucher.total_debit_amt IS '차변 합계 (대변과 일치해야 전표 확정 가능)';
COMMENT ON COLUMN shopjoy_2604.st_erp_voucher.total_credit_amt IS '대변 합계';
COMMENT ON COLUMN shopjoy_2604.st_erp_voucher.erp_send_date IS 'ERP 전송일시';
COMMENT ON COLUMN shopjoy_2604.st_erp_voucher.erp_voucher_no IS 'ERP 채번 전표번호 (전송 후 ERP에서 수신)';
COMMENT ON COLUMN shopjoy_2604.st_erp_voucher.erp_res_msg IS 'ERP 처리 응답 메시지';
COMMENT ON COLUMN shopjoy_2604.st_erp_voucher.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.st_erp_voucher.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.st_erp_voucher.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.st_erp_voucher.upd_date IS '수정일';

CREATE INDEX idx_st_erp_voucher_no ON shopjoy_2604.st_erp_voucher USING btree (erp_voucher_no);
CREATE INDEX idx_st_erp_voucher_settle ON shopjoy_2604.st_erp_voucher USING btree (settle_id);
CREATE INDEX idx_st_erp_voucher_site ON shopjoy_2604.st_erp_voucher USING btree (site_id);
CREATE INDEX idx_st_erp_voucher_status ON shopjoy_2604.st_erp_voucher USING btree (erp_voucher_status_cd);
CREATE INDEX idx_st_erp_voucher_vendor ON shopjoy_2604.st_erp_voucher USING btree (site_id, vendor_id);
CREATE INDEX idx_st_erp_voucher_ym ON shopjoy_2604.st_erp_voucher USING btree (settle_ym);
