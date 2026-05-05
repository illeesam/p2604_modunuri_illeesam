-- syh_send_email_log 테이블 DDL
-- 이메일 발송 로그

CREATE TABLE shopjoy_2604.syh_send_email_log (
    log_id        VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id       VARCHAR(21) ,
    template_id   VARCHAR(21) ,
    template_code VARCHAR(50) ,
    member_id     VARCHAR(21) ,
    user_id       VARCHAR(21) ,
    from_addr     VARCHAR(200) NOT NULL,
    to_addr       VARCHAR(200) NOT NULL,
    cc_addr       VARCHAR(500),
    bcc_addr      VARCHAR(500),
    subject       VARCHAR(300) NOT NULL,
    content       TEXT        ,
    params        TEXT        ,
    result_cd     VARCHAR(20)  DEFAULT 'SUCCESS',
    fail_reason   VARCHAR(500),
    send_date     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    ref_type_cd   VARCHAR(30) ,
    ref_id        VARCHAR(21) ,
    reg_by        VARCHAR(30) ,
    reg_date      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by        VARCHAR(30) ,
    upd_date      TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.syh_send_email_log IS '이메일 발송 로그';
COMMENT ON COLUMN shopjoy_2604.syh_send_email_log.log_id IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.syh_send_email_log.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.syh_send_email_log.template_id IS '템플릿ID (sy_template.template_id)';
COMMENT ON COLUMN shopjoy_2604.syh_send_email_log.template_code IS '템플릿코드 스냅샷';
COMMENT ON COLUMN shopjoy_2604.syh_send_email_log.member_id IS '대상 회원ID (ec_member.member_id, 비회원 NULL)';
COMMENT ON COLUMN shopjoy_2604.syh_send_email_log.user_id IS '대상 관리자ID (sy_user.user_id, 관리자 발송 시)';
COMMENT ON COLUMN shopjoy_2604.syh_send_email_log.from_addr IS '발신 이메일';
COMMENT ON COLUMN shopjoy_2604.syh_send_email_log.to_addr IS '수신 이메일';
COMMENT ON COLUMN shopjoy_2604.syh_send_email_log.cc_addr IS '참조 이메일 (복수 시 콤마 구분)';
COMMENT ON COLUMN shopjoy_2604.syh_send_email_log.bcc_addr IS '숨은참조 이메일';
COMMENT ON COLUMN shopjoy_2604.syh_send_email_log.subject IS '발송 제목 (치환 완료본)';
COMMENT ON COLUMN shopjoy_2604.syh_send_email_log.content IS '발송 본문 (치환 완료본 HTML)';
COMMENT ON COLUMN shopjoy_2604.syh_send_email_log.params IS '치환 파라미터 JSON (예: {"order_no":"...","member_nm":"..."})';
COMMENT ON COLUMN shopjoy_2604.syh_send_email_log.result_cd IS '발송결과 (코드: SEND_RESULT)';
COMMENT ON COLUMN shopjoy_2604.syh_send_email_log.fail_reason IS '실패 사유';
COMMENT ON COLUMN shopjoy_2604.syh_send_email_log.send_date IS '발송일시';
COMMENT ON COLUMN shopjoy_2604.syh_send_email_log.ref_type_cd IS '연관유형코드 (ORDER/CLAIM/JOIN/PWD_RESET 등)';
COMMENT ON COLUMN shopjoy_2604.syh_send_email_log.ref_id IS '연관ID';
COMMENT ON COLUMN shopjoy_2604.syh_send_email_log.reg_by IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.syh_send_email_log.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.syh_send_email_log.upd_by IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.syh_send_email_log.upd_date IS '수정일';

CREATE INDEX idx_syh_send_email_log_date ON shopjoy_2604.syh_send_email_log USING btree (send_date);
CREATE INDEX idx_syh_send_email_log_member ON shopjoy_2604.syh_send_email_log USING btree (member_id);
CREATE INDEX idx_syh_send_email_log_ref ON shopjoy_2604.syh_send_email_log USING btree (ref_type_cd, ref_id);
CREATE INDEX idx_syh_send_email_log_template ON shopjoy_2604.syh_send_email_log USING btree (template_id);
CREATE INDEX idx_syh_send_email_log_user ON shopjoy_2604.syh_send_email_log USING btree (user_id);
