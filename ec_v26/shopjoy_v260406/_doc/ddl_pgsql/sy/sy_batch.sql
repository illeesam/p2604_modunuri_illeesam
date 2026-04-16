-- ============================================================
-- sy_batch : 배치 / sy_batch_hist : 배치 실행 이력
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE sy_batch (
    batch_id        VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    batch_code      VARCHAR(50)     NOT NULL,
    batch_nm        VARCHAR(100)    NOT NULL,
    desc            TEXT,
    cron_expr       VARCHAR(100),                           -- cron 표현식 (예: 0 0 * * *)
    batch_cycle_cd  VARCHAR(20),                            -- 코드: BATCH_CYCLE
    last_run        TIMESTAMP,
    next_run        TIMESTAMP,
    run_count       INTEGER         DEFAULT 0,
    batch_status_cd VARCHAR(20)     DEFAULT 'ACTIVE',       -- 코드: BATCH_STATUS
    run_status      VARCHAR(20)     DEFAULT 'IDLE',         -- IDLE/RUNNING/SUCCESS/FAILED
    timeout_sec     INTEGER         DEFAULT 300,
    memo            TEXT,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
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
COMMENT ON COLUMN sy_batch.desc           IS '설명';
COMMENT ON COLUMN sy_batch.cron_expr      IS 'Cron 표현식';
COMMENT ON COLUMN sy_batch.batch_cycle_cd IS '주기유형 (코드: BATCH_CYCLE)';
COMMENT ON COLUMN sy_batch.last_run       IS '최근실행일시';
COMMENT ON COLUMN sy_batch.next_run       IS '다음실행예정일시';
COMMENT ON COLUMN sy_batch.run_count      IS '실행횟수';
COMMENT ON COLUMN sy_batch.status_cd      IS '활성상태 (코드: BATCH_STATUS)';
COMMENT ON COLUMN sy_batch.run_status     IS '실행상태 (IDLE/RUNNING/SUCCESS/FAILED)';
COMMENT ON COLUMN sy_batch.timeout_sec    IS '타임아웃(초)';
COMMENT ON COLUMN sy_batch.memo           IS '메모';
COMMENT ON COLUMN sy_batch.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_batch.reg_date       IS '등록일';
COMMENT ON COLUMN sy_batch.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_batch.upd_date       IS '수정일';
COMMENT ON COLUMN sy_batch.disp_path IS '점(.) 구분 표시경로 (트리 빌드용)';
