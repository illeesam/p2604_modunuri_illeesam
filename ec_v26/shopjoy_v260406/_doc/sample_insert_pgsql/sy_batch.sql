-- ============================================================
-- sy_batch 샘플 데이터
-- ============================================================
INSERT INTO sy_batch (batch_id, batch_code, batch_name, description, cron_expr, batch_cycle, last_run, run_count, status, run_status, reg_date) VALUES
('2604110003600001', 'BATCH_CACHE_EXPIRE',    '적립금 소멸 처리',         '유효기간 만료 적립금 자동 소멸',               '0 0 1 * *',   'MONTHLY', '2026-04-01 01:00:00', 15, 'ACTIVE', 'SUCCESS', NOW()),
('2604110003600002', 'BATCH_COUPON_EXPIRE',   '쿠폰 만료 처리',           '유효기간 만료 쿠폰 상태 EXPIRED 업데이트',     '0 0 * * *',   'DAILY',   '2026-04-11 00:00:00',  45, 'ACTIVE', 'SUCCESS', NOW()),
('2604110003600003', 'BATCH_ORDER_CONFIRM',   '구매확정 자동 처리',       '배송완료 후 7일 경과 주문 자동 구매확정',       '0 2 * * *',   'DAILY',   '2026-04-11 02:00:00', 45, 'ACTIVE', 'SUCCESS', NOW()),
('2604110003600004', 'BATCH_STATS_DAILY',     '일간 통계 집계',           '전일 주문/매출 통계 집계',                      '0 3 * * *',   'DAILY',   '2026-04-11 03:00:00', 45, 'ACTIVE', 'SUCCESS', NOW()),
('2604110003600005', 'BATCH_DLIV_SYNC',       '배송 상태 동기화',         '택배사 API 연동 배송 상태 업데이트',            '0 */2 * * *', 'HOURLY',  '2026-04-11 10:00:00', 540, 'ACTIVE', 'SUCCESS', NOW()),
('2604110003600006', 'BATCH_ALARM_SEND',      '예약 알림 발송',           '발송 예정 알림 전송 처리',                      '*/10 * * * *','HOURLY',  '2026-04-11 10:50:00', 2700, 'ACTIVE', 'IDLE',    NOW()),
('2604110003600007', 'BATCH_MEMBER_GRADE',    '회원 등급 재산정',         '월별 누적 구매금액 기준 회원 등급 재산정',      '0 1 1 * *',   'MONTHLY', '2026-04-01 01:00:00', 15, 'ACTIVE', 'SUCCESS', NOW()),
('2604110003600008', 'BATCH_LOG_PURGE',       '로그 데이터 정리',         '90일 이상 오래된 로그 삭제',                    '0 4 * * 0',   'WEEKLY',  '2026-04-06 04:00:00',  6, 'ACTIVE', 'SUCCESS', NOW());
