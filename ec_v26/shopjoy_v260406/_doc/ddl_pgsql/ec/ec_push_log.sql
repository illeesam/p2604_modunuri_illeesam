-- ============================================================
-- ec_push_log : 푸시/알림 발송 로그
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- 용도: 이메일, SMS, 카카오 알림톡, 앱 푸시 통합 관리
-- ============================================================
CREATE TABLE ec_push_log (
    log_id          VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),
    channel_cd      VARCHAR(20)     NOT NULL,              -- 코드: PUSH_CHANNEL (EMAIL/SMS/KAKAO/APP)
    template_id     VARCHAR(16),                           -- sy_template.template_id
    member_id       VARCHAR(16),                           -- 대상 회원 (시스템 발송 시 NULL)
    recv_addr       VARCHAR(200)    NOT NULL,              -- 수신처 (이메일, 전화번호, 토큰 등)
    title           VARCHAR(200),                          -- 발송 제목
    content         TEXT,                                  -- 발송 내용
    result_cd       VARCHAR(20)     DEFAULT 'SUCCESS',     -- 코드: PUSH_RESULT (SUCCESS/FAIL/PENDING)
    fail_reason     VARCHAR(500),                          -- 실패 사유
    send_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    ref_type        VARCHAR(30),                           -- 연관유형 (ORDER/CLAIM/EVENT 등)
    ref_id          VARCHAR(16),                           -- 연관ID (order_id 등)
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (log_id)
);

COMMENT ON TABLE  ec_push_log              IS '푸시/알림 발송 로그';
COMMENT ON COLUMN ec_push_log.log_id       IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_push_log.site_id      IS '사이트ID';
COMMENT ON COLUMN ec_push_log.channel_cd   IS '발송채널 (코드: PUSH_CHANNEL)';
COMMENT ON COLUMN ec_push_log.template_id  IS '템플릿ID (sy_template.template_id)';
COMMENT ON COLUMN ec_push_log.member_id    IS '대상 회원ID';
COMMENT ON COLUMN ec_push_log.recv_addr    IS '수신처 (이메일/전화번호/디바이스토큰)';
COMMENT ON COLUMN ec_push_log.title        IS '발송 제목';
COMMENT ON COLUMN ec_push_log.content      IS '발송 내용';
COMMENT ON COLUMN ec_push_log.result_cd    IS '발송결과 (코드: PUSH_RESULT)';
COMMENT ON COLUMN ec_push_log.fail_reason  IS '실패 사유';
COMMENT ON COLUMN ec_push_log.send_date    IS '발송일시';
COMMENT ON COLUMN ec_push_log.ref_type     IS '연관유형 (ORDER/CLAIM/EVENT 등)';
COMMENT ON COLUMN ec_push_log.ref_id       IS '연관ID';
COMMENT ON COLUMN ec_push_log.reg_by       IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN ec_push_log.reg_date     IS '등록일';
COMMENT ON COLUMN ec_push_log.upd_by       IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN ec_push_log.upd_date     IS '수정일';

CREATE INDEX idx_ec_push_log_member  ON ec_push_log (member_id);
CREATE INDEX idx_ec_push_log_date    ON ec_push_log (send_date);
CREATE INDEX idx_ec_push_log_channel ON ec_push_log (channel_cd, result_cd);
