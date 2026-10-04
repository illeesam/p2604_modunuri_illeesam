-- aph_fcm_noti_send_hist 테이블 DDL
-- 알림 발송 이력 (2026-10-04 용어 보정 alarm→noti: 옛 syh_alarm_send_hist — migration_20261004_noti_rename.sql)

CREATE TABLE shopjoy_2604.aph_fcm_noti_send_hist (
    send_hist_id         VARCHAR(21)  NOT NULL CONSTRAINT aph_fcm_noti_send_hist_pk_send_hist_id PRIMARY KEY,
    reg_site_id          VARCHAR(21)  NOT NULL,
    noti_send_id         VARCHAR(21)  NOT NULL,
    member_id            VARCHAR(21) ,
    user_id              VARCHAR(21) ,
    channel              VARCHAR(20) ,
    send_to              VARCHAR(200),
    send_date            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    send_hist_status_cd  VARCHAR(20)  DEFAULT 'SENT'::character varying,
    error_msg            VARCHAR(500),
    reg_by               VARCHAR(30) ,
    reg_date             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by               VARCHAR(30) ,
    upd_date             TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.aph_fcm_noti_send_hist IS '알림 발송 이력';
COMMENT ON COLUMN shopjoy_2604.aph_fcm_noti_send_hist.send_hist_id IS '발송이력ID';
COMMENT ON COLUMN shopjoy_2604.aph_fcm_noti_send_hist.reg_site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.aph_fcm_noti_send_hist.noti_send_id IS '알림ID (ap_fcm_noti_send.noti_send_id)';
COMMENT ON COLUMN shopjoy_2604.aph_fcm_noti_send_hist.member_id IS '수신자 회원ID';
COMMENT ON COLUMN shopjoy_2604.aph_fcm_noti_send_hist.user_id IS '수신자 사용자ID (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.aph_fcm_noti_send_hist.channel IS '발송채널';
COMMENT ON COLUMN shopjoy_2604.aph_fcm_noti_send_hist.send_to IS '수신처 (이메일/전화/토큰)';
COMMENT ON COLUMN shopjoy_2604.aph_fcm_noti_send_hist.send_date IS '발송일시';
COMMENT ON COLUMN shopjoy_2604.aph_fcm_noti_send_hist.send_hist_status_cd IS '발송결과 (SENT/FAILED)';
COMMENT ON COLUMN shopjoy_2604.aph_fcm_noti_send_hist.error_msg IS '오류메시지';
COMMENT ON COLUMN shopjoy_2604.aph_fcm_noti_send_hist.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.aph_fcm_noti_send_hist.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.aph_fcm_noti_send_hist.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.aph_fcm_noti_send_hist.upd_date IS '수정일';

CREATE INDEX aph_fcm_noti_send_hist_ix01_noti_send_id ON shopjoy_2604.aph_fcm_noti_send_hist USING btree (noti_send_id);
CREATE INDEX aph_fcm_noti_send_hist_ix02_member_id ON shopjoy_2604.aph_fcm_noti_send_hist USING btree (member_id);
CREATE INDEX aph_fcm_noti_send_hist_ix03_user_id ON shopjoy_2604.aph_fcm_noti_send_hist USING btree (user_id);
