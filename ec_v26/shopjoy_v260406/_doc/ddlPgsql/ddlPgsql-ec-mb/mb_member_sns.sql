-- ============================================================
CREATE TABLE mb_member_sns (
    member_sns_id   VARCHAR(21)     NOT NULL,
    member_id       VARCHAR(21)     NOT NULL,               -- mb_member.member_id
    sns_channel_cd  VARCHAR(20)     NOT NULL,               -- 코드: SNS_CHANNEL (KAKAO/NAVER/GOOGLE/APPLE)
    sns_user_id     VARCHAR(200)    NOT NULL,               -- SNS 플랫폼 사용자 ID
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (member_sns_id),
    UNIQUE (member_id, sns_channel_cd)
);

COMMENT ON TABLE mb_member_sns IS '회원 SNS 연동';
COMMENT ON COLUMN mb_member_sns.member_sns_id   IS 'SNS연동ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN mb_member_sns.member_id       IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN mb_member_sns.sns_channel_cd  IS 'SNS채널코드 (코드: SNS_CHANNEL)';
COMMENT ON COLUMN mb_member_sns.sns_user_id     IS 'SNS 플랫폼 사용자ID';
COMMENT ON COLUMN mb_member_sns.reg_by          IS '등록자ID';
COMMENT ON COLUMN mb_member_sns.reg_date        IS '등록일시';
COMMENT ON COLUMN mb_member_sns.upd_by          IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN mb_member_sns.upd_date        IS '수정일';

CREATE INDEX idx_mb_member_sns_member  ON mb_member_sns (member_id);
CREATE INDEX idx_mb_member_sns_channel ON mb_member_sns (sns_channel_cd);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] mb_member_sns.sns_channel_cd (SNS채널코드) : SNS_CHANNEL { KAKAO:카카오, NAVER:네이버, GOOGLE:구글, APPLE:애플 }
