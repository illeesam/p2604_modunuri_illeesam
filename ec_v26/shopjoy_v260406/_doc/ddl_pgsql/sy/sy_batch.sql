-- sy_batch 테이블 DDL
-- 배치 작업

CREATE TABLE shopjoy_2604.sy_batch (
    batch_id          VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id           VARCHAR(21)  NOT NULL,
    batch_code        VARCHAR(50)  NOT NULL,
    batch_nm          VARCHAR(100) NOT NULL,
    batch_desc        TEXT        ,
    cron_expr         VARCHAR(100),
    batch_cycle_cd    VARCHAR(20) ,
    batch_last_run    TIMESTAMP   ,
    batch_next_run    TIMESTAMP   ,
    batch_run_count   INTEGER      DEFAULT 0,
    batch_status_cd   VARCHAR(20)  DEFAULT 'ACTIVE'::character varying,
    batch_run_status  VARCHAR(20)  DEFAULT 'IDLE'::character varying,
    batch_timeout_sec INTEGER      DEFAULT 300,
    batch_memo        TEXT        ,
    reg_by            VARCHAR(30) ,
    reg_date          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by            VARCHAR(30) ,
    upd_date          TIMESTAMP   ,
    path_id           VARCHAR(21) 
);

COMMENT ON TABLE  shopjoy_2604.sy_batch IS '배치 작업';
COMMENT ON COLUMN shopjoy_2604.sy_batch.batch_id IS '배치ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.sy_batch.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.sy_batch.batch_code IS '배치코드';
COMMENT ON COLUMN shopjoy_2604.sy_batch.batch_nm IS '배치명';
COMMENT ON COLUMN shopjoy_2604.sy_batch.batch_desc IS '배치설명';
COMMENT ON COLUMN shopjoy_2604.sy_batch.cron_expr IS 'Cron 표현식';
COMMENT ON COLUMN shopjoy_2604.sy_batch.batch_cycle_cd IS '주기유형 (코드: BATCH_CYCLE)';
COMMENT ON COLUMN shopjoy_2604.sy_batch.batch_last_run IS '최근실행일시';
COMMENT ON COLUMN shopjoy_2604.sy_batch.batch_next_run IS '다음실행예정일시';
COMMENT ON COLUMN shopjoy_2604.sy_batch.batch_run_count IS '실행횟수';
COMMENT ON COLUMN shopjoy_2604.sy_batch.batch_status_cd IS '활성상태 (코드: BATCH_STATUS)';
COMMENT ON COLUMN shopjoy_2604.sy_batch.batch_run_status IS '실행상태 (IDLE/RUNNING/SUCCESS/FAILED)';
COMMENT ON COLUMN shopjoy_2604.sy_batch.batch_timeout_sec IS '타임아웃(초)';
COMMENT ON COLUMN shopjoy_2604.sy_batch.batch_memo IS '메모';
COMMENT ON COLUMN shopjoy_2604.sy_batch.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_batch.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.sy_batch.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_batch.upd_date IS '수정일';
COMMENT ON COLUMN shopjoy_2604.sy_batch.path_id IS '점(.) 구분 표시경로 (트리 빌드용)';

CREATE INDEX idx_sy_batch_site ON shopjoy_2604.sy_batch USING btree (site_id);
CREATE UNIQUE INDEX sy_batch_batch_code_key ON shopjoy_2604.sy_batch USING btree (batch_code);
