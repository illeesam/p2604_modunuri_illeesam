-- st_settle_config 테이블 DDL
-- 정산기준 설정

CREATE TABLE shopjoy_2604.st_settle_config (
    settle_config_id     VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id              VARCHAR(21)  NOT NULL,
    vendor_id            VARCHAR(21) ,
    category_id          VARCHAR(21) ,
    settle_cycle_cd      VARCHAR(20)  DEFAULT 'MONTHLY',
    settle_day           INTEGER      DEFAULT 10,
    commission_rate      NUMERIC(5,2) DEFAULT 0,
    min_settle_amt       BIGINT       DEFAULT 0,
    settle_config_remark VARCHAR(500),
    use_yn               VARCHAR(1)   DEFAULT 'Y',
    reg_by               VARCHAR(30) ,
    reg_date             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by               VARCHAR(30) ,
    upd_date             TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.st_settle_config IS '정산기준 설정';
COMMENT ON COLUMN shopjoy_2604.st_settle_config.settle_config_id IS '정산기준ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.st_settle_config.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_config.vendor_id IS '업체ID (NULL=전체 기준)';
COMMENT ON COLUMN shopjoy_2604.st_settle_config.category_id IS '카테고리ID (NULL=전체 기준)';
COMMENT ON COLUMN shopjoy_2604.st_settle_config.settle_cycle_cd IS '정산주기 (코드: SETTLE_CYCLE — DAILY/WEEKLY/MONTHLY)';
COMMENT ON COLUMN shopjoy_2604.st_settle_config.settle_day IS '정산일 (월 N일, MONTHLY 시 사용)';
COMMENT ON COLUMN shopjoy_2604.st_settle_config.commission_rate IS '수수료율 (%)';
COMMENT ON COLUMN shopjoy_2604.st_settle_config.min_settle_amt IS '최소 정산금액';
COMMENT ON COLUMN shopjoy_2604.st_settle_config.settle_config_remark IS '비고';
COMMENT ON COLUMN shopjoy_2604.st_settle_config.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.st_settle_config.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.st_settle_config.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.st_settle_config.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.st_settle_config.upd_date IS '수정일';

CREATE INDEX idx_st_settle_config_category ON shopjoy_2604.st_settle_config USING btree (site_id, category_id);
CREATE INDEX idx_st_settle_config_vendor ON shopjoy_2604.st_settle_config USING btree (site_id, vendor_id);
CREATE UNIQUE INDEX st_settle_config_site_id_vendor_id_category_id_key ON shopjoy_2604.st_settle_config USING btree (site_id, vendor_id, category_id);
