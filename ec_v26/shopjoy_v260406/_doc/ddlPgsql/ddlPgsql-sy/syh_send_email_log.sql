-- ============================================================
-- syh_send_email_log : 이메일 발송 로그
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE syh_send_email_log (
    log_id          VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    template_id     VARCHAR(21),                           -- sy_template.template_id
    template_code   VARCHAR(50),                           -- 템플릿코드 스냅샷
    member_id       VARCHAR(21),                           -- 대상 회원ID (ec_member.member_id, 비회원 NULL)
    user_id         VARCHAR(21),                           -- 대상 관리자ID (sy_user.user_id, 관리자 발송 시)
    from_addr       VARCHAR(200)    NOT NULL,              -- 발신 이메일
    to_addr         VARCHAR(200)    NOT NULL,              -- 수신 이메일
    cc_addr         VARCHAR(500),                          -- 참조 (복수 시 콤마 구분)
    bcc_addr        VARCHAR(500),                          -- 숨은참조
    subject         VARCHAR(300)    NOT NULL,              -- 발송 제목 (치환 완료본)
    content         TEXT,                                  -- 발송 본문 (치환 완료본 HTML)
    params          TEXT,                                  -- 치환 파라미터 JSON
    result_cd       VARCHAR(20)     DEFAULT 'SUCCESS',     -- 코드: SEND_RESULT (SUCCESS/FAIL/PENDING)
    fail_reason     VARCHAR(500),                          -- 실패 사유
    send_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    ref_type_cd     VARCHAR(30),                           -- 연관유형코드 (ORDER/CLAIM/JOIN/PWD_RESET 등)
    ref_id          VARCHAR(21),                           -- 연관ID
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (log_id)
);

COMMENT ON TABLE  syh_send_email_log               IS '이메일 발송 로그';
COMMENT ON COLUMN syh_send_email_log.log_id        IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN syh_send_email_log.site_id       IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN syh_send_email_log.template_id   IS '템플릿ID (sy_template.template_id)';
COMMENT ON COLUMN syh_send_email_log.template_code IS '템플릿코드 스냅샷';
COMMENT ON COLUMN syh_send_email_log.member_id     IS '대상 회원ID (ec_member.member_id, 비회원 NULL)';
COMMENT ON COLUMN syh_send_email_log.user_id       IS '대상 관리자ID (sy_user.user_id, 관리자 발송 시)';
COMMENT ON COLUMN syh_send_email_log.from_addr     IS '발신 이메일';
COMMENT ON COLUMN syh_send_email_log.to_addr       IS '수신 이메일';
COMMENT ON COLUMN syh_send_email_log.cc_addr       IS '참조 이메일 (복수 시 콤마 구분)';
COMMENT ON COLUMN syh_send_email_log.bcc_addr      IS '숨은참조 이메일';
COMMENT ON COLUMN syh_send_email_log.subject       IS '발송 제목 (치환 완료본)';
COMMENT ON COLUMN syh_send_email_log.content       IS '발송 본문 (치환 완료본 HTML)';
COMMENT ON COLUMN syh_send_email_log.params        IS '치환 파라미터 JSON (예: {"order_no":"...","member_nm":"..."})';
COMMENT ON COLUMN syh_send_email_log.result_cd     IS '발송결과 (코드: SEND_RESULT)';
COMMENT ON COLUMN syh_send_email_log.fail_reason   IS '실패 사유';
COMMENT ON COLUMN syh_send_email_log.send_date     IS '발송일시';
COMMENT ON COLUMN syh_send_email_log.ref_type_cd   IS '연관유형코드 (ORDER/CLAIM/JOIN/PWD_RESET 등)';
COMMENT ON COLUMN syh_send_email_log.ref_id        IS '연관ID';
COMMENT ON COLUMN syh_send_email_log.reg_by        IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_send_email_log.reg_date      IS '등록일';
COMMENT ON COLUMN syh_send_email_log.upd_by        IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN syh_send_email_log.upd_date      IS '수정일';

CREATE INDEX idx_syh_send_email_log_member   ON syh_send_email_log (member_id);
CREATE INDEX idx_syh_send_email_log_user     ON syh_send_email_log (user_id);
CREATE INDEX idx_syh_send_email_log_template ON syh_send_email_log (template_id);
CREATE INDEX idx_syh_send_email_log_date     ON syh_send_email_log (send_date);
CREATE INDEX idx_syh_send_email_log_ref      ON syh_send_email_log (ref_type_cd, ref_id);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] syh_send_email_log.result_cd (발송결과) : SEND_RESULT { SUCCESS:성공, FAILED:실패, PENDING:대기 }
