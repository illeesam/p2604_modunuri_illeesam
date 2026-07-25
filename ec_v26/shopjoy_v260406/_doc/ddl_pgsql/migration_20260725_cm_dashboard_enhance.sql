-- ============================================================
-- 대시보드 관리 보강 마이그레이션 (2026-07-25)
-- 1) cm_dashboard.owner_user_id 컬럼 추가 (개인화 대시보드 소유자, NULL=공용)
--    + 기존 'MY:{authId}' 규약 행 백필
-- 2) 실제 화면 위젯 정의 전수 시드
--    - DASH...001 (DashboardBoEc01): 기존 16개 item 의 이름/차트유형을 실화면과 정합
--      + 어제의 현황(dailyStats) 추가
--    - DASH...002/003 (DashboardBoEc02/03): 동일 15개 위젯 신규 등록
--      (option_json._srcItemId 로 EC01 데이터 참조 → 배치설정 시뮬레이션 즉시 동작)
--    - DASH...004 (DashboardBoAppMonitor) 신규 등록 + xview 패널 이관 + 실시간 위젯 4종 추가
-- ============================================================

-- ── 1) owner_user_id ──────────────────────────────────────────
ALTER TABLE shopjoy_2604.cm_dashboard ADD COLUMN IF NOT EXISTS owner_user_id VARCHAR(21);
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.owner_user_id IS '소유 사용자ID (개인화 대시보드, NULL=공용)';

UPDATE shopjoy_2604.cm_dashboard
   SET owner_user_id = SUBSTRING(ui_comp_nm FROM 4)
 WHERE ui_comp_nm LIKE 'MY:%' AND owner_user_id IS NULL;

-- ── 2-1) EC01 패널 정합 (이름/차트유형/크기/정렬 → 실화면 기준) ──
UPDATE shopjoy_2604.cm_dashboard_item SET item_nm='월별 매출현황',      chart_type='bar',   sort_ord=10,  panel_width=1, panel_height=2 WHERE dashboard_item_id='ITEM000000000001';
UPDATE shopjoy_2604.cm_dashboard_item SET item_nm='가입/탈퇴 현황',     chart_type='bar',   sort_ord=20,  panel_width=1, panel_height=2 WHERE dashboard_item_id='ITEM000000000002';
UPDATE shopjoy_2604.cm_dashboard_item SET item_nm='상품상세 클릭',      chart_type='line',  sort_ord=30,  panel_width=1, panel_height=2 WHERE dashboard_item_id='ITEM000000000003';
UPDATE shopjoy_2604.cm_dashboard_item SET item_nm='주문완료 현황',      chart_type='line',  sort_ord=40,  panel_width=1, panel_height=2 WHERE dashboard_item_id='ITEM000000000004';
UPDATE shopjoy_2604.cm_dashboard_item SET item_nm='채널별 매출',        chart_type='line',  sort_ord=50,  panel_width=1, panel_height=2 WHERE dashboard_item_id='ITEM000000000005';
UPDATE shopjoy_2604.cm_dashboard_item SET item_nm='핵심지표 KPI',       chart_type='kpi',   sort_ord=60,  panel_width=1, panel_height=2 WHERE dashboard_item_id='ITEM000000000006';
UPDATE shopjoy_2604.cm_dashboard_item SET item_nm='상품 TOP 7',         chart_type='bar',   sort_ord=70,  panel_width=1, panel_height=2 WHERE dashboard_item_id='ITEM000000000007';
UPDATE shopjoy_2604.cm_dashboard_item SET item_nm='판매 채널별',        chart_type='pie',   sort_ord=80,  panel_width=1, panel_height=2 WHERE dashboard_item_id='ITEM000000000016';
UPDATE shopjoy_2604.cm_dashboard_item SET item_nm='디바이스별',         chart_type='pie',   sort_ord=90,  panel_width=1, panel_height=2 WHERE dashboard_item_id='ITEM000000000008';
UPDATE shopjoy_2604.cm_dashboard_item SET item_nm='시간대별',           chart_type='pie',   sort_ord=100, panel_width=1, panel_height=2 WHERE dashboard_item_id='ITEM000000000009';
UPDATE shopjoy_2604.cm_dashboard_item SET item_nm='지역별 매출',        chart_type='bar',   sort_ord=110, panel_width=1, panel_height=2 WHERE dashboard_item_id='ITEM000000000010';
UPDATE shopjoy_2604.cm_dashboard_item SET item_nm='시간대별 주문 추이', chart_type='line',  sort_ord=120, panel_width=1, panel_height=2 WHERE dashboard_item_id='ITEM000000000011';
UPDATE shopjoy_2604.cm_dashboard_item SET item_nm='영업 지표',          chart_type='radar', sort_ord=130, panel_width=1, panel_height=2 WHERE dashboard_item_id='ITEM000000000012';
UPDATE shopjoy_2604.cm_dashboard_item SET item_nm='경제 수준별 매출',   chart_type='bar',   sort_ord=140, panel_width=1, panel_height=2 WHERE dashboard_item_id='ITEM000000000013';
UPDATE shopjoy_2604.cm_dashboard_item SET item_nm='배송 조건별 매출',   chart_type='pie',   sort_ord=150, panel_width=1, panel_height=2 WHERE dashboard_item_id='ITEM000000000014';

INSERT INTO shopjoy_2604.cm_dashboard_item
    (dashboard_item_id, site_id, dashboard_id, item_key, item_nm, chart_type, sort_ord,
     panel_width, panel_height, realtime_yn, use_yn, reg_by, reg_date)
VALUES
    ('ITEM000000000017','2604010000000001','DASH000000000001','dailyStats','어제의 현황(일별 지표)','kpi',5,4,1,'Y','Y','SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (dashboard_item_id) DO NOTHING;

-- ── 2-2) EC02 (일별 운영 현황) 위젯 15종 — EC01 데이터 참조(_srcItemId) ──
INSERT INTO shopjoy_2604.cm_dashboard_item
    (dashboard_item_id, site_id, dashboard_id, item_key, item_nm, chart_type, sort_ord,
     panel_width, panel_height, realtime_yn, use_yn, option_json, reg_by, reg_date)
VALUES
    ('ITEM000000000201','2604010000000001','DASH000000000002','COMP0101','월별 매출현황','bar',10,1,2,'N','Y','{"_srcItemId":"ITEM000000000001"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000202','2604010000000001','DASH000000000002','COMP0102','가입/탈퇴 현황','bar',20,1,2,'N','Y','{"_srcItemId":"ITEM000000000002"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000203','2604010000000001','DASH000000000002','COMP0103','상품상세 클릭','line',30,1,2,'N','Y','{"_srcItemId":"ITEM000000000003"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000204','2604010000000001','DASH000000000002','COMP0104','주문완료 현황','line',40,1,2,'N','Y','{"_srcItemId":"ITEM000000000004"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000205','2604010000000001','DASH000000000002','COMP0201','채널별 매출','line',50,1,2,'N','Y','{"_srcItemId":"ITEM000000000005"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000206','2604010000000001','DASH000000000002','COMP0202','핵심지표 KPI','kpi',60,1,2,'N','Y','{"_srcItemId":"ITEM000000000006"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000207','2604010000000001','DASH000000000002','COMP0203','상품 TOP 7','bar',70,1,2,'N','Y','{"_srcItemId":"ITEM000000000007"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000208','2604010000000001','DASH000000000002','COMP0204','판매 채널별','pie',80,1,2,'N','Y','{"_srcItemId":"ITEM000000000016"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000209','2604010000000001','DASH000000000002','COMP0301','디바이스별','pie',90,1,2,'N','Y','{"_srcItemId":"ITEM000000000008"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000210','2604010000000001','DASH000000000002','COMP0302','시간대별','pie',100,1,2,'N','Y','{"_srcItemId":"ITEM000000000009"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000211','2604010000000001','DASH000000000002','COMP0303','지역별 매출','bar',110,1,2,'N','Y','{"_srcItemId":"ITEM000000000010"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000212','2604010000000001','DASH000000000002','COMP0304','시간대별 주문 추이','line',120,1,2,'N','Y','{"_srcItemId":"ITEM000000000011"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000213','2604010000000001','DASH000000000002','COMP0401','영업 지표','radar',130,1,2,'N','Y','{"_srcItemId":"ITEM000000000012"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000214','2604010000000001','DASH000000000002','COMP0402','경제 수준별 매출','bar',140,1,2,'N','Y','{"_srcItemId":"ITEM000000000013"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000215','2604010000000001','DASH000000000002','COMP0403','배송 조건별 매출','pie',150,1,2,'N','Y','{"_srcItemId":"ITEM000000000014"}','SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (dashboard_item_id) DO NOTHING;

-- ── 2-3) EC03 (실시간 모니터링) 위젯 15종 — EC01 데이터 참조(_srcItemId) ──
INSERT INTO shopjoy_2604.cm_dashboard_item
    (dashboard_item_id, site_id, dashboard_id, item_key, item_nm, chart_type, sort_ord,
     panel_width, panel_height, realtime_yn, use_yn, option_json, reg_by, reg_date)
VALUES
    ('ITEM000000000301','2604010000000001','DASH000000000003','COMP0101','월별 매출현황','bar',10,1,2,'N','Y','{"_srcItemId":"ITEM000000000001"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000302','2604010000000001','DASH000000000003','COMP0102','가입/탈퇴 현황','bar',20,1,2,'N','Y','{"_srcItemId":"ITEM000000000002"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000303','2604010000000001','DASH000000000003','COMP0103','상품상세 클릭','line',30,1,2,'N','Y','{"_srcItemId":"ITEM000000000003"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000304','2604010000000001','DASH000000000003','COMP0104','주문완료 현황','line',40,1,2,'N','Y','{"_srcItemId":"ITEM000000000004"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000305','2604010000000001','DASH000000000003','COMP0201','채널별 매출','line',50,1,2,'N','Y','{"_srcItemId":"ITEM000000000005"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000306','2604010000000001','DASH000000000003','COMP0202','핵심지표 KPI','kpi',60,1,2,'N','Y','{"_srcItemId":"ITEM000000000006"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000307','2604010000000001','DASH000000000003','COMP0203','상품 TOP 7','bar',70,1,2,'N','Y','{"_srcItemId":"ITEM000000000007"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000308','2604010000000001','DASH000000000003','COMP0204','판매 채널별','pie',80,1,2,'N','Y','{"_srcItemId":"ITEM000000000016"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000309','2604010000000001','DASH000000000003','COMP0301','디바이스별','pie',90,1,2,'N','Y','{"_srcItemId":"ITEM000000000008"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000310','2604010000000001','DASH000000000003','COMP0302','시간대별','pie',100,1,2,'N','Y','{"_srcItemId":"ITEM000000000009"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000311','2604010000000001','DASH000000000003','COMP0303','지역별 매출','bar',110,1,2,'N','Y','{"_srcItemId":"ITEM000000000010"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000312','2604010000000001','DASH000000000003','COMP0304','시간대별 주문 추이','line',120,1,2,'N','Y','{"_srcItemId":"ITEM000000000011"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000313','2604010000000001','DASH000000000003','COMP0401','영업 지표','radar',130,1,2,'N','Y','{"_srcItemId":"ITEM000000000012"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000314','2604010000000001','DASH000000000003','COMP0402','경제 수준별 매출','bar',140,1,2,'N','Y','{"_srcItemId":"ITEM000000000013"}','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000315','2604010000000001','DASH000000000003','COMP0403','배송 조건별 매출','pie',150,1,2,'N','Y','{"_srcItemId":"ITEM000000000014"}','SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (dashboard_item_id) DO NOTHING;

-- ── 2-4) App모니터대시보드 등록 + xview 이관 + 실시간 위젯 4종 ──
INSERT INTO shopjoy_2604.cm_dashboard
    (dashboard_id, site_id, dashboard_nm, ui_comp_nm, layout_cols, sort_ord, use_yn, remark, reg_by, reg_date)
VALUES
    ('DASH000000000004','2604010000000001','App 모니터링','DashboardBoAppMonitor',4,4,'Y',
     'API 트랜잭션 실시간 모니터링 (X-View 히트맵/호출량/응답시간)','SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (dashboard_id) DO NOTHING;

UPDATE shopjoy_2604.cm_dashboard_item
   SET dashboard_id='DASH000000000004', item_nm='X-View 실시간 트랜잭션 히트맵',
       chart_type='scatter', sort_ord=10, panel_width=4, panel_height=2, realtime_yn='Y'
 WHERE dashboard_item_id='ITEM000000000015';

INSERT INTO shopjoy_2604.cm_dashboard_item
    (dashboard_item_id, site_id, dashboard_id, item_key, item_nm, chart_type, sort_ord,
     panel_width, panel_height, realtime_yn, use_yn, reg_by, reg_date)
VALUES
    ('ITEM000000000018','2604010000000001','DASH000000000004','topUrl','API 호출량 Top10','bar',20,2,2,'Y','Y','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000019','2604010000000001','DASH000000000004','rtTop','API 응답시간 Top10','bar',30,2,2,'Y','Y','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000020','2604010000000001','DASH000000000004','statusPie','트랜잭션 상태 분포','pie',40,2,2,'Y','Y','SYSTEM',CURRENT_TIMESTAMP),
    ('ITEM000000000021','2604010000000001','DASH000000000004','rtTrend','응답시간 추이','line',50,4,2,'Y','Y','SYSTEM',CURRENT_TIMESTAMP)
ON CONFLICT (dashboard_item_id) DO NOTHING;
