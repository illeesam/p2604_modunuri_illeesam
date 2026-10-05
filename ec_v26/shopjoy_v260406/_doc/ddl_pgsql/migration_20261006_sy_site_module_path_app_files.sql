-- ============================================================================
-- migration_20261006_sy_site_module_path_app_files.sql — sy_site 모듈 소스 경로 + 앱 파일 경로 5칸 + 서비스 분류·정렬 2칸 (2026-10-06 사용자 요청)
--   service_stage_cd   : 종합서비스관리 포털 칸반 칸(공통코드 SERVICE_STAGE_CD — COMPANY·PREP·WORK·SERVICE·END·ADMIN), NULL = 기본 분류
--   service_sort_ord   : 같은 칸 안의 순서(작을수록 위), NULL = 이름순으로 맨 뒤
--   module_path        : 이 사이트 화면의 소스 폴더(저장소/app/pages/<모듈>) — main1 종합서비스관리 포털 카드에 표시
--   aos_dev_file_path  : 안드로이드 개발 앱 파일(APK) 경로      aos_prod_file_path : 안드로이드 운영 앱 파일 경로
--   ios_dev_file_path  : 아이폰 개발 앱 파일(IPA) 경로          ios_prod_file_path : 아이폰 운영 앱 파일 경로
--   앱 파일 경로 값 = 전체 URL(https://…) 또는 CDN 상대 경로(포털이 CDN 기본 주소를 붙여 다운로드 링크를 만든다). NULL = 파일 없음(포털 다운로드 버튼 비활성).
--   앱 파일 경로는 아직 올려 둔 파일이 없으므로 값은 비워 둔다(파일을 올린 뒤 BO 사이트관리 또는 UPDATE 로 입력).
-- 다시 실행해도 된다(ADD COLUMN IF NOT EXISTS · UPDATE 는 같은 값).
-- 되돌리기: ALTER TABLE shopjoy_2604.sy_site DROP COLUMN module_path, DROP COLUMN aos_dev_file_path, DROP COLUMN aos_prod_file_path, DROP COLUMN ios_dev_file_path, DROP COLUMN ios_prod_file_path, DROP COLUMN service_stage_cd, DROP COLUMN service_sort_ord;
-- ============================================================================

ALTER TABLE shopjoy_2604.sy_site ADD COLUMN IF NOT EXISTS module_path        VARCHAR(200);
ALTER TABLE shopjoy_2604.sy_site ADD COLUMN IF NOT EXISTS aos_dev_file_path  VARCHAR(500);
ALTER TABLE shopjoy_2604.sy_site ADD COLUMN IF NOT EXISTS aos_prod_file_path VARCHAR(500);
ALTER TABLE shopjoy_2604.sy_site ADD COLUMN IF NOT EXISTS ios_dev_file_path  VARCHAR(500);
ALTER TABLE shopjoy_2604.sy_site ADD COLUMN IF NOT EXISTS ios_prod_file_path VARCHAR(500);
ALTER TABLE shopjoy_2604.sy_site ADD COLUMN IF NOT EXISTS service_stage_cd   VARCHAR(20);
ALTER TABLE shopjoy_2604.sy_site ADD COLUMN IF NOT EXISTS service_sort_ord   INTEGER;

COMMENT ON COLUMN shopjoy_2604.sy_site.module_path        IS '모듈 소스 경로 (예 ecFeFoNuxt4/app/pages/datavisual1, ecFeBoNuxt4/app/pages/bom1) — 포털 카드 표시, NULL=없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.aos_dev_file_path  IS '안드로이드 개발 앱 파일 경로 (URL 또는 CDN 상대 경로) — 있으면 포털에서 다운로드, NULL=없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.aos_prod_file_path IS '안드로이드 운영 앱 파일 경로 (URL 또는 CDN 상대 경로) — NULL=없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.ios_dev_file_path  IS '아이폰 개발 앱 파일 경로 (URL 또는 CDN 상대 경로) — NULL=없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.ios_prod_file_path IS '아이폰 운영 앱 파일 경로 (URL 또는 CDN 상대 경로) — NULL=없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.service_stage_cd   IS '서비스 분류 (코드: SERVICE_STAGE_CD — COMPANY/PREP/WORK/SERVICE/END/ADMIN) — 종합서비스관리 포털 칸반 칸, NULL=기본 분류';
COMMENT ON COLUMN shopjoy_2604.sy_site.service_sort_ord   IS '서비스 정렬순서 — 같은 분류 안의 칸반 순서(작을수록 위), NULL=이름순 뒤';

-- 모듈 소스 경로 값 (사용 중인 사이트 9개 — 데모 SI260010~17 은 모듈·소스 없음이라 비워 둔다)
UPDATE shopjoy_2604.sy_site s SET module_path = v.p, upd_date = CURRENT_TIMESTAMP
FROM (VALUES
  ('SI260001', 'ecFeFoNuxt4/app/pages/ec1'),
  ('SI260002', 'ecFeFoNuxt4/app/pages/ec2'),
  ('SI260003', 'ecFeFoNuxt4/app/pages/danmoo1'),
  ('SI260004', 'ecFeFoNuxt4/app/pages/homepg1'),
  ('SI260005', 'ecFeFoNuxt4/app/pages/datavisual1'),
  ('SI260006', 'ecFeFoNuxt4/app/pages/bbm1'),
  ('SI260007', 'ecFeBoNuxt4/app/pages/bo1'),
  ('SI260008', 'ecFeBoNuxt4/app/pages/bom1'),
  ('SI260009', 'ecFeFoNuxt4/app/pages/main1')
) AS v(site_id, p)
WHERE s.site_id = v.site_id;

-- 서비스 분류·정렬 기본값 (현재 포털 분류 그대로 — 관리자용 bo1·bom1 은 ADMIN, 포털 자신(SI260009)은 칸반에 나오지 않는다)
UPDATE shopjoy_2604.sy_site s SET service_stage_cd = v.stg, service_sort_ord = v.ord, upd_date = CURRENT_TIMESTAMP
FROM (VALUES
  ('SI260005', 'PREP', 10),
  ('SI260001', 'WORK', 10),
  ('SI260002', 'WORK', 20),
  ('SI260003', 'WORK', 30),
  ('SI260004', 'WORK', 40),
  ('SI260006', 'WORK', 50),
  ('SI260007', 'ADMIN', 10),
  ('SI260008', 'ADMIN', 20)
) AS v(site_id, stg, ord)
WHERE s.site_id = v.site_id;

-- 확인
SELECT site_id, module_cd, module_path, service_stage_cd, service_sort_ord, aos_dev_file_path, ios_dev_file_path FROM shopjoy_2604.sy_site ORDER BY site_id;
