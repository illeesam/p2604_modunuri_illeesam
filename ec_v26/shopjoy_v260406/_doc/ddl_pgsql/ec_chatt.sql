-- ============================================================
-- ec_chatt : 채팅방 / ec_chatt_msg : 채팅 메시지
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE ec_chatt (
    chatt_id        VARCHAR(16)     NOT NULL,
    member_id       VARCHAR(16)     NOT NULL,
    member_name     VARCHAR(50),
    subject         VARCHAR(200),
    last_msg        VARCHAR(500),
    last_msg_date   TIMESTAMP,
    status_cd       VARCHAR(20)     DEFAULT 'OPEN',         -- 코드: CHATT_STATUS (OPEN/CLOSED)
    unread_count    INTEGER         DEFAULT 0,
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_date        TIMESTAMP,
    PRIMARY KEY (chatt_id)
);

COMMENT ON TABLE  ec_chatt               IS '채팅방';
COMMENT ON COLUMN ec_chatt.chatt_id      IS '채팅방ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_chatt.member_id     IS '회원ID';
COMMENT ON COLUMN ec_chatt.member_name   IS '회원명';
COMMENT ON COLUMN ec_chatt.subject       IS '채팅주제';
COMMENT ON COLUMN ec_chatt.last_msg      IS '마지막메시지';
COMMENT ON COLUMN ec_chatt.last_msg_date IS '마지막메시지일시';
COMMENT ON COLUMN ec_chatt.status_cd     IS '상태 (코드: CHATT_STATUS)';
COMMENT ON COLUMN ec_chatt.unread_count  IS '미확인 메시지수';
COMMENT ON COLUMN ec_chatt.reg_date      IS '등록일';
COMMENT ON COLUMN ec_chatt.upd_date      IS '수정일';

-- 채팅 메시지
CREATE TABLE ec_chatt_msg (
    msg_id          VARCHAR(16)     NOT NULL,
    chatt_id        VARCHAR(16)     NOT NULL,
    sender          VARCHAR(20)     NOT NULL,               -- MEMBER / ADMIN
    msg_text        TEXT,
    ref_type        VARCHAR(20),                            -- ORDER / PRODUCT / CLAIM
    ref_id          VARCHAR(16),
    send_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    read_yn         CHAR(1)         DEFAULT 'N',
    PRIMARY KEY (msg_id)
);

COMMENT ON TABLE  ec_chatt_msg           IS '채팅 메시지';
COMMENT ON COLUMN ec_chatt_msg.msg_id    IS '메시지ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_chatt_msg.chatt_id  IS '채팅방ID';
COMMENT ON COLUMN ec_chatt_msg.sender    IS '발신자유형 (MEMBER/ADMIN)';
COMMENT ON COLUMN ec_chatt_msg.msg_text  IS '메시지내용';
COMMENT ON COLUMN ec_chatt_msg.ref_type  IS '참조유형 (ORDER/PRODUCT/CLAIM)';
COMMENT ON COLUMN ec_chatt_msg.ref_id    IS '참조ID';
COMMENT ON COLUMN ec_chatt_msg.send_date IS '발송일시';
COMMENT ON COLUMN ec_chatt_msg.read_yn   IS '읽음여부 Y/N';
