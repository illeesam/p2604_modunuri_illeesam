-- ============================================================
-- dp_panel_item : 디스플레이 패널 항목 (샘플 데이터)
-- ============================================================

-- 모바일 배너 1 > 이미지 배너 위젯 인스턴스
INSERT INTO dp_panel_item (panel_item_id, panel_id, widget_lib_id, content_type_cd, item_sort_ord, widget_config_json, visibility_targets, use_yn, reg_by, reg_date)
VALUES ('260401040001', '260401020001', '260401030001', 'WIDGET', 1, '{"imgUrl":"/assets/images/banner1.jpg","link":"/products","linkTarget":"_self"}', '^PUBLIC^', 'Y', 'admin001', CURRENT_TIMESTAMP);

-- 모바일 배너 2 > 이미지 배너 위젯 인스턴스 1
INSERT INTO dp_panel_item (panel_item_id, panel_id, widget_lib_id, content_type_cd, item_sort_ord, widget_config_json, visibility_targets, use_yn, reg_by, reg_date)
VALUES ('260401040002', '260401020002', '260401030001', 'WIDGET', 1, '{"imgUrl":"/assets/images/banner2-1.jpg","link":"/member/coupons","linkTarget":"_self"}', '^MEMBER^', 'Y', 'admin001', CURRENT_TIMESTAMP);

-- 모바일 배너 2 > 이미지 배너 위젯 인스턴스 2
INSERT INTO dp_panel_item (panel_item_id, panel_id, widget_lib_id, content_type_cd, item_sort_ord, widget_config_json, visibility_targets, use_yn, reg_by, reg_date)
VALUES ('260401040003', '260401020002', '260401030001', 'WIDGET', 2, '{"imgUrl":"/assets/images/banner2-2.jpg","link":"/events","linkTarget":"_self"}', '^MEMBER^', 'Y', 'admin001', CURRENT_TIMESTAMP);

-- 추천상품 슬라이더 패널 > 상품 슬라이더 위젯 인스턴스
INSERT INTO dp_panel_item (panel_item_id, panel_id, widget_lib_id, content_type_cd, item_sort_ord, widget_config_json, visibility_targets, use_yn, reg_by, reg_date)
VALUES ('260401040004', '260401020003', '260401030002', 'WIDGET', 1, '{"productIds":["prod001","prod002","prod003","prod004"],"itemsPerView":2,"autoPlay":true,"interval":5000}', '^PUBLIC^', 'Y', 'admin001', CURRENT_TIMESTAMP);

-- PC 메인 배너 패널 > 이미지 배너 위젯 인스턴스
INSERT INTO dp_panel_item (panel_item_id, panel_id, widget_lib_id, content_type_cd, item_sort_ord, widget_config_json, visibility_targets, use_yn, reg_by, reg_date)
VALUES ('260401040005', '260401020004', '260401030001', 'WIDGET', 1, '{"imgUrl":"/assets/images/pc-banner.jpg","link":"/promotions","linkTarget":"_self"}', '^PUBLIC^', 'Y', 'admin001', CURRENT_TIMESTAMP);

-- PC 사이드바 > 카테고리 위젯 인스턴스
INSERT INTO dp_panel_item (panel_item_id, panel_id, widget_lib_id, content_type_cd, item_sort_ord, widget_config_json, visibility_targets, use_yn, reg_by, reg_date)
VALUES ('260401040006', '260401020005', '260401030003', 'WIDGET', 1, '{"categoryIds":["cat001","cat002","cat003"],"columns":1}', '^PUBLIC^', 'Y', 'admin001', CURRENT_TIMESTAMP);

-- PC 사이드바 > 쿠폰 위젯 인스턴스
INSERT INTO dp_panel_item (panel_item_id, panel_id, widget_lib_id, content_type_cd, item_sort_ord, widget_config_json, visibility_targets, use_yn, reg_by, reg_date)
VALUES ('260401040007', '260401020005', '260401030006', 'WIDGET', 2, '{"couponIds":["coupon001","coupon002","coupon003"],"limit":3}', '^PUBLIC^', 'Y', 'admin001', CURRENT_TIMESTAMP);

-- 이벤트 페이지 > HTML 커스텀 위젯 인스턴스
INSERT INTO dp_panel_item (panel_item_id, panel_id, widget_lib_id, content_type_cd, item_sort_ord, widget_config_json, visibility_targets, use_yn, reg_by, reg_date)
VALUES ('260401040008', '260401020006', '260401030004', 'WIDGET', 1, '{"html":"<div class=''event-content''><h2>이벤트 제목</h2><p>이벤트 설명</p></div>"}', '^PUBLIC^', 'Y', 'admin001', CURRENT_TIMESTAMP);

-- 이벤트 페이지 > 텍스트 배너 위젯 인스턴스
INSERT INTO dp_panel_item (panel_item_id, panel_id, widget_lib_id, content_type_cd, item_sort_ord, widget_config_json, visibility_targets, use_yn, reg_by, reg_date)
VALUES ('260401040009', '260401020006', '260401030005', 'WIDGET', 2, '{"title":"혜택","subtitle":"이벤트를 통한 최대 50% 할인","bgColor":"#ff6b9d","textColor":"#ffffff"}', '^PUBLIC^', 'Y', 'admin001', CURRENT_TIMESTAMP);
