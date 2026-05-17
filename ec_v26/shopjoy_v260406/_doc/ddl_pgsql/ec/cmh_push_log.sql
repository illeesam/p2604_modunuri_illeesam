-- cmh_push_log 테이블 DDL
-- 푸시/알림 발송 로그

CREATE TABLE shopjoy_2604.cmh_push_log (
    log_id           VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id          VARCHAR(21)  NOT NULL,
    channel_cd       VARCHAR(20)  NOT NULL,
    template_id      VARCHAR(21) ,
    member_id        VARCHAR(21) ,
    recv_addr        VARCHAR(200) NOT NULL,
    push_log_title   VARCHAR(200),
    push_log_content TEXT        ,
    result_cd        VARCHAR(20)  DEFAULT 'SUCCESS'::character varying,
    fail_reason      VARCHAR(500),
    send_date        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    ref_type_cd      VARCHAR(30) ,
    ref_id           VARCHAR(21) ,
    reg_by           VARCHAR(30) ,
    reg_date         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(30) ,
    upd_date         TIMESTAMP   
);

COMMENT ON TABLE  shopjoy_2604.cmh_push_log IS '푸시/알림 발송 로그';
COMMENT ON COLUMN shopjoy_2604.cmh_push_log.log_id IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.cmh_push_log.site_id IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.cmh_push_log.channel_cd IS '발송채널 (코드: PUSH_CHANNEL)';
COMMENT ON COLUMN shopjoy_2604.cmh_push_log.template_id IS '템플릿ID (sy_template.template_id)';
COMMENT ON COLUMN shopjoy_2604.cmh_push_log.member_id IS '대상 회원ID';
COMMENT ON COLUMN shopjoy_2604.cmh_push_log.recv_addr IS '수신처 (이메일/전화번호/디바이스토큰)';
COMMENT ON COLUMN shopjoy_2604.cmh_push_log.push_log_title IS '발송 제목';
COMMENT ON COLUMN shopjoy_2604.cmh_push_log.push_log_content IS '발송 내용';
COMMENT ON COLUMN shopjoy_2604.cmh_push_log.result_cd IS '발송결과 (코드: PUSH_RESULT)';
COMMENT ON COLUMN shopjoy_2604.cmh_push_log.fail_reason IS '실패 사유';
COMMENT ON COLUMN shopjoy_2604.cmh_push_log.send_date IS '발송일시';
COMMENT ON COLUMN shopjoy_2604.cmh_push_log.ref_type_cd IS '연관유형코드 (ORDER/CLAIM/EVENT 등)';
COMMENT ON COLUMN shopjoy_2604.cmh_push_log.ref_id IS '연관ID';
COMMENT ON COLUMN shopjoy_2604.cmh_push_log.reg_by IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.cmh_push_log.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.cmh_push_log.upd_by IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.cmh_push_log.upd_date IS '수정일';

CREATE INDEX idx_cmh_push_log_site ON shopjoy_2604.cmh_push_log USING btree (site_id);
CREATE INDEX idx_sy_push_log_channel ON shopjoy_2604.cmh_push_log USING btree (channel_cd, result_cd);
CREATE INDEX idx_sy_push_log_date ON shopjoy_2604.cmh_push_log USING btree (send_date);
CREATE INDEX idx_sy_push_log_member ON shopjoy_2604.cmh_push_log USING btree (member_id);
