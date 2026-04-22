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
