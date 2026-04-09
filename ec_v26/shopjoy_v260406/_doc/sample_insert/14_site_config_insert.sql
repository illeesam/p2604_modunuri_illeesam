-- =====================================================
-- ShopJoy v2.6.0406 - site_config 샘플 데이터
-- =====================================================

INSERT INTO site_config (
  config_key, config_value, config_type, description, updated_by
) VALUES
-- 기본 설정
('SITE_NAME', 'ShopJoy', 'STRING', '사이트명', 1),
('SITE_DOMAIN', 'https://shopjoy.example.com', 'STRING', '사이트 도메인', 1),
('SITE_DESCRIPTION', '최고의 의류 쇼핑 경험', 'STRING', '사이트 설명', 1),
('SITE_LOGO_URL', 'https://example.com/logo.png', 'STRING', '로고 URL', 1),

-- 배송 설정
('SHIPPING_FREE_THRESHOLD', '10000', 'NUMBER', '무료배송 기준금액 (원)', 1),
('SHIPPING_FEE', '3000', 'NUMBER', '기본 배송료 (원)', 1),
('SHIPPING_HANDLING_DAYS', '3', 'NUMBER', '배송 준비일 (일)', 1),

-- 환불 정책
('REFUND_DEADLINE_DAYS', '7', 'NUMBER', '환불 신청 기한 (일)', 1),
('REFUND_PROCESSING_DAYS', '5', 'NUMBER', '환불 처리 기간 (일)', 1),

-- 회원 설정
('MEMBER_REGISTRATION_BONUS', '10000', 'NUMBER', '회원가입 보너스 (원)', 1),
('MEMBER_EMAIL_VERIFICATION_REQUIRED', 'true', 'BOOLEAN', '이메일 인증 필수 여부', 1),

-- 결제 설정
('PAYMENT_METHODS', JSON_OBJECT('CARD', true, 'TRANSFER', true, 'CASH', true, 'MOBILE', false),
 'JSON', '활성화된 결제 수단', 1),

-- 보안 설정
('PASSWORD_MIN_LENGTH', '8', 'NUMBER', '비밀번호 최소 길이', 1),
('SESSION_TIMEOUT_MINUTES', '30', 'NUMBER', '세션 타임아웃 (분)', 1),
('LOGIN_ATTEMPT_LIMIT', '5', 'NUMBER', '로그인 시도 제한 횟수', 1),

-- 문의/FAQ 설정
('INQUIRY_RESPONSE_DEADLINE_HOURS', '48', 'NUMBER', '문의 답변 기한 (시간)', 1),
('MAX_UPLOAD_FILE_SIZE_MB', '10', 'NUMBER', '파일 업로드 최대 크기 (MB)', 1),

-- 마케팅 설정
('MARKETING_EMAIL_ENABLED', 'true', 'BOOLEAN', '마케팅 이메일 사용 여부', 1),
('NEWSLETTER_FREQUENCY', 'WEEKLY', 'STRING', '뉴스레터 발송 주기 (DAILY, WEEKLY, MONTHLY)', 1),

-- API 설정
('API_VERSION', 'v1.0', 'STRING', 'API 버전', 1),
('API_RATE_LIMIT_PER_HOUR', '1000', 'NUMBER', 'API 시간당 요청 제한', 1),

-- 운영 설정
('MAINTENANCE_MODE', 'false', 'BOOLEAN', '유지보수 모드 여부', 1),
('MAINTENANCE_MESSAGE', '', 'STRING', '유지보수 메시지', 1),
('CUSTOMER_SERVICE_HOURS', '09:00~18:00', 'STRING', '고객지원 운영시간', 1),
('CUSTOMER_SERVICE_EMAIL', 'support@shopjoy.example.com', 'STRING', '고객지원 이메일', 1),
('CUSTOMER_SERVICE_PHONE', '1234-5678', 'STRING', '고객지원 전화번호', 1),

-- 통계/분석
('GOOGLE_ANALYTICS_ID', 'G-XXXXXXXXXX', 'STRING', 'Google Analytics ID', 1),
('NAVER_ANALYTICS_ID', 'XXXXXXXXXXXX', 'STRING', 'Naver Analytics ID', 1),

-- 약관
('TERMS_OF_SERVICE_URL', 'https://example.com/terms', 'STRING', '이용약관 URL', 1),
('PRIVACY_POLICY_URL', 'https://example.com/privacy', 'STRING', '개인정보처리방침 URL', 1);

-- =====================================================
-- 사이트 전역 설정
-- 운영 중 동적으로 변경 가능한 설정값들
-- =====================================================
