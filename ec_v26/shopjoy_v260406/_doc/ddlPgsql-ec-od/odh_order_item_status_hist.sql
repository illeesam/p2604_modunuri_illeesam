-- 주문상품 상태 이력
CREATE TABLE odh_order_item_status_hist (
    order_item_status_hist_id    VARCHAR(21)     NOT NULL,
    site_id                      VARCHAR(21),                        -- sy_site.site_id
    order_item_id                VARCHAR(21)     NOT NULL,           -- od_order_item.order_item_id
    order_id                     VARCHAR(21),                        -- od_order.order_id (조회 편의)
    order_item_status_cd_before  VARCHAR(20),                        -- 변경 전 주문상품상태 (코드: ORDER_ITEM_STATUS)
    order_item_status_cd         VARCHAR(20),                        -- 변경 후 주문상품상태 (코드: ORDER_ITEM_STATUS)
    status_reason                VARCHAR(300),                       -- 상태 변경 사유
    chg_user_id                  VARCHAR(21),                        -- 변경 담당자 (sy_user.user_id, mb_member.member_id)
    chg_date                     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    memo                         VARCHAR(300),
    reg_by                       VARCHAR(30),
    reg_date                     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                       VARCHAR(30),
    upd_date                     TIMESTAMP,
    PRIMARY KEY (order_item_status_hist_id),
    CONSTRAINT fk_odh_order_item_status_hist_item FOREIGN KEY (order_item_id) REFERENCES od_order_item (order_item_id)
);

COMMENT ON TABLE odh_order_item_status_hist IS '주문상품 상태 이력';
COMMENT ON COLUMN odh_order_item_status_hist.order_item_status_hist_id   IS '주문상품상태이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN odh_order_item_status_hist.site_id                     IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN odh_order_item_status_hist.order_item_id               IS '주문상품ID (od_order_item.order_item_id)';
COMMENT ON COLUMN odh_order_item_status_hist.order_id                    IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN odh_order_item_status_hist.order_item_status_cd_before IS '변경 전 주문상품상태 (코드: ORDER_ITEM_STATUS)';
COMMENT ON COLUMN odh_order_item_status_hist.order_item_status_cd        IS '변경 후 주문상품상태 (코드: ORDER_ITEM_STATUS)';
COMMENT ON COLUMN odh_order_item_status_hist.status_reason               IS '상태 변경 사유';
COMMENT ON COLUMN odh_order_item_status_hist.chg_user_id                 IS '변경 담당자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_order_item_status_hist.chg_date                    IS '변경 일시';
COMMENT ON COLUMN odh_order_item_status_hist.memo                        IS '메모';
COMMENT ON COLUMN odh_order_item_status_hist.reg_by                      IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_order_item_status_hist.reg_date                    IS '등록일';
COMMENT ON COLUMN odh_order_item_status_hist.upd_by                      IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN odh_order_item_status_hist.upd_date                    IS '수정일';

CREATE INDEX idx_od_oi_status_hist_item  ON odh_order_item_status_hist (order_item_id);
CREATE INDEX idx_od_oi_status_hist_order ON odh_order_item_status_hist (order_id);
CREATE INDEX idx_od_oi_status_hist_date  ON odh_order_item_status_hist (chg_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] odh_order_item_status_hist.order_item_status_cd (변경 후 주문상품상태) : 주문항목상태 { ORDERED:주문완료, PAID:결제완료, PREPARING:준비중, SHIPPING:배송중, DELIVERED:배송완료, CONFIRMED:구매확정, CANCELLED:취소 }
