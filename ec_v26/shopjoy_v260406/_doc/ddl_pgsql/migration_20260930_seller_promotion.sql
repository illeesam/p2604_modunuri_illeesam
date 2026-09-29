-- ═══════════════════════════════════════════════════════════
--  셀러(seller_id) 컨셉 — 프로모션 6개 테이블 seller_id 확장
--  작성일: 2026-09-30
--  전제  : migration_20260929_seller_phase1.sql 적용 완료(mb_seller 존재)
--
--  대상: pm_coupon(쿠폰) / pm_discnt(할인) / pm_event(이벤트) / pm_save_policy(적립금 정책) /
--        pm_gift(사은품) / pm_plan(기획전) — 전부 "캠페인 마스터" 테이블만 대상으로 하고,
--        *_prod/*_item/*_issue/*_usage 등 하위 연결/이력 테이블은 마스터의 seller_id로
--        충분히 조회 가능해 컬럼을 추가하지 않는다(od_order_item과 동일한 정규화 원칙).
--
--  의미: seller_id NULL = 플랫폼(운영자/MD) 전체 대상 프로모션(비용 플랫폼 부담)
--        seller_id 값 있음 = 그 셀러 전용 프로모션(비용 그 셀러 부담, 정산 시 st_settle에 반영)
-- ═══════════════════════════════════════════════════════════
--  사용법 (psql/DBeaver):
--    SET search_path TO shopjoy_2604;
--    아래 스크립트 실행
-- ═══════════════════════════════════════════════════════════

SET search_path TO shopjoy_2604;

ALTER TABLE shopjoy_2604.pm_coupon      ADD COLUMN IF NOT EXISTS seller_id VARCHAR(21);
ALTER TABLE shopjoy_2604.pm_discnt      ADD COLUMN IF NOT EXISTS seller_id VARCHAR(21);
ALTER TABLE shopjoy_2604.pm_event       ADD COLUMN IF NOT EXISTS seller_id VARCHAR(21);
ALTER TABLE shopjoy_2604.pm_save_policy ADD COLUMN IF NOT EXISTS seller_id VARCHAR(21);
ALTER TABLE shopjoy_2604.pm_gift        ADD COLUMN IF NOT EXISTS seller_id VARCHAR(21);
ALTER TABLE shopjoy_2604.pm_plan        ADD COLUMN IF NOT EXISTS seller_id VARCHAR(21);

COMMENT ON COLUMN shopjoy_2604.pm_coupon.seller_id      IS '판매자ID (mb_seller.seller_id) — NULL=플랫폼 전체, 값 있음=그 셀러 전용 쿠폰';
COMMENT ON COLUMN shopjoy_2604.pm_discnt.seller_id      IS '판매자ID (mb_seller.seller_id) — NULL=플랫폼 전체, 값 있음=그 셀러 전용 할인';
COMMENT ON COLUMN shopjoy_2604.pm_event.seller_id       IS '판매자ID (mb_seller.seller_id) — NULL=플랫폼 전체, 값 있음=그 셀러 전용 이벤트';
COMMENT ON COLUMN shopjoy_2604.pm_save_policy.seller_id IS '판매자ID (mb_seller.seller_id) — NULL=플랫폼 전체, 값 있음=그 셀러 전용 적립정책';
COMMENT ON COLUMN shopjoy_2604.pm_gift.seller_id        IS '판매자ID (mb_seller.seller_id) — NULL=플랫폼 전체, 값 있음=그 셀러 전용 사은품';
COMMENT ON COLUMN shopjoy_2604.pm_plan.seller_id        IS '판매자ID (mb_seller.seller_id) — NULL=플랫폼 기획전, 값 있음=그 셀러 전용 기획전';

CREATE INDEX IF NOT EXISTS idx_pm_coupon_seller      ON shopjoy_2604.pm_coupon (seller_id);
CREATE INDEX IF NOT EXISTS idx_pm_discnt_seller      ON shopjoy_2604.pm_discnt (seller_id);
CREATE INDEX IF NOT EXISTS idx_pm_event_seller       ON shopjoy_2604.pm_event (seller_id);
CREATE INDEX IF NOT EXISTS idx_pm_save_policy_seller ON shopjoy_2604.pm_save_policy (seller_id);
CREATE INDEX IF NOT EXISTS idx_pm_gift_seller        ON shopjoy_2604.pm_gift (seller_id);
CREATE INDEX IF NOT EXISTS idx_pm_plan_seller        ON shopjoy_2604.pm_plan (seller_id);

-- FK (참조 테이블 존재 시에만, 이미 있으면 스킵)
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['pm_coupon','pm_discnt','pm_event','pm_save_policy','pm_gift','pm_plan']
  LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE table_schema='shopjoy_2604' AND table_name=t AND constraint_name = 'fk_'||t||'_seller')
    THEN
      EXECUTE format('ALTER TABLE shopjoy_2604.%I ADD CONSTRAINT fk_%I_seller FOREIGN KEY (seller_id) REFERENCES shopjoy_2604.mb_seller (seller_id)', t, t);
    END IF;
  END LOOP;
END $$;

-- 기존 데이터는 전부 플랫폼(운영자) 생성분이라 seller_id는 NULL로 남겨둔다(백필 대상 없음 —
-- vendor_id 같은 기존 소유자 컬럼 자체가 이 6개 테이블엔 없었음).

-- ═══════════════════════════════════════════════════════════
--  검증
-- ═══════════════════════════════════════════════════════════
-- SELECT table_name, column_name FROM information_schema.columns
-- WHERE table_schema='shopjoy_2604' AND column_name='seller_id'
-- AND table_name IN ('pm_coupon','pm_discnt','pm_event','pm_save_policy','pm_gift','pm_plan');
