-- ============================================================
-- sy_prop — 외부 연동 설정 샘플 데이터
--
-- propKey 규칙: yml 경로를 그대로 사용 (역전환 시 키 변환 없음)
--   예) app.auth.social.google-client-id  →  ${app.auth.social.google-client-id:}
--
-- propProfile 정책:
--   NULL / 빈값          → 모든 프로파일 공통 (변경 없는 고정 엔드포인트)
--   ^local^dev^          → local + dev 공통 (테스트 키 / 테스트 SMTP 등)
--   ^prod^               → 운영 전용 (실 키)
--   ^local^dev^prod^     → 세 프로파일 모두 같은 값 (region, 공개 URL 등)
--
-- prop_type_cd:
--   STRING  → 문자열 (기본)
--   SECRET  → 화면 마스킹 대상 (*-key, *-password)
--   NUMBER  → 숫자
--
-- ※ prop_id: DEFAULT nextval(시퀀스) 자동생성 → INSERT 시 생략
-- ※ 중복 실행 방지: ON CONFLICT (site_id, path_id, prop_key, COALESCE(prop_profile,'')) DO UPDATE
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- [1] 소셜 로그인 SDK 키 — app.auth.social.*
-- ──────────────────────────────────────────────────────────────

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.auth.social','app.auth.social.google-client-id',
 '207844440856-5ib9mk6frvt7rfpt8823e48c3c0lavth.apps.googleusercontent.com',
 'Google OAuth2 클라이언트 ID','STRING',10,'Y','^local^dev^',
 'Google Cloud Console → OAuth2 클라이언트 → 클라이언트 ID (테스트 앱)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, prop_label=EXCLUDED.prop_label, prop_remark=EXCLUDED.prop_remark, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.auth.social','app.auth.social.google-client-id',
 '',
 'Google OAuth2 클라이언트 ID','STRING',10,'Y','^prod^',
 'Google Cloud Console → OAuth2 클라이언트 → 클라이언트 ID (운영 앱)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, prop_label=EXCLUDED.prop_label, prop_remark=EXCLUDED.prop_remark, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.auth.social','app.auth.social.kakao-js-key',
 'a2990e41aa57c3a4ad1fe97a210938d7',
 'Kakao JavaScript 키','STRING',20,'Y','^local^dev^',
 '카카오 디벨로퍼스 → illeesam_synology (ID:1491354) → 앱 키 → JavaScript 키 | Redirect URI: http://127.0.0.1:3000/login/oauth2/code/kakao',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, prop_remark=EXCLUDED.prop_remark, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.auth.social','app.auth.social.kakao-js-key',
 '',
 'Kakao JavaScript 키','STRING',20,'Y','^prod^',
 '카카오 디벨로퍼스 → 내 애플리케이션 → 앱 키 → JavaScript 키 (운영 앱)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, prop_remark=EXCLUDED.prop_remark, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.auth.social','app.auth.social.naver-client-id',
 'jWtLT9SUfE2JWEji2XGq',
 'Naver OAuth2 클라이언트 ID','STRING',30,'Y','^local^dev^',
 '네이버 개발자센터 → illeesam_synology | Client Secret: QOX2GZO1uk | Callback URL: http://127.0.0.1:5501/bo.html, http://127.0.0.1:5501',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, prop_remark=EXCLUDED.prop_remark, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.auth.social','app.auth.social.naver-client-secret',
 'QOX2GZO1uk',
 'Naver OAuth2 클라이언트 Secret','SECRET',35,'Y','^local^dev^',
 '네이버 개발자센터 → illeesam_synology | Client ID: jWtLT9SUfE2JWEji2XGq',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, prop_remark=EXCLUDED.prop_remark, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.auth.social','app.auth.social.naver-client-id',
 '',
 'Naver OAuth2 클라이언트 ID','STRING',30,'Y','^prod^',
 '네이버 개발자센터 → 애플리케이션 → Client ID (운영 앱)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, prop_remark=EXCLUDED.prop_remark, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.auth.social','app.auth.social.naver-callback-url',
 'http://127.0.0.1:5501/bo.html',
 'Naver OAuth2 콜백 URL (BO)', 'STRING',40,'Y','^local^',
 '네이버 콘솔 등록 Callback URL — BO: http://127.0.0.1:5501/bo.html | FO: http://127.0.0.1:5501 (illeesam_synology 앱)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, prop_remark=EXCLUDED.prop_remark, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.auth.social','app.auth.social.naver-callback-url',
 'https://dev.shopjoy.com/',
 'Naver OAuth2 콜백 URL','STRING',40,'Y','^dev^',
 '네이버 로그인 후 리다이렉트 URL — dev 서버 도메인',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, prop_remark=EXCLUDED.prop_remark, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.auth.social','app.auth.social.naver-callback-url',
 'https://www.shopjoy.com/',
 'Naver OAuth2 콜백 URL','STRING',40,'Y','^prod^',
 '네이버 로그인 후 리다이렉트 URL — 운영 도메인',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, prop_remark=EXCLUDED.prop_remark, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

-- ──────────────────────────────────────────────────────────────
-- [2] 소셜 인증 서버 엔드포인트 — app.auth.social.*
-- ──────────────────────────────────────────────────────────────

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.auth.social','app.auth.social.google-userinfo-url',
 'https://www.googleapis.com/oauth2/v3/userinfo',
 'Google userinfo URL','STRING',50,'Y','^local^dev^prod^',
 'Google OAuth2 토큰 검증 엔드포인트',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.auth.social','app.auth.social.kakao-userinfo-url',
 'https://kapi.kakao.com/v2/user/me',
 'Kakao userinfo URL','STRING',60,'Y','^local^dev^prod^',
 '카카오 OAuth2 토큰 검증 엔드포인트',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.auth.social','app.auth.social.naver-userinfo-url',
 'https://openapi.naver.com/v1/nid/me',
 'Naver userinfo URL','STRING',70,'Y','^local^dev^prod^',
 '네이버 OAuth2 토큰 검증 엔드포인트',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.auth.social','app.auth.social.default-site-id',
 '2604010000000001',
 '소셜 가입 기본 사이트 ID','STRING',80,'Y','^local^dev^prod^',
 'siteId 미전달 소셜 가입/매칭 시 사용할 대표 사이트 ID',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

-- ──────────────────────────────────────────────────────────────
-- [3] 토스페이먼츠 — app.pay.toss.*
-- ──────────────────────────────────────────────────────────────

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.pay.toss','app.pay.toss.confirm-url',
 'https://api.tosspayments.com/v1/payments/confirm',
 '토스 결제승인 API URL','STRING',10,'Y','^local^dev^prod^',
 '토스 공식 엔드포인트 — 변경 가능성 낮음',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.pay.toss','app.pay.toss.cancel-url-base',
 'https://api.tosspayments.com/v1/payments',
 '토스 결제취소 API 베이스 URL','STRING',20,'Y','^local^dev^prod^',
 '실제 호출: {cancel-url-base}/{paymentKey}/cancel',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.pay.toss','app.pay.toss.widget-client-key',
 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm',
 '토스 위젯 클라이언트 키 (FE)','STRING',30,'Y','^local^dev^',
 '토스페이먼츠 개발자센터 → 결제 연동하기 → 문서용 테스트 키 (test_gck_docs_*) | sandbox: https://developers.tosspayments.com/sandbox',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, prop_remark=EXCLUDED.prop_remark, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.pay.toss','app.pay.toss.widget-client-key',
 '',
 '토스 위젯 클라이언트 키 (FE)','STRING',30,'Y','^prod^',
 '토스 디벨로퍼스 → 상점 → 클라이언트 키 (live_gck_*)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.pay.toss','app.pay.toss.secret-key',
 'test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6',
 '토스 시크릿 키 (BE)','SECRET',40,'Y','^local^dev^',
 '토스페이먼츠 개발자센터 → 결제 연동하기 → 문서용 테스트 키 (test_gsk_docs_*) — BE 전용, FE 노출 절대 금지',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, prop_remark=EXCLUDED.prop_remark, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.pay.toss','app.pay.toss.secret-key',
 '',
 '토스 시크릿 키 (BE)','SECRET',40,'Y','^prod^',
 '토스 디벨로퍼스 → 상점 → 시크릿 키 (live_gsk_*)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

-- ──────────────────────────────────────────────────────────────
-- [4] 카카오페이 — app.pay.kakaopay.*
-- ──────────────────────────────────────────────────────────────

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.pay.kakaopay','app.pay.kakaopay.cid',
 'TC0ONETIME',
 '카카오페이 CID (가맹점 코드)','STRING',10,'Y','^local^dev^',
 '카카오페이 개발자센터 → 단건결제 테스트 CID: TC0ONETIME | 정기결제: TCSUBSCRIP',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, prop_remark=EXCLUDED.prop_remark, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.pay.kakaopay','app.pay.kakaopay.cid',
 '',
 '카카오페이 CID (가맹점 코드)','STRING',10,'Y','^prod^',
 '카카오페이 비즈니스 → 내 서비스 → CID (운영)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.pay.kakaopay','app.pay.kakaopay.secret-key',
 '',
 '카카오페이 시크릿 키 (BE)','SECRET',20,'Y','^local^dev^',
 '카카오페이 개발자센터 → 내 앱 → 시크릿 키 — BE 전용, FE 노출 절대 금지',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, prop_remark=EXCLUDED.prop_remark, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.pay.kakaopay','app.pay.kakaopay.secret-key',
 '',
 '카카오페이 시크릿 키 (BE)','SECRET',20,'Y','^prod^',
 '카카오페이 비즈니스 → 내 서비스 → 시크릿 키 (운영)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

-- ──────────────────────────────────────────────────────────────
-- [5] 네이버페이 — app.pay.naverpay.*
-- ──────────────────────────────────────────────────────────────

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.pay.naverpay','app.pay.naverpay.client-id',
 '',
 '네이버페이 Client ID','STRING',10,'Y','^local^dev^',
 'NCP 콘솔 → 네이버페이 → Partner ID / Client ID (테스트용)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, prop_remark=EXCLUDED.prop_remark, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.pay.naverpay','app.pay.naverpay.client-id',
 '',
 '네이버페이 Client ID','STRING',10,'Y','^prod^',
 'NCP 콘솔 → 네이버페이 → Client ID (운영)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.pay.naverpay','app.pay.naverpay.client-secret',
 '',
 '네이버페이 Client Secret (BE)','SECRET',20,'Y','^local^dev^',
 'NCP 콘솔 → 네이버페이 → Client Secret — BE 전용, FE 노출 절대 금지 (테스트)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, prop_remark=EXCLUDED.prop_remark, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.pay.naverpay','app.pay.naverpay.client-secret',
 '',
 '네이버페이 Client Secret (BE)','SECRET',20,'Y','^prod^',
 'NCP 콘솔 → 네이버페이 → Client Secret (운영)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.pay.naverpay','app.pay.naverpay.api-url',
 'https://dev.apis.naver.com/naverpay-partner/naverpay',
 '네이버페이 API 베이스 URL','STRING',30,'Y','^local^dev^',
 '네이버페이 파트너센터 → 개발/연동가이드 → sandbox URL',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, prop_remark=EXCLUDED.prop_remark, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.pay.naverpay','app.pay.naverpay.api-url',
 'https://apis.naver.com/naverpay-partner/naverpay',
 '네이버페이 API 베이스 URL','STRING',30,'Y','^prod^',
 '네이버페이 파트너센터 → 개발/연동가이드 → 운영 URL',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

-- ──────────────────────────────────────────────────────────────
-- [6] 지도 공개 키 — app.map.*
-- ──────────────────────────────────────────────────────────────

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.map','app.map.kakao-js-key',
 'a2990e41aa57c3a4ad1fe97a210938d7',
 'Kakao 지도 JavaScript 키','STRING',10,'Y','^local^dev^',
 '카카오 디벨로퍼스 → illeesam_synology (ID:1491354) → 앱 키 → JavaScript 키 | 앱 > 카카오맵: 사용설정 ON',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, prop_remark=EXCLUDED.prop_remark, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.map','app.map.kakao-js-key',
 '',
 'Kakao 지도 JavaScript 키','STRING',10,'Y','^prod^',
 '카카오 디벨로퍼스 → JavaScript 키 (운영 앱)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.map','app.map.naver-map-client-id',
 '',
 'Naver 지도 Client ID','STRING',20,'Y','^local^dev^',
 'NCP 콘솔 → Application → Client ID (테스트 앱)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.map','app.map.naver-map-client-id',
 '',
 'Naver 지도 Client ID','STRING',20,'Y','^prod^',
 'NCP 콘솔 → Application → Client ID (운영 앱)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.map','app.map.google-api-key',
 '',
 'Google 지도 API 키','STRING',30,'Y','^local^dev^',
 'Google Cloud Console → 사용자 인증 정보 → API 키 (Maps JavaScript API 허용) | console.cloud.google.com',
 'SYSTEM','2026-06-22 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, prop_remark=EXCLUDED.prop_remark, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.map','app.map.google-api-key',
 '',
 'Google 지도 API 키','STRING',30,'Y','^prod^',
 'Google Cloud Console → 사용자 인증 정보 → API 키 (운영 앱)',
 'SYSTEM','2026-06-22 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

-- ──────────────────────────────────────────────────────────────
-- [7] 메일(SMTP) — spring.mail.* + app.mail.*
-- ──────────────────────────────────────────────────────────────

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','spring.mail','spring.mail.host',
 'smtp.gmail.com',
 'SMTP 호스트','STRING',10,'Y','^local^dev^',
 'Gmail SMTP (테스트/개발용) — smtp.gmail.com:587',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','spring.mail','spring.mail.host',
 '',
 'SMTP 호스트','STRING',10,'Y','^prod^',
 '운영 SMTP 호스트 (예: ses.ap-northeast-2.amazonaws.com)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','spring.mail','spring.mail.port',
 '587',
 'SMTP 포트','NUMBER',20,'Y','^local^dev^prod^',
 '587(STARTTLS) / 465(SSL) / 25(비암호화)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','spring.mail','spring.mail.username',
 'illeesam4@gmail.com',
 'SMTP 계정 (발신자)','STRING',30,'Y','^local^dev^',
 'Gmail 앱 비밀번호용 계정 — 2단계 인증 활성화 후 앱 비밀번호 발급 필수',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','spring.mail','spring.mail.username',
 '',
 'SMTP 계정 (발신자)','STRING',30,'Y','^prod^',
 '운영 SMTP 계정',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','spring.mail','spring.mail.password',
 'wqjiylpfpcwtvhnh',
 'SMTP 비밀번호 (앱 비밀번호)','SECRET',40,'Y','^local^dev^',
 'Gmail: 구글 계정 → 보안 → 2단계 인증 → 앱 비밀번호 발급 (16자리)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','spring.mail','spring.mail.password',
 '',
 'SMTP 비밀번호 (앱 비밀번호)','SECRET',40,'Y','^prod^',
 '운영 SMTP 비밀번호',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.mail','app.mail.from',
 'illeesam4@gmail.com',
 '발신자 이메일 주소','STRING',50,'Y','^local^dev^',
 '메일 From 헤더 — SMTP username과 동일하게 설정 권장',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.mail','app.mail.from',
 '',
 '발신자 이메일 주소','STRING',50,'Y','^prod^',
 '운영 발신자 주소 (예: noreply@shopjoy.com)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.mail','app.mail.from-nm',
 'ShopJoy 고객센터',
 '발신자 표시 이름','STRING',60,'Y','^local^dev^prod^',
 '메일 From 헤더의 표시 이름 — 전 프로파일 동일',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

-- ──────────────────────────────────────────────────────────────
-- [8] 파일 저장소 — app.file.*
-- ──────────────────────────────────────────────────────────────

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.file','app.file.storage-type',
 'LOCAL',
 '파일 저장소 유형','STRING',10,'Y','^local^',
 'LOCAL / AWS_S3 / NCP_OBS',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.file','app.file.storage-type',
 'NCP_OBS',
 '파일 저장소 유형','STRING',10,'Y','^dev^prod^',
 'dev/prod: NCP Object Storage 사용',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.file','app.file.cdn-host',
 'http://localhost:3000/cdn',
 'CDN 호스트 URL','STRING',20,'Y','^local^',
 '파일 접근 기준 URL — sy_attach.cdn_host 에 저장됨',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.file','app.file.cdn-host',
 'https://cdn-ncp.shopjoy.com',
 'CDN 호스트 URL','STRING',20,'Y','^dev^',
 'dev CDN URL',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.file','app.file.cdn-host',
 'https://cdn.shopjoy.com',
 'CDN 호스트 URL','STRING',20,'Y','^prod^',
 '운영 CDN URL',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

-- AWS S3
INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.file.aws','app.file.aws.bucket-name',
 'shopjoy-files-local',
 'AWS S3 버킷 이름','STRING',10,'Y','^local^',
 'AWS S3 콘솔에서 생성한 버킷명',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.file.aws','app.file.aws.bucket-name',
 '',
 'AWS S3 버킷 이름','STRING',10,'Y','^dev^',
 'dev AWS S3 버킷',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.file.aws','app.file.aws.bucket-name',
 '',
 'AWS S3 버킷 이름','STRING',10,'Y','^prod^',
 '운영 AWS S3 버킷',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.file.aws','app.file.aws.region',
 'ap-northeast-2',
 'AWS 리전','STRING',20,'Y','^local^dev^prod^',
 'ap-northeast-2 (서울) — 전 프로파일 동일',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.file.aws','app.file.aws.access-key',
 '',
 'AWS Access Key ID','SECRET',30,'Y','^local^dev^',
 'IAM → 사용자 → 액세스 키 (AKIA…) — 테스트용',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.file.aws','app.file.aws.access-key',
 '',
 'AWS Access Key ID','SECRET',30,'Y','^prod^',
 'IAM → 사용자 → 액세스 키 (운영)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.file.aws','app.file.aws.secret-key',
 '',
 'AWS Secret Access Key','SECRET',40,'Y','^local^dev^',
 'IAM 액세스 키 생성 시 발급 — 최초 1회만 확인 가능 (테스트용)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.file.aws','app.file.aws.secret-key',
 '',
 'AWS Secret Access Key','SECRET',40,'Y','^prod^',
 'IAM Secret Key (운영)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.file.aws','app.file.aws.cdn-url',
 'https://cdn.shopjoy.com',
 'AWS CloudFront CDN URL','STRING',50,'Y','^local^dev^prod^',
 'CloudFront 배포 도메인 — 전 프로파일 동일 도메인, 버킷만 다름',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

-- NCP OBS
INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.file.ncp','app.file.ncp.bucket-name',
 'shopjoy-files-local',
 'NCP OBS 버킷 이름','STRING',10,'Y','^local^',
 'NCP 콘솔 → Object Storage → 버킷 이름',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.file.ncp','app.file.ncp.bucket-name',
 '',
 'NCP OBS 버킷 이름','STRING',10,'Y','^dev^',
 'dev NCP OBS 버킷',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.file.ncp','app.file.ncp.bucket-name',
 '',
 'NCP OBS 버킷 이름','STRING',10,'Y','^prod^',
 '운영 NCP OBS 버킷',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.file.ncp','app.file.ncp.endpoint',
 'https://obs.kr-standard.ncrdev.ncloud.com',
 'NCP OBS 엔드포인트','STRING',20,'Y','^local^',
 'NCP Object Storage 리전 엔드포인트 (로컬 테스트용)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.file.ncp','app.file.ncp.endpoint',
 'https://kr.object.ncloudstorage.com',
 'NCP OBS 엔드포인트','STRING',20,'Y','^dev^prod^',
 'dev/prod NCP OBS 엔드포인트',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.file.ncp','app.file.ncp.access-key',
 '',
 'NCP Access Key','SECRET',30,'Y','^local^dev^',
 'NCP 콘솔 → 마이페이지 → 인증키 관리 → Access Key (테스트용)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.file.ncp','app.file.ncp.access-key',
 '',
 'NCP Access Key','SECRET',30,'Y','^prod^',
 'NCP Access Key (운영)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.file.ncp','app.file.ncp.secret-key',
 '',
 'NCP Secret Key','SECRET',40,'Y','^local^dev^',
 'NCP 콘솔 → 마이페이지 → 인증키 관리 → Secret Key (테스트용)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.file.ncp','app.file.ncp.secret-key',
 '',
 'NCP Secret Key','SECRET',40,'Y','^prod^',
 'NCP Secret Key (운영)',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','app.file.ncp','app.file.ncp.cdn-url',
 'https://cdn-ncp.shopjoy.com',
 'NCP CDN URL','STRING',50,'Y','^local^dev^prod^',
 'NCP CDN 배포 URL (Image Optimizer 또는 CDN+ 도메인) — 전 프로파일 동일',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

-- ──────────────────────────────────────────────────────────────
-- [9] 비즈니스 정책 — biz.*
-- ──────────────────────────────────────────────────────────────

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','biz','biz.cache',
 '1',
 '캐시 사용 여부 (1=사용)','BOOLEAN',10,'Y','^local^dev^prod^',
 '0=사용안함, 1=사용',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','biz','biz.feature.coupon',
 '1',
 '쿠폰 기능 활성화','BOOLEAN',20,'Y','^local^dev^prod^',
 '0=비활성, 1=활성',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','biz','biz.feature.review',
 '1',
 '리뷰 기능 활성화','BOOLEAN',30,'Y','^local^dev^prod^',
 '0=비활성, 1=활성',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','biz','biz.member',
 '1',
 '회원 기능 활성화','BOOLEAN',40,'Y','^local^dev^prod^',
 '0=비활성, 1=활성',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','biz','biz.order',
 '1',
 '주문 기능 활성화','BOOLEAN',50,'Y','^local^dev^prod^',
 '0=비활성, 1=활성',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','biz','biz.payment',
 '1',
 '결제 기능 활성화','BOOLEAN',60,'Y','^local^dev^prod^',
 '0=비활성, 1=활성',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;

INSERT INTO shopjoy_2604.sy_prop (site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date)
VALUES ('2604010000000001','biz','biz.site',
 '2604010000000001',
 '대표 사이트 ID','STRING',70,'Y','^local^dev^prod^',
 '멀티사이트 대표 site_id — FO 기본 사이트 격리 기준',
 'SYSTEM','2026-06-20 00:00:00')
ON CONFLICT (site_id,path_id,prop_key,COALESCE(prop_profile,'')) DO UPDATE
  SET prop_value=EXCLUDED.prop_value, upd_by='SYSTEM', upd_date=CURRENT_TIMESTAMP;
