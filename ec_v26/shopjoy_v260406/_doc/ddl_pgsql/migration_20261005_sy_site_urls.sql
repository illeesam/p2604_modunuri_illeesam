-- ============================================================================
-- migration_20261005_sy_site_urls.sql — sy_site 접속 주소 12칸 (2026-10-05 사용자 요청)
--   환경(local 내 PC / dev 개발 서버 NAS / prod 운영 Netlify) × 접속 방식(http · https · aos 안드로이드 앱 · ios 아이폰 앱)
--   http·https = 브라우저로 여는 화면 주소, aos·ios = 그 환경의 앱(ecAppFlutter)이 여는 화면 주소(앱 테넌트 foUrl)
--   NULL = 그 환경·방식으로는 열 수 없음(예: 내 PC https 없음, 앱이 없는 사이트, 운영 미배포)
--   main1(종합서비스관리 포털) 메뉴가 이 값으로 각 서비스 링크를 만든다.
--   값의 원본: ecFeFoNuxt4·ecFeBoNuxt4 tenant/SI26/*.jsonc 의 url·deploy, ecAppFlutter tenant/SI26/*.jsonc 의 foUrl
--   (2026-10-05 실측: NAS https 주소는 22100 만 있고 22001~22012 는 http 만 열린다)
-- 다시 실행해도 된다(ADD COLUMN IF NOT EXISTS · UPDATE 는 같은 값).
-- 되돌리기: ALTER TABLE shopjoy_2604.sy_site DROP COLUMN url_local_http, … (12칸)
-- ============================================================================

-- ── 1. 칸 추가 ───────────────────────────────────────────────────────────────
ALTER TABLE shopjoy_2604.sy_site ADD COLUMN IF NOT EXISTS url_local_http  VARCHAR(500);
ALTER TABLE shopjoy_2604.sy_site ADD COLUMN IF NOT EXISTS url_local_https VARCHAR(500);
ALTER TABLE shopjoy_2604.sy_site ADD COLUMN IF NOT EXISTS url_local_aos   VARCHAR(500);
ALTER TABLE shopjoy_2604.sy_site ADD COLUMN IF NOT EXISTS url_local_ios   VARCHAR(500);
ALTER TABLE shopjoy_2604.sy_site ADD COLUMN IF NOT EXISTS url_dev_http    VARCHAR(500);
ALTER TABLE shopjoy_2604.sy_site ADD COLUMN IF NOT EXISTS url_dev_https   VARCHAR(500);
ALTER TABLE shopjoy_2604.sy_site ADD COLUMN IF NOT EXISTS url_dev_aos     VARCHAR(500);
ALTER TABLE shopjoy_2604.sy_site ADD COLUMN IF NOT EXISTS url_dev_ios     VARCHAR(500);
ALTER TABLE shopjoy_2604.sy_site ADD COLUMN IF NOT EXISTS url_prod_http   VARCHAR(500);
ALTER TABLE shopjoy_2604.sy_site ADD COLUMN IF NOT EXISTS url_prod_https  VARCHAR(500);
ALTER TABLE shopjoy_2604.sy_site ADD COLUMN IF NOT EXISTS url_prod_aos    VARCHAR(500);
ALTER TABLE shopjoy_2604.sy_site ADD COLUMN IF NOT EXISTS url_prod_ios    VARCHAR(500);

COMMENT ON COLUMN shopjoy_2604.sy_site.url_local_http  IS '접속주소 내PC http (브라우저, 예 http://localhost:3100) — NULL=없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.url_local_https IS '접속주소 내PC https (브라우저) — NULL=없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.url_local_aos   IS '접속주소 내PC 안드로이드 앱이 여는 화면 (앱 테넌트 foUrl.local, 폰은 adb reverse) — NULL=앱 없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.url_local_ios   IS '접속주소 내PC 아이폰 앱이 여는 화면 (앱 테넌트 foUrl.local) — NULL=앱 없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.url_dev_http    IS '접속주소 개발(NAS) http (브라우저, 예 http://illeesam.synology.me:22003) — NULL=없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.url_dev_https   IS '접속주소 개발(NAS) https (브라우저, DSM 역방향 프록시 <포트>.illeesam.synology.me) — NULL=없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.url_dev_aos     IS '접속주소 개발 안드로이드 앱이 여는 화면 (앱 테넌트 foUrl.dev) — NULL=앱 없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.url_dev_ios     IS '접속주소 개발 아이폰 앱이 여는 화면 (앱 테넌트 foUrl.dev) — NULL=앱 없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.url_prod_http   IS '접속주소 운영 http (브라우저, Netlify 는 https 로 넘김) — NULL=운영 없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.url_prod_https  IS '접속주소 운영 https (브라우저, 예 https://danmoo1--shopjoy-ecfefonuxt4.netlify.app) — NULL=운영 없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.url_prod_aos    IS '접속주소 운영 안드로이드 앱이 여는 화면 (앱 테넌트 foUrl.prod, https 만) — NULL=운영 앱 없음';
COMMENT ON COLUMN shopjoy_2604.sy_site.url_prod_ios    IS '접속주소 운영 아이폰 앱이 여는 화면 (앱 테넌트 foUrl.prod, https 만) — NULL=운영 앱 없음';

-- ── 2. 값 채우기 (사용 중인 사이트 9개 — 데모 SI260010~17 은 모듈·배포 없음이라 비워 둔다) ─────────
--    열 순서: local http/https/aos/ios · dev http/https/aos/ios · prod http/https/aos/ios
UPDATE shopjoy_2604.sy_site s SET
    url_local_http = v.l_http, url_local_https = v.l_https, url_local_aos = v.l_aos, url_local_ios = v.l_ios,
    url_dev_http   = v.d_http, url_dev_https   = v.d_https, url_dev_aos   = v.d_aos, url_dev_ios   = v.d_ios,
    url_prod_http  = v.p_http, url_prod_https  = v.p_https, url_prod_aos  = v.p_aos, url_prod_ios  = v.p_ios,
    upd_date = CURRENT_TIMESTAMP
FROM (VALUES
  -- ec1 (기본 FO — 개발 https 는 22100 역방향 프록시, 앱도 22100)
  ('SI260001', 'http://localhost:3100', NULL, 'http://localhost:3100', 'http://localhost:3100',
               'http://illeesam.synology.me:22001', 'https://22100.illeesam.synology.me', 'https://22100.illeesam.synology.me', 'https://22100.illeesam.synology.me',
               'http://shopjoy-ecfefonuxt4.netlify.app', 'https://shopjoy-ecfefonuxt4.netlify.app', 'https://shopjoy-ecfefonuxt4.netlify.app', 'https://shopjoy-ecfefonuxt4.netlify.app'),
  -- ec2 (운영 없음)
  ('SI260002', 'http://localhost:3100', NULL, 'http://localhost:3100', 'http://localhost:3100',
               'http://illeesam.synology.me:22002', NULL, 'http://illeesam.synology.me:22002', 'http://illeesam.synology.me:22002',
               NULL, NULL, NULL, NULL),
  -- danmoo1
  ('SI260003', 'http://localhost:3100', NULL, 'http://localhost:3100', 'http://localhost:3100',
               'http://illeesam.synology.me:22003', NULL, 'http://illeesam.synology.me:22003', 'http://illeesam.synology.me:22003',
               'http://danmoo1--shopjoy-ecfefonuxt4.netlify.app', 'https://danmoo1--shopjoy-ecfefonuxt4.netlify.app', 'https://danmoo1--shopjoy-ecfefonuxt4.netlify.app', 'https://danmoo1--shopjoy-ecfefonuxt4.netlify.app'),
  -- homepg1
  ('SI260004', 'http://localhost:3100', NULL, 'http://localhost:3100', 'http://localhost:3100',
               'http://illeesam.synology.me:22004', NULL, 'http://illeesam.synology.me:22004', 'http://illeesam.synology.me:22004',
               'http://homepg1--shopjoy-ecfefonuxt4.netlify.app', 'https://homepg1--shopjoy-ecfefonuxt4.netlify.app', 'https://homepg1--shopjoy-ecfefonuxt4.netlify.app', 'https://homepg1--shopjoy-ecfefonuxt4.netlify.app'),
  -- datavisual1
  ('SI260005', 'http://localhost:3100', NULL, 'http://localhost:3100', 'http://localhost:3100',
               'http://illeesam.synology.me:22005', NULL, 'http://illeesam.synology.me:22005', 'http://illeesam.synology.me:22005',
               'http://datavisual1--shopjoy-ecfefonuxt4.netlify.app', 'https://datavisual1--shopjoy-ecfefonuxt4.netlify.app', 'https://datavisual1--shopjoy-ecfefonuxt4.netlify.app', 'https://datavisual1--shopjoy-ecfefonuxt4.netlify.app'),
  -- bbm1 (운영 웹은 있고 운영 앱은 없음 — 앱 테넌트에 prod 없음)
  ('SI260006', 'http://localhost:3100', NULL, 'http://localhost:3100', 'http://localhost:3100',
               'http://illeesam.synology.me:22006', NULL, 'http://illeesam.synology.me:22006', 'http://illeesam.synology.me:22006',
               'http://bbm1--shopjoy-ecfefonuxt4.netlify.app', 'https://bbm1--shopjoy-ecfefonuxt4.netlify.app', NULL, NULL),
  -- bo1 (ecFeBoNuxt4, 앱 없음, 운영 Netlify 사이트 아직 없음)
  ('SI260007', 'http://localhost:3200', NULL, NULL, NULL,
               'http://illeesam.synology.me:22010', NULL, NULL, NULL,
               NULL, NULL, NULL, NULL),
  -- bom1 (ecFeBoNuxt4 모바일 BO, BO 앱 있음, 운영 없음)
  ('SI260008', 'http://localhost:3202', NULL, 'http://localhost:3202', 'http://localhost:3202',
               'http://illeesam.synology.me:22012', NULL, 'http://illeesam.synology.me:22012', 'http://illeesam.synology.me:22012',
               NULL, NULL, NULL, NULL),
  -- main1 (종합서비스관리 포털, 앱 없음)
  ('SI260009', 'http://localhost:3100', NULL, NULL, NULL,
               'http://illeesam.synology.me:22007', NULL, NULL, NULL,
               'http://main1--shopjoy-ecfefonuxt4.netlify.app', 'https://main1--shopjoy-ecfefonuxt4.netlify.app', NULL, NULL)
) AS v(site_id, l_http, l_https, l_aos, l_ios, d_http, d_https, d_aos, d_ios, p_http, p_https, p_aos, p_ios)
WHERE s.site_id = v.site_id;

-- 확인
SELECT site_id, module_cd, url_local_http, url_dev_http, url_dev_https, url_dev_aos, url_prod_https, url_prod_aos
  FROM shopjoy_2604.sy_site ORDER BY site_id;
