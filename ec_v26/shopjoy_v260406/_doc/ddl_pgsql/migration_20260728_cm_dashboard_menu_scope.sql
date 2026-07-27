-- ============================================================================
-- cm_dashboard_menu — 공용(SYS) 메뉴 트리 지원 (2026-07-28)
--
-- 지금까지 이 테이블은 개인 대시보드 트리(사용자별)만 담았다.
-- 좌측 `대시보드` 그룹(공용 대시보드)도 같은 방식으로 폴더·순서를 구성하려는데,
-- 공용 메뉴는 성격이 다르다 — 관리자가 한 번 짜면 전원에게 같게 보인다.
--
--   menu_scope_cd = 'USER' : 사용자별 트리. owner_user_id 필수. 좌측 `사용자 대시보드` 그룹
--   menu_scope_cd = 'SYS'  : 사이트 공통 트리. owner_user_id 없음.  좌측 `대시보드` 그룹
--
-- 테이블을 새로 파지 않는 이유: 노드 구조(폴더/아이템·부모·순서)와 저장 방식(전체 삭제 후
-- 재삽입)이 완전히 같다. 다른 것은 "누구의 트리인가" 하나뿐이라 컬럼 하나로 갈린다.
-- ============================================================================

ALTER TABLE shopjoy_2604.cm_dashboard_menu
    ADD COLUMN IF NOT EXISTS menu_scope_cd VARCHAR(10);

-- 기존 행은 전부 사용자별 트리였다
UPDATE shopjoy_2604.cm_dashboard_menu SET menu_scope_cd = 'USER' WHERE menu_scope_cd IS NULL;

ALTER TABLE shopjoy_2604.cm_dashboard_menu
    ALTER COLUMN menu_scope_cd SET DEFAULT 'USER';
ALTER TABLE shopjoy_2604.cm_dashboard_menu
    ALTER COLUMN menu_scope_cd SET NOT NULL;

-- SYS 노드는 주인이 없다 → NOT NULL 해제
ALTER TABLE shopjoy_2604.cm_dashboard_menu
    ALTER COLUMN owner_user_id DROP NOT NULL;

COMMENT ON COLUMN shopjoy_2604.cm_dashboard_menu.menu_scope_cd  IS
  '메뉴범위 (USER:사용자별 트리 / SYS:사이트 공통 트리)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_menu.owner_user_id  IS
  '메뉴 트리 소유자 (sy_user.user_id). SYS 범위는 NULL';

-- 조회는 항상 (사이트 + 범위) 로 먼저 좁힌다
DROP INDEX IF EXISTS shopjoy_2604.ix_cm_dashboard_menu_owner;
CREATE INDEX IF NOT EXISTS ix_cm_dashboard_menu_scope
    ON shopjoy_2604.cm_dashboard_menu (site_id, menu_scope_cd, owner_user_id, sort_ord);
