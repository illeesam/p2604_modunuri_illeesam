-- migration_20260717_pm_promo_prod.sql
-- 프로모션 적용 상품 전개 테이블 4개 생성
-- PromoTargetExpandJob 배치가 pm_*_item 기반으로 채움

-- ────────────────────────────────────────────────────────────
-- 1. pm_coupon_prod
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.pm_coupon_prod (
    coupon_id  VARCHAR(21) NOT NULL,
    prod_id    VARCHAR(21) NOT NULL,
    site_id    VARCHAR(21) NOT NULL,
    reg_date   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (coupon_id, prod_id)
);
COMMENT ON TABLE  shopjoy_2604.pm_coupon_prod IS '쿠폰 적용 상품 전개 (배치 생성)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_prod.coupon_id IS '쿠폰ID (pm_coupon.coupon_id)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_prod.prod_id   IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_prod.site_id   IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pm_coupon_prod.reg_date  IS '배치 생성일시';
CREATE INDEX IF NOT EXISTS idx_pm_coupon_prod_prod   ON shopjoy_2604.pm_coupon_prod (prod_id);
CREATE INDEX IF NOT EXISTS idx_pm_coupon_prod_site   ON shopjoy_2604.pm_coupon_prod (site_id);
CREATE INDEX IF NOT EXISTS idx_pm_coupon_prod_coupon ON shopjoy_2604.pm_coupon_prod (coupon_id);

-- ────────────────────────────────────────────────────────────
-- 2. pm_discnt_prod
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.pm_discnt_prod (
    discnt_id  VARCHAR(21) NOT NULL,
    prod_id    VARCHAR(21) NOT NULL,
    site_id    VARCHAR(21) NOT NULL,
    reg_date   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (discnt_id, prod_id)
);
COMMENT ON TABLE  shopjoy_2604.pm_discnt_prod IS '할인 적용 상품 전개 (배치 생성)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_prod.discnt_id IS '할인ID (pm_discnt.discnt_id)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_prod.prod_id   IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_prod.site_id   IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pm_discnt_prod.reg_date  IS '배치 생성일시';
CREATE INDEX IF NOT EXISTS idx_pm_discnt_prod_prod   ON shopjoy_2604.pm_discnt_prod (prod_id);
CREATE INDEX IF NOT EXISTS idx_pm_discnt_prod_site   ON shopjoy_2604.pm_discnt_prod (site_id);
CREATE INDEX IF NOT EXISTS idx_pm_discnt_prod_discnt ON shopjoy_2604.pm_discnt_prod (discnt_id);

-- ────────────────────────────────────────────────────────────
-- 3. pm_event_prod
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.pm_event_prod (
    event_id   VARCHAR(21) NOT NULL,
    prod_id    VARCHAR(21) NOT NULL,
    site_id    VARCHAR(21) NOT NULL,
    reg_date   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, prod_id)
);
COMMENT ON TABLE  shopjoy_2604.pm_event_prod IS '이벤트 적용 상품 전개 (배치 생성)';
COMMENT ON COLUMN shopjoy_2604.pm_event_prod.event_id IS '이벤트ID (pm_event.event_id)';
COMMENT ON COLUMN shopjoy_2604.pm_event_prod.prod_id  IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.pm_event_prod.site_id  IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pm_event_prod.reg_date IS '배치 생성일시';
CREATE INDEX IF NOT EXISTS idx_pm_event_prod_prod  ON shopjoy_2604.pm_event_prod (prod_id);
CREATE INDEX IF NOT EXISTS idx_pm_event_prod_site  ON shopjoy_2604.pm_event_prod (site_id);
CREATE INDEX IF NOT EXISTS idx_pm_event_prod_event ON shopjoy_2604.pm_event_prod (event_id);

-- ────────────────────────────────────────────────────────────
-- 4. pm_save_prod
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.pm_save_prod (
    save_id    VARCHAR(21) NOT NULL,
    prod_id    VARCHAR(21) NOT NULL,
    site_id    VARCHAR(21) NOT NULL,
    reg_date   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (save_id, prod_id)
);
COMMENT ON TABLE  shopjoy_2604.pm_save_prod IS '적립금 적용 상품 전개 (배치 생성)';
COMMENT ON COLUMN shopjoy_2604.pm_save_prod.save_id  IS '적립금ID (pm_save.save_id)';
COMMENT ON COLUMN shopjoy_2604.pm_save_prod.prod_id  IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.pm_save_prod.site_id  IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pm_save_prod.reg_date IS '배치 생성일시';
CREATE INDEX IF NOT EXISTS idx_pm_save_prod_prod ON shopjoy_2604.pm_save_prod (prod_id);
CREATE INDEX IF NOT EXISTS idx_pm_save_prod_site ON shopjoy_2604.pm_save_prod (site_id);
CREATE INDEX IF NOT EXISTS idx_pm_save_prod_save ON shopjoy_2604.pm_save_prod (save_id);
