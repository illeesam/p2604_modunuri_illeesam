-- ============================================================
-- pm_save_usage : 적립금 사용 이력
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- 주문 시 사용된 적립금을 건별로 기록
-- 사용 후 pm_save 원장에 USE 타입으로 반영
-- ============================================================
CREATE TABLE pm_save_usage (
    save_usage_id       VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    member_id           VARCHAR(21)     NOT NULL,               -- mb_member.member_id
    order_id            VARCHAR(21),                            -- od_order.order_id
    order_item_id       VARCHAR(21),                            -- od_order_item.order_item_id (상품별 사용 시)
    prod_id             VARCHAR(21),                            -- pd_prod.prod_id (사용 상품)
    use_amt             BIGINT          NOT NULL,               -- 사용 적립금액
    balance_amt         BIGINT          DEFAULT 0,              -- 사용 후 잔액
    used_date           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,

    PRIMARY KEY (save_usage_id)
);

COMMENT ON TABLE  pm_save_usage IS '적립금 사용 이력 (주문 시 사용된 적립금 건별 기록)';
COMMENT ON COLUMN pm_save_usage.save_usage_id  IS '적립사용ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pm_save_usage.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pm_save_usage.member_id      IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN pm_save_usage.order_id       IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN pm_save_usage.order_item_id  IS '주문상품ID (od_order_item.order_item_id, 상품별 사용 시)';
COMMENT ON COLUMN pm_save_usage.prod_id        IS '상품ID (pd_prod.prod_id, 사용 상품)';
COMMENT ON COLUMN pm_save_usage.use_amt        IS '사용 적립금액';
COMMENT ON COLUMN pm_save_usage.balance_amt    IS '사용 후 잔액';
COMMENT ON COLUMN pm_save_usage.used_date      IS '사용일시';
COMMENT ON COLUMN pm_save_usage.reg_by         IS '등록자';
COMMENT ON COLUMN pm_save_usage.reg_date       IS '등록일';
COMMENT ON COLUMN pm_save_usage.upd_by   IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pm_save_usage.upd_date IS '수정일';

CREATE INDEX idx_pm_save_usage_member ON pm_save_usage (member_id);
CREATE INDEX idx_pm_save_usage_order  ON pm_save_usage (order_id);
CREATE INDEX idx_pm_save_usage_item   ON pm_save_usage (order_item_id);
CREATE INDEX idx_pm_save_usage_prod   ON pm_save_usage (prod_id);
