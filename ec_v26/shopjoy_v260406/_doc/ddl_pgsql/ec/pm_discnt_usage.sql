-- pm_discnt_usage 테이블 DDL
-- 할인 적용 이력 (주문 시 적용된 할인정책 건별 기록)

CREATE TABLE shopjoy_2604.pm_discnt_usage (
    discnt_usage_id VARCHAR(21)   NOT NULL PRIMARY KEY,
    site_id         VARCHAR(21)  ,
    discnt_id       VARCHAR(21)   NOT NULL,
    discnt_nm       VARCHAR(100) ,
    member_id       VARCHAR(21)  ,
    order_id        VARCHAR(21)  ,
    order_item_id   VARCHAR(21)  ,
    prod_id         VARCHAR(21)  ,
    discnt_type_cd  VARCHAR(20)  ,
    discnt_value    NUMERIC(10,2) DEFAULT 0,
    discnt_amt      BIGINT        DEFAULT 0,
    used_date       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    reg_by          VARCHAR(30)  ,
    reg_date        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30)  ,
    upd_date        TIMESTAMP    
);

COMMENT ON TABLE  shopjoy_2604.pm_discnt_usage IS '할인 적용 이력 (주문 시 적용된 할인정책 건별 기록)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_usage.discnt_usage_id IS '할인사용ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_usage.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_usage.discnt_id IS '할인ID (pm_discnt.discnt_id)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_usage.discnt_nm IS '할인명 스냅샷';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_usage.member_id IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_usage.order_id IS '주문ID (od_order.order_id)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_usage.order_item_id IS '주문상품ID (od_order_item.order_item_id, 상품별 할인 적용 시)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_usage.prod_id IS '상품ID (pd_prod.prod_id, 할인 적용 상품)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_usage.discnt_type_cd IS '할인유형 스냅샷 (RATE=정률 / FIXED=정액 / FREE_SHIP=무료배송)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_usage.discnt_value IS '할인값 스냅샷 (정률이면 % / 정액이면 원)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_usage.discnt_amt IS '실할인금액';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_usage.used_date IS '적용일시';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_usage.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_usage.reg_date IS '등록일';

CREATE INDEX idx_pm_discnt_usage_discnt ON shopjoy_2604.pm_discnt_usage USING btree (discnt_id);
CREATE INDEX idx_pm_discnt_usage_item ON shopjoy_2604.pm_discnt_usage USING btree (order_item_id);
CREATE INDEX idx_pm_discnt_usage_member ON shopjoy_2604.pm_discnt_usage USING btree (member_id);
CREATE INDEX idx_pm_discnt_usage_order ON shopjoy_2604.pm_discnt_usage USING btree (order_id);
CREATE INDEX idx_pm_discnt_usage_prod ON shopjoy_2604.pm_discnt_usage USING btree (prod_id);
