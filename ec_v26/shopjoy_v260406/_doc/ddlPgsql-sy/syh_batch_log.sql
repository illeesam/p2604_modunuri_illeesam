-- 배치 실행 로그
CREATE TABLE syh_batch_log (
    batch_log_id    VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    batch_id        VARCHAR(21)     NOT NULL,
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
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (batch_log_id)
);

COMMENT ON TABLE  syh_batch_log               IS '배치 실행 로그';
COMMENT ON COLUMN syh_batch_log.batch_log_id  IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN syh_batch_log.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN syh_batch_log.batch_id      IS '배치ID';
COMMENT ON COLUMN syh_batch_log.batch_code    IS '배치코드';
COMMENT ON COLUMN syh_batch_log.batch_nm      IS '배치명';
COMMENT ON COLUMN syh_batch_log.run_at        IS '실행시작일시';
COMMENT ON COLUMN syh_batch_log.end_at        IS '실행종료일시';
COMMENT ON COLUMN syh_batch_log.duration_ms   IS '실행시간(ms)';
COMMENT ON COLUMN syh_batch_log.run_status    IS '실행결과 (SUCCESS/FAILED/TIMEOUT)';
COMMENT ON COLUMN syh_batch_log.proc_count    IS '처리건수';
COMMENT ON COLUMN syh_batch_log.error_count   IS '오류건수';
COMMENT ON COLUMN syh_batch_log.message       IS '결과메시지';
COMMENT ON COLUMN syh_batch_log.detail        IS '상세로그 (JSON)';
COMMENT ON COLUMN syh_batch_log.reg_by        IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_batch_log.reg_date      IS '등록일';
COMMENT ON COLUMN syh_batch_log.upd_by        IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_batch_log.upd_date      IS '수정일';

CREATE INDEX idx_syh_batch_log_batch  ON syh_batch_log (batch_id);
CREATE INDEX idx_syh_batch_log_date   ON syh_batch_log (run_at);
CREATE INDEX idx_syh_batch_log_status ON syh_batch_log (run_status);
