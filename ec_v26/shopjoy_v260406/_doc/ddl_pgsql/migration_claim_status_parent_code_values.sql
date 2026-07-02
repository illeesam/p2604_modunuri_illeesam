-- =====================================================================
-- 마이그레이션: CLAIM_STATUS 코드 parentCodeValues 설정
-- 목적: od_claim.claim_status_cd 유형별 표시 단계 정의 (정책서 1-C 준수)
-- 생성일: 2026-07-03
-- =====================================================================
-- 클레임 집계 상태 흐름 (od_claim.claim_status_cd)
--   취소: REQUESTED → APPROVED → COMPLT (REJECTED, CANCELLED 가능)
--   반품: REQUESTED → APPROVED → IN_PICKUP → PROCESSING → REFUND_WAIT → COMPLT (REJECTED, CANCELLED 가능)
--   교환: REQUESTED → APPROVED → IN_PICKUP → COMPLT (REJECTED, CANCELLED 가능)
-- =====================================================================

SET search_path TO shopjoy_2604;

-- REQUESTED: 취소/반품/교환 모두 적용
UPDATE sy_code
SET parent_code_values = '^CANCEL^RETURN^EXCHANGE^'
WHERE code_grp = 'CLAIM_STATUS' AND code_value = 'REQUESTED';

-- APPROVED: 취소/반품/교환 모두 적용 (취소의 경우 '취소처리중'으로 표시)
UPDATE sy_code
SET parent_code_values = '^CANCEL^RETURN^EXCHANGE^'
WHERE code_grp = 'CLAIM_STATUS' AND code_value = 'APPROVED';

-- IN_PICKUP: 반품/교환만 (취소는 물리적 수거 없음)
UPDATE sy_code
SET parent_code_values = '^RETURN^EXCHANGE^'
WHERE code_grp = 'CLAIM_STATUS' AND code_value = 'IN_PICKUP';

-- PROCESSING: 반품만 (반품 입고 후 검수 — 정책서 1-C)
UPDATE sy_code
SET parent_code_values = '^RETURN^'
WHERE code_grp = 'CLAIM_STATUS' AND code_value = 'PROCESSING';

-- COMPLT: 취소/반품/교환 모두 (각각 '취소완료'/'환불완료'/'교환완료' 의미)
UPDATE sy_code
SET parent_code_values = '^CANCEL^RETURN^EXCHANGE^'
WHERE code_grp = 'CLAIM_STATUS' AND code_value = 'COMPLT';

-- REJECTED: 취소/반품/교환 모두 (거절 — 흐름 스텝에서는 제외)
UPDATE sy_code
SET parent_code_values = '^CANCEL^RETURN^EXCHANGE^'
WHERE code_grp = 'CLAIM_STATUS' AND code_value = 'REJECTED';

-- CANCELLED: 취소/반품/교환 모두 (철회 — 흐름 스텝에서는 제외)
UPDATE sy_code
SET parent_code_values = '^CANCEL^RETURN^EXCHANGE^'
WHERE code_grp = 'CLAIM_STATUS' AND code_value = 'CANCELLED';

-- REFUND_WAIT: 반품 전용 (검수 완료 후 환불 처리 대기)
-- 교환에는 해당 없음 (교환발송은 od_claim_item.IN_TRANSIT으로 처리)
UPDATE sy_code
SET parent_code_values = '^RETURN^',
    code_remark = '반품 전용. 검수 완료 후 환불 처리 대기 (2026-07-03)'
WHERE code_grp = 'CLAIM_STATUS' AND code_value = 'REFUND_WAIT';

-- 라벨 보정: PROCESSING 레이블 '처리중' → '검수중' (반품 전용, 정책서 일치)
UPDATE sy_code
SET code_label = '검수중',
    code_remark = '반품 전용. 수거 입고 후 상태 검수 (2026-07-03 정책서 1-C 반영)'
WHERE code_grp = 'CLAIM_STATUS' AND code_value = 'PROCESSING';

-- =====================================================================
-- CLAIM_ITEM_STATUS도 동일 패턴으로 적용
-- 정책서 1-D: claim_item_status_cd 유형별 유효 상태
--   취소: REQUESTED, APPROVED, COMPLT, REJECTED, CANCELLED
--   반품: REQUESTED, APPROVED, IN_PICKUP, PROCESSING, COMPLT, REJECTED, CANCELLED
--   교환: REQUESTED, APPROVED, IN_PICKUP, IN_TRANSIT, COMPLT, REJECTED, CANCELLED
-- =====================================================================

UPDATE sy_code SET parent_code_values = '^CANCEL^RETURN^EXCHANGE^'
WHERE code_grp = 'CLAIM_ITEM_STATUS' AND code_value = 'REQUESTED';

UPDATE sy_code SET parent_code_values = '^CANCEL^RETURN^EXCHANGE^'
WHERE code_grp = 'CLAIM_ITEM_STATUS' AND code_value = 'APPROVED';

UPDATE sy_code SET parent_code_values = '^RETURN^EXCHANGE^'
WHERE code_grp = 'CLAIM_ITEM_STATUS' AND code_value = 'IN_PICKUP';

UPDATE sy_code SET parent_code_values = '^RETURN^'
WHERE code_grp = 'CLAIM_ITEM_STATUS' AND code_value = 'PROCESSING';

UPDATE sy_code SET parent_code_values = '^EXCHANGE^'
WHERE code_grp = 'CLAIM_ITEM_STATUS' AND code_value = 'IN_TRANSIT';

UPDATE sy_code SET parent_code_values = '^CANCEL^RETURN^EXCHANGE^'
WHERE code_grp = 'CLAIM_ITEM_STATUS' AND code_value = 'COMPLT';

UPDATE sy_code SET parent_code_values = '^CANCEL^RETURN^EXCHANGE^'
WHERE code_grp = 'CLAIM_ITEM_STATUS' AND code_value = 'REJECTED';

UPDATE sy_code SET parent_code_values = '^CANCEL^RETURN^EXCHANGE^'
WHERE code_grp = 'CLAIM_ITEM_STATUS' AND code_value = 'CANCELLED';

-- PROCESSING 레이블 보정
UPDATE sy_code
SET code_label = '검수중',
    code_remark = '반품 전용. 수거 입고 후 상태 검수 (2026-07-03)'
WHERE code_grp = 'CLAIM_ITEM_STATUS' AND code_value = 'PROCESSING';

COMMIT;
