-- ============================================================
-- dp_widget : 디스플레이 위젯 라이브러리 (샘플 데이터)
-- ============================================================

-- 이미지 배너 위젯
INSERT INTO dp_widget (widget_id, site_id, widget_nm, widget_type_cd, widget_desc, widget_config_json, preview_img_url, sort_ord, use_yn, reg_by, reg_date)
VALUES ('260401030001', '260401', '이미지 배너', 'image_banner', '단일 이미지 배너 위젯', '{"imgUrl":"","link":"","linkTarget":""}', '/assets/images/widgets/banner.png', 1, 'Y', 'admin001', CURRENT_TIMESTAMP);

-- 상품 슬라이더 위젯
INSERT INTO dp_widget (widget_id, site_id, widget_nm, widget_type_cd, widget_desc, widget_config_json, preview_img_url, sort_ord, use_yn, reg_by, reg_date)
VALUES ('260401030002', '260401', '상품 슬라이더', 'product_slider', '상품 슬라이더 위젯', '{"productIds":[],"itemsPerView":4,"autoPlay":true}', '/assets/images/widgets/slider.png', 2, 'Y', 'admin001', CURRENT_TIMESTAMP);

-- 카테고리 선택 위젯
INSERT INTO dp_widget (widget_id, site_id, widget_nm, widget_type_cd, widget_desc, widget_config_json, preview_img_url, sort_ord, use_yn, reg_by, reg_date)
VALUES ('260401030003', '260401', '카테고리', 'category', '카테고리 선택 위젯', '{"categoryIds":[],"columns":3}', '/assets/images/widgets/category.png', 3, 'Y', 'admin001', CURRENT_TIMESTAMP);

-- HTML 커스텀 위젯
INSERT INTO dp_widget (widget_id, site_id, widget_nm, widget_type_cd, widget_desc, widget_config_json, preview_img_url, sort_ord, use_yn, reg_by, reg_date)
VALUES ('260401030004', '260401', 'HTML 커스텀', 'html_custom', '커스텀 HTML 위젯', '{"html":""}', '/assets/images/widgets/html.png', 4, 'Y', 'admin001', CURRENT_TIMESTAMP);

-- 텍스트 배너 위젯
INSERT INTO dp_widget (widget_id, site_id, widget_nm, widget_type_cd, widget_desc, widget_config_json, preview_img_url, sort_ord, use_yn, reg_by, reg_date)
VALUES ('260401030005', '260401', '텍스트 배너', 'text_banner', '텍스트 배너 위젯', '{"title":"","subtitle":"","bgColor":"","textColor":""}', '/assets/images/widgets/text.png', 5, 'Y', 'admin001', CURRENT_TIMESTAMP);

-- 쿠폰 위젯
INSERT INTO dp_widget (widget_id, site_id, widget_nm, widget_type_cd, widget_desc, widget_config_json, preview_img_url, sort_ord, use_yn, reg_by, reg_date)
VALUES ('260401030006', '260401', '쿠폰', 'coupon', '쿠폰 리스트 위젯', '{"couponIds":[],"limit":5}', '/assets/images/widgets/coupon.png', 6, 'Y', 'admin001', CURRENT_TIMESTAMP);
