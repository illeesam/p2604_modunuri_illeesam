-- =====================================================
-- ShopJoy v2.6.0406 - site_config 테이블
-- 설명: 사이트 전역 설정
-- =====================================================

CREATE TABLE IF NOT EXISTS site_config (
  config_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '설정 ID',
  config_key VARCHAR(100) NOT NULL UNIQUE COMMENT '설정 키',
  config_value LONGTEXT COMMENT '설정 값 (JSON 가능)',
  config_type ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON') DEFAULT 'STRING' COMMENT '설정 타입',
  description VARCHAR(255) COMMENT '설명',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
  updated_by INT COMMENT '수정자 (user_id)',
  UNIQUE KEY uq_config_key (config_key),
  FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사이트 전역 설정';
