-- 상품 판매계획 (시간대별 가격 스케줄)
CREATE TABLE shopjoy_2604.pd_prod_plan (
    plan_id         VARCHAR(21)  NOT NULL,
    site_id         VARCHAR(21)  NOT NULL,
    prod_id         VARCHAR(21)  NOT NULL,
    start_datetime  TIMESTAMP,
    end_datetime    TIMESTAMP,
    plan_status_cd  VARCHAR(20),  -- SCHEDULED / ACTIVE / ENDED / CANCELLED
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
COMMENT ON COLUMN shopjoy_2604.pd_prod_plan.reg_by         IS '등록자';
COMMENT ON COLUMN shopjoy_2604.pd_prod_plan.reg_date       IS '등록일';
COMMENT ON COLUMN shopjoy_2604.pd_prod_plan.upd_by         IS '수정자';
COMMENT ON COLUMN shopjoy_2604.pd_prod_plan.upd_date       IS '수정일';

CREATE INDEX idx_pd_prod_plan_prod_id ON shopjoy_2604.pd_prod_plan (prod_id);
CREATE INDEX idx_pd_prod_plan_datetime ON shopjoy_2604.pd_prod_plan (start_datetime, end_datetime);
