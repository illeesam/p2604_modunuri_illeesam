-- =============================================================================
-- Migration: pd_prod_opt / pd_prod_opt_item 테이블 구조 개편
-- Date: 2026-07-12
-- Description:
--   옵션 유형(차원 정의)과 옵션 값(실제 선택값)의 명칭을 명확히 분리한다.
--
--   변경 전:
--     pd_prod_opt      → 옵션 유형 정의 (색상, 사이즈 등의 축)
--     pd_prod_opt_item → 실제 옵션 값 (빨강, M 등)
--
--   변경 후:
--     pd_prod_opt_type → 옵션 유형 정의 (pd_prod_opt 테이블 이름 변경)
--     pd_prod_opt      → 실제 옵션 값  (pd_prod_opt_item 테이블 이름 변경)
--
--   관련 컬럼 rename (prod_opt_id_1/2 → prod_opt_id_1/2):
--     od_cart, od_order_item, od_dliv_item,
--     pd_prod_img, pd_prod_sku, st_settle_raw
-- =============================================================================

SET search_path TO shopjoy_2604;

-- -----------------------------------------------------------------------------
-- 1. pd_prod_opt → pd_prod_opt_type (옵션 유형 테이블 이름 변경)
-- -----------------------------------------------------------------------------
ALTER TABLE pd_prod_opt RENAME TO pd_prod_opt_type;

-- 관련 인덱스/제약 이름도 갱신 (선택적 — PostgreSQL은 부모 테이블 이름만 바뀌어도 동작함)
-- PK 제약명
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'pd_prod_opt_pkey' AND conrelid = 'pd_prod_opt_type'::regclass
    ) THEN
        ALTER TABLE pd_prod_opt_type RENAME CONSTRAINT pd_prod_opt_pkey TO pd_prod_opt_type_pkey;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. pd_prod_opt_item → pd_prod_opt (옵션 값 테이블 이름 변경)
-- -----------------------------------------------------------------------------
ALTER TABLE pd_prod_opt_item RENAME TO pd_prod_opt;

-- PK 제약명
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'pd_prod_opt_item_pkey' AND conrelid = 'pd_prod_opt'::regclass
    ) THEN
        ALTER TABLE pd_prod_opt RENAME CONSTRAINT pd_prod_opt_item_pkey TO pd_prod_opt_pkey;
    END IF;
END $$;

-- 기존 FK 컬럼명: opt_id (pd_prod_opt_item.opt_id = 구 PdProdOpt.optId = 이제 pd_prod_opt_type.opt_type_id)
-- opt_id 컬럼을 opt_type_id 로 rename
ALTER TABLE pd_prod_opt RENAME COLUMN opt_id TO opt_type_id;

-- opt_item_id 를 opt_id 로 rename (PK)
ALTER TABLE pd_prod_opt RENAME COLUMN opt_item_id TO opt_id;

-- prod_id 컬럼 추가 (비정규화 — JOIN 없이 prodId 직접 조회 가능)
ALTER TABLE pd_prod_opt
    ADD COLUMN IF NOT EXISTS prod_id VARCHAR(21);

-- prod_id 역채움: pd_prod_opt_type 테이블에서 join하여 기존 데이터 채우기
UPDATE pd_prod_opt opt
SET prod_id = t.prod_id
FROM pd_prod_opt_type t
WHERE opt.opt_type_id = t.opt_type_id;

-- prod_id 코멘트
COMMENT ON COLUMN pd_prod_opt.prod_id IS '상품ID (pd_prod.prod_id) — 비정규화 캐시 컬럼';

-- 기존 FK 인덱스 이름 갱신
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'pd_prod_opt' AND indexname = 'idx_pd_prod_opt_item_opt_id'
    ) THEN
        ALTER INDEX idx_pd_prod_opt_item_opt_id RENAME TO idx_pd_prod_opt_opt_type_id;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. od_cart: prod_opt_id_1 / prod_opt_id_2 → prod_opt_id_1 / prod_opt_id_2
-- -----------------------------------------------------------------------------
ALTER TABLE od_cart RENAME COLUMN prod_opt_id_1 TO prod_opt_id_1;
ALTER TABLE od_cart RENAME COLUMN prod_opt_id_2 TO prod_opt_id_2;

COMMENT ON COLUMN od_cart.prod_opt_id_1 IS '옵션1 값ID (pd_prod_opt.opt_id)';
COMMENT ON COLUMN od_cart.prod_opt_id_2 IS '옵션2 값ID (pd_prod_opt.opt_id)';

-- -----------------------------------------------------------------------------
-- 4. od_order_item: prod_opt_id_1 / prod_opt_id_2 → prod_opt_id_1 / prod_opt_id_2
-- -----------------------------------------------------------------------------
ALTER TABLE od_order_item RENAME COLUMN prod_opt_id_1 TO prod_opt_id_1;
ALTER TABLE od_order_item RENAME COLUMN prod_opt_id_2 TO prod_opt_id_2;

COMMENT ON COLUMN od_order_item.prod_opt_id_1 IS '옵션1 값ID 스냅샷 (pd_prod_opt.opt_id)';
COMMENT ON COLUMN od_order_item.prod_opt_id_2 IS '옵션2 값ID 스냅샷 (pd_prod_opt.opt_id)';

-- -----------------------------------------------------------------------------
-- 5. od_dliv_item: prod_opt_id_1 / prod_opt_id_2 → prod_opt_id_1 / prod_opt_id_2
-- -----------------------------------------------------------------------------
ALTER TABLE od_dliv_item RENAME COLUMN prod_opt_id_1 TO prod_opt_id_1;
ALTER TABLE od_dliv_item RENAME COLUMN prod_opt_id_2 TO prod_opt_id_2;

COMMENT ON COLUMN od_dliv_item.prod_opt_id_1 IS '옵션1 값ID 스냅샷 (pd_prod_opt.opt_id)';
COMMENT ON COLUMN od_dliv_item.prod_opt_id_2 IS '옵션2 값ID 스냅샷 (pd_prod_opt.opt_id)';

-- -----------------------------------------------------------------------------
-- 6. pd_prod_img: prod_opt_id_1 / prod_opt_id_2 → prod_opt_id_1 / prod_opt_id_2
-- -----------------------------------------------------------------------------
ALTER TABLE pd_prod_img RENAME COLUMN prod_opt_id_1 TO prod_opt_id_1;
ALTER TABLE pd_prod_img RENAME COLUMN prod_opt_id_2 TO prod_opt_id_2;

COMMENT ON COLUMN pd_prod_img.prod_opt_id_1 IS '옵션1 값ID (pd_prod_opt.opt_id) — 이미지 연결';
COMMENT ON COLUMN pd_prod_img.prod_opt_id_2 IS '옵션2 값ID (pd_prod_opt.opt_id) — 이미지 연결';

-- -----------------------------------------------------------------------------
-- 7. pd_prod_sku: prod_opt_id_1 / prod_opt_id_2 → prod_opt_id_1 / prod_opt_id_2
-- -----------------------------------------------------------------------------
ALTER TABLE pd_prod_sku RENAME COLUMN prod_opt_id_1 TO prod_opt_id_1;
ALTER TABLE pd_prod_sku RENAME COLUMN prod_opt_id_2 TO prod_opt_id_2;

COMMENT ON COLUMN pd_prod_sku.prod_opt_id_1 IS '옵션1 값ID (pd_prod_opt.opt_id)';
COMMENT ON COLUMN pd_prod_sku.prod_opt_id_2 IS '옵션2 값ID (pd_prod_opt.opt_id)';

-- -----------------------------------------------------------------------------
-- 8. st_settle_raw: prod_opt_id_1 / prod_opt_id_2 → prod_opt_id_1 / prod_opt_id_2
-- -----------------------------------------------------------------------------
ALTER TABLE st_settle_raw RENAME COLUMN prod_opt_id_1 TO prod_opt_id_1;
ALTER TABLE st_settle_raw RENAME COLUMN prod_opt_id_2 TO prod_opt_id_2;

COMMENT ON COLUMN st_settle_raw.prod_opt_id_1 IS '옵션1 값ID 스냅샷 (pd_prod_opt.opt_id)';
COMMENT ON COLUMN st_settle_raw.prod_opt_id_2 IS '옵션2 값ID 스냅샷 (pd_prod_opt.opt_id)';

-- -----------------------------------------------------------------------------
-- 9. pd_prod_opt_type 코멘트 갱신
-- -----------------------------------------------------------------------------
COMMENT ON TABLE pd_prod_opt_type IS '상품 옵션 유형 정의 (색상·사이즈 등 차원 축)';
COMMENT ON COLUMN pd_prod_opt_type.opt_type_id IS '옵션유형ID (YYMMDDhhmmss+rand4)';

-- -----------------------------------------------------------------------------
-- 10. pd_prod_opt 테이블·컬럼 코멘트 갱신
-- -----------------------------------------------------------------------------
COMMENT ON TABLE pd_prod_opt IS '상품 옵션 값 (빨강·M 등 실제 선택값)';
COMMENT ON COLUMN pd_prod_opt.opt_id IS '옵션값ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pd_prod_opt.opt_type_id IS '옵션유형ID (pd_prod_opt_type.opt_type_id)';
