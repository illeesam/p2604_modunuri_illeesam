-- mb_device_token 테이블 DDL
-- 앱 디바이스 토큰
-- 2026-10-04 용어 보정 alim→noti(alim_read_date → noti_read_date) + 수신 모듈·앱 정보·토큰 유일 (migration_20261004_noti_fcm_push.sql)

CREATE TABLE shopjoy_2604.mb_device_token (
    device_token_id VARCHAR(21)  NOT NULL CONSTRAINT mb_device_token_pk_device_token_id PRIMARY KEY,
    device_token    VARCHAR(200) NOT NULL,
    reg_site_id         VARCHAR(21)  NOT NULL,
    member_id       VARCHAR(21) ,
    os_type_cd         VARCHAR(10) ,
    benefit_noti_yn VARCHAR(1)   DEFAULT 'Y'::character varying,
    noti_read_date  TIMESTAMP   ,
    reg_date        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_date        TIMESTAMP   ,
    reg_by          VARCHAR(30) ,
    upd_by          VARCHAR(30) ,
    site_id         VARCHAR(21)  NOT NULL DEFAULT 'SI260001'::character varying,
    tenant_modules  VARCHAR(200),
    app_version     VARCHAR(50) ,
    device_model    VARCHAR(100)
);

COMMENT ON TABLE  shopjoy_2604.mb_device_token IS '앱 디바이스 토큰';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.device_token IS '디바이스 토큰 키';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.reg_site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.member_id IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.os_type_cd IS 'OS유형 ANDROID/IOS';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.benefit_noti_yn IS '혜택알림수신여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.noti_read_date IS '알림(noti) 목록 읽음일시';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.upd_date IS '수정일시';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.site_id IS '사이트ID (sy_site.site_id) - 업무 소속 사이트';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.tenant_modules IS '알림 수신 FO 모듈 목록(콤마 구분) - NULL/빈값=사이트 전체. 앱 빌드 값(개발에선 App설정에서 임시 변경)';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.app_version IS '앱 버전 (예 1.0.0+1)';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.device_model IS '기기 모델 (예 Pixel 7)';

CREATE INDEX mb_device_token_ix01_member_id ON shopjoy_2604.mb_device_token USING btree (member_id);
CREATE UNIQUE INDEX mb_device_token_uk01 ON shopjoy_2604.mb_device_token (device_token);
CREATE INDEX mb_device_token_ix01 ON shopjoy_2604.mb_device_token (member_id, site_id);
