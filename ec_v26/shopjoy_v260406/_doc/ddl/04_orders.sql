-- =====================================================
-- ShopJoy v2.6.0406 - orders 테이블
-- 설명: 주문 정보
-- =====================================================

CREATE TABLE IF NOT EXISTS orders (
  order_id VARCHAR(50) PRIMARY KEY COMMENT '주문 ID (ORD-YYYY-XXX)',
  user_id INT NOT NULL COMMENT '사용자 ID',
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '주문일시',
  total_price DECIMAL(10, 2) NOT NULL COMMENT '총 주문액',
  shipping_fee DECIMAL(10, 2) DEFAULT 0 COMMENT '배송료',
  discount_amount DECIMAL(10, 2) DEFAULT 0 COMMENT '할인액',
  final_price DECIMAL(10, 2) NOT NULL COMMENT '최종 결제액',
  status ENUM('PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED') DEFAULT 'PENDING' COMMENT '주문 상태',
  payment_status ENUM('UNPAID', 'PARTIAL', 'PAID', 'REFUNDED') DEFAULT 'UNPAID' COMMENT '결제 상태',
  payment_method VARCHAR(50) COMMENT '결제 수단 (CARD, TRANSFER, CASH)',
  shipping_address VARCHAR(255) COMMENT '배송 주소',
  shipping_detail_address VARCHAR(255) COMMENT '배송 상세주소',
  shipping_postal_code VARCHAR(10) COMMENT '배송 우편번호',
  recipient_name VARCHAR(100) COMMENT '수령인명',
  recipient_phone VARCHAR(20) COMMENT '수령인 연락처',
  special_request TEXT COMMENT '특수 요청사항',
  courier_name VARCHAR(100) COMMENT '배송사명 (CJ, 롯데, 한진 등)',
  tracking_number VARCHAR(50) COMMENT '추적 번호',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '등록일',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
  expected_delivery_date DATE COMMENT '예상 배송일',
  delivered_at TIMESTAMP NULL COMMENT '배송완료 일시',
  cancelled_at TIMESTAMP NULL COMMENT '취소 일시',
  cancelled_reason TEXT COMMENT '취소 사유',
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_order_date (order_date),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='주문 정보';
