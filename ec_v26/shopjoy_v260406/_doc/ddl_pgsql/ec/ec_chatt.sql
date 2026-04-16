-- ============================================================
-- ec_chatt : 채팅방 (고객 1:1 상담)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================
CREATE TABLE ec_chatt (
    chatt_id        VARCHAR(16)     NOT NULL,
    site_id         VARCHAR(16),                            -- sy_site.site_id
    member_id       VARCHAR(16)     NOT NULL,
    member_nm       VARCHAR(50),
    admin_user_id   VARCHAR(16),                            -- 담당 관리자 (sy_user.user_id)
    subject         VARCHAR(200),                           -- 채팅 주제
    chatt_status_cd VARCHAR(20)     DEFAULT 'PENDING',      -- 코드: CHATT_STATUS (PENDING/ONGOING/CLOSED)
    chatt_status_cd_before VARCHAR(20),                     -- 변경 전 채팅상태
    last_msg_date   TIMESTAMP,                              -- 마지막 메시지 일시
    member_unread_cnt  INTEGER       DEFAULT 0,              -- 고객 미읽 개수
    admin_unread_cnt   INTEGER       DEFAULT 0,              -- 관리자 미읽 개수
    chatt_memo      TEXT,
    close_date      TIMESTAMP,
    close_reason    VARCHAR(200),
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(16),
    upd_date        TIMESTAMP,
    PRIMARY KEY (chatt_id)
);

COMMENT ON TABLE  ec_chatt                      IS '고객 1:1 채팅 상담';
COMMENT ON COLUMN ec_chatt.chatt_id             IS '채팅방ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN ec_chatt.site_id              IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN ec_chatt.member_id            IS '회원ID (고객)';
COMMENT ON COLUMN ec_chatt.member_nm            IS '회원명';
COMMENT ON COLUMN ec_chatt.admin_user_id        IS '담당관리자 (sy_user.user_id)';
COMMENT ON COLUMN ec_chatt.subject              IS '채팅주제';
COMMENT ON COLUMN ec_chatt.chatt_status_cd      IS '상태 (코드: CHATT_STATUS)';
COMMENT ON COLUMN ec_chatt.chatt_status_cd_before IS '변경 전 채팅상태 (코드: CHATT_STATUS)';
COMMENT ON COLUMN ec_chatt.last_msg_date        IS '마지막 메시지 일시';
COMMENT ON COLUMN ec_chatt.member_unread_cnt    IS '고객 미읽메시지 수';
COMMENT ON COLUMN ec_chatt.admin_unread_cnt     IS '관리자 미읽메시지 수';
COMMENT ON COLUMN ec_chatt.chatt_memo           IS '메모';
COMMENT ON COLUMN ec_chatt.close_date           IS '종료일시';
COMMENT ON COLUMN ec_chatt.close_reason         IS '종료사유';
COMMENT ON COLUMN ec_chatt.reg_by               IS '등록자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN ec_chatt.reg_date             IS '등록일';
COMMENT ON COLUMN ec_chatt.upd_by               IS '수정자 (sy_user.user_id, ec_member.member_id)';
COMMENT ON COLUMN ec_chatt.upd_date             IS '수정일';

CREATE INDEX idx_ec_chatt_member ON ec_chatt (member_id);
CREATE INDEX idx_ec_chatt_admin ON ec_chatt (admin_user_id);
CREATE INDEX idx_ec_chatt_status ON ec_chatt (chatt_status_cd);
