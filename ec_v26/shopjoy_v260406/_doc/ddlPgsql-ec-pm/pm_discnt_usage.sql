-- ============================================================
-- pm_discnt_usage : 할인 적용 이력
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- 주문 시 적용된 할인정책을 건별로 기록
-- ============================================================
CREATE TABLE pm_discnt_usage (
    discnt_usage_id     VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    discnt_id           VARCHAR(21)     NOT NULL,               -- pm_discnt.discnt_id
    discnt_nm           VARCHAR(100),                           -- 할인명 스냅샷
    member_id           VARCHAR(21),                            -- mb_member.member_id
    order_id            VARCHAR(21),                            -- od_order.order_id
    order_item_id       VARCHAR(21),                            -- od_order_item.order_item_id (상품별 할인 적용 시)
    prod_id             VARCHAR(21),                            -- pd_prod.prod_id (할인 적용 상품)
    discnt_type_cd      VARCHAR(20),                            -- 할인유형 스냅샷 (RATE/FIXED/FREE_SHIP)
    discnt_value        NUMERIC(10,2)   DEFAULT 0,              -- 할인값 스냅샷 (율 또는 금액)
    discnt_amt          BIGINT          DEFAULT 0,              -- 실할인금액
    used_date           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,

    PRIMARY KEY (discnt_usage_id)
);

COMMENT ON TABLE  pm_discnt_usage IS '할인 적용 이력 (주문 시 적용된 할인정책 건별 기록)';
COMMENT ON COLUMN pm_discnt_usage.discnt_usage_id  IS '할인사용ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pm_discnt_usage.site_id          IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pm_discnt_usage.discnt_id        IS '할인ID (pm_discnt.discnt_id)';
COMMENT ON COLUMN pm_discnt_usage.discnt_nm        IS '할인명 스냅샷';
COMMENT ON COLUMN pm_discnt_usage.member_id        IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN pm_discnt_usage.order_id         IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN pm_discnt_usage.order_item_id    IS '주문상품ID (od_order_item.order_item_id, 상품별 할인 적용 시)';
COMMENT ON COLUMN pm_discnt_usage.prod_id          IS '상품ID (pd_prod.prod_id, 할인 적용 상품)';
COMMENT ON COLUMN pm_discnt_usage.discnt_type_cd   IS '할인유형 스냅샷 (RATE=정률 / FIXED=정액 / FREE_SHIP=무료배송)';
COMMENT ON COLUMN pm_discnt_usage.discnt_value     IS '할인값 스냅샷 (정률이면 % / 정액이면 원)';
COMMENT ON COLUMN pm_discnt_usage.discnt_amt       IS '실할인금액';
COMMENT ON COLUMN pm_discnt_usage.used_date        IS '적용일시';
COMMENT ON COLUMN pm_discnt_usage.reg_by           IS '등록자';
COMMENT ON COLUMN pm_discnt_usage.reg_date         IS '등록일';
COMMENT ON COLUMN pm_discnt_usage.upd_by   IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pm_discnt_usage.upd_date IS '수정일';

CREATE INDEX idx_pm_discnt_usage_discnt ON pm_discnt_usage (discnt_id);
CREATE INDEX idx_pm_discnt_usage_member ON pm_discnt_usage (member_id);
CREATE INDEX idx_pm_discnt_usage_order  ON pm_discnt_usage (order_id);
CREATE INDEX idx_pm_discnt_usage_item   ON pm_discnt_usage (order_item_id);
CREATE INDEX idx_pm_discnt_usage_prod   ON pm_discnt_usage (prod_id);
