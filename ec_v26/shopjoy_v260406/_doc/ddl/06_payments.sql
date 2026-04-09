-- =====================================================
-- ShopJoy v2.6.0406 - payments 테이블
-- 설명: 결제 기록
-- =====================================================

CREATE TABLE IF NOT EXISTS payments (
  payment_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '결제 ID',
  order_id VARCHAR(50) NOT NULL COMMENT '주문 ID',
  payment_method ENUM('CARD', 'TRANSFER', 'CASH', 'MOBILE', 'CRYPTO') NOT NULL COMMENT '결제 수단',
  payment_status ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED') DEFAULT 'PENDING' COMMENT '결제 상태',
  amount DECIMAL(10, 2) NOT NULL COMMENT '결제액',
  payer_name VARCHAR(100) COMMENT '결제자명',
  payer_phone VARCHAR(20) COMMENT '결제자 연락처',
  bank_name VARCHAR(100) COMMENT '은행명 (TRANSFER인 경우)',
  account_number VARCHAR(50) COMMENT '계좌번호 (마스킹됨)',
  card_name VARCHAR(100) COMMENT '카드사 (CARD인 경우)',
  card_number VARCHAR(20) COMMENT '카드번호 (마스킹됨)',
  transaction_id VARCHAR(100) UNIQUE COMMENT '거래 고유 ID (PG사로부터)',
  receipt_url VARCHAR(255) COMMENT '영수증 URL',
  paid_at TIMESTAMP NULL COMMENT '결제 완료 일시',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '결제 요청 일시',
  failure_reason TEXT COMMENT '결제 실패 사유',
  INDEX idx_order_id (order_id),
  INDEX idx_payment_status (payment_status),
  INDEX idx_paid_at (paid_at),
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='결제 기록';
