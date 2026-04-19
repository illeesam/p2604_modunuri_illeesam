-- 주문상품 상태 이력
CREATE TABLE od_order_item_status_hist (
    order_item_status_hist_id    VARCHAR(16)     NOT NULL,
    site_id                      VARCHAR(16),                        -- sy_site.site_id
    order_item_id                VARCHAR(16)     NOT NULL,           -- od_order_item.order_item_id
    order_id                     VARCHAR(16),                        -- od_order.order_id (조회 편의)
    order_item_status_cd_before  VARCHAR(20),                        -- 변경 전 주문상품상태 (코드: ORDER_ITEM_STATUS)
    order_item_status_cd         VARCHAR(20),                        -- 변경 후 주문상품상태 (코드: ORDER_ITEM_STATUS)
    status_reason                VARCHAR(300),                       -- 상태 변경 사유
    chg_user_id                  VARCHAR(16),                        -- 변경 담당자 (sy_user.user_id, mb_mem.member_id)
    chg_date                     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    memo                         VARCHAR(300),
    reg_by                       VARCHAR(16),
    reg_date                     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                       VARCHAR(16),
    upd_date                     TIMESTAMP,
    PRIMARY KEY (order_item_status_hist_id),
    CONSTRAINT fk_od_order_item_status_hist_item FOREIGN KEY (order_item_id) REFERENCES od_order_item (order_item_id)
);

COMMENT ON TABLE od_order_item_status_hist IS '주문상품 상태 이력';
COMMENT ON COLUMN od_order_item_status_hist.order_item_status_hist_id   IS '주문상품상태이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN od_order_item_status_hist.site_id                     IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN od_order_item_status_hist.order_item_id               IS '주문상품ID (od_order_item.order_item_id)';
COMMENT ON COLUMN od_order_item_status_hist.order_id                    IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN od_order_item_status_hist.order_item_status_cd_before IS '변경 전 주문상품상태 (코드: ORDER_ITEM_STATUS)';
COMMENT ON COLUMN od_order_item_status_hist.order_item_status_cd        IS '변경 후 주문상품상태 (코드: ORDER_ITEM_STATUS)';
COMMENT ON COLUMN od_order_item_status_hist.status_reason               IS '상태 변경 사유';
COMMENT ON COLUMN od_order_item_status_hist.chg_user_id                 IS '변경 담당자 (sy_user.user_id, mb_mem.member_id)';
COMMENT ON COLUMN od_order_item_status_hist.chg_date                    IS '변경 일시';
COMMENT ON COLUMN od_order_item_status_hist.memo                        IS '메모';
COMMENT ON COLUMN od_order_item_status_hist.reg_by                      IS '등록자 (sy_user.user_id, mb_mem.member_id)';
COMMENT ON COLUMN od_order_item_status_hist.reg_date                    IS '등록일';
COMMENT ON COLUMN od_order_item_status_hist.upd_by                      IS '수정자 (sy_user.user_id, mb_mem.member_id)';
COMMENT ON COLUMN od_order_item_status_hist.upd_date                    IS '수정일';

CREATE INDEX idx_od_oi_status_hist_item  ON od_order_item_status_hist (order_item_id);
CREATE INDEX idx_od_oi_status_hist_order ON od_order_item_status_hist (order_id);
CREATE INDEX idx_od_oi_status_hist_date  ON od_order_item_status_hist (chg_date);
