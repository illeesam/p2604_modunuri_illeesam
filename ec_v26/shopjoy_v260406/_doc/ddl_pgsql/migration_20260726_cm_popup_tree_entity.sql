-- ============================================================================
-- cm_popup — 교차 엔티티 트리 지원 컬럼 추가 (2026-07-26)
--
-- 배경: 패턴2(트리+목록)에서 트리와 목록이 서로 다른 엔티티인 경우가 있다.
--       예) 좌측 카테고리 트리(PdCategory) + 우측 상품 목록(PdProd)
--       기존 메타는 같은 엔티티만 지원해 이 조합을 표현할 수 없었다.
--
-- 규칙: tree_entity_nm 이 비어 있으면 목록 엔티티로 트리를 만든다(기존 동작 유지).
--       값이 있으면 트리는 그 엔티티로 조회하고, 선택된 노드는
--       목록 엔티티의 tree_link_field 로 걸러진다.
-- ============================================================================

ALTER TABLE shopjoy_2604.cm_popup ADD COLUMN IF NOT EXISTS tree_entity_nm  VARCHAR(100);
ALTER TABLE shopjoy_2604.cm_popup ADD COLUMN IF NOT EXISTS tree_id_field   VARCHAR(60);
ALTER TABLE shopjoy_2604.cm_popup ADD COLUMN IF NOT EXISTS tree_nm_field   VARCHAR(60);
ALTER TABLE shopjoy_2604.cm_popup ADD COLUMN IF NOT EXISTS tree_link_field VARCHAR(60);

COMMENT ON COLUMN shopjoy_2604.cm_popup.tree_entity_nm  IS '트리 엔티티명. 비우면 목록 엔티티와 동일';
COMMENT ON COLUMN shopjoy_2604.cm_popup.tree_id_field   IS '트리 엔티티의 ID 필드';
COMMENT ON COLUMN shopjoy_2604.cm_popup.tree_nm_field   IS '트리 엔티티의 표시명 필드';
COMMENT ON COLUMN shopjoy_2604.cm_popup.tree_link_field IS '목록 엔티티에서 트리 ID 를 가리키는 필드';
COMMENT ON COLUMN shopjoy_2604.cm_popup.parent_field    IS '트리 부모 필드(트리 엔티티 기준)';
COMMENT ON COLUMN shopjoy_2604.cm_popup.popup_pattern   IS '화면패턴 1:조회+목록 2:조회+트리+목록 3:트리 전용. 선택목록은 다중선택 시 자동';
COMMENT ON COLUMN shopjoy_2604.cm_popup.multi_yn        IS '다중선택 기본값. 호출부 :multi 옵션이 우선';
