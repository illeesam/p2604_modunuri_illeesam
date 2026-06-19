-- ============================================================
-- sy_prop — 외부 연동 설정 샘플 데이터
--
-- propKey 규칙: yml 경로를 그대로 사용 (역전환 시 키 변환 없음)
--   예) app.ext-sdk.google-client-id  →  ${app.ext-sdk.google-client-id:}
--
-- propProfile 정책:
--   NULL / 빈값          → 모든 프로파일 공통 (변경 없는 고정 엔드포인트)
--   ^local^dev^          → local + dev 공통 (테스트 키 / 테스트 SMTP 등)
--   ^prod^               → 운영 전용 (실 키)
--   ^local^dev^prod^     → 세 프로파일 모두 같은 값 (region, 공개 URL 등)
--     ※ ^local^dev^prod^ 는 사실상 NULL과 동일하지만 "명시적으로 관리한다" 는 의도를 담을 때 사용
--
-- prop_type_cd:
--   STRING  → 문자열 (기본)
--   SECRET  → 화면 마스킹 대상 (*-key, *-password)
--   NUMBER  → 숫자
--
-- path_id: propKey의 상위 경로 (sy_path.path_id 참조용, 없어도 무방)
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- [1] 소셜 로그인 SDK 키 — app.ext-sdk.*
--     클라이언트(브라우저) SDK 초기화용 공개 키
--     local/dev는 테스트 앱, prod는 실 앱 → 2행으로 관리
-- ──────────────────────────────────────────────────────────────

-- Google OAuth2 Client ID
INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000001','SITE000001','app.ext-sdk','app.ext-sdk.google-client-id',
 '207844440856-5ib9mk6frvt7rfpt8823e48c3c0lavth.apps.googleusercontent.com',
 'Google OAuth2 클라이언트 ID','STRING',10,'Y','^local^dev^',
 'Google Cloud Console → OAuth2 클라이언트 → 클라이언트 ID (테스트 앱)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000002','SITE000001','app.ext-sdk','app.ext-sdk.google-client-id',
 '',
 'Google OAuth2 클라이언트 ID','STRING',10,'Y','^prod^',
 'Google Cloud Console → OAuth2 클라이언트 → 클라이언트 ID (운영 앱)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

-- Kakao JavaScript 키
INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000003','SITE000001','app.ext-sdk','app.ext-sdk.kakao-js-key',
 '',
 'Kakao JavaScript 키','STRING',20,'Y','^local^dev^',
 '카카오 디벨로퍼스 → 내 애플리케이션 → 앱 키 → JavaScript 키 (테스트 앱)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000004','SITE000001','app.ext-sdk','app.ext-sdk.kakao-js-key',
 '',
 'Kakao JavaScript 키','STRING',20,'Y','^prod^',
 '카카오 디벨로퍼스 → 내 애플리케이션 → 앱 키 → JavaScript 키 (운영 앱)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

-- Naver OAuth2 Client ID
INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000005','SITE000001','app.ext-sdk','app.ext-sdk.naver-client-id',
 '',
 'Naver OAuth2 클라이언트 ID','STRING',30,'Y','^local^dev^',
 '네이버 개발자센터 → 애플리케이션 → Client ID (테스트 앱)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000006','SITE000001','app.ext-sdk','app.ext-sdk.naver-client-id',
 '',
 'Naver OAuth2 클라이언트 ID','STRING',30,'Y','^prod^',
 '네이버 개발자센터 → 애플리케이션 → Client ID (운영 앱)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

-- Naver OAuth2 Callback URL (프로파일별 도메인이 다름 → 3행)
INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000007','SITE000001','app.ext-sdk','app.ext-sdk.naver-callback-url',
 'http://127.0.0.1:5501/',
 'Naver OAuth2 콜백 URL','STRING',40,'Y','^local^',
 '네이버 로그인 후 리다이렉트 URL — local: Live Server 주소',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000008','SITE000001','app.ext-sdk','app.ext-sdk.naver-callback-url',
 'https://dev.shopjoy.com/',
 'Naver OAuth2 콜백 URL','STRING',40,'Y','^dev^',
 '네이버 로그인 후 리다이렉트 URL — dev 서버 도메인',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000009','SITE000001','app.ext-sdk','app.ext-sdk.naver-callback-url',
 'https://www.shopjoy.com/',
 'Naver OAuth2 콜백 URL','STRING',40,'Y','^prod^',
 '네이버 로그인 후 리다이렉트 URL — 운영 도메인',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

-- 토스 클라이언트 키 (FE용 공개 키)
INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000010','SITE000001','app.ext-sdk','app.ext-sdk.toss-client-key',
 'test_gck_docs_Ovk5rk1gB5Nrm6CzWlVWax',
 '토스페이먼츠 클라이언트 키 (FE)','STRING',50,'Y','^local^dev^',
 '토스 디벨로퍼스 → 상점 → 클라이언트 키 (test_gck_*)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000011','SITE000001','app.ext-sdk','app.ext-sdk.toss-client-key',
 '',
 '토스페이먼츠 클라이언트 키 (FE)','STRING',50,'Y','^prod^',
 '토스 디벨로퍼스 → 상점 → 클라이언트 키 (live_gck_*)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

-- Kakao 지도 JS 키
INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000012','SITE000001','app.ext-sdk','app.ext-sdk.kakao-map-js-key',
 '',
 'Kakao 지도 JavaScript 키','STRING',60,'Y','^local^dev^',
 '카카오 디벨로퍼스 → 앱 키 → JavaScript 키 (카카오맵 테스트 앱)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000013','SITE000001','app.ext-sdk','app.ext-sdk.kakao-map-js-key',
 '',
 'Kakao 지도 JavaScript 키','STRING',60,'Y','^prod^',
 '카카오 디벨로퍼스 → 앱 키 → JavaScript 키 (운영 앱)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

-- Naver 지도 Client ID
INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000014','SITE000001','app.ext-sdk','app.ext-sdk.naver-map-client-id',
 '',
 'Naver 지도 Client ID','STRING',70,'Y','^local^dev^',
 'NCP 콘솔 → Application → Client ID — ncpClientId (테스트 앱)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000015','SITE000001','app.ext-sdk','app.ext-sdk.naver-map-client-id',
 '',
 'Naver 지도 Client ID','STRING',70,'Y','^prod^',
 'NCP 콘솔 → Application → Client ID — ncpClientId (운영 앱)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

-- ──────────────────────────────────────────────────────────────
-- [2] 소셜 인증 서버 엔드포인트 — auth.social.*
--     외부 제공자 URL은 거의 변경되지 않음 → ^local^dev^prod^ 단일 행
-- ──────────────────────────────────────────────────────────────
INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000020','SITE000001','auth.social','auth.social.google-userinfo-url',
 'https://www.googleapis.com/oauth2/v3/userinfo',
 'Google userinfo URL','STRING',10,'Y','^local^dev^prod^',
 'Google OAuth2 토큰 검증 엔드포인트',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000021','SITE000001','auth.social','auth.social.kakao-userinfo-url',
 'https://kapi.kakao.com/v2/user/me',
 'Kakao userinfo URL','STRING',20,'Y','^local^dev^prod^',
 '카카오 OAuth2 토큰 검증 엔드포인트',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000022','SITE000001','auth.social','auth.social.naver-userinfo-url',
 'https://openapi.naver.com/v1/nid/me',
 'Naver userinfo URL','STRING',30,'Y','^local^dev^prod^',
 '네이버 OAuth2 토큰 검증 엔드포인트',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000023','SITE000001','auth.social','auth.social.default-site-id',
 '2604010000000001',
 '소셜 가입 기본 사이트 ID','STRING',40,'Y','^local^dev^prod^',
 'siteId 미전달 소셜 가입/매칭 시 사용할 대표 사이트 ID',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

-- ──────────────────────────────────────────────────────────────
-- [3] 토스페이먼츠 — toss.*
--     confirm-url / cancel-url-base: 고정 엔드포인트 → ^local^dev^prod^
--     client-key / secret-key: 테스트 vs 운영 분리
-- ──────────────────────────────────────────────────────────────
INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000030','SITE000001','toss','toss.confirm-url',
 'https://api.tosspayments.com/v1/payments/confirm',
 '토스 결제승인 API URL','STRING',10,'Y','^local^dev^prod^',
 '토스 공식 엔드포인트 — 변경 가능성 낮음',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000031','SITE000001','toss','toss.cancel-url-base',
 'https://api.tosspayments.com/v1/payments',
 '토스 결제취소 API 베이스 URL','STRING',20,'Y','^local^dev^prod^',
 '실제 호출: {cancel-url-base}/{paymentKey}/cancel',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000032','SITE000001','toss','toss.client-key',
 'test_gck_docs_Ovk5rk1gB5Nrm6CzWlVWax',
 '토스 클라이언트 키 (FE)','STRING',30,'Y','^local^dev^',
 '토스 디벨로퍼스 → 상점 → 클라이언트 키 (test_gck_*)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000033','SITE000001','toss','toss.client-key',
 '',
 '토스 클라이언트 키 (FE)','STRING',30,'Y','^prod^',
 '토스 디벨로퍼스 → 상점 → 클라이언트 키 (live_gck_*)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000034','SITE000001','toss','toss.secret-key',
 'test_gsk_docs_GjLJoQ1aVZ8yMnpZ0vlrrPmOoBN0',
 '토스 시크릿 키 (BE)','SECRET',40,'Y','^local^dev^',
 '토스 디벨로퍼스 → 상점 → 시크릿 키 (test_gsk_*) — 절대 FE 노출 금지',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000035','SITE000001','toss','toss.secret-key',
 '',
 '토스 시크릿 키 (BE)','SECRET',40,'Y','^prod^',
 '토스 디벨로퍼스 → 상점 → 시크릿 키 (live_gsk_*)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

-- ──────────────────────────────────────────────────────────────
-- [4] 지도 공개 키 — map.*
--     브라우저 SDK용 공개 키, 도메인 허용으로 보호
-- ──────────────────────────────────────────────────────────────
INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000040','SITE000001','map','map.kakao-js-key',
 '',
 'Kakao 지도 JavaScript 키','STRING',10,'Y','^local^dev^',
 '카카오 디벨로퍼스 → JavaScript 키 (테스트 앱) — app.ext-sdk.kakao-map-js-key와 동일 역할, 이 키 우선 적용',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000041','SITE000001','map','map.kakao-js-key',
 '',
 'Kakao 지도 JavaScript 키','STRING',10,'Y','^prod^',
 '카카오 디벨로퍼스 → JavaScript 키 (운영 앱)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000042','SITE000001','map','map.naver-map-client-id',
 '',
 'Naver 지도 Client ID','STRING',20,'Y','^local^dev^',
 'NCP 콘솔 → Application → Client ID (테스트 앱)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000043','SITE000001','map','map.naver-map-client-id',
 '',
 'Naver 지도 Client ID','STRING',20,'Y','^prod^',
 'NCP 콘솔 → Application → Client ID (운영 앱)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

-- ──────────────────────────────────────────────────────────────
-- [5] 메일(SMTP) — spring.mail.* + app.mail.*
--     port / from-nm: 변경 없는 공통 → ^local^dev^prod^
--     host / username / password / from: 프로파일별 분리
-- ──────────────────────────────────────────────────────────────
INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000050','SITE000001','spring.mail','spring.mail.host',
 'smtp.gmail.com',
 'SMTP 호스트','STRING',10,'Y','^local^dev^',
 'Gmail SMTP (테스트/개발용) — smtp.gmail.com:587',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000051','SITE000001','spring.mail','spring.mail.host',
 '',
 'SMTP 호스트','STRING',10,'Y','^prod^',
 '운영 SMTP 호스트 (예: ses.ap-northeast-2.amazonaws.com)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000052','SITE000001','spring.mail','spring.mail.port',
 '587',
 'SMTP 포트','NUMBER',20,'Y','^local^dev^prod^',
 '587(STARTTLS) / 465(SSL) / 25(비암호화)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000053','SITE000001','spring.mail','spring.mail.username',
 'illeesam4@gmail.com',
 'SMTP 계정 (발신자)','STRING',30,'Y','^local^dev^',
 'Gmail 앱 비밀번호용 계정 — 2단계 인증 활성화 후 앱 비밀번호 발급 필수',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000054','SITE000001','spring.mail','spring.mail.username',
 '',
 'SMTP 계정 (발신자)','STRING',30,'Y','^prod^',
 '운영 SMTP 계정',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000055','SITE000001','spring.mail','spring.mail.password',
 'song5544!!!',
 'SMTP 비밀번호 (앱 비밀번호)','SECRET',40,'Y','^local^dev^',
 'Gmail: 구글 계정 → 보안 → 2단계 인증 → 앱 비밀번호 발급 (16자리)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000056','SITE000001','spring.mail','spring.mail.password',
 '',
 'SMTP 비밀번호 (앱 비밀번호)','SECRET',40,'Y','^prod^',
 '운영 SMTP 비밀번호',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000057','SITE000001','app.mail','app.mail.from',
 'illeesam4@gmail.com',
 '발신자 이메일 주소','STRING',50,'Y','^local^dev^',
 '메일 From 헤더 — SMTP username과 동일하게 설정 권장',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000058','SITE000001','app.mail','app.mail.from',
 '',
 '발신자 이메일 주소','STRING',50,'Y','^prod^',
 '운영 발신자 주소 (예: noreply@shopjoy.com)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000059','SITE000001','app.mail','app.mail.from-nm',
 'ShopJoy 고객센터',
 '발신자 표시 이름','STRING',60,'Y','^local^dev^prod^',
 '메일 From 헤더의 표시 이름 — 전 프로파일 동일',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

-- ──────────────────────────────────────────────────────────────
-- [6] 파일 저장소 — app.file.*
--     storage-type / cdn-host: 프로파일별 분리
--     aws.region: 고정 → ^local^dev^prod^
--     access-key / secret-key: SECRET, 프로파일별 분리
-- ──────────────────────────────────────────────────────────────
INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000070','SITE000001','app.file','app.file.storage-type',
 'LOCAL',
 '파일 저장소 유형','STRING',10,'Y','^local^',
 'LOCAL / AWS_S3 / NCP_OBS',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000071','SITE000001','app.file','app.file.storage-type',
 'NCP_OBS',
 '파일 저장소 유형','STRING',10,'Y','^dev^prod^',
 'dev/prod: NCP Object Storage 사용',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000072','SITE000001','app.file','app.file.cdn-host',
 'http://localhost:3000/cdn',
 'CDN 호스트 URL','STRING',20,'Y','^local^',
 '파일 접근 기준 URL — sy_attach.cdn_host 에 저장됨',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000073','SITE000001','app.file','app.file.cdn-host',
 'https://cdn-ncp.shopjoy.com',
 'CDN 호스트 URL','STRING',20,'Y','^dev^',
 'dev CDN URL',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000074','SITE000001','app.file','app.file.cdn-host',
 'https://cdn.shopjoy.com',
 'CDN 호스트 URL','STRING',20,'Y','^prod^',
 '운영 CDN URL',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

-- AWS S3
INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000080','SITE000001','app.file.aws','app.file.aws.bucket-name',
 'shopjoy-files-local',
 'AWS S3 버킷 이름','STRING',10,'Y','^local^',
 'AWS S3 콘솔에서 생성한 버킷명',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000081','SITE000001','app.file.aws','app.file.aws.bucket-name',
 '',
 'AWS S3 버킷 이름','STRING',10,'Y','^dev^',
 'dev AWS S3 버킷',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000082','SITE000001','app.file.aws','app.file.aws.bucket-name',
 '',
 'AWS S3 버킷 이름','STRING',10,'Y','^prod^',
 '운영 AWS S3 버킷',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000083','SITE000001','app.file.aws','app.file.aws.region',
 'ap-northeast-2',
 'AWS 리전','STRING',20,'Y','^local^dev^prod^',
 'ap-northeast-2 (서울) — 전 프로파일 동일',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000084','SITE000001','app.file.aws','app.file.aws.access-key',
 '',
 'AWS Access Key ID','SECRET',30,'Y','^local^dev^',
 'IAM → 사용자 → 액세스 키 (AKIA…) — 테스트용',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000085','SITE000001','app.file.aws','app.file.aws.access-key',
 '',
 'AWS Access Key ID','SECRET',30,'Y','^prod^',
 'IAM → 사용자 → 액세스 키 (운영)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000086','SITE000001','app.file.aws','app.file.aws.secret-key',
 '',
 'AWS Secret Access Key','SECRET',40,'Y','^local^dev^',
 'IAM 액세스 키 생성 시 발급 — 최초 1회만 확인 가능 (테스트용)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000087','SITE000001','app.file.aws','app.file.aws.secret-key',
 '',
 'AWS Secret Access Key','SECRET',40,'Y','^prod^',
 'IAM Secret Key (운영)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000088','SITE000001','app.file.aws','app.file.aws.cdn-url',
 'https://cdn.shopjoy.com',
 'AWS CloudFront CDN URL','STRING',50,'Y','^local^dev^prod^',
 'CloudFront 배포 도메인 — 전 프로파일 동일 도메인, 버킷만 다름',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

-- NCP OBS
INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000090','SITE000001','app.file.ncp','app.file.ncp.bucket-name',
 'shopjoy-files-local',
 'NCP OBS 버킷 이름','STRING',10,'Y','^local^',
 'NCP 콘솔 → Object Storage → 버킷 이름',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000091','SITE000001','app.file.ncp','app.file.ncp.bucket-name',
 '',
 'NCP OBS 버킷 이름','STRING',10,'Y','^dev^',
 'dev NCP OBS 버킷',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000092','SITE000001','app.file.ncp','app.file.ncp.bucket-name',
 '',
 'NCP OBS 버킷 이름','STRING',10,'Y','^prod^',
 '운영 NCP OBS 버킷',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000093','SITE000001','app.file.ncp','app.file.ncp.endpoint',
 'https://obs.kr-standard.ncrdev.ncloud.com',
 'NCP OBS 엔드포인트','STRING',20,'Y','^local^',
 'NCP Object Storage 리전 엔드포인트 (로컬 테스트용)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000094','SITE000001','app.file.ncp','app.file.ncp.endpoint',
 'https://kr.object.ncloudstorage.com',
 'NCP OBS 엔드포인트','STRING',20,'Y','^dev^prod^',
 'dev/prod NCP OBS 엔드포인트',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000095','SITE000001','app.file.ncp','app.file.ncp.access-key',
 '',
 'NCP Access Key','SECRET',30,'Y','^local^dev^',
 'NCP 콘솔 → 마이페이지 → 인증키 관리 → Access Key (테스트용)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000096','SITE000001','app.file.ncp','app.file.ncp.access-key',
 '',
 'NCP Access Key','SECRET',30,'Y','^prod^',
 'NCP Access Key (운영)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000097','SITE000001','app.file.ncp','app.file.ncp.secret-key',
 '',
 'NCP Secret Key','SECRET',40,'Y','^local^dev^',
 'NCP 콘솔 → 마이페이지 → 인증키 관리 → Secret Key (테스트용)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000098','SITE000001','app.file.ncp','app.file.ncp.secret-key',
 '',
 'NCP Secret Key','SECRET',40,'Y','^prod^',
 'NCP Secret Key (운영)',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');

INSERT INTO shopjoy_2604.sy_prop (prop_id,site_id,path_id,prop_key,prop_value,prop_label,prop_type_cd,sort_ord,use_yn,prop_profile,prop_remark,reg_by,reg_date,upd_by,upd_date,row_status) VALUES
('PROP000099','SITE000001','app.file.ncp','app.file.ncp.cdn-url',
 'https://cdn-ncp.shopjoy.com',
 'NCP CDN URL','STRING',50,'Y','^local^dev^prod^',
 'NCP CDN 배포 URL (Image Optimizer 또는 CDN+ 도메인) — 전 프로파일 동일',
 'SYSTEM','2026-06-20 00:00:00',NULL,NULL,'N');
