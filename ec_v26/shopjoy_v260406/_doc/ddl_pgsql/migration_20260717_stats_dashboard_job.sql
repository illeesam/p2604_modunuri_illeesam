-- ============================================================
-- migration_20260717_stats_dashboard_job.sql
-- StatsDashboardJob 배치 등록 + STATS_AGGREGATION ACTIVE 전환
-- ============================================================

-- STATS_AGGREGATION: INACTIVE → ACTIVE
UPDATE shopjoy_2604.sy_batch
   SET batch_status_cd = 'ACTIVE',
       upd_date        = CURRENT_TIMESTAMP
 WHERE batch_code = 'STATS_AGGREGATION';

-- STATS_DASHBOARD 신규 등록 (없을 때만)
INSERT INTO shopjoy_2604.sy_batch
    (batch_id, site_id, batch_code, batch_nm, batch_desc, cron_expr, batch_cycle_cd,
     batch_run_count, batch_status_cd, batch_run_status, batch_timeout_sec, reg_by, reg_date)
SELECT 'BT000012', '2604010000000001', 'STATS_DASHBOARD',
       '대시보드 데이터 생성',
       '전일 집계값을 cm_dashboard_item_data 에 UPSERT (매일 00:05)',
       '5 0 * * *', 'DAILY',
       0, 'ACTIVE', 'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM shopjoy_2604.sy_batch WHERE batch_code = 'STATS_DASHBOARD'
);
