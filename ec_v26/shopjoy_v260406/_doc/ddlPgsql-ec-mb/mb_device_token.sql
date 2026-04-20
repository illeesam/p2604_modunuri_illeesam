-- ============================================================
-- mb_device_token : 앱 디바이스 토큰
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(21)  prefix=DVT
-- ============================================================

CREATE TABLE mb_device_token (
    device_token_id VARCHAR(21)     NOT NULL,               -- 디바이스 토큰 ID
    device_token    VARCHAR(200)    NOT NULL,               -- 디바이스 토큰 값
    site_id         VARCHAR(21)     NOT NULL,               -- sy_site.site_id
    member_id       VARCHAR(21),                            -- mb_member.member_id
    os_type         VARCHAR(10),                            -- ANDROID / IOS
    benefit_noti_yn VARCHAR(1)      DEFAULT 'Y',            -- 혜택 알림 수신 여부
    alim_read_date  TIMESTAMP,                              -- 알림 리스트 읽음 일시
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (device_token_id),
    UNIQUE (device_token, site_id)                         -- 기기+사이트 중복 방지
);

COMMENT ON TABLE mb_device_token IS '앱 디바이스 토큰';
COMMENT ON COLUMN mb_device_token.device_token_id IS '디바이스토큰ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN mb_device_token.device_token    IS '디바이스 토큰 값';
COMMENT ON COLUMN mb_device_token.site_id         IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN mb_device_token.member_id       IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN mb_device_token.os_type         IS 'OS유형 ANDROID/IOS';
COMMENT ON COLUMN mb_device_token.benefit_noti_yn IS '혜택알림수신여부 Y/N';
COMMENT ON COLUMN mb_device_token.alim_read_date  IS '알림리스트 읽음일시';
COMMENT ON COLUMN mb_device_token.reg_by   IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN mb_device_token.reg_date IS '등록일';
COMMENT ON COLUMN mb_device_token.upd_by   IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN mb_device_token.upd_date IS '수정일';

CREATE INDEX idx_mb_device_token_member ON mb_device_token (member_id);
CREATE INDEX idx_mb_device_token_site   ON mb_device_token (site_id);
