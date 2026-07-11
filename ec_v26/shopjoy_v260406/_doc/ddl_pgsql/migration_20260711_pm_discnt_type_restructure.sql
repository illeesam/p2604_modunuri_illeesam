-- Migration: pm_discnt 할인유형 재설계
-- 작업일: 2026-07-11
-- 목적: discnt_type_cd (RATE/FIXED/FREE_SHIP 계산방식) → (PROD/ORDER/SHIP/SHIP_FREE 대상유형)
--       discnt_purpose_cd 제거, discnt_val_type_cd 신규 추가 (RATE/AMOUNT 계산방식)
--
-- 변경 내역:
--   1. pm_discnt.discnt_type_cd 코멘트 업데이트
--   2. pm_discnt.discnt_purpose_cd 컬럼 삭제
--   3. pm_discnt.discnt_val_type_cd 컬럼 추가
--   4. pm_discnt_usage.discnt_type_cd 코멘트 업데이트

SET search_path = shopjoy_2604;

-- 1. discnt_type_cd 코멘트 업데이트
COMMENT ON COLUMN shopjoy_2604.pm_discnt.discnt_type_cd
  IS '할인유형 (코드: DISCNT_TYPE — PROD/ORDER/SHIP/SHIP_FREE)';

-- 2. discnt_purpose_cd 삭제
ALTER TABLE shopjoy_2604.pm_discnt DROP COLUMN IF EXISTS discnt_purpose_cd;
DROP INDEX IF EXISTS shopjoy_2604.idx_pm_discnt_purpose;

-- 3. discnt_val_type_cd 추가
ALTER TABLE shopjoy_2604.pm_discnt
  ADD COLUMN IF NOT EXISTS discnt_val_type_cd VARCHAR(20);

COMMENT ON COLUMN shopjoy_2604.pm_discnt.discnt_val_type_cd
  IS '할인방식 (코드: DISCNT_VAL_TYPE — RATE/AMOUNT, SHIP_FREE 유형은 해당없음)';

CREATE INDEX IF NOT EXISTS idx_pm_discnt_val_type ON shopjoy_2604.pm_discnt USING btree (discnt_val_type_cd);

-- 4. pm_discnt_usage 스냅샷 코멘트 업데이트
COMMENT ON COLUMN shopjoy_2604.pm_discnt_usage.discnt_type_cd
  IS '할인유형 스냅샷 (PROD=상품할인 / ORDER=주문할인 / SHIP=배송비할인 / SHIP_FREE=무료배송)';
