-- ============================================================
CREATE TABLE ec_claim (
    claim_id        VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    order_id        VARCHAR(16)     NOT NULL,
    member_id       VARCHAR(16),
    member_nm       VARCHAR(50),
    claim_type_cd   VARCHAR(20)     NOT NULL,               -- 코드: CLAIM_TYPE (CANCEL/RETURN/EXCHANGE)
    status_cd       VARCHAR(20)     DEFAULT 'REQUESTED',    -- 코드: CLAIM_STATUS
    reason_cd       VARCHAR(50),                            -- 코드: CLAIM_REASON
    reason_detail   TEXT,
    prod_nm         VARCHAR(200),
    refund_method_cd VARCHAR(20),                           -- 코드: REFUND_METHOD
    refund_amt      BIGINT          DEFAULT 0,
    request_date    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    proc_date       TIMESTAMP,
    proc_user_id         VARCHAR(16),
    memo            TEXT,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    -- ── 결재처리/추가결재요청 (관리자 일괄작업) ──
    approval_status_cd VARCHAR(20),                          -- 코드: APPROVAL_STATUS (REQ/APPROVED/REJECTED/DONE)
    approval_amt       BIGINT,                              -- 결재 요청 금액
    approval_target_cd VARCHAR(30),                         -- 코드: APPROVAL_TARGET (ORDER/PROD/DLIV/EXTRA)
    approval_target_nm VARCHAR(200),                        -- 결재 대상명
    approval_reason    VARCHAR(500),                        -- 사유/메모
    approval_req_user_id    VARCHAR(16),                         -- 요청자 (sy_user.user_id)
    approval_req_date  TIMESTAMP,                           -- 요청일시
    approval_aprv_user_id   VARCHAR(16),                         -- 결재자 (sy_user.user_id)
    approval_aprv_date TIMESTAMP,                           -- 결재일시

    PRIMARY KEY (claim_id)
);

COMMENT ON TABLE  ec_claim                IS '클레임 (취소/반품/교환)';
COMMENT ON COLUMN ec_claim.claim_id       IS '클레임ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_claim.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_claim.order_id       IS '주문ID';
COMMENT ON COLUMN ec_claim.member_id      IS '회원ID';
COMMENT ON COLUMN ec_claim.member_nm      IS '회원명';
COMMENT ON COLUMN ec_claim.claim_type_cd  IS '클레임유형 (코드: CLAIM_TYPE)';
COMMENT ON COLUMN ec_claim.status_cd      IS '처리상태 (코드: CLAIM_STATUS)';
COMMENT ON COLUMN ec_claim.reason_cd      IS '사유 (코드: CLAIM_REASON)';
COMMENT ON COLUMN ec_claim.reason_detail  IS '사유 상세';
COMMENT ON COLUMN ec_claim.prod_nm        IS '상품명';
COMMENT ON COLUMN ec_claim.refund_method_cd IS '환불수단 (코드: REFUND_METHOD)';
COMMENT ON COLUMN ec_claim.refund_amt    IS '환불금액';
COMMENT ON COLUMN ec_claim.request_date   IS '요청일시';
COMMENT ON COLUMN ec_claim.proc_date      IS '처리일시';
COMMENT ON COLUMN ec_claim.proc_user_id        IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN ec_claim.memo           IS '관리메모';
COMMENT ON COLUMN ec_claim.reg_by         IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN ec_claim.reg_date       IS '등록일';
COMMENT ON COLUMN ec_claim.upd_by         IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN ec_claim.upd_date       IS '수정일';

COMMENT ON COLUMN ec_claim.approval_status_cd IS '결재상태 (코드: APPROVAL_STATUS)';
COMMENT ON COLUMN ec_claim.approval_amt       IS '결재 요청금액';
COMMENT ON COLUMN ec_claim.approval_target_cd IS '결재대상 구분 (코드: APPROVAL_TARGET)';
COMMENT ON COLUMN ec_claim.approval_target_nm IS '결재 대상명';
COMMENT ON COLUMN ec_claim.approval_reason    IS '사유/메모';
COMMENT ON COLUMN ec_claim.approval_req_user_id    IS '결재 요청자 (sy_user.user_id)';
COMMENT ON COLUMN ec_claim.approval_req_date  IS '결재 요청일시';
COMMENT ON COLUMN ec_claim.approval_aprv_user_id   IS '결재자 (sy_user.user_id)';
COMMENT ON COLUMN ec_claim.approval_aprv_date IS '결재일시';
