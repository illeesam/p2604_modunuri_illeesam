-- =====================================================
-- ShopJoy v2.6.0406 - product_colors 샘플 데이터
-- =====================================================

INSERT INTO product_colors (
  product_id, color_name, hex_code, sizes,
  stock_by_size, image_url
) VALUES
-- 1. 오버사이즈 코튼 티셔츠
(1, '블랙', '#000000', JSON_ARRAY('XS', 'S', 'M', 'L', 'XL'),
 JSON_OBJECT('XS', 15, 'S', 20, 'M', 25, 'L', 20, 'XL', 20),
 'https://example.com/img/tee-black.jpg'),
(1, '화이트', '#FFFFFF', JSON_ARRAY('XS', 'S', 'M', 'L', 'XL'),
 JSON_OBJECT('XS', 18, 'S', 22, 'M', 25, 'L', 18, 'XL', 17),
 'https://example.com/img/tee-white.jpg'),
(1, '베이지', '#F5E6D3', JSON_ARRAY('S', 'M', 'L', 'XL'),
 JSON_OBJECT('S', 15, 'M', 20, 'L', 18, 'XL', 17),
 'https://example.com/img/tee-beige.jpg'),

-- 2. 슬림핏 데님 진
(2, '블랙', '#000000', JSON_ARRAY('XS', 'S', 'M', 'L', 'XL'),
 JSON_OBJECT('XS', 12, 'S', 18, 'M', 22, 'L', 20, 'XL', 13),
 'https://example.com/img/denim-black.jpg'),
(2, '미드블루', '#4A90E2', JSON_ARRAY('XS', 'S', 'M', 'L', 'XL'),
 JSON_OBJECT('XS', 10, 'S', 16, 'M', 20, 'L', 19, 'XL', 20),
 'https://example.com/img/denim-midblue.jpg'),
(2, '다크블루', '#1E3A5F', JSON_ARRAY('S', 'M', 'L', 'XL'),
 JSON_OBJECT('S', 14, 'M', 18, 'L', 17, 'XL', 16),
 'https://example.com/img/denim-darkblue.jpg'),

-- 3. 울 블렌드 롱코트
(3, '차콜', '#36454F', JSON_ARRAY('S', 'M', 'L', 'XL'),
 JSON_OBJECT('S', 10, 'M', 12, 'L', 12, 'XL', 11),
 'https://example.com/img/coat-charcoal.jpg'),
(3, '카멜', '#C9A961', JSON_ARRAY('S', 'M', 'L', 'XL'),
 JSON_OBJECT('S', 8, 'M', 10, 'L', 11, 'XL', 16),
 'https://example.com/img/coat-camel.jpg'),

-- 4. 케이블 니트 스웨터
(4, '아이보리', '#FFFFF0', JSON_ARRAY('S', 'M', 'L'),
 JSON_OBJECT('S', 40, 'M', 45, 'L', 35),
 'https://example.com/img/sweater-ivory.jpg'),
(4, '버건디', '#800020', JSON_ARRAY('M', 'L', 'XL'),
 JSON_OBJECT('M', 35, 'L', 40, 'XL', 45),
 'https://example.com/img/sweater-burgundy.jpg'),

-- 5. 카고 와이드 팬츠
(5, '블랙', '#000000', JSON_ARRAY('S', 'M', 'L', 'XL'),
 JSON_OBJECT('S', 22, 'M', 25, 'L', 28, 'XL', 20),
 'https://example.com/img/cargo-black.jpg'),
(5, '카키', '#BDB76B', JSON_ARRAY('S', 'M', 'L'),
 JSON_OBJECT('S', 20, 'M', 23, 'L', 25),
 'https://example.com/img/cargo-khaki.jpg'),

-- 6. 플로럴 미디 드레스
(6, '핑크플로럴', '#FFB6C1', JSON_ARRAY('S', 'M', 'L'),
 JSON_OBJECT('S', 22, 'M', 20, 'L', 18),
 'https://example.com/img/dress-pink.jpg'),
(6, '블루플로럴', '#87CEEB', JSON_ARRAY('M', 'L', 'XL'),
 JSON_OBJECT('M', 20, 'L', 22, 'XL', 18),
 'https://example.com/img/dress-blue.jpg'),

-- 7. 리넨 오버핏 블레이저
(7, '베이지', '#F5E6D3', JSON_ARRAY('S', 'M', 'L'),
 JSON_OBJECT('S', 15, 'M', 15, 'L', 10),
 'https://example.com/img/blazer-beige.jpg'),

-- 8. 퀼티드 숏 점퍼
(8, '블랙', '#000000', JSON_ARRAY('S', 'M', 'L'),
 JSON_OBJECT('S', 25, 'M', 28, 'L', 22),
 'https://example.com/img/jumper-black.jpg'),
(8, '올리브', '#808000', JSON_ARRAY('M', 'L', 'XL'),
 JSON_OBJECT('M', 20, 'L', 18, 'XL', 17),
 'https://example.com/img/jumper-olive.jpg');
