-- =====================================================
-- ShopJoy v2.6.0406 - users 테이블
-- 설명: 사용자/회원 정보
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
  user_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '사용자 ID',
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '로그인 아이디',
  password VARCHAR(255) NOT NULL COMMENT '비밀번호 (해시)',
  email VARCHAR(100) NOT NULL UNIQUE COMMENT '이메일',
  name VARCHAR(100) NOT NULL COMMENT '이름',
  phone VARCHAR(20) COMMENT '전화번호',
  birth_date DATE COMMENT '생년월일',
  gender ENUM('M', 'F', 'OTHER') COMMENT '성별',
  role ENUM('USER', 'ADMIN', 'MANAGER') DEFAULT 'USER' COMMENT '사용자 권한',
  status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED') DEFAULT 'ACTIVE' COMMENT '계정 상태',
  address VARCHAR(255) COMMENT '주소',
  detail_address VARCHAR(255) COMMENT '상세주소',
  postal_code VARCHAR(10) COMMENT '우편번호',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '가입일',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
  last_login_at TIMESTAMP NULL COMMENT '마지막 로그인',
  profile_image_url VARCHAR(255) COMMENT '프로필 이미지 URL',
  bio TEXT COMMENT '자기소개',
  is_email_verified BOOLEAN DEFAULT FALSE COMMENT '이메일 인증 여부',
  is_phone_verified BOOLEAN DEFAULT FALSE COMMENT '휴대폰 인증 여부',
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자/회원 정보';
