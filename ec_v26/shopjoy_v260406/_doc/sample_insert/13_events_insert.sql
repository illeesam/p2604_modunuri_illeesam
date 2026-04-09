-- =====================================================
-- ShopJoy v2.6.0406 - events 샘플 데이터
-- =====================================================

INSERT INTO events (
  event_name, event_type, description, banner_image_url,
  thumbnail_image_url, start_date, end_date, status,
  target_products, discount_type, discount_value, max_discount_amount,
  priority, is_featured, created_at, created_by
) VALUES
-- 진행중인 이벤트
('봄 시즌 세일', 'SEASONAL', '봄맞이 전체 상품 할인 세일',
 'https://example.com/banner/spring-sale.jpg', 'https://example.com/thumb/spring-sale.jpg',
 '2026-03-20 00:00:00', '2026-05-31 23:59:59', 'ACTIVE',
 JSON_ARRAY(1, 2, 3, 4, 5, 6, 7, 8), 'PERCENTAGE', 10, 50000, 1, TRUE,
 '2026-03-15 10:00:00', 1),

-- 예정 이벤트
('여름 플래시 세일', 'FLASH_SALE', '매주 금요일 밤 8시 플래시 세일',
 'https://example.com/banner/summer-flash.jpg', 'https://example.com/thumb/summer-flash.jpg',
 '2026-06-01 00:00:00', '2026-08-31 23:59:59', 'PENDING',
 JSON_ARRAY(9, 10, 11, 12, 13, 14, 15), 'PERCENTAGE', 15, 80000, 2, FALSE,
 '2026-05-20 10:00:00', 1),

-- 진행중인 프로모션
('신규 회원 환영 이벤트', 'PROMOTION', '신규 회원 최대 1만원 할인',
 'https://example.com/banner/welcome.jpg', 'https://example.com/thumb/welcome.jpg',
 '2026-04-01 00:00:00', '2026-12-31 23:59:59', 'ACTIVE',
 NULL, 'FIXED', 10000, 10000, 3, FALSE,
 '2026-03-25 10:00:00', 1),

-- 종료된 이벤트
('겨울 세일', 'SEASONAL', '겨울 외투 및 따뜻한 의류 할인',
 'https://example.com/banner/winter-sale.jpg', 'https://example.com/thumb/winter-sale.jpg',
 '2025-12-01 00:00:00', '2026-02-28 23:59:59', 'CLOSED',
 JSON_ARRAY(3, 7, 8, 9), 'PERCENTAGE', 20, 60000, 0, FALSE,
 '2025-11-15 10:00:00', 1),

-- 스페셜 이벤트
('VIP 회원 특별 할인', 'SPECIAL', 'VIP 회원 전용 특별 할인',
 'https://example.com/banner/vip-special.jpg', 'https://example.com/thumb/vip-special.jpg',
 '2026-04-01 00:00:00', '2026-12-31 23:59:59', 'ACTIVE',
 NULL, 'PERCENTAGE', 15, 100000, 4, TRUE,
 '2026-03-20 10:00:00', 1),

-- 콘테스트
('SNS 포토 콘테스트', 'CONTEST', '#ShopJoy를 해시태그로 사진 올리고 상품 받기',
 'https://example.com/banner/photo-contest.jpg', 'https://example.com/thumb/photo-contest.jpg',
 '2026-04-10 00:00:00', '2026-05-10 23:59:59', 'PENDING',
 NULL, NULL, 0, 0, 2, FALSE,
 '2026-04-01 10:00:00', 1);

-- =====================================================
-- 이벤트 정보
-- status: PENDING (예정) / ACTIVE (진행중) / INACTIVE (비활성) / CLOSED (종료)
-- event_type: PROMOTION (프로모션) / FLASH_SALE (플래시) / SEASONAL (시즌) / SPECIAL (스페셜) / CONTEST (콘테스트)
-- =====================================================
