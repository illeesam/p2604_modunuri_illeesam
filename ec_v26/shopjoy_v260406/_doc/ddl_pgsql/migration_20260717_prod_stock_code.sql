-- ============================================================
-- Migration: pd_prod_stock_code 신규 도입
-- 재고(stock_qty)와 판매수량(sale_count)을 단품/옵션 구분 없이
-- stock_code 하나로 통일 관리
-- 날짜: 2026-07-17
-- ============================================================

-- ① 신규 테이블 생성
CREATE TABLE shopjoy_2604.pd_prod_stock_code (
    stock_code   VARCHAR(50)  NOT NULL PRIMARY KEY,
    site_id      VARCHAR(21)  NOT NULL,
    stock_qty    INTEGER      NOT NULL DEFAULT 0,
    sale_count   INTEGER      NOT NULL DEFAULT 0,
    reg_by       VARCHAR(30),
    reg_date     TIMESTAMP             DEFAULT CURRENT_TIMESTAMP,
    upd_by       VARCHAR(30),
    upd_date     TIMESTAMP
);

COMMENT ON TABLE  shopjoy_2604.pd_prod_stock_code IS '재고 코드 마스터 — stock_code 기준 재고/판매수량 단일 관리';
COMMENT ON COLUMN shopjoy_2604.pd_prod_stock_code.stock_code  IS '재고코드 (PK, 자유 문자열 — 예: SHIRT-RED-M)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_stock_code.site_id     IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_stock_code.stock_qty   IS '재고수량';
COMMENT ON COLUMN shopjoy_2604.pd_prod_stock_code.sale_count  IS '판매수량 (캐싱 — 주문 완료 시 +1)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_stock_code.reg_by      IS '등록자';
COMMENT ON COLUMN shopjoy_2604.pd_prod_stock_code.reg_date    IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.pd_prod_stock_code.upd_by      IS '수정자';
COMMENT ON COLUMN shopjoy_2604.pd_prod_stock_code.upd_date    IS '수정일시';

CREATE INDEX idx_pd_prod_stock_code_site ON shopjoy_2604.pd_prod_stock_code USING btree (site_id);

-- ② pd_prod: stock_code 컬럼 추가 (단품 재고 참조 키)
ALTER TABLE shopjoy_2604.pd_prod
    ADD COLUMN stock_code VARCHAR(50);

COMMENT ON COLUMN shopjoy_2604.pd_prod.stock_code IS '재고코드 — pd_prod_stock_code.stock_code 참조 (단품/세트 재고 연결 키, NULL=미연결)';

-- ③ pd_prod_sku: stock_code 컬럼 추가 (옵션 조합 재고 참조 키)
ALTER TABLE shopjoy_2604.pd_prod_sku
    ADD COLUMN stock_code VARCHAR(50);

COMMENT ON COLUMN shopjoy_2604.pd_prod_sku.stock_code IS '재고코드 — pd_prod_stock_code.stock_code 참조 (옵션 조합 재고 연결 키, NULL=미연결)';

-- ④ 기존 단품 재고 데이터 → pd_prod_stock_code 이관
--    prod_code 가 있으면 그걸 stock_code 로, 없으면 prod_id 를 사용
INSERT INTO shopjoy_2604.pd_prod_stock_code (stock_code, site_id, stock_qty, sale_count, reg_by, reg_date)
SELECT
    COALESCE(NULLIF(p.prod_code, ''), p.prod_id) AS stock_code,
    p.site_id,
    COALESCE(p.prod_stock, 0),
    COALESCE(p.sale_count, 0),
    p.reg_by,
    p.reg_date
FROM shopjoy_2604.pd_prod p
WHERE p.prod_type_cd = 'SINGLE'
  AND COALESCE(p.prod_stock, 0) > 0
ON CONFLICT (stock_code) DO NOTHING;

-- ⑤ pd_prod.stock_code 업데이트 (단품)
UPDATE shopjoy_2604.pd_prod p
SET stock_code = COALESCE(NULLIF(p.prod_code, ''), p.prod_id)
WHERE p.prod_type_cd = 'SINGLE';

-- ⑥ 기존 옵션 SKU 재고 → pd_prod_stock_code 이관
--    prod_sku_code 가 있으면 그걸 stock_code 로, 없으면 prod_sku_id 를 사용
INSERT INTO shopjoy_2604.pd_prod_stock_code (stock_code, site_id, stock_qty, sale_count, reg_by, reg_date)
SELECT
    COALESCE(NULLIF(s.prod_sku_code, ''), s.prod_sku_id) AS stock_code,
    s.site_id,
    COALESCE(s.prod_opt_stock, 0),
    0,
    s.reg_by,
    s.reg_date
FROM shopjoy_2604.pd_prod_sku s
WHERE COALESCE(s.prod_opt_stock, 0) > 0
ON CONFLICT (stock_code) DO NOTHING;

-- ⑦ pd_prod_sku.stock_code 업데이트
UPDATE shopjoy_2604.pd_prod_sku s
SET stock_code = COALESCE(NULLIF(s.prod_sku_code, ''), s.prod_sku_id);

-- ⑧ 기존 컬럼 제거 (데이터 이관 확인 후 실행)
--    확인: SELECT COUNT(*) FROM pd_prod WHERE stock_code IS NULL AND prod_type_cd = 'SINGLE';
--    확인: SELECT COUNT(*) FROM pd_prod_sku WHERE stock_code IS NULL;
-- ALTER TABLE shopjoy_2604.pd_prod DROP COLUMN prod_stock;
-- ALTER TABLE shopjoy_2604.pd_prod DROP COLUMN sale_count;
-- ALTER TABLE shopjoy_2604.pd_prod_sku DROP COLUMN prod_opt_stock;
-- (주석 해제 후 실행 — 이관 완료 확인 후)
