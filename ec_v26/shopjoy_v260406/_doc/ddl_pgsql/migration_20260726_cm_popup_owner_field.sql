-- ============================================================================
-- cm_popup — 소유자 한정(owner_field) 추가 + FO "내 주문 선택" 팝업 (2026-07-26)
--
-- 배경: 공통팝업에는 "내 것만" 을 표현할 방법이 없어, 회원 본인 데이터를 고르는 화면은
--       전용 모달(OrderPickModal + foApiSvc.myOrder)을 따로 만들어야 했다.
--
-- owner_field: 지정하면 CmPopupPickService.buildWhere 가 무조건
--              AND e.{owner_field} = :__ownerId  (= SecurityUtil 로그인 사용자)
--              를 붙인다. 클라이언트 파라미터로 끌 수 없고, 미로그인이면 거절한다.
--
--              이로써 FO 노출 조건이 둘로 정리된다.
--                (1) 공개 카탈로그 엔티티            — FO_ALLOWED_ENTITIES
--                (2) owner_field 로 소유자를 한정   — 본인 것만 나오므로 안전
--
-- 주의: order 팝업(전체 주문, BO 전용)과 myOrder 팝업(본인 주문, FO)은 별개로 둔다.
--       하나를 겸용하면 sys_scope 하나 잘못 켰을 때 전체 주문이 새어나간다.
-- ============================================================================

ALTER TABLE shopjoy_2604.cm_popup ADD COLUMN IF NOT EXISTS owner_field VARCHAR(50);

COMMENT ON COLUMN shopjoy_2604.cm_popup.owner_field IS
  '소유자 격리 필드명. 지정하면 로그인 본인 것만 조회 (예: OdOrder.memberId). FO 노출 허용 조건 중 하나';

-- ── FO 내 주문 선택 팝업 ─────────────────────────────────────────────────────
INSERT INTO shopjoy_2604.cm_popup
  (popup_id, site_id, popup_code, popup_nm, popup_pattern, entity_nm,
   id_field, nm_field, site_field, owner_field, order_by,
   multi_yn, sys_scope, paging_yn, page_size, modal_width, use_yn, sort_ord, remark,
   reg_by, reg_date, upd_by, upd_date)
SELECT
  'PO2607260000000101', '2604010000000001', 'myOrder', '내 주문 선택', 1, 'OdOrder',
  'orderId', 'orderId', 'siteId', 'memberId', 'e.orderDate DESC',
  'N', '^FO^', 'Y', 10, '820px', 'Y', 15,
  '로그인 회원 본인 주문만. FO 문의하기의 주문번호 선택에 사용',
  'SYSTEM', now(), 'SYSTEM', now()
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.cm_popup WHERE popup_code = 'myOrder');

-- 조회항목/목록컬럼 — order 팝업과 동일 구성 (주문자명은 본인이므로 제외)
INSERT INTO shopjoy_2604.cm_popup_item
  (popup_item_id, site_id, popup_id, field_nm, field_label, field_type_cd,
   search_yn, search_type_cd, list_yn, tree_label_yn, col_align, link_yn, sort_ord, use_yn,
   reg_by, reg_date, upd_by, upd_date)
SELECT v.item_id, '2604010000000001', 'PO2607260000000101',
       v.field_nm, v.field_label, v.field_type_cd,
       v.search_yn, v.search_type_cd, v.list_yn, 'N', v.col_align, v.link_yn, v.sort_ord, 'Y',
       'SYSTEM', now(), 'SYSTEM', now()
  FROM (VALUES
    ('POI2607260000000101', 'orderId',       '주문번호', 'TEXT',   'Y', 'LIKE', 'Y', NULL,     'Y', 10),
    ('POI2607260000000102', 'orderDate',     '주문일시', 'DATE',   'N', NULL,   'Y', 'center', 'N', 20),
    ('POI2607260000000103', 'totalAmt',      '주문금액', 'NUMBER', 'N', NULL,   'Y', 'right',  'N', 30),
    ('POI2607260000000104', 'orderStatusCd', '상태',     'CODE',   'Y', 'EQ',   'Y', 'center', 'N', 40)
  ) AS v(item_id, field_nm, field_label, field_type_cd, search_yn, search_type_cd, list_yn, col_align, link_yn, sort_ord)
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.cm_popup_item WHERE popup_item_id = v.item_id);
