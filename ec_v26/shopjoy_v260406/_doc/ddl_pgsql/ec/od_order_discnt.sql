-- od_order_discnt 테이블 DDL
-- 주문할인·차감 내역 (주문쿠폰·적립금·캐쉬)

CREATE TABLE shopjoy_2604.od_order_discnt (
    order_discnt_id VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id         VARCHAR(21) ,
    order_id        VARCHAR(21)  NOT NULL,
    discnt_type_cd  VARCHAR(30)  NOT NULL,
    coupon_id       VARCHAR(21) ,
    coupon_issue_id VARCHAR(21) ,
    discnt_rate     NUMERIC(5,2),
    discnt_amt      BIGINT       DEFAULT 0,
    base_item_amt   BIGINT       DEFAULT 0,
    restore_yn      VARCHAR(1)   DEFAULT 'N',
    restore_amt     BIGINT       DEFAULT 0,
    restore_date    TIMESTAMP   ,
    reg_by          VARCHAR(30) ,
    reg_date        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30) ,
    upd_date        TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.od_order_discnt IS '주문할인·차감 내역 (주문쿠폰·적립금·캐쉬)';
COMMENT ON COLUMN shopjoy_2604.od_order_discnt.order_discnt_id IS '주문할인ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.od_order_discnt.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.od_order_discnt.order_id IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN shopjoy_2604.od_order_discnt.discnt_type_cd IS '할인유형코드 (코드: ORDER_DISCNT_TYPE — ORDER_COUPON/SAVE_USE/CACHE_USE/SHIP_DISCNT/PROMO_DISCNT)';
COMMENT ON COLUMN shopjoy_2604.od_order_discnt.coupon_id IS '쿠폰ID (pm_coupon.coupon_id — ORDER_COUPON인 경우)';
COMMENT ON COLUMN shopjoy_2604.od_order_discnt.coupon_issue_id IS '쿠폰발급ID (pm_coupon_issue.coupon_issue_id — ORDER_COUPON인 경우)';
COMMENT ON COLUMN shopjoy_2604.od_order_discnt.discnt_rate IS '할인율 (% — 비율할인인 경우)';
COMMENT ON COLUMN shopjoy_2604.od_order_discnt.discnt_amt IS '할인·차감 금액';
COMMENT ON COLUMN shopjoy_2604.od_order_discnt.base_item_amt IS '안분 기준 상품금액 (주문쿠폰 안분 계산용 — 쿠폰 적용 대상 items 합계)';
COMMENT ON COLUMN shopjoy_2604.od_order_discnt.restore_yn IS '복원여부 Y/N (환불 시 적립금·캐쉬 차감 복원 완료 여부)';
COMMENT ON COLUMN shopjoy_2604.od_order_discnt.restore_amt IS '복원된 금액 (부분반품 시 부분복원 지원)';
COMMENT ON COLUMN shopjoy_2604.od_order_discnt.restore_date IS '복원 처리일시';
COMMENT ON COLUMN shopjoy_2604.od_order_discnt.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.od_order_discnt.reg_date IS '등록일시';

CREATE INDEX idx_od_order_discnt_coupon ON shopjoy_2604.od_order_discnt USING btree (coupon_id) WHERE (coupon_id IS NOT NULL);
CREATE INDEX idx_od_order_discnt_order ON shopjoy_2604.od_order_discnt USING btree (order_id);
CREATE INDEX idx_od_order_discnt_restore ON shopjoy_2604.od_order_discnt USING btree (restore_yn);
CREATE INDEX idx_od_order_discnt_type ON shopjoy_2604.od_order_discnt USING btree (discnt_type_cd);
