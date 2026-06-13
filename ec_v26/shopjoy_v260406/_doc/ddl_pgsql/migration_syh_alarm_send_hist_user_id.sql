-- ============================================================
-- syh_alarm_send_hist 에 수신자 사용자ID(user_id) 컬럼 추가
-- ------------------------------------------------------------
-- 배경: 시스템알림 발송이력은 수신자 회원ID(member_id)만 보유했으나,
--       관리자(사용자) 대상 알림 발송 이력의 수신자도 추적할 수 있도록
--       user_id(sy_user.user_id) 컬럼을 추가한다.
-- 적용: 운영 DB 에 1회 실행 (idempotent — IF NOT EXISTS).
-- 작성: 2026-06-13
-- ============================================================

ALTER TABLE shopjoy_2604.syh_alarm_send_hist
    ADD COLUMN IF NOT EXISTS user_id VARCHAR(21);

COMMENT ON COLUMN shopjoy_2604.syh_alarm_send_hist.user_id IS '수신자 사용자ID (sy_user.user_id)';
