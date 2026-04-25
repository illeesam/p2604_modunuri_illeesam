-- ============================================================
-- ec_push_log : 푸시/알림 발송 로그
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- 용도: 이메일, SMS, 카카오 알림톡, 앱 푸시 통합 관리
-- ============================================================
CREATE TABLE cmh_push_log (
    log_id          VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),
    channel_cd      VARCHAR(20)     NOT NULL,              -- 코드: PUSH_CHANNEL (EMAIL/SMS/KAKAO/APP)
    template_id     VARCHAR(21),                           -- sy_template.template_id
    member_id       VARCHAR(21),                           -- 대상 회원 (시스템 발송 시 NULL)
    recv_addr       VARCHAR(200)    NOT NULL,              -- 수신처 (이메일, 전화번호, 토큰 등)
    push_log_title  VARCHAR(200),                          -- 발송 제목
    push_log_content TEXT,                                  -- 발송 내용
    result_cd       VARCHAR(20)     DEFAULT 'SUCCESS',     -- 코드: PUSH_RESULT (SUCCESS/FAIL/PENDING)
    fail_reason     VARCHAR(500),                          -- 실패 사유
    send_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    ref_type_cd     VARCHAR(30),                           -- 연관유형코드 (ORDER/CLAIM/EVENT 등)
    ref_id          VARCHAR(21),                           -- 연관ID (order_id 등)
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (log_id)
);

COMMENT ON TABLE cmh_push_log IS '푸시/알림 발송 로그';
COMMENT ON COLUMN cmh_push_log.log_id       IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN cmh_push_log.site_id      IS '사이트ID';
COMMENT ON COLUMN cmh_push_log.channel_cd   IS '발송채널 (코드: PUSH_CHANNEL)';
COMMENT ON COLUMN cmh_push_log.template_id  IS '템플릿ID (sy_template.template_id)';
COMMENT ON COLUMN cmh_push_log.member_id    IS '대상 회원ID';
COMMENT ON COLUMN cmh_push_log.recv_addr    IS '수신처 (이메일/전화번호/디바이스토큰)';
COMMENT ON COLUMN cmh_push_log.push_log_title IS '발송 제목';
COMMENT ON COLUMN cmh_push_log.push_log_content IS '발송 내용';
COMMENT ON COLUMN cmh_push_log.result_cd    IS '발송결과 (코드: PUSH_RESULT)';
COMMENT ON COLUMN cmh_push_log.fail_reason  IS '실패 사유';
COMMENT ON COLUMN cmh_push_log.send_date    IS '발송일시';
COMMENT ON COLUMN cmh_push_log.ref_type_cd  IS '연관유형코드 (ORDER/CLAIM/EVENT 등)';
COMMENT ON COLUMN cmh_push_log.ref_id       IS '연관ID';
COMMENT ON COLUMN cmh_push_log.reg_by       IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN cmh_push_log.reg_date     IS '등록일';
COMMENT ON COLUMN cmh_push_log.upd_by       IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN cmh_push_log.upd_date     IS '수정일';

CREATE INDEX idx_sy_push_log_member ON cmh_push_log (member_id);
CREATE INDEX idx_sy_push_log_date ON cmh_push_log (send_date);
CREATE INDEX idx_sy_push_log_channel ON cmh_push_log (channel_cd, result_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] cmh_push_log.channel_cd (발송채널) : ALARM_CHANNEL { EMAIL:이메일, SMS:SMS, PUSH:푸시알림, KAKAO:카카오 }
-- [CODES] cmh_push_log.result_cd (발송결과) : SEND_RESULT { SUCCESS:성공, FAILED:실패, PENDING:대기 }
