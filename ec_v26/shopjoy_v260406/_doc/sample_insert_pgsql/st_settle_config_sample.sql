-- 정산기준 설정 샘플 데이터 INSERT
INSERT INTO shopjoy_2604.st_settle_config (
  settle_config_id, site_id, vendor_id, category_id, settle_cycle_cd, settle_day,
  commission_rate, min_settle_amt, settle_config_remark, use_yn, reg_by, reg_date, upd_by, upd_date
) VALUES
-- ShopJoy 01 - 판매업체 기본 정산
('SC260424000001', '01', NULL, NULL, 'MONTHLY', 10, 10.00, 10000, '기본 판매업체 정산 기준', 'Y', 'admin', NOW(), 'admin', NOW()),

-- ShopJoy 01 - 배송업체 정산
('SC260424000002', '01', NULL, NULL, 'MONTHLY', 15, 0.00, 50000, '배송비 정산 기준', 'Y', 'admin', NOW(), 'admin', NOW()),

-- ShopJoy 01 - MD입점 특별 정산
('SC260424000003', '01', NULL, NULL, 'WEEKLY', 5, 12.00, 5000, 'MD 특별 입점 기준', 'Y', 'admin', NOW(), 'admin', NOW()),

-- ShopJoy 01 - 위탁업체 정산 (미사용)
('SC260424000004', '01', NULL, NULL, 'MONTHLY', 10, 8.00, 10000, '위탁 판매 기준 (미사용)', 'N', 'admin', NOW(), 'admin', NOW()),

-- ShopJoy 01 - 프리미엄 셀러 정산
('SC260424000005', '01', NULL, NULL, 'MONTHLY', 25, 7.50, 5000, '프리미엄 셀러 우대 정산 기준', 'Y', 'admin', NOW(), 'admin', NOW())
ON CONFLICT (settle_config_id) DO NOTHING;
