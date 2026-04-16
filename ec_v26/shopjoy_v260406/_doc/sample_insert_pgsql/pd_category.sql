-- ============================================================
-- ec_category 샘플 데이터
-- ============================================================

-- 대분류
INSERT INTO pd_category (category_id, parent_id, category_name, depth, sort_ord, status, reg_date) VALUES
('2604110000700001', NULL, '의류',       1, 1, 'ACTIVE', NOW()),
('2604110000700002', NULL, '신발',       1, 2, 'ACTIVE', NOW()),
('2604110000700003', NULL, '가방/잡화',  1, 3, 'ACTIVE', NOW()),
('2604110000700004', NULL, '스포츠/아웃도어', 1, 4, 'ACTIVE', NOW()),
('2604110000700005', NULL, '뷰티',       1, 5, 'ACTIVE', NOW());

-- 중분류 (의류)
INSERT INTO pd_category (category_id, parent_id, category_name, depth, sort_ord, status, reg_date) VALUES
('2604110000700011', '2604110000700001', '상의',    2, 1, 'ACTIVE', NOW()),
('2604110000700012', '2604110000700001', '하의',    2, 2, 'ACTIVE', NOW()),
('2604110000700013', '2604110000700001', '아우터',  2, 3, 'ACTIVE', NOW()),
('2604110000700014', '2604110000700001', '원피스',  2, 4, 'ACTIVE', NOW());

-- 중분류 (신발)
INSERT INTO pd_category (category_id, parent_id, category_name, depth, sort_ord, status, reg_date) VALUES
('2604110000700021', '2604110000700002', '스니커즈',  2, 1, 'ACTIVE', NOW()),
('2604110000700022', '2604110000700002', '샌들/슬리퍼', 2, 2, 'ACTIVE', NOW()),
('2604110000700023', '2604110000700002', '구두',      2, 3, 'ACTIVE', NOW()),
('2604110000700024', '2604110000700002', '부츠',      2, 4, 'ACTIVE', NOW());

-- 소분류 (상의)
INSERT INTO pd_category (category_id, parent_id, category_name, depth, sort_ord, status, reg_date) VALUES
('2604110000700111', '2604110000700011', '티셔츠',    3, 1, 'ACTIVE', NOW()),
('2604110000700112', '2604110000700011', '니트/스웨터', 3, 2, 'ACTIVE', NOW()),
('2604110000700113', '2604110000700011', '셔츠/블라우스', 3, 3, 'ACTIVE', NOW()),
('2604110000700114', '2604110000700011', '후드/맨투맨', 3, 4, 'ACTIVE', NOW());
