-- sy_code 샘플 INSERT 데이터
-- 공통 코드 마스터: 주문상태, 결제수단, 배송상태, 클레임상태 등

-- 주문 상태 코드
INSERT INTO shopjoy_2604.sy_code (code_id, code_grp, code_label, code_value, sort_ord, code_remark, use_yn, reg_by, reg_date)
VALUES
('ORDER_STATUS_PENDING', 'ORDER_STATUS', '대기중', 'PENDING', 1, '주문 접수 대기', 'Y', 'admin', CURRENT_TIMESTAMP),
('ORDER_STATUS_PAID', 'ORDER_STATUS', '결제완료', 'PAID', 2, '결제 완료', 'Y', 'admin', CURRENT_TIMESTAMP),
('ORDER_STATUS_PREPARING', 'ORDER_STATUS', '상품준비중', 'PREPARING', 3, '상품 준비 중', 'Y', 'admin', CURRENT_TIMESTAMP),
('ORDER_STATUS_SHIPPED', 'ORDER_STATUS', '배송중', 'SHIPPED', 4, '배송 중', 'Y', 'admin', CURRENT_TIMESTAMP),
('ORDER_STATUS_COMPLETED', 'ORDER_STATUS', '배송완료', 'COMPLETED', 5, '배송 완료', 'Y', 'admin', CURRENT_TIMESTAMP),
('ORDER_STATUS_CANCELLED', 'ORDER_STATUS', '주문취소', 'CANCELLED', 6, '주문 취소', 'Y', 'admin', CURRENT_TIMESTAMP);

-- 결제 수단 코드
INSERT INTO shopjoy_2604.sy_code (code_id, code_grp, code_label, code_value, sort_ord, code_remark, use_yn, reg_by, reg_date)
VALUES
('PAYMENT_BANK_TRANSFER', 'PAYMENT_METHOD', '무통장입금', 'BANK_TRANSFER', 1, '은행 계좌이체', 'Y', 'admin', CURRENT_TIMESTAMP),
('PAYMENT_VIRTUAL_ACCOUNT', 'PAYMENT_METHOD', '가상계좌', 'VIRTUAL_ACCOUNT', 2, '가상 계좌', 'Y', 'admin', CURRENT_TIMESTAMP),
('PAYMENT_CARD', 'PAYMENT_METHOD', '신용카드', 'CARD', 3, '신용카드 결제', 'Y', 'admin', CURRENT_TIMESTAMP),
('PAYMENT_TOSS', 'PAYMENT_METHOD', '토스', 'TOSS', 4, '토스 결제', 'Y', 'admin', CURRENT_TIMESTAMP),
('PAYMENT_KAKAO', 'PAYMENT_METHOD', '카카오페이', 'KAKAO', 5, '카카오페이 결제', 'Y', 'admin', CURRENT_TIMESTAMP),
('PAYMENT_NAVER', 'PAYMENT_METHOD', '네이버페이', 'NAVER', 6, '네이버페이 결제', 'Y', 'admin', CURRENT_TIMESTAMP);

-- 배송 상태 코드
INSERT INTO shopjoy_2604.sy_code (code_id, code_grp, code_label, code_value, sort_ord, code_remark, use_yn, reg_by, reg_date)
VALUES
('DELIVERY_STATUS_PREPARING', 'DELIVERY_STATUS', '배송준비중', 'PREPARING', 1, '배송 준비 중', 'Y', 'admin', CURRENT_TIMESTAMP),
('DELIVERY_STATUS_SHIPPED', 'DELIVERY_STATUS', '배송중', 'SHIPPED', 2, '배송 중', 'Y', 'admin', CURRENT_TIMESTAMP),
('DELIVERY_STATUS_ARRIVED', 'DELIVERY_STATUS', '배송완료', 'ARRIVED', 3, '배송 완료', 'Y', 'admin', CURRENT_TIMESTAMP),
('DELIVERY_STATUS_RETURNED', 'DELIVERY_STATUS', '반품중', 'RETURNED', 4, '반품 중', 'Y', 'admin', CURRENT_TIMESTAMP);

-- 클레임 상태 코드
INSERT INTO shopjoy_2604.sy_code (code_id, code_grp, code_label, code_value, sort_ord, code_remark, use_yn, reg_by, reg_date)
VALUES
('CLAIM_STATUS_REQUESTED', 'CLAIM_STATUS', '신청', 'REQUESTED', 1, '클레임 신청', 'Y', 'admin', CURRENT_TIMESTAMP),
('CLAIM_STATUS_APPROVED', 'CLAIM_STATUS', '승인', 'APPROVED', 2, '클레임 승인', 'Y', 'admin', CURRENT_TIMESTAMP),
('CLAIM_STATUS_PROCESSING', 'CLAIM_STATUS', '처리중', 'PROCESSING', 3, '클레임 처리 중', 'Y', 'admin', CURRENT_TIMESTAMP),
('CLAIM_STATUS_COMPLETED', 'CLAIM_STATUS', '완료', 'COMPLETED', 4, '클레임 완료', 'Y', 'admin', CURRENT_TIMESTAMP),
('CLAIM_STATUS_REJECTED', 'CLAIM_STATUS', '거절', 'REJECTED', 5, '클레임 거절', 'Y', 'admin', CURRENT_TIMESTAMP);

-- 회원 상태 코드
INSERT INTO shopjoy_2604.sy_code (code_id, code_grp, code_label, code_value, sort_ord, code_remark, use_yn, reg_by, reg_date)
VALUES
('MEMBER_STATUS_ACTIVE', 'MEMBER_STATUS', '활성', 'ACTIVE', 1, '활성 회원', 'Y', 'admin', CURRENT_TIMESTAMP),
('MEMBER_STATUS_DORMANT', 'MEMBER_STATUS', '휴면', 'DORMANT', 2, '휴면 회원', 'Y', 'admin', CURRENT_TIMESTAMP),
('MEMBER_STATUS_SUSPENDED', 'MEMBER_STATUS', '정지', 'SUSPENDED', 3, '정지된 회원', 'Y', 'admin', CURRENT_TIMESTAMP),
('MEMBER_STATUS_WITHDRAWN', 'MEMBER_STATUS', '탈퇴', 'WITHDRAWN', 4, '탈퇴한 회원', 'Y', 'admin', CURRENT_TIMESTAMP);

-- 회원 등급 코드
INSERT INTO shopjoy_2604.sy_code (code_id, code_grp, code_label, code_value, sort_ord, code_remark, use_yn, reg_by, reg_date)
VALUES
('GRADE_NORMAL', 'MEMBER_GRADE', '일반', 'NORMAL', 1, '일반 회원', 'Y', 'admin', CURRENT_TIMESTAMP),
('GRADE_SILVER', 'MEMBER_GRADE', '실버', 'SILVER', 2, '실버 회원', 'Y', 'admin', CURRENT_TIMESTAMP),
('GRADE_GOLD', 'MEMBER_GRADE', '골드', 'GOLD', 3, '골드 회원', 'Y', 'admin', CURRENT_TIMESTAMP),
('GRADE_PLATINUM', 'MEMBER_GRADE', '플래티넘', 'PLATINUM', 4, '플래티넘 회원', 'Y', 'admin', CURRENT_TIMESTAMP),
('GRADE_VIP', 'MEMBER_GRADE', 'VIP', 'VIP', 5, 'VIP 회원', 'Y', 'admin', CURRENT_TIMESTAMP);

-- 쿠폰 상태 코드
INSERT INTO shopjoy_2604.sy_code (code_id, code_grp, code_label, code_value, sort_ord, code_remark, use_yn, reg_by, reg_date)
VALUES
('COUPON_STATUS_AVAILABLE', 'COUPON_STATUS', '사용가능', 'AVAILABLE', 1, '사용 가능한 쿠폰', 'Y', 'admin', CURRENT_TIMESTAMP),
('COUPON_STATUS_USED', 'COUPON_STATUS', '사용됨', 'USED', 2, '사용된 쿠폰', 'Y', 'admin', CURRENT_TIMESTAMP),
('COUPON_STATUS_EXPIRED', 'COUPON_STATUS', '만료', 'EXPIRED', 3, '만료된 쿠폰', 'Y', 'admin', CURRENT_TIMESTAMP);

-- 에러 바우처 타입 코드
INSERT INTO shopjoy_2604.sy_code (code_id, code_grp, code_label, code_value, sort_ord, code_remark, use_yn, reg_by, reg_date)
VALUES
('ERP_VOUCHER_TYPE_SALES', 'ERP_VOUCHER_TYPE', '판매', 'SALES', 1, '판매 바우처', 'Y', 'admin', CURRENT_TIMESTAMP),
('ERP_VOUCHER_TYPE_DISCOUNT', 'ERP_VOUCHER_TYPE', '할인', 'DISCOUNT', 2, '할인 바우처', 'Y', 'admin', CURRENT_TIMESTAMP),
('ERP_VOUCHER_TYPE_RETURN', 'ERP_VOUCHER_TYPE', '반품', 'RETURN', 3, '반품 바우처', 'Y', 'admin', CURRENT_TIMESTAMP);

-- 사용자 상태 코드
INSERT INTO shopjoy_2604.sy_code (code_id, code_grp, code_label, code_value, sort_ord, code_remark, use_yn, reg_by, reg_date)
VALUES
('USER_STATUS_ACTIVE', 'USER_STATUS', '활성', 'ACTIVE', 1, '활성 사용자', 'Y', 'admin', CURRENT_TIMESTAMP),
('USER_STATUS_INACTIVE', 'USER_STATUS', '비활성', 'INACTIVE', 2, '비활성 사용자', 'Y', 'admin', CURRENT_TIMESTAMP),
('USER_STATUS_SUSPENDED', 'USER_STATUS', '정지', 'SUSPENDED', 3, '정지된 사용자', 'Y', 'admin', CURRENT_TIMESTAMP);

-- 전시 UI 타입 코드
INSERT INTO shopjoy_2604.sy_code (code_id, code_grp, code_label, code_value, sort_ord, code_remark, use_yn, reg_by, reg_date)
VALUES
('DISP_UI_TYPE_LANDING', 'DISP_UI_TYPE', '랜딩페이지', 'landing', 1, '전시 랜딩 UI', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISP_UI_TYPE_CATEGORY', 'DISP_UI_TYPE', '카테고리', 'category', 2, '전시 카테고리 UI', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISP_UI_TYPE_PROMOTION', 'DISP_UI_TYPE', '프로모션', 'promotion', 3, '전시 프로모션 UI', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISP_UI_TYPE_BRAND', 'DISP_UI_TYPE', '브랜드', 'brand', 4, '전시 브랜드 UI', 'Y', 'admin', CURRENT_TIMESTAMP);

-- 전시 위젯 타입 코드
INSERT INTO shopjoy_2604.sy_code (code_id, code_grp, code_label, code_value, sort_ord, code_remark, use_yn, reg_by, reg_date)
VALUES
('DISP_WIDGET_TYPE_IMAGE_BANNER', 'DISP_WIDGET_TYPE', '이미지 배너', 'image_banner', 1, '정적 이미지 배너 위젯', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISP_WIDGET_TYPE_PRODUCT_SLIDER', 'DISP_WIDGET_TYPE', '상품 슬라이더', 'product_slider', 2, '상품 슬라이더 위젯', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISP_WIDGET_TYPE_PRODUCT', 'DISP_WIDGET_TYPE', '상품', 'product', 3, '단일 상품 위젯', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISP_WIDGET_TYPE_COND_PRODUCT', 'DISP_WIDGET_TYPE', '조건상품', 'cond_product', 4, '조건 기반 상품 위젯', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISP_WIDGET_TYPE_CHART_BAR', 'DISP_WIDGET_TYPE', '차트 (Bar)', 'chart_bar', 5, '바 차트 위젯', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISP_WIDGET_TYPE_CHART_LINE', 'DISP_WIDGET_TYPE', '차트 (Line)', 'chart_line', 6, '라인 차트 위젯', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISP_WIDGET_TYPE_CHART_PIE', 'DISP_WIDGET_TYPE', '차트 (Pie)', 'chart_pie', 7, '파이 차트 위젯', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISP_WIDGET_TYPE_TEXT_BANNER', 'DISP_WIDGET_TYPE', '텍스트 배너', 'text_banner', 8, '텍스트 배너 위젯', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISP_WIDGET_TYPE_INFO_CARD', 'DISP_WIDGET_TYPE', '정보 카드', 'info_card', 9, '정보 카드 위젯', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISP_WIDGET_TYPE_POPUP', 'DISP_WIDGET_TYPE', '팝업', 'popup', 10, '팝업 위젯', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISP_WIDGET_TYPE_FILE', 'DISP_WIDGET_TYPE', '파일', 'file', 11, '단일 파일 위젯', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISP_WIDGET_TYPE_FILE_LIST', 'DISP_WIDGET_TYPE', '파일목록', 'file_list', 12, '파일 목록 위젯', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISP_WIDGET_TYPE_COUPON', 'DISP_WIDGET_TYPE', '쿠폰', 'coupon', 13, '쿠폰 위젯', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISP_WIDGET_TYPE_HTML_EDITOR', 'DISP_WIDGET_TYPE', 'HTML 에디터', 'html_editor', 14, 'HTML 에디터 위젯', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISP_WIDGET_TYPE_TEXTAREA', 'DISP_WIDGET_TYPE', '텍스트 영역', 'textarea', 15, '텍스트 영역 위젯', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISP_WIDGET_TYPE_MARKDOWN', 'DISP_WIDGET_TYPE', 'Markdown', 'markdown', 16, 'Markdown 위젯', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISP_WIDGET_TYPE_BARCODE', 'DISP_WIDGET_TYPE', '바코드', 'barcode', 17, '바코드 위젯', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISP_WIDGET_TYPE_QRCODE', 'DISP_WIDGET_TYPE', 'QR코드', 'qrcode', 18, 'QR코드 위젯', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISP_WIDGET_TYPE_BARCODE_QRCODE', 'DISP_WIDGET_TYPE', '바코드+QR', 'barcode_qrcode', 19, '바코드+QR 위젯', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISP_WIDGET_TYPE_VIDEO_PLAYER', 'DISP_WIDGET_TYPE', '동영상 플레이어', 'video_player', 20, '동영상 플레이어 위젯', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISP_WIDGET_TYPE_COUNTDOWN', 'DISP_WIDGET_TYPE', '카운트다운 타이머', 'countdown', 21, '카운트다운 타이머 위젯', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISP_WIDGET_TYPE_PAYMENT_WIDGET', 'DISP_WIDGET_TYPE', '결제위젯', 'payment_widget', 22, '결제 위젯', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISP_WIDGET_TYPE_APPROVAL_WIDGET', 'DISP_WIDGET_TYPE', '전자결재', 'approval_widget', 23, '전자결재 위젯', 'Y', 'admin', CURRENT_TIMESTAMP);

-- 레이아웃 타입 코드
INSERT INTO shopjoy_2604.sy_code (code_id, code_grp, code_label, code_value, sort_ord, code_remark, use_yn, reg_by, reg_date)
VALUES
('LAYOUT_TYPE_GRID', 'LAYOUT_TYPE', '그리드 레이아웃', 'grid', 1, '격자형 레이아웃 배치', 'Y', 'admin', CURRENT_TIMESTAMP),
('LAYOUT_TYPE_FLEX', 'LAYOUT_TYPE', '자유 배치', 'flex', 2, '자유 배치 레이아웃', 'Y', 'admin', CURRENT_TIMESTAMP);

-- 할인 타입 코드
INSERT INTO shopjoy_2604.sy_code (code_id, code_grp, code_label, code_value, sort_ord, code_remark, use_yn, reg_by, reg_date)
VALUES
('DISCOUNT_TYPE_FIXED', 'DISCOUNT_TYPE', '정액 할인', 'fixed', 1, '고정 금액 할인', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISCOUNT_TYPE_PERCENT', 'DISCOUNT_TYPE', '정률 할인', 'percent', 2, '퍼센트 할인', 'Y', 'admin', CURRENT_TIMESTAMP),
('DISCOUNT_TYPE_BUYX_GETY', 'DISCOUNT_TYPE', 'X개 구매 시 Y개 증정', 'buyX_getY', 3, 'X개 구매 시 Y개 증정', 'Y', 'admin', CURRENT_TIMESTAMP);
