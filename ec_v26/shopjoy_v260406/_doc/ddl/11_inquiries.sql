-- =====================================================
-- ShopJoy v2.6.0406 - inquiries 테이블
-- 설명: 고객 문의/질문
-- =====================================================

CREATE TABLE IF NOT EXISTS inquiries (
  inquiry_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '문의 ID',
  user_id INT NOT NULL COMMENT '사용자 ID',
  product_id INT COMMENT '상품 ID (NULL이면 일반 문의)',
  category VARCHAR(100) COMMENT '문의 카테고리 (배송, 환불, 상품, 기타)',
  title VARCHAR(255) NOT NULL COMMENT '제목',
  content TEXT NOT NULL COMMENT '내용',
  status ENUM('NEW', 'IN_PROGRESS', 'ANSWERED', 'CLOSED') DEFAULT 'NEW' COMMENT '문의 상태',
  is_public BOOLEAN DEFAULT TRUE COMMENT '공개 여부',
  answer_text TEXT COMMENT '답변 내용',
  answered_at TIMESTAMP NULL COMMENT '답변 일시',
  answered_by INT COMMENT '답변자 ID',
  image_urls JSON COMMENT '첨부 이미지 URL 배열',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '작성일',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
  INDEX idx_user_id (user_id),
  INDEX idx_product_id (product_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL,
  FOREIGN KEY (answered_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='고객 문의/질문';
