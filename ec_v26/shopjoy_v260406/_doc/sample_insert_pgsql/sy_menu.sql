-- ============================================================
-- sy_menu 샘플 데이터
-- ============================================================

-- 1뎁스 (폴더)
INSERT INTO sy_menu (menu_id, menu_code, menu_name, parent_id, menu_url, menu_type, sort_ord, use_yn, reg_date) VALUES
('2604110003700001', 'MENU_EC',    '이커머스 관리',  NULL, NULL, 'FOLDER', 1, 'Y', NOW()),
('2604110003700002', 'MENU_SY',    '시스템 관리',    NULL, NULL, 'FOLDER', 2, 'Y', NOW());

-- 2뎁스 (ec)
INSERT INTO sy_menu (menu_id, menu_code, menu_name, parent_id, menu_url, menu_type, sort_ord, use_yn, reg_date) VALUES
('2604110003710001', 'MENU_MEMBER',    '회원 관리',       '2604110003700001', 'MemberMng',    'PAGE', 1, 'Y', NOW()),
('2604110003710002', 'MENU_PROD',      '상품 관리',       '2604110003700001', 'ProdMng',      'PAGE', 2, 'Y', NOW()),
('2604110003710003', 'MENU_CATEGORY',  '카테고리 관리',   '2604110003700001', 'CategoryMng',  'PAGE', 3, 'Y', NOW()),
('2604110003710004', 'MENU_ORDER',     '주문 관리',       '2604110003700001', 'OrderMng',     'PAGE', 4, 'Y', NOW()),
('2604110003710005', 'MENU_DLIV',      '배송 관리',       '2604110003700001', 'DlivMng',      'PAGE', 5, 'Y', NOW()),
('2604110003710006', 'MENU_CLAIM',     '클레임 관리',     '2604110003700001', 'ClaimMng',     'PAGE', 6, 'Y', NOW()),
('2604110003710007', 'MENU_COUPON',    '쿠폰 관리',       '2604110003700001', 'CouponMng',    'PAGE', 7, 'Y', NOW()),
('2604110003710008', 'MENU_EVENT',     '이벤트 관리',     '2604110003700001', 'EventMng',     'PAGE', 8, 'Y', NOW()),
('2604110003710009', 'MENU_CACHE',     '적립금 관리',     '2604110003700001', 'CacheMng',     'PAGE', 9, 'Y', NOW()),
('2604110003710010', 'MENU_CHATT',     '채팅 관리',       '2604110003700001', 'ChattMng',     'PAGE', 10, 'Y', NOW()),
('2604110003710011', 'MENU_NOTICE',    '공지 관리',       '2604110003700001', 'NoticeMng',    'PAGE', 11, 'Y', NOW()),
('2604110003710012', 'MENU_CUSTINFO',  '고객종합정보',    '2604110003700001', 'CustInfoMng',  'PAGE', 12, 'Y', NOW()),
('2604110003710013', 'MENU_DISP',      '디스플레이 관리', '2604110003700001', 'DispPanelMng', 'PAGE', 13, 'Y', NOW());

-- 2뎁스 (sy)
INSERT INTO sy_menu (menu_id, menu_code, menu_name, parent_id, menu_url, menu_type, sort_ord, use_yn, reg_date) VALUES
('2604110003720001', 'MENU_DASHBOARD', '대시보드',     '2604110003700002', 'DashboardMng', 'PAGE', 1, 'Y', NOW()),
('2604110003720002', 'MENU_USER',      '사용자 관리',  '2604110003700002', 'UserMng',      'PAGE', 2, 'Y', NOW()),
('2604110003720003', 'MENU_ROLE',      '권한 관리',    '2604110003700002', 'RoleMng',      'PAGE', 3, 'Y', NOW()),
('2604110003720004', 'MENU_MENU',      '메뉴 관리',    '2604110003700002', 'MenuMng',      'PAGE', 4, 'Y', NOW()),
('2604110003720005', 'MENU_SITE',      '사이트 관리',  '2604110003700002', 'SiteMng',      'PAGE', 5, 'Y', NOW()),
('2604110003720006', 'MENU_VENDOR',    '업체 관리',    '2604110003700002', 'VendorMng',    'PAGE', 6, 'Y', NOW()),
('2604110003720007', 'MENU_BRAND',     '브랜드 관리',  '2604110003700002', 'BrandMng',     'PAGE', 7, 'Y', NOW()),
('2604110003720008', 'MENU_DEPT',      '부서 관리',    '2604110003700002', 'DeptMng',      'PAGE', 8, 'Y', NOW()),
('2604110003720009', 'MENU_CODE',      '코드 관리',    '2604110003700002', 'CodeMng',      'PAGE', 9, 'Y', NOW()),
('2604110003720010', 'MENU_CONTACT',   '고객문의',     '2604110003700002', 'ContactMng',   'PAGE', 10, 'Y', NOW()),
('2604110003720011', 'MENU_BBS',       '게시물 관리',  '2604110003700002', 'BbsMng',       'PAGE', 11, 'Y', NOW()),
('2604110003720012', 'MENU_BBM',       '게시판 관리',  '2604110003700002', 'BbmMng',       'PAGE', 12, 'Y', NOW()),
('2604110003720013', 'MENU_ALARM',     '알림 관리',    '2604110003700002', 'AlarmMng',     'PAGE', 13, 'Y', NOW()),
('2604110003720014', 'MENU_TEMPLATE',  '템플릿 관리',  '2604110003700002', 'TemplateMng',  'PAGE', 14, 'Y', NOW()),
('2604110003720015', 'MENU_BATCH',     '배치 관리',    '2604110003700002', 'BatchMng',     'PAGE', 15, 'Y', NOW()),
('2604110003720016', 'MENU_ATTACH',    '첨부파일 관리','2604110003700002', 'AttachMng',    'PAGE', 16, 'Y', NOW());
