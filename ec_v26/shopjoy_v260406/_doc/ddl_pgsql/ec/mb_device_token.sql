-- mb_device_token 테이블 DDL
-- 앱 디바이스 토큰
-- 2026-10-04 용어 보정 alim→noti(alim_read_date → noti_read_date) + 수신 모듈·앱 정보·토큰 유일 (migration_20261004_noti_fcm_push.sql)
-- 2026-10-05 BO 모바일 앱 기기 — user_id(sy_user) 칸, 한 기기 = 한 주인(회원 또는 사용자) (migration_20261005_bo_user_push.sql)

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
    device_model    VARCHAR(100),
    user_id         VARCHAR(21) ,
    CONSTRAINT mb_device_token_fk_user_id FOREIGN KEY (user_id) REFERENCES shopjoy_2604.sy_user (user_id) ON DELETE SET NULL,
    CONSTRAINT mb_device_token_ck_owner CHECK (member_id IS NULL OR user_id IS NULL)
);

COMMENT ON TABLE  shopjoy_2604.mb_device_token IS '앱 디바이스 토큰 (회원 앱 = member_id, BO 모바일 앱 = user_id)';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.device_token IS '디바이스 토큰 키';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.reg_site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.member_id IS '회원ID (mb_member.member_id) - 회원 앱 기기(BO 모바일 앱 기기면 NULL)';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.user_id IS 'BO 사용자ID (sy_user.user_id) - BO 모바일 앱 기기(회원 앱 기기면 NULL). member_id 와 함께 값이 있지 않다';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.os_type_cd IS 'OS유형 ANDROID/IOS';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.benefit_noti_yn IS '혜택알림수신여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.noti_read_date IS '알림(noti) 목록 읽음일시';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.upd_date IS '수정일시';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.site_id IS '사이트ID (sy_site.site_id) - 업무 소속 사이트';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.tenant_modules IS '알림 수신 모듈 목록(콤마 구분) - 회원 앱: FO 모듈(NULL/빈값=사이트 전체) / BO 앱: 앱이 여는 BO 모듈(bom1)';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.app_version IS '앱 버전 (예 1.0.0+1)';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.device_model IS '기기 모델 (예 Pixel 7)';

CREATE INDEX mb_device_token_ix01_member_id ON shopjoy_2604.mb_device_token USING btree (member_id);
CREATE UNIQUE INDEX mb_device_token_uk01 ON shopjoy_2604.mb_device_token (device_token);
CREATE INDEX mb_device_token_ix01 ON shopjoy_2604.mb_device_token (member_id, site_id);
CREATE INDEX mb_device_token_ix_user_id ON shopjoy_2604.mb_device_token (user_id) WHERE user_id IS NOT NULL;
