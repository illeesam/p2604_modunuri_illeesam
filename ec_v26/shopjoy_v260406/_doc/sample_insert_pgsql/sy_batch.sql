-- sy_batch 샘플 INSERT 데이터
-- batch_id 규칙: YYMMDDhhmmss + random(4) = VARCHAR(21)
-- cron_expr: 5자리 Unix cron (분 시 일 월 요일)

INSERT INTO shopjoy_2604.sy_batch
    (batch_id, site_id, batch_code, batch_nm, batch_desc, cron_expr, batch_cycle_cd,
     batch_run_count, batch_status_cd, batch_run_status, batch_timeout_sec, reg_by, reg_date)
VALUES
('BT000004', '2604010000000001', 'SETTLEMENT_REPORT',  '정산 리포트 생성',      '월간 정산 리포트 자동 생성 및 이메일 발송',      '0 8 1 * *',    'MONTHLY', 0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000005', '2604010000000001', 'ATTACH_CLEANUP',      '미사용 첨부파일 정리',  '30일 이상 미참조 임시 첨부파일 삭제',           '0 3 * * 0',    'WEEKLY',  0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000006', '2604010000000001', 'MEMBER_GRADE_CALC',   '회원 등급 재산정',      '월 구매 실적 기준 회원 등급 자동 재산정',       '0 4 1 * *',    'MONTHLY', 0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000007', '2604010000000001', 'CACHE_EXPIRE',        '캐시 자동 소멸',        '1년 이상 미사용 캐시 자동 소멸 처리',           '0 5 1 * *',    'MONTHLY', 0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000009', '2604010000000001', 'STATS_AGGREGATION',   '통계 데이터 집계',      '일별/주별/월별 통계 데이터 사전 집계',          '0 0 * * *',    'DAILY',   0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000012', '2604010000000001', 'PROMO_TARGET_EXPAND', '프로모션 대상상품 확대', '프로모션 비활성/만료 상품 자동 대체 보충',     '0 3 * * *',    'DAILY',   0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000001', '2604010000000001', 'ORDER_AUTO_COMPLETE',  '주문 자동 완료 처리',   '배송완료 후 7일 경과 주문 자동 완료 처리',      '0 2 * * *',    'DAILY',   0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000003', '2604010000000001', 'EVENT_STATUS_SYNC',   '이벤트 상태 동기화',    '이벤트 시작/종료일 기준 상태 자동 동기화',      '0 0 * * *',    'DAILY',   0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000002', '2604010000000001', 'COUPON_EXPIRE',        '쿠폰 만료 처리',        '만료일 경과 쿠폰 상태 변경',                   '0 1 * * *',    'DAILY',   0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000008', '2604010000000001', 'DLIV_STATUS_SYNC',    '배송조회 상태 업데이트','택배사 API 연동 배송 상태 업데이트',            '0 */2 * * *',  'HOURLY',  0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000010', '2604010000000001', 'DEV_10MINUTE_LOG',    '개발용 10분 주기 로그', '개발 환경 배치 스케줄 동작 확인용',             '*/10 * * * *', 'HOURLY',  0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000011', '2604010000000001', 'PROD_SALE_PLAN_SYNC','상품 판매계획 동기화',  '판매계획 시작/종료 시각 기준 pd_prod 가격 자동 반영', '0 * * * *',   'HOURLY',  0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000013', '2604010000000001', 'REFUND_AUTO',        '환불 자동 처리',        '장기 PENDING 환불 자동 FAILED + 클레임 완료 후 환불 자동 COMPLT', '0 3 * * *',    'DAILY',   0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000014', '2604010000000001', 'MSG_RETRY',          '발송 실패 재시도',      'FAILED 이메일/SMS/카카오 메시지 자동 재발송',                     '0 */2 * * *', 'HOURLY',  0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000015', '2604010000000001', 'MSG_LOG_CLEANUP',    '발송 로그 정리',        '6개월 이상 된 이메일/메시지/알림 발송 이력 삭제',                 '0 4 1 * *',   'MONTHLY', 0, 'ACTIVE',   'IDLE', 600, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000016', '2604010000000001', 'SY_SEND_EMAIL',      '이메일 배치 발송',      '휴면 예정 안내 등 대상자에게 이메일 자동 발송',                   '0 9 * * *',    'DAILY',   0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000017', '2604010000000001', 'SY_SEND_MSG',        'SMS/카카오 배치 발송',  '쿠폰 만료 D-3 등 대상자에게 카카오/SMS 자동 발송',                '0 10 * * *',   'DAILY',   0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000018', '2604010000000001', 'SY_SEND_ALARM',      '관리자 알림 배치',      '미처리 주문/클레임 경보를 관리자 시스템 알림으로 발송',            '0 8 * * *',    'DAILY',   0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000019', '2604010000000001', 'STATS_DASHBOARD',    '대시보드 데이터 생성',  '전일 집계값을 cm_dashboard_item_data에 UPSERT',                    '5 0 * * *',    'DAILY',   0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP),
('BT000020', '2604010000000001', 'MEMBER_DORMANT',    '회원 휴면 전환',        '1년 이상 미로그인 ACTIVE 회원을 DORMANT로 자동 전환',               '0 1 * * *',    'DAILY',   0, 'ACTIVE',   'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP);
