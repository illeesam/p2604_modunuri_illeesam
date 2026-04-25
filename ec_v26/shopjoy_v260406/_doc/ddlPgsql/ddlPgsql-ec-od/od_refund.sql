-- ============================================================
-- od_refund : 환불 마스터
-- 클레임(취소/반품) 1건당 1개의 환불 레코드 생성
-- 환불 총액 및 상태 관리 — 수단별 내역은 od_refund_method
-- ============================================================
CREATE TABLE od_refund (
    refund_id           VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    order_id            VARCHAR(21)     NOT NULL,               -- od_order.order_id
    claim_id            VARCHAR(21),                            -- od_claim.claim_id (클레임 환불 시)
    -- ── 환불 구분 ──
    refund_type_cd      VARCHAR(20)     NOT NULL,               -- 코드: REFUND_TYPE
                                                                --   CANCEL   : 주문취소 환불
                                                                --   RETURN   : 반품 환불
                                                                --   PARTIAL  : 부분환불
                                                                --   EXTRA    : 추가결제 환불 (교환 취소 등)
    -- ── 환불 금액 ──
    refund_prod_amt     BIGINT          DEFAULT 0,              -- 환불 상품금액 (쿠폰안분 차감 후)
    refund_coupon_amt   BIGINT          DEFAULT 0,              -- 주문쿠폰 안분 차감액 (차감되어 미환불)
    refund_ship_amt     BIGINT          DEFAULT 0,              -- 환불 배송비 (음수=추가청구)
    refund_save_amt     BIGINT          DEFAULT 0,              -- 적립금 복원금액
    refund_cache_amt    BIGINT          DEFAULT 0,              -- 캐쉬 복원금액
    total_refund_amt    BIGINT          DEFAULT 0,              -- 총 환불금액 (실결제 환불 합계)
    -- ── 환불 상태 ──
    refund_status_cd    VARCHAR(20)     DEFAULT 'PENDING',      -- 코드: REFUND_STATUS
                                                                --   PENDING  : 환불 대기
                                                                --   COMPLT   : 환불 완료
                                                                --   FAILED   : 환불 실패
                                                                --   PARTIAL  : 부분완료 (일부 수단 완료)
    refund_status_cd_before VARCHAR(20),
    refund_req_date     TIMESTAMP,                              -- 환불 요청일시
    refund_complt_date  TIMESTAMP,                              -- 환불 완료일시
    -- ── 귀책 정보 ──
    fault_type_cd       VARCHAR(20),                            -- 코드: CLAIM_FAULT (CUST/VENDOR/PLATFORM)
    -- ── 메모 ──
    refund_reason       VARCHAR(500),
    memo                VARCHAR(300),
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (refund_id)
);

COMMENT ON TABLE od_refund IS '환불 마스터 (클레임 건별 환불 총괄)';
COMMENT ON COLUMN od_refund.refund_id           IS '환불ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN od_refund.site_id             IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN od_refund.order_id            IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN od_refund.claim_id            IS '클레임ID (od_claim.claim_id)';
COMMENT ON COLUMN od_refund.refund_type_cd      IS '환불유형코드 (코드: REFUND_TYPE — CANCEL/RETURN/PARTIAL/EXTRA)';
COMMENT ON COLUMN od_refund.refund_prod_amt     IS '환불 상품금액 (주문쿠폰 안분 차감 후 실환불 대상액)';
COMMENT ON COLUMN od_refund.refund_coupon_amt   IS '주문쿠폰 안분 차감액 (환불 불가 — 쿠폰 재발급 또는 소멸)';
COMMENT ON COLUMN od_refund.refund_ship_amt     IS '환불 배송비 (음수이면 추가청구)';
COMMENT ON COLUMN od_refund.refund_save_amt     IS '적립금 복원금액 (od_order_discnt.SAVE_USE 기준)';
COMMENT ON COLUMN od_refund.refund_cache_amt    IS '캐쉬 복원금액 (od_order_discnt.CACHE_USE 기준)';
COMMENT ON COLUMN od_refund.total_refund_amt    IS '총 환불금액 (실결제 수단으로 돌려주는 합계)';
COMMENT ON COLUMN od_refund.refund_status_cd    IS '환불상태 (코드: REFUND_STATUS — PENDING/COMPLT/FAILED/PARTIAL)';
COMMENT ON COLUMN od_refund.refund_status_cd_before IS '변경 전 환불상태 (코드: REFUND_STATUS)';
COMMENT ON COLUMN od_refund.refund_req_date     IS '환불 요청일시';
COMMENT ON COLUMN od_refund.refund_complt_date  IS '환불 완료일시';
COMMENT ON COLUMN od_refund.fault_type_cd       IS '귀책유형코드 (코드: CLAIM_FAULT — CUST/VENDOR/PLATFORM)';
COMMENT ON COLUMN od_refund.refund_reason       IS '환불 사유';
COMMENT ON COLUMN od_refund.memo                IS '관리 메모';
COMMENT ON COLUMN od_refund.reg_by              IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_refund.reg_date            IS '등록일시';
COMMENT ON COLUMN od_refund.upd_by              IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_refund.upd_date            IS '수정일시';

CREATE INDEX idx_od_refund_order     ON od_refund (order_id);
CREATE INDEX idx_od_refund_claim     ON od_refund (claim_id) WHERE claim_id IS NOT NULL;
CREATE INDEX idx_od_refund_status    ON od_refund (refund_status_cd);
CREATE INDEX idx_od_refund_req_date  ON od_refund (refund_req_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] od_refund.refund_type_cd (환불유형코드) : REFUND_TYPE { CANCEL:취소환불, RETURN:반품환불, PARTIAL:부분환불, EXTRA:추가결제 }
-- [CODES] od_refund.refund_status_cd (환불상태) : REFUND_STATUS { PENDING:대기, COMPLT:완료, FAILED:실패 }
-- [CODES] od_refund.fault_type_cd (귀책유형코드) : FAULT_TYPE { CUST:고객귀책, VENDOR:업체귀책, PLATFORM:플랫폼귀책 }
