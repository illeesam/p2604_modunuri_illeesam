-- ============================================================
CREATE TABLE mb_sns_member (
    sns_mem_id      VARCHAR(21)     NOT NULL,
    member_id       VARCHAR(21)     NOT NULL,               -- mb_member.member_id
    sns_channel_cd  VARCHAR(20)     NOT NULL,               -- 코드: SNS_CHANNEL (KAKAO/NAVER/GOOGLE/APPLE)
    sns_user_id     VARCHAR(200)    NOT NULL,               -- SNS 플랫폼 사용자 ID
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (sns_mem_id),
    UNIQUE (member_id, sns_channel_cd)
);

COMMENT ON TABLE mb_sns_member IS '회원 SNS 연동';
COMMENT ON COLUMN mb_sns_member.sns_mem_id    IS 'SNS연동ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN mb_sns_member.member_id     IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN mb_sns_member.sns_channel_cd IS 'SNS채널코드 (코드: SNS_CHANNEL)';
COMMENT ON COLUMN mb_sns_member.sns_user_id   IS 'SNS 플랫폼 사용자ID';
COMMENT ON COLUMN mb_sns_member.reg_by        IS '등록자ID';
COMMENT ON COLUMN mb_sns_member.reg_date      IS '등록일시';
COMMENT ON COLUMN mb_sns_member.upd_by   IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN mb_sns_member.upd_date IS '수정일';

CREATE INDEX idx_mb_sns_member_member  ON mb_sns_member (member_id);
CREATE INDEX idx_mb_sns_member_channel ON mb_sns_member (sns_channel_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] mb_sns_member.sns_channel_cd (SNS채널코드) : SNS_CHANNEL { KAKAO:카카오, NAVER:네이버, GOOGLE:구글, APPLE:애플 }
