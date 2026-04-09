-- =====================================================
-- ShopJoy v2.6.0406 - product_colors 테이블
-- 설명: 상품별 색상/사이즈 옵션
-- =====================================================

CREATE TABLE IF NOT EXISTS product_colors (
  color_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '색상 ID',
  product_id INT NOT NULL COMMENT '상품 ID',
  color_name VARCHAR(100) NOT NULL COMMENT '색상명',
  hex_code VARCHAR(7) COMMENT '색상 HEX 코드',
  sizes JSON COMMENT '사이즈 배열 (XS, S, M, L, XL, FREE 등)',
  stock_by_size JSON COMMENT '사이즈별 재고 JSON',
  image_url VARCHAR(255) COMMENT '색상 이미지 URL',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '등록일',
  UNIQUE KEY uq_product_color (product_id, color_name),
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='상품별 색상/사이즈 옵션';
