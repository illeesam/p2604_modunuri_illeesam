-- mb_member_sns 테이블 DDL
-- 회원 SNS 연동

CREATE TABLE shopjoy_2604.mb_member_sns (
    member_sns_id  VARCHAR(21)  NOT NULL PRIMARY KEY,
    member_id      VARCHAR(21)  NOT NULL,
    sns_channel_cd VARCHAR(20)  NOT NULL,
    sns_user_id    VARCHAR(200) NOT NULL,
    reg_by         VARCHAR(30) ,
    reg_date       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by         VARCHAR(30) ,
    upd_date       TIMESTAMP   ,
    site_id        VARCHAR(21)  NOT NULL
);

COMMENT ON TABLE  shopjoy_2604.mb_member_sns IS '회원 SNS 연동';
COMMENT ON COLUMN shopjoy_2604.mb_member_sns.member_sns_id IS 'SNS연동ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.mb_member_sns.member_id IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.mb_member_sns.sns_channel_cd IS 'SNS채널코드 (코드: SNS_CHANNEL)';
COMMENT ON COLUMN shopjoy_2604.mb_member_sns.sns_user_id IS 'SNS 플랫폼 사용자ID';
COMMENT ON COLUMN shopjoy_2604.mb_member_sns.reg_by IS '등록자ID';
COMMENT ON COLUMN shopjoy_2604.mb_member_sns.reg_date IS '등록일시';

CREATE INDEX idx_mb_member_sns_channel ON shopjoy_2604.mb_member_sns USING btree (sns_channel_cd);
CREATE INDEX idx_mb_member_sns_member ON shopjoy_2604.mb_member_sns USING btree (member_id);
CREATE INDEX idx_mb_member_sns_site ON shopjoy_2604.mb_member_sns USING btree (site_id);
CREATE UNIQUE INDEX mb_sns_member_member_id_sns_channel_cd_key ON shopjoy_2604.mb_member_sns USING btree (member_id, sns_channel_cd);
