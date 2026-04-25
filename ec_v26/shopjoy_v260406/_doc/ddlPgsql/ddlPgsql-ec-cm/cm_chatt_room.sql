-- ============================================================
-- ec_chatt : 채팅방 (고객 1:1 상담)
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE cm_chatt_room (
    chatt_room_id        VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    member_id       VARCHAR(21)     NOT NULL,
    member_nm       VARCHAR(50),
    admin_user_id   VARCHAR(21),                            -- 담당 관리자 (sy_user.user_id)
    subject         VARCHAR(200),                           -- 채팅 주제
    chatt_status_cd VARCHAR(20)     DEFAULT 'PENDING',      -- 코드: CHATT_STATUS (PENDING/ONGOING/CLOSED)
    chatt_status_cd_before VARCHAR(20),                     -- 변경 전 채팅상태
    last_msg_date   TIMESTAMP,                              -- 마지막 메시지 일시
    member_unread_cnt  INTEGER       DEFAULT 0,              -- 고객 미읽 개수
    admin_unread_cnt   INTEGER       DEFAULT 0,              -- 관리자 미읽 개수
    chatt_memo      TEXT,
    close_date      TIMESTAMP,
    close_reason    VARCHAR(200),
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (chatt_room_id)
);

COMMENT ON TABLE cm_chatt_room IS '고객 1:1 채팅 상담';
COMMENT ON COLUMN cm_chatt_room.chatt_room_id IS '채팅방ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN cm_chatt_room.site_id              IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN cm_chatt_room.member_id            IS '회원ID (고객)';
COMMENT ON COLUMN cm_chatt_room.member_nm            IS '회원명';
COMMENT ON COLUMN cm_chatt_room.admin_user_id        IS '담당관리자 (sy_user.user_id)';
COMMENT ON COLUMN cm_chatt_room.subject              IS '채팅주제';
COMMENT ON COLUMN cm_chatt_room.chatt_status_cd      IS '상태 (코드: CHATT_STATUS)';
COMMENT ON COLUMN cm_chatt_room.chatt_status_cd_before IS '변경 전 채팅상태 (코드: CHATT_STATUS)';
COMMENT ON COLUMN cm_chatt_room.last_msg_date        IS '마지막 메시지 일시';
COMMENT ON COLUMN cm_chatt_room.member_unread_cnt    IS '고객 미읽메시지 수';
COMMENT ON COLUMN cm_chatt_room.admin_unread_cnt     IS '관리자 미읽메시지 수';
COMMENT ON COLUMN cm_chatt_room.chatt_memo           IS '메모';
COMMENT ON COLUMN cm_chatt_room.close_date           IS '종료일시';
COMMENT ON COLUMN cm_chatt_room.close_reason         IS '종료사유';
COMMENT ON COLUMN cm_chatt_room.reg_by               IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN cm_chatt_room.reg_date             IS '등록일';
COMMENT ON COLUMN cm_chatt_room.upd_by               IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN cm_chatt_room.upd_date             IS '수정일';

CREATE INDEX idx_od_chatt_member ON cm_chatt_room (member_id);
CREATE INDEX idx_od_chatt_admin ON cm_chatt_room (admin_user_id);
CREATE INDEX idx_od_chatt_status ON cm_chatt_room (chatt_status_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] cm_chatt_room.chatt_status_cd (상태) : 채팅상태 { WAITING:대기, ACTIVE:진행중, DONE:완료 }
