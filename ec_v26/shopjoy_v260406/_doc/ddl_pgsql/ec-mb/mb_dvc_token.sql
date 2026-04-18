-- ============================================================
-- log 예외: 단일 단어 컬럼 허용 (device_token, os_type, site_id 예외)
CREATE TABLE mb_dvc_token (
    device_token    VARCHAR(200)    NOT NULL,               -- 앱 디바이스 토큰 값
    site_id         VARCHAR(16)     NOT NULL,               -- sy_site.site_id
    member_id       VARCHAR(16),                            -- mb_mem.member_id
    os_type         VARCHAR(10),                            -- ANDROID / IOS
    benefit_noti_yn VARCHAR(1)      DEFAULT 'Y',            -- 혜택 알림 수신 여부
    alim_read_date  TIMESTAMP,                              -- 알림 리스트 읽음 일시
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_date        TIMESTAMP,
    PRIMARY KEY (device_token, site_id)
);

COMMENT ON TABLE mb_dvc_token IS '앱 디바이스 토큰';
COMMENT ON COLUMN mb_dvc_token.device_token    IS '디바이스 토큰 키';
COMMENT ON COLUMN mb_dvc_token.site_id         IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN mb_dvc_token.member_id       IS '회원ID (mb_mem.member_id)';
COMMENT ON COLUMN mb_dvc_token.os_type         IS 'OS유형 ANDROID/IOS';
COMMENT ON COLUMN mb_dvc_token.benefit_noti_yn IS '혜택알림수신여부 Y/N';
COMMENT ON COLUMN mb_dvc_token.alim_read_date  IS '알림리스트 읽음일시';
COMMENT ON COLUMN mb_dvc_token.reg_date        IS '등록일시';
COMMENT ON COLUMN mb_dvc_token.upd_date        IS '수정일시';

CREATE INDEX idx_mb_dvc_token_member ON mb_dvc_token (member_id);
CREATE INDEX idx_mb_dvc_token_site   ON mb_dvc_token (site_id);
