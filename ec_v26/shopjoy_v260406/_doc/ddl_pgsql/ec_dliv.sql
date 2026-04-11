-- ============================================================
-- ec_dliv : 배송
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
--
-- [설계 포인트]
-- 1건의 주문(ec_order)은 복수 배송으로 분리될 수 있음
--   - 벤더별 분리출고: 나이키 상품 / 자라 상품 각각 다른 운송장
--   - 부분출고: 재고 가용 상품 먼저 발송, 나머지 후발송
-- ec_dliv_item 이 어떤 주문상품(order_item)이 이 배송에 포함되는지 명세
-- ============================================================
CREATE TABLE ec_dliv (
    dliv_id         VARCHAR(16)     NOT NULL,
    order_id        VARCHAR(16)     NOT NULL,
    vendor_id       VARCHAR(16),                            -- 분리출고 시 담당 업체
    member_id       VARCHAR(16),
    member_name     VARCHAR(50),
    recv_name       VARCHAR(50),
    recv_phone      VARCHAR(20),
    recv_zip        VARCHAR(10),
    recv_addr       VARCHAR(200),
    recv_addr_detail VARCHAR(200),
    courier_cd      VARCHAR(30),                            -- 코드: COURIER
    tracking_no     VARCHAR(100),
    status_cd       VARCHAR(20)     DEFAULT 'READY',        -- 코드: DLIV_STATUS
    ship_date       TIMESTAMP,
    dliv_date       TIMESTAMP,
    memo            VARCHAR(300),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_date        TIMESTAMP,
    PRIMARY KEY (dliv_id)
);

COMMENT ON TABLE  ec_dliv                   IS '배송 (1주문 N배송 가능 — 벤더 분리출고/부분출고)';
COMMENT ON COLUMN ec_dliv.dliv_id           IS '배송ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_dliv.order_id          IS '주문ID (ec_order.order_id)';
COMMENT ON COLUMN ec_dliv.vendor_id         IS '출고 업체ID (벤더별 분리출고 시)';
COMMENT ON COLUMN ec_dliv.member_id         IS '회원ID';
COMMENT ON COLUMN ec_dliv.member_name       IS '주문자명';
COMMENT ON COLUMN ec_dliv.recv_name         IS '수령자명';
COMMENT ON COLUMN ec_dliv.recv_phone        IS '수령자연락처';
COMMENT ON COLUMN ec_dliv.recv_zip          IS '우편번호';
COMMENT ON COLUMN ec_dliv.recv_addr         IS '주소';
COMMENT ON COLUMN ec_dliv.recv_addr_detail  IS '상세주소';
COMMENT ON COLUMN ec_dliv.courier_cd        IS '택배사 (코드: COURIER)';
COMMENT ON COLUMN ec_dliv.tracking_no       IS '운송장번호';
COMMENT ON COLUMN ec_dliv.status_cd         IS '배송상태 (코드: DLIV_STATUS)';
COMMENT ON COLUMN ec_dliv.ship_date         IS '출고일시';
COMMENT ON COLUMN ec_dliv.dliv_date         IS '배송완료일시';
COMMENT ON COLUMN ec_dliv.memo              IS '메모';
COMMENT ON COLUMN ec_dliv.reg_date          IS '등록일';
COMMENT ON COLUMN ec_dliv.upd_date          IS '수정일';

-- 배송 항목 (이 배송에 포함된 주문상품 명세)
-- 1 ec_dliv → N ec_dliv_item → 1 ec_order_item (1:1 참조)
-- 부분출고 시 qty < order_item.qty 가능
CREATE TABLE ec_dliv_item (
    dliv_item_id    VARCHAR(16)     NOT NULL,
    dliv_id         VARCHAR(16)     NOT NULL,
    order_item_id   VARCHAR(16)     NOT NULL,               -- 원 주문상품ID
    prod_id         VARCHAR(16),
    prod_name       VARCHAR(200),                           -- 상품명 (주문시점 스냅샷)
    prod_option     VARCHAR(200),                           -- 옵션 (색상/사이즈 스냅샷)
    unit_price      BIGINT          DEFAULT 0,
    dliv_qty        INTEGER         DEFAULT 1,              -- 이 배송의 출고수량 (부분출고 시 < 주문수량)
    status_cd       VARCHAR(20)     DEFAULT 'READY',        -- 코드: DLIV_STATUS (항목별 추적)
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (dliv_item_id),
    UNIQUE (dliv_id, order_item_id)                        -- 동일 배송 내 중복 방지
);

COMMENT ON TABLE  ec_dliv_item               IS '배송 항목 (배송에 포함된 주문상품 명세)';
COMMENT ON COLUMN ec_dliv_item.dliv_item_id  IS '배송항목ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_dliv_item.dliv_id       IS '배송ID (ec_dliv.dliv_id)';
COMMENT ON COLUMN ec_dliv_item.order_item_id IS '주문상품ID (ec_order_item.order_item_id)';
COMMENT ON COLUMN ec_dliv_item.prod_id       IS '상품ID';
COMMENT ON COLUMN ec_dliv_item.prod_name     IS '상품명 (주문시점 스냅샷)';
COMMENT ON COLUMN ec_dliv_item.prod_option   IS '옵션 (주문시점 스냅샷)';
COMMENT ON COLUMN ec_dliv_item.unit_price    IS '단가 (주문시점 스냅샷)';
COMMENT ON COLUMN ec_dliv_item.dliv_qty      IS '출고수량 (부분출고 시 주문수량보다 적을 수 있음)';
COMMENT ON COLUMN ec_dliv_item.status_cd     IS '항목 배송상태 (코드: DLIV_STATUS)';
COMMENT ON COLUMN ec_dliv_item.reg_date      IS '등록일';

-- 배송 상태 이력
CREATE TABLE ec_dliv_hist (
    dliv_hist_id    VARCHAR(16)     NOT NULL,
    dliv_id         VARCHAR(16)     NOT NULL,
    before_status   VARCHAR(20),
    after_status    VARCHAR(20),
    memo            VARCHAR(300),
    proc_by         VARCHAR(16),
    proc_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (dliv_hist_id)
);

COMMENT ON TABLE  ec_dliv_hist               IS '배송 상태 이력';
COMMENT ON COLUMN ec_dliv_hist.dliv_hist_id  IS '이력ID';
COMMENT ON COLUMN ec_dliv_hist.dliv_id       IS '배송ID';
COMMENT ON COLUMN ec_dliv_hist.before_status IS '이전상태';
COMMENT ON COLUMN ec_dliv_hist.after_status  IS '변경상태';
COMMENT ON COLUMN ec_dliv_hist.memo          IS '처리메모';
COMMENT ON COLUMN ec_dliv_hist.proc_by       IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN ec_dliv_hist.proc_date     IS '처리일시';
