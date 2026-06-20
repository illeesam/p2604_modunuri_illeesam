-- ============================================================
-- migration_20260620_sy_prop_real_keys.sql
-- 실제 등록된 외부 연동 키/계정 정보로 sy_prop 업데이트
--
-- 출처 정보:
--   카카오: kakao developers.kakao.com/console/app
--     - illeesam_netlify  (ID: 1429368)  — netlify 배포용
--     - illeesam_synology (ID: 1491354)  — synology 로컬서버용 ← 로컬dev 사용
--   네이버: developers.naver.com/apps/#/myapps/K0Xy5CSEtyzRrHnDbf75/overview
--     - illeesam_netlify   (Client ID: r6RWBr2qMOCZbGPFALrA)  — netlify용
--     - illeesam_synology  (Client ID: jWtLT9SUfE2JWEji2XGq)  — synology용 ← 로컬dev 사용
--     - illeesam_localhost (Client ID: 01sBNJ_R7mdQDl5_d3AM)   — localhost 전용
--   토스: developers.tosspayments.com (문서용 테스트 키)
--     - test client key: test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm
--     - test secret key: test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- [1] 카카오 JavaScript 키 — illeesam_synology 앱 (로컬/dev 공통)
--     출처: kakao developers → illeesam_synology (ID:1491354) → 앱 키 → JavaScript 키
-- ──────────────────────────────────────────────────────────────

-- app.ext-sdk.kakao-js-key (^local^dev^)
INSERT INTO shopjoy_2604.sy_prop
  (site_id, path_id, prop_key, prop_value, prop_label, prop_type_cd, sort_ord, use_yn, prop_profile, prop_remark, reg_by, reg_date)
VALUES
  ('2604010000000001', 'app.ext-sdk', 'app.ext-sdk.kakao-js-key',
   'a2990e41aa57c3a4ad1fe97a210938d7',
   'Kakao JavaScript 키', 'STRING', 20, 'Y', '^local^dev^',
   '카카오 디벨로퍼스 → illeesam_synology (ID:1491354) → 앱 키 → JavaScript 키 | Redirect URI: https://illeesam.synology.me:3000/login/oauth2/code/kakao | http://127.0.0.1:3000/login/oauth2/code/kakao',
   'SYSTEM', CURRENT_TIMESTAMP)
ON CONFLICT (site_id, path_id, prop_key, COALESCE(prop_profile, '')) DO UPDATE
  SET prop_value  = EXCLUDED.prop_value,
      prop_remark = EXCLUDED.prop_remark,
      upd_by      = 'SYSTEM',
      upd_date    = CURRENT_TIMESTAMP;

-- app.map.kakao-js-key (^local^dev^) — 지도도 같은 앱 키 사용
INSERT INTO shopjoy_2604.sy_prop
  (site_id, path_id, prop_key, prop_value, prop_label, prop_type_cd, sort_ord, use_yn, prop_profile, prop_remark, reg_by, reg_date)
VALUES
  ('2604010000000001', 'app.map', 'app.map.kakao-js-key',
   'a2990e41aa57c3a4ad1fe97a210938d7',
   'Kakao 지도 JavaScript 키', 'STRING', 10, 'Y', '^local^dev^',
   '카카오 디벨로퍼스 → illeesam_synology (ID:1491354) → 앱 키 → JavaScript 키 | 앱 > 카카오맵: 사용설정 ON',
   'SYSTEM', CURRENT_TIMESTAMP)
ON CONFLICT (site_id, path_id, prop_key, COALESCE(prop_profile, '')) DO UPDATE
  SET prop_value  = EXCLUDED.prop_value,
      prop_remark = EXCLUDED.prop_remark,
      upd_by      = 'SYSTEM',
      upd_date    = CURRENT_TIMESTAMP;

-- ──────────────────────────────────────────────────────────────
-- [2] 네이버 Client ID / Secret — illeesam_synology 앱 (로컬/dev)
--     출처: developers.naver.com → illeesam_synology
--     Callback URL 등록: http://127.0.0.1:5501/bo.html | http://127.0.0.1:5501
-- ──────────────────────────────────────────────────────────────

-- app.ext-sdk.naver-client-id (^local^dev^)
INSERT INTO shopjoy_2604.sy_prop
  (site_id, path_id, prop_key, prop_value, prop_label, prop_type_cd, sort_ord, use_yn, prop_profile, prop_remark, reg_by, reg_date)
VALUES
  ('2604010000000001', 'app.ext-sdk', 'app.ext-sdk.naver-client-id',
   'jWtLT9SUfE2JWEji2XGq',
   'Naver OAuth2 클라이언트 ID', 'STRING', 30, 'Y', '^local^dev^',
   '네이버 개발자센터 → illeesam_synology | Client Secret: QOX2GZO1uk | Callback URL: http://127.0.0.1:5501/bo.html, http://127.0.0.1:5501',
   'SYSTEM', CURRENT_TIMESTAMP)
ON CONFLICT (site_id, path_id, prop_key, COALESCE(prop_profile, '')) DO UPDATE
  SET prop_value  = EXCLUDED.prop_value,
      prop_remark = EXCLUDED.prop_remark,
      upd_by      = 'SYSTEM',
      upd_date    = CURRENT_TIMESTAMP;

-- app.ext-sdk.naver-client-secret (^local^dev^) — 신규 키
INSERT INTO shopjoy_2604.sy_prop
  (site_id, path_id, prop_key, prop_value, prop_label, prop_type_cd, sort_ord, use_yn, prop_profile, prop_remark, reg_by, reg_date)
VALUES
  ('2604010000000001', 'app.ext-sdk', 'app.ext-sdk.naver-client-secret',
   'QOX2GZO1uk',
   'Naver OAuth2 클라이언트 Secret', 'SECRET', 35, 'Y', '^local^dev^',
   '네이버 개발자센터 → illeesam_synology | Client ID: jWtLT9SUfE2JWEji2XGq',
   'SYSTEM', CURRENT_TIMESTAMP)
ON CONFLICT (site_id, path_id, prop_key, COALESCE(prop_profile, '')) DO UPDATE
  SET prop_value  = EXCLUDED.prop_value,
      prop_remark = EXCLUDED.prop_remark,
      upd_by      = 'SYSTEM',
      upd_date    = CURRENT_TIMESTAMP;

-- app.ext-sdk.naver-callback-url (^local^) — BO Live Server 콜백
INSERT INTO shopjoy_2604.sy_prop
  (site_id, path_id, prop_key, prop_value, prop_label, prop_type_cd, sort_ord, use_yn, prop_profile, prop_remark, reg_by, reg_date)
VALUES
  ('2604010000000001', 'app.ext-sdk', 'app.ext-sdk.naver-callback-url',
   'http://127.0.0.1:5501/bo.html',
   'Naver OAuth2 콜백 URL (BO)', 'STRING', 40, 'Y', '^local^',
   '네이버 콘솔 등록 Callback URL — BO: http://127.0.0.1:5501/bo.html | FO: http://127.0.0.1:5501',
   'SYSTEM', CURRENT_TIMESTAMP)
ON CONFLICT (site_id, path_id, prop_key, COALESCE(prop_profile, '')) DO UPDATE
  SET prop_value  = EXCLUDED.prop_value,
      prop_remark = EXCLUDED.prop_remark,
      upd_by      = 'SYSTEM',
      upd_date    = CURRENT_TIMESTAMP;

-- ──────────────────────────────────────────────────────────────
-- [3] 토스페이먼츠 테스트 키 (문서용)
--     출처: developers.tosspayments.com → 결제 연동하기 → 문서용 테스트 키
-- ──────────────────────────────────────────────────────────────

-- app.toss.client-key (^local^dev^) — client key 수정
INSERT INTO shopjoy_2604.sy_prop
  (site_id, path_id, prop_key, prop_value, prop_label, prop_type_cd, sort_ord, use_yn, prop_profile, prop_remark, reg_by, reg_date)
VALUES
  ('2604010000000001', 'app.toss', 'app.toss.client-key',
   'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm',
   '토스 클라이언트 키 (FE)', 'STRING', 30, 'Y', '^local^dev^',
   '토스페이먼츠 개발자센터 → 결제 연동하기 → 문서용 테스트 키 (test_gck_docs_*) | sandbox: https://developers.tosspayments.com/sandbox',
   'SYSTEM', CURRENT_TIMESTAMP)
ON CONFLICT (site_id, path_id, prop_key, COALESCE(prop_profile, '')) DO UPDATE
  SET prop_value  = EXCLUDED.prop_value,
      prop_remark = EXCLUDED.prop_remark,
      upd_by      = 'SYSTEM',
      upd_date    = CURRENT_TIMESTAMP;

-- app.toss.secret-key (^local^dev^) — secret key 수정
INSERT INTO shopjoy_2604.sy_prop
  (site_id, path_id, prop_key, prop_value, prop_label, prop_type_cd, sort_ord, use_yn, prop_profile, prop_remark, reg_by, reg_date)
VALUES
  ('2604010000000001', 'app.toss', 'app.toss.secret-key',
   'test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6',
   '토스 시크릿 키 (BE)', 'SECRET', 40, 'Y', '^local^dev^',
   '토스페이먼츠 개발자센터 → 결제 연동하기 → 문서용 테스트 키 (test_gsk_docs_*) — BE 전용, FE 노출 절대 금지',
   'SYSTEM', CURRENT_TIMESTAMP)
ON CONFLICT (site_id, path_id, prop_key, COALESCE(prop_profile, '')) DO UPDATE
  SET prop_value  = EXCLUDED.prop_value,
      prop_remark = EXCLUDED.prop_remark,
      upd_by      = 'SYSTEM',
      upd_date    = CURRENT_TIMESTAMP;

-- ──────────────────────────────────────────────────────────────
-- [4] sample_insert 파일도 동일하게 반영 (실행 확인용 조회)
-- ──────────────────────────────────────────────────────────────

-- 현재 상태 확인
SELECT prop_key, prop_profile, LEFT(prop_value, 40) AS prop_value_preview, prop_remark
FROM shopjoy_2604.sy_prop
WHERE path_id IN ('app.ext-sdk', 'app.toss', 'app.map')
  AND site_id = '2604010000000001'
ORDER BY path_id, sort_ord, prop_profile;
