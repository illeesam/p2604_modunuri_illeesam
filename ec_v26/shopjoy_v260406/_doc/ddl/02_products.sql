-- =====================================================
-- ShopJoy v2.6.0406 - products 테이블
-- 설명: 상품 정보
-- =====================================================

CREATE TABLE IF NOT EXISTS products (
  product_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '상품 ID',
  name VARCHAR(255) NOT NULL COMMENT '상품명',
  emoji VARCHAR(10) COMMENT '상품 이모지',
  category VARCHAR(100) COMMENT '카테고리',
  description TEXT COMMENT '상품 설명',
  price DECIMAL(10, 2) NOT NULL COMMENT '가격',
  original_price DECIMAL(10, 2) COMMENT '원가',
  discount_rate INT DEFAULT 0 COMMENT '할인율 (%)',
  stock INT DEFAULT 0 COMMENT '재고',
  rating DECIMAL(3, 2) DEFAULT 0 COMMENT '평점 (1~5)',
  review_count INT DEFAULT 0 COMMENT '리뷰 수',
  status ENUM('AVAILABLE', 'UNAVAILABLE', 'DISCONTINUED') DEFAULT 'AVAILABLE' COMMENT '판매 상태',
  is_featured BOOLEAN DEFAULT FALSE COMMENT '메인 상품 여부',
  image_url VARCHAR(255) COMMENT '메인 이미지 URL',
  image_urls JSON COMMENT '상품 이미지 URL 배열',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '등록일',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
  created_by INT COMMENT '등록자 (user_id)',
  updated_by INT COMMENT '수정자 (user_id)',
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_price (price),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (created_by) REFERENCES users(user_id),
  FOREIGN KEY (updated_by) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='상품 정보';
