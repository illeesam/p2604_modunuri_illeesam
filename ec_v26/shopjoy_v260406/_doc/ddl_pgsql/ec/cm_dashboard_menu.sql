-- ============================================================================
-- cm_dashboard_menu — 사용자별 대시보드 좌측메뉴 트리 (2026-07-26)
--
-- 왜 별도 테이블인가:
--   좌측메뉴 트리에는 대시보드가 아닌 <b>폴더 노드</b>가 들어간다. 폴더는 cm_dashboard 의
--   행이 아니므로 cm_dashboard 에 parent/순서를 두는 방식으로는 표현할 수 없다.
--   또 "메뉴에 넣는다/뺀다" 는 대시보드의 속성이 아니라 <b>사용자별 메뉴 구성</b>이다.
--   같은 대시보드를 A 는 메뉴에 두고 B 는 빼는 것이 자연스럽다.
--
-- 구조:
--   node_type_cd = 'FOLDER' → node_nm 사용, dashboard_id 없음
--   node_type_cd = 'ITEM'   → dashboard_id 참조 (표시명은 대시보드명을 따라감)
--   parent_node_id 가 NULL 이면 최상위. sort_ord 는 같은 부모 안에서의 순서.
--
-- 저장 방식: 화면에서 트리를 다 만든 뒤 [저장] → 해당 사용자 노드를 전부 지우고 다시 넣는다
--   (부분 갱신보다 단순하고, 순서/부모가 한 번에 정합하게 맞는다).
--
-- 폴백: 이 테이블에 내 노드가 하나도 없으면 좌측메뉴는 "볼 수 있는 대시보드 전체"를
--   평면으로 보여준다. 즉 한 번도 설정하지 않은 사용자는 기존과 동일하게 동작한다.
-- ============================================================================

CREATE TABLE IF NOT EXISTS shopjoy_2604.cm_dashboard_menu (
    dashboard_menu_id    VARCHAR(21)  NOT NULL,
    reg_site_id         VARCHAR(21)  NOT NULL,
    owner_user_id   VARCHAR(30)  NOT NULL,          -- 이 메뉴 트리의 주인(sy_user.user_id)
    parent_node_id  VARCHAR(21),                    -- 상위 노드. NULL 이면 최상위
    node_type_cd    VARCHAR(10)  NOT NULL,          -- FOLDER / ITEM
    node_nm         VARCHAR(100),                   -- FOLDER 표시명
    dashboard_id    VARCHAR(21),                    -- ITEM 이 가리키는 대시보드
    sort_ord        INTEGER      DEFAULT 0,         -- 같은 부모 안에서의 순서
    use_yn          CHAR(1)      DEFAULT 'Y',
    remark          VARCHAR(500),
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    CONSTRAINT cm_dashboard_menu_pk_dashboard_menu_id PRIMARY KEY (dashboard_menu_id)
);

COMMENT ON TABLE  shopjoy_2604.cm_dashboard_menu               IS '사용자별 대시보드 좌측메뉴 트리 (폴더 + 대시보드 아이템)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_menu.dashboard_menu_id  IS '메뉴노드ID';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_menu.reg_site_id       IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_menu.owner_user_id IS '메뉴 트리 소유자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_menu.parent_node_id IS '상위 메뉴노드ID. NULL 이면 최상위';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_menu.node_type_cd  IS '노드유형 (FOLDER:폴더 / ITEM:대시보드)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_menu.node_nm       IS '폴더 표시명 (ITEM 은 대시보드명을 따라감)';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_menu.dashboard_id  IS 'ITEM 이 가리키는 대시보드ID';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_menu.sort_ord      IS '같은 부모 안에서의 정렬순서';
COMMENT ON COLUMN shopjoy_2604.cm_dashboard_menu.use_yn        IS '사용여부';

    ON shopjoy_2604.cm_dashboard_menu (site_id, owner_user_id, sort_ord);
    ON shopjoy_2604.cm_dashboard_menu (parent_node_id);

-- ── 이전 방식 정리 ─────────────────────────────────────────────────────────
-- cm_dashboard 의 menu_show_yn / menu_parent_id 는 이 테이블로 대체된다.
--   · 메뉴에 안 보이기  = 트리에 노드를 두지 않으면 된다 (menu_show_yn 불필요)
--   · 깊이/상위        = parent_node_id 로 표현 (menu_parent_id 불필요, 폴더도 지원)
-- 두 방식을 함께 두면 반드시 어긋나므로 컬럼을 제거한다.
ALTER TABLE shopjoy_2604.cm_dashboard DROP COLUMN IF EXISTS menu_show_yn;
ALTER TABLE shopjoy_2604.cm_dashboard DROP COLUMN IF EXISTS menu_parent_id;
CREATE INDEX cm_dashboard_menu_ix01_dashboard_id ON shopjoy_2604.cm_dashboard_menu USING btree (dashboard_id);
CREATE INDEX cm_dashboard_menu_ix02_owner_user_id ON shopjoy_2604.cm_dashboard_menu USING btree (owner_user_id);
CREATE INDEX cm_dashboard_menu_ix03_parent_node_id ON shopjoy_2604.cm_dashboard_menu USING btree (parent_node_id);
