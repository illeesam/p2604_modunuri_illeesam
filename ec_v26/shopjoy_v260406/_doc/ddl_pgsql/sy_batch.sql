-- ============================================================
-- sy_batch : 배치 / sy_batch_log : 배치 실행 로그
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE sy_batch (
    batch_id        VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    batch_code      VARCHAR(50)     NOT NULL,
    batch_nm        VARCHAR(100)    NOT NULL,
    description     TEXT,
    cron_expr       VARCHAR(100),                           -- cron 표현식 (예: 0 0 * * *)
    batch_cycle_cd  VARCHAR(20),                            -- 코드: BATCH_CYCLE
    last_run        TIMESTAMP,
    next_run        TIMESTAMP,
    run_count       INTEGER         DEFAULT 0,
    status_cd       VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: BATCH_STATUS
    run_status      VARCHAR(20)     DEFAULT 'IDLE',         -- IDLE/RUNNING/SUCCESS/FAILED
    timeout_sec     INTEGER         DEFAULT 300,
    memo            TEXT,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (batch_id),
    UNIQUE (batch_code)
);

COMMENT ON TABLE  sy_batch                IS '배치 작업';
COMMENT ON COLUMN sy_batch.batch_id       IS '배치ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_batch.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_batch.batch_code     IS '배치코드';
COMMENT ON COLUMN sy_batch.batch_nm       IS '배치명';
COMMENT ON COLUMN sy_batch.description    IS '설명';
COMMENT ON COLUMN sy_batch.cron_expr      IS 'Cron 표현식';
COMMENT ON COLUMN sy_batch.batch_cycle_cd IS '주기유형 (코드: BATCH_CYCLE)';
COMMENT ON COLUMN sy_batch.last_run       IS '최근실행일시';
COMMENT ON COLUMN sy_batch.next_run       IS '다음실행예정일시';
COMMENT ON COLUMN sy_batch.run_count      IS '실행횟수';
COMMENT ON COLUMN sy_batch.status_cd      IS '활성상태 (코드: BATCH_STATUS)';
COMMENT ON COLUMN sy_batch.run_status     IS '실행상태 (IDLE/RUNNING/SUCCESS/FAILED)';
COMMENT ON COLUMN sy_batch.timeout_sec    IS '타임아웃(초)';
COMMENT ON COLUMN sy_batch.memo           IS '메모';
COMMENT ON COLUMN sy_batch.reg_by         IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN sy_batch.reg_date       IS '등록일';
COMMENT ON COLUMN sy_batch.upd_by         IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN sy_batch.upd_date       IS '수정일';

-- 배치 실행 로그
CREATE TABLE sy_batch_log (
    batch_log_id    VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    batch_id        VARCHAR(16)     NOT NULL,
    batch_code      VARCHAR(50),
    batch_nm        VARCHAR(100),
    run_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    end_at          TIMESTAMP,
    duration_ms     INTEGER,                                -- 실행시간(ms)
    run_status      VARCHAR(20),                            -- SUCCESS/FAILED/TIMEOUT
    proc_count      INTEGER         DEFAULT 0,              -- 처리건수
    error_count     INTEGER         DEFAULT 0,
    message         TEXT,
    detail          TEXT,                                   -- 상세 로그 (JSON)
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (batch_log_id)
);

COMMENT ON TABLE  sy_batch_log               IS '배치 실행 로그';
COMMENT ON COLUMN sy_batch_log.batch_log_id  IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_batch_log.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_batch_log.batch_id      IS '배치ID';
COMMENT ON COLUMN sy_batch_log.batch_code    IS '배치코드';
COMMENT ON COLUMN sy_batch_log.batch_nm      IS '배치명';
COMMENT ON COLUMN sy_batch_log.run_at        IS '실행시작일시';
COMMENT ON COLUMN sy_batch_log.end_at        IS '실행종료일시';
COMMENT ON COLUMN sy_batch_log.duration_ms   IS '실행시간(ms)';
COMMENT ON COLUMN sy_batch_log.run_status    IS '실행결과 (SUCCESS/FAILED/TIMEOUT)';
COMMENT ON COLUMN sy_batch_log.proc_count    IS '처리건수';
COMMENT ON COLUMN sy_batch_log.error_count   IS '오류건수';
COMMENT ON COLUMN sy_batch_log.message       IS '결과메시지';
COMMENT ON COLUMN sy_batch_log.detail        IS '상세로그 (JSON)';
COMMENT ON COLUMN sy_batch_log.reg_by        IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN sy_batch_log.reg_date      IS '등록일';
COMMENT ON COLUMN sy_batch_log.upd_by        IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN sy_batch_log.upd_date      IS '수정일';

CREATE INDEX idx_sy_batch_log_batch  ON sy_batch_log (batch_id);
CREATE INDEX idx_sy_batch_log_date   ON sy_batch_log (run_at);
CREATE INDEX idx_sy_batch_log_status ON sy_batch_log (run_status);
