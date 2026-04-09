-- =====================================================
-- ShopJoy v2.6.0406 - events 테이블
-- 설명: 프로모션/이벤트
-- =====================================================

CREATE TABLE IF NOT EXISTS events (
  event_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '이벤트 ID',
  event_name VARCHAR(255) NOT NULL COMMENT '이벤트명',
  event_type ENUM('PROMOTION', 'FLASH_SALE', 'SEASONAL', 'SPECIAL', 'CONTEST') DEFAULT 'PROMOTION' COMMENT '이벤트 종류',
  description TEXT COMMENT '이벤트 설명',
  banner_image_url VARCHAR(255) COMMENT '배너 이미지 URL',
  thumbnail_image_url VARCHAR(255) COMMENT '썸네일 이미지 URL',
  start_date TIMESTAMP NOT NULL COMMENT '시작 일시',
  end_date TIMESTAMP NOT NULL COMMENT '종료 일시',
  status ENUM('PENDING', 'ACTIVE', 'INACTIVE', 'CLOSED') DEFAULT 'PENDING' COMMENT '이벤트 상태',
  target_products JSON COMMENT '대상 상품 ID 배열',
  discount_type ENUM('FIXED', 'PERCENTAGE') COMMENT '할인 종류',
  discount_value DECIMAL(10, 2) COMMENT '할인액 또는 할인율',
  max_discount_amount DECIMAL(10, 2) COMMENT '최대 할인액',
  event_url VARCHAR(255) COMMENT '이벤트 상세 페이지 URL',
  priority INT DEFAULT 0 COMMENT '표시 우선순위 (높을수록 상위)',
  is_featured BOOLEAN DEFAULT FALSE COMMENT '메인 이벤트 여부',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
  created_by INT COMMENT '생성자 (user_id)',
  INDEX idx_status (status),
  INDEX idx_start_date (start_date),
  INDEX idx_end_date (end_date),
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='프로모션/이벤트';
