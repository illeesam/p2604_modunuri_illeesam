-- ═══════════════════════════════════════════════════════════
--  알림(FO 종 아이콘·앱 푸시 FCM) — sy_noti 사이트/모듈 + mb_device_token 수신 모듈·앱 정보 + alim→noti 용어 보정 + ap_app_version(앱 버전 이력)
--  작성일: 2026-10-04
--
--  배경:
--   사용자 요청 "로그인회원의 (siteId + (옵션: 모듈목록, 없으면 사이트전체)) + memberId 에 대해 메시지 오면 아이콘에 수신메시지 수 표시".
--   알림함(sy_noti: 수신자 1명 = 1행)에는 사이트·모듈이 없어 FO 종 아이콘이 사이트를 가리지 않고 셌다.
--    - sy_noti.site_id        : 알림이 속한 사이트(회원 알림이면 그 회원의 사이트). FO 는 요청 사이트의 알림만 센다.
--    - sy_noti.tenant_modules : 대상 모듈 목록(콤마 구분, 예 "ec1,ec2"). NULL/빈값 = 사이트 전체.
--    - mb_device_token.tenant_modules : 이 기기(앱)가 받을 모듈 목록. 앱 빌드(.env TENANT_MODULES) 값이고, 개발에서는 App설정 화면에서 잠시 바꿀 수 있다.
--    - mb_device_token.app_version / device_model : App설정·운영 확인용.
--   용어 보정(사용자 "alarm/alim 섞임 보정 … 앱푸시 표준 용어로"): 앱 푸시 표준 용어는 notification(줄여 noti) 이다
--   (Android 의 alarm 은 예약 타이머 AlarmManager 라 푸시 용어가 아니다). "alim" 은 mb_device_token.alim_read_date 컬럼 하나뿐(0건)이라
--   noti_read_date 로 바꾼다. 기존 sy_alarm·syh_alarm_send_hist 의 noti 계열 이름 변경은 사이트 정비 브랜치 반영 뒤 별도로 한다.
--   앱 디바이스 토큰은 같은 토큰이 두 행이 되지 않게 device_token 유일.
-- ═══════════════════════════════════════════════════════════
--  사용법: 아래 스크립트 실행 (재실행해도 안전)
-- ═══════════════════════════════════════════════════════════

SET search_path TO shopjoy_2604;

-- 1) sy_noti — 사이트·대상 모듈
ALTER TABLE shopjoy_2604.sy_noti ADD COLUMN IF NOT EXISTS site_id VARCHAR(21);
ALTER TABLE shopjoy_2604.sy_noti ADD COLUMN IF NOT EXISTS tenant_modules VARCHAR(200);
COMMENT ON COLUMN shopjoy_2604.sy_noti.site_id IS '사이트ID (sy_site.site_id) - 알림이 속한 사이트(회원 알림=그 회원의 사이트)';
COMMENT ON COLUMN shopjoy_2604.sy_noti.tenant_modules IS '대상 FO 모듈 목록(콤마 구분, 예 ec1,ec2) - NULL/빈값=사이트 전체';

-- 기존 회원 알림은 그 회원의 사이트로 채운다(사용자 알림은 사이트 없음 = BO 공통)
UPDATE shopjoy_2604.sy_noti n
   SET site_id = m.site_id
  FROM shopjoy_2604.mb_member m
 WHERE n.recv_type_cd = 'MEMBER' AND n.recv_id = m.member_id AND n.site_id IS NULL;

CREATE INDEX IF NOT EXISTS sy_noti_ix_recv ON shopjoy_2604.sy_noti (recv_type_cd, recv_id, site_id, read_yn);

-- 2) mb_device_token — 수신 모듈·앱 정보, alim → noti 용어 보정, 토큰 유일
ALTER TABLE shopjoy_2604.mb_device_token ADD COLUMN IF NOT EXISTS tenant_modules VARCHAR(200);
ALTER TABLE shopjoy_2604.mb_device_token ADD COLUMN IF NOT EXISTS app_version VARCHAR(50);
ALTER TABLE shopjoy_2604.mb_device_token ADD COLUMN IF NOT EXISTS device_model VARCHAR(100);
COMMENT ON COLUMN shopjoy_2604.mb_device_token.tenant_modules IS '알림 수신 FO 모듈 목록(콤마 구분) - NULL/빈값=사이트 전체. 앱 빌드 값(개발에선 App설정에서 임시 변경)';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.app_version IS '앱 버전 (예 1.0.0+1)';
COMMENT ON COLUMN shopjoy_2604.mb_device_token.device_model IS '기기 모델 (예 Pixel 7)';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'shopjoy_2604' AND table_name = 'mb_device_token' AND column_name = 'alim_read_date') THEN
    ALTER TABLE shopjoy_2604.mb_device_token RENAME COLUMN alim_read_date TO noti_read_date;
  END IF;
END $$;
COMMENT ON COLUMN shopjoy_2604.mb_device_token.noti_read_date IS '알림(noti) 목록 읽음일시';

CREATE UNIQUE INDEX IF NOT EXISTS mb_device_token_uk01 ON shopjoy_2604.mb_device_token (device_token);
CREATE INDEX IF NOT EXISTS mb_device_token_ix01 ON shopjoy_2604.mb_device_token (member_id, site_id);

-- 3) ap_app_version — 모바일 앱(ecAppFlutter) 버전·배포 이력 (사용자 "ap_ 기준 앱과 관련 테이블 필요하면 추가")
--    앱 빌드(Jenkins ecAppFlutter-aos/ios)가 끝나면 POST /api/co/ap/app-version/release(공유키 AP_RELEASE_KEY)로 1행 등록 →
--    App설정 화면의 "최신 버전"이 (환경 + 플랫폼 + 사이트) 기준 가장 최근 행. 행이 없으면 sy_prop app.fo-app.* 로 대신한다.
CREATE TABLE IF NOT EXISTS shopjoy_2604.ap_app_version (
    app_version_id  VARCHAR(21)  NOT NULL,
    site_id         VARCHAR(21),
    app_env         VARCHAR(10)  NOT NULL,
    platform_cd     VARCHAR(10)  NOT NULL,
    version_name    VARCHAR(30)  NOT NULL,
    build_number    INTEGER,
    tenant_modules  VARCHAR(200),
    package_name    VARCHAR(100),
    build_time      TIMESTAMP,
    release_date    TIMESTAMP,
    download_url    VARCHAR(500),
    release_note    TEXT,
    force_update_yn VARCHAR(1),
    use_yn          VARCHAR(1),
    reg_by          VARCHAR(21),
    reg_date        TIMESTAMP,
    upd_by          VARCHAR(21),
    upd_date        TIMESTAMP,
    reg_site_id     VARCHAR(21),
    CONSTRAINT ap_app_version_pkey PRIMARY KEY (app_version_id)
);
COMMENT ON TABLE  shopjoy_2604.ap_app_version IS '앱 버전·배포 이력 (모바일 앱 빌드 1건 = 1행)';
COMMENT ON COLUMN shopjoy_2604.ap_app_version.app_version_id IS '앱버전ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.ap_app_version.site_id IS '사이트ID (sy_site.site_id) - 앱 아이콘(빌드) 속성의 사이트';
COMMENT ON COLUMN shopjoy_2604.ap_app_version.app_env IS '앱 환경 dev/prod';
COMMENT ON COLUMN shopjoy_2604.ap_app_version.platform_cd IS '플랫폼 ANDROID/IOS';
COMMENT ON COLUMN shopjoy_2604.ap_app_version.version_name IS '버전 이름 (pubspec version 앞부분, 예 1.0.1)';
COMMENT ON COLUMN shopjoy_2604.ap_app_version.build_number IS '빌드 번호 (pubspec version + 뒤, 예 2)';
COMMENT ON COLUMN shopjoy_2604.ap_app_version.tenant_modules IS '앱 아이콘(빌드) 속성의 FO 모듈 목록(콤마)';
COMMENT ON COLUMN shopjoy_2604.ap_app_version.package_name IS '패키지명 (com.illeesam.shopjoy_fo_app[.dev])';
COMMENT ON COLUMN shopjoy_2604.ap_app_version.build_time IS '앱 생성(빌드)일시';
COMMENT ON COLUMN shopjoy_2604.ap_app_version.release_date IS '배포(등록)일시';
COMMENT ON COLUMN shopjoy_2604.ap_app_version.download_url IS '설치 파일/스토어 주소';
COMMENT ON COLUMN shopjoy_2604.ap_app_version.release_note IS '변경 내용';
COMMENT ON COLUMN shopjoy_2604.ap_app_version.force_update_yn IS '강제 업데이트 여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.ap_app_version.use_yn IS '사용 여부 Y/N (N 이면 최신 버전 계산에서 뺀다)';
CREATE INDEX IF NOT EXISTS ap_app_version_ix01 ON shopjoy_2604.ap_app_version (app_env, platform_cd, site_id, use_yn);
CREATE UNIQUE INDEX IF NOT EXISTS ap_app_version_uk01 ON shopjoy_2604.ap_app_version (app_env, platform_cd, site_id, version_name, build_number);

-- ═══════════════════════════════════════════════════════════
--  검증
-- ═══════════════════════════════════════════════════════════
-- SELECT column_name FROM information_schema.columns WHERE table_schema='shopjoy_2604' AND table_name IN ('sy_noti','mb_device_token') ORDER BY table_name, ordinal_position;
--   → sy_noti: site_id, tenant_modules / mb_device_token: tenant_modules, app_version, device_model, noti_read_date (alim_read_date 없음)
-- SELECT count(*) FROM shopjoy_2604.sy_noti WHERE recv_type_cd='MEMBER' AND site_id IS NULL;   → 0
-- SELECT count(*) FROM shopjoy_2604.ap_app_version;   → 0 (앱 빌드가 등록하면 늘어남)
