-- 판매계획 테이블 생성 + 배치 등록
-- 실행 환경: shopjoy_2604 스키마

-- 1) 테이블 생성
CREATE TABLE IF NOT EXISTS shopjoy_2604.pd_prod_plan (
    plan_id         VARCHAR(21)  NOT NULL,
    site_id         VARCHAR(21)  NOT NULL,
    prod_id         VARCHAR(21)  NOT NULL,
    start_datetime  TIMESTAMP,
    end_datetime    TIMESTAMP,
    plan_status_cd  VARCHAR(20),
    list_price      BIGINT,
    sale_price      BIGINT,
    purchase_price  BIGINT,
    sort_ord        INTEGER,
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    CONSTRAINT pk_pd_prod_plan PRIMARY KEY (plan_id)
);

COMMENT ON TABLE  shopjoy_2604.pd_prod_plan                IS '상품 판매계획';
COMMENT ON COLUMN shopjoy_2604.pd_prod_plan.plan_id        IS '판매계획ID';
COMMENT ON COLUMN shopjoy_2604.pd_prod_plan.site_id        IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.pd_prod_plan.prod_id        IS '상품ID';
COMMENT ON COLUMN shopjoy_2604.pd_prod_plan.start_datetime IS '시작일시';
COMMENT ON COLUMN shopjoy_2604.pd_prod_plan.end_datetime   IS '종료일시';
COMMENT ON COLUMN shopjoy_2604.pd_prod_plan.plan_status_cd IS '계획상태 (SCHEDULED/ACTIVE/ENDED/CANCELLED)';
COMMENT ON COLUMN shopjoy_2604.pd_prod_plan.list_price     IS '정가';
COMMENT ON COLUMN shopjoy_2604.pd_prod_plan.sale_price     IS '판매가';
COMMENT ON COLUMN shopjoy_2604.pd_prod_plan.purchase_price IS '매입가';
COMMENT ON COLUMN shopjoy_2604.pd_prod_plan.sort_ord       IS '정렬순서';

CREATE INDEX IF NOT EXISTS idx_pd_prod_plan_prod_id  ON shopjoy_2604.pd_prod_plan (prod_id);
CREATE INDEX IF NOT EXISTS idx_pd_prod_plan_datetime ON shopjoy_2604.pd_prod_plan (start_datetime, end_datetime);

-- 2) sy_batch 등록
INSERT INTO shopjoy_2604.sy_batch
    (batch_id, site_id, batch_code, batch_nm, batch_desc, cron_expr, batch_cycle_cd,
     batch_run_count, batch_status_cd, batch_run_status, batch_timeout_sec, reg_by, reg_date)
VALUES
('BT000011', '2604010000000001', 'PROD_SALE_PLAN_SYNC', '상품 판매계획 동기화',
 '판매계획 시작/종료 시각 기준 pd_prod 가격 자동 반영',
 '0 * * * *', 'HOURLY', 0, 'ACTIVE', 'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP)
ON CONFLICT (batch_id) DO NOTHING;
