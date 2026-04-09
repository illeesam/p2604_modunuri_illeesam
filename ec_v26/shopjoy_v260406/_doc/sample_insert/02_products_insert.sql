-- =====================================================
-- ShopJoy v2.6.0406 - products 샘플 데이터
-- =====================================================

INSERT INTO products (
  name, emoji, category, description, price, original_price, discount_rate,
  stock, rating, review_count, status, is_featured, image_url, created_by
) VALUES
('오버사이즈 코튼 티셔츠', '👕', 'TOPS', '편안한 착용감의 오버사이즈 코튼 티셔츠', 29900, 39900, 25, 100, 4.5, 234, 'AVAILABLE', TRUE,
 'https://example.com/img/oversized-tee.jpg', 1),

('슬림핏 데님 진', '👖', 'BOTTOMS', '세련된 핏의 슬림 데님 진', 59900, 79900, 25, 85, 4.7, 456, 'AVAILABLE', TRUE,
 'https://example.com/img/slim-denim.jpg', 1),

('울 블렌드 롱코트', '🧥', 'OUTERWEAR', '고급 울 소재의 롱코트', 119000, 149900, 20, 45, 4.8, 189, 'AVAILABLE', TRUE,
 'https://example.com/img/wool-coat.jpg', 1),

('케이블 니트 스웨터', '🧶', 'TOPS', '따뜻한 케이블 니트 스웨터', 49000, 65000, 24, 120, 4.6, 278, 'AVAILABLE', FALSE,
 'https://example.com/img/cable-knit.jpg', 1),

('카고 와이드 팬츠', '🩳', 'BOTTOMS', '캐주얼한 카고 와이드 팬츠', 55000, 75000, 26, 95, 4.4, 312, 'AVAILABLE', FALSE,
 'https://example.com/img/cargo-pants.jpg', 1),

('플로럴 미디 드레스', '👗', 'DRESSES', '우아한 플로럴 패턴 미디 드레스', 79000, 99900, 20, 60, 4.7, 203, 'AVAILABLE', TRUE,
 'https://example.com/img/floral-dress.jpg', 1),

('리넨 오버핏 블레이저', '🧥', 'OUTERWEAR', '시원한 리넨 소재의 오버핏 블레이저', 95000, 125000, 24, 40, 4.5, 167, 'AVAILABLE', FALSE,
 'https://example.com/img/linen-blazer.jpg', 1),

('퀼티드 숏 점퍼', '🧤', 'OUTERWEAR', '보온성 좋은 퀼티드 숏 점퍼', 89000, 119000, 25, 75, 4.6, 245, 'AVAILABLE', FALSE,
 'https://example.com/img/quilted-jumper.jpg', 1),

('후드 집업 스웨트셔츠', '🧥', 'TOPS', '편한 후드 집업 스웨트셔츠', 69000, 89900, 23, 110, 4.5, 289, 'AVAILABLE', FALSE,
 'https://example.com/img/hoodie.jpg', 1),

('맥시 롱 원피스', '👗', 'DRESSES', '세련된 맥시 롱 원피스', 88000, 119000, 26, 50, 4.7, 156, 'AVAILABLE', FALSE,
 'https://example.com/img/maxi-dress.jpg', 1),

('조거 스웻 팬츠', '🩳', 'BOTTOMS', '편한 조거 스웻 팬츠', 38000, 49900, 24, 130, 4.4, 321, 'AVAILABLE', FALSE,
 'https://example.com/img/jogger-pants.jpg', 1),

('체크 플란넬 셔츠', '👔', 'TOPS', '클래식한 체크 플란넬 셔츠', 52000, 69900, 25, 88, 4.5, 198, 'AVAILABLE', FALSE,
 'https://example.com/img/flannel-shirt.jpg', 1),

('스트라이프 린넨 셔츠', '👔', 'TOPS', '캐주얼한 스트라이프 린넨 셔츠', 45000, 59900, 24, 105, 4.6, 267, 'AVAILABLE', TRUE,
 'https://example.com/img/linen-shirt.jpg', 1),

('레더룩 라이더 재킷', '🧥', 'OUTERWEAR', '멋진 레더룩 라이더 재킷', 139000, 189000, 26, 35, 4.7, 134, 'AVAILABLE', FALSE,
 'https://example.com/img/leather-jacket.jpg', 1),

('캔버스 토트백', '👜', 'ACCESSORIES', '실용적인 캔버스 토트백', 35000, 45000, 22, 150, 4.5, 423, 'AVAILABLE', FALSE,
 'https://example.com/img/canvas-tote.jpg', 1);

-- =====================================================
-- 상품 정보
-- product_id 1-15: 의류 및 액세서리
-- =====================================================
