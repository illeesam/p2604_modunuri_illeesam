-- st_recon 테이블 DDL
-- 정산 대사 (기대금액 vs 실제금액 불일치 관리)

CREATE TABLE shopjoy_2604.st_recon (
    recon_id               VARCHAR(21) NOT NULL PRIMARY KEY,
    site_id                VARCHAR(21) NOT NULL,
    vendor_id              VARCHAR(21),
    recon_type_cd          VARCHAR(20) NOT NULL,
    recon_status_cd        VARCHAR(20) DEFAULT 'MISMATCH',
    recon_status_cd_before VARCHAR(20),
    settle_id              VARCHAR(21),
    settle_raw_id          VARCHAR(21),
    ref_id                 VARCHAR(21),
    ref_no                 VARCHAR(50),
    settle_period          VARCHAR(7) ,
    expected_amt           BIGINT      DEFAULT 0,
    actual_amt             BIGINT      DEFAULT 0,
    diff_amt               BIGINT      DEFAULT 0,
    recon_note             TEXT       ,
    resolved_by            VARCHAR(20),
    resolved_date          TIMESTAMP  ,
    reg_by                 VARCHAR(30),
    reg_date               TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    upd_by                 VARCHAR(30),
    upd_date               TIMESTAMP  
);

COMMENT ON TABLE  shopjoy_2604.st_recon IS '정산 대사 (기대금액 vs 실제금액 불일치 관리)';
COMMENT ON COLUMN shopjoy_2604.st_recon.recon_id IS '대사ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.st_recon.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.st_recon.vendor_id IS '업체ID';
COMMENT ON COLUMN shopjoy_2604.st_recon.recon_type_cd IS '대사유형 (코드: RECON_TYPE — ORDER/PAY/CLAIM/VENDOR)';
COMMENT ON COLUMN shopjoy_2604.st_recon.recon_status_cd IS '대사상태 (코드: RECON_STATUS — MATCHED/MISMATCH/RESOLVED)';
COMMENT ON COLUMN shopjoy_2604.st_recon.recon_status_cd_before IS '변경 전 대사상태';
COMMENT ON COLUMN shopjoy_2604.st_recon.settle_id IS '정산ID (st_settle.settle_id)';
COMMENT ON COLUMN shopjoy_2604.st_recon.settle_raw_id IS '수집원장ID (st_settle_raw.settle_raw_id)';
COMMENT ON COLUMN shopjoy_2604.st_recon.ref_id IS '참조ID (order_id / pay_id / claim_id 등)';
COMMENT ON COLUMN shopjoy_2604.st_recon.ref_no IS '참조번호 스냅샷';
COMMENT ON COLUMN shopjoy_2604.st_recon.settle_period IS '정산기간 (YYYY-MM)';
COMMENT ON COLUMN shopjoy_2604.st_recon.expected_amt IS '기대금액 (정산 계산값)';
COMMENT ON COLUMN shopjoy_2604.st_recon.actual_amt IS '실제금액 (외부/결제 확인값)';
COMMENT ON COLUMN shopjoy_2604.st_recon.diff_amt IS '차이금액 (expected_amt - actual_amt)';
COMMENT ON COLUMN shopjoy_2604.st_recon.recon_note IS '대사 메모';
COMMENT ON COLUMN shopjoy_2604.st_recon.resolved_by IS '해소 처리자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.st_recon.resolved_date IS '해소 일시';
COMMENT ON COLUMN shopjoy_2604.st_recon.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.st_recon.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.st_recon.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.st_recon.upd_date IS '수정일';

CREATE INDEX idx_st_recon_period ON shopjoy_2604.st_recon USING btree (settle_period);
CREATE INDEX idx_st_recon_ref ON shopjoy_2604.st_recon USING btree (ref_id);
CREATE INDEX idx_st_recon_settle ON shopjoy_2604.st_recon USING btree (settle_id);
CREATE INDEX idx_st_recon_type ON shopjoy_2604.st_recon USING btree (recon_type_cd, recon_status_cd);
CREATE INDEX idx_st_recon_vendor ON shopjoy_2604.st_recon USING btree (site_id, vendor_id);
