-- ============================================================
-- od_order_discnt : 주문 할인·차감 내역
-- 주문(order) 단위 쿠폰할인 / 적립금차감 / 캐쉬차감을 행별로 기록
-- 환불 시 주문쿠폰 안분 계산 및 복원 기준 데이터
-- ============================================================
CREATE TABLE od_order_discnt (
    order_discnt_id     VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    order_id            VARCHAR(21)     NOT NULL,               -- od_order.order_id
    -- ── 할인/차감 구분 ──
    discnt_type_cd      VARCHAR(30)     NOT NULL,               -- 코드: ORDER_DISCNT_TYPE
                                                                --   ORDER_COUPON : 주문쿠폰 할인
                                                                --   SAVE_USE     : 적립금 차감
                                                                --   CACHE_USE    : 캐쉬(충전금) 차감
                                                                --   SHIP_DISCNT  : 배송비 할인
                                                                --   PROMO_DISCNT : 프로모션 할인 (기타)
    -- ── 쿠폰 연결 (ORDER_COUPON인 경우) ──
    coupon_id           VARCHAR(21),                            -- pm_coupon.coupon_id
    coupon_issue_id     VARCHAR(21),                            -- pm_coupon_issue.coupon_issue_id
    -- ── 금액 ──
    discnt_rate         DECIMAL(5,2),                           -- 할인율 (%) — 비율할인인 경우
    discnt_amt          BIGINT          DEFAULT 0,              -- 할인·차감 금액
    -- ── 안분 기준 (주문쿠폰 안분 시 참조) ──
    base_item_amt       BIGINT          DEFAULT 0,              -- 안분 기준 상품금액 합계 (쿠폰 적용 대상 items 합계)
    -- ── 상태 (적립금/캐쉬 차감분 복원 추적) ──
    restore_yn          CHAR(1)         DEFAULT 'N',            -- 복원 여부 (환불 시 적립금/캐쉬 복원 완료)
    restore_amt         BIGINT          DEFAULT 0,              -- 복원된 금액 (부분복원 지원)
    restore_date        TIMESTAMP,                              -- 복원 처리일시
    -- ── 기본 ──
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (order_discnt_id)
);

COMMENT ON TABLE od_order_discnt IS '주문할인·차감 내역 (주문쿠폰·적립금·캐쉬)';
COMMENT ON COLUMN od_order_discnt.order_discnt_id  IS '주문할인ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN od_order_discnt.site_id          IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN od_order_discnt.order_id         IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN od_order_discnt.discnt_type_cd   IS '할인유형코드 (코드: ORDER_DISCNT_TYPE — ORDER_COUPON/SAVE_USE/CACHE_USE/SHIP_DISCNT/PROMO_DISCNT)';
COMMENT ON COLUMN od_order_discnt.coupon_id        IS '쿠폰ID (pm_coupon.coupon_id — ORDER_COUPON인 경우)';
COMMENT ON COLUMN od_order_discnt.coupon_issue_id  IS '쿠폰발급ID (pm_coupon_issue.coupon_issue_id — ORDER_COUPON인 경우)';
COMMENT ON COLUMN od_order_discnt.discnt_rate      IS '할인율 (% — 비율할인인 경우)';
COMMENT ON COLUMN od_order_discnt.discnt_amt       IS '할인·차감 금액';
COMMENT ON COLUMN od_order_discnt.base_item_amt    IS '안분 기준 상품금액 (주문쿠폰 안분 계산용 — 쿠폰 적용 대상 items 합계)';
COMMENT ON COLUMN od_order_discnt.restore_yn       IS '복원여부 Y/N (환불 시 적립금·캐쉬 차감 복원 완료 여부)';
COMMENT ON COLUMN od_order_discnt.restore_amt      IS '복원된 금액 (부분반품 시 부분복원 지원)';
COMMENT ON COLUMN od_order_discnt.restore_date     IS '복원 처리일시';
COMMENT ON COLUMN od_order_discnt.reg_by           IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_order_discnt.reg_date         IS '등록일시';
COMMENT ON COLUMN od_order_discnt.upd_by   IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN od_order_discnt.upd_date IS '수정일';

CREATE INDEX idx_od_order_discnt_order     ON od_order_discnt (order_id);
CREATE INDEX idx_od_order_discnt_type      ON od_order_discnt (discnt_type_cd);
CREATE INDEX idx_od_order_discnt_coupon    ON od_order_discnt (coupon_id) WHERE coupon_id IS NOT NULL;
CREATE INDEX idx_od_order_discnt_restore   ON od_order_discnt (restore_yn);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] od_order_discnt.discnt_type_cd (할인유형코드) : ORDER_DISCNT_TYPE { SALE_PRICE:판매가할인, PAY_DISCNT:결제할인, COUPON:쿠폰, PROMOTION:프로모션, SHIP_DISCNT:배송비할인, PRODUCT_DISCNT:상품할인, CLAIM_SHIP:클레임배송비 }
