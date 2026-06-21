-- ============================================================
-- syh_ext_test_log — 외부 연동 테스트 이력
-- ============================================================
CREATE TABLE IF NOT EXISTS shopjoy_2604.syh_ext_test_log (
    log_id          VARCHAR(40)  NOT NULL,
    site_id         VARCHAR(20)  NOT NULL,
    channel_key     VARCHAR(60)  NOT NULL,          -- _TEST_MAP 키 (smtp, fcm, ai 등)
    channel_label   VARCHAR(100),                   -- 채널 표시명
    test_result     VARCHAR(10)  NOT NULL,          -- SUCCESS / FAIL
    test_msg        VARCHAR(2000),                  -- 결과 메시지
    test_url        VARCHAR(500),                   -- 호출 URL
    reg_by          VARCHAR(40)  NOT NULL,
    reg_date        TIMESTAMP    NOT NULL,
    upd_by          VARCHAR(40),
    upd_date        TIMESTAMP,
    CONSTRAINT pk_syh_ext_test_log PRIMARY KEY (log_id)
);

COMMENT ON TABLE  shopjoy_2604.syh_ext_test_log              IS '외부 연동 테스트 이력';
COMMENT ON COLUMN shopjoy_2604.syh_ext_test_log.log_id       IS '로그ID';
COMMENT ON COLUMN shopjoy_2604.syh_ext_test_log.site_id      IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.syh_ext_test_log.channel_key  IS '채널키 (smtp/fcm/sms/ai 등)';
COMMENT ON COLUMN shopjoy_2604.syh_ext_test_log.channel_label IS '채널 표시명';
COMMENT ON COLUMN shopjoy_2604.syh_ext_test_log.test_result  IS '테스트결과 (SUCCESS/FAIL)';
COMMENT ON COLUMN shopjoy_2604.syh_ext_test_log.test_msg     IS '결과 메시지';
COMMENT ON COLUMN shopjoy_2604.syh_ext_test_log.test_url     IS '테스트 호출 URL';
COMMENT ON COLUMN shopjoy_2604.syh_ext_test_log.reg_by       IS '등록자';
COMMENT ON COLUMN shopjoy_2604.syh_ext_test_log.reg_date     IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.syh_ext_test_log.upd_by       IS '수정자';
COMMENT ON COLUMN shopjoy_2604.syh_ext_test_log.upd_date     IS '수정일시';

CREATE INDEX IF NOT EXISTS idx_syh_ext_test_log_channel ON shopjoy_2604.syh_ext_test_log (channel_key, reg_date DESC);
CREATE INDEX IF NOT EXISTS idx_syh_ext_test_log_site    ON shopjoy_2604.syh_ext_test_log (site_id, reg_date DESC);
