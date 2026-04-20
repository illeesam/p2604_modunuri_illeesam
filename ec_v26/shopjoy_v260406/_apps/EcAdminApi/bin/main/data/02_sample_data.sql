-- ============================================================
-- ShopJoy 2604 — 샘플 데이터
-- 생성일: 2026-04-20
-- ※ 실행 전 01_create_tables.sql 먼저 실행 필요
-- ============================================================

SET search_path TO shopjoy_2604;

-- ============================================================
-- [SY] 사이트
-- ============================================================
INSERT INTO sy_site (site_id, site_code, site_type_cd, site_nm, site_domain, site_email, site_phone, site_status_cd, reg_by, reg_date)
VALUES
  ('2604010000000001', 'SHOPJOY', 'EC', 'ShopJoy 메인몰', 'www.shopjoy.co.kr', 'info@shopjoy.co.kr', '02-1234-5678', 'ACTIVE', 'SYSTEM', NOW()),
  ('2604010000000002', 'SHOPJOY-M', 'EC', 'ShopJoy 모바일', 'm.shopjoy.co.kr', 'info@shopjoy.co.kr', '02-1234-5678', 'ACTIVE', 'SYSTEM', NOW()),
  ('2604010000000003', 'SHOPJOY-ADMIN', 'ADMIN', 'ShopJoy 관리자', 'admin.shopjoy.co.kr', 'admin@shopjoy.co.kr', '02-1234-5679', 'ACTIVE', 'SYSTEM', NOW())
ON CONFLICT (site_id) DO NOTHING;

-- ============================================================
-- [SY] 공통코드 그룹
-- ============================================================
INSERT INTO sy_code_grp (code_grp_id, site_id, code_grp, grp_nm, use_yn, reg_by, reg_date)
VALUES
  ('CG0000000000001', NULL, 'MEMBER_STATUS', '회원상태',   'Y', 'SYSTEM', NOW()),
  ('CG0000000000002', NULL, 'MEMBER_GRADE',  '회원등급',   'Y', 'SYSTEM', NOW()),
  ('CG0000000000003', NULL, 'ORDER_STATUS',  '주문상태',   'Y', 'SYSTEM', NOW()),
  ('CG0000000000004', NULL, 'CLAIM_TYPE',    '클레임유형', 'Y', 'SYSTEM', NOW()),
  ('CG0000000000005', NULL, 'CLAIM_STATUS',  '클레임상태', 'Y', 'SYSTEM', NOW()),
  ('CG0000000000006', NULL, 'DLIV_STATUS',   '배송상태',   'Y', 'SYSTEM', NOW()),
  ('CG0000000000007', NULL, 'PROD_STATUS',   '상품상태',   'Y', 'SYSTEM', NOW()),
  ('CG0000000000008', NULL, 'COUPON_STATUS', '쿠폰상태',   'Y', 'SYSTEM', NOW()),
  ('CG0000000000009', NULL, 'SETTLE_STATUS', '정산상태',   'Y', 'SYSTEM', NOW()),
  ('CG0000000000010', NULL, 'SITE_STATUS',   '사이트상태', 'Y', 'SYSTEM', NOW()),
  ('CG0000000000011', NULL, 'USER_STATUS',   '관리자상태', 'Y', 'SYSTEM', NOW()),
  ('CG0000000000012', NULL, 'PAY_METHOD',    '결제수단',   'Y', 'SYSTEM', NOW()),
  ('CG0000000000013', NULL, 'DLIV_TYPE',     '배송유형',   'Y', 'SYSTEM', NOW()),
  ('CG0000000000014', NULL, 'WIDGET_TYPE',   '위젯유형',   'Y', 'SYSTEM', NOW()),
  ('CG0000000000015', NULL, 'DISP_STATUS',   '전시상태',   'Y', 'SYSTEM', NOW())
ON CONFLICT (code_grp_id) DO NOTHING;

-- ============================================================
-- [SY] 공통코드
-- ============================================================
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, use_yn, sort_ord, reg_by, reg_date)
VALUES
  -- 회원상태
  ('SC00000000000001', 'MEMBER_STATUS', 'ACTIVE',    '활성',     'Y', 1, 'SYSTEM', NOW()),
  ('SC00000000000002', 'MEMBER_STATUS', 'DORMANT',   '휴면',     'Y', 2, 'SYSTEM', NOW()),
  ('SC00000000000003', 'MEMBER_STATUS', 'SUSPENDED', '정지',     'Y', 3, 'SYSTEM', NOW()),
  ('SC00000000000004', 'MEMBER_STATUS', 'WITHDRAWN', '탈퇴',     'Y', 4, 'SYSTEM', NOW()),
  -- 회원등급
  ('SC00000000000011', 'MEMBER_GRADE',  'BASIC', '일반', 'Y', 1, 'SYSTEM', NOW()),
  ('SC00000000000012', 'MEMBER_GRADE',  'GOLD',  '우수', 'Y', 2, 'SYSTEM', NOW()),
  ('SC00000000000013', 'MEMBER_GRADE',  'VIP',   'VIP',  'Y', 3, 'SYSTEM', NOW()),
  -- 주문상태
  ('SC00000000000021', 'ORDER_STATUS',  'PENDING',    '입금대기', 'Y', 1, 'SYSTEM', NOW()),
  ('SC00000000000022', 'ORDER_STATUS',  'PAID',       '결제완료', 'Y', 2, 'SYSTEM', NOW()),
  ('SC00000000000023', 'ORDER_STATUS',  'PREPARING',  '상품준비', 'Y', 3, 'SYSTEM', NOW()),
  ('SC00000000000024', 'ORDER_STATUS',  'SHIPPED',    '배송중',   'Y', 4, 'SYSTEM', NOW()),
  ('SC00000000000025', 'ORDER_STATUS',  'COMPLT',     '구매확정', 'Y', 5, 'SYSTEM', NOW()),
  ('SC00000000000026', 'ORDER_STATUS',  'CANCELLED',  '주문취소', 'Y', 6, 'SYSTEM', NOW()),
  -- 클레임유형
  ('SC00000000000031', 'CLAIM_TYPE',    'CANCEL',   '취소', 'Y', 1, 'SYSTEM', NOW()),
  ('SC00000000000032', 'CLAIM_TYPE',    'RETURN',   '반품', 'Y', 2, 'SYSTEM', NOW()),
  ('SC00000000000033', 'CLAIM_TYPE',    'EXCHANGE', '교환', 'Y', 3, 'SYSTEM', NOW()),
  -- 클레임상태
  ('SC00000000000041', 'CLAIM_STATUS',  'REQUESTED', '요청',     'Y', 1, 'SYSTEM', NOW()),
  ('SC00000000000042', 'CLAIM_STATUS',  'ACCEPTED',  '승인',     'Y', 2, 'SYSTEM', NOW()),
  ('SC00000000000043', 'CLAIM_STATUS',  'REJECTED',  '반려',     'Y', 3, 'SYSTEM', NOW()),
  ('SC00000000000044', 'CLAIM_STATUS',  'COMPLT',    '처리완료', 'Y', 4, 'SYSTEM', NOW()),
  -- 배송상태
  ('SC00000000000051', 'DLIV_STATUS',   'READY',      '준비중',   'Y', 1, 'SYSTEM', NOW()),
  ('SC00000000000052', 'DLIV_STATUS',   'SHIPPED',    '출고완료', 'Y', 2, 'SYSTEM', NOW()),
  ('SC00000000000053', 'DLIV_STATUS',   'IN_TRANSIT', '배송중',   'Y', 3, 'SYSTEM', NOW()),
  ('SC00000000000054', 'DLIV_STATUS',   'DELIVERED',  '배송완료', 'Y', 4, 'SYSTEM', NOW()),
  -- 상품상태
  ('SC00000000000061', 'PROD_STATUS',   'ACTIVE',   '판매중',   'Y', 1, 'SYSTEM', NOW()),
  ('SC00000000000062', 'PROD_STATUS',   'INACTIVE', '중지',     'Y', 2, 'SYSTEM', NOW()),
  ('SC00000000000063', 'PROD_STATUS',   'SOLDOUT',  '품절',     'Y', 3, 'SYSTEM', NOW()),
  ('SC00000000000064', 'PROD_STATUS',   'DRAFT',    '임시저장', 'Y', 4, 'SYSTEM', NOW()),
  -- 결제수단
  ('SC00000000000071', 'PAY_METHOD',    'BANK_TRANSFER', '무통장입금', 'Y', 1, 'SYSTEM', NOW()),
  ('SC00000000000072', 'PAY_METHOD',    'VBANK',         '가상계좌',   'Y', 2, 'SYSTEM', NOW()),
  ('SC00000000000073', 'PAY_METHOD',    'TOSS',          '토스',       'Y', 3, 'SYSTEM', NOW()),
  ('SC00000000000074', 'PAY_METHOD',    'KAKAO',         '카카오페이', 'Y', 4, 'SYSTEM', NOW()),
  ('SC00000000000075', 'PAY_METHOD',    'NAVER',         '네이버페이', 'Y', 5, 'SYSTEM', NOW()),
  ('SC00000000000076', 'PAY_METHOD',    'MOBILE',        '휴대폰결제', 'Y', 6, 'SYSTEM', NOW()),
  -- 관리자상태
  ('SC00000000000081', 'USER_STATUS',   'ACTIVE',   '활성',   'Y', 1, 'SYSTEM', NOW()),
  ('SC00000000000082', 'USER_STATUS',   'INACTIVE', '비활성', 'Y', 2, 'SYSTEM', NOW()),
  ('SC00000000000083', 'USER_STATUS',   'LOCKED',   '잠김',   'Y', 3, 'SYSTEM', NOW()),
  -- 전시상태
  ('SC00000000000091', 'DISP_STATUS',   'SHOW', '노출', 'Y', 1, 'SYSTEM', NOW()),
  ('SC00000000000092', 'DISP_STATUS',   'HIDE', '숨김', 'Y', 2, 'SYSTEM', NOW())
ON CONFLICT (code_id) DO NOTHING;

-- ============================================================
-- [SY] 부서
-- ============================================================
INSERT INTO sy_dept (dept_id, dept_nm, dept_code, use_yn, sort_ord, reg_by, reg_date)
VALUES
  ('DEPT000000000001', '개발팀',   'DEV',   'Y', 1, 'SYSTEM', NOW()),
  ('DEPT000000000002', '운영팀',   'OPS',   'Y', 2, 'SYSTEM', NOW()),
  ('DEPT000000000003', '마케팅팀', 'MKT',   'Y', 3, 'SYSTEM', NOW()),
  ('DEPT000000000004', 'CS팀',     'CS',    'Y', 4, 'SYSTEM', NOW()),
  ('DEPT000000000005', '경영지원', 'MGMT',  'Y', 5, 'SYSTEM', NOW())
ON CONFLICT (dept_id) DO NOTHING;

-- ============================================================
-- [SY] 역할
-- ============================================================
INSERT INTO sy_role (role_id, role_nm, role_code, use_yn, sort_ord, reg_by, reg_date)
VALUES
  ('ROLE000000000001', '시스템관리자', 'SUPER_ADMIN', 'Y', 1, 'SYSTEM', NOW()),
  ('ROLE000000000002', '운영관리자',   'ADMIN',       'Y', 2, 'SYSTEM', NOW()),
  ('ROLE000000000003', '상품관리자',   'PROD_ADMIN',  'Y', 3, 'SYSTEM', NOW()),
  ('ROLE000000000004', '주문관리자',   'ORDER_ADMIN', 'Y', 4, 'SYSTEM', NOW()),
  ('ROLE000000000005', 'CS담당자',     'CS_STAFF',    'Y', 5, 'SYSTEM', NOW())
ON CONFLICT (role_id) DO NOTHING;

-- ============================================================
-- [SY] 관리자 사용자 (BCrypt hash of "admin123!")
-- ============================================================
INSERT INTO sy_user (user_id, site_id, login_id, user_password, user_nm, user_email, user_phone, dept_id, role_id, user_status_cd, reg_by, reg_date)
VALUES
  ('USR0000000000001', '2604010000000001', 'admin',       '$2a$10$8Mq5GfR3k9pL2vHn7YxZOeQwJkT4dCbIuNsAoE1mRfXlWgPzYhVKi', '시스템관리자', 'admin@shopjoy.co.kr',   '010-1234-0001', 'DEPT000000000001', 'ROLE000000000001', 'ACTIVE', 'SYSTEM', NOW()),
  ('USR0000000000002', '2604010000000001', 'manager',     '$2a$10$8Mq5GfR3k9pL2vHn7YxZOeQwJkT4dCbIuNsAoE1mRfXlWgPzYhVKi', '운영관리자',   'manager@shopjoy.co.kr', '010-1234-0002', 'DEPT000000000002', 'ROLE000000000002', 'ACTIVE', 'SYSTEM', NOW()),
  ('USR0000000000003', '2604010000000001', 'prod.admin',  '$2a$10$8Mq5GfR3k9pL2vHn7YxZOeQwJkT4dCbIuNsAoE1mRfXlWgPzYhVKi', '상품담당',     'prod@shopjoy.co.kr',    '010-1234-0003', 'DEPT000000000001', 'ROLE000000000003', 'ACTIVE', 'SYSTEM', NOW()),
  ('USR0000000000004', '2604010000000001', 'order.admin', '$2a$10$8Mq5GfR3k9pL2vHn7YxZOeQwJkT4dCbIuNsAoE1mRfXlWgPzYhVKi', '주문담당',     'order@shopjoy.co.kr',   '010-1234-0004', 'DEPT000000000002', 'ROLE000000000004', 'ACTIVE', 'SYSTEM', NOW()),
  ('USR0000000000005', '2604010000000001', 'cs.staff',    '$2a$10$8Mq5GfR3k9pL2vHn7YxZOeQwJkT4dCbIuNsAoE1mRfXlWgPzYhVKi', 'CS담당자',     'cs@shopjoy.co.kr',      '010-1234-0005', 'DEPT000000000004', 'ROLE000000000005', 'ACTIVE', 'SYSTEM', NOW())
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- [SY] 브랜드
-- ============================================================
INSERT INTO sy_brand (brand_id, brand_nm, brand_code, use_yn, sort_ord, reg_by, reg_date)
VALUES
  ('BRD0000000000001', '나이키',     'NIKE',      'Y', 1, 'SYSTEM', NOW()),
  ('BRD0000000000002', '아디다스',   'ADIDAS',    'Y', 2, 'SYSTEM', NOW()),
  ('BRD0000000000003', '노스페이스', 'NORTHFACE', 'Y', 3, 'SYSTEM', NOW()),
  ('BRD0000000000004', '삼성전자',   'SAMSUNG',   'Y', 4, 'SYSTEM', NOW()),
  ('BRD0000000000005', 'LG전자',     'LG',        'Y', 5, 'SYSTEM', NOW()),
  ('BRD0000000000006', '애플',       'APPLE',     'Y', 6, 'SYSTEM', NOW()),
  ('BRD0000000000007', '자체브랜드', 'OWN',       'Y', 7, 'SYSTEM', NOW())
ON CONFLICT (brand_id) DO NOTHING;

-- ============================================================
-- [SY] 업체 (Vendor)
-- ============================================================
INSERT INTO sy_vendor (vendor_id, vendor_no, vendor_nm, vendor_email, vendor_phone, vendor_status_cd, reg_by, reg_date)
VALUES
  ('VND0000000000001', 'V001', '나이키코리아',   'vendor1@nike.co.kr',     '02-2000-1001', 'ACTIVE', 'SYSTEM', NOW()),
  ('VND0000000000002', 'V002', '아디다스코리아', 'vendor2@adidas.co.kr',   '02-2000-1002', 'ACTIVE', 'SYSTEM', NOW()),
  ('VND0000000000003', 'V003', '아웃도어코리아', 'vendor3@outdoor.co.kr',  '02-2000-1003', 'ACTIVE', 'SYSTEM', NOW()),
  ('VND0000000000004', 'V004', '전자랜드',       'vendor4@elecland.co.kr', '02-2000-1004', 'ACTIVE', 'SYSTEM', NOW()),
  ('VND0000000000005', 'V005', '직배송몰',       'vendor5@direct.co.kr',   '02-2000-1005', 'ACTIVE', 'SYSTEM', NOW())
ON CONFLICT (vendor_id) DO NOTHING;

-- ============================================================
-- [MB] 회원등급
-- ============================================================
INSERT INTO mb_member_grade (grade_id, grade_cd, grade_nm, min_purchase_amt, save_rate, use_yn, reg_by, reg_date)
VALUES
  ('GRD0000000000001', 'BASIC', '일반회원', 0,       1.0, 'Y', 'SYSTEM', NOW()),
  ('GRD0000000000002', 'GOLD',  '우수회원', 500000,  2.0, 'Y', 'SYSTEM', NOW()),
  ('GRD0000000000003', 'VIP',   'VIP회원',  1000000, 3.0, 'Y', 'SYSTEM', NOW())
ON CONFLICT (grade_id) DO NOTHING;

-- ============================================================
-- [MB] 회원
-- ============================================================
INSERT INTO mb_member (member_id, site_id, member_email, member_password, member_nm, member_phone, member_gender, grade_cd, member_status_cd, join_date, reg_by, reg_date)
VALUES
  ('MBR0000000000001', '2604010000000001', 'kim@example.com',  '$2a$10$8Mq5GfR3k9pL2vHn7YxZOeQwJkT4dCbIuNsAoE1mRfXlWgPzYhVKi', '김철수', '010-1111-0001', 'M', 'VIP',   'ACTIVE',  NOW(), 'SYSTEM', NOW()),
  ('MBR0000000000002', '2604010000000001', 'lee@example.com',  '$2a$10$8Mq5GfR3k9pL2vHn7YxZOeQwJkT4dCbIuNsAoE1mRfXlWgPzYhVKi', '이영희', '010-1111-0002', 'F', 'GOLD',  'ACTIVE',  NOW(), 'SYSTEM', NOW()),
  ('MBR0000000000003', '2604010000000001', 'park@example.com', '$2a$10$8Mq5GfR3k9pL2vHn7YxZOeQwJkT4dCbIuNsAoE1mRfXlWgPzYhVKi', '박민준', '010-1111-0003', 'M', 'BASIC', 'ACTIVE',  NOW(), 'SYSTEM', NOW()),
  ('MBR0000000000004', '2604010000000001', 'choi@example.com', '$2a$10$8Mq5GfR3k9pL2vHn7YxZOeQwJkT4dCbIuNsAoE1mRfXlWgPzYhVKi', '최지연', '010-1111-0004', 'F', 'BASIC', 'ACTIVE',  NOW(), 'SYSTEM', NOW()),
  ('MBR0000000000005', '2604010000000001', 'jung@example.com', '$2a$10$8Mq5GfR3k9pL2vHn7YxZOeQwJkT4dCbIuNsAoE1mRfXlWgPzYhVKi', '정수진', '010-1111-0005', 'F', 'GOLD',  'ACTIVE',  NOW(), 'SYSTEM', NOW()),
  ('MBR0000000000006', '2604010000000001', 'kang@example.com', '$2a$10$8Mq5GfR3k9pL2vHn7YxZOeQwJkT4dCbIuNsAoE1mRfXlWgPzYhVKi', '강동원', '010-1111-0006', 'M', 'VIP',   'ACTIVE',  NOW(), 'SYSTEM', NOW()),
  ('MBR0000000000007', '2604010000000001', 'yoon@example.com', '$2a$10$8Mq5GfR3k9pL2vHn7YxZOeQwJkT4dCbIuNsAoE1mRfXlWgPzYhVKi', '윤서연', '010-1111-0007', 'F', 'BASIC', 'DORMANT', NOW(), 'SYSTEM', NOW()),
  ('MBR0000000000008', '2604010000000001', 'lim@example.com',  '$2a$10$8Mq5GfR3k9pL2vHn7YxZOeQwJkT4dCbIuNsAoE1mRfXlWgPzYhVKi', '임현우', '010-1111-0008', 'M', 'GOLD',  'ACTIVE',  NOW(), 'SYSTEM', NOW()),
  ('MBR0000000000009', '2604010000000001', 'han@example.com',  '$2a$10$8Mq5GfR3k9pL2vHn7YxZOeQwJkT4dCbIuNsAoE1mRfXlWgPzYhVKi', '한지민', '010-1111-0009', 'F', 'BASIC', 'ACTIVE',  NOW(), 'SYSTEM', NOW()),
  ('MBR0000000000010', '2604010000000001', 'oh@example.com',   '$2a$10$8Mq5GfR3k9pL2vHn7YxZOeQwJkT4dCbIuNsAoE1mRfXlWgPzYhVKi', '오세진', '010-1111-0010', 'M', 'VIP',   'ACTIVE',  NOW(), 'SYSTEM', NOW())
ON CONFLICT (member_id) DO NOTHING;

-- ============================================================
-- [PD] 카테고리
-- ============================================================
INSERT INTO pd_category (category_id, category_nm, category_depth, sort_ord, reg_by, reg_date)
VALUES
  ('CAT0000000000001', '패션',       1, 1, 'SYSTEM', NOW()),
  ('CAT0000000000002', '전자/가전',  1, 2, 'SYSTEM', NOW()),
  ('CAT0000000000003', '스포츠',     1, 3, 'SYSTEM', NOW()),
  ('CAT0000000000004', '생활/주방',  1, 4, 'SYSTEM', NOW()),
  ('CAT0000000000011', '남성의류',   2, 1, 'SYSTEM', NOW()),
  ('CAT0000000000012', '여성의류',   2, 2, 'SYSTEM', NOW()),
  ('CAT0000000000013', '신발',       2, 3, 'SYSTEM', NOW()),
  ('CAT0000000000021', '스마트폰',   2, 1, 'SYSTEM', NOW()),
  ('CAT0000000000022', 'TV/영상',    2, 2, 'SYSTEM', NOW()),
  ('CAT0000000000023', '노트북',     2, 3, 'SYSTEM', NOW()),
  ('CAT0000000000031', '운동화',     2, 1, 'SYSTEM', NOW()),
  ('CAT0000000000032', '스포츠의류', 2, 2, 'SYSTEM', NOW())
ON CONFLICT (category_id) DO NOTHING;

-- 상위-하위 카테고리 연결
UPDATE pd_category SET parent_category_id = 'CAT0000000000001' WHERE category_id IN ('CAT0000000000011','CAT0000000000012','CAT0000000000013');
UPDATE pd_category SET parent_category_id = 'CAT0000000000002' WHERE category_id IN ('CAT0000000000021','CAT0000000000022','CAT0000000000023');
UPDATE pd_category SET parent_category_id = 'CAT0000000000003' WHERE category_id IN ('CAT0000000000031','CAT0000000000032');

-- ============================================================
-- [PD] 상품
-- ============================================================
INSERT INTO pd_prod (prod_id, site_id, category_id, prod_nm, prod_code, brand_id, vendor_id, list_price, sale_price, purchase_price, prod_status_cd, reg_by, reg_date)
VALUES
  ('PRD0000000000001', '2604010000000001', 'CAT0000000000031', '나이키 에어맥스 270',      'P-NIKE-001',    'BRD0000000000001', 'VND0000000000001', 179000,  159000,  80000,   'ACTIVE',  'SYSTEM', NOW()),
  ('PRD0000000000002', '2604010000000001', 'CAT0000000000031', '나이키 조던 1 레트로',     'P-NIKE-002',    'BRD0000000000001', 'VND0000000000001', 259000,  239000,  120000,  'ACTIVE',  'SYSTEM', NOW()),
  ('PRD0000000000003', '2604010000000001', 'CAT0000000000031', '아디다스 울트라부스트',    'P-ADIDAS-001',  'BRD0000000000002', 'VND0000000000002', 209000,  189000,  95000,   'ACTIVE',  'SYSTEM', NOW()),
  ('PRD0000000000004', '2604010000000001', 'CAT0000000000011', '나이키 드라이핏 티셔츠',   'P-NIKE-003',    'BRD0000000000001', 'VND0000000000001', 59000,   49000,   22000,   'ACTIVE',  'SYSTEM', NOW()),
  ('PRD0000000000005', '2604010000000001', 'CAT0000000000032', '아디다스 트레이닝 바지',   'P-ADIDAS-002',  'BRD0000000000002', 'VND0000000000002', 79000,   69000,   32000,   'ACTIVE',  'SYSTEM', NOW()),
  ('PRD0000000000006', '2604010000000001', 'CAT0000000000021', '삼성 갤럭시 S25',          'P-SAMSUNG-001', 'BRD0000000000004', 'VND0000000000004', 1450000, 1350000, 900000,  'ACTIVE',  'SYSTEM', NOW()),
  ('PRD0000000000007', '2604010000000001', 'CAT0000000000022', 'LG 올레드 TV 65인치',      'P-LG-001',      'BRD0000000000005', 'VND0000000000004', 3290000, 2990000, 1800000, 'ACTIVE',  'SYSTEM', NOW()),
  ('PRD0000000000008', '2604010000000001', 'CAT0000000000023', '애플 맥북 프로 M4',        'P-APPLE-001',   'BRD0000000000006', 'VND0000000000004', 3590000, 3290000, 2200000, 'ACTIVE',  'SYSTEM', NOW()),
  ('PRD0000000000009', '2604010000000001', 'CAT0000000000011', '노스페이스 패딩 점퍼',     'P-NF-001',      'BRD0000000000003', 'VND0000000000003', 329000,  299000,  150000,  'ACTIVE',  'SYSTEM', NOW()),
  ('PRD0000000000010', '2604010000000001', 'CAT0000000000011', '자체브랜드 면티 3팩',      'P-OWN-001',     'BRD0000000000007', 'VND0000000000005', 34900,   29900,   10000,   'ACTIVE',  'SYSTEM', NOW()),
  ('PRD0000000000011', '2604010000000001', 'CAT0000000000031', '나이키 러닝화 PEGASUS',    'P-NIKE-004',    'BRD0000000000001', 'VND0000000000001', 159000,  139000,  70000,   'SOLDOUT', 'SYSTEM', NOW()),
  ('PRD0000000000012', '2604010000000001', 'CAT0000000000023', '삼성 노트북 Galaxy Book5', 'P-SAMSUNG-002', 'BRD0000000000004', 'VND0000000000004', 1790000, 1590000, 1100000, 'ACTIVE',  'SYSTEM', NOW())
ON CONFLICT (prod_id) DO NOTHING;

-- 상품 SKU (옵션조합 재고)
INSERT INTO pd_prod_sku (sku_id, prod_id, sku_code, prod_opt_stock, use_yn, reg_by, reg_date)
VALUES
  ('SKU0000000000001', 'PRD0000000000001', 'SKU-NIKE-001-260', 5,  'Y', 'SYSTEM', NOW()),
  ('SKU0000000000002', 'PRD0000000000001', 'SKU-NIKE-001-270', 8,  'Y', 'SYSTEM', NOW()),
  ('SKU0000000000003', 'PRD0000000000001', 'SKU-NIKE-001-280', 3,  'Y', 'SYSTEM', NOW()),
  ('SKU0000000000004', 'PRD0000000000004', 'SKU-NIKE-003-S',   15, 'Y', 'SYSTEM', NOW()),
  ('SKU0000000000005', 'PRD0000000000004', 'SKU-NIKE-003-M',   20, 'Y', 'SYSTEM', NOW()),
  ('SKU0000000000006', 'PRD0000000000004', 'SKU-NIKE-003-L',   12, 'Y', 'SYSTEM', NOW()),
  ('SKU0000000000007', 'PRD0000000000006', 'SKU-SS-001-256',   10, 'Y', 'SYSTEM', NOW()),
  ('SKU0000000000008', 'PRD0000000000006', 'SKU-SS-001-512',   7,  'Y', 'SYSTEM', NOW())
ON CONFLICT (sku_id) DO NOTHING;

-- ============================================================
-- [OD] 주문
-- ============================================================
INSERT INTO od_order (order_id, site_id, member_id, member_nm, orderer_email, recv_nm, recv_phone, recv_zip, recv_addr, recv_addr_detail, total_amt, total_discount_amt, pay_amt, pay_method_cd, order_status_cd, order_date, reg_by, reg_date)
VALUES
  ('ORD0000000000001', '2604010000000001', 'MBR0000000000001', '김철수', 'kim@example.com',  '김철수', '010-1111-0001', '06000', '서울시 강남구 테헤란로 1',     '101호',  159000,  0,     159000,  'TOSS',  'COMPLT',    NOW() - INTERVAL '30 days', 'SYSTEM', NOW()),
  ('ORD0000000000002', '2604010000000001', 'MBR0000000000002', '이영희', 'lee@example.com',  '이영희', '010-1111-0002', '07000', '서울시 마포구 홍대로 22',      '202호',  49000,   4900,  44100,   'KAKAO', 'COMPLT',    NOW() - INTERVAL '25 days', 'SYSTEM', NOW()),
  ('ORD0000000000003', '2604010000000001', 'MBR0000000000003', '박민준', 'park@example.com', '박민준', '010-1111-0003', '08000', '서울시 송파구 올림픽로 88',    '303호',  1350000, 0,     1350000, 'NAVER', 'SHIPPED',   NOW() - INTERVAL '5 days',  'SYSTEM', NOW()),
  ('ORD0000000000004', '2604010000000001', 'MBR0000000000004', '최지연', 'choi@example.com', '최지연', '010-1111-0004', '04000', '서울시 용산구 이태원로 10',    '404호',  239000,  0,     239000,  'TOSS',  'PREPARING', NOW() - INTERVAL '2 days',  'SYSTEM', NOW()),
  ('ORD0000000000005', '2604010000000001', 'MBR0000000000005', '정수진', 'jung@example.com', '정수진', '010-1111-0005', '03000', '서울시 종로구 인사동길 5',     '501호',  189000,  5670,  183330,  'TOSS',  'PAID',      NOW() - INTERVAL '1 day',   'SYSTEM', NOW()),
  ('ORD0000000000006', '2604010000000001', 'MBR0000000000001', '김철수', 'kim@example.com',  '김철수', '010-1111-0001', '06000', '서울시 강남구 테헤란로 1',     '101호',  3290000, 0,     3290000, 'TOSS',  'PENDING',   NOW(),                      'SYSTEM', NOW()),
  ('ORD0000000000007', '2604010000000001', 'MBR0000000000006', '강동원', 'kang@example.com', '강동원', '010-1111-0006', '05000', '서울시 영등포구 여의도동 1',   '601호',  299000,  14950, 284050,  'TOSS',  'COMPLT',    NOW() - INTERVAL '15 days', 'SYSTEM', NOW()),
  ('ORD0000000000008', '2604010000000001', 'MBR0000000000008', '임현우', 'lim@example.com',  '임현우', '010-1111-0008', '09000', '경기도 성남시 분당구 판교로 1', '801호', 69000,   2070,  66930,   'KAKAO', 'SHIPPED',   NOW() - INTERVAL '3 days',  'SYSTEM', NOW())
ON CONFLICT (order_id) DO NOTHING;

-- 주문 아이템
INSERT INTO od_order_item (order_item_id, order_id, prod_id, sku_id, prod_nm, order_qty, unit_price, item_order_amt, order_item_status_cd, reg_by, reg_date)
VALUES
  ('ORI0000000000001', 'ORD0000000000001', 'PRD0000000000001', 'SKU0000000000001', '나이키 에어맥스 270',       1, 159000,  159000,  'CONFIRMED', 'SYSTEM', NOW()),
  ('ORI0000000000002', 'ORD0000000000002', 'PRD0000000000004', 'SKU0000000000005', '나이키 드라이핏 티셔츠',    1, 49000,   49000,   'CONFIRMED', 'SYSTEM', NOW()),
  ('ORI0000000000003', 'ORD0000000000003', 'PRD0000000000006', 'SKU0000000000007', '삼성 갤럭시 S25',           1, 1350000, 1350000, 'SHIPPING',  'SYSTEM', NOW()),
  ('ORI0000000000004', 'ORD0000000000004', 'PRD0000000000002', NULL,               '나이키 조던 1 레트로',      1, 239000,  239000,  'PREPARING', 'SYSTEM', NOW()),
  ('ORI0000000000005', 'ORD0000000000005', 'PRD0000000000003', NULL,               '아디다스 울트라부스트',     1, 189000,  189000,  'PAID',      'SYSTEM', NOW()),
  ('ORI0000000000006', 'ORD0000000000006', 'PRD0000000000008', NULL,               '애플 맥북 프로 M4',         1, 3290000, 3290000, 'ORDERED',   'SYSTEM', NOW()),
  ('ORI0000000000007', 'ORD0000000000007', 'PRD0000000000009', NULL,               '노스페이스 패딩 점퍼',      1, 299000,  299000,  'CONFIRMED', 'SYSTEM', NOW()),
  ('ORI0000000000008', 'ORD0000000000008', 'PRD0000000000005', NULL,               '아디다스 트레이닝 바지',    1, 69000,   69000,   'SHIPPING',  'SYSTEM', NOW())
ON CONFLICT (order_item_id) DO NOTHING;

-- ============================================================
-- [OD] 결제
-- ============================================================
INSERT INTO od_pay (pay_id, order_id, pay_method_cd, pay_amt, pay_status_cd, pay_date, reg_by, reg_date)
VALUES
  ('PAY0000000000001', 'ORD0000000000001', 'TOSS',  159000,  'COMPLT', NOW() - INTERVAL '30 days', 'SYSTEM', NOW()),
  ('PAY0000000000002', 'ORD0000000000002', 'KAKAO', 44100,   'COMPLT', NOW() - INTERVAL '25 days', 'SYSTEM', NOW()),
  ('PAY0000000000003', 'ORD0000000000003', 'NAVER', 1350000, 'COMPLT', NOW() - INTERVAL '5 days',  'SYSTEM', NOW()),
  ('PAY0000000000004', 'ORD0000000000004', 'TOSS',  239000,  'COMPLT', NOW() - INTERVAL '2 days',  'SYSTEM', NOW()),
  ('PAY0000000000005', 'ORD0000000000005', 'TOSS',  183330,  'COMPLT', NOW() - INTERVAL '1 day',   'SYSTEM', NOW()),
  ('PAY0000000000007', 'ORD0000000000007', 'TOSS',  284050,  'COMPLT', NOW() - INTERVAL '15 days', 'SYSTEM', NOW()),
  ('PAY0000000000008', 'ORD0000000000008', 'KAKAO', 66930,   'COMPLT', NOW() - INTERVAL '3 days',  'SYSTEM', NOW())
ON CONFLICT (pay_id) DO NOTHING;

-- ============================================================
-- [OD] 배송
-- ============================================================
INSERT INTO od_dliv (dliv_id, order_id, dliv_div_cd, outbound_courier_cd, outbound_tracking_no, dliv_status_cd, dliv_ship_date, reg_by, reg_date)
VALUES
  ('DLV0000000000001', 'ORD0000000000001', 'OUTBOUND', 'CJ',     '123456789012', 'DELIVERED',  NOW() - INTERVAL '28 days', 'SYSTEM', NOW()),
  ('DLV0000000000002', 'ORD0000000000002', 'OUTBOUND', 'CJ',     '123456789013', 'DELIVERED',  NOW() - INTERVAL '23 days', 'SYSTEM', NOW()),
  ('DLV0000000000003', 'ORD0000000000003', 'OUTBOUND', 'HANJIN', '234567890123', 'IN_TRANSIT', NOW() - INTERVAL '3 days',  'SYSTEM', NOW()),
  ('DLV0000000000007', 'ORD0000000000007', 'OUTBOUND', 'CJ',     '345678901234', 'DELIVERED',  NOW() - INTERVAL '13 days', 'SYSTEM', NOW()),
  ('DLV0000000000008', 'ORD0000000000008', 'OUTBOUND', 'LOTTE',  '456789012345', 'SHIPPED',    NOW() - INTERVAL '2 days',  'SYSTEM', NOW())
ON CONFLICT (dliv_id) DO NOTHING;

-- ============================================================
-- [OD] 클레임 (취소/반품)
-- ============================================================
INSERT INTO od_claim (claim_id, order_id, member_id, claim_type_cd, reason_detail, claim_status_cd, reg_by, reg_date)
VALUES
  ('CLM0000000000001', 'ORD0000000000001', 'MBR0000000000001', 'RETURN',   '사이즈 불만족',  'COMPLT',   'SYSTEM', NOW() - INTERVAL '25 days'),
  ('CLM0000000000002', 'ORD0000000000002', 'MBR0000000000002', 'EXCHANGE', '색상 변경 원함', 'ACCEPTED', 'SYSTEM', NOW() - INTERVAL '20 days')
ON CONFLICT (claim_id) DO NOTHING;

-- ============================================================
-- [PM] 쿠폰
-- ============================================================
INSERT INTO pm_coupon (coupon_id, site_id, coupon_cd, coupon_nm, coupon_type_cd, discount_rate, discount_amt, min_order_amt, valid_from, valid_to, coupon_status_cd, issue_limit, reg_by, reg_date)
VALUES
  ('CPN0000000000001', '2604010000000001', 'WELCOME10', '신규회원 10% 할인',  'RATE', 10,   0,    10000, CURRENT_DATE, CURRENT_DATE + 90,  'ACTIVE',   1000, 'SYSTEM', NOW()),
  ('CPN0000000000002', '2604010000000001', 'SAVE5000',  '5000원 할인쿠폰',    'RATE', 0,    5000, 30000, CURRENT_DATE, CURRENT_DATE + 30,  'ACTIVE',   500,  'SYSTEM', NOW()),
  ('CPN0000000000003', '2604010000000001', 'VIP20',     'VIP 20% 할인',       'RATE', 20,   0,    50000, CURRENT_DATE, CURRENT_DATE + 365, 'ACTIVE',   100,  'SYSTEM', NOW()),
  ('CPN0000000000004', '2604010000000001', 'SUMMER15',  '여름 시즌 세일 15%', 'RATE', 15,   0,    20000, CURRENT_DATE - 60, CURRENT_DATE - 1, 'INACTIVE', 2000, 'SYSTEM', NOW())
ON CONFLICT (coupon_id) DO NOTHING;

-- 쿠폰 발급
INSERT INTO pm_coupon_issue (issue_id, coupon_id, member_id, issue_date, use_yn, reg_by, reg_date)
VALUES
  ('CPI0000000000001', 'CPN0000000000001', 'MBR0000000000003', NOW(), 'N', 'SYSTEM', NOW()),
  ('CPI0000000000002', 'CPN0000000000001', 'MBR0000000000004', NOW(), 'N', 'SYSTEM', NOW()),
  ('CPI0000000000003', 'CPN0000000000003', 'MBR0000000000001', NOW(), 'N', 'SYSTEM', NOW()),
  ('CPI0000000000004', 'CPN0000000000003', 'MBR0000000000006', NOW(), 'N', 'SYSTEM', NOW()),
  ('CPI0000000000005', 'CPN0000000000002', 'MBR0000000000002', NOW(), 'Y', 'SYSTEM', NOW())
ON CONFLICT (issue_id) DO NOTHING;

-- ============================================================
-- [PM] 이벤트
-- ============================================================
INSERT INTO pm_event (event_id, site_id, event_nm, event_title, event_type_cd, event_status_cd, start_date, end_date, use_yn, reg_by, reg_date)
VALUES
  ('EVT0000000000001', '2604010000000001', '봄맞이 특가 행사',    '봄맞이! 최대 50% 할인 특가',       'PROMOTION', 'ACTIVE', CURRENT_DATE - 10, CURRENT_DATE + 20,  'Y', 'SYSTEM', NOW()),
  ('EVT0000000000002', '2604010000000001', '신상품 출시 이벤트',  '새로 나온 나이키 신상 먼저 만나기', 'CAMPAIGN',  'ACTIVE', CURRENT_DATE,      CURRENT_DATE + 14,  'Y', 'SYSTEM', NOW()),
  ('EVT0000000000003', '2604010000000001', '겨울 시즌 오프',      '겨울 시즌 오프 최대 70% 세일',     'PROMOTION', 'ENDED',  CURRENT_DATE - 90, CURRENT_DATE - 30,  'Y', 'SYSTEM', NOW())
ON CONFLICT (event_id) DO NOTHING;

-- ============================================================
-- [DP] 전시 UI
-- ============================================================
INSERT INTO dp_ui (ui_id, site_id, ui_cd, ui_nm, use_yn, sort_ord, reg_by, reg_date)
VALUES
  ('DUI0000000000001', '2604010000000001', 'MAIN_UI',  '메인 UI',   'Y', 1, 'SYSTEM', NOW()),
  ('DUI0000000000002', '2604010000000001', 'EVENT_UI', '이벤트 UI', 'Y', 2, 'SYSTEM', NOW()),
  ('DUI0000000000003', '2604010000000001', 'PROD_UI',  '상품 UI',   'Y', 3, 'SYSTEM', NOW())
ON CONFLICT (ui_id) DO NOTHING;

-- [DP] 전시 영역 (ui_id FK 필수)
INSERT INTO dp_area (area_id, ui_id, site_id, area_cd, area_nm, use_yn, reg_by, reg_date)
VALUES
  ('DAR0000000000001', 'DUI0000000000001', '2604010000000001', 'MAIN_BANNER',    '메인 배너',     'Y', 'SYSTEM', NOW()),
  ('DAR0000000000002', 'DUI0000000000001', '2604010000000001', 'SUB_BANNER',     '서브 배너',     'Y', 'SYSTEM', NOW()),
  ('DAR0000000000003', 'DUI0000000000001', '2604010000000001', 'RECOMMEND_PROD', '추천상품 영역', 'Y', 'SYSTEM', NOW()),
  ('DAR0000000000004', 'DUI0000000000002', '2604010000000001', 'EVENT_BANNER',   '이벤트 배너',   'Y', 'SYSTEM', NOW()),
  ('DAR0000000000005', 'DUI0000000000001', '2604010000000001', 'POPUP',          '팝업 영역',     'Y', 'SYSTEM', NOW())
ON CONFLICT (area_id) DO NOTHING;

-- ============================================================
-- [SY] 게시판 마스터
-- ============================================================
INSERT INTO sy_bbm (bbm_id, site_id, bbm_code, bbm_nm, bbm_type_cd, allow_comment, allow_attach, use_yn, sort_ord, reg_by, reg_date)
VALUES
  ('BBM0000000000001', '2604010000000001', 'NOTICE', '공지사항',  'NOTICE', 'N', 'N', 'Y', 1, 'SYSTEM', NOW()),
  ('BBM0000000000002', '2604010000000001', 'FAQ',    'FAQ',       'FAQ',    'N', 'N', 'Y', 2, 'SYSTEM', NOW()),
  ('BBM0000000000003', '2604010000000001', 'FREE',   '자유게시판', 'BOARD', 'Y', 'Y', 'Y', 3, 'SYSTEM', NOW()),
  ('BBM0000000000004', '2604010000000001', 'REVIEW', '상품후기',  'REVIEW', 'Y', 'Y', 'Y', 4, 'SYSTEM', NOW())
ON CONFLICT (bbm_id) DO NOTHING;

-- ============================================================
-- [SY] 공지사항
-- ============================================================
INSERT INTO sy_notice (notice_id, site_id, notice_title, content_html, notice_type_cd, notice_status_cd, start_date, end_date, reg_by, reg_date)
VALUES
  ('NTC0000000000001', '2604010000000001', '[공지] 봄 세일 시작 안내',         '안녕하세요. ShopJoy입니다. 봄 시즌 특별 세일이 시작되었습니다.', 'GENERAL', 'ACTIVE', CURRENT_DATE, CURRENT_DATE + 30,       'SYSTEM', NOW()),
  ('NTC0000000000002', '2604010000000001', '[공지] 서버 점검 안내',             '2026-04-25 02:00 ~ 04:00 서버 점검이 있을 예정입니다.',          'SYSTEM',  'ACTIVE', CURRENT_DATE, CURRENT_DATE + 7,        'SYSTEM', NOW()),
  ('NTC0000000000003', '2604010000000001', '[공지] 개인정보처리방침 개정 안내', '개인정보처리방침이 개정되었습니다. 확인 부탁드립니다.',           'GENERAL', 'ACTIVE', CURRENT_DATE - 30, CURRENT_DATE + 335, 'SYSTEM', NOW())
ON CONFLICT (notice_id) DO NOTHING;

-- ============================================================
-- 완료
-- ============================================================
DO $$ BEGIN
  RAISE NOTICE '샘플 데이터 삽입 완료';
END $$;
