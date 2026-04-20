-- 알림 발송 이력 (수신자별)
CREATE TABLE syh_alarm_send_hist (
    send_hist_id    VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    alarm_id        VARCHAR(21)     NOT NULL,
    member_id       VARCHAR(21),
    channel         VARCHAR(20),
    send_to         VARCHAR(200),                           -- 이메일 or 전화번호 or 토큰
    send_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    send_hist_status_cd VARCHAR(20)     DEFAULT 'SENT',         -- SENT/FAILED
    error_msg       VARCHAR(500),
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (send_hist_id)
);

COMMENT ON TABLE  syh_alarm_send_hist                IS '알림 발송 이력';
COMMENT ON COLUMN syh_alarm_send_hist.send_hist_id   IS '발송이력ID';
COMMENT ON COLUMN syh_alarm_send_hist.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN syh_alarm_send_hist.alarm_id       IS '알림ID';
COMMENT ON COLUMN syh_alarm_send_hist.member_id      IS '수신자 회원ID';
COMMENT ON COLUMN syh_alarm_send_hist.channel        IS '발송채널';
COMMENT ON COLUMN syh_alarm_send_hist.send_to        IS '수신처 (이메일/전화/토큰)';
COMMENT ON COLUMN syh_alarm_send_hist.send_date      IS '발송일시';
COMMENT ON COLUMN syh_alarm_send_hist.send_hist_status_cd IS '발송결과 (SENT/FAILED)';
COMMENT ON COLUMN syh_alarm_send_hist.error_msg      IS '오류메시지';
COMMENT ON COLUMN syh_alarm_send_hist.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_alarm_send_hist.reg_date       IS '등록일';
COMMENT ON COLUMN syh_alarm_send_hist.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_alarm_send_hist.upd_date       IS '수정일';
