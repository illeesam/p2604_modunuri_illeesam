-- od_order 테이블 DDL
-- 주문

CREATE TABLE shopjoy_2604.od_order (
    order_id               VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id                VARCHAR(21) ,
    member_id              VARCHAR(21)  NOT NULL,
    member_nm              VARCHAR(50) ,
    orderer_email          VARCHAR(100),
    order_grade_cd         VARCHAR(20) ,
    order_date             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    access_channel_cd      VARCHAR(20) ,
    total_amt              BIGINT       DEFAULT 0,
    total_discount_amt     BIGINT       DEFAULT 0,
    coupon_discount_amt    BIGINT       DEFAULT 0,
    cache_use_amt          BIGINT       DEFAULT 0,
    shipping_save_use_amt  BIGINT       DEFAULT 0,
    outbound_shipping_fee  BIGINT       DEFAULT 0,
    pay_amt                BIGINT       DEFAULT 0,
    org_total_amt          BIGINT      ,
    org_total_discount_amt BIGINT      ,
    org_shipping_fee       BIGINT      ,
    org_cache_use_amt      BIGINT      ,
    org_pay_amt            BIGINT      ,
    pay_method_cd          VARCHAR(20) ,
    pay_date               TIMESTAMP   ,
    order_status_cd        VARCHAR(20)  DEFAULT 'PENDING',
    order_status_cd_before VARCHAR(20) ,
    recv_nm                VARCHAR(50) ,
    recv_phone             VARCHAR(20) ,
    recv_zip               VARCHAR(10) ,
    recv_addr              VARCHAR(200),
    recv_addr_detail       VARCHAR(200),
    recv_memo              VARCHAR(200),
    entrance_pwd           VARCHAR(20) ,
    refund_bank_cd         VARCHAR(20) ,
    refund_account_no      VARCHAR(50) ,
    refund_account_nm      VARCHAR(50) ,
    coupon_id              VARCHAR(21) ,
    memo                   TEXT        ,
    dliv_courier_cd        VARCHAR(30) ,
    dliv_tracking_no       VARCHAR(100),
    dliv_status_cd         VARCHAR(20) ,
    dliv_status_cd_before  VARCHAR(20) ,
    dliv_ship_date         TIMESTAMP   ,
    reg_by                 VARCHAR(30) ,
    reg_date               TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by                 VARCHAR(30) ,
    upd_date               TIMESTAMP   ,
    appr_status_cd         VARCHAR(20) ,
    appr_status_cd_before  VARCHAR(20) ,
    appr_amt               BIGINT      ,
    appr_target_cd         VARCHAR(30) ,
    appr_target_nm         VARCHAR(200),
    appr_reason            VARCHAR(500),
    appr_req_user_id       VARCHAR(21) ,
    appr_req_date          TIMESTAMP   ,
    appr_aprv_user_id      VARCHAR(21) ,
    appr_aprv_date         TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.od_order IS '주문';
COMMENT ON COLUMN shopjoy_2604.od_order.order_id IS '주문ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.od_order.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.od_order.member_id IS '회원ID';
COMMENT ON COLUMN shopjoy_2604.od_order.member_nm IS '주문자명';
COMMENT ON COLUMN shopjoy_2604.od_order.orderer_email IS '주문자 이메일 (주문 시점 스냅샷)';
COMMENT ON COLUMN shopjoy_2604.od_order.order_grade_cd IS '주문 시점 회원등급 (코드: MEMBER_GRADE)';
COMMENT ON COLUMN shopjoy_2604.od_order.order_date IS '주문일시';
COMMENT ON COLUMN shopjoy_2604.od_order.access_channel_cd IS '주문유입경로 (코드: ACCESS_CHANNEL — WEB_PC/WEB_MOBILE/APP_IOS/APP_ANDROID)';
COMMENT ON COLUMN shopjoy_2604.od_order.total_amt IS '상품합계금액 (현재값)';
COMMENT ON COLUMN shopjoy_2604.od_order.total_discount_amt IS '총 할인금액 쿠폰+프로모션 합계 (현재값)';
COMMENT ON COLUMN shopjoy_2604.od_order.coupon_discount_amt IS '쿠폰할인금액';
COMMENT ON COLUMN shopjoy_2604.od_order.cache_use_amt IS '적립금사용금액';
COMMENT ON COLUMN shopjoy_2604.od_order.shipping_save_use_amt IS '배송비 적립금 사용금액';
COMMENT ON COLUMN shopjoy_2604.od_order.outbound_shipping_fee IS '출고배송료 (현재값)';
COMMENT ON COLUMN shopjoy_2604.od_order.pay_amt IS '실결제금액 (현재값)';
COMMENT ON COLUMN shopjoy_2604.od_order.org_total_amt IS '원 상품합계금액 (주문 확정 시점 스냅샷)';
COMMENT ON COLUMN shopjoy_2604.od_order.org_total_discount_amt IS '원 총 할인금액 (주문 확정 시점 스냅샷)';
COMMENT ON COLUMN shopjoy_2604.od_order.org_shipping_fee IS '원 배송비 (주문 확정 시점 스냅샷)';
COMMENT ON COLUMN shopjoy_2604.od_order.org_cache_use_amt IS '원 적립금사용금액 (주문 확정 시점 스냅샷)';
COMMENT ON COLUMN shopjoy_2604.od_order.org_pay_amt IS '원 실결제금액 (주문 확정 시점 스냅샷)';
COMMENT ON COLUMN shopjoy_2604.od_order.pay_method_cd IS '결제수단 (코드: PAY_METHOD)';
COMMENT ON COLUMN shopjoy_2604.od_order.pay_date IS '결제일시';
COMMENT ON COLUMN shopjoy_2604.od_order.order_status_cd IS '주문상태 (코드: ORDER_STATUS)';
COMMENT ON COLUMN shopjoy_2604.od_order.order_status_cd_before IS '변경 전 주문상태 (코드: ORDER_STATUS)';
COMMENT ON COLUMN shopjoy_2604.od_order.recv_nm IS '수령자명';
COMMENT ON COLUMN shopjoy_2604.od_order.recv_phone IS '수령자연락처';
COMMENT ON COLUMN shopjoy_2604.od_order.recv_zip IS '수령자우편번호';
COMMENT ON COLUMN shopjoy_2604.od_order.recv_addr IS '수령자주소';
COMMENT ON COLUMN shopjoy_2604.od_order.recv_addr_detail IS '수령자상세주소';
COMMENT ON COLUMN shopjoy_2604.od_order.recv_memo IS '배송메모';
COMMENT ON COLUMN shopjoy_2604.od_order.entrance_pwd IS '공동현관 비밀번호';
COMMENT ON COLUMN shopjoy_2604.od_order.refund_bank_cd IS '환불 은행코드 (코드: BANK_CODE — 무통장/가상계좌 환불 시)';
COMMENT ON COLUMN shopjoy_2604.od_order.refund_account_no IS '환불 계좌번호';
COMMENT ON COLUMN shopjoy_2604.od_order.refund_account_nm IS '환불 예금주명';
COMMENT ON COLUMN shopjoy_2604.od_order.coupon_id IS '사용쿠폰ID';
COMMENT ON COLUMN shopjoy_2604.od_order.memo IS '관리메모';
COMMENT ON COLUMN shopjoy_2604.od_order.dliv_courier_cd IS '최근 출고 택배사 (코드: COURIER)';
COMMENT ON COLUMN shopjoy_2604.od_order.dliv_tracking_no IS '최근 출고 송장번호';
COMMENT ON COLUMN shopjoy_2604.od_order.dliv_status_cd IS '배송상태 최신 (코드: DLIV_STATUS)';
COMMENT ON COLUMN shopjoy_2604.od_order.dliv_status_cd_before IS '변경 전 배송상태 (코드: DLIV_STATUS)';
COMMENT ON COLUMN shopjoy_2604.od_order.dliv_ship_date IS '최근 출고일시';
COMMENT ON COLUMN shopjoy_2604.od_order.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.od_order.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.od_order.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.od_order.upd_date IS '수정일';
COMMENT ON COLUMN shopjoy_2604.od_order.appr_status_cd IS '결재상태 (코드: APPROVAL_STATUS)';
COMMENT ON COLUMN shopjoy_2604.od_order.appr_status_cd_before IS '변경 전 결재상태 (코드: APPROVAL_STATUS)';
COMMENT ON COLUMN shopjoy_2604.od_order.appr_amt IS '결재 요청금액';
COMMENT ON COLUMN shopjoy_2604.od_order.appr_target_cd IS '결재대상 구분 (코드: APPROVAL_TARGET)';
COMMENT ON COLUMN shopjoy_2604.od_order.appr_target_nm IS '결재 대상명';
COMMENT ON COLUMN shopjoy_2604.od_order.appr_reason IS '사유/메모';
COMMENT ON COLUMN shopjoy_2604.od_order.appr_req_user_id IS '결재 요청자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.od_order.appr_req_date IS '결재 요청일시';
COMMENT ON COLUMN shopjoy_2604.od_order.appr_aprv_user_id IS '결재자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.od_order.appr_aprv_date IS '결재일시';

CREATE INDEX idx_od_order_channel ON shopjoy_2604.od_order USING btree (access_channel_cd);
CREATE INDEX idx_od_order_date ON shopjoy_2604.od_order USING btree (order_date);
CREATE INDEX idx_od_order_member ON shopjoy_2604.od_order USING btree (member_id);
CREATE INDEX idx_od_order_status ON shopjoy_2604.od_order USING btree (order_status_cd);
