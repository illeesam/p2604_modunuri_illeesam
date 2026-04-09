-- =====================================================
-- ShopJoy v2.6.0406 - order_items 테이블
-- 설명: 주문 상품 상세
-- =====================================================

CREATE TABLE IF NOT EXISTS order_items (
  order_item_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '주문 상품 ID',
  order_id VARCHAR(50) NOT NULL COMMENT '주문 ID',
  product_id INT NOT NULL COMMENT '상품 ID',
  product_name VARCHAR(255) NOT NULL COMMENT '상품명 (주문 시점의 이름)',
  emoji VARCHAR(10) COMMENT '상품 이모지',
  color VARCHAR(100) COMMENT '색상',
  size VARCHAR(20) COMMENT '사이즈',
  quantity INT NOT NULL COMMENT '수량',
  unit_price DECIMAL(10, 2) NOT NULL COMMENT '단가',
  product_discount DECIMAL(10, 2) DEFAULT 0 COMMENT '상품 할인액',
  subtotal DECIMAL(10, 2) NOT NULL COMMENT '소계 (unit_price * quantity - product_discount)',
  product_coupon_id INT COMMENT '상품 쿠폰 ID',
  product_coupon_name VARCHAR(100) COMMENT '상품 쿠폰명',
  product_coupon_discount DECIMAL(10, 2) DEFAULT 0 COMMENT '상품 쿠폰 할인액',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '등록일',
  INDEX idx_order_id (order_id),
  INDEX idx_product_id (product_id),
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='주문 상품 상세';
