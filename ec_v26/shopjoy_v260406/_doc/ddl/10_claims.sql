-- =====================================================
-- ShopJoy v2.6.0406 - claims 테이블
-- 설명: 반품/교환/환불 클레임
-- =====================================================

CREATE TABLE IF NOT EXISTS claims (
  claim_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '클레임 ID',
  order_id VARCHAR(50) NOT NULL COMMENT '주문 ID',
  user_id INT NOT NULL COMMENT '사용자 ID',
  claim_type ENUM('RETURN', 'EXCHANGE', 'REFUND', 'DAMAGE', 'WRONG_ITEM') NOT NULL COMMENT '클레임 종류',
  order_item_ids JSON COMMENT '해당 주문 상품 ID 배열',
  claim_reason TEXT NOT NULL COMMENT '클레임 사유',
  reason_detail TEXT COMMENT '상세 사유',
  refund_amount DECIMAL(10, 2) COMMENT '환불액',
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING' COMMENT '클레임 상태',
  bank_name VARCHAR(100) COMMENT '환불 계좌 은행',
  account_number VARCHAR(50) COMMENT '환불 계좌번호 (마스킹됨)',
  account_holder VARCHAR(100) COMMENT '환불 계좌주',
  image_urls JSON COMMENT '첨부 이미지 URL 배열',
  assigned_to INT COMMENT '담당자 ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '신청일',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
  resolved_at TIMESTAMP NULL COMMENT '완료일',
  admin_memo TEXT COMMENT '관리자 메모',
  INDEX idx_order_id (order_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (order_id) REFERENCES orders(order_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='반품/교환/환불 클레임';
