-- ============================================================
-- 사용자 대시보드 공유범위 지원 (2026-07-26)
--  - share_scope_cd : ALL(전체) / DEPT(부서) / USER(지정사용자) / ME(나만)
--  - share_dept_id  : DEPT 일 때 대상 부서
--  - share_user_ids : USER 일 때 대상 사용자 (^구분 예: ^US001^US002^)
-- 기존 개인 대시보드는 ME(나만)로 백필 — 의도치 않은 공개 방지
-- ============================================================

ALTER TABLE shopjoy_2604.cm_dashboard ADD COLUMN IF NOT EXISTS share_scope_cd VARCHAR(10);
ALTER TABLE shopjoy_2604.cm_dashboard ADD COLUMN IF NOT EXISTS share_dept_id  VARCHAR(21);
ALTER TABLE shopjoy_2604.cm_dashboard ADD COLUMN IF NOT EXISTS share_user_ids VARCHAR(2000);

COMMENT ON COLUMN shopjoy_2604.cm_dashboard.share_scope_cd IS '공유범위 — ALL:전체 / DEPT:부서 / USER:지정사용자 / ME:나만 (NULL=ALL)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.share_dept_id  IS '공유 부서ID (share_scope_cd=DEPT 일 때)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard.share_user_ids IS '공유 사용자ID 목록 (share_scope_cd=USER 일 때, ^구분)';

UPDATE shopjoy_2604.cm_dashboard
   SET share_scope_cd = 'ME'
 WHERE owner_user_id IS NOT NULL AND share_scope_cd IS NULL;
