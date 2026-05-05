-- syh_send_msg_log 테이블 DDL
-- 메시지 발송 로그 (SMS/카카오/앱푸시)

CREATE TABLE shopjoy_2604.syh_send_msg_log (
    log_id         VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id        VARCHAR(21) ,
    channel_cd     VARCHAR(20)  NOT NULL,
    template_id    VARCHAR(21) ,
    template_code  VARCHAR(50) ,
    member_id      VARCHAR(21) ,
    user_id        VARCHAR(21) ,
    recv_phone     VARCHAR(20) ,
    device_token   VARCHAR(300),
    sender_phone   VARCHAR(20) ,
    title          VARCHAR(200),
    content        TEXT        ,
    params         TEXT        ,
    kakao_tpl_code VARCHAR(50) ,
    result_cd      VARCHAR(20)  DEFAULT 'SUCCESS',
    result_msg     VARCHAR(200),
    fail_reason    VARCHAR(500),
    send_date      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    ref_type_cd    VARCHAR(30) ,
    ref_id         VARCHAR(21) ,
    reg_by         VARCHAR(30) ,
    reg_date       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by         VARCHAR(30) ,
    upd_date       TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.syh_send_msg_log IS '메시지 발송 로그 (SMS/카카오/앱푸시)';
COMMENT ON COLUMN shopjoy_2604.syh_send_msg_log.log_id IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.syh_send_msg_log.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.syh_send_msg_log.channel_cd IS '발송채널 (코드: MSG_CHANNEL)';
COMMENT ON COLUMN shopjoy_2604.syh_send_msg_log.template_id IS '템플릿ID (sy_template.template_id)';
COMMENT ON COLUMN shopjoy_2604.syh_send_msg_log.template_code IS '템플릿코드 스냅샷';
COMMENT ON COLUMN shopjoy_2604.syh_send_msg_log.member_id IS '대상 회원ID (ec_member.member_id, 비회원 NULL)';
COMMENT ON COLUMN shopjoy_2604.syh_send_msg_log.user_id IS '대상 관리자ID (sy_user.user_id, 관리자 발송 시)';
COMMENT ON COLUMN shopjoy_2604.syh_send_msg_log.recv_phone IS '수신 전화번호 (SMS/LMS/카카오)';
COMMENT ON COLUMN shopjoy_2604.syh_send_msg_log.device_token IS '디바이스 토큰 (앱 푸시)';
COMMENT ON COLUMN shopjoy_2604.syh_send_msg_log.sender_phone IS '발신 번호 (SMS/LMS)';
COMMENT ON COLUMN shopjoy_2604.syh_send_msg_log.title IS '제목 (LMS/앱 푸시)';
COMMENT ON COLUMN shopjoy_2604.syh_send_msg_log.content IS '발송 내용 (치환 완료본)';
COMMENT ON COLUMN shopjoy_2604.syh_send_msg_log.params IS '치환 파라미터 JSON (예: {"order_no":"...","recv_nm":"..."})';
COMMENT ON COLUMN shopjoy_2604.syh_send_msg_log.kakao_tpl_code IS '카카오 알림톡 템플릿 코드 (카카오 채널 시)';
COMMENT ON COLUMN shopjoy_2604.syh_send_msg_log.result_cd IS '발송결과 (코드: SEND_RESULT)';
COMMENT ON COLUMN shopjoy_2604.syh_send_msg_log.result_msg IS '통신사/카카오 응답 메시지';
COMMENT ON COLUMN shopjoy_2604.syh_send_msg_log.fail_reason IS '실패 사유';
COMMENT ON COLUMN shopjoy_2604.syh_send_msg_log.send_date IS '발송일시';
COMMENT ON COLUMN shopjoy_2604.syh_send_msg_log.ref_type_cd IS '연관유형코드 (ORDER/CLAIM/JOIN/AUTH 등)';
COMMENT ON COLUMN shopjoy_2604.syh_send_msg_log.ref_id IS '연관ID';
COMMENT ON COLUMN shopjoy_2604.syh_send_msg_log.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.syh_send_msg_log.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.syh_send_msg_log.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.syh_send_msg_log.upd_date IS '수정일';

CREATE INDEX idx_syh_send_msg_log_channel ON shopjoy_2604.syh_send_msg_log USING btree (channel_cd, result_cd);
CREATE INDEX idx_syh_send_msg_log_date ON shopjoy_2604.syh_send_msg_log USING btree (send_date);
CREATE INDEX idx_syh_send_msg_log_member ON shopjoy_2604.syh_send_msg_log USING btree (member_id);
CREATE INDEX idx_syh_send_msg_log_ref ON shopjoy_2604.syh_send_msg_log USING btree (ref_type_cd, ref_id);
CREATE INDEX idx_syh_send_msg_log_template ON shopjoy_2604.syh_send_msg_log USING btree (template_id);
CREATE INDEX idx_syh_send_msg_log_user ON shopjoy_2604.syh_send_msg_log USING btree (user_id);
