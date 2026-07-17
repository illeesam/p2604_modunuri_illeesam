-- ============================================================
-- migration_20260717_refund_auto_job.sql
-- REFUND_AUTO 배치 신규 등록
-- ============================================================

INSERT INTO shopjoy_2604.sy_batch
    (batch_id, site_id, batch_code, batch_nm, batch_desc, cron_expr, batch_cycle_cd,
     batch_run_count, batch_status_cd, batch_run_status, batch_timeout_sec, reg_by, reg_date)
SELECT 'BT000013', '2604010000000001', 'REFUND_AUTO',
       '환불 자동 처리',
       '장기 PENDING 환불 자동 FAILED + 클레임 완료 후 환불 자동 COMPLT (매일 03:00)',
       '0 3 * * *', 'DAILY',
       0, 'ACTIVE', 'IDLE', 300, 'SYSTEM', CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM shopjoy_2604.sy_batch WHERE batch_code = 'REFUND_AUTO'
);
