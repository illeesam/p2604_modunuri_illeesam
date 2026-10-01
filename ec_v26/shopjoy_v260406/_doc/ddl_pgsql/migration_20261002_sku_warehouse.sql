-- ═══════════════════════════════════════════════════════════
--  셀러 컨셉 Phase 2 — SKU 단위 출고 창고 (pd_prod_sku.warehouse_id)
--  작성일: 2026-10-02
--  전제  : migration_20260930_seller_phase2.sql, migration_20261002_seller_rename_sl.sql 적용 완료 (pd_prod.warehouse_id 존재, 테이블명 sl_seller_warehouse)
--
--  배경:
--   재고(stock_qty)는 2026-09-14 결정으로 pd_prod_sku 에 통합돼 있다. 그런데 창고(출고지)는
--   pd_prod.warehouse_id 에만 있어서 "이 재고가 어느 창고 것인가"를 SKU 단위로 알 수 없었다.
--   → SKU 가 자기 출고 창고를 가진다. NULL = 상품(pd_prod.warehouse_id)의 기본 창고를 따름.
--   실효 창고 = COALESCE(pd_prod_sku.warehouse_id, pd_prod.warehouse_id)
--
--  주의: 이 컬럼은 "재고가 어느 창고에 있는가"를 가리키는 참조일 뿐, 창고별로 재고 수량을
--        쪼개는 원장(과거 pd_prod_stock 구조)이 아니다. SKU 1행 = 재고 수량 1개 유지.
-- ═══════════════════════════════════════════════════════════
--  사용법 (psql/DBeaver): 아래 스크립트 실행
-- ═══════════════════════════════════════════════════════════

SET search_path TO shopjoy_2604;

ALTER TABLE shopjoy_2604.pd_prod_sku ADD COLUMN IF NOT EXISTS warehouse_id VARCHAR(21);
COMMENT ON COLUMN shopjoy_2604.pd_prod_sku.warehouse_id IS '출고 창고 (sl_seller_warehouse.warehouse_id) — NULL=상품(pd_prod.warehouse_id)의 기본 창고를 따름. 창고별 재고 분산이 아니라 이 SKU 재고가 놓인 창고 참조';
CREATE INDEX IF NOT EXISTS idx_pd_prod_sku_warehouse ON shopjoy_2604.pd_prod_sku (warehouse_id);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                 WHERE table_schema='shopjoy_2604' AND table_name='pd_prod_sku' AND constraint_name='fk_pd_prod_sku_warehouse')
  THEN
    ALTER TABLE shopjoy_2604.pd_prod_sku ADD CONSTRAINT fk_pd_prod_sku_warehouse FOREIGN KEY (warehouse_id) REFERENCES shopjoy_2604.sl_seller_warehouse (warehouse_id);
  END IF;
END $$;

-- 이미 pd_prod.warehouse_id 가 지정된 상품의 SKU 는 같은 창고로 채워둔다 (신규 컬럼이라 대상이 없을 수 있음)
UPDATE shopjoy_2604.pd_prod_sku s
   SET warehouse_id = p.warehouse_id
  FROM shopjoy_2604.pd_prod p
 WHERE s.prod_id = p.prod_id
   AND p.warehouse_id IS NOT NULL
   AND s.warehouse_id IS NULL;

-- ═══════════════════════════════════════════════════════════
--  검증
-- ═══════════════════════════════════════════════════════════
-- SELECT column_name FROM information_schema.columns WHERE table_schema='shopjoy_2604' AND table_name='pd_prod_sku' AND column_name='warehouse_id';
