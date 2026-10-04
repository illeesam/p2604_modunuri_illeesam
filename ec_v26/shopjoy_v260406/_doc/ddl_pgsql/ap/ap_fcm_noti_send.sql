-- ap_fcm_noti_send 테이블 DDL
-- 알림 발송 (2026-10-04 용어 보정 alarm→noti: 옛 sy_alarm — migration_20261004_noti_rename.sql)

CREATE TABLE shopjoy_2604.ap_fcm_noti_send (
    noti_send_id         VARCHAR(21)  NOT NULL CONSTRAINT ap_fcm_noti_send_pk_noti_send_id PRIMARY KEY,
    reg_site_id          VARCHAR(21)  NOT NULL,
    noti_send_title      VARCHAR(200) NOT NULL,
    noti_send_type_cd    VARCHAR(30) ,
    channel_cd           VARCHAR(20) ,
    target_type_cd       VARCHAR(20) ,
    target_id            VARCHAR(21) ,
    template_id          VARCHAR(21) ,
    noti_send_msg        TEXT        ,
    noti_send_date       TIMESTAMP   ,
    noti_send_status_cd  VARCHAR(20)  DEFAULT 'PENDING'::character varying,
    noti_send_count      INTEGER      DEFAULT 0,
    noti_fail_count      INTEGER      DEFAULT 0,
    reg_by               VARCHAR(30) ,
    reg_date             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by               VARCHAR(30) ,
    upd_date             TIMESTAMP   ,
    path_id              VARCHAR(21) 
);

COMMENT ON TABLE  shopjoy_2604.ap_fcm_noti_send IS '알림 발송';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti_send.noti_send_id IS '알림ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti_send.reg_site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti_send.noti_send_title IS '알림제목';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti_send.noti_send_type_cd IS '알림유형 (코드: NOTI_SEND_TYPE_CD)';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti_send.channel_cd IS '발송채널 (코드: NOTI_CHANNEL)';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti_send.target_type_cd IS '대상유형 (코드: NOTI_TARGET_TYPE — ALL/GRADE/MEMBER)';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti_send.target_id IS '대상ID (회원ID 또는 등급코드)';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti_send.template_id IS '템플릿ID';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti_send.noti_send_msg IS '발송내용';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti_send.noti_send_date IS '발송예정일시';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti_send.noti_send_status_cd IS '발송상태 (코드: NOTI_SEND_STATUS — PENDING/SENT/FAILED/CANCELLED)';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti_send.noti_send_count IS '발송성공수';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti_send.noti_fail_count IS '발송실패수';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti_send.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti_send.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti_send.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti_send.upd_date IS '수정일';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti_send.path_id IS '점(.) 구분 표시경로 (트리 빌드용)';

CREATE INDEX ap_fcm_noti_send_ix01_target_id ON shopjoy_2604.ap_fcm_noti_send USING btree (target_id);
CREATE INDEX ap_fcm_noti_send_ix02_template_id ON shopjoy_2604.ap_fcm_noti_send USING btree (template_id);
