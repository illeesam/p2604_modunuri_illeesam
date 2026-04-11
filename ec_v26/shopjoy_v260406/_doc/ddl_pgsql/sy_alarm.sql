-- ============================================================
-- sy_alarm : 알림 / sy_alarm_send_hist : 알림 발송 이력
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE sy_alarm (
    alarm_id        VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    title           VARCHAR(200)    NOT NULL,
    alarm_type_cd   VARCHAR(30),                            -- 코드: ALARM_TYPE
    channel_cd      VARCHAR(20),                            -- 코드: ALARM_CHANNEL (EMAIL/SMS/PUSH/KAKAO)
    target_type_cd  VARCHAR(20),                            -- ALL/GRADE/MEMBER
    target_id       VARCHAR(16),                            -- 특정 회원 or 등급코드
    template_id     VARCHAR(16),
    message         TEXT,
    send_date       TIMESTAMP,
    status_cd       VARCHAR(20)     DEFAULT 'PENDING',      -- PENDING/SENT/FAILED/CANCELLED
    send_count      INTEGER         DEFAULT 0,
    fail_count      INTEGER         DEFAULT 0,
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (alarm_id)
);

COMMENT ON TABLE  sy_alarm               IS '알림';
COMMENT ON COLUMN sy_alarm.alarm_id      IS '알림ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_alarm.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_alarm.title         IS '알림제목';
COMMENT ON COLUMN sy_alarm.alarm_type_cd IS '알림유형 (코드: ALARM_TYPE)';
COMMENT ON COLUMN sy_alarm.channel_cd    IS '발송채널 (코드: ALARM_CHANNEL)';
COMMENT ON COLUMN sy_alarm.target_type_cd IS '대상유형 (ALL/GRADE/MEMBER)';
COMMENT ON COLUMN sy_alarm.target_id     IS '대상ID (회원ID 또는 등급코드)';
COMMENT ON COLUMN sy_alarm.template_id   IS '템플릿ID';
COMMENT ON COLUMN sy_alarm.message       IS '발송내용';
COMMENT ON COLUMN sy_alarm.send_date     IS '발송예정일시';
COMMENT ON COLUMN sy_alarm.status_cd     IS '발송상태 (PENDING/SENT/FAILED/CANCELLED)';
COMMENT ON COLUMN sy_alarm.send_count    IS '발송성공수';
COMMENT ON COLUMN sy_alarm.fail_count    IS '발송실패수';
COMMENT ON COLUMN sy_alarm.reg_by        IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN sy_alarm.reg_date      IS '등록일';
COMMENT ON COLUMN sy_alarm.upd_by        IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN sy_alarm.upd_date      IS '수정일';

-- 알림 발송 이력 (수신자별)
CREATE TABLE sy_alarm_send_hist (
    send_hist_id    VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    alarm_id        VARCHAR(16)     NOT NULL,
    member_id       VARCHAR(16),
    channel_cd      VARCHAR(20),
    send_to         VARCHAR(200),                           -- 이메일 or 전화번호 or 토큰
    send_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    status_cd       VARCHAR(20)     DEFAULT 'SENT',         -- SENT/FAILED
    error_msg       VARCHAR(500),
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (send_hist_id)
);

COMMENT ON TABLE  sy_alarm_send_hist                IS '알림 발송 이력';
COMMENT ON COLUMN sy_alarm_send_hist.send_hist_id   IS '발송이력ID';
COMMENT ON COLUMN sy_alarm_send_hist.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_alarm_send_hist.alarm_id       IS '알림ID';
COMMENT ON COLUMN sy_alarm_send_hist.member_id      IS '수신자 회원ID';
COMMENT ON COLUMN sy_alarm_send_hist.channel_cd     IS '발송채널';
COMMENT ON COLUMN sy_alarm_send_hist.send_to        IS '수신처 (이메일/전화/토큰)';
COMMENT ON COLUMN sy_alarm_send_hist.send_date      IS '발송일시';
COMMENT ON COLUMN sy_alarm_send_hist.status_cd      IS '발송결과 (SENT/FAILED)';
COMMENT ON COLUMN sy_alarm_send_hist.error_msg      IS '오류메시지';
COMMENT ON COLUMN sy_alarm_send_hist.reg_by         IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN sy_alarm_send_hist.reg_date       IS '등록일';
COMMENT ON COLUMN sy_alarm_send_hist.upd_by         IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN sy_alarm_send_hist.upd_date       IS '수정일';
