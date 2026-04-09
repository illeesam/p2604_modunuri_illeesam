-- =====================================================
-- ShopJoy v2.6.0406 - user_coupons 테이블
-- 설명: 사용자별 쿠폰 소유/사용 기록
-- =====================================================

CREATE TABLE IF NOT EXISTS user_coupons (
  user_coupon_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '사용자 쿠폰 ID',
  user_id INT NOT NULL COMMENT '사용자 ID',
  coupon_id INT NOT NULL COMMENT '쿠폰 ID',
  is_used BOOLEAN DEFAULT FALSE COMMENT '사용 여부',
  used_order_id VARCHAR(50) COMMENT '사용된 주문 ID',
  used_at TIMESTAMP NULL COMMENT '사용 일시',
  obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '획득 일시',
  expires_at TIMESTAMP NULL COMMENT '만료 일시',
  UNIQUE KEY uq_user_coupon (user_id, coupon_id),
  INDEX idx_user_id (user_id),
  INDEX idx_coupon_id (coupon_id),
  INDEX idx_is_used (is_used),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (coupon_id) REFERENCES coupons(coupon_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자별 쿠폰 소유/사용 기록';
