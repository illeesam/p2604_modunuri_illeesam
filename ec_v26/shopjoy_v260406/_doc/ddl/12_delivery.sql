-- =====================================================
-- ShopJoy v2.6.0406 - delivery 테이블
-- 설명: 배송 정보
-- =====================================================

CREATE TABLE IF NOT EXISTS delivery (
  delivery_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '배송 ID',
  order_id VARCHAR(50) NOT NULL COMMENT '주문 ID',
  courier_company VARCHAR(100) COMMENT '배송사 (CJ대한통운, 롯데택배, 한진택배)',
  tracking_number VARCHAR(50) UNIQUE COMMENT '추적 번호',
  status ENUM('PENDING', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'FAILED') DEFAULT 'PENDING' COMMENT '배송 상태',
  shipped_at TIMESTAMP NULL COMMENT '배송 시작일',
  estimated_delivery_at TIMESTAMP NULL COMMENT '예상 배송일',
  delivered_at TIMESTAMP NULL COMMENT '배송 완료일',
  signature_required BOOLEAN DEFAULT FALSE COMMENT '서명 필요 여부',
  special_instructions TEXT COMMENT '특별 지시사항',
  last_location VARCHAR(255) COMMENT '마지막 위치',
  last_update_at TIMESTAMP NULL COMMENT '마지막 업데이트',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '등록일',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
  INDEX idx_order_id (order_id),
  INDEX idx_tracking_number (tracking_number),
  INDEX idx_status (status),
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='배송 정보';
