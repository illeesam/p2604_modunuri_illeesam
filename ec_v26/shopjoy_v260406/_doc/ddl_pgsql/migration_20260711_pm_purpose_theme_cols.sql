-- Migration: pm 도메인 용도/테마 컬럼 추가
-- 작업일: 2026-07-11
-- 목적: 쿠폰/할인/적립금/기획전 시뮬레이터 cd 영문화와 연동하여 실제 컬럼 추가
--
-- 변경 내역:
--   1. pm_coupon.coupon_type_cd 코멘트 업데이트 (코드값 영문 명시)
--   2. pm_discnt.discnt_purpose_cd 신규 컬럼 추가 (할인용도)
--   3. pm_save.save_purpose_cd 신규 컬럼 추가 (적립용도)
--   4. pm_plan.plan_theme_cd 신규 컬럼 추가 (기획전 테마)

SET search_path = shopjoy_2604;

-- ─────────────────────────────────────────────
-- 1. pm_coupon: coupon_type_cd 코멘트 업데이트
-- ─────────────────────────────────────────────
COMMENT ON COLUMN shopjoy_2604.pm_coupon.coupon_type_cd
  IS '쿠폰유형 (코드: COUPON_TYPE — PROD_DISCNT/ORDER_DISCNT/SHIP_DISCNT/SHIP_FREE/JOIN_GIFT/VIP/CLAIM_COMP)';

-- ─────────────────────────────────────────────
-- 2. pm_discnt: discnt_purpose_cd 컬럼 추가
-- ─────────────────────────────────────────────
ALTER TABLE shopjoy_2604.pm_discnt
  ADD COLUMN IF NOT EXISTS discnt_purpose_cd VARCHAR(20);

COMMENT ON COLUMN shopjoy_2604.pm_discnt.discnt_purpose_cd
  IS '할인용도 (코드: DISCNT_PURPOSE — PROD/ORDER/SHIP_FREE/JOIN/VIP/SEASON/CART)';

-- ─────────────────────────────────────────────
-- 3. pm_save: save_purpose_cd 컬럼 추가
-- ─────────────────────────────────────────────
ALTER TABLE shopjoy_2604.pm_save
  ADD COLUMN IF NOT EXISTS save_purpose_cd VARCHAR(20);

COMMENT ON COLUMN shopjoy_2604.pm_save.save_purpose_cd
  IS '적립용도 (코드: SAVE_PURPOSE — PURCHASE/REVIEW/JOIN/BIRTHDAY/VIP/EVENT/ADMIN)';

-- ─────────────────────────────────────────────
-- 4. pm_plan: plan_theme_cd 컬럼 추가
-- ─────────────────────────────────────────────
ALTER TABLE shopjoy_2604.pm_plan
  ADD COLUMN IF NOT EXISTS plan_theme_cd VARCHAR(30);

COMMENT ON COLUMN shopjoy_2604.pm_plan.plan_theme_cd
  IS '테마 (코드: PLAN_THEME — SPRING_NEW/SUMMER_COOL/CHUSEOK/WINTER_WARM/BLACK_FRI/LUXURY_BRAND/OUTDOOR/HOME_DECOR/HEALTH_FOOD/DIGITAL/FASHION/BEAUTY/KIDS/TRAVEL/PET/CHILDREN_DAY/CHRISTMAS/NEW_YEAR/ZOMBIE_DAY/DISABILITY/HALLOWEEN)';

-- 인덱스 (조회 빈도 높은 컬럼만)
CREATE INDEX IF NOT EXISTS idx_pm_discnt_purpose ON shopjoy_2604.pm_discnt USING btree (discnt_purpose_cd);
CREATE INDEX IF NOT EXISTS idx_pm_save_purpose   ON shopjoy_2604.pm_save   USING btree (save_purpose_cd);
CREATE INDEX IF NOT EXISTS idx_pm_plan_theme     ON shopjoy_2604.pm_plan   USING btree (plan_theme_cd);
