-- ============================================================
-- sy_alarm : 알림 / sy_alarm_send_hist : 알림 발송 이력
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE sy_alarm (
    alarm_id         VARCHAR(21)     NOT NULL,
    site_id          VARCHAR(21),                            -- sy_site.site_id
    alarm_title      VARCHAR(200)    NOT NULL,
    alarm_type_cd    VARCHAR(30),                            -- 코드: ALARM_TYPE
    channel_cd       VARCHAR(20),                            -- 코드: ALARM_CHANNEL (EMAIL/SMS/PUSH/KAKAO)
    target_type_cd   VARCHAR(20),                            -- 코드: ALARM_TARGET_TYPE (ALL/GRADE/MEMBER)
    target_id        VARCHAR(21),                            -- 특정 회원 or 등급코드
    template_id      VARCHAR(21),
    alarm_msg        TEXT,
    alarm_send_date  TIMESTAMP,
    alarm_status_cd  VARCHAR(20)     DEFAULT 'PENDING',      -- PENDING/SENT/FAILED/CANCELLED
    alarm_send_count INTEGER         DEFAULT 0,
    alarm_fail_count INTEGER         DEFAULT 0,
    reg_by           VARCHAR(30),
    reg_date         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(30),
    upd_date         TIMESTAMP,
    disp_path        VARCHAR(200),                           -- 점(.) 구분 표시경로
    PRIMARY KEY (alarm_id)
);

COMMENT ON TABLE  sy_alarm                IS '알림';
COMMENT ON COLUMN sy_alarm.alarm_id       IS '알림ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN sy_alarm.site_id        IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN sy_alarm.alarm_title    IS '알림제목';
COMMENT ON COLUMN sy_alarm.alarm_type_cd  IS '알림유형 (코드: ALARM_TYPE)';
COMMENT ON COLUMN sy_alarm.channel_cd     IS '발송채널 (코드: ALARM_CHANNEL)';
COMMENT ON COLUMN sy_alarm.target_type_cd IS '대상유형 (코드: ALARM_TARGET_TYPE — ALL/GRADE/MEMBER)';
COMMENT ON COLUMN sy_alarm.target_id      IS '대상ID (회원ID 또는 등급코드)';
COMMENT ON COLUMN sy_alarm.template_id    IS '템플릿ID';
COMMENT ON COLUMN sy_alarm.alarm_msg      IS '발송내용';
COMMENT ON COLUMN sy_alarm.alarm_send_date IS '발송예정일시';
COMMENT ON COLUMN sy_alarm.alarm_status_cd IS '발송상태 (PENDING/SENT/FAILED/CANCELLED)';
COMMENT ON COLUMN sy_alarm.alarm_send_count IS '발송성공수';
COMMENT ON COLUMN sy_alarm.alarm_fail_count IS '발송실패수';
COMMENT ON COLUMN sy_alarm.reg_by         IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_alarm.reg_date       IS '등록일';
COMMENT ON COLUMN sy_alarm.upd_by         IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN sy_alarm.upd_date       IS '수정일';
COMMENT ON COLUMN sy_alarm.disp_path IS '점(.) 구분 표시경로 (트리 빌드용)';

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] sy_alarm.alarm_type_cd (알림유형) : 알림유형 { ORDER:주문, DELIVERY:배송, CLAIM:클레임, MARKETING:마케팅, SYSTEM:시스템 }
-- [CODES] sy_alarm.channel_cd (발송채널) : 알림채널 { EMAIL:이메일, SMS:SMS, KAKAO:알림톡, PUSH:푸시 }
-- [CODES] sy_alarm.target_type_cd (대상유형) : ALARM_TARGET_TYPE: MEMBER/VENDOR/ADMIN/ALL
