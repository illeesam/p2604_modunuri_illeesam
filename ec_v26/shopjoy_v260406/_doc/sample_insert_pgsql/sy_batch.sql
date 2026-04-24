-- sy_batch 샘플 INSERT 데이터
-- batch_id 규칙: YYMMDDhhmmss + random(4) = VARCHAR(21)
-- cron_expr: 5자리 Unix cron (분 시 일 월 요일)

INSERT INTO shopjoy_2604.sy_batch
    (batch_id, site_id, batch_code, batch_nm, batch_desc, cron_expr, batch_cycle_cd,
     batch_run_count, batch_status_cd, batch_run_status, batch_timeout_sec, reg_by, reg_date)
VALUES
('BT000004', 'SITE000001', 'SETTLEMENT_REPORT',  '정산 리포트 생성',      '월간 정산 리포트 자동 생성 및 이메일 발송',      '0 8 1 * *',    'MONTHLY', 0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000005', 'SITE000001', 'ATTACH_CLEANUP',      '미사용 첨부파일 정리',  '30일 이상 미참조 임시 첨부파일 삭제',           '0 3 * * 0',    'WEEKLY',  0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000006', 'SITE000001', 'MEMBER_GRADE_CALC',   '회원 등급 재산정',      '월 구매 실적 기준 회원 등급 자동 재산정',       '0 4 1 * *',    'MONTHLY', 0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000007', 'SITE000001', 'CACHE_EXPIRE',        '캐시 자동 소멸',        '1년 이상 미사용 캐시 자동 소멸 처리',           '0 5 1 * *',    'MONTHLY', 0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000009', 'SITE000001', 'STATS_AGGREGATION',   '통계 데이터 집계',      '일별/주별/월별 통계 데이터 사전 집계',          '0 0 * * *',    'DAILY',   0, 'INACTIVE', 'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000001', 'SITE000001', 'ORDER_AUTO_COMPLETE',  '주문 자동 완료 처리',   '배송완료 후 7일 경과 주문 자동 완료 처리',      '0 2 * * *',    'DAILY',   0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000003', 'SITE000001', 'EVENT_STATUS_SYNC',   '이벤트 상태 동기화',    '이벤트 시작/종료일 기준 상태 자동 동기화',      '0 0 * * *',    'DAILY',   0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000002', 'SITE000001', 'COUPON_EXPIRE',        '쿠폰 만료 처리',        '만료일 경과 쿠폰 상태 변경',                   '0 1 * * *',    'DAILY',   0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000008', 'SITE000001', 'DLIV_STATUS_SYNC',    '배송조회 상태 업데이트','택배사 API 연동 배송 상태 업데이트',            '0 */2 * * *',  'HOURLY',  0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000010', 'SITE000001', 'DEV_10MINUTE_LOG',    '개발용 10분 주기 로그', '개발 환경 배치 스케줄 동작 확인용',             '*/10 * * * *', 'HOURLY',  0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP);
