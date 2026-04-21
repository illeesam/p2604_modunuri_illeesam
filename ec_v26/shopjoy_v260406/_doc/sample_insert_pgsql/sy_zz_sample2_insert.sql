-- zz_sample2 샘플 INSERT 데이터

INSERT INTO shopjoy_2604.zz_sample2 (sample2_id, item_name, item_code, price, quantity, is_active, reg_by, reg_date)
VALUES
('ZS2260421120000001', '상품명1', 'ITEM_001', 15000.00, 100, true, 'admin', CURRENT_TIMESTAMP),
('ZS2260421120000002', '상품명2', 'ITEM_002', 25000.00, 50, true, 'admin', CURRENT_TIMESTAMP),
('ZS2260421120000003', '상품명3', 'ITEM_003', 35000.00, 30, true, 'admin', CURRENT_TIMESTAMP),
('ZS2260421120000004', '상품명4', 'ITEM_004', 45000.00, 0, false, 'admin', CURRENT_TIMESTAMP),
('ZS2260421120000005', '상품명5', 'ITEM_005', 55000.00, 200, true, 'admin', CURRENT_TIMESTAMP);
