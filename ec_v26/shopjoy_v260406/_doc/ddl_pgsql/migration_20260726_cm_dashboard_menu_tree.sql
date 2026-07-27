-- ============================================================================
-- cm_dashboard — 좌측메뉴 트리(깊이) 지원 (2026-07-26)
--
-- 배경: 개인 대시보드가 늘어나면 좌측메뉴가 평평한 목록으로 길어진다.
--       상위 대시보드를 지정해 한 단계 접어 넣을 수 있게 한다.
--
-- menu_parent_id : 좌측메뉴에서의 상위 대시보드. NULL 이면 최상위.
--                  같은 소유자의 대시보드만 상위로 지정할 수 있다(서비스에서 강제).
--
-- 정렬설정 탭에서 ▲▼ 로 순서, ◀▶ 로 깊이(상위 지정/해제)를 조절하고 저장하면
--   sort_ord      : 화면에 보이는 순서대로 10 단위 재부여
--   menu_parent_id: 바로 위 형제/부모로 설정
-- 가 함께 저장된다.
--
-- 깊이는 1단계(부모-자식)까지만 쓰는 것을 권장한다 — 개인 대시보드는 보통 3~5개고
-- 좌측메뉴는 이미 '사용자대시보드' 그룹 아래이므로, 더 깊어지면 찾기가 어려워진다.
-- ============================================================================

ALTER TABLE shopjoy_2604.cm_dashboard ADD COLUMN IF NOT EXISTS menu_parent_id VARCHAR(21);

COMMENT ON COLUMN shopjoy_2604.cm_dashboard.menu_parent_id IS
  '좌측메뉴 상위 대시보드ID. NULL 이면 최상위. 정렬설정 탭에서 ◀▶ 로 조절';

CREATE INDEX IF NOT EXISTS ix_cm_dashboard_menu_parent
  ON shopjoy_2604.cm_dashboard (menu_parent_id);
