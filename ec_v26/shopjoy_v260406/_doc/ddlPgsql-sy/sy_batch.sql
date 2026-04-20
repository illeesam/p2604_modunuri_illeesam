-- ============================================================
-- sy_batch : 배치 / sy_batch_hist : 배치 실행 이력
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE sy_batch (
    batch_id        VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    batch_code      VARCHAR(50)     NOT NULL,
    batch_nm        VARCHAR(100)    NOT NULL,
    batch_desc      TEXT,
    cron_expr       VARCHAR(100),                           -- cron 표현식 (예: 0 0 * * *)
    batch_cycle_cd  VARCHAR(20),                            -- 코드: BATCH_CYCLE
    batch_last_run  TIMESTAMP,
    batch_next_run  TIMESTAMP,
    batch_run_count INTEGER         DEFAULT 0,
    batch_status_cd VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: BATCH_STATUS
    batch_run_status VARCHAR(20)     DEFAULT 'IDLE',         -- IDLE/RUNNING/SUCCESS/FAILED
    batch_timeout_sec INTEGER         DEFAULT 300,
    batch_memo      TEXT,
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    disp_path       VARCHAR(200),                           -- 점(.) 구분 표시경로
    PRIMARY KEY (batch_id),
    UNIQUE (batch_code)
);

COMMENT ON TABLE  sy_batch                IS '배치 작업';
COMMENT ON COLUMN sy_batch.batch_id       IS '배치ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_batch.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_batch.batch_code     IS '배치코드';
COMMENT ON COLUMN sy_batch.batch_nm       IS '배치명';
COMMENT ON COLUMN sy_batch.batch_desc     IS '배치설명';
COMMENT ON COLUMN sy_batch.cron_expr      IS 'Cron 표현식';
COMMENT ON COLUMN sy_batch.batch_cycle_cd IS '주기유형 (코드: BATCH_CYCLE)';
COMMENT ON COLUMN sy_batch.batch_last_run IS '최근실행일시';
COMMENT ON COLUMN sy_batch.batch_next_run IS '다음실행예정일시';
COMMENT ON COLUMN sy_batch.batch_run_count IS '실행횟수';
COMMENT ON COLUMN sy_batch.batch_status_cd IS '활성상태 (코드: BATCH_STATUS)';
COMMENT ON COLUMN sy_batch.batch_run_status IS '실행상태 (IDLE/RUNNING/SUCCESS/FAILED)';
COMMENT ON COLUMN sy_batch.batch_timeout_sec IS '타임아웃(초)';
COMMENT ON COLUMN sy_batch.batch_memo      IS '메모';
COMMENT ON COLUMN sy_batch.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_batch.reg_date       IS '등록일';
COMMENT ON COLUMN sy_batch.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_batch.upd_date       IS '수정일';
COMMENT ON COLUMN sy_batch.disp_path IS '점(.) 구분 표시경로 (트리 빌드용)';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_batch.batch_cycle_cd (주기유형) : 배치주기 { MANUAL:수동, HOURLY:시간별, DAILY:일간, WEEKLY:주간, MONTHLY:월간 }
-- [CODES] sy_batch.batch_status_cd (활성상태) : 배치상태 { PENDING:대기, RUNNING:실행중, DONE:완료, FAILED:실패 }
