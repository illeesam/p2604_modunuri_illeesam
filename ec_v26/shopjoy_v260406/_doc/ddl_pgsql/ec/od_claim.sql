-- od_claim 테이블 DDL
-- 클레임 (취소/반품/교환)

CREATE TABLE shopjoy_2604.od_claim (
    claim_id                   VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id                    VARCHAR(21) ,
    order_id                   VARCHAR(21)  NOT NULL,
    member_id                  VARCHAR(21) ,
    member_nm                  VARCHAR(50) ,
    claim_type_cd              VARCHAR(20)  NOT NULL,
    claim_status_cd            VARCHAR(20)  DEFAULT 'REQUESTED',
    claim_status_cd_before     VARCHAR(20) ,
    reason_cd                  VARCHAR(50) ,
    reason_detail              TEXT        ,
    prod_nm                    VARCHAR(200),
    customer_fault_yn          VARCHAR(1)   DEFAULT 'N',
    claim_cancel_yn            VARCHAR(1)   DEFAULT 'N',
    claim_cancel_date          TIMESTAMP   ,
    claim_cancel_reason_cd     VARCHAR(50) ,
    claim_cancel_reason_detail VARCHAR(300),
    refund_method_cd           VARCHAR(20) ,
    refund_amt                 BIGINT       DEFAULT 0,
    refund_prod_amt            BIGINT       DEFAULT 0,
    refund_shipping_amt        BIGINT       DEFAULT 0,
    refund_save_amt            BIGINT       DEFAULT 0,
    refund_bank_cd             VARCHAR(20) ,
    refund_account_no          VARCHAR(50) ,
    refund_account_nm          VARCHAR(50) ,
    request_date               TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    proc_date                  TIMESTAMP   ,
    proc_user_id               VARCHAR(21) ,
    memo                       TEXT        ,
    add_shipping_fee           BIGINT       DEFAULT 0,
    add_shipping_fee_charge_cd VARCHAR(20) ,
    add_shipping_fee_reason    VARCHAR(300),
    collect_nm                 VARCHAR(50) ,
    collect_phone              VARCHAR(20) ,
    collect_zip                VARCHAR(10) ,
    collect_addr               VARCHAR(200),
    collect_addr_detail        VARCHAR(200),
    collect_req_memo           VARCHAR(200),
    collect_schd_date          TIMESTAMP   ,
    return_shipping_fee        BIGINT       DEFAULT 0,
    return_courier_cd          VARCHAR(30) ,
    return_tracking_no         VARCHAR(100),
    return_status_cd           VARCHAR(20) ,
    return_status_cd_before    VARCHAR(20) ,
    inbound_shipping_fee       BIGINT       DEFAULT 0,
    inbound_courier_cd         VARCHAR(30) ,
    inbound_tracking_no        VARCHAR(100),
    inbound_dliv_id            VARCHAR(21) ,
    exch_recv_nm               VARCHAR(50) ,
    exch_recv_phone            VARCHAR(20) ,
    exch_recv_zip              VARCHAR(10) ,
    exch_recv_addr             VARCHAR(200),
    exch_recv_addr_detail      VARCHAR(200),
    exch_recv_req_memo         VARCHAR(200),
    exchange_shipping_fee      BIGINT       DEFAULT 0,
    exchange_courier_cd        VARCHAR(30) ,
    exchange_tracking_no       VARCHAR(100),
    outbound_dliv_id           VARCHAR(21) ,
    total_shipping_fee         BIGINT       DEFAULT 0,
    shipping_fee_paid_yn       VARCHAR(1)   DEFAULT 'N',
    shipping_fee_paid_date     TIMESTAMP   ,
    shipping_fee_memo          VARCHAR(300),
    reg_by                     VARCHAR(30) ,
    reg_date                   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by                     VARCHAR(30) ,
    upd_date                   TIMESTAMP   ,
    appr_status_cd             VARCHAR(20) ,
    appr_status_cd_before      VARCHAR(20) ,
    appr_amt                   BIGINT      ,
    appr_target_cd             VARCHAR(30) ,
    appr_target_nm             VARCHAR(200),
    appr_reason                VARCHAR(500),
    appr_req_user_id           VARCHAR(21) ,
    appr_req_date              TIMESTAMP   ,
    appr_aprv_user_id          VARCHAR(21) ,
    appr_aprv_date             TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.od_claim IS '클레임 (취소/반품/교환)';
COMMENT ON COLUMN shopjoy_2604.od_claim.claim_id IS '클레임ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.od_claim.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.od_claim.order_id IS '주문ID';
COMMENT ON COLUMN shopjoy_2604.od_claim.member_id IS '회원ID';
COMMENT ON COLUMN shopjoy_2604.od_claim.member_nm IS '회원명';
COMMENT ON COLUMN shopjoy_2604.od_claim.claim_type_cd IS '클레임유형 (코드: CLAIM_TYPE)';
COMMENT ON COLUMN shopjoy_2604.od_claim.claim_status_cd IS '클레임상태 (코드: CLAIM_STATUS)';
COMMENT ON COLUMN shopjoy_2604.od_claim.claim_status_cd_before IS '변경 전 클레임상태 (코드: CLAIM_STATUS)';
COMMENT ON COLUMN shopjoy_2604.od_claim.reason_cd IS '사유코드 (코드: CANCEL_REASON/RETURN_REASON/EXCHANGE_REASON)';
COMMENT ON COLUMN shopjoy_2604.od_claim.reason_detail IS '사유 상세';
COMMENT ON COLUMN shopjoy_2604.od_claim.prod_nm IS '대표 상품명';
COMMENT ON COLUMN shopjoy_2604.od_claim.customer_fault_yn IS '고객귀책여부 (Y=고객귀책, N=판매자귀책)';
COMMENT ON COLUMN shopjoy_2604.od_claim.claim_cancel_yn IS '클레임 철회여부 Y/N (신청 자체를 취소한 경우)';
COMMENT ON COLUMN shopjoy_2604.od_claim.claim_cancel_date IS '클레임 철회일시';
COMMENT ON COLUMN shopjoy_2604.od_claim.claim_cancel_reason_cd IS '클레임 철회사유코드';
COMMENT ON COLUMN shopjoy_2604.od_claim.claim_cancel_reason_detail IS '클레임 철회사유상세';
COMMENT ON COLUMN shopjoy_2604.od_claim.refund_method_cd IS '환불수단 (코드: REFUND_METHOD)';
COMMENT ON COLUMN shopjoy_2604.od_claim.refund_amt IS '환불 합계금액 (상품금액+배송비-추가배송비-적립금복원)';
COMMENT ON COLUMN shopjoy_2604.od_claim.refund_prod_amt IS '환불 상품금액';
COMMENT ON COLUMN shopjoy_2604.od_claim.refund_shipping_amt IS '환불 배송비';
COMMENT ON COLUMN shopjoy_2604.od_claim.refund_save_amt IS '환불 적립금 합계 (사용 적립금 복원액)';
COMMENT ON COLUMN shopjoy_2604.od_claim.refund_bank_cd IS '환불 은행코드 (코드: BANK_CODE — 계좌이체 환불 시)';
COMMENT ON COLUMN shopjoy_2604.od_claim.refund_account_no IS '환불 계좌번호';
COMMENT ON COLUMN shopjoy_2604.od_claim.refund_account_nm IS '환불 예금주명';
COMMENT ON COLUMN shopjoy_2604.od_claim.request_date IS '클레임 요청일시';
COMMENT ON COLUMN shopjoy_2604.od_claim.proc_date IS '처리일시';
COMMENT ON COLUMN shopjoy_2604.od_claim.proc_user_id IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.od_claim.memo IS '관리메모';
COMMENT ON COLUMN shopjoy_2604.od_claim.add_shipping_fee IS '추가배송비 (교환=출고배송비, 반품/취소=무료배송 조건 파괴 시 추가)';
COMMENT ON COLUMN shopjoy_2604.od_claim.add_shipping_fee_charge_cd IS '추가배송비 청구방법코드';
COMMENT ON COLUMN shopjoy_2604.od_claim.add_shipping_fee_reason IS '추가배송비 면제사유';
COMMENT ON COLUMN shopjoy_2604.od_claim.collect_nm IS '수거지 성명 (반품·교환 수거 주소)';
COMMENT ON COLUMN shopjoy_2604.od_claim.collect_phone IS '수거지 연락처';
COMMENT ON COLUMN shopjoy_2604.od_claim.collect_zip IS '수거지 우편번호';
COMMENT ON COLUMN shopjoy_2604.od_claim.collect_addr IS '수거지 기본주소';
COMMENT ON COLUMN shopjoy_2604.od_claim.collect_addr_detail IS '수거지 상세주소';
COMMENT ON COLUMN shopjoy_2604.od_claim.collect_req_memo IS '수거 요청사항';
COMMENT ON COLUMN shopjoy_2604.od_claim.collect_schd_date IS '수거 예정일시';
COMMENT ON COLUMN shopjoy_2604.od_claim.return_shipping_fee IS '수거배송료';
COMMENT ON COLUMN shopjoy_2604.od_claim.return_courier_cd IS '수거 택배사 (코드: COURIER)';
COMMENT ON COLUMN shopjoy_2604.od_claim.return_tracking_no IS '수거 송장번호';
COMMENT ON COLUMN shopjoy_2604.od_claim.return_status_cd IS '수거 상태 (코드: DLIV_STATUS)';
COMMENT ON COLUMN shopjoy_2604.od_claim.return_status_cd_before IS '변경 전 수거상태 (코드: DLIV_STATUS)';
COMMENT ON COLUMN shopjoy_2604.od_claim.inbound_shipping_fee IS '반입배송료';
COMMENT ON COLUMN shopjoy_2604.od_claim.inbound_courier_cd IS '반입 택배사 (코드: COURIER)';
COMMENT ON COLUMN shopjoy_2604.od_claim.inbound_tracking_no IS '반입 송장번호';
COMMENT ON COLUMN shopjoy_2604.od_claim.inbound_dliv_id IS '반입 배송ID (od_dliv.)';
COMMENT ON COLUMN shopjoy_2604.od_claim.exch_recv_nm IS '교환 수령자명 (원 주문 배송지와 다를 경우)';
COMMENT ON COLUMN shopjoy_2604.od_claim.exch_recv_phone IS '교환 수령자 연락처';
COMMENT ON COLUMN shopjoy_2604.od_claim.exch_recv_zip IS '교환 수령지 우편번호';
COMMENT ON COLUMN shopjoy_2604.od_claim.exch_recv_addr IS '교환 수령지 기본주소';
COMMENT ON COLUMN shopjoy_2604.od_claim.exch_recv_addr_detail IS '교환 수령지 상세주소';
COMMENT ON COLUMN shopjoy_2604.od_claim.exch_recv_req_memo IS '교환 배송 요청사항';
COMMENT ON COLUMN shopjoy_2604.od_claim.exchange_shipping_fee IS '교환상품 발송배송료';
COMMENT ON COLUMN shopjoy_2604.od_claim.exchange_courier_cd IS '교환상품 발송 택배사 (코드: COURIER)';
COMMENT ON COLUMN shopjoy_2604.od_claim.exchange_tracking_no IS '교환상품 발송 송장번호';
COMMENT ON COLUMN shopjoy_2604.od_claim.outbound_dliv_id IS '교환상품 발송 배송ID (od_dliv.)';
COMMENT ON COLUMN shopjoy_2604.od_claim.total_shipping_fee IS '총 배송료 (수거+반입+발송)';
COMMENT ON COLUMN shopjoy_2604.od_claim.shipping_fee_paid_yn IS '배송료 정산 완료 여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.od_claim.shipping_fee_paid_date IS '배송료 정산일시';
COMMENT ON COLUMN shopjoy_2604.od_claim.shipping_fee_memo IS '배송료 비고';
COMMENT ON COLUMN shopjoy_2604.od_claim.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.od_claim.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.od_claim.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.od_claim.upd_date IS '수정일';
COMMENT ON COLUMN shopjoy_2604.od_claim.appr_status_cd IS '결재상태 (코드: APPROVAL_STATUS)';
COMMENT ON COLUMN shopjoy_2604.od_claim.appr_status_cd_before IS '변경 전 결재상태 (코드: APPROVAL_STATUS)';
COMMENT ON COLUMN shopjoy_2604.od_claim.appr_amt IS '결재 요청금액';
COMMENT ON COLUMN shopjoy_2604.od_claim.appr_target_cd IS '결재대상 구분 (코드: APPROVAL_TARGET)';
COMMENT ON COLUMN shopjoy_2604.od_claim.appr_target_nm IS '결재 대상명';
COMMENT ON COLUMN shopjoy_2604.od_claim.appr_reason IS '사유/메모';
COMMENT ON COLUMN shopjoy_2604.od_claim.appr_req_user_id IS '결재 요청자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.od_claim.appr_req_date IS '결재 요청일시';
COMMENT ON COLUMN shopjoy_2604.od_claim.appr_aprv_user_id IS '결재자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.od_claim.appr_aprv_date IS '결재일시';

CREATE INDEX idx_od_claim_date ON shopjoy_2604.od_claim USING btree (request_date);
CREATE INDEX idx_od_claim_member ON shopjoy_2604.od_claim USING btree (member_id);
CREATE INDEX idx_od_claim_order ON shopjoy_2604.od_claim USING btree (order_id);
CREATE INDEX idx_od_claim_status ON shopjoy_2604.od_claim USING btree (claim_status_cd);
CREATE INDEX idx_od_claim_type ON shopjoy_2604.od_claim USING btree (claim_type_cd);
