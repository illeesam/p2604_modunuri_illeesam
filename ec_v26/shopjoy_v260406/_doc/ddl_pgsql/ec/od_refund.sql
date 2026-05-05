-- od_refund 테이블 DDL
-- 환불 마스터 (클레임 건별 환불 총괄)

CREATE TABLE shopjoy_2604.od_refund (
    refund_id               VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id                 VARCHAR(21) ,
    order_id                VARCHAR(21)  NOT NULL,
    claim_id                VARCHAR(21) ,
    refund_type_cd          VARCHAR(20)  NOT NULL,
    refund_prod_amt         BIGINT       DEFAULT 0,
    refund_coupon_amt       BIGINT       DEFAULT 0,
    refund_ship_amt         BIGINT       DEFAULT 0,
    refund_save_amt         BIGINT       DEFAULT 0,
    refund_cache_amt        BIGINT       DEFAULT 0,
    total_refund_amt        BIGINT       DEFAULT 0,
    refund_status_cd        VARCHAR(20)  DEFAULT 'PENDING',
    refund_status_cd_before VARCHAR(20) ,
    refund_req_date         TIMESTAMP   ,
    refund_complt_date      TIMESTAMP   ,
    fault_type_cd           VARCHAR(20) ,
    refund_reason           VARCHAR(500),
    memo                    VARCHAR(300),
    reg_by                  VARCHAR(30) ,
    reg_date                TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by                  VARCHAR(30) ,
    upd_date                TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.od_refund IS '환불 마스터 (클레임 건별 환불 총괄)';
COMMENT ON COLUMN shopjoy_2604.od_refund.refund_id IS '환불ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.od_refund.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.od_refund.order_id IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN shopjoy_2604.od_refund.claim_id IS '클레임ID (od_claim.claim_id)';
COMMENT ON COLUMN shopjoy_2604.od_refund.refund_type_cd IS '환불유형코드 (코드: REFUND_TYPE — CANCEL/RETURN/PARTIAL/EXTRA)';
COMMENT ON COLUMN shopjoy_2604.od_refund.refund_prod_amt IS '환불 상품금액 (주문쿠폰 안분 차감 후 실환불 대상액)';
COMMENT ON COLUMN shopjoy_2604.od_refund.refund_coupon_amt IS '주문쿠폰 안분 차감액 (환불 불가 — 쿠폰 재발급 또는 소멸)';
COMMENT ON COLUMN shopjoy_2604.od_refund.refund_ship_amt IS '환불 배송비 (음수이면 추가청구)';
COMMENT ON COLUMN shopjoy_2604.od_refund.refund_save_amt IS '적립금 복원금액 (od_order_discnt.SAVE_USE 기준)';
COMMENT ON COLUMN shopjoy_2604.od_refund.refund_cache_amt IS '캐쉬 복원금액 (od_order_discnt.CACHE_USE 기준)';
COMMENT ON COLUMN shopjoy_2604.od_refund.total_refund_amt IS '총 환불금액 (실결제 수단으로 돌려주는 합계)';
COMMENT ON COLUMN shopjoy_2604.od_refund.refund_status_cd IS '환불상태 (코드: REFUND_STATUS — PENDING/COMPLT/FAILED/PARTIAL)';
COMMENT ON COLUMN shopjoy_2604.od_refund.refund_status_cd_before IS '변경 전 환불상태 (코드: REFUND_STATUS)';
COMMENT ON COLUMN shopjoy_2604.od_refund.refund_req_date IS '환불 요청일시';
COMMENT ON COLUMN shopjoy_2604.od_refund.refund_complt_date IS '환불 완료일시';
COMMENT ON COLUMN shopjoy_2604.od_refund.fault_type_cd IS '귀책유형코드 (코드: CLAIM_FAULT — CUST/VENDOR/PLATFORM)';
COMMENT ON COLUMN shopjoy_2604.od_refund.refund_reason IS '환불 사유';
COMMENT ON COLUMN shopjoy_2604.od_refund.memo IS '관리 메모';
COMMENT ON COLUMN shopjoy_2604.od_refund.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.od_refund.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.od_refund.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.od_refund.upd_date IS '수정일시';

CREATE INDEX idx_od_refund_claim ON shopjoy_2604.od_refund USING btree (claim_id) WHERE (claim_id IS NOT NULL);
CREATE INDEX idx_od_refund_order ON shopjoy_2604.od_refund USING btree (order_id);
CREATE INDEX idx_od_refund_req_date ON shopjoy_2604.od_refund USING btree (refund_req_date);
CREATE INDEX idx_od_refund_status ON shopjoy_2604.od_refund USING btree (refund_status_cd);
