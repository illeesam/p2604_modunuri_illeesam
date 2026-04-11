-- ============================================================
-- sy_site 샘플 데이터
-- ============================================================
INSERT INTO sy_site (site_id, site_code, site_type, site_name, domain, description, email, phone, address, business_no, ceo, status, reg_date) VALUES
('2604110000400001', 'SHOPJOY_EC',    'EC',    'ShopJoy 쇼핑몰', 'https://www.shopjoy.com',       '메인 쇼핑몰',      'help@shopjoy.com',  '02-0000-1111', '서울특별시 강남구 테헤란로 123', '123-45-67890', '홍길동', 'ACTIVE', NOW()),
('2604110000400002', 'SHOPJOY_ADMIN', 'ADMIN', 'ShopJoy 관리자', 'https://admin.shopjoy.com',     '백오피스 관리자',  'admin@shopjoy.com', '02-0000-1112', '서울특별시 강남구 테헤란로 123', '123-45-67890', '홍길동', 'ACTIVE', NOW()),
('2604110000400003', 'SHOPJOY_API',   'API',   'ShopJoy API',    'https://api.shopjoy.com',       'REST API 서버',    'api@shopjoy.com',   '02-0000-1113', '서울특별시 강남구 테헤란로 123', '123-45-67890', '홍길동', 'ACTIVE', NOW());
