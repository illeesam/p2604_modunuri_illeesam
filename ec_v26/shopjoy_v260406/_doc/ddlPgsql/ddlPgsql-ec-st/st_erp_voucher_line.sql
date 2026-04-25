-- ============================================================
-- st_erp_voucher_line : ERP 전표 라인 (분개 항목)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- 전표 1건당 차변/대변 복수 라인 (대차 균형 필수)
-- ============================================================
CREATE TABLE st_erp_voucher_line (
    erp_voucher_line_id     VARCHAR(21)     NOT NULL,
    erp_voucher_id          VARCHAR(21)     NOT NULL,               -- st_erp_voucher.erp_voucher_id
    line_no                 INTEGER         NOT NULL,               -- 라인 순번

    -- ── 계정 정보
    account_cd              VARCHAR(20)     NOT NULL,               -- 계정코드 (ERP 계정과목)
    account_nm              VARCHAR(100),                           -- 계정명 (스냅샷)
    cost_center_cd          VARCHAR(20),                            -- 코스트센터 코드
    profit_center_cd        VARCHAR(20),                            -- 수익센터 코드

    -- ── 금액 (차변/대변 중 하나만 입력)
    debit_amt               BIGINT          DEFAULT 0,              -- 차변 금액
    credit_amt              BIGINT          DEFAULT 0,              -- 대변 금액

    -- ── 참조
    ref_type_cd             VARCHAR(20),                            -- 참조유형 (SETTLE/ORDER/CLAIM/PAY/ADJ)
    ref_id                  VARCHAR(21),                            -- 참조ID (settle_id / order_id 등)
    line_memo               VARCHAR(300),                           -- 라인 적요

    reg_by                  VARCHAR(30),
    reg_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,

    PRIMARY KEY (erp_voucher_line_id),
    UNIQUE (erp_voucher_id, line_no)
);

COMMENT ON TABLE  st_erp_voucher_line IS 'ERP 전표 라인 (분개 항목, 차변/대변 1행씩)';
COMMENT ON COLUMN st_erp_voucher_line.erp_voucher_line_id IS '전표라인ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN st_erp_voucher_line.erp_voucher_id      IS 'ERP전표ID (st_erp_voucher.erp_voucher_id)';
COMMENT ON COLUMN st_erp_voucher_line.line_no             IS '라인 순번 (전표 내 고유)';
COMMENT ON COLUMN st_erp_voucher_line.account_cd          IS '계정코드 (ERP 계정과목 코드)';
COMMENT ON COLUMN st_erp_voucher_line.account_nm          IS '계정명 스냅샷';
COMMENT ON COLUMN st_erp_voucher_line.cost_center_cd      IS '코스트센터 코드';
COMMENT ON COLUMN st_erp_voucher_line.profit_center_cd    IS '수익센터 코드';
COMMENT ON COLUMN st_erp_voucher_line.debit_amt           IS '차변 금액 (대변과 상호 배타적)';
COMMENT ON COLUMN st_erp_voucher_line.credit_amt          IS '대변 금액 (차변과 상호 배타적)';
COMMENT ON COLUMN st_erp_voucher_line.ref_type_cd         IS '참조유형 (SETTLE/ORDER/CLAIM/PAY/ADJ)';
COMMENT ON COLUMN st_erp_voucher_line.ref_id              IS '참조ID (settle_id / order_id / claim_id 등)';
COMMENT ON COLUMN st_erp_voucher_line.line_memo           IS '라인 적요';
COMMENT ON COLUMN st_erp_voucher_line.reg_by              IS '등록자';
COMMENT ON COLUMN st_erp_voucher_line.reg_date            IS '등록일';
COMMENT ON COLUMN st_erp_voucher_line.upd_by   IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN st_erp_voucher_line.upd_date IS '수정일';

CREATE INDEX idx_st_erp_voucher_line_voucher ON st_erp_voucher_line (erp_voucher_id);
CREATE INDEX idx_st_erp_voucher_line_account ON st_erp_voucher_line (account_cd);
CREATE INDEX idx_st_erp_voucher_line_ref     ON st_erp_voucher_line (ref_id);
