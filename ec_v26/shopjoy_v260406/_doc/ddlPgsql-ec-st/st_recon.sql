-- ============================================================
-- st_recon : 정산 대사 (Reconciliation)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- 주문·결제·클레임·업체 별 기대금액 vs 실제금액 차이 관리
-- ============================================================
CREATE TABLE st_recon (
    recon_id                VARCHAR(21)     NOT NULL,
    site_id                 VARCHAR(21)     NOT NULL,               -- sy_site.site_id
    vendor_id               VARCHAR(21),                            -- sy_vendor.vendor_id

    -- ── 대사 구분
    recon_type_cd           VARCHAR(20)     NOT NULL,               -- 코드: RECON_TYPE (ORDER:주문/PAY:결제/CLAIM:클레임/VENDOR:업체)
    recon_status_cd         VARCHAR(20)     DEFAULT 'MISMATCH',     -- 코드: RECON_STATUS (MATCHED:일치/MISMATCH:불일치/RESOLVED:해소)
    recon_status_cd_before  VARCHAR(20),                            -- 변경 전 대사상태

    -- ── 참조
    settle_id               VARCHAR(21),                            -- st_settle.settle_id
    settle_raw_id           VARCHAR(21),                            -- st_settle_raw.settle_raw_id
    ref_id                  VARCHAR(21),                            -- 대사 참조ID (order_id / pay_id / claim_id 등)
    ref_no                  VARCHAR(50),                            -- 대사 참조번호 (스냅샷)
    settle_period           VARCHAR(7),                             -- 정산기간 (YYYY-MM)

    -- ── 금액 대사
    expected_amt            BIGINT          DEFAULT 0,              -- 기대금액 (정산 계산값)
    actual_amt              BIGINT          DEFAULT 0,              -- 실제금액 (외부/결제 확인값)
    diff_amt                BIGINT          DEFAULT 0,              -- 차이금액 (expected - actual)

    -- ── 해소
    recon_note              TEXT,                                   -- 대사 메모
    resolved_by             VARCHAR(21),                            -- 해소 처리자 (sy_user.user_id)
    resolved_date           TIMESTAMP,                              -- 해소 일시

    reg_by                  VARCHAR(30),
    reg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                  VARCHAR(30),
    upd_date                TIMESTAMP,

    PRIMARY KEY (recon_id)
);

COMMENT ON TABLE  st_recon IS '정산 대사 (기대금액 vs 실제금액 불일치 관리)';
COMMENT ON COLUMN st_recon.recon_id               IS '대사ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN st_recon.site_id                IS '사이트ID';
COMMENT ON COLUMN st_recon.vendor_id              IS '업체ID';
COMMENT ON COLUMN st_recon.recon_type_cd          IS '대사유형 (코드: RECON_TYPE — ORDER/PAY/CLAIM/VENDOR)';
COMMENT ON COLUMN st_recon.recon_status_cd        IS '대사상태 (코드: RECON_STATUS — MATCHED/MISMATCH/RESOLVED)';
COMMENT ON COLUMN st_recon.recon_status_cd_before IS '변경 전 대사상태';
COMMENT ON COLUMN st_recon.settle_id              IS '정산ID (st_settle.settle_id)';
COMMENT ON COLUMN st_recon.settle_raw_id          IS '수집원장ID (st_settle_raw.settle_raw_id)';
COMMENT ON COLUMN st_recon.ref_id                 IS '참조ID (order_id / pay_id / claim_id 등)';
COMMENT ON COLUMN st_recon.ref_no                 IS '참조번호 스냅샷';
COMMENT ON COLUMN st_recon.settle_period          IS '정산기간 (YYYY-MM)';
COMMENT ON COLUMN st_recon.expected_amt           IS '기대금액 (정산 계산값)';
COMMENT ON COLUMN st_recon.actual_amt             IS '실제금액 (외부/결제 확인값)';
COMMENT ON COLUMN st_recon.diff_amt               IS '차이금액 (expected_amt - actual_amt)';
COMMENT ON COLUMN st_recon.recon_note             IS '대사 메모';
COMMENT ON COLUMN st_recon.resolved_by            IS '해소 처리자 (sy_user.user_id)';
COMMENT ON COLUMN st_recon.resolved_date          IS '해소 일시';
COMMENT ON COLUMN st_recon.reg_by                 IS '등록자';
COMMENT ON COLUMN st_recon.reg_date               IS '등록일';
COMMENT ON COLUMN st_recon.upd_by                 IS '수정자';
COMMENT ON COLUMN st_recon.upd_date               IS '수정일';

CREATE INDEX idx_st_recon_settle     ON st_recon (settle_id);
CREATE INDEX idx_st_recon_vendor     ON st_recon (site_id, vendor_id);
CREATE INDEX idx_st_recon_type       ON st_recon (recon_type_cd, recon_status_cd);
CREATE INDEX idx_st_recon_period     ON st_recon (settle_period);
CREATE INDEX idx_st_recon_ref        ON st_recon (ref_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] st_recon.recon_type_cd (대사유형) : RECON_TYPE { ORDER:주문, SETTLE:정산 }
-- [CODES] st_recon.recon_status_cd (대사상태) : RECON_STATUS { MATCHED:일치, DIFF:불일치, MANUAL:수동처리 }
