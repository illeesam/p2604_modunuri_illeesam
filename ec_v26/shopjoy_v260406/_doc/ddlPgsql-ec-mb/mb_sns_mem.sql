-- ============================================================
CREATE TABLE mb_sns_mem (
    sns_mem_id      VARCHAR(16)     NOT NULL,
    member_id       VARCHAR(16)     NOT NULL,               -- mb_mem.member_id
    sns_channel_cd  VARCHAR(20)     NOT NULL,               -- 코드: SNS_CHANNEL (KAKAO/NAVER/GOOGLE/APPLE)
    sns_user_id     VARCHAR(200)    NOT NULL,               -- SNS 플랫폼 사용자 ID
    reg_by          VARCHAR(16),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (sns_mem_id),
    UNIQUE (member_id, sns_channel_cd)
);

COMMENT ON TABLE mb_sns_mem IS '회원 SNS 연동';
COMMENT ON COLUMN mb_sns_mem.sns_mem_id    IS 'SNS연동ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN mb_sns_mem.member_id     IS '회원ID (mb_mem.member_id)';
COMMENT ON COLUMN mb_sns_mem.sns_channel_cd IS 'SNS채널코드 (코드: SNS_CHANNEL)';
COMMENT ON COLUMN mb_sns_mem.sns_user_id   IS 'SNS 플랫폼 사용자ID';
COMMENT ON COLUMN mb_sns_mem.reg_by        IS '등록자ID';
COMMENT ON COLUMN mb_sns_mem.reg_date      IS '등록일시';

CREATE INDEX idx_mb_sns_mem_member  ON mb_sns_mem (member_id);
CREATE INDEX idx_mb_sns_mem_channel ON mb_sns_mem (sns_channel_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- mb_sns_mem.sns_channel_cd (SNS채널코드) : SNS_CHANNEL(SNS_CHANNEL) { 코드값 미정의 }
