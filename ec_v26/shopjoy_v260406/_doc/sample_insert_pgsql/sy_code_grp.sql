-- sy_code_grp 샘플 INSERT 데이터
-- 코드 그룹 마스터

-- 기존 코드 그룹들
INSERT INTO shopjoy_2604.sy_code_grp (code_grp_id, site_id, code_grp, grp_nm, disp_path, code_grp_desc, use_yn, reg_by, reg_date)
VALUES
('202604260001', NULL, 'ORDER_STATUS', '주문상태', 'order.status', '주문 상태 코드', 'Y', 'admin', CURRENT_TIMESTAMP),
('202604260002', NULL, 'PAYMENT_METHOD', '결제수단', 'payment.method', '결제 수단 코드', 'Y', 'admin', CURRENT_TIMESTAMP),
('202604260003', NULL, 'DELIVERY_STATUS', '배송상태', 'delivery.status', '배송 상태 코드', 'Y', 'admin', CURRENT_TIMESTAMP),
('202604260004', NULL, 'CLAIM_STATUS', '클레임상태', 'claim.status', '클레임 상태 코드', 'Y', 'admin', CURRENT_TIMESTAMP),
('202604260005', NULL, 'MEMBER_STATUS', '회원상태', 'member.status', '회원 상태 코드', 'Y', 'admin', CURRENT_TIMESTAMP),
('202604260006', NULL, 'MEMBER_GRADE', '회원등급', 'member.grade', '회원 등급 코드', 'Y', 'admin', CURRENT_TIMESTAMP),
('202604260007', NULL, 'COUPON_STATUS', '쿠폰상태', 'coupon.status', '쿠폰 상태 코드', 'Y', 'admin', CURRENT_TIMESTAMP),
('202604260008', NULL, 'ERP_VOUCHER_TYPE', 'ERP바우처타입', 'erp.voucher.type', 'ERP 바우처 타입 코드', 'Y', 'admin', CURRENT_TIMESTAMP),
('202604260009', NULL, 'USER_STATUS', '사용자상태', 'user.status', '사용자 상태 코드', 'Y', 'admin', CURRENT_TIMESTAMP);

-- 신규 전시 관련 코드 그룹
INSERT INTO shopjoy_2604.sy_code_grp (code_grp_id, site_id, code_grp, grp_nm, disp_path, code_grp_desc, use_yn, reg_by, reg_date)
VALUES
('202604260010', NULL, 'DISP_UI_TYPE', '전시UI타입', 'display.ui.type', '전시 UI 타입 코드', 'Y', 'admin', CURRENT_TIMESTAMP),
('202604260011', NULL, 'DISP_WIDGET_TYPE', '전시위젯타입', 'display.widget.type', '전시 위젯 타입 코드', 'Y', 'admin', CURRENT_TIMESTAMP),
('202604260012', NULL, 'LAYOUT_TYPE', '레이아웃타입', 'display.layout.type', '레이아웃 타입 코드', 'Y', 'admin', CURRENT_TIMESTAMP),
('202604260013', NULL, 'DISCOUNT_TYPE', '할인타입', 'promotion.discount.type', '할인 타입 코드', 'Y', 'admin', CURRENT_TIMESTAMP);
