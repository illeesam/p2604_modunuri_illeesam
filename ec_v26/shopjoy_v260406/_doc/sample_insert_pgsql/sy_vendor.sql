-- ============================================================
-- sy_vendor 샘플 데이터
-- ============================================================
INSERT INTO sy_vendor (vendor_id, vendor_type, vendor_name, vendor_code, ceo, biz_no, phone, email, address, contract_date, status, reg_date) VALUES
('2604110000500001', 'SELLER',  '(주)패션코리아',  'VENDOR_FK',  '김대표', '111-22-33333', '02-2222-1111', 'biz@fashionkorea.com',  '서울시 중구 명동길 10',    '2024-01-01', 'ACTIVE', NOW()),
('2604110000500002', 'SELLER',  '베스트트레이딩',  'VENDOR_BT',  '이사장', '222-33-44444', '02-3333-2222', 'biz@besttrading.com',   '서울시 강남구 도산대로 5', '2024-03-01', 'ACTIVE', NOW()),
('2604110000500003', 'COURIER', 'CJ대한통운',      'VENDOR_CJ',  '강택배', '333-44-55555', '1588-1255',    'corp@cjlogistics.com',  '서울시 중구 남대문로 1',   '2024-01-01', 'ACTIVE', NOW()),
('2604110000500004', 'COURIER', '로젠택배',        'VENDOR_LG',  '박로젠', '444-55-66666', '1588-9988',    'corp@logencorp.com',    '경기도 성남시 분당구 1',   '2024-01-01', 'ACTIVE', NOW()),
('2604110000500005', 'SELLER',  '글로벌수입상사',  'VENDOR_GI',  '정글로', '555-66-77777', '02-4444-3333', 'biz@globalimport.com',  '인천시 중구 항동 7가 1',   '2024-06-01', 'ACTIVE', NOW());
