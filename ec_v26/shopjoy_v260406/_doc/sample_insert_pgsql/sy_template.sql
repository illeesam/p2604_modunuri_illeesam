-- ============================================================
-- sy_template 샘플 데이터
-- ============================================================
INSERT INTO sy_template (template_id, template_type, template_code, template_name, subject, content, sample_params, use_yn, reg_date) VALUES
('2604110003500001', 'EMAIL', 'TPL_ORDER_COMPLETE',  '주문완료 이메일',      '[ShopJoy] 주문이 완료되었습니다',        '<p>{{member_name}}님, {{order_id}} 주문이 완료되었습니다.</p><p>총 결제금액: {{pay_price}}원</p>',         '{"member_name":"홍길동","order_id":"2604110002000001","pay_price":"49,000"}', 'Y', NOW()),
('2604110003500002', 'EMAIL', 'TPL_SHIP_START',      '배송시작 이메일',      '[ShopJoy] 상품이 발송되었습니다',        '<p>{{member_name}}님, 주문하신 상품이 발송되었습니다.</p><p>운송장: {{tracking_no}}</p>',              '{"member_name":"홍길동","tracking_no":"384729103847"}', 'Y', NOW()),
('2604110003500003', 'EMAIL', 'TPL_CLAIM_COMPLETE',  '클레임완료 이메일',    '[ShopJoy] 클레임 처리가 완료되었습니다','<p>{{member_name}}님, 클레임이 처리되었습니다.</p><p>환불금액: {{refund_amount}}원</p>',             '{"member_name":"홍길동","refund_amount":"49,000"}', 'Y', NOW()),
('2604110003500004', 'SMS',   'TPL_SMS_ORDER',       '주문완료 SMS',         NULL,                                     '[ShopJoy] {{member_name}}님 주문이 완료되었습니다. 주문번호: {{order_id}}',                           '{"member_name":"홍길동","order_id":"2604110002000001"}', 'Y', NOW()),
('2604110003500005', 'SMS',   'TPL_SMS_SHIP',        '배송시작 SMS',         NULL,                                     '[ShopJoy] 상품이 발송되었습니다. 운송장: {{tracking_no}} ({{courier}})',                              '{"tracking_no":"384729103847","courier":"CJ대한통운"}', 'Y', NOW()),
('2604110003500006', 'KAKAO', 'TPL_KAKAO_COUPON',    '쿠폰 발급 카카오 알림', NULL,                                    '{{member_name}}님께 {{coupon_name}} 쿠폰이 발급되었습니다.\n유효기간: {{end_date}}까지',              '{"member_name":"홍길동","coupon_name":"봄맞이 5,000원 할인","end_date":"2026-04-30"}', 'Y', NOW()),
('2604110003500007', 'PUSH',  'TPL_PUSH_PROMOTION',  '프로모션 푸시',         NULL,                                    '{{title}}\n{{message}}',                                                                              '{"title":"봄맞이 특가","message":"최대 20% 할인!"}', 'Y', NOW());
