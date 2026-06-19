-- ============================================================
-- sy_prop prop_profile 환경별 분류 + cdn.url.* 신규 추가
-- 2026-06-18
--
-- prop_profile 형식: ^local^dev^prod^ (비어있으면 전체 환경 공통)
--
-- 분류 기준:
--   전체 공통 (NULL)    : 비즈니스 설정 (회원/주문/프로모션 임계값 등)
--   ^local^dev^         : 개발 전용 테스트 키/더미값 (운영에서는 별도 값 필요)
--   ^local^             : 로컬 개발 전용
--   ^prod^              : 운영 전용 설정
-- ============================================================

SET search_path TO shopjoy_2604;

-- ============================================================
-- [1] 기존 prop_profile 환경 분류 적용
-- ============================================================

-- ext.sdk.* — 외부 SDK 키: local/dev는 테스트키, prod는 실키 별도 등록 필요
UPDATE sy_prop SET prop_profile = '^local^dev^'
WHERE path_id = 'ext.sdk';

-- payment.kakao.cid = TC0ONETIME : 카카오페이 테스트 CID (prod는 실 CID로 교체)
UPDATE sy_prop SET prop_profile = '^local^dev^'
WHERE path_id = 'payment.kakao.cid' AND prop_key = 'cid' AND prop_value = 'TC0ONETIME';

-- payment.toss.client_key = test_ck_* : 토스 테스트 클라이언트키 (prod는 live_ck_로 교체)
UPDATE sy_prop SET prop_profile = '^local^dev^'
WHERE path_id = 'payment.toss.client_k' AND prop_key = 'client_key' AND prop_value LIKE 'test_ck_%';

-- site.email.smtp.host = smtp.gmail.com : 개발용 Gmail SMTP (prod는 SES/SendGrid 등)
UPDATE sy_prop SET prop_profile = '^local^dev^'
WHERE path_id = 'site.email.smtp.host' AND prop_value = 'smtp.gmail.com';

-- site.email.smtp.port = 587 : Gmail SMTP 포트 (prod 환경에 따라 다름)
UPDATE sy_prop SET prop_profile = '^local^dev^'
WHERE path_id = 'site.email.smtp.port' AND prop_value = '587';

-- site.sms.api_key = sk_xxxxx : SMS 테스트 API 키 (prod는 실 키로 교체)
UPDATE sy_prop SET prop_profile = '^local^dev^'
WHERE path_id = 'site.sms.api_key' AND prop_key = 'api_key' AND prop_value LIKE '%xxxxx%';

-- ============================================================
-- [2] cdn.url.* 신규 path + prop 추가
-- ============================================================

-- sy_path: _grp_cdn 그룹 (없으면 추가)
INSERT INTO sy_path (path_id, biz_cd, parent_path_id, path_label, sort_ord, use_yn, reg_by, reg_date)
VALUES ('_grp_cdn', 'sy_prop', 'sy_prop', 'cdn', 70, 'Y', 'admin', NOW())
ON CONFLICT (path_id) DO NOTHING;

-- sy_path: cdn.url 리프 경로
INSERT INTO sy_path (path_id, biz_cd, parent_path_id, path_label, sort_ord, use_yn, reg_by, reg_date)
VALUES ('cdn.url', 'sy_prop', '_grp_cdn', 'url', 1, 'Y', 'admin', NOW())
ON CONFLICT (path_id) DO NOTHING;

-- sy_prop: cdn.url.base — 기본 CDN URL (비워두면 상대경로 사용)
INSERT INTO sy_prop (site_id, path_id, prop_key, prop_value, prop_label, prop_type_cd, sort_ord, use_yn, prop_remark, prop_profile, reg_by, reg_date)
VALUES ('2604010000000001', 'cdn.url', 'cdn.url.base', '', '기본 CDN URL', 'STRING', 1, 'N', '정적파일(이미지·JS·CSS) 기본 CDN 도메인. 비워두면 상대경로 사용. 예: https://cdn.myshop.com', NULL, 'admin', NOW())
ON CONFLICT (site_id, path_id, prop_key) DO NOTHING;

-- sy_prop: cdn.url.image — 이미지 전용 CDN URL (비워두면 cdn.url.base 사용)
INSERT INTO sy_prop (site_id, path_id, prop_key, prop_value, prop_label, prop_type_cd, sort_ord, use_yn, prop_remark, prop_profile, reg_by, reg_date)
VALUES ('2604010000000001', 'cdn.url', 'cdn.url.image', '', '이미지 CDN URL', 'STRING', 2, 'N', '상품·블로그 이미지 전용 CDN. 비워두면 cdn.url.base 사용. 예: https://img.myshop.com', NULL, 'admin', NOW())
ON CONFLICT (site_id, path_id, prop_key) DO NOTHING;

-- sy_prop: cdn.url.upload — 파일 업로드 저장 경로 prefix
INSERT INTO sy_prop (site_id, path_id, prop_key, prop_value, prop_label, prop_type_cd, sort_ord, use_yn, prop_remark, prop_profile, reg_by, reg_date)
VALUES ('2604010000000001', 'cdn.url', 'cdn.url.upload', '/uploads', '업로드 기본 경로', 'STRING', 3, 'Y', '파일 업로드 저장 기본 경로 prefix. 예: /uploads', NULL, 'admin', NOW())
ON CONFLICT (site_id, path_id, prop_key) DO NOTHING;

-- sy_prop: cdn.url.static — 정적 파일 서빙 경로 prefix
INSERT INTO sy_prop (site_id, path_id, prop_key, prop_value, prop_label, prop_type_cd, sort_ord, use_yn, prop_remark, prop_profile, reg_by, reg_date)
VALUES ('2604010000000001', 'cdn.url', 'cdn.url.static', '/static', '정적 파일 기본 경로', 'STRING', 4, 'Y', 'assets/ 이하 정적 파일 서빙 경로 prefix. 예: /static', NULL, 'admin', NOW())
ON CONFLICT (site_id, path_id, prop_key) DO NOTHING;

-- ============================================================
-- [3] cdn.url.* prop_label 한글 업데이트 (화면에서 직접 수정 가능)
-- ============================================================
-- UPDATE sy_prop SET prop_label='기본 CDN URL'    WHERE prop_key='cdn.url.base';
-- UPDATE sy_prop SET prop_label='이미지 CDN URL'   WHERE prop_key='cdn.url.image';
-- UPDATE sy_prop SET prop_label='업로드 기본 경로'  WHERE prop_key='cdn.url.upload';
-- UPDATE sy_prop SET prop_label='정적 파일 기본 경로' WHERE prop_key='cdn.url.static';

-- ============================================================
-- 확인 쿼리
-- ============================================================
SELECT path_id, prop_key, prop_label, prop_value, prop_profile
FROM sy_prop
WHERE prop_profile IS NOT NULL OR path_id = 'cdn.url'
ORDER BY path_id, sort_ord;
