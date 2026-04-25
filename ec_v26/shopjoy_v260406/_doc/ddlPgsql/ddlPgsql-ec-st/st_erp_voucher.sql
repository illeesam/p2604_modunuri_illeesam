-- ============================================================
-- st_erp_voucher : ERP 전표 마스터
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- 정산 확정 후 ERP로 전송할 회계 전표를 생성·관리
-- ============================================================
CREATE TABLE st_erp_voucher (
    erp_voucher_id          VARCHAR(21)     NOT NULL,
    site_id                 VARCHAR(21)     NOT NULL,               -- sy_site.site_id
    vendor_id               VARCHAR(21),                            -- sy_vendor.vendor_id

    -- ── 정산 연결
    settle_id               VARCHAR(21),                            -- st_settle.settle_id
    settle_ym               CHAR(6),                                -- 정산년월 (YYYYMM)

    -- ── 전표 기본
    erp_voucher_type_cd     VARCHAR(20)     NOT NULL,               -- 코드: ERP_VOUCHER_TYPE (SETTLE/RETURN/ADJ/PAY)
    erp_voucher_status_cd   VARCHAR(20)     DEFAULT 'DRAFT',        -- 코드: ERP_VOUCHER_STATUS (DRAFT/CONFIRMED/SENT/MATCHED/MISMATCH/ERROR)
    erp_voucher_status_cd_before VARCHAR(20),                       -- 변경 전 상태
    voucher_date            DATE            NOT NULL,               -- 전표 기준일자
    erp_voucher_desc        VARCHAR(500),                           -- 전표 적요

    -- ── 금액 검증
    total_debit_amt         BIGINT          DEFAULT 0,              -- 차변 합계
    total_credit_amt        BIGINT          DEFAULT 0,              -- 대변 합계

    -- ── ERP 연동
    erp_send_date           TIMESTAMP,                              -- ERP 전송일시
    erp_voucher_no          VARCHAR(50),                            -- ERP 채번 전표번호 (전송 후 수신)
    erp_res_msg             VARCHAR(500),                           -- ERP 처리 응답 메시지

    reg_by                  VARCHAR(30),
    reg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                  VARCHAR(30),
    upd_date                TIMESTAMP,

    PRIMARY KEY (erp_voucher_id)
);

COMMENT ON TABLE  st_erp_voucher IS 'ERP 전표 마스터 (정산 → ERP 회계 전표)';
COMMENT ON COLUMN st_erp_voucher.erp_voucher_id          IS 'ERP전표ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN st_erp_voucher.site_id                 IS '사이트ID';
COMMENT ON COLUMN st_erp_voucher.vendor_id               IS '업체ID';
COMMENT ON COLUMN st_erp_voucher.settle_id               IS '정산ID (st_settle.settle_id)';
COMMENT ON COLUMN st_erp_voucher.settle_ym               IS '정산년월 (YYYYMM)';
COMMENT ON COLUMN st_erp_voucher.erp_voucher_type_cd     IS '전표유형 (코드: ERP_VOUCHER_TYPE — SETTLE/RETURN/ADJ/PAY)';
COMMENT ON COLUMN st_erp_voucher.erp_voucher_status_cd   IS '전표상태 (코드: ERP_VOUCHER_STATUS — DRAFT/CONFIRMED/SENT/MATCHED/MISMATCH/ERROR)';
COMMENT ON COLUMN st_erp_voucher.erp_voucher_status_cd_before IS '변경 전 전표상태';
COMMENT ON COLUMN st_erp_voucher.voucher_date            IS '전표 기준일자';
COMMENT ON COLUMN st_erp_voucher.erp_voucher_desc        IS '전표 적요';
COMMENT ON COLUMN st_erp_voucher.total_debit_amt         IS '차변 합계 (대변과 일치해야 전표 확정 가능)';
COMMENT ON COLUMN st_erp_voucher.total_credit_amt        IS '대변 합계';
COMMENT ON COLUMN st_erp_voucher.erp_send_date           IS 'ERP 전송일시';
COMMENT ON COLUMN st_erp_voucher.erp_voucher_no          IS 'ERP 채번 전표번호 (전송 후 ERP에서 수신)';
COMMENT ON COLUMN st_erp_voucher.erp_res_msg             IS 'ERP 처리 응답 메시지';
COMMENT ON COLUMN st_erp_voucher.reg_by                  IS '등록자';
COMMENT ON COLUMN st_erp_voucher.reg_date                IS '등록일';
COMMENT ON COLUMN st_erp_voucher.upd_by                  IS '수정자';
COMMENT ON COLUMN st_erp_voucher.upd_date                IS '수정일';

CREATE INDEX idx_st_erp_voucher_settle  ON st_erp_voucher (settle_id);
CREATE INDEX idx_st_erp_voucher_vendor  ON st_erp_voucher (site_id, vendor_id);
CREATE INDEX idx_st_erp_voucher_ym      ON st_erp_voucher (settle_ym);
CREATE INDEX idx_st_erp_voucher_status  ON st_erp_voucher (erp_voucher_status_cd);
CREATE INDEX idx_st_erp_voucher_no      ON st_erp_voucher (erp_voucher_no);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] st_erp_voucher.erp_voucher_type_cd (전표유형) : ERP_VOUCHER_TYPE { SALE:매출, CANCEL:취소, SETTLE:정산, ADJ:조정 }
-- [CODES] st_erp_voucher.erp_voucher_status_cd (전표상태) : ERP_VOUCHER_STATUS { DRAFT:초안, SENT:전송완료, FAILED:전송실패, CONFIRMED:확정 }
