-- ============================================================
-- ec_order : 주문 / ec_order_item : 주문상품
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE ec_order (
    order_id        VARCHAR(16)     NOT NULL,
    member_id       VARCHAR(16)     NOT NULL,
    member_name     VARCHAR(50),
    order_date      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    total_price     BIGINT          DEFAULT 0,
    discount_amt    BIGINT          DEFAULT 0,
    coupon_discount BIGINT          DEFAULT 0,
    cache_use       BIGINT          DEFAULT 0,
    pay_price       BIGINT          DEFAULT 0,              -- 실결제금액
    pay_method_cd   VARCHAR(20),                            -- 코드: PAY_METHOD
    pay_date        TIMESTAMP,
    status_cd       VARCHAR(20)     DEFAULT 'PENDING',      -- 코드: ORDER_STATUS
    recv_name       VARCHAR(50),
    recv_phone      VARCHAR(20),
    recv_zip        VARCHAR(10),
    recv_addr       VARCHAR(200),
    recv_addr_detail VARCHAR(200),
    recv_memo       VARCHAR(200),
    coupon_id       VARCHAR(16),
    memo            TEXT,
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_date        TIMESTAMP,
    PRIMARY KEY (order_id)
);

COMMENT ON TABLE  ec_order                  IS '주문';
COMMENT ON COLUMN ec_order.order_id         IS '주문ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_order.member_id        IS '회원ID';
COMMENT ON COLUMN ec_order.member_name      IS '주문자명';
COMMENT ON COLUMN ec_order.order_date       IS '주문일시';
COMMENT ON COLUMN ec_order.total_price      IS '상품합계';
COMMENT ON COLUMN ec_order.discount_amt     IS '할인금액';
COMMENT ON COLUMN ec_order.coupon_discount  IS '쿠폰할인';
COMMENT ON COLUMN ec_order.cache_use        IS '적립금사용';
COMMENT ON COLUMN ec_order.pay_price        IS '실결제금액';
COMMENT ON COLUMN ec_order.pay_method_cd    IS '결제수단 (코드: PAY_METHOD)';
COMMENT ON COLUMN ec_order.pay_date         IS '결제일시';
COMMENT ON COLUMN ec_order.status_cd        IS '주문상태 (코드: ORDER_STATUS)';
COMMENT ON COLUMN ec_order.recv_name        IS '수령자명';
COMMENT ON COLUMN ec_order.recv_phone       IS '수령자연락처';
COMMENT ON COLUMN ec_order.recv_zip         IS '수령자우편번호';
COMMENT ON COLUMN ec_order.recv_addr        IS '수령자주소';
COMMENT ON COLUMN ec_order.recv_addr_detail IS '수령자상세주소';
COMMENT ON COLUMN ec_order.recv_memo        IS '배송메모';
COMMENT ON COLUMN ec_order.coupon_id        IS '사용쿠폰ID';
COMMENT ON COLUMN ec_order.memo             IS '관리메모';
COMMENT ON COLUMN ec_order.reg_date         IS '등록일';
COMMENT ON COLUMN ec_order.upd_date         IS '수정일';

-- 주문 상품
CREATE TABLE ec_order_item (
    order_item_id   VARCHAR(16)     NOT NULL,
    order_id        VARCHAR(16)     NOT NULL,
    prod_id         VARCHAR(16)     NOT NULL,
    prod_name       VARCHAR(200),
    prod_option     VARCHAR(200),
    unit_price      BIGINT          DEFAULT 0,
    qty             INTEGER         DEFAULT 1,
    item_price      BIGINT          DEFAULT 0,
    status_cd       VARCHAR(20)     DEFAULT 'NORMAL',       -- 코드: ORDER_STATUS
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (order_item_id)
);

COMMENT ON TABLE  ec_order_item               IS '주문상품';
COMMENT ON COLUMN ec_order_item.order_item_id IS '주문상품ID';
COMMENT ON COLUMN ec_order_item.order_id      IS '주문ID';
COMMENT ON COLUMN ec_order_item.prod_id       IS '상품ID';
COMMENT ON COLUMN ec_order_item.prod_name     IS '상품명 (주문시점 스냅샷)';
COMMENT ON COLUMN ec_order_item.prod_option   IS '옵션 (주문시점 스냅샷)';
COMMENT ON COLUMN ec_order_item.unit_price    IS '단가';
COMMENT ON COLUMN ec_order_item.qty           IS '수량';
COMMENT ON COLUMN ec_order_item.item_price    IS '소계';
COMMENT ON COLUMN ec_order_item.status_cd     IS '품목상태 (코드: ORDER_STATUS)';

-- 주문 상태 이력
CREATE TABLE ec_order_hist (
    order_hist_id   VARCHAR(16)     NOT NULL,
    order_id        VARCHAR(16)     NOT NULL,
    before_status   VARCHAR(20),
    after_status    VARCHAR(20),
    memo            VARCHAR(300),
    proc_by         VARCHAR(16),
    proc_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (order_hist_id)
);

COMMENT ON TABLE  ec_order_hist               IS '주문 상태 이력';
COMMENT ON COLUMN ec_order_hist.order_hist_id IS '이력ID';
COMMENT ON COLUMN ec_order_hist.order_id      IS '주문ID';
COMMENT ON COLUMN ec_order_hist.before_status IS '이전상태';
COMMENT ON COLUMN ec_order_hist.after_status  IS '변경상태';
COMMENT ON COLUMN ec_order_hist.memo          IS '처리메모';
COMMENT ON COLUMN ec_order_hist.proc_by       IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN ec_order_hist.proc_date     IS '처리일시';
