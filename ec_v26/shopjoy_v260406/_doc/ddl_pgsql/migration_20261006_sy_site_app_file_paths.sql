-- ============================================================================
-- migration_20261006_sy_site_app_file_paths.sql — 앱 설치 파일(APK) 경로 입력 (2026-10-06 사용자 요청)
--   파일 서버(ecBeCdn, NAS 개발)의 cdn/_common/app/ 에 올린 안드로이드 APK(arm64) 10개의 경로를 sy_site 에 넣는다.
--   값 = CDN 상대 경로(cdn/…) — main1 포털이 CDN 기본 주소(https://22400.illeesam.synology.me/api/)를 붙여 다운로드 링크를 만든다.
--   예) https://22400.illeesam.synology.me/api/cdn/_common/app/shopjoy-SI260003-danmoo1-dev-1.0.0.202610041848-5e92717-arm64.apk
--   원본 빌드: ecAppFlutter/out/ (2026-10-04 빌드). 운영(prod) 칸 = 프로파일 표시 없는 빌드, 개발(dev) 칸 = -dev- 빌드.
--   아이폰(ios_*) 파일은 macOS 빌드가 필요해 아직 없다 → NULL 유지. ec2(SI260002)는 운영 빌드가 없어 prod 칸 NULL.
--   앞 선행: migration_20261006_sy_site_module_path_app_files.sql (칸 추가)
-- 다시 실행해도 된다(같은 값). 되돌리기: UPDATE … SET aos_dev_file_path = NULL, aos_prod_file_path = NULL
-- ============================================================================
UPDATE shopjoy_2604.sy_site s SET aos_dev_file_path = v.dev, aos_prod_file_path = v.prod, upd_date = CURRENT_TIMESTAMP
FROM (VALUES
  ('SI260001', 'cdn/_common/app/shopjoy-SI260001-ec1-dev-1.0.0.202610041848-5e92717-arm64.apk',         'cdn/_common/app/shopjoy-SI260001-ec1-1.0.0.202610041719-ad9dc78-arm64.apk'),
  ('SI260002', 'cdn/_common/app/shopjoy-SI260002-ec2-dev-1.0.0.202610041848-5e92717-arm64.apk',         NULL),
  ('SI260003', 'cdn/_common/app/shopjoy-SI260003-danmoo1-dev-1.0.0.202610041848-5e92717-arm64.apk',     'cdn/_common/app/shopjoy-SI260003-danmoo1-1.0.0.202610041642-e4be35c-arm64.apk'),
  ('SI260004', 'cdn/_common/app/shopjoy-SI260004-homepg1-dev-1.0.0.202610041848-5e92717-arm64.apk',     'cdn/_common/app/shopjoy-SI260004-homepg1-1.0.0.202610041642-e4be35c-arm64.apk'),
  ('SI260005', 'cdn/_common/app/shopjoy-SI260005-datavisual1-dev-1.0.0.202610041848-5e92717-arm64.apk', 'cdn/_common/app/shopjoy-SI260005-datavisual1-1.0.0.202610041642-e4be35c-arm64.apk'),
  ('SI260006', 'cdn/_common/app/shopjoy-SI260006-bbm1-dev-1.0.0.202610041848-5e92717-arm64.apk',        NULL)
) AS v(site_id, dev, prod)
WHERE s.site_id = v.site_id;

-- 확인
SELECT site_id, module_cd, aos_dev_file_path, aos_prod_file_path FROM shopjoy_2604.sy_site WHERE aos_dev_file_path IS NOT NULL OR aos_prod_file_path IS NOT NULL ORDER BY site_id;
