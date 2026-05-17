-- mb_device_token 테이블 DDL
-- 앱 디바이스 토큰

CREATE TABLE shopjoy_2604.mb_device_token (
    device_token_id VARCHAR(21)  NOT NULL PRIMARY KEY,
    device_token    VARCHAR(200) NOT NULL,
    site_id         VARCHAR(21)  NOT NULL,
    member_id       VARCHAR(21) ,
    os_type         VARCHAR(10) ,
    benefit_noti_yn VARCHAR(1)   DEFAULT 'Y'::character varying,
    alim_read_date  TIMESTAMP   ,
    reg_date        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_date        TIMESTAMP   ,
    reg_by          VARCHAR(30) ,
    upd_by          VARCHAR(30) 
);

COMMENT ON TABLE  shopjoy_2604.mb_device_token IS '앱 디바이스 토큰';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.device_token IS '디바이스 토큰 키';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.member_id IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.os_type IS 'OS유형 ANDROID/IOS';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.benefit_noti_yn IS '혜택알림수신여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.alim_read_date IS '알림리스트 읽음일시';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.upd_date IS '수정일시';

CREATE INDEX idx_mb_device_token_member ON shopjoy_2604.mb_device_token USING btree (member_id);
CREATE INDEX idx_mb_device_token_site ON shopjoy_2604.mb_device_token USING btree (site_id);
