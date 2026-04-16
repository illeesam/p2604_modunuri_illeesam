-- ============================================================
CREATE TABLE od_claim (
    claim_id        VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    order_id        VARCHAR(16)     NOT NULL,
    member_id       VARCHAR(16),
    member_nm       VARCHAR(50),
    claim_type_cd   VARCHAR(20)     NOT NULL,               -- 코드: CLAIM_TYPE (CANCEL/RETURN/EXCHANGE)
    claim_status_cd VARCHAR(20)     DEFAULT 'REQUESTED',    -- 코드: CLAIM_STATUS
    claim_status_cd_before VARCHAR(20),                     -- 변경 전 클레임상태
    reason_cd       VARCHAR(50),                            -- 코드: CLAIM_REASON
    reason_detail   TEXT,
    prod_nm         VARCHAR(200),
    refund_method_cd VARCHAR(20),                           -- 코드: REFUND_METHOD
    refund_amt      BIGINT          DEFAULT 0,
    request_date    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    proc_date       TIMESTAMP,
    proc_user_id         VARCHAR(16),
    memo            TEXT,
    -- ── 반품 배송정보 ──
    return_shipping_fee  BIGINT       DEFAULT 0,           -- 수거배송료
    return_courier_cd    VARCHAR(30),                       -- 수거 택배사 (코드: COURIER)
    return_tracking_no   VARCHAR(100),                      -- 수거 송장
    return_status_cd     VARCHAR(20),                       -- 수거 상태 (코드: DLIV_STATUS)
    return_status_cd_before VARCHAR(20),                   -- 변경 전 수거상태
    inbound_shipping_fee BIGINT       DEFAULT 0,           -- 반입배송료
    inbound_courier_cd   VARCHAR(30),                       -- 반입 택배사 (코드: COURIER)
    inbound_tracking_no  VARCHAR(100),                      -- 반입 송장
    inbound_dliv_id      VARCHAR(16),                       -- 반입 배송ID (od_dliv.)
    -- ── 교환 배송정보 ──
    exchange_shipping_fee BIGINT      DEFAULT 0,           -- 교환상품 발송배송료
    exchange_courier_cd   VARCHAR(30),                      -- 교환상품 발송 택배사 (코드: COURIER)
    exchange_tracking_no  VARCHAR(100),                     -- 교환상품 발송 송장
    outbound_dliv_id      VARCHAR(16),                      -- 교환상품 발송 배송ID (od_dliv.)
    -- ── 배송료 정산 ──
    total_shipping_fee   BIGINT       DEFAULT 0,           -- 총 배송료 (수거+반입+발송)
    shipping_fee_paid_yn CHAR(1)      DEFAULT 'N',         -- 배송료 정산 완료 여부
    shipping_fee_paid_date TIMESTAMP,                       -- 배송료 정산일시
    shipping_fee_memo    VARCHAR(300),                      -- 배송료 비고
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    -- ── 결재처리/추가결재요청 (관리자 일괄작업) ──
    appr_status_cd VARCHAR(20),                          -- 코드: APPROVAL_STATUS (REQ/APPROVED/REJECTED/DONE)
    appr_status_cd_before VARCHAR(20),                  -- 변경 전 결재상태
    appr_amt       BIGINT,                              -- 결재 요청 금액
    appr_target_cd VARCHAR(30),                         -- 코드: APPROVAL_TARGET (ORDER/PROD/DLIV/EXTRA)
    appr_target_nm VARCHAR(200),                        -- 결재 대상명
    appr_reason    VARCHAR(500),                        -- 사유/메모
    appr_req_user_id    VARCHAR(16),                         -- 요청자 (sy_user.user_id)
    appr_req_date  TIMESTAMP,                           -- 요청일시
    appr_aprv_user_id   VARCHAR(16),                         -- 결재자 (sy_user.user_id)
    appr_aprv_date TIMESTAMP,                           -- 결재일시

    PRIMARY KEY (claim_id)
);

COMMENT ON TABLE od_claim IS '클레임 (취소/반품/교환)';
COMMENT ON COLUMN od_claim.claim_id       IS '클레임ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN od_claim.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN od_claim.order_id       IS '주문ID';
COMMENT ON COLUMN od_claim.member_id      IS '회원ID';
COMMENT ON COLUMN od_claim.member_nm      IS '회원명';
COMMENT ON COLUMN od_claim.claim_type_cd  IS '클레임유형 (코드: CLAIM_TYPE)';
COMMENT ON COLUMN od_claim.claim_status_cd IS '클레임상태 (코드: CLAIM_STATUS)';
COMMENT ON COLUMN od_claim.claim_status_cd_before IS '변경 전 클레임상태 (코드: CLAIM_STATUS)';
COMMENT ON COLUMN od_claim.reason_cd      IS '사유 (코드: CLAIM_REASON)';
COMMENT ON COLUMN od_claim.reason_detail  IS '사유 상세';
COMMENT ON COLUMN od_claim.prod_nm        IS '상품명';
COMMENT ON COLUMN od_claim.refund_method_cd IS '환불수단 (코드: REFUND_METHOD)';
COMMENT ON COLUMN od_claim.refund_amt    IS '환불금액';
COMMENT ON COLUMN od_claim.request_date   IS '요청일시';
COMMENT ON COLUMN od_claim.proc_date      IS '처리일시';
COMMENT ON COLUMN od_claim.proc_user_id        IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN od_claim.memo           IS '관리메모';
COMMENT ON COLUMN od_claim.return_shipping_fee   IS '수거배송료';
COMMENT ON COLUMN od_claim.return_courier_cd     IS '수거 택배사 (코드: COURIER)';
COMMENT ON COLUMN od_claim.return_tracking_no    IS '수거 송장번호';
COMMENT ON COLUMN od_claim.return_status_cd      IS '수거 상태 (코드: DLIV_STATUS)';
COMMENT ON COLUMN od_claim.return_status_cd_before IS '변경 전 수거상태 (코드: DLIV_STATUS)';
COMMENT ON COLUMN od_claim.inbound_shipping_fee  IS '반입배송료';
COMMENT ON COLUMN od_claim.inbound_courier_cd    IS '반입 택배사 (코드: COURIER)';
COMMENT ON COLUMN od_claim.inbound_tracking_no   IS '반입 송장번호';
COMMENT ON COLUMN od_claim.inbound_dliv_id       IS '반입 배송ID (od_dliv.)';
COMMENT ON COLUMN od_claim.exchange_shipping_fee IS '교환상품 발송배송료';
COMMENT ON COLUMN od_claim.exchange_courier_cd   IS '교환상품 발송 택배사 (코드: COURIER)';
COMMENT ON COLUMN od_claim.exchange_tracking_no  IS '교환상품 발송 송장번호';
COMMENT ON COLUMN od_claim.outbound_dliv_id      IS '교환상품 발송 배송ID (od_dliv.)';
COMMENT ON COLUMN od_claim.total_shipping_fee    IS '총 배송료 (수거+반입+발송)';
COMMENT ON COLUMN od_claim.shipping_fee_paid_yn  IS '배송료 정산 완료 여부 (Y/N)';
COMMENT ON COLUMN od_claim.shipping_fee_paid_date IS '배송료 정산일시';
COMMENT ON COLUMN od_claim.shipping_fee_memo     IS '배송료 비고';
COMMENT ON COLUMN od_claim.reg_by         IS '등록자 (sy_user.user_id, mb_mem.member_id)';
COMMENT ON COLUMN od_claim.reg_date       IS '등록일';
COMMENT ON COLUMN od_claim.upd_by         IS '수정자 (sy_user.user_id, mb_mem.member_id)';
COMMENT ON COLUMN od_claim.upd_date       IS '수정일';

COMMENT ON COLUMN od_claim.appr_status_cd IS '결재상태 (코드: APPROVAL_STATUS)';
COMMENT ON COLUMN od_claim.appr_status_cd_before IS '변경 전 결재상태 (코드: APPROVAL_STATUS)';
COMMENT ON COLUMN od_claim.appr_amt       IS '결재 요청금액';
COMMENT ON COLUMN od_claim.appr_target_cd IS '결재대상 구분 (코드: APPROVAL_TARGET)';
COMMENT ON COLUMN od_claim.appr_target_nm IS '결재 대상명';
COMMENT ON COLUMN od_claim.appr_reason    IS '사유/메모';
COMMENT ON COLUMN od_claim.appr_req_user_id    IS '결재 요청자 (sy_user.user_id)';
COMMENT ON COLUMN od_claim.appr_req_date  IS '결재 요청일시';
COMMENT ON COLUMN od_claim.appr_aprv_user_id   IS '결재자 (sy_user.user_id)';
COMMENT ON COLUMN od_claim.appr_aprv_date IS '결재일시';
