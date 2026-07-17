-- pd_prod_stock 테이블 DDL
-- 재고 마스터 — prod_stock_id(PK) + stock_code(UNIQUE 비즈니스키) + prod_id 직접 FK
-- 2026-07-17 신규 설계 (구 pd_prod_stock_code 대체)
-- stock_code = pd_prod_sku.prod_sku_code 와 1:1 대응 (prod_sku_id 컬럼 불필요)

CREATE TABLE shopjoy_2604.pd_prod_stock (
    prod_stock_id VARCHAR(21)  NOT NULL,
    stock_code    VARCHAR(50)  NOT NULL,
    site_id       VARCHAR(21)  NOT NULL,
    prod_id       VARCHAR(21),
    stock_qty     INTEGER      NOT NULL DEFAULT 0,
    sale_count    INTEGER      NOT NULL DEFAULT 0,
    reg_by        VARCHAR(30),
    reg_date      TIMESTAMP             DEFAULT CURRENT_TIMESTAMP,
    upd_by        VARCHAR(30),
    upd_date      TIMESTAMP,
    CONSTRAINT pd_prod_stock_pkey PRIMARY KEY (prod_stock_id),
    CONSTRAINT uq_pd_prod_stock_stock_code UNIQUE (stock_code)
);

COMMENT ON TABLE  shopjoy_2604.pd_prod_stock IS '재고 마스터 — prod_stock_id(PK), stock_code(UNIQUE), stock_code=prod_sku_code로 SKU와 1:1 연결';
COMMENT ON COLUMN shopjoy_2604.pd_prod_stock.prod_stock_id IS '재고ID (PK, 21자 시스템 생성)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_stock.stock_code    IS '재고코드 (UNIQUE 비즈니스키 — pd_prod_sku.prod_sku_code와 동일값)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_stock.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_stock.prod_id       IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_stock.stock_qty     IS '재고수량';
COMMENT ON COLUMN shopjoy_2604.pd_prod_stock.sale_count    IS '판매수량 (캐싱 — 주문 완료 시 +1)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_stock.reg_by        IS '등록자';
COMMENT ON COLUMN shopjoy_2604.pd_prod_stock.reg_date      IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.pd_prod_stock.upd_by        IS '수정자';
COMMENT ON COLUMN shopjoy_2604.pd_prod_stock.upd_date      IS '수정일시';

CREATE INDEX idx_pd_prod_stock_site ON shopjoy_2604.pd_prod_stock USING btree (site_id);
CREATE INDEX idx_pd_prod_stock_prod ON shopjoy_2604.pd_prod_stock USING btree (prod_id);
