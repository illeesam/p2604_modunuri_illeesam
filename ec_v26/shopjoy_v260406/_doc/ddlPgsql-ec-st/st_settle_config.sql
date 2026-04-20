-- ============================================================
-- st_settle_config : 정산기준 설정
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- 우선순위: vendor_id+category_id > vendor_id > site_id(전체기준)
-- ============================================================
CREATE TABLE st_settle_config (
    settle_config_id    VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21)     NOT NULL,               -- sy_site.site_id
    vendor_id           VARCHAR(21),                            -- sy_vendor.vendor_id (NULL이면 전체)
    category_id         VARCHAR(21),                            -- pd_category.category_id (NULL이면 전체)
    settle_cycle_cd     VARCHAR(20)     DEFAULT 'MONTHLY',      -- 코드: SETTLE_CYCLE (DAILY/WEEKLY/MONTHLY)
    settle_day          INTEGER         DEFAULT 10,             -- 정산일 (월 N일)
    commission_rate     NUMERIC(5,2)    DEFAULT 0,              -- 수수료율 (%)
    min_settle_amt      BIGINT          DEFAULT 0,              -- 최소 정산금액
    settle_config_remark VARCHAR(500),                          -- 비고
    use_yn              CHAR(1)         DEFAULT 'Y',
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,
    PRIMARY KEY (settle_config_id),
    UNIQUE (site_id, vendor_id, category_id)
);

COMMENT ON TABLE st_settle_config IS '정산기준 설정';
COMMENT ON COLUMN st_settle_config.settle_config_id  IS '정산기준ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN st_settle_config.site_id           IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN st_settle_config.vendor_id         IS '업체ID (NULL=전체 기준)';
COMMENT ON COLUMN st_settle_config.category_id       IS '카테고리ID (NULL=전체 기준)';
COMMENT ON COLUMN st_settle_config.settle_cycle_cd   IS '정산주기 (코드: SETTLE_CYCLE — DAILY/WEEKLY/MONTHLY)';
COMMENT ON COLUMN st_settle_config.settle_day        IS '정산일 (월 N일, MONTHLY 시 사용)';
COMMENT ON COLUMN st_settle_config.commission_rate   IS '수수료율 (%)';
COMMENT ON COLUMN st_settle_config.min_settle_amt    IS '최소 정산금액';
COMMENT ON COLUMN st_settle_config.settle_config_remark IS '비고';
COMMENT ON COLUMN st_settle_config.use_yn            IS '사용여부 Y/N';
COMMENT ON COLUMN st_settle_config.reg_by            IS '등록자';
COMMENT ON COLUMN st_settle_config.reg_date          IS '등록일';
COMMENT ON COLUMN st_settle_config.upd_by            IS '수정자';
COMMENT ON COLUMN st_settle_config.upd_date          IS '수정일';

CREATE INDEX idx_st_settle_config_vendor   ON st_settle_config (site_id, vendor_id);
CREATE INDEX idx_st_settle_config_category ON st_settle_config (site_id, category_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] st_settle_config.settle_cycle_cd (정산주기) : SETTLE_CYCLE { WEEKLY:주간, BIWEEKLY:격주, MONTHLY:월간 }
