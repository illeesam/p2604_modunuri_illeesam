-- =====================================================
-- ShopJoy v2.6.0406 - coupons 테이블
-- 설명: 쿠폰 정보
-- =====================================================

CREATE TABLE IF NOT EXISTS coupons (
  coupon_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '쿠폰 ID',
  coupon_name VARCHAR(100) NOT NULL COMMENT '쿠폰명',
  coupon_type ENUM('FIXED', 'PERCENTAGE') NOT NULL COMMENT '쿠폰 종류 (고정액, 할인율)',
  discount_value DECIMAL(10, 2) NOT NULL COMMENT '할인액 또는 할인율 (%)',
  max_discount_amount DECIMAL(10, 2) COMMENT '최대 할인액 (할인율인 경우)',
  min_purchase_amount DECIMAL(10, 2) DEFAULT 0 COMMENT '최소 구매액',
  target_type ENUM('PRODUCT', 'CATEGORY', 'ORDER', 'SHIPPING') DEFAULT 'ORDER' COMMENT '쿠폰 대상',
  target_id INT COMMENT '대상 ID (product_id 또는 category)',
  available_from DATE COMMENT '사용 시작일',
  available_until DATE COMMENT '사용 종료일',
  usage_limit INT COMMENT '총 사용 제한 수',
  usage_per_user INT DEFAULT 1 COMMENT '사용자당 사용 제한 수',
  current_usage INT DEFAULT 0 COMMENT '현재 사용 횟수',
  status ENUM('ACTIVE', 'INACTIVE', 'EXPIRED') DEFAULT 'ACTIVE' COMMENT '쿠폰 상태',
  description TEXT COMMENT '쿠폰 설명',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
  created_by INT COMMENT '생성자 (user_id)',
  INDEX idx_status (status),
  INDEX idx_available_from (available_from),
  INDEX idx_available_until (available_until),
  FOREIGN KEY (created_by) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='쿠폰 정보';
