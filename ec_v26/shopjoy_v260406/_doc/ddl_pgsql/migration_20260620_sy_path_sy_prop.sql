-- ============================================================
-- migration_20260620_sy_path_sy_prop.sql
-- sy_prop 관리 화면 좌측 트리용 sy_path 경로 등록
--
-- sy_prop.path_id 는 yml 경로 문자열을 직접 저장 (예: 'app.ext-sdk', 'app.toss')
-- sy_path.path_id 를 동일한 문자열로 명시 INSERT 해야 트리 ↔ 목록 매핑 작동
--
-- 계층 구조 (yml 경로 반영):
--   app
--     app.ext-sdk        ← app.ext-sdk.* 소셜/토스/지도 SDK 키
--     app.auth           ← app.auth.social.*
--       app.auth.social  ← auth.social.* userinfo URL
--     app.toss           ← toss.confirm-url, toss.client-key, toss.secret-key, toss.cancel-url-base
--     app.map            ← map.kakao-js-key, map.naver-map-client-id
--     app.mail           ← app.mail.from, app.mail.from-nm
--     app.file           ← app.file.storage-type, app.file.cdn-host
--       app.file.aws     ← app.file.aws.*
--       app.file.ncp     ← app.file.ncp.*
--   spring
--     spring.mail        ← spring.mail.host, spring.mail.port, spring.mail.username, spring.mail.password
-- ============================================================

SET search_path TO shopjoy_2604;

-- 기존 sy_prop 경로 제거 (재실행 안전)
DELETE FROM sy_path WHERE biz_cd = 'sy_prop';

-- sy_prop 트리 경로 등록 (path_id = yml 경로 문자열 직접 지정)
INSERT INTO sy_path (path_id, biz_cd, parent_path_id, path_label, sort_ord, use_yn, site_id, reg_by, reg_date)
VALUES
  -- app.*
  ('app',             'sy_prop', NULL,        'app',     1, 'Y', 'SITE000001', 'SYSTEM', NOW()),
  ('app.ext-sdk',     'sy_prop', 'app',       'ext-sdk', 1, 'Y', 'SITE000001', 'SYSTEM', NOW()),
  ('app.auth',        'sy_prop', 'app',       'auth',    2, 'Y', 'SITE000001', 'SYSTEM', NOW()),
  ('app.auth.social', 'sy_prop', 'app.auth',  'social',  1, 'Y', 'SITE000001', 'SYSTEM', NOW()),
  ('app.toss',        'sy_prop', 'app',       'toss',    3, 'Y', 'SITE000001', 'SYSTEM', NOW()),
  ('app.map',         'sy_prop', 'app',       'map',     4, 'Y', 'SITE000001', 'SYSTEM', NOW()),
  ('app.mail',        'sy_prop', 'app',       'mail',    5, 'Y', 'SITE000001', 'SYSTEM', NOW()),
  ('app.file',        'sy_prop', 'app',       'file',    6, 'Y', 'SITE000001', 'SYSTEM', NOW()),
  ('app.file.aws',    'sy_prop', 'app.file',  'aws',     1, 'Y', 'SITE000001', 'SYSTEM', NOW()),
  ('app.file.ncp',    'sy_prop', 'app.file',  'ncp',     2, 'Y', 'SITE000001', 'SYSTEM', NOW()),
  -- spring.* (Spring Boot 고유 네임스페이스 — 최상위 유지)
  ('spring',          'sy_prop', NULL,        'spring',  2, 'Y', 'SITE000001', 'SYSTEM', NOW()),
  ('spring.mail',     'sy_prop', 'spring',    'mail',    1, 'Y', 'SITE000001', 'SYSTEM', NOW());

-- sy_prop.path_id 도 신규 구조에 맞춰 UPDATE
UPDATE sy_prop SET path_id = 'app.auth.social', upd_by = 'SYSTEM', upd_date = NOW() WHERE path_id = 'auth.social';
UPDATE sy_prop SET path_id = 'app.auth',         upd_by = 'SYSTEM', upd_date = NOW() WHERE path_id = 'auth';
UPDATE sy_prop SET path_id = 'app.toss',         upd_by = 'SYSTEM', upd_date = NOW() WHERE path_id = 'toss';
UPDATE sy_prop SET path_id = 'app.map',          upd_by = 'SYSTEM', upd_date = NOW() WHERE path_id = 'map';

-- 결과 확인
SELECT 'sy_path' AS tbl, path_id, parent_path_id, path_label, sort_ord
FROM sy_path
WHERE biz_cd = 'sy_prop'
ORDER BY path_id;

SELECT 'sy_prop path_id 분포' AS tbl, path_id, COUNT(*) cnt
FROM sy_prop
GROUP BY path_id
ORDER BY path_id;
