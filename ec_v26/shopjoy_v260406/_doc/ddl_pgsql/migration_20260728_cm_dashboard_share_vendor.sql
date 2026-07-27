-- ============================================================================
-- cm_dashboard — 공유대상에 업체 추가 (2026-07-28)
--
-- 기존 공유대상은 부서(share_dept_id) · 사용자(share_user_ids) 둘뿐이었다.
-- 업체(판매/배송/CS 등) 단위로 공유하는 경우가 있어 share_vendor_ids 를 더한다.
--
-- 저장형식은 기존 share_user_ids 와 동일한 ^ 감싼 멀티값 (^V1^V2^).
-- 판정도 동일하게 OR 로 더한다 — 부서 OR 사용자 OR 업체 중 하나라도 맞으면 보인다.
--   BoCmDashboardController.isVisibleTo() 참조.
-- ============================================================================

ALTER TABLE shopjoy_2604.cm_dashboard ADD COLUMN IF NOT EXISTS share_vendor_ids VARCHAR(1000);

COMMENT ON COLUMN shopjoy_2604.cm_dashboard.share_vendor_ids IS
  '공유대상 업체ID 멀티값 (^V1^V2^). 부서·사용자와 OR 로 판정';
