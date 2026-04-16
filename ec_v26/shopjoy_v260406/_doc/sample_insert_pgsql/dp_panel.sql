-- ============================================================
-- ec_disp_widget_lib / ec_disp_panel 샘플 데이터
-- ============================================================

-- 위젯 라이브러리
INSERT INTO dp_widget_lib (widget_lib_id, widget_code, widget_name, widget_type, description, is_system, sort_ord, use_yn, reg_date) VALUES
('2604110003000001', 'WGT_BANNER_SLIDE', '배너 슬라이더',    'SLIDER',  '여러 배너를 슬라이드로 표시',        'Y', 1, 'Y', NOW()),
('2604110003000002', 'WGT_PROD_GRID',    '상품 그리드',      'PRODUCT', '상품 목록을 그리드 형태로 표시',     'Y', 2, 'Y', NOW()),
('2604110003000003', 'WGT_PROD_SLIDE',   '상품 슬라이더',    'PRODUCT', '상품 목록을 슬라이드로 표시',        'Y', 3, 'Y', NOW()),
('2604110003000004', 'WGT_BANNER_SINGLE','단일 배너',         'BANNER',  '한 장 배너 표시',                   'Y', 4, 'Y', NOW()),
('2604110003000005', 'WGT_HTML_FREE',    'HTML 자유 위젯',   'HTML',    '자유롭게 HTML 삽입',                 'Y', 5, 'Y', NOW()),
('2604110003000006', 'WGT_CATE_GRID',   '카테고리 그리드',  'CATEGORY', '카테고리 아이콘 그리드 표시',        'Y', 6, 'Y', NOW());

-- 디스플레이 패널
INSERT INTO dp_panel (disp_panel_id, area_code, panel_name, widget_type, disp_type, click_action, click_target, condition_type, auth_required, sort_ord, status, reg_date) VALUES
('2604110003100001', 'MAIN_TOP',     '메인 상단 슬라이드 배너',    'SLIDER',  'SLIDE',  'LINK', '/products',                'ALL', 'N', 1, 'ACTIVE', NOW()),
('2604110003100002', 'MAIN_BANNER',  '봄 시즌 이벤트 배너',         'BANNER',  'SINGLE', 'LINK', '/events/2604110002800001',  'ALL', 'N', 1, 'ACTIVE', NOW()),
('2604110003100003', 'MAIN_PRODUCT', '베스트 상품 추천',            'PRODUCT', 'GRID',   'LINK', '/products',                'ALL', 'N', 1, 'ACTIVE', NOW()),
('2604110003100004', 'MAIN_PRODUCT', '신상품',                       'PRODUCT', 'SLIDE',  'LINK', '/products?isNew=Y',         'ALL', 'N', 2, 'ACTIVE', NOW()),
('2604110003100005', 'MAIN_BOTTOM',  'VIP 전용 배너',                'BANNER',  'SINGLE', 'LINK', '/events/2604110002800002',  'ALL', 'Y', 1, 'ACTIVE', NOW()),
('2604110003100006', 'POPUP',        '봄 할인 쿠폰 팝업',           'HTML',    'SINGLE', 'NONE', NULL,                        'ALL', 'N', 1, 'ACTIVE', NOW()),
('2604110003100007', 'MAIN_BANNER',  '(비노출) 겨울 배너',           'BANNER',  'SINGLE', 'LINK', '/events/2604110002800005',  'ALL', 'N', 2, 'INACTIVE', NOW());
