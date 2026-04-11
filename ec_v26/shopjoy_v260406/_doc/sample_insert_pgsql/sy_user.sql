-- ============================================================
-- sy_user 샘플 데이터 (비밀번호: shopjoy1! → bcrypt 해시)
-- ============================================================
INSERT INTO sy_user (user_id, login_id, password, name, email, phone, dept_id, role_id, status, reg_date) VALUES
('2604110000300001', 'admin',    '$2b$12$RmLXk1PfGCsCjfX5r5R4sOtMHIGJ3yJTHYyeNr.R6kiFUHHBZMkUy', '관리자',   'admin@shopjoy.com',   '02-1234-5678', '2604110000100001', '2604110000200001', 'ACTIVE', NOW()),
('2604110000300002', 'manager',  '$2b$12$RmLXk1PfGCsCjfX5r5R4sOtMHIGJ3yJTHYyeNr.R6kiFUHHBZMkUy', '운영팀장', 'manager@shopjoy.com', '02-1234-5679', '2604110000100003', '2604110000200002', 'ACTIVE', NOW()),
('2604110000300003', 'cs01',     '$2b$12$RmLXk1PfGCsCjfX5r5R4sOtMHIGJ3yJTHYyeNr.R6kiFUHHBZMkUy', '김상담',   'cs01@shopjoy.com',    '02-1234-5680', '2604110000100005', '2604110000200003', 'ACTIVE', NOW()),
('2604110000300004', 'md01',     '$2b$12$RmLXk1PfGCsCjfX5r5R4sOtMHIGJ3yJTHYyeNr.R6kiFUHHBZMkUy', '이상품',   'md01@shopjoy.com',    '02-1234-5681', '2604110000100003', '2604110000200004', 'ACTIVE', NOW()),
('2604110000300005', 'viewer01', '$2b$12$RmLXk1PfGCsCjfX5r5R4sOtMHIGJ3yJTHYyeNr.R6kiFUHHBZMkUy', '박조회',   'viewer01@shopjoy.com', '02-1234-5682', '2604110000100004', '2604110000200005', 'ACTIVE', NOW());
