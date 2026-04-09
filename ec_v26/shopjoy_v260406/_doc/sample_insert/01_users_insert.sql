-- =====================================================
-- ShopJoy v2.6.0406 - users 샘플 데이터
-- =====================================================

INSERT INTO users (
  username, password, email, name, phone, birth_date, gender, role, status,
  address, detail_address, postal_code, is_email_verified, is_phone_verified
) VALUES
-- 관리자
('admin', SHA2('admin123!', 256), 'admin@shopjoy.com', '관리자', '010-0000-0001', '1990-01-15', 'M', 'ADMIN', 'ACTIVE',
 '서울시 강남구 테헤란로', '1층', '06234', TRUE, TRUE),

-- 일반 사용자
('user001', SHA2('password123!', 256), 'hong@example.com', '홍길동', '010-1234-5678', '1995-03-22', 'M', 'USER', 'ACTIVE',
 '서울시 서초구 강남대로', '아파트 101호', '06546', TRUE, TRUE),

('user002', SHA2('password456!', 256), 'kim@example.com', '김영희', '010-2345-6789', '1998-07-14', 'F', 'USER', 'ACTIVE',
 '서울시 마포구 월드컵북로', '오피스텔 305호', '03964', TRUE, FALSE),

('user003', SHA2('password789!', 256), 'park@example.com', '박준호', '010-3456-7890', '1992-11-08', 'M', 'USER', 'ACTIVE',
 '부산시 해운대구 중앙대로', '빌라 2층', '48058', FALSE, TRUE),

('user004', SHA2('password000!', 256), 'lee@example.com', '이정은', '010-4567-8901', '2000-05-30', 'F', 'USER', 'ACTIVE',
 '대구시 수성구 범어로', '오피스텔 501호', '42154', TRUE, TRUE),

('user005', SHA2('password111!', 256), 'choi@example.com', '최민수', '010-5678-9012', '1988-09-17', 'M', 'USER', 'INACTIVE',
 '광주시 동구 충장로', '주택 B동', '61910', TRUE, FALSE),

-- 매니저
('manager', SHA2('manager123!', 256), 'manager@shopjoy.com', '매니저', '010-0000-0002', '1993-06-20', 'F', 'MANAGER', 'ACTIVE',
 '서울시 강남구 테헤란로', '2층', '06234', TRUE, TRUE);

-- =====================================================
-- 사용자 정보
-- user_id 1: 관리자
-- user_id 2: 홍길동 (기본 테스트 사용자)
-- user_id 3-6: 추가 사용자
-- user_id 7: 매니저
-- =====================================================
