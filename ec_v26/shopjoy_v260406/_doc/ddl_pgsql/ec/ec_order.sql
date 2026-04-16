-- ============================================================
CREATE TABLE ec_order (
    order_id        VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    member_id       VARCHAR(16)     NOT NULL,
    member_nm       VARCHAR(50),
    order_date      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    total_price     BIGINT          DEFAULT 0,
    discount_amt    BIGINT          DEFAULT 0,
    coupon_discount BIGINT          DEFAULT 0,
    cache_use       BIGINT          DEFAULT 0,
    pay_price       BIGINT          DEFAULT 0,              -- 실결제금액
    pay_method_cd   VARCHAR(20),                            -- 코드: PAY_METHOD
    pay_date        TIMESTAMP,
    status_cd       VARCHAR(20)     DEFAULT 'PENDING',      -- 코드: ORDER_STATUS
    recv_nm         VARCHAR(50),
    recv_phone      VARCHAR(20),
    recv_zip        VARCHAR(10),
    recv_addr       VARCHAR(200),
    recv_addr_detail VARCHAR(200),
    recv_memo       VARCHAR(200),
    coupon_id       VARCHAR(16),
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

    PRIMARY KEY (order_id)
);

COMMENT ON TABLE  ec_order                  IS '주문';
COMMENT ON COLUMN ec_order.order_id         IS '주문ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_order.site_id          IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_order.member_id        IS '회원ID';
COMMENT ON COLUMN ec_order.member_nm        IS '주문자명';
COMMENT ON COLUMN ec_order.order_date       IS '주문일시';
COMMENT ON COLUMN ec_order.total_price      IS '상품합계';
COMMENT ON COLUMN ec_order.discount_amt     IS '할인금액';
COMMENT ON COLUMN ec_order.coupon_discount  IS '쿠폰할인';
COMMENT ON COLUMN ec_order.cache_use        IS '적립금사용';
COMMENT ON COLUMN ec_order.pay_price        IS '실결제금액';
COMMENT ON COLUMN ec_order.pay_method_cd    IS '결제수단 (코드: PAY_METHOD)';
COMMENT ON COLUMN ec_order.pay_date         IS '결제일시';
COMMENT ON COLUMN ec_order.status_cd        IS '주문상태 (코드: ORDER_STATUS)';
COMMENT ON COLUMN ec_order.recv_nm          IS '수령자명';
COMMENT ON COLUMN ec_order.recv_phone       IS '수령자연락처';
COMMENT ON COLUMN ec_order.recv_zip         IS '수령자우편번호';
COMMENT ON COLUMN ec_order.recv_addr        IS '수령자주소';
COMMENT ON COLUMN ec_order.recv_addr_detail IS '수령자상세주소';
COMMENT ON COLUMN ec_order.recv_memo        IS '배송메모';
COMMENT ON COLUMN ec_order.coupon_id        IS '사용쿠폰ID';
COMMENT ON COLUMN ec_order.memo             IS '관리메모';
COMMENT ON COLUMN ec_order.reg_by           IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN ec_order.reg_date         IS '등록일';
COMMENT ON COLUMN ec_order.upd_by           IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN ec_order.upd_date         IS '수정일';

COMMENT ON COLUMN ec_order.approval_status_cd IS '결재상태 (코드: APPROVAL_STATUS)';
COMMENT ON COLUMN ec_order.approval_amt       IS '결재 요청금액';
COMMENT ON COLUMN ec_order.approval_target_cd IS '결재대상 구분 (코드: APPROVAL_TARGET)';
COMMENT ON COLUMN ec_order.approval_target_nm IS '결재 대상명';
COMMENT ON COLUMN ec_order.approval_reason    IS '사유/메모';
COMMENT ON COLUMN ec_order.approval_req_user_id    IS '결재 요청자 (sy_user.user_id)';
COMMENT ON COLUMN ec_order.approval_req_date  IS '결재 요청일시';
COMMENT ON COLUMN ec_order.approval_aprv_user_id   IS '결재자 (sy_user.user_id)';
COMMENT ON COLUMN ec_order.approval_aprv_date IS '결재일시';
