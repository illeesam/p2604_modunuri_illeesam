-- sy_alarm 테이블 DDL
-- 알림

CREATE TABLE shopjoy_2604.sy_alarm (
    alarm_id         VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id          VARCHAR(21) ,
    alarm_title      VARCHAR(200) NOT NULL,
    alarm_type_cd    VARCHAR(30) ,
    channel_cd       VARCHAR(20) ,
    target_type_cd   VARCHAR(20) ,
    target_id        VARCHAR(21) ,
    template_id      VARCHAR(21) ,
    alarm_msg        TEXT        ,
    alarm_send_date  TIMESTAMP   ,
    alarm_status_cd  VARCHAR(20)  DEFAULT 'PENDING',
    alarm_send_count INTEGER      DEFAULT 0,
    alarm_fail_count INTEGER      DEFAULT 0,
    reg_by           VARCHAR(30) ,
    reg_date         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(30) ,
    upd_date         TIMESTAMP   ,
    path_id          VARCHAR(21) 
);

COMMENT ON TABLE  shopjoy_2604.sy_alarm IS '알림';
COMMENT ON COLUMN shopjoy_2604.sy_alarm.alarm_id IS '알림ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.sy_alarm.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.sy_alarm.alarm_title IS '알림제목';
COMMENT ON COLUMN shopjoy_2604.sy_alarm.alarm_type_cd IS '알림유형 (코드: ALARM_TYPE)';
COMMENT ON COLUMN shopjoy_2604.sy_alarm.channel_cd IS '발송채널 (코드: ALARM_CHANNEL)';
COMMENT ON COLUMN shopjoy_2604.sy_alarm.target_type_cd IS '대상유형 (코드: ALARM_TARGET_TYPE — ALL/GRADE/MEMBER)';
COMMENT ON COLUMN shopjoy_2604.sy_alarm.target_id IS '대상ID (회원ID 또는 등급코드)';
COMMENT ON COLUMN shopjoy_2604.sy_alarm.template_id IS '템플릿ID';
COMMENT ON COLUMN shopjoy_2604.sy_alarm.alarm_msg IS '발송내용';
COMMENT ON COLUMN shopjoy_2604.sy_alarm.alarm_send_date IS '발송예정일시';
COMMENT ON COLUMN shopjoy_2604.sy_alarm.alarm_status_cd IS '발송상태 (PENDING/SENT/FAILED/CANCELLED)';
COMMENT ON COLUMN shopjoy_2604.sy_alarm.alarm_send_count IS '발송성공수';
COMMENT ON COLUMN shopjoy_2604.sy_alarm.alarm_fail_count IS '발송실패수';
COMMENT ON COLUMN shopjoy_2604.sy_alarm.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_alarm.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.sy_alarm.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.sy_alarm.upd_date IS '수정일';
COMMENT ON COLUMN shopjoy_2604.sy_alarm.path_id IS '점(.) 구분 표시경로 (트리 빌드용)';
